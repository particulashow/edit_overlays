const FAV_KEY = "overlayTesterFavs_v1";
const INST_KEY = "overlayTesterInstances_v2";

const ANIMS_BASE = [
  {
    id: "poll4_abcd",
    category: "Votações",
    name: "Poll 4 (A/B/C/D)",
    desc: "Pergunta + 4 opções. Votos A/B/C/D via wordcloud.",
    baseUrl: "https://votacoes.vercel.app/",
    tags: ["A/B/C/D", "wordcloud"],
    params: [
      { key: "title", label: "Pergunta", def: "Qual a tua cor preferida?" },
      { key: "a", label: "Opção A", def: "Azul" },
      { key: "b", label: "Opção B", def: "Vermelho" },
      { key: "c", label: "Opção C", def: "Verde" },
      { key: "d", label: "Opção D", def: "Amarelo" }
    ],
    build: (v, domain) => {
      const q = new URLSearchParams();
      q.set("title", v.title);
      q.set("a", v.a); q.set("b", v.b); q.set("c", v.c); q.set("d", v.d);
      q.set("domain", domain);
      return q;
    },
    resetWords: () => "A,B,C,D"
  },

  {
    id: "quizz_relampago_2",
    category: "Quizzes",
    name: "Quizz Relâmpago (2 opções)",
    desc: "Pergunta + 2 respostas. Votos A/B via wordcloud.",
    baseUrl: "https://quizz-relampago.vercel.app/",
    tags: ["A/B", "wordcloud"],
    params: [
      { key: "question", label: "Pergunta", def: "Qual escolhes?" },
      { key: "a", label: "Resposta A", def: "Opção A" },
      { key: "b", label: "Resposta B", def: "Opção B" },
      { key: "keyA", label: "Voto A", def: "A" },
      { key: "keyB", label: "Voto B", def: "B" }
    ],
    build: (v, domain) => {
      const q = new URLSearchParams();
      q.set("question", v.question);
      q.set("a", v.a);
      q.set("b", v.b);
      q.set("keyA", v.keyA);
      q.set("keyB", v.keyB);
      q.set("domain", domain);
      return q;
    },
    resetWords: (v) => `${v.keyA},${v.keyB}`
  },

  {
    id: "energia",
    category: "Medidores",
    name: "Energia da Live",
    desc: "Barra de energia que cresce com comentários.",
    baseUrl: "https://medidor-energia.vercel.app/",
    tags: ["energia", "wordcloud"],
    params: [
      { key: "title", label: "Título", def: "Energia da Live" },
      { key: "max", label: "Comentários para encher", def: "120" }
    ],
    build: (v, domain) => {
      const q = new URLSearchParams();
      q.set("title", v.title);
      q.set("max", v.max);
      q.set("domain", domain);
      return q;
    }
  }
];

// ---------- DOM ----------
const $list = document.getElementById("list");
const $domain = document.getElementById("domain");
const $toast = document.getElementById("toast");
const $search = document.getElementById("search");
const $category = document.getElementById("category");
const $mode = document.getElementById("mode");
const $gridCols = document.getElementById("gridCols");
const $stageSize = document.getElementById("stageSize");
const $onlyFavs = document.getElementById("onlyFavs");
const $autoRefresh = document.getElementById("autoRefresh");
const $refreshSec = document.getElementById("refreshSec");

const $exportPresets = document.getElementById("exportPresets");
const $importPresets = document.getElementById("importPresets");
const $wipePresets = document.getElementById("wipePresets");

// ---------- Utils ----------
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  children.forEach(c => node.appendChild(c));
  return node;
}

function toast(msg){
  $toast.textContent = msg;
  $toast.classList.add("show");
  setTimeout(()=> $toast.classList.remove("show"), 900);
}

function normalizeBaseUrl(u){
  return String(u || "").trim().replace(/\?[^]*$/, "").replace(/\/$/, "");
}

function buildUrl(baseUrl, query){
  const base = normalizeBaseUrl(baseUrl);
  const qs = query.toString();
  return qs ? `${base}/?${qs}` : `${base}/`;
}

function withCacheBust(url){
  const u = new URL(url);
  u.searchParams.set("t", String(Date.now()));
  return u.toString();
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

async function clearChat(domain, words){
  const base = String(domain || "").trim().replace(/\/$/, "");
  const url = (words && String(words).trim())
    ? `${base}/clear-chat?words=${encodeURIComponent(words)}`
    : `${base}/clear-chat`;

  try{
    await fetch(url, { mode: "no-cors" });
    return { via: "fetch", url };
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
    return { via: "open", url };
  }
}

function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

// ---------- Estado ----------
let onlyFavs = false;
let refreshTimer = null;

function getFavs(){ return loadJSON(FAV_KEY, {}); }
function setFavs(v){ saveJSON(FAV_KEY, v); }

function defaultInstances(){
  return ANIMS_BASE.map(a => ({ instId: crypto.randomUUID(), animId: a.id, overrides: {} }));
}
function getInstances(){
  return loadJSON(INST_KEY, defaultInstances());
}
function setInstances(v){ saveJSON(INST_KEY, v); }

function resolveAnim(inst){
  const base = ANIMS_BASE.find(a => a.id === inst.animId);
  if (!base) return null;
  return { ...base, instId: inst.instId, overrides: inst.overrides || {} };
}

function computeUrl(anim){
  const domain = ($domain.value || "").trim() || "http://localhost:3900";
  const vals = {};
  (anim.params||[]).forEach(p => {
    vals[p.key] = (anim.overrides?.[p.key] ?? p.def ?? "");
  });
  const query = anim.build(vals, domain);
  const url = buildUrl(anim.baseUrl, query);
  return { url, domain, vals };
}

function stageAspect(){
  // 1920x600 => 3.2, 1920x1080 => 1.777...
  const v = $stageSize.value || "1920x600";
  const [w, h] = v.split("x").map(n => parseInt(n, 10));
  if (!w || !h) return "16/9";
  // CSS aspect-ratio aceita “w / h”
  return `${w} / ${h}`;
}

// ---------- Categorias ----------
function populateCategories(){
  const cats = Array.from(new Set(ANIMS_BASE.map(a => a.category))).sort();
  cats.forEach(c => $category.appendChild(el("option", { value: c, text: c })));
}
populateCategories();

// ---------- Filtros ----------
function applyFilters(items){
  const q = ($search.value || "").trim().toLowerCase();
  const cat = $category.value;
  const favs = getFavs();

  return items.filter(anim => {
    const hay = [anim.name, anim.desc, anim.category, ...(anim.tags||[])].join(" ").toLowerCase();
    const okSearch = !q || hay.includes(q);
    const okCat = (cat === "all") || (anim.category === cat);
    const okFav = !onlyFavs || favs[anim.animId] === true;
    return okSearch && okCat && okFav;
  });
}

// ---------- Auto-refresh ----------
function stopAutoRefresh(){
  if (refreshTimer){
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function startAutoRefresh(){
  stopAutoRefresh();
  const on = ($autoRefresh.value === "on");
  if (!on) return;

  let sec = parseInt($refreshSec.value, 10);
  if (!sec || sec < 3) sec = 15;

  refreshTimer = setInterval(() => {
    document.querySelectorAll("iframe[data-live='1']").forEach(ifr => {
      const src = ifr.getAttribute("data-src") || ifr.src;
      ifr.src = withCacheBust(src);
    });
  }, sec * 1000);
}

// ---------- Render ----------
function render(){
  stopAutoRefresh();
  $list.innerHTML = "";

  const instances = getInstances();
  const anims = instances.map(resolveAnim).filter(Boolean);
  const filtered = applyFilters(anims);

  if ($mode.value === "grid"){
    const grid = el("div", { class: `grid cols-${$gridCols.value}` });
    filtered.forEach(anim => grid.appendChild(buildGridCard(anim)));
    $list.appendChild(grid);
  } else {
    // (se quiseres, podemos manter o modo cards; aqui fica simples)
    const grid = el("div", { class: `grid cols-2` });
    filtered.forEach(anim => grid.appendChild(buildGridCard(anim)));
    $list.appendChild(grid);
  }

  startAutoRefresh();
}

// ---------- Guardar overrides ----------
function saveOverrides(instId, newOverrides){
  const inst = getInstances();
  const idx = inst.findIndex(x => x.instId === instId);
  if (idx >= 0){
    inst[idx].overrides = { ...(inst[idx].overrides||{}), ...newOverrides };
    setInstances(inst);
  }
}

// ---------- UI: Grid Card ----------
function buildGridCard(anim){
  const favs = getFavs();
  const star = el("button", { class: "star", text: favs[anim.animId] ? "⭐" : "☆" });
  star.title = "Favorito";

  star.addEventListener("click", () => {
    const f = getFavs();
    f[anim.animId] = !f[anim.animId];
    setFavs(f);
    render();
  });

  const top = el("div", { class: "gridtop" }, [
    el("div", { class: "gridtitle" }, [
      el("strong", { text: anim.name }),
      el("span", { text: anim.desc })
    ]),
    star
  ]);

  // Editor inline
  const editor = el("div", { class: `grideditor ${(anim.params||[]).length <= 2 ? "onecol" : ""}` });
  const inputs = {};

  (anim.params || []).forEach(p => {
    const field = el("div", { class: "edfield" }, [
      el("label", { text: p.label })
    ]);
    const input = el("input", { type: "text", value: (anim.overrides?.[p.key] ?? p.def ?? "") });
    inputs[p.key] = input;
    field.appendChild(input);
    editor.appendChild(field);
  });

  // Frame
  const { url, domain, vals } = computeUrl(anim);
  const iframe = el("iframe", {
    src: withCacheBust(url),
    "data-live": "1",
    "data-src": url,
    allow: "autoplay"
  });

  const frame = el("div", { class: "gridframe" }, [iframe]);
  frame.style.setProperty("--ar", stageAspect());

  // Actualização da url quando mexes no editor
  const update = () => {
    const newOverrides = {};
    (anim.params || []).forEach(p => newOverrides[p.key] = inputs[p.key].value);
    saveOverrides(anim.instId, newOverrides);

    const updated = resolveAnim(getInstances().find(x => x.instId === anim.instId));
    const u = computeUrl(updated).url;

    iframe.setAttribute("data-src", u);
    iframe.src = withCacheBust(u);
  };

  Object.values(inputs).forEach(i => i.addEventListener("input", update));
  $domain.addEventListener("input", update);
  $stageSize.addEventListener("change", () => frame.style.setProperty("--ar", stageAspect()));

  // Actions
  const btnOpen = el("button", { class: "ghost small", text: "Abrir" });
  btnOpen.addEventListener("click", () => {
    const updated = resolveAnim(getInstances().find(x => x.instId === anim.instId));
    window.open(computeUrl(updated).url, "_blank", "noopener");
  });

  const btnReload = el("button", { class: "ghost small", text: "Recarregar" });
  btnReload.addEventListener("click", () => {
    const src = iframe.getAttribute("data-src") || iframe.src;
    iframe.src = withCacheBust(src);
    toast("Recarregado ✅");
  });

  const btnCopyObs = el("button", { class: "primary small", text: "Copiar (OBS)" });
  btnCopyObs.addEventListener("click", async () => {
    const updated = resolveAnim(getInstances().find(x => x.instId === anim.instId));
    const finalUrl = withCacheBust(computeUrl(updated).url);
    await copyToClipboard(finalUrl);
    toast("Copiado (OBS) ✅");
  });

  const btnReset = el("button", { class: "warn small", text: "Reset wordcloud" });
  btnReset.addEventListener("click", async () => {
    const updated = resolveAnim(getInstances().find(x => x.instId === anim.instId));
    const { domain, vals } = computeUrl(updated);
    const words = (typeof updated.resetWords === "function") ? (updated.resetWords(vals) || "") : "";
    const res = await clearChat(domain, words);
    toast(res.via === "fetch" ? "Reset feito ✅" : "Reset aberto ✅");
  });

  const btnDup = el("button", { class: "ghost small", text: "Duplicar" });
  btnDup.addEventListener("click", () => {
    const inst = getInstances();
    const mine = inst.find(x => x.instId === anim.instId);
    inst.push({ instId: crypto.randomUUID(), animId: mine.animId, overrides: { ...(mine.overrides||{}) } });
    setInstances(inst);
    toast("Duplicado ✅");
    render();
  });

  const actions = el("div", { class: "gridactions" }, [
    el("div", { class: "left" }, [btnOpen, btnReload, btnCopyObs, btnReset]),
    el("div", { class: "right" }, [btnDup])
  ]);

  return el("div", { class: "gridcard" }, [top, editor, frame, actions]);
}

// ---------- Controlo topo ----------
$search.addEventListener("input", render);
$category.addEventListener("change", render);
$mode.addEventListener("change", render);
$gridCols.addEventListener("change", render);
$stageSize.addEventListener("change", render);
$domain.addEventListener("input", render);

$onlyFavs.addEventListener("click", () => {
  onlyFavs = !onlyFavs;
  $onlyFavs.textContent = onlyFavs ? "⭐ Favoritos ON" : "⭐ Só favoritos";
  render();
});

$autoRefresh.addEventListener("change", () => {
  startAutoRefresh();
  toast($autoRefresh.value === "on" ? "Auto-refresh ON ✅" : "Auto-refresh OFF ✅");
});
$refreshSec.addEventListener("input", () => {
  if ($autoRefresh.value === "on"){
    startAutoRefresh();
    toast("Auto-refresh atualizado ✅");
  }
});

// ---------- Export/Import ----------
$exportPresets.addEventListener("click", async () => {
  const data = { instances: getInstances(), favs: getFavs() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "overlays-state.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Exportado ✅");
});

$importPresets.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try{
    const text = await file.text();
    const incoming = JSON.parse(text);
    if (incoming.instances) setInstances(incoming.instances);
    if (incoming.favs) setFavs(incoming.favs);
    toast("Importado ✅");
    render();
  } catch {
    toast("Falhou o import ❌");
  } finally {
    $importPresets.value = "";
  }
});

$wipePresets.addEventListener("click", () => {
  localStorage.removeItem(FAV_KEY);
  localStorage.removeItem(INST_KEY);
  toast("Reset total ✅");
  render();
});

// Init
if (!localStorage.getItem(INST_KEY)) setInstances(defaultInstances());
render();

// =========================
// Página de Testes (OBS)
// - Domain opcional (se vazio NÃO adiciona ?domain=)
// - Diagnóstico de /wordcloud (evita mixed content)
// - Gera links finais para colar no OBS
// =========================

const $list = document.getElementById('list');
const $domain = document.getElementById('domain');
const $toast = document.getElementById('toast');
const $diag = document.getElementById('diag');

function setDiag(msg){ if ($diag) $diag.value = msg; }
function isHttps(){ return window.location.protocol === 'https:'; }
function normalizeDomain(d){ return String(d || '').trim().replace(/\/$/, ''); }

async function testDomain(){
  const d = normalizeDomain($domain.value);
  if (!d){
    setDiag('Domain vazio: OK (overlays devem funcionar sem ?domain)');
    return;
  }
  if (isHttps() && d.startsWith('http://')){
    setDiag('Aviso: página em HTTPS + domain HTTP pode bloquear requests (mixed content).');
    return;
  }
  try{
    const r = await fetch(`${d}/wordcloud`, { cache: 'no-store' });
    if (!r.ok){
      setDiag(`Falhou /wordcloud (${r.status}) em ${d}`);
      return;
    }
    const j = await r.json();
    const sample = (j?.wordcloud ?? '').toString().slice(0, 60);
    setDiag(`OK: /wordcloud a responder. Ex: ${sample}${sample.length===60?'…':''}`);
  }catch{
    setDiag(`Falhou a ligação ao domain (${d}). Se estiveres em HTTPS, usa HTTPS ou deixa em branco.`);
  }
}

$domain.addEventListener('input', () => {
  testDomain();
  // atualizar URLs em todas as cards
  document.querySelectorAll('[data-recompute="1"]').forEach(btn => btn.click());
});

function toast(msg){
  $toast.textContent = msg;
  $toast.classList.add('show');
  setTimeout(()=> $toast.classList.remove('show'), 900);
}

function el(tag, attrs = {}, children = []){
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)){
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  children.forEach(c => node.appendChild(c));
  return node;
}

function normalizeBaseUrl(u){
  return String(u || '').trim().replace(/\?[^]*$/,'').replace(/\/$/,'');
}

function buildUrl(baseUrl, query){
  const base = normalizeBaseUrl(baseUrl);
  const cleaned = new URLSearchParams(query);
  for (const [k,v] of cleaned.entries()){
    if (v === '' || v == null) cleaned.delete(k);
  }
  const qs = cleaned.toString();
  return qs ? `${base}/?${qs}` : `${base}/`;
}

function openObsPreview(url, w, h){
  const win = window.open('', '_blank');
  if (!win) return;

  const safeUrl = String(url).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  win.document.open();
  win.document.write(`<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview OBS ${w}x${h}</title>
<style>
  html,body{height:100%;margin:0;background:#05070e;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;}
  .top{position:fixed;left:12px;right:12px;top:12px;display:flex;gap:10px;align-items:center;justify-content:space-between;z-index:5}
  .chip{border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);padding:8px 10px;border-radius:999px;font-size:12px;color:rgba(255,255,255,.75);backdrop-filter: blur(8px);}
  .chip strong{color:#fff}
  .wrap{height:100%;display:flex;align-items:center;justify-content:center;padding:60px 18px 18px;}
  .stage{width:${w}px;height:${h}px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 120px rgba(0,0,0,.55);background:#000;}
  .stage iframe{width:100%;height:100%;border:0;display:block;background:transparent;}
  @media (max-width:${w+80}px){
    .stage{transform: scale(calc((100vw - 36px)/${w})); transform-origin: top center;}
    .wrap{align-items:flex-start;}
  }
  @media (max-height:${h+140}px){
    .stage{transform: scale(calc((100vh - 120px)/${h})); transform-origin: top center;}
    .wrap{align-items:flex-start;}
  }
</style>
</head>
<body>
  <div class="top">
    <div class="chip"><strong>Preview OBS</strong> ${w}×${h}</div>
    <div class="chip">URL: ${safeUrl}</div>
  </div>
  <div class="wrap">
    <div class="stage"><iframe allow="autoplay" src="${safeUrl}"></iframe></div>
  </div>
</body>
</html>`);
  win.document.close();
}

async function clearChat(domain, words){
  const base = normalizeDomain(domain);
  if (!base) throw new Error('Domain vazio');

  const url = (words && String(words).trim())
    ? `${base}/clear-chat?words=${encodeURIComponent(words)}`
    : `${base}/clear-chat`;

  try{
    await fetch(url, { mode: 'no-cors' });
    return { via: 'fetch', url };
  }catch{
    window.open(url, '_blank', 'noopener,noreferrer');
    return { via: 'open', url };
  }
}

// =========================
// LISTA DE ANIMAÇÕES
// =========================
const ANIMS = [
  {
    id: 'votacao_ao_vivo_sim_nao',
    name: 'Votação ao Vivo (Sim / Não) — amCharts',
    desc: 'Gráfico circular (amCharts) para Sim/Não. Lê via wordcloud.',
    baseUrl: 'https://votacao-ao-vivo.vercel.app/',
    tags: ['Sim/Não', 'amCharts', 'wordcloud', 'OBS'],
    params: [
      { key: 'yes', label: 'Texto Sim', def: 'Sim' },
      { key: 'no', label: 'Texto Não', def: 'Não' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('yes', vals.yes);
      q.set('no', vals.no);
      if (domain) q.set('domain', domain);
      return q;
    },
    resetWords: (vals) => `${vals.yes},${vals.no}`
  },

  {
    id: 'votacoes_poll4_abcd',
    name: 'Votações (A/B/C/D) — contadores + barras',
    desc: 'Poll 4 opções. Pergunta + opções no URL. Lê via wordcloud (A,B,C,D).',
    baseUrl: 'https://votacoes.vercel.app/',
    tags: ['A/B/C/D', 'barras', 'wordcloud', 'OBS'],
    params: [
      { key: 'title', label: 'Título', def: 'Qual escolhes?' },
      { key: 'a', label: 'Opção A', def: 'Opção A' },
      { key: 'b', label: 'Opção B', def: 'Opção B' },
      { key: 'c', label: 'Opção C', def: 'Opção C' },
      { key: 'd', label: 'Opção D', def: 'Opção D' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('c', vals.c);
      q.set('d', vals.d);
      if (domain) q.set('domain', domain);
      return q;
    },
    resetWords: () => `A,B,C,D`
  },

  {
    id: 'quizz_relampago_2op',
    name: 'Quizz Relâmpago (2 opções)',
    desc: 'Pergunta + 2 respostas com contagem e barras. Aceita votos A/B. Lê via wordcloud.',
    baseUrl: 'https://quizz-relampago.vercel.app/',
    tags: ['A/B', 'barras', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'keyA', label: 'Voto A (tecla)', def: 'A' },
      { key: 'keyB', label: 'Voto B (tecla)', def: 'B' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('keyA', vals.keyA);
      q.set('keyB', vals.keyB);
      if (domain) q.set('domain', domain);
      return q;
    },
    resetWords: (vals) => `${vals.keyA},${vals.keyB}`
  },

  {
    id: 'quizz3_3op',
    name: 'Quizz (3 opções)',
    desc: 'Pergunta + 3 respostas. Aceita votos A/B/C. Lê via wordcloud.',
    baseUrl: 'https://quizz3-sage.vercel.app/',
    tags: ['A/B/C', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'c', label: 'Resposta C', def: 'Opção C' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('c', vals.c);
      if (domain) q.set('domain', domain);
      return q;
    },
    resetWords: () => `A,B,C`
  },

  {
    id: 'quizz2_2op_alt',
    name: 'Quizz 2 (2 opções) — variante',
    desc: 'Versão alternativa 2 opções. Aceita votos A/B. Lê via wordcloud.',
    baseUrl: 'https://quizz2-kappa.vercel.app/',
    tags: ['A/B', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      if (domain) q.set('domain', domain);
      return q;
    },
    resetWords: () => `A,B`
  },

  {
    id: 'quizz4_4op',
    name: 'Quizz (4 opções)',
    desc: 'Pergunta + 4 respostas. Aceita votos A/B/C/D. Lê via wordcloud.',
    baseUrl: 'https://quizz4-beta.vercel.app/',
    tags: ['A/B/C/D', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'c', label: 'Resposta C', def: 'Opção C' },
      { key: 'd', label: 'Resposta D', def: 'Opção D' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('c', vals.c);
      q.set('d', vals.d);
      if (domain) q.set('domain', domain);
      return q;
    },
    resetWords: () => `A,B,C,D`
  },

  {
    id: 'question_and_comments',
    name: 'Pergunta + Comentários (mural vertical)',
    desc: 'Mostra pergunta e comentários em tempo real. Lê via wordcloud.',
    baseUrl: 'https://questionandcomments.vercel.app/',
    tags: ['chat', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Escreve no chat…' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      if (domain) q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'palavra_secreta',
    name: 'Palavra Secreta (forca leve)',
    desc: 'Mostra traços e revela letras quando aparecem nos comentários.',
    baseUrl: 'https://palavra-secreta-sage.vercel.app/',
    tags: ['puzzle', 'wordcloud', 'OBS'],
    params: [
      { key: 'title', label: 'Título', def: 'Palavra Secreta' },
      { key: 'word', label: 'Palavra', def: 'LIDERANCA' },
      { key: 'tries', label: 'Tentativas', def: '8' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('word', vals.word);
      q.set('tries', vals.tries);
      if (domain) q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'delay_game',
    name: 'Delay vs Orador (jogo do delay)',
    desc: 'Frases divertidas enquanto o chat chega (delay).',
    baseUrl: 'https://delay-omega.vercel.app/',
    tags: ['humor', 'delay', 'OBS'],
    params: [
      { key: 'title', label: 'Título', def: 'Delay vs Orador' },
      { key: 'seconds', label: 'Segundos de delay', def: '30' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('seconds', vals.seconds);
      if (domain) q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'url_six',
    name: 'Website / URL (cartão animado)',
    desc: 'Overlay para divulgar um link.',
    baseUrl: 'https://url-six-ruddy.vercel.app/',
    tags: ['URL', 'promo', 'OBS'],
    params: [
      { key: 'title', label: 'Título', def: 'Vai ao site' },
      { key: 'url', label: 'URL', def: 'https://teusite.com' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('url', vals.url);
      if (domain) q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'medidor_energia',
    name: 'Medidor de Energia da Live',
    desc: 'Barra de energia que cresce com comentários.',
    baseUrl: 'https://medidor-energia.vercel.app/',
    tags: ['energia', 'barra', 'wordcloud', 'OBS'],
    params: [
      { key: 'title', label: 'Título', def: 'Energia da Live' },
      { key: 'max', label: 'Comentários para encher', def: '120' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('max', vals.max);
      if (domain) q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'balanca_wheat',
    name: 'Balança (A vs B) — versão final',
    desc: 'A tua balança final.',
    baseUrl: 'https://balanca-wheat.vercel.app/',
    tags: ['A/B', 'balança', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Balança de Decisão' },
      { key: 'optionA', label: 'Opção A', def: 'Opção A' },
      { key: 'optionB', label: 'Opção B', def: 'Opção B' },
      { key: 'align', label: 'Alinhamento', def: 'bottom' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('optionA', vals.optionA);
      q.set('optionB', vals.optionB);
      q.set('align', vals.align);
      if (domain) q.set('domain', domain);
      return q;
    }
  }
];

// =========================
// UI
// =========================
function buildCard(anim){
  const meta = el('div', { class: 'meta' }, [
    el('h2', { text: anim.name }),
    el('div', { class: 'desc', text: anim.desc }),
    el('div', { class: 'tags' }, (anim.tags || []).map(t => el('span', { class:'tag', text: t })))
  ]);

  const form = el('div', { class: 'form' });
  const inputs = {};

  // Base URL editável
  const baseField = el('div', { class: 'field' }, [
    el('label', { text: 'Base URL (pode ser o teu Vercel)' }),
  ]);
  const baseInput = el('input', { type: 'text', value: anim.baseUrl });
  inputs.__baseUrl = baseInput;
  baseField.appendChild(baseInput);
  form.appendChild(baseField);

  // Campos params
  (anim.params || []).forEach(p => {
    const field = el('div', { class:'field' }, [
      el('label', { text: p.label })
    ]);
    const i = el('input', { type:'text', value: (p.def ?? '') });
    inputs[p.key] = i;
    field.appendChild(i);
    form.appendChild(field);
  });

  const out = el('div', { class:'out' }, [
    el('div', { class:'label', text:'Link final (OBS Browser Source)' }),
    el('div', { class:'url', text:'' })
  ]);
  const outUrl = out.querySelector('.url');

  function getVals(){
    const vals = {};
    (anim.params || []).forEach(p => vals[p.key] = (inputs[p.key]?.value ?? ''));
    return vals;
  }

  function compute(){
    const domain = normalizeDomain($domain.value);
    const base = (inputs.__baseUrl.value || anim.baseUrl).trim();
    const vals = getVals();
    const query = anim.build(vals, domain);
    const url = buildUrl(base, query);
    outUrl.textContent = url;
    return { url, domain, vals };
  }

  Object.values(inputs).forEach(i => i.addEventListener('input', compute));
  $domain.addEventListener('input', compute);

  const btnCopy = el('button', { class:'good', text:'Copiar link' });
  btnCopy.addEventListener('click', async () => {
    const { url } = compute();
    try{
      await navigator.clipboard.writeText(url);
      toast('Copiado ✅');
    }catch{
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('Copiado ✅');
    }
  });

  const btnOpen = el('button', { class:'primary', text:'Abrir preview' });
  btnOpen.addEventListener('click', () => {
    const { url } = compute();
    window.open(url, '_blank', 'noopener');
  });

  const btnReset = el('button', { class:'ghost', text:'Reset campos' });
  btnReset.addEventListener('click', () => {
    inputs.__baseUrl.value = anim.baseUrl;
    (anim.params || []).forEach(p => { if (inputs[p.key]) inputs[p.key].value = (p.def ?? ''); });
    compute();
    toast('Reset feito');
  });

  const sizeWrap = el('span', { class:'sizepill' }, [
    el('span', { text:'Preview' }),
    (() => {
      const sel = el('select', {}, [
        el('option', { value:'1920x600', text:'1920×600' }),
        el('option', { value:'1920x1080', text:'1920×1080' }),
      ]);
      sel.id = `size_${anim.id}`;
      return sel;
    })()
  ]);

  const btnObs = el('button', { class:'primary small', text:'Abrir OBS' });
  btnObs.addEventListener('click', () => {
    const { url } = compute();
    const sel = document.getElementById(`size_${anim.id}`);
    const [w, h] = String(sel?.value || '1920x600').split('x').map(n => parseInt(n, 10));
    openObsPreview(url, w, h);
  });

  const btnResetWordcloud = el('button', { class:'warn small', text:'Reset wordcloud' });
  btnResetWordcloud.addEventListener('click', async () => {
    const { domain, vals } = compute();
    try{
      const words = (typeof anim.resetWords === 'function') ? (anim.resetWords(vals) || '') : '';
      const res = await clearChat(domain, words);
      toast(res.via === 'fetch' ? 'Reset feito ✅' : 'Reset aberto (tab) ✅');
    }catch{
      toast('Sem domain para reset');
    }
  });

  const actions = el('div', { class:'actions' }, [
    el('div', { class:'btns' }, [
      el('div', { class:'group' }, [btnCopy, btnOpen, btnReset]),
      el('span', { class:'seg' }),
      el('div', { class:'group' }, [sizeWrap, btnObs, btnResetWordcloud]),
    ]),
    el('div', { class:'hint', html:
      'Dica: se esta página estiver em <b>https</b> e o domain for <b>http</b>, alguns fetch podem ser bloqueados (mixed content). Nesse caso deixa o domain vazio.'
    })
  ]);

  const right = el('div', {}, [form, actions, out]);
  const row = el('div', { class:'row' }, [meta, right]);
  const card = el('div', { class:'card' }, [row]);

  // botão invisível para recompute global
  const recompute = el('button', { style:'display:none', 'data-recompute':'1' });
  recompute.addEventListener('click', compute);
  card.appendChild(recompute);

  setTimeout(() => { compute(); }, 0);
  return card;
}

ANIMS.forEach(a => $list.appendChild(buildCard(a)));
testDomain();

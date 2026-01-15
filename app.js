// ===========================
// Overlays Tester (OBS)
// - Grelha 1/2/3 colunas
// - Preview 1920x600 ou 1920x1080
// - URL final copiável por overlay
// - Favoritos, pesquisa e categorias
// - Auto-refresh (recarrega iframes)
// - Reset wordcloud via /clear-chat (quando aplicável)
// - Cores opcionais via parâmetros (quando fizer sentido)
// ===========================

const $list = document.getElementById('list');
const $domain = document.getElementById('domain');
const $search = document.getElementById('search');
const $category = document.getElementById('category');
const $gridCols = document.getElementById('gridCols');
const $stageSize = document.getElementById('stageSize');
const $onlyFavs = document.getElementById('onlyFavs');
const $autoRefresh = document.getElementById('autoRefresh');
const $refreshSec = document.getElementById('refreshSec');

const $exportPresets = document.getElementById('exportPresets');
const $importPresets = document.getElementById('importPresets');
const $wipePresets = document.getElementById('wipePresets');
const $toast = document.getElementById('toast');

const FAV_KEY = 'overlayTesterFavs_v1';
const INST_KEY = 'overlayTesterInstances_v1';
let onlyFavs = false;
let refreshTimer = null;

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  children.forEach(c => node.appendChild(c));
  return node;
}

function toast(msg){
  $toast.textContent = msg;
  $toast.classList.add('show');
  setTimeout(()=> $toast.classList.remove('show'), 900);
}

function normalizeBaseUrl(u){
  return String(u || '').trim().replace(/\?[^]*$/, '').replace(/\/$/, '');
}

function buildUrl(baseUrl, query){
  const base = normalizeBaseUrl(baseUrl);
  const qs = query.toString();
  return qs ? `${base}/?${qs}` : `${base}/`;
}

function withCacheBust(url){
  const u = new URL(url);
  u.searchParams.set('t', String(Date.now()));
  return u.toString();
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

function getFavs(){ return loadJSON(FAV_KEY, {}); }
function setFavs(v){ saveJSON(FAV_KEY, v); }

function getInstances(){ return loadJSON(INST_KEY, null); }
function setInstances(v){ saveJSON(INST_KEY, v); }

function stageAspect(){
  const v = $stageSize.value || '1920x600';
  const [w, h] = v.split('x').map(n => parseInt(n, 10));
  return `${w} / ${h}`;
}

async function clearChat(domain, words){
  const base = String(domain || '').trim().replace(/\/$/, '');
  const url = (words && String(words).trim())
    ? `${base}/clear-chat?words=${encodeURIComponent(words)}`
    : `${base}/clear-chat`;

  try{
    await fetch(url, { mode: 'no-cors' });
    return { via: 'fetch', url };
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return { via: 'open', url };
  }
}

// -------------------------
// ANIMAÇÕES (todas as que listaste)
// -------------------------
const ANIMS_BASE = [
  // Nota: "colors" aqui só cria campos e adiciona params; se a overlay não usar, ignora.

  {
    id: 'votacao_ao_vivo',
    animId: 'votacao_ao_vivo',
    category: 'Votações',
    name: 'Votação ao Vivo (Sim/Não) — amCharts',
    desc: 'Gráfico circular Sim/Não (wordcloud).',
    baseUrl: 'https://votacao-ao-vivo.vercel.app/',
    tags: ['Sim/Não', 'amCharts', 'wordcloud'],
    params: [
      { key: 'yes', label: 'Texto Sim', def: 'Sim' },
      { key: 'no', label: 'Texto Não', def: 'Não' },
      { key: 'colorYes', label: 'Cor Sim (hex, opcional)', def: '' },
      { key: 'colorNo', label: 'Cor Não (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('yes', vals.yes);
      q.set('no', vals.no);
      q.set('domain', domain);
      if (vals.colorYes) q.set('colorYes', vals.colorYes);
      if (vals.colorNo) q.set('colorNo', vals.colorNo);
      return q;
    },
    resetWords: (vals) => `${vals.yes},${vals.no}`
  },

  {
    id: 'votacoes_abcd',
    animId: 'votacoes_abcd',
    category: 'Votações',
    name: 'Votações (A/B/C/D)',
    desc: '4 opções com barras e contadores (wordcloud A,B,C,D).',
    baseUrl: 'https://votacoes.vercel.app/',
    tags: ['A/B/C/D', 'barras', 'wordcloud'],
    params: [
      { key: 'title', label: 'Título', def: 'Qual a tua escolha?' },
      { key: 'a', label: 'Opção A', def: 'Opção A' },
      { key: 'b', label: 'Opção B', def: 'Opção B' },
      { key: 'c', label: 'Opção C', def: 'Opção C' },
      { key: 'd', label: 'Opção D', def: 'Opção D' },
      { key: 'colorA', label: 'Cor A (hex, opcional)', def: '' },
      { key: 'colorB', label: 'Cor B (hex, opcional)', def: '' },
      { key: 'colorC', label: 'Cor C (hex, opcional)', def: '' },
      { key: 'colorD', label: 'Cor D (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('c', vals.c);
      q.set('d', vals.d);
      q.set('domain', domain);
      if (vals.colorA) q.set('colorA', vals.colorA);
      if (vals.colorB) q.set('colorB', vals.colorB);
      if (vals.colorC) q.set('colorC', vals.colorC);
      if (vals.colorD) q.set('colorD', vals.colorD);
      return q;
    },
    resetWords: () => `A,B,C,D`
  },

  {
    id: 'quizz_relampago_2',
    animId: 'quizz_relampago_2',
    category: 'Quizzes',
    name: 'Quizz Relâmpago (2 opções)',
    desc: 'Pergunta + 2 respostas com barras (A/B).',
    baseUrl: 'https://quizz-relampago.vercel.app/',
    tags: ['A/B', 'barras', 'wordcloud'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'keyA', label: 'Voto A (tecla)', def: 'A' },
      { key: 'keyB', label: 'Voto B (tecla)', def: 'B' },
      { key: 'colorA', label: 'Cor A (hex, opcional)', def: '' },
      { key: 'colorB', label: 'Cor B (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('keyA', vals.keyA);
      q.set('keyB', vals.keyB);
      q.set('domain', domain);
      if (vals.colorA) q.set('colorA', vals.colorA);
      if (vals.colorB) q.set('colorB', vals.colorB);
      return q;
    },
    resetWords: (vals) => `${vals.keyA},${vals.keyB}`
  },

  {
    id: 'quizz3',
    animId: 'quizz3',
    category: 'Quizzes',
    name: 'Quizz (3 opções)',
    desc: 'Pergunta + 3 respostas com barras (A/B/C).',
    baseUrl: 'https://quizz3-sage.vercel.app/',
    tags: ['A/B/C', 'barras', 'wordcloud'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'c', label: 'Resposta C', def: 'Opção C' },
      { key: 'colorA', label: 'Cor A (hex, opcional)', def: '' },
      { key: 'colorB', label: 'Cor B (hex, opcional)', def: '' },
      { key: 'colorC', label: 'Cor C (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('c', vals.c);
      q.set('domain', domain);
      if (vals.colorA) q.set('colorA', vals.colorA);
      if (vals.colorB) q.set('colorB', vals.colorB);
      if (vals.colorC) q.set('colorC', vals.colorC);
      return q;
    },
    resetWords: () => `A,B,C`
  },

  {
    id: 'quizz2',
    animId: 'quizz2',
    category: 'Quizzes',
    name: 'Quizz (2 opções) — variante',
    desc: 'Outra versão A/B.',
    baseUrl: 'https://quizz2-kappa.vercel.app/',
    tags: ['A/B', 'wordcloud'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'colorA', label: 'Cor A (hex, opcional)', def: '' },
      { key: 'colorB', label: 'Cor B (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('domain', domain);
      if (vals.colorA) q.set('colorA', vals.colorA);
      if (vals.colorB) q.set('colorB', vals.colorB);
      return q;
    },
    resetWords: () => `A,B`
  },

  {
    id: 'quizz4',
    animId: 'quizz4',
    category: 'Quizzes',
    name: 'Quizz (4 opções)',
    desc: 'Pergunta + 4 respostas (A/B/C/D).',
    baseUrl: 'https://quizz4-beta.vercel.app/',
    tags: ['A/B/C/D', 'wordcloud'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?' },
      { key: 'a', label: 'Resposta A', def: 'Opção A' },
      { key: 'b', label: 'Resposta B', def: 'Opção B' },
      { key: 'c', label: 'Resposta C', def: 'Opção C' },
      { key: 'd', label: 'Resposta D', def: 'Opção D' },
      { key: 'colorA', label: 'Cor A (hex, opcional)', def: '' },
      { key: 'colorB', label: 'Cor B (hex, opcional)', def: '' },
      { key: 'colorC', label: 'Cor C (hex, opcional)', def: '' },
      { key: 'colorD', label: 'Cor D (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('c', vals.c);
      q.set('d', vals.d);
      q.set('domain', domain);
      if (vals.colorA) q.set('colorA', vals.colorA);
      if (vals.colorB) q.set('colorB', vals.colorB);
      if (vals.colorC) q.set('colorC', vals.colorC);
      if (vals.colorD) q.set('colorD', vals.colorD);
      return q;
    },
    resetWords: () => `A,B,C,D`
  },

  {
    id: 'question_comments',
    animId: 'question_comments',
    category: 'Chat',
    name: 'Pergunta + Comentários (mural)',
    desc: 'Pergunta + fluxo de comentários (wordcloud).',
    baseUrl: 'https://questionandcomments.vercel.app/',
    tags: ['chat', 'mural', 'wordcloud'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Escreve no chat…' },
      { key: 'color', label: 'Cor (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('domain', domain);
      if (vals.color) q.set('color', vals.color);
      return q;
    }
  },

  {
    id: 'palavra_secreta',
    animId: 'palavra_secreta',
    category: 'Jogos',
    name: 'Palavra Secreta',
    desc: 'Traços visíveis; letras só aparecem quando forem reveladas (wordcloud).',
    baseUrl: 'https://palavra-secreta-sage.vercel.app/',
    tags: ['puzzle', 'forca', 'wordcloud'],
    params: [
      { key: 'title', label: 'Título', def: 'Palavra Secreta' },
      { key: 'word', label: 'Palavra', def: 'LIDERANCA' },
      { key: 'tries', label: 'Tentativas', def: '8' },
      { key: 'color', label: 'Cor (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('word', vals.word);
      q.set('tries', vals.tries);
      q.set('domain', domain);
      if (vals.color) q.set('color', vals.color);
      return q;
    }
  },

  {
    id: 'delay',
    animId: 'delay',
    category: 'Jogos',
    name: 'Delay vs Orador',
    desc: 'Frases enquanto esperas pelo delay do YouTube.',
    baseUrl: 'https://delay-omega.vercel.app/',
    tags: ['humor', 'delay', 'wordcloud'],
    params: [
      { key: 'title', label: 'Título', def: 'Delay vs Orador' },
      { key: 'seconds', label: 'Segundos', def: '30' },
      { key: 'color', label: 'Cor (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('seconds', vals.seconds);
      q.set('domain', domain);
      if (vals.color) q.set('color', vals.color);
      return q;
    }
  },

  {
    id: 'url_card',
    animId: 'url_card',
    category: 'Promo',
    name: 'Cartão de URL (website)',
    desc: 'Overlay para divulgar um link.',
    baseUrl: 'https://url-six-ruddy.vercel.app/',
    tags: ['url', 'promo'],
    params: [
      { key: 'title', label: 'Título', def: 'Vai ao site' },
      { key: 'url', label: 'URL', def: 'https://teusite.com' },
      { key: 'color', label: 'Cor (hex, opcional)', def: '' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('url', vals.url);
      q.set('domain', domain);
      if (vals.color) q.set('color', vals.color);
      return q;
    }
  },

  {
    id: 'energia',
    animId: 'energia',
    category: 'Medidores',
    name: 'Medidor de Energia',
    desc: 'Barra que cresce com comentários.',
    baseUrl: 'https://medidor-energia.vercel.app/',
    tags: ['energia', 'barra', 'wordcloud'],
    params: [
      { key: 'title', label: 'Título',

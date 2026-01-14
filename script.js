// ✅ Lista de animações (edita/expande à vontade)
const ANIMS = [
  {
    id: 'balanca_ab',
    name: 'Balança (A vs B)',
    desc: 'Votação A/B com tilt e emojis. Lê via wordcloud.',
    baseUrl: 'https://overlay-tug-of-war.vercel.app/',
    tags: ['A/B', 'wordcloud', 'OBS'],
    params: [
      { key: 'title', label: 'Título', def: 'Balança de Decisão', placeholder: 'Balança de Decisão', type: 'text' },
      { key: 'left', label: 'Texto A', def: 'Opção A', placeholder: 'Opção A', type: 'text' },
      { key: 'right', label: 'Texto B', def: 'Opção B', placeholder: 'Opção B', type: 'text' },
      { key: 'keyA', label: 'Voto A (tecla)', def: 'A', placeholder: 'A', type: 'text' },
      { key: 'keyB', label: 'Voto B (tecla)', def: 'B', placeholder: 'B', type: 'text' },
      { key: 'emojiMaxAt', label: 'Emoji máximo aos X votos', def: '40', placeholder: '40', type: 'number' },
      { key: 'emojiMaxScale', label: 'Escala máxima do emoji', def: '2.1', placeholder: '2.1', type: 'number' },
      { key: 'maxTilt', label: 'Inclinação máxima', def: '12', placeholder: '12', type: 'number' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('title', vals.title);
      q.set('left', vals.left);
      q.set('right', vals.right);
      q.set('keyA', vals.keyA);
      q.set('keyB', vals.keyB);
      q.set('emojiMaxAt', vals.emojiMaxAt);
      q.set('emojiMaxScale', vals.emojiMaxScale);
      q.set('maxTilt', vals.maxTilt);
      q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'poll4',
    name: 'Poll 4 (A/B/C/D)',
    desc: 'Pergunta com 4 opções e contadores.',
    baseUrl: 'https://pool4.vercel.app/',
    tags: ['A/B/C/D', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual a tua cor preferida?', placeholder: 'Qual a tua cor preferida?', type: 'text' },
      { key: 'optA', label: 'Opção A', def: 'Azul', placeholder: 'Azul', type: 'text' },
      { key: 'optB', label: 'Opção B', def: 'Vermelho', placeholder: 'Vermelho', type: 'text' },
      { key: 'optC', label: 'Opção C', def: 'Verde', placeholder: 'Verde', type: 'text' },
      { key: 'optD', label: 'Opção D', def: 'Amarelo', placeholder: 'Amarelo', type: 'text' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('optA', vals.optA);
      q.set('optB', vals.optB);
      q.set('optC', vals.optC);
      q.set('optD', vals.optD);
      q.set('domain', domain);
      return q;
    }
  },

  {
    id: 'quiz2',
    name: 'Quiz Relâmpago (2 opções)',
    desc: 'Pergunta + 2 respostas em linha com contagem.',
    baseUrl: 'https://quiz2.vercel.app/',
    tags: ['2 opções', 'wordcloud', 'OBS'],
    params: [
      { key: 'question', label: 'Pergunta', def: 'Qual escolhes?', placeholder: 'Qual escolhes?', type: 'text' },
      { key: 'a', label: 'Resposta A', def: 'Opção 1', placeholder: 'Opção 1', type: 'text' },
      { key: 'b', label: 'Resposta B', def: 'Opção 2', placeholder: 'Opção 2', type: 'text' },
      { key: 'keyA', label: 'Voto A (A)', def: 'A', placeholder: 'A', type: 'text' },
      { key: 'keyB', label: 'Voto B (B)', def: 'B', placeholder: 'B', type: 'text' },
    ],
    build: (vals, domain) => {
      const q = new URLSearchParams();
      q.set('question', vals.question);
      q.set('a', vals.a);
      q.set('b', vals.b);
      q.set('keyA', vals.keyA);
      q.set('keyB', vals.keyB);
      q.set('domain', domain);
      return q;
    }
  },
];

// UI
const $list = document.getElementById('list');
const $domain = document.getElementById('domain');
const $toast = document.getElementById('toast');

function toast(msg){
  $toast.textContent = msg;
  $toast.classList.add('show');
  setTimeout(()=> $toast.classList.remove('show'), 900);
}

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(c));
  return node;
}

function buildCard(anim){
  const meta = el('div', { class: 'meta' }, [
    el('h2', { html: anim.name }),
    el('div', { class: 'desc', html: anim.desc }),
    el('div', { class: 'tags' }, anim.tags.map(t => el('span', { class: 'tag', html: t })))
  ]);

  const form = el('div', { class: 'form' });
  const inputs = {};

  // Base URL editável
  const baseField = el('div', { class: 'field' }, [
    el('label', { html: 'Base URL (pode ser o teu Vercel)' }),
    (() => {
      const i = el('input', { type: 'text', value: anim.baseUrl });
      inputs.__baseUrl = i;
      return i;
    })()
  ]);
  form.appendChild(baseField);

  anim.params.forEach(p=>{
    const field = el('div', { class: 'field' }, [
      el('label', { html: p.label }),
      (() => {
        const i = el('input', {
          type: p.type || 'text',
          placeholder: p.placeholder || '',
          value: p.def ?? ''
        });
        inputs[p.key] = i;
        return i;
      })()
    ]);
    form.appendChild(field);
  });

  const out = el('div', { class: 'out' }, [
    el('div', { class: 'label', html: 'Link final (OBS Browser Source)' }),
    el('div', { class: 'url', html: '' })
  ]);

  const outUrl = out.querySelector('.url');

  function getVals(){
    const vals = {};
    anim.params.forEach(p => vals[p.key] = inputs[p.key].value ?? '');
    return vals;
  }

  function compute(){
    const domain = ($domain.value || '').trim() || 'http://localhost:3900';
    const base = (inputs.__baseUrl.value || anim.baseUrl).trim();

    const vals = getVals();
    const q = anim.build(vals, domain);

    const cleanBase = base.replace(/\?[^]*$/,'').replace(/\/$/,'');
    const url = `${cleanBase}/?${q.toString()}`;
    outUrl.textContent = url;
    return url;
  }

  // Update em tempo real
  Object.values(inputs).forEach(i => i.addEventListener('input', compute));
  $domain.addEventListener('input', compute);

  const btnCopy = el('button', { class: 'good', html: 'Copiar link' });
  btnCopy.addEventListener('click', async ()=>{
    const url = compute();
    try{
      await navigator.clipboard.writeText(url);
      toast('Copiado ✅');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('Copiado ✅');
    }
  });

  const btnOpen = el('button', { class: 'primary', html: 'Abrir preview' });
  btnOpen.addEventListener('click', ()=> window.open(compute(), '_blank'));

  const btnReset = el('button', { html: 'Reset campos' });
  btnReset.addEventListener('click', ()=>{
    inputs.__baseUrl.value = anim.baseUrl;
    anim.params.forEach(p => inputs[p.key].value = p.def ?? '');
    compute();
    toast('Reset feito');
  });

  const actions = el('div', { class: 'actions' }, [
    el('div', { class: 'btns' }, [btnCopy, btnOpen, btnReset]),
    el('div', { class: 'hint', html: 'Dica: no OBS ativa “Refresh cache of current page” quando estiveres a testar.' })
  ]);

  const right = el('div', {}, [form, actions, out]);
  const row = el('div', { class:'row' }, [meta, right]);

  const card = el('div', { class:'card' }, [row]);

  // Primeira renderização
  setTimeout(compute, 0);

  return card;
}

// Render
ANIMS.forEach(a => $list.appendChild(buildCard(a)));

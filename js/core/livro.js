/* ============================================================
   Livro — organiza uma disciplina em capítulos
   ------------------------------------------------------------
   Páginas em formato de livro marcam cada capítulo com
     <section class="section capitulo" id="cap-1" data-parte="Parte I — ..." data-topicos="a,b">
       <p class="cap-kicker">Capítulo 1</p><h2>1. Título</h2> ... <h3 id="s1-1">1.1 ...</h3> ...
   e este módulo monta, a partir disso:
     · o sumário (#sumario) com partes, capítulos, seções, tempo de leitura e progresso;
     · o rodapé de cada capítulo: anterior / marcar como lido / próximo;
     · o botão "praticar este capítulo", que abre o simulado filtrado pelos tópicos;
     · a barra fina de leitura no topo e o "continuar de onde parou".
   O progresso fica só no navegador (localStorage), sem nada obrigatório:
   se o armazenamento falhar, a página funciona igual, apenas sem lembrar.
   ============================================================ */
(function (global) {
  'use strict';

  var PALAVRAS_POR_MIN = 180;   /* leitura técnica, com fórmulas: mais lenta que texto corrido */

  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravar(chave, v) {
    try { localStorage.setItem(chave, JSON.stringify(v)); } catch (e) { /* sem memória */ }
  }

  function minutos(sec) {
    var clone = sec.cloneNode(true);
    clone.querySelectorAll('.sim, .cap-rodape, .katex-mathml, script').forEach(function (n) { n.remove(); });
    var n = (clone.textContent || '').split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.round(n / PALAVRAS_POR_MIN));
  }

  function montar() {
    var caps = Array.prototype.slice.call(document.querySelectorAll('main .capitulo'));
    if (!caps.length || document.documentElement.classList.contains('modo-sim')) return;

    var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '') || 'livro';
    var CH_LIDOS = 'engmec:livro:' + slug + ':lidos';
    var CH_ULTIMO = 'engmec:livro:' + slug + ':ultimo';
    var lidos = ler(CH_LIDOS, []);

    var info = caps.map(function (c, i) {
      var h2 = c.querySelector('h2');
      return {
        el: c, id: c.id, num: i + 1,
        titulo: h2 ? h2.textContent.replace(/^\s*\d+\.\s*/, '').trim() : c.id,
        parte: c.dataset.parte || '',
        topicos: (c.dataset.topicos || '').split(',').filter(Boolean),
        secoes: Array.prototype.slice.call(c.querySelectorAll('h3[id]')).map(function (h) {
          var n = h.querySelector('.num'), t = h.textContent.trim();
          if (n) t = n.textContent.trim() + ' ' + t.slice(n.textContent.trim().length).trim();
          return { id: h.id, t: t };
        }),
        min: minutos(c)
      };
    });

    /* ---------- tempo total no cabeçalho ---------- */
    var total = info.reduce(function (s, c) { return s + c.min; }, 0);
    var tagTempo = document.getElementById('livro-tempo');
    if (tagTempo) tagTempo.textContent = '≈ ' + (total >= 90 ? (total / 60).toFixed(1).replace('.', ',') + ' h' : total + ' min') + ' de leitura';

    /* ---------- sumário ---------- */
    var sum = document.getElementById('sumario-lista');
    var barraProg, textoProg, btnContinuar;
    if (sum) {
      var topo = document.createElement('div');
      topo.className = 'sumario-topo';
      topo.innerHTML =
        '<div class="sumario-prog"><div class="sumario-prog-barra"><span></span></div>' +
        '<span class="sumario-prog-txt"></span></div>' +
        '<a class="btn sm primary" id="livro-continuar" hidden></a>';
      sum.parentNode.insertBefore(topo, sum);
      barraProg = topo.querySelector('.sumario-prog-barra span');
      textoProg = topo.querySelector('.sumario-prog-txt');
      btnContinuar = topo.querySelector('#livro-continuar');

      var parteAtual = null, lista = null;
      info.forEach(function (c) {
        if (c.parte !== parteAtual || !lista) {
          parteAtual = c.parte;
          if (c.parte) {
            var hp = document.createElement('p');
            hp.className = 'sumario-parte';
            hp.textContent = c.parte;
            sum.appendChild(hp);
          }
          lista = document.createElement('ol');
          lista.className = 'sumario-caps';
          lista.start = c.num;
          sum.appendChild(lista);
        }
        var li = document.createElement('li');
        li.className = 'sumario-cap';
        li.dataset.cap = c.id;
        li.innerHTML =
          '<div class="sumario-linha">' +
            '<span class="sumario-num">' + c.num + '</span>' +
            '<a class="sumario-titulo" href="#' + c.id + '">' + c.titulo + '</a>' +
            '<span class="sumario-min">' + c.min + ' min</span>' +
            '<span class="sumario-ok" title="Capítulo lido" aria-label="Capítulo lido">✓</span>' +
          '</div>' +
          (c.secoes.length ? '<div class="sumario-secoes">' + c.secoes.map(function (s) {
            return '<a href="#' + s.id + '">' + s.t + '</a>';
          }).join('') + '</div>' : '');
        lista.appendChild(li);
      });
    }

    /* ---------- rodapé de cada capítulo ---------- */
    info.forEach(function (c, i) {
      var ant = info[i - 1], prox = info[i + 1];
      var rod = document.createElement('nav');
      rod.className = 'cap-rodape';
      rod.setAttribute('aria-label', 'Navegação entre capítulos');
      rod.innerHTML =
        (ant ? '<a class="cap-nav cap-ant" href="#' + ant.id + '"><small>← Capítulo ' + ant.num + '</small>' + ant.titulo + '</a>'
             : '<a class="cap-nav cap-ant" href="#sumario"><small>←</small>Sumário</a>') +
        '<div class="cap-meio">' +
          '<button type="button" class="btn sm cap-lido" aria-pressed="false"></button>' +
          (c.topicos.length && document.getElementById('quiz')
            ? '<button type="button" class="btn sm ghost cap-praticar">Praticar questões deste capítulo</button>' : '') +
        '</div>' +
        (prox ? '<a class="cap-nav cap-prox" href="#' + prox.id + '"><small>Capítulo ' + prox.num + ' →</small>' + prox.titulo + '</a>'
              : '<a class="cap-nav cap-prox" href="#simulado"><small>Fim do livro →</small>Simulado completo</a>');
      c.el.appendChild(rod);

      var btn = rod.querySelector('.cap-lido');
      btn.addEventListener('click', function () {
        var k = lidos.indexOf(c.id);
        if (k >= 0) lidos.splice(k, 1); else lidos.push(c.id);
        gravar(CH_LIDOS, lidos);
        atualizar();
        if (k < 0 && prox && global.matchMedia && !global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          btn.classList.add('cap-lido-pulso');
          setTimeout(function () { btn.classList.remove('cap-lido-pulso'); }, 600);
        }
      });

      var prat = rod.querySelector('.cap-praticar');
      if (prat) prat.addEventListener('click', function () { praticar(slug, c); });
    });

    function atualizar() {
      info.forEach(function (c) {
        var lido = lidos.indexOf(c.id) >= 0;
        c.el.classList.toggle('cap-foi-lido', lido);
        var b = c.el.querySelector('.cap-lido');
        if (b) {
          b.textContent = lido ? '✓ Capítulo lido' : 'Marcar como lido';
          b.setAttribute('aria-pressed', String(lido));
          b.classList.toggle('ok', lido);
        }
        var li = sum && sum.querySelector('[data-cap="' + c.id + '"]');
        if (li) li.classList.toggle('lido', lido);
      });
      var n = info.filter(function (c) { return lidos.indexOf(c.id) >= 0; }).length;
      if (barraProg) barraProg.style.width = (100 * n / info.length) + '%';
      if (textoProg) textoProg.textContent = n === info.length
        ? 'Todos os ' + info.length + ' capítulos lidos'
        : n + ' de ' + info.length + ' capítulos lidos';
    }
    atualizar();

    /* ---------- continuar de onde parou ---------- */
    var ultimo = ler(CH_ULTIMO, null);
    var cUlt = info.filter(function (c) { return c.id === ultimo; })[0];
    if (btnContinuar && cUlt && cUlt.num > 1) {
      btnContinuar.href = '#' + cUlt.id;
      btnContinuar.textContent = 'Continuar no capítulo ' + cUlt.num + ' →';
      btnContinuar.hidden = false;
    } else if (btnContinuar) {
      btnContinuar.href = '#' + info[0].id;
      btnContinuar.textContent = 'Começar pelo capítulo 1 →';
      btnContinuar.hidden = false;
    }

    /* ---------- barra de leitura e capítulo corrente ---------- */
    var barra = document.createElement('div');
    barra.className = 'livro-barra';
    barra.innerHTML = '<span></span>';
    document.body.appendChild(barra);
    var fill = barra.firstChild;
    var primeiro = info[0].el, ultimoCap = info[info.length - 1].el;
    var agendado = false;
    function rolar() {
      agendado = false;
      var y0 = primeiro.offsetTop, y1 = ultimoCap.offsetTop + ultimoCap.offsetHeight - innerHeight;
      var f = (scrollY - y0) / Math.max(1, y1 - y0);
      f = Math.min(1, Math.max(0, f));
      fill.style.width = (f * 100) + '%';
      barra.classList.toggle('visivel', scrollY > y0 - 200 && scrollY < y1 + innerHeight * 0.5);
      /* capítulo corrente: o último cujo topo já passou do meio da tela */
      var atual = null;
      info.forEach(function (c) { if (c.el.getBoundingClientRect().top < innerHeight * 0.4) atual = c; });
      if (atual && atual.id !== ultimo) { ultimo = atual.id; gravar(CH_ULTIMO, ultimo); }
    }
    addEventListener('scroll', function () {
      if (!agendado) { agendado = true; requestAnimationFrame(rolar); }
    }, { passive: true });
    rolar();
  }

  /* abre o simulado já filtrado pelos tópicos do capítulo */
  function praticar(slug, c) {
    var host = document.getElementById('quiz');
    if (!host || !global.Quiz) return;
    var chave = 'engmec:' + (host.dataset.quiz || slug) + ':cfg';
    var cfg = ler(chave, {});
    cfg.topicos = c.topicos.slice();
    cfg.dificuldades = ['facil', 'medio', 'dificil'];
    cfg.tipos = ['multipla', 'calculo', 'discursiva'];
    gravar(chave, cfg);
    global.Quiz.montar(host);
    var sec = document.getElementById('simulado');
    var aviso = document.getElementById('livro-aviso-quiz');
    if (!aviso && sec) {
      aviso = document.createElement('p');
      aviso.id = 'livro-aviso-quiz';
      aviso.className = 'livro-aviso-quiz';
      host.parentNode.insertBefore(aviso, host);
    }
    if (aviso) aviso.innerHTML = 'Simulado filtrado pelo <strong>capítulo ' + c.num + ' — ' + c.titulo +
      '</strong>. Para voltar a todas as questões, marque todos os tópicos no painel.';
    (sec || host).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})(window);

/* ============================================================
   App - tema, indice lateral, catalogo e busca
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- tema ---------- */
  var LS_TEMA = 'engmec:tema';

  function aplicarTema(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(LS_TEMA, t); } catch (e) { /* ignora */ }
    var b = document.getElementById('btn-tema');
    if (b) {
      b.textContent = t === 'dark' ? '☀' : '☽';
      b.setAttribute('aria-label', t === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
      b.title = b.getAttribute('aria-label');
    }
  }

  function initTema() {
    var t = null;
    try { t = localStorage.getItem(LS_TEMA); } catch (e) { /* ignora */ }
    if (!t) t = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(t);
    var b = document.getElementById('btn-tema');
    if (b) {
      b.addEventListener('click', function () {
        aplicarTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }
  }

  /* aplica o tema o mais cedo possivel para evitar flash */
  (function () {
    var t = null;
    try { t = localStorage.getItem(LS_TEMA); } catch (e) { /* ignora */ }
    if (!t) t = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  })();

  /* ---------- modo "só esta simulação": disciplinas/x.html?sim=sim-y ----------
     Roda antes dos módulos de simulação (app.js é o primeiro script): remove as
     outras simulações da página para que elas nem sejam montadas nem animadas. */
  var SIM_FOCO = (function () {
    var m = /[?&]sim=(sim-[a-z0-9-]+)/.exec(global.location.search);
    if (!m || !document.getElementById(m[1])) return null;
    var alvo = document.getElementById(m[1]);
    var caixa = document.getElementById('simuladores');
    if (!caixa) return null;
    Array.prototype.slice.call(caixa.querySelectorAll('div[id^="sim-"]')).forEach(function (el) {
      if (el === alvo || el.parentNode !== caixa) return;
      var dica = el.nextElementSibling;
      if (dica && dica.classList.contains('callout')) dica.parentNode.removeChild(dica);
      el.parentNode.removeChild(el);
    });
    document.documentElement.classList.add('modo-sim');
    return m[1];
  })();

  /* ---------- indice lateral gerado a partir das secoes ---------- */
  function initTOC() {
    var toc = document.querySelector('.toc');
    if (!toc) return;
    var secoes = document.querySelectorAll('main .section[id]');
    if (!secoes.length) { toc.style.display = 'none'; return; }

    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Indice da pagina');
    secoes.forEach(function (s) {
      var h = s.querySelector('h2');
      if (!h) return;
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.textContent = h.textContent.trim();
      nav.appendChild(a);
    });
    var h4 = toc.querySelector('h4');
    if (!h4) {
      h4 = document.createElement('h4');
      h4.textContent = 'Nesta pagina';
      toc.appendChild(h4);
    }
    toc.appendChild(nav);

    var links = nav.querySelectorAll('a');
    if (!global.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    secoes.forEach(function (s) { io.observe(s); });
  }

  /* ---------- catalogo de disciplinas (pagina inicial) ---------- */
  var CORES_PERIODO = {
    '1': 'accent', '2': 'accent', '3': 'info', '4': 'info',
    '5': 'ok', '6': 'ok', '7': 'warn', '9': 'warn', '10': 'err', '0': ''
  };

  function cardDisciplina(d, base) {
    var pronta = d.pronta !== false;
    var a = document.createElement(pronta ? 'a' : 'div');
    a.className = 'card' + (pronta ? ' card-link' : ' card-pendente');
    if (pronta) a.href = base + 'disciplinas/' + d.slug + '.html';
    var per = d.periodo === '0' ? 'Optativa' : d.periodo + 'º período';
    var tags = '<span class="tag ' + (CORES_PERIODO[d.periodo] || '') + '">' + per + '</span>';
    var extras = '';
    if (pronta) {
      if (d.simuladores) extras += '<span class="tag info" title="Simuladores interativos">simuladores</span>';
      if (d.normas) extras += '<span class="tag warn" title="Normas técnicas">normas</span>';
    } else {
      extras += '<span class="tag" title="Página ainda não construída">em breve</span>';
    }
    a.innerHTML =
      '<div class="card-top">' + tags + extras + '</div>' +
      '<h3>' + d.nome + '</h3>' +
      '<p>' + (d.resumo || '') + '</p>';
    a.dataset.busca = (d.nome + ' ' + (d.resumo || '') + ' ' + (d.temas || []).join(' ')).toLowerCase();
    return a;
  }

  var LS_GRUPO = 'engmec:agrupar';
  var NOMES_PERIODO = {
    '1': '1º período', '2': '2º período', '3': '3º período', '4': '4º período',
    '5': '5º período', '6': '6º período', '7': '7º período',
    '9': '9º período', '10': '10º período', '0': 'Optativas e complementares'
  };
  var ORDEM_PERIODO = ['1', '2', '3', '4', '5', '6', '7', '9', '10', '0'];
  function numPeriodo(p) { return p === '0' ? 99 : +p; }

  function lerGrupo() {
    try { return localStorage.getItem(LS_GRUPO) || 'periodo'; } catch (e) { return 'periodo'; }
  }
  function gravarGrupo(g) {
    try { localStorage.setItem(LS_GRUPO, g); } catch (e) { /* ignora */ }
  }

  /* agrupa uma lista de itens (disciplinas ou simulações) por período ou por matéria */
  function agrupar(itens, modo, materias) {
    var grupos = [];
    if (modo === 'materia') {
      (materias || []).forEach(function (m) {
        var doGrupo = itens.filter(function (d) { return d.materia === m; });
        doGrupo.sort(function (a, b) {
          return numPeriodo(a.periodo) - numPeriodo(b.periodo) || (a.ordem || 0) - (b.ordem || 0) ||
                 String(a.nome || a.titulo).localeCompare(String(b.nome || b.titulo), 'pt');
        });
        if (doGrupo.length) grupos.push({ nome: m, itens: doGrupo });
      });
    } else {
      ORDEM_PERIODO.forEach(function (p) {
        var doGrupo = itens.filter(function (d) { return String(d.periodo) === p; });
        if (doGrupo.length) grupos.push({ nome: NOMES_PERIODO[p], itens: doGrupo });
      });
    }
    return grupos;
  }

  /* botões "Por período | Por matéria" */
  function ligarAlternador(host, aoMudar) {
    var alt = document.querySelector('[data-alternar-grupo]');
    if (!alt) return lerGrupo();
    var modo = lerGrupo();
    function marcar() {
      alt.querySelectorAll('button').forEach(function (b) {
        var on = b.dataset.grupo === modo;
        b.classList.toggle('ativo', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var leg = document.getElementById('catalogo-legenda');
      var sims = !!document.getElementById('sim-catalogo');
      if (leg) leg.textContent = modo === 'materia'
        ? (sims ? 'Agrupadas por matéria: as simulações de Termodinâmica I e II, por exemplo, ficam juntas.'
                : 'Agrupadas por matéria: disciplinas da mesma área ficam juntas, como Termodinâmica I e II.')
        : (sims ? 'Organizadas pelo período da disciplina.' : 'Organizadas por período do curso.');
    }
    alt.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-grupo]');
      if (!b || b.dataset.grupo === modo) return;
      modo = b.dataset.grupo; gravarGrupo(modo); marcar(); aoMudar(modo);
    });
    marcar();
    return modo;
  }

  /* filtro de busca que sobrevive a re-renderizações */
  function ligarBusca(host) {
    var busca = document.getElementById('busca');
    function aplicar() {
      var t = busca ? busca.value.trim().toLowerCase() : '';
      host.querySelectorAll('.card').forEach(function (c) {
        c.style.display = !t || (c.dataset.busca || '').indexOf(t) >= 0 ? '' : 'none';
      });
      host.querySelectorAll('.grid').forEach(function (g) {
        var vis = Array.prototype.filter.call(g.children, function (c) { return c.style.display !== 'none'; }).length;
        g.style.display = vis ? '' : 'none';
        var head = g.previousElementSibling;
        if (head && head.classList.contains('period-head')) head.style.display = vis ? '' : 'none';
      });
    }
    if (busca) busca.addEventListener('input', aplicar);
    return aplicar;
  }

  function cabecalhoGrupo(host, nome, n, rotulo) {
    var head = document.createElement('div');
    head.className = 'period-head';
    head.innerHTML = '<h2>' + nome + '</h2><span>' + n + ' ' + rotulo + (n === 1 ? '' : 's') + '</span>';
    host.appendChild(head);
    var grid = document.createElement('div');
    grid.className = 'grid cols-3';
    host.appendChild(grid);
    return grid;
  }

  function initCatalogo() {
    var host = document.getElementById('catalogo');
    if (!host) return;
    var base = host.dataset.base || '';
    fetch(base + 'data/disciplinas.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        var lista = dados.disciplinas || dados;
        var aplicarBusca = ligarBusca(host);
        function render(modo) {
          host.innerHTML = '';
          agrupar(lista, modo, dados.materias).forEach(function (g) {
            var grid = cabecalhoGrupo(host, g.nome, g.itens.length, 'disciplina');
            g.itens.forEach(function (d) { grid.appendChild(cardDisciplina(d, base)); });
          });
          aplicarBusca();
        }
        render(ligarAlternador(host, render));
        var total = document.getElementById('total-disciplinas');
        if (total) total.textContent = lista.length;
      })
      .catch(function (err) {
        console.error(err);
        host.innerHTML = '<div class="card"><p><strong>Não foi possível carregar o catálogo.</strong></p>' +
          '<p style="font-size:.9rem;color:var(--text-muted)">Rode o site por um servidor local ' +
          '(<code>python -m http.server</code>) ou publique no GitHub Pages.</p></div>';
      });
  }

  /* ---------- catálogo de simulações (simulacoes.html) ---------- */
  function cardSimulacao(s, base) {
    var a = document.createElement('a');
    a.className = 'card card-link card-sim';
    a.href = base + 'disciplinas/' + s.slug + '.html?sim=' + s.id;
    var per = s.periodo === '0' ? 'Optativa' : s.periodo + 'º período';
    var tambem = s.tambem && s.tambem.length
      ? '<p class="sim-tambem">também em ' + s.tambem.map(function (t) { return t.disciplina; }).join(', ') + '</p>' : '';
    a.innerHTML =
      '<div class="card-top"><span class="tag accent">' + s.disciplina + '</span><span class="tag">' + per + '</span></div>' +
      '<h3>' + s.titulo + '</h3><p>' + s.resumo + '</p>' + tambem +
      '<span class="sim-abrir">Abrir simulação →</span>';
    a.dataset.busca = (s.titulo + ' ' + s.resumo + ' ' + s.disciplina + ' ' + (s.materia || '')).toLowerCase();
    return a;
  }

  /* ordem canônica das simulações: por matéria, período e posição na página */
  function ordenarSimulacoes(sims, materias) {
    var ordem = [];
    agrupar(sims, 'materia', materias).forEach(function (g) { ordem = ordem.concat(g.itens); });
    return ordem;
  }

  function initCatalogoSim() {
    var host = document.getElementById('sim-catalogo');
    if (!host) return;
    var base = host.dataset.base || '';
    Promise.all([
      fetch(base + 'data/simulacoes.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
      fetch(base + 'data/disciplinas.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })
    ]).then(function (res) {
      var sims = res[0].simulacoes, materias = res[1].materias;
      var aplicarBusca = ligarBusca(host);
      function render(modo) {
        host.innerHTML = '';
        agrupar(sims, modo, materias).forEach(function (g) {
          var grid = cabecalhoGrupo(host, g.nome, g.itens.length, 'simulação');
          g.itens.forEach(function (s) { grid.appendChild(cardSimulacao(s, base)); });
        });
        aplicarBusca();
      }
      render(ligarAlternador(host, render));
      var total = document.getElementById('total-simulacoes');
      if (total) total.textContent = sims.length;
      var sorteio = document.getElementById('sim-sorteio');
      if (sorteio) sorteio.addEventListener('click', function () {
        var s = sims[Math.floor(Math.random() * sims.length)];
        global.location.href = base + 'disciplinas/' + s.slug + '.html?sim=' + s.id;
      });
    }).catch(function (err) {
      console.error(err);
      host.innerHTML = '<div class="card"><p><strong>Não foi possível carregar as simulações.</strong></p></div>';
    });
  }

  /* barra do modo foco: voltar, anterior, próxima */
  function initFocoSim() {
    if (!SIM_FOCO) return;
    var caixa = document.getElementById('simuladores');
    var slug = (global.location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var nomeDisc = (document.querySelector('.hero h1') || {}).textContent || '';
    var barra = document.createElement('div');
    barra.className = 'foco-barra';
    barra.innerHTML =
      '<a class="btn sm ghost" href="../simulacoes.html">← Todas as simulações</a>' +
      '<span class="foco-disc">' + nomeDisc + ' · <a href="' + slug + '.html">ver a disciplina completa</a></span>' +
      '<span class="spacer"></span>' +
      '<a class="btn sm ghost" id="foco-ant" hidden>← Anterior</a>' +
      '<a class="btn sm primary" id="foco-prox" hidden>Próxima →</a>';
    caixa.insertBefore(barra, caixa.firstChild);
    global.scrollTo(0, 0);
    Promise.all([
      fetch('../data/simulacoes.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }),
      fetch('../data/disciplinas.json', { cache: 'no-cache' }).then(function (r) { return r.json(); })
    ]).then(function (res) {
      var ordem = ordenarSimulacoes(res[0].simulacoes, res[1].materias);
      var i = -1;
      ordem.forEach(function (s, j) {
        if (s.id === SIM_FOCO && (s.slug === slug || (s.tambem || []).some(function (t) { return t.slug === slug; }))) i = j;
      });
      if (i < 0) return;
      function ligar(el, s) {
        if (!s) return;
        el.href = s.slug + '.html?sim=' + s.id;
        el.title = s.titulo + ' — ' + s.disciplina;
        el.hidden = false;
      }
      ligar(document.getElementById('foco-ant'), ordem[i - 1]);
      ligar(document.getElementById('foco-prox'), ordem[i + 1]);
    }).catch(function () { /* sem navegação: a barra continua útil */ });
  }

  /* ---------- cabecalho/rodape compartilhados ---------- */
  function initHeader() {
    document.querySelectorAll('[data-ano]').forEach(function (e) {
      e.textContent = new Date().getFullYear();
    });
  }

  function init() {
    initTema();
    initTOC();
    initCatalogo();
    initCatalogoSim();
    initFocoSim();
    initHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.App = { aplicarTema: aplicarTema };
})(window);

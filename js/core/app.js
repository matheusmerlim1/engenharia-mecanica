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
    var per = d.periodo === '0' ? 'Optativa' : d.periodo + 'º periodo';
    var tags = '<span class="tag ' + (CORES_PERIODO[d.periodo] || '') + '">' + per + '</span>';
    var extras = '';
    if (pronta) {
      if (d.simuladores) extras += '<span class="tag info" title="Simuladores interativos">graficos</span>';
      if (d.normas) extras += '<span class="tag warn" title="Normas tecnicas">normas</span>';
    } else {
      extras += '<span class="tag" title="Pagina ainda nao construida">em breve</span>';
    }
    a.innerHTML =
      '<div class="card-top">' + tags + extras + '</div>' +
      '<h3>' + d.nome + '</h3>' +
      '<p>' + (d.resumo || '') + '</p>';
    a.dataset.busca = (d.nome + ' ' + (d.resumo || '') + ' ' + (d.temas || []).join(' ')).toLowerCase();
    return a;
  }

  function initCatalogo() {
    var host = document.getElementById('catalogo');
    if (!host) return;
    var base = host.dataset.base || '';
    fetch(base + 'data/disciplinas.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (dados) {
        render(dados.disciplinas || dados);
      })
      .catch(function (err) {
        console.error(err);
        host.innerHTML = '<div class="card"><p><strong>Nao foi possivel carregar o catalogo.</strong></p>' +
          '<p style="font-size:.9rem;color:var(--text-muted)">Rode o site por um servidor local ' +
          '(<code>python -m http.server</code>) ou publique no GitHub Pages.</p></div>';
      });

    function render(lista) {
      host.innerHTML = '';
      var ordem = ['1', '2', '3', '4', '5', '6', '7', '9', '10', '0'];
      var nomes = {
        '1': '1º periodo', '2': '2º periodo', '3': '3º periodo', '4': '4º periodo',
        '5': '5º periodo', '6': '6º periodo', '7': '7º periodo',
        '9': '9º periodo', '10': '10º periodo', '0': 'Optativas e complementares'
      };
      ordem.forEach(function (p) {
        var doPeriodo = lista.filter(function (d) { return String(d.periodo) === p; });
        if (!doPeriodo.length) return;
        var head = document.createElement('div');
        head.className = 'period-head';
        head.innerHTML = '<h2>' + nomes[p] + '</h2><span>' + doPeriodo.length + ' disciplinas</span>';
        host.appendChild(head);
        var grid = document.createElement('div');
        grid.className = 'grid cols-3';
        doPeriodo.forEach(function (d) { grid.appendChild(cardDisciplina(d, base)); });
        host.appendChild(grid);
      });

      var total = document.getElementById('total-disciplinas');
      if (total) total.textContent = lista.length;

      var busca = document.getElementById('busca');
      if (busca) {
        busca.addEventListener('input', function () {
          var t = busca.value.trim().toLowerCase();
          var vistos = {};
          host.querySelectorAll('.card').forEach(function (c) {
            var ok = !t || c.dataset.busca.indexOf(t) >= 0;
            c.style.display = ok ? '' : 'none';
          });
          host.querySelectorAll('.grid').forEach(function (g) {
            var visiveis = Array.prototype.filter.call(g.children, function (c) { return c.style.display !== 'none'; }).length;
            g.style.display = visiveis ? '' : 'none';
            var head = g.previousElementSibling;
            if (head && head.classList.contains('period-head')) head.style.display = visiveis ? '' : 'none';
          });
          void vistos;
        });
      }
    }
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
    initHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.App = { aplicarTema: aplicarTema };
})(window);

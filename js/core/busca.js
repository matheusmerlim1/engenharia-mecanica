/* ============================================================
   Busca na página — procura uma palavra no conteúdo e leva até ela
   ------------------------------------------------------------
   Funciona como o Ctrl+F do navegador, mas com duas vantagens que
   importam aqui: abre os blocos recolhidos (<details>) antes de
   procurar dentro deles, e conta as ocorrências para dar navegação
   com «anterior» e «próxima».

   Atalhos: Ctrl+K ou barra "/" abrem · Enter vai para a próxima ·
   Shift+Enter para a anterior · Esc fecha e limpa.
   ============================================================ */
(function (global) {
  'use strict';

  var CLASSE = 'busca-hit';
  var CLASSE_ATUAL = 'busca-hit-atual';

  /* não faz sentido procurar dentro destes */
  var IGNORAR = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CANVAS: 1, INPUT: 1,
                  TEXTAREA: 1, SELECT: 1, OPTION: 1 };

  function semAcento(t) {
    return t.normalize ? t.normalize('NFD').replace(/[̀-ͯ]/g, '') : t;
  }

  function montar() {
    var main = document.querySelector('main.wrap');
    if (!main) return;

    var caixa = document.createElement('div');
    caixa.className = 'busca';
    caixa.innerHTML =
      '<span class="busca-lupa" aria-hidden="true">⌕</span>' +
      '<input type="search" class="busca-campo" placeholder="Buscar nesta página…" ' +
      'aria-label="Buscar nesta página" autocomplete="off" spellcheck="false">' +
      '<button class="busca-nav" data-dir="-1" aria-label="Ocorrência anterior" title="Anterior (Shift+Enter)">‹</button>' +
      '<button class="busca-nav" data-dir="1" aria-label="Próxima ocorrência" title="Próxima (Enter)">›</button>' +
      '<span class="busca-conta" aria-live="polite"></span>' +
      '<button class="busca-fechar" aria-label="Limpar busca" title="Limpar (Esc)">×</button>';

    var alvo = main.querySelector('.page-layout') || main.firstElementChild;
    main.insertBefore(caixa, alvo);

    var campo = caixa.querySelector('.busca-campo');
    var conta = caixa.querySelector('.busca-conta');
    var marcas = [];
    var atual = -1;
    var abertosPorNos = [];

    function limparMarcas() {
      marcas.forEach(function (m) {
        var pai = m.parentNode;
        if (!pai) return;
        pai.replaceChild(document.createTextNode(m.textContent), m);
        pai.normalize();
      });
      marcas = [];
      atual = -1;
      abertosPorNos.forEach(function (d) { d.open = false; });
      abertosPorNos = [];
    }

    function marcar(termo) {
      limparMarcas();
      if (!termo || termo.length < 2) { conta.textContent = ''; return; }

      /* abre os blocos recolhidos para poder procurar dentro deles */
      var fechados = main.querySelectorAll('details:not([open])');
      Array.prototype.forEach.call(fechados, function (d) {
        if (semAcento(d.textContent).toLowerCase().indexOf(termo) >= 0) {
          d.open = true;
          abertosPorNos.push(d);
        }
      });

      var caminho = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode;
          while (p && p !== main) {
            if (IGNORAR[p.nodeName]) return NodeFilter.FILTER_REJECT;
            if (p.classList && p.classList.contains('busca')) return NodeFilter.FILTER_REJECT;
            p = p.parentNode;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      var textos = [];
      var no;
      while ((no = caminho.nextNode())) textos.push(no);

      textos.forEach(function (n) {
        var bruto = n.nodeValue;
        var alvoTxt = semAcento(bruto).toLowerCase();
        var pos = alvoTxt.indexOf(termo);
        if (pos < 0) return;
        var frag = document.createDocumentFragment();
        var i = 0;
        while (pos >= 0) {
          if (pos > i) frag.appendChild(document.createTextNode(bruto.slice(i, pos)));
          var mk = document.createElement('mark');
          mk.className = CLASSE;
          mk.textContent = bruto.slice(pos, pos + termo.length);
          frag.appendChild(mk);
          marcas.push(mk);
          i = pos + termo.length;
          pos = alvoTxt.indexOf(termo, i);
        }
        if (i < bruto.length) frag.appendChild(document.createTextNode(bruto.slice(i)));
        n.parentNode.replaceChild(frag, n);
      });

      conta.textContent = marcas.length ? '1 de ' + marcas.length : 'nenhum resultado';
      if (marcas.length) ir(0);
    }

    function ir(i) {
      if (!marcas.length) return;
      if (atual >= 0 && marcas[atual]) marcas[atual].classList.remove(CLASSE_ATUAL);
      atual = ((i % marcas.length) + marcas.length) % marcas.length;
      var m = marcas[atual];
      m.classList.add(CLASSE_ATUAL);
      /* garante que blocos recolhidos acima do alvo estejam abertos */
      var p = m.parentNode;
      while (p && p !== main) {
        if (p.nodeName === 'DETAILS' && !p.open) { p.open = true; abertosPorNos.push(p); }
        p = p.parentNode;
      }
      m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      conta.textContent = (atual + 1) + ' de ' + marcas.length;
    }

    var espera = null;
    campo.addEventListener('input', function () {
      clearTimeout(espera);
      espera = setTimeout(function () {
        marcar(semAcento(campo.value).toLowerCase().trim());
      }, 180);
    });
    campo.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); ir(atual + (ev.shiftKey ? -1 : 1)); }
      if (ev.key === 'Escape') { campo.value = ''; limparMarcas(); conta.textContent = ''; campo.blur(); }
    });
    Array.prototype.forEach.call(caixa.querySelectorAll('.busca-nav'), function (b) {
      b.addEventListener('click', function () { ir(atual + (+b.getAttribute('data-dir'))); });
    });
    caixa.querySelector('.busca-fechar').addEventListener('click', function () {
      campo.value = ''; limparMarcas(); conta.textContent = ''; campo.focus();
    });

    document.addEventListener('keydown', function (ev) {
      var dentroDeCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.nodeName);
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault(); campo.focus(); campo.select();
      } else if (ev.key === '/' && !dentroDeCampo) {
        ev.preventDefault(); campo.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }

  global.Busca = { montar: montar };
})(window);

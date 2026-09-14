/* ============================================================
   Formula — renderização matemática com KaTeX
   ------------------------------------------------------------
   Uso no HTML:
     <div class="formula">
       <span data-tex="\sigma = \frac{M\,c}{I}"></span>
       <span class="where">σ = tensão normal [MPa]</span>
     </div>

     <span data-tex-inline="r = \omega/\omega_n"></span>

   Uso no JS (painel de fórmulas do Sim):
     { tex: '\\eta = 1 - \\frac{T_C}{T_H}', d: 'rendimento de Carnot' }

   Se o KaTeX não carregar (offline), o texto cru fica visível como
   fallback legível — a página nunca quebra por causa disso.
   ============================================================ */
(function (global) {
  'use strict';

  var pendentes = [];
  var pronto = false;

  function renderEl(el, display) {
    var tex = el.getAttribute('data-tex') || el.getAttribute('data-tex-inline');
    if (!tex || el.getAttribute('data-tex-ok')) return;
    if (!global.katex) { pendentes.push([el, display]); return; }
    try {
      global.katex.render(tex, el, {
        displayMode: !!display,
        throwOnError: false,
        strict: false,
        trust: false,
        macros: {
          '\\dif': '\\mathrm{d}',
          '\\ang': '^\\circ'
        }
      });
      el.setAttribute('data-tex-ok', '1');
    } catch (e) {
      el.textContent = tex;
      el.setAttribute('data-tex-ok', 'erro');
    }
  }

  /* percorre o documento (ou um trecho) e renderiza tudo que falta */
  function render(raiz) {
    var r = raiz || document;
    r.querySelectorAll('[data-tex]:not([data-tex-ok])').forEach(function (el) { renderEl(el, true); });
    r.querySelectorAll('[data-tex-inline]:not([data-tex-ok])').forEach(function (el) { renderEl(el, false); });
  }

  /* cria um <span> já renderizado — usado pelo motor dos simuladores */
  function span(tex, display) {
    var e = document.createElement('span');
    e.className = display ? 'tex-block' : 'tex-inline';
    e.setAttribute(display ? 'data-tex' : 'data-tex-inline', tex);
    renderEl(e, display);
    return e;
  }

  function quandoPronto() {
    pronto = true;
    var lista = pendentes.slice();
    pendentes.length = 0;
    lista.forEach(function (par) { renderEl(par[0], par[1]); });
    render(document);
    document.documentElement.classList.add('katex-pronto');
  }

  /* carrega o KaTeX sob demanda, sem bloquear a página */
  function carregar() {
    if (global.katex) { quandoPronto(); return; }
    var base = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/';

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = base + 'katex.min.css';
    document.head.appendChild(css);

    var js = document.createElement('script');
    js.src = base + 'katex.min.js';
    js.defer = true;
    js.onload = quandoPronto;
    js.onerror = function () {
      /* sem internet: mostra o TeX cru, que ainda é legível */
      document.querySelectorAll('[data-tex],[data-tex-inline]').forEach(function (el) {
        if (el.getAttribute('data-tex-ok')) return;
        el.textContent = el.getAttribute('data-tex') || el.getAttribute('data-tex-inline');
        el.classList.add('tex-cru');
      });
      document.documentElement.classList.add('katex-pronto');
    };
    document.head.appendChild(js);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar);
  } else {
    carregar();
  }

  global.Formula = { render: render, span: span, estaPronto: function () { return pronto; } };
})(window);

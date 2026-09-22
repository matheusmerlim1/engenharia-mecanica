/* ============================================================
   Livro — organiza uma disciplina em capítulos, um por página
   ------------------------------------------------------------
   Páginas em formato de livro marcam cada capítulo com
     <section class="section capitulo" id="cap-1" data-parte="Parte I — ..." data-topicos="a,b">
       <p class="cap-kicker">Capítulo 1</p><h2>1. Título</h2> ... <h3 id="s1-1">1.1 ...</h3> ...
   Cada <section class="section"> vira uma página; seções com o mesmo data-pagina
   (o sumário e a introdução, data-pagina="inicio") dividem a mesma página.
   Só uma página aparece por vez, e o endereço guarda qual é (dinamica.html#cap-3),
   então voltar, favoritar e compartilhar o link funcionam como numa página comum.

   Este módulo monta:
     · a coluna da esquerda com o sumário navegável e as seções da página aberta;
     · no topo de cada página, setas ‹ › e "Capítulo 3 de 9"; no fim, anterior e próxima;
     · as setas ← → do teclado trocando de página;
     · o sumário da página inicial, com tempo de leitura e progresso;
     · "marcar como lido", "praticar este capítulo" e "continuar de onde parou";
     · os dois modos de leitura: completo (estudar a fundo) e resumo (relembrar).
   No resumo ficam só as fórmulas, as tabelas, os erros comuns, o resumo do capítulo
   e o que o autor marcar com class="essencial"; o resto ganha .so-completo.
   O progresso fica só no navegador (localStorage): se o armazenamento falhar,
   a página funciona igual, apenas sem lembrar.
   ============================================================ */
(function (global) {
  'use strict';

  var PALAVRAS_POR_MIN = 180;   /* leitura técnica, com fórmulas: mais lenta que texto corrido */
  var CH_MODO = 'engmec:livro:modo';
  var FICA_NO_RESUMO = '.cap-kicker, h2, h3, .formula, .table-scroll, .callout.warn, .cap-resumo, .essencial';

  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravar(chave, v) {
    try { localStorage.setItem(chave, JSON.stringify(v)); } catch (e) { /* sem memória */ }
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function duracao(m) { return m >= 90 ? (m / 60).toFixed(1).replace('.', ',') + ' h' : m + ' min'; }
  function irPara(y) { scrollTo({ top: Math.max(0, y), behavior: 'instant' }); }

  /* marca o que some no modo resumo */
  function marcarResumo(sec) {
    var filhos = Array.prototype.slice.call(sec.children);
    filhos.forEach(function (el) { if (!el.matches(FICA_NO_RESUMO)) el.classList.add('so-completo'); });
    /* título de seção que ficaria vazio no resumo também sai */
    filhos.forEach(function (el, i) {
      if (el.tagName !== 'H3') return;
      for (var j = i + 1; j < filhos.length && !/^H[23]$/.test(filhos[j].tagName); j++) {
        if (!filhos[j].classList.contains('so-completo') && !filhos[j].classList.contains('cap-resumo')) return;
      }
      el.classList.add('so-completo');
    });
  }

  function minutos(sec, resumo) {
    var clone = sec.cloneNode(true);
    clone.querySelectorAll('.sim, .cap-rodape, .pag-topo, .cap-aprofundar, .katex-mathml, script' + (resumo ? ', .so-completo' : '')).forEach(function (n) { n.remove(); });
    var n = (clone.textContent || '').split(/\s+/).filter(Boolean).length;
    return Math.max(resumo ? 1 : 3, Math.round(n / PALAVRAS_POR_MIN));
  }

  function montar() {
    var caps = Array.prototype.slice.call(document.querySelectorAll('main .capitulo'));
    if (!caps.length || document.documentElement.classList.contains('modo-sim')) return;

    var slug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '') || 'livro';
    var CH_LIDOS = 'engmec:livro:' + slug + ':lidos';
    var CH_ULTIMO = 'engmec:livro:' + slug + ':ultimo';
    var lidos = ler(CH_LIDOS, []);
    var nomeDisc = (document.querySelector('.hero h1') || {}).textContent || '';
    var tituloDoc = document.title;

    caps.forEach(marcarResumo);
    var intro = document.getElementById('introducao');
    if (intro) marcarResumo(intro);

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
          return { id: h.id, t: t, el: h };
        }),
        min: minutos(c),
        minR: minutos(c, true)
      };
    });
    var total = info.reduce(function (s, c) { return s + c.min; }, 0);
    var totalR = info.reduce(function (s, c) { return s + c.minR; }, 0);
    var tagTempo = document.getElementById('livro-tempo');
    if (tagTempo) tagTempo.textContent = '≈ ' + duracao(total) + ' de leitura';

    /* ---------- páginas ---------- */
    var paginas = [], porId = {};
    Array.prototype.slice.call(document.querySelectorAll('main .section[id]')).forEach(function (s) {
      var id = s.dataset.pagina || s.id;
      var p = porId[id];
      if (!p) { p = porId[id] = { id: id, secoes: [] }; paginas.push(p); }
      p.secoes.push(s);
      s.classList.add('pagina');
      s.dataset.pagina = id;
    });
    paginas.forEach(function (p, i) {
      p.i = i;
      var s0 = p.secoes[0];
      p.cap = info.filter(function (c) { return c.el === s0; })[0] || null;
      var h2 = (s0.querySelector('h2') || {}).textContent || s0.id;
      if (p.id === 'inicio') { p.rotulo = 'Início'; p.titulo = 'Sumário e introdução'; }
      else if (p.cap) { p.rotulo = 'Capítulo ' + p.cap.num; p.titulo = p.cap.titulo; }
      else if (h2.indexOf(' — ') > 0) { p.rotulo = h2.split(' — ')[0].trim(); p.titulo = h2.split(' — ').slice(1).join(' — ').trim(); }
      else { p.rotulo = ''; p.titulo = h2.trim(); }
      p.ultima = p.secoes[p.secoes.length - 1];
    });
    function onde(p) {
      return p.cap ? 'Capítulo ' + p.cap.num + ' de ' + info.length : (p.rotulo || p.titulo);
    }
    function linkNav(p, sentido) {
      if (!p) return '<span></span>';
      var seta = sentido === 'ant' ? '← ' : '';
      var seta2 = sentido === 'prox' ? ' →' : '';
      return '<a class="cap-nav cap-' + sentido + '" href="#' + p.id + '"><small>' + seta +
        (sentido === 'ant' ? 'Anterior' : 'Próxima') + (p.rotulo ? ' · ' + esc(p.rotulo) : '') + seta2 + '</small>' + esc(p.titulo) + '</a>';
    }

    /* ---------- topo e rodapé de cada página ---------- */
    paginas.forEach(function (p, i) {
      var ant = paginas[i - 1], prox = paginas[i + 1];
      if (p.id !== 'inicio') {
        var topo = document.createElement('div');
        topo.className = 'pag-topo';
        topo.innerHTML =
          (ant ? '<a class="pag-seta" href="#' + ant.id + '" title="' + esc(ant.rotulo ? ant.rotulo + ' — ' + ant.titulo : ant.titulo) + '" aria-label="Página anterior">‹</a>'
               : '<span class="pag-seta" aria-hidden="true"></span>') +
          '<span class="pag-onde"><a href="#sumario">' + esc(nomeDisc) + '</a> · ' + esc(onde(p)) + '</span>' +
          (prox ? '<a class="pag-seta" href="#' + prox.id + '" title="' + esc(prox.rotulo ? prox.rotulo + ' — ' + prox.titulo : prox.titulo) + '" aria-label="Próxima página">›</a>'
                : '<span class="pag-seta" aria-hidden="true"></span>');
        p.secoes[0].insertBefore(topo, p.secoes[0].firstChild);
      }
      var rod = document.createElement('nav');
      rod.className = 'cap-rodape';
      rod.setAttribute('aria-label', 'Navegação entre páginas');
      var c = p.cap;
      rod.innerHTML = linkNav(ant, 'ant') +
        (c ? '<div class="cap-meio">' +
              '<button type="button" class="btn sm cap-lido" aria-pressed="false"></button>' +
              (c.topicos.length && document.getElementById('quiz')
                ? '<button type="button" class="btn sm ghost cap-praticar">Praticar questões deste capítulo</button>' : '') +
            '</div>' : '<span></span>') +
        (prox ? linkNav(prox, 'prox') : '<a class="cap-nav cap-prox" href="#inicio-livro"><small>Fim · voltar ao</small>Início</a>');
      p.ultima.appendChild(rod);
      if (!c) return;

      var btn = rod.querySelector('.cap-lido');
      btn.addEventListener('click', function () {
        var k = lidos.indexOf(c.id);
        if (k >= 0) lidos.splice(k, 1); else lidos.push(c.id);
        gravar(CH_LIDOS, lidos);
        atualizar();
        if (k < 0 && global.matchMedia && !global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          btn.classList.add('cap-lido-pulso');
          setTimeout(function () { btn.classList.remove('cap-lido-pulso'); }, 600);
        }
      });
      var prat = rod.querySelector('.cap-praticar');
      if (prat) prat.addEventListener('click', function () { praticar(slug, c); });

      /* no resumo: atalho para ler este capítulo por inteiro */
      var cr = c.el.querySelector('.cap-resumo');
      var apr = document.createElement('p');
      apr.className = 'cap-aprofundar';
      apr.innerHTML = '<button type="button" class="btn sm">Ler o capítulo ' + c.num + ' completo, com explicações e exemplos →</button>';
      if (cr) cr.parentNode.insertBefore(apr, cr.nextSibling); else c.el.insertBefore(apr, rod);
      apr.querySelector('button').addEventListener('click', function () { definirModo('completo', c.el, true); });
    });

    /* ---------- sumário da página inicial ---------- */
    var sum = document.getElementById('sumario-lista');
    var barraProg, textoProg, btnContinuar;
    if (sum) {
      var st = document.createElement('div');
      st.className = 'sumario-topo';
      st.innerHTML =
        '<div class="sumario-prog"><div class="sumario-prog-barra"><span></span></div>' +
        '<span class="sumario-prog-txt"></span></div>' +
        '<a class="btn sm primary" id="livro-continuar" hidden></a>';
      sum.parentNode.insertBefore(st, sum);
      barraProg = st.querySelector('.sumario-prog-barra span');
      textoProg = st.querySelector('.sumario-prog-txt');
      btnContinuar = st.querySelector('#livro-continuar');

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
            '<a class="sumario-titulo" href="#' + c.id + '">' + esc(c.titulo) + '</a>' +
            '<span class="sumario-min">' + c.min + ' min</span>' +
            '<span class="sumario-ok" title="Capítulo lido" aria-label="Capítulo lido">✓</span>' +
          '</div>' +
          (c.secoes.length ? '<div class="sumario-secoes">' + c.secoes.map(function (s) {
            return '<a href="#' + s.id + '">' + esc(s.t) + '</a>';
          }).join('') + '</div>' : '');
        lista.appendChild(li);
      });
      var extras = paginas.filter(function (p) { return !p.cap && p.id !== 'inicio'; });
      if (extras.length) {
        var he = document.createElement('p');
        he.className = 'sumario-parte';
        he.textContent = 'Apêndices';
        sum.appendChild(he);
        var ul = document.createElement('div');
        ul.className = 'sumario-extras';
        ul.innerHTML = extras.map(function (p) {
          return '<a href="#' + p.id + '">' + (p.rotulo ? '<small>' + esc(p.rotulo) + '</small>' : '') + esc(p.titulo) + '</a>';
        }).join('');
        sum.appendChild(ul);
      }
    }

    /* ---------- coluna da esquerda ---------- */
    var toc = document.querySelector('.toc');
    if (toc) {
      toc.innerHTML = '';
      toc.classList.add('toc-livro');
      var nav = document.createElement('nav');
      nav.setAttribute('aria-label', 'Capítulos');
      var html = '<h4>' + esc(nomeDisc) + '</h4><a class="toc-pag" data-pag="inicio" href="#inicio-livro">Início · sumário</a>';
      var parte = null, apendices = false;
      paginas.forEach(function (p) {
        if (p.id === 'inicio') return;
        if (p.cap && p.cap.parte !== parte) { parte = p.cap.parte; html += '<p class="toc-parte">' + esc(parte) + '</p>'; }
        if (!p.cap && !apendices) { apendices = true; html += '<p class="toc-parte">Apêndices</p>'; }
        html += '<a class="toc-pag" data-pag="' + p.id + '" href="#' + p.id + '">' +
          (p.cap ? '<span class="toc-num">' + p.cap.num + '</span>' : '') + '<span>' + esc(p.titulo) + '</span></a>';
        if (p.cap && p.cap.secoes.length) {
          html += '<div class="toc-secoes" data-de="' + p.id + '">' + p.cap.secoes.map(function (s) {
            return '<a href="#' + s.id + '" data-sec="' + s.id + '">' + esc(s.t) + '</a>';
          }).join('') + '</div>';
        }
      });
      nav.innerHTML = html;
      toc.appendChild(nav);
    }

    function atualizar() {
      info.forEach(function (c) {
        var lido = lidos.indexOf(c.id) >= 0;
        var b = c.el.querySelector('.cap-lido');
        if (b) {
          b.textContent = lido ? '✓ Capítulo lido' : 'Marcar como lido';
          b.setAttribute('aria-pressed', String(lido));
          b.classList.toggle('ok', lido);
        }
        var li = sum && sum.querySelector('[data-cap="' + c.id + '"]');
        if (li) li.classList.toggle('lido', lido);
        var tl = toc && toc.querySelector('.toc-pag[data-pag="' + c.id + '"]');
        if (tl) tl.classList.toggle('lido', lido);
      });
      var n = info.filter(function (c) { return lidos.indexOf(c.id) >= 0; }).length;
      if (barraProg) barraProg.style.width = (100 * n / info.length) + '%';
      if (textoProg) textoProg.textContent = n === info.length
        ? 'Todos os ' + info.length + ' capítulos lidos'
        : n + ' de ' + info.length + ' capítulos lidos';
    }
    atualizar();

    /* ---------- seletor de modo: um na abertura, outro fixo nas demais páginas ---------- */
    function seletor(classe) {
      var g = document.createElement('div');
      g.className = 'modo-leitura ' + classe;
      g.setAttribute('role', 'group');
      g.setAttribute('aria-label', 'Modo de leitura');
      g.innerHTML =
        '<button type="button" data-modo="completo"><strong>Completo</strong><small>estudar a fundo · ' + duracao(total) + '</small></button>' +
        '<button type="button" data-modo="resumo"><strong>Resumo</strong><small>só relembrar · ' + duracao(totalR) + '</small></button>';
      g.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { definirModo(b.dataset.modo); });
      });
      return g;
    }
    var hero = document.querySelector('.hero');
    if (hero) {
      var bloco = document.createElement('div');
      bloco.className = 'modo-bloco';
      bloco.innerHTML = '<p class="modo-pergunta">Como você quer ler?</p>';
      bloco.appendChild(seletor('modo-grande'));
      hero.appendChild(bloco);
    }
    var flutuante = seletor('modo-flutuante');
    document.body.appendChild(flutuante);

    var modo = 'completo';
    /* posição de leitura: o último título visível que já passou do topo */
    function ancora() {
      var hs = document.querySelectorAll('main .capitulo > h2, main .capitulo > h3');
      var a = null;
      for (var i = 0; i < hs.length; i++) {
        if (!hs[i].getClientRects().length) continue;
        if (hs[i].getBoundingClientRect().top <= 120) a = hs[i]; else if (a) break;
      }
      return a;
    }
    function definirModo(novo, alvo, rolarAte) {
      if (novo !== 'resumo') novo = 'completo';
      var a = alvo || (rolarAte === false ? null : ancora());
      var dy = a ? a.getBoundingClientRect().top : 0;
      modo = novo;
      document.documentElement.classList.toggle('modo-resumo', modo === 'resumo');
      document.querySelectorAll('.modo-leitura button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.modo === modo));
      });
      info.forEach(function (c) {
        var li = sum && sum.querySelector('[data-cap="' + c.id + '"] .sumario-min');
        if (li) li.textContent = (modo === 'resumo' ? c.minR : c.min) + ' min';
      });
      gravar(CH_MODO, modo);
      if (a) {
        /* se o título sumiu no resumo, ancora no capítulo dele */
        if (!a.getClientRects().length) { a = a.closest('.capitulo'); dy = 90; }
        if (rolarAte) dy = 70;
        irPara(a.getBoundingClientRect().top + scrollY - dy);
      }
      if (atual) rolar();
    }

    /* ---------- mostrar uma página ---------- */
    var atual = null;
    var barra = document.createElement('div');
    barra.className = 'livro-barra';
    barra.innerHTML = '<span></span>';
    document.body.appendChild(barra);
    var fill = barra.firstChild;

    function mostrar(p, alvo, opts) {
      opts = opts || {};
      var trocou = p !== atual;
      atual = p;
      paginas.forEach(function (q) {
        q.secoes.forEach(function (s) { s.classList.toggle('pag-oculta', q !== p); });
      });
      document.documentElement.classList.add('livro-paginado');
      document.documentElement.classList.toggle('pag-inicio', p.id === 'inicio');
      document.title = p.id === 'inicio' ? tituloDoc : (p.rotulo ? p.rotulo + ' — ' : '') + p.titulo + ' · ' + tituloDoc;
      if (toc) {
        toc.querySelectorAll('.toc-pag').forEach(function (a) { a.classList.toggle('active', a.dataset.pag === p.id); });
        toc.querySelectorAll('.toc-secoes').forEach(function (d) { d.hidden = d.dataset.de !== p.id; });
      }
      if (p.cap) gravar(CH_ULTIMO, p.id);
      if (!opts.semRolar) {
        if (alvo && alvo.getClientRects().length) irPara(alvo.getBoundingClientRect().top + scrollY - 80);
        else if (trocou || !alvo) {
          var ini = p.id === 'inicio' ? 0 : document.querySelector('main').getBoundingClientRect().top + scrollY - 70;
          irPara(ini);
        }
      }
      rolar();
    }

    function paginaDe(el) {
      var s = el && el.closest ? el.closest('.pagina') : null;
      return s ? porId[s.dataset.pagina] : null;
    }
    function rota() {
      var h = decodeURIComponent(location.hash.slice(1));
      if (!h || h === 'inicio-livro') return mostrar(porId.inicio || paginas[0]);
      var el = document.getElementById(h);
      var p = porId[h] || paginaDe(el);
      if (!p) return mostrar(atual || porId.inicio || paginas[0]);
      /* link para uma seção escondida pelo resumo: mostra o completo */
      if (el && modo === 'resumo' && el.closest('.so-completo')) definirModo('completo', null, false);
      mostrar(p, el && el !== p.secoes[0] ? el : null);
    }
    addEventListener('hashchange', rota);
    /* clicar de novo no link da página aberta não dispara hashchange: trata aqui */
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a || ev.defaultPrevented || ev.button || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      if (a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#inicio-livro' && !location.hash)) {
        ev.preventDefault();
        rota();
      }
    });
    /* setas do teclado: fora de campos, sliders e simuladores */
    document.addEventListener('keydown', function (ev) {
      if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey || !atual) return;
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      var t = ev.target;
      if (t && t.closest && (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(t.tagName) || t.isContentEditable || t.closest('.sim, .quiz-root'))) return;
      var p = paginas[atual.i + (ev.key === 'ArrowRight' ? 1 : -1)];
      if (!p) return;
      ev.preventDefault();
      location.hash = p.id === 'inicio' ? 'inicio-livro' : p.id;
    });
    /* a busca achou algo em outra página ou escondido pelo resumo */
    document.addEventListener('busca-oculto', function (ev) {
      if (modo === 'resumo' && ev.target.closest('.so-completo')) definirModo('completo', null, false);
      var p = paginaDe(ev.target);
      if (p && p !== atual) {
        history.replaceState(null, '', '#' + (p.id === 'inicio' ? 'inicio-livro' : p.id));
        mostrar(p, null, { semRolar: true });
      }
    });

    /* ---------- barra de leitura e seção corrente ---------- */
    var agendado = false;
    function rolar() {
      agendado = false;
      if (!atual) return;
      var s0 = atual.secoes[0], s1 = atual.ultima;
      var y0 = s0.getBoundingClientRect().top + scrollY;
      var y1 = s1.getBoundingClientRect().bottom + scrollY - innerHeight;
      var f = Math.min(1, Math.max(0, (scrollY - y0 + 100) / Math.max(1, y1 - y0 + 100)));
      fill.style.width = (f * 100) + '%';
      barra.classList.toggle('visivel', !!atual.cap);
      flutuante.classList.toggle('visivel', atual.id !== 'inicio');
      if (toc && atual.cap) {
        var sec = null;
        atual.cap.secoes.forEach(function (s) {
          if (s.el.getClientRects().length && s.el.getBoundingClientRect().top < innerHeight * 0.35) sec = s.id;
        });
        toc.querySelectorAll('[data-sec]').forEach(function (a) { a.classList.toggle('active', a.dataset.sec === sec); });
      }
    }
    addEventListener('scroll', function () {
      if (!agendado) { agendado = true; requestAnimationFrame(rolar); }
    }, { passive: true });

    /* ---------- estado inicial ---------- */
    var pedido = /[?&]modo=(resumo|completo)/.exec(location.search);
    definirModo(pedido ? pedido[1] : ler(CH_MODO, 'completo'), null, false);

    var ultimo = ler(CH_ULTIMO, null);
    var cUlt = info.filter(function (c) { return c.id === ultimo; })[0];
    if (btnContinuar) {
      btnContinuar.href = '#' + (cUlt ? cUlt.id : info[0].id);
      btnContinuar.textContent = cUlt && cUlt.num > 1 ? 'Continuar no capítulo ' + cUlt.num + ' →' : 'Começar pelo capítulo 1 →';
      btnContinuar.hidden = false;
    }
    rota();
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
    var aviso = document.getElementById('livro-aviso-quiz');
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.id = 'livro-aviso-quiz';
      aviso.className = 'livro-aviso-quiz';
      host.parentNode.insertBefore(aviso, host);
    }
    aviso.innerHTML = 'Simulado filtrado pelo <strong>capítulo ' + c.num + ' — ' + esc(c.titulo) +
      '</strong>. Para voltar a todas as questões, marque todos os tópicos no painel.';
    location.hash = 'simulado';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})(window);

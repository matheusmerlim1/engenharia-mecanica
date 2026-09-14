/* ============================================================
   Sim - construtor de simuladores interativos
   Monta painel de controles + area de graficos e re-executa
   o modelo a cada mudanca de parametro.

   Uso:
     Sim.build('#meu-sim', {
       titulo: 'Perda de carga',
       descricao: 'Ajuste os parametros da tubulacao.',
       controles: [
         { id:'D', label:'Diametro', min:10, max:300, step:1, valor:50, unidade:'mm' },
         { id:'mat', label:'Material', tipo:'select', valor:'aco',
           opcoes:[{v:'aco',t:'Aco comercial'},{v:'pvc',t:'PVC'}] }
       ],
       graficos: [{ id:'g1', xlabel:'Q (L/s)', ylabel:'hf (m)' }],
       saidas: ['Re','f','hf'],
       calcular: function(p, ctx){ ... ctx.plot('g1').clear().line(...).draw();
                                   return { Re:{v:..., u:''}, ... }; }
     });
   ============================================================ */
(function (global) {
  'use strict';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function fmtVal(v, step) {
    if (typeof v !== 'number') return String(v);
    var dec = 0;
    if (step && step < 1) dec = Math.min(4, Math.max(0, Math.ceil(-Math.log10(step))));
    return v.toFixed(dec);
  }

  function build(target, cfg) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) { console.warn('Sim.build: alvo nao encontrado', target); return null; }

    var root = el('div', 'sim');

    if (cfg.titulo || cfg.descricao) {
      var head = el('div', 'sim-head');
      if (cfg.titulo) head.appendChild(el('h3', null, cfg.titulo));
      if (cfg.descricao) head.appendChild(el('p', null, cfg.descricao));
      root.appendChild(head);
    }

    var body = el('div', 'sim-body' + (cfg.controlesLargos ? ' wide-controls' : ''));
    var pane = el('div', 'sim-controls');
    var area = el('div', 'sim-canvas-area');
    body.appendChild(pane); body.appendChild(area);
    root.appendChild(body);

    /* ---------- painel de formulas ----------
       cfg.formulas aceita:
         { g: 'Nome do grupo' }                     -> cabecalho
         { f: 'expressao', d: 'o que significa' }   -> formula
         'texto solto'                              -> paragrafo
       e pode ser atualizado dinamicamente por ctx.setFormulas([...]). */
    var formBody = null;
    function renderFormulas(lista) {
      if (!formBody) return;
      formBody.innerHTML = '';
      (lista || []).forEach(function (item) {
        if (typeof item === 'string') {
          formBody.appendChild(el('p', 'sim-form-txt', item));
          return;
        }
        if (item.g) { formBody.appendChild(el('h4', 'sim-form-grupo', item.g)); return; }
        if (item.sep) { formBody.appendChild(el('hr', 'ctrl-sep')); return; }
        var linha = el('div', 'sim-form' + (item.destaque ? ' destaque' : ''));
        if (item.tex && global.Formula) {
          linha.appendChild(global.Formula.span(item.tex, true));
        } else if (item.tex) {
          var sp = el('span', 'tex-block');
          sp.setAttribute('data-tex', item.tex);
          linha.appendChild(sp);
        } else {
          linha.appendChild(el('code', null, item.f));
        }
        if (item.d) linha.appendChild(el('span', 'd', item.d));
        if (item.v !== undefined && item.v !== null) linha.appendChild(el('span', 'v', item.v));
        formBody.appendChild(linha);
      });
    }
    if (cfg.formulas) {
      var det = el('details', 'sim-formulas');
      det.open = cfg.formulasAbertas !== false;
      det.appendChild(el('summary', null, cfg.formulasTitulo || 'Fórmulas do modelo'));
      formBody = el('div', 'sim-formulas-body');
      det.appendChild(formBody);
      root.appendChild(det);
      renderFormulas(cfg.formulas);
      if (global.Formula) global.Formula.render(det);
    }

    /* ---------- painel de resolucao passo a passo ----------
       cfg.passos / ctx.setPassos([{ t:'titulo', c:'conta', r:'resultado' }]) */
    var passosBody = null;
    function renderPassos(lista) {
      if (!passosBody) return;
      passosBody.innerHTML = '';
      (lista || []).forEach(function (item, i) {
        if (typeof item === 'string') {
          passosBody.appendChild(el('p', 'sim-form-txt', item));
          return;
        }
        if (item.g) { passosBody.appendChild(el('h4', 'sim-form-grupo', item.g)); return; }
        var d = el('div', 'passo-item');
        var n = el('span', 'n', String(item.n !== undefined ? item.n : (i + 1)));
        var corpo = el('div', 'corpo');
        if (item.t) corpo.appendChild(el('div', 't', item.t));
        if (item.tex && global.Formula) {
          var cx = el('div', 'c-tex');
          cx.appendChild(global.Formula.span(item.tex, true));
          corpo.appendChild(cx);
        }
        if (item.texSub && global.Formula) {
          var cs = el('div', 'c-tex sub');
          cs.appendChild(global.Formula.span(item.texSub, true));
          corpo.appendChild(cs);
        }
        if (item.c) corpo.appendChild(el('code', 'c', item.c));
        if (item.r) corpo.appendChild(el('div', 'r', item.r));
        if (item.obs) corpo.appendChild(el('div', 'obs', item.obs));
        d.appendChild(n); d.appendChild(corpo);
        passosBody.appendChild(d);
      });
    }
    if (cfg.passos) {
      var dp = el('details', 'sim-formulas sim-passos');
      dp.open = cfg.passosAbertos !== false;
      dp.appendChild(el('summary', null, cfg.passosTitulo || 'Resolução passo a passo'));
      passosBody = el('div', 'sim-formulas-body sim-passos-body');
      dp.appendChild(passosBody);
      root.appendChild(dp);
      renderPassos(cfg.passos);
      if (global.Formula) global.Formula.render(dp);
    }

    if (cfg.nota) root.appendChild(el('div', 'sim-nota', cfg.nota));

    host.innerHTML = '';
    host.appendChild(root);

    var params = {};
    var refs = {};
    var mapaCtrl = {};
    (cfg.controles || []).forEach(function (c) { if (c.id) mapaCtrl[c.id] = c; });

    /* ---------- exemplos resolvidos ----------
       cfg.exemplos = [{ nome, desc, valores:{id:valor,...} }] */
    var exemploAtivo = null;
    if (cfg.exemplos && cfg.exemplos.length) {
      var cx = el('div', 'sim-exemplos');
      cx.appendChild(el('p', 'ctrl-title', cfg.exemplosTitulo || 'Exemplos resolvidos'));
      var lista = el('div', 'ex-botoes');
      cfg.exemplos.forEach(function (ex, i) {
        var b = el('button', 'ex-btn', ex.nome);
        if (ex.desc) b.title = ex.desc;
        b.addEventListener('click', function () {
          lista.querySelectorAll('.ex-btn').forEach(function (o) { o.classList.remove('ativo'); });
          b.classList.add('ativo');
          exemploAtivo = ex;
          aplicarValores(ex.valores);
        });
        lista.appendChild(b);
      });
      cx.appendChild(lista);
      if (cfg.exemplosNota) cx.appendChild(el('p', 'ex-nota', cfg.exemplosNota));
      pane.appendChild(cx);
      pane.appendChild(el('hr', 'ctrl-sep'));
    }

    (cfg.controles || []).forEach(function (c) {
      if (c.tipo === 'titulo') {
        pane.appendChild(el('p', 'ctrl-title', c.label));
        return;
      }
      if (c.tipo === 'separador') { pane.appendChild(el('hr', 'ctrl-sep')); return; }

      var wrap = el('div', 'ctrl');

      if (c.tipo === 'check') {
        params[c.id] = !!c.valor;
        var lab = el('label', 'ctrl-check');
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!c.valor;
        lab.appendChild(cb);
        lab.appendChild(el('span', null, c.label));
        wrap.appendChild(lab);
        if (c.desc) wrap.appendChild(el('div', 'desc', c.desc));
        cb.addEventListener('change', function () { params[c.id] = cb.checked; run(); });
        refs[c.id] = cb;
      } else if (c.tipo === 'select') {
        params[c.id] = c.valor;
        var h1 = el('div', 'ctrl-head');
        h1.appendChild(el('label', null, c.label));
        wrap.appendChild(h1);
        var sel = el('select', 'ctrl-input');
        (c.opcoes || []).forEach(function (o) {
          var op = el('option', null, o.t);
          op.value = o.v;
          if (o.v === c.valor) op.selected = true;
          sel.appendChild(op);
        });
        wrap.appendChild(sel);
        if (c.desc) wrap.appendChild(el('div', 'desc', c.desc));
        sel.addEventListener('change', function () { params[c.id] = sel.value; run(); });
        refs[c.id] = sel;
      } else if (c.tipo === 'seg') {
        params[c.id] = c.valor;
        var h2 = el('div', 'ctrl-head');
        h2.appendChild(el('label', null, c.label));
        wrap.appendChild(h2);
        var seg = el('div', 'seg');
        var nm = 'seg_' + Math.random().toString(36).slice(2, 8);
        (c.opcoes || []).forEach(function (o) {
          var l = el('label');
          var r = el('input'); r.type = 'radio'; r.name = nm; r.value = o.v;
          if (o.v === c.valor) r.checked = true;
          l.appendChild(r);
          l.appendChild(el('span', null, o.t));
          r.addEventListener('change', function () { if (r.checked) { params[c.id] = o.v; run(); } });
          if (!refs[c.id]) refs[c.id] = { tipoSeg: true, radios: [] };
          refs[c.id].radios.push(r);
          seg.appendChild(l);
        });
        wrap.appendChild(seg);
        if (c.desc) wrap.appendChild(el('div', 'desc', c.desc));
      } else if (c.tipo === 'numero') {
        params[c.id] = c.valor;
        var h3 = el('div', 'ctrl-head');
        h3.appendChild(el('label', null, c.label + (c.unidade ? ' (' + c.unidade + ')' : '')));
        wrap.appendChild(h3);
        var inp = el('input', 'ctrl-input');
        inp.type = 'number'; inp.value = c.valor;
        if (c.min !== undefined) inp.min = c.min;
        if (c.max !== undefined) inp.max = c.max;
        if (c.step !== undefined) inp.step = c.step;
        wrap.appendChild(inp);
        if (c.desc) wrap.appendChild(el('div', 'desc', c.desc));
        inp.addEventListener('input', function () {
          var v = parseFloat(inp.value);
          if (isFinite(v)) { params[c.id] = v; run(); }
        });
        refs[c.id] = inp;
      } else {
        /* slider (padrao) — o valor tambem pode ser digitado */
        params[c.id] = c.valor;
        var passo = c.step || (c.max - c.min) / 100;
        var head2 = el('div', 'ctrl-head');
        head2.appendChild(el('label', null, c.label));

        var chip = el('span', 'val val-edit');
        var num = el('input', 'val-num');
        num.type = 'text';
        num.inputMode = 'decimal';
        num.autocomplete = 'off';
        num.spellcheck = false;
        num.value = fmtVal(c.valor, c.step);
        num.title = 'Digite um valor entre ' + fmtVal(c.min, c.step) +
                    ' e ' + fmtVal(c.max, c.step) +
                    ' (setas ↑ ↓ ajustam; Shift acelera)';
        num.setAttribute('aria-label', c.label + ' — valor');
        chip.appendChild(num);
        if (c.unidade) chip.appendChild(el('span', 'val-un', c.unidade));
        head2.appendChild(chip);
        wrap.appendChild(head2);

        /* largura do campo pelo maior numero que ele pode exibir */
        var largura = Math.max(fmtVal(c.min, c.step).length, fmtVal(c.max, c.step).length);
        num.style.width = Math.min(10, Math.max(3, largura + 1)) + 'ch';

        var rg = el('input');
        rg.type = 'range';
        rg.min = c.min; rg.max = c.max; rg.step = passo;
        rg.value = c.valor;
        rg.setAttribute('aria-label', c.label);
        wrap.appendChild(rg);
        if (c.desc) wrap.appendChild(el('div', 'desc', c.desc));

        function limita(v) { return Math.min(c.max, Math.max(c.min, v)); }
        function leCampo() {
          /* aceita virgula decimal e ignora espacos */
          return parseFloat(String(num.value).replace(',', '.').replace(/\s/g, ''));
        }
        function aplica(v, escrever) {
          v = limita(v);
          params[c.id] = v;
          rg.value = v;
          if (escrever) num.value = fmtVal(v, c.step);
          run();
        }

        rg.addEventListener('input', function () {
          var v = parseFloat(rg.value);
          params[c.id] = v;
          num.value = fmtVal(v, c.step);
          num.classList.remove('fora');
          run();
        });

        /* digitacao: atualiza a cada tecla, sem reescrever o que esta sendo digitado */
        num.addEventListener('input', function () {
          var bruto = String(num.value).replace(',', '.').trim();
          if (bruto === '' || bruto === '-' || bruto === '.' || bruto === '-.') return;
          var v = leCampo();
          if (!isFinite(v)) { num.classList.add('fora'); return; }
          num.classList.toggle('fora', limita(v) !== v);
          aplica(v, false);
        });

        /* ao sair do campo ou apertar Enter, normaliza o texto e prende ao intervalo */
        function fechar() {
          var v = leCampo();
          if (!isFinite(v)) v = params[c.id];
          num.classList.remove('fora');
          aplica(v, true);
        }
        num.addEventListener('change', fechar);
        num.addEventListener('blur', fechar);
        num.addEventListener('focus', function () { num.select(); });
        num.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); fechar(); num.blur(); return; }
          if (e.key === 'Escape') { num.value = fmtVal(params[c.id], c.step); num.blur(); return; }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            var d = passo * (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
            var base = leCampo();
            if (!isFinite(base)) base = params[c.id];
            num.classList.remove('fora');
            aplica(base + d, true);
          }
        });

        /* usado por aplicarValores() e pelo botao de restaurar padroes */
        rg._setVal = function (v) {
          rg.value = v;
          num.value = fmtVal(v, c.step);
          num.classList.remove('fora');
        };
        refs[c.id] = rg;
      }
      pane.appendChild(wrap);
    });

    if (cfg.reset !== false && (cfg.controles || []).length) {
      var btn = el('button', 'btn sm ghost', 'Restaurar padroes');
      btn.style.marginTop = '14px';
      btn.style.width = '100%';
      btn.addEventListener('click', function () {
        (cfg.controles || []).forEach(function (c) {
          if (!c.id || refs[c.id] === undefined) {
            if (c.id !== undefined) params[c.id] = c.valor;
            return;
          }
          params[c.id] = c.valor;
          var r = refs[c.id];
          if (r.tipoSeg) {
            /* controle segmentado: nao e um elemento, e um grupo de radios */
            r.radios.forEach(function (rd) { rd.checked = (rd.value === String(c.valor)); });
            return;
          }
          if (r.type === 'checkbox') r.checked = !!c.valor;
          else r.value = c.valor;
          if (r._setVal) r._setVal(c.valor);
          if (r.dispatchEvent) r.dispatchEvent(new Event('change'));
        });
        run();
      });
      pane.appendChild(btn);
    }

    /* aplica um conjunto de valores nos controles e reexecuta o modelo */
    function aplicarValores(vals, silencioso) {
      Object.keys(vals || {}).forEach(function (id) {
        if (!(id in params)) return;
        var v = vals[id];
        params[id] = v;
        var r = refs[id];
        if (!r) return;
        if (r.tipoSeg) {
          r.radios.forEach(function (rd) { rd.checked = (rd.value === String(v)); });
          return;
        }
        if (r.type === 'checkbox') r.checked = !!v; else r.value = v;
        if (r._setVal) { r._setVal(v); return; }
        var w = r.closest ? r.closest('.ctrl') : null;
        var vs = w && w.querySelector('.val');
        if (vs) {
          var c = mapaCtrl[id];
          vs.textContent = fmtVal(v, c && c.step) + (c && c.unidade ? ' ' + c.unidade : '');
        }
      });
      if (!silencioso) run();
    }

    /* graficos */
    var plots = {};
    (cfg.graficos || []).forEach(function (g) {
      var box = el('div', 'plot-box');
      var cv = el('canvas');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', g.titulo || g.ylabel || 'grafico');
      box.appendChild(cv);
      area.appendChild(box);
      if (g.legenda) area.appendChild(el('div', 'plot-caption', g.legenda));
      plots[g.id] = global.Plot.create(cv, g);
    });

    /* saidas numericas */
    var outBox = null, outRefs = {};
    if (cfg.saidas && cfg.saidas.length) {
      outBox = el('div', 'saidas');
      cfg.saidas.forEach(function (s) {
        var key = typeof s === 'string' ? s : s.id;
        var lbl = typeof s === 'string' ? s : (s.label || s.id);
        var b = el('div', 'saida-box');
        b.appendChild(el('div', 'k', lbl));
        var v = el('div', 'v', '--');
        b.appendChild(v);
        outBox.appendChild(b);
        outRefs[key] = { box: b, val: v };
      });
      area.appendChild(outBox);
    }

    var ctx = {
      plot: function (id) { return plots[id]; },
      plots: plots,
      root: root,
      area: area,
      setFormulas: function (lista) {
        renderFormulas(lista);
        if (global.Formula && formBody) global.Formula.render(formBody);
      },
      setPassos: function (lista) {
        renderPassos(lista);
        if (global.Formula && passosBody) global.Formula.render(passosBody);
      },
      aplicar: aplicarValores,
      exemplo: function () { return exemploAtivo; },
      setSaida: function (k, texto, classe) {
        var r = outRefs[k];
        if (!r) return;
        r.val.innerHTML = texto;
        r.box.className = 'saida-box' + (classe ? ' ' + classe : '');
      }
    };

    var running = false;
    function run() {
      if (running) return;
      running = true;
      try {
        var res = cfg.calcular ? cfg.calcular(params, ctx) : null;
        if (res && outBox) {
          Object.keys(res).forEach(function (k) {
            var r = outRefs[k];
            if (!r) return;
            var d = res[k];
            if (d === null || d === undefined) { r.val.textContent = '--'; return; }
            if (typeof d === 'object') {
              var vv = d.v;
              if (typeof vv === 'number') vv = global.Plot.sig(vv, d.sig || 4);
              r.val.innerHTML = vv + (d.u ? ' <small>' + d.u + '</small>' : '');
              r.box.className = 'saida-box' + (d.classe ? ' ' + d.classe : '');
            } else {
              r.val.innerHTML = typeof d === 'number' ? global.Plot.sig(d, 4) : d;
            }
          });
        }
      } catch (err) {
        console.error('Sim: erro no modelo', err);
      }
      running = false;
    }

    run();

    /* redesenha ao trocar de tema */
    var mo = new MutationObserver(function () { run(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return { params: params, ctx: ctx, run: run, plots: plots, root: root };
  }

  global.Sim = { build: build, el: el };
})(window);

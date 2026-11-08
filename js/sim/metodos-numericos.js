/* ============================================================
   Simuladores de Métodos Numéricos
   1 · Euler, Heun e RK4 — ordem de convergência
   2 · Sistema massa-mola amortecido (animado)
   3 · Rigidez e métodos implícitos
   4 · Condução de calor: FTCS, BTCS e Crank-Nicolson (animado)
   5 · Advecção: upwind, Lax-Friedrichs, Lax-Wendroff (animado)
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim, Plot = global.Plot;
  if (!Sim) return;
  var cor = function (i) { return Plot.serie(i); };
  var nt = function (v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 4 : n }); };
  var log10 = function (v) { return Math.log(Math.max(v, 1e-16)) / Math.LN10; };

  var MN = {};
  MN.passo = function (met, F, x, y, h) {
    if (met === 'euler') return y + h * F(x, y);
    if (met === 'heun') { var a = F(x, y), b = F(x + h, y + h * a); return y + h / 2 * (a + b); }
    var k1 = F(x, y), k2 = F(x + h / 2, y + h / 2 * k1), k3 = F(x + h / 2, y + h / 2 * k2), k4 = F(x + h, y + h * k3);
    return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
  };
  MN.integra = function (met, F, x0, y0, b, n) {
    var h = (b - x0) / n, xs = [x0], ys = [y0], y = y0, i;
    for (i = 0; i < n; i++) { y = MN.passo(met, F, x0 + i * h, y, h); xs.push(x0 + (i + 1) * h); ys.push(y); }
    return { x: xs, y: ys };
  };
  /* Thomas: a sub, b diag, c sobre, d lado direito */
  MN.thomas = function (a, b, c, d) {
    var n = d.length, B = b.slice(), D = d.slice(), x = new Array(n), i;
    for (i = 1; i < n; i++) { var m = a[i] / B[i - 1]; B[i] -= m * c[i - 1]; D[i] -= m * D[i - 1]; }
    x[n - 1] = D[n - 1] / B[n - 1];
    for (i = n - 2; i >= 0; i--) x[i] = (D[i] - c[i] * x[i + 1]) / B[i];
    return x;
  };
  global.MN = MN;

  /* laço de animação: só avança quando o simulador está visível */
  function animador(desenhar, periodo) {
    var A = { on: false, k: 0, n: 1, ctx: null }, ult = 0;
    function tick(t) {
      global.requestAnimationFrame(tick);
      if (!A.on || !A.ctx || !A.ctx.root.getClientRects().length) return;
      if (t - ult < periodo) return;
      ult = t;
      A.k = (A.k + 1) % A.n;
      desenhar(A);
    }
    global.requestAnimationFrame(tick);
    return A;
  }

  var EDOS = {
    expo: { nome: "y' = 4e^(0,8x) − 0,5y; y(0) = 2", f: function (x, y) { return 4 * Math.exp(0.8 * x) - 0.5 * y; },
      ex: function (x) { return 4 / 1.3 * (Math.exp(0.8 * x) - Math.exp(-0.5 * x)) + 2 * Math.exp(-0.5 * x); }, y0: 2, b: 4 },
    poli: { nome: "y' = −2x³ + 12x² − 20x + 8,5; y(0) = 1", f: function (x) { return -2 * x * x * x + 12 * x * x - 20 * x + 8.5; },
      ex: function (x) { return -0.5 * Math.pow(x, 4) + 4 * x * x * x - 10 * x * x + 8.5 * x + 1; }, y0: 1, b: 4 },
    dec: { nome: "y' = −2xy; y(0) = 1", f: function (x, y) { return -2 * x * y; },
      ex: function (x) { return Math.exp(-x * x); }, y0: 1, b: 3 },
    sen: { nome: "y' = y·cos x; y(0) = 1", f: function (x, y) { return y * Math.cos(x); },
      ex: function (x) { return Math.exp(Math.sin(x)); }, y0: 1, b: 8 }
  };

  function montarEdo() {
    if (!document.getElementById('sim-edo')) return;
    Sim.build('#sim-edo', {
      titulo: '1. Euler, Heun e RK4 — a ordem do erro',
      descricao: 'Os três métodos integram a mesma equação com o mesmo número de passos. O gráfico inferior, em escala logarítmica, mostra que a inclinação de cada reta é a ordem do método.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'Exponencial com passo grande', valores: { fn: 'expo', n: 4 } },
        { nome: '2 · Polinômio', desc: 'O passo de 0,5 do Exemplo 1.1', valores: { fn: 'poli', n: 8 } },
        { nome: '3 · Gaussiana', desc: 'Solução decrescente', valores: { fn: 'dec', n: 10 } },
        { nome: '4 · Oscilatória', desc: 'Solução periódica', valores: { fn: 'sen', n: 16 } }
      ],
      controles: [
        { id: 'fn', tipo: 'select', label: 'Equação', valor: 'expo',
          opcoes: Object.keys(EDOS).map(function (k) { return { v: k, t: EDOS[k].nome }; }) },
        { id: 'n', label: 'Número de passos', min: 2, max: 64, step: 1, valor: 8 }
      ],
      graficos: [
        { id: 'sol', titulo: 'Solução', xlabel: 'x', ylabel: 'y', aspect: 0.45, legendPos: 'topleft' },
        { id: 'ord', titulo: 'Erro final contra número de passos (log-log)', xlabel: 'log₁₀ n', ylabel: 'log₁₀ |erro|', aspect: 0.36, legendPos: 'bottomleft' }
      ],
      saidas: [
        { id: 'h', label: 'Passo h' }, { id: 'ee', label: 'Erro de Euler' }, { id: 'eh', label: 'Erro de Heun' }, { id: 'er', label: 'Erro do RK4' },
        { id: 'oe', label: 'Ordem medida, Euler' }, { id: 'oh', label: 'Ordem medida, Heun' }, { id: 'or', label: 'Ordem medida, RK4' }
      ],
      formulas: [
        { tex: 'y_{i+1} = y_i + h\\,f_i', d: 'Euler: erro global O(h)' },
        { tex: 'y_{i+1} = y_i + \\frac{h}{2}(k_1 + k_2)', d: 'Heun: erro global O(h²)' },
        { tex: 'y_{i+1} = y_i + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)', d: 'RK4: erro global O(h⁴)', destaque: true }
      ],
      nota: 'A ordem medida compara os erros com n e 2n passos: log₂(erro(n)/erro(2n)). Com h muito grande, ela ainda não atingiu o valor assintótico.',
      calcular: function (p, ctx) {
        var E = EDOS[p.fn], n = Math.round(p.n), mets = [['euler', 'Euler', 3], ['heun', 'Heun', 2], ['rk4', 'RK4', 0]];
        var g = ctx.plot('sol').clear(), xs = Plot.linspace(0, E.b, 200);
        g.line(xs, xs.map(E.ex), { color: cor(1), width: 2.6, label: 'exata' });
        mets.forEach(function (m) { var r = MN.integra(m[0], E.f, 0, E.y0, E.b, n); g.line(r.x, r.y, { color: cor(m[2]), width: 1.8, dash: [5, 3], label: m[1] }); });
        g.draw();
        var erro = function (met, nn) { var r = MN.integra(met, E.f, 0, E.y0, E.b, nn); return Math.abs(r.y[nn] - E.ex(E.b)); };
        var o = ctx.plot('ord').clear(), ns = [2, 4, 8, 16, 32, 64, 128, 256];
        mets.forEach(function (m) {
          var lx = [], ly = [];
          ns.forEach(function (nn) { var e = erro(m[0], nn); if (e > 1e-13) { lx.push(log10(nn)); ly.push(log10(e)); } });
          o.line(lx, ly, { color: cor(m[2]), width: 2.2, label: m[1] });
        });
        o.vline(log10(n), { color: cor(5), width: 1, dash: [4, 4] });
        o.draw();
        var ee = erro('euler', n), eh = erro('heun', n), er = erro('rk4', n);
        var ord = function (met) { var e2 = erro(met, n * 2), e1 = erro(met, n); return e2 > 1e-13 ? Math.log(e1 / e2) / Math.LN2 : NaN; };
        ctx.setPassos([
          { t: '① O passo', obs: 'Com ' + n + ' passos, h = ' + nt(E.b / n, 4) + '. Todos os métodos usam essa malha; o RK4 faz quatro avaliações de f por passo, e o Euler, uma.' },
          { t: '② Dobre o número de passos', obs: 'Passando de ' + n + ' para ' + (2 * n) + ' passos, espere o erro cair por 2 em Euler, por 4 em Heun e por 16 no RK4. É a inclinação das retas no gráfico inferior.' }
        ]);
        return {
          h: { v: E.b / n }, ee: { v: ee }, eh: { v: eh }, er: { v: er, classe: 'ok' },
          oe: { v: isNaN(ord('euler')) ? '—' : nt(ord('euler'), 2) }, oh: { v: isNaN(ord('heun')) ? '—' : nt(ord('heun'), 2) }, or: { v: isNaN(ord('rk4')) ? '—' : nt(ord('rk4'), 2) }
        };
      }
    });
  }

  function montarMassa() {
    if (!document.getElementById('sim-massa')) return;
    var A = animador(function (a) { desenhaBloco(a); }, 40);
    function desenhaBloco(a) {
      var d = a.dados; if (!d) return;
      var i = Math.min(a.k, d.t.length - 1), y = d.num[i], yex = d.exa[i];
      var g = a.ctx.plot('anim').clear();
      g.setLimits([-2.4, 2.4], [-1, 1]);
      g.custom(function (c, pl) {
        var y0 = pl.py(-0.45), py = pl.py(0.45);
        function bloco(xc, yb, col, nome) {
          var x = pl.px(xc), w = Math.abs(pl.px(0.5) - pl.px(0)), h = Math.abs(pl.py(0) - pl.py(0.34));
          var x0 = pl.px(-2.3), n = 14;
          c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, yb);
          for (var k = 1; k < n; k++) c.lineTo(x0 + (x - w / 2 - x0) * k / n, yb + (k % 2 ? -7 : 7));
          c.lineTo(x - w / 2, yb); c.stroke();
          c.globalAlpha = 0.28; c.fillStyle = col; c.fillRect(x - w / 2, yb - h / 2, w, h);
          c.globalAlpha = 1; c.strokeRect(x - w / 2, yb - h / 2, w, h);
          c.fillStyle = col; c.font = '11px system-ui'; c.textAlign = 'center'; c.fillText(nome, x, yb + 4);
        }
        bloco(yex * d.esc, py, cor(1), 'exata');
        bloco(Math.max(-2.1, Math.min(2.1, y * d.esc)), y0, cor(3), 'num.');
      });
      g.draw();
      /* marcador no gráfico de posição */
      var p = a.ctx.plot('pos').clear();
      p.line(d.tf, d.ex, { color: cor(1), width: 2.4, label: 'exata' });
      p.line(d.t, d.num, { color: cor(3), width: 1.8, dash: [5, 3], label: d.nome });
      p.vline(d.t[i], { color: cor(5), width: 1, dash: [4, 4] });
      p.draw();
    }
    Sim.build('#sim-massa', {
      titulo: '2. Sistema massa-mola amortecido',
      descricao: 'A equação de segunda ordem é resolvida como sistema. Compare o Euler e o RK4 com a solução analítica e observe a energia, que nunca deve crescer em um sistema dissipativo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Caso padrão', desc: 'm = 1, c = 1, k = 1,5', valores: { m: 1, c: 1, k: 1.5, h: 0.1, met: 'rk4' } },
        { nome: '2 · Euler com passo grande', desc: 'Sem amortecimento, a energia cresce', valores: { m: 1, c: 0, k: 4, h: 0.1, met: 'euler' } },
        { nome: '3 · RK4 sem amortecimento', desc: 'A energia praticamente se conserva', valores: { m: 1, c: 0, k: 4, h: 0.1, met: 'rk4' } },
        { nome: '4 · Superamortecido', desc: 'Sem oscilação', valores: { m: 1, c: 5, k: 1.5, h: 0.1, met: 'rk4' } }
      ],
      controles: [
        { id: 'met', tipo: 'seg', label: 'Método', valor: 'rk4', opcoes: [{ v: 'euler', t: 'Euler' }, { v: 'heun', t: 'Heun' }, { v: 'rk4', t: 'RK4' }] },
        { id: 'm', label: 'Massa m', min: 0.2, max: 5, step: 0.1, valor: 1, unidade: 'kg' },
        { id: 'c', label: 'Amortecimento c', min: 0, max: 8, step: 0.05, valor: 1, unidade: 'N·s/m' },
        { id: 'k', label: 'Rigidez k', min: 0.5, max: 20, step: 0.1, valor: 1.5, unidade: 'N/m' },
        { id: 'h', label: 'Passo h', min: 0.01, max: 0.5, step: 0.01, valor: 0.1, unidade: 's' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'A massa em movimento', height: 130, grid: false, legend: false },
        { id: 'pos', titulo: 'Posição', xlabel: 't (s)', ylabel: 'y (m)', aspect: 0.36, legendPos: 'topright' },
        { id: 'en', titulo: 'Energia mecânica', xlabel: 't (s)', ylabel: 'E (J)', aspect: 0.3, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'zeta', label: 'Fator de amortecimento ζ' }, { id: 'wd', label: 'Frequência amortecida' }, { id: 'lim', label: 'hω (estabilidade)' },
        { id: 'erro', label: 'Erro máximo' }, { id: 'estado', label: 'Energia' }
      ],
      formulas: [
        { tex: 'y\' = z, \\qquad z\' = -(c\\,z + k\\,y)/m', d: 'redução a sistema de primeira ordem', destaque: true },
        { tex: 'E = \\tfrac{1}{2}m z^2 + \\tfrac{1}{2}k y^2', d: 'em sistema dissipativo, E só pode decrescer' }
      ],
      nota: 'Parte de y(0) = 1 m e velocidade nula. A solução analítica é calculada pela forma exponencial ou trigonométrica, conforme ζ.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var B = p.c / p.m, K = p.k / p.m, T = 16, n = Math.max(2, Math.round(T / p.h)), h = T / n;
        var F = function (u) { return [u[1], -B * u[1] - K * u[0]]; };
        var soma = function (a, b, s) { return [a[0] + s * b[0], a[1] + s * b[1]]; };
        var passo = function (u) {
          if (p.met === 'euler') return soma(u, F(u), h);
          if (p.met === 'heun') { var a = F(u), b = F(soma(u, a, h)); return [u[0] + h / 2 * (a[0] + b[0]), u[1] + h / 2 * (a[1] + b[1])]; }
          var k1 = F(u), k2 = F(soma(u, k1, h / 2)), k3 = F(soma(u, k2, h / 2)), k4 = F(soma(u, k3, h));
          return [u[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), u[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
        };
        var disc = B * B - 4 * K, ex;
        if (disc < -1e-9) { var P = -B / 2, Q = Math.sqrt(-disc) / 2; ex = function (t) { return Math.exp(P * t) * (Math.cos(Q * t) - P / Q * Math.sin(Q * t)); }; }
        else if (disc > 1e-9) { var s = Math.sqrt(disc), r1 = (-B + s) / 2, r2 = (-B - s) / 2; ex = function (t) { return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1); }; }
        else { var r = -B / 2; ex = function (t) { return (1 - r * t) * Math.exp(r * t); }; }
        var u = [1, 0], ts = [0], num = [1], en = [0.5 * p.k], enEx = [], i, emax = 0;
        for (i = 1; i <= n; i++) { u = passo(u); ts.push(i * h); num.push(u[0]); en.push(0.5 * p.m * u[1] * u[1] + 0.5 * p.k * u[0] * u[0]); emax = Math.max(emax, Math.abs(u[0] - ex(i * h))); }
        var tf = Plot.linspace(0, T, 500), yf = tf.map(ex), exa = ts.map(ex);
        var mx = 1; num.forEach(function (v) { if (isFinite(v)) mx = Math.max(mx, Math.abs(v)); });
        A.dados = { t: ts, num: num, exa: exa, tf: tf, ex: yf, esc: 1.9 / Math.max(1, mx), nome: p.met === 'euler' ? 'Euler' : p.met === 'heun' ? 'Heun' : 'RK4' };
        A.n = ts.length; if (A.k >= A.n) A.k = 0;
        desenhaBloco(A);
        var e = ctx.plot('en').clear();
        e.line(ts, en, { color: cor(3), width: 2.2, label: 'numérica' });
        e.hline(0.5 * p.k, { color: cor(5), width: 1, dash: [4, 4], text: 'inicial' });
        e.draw();
        var zeta = p.c / (2 * Math.sqrt(p.k * p.m)), w = Math.sqrt(K), cresce = en[n] > en[0] * 1.01;
        ctx.setPassos([
          { t: '① O sistema', obs: 'ζ = ' + nt(zeta, 3) + (zeta < 1 ? ': subamortecido, oscila.' : ': sem oscilação.') },
          { t: '② A energia', obs: cresce ? 'A energia final superou a inicial. Isso é impossível fisicamente e é erro do método: reduza h ou troque o integrador.' : 'A energia não cresceu ao longo da simulação, como exige a física.' }
        ]);
        return {
          zeta: { v: zeta }, wd: { v: disc < 0 ? Math.sqrt(-disc) / 2 : 0, u: 'rad/s' }, lim: { v: h * w },
          erro: { v: emax, u: 'm', classe: emax < 0.01 ? 'ok' : 'alerta' },
          estado: { v: cresce ? 'cresce (erro)' : 'decresce', classe: cresce ? 'alerta' : 'ok' }
        };
      }
    });
  }

  function montarRigidez() {
    if (!document.getElementById('sim-rigidez')) return;
    Sim.build('#sim-rigidez', {
      titulo: '3. Rigidez — quando o passo é preso pela parte que já morreu',
      descricao: 'O problema y′ = λ(y − cos t) − sen t tem solução cos t mais um transitório que decai com λ. Depois do transitório só resta cos t, que é suave, mas os métodos explícitos seguem limitados por λ.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Euler estável', desc: 'hλ = −1,5: oscila e amortece', valores: { lambda: -100, h: 0.015, met: 'euler' } },
        { nome: '2 · Euler instável', desc: 'hλ = −2,5: explode', valores: { lambda: -100, h: 0.025, met: 'euler' } },
        { nome: '3 · RK4 no limite', desc: 'hλ = −2,7', valores: { lambda: -100, h: 0.027, met: 'rk4' } },
        { nome: '4 · Euler implícito', desc: 'Passo 20 vezes maior', valores: { lambda: -100, h: 0.3, met: 'impl' } },
        { nome: '5 · Trapézio', desc: 'Estável, mas oscila em hλ grande', valores: { lambda: -100, h: 0.3, met: 'trap' } }
      ],
      controles: [
        { id: 'met', tipo: 'select', label: 'Método', valor: 'euler', opcoes: [{ v: 'euler', t: 'Euler explícito' }, { v: 'heun', t: 'Heun' }, { v: 'rk4', t: 'RK4' }, { v: 'impl', t: 'Euler implícito' }, { v: 'trap', t: 'Trapézio (Crank-Nicolson)' }] },
        { id: 'lambda', label: 'λ', min: -500, max: -1, step: 1, valor: -100 },
        { id: 'h', label: 'Passo h', min: 0.001, max: 0.5, step: 0.001, valor: 0.015 }
      ],
      graficos: [
        { id: 'sol', titulo: 'Solução', xlabel: 't', ylabel: 'y', aspect: 0.46, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'z', label: 'z = hλ' }, { id: 'R', label: '|R(z)|' }, { id: 'hmax', label: 'Maior h estável' }, { id: 'n', label: 'Passos até t = 2' }, { id: 'est', label: 'Situação' }
      ],
      formulas: [
        { tex: '|R(h\\lambda)| \\le 1', d: 'condição de estabilidade', destaque: true },
        { tex: 'R_{impl} = \\frac{1}{1 - z} \\qquad R_{trap} = \\frac{1 + z/2}{1 - z/2}', d: 'métodos A-estáveis' }
      ],
      nota: 'Parte de y(0) = 2. A curva numérica é cortada visualmente quando explode.',
      calcular: function (p, ctx) {
        var L = p.lambda, h = p.h, T = 2, n = Math.max(2, Math.round(T / h));
        var F = function (t, y) { return L * (y - Math.cos(t)) - Math.sin(t); };
        var ex = function (t) { return Math.cos(t) + Math.exp(L * t); };
        var y = 2, ts = [0], ys = [2], i, explodiu = false;
        for (i = 1; i <= n && !explodiu; i++) {
          var t = (i - 1) * h, t1 = i * h;
          if (p.met === 'impl') y = (y + h * (-L * Math.cos(t1) - Math.sin(t1))) / (1 - h * L);
          else if (p.met === 'trap') y = (y * (1 + h * L / 2) + h / 2 * (-L * Math.cos(t) - Math.sin(t) - L * Math.cos(t1) - Math.sin(t1))) / (1 - h * L / 2);
          else y = MN.passo(p.met, F, t, y, h);
          if (!isFinite(y) || Math.abs(y) > 1e6) explodiu = true;
          ts.push(t1); ys.push(y);
        }
        var g = ctx.plot('sol').clear();
        g.setLimits([0, T], [-3, 3.5]);
        g.line(Plot.linspace(0, T, 500), Plot.linspace(0, T, 500).map(ex), { color: cor(1), width: 2.6, label: 'exata' });
        var ty = [], yy = [];
        ts.forEach(function (tt, j) { if (Math.abs(ys[j]) <= 3.5) { ty.push(tt); yy.push(ys[j]); } else { ty.push(tt); yy.push(ys[j] > 0 ? 3.5 : -3); } });
        g.line(ty, yy, { color: cor(3), width: 1.8, label: 'numérica' });
        g.draw();
        var z = h * L;
        var R = { euler: Math.abs(1 + z), heun: Math.abs(1 + z + z * z / 2), rk4: Math.abs(1 + z + z * z / 2 + z * z * z / 6 + z * z * z * z / 24), impl: Math.abs(1 / (1 - z)), trap: Math.abs((1 + z / 2) / (1 - z / 2)) }[p.met];
        var hlim = { euler: 2, heun: 2, rk4: 2.785 }[p.met];
        var estavel = R <= 1 + 1e-12;
        ctx.setPassos([
          { t: '① O fator de amplificação', obs: 'Com z = hλ = ' + nt(z, 3) + ', cada passo multiplica o erro por ' + nt(R, 4) + '.' },
          { t: '② O que isso significa', obs: estavel ? 'O transitório morre e o método acompanha cos t.' : 'O fator é maior que 1: o erro cresce a cada passo, por menor que tenha sido no início.' }
        ]);
        return {
          z: { v: z }, R: { v: R, classe: estavel ? 'ok' : 'alerta' }, hmax: { v: hlim ? nt(hlim / -L, 5) : 'sem limite' }, n: { v: n },
          est: { v: estavel ? 'estável' : 'instável', classe: estavel ? 'ok' : 'alerta' }
        };
      }
    });
  }

  function montarCalor() {
    if (!document.getElementById('sim-calor')) return;
    var A = animador(function (a) { desenha(a); }, 110);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var i = a.k % d.quadros.length, q = d.quadros[i];
      var g = a.ctx.plot('T').clear();
      g.setLimits([0, d.L], [-20, 180]);
      g.line(d.xf, q.ex, { color: cor(1), width: 2.4, label: 'série de Fourier' });
      g.line(d.xs, q.T.map(function (v) { return Math.max(-20, Math.min(180, v)); }), { color: cor(3), width: 1.8, label: d.nome });
      g.points(d.xs, q.T.map(function (v) { return Math.max(-20, Math.min(180, v)); }), { color: cor(3), size: 3 });
      g.text(d.L * 0.5, 165, 't = ' + nt(q.t, 1) + ' s', { align: 'center', size: 12 });
      g.draw();
    }
    Sim.build('#sim-calor', {
      titulo: '4. Barra aquecida — FTCS, BTCS e Crank-Nicolson',
      descricao: 'A barra parte de 0 °C, com as pontas a 150 °C e 50 °C. Passe r de 0,5 no FTCS e veja o modo nó a nó crescer; depois troque para os implícitos com o mesmo passo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · FTCS estável', desc: 'r = 0,25, exemplo do capítulo', valores: { met: 'ftcs', r: 0.25, nos: 8 } },
        { nome: '2 · FTCS no limite', desc: 'r = 0,5', valores: { met: 'ftcs', r: 0.5, nos: 8 } },
        { nome: '3 · FTCS instável', desc: 'r = 0,6', valores: { met: 'ftcs', r: 0.6, nos: 8 } },
        { nome: '4 · BTCS, r grande', desc: 'r = 4 sem oscilar', valores: { met: 'btcs', r: 4, nos: 8 } },
        { nome: '5 · Crank-Nicolson, r grande', desc: 'r = 4: oscila perto da frente', valores: { met: 'cn', r: 4, nos: 16 } }
      ],
      controles: [
        { id: 'met', tipo: 'seg', label: 'Esquema', valor: 'ftcs', opcoes: [{ v: 'ftcs', t: 'FTCS' }, { v: 'btcs', t: 'BTCS' }, { v: 'cn', t: 'C-N' }] },
        { id: 'r', label: 'r = αΔt/Δx²', min: 0.05, max: 6, step: 0.01, valor: 0.25 },
        { id: 'nos', label: 'Intervalos na barra', min: 4, max: 32, step: 1, valor: 8 },
        { id: 'tmax', label: 'Tempo final', min: 50, max: 1000, step: 10, valor: 300, unidade: 's' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'T', titulo: 'Perfil de temperatura', xlabel: 'x (m)', ylabel: 'T (°C)', aspect: 0.46, legendPos: 'topright' },
        { id: 'G', titulo: 'Fator de amplificação de von Neumann', xlabel: 'θ (rad)', ylabel: 'G', aspect: 0.32, legendPos: 'bottomleft' }
      ],
      saidas: [
        { id: 'dt', label: 'Passo Δt' }, { id: 'passos', label: 'Passos' }, { id: 'Gmin', label: 'Menor G' }, { id: 'T5', label: 'T em x = 0,5 m' }, { id: 'erro', label: 'Erro em x = 0,5 m' }, { id: 'est', label: 'Situação' }
      ],
      formulas: [
        { tex: 'u_j^{n+1} = u_j^n + r\\,(u_{j+1}^n - 2u_j^n + u_{j-1}^n)', d: 'FTCS, estável com r ≤ 1/2', destaque: true },
        { tex: 'G_{FTCS} = 1 - 4r\\,\\text{sen}^2(\\theta/2)', d: 'o pior caso é θ = π' },
        { tex: 'G_{CN} = \\frac{1 - 2r\\,\\text{sen}^2(\\theta/2)}{1 + 2r\\,\\text{sen}^2(\\theta/2)}', d: 'estável, com |G| perto de 1 quando r é grande' }
      ],
      nota: 'α = 0,001 m²/s e L = 1 m. O gráfico recorta a escala em −20 °C e 180 °C para que a instabilidade não esconda o resto.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var al = 0.001, L = 1, N = Math.round(p.nos), dx = L / N, r = p.r, dt = r * dx * dx / al, nt0 = Math.max(1, Math.round(p.tmax / dt));
        var T = new Array(N + 1).fill(0); T[0] = 150; T[N] = 50;
        var xs = [], j; for (j = 0; j <= N; j++) xs.push(j * dx);
        var xf = Plot.linspace(0, L, 120);
        var serie = function (x, t) {
          var s = 150 - 100 * x, m;
          for (m = 1; m < 300; m++) {
            var b = m * Math.PI, e = Math.exp(-al * b * b * t);
            if (e < 1e-9) break;
            s += (2 / b) * (50 * Math.cos(b) - 150) * e * Math.sin(b * x);
          }
          return s;
        };
        var quadros = [], cada = Math.max(1, Math.round(nt0 / 60));
        var push = function (n) { quadros.push({ t: n * dt, T: T.slice(), ex: xf.map(function (x) { return serie(x, Math.max(n * dt, 1e-3)); }) }); };
        push(0);
        var n, m = N - 1, a = new Array(m), b = new Array(m), c = new Array(m), d = new Array(m);
        for (n = 1; n <= nt0; n++) {
          var o = T.slice();
          if (p.met === 'ftcs') {
            for (j = 1; j < N; j++) T[j] = o[j] + r * (o[j + 1] - 2 * o[j] + o[j - 1]);
          } else {
            var th = p.met === 'btcs' ? 1 : 0.5;
            for (j = 1; j < N; j++) {
              a[j - 1] = -th * r; b[j - 1] = 1 + 2 * th * r; c[j - 1] = -th * r;
              d[j - 1] = o[j] + (1 - th) * r * (o[j + 1] - 2 * o[j] + o[j - 1]);
            }
            d[0] += th * r * T[0]; d[m - 1] += th * r * T[N];
            var x = MN.thomas(a, b, c, d);
            for (j = 1; j < N; j++) T[j] = x[j - 1];
          }
          if (n % cada === 0 || n === nt0) push(n);
          if (Math.abs(T[Math.round(N / 2)]) > 1e12) { push(n); break; }
        }
        A.dados = { quadros: quadros, xs: xs, xf: xf, L: L, nome: p.met === 'ftcs' ? 'FTCS' : p.met === 'btcs' ? 'BTCS' : 'Crank-Nicolson' };
        A.n = quadros.length; A.k = A.on ? (A.k % A.n) : A.n - 1;
        desenha(A);
        var th2 = Plot.linspace(0, Math.PI, 160), Gf = function (t) {
          var s = Math.sin(t / 2); s = s * s;
          return p.met === 'ftcs' ? 1 - 4 * r * s : p.met === 'btcs' ? 1 / (1 + 4 * r * s) : (1 - 2 * r * s) / (1 + 2 * r * s);
        };
        var g = ctx.plot('G').clear(), Gs = th2.map(Gf), Gmin = Math.min.apply(null, Gs);
        g.setLimits([0, Math.PI], [Math.min(-1.4, Math.max(-4, Gmin)), 1.3]);
        g.line(th2, Gs, { color: cor(3), width: 2.4, label: 'G(θ)' });
        g.hline(1, { color: cor(5), width: 1, dash: [4, 4] }); g.hline(-1, { color: cor(5), width: 1, dash: [4, 4], text: 'limite −1' });
        g.draw();
        var est = Gmin >= -1 - 1e-9, ult = quadros[quadros.length - 1], meio = T[Math.round(N / 2)], tf = ult.t, exm = serie(xs[Math.round(N / 2)], tf);
        ctx.setPassos([
          { t: '① O passo de tempo', obs: 'r = ' + nt(r, 3) + ' com Δx = ' + nt(dx, 4) + ' m resulta em Δt = ' + nt(dt, 3) + ' s.' },
          { t: '② Estabilidade', obs: est ? 'Todos os modos têm |G| ≤ 1.' : 'G(π) = ' + nt(Gmin, 3) + ' é menor que −1: a oscilação de nó a nó cresce a cada passo.' }
        ]);
        return {
          dt: { v: dt, u: 's' }, passos: { v: nt0 }, Gmin: { v: Gmin, classe: est ? 'ok' : 'alerta' },
          T5: { v: Math.abs(meio) < 1e6 ? meio : 'diverge', u: Math.abs(meio) < 1e6 ? '°C' : '' },
          erro: { v: Math.abs(meio) < 1e6 ? Math.abs(meio - exm) : '—', u: Math.abs(meio) < 1e6 ? '°C' : '' },
          est: { v: est ? 'estável' : 'instável', classe: est ? 'ok' : 'alerta' }
        };
      }
    });
  }

  function montarAdveccao() {
    if (!document.getElementById('sim-adveccao')) return;
    var A = animador(function (a) { desenha(a); }, 70);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var q = d.quadros[a.k % d.quadros.length];
      var g = a.ctx.plot('u').clear();
      g.setLimits([0, 1], [-0.6, 1.6]);
      g.line(d.xs, q.ex, { color: cor(1), width: 2.4, label: 'exata' });
      g.line(d.xs, q.u.map(function (v) { return Math.max(-0.6, Math.min(1.6, v)); }), { color: cor(3), width: 1.8, label: d.nome });
      g.draw();
    }
    Sim.build('#sim-adveccao', {
      titulo: '5. Advecção — upwind, Lax-Friedrichs e Lax-Wendroff',
      descricao: 'Um pulso é transportado em domínio periódico e deveria voltar idêntico. A forma que ele toma revela o erro: o upwind espalha a frente e o Lax-Wendroff cria ondulações.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Upwind, C = 0,5', desc: 'Difusão numérica', valores: { met: 'up', C: 0.5, pulso: 'degrau' } },
        { nome: '2 · Upwind, C = 1', desc: 'Solução exata', valores: { met: 'up', C: 1, pulso: 'degrau' } },
        { nome: '3 · Lax-Wendroff', desc: 'Oscilações na frente', valores: { met: 'lw', C: 0.5, pulso: 'degrau' } },
        { nome: '4 · FTCS', desc: 'Sempre instável', valores: { met: 'ftcs', C: 0.5, pulso: 'gauss' } },
        { nome: '5 · Viola CFL', desc: 'C = 1,1 no upwind', valores: { met: 'up', C: 1.1, pulso: 'gauss' } }
      ],
      controles: [
        { id: 'met', tipo: 'select', label: 'Esquema', valor: 'up', opcoes: [{ v: 'up', t: 'Upwind' }, { v: 'lf', t: 'Lax-Friedrichs' }, { v: 'lw', t: 'Lax-Wendroff' }, { v: 'ftcs', t: 'FTCS' }] },
        { id: 'C', label: 'Número de Courant C', min: 0.05, max: 1.3, step: 0.01, valor: 0.5 },
        { id: 'pulso', tipo: 'seg', label: 'Pulso', valor: 'degrau', opcoes: [{ v: 'degrau', t: 'Degrau' }, { v: 'gauss', t: 'Gaussiano' }] },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'u', titulo: 'Solução', xlabel: 'x', ylabel: 'u', aspect: 0.46, legendPos: 'topright' },
        { id: 'G', titulo: 'Módulo do fator de amplificação', xlabel: 'θ (rad)', ylabel: '|G|', aspect: 0.3, legendPos: 'bottomleft' }
      ],
      saidas: [
        { id: 'nu', label: 'Difusão numérica ν' }, { id: 'Gmax', label: 'Maior |G|' }, { id: 'umax', label: 'Máximo final' }, { id: 'umin', label: 'Mínimo final' }, { id: 'est', label: 'Situação' }
      ],
      formulas: [
        { tex: 'C = \\frac{a\\,\\Delta t}{\\Delta x}, \\qquad |C| \\le 1', d: 'condição CFL', destaque: true },
        { tex: '\\nu_n = \\frac{a\\,\\Delta x}{2}(1 - C)', d: 'difusão artificial do upwind' }
      ],
      nota: 'Domínio periódico com 100 células; a = 1; uma volta completa no tempo. Os valores acima de 1,6 ou abaixo de −0,6 são recortados no gráfico.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var N = 100, dx = 1 / N, C = p.C, dt = C * dx, passos = Math.max(1, Math.round(1 / dt)), xs = [], j;
        for (j = 0; j < N; j++) xs.push(j * dx);
        var f0 = p.pulso === 'gauss'
          ? function (x) { return Math.exp(-Math.pow((x - 0.5) / 0.08, 2)); }
          : function (x) { return x > 0.3 && x < 0.6 ? 1 : 0; };
        var u = xs.map(f0), quadros = [], cada = Math.max(1, Math.round(passos / 80)), n;
        var exata = function (t) { return xs.map(function (x) { return f0(((x - t) % 1 + 1) % 1); }); };
        var push = function (m) { quadros.push({ u: u.slice(), ex: exata(m * dt) }); };
        push(0);
        for (n = 1; n <= passos; n++) {
          var o = u.slice();
          for (j = 0; j < N; j++) {
            var e = o[(j + N - 1) % N], d = o[(j + 1) % N], c = o[j];
            if (p.met === 'up') u[j] = c - C * (c - e);
            else if (p.met === 'lf') u[j] = (d + e) / 2 - C / 2 * (d - e);
            else if (p.met === 'lw') u[j] = c - C / 2 * (d - e) + C * C / 2 * (d - 2 * c + e);
            else u[j] = c - C / 2 * (d - e);
          }
          if (n % cada === 0 || n === passos) push(n);
          if (Math.abs(u[50]) > 1e10) { push(n); break; }
        }
        A.dados = { quadros: quadros, xs: xs, nome: { up: 'Upwind', lf: 'Lax-Friedrichs', lw: 'Lax-Wendroff', ftcs: 'FTCS' }[p.met] };
        A.n = quadros.length; A.k = A.on ? (A.k % A.n) : A.n - 1;
        desenha(A);
        var th = Plot.linspace(0.001, Math.PI, 160);
        var Gm = function (t) {
          var cs = Math.cos(t), sn = Math.sin(t);
          if (p.met === 'up') return Math.hypot(1 - C * (1 - cs), C * sn);
          if (p.met === 'lf') return Math.hypot(cs, C * sn);
          if (p.met === 'lw') return Math.hypot(1 - C * C * (1 - cs), C * sn);
          return Math.hypot(1, C * sn);
        };
        var Gs = th.map(Gm), Gmax = Math.max.apply(null, Gs), g = ctx.plot('G').clear();
        g.setLimits([0, Math.PI], [0, Math.max(1.3, Math.min(2, Gmax * 1.05))]);
        g.line(th, Gs, { color: cor(3), width: 2.4, label: '|G|' });
        g.hline(1, { color: cor(5), width: 1, dash: [4, 4], text: 'limite' });
        g.draw();
        var est = Gmax <= 1 + 1e-9, mx = Math.max.apply(null, u), mn = Math.min.apply(null, u);
        ctx.setPassos([
          { t: '① O passo', obs: 'C = ' + nt(C, 2) + ' significa que a onda percorre essa fração de célula a cada passo.' },
          { t: '② O que aconteceu com o pulso', obs: !est ? 'Há modos com |G| > 1: eles crescem até dominar.' : p.met === 'up' || p.met === 'lf' ? 'O esquema é dissipativo: a frente se espalha e o máximo cai.' : 'Segunda ordem: a frente fica melhor, com ondulações em torno dela.' }
        ]);
        var nu = p.met === 'up' ? dx / 2 * (1 - C) : p.met === 'lf' ? dx * dx / (2 * dt) * (1 - C * C) : 0;
        return {
          nu: { v: p.met === 'up' || p.met === 'lf' ? nu : '—' }, Gmax: { v: Gmax, classe: est ? 'ok' : 'alerta' },
          umax: { v: Math.abs(mx) < 1e6 ? mx : 'diverge' }, umin: { v: Math.abs(mn) < 1e6 ? mn : 'diverge' },
          est: { v: est ? 'estável' : 'instável', classe: est ? 'ok' : 'alerta' }
        };
      }
    });
  }

  function iniciar() { montarEdo(); montarMassa(); montarRigidez(); montarCalor(); montarAdveccao(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

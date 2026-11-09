/* ============================================================
   Figuras ilustrativas de Modelagem e Controle de Sistemas
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.CS) return;
  var F = window.Figura.criar, CS = window.CS, VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { return isFinite(v) ? (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }) : '∞'; }
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / g.e;
    itens.forEach(function (it) {
      var linhas = [], atual = '';
      ctx.save(); ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      it.t.split(' ').forEach(function (p) { var q = atual ? atual + ' ' + p : p; if (atual && ctx.measureText(q).width > larg) { linhas.push(atual); atual = p; } else atual = q; });
      ctx.restore(); if (atual) linhas.push(atual);
      linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; });
      y -= passo * 0.35;
    });
  }
  function painel(g, t, linhas, obs) {
    g.txt(t, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) { g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' }); g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true }); });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function ax(g, b, xa, xb, ya, yb, rx, ry, px, py, op) {
    op = op || {};
    var x0 = b[0], x1 = b[1], y0 = b[2], y1 = b[3], v, X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); }, Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); }, fm = op.fmt || function (u) { return fx(u, 2); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) { g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); if (!op.semX) g.txt(fm(v), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 }); }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) { g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' }); }
    g.ret(x0, y0, x1 - x0, y1 - y0, { cor: 'forte', larg: 1.2 });
    if (xa < 0 && xb > 0) g.linha(X(0), y0, X(0), y1, { cor: 'forte', larg: 1.2 });
    if (ya < 0 && yb > 0) g.linha(x0, Y(0), x1, Y(0), { cor: 'forte', larg: 1.2 });
    if (rx) g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 });
    if (ry) g.txt(ry, x0 - 0.3, y1 + 0.34, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, xa: xa, xb: xb, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) {
    var p = [], i, m = n || 240, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; };
    for (i = 0; i <= m; i++) { var v = xa + (xb - xa) * i / m, y = f(v); if (!isFinite(y) || y < a.ya || y > a.yb) fe(); else p.push([a.X(v), a.Y(y)]); }
    fe();
  }
  function serie(g, a, xs, ys, o) { var p = [], i, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; }; for (i = 0; i < xs.length; i++) { if (!isFinite(ys[i]) || ys[i] < a.ya || ys[i] > a.yb) fe(); else p.push([a.X(xs[i]), a.Y(ys[i])]); } fe(); }
  function xis(g, x, y, cor, t) { t = t || 0.13; g.linha(x - t, y - t, x + t, y + t, { cor: cor, larg: 2.4 }); g.linha(x - t, y + t, x + t, y - t, { cor: cor, larg: 2.4 }); }
  function bloco(g, x, y, w, t, o) { o = o || {}; g.ret(x, y - 0.45, w, 0.9, { cor: o.cor || 'acento', larg: 1.6, preenche: o.cor || 'acento', alfa: 0.1 }); g.txt(t, x + w / 2, y, { cor: 'texto', tam: o.tam || 11.5, negrito: true }); }
  function soma(g, x, y) { g.circ(x, y, 0.27, { cor: 'texto', larg: 1.5 }); g.txt('+', x - 0.46, y + 0.26, { cor: 'suave', tam: 11 }); }
  function vaiV(g, x1, y1, x2, y2, o) { g.seta(x1, y1, x2 - x1, y2 - y1, Object.assign({ cor: 'suave', larg: 1.6, ponta: 0.22 }, o || {})); }
  function pass(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; }

  /* 1.1 — malha aberta e fechada */
  F('#fig-1-1', {
    titulo: 'Figura 1.1', legenda: 'Na malha fechada, o sensor devolve a saída ao comparador, e o controlador age sobre o erro. A perturbação entra depois do controlador: em malha aberta ela passa inteira para a saída; em malha fechada, é dividida por 1 + Kc.',
    vista: VISTA, altura: ALTURA, animar: true,
    controles: [{ id: 'k', rot: 'Ganho Kc', min: 1, max: 50, val: 9, passo: 1 }, { id: 'd', rot: 'Perturbação d', min: -0.5, max: 0.5, val: 0.3, passo: 0.05 }],
    desenhar: function (g, p, t) {
      var y = 6, yf = 4.4;
      g.txt('r', 0.1, y, { cor: 'texto', tam: 13, negrito: true }); vaiV(g, 0.3, y, 1.3, y); soma(g, 1.6, y); g.txt('−', 1.15, y - 0.46, { cor: 'erro', tam: 14, negrito: true });
      vaiV(g, 1.87, y, 2.6, y); g.txt('e', 2.2, y + 0.3, { cor: 'suave', tam: 11.5 }); bloco(g, 2.6, y, 2.1, 'controlador');
      vaiV(g, 4.7, y, 5.53, y); g.txt('u', 5.05, y + 0.3, { cor: 'suave', tam: 11.5 }); soma(g, 5.8, y); vaiV(g, 5.8, 7.25, 5.8, y + 0.27, { cor: 'aviso' }); g.txt('d', 6.1, 7.3, { cor: 'aviso', tam: 12, negrito: true });
      vaiV(g, 6.07, y, 6.8, y); bloco(g, 6.8, y, 2.1, 'planta'); g.linha(8.9, y, 10.2, y, { cor: 'suave', larg: 1.6 }); vaiV(g, 10.2, y, 12, y); g.txt('y', 12.25, y, { cor: 'texto', tam: 13, negrito: true });
      g.circ(10.2, y, 0.06, { cor: 'suave', preenche: 'suave' }); g.linha(10.2, y, 10.2, yf, { cor: 'suave', larg: 1.6 }); vaiV(g, 10.2, yf, 7.3, yf); bloco(g, 5.2, yf, 2.1, 'sensor'); g.linha(5.2, yf, 1.6, yf, { cor: 'suave', larg: 1.6 }); vaiV(g, 1.6, yf, 1.6, y - 0.27);
      var cam = [[0.3, y], [1.6, y], [10.2, y], [10.2, yf], [1.6, yf], [1.6, y]], tot = 0, i, d = [];
      for (i = 1; i < cam.length; i++) { d[i] = Math.abs(cam[i][0] - cam[i - 1][0]) + Math.abs(cam[i][1] - cam[i - 1][1]); tot += d[i]; }
      var s = (t * 3) % tot; i = 1; while (s > d[i]) { s -= d[i]; i++; } var f = s / d[i], px = cam[i - 1][0] + (cam[i][0] - cam[i - 1][0]) * f, py = cam[i - 1][1] + (cam[i][1] - cam[i - 1][1]) * f;
      g.circ(px, py, 0.1, { cor: 'erro', preenche: 'erro' });
      var abert = 1 + p.d, fech = p.k / (1 + p.k) + p.d / (1 + p.k), X = function (v) { return 3.1 + v * 8.6 / 1.6; }, y1 = 2.2, y2 = 0.9;
      [[y1, abert, 'malha aberta', 's3'], [y2, fech, 'malha fechada', 's1']].forEach(function (c) { g.txt(c[2], 0, c[0], { cor: 'suave', tam: 11, alin: 'esq' }); g.ret(X(0), c[0] - 0.3, X(c[1]) - X(0), 0.6, { cor: c[3], preenche: c[3], alfa: 0.55, larg: 1.2 }); g.txt('y = ' + fx(c[1], 3), 11.5, c[0], { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true }); });
      g.linha(X(1), 0.4, X(1), 2.9, { cor: 'ok', larg: 1.6, tracejado: [5, 4] }); g.txt('referência r = 1', X(1), 3.2, { cor: 'ok', tam: 10.5 });
    }
  });

  /* 2.1 — polo e resposta */
  F('#fig-2-1', {
    titulo: 'Figura 2.1', legenda: 'A posição do polo define a forma da resposta. A parte real dá o envelope, que decai se ela é negativa e cresce se é positiva. A parte imaginária dá a frequência da oscilação.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 's', rot: 'Parte real σ', min: -3, max: 1, val: -0.6, passo: 0.05 }, { id: 'w', rot: 'Parte imaginária ω', min: 0, max: 6, val: 4, passo: 0.1 }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 5.7, 0.7, 6.7], -4, 2, -7, 7, 'parte real σ', 'jω', 2, 2);
      g.ret(a.x0, a.y0, a.X(0) - a.x0, a.y1 - a.y0, { cor: null, preenche: 'ok', alfa: 0.07 });
      xis(g, a.X(p.s), a.Y(p.w), 'erro'); if (p.w > 0) xis(g, a.X(p.s), a.Y(-p.w), 'erro');
      var b = ax(g, [7.6, 13, 0.7, 6.7], 0, 6, -3, 3, 'tempo t', 'y(t)', 1, 1);
      curva(g, b, function (t) { return Math.exp(p.s * t); }, 0, 6, { cor: 's3', larg: 1.2, tracejado: [4, 4] });
      curva(g, b, function (t) { return -Math.exp(p.s * t); }, 0, 6, { cor: 's3', larg: 1.2, tracejado: [4, 4] });
      curva(g, b, function (t) { return Math.exp(p.s * t) * Math.cos(p.w * t); }, 0, 6, { cor: 's1', larg: 2.4 }, 500);
      g.txt(p.s < -1e-9 ? 'semiplano esquerdo: a resposta decai' : p.s > 1e-9 ? 'semiplano direito: a resposta cresce' : 'sobre o eixo imaginário: amplitude constante', 6.5, 7.5, { cor: p.s < -1e-9 ? 'ok' : p.s > 1e-9 ? 'erro' : 'aviso', tam: 12, negrito: true });
    }
  });

  /* 3.1 — massa, mola e amortecedor */
  F('#fig-3-1', {
    titulo: 'Figura 3.1', legenda: 'Aplicada a força em degrau, a massa busca o novo equilíbrio. A relação entre amortecimento, massa e rigidez define se ela oscila antes de parar.',
    vista: VISTA, altura: ALTURA, animar: true,
    controles: [{ id: 'm', rot: 'Massa m', min: 1, max: 20, val: 5, passo: 0.5, un: 'kg' }, { id: 'b', rot: 'Amortecimento b', min: 0, max: 60, val: 8, passo: 1, un: 'N·s/m' }, { id: 'k', rot: 'Rigidez k', min: 10, max: 200, val: 80, passo: 5, un: 'N/m' }],
    desenhar: function (g, p, t) {
      var wn = Math.sqrt(p.k / p.m), z = p.b / (2 * Math.sqrt(p.k * p.m)), s = CS.segunda(z, wn), tv = Math.min(1, ((t % 7) / 6)) * s.T, x = CS.y2(z, wn, tv), xm = 3 + 1.4 * x, yb = 2.3;
      g.hachura(0.4, yb - 0.1, 3.5, Math.PI / 2, {}); g.hachura(0.4, yb - 0.1, 8.2, 0, {});
      g.mola(0.4, 4.6, xm, 4.6, 7, { cor: 's2', larg: 1.8 });
      var meio = (0.4 + xm) / 2; g.linha(0.4, 3.1, meio, 3.1, { cor: 's3', larg: 1.8 }); g.linha(meio, 2.8, meio, 3.4, { cor: 's3', larg: 2.4 }); g.caminho([[meio + 0.45, 2.7], [meio - 0.35, 2.7], [meio - 0.35, 3.5], [meio + 0.45, 3.5]], { cor: 's3', larg: 1.8 }); g.linha(meio + 0.45, 3.1, xm, 3.1, { cor: 's3', larg: 1.8 });
      g.ret(xm, yb, 2, 3.2, { cor: 'acento', larg: 1.8, preenche: 'acento', alfa: 0.18 }); g.txt('m', xm + 1, yb + 1.6, { cor: 'texto', tam: 14, negrito: true });
      g.seta(xm + 2, 3.9, 0.95, 0, { cor: 'erro', rot: 'f', rotDx: 0.18, rotDy: 0.32 });
      g.txt('k', 1.2, 5.15, { cor: 's2', tam: 12, negrito: true }); g.txt('b', 1.2, 2.62, { cor: 's3', tam: 12, negrito: true });
      g.linha(3, 0.9, 3, 1.5, { cor: 'fraco', larg: 1 }); g.seta(3, 1.2, 1.4 * x, 0, { cor: 'info', larg: 1.8, ponta: 0.2 }); g.txt('x(t)', 3, 0.55, { cor: 'info', tam: 11.5, negrito: true });
      painel(g, 'Parâmetros', [['ωn = √(k/m)', fx(wn, 2) + ' rad/s'], ['ζ = b/(2√(km))', fx(z, 3)], ['natureza', s.classe, z <= 0 ? 'erro' : 'texto'], ['sobressinal', fx(s.Mp, 1) + ' %']], [{ t: 'm x″ + b x′ + k x = f(t)', cor: 'suave' }, { t: 'G(s) = X(s)/F(s) = 1/(m s² + b s + k)', cor: 'suave' }, { t: 'O valor final é f/k: depende só da mola.' }]);
    }
  });

  /* 3.2 — nível */
  F('#fig-3-2', {
    titulo: 'Figura 3.2', legenda: 'Aumentar a vazão de entrada eleva o nível até que a descarga, proporcional à altura, equilibre a entrada. A área define a inércia do sistema; a válvula define o ganho e também a constante de tempo.',
    vista: VISTA, altura: ALTURA, animar: true,
    controles: [{ id: 'A', rot: 'Área A', min: 1, max: 10, val: 4, passo: 0.5, un: 'm²' }, { id: 'R', rot: 'Resistência R', min: 2, max: 20, val: 10, passo: 1, un: 's/m²' }, { id: 'q', rot: 'Vazão de entrada', min: 0.05, max: 0.5, val: 0.3, passo: 0.05, un: 'm³/s' }],
    desenhar: function (g, p, t) {
      var tau = p.R * p.A, hf = p.R * p.q, tv = ((t % 8) / 7.2) * 5 * tau, h = hf * CS.y1(tau, Math.min(tv, 5 * tau)), x0 = 1.6, x1 = 6.6, y0 = 1, esc = 5 / 10, yh = y0 + h * esc;
      g.ret(x0, y0, x1 - x0, yh - y0, { cor: null, preenche: 's1', alfa: 0.4 });
      g.caminho([[x0, 6.6], [x0, y0], [x1, y0], [x1, 6.6]], { cor: 'forte', larg: 2.4 });
      g.linha(x0, y0 + hf * esc, x1, y0 + hf * esc, { cor: 'ok', larg: 1.3, tracejado: [5, 4] }); g.txt('equilíbrio', x1 - 0.1, y0 + hf * esc + 0.24, { cor: 'ok', tam: 10, alin: 'dir' });
      g.seta(x0 + 1.2, 7.4, 0, -1.2, { cor: 's1', rot: 'q entrada', rotDx: 1.05, rotDy: 0.9 });
      g.linha(x1, 1.5, 7.3, 1.5, { cor: 'forte', larg: 2.2 }); g.caminho([[7.3, 1.2], [7.3, 1.8], [7.8, 1.2], [7.8, 1.8]], { fechar: true, cor: 'aviso', larg: 1.8 }); g.seta(7.8, 1.5, 0.75, 0, { cor: 's1', rot: 'h/R', rotDx: -0.4, rotDy: 0.42 });
      g.cota(0.9, y0, 0.9, Math.max(yh, y0 + 0.02), 'h', { dx: -0.32, dy: 0 });
      painel(g, 'Tanque de nível', [['constante de tempo RA', fx(tau, 1) + ' s'], ['ganho K = R', fx(p.R, 1) + ' s/m²'], ['nível final R·q', fx(hf, 2) + ' m'], ['nível agora', fx(h, 2) + ' m', 'acento'], ['tempo', fx(tv, 0) + ' s']], [{ t: 'A dh/dt + h/R = q', cor: 'suave' }, { t: 'G(s) = R/(RAs + 1)', cor: 'suave' }, { t: 'Modelo linear: descarga proporcional à altura.' }]);
    }
  });

  /* 4.1 — linearização */
  F('#fig-4-1', {
    titulo: 'Figura 4.1', legenda: 'A reta tangente representa bem a curva perto do ponto de operação. Conforme o desvio cresce, o erro aumenta, e por isso o modelo linear vale apenas para pequenos desvios.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'h0', rot: 'Ponto de operação h₀', min: 1, max: 8, val: 4, passo: 0.25, un: 'm' }, { id: 'dh', rot: 'Desvio Δh', min: -3, max: 2, val: 1.5, passo: 0.05, un: 'm' }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 10, 0, 4, 'altura h (m)', 'vazão q', 2, 1), q0 = Math.sqrt(p.h0), d = 1 / (2 * q0), h = Math.max(0.02, p.h0 + p.dh), real = Math.sqrt(h), lin = q0 + d * (h - p.h0), err = 100 * (lin - real) / real;
      curva(g, a, Math.sqrt, 0.001, 10, { cor: 's1', larg: 2.6 }, 400);
      curva(g, a, function (x) { return q0 + d * (x - p.h0); }, 0, 10, { cor: 's2', larg: 2, tracejado: [7, 4] });
      g.circ(a.X(p.h0), a.Y(q0), 0.1, { cor: 'texto', preenche: 'texto' });
      g.linha(a.X(h), a.Y(Math.min(real, lin)), a.X(h), a.Y(Math.max(real, lin)), { cor: 'erro', larg: 2.4 });
      g.circ(a.X(h), a.Y(real), 0.08, { cor: 's1', preenche: 's1' }); g.circ(a.X(h), a.Y(lin), 0.08, { cor: 's2', preenche: 's2' });
      painel(g, 'q = √h', [['curva real', '━━', 's1'], ['tangente em h₀', '╍╍', 's2'], ['q₀ em h₀', fx(q0, 3)], ['inclinação em h₀', fx(d, 3)], ['vazão real', fx(real, 3)], ['vazão linearizada', fx(lin, 3)], ['erro do modelo', fx(err, 2) + ' %', Math.abs(err) > 5 ? 'erro' : 'ok']], [{ t: 'q − q₀ ≈ (dq/dh)₀ (h − h₀)', cor: 'suave' }]);
    }
  });

  /* 5.1 — redução de blocos */
  F('#fig-5-1', {
    titulo: 'Figura 5.1', legenda: 'Primeiro se reduz o laço interno de velocidade, depois o laço externo. O resultado é um sistema de segunda ordem, em que o ganho interno aumenta o amortecimento sem mudar a frequência natural.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k1', rot: 'Ganho k₁', min: 0.5, max: 20, val: 5, passo: 0.5 }, { id: 'kt', rot: 'Ganho de velocidade kₜ', min: 0, max: 1, val: 0.2, passo: 0.02 }],
    desenhar: function (g, p) {
      var y = 6.5, a = 2 + 10 * p.kt, wn = Math.sqrt(10 * p.k1), z = a / (2 * wn), Mp = CS.Mp(z);
      g.txt('R', 0, y, { cor: 'texto', tam: 12, negrito: true }); vaiV(g, 0.2, y, 0.93, y); soma(g, 1.2, y); g.txt('−', 0.76, y - 0.45, { cor: 'erro', tam: 13, negrito: true }); vaiV(g, 1.47, y, 2.1, y); bloco(g, 2.1, y, 1.2, 'k₁'); vaiV(g, 3.3, y, 4.13, y); soma(g, 4.4, y); g.txt('−', 3.96, y - 0.45, { cor: 'erro', tam: 13, negrito: true }); vaiV(g, 4.67, y, 5.3, y); bloco(g, 5.3, y, 2.7, '10/[s(s + 2)]');
      g.linha(8, y, 9.5, y, { cor: 'suave', larg: 1.6 }); vaiV(g, 9.5, y, 10.5, y); g.txt('Y', 10.75, y, { cor: 'texto', tam: 12, negrito: true });
      g.linha(8.7, y, 8.7, 5.35, { cor: 'suave', larg: 1.6 }); vaiV(g, 8.7, 5.35, 7.3, 5.35); bloco(g, 5.5, 5.35, 1.8, 'kₜ s', { cor: 's2' }); g.linha(5.5, 5.35, 4.4, 5.35, { cor: 'suave', larg: 1.6 }); vaiV(g, 4.4, 5.35, 4.4, y - 0.27);
      g.linha(9.5, y, 9.5, 4.5, { cor: 'suave', larg: 1.6 }); g.linha(9.5, 4.5, 1.2, 4.5, { cor: 'suave', larg: 1.6 }); vaiV(g, 1.2, 4.5, 1.2, y - 0.27);
      g.txt('diagrama original', 13.2, y + 0.55, { cor: 'fraco', tam: 10, alin: 'dir' });
      var y2 = 3.1;
      g.txt('R', 0, y2, { cor: 'texto', tam: 12, negrito: true }); vaiV(g, 0.2, y2, 0.93, y2); soma(g, 1.2, y2); g.txt('−', 0.76, y2 - 0.45, { cor: 'erro', tam: 13, negrito: true }); vaiV(g, 1.47, y2, 2.1, y2); bloco(g, 2.1, y2, 1.2, 'k₁'); vaiV(g, 3.3, y2, 4.2, y2); bloco(g, 4.2, y2, 3.8, '10/[s(s + ' + fx(a, 2) + ')]', { cor: 's1' });
      g.linha(8, y2, 9.5, y2, { cor: 'suave', larg: 1.6 }); vaiV(g, 9.5, y2, 10.5, y2); g.txt('Y', 10.75, y2, { cor: 'texto', tam: 12, negrito: true });
      g.linha(9.5, y2, 9.5, 1.95, { cor: 'suave', larg: 1.6 }); g.linha(9.5, 1.95, 1.2, 1.95, { cor: 'suave', larg: 1.6 }); vaiV(g, 1.2, 1.95, 1.2, y2 - 0.27);
      g.txt('laço interno reduzido', 13.2, y2 + 0.55, { cor: 'fraco', tam: 10, alin: 'dir' });
      var y3 = 0.75;
      g.txt('R', 0, y3, { cor: 'texto', tam: 12, negrito: true }); vaiV(g, 0.2, y3, 1.2, y3); bloco(g, 1.2, y3, 6.8, fx(10 * p.k1, 2) + '/(s² + ' + fx(a, 2) + ' s + ' + fx(10 * p.k1, 2) + ')', { cor: 's3' }); vaiV(g, 8, y3, 9.5, y3); g.txt('Y', 9.75, y3, { cor: 'texto', tam: 12, negrito: true });
      g.txt('malha fechada', 13.2, y3 + 0.55, { cor: 'fraco', tam: 10, alin: 'dir' });
      g.txt('ωn = ' + fx(wn, 2) + ' rad/s     ζ = ' + fx(z, 3) + '     sobressinal = ' + fx(Mp, 1) + ' %', 6.4, -0.45, { cor: 'acento', tam: 12, negrito: true });
    }
  });

  /* 6.1 — primeira ordem */
  F('#fig-6-1', {
    titulo: 'Figura 6.1', legenda: 'A resposta de primeira ordem atinge 63,2 % do valor final em uma constante de tempo e 98 % em quatro. A tangente na origem cruza o valor final exatamente em t = τ.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'tau', rot: 'Constante de tempo τ', min: 1, max: 20, val: 10, passo: 0.5, un: 's' }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 80, 0, 1.2, 'tempo (s)', 'y/K', 20, 0.2), tau = p.tau;
      g.linha(a.x0, a.Y(1), a.x1, a.Y(1), { cor: 'fraco', larg: 1.3, tracejado: [6, 4] });
      curva(g, a, function (t) { return t / tau; }, 0, tau, { cor: 's3', larg: 1.6, tracejado: [5, 4] });
      curva(g, a, function (t) { return CS.y1(tau, t); }, 0, 80, { cor: 's1', larg: 2.6 }, 400);
      [[tau, 0.632, 's2'], [4 * tau, 0.982, 's4']].forEach(function (m) { g.linha(a.X(m[0]), a.y0, a.X(m[0]), a.Y(m[1]), { cor: m[2], larg: 1.4, tracejado: [4, 3] }); g.circ(a.X(m[0]), a.Y(m[1]), 0.09, { cor: m[2], preenche: m[2] }); });
      painel(g, 'Marcos', [['τ', fx(tau, 1) + ' s', 's2'], ['y em τ', '63,2 %', 's2'], ['y em 2τ', '86,5 %'], ['y em 3τ', '95,0 %'], ['y em 4τ', '98,2 %', 's4'], ['4τ', fx(4 * tau, 1) + ' s', 's4'], ['subida 10 a 90 %', fx(2.197 * tau, 2) + ' s']], [{ t: 'G(s) = K/(τs + 1)', cor: 'suave' }, { t: 'y(t) = K(1 − e^(−t/τ))', cor: 'suave' }]);
    }
  });

  /* 6.2 — fechar a malha */
  F('#fig-6-2', {
    titulo: 'Figura 6.2', legenda: 'Com controle proporcional, fechar a malha divide a constante de tempo por 1 + KKp e deixa um erro em regime de 1/(1 + KKp). Aumentar o ganho acelera a resposta e reduz o erro, mas exige mais do atuador.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'kp', rot: 'Ganho proporcional Kp', min: 0, max: 20, val: 4, passo: 0.5 }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 40, 0, 1.2, 'tempo (s)', 'y(t)', 10, 0.2), tc = 10 / (1 + p.kp), yf = p.kp / (1 + p.kp);
      g.linha(a.x0, a.Y(1), a.x1, a.Y(1), { cor: 'ok', larg: 1.4, tracejado: [6, 4] });
      curva(g, a, function (t) { return CS.y1(10, t); }, 0, 40, { cor: 's3', larg: 2.1, tracejado: [7, 4] });
      curva(g, a, function (t) { return yf * CS.y1(tc, t); }, 0, 40, { cor: 's1', larg: 2.6 }, 400);
      g.linha(a.X(36), a.Y(yf), a.X(36), a.Y(1), { cor: 'erro', larg: 2.4 });
      painel(g, 'Planta 1/(10s + 1)', [['malha aberta', '╍╍', 's3'], ['malha fechada', '━━', 's1'], ['τ em malha aberta', '10 s'], ['τ em malha fechada', fx(tc, 2) + ' s', 'acento'], ['valor final', fx(yf, 3)], ['erro em regime', fx(1 - yf, 3), 'erro'], ['esforço inicial u(0)', fx(p.kp, 1)]], [{ t: 'τc = τ/(1 + KKp)', cor: 'suave' }, { t: 'ess = 1/(1 + KKp), ao degrau unitário', cor: 'suave' }]);
    }
  });

  /* 7.1 — geometria dos polos */
  F('#fig-7-1', {
    titulo: 'Figura 7.1', legenda: 'O módulo do polo complexo é a frequência natural, e o cosseno do ângulo com o semieixo real negativo é o fator de amortecimento. A distância ao eixo imaginário define a rapidez com que a resposta acomoda.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'z', rot: 'Amortecimento ζ', min: 0, max: 1.5, val: 0.5, passo: 0.01 }, { id: 'w', rot: 'Frequência natural ωn', min: 1, max: 5, val: 4, passo: 0.1, un: 'rad/s' }],
    desenhar: function (g, p) {
      var a = ax(g, [1.3, 7.8, 0.7, 6.7], -8, 2, -5.54, 5.54, 'parte real σ', 'jω', 2, 2), z = p.z, w = p.w, s = CS.segunda(z, w), arc = [], i;
      for (i = 0; i <= 80; i++) { var f = Math.PI / 2 + Math.PI * i / 80; arc.push([a.X(w * Math.cos(f)), a.Y(w * Math.sin(f))]); }
      g.caminho(arc, { cor: 'fraco', larg: 1.2, tracejado: [4, 4] });
      if (z < 1) {
        var sg = -z * w, wd = s.wd;
        g.linha(a.X(0), a.Y(0), a.X(sg), a.Y(wd), { cor: 's1', larg: 2 });
        g.linha(a.X(sg), a.Y(wd), a.X(sg), a.Y(-wd), { cor: 'fraco', larg: 1, tracejado: [3, 3] }); g.linha(a.X(sg), a.Y(wd), a.X(0), a.Y(wd), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
        xis(g, a.X(sg), a.Y(wd), 'erro'); xis(g, a.X(sg), a.Y(-wd), 'erro');
        var th = Math.acos(Math.max(0, z)), ra = [], r = 0.5, e0 = (a.x1 - a.x0) / (a.xb - a.xa);
        for (i = 0; i <= 24; i++) { var an = Math.PI - th * i / 24; ra.push([a.X(1.3 * Math.cos(an)), a.Y(1.3 * Math.sin(an))]); }
        g.caminho(ra, { cor: 's2', larg: 1.8 });
        if (z > 0.03 && th > 0.3) g.txt('θ', a.X(2 * Math.cos(Math.PI - th / 2)), a.Y(2 * Math.sin(Math.PI - th / 2)), { cor: 's2', tam: 12, negrito: true, fundo: true });
        g.txt('ωn', a.X(sg) - 0.1, a.Y(wd) + 0.34, { cor: 's1', tam: 11.5, negrito: true, alin: 'dir' });
        g.txt('ωd', a.X(0) + 0.14, a.Y(wd), { cor: 'suave', tam: 11.5, negrito: true, alin: 'esq' });
        r = e0;
      } else { var q = Math.sqrt(z * z - 1); xis(g, a.X(-w * (z - q)), a.Y(0), 'erro'); if (-w * (z + q) > -8) xis(g, a.X(-w * (z + q)), a.Y(0), 'erro'); }
      painel(g, 'Polos', [['ωn', fx(w, 2) + ' rad/s'], ['ζ = cos θ', fx(z, 3)], ['θ', z < 1 ? fx(Math.acos(z) * 180 / Math.PI, 1) + '°' : '—'], ['σ = ζωn', z < 1 ? fx(s.sig, 3) : '—'], ['ωd', z < 1 ? fx(s.wd, 3) + ' rad/s' : '0'], ['sobressinal', fx(s.Mp, 1) + ' %', 'acento'], ['natureza', s.classe]], [{ t: 'Polos sobre um mesmo raio têm o mesmo sobressinal. Polos sobre uma mesma vertical têm a mesma acomodação.' }]);
    }
  });

  /* 8.1 — Routh */
  F('#fig-8-1', {
    titulo: 'Figura 8.1', legenda: 'O arranjo de Routh para s³ + 3s² + 2s + K. Abaixo de K = 6, a primeira coluna é toda positiva. Acima de 6, cada troca de sinal corresponde a um polo no semiplano direito.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k', rot: 'Ganho K', min: 0.5, max: 12, val: 4, passo: 0.25 }],
    desenhar: function (g, p) {
      var P = [1, 3, 2, p.k], R = CS.routh(P), y = 6.2, passo = 0.95, i, nomes = ['s³', 's²', 's¹', 's⁰'];
      g.txt('Arranjo de Routh', 0.1, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('1ª coluna', 2.6, 6.85, { cor: 'acento', tam: 10.5, negrito: true }); g.txt('2ª coluna', 4.8, 6.85, { cor: 'fraco', tam: 10.5 });
      g.ret(1.75, y - passo * 3 - 0.42, 1.7, passo * 3 + 0.84, { cor: 'acento', larg: 1.3, preenche: 'acento', alfa: 0.08 });
      for (i = 0; i < 4; i++) { var yy = y - i * passo, v = R.linhas[i], neg = v[0] < 0; g.txt(nomes[i], 0.6, yy, { cor: 'suave', tam: 12, negrito: true }); g.txt(fx(v[0], 3), 2.6, yy, { cor: neg ? 'erro' : 'texto', tam: 13, negrito: true }); g.txt(i < 2 ? fx(v[1], 3) : '0', 4.8, yy, { cor: 'fraco', tam: 12 }); }
      var txt = R.linhaZero ? 'Linha nula em s¹: polos sobre o eixo imaginário. A malha é marginalmente estável.' : R.estavel ? 'Nenhuma troca de sinal: a malha é estável.' : R.trocas + ' trocas de sinal: ' + R.trocas + ' polos no semiplano direito. A malha é instável.';
      notas(g, 0.1, 2.3, 6.3, [{ t: txt, cor: R.estavel ? 'ok' : R.linhaZero ? 'aviso' : 'erro' }, { t: 'Linha s¹: (3·2 − 1·K)/3. Linha s⁰: K.', cor: 'suave' }, { t: 'Exige-se 0 < K < 6.' }]);
      var a = ax(g, [7.9, 13, 0.7, 6.7], -4, 1.5, -3, 3, 'parte real σ', 'jω', 1, 1);
      g.ret(a.x0, a.y0, a.X(0) - a.x0, a.y1 - a.y0, { cor: null, preenche: 'ok', alfa: 0.07 });
      CS.raizes(P).forEach(function (r) { xis(g, a.X(r.re), a.Y(r.im), r.re > 1e-4 ? 'erro' : 's1'); });
    }
  });

  /* 9.1 — erro à rampa */
  F('#fig-9-1', {
    titulo: 'Figura 9.1', legenda: 'A rampa só é seguida com erro nulo por um sistema de tipo 2. O tipo 1 segue com erro constante, igual a 1/Kv, e o tipo 0 fica cada vez mais para trás.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 't', rot: 'Tipo do sistema', min: 0, max: 2, val: 1, passo: 1 }, { id: 'k', rot: 'Ganho K', min: 1, max: 20, val: 4, passo: 0.5 }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 10, 0, 10, 'tempo (s)', 'r e y', 2, 2), N, D, Kv, nome;
      if (p.t === 0) { N = [p.k]; D = [1, 2 + p.k]; Kv = 0; nome = 'K/(s + 2)'; } else if (p.t === 1) { N = [p.k]; D = [1, 2, p.k]; Kv = p.k / 2; nome = 'K/[s(s + 2)]'; } else { N = [p.k, p.k]; D = [1, 2, p.k, p.k]; Kv = Infinity; nome = 'K(s + 1)/[s²(s + 2)]'; }
      var R = CS.degrau(N, CS.pmul(D, [1, 0]), 10, 2000), e = 10 - R.y[2000], pr = Kv === 0 ? Infinity : Kv === Infinity ? 0 : 1 / Kv;
      g.linha(a.X(0), a.Y(0), a.X(10), a.Y(10), { cor: 'ok', larg: 1.6, tracejado: [6, 4] }); serie(g, a, R.t, R.y, { cor: 's1', larg: 2.6 });
      painel(g, 'Entrada em rampa', [['referência r = t', '╍╍', 'ok'], ['saída y', '━━', 's1'], ['G(s)', nome], ['Kv', fx(Kv, 2)], ['erro previsto', fx(pr, 3), 'acento'], ['erro medido em t = 10 s', fx(e, 3)]], [{ t: 'ess = 1/Kv, com Kv = lim s·G(s) quando s → 0.', cor: 'suave' }, { t: 'O tipo é o número de integradores em malha aberta.' }]);
    }
  });

  /* 10.1 — lugar das raízes */
  F('#fig-10-1', {
    titulo: 'Figura 10.1', legenda: 'Lugar das raízes de K/[s(s + 1)(s + 2)]. Os ramos saem dos polos de malha aberta, dois deles se encontram na reta real e partem para as assíntotas de ±60°, cruzando o eixo imaginário em K = 6.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k', rot: 'Ganho K', min: 0.1, max: 12, val: 2, passo: 0.1 }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], -4, 1.5, -3, 3, 'parte real σ', 'jω', 1, 1), pl = CS.LGR.b, i, ca = -1;
      g.ret(a.x0, a.y0, a.X(0) - a.x0, a.y1 - a.y0, { cor: null, preenche: 'ok', alfa: 0.05 });
      var la = 4.2; [Math.PI / 3, -Math.PI / 3].forEach(function (t) { var dx = Math.min(2.5, la * Math.cos(t)), yy = dx * Math.tan(t); g.linha(a.X(ca), a.Y(0), a.X(ca + dx), a.Y(Math.max(-3, Math.min(3, yy))), { cor: 'fraco', larg: 1.2, tracejado: [5, 4] }); });
      var ctx = g.ctx; ctx.save(); ctx.fillStyle = g.cor('s1');
      for (i = 0; i <= 700; i++) { CS.malhaLGR(pl, Math.pow(10, -3 + i * 5 / 700)).polos.forEach(function (r) { if (r.re >= a.xa && r.re <= a.xb && r.im >= a.ya && r.im <= a.yb) { ctx.beginPath(); ctx.arc(g.X(a.X(r.re)), g.Y(a.Y(r.im)), 1.4, 0, 7); ctx.fill(); } }); }
      ctx.restore();
      pl.polos.forEach(function (r) { xis(g, a.X(r.re), a.Y(r.im), 'forte'); });
      var M = CS.malhaLGR(pl, p.k), est = p.k < 6 - 1e-6;
      M.polos.forEach(function (r) { g.ret(a.X(r.re) - 0.1, a.Y(r.im) - 0.1, 0.2, 0.2, { cor: 'erro', preenche: 'erro' }); });
      painel(g, 'Regras aplicadas', [['ramos', '3'], ['centroide', '−1'], ['assíntotas', '±60° e 180°'], ['saída da reta real', '−0,423'], ['K nesse ponto', '0,385'], ['cruza o eixo jω em', '±j1,414'], ['K crítico', '6'], ['estado agora', est ? 'estável' : p.k > 6 ? 'instável' : 'marginal', est ? 'ok' : 'erro']], [{ t: 'Quadrados vermelhos: polos em malha fechada no ganho escolhido.' }]);
    }
  });

  /* 11.1 — ações do PID */
  F('#fig-11-1', {
    titulo: 'Figura 11.1', legenda: 'A soma das três ações compõe o sinal de controle. A proporcional reage ao erro presente; a integral acumula e permanece no regime, e a derivativa freia a subida da medida.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'p', rot: 'Kp', min: 0, max: 10, val: 3, passo: 0.1 }, { id: 'i', rot: 'Ki', min: 0, max: 2, val: 0.4, passo: 0.02 }, { id: 'd', rot: 'Kd', min: 0, max: 12, val: 3, passo: 0.1 }],
    desenhar: function (g, q) {
      var R = CS.pid({ planta: CS.PLANTAS.p2, Kp: q.p, Ki: q.i, Kd: q.d, r: 1, d: 0, umax: 1e6, dMedida: true, antiwindup: false, T: 40, n: 4000 }), n = R.t.length - 1;
      var mn = Math.min(0, Math.min.apply(null, R.D), Math.min.apply(null, R.u)), mx = Math.max(1.2, Math.max.apply(null, R.P), Math.max.apply(null, R.I), Math.max.apply(null, R.u)), st = pass((mx - mn) / 5);
      mn = Math.floor(mn / st) * st; mx = Math.ceil(mx / st) * st;
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 40, mn, mx, 'tempo (s)', 'parcelas do sinal de controle', 10, st);
      serie(g, a, R.t, R.P, { cor: 's1', larg: 2 }); serie(g, a, R.t, R.I, { cor: 's2', larg: 2 }); serie(g, a, R.t, R.D, { cor: 's3', larg: 2 }); serie(g, a, R.t, R.u, { cor: 'texto', larg: 2.6 }); serie(g, a, R.t, R.y, { cor: 'ok', larg: 2, tracejado: [6, 4] });
      painel(g, 'Em t = 40 s', [['proporcional', fx(R.P[n], 3), 's1'], ['integral', fx(R.I[n], 3), 's2'], ['derivativa', fx(R.D[n], 3), 's3'], ['sinal u', fx(R.u[n], 3), 'texto'], ['saída y', fx(R.y[n], 3), 'ok']], [{ t: 'Planta 1/[(10s + 1)(2s + 1)], referência em degrau unitário e derivada sobre a medida.' }, { t: 'No regime, com erro nulo, quem sustenta o sinal é a integral.' }]);
    }
  });

  /* 12.1 — Bode e margens */
  F('#fig-12-1', {
    titulo: 'Figura 12.1', legenda: 'Diagrama de Bode de K/[s(s + 1)(s + 2)]. A margem de ganho é lida na frequência em que a fase vale −180°, e a de fase, na frequência em que o módulo vale 0 dB. Elas se anulam juntas em K = 6.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k', rot: 'Ganho K', min: 0.2, max: 20, val: 2, passo: 0.1 }],
    desenhar: function (g, p) {
      var pol = CS.LGR.b.polos, fm = function (v) { return fx(Math.pow(10, v), 2); };
      var a = ax(g, [1.4, 8.3, 4.3, 7.1], -2, 1, -80, 80, '', 'módulo (dB)', 1, 40, { semX: true, fmt: fm }), b = ax(g, [1.4, 8.3, 0.7, 3.5], -2, 1, -270, -90, 'frequência ω (rad/s)', 'fase (graus)', 1, 90, { fmt: fm });
      curva(g, a, function (l) { return CS.bodeZP(p.k, [], pol, Math.pow(10, l)).db; }, -2, 1, { cor: 's1', larg: 2.4 }, 300);
      curva(g, b, function (l) { return CS.bodeZP(p.k, [], pol, Math.pow(10, l)).fase; }, -2, 1, { cor: 's2', larg: 2.4 }, 300);
      g.linha(a.x0, a.Y(0), a.x1, a.Y(0), { cor: 'erro', larg: 1.1, tracejado: [5, 4] }); g.linha(b.x0, b.Y(-180), b.x1, b.Y(-180), { cor: 'erro', larg: 1.1, tracejado: [5, 4] });
      var M = CS.margens(p.k, [], pol), lc = Math.log10(M.wc), l180 = Math.log10(M.w180), dbw = CS.bodeZP(p.k, [], pol, M.w180).db;
      if (isFinite(lc) && lc > -2 && lc < 1) { g.linha(a.X(lc), a.Y(0), a.X(lc), b.y0, { cor: 'fraco', larg: 1, tracejado: [3, 3] }); g.linha(b.X(lc), b.Y(-180), b.X(lc), b.Y(CS.bodeZP(p.k, [], pol, M.wc).fase), { cor: 'acento', larg: 2.6 }); }
      if (isFinite(l180)) { g.linha(a.X(l180), b.Y(-180), a.X(l180), a.y1, { cor: 'fraco', larg: 1, tracejado: [3, 3] }); if (dbw > -80 && dbw < 80) g.linha(a.X(l180), a.Y(0), a.X(l180), a.Y(dbw), { cor: 'acento', larg: 2.6 }); }
      var est = M.MG > 0 && M.MF > 0;
      painel(g, 'Margens', [['ganho K', fx(p.k, 2)], ['ω em 0 dB', fx(M.wc, 3) + ' rad/s'], ['margem de fase', fx(M.MF, 1) + '°', M.MF > 0 ? 'ok' : 'erro'], ['ω em −180°', fx(M.w180, 3) + ' rad/s'], ['margem de ganho', fx(M.MG, 1) + ' dB', M.MG > 0 ? 'ok' : 'erro'], ['malha fechada', est ? 'estável' : 'instável', est ? 'ok' : 'erro']], [{ t: 'Barras em destaque: leitura das duas margens no gráfico.' }, { t: 'Valores usuais de projeto: margem de fase de 30° a 60° e de ganho acima de 6 dB.' }]);
    }
  });
})();

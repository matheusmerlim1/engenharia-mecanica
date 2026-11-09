/* ============================================================
   Figuras ilustrativas de Eletrotécnica
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.EL) return;
  var F = window.Figura.criar, EL = window.EL, VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }); }
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) { var linhas = [], atual = ''; ctx.save(); ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; it.t.split(' ').forEach(function (p) { var q = atual ? atual + ' ' + p : p; if (atual && ctx.measureText(q).width > larg) { linhas.push(atual); atual = p; } else atual = q; }); linhas.push(atual); ctx.restore(); linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; }); });
  }
  function painel(g, t, linhas, obs) {
    g.txt(t, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) { g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' }); g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true }); });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function eixos(g, xa, xb, ya, yb, rx, ry, px, py) {
    var x0 = 0.9, x1 = 8.3, y0 = 0.7, y1 = 6.7, v, X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); }, Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) { g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 }); }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) { g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' }); }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 }); g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    if (ya < 0 && yb > 0) g.linha(x0, Y(0), x1, Y(0), { cor: 'forte', larg: 1.2 });
    g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 }); g.txt(ry, x0 - 0.3, y1 + 0.38, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) { var p = [], i, m = n || 240, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; }; for (i = 0; i <= m; i++) { var v = xa + (xb - xa) * i / m, y = f(v); if (!isFinite(y) || y < a.ya || y > a.yb) fe(); else p.push([a.X(v), a.Y(y)]); } fe(); }
  var CFASE = ['erro', 's1', 'ok'];

  /* 1.1 — ondas trifásicas */
  F('#fig-1-1', {
    titulo: 'Figura 1.1', legenda: 'As três tensões estão defasadas em 120°. Em qualquer instante, a soma delas é zero, e a potência total de uma carga equilibrada não pulsa.',
    vista: VISTA, altura: ALTURA, animar: true,
    controles: [{ id: 'VL', rot: 'Tensão de linha', min: 127, max: 690, val: 380, passo: 1, un: 'V' }],
    desenhar: function (g, p, t) {
      var Vf = p.VL / Math.sqrt(3), Vp = Vf * Math.SQRT2, ymax = Vp * 1.25, a = eixos(g, 0, 720, -ymax, ymax, 'ângulo (°)', 'tensão (V)', 120, Math.round(ymax / 2 / 50) * 50 || 50);
      [0, 1, 2].forEach(function (k) { curva(g, a, function (d) { return Vp * Math.sin((d - 120 * k) * Math.PI / 180); }, 0, 720, { cor: CFASE[k], larg: 2.2 }); });
      var d = (t * 90) % 720, soma = 0;
      g.linha(a.X(d), a.y0, a.X(d), a.y1, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      [0, 1, 2].forEach(function (k) { var v = Vp * Math.sin((d - 120 * k) * Math.PI / 180); soma += v; g.circ(a.X(d), a.Y(v), 0.11, { preenche: CFASE[k], cor: null }); });
      painel(g, 'Rede', [['tensão de linha', fx(p.VL, 0) + ' V'], ['tensão de fase', fx(Vf, 1) + ' V', 's1'], ['valor de pico (fase)', fx(Vp, 1) + ' V'], ['soma instantânea', fx(Math.abs(soma) < 1e-6 ? 0 : soma, 1) + ' V', 'ok']], [{ t: 'o ponto percorre as ondas: a soma é sempre zero' }]);
    }
  });

  /* 2.1 */
  F('#fig-2-1', {
    titulo: 'Figura 2.1', legenda: 'A potência ativa é fixa. Os capacitores reduzem o cateto reativo, e a hipotenusa, que define a corrente, encolhe com ele.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'f1', rot: 'cos φ atual', min: 0.4, max: 0.99, val: 0.7, passo: 0.01 }, { id: 'f2', rot: 'cos φ desejado', min: 0.4, max: 1, val: 0.95, passo: 0.01 }],
    desenhar: function (g, p) {
      var P = 100, Q1 = P * Math.tan(Math.acos(p.f1)), Q2 = P * Math.tan(Math.acos(p.f2)), ymax = Math.max(Q1, 40) * 1.15, e = Math.min(7 / P, 5.5 / ymax), x0 = 1, y0 = 0.9;
      var X = function (v) { return x0 + v * e; }, Y = function (v) { return y0 + v * e; };
      g.linha(X(0), Y(0), X(P), Y(0), { cor: 's1', larg: 3 }); g.linha(X(P), Y(0), X(P), Y(Q1), { cor: 'erro', larg: 2.4 }); g.linha(X(0), Y(0), X(P), Y(Q1), { cor: 'erro', larg: 2.4 });
      g.linha(X(P), Y(0), X(P), Y(Q2), { cor: 'ok', larg: 4 }); g.linha(X(0), Y(0), X(P), Y(Q2), { cor: 'ok', larg: 2.6 });
      g.txt('P = 100 kW', X(50), Y(0) - 0.3, { cor: 's1', tam: 11, negrito: true });
      var Qc = Q1 - Q2;
      painel(g, 'Para 100 kW', [['Q antes', fx(Q1, 1) + ' kvar', 'erro'], ['Q depois', fx(Q2, 1) + ' kvar', 'ok'], ['banco Qc', fx(Math.max(0, Qc), 1) + ' kvar'], ['S antes', fx(P / p.f1, 1) + ' kVA', 'erro'], ['S depois', fx(P / p.f2, 1) + ' kVA', 'ok']]);
    }
  });

  /* 3.1 */
  F('#fig-3-1', {
    titulo: 'Figura 3.1', legenda: 'A tensão induzida é proporcional à inclinação do fluxo: é máxima quando o fluxo cruza o zero, e nula em seus picos.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'N', rot: 'Espiras', min: 50, max: 500, val: 200, passo: 10 }, { id: 'f', rot: 'Frequência', min: 10, max: 120, val: 60, passo: 5, un: 'Hz' }, { id: 'P', rot: 'Fluxo de pico', min: 0.001, max: 0.02, val: 0.005, passo: 0.0005, un: 'Wb' }],
    desenhar: function (g, p) {
      var Em = 2 * Math.PI * p.f * p.N * p.P, a = eixos(g, 0, 720, -1.3, 1.3, 'ângulo (°)', 'valores normalizados', 180, 0.5);
      curva(g, a, function (d) { return Math.sin(d * Math.PI / 180); }, 0, 720, { cor: 's1', larg: 2.4 });
      curva(g, a, function (d) { return -Math.cos(d * Math.PI / 180); }, 0, 720, { cor: 'erro', larg: 2.4 });
      painel(g, 'Bobina', [['E de pico', fx(Em, 1) + ' V', 'erro'], ['E eficaz', fx(Em / Math.SQRT2, 1) + ' V'], ['4,44·f·N·Φ', fx(4.44 * p.f * p.N * p.P, 1) + ' V', 'ok']], [{ t: 'azul: fluxo; vermelho: tensão induzida (e = −N dΦ/dt)' }]);
    }
  });

  /* 4.1 */
  F('#fig-4-1', {
    titulo: 'Figura 4.1', legenda: 'As perdas no ferro são fixas e as perdas no cobre crescem com o quadrado da carga. O rendimento é máximo no ponto em que as duas se igualam.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'fe', rot: 'Perda no ferro', min: 100, max: 2000, val: 500, passo: 50, un: 'W' }, { id: 'cu', rot: 'Perda no cobre nominal', min: 300, max: 3000, val: 1200, passo: 50, un: 'W' }, { id: 'x', rot: 'Carregamento', min: 5, max: 130, val: 80, passo: 1, un: '%' }],
    desenhar: function (g, p) {
      var S = 100000, h = function (x) { return 100 * x * S / (x * S + p.fe + x * x * p.cu); }, ym = 90, a = eixos(g, 0, 1.3, ym, 100, 'carga (p.u.)', 'rendimento (%)', 0.2, 2);
      curva(g, a, h, 0.01, 1.3, { cor: 's1', larg: 2.6 });
      var xo = Math.sqrt(p.fe / p.cu), x = p.x / 100;
      if (xo <= 1.3) g.circ(a.X(xo), a.Y(h(xo)), 0.13, { preenche: 'ok', cor: null });
      if (h(x) >= ym) g.circ(a.X(x), a.Y(h(x)), 0.11, { preenche: 'erro', cor: null });
      painel(g, 'Transformador de 100 kVA', [['η em ' + fx(p.x, 0) + ' %', fx(h(x), 2) + ' %', 'erro'], ['carga de η máximo', fx(100 * xo, 1) + ' %', 'ok'], ['η máximo', fx(h(xo), 2) + ' %', 'ok'], ['perda no cobre', fx(x * x * p.cu, 0) + ' W']], [{ t: 'fator de potência unitário' }]);
    }
  });

  /* 5.1 */
  F('#fig-5-1', {
    titulo: 'Figura 5.1', legenda: 'As três correntes defasadas somam um vetor de módulo constante, que gira na rotação síncrona. O rotor o persegue, sempre um pouco atrás, e é essa diferença que induz a corrente nas barras.',
    vista: VISTA, altura: ALTURA, animar: true,
    controles: [{ id: 'p', rot: 'Número de polos', min: 2, max: 8, val: 4, passo: 2 }, { id: 'f', rot: 'Frequência', min: 10, max: 60, val: 60, passo: 5, un: 'Hz' }, { id: 's', rot: 'Escorregamento', min: 0.5, max: 30, val: 3, passo: 0.5, un: '%' }],
    desenhar: function (g, p, t) {
      var cx = 4.5, cy = 3.6, R = 2.9, vel = 1.2, th = t * vel, k;
      g.circ(cx, cy, R, { cor: 'forte', larg: 2 });
      var soma = [0, 0];
      for (k = 0; k < 3; k++) {
        var ang = k * 2 * Math.PI / 3, I = Math.cos(th - ang), u = [Math.cos(ang), Math.sin(ang)];
        g.linha(cx - u[0] * R, cy - u[1] * R, cx + u[0] * R, cy + u[1] * R, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        if (Math.abs(I) > 0.02) g.seta(cx, cy, u[0] * I * 1.7, u[1] * I * 1.7, { cor: CFASE[k], larg: 2, ponta: 0.16 });
        soma[0] += u[0] * I; soma[1] += u[1] * I;
      }
      g.seta(cx, cy, soma[0] * 1.7, soma[1] * 1.7, { cor: 'texto', larg: 3.4, ponta: 0.26 });
      var rot = th * (1 - p.s / 100) - 0.5;
      g.circ(cx + Math.cos(rot) * 1.2, cy + Math.sin(rot) * 1.2, 0.13, { preenche: 'aviso', cor: null });
      var ns = 120 * p.f / p.p;
      painel(g, 'Campo girante', [['rotação síncrona', fx(ns, 0) + ' rpm', 's1'], ['rotação do rotor', fx(ns * (1 - p.s / 100), 0) + ' rpm', 'aviso'], ['módulo resultante', '1,5 × I máx.', 'ok'], ['frequência no rotor', fx(p.f * p.s / 100, 2) + ' Hz']], [{ t: 'vetores coloridos: cada fase; vetor maior: campo resultante; ponto laranja: rotor' }]);
    }
  });

  /* 6.1 */
  F('#fig-6-1', {
    titulo: 'Figura 6.1', legenda: 'A potência que entra pelo estator perde uma parte no cobre e no ferro. Da que chega ao rotor, uma fração igual ao escorregamento vira calor nas barras.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'p', rot: 'Potência no eixo', min: 1, max: 75, val: 15, passo: 0.5, un: 'kW' }, { id: 's', rot: 'Escorregamento', min: 0.5, max: 15, val: 2.8, passo: 0.1, un: '%' }, { id: 'pe', rot: 'Perdas no estator', min: 1, max: 12, val: 5, passo: 0.5, un: '% da entrada' }],
    desenhar: function (g, p) {
      var s = p.s / 100, Pag = p.p / (1 - s), Pin = Pag / (1 - p.pe / 100), Pr = s * Pag, Pe = Pin - Pag, esc = 6.5 / Pin, base = 1.2, W = 2.0, xs = [1.0, 4.0, 7.0];
      [[xs[0], Pin, 's1', 'rede'], [xs[1], Pag, 'aviso', 'entreferro'], [xs[2] - 0.2, p.p, 'ok', 'eixo']].forEach(function (d) { g.ret(d[0], base, W * 0.8, d[1] * esc * 0.75, { cor: d[2], larg: 1.4, preenche: d[2], alfa: 0.4 }); g.txt(d[3], d[0] + W * 0.4, base - 0.3, { cor: d[2], tam: 11, negrito: true }); g.txt(fx(d[1], 2), d[0] + W * 0.4, base + d[1] * esc * 0.75 + 0.3, { cor: 'texto', tam: 10.5, negrito: true }); });
      painel(g, 'Fluxo de potência (kW)', [['entrada', fx(Pin, 2), 's1'], ['perdas no estator', fx(Pe, 2), 'erro'], ['no entreferro', fx(Pag, 2), 'aviso'], ['perda no rotor s·P', fx(Pr, 3), 'erro'], ['no eixo', fx(p.p, 2), 'ok'], ['rendimento', fx(100 * p.p / Pin, 1) + ' %']]);
    }
  });

  /* 7.1 */
  F('#fig-7-1', {
    titulo: 'Figura 7.1', legenda: 'Em estrela, a curva inteira do motor é reduzida a um terço. Se ela cruzar a carga em rotação baixa, o motor fica preso ali.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'Tc', rot: 'Conjugado da carga constante', min: 20, max: 200, val: 80, passo: 2, un: 'N·m' }],
    desenhar: function (g, p) {
      var m = EL.motor({ V: 220, f: 60, p: 4, R1: 0.2, X1: 0.5, R2: 0.25, X2: 0.5, Xm: 20 }), a = eixos(g, 0, 1800, 0, 350, 'n (rpm)', 'T (N·m)', 300, 50), T = function (n) { return m.T(Math.max(1e-4, 1 - n / 1800)); };
      curva(g, a, T, 0, 1799, { cor: 's1', larg: 2.6 }, 400);
      curva(g, a, function (n) { return T(n) / 3; }, 0, 1799, { cor: 'erro', larg: 2.6 }, 400);
      curva(g, a, function () { return p.Tc; }, 0, 1799, { cor: 'aviso', larg: 2, tracejado: [6, 4] });
      var Y = T(0) / 3, ok = Y > p.Tc;
      painel(g, 'Conjugado na partida', [['em triângulo', fx(T(0), 0) + ' N·m', 's1'], ['em estrela', fx(Y, 0) + ' N·m', 'erro'], ['carga', fx(p.Tc, 0) + ' N·m', 'aviso'], ['estrela parte?', ok ? 'sim' : 'não', ok ? 'ok' : 'erro']], [{ t: 'azul: triângulo; vermelho: estrela; laranja: carga' }]);
    }
  });

  /* 8.1 */
  F('#fig-8-1', {
    titulo: 'Figura 8.1', legenda: 'Para fechar o disjuntor, as ondas do gerador e da rede precisam coincidir. Quanto maior a diferença, maior a tensão sobre o disjuntor e o choque no eixo.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'd', rot: 'Diferença de fase', min: -180, max: 180, val: 40, passo: 1, un: '°' }, { id: 'v', rot: 'Tensão do gerador', min: 80, max: 120, val: 100, passo: 1, un: '%' }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 720, -1.4, 1.4, 'ângulo (°)', 'tensão (p.u.)', 180, 0.5), de = p.d * Math.PI / 180, v = p.v / 100;
      curva(g, a, function (t) { return Math.sin(t * Math.PI / 180); }, 0, 720, { cor: 's1', larg: 2.4 });
      curva(g, a, function (t) { return v * Math.sin(t * Math.PI / 180 + de); }, 0, 720, { cor: 'erro', larg: 2.4 });
      var D = Math.sqrt(1 + v * v - 2 * v * Math.cos(de)), ok = D < 0.1;
      painel(g, 'Sincronismo', [['tensão no disjuntor', fx(D, 3) + ' p.u.', ok ? 'ok' : 'erro'], ['situação', ok ? 'pode fechar' : 'não fechar', ok ? 'ok' : 'erro']], [{ t: 'azul: rede; vermelho: gerador' }]);
    }
  });

  /* 9.1 */
  F('#fig-9-1', {
    titulo: 'Figura 9.1', legenda: 'A curva do relé térmico precisa passar acima do ponto de partida, para não desarmar enquanto o motor acelera, e abaixo do limite térmico do enrolamento.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'Ip', rot: 'Corrente de partida', min: 3, max: 9, val: 7, passo: 0.1, un: '× In' }, { id: 'tp', rot: 'Tempo de partida', min: 1, max: 30, val: 6, passo: 0.5, un: 's' }, { id: 'cl', rot: 'Classe do relé', min: 5, max: 30, val: 10, passo: 5 }],
    desenhar: function (g, p) {
      var a = eixos(g, 1, 10, 0, 4, 'corrente (× In)', 'log₁₀ do tempo (s)', 1, 1);
      var lim = function (m) { return Math.log(p.cl * 7.2 * 7.2 / Math.max(m * m - 1.15 * 1.15, 1e-3)) / Math.LN10; };
      var mot = function (m) { return Math.log(3.2 * 32 * 7.2 * 7.2 / Math.max(m * m - 1, 1e-3)) / Math.LN10; };
      curva(g, a, lim, 1.2, 10, { cor: 's1', larg: 2.6 });
      curva(g, a, mot, 1.1, 10, { cor: 'erro', larg: 2.2 });
      var lt = Math.log(p.tp) / Math.LN10, ok = lt < lim(p.Ip);
      g.circ(a.X(p.Ip), a.Y(lt), 0.14, { preenche: ok ? 'ok' : 'aviso', cor: null });
      painel(g, 'Coordenação', [['partida', fx(p.tp, 1) + ' s em ' + fx(p.Ip, 1) + ' × In'], ['relé desarma em', fx(Math.pow(10, lim(p.Ip)), 1) + ' s', 's1'], ['situação', ok ? 'parte sem desarmar' : 'desarma na partida', ok ? 'ok' : 'erro']], [{ t: 'azul: relé, classe definida pelo tempo a 7,2 × In; vermelho: limite térmico típico (ilustrativo)' }]);
    }
  });
})();

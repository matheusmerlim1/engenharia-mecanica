/* ============================================================
   Figuras ilustrativas de Métodos Numéricos
   Passos de Euler, Heun e RK4, plano de fase, multipasso,
   regiões de estabilidade, tiro, potência, características,
   moléculas de cálculo, von Neumann, Liebmann e dispersão.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }); }

  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) {
      var linhas = [], atual = '';
      ctx.save();
      ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      it.t.split(' ').forEach(function (pal) {
        var prova = atual ? atual + ' ' + pal : pal;
        if (atual && ctx.measureText(prova).width > larg) { linhas.push(atual); atual = pal; } else atual = prova;
      });
      linhas.push(atual);
      ctx.restore();
      linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; });
    });
  }
  function painel(g, titulo, linhas, obs) {
    g.txt(titulo, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) {
      g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true });
    });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function eixos(g, xa, xb, ya, yb, rx, ry, px, py) {
    var x0 = 0.9, x1 = 8.3, y0 = 0.7, y1 = 6.7, v;
    var X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); };
    var Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) {
      g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
      g.txt(fx(v, 2), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 });
    }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) {
      g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
      g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
    }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
    g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    if (ya < 0 && yb > 0) g.linha(x0, Y(0), x1, Y(0), { cor: 'forte', larg: 1.2 });
    g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 });
    g.txt(ry, x0 - 0.3, y1 + 0.38, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) {
    var pts = [], i, m = n || 240;
    var fecha = function () { if (pts.length > 1) g.caminho(pts, o); pts = []; };
    for (i = 0; i <= m; i++) {
      var v = xa + (xb - xa) * i / m, y = f(v);
      if (!isFinite(y) || y < a.ya || y > a.yb) fecha(); else pts.push([a.X(v), a.Y(y)]);
    }
    fecha();
  }
  var G = function (x, y) { return 4 * Math.exp(0.8 * x) - 0.5 * y; };
  var GEX = function (x) { return 4 / 1.3 * (Math.exp(0.8 * x) - Math.exp(-0.5 * x)) + 2 * Math.exp(-0.5 * x); };
  var POLI = function (x) { return -2 * x * x * x + 12 * x * x - 20 * x + 8.5; };
  var PEX = function (x) { return -0.5 * Math.pow(x, 4) + 4 * x * x * x - 10 * x * x + 8.5 * x + 1; };

  /* 1.1 */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'O método de Euler segue a inclinação do início de cada passo. Com passo grande, a solução numérica se afasta da exata; ao reduzir o passo, ela se aproxima na mesma proporção.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'h', rot: 'Passo h', min: 0.05, max: 1, val: 0.5, passo: 0.05 }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 4, 0, 10, 'x', 'y', 1, 2);
      curva(g, a, PEX, 0, 4, { cor: 's1', larg: 2.6 });
      var y = 1, x = 0, n = Math.round(4 / p.h), pts = [[a.X(0), a.Y(1)]], i, h = 4 / n;
      for (i = 0; i < n; i++) { y += h * POLI(x); x += h; pts.push([a.X(x), a.Y(Math.max(0, Math.min(10, y)))]); }
      g.caminho(pts, { cor: 'erro', larg: 1.8 });
      pts.forEach(function (q) { g.circ(q[0], q[1], 0.07, { preenche: 'erro', cor: null }); });
      painel(g, 'Em x = 4', [['passo h', fx(h, 3)], ['número de passos', fx(n, 0)], ['Euler', fx(y, 3), 'erro'], ['exata', fx(PEX(4), 3), 's1'], ['erro global', fx(Math.abs(y - PEX(4)), 3)]],
        [{ t: 'azul: solução exata; vermelho: Euler' }, { t: 'reduzir h à metade reduz o erro global à metade' }]);
    }
  });

  /* 2.1 */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Heun avança um passo de Euler como preditor, calcula a inclinação no ponto de chegada e refaz o passo com a média das duas inclinações.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'h', rot: 'Passo h', min: 0.1, max: 1.5, val: 1, passo: 0.05 }],
    desenhar: function (g, p) {
      var h = p.h, a = eixos(g, 0, 1.6, 0, 12, 'x', 'y', 0.4, 2);
      curva(g, a, GEX, 0, 1.6, { cor: 's1', larg: 2.4 });
      var k1 = G(0, 2), yp = 2 + h * k1, k2 = G(h, yp), yh = 2 + h / 2 * (k1 + k2);
      g.linha(a.X(0), a.Y(2), a.X(h), a.Y(yp), { cor: 'erro', larg: 1.8 });
      g.linha(a.X(0), a.Y(2), a.X(h), a.Y(yh), { cor: 'ok', larg: 2.4 });
      g.linha(a.X(h), a.Y(yp), a.X(h), a.Y(Math.min(12, yh)), { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.circ(a.X(h), a.Y(yp), 0.1, { preenche: 'erro', cor: null });
      g.circ(a.X(h), a.Y(yh), 0.12, { preenche: 'ok', cor: null });
      g.circ(a.X(0), a.Y(2), 0.1, { preenche: 'texto', cor: null });
      painel(g, 'Um passo de Heun', [['k₁ (início)', fx(k1, 4)], ['preditor y⁰', fx(yp, 4), 'erro'], ['k₂ (fim)', fx(k2, 4)], ['Heun', fx(yh, 4), 'ok'], ['exata', fx(GEX(h), 4), 's1'], ['erro', fx(Math.abs(yh - GEX(h)), 4)]],
        [{ t: 'vermelho: preditor de Euler; verde: passo com a inclinação média' }]);
    }
  });

  /* 3.1 */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'As quatro inclinações do RK4: uma no início, duas no meio e uma no fim do passo. A média ponderada, com pesos 1, 2, 2 e 1, é a inclinação final.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'h', rot: 'Passo h', min: 0.2, max: 1.5, val: 1, passo: 0.05 }],
    desenhar: function (g, p) {
      var h = p.h, a = eixos(g, 0, 1.6, 0, 12, 'x', 'y', 0.4, 2);
      curva(g, a, GEX, 0, 1.6, { cor: 's1', larg: 2.2 });
      var k1 = G(0, 2), k2 = G(h / 2, 2 + h / 2 * k1), k3 = G(h / 2, 2 + h / 2 * k2), k4 = G(h, 2 + h * k3), y = 2 + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      var r = function (x, yy, k, cor) { var d = h * 0.16; g.linha(a.X(x - d), a.Y(yy - k * d), a.X(x + d), a.Y(yy + k * d), { cor: cor, larg: 3 }); g.circ(a.X(x), a.Y(yy), 0.08, { preenche: cor, cor: null }); };
      r(0.16 * h, 2 + 0.16 * h * k1, k1, 'erro');
      r(h / 2, 2 + h / 2 * k1, k2, 'aviso');
      r(h / 2, 2 + h / 2 * k2, k3, 's6');
      r(h * 0.84, 2 + h * k3 - 0.16 * h * k4, k4, 's4');
      g.linha(a.X(0), a.Y(2), a.X(h), a.Y(y), { cor: 'ok', larg: 2.2, tracejado: [6, 4] });
      g.circ(a.X(h), a.Y(y), 0.12, { preenche: 'ok', cor: null });
      painel(g, 'RK4', [['k₁', fx(k1, 4), 'erro'], ['k₂', fx(k2, 4), 'aviso'], ['k₃', fx(k3, 4), 's6'], ['k₄', fx(k4, 4), 's4'], ['média ponderada', fx((k1 + 2 * k2 + 2 * k3 + k4) / 6, 4), 'ok'], ['y(h) numérico', fx(y, 5)], ['erro', fx(Math.abs(y - GEX(h)), 5)]]);
    }
  });

  /* 4.1 */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'No plano de fase, um oscilador sem amortecimento percorre uma elipse fechada. O Euler explícito espirala para fora, ganhando energia a cada volta; o RK4 acompanha a curva.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'c', rot: 'Amortecimento c', min: 0, max: 1, val: 0, passo: 0.05 },
      { id: 'h', rot: 'Passo h', min: 0.02, max: 0.3, val: 0.1, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, -2.2, 2.2, -2.2, 2.2, 'y (posição)', 'z (velocidade)', 1, 1);
      var f = function (u) { return [u[1], -p.c * u[1] - u[0]]; };
      var ad = function (u, k, s) { return [u[0] + s * k[0], u[1] + s * k[1]]; };
      var eu = [1, 0], rk = [1, 0], pe = [], pr = [], i, n = Math.round(12 / p.h), h = p.h;
      for (i = 0; i <= n; i++) {
        pe.push([a.X(Math.max(-2.2, Math.min(2.2, eu[0]))), a.Y(Math.max(-2.2, Math.min(2.2, eu[1])))]);
        pr.push([a.X(rk[0]), a.Y(rk[1])]);
        eu = ad(eu, f(eu), h);
        var k1 = f(rk), k2 = f(ad(rk, k1, h / 2)), k3 = f(ad(rk, k2, h / 2)), k4 = f(ad(rk, k3, h));
        rk = [rk[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), rk[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
      }
      g.caminho(pe, { cor: 'erro', larg: 1.6 });
      g.caminho(pr, { cor: 'ok', larg: 2.2 });
      var E = function (u) { return (u[0] * u[0] + u[1] * u[1]) / 2; };
      painel(g, 'Energia em t = 12', [['inicial', '0,5'], ['Euler', fx(E(eu), 4), 'erro'], ['RK4', fx(E(rk), 4), 'ok']],
        [{ t: 'vermelho: Euler; verde: RK4' }, { t: 'com c = 0, a energia deveria permanecer constante' }]);
    }
  });

  /* 5.1 */
  var COEF = { 1: [[1], 1, 'Euler'], 2: [[3, -1], 2, 'AB2'], 3: [[23, -16, 5], 12, 'AB3'], 4: [[55, -59, 37, -9], 24, 'AB4'] };
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Adams-Bashforth interpola as inclinações já calculadas e extrapola para o intervalo seguinte. Os pesos crescem com a ordem e alternam de sinal, o que explica a região de estabilidade menor.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k', rot: 'Ordem do método', min: 1, max: 4, val: 4, passo: 1 }],
    desenhar: function (g, p) {
      var k = Math.round(p.k), C = COEF[k], y0 = 3.6, esc = 2.6 / (Math.max.apply(null, C[0].map(Math.abs)) / C[1]);
      g.linha(0.5, y0, 8.3, y0, { cor: 'forte', larg: 1.4 });
      var X = function (i) { return 6.4 - i * 1.5; };
      g.ret(X(0), 0.9, 1.5, 5.4, { cor: null, preenche: 's1', alfa: 0.1 });
      g.txt('passo novo', X(0) + 0.75, 6.6, { cor: 's1', tam: 10.5, negrito: true });
      C[0].forEach(function (c, i) {
        var v = c / C[1], h = v * esc, cor = v > 0 ? 'ok' : 'erro';
        g.ret(X(i) - 0.35, v > 0 ? y0 : y0 + h, 0.7, Math.abs(h), { cor: cor, larg: 1.2, preenche: cor, alfa: 0.3 });
        g.txt(fx(v, 3), X(i), v > 0 ? y0 + h + 0.28 : y0 + h - 0.28, { cor: cor, tam: 10.5, negrito: true });
        g.txt(i ? 'f(n−' + i + ')' : 'f(n)', X(i), v > 0 ? y0 - 0.32 : y0 + 0.32, { cor: 'suave', tam: 10 });
      });
      var soma = C[0].reduce(function (s, c) { return s + c; }, 0) / C[1];
      painel(g, C[2], [['ordem', String(k)], ['avaliações novas por passo', '1'], ['pontos anteriores usados', String(k)], ['soma dos pesos', fx(soma, 3), 'ok']],
        [{ t: 'a soma dos pesos é sempre 1: é a condição de consistência' }]);
    }
  });

  /* 6.1 */
  var RF = {
    1: ['Euler explícito', function (z) { return [1 + z[0], z[1]]; }],
    2: ['Heun (RK2)', function (z) { return add([1 + z[0], z[1]], scale(mul(z, z), 0.5)); }],
    3: ['RK4', function (z) { var z2 = mul(z, z), z3 = mul(z2, z), z4 = mul(z3, z); return add(add(add([1 + z[0], z[1]], scale(z2, 0.5)), scale(z3, 1 / 6)), scale(z4, 1 / 24)); }],
    4: ['Euler implícito', function (z) { var d = [1 - z[0], -z[1]], m = d[0] * d[0] + d[1] * d[1]; return [d[0] / m, -d[1] / m]; }]
  };
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function scale(a, s) { return [a[0] * s, a[1] * s]; }
  function mul(a, b) { return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]; }
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'A área colorida do plano complexo é o conjunto de valores de hλ em que o método é estável. Os explícitos têm uma região limitada; o Euler implícito é estável em todo o semiplano esquerdo.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'm', rot: 'Método (1 Euler, 2 Heun, 3 RK4, 4 implícito)', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'z', rot: 'hλ (real)', min: -4, max: 0, val: -1.5, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, -4, 1, -3, 3, 'Re(hλ)', 'Im(hλ)', 1, 1), M = RF[Math.round(p.m)], R = M[1], i, j, nx = 62, ny = 62;
      var dx = 5 / nx, dy = 6 / ny, sx = a.X(dx) - a.X(0), sy = a.Y(dy) - a.Y(0);
      for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
        var x = -4 + (i + 0.5) * dx, y = -3 + (j + 0.5) * dy, r = R([x, y]);
        if (r[0] * r[0] + r[1] * r[1] <= 1) g.ret(a.X(-4 + i * dx), a.Y(-3 + j * dy), sx + 0.01, sy + 0.01, { cor: null, preenche: 's1', alfa: 0.32 });
      }
      g.linha(a.X(0), a.y0, a.X(0), a.y1, { cor: 'forte', larg: 1.2 });
      var v = R([p.z, 0]), mod = Math.hypot(v[0], v[1]), ok = mod <= 1;
      g.circ(a.X(p.z), a.Y(0), 0.14, { preenche: ok ? 'ok' : 'erro', cor: null });
      painel(g, M[0], [['hλ', fx(p.z, 2)], ['|R(hλ)|', fx(mod, 4), ok ? 'ok' : 'erro'], ['situação', ok ? 'estável' : 'instável', ok ? 'ok' : 'erro']], [{ t: 'área azul: região de estabilidade' }]);
    }
  });

  /* 7.1 */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'O tiro chuta a inclinação inicial e integra até a outra ponta. Em problema linear, a temperatura final é função linear do chute, e dois tiros bastam para achar o valor correto.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'z', rot: 'Inclinação inicial z', min: 5, max: 25, val: 10, passo: 0.1 }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 10, 0, 350, 'x (m)', 'T (°C)', 2, 50);
      var S = function (z) { var A = (20 + 10 * z) / 2, B = (20 - 10 * z) / 2; return function (x) { return A * Math.exp(0.1 * x) + B * Math.exp(-0.1 * x) + 20; }; };
      curva(g, a, S(12.6905), 0, 10, { cor: 'ok', larg: 1.4, tracejado: [5, 5] });
      curva(g, a, S(p.z), 0, 10, { cor: 's1', larg: 2.6 });
      g.circ(a.X(0), a.Y(40), 0.12, { preenche: 'texto', cor: null });
      g.circ(a.X(10), a.Y(200), 0.14, { preenche: 'ok', cor: null });
      g.txt('alvo: 200 °C', a.X(10) - 0.2, a.Y(200) - 0.35, { cor: 'ok', tam: 10.5, alin: 'dir', negrito: true });
      var fim = S(p.z)(10);
      painel(g, 'O tiro', [['inclinação z', fx(p.z, 2)], ['T(10) obtido', fx(fim, 2), Math.abs(fim - 200) < 1 ? 'ok' : 'erro'], ['alvo', '200'], ['falta', fx(200 - fim, 2)], ['z correto', '12,69', 'ok']],
        [{ t: 'azul: sua trajetória; verde tracejada: a solução' }]);
    }
  });

  /* 8.1 */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'A cada multiplicação por A, o vetor gira em direção ao autovetor do maior autovalor. A velocidade dessa rotação depende da razão entre os autovalores.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'k', rot: 'Iterações', min: 0, max: 8, val: 3, passo: 1 },
      { id: 'ang', rot: 'Direção inicial', min: -80, max: 80, val: 0, passo: 1, un: '°' }
    ],
    desenhar: function (g, p) {
      var cx = 4.5, cy = 3.7, R = 2.9, A = [[10, -5], [-5, 10]];
      g.circ(cx, cy, R, { cor: 'borda', larg: 1 });
      g.linha(cx - R * 0.707 * 1.15, cy + R * 0.707 * 1.15, cx + R * 0.707 * 1.15, cy - R * 0.707 * 1.15, { cor: 'ok', larg: 1.8 });
      g.linha(cx - R * 0.707 * 1.15, cy - R * 0.707 * 1.15, cx + R * 0.707 * 1.15, cy + R * 0.707 * 1.15, { cor: 'aviso', larg: 1.4, tracejado: [5, 4] });
      g.txt('modo λ = 15', cx + R * 0.82, cy - R * 0.95, { cor: 'ok', tam: 10.5, alin: 'esq', negrito: true });
      g.txt('modo λ = 5', cx + R * 0.82, cy + R * 0.95, { cor: 'aviso', tam: 10.5, alin: 'esq', negrito: true });
      var th = p.ang * Math.PI / 180, x = [Math.cos(th), Math.sin(th)], k = Math.round(p.k), i, l = 0;
      for (i = 0; i < k; i++) {
        var yy = [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
        l = Math.abs(yy[0]) > Math.abs(yy[1]) ? yy[0] : yy[1];
        x = [yy[0] / l, yy[1] / l];
        var nx = Math.hypot(x[0], x[1]);
        g.seta(cx, cy, x[0] / nx * R * 0.92, x[1] / nx * R * 0.92, { cor: 'fraco', larg: 1, ponta: 0.12 });
      }
      var n = Math.hypot(x[0], x[1]);
      g.seta(cx, cy, x[0] / n * R, x[1] / n * R, { cor: 's1', larg: 3, ponta: 0.26 });
      painel(g, 'Passo ' + k, [['λ estimado', k ? fx(l, 4) : '—', 's1'], ['x₁', fx(x[0], 4)], ['x₂', fx(x[1], 4)], ['razão |λ₂/λ₁|', '1/3']],
        [{ t: 'em ±45° o vetor já é autovetor: −45° leva a λ = 15, e 45° fica preso em λ = 5' }]);
    }
  });

  /* 9.1 */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'O sinal de B² − 4AC decide o tipo da equação. Com discriminante positivo há duas direções reais de propagação; com zero elas coincidem; com negativo não há direções reais.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'B', rot: 'Coeficiente B', min: -3, max: 3, val: 0, passo: 0.05 },
      { id: 'C', rot: 'Coeficiente C (A = 1)', min: -2, max: 2, val: -1, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, -3, 3, -3, 3, 'x', 'y', 1, 1), D = p.B * p.B - 4 * p.C, tipo = D > 1e-3 ? 'Hiperbólica' : D < -1e-3 ? 'Elíptica' : 'Parabólica';
      var reta = function (m, cor) { curva(g, a, function (x) { return m * x; }, -3, 3, { cor: cor, larg: 2.6 }, 400); };
      if (D >= -1e-3) { var s = Math.sqrt(Math.max(D, 0)); reta((p.B + s) / 2, 's1'); reta((p.B - s) / 2, 'erro'); }
      else g.txt('sem características reais', a.X(0), a.Y(2.2), { cor: 'aviso', tam: 12, negrito: true, fundo: true });
      g.circ(a.X(0), a.Y(0), 0.12, { preenche: 'texto', cor: null });
      painel(g, tipo, [['B² − 4AC', fx(D, 3), D > 1e-3 ? 's1' : D < -1e-3 ? 'aviso' : 'ok'], ['dy/dx (1)', D >= -1e-3 ? fx((p.B + Math.sqrt(Math.max(D, 0))) / 2, 3) : '—'], ['dy/dx (2)', D >= -1e-3 ? fx((p.B - Math.sqrt(Math.max(D, 0))) / 2, 3) : '—']],
        [{ t: 'onda: B = 0, C = −1; calor: B = 0, C = 0; Laplace: B = 0, C = 1' }]);
    }
  });

  /* 10.1 */
  var ESQ = {
    1: ['FTCS', [[0, 0], [-1, 0], [1, 0]], [[0, 1]], 'explícito'],
    2: ['BTCS', [[0, 0]], [[0, 1], [-1, 1], [1, 1]], 'implícito'],
    3: ['Crank-Nicolson', [[0, 0], [-1, 0], [1, 0]], [[0, 1], [-1, 1], [1, 1]], 'implícito'],
    4: ['Upwind', [[0, 0], [-1, 0]], [[0, 1]], 'explícito'],
    5: ['Laplace 5 pontos', [[-1, 0], [1, 0], [0, -1], [0, 1]], [[0, 0]], 'regime permanente']
  };
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'A molécula de cálculo mostra quais nós cada esquema usa. Quando há mais de uma incógnita no nível novo, o esquema é implícito e exige a solução de um sistema.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'e', rot: 'Esquema (1 FTCS · 2 BTCS · 3 C-N · 4 Upwind · 5 Laplace)', min: 1, max: 5, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var E = ESQ[Math.round(p.e)], ox = 4.5, oy = 3.0, s = 2.0, i, j;
      for (i = -2; i <= 2; i++) g.linha(ox + i * s * 0.9, 0.9, ox + i * s * 0.9, 6.6, { cor: 'borda', larg: 1 });
      for (j = -1; j <= 1; j++) g.linha(0.5, oy + j * s * 1.0 + 0.6, 8.5, oy + j * s * 1.0 + 0.6, { cor: 'borda', larg: 1 });
      var P = function (q) { return [ox + q[0] * s * 0.9, oy + 0.6 + q[1] * s]; };
      E[1].forEach(function (q) { var a = P(q); g.circ(a[0], a[1], 0.26, { preenche: 's1', cor: null }); });
      E[2].forEach(function (q) { var a = P(q); g.circ(a[0], a[1], 0.26, { preenche: 'erro', cor: null }); });
      g.txt('x →', 8.2, 0.5, { cor: 'suave', tam: 10.5 });
      g.txt(p.e > 4.5 ? 'y ↑' : 't ↑', 0.5, 6.9, { cor: 'suave', tam: 10.5 });
      painel(g, E[0], [['tipo', E[3]], ['nós conhecidos', String(E[1].length)], ['incógnitas no nível', String(E[2].length), E[2].length > 1 ? 'aviso' : 'ok']],
        [{ t: 'azul: valores conhecidos; vermelho: incógnitas', cor: 'fraco' }]);
    }
  });

  /* 11.1 */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Cada modo de Fourier é multiplicado por G a cada passo. No FTCS, a curva desce com θ, e o modo θ = π é o primeiro a sair da faixa de estabilidade quando r passa de 1/2.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'r', rot: 'r = αΔt/Δx²', min: 0.05, max: 1, val: 0.25, passo: 0.01 }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 3.1416, -3, 1.5, 'θ = kΔx (rad)', 'G', 1, 0.5), r = p.r;
      g.ret(a.X(0), a.Y(-1), a.x1 - a.x0, a.Y(1) - a.Y(-1), { cor: null, preenche: 'ok', alfa: 0.1 });
      var S = function (t) { var s = Math.sin(t / 2); return s * s; };
      curva(g, a, function (t) { return 1 - 4 * r * S(t); }, 0, 3.1416, { cor: 'erro', larg: 2.6 });
      curva(g, a, function (t) { return 1 / (1 + 4 * r * S(t)); }, 0, 3.1416, { cor: 's1', larg: 2 });
      curva(g, a, function (t) { return (1 - 2 * r * S(t)) / (1 + 2 * r * S(t)); }, 0, 3.1416, { cor: 'aviso', larg: 2 });
      var gp = 1 - 4 * r;
      painel(g, 'Em θ = π', [['G do FTCS', fx(gp, 3), gp >= -1 ? 'ok' : 'erro'], ['G do BTCS', fx(1 / (1 + 4 * r), 3), 's1'], ['G de C-N', fx((1 - 2 * r) / (1 + 2 * r), 3), 'aviso'], ['FTCS', gp >= -1 ? 'estável' : 'instável', gp >= -1 ? 'ok' : 'erro']],
        [{ t: 'vermelho: FTCS; azul: BTCS; laranja: Crank-Nicolson; faixa verde: |G| ≤ 1' }]);
    }
  });

  /* 12.1 */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Liebmann percorre a placa substituindo cada nó pela média dos vizinhos. As bordas fixas contaminam o interior aos poucos, até o campo convergir para o regime permanente.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'n', rot: 'Varreduras', min: 0, max: 60, val: 6, passo: 1 },
      { id: 'w', rot: 'Fator de relaxação ω', min: 1, max: 1.9, val: 1, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var N = 9, U = [], i, j, k, ns = Math.round(p.n), res = 0;
      for (j = 0; j <= N + 1; j++) { U.push([]); for (i = 0; i <= N + 1; i++) U[j].push(i === 0 ? 75 : i === N + 1 ? 50 : j === 0 ? 0 : j === N + 1 ? 100 : 0); }
      for (k = 0; k < ns; k++) { res = 0; for (j = 1; j <= N; j++) for (i = 1; i <= N; i++) { var o = U[j][i], gs = (U[j][i + 1] + U[j][i - 1] + U[j + 1][i] + U[j - 1][i]) / 4, nv = p.w * gs + (1 - p.w) * o; res = Math.max(res, Math.abs(nv - o)); U[j][i] = nv; } }
      var s = 0.56, x0 = 1.4, y0 = 0.7;
      for (j = 1; j <= N; j++) for (i = 1; i <= N; i++) {
        var v = U[j][i] / 100, xx = x0 + (i - 1) * s, yy = y0 + (j - 1) * s;
        g.ret(xx, yy, s - 0.03, s - 0.03, { cor: null, preenche: 'erro', alfa: Math.max(0.03, Math.min(1, v)) });
      }
      g.txt('topo 100 °C', x0 + 4.5 * s, y0 + N * s + 0.3, { cor: 'suave', tam: 10.5 });
      g.txt('base 0 °C', x0 + 4.5 * s, y0 - 0.3, { cor: 'suave', tam: 10.5 });
      g.txt('75', x0 - 0.2, y0 + 4.5 * s, { cor: 'suave', tam: 10.5, alin: 'dir' });
      g.txt('50', x0 + N * s + 0.15, y0 + 4.5 * s, { cor: 'suave', tam: 10.5, alin: 'esq' });
      painel(g, 'Varredura ' + ns, [['centro da placa', fx(U[5][5], 2) + ' °C', 's1'], ['maior variação', ns ? fx(res, 3) : '—', res < 0.1 && ns ? 'ok' : 'texto'], ['relaxação ω', fx(p.w, 2)], ['regime permanente', '56,25 °C', 'ok']],
        [{ t: 'cor mais forte significa temperatura maior' }]);
    }
  });

  /* 13.1 */
  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'Uma onda de comprimento fixo depois de vários passos. O upwind reduz a amplitude: é a dissipação. O Lax-Wendroff conserva melhor a amplitude, mas atrasa a fase: é a dispersão.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'C', rot: 'Número de Courant', min: 0.1, max: 1, val: 0.5, passo: 0.01 },
      { id: 'th', rot: 'θ (células por onda: 2π/θ)', min: 0.2, max: 2, val: 0.6, passo: 0.02 },
      { id: 'n', rot: 'Passos', min: 0, max: 40, val: 20, passo: 1 }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 40, -1.4, 1.4, 'x/Δx', 'u', 10, 0.5), C = p.C, t = p.th, n = Math.round(p.n);
      var G = function (met) {
        var cs = Math.cos(t), sn = Math.sin(t);
        return met === 'up' ? [1 - C * (1 - cs), -C * sn] : [1 - C * C * (1 - cs), -C * sn];
      };
      var ond = function (met) {
        var g0 = G(met), m = Math.hypot(g0[0], g0[1]), ph = Math.atan2(g0[1], g0[0]);
        return { amp: Math.pow(m, n), fase: ph * n, m: m, ph: ph };
      };
      var U = ond('up'), L = ond('lw'), ex = -C * t * n;
      curva(g, a, function (j) { return Math.cos(t * j + ex); }, 0, 40, { cor: 'ok', larg: 2.4 }, 400);
      curva(g, a, function (j) { return U.amp * Math.cos(t * j + U.fase); }, 0, 40, { cor: 'erro', larg: 2 }, 400);
      curva(g, a, function (j) { return L.amp * Math.cos(t * j + L.fase); }, 0, 40, { cor: 's1', larg: 2 }, 400);
      painel(g, 'Depois de ' + n + ' passos', [['amplitude upwind', fx(U.amp, 3), 'erro'], ['amplitude L-W', fx(L.amp, 3), 's1'], ['fase exata', fx(-ex, 2) + ' rad', 'ok'], ['fase upwind', fx(-U.fase, 2) + ' rad', 'erro'], ['fase L-W', fx(-L.fase, 2) + ' rad', 's1']],
        [{ t: 'verde: exata; vermelho: upwind; azul: Lax-Wendroff' }]);
    }
  });
})();

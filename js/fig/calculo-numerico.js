/* ============================================================
   Figuras ilustrativas de Cálculo Numérico
   Ponto flutuante, bisseção, Newton, eliminação, condicionamento,
   Lagrange, splines, mínimos quadrados, diferenças finitas,
   regras de integração e quadratura de Gauss.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500;
  var XR = 9.0, XV = 13.2;

  function fx(v, n) {
    n = n == null ? 3 : n;
    return v.toLocaleString('pt-BR', { maximumFractionDigits: n });
  }
  function ci(v, n) {
    if (v === 0) return '0';
    var e = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    if (e >= -3 && e < 5) return fx(v, Math.max(0, (n || 3) - e));
    var sup = String(e).replace('-', '⁻').replace(/[0-9]/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; });
    return fx(v / Math.pow(10, e), (n || 3) - 1) + '×10' + sup;
  }

  /* quebra as observações na largura do painel */
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) {
      var linhas = [], atual = '';
      ctx.save();
      ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      it.t.split(' ').forEach(function (pal) {
        var prova = atual ? atual + ' ' + pal : pal;
        if (atual && ctx.measureText(prova).width > larg) { linhas.push(atual); atual = pal; }
        else atual = prova;
      });
      linhas.push(atual);
      ctx.restore();
      linhas.forEach(function (l) {
        g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' });
        y -= passo;
      });
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
  /* eixos cartesianos com marcas; o título do eixo y fica acima dele */
  function eixos(g, xa, xb, ya, yb, rx, ry, passoX, passoY) {
    var x0 = 0.9, x1 = 8.3, y0 = 0.7, y1 = 6.7;
    var X = function (v) { return x0 + (x1 - x0) * (v - xa) / (xb - xa); };
    var Y = function (v) { return y0 + (y1 - y0) * (v - ya) / (yb - ya); };
    var v;
    for (v = Math.ceil(xa / passoX - 1e-9) * passoX; v <= xb + 1e-9; v += passoX) {
      g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
      g.txt(fx(v, 2), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 });
    }
    for (v = Math.ceil(ya / passoY - 1e-9) * passoY; v <= yb + 1e-9; v += passoY) {
      g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
      g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
    }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
    g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    if (ya < 0 && yb > 0) g.linha(x0, Y(0), x1, Y(0), { cor: 'forte', larg: 1.2 });
    g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 });
    g.txt(ry, x0 - 0.3, y1 + 0.38, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1 };
  }
  function curva(g, a, f, xa, xb, o, n) {
    /* o trecho fora da janela é interrompido, em vez de virar um patamar na borda */
    var pts = [], i, m = n || 240;
    var fecha = function () { if (pts.length > 1) g.caminho(pts, o); pts = []; };
    for (i = 0; i <= m; i++) {
      var v = xa + (xb - xa) * i / m, y = f(v);
      if (y < a.Y.inv0 || y > a.Y.inv1) fecha();
      else pts.push([a.X(v), a.Y(y)]);
    }
    fecha();
  }
  function limita(a, ya, yb) { a.Y.inv0 = ya; a.Y.inv1 = yb; return a; }

  /* ---------- 1.1 — a reta dos números de máquina ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Numa máquina de base 2 com poucos bits de mantissa, os números representáveis ficam agrupados: entre duas potências de 2 sempre há a mesma quantidade deles, e o espaçamento dobra a cada potência. A precisão relativa é constante; a absoluta, não.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 't', rot: 'Bits de mantissa', min: 2, max: 5, val: 3, passo: 1 },
      { id: 'x', rot: 'Número a guardar', min: 0.5, max: 7.9, val: 3.3, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var t = Math.round(p.t), emin = -1, emax = 2, x0 = 0.5, x1 = 8.3, ymid = 4.4;
      var X = function (v) { return x0 + (x1 - x0) * v / 8; };
      g.linha(x0, ymid, x1, ymid, { cor: 'forte', larg: 1.4 });
      var todos = [], e, k;
      for (e = emin; e <= emax; e++) {
        var pot = Math.pow(2, e), passo = pot / Math.pow(2, t - 1);
        for (k = 0; k < Math.pow(2, t - 1); k++) todos.push(pot + k * passo);
        g.linha(X(pot), ymid - 0.55, X(pot), ymid + 0.55, { cor: 's3', larg: 1.8 });
        g.txt(fx(pot, 1), X(pot), ymid - 0.85, { cor: 's3', tam: 10.5, negrito: true });
      }
      todos.push(8);
      todos.forEach(function (v) { g.circ(X(v), ymid, 0.07, { preenche: 's1', cor: null }); });
      var perto = todos.reduce(function (m, v) { return Math.abs(v - p.x) < Math.abs(m - p.x) ? v : m; }, todos[0]);
      g.seta(X(p.x), ymid + 1.6, 0, -1.3, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.txt('x = ' + fx(p.x, 2), X(p.x), ymid + 1.85, { cor: 'erro', tam: 11, negrito: true });
      g.circ(X(perto), ymid, 0.15, { cor: 'ok', larg: 2 });
      g.txt('o espaçamento dobra a cada potência de 2', 4.4, 2.3, { cor: 'suave', tam: 10.5 });
      var ex = Math.floor(Math.log(p.x) / Math.LN2), gap = Math.pow(2, ex) / Math.pow(2, t - 1);
      painel(g, 'Representação', [
        ['guardado como', fx(perto, 4), 'ok'],
        ['erro absoluto', fx(Math.abs(perto - p.x), 4)],
        ['erro relativo', fx(100 * Math.abs(perto - p.x) / p.x, 2) + ' %'],
        ['espaçamento local', fx(gap, 4)],
        ['épsilon de máquina', fx(Math.pow(2, 1 - t), 4)]
      ], [{ t: 'cada bit de mantissa corta o épsilon pela metade' }]);
    }
  });

  /* ---------- 2.1 — bisseção ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Cada passo da bisseção descarta a metade do intervalo em que o sinal não troca. O intervalo que resta sempre contém a raiz, e seu comprimento cai à metade, qualquer que seja a função.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'n', rot: 'Iterações', min: 0, max: 8, val: 3, passo: 1 }],
    desenhar: function (g, p) {
      var f = function (x) { return x * x * x - 9 * x + 3; };
      var a0 = limita(eixos(g, 0, 1, -6, 4, 'x', 'f(x) = x³ − 9x + 3', 0.25, 2), -6, 4);
      curva(g, a0, f, 0, 1, { cor: 's1', larg: 2.4 });
      var a = 0, b = 1, m = 0.5, i, n = Math.round(p.n);
      for (i = 0; i <= n; i++) {
        m = (a + b) / 2;
        var yb = a0.y0 + 0.28 + i * 0.34;
        g.linha(a0.X(a), yb, a0.X(b), yb, { cor: i === n ? 'erro' : 's3', larg: i === n ? 3.4 : 2 });
        if (i < n) { if (f(a) * f(m) < 0) b = m; else a = m; }
      }
      g.linha(a0.X(m), a0.Y(0), a0.X(m), a0.Y(f(m)), { cor: 'erro', larg: 1, tracejado: [4, 4] });
      g.circ(a0.X(m), a0.Y(f(m)), 0.12, { preenche: 'erro', cor: null });
      var r = 0.3376090;
      painel(g, 'Passo ' + n, [
        ['a', fx(a, 5)], ['b', fx(b, 5)],
        ['m = (a + b)/2', fx(m, 5), 'erro'],
        ['f(m)', fx(f(m), 4)],
        ['b − a', fx(b - a, 5)],
        ['erro real |m − r|', fx(Math.abs(m - r), 5)]
      ], [{ t: 'as barras mostram o intervalo a cada iteração, de baixo para cima' }]);
    }
  });

  /* ---------- 3.1 — Newton ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Newton segue a tangente até o eixo e recomeça dali. Perto da raiz, a curva quase coincide com a tangente e as casas corretas dobram a cada passo. Parta de um ponto em que a derivada é pequena e veja a estimativa saltar para longe.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'x0', rot: 'Ponto inicial', min: 0.15, max: 3.5, val: 3, passo: 0.05 },
      { id: 'n', rot: 'Iterações', min: 1, max: 5, val: 3, passo: 1 }
    ],
    desenhar: function (g, p) {
      var f = function (x) { return x * x - 2; }, d = function (x) { return 2 * x; };
      var a = limita(eixos(g, 0, 4, -3, 12, 'x', 'f(x) = x² − 2', 1, 3), -3, 12);
      curva(g, a, f, 0, 4, { cor: 's1', larg: 2.4 });
      var x = p.x0, i, n = Math.round(p.n), linhas = [];
      for (i = 0; i < n; i++) {
        var nx = x - f(x) / d(x);
        if (x >= 0 && x <= 4) {
          g.linha(a.X(x), a.Y(0), a.X(x), a.Y(Math.min(12, f(x))), { cor: 'fraco', larg: 1, tracejado: [4, 4] });
          g.circ(a.X(x), a.Y(Math.min(12, f(x))), 0.09, { preenche: 's3', cor: null });
          var xb = Math.min(4, Math.max(0, nx)), yb = f(x) + d(x) * (xb - x);
          g.linha(a.X(x), a.Y(Math.min(12, f(x))), a.X(xb), a.Y(Math.max(-3, Math.min(12, yb))), { cor: 'erro', larg: 1.6 });
        }
        x = nx;
        linhas.push(['x' + (i + 1), fx(x, 7) ]);
      }
      linhas.push(['erro |x − √2|', ci(Math.abs(x - Math.SQRT2), 2), 'ok']);
      painel(g, 'Iterações', linhas, [{ t: 'o número de casas corretas dobra a cada passo perto da raiz' }]);
    }
  });

  /* ---------- 4.1 — eliminação ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'A eliminação zera uma coluna por vez, abaixo do pivô. Cada etapa altera todo o bloco inferior direito, e é daí que vem o custo proporcional a n³.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'k', rot: 'Colunas eliminadas', min: 0, max: 5, val: 2, passo: 1 },
      { id: 'n', rot: 'Ordem do sistema (no custo)', min: 10, max: 2000, val: 1000, passo: 10 }
    ],
    desenhar: function (g, p) {
      var N = 6, s = 0.98, x0 = 1.0, y0 = 7.0, k = Math.round(p.k), i, j;
      for (i = 0; i < N; i++) {
        for (j = 0; j < N; j++) {
          var X = x0 + j * s, Y = y0 - (i + 1) * s;
          var zero = j < k && i > j;
          var ativo = i >= k && j >= k;
          var piv = i === k && j === k && k < N;
          g.ret(X, Y, s - 0.08, s - 0.08, {
            cor: piv ? 'erro' : 'borda', larg: piv ? 2.2 : 1,
            preenche: piv ? 'erro' : zero ? 'baixo' : ativo ? 's1' : 's3',
            alfa: piv ? 0.35 : zero ? 0.4 : ativo ? 0.3 : 0.25
          });
          g.txt(zero ? '0' : '×', X + (s - 0.08) / 2, Y + (s - 0.08) / 2, { cor: zero ? 'fraco' : 'texto', tam: 13 });
        }
      }
      g.txt('zerado', 1.4, 0.55, { cor: 'fraco', tam: 10 });
      g.ret(2.1, 0.42, 0.26, 0.26, { cor: 'borda', preenche: 'baixo', alfa: 0.4 });
      g.txt('pronto', 3.4, 0.55, { cor: 's3', tam: 10 });
      g.ret(4.0, 0.42, 0.26, 0.26, { cor: 'borda', preenche: 's3', alfa: 0.25 });
      g.txt('ainda muda', 5.3, 0.55, { cor: 's1', tam: 10 });
      g.ret(6.1, 0.42, 0.26, 0.26, { cor: 'borda', preenche: 's1', alfa: 0.3 });
      var n = p.n, fat = 2 * n * n * n / 3, sub = 2 * n * n;
      painel(g, 'Custo para n = ' + fx(n, 0), [
        ['fatoração  2n³/3', ci(fat, 2)],
        ['substituições  2n²', ci(sub, 2)],
        ['razão', fx(fat / sub, 0) + ' ×'],
        ['tempo a 10⁹ op/s', ci(fat / 1e9, 2) + ' s', 'ok']
      ], [{ t: 'dobrar n multiplica o custo da fatoração por oito' }, { t: 'por isso vale guardar L e U quando b muda', cor: 's1' }]);
    }
  });

  /* ---------- 5.1 — condicionamento ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Cada faixa representa uma equação com sua incerteza. Quando as retas são quase paralelas, o losango em que a solução pode estar fica muito alongado: a mesma incerteza nos dados produz uma incerteza enorme na resposta.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'ang', rot: 'Ângulo entre as retas', min: 2, max: 90, val: 12, passo: 1, un: '°' },
      { id: 'd', rot: 'Incerteza nos dados', min: 0.02, max: 0.4, val: 0.15, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var a = limita(eixos(g, -4, 4, -3.2, 3.2, 'x₁', 'x₂', 2, 2), -3.2, 3.2);
      var th = p.ang * Math.PI / 180;
      var dirs = [[1, 0], [Math.cos(th), Math.sin(th)]];
      var clip = function (P) { return [a.X(Math.max(-4, Math.min(4, P[0]))), a.Y(Math.max(-3.2, Math.min(3.2, P[1])))]; };
      dirs.forEach(function (u, i) {
        var nrm = [-u[1], u[0]], cor = i ? 's3' : 's1', L = 9;
        [-1, 1].forEach(function (s) {
          var c = [nrm[0] * s * p.d, nrm[1] * s * p.d], A = [c[0] - L * u[0], c[1] - L * u[1]], B = [c[0] + L * u[0], c[1] + L * u[1]];
          /* recorta o segmento na janela */
          var pts = [], m;
          for (m = 0; m <= 400; m++) {
            var t = m / 400, Q = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
            if (Math.abs(Q[0]) <= 4 && Math.abs(Q[1]) <= 3.2) pts.push([a.X(Q[0]), a.Y(Q[1])]);
          }
          if (pts.length > 1) g.caminho(pts, { cor: cor, larg: 1.6 });
        });
      });
      /* losango: vértices da interseção das faixas */
      var u = dirs[0], v = dirs[1], k = p.d / Math.sin(th), V = [];
      [[1, 1], [1, -1], [-1, -1], [-1, 1]].forEach(function (s) {
        V.push([s[0] * k * v[0] + s[1] * k * u[0], s[0] * k * v[1] + s[1] * k * u[1]]);
      });
      g.caminho(V.map(clip), { cor: 'erro', larg: 2, preenche: 'erro', alfa: 0.3, fechar: true });
      var meia = Math.max(Math.hypot(V[0][0], V[0][1]), Math.hypot(V[1][0], V[1][1]));
      var fat = meia / p.d, A = [[u[1], -u[0]], [v[1], -v[0]]];
      var det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      var nA = Math.max(Math.abs(A[0][0]) + Math.abs(A[0][1]), Math.abs(A[1][0]) + Math.abs(A[1][1]));
      var nI = Math.max(Math.abs(A[1][1]) + Math.abs(A[0][1]), Math.abs(A[1][0]) + Math.abs(A[0][0])) / Math.abs(det);
      var kap = nA * nI;
      painel(g, 'Sensibilidade', [
        ['número de condição κ∞', fx(kap, 1), kap > 10 ? 'aviso' : 'ok'],
        ['dígitos perdidos ≈', fx(Math.log(kap) / Math.LN10, 1)],
        ['ampliação do erro', fx(fat, 1) + ' ×'],
        ['determinante', fx(Math.abs(det), 3)]
      ], [{ t: 'o pivotamento não ajuda aqui: o defeito é do sistema, não do algoritmo' }]);
    }
  });

  /* ---------- 6.1 — Lagrange ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Cada polinômio de Lagrange vale 1 em seu nó e 0 nos demais. A curva interpoladora é a soma de todos eles, ponderados pelos valores da função. Escolha um nó para destacar sua parcela.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'k', rot: 'Nó destacado', min: 0, max: 3, val: 1, passo: 1 },
      { id: 'x', rot: 'Ponto de avaliação', min: 0, max: 3, val: 1.5, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var X0 = [0, 1, 2, 3], Y0 = [1, 3, 2, 4], k = Math.round(p.k);
      var L = function (i, x) { return X0.reduce(function (q, xj, j) { return j === i ? q : q * (x - xj) / (X0[i] - xj); }, 1); };
      var P = function (x) { return Y0.reduce(function (s, y, i) { return s + y * L(i, x); }, 0); };
      var a = limita(eixos(g, -0.2, 3.2, -2, 6, 'x', 'y', 1, 2), -2, 6);
      X0.forEach(function (_, i) {
        curva(g, a, function (x) { return Y0[i] * L(i, x); }, -0.2, 3.2, { cor: i === k ? 'erro' : 'borda', larg: i === k ? 2.2 : 1.2 });
      });
      curva(g, a, P, -0.2, 3.2, { cor: 's1', larg: 2.6 });
      X0.forEach(function (x, i) { g.circ(a.X(x), a.Y(Y0[i]), 0.12, { preenche: 's3', cor: null }); });
      g.linha(a.X(p.x), a.y0, a.X(p.x), a.y1, { cor: 'ok', larg: 1, tracejado: [4, 4] });
      g.circ(a.X(p.x), a.Y(P(p.x)), 0.11, { preenche: 'ok', cor: null });
      var linhas = X0.map(function (_, i) { return ['L' + i + '(x)', fx(L(i, p.x), 4), i === k ? 'erro' : 'texto']; });
      linhas.push(['P(x) = Σ yₖLₖ', fx(P(p.x), 4), 'ok']);
      painel(g, 'Em x = ' + fx(p.x, 2), linhas, [{ t: 'azul: interpolador; vermelho: parcela do nó escolhido; a soma dos Lₖ dá sempre 1' }]);
    }
  });

  /* ---------- 7.1 — spline contra polinômio ---------- */
  function splineNatural(X0, Y0) {
    var n = X0.length - 1, a = [], b = [], c = [], d = [], i;
    for (i = 1; i < n; i++) {
      var h0 = X0[i] - X0[i - 1], h1 = X0[i + 1] - X0[i];
      a.push(h0); b.push(2 * (h0 + h1)); c.push(h1);
      d.push(6 * ((Y0[i + 1] - Y0[i]) / h1 - (Y0[i] - Y0[i - 1]) / h0));
    }
    for (i = 1; i < d.length; i++) { var m = a[i] / b[i - 1]; b[i] -= m * c[i - 1]; d[i] -= m * d[i - 1]; }
    var M = new Array(n + 1).fill(0);
    for (i = d.length - 1; i >= 0; i--) M[i + 1] = (d[i] - c[i] * M[i + 2]) / b[i];
    return function (x) {
      var s = 0;
      while (s < n - 1 && x > X0[s + 1]) s++;
      var h = X0[s + 1] - X0[s], A = X0[s + 1] - x, B = x - X0[s];
      return (M[s] * A * A * A + M[s + 1] * B * B * B) / (6 * h) + (Y0[s] - M[s] * h * h / 6) * A / h + (Y0[s + 1] - M[s + 1] * h * h / 6) * B / h;
    };
  }
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Mova um único ponto e compare. O polinômio de grau alto é global: a mudança altera toda a curva. A spline é praticamente local: o efeito se apaga poucos nós adiante.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'y', rot: 'Altura do ponto central', min: -1, max: 3, val: 2, passo: 0.05 }],
    desenhar: function (g, p) {
      var X0 = [0, 1, 2, 3, 4, 5, 6, 7, 8], Y0 = [1, 1, 1, 1, p.y, 1, 1, 1, 1];
      var a = limita(eixos(g, 0, 8, -2, 4, 'x', 'y', 1, 1), -2, 4);
      var lag = function (x) {
        return Y0.reduce(function (s, y, i) {
          return s + y * X0.reduce(function (q, xj, j) { return j === i ? q : q * (x - xj) / (X0[i] - xj); }, 1);
        }, 0);
      };
      var sp = splineNatural(X0, Y0);
      curva(g, a, lag, 0, 8, { cor: 'erro', larg: 2 }, 400);
      curva(g, a, sp, 0, 8, { cor: 's1', larg: 2.6 }, 400);
      X0.forEach(function (x, i) { g.circ(a.X(x), a.Y(Y0[i]), 0.11, { preenche: 's3', cor: null }); });
      var mL = 0, mS = 0, i;
      for (i = 0; i <= 200; i++) {
        var x = 6 + 2 * i / 200;
        mL = Math.max(mL, Math.abs(lag(x) - 1));
        mS = Math.max(mS, Math.abs(sp(x) - 1));
      }
      painel(g, 'Efeito longe do ponto', [
        ['polinômio de grau 8', fx(mL, 3), 'erro'],
        ['spline cúbica', fx(mS, 3), 's1']
      ], [{ t: 'desvio máximo em relação a y = 1, entre x = 6 e x = 8' }, { t: 'vermelho: polinômio único; azul: spline natural' }]);
    }
  });

  /* ---------- 8.1 — mínimos quadrados ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Os quadrados têm lado igual ao resíduo de cada ponto: mínimos quadrados é, literalmente, a reta que minimiza a área total. Ajuste a reta à mão e compare com o ótimo.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'a', rot: 'Intercepto a', min: -3, max: 5, val: 1.5, passo: 0.02 },
      { id: 'b', rot: 'Inclinação b', min: 0, max: 3.5, val: 1.5, passo: 0.02 }
    ],
    desenhar: function (g, p) {
      var X0 = [1, 2, 3, 4, 5], Y0 = [2.2, 4.1, 6.2, 7.9, 10.1];
      var a = limita(eixos(g, 0, 6, 0, 12, 'x', 'y', 1, 2), 0, 12);
      var ux = (a.x1 - a.x0) / 6, uy = (a.y1 - a.y0) / 12, Sr = 0;
      var esc = uy;
      X0.forEach(function (x, i) {
        var yh = p.a + p.b * x, r = Y0[i] - yh;
        Sr += r * r;
        var lado = Math.abs(r) * esc;
        lado = Math.min(lado, 2.2);
        g.ret(a.X(x), Math.min(a.Y(Y0[i]), a.Y(Y0[i]) - (r > 0 ? lado : 0)), lado, lado, { cor: 'erro', larg: 1, preenche: 'erro', alfa: 0.18 });
      });
      curva(g, a, function (x) { return p.a + p.b * x; }, 0, 6, { cor: 's1', larg: 2.4 });
      curva(g, a, function (x) { return 0.22 + 1.96 * x; }, 0, 6, { cor: 'ok', larg: 1.4, tracejado: [5, 5] });
      X0.forEach(function (x, i) { g.circ(a.X(x), a.Y(Y0[i]), 0.11, { preenche: 's3', cor: null }); });
      var St = 38.46;
      painel(g, 'Soma dos quadrados', [
        ['Sr da sua reta', fx(Sr, 3), 'erro'],
        ['Sr mínimo', '0,044', 'ok'],
        ['r² da sua reta', fx(1 - Sr / St, 4)],
        ['r² do ótimo', '0,9989', 'ok'],
        ['ótimo: a, b', '0,22; 1,96', 'ok']
      ], [{ t: 'azul: sua reta; verde tracejada: mínimos quadrados' }]);
    }
  });

  /* ---------- 9.1 — diferenças finitas ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'A derivada é a inclinação da tangente. A progressiva usa uma secante apoiada em x e x + h; a centrada, apoiada em x − h e x + h, é quase paralela à tangente mesmo com h grande.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'h', rot: 'Passo h', min: 0.02, max: 1, val: 0.6, passo: 0.01 }],
    desenhar: function (g, p) {
      var f = Math.exp, x = 1, h = p.h;
      var a = limita(eixos(g, -0.2, 2.2, 0, 10, 'x', 'y = eˣ', 0.5, 2), 0, 10);
      curva(g, a, f, -0.2, 2.2, { cor: 's1', larg: 2.4 });
      var reta = function (x1, x2, cor, larg, tr) {
        var m = (f(x2) - f(x1)) / (x2 - x1);
        curva(g, a, function (v) { return f(x1) + m * (v - x1); }, -0.2, 2.2, { cor: cor, larg: larg, tracejado: tr });
        return m;
      };
      curva(g, a, function (v) { return f(x) + f(x) * (v - x); }, -0.2, 2.2, { cor: 'ok', larg: 1.6 });
      var fw = reta(x, x + h, 'erro', 1.8), ce = reta(x - h, x + h, 'aviso', 1.8, [6, 4]);
      [x - h, x, x + h].forEach(function (v) { g.circ(a.X(v), a.Y(f(v)), 0.1, { preenche: 'texto', cor: null }); });
      painel(g, 'Com h = ' + fx(h, 2), [
        ['exata e¹', fx(Math.E, 5), 'ok'],
        ['progressiva', fx(fw, 5), 'erro'],
        ['erro O(h)', ci(Math.abs(fw - Math.E), 2)],
        ['centrada', fx(ce, 5), 'aviso'],
        ['erro O(h²)', ci(Math.abs(ce - Math.E), 2)]
      ], [{ t: 'verde: tangente; vermelho: progressiva; laranja tracejada: centrada' }]);
    }
  });

  /* ---------- 10.1 — trapézios e Simpson ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Os trapézios ligam os pontos por retas e deixam áreas visíveis de sobra ou de falta. Simpson usa arcos de parábola e, com os mesmos pontos, quase coincide com a curva. A ordem do erro é o que muda.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'n', rot: 'Subintervalos n (pares)', min: 2, max: 16, val: 4, passo: 2 }],
    desenhar: function (g, p) {
      var f = function (x) { return Math.exp(-x * x); }, n = Math.round(p.n), h = 1 / n, EX = 0.7468241328;
      var a = limita(eixos(g, 0, 1, 0, 1.2, 'x', 'f(x) = exp(−x²)', 0.25, 0.2), 0, 1.2);
      var i, T = (f(0) + f(1)) / 2, S = f(0) + f(1);
      for (i = 1; i < n; i++) { T += f(i * h); S += (i % 2 ? 4 : 2) * f(i * h); }
      T *= h; S *= h / 3;
      for (i = 0; i < n; i++) {
        var x1 = i * h, x2 = x1 + h;
        g.caminho([[a.X(x1), a.Y(0)], [a.X(x1), a.Y(f(x1))], [a.X(x2), a.Y(f(x2))], [a.X(x2), a.Y(0)]], { cor: 's3', larg: 1.2, preenche: 's3', alfa: 0.18, fechar: true });
      }
      curva(g, a, f, 0, 1, { cor: 's1', larg: 2.4 });
      for (i = 0; i <= n; i++) g.circ(a.X(i * h), a.Y(f(i * h)), 0.08, { preenche: 'erro', cor: null });
      painel(g, 'n = ' + n, [
        ['exato', fx(EX, 6), 'ok'],
        ['trapézios', fx(T, 6)],
        ['erro', ci(Math.abs(T - EX), 2), 'erro'],
        ['Simpson', fx(S, 6)],
        ['erro', ci(Math.abs(S - EX), 2), 'ok'],
        ['vantagem de Simpson', fx(Math.abs(T - EX) / Math.abs(S - EX), 0) + ' ×']
      ], [{ t: 'dobrar n corta o erro por 4 em trapézios e por 16 em Simpson' }]);
    }
  });

  /* ---------- 11.1 — quadratura de Gauss ---------- */
  var GAUSS = {
    1: [[0, 2]],
    2: [[-Math.sqrt(1 / 3), 1], [Math.sqrt(1 / 3), 1]],
    3: [[-Math.sqrt(0.6), 5 / 9], [0, 8 / 9], [Math.sqrt(0.6), 5 / 9]],
    4: [[-0.861136, 0.347855], [-0.339981, 0.652145], [0.339981, 0.652145], [0.861136, 0.347855]]
  };
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Os nós de Gauss não ficam nas pontas e não são uniformes. Cada barra tem largura igual ao peso do nó, e a soma das áreas estima a integral. Com n nós, polinômios de grau até 2n − 1 saem exatos.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'n', rot: 'Número de nós', min: 1, max: 4, val: 2, passo: 1 }],
    desenhar: function (g, p) {
      var f = function (t) { var x = (t + 1) / 2; return Math.exp(-x * x); }, n = Math.round(p.n), EX = 2 * 0.7468241328;
      var a = limita(eixos(g, -1, 1, 0, 1.2, 't', 'f em [−1, 1]', 0.5, 0.2), 0, 1.2);
      var ini = -1, soma = 0;
      GAUSS[n].forEach(function (q) {
        var fim = ini + q[1];
        g.ret(a.X(ini), a.Y(0), a.X(fim) - a.X(ini), a.Y(f(q[0])) - a.Y(0), { cor: 's3', larg: 1.2, preenche: 's3', alfa: 0.2 });
        soma += q[1] * f(q[0]);
        ini = fim;
      });
      curva(g, a, f, -1, 1, { cor: 's1', larg: 2.4 });
      GAUSS[n].forEach(function (q) { g.circ(a.X(q[0]), a.Y(f(q[0])), 0.12, { preenche: 'erro', cor: null }); });
      var linhas = GAUSS[n].slice(0, 4).map(function (q, i) { return ['nó ' + (i + 1) + ' (peso ' + fx(q[1], 3) + ')', fx(q[0], 4)]; });
      linhas.push(['erro da integral', ci(Math.abs(soma - EX) / 2, 2), 'ok']);
      linhas.push(['exata até o grau', String(2 * n - 1)]);
      painel(g, 'Gauss-Legendre', linhas);
    }
  });
})();

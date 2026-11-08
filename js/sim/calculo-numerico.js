/* ============================================================
   Simuladores de Cálculo Numérico
   1 · Raízes de equações — bisseção, falsa posição, Newton, secante
   2 · Sistemas lineares — Gauss, Jacobi e Gauss-Seidel
   3 · Interpolação — Lagrange, Runge e splines
   4 · Ajuste de curvas por mínimos quadrados
   5 · Integração e derivação numéricas
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim;
  if (!Sim) return;

  var CN = {};

  /* ---------------------------------------------------------------
     Funções de teste, avaliadas sem eval
     --------------------------------------------------------------- */
  CN.funcoes = [
    { id: 'cubica', nome: 'f(x) = x³ − 9x + 3', tex: 'x^3 - 9x + 3',
      f: function (x) { return x * x * x - 9 * x + 3; },
      d: function (x) { return 3 * x * x - 9; }, a: 0, b: 1 },
    { id: 'raiz2', nome: 'f(x) = x² − 2', tex: 'x^2 - 2',
      f: function (x) { return x * x - 2; },
      d: function (x) { return 2 * x; }, a: 1, b: 2 },
    { id: 'expo', nome: 'f(x) = e^x − 3x', tex: 'e^{x} - 3x',
      f: function (x) { return Math.exp(x) - 3 * x; },
      d: function (x) { return Math.exp(x) - 3; }, a: 0, b: 1 },
    { id: 'trig', nome: 'f(x) = cos(x) − x', tex: '\\cos x - x',
      f: function (x) { return Math.cos(x) - x; },
      d: function (x) { return -Math.sin(x) - 1; }, a: 0, b: 1 },
    { id: 'log', nome: 'f(x) = x·ln(x) − 1', tex: 'x\\ln x - 1',
      f: function (x) { return x * Math.log(Math.max(x, 1e-12)) - 1; },
      d: function (x) { return Math.log(Math.max(x, 1e-12)) + 1; }, a: 1, b: 3 },
    { id: 'dupla', nome: 'f(x) = (x − 1)²·(x + 2)', tex: '(x-1)^2(x+2)',
      f: function (x) { return (x - 1) * (x - 1) * (x + 2); },
      d: function (x) { return 2 * (x - 1) * (x + 2) + (x - 1) * (x - 1); }, a: 0.2, b: 1.8 }
  ];
  CN.funcao = function (id) {
    for (var i = 0; i < CN.funcoes.length; i++) if (CN.funcoes[i].id === id) return CN.funcoes[i];
    return CN.funcoes[0];
  };

  /* ---------------------------------------------------------------
     Raízes: cada método devolve o histórico de iterações
     --------------------------------------------------------------- */
  CN.bissecao = function (fn, a, b, tol, nmax) {
    var h = [], fa = fn(a), c, fc, i;
    if (fa * fn(b) > 0) return h;
    for (i = 1; i <= nmax; i++) {
      c = (a + b) / 2; fc = fn(c);
      h.push({ it: i, x: c, fx: fc, inter: Math.abs(b - a) / 2 });
      if (Math.abs(fc) < 1e-15 || Math.abs(b - a) / 2 < tol) break;
      if (fa * fc < 0) b = c; else { a = c; fa = fc; }
    }
    return h;
  };
  CN.falsaPosicao = function (fn, a, b, tol, nmax) {
    var h = [], fa = fn(a), fb = fn(b), c, fc, i, ant = null;
    if (fa * fb > 0) return h;
    for (i = 1; i <= nmax; i++) {
      c = (a * fb - b * fa) / (fb - fa); fc = fn(c);
      h.push({ it: i, x: c, fx: fc, inter: ant === null ? Math.abs(b - a) : Math.abs(c - ant) });
      if (Math.abs(fc) < 1e-15 || (ant !== null && Math.abs(c - ant) < tol)) break;
      ant = c;
      if (fa * fc < 0) { b = c; fb = fc; } else { a = c; fa = fc; }
    }
    return h;
  };
  CN.newton = function (fn, dfn, x0, tol, nmax) {
    var h = [], x = x0, i, dx;
    for (i = 1; i <= nmax; i++) {
      var d = dfn(x);
      if (Math.abs(d) < 1e-14) break;
      dx = fn(x) / d;
      x = x - dx;
      h.push({ it: i, x: x, fx: fn(x), inter: Math.abs(dx) });
      if (Math.abs(dx) < tol) break;
    }
    return h;
  };
  CN.secante = function (fn, x0, x1, tol, nmax) {
    var h = [], i, x2;
    for (i = 1; i <= nmax; i++) {
      var f0 = fn(x0), f1 = fn(x1);
      if (Math.abs(f1 - f0) < 1e-16) break;
      x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
      h.push({ it: i, x: x2, fx: fn(x2), inter: Math.abs(x2 - x1) });
      if (Math.abs(x2 - x1) < tol) break;
      x0 = x1; x1 = x2;
    }
    return h;
  };
  /* raiz de referência, para medir o erro de cada método */
  CN.raizRef = function (fn, a, b) {
    var fa = fn(a), c, i;
    if (fa * fn(b) > 0) return null;
    for (i = 0; i < 200; i++) {
      c = (a + b) / 2;
      if (fa * fn(c) < 0) b = c; else { a = c; fa = fn(c); }
    }
    return (a + b) / 2;
  };

  /* ---------------------------------------------------------------
     Sistemas lineares
     --------------------------------------------------------------- */
  CN.gauss = function (A, b) {
    var n = A.length, M = A.map(function (r, i) { return r.concat([b[i]]); });
    var k, i, j, p, t, trocas = 0;
    for (k = 0; k < n; k++) {
      p = k;
      for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (p !== k) { t = M[k]; M[k] = M[p]; M[p] = t; trocas++; }
      if (Math.abs(M[k][k]) < 1e-14) return null;
      for (i = k + 1; i < n; i++) {
        var fat = M[i][k] / M[k][k];
        for (j = k; j <= n; j++) M[i][j] -= fat * M[k][j];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return { x: x, trocas: trocas, U: M };
  };
  CN.iterativo = function (A, b, nmax, tol, seidel) {
    var n = A.length, x = new Array(n), h = [], i, j, k;
    for (i = 0; i < n; i++) x[i] = 0;
    for (k = 1; k <= nmax; k++) {
      var xn = seidel ? x : x.slice();
      var dif = 0;
      for (i = 0; i < n; i++) {
        var s = b[i];
        for (j = 0; j < n; j++) if (j !== i) s -= A[i][j] * (seidel ? xn[j] : x[j]);
        var novo = s / A[i][i];
        dif = Math.max(dif, Math.abs(novo - (seidel ? xn[i] : x[i])));
        xn[i] = novo;
      }
      x = seidel ? xn : xn;
      h.push({ it: k, x: x.slice(), dif: dif });
      if (dif < tol) break;
    }
    return h;
  };
  /* critério das linhas: diagonal estritamente dominante garante convergência */
  CN.dominante = function (A) {
    var n = A.length, i, j, pior = 0;
    for (i = 0; i < n; i++) {
      var s = 0;
      for (j = 0; j < n; j++) if (j !== i) s += Math.abs(A[i][j]);
      pior = Math.max(pior, s / Math.abs(A[i][i]));
    }
    return { alfa: pior, ok: pior < 1 };
  };

  /* ---------------------------------------------------------------
     Interpolação e ajuste
     --------------------------------------------------------------- */
  CN.lagrange = function (xs, ys, x) {
    var s = 0, i, j, L;
    for (i = 0; i < xs.length; i++) {
      L = 1;
      for (j = 0; j < xs.length; j++) if (j !== i) L *= (x - xs[j]) / (xs[i] - xs[j]);
      s += ys[i] * L;
    }
    return s;
  };
  /* diferenças divididas de Newton */
  CN.difDivididas = function (xs, ys) {
    var n = xs.length, c = ys.slice(), i, j;
    for (j = 1; j < n; j++)
      for (i = n - 1; i >= j; i--)
        c[i] = (c[i] - c[i - 1]) / (xs[i] - xs[i - j]);
    return c;
  };
  /* spline cúbica natural: devolve a função interpoladora */
  CN.spline = function (xs, ys) {
    var n = xs.length, i, h = [], al = [], l = [], mu = [], z = [];
    for (i = 0; i < n - 1; i++) h.push(xs[i + 1] - xs[i]);
    for (i = 1; i < n - 1; i++)
      al.push(3 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]));
    l[0] = 1; mu[0] = 0; z[0] = 0;
    for (i = 1; i < n - 1; i++) {
      l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
      mu[i] = h[i] / l[i];
      z[i] = (al[i - 1] - h[i - 1] * z[i - 1]) / l[i];
    }
    var c = new Array(n), bb = new Array(n), d = new Array(n);
    l[n - 1] = 1; z[n - 1] = 0; c[n - 1] = 0;
    for (i = n - 2; i >= 0; i--) {
      c[i] = z[i] - mu[i] * c[i + 1];
      bb[i] = (ys[i + 1] - ys[i]) / h[i] - h[i] * (c[i + 1] + 2 * c[i]) / 3;
      d[i] = (c[i + 1] - c[i]) / (3 * h[i]);
    }
    return function (x) {
      var k = 0;
      for (k = n - 2; k > 0; k--) if (x >= xs[k]) break;
      var dx = x - xs[k];
      return ys[k] + bb[k] * dx + c[k] * dx * dx + d[k] * dx * dx * dx;
    };
  };
  /* mínimos quadrados polinomial de grau g */
  CN.minQuad = function (xs, ys, g) {
    var n = g + 1, A = [], b = [], i, j, k;
    for (i = 0; i < n; i++) {
      A.push([]); var s = 0;
      for (j = 0; j < n; j++) {
        var t = 0;
        for (k = 0; k < xs.length; k++) t += Math.pow(xs[k], i + j);
        A[i].push(t);
      }
      for (k = 0; k < xs.length; k++) s += ys[k] * Math.pow(xs[k], i);
      b.push(s);
    }
    var r = CN.gauss(A, b);
    if (!r) return null;
    var co = r.x;
    var med = ys.reduce(function (s2, v) { return s2 + v; }, 0) / ys.length;
    var sst = 0, sse = 0;
    for (k = 0; k < xs.length; k++) {
      var p = 0;
      for (i = 0; i < n; i++) p += co[i] * Math.pow(xs[k], i);
      sse += Math.pow(ys[k] - p, 2);
      sst += Math.pow(ys[k] - med, 2);
    }
    return { co: co, sse: sse, sst: sst, r2: sst > 0 ? 1 - sse / sst : 1 };
  };
  CN.avalia = function (co, x) {
    var s = 0, i;
    for (i = co.length - 1; i >= 0; i--) s = s * x + co[i];
    return s;
  };

  /* ---------------------------------------------------------------
     Integração e derivação
     --------------------------------------------------------------- */
  CN.integrandos = [
    { id: 'exp', nome: '∫ eˣ dx', tex: 'e^{x}', f: Math.exp, a: 0, b: 1, exata: Math.E - 1 },
    { id: 'sen', nome: '∫ sen(x) dx', tex: '\\sin x', f: Math.sin, a: 0, b: Math.PI, exata: 2 },
    { id: 'inv', nome: '∫ 1/x dx', tex: '1/x', f: function (x) { return 1 / x; }, a: 1, b: 2, exata: Math.LN2 },
    { id: 'gauss', nome: '∫ e^(−x²) dx', tex: 'e^{-x^2}', f: function (x) { return Math.exp(-x * x); },
      a: 0, b: 1, exata: 0.7468241328124270 },
    { id: 'pol', nome: '∫ x³ dx', tex: 'x^3', f: function (x) { return x * x * x; }, a: 0, b: 2, exata: 4 },
    { id: 'runge', nome: '∫ 1/(1+25x²) dx', tex: '\\frac{1}{1+25x^2}',
      f: function (x) { return 1 / (1 + 25 * x * x); }, a: -1, b: 1, exata: 2 * Math.atan(5) / 5 }
  ];
  CN.integrando = function (id) {
    for (var i = 0; i < CN.integrandos.length; i++) if (CN.integrandos[i].id === id) return CN.integrandos[i];
    return CN.integrandos[0];
  };
  CN.trapezio = function (fn, a, b, n) {
    var h = (b - a) / n, s = (fn(a) + fn(b)) / 2, i;
    for (i = 1; i < n; i++) s += fn(a + i * h);
    return s * h;
  };
  CN.simpson = function (fn, a, b, n) {
    if (n % 2) n++;
    var h = (b - a) / n, s = fn(a) + fn(b), i;
    for (i = 1; i < n; i++) s += fn(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  };
  /* quadratura de Gauss-Legendre, 2 a 5 pontos */
  CN.GL = {
    2: [[-0.5773502691896257, 1], [0.5773502691896257, 1]],
    3: [[-0.7745966692414834, 0.5555555555555556], [0, 0.8888888888888888],
        [0.7745966692414834, 0.5555555555555556]],
    4: [[-0.8611363115940526, 0.3478548451374538], [-0.3399810435848563, 0.6521451548625461],
        [0.3399810435848563, 0.6521451548625461], [0.8611363115940526, 0.3478548451374538]],
    5: [[-0.9061798459386640, 0.2369268850561891], [-0.5384693101056831, 0.4786286704993665],
        [0, 0.5688888888888889], [0.5384693101056831, 0.4786286704993665],
        [0.9061798459386640, 0.2369268850561891]]
  };
  CN.gaussLeg = function (fn, a, b, n) {
    var p = CN.GL[n] || CN.GL[2], s = 0, i;
    for (i = 0; i < p.length; i++) {
      var x = (b - a) / 2 * p[i][0] + (a + b) / 2;
      s += p[i][1] * fn(x);
    }
    return s * (b - a) / 2;
  };

  global.CN = CN;

  var Plot = global.Plot;
  function sg(v, n) { return global.Plot ? global.Plot.sig(v, n || 3) : v; }
  function nt(v, n) { return sg(v, n).toString().replace('.', ','); }
  function fix(v, n) {
    return Number(v).toFixed(n == null ? 6 : n).replace('.', ',');
  }
  function exp2(v) {
    if (v === 0) return '0';
    return Number(v).toExponential(3).replace('.', ',').replace('e', ' × 10^');
  }
  function cor(k) { return Plot.serie(k); }

  /* =========================================================================
     1 · Raízes de equações
     ========================================================================= */
  function montarRaizes() {
    if (!document.getElementById('sim-raizes')) return;
    Sim.build('#sim-raizes', {
      titulo: '1. Raízes de equações — quatro métodos na mesma função',
      descricao: 'Os quatro métodos encontram a mesma raiz, mas com números de iterações muito diferentes. O que o simulador torna visível é a ordem de convergência: a bisseção ganha um bit por iteração, enquanto Newton dobra o número de dígitos corretos a cada passo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · A cúbica clássica', desc: 'x³ − 9x + 3 em [0, 1]',
          valores: { fn: 'cubica', a: 0, b: 1, x0: 0.5, tol: 6, nmax: 20 } },
        { nome: '2 · Raiz de 2', desc: 'O caso em que Newton vira o método babilônico',
          valores: { fn: 'raiz2', a: 1, b: 2, x0: 1, tol: 10, nmax: 20 } },
        { nome: '3 · Ponto fixo trigonométrico', desc: 'cos(x) = x',
          valores: { fn: 'trig', a: 0, b: 1, x0: 0.5, tol: 8, nmax: 20 } },
        { nome: '4 · Exponencial contra reta', desc: 'e^x = 3x tem duas raízes',
          valores: { fn: 'expo', a: 0, b: 1, x0: 0.5, tol: 8, nmax: 20 } },
        { nome: '5 · Raiz dupla', desc: 'Newton perde a convergência quadrática',
          valores: { fn: 'dupla', a: 0.2, b: 1.8, x0: 1.6, tol: 8, nmax: 30 } },
        { nome: '6 · Tolerância apertada', desc: 'Doze casas: a bisseção precisa de 40 iterações',
          valores: { fn: 'cubica', a: 0, b: 1, x0: 0.5, tol: 12, nmax: 45 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A equação' },
        { id: 'fn', tipo: 'select', label: 'Função', valor: 'cubica',
          opcoes: CN.funcoes.map(function (f) { return { v: f.id, t: f.nome }; }) },
        { tipo: 'titulo', label: 'Os pontos de partida' },
        { id: 'a', label: 'Extremo a do intervalo', min: -5, max: 5, step: 0.05, valor: 0 },
        { id: 'b', label: 'Extremo b do intervalo', min: -5, max: 8, step: 0.05, valor: 1 },
        { id: 'x0', label: 'Chute inicial de Newton', min: -5, max: 8, step: 0.05, valor: 0.5 },
        { tipo: 'titulo', label: 'Parada' },
        { id: 'tol', label: 'Tolerância (casas decimais)', min: 2, max: 14, step: 1, valor: 6 },
        { id: 'nmax', label: 'Máximo de iterações', min: 5, max: 60, step: 1, valor: 20 }
      ],
      graficos: [
        { id: 'curva', titulo: 'A função e as aproximações', xlabel: 'x', ylabel: 'f(x)', aspect: 0.44, legendPos: 'topleft' },
        { id: 'conv', titulo: 'Erro a cada iteração (escala logarítmica)', xlabel: 'iteração',
          ylabel: 'log₁₀ |erro|', aspect: 0.38, legendPos: 'bottomleft' }
      ],
      saidas: [
        { id: 'raiz', label: 'Raiz' },
        { id: 'nbis', label: 'Iterações da bisseção' },
        { id: 'nfal', label: 'Iterações da falsa posição' },
        { id: 'nnew', label: 'Iterações de Newton' },
        { id: 'nsec', label: 'Iterações da secante' },
        { id: 'ordem', label: 'Ordem medida de Newton' }
      ],
      formulas: [
        { g: 'Métodos de intervalo' },
        { tex: 'c = \\frac{a+b}{2}', d: 'bisseção: sempre converge, uma casa binária por iteração', destaque: true },
        { tex: 'c = \\frac{a\\,f(b) - b\\,f(a)}{f(b) - f(a)}', d: 'falsa posição: usa a inclinação da corda' },
        { g: 'Métodos abertos' },
        { tex: 'x_{k+1} = x_k - \\frac{f(x_k)}{f\'(x_k)}', d: 'Newton-Raphson: ordem 2, mas pode divergir', destaque: true },
        { tex: 'x_{k+1} = x_k - f(x_k)\\frac{x_k - x_{k-1}}{f(x_k) - f(x_{k-1})}', d: 'secante: ordem 1,618, dispensa a derivada' },
        { g: 'Convergência' },
        { tex: '|e_{k+1}| \\approx C\\,|e_k|^{p}', d: 'p = 1 na bisseção, 1,618 na secante, 2 em Newton' },
        { tex: 'n \\ge \\frac{\\log_2(b-a) - \\log_2 \\varepsilon}{1}', d: 'iterações necessárias na bisseção, conhecidas de antemão' }
      ],
      nota: 'A bisseção é o único dos quatro com convergência garantida, desde que haja troca de sinal no intervalo. Newton é o mais rápido e o menos confiável: diverge se a derivada se anula perto da raiz, e perde a ordem 2 em raízes múltiplas — como o exemplo 5 mostra.',
      calcular: function (p, ctx) {
        var F = CN.funcao(p.fn);
        var tol = Math.pow(10, -p.tol), nmax = Math.round(p.nmax);
        var a = Math.min(p.a, p.b), b = Math.max(p.a, p.b);
        var ref = CN.raizRef(F.f, a, b);

        var hb = CN.bissecao(F.f, a, b, tol, nmax);
        var hf = CN.falsaPosicao(F.f, a, b, tol, nmax);
        var hn = CN.newton(F.f, F.d, p.x0, tol, nmax);
        var hs = CN.secante(F.f, a, b, tol, nmax);
        var raiz = hn.length ? hn[hn.length - 1].x : (ref === null ? NaN : ref);

        var g = ctx.plot('curva').clear();
        var xs = [], ys = [], i, x;
        var m0 = Math.min(a, p.x0) - 0.3, m1 = Math.max(b, p.x0) + 0.3;
        for (i = 0; i <= 220; i++) { x = m0 + (m1 - m0) * i / 220; xs.push(x); ys.push(F.f(x)); }
        g.line(xs, ys, { color: cor(0), width: 2.4, label: F.nome });
        g.hline(0, { color: cor(5), width: 1.4 });
        if (ref !== null) g.marker(ref, 0, 'raiz ' + fix(ref, 6), { color: cor(1) });
        [[hb, 2, 'bisseção'], [hn, 3, 'Newton']].forEach(function (par) {
          par[0].slice(0, 6).forEach(function (it) {
            g.points([it.x], [it.fx], { color: cor(par[1]), r: 3.5 });
          });
        });
        g.draw();

        var gc = ctx.plot('conv').clear();
        [[hb, 2, 'bisseção'], [hf, 4, 'falsa posição'], [hn, 3, 'Newton'], [hs, 1, 'secante']]
          .forEach(function (par) {
            if (!par[0].length || ref === null) return;
            var xx = [], yy = [];
            par[0].forEach(function (it) {
              var e = Math.abs(it.x - ref);
              if (e > 1e-16) { xx.push(it.it); yy.push(Math.log(e) / Math.LN10); }
            });
            if (xx.length) gc.line(xx, yy, { color: cor(par[1]), width: 2, label: par[2] });
          });
        gc.hline(-p.tol, { color: cor(5), width: 1.2, dash: [5, 4], text: 'tolerância' });
        gc.draw();

        /* ordem medida: razão entre logaritmos de erros sucessivos */
        var ordem = null;
        if (hn.length >= 4 && ref !== null) {
          var e = hn.map(function (it) { return Math.abs(it.x - ref); })
                    .filter(function (v) { return v > 1e-14; });
          if (e.length >= 3) {
            var k = e.length - 2;
            ordem = Math.log(e[k + 1] / e[k]) / Math.log(e[k] / e[k - 1]);
          }
        }
        var nbisTeor = Math.ceil((Math.log(b - a) - Math.log(tol)) / Math.LN2);

        ctx.setPassos([
          { t: '① Isolar a raiz',
            tex: 'f(' + nt(a, 4) + ') = ' + nt(F.f(a), 4) + ' \\qquad f(' + nt(b, 4) + ') = ' + nt(F.f(b), 4),
            obs: F.f(a) * F.f(b) < 0
              ? 'Há troca de sinal no intervalo, então pelo teorema de Bolzano existe pelo menos uma raiz entre '
                + nt(a, 4) + ' e ' + nt(b, 4) + ' — e a bisseção tem convergência garantida.'
              : 'Não há troca de sinal no intervalo: os métodos de intervalo não podem ser aplicados. '
                + 'Ou não há raiz, ou há um número par delas. Ajuste a e b.' },
          { t: '② Bisseção: previsível e lenta',
            tex: 'n \\ge \\frac{\\log(b-a) - \\log\\varepsilon}{\\log 2} = ' + nbisTeor,
            obs: 'A bisseção divide o intervalo ao meio a cada passo, ganhando uma casa binária — cerca de 0,3 casa '
              + 'decimal — por iteração. O número de iterações é conhecido <em>antes</em> de começar, propriedade que '
              + 'nenhum dos outros três tem. Aqui foram ' + hb.length + ' iterações.' },
          { t: '③ Newton: rápido e arriscado',
            tex: 'x_{k+1} = x_k - \\frac{f(x_k)}{f\'(x_k)}',
            texSub: ordem !== null ? 'p_{medido} \\approx ' + nt(ordem, 3) : '',
            obs: hn.length
              ? 'Convergiu em ' + hn.length + ' iterações, contra ' + hb.length + ' da bisseção. '
                + (ordem !== null && ordem > 1.7
                  ? 'A ordem medida de ' + nt(ordem, 3) + ' confirma a convergência quadrática: o número de dígitos '
                    + 'corretos dobra a cada passo.'
                  : ordem !== null
                    ? 'A ordem medida, ' + nt(ordem, 3) + ', ficou longe de 2 — sinal de raiz múltipla, em que a '
                      + 'derivada também se anula e Newton degenera para convergência linear.'
                    : '') +
                ' Em troca, ele exige a derivada e pode divergir se o chute for ruim.'
              : 'Newton não convergiu a partir desse chute: a derivada se anulou ou a sequência escapou. '
                + 'É exatamente o risco que a bisseção não tem.' },
          { t: '④ Secante: o meio-termo',
            obs: 'A secante substitui a derivada pela inclinação da corda entre os dois últimos pontos. Perde um pouco '
              + 'de velocidade — ordem 1,618, a razão áurea — e ganha muito em aplicabilidade, porque dispensa a '
              + 'expressão analítica da derivada. Aqui foram ' + hs.length + ' iterações contra ' + hn.length
              + ' de Newton. Em problemas reais, em que f vem de uma simulação e não de uma fórmula, ela costuma ser a escolha.' }
        ]);
        return {
          raiz: { v: isFinite(raiz) ? fix(raiz, Math.min(10, p.tol + 2)) : '—' },
          nbis: { v: hb.length || '—', u: hb.length ? 'it' : '' },
          nfal: { v: hf.length || '—', u: hf.length ? 'it' : '' },
          nnew: { v: hn.length || '—', u: hn.length ? 'it' : '', classe: 'ok' },
          nsec: { v: hs.length || '—', u: hs.length ? 'it' : '' },
          ordem: { v: ordem === null ? '—' : sg(ordem, 3),
                   classe: ordem !== null && ordem > 1.7 ? 'ok' : 'alerta' }
        };
      }
    });
  }

  /* =========================================================================
     2 · Sistemas lineares
     ========================================================================= */
  function montarSistemas() {
    if (!document.getElementById('sim-sistemas')) return;
    var campos = [];
    [0, 1, 2].forEach(function (i) {
      [0, 1, 2].forEach(function (j) {
        campos.push({ id: 'a' + i + j, label: 'a' + (i + 1) + (j + 1), min: -20, max: 20, step: 0.5,
                      valor: [[10, 2, 1], [1, 5, 1], [2, 3, 10]][i][j] });
      });
      campos.push({ id: 'b' + i, label: 'b' + (i + 1), min: -40, max: 40, step: 0.5,
                    valor: [7, -8, 6][i] });
    });
    Sim.build('#sim-sistemas', {
      titulo: '2. Sistemas lineares — Gauss, Jacobi e Gauss-Seidel',
      descricao: 'O método direto dá a resposta exata em um número fixo de operações; os iterativos chegam perto e param quando você manda. Em sistema pequeno o direto ganha sempre — em sistema esparso de milhões de incógnitas, que é o caso real da engenharia, só os iterativos são viáveis.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Diagonal dominante', desc: 'O caso em que os dois iterativos convergem',
          valores: { a00: 10, a01: 2, a02: 1, b0: 7, a10: 1, a11: 5, a12: 1, b1: -8,
                     a20: 2, a21: 3, a22: 10, b2: 6, nmax: 30 } },
        { nome: '2 · Dominância fraca', desc: 'Converge, mas devagar',
          valores: { a00: 4, a01: 2, a02: 1, b0: 7, a10: 1, a11: 3, a12: 1, b1: -4,
                     a20: 2, a21: 2, a22: 5, b2: 6, nmax: 25 } },
        { nome: '3 · Sem dominância: diverge', desc: 'O critério das linhas falha',
          valores: { a00: 1, a01: 3, a02: 2, b0: 7, a10: 4, a11: 1, a12: 1, b1: -8,
                     a20: 2, a21: 5, a22: 1, b2: 6, nmax: 15 } },
        { nome: '4 · O mesmo, reordenado', desc: 'Trocar as linhas restaura a convergência',
          valores: { a00: 4, a01: 1, a02: 1, b0: -8, a10: 2, a11: 5, a12: 1, b1: 6,
                     a20: 1, a21: 3, a22: 2, b2: 7, nmax: 15 } },
        { nome: '5 · Quase singular', desc: 'O pivotamento salva a eliminação',
          valores: { a00: 0.0003, a01: 3, a02: 1, b0: 4, a10: 1, a11: 1, a12: 1, b1: 3,
                     a20: 2, a21: 1, a22: 4, b2: 7, nmax: 15 } },
        { nome: '6 · Fortemente dominante', desc: 'Converge em três iterações',
          valores: { a00: 20, a01: 1, a02: 1, b0: 22, a10: 1, a11: 20, a12: 1, b1: 22,
                     a20: 1, a21: 1, a22: 20, b2: 22, nmax: 10 } }
      ],
      controles: [{ tipo: 'titulo', label: 'A matriz aumentada [A | b]' }]
        .concat(campos)
        .concat([{ tipo: 'titulo', label: 'Parada' },
                 { id: 'nmax', label: 'Máximo de iterações', min: 3, max: 40, step: 1, valor: 30 }]),
      graficos: [
        { id: 'conv', titulo: 'Erro máximo a cada iteração (log)', xlabel: 'iteração',
          ylabel: 'log₁₀ |erro|', aspect: 0.46, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'x1', label: 'x₁ (exato)' },
        { id: 'x2', label: 'x₂ (exato)' },
        { id: 'x3', label: 'x₃ (exato)' },
        { id: 'alfa', label: 'Critério das linhas α' },
        { id: 'nj', label: 'Iterações de Jacobi' },
        { id: 'ns', label: 'Iterações de Gauss-Seidel' }
      ],
      formulas: [
        { g: 'Método direto' },
        { tex: 'A\\mathbf{x} = \\mathbf{b} \\;\\to\\; U\\mathbf{x} = \\mathbf{c}', d: 'eliminação de Gauss com pivotamento parcial', destaque: true },
        { tex: '\\sim \\tfrac{2}{3}n^3 \\text{ operações}', d: 'custo cúbico: inviável para n muito grande' },
        { g: 'Métodos iterativos' },
        { tex: 'x_i^{(k+1)} = \\frac{1}{a_{ii}}\\left(b_i - \\sum_{j \\ne i} a_{ij}\\,x_j^{(k)}\\right)', d: 'Jacobi: usa só a iteração anterior', destaque: true },
        { tex: 'x_i^{(k+1)} = \\frac{1}{a_{ii}}\\left(b_i - \\sum_{j<i} a_{ij}x_j^{(k+1)} - \\sum_{j>i} a_{ij}x_j^{(k)}\\right)', d: 'Gauss-Seidel: já usa o que acabou de calcular' },
        { g: 'Convergência' },
        { tex: '\\alpha = \\max_i \\frac{\\sum_{j\\ne i}|a_{ij}|}{|a_{ii}|} < 1', d: 'critério das linhas: suficiente, não necessário', destaque: true }
      ],
      nota: 'O critério das linhas é suficiente mas não necessário: um sistema que o viola ainda pode convergir. O que ele garante é que, se a diagonal for estritamente dominante, Jacobi e Gauss-Seidel convergem para qualquer chute inicial — e trocar linhas de lugar muitas vezes transforma um sistema divergente em convergente, como o exemplo 4 mostra.',
      calcular: function (p, ctx) {
        var A = [[p.a00, p.a01, p.a02], [p.a10, p.a11, p.a12], [p.a20, p.a21, p.a22]];
        var b = [p.b0, p.b1, p.b2];
        var nmax = Math.round(p.nmax);
        var dir = CN.gauss(A, b);
        var dom = CN.dominante(A);
        var hj = CN.iterativo(A, b, nmax, 1e-10, false);
        var hs = CN.iterativo(A, b, nmax, 1e-10, true);
        var sol = dir ? dir.x : [NaN, NaN, NaN];

        var g = ctx.plot('conv').clear();
        [[hj, 0, 'Jacobi'], [hs, 3, 'Gauss-Seidel']].forEach(function (par) {
          var xx = [], yy = [];
          par[0].forEach(function (it) {
            var e = Math.max.apply(null, it.x.map(function (v, i) { return Math.abs(v - sol[i]); }));
            xx.push(it.it);
            yy.push(Math.log(Math.max(e, 1e-16)) / Math.LN10);
          });
          if (xx.length) g.line(xx, yy, { color: cor(par[1]), width: 2.4, label: par[2] });
        });
        g.hline(-10, { color: cor(5), width: 1.2, dash: [5, 4], text: 'tolerância 10⁻¹⁰' });
        g.draw();

        var conv = function (h) {
          if (!h.length) return false;
          var u = h[h.length - 1];
          return isFinite(u.dif) && u.dif < 1e-9;
        };
        /* parar no limite de iterações não é o mesmo que divergir */
        var situacao = function (h) {
          if (!h.length) return 'divergiu';
          var u = h[h.length - 1], ant = h[Math.max(0, h.length - 2)];
          return isFinite(u.dif) && u.dif <= ant.dif ? 'limite atingido' : 'divergiu';
        };
        ctx.setPassos([
          { t: '① A solução exata, por eliminação',
            texSub: dir
              ? 'x = (' + nt(sol[0], 5) + ',\\; ' + nt(sol[1], 5) + ',\\; ' + nt(sol[2], 5) + ')'
              : '\\text{matriz singular}',
            obs: dir
              ? 'A eliminação de Gauss com pivotamento parcial resolve em um número fixo de operações — da ordem de '
                + '2n³/3, que para n = 3 são 18. ' + (dir.trocas ? 'Foram necessárias ' + dir.trocas
                  + ' troca(s) de linha para levar o maior pivô à diagonal.' : 'Nenhuma troca de linha foi necessária.')
              : 'A matriz é singular ou quase: a eliminação encontrou pivô nulo. O sistema não tem solução única.' },
          { t: '② O critério das linhas',
            tex: '\\alpha = ' + nt(dom.alfa, 4),
            obs: dom.ok
              ? 'α < 1: a diagonal é estritamente dominante, e isso <strong>garante</strong> que Jacobi e Gauss-Seidel '
                + 'convergem a partir de qualquer chute inicial. Quanto menor o α, mais rápido.'
              : 'α ≥ 1: o critério falha. Isso não prova que os métodos divergem — ele é suficiente, não necessário —, '
                + 'mas tira a garantia. Trocar linhas de lugar costuma resolver, levando os maiores coeficientes à diagonal.' },
          { t: '③ Jacobi contra Gauss-Seidel',
            obs: conv(hj) && conv(hs)
              ? 'Jacobi precisou de ' + hj.length + ' iterações e Gauss-Seidel de ' + hs.length + '. '
                + 'A diferença vem de uma mudança mínima no algoritmo: Gauss-Seidel usa os valores recém-calculados '
                + 'dentro da mesma iteração, em vez de esperar a próxima. Na prática ele costuma convergir cerca de '
                + 'duas vezes mais rápido, e ainda economiza memória, por não precisar guardar o vetor anterior.'
              : conv(hs)
                ? 'Gauss-Seidel convergiu em ' + hs.length + ' iterações. Jacobi '
                  + (situacao(hj) === 'divergiu' ? 'divergiu: Gauss-Seidel converge em alguns casos em que Jacobi falha.'
                    : 'ainda estava convergindo quando atingiu o limite de ' + nmax + ' iterações. Aumente o limite para vê-lo chegar.')
                : 'Nenhum dos dois chegou à tolerância em ' + nmax + ' iterações. Com α = ' + nt(dom.alfa, 3)
                  + (dom.ok ? ', a convergência é garantida: aumente o limite de iterações.' : ', isso era de se esperar — tente reordenar as linhas.') },
          { t: '④ Quando usar cada um',
            obs: 'Para sistema pequeno e denso, o método direto é melhor: dá a resposta exata e em tempo previsível. '
              + 'Os iterativos existem para o caso oposto — matrizes esparsas e enormes, que aparecem em diferenças '
              + 'finitas e em elementos finitos. Ali a eliminação preencheria a matriz de zeros com não zeros e '
              + 'esgotaria a memória, enquanto o método iterativo só precisa multiplicar matriz por vetor.' }
        ]);
        return {
          x1: { v: dir ? fix(sol[0], 6) : '—' },
          x2: { v: dir ? fix(sol[1], 6) : '—' },
          x3: { v: dir ? fix(sol[2], 6) : '—' },
          alfa: { v: sg(dom.alfa, 4), classe: dom.ok ? 'ok' : 'alerta' },
          nj: { v: conv(hj) ? hj.length : situacao(hj), u: conv(hj) ? 'it' : '',
                classe: conv(hj) ? '' : 'alerta' },
          ns: { v: conv(hs) ? hs.length : situacao(hs), u: conv(hs) ? 'it' : '',
                classe: conv(hs) ? 'ok' : 'alerta' }
        };
      }
    });
  }

  /* =========================================================================
     3 · Interpolação
     ========================================================================= */
  function montarInterpolacao() {
    if (!document.getElementById('sim-interpolacao')) return;
    Sim.build('#sim-interpolacao', {
      titulo: '3. Interpolação — Lagrange, Runge e splines',
      descricao: 'A intuição diz que mais pontos dão melhor aproximação. Com polinômio único de grau alto e pontos igualmente espaçados, a intuição está errada: o erro explode nas bordas. O simulador mostra o fenômeno de Runge e as duas saídas — pontos de Chebyshev e splines.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Senoide com 3 pontos', desc: 'Parábola passando por três pontos de sen(x)',
          valores: { fn: 'sen', n: 3, cheb: 0, spline: 0 } },
        { nome: '2 · O fenômeno de Runge', desc: '1/(1+25x²) com 9 pontos: erro nas bordas',
          valores: { fn: 'runge', n: 9, cheb: 0, spline: 0 } },
        { nome: '3 · Runge com 13 pontos', desc: 'Mais pontos pioram, não melhoram',
          valores: { fn: 'runge', n: 13, cheb: 0, spline: 0 } },
        { nome: '4 · Pontos de Chebyshev', desc: 'A mesma função, pontos concentrados nas bordas',
          valores: { fn: 'runge', n: 13, cheb: 1, spline: 0 } },
        { nome: '5 · Spline cúbica', desc: 'Pedaços de grau 3 em vez de um polinômio de grau 12',
          valores: { fn: 'runge', n: 13, cheb: 0, spline: 1 } },
        { nome: '6 · Degrau suavizado', desc: 'Oscilação mesmo em função bem-comportada',
          valores: { fn: 'tanh', n: 11, cheb: 0, spline: 0 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A função a interpolar' },
        { id: 'fn', tipo: 'select', label: 'Função', valor: 'runge',
          opcoes: [{ v: 'runge', t: '1/(1 + 25x²) — a função de Runge' },
                   { v: 'sen', t: 'sen(πx)' },
                   { v: 'tanh', t: 'tanh(5x) — degrau suavizado' },
                   { v: 'abs', t: '|x| — derivada descontínua' },
                   { v: 'exp', t: 'e^(−x²)' }] },
        { tipo: 'titulo', label: 'Os nós' },
        { id: 'n', label: 'Número de pontos', min: 2, max: 21, step: 1, valor: 9 },
        { id: 'cheb', tipo: 'check', label: 'Usar nós de Chebyshev (concentrados nas bordas)', valor: false },
        { id: 'spline', tipo: 'check', label: 'Mostrar a spline cúbica natural', valor: false }
      ],
      graficos: [
        { id: 'interp', titulo: 'Função, nós e interpolador', xlabel: 'x', ylabel: 'y', aspect: 0.46, legendPos: 'topright' },
        { id: 'erro', titulo: 'Erro |P(x) − f(x)| ao longo do intervalo', xlabel: 'x', ylabel: 'erro', aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'grau', label: 'Grau do polinômio' },
        { id: 'emax', label: 'Erro máximo (Lagrange)' },
        { id: 'xmax', label: 'Onde o erro é máximo' },
        { id: 'eborda', label: 'Erro a 5 % da borda' },
        { id: 'ecentro', label: 'Erro no centro' },
        { id: 'espl', label: 'Erro máximo da spline' }
      ],
      formulas: [
        { g: 'Interpolação de Lagrange' },
        { tex: 'P_n(x) = \\sum_{i=0}^{n} y_i\\,L_i(x), \\quad L_i(x) = \\prod_{j \\ne i} \\frac{x - x_j}{x_i - x_j}', d: 'o polinômio de grau n que passa por n+1 pontos', destaque: true },
        { tex: 'L_i(x_k) = \\delta_{ik}', d: 'cada base vale 1 no seu nó e 0 nos demais' },
        { g: 'Erro' },
        { tex: 'E(x) = \\frac{f^{(n+1)}(\\xi)}{(n+1)!}\\prod_{i=0}^{n}(x - x_i)', d: 'cresce com a derivada de ordem alta — o motivo do fenômeno de Runge', destaque: true },
        { g: 'As duas saídas' },
        { tex: 'x_k = \\cos\\!\\left(\\frac{2k+1}{2n+2}\\pi\\right)', d: 'nós de Chebyshev: minimizam o produtório do erro' },
        { tex: 'S_k(x) = a_k + b_k(x-x_k) + c_k(x-x_k)^2 + d_k(x-x_k)^3', d: 'spline cúbica: grau 3 em cada trecho, C² nos nós' }
      ],
      nota: 'O polinômio interpolador de grau n por n+1 pontos é único — Lagrange e Newton produzem exatamente o mesmo polinômio, em formas diferentes. A forma de Newton tem a vantagem prática de permitir acrescentar um ponto sem refazer tudo.',
      calcular: function (p, ctx) {
        var defs = {
          runge: { f: function (x) { return 1 / (1 + 25 * x * x); }, a: -1, b: 1, nome: '1/(1+25x²)' },
          sen: { f: function (x) { return Math.sin(Math.PI * x); }, a: -1, b: 1, nome: 'sen(πx)' },
          tanh: { f: function (x) { return Math.tanh(5 * x); }, a: -1, b: 1, nome: 'tanh(5x)' },
          abs: { f: function (x) { return Math.abs(x); }, a: -1, b: 1, nome: '|x|' },
          exp: { f: function (x) { return Math.exp(-x * x); }, a: -2, b: 2, nome: 'e^(−x²)' }
        };
        var D = defs[p.fn] || defs.runge;
        var n = Math.round(p.n), a = D.a, b = D.b, i;

        var xs = [], ys = [];
        for (i = 0; i < n; i++) {
          var t = p.cheb
            ? (a + b) / 2 + (b - a) / 2 * Math.cos((2 * i + 1) / (2 * n) * Math.PI)
            : a + (b - a) * i / (n - 1);
          xs.push(t);
        }
        xs.sort(function (u, v) { return u - v; });
        ys = xs.map(D.f);
        var spl = n >= 3 ? CN.spline(xs, ys) : null;

        var g = ctx.plot('interp').clear();
        var gx = [], gf = [], gp = [], gsp = [], emax = 0, xmax = 0, esp = 0, x;
        for (i = 0; i <= 400; i++) {
          x = a + (b - a) * i / 400;
          var fv = D.f(x), pv = CN.lagrange(xs, ys, x);
          gx.push(x); gf.push(fv); gp.push(pv);
          var e = Math.abs(pv - fv);
          if (e > emax) { emax = e; xmax = x; }
          if (spl) {
            var sv = spl(x); gsp.push(sv);
            esp = Math.max(esp, Math.abs(sv - fv));
          }
        }
        g.line(gx, gf, { color: cor(5), width: 2.6, label: D.nome });
        g.line(gx, gp, { color: cor(0), width: 2, label: 'Lagrange, grau ' + (n - 1) });
        if (p.spline && spl) g.line(gx, gsp, { color: cor(3), width: 2, dash: [6, 4], label: 'spline cúbica' });
        g.points(xs, ys, { color: cor(1), r: 4.5, label: 'nós' });
        var fmin = Math.min.apply(null, gf), fmax2 = Math.max.apply(null, gf);
        var folga = (fmax2 - fmin) * 1.6 || 1;
        g.setLimits([a, b], [fmin - folga, fmax2 + folga]);
        g.draw();

        var ge = ctx.plot('erro').clear();
        var ye = gx.map(function (xx, k) { return Math.abs(gp[k] - gf[k]); });
        ge.line(gx, ye, { color: cor(0), width: 2 });
        if (p.spline && spl) {
          ge.line(gx, gx.map(function (xx, k) { return Math.abs(gsp[k] - gf[k]); }),
            { color: cor(3), width: 1.8, dash: [5, 4] });
        }
        ge.draw();

        var xb = a + (b - a) * 0.05, xc = (a + b) / 2;
        var eb = Math.abs(CN.lagrange(xs, ys, xb) - D.f(xb));
        var ec = Math.abs(CN.lagrange(xs, ys, xc) - D.f(xc));

        ctx.setPassos([
          { t: '① O polinômio é único',
            tex: 'P_{' + (n - 1) + '}(x) = \\sum_{i=0}^{' + (n - 1) + '} y_i\\,L_i(x)',
            obs: 'Por ' + n + ' pontos passa um e só um polinômio de grau ' + (n - 1)
              + '. Lagrange e Newton constroem o mesmo polinômio, em formas diferentes: Lagrange é mais claro de '
              + 'escrever, Newton permite acrescentar um ponto sem refazer a conta.' },
          { t: '② Onde está o erro',
            tex: 'E(x) = \\frac{f^{(n+1)}(\\xi)}{(n+1)!}\\prod_{i}(x - x_i)',
            texSub: '\\max|E| = ' + nt(emax, 4) + ' \\text{ em } x = ' + nt(xmax, 4),
            obs: 'O produtório é pequeno perto do centro e grande nas bordas, onde os nós ficam só de um lado. '
              + 'Aqui o erro no centro é ' + exp2(ec) + ' e perto da borda é ' + exp2(eb) + ' — uma razão de '
              + nt(eb / Math.max(ec, 1e-18), 3) + '.' },
          { t: '③ O fenômeno de Runge',
            obs: p.cheb
              ? 'Com nós de Chebyshev — concentrados nas bordas, onde o produtório do erro é maior — o problema '
                + 'desaparece: o erro máximo caiu para ' + nt(emax, 4) + '. Eles são, em certo sentido, a melhor '
                + 'escolha possível de nós para interpolação polinomial.'
              : 'Com nós igualmente espaçados, aumentar o grau pode <strong>piorar</strong> a aproximação. '
                + 'Na função de Runge, o erro máximo passa de 0,44 com 5 pontos para 3,66 com 13 — a intuição de '
                + 'que mais pontos ajudam é simplesmente falsa aqui. Ligue os nós de Chebyshev e compare.' },
          { t: '④ A saída prática: splines',
            texSub: spl ? '\\max|E_{spline}| = ' + nt(esp, 4) : '',
            obs: spl
              ? 'A spline usa polinômios de grau 3 em cada trecho, casando valor, primeira e segunda derivadas nos nós. '
                + 'Erro máximo de ' + nt(esp, 4) + ' contra ' + nt(emax, 4) + ' do polinômio único — '
                + (esp < emax ? nt(emax / Math.max(esp, 1e-18), 3) + ' vezes melhor' : 'comparável')
                + '. É por isso que spline é o padrão em CAD, em computação gráfica e em tabelas termodinâmicas.'
              : 'Com menos de três pontos não há spline cúbica a construir.' }
        ]);
        return {
          grau: { v: n - 1 },
          emax: { v: sg(emax, 4), classe: emax > 1 ? 'alerta' : 'ok' },
          xmax: { v: sg(xmax, 4) },
          eborda: { v: sg(eb, 3) },
          ecentro: { v: sg(ec, 3) },
          espl: { v: spl ? sg(esp, 4) : '—', classe: spl && esp < emax ? 'ok' : '' }
        };
      }
    });
  }

  /* =========================================================================
     4 · Mínimos quadrados
     ========================================================================= */
  function montarMinimos() {
    if (!document.getElementById('sim-minimos')) return;
    Sim.build('#sim-minimos', {
      titulo: '4. Ajuste de curvas — mínimos quadrados',
      descricao: 'Interpolar obriga a curva a passar por todos os pontos; ajustar busca a curva que passa o mais perto possível de todos. Com dados experimentais, que trazem erro de medição, ajustar é quase sempre o que se quer — e aumentar o grau até passar por todos é o erro clássico.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Reta quase perfeita', desc: 'Dados lineares com ruído pequeno',
          valores: { conj: 'linear', grau: 1, ruido: 0.1 } },
        { nome: '2 · A mesma reta, grau 4', desc: 'Mais parâmetros, R² maior, modelo pior',
          valores: { conj: 'linear', grau: 4, ruido: 0.1 } },
        { nome: '3 · Dados quadráticos', desc: 'Reta não dá conta',
          valores: { conj: 'quad', grau: 1, ruido: 0.3 } },
        { nome: '4 · O grau certo', desc: 'Parábola nos mesmos dados',
          valores: { conj: 'quad', grau: 2, ruido: 0.3 } },
        { nome: '5 · Sobreajuste extremo', desc: 'Grau 7 em 9 pontos ruidosos',
          valores: { conj: 'quad', grau: 7, ruido: 0.8 } },
        { nome: '6 · Ensaio de tração', desc: 'Trecho elástico: a reta dá o módulo',
          valores: { conj: 'tracao', grau: 1, ruido: 0.2 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Os dados' },
        { id: 'conj', tipo: 'select', label: 'Conjunto', valor: 'linear',
          opcoes: [{ v: 'linear', t: 'Tendência linear' },
                   { v: 'quad', t: 'Tendência quadrática' },
                   { v: 'tracao', t: 'Ensaio de tração (trecho elástico)' },
                   { v: 'exp', t: 'Decaimento exponencial' }] },
        { id: 'ruido', label: 'Dispersão dos dados', min: 0, max: 1.5, step: 0.05, valor: 0.1 },
        { tipo: 'titulo', label: 'O modelo' },
        { id: 'grau', label: 'Grau do polinômio de ajuste', min: 0, max: 8, step: 1, valor: 1 }
      ],
      graficos: [
        { id: 'ajuste', titulo: 'Dados e curva ajustada', xlabel: 'x', ylabel: 'y', aspect: 0.46, legendPos: 'topleft' },
        { id: 'res', titulo: 'Resíduos', xlabel: 'x', ylabel: 'y − ŷ', aspect: 0.3, legend: false }
      ],
      saidas: [
        { id: 'eq', label: 'Coeficientes' },
        { id: 'r2', label: 'Coeficiente R²' },
        { id: 'sse', label: 'Soma dos quadrados dos resíduos' },
        { id: 'sxy', label: 'Desvio-padrão dos resíduos' },
        { id: 'npar', label: 'Parâmetros ajustados' },
        { id: 'gl', label: 'Graus de liberdade' }
      ],
      formulas: [
        { g: 'O princípio' },
        { tex: '\\min \\sum_{k=1}^{m}\\left[y_k - P(x_k)\\right]^2', d: 'minimizar a soma dos quadrados dos resíduos', destaque: true },
        { g: 'Equações normais' },
        { tex: '\\left(\\sum x^{i+j}\\right)\\mathbf{a} = \\sum y\\,x^{i}', d: 'um sistema linear (n+1)×(n+1) nos coeficientes' },
        { tex: 'a_1 = \\frac{m\\sum xy - \\sum x\\sum y}{m\\sum x^2 - (\\sum x)^2}', d: 'caso da reta, resolvido explicitamente' },
        { g: 'Qualidade do ajuste' },
        { tex: 'R^2 = 1 - \\frac{\\sum(y_k - \\hat y_k)^2}{\\sum(y_k - \\bar y)^2}', d: 'fração da variação explicada', destaque: true },
        { tex: 's = \\sqrt{\\frac{SQE}{m - n - 1}}', d: 'desvio-padrão dos resíduos, que penaliza parâmetros' }
      ],
      nota: 'R² sempre cresce ao acrescentar um parâmetro, mesmo que o parâmetro não signifique nada. Por isso ele não serve para escolher o grau: use o desvio-padrão dos resíduos, que divide pelos graus de liberdade, ou simplesmente olhe os resíduos — se eles têm padrão, o modelo está errado; se parecem ruído, está bom.',
      calcular: function (p, ctx) {
        /* dados determinísticos: mesma dispersão produz sempre os mesmos pontos */
        var defs = {
          linear: { f: function (x) { return 2 * x + 0.1; }, a: 1, b: 5, m: 5, nome: 'y ≈ 2x' },
          quad: { f: function (x) { return 0.5 * x * x - 2 * x + 3; }, a: 0, b: 6, m: 9, nome: 'y ≈ 0,5x² − 2x + 3' },
          tracao: { f: function (x) { return 210 * x; }, a: 0, b: 0.002, m: 8, nome: 'σ = E·ε' },
          exp: { f: function (x) { return 10 * Math.exp(-0.5 * x); }, a: 0, b: 5, m: 9, nome: 'y ≈ 10e^(−x/2)' }
        };
        var D = defs[p.conj] || defs.linear;
        var m = D.m, xs = [], ys = [], i;
        for (i = 0; i < m; i++) {
          var x = D.a + (D.b - D.a) * i / (m - 1);
          /* perturbação determinística, pseudoaleatória mas reprodutível */
          var r = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
          r = r - Math.floor(r) - 0.5;
          var esc = p.conj === 'tracao' ? 0.42 : 1;
          xs.push(x);
          ys.push(D.f(x) + 2 * r * p.ruido * esc * (p.conj === 'tracao' ? 1 : 1));
        }
        var grau = Math.min(Math.round(p.grau), m - 1);
        var aj = CN.minQuad(xs, ys, grau);

        var g = ctx.plot('ajuste').clear();
        var gx = [], gy = [];
        for (i = 0; i <= 200; i++) {
          var t = D.a + (D.b - D.a) * i / 200;
          gx.push(t); gy.push(aj ? CN.avalia(aj.co, t) : 0);
        }
        g.line(gx, gy, { color: cor(0), width: 2.4, label: 'ajuste de grau ' + grau });
        g.points(xs, ys, { color: cor(1), r: 4.5, label: 'dados' });
        g.draw();

        var gr = ctx.plot('res').clear();
        var res = xs.map(function (xx, k) { return ys[k] - (aj ? CN.avalia(aj.co, xx) : 0); });
        xs.forEach(function (xx, k) {
          gr.line([xx, xx], [0, res[k]], { color: cor(3), width: 2 });
        });
        gr.points(xs, res, { color: cor(3), r: 4 });
        gr.hline(0, { color: cor(5), width: 1.4 });
        gr.draw();

        var gl = m - grau - 1;
        var s = gl > 0 && aj ? Math.sqrt(aj.sse / gl) : null;
        var termos = [];
        if (aj) {
          for (i = aj.co.length - 1; i >= 0; i--) {
            if (Math.abs(aj.co[i]) < 1e-12) continue;
            termos.push(sg(aj.co[i], 4) + (i === 0 ? '' : i === 1 ? 'x' : 'x^' + i));
          }
        }

        ctx.setPassos([
          { t: '① Interpolar ou ajustar',
            obs: 'São problemas diferentes. A interpolação obriga a curva a passar por todos os ' + m
              + ' pontos, o que exigiria grau ' + (m - 1) + '. O ajuste busca a curva de grau ' + grau
              + ' que passa o mais perto possível de todos — e com dado experimental, que tem erro de medição, '
              + 'obrigar a curva a passar pelo erro é um contrassenso.' },
          { t: '② As equações normais',
            tex: '\\frac{\\partial}{\\partial a_j}\\sum_k [y_k - P(x_k)]^2 = 0',
            obs: 'Derivar a soma dos quadrados em relação a cada coeficiente e igualar a zero produz um sistema '
              + 'linear de ' + (grau + 1) + ' equações — as equações normais. Elas se resolvem pela eliminação de '
              + 'Gauss do simulador anterior. Para grau alto esse sistema fica malcondicionado, e aí se usam '
              + 'polinômios ortogonais ou decomposição QR.' },
          { t: '③ A qualidade do ajuste',
            texSub: aj ? 'R^2 = ' + nt(aj.r2, 5) + ' \\qquad SQE = ' + nt(aj.sse, 4)
              + (s !== null ? ' \\qquad s = ' + nt(s, 4) : '') : '',
            obs: aj
              ? 'R² = ' + nt(aj.r2, 5) + ' significa que o modelo explica ' + nt(100 * aj.r2, 4)
                + ' % da variação dos dados. Mas cuidado: R² <strong>sempre</strong> cresce ao acrescentar um '
                + 'parâmetro, mesmo um sem sentido. ' + (gl > 0
                  ? 'O desvio-padrão dos resíduos, ' + nt(s, 4) + ', é o indicador honesto, porque divide por '
                    + gl + ' graus de liberdade.'
                  : 'Com grau ' + grau + ' em ' + m + ' pontos não sobram graus de liberdade: o ajuste virou '
                    + 'interpolação, R² = 1 e o modelo não tem poder preditivo algum.')
              : '' },
          { t: '④ Olhe os resíduos',
            obs: 'O gráfico de resíduos diz mais que o R². Se eles se distribuem sem padrão em torno do zero, o '
              + 'modelo capturou a tendência. Se mostram curvatura sistemática, falta um termo. Se crescem com x, '
              + 'a variância não é constante e os mínimos quadrados simples não são o estimador adequado — '
              + 'seria caso de ponderar.' }
        ]);
        return {
          eq: { v: termos.length ? termos.join(' + ').replace(/\+ -/g, '− ') : '—' },
          r2: { v: aj ? sg(aj.r2, 5) : '—', classe: aj && aj.r2 > 0.99 ? 'ok' : '' },
          sse: { v: aj ? sg(aj.sse, 4) : '—' },
          sxy: { v: s === null ? '—' : sg(s, 4) },
          npar: { v: grau + 1 },
          gl: { v: gl, classe: gl <= 0 ? 'alerta' : '' }
        };
      }
    });
  }

  /* =========================================================================
     5 · Integração e derivação numéricas
     ========================================================================= */
  function montarIntegracao() {
    if (!document.getElementById('sim-integracao')) return;
    Sim.build('#sim-integracao', {
      titulo: '5. Integração e derivação numéricas — a ordem do erro',
      descricao: 'Trapézio, Simpson e quadratura de Gauss aproximam a mesma integral com esforços muito diferentes. O simulador mede a ordem do erro na prática: ao dobrar o número de subintervalos, o erro do trapézio cai 4 vezes e o de Simpson, 16 — exatamente o que a teoria prevê.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exponencial', desc: '∫eˣ de 0 a 1, com valor exato conhecido',
          valores: { fn: 'exp', n: 8, gp: 3, h: 3 } },
        { nome: '2 · Poucos subintervalos', desc: 'Com n = 2 a diferença já aparece',
          valores: { fn: 'exp', n: 2, gp: 2, h: 3 } },
        { nome: '3 · Meia senoide', desc: '∫sen(x) de 0 a π, exato = 2',
          valores: { fn: 'sen', n: 8, gp: 3, h: 3 } },
        { nome: '4 · Polinômio cúbico', desc: 'Simpson é exato: erro de arredondamento apenas',
          valores: { fn: 'pol', n: 4, gp: 2, h: 3 } },
        { nome: '5 · A gaussiana', desc: 'Sem primitiva elementar — só resta o numérico',
          valores: { fn: 'gauss', n: 16, gp: 4, h: 3 } },
        { nome: '6 · A função de Runge', desc: 'Pico estreito: exige muitos subintervalos',
          valores: { fn: 'runge', n: 32, gp: 5, h: 3 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A integral' },
        { id: 'fn', tipo: 'select', label: 'Integrando', valor: 'exp',
          opcoes: CN.integrandos.map(function (f) { return { v: f.id, t: f.nome }; }) },
        { id: 'n', label: 'Subintervalos (trapézio e Simpson)', min: 2, max: 128, step: 2, valor: 8 },
        { id: 'gp', label: 'Pontos da quadratura de Gauss', min: 2, max: 5, step: 1, valor: 3 },
        { tipo: 'titulo', label: 'Derivação numérica' },
        { id: 'h', label: 'Passo h = 10⁻ᵏ, com k =', min: 1, max: 12, step: 1, valor: 3 }
      ],
      graficos: [
        { id: 'func', titulo: 'O integrando e os subintervalos', xlabel: 'x', ylabel: 'f(x)', aspect: 0.4, legend: false },
        { id: 'ordem', titulo: 'Erro contra número de subintervalos (log-log)', xlabel: 'log₁₀ n',
          ylabel: 'log₁₀ |erro|', aspect: 0.4, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'exata', label: 'Valor exato' },
        { id: 'trap', label: 'Trapézio' },
        { id: 'simp', label: 'Simpson' },
        { id: 'gl', label: 'Gauss-Legendre' },
        { id: 'razao', label: 'Razão de erro ao dobrar n' },
        { id: 'deriv', label: 'Erro da derivada central' }
      ],
      formulas: [
        { g: 'Newton-Cotes' },
        { tex: 'I \\approx h\\left[\\frac{f_0}{2} + f_1 + \\dots + f_{n-1} + \\frac{f_n}{2}\\right]', d: 'trapézios repetidos, erro O(h²)', destaque: true },
        { tex: 'I \\approx \\frac{h}{3}\\left[f_0 + 4f_1 + 2f_2 + \\dots + 4f_{n-1} + f_n\\right]', d: 'Simpson 1/3, erro O(h⁴), exige n par', destaque: true },
        { g: 'Erros' },
        { tex: 'E_{trap} = -\\frac{(b-a)h^2}{12}f\'\'(\\xi) \\qquad E_{simp} = -\\frac{(b-a)h^4}{180}f^{(4)}(\\xi)', d: 'Simpson é exato para polinômios até grau 3' },
        { g: 'Quadratura de Gauss' },
        { tex: 'I \\approx \\frac{b-a}{2}\\sum_{i=1}^{n} w_i\\,f\\!\\left(\\frac{b-a}{2}t_i + \\frac{a+b}{2}\\right)', d: 'n pontos integram exatamente até grau 2n−1', destaque: true },
        { g: 'Derivação' },
        { tex: 'f\'(x) \\approx \\frac{f(x+h) - f(x-h)}{2h}', d: 'diferença central, erro O(h²)' },
        { tex: 'E_{total} \\approx \\frac{h^2}{6}|f\'\'\'| + \\frac{2\\epsilon}{h}', d: 'truncamento cai com h, arredondamento cresce: há um h ótimo' }
      ],
      nota: 'A derivação numérica é o oposto da integração: ela amplifica o erro de arredondamento em vez de suavizá-lo. Reduzir h melhora até certo ponto e depois piora — com dupla precisão o ótimo da diferença central fica em torno de h = 10⁻⁵, e abaixo disso a subtração de números quase iguais destrói os dígitos significativos.',
      calcular: function (p, ctx) {
        var I = CN.integrando(p.fn);
        var n = Math.round(p.n); if (n % 2) n++;
        var np = Math.round(p.gp);
        var vt = CN.trapezio(I.f, I.a, I.b, n);
        var vs = CN.simpson(I.f, I.a, I.b, n);
        var vg = CN.gaussLeg(I.f, I.a, I.b, np);
        var et = Math.abs(vt - I.exata), es = Math.abs(vs - I.exata), eg = Math.abs(vg - I.exata);
        var razao = Math.abs(CN.trapezio(I.f, I.a, I.b, n) - I.exata) /
                    Math.max(Math.abs(CN.trapezio(I.f, I.a, I.b, 2 * n) - I.exata), 1e-18);

        var g = ctx.plot('func').clear();
        var gx = [], gy = [], i, x;
        for (i = 0; i <= 300; i++) { x = I.a + (I.b - I.a) * i / 300; gx.push(x); gy.push(I.f(x)); }
        g.area(gx, gy, { color: cor(0), alpha: 0.18 });
        g.line(gx, gy, { color: cor(0), width: 2.4 });
        var mostra = Math.min(n, 32);
        for (i = 0; i <= mostra; i++) {
          x = I.a + (I.b - I.a) * i / mostra;
          g.line([x, x], [0, I.f(x)], { color: cor(5), width: 1 });
        }
        g.hline(0, { color: cor(5), width: 1.2 });
        g.draw();

        var go = ctx.plot('ordem').clear();
        var ns = [], lt = [], ls = [];
        for (i = 2; i <= 256; i *= 2) {
          ns.push(Math.log(i) / Math.LN10);
          lt.push(Math.log(Math.max(Math.abs(CN.trapezio(I.f, I.a, I.b, i) - I.exata), 1e-17)) / Math.LN10);
          ls.push(Math.log(Math.max(Math.abs(CN.simpson(I.f, I.a, I.b, i) - I.exata), 1e-17)) / Math.LN10);
        }
        go.line(ns, lt, { color: cor(0), width: 2.4, label: 'trapézio · inclinação −2' });
        go.line(ns, ls, { color: cor(3), width: 2.4, label: 'Simpson · inclinação −4' });
        go.hline(Math.log(Math.max(eg, 1e-17)) / Math.LN10,
          { color: cor(1), width: 1.6, dash: [5, 4], text: 'Gauss, ' + np + ' pontos' });
        go.draw();

        /* derivação numérica de sen(x) em x = 1 */
        var h = Math.pow(10, -p.h), dexato = Math.cos(1);
        var dpro = (Math.sin(1 + h) - Math.sin(1)) / h;
        var dcen = (Math.sin(1 + h) - Math.sin(1 - h)) / (2 * h);

        ctx.setPassos([
          { t: '① Trapézio: a ideia mais simples',
            tex: 'I \\approx ' + nt(vt, 8),
            obs: 'Substituir a curva por segmentos de reta em cada subintervalo. O erro é O(h²): ao dobrar n, '
              + 'ele cai por 4. A razão medida aqui foi ' + nt(razao, 4) + ' — próxima de 4, como a teoria prevê.' },
          { t: '② Simpson: parábolas em vez de retas',
            tex: 'I \\approx ' + nt(vs, 10),
            texSub: 'E_{trap} = ' + exp2(et) + ' \\qquad E_{simp} = ' + exp2(es),
            obs: 'Com o mesmo número de avaliações da função, Simpson é ' + nt(et / Math.max(es, 1e-18), 3)
              + ' vezes mais preciso. O erro é O(h⁴), então ao dobrar n ele cai por 16. E há um bônus: Simpson é '
              + '<strong>exato</strong> para polinômios até grau 3, embora use parábolas — a simetria cancela o termo cúbico.' },
          { t: '③ Gauss: escolher também onde avaliar',
            tex: 'I \\approx ' + nt(vg, 10) + ' \\quad (' + np + '\\text{ pontos})',
            obs: 'Newton-Cotes fixa os pontos igualmente espaçados e escolhe só os pesos. Gauss escolhe os dois: '
              + 'com ' + np + ' pontos integra exatamente qualquer polinômio até grau ' + (2 * np - 1) + '. '
              + 'Aqui ele usou ' + np + ' avaliações contra ' + (n + 1) + ' de Simpson e obteve erro de '
              + exp2(eg) + '. É o método dos elementos finitos.' },
          { t: '④ Derivar é o problema inverso',
            texSub: 'h = 10^{-' + p.h + '}: \\quad E_{progressiva} = ' + exp2(Math.abs(dpro - dexato))
              + ' \\quad E_{central} = ' + exp2(Math.abs(dcen - dexato)),
            obs: 'Integrar soma e suaviza o erro; derivar subtrai números quase iguais e o amplifica. Reduzir h '
              + 'diminui o erro de truncamento mas aumenta o de arredondamento, e existe um h ótimo: para a diferença '
              + 'central em dupla precisão ele fica em torno de 10⁻⁵. '
              + (p.h >= 7
                ? 'Com h = 10⁻' + p.h + ' já se está do lado ruim: a subtração destruiu os dígitos significativos.'
                : 'Continue reduzindo h e veja o erro voltar a crescer a partir de 10⁻⁶.') }
        ]);
        return {
          exata: { v: fix(I.exata, 10) },
          trap: { v: fix(vt, 10), u: '', classe: '' },
          simp: { v: fix(vs, 10), classe: 'ok' },
          gl: { v: fix(vg, 10), classe: eg < es ? 'ok' : '' },
          razao: { v: sg(razao, 4), classe: Math.abs(razao - 4) < 0.5 ? 'ok' : '' },
          deriv: { v: sg(Math.abs(dcen - dexato), 3), classe: p.h >= 7 ? 'alerta' : 'ok' }
        };
      }
    });
  }

  function iniciar() {
    montarRaizes();
    montarSistemas();
    montarInterpolacao();
    montarMinimos();
    montarIntegracao();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

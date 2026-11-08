/* ============================================================
   Simuladores de Probabilidade e Estatística
   1 · Modelos discretos: binomial, Poisson e geométrica
   2 · Distribuição normal: áreas e padronização
   3 · Teorema central do limite (animado)
   4 · Cobertura do intervalo de confiança (animado)
   5 · Carta de controle e capacidade do processo (animado)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- funções de distribuição ---------- */
  var PE = {};
  PE.lnGama = function (x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015, j;
    t -= (x + 0.5) * Math.log(t);
    for (j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  };
  /* gama incompleta regularizada P(a, x) */
  PE.gamaP = function (a, x) {
    if (x <= 0) return 0;
    var g = PE.lnGama(a), s, d, n;
    if (x < a + 1) {
      s = 1 / a; d = s;
      for (n = 1; n < 400; n++) { d *= x / (a + n); s += d; if (Math.abs(d) < Math.abs(s) * 1e-14) break; }
      return s * Math.exp(-x + a * Math.log(x) - g);
    }
    var b = x + 1 - a, c = 1e300, f = 1 / b, h = f, i;
    for (i = 1; i < 400; i++) {
      var an = -i * (i - a); b += 2;
      f = an * f + b; if (Math.abs(f) < 1e-300) f = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      f = 1 / f; d = f * c; h *= d;
      if (Math.abs(d - 1) < 1e-14) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - g) * h;
  };
  /* beta incompleta regularizada */
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap, m, h;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    d = 1 / d; h = d;
    for (m = 1; m < 500; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      var de = d * c; h *= de;
      if (Math.abs(de - 1) < 1e-14) break;
    }
    return h;
  }
  PE.betaI = function (a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(PE.lnGama(a + b) - PE.lnGama(a) - PE.lnGama(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  };
  PE.phi = function (z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); };
  PE.Phi = function (z) { var p = 0.5 * (1 + (z >= 0 ? 1 : -1) * PE.gamaP(0.5, z * z / 2)); return z === 0 ? 0.5 : p; };
  PE.T = function (t, v) { var x = v / (v + t * t), i = 0.5 * PE.betaI(v / 2, 0.5, x); return t >= 0 ? 1 - i : i; };
  PE.Chi = function (x, v) { return PE.gamaP(v / 2, x / 2); };
  PE.inv = function (F, p, lo, hi) {
    var i;
    for (i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (F(m) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  PE.zq = function (p) { return PE.inv(PE.Phi, p, -9, 9); };
  PE.tq = function (p, v) { return PE.inv(function (t) { return PE.T(t, v); }, p, -1000, 1000); };
  PE.chiq = function (p, v) { return PE.inv(function (x) { return PE.Chi(x, v); }, p, 0, 2000); };
  PE.lnC = function (n, k) { return PE.lnGama(n + 1) - PE.lnGama(k + 1) - PE.lnGama(n - k + 1); };
  PE.binom = function (k, n, p) {
    if (p <= 0) return k === 0 ? 1 : 0;
    if (p >= 1) return k === n ? 1 : 0;
    return Math.exp(PE.lnC(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  };
  PE.poisson = function (k, l) { return Math.exp(-l + k * Math.log(l) - PE.lnGama(k + 1)); };
  PE.rng = function (s) {
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  PE.gauss = function (r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); };
  global.PE = PE;

  var Sim = global.Sim, Plot = global.Plot;
  if (!Sim) return;
  var cor = function (i) { return Plot.serie(i); };
  var nt = function (v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 4 : n }); };

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

  /* 1 — modelos discretos */
  function montarDiscretas() {
    if (!document.getElementById('sim-discretas')) return;
    Sim.build('#sim-discretas', {
      titulo: '1. Modelos discretos — binomial, Poisson e geométrica',
      descricao: 'Escolha o modelo e marque um valor de k. Na binomial com n grande e p pequeno, ligue a comparação e veja a Poisson coincidir.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Lote com 5 % de defeitos', desc: 'n = 10 e p = 0,05', valores: { mod: 'bin', n: 10, p: 0.05, k: 1, lam: 2, comp: false } },
        { nome: '2 · Aproximação de Poisson', desc: 'n = 100 e p = 0,02', valores: { mod: 'bin', n: 100, p: 0.02, k: 2, lam: 2, comp: true } },
        { nome: '3 · Falhas por ano', desc: 'λ = 0,5', valores: { mod: 'poi', n: 10, p: 0.05, k: 0, lam: 0.5, comp: false } },
        { nome: '4 · Primeira falha', desc: 'p = 0,2', valores: { mod: 'geo', n: 10, p: 0.2, k: 3, lam: 2, comp: false } }
      ],
      controles: [
        { id: 'mod', tipo: 'seg', label: 'Modelo', valor: 'bin', opcoes: [{ v: 'bin', t: 'Binomial' }, { v: 'poi', t: 'Poisson' }, { v: 'geo', t: 'Geométrica' }] },
        { id: 'n', label: 'Número de ensaios n', min: 1, max: 100, step: 1, valor: 10 },
        { id: 'p', label: 'Probabilidade p', min: 0.01, max: 0.99, step: 0.01, valor: 0.05 },
        { id: 'lam', label: 'Taxa λ', min: 0.1, max: 30, step: 0.1, valor: 2 },
        { id: 'k', label: 'Valor marcado k', min: 0, max: 60, step: 1, valor: 1 },
        { id: 'comp', tipo: 'check', label: 'Comparar binomial com Poisson', valor: false }
      ],
      graficos: [{ id: 'd', titulo: 'Função de probabilidade', xlabel: 'k', ylabel: 'P(X = k)', aspect: 0.5, legendPos: 'topright' }],
      saidas: [{ id: 'pk', label: 'P(X = k)' }, { id: 'ac', label: 'P(X ≤ k)' }, { id: 'mai', label: 'P(X > k)' }, { id: 'E', label: 'Média' }, { id: 'V', label: 'Variância' }],
      formulas: [
        { tex: 'P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}', d: 'binomial: E = np, Var = np(1−p)', destaque: true },
        { tex: 'P(X=k) = \\frac{e^{-\\lambda}\\lambda^k}{k!}', d: 'Poisson: E = Var = λ' },
        { tex: 'P(X=k) = (1-p)^{k-1}p', d: 'geométrica: k ≥ 1, E = 1/p' }
      ],
      nota: 'A aproximação de Poisson à binomial é boa com n ≥ 20 e p ≤ 0,05, tomando λ = np.',
      calcular: function (p, ctx) {
        var f, E, V, kmax, kmin = 0;
        if (p.mod === 'bin') { f = function (k) { return k > p.n ? 0 : PE.binom(k, p.n, p.p); }; E = p.n * p.p; V = E * (1 - p.p); kmax = p.n; }
        else if (p.mod === 'poi') { f = function (k) { return k === 0 ? Math.exp(-p.lam) : PE.poisson(k, p.lam); }; E = V = p.lam; kmax = Math.ceil(p.lam + 6 * Math.sqrt(p.lam) + 4); }
        else { f = function (k) { return k < 1 ? 0 : Math.pow(1 - p.p, k - 1) * p.p; }; E = 1 / p.p; V = (1 - p.p) / (p.p * p.p); kmin = 1; kmax = Math.min(60, Math.ceil(E + 5 * Math.sqrt(V) + 3)); }
        var fim = Math.min(kmax, Math.max(12, Math.ceil(E + 5 * Math.sqrt(V) + 2)));
        var xs = [], ys = [], i;
        for (i = kmin; i <= fim; i++) { xs.push(i); ys.push(f(i)); }
        var k = Math.round(p.k), g = ctx.plot('d').clear();
        g.bars(xs, ys, { color: cor(0), width: 0.7, alpha: 0.75, label: 'modelo' });
        if (k >= kmin && k <= fim) g.bars(xs, ys.map(function (y, q) { return xs[q] === k ? y : 0; }), { color: cor(3), width: 0.7, alpha: 1 });
        if (p.comp && p.mod === 'bin') g.points(xs, xs.map(function (x) { return x === 0 ? Math.exp(-E) : PE.poisson(x, E); }), { color: cor(1), size: 4, label: 'Poisson' });
        g.draw();
        var ac = 0; for (i = kmin; i <= k; i++) ac += f(i);
        ac = Math.min(1, ac);
        ctx.setPassos([
          { t: '① O modelo', obs: 'Média ' + nt(E, 3) + ' e variância ' + nt(V, 3) + '.' },
          { t: '② A probabilidade marcada', obs: 'P(X = ' + k + ') = ' + nt(f(k), 5) + '. O complemento P(X > ' + k + ') = ' + nt(1 - ac, 5) + ' costuma ser a pergunta de controle de qualidade.' }
        ]);
        return { pk: { v: f(k), classe: 'ok' }, ac: { v: ac }, mai: { v: 1 - ac }, E: { v: E }, V: { v: V } };
      }
    });
  }

  /* 2 — normal */
  function montarNormal() {
    if (!document.getElementById('sim-normal')) return;
    Sim.build('#sim-normal', {
      titulo: '2. Distribuição normal — áreas e padronização',
      descricao: 'A probabilidade é a área sob a curva. O escore z conta quantos desvios-padrão o valor está afastado da média.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Regra dos dois sigmas', desc: 'μ = 500, σ = 20, de 460 a 540', valores: { mu: 500, s: 20, a: 460, b: 540 } },
        { nome: '2 · Regra de um sigma', desc: 'de 480 a 520', valores: { mu: 500, s: 20, a: 480, b: 520 } },
        { nome: '3 · Três sigmas', desc: 'de 440 a 560', valores: { mu: 500, s: 20, a: 440, b: 560 } },
        { nome: '4 · Cauda superior', desc: 'acima de 533', valores: { mu: 500, s: 20, a: 533, b: 620 } }
      ],
      controles: [
        { id: 'mu', label: 'Média μ', min: 0, max: 1000, step: 1, valor: 500 },
        { id: 's', label: 'Desvio-padrão σ', min: 1, max: 100, step: 0.5, valor: 20 },
        { id: 'a', label: 'Limite inferior a', min: 0, max: 1200, step: 1, valor: 460 },
        { id: 'b', label: 'Limite superior b', min: 0, max: 1200, step: 1, valor: 540 }
      ],
      graficos: [{ id: 'n', titulo: 'Densidade de probabilidade', xlabel: 'x', ylabel: 'f(x)', aspect: 0.5, legend: false }],
      saidas: [{ id: 'za', label: 'z de a' }, { id: 'zb', label: 'z de b' }, { id: 'P', label: 'P(a < X < b)' }, { id: 'ca', label: 'P(X < a)' }, { id: 'cb', label: 'P(X > b)' }],
      formulas: [
        { tex: 'Z = \\frac{X - \\mu}{\\sigma}', d: 'padronização', destaque: true },
        { tex: 'P(a<X<b) = \\Phi(z_b) - \\Phi(z_a)', d: 'diferença de duas áreas acumuladas' }
      ],
      calcular: function (p, ctx) {
        var a = Math.min(p.a, p.b), b = Math.max(p.a, p.b), x0 = p.mu - 4.2 * p.s, x1 = p.mu + 4.2 * p.s, xs = Plot.linspace(x0, x1, 400);
        var f = function (x) { return PE.phi((x - p.mu) / p.s) / p.s; };
        var ai = Math.max(a, x0), bi = Math.min(b, x1), g = ctx.plot('n').clear();
        if (bi > ai) { var xx = Plot.linspace(ai, bi, 200); g.area(xx, xx.map(f), { base: 0, alpha: 0.35, color: cor(0) }); }
        g.line(xs, xs.map(f), { color: cor(0), width: 2.4 });
        g.vline(p.mu, { color: cor(5), width: 1, dash: [4, 4], text: 'μ' });
        g.setLimits([x0, x1], null);
        g.draw();
        var za = (a - p.mu) / p.s, zb = (b - p.mu) / p.s, Pab = PE.Phi(zb) - PE.Phi(za);
        ctx.setPassos([
          { t: '① Padronize', obs: 'z = (x − μ)/σ dá z = ' + nt(za, 3) + ' e z = ' + nt(zb, 3) + '.' },
          { t: '② Subtraia as áreas', obs: 'Φ(' + nt(zb, 3) + ') − Φ(' + nt(za, 3) + ') = ' + nt(Pab, 5) + '.' }
        ]);
        return { za: { v: za }, zb: { v: zb }, P: { v: Pab, classe: 'ok' }, ca: { v: PE.Phi(za) }, cb: { v: 1 - PE.Phi(zb) } };
      }
    });
  }

  /* 3 — TCL */
  var POP = {
    unif: { t: 'Uniforme em [0, 1]', m: 0.5, s: Math.sqrt(1 / 12), g: function (r) { return r(); }, f: function (x) { return x >= 0 && x <= 1 ? 1 : 0; }, a: 0, b: 1 },
    expo: { t: 'Exponencial (λ = 1)', m: 1, s: 1, g: function (r) { return -Math.log(1 - r()); }, f: function (x) { return x >= 0 ? Math.exp(-x) : 0; }, a: 0, b: 5 },
    bimo: { t: 'Bimodal', m: 0.5, s: Math.sqrt(0.25 + 0.0064), g: function (r) { return (r() < 0.5 ? 0 : 1) + 0.08 * PE.gauss(r); }, f: function (x) { return 0.5 * (PE.phi(x / 0.08) + PE.phi((x - 1) / 0.08)) / 0.08; }, a: -0.3, b: 1.3 }
  };
  function montarTcl() {
    if (!document.getElementById('sim-tcl')) return;
    var A = animador(function (a) { desenha(a); }, 90);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var m = Math.min(d.med.length, Math.round((a.k + 1) * d.med.length / a.n));
      var cont = new Array(d.nb).fill(0), i, lg = (d.b - d.a) / d.nb;
      for (i = 0; i < m; i++) { var j = Math.floor((d.med[i] - d.a) / lg); if (j >= 0 && j < d.nb) cont[j]++; }
      var g = a.ctx.plot('h').clear(), xs = cont.map(function (_, q) { return d.a + (q + 0.5) * lg; });
      g.bars(xs, cont.map(function (c) { return c / (m * lg); }), { color: cor(0), width: 0.92, alpha: 0.65, label: 'médias (' + m + ')' });
      var x2 = Plot.linspace(d.a, d.b, 200);
      g.line(x2, x2.map(function (x) { return PE.phi((x - d.mu) / d.se) / d.se; }), { color: cor(3), width: 2.4, label: 'normal do TCL' });
      g.setLimits([d.a, d.b], [0, d.ymax]);
      g.draw();
    }
    Sim.build('#sim-tcl', {
      titulo: '3. Teorema central do limite',
      descricao: 'Sorteiam-se muitas amostras da população e calcula-se a média de cada uma. Com qualquer população, o histograma das médias caminha para a normal à medida que n cresce.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exponencial, n = 2', desc: 'Ainda bem assimétrica', valores: { pop: 'expo', n: 2 } },
        { nome: '2 · Exponencial, n = 30', desc: 'Quase normal', valores: { pop: 'expo', n: 30 } },
        { nome: '3 · Bimodal, n = 10', desc: 'As duas corcovas somem', valores: { pop: 'bimo', n: 10 } },
        { nome: '4 · Uniforme, n = 5', desc: 'Converge rapidamente', valores: { pop: 'unif', n: 5 } }
      ],
      controles: [
        { id: 'pop', tipo: 'select', label: 'População', valor: 'expo', opcoes: Object.keys(POP).map(function (k) { return { v: k, t: POP[k].t }; }) },
        { id: 'n', label: 'Tamanho da amostra n', min: 1, max: 50, step: 1, valor: 2 },
        { id: 'animar', tipo: 'check', label: 'Animar o sorteio', valor: true }
      ],
      graficos: [
        { id: 'h', titulo: 'Distribuição das médias amostrais', xlabel: 'média amostral', ylabel: 'densidade', aspect: 0.48, legendPos: 'topright' },
        { id: 'p', titulo: 'A população', xlabel: 'x', ylabel: 'f(x)', aspect: 0.24, legend: false }
      ],
      saidas: [{ id: 'mu', label: 'Média teórica' }, { id: 'se', label: 'σ/√n teórico' }, { id: 'ob', label: 'Média observada' }, { id: 'dp', label: 'Desvio observado' }, { id: 'as', label: 'Assimetria das médias' }],
      formulas: [{ tex: '\\bar{X} \\approx N\\!\\left(\\mu,\\ \\frac{\\sigma^2}{n}\\right)', d: 'válido para n grande, qualquer que seja a população', destaque: true }],
      nota: 'Mil e quinhentas amostras sorteadas. A assimetria tende a zero com n.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var P = POP[p.pop], n = Math.round(p.n), r = PE.rng(12345 + n * 7), med = [], i, j, S = 1500;
        for (i = 0; i < S; i++) { var s = 0; for (j = 0; j < n; j++) s += P.g(r); med.push(s / n); }
        var se = P.s / Math.sqrt(n), a = Math.min(P.a, P.m - 4.2 * se), b = Math.max(P.m + 4.2 * se, P.m + 0.3);
        if (p.pop === 'expo') { a = 0; b = Math.min(5, P.m + 4.6 * se + (n < 4 ? 1 : 0)); } else { a = P.m - 4.2 * se; b = P.m + 4.2 * se; }
        if (p.pop === 'bimo' && n === 1) { a = -0.3; b = 1.3; }
        var nb = 36;
        A.dados = { med: med, a: a, b: b, nb: nb, mu: P.m, se: se, ymax: Math.max(PE.phi(0) / se * 1.5, 1.2) };
        A.n = 60; A.k = A.on ? A.k % A.n : A.n - 1;
        desenha(A);
        var q = ctx.plot('p').clear(), xs = Plot.linspace(P.a, P.b, 300);
        q.area(xs, xs.map(P.f), { base: 0, alpha: 0.3, color: cor(1) });
        q.line(xs, xs.map(P.f), { color: cor(1), width: 2 });
        q.draw();
        var mo = med.reduce(function (x, y) { return x + y; }, 0) / S, m2 = 0, m3 = 0;
        med.forEach(function (v) { var d = v - mo; m2 += d * d; m3 += d * d * d; });
        m2 /= S; m3 /= S;
        ctx.setPassos([{ t: '① A média das médias', obs: 'A média continua igual à da população, e a dispersão cai com a raiz de n.' }, { t: '② A forma', obs: 'Assimetria observada de ' + nt(m3 / Math.pow(m2, 1.5), 2) + '. Quanto mais perto de zero, mais parecida com a normal.' }]);
        return { mu: { v: P.m }, se: { v: se }, ob: { v: mo }, dp: { v: Math.sqrt(m2) }, as: { v: m3 / Math.pow(m2, 1.5) } };
      }
    });
  }

  /* 4 — intervalos de confiança */
  function montarIc() {
    if (!document.getElementById('sim-ic')) return;
    var A = animador(function (a) { desenha(a); }, 60);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var g = a.ctx.plot('i').clear(), m = Math.min(d.iv.length, a.k + 1), i;
      for (i = 0; i < m; i++) {
        var v = d.iv[i];
        g.line([i + 1, i + 1], [v.a, v.b], { color: v.ok ? cor(0) : cor(3), width: v.ok ? 1.4 : 2.6 });
      }
      g.hline(d.mu, { color: cor(1), width: 1.8, text: 'μ' });
      g.setLimits([0, 101], [d.mu - d.y, d.mu + d.y]);
      g.draw();
    }
    Sim.build('#sim-ic', {
      titulo: '4. O que significa 95 % de confiança',
      descricao: 'Cem amostras, cem intervalos diferentes. A média verdadeira é fixa, e são os intervalos que variam; os vermelhos não contêm μ.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · σ conhecido', desc: 'n = 25, 95 %', valores: { n: 25, conf: 95, tipo: 'z' } },
        { nome: '2 · Amostra pequena com z', desc: 'Usar z com s e n = 5 cobre menos', valores: { n: 5, conf: 95, tipo: 'sz' } },
        { nome: '3 · Amostra pequena com t', desc: 't corrige a cobertura', valores: { n: 5, conf: 95, tipo: 't' } },
        { nome: '4 · 99 %', desc: 'Mais largo', valores: { n: 25, conf: 99, tipo: 'z' } }
      ],
      controles: [
        { id: 'n', label: 'Tamanho da amostra n', min: 3, max: 100, step: 1, valor: 25 },
        { id: 'conf', label: 'Confiança', min: 50, max: 99.5, step: 0.5, valor: 95, unidade: '%' },
        { id: 'tipo', tipo: 'seg', label: 'Fórmula', valor: 'z', opcoes: [{ v: 'z', t: 'z, σ conhecido' }, { v: 't', t: 't, com s' }, { v: 'sz', t: 'z, com s (erro)' }] },
        { id: 'semente', label: 'Sorteio', min: 1, max: 50, step: 1, valor: 7 },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [{ id: 'i', titulo: 'Cem intervalos de confiança', xlabel: 'amostra', ylabel: 'x', aspect: 0.5, legend: false }],
      saidas: [{ id: 'crit', label: 'Valor crítico' }, { id: 'larg', label: 'Semilargura média' }, { id: 'cob', label: 'Contêm μ' }, { id: 'esp', label: 'Cobertura nominal' }],
      formulas: [
        { tex: '\\bar{x} \\pm z_{\\alpha/2}\\,\\frac{\\sigma}{\\sqrt{n}}', d: 'σ conhecido', destaque: true },
        { tex: '\\bar{x} \\pm t_{\\alpha/2,\\,n-1}\\,\\frac{s}{\\sqrt{n}}', d: 'σ desconhecido, população normal' }
      ],
      nota: 'População normal com μ = 50 e σ = 10.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var mu = 50, s0 = 10, n = Math.round(p.n), al = 1 - p.conf / 100, r = PE.rng(p.semente * 991 + n), iv = [], i, j, cob = 0, soma = 0;
        var z = PE.zq(1 - al / 2), t = PE.tq(1 - al / 2, n - 1), crit = p.tipo === 't' ? t : z;
        for (i = 0; i < 100; i++) {
          var x = [], m = 0, q = 0;
          for (j = 0; j < n; j++) { x.push(mu + s0 * PE.gauss(r)); m += x[j]; }
          m /= n;
          for (j = 0; j < n; j++) q += (x[j] - m) * (x[j] - m);
          var dp = p.tipo === 'z' ? s0 : Math.sqrt(q / (n - 1)), e = crit * dp / Math.sqrt(n), ok = m - e <= mu && mu <= m + e;
          iv.push({ a: m - e, b: m + e, ok: ok }); if (ok) cob++; soma += e;
        }
        var ymax = 0; iv.forEach(function (v) { ymax = Math.max(ymax, Math.abs(v.a - mu), Math.abs(v.b - mu)); });
        A.dados = { iv: iv, mu: mu, y: ymax * 1.08 };
        A.n = 100; A.k = A.on ? A.k % A.n : 99;
        desenha(A);
        ctx.setPassos([{ t: '① A interpretação', obs: 'Dos 100 intervalos, ' + cob + ' contêm μ. A confiança descreve o método, e não um intervalo em particular.' }]);
        return { crit: { v: crit }, larg: { v: soma / 100 }, cob: { v: cob + ' de 100', classe: Math.abs(cob - p.conf) < 6 ? 'ok' : 'alerta' }, esp: { v: p.conf, u: '%' } };
      }
    });
  }

  /* 5 — carta de controle */
  var CTE = { 2: [1.128, 0, 3.267, 1.880], 3: [1.693, 0, 2.574, 1.023], 4: [2.059, 0, 2.282, 0.729], 5: [2.326, 0, 2.114, 0.577], 6: [2.534, 0, 2.004, 0.483], 7: [2.704, 0.076, 1.924, 0.419], 8: [2.847, 0.136, 1.864, 0.373], 9: [2.970, 0.184, 1.816, 0.337], 10: [3.078, 0.223, 1.777, 0.308] };
  function montarCarta() {
    if (!document.getElementById('sim-carta')) return;
    var A = animador(function (a) { desenha(a); }, 150);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var m = Math.min(d.X.length, a.k + 1), xs = [], i;
      for (i = 0; i < d.X.length; i++) xs.push(i + 1);
      var g = a.ctx.plot('x').clear(), y = d.X.slice(0, m), pts = xs.slice(0, m);
      g.setLimits([0, d.X.length + 1], [d.lmin, d.lmax]);
      g.hline(d.LSC, { color: cor(3), width: 1.4, dash: [6, 4], text: 'LSC' }); g.hline(d.LIC, { color: cor(3), width: 1.4, dash: [6, 4], text: 'LIC' }); g.hline(d.LC, { color: cor(1), width: 1.2 });
      g.line(pts, y, { color: cor(0), width: 1.6 });
      g.points(pts, y, { color: cor(0), size: 3 });
      var fx = [], fy = []; for (i = 0; i < m; i++) if (d.X[i] > d.LSC || d.X[i] < d.LIC) { fx.push(i + 1); fy.push(d.X[i]); }
      if (fx.length) g.points(fx, fy, { color: cor(3), size: 6 });
      g.draw();
      var r = a.ctx.plot('r').clear();
      r.setLimits([0, d.X.length + 1], [0, Math.max(d.LSCr * 1.25, Math.max.apply(null, d.R) * 1.1)]);
      r.hline(d.LSCr, { color: cor(3), width: 1.4, dash: [6, 4], text: 'LSC' }); r.hline(d.Rm, { color: cor(1), width: 1.2 });
      r.line(pts, d.R.slice(0, m), { color: cor(2), width: 1.6 });
      r.draw();
    }
    Sim.build('#sim-carta', {
      titulo: '5. Carta X̄-R e capacidade do processo',
      descricao: 'Subgrupos de peças são medidos ao longo do tempo. Provoque um desvio da média na amostra 15 e veja quanto a carta demora a acusar. Os índices Cp e Cpk comparam o processo com a especificação.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Processo sob controle', desc: 'Sem desvio', valores: { n: 5, s: 0.5, d: 0, LIE: 48, LSE: 52, m0: 50, sem: 9 } },
        { nome: '2 · Desvio de 0,5σ', desc: 'O alarme demora dezenas de subgrupos', valores: { n: 5, s: 0.5, d: 0.5, LIE: 48, LSE: 52, m0: 50, sem: 9 } },
        { nome: '3 · Desvio de 1,5σ', desc: 'O alarme é quase imediato', valores: { n: 5, s: 0.5, d: 1.5, LIE: 48, LSE: 52, m0: 50, sem: 9 } },
        { nome: '4 · Processo descentrado', desc: 'Cp bom e Cpk ruim', valores: { n: 5, s: 0.5, d: 0, LIE: 48, LSE: 52, m0: 50.8, sem: 9 } }
      ],
      controles: [
        { id: 'n', label: 'Tamanho do subgrupo', min: 2, max: 10, step: 1, valor: 5 },
        { id: 'm0', label: 'Média do processo', min: 45, max: 55, step: 0.05, valor: 50 },
        { id: 's', label: 'Desvio-padrão', min: 0.1, max: 2, step: 0.01, valor: 0.5 },
        { id: 'd', label: 'Desvio aplicado na amostra 15', min: 0, max: 4, step: 0.1, valor: 1.5, unidade: 'σ' },
        { id: 'LIE', label: 'Limite inferior da especificação', min: 44, max: 50, step: 0.1, valor: 48 },
        { id: 'LSE', label: 'Limite superior da especificação', min: 50, max: 56, step: 0.1, valor: 52 },
        { id: 'sem', label: 'Sorteio', min: 1, max: 30, step: 1, valor: 9 },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'x', titulo: 'Carta da média X̄', xlabel: 'subgrupo', ylabel: 'X̄', aspect: 0.4, legend: false },
        { id: 'r', titulo: 'Carta da amplitude R', xlabel: 'subgrupo', ylabel: 'R', aspect: 0.26, legend: false }
      ],
      saidas: [{ id: 'cp', label: 'Cp' }, { id: 'cpk', label: 'Cpk' }, { id: 'ppm', label: 'Fora da especificação' }, { id: 'al', label: 'Primeiro alarme' }, { id: 'arl', label: 'ARL depois do desvio' }],
      formulas: [
        { tex: 'LSC_{\\bar{X}} = \\bar{\\bar{X}} + A_2\\bar{R}, \\quad LIC_{\\bar{X}} = \\bar{\\bar{X}} - A_2\\bar{R}', d: 'limites da carta X̄', destaque: true },
        { tex: 'C_p = \\frac{LSE - LIE}{6\\sigma}, \\quad C_{pk} = \\min\\!\\left(\\frac{LSE - \\mu}{3\\sigma}, \\frac{\\mu - LIE}{3\\sigma}\\right)', d: 'capacidade: alvo usual ≥ 1,33' }
      ],
      nota: 'Limites calculados com os 14 primeiros subgrupos, supostos sob controle. Os limites de controle vêm do processo; os de especificação, do projeto.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var n = Math.round(p.n), C = CTE[n], r = PE.rng(p.sem * 313 + n), T = 30, X = [], R = [], i, j;
        for (i = 0; i < T; i++) {
          var mu = p.m0 + (i >= 14 ? p.d * p.s : 0), s = 0, mn = 1e9, mx = -1e9;
          for (j = 0; j < n; j++) { var v = mu + p.s * PE.gauss(r); s += v; mn = Math.min(mn, v); mx = Math.max(mx, v); }
          X.push(s / n); R.push(mx - mn);
        }
        var LC = 0, Rm = 0; for (i = 0; i < 14; i++) { LC += X[i]; Rm += R[i]; }
        LC /= 14; Rm /= 14;
        var LSC = LC + C[3] * Rm, LIC = LC - C[3] * Rm, LSCr = C[2] * Rm, al = 0;
        for (i = 14; i < T && !al; i++) if (X[i] > LSC || X[i] < LIC) al = i + 1;
        var mx2 = Math.max.apply(null, X.concat([LSC])), mn2 = Math.min.apply(null, X.concat([LIC])), mg = (mx2 - mn2) * 0.15;
        A.dados = { X: X, R: R, LC: LC, LSC: LSC, LIC: LIC, LSCr: LSCr, Rm: Rm, lmin: mn2 - mg, lmax: mx2 + mg };
        A.n = T; A.k = A.on ? A.k % A.n : T - 1;
        desenha(A);
        var Cp = (p.LSE - p.LIE) / (6 * p.s), Cpk = Math.min(p.LSE - p.m0, p.m0 - p.LIE) / (3 * p.s);
        var ppm = (1 - PE.Phi((p.LSE - p.m0) / p.s) + PE.Phi((p.LIE - p.m0) / p.s)) * 1e6;
        var rn = Math.sqrt(n), pa = 1 - PE.Phi(3 - p.d * rn) + PE.Phi(-3 - p.d * rn), arl = 1 / pa;
        ctx.setPassos([
          { t: '① Controle', obs: 'Os limites de controle descrevem o que o processo faz. Um ponto fora deles indica causa especial.' },
          { t: '② Capacidade', obs: 'Cp = ' + nt(Cp, 2) + ' compara larguras, e Cpk = ' + nt(Cpk, 2) + ' considera também a centragem.' }
        ]);
        return {
          cp: { v: Cp, classe: Cp >= 1.33 ? 'ok' : 'alerta' }, cpk: { v: Cpk, classe: Cpk >= 1.33 ? 'ok' : 'alerta' }, ppm: { v: ppm < 1 ? '< 1' : Math.round(ppm), u: 'ppm' },
          al: { v: al ? 'subgrupo ' + al : p.d > 0 ? 'não houve' : '—', classe: al ? 'ok' : '' }, arl: { v: arl }
        };
      }
    });
  }

  function iniciar() { montarDiscretas(); montarNormal(); montarTcl(); montarIc(); montarCarta(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

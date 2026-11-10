/* ============================================================
   Simuladores de Ciência do Ambiente
   1 · Autodepuração de um rio (Streeter-Phelps) — animado
   2 · Dispersão de pluma de chaminé (modelo gaussiano) — animado
   3 · Aterro sanitário e geração de metano — animado
   ============================================================ */
(function (global) {
  'use strict';
  var CA = {};

  /* ---------- água ---------- */
  /* OD de saturação em água doce ao nível do mar, mg/L (equação de Benson e Krause, adotada pela APHA) */
  CA.Cs = function (T) { var K = T + 273.15; return Math.exp(-139.34411 + 1.575701e5 / K - 6.642308e7 / (K * K) + 1.2438e10 / (K * K * K) - 8.621949e11 / (K * K * K * K)); };
  CA.mistura = function (Q1, C1, Q2, C2) { return (Q1 * C1 + Q2 * C2) / (Q1 + Q2); };
  CA.dboT = function (L0, k, t) { return L0 * (1 - Math.exp(-k * t)); };                                    /* DBO exercida até t */
  CA.L0de5 = function (dbo5, k20) { return dbo5 / (1 - Math.exp(-5 * k20)); };
  CA.K2 = function (v, H) { return 3.73 * Math.sqrt(v) / Math.pow(H, 1.5); };                              /* O'Connor-Dobbins, 1/d a 20 °C */
  /* Streeter-Phelps: déficit D(t), em mg/L, com t em dias */
  CA.deficit = function (L0, D0, k1, k2, t) {
    if (Math.abs(k2 - k1) < 1e-9) return (k1 * L0 * t + D0) * Math.exp(-k1 * t);
    return k1 * L0 / (k2 - k1) * (Math.exp(-k1 * t) - Math.exp(-k2 * t)) + D0 * Math.exp(-k2 * t);
  };
  CA.tCritico = function (L0, D0, k1, k2) {
    var arg = (k2 / k1) * (1 - D0 * (k2 - k1) / (k1 * L0));
    if (Math.abs(k2 - k1) < 1e-9) return Math.max(0, (1 / k1) * (1 - D0 / L0));
    return arg <= 0 ? 0 : Math.max(0, Math.log(arg) / (k2 - k1));
  };
  CA.rio = function (o) {
    var Q = o.Qr + o.Qe, dboE = o.dboE * (1 - o.eta), L5 = CA.mistura(o.Qr, o.dboR, o.Qe, dboE), od0 = CA.mistura(o.Qr, o.odR, o.Qe, o.odE);
    var k1 = o.k1 * Math.pow(1.047, o.T - 20), k2 = CA.K2(o.v, o.H) * Math.pow(1.024, o.T - 20), L0 = CA.L0de5(L5, o.k1), cs = CA.Cs(o.T), D0 = Math.max(0, cs - od0);
    var tc = CA.tCritico(L0, D0, k1, k2), Dc = CA.deficit(L0, D0, k1, k2, tc), km = function (t) { return o.v * 86400 * t / 1000; };
    return { L5: L5, od0: od0, k1: k1, k2: k2, L0: L0, cs: cs, D0: D0, tc: tc, xc: km(tc), odMin: cs - Dc, km: km, Q: Q,
      od: function (t) { return cs - CA.deficit(L0, D0, k1, k2, t); }, dbo5: function (t) { return L5 * Math.exp(-k1 * t); } };
  };
  CA.CLASSES = { 1: { od: 6, dbo: 3 }, 2: { od: 5, dbo: 5 }, 3: { od: 4, dbo: 10 }, 4: { od: 2, dbo: Infinity } };
  /* menor eficiência de tratamento que mantém o OD mínimo acima do padrão da classe */
  CA.etaMin = function (o, odPad) {
    var f = function (eta) { var c = Object.assign({}, o, { eta: eta }); return CA.rio(c).odMin - odPad; };
    if (f(0) >= 0) return 0; if (f(0.999) < 0) return NaN;
    var a = 0, b = 0.999, i; for (i = 0; i < 60; i++) { var m = (a + b) / 2; if (f(m) >= 0) b = m; else a = m; } return b;
  };

  /* ---------- ar: pluma gaussiana com dispersões de Briggs (campo aberto) ---------- */
  CA.SIGMA = {
    A: [0.22, 0.20, 0, 0], B: [0.16, 0.12, 0, 0], C: [0.11, 0.08, 0.0002, -0.5],
    D: [0.08, 0.06, 0.0015, -0.5], E: [0.06, 0.03, 0.0003, -1], F: [0.04, 0.016, 0.0003, -1]
  };
  CA.sigmas = function (cl, x) { var s = CA.SIGMA[cl]; return { y: s[0] * x / Math.sqrt(1 + 0.0001 * x), z: s[1] * x * (s[2] ? Math.pow(1 + s[2] * x, s[3]) : 1) }; };
  /* concentração no solo, g/m³, com reflexão no solo; x e y em m */
  CA.pluma = function (Q, u, H, cl, x, y) {
    if (x <= 0) return 0; var s = CA.sigmas(cl, x);
    return Q / (Math.PI * u * s.y * s.z) * Math.exp(-y * y / (2 * s.y * s.y)) * Math.exp(-H * H / (2 * s.z * s.z));
  };
  CA.plumaMax = function (Q, u, H, cl) { var b = { x: 0, c: 0 }, i; for (i = 1; i <= 3000; i++) { var x = 20 * Math.pow(1.0025, i * 1.5); if (x > 60000) break; var c = CA.pluma(Q, u, H, cl, x, 0); if (c > b.c) b = { x: x, c: c }; } return b; };

  /* ---------- combustão ---------- */
  CA.co2 = function (fracC) { return fracC * 44 / 12; };   /* kg de CO2 por kg de combustível */
  CA.so2 = function (fracS) { return fracS * 64 / 32; };
  CA.Tequilibrio = function (S, a) { return Math.pow(S * (1 - a) / (4 * 5.670374e-8), 0.25); };
  CA.Tsuperficie = function (S, a, eps) { return CA.Tequilibrio(S, a) * Math.pow(2 / (2 - eps), 0.25); };

  /* ---------- resíduos ---------- */
  CA.aterro = function (o) {
    var anos = [], M = [], V = [], acum = 0, massa = 0, i, pop = o.pop;
    for (i = 0; i < o.vida; i++) { var m = pop * o.g * 365 / 1000 * (1 - o.desvio); massa += m; acum += m / o.rho * (1 + o.cob); anos.push(i + 1); M.push(m); V.push(acum); pop *= 1 + o.cresc; }
    var T = o.vida + 60, ts = [], q = [], pico = { t: 0, q: 0 }, total = 0, apos = 0, t;
    for (t = 0; t <= T; t += 0.25) {
      var s = 0, j; for (i = 0; i < M.length; i++) for (j = 0; j < 12; j++) { var dt = t - (i + (j + 0.5) / 12); if (dt > 0) s += o.k * o.L0 * M[i] / 12 * Math.exp(-o.k * dt); }
      ts.push(t); q.push(s); if (s > pico.q) pico = { t: t, q: s }; total += s * 0.25; if (t > o.vida) apos += s * 0.25;
    }
    return { anos: anos, M: M, V: V, massa: massa, volume: acum, area: acum / o.h / 1e4, ts: ts, q: q, pico: pico, fracApos: apos / total, potencial: massa * o.L0,
      kW: function (qm3ano) { return qm3ano * 35.8 * 0.35 / 3.6 / 8760; } };
  };
  CA.CN = function (itens) { var c = 0, n = 0; itens.forEach(function (it) { c += it.m * it.C; n += it.m * it.N; }); return c / n; };

  global.CA = CA;
  if (typeof document === 'undefined' || !global.Plot || !global.Sim) return;

  var cor = function (i) { return Plot.serie(i); };
  var nt = function (v, n) { return isFinite(v) ? (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 2 : n }) : '∞'; };
  function animador(desenhar, periodo) {
    var A = { on: false, t: 0, ctx: null }, ult = 0;
    function tick(t) {
      global.requestAnimationFrame(tick);
      if (!A.on || !A.ctx || !A.ctx.root.getClientRects().length) return;
      if (t - ult < periodo) return;
      ult = t; A.t += 1; desenhar(A);
    }
    global.requestAnimationFrame(tick);
    return A;
  }
  function texto(a) { return getComputedStyle(a.ctx.root).color; }
  /* rampa de cor vermelho → amarelo → verde, para OD e concentração */
  function rampa(f) { f = Math.max(0, Math.min(1, f)); var r = f < 0.5 ? 220 : Math.round(220 - (f - 0.5) * 2 * 170), g = f < 0.5 ? Math.round(60 + f * 2 * 140) : 200; return 'rgb(' + r + ',' + g + ',70)'; }

  function montarRio() {
    if (!document.getElementById('sim-rio')) return;
    var A = animador(function (a) { desenha(a); }, 40);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var g = a.ctx.plot('anim').clear(), X = d.xmax, f = (a.t % 240) / 240, xp = f * X;
      g.setLimits([-0.08 * X, X], [0, 10]);
      g.custom(function (c, pl) {
        var n = 120, i, y0 = pl.py(6.4), y1 = pl.py(3.2);
        for (i = 0; i < n; i++) { var xa = X * i / n, xb = X * (i + 1) / n, od = d.r.od(d.r.km ? (xa + xb) / 2 / d.kmd : 0); c.fillStyle = rampa((od - d.pad) / (d.r.cs - d.pad) * 0.5 + 0.5 * (od >= d.pad ? 1 : 0)); c.fillRect(pl.px(xa), y0, pl.px(xb) - pl.px(xa) + 1, y1 - y0); }
        c.strokeStyle = cor(7); c.lineWidth = 2; c.beginPath(); c.moveTo(pl.px(-0.08 * X), y0); c.lineTo(pl.px(X), y0); c.moveTo(pl.px(-0.08 * X), y1); c.lineTo(pl.px(X), y1); c.stroke();
        c.fillStyle = cor(7); c.fillRect(pl.px(0) - 4, pl.py(9.2), 8, pl.py(6.4) - pl.py(9.2));
        c.fillStyle = texto(a); c.font = '12px system-ui, sans-serif'; c.textAlign = 'left';
        c.fillText('efluente', pl.px(0) + 9, pl.py(8.6));
        var odp = d.r.od(xp / d.kmd); c.beginPath(); c.arc(pl.px(xp), pl.py(4.8), 7, 0, 7); c.fillStyle = cor(0); c.fill();
        c.fillStyle = texto(a); c.fillText(nt(xp, 0) + ' km a jusante · ' + nt(xp / d.kmd, 2) + ' dias · OD = ' + nt(Math.max(0, odp), 2) + ' mg/L', pl.px(0) + 9, pl.py(1.6));
        c.textAlign = 'right'; c.fillText('verde: acima do padrão · vermelho: abaixo', pl.px(X) - 4, pl.py(8.6));
      });
      g.draw();
      var go = a.ctx.plot('od'); go.items = go.items.filter(function (it) { return !it.cursor; }); go.items.push({ type: 'points', xs: [xp], ys: [Math.max(0, d.r.od(xp / d.kmd))], r: 5, color: cor(3), cursor: true }); go.draw();
    }
    Sim.build('#sim-rio', {
      titulo: '1. Autodepuração de um rio',
      descricao: 'Um efluente é lançado no rio. Ajuste a carga, o tratamento e as características do rio, e acompanhe o oxigênio dissolvido rio abaixo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Esgoto bruto', desc: 'Sem tratamento', valores: { Qr: 5, dboR: 2, odR: 7.5, Qe: 0.5, dboE: 300, odE: 0, eta: 0, T: 25, v: 0.3, H: 1.5, k1: 0.35, cl: '2' } },
        { nome: '2 · Tratamento secundário', desc: '85 % de remoção', valores: { Qr: 5, dboR: 2, odR: 7.5, Qe: 0.5, dboE: 300, odE: 0, eta: 0.85, T: 25, v: 0.3, H: 1.5, k1: 0.35, cl: '2' } },
        { nome: '3 · Rio raso e rápido', desc: 'Reaeração forte', valores: { Qr: 5, dboR: 2, odR: 7.5, Qe: 0.5, dboE: 300, odE: 0, eta: 0, T: 25, v: 0.8, H: 0.6, k1: 0.35, cl: '2' } },
        { nome: '4 · Estiagem', desc: 'Pouca vazão de diluição', valores: { Qr: 1, dboR: 2, odR: 7.5, Qe: 0.5, dboE: 300, odE: 0, eta: 0.6, T: 28, v: 0.15, H: 1, k1: 0.35, cl: '2' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Rio a montante' },
        { id: 'Qr', label: 'Vazão do rio', min: 0.5, max: 20, step: 0.1, valor: 5, unidade: 'm³/s' },
        { id: 'dboR', label: 'DBO₅ do rio', min: 0.5, max: 5, step: 0.1, valor: 2, unidade: 'mg/L' },
        { id: 'odR', label: 'OD do rio', min: 4, max: 9, step: 0.1, valor: 7.5, unidade: 'mg/L' },
        { tipo: 'titulo', label: 'Efluente' },
        { id: 'Qe', label: 'Vazão do efluente', min: 0.05, max: 2, step: 0.05, valor: 0.5, unidade: 'm³/s' },
        { id: 'dboE', label: 'DBO₅ do efluente bruto', min: 20, max: 500, step: 5, valor: 300, unidade: 'mg/L' },
        { id: 'odE', label: 'OD do efluente', min: 0, max: 5, step: 0.1, valor: 0, unidade: 'mg/L' },
        { id: 'eta', label: 'Eficiência do tratamento', min: 0, max: 0.98, step: 0.01, valor: 0, unidade: '' },
        { tipo: 'titulo', label: 'Características do rio' },
        { id: 'T', label: 'Temperatura da água', min: 10, max: 32, step: 0.5, valor: 25, unidade: '°C' },
        { id: 'v', label: 'Velocidade média', min: 0.1, max: 1.2, step: 0.01, valor: 0.3, unidade: 'm/s' },
        { id: 'H', label: 'Profundidade média', min: 0.4, max: 5, step: 0.1, valor: 1.5, unidade: 'm' },
        { id: 'k1', label: 'Coeficiente de desoxigenação K₁ a 20 °C', min: 0.1, max: 0.6, step: 0.01, valor: 0.35, unidade: '1/d' },
        { id: 'cl', tipo: 'seg', label: 'Classe do rio', valor: '2', opcoes: [{ v: '1', t: '1' }, { v: '2', t: '2' }, { v: '3', t: '3' }, { v: '4', t: '4' }] },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'O rio visto de cima', height: 170, grid: false, legend: false, yticks: 0 },
        { id: 'od', titulo: 'Oxigênio dissolvido rio abaixo', xlabel: 'distância do lançamento (km)', ylabel: 'OD (mg/L)', aspect: 0.45, legendPos: 'bottomright' },
        { id: 'dbo', titulo: 'DBO₅ remanescente', xlabel: 'distância do lançamento (km)', ylabel: 'DBO₅ (mg/L)', aspect: 0.3, legend: false }
      ],
      saidas: [{ id: 'l5', label: 'DBO₅ após a mistura' }, { id: 'od0', label: 'OD após a mistura' }, { id: 'odm', label: 'OD mínimo' }, { id: 'xc', label: 'Distância crítica' }, { id: 'k2', label: 'Reaeração K₂' }, { id: 'eta', label: 'Eficiência mínima para a classe' }],
      formulas: [
        { tex: 'D(t) = \\frac{K_1 L_0}{K_2 - K_1}\\left(e^{-K_1 t} - e^{-K_2 t}\\right) + D_0\\,e^{-K_2 t}', d: 'déficit de oxigênio (Streeter-Phelps)', destaque: true },
        { tex: 'C = \\frac{Q_r C_r + Q_e C_e}{Q_r + Q_e}', d: 'mistura completa no lançamento' },
        { tex: 'K_2 = 3{,}73\\,v^{0{,}5} H^{-1{,}5}', d: 'reaeração de O\'Connor e Dobbins, a 20 °C' }
      ],
      nota: 'Modelo de Streeter-Phelps: mistura completa no ponto de lançamento, escoamento uniforme, DBO carbonácea de primeira ordem e reaeração pela superfície. Correção de temperatura com θ = 1,047 para K₁ e 1,024 para K₂. Não inclui nitrificação, fotossíntese, sedimentação nem afluentes.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var o = { Qr: p.Qr, dboR: p.dboR, odR: p.odR, Qe: p.Qe, dboE: p.dboE, odE: p.odE, eta: p.eta, T: p.T, v: p.v, H: p.H, k1: p.k1 }, r = CA.rio(o), pad = CA.CLASSES[p.cl];
        var tmax = Math.min(20, Math.max(2, r.tc * 3, 4 / r.k2)), kmd = r.km(1), xmax = r.km(tmax), ts = Plot.linspace(0, tmax, 400), xs = ts.map(r.km), ods = ts.map(function (t) { return Math.max(0, r.od(t)); });
        var etaMin = CA.etaMin(o, pad.od), anox = r.odMin <= 0;
        A.dados = { r: r, xmax: xmax, kmd: kmd, pad: pad.od };
        var g = ctx.plot('od').clear();
        g.setLimits([0, xmax], [0, Math.max(10, r.cs + 0.5)]);
        g.line(xs, ods, { color: cor(0), width: 2.6, label: 'OD no rio' });
        g.hline(r.cs, { color: cor(7), width: 1.2, dash: [3, 4], label: 'saturação' });
        g.hline(pad.od, { color: cor(3), width: 1.6, dash: [6, 4], label: 'padrão da classe ' + p.cl });
        g.draw();
        var gd = ctx.plot('dbo').clear();
        gd.setLimits([0, xmax], [0, Math.max(r.L5 * 1.1, 6)]);
        gd.line(xs, ts.map(r.dbo5), { color: cor(1), width: 2.4 });
        if (isFinite(pad.dbo)) gd.hline(pad.dbo, { color: cor(3), width: 1.4, dash: [6, 4], text: 'limite da classe' });
        gd.draw();
        desenha(A);
        ctx.setPassos([
          { t: '① Mistura', obs: 'Rio e efluente se misturam: DBO₅ de ' + nt(r.L5, 1) + ' mg/L e OD de ' + nt(r.od0, 2) + ' mg/L.' + (r.L5 > pad.dbo ? ' A DBO já passa do limite da classe.' : '') },
          { t: '② Consumo e reaeração', obs: 'As bactérias consomem oxigênio (K₁ = ' + nt(r.k1, 3) + '/d) e a superfície repõe (K₂ = ' + nt(r.k2, 3) + '/d).' },
          { t: '③ Ponto crítico', obs: anox ? 'O oxigênio se esgota: o trecho fica anaeróbio, com mortandade de peixes e mau cheiro.' : 'OD mínimo de ' + nt(r.odMin, 2) + ' mg/L a ' + nt(r.xc, 1) + ' km. ' + (r.odMin >= pad.od ? 'Atende à classe ' + p.cl + '.' : 'Abaixo do padrão da classe ' + p.cl + '.') }
        ]);
        return { l5: { v: r.L5, u: 'mg/L', classe: r.L5 > pad.dbo ? 'alerta' : '' }, od0: { v: r.od0, u: 'mg/L' }, odm: { v: anox ? 0 : r.odMin, u: 'mg/L', classe: r.odMin >= pad.od ? 'ok' : 'alerta' }, xc: { v: r.xc, u: 'km', classe: 'destaque' }, k2: { v: r.k2, u: '1/d' }, eta: { v: isNaN(etaMin) ? 'inviável' : Math.round(etaMin * 1000) / 10, u: isNaN(etaMin) ? '' : '%' } };
      }
    });
  }

  function montarPluma() {
    if (!document.getElementById('sim-pluma')) return;
    var A = animador(function (a) { desenha(a); }, 50);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var g = a.ctx.plot('mapa').clear(), X = d.X, Yl = X * 0.22;
      g.setLimits([-0.04 * X, X], [-Yl, Yl]);
      g.custom(function (c, pl) {
        var nx = 90, ny = 36, i, j, w = (pl.px(X) - pl.px(0)) / nx, h = (pl.py(-Yl) - pl.py(Yl)) / ny;
        for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
          var x = (i + 0.5) / nx * X, y = Yl - (j + 0.5) / ny * 2 * Yl, cc = CA.pluma(d.Q, d.u, d.H, d.cl, x * 1000, y * 1000) * 1e6, f = cc / d.ref;
          if (f < 0.02) continue; c.globalAlpha = Math.min(0.85, 0.25 + 0.45 * Math.min(f, 1.3)); c.fillStyle = f >= 1 ? 'rgb(220,60,70)' : f > 0.5 ? 'rgb(235,160,40)' : 'rgb(110,190,90)'; c.fillRect(pl.px(0) + i * w, pl.py(Yl) + j * h, w + 0.6, h + 0.6);
        }
        c.globalAlpha = 1;
        var vel = d.u * 0.002 * X, k;
        for (k = 0; k < 7; k++) { var xx = ((a.t * vel / 40 + k * X / 7) % X), s = CA.sigmas(d.cl, Math.max(xx, 0.01) * 1000).y / 1000; c.strokeStyle = cor(7); c.globalAlpha = 0.6; c.lineWidth = 1.4; c.beginPath(); c.ellipse(pl.px(xx), pl.py(0), Math.max(3, (pl.px(s * 0.5) - pl.px(0))), Math.max(3, pl.py(-s) - pl.py(0)), 0, 0, 7); c.stroke(); }
        c.globalAlpha = 1; c.fillStyle = cor(7); c.fillRect(pl.px(0) - 5, pl.py(0) - 5, 10, 10);
        c.fillStyle = texto(a); c.font = '12px system-ui, sans-serif'; c.textAlign = 'left'; c.fillText('chaminé', pl.px(0) + 8, pl.py(0) - 9);
        c.textAlign = 'right'; c.fillText('vento →', pl.px(X) - 6, pl.py(Yl) + 15);
        c.fillText('vermelho: acima da referência · laranja: acima da metade', pl.px(X) - 6, pl.py(-Yl) - 8);
      });
      g.draw();
    }
    Sim.build('#sim-pluma', {
      titulo: '2. Dispersão da pluma de uma chaminé',
      descricao: 'Concentração ao nível do solo pelo modelo gaussiano. Mude a estabilidade da atmosfera, o vento e a altura efetiva, e veja onde a pluma toca o solo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Atmosfera neutra', desc: 'Classe D', valores: { Q: 100, u: 5, H: 100, cl: 'D', ref: 100 } },
        { nome: '2 · Dia ensolarado', desc: 'Instável, classe B', valores: { Q: 100, u: 3, H: 100, cl: 'B', ref: 100 } },
        { nome: '3 · Noite estável', desc: 'Classe F', valores: { Q: 100, u: 2, H: 100, cl: 'F', ref: 100 } },
        { nome: '4 · Chaminé baixa', desc: 'H = 40 m', valores: { Q: 100, u: 5, H: 40, cl: 'D', ref: 100 } }
      ],
      controles: [
        { id: 'Q', label: 'Taxa de emissão', min: 10, max: 2000, step: 10, valor: 100, unidade: 'g/s' },
        { id: 'u', label: 'Velocidade do vento na chaminé', min: 1, max: 15, step: 0.5, valor: 5, unidade: 'm/s' },
        { id: 'H', label: 'Altura efetiva da emissão', min: 20, max: 300, step: 5, valor: 100, unidade: 'm' },
        { id: 'cl', tipo: 'select', label: 'Estabilidade atmosférica', valor: 'D', opcoes: [{ v: 'A', t: 'A · muito instável' }, { v: 'B', t: 'B · instável' }, { v: 'C', t: 'C · pouco instável' }, { v: 'D', t: 'D · neutra' }, { v: 'E', t: 'E · pouco estável' }, { v: 'F', t: 'F · estável' }] },
        { id: 'ref', label: 'Concentração de referência', min: 20, max: 500, step: 5, valor: 100, unidade: 'µg/m³' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'mapa', titulo: 'Vista de cima, ao nível do solo', xlabel: 'distância a favor do vento (km)', ylabel: 'lateral (km)', aspect: 0.48, grid: false, legend: false },
        { id: 'c', titulo: 'Concentração no solo, no eixo da pluma', xlabel: 'distância a favor do vento (km)', ylabel: 'concentração (µg/m³)', aspect: 0.42, legendPos: 'topright' }
      ],
      saidas: [{ id: 'cm', label: 'Concentração máxima' }, { id: 'xm', label: 'Distância do máximo' }, { id: 'c1', label: 'A 1 km' }, { id: 'c5', label: 'A 5 km' }, { id: 'sz', label: 'σz no máximo' }, { id: 'ok', label: 'Comparação com a referência' }],
      formulas: [
        { tex: 'C(x, y, 0) = \\frac{Q}{\\pi\\,u\\,\\sigma_y\\,\\sigma_z}\\,e^{-y^2/2\\sigma_y^2}\\,e^{-H^2/2\\sigma_z^2}', d: 'pluma gaussiana com reflexão no solo', destaque: true },
        { tex: '\\sigma_z \\approx H/\\sqrt 2', d: 'condição aproximada do máximo no solo' }
      ],
      nota: 'Modelo gaussiano em regime permanente, terreno plano e vento uniforme. Dispersões de Briggs para campo aberto, válidas de cerca de 100 m a 10 km. A altura efetiva já inclui a elevação da pluma. Não há inversão térmica limitando a mistura.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var mx = CA.plumaMax(p.Q, p.u, p.H, p.cl), X = Math.min(30, Math.max(3, mx.x / 1000 * 3)), xs = Plot.linspace(0.05, X, 400), cs = xs.map(function (x) { return CA.pluma(p.Q, p.u, p.H, p.cl, x * 1000, 0) * 1e6; });
        A.dados = { Q: p.Q, u: p.u, H: p.H, cl: p.cl, ref: p.ref, X: X };
        var g = ctx.plot('c').clear(), cmax = mx.c * 1e6;
        g.setLimits([0, X], [0, Math.max(cmax, p.ref) * 1.2]);
        g.line(xs, cs, { color: cor(0), width: 2.6, label: 'eixo da pluma' });
        g.hline(p.ref, { color: cor(3), width: 1.6, dash: [6, 4], label: 'referência' });
        g.vline(mx.x / 1000, { color: cor(7), width: 1, dash: [3, 4] });
        g.draw();
        desenha(A);
        var s = CA.sigmas(p.cl, mx.x);
        ctx.setPassos([
          { t: '① Diluição pelo vento', obs: 'A concentração é inversamente proporcional à velocidade do vento: dobrá-lo divide C por dois no mesmo ponto.' },
          { t: '② Onde a pluma toca o solo', obs: 'O máximo aparece a ' + nt(mx.x / 1000, 2) + ' km, quando σz chega a ' + nt(s.z, 0) + ' m, perto de H/√2 = ' + nt(p.H / Math.SQRT2, 0) + ' m.' },
          { t: '③ Comparação', obs: cmax > p.ref ? 'O máximo passa da referência: aumente a altura da chaminé ou reduza a emissão.' : 'O máximo fica abaixo da referência.' }
        ]);
        return { cm: { v: cmax, u: 'µg/m³', classe: cmax > p.ref ? 'alerta' : 'ok' }, xm: { v: mx.x / 1000, u: 'km', classe: 'destaque' }, c1: { v: Math.round(CA.pluma(p.Q, p.u, p.H, p.cl, 1000, 0) * 1e7) / 10, u: 'µg/m³' }, c5: { v: Math.round(CA.pluma(p.Q, p.u, p.H, p.cl, 5000, 0) * 1e7) / 10, u: 'µg/m³' }, sz: { v: s.z, u: 'm' }, ok: { v: cmax > p.ref ? 'acima' : 'abaixo', classe: cmax > p.ref ? 'alerta' : 'ok' } };
      }
    });
  }

  function montarAterro() {
    if (!document.getElementById('sim-aterro')) return;
    var A = animador(function (a) { desenha(a); }, 50);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var r = d.r, n = r.V.length, f = (a.t % 220) / 190, ano = Math.min(n, Math.floor(f * (n + 1))), g = a.ctx.plot('anim').clear();
      g.setLimits([0, 12], [0, 6]);
      g.custom(function (c, pl) {
        var X = function (v) { return pl.px(v); }, Y = function (v) { return pl.py(v); }, x0 = 0.9, x1 = 8.1, base = 0.8, topo = 4.6;
        c.fillStyle = cor(7); c.globalAlpha = 0.25; c.fillRect(X(0), Y(base), X(12) - X(0), Y(0) - Y(base)); c.globalAlpha = 1;
        c.strokeStyle = cor(4); c.lineWidth = 3; c.beginPath(); c.moveTo(X(x0 - 0.6), Y(topo + 0.3)); c.lineTo(X(x0), Y(base)); c.lineTo(X(x1), Y(base)); c.lineTo(X(x1 + 0.6), Y(topo + 0.3)); c.stroke();
        var i; for (i = 0; i < ano; i++) {
          var h0 = base + (topo - base) * (i ? r.V[i - 1] : 0) / r.volume, h1 = base + (topo - base) * r.V[i] / r.volume, e0 = 0.6 * (h0 - base) / (topo - base + 0.3), e1 = 0.6 * (h1 - base) / (topo - base + 0.3);
          c.fillStyle = i % 2 ? cor(1) : cor(5); c.globalAlpha = 0.55; c.beginPath(); c.moveTo(X(x0 - e0), Y(h0)); c.lineTo(X(x1 + e0), Y(h0)); c.lineTo(X(x1 + e1), Y(h1)); c.lineTo(X(x0 - e1), Y(h1)); c.closePath(); c.fill(); c.globalAlpha = 1;
        }
        var tAgora = ano, qA = 0, k; for (k = 0; k < r.ts.length; k++) if (r.ts[k] <= tAgora) qA = r.q[k];
        c.fillStyle = cor(2); var nb = Math.round(12 * qA / Math.max(r.pico.q, 1));
        for (k = 0; k < nb; k++) { var bx = x0 + 0.5 + ((k * 2.3) % 7), by = base + 0.3 + ((a.t * 0.04 + k * 0.37) % 1) * (topo - base); c.beginPath(); c.arc(X(bx), Y(by), 3.2, 0, 7); c.fill(); }
        c.strokeStyle = cor(3); c.lineWidth = 2; c.beginPath(); c.moveTo(X(x0 + 0.2), Y(base - 0.25)); c.lineTo(X(x1 - 0.2), Y(base - 0.25)); c.stroke();
        c.fillStyle = texto(a); c.font = '12px system-ui, sans-serif'; c.textAlign = 'left';
        c.fillText('ano ' + ano + ' de ' + n, X(8.9), Y(5.4)); c.fillText('preenchido: ' + nt(100 * (ano ? r.V[ano - 1] : 0) / r.volume, 0) + ' %', X(8.9), Y(4.6));
        c.fillText('metano agora:', X(8.9), Y(3.6)); c.fillText(nt(qA / 1e6, 2) + ' mi m³/ano', X(8.9), Y(3.0));
        c.fillText('manta e drenos de chorume', X(x0 + 0.2), Y(base - 0.55));
      });
      g.draw();
    }
    Sim.build('#sim-aterro', {
      titulo: '3. Aterro sanitário e geração de metano',
      descricao: 'Dimensione o aterro de uma cidade e veja quanto metano ele gera, inclusive décadas depois de encerrado.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Cidade média', desc: '200 mil habitantes', valores: { pop: 200000, cresc: 1, g: 1, desvio: 10, rho: 0.8, cob: 20, h: 20, vida: 20, k: 0.05, L0: 100 } },
        { nome: '2 · Coleta seletiva forte', desc: '40 % desviados', valores: { pop: 200000, cresc: 1, g: 1, desvio: 40, rho: 0.8, cob: 20, h: 20, vida: 20, k: 0.05, L0: 100 } },
        { nome: '3 · Clima úmido', desc: 'Decomposição rápida', valores: { pop: 200000, cresc: 1, g: 1, desvio: 10, rho: 0.8, cob: 20, h: 20, vida: 20, k: 0.15, L0: 100 } },
        { nome: '4 · Metrópole', desc: '1 milhão de habitantes', valores: { pop: 1000000, cresc: 0.8, g: 1.2, desvio: 10, rho: 0.9, cob: 15, h: 35, vida: 20, k: 0.05, L0: 100 } }
      ],
      controles: [
        { id: 'pop', label: 'População inicial', min: 10000, max: 1500000, step: 10000, valor: 200000, unidade: 'hab' },
        { id: 'cresc', label: 'Crescimento da população', min: 0, max: 3, step: 0.1, valor: 1, unidade: '%/ano' },
        { id: 'g', label: 'Geração per capita', min: 0.4, max: 1.6, step: 0.01, valor: 1, unidade: 'kg/hab·dia' },
        { id: 'desvio', label: 'Desviado por reciclagem e compostagem', min: 0, max: 70, step: 1, valor: 10, unidade: '%' },
        { id: 'rho', label: 'Massa específica compactada', min: 0.5, max: 1.1, step: 0.05, valor: 0.8, unidade: 't/m³' },
        { id: 'cob', label: 'Solo de cobertura', min: 0, max: 30, step: 1, valor: 20, unidade: '% do volume' },
        { id: 'h', label: 'Altura útil do aterro', min: 10, max: 40, step: 1, valor: 20, unidade: 'm' },
        { id: 'vida', label: 'Vida útil', min: 5, max: 30, step: 1, valor: 20, unidade: 'anos' },
        { tipo: 'titulo', label: 'Biogás' },
        { id: 'k', label: 'Constante de decaimento k', min: 0.02, max: 0.2, step: 0.005, valor: 0.05, unidade: '1/ano' },
        { id: 'L0', label: 'Potencial de metano L₀', min: 50, max: 170, step: 5, valor: 100, unidade: 'm³/t' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'Corte do aterro', height: 220, grid: false, legend: false, xticks: 0, yticks: 0 },
        { id: 'v', titulo: 'Volume ocupado', xlabel: 'ano de operação', ylabel: 'volume (milhões de m³)', aspect: 0.36, legend: false },
        { id: 'q', titulo: 'Geração de metano', xlabel: 'anos desde a abertura', ylabel: 'CH₄ (milhões de m³/ano)', aspect: 0.4, legend: false }
      ],
      saidas: [{ id: 'm', label: 'Resíduo aterrado' }, { id: 'V', label: 'Volume total' }, { id: 'A', label: 'Área necessária' }, { id: 'qp', label: 'Pico de metano' }, { id: 'kw', label: 'Potência elétrica no pico' }, { id: 'ap', label: 'Metano gerado após o fechamento' }],
      formulas: [
        { tex: 'V = \\frac{M}{\\rho}\\,(1 + f_{cob})', d: 'volume ocupado', destaque: true },
        { tex: 'Q_{CH_4}(t) = \\sum_i k\\,L_0\\,M_i\\,e^{-k(t - t_i)}', d: 'decaimento de primeira ordem, como no LandGEM' }
      ],
      nota: 'Massa aterrada calculada ano a ano. Metano por decaimento de primeira ordem, com valores típicos de k e de L₀ da literatura; em projeto, eles vêm de ensaios e do clima local. Potência com poder calorífico de 35,8 MJ/m³ e rendimento de 35 % no motogerador, supondo captação de todo o gás.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var r = CA.aterro({ pop: p.pop, cresc: p.cresc / 100, g: p.g, desvio: p.desvio / 100, rho: p.rho, cob: p.cob / 100, h: p.h, vida: p.vida, k: p.k, L0: p.L0 });
        A.dados = { r: r };
        var gv = ctx.plot('v').clear();
        gv.setLimits([0, p.vida], [0, r.volume / 1e6 * 1.1]);
        gv.area([0].concat(r.anos), [0].concat(r.V.map(function (v) { return v / 1e6; })), { color: cor(1), alpha: 0.25 });
        gv.line([0].concat(r.anos), [0].concat(r.V.map(function (v) { return v / 1e6; })), { color: cor(1), width: 2.4 });
        gv.draw();
        var gq = ctx.plot('q').clear();
        gq.setLimits([0, r.ts[r.ts.length - 1]], [0, r.pico.q / 1e6 * 1.15]);
        gq.line(r.ts, r.q.map(function (v) { return v / 1e6; }), { color: cor(2), width: 2.4 });
        gq.vline(p.vida, { color: cor(7), width: 1.2, dash: [4, 4], text: 'fechamento' });
        gq.draw();
        desenha(A);
        ctx.setPassos([
          { t: '① Massa', obs: nt(r.massa / 1e6, 2) + ' milhões de toneladas em ' + p.vida + ' anos, já descontado o que vai para reciclagem e compostagem.' },
          { t: '② Espaço', obs: 'Com ' + nt(p.rho, 2) + ' t/m³ e ' + p.cob + ' % de cobertura, ocupam ' + nt(r.volume / 1e6, 2) + ' milhões de m³, ou ' + nt(r.area, 1) + ' ha com ' + p.h + ' m de altura.' },
          { t: '③ Biogás', obs: 'O pico ocorre no ano ' + nt(r.pico.t, 1) + ', e ' + nt(100 * r.fracApos, 0) + ' % do metano sai depois do fechamento: o monitoramento continua por décadas.' }
        ]);
        return { m: { v: r.massa / 1e6, u: 'milhões de t' }, V: { v: r.volume / 1e6, u: 'milhões de m³' }, A: { v: r.area, u: 'ha', classe: 'destaque' }, qp: { v: r.pico.q / 1e6, u: 'milhões m³/ano' }, kw: { v: r.kW(r.pico.q) / 1000, u: 'MW' }, ap: { v: 100 * r.fracApos, u: '%' } };
      }
    });
  }

  function iniciar() { montarRio(); montarPluma(); montarAterro(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window);

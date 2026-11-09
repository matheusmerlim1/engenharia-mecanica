/* ============================================================
   Simuladores de Modelagem e Controle de Sistemas
   1 · Resposta de segunda ordem e polos no plano s — animado
   2 · Malha de controle PID com saturação — animado
   3 · Lugar das raízes — animado
   ============================================================ */
(function (global) {
  'use strict';
  var CS = {};

  /* ---------- polinômios (coeficientes do maior para o menor grau) ---------- */
  CS.pmul = function (a, b) { var r = [], i, j; for (i = 0; i < a.length + b.length - 1; i++) r[i] = 0; for (i = 0; i < a.length; i++) for (j = 0; j < b.length; j++) r[i + j] += a[i] * b[j]; return r; };
  CS.padd = function (a, b) { var n = Math.max(a.length, b.length), r = [], i; for (i = 0; i < n; i++) r[i] = (a[i - n + a.length] || 0) + (b[i - n + b.length] || 0); return r; };
  CS.pesc = function (a, k) { return a.map(function (v) { return v * k; }); };
  CS.deZeros = function (l) { return l.reduce(function (p, r) { return CS.pmul(p, [1, -r]); }, [1]); };

  /* todas as raízes, pelo método de Durand-Kerner */
  CS.raizes = function (p) {
    var q = p.slice(); while (q.length > 1 && Math.abs(q[0]) < 1e-14) q.shift();
    var n = q.length - 1; if (n < 1) return [];
    var a = q.map(function (v) { return v / q[0]; }), R = 1, i, k, it;
    for (i = 1; i <= n; i++) R = Math.max(R, Math.pow(Math.abs(a[i]), 1 / i));
    var re = [], im = [];
    for (k = 0; k < n; k++) { var th = 2 * Math.PI * k / n + 0.4; re[k] = R * Math.cos(th); im[k] = R * Math.sin(th); }
    for (it = 0; it < 300; it++) {
      var mudou = 0;
      for (k = 0; k < n; k++) {
        var vr = 1, vi = 0;
        for (i = 1; i <= n; i++) { var t = vr * re[k] - vi * im[k] + a[i]; vi = vr * im[k] + vi * re[k]; vr = t; }
        var dr = 1, di = 0;
        for (i = 0; i < n; i++) if (i !== k) { var xr = re[k] - re[i], xi = im[k] - im[i], u = dr * xr - di * xi; di = dr * xi + di * xr; dr = u; }
        var m = dr * dr + di * di; if (m < 1e-300) continue;
        var cr = (vr * dr + vi * di) / m, ci = (vi * dr - vr * di) / m;
        re[k] -= cr; im[k] -= ci; mudou = Math.max(mudou, Math.abs(cr) + Math.abs(ci));
      }
      if (mudou < 1e-11 * R) break;
    }
    var s = []; for (k = 0; k < n; k++) s.push({ re: re[k], im: Math.abs(im[k]) < 1e-7 * R ? 0 : im[k] });
    return s.sort(function (x, y) { return y.re - x.re || y.im - x.im; });
  };

  /* ---------- primeira e segunda ordem ---------- */
  CS.y1 = function (tau, t) { return 1 - Math.exp(-t / tau); };
  CS.Mp = function (z) { return z >= 1 ? 0 : z <= 0 ? 100 : 100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)); };
  CS.zMp = function (mpPct) { var L = Math.log(mpPct / 100); return -L / Math.sqrt(Math.PI * Math.PI + L * L); };
  CS.y2 = function (z, wn, t) {
    if (Math.abs(z - 1) < 1e-6) return 1 - (1 + wn * t) * Math.exp(-wn * t);
    if (z < 1) { var wd = wn * Math.sqrt(1 - z * z), b = Math.sqrt(1 - z * z); return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z / b) * Math.sin(wd * t)); }
    var q = Math.sqrt(z * z - 1), p1 = wn * (z - q), p2 = wn * (z + q);
    return 1 - (p2 * Math.exp(-p1 * t) - p1 * Math.exp(-p2 * t)) / (p2 - p1);
  };
  /* último instante fora da faixa de tolerância */
  CS.acomoda = function (f, T, tol, y) { y = y == null ? 1 : y; var n = 12000, i; for (i = n; i >= 0; i--) { var t = T * i / n; if (Math.abs(f(t) - y) > tol * Math.abs(y)) return i === n ? Infinity : T * (i + 1) / n; } return 0; };
  /* tempo de subida 10 a 90 % */
  CS.subida = function (f, T, y) { y = y == null ? 1 : y; var n = 12000, i, a = null, b = null; for (i = 0; i <= n; i++) { var t = T * i / n, v = f(t); if (a === null && v >= 0.1 * y) a = t; if (v >= 0.9 * y) { b = t; break; } } return a === null || b === null ? NaN : b - a; };
  CS.segunda = function (z, wn) {
    var r = { z: z, wn: wn, sig: z * wn, wd: z < 1 ? wn * Math.sqrt(1 - z * z) : 0 };
    r.classe = z <= 0 ? 'sem amortecimento' : z < 1 ? 'subamortecido' : Math.abs(z - 1) < 1e-6 ? 'criticamente amortecido' : 'superamortecido';
    r.Mp = CS.Mp(z); r.tp = z < 1 ? Math.PI / r.wd : Infinity; r.ts2a = z > 0 ? 4 / (z * wn) : Infinity; r.ts5a = z > 0 ? 3 / (z * wn) : Infinity; r.tr0 = z < 1 && z > 0 ? (Math.PI - Math.acos(z)) / r.wd : NaN;
    var lento = z >= 1 ? wn * (z - Math.sqrt(z * z - 1)) : z * wn;
    r.T = z < 0.05 ? 12 * Math.PI / wn : z >= 1 ? 8 / lento : 1.4 * r.ts2a;
    var f = function (t) { return CS.y2(z, wn, t); };
    r.ts2 = z <= 0 ? Infinity : CS.acomoda(f, r.T * 1.5, 0.02); r.tr = CS.subida(f, r.T);
    return r;
  };

  /* ---------- critério de Routh-Hurwitz ---------- */
  CS.routh = function (p) {
    var n = p.length - 1, w = Math.floor(n / 2) + 1, L = [[], []], j, i, esc = Math.max.apply(null, p.map(Math.abs)) || 1, ZERO = 1e-9 * esc, linhaZero = false, eps = false;
    for (j = 0; j < w; j++) { L[0][j] = p[2 * j] || 0; L[1][j] = p[2 * j + 1] || 0; }
    for (i = 2; i <= n + 1; i++) {
      var a = L[i - 1];
      if (i <= n || a.some(function (v) { return Math.abs(v) > ZERO; })) { }
      if (a.every(function (v) { return Math.abs(v) <= ZERO; }) && i - 1 < n) {
        linhaZero = true; var ord = n - (i - 2);
        for (j = 0; j < w; j++) a[j] = L[i - 2][j] * Math.max(0, ord - 2 * j);
      } else if (Math.abs(a[0]) <= ZERO && i - 1 < n) { eps = true; a[0] = 1e-7 * esc; }
      if (i > n) break;
      var b = L[i - 2], c = [];
      for (j = 0; j < w; j++) c[j] = (a[0] * (b[j + 1] || 0) - b[0] * (a[j + 1] || 0)) / a[0];
      L[i] = c;
    }
    L.length = n + 1;
    var trocas = 0, col = L.map(function (l) { return l[0]; });
    for (i = 1; i < col.length; i++) if (col[i] * col[i - 1] < 0) trocas++;
    return { linhas: L, primeira: col, trocas: trocas, linhaZero: linhaZero, epsilon: eps, estavel: trocas === 0 && !linhaZero && col.every(function (v) { return v > 0; }) || (trocas === 0 && !linhaZero && col.every(function (v) { return v < 0; })) };
  };

  /* ---------- resposta ao degrau de N(s)/D(s), com grau de N menor que o de D ---------- */
  CS.degrau = function (num, den, T, n) {
    var d = den.slice(); while (Math.abs(d[0]) < 1e-14) d.shift();
    var c0 = d[0], a = d.map(function (v) { return v / c0; }), ord = a.length - 1, nn = num.map(function (v) { return v / c0; });
    var C = []; for (var k = 0; k < ord; k++) C[k] = nn[nn.length - 1 - k] || 0;
    function f(x) { var y = [], i; for (i = 0; i < ord - 1; i++) y[i] = x[i + 1]; var s = 1; for (i = 0; i < ord; i++) s -= a[ord - i] * x[i]; y[ord - 1] = s; return y; }
    var x = []; for (k = 0; k < ord; k++) x[k] = 0;
    var ts = [], ys = [], dt = T / n, i, m;
    function soma(u, v, h) { return u.map(function (e, q) { return e + h * v[q]; }); }
    var parou = false;
    for (i = 0; i <= n; i++) {
      var y = 0; for (m = 0; m < ord; m++) y += C[m] * x[m];
      if (!isFinite(y) || Math.abs(y) > 1e6) { parou = true; y = y > 0 ? 1e6 : -1e6; }
      ts.push(i * dt); ys.push(y);
      if (!parou) { var k1 = f(x), k2 = f(soma(x, k1, dt / 2)), k3 = f(soma(x, k2, dt / 2)), k4 = f(soma(x, k3, dt)); x = x.map(function (e, q) { return e + dt / 6 * (k1[q] + 2 * k2[q] + 2 * k3[q] + k4[q]); }); }
    }
    return { t: ts, y: ys };
  };

  /* ---------- malha PID: planta K/[s^i · Π(τj s + 1)], perturbação na entrada da planta ---------- */
  CS.PLANTAS = {
    p1: { nome: '1ª ordem', K: 1, tau: [10], integ: 0, eq: '1/(10s + 1)' },
    p2: { nome: '2ª ordem', K: 1, tau: [10, 2], integ: 0, eq: '1/[(10s + 1)(2s + 1)]' },
    p3: { nome: '3ª ordem', K: 1, tau: [10, 3, 1], integ: 0, eq: '1/[(10s + 1)(3s + 1)(s + 1)]' },
    p4: { nome: 'Integradora', K: 1, tau: [2], integ: 1, eq: '1/[s(2s + 1)]' }
  };
  CS.pid = function (o) {
    var P = o.planta, T = o.T || 60, n = o.n || 6000, dt = T / n, Tf = 0.1, x = P.tau.map(function () { return 0; }), xi = 0, I = 0, df = 0, y = 0, e0 = o.r;
    var R = { t: [], y: [], u: [], P: [], I: [], D: [], tsat: 0, umax: 0, instavel: false }, a = P.tau.map(function (t) { return 1 - Math.exp(-dt / t); }), af = 1 - Math.exp(-dt / Tf), i, j;
    for (i = 0; i <= n; i++) {
      var t = i * dt, e = o.r - y, sinal = o.dMedida ? -y : e, der = (sinal - df) / Tf;
      if (!o.dMedida && i === 0) e0 = e;
      var pP = o.Kp * e, pD = o.Kd * der, v = pP + I + pD, u = Math.max(-o.umax, Math.min(o.umax, v)), sat = v !== u;
      if (sat) R.tsat += dt;
      R.t.push(t); R.y.push(y); R.u.push(u); R.P.push(pP); R.I.push(I); R.D.push(pD); R.umax = Math.max(R.umax, Math.abs(u));
      var trava = o.antiwindup && sat && (v > 0) === (e > 0);
      if (!trava) I += o.Ki * e * dt;
      df += af * (sinal - df);
      var w = u + (o.dt0 !== undefined && t >= o.dt0 ? o.d : 0), ent = P.K * w;
      for (j = 0; j < x.length; j++) { x[j] += a[j] * (ent - x[j]); ent = x[j]; }
      if (P.integ) { xi += ent * dt; y = xi; } else y = ent;
      if (Math.abs(y) > 1e3 * Math.max(Math.abs(o.r), 1)) { R.instavel = true; y = y > 0 ? 1e3 : -1e3; }
    }
    return R;
  };

  /* ---------- resposta em frequência a partir de zeros e polos ---------- */
  CS.bodeZP = function (K, zeros, polos, w) {
    function fator(l) { var m = 0, f = 0; l.forEach(function (r) { var a = -r.re, b = w - r.im; m += Math.log10(Math.hypot(a, b)); f += Math.atan2(b, a); }); return { m: m, f: f }; }
    var z = fator(zeros), p = fator(polos);
    return { db: 20 * (Math.log10(K) + z.m - p.m), fase: (z.f - p.f) * 180 / Math.PI };
  };
  CS.margens = function (K, zeros, polos) {
    var a = -3, b = 3, n = 6000, wc = NaN, w180 = NaN, i, ant = null;
    for (i = 0; i <= n; i++) {
      var lg = a + (b - a) * i / n, w = Math.pow(10, lg), r = CS.bodeZP(K, zeros, polos, w);
      if (ant) {
        if (ant.db > 0 && r.db <= 0) wc = Math.pow(10, ant.lg + (lg - ant.lg) * ant.db / (ant.db - r.db));
        if (isNaN(w180) && ant.fase > -180 && r.fase <= -180) w180 = Math.pow(10, ant.lg + (lg - ant.lg) * (ant.fase + 180) / (ant.fase - r.fase));
      }
      ant = { lg: lg, db: r.db, fase: r.fase };
    }
    return { wc: wc, w180: w180, MF: isNaN(wc) ? NaN : 180 + CS.bodeZP(K, zeros, polos, wc).fase, MG: isNaN(w180) ? Infinity : -CS.bodeZP(K, zeros, polos, w180).db };
  };

  /* ---------- plantas do lugar das raízes ---------- */
  function cx(re, im) { return { re: re, im: im || 0 }; }
  CS.LGR = {
    a: { nome: '1/[s(s + 2)]', zeros: [], polos: [cx(0), cx(-2)], x: [-5, 2], y: [-4, 4] },
    b: { nome: '1/[s(s + 1)(s + 2)]', zeros: [], polos: [cx(0), cx(-1), cx(-2)], x: [-5, 2], y: [-4, 4] },
    c: { nome: '(s + 3)/[s(s + 1)]', zeros: [cx(-3)], polos: [cx(0), cx(-1)], x: [-8, 2], y: [-5, 5] },
    d: { nome: '1/[s(s + 4)(s² + 4s + 20)]', zeros: [], polos: [cx(0), cx(-4), cx(-2, 4), cx(-2, -4)], x: [-8, 4], y: [-7, 7] }
  };
  CS.polRaizes = function (l) {
    var p = [1];
    l.forEach(function (r) { if (r.im === 0) p = CS.pmul(p, [1, -r.re]); else if (r.im > 0) p = CS.pmul(p, [1, -2 * r.re, r.re * r.re + r.im * r.im]); });
    return p;
  };
  CS.malhaLGR = function (pl, K) { var N = CS.pesc(CS.polRaizes(pl.zeros), K), D = CS.padd(CS.polRaizes(pl.polos), N); return { num: N, den: D, polos: CS.raizes(D) }; };
  CS.Kcrit = function (pl) {
    var maxRe = function (K) { return Math.max.apply(null, CS.malhaLGR(pl, K).polos.map(function (r) { return r.re; })); }, a = 1e-3, b = 1e5, i, K0 = null;
    for (i = 0; i <= 500; i++) { var K = a * Math.pow(b / a, i / 500); if (maxRe(K) > 1e-6) { K0 = K; break; } }
    if (K0 === null) return Infinity;
    var lo = i ? a * Math.pow(b / a, (i - 1) / 500) : a, hi = K0;
    for (i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (maxRe(m) > 1e-6) hi = m; else lo = m; }
    return hi;
  };

  global.CS = CS;
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
  function xis(c, x, y, tam) { c.beginPath(); c.moveTo(x - tam, y - tam); c.lineTo(x + tam, y + tam); c.moveTo(x - tam, y + tam); c.lineTo(x + tam, y - tam); c.stroke(); }

  function montarSegunda() {
    if (!document.getElementById('sim-segunda')) return;
    var A = animador(function (a) { desenha(a); }, 30);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var ciclo = 190, f = (a.t % ciclo) / (ciclo - 25), tv = Math.min(1, f) * d.s.T, y = CS.y2(d.z, d.wn, tv), g = a.ctx.plot('anim').clear();
      g.setLimits([-0.6, 12.6], [-1.2, 3.2]);
      g.custom(function (c, pl) {
        var X = function (v) { return pl.px(v); }, Y = function (v) { return pl.py(v); }, x0 = 5.3, esc = 3, xm = x0 + esc * y;
        c.fillStyle = cor(7); c.globalAlpha = 0.35; c.fillRect(X(-0.4), Y(2.4), X(0) - X(-0.4), Y(-0.1) - Y(2.4)); c.fillRect(X(-0.4), Y(-0.1), X(12.4) - X(-0.4), 7); c.globalAlpha = 1;
        c.strokeStyle = cor(7); c.lineWidth = 2; c.beginPath(); var nv = 8, xa = 0, xb = xm - 0.9, yM = 1.65, amp = 0.2, i; c.moveTo(X(xa), Y(yM));
        for (i = 0; i < nv * 2; i++) c.lineTo(X(xa + (xb - xa) * (i + 0.5) / (nv * 2)), Y(yM + (i % 2 ? -amp : amp))); c.lineTo(X(xb), Y(yM)); c.stroke();
        var yd = 0.62, med = xb * 0.5; c.strokeStyle = cor(3); c.lineWidth = 2.2; c.beginPath(); c.moveTo(X(0), Y(yd)); c.lineTo(X(med), Y(yd)); c.moveTo(X(med), Y(yd + 0.3)); c.lineTo(X(med), Y(yd - 0.3)); c.moveTo(X(xb), Y(yd)); c.lineTo(X(med + 0.25), Y(yd)); c.moveTo(X(med - 0.45), Y(yd + 0.4)); c.lineTo(X(med + 0.3), Y(yd + 0.4)); c.moveTo(X(med - 0.45), Y(yd - 0.4)); c.lineTo(X(med + 0.3), Y(yd - 0.4)); c.moveTo(X(med + 0.3), Y(yd + 0.4)); c.lineTo(X(med + 0.3), Y(yd - 0.4)); c.stroke();
        c.fillStyle = cor(0); c.globalAlpha = 0.85; c.fillRect(X(xm - 0.9), Y(2.3), X(xm + 0.9) - X(xm - 0.9), Y(0) - Y(2.3)); c.globalAlpha = 1;
        c.strokeStyle = cor(1); c.lineWidth = 1.5; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(X(x0 + esc), Y(2.65)); c.lineTo(X(x0 + esc), Y(-0.1)); c.stroke(); c.setLineDash([]);
        c.fillStyle = texto(a); c.font = '12px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('posição final', X(x0 + esc), Y(2.65) - 5);
        c.textAlign = 'left'; c.fillText('t = ' + nt(tv, 2) + ' s', X(0.2), Y(3.2) + 14); c.fillText('y = ' + nt(y, 3), X(0.2), Y(3.2) + 31);
        c.fillStyle = cor(1); c.beginPath(); c.arc(X(xm), Y(-0.65), 0, 0, 7); c.fill();
      });
      g.draw();
      var gy = a.ctx.plot('y').clear(), s = d.s;
      gy.setLimits([0, s.T], [0, Math.max(1.3, 1 + s.Mp / 100 * 1.15)]);
      gy.line(d.ts, d.ys, { color: cor(0), width: 2.6, label: 'y(t)' });
      gy.hline(1, { color: cor(7), width: 1.2, dash: [6, 4] });
      if (d.z > 0) { gy.hline(1.02, { color: cor(1), width: 1, dash: [3, 4] }); gy.hline(0.98, { color: cor(1), width: 1, dash: [3, 4], text: 'faixa de 2 %' }); }
      gy.points([tv], [y], { color: cor(3), r: 5.5 });
      gy.draw();
    }
    Sim.build('#sim-segunda', {
      titulo: '1. Resposta de segunda ordem e polos no plano s',
      descricao: 'Mova o amortecimento e a frequência natural: os polos andam no plano s, e a massa e a curva mostram o resultado.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'ζ = 0,4 e ωn = 16 rad/s', valores: { z: 0.4, wn: 16 } },
        { nome: '2 · Pouco amortecido', desc: 'Sobressinal alto', valores: { z: 0.1, wn: 4 } },
        { nome: '3 · Crítico', desc: 'O mais rápido sem ultrapassar', valores: { z: 1, wn: 4 } },
        { nome: '4 · Superamortecido', desc: 'Lento, polos reais', valores: { z: 1.8, wn: 4 } }
      ],
      controles: [
        { id: 'z', label: 'Fator de amortecimento ζ', min: 0, max: 2, step: 0.01, valor: 0.4 },
        { id: 'wn', label: 'Frequência natural ωn', min: 0.5, max: 20, step: 0.1, valor: 4, unidade: 'rad/s' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'Massa, mola e amortecedor', height: 210, grid: false, legend: false, xticks: 0, yticks: 0 },
        { id: 'y', titulo: 'Resposta ao degrau unitário', xlabel: 'tempo (s)', ylabel: 'y(t)', aspect: 0.42, legend: false },
        { id: 'plano', titulo: 'Polos em malha fechada', xlabel: 'parte real σ', ylabel: 'parte imaginária jω', aspect: 0.62, legend: false }
      ],
      saidas: [{ id: 'cl', label: 'Natureza' }, { id: 'wd', label: 'Frequência amortecida ωd' }, { id: 'tp', label: 'Tempo de pico' }, { id: 'mp', label: 'Sobressinal' }, { id: 'tr', label: 'Subida (10 a 90 %)' }, { id: 'ts', label: 'Acomodação (2 %)' }],
      formulas: [
        { tex: 'G(s) = \\frac{\\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}', d: 'forma padrão', destaque: true },
        { tex: 't_p = \\frac{\\pi}{\\omega_d}', d: 'tempo de pico' },
        { tex: 'M_p = e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}', d: 'sobressinal, só depende de ζ' }
      ],
      nota: 'Resposta analítica da forma padrão, sem zeros. A acomodação e a subida são medidas numericamente na curva exata; a estimativa 4/(ζωn) aparece no passo a passo.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var s = CS.segunda(p.z, p.wn), ts = Plot.linspace(0, s.T, 500), ys = ts.map(function (t) { return CS.y2(p.z, p.wn, t); });
        A.dados = { s: s, z: p.z, wn: p.wn, ts: ts, ys: ys };
        desenha(A);
        var g = ctx.plot('plano').clear(), R = Math.max(p.wn * 1.25, 2), lim = Math.max(R, p.z > 1 ? p.wn * (p.z + Math.sqrt(p.z * p.z - 1)) * 1.1 : R);
        g.setLimits([-lim, lim * 0.3], [-R, R]);
        g.area([-lim, 0], [R, R], { base: -R, color: cor(2), alpha: 0.06 });
        var polos = p.z < 1 ? [[-s.sig, s.wd], [-s.sig, -s.wd]] : [[-p.wn * (p.z - Math.sqrt(p.z * p.z - 1)), 0], [-p.wn * (p.z + Math.sqrt(p.z * p.z - 1)), 0]];
        g.custom(function (c, pl) { c.strokeStyle = cor(3); c.lineWidth = 2.6; polos.forEach(function (q) { xis(c, pl.px(q[0]), pl.py(q[1]), 7); }); });
        g.draw();
        ctx.setPassos([
          { t: '① Os polos', obs: p.z < 1 ? 'Complexos em −' + nt(s.sig, 2) + ' ± j' + nt(s.wd, 2) + '.' : 'Reais em ' + nt(polos[0][0], 2) + ' e ' + nt(polos[1][0], 2) + '.' },
          { t: '② O sobressinal', obs: p.z < 1 ? 'Depende só de ζ: ' + nt(s.Mp, 1) + ' %, atingido em ' + nt(s.tp, 3) + ' s.' : 'Polos reais: a resposta não ultrapassa o valor final.' },
          { t: '③ A acomodação', obs: p.z > 0 && p.z < 1 ? 'A estimativa 4/(ζωn) dá ' + nt(s.ts2a, 3) + ' s; na curva exata são ' + nt(s.ts2, 3) + ' s.' : p.z <= 0 ? 'Sem amortecimento, a oscilação nunca termina.' : 'Medida na curva exata: ' + nt(s.ts2, 3) + ' s.' }
        ]);
        return { cl: { v: p.z <= 0 ? 'sem amort.' : p.z < 1 ? 'subamort.' : Math.abs(p.z - 1) < 1e-6 ? 'crítico' : 'superamort.', classe: p.z <= 0 ? 'alerta' : '' }, wd: { v: s.wd, u: 'rad/s' }, tp: { v: s.tp, u: 's' }, mp: { v: s.Mp, u: '%', classe: 'destaque' }, tr: { v: s.tr, u: 's' }, ts: { v: s.ts2, u: 's', classe: p.z <= 0 ? 'alerta' : '' } };
      }
    });
  }

  function montarPID() {
    if (!document.getElementById('sim-pid')) return;
    var A = animador(function (a) { desenha(a); }, 40);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var n = d.R.t.length, i = Math.min(n - 1, Math.floor(((a.t % 260) / 230) * (n - 1))), y = d.R.y[i], u = d.R.u[i], g = a.ctx.plot('anim').clear(), topo = Math.max(1.5, d.r * 1.5, d.ymaxV);
      g.setLimits([0, 12], [0, 10]);
      g.custom(function (c, pl) {
        var X = function (v) { return pl.px(v); }, Y = function (v) { return pl.py(v); }, Yv = function (v) { return 0.8 + 7.6 * Math.max(0, Math.min(1, v / topo)); };
        c.strokeStyle = cor(7); c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(1.2), Y(8.6)); c.lineTo(X(1.2), Y(0.8)); c.lineTo(X(4.4), Y(0.8)); c.lineTo(X(4.4), Y(8.6)); c.stroke();
        c.fillStyle = cor(0); c.globalAlpha = 0.55; c.fillRect(X(1.3), Y(Yv(y)), X(4.3) - X(1.3), Y(0.85) - Y(Yv(y))); c.globalAlpha = 1;
        c.strokeStyle = cor(1); c.lineWidth = 2; c.setLineDash([7, 4]); c.beginPath(); c.moveTo(X(0.6), Y(Yv(d.r))); c.lineTo(X(5), Y(Yv(d.r))); c.stroke(); c.setLineDash([]);
        var um = Math.max(d.umaxTela, 1e-6), xm = 7.6, xb = 11.2, frac = Math.min(1, Math.abs(u) / um);
        c.fillStyle = cor(7); c.globalAlpha = 0.25; c.fillRect(X(xm), Y(5.4), X(xb) - X(xm), Y(4.2) - Y(5.4)); c.globalAlpha = 1;
        c.fillStyle = Math.abs(u) >= um * 0.999 ? cor(3) : cor(2); c.fillRect(X(xm), Y(5.4), (X(xb) - X(xm)) * frac, Y(4.2) - Y(5.4));
        c.fillStyle = texto(a); c.font = '12px system-ui, sans-serif'; c.textAlign = 'left';
        c.fillText('saída y = ' + nt(y, 2), X(xm - 1.4), Y(8.2)); c.fillText('referência r = ' + nt(d.r, 2), X(xm - 1.4), Y(7.2)); c.fillText('t = ' + nt(d.R.t[i], 1) + ' s', X(xm - 1.4), Y(6.2));
        c.fillText('atuador', X(xm - 1.4), Y(4.6)); c.fillText('u = ' + nt(u, 2) + (Math.abs(u) >= d.umax * 0.999 ? ' (saturado)' : ''), X(xm), Y(3.3));
      });
      g.draw();
      var gy = a.ctx.plot('y'); gy.items = gy.items.filter(function (it) { return !it.cursor; }); gy.items.push({ type: 'points', xs: [d.R.t[i]], ys: [y], r: 5, color: cor(3), cursor: true }); gy.draw();
    }
    Sim.build('#sim-pid', {
      titulo: '2. Malha de controle PID',
      descricao: 'Ajuste os três ganhos, limite o atuador e aplique uma perturbação no instante 40 s. Compare o erro em regime, o sobressinal e o esforço de controle.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Só proporcional', desc: 'Sobra erro', valores: { pl: 'p1', Kp: 4, Ki: 0, Kd: 0, r: 1, d: 0.3, umax: 50, med: true, aw: true } },
        { nome: '2 · PI', desc: 'Erro nulo', valores: { pl: 'p1', Kp: 4, Ki: 0.4, Kd: 0, r: 1, d: 0.3, umax: 50, med: true, aw: true } },
        { nome: '3 · Ziegler-Nichols', desc: 'PID em 3ª ordem', valores: { pl: 'p3', Kp: 11.44, Ki: 2.49, Kd: 13.2, r: 1, d: 0.3, umax: 50, med: false, aw: true } },
        { nome: '4 · Windup', desc: 'Atuador limitado', valores: { pl: 'p2', Kp: 3, Ki: 1, Kd: 0, r: 1, d: 0, umax: 1.5, med: true, aw: false } }
      ],
      controles: [
        { id: 'pl', tipo: 'select', label: 'Planta', valor: 'p2', opcoes: Object.keys(CS.PLANTAS).map(function (k) { return { v: k, t: CS.PLANTAS[k].nome + ': ' + CS.PLANTAS[k].eq }; }) },
        { id: 'Kp', label: 'Ganho proporcional Kp', min: 0, max: 30, step: 0.01, valor: 4 },
        { id: 'Ki', label: 'Ganho integral Ki', min: 0, max: 4, step: 0.01, valor: 0.5, unidade: '1/s' },
        { id: 'Kd', label: 'Ganho derivativo Kd', min: 0, max: 20, step: 0.1, valor: 2, unidade: 's' },
        { tipo: 'separador' },
        { id: 'r', label: 'Referência r', min: 0.2, max: 2, step: 0.1, valor: 1 },
        { id: 'd', label: 'Perturbação em 40 s', min: -1, max: 1, step: 0.05, valor: 0.3 },
        { id: 'umax', label: 'Limite do atuador', min: 0.5, max: 50, step: 0.1, valor: 50 },
        { id: 'med', tipo: 'check', label: 'Derivada sobre a medida', valor: true },
        { id: 'aw', tipo: 'check', label: 'Anti-windup', valor: true },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'O processo', height: 240, grid: false, legend: false, xticks: 0, yticks: 0 },
        { id: 'y', titulo: 'Saída', xlabel: 'tempo (s)', ylabel: 'y(t)', aspect: 0.42, legendPos: 'bottomright' },
        { id: 'u', titulo: 'Sinal de controle', xlabel: 'tempo (s)', ylabel: 'u(t)', aspect: 0.32, legend: false }
      ],
      saidas: [{ id: 'yf', label: 'Saída antes da perturbação' }, { id: 'ess', label: 'Erro em regime' }, { id: 'mp', label: 'Sobressinal' }, { id: 'ts', label: 'Acomodação (2 %)' }, { id: 'um', label: 'Maior |u|' }, { id: 'sat', label: 'Tempo saturado' }],
      formulas: [{ tex: 'u(t) = K_p e + K_i \\int e\\,dt + K_d \\frac{de}{dt}', d: 'lei de controle', destaque: true }],
      nota: 'Integração no tempo com passo de 0,01 s e atuador saturado. A derivada usa filtro de primeira ordem com constante de 0,1 s; sem ele, o ganho derivativo amplificaria ruído sem limite. A perturbação entra na entrada da planta.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var pl = CS.PLANTAS[p.pl], R = CS.pid({ planta: pl, Kp: p.Kp, Ki: p.Ki, Kd: p.Kd, r: p.r, d: p.d, dt0: 40, umax: p.umax, dMedida: !!p.med, antiwindup: !!p.aw, T: 60, n: 6000 });
        var iA = 3990, yf = R.y[iA], ess = p.r - yf, faixa = 0.02 * p.r, ymax = 0, ts = 0, i, osc = 0;
        for (i = 0; i <= iA; i++) { ymax = Math.max(ymax, R.y[i]); if (Math.abs(R.y[i] - yf) > faixa) ts = R.t[i]; }
        for (i = iA - 400; i <= iA; i++) osc = Math.max(osc, Math.abs(R.y[i] - yf));
        var conv = !R.instavel && osc < 2 * faixa, mp = Math.max(0, 100 * (ymax - p.r) / p.r);
        var cont = 0; var um = Math.max.apply(null, R.u.map(Math.abs)); var umT = Math.min(p.umax, Math.max(um, 1));
        var vmax = Math.max.apply(null, R.y.map(function (v) { return isFinite(v) ? Math.abs(v) : 0; }));
        A.dados = { R: R, r: p.r, umax: p.umax, umaxTela: umT, ymaxV: Math.min(vmax * 1.1, 5 * p.r) };
        var yt = Math.min(Math.max(1.5 * p.r, vmax * 1.1), 6 * p.r), g = ctx.plot('y').clear();
        g.setLimits([0, 60], [Math.min(0, -0.1 * p.r), yt]);
        g.line(R.t, R.y, { color: cor(0), width: 2.4, label: 'saída y' });
        g.hline(p.r, { color: cor(1), width: 1.5, dash: [6, 4], label: 'referência' });
        if (p.d !== 0) g.vline(40, { color: cor(7), width: 1.2, dash: [3, 4], text: 'perturbação' });
        g.draw();
        var gu = ctx.plot('u').clear(), umx = Math.max(um * 1.15, 0.5);
        gu.setLimits([0, 60], [Math.min(-0.15 * umx, Math.min.apply(null, R.u) * 1.15), umx]);
        gu.line(R.t, R.u, { color: cor(2), width: 2 });
        gu.draw();
        desenha(A);
        ctx.setPassos([
          { t: '① Proporcional', obs: p.Ki === 0 && !pl.integ ? 'Sem ação integral e sem integrador na planta, sobra erro em regime.' : 'A malha tem integrador: o erro ao degrau tende a zero.' },
          { t: '② Esforço de controle', obs: 'Maior sinal de controle: ' + nt(um, 2) + (R.tsat > 0.05 ? '; o atuador ficou ' + nt(R.tsat, 1) + ' s saturado.' : '; o atuador não saturou.') },
          { t: '③ Estabilidade', obs: R.instavel ? 'A saída diverge: a malha é instável com estes ganhos.' : conv ? 'A malha acomoda antes da perturbação.' : 'A saída ainda oscila em 40 s: reduza os ganhos ou aumente o amortecimento.' }
        ]);
        cont = conv ? 1 : 0;
        return { yf: { v: R.instavel ? '—' : Math.round(yf * 1000) / 1000 }, ess: { v: R.instavel ? '—' : Math.round(ess * 1000) / 1000, classe: Math.abs(ess) < 0.01 * p.r && cont ? 'ok' : 'alerta' }, mp: { v: R.instavel ? '—' : mp, u: R.instavel ? '' : '%', classe: 'destaque' }, ts: { v: conv ? ts : '—', u: conv ? 's' : '' }, um: { v: um }, sat: { v: R.tsat, u: 's', classe: R.tsat > 0.05 ? 'alerta' : '' } };
      }
    });
  }

  function montarLGR() {
    if (!document.getElementById('sim-lgr')) return;
    var A = animador(function (a) { desenha(a); }, 45);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var ciclo = 240, f = a.t % ciclo; f = f < ciclo / 2 ? f / (ciclo / 2) : 2 - f / (ciclo / 2);
      var Kv = Math.pow(10, -2 + f * 5), v = a.on ? CS.malhaLGR(d.pl, Kv).polos : [], g = a.ctx.plot('plano').clear();
      g.setLimits(d.pl.x, d.pl.y);
      g.area([d.pl.x[0], 0], [d.pl.y[1], d.pl.y[1]], { base: d.pl.y[0], color: cor(2), alpha: 0.06 });
      g.points(d.xs, d.ys, { color: cor(0), r: 1.3 });
      g.custom(function (c, pl) {
        c.strokeStyle = cor(7); c.lineWidth = 2.2; d.pl.polos.forEach(function (q) { xis(c, pl.px(q.re), pl.py(q.im), 6); });
        d.pl.zeros.forEach(function (q) { c.beginPath(); c.arc(pl.px(q.re), pl.py(q.im), 6.5, 0, 7); c.stroke(); });
        if (a.on) { c.strokeStyle = cor(1); c.lineWidth = 1.8; v.forEach(function (q) { c.beginPath(); c.arc(pl.px(q.re), pl.py(q.im), 5, 0, 7); c.stroke(); }); }
        c.fillStyle = cor(3); d.polos.forEach(function (q) { c.fillRect(pl.px(q.re) - 5, pl.py(q.im) - 5, 10, 10); });
        if (a.on) { c.fillStyle = texto(a); c.font = '12px system-ui, sans-serif'; c.textAlign = 'left'; c.fillText('varredura: K = ' + nt(Kv, Kv < 1 ? 3 : 1), pl.px(d.pl.x[0]) + 8, pl.py(d.pl.y[1]) + 16); }
      });
      g.draw();
    }
    Sim.build('#sim-lgr', {
      titulo: '3. Lugar das raízes',
      descricao: 'Escolha a planta e o ganho. Os quadrados são os polos em malha fechada no ganho escolhido; os círculos varrem o lugar das raízes de K pequeno a K grande.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Sempre estável', desc: 'Dois polos', valores: { pl: 'a', lk: 0.6 } },
        { nome: '2 · Exemplo do capítulo', desc: 'Limite em K = 6', valores: { pl: 'b', lk: 0.7 } },
        { nome: '3 · Efeito do zero', desc: 'O lugar é puxado', valores: { pl: 'c', lk: 0.5 } },
        { nome: '4 · Quatro polos', desc: 'Polos complexos', valores: { pl: 'd', lk: 1.8 } }
      ],
      controles: [
        { id: 'pl', tipo: 'select', label: 'Planta G(s)', valor: 'b', opcoes: Object.keys(CS.LGR).map(function (k) { return { v: k, t: 'G(s) = ' + CS.LGR[k].nome }; }) },
        { id: 'lk', label: 'Ganho, em escala log₁₀(K)', min: -2, max: 3, step: 0.01, valor: 0.3 },
        { id: 'animar', tipo: 'check', label: 'Varrer o lugar', valor: true }
      ],
      graficos: [
        { id: 'plano', titulo: 'Plano s', xlabel: 'parte real σ', ylabel: 'parte imaginária jω', aspect: 0.75, legend: false },
        { id: 'y', titulo: 'Resposta ao degrau em malha fechada', xlabel: 'tempo (s)', ylabel: 'y(t)', aspect: 0.42, legend: false }
      ],
      saidas: [{ id: 'K', label: 'Ganho K' }, { id: 'kc', label: 'K crítico' }, { id: 'est', label: 'Malha fechada' }, { id: 'dom', label: 'Polo dominante' }, { id: 'z', label: 'ζ do par dominante' }, { id: 'Mg', label: 'Margem de ganho até K crítico' }],
      formulas: [
        { tex: '1 + K\\,G(s) = 0', d: 'equação característica', destaque: true },
        { tex: '|K\\,G(s)| = 1,\\quad \\angle G(s) = \\pm 180^\\circ', d: 'condições de módulo e de ângulo' }
      ],
      nota: 'Raízes da equação característica calculadas numericamente em 900 ganhos. Quadrados: polos no ganho escolhido. Círculos: varredura. Cruzes e círculos cinzentos: polos e zeros de malha aberta. Retroalimentação unitária.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var pl = CS.LGR[p.pl], K = Math.pow(10, p.lk), xs = [], ys = [], i;
        for (i = 0; i <= 900; i++) { CS.malhaLGR(pl, Math.pow(10, -3 + i * 8 / 900)).polos.forEach(function (r) { xs.push(r.re); ys.push(r.im); }); }
        var M = CS.malhaLGR(pl, K), kc = CS.Kcrit(pl), maxRe = Math.max.apply(null, M.polos.map(function (r) { return r.re; })), est = maxRe < -1e-6;
        A.dados = { pl: pl, xs: xs, ys: ys, polos: M.polos };
        desenha(A);
        var dom = M.polos[0], lento = Math.abs(dom.re), T = !est ? 20 : Math.min(60, Math.max(2, 8 / lento)), R = CS.degrau(M.num, M.den, T, 4000), g = ctx.plot('y').clear();
        g.setLimits([0, T], [-0.4, 2.2]);
        var fin = M.num[M.num.length - 1] / M.den[M.den.length - 1];
        g.line(R.t, R.y, { color: cor(0), width: 2.4 });
        if (est) g.hline(fin, { color: cor(7), width: 1.2, dash: [6, 4] });
        g.draw();
        var zeta = dom.im !== 0 ? -dom.re / Math.hypot(dom.re, dom.im) : 1;
        ctx.setPassos([
          { t: '① Partida', obs: 'Com K pequeno, os polos em malha fechada ficam junto dos polos de malha aberta.' },
          { t: '② Ganho crescente', obs: pl.zeros.length ? 'O zero atrai um dos ramos e mantém o lugar à esquerda.' : 'Os ramos se afastam ao longo das assíntotas.' },
          { t: '③ Neste ganho', obs: est ? 'Estável: polo dominante em ' + nt(dom.re, 3) + (dom.im ? ' ± j' + nt(Math.abs(dom.im), 3) : '') + '.' : 'Há polo sobre o eixo imaginário ou à direita: a malha é instável ou marginal.' }
        ]);
        return { K: { v: K, classe: 'destaque' }, kc: { v: isFinite(kc) ? kc : 'não há' }, est: { v: est ? 'estável' : 'instável', classe: est ? 'ok' : 'alerta' }, dom: { v: est ? nt(dom.re, 3) + (dom.im ? ' ± j' + nt(Math.abs(dom.im), 3) : '') : '—' }, z: { v: est ? zeta : '—' }, Mg: { v: isFinite(kc) ? kc / K : 'infinita', classe: isFinite(kc) && kc <= K ? 'alerta' : '' } };
      }
    });
  }

  function iniciar() { montarSegunda(); montarPID(); montarLGR(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window);

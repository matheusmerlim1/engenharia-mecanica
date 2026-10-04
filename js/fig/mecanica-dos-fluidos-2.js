/* ============================================================
   Figuras ilustrativas de Mecânica dos Fluidos II
   Soluções exatas, semelhança, camada limite, separação, arrasto,
   asa, Fanno, Rayleigh, canais e lei da parede.
   Cada figura resolve as equações do capítulo ao desenhar.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var eng = function (v, n) {               /* 1,23 × 10⁵ */
    if (v === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    var sup = String(e).replace(/-/g, '⁻').replace(/[0-9]/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; });
    return fx(m, n == null ? 2 : n) + ' × 10' + sup;
  };

  /* ---------- 1.1 — as soluções exatas ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Os três perfis que se resolvem à mão: Couette é linear, Poiseuille e o filme são parabólicos. Em todos, o termo convectivo se anula e sobra uma equação ordinária (exemplo 1.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'caso', rot: 'Caso: 1 Couette · 2 Poiseuille · 3 filme', min: 1, max: 3, val: 2, passo: 1 },
      { id: 'h', rot: 'Altura do canal / filme', min: 2, max: 20, val: 10, passo: 1, un: 'mm' },
      { id: 'mu', rot: 'Viscosidade', min: 0.01, max: 1, val: 0.1, passo: 0.01, un: 'Pa·s' }
    ],
    desenhar: function (g, p) {
      var caso = Math.round(p.caso), h = p.h / 1000, mu = p.mu;
      var U = 1, G = 2000, rho = 900, th = Math.PI / 6;   /* placa a 1 m/s · 2 kPa/m · 30° */
      var u = function (y) {                               /* y em metros */
        if (caso === 1) return U * y / h;
        if (caso === 2) return G / (2 * mu) * y * (h - y);
        return rho * 9.81 * Math.sin(th) / (2 * mu) * (2 * h * y - y * y);
      };
      var umax = caso === 1 ? U : caso === 2 ? G * h * h / (8 * mu) : rho * 9.81 * Math.sin(th) * h * h / (2 * mu);
      var q = caso === 1 ? U * h / 2 : caso === 2 ? G * h * h * h / (12 * mu) : rho * 9.81 * Math.sin(th) * h * h * h / (3 * mu);
      var tw = caso === 1 ? mu * U / h : caso === 2 ? G * h / 2 : rho * 9.81 * Math.sin(th) * h;
      var x0 = 1.2, y0 = 0.6, H = 3.6, L = 4.4;
      g.linha(x0, y0, x0 + L, y0, { cor: 'forte', larg: 2.4 });
      g.hachura(x0, y0 - 0.04, L, 0, { cor: 'forte', d: 0.24 });
      if (caso !== 3) {
        g.linha(x0, y0 + H, x0 + L, y0 + H, { cor: 'forte', larg: 2.4 });
        g.hachura(x0 + L, y0 + H + 0.04, L, Math.PI, { cor: 'forte', d: 0.24 });
      } else {
        g.linha(x0, y0 + H, x0 + L, y0 + H, { cor: 's3', larg: 1.6, tracejado: [6, 4] });
        g.txt('superfície livre', x0 + L / 2, y0 + H + 0.3, { cor: 's3', tam: 10.5 });
      }
      if (caso === 1) g.seta(x0 + L * 0.3, y0 + H + 0.35, 1.1, 0, { cor: 'erro', larg: 2.2, rot: 'U = 1 m/s', rotTam: 11, rotDy: 0.42, rotDx: -0.2 });
      var i, pts = [];
      for (i = 0; i <= 30; i++) {
        var y = h * i / 30;
        pts.push([x0 + 3.2 * u(y) / umax, y0 + H * y / h]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6, preenche: 's1', alfa: 0.15 });
      for (i = 1; i <= 6; i++) {
        var yy = h * i / 7;
        g.seta(x0, y0 + H * yy / h, 3.2 * u(yy) / umax, 0, { cor: 's1', larg: 1.3, ponta: 0.14 });
      }
      g.linha(x0, y0, x0, y0 + H, { cor: 'fraco', larg: 1 });
      g.cota(x0 - 0.35, y0, x0 - 0.35, y0 + H, 'h = ' + fx(p.h, 0) + ' mm', { dx: -0.2, dy: 0 });
      var nome = caso === 1 ? 'Couette: placa superior arrastando' :
        caso === 2 ? 'Poiseuille: gradiente de 2 kPa/m' : 'Filme descendo plano a 30°';
      g.txt(nome, x0 + L / 2 + 0.3, y0 - 0.6, { cor: 'suave', tam: 11.5 });
      var xr = 6.9;
      g.txt(caso === 1 ? 'u = U y/h  (linear)' : caso === 2 ? 'u = (G/2µ)·y(h − y)' : 'u = (ρg senθ/2µ)(2hy − y²)',
        xr, 5.0, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('u máx = ' + fx(umax, 3) + ' m/s', xr, 4.2, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('vazão por metro q = ' + eng(q, 2) + ' m²/s', xr, 3.4, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('velocidade média ' + fx(q / h, 3) + ' m/s', xr, 2.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('tensão na parede ' + fx(tw, 2) + ' Pa', xr, 2.2, { cor: 'erro', tam: 12, alin: 'esq', negrito: true });
      var Re = rho * (q / h) * h / mu;
      g.txt('Re = ' + fx(Re, 1) + (Re < 2000 ? ' — laminar' : ' — já não é laminar'),
        xr, 1.5, { cor: Re < 2000 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('todas valem só para escoamento paralelo e plenamente desenvolvido', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — Froude contra Reynolds ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Com o mesmo fluido, Froude pede um modelo mais lento e Reynolds, mais rápido: as duas exigências divergem com a escala. É por isso que o ensaio de navio usa Froude e corrige o atrito por cálculo (exemplo 2.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'lam', rot: 'Escala 1:λ', min: 2, max: 50, val: 25, passo: 1 },
      { id: 'Up', rot: 'Velocidade do protótipo', min: 1, max: 20, val: 7.72, passo: 0.1, un: 'm/s' },
      { id: 'Lp', rot: 'Comprimento do protótipo', min: 10, max: 300, val: 100, passo: 5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var lam = p.lam, Up = p.Up, Lp = p.Lp, nu = 1e-6;
      var Lm = Lp / lam, Uf = Up / Math.sqrt(lam), Ur = Up * lam;
      var gx = 1.3, gy = 0.7, gw = 5.6, gh = 4.1;
      var X = function (l) { return gx + gw * (lim(l, 1, 50) - 1) / 49; };
      var Y = function (r) { return gy + gh * (Math.log10(lim(r, 0.1, 50)) + 1) / (Math.log10(50) + 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(1), gx + gw, Y(1), { cor: 'borda', larg: 1, tracejado: [5, 4] });
      g.txt('igual ao protótipo', gx + gw - 0.12, Y(1) + 0.24, { cor: 'fraco', tam: 10, alin: 'dir' });
      var i, a = [], b = [];
      for (i = 0; i <= 60; i++) {
        var l = 1 + 49 * i / 60;
        a.push([X(l), Y(1 / Math.sqrt(l))]);
        b.push([X(l), Y(l)]);
      }
      g.caminho(a, { cor: 's1', larg: 2.6 });
      g.caminho(b, { cor: 'erro', larg: 2.6 });
      g.txt('Froude: 1/√λ', X(27) + 0.15, Y(1 / Math.sqrt(27)) + 0.42, { cor: 's1', tam: 11, alin: 'esq', fundo: true });
      g.txt('Reynolds: λ', X(9) - 0.15, Y(9) + 0.2, { cor: 'erro', tam: 11, alin: 'dir', fundo: true });
      g.circ(X(lam), Y(1 / Math.sqrt(lam)), 0.14, { preenche: 's1', cor: null });
      g.circ(X(lam), Y(lam), 0.14, { preenche: 'erro', cor: null });
      g.linha(X(lam), gy, X(lam), gy + gh, { cor: 'suave', larg: 1, tracejado: [3, 3] });
      [10, 20, 30, 40, 50].forEach(function (l) {
        g.linha(X(l), gy, X(l), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(l + '', X(l), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('escala λ', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('U_m/U_p', gx - 0.24, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.6;
      g.txt('modelo de ' + fx(Lm, 2) + ' m', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('por Froude: ' + fx(Uf, 2) + ' m/s', xr, 4.2, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('por Reynolds: ' + fx(Ur, 1) + ' m/s', xr, 3.5, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('Re do protótipo ' + eng(Up * Lp / nu), xr, 2.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('Re do modelo (Froude) ' + eng(Uf * Lm / nu), xr, 2.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('razão de Reynolds ' + fx(Math.pow(lam, 1.5), 0) + '×', xr, 1.75, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('força escala com λ³ = ' + fx(Math.pow(lam, 3), 0), xr, 1.1, { cor: 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('água nos dois casos (ν = 10⁻⁶ m²/s): as duas exigências são incompatíveis', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — crescimento da camada limite ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'A camada limite cresce com √x enquanto laminar e, depois da transição, muito mais depressa. A escala vertical está exagerada: a camada é sempre fina diante do comprimento (exemplo 3.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'U', rot: 'Velocidade da corrente', min: 0.5, max: 40, val: 5, passo: 0.5, un: 'm/s' },
      { id: 'fluido', rot: 'Fluido: 1 ar · 2 água · 3 óleo', min: 1, max: 3, val: 1, passo: 1 },
      { id: 'L', rot: 'Comprimento da placa', min: 0.2, max: 4, val: 1, passo: 0.1, un: 'm' }
    ],
    desenhar: function (g, p) {
      var U = p.U, L = p.L, f = Math.round(p.fluido);
      var nu = f === 1 ? 1.51e-5 : f === 2 ? 1.0e-6 : 1.0e-4;
      var rho = f === 1 ? 1.2 : f === 2 ? 998 : 890;
      var nome = f === 1 ? 'ar a 20 °C' : f === 2 ? 'água a 20 °C' : 'óleo leve';
      var ReL = U * L / nu, xtr = 5e5 * nu / U;
      var dlam = function (x) { return x > 0 ? 4.91 * x / Math.sqrt(U * x / nu) : 0; };
      var dtur = function (x) { return x > 0 ? 0.16 * x / Math.pow(U * x / nu, 1 / 7) : 0; };
      var dfim = xtr >= L ? dlam(L) : dtur(L);
      var gx = 1.2, gy = 0.8, gw = 5.8, gh = 3.6;
      var dmax = Math.max(dlam(L), xtr < L ? dtur(L) : 0) * 1.15;
      var X = function (x) { return gx + gw * x / L; }, Y = function (d) { return gy + gh * lim(d / dmax, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'forte', larg: 2.4 });
      g.hachura(gx, gy - 0.04, gw, 0, { cor: 'forte', d: 0.24 });
      var i, a = [], b = [];
      for (i = 0; i <= 60; i++) {
        var x = L * i / 60;
        a.push([X(x), Y(dlam(x))]);
        b.push([X(x), Y(x < xtr ? dlam(x) : dtur(x))]);
      }
      g.caminho(a, { cor: 's1', larg: 1.8, tracejado: [5, 4] });
      g.caminho(b, { cor: 'erro', larg: 2.6 });
      if (xtr < L) {
        g.linha(X(xtr), gy, X(xtr), gy + gh, { cor: 'aviso', larg: 1.4, tracejado: [4, 4] });
        g.txt('transição em ' + fx(xtr, 2) + ' m', X(xtr) + 0.12, gy + gh - 0.25, { cor: 'aviso', tam: 10.5, alin: 'esq', fundo: true });
      } else {
        g.txt('laminar em toda a placa', gx + gw / 2, gy + gh - 0.25, { cor: 'ok', tam: 11, fundo: true });
      }
      g.txt('δ laminar (Blasius)', X(L) - 0.1, Y(dlam(L)) - 0.35, { cor: 's1', tam: 10.5, alin: 'dir', fundo: true });
      for (i = 1; i <= 4; i++) {
        var xx = L * i / 5, dd = xx < xtr ? dlam(xx) : dtur(xx);
        var j, pf = [];
        for (j = 0; j <= 12; j++) {
          var et = j / 12;
          var uu = xx < xtr ? (1.5 * et - 0.5 * et * et * et) : Math.pow(et, 1 / 7);
          pf.push([X(xx) + 0.55 * uu, gy + (Y(dd) - gy) * et]);
        }
        g.caminho(pf, { cor: 's3', larg: 1.4 });
        g.linha(X(xx), gy, X(xx), Y(dd), { cor: 'fraco', larg: 0.8 });
      }
      g.txt('x', gx + gw + 0.2, gy, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('δ (escala exagerada)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var cf = xtr >= L ? 1.328 / Math.sqrt(ReL) : 0.074 / Math.pow(ReL, 0.2);
      var D = cf * 0.5 * rho * U * U * L;
      var xr = 7.6;
      g.txt(nome + ' · Re_L = ' + eng(ReL), xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('δ na borda de fuga ' + fx(dfim * 1000, 2) + ' mm', xr, 4.3, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('δ* = ' + fx(1.72 * L / Math.sqrt(ReL) * 1000, 2) + ' mm · θ = ' + fx(0.664 * L / Math.sqrt(ReL) * 1000, 2) + ' mm',
        xr, 3.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('C_D = ' + eng(cf) + (xtr >= L ? '  (1,328/√Re)' : '  (0,074/Re^{1/5})'), xr, 2.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('arrasto de uma face ' + fx(D, 4) + ' N/m', xr, 2.2, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('δ/L = ' + fx(100 * dfim / L, 2) + ' % do comprimento', xr, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('transição adotada em Re_x = 5 × 10⁵ · placa lisa, sem gradiente de pressão', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — gradiente de pressão e separação ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Perfis de Pohlhausen: o gradiente adverso vai esvaziando o perfil junto à parede até o atrito zerar e o escoamento inverter. Λ = −12 é exatamente a separação.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'lam', rot: 'Parâmetro Λ (adverso ← → favorável)', min: -14, max: 12, val: 0, passo: 0.5 },
      { id: 'mostrar', rot: 'Mostrar os três de referência: 0 não · 1 sim', min: 0, max: 1, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var La = p.lam;
      var perfil = function (e, l) { return 2 * e - 2 * e * e * e + e * e * e * e + l / 6 * e * Math.pow(1 - e, 3); };
      var gx = 1.4, gy = 0.7, gw = 3.6, gh = 4.1;
      var X = function (u) { return gx + gw * lim(u, -0.25, 1.25) / 1.25; };
      var Y = function (e) { return gy + gh * e; };
      g.linha(X(0), gy, X(0), gy + gh, { cor: 'forte', larg: 2.4 });
      g.hachura(X(0) - 0.04, gy, gh, Math.PI / 2, { cor: 'forte', d: 0.22 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1 });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'borda', larg: 1, tracejado: [5, 4] });
      g.txt('u = U', X(1) + 0.1, gy + gh - 0.2, { cor: 'fraco', tam: 10, alin: 'esq' });
      var i, j, ref = [[-12, 'erro', 'Λ = −12 separação'], [0, 's3', 'Λ = 0 Blasius'], [7, 'ok', 'Λ = +7 favorável']];
      if (Math.round(p.mostrar)) {
        ref.forEach(function (r) {
          var pts = [];
          for (j = 0; j <= 40; j++) { var e = j / 40; pts.push([X(perfil(e, r[0])), Y(e)]); }
          g.caminho(pts, { cor: r[1], larg: 1.3, tracejado: [4, 3] });
        });
      }
      var pts = [];
      for (i = 0; i <= 40; i++) { var e = i / 40; pts.push([X(perfil(e, La)), Y(e)]); }
      g.caminho(pts.concat([[X(0), Y(1)], [X(0), Y(0)]]), { cor: 's1', larg: 2.8, preenche: 's1', alfa: 0.15 });
      var tw = (2 + La / 6);                       /* ∝ (du/dy) na parede */
      g.txt('y/δ', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('u/U', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      if (Math.round(p.mostrar)) {
        g.txt('Λ = −12', X(perfil(0.35, -12)) - 0.12, Y(0.35), { cor: 'erro', tam: 10, alin: 'dir', fundo: true });
        g.txt('Λ = 0', X(perfil(0.55, 0)) + 0.12, Y(0.55), { cor: 's3', tam: 10, alin: 'esq', fundo: true });
        g.txt('Λ = +7', X(perfil(0.75, 7)) + 0.12, Y(0.75), { cor: 'ok', tam: 10, alin: 'esq', fundo: true });
      }
      /* corpo com o ponto de separação */
      var cx = 6.1, cy = 1.5;
      var perf = [];
      for (i = 0; i <= 40; i++) {
        var t = i / 40, xx = cx + 2.6 * t;
        perf.push([xx, cy + 1.1 * Math.sin(Math.PI * t)]);
      }
      g.caminho(perf, { cor: 'forte', larg: 2 });
      g.linha(cx, cy, cx + 2.6, cy, { cor: 'forte', larg: 2 });
      var ts = lim(0.5 + (-La) / 40, 0.5, 0.95);
      g.circ(cx + 2.6 * ts, cy + 1.1 * Math.sin(Math.PI * ts), 0.12, { preenche: La < -2 ? 'erro' : 'aviso', cor: null });
      g.txt(La < -2 ? 'separação' : 'ainda colada', cx + 2.6 * ts, cy + 1.1 * Math.sin(Math.PI * ts) + 0.4,
        { cor: La < -2 ? 'erro' : 'ok', tam: 10.5, fundo: true });
      g.seta(cx - 1.0, cy + 0.6, 0.7, 0, { cor: 's1', larg: 1.6, ponta: 0.18 });
      g.txt('pressão cai  →  pressão sobe', cx + 1.3, cy - 0.45, { cor: 'fraco', tam: 10.5 });
      var xr = 9.3;
      g.txt('Λ = ' + fx(La, 1), xr, 5.0, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('τ_w ∝ ' + fx(tw, 2), xr, 4.2, { cor: tw <= 0 ? 'erro' : 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt(La <= -12 ? 'atrito nulo: separa aqui' : La < 0 ? 'gradiente adverso' : La > 0 ? 'gradiente favorável' : 'sem gradiente (Blasius)',
        xr, 3.4, { cor: La <= -12 ? 'erro' : La < 0 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ponto de inflexão', xr, 2.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(La < 0 ? 'dentro da camada' : 'só na parede', xr, 2.15, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('turbulenta resiste', xr, 1.5, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('muito mais a Λ negativo', xr, 1.05, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('perfil quártico de Pohlhausen: u/U = 2η − 2η³ + η⁴ + (Λ/6)η(1 − η)³', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — C_D da esfera ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A curva clássica da esfera: Stokes à esquerda, platô em torno de 0,45 e a crise do arrasto perto de 3 × 10⁵, quando a camada limite fica turbulenta e a esteira encolhe.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'd', rot: 'Diâmetro da esfera', min: 1, max: 300, val: 50, passo: 1, un: 'mm' },
      { id: 'U', rot: 'Velocidade', min: 0.01, max: 60, val: 10, passo: 0.01, un: 'm/s' },
      { id: 'fluido', rot: 'Fluido: 1 ar · 2 água · 3 óleo', min: 1, max: 3, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var f = Math.round(p.fluido);
      var nu = f === 1 ? 1.51e-5 : f === 2 ? 1.0e-6 : 1.0e-4;
      var rho = f === 1 ? 1.2 : f === 2 ? 998 : 890;
      var d = p.d / 1000, U = p.U, Re = U * d / nu;
      function CD(R) {
        if (R < 1e-3) R = 1e-3;
        var base = 24 / R * (1 + 0.15 * Math.pow(R, 0.687)) + 0.42 / (1 + 42500 * Math.pow(R, -1.16));
        if (R > 2e5) {                                   /* crise do arrasto */
          var t = lim((Math.log10(R) - Math.log10(2e5)) / (Math.log10(8e5) - Math.log10(2e5)), 0, 1);
          var pos = 0.10 + 0.06 * lim((Math.log10(R) - Math.log10(8e5)) / 1.1, 0, 1);
          return base * (1 - t) + pos * t;
        }
        return base;
      }
      var cd = CD(Re), A = Math.PI * d * d / 4, D = cd * 0.5 * rho * U * U * A;
      var gx = 1.3, gy = 0.7, gw = 6.0, gh = 4.2;
      var X = function (R) { return gx + gw * (Math.log10(lim(R, 1e-2, 1e7)) + 2) / 9; };
      var Y = function (c) { return gy + gh * (Math.log10(lim(c, 0.05, 1e3)) + 1.3) / 4.3; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 180; i++) {
        var R = Math.pow(10, -2 + 9 * i / 180);
        pts.push([X(R), Y(CD(R))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      var st = [];
      for (i = 0; i <= 30; i++) { var R2 = Math.pow(10, -2 + 3 * i / 30); st.push([X(R2), Y(24 / R2)]); }
      g.caminho(st, { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('C_D = 24/Re', X(0.3) + 0.1, Y(80) + 0.1, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.txt('crise do arrasto', X(4e5), Y(0.075), { cor: 'aviso', tam: 10.5, fundo: true });
      g.circ(X(Re), Y(cd), 0.15, { preenche: 'erro', cor: null });
      [-2, 0, 2, 4, 6].forEach(function (e) {
        var R = Math.pow(10, e);
        g.linha(X(R), gy, X(R), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt('10' + String(e).replace('-', '⁻').replace(/[0-9]/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; }),
          X(R), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.1, 1, 10, 100].forEach(function (c) {
        g.linha(gx, Y(c), gx - 0.14, Y(c), { cor: 'fraco', larg: 1 });
        g.txt(c < 1 ? '0,1' : fx(c, 0), gx - 0.26, Y(c), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('Reynolds', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('C_D', gx - 0.24, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.9;
      g.txt('Re = ' + eng(Re), xr, 5.0, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('C_D = ' + fx(cd, 3), xr, 4.3, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('arrasto D = ' + (D < 1 ? fx(D * 1000, 2) + ' mN' : fx(D, 2) + ' N'), xr, 3.5, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('potência U·D = ' + fx(D * U, 3) + ' W', xr, 2.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(Re < 1 ? 'regime de Stokes: C_D = 24/Re' : Re < 1e3 ? 'regime intermediário' :
        Re < 2e5 ? 'platô: C_D quase constante' : 'depois da crise do arrasto',
        xr, 2.1, { cor: Re < 1 ? 'info' : Re < 2e5 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('área frontal ' + eng(A) + ' m²', xr, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('correlação de Clift-Gauvin, com a crise do arrasto imposta acima de 2 × 10⁵', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — asa finita ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'A asa finita tem inclinação menor que a infinita e paga arrasto induzido. Quanto maior o alongamento, mais perto da teoria bidimensional e menor o induzido (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'AR', rot: 'Alongamento AR', min: 2, max: 20, val: 8, passo: 0.5 },
      { id: 'alfa', rot: 'Ângulo de ataque', min: -2, max: 18, val: 6, passo: 0.5, un: '°' },
      { id: 'e', rot: 'Fator de eficiência e', min: 0.6, max: 1, val: 0.85, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var AR = p.AR, al = p.alfa, e = p.e, alMax = 15;
      var a3 = 2 * Math.PI / (1 + 2 / AR);
      var cl2 = function (x) { return 2 * Math.PI * x * Math.PI / 180; };
      var cl3 = function (x) { return a3 * x * Math.PI / 180; };
      var estol = al > alMax;
      var cL = estol ? cl3(alMax) * (1 - 0.06 * (al - alMax)) : cl3(al);
      var cDi = cL * cL / (Math.PI * e * AR), cD0 = 0.012, cD = cD0 + cDi + (estol ? 0.04 * (al - alMax) : 0);
      var gx = 1.3, gy = 0.7, gw = 4.6, gh = 4.2;
      var X = function (x) { return gx + gw * (lim(x, -4, 20) + 4) / 24; };
      var Y = function (c) { return gy + gh * (lim(c, -0.3, 1.8) + 0.3) / 2.1; };
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 'fraco', larg: 1.2 });
      g.linha(X(0), gy, X(0), gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, A = [], B = [];
      for (i = 0; i <= 60; i++) {
        var x = -4 + 24 * i / 60;
        A.push([X(x), Y(cl2(x))]);
        B.push([X(x), Y(x > alMax ? cl3(alMax) * (1 - 0.06 * (x - alMax)) : cl3(x))]);
      }
      g.caminho(A, { cor: 'fraco', larg: 1.6, tracejado: [5, 4] });
      g.caminho(B, { cor: 's1', larg: 2.6 });
      g.txt('asa infinita (2π)', X(6) - 0.15, Y(cl2(6)) + 0.3, { cor: 'fraco', tam: 10, alin: 'dir', fundo: true });
      g.txt('AR = ' + fx(AR, 1), X(13) + 0.1, Y(cl3(13)) - 0.3, { cor: 's1', tam: 10.5, alin: 'esq', fundo: true });
      g.circ(X(al), Y(cL), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(alMax), gy, X(alMax), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [4, 4] });
      g.txt('estol', X(alMax) + 0.1, gy + gh - 0.2, { cor: 'aviso', tam: 10, alin: 'esq' });
      [0, 5, 10, 15, 20].forEach(function (x) {
        g.linha(X(x), Y(0), X(x), Y(0) - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(x + '°', X(x), Y(0) - 0.42, { cor: 'fraco', tam: 10 });
      });
      [0.5, 1.0, 1.5].forEach(function (c) {
        g.linha(X(0), Y(c), X(0) - 0.12, Y(c), { cor: 'fraco', larg: 1 });
        g.txt(fx(c, 1), X(0) - 0.22, Y(c), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('c_L', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('ângulo de ataque', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      /* polar */
      var px = 6.5, pw = 2.2;
      var PX = function (c) { return px + pw * lim(c, 0, 0.14) / 0.14; };
      g.linha(px, Y(0), px + pw, Y(0), { cor: 'fraco', larg: 1.2 });
      g.linha(px, gy, px, gy + gh, { cor: 'fraco', larg: 1.2 });
      var P = [];
      for (i = 0; i <= 50; i++) {
        var xx = -4 + 24 * i / 50;
        var c = xx > alMax ? cl3(alMax) * (1 - 0.06 * (xx - alMax)) : cl3(xx);
        P.push([PX(cD0 + c * c / (Math.PI * e * AR) + (xx > alMax ? 0.04 * (xx - alMax) : 0)), Y(c)]);
      }
      g.caminho(P, { cor: 's3', larg: 2.4 });
      g.circ(PX(cD), Y(cL), 0.14, { preenche: 'erro', cor: null });
      g.txt('polar c_L × c_D', px + pw / 2, gy - 0.5, { cor: 'fraco', tam: 10.5 });
      [0.05, 0.1].forEach(function (c) {
        g.linha(PX(c), Y(0), PX(c), Y(0) - 0.12, { cor: 'fraco', larg: 1 });
        g.txt(fx(c, 2), PX(c), Y(0) - 0.4, { cor: 'fraco', tam: 9.5 });
      });
      var xr = 9.4;
      g.txt('a = ' + fx(a3, 3) + ' /rad', xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('c_L = ' + fx(cL, 3), xr, 4.3, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('c_Di = ' + fx(cDi, 4), xr, 3.6, { cor: 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('c_D total = ' + fx(cD, 4), xr, 3.0, { cor: 'erro', tam: 12.5, alin: 'esq' });
      g.txt('eficiência L/D = ' + fx(cL / cD, 1), xr, 2.3, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt(estol ? 'acima do estol: c_L cai e c_D dispara' : 'regime linear', xr, 1.6,
        { cor: estol ? 'erro' : 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('c_D0 = 0,012 adotado', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('estol modelado a partir de 15°, só para mostrar a tendência', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — linha de Fanno ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'O atrito empurra o escoamento para Mach 1 vindo dos dois lados. A curva dá o comprimento que ainda cabe antes do bloqueio — e ele despenca à medida que o Mach se aproxima de 1 (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Ma', rot: 'Mach na entrada', min: 0.05, max: 3, val: 0.3, passo: 0.05 },
      { id: 'f', rot: 'Atrito de Fanning f', min: 2, max: 12, val: 5, passo: 0.5, un: '× 10⁻³' },
      { id: 'D', rot: 'Diâmetro do duto', min: 10, max: 300, val: 50, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var k = 1.4, Ma = p.Ma, ff = p.f / 1000, D = p.D / 1000;
      function fanno(M) {
        return (1 - M * M) / (k * M * M) + (k + 1) / (2 * k) * Math.log((k + 1) * M * M / (2 + (k - 1) * M * M));
      }
      var t = fanno(Ma), Lstar = t * D / (4 * ff);
      var gx = 1.3, gy = 0.7, gw = 6.0, gh = 4.2;
      var X = function (M) { return gx + gw * lim(M, 0, 3) / 3; };
      var Y = function (v) { return gy + gh * (Math.log10(lim(v, 1e-3, 100)) + 3) / 5; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, A = [], B = [];
      for (i = 1; i <= 60; i++) { var M = 0.995 * i / 60; A.push([X(M), Y(fanno(M))]); }
      for (i = 0; i <= 60; i++) { var M2 = 1.005 + 2 * i / 60; B.push([X(M2), Y(fanno(M2))]); }
      g.caminho(A, { cor: 's1', larg: 2.6 });
      g.caminho(B, { cor: 's3', larg: 2.6 });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'erro', larg: 1.4, tracejado: [4, 4] });
      g.txt('Ma = 1: bloqueio', X(1) + 0.12, gy + gh - 0.25, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.txt('subsônico acelera', X(0.45), gy + 0.45, { cor: 's1', tam: 10.5, fundo: true });
      g.txt('supersônico desacelera', X(2.1), gy + gh - 0.9, { cor: 's3', tam: 10.5, fundo: true });
      g.circ(X(Ma), Y(t), 0.15, { preenche: 'erro', cor: null });
      [0.5, 1, 1.5, 2, 2.5, 3].forEach(function (M) {
        g.linha(X(M), gy, X(M), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(M, 1), X(M), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.01, 0.1, 1, 10].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v < 1 ? fx(v, 2) : fx(v, 0), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('Mach', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('4fL*/D', gx - 0.24, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.9;
      g.txt('4fL*/D = ' + fx(t, 4), xr, 5.0, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('L* = ' + fx(Lstar, 2) + ' m', xr, 4.2, { cor: 'erro', tam: 15.5, alin: 'esq', negrito: true });
      g.txt('em diâmetros: ' + fx(Lstar / D, 0) + ' D', xr, 3.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('f de Darcy = ' + fx(4 * ff, 3), xr, 2.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(Ma < 1 ? 'subsônico: o atrito acelera' : 'supersônico: o atrito freia', xr, 2.2,
        { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('duto mais longo que L* reduz', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('a vazão até caber no comprimento', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ar com k = 1,4 · área constante e adiabático', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.2 — linha de Rayleigh ---------- */
  F('#fig-7-2', {
    titulo: 'Figura 7.2',
    legenda: 'Com troca de calor, aquecer sempre leva o Mach a 1. A curiosidade está entre 0,845 e 1: ali a temperatura estática cai enquanto se aquece, porque a aceleração consome mais do que o calor fornecido.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Ma', rot: 'Mach na entrada', min: 0.05, max: 3, val: 0.3, passo: 0.05 },
      { id: 'T0', rot: 'Temperatura de estagnação', min: 250, max: 900, val: 300, passo: 10, un: 'K' }
    ],
    desenhar: function (g, p) {
      var k = 1.4, Ma = p.Ma, T0 = p.T0, cp = 1005;
      var r0 = function (M) { return (k + 1) * M * M * (2 + (k - 1) * M * M) / Math.pow(1 + k * M * M, 2); };
      var rT = function (M) { return M * M * Math.pow((1 + k) / (1 + k * M * M), 2); };
      var Mt = 1 / Math.sqrt(k);
      var razao = r0(Ma), T0star = T0 / razao, q = cp * (T0star - T0) / 1000;
      var gx = 1.3, gy = 0.7, gw = 6.0, gh = 4.2;
      var X = function (M) { return gx + gw * lim(M, 0, 3) / 3; };
      var Y = function (v) { return gy + gh * lim(v, 0, 1.25) / 1.25; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, A = [], B = [];
      for (i = 0; i <= 90; i++) { var M = 0.02 + 2.98 * i / 90; A.push([X(M), Y(r0(M))]); B.push([X(M), Y(rT(M))]); }
      g.caminho(A, { cor: 'erro', larg: 2.6 });
      g.caminho(B, { cor: 's1', larg: 2.2, tracejado: [6, 4] });
      g.txt('T₀/T₀*', X(1.9), Y(r0(1.9)) + 0.32, { cor: 'erro', tam: 11, fundo: true });
      g.txt('T/T*', X(1.9), Y(rT(1.9)) - 0.32, { cor: 's1', tam: 11, fundo: true });
      g.linha(X(Mt), gy, X(Mt), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [4, 4] });
      g.txt('Ma = 1/√k = 0,845', X(Mt) - 0.12, Y(0.2), { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'fraco', larg: 1.2, tracejado: [4, 4] });
      g.linha(gx, Y(1), gx + gw, Y(1), { cor: 'borda', larg: 1, tracejado: [5, 4] });
      g.circ(X(Ma), Y(razao), 0.15, { preenche: 'erro', cor: null });
      [0.5, 1, 1.5, 2, 2.5, 3].forEach(function (M) {
        g.linha(X(M), gy, X(M), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(M, 1), X(M), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.25, 0.5, 0.75, 1].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 2), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('Mach', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('razão', gx - 0.24, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.9;
      g.txt('T₀/T₀* = ' + fx(razao, 4), xr, 5.0, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('T₀* = ' + fx(T0star, 0) + ' K', xr, 4.2, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('calor até bloquear', xr, 3.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('q* = ' + fx(q, 0) + ' kJ/kg', xr, 2.9, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt(Ma > Mt && Ma < 1 ? 'aqui aquecer esfria o gás' : Ma < 1 ? 'aquecer acelera e esquenta' : 'aquecer desacelera',
        xr, 2.1, { cor: Ma > Mt && Ma < 1 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('T₀ sempre sobe com o calor:', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('q = c_p (T₀₂ − T₀₁)', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ar com k = 1,4 e c_p = 1,005 kJ/kg·K · área constante e sem atrito', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — energia específica ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'A curva de energia específica tem um mínimo: a profundidade crítica. Acima dela o escoamento é fluvial; abaixo, torrencial — e a mesma energia serve às duas profundidades alternadas (exemplo 8.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'q', rot: 'Vazão por metro de largura', min: 0.5, max: 15, val: 5, passo: 0.5, un: 'm²/s' },
      { id: 'y', rot: 'Profundidade', min: 0.1, max: 6, val: 2.5, passo: 0.1, un: 'm' }
    ],
    desenhar: function (g, p) {
      var q = p.q, y = p.y, gr = 9.81;
      var yc = Math.pow(q * q / gr, 1 / 3), Emin = 1.5 * yc;
      var E = y + q * q / (2 * gr * y * y), Fr = (q / y) / Math.sqrt(gr * y);
      var ymax = Math.max(6, 2.2 * yc), Emax = Math.max(8, 2.6 * yc);
      var gx = 1.4, gy = 0.7, gw = 5.4, gh = 4.3;
      var X = function (e) { return gx + gw * lim(e, 0, Emax) / Emax; };
      var Y = function (v) { return gy + gh * lim(v, 0, ymax) / ymax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(X(0), Y(0), X(Math.min(Emax, ymax)), Y(Math.min(Emax, ymax)), { cor: 'borda', larg: 1.2, tracejado: [5, 4] });
      g.txt('E = y', X(ymax * 0.26) - 0.12, Y(ymax * 0.26) + 0.1, { cor: 'fraco', tam: 10, alin: 'dir', fundo: true });
      var i, pts = [];
      for (i = 1; i <= 120; i++) {
        var yy = ymax * i / 120;
        pts.push([X(yy + q * q / (2 * gr * yy * yy)), Y(yy)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(gx, Y(yc), gx + gw, Y(yc), { cor: 'aviso', larg: 1.3, tracejado: [4, 4] });
      g.txt('y_c = ' + fx(yc, 2) + ' m', gx + gw - 0.12, Y(yc) + 0.26, { cor: 'aviso', tam: 10.5, alin: 'dir' });
      g.linha(X(Emin), gy, X(Emin), gy + gh, { cor: 'aviso', larg: 1.3, tracejado: [4, 4] });
      g.circ(X(Emin), Y(yc), 0.13, { preenche: 'aviso', cor: null });
      g.circ(X(E), Y(y), 0.15, { preenche: 'erro', cor: null });
      g.txt('fluvial', X(Emax * 0.75), Y(ymax * 0.82), { cor: 'ok', tam: 10.5 });
      g.txt('torrencial', X(Emax * 0.75), Y(ymax * 0.12), { cor: 'erro', tam: 10.5 });
      [2, 4, 6, 8].forEach(function (e) {
        if (e > Emax) return;
        g.linha(X(e), gy, X(e), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(e + '', X(e), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [1, 2, 3, 4, 5, 6].forEach(function (v) {
        if (v > ymax) return;
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('energia específica E (m)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('y (m)', gx - 0.24, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.6;
      g.txt('y = ' + fx(y, 2) + ' m · v = ' + fx(q / y, 2) + ' m/s', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('E = ' + fx(E, 3) + ' m', xr, 4.3, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('Fr = ' + fx(Fr, 3), xr, 3.6, { cor: Fr > 1 ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt(Fr > 1.02 ? 'supercrítico: controle a montante' : Fr < 0.98 ? 'subcrítico: controle a jusante' : 'crítico',
        xr, 2.9, { cor: Fr > 1.02 ? 'erro' : Fr < 0.98 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('y_c = ∛(q²/g) = ' + fx(yc, 3) + ' m', xr, 2.2, { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('E mín = 1,5 y_c = ' + fx(Emin, 3) + ' m', xr, 1.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('alternada: ' + fx(alternada(q, y, gr), 2) + ' m', xr, 1.05, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('canal retangular · a energia é medida a partir do fundo', 6, -1.1, { cor: 'fraco', tam: 11 });
      function alternada(q, y, gr) {       /* a outra profundidade com a mesma energia */
        var E = y + q * q / (2 * gr * y * y), yc = Math.pow(q * q / gr, 1 / 3);
        var lo = y > yc ? 1e-4 : yc, hi = y > yc ? yc : 1e3, m;
        for (var i = 0; i < 80; i++) {
          m = (lo + hi) / 2;
          var Em = m + q * q / (2 * gr * m * m);
          if ((Em > E) === (y > yc)) lo = m; else hi = m;
        }
        return m;
      }
    }
  });

  /* ---------- 9.1 — ressalto hidráulico ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'O ressalto conserva a quantidade de movimento e destrói energia: quanto maior o Froude de entrada, maior o salto e maior a fração da energia que vira turbulência e calor (exemplo 9.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'q', rot: 'Vazão por metro de largura', min: 0.5, max: 12, val: 5, passo: 0.5, un: 'm²/s' },
      { id: 'y1', rot: 'Profundidade a montante', min: 0.1, max: 2, val: 0.5, passo: 0.05, un: 'm' }
    ],
    desenhar: function (g, p) {
      var q = p.q, y1 = p.y1, gr = 9.81;
      var v1 = q / y1, Fr1 = v1 / Math.sqrt(gr * y1);
      var y2 = y1 / 2 * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
      var dE = Math.pow(y2 - y1, 3) / (4 * y1 * y2);
      var E1 = y1 + q * q / (2 * gr * y1 * y1), E2 = E1 - dE;
      var Fr2 = (q / y2) / Math.sqrt(gr * y2);
      var esc = 3.0 / Math.max(y2, 0.3);
      var bx = 0.9, by = 0.6, bw = 6.4;
      g.linha(bx, by, bx + bw, by, { cor: 'forte', larg: 2.4 });
      g.hachura(bx, by - 0.04, bw, 0, { cor: 'forte', d: 0.24 });
      var xs = bx + bw * 0.42, i, pts = [[bx, by + y1 * esc]];
      for (i = 0; i <= 24; i++) {
        var t = i / 24;
        var yy = y1 + (y2 - y1) * (0.5 - 0.5 * Math.cos(Math.PI * t));
        pts.push([xs + 1.5 * t, by + yy * esc + (t > 0.1 && t < 0.95 ? 0.07 * Math.sin(18 * t) : 0)]);
      }
      pts.push([bx + bw, by + y2 * esc]);
      g.caminho(pts, { cor: 's1', larg: 2.4 });
      g.caminho(pts.concat([[bx + bw, by], [bx, by]]), { cor: null, preenche: 's1', alfa: 0.18, fechar: true });
      for (i = 0; i < 7; i++) {
        var fxr = xs + 0.15 + 1.25 * (i % 4) / 4, fyr = by + y1 * esc + 0.25 + 0.5 * (i % 3);
        if (fyr < by + y2 * esc) g.circ(fxr, fyr, 0.09 + 0.04 * (i % 3), { cor: 'fundo', larg: 1.1 });
      }
      g.seta(bx + 0.25, by + y1 * esc * 0.5, Math.min(1.4, 0.12 * v1), 0, { cor: 'erro', larg: 2, ponta: 0.18 });
      g.seta(bx + bw - 1.5, by + y2 * esc * 0.5, Math.min(1.2, 0.12 * q / y2), 0, { cor: 's3', larg: 2, ponta: 0.18 });
      g.cota(bx + 0.12, by, bx + 0.12, by + y1 * esc, 'y₁ = ' + fx(y1, 2) + ' m', { dx: 0.7, dy: 0 });
      g.cota(bx + bw - 0.12, by, bx + bw - 0.12, by + y2 * esc, 'y₂ = ' + fx(y2, 2) + ' m', { dx: -0.75, dy: 0 });
      g.txt('ressalto', xs + 0.75, by + y2 * esc + 0.45, { cor: 'aviso', tam: 11, fundo: true });
      var xr = 7.9;
      g.txt('Fr₁ = ' + fx(Fr1, 2), xr, 5.0, { cor: Fr1 > 1 ? 'erro' : 'aviso', tam: 14, alin: 'esq', negrito: true });
      g.txt(Fr1 < 1 ? 'já é subcrítico: não há ressalto' :
        Fr1 < 1.7 ? 'ressalto ondular' : Fr1 < 2.5 ? 'ressalto fraco' :
          Fr1 < 4.5 ? 'ressalto oscilante' : Fr1 < 9 ? 'ressalto estável' : 'ressalto forte',
        xr, 4.3, { cor: Fr1 < 1 ? 'aviso' : 'suave', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('y₂ = ' + fx(y2, 3) + ' m  (Fr₂ = ' + fx(Fr2, 2) + ')', xr, 3.6, { cor: 's3', tam: 12.5, alin: 'esq' });
      g.txt('E₁ = ' + fx(E1, 2) + ' m → E₂ = ' + fx(E2, 2) + ' m', xr, 2.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ΔE = ' + fx(dE, 3) + ' m', xr, 2.2, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('dissipa ' + fx(100 * dE / E1, 1) + ' % da energia', xr, 1.5, { cor: 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('potência por metro: ' + fx(9810 * q * dE / 1000, 1) + ' kW/m', xr, 1.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('conjugadas pela quantidade de movimento — Bernoulli não vale através do ressalto', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — lei da parede ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'A região de parede tem estrutura universal: subcamada viscosa, zona tampão e lei logarítmica. Onde cai o primeiro nó da malha decide se o modelo pode usar função de parede.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'yp', rot: 'y⁺ do primeiro nó da malha', min: 0.2, max: 500, val: 50, passo: 0.2 },
      { id: 'kap', rot: 'Constante de von Kármán κ', min: 0.38, max: 0.44, val: 0.41, passo: 0.005 }
    ],
    desenhar: function (g, p) {
      var yp = p.yp, kap = p.kap, B = 5.0;
      var ulog = function (y) { return Math.log(y) / kap + B; };
      /* lei única de Spalding: y⁺(u⁺), contínua da subcamada à região logarítmica */
      var yde = function (u) {
        var ku = kap * u;
        return u + Math.exp(-kap * B) * (Math.exp(ku) - 1 - ku - ku * ku / 2 - ku * ku * ku / 6);
      };
      var ude = function (y) {                 /* inverte por bisseção */
        var lo = 0, hi = 40, m;
        for (var i = 0; i < 60; i++) { m = (lo + hi) / 2; if (yde(m) < y) lo = m; else hi = m; }
        return m;
      };
      var uplus = ude(yp);
      var gx = 1.3, gy = 0.7, gw = 6.0, gh = 4.2;
      var X = function (y) { return gx + gw * (Math.log10(lim(y, 0.1, 1e4)) + 1) / 5; };
      var Y = function (u) { return gy + gh * lim(u, 0, 30) / 30; };
      g.ret(gx, gy, X(5) - gx, gh, { preenche: 'erro', cor: null, alfa: 0.08 });
      g.ret(X(5), gy, X(30) - X(5), gh, { preenche: 'aviso', cor: null, alfa: 0.08 });
      g.ret(X(30), gy, gx + gw - X(30), gh, { preenche: 'ok', cor: null, alfa: 0.08 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, A = [], L = [];
      for (i = 0; i <= 40; i++) { var y = Math.pow(10, -1 + 2.2 * i / 40); A.push([X(y), Y(y)]); }
      for (i = 0; i <= 60; i++) { var y2 = Math.pow(10, 0.3 + 3.7 * i / 60); L.push([X(y2), Y(ulog(y2))]); }
      g.caminho(A, { cor: 's1', larg: 2.2, tracejado: [5, 4] });
      g.caminho(L, { cor: 'erro', larg: 2.6 });
      var M = [];
      for (i = 0; i <= 100; i++) {
        var u3 = 0.1 + 24 * i / 100;
        M.push([X(yde(u3)), Y(u3)]);
      }
      g.caminho(M, { cor: 's3', larg: 2.2 });
      g.txt('u⁺ = y⁺', X(2.2) - 0.1, Y(8), { cor: 's1', tam: 10.5, alin: 'dir' });
      g.txt('u⁺ = ln(y⁺)/κ + 5', X(600), Y(ulog(600)) + 0.4, { cor: 'erro', tam: 10.5, fundo: true });
      g.txt('viscosa', X(1.4), gy + gh - 0.25, { cor: 'erro', tam: 10 });
      g.txt('tampão', X(12), gy + gh - 0.25, { cor: 'aviso', tam: 10 });
      g.txt('logarítmica', X(600), gy + gh - 0.25, { cor: 'ok', tam: 10 });
      g.circ(X(yp), Y(uplus), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(yp), gy, X(yp), Y(uplus), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      [0.1, 1, 10, 100, 1000, 1e4].forEach(function (y) {
        g.linha(X(y), gy, X(y), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(y >= 1000 ? (y === 1e4 ? '10⁴' : '10³') : fx(y, y < 1 ? 1 : 0), X(y), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [10, 20, 30].forEach(function (u) {
        g.linha(gx, Y(u), gx - 0.14, Y(u), { cor: 'fraco', larg: 1 });
        g.txt(u + '', gx - 0.26, Y(u), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('y⁺ (log)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('u⁺', gx - 0.24, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.9;
      g.txt('y⁺ = ' + fx(yp, 1), xr, 5.0, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('u⁺ ≈ ' + fx(uplus, 2), xr, 4.3, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt(yp < 5 ? 'dentro da subcamada viscosa' : yp <= 30 ? 'na zona tampão' : 'na região logarítmica',
        xr, 3.6, { cor: yp < 5 ? 'ok' : yp <= 30 ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(yp < 1 ? 'serve para resolver a parede (y⁺ < 1)' :
        yp < 30 ? 'malha ruim: evite o primeiro nó aqui' :
          yp <= 300 ? 'serve para função de parede (30–300)' : 'longe demais da parede',
        xr, 2.8, { cor: yp < 1 || (yp >= 30 && yp <= 300) ? 'ok' : 'erro', tam: 11, alin: 'esq', negrito: true });
      g.txt('zona tampão não é descrita', xr, 2.0, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('por nenhuma das duas leis —', xr, 1.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('por isso nenhum modelo gosta dela', xr, 1.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('escoamento turbulento plenamente desenvolvido, parede lisa', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

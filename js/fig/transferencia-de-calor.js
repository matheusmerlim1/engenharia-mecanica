/* ============================================================
   Figuras ilustrativas de Transferência de Calor
   Circuito térmico, raio crítico, aletas, transiente, convecção,
   ebulição, radiação e trocadores.
   Cada figura resolve as equações do capítulo ao desenhar.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var SIG = 5.67e-8;

  /* ---------- 1.1 — parede composta e circuito térmico ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'A parede e seu circuito térmico lado a lado. A barra mostra quanto cada camada pesa no total: é a maior resistência que decide a perda, não a camada mais grossa (exemplo 1.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'eiso', rot: 'Espessura do isolante', min: 0, max: 15, val: 5, passo: 0.5, un: 'cm' },
      { id: 'kiso', rot: 'Condutividade do isolante', min: 0.02, max: 0.5, val: 0.04, passo: 0.01, un: 'W/m·K' },
      { id: 'dT', rot: 'Diferença de temperatura', min: 2, max: 40, val: 11, passo: 1, un: '°C' }
    ],
    desenhar: function (g, p) {
      var hi = 8, he = 25, eiso = p.eiso / 100, kiso = p.kiso, dT = p.dT;
      var cam = [
        { nome: 'filme interno', R: 1 / hi, cor: 's4', esp: 0.02 },
        { nome: 'reboco', R: 0.02 / 0.8, cor: 'borda', esp: 0.02 },
        { nome: 'tijolo', R: 0.20 / 0.72, cor: 'acento', esp: 0.20 },
        { nome: 'isolante', R: eiso > 0 ? eiso / kiso : 0, cor: 'ok', esp: eiso },
        { nome: 'reboco', R: 0.02 / 0.8, cor: 'borda', esp: 0.02 },
        { nome: 'filme externo', R: 1 / he, cor: 's4', esp: 0.02 }
      ];
      var R = 0, i;
      cam.forEach(function (c) { R += c.R; });
      var U = 1 / R, q = dT / R;
      /* corte da parede */
      var x0 = 1.0, y0 = 2.0, H = 2.6, esc = 4.6 / Math.max(0.36, 0.26 + eiso);
      var x = x0;
      cam.forEach(function (c, k) {
        var w = (k === 0 || k === 5) ? 0.18 : c.esp * esc;
        if (w <= 0) return;
        g.ret(x, y0, w, H, { cor: 'forte', larg: 1.4, preenche: c.cor, alfa: k === 0 || k === 5 ? 0.25 : 0.45 });
        if (w > 0.45) g.txt(c.nome, x + w / 2, y0 - 0.32, { cor: 'fraco', tam: 9.5 });
        x += w;
      });
      g.txt('dentro', x0 - 0.1, y0 + H + 0.3, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.txt('fora', x - 0.1, y0 + H + 0.3, { cor: 'erro', tam: 10.5, alin: 'dir' });
      g.seta(x0 - 0.75, y0 + H / 2, 0.55, 0, { cor: 'erro', larg: 2, ponta: 0.18 });
      g.txt('q', x0 - 0.9, y0 + H / 2, { cor: 'erro', tam: 12, alin: 'dir', negrito: true });
      /* barra de resistências */
      var bx = 1.0, by = 0.9, bw = x - x0;
      var ac = 0;
      cam.forEach(function (c) {
        if (c.R <= 0) return;
        var w = bw * c.R / R;
        g.ret(bx + ac, by, w, 0.45, { cor: 'fundo', larg: 1, preenche: c.cor, alfa: 0.75 });
        if (w > 0.8) g.txt(fx(100 * c.R / R, 0) + ' %', bx + ac + w / 2, by + 0.22, { cor: 'texto', tam: 10 });
        ac += w;
      });
      g.txt('peso de cada resistência no total', bx + bw / 2, by - 0.35, { cor: 'fraco', tam: 10.5 });
      var xr = 7.4;
      g.txt('ΣR = ' + fx(R, 3) + ' m²·K/W', xr, 5.0, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('U = ' + fx(U, 3) + ' W/m²·K', xr, 4.3, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('q = ' + fx(q, 2) + ' W/m²', xr, 3.5, { cor: 'erro', tam: 15.5, alin: 'esq', negrito: true });
      var Rsem = R - (eiso > 0 ? eiso / kiso : 0);
      g.txt('sem isolante: ' + fx(dT / Rsem, 1) + ' W/m²', xr, 2.8, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt(eiso > 0 ? 'redução de ' + fx(100 * (1 - q / (dT / Rsem)), 1) + ' %' : 'sem isolante nenhum',
        xr, 2.2, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      var maior = cam[0];
      cam.forEach(function (c) { if (c.R > maior.R) maior = c; });
      g.txt('manda a resistência: ' + maior.nome, xr, 1.4, { cor: 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('h interno 8 e externo 25 W/m²·K · tijolo 20 cm com k = 0,72', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — raio crítico ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Em um tubo fino, o calor sobe ao acrescentar isolante até o raio crítico e só depois começa a cair. Para tubulação industrial o crítico já ficou para trás (exemplo 2.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'ri', rot: 'Raio do tubo', min: 1, max: 60, val: 2, passo: 1, un: 'mm' },
      { id: 'kiso', rot: 'Condutividade do isolante', min: 0.03, max: 0.4, val: 0.15, passo: 0.01, un: 'W/m·K' },
      { id: 'h', rot: 'Convecção externa h', min: 3, max: 50, val: 12, passo: 1, un: 'W/m²·K' }
    ],
    desenhar: function (g, p) {
      var ri = p.ri / 1000, k = p.kiso, h = p.h, dT = 60;
      var rcr = k / h;
      var rmax = Math.max(4 * rcr, 2.5 * ri, 0.02);
      var qq = function (re) {
        if (re <= ri) re = ri;
        return 2 * Math.PI * dT / (Math.log(re / ri) / k + 1 / (h * re));
      };
      var q0 = qq(ri), qc = qq(rcr > ri ? rcr : ri);
      var gx = 1.3, gy = 0.7, gw = 5.6, gh = 4.2;
      var qtop = Math.max(qc, q0) * 1.15;
      var X = function (r) { return gx + gw * lim(r, 0, rmax) / rmax; };
      var Y = function (v) { return gy + gh * lim(v, 0, qtop) / qtop; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 80; i++) {
        var r = ri + (rmax - ri) * i / 80;
        pts.push([X(r), Y(qq(r))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(X(ri), gy, X(ri), gy + gh, { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      g.txt('tubo nu', X(ri) + 0.1, gy + 0.3, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.circ(X(ri), Y(q0), 0.14, { preenche: 'fraco', cor: null });
      if (rcr > ri) {
        g.linha(X(rcr), gy, X(rcr), Y(qc), { cor: 'erro', larg: 1.3, tracejado: [4, 4] });
        g.circ(X(rcr), Y(qc), 0.15, { preenche: 'erro', cor: null });
        g.txt('r crítico', X(rcr) + 0.12, Y(qc) + 0.3, { cor: 'erro', tam: 10.5, alin: 'esq', fundo: true });
      }
      [0.25, 0.5, 0.75, 1].forEach(function (f) {
        var r = rmax * f;
        g.linha(X(r), gy, X(r), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(r * 1000, 0), X(r), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('raio externo do isolamento (mm)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('q por metro (W/m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6;
      g.txt('r crítico = k/h = ' + fx(rcr * 1000, 2) + ' mm', xr, 5.0, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('raio do tubo ' + fx(ri * 1000, 1) + ' mm', xr, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(ri < rcr ? 'abaixo do crítico' : 'acima do crítico', xr, 3.6,
        { cor: ri < rcr ? 'aviso' : 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt(ri < rcr ? 'isolar aumenta a perda até ' + fx(rcr * 1000, 1) + ' mm' : 'qualquer isolante já reduz a perda',
        xr, 2.9, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('tubo nu: ' + fx(q0, 1) + ' W/m', xr, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      if (rcr > ri) g.txt('no crítico: ' + fx(qc, 1) + ' W/m  (+' + fx(100 * (qc / q0 - 1), 0) + ' %)',
        xr, 1.7, { cor: 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('na esfera o crítico é 2k/h = ' + fx(2000 * rcr, 1) + ' mm', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ΔT de 60 °C entre o tubo e o ambiente · resistência do tubo desprezada', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — aleta ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'A temperatura cai ao longo da aleta: é esse desconto que a eficiência mede. Alongar demais acrescenta material que já quase não troca calor (exemplo 3.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'L', rot: 'Comprimento da aleta', min: 5, max: 120, val: 30, passo: 5, un: 'mm' },
      { id: 'k', rot: 'Condutividade (alumínio 180, aço 50)', min: 10, max: 400, val: 180, passo: 10, un: 'W/m·K' },
      { id: 'h', rot: 'Coeficiente de convecção', min: 5, max: 500, val: 50, passo: 5, un: 'W/m²·K' }
    ],
    desenhar: function (g, p) {
      var L = p.L / 1000, k = p.k, h = p.h, t = 0.002, Tb = 80, Ti = 25, dT = Tb - Ti;
      var m = Math.sqrt(2 * h / (k * t)), Lc = L + t / 2, mLc = m * Lc;
      var eta = Math.tanh(mLc) / mLc;
      var q = eta * h * (2 * Lc) * dT, q0 = h * t * dT, efe = q / q0;
      var Tx = function (xx) { return Ti + dT * Math.cosh(m * (Lc - xx)) / Math.cosh(mLc); };
      var gx = 1.2, gy = 1.9, gw = 4.4, gh = 2.4;
      g.ret(gx - 0.45, gy - 0.3, 0.45, gh + 0.6, { cor: 'forte', larg: 1.6, preenche: 'erro', alfa: 0.3 });
      g.txt('base', gx - 0.22, gy - 0.6, { cor: 'erro', tam: 10.5 });
      g.ret(gx, gy + gh / 2 - 0.16, gw, 0.32, { cor: 'forte', larg: 1.4, preenche: 'acento', alfa: 0.3 });
      var i, pts = [];
      for (i = 0; i <= 50; i++) {
        var xx = Lc * i / 50;
        pts.push([gx + gw * xx / Lc, gy + gh * (Tx(xx) - Ti) / dT]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('ar a 25 °C', gx + gw - 0.1, gy - 0.28, { cor: 'fraco', tam: 10, alin: 'dir' });
      g.txt('80 °C', gx - 0.05, gy + gh + 0.25, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.txt(fx(Tx(Lc), 1) + ' °C na ponta', gx + gw - 0.1, gy + gh * (Tx(Lc) - Ti) / dT + 0.32, { cor: 's1', tam: 10.5, alin: 'dir', fundo: true });
      for (i = 1; i <= 5; i++) {
        var xs = gw * i / 6;
        g.seta(gx + xs, gy + gh / 2 + 0.2, 0, 0.35, { cor: 's3', larg: 1.2, ponta: 0.14 });
        g.seta(gx + xs, gy + gh / 2 - 0.2, 0, -0.35, { cor: 's3', larg: 1.2, ponta: 0.14 });
      }
      /* curva de eficiência */
      var ex0 = 6.4, ey0 = 1.0, ew = 2.6, eh = 3.0;
      var EX = function (v) { return ex0 + ew * lim(v, 0, 3) / 3; }, EY = function (v) { return ey0 + eh * lim(v, 0, 1); };
      g.linha(ex0, ey0, ex0 + ew, ey0, { cor: 'fraco', larg: 1.2 });
      g.linha(ex0, ey0, ex0, ey0 + eh, { cor: 'fraco', larg: 1.2 });
      var ep = [];
      for (i = 1; i <= 60; i++) { var v = 3 * i / 60; ep.push([EX(v), EY(Math.tanh(v) / v)]); }
      g.caminho(ep, { cor: 's3', larg: 2.4 });
      g.circ(EX(mLc), EY(eta), 0.14, { preenche: 'erro', cor: null });
      g.txt('η × mL_c', ex0 + ew / 2, ey0 - 0.4, { cor: 'fraco', tam: 10.5 });
      g.txt('1', ex0 - 0.15, EY(1), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      var xr = 9.5;
      g.txt('m = ' + fx(m, 1) + ' m⁻¹', xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('mL_c = ' + fx(mLc, 3), xr, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('η = ' + fx(eta, 3), xr, 3.7, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('q = ' + fx(q, 1) + ' W/m', xr, 3.0, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('sem aleta ' + fx(q0, 2) + ' W/m', xr, 2.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('efetividade ' + fx(efe, 1), xr, 1.8, { cor: efe > 2 ? 'ok' : 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('ht/k = ' + fx(h * t / k, 3), xr, 1.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(h * t / k < 0.25 ? 'a aleta compensa' : 'não compensa', xr, 0.75,
        { cor: h * t / k < 0.25 ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('aleta retangular de 2 mm de espessura, por metro de largura', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — transiente e Biot ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Com Bi < 0,1 o corpo esfria uniforme e a curva é uma exponencial de constante τ. Acima disso o centro atrasa em relação à superfície e a hipótese deixa de valer (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'd', rot: 'Diâmetro da esfera', min: 2, max: 120, val: 10, passo: 1, un: 'mm' },
      { id: 'h', rot: 'Convecção do meio', min: 10, max: 2000, val: 500, passo: 10, un: 'W/m²·K' },
      { id: 'mat', rot: 'Material: 1 aço · 2 cobre · 3 vidro', min: 1, max: 3, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var d = p.d / 1000, h = p.h, mat = Math.round(p.mat);
      var k = mat === 1 ? 50 : mat === 2 ? 400 : 1.4;
      var rho = mat === 1 ? 7800 : mat === 2 ? 8900 : 2500;
      var c = mat === 1 ? 480 : mat === 2 ? 385 : 750;
      var nome = mat === 1 ? 'aço' : mat === 2 ? 'cobre' : 'vidro';
      var Lc = d / 6, Bi = h * Lc / k, tau = rho * c * Lc / h;
      var T0 = 400, Tinf = 30, Talvo = 100;
      var t100 = -tau * Math.log((Talvo - Tinf) / (T0 - Tinf));
      var tmax = Math.max(4 * tau, 1.2 * t100);
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.0;
      var X = function (t) { return gx + gw * lim(t, 0, tmax) / tmax; };
      var Y = function (T) { return gy + gh * lim((T - Tinf) / (T0 - Tinf), 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 80; i++) {
        var t = tmax * i / 80;
        pts.push([X(t), Y(Tinf + (T0 - Tinf) * Math.exp(-t / tau))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      if (Bi > 0.1) {                                  /* centro atrasado */
        var atraso = lim(Bi, 0, 3), p2 = [];
        for (i = 0; i <= 80; i++) {
          var t2 = tmax * i / 80;
          var ef = Math.exp(-t2 / (tau * (1 + 0.3 * atraso)));
          p2.push([X(t2), Y(Tinf + (T0 - Tinf) * ef)]);
        }
        g.caminho(p2, { cor: 'erro', larg: 2, tracejado: [6, 4] });
        g.txt('centro (atrasado)', X(tmax * 0.45), Y(Tinf + (T0 - Tinf) * Math.exp(-tmax * 0.45 / (tau * (1 + 0.3 * atraso)))) + 0.3,
          { cor: 'erro', tam: 10, fundo: true });
      }
      g.linha(gx, Y(Talvo), gx + gw, Y(Talvo), { cor: 'aviso', larg: 1.2, tracejado: [4, 4] });
      g.txt('100 °C', gx + 0.12, Y(Talvo) + 0.25, { cor: 'aviso', tam: 10, alin: 'esq' });
      g.linha(X(t100), gy, X(t100), Y(Talvo), { cor: 'aviso', larg: 1.2, tracejado: [4, 4] });
      g.circ(X(t100), Y(Talvo), 0.14, { preenche: 'aviso', cor: null });
      g.linha(X(tau), gy, X(tau), Y(Tinf + (T0 - Tinf) / Math.E), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      g.txt('τ', X(tau), gy + 0.3, { cor: 'fraco', tam: 11, fundo: true });
      [0.25, 0.5, 0.75, 1].forEach(function (f) {
        g.linha(X(tmax * f), gy, X(tmax * f), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(tmax * f, tmax > 100 ? 0 : 1), X(tmax * f), gy - 0.5, { cor: 'fraco', tam: 10 });
      });
      g.txt('tempo (s)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('400 °C', gx + 0.12, gy + gh - 0.22, { cor: 's1', tam: 10, alin: 'esq' });
      var xr = 7.6;
      g.txt(nome + ' · L_c = V/A = ' + fx(Lc * 1000, 2) + ' mm', xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('Bi = ' + fx(Bi, 4), xr, 4.3, { cor: Bi < 0.1 ? 'ok' : 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt(Bi < 0.1 ? 'capacitância global vale' : 'gradiente interno: use séries ou cartas',
        xr, 3.6, { cor: Bi < 0.1 ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('τ = ρcL_c/h = ' + fx(tau, 2) + ' s', xr, 2.9, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('de 400 °C a 100 °C: ' + fx(t100, 1) + ' s', xr, 2.2, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('em 3τ já perdeu 95 % do excesso', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('meio a 30 °C', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('a curva tracejada é só ilustrativa do atraso do centro quando Bi passa de 0,1', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — camadas limite e Prandtl ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Prandtl compara as duas camadas limites. No óleo a térmica é muito mais fina que a de velocidade; nos metais líquidos acontece o contrário.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Pr', rot: 'Número de Prandtl', min: 0.01, max: 100, val: 7, passo: 0.01 },
      { id: 'Re', rot: 'Reynolds local', min: 1000, max: 500000, val: 100000, passo: 1000 }
    ],
    desenhar: function (g, p) {
      var Pr = p.Pr, Re = p.Re;
      var razao = Math.pow(Pr, 1 / 3);                 /* δ/δt */
      var d = 4.91 / Math.sqrt(Re);                     /* δ/x */
      var fluido = Pr < 0.05 ? 'metal líquido' : Pr < 1.2 ? 'gás' : Pr < 20 ? 'água' : 'óleo';
      var gx = 1.1, gy = 1.0, gw = 4.8, gh = 3.6;
      g.linha(gx, gy, gx + gw, gy, { cor: 'forte', larg: 2.4 });
      g.hachura(gx, gy - 0.04, gw, 0, { cor: 'forte', d: 0.24 });
      var dv = 2.7, dt = lim(dv / razao, 0.25, 3.4);
      var i, a = [], b = [];
      for (i = 0; i <= 50; i++) {
        var f = i / 50;
        a.push([gx + gw * f, gy + dv * Math.sqrt(f)]);
        b.push([gx + gw * f, gy + dt * Math.sqrt(f)]);
      }
      g.caminho(a, { cor: 's1', larg: 2.6 });
      g.caminho(b, { cor: 'erro', larg: 2.6, tracejado: [6, 4] });
      g.txt('δ velocidade', gx + gw * 0.52, gy + dv * Math.sqrt(0.52) + 0.3, { cor: 's1', tam: 10.5, fundo: true });
      g.txt('δ térmica', gx + gw * 0.52, gy + dt * Math.sqrt(0.52) - 0.3, { cor: 'erro', tam: 10.5, fundo: true });
      for (i = 1; i <= 4; i++) {
        var xx = gx + gw * i / 5, hv = dv * Math.sqrt(i / 5), ht = dt * Math.sqrt(i / 5);
        var j, pv = [], pt = [];
        for (j = 0; j <= 10; j++) {
          var e = j / 10;
          pv.push([xx + 0.42 * (1.5 * e - 0.5 * e * e * e), gy + hv * e]);
          pt.push([xx + 0.42 * (1.5 * e - 0.5 * e * e * e), gy + ht * e]);
        }
        g.caminho(pv, { cor: 's1', larg: 1.1 });
        g.caminho(pt, { cor: 'erro', larg: 1.1, tracejado: [3, 3] });
      }
      g.seta(gx + 0.3, gy + 3.3, 0.8, 0, { cor: 'fraco', larg: 1.4, ponta: 0.16 });
      g.txt('U∞, T∞', gx + 0.3, gy + 3.55, { cor: 'fraco', tam: 10, alin: 'esq' });
      var xr = 6.9;
      g.txt('Pr = ' + fx(Pr, Pr < 1 ? 3 : 1) + '  (' + fluido + ')', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('δ/δ_t = Pr^{1/3} = ' + fx(razao, 3), xr, 4.2, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(Pr > 1.2 ? 'a térmica é a mais fina' : Pr < 0.8 ? 'a térmica é a mais espessa' : 'as duas quase coincidem',
        xr, 3.5, { cor: 'suave', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('δ/x = 4,91/√Re = ' + fx(d, 4), xr, 2.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('Nu local (laminar) = 0,332 Re^{1/2} Pr^{1/3}', xr, 2.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('Nu = ' + fx(0.332 * Math.sqrt(Re) * Math.pow(Pr, 1 / 3), 1), xr, 1.5, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('em Bi o k é o do sólido; em Nu, o do fluido', xr, 0.9, { cor: 'aviso', tam: 10.5, alin: 'esq' });
      g.txt('placa plana laminar · as espessuras estão fora de escala para caber no desenho', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — Dittus-Boelter ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'O coeficiente de convecção em tubo cresce com a velocidade elevada a 0,8 — e dá um salto na transição. Fora da faixa de validade, a correlação não vale (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'V', rot: 'Velocidade média', min: 0.05, max: 5, val: 1, passo: 0.05, un: 'm/s' },
      { id: 'D', rot: 'Diâmetro do tubo', min: 5, max: 100, val: 25, passo: 1, un: 'mm' },
      { id: 'fluido', rot: 'Fluido: 1 água · 2 ar · 3 óleo', min: 1, max: 3, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var f = Math.round(p.fluido), D = p.D / 1000, V = p.V;
      var rho = f === 1 ? 988 : f === 2 ? 1.09 : 867;
      var mu = f === 1 ? 5.47e-4 : f === 2 ? 1.95e-5 : 0.0355;
      var kf = f === 1 ? 0.644 : f === 2 ? 0.0276 : 0.138;
      var Pr = f === 1 ? 3.55 : f === 2 ? 0.71 : 546;
      var nome = f === 1 ? 'água a 50 °C' : f === 2 ? 'ar a 50 °C' : 'óleo a 50 °C';
      var hde = function (v) {
        var Re = rho * v * D / mu;
        var Nu = Re < 2300 ? 3.66 : 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4);
        return [Re, Nu, Nu * kf / D];
      };
      var r = hde(V), Re = r[0], Nu = r[1], h = r[2];
      var gx = 1.3, gy = 0.8, gw = 5.8, gh = 4.1;
      var hmax = Math.max(hde(5)[2], 10) * 1.1;
      var X = function (v) { return gx + gw * lim(v, 0, 5) / 5; };
      var Y = function (v) { return gy + gh * lim(v, 0, hmax) / hmax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [], ant = null;
      for (i = 0; i <= 120; i++) {
        var v = 5 * i / 120, rr = hde(v);
        if (ant !== null && (ant < 2300) !== (rr[0] < 2300)) { g.caminho(pts, { cor: 's1', larg: 2.6 }); pts = []; }
        pts.push([X(v), Y(rr[2])]);
        ant = rr[0];
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      var vtr = 2300 * mu / (rho * D);
      if (vtr < 5) {
        g.linha(X(vtr), gy, X(vtr), gy + gh, { cor: 'aviso', larg: 1.3, tracejado: [4, 4] });
        g.txt('Re = 2300', X(vtr) + 0.12, gy + gh - 0.25, { cor: 'aviso', tam: 10, alin: 'esq', fundo: true });
      }
      var vval = 10000 * mu / (rho * D);
      if (vval < 5) {
        g.ret(gx, gy, X(vval) - gx, gh, { preenche: 'erro', cor: null, alfa: 0.07 });
        g.txt('fora da faixa', X(vval) + 0.12, gy + 0.4, { cor: 'erro', tam: 10, alin: 'esq' });
      }
      g.circ(X(V), Y(h), 0.15, { preenche: 'erro', cor: null });
      [1, 2, 3, 4, 5].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('velocidade (m/s)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('h (W/m²·K)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.7;
      g.txt(nome + ' · Pr = ' + fx(Pr, Pr > 100 ? 0 : 2), xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('Re = ' + fx(Re, 0), xr, 4.3, { cor: Re > 10000 ? 'ok' : 'aviso', tam: 13, alin: 'esq', negrito: true });
      g.txt('Nu = ' + fx(Nu, 1), xr, 3.6, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('h = ' + fx(h, 0) + ' W/m²·K', xr, 2.9, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt(Re < 2300 ? 'laminar: Nu = 3,66 (tubo, T da parede constante)' :
        Re < 10000 ? 'transição: Dittus-Boelter não vale aqui' : 'turbulento: Dittus-Boelter vale',
        xr, 2.1, { cor: Re < 2300 ? 'info' : Re < 10000 ? 'erro' : 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('h ∝ V^{0,8}: dobrar a velocidade', xr, 1.4, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('aumenta h em apenas 74 %', xr, 1.0, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('Nu = 0,023 Re^{0,8} Pr^{0,4} · propriedades na temperatura de filme', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — curva de ebulição ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'A curva de ebulição da água: o fluxo cresce até o pico e, passado ele, o filme de vapor isola a superfície e a parede salta centenas de graus — o burnout.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'dTe', rot: 'Excesso de temperatura da parede', min: 1, max: 1000, val: 20, passo: 1, un: '°C' }
    ],
    desenhar: function (g, p) {
      var dTe = p.dTe;
      function fluxo(d) {                       /* W/m², curva clássica da água a 1 atm */
        if (d < 5) return 1.0e4 * Math.pow(d / 5, 1.43);
        if (d < 30) return 1.0e4 * Math.pow(d / 5, 2.7);          /* nucleada, até o pico */
        if (d < 120) return 1.26e6 * Math.pow(30 / d, 2.98);      /* transição, até o mínimo */
        return 2.0e4 * Math.pow(d / 120, 1.85);                   /* filme, subindo de novo */
      }
      var q = fluxo(dTe), qmax = 1.26e6, qmin = fluxo(120);
      var regime = dTe < 5 ? 'convecção natural' : dTe < 30 ? 'ebulição nucleada' :
        dTe < 120 ? 'ebulição em transição' : 'ebulição em filme';
      var gx = 1.3, gy = 0.9, gw = 6.0, gh = 4.1;
      var X = function (d) { return gx + gw * (Math.log10(lim(d, 1, 1000))) / 3; };
      var Y = function (v) { return gy + gh * (Math.log10(lim(v, 1e3, 3e6)) - 3) / 3.5; };
      g.ret(gx, gy, X(5) - gx, gh, { preenche: 's4', cor: null, alfa: 0.07 });
      g.ret(X(5), gy, X(30) - X(5), gh, { preenche: 'ok', cor: null, alfa: 0.08 });
      g.ret(X(30), gy, X(120) - X(30), gh, { preenche: 'aviso', cor: null, alfa: 0.08 });
      g.ret(X(120), gy, gx + gw - X(120), gh, { preenche: 'erro', cor: null, alfa: 0.08 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 150; i++) {
        var d = Math.pow(10, 3 * i / 150);
        pts.push([X(d), Y(fluxo(d))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.circ(X(30), Y(qmax), 0.16, { preenche: 'erro', cor: null });
      g.txt('fluxo crítico', X(30) - 0.15, Y(qmax) + 0.32, { cor: 'erro', tam: 11, alin: 'dir', negrito: true, fundo: true });
      g.circ(X(120), Y(qmin), 0.13, { preenche: 'aviso', cor: null });
      g.txt('Leidenfrost', X(120) + 0.12, Y(qmin) - 0.32, { cor: 'aviso', tam: 10, alin: 'esq', fundo: true });
      g.seta(X(30) + 0.12, Y(qmax), gx + gw - X(30) - 0.2, 0, { cor: 'erro', larg: 1.6, ponta: 0.22, tracejado: [5, 4] });
      g.txt('salto do burnout', (X(30) + gx + gw) / 2, Y(qmax) - 0.32, { cor: 'erro', tam: 10, fundo: true });
      g.circ(X(dTe), Y(q), 0.15, { preenche: 's3', cor: null });
      g.txt('natural', X(2.4), gy + 0.35, { cor: 'fraco', tam: 9.5 });
      g.txt('nucleada', X(13), gy + 0.35, { cor: 'ok', tam: 10 });
      g.txt('transição', X(60), gy + 0.35, { cor: 'aviso', tam: 10 });
      g.txt('filme', X(400), gy + 0.35, { cor: 'erro', tam: 10 });
      [1, 10, 100, 1000].forEach(function (d) {
        g.linha(X(d), gy, X(d), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(d, 0), X(d), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [1e4, 1e5, 1e6].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v === 1e4 ? '10⁴' : v === 1e5 ? '10⁵' : '10⁶', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('ΔT de excesso = T_parede − T_sat (°C)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('q" (W/m²)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.9;
      g.txt('ΔT = ' + fx(dTe, 0) + ' °C', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('q" = ' + (q > 1e5 ? fx(q / 1e6, 2) + ' MW/m²' : fx(q / 1000, 1) + ' kW/m²'),
        xr, 4.3, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt(regime, xr, 3.6, { cor: dTe < 30 ? 'ok' : dTe < 120 ? 'aviso' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('h aparente ' + fx(q / dTe, 0) + ' W/m²·K', xr, 2.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('fluxo crítico ≈ 1,26 MW/m²', xr, 2.2, { cor: 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('projeto de caldeira fica com', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('margem larga abaixo do pico', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('água saturada a 1 atm, aquecimento por fio — valores clássicos de Nukiyama', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — Planck e Wien ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'A distribuição de Planck: subir a temperatura aumenta a emissão em todo o espectro e empurra o pico para comprimentos de onda menores. A área sob a curva é σT⁴ (exemplo 8.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura da superfície', min: 300, max: 3000, val: 773, passo: 10, un: 'K' },
      { id: 'eps', rot: 'Emissividade', min: 0.05, max: 1, val: 0.8, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var T = p.T, eps = p.eps, Tviz = 298;
      var C1 = 3.742e8, C2 = 1.4388e4;
      var El = function (l, TT) { return C1 / (Math.pow(l, 5) * (Math.exp(C2 / (l * TT)) - 1)); };
      var lmax = 2898 / T;
      var Eb = SIG * Math.pow(T, 4), E = eps * Eb;
      var qrad = eps * SIG * (Math.pow(T, 4) - Math.pow(Tviz, 4));
      var hr = qrad / (T - Tviz);
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var topo = El(2898 / 3000, 3000) * 1.05;
      var X = function (l) { return gx + gw * (Math.log10(lim(l, 0.1, 100)) + 1) / 3; };
      var Y = function (v) { return gy + gh * lim(Math.pow(v / topo, 0.28), 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.ret(X(0.4), gy, X(0.75) - X(0.4), gh, { preenche: 's6', cor: null, alfa: 0.18 });
      g.txt('visível', X(0.55), gy + gh - 0.22, { cor: 'suave', tam: 9.5 });
      var i, j, refs = [500, 1000, 2000];
      refs.forEach(function (TT) {
        var pts = [];
        for (j = 0; j <= 90; j++) {
          var l = Math.pow(10, -1 + 3 * j / 90);
          pts.push([X(l), Y(El(l, TT))]);
        }
        g.caminho(pts, { cor: 'fraco', larg: 1.2, tracejado: [4, 3] });
        g.txt(TT + ' K', X(2898 / TT) - 0.15, Y(El(2898 / TT, TT)) + 0.28, { cor: 'fraco', tam: 9.5, alin: 'dir', fundo: true });
      });
      var cur = [];
      for (i = 0; i <= 120; i++) {
        var l2 = Math.pow(10, -1 + 3 * i / 120);
        cur.push([X(l2), Y(eps * El(l2, T))]);
      }
      g.caminho(cur, { cor: 's1', larg: 2.6 });
      g.circ(X(lmax), Y(eps * El(lmax, T)), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(lmax), gy, X(lmax), Y(eps * El(lmax, T)), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.txt('λ máx = ' + fx(lmax, 2) + ' µm', X(lmax) + 0.12, Y(eps * El(lmax, T)) + 0.3, { cor: 'erro', tam: 10.5, alin: 'esq', fundo: true });
      [0.1, 1, 10, 100].forEach(function (l) {
        g.linha(X(l), gy, X(l), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(l < 1 ? '0,1' : fx(l, 0), X(l), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('comprimento de onda (µm)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('E λ (escala comprimida)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6;
      g.txt('T = ' + fx(T, 0) + ' K = ' + fx(T - 273.15, 0) + ' °C', xr, 5.0, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('λ máx T = 2898 µm·K', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('E_b = σT⁴ = ' + fx(Eb / 1000, 1) + ' kW/m²', xr, 3.6, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('E = εσT⁴ = ' + fx(E / 1000, 1) + ' kW/m²', xr, 2.9, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('troca com 25 °C: ' + fx(qrad / 1000, 2) + ' kW/m²', xr, 2.2, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('equivale a h_r = ' + fx(hr, 1) + ' W/m²·K', xr, 1.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(hr > 10 ? 'acima da convecção natural típica' : 'abaixo da convecção natural típica',
        xr, 1.0, { cor: hr > 10 ? 'aviso' : 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('o eixo vertical está comprimido para caber três ordens de grandeza', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — troca entre superfícies e escudo ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'A troca entre duas superfícies cinzas sai de uma rede de resistências. Um escudo de baixa emissividade acrescenta duas resistências grandes e corta a troca a uma fração.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'e1', rot: 'Emissividade da superfície quente', min: 0.05, max: 1, val: 0.8, passo: 0.05 },
      { id: 'e2', rot: 'Emissividade da fria', min: 0.05, max: 1, val: 0.8, passo: 0.05 },
      { id: 'esc', rot: 'Escudos (ε = 0,05)', min: 0, max: 3, val: 0, passo: 1 }
    ],
    desenhar: function (g, p) {
      var e1 = p.e1, e2 = p.e2, N = Math.round(p.esc), es = 0.05;
      var T1 = 773, T2 = 373;
      var Rsem = 1 / e1 + 1 / e2 - 1;
      var Rcom = Rsem + N * (2 / es - 1);
      var base = SIG * (Math.pow(T1, 4) - Math.pow(T2, 4));
      var q0 = base / Rsem, q = base / Rcom;
      var x1 = 1.3, x2 = 5.0, ya = 1.2, yb = 4.6;
      g.ret(x1 - 0.22, ya, 0.22, yb - ya, { cor: 'forte', larg: 1.6, preenche: 'erro', alfa: 0.45 });
      g.ret(x2, ya, 0.22, yb - ya, { cor: 'forte', larg: 1.6, preenche: 's1', alfa: 0.45 });
      g.txt('500 °C', x1 - 0.11, yb + 0.3, { cor: 'erro', tam: 11 });
      g.txt('100 °C', x2 + 0.11, yb + 0.3, { cor: 's1', tam: 11 });
      g.txt('ε₁ = ' + fx(e1, 2), x1 - 0.11, ya - 0.3, { cor: 'erro', tam: 10 });
      g.txt('ε₂ = ' + fx(e2, 2), x2 + 0.11, ya - 0.3, { cor: 's1', tam: 10 });
      var i;
      for (i = 1; i <= N; i++) {
        var xs = x1 + (x2 - x1) * i / (N + 1);
        g.ret(xs - 0.05, ya, 0.1, yb - ya, { cor: 'aviso', larg: 1.4, preenche: 'aviso', alfa: 0.5 });
      }
      if (N) g.txt(N + ' escudo' + (N > 1 ? 's' : '') + ' de ε = 0,05', (x1 + x2) / 2, ya - 0.32, { cor: 'aviso', tam: 10 });
      var nset = Math.max(1, Math.round(4 * q / q0));
      for (i = 0; i < 4; i++) {
        var yy = ya + (yb - ya) * (i + 0.5) / 4;
        if (i < nset) g.seta(x1 + 0.1, yy, x2 - x1 - 0.25, 0, { cor: 'erro', larg: 2, ponta: 0.2 });
        else g.linha(x1 + 0.1, yy, x1 + 0.6, yy, { cor: 'fraco', larg: 1.4, tracejado: [3, 3] });
      }
      g.txt('F₁₂ = 1 (planos paralelos)', (x1 + x2) / 2, yb + 0.35, { cor: 'fraco', tam: 10 });
      var xr = 6.6;
      g.txt('resistência da rede', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('1/ε₁ + 1/ε₂ − 1 = ' + fx(Rsem, 3), xr, 4.4, { cor: 'suave', tam: 12, alin: 'esq' });
      if (N) g.txt('+ ' + N + '(2/ε_e − 1) = ' + fx(Rcom, 1), xr, 3.8, { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      if (N) g.txt('q sem escudo = ' + fx(q0 / 1000, 2) + ' kW/m²', xr, 3.0, { cor: 'fraco', tam: 12, alin: 'esq' });
      g.txt('q = ' + (q > 1000 ? fx(q / 1000, 2) + ' kW/m²' : fx(q, 0) + ' W/m²'),
        xr, 2.3, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt(N ? 'reduziu a ' + fx(100 * q / q0, 1) + ' % da troca original' : 'sem escudo: troca plena',
        xr, 1.5, { cor: N ? 'ok' : 'suave', tam: 12, alin: 'esq', negrito: true });
      g.txt('com ε₁ = ε₂ = 1 daria ' + fx(base / 1000, 2) + ' kW/m²', xr, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('superfícies cinzas, difusas e grandes em relação à distância que as separa', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — perfis de temperatura ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Os perfis explicam a vantagem do contracorrente: a diferença de temperatura se mantém ao longo de todo o trocador, enquanto no paralelo ela despenca logo na entrada (exemplo 10.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'arranjo', rot: 'Arranjo: 1 contracorrente · 2 paralelo', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'NUT', rot: 'NUT', min: 0.2, max: 5, val: 1.1, passo: 0.1 },
      { id: 'Cr', rot: 'Razão de capacidades Cr', min: 0, max: 1, val: 0.57, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var con = Math.round(p.arranjo) === 1, NUT = p.NUT, Cr = p.Cr;
      var Th1 = 150, Tc1 = 30;
      var eps;
      if (con) {
        eps = Cr > 0.999 ? NUT / (1 + NUT) :
          (1 - Math.exp(-NUT * (1 - Cr))) / (1 - Cr * Math.exp(-NUT * (1 - Cr)));
      } else {
        eps = (1 - Math.exp(-NUT * (1 + Cr))) / (1 + Cr);
      }
      /* Cmín é o quente; Cc = Ch/Cr */
      var dTmax = Th1 - Tc1, qq = eps * dTmax;              /* por unidade de Cmín */
      var Th2 = Th1 - qq, Tc2 = Tc1 + (Cr > 0 ? qq * Cr : 0);
      var n = 120, i;
      var Th = [], Tc = [];
      var dx = 1 / n, nh = NUT, nc = Cr > 0 ? NUT * Cr : 0;
      var th = Th1, tc = con ? Tc2 : Tc1;                   /* em x=0 o frio sai (contracorrente) */
      for (i = 0; i <= n; i++) {
        Th.push(th); Tc.push(tc);
        var dif = th - tc;
        th -= nh * dif * dx;
        tc += (con ? -1 : 1) * nc * dif * dx;
      }
      var gx = 1.3, gy = 1.0, gw = 5.8, gh = 4.0;
      var X = function (f) { return gx + gw * f; };
      var Y = function (T) { return gy + gh * lim((T - 20) / 140, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var ph = [], pc = [];
      for (i = 0; i <= n; i++) { ph.push([X(i / n), Y(Th[i])]); pc.push([X(i / n), Y(Tc[i])]); }
      g.caminho(ph, { cor: 'erro', larg: 2.6 });
      g.caminho(pc, { cor: 's1', larg: 2.6 });
      for (i = 1; i <= 5; i++) {
        var f = i / 6;
        g.linha(X(f), Y(Th[Math.round(f * n)]), X(f), Y(Tc[Math.round(f * n)]), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      }
      g.txt('quente', X(0.08), Y(Th[0]) + 0.3, { cor: 'erro', tam: 10.5, alin: 'esq', fundo: true });
      g.txt('frio', X(0.08), Y(Tc[0]) - 0.3, { cor: 's1', tam: 10.5, alin: 'esq', fundo: true });
      g.seta(X(0.15), gy + gh + 0.25, 0.8, 0, { cor: 'erro', larg: 1.6, ponta: 0.18 });
      g.seta(X(0.85), gy + gh + 0.25, con ? -0.8 : 0.8, 0, { cor: 's1', larg: 1.6, ponta: 0.18 });
      [50, 100, 150].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.14, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.26, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('posição ao longo do trocador', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var d1 = con ? Th1 - Tc2 : Th1 - Tc1, d2 = con ? Th2 - Tc1 : Th2 - Tc2;
      var mldt = Math.abs(d1 - d2) < 1e-6 ? d1 : (d1 - d2) / Math.log(d1 / d2);
      var xr = 7.7;
      g.txt(con ? 'contracorrente' : 'paralelo', xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('saídas: ' + fx(Th2, 1) + ' °C e ' + fx(Tc2, 1) + ' °C', xr, 4.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ΔT nas pontas: ' + fx(d1, 1) + ' e ' + fx(d2, 1) + ' °C', xr, 3.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('MLDT = ' + fx(mldt, 2) + ' °C', xr, 3.0, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('ε = ' + fx(eps, 3), xr, 2.3, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('área ∝ 1/MLDT: o paralelo', xr, 1.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('sempre pede mais superfície', xr, 1.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('entrada do quente a 150 °C e do frio a 30 °C · C mínimo é o do quente', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 11.1 — efetividade e NUT ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'A efetividade sobe depressa até NUT ≈ 2 e depois satura: dobrar a área de um trocador que já opera com NUT alto quase não aumenta a troca, mas dobra o custo (exemplo 11.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'NUT', rot: 'NUT = UA/C mínimo', min: 0.1, max: 6, val: 1.1, passo: 0.1 },
      { id: 'Cr', rot: 'Razão de capacidades Cr', min: 0, max: 1, val: 0.57, passo: 0.01 },
      { id: 'arranjo', rot: 'Arranjo: 1 contracorrente · 2 paralelo', min: 1, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var NUT = p.NUT, Cr = p.Cr, con = Math.round(p.arranjo) === 1;
      function efe(N, cr, contra) {
        if (cr < 1e-6) return 1 - Math.exp(-N);
        if (contra) {
          if (cr > 0.999) return N / (1 + N);
          var e = Math.exp(-N * (1 - cr));
          return (1 - e) / (1 - cr * e);
        }
        return (1 - Math.exp(-N * (1 + cr))) / (1 + cr);
      }
      var eps = efe(NUT, Cr, con);
      var gx = 1.3, gy = 0.9, gw = 5.9, gh = 4.1;
      var X = function (v) { return gx + gw * lim(v, 0, 6) / 6; };
      var Y = function (v) { return gy + gh * lim(v, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(1), gx + gw, Y(1), { cor: 'borda', larg: 1, tracejado: [5, 4] });
      var i, j, crs = [0, 0.25, 0.5, 0.75, 1];
      crs.forEach(function (cr, idx) {
        var pts = [];
        for (j = 0; j <= 80; j++) { var N = 6 * j / 80; pts.push([X(N), Y(efe(N, cr, con))]); }
        g.caminho(pts, { cor: idx === 0 ? 'ok' : idx === 4 ? 'aviso' : 'fraco', larg: idx === 0 || idx === 4 ? 1.8 : 1.2 });
      });
      var cur = [];
      for (j = 0; j <= 80; j++) { var N2 = 6 * j / 80; cur.push([X(N2), Y(efe(N2, Cr, con))]); }
      g.caminho(cur, { cor: 's1', larg: 2.8 });
      g.txt('Cr = 0', X(5.5), Y(efe(5.5, 0, con)) + 0.25, { cor: 'ok', tam: 10, alin: 'dir', fundo: true });
      g.txt('Cr = 1', X(5.5), Y(efe(5.5, 1, con)) - 0.3, { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      g.circ(X(NUT), Y(eps), 0.16, { preenche: 'erro', cor: null });
      g.linha(X(NUT), gy, X(NUT), Y(eps), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.linha(X(2), gy, X(2), gy + gh, { cor: 'suave', larg: 1, tracejado: [4, 4] });
      g.txt('NUT = 2', X(2) + 0.1, gy + 0.3, { cor: 'suave', tam: 10, alin: 'esq' });
      [1, 2, 3, 4, 5, 6].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.25, 0.5, 0.75, 1].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 2), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('NUT', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('efetividade ε', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.8;
      g.txt(con ? 'contracorrente' : 'paralelo', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('Cr = ' + fx(Cr, 2) + ' · NUT = ' + fx(NUT, 2), xr, 4.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ε = ' + fx(eps, 3), xr, 3.5, { cor: 's1', tam: 15.5, alin: 'esq', negrito: true });
      g.txt('q = ' + fx(eps * 100, 1) + ' % de q máximo', xr, 2.8, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      var dobro = efe(2 * NUT, Cr, con);
      g.txt('dobrando a área: ε = ' + fx(dobro, 3), xr, 2.1, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt('ganho de apenas ' + fx(100 * (dobro - eps), 1) + ' pontos', xr, 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(Cr < 0.02 ? 'Cr = 0: um fluido muda de fase' : '', xr, 0.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('curvas finas: Cr = 0; 0,25; 0,5; 0,75 e 1 · a grossa é a escolhida', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

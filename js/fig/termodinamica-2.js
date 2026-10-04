/* ============================================================
   Figuras ilustrativas de Termodinâmica II
   Melhorias do Rankine, Brayton regenerativo, ciclo de refrigeração,
   misturas, psicrometria, bocal e choque normal — todos calculados.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var K = 1.4;
  function psat(T) { return 0.61094 * Math.exp(17.625 * T / (T + 243.04)); }   /* kPa, T em °C */

  /* 2.1 — melhorias do Rankine */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'As melhorias do Rankine: pressão mais alta, superaquecimento, reaquecimento e regeneração. Cada uma sobe a temperatura média de fornecimento de calor.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'mod', rot: 'Ciclo (1 simples · 2 superaquecido · 3 com reaquecimento · 4 com regeneração)', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'Pc', rot: 'Pressão da caldeira', min: 2, max: 25, val: 8, passo: 0.5, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var Pc = p.Pc, mod = p.mod;
      var Tsat = 1730.63 / (8.07131 - Math.log10(Pc * 1000 * 7.50062)) - 233.426;
      var Tcond = 45.8;
      var Tmax = mod === 1 ? Tsat : 540;
      var Tm = mod === 1 ? (Tsat + 100) / 1 * 0.6 + Tsat * 0.4 : (Tsat + Tmax) / 2;
      var base = (1 - (Tcond + 273.15) / (Tm + 273.15)) * 0.74;
      var eta = base * (mod === 3 ? 1.05 : mod === 4 ? 1.10 : 1);
      var x4 = mod === 1 ? 0.72 : mod === 3 ? 0.95 : 0.85;
      var gx = 1.3, gy = 1.0, gw = 5.6, gh = 4.4;
      var X = function (sv) { return gx + gw * sv / 9.5; }, Y = function (T) { return gy + gh * T / 650; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var TAB_T = [0, 50, 100, 150, 200, 250, 300, 340, 374];
      var SF = [0, 0.7038, 1.3069, 1.8418, 2.3309, 2.7935, 3.2552, 3.6594, 4.407];
      var SG = [9.156, 8.0763, 7.3549, 6.8379, 6.4323, 6.073, 5.7059, 5.3357, 4.407];
      function interp(T, tab) {
        T = Math.max(0, Math.min(374, T));
        for (var i = 1; i < TAB_T.length; i++) {
          if (T <= TAB_T[i]) { var f = (T - TAB_T[i - 1]) / (TAB_T[i] - TAB_T[i - 1]); return tab[i - 1] + f * (tab[i] - tab[i - 1]); }
        }
        return tab[tab.length - 1];
      }
      var i, dome = [];
      for (i = 0; i <= 30; i++) { var T = 5 + 369 * i / 30; dome.push([X(interp(T, SF)), Y(T)]); }
      for (i = 30; i >= 0; i--) { var T2 = 5 + 369 * i / 30; dome.push([X(interp(T2, SG)), Y(T2)]); }
      g.caminho(dome, { cor: 'borda', larg: 1.6 });
      var s1 = interp(Tcond, SF), s3 = interp(Tsat, SG) + (mod === 1 ? 0 : 2.3 * Math.log((Tmax + 273) / (Tsat + 273)));
      var ciclo = [[X(s1), Y(Tcond)], [X(s1 + 0.05), Y(Tcond + 3)], [X(interp(Tsat, SF)), Y(Tsat)], [X(interp(Tsat, SG)), Y(Tsat)],
                   [X(s3), Y(Tmax)]];
      if (mod === 3) ciclo.push([X(s3 + 0.5), Y(Tmax - 180)], [X(s3 + 1.3), Y(Tmax)]);
      ciclo.push([X(ciclo[ciclo.length - 1][0] === X(s3 + 1.3) ? s3 + 1.3 : s3), Y(Tcond)], [X(s1), Y(Tcond)]);
      g.caminho(ciclo, { cor: 's2', larg: 2.4, preenche: 's2', alfa: 0.12, fechar: true });
      g.txt('s', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.35, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var nomes = { 1: 'Rankine simples', 2: 'com superaquecimento', 3: 'com reaquecimento', 4: 'com regeneração' };
      var x0 = 7.6;
      g.txt(nomes[mod], x0, 5.2, { cor: 's2', tam: 14, alin: 'esq', negrito: true });
      g.txt('Tsat da caldeira ' + fx(Tsat, 0) + ' °C', x0, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('T máxima ' + fx(Tmax, 0) + ' °C', x0, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('η ≈ ' + fx(100 * eta, 1) + ' %', x0, 3.0, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('título na saída ' + fx(x4, 2), x0, 2.2, { cor: x4 < 0.88 ? 'aviso' : 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt({ 1: 'título baixo: erosão nas pás', 2: 'superaquecer já melhora os dois', 3: 'reaquecer resolve a umidade',
              4: 'regenerar sobe o rendimento' }[mod], x0, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('estimativas para leitura comparativa dos ciclos', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 3.1 — Brayton com regeneração */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Brayton: sem regeneração o rendimento cresce com a razão de pressão; com regeneração, decresce — e as duas curvas se cruzam (exemplo 3.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'rp', rot: 'Razão de pressão', min: 2, max: 30, val: 8, passo: 0.5 },
      { id: 'T3', rot: 'Temperatura na entrada da turbina', min: 900, max: 1700, val: 1300, passo: 20, un: 'K' }
    ],
    desenhar: function (g, p) {
      var rp = p.rp, T1 = 300, T3 = p.T3;
      var simples = function (r) { return 1 - Math.pow(r, (1 - K) / K); };
      var regen = function (r) { return 1 - (T1 / T3) * Math.pow(r, (K - 1) / K); };
      var T2 = T1 * Math.pow(rp, (K - 1) / K), T4 = T3 / Math.pow(rp, (K - 1) / K);
      var vale = T4 > T2;
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (r) { return gx + gw * (r - 2) / 28; }, Y = function (e) { return gy + gh * Math.max(0, e) / 0.8; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, a = [], b = [];
      for (i = 0; i <= 60; i++) {
        var r = 2 + 28 * i / 60;
        a.push([X(r), Y(simples(r))]);
        b.push([X(r), Y(regen(r))]);
      }
      g.caminho(a, { cor: 's1', larg: 2.4 });
      g.caminho(b, { cor: 's3', larg: 2.4 });
      g.circ(X(rp), Y(simples(rp)), 0.14, { preenche: 's1', cor: null });
      g.circ(X(rp), Y(Math.max(0, regen(rp))), 0.14, { preenche: 's3', cor: null });
      /* cruzamento */
      var rc = Math.pow(T3 / T1, K / (2 * (K - 1)));
      g.linha(X(rc), gy, X(rc), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [5, 4] });
      g.txt('regeneração deixa de valer', X(Math.min(29, rc)), gy + gh + 0.3, { cor: 'aviso', tam: 10.5, fundo: true });
      [5, 10, 15, 20, 25, 30].forEach(function (r) {
        g.linha(X(r), gy, X(r), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(r + '', X(r), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [0.2, 0.4, 0.6, 0.8].forEach(function (e) {
        g.linha(gx, Y(e), gx - 0.15, Y(e), { cor: 'fraco', larg: 1 });
        g.txt(fx(100 * e, 0) + '%', gx - 0.28, Y(e), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('razão de pressão', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      var x0 = 8.2;
      g.txt('simples ' + fx(100 * simples(rp), 1) + ' %', x0, 5.0, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('regenerativo ' + fx(100 * Math.max(0, regen(rp)), 1) + ' %', x0, 4.2, { cor: 's3', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('T₂ = ' + fx(T2, 0) + ' K · T₄ = ' + fx(T4, 0) + ' K', x0, 3.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(vale ? 'T₄ > T₂: regeneração compensa' : 'T₄ < T₂: regenerar não ajuda',
        x0, 2.6, { cor: vale ? 'ok' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('cruzamento em rp = ' + fx(rc, 1), x0, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T₁ = 300 K · ciclo ideal a ar padrão', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 4.1 — ciclo de refrigeração no P-h */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Ciclo de refrigeração no diagrama P-h: cada lado é um equipamento, e as diferenças de entalpia dão diretamente capacidade e trabalho.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'Te', rot: 'Evaporação', min: -40, max: 10, val: -10, passo: 1, un: '°C' },
      { id: 'Tc', rot: 'Condensação', min: 25, max: 60, val: 40, passo: 1, un: '°C' },
      { id: 'sup', rot: 'Superaquecimento na sucção', min: 0, max: 20, val: 5, passo: 1, un: 'K' }
    ],
    desenhar: function (g, p) {
      var Te = p.Te, Tc = p.Tc, sup = p.sup;
      /* propriedades aproximadas do R-134a */
      var h1 = 390 + 0.9 * Te + 0.9 * sup, h2s = h1 + 25 + 0.8 * (Tc - Te), h3 = 200 + 1.3 * Tc, h4 = h3;
      var qL = h1 - h4, w = h2s - h1, COP = qL / w;
      var copC = (Te + 273.15) / (Tc - Te);
      var Pe = 0.6 + 0.02 * (Te + 40), Pc = 0.6 + 0.06 * Tc;
      var gx = 1.3, gy = 1.0, gw = 6.0, gh = 4.2;
      var X = function (h) { return gx + gw * (h - 150) / 300; }, Y = function (P) { return gy + gh * (Math.log10(P) + 0.5) / 1.3; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* domo aproximado */
      var i, dome = [];
      for (i = 0; i <= 20; i++) { var T = -40 + 140 * i / 20; dome.push([X(200 + 1.3 * T), Y(0.6 + 0.02 * (T + 40) + (T > 0 ? 0.04 * T : 0))]); }
      for (i = 20; i >= 0; i--) { var T2 = -40 + 140 * i / 20; dome.push([X(390 + 0.9 * T2), Y(0.6 + 0.02 * (T2 + 40) + (T2 > 0 ? 0.04 * T2 : 0))]); }
      g.caminho(dome, { cor: 'borda', larg: 1.6 });
      var ciclo = [[X(h1), Y(Pe)], [X(h2s), Y(Pc)], [X(h3), Y(Pc)], [X(h4), Y(Pe)], [X(h1), Y(Pe)]];
      g.caminho(ciclo, { cor: 's2', larg: 2.6 });
      ['1', '2', '3', '4'].forEach(function (r, k) {
        g.circ(ciclo[k][0], ciclo[k][1], 0.12, { preenche: 'texto', cor: null });
        g.txt(r, ciclo[k][0] + 0.25, ciclo[k][1] + 0.25, { cor: 'texto', tam: 11 });
      });
      g.txt('h (kJ/kg)', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('P (log)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.0;
      g.txt('q_L = ' + fx(qL, 1) + ' kJ/kg', x0, 5.0, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('w = ' + fx(w, 1) + ' kJ/kg', x0, 4.3, { cor: 's4', tam: 13, alin: 'esq' });
      g.txt('COP = ' + fx(COP, 2), x0, 3.4, { cor: 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt('Carnot ' + fx(copC, 2) + ' → ' + fx(100 * COP / copC, 0) + ' % do máximo', x0, 2.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('razão de compressão ' + fx(Pc / Pe, 2), x0, 1.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(Pc / Pe > 8 ? 'razão alta: considere dois estágios' : 'razão adequada para um estágio',
        x0, 1.1, { cor: Pc / Pe > 8 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('valores aproximados de R-134a para leitura do ciclo', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 6.1 — misturas de gases */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Fração molar e fração mássica não são iguais: o componente mais pesado tem fração mássica maior que a molar.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'yO2', rot: 'Fração molar de O₂', min: 5, max: 95, val: 21, passo: 1, un: '%' },
      { id: 'P', rot: 'Pressão total', min: 50, max: 500, val: 101, passo: 1, un: 'kPa' }
    ],
    desenhar: function (g, p) {
      var yO = p.yO2 / 100, yN = 1 - yO, MO = 32, MN = 28;
      var Mm = yO * MO + yN * MN;
      var xO = yO * MO / Mm, xN = 1 - xO;
      var pO = yO * p.P, pN = yN * p.P;
      var R = 8.314 / Mm;
      var x0 = 1.2, esc = 5.6;
      [['fração molar O₂', yO, 's1'], ['fração mássica O₂', xO, 's2']].forEach(function (b, i) {
        var y = 4.4 - i * 1.3;
        g.txt(b[0], x0, y + 0.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.ret(x0, y, esc * b[1], 0.55, { preenche: b[2], cor: null, alfa: 0.85 });
        g.ret(x0 + esc * b[1], y, esc * (1 - b[1]), 0.55, { preenche: 'borda', cor: null, alfa: 0.7 });
        g.txt(fx(100 * b[1], 1) + ' %', x0 + esc + 0.25, y + 0.28, { cor: b[2], tam: 12, alin: 'esq', negrito: true });
      });
      g.txt('O₂ (32 g/mol) e N₂ (28 g/mol)', x0, 1.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      var bx = 8.4;
      g.txt('massa molar da mistura', bx, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Mm, 2) + ' g/mol', bx, 4.4, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('R da mistura ' + fx(R, 4) + ' kJ/kg·K', bx, 3.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('pressões parciais (Dalton)', bx, 2.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('O₂ ' + fx(pO, 1) + ' kPa', bx, 2.2, { cor: 's1', tam: 12, alin: 'esq' });
      g.txt('N₂ ' + fx(pN, 1) + ' kPa', bx, 1.6, { cor: 's3', tam: 12, alin: 'esq' });
      g.txt('no ar atmosférico: 21 % em mol e 23 % em massa de oxigênio', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.1 — psicrometria */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Carta psicrométrica simplificada: cada processo de climatização é um segmento. Aquecer anda na horizontal; resfriar com desumidificação desce até a saturação (exemplo 7.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura de bulbo seco', min: 5, max: 45, val: 30, passo: 1, un: '°C' },
      { id: 'ur', rot: 'Umidade relativa', min: 10, max: 100, val: 50, passo: 5, un: '%' }
    ],
    desenhar: function (g, p) {
      var T = p.T, ur = p.ur / 100, P = 101.325;
      var pv = ur * psat(T), w = 0.622 * pv / (P - pv);
      var h = 1.005 * T + w * (2501 + 1.82 * T);
      var Tdp = 243.04 * Math.log(pv / 0.61094) / (17.625 - Math.log(pv / 0.61094));
      var gx = 1.3, gy = 1.0, gw = 6.4, gh = 4.2;
      var X = function (t) { return gx + gw * (t - 0) / 50; }, Y = function (wv) { return gy + gh * wv / 0.03; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i;
      [1, 0.8, 0.6, 0.4, 0.2].forEach(function (phi) {
        var pts = [];
        for (i = 0; i <= 40; i++) {
          var t = 50 * i / 40;
          var pvv = phi * psat(t), wv = 0.622 * pvv / (P - pvv);
          if (wv <= 0.031) pts.push([X(t), Y(wv)]);
        }
        g.caminho(pts, { cor: phi === 1 ? 's1' : 'borda', larg: phi === 1 ? 2.2 : 1.1 });
        if (phi < 1) g.txt(fx(100 * phi, 0) + ' %', pts[pts.length - 1][0] + 0.2, pts[pts.length - 1][1], { cor: 'fraco', tam: 10, alin: 'esq' });
      });
      g.circ(X(T), Y(w), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(Tdp), Y(w), X(T), Y(w), { cor: 'erro', larg: 1, tracejado: [4, 3] });
      g.circ(X(Tdp), Y(w), 0.11, { preenche: 's3', cor: null });
      [10, 20, 30, 40, 50].forEach(function (t) {
        g.linha(X(t), gy, X(t), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(t + '', X(t), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [0.01, 0.02, 0.03].forEach(function (wv) {
        g.linha(gx, Y(wv), gx - 0.15, Y(wv), { cor: 'fraco', larg: 1 });
        g.txt(fx(1000 * wv, 0), gx - 0.28, Y(wv), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('bulbo seco (°C)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('ω (g/kg)', gx - 0.35, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.4;
      g.txt('ω = ' + fx(1000 * w, 2) + ' g/kg', x0, 5.0, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('h = ' + fx(h, 1) + ' kJ/kg', x0, 4.2, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('orvalho ' + fx(Tdp, 1) + ' °C', x0, 3.4, { cor: 's3', tam: 13, alin: 'esq', negrito: true });
      g.txt('pv = ' + fx(pv, 3) + ' kPa', x0, 2.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('superfícies abaixo de ' + fx(Tdp, 0) + ' °C', x0, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('condensam água', x0, 1.25, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('aquecer move na horizontal (ω constante) e derruba a umidade relativa', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 8.1 — bocal e Mach */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Relação área-Mach: abaixo de 1 a área decresce para acelerar; acima de 1, cresce. Por isso o bocal supersônico é convergente-divergente (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'M', rot: 'Número de Mach', min: 0.1, max: 4, val: 2, passo: 0.05 }],
    desenhar: function (g, p) {
      var M = p.M;
      var T0T = 1 + (K - 1) / 2 * M * M;
      var p0p = Math.pow(T0T, K / (K - 1));
      var AAs = (1 / M) * Math.pow((2 + (K - 1) * M * M) / (K + 1), (K + 1) / (2 * (K - 1)));
      var gx = 1.3, gy = 1.0, gw = 5.4, gh = 4.2;
      var X = function (m) { return gx + gw * m / 4; }, Y = function (a) { return gy + gh * Math.min(a, 6) / 6; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 1; i <= 80; i++) {
        var m = 4 * i / 80;
        pts.push([X(m), Y((1 / m) * Math.pow((2 + (K - 1) * m * m) / (K + 1), (K + 1) / (2 * (K - 1))))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.circ(X(M), Y(AAs), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [5, 4] });
      g.txt('M = 1 (garganta)', X(1), gy + gh + 0.3, { cor: 'aviso', tam: 10.5, fundo: true });
      [1, 2, 3, 4].forEach(function (m) {
        g.linha(X(m), gy, X(m), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(m + '', X(m), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('Mach', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('A/A*', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      /* bocal desenhado */
      var bx = 7.4, by = 4.0, L = 4.0;
      var perfil = [], j;
      for (j = 0; j <= 40; j++) {
        var f = j / 40;
        var mm = 0.2 + (Math.max(M, 1.2) - 0.2) * f;
        var aa = (1 / mm) * Math.pow((2 + (K - 1) * mm * mm) / (K + 1), (K + 1) / (2 * (K - 1)));
        perfil.push([bx + L * f, by + Math.min(1.1, aa * 0.22)]);
      }
      g.caminho(perfil, { cor: 'forte', larg: 2 });
      g.caminho(perfil.map(function (q) { return [q[0], 2 * by - q[1]]; }), { cor: 'forte', larg: 2 });
      var x0 = 7.4;
      g.txt('T₀/T = ' + fx(T0T, 3), x0, 2.2, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('p₀/p = ' + fx(p0p, 2), x0, 1.5, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('A/A* = ' + fx(AAs, 3), x0, 0.8, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(M < 1 ? 'subsônico: convergente acelera' : 'supersônico: divergente acelera', x0, 0.1,
        { cor: M < 1 ? 's1' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ar com k = 1,4 · A* é a área da garganta', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 9.1 — choque normal */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Choque normal: o escoamento passa a subsônico, pressão e temperatura sobem e a pressão de estagnação cai — essa perda é a medida da irreversibilidade (exemplo 9.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'M1', rot: 'Mach antes do choque', min: 1.05, max: 4, val: 2, passo: 0.05 }],
    desenhar: function (g, p) {
      var M1 = p.M1;
      var M2 = Math.sqrt((1 + (K - 1) / 2 * M1 * M1) / (K * M1 * M1 - (K - 1) / 2));
      var p21 = (2 * K * M1 * M1 - (K - 1)) / (K + 1);
      var T21 = ((2 * K * M1 * M1 - (K - 1)) * ((K - 1) * M1 * M1 + 2)) / (Math.pow(K + 1, 2) * M1 * M1);
      var r21 = p21 / T21;
      var p0201 = Math.pow(((K + 1) * M1 * M1 / 2) / (1 + (K - 1) / 2 * M1 * M1), K / (K - 1)) *
                  Math.pow((K + 1) / (2 * K * M1 * M1 - (K - 1)), 1 / (K - 1));
      var ox = 1.2, cy = 3.6;
      g.ret(ox, cy - 1.0, 8.6, 2.0, { cor: 'forte', larg: 1.8 });
      g.linha(ox + 4.3, cy - 1.0, ox + 4.3, cy + 1.0, { cor: 'erro', larg: 3 });
      g.txt('choque', ox + 4.3, cy + 1.3, { cor: 'erro', tam: 11.5, fundo: true });
      g.seta(ox + 1.0, cy, 1.6, 0, { cor: 's1', larg: 2.4, rot: 'M₁ = ' + fx(M1, 2), rotTam: 11.5, rotDy: 0.5, rotDx: -0.6 });
      g.seta(ox + 5.6, cy, 0.9, 0, { cor: 's3', larg: 2.4, rot: 'M₂ = ' + fx(M2, 3), rotTam: 11.5, rotDy: 0.5, rotDx: 0.3 });
      var x0 = 1.2, esc = 2.0;
      var itens = [['p₂/p₁', p21, 'erro'], ['T₂/T₁', T21, 's2'], ['ρ₂/ρ₁', r21, 's4'], ['p₀₂/p₀₁', p0201, 's3']];
      itens.forEach(function (it, i) {
        var y = 1.6 - i * 0.62;
        g.txt(it[0], x0, y + 0.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.ret(x0 + 1.3, y, Math.min(5.6, it[1] * esc / 2), 0.42, { preenche: it[2], cor: null, alfa: 0.8 });
        g.txt(fx(it[1], 3), x0 + 1.45 + Math.min(5.6, it[1] * esc / 2), y + 0.2, { cor: it[2], tam: 11.5, alin: 'esq', negrito: true });
      });
      var bx = 8.8;
      g.txt('perda de pressão', bx, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('de estagnação', bx, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(100 * (1 - p0201), 1) + ' %', bx, 0.7, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('quanto mais forte o choque, maior a perda — e por isso difusores supersônicos usam choques oblíquos', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

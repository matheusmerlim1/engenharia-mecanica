/* ============================================================
   Figuras ilustrativas de Bombas e Compressores
   Famílias de máquinas, Euler, escorregamento, curva do sistema,
   NPSH, associação, semelhança, compressão e turbinas.
   Todos os números saem das equações dos capítulos.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var G = 9.81;

  /* ---------- 1.1 — deslocamento positivo contra turbomáquina ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'A diferença não é de tamanho, é de comportamento: fechando a descarga, a turbomáquina vai para o shutoff e a volumétrica continua insistindo — a pressão sobe até algo romper.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Máquina: 1 centrífuga · 2 deslocamento positivo', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'C', rot: 'Fechamento da válvula (perda do sistema)', min: 1000, max: 40000, val: 4000, passo: 500 }
    ],
    desenhar: function (g, p) {
      var dp = Math.round(p.tipo) === 2, C = p.C, dz = 20;
      var a = 64, b = 8000;                      /* curva da centrífuga */
      var Qn = 0.06, kslip = 3e-5;               /* volumétrica: vazão quase fixa */
      var Hb = function (Q) { return dp ? (Qn - Q) / kslip : a - b * Q * Q; };
      var Hs = function (Q) { return dz + C * Q * Q; };
      var lo = 0, hi = 0.12, m;
      for (var i = 0; i < 60; i++) { m = (lo + hi) / 2; if (Hb(m) > Hs(m)) lo = m; else hi = m; }
      var Qop = m, Hop = Hs(Qop);
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var Hmax = dp ? 260 : 90;
      var X = function (Q) { return gx + gw * lim(Q, 0, 0.12) / 0.12; };
      var Y = function (H) { return gy + gh * lim(H, 0, Hmax) / Hmax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pb = [], ps = [];
      for (i = 0; i <= 90; i++) {
        var Q = 0.12 * i / 90;
        pb.push([X(Q), Y(Hb(Q))]);
        ps.push([X(Q), Y(Hs(Q))]);
      }
      g.caminho(pb, { cor: 's1', larg: 2.8 });
      g.caminho(ps, { cor: 'erro', larg: 2.2, tracejado: [6, 4] });
      g.circ(X(Qop), Y(Hop), 0.16, { preenche: 'erro', cor: null });
      g.txt(dp ? 'volumétrica' : 'centrífuga', X(0.015), Y(Hb(0.015)) + 0.35, { cor: 's1', tam: 11, alin: 'esq', fundo: true });
      g.txt('sistema', X(0.1), Y(Hs(0.1)) + 0.3, { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true });
      [0.03, 0.06, 0.09, 0.12].forEach(function (Q) {
        g.linha(X(Q), gy, X(Q), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(Q * 3600, 0), X(Q), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [Hmax / 4, Hmax / 2, 3 * Hmax / 4].forEach(function (H) {
        g.linha(gx, Y(H), gx - 0.14, Y(H), { cor: 'fraco', larg: 1 });
        g.txt(fx(H, 0), gx - 0.26, Y(H), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('vazão (m³/h)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('H (m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4;
      g.txt(dp ? 'deslocamento positivo' : 'turbomáquina', xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('ponto de operação', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Qop * 3600, 1) + ' m³/h a ' + fx(Hop, 1) + ' m', xr, 3.7, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      var Hfecha = dp ? Hb(0.001) : a;
      g.txt('fechando a válvula até o fim:', xr, 2.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(dp ? 'pressão sem limite' : 'shutoff a ' + fx(a, 0) + ' m', xr, 2.35,
        { cor: dp ? 'erro' : 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt(dp ? 'exige válvula de alívio na descarga' : 'seguro por pouco tempo', xr, 1.7,
        { cor: dp ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(dp ? 'a vazão quase não muda com a pressão' : 'a vazão cai quando a pressão sobe',
        xr, 1.05, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('a curva da volumétrica só se inclina pelo escorregamento interno', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — triângulo de velocidades ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'O triângulo de saída resolve o rotor: a componente tangencial de c entrega a altura, e a meridional só transporta a vazão. O ângulo da pá decide se a curva desce ou sobe (exemplo 2.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'beta', rot: 'Ângulo da pá β₂', min: 15, max: 150, val: 30, passo: 5, un: '°' },
      { id: 'n', rot: 'Rotação', min: 500, max: 3500, val: 1750, passo: 50, un: 'rpm' },
      { id: 'Q', rot: 'Vazão', min: 0.005, max: 0.12, val: 0.05, passo: 0.005, un: 'm³/s' }
    ],
    desenhar: function (g, p) {
      var beta = p.beta * Math.PI / 180, n = p.n, Q = p.Q, D2 = 0.3, b2 = 0.02;
      var u2 = Math.PI * D2 * n / 60, cm2 = Q / (Math.PI * D2 * b2);
      var cu2 = u2 - cm2 / Math.tan(beta), H = u2 * cu2 / G;
      var esc = 4.6 / Math.max(u2, 1), K = 3.2;      /* K: exagero vertical, para o triângulo ser visível */
      var escV = esc * K;
      var ox = 1.0, oy = 2.0, topo = cm2 * escV;
      g.linha(ox, oy, ox + 5.2, oy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.seta(ox, oy, u2 * esc, 0, { cor: 's3', larg: 2.4 });
      g.txt('u₂ = ' + fx(u2, 1) + ' m/s', ox + u2 * esc / 2, oy - 0.32, { cor: 's3', tam: 11, fundo: true });
      g.linha(ox + cu2 * esc, oy, ox + cu2 * esc, oy + topo, { cor: 's4', larg: 1.6, tracejado: [3, 3] });
      g.txt('c_m2 = ' + fx(cm2, 2), ox + cu2 * esc - 0.12, oy + topo / 2, { cor: 's4', tam: 10, alin: 'dir' });
      g.seta(ox, oy, cu2 * esc, topo, { cor: 's1', larg: 2.6 });
      g.txt('c₂', ox + cu2 * esc * 0.55, oy + topo * 0.55 + 0.3, { cor: 's1', tam: 12, negrito: true, fundo: true });
      g.seta(ox + u2 * esc, oy, (cu2 - u2) * esc, topo, { cor: 'erro', larg: 2.4 });
      g.txt('w₂  (β₂ = ' + fx(p.beta, 0) + '°)', ox + (u2 + cu2) * esc / 2 + 0.1, oy + topo + 0.32, { cor: 'erro', tam: 11, alin: 'esq', fundo: true });
      g.cota(ox, oy - 0.95, ox + cu2 * esc, oy - 0.95, 'c_u2 = ' + fx(cu2, 1) + ' m/s', { dy: -0.3 });
      g.txt('triângulo de saída · escala vertical ampliada ' + K + '×', ox + 2.4, oy + 2.3, { cor: 'fraco', tam: 10.5 });
      var xr = 7.0;
      g.txt('u₂ = πD₂n/60 = ' + fx(u2, 2) + ' m/s', xr, 5.0, { cor: 's3', tam: 12, alin: 'esq' });
      g.txt('c_m2 = Q/(πD₂b₂) = ' + fx(cm2, 2) + ' m/s', xr, 4.4, { cor: 's4', tam: 12, alin: 'esq' });
      g.txt('c_u2 = u₂ − c_m2/tanβ₂', xr, 3.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('c_u2 = ' + fx(cu2, 2) + ' m/s', xr, 3.3, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('H∞ = u₂c_u2/g = ' + fx(H, 1) + ' m', xr, 2.5, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt(p.beta < 85 ? 'pá para trás: curva decrescente e estável' :
        p.beta < 95 ? 'pá radial: curva horizontal' : 'pá para a frente: curva crescente e instável',
        xr, 1.7, { cor: p.beta < 85 ? 'ok' : p.beta < 95 ? 'aviso' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('rotor de 300 mm com 20 mm de largura na saída', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('entrada radial (c_u1 = 0) · o triângulo real é bem mais achatado que o desenho', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — de Euler à altura real ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'A cascata da altura: o escorregamento tira a maior fatia, e ele não é atrito — é trabalho que nunca chegou ao líquido. Só depois entram as perdas (exemplo 3.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'z', rot: 'Número de pás', min: 3, max: 12, val: 6, passo: 1 },
      { id: 'eh', rot: 'Rendimento hidráulico', min: 0.7, max: 0.95, val: 0.85, passo: 0.01 },
      { id: 'beta', rot: 'Ângulo da pá β₂', min: 15, max: 60, val: 30, passo: 5, un: '°' }
    ],
    desenhar: function (g, p) {
      var z = Math.round(p.z), eh = p.eh, beta = p.beta * Math.PI / 180;
      var D2 = 0.3, n = 1750, b2 = 0.02, Q = 0.05, ev = 0.97, em = 0.95;
      var u2 = Math.PI * D2 * n / 60, cm2 = Q / (Math.PI * D2 * b2);
      var cu2 = u2 - cm2 / Math.tan(beta), Hinf = u2 * cu2 / G;
      var dcu = Math.PI * u2 * Math.sin(beta) / z;
      var Hteo = u2 * Math.max(cu2 - dcu, 0) / G, Hreal = eh * Hteo;
      var eta = eh * ev * em, P = 1000 * G * Q * Hreal / eta / 1000;
      var gx = 1.1, gy = 1.0, gw = 5.6, gh = 3.9;
      var Y = function (H) { return gy + gh * lim(H / Math.max(Hinf, 1), 0, 1); };
      var bw = 1.15, xs = [gx + 0.25, gx + 2.05, gx + 3.85];
      var barras = [[Hinf, 'H de Euler', 's3'], [Hteo, 'após escorregamento', 'aviso'], [Hreal, 'altura real', 's1']];
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      barras.forEach(function (bb, i) {
        g.ret(xs[i], gy, bw, Y(bb[0]) - gy, { cor: 'fundo', larg: 1, preenche: bb[2], alfa: 0.65 });
        g.txt(fx(bb[0], 1) + ' m', xs[i] + bw / 2, Y(bb[0]) + 0.3, { cor: 'texto', tam: 11.5, negrito: true });
        g.txt(bb[1], xs[i] + bw / 2, gy - 0.4, { cor: 'suave', tam: 10 });
      });
      g.seta(xs[0] + bw + 0.1, Y(Hinf) - 0.1, 0.25, Y(Hteo) - Y(Hinf) + 0.2, { cor: 'erro', larg: 1.6, ponta: 0.18 });
      g.txt('−' + fx(Hinf - Hteo, 1) + ' m', (xs[0] + bw + xs[1]) / 2 + 0.1, (Y(Hinf) + Y(Hteo)) / 2 + 0.3, { cor: 'erro', tam: 10, fundo: true });
      g.seta(xs[1] + bw + 0.1, Y(Hteo) - 0.1, 0.25, Y(Hreal) - Y(Hteo) + 0.2, { cor: 'erro', larg: 1.6, ponta: 0.18 });
      g.txt('−' + fx(Hteo - Hreal, 1) + ' m', (xs[1] + bw + xs[2]) / 2 + 0.1, (Y(Hteo) + Y(Hreal)) / 2 + 0.3, { cor: 'erro', tam: 10, fundo: true });
      var xr = 7.2;
      g.txt('Δc_u2 = π u₂ senβ₂ / z', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('= ' + fx(dcu, 2) + ' m/s', xr, 4.45, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('escorregamento tira ' + fx(100 * (Hinf - Hteo) / Hinf, 1) + ' %', xr, 3.8, { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('perdas hidráulicas tiram ' + fx(100 * (Hteo - Hreal) / Hinf, 1) + ' %', xr, 3.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('altura real ' + fx(Hreal, 1) + ' m', xr, 2.5, { cor: 's1', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('η = η_h η_v η_m = ' + fx(eta, 3), xr, 1.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('P eixo = ρgQH/η = ' + fx(P, 1) + ' kW', xr, 1.2, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('mesmo rotor do exemplo 2.1, com η_v = 0,97 e η_m = 0,95 e Q = 0,05 m³/s', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — ponto de operação ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'O ponto de operação não é escolha da bomba nem do projetista: é onde a curva da máquina encontra a da instalação. Fechar a válvula só inclina a parábola (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'dz', rot: 'Desnível geométrico', min: 0, max: 50, val: 20, passo: 1, un: 'm' },
      { id: 'C', rot: 'Coeficiente de perda do sistema', min: 500, max: 20000, val: 4000, passo: 250 },
      { id: 'rot', rot: 'Rotação relativa', min: 0.5, max: 1.1, val: 1, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var dz = p.dz, C = p.C, r = p.rot, a = 64, b = 8000;
      var Hb = function (Q) { return a * r * r - b * Q * Q; };
      var Hs = function (Q) { return dz + C * Q * Q; };
      var Qop = Math.sqrt(Math.max(a * r * r - dz, 0) / (b + C)), Hop = Hs(Qop);
      var eta = 0.78 * (1 - Math.pow((Qop / (0.06 * r) - 1), 2) * 0.55);
      eta = lim(eta, 0.15, 0.85);
      var Pot = 1000 * G * Qop * Hop / eta / 1000;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (Q) { return gx + gw * lim(Q, 0, 0.1) / 0.1; };
      var Y = function (H) { return gy + gh * lim(H, 0, 80) / 80; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pb = [], ps = [], p0 = [];
      for (i = 0; i <= 80; i++) {
        var Q = 0.1 * i / 80;
        if (Hb(Q) > 0) pb.push([X(Q), Y(Hb(Q))]);
        ps.push([X(Q), Y(Hs(Q))]);
        p0.push([X(Q), Y(a - b * Q * Q)]);
      }
      if (r < 0.999) g.caminho(p0, { cor: 'fraco', larg: 1.2, tracejado: [5, 4] });
      g.caminho(pb, { cor: 's1', larg: 2.8 });
      g.caminho(ps, { cor: 'erro', larg: 2.4 });
      g.linha(gx, Y(dz), gx + gw, Y(dz), { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      g.txt('Δz = ' + fx(dz, 0) + ' m', gx + 0.12, Y(dz) + 0.26, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.circ(X(Qop), Y(Hop), 0.17, { preenche: 'erro', cor: null });
      g.linha(X(Qop), gy, X(Qop), Y(Hop), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      g.txt('bomba', X(0.012), Y(Hb(0.012)) + 0.3, { cor: 's1', tam: 10.5, alin: 'esq', fundo: true });
      g.txt('sistema', X(0.088), Y(Hs(0.088)) + 0.3, { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true });
      [0.02, 0.04, 0.06, 0.08, 0.1].forEach(function (Q) {
        g.linha(X(Q), gy, X(Q), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(Q * 3600, 0), X(Q), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [20, 40, 60, 80].forEach(function (H) {
        g.linha(gx, Y(H), gx - 0.14, Y(H), { cor: 'fraco', larg: 1 });
        g.txt(H + '', gx - 0.26, Y(H), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('vazão (m³/h)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('H (m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.5;
      g.txt('H_sis = Δz + C Q²', xr, 5.0, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('Q = ' + fx(Qop * 3600, 1) + ' m³/h', xr, 4.3, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('H = ' + fx(Hop, 2) + ' m', xr, 3.6, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('rendimento ≈ ' + fx(100 * eta, 0) + ' %', xr, 2.9, { cor: eta > 0.7 ? 'ok' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('potência de eixo ' + fx(Pot, 1) + ' kW', xr, 2.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(dz > a * r * r ? 'a bomba não vence o desnível' :
        C > 12000 ? 'sistema muito íngreme: pouca vazão' : 'operação normal',
        xr, 1.6, { cor: dz > a * r * r ? 'erro' : C > 12000 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('rotação em ' + fx(100 * r, 0) + ' % da nominal', xr, 1.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('curva da bomba H = 64 (n/n₀)² − 8000 Q², do exemplo 4.1', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — NPSH ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'O NPSH disponível é o que a instalação oferece acima da pressão de vapor. Líquido quente derruba essa reserva depressa — a mesma bomba que opera bem com água fria cavita com água a 80 °C (exemplo 5.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'zs', rot: 'Altura acima do nível (negativa: afogada)', min: -4, max: 8, val: 3, passo: 0.2, un: 'm' },
      { id: 'T', rot: 'Temperatura da água', min: 10, max: 100, val: 20, passo: 1, un: '°C' },
      { id: 'hf', rot: 'Perda na sucção', min: 0, max: 5, val: 1.2, passo: 0.1, un: 'm' }
    ],
    desenhar: function (g, p) {
      var zs = p.zs, T = p.T, hf = p.hf, NPSHr = 4.5;
      function pvap(t) {                       /* Antoine para a água, em Pa */
        return 133.322 * Math.pow(10, 8.07131 - 1730.63 / (233.426 + t));
      }
      function rho(t) { return 1000 * (1 - Math.pow((t + 288.9414) / (508929.2 * (t + 68.12963)), 1) * Math.pow(t - 3.9863, 2)); }
      function npshd(t, z, h) { return (101325 - pvap(t)) / (rho(t) * G) - z - h; }
      var NP = npshd(T, zs, hf), margem = NP - NPSHr;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (t) { return gx + gw * lim(t - 10, 0, 90) / 90; };
      var Y = function (v) { return gy + gh * lim(v + 2, 0, 13) / 13; };
      g.ret(gx, gy, gw, Y(NPSHr) - gy, { preenche: 'erro', cor: null, alfa: 0.1 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(NPSHr), gx + gw, Y(NPSHr), { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('NPSH requerido ' + fx(NPSHr, 1) + ' m', gx + gw - 0.12, Y(NPSHr) - 0.3, { cor: 'erro', tam: 10.5, alin: 'dir' });
      g.linha(gx, Y(NPSHr + 0.5), gx + gw, Y(NPSHr + 0.5), { cor: 'aviso', larg: 1, tracejado: [3, 3] });
      g.txt('+ margem de 0,5 m', gx + gw - 0.12, Y(NPSHr + 0.5) + 0.26, { cor: 'aviso', tam: 10, alin: 'dir' });
      var i, j, zrefs = [-2, 0, 3, 6];
      zrefs.forEach(function (z) {
        var pts = [];
        for (j = 0; j <= 90; j++) { var t = 10 + j; pts.push([X(t), Y(npshd(t, z, hf))]); }
        var ativo = Math.abs(z - zs) < 0.3;
        g.caminho(pts, { cor: ativo ? 's1' : 'fraco', larg: ativo ? 2.8 : 1.2 });
        g.txt(z < 0 ? 'afogada ' + fx(-z, 0) + ' m' : 'z = ' + fx(z, 0) + ' m',
          X(11.5), Y(npshd(11.5, z, hf)) + 0.26, { cor: 'fraco', tam: 9.5, alin: 'esq', fundo: true });
      });
      var cur = [];
      for (j = 0; j <= 90; j++) { var t2 = 10 + j; cur.push([X(t2), Y(npshd(t2, zs, hf))]); }
      g.caminho(cur, { cor: 's1', larg: 2.8 });
      g.circ(X(T), Y(NP), 0.16, { preenche: margem > 0.5 ? 'ok' : 'erro', cor: null });
      [20, 40, 60, 80, 100].forEach(function (t) {
        g.linha(X(t), gy, X(t), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(t + '', X(t), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0, 4, 8].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('temperatura da água (°C)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('NPSH disponível (m)', gx + gw, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.5;
      g.txt('p_v a ' + fx(T, 0) + ' °C = ' + fx(pvap(T) / 1000, 2) + ' kPa', xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('(p_atm − p_v)/ρg = ' + fx((101325 - pvap(T)) / (rho(T) * G), 2) + ' m', xr, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('− z_s ' + fx(zs, 1) + ' m  − h_f ' + fx(hf, 1) + ' m', xr, 3.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('NPSH disp = ' + fx(NP, 2) + ' m', xr, 3.1, { cor: margem > 0.5 ? 'ok' : 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('margem de ' + fx(margem, 2) + ' m', xr, 2.4, { cor: margem > 0.5 ? 'ok' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(margem > 0.5 ? 'opera sem cavitar' : margem > 0 ? 'margem insuficiente' : 'cavita',
        xr, 1.7, { cor: margem > 0.5 ? 'ok' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('afogar a bomba é o remédio mais eficaz', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('pressão de vapor pela equação de Antoine · pressão atmosférica ao nível do mar', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — associação ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Duas bombas em paralelo não dobram a vazão: quanto mais íngreme o sistema, menos a segunda bomba acrescenta. Em série, o ganho vem na altura.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'nb', rot: 'Bombas iguais', min: 1, max: 3, val: 2, passo: 1 },
      { id: 'arr', rot: 'Arranjo: 1 paralelo · 2 série', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'C', rot: 'Coeficiente de perda do sistema', min: 500, max: 20000, val: 4000, passo: 250 }
    ],
    desenhar: function (g, p) {
      var nb = Math.round(p.nb), par = Math.round(p.arr) === 1, C = p.C, dz = 20, a = 64, b = 8000;
      function Hconj(Q, k) { return par ? a - b * Math.pow(Q / k, 2) : k * (a - b * Q * Q); }
      function ponto(k) {
        var lo = 0, hi = 0.3, m;
        for (var i = 0; i < 60; i++) { m = (lo + hi) / 2; if (Hconj(m, k) > dz + C * m * m) lo = m; else hi = m; }
        return m;
      }
      var Q1 = ponto(1), Qn = ponto(nb), Hn = dz + C * Qn * Qn;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (Q) { return gx + gw * lim(Q, 0, 0.16) / 0.16; };
      var Y = function (H) { return gy + gh * lim(H, 0, 160) / 160; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, k, ps = [];
      for (i = 0; i <= 90; i++) { var Q = 0.16 * i / 90; ps.push([X(Q), Y(dz + C * Q * Q)]); }
      g.caminho(ps, { cor: 'erro', larg: 2.4 });
      for (k = 1; k <= 3; k++) {
        var pts = [];
        for (i = 0; i <= 90; i++) {
          var Q2 = 0.16 * i / 90, H = Hconj(Q2, k);
          if (H > 0) pts.push([X(Q2), Y(H)]);
        }
        g.caminho(pts, { cor: k === nb ? 's1' : 'fraco', larg: k === nb ? 2.8 : 1.2, tracejado: k === nb ? null : [4, 3] });
        if (k === nb) g.txt(k + (par ? ' em paralelo' : ' em série'), X(0.013), Y(Hconj(0.013, k)) + 0.3, { cor: 's1', tam: 10.5, alin: 'esq', fundo: true });
      }
      g.circ(X(Q1), Y(dz + C * Q1 * Q1), 0.13, { preenche: 'fraco', cor: null });
      g.circ(X(Qn), Y(Hn), 0.17, { preenche: 'erro', cor: null });
      [0.04, 0.08, 0.12, 0.16].forEach(function (Q) {
        g.linha(X(Q), gy, X(Q), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(Q * 3600, 0), X(Q), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [40, 80, 120, 160].forEach(function (H) {
        g.linha(gx, Y(H), gx - 0.14, Y(H), { cor: 'fraco', larg: 1 });
        g.txt(H + '', gx - 0.26, Y(H), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('vazão (m³/h)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('H (m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.5;
      g.txt(nb + (nb > 1 ? ' bombas ' : ' bomba ') + (par ? 'em paralelo' : 'em série'), xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('uma só: ' + fx(Q1 * 3600, 1) + ' m³/h', xr, 4.3, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('conjunto: ' + fx(Qn * 3600, 1) + ' m³/h', xr, 3.7, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('a ' + fx(Hn, 1) + ' m', xr, 3.1, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('ganho de vazão: ' + fx(100 * (Qn / Q1 - 1), 1) + ' %', xr, 2.4,
        { cor: Qn / Q1 > 1.6 ? 'ok' : 'aviso', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(nb > 1 ? 'seriam ' + fx(100 * (nb - 1), 0) + ' % se o sistema fosse horizontal' : 'referência de uma bomba',
        xr, 1.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(C > 8000 ? 'sistema íngreme: paralelo rende pouco' : 'sistema raso: paralelo compensa',
        xr, 1.05, { cor: C > 8000 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('bombas idênticas · curva unitária H = 64 − 8000 Q²', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.2 — leis de semelhança ---------- */
  F('#fig-6-2', {
    titulo: 'Figura 6.2',
    legenda: 'Reduzir a rotação desloca a curva inteira: a vazão cai com n, a altura com n² e a potência com n³. Os pontos homólogos ficam sobre uma parábola que passa pela origem.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'r', rot: 'Rotação relativa n/n₀', min: 0.5, max: 1.05, val: 0.8, passo: 0.01 },
      { id: 'C', rot: 'Coeficiente de perda do sistema', min: 500, max: 20000, val: 4000, passo: 250 },
      { id: 'dz', rot: 'Desnível geométrico', min: 0, max: 40, val: 20, passo: 1, un: 'm' }
    ],
    desenhar: function (g, p) {
      var r = p.r, C = p.C, dz = p.dz, a = 64, b = 8000;
      function Qop(rr) { return Math.sqrt(Math.max(a * rr * rr - dz, 0) / (b + C)); }
      var Q0 = Qop(1), H0 = dz + C * Q0 * Q0;
      var Q1 = Qop(r), H1 = dz + C * Q1 * Q1;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (Q) { return gx + gw * lim(Q, 0, 0.1) / 0.1; };
      var Y = function (H) { return gy + gh * lim(H, 0, 80) / 80; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, k, rr;
      [0.6, 0.7, 0.8, 0.9, 1].forEach(function (rr2) {
        var pts = [];
        for (i = 0; i <= 80; i++) {
          var Q = 0.1 * i / 80, H = a * rr2 * rr2 - b * Q * Q;
          if (H > 0) pts.push([X(Q), Y(H)]);
        }
        var ativo = Math.abs(rr2 - r) < 0.02;
        g.caminho(pts, { cor: ativo ? 's1' : 'fraco', larg: ativo ? 2.8 : 1.1 });
        g.txt(fx(100 * rr2, 0) + ' %', X(0.004), Y(a * rr2 * rr2) + 0.02, { cor: 'fraco', tam: 9, alin: 'esq' });
      });
      var cur = [];
      for (i = 0; i <= 80; i++) {
        var Q3 = 0.1 * i / 80, H3 = a * r * r - b * Q3 * Q3;
        if (H3 > 0) cur.push([X(Q3), Y(H3)]);
      }
      g.caminho(cur, { cor: 's1', larg: 2.8 });
      var ps = [];
      for (i = 0; i <= 80; i++) { var Q4 = 0.1 * i / 80; ps.push([X(Q4), Y(dz + C * Q4 * Q4)]); }
      g.caminho(ps, { cor: 'erro', larg: 2.2 });
      var hom = [];
      if (Q0 > 0) { for (i = 0; i <= 40; i++) { var Q5 = Q0 * i / 40; hom.push([X(Q5), Y(H0 * Math.pow(Q5 / Q0, 2))]); } }
      g.caminho(hom, { cor: 's3', larg: 1.6, tracejado: [5, 4] });
      g.txt('pontos homólogos', X(Q0 * 0.55), Y(H0 * 0.3) - 0.3, { cor: 's3', tam: 10, fundo: true });
      g.circ(X(Q0), Y(H0), 0.13, { preenche: 'fraco', cor: null });
      g.circ(X(Q1), Y(H1), 0.17, { preenche: 'erro', cor: null });
      [0.02, 0.04, 0.06, 0.08, 0.1].forEach(function (Q) {
        g.linha(X(Q), gy, X(Q), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(Q * 3600, 0), X(Q), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [20, 40, 60, 80].forEach(function (H) {
        g.linha(gx, Y(H), gx - 0.14, Y(H), { cor: 'fraco', larg: 1 });
        g.txt(H + '', gx - 0.26, Y(H), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('vazão (m³/h)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('H (m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.5;
      g.txt('n/n₀ = ' + fx(r, 2), xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('nominal: ' + fx(Q0 * 3600, 1) + ' m³/h a ' + fx(H0, 1) + ' m', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('agora: ' + fx(Q1 * 3600, 1) + ' m³/h a ' + fx(H1, 1) + ' m', xr, 3.7, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      var pot = (Q1 * H1) / (Q0 * H0 || 1);
      g.txt('vazão em ' + fx(100 * Q1 / Q0, 1) + ' %', xr, 3.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('potência útil em ' + fx(100 * pot, 1) + ' %', xr, 2.4, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt('na curva da própria bomba valeriam', xr, 1.7, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('Q ∝ n, H ∝ n² e P ∝ n³ exatos;', xr, 1.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('o desnível muda o ponto de encontro', xr, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('com Δz = 0 o ponto de operação segue exatamente as leis de semelhança', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — compressão no diagrama p-V ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'A área à esquerda da curva é o trabalho: a isotérmica é a mais econômica e a adiabática a mais cara. Resfriar durante a compressão aproxima a máquina do limite de baixo (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'r', rot: 'Razão de pressão', min: 2, max: 20, val: 8, passo: 0.5 },
      { id: 'n', rot: 'Expoente politrópico n', min: 1, max: 1.4, val: 1.3, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var r = p.r, n = p.n, R = 287, T1 = 300, p1 = 1;
      var v1 = R * T1 / (p1 * 1e5);
      function wpol(nn) {
        if (nn < 1.001) return R * T1 * Math.log(r);
        return nn / (nn - 1) * R * T1 * (Math.pow(r, (nn - 1) / nn) - 1);
      }
      var w = wpol(n), wiso = wpol(1), wad = wpol(1.4);
      var T2 = T1 * Math.pow(r, (n - 1) / n);
      var gx = 1.3, gy = 0.9, gw = 5.4, gh = 4.1;
      var X = function (v) { return gx + gw * lim(v / v1, 0, 1.1) / 1.1; };
      var Y = function (pp) { return gy + gh * lim(pp, 0, 21) / 21; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, cams = [[1, 'fraco', 'isotérmica'], [n, 's1', 'politrópica'], [1.4, 'erro', 'adiabática']];
      cams.forEach(function (c) {
        var pts = [];
        for (i = 0; i <= 60; i++) {
          var pp = p1 + (r - p1) * i / 60;
          var v = v1 * Math.pow(p1 / pp, 1 / c[0]);
          pts.push([X(v), Y(pp)]);
        }
        var ativo = c[1] === 's1';
        if (ativo) g.caminho(pts.concat([[X(0), Y(r)], [X(0), Y(p1)]]), { cor: null, preenche: 's1', alfa: 0.15, fechar: true });
        g.caminho(pts, { cor: c[1], larg: ativo ? 2.8 : 1.6, tracejado: ativo ? null : [5, 4] });
      });
      g.txt('isotérmica', X(v1 * 0.35) - 0.1, Y(2.5), { cor: 'fraco', tam: 10, alin: 'dir' });
      g.txt('adiabática', X(v1 * 0.55) + 0.1, Y(3.2), { cor: 'erro', tam: 10, alin: 'esq' });
      g.txt('politrópica n = ' + fx(n, 2), X(v1 * 0.3), Y(r) + 0.3, { cor: 's1', tam: 10.5, fundo: true });
      g.circ(X(v1), Y(p1), 0.13, { preenche: 'texto', cor: null });
      g.txt('1', X(v1) + 0.1, Y(p1) + 0.25, { cor: 'texto', tam: 10.5, alin: 'esq' });
      g.circ(X(v1 * Math.pow(1 / r, 1 / n)), Y(r), 0.13, { preenche: 'texto', cor: null });
      g.txt('2', X(v1 * Math.pow(1 / r, 1 / n)) + 0.1, Y(r) - 0.25, { cor: 'texto', tam: 10.5, alin: 'esq' });
      [5, 10, 15, 20].forEach(function (pp) {
        g.linha(gx, Y(pp), gx - 0.14, Y(pp), { cor: 'fraco', larg: 1 });
        g.txt(pp + '', gx - 0.26, Y(pp), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('volume específico', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('p (bar)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.3;
      g.txt('razão de pressão ' + fx(r, 1) + ':1', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('T₂ = T₁ r^((n−1)/n)', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T₂ = ' + fx(T2 - 273.15, 1) + ' °C', xr, 3.8, { cor: T2 - 273.15 > 180 ? 'erro' : 'aviso', tam: 14, alin: 'esq', negrito: true });
      g.txt('w = ' + fx(w / 1000, 1) + ' kJ/kg', xr, 3.0, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('isotérmica ' + fx(wiso / 1000, 1) + ' kJ/kg (mínimo)', xr, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('adiabática ' + fx(wad / 1000, 1) + ' kJ/kg (máximo)', xr, 1.8, { cor: 'erro', tam: 11, alin: 'esq' });
      g.txt('excesso sobre a isotérmica: ' + fx(100 * (w / wiso - 1), 1) + ' %', xr, 1.1, { cor: 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ar como gás ideal, entrando a 1 bar e 300 K', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.2 — estágios e espaço nocivo ---------- */
  F('#fig-7-2', {
    titulo: 'Figura 7.2',
    legenda: 'Dividir a compressão em estágios com razão igual corta trabalho e temperatura de descarga — e o espaço nocivo mostra por que não adianta exigir muita razão de um estágio só (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'r', rot: 'Razão de pressão total', min: 2, max: 40, val: 8, passo: 0.5 },
      { id: 'n', rot: 'Expoente politrópico n', min: 1.1, max: 1.4, val: 1.3, passo: 0.01 },
      { id: 'c', rot: 'Espaço nocivo', min: 2, max: 14, val: 6, passo: 1, un: '%' }
    ],
    desenhar: function (g, p) {
      var r = p.r, n = p.n, c = p.c / 100, R = 287, T1 = 300;
      function wN(N) {
        var re = Math.pow(r, 1 / N);
        return N * n / (n - 1) * R * T1 * (Math.pow(re, (n - 1) / n) - 1);
      }
      function TN(N) { return T1 * Math.pow(Math.pow(r, 1 / N), (n - 1) / n); }
      function evol(re) { return 1 + c - c * Math.pow(re, 1 / n); }
      var wiso = R * T1 * Math.log(r);
      var gx = 1.2, gy = 1.0, gw = 4.6, gh = 3.9;
      var Y = function (w) { return gy + gh * lim(w / (wN(1) * 1.14), 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(wiso), gx + gw, Y(wiso), { cor: 'ok', larg: 1.4, tracejado: [5, 4] });
      g.txt('isotérmica', gx + 0.1, Y(wiso) + 0.26, { cor: 'ok', tam: 10, alin: 'esq' });
      var i, bw = gw / 5.2;
      for (i = 1; i <= 4; i++) {
        var xx = gx + 0.25 + (i - 1) * gw / 4.3;
        g.ret(xx, gy, bw, Y(wN(i)) - gy, { cor: 'fundo', larg: 1, preenche: i === 2 ? 's1' : 's4', alfa: 0.6 });
        g.txt(fx(wN(i) / 1000, 0), xx + bw / 2, Y(wN(i)) + 0.28, { cor: 'texto', tam: 10.5, negrito: true });
        g.txt(i + (i > 1 ? ' estágios' : ' estágio'), xx + bw / 2, gy - 0.4, { cor: 'suave', tam: 9.5 });
        g.txt(fx(TN(i) - 273.15, 0) + ' °C', xx + bw / 2, gy + 0.3, { cor: 'aviso', tam: 9.5 });
      }
      g.txt('trabalho (kJ/kg)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      /* rendimento volumétrico */
      var ex0 = 6.4, ey0 = 1.0, ew = 2.3, eh = 3.0;
      var EX = function (v) { return ex0 + ew * lim(v - 1, 0, 11) / 11; };
      var EY = function (v) { return ey0 + eh * lim(v, 0, 1); };
      g.linha(ex0, ey0, ex0 + ew, ey0, { cor: 'fraco', larg: 1.2 });
      g.linha(ex0, ey0, ex0, ey0 + eh, { cor: 'fraco', larg: 1.2 });
      var pts = [];
      for (i = 0; i <= 60; i++) { var re = 1 + 11 * i / 60; pts.push([EX(re), EY(Math.max(0, evol(re)))]); }
      g.caminho(pts, { cor: 'erro', larg: 2.4 });
      var reA = Math.pow(r, 1 / 2);
      g.circ(EX(reA), EY(Math.max(0, evol(reA))), 0.14, { preenche: 'erro', cor: null });
      g.txt('η_v por estágio', ex0 + ew / 2, ey0 - 0.78, { cor: 'fraco', tam: 10 });
      g.txt('1', ex0 - 0.15, EY(1), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      [4, 8, 12].forEach(function (v) {
        g.linha(EX(v), ey0, EX(v), ey0 - 0.12, { cor: 'fraco', larg: 1 });
        g.txt(v + '', EX(v), ey0 - 0.36, { cor: 'fraco', tam: 9.5 });
      });
      var xr = 9.1;
      g.txt('razão total ' + fx(r, 1) + ':1', xr, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('em 2 estágios:', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('r por estágio ' + fx(reA, 2), xr, 3.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('w = ' + fx(wN(2) / 1000, 1) + ' kJ/kg', xr, 3.2, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('economia de ' + fx(100 * (1 - wN(2) / wN(1)), 1) + ' %', xr, 2.5, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('T de descarga ' + fx(TN(2) - 273.15, 0) + ' °C', xr, 1.9, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt('η_v = ' + fx(100 * Math.max(0, evol(reA)), 1) + ' % com c = ' + fx(p.c, 0) + ' %', xr, 1.2, { cor: 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('a razão que anula η_v é ' + fx(Math.pow((1 + c) / c, n), 1) + ':1', xr, 0.65, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('estágios com razão igual minimizam o trabalho total', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — Pelton ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'O rendimento da Pelton é uma parábola com máximo exatamente em u = V₁/2: mais devagar, sobra energia cinética na água; mais rápido, o jato mal alcança a concha (exemplo 8.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'H', rot: 'Queda líquida', min: 50, max: 900, val: 400, passo: 10, un: 'm' },
      { id: 'rel', rot: 'Relação u/V₁', min: 0.05, max: 0.95, val: 0.5, passo: 0.01 },
      { id: 'b2', rot: 'Ângulo de saída da concha', min: 140, max: 180, val: 165, passo: 1, un: '°' }
    ],
    desenhar: function (g, p) {
      var H = p.H, rel = p.rel, b2 = p.b2 * Math.PI / 180, kv = 0.98, D = 1.2;
      var V1 = kv * Math.sqrt(2 * G * H), u = rel * V1;
      function eta(x) { return 2 * x * (1 - x) * (1 - Math.cos(b2)); }
      var e = eta(rel), emax = eta(0.5);
      var n = 60 * u / (Math.PI * D);
      var gx = 1.3, gy = 1.0, gw = 5.2, gh = 3.9;
      var X = function (x) { return gx + gw * lim(x, 0, 1); };
      var Y = function (v) { return gy + gh * lim(v, 0, 1.05); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 80; i++) { var x = i / 80; pts.push([X(x), Y(eta(x))]); }
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      g.linha(X(0.5), gy, X(0.5), Y(emax), { cor: 'ok', larg: 1.3, tracejado: [4, 3] });
      g.txt('u = V₁/2', X(0.5) + 0.12, Y(emax) + 0.3, { cor: 'ok', tam: 10.5, alin: 'esq' });
      g.circ(X(rel), Y(e), 0.16, { preenche: 'erro', cor: null });
      [0.25, 0.5, 0.75, 1].forEach(function (x) {
        g.linha(X(x), gy, X(x), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(x, 2), X(x), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.25, 0.5, 0.75, 1].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 2), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('u/V₁', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('rendimento hidráulico', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      /* esboço da concha */
      var cx = gx + 1.5, cy = gy + 0.85;
      g.seta(cx - 1.1, cy, 0.6, 0, { cor: 's1', larg: 2, ponta: 0.18 });
      g.txt('jato', cx - 1.1, cy + 0.3, { cor: 's1', tam: 10, alin: 'esq' });
      g.arco(cx, cy, 0.42, Math.PI / 2, -Math.PI / 2, { cor: 'forte', larg: 2.2 });
      g.linha(cx, cy + 0.42, cx + 0.24, cy + 0.58, { cor: 'forte', larg: 1.8 });
      g.linha(cx, cy - 0.42, cx + 0.24, cy - 0.58, { cor: 'forte', larg: 1.8 });
      g.txt('β₂ = ' + fx(p.b2, 0) + '°', cx + 0.35, cy, { cor: 'fraco', tam: 10, alin: 'esq' });
      var xr = 7.3;
      g.txt('V₁ = k_v √(2gH) = ' + fx(V1, 1) + ' m/s', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('u = ' + fx(u, 1) + ' m/s', xr, 4.4, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('η_h = ' + fx(100 * e, 1) + ' %', xr, 3.7, { cor: e > 0.9 * emax ? 'ok' : 'aviso', tam: 15, alin: 'esq', negrito: true });
      g.txt('máximo possível ' + fx(100 * emax, 1) + ' %', xr, 3.05, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('roda de 1,2 m: n = ' + fx(n, 0) + ' rpm', xr, 0.95, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('k_v = 0,98 · perder 15° em β₂ custa menos de 2 % de rendimento', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — faixa de operação ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Fora da faixa em torno do melhor rendimento a bomba não só gasta mais: ela recircula, vibra e sofre empuxo. Selecionar é fazer o ponto de operação cair perto do BEP.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'q', rot: 'Vazão em relação ao BEP', min: 0.2, max: 1.4, val: 1, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var q = p.q;
      function eta(x) { return 0.82 * (1 - 2.2 * Math.pow(x - 1, 2)); }
      function npshr(x) { return 3 + 4.5 * x * x; }
      function pot(x) { return 0.45 + 0.65 * x; }
      var e = Math.max(eta(q), 0);
      var gx = 1.3, gy = 1.0, gw = 5.8, gh = 3.9;
      var X = function (x) { return gx + gw * lim(x - 0.2, 0, 1.2) / 1.2; };
      var Y = function (v) { return gy + gh * lim(v, 0, 1); };
      g.ret(X(0.7), gy, X(1.2) - X(0.7), gh, { preenche: 'ok', cor: null, alfa: 0.1 });
      g.ret(gx, gy, X(0.5) - gx, gh, { preenche: 'erro', cor: null, alfa: 0.1 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pe = [], pn = [], pp = [];
      for (i = 0; i <= 80; i++) {
        var x = 0.2 + 1.2 * i / 80;
        pe.push([X(x), Y(Math.max(eta(x), 0))]);
        pn.push([X(x), Y(npshr(x) / 13)]);
        pp.push([X(x), Y(pot(x) * 0.6)]);
      }
      g.caminho(pe, { cor: 's1', larg: 2.8 });
      g.caminho(pn, { cor: 'erro', larg: 1.8, tracejado: [5, 4] });
      g.caminho(pp, { cor: 's3', larg: 1.8, tracejado: [2, 3] });
      g.txt('rendimento', X(0.6), Y(eta(0.6)) + 0.32, { cor: 's1', tam: 10.5, fundo: true });
      g.txt('NPSH requerido', X(1.32), Y(npshr(1.32) / 13) + 0.26, { cor: 'erro', tam: 10, alin: 'dir', fundo: true });
      g.txt('potência', X(0.33), Y(pot(0.33) * 0.6) + 0.28, { cor: 's3', tam: 10, alin: 'esq', fundo: true });
      g.linha(X(1), gy, X(1), Y(eta(1)), { cor: 'ok', larg: 1.3, tracejado: [4, 3] });
      g.txt('BEP', X(1), gy + gh - 0.22, { cor: 'ok', tam: 10.5, fundo: true });
      g.txt('faixa recomendada', X(0.95), gy + 0.3, { cor: 'ok', tam: 10 });
      g.txt('recirculação', X(0.34), gy + 0.3, { cor: 'erro', tam: 10 });
      g.circ(X(q), Y(e), 0.16, { preenche: 'erro', cor: null });
      [0.25, 0.5, 0.75, 1, 1.25].forEach(function (x) {
        g.linha(X(x), gy, X(x), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(100 * x, 0) + ' %', X(x), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('vazão em relação ao BEP', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      var xr = 7.6;
      g.txt('Q/Q_BEP = ' + fx(100 * q, 0) + ' %', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('rendimento ' + fx(100 * e, 1) + ' %', xr, 4.3, { cor: e > 0.75 ? 'ok' : 'aviso', tam: 14, alin: 'esq', negrito: true });
      g.txt('contra ' + fx(100 * eta(1), 0) + ' % no BEP', xr, 3.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('NPSH requerido ' + fx(npshr(q), 2) + ' m (3,0 m no mínimo)', xr, 3.0, { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.txt(q < 0.5 ? 'recirculação: aquece e vibra' :
        q < 0.7 ? 'abaixo da faixa recomendada' :
          q <= 1.2 ? 'dentro da faixa recomendada' : 'acima da faixa: NPSH requerido alto',
        xr, 2.2, { cor: q < 0.7 ? 'erro' : q <= 1.2 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('energia perdida: ' + fx(100 * (1 / Math.max(e, 0.01) - 1 / eta(1)) / (1 / eta(1)), 0) + ' % a mais', xr, 1.5,
        { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('o NPSH requerido cresce com o quadrado da vazão', xr, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('curvas típicas de uma centrífuga de porte médio, normalizadas pelo BEP', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

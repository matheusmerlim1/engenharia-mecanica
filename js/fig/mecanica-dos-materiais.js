/* ============================================================
   Figuras ilustrativas de Mecânica dos Materiais
   Cada desenho é calculado pelas fórmulas do capítulo: Hooke, Tr/J,
   My/I, VQ/It, linha elástica, superposição e von Mises.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };

  /* ================= capítulo 1 ================= */

  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Tensão é força por área; deformação é alongamento por comprimento. A lei de Hooke liga as duas, e o alongamento sai de δ = NL/AE (exemplo 1.1).',
    vista: [-0.6, 12.6, -3.0, 5.4],
    altura: 350,
    controles: [
      { id: 'F', rot: 'Força', min: 5, max: 120, val: 50, passo: 5, un: 'kN' },
      { id: 'd', rot: 'Diâmetro', min: 10, max: 40, val: 20, passo: 1, un: 'mm' },
      { id: 'E', rot: 'Módulo E', min: 70, max: 210, val: 200, passo: 10, un: 'GPa' }
    ],
    desenhar: function (g, p) {
      var Fk = p.F * 1000, d = p.d, E = p.E * 1000, L = 2000;
      var A = Math.PI * d * d / 4, sig = Fk / A, eps = sig / E, del = eps * L;
      var ox = 1.0, oy = 2.6, comp = 5.2, esp = Math.max(0.3, d * 0.055);
      g.hachura(ox - 0.1, oy - esp - 0.45, 0.9, Math.PI / 2, { cor: 'forte', d: 0.22 });
      g.linha(ox, oy - esp - 0.45, ox, oy + esp + 0.45, { cor: 'forte', larg: 3 });
      /* barra, com o alongamento exagerado 200× para ser visível */
      var alonga = Math.min(1.2, del * 0.2);
      g.ret(ox, oy - esp, comp + alonga, 2 * esp, { preenche: 'acento', cor: 'forte', larg: 1.4, alfa: 0.3 });
      g.ret(ox, oy - esp, comp, 2 * esp, { cor: 'borda', larg: 1, tracejado: [5, 4] });
      g.seta(ox + comp + alonga, oy, Math.max(0.6, Fk / 120000 * 2.2), 0,
        { cor: 'erro', larg: 2.6, rot: p.F + ' kN', rotTam: 12, rotDy: 0.45, rotDx: 0 });
      g.cota(ox, oy - esp - 0.8, ox + comp, oy - esp - 0.8, 'L = 2,0 m', { dy: -0.3 });
      if (alonga > 0.05) g.cota(ox + comp, oy + esp + 0.5, ox + comp + alonga, oy + esp + 0.5, 'δ', { dy: 0.3 });
      g.txt('alongamento ampliado 200×', ox + comp / 2, oy + esp + 1.3, { cor: 'fraco', tam: 10.5 });
      /* diagrama σ-ε */
      var gx = 7.4, gy = 0.6, gw = 4.4, gh = 4.0, smax = 600;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.1 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.1 });
      var epsMax = smax / E;
      g.caminho([[gx, gy], [gx + gw, gy + gh]], { cor: 'borda', larg: 2 });
      var f = Math.min(1, sig / smax);
      g.circ(gx + gw * f, gy + gh * f, 0.15, { preenche: 'erro', cor: null });
      g.linha(gx, gy + gh * f, gx + gw * f, gy + gh * f, { cor: 'erro', larg: 1, tracejado: [4, 3] });
      g.linha(gx + gw * f, gy, gx + gw * f, gy + gh * f, { cor: 'erro', larg: 1, tracejado: [4, 3] });
      g.txt('ε', gx + gw / 2, gy - 0.45, { cor: 'fraco', tam: 11 });
      g.txt('σ', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('inclinação = E', gx + gw * 0.55, gy + gh * 0.8, { cor: 'fraco', tam: 10.5 });
      g.txt('A = ' + fx(A, 1) + ' mm²', 1.0, 1.1, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('σ = N/A = ' + fx(sig, 1) + ' MPa', 1.0, 0.4, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('ε = σ/E = ' + fx(eps * 1000, 3) + ' ×10⁻³', 1.0, -0.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('δ = NL/AE = ' + fx(del, 2) + ' mm', 1.0, -1.0, { cor: 's3', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(sig > 250 ? 'acima do escoamento de um aço comum (250 MPa): Hooke não vale mais' : 'regime elástico: a barra volta ao comprimento original',
        6, -2.3, { cor: sig > 250 ? 'erro' : 'fraco', tam: 11 });
    }
  });

  F('#fig-1-2', {
    titulo: 'Figura 1.2',
    legenda: 'Coeficiente de Poisson: ao alongar, a barra afina. Para metais ν ≈ 0,3; para borrachas, perto de 0,5 (praticamente sem mudança de volume).',
    vista: [-0.6, 12.6, -2.6, 5.2],
    altura: 330,
    controles: [
      { id: 'eps', rot: 'Deformação axial', min: 0, max: 20, val: 8, passo: 1, un: '‰' },
      { id: 'nu', rot: 'Coeficiente ν', min: 0, max: 0.5, val: 0.3, passo: 0.02 }
    ],
    desenhar: function (g, p) {
      var eps = p.eps / 1000, nu = p.nu;
      var epsLat = -nu * eps;
      var dV = (1 + eps) * Math.pow(1 + epsLat, 2) - 1;
      var ox = 1.6, oy = 1.4, L = 4.0, h = 2.0;
      var k = 18;                     /* ampliação visual */
      g.ret(ox, oy, L, h, { cor: 'borda', larg: 1.4, tracejado: [5, 4] });
      var L2 = L * (1 + eps * k), h2 = h * (1 + epsLat * k);
      g.ret(ox, oy + (h - h2) / 2, L2, h2, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.3 });
      g.seta(ox + L2, oy + h / 2, 1.1, 0, { cor: 'erro', larg: 2.4, rot: 'F', rotTam: 12 });
      g.seta(ox, oy + h / 2, -1.1, 0, { cor: 'erro', larg: 2.4, rot: 'F', rotTam: 12 });
      g.cota(ox, oy - 0.5, ox + L2, oy - 0.5, 'alongou', { dy: -0.3 });
      g.cota(ox + L2 + 0.6, oy + (h - h2) / 2, ox + L2 + 0.6, oy + (h + h2) / 2, 'afinou', { dx: 0.75 });
      g.txt('deformação ampliada ' + k + '×', ox + L / 2, oy + h + 0.9, { cor: 'fraco', tam: 10.5 });
      var x0 = 8.2;
      g.txt('ε axial = ' + fx(eps * 1000, 1) + ' ‰', x0, 4.4, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('ε lateral = −ν·ε = ' + fx(epsLat * 1000, 2) + ' ‰', x0, 3.7, { cor: 's2', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('variação de volume ≈ ' + fx(dV * 1000, 2) + ' ‰', x0, 2.9, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(nu > 0.48 ? 'ν → 0,5: volume praticamente constante' : 'metais: ν entre 0,25 e 0,35', x0, 2.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('G = E / [2(1 + ν)] = ' + fx(200 / (2 * (1 + nu)), 1) + ' GPa (aço)', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });

  /* ================= capítulo 2 ================= */

  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A curva do ensaio de tração define o material. O escoamento convencional é lido pelo offset de 0,2 %; a área sob a curva mede a tenacidade.',
    vista: [-0.6, 12.6, -2.6, 6.2],
    altura: 350,
    controles: [{ id: 'mat', rot: 'Material (1 aço dúctil · 2 alumínio · 3 ferro fundido)', min: 1, max: 3, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var mats = {
        1: { n: 'Aço de baixo carbono', E: 200000, sy: 250, su: 400, eu: 0.18, ef: 0.30, patamar: true, cor: 's1' },
        2: { n: 'Liga de alumínio', E: 70000, sy: 270, su: 310, eu: 0.10, ef: 0.14, patamar: false, cor: 's3' },
        3: { n: 'Ferro fundido cinzento', E: 100000, sy: 160, su: 200, eu: 0.006, ef: 0.007, patamar: false, cor: 's2' }
      }[p.mat];
      var gx = 1.3, gy = 0.9, gw = 6.6, gh = 4.8;
      var emax = 0.33, smax = 450;
      var X = function (e) { return gx + gw * Math.min(e, emax) / emax; };
      var Y = function (s) { return gy + gh * s / smax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [[X(0), Y(0)], [X(mats.sy / mats.E), Y(mats.sy)]], i;
      if (mats.patamar) pts.push([X(mats.sy / mats.E + 0.015), Y(mats.sy)]);
      var e0 = mats.sy / mats.E + (mats.patamar ? 0.015 : 0);
      for (i = 1; i <= 30; i++) {
        var e = e0 + (mats.eu - e0) * i / 30;
        pts.push([X(e), Y(mats.sy + (mats.su - mats.sy) * Math.pow(i / 30, 0.6))]);
      }
      for (i = 1; i <= 15; i++) {
        var e2 = mats.eu + (mats.ef - mats.eu) * i / 15;
        pts.push([X(e2), Y(mats.su - (mats.su - mats.su * 0.82) * Math.pow(i / 15, 1.6))]);
      }
      g.caminho(pts, { cor: mats.cor, larg: 2.6 });
      g.caminho(pts.concat([[X(mats.ef), Y(0)], [X(0), Y(0)]]), { cor: null, preenche: mats.cor, alfa: 0.1, fechar: true });
      var ult = pts[pts.length - 1];
      g.txt('✕', ult[0], ult[1], { cor: 'erro', tam: 14, negrito: true });
      /* offset 0,2 % */
      g.caminho([[X(0.002), Y(0)], [X(0.002 + smax / mats.E), Y(smax)]], { cor: 'fraco', larg: 1, tracejado: [5, 4] });
      g.linha(gx, Y(mats.sy), X(mats.sy / mats.E) + 0.4, Y(mats.sy), { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      g.txt('σe = ' + mats.sy + ' MPa', gx + 0.15, Y(mats.sy) + 0.3, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.linha(gx, Y(mats.su), X(mats.eu), Y(mats.su), { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      g.txt('σr = ' + mats.su + ' MPa', gx + 0.15, Y(mats.su) + 0.3, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.txt('deformação', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('tensão (MPa)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.6;
      g.txt(mats.n, x0, 5.6, { cor: mats.cor, tam: 13, alin: 'esq', negrito: true });
      g.txt('E = ' + (mats.E / 1000) + ' GPa', x0, 4.8, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('escoamento ' + mats.sy + ' MPa', x0, 4.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('resistência ' + mats.su + ' MPa', x0, 3.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('alongamento ' + fx(100 * mats.ef, 1) + ' %', x0, 3.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('resiliência ' + fx(mats.sy * mats.sy / (2 * mats.E), 2) + ' MPa', x0, 2.2, { cor: 's4', tam: 12, alin: 'esq' });
      g.txt(mats.ef > 0.05 ? 'dúctil: avisa antes de romper' : 'frágil: rompe sem aviso', x0, 1.4,
        { cor: mats.ef > 0.05 ? 'ok' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
    }
  });

  /* ================= capítulo 3 ================= */

  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Na torção, a tensão cresce linearmente do centro para a superfície. O material do centro quase não trabalha — e é essa a razão do eixo vazado (exemplo 3.1).',
    vista: [-0.6, 12.6, -3.0, 5.6],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Torque', min: 200, max: 3000, val: 1200, passo: 50, un: 'N·m' },
      { id: 'd', rot: 'Diâmetro', min: 20, max: 80, val: 50, passo: 2, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var T = p.T * 1000, d = p.d, G = 80000, L = 1500;
      var J = Math.PI * Math.pow(d, 4) / 32;
      var tmax = T * (d / 2) / J;
      var th = T * L / (G * J);
      var cx = 3.0, cy = 2.4, R = 2.0;
      g.circ(cx, cy, R, { preenche: 'acento', cor: 'forte', larg: 1.8, alfa: 0.18 });
      g.circ(cx, cy, 0.08, { preenche: 'texto', cor: null });
      /* distribuição linear de tau ao longo do raio */
      var i;
      for (i = 1; i <= 8; i++) {
        var r = R * i / 8;
        g.seta(cx + r, cy, 0, (tmax * (i / 8)) / Math.max(tmax, 1) * 1.5, { cor: 's2', larg: 1.6, ponta: 0.16 });
      }
      g.linha(cx, cy, cx + R, cy, { cor: 'forte', larg: 1.4 });
      g.caminho([[cx, cy], [cx + R, cy + 1.5]], { cor: 's2', larg: 2 });
      g.txt('τ = Tr/J', cx + R + 0.6, cy + 1.3, { cor: 's2', tam: 12, alin: 'esq', negrito: true });
      g.txt('τ máx na superfície', cx + R + 0.6, cy + 0.7, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('τ = 0 no centro', cx + 0.1, cy - 0.45, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.arco(cx, cy, R + 0.45, 0.4, 1.9, { cor: 's1', larg: 2.2, ponta: true });
      g.txt('T', cx - 0.3, cy + R + 0.9, { cor: 's1', tam: 13, negrito: true });
      var x0 = 7.6;
      g.txt('J = πd⁴/32 = ' + fx(J / 1000, 1) + ' ×10³ mm⁴', x0, 4.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('τ máx = ' + fx(tmax, 1) + ' MPa', x0, 3.8, { cor: 's2', tam: 14, alin: 'esq', negrito: true });
      g.txt('θ = TL/GJ = ' + fx(th * 180 / Math.PI, 2) + '°', x0, 3.0, { cor: 's3', tam: 13, alin: 'esq', negrito: true });
      g.txt('em 1,5 m → ' + fx(th * 180 / Math.PI / 1.5, 2) + ' °/m', x0, 2.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(th * 180 / Math.PI / 1.5 > 1 ? 'acima do usual (1 °/m): eixo pouco rígido' : 'dentro do usual (até 1 °/m)',
        x0, 1.6, { cor: th * 180 / Math.PI / 1.5 > 1 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('dobrar o diâmetro divide a tensão por 8: τ = 16T/πd³', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  F('#fig-3-2', {
    titulo: 'Figura 3.2',
    legenda: 'Com a mesma área de material (mesma massa), o eixo vazado tem momento polar muito maior: o furo tira o material que menos contribui.',
    vista: [-0.6, 12.6, -2.8, 5.4],
    altura: 350,
    controles: [{ id: 'rz', rot: 'Furo (razão dᵢ/dₑ)', min: 0, max: 0.8, val: 0.6, passo: 0.05 }],
    desenhar: function (g, p) {
      var rz = p.rz, de = 60, di = de * rz;
      var A = Math.PI * (de * de - di * di) / 4;
      var Jv = Math.PI * (Math.pow(de, 4) - Math.pow(di, 4)) / 32;
      var dm = Math.sqrt(4 * A / Math.PI);                 /* maciço de mesma área */
      var Jm = Math.PI * Math.pow(dm, 4) / 32;
      var esc = 2.0 / 60;
      /* vazado */
      g.circ(3.0, 2.6, de * esc, { preenche: 's1', cor: 'forte', larg: 1.6, alfa: 0.3 });
      if (di > 0.5) g.circ(3.0, 2.6, di * esc, { preenche: 'fundo', cor: 'forte', larg: 1.4 });
      g.txt('vazado', 3.0, 2.6 - de * esc - 0.55, { cor: 'suave', tam: 12, negrito: true });
      g.txt('dₑ 60 · dᵢ ' + fx(di, 0) + ' mm', 3.0, 2.6 - de * esc - 1.1, { cor: 'fraco', tam: 11 });
      /* maciço equivalente */
      g.circ(7.0, 2.6, dm * esc, { preenche: 's3', cor: 'forte', larg: 1.6, alfa: 0.3 });
      g.txt('maciço de mesma massa', 7.0, 2.6 - de * esc - 0.55, { cor: 'suave', tam: 12, negrito: true });
      g.txt('d = ' + fx(dm, 1) + ' mm', 7.0, 2.6 - de * esc - 1.1, { cor: 'fraco', tam: 11 });
      var x0 = 9.4;
      g.txt('área: ' + fx(A, 0) + ' mm² (igual)', x0, 4.4, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('J vazado ' + fx(Jv / 1000, 0) + ' ×10³', x0, 3.6, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('J maciço ' + fx(Jm / 1000, 0) + ' ×10³', x0, 3.0, { cor: 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('ganho de ' + fx(Jv / Jm, 2) + '×', x0, 2.2, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      g.ret(x0, 0.9, 2.6 * Math.min(1, Jm / Jv), 0.45, { preenche: 's3', cor: null, alfa: 0.8 });
      g.ret(x0, 1.45, 2.6, 0.45, { preenche: 's1', cor: null, alfa: 0.8 });
      g.txt('com o mesmo peso, o eixo vazado resiste mais à torção', 6, -2.2, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 4 ================= */

  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Diagramas de cortante e momento de uma viga biapoiada. Note as relações: a área do diagrama de V é a variação de M, e o momento é máximo onde V cruza o zero (exemplo 4.1).',
    vista: [-0.6, 12.6, -5.6, 4.6],
    altura: 400,
    controles: [
      { id: 'a', rot: 'Posição da carga', min: 0.25, max: 3.75, val: 2, passo: 0.25, un: 'm' },
      { id: 'P', rot: 'Carga', min: 5, max: 50, val: 20, passo: 1, un: 'kN' },
      { id: 'q', rot: 'Carga distribuída', min: 0, max: 10, val: 0, passo: 0.5, un: 'kN/m' }
    ],
    desenhar: function (g, p) {
      var L = 4, a = p.a, P = p.P, q = p.q;
      var RA = P * (L - a) / L + q * L / 2, RB = P * a / L + q * L / 2;
      function V(x) { return RA - q * x - (x > a ? P : 0); }
      function M(x) { return RA * x - q * x * x / 2 - (x > a ? P * (x - a) : 0); }
      var ox = 1.2, esc = 9.6 / L;
      /* viga */
      var yv = 3.2;
      g.ret(ox, yv, L * esc, 0.32, { preenche: 'acento', cor: null, alfa: 0.35 });
      g.caminho([[ox, yv], [ox - 0.34, yv - 0.6], [ox + 0.34, yv - 0.6]], { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.6 });
      g.circ(ox + L * esc, yv - 0.26, 0.26, { cor: 'forte', larg: 1.6, preenche: 'baixo' });
      g.seta(ox + a * esc, yv + 1.5, 0, -1.1, { cor: 'erro', larg: 2.4, rot: P + ' kN', rotTam: 11.5, rotDy: 0.45, rotDx: 0 });
      if (q > 0.01) {
        for (var i = 0; i <= 10; i++) g.seta(ox + L * esc * i / 10, yv + 0.85, 0, -0.5, { cor: 's2', larg: 1.1, ponta: 0.14 });
        g.linha(ox, yv + 0.85, ox + L * esc, yv + 0.85, { cor: 's2', larg: 1.4 });
        g.txt(q + ' kN/m', ox + L * esc / 2, yv + 1.2, { cor: 's2', tam: 11 });
      }
      g.txt(fx(RA, 2) + ' kN', ox + 0.75, yv - 0.95, { cor: 's3', tam: 11 });
      g.txt(fx(RB, 2) + ' kN', ox + L * esc - 0.75, yv - 0.95, { cor: 's3', tam: 11 });
      /* diagrama V */
      var yV = 0.5, escV = 1.3 / Math.max(Math.abs(RA), Math.abs(RB), 1);
      g.linha(ox, yV, ox + L * esc, yV, { cor: 'fraco', larg: 1 });
      var ptsV = [[ox, yV]], x;
      for (i = 0; i <= 200; i++) {
        x = L * i / 200;
        ptsV.push([ox + x * esc, yV + V(x + 1e-9) * escV]);
      }
      ptsV.push([ox + L * esc, yV]);
      g.caminho(ptsV, { cor: 's1', larg: 2, preenche: 's1', alfa: 0.18, fechar: true });
      g.txt('V (kN)', ox - 0.15, yV + 1.1, { cor: 's1', tam: 11.5, alin: 'dir' });
      /* diagrama M */
      var yM = -3.6, Mmax = 0, xmax = 0;
      for (i = 0; i <= 400; i++) { x = L * i / 400; if (M(x) > Mmax) { Mmax = M(x); xmax = x; } }
      var escM = 1.5 / Math.max(Mmax, 1);
      g.linha(ox, yM, ox + L * esc, yM, { cor: 'fraco', larg: 1 });
      var ptsM = [[ox, yM]];
      for (i = 0; i <= 200; i++) { x = L * i / 200; ptsM.push([ox + x * esc, yM + M(x) * escM]); }
      ptsM.push([ox + L * esc, yM]);
      g.caminho(ptsM, { cor: 's4', larg: 2, preenche: 's4', alfa: 0.18, fechar: true });
      g.txt('M (kN·m)', ox - 0.15, yM + 1.1, { cor: 's4', tam: 11.5, alin: 'dir' });
      g.circ(ox + xmax * esc, yM + Mmax * escM, 0.14, { preenche: 'erro', cor: null });
      g.txt('M máx = ' + fx(Mmax, 2) + ' kN·m', ox + xmax * esc, yM + Mmax * escM + 0.45, { cor: 'erro', tam: 11.5, fundo: true });
      g.linha(ox + xmax * esc, yM, ox + xmax * esc, yV, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      g.txt('o momento é máximo onde o cortante cruza o zero', 6, -5.2, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 5 ================= */

  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Na flexão a tensão varia linearmente com a distância à linha neutra. Aumentar a altura é muito mais eficiente que aumentar a largura: W cresce com h² (exemplo 5.1).',
    vista: [-0.6, 12.6, -3.0, 5.6],
    altura: 350,
    controles: [
      { id: 'b', rot: 'Largura b', min: 40, max: 200, val: 100, passo: 5, un: 'mm' },
      { id: 'h', rot: 'Altura h', min: 60, max: 300, val: 200, passo: 5, un: 'mm' },
      { id: 'M', rot: 'Momento fletor', min: 5, max: 60, val: 20, passo: 1, un: 'kN·m' }
    ],
    desenhar: function (g, p) {
      var b = p.b, h = p.h, Mo = p.M * 1e6;
      var I = b * Math.pow(h, 3) / 12, W = I / (h / 2), sig = Mo / W;
      var esc = 3.4 / 300;
      var cx = 2.6, cy = 2.4;
      g.ret(cx - b * esc / 2, cy - h * esc / 2, b * esc, h * esc, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.28 });
      g.linha(cx - b * esc / 2 - 1.2, cy, cx + b * esc / 2 + 2.6, cy, { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('linha neutra', cx - b * esc / 2 - 1.3, cy, { cor: 'erro', tam: 10.5, alin: 'dir' });
      /* distribuição de tensão */
      var dx = cx + b * esc / 2 + 0.3, amp = 1.8;
      g.caminho([[dx, cy - h * esc / 2], [dx + amp, cy - h * esc / 2], [dx, cy], [dx - amp, cy + h * esc / 2], [dx, cy + h * esc / 2]],
        { cor: 's2', larg: 2 });
      g.seta(dx, cy + h * esc / 2, -amp, 0, { cor: 's2', larg: 1.6, ponta: 0.18 });
      g.seta(dx, cy - h * esc / 2, amp, 0, { cor: 's2', larg: 1.6, ponta: 0.18 });
      g.txt('compressão', dx - amp - 0.2, cy + h * esc / 2, { cor: 's2', tam: 10.5, alin: 'dir' });
      g.txt('tração', dx + amp + 0.2, cy - h * esc / 2, { cor: 's2', tam: 10.5, alin: 'esq' });
      g.cota(cx - b * esc / 2, cy - h * esc / 2 - 0.5, cx + b * esc / 2, cy - h * esc / 2 - 0.5, 'b = ' + b, { dy: -0.3 });
      g.cota(cx - b * esc / 2 - 0.5, cy - h * esc / 2, cx - b * esc / 2 - 0.5, cy + h * esc / 2, 'h = ' + h, { dx: -0.35 });
      var x0 = 8.0;
      g.txt('I = bh³/12 = ' + fx(I / 1e6, 2) + ' ×10⁶ mm⁴', x0, 4.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('W = I/c = ' + fx(W / 1000, 1) + ' ×10³ mm³', x0, 3.9, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('σ = M/W = ' + fx(sig, 1) + ' MPa', x0, 3.0, { cor: 's2', tam: 14, alin: 'esq', negrito: true });
      g.txt('dobrar h → I ×8, W ×4', x0, 2.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('dobrar b → I ×2, W ×2', x0, 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(sig > 165 ? 'acima do admissível típico (165 MPa): aumente a altura' : 'dentro do admissível típico de aço estrutural',
        6, -2.4, { cor: sig > 165 ? 'aviso' : 'ok', tam: 11.5 });
    }
  });

  F('#fig-5-2', {
    titulo: 'Figura 5.2',
    legenda: 'A tensão de cisalhamento na flexão é parabólica: zero nas fibras extremas e máxima na linha neutra, onde vale 1,5 V/A numa seção retangular.',
    vista: [-0.6, 12.6, -2.8, 5.4],
    altura: 350,
    controles: [
      { id: 'V', rot: 'Esforço cortante', min: 5, max: 80, val: 10, passo: 1, un: 'kN' },
      { id: 'y', rot: 'Altura do ponto analisado', min: -100, max: 100, val: 0, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var b = 100, h = 200, V = p.V * 1000, y = p.y;
      var I = b * Math.pow(h, 3) / 12;
      var Q = b / 2 * (Math.pow(h / 2, 2) - y * y);
      var tau = V * Q / (I * b);
      var taumax = 1.5 * V / (b * h);
      var esc = 3.4 / 300, cx = 2.6, cy = 2.4;
      g.ret(cx - b * esc / 2, cy - h * esc / 2, b * esc, h * esc, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.2 });
      /* área acima do ponto, que define Q */
      g.ret(cx - b * esc / 2, cy + y * esc, b * esc, (h / 2 - y) * esc, { preenche: 's3', cor: null, alfa: 0.35 });
      g.linha(cx - b * esc / 2 - 0.4, cy + y * esc, cx + b * esc / 2 + 2.4, cy + y * esc, { cor: 's3', larg: 1.6 });
      g.txt('área que define Q', cx, cy + (y / 2 + h / 4) * esc, { cor: 's3', tam: 10.5 });
      g.linha(cx - b * esc / 2 - 1.0, cy, cx + b * esc / 2 + 0.2, cy, { cor: 'erro', larg: 1.2, tracejado: [5, 4] });
      /* parábola de tau */
      var dx = cx + b * esc / 2 + 0.5, amp = 2.0, i, pts = [];
      for (i = 0; i <= 40; i++) {
        var yy = -h / 2 + h * i / 40;
        var Qy = b / 2 * (Math.pow(h / 2, 2) - yy * yy);
        pts.push([dx + amp * (V * Qy / (I * b)) / Math.max(taumax, 0.001), cy + yy * esc]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.2 });
      g.linha(dx, cy - h * esc / 2, dx, cy + h * esc / 2, { cor: 'fraco', larg: 1 });
      g.circ(dx + amp * tau / Math.max(taumax, 0.001), cy + y * esc, 0.14, { preenche: 'erro', cor: null });
      var x0 = 8.2;
      g.txt('seção 100 × 200 mm', x0, 4.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('Q = ' + fx(Q / 1000, 1) + ' ×10³ mm³', x0, 3.9, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('τ = VQ/(I·b) = ' + fx(tau, 3) + ' MPa', x0, 3.1, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('τ máx = 1,5 V/A = ' + fx(taumax, 3) + ' MPa', x0, 2.4, { cor: 'erro', tam: 12, alin: 'esq' });
      g.txt('na linha neutra a flexão é nula', x0, 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('e o cisalhamento é máximo', x0, 0.95, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('em vigas esbeltas τ costuma ser desprezível diante de σ', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 6 ================= */

  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Linha elástica de uma viga biapoiada. A flecha cresce com o cubo do vão e cai com EI — por isso dobrar a altura da seção reduz a deflexão a um oitavo (exemplo 6.1).',
    vista: [-0.6, 12.6, -3.4, 4.6],
    altura: 350,
    controles: [
      { id: 'L', rot: 'Vão', min: 2, max: 8, val: 4, passo: 0.5, un: 'm' },
      { id: 'P', rot: 'Carga central', min: 5, max: 60, val: 20, passo: 1, un: 'kN' },
      { id: 'h', rot: 'Altura da seção', min: 100, max: 400, val: 200, passo: 10, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var L = p.L * 1000, P = p.P * 1000, b = 100, h = p.h, E = 200000;
      var I = b * Math.pow(h, 3) / 12;
      var del = P * Math.pow(L, 3) / (48 * E * I);
      var lim = L / 250;
      var ox = 1.2, esc = 9.6 / 8000, yv = 2.6;
      var comp = L * esc;
      /* viga deformada: y = Px(3L²−4x²)/48EI, ampliada */
      var amp = Math.min(1.6, del * 0.25);
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var x = L * i / 60;
        var xx = Math.min(x, L - x);
        var y = P * xx * (3 * L * L - 4 * xx * xx) / (48 * E * I);
        pts.push([ox + x * esc, yv - amp * y / Math.max(del, 1e-9)]);
      }
      g.linha(ox, yv, ox + comp, yv, { cor: 'borda', larg: 1.2, tracejado: [5, 4] });
      g.caminho(pts, { cor: 'acento', larg: 3.4 });
      g.caminho([[ox, yv], [ox - 0.34, yv - 0.62], [ox + 0.34, yv - 0.62]], { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.6 });
      g.circ(ox + comp, yv - 0.28, 0.28, { cor: 'forte', larg: 1.6, preenche: 'baixo' });
      g.seta(ox + comp / 2, yv + 1.6, 0, -1.2, { cor: 'erro', larg: 2.4, rot: p.P + ' kN', rotTam: 11.5, rotDy: 0.45, rotDx: 0 });
      g.cota(ox, yv + 2.6, ox + comp, yv + 2.6, 'L = ' + p.L + ' m', { dy: 0.3 });
      var meio = pts[30];
      g.cota(ox + comp / 2, yv, ox + comp / 2, meio[1], 'δ', { dx: 0.4 });
      g.txt('deflexão ampliada', ox + comp / 2, meio[1] - 0.55, { cor: 'fraco', tam: 10.5 });
      var x0 = 1.2, y0 = -0.9;
      g.txt('I = ' + fx(I / 1e6, 2) + ' ×10⁶ mm⁴', x0, y0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('δ = PL³/48EI = ' + fx(del, 2) + ' mm', x0, y0 - 0.75, { cor: 's3', tam: 14, alin: 'esq', negrito: true });
      g.txt('limite usual L/250 = ' + fx(lim, 1) + ' mm', x0, y0 - 1.5, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt(del > lim ? 'flecha acima do limite: a rigidez é que governa' : 'flecha dentro do limite',
        x0, y0 - 2.2, { cor: del > lim ? 'aviso' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.ret(7.4, -2.6, 4.2 * Math.min(1, del / Math.max(lim, 1e-9)), 0.5, { preenche: del > lim ? 'aviso' : 'ok', cor: null, alfa: 0.8 });
      g.ret(7.4, -2.6, 4.2, 0.5, { cor: 'borda', larg: 1.2 });
      g.txt('δ / limite', 7.4, -3.1, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });

  /* ================= capítulo 7 ================= */

  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Hiperestática pela compatibilidade: remove-se o apoio, calcula-se a flecha livre e exige-se que a reação a anule. O apoio extra reduz o momento no engaste a um quarto (exemplo 7.1).',
    vista: [-0.6, 12.6, -4.6, 5.0],
    altura: 380,
    controles: [{ id: 'q', rot: 'Carga distribuída', min: 2, max: 20, val: 10, passo: 1, un: 'kN/m' }],
    desenhar: function (g, p) {
      var q = p.q, L = 4;
      var R = 3 * q * L / 8, Meng = q * L * L / 8, Mbal = q * L * L / 2;
      var ox = 1.0, esc = 4.2 / L;
      function viga(oy, titulo, mostraR) {
        g.ret(ox - 0.5, oy - 0.5, 0.5, 1.4, { preenche: 'baixo', cor: 'forte', larg: 1.6 });
        g.hachura(ox - 0.5, oy - 0.5, 1.4, Math.PI / 2, { cor: 'forte', d: 0.2 });
        g.ret(ox, oy, L * esc, 0.3, { preenche: 'acento', cor: null, alfa: 0.35 });
        for (var i = 0; i <= 8; i++) g.seta(ox + L * esc * i / 8, oy + 1.1, 0, -0.65, { cor: 's2', larg: 1.1, ponta: 0.14 });
        g.linha(ox, oy + 1.1, ox + L * esc, oy + 1.1, { cor: 's2', larg: 1.4 });
        g.txt(titulo, ox + L * esc / 2, oy + 1.9, { cor: 'suave', tam: 12, negrito: true });
        if (mostraR) {
          g.circ(ox + L * esc, oy - 0.28, 0.26, { cor: 'forte', larg: 1.6, preenche: 'baixo' });
          g.seta(ox + L * esc, oy - 0.6, 0, -1.0, { cor: 's3', larg: 2.4, rot: 'R = 3qL/8 = ' + fx(R, 1) + ' kN', rotTam: 11.5, rotDx: -1.6, rotDy: -0.2 });
        } else {
          g.txt('flecha livre qL⁴/8EI', ox + L * esc + 0.4, oy - 0.5, { cor: 'fraco', tam: 11, alin: 'esq' });
          g.caminho([[ox, oy], [ox + L * esc * 0.5, oy - 0.3], [ox + L * esc, oy - 1.0]], { cor: 'borda', larg: 2, tracejado: [5, 4] });
        }
      }
      viga(3.2, 'sem o apoio: viga em balanço', false);
      viga(0.2, 'com o apoio: hiperestática', true);
      var x0 = 7.0;
      g.txt('compatibilidade', x0, 4.4, { cor: 'suave', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('qL⁴/8EI = RL³/3EI', x0, 3.7, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('R = 3qL/8 = ' + fx(R, 2) + ' kN', x0, 3.0, { cor: 's3', tam: 13, alin: 'esq', negrito: true });
      g.txt('momento no engaste', x0, 2.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('hiperestática: ' + fx(Meng, 1) + ' kN·m', x0, 1.5, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('em balanço: ' + fx(Mbal, 1) + ' kN·m', x0, 0.9, { cor: 'erro', tam: 12.5, alin: 'esq' });
      g.ret(x0, -0.6, 4.4 * Meng / Mbal, 0.45, { preenche: 'ok', cor: null, alfa: 0.8 });
      g.ret(x0, -1.2, 4.4, 0.45, { preenche: 'erro', cor: null, alfa: 0.6 });
      g.txt('o apoio extra corta o momento a um quarto — e a flecha a quase nada', 6, -4.0, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 8 ================= */

  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Eixo sob flexão e torção: as tensões se somam no mesmo ponto e o critério de von Mises decide se a peça passa. Compare com a tensão admissível (exemplo 8.1).',
    vista: [-0.6, 12.6, -3.2, 5.6],
    altura: 350,
    controles: [
      { id: 'M', rot: 'Momento fletor', min: 100, max: 1600, val: 800, passo: 50, un: 'N·m' },
      { id: 'T', rot: 'Torque', min: 0, max: 1600, val: 600, passo: 50, un: 'N·m' },
      { id: 'd', rot: 'Diâmetro do eixo', min: 25, max: 70, val: 40, passo: 1, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var Mo = p.M * 1000, T = p.T * 1000, d = p.d;
      var W = Math.PI * Math.pow(d, 3) / 32, Wt = 2 * W;
      var sig = Mo / W, tau = T / Wt;
      var vm = Math.sqrt(sig * sig + 3 * tau * tau);
      var tresca = Math.sqrt(sig * sig + 4 * tau * tau);
      var adm = 250 / 2;
      /* elemento de tensão */
      var cx = 2.8, cy = 2.8, a = 1.15;
      g.ret(cx - a, cy - a, 2 * a, 2 * a, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.18 });
      var ks = 1.5 / Math.max(sig, 1e-6, tau);
      g.seta(cx + a, cy, Math.min(1.6, sig * ks), 0, { cor: 'erro', larg: 2.2, rot: 'σ = ' + fx(sig, 1), rotTam: 11, rotDy: 0.42, rotDx: 0.2 });
      g.seta(cx - a, cy, -Math.min(1.6, sig * ks), 0, { cor: 'erro', larg: 2.2 });
      if (tau > 0.5) {
        g.seta(cx - a, cy + a + 0.18, Math.min(1.6, tau * ks), 0, { cor: 's2', larg: 2, rot: 'τ = ' + fx(tau, 1), rotTam: 11, rotDy: 0.4, rotDx: 0.3 });
        g.seta(cx + a, cy - a - 0.18, -Math.min(1.6, tau * ks), 0, { cor: 's2', larg: 2 });
        g.seta(cx + a + 0.18, cy - a, 0, Math.min(1.6, tau * ks), { cor: 's2', larg: 2 });
        g.seta(cx - a - 0.18, cy + a, 0, -Math.min(1.6, tau * ks), { cor: 's2', larg: 2 });
      }
      g.txt('elemento na superfície do eixo', cx, cy - a - 1.0, { cor: 'fraco', tam: 11 });
      /* barras de comparação */
      var x0 = 6.4, esc = 4.6 / Math.max(vm, adm, 1) * 0.9;
      [['von Mises', vm, 's1'], ['Tresca', tresca, 's4'], ['admissível', adm, 'ok']].forEach(function (b, i) {
        var y = 4.0 - i * 1.1;
        g.ret(x0, y, Math.max(0.05, b[1] * esc), 0.6, { preenche: b[2], cor: null, alfa: 0.8 });
        g.txt(b[0] + ': ' + fx(b[1], 1) + ' MPa', x0, y + 0.95, { cor: b[2], tam: 11.5, alin: 'esq', negrito: true });
      });
      g.txt(vm <= adm ? '✓ aprovado com n = 2' : '✕ reprovado: aumente o diâmetro', x0, 0.6,
        { cor: vm <= adm ? 'ok' : 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('W = πd³/32 = ' + fx(W, 0) + ' mm³', x0, -0.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('aço com escoamento 250 MPa e fator de segurança 2', 6, -2.6, { cor: 'fraco', tam: 11 });
    }
  });

  F('#fig-8-2', {
    titulo: 'Figura 8.2',
    legenda: 'Concentração de tensões: o raio do adoçamento manda. Cantos vivos multiplicam a tensão por três ou mais — e é onde a trinca de fadiga começa.',
    vista: [-0.6, 12.6, -3.0, 5.4],
    altura: 350,
    controles: [
      { id: 'r', rot: 'Raio do adoçamento', min: 0.5, max: 12, val: 3, passo: 0.5, un: 'mm' },
      { id: 'D', rot: 'Diâmetro maior', min: 40, max: 80, val: 60, passo: 2, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var r = p.r, D = p.D, d = 40;
      /* Kt aproximado para eixo com rebaixo sob flexão (ajuste de Peterson) */
      var Kt = 1 + 0.9 * Math.pow(r / d, -0.33) * 0.35 * Math.pow(D / d, 0.3);
      Kt = Math.max(1.05, Math.min(4, Kt));
      var snom = 100, smax = Kt * snom;
      var esc = 0.055, ox = 1.0, cy = 2.8;
      /* eixo escalonado */
      g.caminho([[ox, cy - D * esc / 2], [ox + 3.0, cy - D * esc / 2], [ox + 3.0 + r * esc, cy - d * esc / 2],
                 [ox + 7.0, cy - d * esc / 2], [ox + 7.0, cy + d * esc / 2], [ox + 3.0 + r * esc, cy + d * esc / 2],
                 [ox + 3.0, cy + D * esc / 2], [ox, cy + D * esc / 2]],
        { cor: 'forte', larg: 1.8, fechar: true, preenche: 'acento', alfa: 0.22 });
      g.circ(ox + 3.0 + r * esc, cy + d * esc / 2 + r * esc, r * esc, { cor: 'erro', larg: 1.4, tracejado: [4, 3] });
      g.txt('r = ' + fx(r, 1) + ' mm', ox + 3.4, cy + D * esc / 2 + 0.5, { cor: 'erro', tam: 11 });
      /* linhas de fluxo de tensão */
      for (var i = 1; i <= 4; i++) {
        var f = i / 5;
        var pts = [], j;
        for (j = 0; j <= 30; j++) {
          var x = ox + 7.0 * j / 30;
          var hh = x < ox + 3.0 ? D : (x > ox + 3.0 + r * esc ? d : D - (D - d) * (x - ox - 3.0) / Math.max(0.01, r * esc));
          pts.push([x, cy + hh * esc / 2 * f]);
        }
        g.caminho(pts, { cor: 's1', larg: 1.1, alfaLinha: 0.6 });
      }
      var x0 = 8.4;
      g.txt('Kt ≈ ' + fx(Kt, 2), x0, 4.6, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('σ nominal ' + snom + ' MPa', x0, 3.7, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('σ máxima ' + fx(smax, 0) + ' MPa', x0, 3.1, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.ret(x0, 2.0, 3.4 * Math.min(1, snom / 400), 0.45, { preenche: 'suave', cor: null, alfa: 0.5 });
      g.ret(x0, 1.4, 3.4 * Math.min(1, smax / 400), 0.45, { preenche: 'erro', cor: null, alfa: 0.8 });
      g.txt(r / 40 < 0.05 ? 'adoçamento pequeno demais: concentração severa' : 'adoçamento generoso: concentração aceitável',
        x0, 0.6, { cor: r / 40 < 0.05 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('em peças dúcteis sob carga estática a concentração é aliviada por escoamento local; em fadiga, não', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });
})();

/* ============================================================
   Figuras ilustrativas de Mecânica dos Fluidos
   Viscosidade, Stevin, empuxo e metacentro, comporta, continuidade,
   Bernoulli, Reynolds, Moody, perdas localizadas e quantidade de
   movimento — todos calculados pelas equações do capítulo.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var g9 = 9.81, rho = 1000;
  function colebrook(Re, eD) {
    var f = 0.02;
    for (var i = 0; i < 40; i++) f = Math.pow(-2 * Math.log10(eD / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2);
    return f;
  }

  /* 1.1 — viscosidade */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Lei de Newton da viscosidade: a tensão é proporcional ao gradiente de velocidade. Fluido mais viscoso exige mais força para a mesma taxa de deformação.',
    vista: [-0.6, 12.6, -2.8, 5.4],
    altura: 350,
    controles: [
      { id: 'mu', rot: 'Viscosidade', min: 0.001, max: 1, val: 0.1, passo: 0.005, un: 'Pa·s' },
      { id: 'v', rot: 'Velocidade da placa', min: 0.1, max: 3, val: 1, passo: 0.1, un: 'm/s' },
      { id: 'h', rot: 'Espessura do filme', min: 0.2, max: 5, val: 1, passo: 0.1, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var mu = p.mu, v = p.v, h = p.h / 1000;
      var tau = mu * v / h;
      var ox = 1.2, oy = 1.2, larg = 5.6, alt = 2.4;
      g.hachura(ox, oy, larg, 0, { cor: 'forte', d: 0.22 });
      g.ret(ox, oy + alt, larg, 0.35, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.5 });
      g.seta(ox + larg * 0.6, oy + alt + 0.65, Math.min(2.2, v * 0.9), 0,
        { cor: 'erro', larg: 2.4, rot: 'v = ' + fx(v, 1) + ' m/s', rotTam: 11.5, rotDy: 0.45, rotDx: 0 });
      for (var i = 0; i <= 6; i++) {
        var y = oy + alt * i / 6;
        g.seta(ox + 0.6 + i * 0.0, y, Math.min(2.2, v * 0.9) * (i / 6), 0, { cor: 's1', larg: 1.4, ponta: 0.14 });
      }
      g.caminho([[ox + 0.6, oy], [ox + 0.6 + Math.min(2.2, v * 0.9), oy + alt]], { cor: 's1', larg: 1.6, tracejado: [4, 3] });
      g.cota(ox + larg - 0.4, oy, ox + larg - 0.4, oy + alt, 'h = ' + fx(p.h, 1) + ' mm', { dx: 0.5 });
      g.txt('perfil linear de velocidade', ox + larg / 2, oy - 0.6, { cor: 'fraco', tam: 11 });
      var x0 = 7.6;
      g.txt('τ = µ·(v/h)', x0, 4.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('τ = ' + fx(tau, 2) + ' Pa', x0, 3.8, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('força numa área de 1 m²: ' + fx(tau, 1) + ' N', x0, 3.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ν = µ/ρ = ' + fx(mu / rho * 1e6, 1) + ' × 10⁻⁶ m²/s', x0, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('água 0,001 · óleo SAE 30 ≈ 0,3 · mel ≈ 10 Pa·s', x0, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('dobrar a espessura do filme reduz a tensão à metade', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.1 — Stevin */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A pressão cresce linearmente com a profundidade e não depende do formato do recipiente — o paradoxo hidrostático (exemplo 2.1).',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'h', rot: 'Profundidade', min: 1, max: 30, val: 10, passo: 1, un: 'm' },
      { id: 'dens', rot: 'Densidade relativa do fluido', min: 0.7, max: 1.6, val: 1, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var h = p.h, d = p.dens, rhoF = 1000 * d;
      var pman = rhoF * g9 * h / 1000, pabs = pman + 101.3;
      var ox = 1.2, topo = 4.6, fundo = 0.8, esc = (topo - fundo) / 30;
      /* três recipientes de formatos diferentes, mesmo nível */
      var y = topo - h * esc;
      [[0, 'cilindro'], [2.6, 'cônico'], [5.2, 'estreito']].forEach(function (c, k) {
        var x = ox + c[0];
        if (k === 0) g.caminho([[x, fundo], [x, topo], [x + 1.6, topo], [x + 1.6, fundo]], { cor: 'forte', larg: 2 });
        else if (k === 1) g.caminho([[x + 0.3, fundo], [x - 0.1, topo], [x + 1.9, topo], [x + 1.5, fundo]], { cor: 'forte', larg: 2 });
        else g.caminho([[x, fundo], [x + 0.55, topo], [x + 1.05, topo], [x + 1.6, fundo]], { cor: 'forte', larg: 2 });
        g.ret(x, fundo, 1.6, Math.max(0.1, h * esc), { preenche: 's1', cor: null, alfa: 0.25 });
        g.txt(c[1], x + 0.8, fundo - 0.45, { cor: 'fraco', tam: 10.5 });
      });
      g.linha(ox - 0.4, fundo + h * esc, ox + 7.2, fundo + h * esc, { cor: 's1', larg: 1.4, tracejado: [5, 4] });
      g.txt('mesmo nível', ox + 7.3, fundo + h * esc, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.cota(ox - 0.5, fundo, ox - 0.5, fundo + h * esc, h + ' m', { dx: -0.2 });
      if (y) g.txt('', 0, 0);
      var x0 = 8.8;
      g.txt('p = ρ·g·h', x0, 4.8, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(fx(pman, 1) + ' kPa', x0, 4.0, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('manométrica', x0, 3.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('absoluta ' + fx(pabs, 1) + ' kPa', x0, 2.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('= ' + fx(pman / 98.1, 2) + ' atm de coluna', x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('ρ = ' + fx(rhoF, 0) + ' kg/m³', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a pressão no fundo é a mesma nos três: só a altura conta', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 3.1 — empuxo e estabilidade */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Flutuação e estabilidade: o calado sai do equilíbrio entre peso e empuxo, e a estabilidade depende da altura metacêntrica GM.',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'dens', rot: 'Densidade relativa do corpo', min: 0.2, max: 1.2, val: 0.6, passo: 0.05 },
      { id: 'B', rot: 'Largura do flutuante', min: 1, max: 6, val: 3, passo: 0.2, un: 'm' },
      { id: 'KG', rot: 'Altura do centro de gravidade', min: 0.3, max: 3, val: 1.2, passo: 0.1, un: 'm' }
    ],
    desenhar: function (g, p) {
      var dr = p.dens, B = p.B, KG = p.KG, H = 2.5, L = 10;
      var calado = Math.min(H, dr * H);
      var KB = calado / 2;
      var BM = (L * Math.pow(B, 3) / 12) / (L * B * calado);
      var GM = KB + BM - KG;
      var esc = 1.0, ox = 3.4, linha = 2.4;
      g.ret(ox - 4.6, linha - 2.0, 9.2, 2.0, { preenche: 's1', cor: null, alfa: 0.15 });
      g.linha(ox - 4.6, linha, ox + 4.6, linha, { cor: 's1', larg: 1.6 });
      var meiaB = B * esc / 2, Hd = H * esc, cal = calado * esc;
      g.ret(ox - meiaB, linha - cal, B * esc, Hd, { cor: 'forte', larg: 2, preenche: 'acento', alfa: 0.3 });
      g.circ(ox, linha - cal + KG * esc, 0.13, { preenche: 'erro', cor: null });
      g.txt('G', ox + 0.3, linha - cal + KG * esc, { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.circ(ox, linha - cal + KB * esc, 0.13, { preenche: 's3', cor: null });
      g.txt('B', ox + 0.3, linha - cal + KB * esc, { cor: 's3', tam: 11.5, alin: 'esq' });
      var Mt = linha - cal + (KB + BM) * esc;
      g.circ(ox, Mt, 0.14, { cor: 's4', larg: 2 });
      g.txt('M', ox + 0.3, Mt, { cor: 's4', tam: 11.5, alin: 'esq' });
      g.cota(ox - meiaB - 0.5, linha - cal, ox - meiaB - 0.5, linha, 'calado ' + fx(calado, 2) + ' m', { dx: -0.3 });
      var x0 = 7.8;
      g.txt('calado = ' + fx(calado, 2) + ' m', x0, 4.8, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('KB = ' + fx(KB, 2) + ' · BM = ' + fx(BM, 2) + ' m', x0, 4.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('GM = KB + BM − KG', x0, 3.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('GM = ' + fx(GM, 2) + ' m', x0, 2.6, { cor: GM > 0 ? 'ok' : 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt(GM > 0.5 ? 'estável com folga' : GM > 0 ? 'estável, margem pequena' : 'INSTÁVEL: emborca',
        x0, 1.8, { cor: GM > 0.5 ? 'ok' : GM > 0 ? 'aviso' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('alargar o casco aumenta BM com o cubo da largura', x0, 1.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('carga alta no convés sobe KG e derruba a estabilidade', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 4.1 — comporta */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Distribuição triangular de pressão numa comporta: a resultante vale p no centroide vezes a área, mas age no centro de pressão, mais abaixo (exemplo 4.1).',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'h', rot: 'Altura da comporta', min: 1, max: 6, val: 3, passo: 0.25, un: 'm' },
      { id: 'b', rot: 'Largura', min: 0.5, max: 5, val: 2, passo: 0.25, un: 'm' },
      { id: 'sub', rot: 'Profundidade do topo', min: 0, max: 5, val: 0, passo: 0.25, un: 'm' }
    ],
    desenhar: function (g, p) {
      var h = p.h, b = p.b, d = p.sub;
      var hc = d + h / 2;
      var Fv = rho * g9 * hc * h * b / 1000;
      var I = b * Math.pow(h, 3) / 12;
      var ycp = hc + I / (hc * h * b);
      var esc = 3.6 / 9, ox = 2.8, sup = 4.8;
      g.linha(ox - 2.2, sup, ox + 3.2, sup, { cor: 's1', larg: 1.6 });
      g.ret(ox - 2.2, sup - 9 * esc, 2.2, 9 * esc, { preenche: 's1', cor: null, alfa: 0.12 });
      g.ret(ox - 0.12, sup - (d + h) * esc, 0.24, h * esc, { preenche: 'forte', cor: null, alfa: 0.9 });
      /* diagrama de pressão */
      var i, pts = [[ox, sup - d * esc]];
      for (i = 0; i <= 10; i++) {
        var z = d + h * i / 10;
        pts.push([ox + 1.6 * z / 9, sup - z * esc]);
      }
      pts.push([ox, sup - (d + h) * esc]);
      g.caminho(pts, { cor: 's2', larg: 1.8, fechar: true, preenche: 's2', alfa: 0.25 });
      for (i = 0; i <= 5; i++) {
        var zz = d + h * i / 5;
        g.seta(ox + 1.6 * zz / 9, sup - zz * esc, -1.6 * zz / 9 * 0.85, 0, { cor: 's2', larg: 1.1, ponta: 0.14 });
      }
      g.seta(ox + 2.6, sup - ycp * esc, -1.6, 0, { cor: 'erro', larg: 2.6, rot: 'F = ' + fx(Fv, 1) + ' kN', rotTam: 11.5, rotDx: 1.5, rotDy: 0 });
      g.circ(ox, sup - ycp * esc, 0.13, { preenche: 'erro', cor: null });
      g.linha(ox - 1.8, sup - hc * esc, ox + 0.4, sup - hc * esc, { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      g.txt('centroide', ox - 1.9, sup - hc * esc, { cor: 'fraco', tam: 10.5, alin: 'dir' });
      g.txt('centro de pressão', ox - 1.9, sup - ycp * esc, { cor: 'erro', tam: 10.5, alin: 'dir' });
      var x0 = 7.6;
      g.txt('F = ρg·h̄·A = ' + fx(Fv, 1) + ' kN', x0, 4.6, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('h̄ = ' + fx(hc, 2) + ' m · A = ' + fx(h * b, 2) + ' m²', x0, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('y_cp = ' + fx(ycp, 2) + ' m', x0, 3.0, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('(abaixo do centroide em ' + fx(ycp - hc, 3) + ' m)', x0, 2.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(d < 0.01 ? 'topo na superfície: y_cp = 2h/3' : 'quanto mais fundo, mais y_cp se aproxima do centroide',
        x0, 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('momento no eixo da comporta: F × (y_cp − d) = ' + fx(Fv * (ycp - d), 1) + ' kN·m', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 5.1 — continuidade */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Continuidade: o que entra sai. Reduzir a área acelera o escoamento na mesma proporção inversa.',
    vista: [-0.6, 12.6, -2.8, 5.4],
    altura: 350,
    animar: true,
    controles: [
      { id: 'D1', rot: 'Diâmetro de entrada', min: 50, max: 200, val: 100, passo: 5, un: 'mm' },
      { id: 'D2', rot: 'Diâmetro de saída', min: 20, max: 200, val: 50, passo: 5, un: 'mm' },
      { id: 'Q', rot: 'Vazão', min: 2, max: 60, val: 15, passo: 1, un: 'L/s' }
    ],
    desenhar: function (g, p, t) {
      var D1 = p.D1 / 1000, D2 = p.D2 / 1000, Q = p.Q / 1000;
      var A1 = Math.PI * D1 * D1 / 4, A2 = Math.PI * D2 * D2 / 4;
      var v1 = Q / A1, v2 = Q / A2;
      var ox = 1.0, cy = 3.0, esc = 9.0;
      var r1 = D1 * esc / 2, r2 = D2 * esc / 2;
      g.caminho([[ox, cy - r1], [ox + 3.4, cy - r1], [ox + 4.8, cy - r2], [ox + 8.4, cy - r2]], { cor: 'forte', larg: 2 });
      g.caminho([[ox, cy + r1], [ox + 3.4, cy + r1], [ox + 4.8, cy + r2], [ox + 8.4, cy + r2]], { cor: 'forte', larg: 2 });
      /* partículas */
      var n = 14, i;
      for (i = 0; i < n; i++) {
        var f = ((t * 0.35 + i / n) % 1);
        var x = ox + 8.4 * f;
        var r = x < ox + 3.4 ? r1 : x > ox + 4.8 ? r2 : r1 + (r2 - r1) * (x - ox - 3.4) / 1.4;
        for (var j = -1; j <= 1; j++) {
          g.circ(x, cy + j * r * 0.45, 0.09, { preenche: 's1', cor: null, alfa: 0.75 });
        }
      }
      g.seta(ox + 1.0, cy + r1 + 0.6, Math.min(2.0, v1 * 0.4), 0, { cor: 's3', larg: 2, rot: fx(v1, 2) + ' m/s', rotTam: 11, rotDy: 0.4, rotDx: 0 });
      g.seta(ox + 6.0, cy + r2 + 0.6, Math.min(2.4, v2 * 0.4), 0, { cor: 's2', larg: 2, rot: fx(v2, 2) + ' m/s', rotTam: 11, rotDy: 0.4, rotDx: 0 });
      var x0 = 1.0, y0 = 0.9;
      g.txt('Q = ' + fx(p.Q, 1) + ' L/s em toda a linha', x0, y0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('A₁v₁ = A₂v₂  →  v₂/v₁ = (D₁/D₂)² = ' + fx(Math.pow(D1 / D2, 2), 2) + '×', x0, y0 - 0.7,
        { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('a carga cinética cresce com o quadrado: ' + fx(Math.pow(v2 / v1, 2), 1) + '×', x0, y0 - 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('velocidade usual em linhas de água: 1 a 3 m/s', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 6.1 — Bernoulli */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Linhas de energia e piezométrica num Venturi: a carga total se mantém (sem atrito) e a de pressão cai onde a velocidade sobe (exemplo 6.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'D2', rot: 'Diâmetro da garganta', min: 20, max: 95, val: 50, passo: 5, un: 'mm' },
      { id: 'Q', rot: 'Vazão', min: 2, max: 40, val: 15, passo: 1, un: 'L/s' }
    ],
    desenhar: function (g, p) {
      var D1 = 0.1, D2 = p.D2 / 1000, Q = p.Q / 1000;
      var A1 = Math.PI * D1 * D1 / 4, A2 = Math.PI * D2 * D2 / 4;
      var v1 = Q / A1, v2 = Q / A2;
      var hv1 = v1 * v1 / (2 * g9), hv2 = v2 * v2 / (2 * g9);
      var H = 6.0;                              /* carga total, m */
      var hp1 = H - hv1, hp2 = H - hv2;
      var ox = 1.2, base = 0.9, esc = 0.52;
      var r1 = D1 * 9, r2 = D2 * 9;
      var cy = base + 0.9;
      g.caminho([[ox, cy - r1], [ox + 2.4, cy - r1], [ox + 3.6, cy - r2], [ox + 4.8, cy - r2], [ox + 6.4, cy - r1], [ox + 8.4, cy - r1]], { cor: 'forte', larg: 2 });
      g.caminho([[ox, cy + r1], [ox + 2.4, cy + r1], [ox + 3.6, cy + r2], [ox + 4.8, cy + r2], [ox + 6.4, cy + r1], [ox + 8.4, cy + r1]], { cor: 'forte', larg: 2 });
      /* linha de energia e piezométrica */
      var yE = base + H * esc;
      g.linha(ox, yE, ox + 8.4, yE, { cor: 's1', larg: 2 });
      g.txt('linha de energia', ox + 0.2, yE + 0.3, { cor: 's1', tam: 10.5, alin: 'esq' });
      var pie = [[ox, base + hp1 * esc], [ox + 2.4, base + hp1 * esc], [ox + 3.6, base + hp2 * esc],
                 [ox + 4.8, base + hp2 * esc], [ox + 6.4, base + hp1 * esc], [ox + 8.4, base + hp1 * esc]];
      g.caminho(pie, { cor: 's3', larg: 2 });
      g.txt('linha piezométrica', ox + 6.6, base + hp1 * esc + 0.3, { cor: 's3', tam: 10.5, alin: 'dir' });
      g.cota(ox + 4.2, base + hp2 * esc, ox + 4.2, yE, 'v²/2g', { dx: 0.5 });
      var x0 = 9.6;
      g.txt('v₁ = ' + fx(v1, 2) + ' m/s', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('v₂ = ' + fx(v2, 2) + ' m/s', x0, 4.3, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('Δp = ' + fx(rho * g9 * (hp1 - hp2) / 1000, 1) + ' kPa', x0, 3.4, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('queda na garganta', x0, 2.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(hp2 < 0 ? 'pressão abaixo da atmosférica: risco de cavitação' : 'pressão ainda positiva',
        x0, 1.9, { cor: hp2 < 0 ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('o Venturi mede vazão justamente por essa diferença de pressão', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.1 — Reynolds */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Número de Reynolds e perfil de velocidade: parabólico no laminar, achatado no turbulento. A transição fica entre 2300 e 4000 (exemplo 7.1).',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'v', rot: 'Velocidade média', min: 0.01, max: 4, val: 2, passo: 0.01, un: 'm/s' },
      { id: 'D', rot: 'Diâmetro', min: 10, max: 300, val: 50, passo: 5, un: 'mm' },
      { id: 'nu', rot: 'Viscosidade cinemática ×10⁻⁶', min: 0.3, max: 100, val: 1, passo: 0.1, un: 'm²/s' }
    ],
    desenhar: function (g, p) {
      var v = p.v, D = p.D / 1000, nu = p.nu * 1e-6;
      var Re = v * D / nu;
      var lam = Re < 2300, trans = Re >= 2300 && Re <= 4000;
      var ox = 1.4, cy = 3.0, R = 1.5;
      g.linha(ox, cy - R, ox + 6.0, cy - R, { cor: 'forte', larg: 2 });
      g.linha(ox, cy + R, ox + 6.0, cy + R, { cor: 'forte', larg: 2 });
      var i, pts = [];
      for (i = 0; i <= 40; i++) {
        var yy = -1 + 2 * i / 40;
        var u = lam ? (1 - yy * yy) * 2 : Math.pow(1 - Math.abs(yy), 1 / 7) * 1.22;
        pts.push([ox + 1.2 + u * 1.6, cy + yy * R]);
      }
      g.caminho(pts, { cor: lam ? 's1' : 's2', larg: 2.4 });
      g.linha(ox + 1.2, cy - R, ox + 1.2, cy + R, { cor: 'fraco', larg: 1.2 });
      for (i = 1; i < 9; i++) {
        var yy2 = -1 + 2 * i / 9;
        var u2 = lam ? (1 - yy2 * yy2) * 2 : Math.pow(1 - Math.abs(yy2), 1 / 7) * 1.22;
        g.seta(ox + 1.2, cy + yy2 * R, u2 * 1.6, 0, { cor: lam ? 's1' : 's2', larg: 1.2, ponta: 0.14 });
      }
      g.txt(lam ? 'perfil parabólico' : 'perfil achatado', ox + 3.0, cy - R - 0.5, { cor: 'fraco', tam: 11 });
      var x0 = 8.2;
      g.txt('Re = v·D/ν', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Re = ' + (Re >= 1e4 ? fx(Re / 1000, 1) + ' × 10³' : fx(Re, 0)), x0, 4.1,
        { cor: lam ? 's1' : trans ? 'aviso' : 's2', tam: 15, alin: 'esq', negrito: true });
      g.txt(lam ? 'laminar' : trans ? 'transição' : 'turbulento', x0, 3.3,
        { cor: lam ? 's1' : trans ? 'aviso' : 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(lam ? 'v_max = 2 v_média · f = 64/Re' : 'v_max ≈ 1,2 v_média · f pelo Moody', x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('velocidade crítica aqui: ' + fx(2300 * nu / D, 3) + ' m/s', x0, 1.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('água ν = 1 · óleo SAE 30 ≈ 100 (×10⁻⁶ m²/s)', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 8.1 — Moody */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Diagrama de Moody: o fator de atrito depende de Reynolds e da rugosidade relativa. Em turbulência completa ele para de variar com Re (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'Re', rot: 'Reynolds ×10³', min: 2, max: 10000, val: 100, passo: 2 },
      { id: 'eD', rot: 'Rugosidade relativa ×10⁻⁴', min: 1, max: 200, val: 10, passo: 1 },
      { id: 'L', rot: 'Comprimento da linha', min: 10, max: 500, val: 100, passo: 10, un: 'm' }
    ],
    desenhar: function (g, p) {
      var Re = p.Re * 1000, eD = p.eD * 1e-4, L = p.L, D = 0.05, v = 2;
      var f = Re < 2300 ? 64 / Re : colebrook(Re, eD);
      var hf = f * L / D * v * v / (2 * g9);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (re) { return gx + gw * (Math.log10(re) - 3) / 4; };
      var Y = function (ff) { return gy + gh * (Math.log10(ff) + 2) / 1.1; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* laminar */
      var i, lam = [];
      for (i = 0; i <= 20; i++) {
        var re = Math.pow(10, 3 + 0.36 * i / 20);
        lam.push([X(re), Y(64 / re)]);
      }
      g.caminho(lam, { cor: 's1', larg: 2.2 });
      /* famílias de rugosidade */
      [1e-4, 5e-4, 2e-3, 1e-2].forEach(function (e) {
        var pts = [];
        for (i = 0; i <= 40; i++) {
          var re2 = Math.pow(10, 3.6 + 3.4 * i / 40);
          pts.push([X(re2), Y(colebrook(re2, e))]);
        }
        g.caminho(pts, { cor: 'borda', larg: 1.1 });
      });
      var cur = [];
      for (i = 0; i <= 40; i++) {
        var re3 = Math.pow(10, 3.6 + 3.4 * i / 40);
        cur.push([X(re3), Y(colebrook(re3, eD))]);
      }
      g.caminho(cur, { cor: 's2', larg: 2.4 });
      g.circ(X(Re), Y(f), 0.15, { preenche: 'erro', cor: null });
      [3, 4, 5, 6, 7].forEach(function (e) {
        g.linha(X(Math.pow(10, e)), gy, X(Math.pow(10, e)), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt('10' + ['', '', '', '³', '⁴', '⁵', '⁶', '⁷'][e], X(Math.pow(10, e)), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [0.01, 0.02, 0.05, 0.1].forEach(function (ff) {
        g.linha(gx, Y(ff), gx - 0.15, Y(ff), { cor: 'fraco', larg: 1 });
        g.txt(fx(ff, 3), gx - 0.28, Y(ff), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.txt('Reynolds', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('f', gx - 0.4, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.2;
      g.txt('f = ' + fx(f, 4), x0, 5.0, { cor: 's2', tam: 15, alin: 'esq', negrito: true });
      g.txt(Re < 2300 ? 'laminar: f = 64/Re' : 'turbulento (Colebrook)', x0, 4.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('para D = 50 mm e v = 2 m/s:', x0, 3.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('h_f = ' + fx(hf, 2) + ' m em ' + L + ' m', x0, 2.5, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('= ' + fx(rho * g9 * hf / 1000, 1) + ' kPa de pressão', x0, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('ε/D: aço novo ≈ 0,001 · aço corroído ≈ 0,01 · PVC ≈ 0,00003', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 9.1 — perdas localizadas */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Perdas localizadas pelo coeficiente K, e o mesmo valor convertido em metros de tubo reto. Em linhas curtas, elas dominam (exemplo 9.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'n90', rot: 'Cotovelos 90° (K = 0,9)', min: 0, max: 12, val: 4, passo: 1 },
      { id: 'nglobo', rot: 'Válvulas globo (K = 10)', min: 0, max: 4, val: 0, passo: 1 },
      { id: 'L', rot: 'Comprimento de tubo reto', min: 5, max: 300, val: 100, passo: 5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var D = 0.05, v = 2, f = 0.022;
      var K = 0.5 + 1.0 + p.n90 * 0.9 + p.nglobo * 10;    /* entrada + saída + acessórios */
      var hl = K * v * v / (2 * g9);
      var hf = f * p.L / D * v * v / (2 * g9);
      var Leq = K * D / f;
      var itens = [['entrada', 0.5], ['saída', 1.0], [p.n90 + ' cotovelos', p.n90 * 0.9], [p.nglobo + ' globo', p.nglobo * 10]];
      var x0 = 1.2, esc = 5.2 / Math.max(K, 1);
      g.txt('composição de K', x0, 5.2, { cor: 'suave', tam: 12, alin: 'esq', negrito: true });
      itens.forEach(function (it, i) {
        var y = 4.3 - i * 0.8;
        g.txt(it[0], x0, y + 0.25, { cor: 'fraco', tam: 11, alin: 'esq' });
        g.ret(x0 + 2.4, y, Math.max(0.02, it[1] * esc), 0.5, { preenche: 's' + (i + 1), cor: null, alfa: 0.8 });
        g.txt(fx(it[1], 1), x0 + 2.5 + it[1] * esc, y + 0.25, { cor: 'suave', tam: 10.5, alin: 'esq' });
      });
      g.txt('K total = ' + fx(K, 1), x0, 0.9, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      var bx = 8.0;
      g.txt('h_localizadas = ' + fx(hl, 2) + ' m', bx, 4.6, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('h_distribuída = ' + fx(hf, 2) + ' m', bx, 3.8, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      var tot = hl + hf;
      g.ret(bx, 2.6, 3.8 * hl / tot, 0.55, { preenche: 's2', cor: null, alfa: 0.8 });
      g.ret(bx + 3.8 * hl / tot, 2.6, 3.8 * hf / tot, 0.55, { preenche: 's1', cor: null, alfa: 0.8 });
      g.txt(fx(100 * hl / tot, 0) + ' % localizadas', bx, 2.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('comprimento equivalente', bx, 1.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(Leq, 1) + ' m de tubo reto', bx, 0.7, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt('linha de 50 mm com água a 2 m/s e f = 0,022', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 10.1 — quantidade de movimento e curva do sistema */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Curva do sistema: altura estática mais perdas proporcionais ao quadrado da vazão. O cruzamento com a curva da bomba é o ponto de operação (exemplo 10.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'Hest', rot: 'Altura estática', min: 0, max: 40, val: 15, passo: 1, un: 'm' },
      { id: 'k', rot: 'Resistência da linha', min: 0.5, max: 20, val: 5, passo: 0.5 },
      { id: 'fech', rot: 'Fechamento da válvula', min: 0, max: 80, val: 0, passo: 5, un: '%' }
    ],
    desenhar: function (g, p) {
      var Hest = p.Hest, k = p.k * (1 + p.fech / 25);
      /* curva da bomba: H = H0 − aQ² */
      var H0 = 50, a = 0.9;
      var Qop = Math.sqrt(Math.max(0, (H0 - Hest) / (a + k / 100 * 100)));
      /* resolve H0 − aQ² = Hest + kQ²/100 ... normalizado para L/s */
      function Hb(Q) { return H0 - a * Q * Q / 100; }
      function Hs(Q) { return Hest + k * Q * Q / 100; }
      var Q = 0;
      for (var i = 0; i <= 2000; i++) { var q = i * 0.05; if (Hb(q) >= Hs(q)) Q = q; }
      var gx = 1.3, gy = 1.0, gw = 6.4, gh = 4.2;
      var X = function (q) { return gx + gw * q / 100; }, Y = function (h) { return gy + gh * h / 60; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pb = [], ps = [];
      for (i = 0; i <= 60; i++) {
        var q2 = 100 * i / 60;
        pb.push([X(q2), Y(Math.max(0, Hb(q2)))]);
        ps.push([X(q2), Y(Hs(q2))]);
      }
      g.caminho(pb, { cor: 's1', larg: 2.4 });
      g.caminho(ps, { cor: 's2', larg: 2.4 });
      g.circ(X(Q), Y(Hs(Q)), 0.16, { preenche: 'erro', cor: null });
      g.linha(X(Q), gy, X(Q), Y(Hs(Q)), { cor: 'erro', larg: 1, tracejado: [4, 3] });
      g.linha(gx, Y(Hest), gx + gw, Y(Hest), { cor: 'fraco', larg: 1, tracejado: [5, 4] });
      g.txt('altura estática', gx + 0.15, Y(Hest) + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('bomba', X(80), Y(Hb(80)) + 0.4, { cor: 's1', tam: 11 });
      g.txt('sistema', X(85), Y(Hs(85)) - 0.4, { cor: 's2', tam: 11 });
      [25, 50, 75, 100].forEach(function (q3) {
        g.linha(X(q3), gy, X(q3), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(q3 + '', X(q3), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [20, 40, 60].forEach(function (h) {
        g.linha(gx, Y(h), gx - 0.15, Y(h), { cor: 'fraco', larg: 1 });
        g.txt(h + '', gx - 0.28, Y(h), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('vazão (L/s)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('H (m)', gx - 0.4, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.4;
      g.txt('ponto de operação', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Q = ' + fx(Q, 1) + ' L/s', x0, 4.2, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('H = ' + fx(Hs(Q), 1) + ' m', x0, 3.5, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('potência hidráulica ' + fx(rho * g9 * (Q / 1000) * Hs(Q) / 1000, 2) + ' kW', x0, 2.7, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(p.fech > 0 ? 'válvula ' + p.fech + ' % fechada: a curva do sistema' : 'válvula toda aberta', x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      if (p.fech > 0) g.txt('sobe e a vazão cai', x0, 1.35, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('estrangular gasta energia: a bomba continua consumindo para vencer a válvula', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

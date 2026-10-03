/* ============================================================
   Figuras ilustrativas de Vibrações Mecânicas
   Resposta livre e forçada, decremento logarítmico, desbalanceamento,
   ISO 1940, transmissibilidade, modos e espectro — todos calculados.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var Mamp = function (r, z) { return 1 / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2)); };
  var Transm = function (r, z) { return Math.sqrt(1 + Math.pow(2 * z * r, 2)) / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2)); };

  /* ================= capítulo 1 ================= */

  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Rigidez equivalente: molas em paralelo somam k; em série, somam flexibilidades. A frequência natural muda junto.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'lig', rot: 'Ligação (1 paralelo · 2 série)', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'k1', rot: 'Rigidez k₁', min: 2, max: 40, val: 20, passo: 1, un: 'kN/m' },
      { id: 'k2', rot: 'Rigidez k₂', min: 2, max: 40, val: 20, passo: 1, un: 'kN/m' }
    ],
    desenhar: function (g, p) {
      var k1 = p.k1 * 1000, k2 = p.k2 * 1000, m = 50;
      var keq = p.lig === 1 ? k1 + k2 : 1 / (1 / k1 + 1 / k2);
      var wn = Math.sqrt(keq / m);
      var ox = 2.6, teto = 4.8;
      g.hachura(ox - 1.6, teto, 3.2, 0, { cor: 'forte', d: 0.22 });
      g.linha(ox - 1.6, teto, ox + 1.6, teto, { cor: 'forte', larg: 2 });
      if (p.lig === 1) {
        g.mola(ox - 0.8, teto, ox - 0.8, 2.2, 6, { cor: 's1' });
        g.mola(ox + 0.8, teto, ox + 0.8, 2.2, 6, { cor: 's3' });
        g.txt('k₁', ox - 1.35, 3.5, { cor: 's1', tam: 11.5 });
        g.txt('k₂', ox + 1.35, 3.5, { cor: 's3', tam: 11.5 });
        g.linha(ox - 1.1, 2.2, ox + 1.1, 2.2, { cor: 'forte', larg: 2 });
      } else {
        g.mola(ox, teto, ox, 3.4, 5, { cor: 's1' });
        g.circ(ox, 3.4, 0.12, { preenche: 'texto', cor: null });
        g.mola(ox, 3.4, ox, 2.2, 5, { cor: 's3' });
        g.txt('k₁', ox + 0.6, 4.1, { cor: 's1', tam: 11.5 });
        g.txt('k₂', ox + 0.6, 2.8, { cor: 's3', tam: 11.5 });
      }
      g.ret(ox - 1.0, 1.1, 2.0, 1.1, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.4 });
      g.txt(m + ' kg', ox, 1.65, { cor: 'texto', tam: 12.5, negrito: true });
      var x0 = 6.6;
      g.txt(p.lig === 1 ? 'molas em paralelo' : 'molas em série', x0, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(p.lig === 1 ? 'k_eq = k₁ + k₂' : 'k_eq = (1/k₁ + 1/k₂)⁻¹', x0, 4.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('k_eq = ' + fx(keq / 1000, 2) + ' kN/m', x0, 3.4, { cor: 's2', tam: 14, alin: 'esq', negrito: true });
      g.txt('ωₙ = √(k/m) = ' + fx(wn, 2) + ' rad/s', x0, 2.6, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('f = ' + fx(wn / (2 * Math.PI), 2) + ' Hz · deflexão estática ' + fx(1000 * m * 9.81 / keq, 1) + ' mm',
        x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('em paralelo o sistema fica mais rígido; em série, mais flexível', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 2 ================= */

  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Vibração livre: a frequência depende só de k e m; a amplitude, só das condições iniciais (exemplo 2.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'k', rot: 'Rigidez', min: 5, max: 80, val: 20, passo: 1, un: 'kN/m' },
      { id: 'm', rot: 'Massa', min: 10, max: 200, val: 50, passo: 5, un: 'kg' },
      { id: 'x0', rot: 'Deslocamento inicial', min: 5, max: 50, val: 30, passo: 1, un: 'mm' }
    ],
    desenhar: function (g, p, t) {
      var k = p.k * 1000, m = p.m, A = p.x0 / 1000;
      var wn = Math.sqrt(k / m), f = wn / (2 * Math.PI), T = 1 / f;
      var x = A * Math.cos(wn * t * 0.4);
      var ox = 2.2, teto = 5.0, esc = 26;
      g.hachura(ox - 1.2, teto, 2.4, 0, { cor: 'forte', d: 0.22 });
      g.linha(ox - 1.2, teto, ox + 1.2, teto, { cor: 'forte', larg: 2 });
      var yb = 2.2 - x * esc;
      g.mola(ox, teto, ox, yb + 0.55, 7, { cor: 'suave' });
      g.ret(ox - 0.85, yb - 0.55, 1.7, 1.1, { preenche: 'acento', cor: 'forte', larg: 1.4, alfa: 0.5 });
      g.linha(ox - 1.5, 2.2, ox + 1.5, 2.2, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('equilíbrio', ox, 1.5, { cor: 'fraco', tam: 10.5 });
      /* x(t) */
      var gx = 5.0, gy = 2.4, gw = 6.6, gh = 1.9;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.1 });
      g.linha(gx, gy - gh, gx, gy + gh, { cor: 'fraco', larg: 1.1 });
      var pts = [], i;
      for (i = 0; i <= 150; i++) {
        var tt = i / 150 * 4 * Math.PI;
        pts.push([gx + gw * i / 150, gy + gh * 0.9 * Math.cos(tt + wn * t * 0.4)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.2 });
      g.txt('x(t) = A cos(ωₙt)', gx + gw / 2, gy + gh + 0.5, { cor: 'suave', tam: 11.5 });
      g.txt('ωₙ = ' + fx(wn, 2) + ' rad/s', gx, 0.9, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('f = ' + fx(f, 2) + ' Hz   ·   T = ' + fx(T, 3) + ' s', gx, 0.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('rotação equivalente: ' + fx(f * 60, 0) + ' rpm — evite operar aí', gx, -0.6, { cor: 'aviso', tam: 11.5, alin: 'esq' });
      g.txt('mudar a amplitude inicial não muda a frequência', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 3 ================= */

  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Os três regimes: subamortecido oscila, crítico é o retorno mais rápido sem oscilação, superamortecido demora mais.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'z', rot: 'Fator de amortecimento ζ', min: 0, max: 2, val: 0.1, passo: 0.05 }],
    desenhar: function (g, p) {
      var z = p.z, wn = 20;
      var gx = 1.3, gy = 2.6, gw = 6.6, gh = 2.0;
      var X = function (t) { return gx + gw * t / 1.6; };
      var Y = function (x) { return gy + gh * x; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.1 });
      g.linha(gx, gy - gh, gx, gy + gh, { cor: 'fraco', larg: 1.1 });
      function resposta(zz) {
        var pts = [], i;
        for (i = 0; i <= 160; i++) {
          var t = 1.6 * i / 160, x;
          if (zz < 1 - 1e-6) {
            var wd = wn * Math.sqrt(1 - zz * zz);
            x = Math.exp(-zz * wn * t) * (Math.cos(wd * t) + zz / Math.sqrt(1 - zz * zz) * Math.sin(wd * t));
          } else if (Math.abs(zz - 1) < 1e-6) {
            x = Math.exp(-wn * t) * (1 + wn * t);
          } else {
            var s1 = -wn * (zz - Math.sqrt(zz * zz - 1)), s2 = -wn * (zz + Math.sqrt(zz * zz - 1));
            x = (s1 * Math.exp(s2 * t) - s2 * Math.exp(s1 * t)) / (s1 - s2);
          }
          pts.push([X(t), Y(x)]);
        }
        return pts;
      }
      [[0.05, 'borda'], [1, 'borda'], [1.6, 'borda']].forEach(function (ref) {
        g.caminho(resposta(ref[0]), { cor: ref[1], larg: 1.2, tracejado: [5, 4] });
      });
      g.caminho(resposta(z), { cor: z < 1 ? 's1' : Math.abs(z - 1) < 0.03 ? 'ok' : 's4', larg: 2.8 });
      if (z < 1) {
        var env = [], env2 = [], i;
        for (i = 0; i <= 60; i++) {
          var t = 1.6 * i / 60;
          env.push([X(t), Y(Math.exp(-z * wn * t))]);
          env2.push([X(t), Y(-Math.exp(-z * wn * t))]);
        }
        g.caminho(env, { cor: 'erro', larg: 1, tracejado: [4, 3] });
        g.caminho(env2, { cor: 'erro', larg: 1, tracejado: [4, 3] });
      }
      g.txt('tempo (s)', gx + gw / 2, gy - gh - 0.5, { cor: 'fraco', tam: 11 });
      var x0 = 8.4;
      var nome = z < 0.02 ? 'sem amortecimento' : z < 1 ? 'subamortecido' : Math.abs(z - 1) < 0.03 ? 'criticamente amortecido' : 'superamortecido';
      g.txt('ζ = ' + fx(z, 2), x0, 5.0, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt(nome, x0, 4.2, { cor: z < 1 ? 's1' : Math.abs(z - 1) < 0.03 ? 'ok' : 's4', tam: 13, alin: 'esq', negrito: true });
      if (z < 1) {
        g.txt('ω_d = ' + fx(wn * Math.sqrt(1 - z * z), 2) + ' rad/s', x0, 3.4, { cor: 'suave', tam: 12, alin: 'esq' });
        g.txt('δ = ' + fx(2 * Math.PI * z / Math.sqrt(1 - z * z), 3), x0, 2.8, { cor: 'suave', tam: 12, alin: 'esq' });
        g.txt('cada ciclo cai para ' + fx(100 * Math.exp(-2 * Math.PI * z / Math.sqrt(1 - z * z)), 0) + ' %', x0, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      } else {
        g.txt('não oscila: volta direto ao equilíbrio', x0, 3.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      }
      g.txt('c = ' + fx(z * 2 * Math.sqrt(20000 * 50), 0) + ' N·s/m para k = 20 kN/m e m = 50 kg', x0, 1.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('as curvas tracejadas são ζ = 0,05, 1 e 1,6, para comparação', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  F('#fig-3-2', {
    titulo: 'Figura 3.2',
    legenda: 'Decremento logarítmico: medir duas amplitudes num registro já dá o fator de amortecimento (exemplo 3.1).',
    vista: [-0.6, 12.6, -2.8, 5.4],
    altura: 350,
    controles: [
      { id: 'z', rot: 'Fator de amortecimento ζ', min: 0.01, max: 0.4, val: 0.1, passo: 0.01 },
      { id: 'n', rot: 'Ciclos entre as medidas', min: 1, max: 6, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var z = p.z, n = p.n, wn = 20, wd = wn * Math.sqrt(1 - z * z), Td = 2 * Math.PI / wd;
      var delta = 2 * Math.PI * z / Math.sqrt(1 - z * z);
      var razao = Math.exp(n * delta);
      var gx = 1.3, gy = 2.8, gw = 7.0, gh = 2.0;
      var tmax = Math.max(1.2, (n + 1.5) * Td);
      var X = function (t) { return gx + gw * t / tmax; };
      var Y = function (x) { return gy + gh * x; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.1 });
      g.linha(gx, gy - gh, gx, gy + gh, { cor: 'fraco', larg: 1.1 });
      var pts = [], i;
      for (i = 0; i <= 240; i++) {
        var t = tmax * i / 240;
        pts.push([X(t), Y(Math.exp(-z * wn * t) * Math.cos(wd * t))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.2 });
      var x1 = 1, t1 = 0, t2 = n * Td, x2 = Math.exp(-z * wn * t2);
      g.circ(X(t1), Y(x1), 0.14, { preenche: 'erro', cor: null });
      g.circ(X(t2), Y(x2), 0.14, { preenche: 'erro', cor: null });
      g.cota(X(t1), Y(x1) + 0.35, X(t2), Y(x1) + 0.35, n + ' ciclo' + (n > 1 ? 's' : ''), { dy: 0.3 });
      g.linha(X(t1), gy, X(t1), Y(x1), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.linha(X(t2), gy, X(t2), Y(x2), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.txt('x₁', X(t1) - 0.3, Y(x1), { cor: 'erro', tam: 11.5 });
      g.txt('x₂', X(t2) + 0.3, Y(x2), { cor: 'erro', tam: 11.5 });
      var x0 = 9.0;
      g.txt('δ = (1/n)·ln(x₁/x₂)', x0, 4.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('x₁/x₂ = ' + fx(razao, 2), x0, 4.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('δ = ' + fx(delta, 3), x0, 3.3, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('ζ = ' + fx(z, 3), x0, 2.6, { cor: 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt('ζ ≈ δ/2π para ζ pequeno', x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('medir vários ciclos reduz o erro da leitura', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 4 ================= */

  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Curva de ressonância: perto de r = 1 só o amortecimento limita a amplitude. Afastar a frequência é sempre mais eficaz que amortecer (exemplo 4.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'z', rot: 'Fator de amortecimento ζ', min: 0.02, max: 0.7, val: 0.1, passo: 0.02 },
      { id: 'r', rot: 'Razão de frequências r = ω/ωₙ', min: 0.1, max: 3, val: 0.9, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var z = p.z, r = p.r;
      var gx = 1.3, gy = 1.0, gw = 6.4, gh = 4.4;
      var X = function (rr) { return gx + gw * rr / 3; };
      var Y = function (Mv) { return gy + gh * Math.min(Mv, 6) / 6; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      [0.05, 0.2, 0.5].forEach(function (zz) {
        var pts = [], i;
        for (i = 0; i <= 120; i++) { var rr = 3 * i / 120; pts.push([X(rr), Y(Mamp(rr, zz))]); }
        g.caminho(pts, { cor: 'borda', larg: 1.2, tracejado: [5, 4] });
      });
      var pts = [], i;
      for (i = 0; i <= 120; i++) { var rr = 3 * i / 120; pts.push([X(rr), Y(Mamp(rr, z))]); }
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      g.circ(X(r), Y(Mamp(r, z)), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [4, 4] });
      g.txt('ressonância', X(1), gy + gh + 0.3, { cor: 'aviso', tam: 11, fundo: true });
      [1, 2, 3].forEach(function (rr) {
        g.linha(X(rr), gy, X(rr), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(rr + '', X(rr), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [2, 4, 6].forEach(function (Mv) {
        g.linha(gx, Y(Mv), gx - 0.15, Y(Mv), { cor: 'fraco', larg: 1 });
        g.txt(Mv + '', gx - 0.28, Y(Mv), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('r = ω/ωₙ', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('amplificação M', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.2;
      g.txt('M = ' + fx(Mamp(r, z), 2), x0, 5.0, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('na ressonância M = 1/2ζ = ' + fx(1 / (2 * z), 1), x0, 4.2, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt(r < 0.7 ? 'região da rigidez: a resposta acompanha a força' :
            r > 1.4 ? 'região da massa: a inércia domina e a resposta cai' : 'região da ressonância: cuidado',
        x0, 3.3, { cor: r > 0.7 && r < 1.4 ? 'erro' : 'suave', tam: 11.5, alin: 'esq', negrito: r > 0.7 && r < 1.4 });
      g.txt('curvas tracejadas: ζ = 0,05 · 0,2 · 0,5', x0, 2.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a 10 % da ressonância a amplitude já cai um quarto', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  F('#fig-4-2', {
    titulo: 'Figura 4.2',
    legenda: 'A fase entre força e resposta: em fase abaixo da ressonância, 90° atrasada nela e 180° acima — o sistema passa a se mover contra a força.',
    vista: [-0.6, 12.6, -2.8, 5.4],
    altura: 350,
    controles: [
      { id: 'z', rot: 'Fator de amortecimento ζ', min: 0.02, max: 0.7, val: 0.1, passo: 0.02 },
      { id: 'r', rot: 'Razão de frequências', min: 0.1, max: 3, val: 0.9, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var z = p.z, r = p.r;
      var fase = function (rr) { return Math.atan2(2 * z * rr, 1 - rr * rr) * 180 / Math.PI; };
      var gx = 1.3, gy = 1.2, gw = 6.6, gh = 3.6;
      var X = function (rr) { return gx + gw * rr / 3; };
      var Y = function (f) { return gy + gh * f / 180; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      [0.05, 0.2, 0.5].forEach(function (zz) {
        var pts = [], i;
        for (i = 0; i <= 120; i++) { var rr = 0.01 + 3 * i / 120; pts.push([X(rr), Y(Math.atan2(2 * zz * rr, 1 - rr * rr) * 180 / Math.PI)]); }
        g.caminho(pts, { cor: 'borda', larg: 1.2, tracejado: [5, 4] });
      });
      var pts = [], i;
      for (i = 0; i <= 120; i++) { var rr = 0.01 + 3 * i / 120; pts.push([X(rr), Y(fase(rr))]); }
      g.caminho(pts, { cor: 's4', larg: 2.8 });
      g.circ(X(r), Y(fase(r)), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [4, 4] });
      [0, 90, 180].forEach(function (f) {
        g.linha(gx, Y(f), gx - 0.15, Y(f), { cor: 'fraco', larg: 1 });
        g.txt(f + '°', gx - 0.28, Y(f), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      [1, 2, 3].forEach(function (rr) {
        g.linha(X(rr), gy, X(rr), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(rr + '', X(rr), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('r = ω/ωₙ', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      var x0 = 8.4;
      g.txt('fase = ' + fx(fase(r), 1) + '°', x0, 4.4, { cor: 's4', tam: 15, alin: 'esq', negrito: true });
      g.txt(fase(r) < 45 ? 'resposta quase em fase com a força' :
            fase(r) > 135 ? 'resposta em oposição à força' : 'passagem pela ressonância', x0, 3.5,
        { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('em r = 1 a fase é 90° para qualquer ζ', x0, 2.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('é por isso que a fase identifica a ressonância melhor que a amplitude', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 5 ================= */

  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Desbalanceamento: a força cresce com o quadrado da rotação e a amplitude tende à própria excentricidade acima da crítica (exemplo 5.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'rpm', rot: 'Rotação', min: 300, max: 6000, val: 3000, passo: 50, un: 'rpm' },
      { id: 'me', rot: 'Massa desbalanceada', min: 2, max: 100, val: 20, passo: 2, un: 'g' },
      { id: 'e', rot: 'Raio', min: 20, max: 300, val: 100, passo: 10, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var w = p.rpm * 2 * Math.PI / 60, me = p.me / 1000, e = p.e / 1000;
      var Fv = me * e * w * w;
      var gx = 1.3, gy = 1.0, gw = 6.0, gh = 4.2;
      var X = function (rpm) { return gx + gw * rpm / 6000; };
      var Fmax = me * e * Math.pow(6000 * 2 * Math.PI / 60, 2);
      var Y = function (f) { return gy + gh * f / Fmax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var rpm = 6000 * i / 60, ww = rpm * 2 * Math.PI / 60;
        pts.push([X(rpm), Y(me * e * ww * ww)]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.6 });
      g.circ(X(p.rpm), Y(Fv), 0.15, { preenche: 'erro', cor: null });
      [1500, 3000, 4500, 6000].forEach(function (rpm) {
        g.linha(X(rpm), gy, X(rpm), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(rpm + '', X(rpm), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('rotação (rpm)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('força (N)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      /* rotor */
      var cx = 9.6, cy = 3.4, R = 1.1;
      g.circ(cx, cy, R, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.5 });
      g.circ(cx, cy, 0.12, { preenche: 'texto', cor: null });
      var ang = 0.6;
      g.circ(cx + R * 0.75 * Math.cos(ang), cy + R * 0.75 * Math.sin(ang), 0.1 + p.me / 400, { preenche: 'erro', cor: null });
      g.seta(cx, cy, 1.9 * Math.cos(ang), 1.9 * Math.sin(ang), { cor: 'erro', larg: 2.2, rot: 'F', rotTam: 12 });
      g.arco(cx, cy, R + 0.35, 2.4, 3.6, { cor: 'suave', ponta: true });
      var x0 = 8.2;
      g.txt('F = m·e·ω² = ' + fx(Fv, 0) + ' N', x0, 1.6, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('≈ ' + fx(Fv / 9.81, 1) + ' kgf girando com o rotor', x0, 0.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('desbalanceamento ' + fx(p.me * p.e, 0) + ' g·mm', x0, 0.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('dobrar a rotação quadruplica a força', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 6 ================= */

  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Critério da ISO 1940: o desbalanceamento residual admissível cai com a rotação. Quanto mais rápida a máquina, mais fino o balanceamento (exemplo 6.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'G', rot: 'Grau G (1 G1 · 2 G2,5 · 3 G6,3 · 4 G16 · 5 G40)', min: 1, max: 5, val: 3, passo: 1 },
      { id: 'rpm', rot: 'Rotação', min: 300, max: 6000, val: 3000, passo: 50, un: 'rpm' },
      { id: 'm', rot: 'Massa do rotor', min: 5, max: 500, val: 50, passo: 5, un: 'kg' }
    ],
    desenhar: function (g, p) {
      var Gs = { 1: 1, 2: 2.5, 3: 6.3, 4: 16, 5: 40 };
      var exemplos = { 1: 'turbinas e rotores de precisão', 2: 'turbinas a gás, acionamentos rápidos', 3: 'motores elétricos, bombas, ventiladores', 4: 'motores diesel, acionamentos gerais', 5: 'rodas, virabrequins' };
      var G = Gs[p.G], w = p.rpm * 2 * Math.PI / 60;
      var eper = G * 1000 / w, U = p.m * eper;
      var gx = 1.3, gy = 1.0, gw = 6.0, gh = 4.2;
      var X = function (rpm) { return gx + gw * (Math.log10(rpm) - 2.3) / 1.1; };
      var Y = function (e) { return gy + gh * (Math.log10(Math.max(0.1, e)) + 1) / 3.3; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      Object.keys(Gs).forEach(function (kk) {
        var Gv = Gs[kk], pts = [], i;
        for (i = 0; i <= 40; i++) {
          var rpm = Math.pow(10, 2.3 + 1.1 * i / 40);
          pts.push([X(rpm), Y(Gv * 1000 / (rpm * 2 * Math.PI / 60))]);
        }
        g.caminho(pts, { cor: +kk === p.G ? 's1' : 'borda', larg: +kk === p.G ? 2.6 : 1.1, tracejado: +kk === p.G ? false : [5, 4] });
      });
      g.circ(X(p.rpm), Y(eper), 0.15, { preenche: 'erro', cor: null });
      [300, 1000, 3000, 6000].forEach(function (rpm) {
        g.linha(X(rpm), gy, X(rpm), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(rpm + '', X(rpm), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [1, 10, 100].forEach(function (e) {
        g.linha(gx, Y(e), gx - 0.15, Y(e), { cor: 'fraco', larg: 1 });
        g.txt(e + '', gx - 0.28, Y(e), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('rotação (rpm, log)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('e_per (µm)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.0;
      g.txt('G ' + fx(G, 1), x0, 5.0, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt(exemplos[p.G], x0, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('e_per = G·1000/ω = ' + fx(eper, 1) + ' µm', x0, 3.4, { cor: 'texto', tam: 12.5, alin: 'esq' });
      g.txt('U_per = m·e_per', x0, 2.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(U, 0) + ' g·mm', x0, 1.9, { cor: 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt('= ' + fx(U / 100, 2) + ' g a 100 mm do eixo', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('em rotores de dois planos, metade do valor em cada plano', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 7 ================= */

  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Transmissibilidade: só há isolamento acima de r = √2. Abaixo disso o apoio flexível amplifica, e mais amortecimento piora o isolamento em regime (exemplo 7.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'r', rot: 'Razão de frequências', min: 0.2, max: 6, val: 3, passo: 0.1 },
      { id: 'z', rot: 'Amortecimento ζ', min: 0.02, max: 0.5, val: 0.05, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var r = p.r, z = p.z, T = Transm(r, z);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (rr) { return gx + gw * rr / 6; };
      var Y = function (Tv) { return gy + gh * Math.min(Tv, 5) / 5; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.ret(X(Math.SQRT2), gy, gw - (X(Math.SQRT2) - gx), gh, { preenche: 'ok', cor: null, alfa: 0.08 });
      g.linha(X(Math.SQRT2), gy, X(Math.SQRT2), gy + gh, { cor: 'ok', larg: 1.4, tracejado: [5, 4] });
      g.txt('√2', X(Math.SQRT2), gy + gh + 0.3, { cor: 'ok', tam: 11, fundo: true });
      g.linha(gx, Y(1), gx + gw, Y(1), { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      [0.05, 0.2, 0.4].forEach(function (zz) {
        var pts = [], i;
        for (i = 0; i <= 120; i++) { var rr = 0.05 + 6 * i / 120; pts.push([X(rr), Y(Transm(rr, zz))]); }
        g.caminho(pts, { cor: 'borda', larg: 1.1, tracejado: [5, 4] });
      });
      var pts = [], i;
      for (i = 0; i <= 120; i++) { var rr = 0.05 + 6 * i / 120; pts.push([X(rr), Y(Transm(rr, z))]); }
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      g.circ(X(r), Y(T), 0.15, { preenche: 'erro', cor: null });
      [1, 2, 3, 4, 5, 6].forEach(function (rr) {
        g.linha(X(rr), gy, X(rr), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(rr + '', X(rr), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('r = ω/ωₙ', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('T', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.2;
      g.txt('T = ' + fx(T, 3), x0, 5.0, { cor: T < 1 ? 'ok' : 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt(T < 1 ? 'isolamento de ' + fx(100 * (1 - T), 1) + ' %' : 'amplificação de ' + fx(100 * (T - 1), 0) + ' %',
        x0, 4.2, { cor: T < 1 ? 'ok' : 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt(r < Math.SQRT2 ? 'abaixo de √2: o apoio piora a situação' : 'acima de √2: há isolamento',
        x0, 3.4, { cor: r < Math.SQRT2 ? 'erro' : 'suave', tam: 11.5, alin: 'esq' });
      g.txt('para r = 3 com máquina a 1800 rpm,', x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a frequência natural precisa ser 10 Hz', x0, 1.95, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o que exige deflexão estática de ' + fx(1000 * 9.81 / Math.pow(2 * Math.PI * 10, 2), 1) + ' mm', x0, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('curvas tracejadas: ζ = 0,05 · 0,2 · 0,4 — mais amortecimento, pior isolamento', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 8 ================= */

  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Dois graus de liberdade, dois modos: no primeiro as massas andam juntas; no segundo, em oposição — e por isso a frequência é mais alta.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'modo', rot: 'Modo (1 ou 2)', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'mu', rot: 'Razão de massas m₂/m₁', min: 0.2, max: 3, val: 1, passo: 0.1 }
    ],
    desenhar: function (g, p, t) {
      var mu = p.mu, k = 1, m1 = 1, m2 = mu;
      /* duas massas ligadas por molas iguais (parede-m1, m1-m2): autovalores 2x2 */
      var A11 = 2 * k / m1, A12 = -k / m1, A21 = -k / m2, A22 = 2 * k / m2;
      var tra = A11 + A22, deta = A11 * A22 - A12 * A21;
      var l1 = (tra - Math.sqrt(tra * tra - 4 * deta)) / 2, l2 = (tra + Math.sqrt(tra * tra - 4 * deta)) / 2;
      var w1 = Math.sqrt(l1), w2 = Math.sqrt(l2);
      var lam = p.modo === 1 ? l1 : l2, wm = Math.sqrt(lam);
      var r1 = 1, r2 = (A11 - lam) / (-A12);     /* razão x2/x1 */
      var norm = Math.max(Math.abs(r1), Math.abs(r2));
      var amp = 0.75 / norm;
      var fase = Math.sin(wm * t * 1.6);
      var ox = 1.6, cy = 3.4;
      g.hachura(ox - 0.6, cy - 1.1, 2.2, Math.PI / 2, { cor: 'forte', d: 0.22 });
      g.linha(ox - 0.6, cy - 1.1, ox - 0.6, cy + 1.1, { cor: 'forte', larg: 2.5 });
      var x1 = ox + 1.8 + amp * r1 * fase, x2 = ox + 5.0 + amp * r2 * fase;
      g.mola(ox - 0.6, cy, x1 - 0.7, cy, 6, { cor: 'suave' });
      g.mola(x1 + 0.7, cy, x2 - 0.7, cy, 6, { cor: 'suave' });
      g.ret(x1 - 0.7, cy - 0.6, 1.4, 1.2, { preenche: 'acento', cor: 'forte', larg: 1.4, alfa: 0.5 });
      g.ret(x2 - 0.7, cy - 0.6 * Math.sqrt(mu), 1.4, 1.2 * Math.sqrt(mu), { preenche: 's3', cor: 'forte', larg: 1.4, alfa: 0.5 });
      g.txt('m₁', x1, cy, { cor: 'texto', tam: 12, negrito: true });
      g.txt('m₂', x2, cy, { cor: 'texto', tam: 12, negrito: true });
      g.hachura(ox - 0.6, cy - 1.15, 7.4, 0, { cor: 'forte', d: 0.18 });
      g.seta(x1, cy + 1.3, amp * r1 * 1.2, 0, { cor: 's1', larg: 2, ponta: 0.2 });
      g.seta(x2, cy + 1.3, amp * r2 * 1.2, 0, { cor: 's2', larg: 2, ponta: 0.2 });
      var x0 = 9.0;
      g.txt('modo ' + p.modo, x0, 5.0, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('ω = ' + fx(wm, 3) + ' √(k/m₁)', x0, 4.2, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('x₂/x₁ = ' + fx(r2, 2), x0, 3.4, { cor: 's2', tam: 12.5, alin: 'esq' });
      g.txt(r2 > 0 ? 'massas em fase' : 'massas em oposição', x0, 2.7, { cor: r2 > 0 ? 'ok' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('ω₁ = ' + fx(w1, 3) + ' · ω₂ = ' + fx(w2, 3), x0, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('(em unidades de √(k/m₁))', x0, 1.25, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('no segundo modo a mola do meio se deforma mais: o sistema fica mais rígido', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 9 ================= */

  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Absorvedor sintonizado: na frequência de projeto a máquina para de vibrar, mas surgem duas novas ressonâncias, uma de cada lado.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'mu', rot: 'Massa do absorvedor (% da principal)', min: 2, max: 30, val: 10, passo: 1, un: '%' },
      { id: 'r', rot: 'Frequência de operação', min: 0.5, max: 1.6, val: 1, passo: 0.02 }
    ],
    desenhar: function (g, p) {
      var mu = p.mu / 100, r = p.r;
      /* resposta da massa principal com absorvedor sintonizado (sem amortecimento) */
      function X1(rr) {
        var num = Math.abs(1 - rr * rr);
        var den = Math.abs((1 - rr * rr) * (1 + mu - rr * rr) - mu);
        return den < 1e-6 ? 50 : num / den;
      }
      var gx = 1.3, gy = 1.0, gw = 6.4, gh = 4.2;
      var X = function (rr) { return gx + gw * (rr - 0.5) / 1.2; };
      var Y = function (v) { return gy + gh * Math.min(v, 6) / 6; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* sem absorvedor, ζ = 0,05 */
      var pts0 = [], pts = [], i;
      for (i = 0; i <= 160; i++) {
        var rr = 0.5 + 1.2 * i / 160;
        pts0.push([X(rr), Y(Mamp(rr, 0.05))]);
        pts.push([X(rr), Y(X1(rr))]);
      }
      g.caminho(pts0, { cor: 'borda', larg: 1.6, tracejado: [5, 4] });
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.circ(X(r), Y(X1(r)), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'ok', larg: 1.3, tracejado: [4, 4] });
      g.txt('sintonia', X(1), gy + gh + 0.3, { cor: 'ok', tam: 11, fundo: true });
      [0.6, 0.8, 1.0, 1.2, 1.4, 1.6].forEach(function (rr) {
        g.linha(X(rr), gy, X(rr), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(fx(rr, 1), X(rr), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('r = ω/ωₙ', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('amplitude da massa principal', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      /* novas frequências naturais */
      var A = 1, B = -(2 + mu), C = 1;
      var r2a = (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A), r2b = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
      var x0 = 8.4;
      g.txt('amplitude ' + (X1(r) < 0.05 ? '≈ 0' : fx(X1(r), 2)), x0, 5.0, { cor: X1(r) < 0.3 ? 'ok' : 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('sem absorvedor: ' + fx(Mamp(r, 0.05), 2), x0, 4.2, { cor: 'fraco', tam: 12, alin: 'esq' });
      g.txt('novas ressonâncias', x0, 3.3, { cor: 'aviso', tam: 11.5, alin: 'esq' });
      g.txt('r = ' + fx(Math.sqrt(r2a), 3) + ' e ' + fx(Math.sqrt(r2b), 3), x0, 2.7, { cor: 'aviso', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('massa do absorvedor: ' + p.mu + ' %', x0, 1.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('mais massa afasta as duas novas', x0, 1.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('ressonâncias da frequência de trabalho', x0, 0.75, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('só vale para excitação de frequência fixa', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 10 ================= */

  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Cada defeito tem sua assinatura no espectro: desbalanceamento em 1×, desalinhamento em 2×, folga com muitos harmônicos e rolamento em frequências não inteiras.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'def', rot: 'Defeito (1 bom · 2 desbalanceamento · 3 desalinhamento · 4 folga · 5 rolamento)', min: 1, max: 5, val: 2, passo: 1 }],
    desenhar: function (g, p) {
      var def = p.def;
      var picos = {
        1: [[1, 0.18], [2, 0.08], [3, 0.05]],
        2: [[1, 1.0], [2, 0.12], [3, 0.06]],
        3: [[1, 0.5], [2, 0.95], [3, 0.35]],
        4: [[1, 0.6], [2, 0.5], [3, 0.45], [4, 0.4], [5, 0.35], [6, 0.3]],
        5: [[1, 0.25], [3.6, 0.55], [7.2, 0.4], [10.8, 0.3]]
      }[def];
      var nomes = { 1: 'máquina em bom estado', 2: 'desbalanceamento', 3: 'desalinhamento', 4: 'folga mecânica', 5: 'defeito em rolamento' };
      var dicas = {
        1: 'níveis baixos, sem harmônicos',
        2: 'pico em 1×, radial',
        3: '2× forte e axial alto',
        4: 'muitos harmônicos de 1×',
        5: 'frequências não inteiras (BPFO/BPFI)'
      };
      var gx = 1.3, gy = 1.2, gw = 7.0, gh = 3.8;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      picos.forEach(function (q) {
        var x = gx + gw * q[0] / 12;
        g.ret(x - 0.07, gy, 0.14, gh * q[1], { preenche: def === 5 && q[0] !== 1 ? 's4' : 's1', cor: null, alfa: 0.85 });
        if (q[1] > 0.3) g.txt(fx(q[0], 1) + '×', x, gy + gh * q[1] + 0.3, { cor: 'suave', tam: 10.5 });
      });
      /* ruído de fundo */
      var semente = 9;
      for (var i = 0; i < 60; i++) {
        semente = (semente * 9301 + 49297) % 233280;
        var x = gx + gw * (i + 0.5) / 60;
        var h = (semente / 233280) * (def === 5 ? 0.12 : 0.05) * gh;
        g.linha(x, gy, x, gy + h, { cor: 'borda', larg: 1 });
      }
      [1, 2, 3, 6, 9, 12].forEach(function (f) {
        var x = gx + gw * f / 12;
        g.linha(x, gy, x, gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(f + '×', x, gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('múltiplos da rotação', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('amplitude', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.8;
      g.txt(nomes[def], x0, 4.6, { cor: def === 1 ? 'ok' : 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt(dicas[def], x0, 3.7, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('o que fazer:', x0, 2.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt({ 1: 'seguir a rotina de medição', 2: 'balancear em campo', 3: 'realinhar com relógio ou laser',
              4: 'reapertar e verificar folgas', 5: 'programar a troca do rolamento' }[def],
        x0, 2.0, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ISO 10816 classifica a severidade pelo nível global em mm/s', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

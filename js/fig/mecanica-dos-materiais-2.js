/* ============================================================
   Figuras ilustrativas de Mecânica dos Materiais II
   Estado plano, círculo de Mohr, envoltórias de falha, Euler,
   amplificação de segunda ordem, vasos finos e de Lamé e energia.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };

  /* 1.1 — estado plano e rotação do elemento */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Gire o elemento e veja as componentes mudarem: o estado de tensão é o mesmo, mas o que se mede depende da direção do corte.',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'sx', rot: 'σx', min: -200, max: 200, val: 100, passo: 10, un: 'MPa' },
      { id: 'sy', rot: 'σy', min: -200, max: 200, val: -40, passo: 10, un: 'MPa' },
      { id: 'th', rot: 'Rotação do elemento', min: 0, max: 180, val: 0, passo: 1, un: '°' }
    ],
    desenhar: function (g, p) {
      var sx = p.sx, sy = p.sy, txy = 30, th = p.th * Math.PI / 180;
      var c = (sx + sy) / 2, d = (sx - sy) / 2;
      var sxl = c + d * Math.cos(2 * th) + txy * Math.sin(2 * th);
      var syl = c - d * Math.cos(2 * th) - txy * Math.sin(2 * th);
      var txl = -d * Math.sin(2 * th) + txy * Math.cos(2 * th);
      var cx = 3.2, cy = 2.6, a = 1.2, esc = 1.6 / 200;
      function ladoSeta(ang, val, cor, rot) {
        var ux = Math.cos(ang + th), uy = Math.sin(ang + th);
        var bx = cx + ux * a, by = cy + uy * a;
        if (Math.abs(val) < 2) return;
        g.seta(bx, by, ux * val * esc, uy * val * esc, { cor: cor, larg: 2, rot: rot, rotTam: 11, rotDx: ux * 0.5, rotDy: uy * 0.5 });
      }
      /* elemento girado */
      var q = [];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (v) {
        q.push([cx + a * (v[0] * Math.cos(th) - v[1] * Math.sin(th)), cy + a * (v[0] * Math.sin(th) + v[1] * Math.cos(th))]);
      });
      g.caminho(q, { cor: 'forte', larg: 1.8, fechar: true, preenche: 'acento', alfa: 0.18 });
      ladoSeta(0, sxl, 'erro', 'σx′');
      ladoSeta(Math.PI, sxl, 'erro', '');
      ladoSeta(Math.PI / 2, syl, 's3', 'σy′');
      ladoSeta(-Math.PI / 2, syl, 's3', '');
      if (Math.abs(txl) > 2) {
        var ux = Math.cos(th), uy = Math.sin(th);
        g.seta(cx + ux * a, cy + uy * a, -uy * txl * esc, ux * txl * esc, { cor: 's2', larg: 1.8, rot: 'τ′', rotTam: 11 });
        g.seta(cx - ux * a, cy - uy * a, uy * txl * esc, -ux * txl * esc, { cor: 's2', larg: 1.8 });
      }
      var x0 = 7.0;
      g.txt('estado original', x0, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('σx = ' + sx + ' · σy = ' + sy + ' · τxy = ' + txy, x0, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('girado ' + p.th + '°', x0, 3.5, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('σx′ = ' + fx(sxl, 1) + ' MPa', x0, 2.8, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('σy′ = ' + fx(syl, 1) + ' MPa', x0, 2.2, { cor: 's3', tam: 12.5, alin: 'esq' });
      g.txt('τx′y′ = ' + fx(txl, 1) + ' MPa', x0, 1.6, { cor: 's2', tam: 12.5, alin: 'esq' });
      g.txt('σx′ + σy′ = ' + fx(sxl + syl, 1) + ' (invariante)', x0, 0.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o estado se repete a cada 180° do elemento — por isso as fórmulas trazem 2θ', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.1 — círculo de Mohr */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Círculo de Mohr: cada ponto é um plano. Os extremos horizontais são as tensões principais e o raio é o cisalhamento máximo (exemplo 2.1).',
    vista: [-0.6, 12.6, -3.0, 5.8],
    altura: 350,
    controles: [
      { id: 'sx', rot: 'σx', min: -200, max: 250, val: 100, passo: 10, un: 'MPa' },
      { id: 'sy', rot: 'σy', min: -200, max: 250, val: -40, passo: 10, un: 'MPa' },
      { id: 'txy', rot: 'τxy', min: -150, max: 150, val: 30, passo: 5, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var sx = p.sx, sy = p.sy, txy = p.txy;
      var c = (sx + sy) / 2, R = Math.hypot((sx - sy) / 2, txy);
      var s1 = c + R, s2 = c - R, thp = 0.5 * Math.atan2(2 * txy, sx - sy) * 180 / Math.PI;
      var cx = 4.0, cy = 2.6, esc = 2.0 / 250;
      g.linha(cx - 3.4, cy, cx + 3.4, cy, { cor: 'fraco', larg: 1.1 });
      g.linha(cx, cy - 2.4, cx, cy + 2.4, { cor: 'fraco', larg: 1.1 });
      g.txt('σ', cx + 3.5, cy - 0.3, { cor: 'fraco', tam: 11 });
      g.txt('τ', cx - 0.3, cy + 2.4, { cor: 'fraco', tam: 11 });
      g.circ(cx + c * esc, cy, R * esc, { cor: 's1', larg: 2.4 });
      g.circ(cx + c * esc, cy, 0.09, { preenche: 's1', cor: null });
      g.circ(cx + sx * esc, cy - txy * esc, 0.13, { preenche: 'erro', cor: null });
      g.circ(cx + sy * esc, cy + txy * esc, 0.13, { preenche: 's3', cor: null });
      g.linha(cx + sx * esc, cy - txy * esc, cx + sy * esc, cy + txy * esc, { cor: 'borda', larg: 1.2 });
      g.txt('(σx, −τxy)', cx + sx * esc, cy - txy * esc - 0.4, { cor: 'erro', tam: 10.5, fundo: true });
      g.txt('(σy, τxy)', cx + sy * esc, cy + txy * esc + 0.4, { cor: 's3', tam: 10.5, fundo: true });
      g.circ(cx + s1 * esc, cy, 0.12, { preenche: 'ok', cor: null });
      g.circ(cx + s2 * esc, cy, 0.12, { preenche: 'ok', cor: null });
      g.circ(cx + c * esc, cy + R * esc, 0.12, { preenche: 's2', cor: null });
      var x0 = 8.4;
      g.txt('σ₁ = ' + fx(s1, 1) + ' MPa', x0, 5.0, { cor: 'ok', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('σ₂ = ' + fx(s2, 1) + ' MPa', x0, 4.3, { cor: 'ok', tam: 13, alin: 'esq' });
      g.txt('τ máx = ' + fx(R, 1) + ' MPa', x0, 3.5, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('centro ' + fx(c, 1) + ' · raio ' + fx(R, 1), x0, 2.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('θp = ' + fx(thp, 1) + '°', x0, 2.0, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('(no elemento; no círculo, o dobro)', x0, 1.4, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(Math.abs(s1) > Math.abs(s2) ? 'maior tração em σ₁' : 'maior compressão em σ₂', x0, 0.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('nos planos principais o cisalhamento é nulo; no de τ máx, σ = centro', 6, -2.5, { cor: 'fraco', tam: 11 });
    }
  });

  /* 4.1 — critérios dúcteis */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Envoltórias de escoamento no plano das tensões principais: von Mises (elipse) e Tresca (hexágono inscrito). O ponto mostra o estado atual.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 's1', rot: 'σ₁', min: -400, max: 400, val: 200, passo: 10, un: 'MPa' },
      { id: 's2', rot: 'σ₂', min: -400, max: 400, val: -100, passo: 10, un: 'MPa' },
      { id: 'Sy', rot: 'Escoamento', min: 150, max: 500, val: 300, passo: 10, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var s1 = p.s1, s2 = p.s2, Sy = p.Sy;
      var vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
      var tr = (s1 * s2 < 0) ? Math.abs(s1 - s2) : Math.max(Math.abs(s1), Math.abs(s2));
      var cx = 3.8, cy = 2.6, esc = 2.0 / 400;
      g.linha(cx - 2.6, cy, cx + 2.6, cy, { cor: 'fraco', larg: 1.1 });
      g.linha(cx, cy - 2.6, cx, cy + 2.6, { cor: 'fraco', larg: 1.1 });
      var pts = [], i;
      for (i = 0; i <= 90; i++) {
        var th = 2 * Math.PI * i / 90, a = Math.cos(th), b = Math.sin(th);
        var r = Sy / Math.sqrt(a * a - a * b + b * b);
        pts.push([cx + r * a * esc, cy + r * b * esc]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.2, fechar: true });
      var hex = [[Sy, 0], [Sy, Sy], [0, Sy], [-Sy, 0], [-Sy, -Sy], [0, -Sy]].map(function (q) { return [cx + q[0] * esc, cy + q[1] * esc]; });
      g.caminho(hex, { cor: 's2', larg: 1.8, fechar: true, tracejado: [6, 4] });
      g.circ(cx + s1 * esc, cy + s2 * esc, 0.15, { preenche: vm > Sy ? 'erro' : 'ok', cor: null });
      g.txt('σ₁', cx + 2.7, cy - 0.3, { cor: 'fraco', tam: 11 });
      g.txt('σ₂', cx - 0.35, cy + 2.6, { cor: 'fraco', tam: 11 });
      var x0 = 7.6;
      g.txt('von Mises ' + fx(vm, 1) + ' MPa', x0, 5.0, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('n = ' + fx(Sy / vm, 2), x0, 4.4, { cor: 's1', tam: 12, alin: 'esq' });
      g.txt('Tresca ' + fx(tr, 1) + ' MPa', x0, 3.5, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('n = ' + fx(Sy / tr, 2), x0, 2.9, { cor: 's2', tam: 12, alin: 'esq' });
      g.txt(vm > Sy ? 'escoa por von Mises' : tr > Sy ? 'escoa por Tresca, não por von Mises' : 'não escoa',
        x0, 2.0, { cor: vm > Sy ? 'erro' : tr > Sy ? 'aviso' : 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('diferença entre critérios: ' + fx(100 * (tr / vm - 1), 1) + ' %', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o segundo e o quarto quadrantes (sinais opostos) é onde eles mais divergem', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 5.1 — critérios frágeis */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Material frágil: a envoltória é assimétrica porque a resistência à compressão é muito maior que à tração. Mohr-Coulomb liga os dois limites.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 's1', rot: 'σ₁', min: -600, max: 300, val: 100, passo: 10, un: 'MPa' },
      { id: 's2', rot: 'σ₂', min: -600, max: 300, val: -200, passo: 10, un: 'MPa' },
      { id: 'raz', rot: 'Suc/Sut', min: 1, max: 6, val: 3.5, passo: 0.5 }
    ],
    desenhar: function (g, p) {
      var Sut = 200, Suc = Sut * p.raz, s1 = p.s1, s2 = p.s2;
      /* Mohr-Coulomb no plano das principais */
      function falha(a, b) {
        if (a >= 0 && b >= 0) return Math.max(a, b) / Sut;
        if (a <= 0 && b <= 0) return Math.max(-a, -b) / Suc;
        var mx = Math.max(a, b), mn = Math.min(a, b);
        return mx / Sut - mn / Suc;
      }
      var fs = falha(s1, s2);
      var cx = 4.2, cy = 3.0, esc = 2.4 / 600;
      g.linha(cx - 2.8, cy, cx + 1.6, cy, { cor: 'fraco', larg: 1.1 });
      g.linha(cx, cy - 2.8, cx, cy + 1.6, { cor: 'fraco', larg: 1.1 });
      var env = [[Sut, 0], [Sut, Sut], [0, Sut], [0, -Suc], [-Suc, -Suc], [-Suc, 0]].map(function (q) { return [cx + q[0] * esc, cy + q[1] * esc]; });
      g.caminho(env, { cor: 's2', larg: 2.2, fechar: true });
      g.circ(cx + s1 * esc, cy + s2 * esc, 0.15, { preenche: fs > 1 ? 'erro' : 'ok', cor: null });
      g.txt('Sut', cx + Sut * esc, cy - 0.35, { cor: 'fraco', tam: 10 });
      g.txt('−Suc', cx - Suc * esc, cy + 0.35, { cor: 'fraco', tam: 10 });
      var x0 = 7.8;
      g.txt('Sut = ' + Sut + ' MPa', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Suc = ' + fx(Suc, 0) + ' MPa', x0, 4.4, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('índice de falha ' + fx(fs, 2), x0, 3.5, { cor: fs > 1 ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt('n = ' + fx(1 / fs, 2), x0, 2.8, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt(fs > 1 ? 'fratura prevista' : 'dentro da envoltória', x0, 2.0,
        { cor: fs > 1 ? 'erro' : 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('ferro fundido: Suc ≈ 3 a 4 × Sut', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a fratura frágil ocorre no plano de maior tensão normal de tração', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 6.1 — Euler */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Curva de flambagem: acima da esbeltez de transição vale Euler; abaixo dela, a coluna escoa antes de perder estabilidade (exemplo 6.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'L', rot: 'Comprimento', min: 0.5, max: 8, val: 3, passo: 0.1, un: 'm' },
      { id: 'apoio', rot: 'Apoios (1 biarticulada · 2 biengastada · 3 engastada-livre · 4 engastada-articulada)', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'I', rot: 'Momento de inércia ×10⁶', min: 1, max: 30, val: 8, passo: 0.5, un: 'mm⁴' }
    ],
    desenhar: function (g, p) {
      var K = { 1: 1, 2: 0.5, 3: 2, 4: 0.7 }[p.apoio];
      var nomes = { 1: 'biarticulada (K = 1)', 2: 'biengastada (K = 0,5)', 3: 'engastada-livre (K = 2)', 4: 'engastada-articulada (K = 0,7)' };
      var E = 200000, I = p.I * 1e6, A = 2000, Sy = 250;
      var L = p.L * 1000, Le = K * L, r = Math.sqrt(I / A), lam = Le / r;
      var Pcr = Math.PI * Math.PI * E * I / (Le * Le) / 1000;
      var scr = Pcr * 1000 / A;
      var lamT = Math.PI * Math.sqrt(2 * E / Sy);
      var gx = 1.3, gy = 1.0, gw = 6.0, gh = 4.2;
      var X = function (l) { return gx + gw * l / 250; }, Y = function (sv) { return gy + gh * sv / 300; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, eu = [];
      for (i = 0; i <= 60; i++) {
        var l = 20 + 230 * i / 60;
        eu.push([X(l), Y(Math.min(300, Math.PI * Math.PI * E / (l * l)))]);
      }
      g.caminho(eu, { cor: 's1', larg: 2.4 });
      g.linha(gx, Y(Sy), X(lamT), Y(Sy), { cor: 's2', larg: 2.2 });
      g.linha(X(lamT), gy, X(lamT), gy + gh, { cor: 'aviso', larg: 1.2, tracejado: [5, 4] });
      g.txt('λ transição ' + fx(lamT, 0), X(lamT), gy + gh + 0.3, { cor: 'aviso', tam: 10.5, fundo: true });
      g.circ(X(Math.min(250, lam)), Y(Math.min(300, scr)), 0.15, { preenche: 'erro', cor: null });
      [50, 100, 150, 200, 250].forEach(function (l) {
        g.linha(X(l), gy, X(l), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(l + '', X(l), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [100, 200, 300].forEach(function (sv) {
        g.linha(gx, Y(sv), gx - 0.15, Y(sv), { cor: 'fraco', larg: 1 });
        g.txt(sv + '', gx - 0.28, Y(sv), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('esbeltez λ = KL/r', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('σ crítica (MPa)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.0;
      g.txt(nomes[p.apoio], x0, 5.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('Le = ' + fx(Le / 1000, 2) + ' m · r = ' + fx(r, 1) + ' mm', x0, 4.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('λ = ' + fx(lam, 1), x0, 3.8, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('P crítica ' + fx(Pcr, 0) + ' kN', x0, 3.0, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('σ crítica ' + fx(scr, 0) + ' MPa', x0, 2.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(lam > lamT ? 'coluna esbelta: Euler governa' : 'coluna curta: o escoamento vem antes',
        x0, 1.4, { cor: lam > lamT ? 's1' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('E = 200 GPa · A = 2000 mm² · Sy = 250 MPa', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.1 — amplificação de segunda ordem */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Efeito de segunda ordem: a deflexão aumenta o braço, que aumenta o momento. O fator 1/(1 − P/Pcr) cresce depressa quando a carga se aproxima da crítica.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'raz', rot: 'P / P crítica', min: 0, max: 0.9, val: 0.3, passo: 0.05 },
      { id: 'e', rot: 'Excentricidade', min: 5, max: 100, val: 50, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var raz = p.raz, e = p.e;
      var amp = 1 / (1 - raz);
      var P = 500 * raz, A = 2000, W = 160000;        /* kN e mm³ */
      var M0 = P * 1000 * e / 1e6;                     /* kN·m */
      var M = M0 * amp;
      var sN = P * 1000 / A, sM = M * 1e6 / W;
      var gx = 6.6, gy = 1.0, gw = 5.2, gh = 4.2;
      var X = function (r) { return gx + gw * r / 0.95; }, Y = function (a) { return gy + gh * Math.min(a, 10) / 10; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var r = 0.95 * i / 60;
        pts.push([X(r), Y(1 / (1 - r))]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.6 });
      g.circ(X(raz), Y(amp), 0.15, { preenche: 'erro', cor: null });
      [0.25, 0.5, 0.75].forEach(function (r) {
        g.linha(X(r), gy, X(r), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(fx(r, 2), X(r), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [2, 5, 10].forEach(function (a) {
        g.linha(gx, Y(a), gx - 0.15, Y(a), { cor: 'fraco', larg: 1 });
        g.txt(a + '×', gx - 0.28, Y(a), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('P / P crítica', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      /* coluna deformada */
      var ox = 2.6, base = 0.8, topo = 5.0;
      var defl = 0.25 + 1.1 * (amp - 1) / 9;
      var col = [];
      for (i = 0; i <= 30; i++) {
        var f = i / 30;
        col.push([ox + defl * Math.sin(Math.PI * f), base + (topo - base) * f]);
      }
      g.caminho(col, { cor: 'acento', larg: 4 });
      g.linha(ox, base, ox, topo, { cor: 'borda', larg: 1.2, tracejado: [5, 4] });
      g.hachura(ox - 0.6, base - 0.05, 1.2, 0, { cor: 'forte', d: 0.2 });
      g.seta(ox + e * 0.012, topo + 1.1, 0, -0.8, { cor: 'erro', larg: 2.4, rot: 'P', rotTam: 12, rotDx: 0.4, rotDy: 0 });
      g.cota(ox, topo + 0.5, ox + e * 0.012, topo + 0.5, 'e', { dy: 0.3 });
      var x0 = 1.0, y0 = 0.2;
      g.txt('amplificação ' + fx(amp, 2) + '×', x0, y0, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('M₀ = ' + fx(M0, 1) + ' → M = ' + fx(M, 1) + ' kN·m', x0, y0 - 0.7, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('σ = P/A + M/W = ' + fx(sN + sM, 1) + ' MPa', x0, y0 - 1.4, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('acima de P/Pcr = 0,5 o efeito de segunda ordem deixa de ser desprezível', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 8.1 — vaso de parede fina */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'No cilindro, a tensão circunferencial é o dobro da longitudinal — por isso o vaso rasga ao longo de uma geratriz e a solda longitudinal é a crítica (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'p', rot: 'Pressão interna', min: 0.5, max: 10, val: 2, passo: 0.5, un: 'MPa' },
      { id: 'D', rot: 'Diâmetro interno', min: 200, max: 3000, val: 1000, passo: 50, un: 'mm' },
      { id: 't', rot: 'Espessura', min: 4, max: 60, val: 10, passo: 1, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var pr = p.p, r = p.D / 2, t = p.t;
      var sth = pr * r / t, sL = sth / 2;
      var vm = Math.sqrt(sth * sth - sth * sL + sL * sL);
      var fina = t < r / 10;
      var esf = pr * r / (2 * t);
      var cx = 3.0, cy = 3.0, R = 1.5;
      g.ret(cx - 2.4, cy - R, 4.8, 2 * R, { cor: 'forte', larg: 2, preenche: 'acento', alfa: 0.15 });
      g.circ(cx - 2.4, cy, R, { cor: 'forte', larg: 1.4, tracejado: [4, 3] });
      g.seta(cx, cy + R, 0, 1.0, { cor: 'erro', larg: 2.2, rot: 'σθ', rotTam: 12 });
      g.seta(cx, cy - R, 0, -1.0, { cor: 'erro', larg: 2.2 });
      g.seta(cx + 2.4, cy, 1.0, 0, { cor: 's3', larg: 2.2, rot: 'σL', rotTam: 12, rotDy: 0.4, rotDx: 0.2 });
      g.seta(cx - 2.4, cy, -1.0, 0, { cor: 's3', larg: 2.2 });
      g.txt('solda longitudinal (crítica)', cx, cy - R - 0.7, { cor: 'fraco', tam: 10.5 });
      var x0 = 7.0;
      g.txt('σθ = pr/t = ' + fx(sth, 1) + ' MPa', x0, 5.0, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('σL = pr/2t = ' + fx(sL, 1) + ' MPa', x0, 4.3, { cor: 's3', tam: 13, alin: 'esq' });
      g.txt('von Mises ' + fx(vm, 1) + ' MPa', x0, 3.5, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.ret(x0, 2.4, 4.4 * Math.min(1, sth / 300), 0.45, { preenche: 'erro', cor: null, alfa: 0.8 });
      g.ret(x0, 1.8, 4.4 * Math.min(1, sL / 300), 0.45, { preenche: 's3', cor: null, alfa: 0.8 });
      g.txt('t/r = ' + fx(t / r, 3) + (fina ? ' ✓ parede fina' : ' ✗ use Lamé'), x0, 1.1,
        { cor: fina ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: !fina });
      g.txt('esfera de mesmo raio teria ' + fx(esf, 1) + ' MPa', x0, 0.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('com aço de 250 MPa de escoamento, n = ' + fx(250 / vm, 2) + ' por von Mises', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 9.1 — Lamé */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Distribuição de Lamé: a tensão circunferencial é máxima no raio interno e cai para fora. A fórmula de parede fina subestima o pico (exemplo 9.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'ri', rot: 'Raio interno', min: 50, max: 200, val: 100, passo: 5, un: 'mm' },
      { id: 'ro', rot: 'Raio externo', min: 60, max: 400, val: 150, passo: 5, un: 'mm' },
      { id: 'pi', rot: 'Pressão interna', min: 5, max: 200, val: 50, passo: 5, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var ri = p.ri, ro = Math.max(p.ro, p.ri + 10), pi = p.pi;
      function sth(r) { return pi * ri * ri / (ro * ro - ri * ri) * (1 + ro * ro / (r * r)); }
      function sr(r) { return pi * ri * ri / (ro * ro - ri * ri) * (1 - ro * ro / (r * r)); }
      var fina = pi * (ri + ro) / 2 / (ro - ri);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var smax = Math.max(sth(ri), 10);
      var X = function (r) { return gx + gw * (r - ri) / (ro - ri); };
      var Y = function (sv) { return gy + gh * (sv + smax * 0.4) / (smax * 1.5); };
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 'fraco', larg: 1.1 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pt = [], pr2 = [];
      for (i = 0; i <= 50; i++) {
        var r = ri + (ro - ri) * i / 50;
        pt.push([X(r), Y(sth(r))]);
        pr2.push([X(r), Y(sr(r))]);
      }
      g.caminho(pt, { cor: 'erro', larg: 2.6 });
      g.caminho(pr2, { cor: 's3', larg: 2.2 });
      g.linha(gx, Y(fina), gx + gw, Y(fina), { cor: 'borda', larg: 1.4, tracejado: [6, 4] });
      g.txt('σθ (circunferencial)', X(ri + (ro - ri) * 0.45), Y(sth(ri + (ro - ri) * 0.45)) + 0.4, { cor: 'erro', tam: 10.5 });
      g.txt('σr (radial)', X(ri + (ro - ri) * 0.5), Y(sr(ri + (ro - ri) * 0.5)) - 0.4, { cor: 's3', tam: 10.5 });
      g.txt('parede fina', gx + gw - 0.1, Y(fina) + 0.3, { cor: 'fraco', tam: 10.5, alin: 'dir' });
      g.txt('r interno', gx, gy - 0.5, { cor: 'fraco', tam: 10.5 });
      g.txt('r externo', gx + gw, gy - 0.5, { cor: 'fraco', tam: 10.5 });
      var x0 = 8.2;
      g.txt('σθ no raio interno', x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(sth(ri), 1) + ' MPa', x0, 4.3, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('σθ no externo ' + fx(sth(ro), 1) + ' MPa', x0, 3.5, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('parede fina daria ' + fx(fina, 1) + ' MPa', x0, 2.8, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('erro de ' + fx(100 * (1 - fina / sth(ri)), 1) + ' % a favor da insegurança', x0, 2.2, { cor: 'aviso', tam: 11, alin: 'esq' });
      g.txt('razão ro/ri = ' + fx(ro / ri, 2), x0, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('engrossar a parede tem retorno decrescente: daí o autofretamento e as multicamadas', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 10.1 — energia de deformação */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Energia de deformação é a área sob a curva força-deslocamento. É ela que permite calcular deflexões por Castigliano e dimensionar contra impacto.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Caso (1 tração · 2 flexão · 3 torção)', min: 1, max: 3, val: 1, passo: 1 },
      { id: 'P', rot: 'Carga', min: 5, max: 100, val: 40, passo: 5, un: 'kN' }
    ],
    desenhar: function (g, p) {
      var P = p.P * 1000, L = 1000, E = 200000, G = 80000;
      var A = 2000, I = 8e6, J = 1.6e7;
      var dados = {
        1: { n: 'Tração', U: P * P * L / (2 * A * E), d: P * L / (A * E), f: 'U = N²L/2AE' },
        2: { n: 'Flexão (balanço)', U: P * P * Math.pow(L, 3) / (6 * E * I), d: P * Math.pow(L, 3) / (3 * E * I), f: 'U = P²L³/6EI' },
        3: { n: 'Torção', U: P * 0.1 * P * 0.1 * L / (2 * G * J), d: P * 0.1 * L / (G * J), f: 'U = T²L/2GJ' }
      }[p.tipo];
      var gx = 1.4, gy = 1.0, gw = 5.4, gh = 4.0;
      var X = function (d) { return gx + gw * d / (dados.d * 1.4); }, Y = function (f) { return gy + gh * f / (P * 1.4); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.caminho([[X(0), Y(0)], [X(dados.d), Y(P)], [X(dados.d), Y(0)]],
        { cor: 's1', larg: 2.4, fechar: true, preenche: 's1', alfa: 0.2 });
      g.circ(X(dados.d), Y(P), 0.14, { preenche: 'erro', cor: null });
      g.txt('U = área', X(dados.d * 0.45), Y(P * 0.3), { cor: 's1', tam: 11.5 });
      g.txt('deslocamento', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('força', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.6;
      g.txt(dados.n, x0, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(dados.f, x0, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('U = ' + fx(dados.U / 1000, 2) + ' J', x0, 3.4, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('δ = ' + fx(dados.d, 3) + ' mm', x0, 2.7, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('Castigliano: δ = ∂U/∂P', x0, 1.9, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('confere: 2U/P = ' + fx(2 * dados.U / P, 3) + ' mm', x0, 1.3, { cor: 'ok', tam: 11.5, alin: 'esq' });
      g.txt('para carga aplicada gradualmente, U = ½·P·δ — daí o fator 2 na conferência', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

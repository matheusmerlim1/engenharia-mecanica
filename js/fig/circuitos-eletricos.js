/* ============================================================
   Figuras ilustrativas de Circuitos Elétricos
   Uma por capítulo: convenção de sinais, curvas i–v, as leis de
   Kirchhoff, divisores, matriz nodal, correntes de malha,
   transformação de fontes, Thévenin, capacitor e indutor,
   constante de tempo, singularidades, os três amortecimentos,
   fasores e o triângulo de potências. Usa window.CE.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.CE) return;
  var F = window.Figura.criar, CE = window.CE;
  var fx = function (v, n) { n = n == null ? 1 : n; return v.toLocaleString('pt-BR', { maximumFractionDigits: n }); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var TAU = 2 * Math.PI;

  /* ---------------------------------------------------------------
     Peças de diagrama: fio, resistor, fontes, capacitor, indutor
     --------------------------------------------------------------- */
  function fio(g, pts, c) { g.caminho(pts, { cor: c || 'forte', larg: 1.6 }); }
  function no(g, x, y, c) { g.circ(x, y, 0.075, { preenche: c || 'forte', cor: null }); }
  /* resistor em ziguezague entre dois pontos, com rótulo ao lado */
  function resistor(g, x1, y1, x2, y2, rot, c, dx, dy) {
    var L = Math.hypot(x2 - x1, y2 - y1);
    var ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    var m = 0.22;
    fio(g, [[x1, y1], [x1 + ux * m * L, y1 + uy * m * L]], c);
    fio(g, [[x2 - ux * m * L, y2 - uy * m * L], [x2, y2]], c);
    g.mola(x1 + ux * m * L, y1 + uy * m * L, x2 - ux * m * L, y2 - uy * m * L, 5,
      { cor: c || 'forte', larg: 1.8, amp: 0.2 });
    if (rot) g.txt(rot, (x1 + x2) / 2 + (dx || 0), (y1 + y2) / 2 + (dy == null ? 0.52 : dy),
      { cor: c || 'texto', tam: 11.5, negrito: true, fundo: true });
  }
  /* fonte de tensão: círculo com + e − */
  function fonteV(g, x, y, rot, c, vertical) {
    g.circ(x, y, 0.42, { cor: c || 'acento', larg: 1.8, preenche: 'fundo' });
    if (vertical) {
      g.txt('+', x, y + 0.18, { cor: c || 'acento', tam: 12, negrito: true });
      g.txt('−', x, y - 0.2, { cor: c || 'acento', tam: 12, negrito: true });
    } else {
      g.txt('+', x - 0.18, y, { cor: c || 'acento', tam: 12, negrito: true });
      g.txt('−', x + 0.18, y, { cor: c || 'acento', tam: 12, negrito: true });
    }
    if (rot) g.txt(rot, x - 0.72, y, { cor: c || 'acento', tam: 11.5, alin: 'dir', negrito: true });
  }
  /* fonte de corrente: círculo com seta */
  function fonteI(g, x, y, rot, c) {
    g.circ(x, y, 0.42, { cor: c || 'info', larg: 1.8, preenche: 'fundo' });
    g.seta(x, y - 0.26, 0, 0.52, { cor: c || 'info', larg: 1.6, ponta: 0.18 });
    if (rot) g.txt(rot, x - 0.72, y, { cor: c || 'info', tam: 11.5, alin: 'dir', negrito: true });
  }
  function capacitor(g, x, y, rot, c, horiz) {
    var d = 0.13;
    if (horiz) {
      fio(g, [[x - 0.55, y], [x - d, y]], c);
      fio(g, [[x + d, y], [x + 0.55, y]], c);
      g.linha(x - d, y - 0.34, x - d, y + 0.34, { cor: c || 'ok', larg: 2.4 });
      g.linha(x + d, y - 0.34, x + d, y + 0.34, { cor: c || 'ok', larg: 2.4 });
    } else {
      fio(g, [[x, y - 0.55], [x, y - d]], c);
      fio(g, [[x, y + d], [x, y + 0.55]], c);
      g.linha(x - 0.34, y - d, x + 0.34, y - d, { cor: c || 'ok', larg: 2.4 });
      g.linha(x - 0.34, y + d, x + 0.34, y + d, { cor: c || 'ok', larg: 2.4 });
    }
    if (rot) g.txt(rot, x + (horiz ? 0 : 0.6), y + (horiz ? 0.6 : 0),
      { cor: c || 'ok', tam: 11.5, alin: horiz ? 'centro' : 'esq', negrito: true });
  }
  function indutor(g, x, y, rot, c, horiz) {
    var n = 4, r = 0.17, c2 = c || 'aviso';
    if (horiz) {
      fio(g, [[x - 0.7, y], [x - n * r, y]], c);
      fio(g, [[x + n * r, y], [x + 0.7, y]], c);
      for (var i = 0; i < n; i++) g.arco(x - n * r + r * (2 * i + 1), y, r, Math.PI, 0, { cor: c2, larg: 1.8 });
    } else {
      fio(g, [[x, y - 0.7], [x, y - n * r]], c);
      fio(g, [[x, y + n * r], [x, y + 0.7]], c);
      for (var j = 0; j < n; j++) g.arco(x, y - n * r + r * (2 * j + 1), r, -Math.PI / 2, Math.PI / 2, { cor: c2, larg: 1.8 });
    }
    if (rot) g.txt(rot, x + (horiz ? 0 : 0.62), y + (horiz ? 0.62 : 0),
      { cor: c2, tam: 11.5, alin: horiz ? 'centro' : 'esq', negrito: true });
  }
  function terra(g, x, y, c) {
    g.linha(x - 0.3, y, x + 0.3, y, { cor: c || 'fraco', larg: 1.8 });
    g.linha(x - 0.19, y - 0.14, x + 0.19, y - 0.14, { cor: c || 'fraco', larg: 1.5 });
    g.linha(x - 0.08, y - 0.28, x + 0.08, y - 0.28, { cor: c || 'fraco', larg: 1.5 });
  }
  /* eixos simples para os gráficos desenhados dentro da figura */
  function eixos(g, x0, y0, w, h, rx, ry) {
    g.linha(x0, y0, x0 + w, y0, { cor: 'fraco', larg: 1.2 });
    g.linha(x0, y0, x0, y0 + h, { cor: 'fraco', larg: 1.2 });
    if (rx) g.txt(rx, x0 + w, y0 - 0.38, { cor: 'fraco', tam: 10.5, alin: 'dir' });
    if (ry) g.txt(ry, x0 - 0.1, y0 + h + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
  }
  function curva(g, x0, y0, w, h, n, fn, o) {
    var pts = [], i;
    for (i = 0; i <= n; i++) {
      var u = i / n, v = fn(u);
      if (v == null || !isFinite(v)) continue;
      pts.push([x0 + w * u, y0 + h * lim(v, -0.08, 1.08)]);
    }
    if (pts.length > 1) g.caminho(pts, o || { cor: 's1', larg: 2.2 });
    return pts;
  }

  /* ---------- 1.1 — corrente, tensão e a convenção de sinais ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Corrente é carga por segundo; tensão é energia por carga. O produto dos dois é potência — e o sinal desse produto, junto com a convenção adotada, diz se o elemento absorve ou fornece energia.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'V', rot: 'Tensão no elemento', min: -24, max: 24, val: 12, passo: 1, un: 'V' },
      { id: 'I', rot: 'Corrente que entra pelo terminal +', min: -5, max: 5, val: 2, passo: 0.1, un: 'A' }
    ],
    desenhar: function (g, p, t) {
      var P = p.V * p.I;
      var absorve = P > 0;
      var x0 = 1.2, x1 = 6.4, y = 3.4;
      /* o elemento */
      g.ret(3.1, y - 0.72, 1.5, 1.44, { cor: 'forte', larg: 1.8, preenche: 'baixo', alfa: 0.5 });
      g.txt('elemento', 3.85, y, { cor: 'suave', tam: 11.5 });
      fio(g, [[x0, y], [3.1, y]]);
      fio(g, [[4.6, y], [x1, y]]);
      fio(g, [[x0, y], [x0, y - 1.6], [x1, y - 1.6], [x1, y]]);
      /* polaridade */
      g.txt('+', 2.9, y + 0.42, { cor: 'erro', tam: 15, negrito: true });
      g.txt('−', 4.82, y + 0.42, { cor: 's4', tam: 15, negrito: true });
      g.txt('v = ' + fx(p.V, 1) + ' V', 3.85, y + 1.15, { cor: 'texto', tam: 12.5, negrito: true });
      /* corrente: cargas em movimento, no sentido convencional */
      var vel = p.I;
      var n = 7, i;
      for (i = 0; i < n; i++) {
        var fase = (i / n + (vel * t * 0.08)) % 1;
        if (fase < 0) fase += 1;
        g.circ(x0 + (3.1 - x0) * fase, y + 0.26, 0.085, { preenche: 's2', cor: null, alfa: 0.9 });
        g.circ(x1 - (x1 - 4.6) * fase, y + 0.26, 0.085, { preenche: 's2', cor: null, alfa: 0.55 });
      }
      g.seta(1.9, y + 0.72, p.I >= 0 ? 0.8 : -0.8, 0, { cor: 's2', larg: 2, ponta: 0.22 });
      g.txt('i = ' + fx(p.I, 2) + ' A', 2.3, y + 1.15, { cor: 's2', tam: 12.5, negrito: true });
      g.txt('sentido convencional: o das cargas positivas', 3.85, y - 2.2, { cor: 'fraco', tam: 10.5 });
      /* painel de contas */
      var xr = 7.4;
      g.txt('As três grandezas', xr, 5.2, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      [['carga em 1 s: q = i·t', fx(p.I, 2) + ' C'],
       ['elétrons por segundo', fx(Math.abs(p.I) / 1.602e-19 / 1e18, 2) + ' × 10¹⁸'],
       ['energia por carga', fx(p.V, 1) + ' J/C'],
       ['potência p = v·i', fx(P, 2) + ' W'],
       ['energia em 1 min', fx(P * 60, 1) + ' J']].forEach(function (r, k) {
        g.txt(r[0], xr, 4.5 - k * 0.56, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.5 - k * 0.56, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      /* veredito */
      var cor = absorve ? 'erro' : 'ok';
      g.ret(xr - 0.15, 0.55, 4.9, 1.1, { cor: cor, larg: 1.6, preenche: cor, alfa: 0.1 });
      g.txt(absorve ? 'p > 0 · o elemento ABSORVE' : (P === 0 ? 'p = 0 · nada acontece' : 'p < 0 · o elemento FORNECE'),
        xr + 2.35, 1.32, { cor: cor, tam: 12.5, negrito: true });
      g.txt(absorve ? 'convenção passiva satisfeita: é carga' : (P === 0 ? 'tensão ou corrente nula' : 'é fonte neste instante'),
        xr + 2.35, 0.86, { cor: 'suave', tam: 10.5 });
    }
  });

  /* ---------- 2.1 — curvas i–v dos elementos ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A equação constitutiva de cada elemento é uma curva no plano tensão–corrente. O resistor é uma reta pela origem, a fonte de tensão ideal é uma vertical, a fonte de corrente ideal é uma horizontal — e a fonte real é a reta inclinada que liga as duas.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'R', rot: 'Resistência', min: 1, max: 60, val: 12, passo: 1, un: 'Ω' },
      { id: 'Vs', rot: 'Tensão da fonte', min: 4, max: 48, val: 24, passo: 1, un: 'V' },
      { id: 'Rs', rot: 'Resistência interna da fonte real', min: 0, max: 20, val: 4, passo: 0.5, un: 'Ω' }
    ],
    desenhar: function (g, p) {
      var x0 = 1.3, y0 = 0.4, w = 5.6, h = 4.6;
      var Vmax = 50, Imax = 6;
      var X = function (v) { return x0 + w * lim(v, 0, Vmax) / Vmax; };
      var Y = function (i) { return y0 + h * lim(i, 0, Imax) / Imax; };
      eixos(g, x0, y0, w + 0.4, h + 0.4, 'v (V)', 'i (A)');
      var k;
      for (k = 10; k <= 40; k += 10) {
        g.linha(X(k), y0, X(k), y0 + 0.12, { cor: 'fraco', larg: 1 });
        g.txt(String(k), X(k), y0 - 0.3, { cor: 'fraco', tam: 9.5 });
      }
      for (k = 2; k <= 6; k += 2) {
        g.linha(x0, Y(k), x0 + 0.12, Y(k), { cor: 'fraco', larg: 1 });
        g.txt(String(k), x0 - 0.18, Y(k), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      }
      /* resistor: i = v/R */
      var vFim = Math.min(Vmax, Imax * p.R);
      g.caminho([[X(0), Y(0)], [X(vFim), Y(vFim / p.R)]], { cor: 's1', larg: 2.4 });
      g.txt('resistor  i = v/R', X(vFim * 0.78), Y(vFim * 0.78 / p.R) + 0.42, { cor: 's1', tam: 10.5, alin: 'centro', fundo: true });
      /* fonte de tensão ideal: v = Vs */
      g.caminho([[X(p.Vs), Y(0)], [X(p.Vs), Y(Imax)]], { cor: 's3', larg: 2.4, tracejado: [7, 4] });
      g.txt('fonte de tensão ideal', X(p.Vs) + 0.12, Y(Imax * 0.72), { cor: 's3', tam: 10.5, alin: 'esq', fundo: true });
      /* fonte de corrente ideal: i = Is */
      var Is = p.Vs / Math.max(p.Rs, 0.5);
      Is = Math.min(Is, Imax * 0.8);
      g.caminho([[X(0), Y(Is)], [X(Vmax), Y(Is)]], { cor: 's5', larg: 2.2, tracejado: [4, 4] });
      g.txt('fonte de corrente ideal', X(Vmax * 0.55), Y(Is) + 0.32, { cor: 's5', tam: 10.5, alin: 'centro', fundo: true });
      /* fonte real: v = Vs − Rs i */
      var icc = p.Rs > 0 ? p.Vs / p.Rs : Imax;
      g.caminho([[X(p.Vs), Y(0)], [X(Math.max(0, p.Vs - p.Rs * Math.min(icc, Imax))), Y(Math.min(icc, Imax))]],
        { cor: 'erro', larg: 2.6 });
      g.txt('fonte real  v = Vs − Rs·i', X(p.Vs) - 0.3, Y(Math.min(icc, Imax) * 0.55), { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true });
      /* ponto de operação: fonte real alimentando o resistor */
      var iop = p.Vs / (p.Rs + p.R), vop = iop * p.R;
      g.circ(X(vop), Y(iop), 0.13, { preenche: 'texto', cor: null });
      g.txt('ponto de operação', X(vop) + 0.2, Y(iop) - 0.32, { cor: 'texto', tam: 10.5, alin: 'esq', negrito: true, fundo: true });
      /* painel */
      var xr = 7.6;
      g.txt('Fonte real alimentando R', xr, 5.2, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      [['corrente i = Vs/(Rs+R)', fx(iop, 3) + ' A'],
       ['tensão nos terminais', fx(vop, 2) + ' V'],
       ['queda interna Rs·i', fx(iop * p.Rs, 2) + ' V'],
       ['potência na carga', fx(iop * iop * p.R, 2) + ' W'],
       ['perdida dentro da fonte', fx(iop * iop * p.Rs, 2) + ' W'],
       ['rendimento', fx(100 * p.R / (p.R + p.Rs), 1) + ' %']].forEach(function (r, i) {
        g.txt(r[0], xr, 4.5 - i * 0.54, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.5 - i * 0.54, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      g.txt('com Rs = 0 volta a fonte ideal:', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('tensão fixa, qualquer corrente', xr, 0.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
    }
  });

  /* ---------- 3.1 — as duas leis de Kirchhoff ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'A LKC vale num nó: o que entra sai, porque carga não se acumula. A LKT vale num laço fechado: a soma das tensões é zero, porque voltar ao mesmo ponto é voltar ao mesmo potencial.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vs', rot: 'Fonte', min: 6, max: 48, val: 24, passo: 1, un: 'V' },
      { id: 'R2', rot: 'Resistor do ramo do meio', min: 2, max: 60, val: 12, passo: 1, un: 'Ω' },
      { id: 'lei', rot: 'Destacar: 1 LKC · 2 LKT', min: 1, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var R1 = 6, R3 = 6;
      var Rp = CE.par2(p.R2, R3), I = p.Vs / (R1 + Rp);
      var Vp = I * Rp, I2 = Vp / p.R2, I3 = Vp / R3;
      var xa = 1.2, xb = 4.2, xc = 7.0, yt = 4.4, yb = 1.0;
      var lkc = Math.round(p.lei) === 1;
      /* malha esquerda */
      fonteV(g, xa, (yt + yb) / 2, fx(p.Vs, 0) + ' V', 'acento', true);
      fio(g, [[xa, (yt + yb) / 2 + 0.42], [xa, yt]]);
      fio(g, [[xa, (yt + yb) / 2 - 0.42], [xa, yb]]);
      resistor(g, xa, yt, xb, yt, 'R1 = 6 Ω', lkc ? 'forte' : 's1', 0, -0.55);
      fio(g, [[xb, yt], [xc, yt]]);
      resistor(g, xb, yt, xb, yb, 'R2 = ' + fx(p.R2, 0) + ' Ω', lkc ? 'forte' : 's1', 0, -1.85);
      resistor(g, xc, yt, xc, yb, 'R3 = 6 Ω', 'forte', 0, -1.85);
      fio(g, [[xa, yb], [xc, yb]]);
      no(g, xb, yt, lkc ? 'erro' : 'forte');
      no(g, xb, yb, 'forte');
      no(g, xc, yt, 'forte');
      terra(g, xa + 1.2, yb - 0.1);
      /* correntes */
      g.seta(xa + 0.6, yt + 0.35, 0.9, 0, { cor: 's2', larg: 1.8, ponta: 0.2, rot: 'I = ' + fx(I, 3) + ' A', rotDy: 0.38 });
      g.seta(xb + 0.3, yt - 0.5, 0, -0.9, { cor: 's2', larg: 1.8, ponta: 0.2 });
      g.txt('I₂ = ' + fx(I2, 3) + ' A', xb + 0.45, yt - 1.05, { cor: 's2', tam: 10.5, alin: 'esq' });
      g.seta(xc + 0.3, yt - 0.5, 0, -0.9, { cor: 's2', larg: 1.8, ponta: 0.2 });
      g.txt('I₃ = ' + fx(I3, 3) + ' A', xc - 0.45, yt - 1.05, { cor: 's2', tam: 10.5, alin: 'dir' });
      if (lkc) {
        g.circ(xb, yt, 0.42, { cor: 'erro', larg: 2, tracejado: [5, 4] });
        g.txt('nó', xb - 0.5, yt + 0.5, { cor: 'erro', tam: 11, alin: 'dir', negrito: true });
      } else {
        g.caminho([[xa + 0.12, yt - 0.12], [xb - 0.12, yt - 0.12], [xb - 0.12, yb + 0.12], [xa + 0.12, yb + 0.12]],
          { cor: 's1', larg: 2, tracejado: [6, 4], fechar: true });
        g.arco(xb - 1.2, (yt + yb) / 2, 0.55, -Math.PI / 2, Math.PI, { cor: 's1', larg: 1.6, ponta: true });
        g.txt('laço', xb - 1.2, (yt + yb) / 2 - 0.95, { cor: 's1', tam: 11, negrito: true });
      }
      /* painel */
      var xr = 8.3;
      if (lkc) {
        g.txt('LKC no nó destacado', xr, 5.2, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
        [['entra: I', fx(I, 4) + ' A'],
         ['sai: I₂', fx(I2, 4) + ' A'],
         ['sai: I₃', fx(I3, 4) + ' A'],
         ['I − I₂ − I₃', fx(I - I2 - I3, 4) + ' A']].forEach(function (r, i) {
          g.txt(r[0], xr, 4.5 - i * 0.6, { cor: 'fraco', tam: 11, alin: 'esq' });
          g.txt(r[1], 12.3, 4.5 - i * 0.6, { cor: i === 3 ? 'ok' : 'texto', tam: 11.5, alin: 'dir', negrito: true });
        });
        g.txt('a soma fecha em zero: carga', xr, 1.75, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt('não se acumula no nó', xr, 1.35, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt('Σ i = 0', xr + 2, 0.9, { cor: 'erro', tam: 15, negrito: true });
      } else {
        g.txt('LKT no laço destacado', xr, 5.2, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
        [['fonte (subida)', '+' + fx(p.Vs, 2) + ' V'],
         ['queda em R1', '−' + fx(I * R1, 3) + ' V'],
         ['queda em R2', '−' + fx(Vp, 3) + ' V'],
         ['soma do laço', fx(p.Vs - I * R1 - Vp, 4) + ' V']].forEach(function (r, i) {
          g.txt(r[0], xr, 4.5 - i * 0.6, { cor: 'fraco', tam: 11, alin: 'esq' });
          g.txt(r[1], 12.3, 4.5 - i * 0.6, { cor: i === 3 ? 'ok' : 'texto', tam: 11.5, alin: 'dir', negrito: true });
        });
        g.txt('voltar ao mesmo ponto é voltar', xr, 1.75, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt('ao mesmo potencial', xr, 1.35, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt('Σ v = 0', xr + 2, 0.9, { cor: 's1', tam: 15, negrito: true });
      }
    }
  });

  /* ---------- 4.1 — os dois divisores ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Em série a corrente é comum e a tensão se divide na proporção das resistências. Em paralelo a tensão é comum e a corrente se divide na proporção inversa. São os dois atalhos mais usados da análise de circuitos.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vs', rot: 'Fonte', min: 6, max: 48, val: 24, passo: 1, un: 'V' },
      { id: 'Ra', rot: 'R1 (série) e R2 (paralelo) de referência', min: 1, max: 40, val: 8, passo: 1, un: 'Ω' },
      { id: 'Rb', rot: 'R2 (série) e R3 (paralelo)', min: 1, max: 40, val: 16, passo: 1, un: 'Ω' }
    ],
    desenhar: function (g, p) {
      /* divisor de tensão */
      var Rt = p.Ra + p.Rb, I = p.Vs / Rt;
      var V1 = I * p.Ra, V2 = I * p.Rb;
      var xa = 1.1, yt = 4.6, yb = 1.3;
      g.txt('divisor de tensão (série)', 2.8, 5.35, { cor: 's1', tam: 12, negrito: true });
      fonteV(g, xa, (yt + yb) / 2, fx(p.Vs, 0) + ' V', 'acento', true);
      fio(g, [[xa, (yt + yb) / 2 + 0.42], [xa, yt], [2.6, yt]]);
      fio(g, [[xa, (yt + yb) / 2 - 0.42], [xa, yb], [2.6, yb]]);
      resistor(g, 2.6, yt, 2.6, (yt + yb) / 2, 'R1 = ' + fx(p.Ra, 0) + ' Ω', 's1', 1.0, 0);
      resistor(g, 2.6, (yt + yb) / 2, 2.6, yb, 'R2 = ' + fx(p.Rb, 0) + ' Ω', 's1', 1.0, 0);
      no(g, 2.6, (yt + yb) / 2, 'forte');
      g.seta(1.95, yt + 0.3, 0.5, 0, { cor: 's2', larg: 1.6, ponta: 0.18 });
      g.txt('I = ' + fx(I, 3) + ' A', 3.6, yt + 0.32, { cor: 's2', tam: 10.5, alin: 'esq' });
      /* barra de proporção */
      var bx = 0.9, bw = 4.4, by = 0.35;
      g.ret(bx, by, bw * p.Ra / Rt, 0.4, { preenche: 's1', cor: null, alfa: 0.75 });
      g.ret(bx + bw * p.Ra / Rt, by, bw * p.Rb / Rt, 0.4, { preenche: 's3', cor: null, alfa: 0.75 });
      g.txt('V₁ = ' + fx(V1, 2) + ' V', bx + bw * p.Ra / Rt / 2, by + 0.2, { cor: 'fundo', tam: 10, negrito: true });
      g.txt('V₂ = ' + fx(V2, 2) + ' V', bx + bw * p.Ra / Rt + bw * p.Rb / Rt / 2, by + 0.2, { cor: 'fundo', tam: 10, negrito: true });
      /* divisor de corrente */
      var Rp = CE.par2(p.Ra, p.Rb);
      var Ifonte = 3;
      var i2 = Ifonte * p.Rb / (p.Ra + p.Rb), i3 = Ifonte * p.Ra / (p.Ra + p.Rb);
      var xc = 7.6, xd = 10.4;
      g.txt('divisor de corrente (paralelo)', 9.3, 5.35, { cor: 'info', tam: 12, negrito: true });
      fonteI(g, 6.6, (yt + yb) / 2, fx(Ifonte, 0) + ' A', 'info');
      fio(g, [[6.6, (yt + yb) / 2 + 0.42], [6.6, yt], [xd, yt]]);
      fio(g, [[6.6, (yt + yb) / 2 - 0.42], [6.6, yb], [xd, yb]]);
      resistor(g, xc, yt, xc, yb, 'R2', 'info', 0, -1.95);
      resistor(g, xd, yt, xd, yb, 'R3', 'info', 0.7, 0);
      no(g, xc, yt, 'forte'); no(g, xc, yb, 'forte');
      g.txt('V = ' + fx(Ifonte * Rp, 2) + ' V', 9.0, (yt + yb) / 2 + 0.1, { cor: 'suave', tam: 10.5 });
      g.seta(xc - 0.3, yt - 0.5, 0, -0.8, { cor: 's2', larg: 1.6, ponta: 0.18 });
      g.txt(fx(i2, 3) + ' A', xc - 0.45, yt - 1.05, { cor: 's2', tam: 10.5, alin: 'dir' });
      g.seta(xd - 0.3, yt - 0.5, 0, -0.8, { cor: 's2', larg: 1.6, ponta: 0.18 });
      g.txt(fx(i3, 3) + ' A', xd - 0.45, yt - 1.05, { cor: 's2', tam: 10.5, alin: 'dir' });
      var cx = 6.6, cw = 5.2;
      g.ret(cx, by, cw * i2 / Ifonte, 0.4, { preenche: 'info', cor: null, alfa: 0.75 });
      g.ret(cx + cw * i2 / Ifonte, by, cw * i3 / Ifonte, 0.4, { preenche: 's5', cor: null, alfa: 0.75 });
      g.txt('I₂ = ' + fx(i2, 2) + ' A', cx + cw * i2 / Ifonte / 2, by + 0.2, { cor: 'fundo', tam: 10, negrito: true });
      g.txt('I₃ = ' + fx(i3, 2) + ' A', cx + cw * i2 / Ifonte + cw * i3 / Ifonte / 2, by + 0.2, { cor: 'fundo', tam: 10, negrito: true });
      g.txt('o maior resistor fica com a maior tensão… e com a menor corrente', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — a matriz nodal ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A análise nodal escolhe um nó de referência e escreve uma LKC em cada nó restante. Com R3 = 20 Ω o sistema devolve vA = 15 V e vB = 7,5 V — os mesmos números do Exemplo 5.1 e do simulador 2.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vs1', rot: 'Vs1', min: 0, max: 60, val: 24, passo: 1, un: 'V' },
      { id: 'R3', rot: 'R3 (ramo do meio)', min: 1, max: 200, val: 20, passo: 1, un: 'Ω' }
    ],
    desenhar: function (g, p) {
      var R0 = 4, R1 = 5, R2 = 5;
      var A = [[1 / R0 + 1 / p.R3 + 1 / R1, -1 / R1], [-1 / R1, 1 / R1 + 1 / R2]];
      var b = [p.Vs1 / R0, 0];
      var v = CE.resolver(A, b) || [0, 0];
      var xa = 1.1, xA = 3.6, xB = 6.4, yt = 4.5, yb = 1.4;
      fonteV(g, xa, (yt + yb) / 2, fx(p.Vs1, 0) + ' V', 'acento', true);
      fio(g, [[xa, (yt + yb) / 2 + 0.42], [xa, yt]]);
      fio(g, [[xa, (yt + yb) / 2 - 0.42], [xa, yb]]);
      resistor(g, xa, yt, xA, yt, 'R0 = 4 Ω', 'forte', 0, 0.5);
      resistor(g, xA, yt, xB, yt, 'R1 = 5 Ω', 'forte', 0, 0.5);
      resistor(g, xA, yt, xA, yb, 'R3 = ' + fx(p.R3, 0) + ' Ω', 's1', -0.95, 0);
      resistor(g, xB, yt, xB, yb, 'R2 = 5 Ω', 'forte', 0.85, 0);
      fio(g, [[xa, yb], [xB, yb]]);
      no(g, xA, yt, 'erro'); no(g, xB, yt, 'erro');
      g.txt('A', xA, yt + 0.42, { cor: 'erro', tam: 13, negrito: true });
      g.txt('B', xB, yt + 0.42, { cor: 'erro', tam: 13, negrito: true });
      terra(g, (xa + xB) / 2, yb - 0.1);
      g.txt('nó de referência (0 V)', (xa + xB) / 2, yb - 0.75, { cor: 'fraco', tam: 10.5 });
      g.txt('v_A = ' + fx(v[0], 3) + ' V', xA, yt + 1.0, { cor: 'erro', tam: 12, negrito: true, fundo: true });
      g.txt('v_B = ' + fx(v[1], 3) + ' V', xB, yt + 1.0, { cor: 'erro', tam: 12, negrito: true, fundo: true });
      /* a matriz */
      var xr = 7.6, yr = 4.4;
      g.txt('matriz de condutâncias', xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.ret(xr, yr - 1.1, 2.5, 1.5, { cor: 'borda', larg: 1.4, preenche: 'baixo', alfa: 0.4 });
      g.txt(fx(A[0][0], 3), xr + 0.65, yr + 0.05, { cor: 'texto', tam: 11.5, negrito: true });
      g.txt(fx(A[0][1], 3), xr + 1.85, yr + 0.05, { cor: 'suave', tam: 11.5 });
      g.txt(fx(A[1][0], 3), xr + 0.65, yr - 0.7, { cor: 'suave', tam: 11.5 });
      g.txt(fx(A[1][1], 3), xr + 1.85, yr - 0.7, { cor: 'texto', tam: 11.5, negrito: true });
      g.txt('×', xr + 2.75, yr - 0.33, { cor: 'fraco', tam: 13 });
      g.ret(xr + 3.0, yr - 1.1, 0.9, 1.5, { cor: 'borda', larg: 1.4, preenche: 'baixo', alfa: 0.4 });
      g.txt('v_A', xr + 3.45, yr + 0.05, { cor: 'erro', tam: 11.5, negrito: true });
      g.txt('v_B', xr + 3.45, yr - 0.7, { cor: 'erro', tam: 11.5, negrito: true });
      g.txt('=', xr + 4.1, yr - 0.33, { cor: 'fraco', tam: 13 });
      g.txt(fx(b[0], 2), xr + 4.6, yr + 0.05, { cor: 'acento', tam: 11.5, negrito: true });
      g.txt(fx(b[1], 2), xr + 4.6, yr - 0.7, { cor: 'acento', tam: 11.5, negrito: true });
      g.txt('diagonal: soma das condutâncias do nó', xr, 2.4, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('fora dela: menos a condutância entre os nós', xr, 1.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('lado direito: correntes injetadas pelas fontes', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('corrente em R1 = (v_A − v_B)/5 = ' + fx((v[0] - v[1]) / R1, 3) + ' A', xr, 0.8,
        { cor: 's1', tam: 11, alin: 'esq', negrito: true });
    }
  });

  /* ---------- 6.1 — correntes de malha ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Corrente de malha é uma variável auxiliar que circula no laço inteiro. No ramo compartilhado as duas se encontram, e a corrente real é a diferença entre elas — é isso que um amperímetro mediria ali.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vs1', rot: 'Vs1', min: 0, max: 60, val: 24, passo: 1, un: 'V' },
      { id: 'R3', rot: 'R3 (ramo compartilhado)', min: 1, max: 200, val: 20, passo: 1, un: 'Ω' }
    ],
    desenhar: function (g, p) {
      var R0 = 4, R1 = 5, R2 = 5;
      var A = [[R0 + p.R3, -p.R3], [-p.R3, p.R3 + R1 + R2]];
      var b = [p.Vs1, 0];
      var i = CE.resolver(A, b) || [0, 0];
      var xa = 1.1, xA = 4.0, xB = 6.8, yt = 4.5, yb = 1.4;
      fonteV(g, xa, (yt + yb) / 2, fx(p.Vs1, 0) + ' V', 'acento', true);
      fio(g, [[xa, (yt + yb) / 2 + 0.42], [xa, yt]]);
      fio(g, [[xa, (yt + yb) / 2 - 0.42], [xa, yb]]);
      resistor(g, xa, yt, xA, yt, 'R0 = 4 Ω', 'forte', 0, 0.5);
      resistor(g, xA, yt, xB, yt, 'R1 = 5 Ω', 'forte', 0, 0.5);
      resistor(g, xA, yt, xA, yb, 'R3 = ' + fx(p.R3, 0) + ' Ω', 's3', 0, -1.75);
      resistor(g, xB, yt, xB, yb, 'R2 = 5 Ω', 'forte', 0, -1.85);
      fio(g, [[xa, yb], [xB, yb]]);
      no(g, xA, yt, 'forte'); no(g, xA, yb, 'forte');
      terra(g, (xa + xB) / 2 + 1.2, yb - 0.1);
      /* as duas malhas */
      var c1x = (xa + xA) / 2, c2x = (xA + xB) / 2, cy = (yt + yb) / 2;
      g.arco(c1x, cy, 0.78, Math.PI * 0.75, -Math.PI * 1.15, { cor: 's1', larg: 2, ponta: true });
      g.txt('i₁', c1x, cy, { cor: 's1', tam: 15, negrito: true });
      g.txt(fx(i[0], 3) + ' A', c1x, cy - 1.15, { cor: 's1', tam: 11.5, negrito: true, fundo: true });
      g.arco(c2x, cy, 0.78, Math.PI * 0.75, -Math.PI * 1.15, { cor: 's4', larg: 2, ponta: true });
      g.txt('i₂', c2x, cy, { cor: 's4', tam: 15, negrito: true });
      g.txt(fx(i[1], 3) + ' A', c2x, cy - 1.15, { cor: 's4', tam: 11.5, negrito: true, fundo: true });
      /* ramo compartilhado */
      g.seta(xA - 0.45, cy + 0.5, 0, -1.0, { cor: 's3', larg: 2.2, ponta: 0.22 });
      g.txt('i₁ − i₂ = ' + fx(i[0] - i[1], 3) + ' A', xA + 0.5, cy + 1.15, { cor: 's3', tam: 11, alin: 'esq', negrito: true, fundo: true });
      /* painel */
      var xr = 8.1;
      g.txt('LKT em cada malha', xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['(R0+R3) i₁ − R3 i₂', fx(p.Vs1, 1) + ' V'],
       ['−R3 i₁ + (R3+R1+R2) i₂', '0 V'],
       ['', ''],
       ['i₁', fx(i[0], 4) + ' A'],
       ['i₂', fx(i[1], 4) + ' A'],
       ['corrente real em R3', fx(i[0] - i[1], 4) + ' A'],
       ['tensão no ramo do meio', fx((i[0] - i[1]) * p.R3, 4) + ' V']].forEach(function (r, k) {
        if (!r[0]) return;
        g.txt(r[0], xr, 4.5 - k * 0.56, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.5 - k * 0.56, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      g.txt('diagonal: soma das resistências', xr, 0.55, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('fora dela: menos a compartilhada', xr, 0.15, { cor: 'fraco', tam: 10.5, alin: 'esq' });
    }
  });

  /* ---------- 7.1 — transformação de fontes ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Uma fonte de tensão com resistor em série e uma fonte de corrente com resistor em paralelo são indistinguíveis vistas do terminal, desde que Is = Vs/Rs. Nenhuma medida externa separa as duas — mas, por dentro, elas dissipam potências diferentes.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vs', rot: 'Vs', min: 4, max: 48, val: 24, passo: 1, un: 'V' },
      { id: 'Rs', rot: 'Rs', min: 1, max: 40, val: 6, passo: 1, un: 'Ω' },
      { id: 'RL', rot: 'Carga RL', min: 0.5, max: 60, val: 6, passo: 0.5, un: 'Ω' }
    ],
    desenhar: function (g, p) {
      var Is = p.Vs / p.Rs;
      var i = p.Vs / (p.Rs + p.RL), v = i * p.RL;
      var yt = 4.3, yb = 1.6;
      /* versão tensão */
      g.txt('fonte de tensão real', 2.6, 5.35, { cor: 'acento', tam: 12, negrito: true });
      fonteV(g, 1.0, (yt + yb) / 2, fx(p.Vs, 0) + ' V', 'acento', true);
      fio(g, [[1.0, (yt + yb) / 2 + 0.42], [1.0, yt]]);
      fio(g, [[1.0, (yt + yb) / 2 - 0.42], [1.0, yb], [4.3, yb]]);
      resistor(g, 1.0, yt, 3.0, yt, 'Rs = ' + fx(p.Rs, 0) + ' Ω', 'forte', 0, 0.5);
      fio(g, [[3.0, yt], [4.3, yt]]);
      resistor(g, 4.3, yt, 4.3, yb, 'RL', 'ok', 0.7, 0);
      no(g, 4.3, yt, 'forte');
      g.txt('v = ' + fx(v, 2) + ' V', 4.3, yt + 0.55, { cor: 'ok', tam: 11, negrito: true, fundo: true });
      g.txt('i = ' + fx(i, 3) + ' A', 3.6, yb - 0.45, { cor: 's2', tam: 11, negrito: true });
      /* versão corrente */
      g.txt('fonte de corrente real', 8.8, 5.35, { cor: 'info', tam: 12, negrito: true });
      fonteI(g, 6.6, (yt + yb) / 2, fx(Is, 2) + ' A', 'info');
      fio(g, [[6.6, (yt + yb) / 2 + 0.42], [6.6, yt], [10.6, yt]]);
      fio(g, [[6.6, (yt + yb) / 2 - 0.42], [6.6, yb], [10.6, yb]]);
      resistor(g, 8.4, yt, 8.4, yb, 'Rs', 'forte', -0.75, 0);
      resistor(g, 10.6, yt, 10.6, yb, 'RL', 'ok', 0.7, 0);
      no(g, 8.4, yt, 'forte'); no(g, 8.4, yb, 'forte');
      g.txt('v = ' + fx(v, 2) + ' V', 10.6, yt + 0.55, { cor: 'ok', tam: 11, negrito: true, fundo: true });
      g.txt('i = ' + fx(i, 3) + ' A', 9.9, yb - 0.45, { cor: 's2', tam: 11, negrito: true });
      /* comparação */
      g.linha(5.5, 0.9, 5.5, 5.1, { cor: 'borda', larg: 1, tracejado: [5, 5] });
      g.txt('Is = Vs/Rs = ' + fx(p.Vs, 0) + '/' + fx(p.Rs, 0) + ' = ' + fx(Is, 2) + ' A', 6, 0.25,
        { cor: 'texto', tam: 12, negrito: true });
      g.txt('na carga: mesma tensão e mesma corrente nas duas versões', 6, -0.3, { cor: 'suave', tam: 10.5 });
      g.txt('por dentro, não: a de tensão dissipa ' + fx(i * i * p.Rs, 2) + ' W em Rs e a de corrente, '
        + fx(v * v / p.Rs, 2) + ' W', 6, -0.85, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 8.1 — Thévenin e máxima potência ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Qualquer rede linear de dois terminais se reduz a Vth em série com Rth. A potência entregue à carga é máxima quando RL = Rth, e nesse ponto exatamente metade da energia é desperdiçada dentro da própria rede.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vth', rot: 'Vth', min: 2, max: 48, val: 8, passo: 1, un: 'V' },
      { id: 'Rth', rot: 'Rth', min: 1, max: 40, val: 6, passo: 0.5, un: 'Ω' },
      { id: 'RL', rot: 'Carga RL', min: 0.2, max: 60, val: 6, passo: 0.2, un: 'Ω' }
    ],
    desenhar: function (g, p) {
      var r = CE.thevenin(p.Vth, p.Rth, p.RL);
      var yt = 4.4, yb = 2.2;
      fonteV(g, 1.0, (yt + yb) / 2, fx(p.Vth, 0) + ' V', 'acento', true);
      fio(g, [[1.0, (yt + yb) / 2 + 0.42], [1.0, yt]]);
      fio(g, [[1.0, (yt + yb) / 2 - 0.42], [1.0, yb], [4.0, yb]]);
      resistor(g, 1.0, yt, 2.9, yt, 'Rth = ' + fx(p.Rth, 1) + ' Ω', 'forte', 0, 0.5);
      fio(g, [[2.9, yt], [4.0, yt]]);
      resistor(g, 4.0, yt, 4.0, yb, 'RL = ' + fx(p.RL, 1) + ' Ω', 'ok', 0.85, 0);
      no(g, 4.0, yt, 'forte');
      g.caminho([[0.5, yb - 0.5], [3.4, yb - 0.5], [3.4, yt + 1.0], [0.5, yt + 1.0]],
        { cor: 'borda', larg: 1.2, tracejado: [5, 4], fechar: true });
      g.txt('equivalente de Thévenin', 1.95, yt + 1.3, { cor: 'suave', tam: 11 });
      g.txt('i = ' + fx(r.i, 3) + ' A', 3.2, yb - 0.85, { cor: 's2', tam: 11, negrito: true });
      g.txt('v = ' + fx(r.v, 2) + ' V', 4.0, yt + 0.5, { cor: 'ok', tam: 11, negrito: true, fundo: true });
      /* curva de potência */
      var x0 = 6.0, y0 = 1.0, w = 5.9, h = 3.9;
      var Pmax = r.pMax;
      eixos(g, x0, y0, w + 0.3, h + 0.4, 'RL (escala log)', 'P e η');
      var rmin = p.Rth / 30, rmax = p.Rth * 30;
      curva(g, x0, y0, w, h, 120, function (u) {
        var RL = rmin * Math.pow(rmax / rmin, u);
        return Math.pow(p.Vth / (p.Rth + RL), 2) * RL / Pmax;
      }, { cor: 's1', larg: 2.4 });
      curva(g, x0, y0, w, h, 120, function (u) {
        var RL = rmin * Math.pow(rmax / rmin, u);
        return RL / (RL + p.Rth);
      }, { cor: 's3', larg: 1.8, tracejado: [6, 4] });
      var uRth = Math.log(p.Rth / rmin) / Math.log(rmax / rmin);
      g.linha(x0 + w * uRth, y0, x0 + w * uRth, y0 + h, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('RL = Rth', x0 + w * uRth, y0 - 0.3, { cor: 'fraco', tam: 10 });
      var uL = lim(Math.log(p.RL / rmin) / Math.log(rmax / rmin), 0, 1);
      var yP = y0 + h * lim(r.p / Pmax, 0, 1);
      g.circ(x0 + w * uL, yP, 0.13, { preenche: 's1', cor: null });
      g.txt('P = ' + fx(r.p, 3) + ' W', x0 + w * uL + 0.2, yP + 0.3, { cor: 's1', tam: 10.5, alin: 'esq', fundo: true });
      g.circ(x0 + w * uL, y0 + h * r.eta, 0.11, { preenche: 's3', cor: null });
      g.txt('η = ' + fx(100 * r.eta, 1) + ' %', x0 + w * uL + 0.2, y0 + h * r.eta - 0.32, { cor: 's3', tam: 10.5, alin: 'esq', fundo: true });
      g.txt('Pmax = Vth²/4Rth = ' + fx(Pmax, 3) + ' W', x0 + w / 2, y0 + h + 0.75, { cor: 'texto', tam: 11, negrito: true });
      g.txt('potência máxima e rendimento máximo são objetivos diferentes', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — capacitor e indutor ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'O capacitor responde à derivada da tensão e o indutor, à derivada da corrente. Por isso a tensão do capacitor e a corrente do indutor não dão saltos: elas carregam a energia, e energia não muda em tempo nulo.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'elem', rot: 'Elemento: 1 capacitor · 2 indutor', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'f', rot: 'Frequência do sinal', min: 10, max: 200, val: 60, passo: 5, un: 'Hz' },
      { id: 'val', rot: 'C em µF (ou L em mH)', min: 10, max: 500, val: 100, passo: 10 }
    ],
    desenhar: function (g, p, t) {
      var cap = Math.round(p.elem) === 1;
      var w = TAU * p.f;
      var Vp = 10;
      var C = p.val * 1e-6, L = p.val / 1000;
      var Ip = cap ? Vp * w * C : Vp / (w * L);
      /* símbolo */
      if (cap) {
        capacitor(g, 2.0, 4.1, 'C = ' + fx(p.val, 0) + ' µF', 'ok', true);
        g.txt('i = C dv/dt', 2.0, 3.1, { cor: 'ok', tam: 12, negrito: true });
        g.txt('W = ½Cv²', 2.0, 2.6, { cor: 'suave', tam: 11 });
        g.txt('Xc = 1/ωC = ' + fx(1 / (w * C), 1) + ' Ω', 2.0, 2.05, { cor: 'fraco', tam: 10.5 });
        g.txt('a corrente ADIANTA 90°', 2.0, 1.4, { cor: 'ok', tam: 11, negrito: true });
      } else {
        indutor(g, 2.0, 4.1, 'L = ' + fx(p.val, 0) + ' mH', 'aviso', true);
        g.txt('v = L di/dt', 2.0, 3.1, { cor: 'aviso', tam: 12, negrito: true });
        g.txt('W = ½Li²', 2.0, 2.6, { cor: 'suave', tam: 11 });
        g.txt('XL = ωL = ' + fx(w * L, 1) + ' Ω', 2.0, 2.05, { cor: 'fraco', tam: 10.5 });
        g.txt('a corrente ATRASA 90°', 2.0, 1.4, { cor: 'aviso', tam: 11, negrito: true });
      }
      /* gráfico de v, i e energia */
      var x0 = 4.4, y0 = 0.6, gw = 7.4, gh = 4.4;
      var ym = y0 + gh / 2;
      g.linha(x0, ym, x0 + gw, ym, { cor: 'fraco', larg: 1 });
      g.linha(x0, y0, x0, y0 + gh, { cor: 'fraco', larg: 1.2 });
      var ciclos = 2, i, pts1 = [], pts2 = [], pts3 = [];
      var fase = w * t % TAU;
      for (i = 0; i <= 200; i++) {
        var u = i / 200, ang = TAU * ciclos * u - fase;
        var vv = Vp * Math.sin(ang);
        var ii = cap ? Ip * Math.cos(ang) : -Ip * Math.cos(ang);
        var en = cap ? 0.5 * C * vv * vv : 0.5 * L * ii * ii;
        var enMax = cap ? 0.5 * C * Vp * Vp : 0.5 * L * Ip * Ip;
        pts1.push([x0 + gw * u, ym + (gh / 2 - 0.35) * vv / Vp]);
        pts2.push([x0 + gw * u, ym + (gh / 2 - 0.35) * ii / Ip]);
        pts3.push([x0 + gw * u, y0 + 0.1 + (gh * 0.3) * en / enMax]);
      }
      g.caminho(pts1, { cor: 's1', larg: 2.4 });
      g.caminho(pts2, { cor: cap ? 'ok' : 'aviso', larg: 2.4, tracejado: [7, 4] });
      g.caminho(pts3, { cor: 's5', larg: 1.6 });
      g.txt('v(t)', x0 + 0.25, ym + gh / 2 - 0.1, { cor: 's1', tam: 11, alin: 'esq', negrito: true });
      g.txt('i(t)', x0 + 1.3, ym + gh / 2 - 0.1, { cor: cap ? 'ok' : 'aviso', tam: 11, alin: 'esq', negrito: true });
      g.txt('energia armazenada (oscila ao dobro da frequência)', x0 + gw / 2, y0 - 0.25, { cor: 's5', tam: 10 });
      g.txt('valores de pico: v = ' + fx(Vp, 0) + ' V  ·  i = ' + fx(Ip, 3) + ' A  ·  W = '
        + fx((cap ? 0.5 * C * Vp * Vp : 0.5 * L * Ip * Ip) * 1000, 3) + ' mJ',
        x0 + gw / 2, y0 + gh + 0.45, { cor: 'texto', tam: 11, negrito: true });
      g.txt('reatância cai com a frequência no capacitor e sobe no indutor', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — a constante de tempo ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Em 1τ a resposta percorre 63,2 % do caminho que falta, em 3τ já vai em 95,0 % e em 5τ, 99,3 %. A constante de tempo é a única informação que distingue um transitório rápido de um lento.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'R', rot: 'R', min: 0.5, max: 50, val: 10, passo: 0.5, un: 'kΩ' },
      { id: 'C', rot: 'C', min: 1, max: 200, val: 10, passo: 1, un: 'µF' },
      { id: 'Vs', rot: 'Degrau aplicado', min: 1, max: 100, val: 10, passo: 1, un: 'V' }
    ],
    desenhar: function (g, p, t) {
      var R = p.R * 1000, C = p.C * 1e-6, tau = R * C;
      var x0 = 1.1, y0 = 0.9, w = 7.0, h = 3.9;
      var tmax = 6 * tau;
      eixos(g, x0, y0, w + 0.3, h + 0.5, 't', 'v_C');
      /* grade de τ */
      var k;
      for (k = 1; k <= 6; k++) {
        var xk = x0 + w * k / 6;
        g.linha(xk, y0, xk, y0 + h, { cor: 'borda', larg: 1, tracejado: [3, 4] });
        g.txt(k + 'τ', xk, y0 - 0.3, { cor: 'fraco', tam: 10 });
      }
      g.linha(x0, y0 + h, x0 + w, y0 + h, { cor: 'ok', larg: 1.2, tracejado: [5, 4] });
      g.txt(fx(p.Vs, 0) + ' V', x0 + w + 0.1, y0 + h, { cor: 'ok', tam: 10.5, alin: 'esq' });
      /* curva de carga */
      curva(g, x0, y0, w, h, 160, function (u) { return 1 - Math.exp(-6 * u); }, { cor: 's1', larg: 2.6 });
      /* curva de descarga, para comparar */
      curva(g, x0, y0, w, h, 160, function (u) { return Math.exp(-6 * u); }, { cor: 's4', larg: 1.8, tracejado: [6, 4] });
      g.txt('carga', x0 + w * 0.72, y0 + h * 0.93, { cor: 's1', tam: 11, negrito: true, fundo: true });
      g.txt('descarga', x0 + w * 0.72, y0 + h * 0.2, { cor: 's4', tam: 11, negrito: true, fundo: true });
      /* marcas percentuais */
      [[1, 63.2], [2, 86.5], [3, 95.0], [5, 99.3]].forEach(function (m) {
        var xx = x0 + w * m[0] / 6, yy = y0 + h * m[1] / 100;
        g.circ(xx, yy, 0.1, { preenche: 's1', cor: null });
        g.txt(fx(m[1], 1) + ' %', xx + 0.12, yy - 0.3, { cor: 's1', tam: 10, alin: 'esq', fundo: true });
      });
      /* ponto animado */
      var fase = (t * 0.35) % 1.25;
      if (fase < 1) {
        var uu = fase, yy2 = y0 + h * (1 - Math.exp(-6 * uu));
        g.circ(x0 + w * uu, yy2, 0.14, { preenche: 'erro', cor: null });
        g.txt('t = ' + fx(uu * 6 * tau * 1000, 1) + ' ms', x0 + w * uu, yy2 + 0.4,
          { cor: 'erro', tam: 10.5, negrito: true, fundo: true });
      }
      /* painel */
      var xr = 9.0;
      g.txt('Constante de tempo', xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['τ = RC', fx(tau * 1000, 3) + ' ms'],
       ['i(0⁺) = Vs/R', fx(p.Vs / R * 1000, 3) + ' mA'],
       ['carga final q = CVs', fx(C * p.Vs * 1e6, 2) + ' µC'],
       ['energia no capacitor', fx(0.5 * C * p.Vs * p.Vs * 1000, 3) + ' mJ'],
       ['dissipada no resistor', fx(0.5 * C * p.Vs * p.Vs * 1000, 3) + ' mJ'],
       ['transitório (5τ)', fx(5 * tau * 1000, 3) + ' ms']].forEach(function (r, i) {
        g.txt(r[0], xr, 4.5 - i * 0.54, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.5 - i * 0.54, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      g.txt('metade da energia da fonte vira calor', xr, 0.75, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('na carga — e isso não depende de R', xr, 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
    }
  });

  /* ---------- 11.1 — degrau, pulso e impulso ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Estreitando o pulso e mantendo a área constante chega-se ao impulso: amplitude que cresce sem limite, duração que vai a zero e área fixa. É o modelo do chaveamento súbito, e é o que carrega um capacitor instantaneamente.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'larg', rot: 'Largura do pulso', min: 0.05, max: 2, val: 1, passo: 0.05, un: 'ms' },
      { id: 'area', rot: 'Área do pulso (carga injetada)', min: 1, max: 20, val: 10, passo: 1, un: 'µC' },
      { id: 'C', rot: 'Capacitor que recebe a carga', min: 0.1, max: 10, val: 1, passo: 0.1, un: 'µF' }
    ],
    desenhar: function (g, p) {
      var x0 = 1.0, y0 = 2.95, w = 5.0, h = 2.0;
      var A = p.area * 1e-6, dt = p.larg * 1e-3;
      var amp = A / dt;
      var dV = A / (p.C * 1e-6);
      /* degrau unitário */
      g.txt('função degrau u(t)', x0 + w / 2, y0 + h + 0.72, { cor: 's1', tam: 11.5, negrito: true });
      g.linha(x0, y0, x0 + w, y0, { cor: 'fraco', larg: 1 });
      g.caminho([[x0, y0], [x0 + w * 0.35, y0], [x0 + w * 0.35, y0 + h * 0.75], [x0 + w, y0 + h * 0.75]],
        { cor: 's1', larg: 2.4 });
      g.linha(x0 + w * 0.35, y0, x0 + w * 0.35, y0 + h * 0.75, { cor: 's1', larg: 1, tracejado: [3, 3] });
      g.txt('1', x0 - 0.12, y0 + h * 0.75, { cor: 's1', tam: 10.5, alin: 'dir' });
      g.txt('t = 0', x0 + w * 0.35, y0 - 0.32, { cor: 'fraco', tam: 10 });
      g.txt('adimensional: multiplique por V ou por I', x0 + w / 2, y0 + h + 0.3, { cor: 'fraco', tam: 10 });
      /* pulso → impulso */
      var y2 = 0.85, h2 = 1.45;
      g.txt('pulso de área constante', x0 + w / 2, y2 - 0.72, { cor: 'erro', tam: 11.5, negrito: true });
      g.linha(x0, y2, x0 + w, y2, { cor: 'fraco', larg: 1 });
      var ampRel = lim(0.2 / p.larg, 0.06, 1);
      var larg = w * 0.45 * (p.larg / 2);
      g.ret(x0 + w * 0.3, y2, Math.max(0.035, larg), h2 * ampRel,
        { cor: 'erro', larg: 1.6, preenche: 'erro', alfa: 0.25 });
      g.txt('amplitude ' + fx(amp * 1000, 2) + ' mA', x0 + w * 0.3 + Math.max(0.035, larg) + 0.15, y2 + h2 * ampRel,
        { cor: 'erro', tam: 10.5, alin: 'esq', fundo: true });
      g.txt('duração ' + fx(p.larg, 2) + ' ms  ·  área ' + fx(p.area, 1) + ' µC',
        x0 + w / 2, y2 - 0.32, { cor: 'fraco', tam: 10.5 });
      /* painel */
      var xr = 6.8;
      g.txt('Para onde isso vai', xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['área q = i·Δt', fx(p.area, 2) + ' µC'],
       ['amplitude i = q/Δt', fx(amp * 1000, 3) + ' mA'],
       ['Δt → 0 ⇒ i → ∞', 'impulso q·δ(t)'],
       ['salto no capacitor Δv = q/C', fx(dV, 2) + ' V'],
       ['energia entregue', fx(0.5 * p.C * 1e-6 * dV * dV * 1e6, 2) + ' µJ']].forEach(function (r, i) {
        g.txt(r[0], xr, 4.5 - i * 0.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.5 - i * 0.6, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      g.seta(xr + 0.4, 1.72, 1.9, 0, { cor: 's3', larg: 2, ponta: 0.22 });
      g.txt('δ(t)', xr + 2.75, 1.72, { cor: 's3', tam: 16, alin: 'esq', negrito: true });
      g.txt('o impulso é uma ficção útil: nenhuma corrente real é infinita,', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('mas o salto de tensão que ele produz é bem real', xr, 0.65, { cor: 'fraco', tam: 10.5, alin: 'esq' });
    }
  });

  /* ---------- 12.1 — os três regimes e o plano s ---------- */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Em segunda ordem o resistor decide o destino: acima do valor crítico as raízes são reais e a resposta se arrasta; abaixo, elas formam um par complexo e a resposta oscila. O caso crítico é a fronteira, e é o mais rápido sem ultrapassar o alvo.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'R', rot: 'Resistência', min: 5, max: 600, val: 40, passo: 5, un: 'Ω' },
      { id: 'L', rot: 'Indutância', min: 10, max: 500, val: 100, passo: 10, un: 'mH' },
      { id: 'C', rot: 'Capacitância', min: 1, max: 100, val: 10, passo: 1, un: 'µF' }
    ],
    desenhar: function (g, p) {
      var L = p.L / 1000, C = p.C * 1e-6, Vs = 10;
      var o = CE.rlc(p.R, L, C);
      var x0 = 1.0, y0 = 1.1, w = 6.0, h = 3.7;
      var tmax = o.regime === 'sub' ? Math.max(5 / o.alfa, 2.5 * TAU / o.wd)
        : o.regime === 'super' ? 5 / Math.abs(o.s1) : 7 / o.alfa;
      eixos(g, x0, y0, w + 0.3, h + 0.5, 't (ms)', 'v_C');
      g.linha(x0, y0 + h * 0.55, x0 + w, y0 + h * 0.55, { cor: 'ok', larg: 1.2, tracejado: [5, 4] });
      g.txt('Vs', x0 + w + 0.1, y0 + h * 0.55, { cor: 'ok', tam: 10.5, alin: 'esq' });
      curva(g, x0, y0, w, h, 220, function (u) {
        return CE.rlcDegrau(o, Vs, L, tmax * u).v / Vs * 0.55;
      }, { cor: o.regime === 'sub' ? 'erro' : o.regime === 'super' ? 's1' : 's3', larg: 2.6 });
      /* curvas de referência dos outros dois regimes */
      [[o.Rc, 's3', 'crítico'], [o.Rc * 3, 's1', 'super'], [o.Rc * 0.2, 'erro', 'sub']].forEach(function (ref) {
        if (Math.abs(ref[0] - p.R) / p.R < 0.02) return;
        var o2 = CE.rlc(ref[0], L, C);
        curva(g, x0, y0, w, h, 180, function (u) {
          return CE.rlcDegrau(o2, Vs, L, tmax * u).v / Vs * 0.55;
        }, { cor: ref[1], larg: 1, tracejado: [4, 4] });
      });
      g.txt('tmax = ' + fx(tmax * 1000, 2) + ' ms', x0 + w + 0.25, y0 + h + 0.3, { cor: 'fraco', tam: 10, alin: 'dir' });
      g.txt('R = ' + fx(p.R, 0) + ' Ω  ·  R crítico = ' + fx(o.Rc, 1) + ' Ω', x0 + w / 2, y0 + h + 0.75,
        { cor: 'texto', tam: 11.5, negrito: true });
      g.txt(o.regime === 'sub' ? 'subamortecido: oscila' : o.regime === 'super' ? 'superamortecido: arrasta' : 'criticamente amortecido',
        x0 + w / 2, y0 - 0.75, { cor: o.regime === 'sub' ? 'erro' : o.regime === 'super' ? 's1' : 's3', tam: 11.5, negrito: true });
      /* plano s */
      var cx = 10.0, cy = 3.2, raio = 1.75;
      g.linha(cx - 2.3, cy, cx + 1.1, cy, { cor: 'fraco', larg: 1.2 });
      g.linha(cx, cy - 2.0, cx, cy + 2.0, { cor: 'fraco', larg: 1.2 });
      g.txt('Re', cx + 1.15, cy - 0.3, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('Im', cx + 0.15, cy + 2.0, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.arco(cx, cy, raio, Math.PI / 2, Math.PI * 1.5, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      g.txt('|s| = ω₀', cx - raio - 0.1, cy + raio * 0.75, { cor: 'fraco', tam: 10, alin: 'dir' });
      var esc = raio / o.w0;
      if (o.regime === 'sub') {
        g.circ(cx - o.alfa * esc, cy + o.wd * esc, 0.14, { preenche: 'erro', cor: null });
        g.circ(cx - o.alfa * esc, cy - o.wd * esc, 0.14, { preenche: 'erro', cor: null });
        g.linha(cx, cy, cx - o.alfa * esc, cy + o.wd * esc, { cor: 'erro', larg: 1, tracejado: [3, 3] });
        g.txt('par complexo', cx - o.alfa * esc - 0.2, cy + o.wd * esc + 0.3, { cor: 'erro', tam: 10, alin: 'dir' });
      } else {
        var s1 = lim(o.s1 * esc, -2.3, 0), s2 = lim(o.s2 * esc, -2.3, 0);
        g.circ(cx + s1, cy, 0.14, { preenche: o.regime === 'super' ? 's1' : 's3', cor: null });
        g.circ(cx + s2, cy, 0.14, { preenche: o.regime === 'super' ? 's1' : 's3', cor: null });
        g.txt(o.regime === 'super' ? 'duas raízes reais' : 'raiz dupla', cx - 1.1, cy + 0.45,
          { cor: o.regime === 'super' ? 's1' : 's3', tam: 10 });
      }
      g.txt('ζ = ' + fx(o.zeta, 3), cx - 2.3, cy - 2.25, { cor: 'texto', tam: 11, alin: 'esq', negrito: true });
      g.txt('f₀ = ' + fx(o.f0, 1) + ' Hz', cx - 2.3, cy - 2.65, { cor: 'suave', tam: 10.5, alin: 'esq' });
      if (o.regime === 'sub') g.txt('sobressinal ' + fx(100 * o.sobressinal, 1) + ' %', cx - 2.3, cy - 3.05, { cor: 'erro', tam: 10.5, alin: 'esq' });
    }
  });

  /* ---------- 13.1 — o fasor girando ---------- */
  F('#fig-13-1',
    {
      titulo: 'Figura 13.1',
      legenda: 'Um fasor é um vetor que gira a ω rad/s; a senoide do tempo é sua projeção. Como todas as grandezas do circuito giram juntas, o que importa é o ângulo entre elas — e a derivada do tempo vira uma multiplicação por jω.',
      vista: [-0.6, 12.6, -1.4, 5.8],
      altura: 350,
      animar: true,
      controles: [
        { id: 'R', rot: 'R', min: 1, max: 100, val: 30, passo: 1, un: 'Ω' },
        { id: 'L', rot: 'L', min: 1, max: 300, val: 100, passo: 1, un: 'mH' },
        { id: 'f', rot: 'Frequência', min: 10, max: 120, val: 60, passo: 1, un: 'Hz' }
      ],
      desenhar: function (g, p, t) {
        var L = p.L / 1000, X = CE.xl(p.f, L);
        var Z = CE.cx(p.R, X), Zm = CE.cxMod(Z), th = CE.cxFase(Z);
        var V = 220, I = V / Zm;
        var cx = 2.6, cy = 3.0, raio = 2.0;
        var ang = (TAU * t * 0.25) % TAU;
        /* círculo e fasores */
        g.circ(cx, cy, raio, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.linha(cx - raio - 0.4, cy, cx + raio + 0.4, cy, { cor: 'fraco', larg: 1 });
        g.linha(cx, cy - raio - 0.4, cx, cy + raio + 0.4, { cor: 'fraco', larg: 1 });
        g.seta(cx, cy, raio * Math.cos(ang), raio * Math.sin(ang), { cor: 's1', larg: 2.6, ponta: 0.26 });
        g.txt('V', cx + (raio + 0.3) * Math.cos(ang), cy + (raio + 0.3) * Math.sin(ang),
          { cor: 's1', tam: 12, negrito: true });
        var ri = raio * 0.72;
        g.seta(cx, cy, ri * Math.cos(ang - th), ri * Math.sin(ang - th), { cor: 'erro', larg: 2.4, ponta: 0.24 });
        g.txt('I', cx + (ri + 0.3) * Math.cos(ang - th), cy + (ri + 0.3) * Math.sin(ang - th),
          { cor: 'erro', tam: 12, negrito: true });
        g.arco(cx, cy, 0.85, ang - th, ang, { cor: 'suave', larg: 1.4, ponta: true });
        g.txt('θ = ' + fx(th * 180 / Math.PI, 1) + '°', cx + 1.15 * Math.cos(ang - th / 2),
          cy + 1.15 * Math.sin(ang - th / 2), { cor: 'suave', tam: 10.5, fundo: true });
        g.txt('gira a ω = ' + fx(TAU * p.f, 0) + ' rad/s', cx, cy - raio - 0.85, { cor: 'fraco', tam: 10.5 });
        /* projeção no tempo */
        var x0 = 5.6, gw = 6.3, ym = cy + 0.25, amp = raio * 0.86, ampI = ri * 0.86;
        g.linha(x0, ym, x0 + gw, ym, { cor: 'fraco', larg: 1 });
        var pts1 = [], pts2 = [], i;
        for (i = 0; i <= 180; i++) {
          var u = i / 180, a2 = ang - TAU * 1.5 * u;
          pts1.push([x0 + gw * u, ym + amp * Math.sin(a2)]);
          pts2.push([x0 + gw * u, ym + ampI * Math.sin(a2 - th)]);
        }
        g.caminho(pts1, { cor: 's1', larg: 2.2 });
        g.caminho(pts2, { cor: 'erro', larg: 2.2, tracejado: [7, 4] });
        g.linha(cx + raio * Math.cos(ang), cy + raio * Math.sin(ang), x0, ym + amp * Math.sin(ang),
          { cor: 's1', larg: 1, tracejado: [3, 3] });
        g.txt('v(t) = ' + fx(V * Math.SQRT2, 0) + '·sen(ωt)', x0 + gw, ym + amp + 0.4,
          { cor: 's1', tam: 10.5, alin: 'dir' });
        g.txt('i(t) atrasada de θ', x0 + 0.1, ym + amp + 0.4, { cor: 'erro', tam: 10.5, alin: 'esq' });
        /* painel */
        [['X_L = ωL', fx(X, 2) + ' Ω'],
         ['|Z| = √(R²+X²)', fx(Zm, 2) + ' Ω'],
         ['θ = arctg(X/R)', fx(th * 180 / Math.PI, 2) + '°'],
         ['I = V/|Z| (V = 220 V)', fx(I, 3) + ' A']].forEach(function (r, k) {
          g.txt(r[0], 5.9, 0.75 - k * 0.47, { cor: 'fraco', tam: 10.5, alin: 'esq' });
          g.txt(r[1], 12.3, 0.75 - k * 0.47, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
        });
      }
    });

  /* ---------- 14.1 — triângulo de potências e correção ---------- */
  F('#fig-14-1', {
    titulo: 'Figura 14.1',
    legenda: 'P é a potência que faz trabalho, Q é a que só vai e volta, e S é o que a instalação precisa suportar. O capacitor encurta o cateto vertical: a potência ativa não muda, mas a corrente e as perdas caem.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'P', rot: 'Potência ativa da carga', min: 1, max: 50, val: 10, passo: 1, un: 'kW' },
      { id: 'fp1', rot: 'Fator de potência atual', min: 0.5, max: 0.99, val: 0.7, passo: 0.01 },
      { id: 'fp2', rot: 'Fator de potência desejado', min: 0.7, max: 1, val: 0.95, passo: 0.01 },
      { id: 'V', rot: 'Tensão da rede', min: 127, max: 440, val: 220, passo: 1, un: 'V' }
    ],
    desenhar: function (g, p) {
      var P = p.P * 1000, fp1 = p.fp1, fp2 = Math.max(p.fp2, fp1);
      var S1 = P / fp1, Q1 = P * Math.tan(Math.acos(fp1));
      var S2 = P / fp2, Q2 = P * Math.tan(Math.acos(fp2));
      var Qc = Q1 - Q2;
      var C = Qc / (TAU * 60 * p.V * p.V);
      var I1 = S1 / p.V, I2 = S2 / p.V;
      /* triângulo */
      var x0 = 1.0, y0 = 1.2;
      var esc = Math.min(5.4 / (P / 1000), 3.6 / Math.max(Q1 / 1000, 0.1));
      var xp = x0 + esc * P / 1000;
      var yq1 = y0 + esc * Q1 / 1000, yq2 = y0 + esc * Q2 / 1000;
      g.caminho([[x0, y0], [xp, y0], [xp, yq1], [x0, y0]], { cor: 's4', larg: 2.2 });
      g.caminho([[x0, y0], [xp, y0], [xp, yq2], [x0, y0]], { cor: 'ok', larg: 2.4, tracejado: [7, 4] });
      g.linha(xp, yq2, xp, yq1, { cor: 'info', larg: 3.4 });
      g.txt('P = ' + fx(P / 1000, 2) + ' kW', (x0 + xp) / 2, y0 - 0.38, { cor: 'texto', tam: 11.5, negrito: true });
      g.txt('Q₁ = ' + fx(Q1 / 1000, 2) + ' kvar', xp + 0.18, y0 + (yq1 - y0) * 0.82, { cor: 's4', tam: 10.5, alin: 'esq' });
      g.txt('Q₂ = ' + fx(Q2 / 1000, 2) + ' kvar', xp + 0.18, (y0 + yq2) / 2 - 0.25, { cor: 'ok', tam: 10.5, alin: 'esq' });
      g.txt('S₁ = ' + fx(S1 / 1000, 2) + ' kVA', (x0 + xp) / 2 - 0.5, (y0 + yq1) / 2 + 0.45, { cor: 's4', tam: 10.5, alin: 'dir' });
      g.txt('Qc = ' + fx(Qc / 1000, 2) + ' kvar', xp - 0.2, (yq1 + yq2) / 2, { cor: 'info', tam: 11, alin: 'dir', negrito: true, fundo: true });
      g.arco(x0, y0, 0.95, 0, Math.acos(fp1), { cor: 's4', larg: 1.3 });
      g.txt('θ₁ = ' + fx(Math.acos(fp1) * 180 / Math.PI, 1) + '°', x0 + 1.25, y0 + 0.42, { cor: 's4', tam: 10.5, alin: 'esq' });
      g.txt('θ₂ = ' + fx(Math.acos(fp2) * 180 / Math.PI, 1) + '°', x0 + 1.25, y0 - 0.05, { cor: 'ok', tam: 10.5, alin: 'esq' });
      capacitor(g, xp + 1.1, (yq1 + yq2) / 2, fx(C * 1e6, 0) + ' µF', 'info', false);
      /* painel */
      var xr = 8.3;
      g.txt('O que a correção muda', xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['potência ativa P', fx(P / 1000, 2) + ' kW → igual'],
       ['aparente S', fx(S1 / 1000, 2) + ' → ' + fx(S2 / 1000, 2) + ' kVA'],
       ['corrente na linha', fx(I1, 1) + ' → ' + fx(I2, 1) + ' A'],
       ['redução de corrente', fx(100 * (1 - I2 / I1), 1) + ' %'],
       ['perdas na linha (∝ i²)', '−' + fx(100 * (1 - Math.pow(I2 / I1, 2)), 1) + ' %'],
       ['capacitor necessário', fx(C * 1e6, 1) + ' µF']].forEach(function (r, i) {
        g.txt(r[0], xr, 4.5 - i * 0.56, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.5 - i * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      g.txt('o kWh faturado é o mesmo: o capacitor', xr, 0.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('economiza corrente, não energia', xr, 0.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
    }
  });
})();

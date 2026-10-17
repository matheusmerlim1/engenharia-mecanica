/* ============================================================
   Figuras ilustrativas de Engenharia Econômica
   Decisão e fluxo de caixa, juros, taxas, séries, gradientes,
   perpetuidades, amortização, fluxo do projeto, VPL e TIR,
   payback, alternativas, inflação e depreciação.
   Usa a biblioteca window.EE.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.EE) return;
  var F = window.Figura.criar, EE = window.EE;
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var log10 = function (v) { return Math.log(Math.max(v, 1e-12)) / Math.LN10; };

  function fx(v, n) {
    n = n == null ? 1 : n;
    return v.toLocaleString('pt-BR', { maximumFractionDigits: n });
  }
  function din(v, n) {
    n = n == null ? 0 : n;
    return v.toLocaleString('pt-BR', { minimumFractionDigits: n, maximumFractionDigits: n });
  }
  /* eixo de dinheiro: abrevia milhares e milhões para caber no rótulo */
  function kv(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return fx(v / 1e6, 2) + ' M';
    if (a >= 1000) return fx(v / 1000, a >= 1e4 ? 0 : 1) + ' k';
    return fx(v, 0);
  }

  /* ---------- 1.1 — a decisão e o fluxo de caixa ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Toda decisão de engenharia econômica reduz duas alternativas a dois fluxos de caixa e os compara numa mesma data. O diagrama é a ferramenta central: setas para cima são entradas, para baixo são saídas, e o eixo é o tempo.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'IA', rot: 'Investimento da alternativa A', min: 10, max: 400, val: 100, passo: 10, un: 'mil $' },
      { id: 'RA', rot: 'Retorno anual de A', min: 5, max: 150, val: 35, passo: 1, un: 'mil $/ano' },
      { id: 'k', rot: 'Taxa mínima de atratividade', min: 1, max: 40, val: 12, passo: 0.5, un: '% a.a.' }
    ],
    desenhar: function (g, p) {
      var k = p.k / 100, n = 5;
      /* A: investe mais e recebe mais; B: metade do investimento e 60 % do retorno */
      var alts = [
        { nome: 'A — equipamento novo', I: p.IA, R: p.RA, cor: 's1', y: 4.3 },
        { nome: 'B — reformar o atual', I: p.IA * 0.45, R: p.RA * 0.6, cor: 'erro', y: 1.4 }
      ];
      alts.forEach(function (a) {
        var fc = [-a.I], j;
        for (j = 1; j <= n; j++) fc.push(a.R);
        a.vpl = EE.vpl(fc, k);
        a.tir = EE.tir(fc);
      });
      var vmax = Math.max.apply(null, alts.map(function (a) { return Math.max(a.I, a.R); }));
      var gx = 1.0, gw = 5.4;
      var X = function (t) { return gx + gw * t / n; };
      alts.forEach(function (a) {
        g.linha(gx - 0.2, a.y, gx + gw + 0.3, a.y, { cor: 'fraco', larg: 1.4 });
        var j;
        for (j = 0; j <= n; j++) {
          g.linha(X(j), a.y - 0.07, X(j), a.y + 0.07, { cor: 'fraco', larg: 1 });
          g.txt(String(j), X(j), a.y - 0.3, { cor: 'fraco', tam: 9 });
        }
        /* saída no instante zero */
        var hI = 0.95 * a.I / vmax;
        g.seta(X(0), a.y, 0, -hI, { cor: 'erro', larg: 2, ponta: 0.16 });
        /* o valor do investimento fica à esquerda da seta: embaixo colidiria com o eixo seguinte */
        g.txt(din(a.I) + ' k', X(0) - 0.18, a.y - hI / 2, { cor: 'erro', tam: 9.5, alin: 'dir' });
        /* entradas */
        for (j = 1; j <= n; j++) {
          var hR = 0.95 * a.R / vmax;
          g.seta(X(j), a.y, 0, hR, { cor: 'ok', larg: 2, ponta: 0.16 });
        }
        g.txt(din(a.R) + ' k/ano', X(n) + 0.15, a.y + 0.95 * a.R / vmax, { cor: 'ok', tam: 9.5, alin: 'esq' });
        g.txt(a.nome, gx - 0.2, a.y + 1.25, { cor: a.cor, tam: 11.5, alin: 'esq', negrito: true });
      });
      /* comparação */
      var xr = 7.6;
      g.txt('TMA = ' + fx(p.k, 2) + ' % a.a.', xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      alts.forEach(function (a, i) {
        var y0 = 4.4 - i * 1.6;
        g.txt(a.nome.split(' —')[0], xr, y0, { cor: a.cor, tam: 12, alin: 'esq', negrito: true });
        g.txt('VPL = ' + din(a.vpl, 1) + ' mil $', xr + 0.25, y0 - 0.48,
          { cor: a.vpl > 0 ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
        g.txt('TIR = ' + (a.tir === null ? '—' : fx(100 * a.tir, 2) + ' %'), xr + 0.25, y0 - 0.92,
          { cor: 'suave', tam: 11, alin: 'esq' });
      });
      var venc = alts[0].vpl >= alts[1].vpl ? alts[0] : alts[1];
      g.txt('escolha: ' + venc.nome.split(' —')[0], xr, 1.0,
        { cor: venc.cor, tam: 13, alin: 'esq', negrito: true });
      g.txt('maior VPL à TMA adotada', xr, 0.55, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('entradas para cima, saídas para baixo — a convenção vale para o curso inteiro',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — juros simples ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'No regime simples os juros de cada período são sempre calculados sobre o mesmo principal. O montante cresce em linha reta, e o juro de cada período é uma barra de altura constante.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'P', rot: 'Capital aplicado', min: 100, max: 10000, val: 1000, passo: 100, un: '$' },
      { id: 'i', rot: 'Taxa por período', min: 1, max: 25, val: 10, passo: 0.5, un: '%' },
      { id: 'n', rot: 'Períodos', min: 1, max: 20, val: 10, passo: 1 }
    ],
    desenhar: function (g, p) {
      var i = p.i / 100, n = Math.round(p.n);
      var S = p.P * (1 + i * n);
      var gx = 1.2, gw = 6.0, gy = 1.0, gh = 3.9;
      var X = function (t) { return gx + gw * t / n; };
      var Y = function (v) { return gy + gh * lim(v / (S * 1.1), 0, 1); };
      var yy;
      for (yy = 0; yy <= S * 1.1; yy += Math.pow(10, Math.floor(log10(S))) / 2) {
        g.linha(gx, Y(yy), gx + gw, Y(yy), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(yy), gx - 0.15, Y(yy), { cor: 'fraco', tam: 9, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* barras: principal + juros acumulados */
      var k, bw = gw / n * 0.62;
      for (k = 0; k <= n; k++) {
        var hP = Y(p.P) - gy, hJ = Y(p.P * (1 + i * k)) - Y(p.P);
        g.ret(X(k) - bw / 2, gy, bw, hP, { cor: 'fundo', larg: 0.8, preenche: 's4', alfa: 0.75 });
        if (hJ > 0) g.ret(X(k) - bw / 2, Y(p.P), bw, hJ, { cor: 'fundo', larg: 0.8, preenche: 'ok', alfa: 0.75 });
        if (n <= 12 || k % 2 === 0) g.txt(String(k), X(k), gy - 0.3, { cor: 'fraco', tam: 9 });
      }
      g.caminho([[X(0), Y(p.P)], [X(n), Y(S)]], { cor: 'erro', larg: 2.2 });
      g.txt('período', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('montante ($)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.ret(gx + 0.15, gy + gh - 0.3, 0.22, 0.22, { preenche: 's4', cor: null });
      g.txt('principal', gx + 0.5, gy + gh - 0.19, { cor: 's4', tam: 10, alin: 'esq' });
      g.ret(gx + 1.85, gy + gh - 0.3, 0.22, 0.22, { preenche: 'ok', cor: null });
      g.txt('juros acumulados', gx + 2.2, gy + gh - 0.19, { cor: 'ok', tam: 10, alin: 'esq' });
      var xr = 7.9;
      g.txt('S = P(1 + i·n)', xr, 5.2, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      [['principal P', '$ ' + din(p.P, 2)],
       ['juro de cada período', '$ ' + din(p.P * i, 2)],
       ['juros totais J = P·i·n', '$ ' + din(p.P * i * n, 2)],
       ['montante S', '$ ' + din(S, 2)]].forEach(function (r, j) {
        g.txt(r[0], xr, 4.45 - j * 0.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.45 - j * 0.6, { cor: j === 3 ? 'erro' : 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      g.txt('o juro não muda de período para período:', xr, 1.75, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ele nunca entra na base de cálculo', xr, 1.38, { cor: 'suave', tam: 11, alin: 'esq', negrito: true });
      g.txt('por isso o crescimento é linear', xr, 0.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ano comercial: 360 dias · ano civil: 365 dias — a convenção muda o juro de prazo em dias',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — simples contra composto ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'As duas curvas partem do mesmo ponto e se cruzam exatamente em n = 1. Antes disso o regime simples rende mais; depois, o composto abre uma distância que só cresce — e que num prazo longo passa a ser de várias vezes.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'i', rot: 'Taxa por período', min: 1, max: 25, val: 10, passo: 0.5, un: '%' },
      { id: 'n', rot: 'Horizonte', min: 2, max: 60, val: 20, passo: 1, un: 'períodos' },
      { id: 'esc', rot: 'Escala vertical: 0 linear · 1 logarítmica', min: 0, max: 1, val: 0, passo: 1 }
    ],
    desenhar: function (g, p) {
      var i = p.i / 100, n = Math.round(p.n), P = 1000;
      var Sc = P * Math.pow(1 + i, n), Ss = P * (1 + i * n);
      var logy = Math.round(p.esc) === 1;
      var gx = 1.3, gw = 6.2, gy = 1.0, gh = 3.9;
      var X = function (t) { return gx + gw * t / n; };
      var vmax = Sc * 1.08;
      var Y = logy
        ? function (v) { return gy + gh * (log10(Math.max(v, P * 0.9)) - log10(P * 0.9)) / (log10(vmax) - log10(P * 0.9)); }
        : function (v) { return gy + gh * lim(v / vmax, 0, 1); };
      var marcas = [], j;
      if (logy) {
        var e0 = Math.ceil(log10(P * 0.9)), e1 = Math.floor(log10(vmax));
        for (j = e0; j <= e1; j++) marcas.push(Math.pow(10, j));
      } else {
        var passo = Math.pow(10, Math.floor(log10(vmax)));
        for (j = 0; j <= vmax; j += passo) marcas.push(j);
      }
      marcas.forEach(function (v) {
        g.linha(gx, Y(v), gx + gw, Y(v), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(v), gx - 0.15, Y(v), { cor: 'fraco', tam: 9, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var ps = [], pc = [], t;
      for (j = 0; j <= 160; j++) {
        t = n * j / 160;
        ps.push([X(t), Y(P * (1 + i * t))]);
        pc.push([X(t), Y(P * Math.pow(1 + i, t))]);
      }
      g.caminho(ps, { cor: 's4', larg: 2, tracejado: [6, 4] });
      g.caminho(pc, { cor: 's1', larg: 2.6 });
      /* o cruzamento em n = 1 */
      if (n >= 2) {
        g.circ(X(1), Y(P * (1 + i)), 0.12, { cor: 'erro', larg: 2 });
        g.txt('n = 1: iguais', X(1) + 0.18, Y(P * (1 + i)) + 0.35, { cor: 'erro', tam: 10, alin: 'esq', fundo: true });
      }
      g.txt('composto', X(n) - 0.12, Y(Sc) - 0.3, { cor: 's1', tam: 10.5, alin: 'dir', fundo: true });
      g.txt('simples', X(n) - 0.12, Y(Ss) - 0.32, { cor: 's4', tam: 10.5, alin: 'dir', fundo: true });
      [0, Math.round(n / 2), n].forEach(function (tk) {
        g.txt(String(tk), X(tk), gy - 0.3, { cor: 'fraco', tam: 9.5 });
      });
      g.txt('períodos', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('montante de $ 1.000' + (logy ? ' (escala log)' : ''), gx - 0.1, gy + gh + 0.3,
        { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 7.9;
      g.txt('em ' + n + ' períodos a ' + fx(p.i, 2) + ' %', xr, 5.2,
        { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      [['simples: P(1 + i·n)', '$ ' + din(Ss, 2), 's4'],
       ['composto: P(1 + i)ⁿ', '$ ' + din(Sc, 2), 's1'],
       ['diferença', '$ ' + din(Sc - Ss, 2), 'erro'],
       ['razão', fx(Sc / Ss, 3) + ' ×', 'aviso']].forEach(function (r, j) {
        g.txt(r[0], xr, 4.45 - j * 0.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.45 - j * 0.6, { cor: r[2], tam: 11.5, alin: 'dir', negrito: true });
      });
      g.txt('na escala log o composto vira', xr, 1.7, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('uma reta — é uma exponencial', xr, 1.33, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.txt('e o simples é que encurva', xr, 0.96, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('para n < 1 o regime simples rende mais: é por isso que ele sobrevive no curtíssimo prazo',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — taxas nominal, efetiva e contínua ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Uma taxa nominal não diz quanto se paga: é preciso saber quantas vezes por ano ela capitaliza. Quanto mais frequente a capitalização, maior a taxa efetiva — até um teto, a capitalização contínua.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'inom', rot: 'Taxa nominal anual', min: 2, max: 60, val: 24, passo: 1, un: '% a.a.' },
      { id: 'm', rot: 'Capitalizações por ano: 1 · 2 · 4 · 12 · 52 · 365', min: 1, max: 6, val: 4, passo: 1 }
    ],
    desenhar: function (g, p) {
      var inom = p.inom / 100;
      var ms = [1, 2, 4, 12, 52, 365], rot = ['anual', 'semestral', 'trimestral', 'mensal', 'semanal', 'diária'];
      var m = ms[Math.round(p.m) - 1];
      var ief = EE.efetiva(inom, m), icon = EE.continua(inom);
      var gx = 1.4, gw = 5.8, gy = 1.1, gh = 3.8;
      var X = escalaLogX(1, 365, gx, gx + gw);
      var v0 = inom, v1 = icon * 1.04;
      var Y = function (v) { return gy + gh * lim((v - v0 * 0.96) / (v1 - v0 * 0.96), 0, 1); };
      var j, marcas = [];
      for (j = 0; j <= 5; j++) marcas.push(v0 * 0.96 + (v1 - v0 * 0.96) * j / 5);
      marcas.forEach(function (v) {
        g.linha(gx, Y(v), gx + gw, Y(v), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(100 * v, 2) + ' %', gx - 0.15, Y(v), { cor: 'fraco', tam: 9, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], mm;
      for (j = 0; j <= 160; j++) {
        mm = Math.pow(365, j / 160);
        pts.push([X(mm), Y(EE.efetiva(inom, mm))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(gx, Y(icon), gx + gw, Y(icon), { cor: 'erro', larg: 1.8, tracejado: [5, 4] });
      g.txt('contínua: e^i − 1 = ' + fx(100 * icon, 3) + ' %', gx + gw - 0.12, Y(icon) + 0.28,
        { cor: 'erro', tam: 10, alin: 'dir', fundo: true });
      ms.forEach(function (mv, j2) {
        g.circ(X(mv), Y(EE.efetiva(inom, mv)), mv === m ? 0.15 : 0.08,
          { preenche: mv === m ? 'aviso' : 's1', cor: null });
        if (mv === 1 || mv === 12 || mv === 365) {
          g.txt(String(mv), X(mv), gy - 0.3, { cor: 'fraco', tam: 9 });
        }
      });
      g.txt('capitalizações por ano (log)', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('taxa efetiva anual', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 7.7;
      g.txt('nominal ' + fx(p.inom, 2) + ' % a.a.', xr, 5.2, { cor: 'fraco', tam: 12, alin: 'esq' });
      g.txt('capitalização ' + rot[Math.round(p.m) - 1], xr, 4.75, { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('taxa do período', xr, 4.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(fx(100 * inom / m, 4) + ' %', 12.3, 4.05, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('taxa efetiva anual', xr, 3.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(fx(100 * ief, 4) + ' %', 12.3, 3.5, { cor: 'erro', tam: 13, alin: 'dir', negrito: true });
      g.txt('a mais que a nominal', xr, 2.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('+' + fx(100 * (ief - inom), 4) + ' p.p.', 12.3, 2.95, { cor: 'aviso', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('o teto está na capitalização', xr, 2.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('contínua: ' + fx(100 * icon, 3) + ' %', xr, 1.82, { cor: 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('da mensal (' + fx(100 * EE.efetiva(inom, 12), 3) + ' %) à diária', xr, 1.25,
        { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('(' + fx(100 * EE.efetiva(inom, 365), 3) + ' %) ganha-se pouco', xr, 0.9,
        { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('duas taxas são equivalentes quando produzem o mesmo montante no mesmo prazo',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  function escalaLogX(v0, v1, x0, x1) {
    var a = log10(v0), b = log10(v1);
    return function (v) { return x0 + (x1 - x0) * (log10(lim(v, v0, v1)) - a) / (b - a); };
  }

  /* ---------- 5.1 — séries uniformes ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A mesma parcela, três posicionamentos no tempo. A antecipada vale mais porque cada parcela está um período mais perto do presente; a diferida vale menos porque a carência empurra tudo para a frente — e os juros correm nela.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'A', rot: 'Parcela', min: 100, max: 5000, val: 1000, passo: 50, un: '$' },
      { id: 'n', rot: 'Número de parcelas', min: 2, max: 12, val: 6, passo: 1 },
      { id: 'i', rot: 'Taxa por período', min: 0.5, max: 20, val: 5, passo: 0.5, un: '%' },
      { id: 'c', rot: 'Carência da série diferida', min: 1, max: 6, val: 3, passo: 1, un: 'períodos' }
    ],
    desenhar: function (g, p) {
      var i = p.i / 100, n = Math.round(p.n), c = Math.round(p.c);
      var base = p.A * EE.pa(i, n);
      var tipos = [
        { nome: 'postecipada', d: 1, vp: base, cor: 's1' },
        { nome: 'antecipada', d: 0, vp: base * (1 + i), cor: 'ok' },
        { nome: 'diferida (c = ' + c + ')', d: 1 + c, vp: base * Math.pow(1 + i, -c), cor: 'erro' }
      ];
      var tmax = n + c + 1;
      var gx = 1.0, gw = 5.8;
      var X = function (t) { return gx + gw * t / tmax; };
      tipos.forEach(function (t, j) {
        var y = 4.4 - j * 1.6;
        g.linha(gx - 0.15, y, gx + gw + 0.2, y, { cor: 'fraco', larg: 1.3 });
        var q;
        for (q = 0; q <= tmax; q++) g.linha(X(q), y - 0.06, X(q), y + 0.06, { cor: 'fraco', larg: 0.8 });
        for (q = 0; q < n; q++) {
          g.seta(X(q + t.d), y, 0, 0.62, { cor: t.cor, larg: 1.8, ponta: 0.13 });
        }
        g.txt(t.nome, gx - 0.2, y + 0.95, { cor: t.cor, tam: 11, alin: 'esq', negrito: true });
        g.txt('P = ' + din(t.vp, 2), gx + gw + 0.35, y + 0.3,
          { cor: t.cor, tam: 11, alin: 'esq', negrito: true });
        if (j === 2 && c > 0) {
          g.cota(X(0), y - 0.42, X(c), y - 0.42, 'carência', { dy: -0.26 });
        }
      });
      var xr = 8.6;
      g.txt('A = $ ' + din(p.A, 2), xr, 5.2, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(n + ' parcelas a ' + fx(p.i, 2) + ' %', xr, 4.75, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('(P/A, i, n) = ' + fx(EE.pa(i, n), 5), xr, 4.1, { cor: 's1', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('antecipada rende', xr, 3.45, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('+' + fx(p.i, 2) + ' % sobre a postecipada', xr, 3.08, { cor: 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('a carência de ' + c + ' períodos', xr, 2.45, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('custa −' + fx(100 * (1 - Math.pow(1 + i, -c)), 2) + ' %', xr, 2.08,
        { cor: 'erro', tam: 11, alin: 'esq', negrito: true });
      g.txt('soma nominal das parcelas', xr, 1.45, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('$ ' + din(p.A * n, 2), xr, 1.08, { cor: 'suave', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('juros embutidos $ ' + din(p.A * n - base, 2), xr, 0.6, { cor: 'aviso', tam: 11, alin: 'esq' });
      g.txt('a taxa tem de estar no mesmo período das parcelas — converter antes é obrigatório',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — gradientes ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Fluxos reais raramente são uniformes. O gradiente aritmético cresce somando um valor fixo; o geométrico, multiplicando por uma razão fixa — e a diferença entre os dois aparece devagar e depois de uma vez.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'A', rot: 'Primeira parcela', min: 200, max: 5000, val: 1000, passo: 50, un: '$' },
      { id: 'G', rot: 'Gradiente aritmético por período', min: -300, max: 500, val: 200, passo: 10, un: '$' },
      { id: 'gp', rot: 'Gradiente geométrico por período', min: -10, max: 25, val: 8, passo: 0.5, un: '%' },
      { id: 'i', rot: 'Taxa por período', min: 1, max: 25, val: 10, passo: 0.5, un: '%' }
    ],
    desenhar: function (g, p) {
      var i = p.i / 100, n = 10, gg = p.gp / 100;
      var arit = [], geo = [], unif = [], j;
      for (j = 0; j < n; j++) {
        arit.push(p.A + p.G * j);
        geo.push(p.A * Math.pow(1 + gg, j));
        unif.push(p.A);
      }
      var vmax = Math.max.apply(null, arit.concat(geo).concat([p.A])) * 1.15;
      var gx = 1.2, gw = 6.0, gy = 1.1, gh = 3.8;
      var X = function (t) { return gx + gw * (t + 0.5) / n; };
      var Y = function (v) { return gy + gh * lim(v / vmax, 0, 1); };
      var mk = Math.pow(10, Math.floor(log10(vmax)));
      for (j = 0; j <= vmax; j += mk) {
        g.linha(gx, Y(j), gx + gw, Y(j), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(j), gx - 0.15, Y(j), { cor: 'fraco', tam: 9, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var bw = gw / n * 0.3;
      for (j = 0; j < n; j++) {
        g.ret(X(j) - bw - 0.02, gy, bw, Y(arit[j]) - gy, { cor: 'fundo', larg: 0.8, preenche: 's1', alfa: 0.85 });
        g.ret(X(j) + 0.02, gy, bw, Y(geo[j]) - gy, { cor: 'fundo', larg: 0.8, preenche: 'erro', alfa: 0.85 });
        g.txt(String(j + 1), X(j), gy - 0.3, { cor: 'fraco', tam: 9 });
      }
      g.linha(gx, Y(p.A), gx + gw, Y(p.A), { cor: 'fraco', larg: 1.4, tracejado: [5, 4] });
      g.txt('série uniforme', gx + 0.15, Y(p.A) + 0.25, { cor: 'fraco', tam: 9.5, alin: 'esq', fundo: true });
      g.txt('período', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('parcela ($)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var vpA = p.A * EE.pa(i, n) + p.G * EE.pg(i, n);
      var vpG = EE.pGeo(p.A, gg, i, n);
      var vpU = p.A * EE.pa(i, n);
      var xr = 7.9;
      g.txt('valor presente em ' + n + ' períodos', xr, 5.2, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      [['uniforme (G = 0)', vpU, 'fraco'],
       ['aritmético: +$ ' + din(p.G, 0) + '/per.', vpA, 's1'],
       ['geométrico: +' + fx(p.gp, 2) + ' %/per.', vpG, 'erro']].forEach(function (r, j2) {
        g.txt(r[0], xr, 4.5 - j2 * 0.72, { cor: r[2], tam: 10.5, alin: 'esq' });
        g.txt('$ ' + din(r[1], 2), 12.3, 4.5 - j2 * 0.72 - 0.34,
          { cor: r[2], tam: 12, alin: 'dir', negrito: true });
      });
      g.txt('última parcela', xr, 2.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('aritmético $ ' + din(arit[n - 1], 0) + ' · geométrico $ ' + din(geo[n - 1], 0),
        xr, 1.72, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.txt(Math.abs(i - gg) < 0.002
        ? 'atenção: i ≈ g — a fórmula geométrica degenera'
        : 'com i ≠ g vale P = A₁[1 − ((1+g)/(1+i))ⁿ]/(i − g)',
        xr, 1.05, { cor: Math.abs(i - gg) < 0.002 ? 'erro' : 'fraco', tam: 10, alin: 'esq' });
      g.txt('o gradiente aritmético soma; o geométrico multiplica — e no longo prazo isso decide tudo',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — perpetuidade ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Infinitas parcelas somam um valor finito porque as distantes valem quase nada hoje. A soma converge para A/i, e é esse o capital que sustenta a renda para sempre sem nunca ser consumido.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'A', rot: 'Renda por período', min: 10, max: 5000, val: 1000, passo: 10, un: '$' },
      { id: 'i', rot: 'Taxa por período', min: 0.5, max: 20, val: 5, passo: 0.25, un: '%' },
      { id: 'n', rot: 'Parcelas mostradas', min: 10, max: 200, val: 60, passo: 5 }
    ],
    desenhar: function (g, p) {
      var i = p.i / 100, n = Math.round(p.n);
      var lim2 = p.A / i;
      var gx = 1.3, gw = 6.0, gy = 1.1, gh = 3.8;
      var X = function (t) { return gx + gw * t / n; };
      var Y = function (v) { return gy + gh * lim(v / (lim2 * 1.12), 0, 1); };
      var mk = Math.pow(10, Math.floor(log10(lim2))), j;
      for (j = 0; j <= lim2 * 1.12; j += mk) {
        g.linha(gx, Y(j), gx + gw, Y(j), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(j), gx - 0.15, Y(j), { cor: 'fraco', tam: 9, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], ac = 0;
      for (j = 1; j <= n; j++) { ac += p.A / Math.pow(1 + i, j); pts.push([X(j), Y(ac)]); }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(gx, Y(lim2), gx + gw, Y(lim2), { cor: 'erro', larg: 1.8, tracejado: [5, 4] });
      g.txt('A/i = ' + din(lim2, 2), gx + gw - 0.12, Y(lim2) + 0.28,
        { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true, negrito: true });
      [0, Math.round(n / 2), n].forEach(function (tk) {
        g.txt(String(tk), X(tk), gy - 0.3, { cor: 'fraco', tam: 9.5 });
      });
      g.txt('parcelas somadas', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('valor presente acumulado', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 7.9;
      g.txt('P = A / i', xr, 5.2, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('$ ' + din(lim2, 2), xr, 4.65, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('com ' + n + ' parcelas já se chega a', xr, 3.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(fx(100 * ac / lim2, 2) + ' % do limite', xr, 3.58, { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('a parcela nº 100 vale hoje', xr, 2.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('$ ' + din(p.A / Math.pow(1 + i, 100), 2), xr, 2.58, { cor: 'suave', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('custo capitalizado de uma obra', xr, 1.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('CC = I + A/i', xr, 1.52, { cor: 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('é como se avalia ponte, estrada', xr, 1.05, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('e obra pública de vida indefinida', xr, 0.7, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('taxa menor exige capital maior: a 1 % a renda custa cinco vezes o capital de 5 %',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — SAC contra Price ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'No Price a prestação é constante e a composição muda; no SAC a amortização é constante e a prestação cai. O SAC paga menos juros no total — não porque a taxa seja menor, mas porque a dívida é extinta mais depressa.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'P', rot: 'Valor financiado', min: 10, max: 500, val: 100, passo: 10, un: 'mil $' },
      { id: 'i', rot: 'Taxa por período', min: 0.5, max: 15, val: 10, passo: 0.5, un: '%' },
      { id: 'n', rot: 'Parcelas', min: 3, max: 30, val: 5, passo: 1 },
      { id: 'sis', rot: 'Detalhar: 1 Price · 2 SAC', min: 1, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var P = p.P * 1000, i = p.i / 100, n = Math.round(p.n);
      var sis = Math.round(p.sis) === 1 ? 'price' : 'sac';
      var tp = EE.tabela(P, i, n, 'price'), ts = EE.tabela(P, i, n, 'sac');
      var T = sis === 'price' ? tp : ts;
      var vmax = Math.max(ts[0].presta, tp[0].presta) * 1.18;
      var gx = 1.2, gw = 5.9, gy = 1.1, gh = 3.8;
      var X = function (k) { return gx + gw * (k - 0.5) / n; };
      var Y = function (v) { return gy + gh * lim(v / vmax, 0, 1); };
      var mk = Math.pow(10, Math.floor(log10(vmax))), j;
      for (j = 0; j <= vmax; j += mk) {
        g.linha(gx, Y(j), gx + gw, Y(j), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(j), gx - 0.15, Y(j), { cor: 'fraco', tam: 9, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var bw = gw / n * 0.6;
      T.forEach(function (l) {
        g.ret(X(l.k) - bw / 2, gy, bw, Y(l.amort) - gy,
          { cor: 'fundo', larg: 0.8, preenche: 's1', alfa: 0.85 });
        g.ret(X(l.k) - bw / 2, Y(l.amort), bw, Y(l.presta) - Y(l.amort),
          { cor: 'fundo', larg: 0.8, preenche: 'erro', alfa: 0.85 });
        if (n <= 15 || l.k % 2 === 1) g.txt(String(l.k), X(l.k), gy - 0.3, { cor: 'fraco', tam: 9 });
      });
      /* a outra curva, como referência */
      var outra = sis === 'price' ? ts : tp;
      g.caminho(outra.map(function (l) { return [X(l.k), Y(l.presta)]; }),
        { cor: 'aviso', larg: 2, tracejado: [5, 4] });
      g.txt(sis === 'price' ? 'SAC' : 'Price', X(n) + 0.1, Y(outra[n - 1].presta),
        { cor: 'aviso', tam: 10, alin: 'esq', fundo: true });
      g.ret(gx + 0.15, gy + gh - 0.3, 0.22, 0.22, { preenche: 's1', cor: null });
      g.txt('amortização', gx + 0.5, gy + gh - 0.19, { cor: 's1', tam: 10, alin: 'esq' });
      g.ret(gx + 2.1, gy + gh - 0.3, 0.22, 0.22, { preenche: 'erro', cor: null });
      g.txt('juros', gx + 2.45, gy + gh - 0.19, { cor: 'erro', tam: 10, alin: 'esq' });
      g.txt('parcela', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      var totP = tp.reduce(function (s, l) { return s + l.presta; }, 0);
      var totS = ts.reduce(function (s, l) { return s + l.presta; }, 0);
      var xr = 7.6;
      g.txt(sis === 'price' ? 'Price (francês)' : 'SAC', xr, 5.2,
        { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      [['primeira prestação', T[0].presta],
       ['última prestação', T[n - 1].presta],
       ['total pago', T.reduce(function (s, l) { return s + l.presta; }, 0)],
       ['juros totais', T.reduce(function (s, l) { return s + l.presta; }, 0) - P]
      ].forEach(function (r, j2) {
        g.txt(r[0], xr, 4.5 - j2 * 0.58, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt('$ ' + din(r[1], 2), 12.3, 4.5 - j2 * 0.58,
          { cor: j2 === 3 ? 'erro' : 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      g.txt('juros do Price − juros do SAC', xr, 1.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('$ ' + din(totP - totS, 2), xr, 1.55, { cor: 'aviso', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('os dois fluxos descontados a ' + fx(p.i, 2) + ' %', xr, 1.0, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('valem o mesmo: $ ' + din(P, 0), xr, 0.63, { cor: 'ok', tam: 10.5, alin: 'esq', negrito: true });
      g.txt('a soma das amortizações é sempre o principal — é o teste que fecha qualquer tabela',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — o fluxo de caixa do projeto ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'O fluxo econômico mede o que o projeto gera; o econômico-financeiro acrescenta como ele foi financiado. A análise de viabilidade usa o primeiro — misturar os dois é o erro que o teorema da separação adverte.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'rec', rot: 'Receita anual', min: 50, max: 800, val: 300, passo: 10, un: 'mil $' },
      { id: 'cus', rot: 'Custo operacional anual', min: 10, max: 500, val: 140, passo: 10, un: 'mil $' },
      { id: 'dep', rot: 'Depreciação anual', min: 0, max: 200, val: 60, passo: 5, un: 'mil $' },
      { id: 'ir', rot: 'Alíquota de imposto', min: 0, max: 45, val: 30, passo: 1, un: '%' }
    ],
    desenhar: function (g, p) {
      var ir = p.ir / 100;
      var lucroTrib = p.rec - p.cus - p.dep;
      var imposto = Math.max(0, lucroTrib) * ir;
      var fcEcon = lucroTrib - imposto + p.dep;
      var etapas = [
        { r: 'receita', v: p.rec, s: 1, c: 'ok' },
        { r: '− custo operacional', v: -p.cus, s: -1, c: 'erro' },
        { r: '− depreciação', v: -p.dep, s: -1, c: 'aviso' },
        { r: '= lucro tributável', v: lucroTrib, s: 0, c: 's1' },
        { r: '− imposto (' + fx(p.ir, 0) + ' %)', v: -imposto, s: -1, c: 'erro' },
        { r: '+ depreciação (de volta)', v: p.dep, s: 1, c: 'aviso' },
        { r: '= fluxo econômico', v: fcEcon, s: 0, c: 'ok' }
      ];
      var gx = 0.9, bw = 4.6, y0 = 5.0, dy = 0.66;
      etapas.forEach(function (e, j) {
        var y = y0 - j * dy;
        var destaque = e.s === 0;
        if (destaque) g.ret(gx - 0.12, y - 0.24, bw + 2.6, 0.48,
          { cor: null, preenche: e.c, alfa: 0.12 });
        g.txt(e.r, gx, y, { cor: destaque ? e.c : 'fraco', tam: 11, alin: 'esq', negrito: destaque });
        g.txt(din(e.v, 0), gx + bw + 2.3, y,
          { cor: e.c, tam: destaque ? 12.5 : 11, alin: 'dir', negrito: true });
      });
      g.linha(gx - 0.12, y0 - 2.5 * dy - 0.33, gx + bw + 2.5, y0 - 2.5 * dy - 0.33,
        { cor: 'fraco', larg: 1 });
      g.linha(gx - 0.12, y0 - 5.5 * dy - 0.33, gx + bw + 2.5, y0 - 5.5 * dy - 0.33,
        { cor: 'fraco', larg: 1 });
      var xr = 8.4;
      g.txt('por que a depreciação entra', xr, 5.0, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('e sai do mesmo fluxo', xr, 4.62, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ela não é desembolso: não sai', xr, 4.05, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('dinheiro do caixa. Mas reduz o', xr, 3.72, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('lucro tributável, e por isso', xr, 3.39, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('reduz o imposto de verdade.', xr, 3.06, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('economia de imposto', xr, 2.4, { cor: 'aviso', tam: 11, alin: 'esq', negrito: true });
      g.txt(din(p.dep * ir, 1) + ' mil $/ano', xr, 2.02, { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('sem depreciar, o fluxo seria', xr, 1.42, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din((p.rec - p.cus) * (1 - ir), 1) + ' mil $/ano', xr, 1.05,
        { cor: 'suave', tam: 11, alin: 'esq', negrito: true });
      g.txt('teorema da separação: na viabilidade entra só o fluxo econômico, não o financiamento',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — VPL e TIR ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'O perfil do VPL contra a taxa resume a decisão num desenho: onde a curva corta o eixo está a TIR, à esquerda está a faixa viável, e a inclinação diz quanto a decisão depende da taxa adotada.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'I', rot: 'Investimento inicial', min: 50, max: 500, val: 200, passo: 10, un: 'mil $' },
      { id: 'FC', rot: 'Fluxo anual', min: 10, max: 200, val: 75, passo: 5, un: 'mil $/ano' },
      { id: 'n', rot: 'Vida do projeto', min: 2, max: 20, val: 5, passo: 1, un: 'anos' },
      { id: 'k', rot: 'TMA', min: 1, max: 50, val: 15, passo: 0.5, un: '% a.a.' }
    ],
    desenhar: function (g, p) {
      var k = p.k / 100, n = Math.round(p.n);
      var fc = [-p.I], j;
      for (j = 1; j <= n; j++) fc.push(p.FC);
      var VPL = EE.vpl(fc, k), TIR = EE.tir(fc);
      var tmax = Math.max(p.k * 1.8, TIR === null ? 40 : 100 * TIR * 1.5, 25);
      var gx = 1.4, gw = 6.0, gy = 0.9, gh = 4.1;
      var X = function (t) { return gx + gw * t / tmax; };
      var vmaxp = EE.vpl(fc, 0), vminp = EE.vpl(fc, tmax / 100);
      var span = vmaxp - Math.min(vminp, 0);
      var Y = function (v) { return gy + gh * lim((v - Math.min(vminp, 0)) / span, 0, 1); };
      var mk = Math.pow(10, Math.floor(log10(Math.max(vmaxp, 1))));
      for (j = Math.floor(Math.min(vminp, 0) / mk) * mk; j <= vmaxp; j += mk) {
        g.linha(gx, Y(j), gx + gw, Y(j), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(j), gx - 0.15, Y(j), { cor: 'fraco', tam: 9, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], t;
      for (j = 0; j <= 160; j++) { t = tmax * j / 160; pts.push([X(t), Y(EE.vpl(fc, t / 100))]); }
      /* a faixa viável, à esquerda da TIR */
      if (TIR !== null && 100 * TIR <= tmax) {
        var fecho = pts.filter(function (q) { return q[0] <= X(100 * TIR); });
        fecho.push([X(100 * TIR), Y(0)], [X(0), Y(0)]);
        g.caminho(fecho, { cor: null, preenche: 'ok', alfa: 0.12, fechar: true });
      }
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 'forte', larg: 1.6 });
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      g.linha(X(p.k), gy, X(p.k), gy + gh, { cor: 'aviso', larg: 1.8, tracejado: [5, 4] });
      g.txt('TMA', X(p.k), gy + gh + 0.26, { cor: 'aviso', tam: 10.5, negrito: true });
      if (TIR !== null && 100 * TIR <= tmax) {
        g.circ(X(100 * TIR), Y(0), 0.14, { preenche: 'erro', cor: null });
        g.txt('TIR ' + fx(100 * TIR, 2) + ' %', X(100 * TIR), Y(0) - 0.4,
          { cor: 'erro', tam: 10.5, negrito: true, fundo: true });
      }
      g.circ(X(p.k), Y(VPL), 0.13, { preenche: 's1', cor: null });
      [0, tmax / 2, tmax].forEach(function (tk) {
        g.txt(fx(tk, 0), X(tk), gy - 0.3, { cor: 'fraco', tam: 9.5 });
      });
      g.txt('taxa de desconto (% a.a.)', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('VPL (mil $)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 8.1;
      g.txt('VPL à TMA', xr, 5.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(din(VPL, 1) + ' mil $', xr, 4.68, { cor: VPL > 0 ? 'ok' : 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('TIR', xr, 4.0, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(TIR === null ? '—' : fx(100 * TIR, 2) + ' %', xr, 3.6,
        { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt(VPL > 0 ? 'aceitar' : 'rejeitar', xr, 2.9,
        { cor: VPL > 0 ? 'ok' : 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(TIR === null ? '' : (TIR > k ? 'TIR > TMA: os dois critérios' : 'TIR < TMA: os dois critérios'),
        xr, 2.35, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('concordam, como tem de ser', xr, 2.0, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('margem até a TIR', xr, 1.4, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(TIR === null ? '—' : fx(100 * TIR - p.k, 2) + ' p.p.', xr, 1.02,
        { cor: TIR !== null && TIR > k ? 'ok' : 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('num fluxo com uma só inversão de sinal, VPL e TIR nunca se contradizem',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 11.1 — payback ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'O saldo acumulado cruza o zero no payback. Descontado, ele cruza mais tarde — e às vezes não cruza. Nenhuma das duas versões mede rentabilidade: as duas ignoram tudo o que acontece depois da recuperação.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'I', rot: 'Investimento inicial', min: 50, max: 500, val: 200, passo: 10, un: 'mil $' },
      { id: 'FC', rot: 'Fluxo anual', min: 10, max: 200, val: 75, passo: 5, un: 'mil $/ano' },
      { id: 'n', rot: 'Vida do projeto', min: 2, max: 20, val: 8, passo: 1, un: 'anos' },
      { id: 'k', rot: 'TMA', min: 1, max: 40, val: 15, passo: 0.5, un: '% a.a.' }
    ],
    desenhar: function (g, p) {
      var k = p.k / 100, n = Math.round(p.n);
      var fc = [-p.I], j;
      for (j = 1; j <= n; j++) fc.push(p.FC);
      var pb = EE.payback(fc, 0), pbd = EE.payback(fc, k);
      var gx = 1.4, gw = 6.0, gy = 1.0, gh = 3.9;
      var X = function (t) { return gx + gw * t / n; };
      var acN = [], acD = [], an = 0, ad = 0;
      for (j = 0; j <= n; j++) { an += fc[j]; ad += fc[j] / Math.pow(1 + k, j); acN.push(an); acD.push(ad); }
      var vmax = Math.max.apply(null, acN.concat([0])) * 1.12 || 1;
      var vmin = Math.min.apply(null, acD.concat([0])) * 1.12;
      var Y = function (v) { return gy + gh * (v - vmin) / (vmax - vmin); };
      var mk = Math.pow(10, Math.floor(log10(Math.max(vmax, -vmin, 1))));
      for (j = Math.ceil(vmin / mk) * mk; j <= vmax; j += mk) {
        g.linha(gx, Y(j), gx + gw, Y(j), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(kv(j), gx - 0.15, Y(j), { cor: 'fraco', tam: 9, alin: 'dir' });
      }
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 'forte', larg: 1.6 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.caminho(acN.map(function (v, q) { return [X(q), Y(v)]; }),
        { cor: 's4', larg: 1.8, tracejado: [6, 4] });
      g.caminho(acD.map(function (v, q) { return [X(q), Y(v)]; }), { cor: 's1', larg: 2.6 });
      if (pb !== null) {
        g.linha(X(pb), Y(0), X(pb), Y(0) + 0.45, { cor: 's4', larg: 1.4 });
        g.txt(fx(pb, 2), X(pb), Y(0) + 0.68, { cor: 's4', tam: 10, fundo: true });
      }
      if (pbd !== null) {
        g.linha(X(pbd), Y(0), X(pbd), Y(0) - 0.45, { cor: 's1', larg: 1.6 });
        g.txt(fx(pbd, 2), X(pbd), Y(0) - 0.68, { cor: 's1', tam: 10, negrito: true, fundo: true });
      }
      for (j = 0; j <= n; j += Math.max(1, Math.round(n / 8))) {
        g.txt(String(j), X(j), gy - 0.3, { cor: 'fraco', tam: 9.5 });
      }
      g.txt('ano', gx + gw / 2, gy - 0.72, { cor: 'fraco', tam: 10.5 });
      g.txt('saldo acumulado (mil $)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 8.1;
      g.txt('payback simples', xr, 5.1, { cor: 's4', tam: 11, alin: 'esq' });
      g.txt(pb === null ? 'não recupera' : fx(pb, 2) + ' anos', xr, 4.7,
        { cor: 's4', tam: 13, alin: 'esq', negrito: true });
      g.txt('payback descontado', xr, 4.05, { cor: 's1', tam: 11, alin: 'esq' });
      g.txt(pbd === null ? 'não recupera' : fx(pbd, 2) + ' anos', xr, 3.65,
        { cor: pbd === null ? 'erro' : 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('a diferença é o custo', xr, 3.0, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('do capital no período', xr, 2.65, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('VPL em ' + n + ' anos', xr, 2.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(din(EE.vpl(fc, k), 1) + ' mil $', xr, 1.65,
        { cor: EE.vpl(fc, k) > 0 ? 'ok' : 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('tudo que vem depois do', xr, 1.05, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('cruzamento o payback ignora', xr, 0.7, { cor: 'aviso', tam: 10.5, alin: 'esq', negrito: true });
      g.txt('o payback é critério de risco e de liquidez, nunca de rentabilidade',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 12.1 — alternativas com vidas diferentes ---------- */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Comparar durações diferentes pelo valor presente de um ciclo compara serviços diferentes. Repetir até o mínimo múltiplo comum corrige, e o custo anual equivalente chega ao mesmo resultado sem precisar do artifício.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'IA', rot: 'Investimento de A', min: 10, max: 200, val: 50, passo: 5, un: 'mil $' },
      { id: 'CA', rot: 'Custo anual de A', min: 1, max: 60, val: 12, passo: 1, un: 'mil $/ano' },
      { id: 'IB', rot: 'Investimento de B', min: 10, max: 300, val: 80, passo: 5, un: 'mil $' },
      { id: 'k', rot: 'TMA', min: 1, max: 40, val: 12, passo: 0.5, un: '% a.a.' }
    ],
    desenhar: function (g, p) {
      var k = p.k / 100, nA = 3, nB = 6, MMC = 6;
      var CB = 7;
      function fluxo(I, C, n, ate) {
        var fc = [], j;
        for (j = 0; j <= ate; j++) fc.push(j === 0 ? -I : -C);
        for (j = n; j < ate; j += n) fc[j] -= I;
        return fc;
      }
      var vpA1 = -EE.vpl(fluxo(p.IA, p.CA, nA, nA), k);
      var vpB1 = -EE.vpl(fluxo(p.IB, CB, nB, nB), k);
      var vpA = -EE.vpl(fluxo(p.IA, p.CA, nA, MMC), k);
      var vpB = -EE.vpl(fluxo(p.IB, CB, nB, MMC), k);
      var caeA = vpA1 / EE.pa(k, nA), caeB = vpB1 / EE.pa(k, nB);
      /* linha do tempo com a reposição de A */
      var gx = 0.9, gw = 5.4, X = function (t) { return gx + gw * t / MMC; };
      [{ n: 'A (3 anos, repõe em 3)', y: 4.5, c: 's1', ciclo: nA, I: p.IA, C: p.CA },
       { n: 'B (6 anos)', y: 2.6, c: 'erro', ciclo: nB, I: p.IB, C: CB }].forEach(function (a) {
        g.linha(gx - 0.15, a.y, gx + gw + 0.2, a.y, { cor: 'fraco', larg: 1.3 });
        var q;
        for (q = 0; q <= MMC; q++) {
          g.linha(X(q), a.y - 0.06, X(q), a.y + 0.06, { cor: 'fraco', larg: 0.8 });
          g.txt(String(q), X(q), a.y - 0.3, { cor: 'fraco', tam: 8.5 });
        }
        for (q = 1; q <= MMC; q++) g.seta(X(q), a.y, 0, -0.32, { cor: 'aviso', larg: 1.3, ponta: 0.1 });
        for (q = 0; q < MMC; q += a.ciclo) {
          g.seta(X(q), a.y, 0, -0.95, { cor: a.c, larg: 2.2, ponta: 0.16 });
          g.txt(din(a.I, 0), X(q) + 0.1, a.y - 1.08, { cor: a.c, tam: 9, alin: 'esq' });
        }
        g.txt(a.n, gx - 0.15, a.y + 0.55, { cor: a.c, tam: 11, alin: 'esq', negrito: true });
      });
      g.txt('setas pequenas: custo anual · setas grandes: investimento e reposição',
        gx + gw / 2, 0.9, { cor: 'fraco', tam: 9.5 });
      var xr = 7.1;
      g.txt('um ciclo de cada (errado)', xr, 5.2, { cor: 'erro', tam: 11, alin: 'esq', negrito: true });
      g.txt('VP de A em 3 anos', xr, 4.72, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vpA1, 1), 12.3, 4.72, { cor: 's1', tam: 11, alin: 'dir', negrito: true });
      g.txt('VP de B em 6 anos', xr, 4.36, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vpB1, 1), 12.3, 4.36, { cor: 'erro', tam: 11, alin: 'dir', negrito: true });
      g.txt('A parece baratíssimo — mas entrega metade do tempo de serviço',
        xr, 3.92, { cor: 'fraco', tam: 9.5, alin: 'esq' });
      g.txt('repetido até o MMC = 6', xr, 3.35, { cor: 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('VP de A', xr, 2.9, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vpA, 1), 12.3, 2.9, { cor: 's1', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('VP de B', xr, 2.54, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vpB, 1), 12.3, 2.54, { cor: 'erro', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('custo anual equivalente', xr, 1.95, { cor: 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('CAE de A', xr, 1.5, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(caeA, 2) + '/ano', 12.3, 1.5, { cor: 's1', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('CAE de B', xr, 1.14, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(caeB, 2) + '/ano', 12.3, 1.14, { cor: 'erro', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('escolha: ' + (caeA < caeB ? 'A' : 'B'), xr, 0.55,
        { cor: caeA < caeB ? 's1' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('o CAE do ciclo isolado é igual ao da série repetida — por isso ele dispensa o MMC',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 13.1 — inflação e depreciação ---------- */
  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'Descontar fluxos nominais pela taxa nominal e fluxos reais pela taxa real dá exatamente o mesmo VPL. O erro só aparece quando se mistura: fluxo real descontado por taxa nominal subestima o projeto.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'FC', rot: 'Fluxo real anual (moeda de hoje)', min: 10, max: 300, val: 60, passo: 5, un: 'mil $' },
      { id: 'I', rot: 'Investimento inicial', min: 20, max: 500, val: 150, passo: 10, un: 'mil $' },
      { id: 'inom', rot: 'Taxa nominal', min: 2, max: 40, val: 14, passo: 0.5, un: '% a.a.' },
      { id: 'inf', rot: 'Inflação projetada', min: 0, max: 25, val: 4, passo: 0.5, un: '% a.a.' }
    ],
    desenhar: function (g, p) {
      var nom = p.inom / 100, inf = p.inf / 100, real = EE.real(nom, inf), n = 5;
      var fcReal = [-p.I], fcNom = [-p.I], j;
      for (j = 1; j <= n; j++) {
        fcReal.push(p.FC);
        fcNom.push(p.FC * Math.pow(1 + inf, j));
      }
      var vplCerto1 = EE.vpl(fcNom, nom);
      var vplCerto2 = EE.vpl(fcReal, real);
      var vplErrado = EE.vpl(fcReal, nom);
      var gx = 1.1, gw = 5.6, gy = 1.3, gh = 3.5;
      var vmax = Math.max.apply(null, fcNom) * 1.15;
      var X = function (t) { return gx + gw * (t - 0.5) / n; };
      var Y = function (v) { return gy + gh * lim(v / vmax, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var bw = gw / n * 0.3;
      for (j = 1; j <= n; j++) {
        g.ret(X(j) - bw - 0.02, gy, bw, Y(fcReal[j]) - gy,
          { cor: 'fundo', larg: 0.8, preenche: 's1', alfa: 0.85 });
        g.ret(X(j) + 0.02, gy, bw, Y(fcNom[j]) - gy,
          { cor: 'fundo', larg: 0.8, preenche: 'aviso', alfa: 0.85 });
        g.txt(String(j), X(j), gy - 0.3, { cor: 'fraco', tam: 9.5 });
      }
      g.txt('ano', gx + gw / 2, gy - 0.68, { cor: 'fraco', tam: 10.5 });
      g.txt('fluxo (mil $)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.ret(gx + 0.15, gy + gh - 0.28, 0.2, 0.2, { preenche: 's1', cor: null });
      g.txt('real (moeda de hoje)', gx + 0.46, gy + gh - 0.18, { cor: 's1', tam: 9.5, alin: 'esq' });
      g.ret(gx + 2.5, gy + gh - 0.28, 0.2, 0.2, { preenche: 'aviso', cor: null });
      g.txt('nominal (moeda corrente)', gx + 2.81, gy + gh - 0.18, { cor: 'aviso', tam: 9.5, alin: 'esq' });
      var xr = 7.3;
      g.txt('taxa real de Fisher', xr, 5.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('(1+' + fx(p.inom, 2) + '%)/(1+' + fx(p.inf, 2) + '%) − 1 = ' + fx(100 * real, 3) + ' %',
        xr, 4.8, { cor: 'texto', tam: 11, alin: 'esq', negrito: true });
      g.txt('os dois jeitos certos', xr, 4.15, { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('nominal ÷ taxa nominal', xr, 3.72, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vplCerto1, 2), 12.3, 3.72, { cor: 'ok', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('real ÷ taxa real', xr, 3.34, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vplCerto2, 2), 12.3, 3.34, { cor: 'ok', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('diferença entre eles: ' + din(Math.abs(vplCerto1 - vplCerto2), 4),
        xr, 2.92, { cor: 'fraco', tam: 9.5, alin: 'esq' });
      g.txt('o jeito errado', xr, 2.32, { cor: 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('real ÷ taxa nominal', xr, 1.9, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(din(vplErrado, 2), 12.3, 1.9, { cor: 'erro', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('subestima em ' + din(vplCerto1 - vplErrado, 1) + ' mil $', xr, 1.45,
        { cor: 'erro', tam: 10.5, alin: 'esq', negrito: true });
      g.txt('projeto bom pode ser rejeitado', xr, 0.95, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('só por essa inconsistência', xr, 0.6, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('a regra é só uma: seja coerente — ou tudo nominal, ou tudo real',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

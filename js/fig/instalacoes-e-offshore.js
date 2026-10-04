/* ============================================================
   Figuras ilustrativas de Instalações e Offshore
   Produção do campo, evolução das estruturas, movimentos, ondas,
   espectro de mar, Morison, catenária, topsides, risers,
   lançamento de dutos e seleção de conceito.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var G = 9.81, RHO = 1025;

  /* ---------- 1.1 — curva de produção ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'O perfil de produção de um campo: sobe, mantém o platô enquanto os poços aguentam e declina por décadas. A maior parte do volume está na cauda, não no pico (exemplo 1.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Qp', rot: 'Produção no platô', min: 20, max: 300, val: 150, passo: 10, un: 'mil bpd' },
      { id: 'tp', rot: 'Duração do platô', min: 1, max: 10, val: 4, passo: 0.5, un: 'anos' },
      { id: 'D', rot: 'Declínio anual', min: 5, max: 25, val: 12, passo: 1, un: '%' }
    ],
    desenhar: function (g, p) {
      var Qp = p.Qp * 1000, tp = p.tp, D = p.D / 100, tr = 1.5;
      function Q(t) {
        if (t < tr) return Qp * t / tr;
        if (t < tr + tp) return Qp;
        return Qp * Math.exp(-D * (t - tr - tp));
      }
      var Nplato = Qp * 365 * (tp + tr / 2), Ncauda = Qp * 365 / D;
      var N = Nplato + Ncauda;
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var X = function (t) { return gx + gw * lim(t, 0, 30) / 30; };
      var Y = function (q) { return gy + gh * lim(q / (Qp * 1.15), 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 150; i++) { var t = 30 * i / 150; pts.push([X(t), Y(Q(t))]); }
      g.caminho(pts.concat([[X(30), gy], [gx, gy]]), { cor: 's1', larg: 2.8, preenche: 's1', alfa: 0.18, fechar: true });
      g.linha(X(tr + tp), gy, X(tr + tp), Y(Qp), { cor: 'aviso', larg: 1.2, tracejado: [4, 3] });
      g.txt('fim do platô', X(tr + tp) + 0.12, Y(Qp) - 0.3, { cor: 'aviso', tam: 10, alin: 'esq' });
      [5, 10, 15, 20, 25, 30].forEach(function (t) {
        g.linha(X(t), gy, X(t), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(t + '', X(t), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.25, 0.5, 0.75, 1].forEach(function (f) {
        g.linha(gx, Y(Qp * f), gx - 0.14, Y(Qp * f), { cor: 'fraco', larg: 1 });
        g.txt(fx(Qp * f / 1000, 0), gx - 0.26, Y(Qp * f), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('anos de produção', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('mil bpd', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6;
      g.txt('pico de ' + fx(Qp / 1000, 0) + ' mil bpd', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('platô de ' + fx(tp, 1) + ' anos', xr, 4.4, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('no platô: ' + fx(Nplato / 1e6, 0) + ' Mbbl', xr, 3.7, { cor: 's1', tam: 12.5, alin: 'esq' });
      g.txt('na cauda: ' + fx(Ncauda / 1e6, 0) + ' Mbbl', xr, 3.1, { cor: 'aviso', tam: 12.5, alin: 'esq' });
      g.txt('reserva ≈ ' + fx(N / 1e6, 0) + ' Mbbl', xr, 2.3, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt(fx(100 * Ncauda / N, 0) + ' % do volume vem do declínio', xr, 1.6, { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('é a cauda que paga a unidade e o custo operacional', xr, 1.0, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('rampa de 1,5 ano · declínio exponencial a partir do fim do platô', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — evolução das estruturas ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Cada faixa de lâmina d\'água tem suas soluções viáveis: a jaqueta fixa para no limite em que o peso e o momento na base ficam impagáveis, e dali em diante só flutuante.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'lda', rot: 'Lâmina d\'água', min: 20, max: 3000, val: 1500, passo: 10, un: 'm' }
    ],
    desenhar: function (g, p) {
      var lda = p.lda;
      var tipos = [
        { nome: 'jaqueta fixa', a: 0, b: 400, cor: 's4' },
        { nome: 'torre complacente', a: 300, b: 900, cor: 'aviso' },
        { nome: 'TLP', a: 300, b: 1500, cor: 'ok' },
        { nome: 'spar', a: 500, b: 2500, cor: 's3' },
        { nome: 'semissubmersível', a: 300, b: 3000, cor: 's1' },
        { nome: 'FPSO', a: 100, b: 3000, cor: 'erro' }
      ];
      var gx = 2.9, gy = 0.9, gw = 4.2, gh = 4.1;
      var Y = function (d) { return gy + gh * (1 - lim(d, 0, 3000) / 3000); };
      g.ret(gx, Y(3000), gw, Y(0) - Y(3000), { preenche: 's1', cor: null, alfa: 0.05 });
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 's1', larg: 2 });
      g.txt('superfície', gx - 0.15, Y(0), { cor: 's1', tam: 10, alin: 'dir' });
      var i;
      tipos.forEach(function (t, k) {
        var xx = gx + 0.25 + k * (gw - 0.5) / 5.4;
        g.ret(xx, Y(t.b), 0.5, Y(t.a) - Y(t.b), { cor: 'fundo', larg: 1, preenche: t.cor, alfa: lda >= t.a && lda <= t.b ? 0.8 : 0.22 });
      });
      tipos.forEach(function (t, k) {
        var xx = gx + 0.25 + k * (gw - 0.5) / 5.4;
        var vi = lda >= t.a && lda <= t.b;
        g.txt(t.nome, xx + 0.25, Y(t.b) + 0.3 + (k % 2) * 0.42, { cor: vi ? t.cor : 'fraco', tam: 9.5, fundo: true });
      });
      g.linha(gx - 0.1, Y(lda), gx + gw + 0.1, Y(lda), { cor: 'erro', larg: 1.8, tracejado: [5, 4] });
      g.txt(fx(lda, 0) + ' m', gx - 0.2, Y(lda), { cor: 'erro', tam: 12, alin: 'dir', negrito: true });
      [500, 1000, 1500, 2000, 2500, 3000].forEach(function (d) {
        g.linha(gx + gw, Y(d), gx + gw + 0.12, Y(d), { cor: 'fraco', larg: 1 });
        g.txt(fx(d, 0), gx + gw + 0.2, Y(d), { cor: 'fraco', tam: 9.5, alin: 'esq' });
      });
      g.txt('profundidade (m)', gx + gw / 2, gy + gh + 0.3, { cor: 'fraco', tam: 11 });
      var viaveis = tipos.filter(function (t) { return lda >= t.a && lda <= t.b; });
      var xr = 8.6;
      g.txt('em ' + fx(lda, 0) + ' m', xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('conceitos viáveis:', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var yy = 3.8;
      viaveis.forEach(function (t) { g.txt('· ' + t.nome, xr, yy, { cor: t.cor, tam: 11.5, alin: 'esq' }); yy -= 0.48; });
      if (!viaveis.length) g.txt('nenhum conceito usual', xr, yy, { cor: 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt(lda < 400 ? 'faixa em que a fixa ainda compete' : 'só flutuante: a jaqueta ficaria impagável',
        xr, yy - 0.3, { cor: lda < 400 ? 'ok' : 'aviso', tam: 11, alin: 'esq', negrito: true });
      g.txt('o pré-sal brasileiro está entre 1500 e 2500 m', xr, yy - 0.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('faixas típicas de aplicação — há exceções em cada tipo', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — graus de liberdade ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Os seis graus de liberdade de um flutuante. O heave é o que limita riser e guindaste — e é nele que os tipos mais diferem: o da TLP é quase nulo, o do FPSO é o do próprio navio.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Unidade: 1 FPSO · 2 semi · 3 TLP · 4 spar', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'Hs', rot: 'Altura significativa de onda', min: 1, max: 8, val: 3, passo: 0.5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var t = Math.round(p.tipo), Hs = p.Hs;
      var dados = [
        { nome: 'FPSO', heave: 0.55, roll: 2.5, arv: 'molhada', cor: 'erro' },
        { nome: 'semissubmersível', heave: 0.28, roll: 1.2, arv: 'molhada', cor: 's1' },
        { nome: 'TLP', heave: 0.02, roll: 0.3, arv: 'seca', cor: 'ok' },
        { nome: 'spar', heave: 0.12, roll: 0.8, arv: 'seca', cor: 's3' }
      ][t - 1];
      var heave = dados.heave * Hs, roll = dados.roll * Hs / 3;
      var cx = 2.9, cy = 2.9;
      g.linha(cx - 2.2, cy, cx + 2.2, cy, { cor: 's1', larg: 1.6, tracejado: [6, 4] });
      g.ret(cx - 1.2, cy - 0.25, 2.4, 0.85, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.6 });
      g.ret(cx - 0.5, cy + 0.6, 1.0, 0.45, { cor: 'forte', larg: 1.6, preenche: 'acento', alfa: 0.4 });
      g.seta(cx, cy + 1.5, 0, 0.7, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.seta(cx, cy + 1.5, 0, -0.7, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.txt('heave', cx + 0.15, cy + 1.85, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.seta(cx + 1.9, cy + 0.2, 0.7, 0, { cor: 's4', larg: 2, ponta: 0.2 });
      g.seta(cx + 1.9, cy + 0.2, -0.7, 0, { cor: 's4', larg: 2, ponta: 0.2 });
      g.txt('surge', cx + 1.9, cy + 0.5, { cor: 's4', tam: 10.5 });
      g.arco(cx - 1.9, cy + 0.2, 0.55, -0.6, 0.6, { cor: 'aviso', ponta: true, larg: 1.8 });
      g.txt('roll / pitch', cx - 1.9, cy + 1.0, { cor: 'aviso', tam: 10.5 });
      g.txt(dados.nome, cx, cy - 0.75, { cor: dados.cor, tam: 12.5, negrito: true });
      g.txt('6 graus: surge, sway, heave, roll, pitch e yaw', cx, cy - 1.3, { cor: 'fraco', tam: 10 });
      /* barras de heave comparadas */
      var bx = 6.9, by = 1.0, bw = 0.7, bh = 3.0;
      var maxh = 0.55 * 8;
      [0, 1, 2, 3].forEach(function (k) {
        var d = [{ n: 'FPSO', h: 0.55 }, { n: 'semi', h: 0.28 }, { n: 'TLP', h: 0.02 }, { n: 'spar', h: 0.12 }][k];
        var hh = bh * (d.h * Hs) / maxh;
        g.ret(bx + k * 1.05, by, bw, hh, { cor: 'fundo', larg: 1, preenche: k === t - 1 ? 'erro' : 's4', alfa: k === t - 1 ? 0.85 : 0.35 });
        g.txt(fx(d.h * Hs, 2), bx + k * 1.05 + bw / 2, by + hh + 0.26, { cor: 'texto', tam: 10 });
        g.txt(d.n, bx + k * 1.05 + bw / 2, by - 0.35, { cor: 'suave', tam: 9.5 });
      });
      g.txt('heave (m) com Hs = ' + fx(Hs, 1) + ' m', bx + 1.8, by + bh + 0.75, { cor: 'fraco', tam: 11 });
      g.txt('árvore de natal: ' + dados.arv, bx, by - 0.95, { cor: dados.arv === 'seca' ? 'ok' : 'suave', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('amplitudes típicas, proporcionais a Hs — o valor real vem do RAO de cada unidade', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — teoria de ondas ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'A relação de dispersão decide tudo: em água profunda as órbitas são círculos que somem com a profundidade; em água rasa elas se achatam em elipses e a onda freia (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Período', min: 4, max: 18, val: 10, passo: 0.5, un: 's' },
      { id: 'd', rot: 'Lâmina d\'água', min: 5, max: 400, val: 20, passo: 5, un: 'm' },
      { id: 'H', rot: 'Altura da onda', min: 0.5, max: 10, val: 3, passo: 0.5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var T = p.T, d = p.d, H = p.H;
      var w = 2 * Math.PI / T, k = w * w / G;
      for (var it = 0; it < 60; it++) k = w * w / (G * Math.tanh(k * d));
      var L = 2 * Math.PI / k, L0 = G * T * T / (2 * Math.PI), c = L / T;
      var dL = d / L, E = RHO * G * H * H / 8;
      var regime = dL > 0.5 ? 'águas profundas' : dL < 0.05 ? 'águas rasas' : 'águas intermediárias';
      var gx = 0.9, gy = 0.9, gw = 5.8, gh = 3.6;
      var ysup = gy + gh * 0.78;
      g.linha(gx, gy, gx + gw, gy, { cor: 'forte', larg: 2.2 });
      g.hachura(gx, gy - 0.04, gw, 0, { cor: 'forte', d: 0.22 });
      /* janela fixa de 300 m: mostra quantos comprimentos de onda cabem nela */
      var i, pts = [], janela = 300, amp = 0.22 + 0.38 * (H / 10);
      for (i = 0; i <= 200; i++) {
        var x2 = janela * i / 200;
        pts.push([gx + gw * x2 / janela, ysup + amp * Math.cos(2 * Math.PI * x2 / L)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.4 });
      g.txt('janela de 300 m na superfície', gx + gw / 2, ysup + 0.75, { cor: 'fraco', tam: 10 });
      /* órbitas */
      for (i = 1; i <= 4; i++) {
        var z = -d * i / 5;
        var a = (H / 2) * Math.cosh(k * (z + d)) / Math.sinh(k * d);
        var b = (H / 2) * Math.sinh(k * (z + d)) / Math.sinh(k * d);
        var esc = 0.45 / Math.max(H / 2, 0.5);
        var yy = ysup + (gy - ysup) * (-z / d);
        var o = [], j;
        for (j = 0; j <= 30; j++) {
          var th = 2 * Math.PI * j / 30;
          o.push([gx + gw * 0.5 + a * esc * Math.cos(th), yy + b * esc * Math.sin(th)]);
        }
        g.caminho(o, { cor: 's3', larg: 1.4, fechar: true });
      }
      g.txt('órbitas das partículas', gx + gw * 0.5, gy + 0.3, { cor: 's3', tam: 10, fundo: true });
      var xr = 7.3;
      g.txt('L₀ = gT²/2π = ' + fx(L0, 1) + ' m', xr, 5.0, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('L = ' + fx(L, 1) + ' m', xr, 4.3, { cor: 's1', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('celeridade c = ' + fx(c, 2) + ' m/s', xr, 3.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('d/L = ' + fx(dL, 3) + ' — ' + regime, xr, 3.0,
        { cor: dL > 0.5 ? 'ok' : dL < 0.05 ? 'erro' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('E = ρgH²/8 = ' + fx(E / 1000, 1) + ' kJ/m²', xr, 2.3, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('o fundo já ' + (dL > 0.5 ? 'não interfere' : 'freia a onda'), xr, 1.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('dobrar H quadruplica a energia', xr, 1.0, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('teoria linear de Airy · ω² = g k tanh(kd) resolvido por iteração', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.2 — espectro de mar ---------- */
  F('#fig-4-2', {
    titulo: 'Figura 4.2',
    legenda: 'Um estado de mar não é uma onda: é um espectro. A altura significativa sai da área sob a curva, e é essa estatística — não uma onda isolada — que alimenta o projeto.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Hs', rot: 'Altura significativa Hs', min: 1, max: 12, val: 4, passo: 0.5, un: 'm' },
      { id: 'Tp', rot: 'Período de pico Tp', min: 5, max: 18, val: 10, passo: 0.5, un: 's' }
    ],
    desenhar: function (g, p) {
      var Hs = p.Hs, Tp = p.Tp, wp = 2 * Math.PI / Tp;
      function S(w) {
        if (w < 0.05) return 0;
        return (5 / 16) * Hs * Hs * Math.pow(wp, 4) / Math.pow(w, 5) * Math.exp(-1.25 * Math.pow(wp / w, 4));
      }
      var m0 = 0, dw = 0.002, i;
      for (var ww = 0.08; ww < 4; ww += dw) m0 += S(ww) * dw;
      var Hsr = 4 * Math.sqrt(m0), Hmax = 1.86 * Hs, Tz = 0.71 * Tp;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var topo = S(wp) * 1.15;
      var X = function (w) { return gx + gw * lim(w, 0, 2.2) / 2.2; };
      var Y = function (v) { return gy + gh * lim(v / topo, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [];
      for (i = 0; i <= 140; i++) { var w2 = 2.2 * i / 140; pts.push([X(w2), Y(S(w2))]); }
      g.caminho(pts.concat([[X(2.2), gy], [gx, gy]]), { cor: 's1', larg: 2.6, preenche: 's1', alfa: 0.2, fechar: true });
      g.linha(X(wp), gy, X(wp), Y(S(wp)), { cor: 'erro', larg: 1.4, tracejado: [4, 3] });
      g.txt('ω_p = ' + fx(wp, 2) + ' rad/s', X(wp) + 0.12, Y(S(wp)) + 0.3, { cor: 'erro', tam: 10.5, alin: 'esq' });
      [0.5, 1, 1.5, 2].forEach(function (w3) {
        g.linha(X(w3), gy, X(w3), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(w3, 1), X(w3), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('frequência angular (rad/s)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('S(ω)  (m²·s)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4;
      g.txt('área sob a curva', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('m₀ = ' + fx(m0, 3) + ' m²', xr, 4.4, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('Hs = 4√m₀ = ' + fx(Hsr, 2) + ' m', xr, 3.7, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('período de zero ascendente', xr, 3.0, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('Tz ≈ ' + fx(Tz, 1) + ' s', xr, 2.5, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('onda máxima provável em 3 h', xr, 1.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('≈ ' + fx(Hmax, 1) + ' m', xr, 1.3, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('quase o dobro de Hs', xr, 0.75, { cor: 'aviso', tam: 11, alin: 'esq', negrito: true });
      g.txt('espectro de Pierson-Moskowitz · a integral devolve exatamente o Hs de entrada', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — Morison ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Arrasto e inércia estão defasados de 90°: o máximo da força total nunca é a soma dos dois máximos. O KC diz qual parcela manda (exemplo 5.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'D', rot: 'Diâmetro do membro', min: 0.1, max: 4, val: 1, passo: 0.1, un: 'm' },
      { id: 'um', rot: 'Velocidade máxima da partícula', min: 0.2, max: 4, val: 2, passo: 0.1, un: 'm/s' },
      { id: 'T', rot: 'Período da onda', min: 4, max: 18, val: 10, passo: 0.5, un: 's' }
    ],
    desenhar: function (g, p) {
      var D = p.D, um = p.um, T = p.T, CD = 1.0, CM = 2.0;
      var w = 2 * Math.PI / T, udot = w * um;
      var Fd = 0.5 * RHO * CD * D * um * um;
      var Fi = RHO * CM * Math.PI * D * D / 4 * udot;
      var KC = um * T / D;
      function ft(ph) {
        var u = um * Math.cos(ph), ud = -udot * Math.sin(ph);
        return 0.5 * RHO * CD * D * Math.abs(u) * u + RHO * CM * Math.PI * D * D / 4 * ud;
      }
      var Fmax = 0, phmax = 0;
      for (var i = 0; i <= 720; i++) { var ph = 2 * Math.PI * i / 720, v = Math.abs(ft(ph)); if (v > Fmax) { Fmax = v; phmax = ph; } }
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var topo = Math.max(Fd, Fi) * 1.3;
      var X = function (ph) { return gx + gw * ph / (2 * Math.PI); };
      var Y = function (v) { return gy + gh * (v / (2 * topo) + 0.5); };
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var a = [], b = [], c = [];
      for (i = 0; i <= 180; i++) {
        var p2 = 2 * Math.PI * i / 180;
        var u = um * Math.cos(p2), ud = -udot * Math.sin(p2);
        a.push([X(p2), Y(0.5 * RHO * CD * D * Math.abs(u) * u)]);
        b.push([X(p2), Y(RHO * CM * Math.PI * D * D / 4 * ud)]);
        c.push([X(p2), Y(ft(p2))]);
      }
      g.caminho(a, { cor: 's3', larg: 1.8, tracejado: [5, 4] });
      g.caminho(b, { cor: 'aviso', larg: 1.8, tracejado: [2, 3] });
      g.caminho(c, { cor: 's1', larg: 2.8 });
      g.circ(X(phmax), Y(ft(phmax)), 0.15, { preenche: 'erro', cor: null });
      g.txt('arrasto', X(0.1), Y(Fd) + 0.28, { cor: 's3', tam: 10, alin: 'esq', fundo: true });
      g.txt('inércia', X(4.9), Y(Fi * 0.95) + 0.28, { cor: 'aviso', tam: 10, alin: 'esq', fundo: true });
      g.txt('total', X(3.1), Y(ft(3.1)) - 0.3, { cor: 's1', tam: 10.5, fundo: true });
      [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI].forEach(function (ph, k) {
        g.linha(X(ph), Y(0) - 0.12, X(ph), Y(0) + 0.12, { cor: 'fraco', larg: 1 });
        g.txt(['0', 'T/4', 'T/2', '3T/4', 'T'][k], X(ph), gy - 0.3, { cor: 'fraco', tam: 10 });
      });
      g.txt('tempo dentro do ciclo', gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 11 });
      g.txt('força por metro (N/m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6;
      g.txt('KC = u T/D = ' + fx(KC, 1), xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt(KC < 5 ? 'inércia domina' : KC > 25 ? 'arrasto domina' : 'as duas parcelas contam',
        xr, 4.35, { cor: KC < 5 ? 'aviso' : KC > 25 ? 's3' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('arrasto máximo ' + fx(Fd, 0) + ' N/m', xr, 3.6, { cor: 's3', tam: 12, alin: 'esq' });
      g.txt('inércia máxima ' + fx(Fi, 0) + ' N/m', xr, 3.0, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt('força máxima real', xr, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Fmax, 0) + ' N/m', xr, 1.75, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('contra ' + fx(Fd + Fi, 0) + ' N/m se somassem', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('C_D = 1,0 e C_M = 2,0 · válido para membro esbelto (D/L < 0,2)', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — catenária ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Na ancoragem em catenária o peso da linha é a mola: quanto mais a unidade se afasta, mais linha sai do fundo e maior a restauração (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'h', rot: 'Lâmina d\'água', min: 100, max: 3000, val: 1000, passo: 50, un: 'm' },
      { id: 'H', rot: 'Tração horizontal', min: 200, max: 4000, val: 1500, passo: 50, un: 'kN' },
      { id: 'w', rot: 'Peso submerso da linha', min: 200, max: 2500, val: 980, passo: 20, un: 'N/m' }
    ],
    desenhar: function (g, p) {
      var h = p.h, H = p.H * 1000, w = p.w;
      var aa = H / w;                                  /* parâmetro da catenária */
      var T = H + w * h, s = Math.sqrt(h * h + 2 * h * aa);
      var xh = aa * Math.acosh(1 + h / aa);            /* projeção horizontal do trecho suspenso */
      var ang = Math.atan(w * h / H) * 180 / Math.PI;
      var gx = 0.9, gy = 1.0, gw = 5.9, gh = 3.8;
      var escala = Math.max(xh * 1.25, h * 1.2);
      var X = function (x) { return gx + gw * lim(x, 0, escala) / escala; };
      var Y = function (y) { return gy + gh * lim(y, 0, escala * gh / gw * 1.6) / (escala * gh / gw * 1.6); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'forte', larg: 2 });
      g.hachura(gx, gy - 0.04, gw, 0, { cor: 'forte', d: 0.22 });
      g.linha(gx, Y(h), gx + gw, Y(h), { cor: 's1', larg: 1.6, tracejado: [6, 4] });
      var i, pts = [];
      for (i = 0; i <= 80; i++) {
        var x = xh * i / 80;
        pts.push([X(x), Y(aa * (Math.cosh(x / aa) - 1))]);
      }
      g.caminho(pts, { cor: 'erro', larg: 2.6 });
      g.linha(X(0), gy, X(0) - 0.001, gy, { cor: 'erro', larg: 2.6 });
      g.circ(X(0), gy, 0.12, { preenche: 'texto', cor: null });
      g.txt('âncora', X(0) + 0.12, gy + 0.3, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.ret(X(xh) - 0.45, Y(h), 0.9, 0.35, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.7 });
      g.txt('unidade', X(xh), Y(h) + 0.55, { cor: 'suave', tam: 10.5 });
      g.cota(gx + 0.15, gy, gx + 0.15, Y(h), fx(h, 0) + ' m', { dx: 0.55, dy: 0 });
      var xr = 7.3;
      g.txt('parâmetro a = H/w = ' + fx(aa, 0) + ' m', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T = H + w h', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T = ' + fx(T / 1000, 0) + ' kN', xr, 3.8, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('no fairlead, a ' + fx(ang, 1) + '° da horizontal', xr, 3.15, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('comprimento suspenso', xr, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('s = ' + fx(s, 0) + ' m', xr, 1.95, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('projeção horizontal ' + fx(xh, 0) + ' m', xr, 1.35, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('peso próprio: ' + fx(100 * w * h / T, 0) + ' % da tração no topo', xr, 0.75,
        { cor: w * h / T > 0.5 ? 'aviso' : 'fraco', tam: 11, alin: 'esq', negrito: true });
      g.txt('catenária com fundo horizontal e linha homogênea', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — processamento primário ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'O separador divide o que o poço entrega em três correntes. O que impressiona é o limite da água descartada: poucas dezenas de quilos de óleo por dia em milhares de metros cúbicos (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Q', rot: 'Líquido produzido', min: 5, max: 80, val: 20, passo: 1, un: 'mil bpd' },
      { id: 'bsw', rot: 'BSW na entrada', min: 0, max: 95, val: 40, passo: 1, un: '%' },
      { id: 'rgo', rot: 'Razão gás-óleo', min: 50, max: 500, val: 200, passo: 10, un: 'm³/m³' }
    ],
    desenhar: function (g, p) {
      var Q = p.Q * 1000, bsw = p.bsw / 100, rgo = p.rgo;
      var oleo = Q * (1 - bsw), agua = Q * bsw;
      var oleom3 = oleo * 0.159, aguam3 = agua * 0.159;
      var gas = oleom3 * rgo;
      var limite = 29;                                  /* mg/L de óleo na água */
      var arraste = aguam3 * 1000 * limite / 1e6;       /* kg/dia */
      var sx = 1.4, sy = 2.1, sw = 3.4, sh = 1.5;
      g.ret(sx, sy, sw, sh, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.5 });
      g.ret(sx, sy, sw, sh * 0.42, { cor: null, preenche: 's1', alfa: 0.35 });
      g.ret(sx, sy, sw, sh * 0.42 * (bsw > 0 ? bsw : 0.001), { cor: null, preenche: 's3', alfa: 0.5 });
      g.txt('separador trifásico', sx + sw / 2, sy - 0.35, { cor: 'suave', tam: 11 });
      g.seta(sx - 1.1, sy + sh * 0.6, 0.85, 0, { cor: 'erro', larg: 2.4, ponta: 0.2 });
      g.txt(fx(Q / 1000, 0) + ' mil bpd', sx - 1.15, sy + sh * 0.6 + 0.3, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.seta(sx + sw / 2, sy + sh, 0, 0.75, { cor: 's4', larg: 2.2, ponta: 0.2 });
      g.txt('gás ' + fx(gas / 1e6, 2) + ' MM m³/d', sx + sw / 2, sy + sh + 1.05, { cor: 's4', tam: 10.5 });
      g.seta(sx + sw, sy + sh * 0.6, 0.8, 0, { cor: 's1', larg: 2.2, ponta: 0.2 });
      g.txt('óleo ' + fx(oleo / 1000, 1) + ' mil bpd', sx + sw + 0.9, sy + sh * 0.6, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.seta(sx + sw, sy + sh * 0.18, 0.8, 0, { cor: 's3', larg: 2.2, ponta: 0.2 });
      g.txt('água ' + fx(aguam3, 0) + ' m³/d', sx + sw + 0.9, sy + sh * 0.18, { cor: 's3', tam: 10.5, alin: 'esq' });
      var bx = 1.4, by = 0.8, bw = 3.4;
      g.ret(bx, by, bw * (1 - bsw), 0.4, { cor: 'fundo', larg: 1, preenche: 's1', alfa: 0.7 });
      g.ret(bx + bw * (1 - bsw), by, bw * bsw, 0.4, { cor: 'fundo', larg: 1, preenche: 's3', alfa: 0.7 });
      g.txt('BSW ' + fx(p.bsw, 0) + ' %', bx + bw + 0.15, by + 0.2, { cor: 'suave', tam: 10.5, alin: 'esq' });
      var xr = 7.6;
      g.txt('óleo ' + fx(oleo / 1000, 1) + ' mil bpd', xr, 5.0, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('= ' + fx(oleom3, 0) + ' m³/dia', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('água ' + fx(aguam3, 0) + ' m³/dia', xr, 3.7, { cor: 's3', tam: 13, alin: 'esq', negrito: true });
      g.txt('gás ' + fx(gas / 1e6, 2) + ' milhões de m³/dia', xr, 3.0, { cor: 's4', tam: 12, alin: 'esq' });
      g.txt('limite de óleo na água: ' + limite + ' mg/L', xr, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('arraste admissível ' + fx(arraste, 1) + ' kg/dia', xr, 1.7, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('menos de ' + fx(arraste / 136, 1) + ' barril de óleo por dia', xr, 1.05, { cor: 'aviso', tam: 11, alin: 'esq', negrito: true });
      g.txt('1 bbl = 0,159 m³ · limite de média mensal da resolução de descarte', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — configurações de riser ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'A configuração do riser decide quanto do movimento da unidade chega ao ponto de toque: a catenária livre transmite tudo, a lazy wave desacopla com flutuadores.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'conf', rot: 'Riser: 1 vertical · 2 catenária · 3 lazy', min: 1, max: 3, val: 2, passo: 1 },
      { id: 'h', rot: 'Lâmina d\'água', min: 200, max: 3000, val: 1500, passo: 50, un: 'm' },
      { id: 'w', rot: 'Peso submerso do riser', min: 200, max: 2000, val: 800, passo: 20, un: 'N/m' }
    ],
    desenhar: function (g, p) {
      var conf = Math.round(p.conf), h = p.h, w = p.w;
      var gx = 1.0, gy = 1.0, gw = 5.4, gh = 3.9;
      var X = function (f) { return gx + gw * f; }, Y = function (f) { return gy + gh * f; };
      g.linha(gx, Y(1), gx + gw, Y(1), { cor: 's1', larg: 1.6, tracejado: [6, 4] });
      g.linha(gx, gy, gx + gw, gy, { cor: 'forte', larg: 2 });
      g.hachura(gx, gy - 0.04, gw, 0, { cor: 'forte', d: 0.22 });
      g.ret(X(0.72) - 0.45, Y(1), 0.9, 0.35, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.7 });
      var i, pts = [], Ttopo, nome, fad;
      if (conf === 1) {
        for (i = 0; i <= 20; i++) pts.push([X(0.72), Y(i / 20)]);
        Ttopo = w * h / 1000; nome = 'riser rígido vertical'; fad = 'exige tensionador no topo';
      } else if (conf === 2) {
        var aa = 0.45;
        for (i = 0; i <= 60; i++) {
          var f = i / 60;
          pts.push([X(0.18 + 0.54 * f), Y(Math.pow(f, 2.1))]);
        }
        Ttopo = w * h * 1.35 / 1000; nome = 'catenária livre (SCR)'; fad = 'fadiga concentrada no touchdown';
      } else {
        for (i = 0; i <= 80; i++) {
          var f2 = i / 80;
          var y = Math.pow(f2, 2.3) + 0.22 * Math.exp(-Math.pow((f2 - 0.45) / 0.16, 2));
          pts.push([X(0.12 + 0.60 * f2), Y(Math.min(y, 1))]);
        }
        Ttopo = w * h * 1.15 / 1000; nome = 'lazy wave'; fad = 'flutuadores desacoplam o movimento';
        for (i = 0; i < 5; i++) {
          var ff = 0.36 + i * 0.045;
          var yy = Math.pow(ff, 2.3) + 0.22 * Math.exp(-Math.pow((ff - 0.45) / 0.16, 2));
          g.circ(X(0.12 + 0.60 * ff), Y(Math.min(yy, 1)), 0.11, { preenche: 'aviso', cor: null });
        }
      }
      g.caminho(pts, { cor: 'erro', larg: 2.6 });
      if (conf !== 1) {
        g.circ(pts[0][0], pts[0][1], 0.13, { preenche: 's3', cor: null });
        g.txt('touchdown', pts[0][0] + 0.15, gy + 0.3, { cor: 's3', tam: 10, alin: 'esq' });
      }
      g.cota(gx + 0.15, gy, gx + 0.15, Y(1), fx(h, 0) + ' m', { dx: 0.5, dy: 0 });
      var xr = 7.0;
      g.txt(nome, xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('peso suspenso ≈ ' + fx(w * h / 1000, 0) + ' kN', xr, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('tração no topo ≈ ' + fx(Ttopo, 0) + ' kN', xr, 3.6, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt(fad, xr, 2.9, { cor: conf === 3 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(conf === 1 ? 'usada com unidade de pouco heave' :
        conf === 2 ? 'simples e barata, limitada por fadiga' : 'mais cara, resolve a fadiga',
        xr, 2.2, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('em 1500 m o riser carrega sobretudo', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('o próprio peso — daí os flexíveis', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('trações estimadas a partir do peso submerso suspenso', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — lançamento de dutos ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'No lançamento, o duto curva duas vezes: no stinger e perto do fundo. A tração de topo controla o raio do sagbend — e é por isso que ela é o parâmetro mais vigiado da operação.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'met', rot: 'Método: 1 S-lay · 2 J-lay', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'h', rot: 'Lâmina d\'água', min: 50, max: 3000, val: 500, passo: 50, un: 'm' },
      { id: 'Tt', rot: 'Tração de topo', min: 200, max: 3000, val: 1000, passo: 50, un: 'kN' }
    ],
    desenhar: function (g, p) {
      var slay = Math.round(p.met) === 1, h = p.h, Tt = p.Tt * 1000;
      var w = 1500, D = 0.4, E = 207e9;
      var R = Tt / w;                                   /* raio no sagbend */
      var eps = D / (2 * R) * 100;                      /* deformação, % */
      var limite = 0.25;
      var gx = 0.9, gy = 1.0, gw = 5.6, gh = 3.8;
      g.linha(gx, gy, gx + gw, gy, { cor: 'forte', larg: 2 });
      g.hachura(gx, gy - 0.04, gw, 0, { cor: 'forte', d: 0.22 });
      g.linha(gx, gy + gh, gx + gw, gy + gh, { cor: 's1', larg: 1.6, tracejado: [6, 4] });
      g.ret(gx + gw - 1.5, gy + gh, 1.3, 0.4, { cor: 'forte', larg: 1.8, preenche: 'baixo', alfa: 0.7 });
      g.txt('navio', gx + gw - 0.85, gy + gh + 0.58, { cor: 'suave', tam: 10.5 });
      var i, pts = [];
      if (slay) {
        for (i = 0; i <= 60; i++) {
          var f = i / 60;
          pts.push([gx + 0.3 + (gw - 1.9) * f, gy + gh * Math.pow(f, 2.6)]);
        }
        pts.reverse();
        g.caminho(pts, { cor: 'erro', larg: 2.6 });
        g.arco(gx + gw - 1.55, gy + gh - 0.55, 0.6, Math.PI / 2, 0.1, { cor: 'aviso', larg: 2.4 });
        g.txt('overbend (stinger)', gx + gw - 2.1, gy + gh - 0.15, { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      } else {
        for (i = 0; i <= 60; i++) {
          var f2 = i / 60;
          pts.push([gx + 0.4 + (gw - 2.0) * Math.pow(f2, 2.2), gy + gh * f2]);
        }
        g.caminho(pts, { cor: 'erro', larg: 2.6 });
        g.txt('torre em J', gx + gw - 1.5, gy + gh - 0.3, { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      }
      g.circ(pts[0][0], pts[0][1], 0.13, { preenche: 's3', cor: null });
      g.txt('sagbend', pts[0][0] + 0.15, gy + 0.35, { cor: 's3', tam: 10.5, alin: 'esq' });
      g.cota(gx + 0.12, gy, gx + 0.12, gy + gh, fx(h, 0) + ' m', { dx: 0.45, dy: 0 });
      var xr = 7.0;
      g.txt(slay ? 'S-lay' : 'J-lay', xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('tração de topo ' + fx(Tt / 1000, 0) + ' kN', xr, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('raio no sagbend R = T/w', xr, 3.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('R = ' + fx(R, 0) + ' m', xr, 3.1, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('deformação ε = D/2R = ' + fx(eps, 3) + ' %', xr, 2.4,
        { cor: eps > limite ? 'erro' : 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt(eps > limite ? 'acima do limite usual de 0,25 %' : 'dentro do limite usual de 0,25 %',
        xr, 1.75, { cor: eps > limite ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(slay && h > 1200 ? 'S-lay sofre em lâmina profunda' : slay ? 'S-lay adequado a esta lâmina' : 'J-lay alcança lâmina profunda',
        xr, 1.1, { cor: slay && h > 1200 ? 'aviso' : 'suave', tam: 11, alin: 'esq' });
      g.txt('duto de 400 mm com 1,5 kN/m submerso · perder tração fecha o raio e flamba', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — seleção de conceito ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'A seleção do conceito cruza lâmina d\'água, distância da costa e necessidade de estocagem. No Brasil, as três respostas apontam quase sempre para o mesmo lugar.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'lda', rot: 'Lâmina d\'água', min: 50, max: 3000, val: 2000, passo: 50, un: 'm' },
      { id: 'dist', rot: 'Distância da costa', min: 10, max: 400, val: 250, passo: 10, un: 'km' },
      { id: 'arv', rot: 'Árvore: 1 molhada · 2 seca', min: 1, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var lda = p.lda, dist = p.dist, seca = Math.round(p.arv) === 2;
      var conceito, cor, motivo;
      if (lda < 300 && dist < 100) { conceito = 'plataforma fixa'; cor = 's4'; motivo = 'lâmina rasa e perto da costa'; }
      else if (seca && lda < 1500) { conceito = 'TLP'; cor = 'ok'; motivo = 'árvore seca exige pouco heave'; }
      else if (seca) { conceito = 'spar'; cor = 's3'; motivo = 'árvore seca em lâmina profunda'; }
      else if (dist > 120) { conceito = 'FPSO'; cor = 'erro'; motivo = 'longe da costa: estocagem a bordo'; }
      else { conceito = 'semissubmersível'; cor = 's1'; motivo = 'escoamento por duto disponível'; }
      var gx = 1.3, gy = 1.0, gw = 5.4, gh = 3.9;
      var X = function (d) { return gx + gw * lim(d, 0, 400) / 400; };
      var Y = function (l) { return gy + gh * lim(l, 0, 3000) / 3000; };
      g.ret(gx, gy, X(100) - gx, Y(300) - gy, { preenche: 's4', cor: null, alfa: 0.25 });
      g.ret(X(120), Y(300), gx + gw - X(120), gy + gh - Y(300), { preenche: 'erro', cor: null, alfa: 0.18 });
      g.ret(gx, Y(300), X(120) - gx, gy + gh - Y(300), { preenche: 's1', cor: null, alfa: 0.18 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.txt('fixa', (gx + X(100)) / 2, (gy + Y(300)) / 2, { cor: 's4', tam: 10.5 });
      g.txt('FPSO', (X(120) + gx + gw) / 2, (Y(300) + gy + gh) / 2, { cor: 'erro', tam: 11 });
      g.txt('semi / TLP', (gx + X(120)) / 2, (Y(300) + gy + gh) / 2, { cor: 's1', tam: 10.5 });
      g.circ(X(dist), Y(lda), 0.17, { preenche: cor, cor: null });
      [100, 200, 300, 400].forEach(function (d) {
        g.linha(X(d), gy, X(d), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(d + '', X(d), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [1000, 2000, 3000].forEach(function (l) {
        g.linha(gx, Y(l), gx - 0.14, Y(l), { cor: 'fraco', larg: 1 });
        g.txt(l + '', gx - 0.26, Y(l), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('distância da costa (km)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('lâmina d\'água (m)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.2;
      g.txt('conceito indicado', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(conceito, xr, 4.3, { cor: cor, tam: 16, alin: 'esq', negrito: true });
      g.txt(motivo, xr, 3.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('árvore ' + (seca ? 'seca' : 'molhada'), xr, 2.9, { cor: seca ? 'ok' : 'suave', tam: 12, alin: 'esq', negrito: true });
      g.txt(dist > 120 ? 'duto de óleo improvável: alívio por navio' : 'escoamento por duto viável',
        xr, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o pré-sal reúne lâmina profunda,', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('distância e ausência de malha de dutos', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('critérios simplificados — a decisão real inclui CAPEX, OPEX e intervenção', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

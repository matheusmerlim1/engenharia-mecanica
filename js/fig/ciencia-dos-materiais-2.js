/* ============================================================
   Figuras ilustrativas de Ciência dos Materiais II
   Curvas CCT, Ms por Andrews, dureza da martensita, Hollomon-Jaffe,
   Jominy, tratamentos, designação SAE, série galvânica, taxa de
   corrosão e índices de seleção — todos calculados.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };

  /* ================= capítulo 1 ================= */

  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Curva CCT: a velocidade de resfriamento decide o produto. Passando à esquerda do nariz forma-se martensita; mais devagar, bainita; devagar o bastante, perlita.',
    vista: [-0.6, 12.6, -3.0, 6.0],
    altura: 350,
    controles: [{ id: 'v', rot: 'Velocidade de resfriamento', min: 0.2, max: 300, val: 60, passo: 0.2, un: '°C/s' }],
    desenhar: function (g, p) {
      var v = p.v;
      var gx = 1.2, gy = 1.0, gw = 6.4, gh = 4.4;
      /* eixo do tempo em log (0,1 s a 10 000 s) */
      var X = function (t) { return gx + gw * (Math.log10(Math.max(0.1, t)) + 1) / 6; };
      var Y = function (T) { return gy + gh * (T - 100) / 800; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, dec;
      for (dec = -1; dec <= 5; dec++) {
        var xx = X(Math.pow(10, dec));
        g.linha(xx, gy, xx, gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(dec < 0 ? '0,1' : dec === 0 ? '1' : '10' + (dec > 1 ? String(dec).replace('2', '²').replace('3', '³').replace('4', '⁴').replace('5', '⁵') : ''),
          xx, gy - 0.45, { cor: 'fraco', tam: 10 });
      }
      [200, 400, 600, 800].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.15, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.28, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('tempo (s, escala log)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('°C', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      /* curva em C: o tempo de início é mínimo no nariz (550 °C) e cresce para os dois lados */
      function tInicio(T) { return Math.exp(Math.pow((T - 550) / 95, 2)); }
      var ini = [], fim = [];
      for (i = 0; i <= 60; i++) {
        var T = 345 + (727 - 345) * i / 60;
        ini.push([X(tInicio(T)), Y(T)]);
        fim.push([X(tInicio(T) * 6), Y(T)]);
      }
      g.caminho(ini, { cor: 's1', larg: 2 });
      g.caminho(fim, { cor: 's1', larg: 1.6, tracejado: [6, 4] });
      g.txt('início', X(tInicio(640)) - 0.1, Y(650), { cor: 's1', tam: 10.5, alin: 'dir' });
      g.txt('fim', X(tInicio(640) * 6) + 0.15, Y(650), { cor: 's1', tam: 10.5, alin: 'esq' });
      g.txt('nariz', X(1) + 0.1, Y(550), { cor: 's1', tam: 10.5, alin: 'esq' });
      g.linha(gx, Y(345), gx + gw, Y(345), { cor: 's2', larg: 1.6 });
      g.txt('Ms = 345 °C', gx + gw - 0.1, Y(345) + 0.3, { cor: 's2', tam: 10.5, alin: 'dir' });
      g.linha(gx, Y(727), gx + gw, Y(727), { cor: 'fraco', larg: 1.2, tracejado: [4, 4] });
      g.txt('A1 = 727 °C', gx + gw - 0.1, Y(727) + 0.3, { cor: 'fraco', tam: 10.5, alin: 'dir' });
      /* trajetória de resfriamento a partir de 850 °C */
      var pts = [], produto = 'martensita', tcruza = null;
      for (i = 0; i <= 200; i++) {
        var T = 850 - (850 - 120) * i / 200;
        var tt = Math.max(0.05, (850 - T) / v);
        pts.push([X(tt), Y(T)]);
        /* a transformação começa quando a trajetória alcança a curva de início */
        if (tcruza === null && T < 727 && T > 345 && tt >= tInicio(T)) tcruza = T;
      }
      g.caminho(pts, { cor: 'erro', larg: 2.6 });
      if (tcruza !== null) produto = tcruza > 450 ? 'perlita' : 'bainita';
      var x0 = 8.4;
      g.txt('v = ' + fx(v, 1) + ' °C/s', x0, 5.4, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('produto principal:', x0, 4.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(produto, x0, 3.9, { cor: produto === 'martensita' ? 'erro' : produto === 'bainita' ? 's4' : 's3', tam: 15, alin: 'esq', negrito: true });
      g.txt(produto === 'martensita' ? 'passou à esquerda do nariz:' : 'cruzou a curva de início:', x0, 3.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(produto === 'martensita' ? 'dura e frágil, exige revenido' : 'transformou por difusão', x0, 2.55, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('velocidade crítica ≈ ' + fx((850 - 550) / tInicio(550), 0) + ' °C/s', x0, 1.6, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('aços mais ligados empurram o nariz para a direita e reduzem a velocidade crítica', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 2 ================= */

  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Temperatura de início da martensita pela equação de Andrews. Carbono e elementos de liga baixam Ms — e, quando Mf cai abaixo da ambiente, sobra austenita retida (exemplo 2.1).',
    vista: [-0.6, 12.6, -3.0, 6.0],
    altura: 350,
    controles: [
      { id: 'C', rot: 'Carbono', min: 0.1, max: 1.0, val: 0.4, passo: 0.05, un: '%' },
      { id: 'Mn', rot: 'Manganês', min: 0.2, max: 2.0, val: 0.8, passo: 0.1, un: '%' },
      { id: 'Cr', rot: 'Cromo', min: 0, max: 5, val: 0, passo: 0.1, un: '%' }
    ],
    desenhar: function (g, p) {
      var Ms = 539 - 423 * p.C - 30.4 * p.Mn - 12.1 * p.Cr;
      var Mf = Ms - 215;
      var gx = 1.2, gy = 1.0, gw = 6.2, gh = 4.4;
      var Y = function (T) { return gy + gh * (T + 150) / 700; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      [-100, 0, 100, 200, 300, 400, 500].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.15, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.28, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('°C', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      /* fração transformada entre Ms e Mf (Koistinen-Marburger) */
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var T = Ms - (Ms - (Mf - 60)) * i / 60;
        var f = 1 - Math.exp(-0.011 * Math.max(0, Ms - T));
        pts.push([gx + gw * f, Y(T)]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.6 });
      g.linha(gx, Y(Ms), gx + gw, Y(Ms), { cor: 's2', larg: 1.4, tracejado: [5, 4] });
      g.txt('Ms = ' + fx(Ms, 0) + ' °C', gx + gw, Y(Ms) + 0.3, { cor: 's2', tam: 11.5, alin: 'dir', negrito: true });
      g.linha(gx, Y(Mf), gx + gw, Y(Mf), { cor: 's4', larg: 1.4, tracejado: [5, 4] });
      g.txt('Mf ≈ ' + fx(Mf, 0) + ' °C', gx + gw, Y(Mf) - 0.35, { cor: 's4', tam: 11.5, alin: 'dir' });
      g.linha(gx, Y(25), gx + gw, Y(25), { cor: 'ok', larg: 1.6 });
      g.txt('ambiente', gx + 0.1, Y(25) + 0.28, { cor: 'ok', tam: 10.5, alin: 'esq' });
      g.txt('fração transformada →', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      var retida = Math.exp(-0.011 * Math.max(0, Ms - 25));
      var x0 = 8.4;
      g.txt('Ms = ' + fx(Ms, 0) + ' °C', x0, 5.3, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('Mf ≈ ' + fx(Mf, 0) + ' °C', x0, 4.6, { cor: 's4', tam: 12.5, alin: 'esq' });
      g.txt('austenita retida a 25 °C', x0, 3.7, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(100 * retida, 1) + ' %', x0, 3.0, { cor: retida > 0.05 ? 'aviso' : 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt(retida > 0.05 ? 'considerável: avalie tratamento sub-zero' : 'desprezível: têmpera completa', x0, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('Ms = 539 − 423C − 30,4Mn − 12,1Cr  (Andrews)', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  F('#fig-2-2', {
    titulo: 'Figura 2.2',
    legenda: 'A dureza da martensita vem do carbono e satura perto de 0,6 %. Perlita e bainita, para o mesmo aço, ficam muito abaixo — e é isso que a têmpera compra.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'C', rot: 'Teor de carbono', min: 0.1, max: 1.0, val: 0.4, passo: 0.05, un: '%' }],
    desenhar: function (g, p) {
      function Hmart(C) { return Math.min(66, 20 + 76 * Math.sqrt(Math.min(C, 0.6))); }
      function Hperl(C) { return 10 + 22 * C; }
      function Hbain(C) { return 18 + 32 * C; }
      var gx = 1.3, gy = 1.0, gw = 6.4, gh = 4.2;
      var X = function (C) { return gx + gw * (C - 0.1) / 0.9; };
      var Y = function (H) { return gy + gh * H / 70; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, m = [], pe = [], b = [];
      for (i = 0; i <= 50; i++) {
        var C = 0.1 + 0.9 * i / 50;
        m.push([X(C), Y(Hmart(C))]); pe.push([X(C), Y(Hperl(C))]); b.push([X(C), Y(Hbain(C))]);
      }
      g.caminho(m, { cor: 'erro', larg: 2.6 });
      g.caminho(b, { cor: 's4', larg: 2.2 });
      g.caminho(pe, { cor: 's3', larg: 2.2 });
      [0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (C) {
        g.linha(X(C), gy, X(C), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(fx(C, 1), X(C), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [20, 40, 60].forEach(function (H) {
        g.linha(gx, Y(H), gx - 0.15, Y(H), { cor: 'fraco', larg: 1 });
        g.txt(H + '', gx - 0.28, Y(H), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('%C', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('HRC', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var C0 = p.C;
      g.linha(X(C0), gy, X(C0), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      [[Hmart(C0), 'erro'], [Hbain(C0), 's4'], [Hperl(C0), 's3']].forEach(function (d) {
        g.circ(X(C0), Y(d[0]), 0.14, { preenche: d[1], cor: null });
      });
      var x0 = 8.4;
      g.txt(fx(C0, 2) + ' %C', x0, 5.2, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('martensita ' + fx(Hmart(C0), 0) + ' HRC', x0, 4.4, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('bainita ' + fx(Hbain(C0), 0) + ' HRC', x0, 3.8, { cor: 's4', tam: 12, alin: 'esq' });
      g.txt('perlita ' + fx(Hperl(C0), 0) + ' HRC', x0, 3.2, { cor: 's3', tam: 12, alin: 'esq' });
      g.txt(C0 >= 0.6 ? 'acima de 0,6 %C a dureza satura:' : 'ainda na faixa em que o carbono', x0, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(C0 >= 0.6 ? 'mais carbono só traz fragilidade' : 'ainda aumenta a dureza', x0, 1.75, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('elementos de liga quase não mudam esta curva: eles dão temperabilidade, não dureza', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 4 ================= */

  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Parâmetro de Hollomon-Jaffe: tempo e temperatura se trocam. A linha mostra todos os ciclos equivalentes ao escolhido — a base do exemplo 4.1.',
    vista: [-0.6, 12.6, -3.0, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura de revenido', min: 200, max: 700, val: 550, passo: 10, un: '°C' },
      { id: 'h', rot: 'Tempo', min: 0.25, max: 8, val: 2, passo: 0.25, un: 'h' }
    ],
    desenhar: function (g, p) {
      var P = function (Tc, t) { return (Tc + 273.15) * (20 + Math.log10(t)) / 1000; };
      var Pv = P(p.T, p.h);
      /* dureza aproximada após revenido de um aço 0,4 %C temperado */
      var dureza = function (par) { return Math.max(20, 68 - 2.6 * Math.max(0, par - 10)); };
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (t) { return gx + gw * (Math.log10(t) + 0.7) / 1.7; };
      var Y = function (T) { return gy + gh * (T - 150) / 600; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      [0.25, 0.5, 1, 2, 4, 8].forEach(function (t) {
        g.linha(X(t), gy, X(t), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(t < 1 ? fx(t * 60, 0) + ' min' : t + ' h', X(t), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [200, 300, 400, 500, 600, 700].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.15, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.28, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('tempo', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('°C', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      /* curva de iso-parâmetro */
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var t = Math.pow(10, -0.7 + 1.7 * i / 60);
        var Tc = Pv * 1000 / (20 + Math.log10(t)) - 273.15;
        if (Tc > 150 && Tc < 750) pts.push([X(t), Y(Tc)]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.6 });
      g.circ(X(p.h), Y(p.T), 0.16, { preenche: 'erro', cor: null });
      var x0 = 8.4;
      g.txt('P = T(20 + log t)/1000', x0, 5.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('P = ' + fx(Pv, 2), x0, 4.5, { cor: 's2', tam: 15, alin: 'esq', negrito: true });
      g.txt('dureza estimada ' + fx(dureza(Pv), 0) + ' HRC', x0, 3.7, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      var eq = [[500, null], [600, null], [650, null]];
      g.txt('ciclos equivalentes:', x0, 2.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      eq.forEach(function (e, k) {
        var t = Math.pow(10, Pv * 1000 / (e[0] + 273.15) - 20);
        var txt = t < 1 / 60 ? '<1 min' : t < 1 ? fx(t * 60, 0) + ' min' : fx(t, 1) + ' h';
        g.txt(e[0] + ' °C → ' + txt, x0, 2.3 - k * 0.55, { cor: 'fraco', tam: 11, alin: 'esq' });
      });
      g.txt('revenir mais quente exige muito menos tempo — e o controle do forno fica crítico', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 5 ================= */

  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Curvas Jominy: a dureza cai com a distância da ponta resfriada. O 1045 perde dureza em poucos milímetros; o 4140 e o 4340 seguram — é isso que se chama temperabilidade.',
    vista: [-0.6, 12.6, -3.0, 5.8],
    altura: 350,
    controles: [
      { id: 'D', rot: 'Diâmetro da barra', min: 10, max: 120, val: 50, passo: 5, un: 'mm' },
      { id: 'meio', rot: 'Meio (1 óleo · 2 água · 3 salmoura)', min: 1, max: 3, val: 2, passo: 1 }
    ],
    desenhar: function (g, p) {
      var acos = [
        { n: '1045', H0: 58, k: 0.42, cor: 's3' },
        { n: '4140', H0: 60, k: 0.10, cor: 's1' },
        { n: '4340', H0: 60, k: 0.05, cor: 's4' }
      ];
      /* distância Jominy equivalente ao núcleo: cresce com o diâmetro, cai com a severidade */
      var sev = { 1: 0.35, 2: 0.55, 3: 0.75 }[p.meio];
      var nomeMeio = { 1: 'óleo', 2: 'água', 3: 'salmoura' }[p.meio];
      var Jeq = Math.max(1, (p.D / 2) * (1 - 0.55 * sev) * 0.9);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (d) { return gx + gw * d / 50; };
      var Y = function (H) { return gy + gh * H / 70; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      acos.forEach(function (a, idx) {
        var pts = [], i;
        for (i = 0; i <= 50; i++) {
          var d = 50 * i / 50;
          pts.push([X(d), Y(25 + (a.H0 - 25) * Math.exp(-a.k * d))]);
        }
        g.caminho(pts, { cor: a.cor, larg: 2.4 });
        var Hn = 25 + (a.H0 - 25) * Math.exp(-a.k * Math.min(Jeq, 50));
        g.circ(X(Math.min(Jeq, 50)), Y(Hn), 0.14, { preenche: a.cor, cor: null });
        g.txt(a.n + ': ' + fx(Hn, 0) + ' HRC no núcleo', 8.3, 4.9 - idx * 0.75, { cor: a.cor, tam: 12, alin: 'esq', negrito: true });
      });
      [0, 10, 20, 30, 40, 50].forEach(function (d) {
        g.linha(X(d), gy, X(d), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(d + '', X(d), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [20, 40, 60].forEach(function (H) {
        g.linha(gx, Y(H), gx - 0.15, Y(H), { cor: 'fraco', larg: 1 });
        g.txt(H + '', gx - 0.28, Y(H), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('distância da ponta temperada (mm)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('HRC', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.linha(X(Math.min(Jeq, 50)), gy, X(Math.min(Jeq, 50)), gy + gh, { cor: 'erro', larg: 1.3, tracejado: [5, 4] });
      g.txt('núcleo da barra', X(Math.min(Jeq, 50)), gy + gh + 0.35, { cor: 'erro', tam: 11, fundo: true });
      g.txt('barra de ' + p.D + ' mm temperada em ' + nomeMeio, 8.3, 2.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('posição Jominy equivalente ≈ ' + fx(Jeq, 1) + ' mm', 8.3, 1.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o carbono fixa a dureza máxima; a liga decide até onde ela chega', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 6 ================= */

  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Os tratamentos lado a lado, no mesmo par temperatura-tempo: muda a velocidade de resfriamento, muda a microestrutura e mudam as propriedades.',
    vista: [-0.6, 12.6, -3.2, 5.8],
    altura: 350,
    controles: [{ id: 'tr', rot: 'Tratamento (1 recozimento · 2 normalização · 3 têmpera · 4 têmpera + revenido)', min: 1, max: 4, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var tr = {
        1: { n: 'Recozimento pleno', meio: 'forno (muito lento)', micro: 'perlita grosseira + ferrita', dur: 15, ten: 70, uso: 'usinabilidade e alívio total', cor: 's3' },
        2: { n: 'Normalização', meio: 'ar parado', micro: 'perlita fina + ferrita', dur: 25, ten: 60, uso: 'grão refinado e uniformidade', cor: 's1' },
        3: { n: 'Têmpera', meio: 'óleo ou água', micro: 'martensita', dur: 62, ten: 10, uso: 'dureza máxima — exige revenido', cor: 'erro' },
        4: { n: 'Têmpera + revenido', meio: 'têmpera e reaquecimento', micro: 'martensita revenida', dur: 45, ten: 48, uso: 'resistência com tenacidade', cor: 's4' }
      }[p.tr];
      var gx = 1.2, gy = 1.2, gw = 6.0, gh = 3.8;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.txt('tempo', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('temperatura', gx - 0.3, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var yA = gy + gh * 0.78;
      g.linha(gx, yA, gx + gw, yA, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('austenitização', gx + 0.15, yA + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      /* perfil térmico */
      var pts = [[gx + 0.2, gy + 0.2], [gx + 1.4, yA], [gx + 2.6, yA]];
      if (p.tr === 1) pts.push([gx + gw - 0.2, gy + 0.3]);
      else if (p.tr === 2) pts.push([gx + 4.4, gy + 0.3], [gx + gw - 0.2, gy + 0.25]);
      else if (p.tr === 3) pts.push([gx + 3.0, gy + 0.25], [gx + gw - 0.2, gy + 0.2]);
      else pts.push([gx + 3.0, gy + 0.25], [gx + 3.4, gy + gh * 0.34], [gx + 4.8, gy + gh * 0.34], [gx + gw - 0.2, gy + 0.2]);
      g.caminho(pts, { cor: tr.cor, larg: 2.8 });
      if (p.tr === 4) g.txt('revenido', gx + 4.1, gy + gh * 0.34 + 0.35, { cor: tr.cor, tam: 10.5 });
      var x0 = 8.0;
      g.txt(tr.n, x0, 5.2, { cor: tr.cor, tam: 13.5, alin: 'esq', negrito: true });
      g.txt('resfriamento: ' + tr.meio, x0, 4.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('microestrutura: ' + tr.micro, x0, 3.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('para: ' + tr.uso, x0, 3.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.ret(x0, 2.1, 3.6 * tr.dur / 70, 0.45, { preenche: 'erro', cor: null, alfa: 0.8 });
      g.txt('dureza ' + tr.dur + ' HRC', x0, 1.75, { cor: 'erro', tam: 11, alin: 'esq' });
      g.ret(x0, 0.9, 3.6 * tr.ten / 70, 0.45, { preenche: 'ok', cor: null, alfa: 0.8 });
      g.txt('tenacidade relativa', x0, 0.55, { cor: 'ok', tam: 11, alin: 'esq' });
      g.txt('tratamentos de superfície (cementação, nitretação, indução) endurecem só a casca', 6, -2.6, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 7 ================= */

  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Decodificando a designação SAE/AISI: os dois primeiros dígitos dão a família de liga; os dois últimos, o carbono em centésimos de por cento.',
    vista: [-0.6, 12.6, -3.0, 5.4],
    altura: 350,
    controles: [{ id: 'aco', rot: 'Aço (1 1020 · 2 1045 · 3 4140 · 4 4340 · 5 52100)', min: 1, max: 5, val: 3, passo: 1 }],
    desenhar: function (g, p) {
      var a = {
        1: { cod: '1020', fam: 'aço-carbono comum', C: 0.20, liga: '—', uso: 'peças soldadas, cementação', temper: 15, sold: 90 },
        2: { cod: '1045', fam: 'aço-carbono comum', C: 0.45, liga: '—', uso: 'eixos e engrenagens pequenas', temper: 35, sold: 55 },
        3: { cod: '4140', fam: 'cromo-molibdênio', C: 0.40, liga: '≈1 %Cr, 0,2 %Mo', uso: 'eixos, parafusos de alta resistência', temper: 75, sold: 40 },
        4: { cod: '4340', fam: 'níquel-cromo-molibdênio', C: 0.40, liga: '1,8 %Ni, 0,8 %Cr, 0,25 %Mo', uso: 'peças críticas, grandes seções', temper: 95, sold: 30 },
        5: { cod: '52100', fam: 'cromo alto carbono', C: 1.00, liga: '1,5 %Cr', uso: 'rolamentos', temper: 60, sold: 10 }
      }[p.aco];
      var cx = 3.4, cy = 3.6;
      var dig = a.cod.split('');
      dig.forEach(function (d, i) {
        var x = cx - (dig.length - 1) * 0.55 + i * 1.1;
        var fam = i < dig.length - 2;
        g.ret(x - 0.45, cy - 0.6, 0.9, 1.2, { preenche: fam ? 's1' : 's3', cor: 'forte', larg: 1.4, alfa: 0.3 });
        g.txt(d, x, cy, { cor: 'texto', tam: 22, negrito: true });
      });
      var meio = cx - (dig.length - 1) * 0.55;
      g.seta(meio + 0.55 * (dig.length - 3), cy - 1.1, 0, -0.7, { cor: 's1', larg: 1.6, ponta: 0.2 });
      g.txt('família de liga', meio + 0.55 * (dig.length - 3), cy - 2.2, { cor: 's1', tam: 11.5, negrito: true });
      g.seta(cx + 0.55 * (dig.length - 1) - 0.5, cy + 1.1, 0, 0.7, { cor: 's3', larg: 1.6, ponta: 0.2 });
      g.txt('carbono em centésimos de %', cx + 1.2, cy + 2.2, { cor: 's3', tam: 11.5, negrito: true });
      var x0 = 7.4;
      g.txt('SAE ' + a.cod, x0, 5.0, { cor: 'texto', tam: 15, alin: 'esq', negrito: true });
      g.txt(a.fam, x0, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('carbono ' + fx(a.C, 2) + ' %', x0, 3.7, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('liga: ' + a.liga, x0, 3.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('uso típico: ' + a.uso, x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.ret(x0, 1.4, 4.0 * a.temper / 100, 0.42, { preenche: 's1', cor: null, alfa: 0.8 });
      g.txt('temperabilidade', x0, 1.05, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.ret(x0, 0.3, 4.0 * a.sold / 100, 0.42, { preenche: 'ok', cor: null, alfa: 0.8 });
      g.txt('soldabilidade', x0, -0.05, { cor: 'ok', tam: 10.5, alin: 'esq' });
      g.txt('mais carbono e mais liga: endurece melhor, solda pior', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 8 ================= */

  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Par galvânico: o metal menos nobre vira ânodo e se dissolve. Quanto maior a diferença de potencial e menor a área do ânodo, mais rápida a perda.',
    vista: [-0.6, 12.6, -3.2, 5.6],
    altura: 350,
    controles: [
      { id: 'a', rot: 'Metal A (1 Mg · 2 Zn · 3 Al · 4 Aço · 5 Cu · 6 Inox)', min: 1, max: 6, val: 2, passo: 1 },
      { id: 'b', rot: 'Metal B', min: 1, max: 6, val: 4, passo: 1 },
      { id: 'area', rot: 'Área do ânodo em relação ao cátodo', min: 10, max: 300, val: 100, passo: 10, un: '%' }
    ],
    desenhar: function (g, p) {
      var met = {
        1: { n: 'Magnésio', E: -1.60 }, 2: { n: 'Zinco', E: -1.03 }, 3: { n: 'Alumínio', E: -0.79 },
        4: { n: 'Aço-carbono', E: -0.61 }, 5: { n: 'Cobre', E: -0.36 }, 6: { n: 'Inox 316 (passivo)', E: -0.05 }
      };
      var A = met[p.a], B = met[p.b];
      var anodo = A.E < B.E ? A : B, catodo = A.E < B.E ? B : A;
      var dE = Math.abs(A.E - B.E);
      var razao = p.area / 100;
      var sev = dE * (1 / Math.max(0.1, razao));
      /* desenho da pilha */
      var ox = 1.0, oy = 1.0, larg = 5.6, alt = 2.8;
      g.ret(ox, oy, larg, alt, { cor: 'forte', larg: 1.8 });
      g.ret(ox, oy, larg, alt * 0.78, { preenche: 's1', cor: null, alfa: 0.12 });
      g.txt('eletrólito', ox + larg / 2, oy + 0.4, { cor: 'fraco', tam: 11 });
      var la = 0.5 + 0.9 * Math.min(2, razao);
      g.ret(ox + 0.8, oy + 0.8, la, alt * 0.9, { preenche: 'erro', cor: 'forte', larg: 1.4, alfa: 0.45 });
      g.ret(ox + larg - 1.9, oy + 0.8, 1.1, alt * 0.9, { preenche: 's3', cor: 'forte', larg: 1.4, alfa: 0.45 });
      g.txt('ânodo', ox + 0.8 + la / 2, oy + alt + 0.55, { cor: 'erro', tam: 11.5, negrito: true });
      g.txt(anodo.n, ox + 0.8 + la / 2, oy + alt + 1.05, { cor: 'erro', tam: 11 });
      g.txt('cátodo', ox + larg - 1.35, oy + alt + 0.55, { cor: 's3', tam: 11.5, negrito: true });
      g.txt(catodo.n, ox + larg - 1.35, oy + alt + 1.05, { cor: 's3', tam: 11 });
      g.linha(ox + 0.8 + la / 2, oy + alt + 1.5, ox + larg - 1.35, oy + alt + 1.5, { cor: 'forte', larg: 2 });
      g.linha(ox + 0.8 + la / 2, oy + alt + 0.9 + 0.5, ox + 0.8 + la / 2, oy + alt + 1.5, { cor: 'forte', larg: 2 });
      g.linha(ox + larg - 1.35, oy + alt + 0.9 + 0.5, ox + larg - 1.35, oy + alt + 1.5, { cor: 'forte', larg: 2 });
      g.seta(ox + larg / 2 - 0.4, oy + alt + 1.5, 0.8, 0, { cor: 's2', larg: 1.8, rot: 'elétrons', rotTam: 10.5, rotDy: 0.4, rotDx: 0 });
      var x0 = 7.4;
      g.txt('diferença de potencial', x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(dE, 2) + ' V', x0, 4.3, { cor: 'texto', tam: 15, alin: 'esq', negrito: true });
      g.txt('quem corrói: ' + anodo.n, x0, 3.4, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('razão de áreas ânodo/cátodo ' + fx(razao, 2), x0, 2.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.ret(x0, 1.5, 4.2 * Math.min(1, sev / 12), 0.5, { preenche: sev > 6 ? 'erro' : sev > 2 ? 'aviso' : 'ok', cor: null, alfa: 0.85 });
      g.txt(sev > 6 ? 'risco alto: ânodo pequeno e grande ΔE' : sev > 2 ? 'risco moderado' : 'risco baixo',
        x0, 1.0, { cor: sev > 6 ? 'erro' : sev > 2 ? 'aviso' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt(dE < 0.05 ? 'metais próximos na série: par pouco ativo' : 'quanto maior o ΔE, mais rápida a corrosão', x0, 0.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('potenciais típicos em água do mar (série galvânica prática)', 6, -2.6, { cor: 'fraco', tam: 11 });
    }
  });

  F('#fig-8-2', {
    titulo: 'Figura 8.2',
    legenda: 'Da densidade de corrente à perda de espessura: CR = 3,27×10⁻³ · i · EW/ρ. A sobreespessura de projeto é o que compra vida útil (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'i', rot: 'Densidade de corrente', min: 1, max: 100, val: 10, passo: 1, un: 'µA/cm²' },
      { id: 'sobre', rot: 'Sobreespessura de corrosão', min: 1, max: 6, val: 3, passo: 0.5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var EW = 55.85 / 2, rho = 7.87;
      var CR = 3.27e-3 * p.i * EW / rho;
      var vida = p.sobre / CR;
      /* parede do tubo com a perda */
      var ox = 1.2, oy = 1.2, larg = 5.4, esp = 2.4;
      var perda = esp * Math.min(0.9, p.sobre / 8);
      g.ret(ox, oy, larg, esp, { preenche: 's1', cor: 'forte', larg: 1.6, alfa: 0.3 });
      g.ret(ox, oy + esp - perda, larg, perda, { preenche: 'erro', cor: null, alfa: 0.35 });
      g.txt('sobreespessura de corrosão', ox + larg / 2, oy + esp - perda / 2, { cor: 'erro', tam: 11 });
      g.txt('espessura mínima de projeto', ox + larg / 2, oy + (esp - perda) / 2, { cor: 'suave', tam: 11 });
      g.cota(ox - 0.5, oy + esp - perda, ox - 0.5, oy + esp, fx(p.sobre, 1) + ' mm', { dx: -0.2 });
      g.txt('parede do tubo', ox + larg / 2, oy + esp + 0.6, { cor: 'fraco', tam: 11 });
      var x0 = 7.4;
      g.txt('i = ' + p.i + ' µA/cm²', x0, 4.8, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('CR = ' + fx(CR, 3) + ' mm/ano', x0, 4.0, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('vida da sobreespessura', x0, 3.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(vida, 1) + ' anos', x0, 2.4, { cor: vida < 10 ? 'aviso' : 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt(vida < 10 ? 'abaixo do usual: reveja proteção ou material' : 'compatível com campanhas longas', x0, 1.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('válido para corrosão uniforme; um pite fura a mesma parede em meses', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 9 ================= */

  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Resistência específica (σ/ρ): é por isso que aeronaves usam alumínio e titânio, mesmo custando mais que o aço.',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [{ id: 'crit', rot: 'Critério (1 resistência específica · 2 rigidez específica · 3 custo relativo)', min: 1, max: 3, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var mats = [
        { n: 'Aço 1045', s: 570, E: 200, r: 7.87, c: 1, cor: 's1' },
        { n: 'Alumínio 6061-T6', s: 310, E: 70, r: 2.70, c: 3, cor: 's3' },
        { n: 'Titânio Ti-6Al-4V', s: 900, E: 114, r: 4.43, c: 25, cor: 's4' },
        { n: 'Liga de níquel', s: 850, E: 210, r: 8.2, c: 30, cor: 's2' },
        { n: 'Latão', s: 400, E: 100, r: 8.4, c: 5, cor: 's5' }
      ];
      var val = function (m) {
        return p.crit === 1 ? m.s / m.r : p.crit === 2 ? Math.sqrt(m.E) / m.r * 100 : m.c;
      };
      var rot = { 1: 'resistência específica σ/ρ (MPa·cm³/g)', 2: 'rigidez específica √E/ρ (×100)', 3: 'custo relativo (aço = 1)' }[p.crit];
      var vmax = Math.max.apply(null, mats.map(val));
      g.txt(rot, 6, 5.2, { cor: 'suave', tam: 12.5, negrito: true });
      mats.forEach(function (m, i) {
        var y = 4.2 - i * 0.82;
        g.txt(m.n, 3.6, y + 0.22, { cor: 'texto', tam: 11.5, alin: 'dir' });
        g.ret(3.9, y, 7.0 * val(m) / vmax, 0.5, { preenche: m.cor, cor: null, alfa: 0.8 });
        g.txt(fx(val(m), 1), 3.9 + 7.0 * val(m) / vmax + 0.2, y + 0.25, { cor: m.cor, tam: 11, alin: 'esq', negrito: true });
      });
      g.txt(p.crit === 3 ? 'custo manda na maioria das aplicações industriais — por isso o aço domina'
        : 'por peso, os não ferrosos ganham; por preço, raramente', 6, -2.2, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 10 ================= */

  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Mapa de seleção (estilo Ashby): módulo contra densidade. A reta do índice de mérito ordena os candidatos — e o índice muda conforme a peça seja barra, viga ou placa.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'idx', rot: 'Índice (1 E/ρ barra · 2 √E/ρ viga · 3 ∛E/ρ placa)', min: 1, max: 3, val: 2, passo: 1 }],
    desenhar: function (g, p) {
      var mats = [
        { n: 'Aço', E: 200, r: 7.87, cor: 's1' },
        { n: 'Alumínio', E: 70, r: 2.70, cor: 's3' },
        { n: 'Titânio', E: 114, r: 4.43, cor: 's4' },
        { n: 'Magnésio', E: 45, r: 1.74, cor: 's6', lab: -0.5 },
        { n: 'Madeira', E: 10, r: 0.6, cor: 's5' },
        { n: 'CFRP', E: 120, r: 1.6, cor: 's2' },
        { n: 'Polímero', E: 3, r: 1.2, cor: 's7' }
      ];
      var exp = { 1: 1, 2: 0.5, 3: 1 / 3 }[p.idx];
      var gx = 1.4, gy = 1.0, gw = 6.2, gh = 4.4;
      var X = function (r) { return gx + gw * (Math.log10(r) + 0.5) / 1.7; };
      var Y = function (E) { return gy + gh * (Math.log10(E) + 0.6) / 3.0; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      [0.5, 1, 2, 5, 10].forEach(function (r) {
        g.linha(X(r), gy, X(r), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(fx(r, 1), X(r), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [1, 10, 100].forEach(function (E) {
        g.linha(gx, Y(E), gx - 0.15, Y(E), { cor: 'fraco', larg: 1 });
        g.txt(E + '', gx - 0.28, Y(E), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('densidade (g/cm³)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('E (GPa)', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var melhor = null;
      mats.forEach(function (m) {
        m.idx = Math.pow(m.E, exp) / m.r;
        if (!melhor || m.idx > melhor.idx) melhor = m;
      });
      mats.forEach(function (m) {
        g.circ(X(m.r), Y(m.E), m === melhor ? 0.26 : 0.19, { preenche: m.cor, cor: m === melhor ? 'texto' : null, larg: 2, alfa: 0.9 });
        g.txt(m.n, X(m.r), Y(m.E) + (m.lab || 0.45), { cor: m.cor, tam: 10.5, fundo: true });
      });
      /* reta do índice passando pelo melhor material */
      var pts = [], i;
      for (i = 0; i <= 20; i++) {
        var r = Math.pow(10, -0.5 + 1.7 * i / 20);
        var E = Math.pow(melhor.idx * r, 1 / exp);
        if (E > 0.3 && E < 1000) pts.push([X(r), Y(E)]);
      }
      g.caminho(pts, { cor: 'erro', larg: 1.8, tracejado: [6, 4] });
      var x0 = 8.4;
      g.txt({ 1: 'barra tracionada leve', 2: 'viga leve e rígida', 3: 'placa leve e rígida' }[p.idx], x0, 5.2,
        { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('índice: ' + { 1: 'E/ρ', 2: '√E/ρ', 3: '∛E/ρ' }[p.idx], x0, 4.5, { cor: 'suave', tam: 12, alin: 'esq' });
      mats.slice().sort(function (a, b) { return b.idx - a.idx; }).slice(0, 4).forEach(function (m, k) {
        g.txt((k + 1) + '. ' + m.n + '  ' + fx(m.idx, 2), x0, 3.7 - k * 0.6, { cor: m.cor, tam: 11.5, alin: 'esq', negrito: k === 0 });
      });
      g.txt('o índice ordena candidatos; restrições de fabricação e custo eliminam parte deles', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

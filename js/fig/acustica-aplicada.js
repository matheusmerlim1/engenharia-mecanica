/* ============================================================
   Figuras ilustrativas de Acústica Aplicada
   A onda de pressão, a escala de decibéis, divergência,
   medição, bandas, Fourier, a equação da onda, interfaces,
   ondas estacionárias, escalas musicais, campo em salas,
   decaimento e isolamento. Usa a biblioteca window.AC.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.AC) return;
  var F = window.Figura.criar, AC = window.AC;
  var fx = function (v, n) { n = n == null ? 1 : n; return v.toLocaleString('pt-BR', { maximumFractionDigits: n }); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var log10 = function (v) { return Math.log(Math.max(v, 1e-12)) / Math.LN10; };
  var TAU = 2 * Math.PI;

  function escalaLog(v0, v1, x0, x1) {
    var a = log10(v0), b = log10(v1);
    return function (v) { return x0 + (x1 - x0) * (log10(lim(v, v0, v1)) - a) / (b - a); };
  }
  function decadas(v0, v1) {
    var d = [], e = Math.ceil(log10(v0));
    for (; e <= Math.floor(log10(v1)); e++) d.push(Math.pow(10, e));
    return d;
  }
  /* notacao cientifica legivel: 3,05 × 10⁻⁴ */
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
              '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function sci(v, n) {
    if (v === 0) return '0';
    var e = Math.floor(log10(Math.abs(v)));
    if (e >= -2 && e <= 3) return fx(v, Math.max(0, 2 - e));
    var m = v / Math.pow(10, e);
    return fx(m, n == null ? 2 : n) + ' × 10' + String(e).split('').map(function (c) { return SUP[c]; }).join('');
  }
  function rotHz(v) {
    if (v >= 1000) return fx(v / 1000, 1) + 'k';
    return fx(v, v < 100 ? 1 : 0);
  }

  /* ---------- 1.1 — a onda de pressão ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Som é uma flutuação de pressão que se propaga: o ar não viaja junto, ele só oscila em torno da posição de repouso. O comprimento de onda é o espaço que a perturbação percorre em um período.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'f', rot: 'Frequência', min: 50, max: 2000, val: 500, passo: 10, un: 'Hz' },
      { id: 'meio', rot: 'Meio: 1 ar · 2 hélio · 3 água · 4 aço', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'A', rot: 'Amplitude de pressão', min: 0.1, max: 5, val: 1, passo: 0.1, un: 'Pa' }
    ],
    desenhar: function (g, p, t) {
      var meios = [AC.meio('ar'), AC.meio('helio'), AC.meio('agua'), AC.meio('aco')];
      var m = meios[Math.round(p.meio) - 1];
      var lam = m.c / p.f, T = 1 / p.f, k = TAU / lam, w = TAU * p.f;
      var gx = 0.8, gw = 6.4, gy = 3.3, amp = 0.85;
      /* as partículas: densidade local mostra compressão e rarefação */
      var i, j, n = 64;
      for (i = 0; i < n; i++) {
        var x0 = i / (n - 1);
        var fase = TAU * (3 * x0) - w * t * 0.25;
        var desl = 0.028 * Math.sin(fase);
        var xx = gx + gw * (x0 + desl);
        for (j = 0; j < 4; j++) {
          /* deslocamento vertical fixo por partícula, só para não alinhar em colunas */
          var dj = 0.09 * (((i * 7 + j * 13) % 5) - 2);
          g.circ(xx, gy + 1.55 - j * 0.38 + dj, 0.055,
            { preenche: 'suave', cor: null, alfa: 0.8 });
        }
      }
      g.txt('o meio apenas oscila: nada é transportado, exceto energia', gx + gw / 2, gy + 2.3,
        { cor: 'fraco', tam: 10.5 });
      /* a onda de pressão */
      var pts = [];
      for (i = 0; i <= 200; i++) {
        var xr = i / 200;
        pts.push([gx + gw * xr, gy - 1.3 + amp * Math.sin(TAU * 3 * xr - w * t * 0.25)]);
      }
      g.linha(gx, gy - 1.3, gx + gw, gy - 1.3, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.caminho(pts, { cor: 's1', larg: 2.4 });
      g.txt('p(x, t)', gx - 0.15, gy - 1.3, { cor: 's1', tam: 11, alin: 'dir' });
      g.txt('+', gx + 0.15, gy - 1.3 + amp + 0.25, { cor: 'erro', tam: 11, alin: 'esq' });
      g.txt('−', gx + 0.15, gy - 1.3 - amp - 0.25, { cor: 's4', tam: 11, alin: 'esq' });
      /* cota de um comprimento de onda */
      var xl0 = gx + gw / 6 * (w * t * 0.25 / TAU % 1), xl1 = xl0 + gw / 3;
      g.cota(gx, gy - 1.3 - amp - 0.75, gx + gw / 3, gy - 1.3 - amp - 0.75, 'λ = ' + fx(lam, 3) + ' m', { dy: -0.3 });
      var xr2 = 7.9;
      g.txt(m.nome, xr2, 5.1, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('c = ' + fx(m.c, 0) + ' m/s', xr2, 4.5, { cor: 'suave', tam: 12, alin: 'esq' });
      [['frequência f', fx(p.f, 0) + ' Hz'],
       ['período T = 1/f', fx(T * 1000, 3) + ' ms'],
       ['comprimento λ = c/f', fx(lam, 3) + ' m'],
       ['freq. angular ω = 2πf', fx(w, 0) + ' rad/s'],
       ['número de onda k = ω/c', fx(k, 2) + ' rad/m']].forEach(function (r, idx) {
        g.txt(r[0], xr2, 3.8 - idx * 0.52, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 3.8 - idx * 0.52, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      g.txt('NPS = ' + fx(AC.nivel(p.A / Math.SQRT2), 1) + ' dB', xr2, 1.2,
        { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('(amplitude ' + fx(p.A, 2) + ' Pa sobre 101 325 Pa)', xr2, 0.7, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('c = λf é a única relação de que se precisa para começar', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — a régua do decibel ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A escala de decibéis comprime um fator de dez milhões em pressão numa régua de 0 a 140. Somar 10 dB multiplica a potência por dez e a pressão por 3,16 — e, aproximadamente, dobra a sensação de intensidade.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'nps', rot: 'Nível de pressão sonora', min: 0, max: 140, val: 85, passo: 1, un: 'dB' }
    ],
    desenhar: function (g, p) {
      var gx = 2.6, gy = 0.6, gh = 4.6;
      var Y = function (v) { return gy + gh * lim(v, 0, 140) / 140; };
      /* a régua */
      g.ret(gx, gy, 0.7, gh, { cor: 'forte', larg: 1.4, preenche: 'baixo', alfa: 0.5 });
      var marcas = [
        [0, 'limiar da audição', 'ok'],
        [20, 'estúdio silencioso', 'ok'],
        [40, 'biblioteca', 'ok'],
        [60, 'conversa a 1 m', 's1'],
        [85, 'rua movimentada · limite de 8 h', 'erro'],
        [100, 'serra circular', 'erro'],
        [120, 'limiar da dor', 'erro'],
        [140, 'turbina a jato a 25 m', 'erro']
      ];
      marcas.forEach(function (m) {
        g.linha(gx, Y(m[0]), gx + 0.7, Y(m[0]), { cor: m[2], larg: m[0] === 85 ? 2 : 1 });
        g.txt(fx(m[0], 0), gx - 0.15, Y(m[0]), { cor: 'fraco', tam: 10, alin: 'dir' });
        g.txt(m[1], gx + 1.05, Y(m[0]), { cor: m[2], tam: 10.5, alin: 'esq' });
      });
      g.txt('dB', gx + 0.35, gy + gh + 0.4, { cor: 'fraco', tam: 11 });
      /* o cursor */
      var yc = Y(p.nps);
      g.ret(gx - 0.12, yc - 0.1, 0.94, 0.2, { cor: 'texto', larg: 2, preenche: 'acento', alfa: 0.65 });
      var prms = AC.pressao(p.nps), I = Math.pow(prms, 2) / (1.21 * 343);
      var xr = 6.6;
      g.txt(fx(p.nps, 0) + ' dB', xr, 5.1, { cor: 'acento', tam: 16, alin: 'esq', negrito: true });
      [['pressão eficaz p', sci(prms) + ' Pa'],
       ['razão p/p₀', sci(prms / AC.PREF) + ' ×'],
       ['intensidade I = p²/ρc', sci(I) + ' W/m²'],
       ['razão I/I₀', sci(I / 1e-12) + ' ×'],
       ['fração da atmosfera', sci(100 * prms / 101325) + ' %']].forEach(function (r, i) {
        g.txt(r[0], xr, 4.35 - i * 0.56, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(r[1], 12.3, 4.35 - i * 0.56, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      /* a régua das somas */
      var by = 1.1;
      g.txt('somar duas fontes iguais', xr, by + 0.55, { cor: 'suave', tam: 11, alin: 'esq', negrito: true });
      g.txt('+3 dB  (o dobro da potência)', xr + 0.2, by + 0.1, { cor: 's1', tam: 11, alin: 'esq' });
      g.txt('+10 dB  →  dez vezes a potência, 3,16× a pressão', xr + 0.2, by - 0.35, { cor: 'aviso', tam: 11, alin: 'esq' });
      g.txt('+20 dB  →  cem vezes a potência, 10× a pressão', xr + 0.2, by - 0.8, { cor: 'erro', tam: 11, alin: 'esq' });
      g.txt('0 dB não é silêncio: é a referência de 20 µPa, o limiar médio da audição em 1 kHz',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — divergência geométrica ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Em campo livre a mesma potência atravessa esferas cada vez maiores: dobrar a distância custa 6 dB para uma fonte pontual e apenas 3 dB para uma fonte linear, como uma estrada.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'W', rot: 'Potência acústica da fonte', min: 0.001, max: 10, val: 0.2, passo: 0.001, un: 'W' },
      { id: 'Q', rot: 'Diretividade: 1 livre · 2 piso · 4 parede · 8 canto', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'r', rot: 'Distância do receptor', min: 1, max: 200, val: 10, passo: 1, un: 'm' }
    ],
    desenhar: function (g, p) {
      var Qs = [1, 2, 4, 8], Q = Qs[Math.round(p.Q) - 1];
      var LW = 10 * log10(p.W / 1e-12);
      var nivel = function (r) { return LW + 10 * log10(Q / (4 * Math.PI * r * r)); };
      /* desenho das frentes */
      var cx = 2.3, cy = 2.6;
      if (Q >= 2) {
        g.hachura(0.3, 0.85, 4.2, 0, { cor: 'forte' });
        cy = 1.0;
      }
      if (Q >= 4) g.hachura(0.75, 0.9, 3.6, Math.PI / 2, { cor: 'forte' });
      [0.7, 1.35, 2.0].forEach(function (R, i) {
        var a0 = Q >= 2 ? 0 : -Math.PI / 2, a1 = Q >= 4 ? Math.PI / 2 : (Q >= 2 ? Math.PI : Math.PI * 1.5);
        if (Q === 8) { a0 = 0; a1 = Math.PI / 2; }
        g.arco(cx, cy, R, a0, a1, { cor: 's1', larg: 1.8, alfa: 0.9 });
        g.txt(fx(Math.pow(2, i), 0) + 'r', cx + R * Math.cos(Math.PI / 4) + 0.1,
          cy + R * Math.sin(Math.PI / 4) + 0.1, { cor: 'fraco', tam: 9.5 });
      });
      g.circ(cx, cy, 0.14, { preenche: 'erro', cor: null });
      g.txt('W = ' + fx(p.W, 3) + ' W', cx, cy - 0.45, { cor: 'erro', tam: 10.5, fundo: true });
      g.txt('Q = ' + Q, cx, cy + 2.55, { cor: 's1', tam: 13, negrito: true });
      g.txt(['', 'esfera inteira', 'meia esfera', 'um quarto', 'um oitavo'][Math.round(p.Q)],
        cx, cy + 2.12, { cor: 'fraco', tam: 10.5 });
      /* curva NPS x distância */
      var gx = 5.9, gw = 4.1, gy = 0.9, gh = 3.9;
      var X = escalaLog(1, 200, gx, gx + gw);
      var ymax = Math.ceil(nivel(1) / 10) * 10, ymin = ymax - 60;
      var Y = function (v) { return gy + gh * lim((v - ymin) / (ymax - ymin), 0, 1); };
      decadas(1, 200).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(d, 0), X(d), gy - 0.33, { cor: 'fraco', tam: 9.5 });
      });
      var yy;
      for (yy = ymin; yy <= ymax; yy += 20) {
        g.linha(gx, Y(yy), gx + gw, Y(yy), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(yy, 0), gx - 0.15, Y(yy), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], ptsL = [], i, r;
      for (i = 0; i <= 60; i++) {
        r = Math.pow(200, i / 60);
        pts.push([X(r), Y(nivel(r))]);
        ptsL.push([X(r), Y(nivel(p.r) + 10 * log10(p.r / r))]);
      }
      g.caminho(ptsL, { cor: 's4', larg: 1.8, tracejado: [6, 4] });
      g.caminho(pts, { cor: 's1', larg: 2.4 });
      g.circ(X(p.r), Y(nivel(p.r)), 0.13, { preenche: 'erro', cor: null });
      g.txt('pontual −6 dB', gx + gw - 0.1, Y(nivel(140)) + 0.3, { cor: 's1', tam: 10, alin: 'dir', fundo: true });
      g.txt('linear −3 dB', gx + gw - 0.1, Y(nivel(p.r) + 10 * log10(p.r / 140)) + 0.3,
        { cor: 's4', tam: 10, alin: 'dir', fundo: true });
      g.txt('distância (m, log)', gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 10.5 });
      g.txt('NPS (dB)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('NWS = ' + fx(LW, 1) + ' dB', 10.3, 5.1, { cor: 'suave', tam: 12, alin: 'esq', negrito: true });
      g.txt('a ' + fx(p.r, 0) + ' m:', 10.3, 4.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(nivel(p.r), 1) + ' dB', 10.3, 4.0, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('o ganho de Q', 10.3, 3.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('+' + fx(10 * log10(Q), 1) + ' dB', 10.3, 2.75, { cor: 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('refletir metade', 10.3, 2.2, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('do espaço dobra', 10.3, 1.85, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('a intensidade', 10.3, 1.5, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('a inclinação da reta no log-log é a assinatura do tipo de fonte', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — o sonômetro ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'O medidor não lê pressão: ele eleva ao quadrado, integra num tempo e só então converte em decibéis. Para um sinal permanente a constante de tempo não importa; para um impulso, ela muda o resultado em dezenas de decibéis.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Sinal: 1 tom contínuo · 2 pulso único · 3 ruído intermitente', min: 1, max: 3, val: 2, passo: 1 },
      { id: 'dur', rot: 'Duração do pulso', min: 1, max: 500, val: 60, passo: 1, un: 'ms' },
      { id: 'A', rot: 'Amplitude', min: 0.1, max: 5, val: 1, passo: 0.1, un: 'Pa' }
    ],
    desenhar: function (g, p) {
      var tipo = Math.round(p.tipo), Ttot = 1.2;            /* s mostrados */
      var dur = p.dur / 1000;
      function sinal(t) {
        if (tipo === 1) return p.A * Math.sin(TAU * 60 * t);
        if (tipo === 2) return (t > 0.25 && t < 0.25 + dur) ? p.A : 0;
        return (Math.floor(t / 0.2) % 2 === 0) ? p.A * Math.sin(TAU * 60 * t) : 0;
      }
      var gx = 0.8, gw = 6.6, gy = 3.2, gh = 1.5;
      var X = function (t) { return gx + gw * t / Ttot; };
      var Y = function (v) { return gy + gh / 2 * lim(v / (p.A * 1.25), -1, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      var pts = [], i, tt;
      for (i = 0; i <= 600; i++) { tt = Ttot * i / 600; pts.push([X(tt), Y(sinal(tt))]); }
      g.caminho(pts, { cor: 's1', larg: 1.6 });
      g.txt('p(t)', gx - 0.15, gy, { cor: 's1', tam: 11, alin: 'dir' });
      /* nível indicado com cada constante de tempo */
      var consts = [{ n: 'Slow', tau: 1.0, c: 's4' }, { n: 'Fast', tau: 0.125, c: 'aviso' }, { n: 'Impulse', tau: 0.035, c: 'erro' }];
      var by = 0.9, bh = 1.5;
      var Yq = function (v, vmax) { return by + bh * lim(v / vmax, 0, 1); };
      /* média quadrática deslizante de cada constante */
      var dt = Ttot / 600;
      var series = consts.map(function (c) {
        var acc = 0, s = [];
        for (i = 0; i <= 600; i++) {
          tt = Ttot * i / 600;
          var x = sinal(tt);
          acc += (x * x - acc) * dt / c.tau;
          s.push(acc);
        }
        return s;
      });
      var qmax = Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s); })) * 1.2 || 1;
      g.linha(gx, by, gx + gw, by, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, by, gx, by + bh, { cor: 'fraco', larg: 1.2 });
      consts.forEach(function (c, k) {
        var pp = [];
        for (i = 0; i <= 600; i++) pp.push([X(Ttot * i / 600), Yq(series[k][i], qmax)]);
        g.caminho(pp, { cor: c.c, larg: 1.8 });
      });
      g.txt('p² integrado (a leitura do medidor)', gx + gw / 2, by + bh + 0.3, { cor: 'fraco', tam: 10.5 });
      g.txt('tempo (s)', gx + gw / 2, by - 0.68, { cor: 'fraco', tam: 10.5 });
      [0, 0.3, 0.6, 0.9, 1.2].forEach(function (tk) {
        g.linha(X(tk), by, X(tk), by - 0.12, { cor: 'fraco', larg: 1 });
        g.txt(fx(tk, 1), X(tk), by - 0.3, { cor: 'fraco', tam: 9 });
      });
      var xr = 7.9;
      g.txt('nível máximo indicado', xr, 5.1, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      consts.forEach(function (c, k) {
        var mx = Math.max.apply(null, series[k]);
        var nps = mx > 0 ? AC.nivel(Math.sqrt(mx)) : 0;
        g.ret(xr, 4.25 - k * 0.78, 0.24, 0.24, { preenche: c.c, cor: null });
        g.txt(c.n + ' (τ = ' + fx(c.tau * 1000, 0) + ' ms)', xr + 0.38, 4.37 - k * 0.78,
          { cor: c.c, tam: 11, alin: 'esq' });
        g.txt(fx(nps, 1) + ' dB', 12.3, 4.37 - k * 0.78, { cor: 'texto', tam: 13, alin: 'dir', negrito: true });
      });
      var difs = consts.map(function (c, k) { var mx = Math.max.apply(null, series[k]); return mx > 0 ? AC.nivel(Math.sqrt(mx)) : 0; });
      g.txt('Impulse − Slow = ' + fx(difs[2] - difs[0], 1) + ' dB', xr, 1.85,
        { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(tipo === 1 ? 'sinal permanente: as três constantes' : 'evento curto: a constante de tempo',
        xr, 1.25, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(tipo === 1 ? 'convergem para o mesmo valor' : 'decide o que o medidor mostra',
        xr, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('o filtro é exponencial e chega a um pouco menos que energia/τ — por isso a norma exige declarar a ponderação',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — bandas e ponderação ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Bandas de largura relativa constante: cada oitava dobra a frequência, e por isso fica larga nos agudos e estreita nos graves. Sobre elas, a ponderação A despreza os graves — que o ouvido realmente escuta mal, mas que a estrutura sente.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'larg', rot: 'Largura: 1 oitava · 2 terço de oitava', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'pond', rot: 'Mostrar ponderação: 0 nenhuma · 1 A · 2 A e C', min: 0, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var gx = 1.2, gw = 9.6, gy = 1.5, gh = 1.35;
      var X = escalaLog(16, 22000, gx, gx + gw);
      var oitava = Math.round(p.larg) === 1;
      var NOM = { 31: '31,5', 63: '63', 125: '125', 250: '250', 500: '500',
                  1000: '1k', 2000: '2k', 4000: '4k', 8000: '8k', 16000: '16k' };
      var centros = [], k;
      if (oitava) { for (k = -5; k <= 4; k++) centros.push(1000 * Math.pow(2, k)); }
      else { for (k = -15; k <= 13; k++) centros.push(1000 * Math.pow(2, k / 3)); }
      var razao = oitava ? Math.SQRT2 : Math.pow(2, 1 / 6);

      decadas(16, 22000).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh + 2.9, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      });
      var n = 0;
      centros.forEach(function (c, i) {
        var f0 = c / razao, f1 = c * razao;
        if (f1 < 16 || f0 > 22000) return;
        n++;
        g.ret(X(f0), gy, X(f1) - X(f0), gh,
          { cor: 'fundo', larg: 1, preenche: i % 2 ? 's1' : 's2', alfa: 0.6 });
        if (oitava) {
          g.txt(NOM[Math.round(c)] || rotHz(c), (X(f0) + X(f1)) / 2, gy - 0.32,
            { cor: 'suave', tam: 9.5 });
        } else if (Math.abs(Math.round(3 * log10(c / 1000) / log10(2)) % 3) === 0) {
          g.txt(NOM[Math.round(c)] || rotHz(c), (X(f0) + X(f1)) / 2, gy - 0.32,
            { cor: 'suave', tam: 9 });
        }
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.txt('frequência (Hz, log)', gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 11 });

      /* curvas de ponderação, num painel próprio acima das bandas */
      var py = gy + gh + 0.55, ph = 1.45;
      var Yp = function (v) { return py + ph * lim((v + 55) / 60, 0, 1); };
      g.linha(gx, Yp(0), gx + gw, Yp(0), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      g.txt('0 dB', gx - 0.12, Yp(0), { cor: 'fraco', tam: 9, alin: 'dir' });
      g.txt('−25', gx - 0.12, Yp(-25), { cor: 'fraco', tam: 9, alin: 'dir' });
      g.txt('−50', gx - 0.12, Yp(-50), { cor: 'fraco', tam: 9, alin: 'dir' });
      if (Math.round(p.pond) >= 1) {
        var ptsA = [], ptsC = [], i, f;
        for (i = 0; i <= 140; i++) {
          f = 16 * Math.pow(22000 / 16, i / 140);
          ptsA.push([X(f), Yp(AC.pondA(f))]);
          ptsC.push([X(f), Yp(AC.pondC(f))]);
        }
        g.caminho(ptsA, { cor: 'erro', larg: 2.2 });
        g.txt('ponderação A', X(150), Yp(AC.pondA(150)) - 0.3, { cor: 'erro', tam: 10, fundo: true });
        if (Math.round(p.pond) === 2) {
          g.caminho(ptsC, { cor: 'aviso', larg: 1.8, tracejado: [6, 4] });
          g.txt('C', X(28), Yp(AC.pondC(28)) + 0.3, { cor: 'aviso', tam: 10, fundo: true });
        }
        g.txt('correção (dB)', gx + gw - 0.1, Yp(-45), { cor: 'fraco', tam: 10, alin: 'dir' });
      }

      g.txt((oitava ? 'bandas de oitava' : 'bandas de 1/3 de oitava') + ' — ' + n + ' no espectro audível',
        gx + gw / 2, 5.45, { cor: 'texto', tam: 12.5, negrito: true });
      g.txt(oitava ? 'largura = 70,7 % da frequência central'
                   : 'largura = 23,1 % da frequência central',
        gx + gw / 2, 5.05, { cor: 'fraco', tam: 10.5 });
      var exemplos = oitava
        ? '1 kHz: de 707 a 1414 Hz (707 Hz de largura) · 63 Hz: de 44,5 a 89 Hz (44 Hz)'
        : '1 kHz: de 891 a 1122 Hz (231 Hz) · 63 Hz: de 56 a 70,7 Hz (14,7 Hz)';
      g.txt(exemplos, gx + gw / 2, -0.5, { cor: 'suave', tam: 10.5 });
      g.txt('o ouvido analisa em bandas relativas, não absolutas — por isso o eixo é logarítmico',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — síntese de Fourier ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Qualquer sinal periódico é uma soma de senoides harmônicas. O espectro à direita é o mesmo sinal visto de outro ângulo — e é essa a representação em que a acústica trabalha.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'forma', rot: 'Forma: 1 quadrada · 2 dente de serra · 3 triangular', min: 1, max: 3, val: 1, passo: 1 },
      { id: 'N', rot: 'Harmônicos somados', min: 1, max: 40, val: 5, passo: 1 }
    ],
    desenhar: function (g, p) {
      var forma = Math.round(p.forma), N = Math.round(p.N);
      /* coeficientes a_n para cada forma, normalizados pelo fundamental */
      function coef(n) {
        if (forma === 1) return (n % 2 === 1) ? 4 / (n * Math.PI) : 0;
        if (forma === 2) return 2 / (n * Math.PI) * (n % 2 === 1 ? 1 : -1);
        return (n % 2 === 1) ? 8 / (Math.PI * Math.PI * n * n) * (((n - 1) / 2) % 2 === 0 ? 1 : -1) : 0;
      }
      function soma(x, nmax) {
        var s = 0, n;
        for (n = 1; n <= nmax; n++) {
          var a = coef(n);
          if (!a) continue;
          s += a * (forma === 3 ? Math.sin(TAU * n * x) : Math.sin(TAU * n * x));
        }
        return s;
      }
      var gx = 0.8, gw = 5.6, gy = 3.0, amp = 1.5;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      /* alvo */
      var alvo = [], i, x;
      for (i = 0; i <= 400; i++) {
        x = 2 * i / 400;
        var v;
        if (forma === 1) v = Math.sin(TAU * x) >= 0 ? 1 : -1;
        else if (forma === 2) v = 2 * (x - Math.floor(x + 0.5));
        else v = 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1;
        alvo.push([gx + gw * i / 400, gy + amp * 0.52 * v]);
      }
      g.caminho(alvo, { cor: 'fraco', larg: 1.4, tracejado: [5, 4] });
      var pts = [];
      for (i = 0; i <= 500; i++) {
        x = 2 * i / 500;
        pts.push([gx + gw * i / 500, gy + amp * 0.52 * soma(x, N)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.2 });
      g.txt('soma de ' + N + ' harmônico' + (N > 1 ? 's' : ''), gx + gw / 2, gy + amp + 0.45,
        { cor: 's1', tam: 12, negrito: true });
      g.txt('alvo', gx + gw - 0.1, gy - amp - 0.25, { cor: 'fraco', tam: 10, alin: 'dir' });
      /* espectro */
      var ex = 7.3, ew = 4.4, ey = 1.5, eh = 2.4;
      g.linha(ex, ey, ex + ew, ey, { cor: 'fraco', larg: 1.2 });
      g.linha(ex, ey, ex, ey + eh, { cor: 'fraco', larg: 1.2 });
      var nmax = 21;
      var amax = Math.abs(coef(1));
      for (i = 1; i <= nmax; i++) {
        var a = Math.abs(coef(i));
        if (!a) continue;
        var xb = ex + ew * (i - 0.5) / nmax;
        g.linha(xb, ey, xb, ey + eh * a / amax, { cor: i <= N ? 's1' : 'fraco', larg: 3.2 });
        if (i <= 9 && (i === 1 || i % 2 === 1)) g.txt(fx(i, 0), xb, ey - 0.28, { cor: 'fraco', tam: 9 });
      }
      g.txt('ordem do harmônico', ex + ew / 2, ey - 0.62, { cor: 'fraco', tam: 10.5 });
      g.txt('amplitude', ex - 0.1, ey + eh + 0.28, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var decaimento = forma === 3 ? '1/n² — 12 dB por oitava' : '1/n — 6 dB por oitava';
      g.txt(['', 'onda quadrada', 'dente de serra', 'triangular'][forma], ex + ew / 2, 5.45,
        { cor: 'texto', tam: 12.5, negrito: true });
      g.txt(forma === 2 ? 'todos os harmônicos' : 'só os ímpares', ex + ew / 2, 5.05,
        { cor: 'suave', tam: 11 });
      g.txt('decaimento ' + decaimento, ex + ew / 2, 4.67, { cor: 'fraco', tam: 10.5 });
      if (forma !== 2) {
        g.txt('3º harmônico: ' + fx(20 * log10(Math.abs(coef(3) / coef(1))), 1) + ' dB',
          ex + ew / 2, 0.55, { cor: 'fraco', tam: 10.5 });
      }
      g.txt('quanto mais abrupta a forma de onda, mais devagar o espectro decai', 6, -1.1,
        { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — a equação da onda ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'A solução de D’Alembert: qualquer perturbação se decompõe em uma parte que anda para a direita e outra para a esquerda, ambas com a mesma forma e velocidade c. Numa onda progressiva, pressão e velocidade de partícula andam em fase.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'modo', rot: 'Modo: 1 só progressiva · 2 as duas · 3 regressiva', min: 1, max: 3, val: 2, passo: 1 },
      { id: 'vel', rot: 'Velocidade da animação', min: 0, max: 3, val: 1, passo: 0.1 }
    ],
    desenhar: function (g, p, t) {
      var modo = Math.round(p.modo), s = t * p.vel * 0.6;
      var gx = 0.8, gw = 10.6, gy = 4.0, amp = 0.85;
      var yf = 2.25, yg = 1.05;                 /* faixas das duas componentes */
      function pulso(u) { return Math.exp(-Math.pow((u % 2 + 2) % 2 - 1, 2) / 0.012); }
      function f1(x) { return pulso((x - s) / 2 + 0.5); }
      function f2(x) { return pulso((x + s) / 2 + 0.5); }
      var i, x, pts = [], p1 = [], p2 = [];
      for (i = 0; i <= 400; i++) {
        x = 4 * i / 400;
        var a = modo <= 2 ? f1(x) : 0, b = modo >= 2 ? f2(x) : 0;
        pts.push([gx + gw * i / 400, gy + amp * (a + b)]);
        p1.push([gx + gw * i / 400, yf + amp * 0.55 * a]);
        p2.push([gx + gw * i / 400, yg + amp * 0.55 * b]);
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.caminho(pts, { cor: 's1', larg: 2.4 });
      g.txt('p(x, t) = f(x − ct) + g(x + ct)', gx + gw / 2, gy + amp + 0.55,
        { cor: 's1', tam: 13, negrito: true });
      g.linha(gx, yf, gx + gw, yf, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.linha(gx, yg, gx + gw, yg, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      if (modo <= 2) {
        g.caminho(p1, { cor: 'ok', larg: 1.8 });
        g.seta(gx + gw * 0.80, yf + 0.52, 0.6, 0, { cor: 'ok', larg: 1.8, ponta: 0.18 });
        g.txt('f(x − ct)', gx + gw * 0.80 - 0.15, yf + 0.52, { cor: 'ok', tam: 11, alin: 'dir' });
      } else {
        g.txt('(desligada)', gx + 0.2, yf + 0.3, { cor: 'fraco', tam: 10, alin: 'esq' });
      }
      if (modo >= 2) {
        g.caminho(p2, { cor: 'erro', larg: 1.8 });
        g.seta(gx + gw * 0.20, yg + 0.52, -0.6, 0, { cor: 'erro', larg: 1.8, ponta: 0.18 });
        g.txt('g(x + ct)', gx + gw * 0.20 + 0.15, yg + 0.52, { cor: 'erro', tam: 11, alin: 'esq' });
      } else {
        g.txt('(desligada)', gx + 0.2, yg + 0.3, { cor: 'fraco', tam: 10, alin: 'esq' });
      }
      g.txt('na onda progressiva, v = p/ρc: pressão e velocidade de partícula em fase',
        gx + gw / 2, 0.25, { cor: 'fraco', tam: 11 });
      g.txt(modo === 2 ? 'com as duas, a soma já não é uma onda viajante: é um padrão que pulsa'
        : 'uma única onda viajante mantém a forma e apenas se desloca',
        gx + gw / 2, -0.2, { cor: 'suave', tam: 11 });
      g.txt('∂²p/∂x² = (1/c²) ∂²p/∂t²  —  a equação da onda em uma dimensão', 6, -1.1,
        { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — interface entre meios ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Na interface, o que decide é a razão entre as impedâncias ρc. Com impedâncias muito diferentes quase tudo volta; com impedâncias próximas, quase tudo passa — e a pressão transmitida pode ser maior que a incidente sem violar nada.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'par', rot: 'Par: 1 ar→água · 2 água→glicerina · 3 ar→CO₂ · 4 aço→ar · 5 ar→concreto', min: 1, max: 5, val: 1, passo: 1 },
      { id: 'vel', rot: 'Velocidade da animação', min: 0, max: 3, val: 1, passo: 0.1 }
    ],
    desenhar: function (g, p, t) {
      var pares = [['ar', 'agua'], ['agua', 'glicerina'], ['ar', 'co2'], ['aco', 'ar'], ['ar', 'concreto']];
      var par = pares[Math.round(p.par) - 1];
      var m1 = AC.meio(par[0]), m2 = AC.meio(par[1]);
      var z1 = m1.rho * m1.c, z2 = m2.rho * m2.c;
      var R = (z2 - z1) / (z2 + z1), T = 1 + R;
      var tau = 4 * z1 * z2 / Math.pow(z1 + z2, 2), TL = -10 * log10(tau);
      var xi = 5.4, gy = 3.2, amp = 0.7, gx = 0.6, gw = 10.8;
      g.ret(gx, 1.5, xi - gx, 3.6, { cor: null, preenche: 's1', alfa: 0.07 });
      g.ret(xi, 1.5, gx + gw - xi, 3.6, { cor: null, preenche: 'erro', alfa: 0.07 });
      g.linha(xi, 1.5, xi, 5.1, { cor: 'forte', larg: 2.4 });
      g.txt(m1.nome, (gx + xi) / 2, 5.3, { cor: 's1', tam: 11.5, negrito: true });
      g.txt(m2.nome, (xi + gx + gw) / 2, 5.3, { cor: 'erro', tam: 11.5, negrito: true });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      /* o deslocamento começa com o pulso já visível, para a figura nunca aparecer vazia */
      var s = ((t * p.vel * 0.9 + 1.6) % 6.4) - 1.2;
      function pul(u) { return Math.exp(-u * u / 0.06); }
      var i, x, pts = [];
      for (i = 0; i <= 500; i++) {
        x = gx + gw * i / 500;
        var v = 0;
        var xi0 = xi - gx;
        var pos = (x - gx) / gw * 6;
        if (x < xi) {
          v += pul(pos - s);                        /* incidente, indo para a direita */
          var xr = 2 * ((xi - gx) / gw * 6) - pos;  /* refletida, espelhada */
          v += R * pul(xr - s);
        } else {
          var esc = m2.c / m1.c;
          var pos2 = ((xi - gx) / gw * 6) + (pos - (xi - gx) / gw * 6) / esc;
          v += T * pul(pos2 - s);
        }
        pts.push([x, gy + amp * v]);
      }
      g.caminho(pts, { cor: 'texto', larg: 2.2 });
      var xr2 = 0.6;
      g.txt('incidente', 1.6, gy + amp + 0.42, { cor: 's1', tam: 10.5 });
      if (Math.abs(R) > 0.05) g.txt('refletida', 3.4, gy - amp - 0.42, { cor: 's4', tam: 10.5 });
      g.txt('transmitida', 8.2, Math.min(4.8, gy + amp * Math.abs(T) + 0.42), { cor: 'erro', tam: 10.5 });
      /* painel numérico */
      var by = 1.0;
      [['z₁ = ρ₁c₁', fx(z1, 0) + ' rayl', 's1'],
       ['z₂ = ρ₂c₂', fx(z2, 0) + ' rayl', 'erro'],
       ['R = (z₂−z₁)/(z₂+z₁)', fx(R, 3), 'texto'],
       ['T = 1 + R', fx(T, 3), 'texto'],
       ['τ (intensidade)', fx(100 * tau, 2) + ' %', 'ok'],
       ['TL = −10 log τ', fx(TL, 2) + ' dB', 'aviso']].forEach(function (r, k) {
        var cx = gx + (k % 3) * 3.7, cy = by - Math.floor(k / 3) * 0.52;
        g.txt(r[0], cx, cy, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(r[1], cx + 3.3, cy, { cor: r[2], tam: 11, alin: 'dir', negrito: true });
      });
      g.txt(Math.abs(R) > 0.9 ? 'quase tudo volta: a interface é praticamente uma parede'
        : Math.abs(R) < 0.15 ? 'quase tudo passa: as impedâncias estão casadas'
          : 'parte volta, parte passa', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — ondas estacionárias ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Entre dois contornos, só sobrevivem as frequências cujo meio comprimento de onda cabe um número inteiro de vezes. Nos nós a pressão é sempre nula e nos ventres ela é máxima — e é por isso que, numa sala com modos, andar um passo muda o que se ouve.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'tubo', rot: 'Tubo: 1 fechado-fechado · 2 aberto-fechado · 3 aberto-aberto', min: 1, max: 3, val: 1, passo: 1 },
      { id: 'n', rot: 'Modo', min: 1, max: 5, val: 1, passo: 1 },
      { id: 'L', rot: 'Comprimento do tubo', min: 0.2, max: 4, val: 1, passo: 0.05, un: 'm' }
    ],
    desenhar: function (g, p, t) {
      var tipo = Math.round(p.tubo), n = Math.round(p.n), L = p.L, c = 343;
      /* fechado-fechado e aberto-aberto: f = n c / 2L ; aberto-fechado: (2n-1) c / 4L */
      var f, perfil;
      if (tipo === 2) {
        f = (2 * n - 1) * c / (4 * L);
        perfil = function (u) { return Math.cos((2 * n - 1) * Math.PI * u / 2); };  /* ventre em u=0 (fechado) */
      } else {
        f = n * c / (2 * L);
        perfil = tipo === 1
          ? function (u) { return Math.cos(n * Math.PI * u); }
          : function (u) { return Math.sin(n * Math.PI * u); };
      }
      var gx = 1.0, gw = 7.4, gy = 3.3, amp = 1.2;
      /* paredes do tubo */
      g.ret(gx, gy - 1.6, gw, 3.2, { cor: 'forte', larg: 1.6 });
      if (tipo !== 3) g.hachura(gx, gy - 1.6, 3.2, Math.PI / 2, { cor: 'forte' });
      if (tipo === 1) g.hachura(gx + gw, gy - 1.6, 3.2, Math.PI / 2, { cor: 'forte' });
      g.txt(tipo === 1 ? 'fechado' : 'fechado', gx, gy + 2.0, { cor: 'fraco', tam: 10 });
      g.txt(tipo === 1 ? 'fechado' : 'aberto', gx + gw, gy + 2.0, { cor: 'fraco', tam: 10 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      /* envoltória e instante */
      var i, u, env = [], envN = [], agora = [];
      for (i = 0; i <= 300; i++) {
        u = i / 300;
        var v = perfil(u);
        env.push([gx + gw * u, gy + amp * v]);
        envN.push([gx + gw * u, gy - amp * v]);
        agora.push([gx + gw * u, gy + amp * v * Math.cos(TAU * 1.2 * t)]);
      }
      g.caminho(env, { cor: 'fraco', larg: 1.2, tracejado: [5, 4] });
      g.caminho(envN, { cor: 'fraco', larg: 1.2, tracejado: [5, 4] });
      g.caminho(agora, { cor: 's1', larg: 2.4 });
      /* nós */
      var nos = [];
      for (i = 0; i <= 400; i++) {
        u = i / 400;
        if (i > 0) {
          var a = perfil((i - 1) / 400), b = perfil(u);
          if (a * b < 0) nos.push((u + (i - 1) / 400) / 2);
        }
      }
      nos.forEach(function (un) {
        g.circ(gx + gw * un, gy, 0.1, { preenche: 'erro', cor: null });
        g.txt('nó', gx + gw * un, gy - 0.35, { cor: 'erro', tam: 9 });
      });
      g.cota(gx, gy - 1.95, gx + gw, gy - 1.95, 'L = ' + fx(L, 2) + ' m', { dy: -0.28 });
      var xr = 8.9;
      g.txt('modo ' + n, xr, 5.1, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(tipo === 2 ? 'f = (2n−1)c/4L' : 'f = nc/2L', xr, 4.5, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(fx(f, 1) + ' Hz', xr, 3.9, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('λ = ' + fx(c / f, 3) + ' m', xr, 3.3, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt(nos.length + ' nó' + (nos.length === 1 ? '' : 's') + ' de pressão', xr, 2.7,
        { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.txt('fundamental: ' + fx(tipo === 2 ? c / (4 * L) : c / (2 * L), 1) + ' Hz', xr, 2.0,
        { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(tipo === 2 ? 'só harmônicos ímpares' : 'todos os harmônicos', xr, 1.5,
        { cor: 'aviso', tam: 11, alin: 'esq' });
      g.txt(tipo === 2 ? '(clarinete, tubo de órgão fechado)' : tipo === 3 ? '(flauta, tubo aberto)' : '(sala entre paredes rígidas)',
        xr, 1.05, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('num tubo fechado a extremidade é ventre de pressão e nó de velocidade', 6, -1.1,
        { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — escalas musicais ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'A série harmônica dá intervalos de razões simples, e foi dela que nasceu a escala pitagórica. A escala temperada divide a oitava em doze partes iguais: nenhum intervalo fica exato, mas todos ficam igualmente aceitáveis em qualquer tonalidade.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'f0', rot: 'Frequência da fundamental', min: 55, max: 880, val: 440, passo: 1, un: 'Hz' },
      { id: 'vista', rot: 'Ver: 1 série harmônica · 2 pitagórica × temperada', min: 1, max: 2, val: 2, passo: 1 }
    ],
    desenhar: function (g, p) {
      var f0 = p.f0, vista = Math.round(p.vista);
      var gx = 1.0, gw = 10.0;
      if (vista === 1) {
        var X = escalaLog(f0 * 0.9, f0 * 17, gx, gx + gw);
        var gy = 2.2;
        g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
        var nomes = ['1 fund.', '2 oitava', '3 quinta', '4 oitava', '5 terça M', '6 quinta',
                     '7 sétima ♭', '8 oitava', '9 segunda', '10 terça M', '11 ~trítono', '12 quinta',
                     '13 ~sexta', '14 sétima ♭', '15 sétima M', '16 oitava'];
        var n;
        for (n = 1; n <= 16; n++) {
          var fh = f0 * n;
          var h = 2.4 / Math.sqrt(n);
          g.linha(X(fh), gy, X(fh), gy + h, { cor: n === 1 ? 'erro' : (Math.log(n) / Math.LN2 % 1 === 0 ? 'ok' : 's1'), larg: 2.6 });
          if (n <= 8 || n % 2 === 0) {
            g.txt(nomes[n - 1], X(fh), gy + h + 0.22, { cor: 'suave', tam: 9, fundo: true });
          }
          if (n <= 6) g.txt(fx(fh, 0), X(fh), gy - 0.3, { cor: 'fraco', tam: 9 });
        }
        g.txt('frequência (Hz, log) — os harmônicos são múltiplos inteiros da fundamental',
          gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 11 });
        g.txt('a oitava (2:1), a quinta (3:2) e a terça maior (5:4) saem dos primeiros termos',
          gx + gw / 2, 5.1, { cor: 'texto', tam: 12, negrito: true });
        g.txt('do 7º em diante, os harmônicos não coincidem com nota alguma da escala ocidental',
          gx + gw / 2, 4.65, { cor: 'fraco', tam: 10.5 });
      } else {
        /* régua de cents: pitagórica acima, temperada abaixo */
        var notas = [
          ['C', 1, 0], ['D', 9 / 8, 2], ['E', 81 / 64, 4], ['F', 4 / 3, 5],
          ['G', 3 / 2, 7], ['A', 27 / 16, 9], ['B', 243 / 128, 11], ['C\u2032', 2, 12]
        ];
        var ry = 2.9, Xc = function (c) { return gx + gw * lim(c / 1200, 0, 1); };
        g.linha(gx, ry, gx + gw, ry, { cor: 'fraco', larg: 1.4 });
        var k2;
        for (k2 = 0; k2 <= 12; k2++) {
          var ct = k2 * 100;
          g.linha(Xc(ct), ry, Xc(ct), ry - 0.26, { cor: 'aviso', larg: 1.6 });
        }
        g.txt('temperada — 12 semitons iguais de 100 cents', gx + gw / 2, ry - 1.25,
          { cor: 'aviso', tam: 11, negrito: true });
        g.txt('pitagórica — empilhando quintas de razão 3:2', gx + gw / 2, ry + 2.08,
          { cor: 's1', tam: 11, negrito: true });
        notas.forEach(function (nn, idx) {
          var cPit = 1200 * Math.log(nn[1]) / Math.LN2;
          var cTemp = nn[2] * 100;
          var dev = cPit - cTemp;
          var cor = Math.abs(dev) < 0.5 ? 'ok' : dev > 0 ? 'erro' : 's4';
          g.linha(Xc(cPit), ry, Xc(cPit), ry + 0.3, { cor: 's1', larg: 2.2 });
          g.txt(nn[0], Xc(cTemp), ry - 0.52, { cor: 'texto', tam: 12, negrito: true });
          /* E e F ficam a 59 cents um do outro: escalona o rótulo para não colidir */
          g.txt(fx(f0 * nn[1], 1) + ' Hz', Xc(cPit), ry + (idx % 2 ? 0.86 : 0.58),
            { cor: 's1', tam: 9.5, fundo: true });
          g.txt((dev > 0 ? '+' : '') + fx(dev, 1), Xc(cPit), ry + 1.25,
            { cor: cor, tam: 10.5, negrito: true, fundo: true });
          if (Math.abs(dev) > 0.5) {
            g.linha(Xc(cTemp), ry - 0.26, Xc(cPit), ry + 0.3, { cor: cor, larg: 1, tracejado: [3, 3] });
          }
        });
        g.txt('desvio da pitagórica, em cents', gx + gw / 2, ry + 1.68, { cor: 'fraco', tam: 10 });
        [0, 300, 600, 900, 1200].forEach(function (ct) {
          g.txt(fx(ct, 0), Xc(ct), ry - 0.95, { cor: 'fraco', tam: 9 });
        });
        g.txt('a quinta pitagórica está só 2,0 cents acima da temperada; a terça maior, 7,8 cents',
          gx + gw / 2, 5.5, { cor: 'texto', tam: 11.5, negrito: true });
        g.txt('doze quintas justas dão 1,0136 oitava: sobra o coma pitagórico, de 23,5 cents',
          gx + gw / 2, 5.12, { cor: 'fraco', tam: 10.5 });
      }
      g.txt('um cent é 1/100 de semitom: o limiar de percepção fica em torno de 5 cents', 6, -1.1,
        { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 11.1 — campo direto e reverberante ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Numa sala, o nível é a soma do campo direto, que cai 6 dB por dobro de distância, com o campo reverberante, que é o mesmo em toda parte. Além da distância crítica, afastar-se da fonte deixa de adiantar.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'alfa', rot: 'Absorção média da sala', min: 0.02, max: 0.9, val: 0.15, passo: 0.01 },
      { id: 'S', rot: 'Superfície total da sala', min: 50, max: 3000, val: 200, passo: 10, un: 'm²' },
      { id: 'Q', rot: 'Diretividade: 1 livre · 2 piso · 4 parede · 8 canto', min: 1, max: 4, val: 2, passo: 1 }
    ],
    desenhar: function (g, p) {
      var Qs = [1, 2, 4, 8], Q = Qs[Math.round(p.Q) - 1];
      var R = p.S * p.alfa / (1 - p.alfa);
      var rc = Math.sqrt(Q * R / (16 * Math.PI));
      var LW = 100;
      var dir = function (r) { return LW + 10 * log10(Q / (4 * Math.PI * r * r)); };
      var rev = LW + 10 * log10(4 / R);
      var tot = function (r) { return LW + 10 * log10(Q / (4 * Math.PI * r * r) + 4 / R); };
      var gx = 1.3, gw = 6.2, gy = 1.0, gh = 4.0;
      var X = escalaLog(0.2, 60, gx, gx + gw);
      var ymax = Math.ceil(tot(0.2) / 10) * 10, ymin = ymax - 50;
      var Y = function (v) { return gy + gh * lim((v - ymin) / (ymax - ymin), 0, 1); };
      decadas(0.2, 60).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(d, d < 1 ? 1 : 0), X(d), gy - 0.33, { cor: 'fraco', tam: 9.5 });
      });
      var yy;
      for (yy = ymin; yy <= ymax; yy += 10) {
        g.linha(gx, Y(yy), gx + gw, Y(yy), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(yy, 0), gx - 0.15, Y(yy), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pd = [], pt = [], pr = [], i, r;
      for (i = 0; i <= 120; i++) {
        r = 0.2 * Math.pow(300, i / 120);
        pd.push([X(r), Y(dir(r))]);
        pt.push([X(r), Y(tot(r))]);
        pr.push([X(r), Y(rev)]);
      }
      g.caminho(pd, { cor: 's4', larg: 1.6, tracejado: [6, 4] });
      g.caminho(pr, { cor: 'aviso', larg: 1.6, tracejado: [6, 4] });
      g.caminho(pt, { cor: 's1', larg: 2.6 });
      g.linha(X(rc), gy, X(rc), gy + gh, { cor: 'erro', larg: 1.8, tracejado: [5, 4] });
      g.txt('r_c', X(rc), gy + gh + 0.28, { cor: 'erro', tam: 11, negrito: true });
      g.txt('direto', gx + 0.45, Y(dir(0.35)) + 0.3, { cor: 's4', tam: 10, alin: 'esq', fundo: true });
      g.txt('reverberante', gx + gw - 0.15, Y(rev) + 0.3, { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      g.txt('total', gx + gw - 0.15, Y(tot(40)) - 0.35, { cor: 's1', tam: 10, alin: 'dir', fundo: true });
      g.txt('distância à fonte (m, log)', gx + gw / 2, gy - 0.78, { cor: 'fraco', tam: 10.5 });
      g.txt('NPS relativo (dB)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 8.1;
      g.txt('constante da sala', xr, 5.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('R = Sᾱ/(1−ᾱ) = ' + fx(R, 1) + ' m²', xr, 4.6, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('distância crítica', xr, 3.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('r_c = √(QR/16π) = ' + fx(rc, 2) + ' m', xr, 3.4, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('ganho de nível pela', xr, 2.65, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('reverberação, longe da fonte:', xr, 2.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('+' + fx(rev - dir(10) > 0 ? rev - dir(10) : 0, 1) + ' dB a 10 m', xr, 1.85,
        { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('dobrar a absorção da sala', xr, 1.15, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('reduz o campo reverberante', xr, 0.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('em apenas 3 dB', xr, 0.45, { cor: 'suave', tam: 11, alin: 'esq', negrito: true });
      g.txt('tratar a sala só ajuda além de r_c; perto da fonte, é preciso atacar a fonte', 6, -1.1,
        { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 12.1 — curva de decaimento ---------- */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'A integração reversa de Schroeder transforma uma resposta impulsiva ruidosa numa curva de decaimento lisa. Dela saem o tempo de reverberação e os parâmetros de clareza — e quando o decaimento não é reto, EDT, T20 e T30 deixam de coincidir.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Decaimento: 1 exponencial · 2 linear em energia · 3 com dois trechos', min: 1, max: 3, val: 1, passo: 1 },
      { id: 'T', rot: 'Tempo de reverberação alvo', min: 0.2, max: 3, val: 1, passo: 0.05, un: 's' }
    ],
    desenhar: function (g, p) {
      var tipo = Math.round(p.tipo), T = p.T, t0 = T;
      /* energia restante d(t), normalizada em 1 no instante zero */
      function d(t) {
        if (tipo === 1) return Math.pow(10, -6 * t / T);
        if (tipo === 2) { var u = Math.max(0, 1 - t / (1.08 * T)); return u * u; }
        var a = Math.pow(10, -6 * t / (0.45 * T));
        var b = 0.02 * Math.pow(10, -6 * t / (2.2 * T));
        return a + b;
      }
      function L(t) { return 10 * log10(Math.max(d(t), 1e-9)); }
      var gx = 1.3, gw = 6.4, gy = 0.9, gh = 4.1;
      var tmax = T * 2.2;
      var X = function (t) { return gx + gw * lim(t / tmax, 0, 1); };
      var Y = function (v) { return gy + gh * lim((v + 70) / 70, 0, 1); };
      var yy;
      for (yy = -70; yy <= 0; yy += 10) {
        g.linha(gx, Y(yy), gx + gw, Y(yy), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(yy, 0), gx - 0.15, Y(yy), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      }
      var tk;
      for (tk = 0; tk <= tmax + 1e-9; tk += tmax / 4) {
        g.linha(X(tk), gy, X(tk), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(tk, 2), X(tk), gy - 0.33, { cor: 'fraco', tam: 9.5 });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* resposta impulsiva "crua", com ruído */
      var i, t;
      for (i = 0; i < 420; i++) {
        t = tmax * i / 420;
        var pseudo = Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1);
        var lv = L(t) + 10 * log10(Math.max(pseudo * pseudo * 3, 1e-4));
        if (lv > -70) g.linha(X(t), Y(-70), X(t), Y(lv), { cor: 'fraco', larg: 0.8, alfaLinha: 0.5 });
      }
      var pts = [];
      for (i = 0; i <= 300; i++) { t = tmax * i / 300; pts.push([X(t), Y(L(t))]); }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      /* leitura dos parâmetros */
      function tAt(lv) {
        var lo = 0, hi = tmax * 3, m;
        for (i = 0; i < 70; i++) { m = (lo + hi) / 2; if (L(m) > lv) lo = m; else hi = m; }
        return m;
      }
      var tEDT = tAt(-10), t5 = tAt(-5), t15 = tAt(-15), t25 = tAt(-25), t35 = tAt(-35);
      var EDT = 6 * tEDT, T20 = 3 * (t25 - t5), T30 = 2 * (t35 - t5);
      [[-5, 'aviso'], [-10, 'erro'], [-25, 'aviso'], [-35, 's4']].forEach(function (m) {
        g.linha(gx, Y(m[0]), gx + gw, Y(m[0]), { cor: m[1], larg: 1, tracejado: [3, 3], alfaLinha: 0.8 });
      });
      g.txt('tempo (s)', gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 10.5 });
      g.txt('nível (dB)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 8.3;
      g.txt('curva de Schroeder', xr, 5.1, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('d(t) = ∫ₜ^∞ p²(τ) dτ', xr, 4.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      [['EDT (0 a −10) × 6', EDT], ['T20 (−5 a −25) × 3', T20], ['T30 (−5 a −35) × 2', T30]].forEach(function (r, k) {
        g.txt(r[0], xr, 3.9 - k * 0.62, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(fx(r[1], 3) + ' s', 12.3, 3.9 - k * 0.62, { cor: 'texto', tam: 12.5, alin: 'dir', negrito: true });
      });
      /* clareza */
      function energia(a, b) {
        var s = 0, n = 400, dt = (b - a) / n, k2;
        for (k2 = 0; k2 < n; k2++) {
          var tt = a + dt * (k2 + 0.5);
          s += Math.max(-(d(tt + dt / 2) - d(tt - dt / 2)), 0);
        }
        return s;
      }
      var e50 = 1 - d(0.05), e80 = 1 - d(0.08);
      var C50 = 10 * log10(e50 / Math.max(1 - e50, 1e-9));
      var C80 = 10 * log10(e80 / Math.max(1 - e80, 1e-9));
      g.txt('D50 = ' + fx(100 * e50, 1) + ' %', xr, 1.85, { cor: 'ok', tam: 11.5, alin: 'esq' });
      g.txt('C50 = ' + fx(C50, 2) + ' dB', xr, 1.4, { cor: 'ok', tam: 11.5, alin: 'esq' });
      g.txt('C80 = ' + fx(C80, 2) + ' dB', xr, 0.95, { cor: 'aviso', tam: 11.5, alin: 'esq' });
      g.txt(Math.abs(EDT - T30) / T30 < 0.08 ? 'decaimento reto: os três coincidem'
        : 'decaimento curvo: os três discordam', xr, 0.35,
        { cor: Math.abs(EDT - T30) / T30 < 0.08 ? 'ok' : 'erro', tam: 11, alin: 'esq', negrito: true });
      g.txt('T30 é o mais robusto ao ruído de fundo; EDT é o que mais se aproxima do que se ouve',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 13.1 — isolamento ---------- */
  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'A perda de transmissão sobe 6 dB a cada dobro de massa ou de frequência, mas desaba no vale da coincidência. E uma abertura mínima impõe um teto ao conjunto, por mais pesada que seja a parede.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'mat', rot: 'Material: 1 concreto · 2 alvenaria · 3 gesso · 4 vidro · 5 chapa de aço', min: 1, max: 5, val: 1, passo: 1 },
      { id: 'h', rot: 'Espessura', min: 1, max: 250, val: 100, passo: 1, un: 'mm' },
      { id: 'fresta', rot: 'Abertura na parede', min: 0, max: 1, val: 0, passo: 0.01, un: '% da área' }
    ],
    desenhar: function (g, p) {
      var ids = ['concreto', 'tijolo', 'gesso', 'vidro', 'aco'];
      var mat = AC.parede(ids[Math.round(p.mat) - 1]);
      var m = mat.rho * p.h / 1000;
      var coin = AC.fCoincidencia(mat, p.h);
      var fr = p.fresta / 100;
      function tlc(f) {
        var tl = AC.tl(mat, p.h, f);
        if (fr <= 0) return tl;
        return -10 * log10((1 - fr) * Math.pow(10, -tl / 10) + fr);
      }
      var gx = 1.3, gw = 6.2, gy = 1.0, gh = 4.0;
      var X = escalaLog(50, 10000, gx, gx + gw);
      /* a escala acompanha a parede: concreto grosso passa de 100 dB em 10 kHz */
      var ymax = Math.max(80, 20 * Math.ceil(AC.tl(mat, p.h, 10000) / 20));
      var Y = function (v) { return gy + gh * lim(v / ymax, 0, 1); };
      decadas(50, 10000).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotHz(d), X(d), gy - 0.33, { cor: 'fraco', tam: 9.5 });
      });
      var yy;
      for (yy = 0; yy <= ymax; yy += 20) {
        g.linha(gx, Y(yy), gx + gw, Y(yy), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(fx(yy, 0), gx - 0.15, Y(yy), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      }
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pm = [], pr = [], pc = [], i, f;   /* lei da massa, parede real, com abertura */
      for (i = 0; i <= 120; i++) {
        f = 50 * Math.pow(200, i / 120);
        pm.push([X(f), Y(Math.max(0, AC.leiDaMassa(m, f)))]);
        pr.push([X(f), Y(AC.tl(mat, p.h, f))]);
        pc.push([X(f), Y(tlc(f))]);
      }
      g.caminho(pm, { cor: 'fraco', larg: 1.4, tracejado: [4, 4] });
      g.caminho(pr, { cor: 's1', larg: 2.4 });
      if (fr > 0) g.caminho(pc, { cor: 'erro', larg: 2.2 });
      g.linha(X(coin.fc), gy, X(coin.fc), gy + gh, { cor: 'aviso', larg: 1.6, tracejado: [5, 4] });
      g.txt('f_c', X(coin.fc), gy + gh + 0.28, { cor: 'aviso', tam: 11, negrito: true });
      g.txt('lei da massa', gx + 0.3, Y(AC.leiDaMassa(m, 80)) + 0.35, { cor: 'fraco', tam: 10, alin: 'esq', fundo: true });
      if (fr > 0) g.txt('com abertura', gx + gw - 0.15, Y(tlc(6000)) - 0.35,
        { cor: 'erro', tam: 10, alin: 'dir', fundo: true });
      g.txt('frequência (Hz, log)', gx + gw / 2, gy - 0.78, { cor: 'fraco', tam: 10.5 });
      g.txt('TL (dB)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var xr = 8.1;
      g.txt(mat.nome, xr, 5.1, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(fx(p.h, 0) + ' mm → ' + fx(m, 1) + ' kg/m²', xr, 4.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('f de coincidência', xr, 3.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(fx(coin.fc, 0) + ' Hz', xr, 3.5, { cor: 'aviso', tam: 13, alin: 'esq', negrito: true });
      g.txt('a 500 Hz, lei da massa', xr, 2.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(fx(Math.max(0, AC.leiDaMassa(m, 500)), 1) + ' dB', xr, 2.55,
        { cor: 'fraco', tam: 12, alin: 'esq', negrito: true });
      g.txt('a 500 Hz, parede real', xr, 2.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(fx(AC.tl(mat, p.h, 500), 1) + ' dB', xr, 1.62, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      if (fr > 0) {
        g.txt('com ' + fx(p.fresta, 2) + ' % de abertura', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(fx(tlc(500), 1) + ' dB', xr, 0.62, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
        g.txt('− ' + fx(AC.tl(mat, p.h, 500) - tlc(500), 1) + ' dB perdidos', xr, 0.15,
          { cor: 'erro', tam: 11, alin: 'esq', negrito: true });
      } else {
        g.txt('abra 0,1 % de fresta', xr, 0.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt('e veja o que acontece', xr, 0.58, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      }
      g.txt('1 % de abertura limita o conjunto a 20 dB, qualquer que seja a parede', 6, -1.1,
        { cor: 'fraco', tam: 11 });
    }
  });
})();

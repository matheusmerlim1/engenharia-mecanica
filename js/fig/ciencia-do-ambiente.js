/* ============================================================
   Figuras ilustrativas de Ciência do Ambiente
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.CA) return;
  var F = window.Figura.criar, CA = window.CA, VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { if (!isFinite(v)) return '∞'; var d = n == null ? 3 : n, k = Math.pow(10, d); return (Math.round(+v * k) / k + 0).toLocaleString('pt-BR', { maximumFractionDigits: d }); }
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / g.e;
    itens.forEach(function (it) {
      var linhas = [], atual = '';
      ctx.save(); ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      it.t.split(' ').forEach(function (p) { var q = atual ? atual + ' ' + p : p; if (atual && ctx.measureText(q).width > larg) { linhas.push(atual); atual = p; } else atual = q; });
      ctx.restore(); if (atual) linhas.push(atual);
      linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; });
      y -= passo * 0.35;
    });
  }
  function painel(g, t, linhas, obs) {
    g.txt(t, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) { g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' }); g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true }); });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function ax(g, b, xa, xb, ya, yb, rx, ry, px, py, op) {
    op = op || {};
    var x0 = b[0], x1 = b[1], y0 = b[2], y1 = b[3], v, X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); }, Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); }, fm = op.fmt || function (u) { return fx(u, 2); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) { g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); if (!op.semX) g.txt(fm(v), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 }); }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) { g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' }); }
    g.ret(x0, y0, x1 - x0, y1 - y0, { cor: 'forte', larg: 1.2 });
    if (xa < 0 && xb > 0) g.linha(X(0), y0, X(0), y1, { cor: 'forte', larg: 1.2 });
    if (ya < 0 && yb > 0) g.linha(x0, Y(0), x1, Y(0), { cor: 'forte', larg: 1.2 });
    if (rx) g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 });
    if (ry) g.txt(ry, x0 - 0.3, y1 + 0.34, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, xa: xa, xb: xb, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) {
    var p = [], i, m = n || 240, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; };
    for (i = 0; i <= m; i++) { var v = xa + (xb - xa) * i / m, y = f(v); if (!isFinite(y) || y < a.ya || y > a.yb) fe(); else p.push([a.X(v), a.Y(y)]); }
    fe();
  }
  function serie(g, a, xs, ys, o) { var p = [], i, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; }; for (i = 0; i < xs.length; i++) { if (!isFinite(ys[i]) || ys[i] < a.ya || ys[i] > a.yb) fe(); else p.push([a.X(xs[i]), a.Y(ys[i])]); } fe(); }
  function xis(g, x, y, cor, t) { t = t || 0.13; g.linha(x - t, y - t, x + t, y + t, { cor: cor, larg: 2.4 }); g.linha(x - t, y + t, x + t, y - t, { cor: cor, larg: 2.4 }); }
  function bloco(g, x, y, w, t, o) { o = o || {}; g.ret(x, y - 0.45, w, 0.9, { cor: o.cor || 'acento', larg: 1.6, preenche: o.cor || 'acento', alfa: 0.1 }); g.txt(t, x + w / 2, y, { cor: 'texto', tam: o.tam || 11.5, negrito: true }); }
  function soma(g, x, y) { g.circ(x, y, 0.27, { cor: 'texto', larg: 1.5 }); g.txt('+', x - 0.46, y + 0.26, { cor: 'suave', tam: 11 }); }
  function vaiV(g, x1, y1, x2, y2, o) { g.seta(x1, y1, x2 - x1, y2 - y1, Object.assign({ cor: 'suave', larg: 1.6, ponta: 0.22 }, o || {})); }
  function pass(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; }

  /* 1.1 — crescimento da população */
  F('#fig-1-1', {
    titulo: 'Figura 1.1', legenda: 'Crescimento exponencial e crescimento logístico a partir de 2,5 bilhões de pessoas em 1950. No modelo exponencial a população dobra a cada 70/r anos; no logístico, o crescimento desacelera ao se aproximar da capacidade de suporte K.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'r', rot: 'Taxa de crescimento r', min: 0.5, max: 3, val: 1.8, passo: 0.1, un: '%/ano' }, { id: 'K', rot: 'Capacidade de suporte K', min: 8, max: 16, val: 11, passo: 0.5, un: 'bilhões' }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 1950, 2100, 0, 20, 'ano', 'população (bilhões)', 50, 4, { fmt: function (v) { return String(v); } }), r = p.r / 100, N0 = 2.5;
      var ex = function (t) { return N0 * Math.exp(r * (t - 1950)); }, lg = function (t) { return p.K / (1 + (p.K - N0) / N0 * Math.exp(-r * (t - 1950))); };
      g.linha(a.x0, a.Y(p.K), a.x1, a.Y(p.K), { cor: 'ok', larg: 1.3, tracejado: [6, 4] });
      curva(g, a, ex, 1950, 2100, { cor: 's3', larg: 2.2, tracejado: [7, 4] }); curva(g, a, lg, 1950, 2100, { cor: 's1', larg: 2.6 });
      g.circ(a.X(2011), a.Y(7), 0.09, { cor: 'texto', preenche: 'texto' });
      painel(g, 'Modelos', [['exponencial', '╍╍', 's3'], ['logístico', '━━', 's1'], ['capacidade K', '╍╍', 'ok'], ['duplicação, 70/r', fx(70 / p.r, 1) + ' anos'], ['exponencial em 2050', fx(ex(2050), 1) + ' bi'], ['logístico em 2050', fx(lg(2050), 1) + ' bi'], ['logístico em 2100', fx(lg(2100), 1) + ' bi']], [{ t: 'Ponto: 7 bilhões em 2011, segundo as notas de aula.' }, { t: 'A taxa mundial caiu de cerca de 2 % ao ano, na década de 1960, para perto de 1 %.' }]);
    }
  });

  /* 2.1 — pirâmide de energia e biomagnificação */
  F('#fig-2-1', {
    titulo: 'Figura 2.1', legenda: 'Em cada nível trófico, só uma pequena fração da energia passa ao nível seguinte. Um poluente persistente faz o caminho inverso: como não é eliminado, sua concentração aumenta a cada nível.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'e', rot: 'Eficiência de transferência', min: 5, max: 20, val: 10, passo: 1, un: '%' }, { id: 'f', rot: 'Fator de concentração por nível', min: 2, max: 20, val: 10, passo: 1 }],
    desenhar: function (g, p) {
      var niveis = ['produtores', 'herbívoros', 'carnívoros', 'predadores de topo'], cores = ['ok', 's2', 's3', 'erro'], ap = 6.9, base = 0.6, cx = 3.6, meia = 3.4, alt = (ap - base) / 4;
      function larg(y) { return meia * (ap - y) / (ap - base); }
      niveis.forEach(function (n, i) {
        var yi = base + i * alt, ys = yi + alt;
        g.caminho([[cx - larg(yi), yi], [cx + larg(yi), yi], [cx + larg(ys), ys], [cx - larg(ys), ys]], { fechar: true, preenche: cores[i], alfa: 0.3, cor: cores[i], larg: 1.4 });
        g.txt(fx(10000 * Math.pow(p.e / 100, i), 1) + ' kcal', cx, yi + alt / 2, { cor: 'texto', tam: i === 3 ? 10 : 12, negrito: true });
      });
      painel(g, 'Do produtor ao topo', niveis.map(function (n, i) { return [n, fx(0.001 * Math.pow(p.f, i), 4) + ' ppm', cores[i]]; }).concat([['energia que chega ao topo', fx(100 * Math.pow(p.e / 100, 3), 3) + ' %']]), [{ t: 'Valores do painel: concentração de um poluente persistente, partindo de 0,001 ppm na água.' }, { t: 'Exemplo clássico: o DDT nas aves de rapina.' }]);
    }
  });

  /* 4.1 — DBO ao longo do tempo */
  F('#fig-4-1', {
    titulo: 'Figura 4.1', legenda: 'A DBO exercida cresce com o tempo e tende à DBO última. O ensaio padrão mede em 5 dias, a 20 °C, uma fração que depende do coeficiente de desoxigenação.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'L', rot: 'DBO última L₀', min: 50, max: 450, val: 300, passo: 10, un: 'mg/L' }, { id: 'k', rot: 'Coeficiente K₁', min: 0.1, max: 0.5, val: 0.23, passo: 0.01, un: '1/d' }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 20, 0, 500, 'tempo (dias)', 'DBO exercida (mg/L)', 5, 100), d5 = CA.dboT(p.L, p.k, 5);
      g.linha(a.x0, a.Y(p.L), a.x1, a.Y(p.L), { cor: 'fraco', larg: 1.2, tracejado: [6, 4] });
      curva(g, a, function (t) { return CA.dboT(p.L, p.k, t); }, 0, 20, { cor: 's1', larg: 2.6 }, 300);
      g.linha(a.X(5), a.y0, a.X(5), a.Y(d5), { cor: 's2', larg: 1.4, tracejado: [4, 3] }); g.linha(a.x0, a.Y(d5), a.X(5), a.Y(d5), { cor: 's2', larg: 1.4, tracejado: [4, 3] }); g.circ(a.X(5), a.Y(d5), 0.09, { cor: 's2', preenche: 's2' });
      painel(g, 'Ensaio de DBO', [['DBO última L₀', fx(p.L, 0) + ' mg/L'], ['DBO₅', fx(d5, 1) + ' mg/L', 's2'], ['DBO₅/L₀', fx(d5 / p.L, 3)], ['DBO em 20 dias', fx(CA.dboT(p.L, p.k, 20), 1) + ' mg/L']], [{ t: 'DBO(t) = L₀ (1 − e^(−K₁t))', cor: 'suave' }, { t: 'Para esgoto doméstico, K₁ fica perto de 0,23 por dia, e a DBO₅ vale cerca de 68 % da última.' }]);
    }
  });

  /* 5.1 — diluição no lançamento */
  F('#fig-5-1', {
    titulo: 'Figura 5.1', legenda: 'A DBO logo após o lançamento depende da razão entre a vazão do rio e a do efluente. Para respeitar o limite da classe 2 com efluente bruto, o rio precisaria ser dezenas de vezes maior que o efluente.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'e', rot: 'DBO₅ do efluente', min: 20, max: 400, val: 300, passo: 5, un: 'mg/L' }, { id: 'r', rot: 'Razão de vazões rio/efluente', min: 1, max: 100, val: 10, passo: 1 }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 100, 0, 40, 'razão de vazões rio/efluente', 'DBO₅ da mistura (mg/L)', 20, 10), f = function (r) { return CA.mistura(r, 2, 1, p.e); }, c = f(p.r), rmin = (p.e - 5) / (5 - 2);
      g.linha(a.x0, a.Y(5), a.x1, a.Y(5), { cor: 'erro', larg: 1.5, tracejado: [6, 4] });
      curva(g, a, f, 1, 100, { cor: 's1', larg: 2.6 }, 300);
      if (c <= 40) g.circ(a.X(p.r), a.Y(c), 0.1, { cor: 'texto', preenche: 'texto' });
      painel(g, 'Mistura completa', [['DBO₅ do rio', '2 mg/L'], ['limite da classe 2', '5 mg/L', 'erro'], ['DBO₅ da mistura', fx(c, 2) + ' mg/L', c > 5 ? 'erro' : 'ok'], ['razão mínima', fx(rmin, 1)]], [{ t: 'C = (Qr Cr + Qe Ce)/(Qr + Qe)', cor: 'suave' }, { t: 'Pelo art. 10 da Resolução CONAMA 357/2005, o limite de DBO das classes 2 e 3 pode ser elevado se um estudo de autodepuração mostrar que o OD mínimo é respeitado.' }]);
    }
  });

  /* 6.1 — efeito estufa */
  F('#fig-6-1', {
    titulo: 'Figura 6.1', legenda: 'Modelo de uma camada. Sem atmosfera, a Terra ficaria perto de −18 °C. Uma camada que absorve parte da radiação infravermelha emitida pela superfície devolve energia para baixo e aquece a superfície.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'a', rot: 'Albedo', min: 0.1, max: 0.5, val: 0.3, passo: 0.01 }, { id: 'e', rot: 'Absortividade da atmosfera ε', min: 0, max: 1, val: 0.78, passo: 0.01 }],
    desenhar: function (g, p) {
      var S = 1361, sig = 5.670374e-8, ab = S * (1 - p.a) / 4, Te = CA.Tequilibrio(S, p.a), Ts = CA.Tsuperficie(S, p.a, p.e), Fs = sig * Math.pow(Ts, 4), Fa = p.e * Fs / 2;
      g.ret(0, 0.3, 8.4, 0.7, { cor: 'ok', preenche: 'ok', alfa: 0.3 }); g.txt('superfície', 0.2, 0.65, { cor: 'texto', tam: 11, alin: 'esq', negrito: true });
      g.ret(0, 4.3, 8.4, 0.9, { cor: 'info', preenche: 'info', alfa: 0.08 + 0.25 * p.e }); g.txt('atmosfera', 0.2, 4.75, { cor: 'texto', tam: 11, alin: 'esq', negrito: true });
      g.seta(1.6, 7.4, 0, -6.35, { cor: 'aviso', larg: 3 }); g.txt('solar absorvida', 1.75, 6.9, { cor: 'aviso', tam: 10.5, alin: 'esq', negrito: true }); g.txt(fx(ab, 0) + ' W/m²', 1.75, 6.5, { cor: 'aviso', tam: 10.5, alin: 'esq' });
      g.seta(4.2, 1.0, 0, 3.25, { cor: 'erro', larg: 3 }); g.txt('superfície emite', 4.35, 2.9, { cor: 'erro', tam: 10.5, alin: 'esq', negrito: true }); g.txt(fx(Fs, 0) + ' W/m²', 4.35, 2.5, { cor: 'erro', tam: 10.5, alin: 'esq' });
      if (p.e > 0.01) { g.seta(6.6, 4.3, 0, -3.25, { cor: 's5', larg: 3 }); g.txt('volta para baixo', 6.75, 2.9, { cor: 's5', tam: 10.5, alin: 'esq', negrito: true }); g.txt(fx(Fa, 0) + ' W/m²', 6.75, 2.5, { cor: 's5', tam: 10.5, alin: 'esq' }); }
      g.seta(4.2, 5.2, 0, 2.2, { cor: 'erro', larg: 2.2 }); g.txt('saída ao espaço', 4.35, 6.9, { cor: 'erro', tam: 10.5, alin: 'esq', negrito: true }); g.txt(fx(ab, 0) + ' W/m²', 4.35, 6.5, { cor: 'erro', tam: 10.5, alin: 'esq' });
      painel(g, 'Temperaturas', [['sem atmosfera', fx(Te - 273.15, 1) + ' °C'], ['superfície', fx(Ts - 273.15, 1) + ' °C', 'acento'], ['aquecimento pela camada', fx(Ts - Te, 1) + ' K']], [{ t: 'Te = [S(1 − a)/(4σ)]^(1/4)', cor: 'suave' }, { t: 'Ts = Te·[2/(2 − ε)]^(1/4)', cor: 'suave' }, { t: 'Com ε = 0,78 a superfície fica perto dos 15 °C observados. Mais gases de efeito estufa elevam ε.' }]);
    }
  });

  /* 6.2 — dispersão vertical por classe */
  F('#fig-6-2', {
    titulo: 'Figura 6.2', legenda: 'A dispersão vertical cresce mais depressa em atmosfera instável. O máximo de concentração no solo ocorre perto do ponto em que σz atinge H/√2, por isso ele fica mais perto da chaminé nas classes instáveis.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'H', rot: 'Altura efetiva H', min: 20, max: 300, val: 100, passo: 5, un: 'm' }],
    desenhar: function (g, p) {
      var fm = function (v) { return fx(Math.pow(10, v), 2); }, a = ax(g, [1.1, 8.3, 0.7, 6.7], -1, 1, 0, 3.5, 'distância a favor do vento (km)', 'σz (m), escala log', 1, 1, { fmt: fm }), cls = ['A', 'B', 'C', 'D', 'E', 'F'], cores = ['erro', 's3', 'aviso', 's1', 's5', 's6'], alvo = p.H / Math.SQRT2, linhas = [];
      g.linha(a.x0, a.Y(Math.log10(alvo)), a.x1, a.Y(Math.log10(alvo)), { cor: 'fraco', larg: 1.4, tracejado: [6, 4] });
      cls.forEach(function (c, i) {
        curva(g, a, function (l) { return Math.log10(CA.sigmas(c, Math.pow(10, l) * 1000).z); }, -1, 1, { cor: cores[i], larg: 2.2 }, 200);
        var x = null, j; for (j = 0; j <= 400; j++) { var l = -1 + 2 * j / 400; if (CA.sigmas(c, Math.pow(10, l) * 1000).z >= alvo) { x = Math.pow(10, l); break; } }
        if (x) g.circ(a.X(Math.log10(x)), a.Y(Math.log10(alvo)), 0.08, { cor: cores[i], preenche: cores[i] });
        linhas.push(['classe ' + c, x ? fx(x, 2) + ' km' : 'acima de 10 km', cores[i]]);
      });
      painel(g, 'σz = H/√2 em', linhas, [{ t: 'Linha tracejada: H/√2 = ' + fx(alvo, 0) + ' m.' }, { t: 'Dispersões de Briggs para campo aberto.' }]);
    }
  });

  /* 7.1 — acúmulo de agrotóxico persistente */
  F('#fig-7-1', {
    titulo: 'Figura 7.1', legenda: 'Aplicações repetidas de um produto que se degrada em primeira ordem. Se o intervalo entre aplicações for curto diante da meia-vida, o resíduo no solo se acumula até um patamar bem acima da dose de uma aplicação.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'm', rot: 'Meia-vida no solo', min: 5, max: 360, val: 60, passo: 5, un: 'dias' }, { id: 'i', rot: 'Intervalo entre aplicações', min: 7, max: 120, val: 30, passo: 1, un: 'dias' }],
    desenhar: function (g, p) {
      var k = Math.log(2) / p.m, fac = 1 / (1 - Math.exp(-k * p.i)), topo = Math.min(Math.max(2, Math.ceil(fac + 0.5)), 14), a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 365, 0, topo, 'tempo (dias)', 'resíduo / dose de uma aplicação', 60, pass(topo / 5), { fmt: function (v) { return String(v); } }), pts = [], t, c = 0, prox = 0;
      for (t = 0; t <= 365; t += 0.5) { if (t >= prox - 1e-9) { c += 1; prox += p.i; pts.push([a.X(t), a.Y(Math.min(c - 1, topo))]); } pts.push([a.X(t), a.Y(Math.min(c, topo))]); c *= Math.exp(-k * 0.5); }
      g.caminho(pts, { cor: 's3', larg: 2.2 });
      if (fac <= topo) g.linha(a.x0, a.Y(fac), a.x1, a.Y(fac), { cor: 'erro', larg: 1.3, tracejado: [6, 4] });
      painel(g, 'Persistência', [['constante k', fx(k, 4) + ' por dia'], ['resta após 1 intervalo', fx(100 * Math.exp(-k * p.i), 1) + ' %'], ['patamar, logo após aplicar', fx(fac, 2) + ' doses', 'erro'], ['resta 1 ano após uma dose', fx(100 * Math.exp(-k * 365), 2) + ' %']], [{ t: 'C = C₀·e^(−kt), com k = ln 2/t½', cor: 'suave' }, { t: 'Patamar = 1/(1 − e^(−kT))', cor: 'suave' }]);
    }
  });

  /* 8.1 — composição dos resíduos de uma cidade */
  F('#fig-8-1', {
    titulo: 'Figura 8.1', legenda: 'Ordem de grandeza da composição dos resíduos sólidos urbanos no Brasil, em massa. Quase metade é matéria orgânica, que poderia ir para compostagem, e cerca de um terço são materiais recicláveis secos.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'p', rot: 'População', min: 10, max: 2000, val: 300, passo: 10, un: 'mil hab' }, { id: 'g', rot: 'Geração per capita', min: 0.5, max: 1.5, val: 1.04, passo: 0.01, un: 'kg/hab·dia' }],
    desenhar: function (g, q) {
      var fr = [['matéria orgânica', 45, 'ok'], ['plásticos', 17, 's1'], ['papel e papelão', 10, 's2'], ['têxteis e couro', 6, 's5'], ['vidro', 3, 's6'], ['metais', 2, 's4'], ['rejeitos e outros', 17, 'fraco']], tot = q.p * 1000 * q.g / 1000, y = 6.6, passo = 0.86;
      fr.forEach(function (f, i) { var yy = y - i * passo, w = 5.2 * f[1] / 45; g.txt(f[0], 0, yy, { cor: 'suave', tam: 11, alin: 'esq' }); g.ret(2.9, yy - 0.28, w, 0.56, { cor: f[2], preenche: f[2], alfa: 0.55, larg: 1 }); g.txt(f[1] + ' %', 2.9 + w + 0.15, yy, { cor: 'texto', tam: 11, alin: 'esq', negrito: true }); });
      painel(g, 'Por dia', [['total', fx(tot, 0) + ' t'], ['matéria orgânica', fx(tot * 0.45, 0) + ' t', 'ok'], ['recicláveis secos', fx(tot * 0.32, 0) + ' t', 's1'], ['rejeitos e outros', fx(tot * 0.17, 0) + ' t'], ['por ano', fx(tot * 365 / 1000, 1) + ' mil t']], [{ t: 'Recicláveis secos: plásticos, papel, vidro e metais.' }, { t: 'Média nacional recente, segundo a ABREMA: cerca de 1 kg por habitante por dia.' }]);
    }
  });

  /* 9.1 — construção de um aterro sanitário */
  F('#fig-9-1', {
    titulo: 'Figura 9.1', legenda: 'Elementos de um aterro sanitário, na ordem de construção. A base impermeabilizada e os drenos separam o resíduo do solo e da água subterrânea; a cobertura diária e os drenos de gás controlam odor, vetores e biogás.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'e', rot: 'Etapa', min: 1, max: 5, val: 5, passo: 1 }],
    desenhar: function (g, p) {
      var x0 = 1, x1 = 8.6, b = 1.6, e = p.e, nomes = ['impermeabilização da base', 'drenos de chorume', 'células com cobertura diária', 'drenos de gás', 'cobertura final e monitoramento'];
      g.ret(-0.4, 0, 9.4, b, { cor: null, preenche: 'fraco', alfa: 0.2 }); g.linha(-0.4, b, 9.0, b, { cor: 'forte', larg: 1.4 });
      g.ret(-0.4, 0, 9.4, 0.45, { cor: null, preenche: 's1', alfa: 0.18 }); g.txt('lençol freático', 9.0, 0.22, { cor: 's1', tam: 10, alin: 'dir' });
      if (e >= 1) { g.caminho([[x0 - 0.6, b + 4.6], [x0, b], [x1, b], [x1 + 0.6, b + 4.6]], { cor: 's4', larg: 3.4 }); }
      if (e >= 2) { [2, 3.5, 5, 6.5, 8].forEach(function (x) { g.circ(x, b + 0.18, 0.12, { cor: 's3', preenche: 's3' }); }); g.linha(x0 + 0.2, b + 0.18, x1 - 0.2, b + 0.18, { cor: 's3', larg: 1.6 }); g.seta(x1, b + 0.18, 0.9, -0.6, { cor: 's3', larg: 1.8, ponta: 0.2 }); }
      if (e >= 3) { var i; for (i = 0; i < 4; i++) { var y0 = b + 0.35 + i * 1.05; g.ret(x0 + 0.15 - i * 0.13, y0, x1 - x0 - 0.3 + i * 0.26, 0.85, { cor: null, preenche: i % 2 ? 's2' : 's5', alfa: 0.45 }); g.linha(x0 + 0.1 - i * 0.13, y0 + 0.9, x1 - 0.1 + i * 0.13, y0 + 0.9, { cor: 'aviso', larg: 1.6 }); } }
      if (e >= 4) { [3, 6.6].forEach(function (x) { g.ret(x - 0.12, b + 0.3, 0.24, 4.9, { cor: 's6', preenche: 's6', alfa: 0.35, larg: 1.2 }); g.seta(x, b + 5.2, 0, 0.7, { cor: 's6', larg: 1.8, ponta: 0.2 }); }); }
      if (e >= 5) { g.caminho([[x0 - 0.55, b + 4.55], [x0 + 1.4, b + 5.2], [x1 - 1.4, b + 5.2], [x1 + 0.55, b + 4.55]], { cor: 'ok', larg: 4 }); g.linha(-0.1, b, -0.1, 0.1, { cor: 'info', larg: 2.6 }); g.circ(-0.1, b + 0.25, 0.14, { cor: 'info', preenche: 'info' }); }
      painel(g, 'Etapa ' + e + ' de 5', nomes.map(function (n, i) { return [String(i + 1), n, i < e ? (i === e - 1 ? 'acento' : 'texto') : 'fraco']; }), [{ t: ['Argila compactada e geomembrana de PEAD sob todo o resíduo.', 'O chorume é coletado e enviado a tratamento, nunca ao rio sem tratar.', 'Resíduo espalhado, compactado e coberto com solo ao fim de cada dia.', 'O biogás é queimado em flare ou aproveitado para gerar energia.', 'Camada final com solo e vegetação; poços monitoram a água subterrânea.'][e - 1] }]);
    }
  });

  /* 10.1 — relação C/N na compostagem */
  F('#fig-10-1', {
    titulo: 'Figura 10.1', legenda: 'Restos de comida são ricos em nitrogênio, e folhas secas, em carbono. Misturá-los leva a relação C/N para a faixa de cerca de 25 a 35, em que a decomposição aeróbia é mais eficiente.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'm', rot: 'Folhas secas por kg de restos de comida', min: 0, max: 4, val: 1, passo: 0.05, un: 'kg' }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 4, 0, 60, 'folhas secas por kg de restos (kg, base seca)', 'relação C/N', 1, 10), f = function (m) { return CA.CN([{ m: 1, C: 0.45, N: 0.03 }, { m: m, C: 0.5, N: 0.008 }]); }, cn = f(p.m);
      g.ret(a.x0, a.Y(25), a.x1 - a.x0, a.Y(35) - a.Y(25), { cor: null, preenche: 'ok', alfa: 0.15 });
      curva(g, a, f, 0, 4, { cor: 's2', larg: 2.6 }, 200);
      g.circ(a.X(p.m), a.Y(cn), 0.1, { cor: 'texto', preenche: 'texto' });
      painel(g, 'Mistura', [['restos de comida', 'C 45 %, N 3 %'], ['folhas secas', 'C 50 %, N 0,8 %'], ['C/N da mistura', fx(cn, 1), cn >= 25 && cn <= 35 ? 'ok' : 'erro'], ['para C/N = 30', fx(0.45 / 0.26, 2) + ' kg']], [{ t: 'C/N = Σ(m·C)/Σ(m·N)', cor: 'suave' }, { t: 'Abaixo da faixa, sobra nitrogênio, que escapa como amônia. Acima dela, a decomposição fica lenta.' }]);
    }
  });

  /* 11.1 — licenciamento trifásico */
  F('#fig-11-1', {
    titulo: 'Figura 11.1', legenda: 'O licenciamento ordinário em três fases. Cada licença autoriza apenas a etapa seguinte do empreendimento e traz condicionantes que precisam ser cumpridas para chegar à próxima.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'e', rot: 'Fase', min: 1, max: 4, val: 2, passo: 1 }],
    desenhar: function (g, p) {
      var fases = [['Estudos', 'EIA/RIMA ou estudo simplificado; audiência pública quando cabível'], ['LP', 'Licença Prévia: aprova localização e concepção, atesta a viabilidade'], ['LI', 'Licença de Instalação: autoriza a obra conforme os projetos aprovados'], ['LO', 'Licença de Operação: autoriza o funcionamento, após verificar as condicionantes']], y = 5.2;
      fases.forEach(function (f, i) {
        var x = 0.2 + i * 2.15, at = i + 1 === p.e, feito = i + 1 < p.e;
        g.ret(x, y - 0.6, 1.8, 1.2, { cor: at ? 'acento' : feito ? 'ok' : 'fraco', preenche: at ? 'acento' : feito ? 'ok' : 'fraco', alfa: at ? 0.25 : 0.1, larg: at ? 2.4 : 1.4 });
        g.txt(f[0], x + 0.9, y, { cor: 'texto', tam: 13, negrito: true });
        if (i < 3) vaiV(g, x + 1.8, y, x + 2.15, y);
      });
      notas(g, 0.2, 3.6, 8.4, [{ t: fases[p.e - 1][1], cor: 'texto' }, { t: 'Base: Resolução CONAMA 237/1997, art. 8º. A Lei 15.190/2025 manteve as três licenças e criou modalidades como a licença única e a licença por adesão e compromisso.' }]);
      painel(g, 'Quem exige o quê', [['EIA/RIMA', 'impacto significativo'], ['fundamento', 'CONAMA 001/1986'], ['competência', 'LC 140/2011'], ['falta de licença', 'Lei 9.605/1998']], [{ t: 'Operar sem licença, ou em desacordo com ela, é crime ambiental (art. 60 da Lei 9.605/1998).' }]);
    }
  });

  /* 12.1 — telhado verde */
  F('#fig-12-1', {
    titulo: 'Figura 12.1', legenda: 'O substrato do telhado verde armazena os primeiros milímetros de chuva. Em chuvas pequenas ele retém quase tudo; em chuvas grandes, depois de saturado, escoa quase como um telhado comum. Modelo simplificado de armazenamento.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'P', rot: 'Chuva do evento', min: 2, max: 100, val: 25, passo: 1, un: 'mm' }, { id: 'S', rot: 'Armazenamento do substrato', min: 5, max: 40, val: 15, passo: 1, un: 'mm' }],
    desenhar: function (g, p) {
      var a = ax(g, [0.9, 8.3, 0.7, 6.7], 0, 100, 0, 100, 'chuva do evento (mm)', 'escoamento (mm)', 20, 20), conv = function (P) { return 0.95 * P; }, verde = function (P) { return 0.9 * Math.max(0, P - p.S); };
      curva(g, a, conv, 0, 100, { cor: 's3', larg: 2.2, tracejado: [7, 4] }); curva(g, a, verde, 0, 100, { cor: 'ok', larg: 2.6 }, 300);
      g.linha(a.X(p.P), a.y0, a.X(p.P), a.y1, { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      var ec = conv(p.P), ev = verde(p.P);
      painel(g, 'Evento de ' + fx(p.P, 0) + ' mm', [['telhado comum', '╍╍', 's3'], ['telhado verde', '━━', 'ok'], ['escoa no comum', fx(ec, 1) + ' mm'], ['escoa no verde', fx(ev, 1) + ' mm'], ['retenção do verde', fx(100 * (1 - ev / p.P), 0) + ' %', 'acento'], ['em 1000 m² de telhado', fx((ec - ev), 1) + ' m³ a menos']], [{ t: 'Medições citadas no trabalho da pasta da disciplina: retenção de 10 a 35 % na estação chuvosa e de 65 a 100 % na seca.' }]);
    }
  });
})();

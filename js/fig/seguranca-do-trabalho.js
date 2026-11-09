/* ============================================================
   Figuras ilustrativas de Segurança do Trabalho
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.ST) return;
  var F = window.Figura.criar, ST = window.ST, VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }); }
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) { var linhas = [], atual = ''; ctx.save(); ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; it.t.split(' ').forEach(function (p) { var q = atual ? atual + ' ' + p : p; if (atual && ctx.measureText(q).width > larg) { linhas.push(atual); atual = p; } else atual = q; }); linhas.push(atual); ctx.restore(); linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; }); });
  }
  function painel(g, t, linhas, obs) {
    g.txt(t, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) { g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' }); g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true }); });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function eixos(g, xa, xb, ya, yb, rx, ry, px, py) {
    var x0 = 0.9, x1 = 8.3, y0 = 0.7, y1 = 6.7, v, X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); }, Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) { g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 }); }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) { g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' }); }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 }); g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 }); g.txt(ry, x0 - 0.3, y1 + 0.38, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) { var p = [], i, m = n || 240, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; }; for (i = 0; i <= m; i++) { var v = xa + (xb - xa) * i / m, y = f(v); if (!isFinite(y) || y < a.ya || y > a.yb) fe(); else p.push([a.X(v), a.Y(y)]); } fe(); }

  /* 1.1 — pirâmide */
  F('#fig-1-1', {
    titulo: 'Figura 1.1', legenda: 'A proporção de Bird, levantada em grande número de ocorrências, mostra que cada acidente grave vem acompanhado de muitos eventos menores. Tratar os eventos da base é o que reduz o topo.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'n', rot: 'Acidentes graves', min: 1, max: 10, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var ap = 6.9, base = 0.6, cx = 4.4, meia = 3.7, cam = [[1, 'erro'], [10, 'aviso'], [30, 's2'], [600, 's1']], alt = (ap - base) / 4;
      function larg(y) { return meia * (ap - y) / (ap - base); }
      cam.forEach(function (c, i) {
        var ys = ap - i * alt, yi = ys - alt;
        g.caminho([[cx - larg(ys), ys], [cx + larg(ys), ys], [cx + larg(yi), yi], [cx - larg(yi), yi]], { fechar: true, preenche: c[1], alfa: 0.3, cor: c[1], larg: 1.6 });
        g.txt(fx(c[0] * p.n, 0), cx, (ys + yi) / 2 - (i === 0 ? 0.32 : 0), { cor: 'texto', tam: i === 0 ? 13 : 16, negrito: true });
      });
      painel(g, 'Eventos correspondentes', [['acidente grave', fx(p.n, 0), 'erro'], ['acidente leve', fx(10 * p.n, 0), 'aviso'], ['dano à propriedade', fx(30 * p.n, 0), 's2'], ['quase-acidente', fx(600 * p.n, 0), 's1']], [{ t: 'A proporção é estatística, e não uma lei: ela não diz que evitar 600 quase-acidentes garante evitar o grave. Mas o registro da base é a principal fonte de aprendizado antes da perda.' }]);
    }
  });

  /* 2.1 — matriz */
  F('#fig-2-1', {
    titulo: 'Figura 2.1', legenda: 'A matriz combina severidade e probabilidade em um nível de risco, usado para priorizar o plano de ação. As faixas de cor são critério de cada organização: a NR-1 exige que ele exista e esteja documentado.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 's', rot: 'Severidade', min: 1, max: 5, val: 4, passo: 1 }, { id: 'p', rot: 'Probabilidade', min: 1, max: 5, val: 3, passo: 1 }],
    desenhar: function (g, q) {
      var x0 = 1.5, y0 = 0.9, l = 1.28, i, j;
      function classe(v) { return v >= 15 ? ['crítico', 'erro'] : v >= 10 ? ['alto', 'aviso'] : v >= 5 ? ['moderado', 's2'] : ['baixo', 'ok']; }
      for (i = 1; i <= 5; i++) for (j = 1; j <= 5; j++) {
        var v = i * j, c = classe(v), sel = i === q.s && j === q.p;
        g.ret(x0 + (i - 1) * l, y0 + (j - 1) * l * 0.92, l, l * 0.92, { preenche: c[1], alfa: sel ? 0.75 : 0.25, cor: sel ? 'texto' : 'borda', larg: sel ? 2.4 : 0.8 });
        g.txt(fx(v, 0), x0 + (i - 0.5) * l, y0 + (j - 0.5) * l * 0.92, { cor: 'texto', tam: 12, negrito: sel });
      }
      for (i = 1; i <= 5; i++) { g.txt(fx(i, 0), x0 + (i - 0.5) * l, y0 - 0.28, { cor: 'fraco', tam: 10 }); g.txt(fx(i, 0), x0 - 0.22, y0 + (i - 0.5) * l * 0.92, { cor: 'fraco', tam: 10 }); }
      g.txt('severidade da consequência', x0 + 2.5 * l, y0 - 0.72, { cor: 'suave', tam: 10.5 });
      g.txt('probabilidade', x0 - 0.75, y0 + 5 * l * 0.92 + 0.3, { cor: 'suave', tam: 10.5, alin: 'esq' });
      var R = q.s * q.p, cl = classe(R);
      painel(g, 'Risco avaliado', [['severidade', fx(q.s, 0)], ['probabilidade', fx(q.p, 0)], ['nível (S × P)', fx(R, 0), cl[1]], ['classe', cl[0], cl[1]]], [{ t: 'Reduzir a probabilidade move o ponto para baixo. Só eliminar o perigo ou diminuir a energia envolvida move para a esquerda.' }]);
    }
  });

  /* 4.1 — tempo permitido */
  F('#fig-4-1', {
    titulo: 'Figura 4.1', legenda: 'Com q = 5 dB, o tempo permitido cai pela metade a cada 5 dB. Com q = 3 dB, da NHO 01, a cada 3 dB. Os dois critérios coincidem em 85 dB(A) e se afastam rapidamente acima disso.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'L', rot: 'Nível de ruído', min: 85, max: 115, val: 95, passo: 1, un: 'dB(A)' }],
    desenhar: function (g, p) {
      var a = eixos(g, 85, 115, 0, 500, 'nível de ruído, dB(A)', 'tempo permitido (min)', 5, 100), pts = [], i;
      ST.TAB15.forEach(function (l, k) { if (k) pts.push([a.X(ST.TAB15[k - 1][0]), a.Y(l[1])]); pts.push([a.X(l[0]), a.Y(l[1])]); });
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      curva(g, a, ST.tNHO, 85, 115, { cor: 'erro', larg: 2.4 });
      var T = ST.t15(p.L), N = ST.tNHO(p.L);
      g.circ(a.X(p.L), a.Y(T), 0.12, { preenche: 's1', cor: null }); g.circ(a.X(p.L), a.Y(N), 0.12, { preenche: 'erro', cor: null });
      g.linha(a.X(p.L), a.y0, a.X(p.L), a.y1, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      painel(g, 'Em ' + fx(p.L, 0) + ' dB(A)', [['NR-15', fx(T, 0) + ' min', 's1'], ['NHO 01', fx(N, 1) + ' min', 'erro'], ['razão NR-15/NHO', fx(T / N, 1) + ' ×']], [{ t: 'A NR-15 define o direito ao adicional. A NHO 01 é a boa prática para prevenir a perda auditiva.' }, { t: 'Em degraus: valores do Quadro do Anexo 1.', cor: 's1' }, { t: 'Curva contínua: NHO 01.', cor: 'erro' }]);
    }
  });

  /* 4.2 — soma de níveis */
  F('#fig-4-2', {
    titulo: 'Figura 4.2', legenda: 'Decibéis não se somam diretamente. Duas fontes iguais somam apenas 3 dB, e uma fonte 10 dB mais fraca quase não altera o total: é a mais forte que deve ser atacada primeiro.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'a', rot: 'Fonte 1', min: 70, max: 110, val: 90, passo: 1, un: 'dB' }, { id: 'b', rot: 'Fonte 2', min: 70, max: 110, val: 86, passo: 1, un: 'dB' }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 20, 0, 3.5, 'diferença entre as fontes (dB)', 'acréscimo sobre a maior (dB)', 5, 0.5), d = Math.abs(p.a - p.b), inc = 10 * Math.log10(1 + Math.pow(10, -d / 10)), T = ST.somaDB([p.a, p.b]);
      curva(g, a, function (x) { return 10 * Math.log10(1 + Math.pow(10, -x / 10)); }, 0, 20, { cor: 's1', larg: 2.6 });
      if (d <= 20) { g.circ(a.X(d), a.Y(inc), 0.13, { preenche: 'erro', cor: null }); g.linha(a.X(d), a.y0, a.X(d), a.Y(inc), { cor: 'erro', larg: 1, tracejado: [4, 4] }); }
      painel(g, 'Soma das fontes', [['maior fonte', fx(Math.max(p.a, p.b), 0) + ' dB'], ['diferença', fx(d, 0) + ' dB'], ['acréscimo', fx(inc, 2) + ' dB', 's1'], ['nível total', fx(T, 1) + ' dB', 'erro']], [{ t: 'L = 10 log(10^(L₁/10) + 10^(L₂/10))' }]);
    }
  });

  /* 5.1 — calor */
  F('#fig-5-1', {
    titulo: 'Figura 5.1', legenda: 'Quanto maior a taxa metabólica, menor o IBUTG admitido. Acima da curva, em ambiente fechado ou com fonte artificial de calor, a atividade é insalubre em grau médio.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'tbn', rot: 'Bulbo úmido natural', min: 18, max: 32, val: 25, passo: 0.5, un: '°C' }, { id: 'tg', rot: 'Globo', min: 25, max: 50, val: 40, passo: 0.5, un: '°C' }, { id: 'M', rot: 'Taxa metabólica', min: 100, max: 600, val: 300, passo: 10, un: 'W' }],
    desenhar: function (g, p) {
      var a = eixos(g, 100, 600, 20, 38, 'taxa metabólica (W)', 'IBUTG (°C)', 100, 3), I = ST.ibutg(p.tbn, p.tg, 0, false), L = ST.limCalor(p.M), acima = I > L;
      curva(g, a, ST.limCalor, 100, 600, { cor: 's1', larg: 2.6 });
      g.circ(a.X(p.M), a.Y(I), 0.15, { preenche: acima ? 'erro' : 'ok', cor: null });
      painel(g, 'Avaliação', [['IBUTG médio', fx(I, 1) + ' °C', acima ? 'erro' : 'ok'], ['limite (Quadro 1)', fx(L, 1) + ' °C', 's1'], ['diferença', fx(I - L, 1) + ' °C'], ['situação', acima ? 'insalubre' : 'dentro do limite', acima ? 'erro' : 'ok']], [{ t: 'A curva é a relação 56,7 − 11,5 log M, que reproduz o Quadro 1 com erro abaixo de 0,05 °C.' }]);
    }
  });

  /* 6.1 — cortina de luz */
  F('#fig-6-1', {
    titulo: 'Figura 6.1', legenda: 'A mão avança até a cortina. Durante o tempo de resposta do sistema, ela continua se movendo: a distância precisa ser maior que o caminho percorrido até a máquina parar.',
    vista: VISTA, altura: ALTURA, animar: true,
    controles: [{ id: 'T', rot: 'Tempo de parada total', min: 50, max: 600, val: 200, passo: 10, un: 'ms' }, { id: 'd', rot: 'Capacidade de detecção', min: 14, max: 50, val: 14, passo: 2, un: 'mm' }, { id: 'I', rot: 'Distância instalada', min: 100, max: 1400, val: 500, passo: 10, un: 'mm' }],
    desenhar: function (g, p, t) {
      var R = ST.distancia(p.T / 1000, p.d), maxmm = 1700, x0 = 0.9, x1 = 8.1, X = function (mm) { return x1 - (x1 - x0) * mm / maxmm; }, y = 3.3;
      g.ret(x1, 1.3, 0.28, 4.4, { preenche: 'erro', alfa: 0.35, cor: 'erro', larg: 1.4 });
      g.txt('zona de perigo', x1 + 0.14, 6.42, { cor: 'erro', tam: 10.5, alin: 'dir' });
      g.linha(X(p.I), 1.3, X(p.I), 5.7, { cor: 's1', larg: 3, tracejado: [8, 5] });
      g.txt('cortina', X(p.I), 5.98, { cor: 's1', tam: 10.5 });
      g.linha(X(R.S), 1.3, X(R.S), 5.1, { cor: 'ok', larg: 1.4, tracejado: [3, 4] });
      g.txt('S mínima', X(R.S), 1.0, { cor: 'ok', tam: 10.5 });
      var detect = p.I - R.C, ini = p.I + 180, tot = (ini - detect) / R.K + p.T / 1000, c = (t * 0.45) % (tot + 0.9), mm;
      if (c < (ini - detect) / R.K) mm = ini - R.K * c; else if (c < tot) mm = detect - R.K * (c - (ini - detect) / R.K); else mm = detect - R.K * (p.T / 1000);
      var tocou = mm < 0; mm = Math.max(mm, 0);
      var detectou = mm <= detect, parou = c >= tot;
      g.linha(x0, y, X(mm), y, { cor: 's3', larg: 12, cap: 'butt' });
      g.circ(X(mm), y, 0.28, { preenche: tocou ? 'erro' : 's3', cor: null });
      g.txt(parou ? 'máquina parada' : detectou ? 'detectada: parando' : 'aproximação', 4.4, 6.5, { cor: tocou ? 'erro' : parou ? 'ok' : 'suave', tam: 11, negrito: true });
      g.linha(X(0), 0.55, X(1600), 0.55, { cor: 'forte', larg: 1 });
      for (var v = 0; v <= 1600; v += 400) { g.linha(X(v), 0.5, X(v), 0.62, { cor: 'forte', larg: 1 }); g.txt(fx(v, 0), X(v), 0.25, { cor: 'fraco', tam: 10 }); }
      g.txt('distância à zona de perigo (mm)', 4.5, -0.25, { cor: 'suave', tam: 10.5 });
      var ok = p.I >= R.S;
      painel(g, 'Distância de segurança', [['K adotado', fx(R.K, 0) + ' mm/s'], ['adicional C', fx(R.C, 0) + ' mm'], ['S mínima', fx(R.S, 0) + ' mm', 'ok'], ['instalada', fx(p.I, 0) + ' mm', ok ? 'ok' : 'erro'], ['situação', ok ? 'atende' : 'insuficiente', ok ? 'ok' : 'erro']], [{ t: 'S = K·T + C, com K e C do Anexo I da NR-12. T inclui o tempo de resposta da cortina, do comando e da parada.' }]);
    }
  });

  /* 7.2 — zonas */
  var TENS = [0.22, 0.38, 0.44, 2.3, 4.16, 6.9, 13.8, 23, 34.5, 69, 138, 230, 345, 500];
  F('#fig-7-2', {
    titulo: 'Figura 7.2', legenda: 'Em torno da parte energizada não segregada há a zona de risco, restrita a trabalhadores autorizados com técnicas e equipamentos adequados, e a zona controlada, restrita a autorizados. Os raios vêm da tabela da norma.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'i', rot: 'Tensão (posição na lista)', min: 0, max: 13, val: 6, passo: 1 }],
    desenhar: function (g, p) {
      var kV = TENS[p.i], Z = ST.zonas(kV), cx = 4.2, cy = 3.85, e = 2.9 / Z.Rc;
      g.ret(0.3, 0.1, 7.8, 6.8, { preenche: 'ok', alfa: 0.08, cor: 'borda', larg: 0.8 });
      g.circ(cx, cy, Z.Rc * e, { preenche: 'aviso', alfa: 0.3, cor: 'aviso', larg: 1.8 });
      g.circ(cx, cy, Z.Rr * e, { preenche: 'erro', alfa: 0.45, cor: 'erro', larg: 1.8 });
      g.circ(cx, cy, 0.09, { preenche: 'texto', cor: null });
      g.seta(cx, cy, Z.Rr * e * 0.707, Z.Rr * e * 0.707, { cor: 'texto', larg: 1.4 });
      g.txt('Rr', cx + Z.Rr * e * 0.32, cy + Z.Rr * e * 0.62, { cor: 'texto', tam: 11, negrito: true, fundo: true });
      g.seta(cx, cy, -Z.Rc * e * 0.8, -Z.Rc * e * 0.6, { cor: 'texto', larg: 1.4 });
      g.txt('Rc', cx - Z.Rc * e * 0.56, cy - Z.Rc * e * 0.54, { cor: 'texto', tam: 11, negrito: true, fundo: true });
      g.txt('zona livre', 0.55, 6.55, { cor: 'ok', tam: 11, alin: 'esq', negrito: true });
      var um = e; if (um <= 7) { g.linha(7.9 - um, 0.45, 7.9, 0.45, { cor: 'texto', larg: 2 }); g.txt('1 m', 7.9 - um / 2, 0.72, { cor: 'texto', tam: 10.5 }); }
      painel(g, 'Raios de delimitação', [['tensão nominal', fx(kV, 2) + ' kV'], ['classe (texto vigente)', kV <= 1 ? 'baixa' : 'alta', kV <= 1 ? 'ok' : 'erro'], ['classe (a partir de 2027)', kV <= 1 ? 'baixa' : kV <= 36.2 ? 'média' : 'alta', kV <= 1 ? 'ok' : 'aviso'], ['Rr (zona de risco)', fx(Z.Rr, 2) + ' m', 'erro'], ['Rc (zona controlada)', fx(Z.Rc, 2) + ' m', 'aviso']], [{ t: 'A escala muda com a tensão: observe a barra de 1 m.' }]);
    }
  });

  /* 7.1 — corrente no corpo */
  F('#fig-7-1', {
    titulo: 'Figura 7.1', legenda: 'O dano depende da corrente e do tempo, e não da tensão isolada. A faixa mostra ordens de grandeza para corrente alternada de 60 Hz e exposição prolongada, segundo a IEC 60479-1.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'V', rot: 'Tensão de contato', min: 12, max: 380, val: 127, passo: 1, un: 'V' }, { id: 'R', rot: 'Resistência do corpo', min: 500, max: 5000, val: 1500, passo: 50, un: 'Ω' }],
    desenhar: function (g, p) {
      var x0 = 0.9, x1 = 8.2, X = function (mA) { return x0 + (x1 - x0) * (Math.log10(mA) + 1) / 4; }, I = 1000 * p.V / p.R, y0 = 2.7, h = 1.7;
      [[0.1, 0.5, 'ok', 'sem reação'], [0.5, 10, 's2', 'contração, dor'], [10, 40, 'aviso', 'não solta'], [40, 1000, 'erro', 'risco de fibrilação']].forEach(function (z) {
        g.ret(X(z[0]), y0, X(z[1]) - X(z[0]), h, { preenche: z[2], alfa: 0.35, cor: z[2], larg: 1 });
        g.txt(z[3], (X(z[0]) + X(z[1])) / 2, y0 + h / 2, { cor: 'texto', tam: 10.5 });
      });
      [0.1, 1, 10, 100, 1000].forEach(function (v) { g.linha(X(v), y0 - 0.1, X(v), y0, { cor: 'forte', larg: 1 }); g.txt(fx(v, 1), X(v), y0 - 0.34, { cor: 'fraco', tam: 10 }); });
      g.txt('corrente pelo corpo (mA, escala logarítmica)', 4.5, y0 - 0.85, { cor: 'suave', tam: 10.5 });
      g.linha(X(30), y0 - 0.1, X(30), y0 + h + 0.35, { cor: 's1', larg: 1.6, tracejado: [4, 4] });
      g.txt('DR de 30 mA', X(30), y0 + h + 0.58, { cor: 's1', tam: 10.5 });
      var Ip = Math.min(I, 1000);
      g.seta(X(Ip), y0 + h + 1.75, 0, -1.65, { cor: 'erro', larg: 2.2 });
      g.txt(fx(I, 0) + ' mA', X(Ip), y0 + h + 2.0, { cor: 'erro', tam: 12, negrito: true });
      var cl = I < 0.5 ? 'sem reação' : I < 10 ? 'contração' : I < 40 ? 'não solta' : 'fibrilação';
      painel(g, 'Choque', [['tensão', fx(p.V, 0) + ' V'], ['resistência', fx(p.R, 0) + ' Ω'], ['corrente', fx(I, 1) + ' mA', 'erro'], ['efeito provável', cl, I >= 10 ? 'erro' : 'ok']], [{ t: 'A pele úmida ou ferida reduz a resistência em várias vezes. Com ela, tensões comuns de tomada já são capazes de matar.' }]);
    }
  });

  /* 8.1 — NR-13 */
  F('#fig-8-1', {
    titulo: 'Figura 8.1', legenda: 'A categoria sai da classe do fluido e do grupo de potencial de risco, dado pelo produto P·V. A categoria I é a mais crítica, e os prazos de inspeção são os da Tabela 2 da NR-13.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'P', rot: 'Pressão máxima de operação', min: 0.1, max: 20, val: 1.2, passo: 0.1, un: 'MPa' }, { id: 'V', rot: 'Volume', min: 0.1, max: 100, val: 10, passo: 0.1, un: 'm³' }, { id: 'c', rot: 'Classe do fluido (1=A … 4=D)', min: 1, max: 4, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var CL = ['A', 'B', 'C', 'D'], cl = CL[p.c - 1], PV = p.P * p.V, gr = ST.grupo(PV), cat = ST.categoria(PV, cl), x0 = 1.6, y0 = 1.0, l = 1.28, h = 1.14, R = ['', 'I', 'II', 'III', 'IV', 'V'], cores = ['', 'erro', 'aviso', 's2', 's1', 'ok'];
      CL.forEach(function (c, f) {
        g.txt(c, x0 - 0.3, y0 + (3.5 - f) * h, { cor: f === p.c - 1 ? 'texto' : 'fraco', tam: 12, negrito: f === p.c - 1 });
        ST.TAB13[c].forEach(function (v, k) {
          var sel = f === p.c - 1 && k === gr - 1;
          g.ret(x0 + k * l, y0 + (3 - f) * h, l, h, { preenche: cores[v], alfa: sel ? 0.8 : 0.24, cor: sel ? 'texto' : 'borda', larg: sel ? 2.4 : 0.8 });
          g.txt(R[v], x0 + (k + 0.5) * l, y0 + (3.5 - f) * h, { cor: 'texto', tam: 13, negrito: sel });
        });
      });
      [1, 2, 3, 4, 5].forEach(function (k) { g.txt(fx(k, 0), x0 + (k - 0.5) * l, y0 + 4 * h + 0.3, { cor: k === gr ? 'texto' : 'fraco', tam: 12, negrito: k === gr }); });
      g.txt('grupo de potencial de risco', x0 + 2.5 * l, y0 + 4 * h + 0.82, { cor: 'suave', tam: 10.5 });
      g.txt('classe do fluido', x0 - 0.75, y0 - 0.4, { cor: 'suave', tam: 10.5, alin: 'esq' });
      var I = ST.INSP13[cat], kPa = PV * 1000, ab = kPa > 8 || cl === 'A';
      painel(g, 'Vaso de pressão', [['P·V (MPa·m³)', fx(PV, 2)], ['grupo', fx(gr, 0)], ['categoria', R[cat], cores[cat]], ['exame externo', I[0] + ' anos'], ['exame interno', I[1] + ' anos'], ['com SPIE (ext./int.)', I[2] + ' / ' + (I[3] ? I[3] + ' anos' : 'a critério')]], [{ t: ab ? 'Enquadrado: P·V em kPa·m³ acima de 8, ou fluido classe A.' : 'Fora do campo de aplicação da NR-13.', cor: ab ? 'ok' : 'erro' }]);
    }
  });

  /* 9.1 — fator de queda */
  F('#fig-9-1', {
    titulo: 'Figura 9.1', legenda: 'Sem elemento de absorção, a força cresce com o fator de queda, e passaria muito de 6 kN. Com o absorvedor, a força fica no valor de projeto, mas a distância de frenagem aumenta. É por isso que a zona livre é calculada.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'm', rot: 'Massa', min: 60, max: 140, val: 100, passo: 5, un: 'kg' }, { id: 'FQ', rot: 'Fator de queda', min: 0.1, max: 2, val: 2, passo: 0.05 }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 2, 0, 30, 'fator de queda', 'força máxima (kN)', 0.5, 5), L = 1.8, FN = 4000, sem = function (f) { return ST.queda({ m: p.m, L: L, A: L - f * L, F: FN }).Frigido / 1000; };
      curva(g, a, sem, 0.02, 2, { cor: 'erro', larg: 2.6 });
      g.linha(a.X(0), a.Y(6), a.X(2), a.Y(6), { cor: 'aviso', larg: 1.6, tracejado: [6, 4] });
      g.txt('limite de 6 kN', a.X(1.5), a.Y(6) + 0.26, { cor: 'aviso', tam: 10.5, alin: 'esq' });
      g.linha(a.X(0), a.Y(4), a.X(2), a.Y(4), { cor: 'ok', larg: 2.4 });
      g.txt('com absorvedor', a.X(1.3), a.Y(4) - 0.26, { cor: 'ok', tam: 10.5, alin: 'esq' });
      g.txt('sem absorvedor (ilustrativo)', a.X(0.42), a.Y(24), { cor: 'erro', tam: 10.5, alin: 'esq' });
      var q = ST.queda({ m: p.m, L: L, A: L - p.FQ * L, F: FN });
      g.circ(a.X(p.FQ), a.Y(q.Frigido / 1000), 0.13, { preenche: 'erro', cor: null });
      painel(g, 'Talabarte de 1,8 m', [['queda livre', fx(q.ff, 2) + ' m'], ['velocidade', fx(q.v, 1) + ' m/s'], ['sem absorvedor', fx(q.Frigido / 1000, 1) + ' kN', 'erro'], ['com absorvedor', '4 kN', 'ok'], ['abertura', fx(q.d, 2) + ' m', 's1']], [{ t: 'A força sem absorvedor supõe talabarte elástico de rigidez axial EA = 100 kN.' }]);
    }
  });

  /* 10.1 — atmosfera */
  F('#fig-10-1', {
    titulo: 'Figura 10.1', legenda: 'Cada barra mostra uma condição da atmosfera. A entrada só é possível com todas na faixa verde, avaliadas antes da entrada e monitoradas continuamente.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'o', rot: 'Oxigênio', min: 15, max: 26, val: 20.9, passo: 0.1, un: '%' }, { id: 'l', rot: 'Inflamáveis', min: 0, max: 30, val: 4, passo: 1, un: '% LIE' }, { id: 'h', rot: 'H₂S', min: 0, max: 30, val: 2, passo: 1, un: 'ppm' }],
    desenhar: function (g, p) {
      var x0 = 1.0, x1 = 8.2;
      function barra(y, tit, a, b, oka, okb, v, txt, marcas) {
        var X = function (u) { return x0 + (x1 - x0) * (u - a) / (b - a); }, ok = v >= oka && v <= okb;
        g.txt(tit, x0, y + 1.0, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
        g.ret(x0, y, x1 - x0, 0.6, { preenche: 'erro', alfa: 0.28, cor: 'borda', larg: 0.8 });
        g.ret(X(oka), y, X(okb) - X(oka), 0.6, { preenche: 'ok', alfa: 0.55, cor: null });
        marcas.forEach(function (m) { g.txt(m[1], X(m[0]), y - 0.3, { cor: 'fraco', tam: 10 }); });
        g.linha(X(v), y - 0.1, X(v), y + 0.72, { cor: 'texto', larg: 3 });
        g.txt(txt, x1, y + 1.0, { cor: ok ? 'ok' : 'erro', tam: 11.5, alin: 'dir', negrito: true });
        return ok;
      }
      var a = barra(5.0, 'Oxigênio', 15, 26, 19.5, 23, p.o, fx(p.o, 1) + ' %', [[15, '15'], [19.5, '19,5'], [23, '23'], [26, '26']]);
      var b = barra(2.9, 'Inflamáveis', 0, 30, 0, 9.999, p.l, fx(p.l, 0) + ' % do LIE', [[0, '0'], [10, '10'], [30, '30']]);
      var c = barra(0.8, 'H₂S', 0, 30, 0, 8, p.h, fx(p.h, 0) + ' ppm', [[0, '0'], [8, '8'], [30, '30']]);
      var lib = a && b && c, afast = Math.abs(p.o - 20.9) > 0.05;
      painel(g, 'Avaliação inicial', [['oxigênio', a ? 'aceitável' : 'fora da faixa', a ? 'ok' : 'erro'], ['inflamáveis', b ? 'abaixo de 10 %' : 'proibido', b ? 'ok' : 'erro'], ['H₂S', c ? 'dentro do LT' : 'acima do LT', c ? 'ok' : 'erro'], ['resultado', lib ? 'condição aceitável' : 'não entrar', lib ? 'ok' : 'erro']], [{ t: afast && a ? 'O₂ diferente de 20,9 %: a causa precisa ser conhecida e controlada.' : 'O₂ indicado: 20,9 %.', cor: afast && a ? 'aviso' : 'fraco' }, { t: 'A liberação depende ainda da PET, do bloqueio das energias, do vigia e do plano de resgate.' }]);
    }
  });

  /* 11.1 — faixas */
  var FX = [['hidrogênio', 4, 75], ['monóxido de carbono', 12.5, 74], ['sulfeto de hidrogênio', 4, 44], ['metano', 5, 15], ['propano', 2.1, 9.5], ['n-butano', 1.8, 8.4]];
  F('#fig-11-1', {
    titulo: 'Figura 11.1', legenda: 'Abaixo do LIE a mistura é pobre, e acima do LSE, rica; só entre os dois ela queima. O hidrogênio tem a faixa mais larga, e os hidrocarbonetos pesados, os limites inferiores mais baixos.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'c', rot: 'Concentração no ar', min: 0, max: 80, val: 6, passo: 0.5, un: '% vol' }],
    desenhar: function (g, p) {
      var x0 = 3.2, x1 = 8.2, X = function (u) { return x0 + (x1 - x0) * u / 80; }, lin = [], est = function (f) { return p.c < f[1] ? ['pobre', 'fraco'] : p.c > f[2] ? ['rica', 's1'] : ['explosiva', 'erro']; };
      FX.forEach(function (f, i) {
        var y = 5.8 - i * 0.92, e = est(f);
        g.txt(f[0], x0 - 0.15, y + 0.2, { cor: 'texto', tam: 10.5, alin: 'dir' });
        g.ret(x0, y, x1 - x0, 0.4, { preenche: 'baixo', cor: 'borda', larg: 0.6 });
        g.ret(X(f[1]), y, X(f[2]) - X(f[1]), 0.4, { preenche: e[0] === 'explosiva' ? 'erro' : 'aviso', alfa: e[0] === 'explosiva' ? 0.85 : 0.5, cor: null });
        lin.push([f[0], e[0], e[1]]);
      });
      [0, 20, 40, 60, 80].forEach(function (v) { g.linha(X(v), 0.72, X(v), 0.82, { cor: 'forte', larg: 1 }); g.txt(fx(v, 0), X(v), 0.48, { cor: 'fraco', tam: 10 }); });
      g.txt('concentração no ar (% em volume)', (x0 + x1) / 2, 0.02, { cor: 'suave', tam: 10.5 });
      g.linha(X(p.c), 0.82, X(p.c), 6.6, { cor: 'texto', larg: 2 });
      painel(g, 'Em ' + fx(p.c, 1) + ' %', lin, [{ t: 'Limites típicos no ar, a 25 °C e 1 atm.' }]);
    }
  });
})();

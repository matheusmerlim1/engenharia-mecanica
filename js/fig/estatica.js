/* ============================================================
   Figuras ilustrativas de Estática (módulo js/core/figura.js)
   Cada figura calcula o que desenha pelas equações do capítulo:
   mexer num controle muda o desenho pela física, não por aparência.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var rad = function (d) { return d * Math.PI / 180; };
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };

  /* ================= capítulo 1 ================= */

  /* 1.1 — momento e braço de alavanca */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'O que conta é a distância perpendicular da linha de ação ao polo. Deslizar a força ao longo da própria linha não muda nada; apontá-la para o polo zera o momento.',
    vista: [-1.2, 11.8, -3.2, 5.2],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Direção da força', min: 0, max: 180, val: 60, passo: 1, un: '°' },
      { id: 'L', rot: 'Posição na barra', min: 1, max: 8, val: 6, passo: 0.5, un: 'm' },
      { id: 'F', rot: 'Intensidade', min: 50, max: 400, val: 200, passo: 10, un: 'N' }
    ],
    desenhar: function (g, p) {
      var th = rad(p.ang), L = p.L, Fv = p.F;
      var M = Fv * L * Math.sin(th);
      var d = L * Math.sin(th);                       /* braço de alavanca */
      var ox = 0.6, oy = 0.6, esc = 2.6 / 400;
      g.hachura(ox - 0.5, oy - 0.45, 1, 0, { cor: 'forte', d: 0.22 });
      g.linha(ox, oy, ox + 9.2, oy, { cor: 'forte', larg: 5 });
      g.circ(ox, oy, 0.22, { preenche: 'fundo', cor: 'forte', larg: 2 });
      g.txt('O', ox - 0.5, oy - 0.1, { cor: 'suave', tam: 12 });
      var ax = ox + L, ay = oy;
      var fxv = Math.cos(th) * Fv * esc, fyv = Math.sin(th) * Fv * esc;
      /* linha de ação */
      g.linha(ax - Math.cos(th) * 6, ay - Math.sin(th) * 6, ax + Math.cos(th) * 6, ay + Math.sin(th) * 6,
        { cor: 'borda', larg: 1, tracejado: [5, 5] });
      g.seta(ax, ay, fxv, fyv, { cor: 'erro', larg: 2.6, rot: 'F = ' + Fv + ' N', rotTam: 12 });
      g.circ(ax, ay, 0.12, { preenche: 'texto', cor: null });
      /* braço: pé da perpendicular do polo sobre a linha de ação */
      var t0 = (ox - ax) * Math.cos(th) + (oy - ay) * Math.sin(th);
      var pex = ax + t0 * Math.cos(th), pey = ay + t0 * Math.sin(th);
      g.linha(ox, oy, pex, pey, { cor: 'info', larg: 1.8, tracejado: [4, 3] });
      /* marca de ângulo reto entre o braço e a linha de ação */
      var ub = [(pex - ox), (pey - oy)], nb = Math.hypot(ub[0], ub[1]) || 1;
      ub = [ub[0] / nb * 0.3, ub[1] / nb * 0.3];
      var ul = [Math.cos(th) * 0.3, Math.sin(th) * 0.3];
      g.caminho([[pex - ub[0], pey - ub[1]], [pex - ub[0] - ul[0], pey - ub[1] - ul[1]], [pex - ul[0], pey - ul[1]]],
        { cor: 'info', larg: 1 });
      g.txt('d = ' + fx(Math.abs(d), 2) + ' m', (ox + pex) / 2 - ub[1] * 2.2, (oy + pey) / 2 + ub[0] * 2.2,
        { cor: 'info', tam: 11.5, fundo: true });
      g.arco(ox, oy, 1.1, 0, 0 + (Math.abs(M) > 1 ? 1.1 : 0.0001) * (M > 0 ? 1 : -1), { cor: 's2', ponta: Math.abs(M) > 1, larg: 2 });
      g.cota(ox, oy - 0.8, ax, oy - 0.8, L + ' m', { dy: -0.35 });
      g.txt('M = F · d = ' + fx(Math.abs(M), 1) + ' N·m', 5.4, -2.2,
        { cor: Math.abs(M) < 1 ? 'suave' : 's2', tam: 14, negrito: true });
      g.txt(Math.abs(M) < 1 ? 'linha de ação passando pelo polo: momento nulo'
        : (M > 0 ? 'sentido anti-horário' : 'sentido horário'), 5.4, -2.85, { cor: 'fraco', tam: 11.5 });
    }
  });

  /* 1.2 — Varignon */
  F('#fig-1-2', {
    titulo: 'Figura 1.2',
    legenda: 'Varignon: o momento da força é igual à soma dos momentos das componentes. Em vez de procurar a distância perpendicular, basta decompor (exemplo 1.1).',
    vista: [-1.4, 10.6, -3.4, 5.6],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Direção da força', min: 0, max: 90, val: 53, passo: 1, un: '°' },
      { id: 'x', rot: 'Coordenada x', min: 0.5, max: 7, val: 4, passo: 0.5, un: 'dm' },
      { id: 'y', rot: 'Coordenada y', min: 0, max: 4, val: 2, passo: 0.5, un: 'dm' }
    ],
    desenhar: function (g, p) {
      var th = rad(p.ang), Fv = 500, x = p.x, y = p.y;
      var Fx = Fv * Math.cos(th), Fy = Fv * Math.sin(th);
      var M = (x / 10) * Fy - (y / 10) * Fx;          /* dm -> m */
      var esc = 2.6 / 500;
      var ox = 0.4, oy = 0.4;
      g.seta(ox, oy, 8.4, 0, { cor: 'fraco', larg: 1, ponta: 0.2, rot: 'x', rotTam: 11, rotDy: -0.35, rotDx: 0.1 });
      g.seta(ox, oy, 0, 4.4, { cor: 'fraco', larg: 1, ponta: 0.2, rot: 'y', rotTam: 11, rotDx: -0.35, rotDy: 0.1 });
      g.circ(ox, oy, 0.14, { preenche: 'texto', cor: null });
      g.txt('O', ox - 0.4, oy - 0.3, { cor: 'suave', tam: 12 });
      var ax = ox + x, ay = oy + y;
      g.linha(ax, oy, ax, ay, { cor: 'borda', larg: 1, tracejado: true });
      g.linha(ox, ay, ax, ay, { cor: 'borda', larg: 1, tracejado: true });
      g.circ(ax, ay, 0.13, { preenche: 'texto', cor: null });
      g.seta(ax, ay, Math.cos(th) * Fv * esc, Math.sin(th) * Fv * esc, { cor: 'erro', larg: 2.6, rot: 'F = 500 N', rotTam: 12 });
      g.seta(ax, ay, Fx * esc, 0, { cor: 's1', larg: 2, rot: 'Fx = ' + fx(Fx, 0) + ' N', rotTam: 11, rotDy: -0.45, rotDx: 0 });
      g.seta(ax, ay, 0, Fy * esc, { cor: 's3', larg: 2, rot: 'Fy = ' + fx(Fy, 0) + ' N', rotTam: 11, rotDx: 1.1, rotDy: 0.1 });
      g.cota(ox, oy - 0.55, ax, oy - 0.55, 'x = ' + fx(x / 10, 2) + ' m', { dy: -0.3 });
      g.cota(ox - 0.55, oy, ox - 0.55, ay, 'y = ' + fx(y / 10, 2) + ' m', { dx: -0.15 });
      g.txt('M = x·Fy − y·Fx = ' + fx(x / 10, 2) + '·' + fx(Fy, 0) + ' − ' + fx(y / 10, 2) + '·' + fx(Fx, 0) + ' = ' + fx(M, 1) + ' N·m',
        4.6, -2.4, { cor: 's2', tam: 13, negrito: true });
      g.txt('braço equivalente d = M/F = ' + fx(Math.abs(M) / Fv, 3) + ' m', 4.6, -3.05, { cor: 'fraco', tam: 11.5 });
    }
  });

  /* 1.3 — binário */
  F('#fig-1-3', {
    titulo: 'Figura 1.3',
    legenda: 'O binário tem resultante nula e momento F·d. Mova o polo para onde quiser: o momento não muda — é o que permite transportá-lo livremente pelo corpo.',
    vista: [-1.2, 11.2, -3.4, 5.4],
    altura: 350,
    controles: [
      { id: 'd', rot: 'Distância entre as forças', min: 1, max: 5, val: 3, passo: 0.5, un: 'm' },
      { id: 'polo', rot: 'Posição do polo', min: 0, max: 100, val: 20, passo: 1, un: '%' },
      { id: 'F', rot: 'Intensidade', min: 20, max: 200, val: 100, passo: 10, un: 'N' }
    ],
    desenhar: function (g, p) {
      var d = p.d, Fv = p.F, esc = 2.4 / 200;
      var y1 = 1.2, y2 = y1 + d;
      var xa = 2.2, xb = 7.8;
      var px = 0.4 + 9.4 * p.polo / 100, py = -1.0;
      g.ret(xa - 0.6, y1 - 0.45, 6.8, d + 0.9, { cor: 'borda', larg: 1.4, preenche: 'baixo', alfa: 0.25 });
      g.seta(xa, y2, Fv * esc, 0, { cor: 'erro', larg: 2.4, rot: 'F', rotTam: 12, rotDy: 0.42, rotDx: 0 });
      g.seta(xb, y1, -Fv * esc, 0, { cor: 'erro', larg: 2.4, rot: 'F', rotTam: 12, rotDy: -0.45, rotDx: 0 });
      g.linha(xa - 1, y2, xb + 1, y2, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      g.linha(xa - 1, y1, xb + 1, y1, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      g.cota(xb + 0.8, y1, xb + 0.8, y2, 'd = ' + fx(d, 1) + ' m', { dx: 0.65, dy: 0 });
      /* momento em torno do polo escolhido: soma das duas contribuições */
      var m1 = Fv * (y2 - py), m2 = -Fv * (y1 - py);
      g.circ(px, py, 0.17, { cor: 'info', larg: 2.2 });
      g.txt('polo', px, py - 0.5, { cor: 'info', tam: 11.5, fundo: true });
      g.linha(px, py, px, y2, { cor: 'info', larg: 1, tracejado: [3, 3] });
      g.txt('momento da de cima: ' + fx(m1, 0) + ' N·m', 1.0, 4.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('momento da de baixo: ' + fx(m2, 0) + ' N·m', 1.0, 4.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('soma: ' + fx(m1 + m2, 0) + ' N·m = F·d', 1.0, 3.6, { cor: 's2', tam: 13, negrito: true, alin: 'esq' });
      g.txt('resultante das forças: 0', 1.0, 3.0, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('Mova o polo: a soma continua a mesma.', 5.6, -2.6, { cor: 'fraco', tam: 11.5 });
    }
  });

  /* ================= capítulo 2 ================= */

  /* 2.1 — apoios e reações */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Cada movimento impedido gera uma reação. O rolete impede uma translação; o pino, duas; o engaste, duas translações e a rotação.',
    vista: [-0.6, 12.6, -2.6, 5.4],
    altura: 330,
    controles: [{ id: 'tipo', rot: 'Apoio (1 rolete · 2 pino · 3 engaste · 4 cabo)', min: 1, max: 4, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var t = p.tipo;
      var ox = 3.4, oy = 1.4;
      /* viga */
      g.ret(ox, oy, 6.4, 0.5, { preenche: 'acento', cor: null, alfa: 0.35 });
      g.seta(ox + 5.4, oy + 2.4, 0, -1.8, { cor: 'erro', larg: 2.2, rot: 'carga', rotTam: 11.5, rotDy: 0.55, rotDx: 0 });
      var nome, reacoes;
      if (t === 1) {
        g.circ(ox + 0.4, oy - 0.3, 0.3, { cor: 'forte', larg: 2, preenche: 'baixo' });
        g.hachura(ox - 0.6, oy - 0.62, 2, 0, { cor: 'forte', d: 0.22 });
        g.seta(ox + 0.4, oy, 0, 1.8, { cor: 's3', larg: 2.4, rot: 'R', rotTam: 12 });
        nome = 'Rolete — 1 reação'; reacoes = 'impede a translação normal à superfície; deixa rolar e girar';
      } else if (t === 2) {
        g.caminho([[ox + 0.4, oy], [ox - 0.2, oy - 0.8], [ox + 1.0, oy - 0.8]], { cor: 'forte', larg: 2, fechar: true, preenche: 'baixo', alfa: 0.6 });
        g.hachura(ox - 0.6, oy - 0.82, 2, 0, { cor: 'forte', d: 0.22 });
        g.circ(ox + 0.4, oy, 0.16, { preenche: 'fundo', cor: 'forte', larg: 1.8 });
        g.seta(ox + 0.4, oy, 0, 1.8, { cor: 's3', larg: 2.4, rot: 'Ry', rotTam: 12 });
        g.seta(ox + 0.4, oy, 1.6, 0, { cor: 's1', larg: 2.4, rot: 'Rx', rotTam: 12, rotDy: -0.45, rotDx: 0 });
        nome = 'Pino — 2 reações'; reacoes = 'impede as duas translações; permite girar';
      } else if (t === 3) {
        g.ret(ox - 0.5, oy - 1.1, 0.5, 2.7, { preenche: 'baixo', cor: 'forte', larg: 2 });
        g.hachura(ox - 0.5, oy - 1.1, 2.7, Math.PI / 2, { cor: 'forte', d: 0.24 });
        g.seta(ox, oy + 0.25, 0, 1.8, { cor: 's3', larg: 2.4, rot: 'Ry', rotTam: 12 });
        g.seta(ox, oy + 0.25, 1.6, 0, { cor: 's1', larg: 2.4, rot: 'Rx', rotTam: 12, rotDy: -0.45, rotDx: 0 });
        g.arco(ox, oy + 0.25, 1.1, 2.6, 4.2, { cor: 's2', larg: 2.2, ponta: true });
        g.txt('M', ox - 1.35, oy + 0.25, { cor: 's2', tam: 12.5, negrito: true });
        nome = 'Engaste — 3 reações'; reacoes = 'impede tudo: as duas translações e a rotação';
      } else {
        g.linha(ox + 0.4, oy + 0.5, ox + 0.4, oy + 3.4, { cor: 'forte', larg: 2 });
        g.hachura(ox - 0.6, oy + 3.4, 2, 0, { cor: 'forte', d: 0.22 });
        g.seta(ox + 0.4, oy + 0.5, 0, 1.6, { cor: 's3', larg: 2.4, rot: 'T (só tração)', rotTam: 11.5, rotDx: 1.3, rotDy: 0.1 });
        nome = 'Cabo — 1 reação'; reacoes = 'impede a translação na direção do cabo, e só puxa';
      }
      g.txt(nome, 6.2, 5.0, { cor: 'texto', tam: 13.5, negrito: true });
      g.txt(reacoes, 6.2, 4.4, { cor: 'suave', tam: 11.5 });
      g.txt('no plano há 3 equações: 3 incógnitas → isostático · mais → hiperestático · menos → mecanismo', 6, -2.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.2 — viga biapoiada */
  F('#fig-2-2', {
    titulo: 'Figura 2.2',
    legenda: 'A carga se reparte entre os apoios na razão inversa das distâncias. Arraste a carga até um apoio e veja o outro ficar sem nada (exemplo 2.1).',
    vista: [-0.6, 12.6, -3.4, 4.6],
    altura: 330,
    controles: [
      { id: 'a', rot: 'Posição da carga (de A)', min: 0, max: 6, val: 2, passo: 0.25, un: 'm' },
      { id: 'P', rot: 'Carga', min: 2, max: 30, val: 12, passo: 1, un: 'kN' }
    ],
    desenhar: function (g, p) {
      var L = 6, a = p.a, P = p.P;
      var RB = P * a / L, RA = P - RB;
      var ox = 1.6, oy = 1.2, esc = 7.6 / L, escF = 2.2 / 30;
      g.ret(ox, oy, L * esc, 0.42, { preenche: 'acento', cor: null, alfa: 0.35 });
      /* apoios */
      g.caminho([[ox, oy], [ox - 0.42, oy - 0.7], [ox + 0.42, oy - 0.7]], { cor: 'forte', larg: 1.8, fechar: true, preenche: 'baixo', alfa: 0.6 });
      g.circ(ox + L * esc, oy - 0.32, 0.3, { cor: 'forte', larg: 1.8, preenche: 'baixo' });
      g.hachura(ox - 1, oy - 0.73, 1.2, 0, { cor: 'forte', d: 0.2 });
      g.hachura(ox + L * esc - 0.6, oy - 0.65, 1.2, 0, { cor: 'forte', d: 0.2 });
      g.txt('A', ox, oy - 1.1, { cor: 'suave', tam: 12 });
      g.txt('B', ox + L * esc, oy - 1.1, { cor: 'suave', tam: 12 });
      /* carga */
      var cx = ox + a * esc;
      g.seta(cx, oy + 2.6, 0, -2.1, { cor: 'erro', larg: 2.6, rot: P + ' kN', rotTam: 12, rotDy: 0.5, rotDx: 0 });
      g.cota(ox, oy + 3.4, cx, oy + 3.4, fx(a, 2) + ' m', { dy: 0.35 });
      g.cota(cx, oy + 3.4, ox + L * esc, oy + 3.4, fx(L - a, 2) + ' m', { dy: 0.35 });
      /* reações */
      g.seta(ox, oy - 0.75, 0, -Math.max(0.25, RA * escF), { cor: 's3', larg: 2.6, ponta: 0.24 });
      g.seta(ox + L * esc, oy - 0.75, 0, -Math.max(0.25, RB * escF), { cor: 's1', larg: 2.6, ponta: 0.24 });
      g.txt('R_A = ' + fx(RA, 2) + ' kN', ox, -2.6, { cor: 's3', tam: 12.5, negrito: true });
      g.txt('R_B = ' + fx(RB, 2) + ' kN', ox + L * esc, -2.6, { cor: 's1', tam: 12.5, negrito: true });
      g.txt('ΣM em A:  6·R_B = ' + P + '·' + fx(a, 2) + '   →   R_B = ' + fx(RB, 2) + ' kN', 6, 4.2, { cor: 'suave', tam: 12 });
      g.txt('a carga se reparte na razão inversa das distâncias', 6, -3.2, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 3 ================= */

  /* 3.1 — carga distribuída e resultante equivalente */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'A resultante vale a área do diagrama de carga e age no centroide dele. Compare as reações antes e depois da substituição: são idênticas (exemplo 3.1).',
    vista: [-0.6, 12.6, -3.6, 5.4],
    altura: 350,
    controles: [
      { id: 'forma', rot: 'Diagrama (0 uniforme · 1 triangular · 2 trapezoidal)', min: 0, max: 2, val: 1, passo: 1 },
      { id: 'q', rot: 'Carga máxima', min: 2, max: 12, val: 6, passo: 0.5, un: 'kN/m' }
    ],
    desenhar: function (g, p) {
      var L = 4, q = p.q, forma = p.forma;
      var q0 = forma === 0 ? q : forma === 1 ? 0 : q * 0.4;   /* carga em A */
      var q1 = q;                                             /* carga em B */
      var R = (q0 + q1) / 2 * L;
      /* centroide do trapézio medido de A */
      var xbar = L * (q0 + 2 * q1) / (3 * (q0 + q1));
      var RB = R * xbar / L, RA = R - RB;
      var ox = 1.4, oy = 1.0, esc = 7.8 / L, escQ = 2.6 / 12, escF = 2.0 / 30;
      /* viga */
      g.ret(ox, oy, L * esc, 0.4, { preenche: 'acento', cor: null, alfa: 0.35 });
      g.caminho([[ox, oy], [ox - 0.4, oy - 0.68], [ox + 0.4, oy - 0.68]], { cor: 'forte', larg: 1.8, fechar: true, preenche: 'baixo', alfa: 0.6 });
      g.circ(ox + L * esc, oy - 0.3, 0.28, { cor: 'forte', larg: 1.8, preenche: 'baixo' });
      /* diagrama de carga */
      var pts = [[ox, oy + 0.4], [ox, oy + 0.4 + q0 * escQ], [ox + L * esc, oy + 0.4 + q1 * escQ], [ox + L * esc, oy + 0.4]];
      g.caminho(pts, { cor: 's2', larg: 1.8, fechar: true, preenche: 's2', alfa: 0.22 });
      for (var i = 0; i <= 8; i++) {
        var f = i / 8, xx = ox + L * esc * f, qq = q0 + (q1 - q0) * f;
        g.seta(xx, oy + 0.4 + qq * escQ, 0, -qq * escQ * 0.82, { cor: 's2', larg: 1, ponta: 0.16 });
      }
      g.txt(fx(q1, 1) + ' kN/m', ox + L * esc, oy + 0.6 + q1 * escQ, { cor: 's2', tam: 11.5 });
      if (q0 > 0.01) g.txt(fx(q0, 1) + ' kN/m', ox, oy + 0.6 + q0 * escQ, { cor: 's2', tam: 11.5 });
      /* resultante equivalente */
      var cx = ox + xbar * esc;
      g.seta(cx, oy + 4.3, 0, -1.3, { cor: 'erro', larg: 2.6, rot: 'R = ' + fx(R, 1) + ' kN', rotTam: 12, rotDy: 0.5, rotDx: 0 });
      g.linha(cx, oy + 0.4, cx, oy + 3.0, { cor: 'erro', larg: 1, tracejado: [4, 4] });
      g.cota(ox, oy - 1.3, cx, oy - 1.3, 'x̄ = ' + fx(xbar, 2) + ' m', { dy: -0.3 });
      /* reações */
      g.seta(ox, oy - 0.75, 0, -Math.max(0.25, RA * escF), { cor: 's3', larg: 2.4, ponta: 0.22 });
      g.seta(ox + L * esc, oy - 0.75, 0, -Math.max(0.25, RB * escF), { cor: 's1', larg: 2.4, ponta: 0.22 });
      g.txt('R_A = ' + fx(RA, 2) + ' kN', ox, -2.9, { cor: 's3', tam: 12.5, negrito: true });
      g.txt('R_B = ' + fx(RB, 2) + ' kN', ox + L * esc, -2.9, { cor: 's1', tam: 12.5, negrito: true });
      g.txt(forma === 0 ? 'uniforme: resultante no meio' : forma === 1 ? 'triangular: resultante a 2/3 de A (1/3 do lado carregado)' : 'trapezoidal: retângulo + triângulo',
        6, 5.0, { cor: 'suave', tam: 12 });
      g.txt('vale para reações; para esforços internos, a carga precisa continuar distribuída', 6, -3.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 4 ================= */

  /* 4.1 — método das seções numa treliça */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Corte, isole um lado e aplique as três equações: o banzo responde ao momento (M/h) e a diagonal, ao cortante. Reduza a altura e veja a força nos banzos disparar (exemplo 4.1).',
    vista: [-0.6, 12.6, -3.8, 5.2],
    altura: 350,
    controles: [
      { id: 'h', rot: 'Altura da treliça', min: 1, max: 4, val: 3, passo: 0.25, un: 'm' },
      { id: 'P', rot: 'Carga no nó central', min: 5, max: 40, val: 20, passo: 1, un: 'kN' },
      { id: 'corte', rot: 'Painel do corte', min: 1, max: 2, val: 2, passo: 1 }
    ],
    desenhar: function (g, p) {
      var L = 12, h = p.h, P = p.P, pain = 3;
      var R = P / 2;
      var xc = (p.corte - 0.5) * pain;              /* posição do corte */
      var M = R * xc, Finf = M / h, V = R;
      var ang = Math.atan(h / pain);
      var Fdiag = V / Math.sin(ang);
      var ox = 1.2, oy = 0.8, esc = 9.4 / L, escH = esc;
      var yb = oy, yt = oy + h * escH;
      /* banzos e montantes */
      for (var i = 0; i < 4; i++) {
        var x0 = ox + i * pain * esc, x1 = x0 + pain * esc;
        g.linha(x0, yb, x1, yb, { cor: 'borda', larg: 2.4 });
        g.linha(x0, yt, x1, yt, { cor: 'borda', larg: 2.4 });
        g.linha(x1, yb, x1, yt, { cor: 'borda', larg: 1.8 });
        /* diagonais em V */
        g.linha(x0, yb, x1, yt, { cor: 'borda', larg: 1.8 });
      }
      g.linha(ox, yb, ox, yt, { cor: 'borda', larg: 1.8 });
      /* apoios e carga */
      g.caminho([[ox, yb], [ox - 0.38, yb - 0.62], [ox + 0.38, yb - 0.62]], { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.6 });
      g.circ(ox + L * esc, yb - 0.28, 0.26, { cor: 'forte', larg: 1.6, preenche: 'baixo' });
      g.seta(ox + 6 * esc, yb - 0.1, 0, -1.5, { cor: 'erro', larg: 2.4, rot: P + ' kN', rotTam: 11.5, rotDy: -0.5, rotDx: 0 });
      g.txt(fx(R, 1) + ' kN', ox, yb - 1.1, { cor: 's3', tam: 11 });
      g.txt(fx(R, 1) + ' kN', ox + L * esc, yb - 1.1, { cor: 's3', tam: 11 });
      /* corte */
      var xcut = ox + xc * esc;
      g.linha(xcut, yb - 0.9, xcut, yt + 0.9, { cor: 'erro', larg: 2, tracejado: [7, 5] });
      g.txt('corte', xcut, yt + 1.25, { cor: 'erro', tam: 11.5, fundo: true });
      /* barras cortadas em destaque */
      g.linha(xcut - 0.6, yb, xcut + 0.6, yb, { cor: 's1', larg: 4 });
      g.linha(xcut - 0.6, yt, xcut + 0.6, yt, { cor: 's2', larg: 4 });
      var x0d = ox + (p.corte - 1) * pain * esc;
      g.linha(x0d, yb, x0d + pain * esc, yt, { cor: 's4', larg: 3 });
      var x0 = 0.4, y0 = -1.4;
      g.txt('M da seção = ' + fx(M, 1) + ' kN·m', x0, y0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('banzo inferior = M/h = ' + fx(Finf, 2) + ' kN (tração)', x0, y0 - 0.65, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('banzo superior = ' + fx(Finf, 2) + ' kN (compressão)', x0, y0 - 1.3, { cor: 's2', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('diagonal = V/sen θ = ' + fx(Fdiag, 2) + ' kN', x0, y0 - 1.95, { cor: 's4', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('vão 12 m · painéis de 3 m · altura ' + fx(h, 2) + ' m', 11.9, 4.8, { cor: 'fraco', tam: 11, alin: 'dir' });
    }
  });

  /* 4.2 — barras de força nula */
  F('#fig-4-2', {
    titulo: 'Figura 4.2',
    legenda: 'Duas regras que se aplicam só de olhar: nó com duas barras não colineares e sem carga (as duas são nulas) e nó com três barras, duas colineares, sem carga (a terceira é nula).',
    vista: [-0.6, 12.6, -2.6, 5.4],
    altura: 330,
    controles: [{ id: 'carga', rot: 'Carga no nó (0 = sem carga)', min: 0, max: 1, val: 0, passo: 1 }],
    desenhar: function (g, p) {
      var carga = p.carga;
      /* caso 1 */
      var ax = 2.4, ay = 3.2;
      g.txt('duas barras não colineares', ax, 5.0, { cor: 'suave', tam: 12, negrito: true });
      g.linha(ax, ay, ax - 1.8, ay - 1.8, { cor: carga ? 'texto' : 'fraco', larg: carga ? 3 : 2, tracejado: !carga });
      g.linha(ax, ay, ax + 1.8, ay - 0.4, { cor: carga ? 'texto' : 'fraco', larg: carga ? 3 : 2, tracejado: !carga });
      g.circ(ax, ay, 0.16, { preenche: 'texto', cor: null });
      if (carga) g.seta(ax, ay + 1.5, 0, -1.2, { cor: 'erro', larg: 2.2, rot: 'P', rotTam: 11.5, rotDy: 0.4, rotDx: 0 });
      g.txt(carga ? 'com carga: as duas trabalham' : 'sem carga: as duas são nulas', ax, 0.9, { cor: carga ? 'texto' : 'ok', tam: 11.5, negrito: !carga });

      /* caso 2 */
      var bx = 8.6, by = 3.2;
      g.txt('três barras, duas colineares', bx, 5.0, { cor: 'suave', tam: 12, negrito: true });
      g.linha(bx - 2, by, bx + 2, by, { cor: 'texto', larg: 3 });
      g.linha(bx, by, bx + 1.1, by - 1.8, { cor: carga ? 'texto' : 'fraco', larg: carga ? 3 : 2, tracejado: !carga });
      g.circ(bx, by, 0.16, { preenche: 'texto', cor: null });
      if (carga) g.seta(bx, by + 1.5, 0, -1.2, { cor: 'erro', larg: 2.2, rot: 'P', rotTam: 11.5, rotDy: 0.4, rotDx: 0 });
      g.txt(carga ? 'com carga: a terceira trabalha' : 'sem carga: a terceira é nula', bx, 0.9, { cor: carga ? 'texto' : 'ok', tam: 11.5, negrito: !carga });
      g.txt('barras nulas não são inúteis: travam a flambagem e carregam outras combinações de carga', 6, -2.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 5 ================= */

  /* 5.1 — alavanca e vantagem mecânica */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A vantagem mecânica de uma máquina é pura geometria: a razão entre os braços. O que se ganha em força, perde-se em deslocamento (exemplo 5.1).',
    vista: [-0.6, 12.6, -3.2, 5.4],
    altura: 350,
    controles: [
      { id: 'a', rot: 'Braço da mão', min: 60, max: 250, val: 150, passo: 10, un: 'mm' },
      { id: 'b', rot: 'Braço da mandíbula', min: 10, max: 80, val: 30, passo: 5, un: 'mm' },
      { id: 'F', rot: 'Força da mão', min: 20, max: 200, val: 100, passo: 10, un: 'N' }
    ],
    desenhar: function (g, p) {
      var a = p.a, b = p.b, Fm = p.F;
      var Fp = Fm * a / b, vm = a / b;
      var ox = 7.4, oy = 2.6, esc = 5.6 / 250;
      /* dois braços articulados no pino */
      var abr = rad(9);
      g.linha(ox, oy, ox + a * esc * Math.cos(abr), oy + a * esc * Math.sin(abr), { cor: 'acento', larg: 5 });
      g.linha(ox, oy, ox + a * esc * Math.cos(abr), oy - a * esc * Math.sin(abr), { cor: 'acento', larg: 5 });
      g.linha(ox, oy, ox - b * esc * Math.cos(abr * 2), oy + b * esc * Math.sin(abr * 2), { cor: 'acento', larg: 5 });
      g.linha(ox, oy, ox - b * esc * Math.cos(abr * 2), oy - b * esc * Math.sin(abr * 2), { cor: 'acento', larg: 5 });
      g.circ(ox, oy, 0.2, { preenche: 'fundo', cor: 'forte', larg: 2 });
      g.txt('pino', ox, oy + 0.6, { cor: 'suave', tam: 11, fundo: true });
      /* peça apertada */
      var px = ox - b * esc * Math.cos(abr * 2);
      g.ret(px - 0.5, oy - 0.35, 0.55, 0.7, { preenche: 's2', cor: null, alfa: 0.6 });
      /* forças */
      var ax = ox + a * esc * Math.cos(abr);
      g.seta(ax, oy + a * esc * Math.sin(abr) + 1.5, 0, -1.2, { cor: 'erro', larg: 2.4, rot: Fm + ' N', rotTam: 11.5, rotDy: 0.45, rotDx: 0 });
      g.seta(ax, oy - a * esc * Math.sin(abr) - 1.5, 0, 1.2, { cor: 'erro', larg: 2.4, rot: Fm + ' N', rotTam: 11.5, rotDy: -0.45, rotDx: 0 });
      g.seta(px, oy + 1.2, 0, -0.75, { cor: 'ok', larg: 2.6, ponta: 0.26 });
      g.seta(px, oy - 1.2, 0, 0.75, { cor: 'ok', larg: 2.6, ponta: 0.26 });
      g.cota(ox, oy - 2.3, ax, oy - 2.3, a + ' mm', { dy: -0.3 });
      g.cota(px, oy + 2.3, ox, oy + 2.3, b + ' mm', { dy: 0.3 });
      g.txt('F na peça = ' + fx(Fp, 0) + ' N', 2.4, 1.0, { cor: 'ok', tam: 14, negrito: true });
      g.txt('vantagem mecânica = ' + fx(vm, 2) + '×', 2.4, 0.3, { cor: 'suave', tam: 12 });
      g.txt('o deslocamento da mandíbula é ' + fx(vm, 2) + '× menor', 2.4, -0.4, { cor: 'fraco', tam: 11 });
      g.txt('ΣM no pino: F_mão · a = F_peça · b', 6, -2.6, { cor: 'suave', tam: 12 });
    }
  });

  /* 5.2 — cabo parabólico */
  F('#fig-5-2', {
    titulo: 'Figura 5.2',
    legenda: 'Quanto menor a flecha, maior a tração: H = qL²/8f. Reduzir a barriga do cabo pela metade dobra o esforço nos apoios (exemplo 5.2).',
    vista: [-0.6, 12.6, -3.4, 5.6],
    altura: 350,
    controles: [
      { id: 'f', rot: 'Flecha', min: 1, max: 10, val: 4, passo: 0.5, un: 'm' },
      { id: 'q', rot: 'Carga distribuída', min: 0.5, max: 6, val: 2, passo: 0.5, un: 'kN/m' }
    ],
    desenhar: function (g, p) {
      var L = 40, f = p.f, q = p.q;
      var H = q * L * L / (8 * f), V = q * L / 2, T = Math.hypot(H, V);
      var ox = 1.4, esc = 9.2 / L, topo = 4.6;
      var escF = 3.0 / Math.max(f, 1);
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var x = L * i / 60;
        var y = 4 * f * (x / L) * (1 - x / L);       /* parábola: flecha f no meio */
        pts.push([ox + x * esc, topo - y * escF * 1]);
      }
      /* torres */
      g.linha(ox, topo, ox, 0.4, { cor: 'forte', larg: 3 });
      g.linha(ox + L * esc, topo, ox + L * esc, 0.4, { cor: 'forte', larg: 3 });
      g.hachura(ox - 0.7, 0.4, 1.4, 0, { cor: 'forte', d: 0.2 });
      g.hachura(ox + L * esc - 0.7, 0.4, 1.4, 0, { cor: 'forte', d: 0.2 });
      g.caminho(pts, { cor: 'acento', larg: 3 });
      /* pendurais */
      for (i = 1; i < 10; i++) {
        var pt = pts[Math.round(60 * i / 10)];
        g.linha(pt[0], pt[1], pt[0], 1.2, { cor: 'borda', larg: 1 });
      }
      g.linha(ox, 1.2, ox + L * esc, 1.2, { cor: 'borda', larg: 3 });
      g.cota(ox + L * esc / 2, topo, ox + L * esc / 2, topo - f * escF, 'f = ' + fx(f, 1) + ' m', { dx: 0.9 });
      g.cota(ox, topo + 0.8, ox + L * esc, topo + 0.8, 'L = 40 m', { dy: 0.35 });
      /* forças no apoio */
      var k = 1.6 / Math.max(T, 1);
      g.seta(ox, topo, -H * k, 0, { cor: 's1', larg: 2.2, rot: 'H', rotTam: 11.5, rotDy: 0.4, rotDx: 0 });
      g.seta(ox, topo, 0, V * k, { cor: 's3', larg: 2.2, rot: 'V', rotTam: 11.5 });
      g.txt('H = qL²/8f = ' + fx(H, 1) + ' kN', 6, -1.5, { cor: 's1', tam: 13, negrito: true });
      g.txt('V = qL/2 = ' + fx(V, 1) + ' kN      T máx = ' + fx(T, 1) + ' kN', 6, -2.2, { cor: 'texto', tam: 12.5 });
      g.txt('a componente horizontal é a mesma em todo o cabo', 6, -2.9, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 6 ================= */

  /* 6.1 — cone de atrito e escada */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Enquanto a reação do contato ficar dentro do cone de semiângulo φ = arctan μ, o corpo não escorrega. À direita, a escada: o ângulo mínimo depende só de μ (exemplo 6.2).',
    vista: [-0.6, 13.4, -3.2, 5.6],
    altura: 350,
    controles: [
      { id: 'mu', rot: 'Coeficiente μₛ', min: 0.05, max: 0.8, val: 0.3, passo: 0.05 },
      { id: 'ang', rot: 'Inclinação da escada', min: 25, max: 85, val: 59, passo: 1, un: '°' }
    ],
    desenhar: function (g, p) {
      var mu = p.mu, phi = Math.atan(mu), th = rad(p.ang);
      /* cone de atrito */
      var cx = 2.9, cy = 1.4;
      g.hachura(cx - 2.2, cy, 4.4, 0, { cor: 'forte', d: 0.22 });
      g.ret(cx - 0.8, cy, 1.6, 1.0, { preenche: 'acento', cor: null, alfa: 0.35 });
      g.caminho([[cx, cy], [cx - 3.1 * Math.sin(phi), cy + 3.1 * Math.cos(phi)], [cx + 3.1 * Math.sin(phi), cy + 3.1 * Math.cos(phi)]],
        { cor: 'ok', larg: 1.6, fechar: true, preenche: 'ok', alfa: 0.16 });
      g.linha(cx, cy, cx, cy + 3.4, { cor: 'fraco', larg: 1, tracejado: true });
      g.arco(cx, cy, 2.0, Math.PI / 2, Math.PI / 2 - phi, { cor: 'ok' });
      g.txt('φ = ' + fx(phi * 180 / Math.PI, 1) + '°', cx + 1.5, cy + 2.4, { cor: 'ok', tam: 12, negrito: true, fundo: true });
      g.txt('cone de atrito', cx, cy + 4.1, { cor: 'suave', tam: 12, negrito: true });
      g.txt('reação dentro do cone → não escorrega', cx, -1.3, { cor: 'fraco', tam: 11 });

      /* escada */
      var ex = 8.0, ey = 1.4, Le = 3.6;
      var thmin = Math.atan(1 / (2 * mu));
      var segura = th >= thmin;
      g.hachura(ex - 0.4, ey, 4.6, 0, { cor: 'forte', d: 0.22 });
      g.linha(ex, ey, ex, ey + 4.2, { cor: 'forte', larg: 2.6 });
      g.hachura(ex, ey, 4.2, Math.PI / 2, { cor: 'forte', d: 0.22 });
      var pex = ex + Le * Math.cos(th), pey = ey;
      var tox = ex, toy = ey + Le * Math.sin(th);
      g.linha(pex, pey, tox, toy, { cor: segura ? 'ok' : 'erro', larg: 4.5 });
      g.circ((pex + tox) / 2, (pey + toy) / 2, 0.13, { preenche: 'texto', cor: null });
      g.seta((pex + tox) / 2, (pey + toy) / 2, 0, -1.0, { cor: 'erro', larg: 1.8, rot: 'W', rotTam: 11, rotDx: 0.42, rotDy: 0 });
      g.seta(tox, toy, 0.9, 0, { cor: 's1', larg: 1.8, rot: 'N parede', rotTam: 10.5, rotDy: 0.4, rotDx: 0.3 });
      g.seta(pex, pey, 0, 1.1, { cor: 's3', larg: 1.8, rot: 'N piso', rotTam: 10.5, rotDx: 0.75, rotDy: 0.1 });
      g.seta(pex, pey, -0.9, 0, { cor: 's2', larg: 1.8, rot: 'f', rotTam: 11, rotDy: -0.45, rotDx: 0 });
      g.arco(pex, pey, 1.0, Math.PI, Math.PI - th, { cor: 'suave' });
      g.txt(p.ang + '°', pex - 1.35, pey + 0.5, { cor: 'suave', tam: 11 });
      g.txt('escada em parede lisa', 10.0, 5.3, { cor: 'suave', tam: 12, negrito: true });
      g.txt('θ mínimo = arctan(1/2μ) = ' + fx(thmin * 180 / Math.PI, 1) + '°', 10.0, -1.3, { cor: 'texto', tam: 12 });
      g.txt(segura ? 'inclinação suficiente: a escada fica' : 'inclinação insuficiente: escorrega',
        10.0, -2.0, { cor: segura ? 'ok' : 'erro', tam: 12.5, negrito: true });
      g.txt('o bloco escorrega quando tan θ > μₛ: a massa se cancela e não entra na conta', 3.0, -2.6, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 7 ================= */

  /* 7.1 — centroide de figura composta */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Centroide de uma cantoneira: média das posições ponderada pelas áreas. Mude as dimensões e acompanhe G se deslocar para o lado de mais material (exemplo 7.1).',
    vista: [-1.4, 11.6, -3.6, 5.4],
    altura: 350,
    controles: [
      { id: 'b', rot: 'Comprimento da aba', min: 20, max: 120, val: 80, passo: 5, un: 'mm' },
      { id: 'H', rot: 'Altura da alma', min: 40, max: 140, val: 100, passo: 5, un: 'mm' },
      { id: 't', rot: 'Espessura', min: 10, max: 40, val: 20, passo: 2, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var b = p.b, H = p.H, t = p.t;
      var A1 = t * H, x1 = t / 2, y1 = H / 2;                 /* alma vertical */
      var A2 = (b - t) * t, x2 = t + (b - t) / 2, y2 = t / 2; /* aba horizontal */
      var A = A1 + A2;
      var xb = (A1 * x1 + A2 * x2) / A, yb = (A1 * y1 + A2 * y2) / A;
      var esc = 4.6 / Math.max(b, H);     /* o desenho acompanha a maior dimensão */
      var ox = 1.0, oy = 0.1;
      g.ret(ox, oy, t * esc, H * esc, { preenche: 's1', cor: 'forte', larg: 1.4, alfa: 0.3 });
      g.ret(ox + t * esc, oy, (b - t) * esc, t * esc, { preenche: 's3', cor: 'forte', larg: 1.4, alfa: 0.3 });
      g.circ(ox + x1 * esc, oy + y1 * esc, 0.1, { preenche: 's1', cor: null });
      g.circ(ox + x2 * esc, oy + y2 * esc, 0.1, { preenche: 's3', cor: null });
      /* centroide */
      var gx = ox + xb * esc, gy = oy + yb * esc;
      g.linha(gx, oy - 0.5, gx, oy + H * esc + 0.5, { cor: 'erro', larg: 1, tracejado: [5, 4] });
      g.linha(ox - 0.5, gy, ox + b * esc + 0.5, gy, { cor: 'erro', larg: 1, tracejado: [5, 4] });
      g.circ(gx, gy, 0.16, { cor: 'erro', larg: 2.2 });
      g.txt('G', gx + 0.4, gy + 0.35, { cor: 'erro', tam: 12.5, negrito: true, fundo: true });
      g.cota(ox, oy - 1.0, gx, oy - 1.0, 'x̄ = ' + fx(xb, 1) + ' mm', { dy: -0.3 });
      g.cota(ox - 1.0, oy, ox - 1.0, gy, 'ȳ = ' + fx(yb, 1) + ' mm', { dx: -0.2 });

      var x0 = 6.2;
      g.txt('A₁ = ' + fx(A1, 0) + ' mm²  em (' + fx(x1, 1) + '; ' + fx(y1, 1) + ')', x0, 4.4, { cor: 's1', tam: 11.5, alin: 'esq' });
      g.txt('A₂ = ' + fx(A2, 0) + ' mm²  em (' + fx(x2, 1) + '; ' + fx(y2, 1) + ')', x0, 3.8, { cor: 's3', tam: 11.5, alin: 'esq' });
      g.txt('A total = ' + fx(A, 0) + ' mm²', x0, 3.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('x̄ = ΣAᵢx̄ᵢ/ΣAᵢ = ' + fx(xb, 1) + ' mm', x0, 2.2, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('ȳ = ΣAᵢȳᵢ/ΣAᵢ = ' + fx(yb, 1) + ' mm', x0, 1.5, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('num L, o centroide cai no vazio', x0, 0.5, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });

  /* ================= capítulo 8 ================= */

  /* 8.1 — momento de inércia: a altura ao cubo */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Com a mesma área, a seção alta é muito mais rígida: I cresce com h³. A barra cinza mostra a inércia da seção deitada, para comparação.',
    vista: [-0.6, 12.6, -3.2, 5.4],
    altura: 350,
    controles: [
      { id: 'h', rot: 'Altura da seção', min: 40, max: 200, val: 150, passo: 5, un: 'mm' },
      { id: 'd', rot: 'Afastamento do eixo (Steiner)', min: 0, max: 150, val: 0, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var A = 7500;                      /* área fixa: 50 × 150 mm */
      var h = p.h, b = A / h, d = p.d;
      var Ic = b * Math.pow(h, 3) / 12;
      var I = Ic + A * d * d;
      var Ideit = h * Math.pow(b, 3) / 12;
      var esc = 3.4 / 200;
      var cx = 2.8, cy = 0.9;
      g.ret(cx - b * esc / 2, cy, b * esc, h * esc, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.3 });
      var gy = cy + h * esc / 2;
      g.circ(cx, gy, 0.12, { preenche: 'texto', cor: null });
      g.linha(cx - 2.4, gy, cx + 2.4, gy, { cor: 'borda', larg: 1, tracejado: [5, 4] });
      g.txt('eixo centroidal', cx + 2.5, gy, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      var ey = gy - d * esc;
      if (d > 0.01) {
        g.linha(cx - 2.4, ey, cx + 2.4, ey, { cor: 'erro', larg: 1.6 });
        g.cota(cx - 1.6, gy, cx - 1.6, ey, 'd = ' + d + ' mm', { dx: -0.2 });
        g.txt('eixo de cálculo', cx + 2.5, ey, { cor: 'erro', tam: 10.5, alin: 'esq' });
      }
      g.cota(cx - b * esc / 2, cy - 0.5, cx + b * esc / 2, cy - 0.5, 'b = ' + fx(b, 0) + ' mm', { dy: -0.3 });
      g.cota(cx + b * esc / 2 + 0.5, cy, cx + b * esc / 2 + 0.5, cy + h * esc, 'h = ' + h + ' mm', { dx: 0.85 });

      var x0 = 7.0, esc2 = 3.6 / 25e6;
      g.ret(x0, 0.6, 0.9, Math.min(4.2, Ic * esc2), { preenche: 's1', cor: null, alfa: 0.8 });
      g.ret(x0 + 1.3, 0.6, 0.9, Math.min(4.2, I * esc2), { preenche: 'erro', cor: null, alfa: 0.8 });
      g.ret(x0 + 2.6, 0.6, 0.9, Math.min(4.2, Ideit * esc2), { preenche: 'borda', cor: null, alfa: 0.9 });
      g.linha(x0 - 0.2, 0.6, x0 + 3.9, 0.6, { cor: 'forte', larg: 1.3 });
      g.txt('I centroidal', x0 + 0.45, 0.25, { cor: 'suave', tam: 10.5 });
      g.txt('I no eixo', x0 + 1.75, 0.25, { cor: 'suave', tam: 10.5 });
      g.txt('deitada', x0 + 3.05, 0.25, { cor: 'suave', tam: 10.5 });
      g.txt('I_c = bh³/12 = ' + fx(Ic / 1e6, 2) + ' ×10⁶ mm⁴', x0, 5.0, { cor: 's1', tam: 12, alin: 'esq', negrito: true });
      g.txt('I = I_c + A·d² = ' + fx(I / 1e6, 2) + ' ×10⁶ mm⁴', x0, 4.4, { cor: 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('deitada: ' + fx(Ideit / 1e6, 2) + ' ×10⁶ mm⁴', x0, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('raio de giração r = ' + fx(Math.sqrt(I / A), 1) + ' mm', x0, 3.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('área fixa de ' + A + ' mm² em todos os casos', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

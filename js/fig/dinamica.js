/* ============================================================
   Figuras ilustrativas de Dinâmica (módulo js/core/figura.js)
   Uma figura por conceito, no ponto do texto em que ele aparece.
   Os desenhos usam as mesmas equações do capítulo — nada é "ilustrativo
   por fora": mover um controle muda o desenho pela física.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var g9 = 9.81;
  var rad = function (d) { return d * Math.PI / 180; };
  var fx = function (v, n) { return (Math.round(v * Math.pow(10, n || 1)) / Math.pow(10, n || 1)).toLocaleString('pt-BR'); };

  /* ================= capítulo 1 ================= */

  /* 1.1 — posição, velocidade e aceleração numa trajetória curva */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'A velocidade é sempre tangente à trajetória. A aceleração, não: ela aponta para dentro da curva. Arraste o controle para percorrer o caminho.',
    vista: [-0.6, 11, -0.8, 6.2],
    altura: 350,
    controles: [{ id: 's', rot: 'Posição na trajetória', min: 5, max: 95, val: 35, passo: 1, un: '%' }],
    desenhar: function (g, p) {
      /* trajetória: y = 1 + 2.6 sen(0.55 x) com x de 0.6 a 10.4 */
      function P(x) { return [x, 1.6 + 2.2 * Math.sin(0.52 * x)]; }
      function dP(x) { return [1, 2.2 * 0.52 * Math.cos(0.52 * x)]; }
      function d2P(x) { return [0, -2.2 * 0.52 * 0.52 * Math.sin(0.52 * x)]; }
      var pts = [], i;
      for (i = 0; i <= 120; i++) pts.push(P(0.6 + 9.8 * i / 120));
      g.caminho(pts, { cor: 'borda', larg: 3 });

      var x = 0.6 + 9.8 * p.s / 100, pos = P(x), d = dP(x), dd = d2P(x);
      var m = Math.hypot(d[0], d[1]);
      var ut = [d[0] / m, d[1] / m];
      var un = [-ut[1], ut[0]];
      /* velocidade escalar constante: a = v² κ n (só aceleração normal) */
      var kap = (d[0] * dd[1] - d[1] * dd[0]) / Math.pow(m, 3);
      var v = 2.4, an = v * v * kap;
      var eN = 1.1 / Math.max(0.35, Math.abs(an));

      g.seta(0, 0, pos[0], pos[1], { cor: 'fraco', larg: 1.4, rot: 'r', rotDx: -0.45, rotDy: 0.1 });
      g.seta(pos[0], pos[1], ut[0] * 2.1, ut[1] * 2.1, { cor: 'acento', larg: 2.6, rot: 'v', rotTam: 13 });
      g.seta(pos[0], pos[1], un[0] * an * eN, un[1] * an * eN, { cor: 's2', larg: 2.6, rot: 'a = aₙ', rotTam: 13 });
      g.circ(pos[0], pos[1], 0.17, { preenche: 'texto', cor: null });

      /* centro de curvatura */
      var R = 1 / kap;
      if (Math.abs(R) < 9) {
        var c = [pos[0] + un[0] * R, pos[1] + un[1] * R];
        g.linha(pos[0], pos[1], c[0], c[1], { cor: 'fraco', larg: 1, tracejado: true });
        g.circ(c[0], c[1], 0.08, { preenche: 'fraco', cor: null });
        g.txt('centro de curvatura', c[0], c[1] + (R > 0 ? 0.42 : -0.42), { cor: 'fraco', tam: 11, fundo: true });
      }
      g.txt('velocidade escalar constante: só há aceleração normal', 5.5, 5.8, { cor: 'suave', tam: 11.5 });
      g.seta(0, 0, 1.1, 0, { cor: 'fraco', larg: 1, ponta: 0.18 });
      g.seta(0, 0, 0, 1.1, { cor: 'fraco', larg: 1, ponta: 0.18 });
      g.txt('x', 1.25, -0.05, { cor: 'fraco', tam: 11 });
      g.txt('y', -0.05, 1.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 1.2 — frenagem: a constante */
  F('#fig-1-2', {
    titulo: 'Figura 1.2',
    legenda: 'Frenagem com desaceleração constante (exemplo 1.1). A distância cresce com o quadrado da velocidade: dobrar v quadruplica o espaço de parada.',
    vista: [-0.5, 11.5, -1.6, 4.4],
    altura: 350,
    animar: true,
    controles: [
      { id: 'v0', rot: 'Velocidade inicial', min: 20, max: 120, val: 90, passo: 5, un: 'km/h' },
      { id: 'a', rot: 'Desaceleração', min: 2, max: 9, val: 6, passo: 0.5, un: 'm/s²' }
    ],
    desenhar: function (g, p, t) {
      var v0 = p.v0 / 3.6, a = p.a;
      var tp = v0 / a, d = v0 * v0 / (2 * a);
      var ciclo = tp + 1.2;
      var tt = (t % ciclo);
      var s = tt < tp ? v0 * tt - 0.5 * a * tt * tt : d;
      var v = tt < tp ? v0 - a * tt : 0;
      var esc = 10 / Math.max(12, d);       /* metros -> unidades do desenho */

      g.hachura(0, 0, 11, 0, { cor: 'forte' });
      /* régua em metros */
      var passo = d > 60 ? 20 : 10;
      for (var x = 0; x <= Math.max(12, d) + 1; x += passo) {
        var ux = x * esc;
        if (ux > 11) break;
        g.linha(ux, 0, ux, -0.25, { cor: 'fraco', larg: 1 });
        g.txt(x + ' m', ux, -0.6, { cor: 'fraco', tam: 10.5 });
      }
      /* carro */
      var cx = s * esc;
      g.ret(cx - 0.55, 0.06, 1.1, 0.42, { preenche: 'acento', cor: null, alfa: 0.85 });
      g.ret(cx - 0.3, 0.46, 0.55, 0.3, { preenche: 'acento', cor: null, alfa: 0.55 });
      g.circ(cx - 0.3, 0.06, 0.12, { preenche: 'texto', cor: null });
      g.circ(cx + 0.3, 0.06, 0.12, { preenche: 'texto', cor: null });
      if (v > 0.01) g.seta(cx, 1.15, Math.max(0.3, v / v0 * 2.2), 0, { cor: 'acento', larg: 2.2, rot: fx(v) + ' m/s', rotDy: 0.42, rotDx: 0 });
      if (tt < tp) g.seta(cx, 0.85, -Math.max(0.3, a / 9 * 1.6), 0, { cor: 'erro', larg: 2, rot: 'a', rotDy: -0.1 });
      /* marca final */
      g.linha(d * esc, -0.1, d * esc, 2.2, { cor: 'ok', larg: 1.4, tracejado: true });
      g.txt('para em ' + fx(d) + ' m (' + fx(tp) + ' s)', d * esc, 2.5, { cor: 'ok', tam: 12, negrito: true, fundo: true });
      /* barra de velocidade */
      g.txt('v² = v₀² − 2a·s', 0.1, 3.9, { cor: 'suave', tam: 12, alin: 'esq' });
    }
  });

  /* 1.3 — projétil */
  F('#fig-1-3', {
    titulo: 'Figura 1.3',
    legenda: 'Lançamento oblíquo: o movimento horizontal é uniforme e o vertical, uniformemente variado. Ângulos complementares (30° e 60°) dão o mesmo alcance; o máximo é a 45°.',
    vista: [-0.5, 11.5, -0.8, 6.5],
    altura: 350,
    animar: true,
    controles: [
      { id: 'ang', rot: 'Ângulo de lançamento', min: 10, max: 80, val: 30, passo: 1, un: '°' },
      { id: 'v0', rot: 'Velocidade inicial', min: 10, max: 30, val: 20, passo: 1, un: 'm/s' }
    ],
    desenhar: function (g, p, t) {
      var th = rad(p.ang), v0 = p.v0;
      var vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
      var tv = 2 * vy / g9, R = vx * tv, H = vy * vy / (2 * g9);
      var Rmax = v0 * v0 / g9;
      var esc = 10.4 / Math.max(Rmax, 1);
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var tt = tv * i / 60;
        pts.push([vx * tt * esc, (vy * tt - 0.5 * g9 * tt * tt) * esc]);
      }
      g.hachura(0, 0, 11, 0, { cor: 'forte' });
      /* o mesmo alcance pelo ângulo complementar */
      var th2 = Math.PI / 2 - th, p2 = [];
      for (i = 0; i <= 60; i++) {
        var t2 = 2 * v0 * Math.sin(th2) / g9 * i / 60;
        p2.push([v0 * Math.cos(th2) * t2 * esc, (v0 * Math.sin(th2) * t2 - 0.5 * g9 * t2 * t2) * esc]);
      }
      g.caminho(p2, { cor: 'borda', larg: 1.6, tracejado: true });
      g.txt(fx(90 - p.ang, 0) + '° — mesmo alcance', p2[30][0], p2[30][1] + 0.35, { cor: 'fraco', tam: 11, fundo: true });
      g.caminho(pts, { cor: 'acento', larg: 2.4 });

      var ta = (t % (tv + 0.7));
      if (ta <= tv) {
        var bx = vx * ta * esc, by = (vy * ta - 0.5 * g9 * ta * ta) * esc;
        var bvx = vx, bvy = vy - g9 * ta, k = 0.1 * esc * 3;
        g.circ(bx, by, 0.16, { preenche: 'acento', cor: null });
        g.seta(bx, by, bvx * k, bvy * k, { cor: 's2', larg: 2, rot: 'v', rotTam: 12 });
        g.seta(bx, by, 0, -g9 * 0.1 * esc * 1.2, { cor: 'erro', larg: 1.8, rot: 'g', rotTam: 12 });
      }
      g.seta(0, 0, Math.cos(th) * 1.6, Math.sin(th) * 1.6, { cor: 'texto', larg: 2, rot: 'v₀', rotTam: 12 });
      g.arco(0, 0, 0.95, 0, th, { cor: 'suave' });
      g.txt(p.ang + '°', 1.25 * Math.cos(th / 2), 1.25 * Math.sin(th / 2), { cor: 'suave', tam: 11 });
      g.linha(0, H * esc, R * esc, H * esc, { cor: 'fraco', larg: 1, tracejado: true });
      g.txt('h = ' + fx(H, 2) + ' m', R * esc * 0.5, H * esc + 0.33, { cor: 'fraco', tam: 11, fundo: true });
      g.cota(0, -0.45, R * esc, -0.45, 'R = ' + fx(R, 1) + ' m', { dy: -0.3 });
      g.txt('tempo de voo ' + fx(tv, 2) + ' s', 10.9, 6.1, { cor: 'suave', tam: 11.5, alin: 'dir' });
    }
  });

  /* 1.4 — componentes normal e tangencial */
  F('#fig-1-4', {
    titulo: 'Figura 1.4',
    legenda: 'Numa curva de raio 50 m: a componente tangencial muda o módulo da velocidade; a normal, a direção. A aceleração total é a soma vetorial das duas (exemplo 1.4).',
    vista: [-6.4, 6.4, -4.6, 4.6],
    altura: 350,
    controles: [
      { id: 'v', rot: 'Velocidade', min: 5, max: 30, val: 15, passo: 1, un: 'm/s' },
      { id: 'at', rot: 'Aceleração tangencial', min: -4, max: 4, val: 2, passo: 0.5, un: 'm/s²' }
    ],
    desenhar: function (g, p) {
      var R = 50, Rd = 3.4, ang = rad(55);
      var an = p.v * p.v / R, at = p.at, a = Math.hypot(an, at);
      var esc = 1.6 / Math.max(2.2, a);     /* m/s² -> unidades */
      g.circ(0, 0, Rd, { cor: 'borda', larg: 3 });
      g.circ(0, 0, 0.07, { preenche: 'fraco', cor: null });
      g.cota(0, 0, Rd * Math.cos(rad(-35)), Rd * Math.sin(rad(-35)), 'ρ = 50 m', { dy: 0.1 });
      var px = Rd * Math.cos(ang), py = Rd * Math.sin(ang);
      var ut = [-Math.sin(ang), Math.cos(ang)], un = [-Math.cos(ang), -Math.sin(ang)];
      /* carrinho */
      g.circ(px, py, 0.18, { preenche: 'texto', cor: null });
      g.seta(px, py, ut[0] * 1.5, ut[1] * 1.5, { cor: 'acento', larg: 2.2, rot: 'v = ' + p.v + ' m/s', rotTam: 11.5, rotDx: ut[0] * 1.1, rotDy: ut[1] * 0.5 });
      var axt = ut[0] * at * esc, ayt = ut[1] * at * esc;
      var axn = un[0] * an * esc, ayn = un[1] * an * esc;
      g.seta(px, py, axt, ayt, { cor: 's2', larg: 2, rot: 'aₜ = ' + fx(at, 1), rotTam: 11, rotDx: ut[0] * 0.9, rotDy: ut[1] * 0.6 });
      g.seta(px, py, axn, ayn, { cor: 's3', larg: 2, rot: 'aₙ = ' + fx(an, 2), rotTam: 11, rotDx: un[0] * 0.6, rotDy: un[1] * 0.8 });
      /* resultante */
      g.linha(px + axt, py + ayt, px + axt + axn, py + ayt + ayn, { cor: 'fraco', larg: 1, tracejado: true });
      g.linha(px + axn, py + ayn, px + axt + axn, py + ayt + ayn, { cor: 'fraco', larg: 1, tracejado: true });
      g.seta(px, py, axt + axn, ayt + ayn, { cor: 'erro', larg: 2.6, rot: '|a| = ' + fx(a, 2) + ' m/s²', rotTam: 12, rotDx: (axt + axn) * 0.22, rotDy: (ayt + ayn) * 0.28 });
      g.txt(at > 0.01 ? 'acelerando' : at < -0.01 ? 'freando' : 'velocidade escalar constante', 0, -4.2, { cor: 'suave', tam: 12 });
      g.txt('aₙ = v²/ρ', 0, 0.4, { cor: 'fraco', tam: 11.5 });
    }
  });

  /* 1.5 — polares e Coriolis */
  F('#fig-1-5', {
    titulo: 'Figura 1.5',
    legenda: 'Cursor que desliza para fora de uma haste girante (exemplo 1.5). A parcela 2ṙθ̇ — Coriolis — aparece porque o cursor precisa ganhar velocidade transversal ao se afastar do eixo.',
    vista: [-5.2, 5.2, -5.2, 5.2],
    altura: 350,
    animar: true,
    controles: [
      { id: 'w', rot: 'Rotação da haste ω', min: 0.5, max: 3, val: 2, passo: 0.1, un: 'rad/s' },
      { id: 'vr', rot: 'Velocidade relativa ṙ', min: 0, max: 2, val: 1, passo: 0.1, un: 'm/s' }
    ],
    desenhar: function (g, p, t) {
      var w = p.w, vr = p.vr;
      var ciclo = 2.6;
      var tt = (t % ciclo);
      var r = 0.4 + vr * tt;
      if (r > 3.4) r = 3.4;
      var th = w * t;
      var ur = [Math.cos(th), Math.sin(th)], ut = [-Math.sin(th), Math.cos(th)];
      g.circ(0, 0, 3.9, { cor: 'borda', larg: 1, tracejado: true });
      g.linha(0, 0, ur[0] * 4, ur[1] * 4, { cor: 'forte', larg: 4 });
      g.circ(0, 0, 0.2, { preenche: 'baixo', cor: 'forte' });
      g.arco(0, 0, 1.1, th - 1.1, th - 0.25, { cor: 'suave', ponta: true });
      g.txt('ω', (1.45) * Math.cos(th - 0.7), (1.45) * Math.sin(th - 0.7), { cor: 'suave', tam: 12 });

      var px = ur[0] * r, py = ur[1] * r;
      g.ret(px - 0.22, py - 0.22, 0.44, 0.44, { preenche: 'acento', cor: null, alfa: 0.9 });
      /* acelerações em coordenadas polares */
      var ar = -r * w * w, atg = 2 * vr * w;
      var esc = 1.5 / Math.max(2, Math.hypot(ar, atg));
      g.seta(px, py, ur[0] * ar * esc, ur[1] * ar * esc, { cor: 's3', larg: 2, rot: 'aᵣ = −rω² = ' + fx(ar, 1), rotTam: 11, rotDx: -ur[0] * 1.3, rotDy: -ur[1] * 0.7 });
      g.seta(px, py, ut[0] * atg * esc, ut[1] * atg * esc, { cor: 's2', larg: 2, rot: 'Coriolis 2ṙω = ' + fx(atg, 1), rotTam: 11, rotDx: ut[0] * 1.6, rotDy: ut[1] * 0.8 });
      g.seta(px, py, ur[0] * vr * 0.5, ur[1] * vr * 0.5, { cor: 'fraco', larg: 1.4, ponta: 0.18 });
      g.txt('ṙ', px + ur[0] * (vr * 0.5 + 0.35), py + ur[1] * (vr * 0.5 + 0.35), { cor: 'fraco', tam: 11 });
      g.txt('r = ' + fx(r, 2) + ' m', 0, -4.7, { cor: 'suave', tam: 11.5 });
    }
  });

  /* 1.6 — movimento relativo */
  F('#fig-1-6', {
    titulo: 'Figura 1.6',
    legenda: 'Barco que atravessa um rio: a velocidade em relação à margem é a soma da velocidade própria com a da correnteza. Para seguir reto, é preciso apontar contra a corrente.',
    vista: [-0.6, 11.6, -1.2, 6.2],
    altura: 350,
    animar: true,
    controles: [
      { id: 'proa', rot: 'Direção da proa', min: 30, max: 150, val: 90, passo: 1, un: '°' },
      { id: 'c', rot: 'Correnteza', min: 0, max: 3, val: 1.5, passo: 0.1, un: 'm/s' }
    ],
    desenhar: function (g, p, t) {
      var vb = 2.5, th = rad(p.proa), c = p.c;
      var vx = vb * Math.cos(th) + c, vy = vb * Math.sin(th);
      g.ret(0, 0.6, 11, 4.4, { preenche: 'acento', cor: null, alfa: 0.08 });
      g.hachura(0, 0.6, 11, 0, { cor: 'forte' });
      g.hachura(11, 5, -11, 0, { cor: 'forte' });
      for (var i = 0; i < 5; i++) {
        var yy = 1.2 + i * 0.85, ff = ((t * c * 0.5 + i * 2) % 11);
        g.seta(ff, yy, Math.max(0.2, c * 0.5), 0, { cor: 'fraco', larg: 1.2, ponta: 0.16 });
      }
      var ciclo = vy > 0.05 ? 4.4 / vy : 4;
      var tt = (t % (ciclo + 0.6));
      var bx = 1 + Math.min(tt, ciclo) * vx, by = 0.6 + Math.min(tt, ciclo) * vy;
      if (bx > 11) bx = 11;
      g.caminho([[1, 0.6], [1 + ciclo * vx, 0.6 + ciclo * vy]], { cor: 'borda', larg: 1.4, tracejado: true });
      g.caminho([[bx - 0.42, by], [bx + 0.42, by], [bx + 0.2, by + 0.3], [bx - 0.2, by + 0.3]], { preenche: 'acento', cor: null, fechar: true, alfa: 0.9 });
      var k = 0.75;
      g.seta(bx, by, vb * Math.cos(th) * k, vb * Math.sin(th) * k, { cor: 's3', larg: 2, rot: 'v do barco', rotTam: 11 });
      g.seta(bx + vb * Math.cos(th) * k, by + vb * Math.sin(th) * k, c * k, 0, { cor: 's2', larg: 2, rot: 'correnteza', rotTam: 11, rotDy: 0.35 });
      g.seta(bx, by, vx * k, vy * k, { cor: 'erro', larg: 2.4, rot: 'v em relação à margem', rotTam: 11.5, rotDx: 1.4, rotDy: -0.3 });
      g.txt('deriva: ' + fx(vx * ciclo, 1) + ' m rio abaixo', 0.2, 5.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
    }
  });

  /* ================= capítulo 2 ================= */

  /* 2.2 — diagrama de corpo livre e diagrama cinético */
  F('#fig-2-2', {
    titulo: 'Figura 2.2',
    legenda: 'Os dois diagramas lado a lado: à esquerda as forças reais; à direita o resultado delas, m·a. Igualar os dois, componente a componente, é toda a cinética da partícula.',
    vista: [-0.6, 13.4, -1.6, 6.4],
    altura: 350,
    controles: [{ id: 'ang', rot: 'Inclinação da rampa', min: 0, max: 45, val: 25, passo: 1, un: '°' }],
    desenhar: function (g, p) {
      var th = rad(p.ang), mu = 0.2, m = 10;
      var N = m * g9 * Math.cos(th), Px = m * g9 * Math.sin(th), f = mu * N;
      var desliza = Math.tan(th) > 0.3;
      var a = desliza ? g9 * (Math.sin(th) - mu * Math.cos(th)) : 0;
      var esc = 2.2 / (m * g9);

      function bloco(ox, forcas) {
        /* rampa */
        var L = 5.2;
        g.caminho([[ox, 0], [ox + L * Math.cos(th), L * Math.sin(th)], [ox + L * Math.cos(th), 0]], { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.5 });
        g.hachura(ox, 0, L * Math.cos(th), 0, { cor: 'forte' });
        var bx = ox + 2.4 * Math.cos(th), by = 2.4 * Math.sin(th);
        g.retGirado(bx - 0.6 * Math.cos(th), by - 0.6 * Math.sin(th), 1.2, 0.9, th, { preenche: 'acento', cor: 'acento', alfa: 0.22 });
        /* [centro do bloco, base (contato com a rampa)] */
        return [bx - 0.45 * Math.sin(th), by + 0.45 * Math.cos(th), bx, by];
      }
      var c1 = bloco(0.2);
      g.txt('Diagrama de corpo livre', 2.9, 6.1, { cor: 'suave', tam: 12, negrito: true });
      g.seta(c1[0], c1[1], 0, -m * g9 * esc, { cor: 'erro', larg: 2.2, rot: 'P = mg', rotTam: 11.5, rotDx: 0.75, rotDy: 0 });
      g.seta(c1[2], c1[3], -Math.sin(th) * N * esc, Math.cos(th) * N * esc, { cor: 's3', larg: 2.2, rot: 'N', rotTam: 12, rotDx: -0.45, rotDy: 0.2 });
      g.seta(c1[2], c1[3], -Math.cos(th) * f * esc, -Math.sin(th) * f * esc, { cor: 's2', larg: 2.2, rot: 'f', rotTam: 12, rotDx: -0.3, rotDy: -0.35 });
      g.arco(0.2, 0, 1.5, 0, th, { cor: 'suave' });
      g.txt(p.ang + '°', 0.2 + 1.85 * Math.cos(th / 2), 1.85 * Math.sin(th / 2), { cor: 'suave', tam: 11 });

      g.txt('=', 6.75, 2.6, { cor: 'texto', tam: 22, negrito: true });

      var c2 = bloco(7.3);
      g.txt('Diagrama cinético', 10.1, 6.1, { cor: 'suave', tam: 12, negrito: true });
      if (a > 0.01) {
        g.seta(c2[0], c2[1], Math.cos(th) * m * a * esc, Math.sin(th) * m * a * esc,
          { cor: 'info', larg: 2.6, rot: 'm·a = ' + fx(m * a, 0) + ' N', rotTam: 11.5, rotDx: 0.3, rotDy: 0.5 });
      } else {
        g.txt('m·a = 0 (equilíbrio)', c2[0] + 1, c2[1] + 0.5, { cor: 'info', tam: 11.5, negrito: true, fundo: true });
      }
      g.txt(desliza ? 'desliza: a = g(sen θ − μ cos θ) = ' + fx(a, 2) + ' m/s²'
                    : 'parado: o atrito estático dá conta (tan θ ≤ μₑ = 0,3)',
        6.6, -1.2, { cor: desliza ? 'aviso' : 'ok', tam: 12 });
    }
  });

  /* 2.3 — ângulo de atrito */
  F('#fig-2-3', {
    titulo: 'Figura 2.3',
    legenda: 'O bloco escorrega quando tan θ passa de μₑ — ou seja, quando a inclinação supera o ângulo de atrito. A massa não entra: ela se cancela dos dois lados.',
    vista: [-0.6, 12.6, -2.2, 6.2],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Inclinação θ', min: 0, max: 50, val: 25, passo: 1, un: '°' },
      { id: 'mu', rot: 'Coeficiente estático μₑ', min: 0.05, max: 0.9, val: 0.4, passo: 0.05 },
      { id: 'm', rot: 'Massa do bloco', min: 2, max: 40, val: 10, passo: 1, un: 'kg' }
    ],
    desenhar: function (g, p) {
      var th = rad(p.ang), mu = p.mu, m = p.m;
      var phi = Math.atan(mu);
      var N = m * g9 * Math.cos(th), nec = m * g9 * Math.sin(th), disp = mu * N;
      var desliza = nec > disp + 1e-9;
      var L = 6.4;
      g.caminho([[0, 0], [L * Math.cos(th), L * Math.sin(th)], [L * Math.cos(th), 0]], { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.4 });
      g.hachura(0, 0, L * Math.cos(th), 0, { cor: 'forte' });
      var bx = 3.2 * Math.cos(th), by = 3.2 * Math.sin(th);
      g.retGirado(bx - 0.65 * Math.cos(th), by - 0.65 * Math.sin(th), 1.3, 1, th,
        { preenche: desliza ? 'aviso' : 'ok', cor: null, alfa: 0.3 });
      /* ângulo de atrito desenhado sobre a rampa */
      g.arco(0, 0, 2.1, 0, th, { cor: 'suave' });
      g.txt('θ = ' + p.ang + '°', 2.5 * Math.cos(th / 2), 2.5 * Math.sin(th / 2) + 0.1, { cor: 'suave', tam: 11.5, fundo: true });
      g.linha(0, 0, L * Math.cos(phi), L * Math.sin(phi), { cor: 'info', larg: 1.6, tracejado: true });
      g.txt('φₛ = arctan μₑ = ' + fx(phi * 180 / Math.PI, 1) + '°', L * Math.cos(phi) + 0.1, L * Math.sin(phi) + 0.25, { cor: 'info', tam: 11.5, alin: 'dir' });

      /* barras: atrito necessário × disponível */
      var x0 = 8.6, lar = 1.3, esc = 3.6 / Math.max(nec, disp, 1);
      g.ret(x0, 0, lar, nec * esc, { preenche: 'erro', cor: null, alfa: 0.75 });
      g.ret(x0 + 1.9, 0, lar, disp * esc, { preenche: 'ok', cor: null, alfa: 0.75 });
      g.linha(x0 - 0.3, 0, x0 + 3.6, 0, { cor: 'forte', larg: 1.4 });
      g.txt('necessário', x0 + lar / 2, -0.35, { cor: 'suave', tam: 11 });
      g.txt(fx(nec, 0) + ' N', x0 + lar / 2, nec * esc + 0.3, { cor: 'erro', tam: 11, negrito: true });
      g.txt('disponível', x0 + 1.9 + lar / 2, -0.35, { cor: 'suave', tam: 11 });
      g.txt(fx(disp, 0) + ' N', x0 + 1.9 + lar / 2, disp * esc + 0.3, { cor: 'ok', tam: 11, negrito: true });
      g.txt('atrito', x0 + 1.75, 5.4, { cor: 'suave', tam: 12, negrito: true });
      g.txt(desliza ? 'tan θ = ' + fx(Math.tan(th), 2) + ' > μₑ = ' + fx(mu, 2) + ' → desliza'
                    : 'tan θ = ' + fx(Math.tan(th), 2) + ' ≤ μₑ = ' + fx(mu, 2) + ' → fica parado',
        6, -1.9, { cor: desliza ? 'aviso' : 'ok', tam: 12.5, negrito: true });
      g.txt('massa ' + m + ' kg — note que mudá-la não muda o resultado', 6, -1.35, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.4 — curva sobrelevada */
  F('#fig-2-4', {
    titulo: 'Figura 2.4',
    legenda: 'Curva sobrelevada: a componente horizontal da normal fornece a resultante centrípeta. Na velocidade de projeto, o atrito não precisa fazer nada.',
    vista: [-0.6, 12.6, -2.4, 6.4],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Sobrelevação', min: 0, max: 30, val: 10, passo: 1, un: '°' },
      { id: 'v', rot: 'Velocidade', min: 5, max: 35, val: 15, passo: 1, un: 'm/s' },
      { id: 'R', rot: 'Raio da curva', min: 30, max: 200, val: 80, passo: 5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var th = rad(p.ang), v = p.v, R = p.R, m = 1200;
      var vproj = Math.sqrt(g9 * R * Math.tan(th));
      /* atrito necessário (positivo: para dentro) */
      var an = v * v / R;
      var fnec = m * (an * Math.cos(th) - g9 * Math.sin(th));
      var N = m * (g9 * Math.cos(th) + an * Math.sin(th));
      var mun = Math.abs(fnec) / N;
      var L = 6.6;
      g.caminho([[0.3, 0], [0.3 + L * Math.cos(th), L * Math.sin(th)], [0.3 + L * Math.cos(th), 0]],
        { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.4 });
      g.hachura(0.3, 0, L * Math.cos(th), 0, { cor: 'forte' });
      var cx = 0.3 + 3.4 * Math.cos(th), cy = 3.4 * Math.sin(th);
      /* carro visto de trás */
      g.retGirado(cx - 0.85 * Math.cos(th), cy - 0.85 * Math.sin(th), 1.7, 0.8, th, { preenche: 'acento', cor: null, alfa: 0.8 });
      g.retGirado(cx - 0.45 * Math.cos(th) - 0.8 * Math.sin(th), cy - 0.45 * Math.sin(th) + 0.8 * Math.cos(th), 0.9, 0.45, th, { preenche: 'acento', cor: null, alfa: 0.5 });
      var esc = 2.3 / (m * g9);
      var ccx = cx + 0.55 * -Math.sin(th), ccy = cy + 0.55 * Math.cos(th);
      g.seta(ccx, ccy, 0, -m * g9 * esc, { cor: 'erro', larg: 2.2, rot: 'mg', rotTam: 11.5, rotDx: 0.6 });
      g.seta(ccx, ccy, -Math.sin(th) * N * esc, Math.cos(th) * N * esc, { cor: 's3', larg: 2.2, rot: 'N', rotTam: 12 });
      if (Math.abs(fnec) > 20) {
        var s = fnec > 0 ? -1 : 1;
        g.seta(ccx, ccy, s * Math.cos(th) * Math.abs(fnec) * esc, s * Math.sin(th) * Math.abs(fnec) * esc,
          { cor: 's2', larg: 2, rot: 'f = ' + fx(Math.abs(fnec) / 1000, 2) + ' kN', rotTam: 11, rotDx: s * 0.8, rotDy: -0.4 });
      }
      g.seta(ccx, ccy + 1.9, -m * an * esc, 0, { cor: 'info', larg: 2.4, rot: 'resultante = m v²/R', rotTam: 11, rotDy: 0.45, rotDx: -0.6 });
      g.txt('para o centro da curva ←', 2.2, 5.9, { cor: 'fraco', tam: 11 });

      var x0 = 8.9;
      g.txt('v de projeto (sem atrito)', x0, 4.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(vproj, 1) + ' m/s = ' + fx(vproj * 3.6, 0) + ' km/h', x0, 4.05, { cor: 'info', tam: 13, negrito: true, alin: 'esq' });
      g.txt('atrito necessário agora', x0, 3.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('μ = ' + fx(mun, 2) + (fnec >= 0 ? ' (para dentro)' : ' (para fora)'), x0, 2.55,
        { cor: mun > 0.8 ? 'erro' : mun > 0.4 ? 'aviso' : 'ok', tam: 13, negrito: true, alin: 'esq' });
      g.txt(v > vproj + 0.1 ? 'acima da velocidade de projeto: o pneu segura o carro'
            : v < vproj - 0.1 ? 'abaixo: sem atrito, o carro escorregaria para dentro'
            : 'exatamente na velocidade de projeto: atrito nulo',
        x0, 1.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('curva plana (0°) suportaria ' + fx(Math.sqrt(0.6 * g9 * R), 1) + ' m/s com μ = 0,6', x0, 0.9, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });

  /* 2.5 — d'Alembert no vagão */
  F('#fig-2-5', {
    titulo: 'Figura 2.5',
    legenda: 'O mesmo pêndulo, visto de dois lugares. No solo há só peso e tração, e a resultante é m·a. No vagão, acrescenta-se a força de inércia −m·a e tudo fica em equilíbrio (exemplo 2.4).',
    vista: [-0.6, 13.4, -1.4, 6.4],
    altura: 350,
    animar: true,
    controles: [{ id: 'a', rot: 'Aceleração do vagão', min: 0, max: 6, val: 2, passo: 0.2, un: 'm/s²' }],
    desenhar: function (g, p, t) {
      var a = p.a, th = Math.atan(a / g9), m = 1;
      var esc = 1.9 / (m * g9);
      function vagao(ox, titulo) {
        var bal = 0.06 * Math.sin(t * 3) * (a > 0 ? 1 : 0);
        g.ret(ox, 0.5, 5.4, 3.6, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.35 });
        g.circ(ox + 1.2, 0.5, 0.33, { cor: 'forte', preenche: 'baixo' });
        g.circ(ox + 4.2, 0.5, 0.33, { cor: 'forte', preenche: 'baixo' });
        g.hachura(ox - 0.4, 0.17, 6.2, 0, { cor: 'forte' });
        g.txt(titulo, ox + 2.7, 5.9, { cor: 'suave', tam: 12, negrito: true });
        var px = ox + 2.7, py = 4.1, L = 2.1;
        var bx = px + L * Math.sin(th + bal), by = py - L * Math.cos(th + bal);
        g.linha(px, py, bx, by, { cor: 'texto', larg: 1.6 });
        g.linha(px, py, px, py - L, { cor: 'fraco', larg: 1, tracejado: true });
        g.circ(bx, by, 0.24, { preenche: 'acento', cor: null });
        g.arco(px, py, 0.8, -Math.PI / 2, -Math.PI / 2 + th, { cor: 'suave' });
        return [bx, by, px, py];
      }
      var A = vagao(0.2, 'visto do solo (inercial)');
      g.seta(A[0], A[1], 0, -m * g9 * esc, { cor: 'erro', larg: 2, rot: 'mg', rotTam: 11.5, rotDx: 0.55 });
      g.seta(A[0], A[1], Math.sin(th) * m * g9 / Math.cos(th) * esc, Math.cos(th) * m * g9 / Math.cos(th) * esc, { cor: 's3', larg: 2, rot: 'T', rotTam: 12 });
      g.seta(A[0], A[1] - 2.6, m * a * esc, 0, { cor: 'info', larg: 2.2, rot: 'm·a', rotTam: 11.5, rotDy: -0.42 });
      g.txt('ΣF = m·a', 2.9, -1.1, { cor: 'info', tam: 12.5, negrito: true });

      var B = vagao(7.4, 'visto do vagão (não inercial)');
      g.seta(B[0], B[1], 0, -m * g9 * esc, { cor: 'erro', larg: 2, rot: 'mg', rotTam: 11.5, rotDx: 0.55 });
      g.seta(B[0], B[1], Math.sin(th) * m * g9 / Math.cos(th) * esc, Math.cos(th) * m * g9 / Math.cos(th) * esc, { cor: 's3', larg: 2, rot: 'T', rotTam: 12 });
      g.seta(B[0], B[1], -m * a * esc, 0, { cor: 'aviso', larg: 2, rot: '−m·a', rotTam: 11.5, rotDy: -0.45 });
      g.txt('ΣF − m·a = 0', 10.1, -1.1, { cor: 'aviso', tam: 12.5, negrito: true });
      g.txt('tan θ = a/g  →  θ = ' + fx(th * 180 / Math.PI, 1) + '°', 6.8, 6.2, { cor: 'texto', tam: 12.5, negrito: true });
    }
  });

  /* ================= capítulo 3 ================= */

  /* 3.1 — trabalho de uma força */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Só a componente da força na direção do movimento realiza trabalho. A 90° o trabalho é nulo — é por isso que a normal, perpendicular ao deslocamento, não entra na conta.',
    vista: [-0.6, 12.6, -2.6, 5.4],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Ângulo da força', min: 0, max: 150, val: 35, passo: 1, un: '°' },
      { id: 'F', rot: 'Força', min: 10, max: 120, val: 60, passo: 5, un: 'N' },
      { id: 'd', rot: 'Deslocamento', min: 1, max: 10, val: 5, passo: 0.5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var al = rad(p.ang), F = p.F, d = p.d;
      var W = F * Math.cos(al) * d;
      var esc = 2.4 / 120, escD = 7.6 / 10;
      g.hachura(0.2, 0.5, 11.6, 0, { cor: 'forte' });
      var x0 = 1.4, x1 = x0 + d * escD;
      g.ret(x0 - 0.5, 0.5, 1, 0.75, { preenche: 'borda', cor: 'forte', alfa: 0.5 });
      g.ret(x1 - 0.5, 0.5, 1, 0.75, { preenche: 'acento', cor: null, alfa: 0.75 });
      g.cota(x0, 0.2, x1, 0.2, 'd = ' + fx(d, 1) + ' m', { dy: -0.45 });
      var cx = x1, cy = 1.25;
      g.seta(cx, cy, Math.cos(al) * F * esc, Math.sin(al) * F * esc, { cor: 'erro', larg: 2.6, rot: 'F = ' + F + ' N', rotTam: 12 });
      g.seta(cx, cy, Math.cos(al) * F * esc, 0, { cor: 'ok', larg: 2, rot: 'F cos α', rotTam: 11, rotDy: -0.45, rotDx: 0 });
      g.linha(cx + Math.cos(al) * F * esc, cy, cx + Math.cos(al) * F * esc, cy + Math.sin(al) * F * esc, { cor: 'fraco', larg: 1, tracejado: true });
      g.arco(cx, cy, 0.95, 0, al, { cor: 'suave' });
      g.txt('α = ' + p.ang + '°', cx + 1.35 * Math.cos(al / 2), cy + 1.35 * Math.sin(al / 2), { cor: 'suave', tam: 11.5, fundo: true });
      g.linha(cx, cy, cx + 2.2, cy, { cor: 'fraco', larg: 1, tracejado: true });

      g.txt('W = F cos α · d = ' + fx(W, 0) + ' J', 6, -1.5, { cor: W > 0 ? 'ok' : W < 0 ? 'erro' : 'suave', tam: 14, negrito: true });
      g.txt(p.ang < 89 ? 'força a favor: acelera o bloco' : p.ang > 91 ? 'força contra: freia o bloco (como o atrito)' : 'perpendicular ao movimento: trabalho nulo',
        6, -2.2, { cor: 'suave', tam: 11.5 });
    }
  });

  /* 3.3 — conservação da energia com mola */
  F('#fig-3-3', {
    titulo: 'Figura 3.3',
    legenda: 'Exemplo 3.1 animado: a energia potencial de altura vira cinética e depois elástica. As três barras somam sempre o mesmo valor enquanto não há atrito.',
    vista: [-0.6, 13.4, -1.8, 6.4],
    altura: 350,
    animar: true,
    controles: [
      { id: 'h', rot: 'Altura inicial', min: 0.5, max: 3, val: 1.5, passo: 0.1, un: 'm' },
      { id: 'k', rot: 'Rigidez da mola', min: 500, max: 5000, val: 2000, passo: 100, un: 'N/m' },
      { id: 'mu', rot: 'Atrito no plano', min: 0, max: 0.3, val: 0, passo: 0.02 }
    ],
    desenhar: function (g, p, t) {
      var m = 2, h = p.h, k = p.k, mu = p.mu;
      var E0 = m * g9 * h;
      /* geometria: rampa de 0 a 3.2 em x, plano de 3.2 a 8.6, mola no fim */
      var topo = 4.6, xr0 = 0.6, xr1 = 4.2, xm = 8.4;
      var escH = topo / 3;                  /* metros de altura -> unidades */
      var y0 = h * escH;
      /* fase do movimento */
      var vFim = Math.sqrt(Math.max(0, 2 * g9 * h));
      var Lplano = 3.5;                      /* metros reais do trecho plano */
      var perda = mu * m * g9 * Lplano;
      var Eplano = Math.max(0, E0 - perda);
      var vPlano = Math.sqrt(2 * Eplano / m);
      var xmax = Math.sqrt(2 * Eplano / k);
      var T1 = 0.9, T2 = 0.9, T3 = 0.45;
      var ciclo = T1 + T2 + T3 + T2 + T1 + 0.5;
      var tt = t % ciclo, fase, f;
      var bx, by, Ec, Ep, Ee;
      if (tt < T1) { f = tt / T1; bx = xr0 + (xr1 - xr0) * f; by = y0 * (1 - f); Ec = E0 * f; Ep = E0 * (1 - f); Ee = 0; }
      else if (tt < T1 + T2) { f = (tt - T1) / T2; bx = xr1 + (xm - xr1) * f; by = 0; Ec = E0 - perda * f; Ep = 0; Ee = 0; }
      else if (tt < T1 + T2 + T3) { f = (tt - T1 - T2) / T3; bx = xm; by = 0; Ec = Eplano * (1 - f * f); Ep = 0; Ee = Eplano * f * f; }
      else if (tt < T1 + T2 + 2 * T3) { f = 1 - (tt - T1 - T2 - T3) / T3; bx = xm; by = 0; Ec = Eplano * (1 - f * f); Ep = 0; Ee = Eplano * f * f; }
      else { f = Math.min(1, (tt - T1 - T2 - 2 * T3) / (T2 + T1)); bx = xm - (xm - xr0) * f; by = y0 * Math.max(0, (f - 0.55) / 0.45); Ec = Math.max(0, Eplano - perda * Math.min(1, f * 1.4) - m * g9 * (by / escH)); Ep = m * g9 * (by / escH); Ee = 0; }
      var comp = (Ee > 0 ? Math.sqrt(2 * Ee / k) : 0);
      var escX = 0.9 / Math.max(0.05, Math.sqrt(2 * E0 / Math.max(500, k)));

      g.caminho([[xr0 - 0.4, y0 + 0.1], [xr1, 0], [xm + 1.3, 0]], { cor: 'forte', larg: 2.4 });
      g.hachura(xr0 - 0.4, y0 + 0.1 - 0.02, Math.hypot(xr1 - xr0 + 0.4, y0 + 0.1), Math.atan2(-(y0 + 0.1), xr1 - xr0 + 0.4), { cor: 'forte', d: 0.2 });
      g.hachura(xr1, 0, xm + 1.3 - xr1, 0, { cor: 'forte', d: 0.2 });
      /* parede e mola */
      g.linha(xm + 1.3, 0, xm + 1.3, 1.6, { cor: 'forte', larg: 3 });
      var xMola = bx + 0.35 + comp * escX * 0;
      g.mola(Math.min(xm + 1.25, xMola + 0.1), 0.45, xm + 1.28, 0.45, 7, { cor: 'suave' });
      g.ret(bx - 0.35, 0.05 + by, 0.7, 0.6, { preenche: 'acento', cor: null, alfa: 0.85 });
      if (mu > 0 && by === 0) g.txt('atrito', (xr1 + xm) / 2, -0.5, { cor: 'aviso', tam: 11 });

      g.cota(xr0 - 0.75, 0, xr0 - 0.75, y0, 'h = ' + fx(h, 1) + ' m', { dx: -0.1, dy: 0 });

      /* barras de energia */
      var bx0 = 10.4, w = 0.6, escE = 4.4 / Math.max(E0, 1);
      [['Ec', Ec, 's1'], ['Ep', Ep, 's3'], ['mola', Ee, 's4']].forEach(function (b, i) {
        var x = bx0 + i * 0.95;
        g.ret(x, 0, w, Math.max(0, b[1]) * escE, { preenche: b[2], cor: null, alfa: 0.85 });
        g.txt(b[0], x + w / 2, -0.35, { cor: 'suave', tam: 10.5 });
      });
      g.linha(bx0 - 0.2, 0, bx0 + 2.9, 0, { cor: 'forte', larg: 1.3 });
      g.linha(bx0 - 0.2, E0 * escE, bx0 + 2.9, E0 * escE, { cor: 'fraco', larg: 1, tracejado: true });
      g.txt('E inicial = ' + fx(E0, 1) + ' J', bx0 + 1.35, E0 * escE + 0.35, { cor: 'fraco', tam: 11 });
      g.txt('compressão máxima: ' + fx(xmax * 100, 1) + ' cm', 6.4, 5.9, { cor: 'texto', tam: 12.5, negrito: true });
      if (mu > 0) g.txt('atrito dissipa ' + fx(Math.min(perda, E0), 1) + ' J no trecho plano', 6.4, 5.25, { cor: 'aviso', tam: 11.5 });
    }
  });

  /* ================= capítulo 4 ================= */

  /* 4.1 — impulso é a área sob F(t) */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'O impulso é a área sob a curva da força. Alongar o contato — o que o airbag e o capacete fazem — mantém a área e derruba o pico da força.',
    vista: [-0.6, 12.6, -1.6, 6.4],
    altura: 350,
    controles: [{ id: 'dt', rot: 'Duração do contato', min: 5, max: 200, val: 5, passo: 5, un: 'ms' }],
    desenhar: function (g, p) {
      var m = 0.15, dv = 70;                 /* exemplo 4.1: 30 -> 40 m/s no sentido oposto */
      var I = m * dv;                        /* 10,5 N·s */
      var dt = p.dt / 1000;
      var Fmed = I / dt;
      var Fpico = Fmed * 1.6;                /* meia senoide tem pico ≈ π/2 da média */
      var x0 = 1.2, xL = 8.6, y0 = 0.6, altMax = 4.6;
      var escF = altMax / 2600;
      /* eixos */
      g.seta(x0, y0, xL - x0 + 0.6, 0, { cor: 'fraco', larg: 1.2, ponta: 0.2, rot: 'tempo', rotTam: 11, rotDy: -0.4 });
      g.seta(x0, y0, 0, altMax + 0.6, { cor: 'fraco', larg: 1.2, ponta: 0.2, rot: 'força', rotTam: 11, rotDx: -0.5, rotDy: 0.1 });
      var largura = (xL - x0) * Math.min(1, dt / 0.2);
      var pts = [[x0, y0]], i;
      for (i = 0; i <= 50; i++) {
        var f = i / 50;
        pts.push([x0 + largura * f, y0 + Math.sin(Math.PI * f) * Math.min(altMax, Fpico * escF)]);
      }
      pts.push([x0 + largura, y0]);
      g.caminho(pts, { cor: 'erro', larg: 2, preenche: 'erro', alfa: 0.22, fechar: true });
      var hmed = Math.min(altMax, Fmed * escF);
      g.linha(x0, y0 + hmed, x0 + largura, y0 + hmed, { cor: 'info', larg: 1.6, tracejado: true });
      g.txt('F média = ' + fx(Fmed, 0) + ' N', x0 + largura + 0.3, y0 + hmed, { cor: 'info', tam: 11.5, alin: 'esq', fundo: true });
      g.cota(x0, y0 - 0.45, x0 + largura, y0 - 0.45, fx(p.dt, 0) + ' ms', { dy: -0.3 });
      g.txt('área = impulso = Δ(mv) = ' + fx(I, 2) + ' N·s', x0 + largura / 2, y0 + Math.min(altMax, Fpico * escF) * 0.45,
        { cor: 'texto', tam: 12, negrito: true, fundo: true });
      g.txt('bola de 0,15 kg: chega a 30 m/s, volta a 40 m/s', 0.6, 6.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('A área é sempre a mesma:', 9.6, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('o impulso só depende', 9.6, 3.85, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('da variação de mv.', 9.6, 3.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('5 ms → ' + fx(I / 0.005, 0) + ' N', 9.6, 2.3, { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.txt('200 ms → ' + fx(I / 0.2, 0) + ' N', 9.6, 1.7, { cor: 'ok', tam: 11.5, alin: 'esq' });
    }
  });

  /* 4.3 — choque central: velocidades e energia */
  F('#fig-4-3', {
    titulo: 'Figura 4.3',
    legenda: 'Choque central: a quantidade de movimento total é a mesma antes e depois, sempre. A energia cinética só se conserva quando e = 1 (exemplo 4.2).',
    vista: [-0.6, 12.6, -2.2, 6.4],
    altura: 350,
    animar: true,
    controles: [
      { id: 'e', rot: 'Coeficiente de restituição e', min: 0, max: 1, val: 0.5, passo: 0.05 },
      { id: 'm1', rot: 'Massa do corpo 1', min: 1, max: 8, val: 2, passo: 0.5, un: 'kg' },
      { id: 'm2', rot: 'Massa do corpo 2', min: 1, max: 8, val: 3, passo: 0.5, un: 'kg' }
    ],
    desenhar: function (g, p, t) {
      var m1 = p.m1, m2 = p.m2, e = p.e, v1 = 5, v2 = 0;
      var v1l = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
      var v2l = ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / (m1 + m2);
      var Ei = 0.5 * m1 * v1 * v1, Ef = 0.5 * m1 * v1l * v1l + 0.5 * m2 * v2l * v2l;
      var pTot = m1 * v1;
      var ciclo = 3.4, tt = t % ciclo, tChoque = 1.6;
      var x1, x2, xc = 5.4;
      var r1 = 0.26 + 0.07 * m1, r2 = 0.26 + 0.07 * m2;
      if (tt < tChoque) { var f = tt / tChoque; x1 = 0.9 + (xc - r1 - r2 - 0.9) * f; x2 = xc; }
      else { var f2 = (tt - tChoque); x1 = xc - r1 - r2 + v1l * f2 * 0.55; x2 = xc + v2l * f2 * 0.55; }
      g.hachura(0.3, 1.1, 11.4, 0, { cor: 'forte', d: 0.18 });
      g.circ(x1, 1.1 + r1, r1, { preenche: 's1', cor: null, alfa: 0.85 });
      g.txt(fx(m1, 1) + ' kg', x1, 1.1 + r1, { cor: 'fundo', tam: 10.5, negrito: true });
      g.circ(x2, 1.1 + r2, r2, { preenche: 's2', cor: null, alfa: 0.85 });
      g.txt(fx(m2, 1) + ' kg', x2, 1.1 + r2, { cor: 'fundo', tam: 10.5, negrito: true });
      var vv1 = tt < tChoque ? v1 : v1l, vv2 = tt < tChoque ? v2 : v2l;
      if (Math.abs(vv1) > 0.05) g.seta(x1, 1.1 + 2 * r1 + 0.3, vv1 * 0.3, 0, { cor: 's1', larg: 2, rot: fx(vv1, 2) + ' m/s', rotTam: 11, rotDy: 0.4, rotDx: 0 });
      if (Math.abs(vv2) > 0.05) g.seta(x2, 1.1 + 2 * r2 + 0.3, vv2 * 0.3, 0, { cor: 's2', larg: 2, rot: fx(vv2, 2) + ' m/s', rotTam: 11, rotDy: 0.4, rotDx: 0 });
      g.txt(tt < tChoque ? 'antes do impacto' : 'depois do impacto', 5.5, 0.5, { cor: 'suave', tam: 12, negrito: true });

      /* barras: quantidade de movimento e energia */
      var bx = 1.0, esc = 2.6 / Math.max(pTot, 1), yb = 4.2;
      g.txt('quantidade de movimento', bx, 6.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.ret(bx, yb + 0.55, m1 * v1 * esc, 0.42, { preenche: 's1', cor: null, alfa: 0.8 });
      g.txt('antes  ' + fx(pTot, 1) + ' kg·m/s', bx + m1 * v1 * esc + 0.25, yb + 0.76, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.ret(bx, yb, m1 * v1l * esc, 0.42, { preenche: 's1', cor: null, alfa: 0.8 });
      g.ret(bx + m1 * v1l * esc, yb, m2 * v2l * esc, 0.42, { preenche: 's2', cor: null, alfa: 0.8 });
      g.txt('depois  ' + fx(m1 * v1l + m2 * v2l, 1), bx + pTot * esc + 0.25, yb + 0.21, { cor: 'suave', tam: 10.5, alin: 'esq' });

      var ex = 7.2, escE = 2.6 / Math.max(Ei, 1);
      g.txt('energia cinética', ex, 6.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.ret(ex, yb + 0.55, Ei * escE, 0.42, { preenche: 's3', cor: null, alfa: 0.8 });
      g.txt('antes  ' + fx(Ei, 1) + ' J', ex + Ei * escE + 0.25, yb + 0.76, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.ret(ex, yb, Ef * escE, 0.42, { preenche: 's3', cor: null, alfa: 0.8 });
      g.ret(ex + Ef * escE, yb, (Ei - Ef) * escE, 0.42, { preenche: 'erro', cor: null, alfa: 0.35 });
      g.txt('depois  ' + fx(Ef, 1) + ' J', ex + Ei * escE + 0.25, yb + 0.21, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.txt('perdidos ' + fx(Ei - Ef, 2) + ' J (' + fx(100 * (Ei - Ef) / Ei, 0) + ' %)', ex, 3.5, { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.txt(e >= 0.999 ? 'e = 1: perfeitamente elástico' : e <= 0.001 ? 'e = 0: perfeitamente plástico — seguem juntos' : 'parcialmente elástico',
        bx, 3.5, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
    }
  });

  /* 4.4 — impacto oblíquo */
  F('#fig-4-4', {
    titulo: 'Figura 4.4',
    legenda: 'Contra uma parede lisa, a componente tangencial se conserva e só a normal é multiplicada por e. Por isso a bola volta mais rasante do que chegou (exemplo 4.3).',
    vista: [-0.6, 12.6, -1.4, 6.6],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Ângulo com a normal', min: 0, max: 75, val: 30, passo: 1, un: '°' },
      { id: 'e', rot: 'Restituição e', min: 0.1, max: 1, val: 0.6, passo: 0.05 },
      { id: 'v', rot: 'Velocidade de chegada', min: 4, max: 20, val: 10, passo: 1, un: 'm/s' }
    ],
    desenhar: function (g, p) {
      var th = rad(p.ang), e = p.e, v = p.v;
      var vn = v * Math.cos(th), vt = v * Math.sin(th);
      var vnl = e * vn, vl = Math.hypot(vnl, vt), thl = Math.atan2(vt, vnl);
      var esc = 3.4 / 20, xp = 7.4, yc = 3.1;
      /* parede */
      g.linha(xp, 0.2, xp, 6, { cor: 'forte', larg: 3 });
      g.hachura(xp, 0.2, 5.8, Math.PI / 2, { cor: 'forte', d: 0.26 });
      g.linha(xp - 4.4, yc, xp + 0.8, yc, { cor: 'fraco', larg: 1, tracejado: true });
      g.txt('normal', xp - 4.3, yc + 0.32, { cor: 'fraco', tam: 11, alin: 'esq' });
      /* chegada */
      g.seta(xp - vn * esc * 1.6, yc - vt * esc * 1.6, vn * esc * 1.6, vt * esc * 1.6,
        { cor: 's1', larg: 2.6, rot: 'v = ' + v + ' m/s', rotTam: 11.5, rotDx: -2.2, rotDy: -0.8 });
      /* saída */
      g.seta(xp, yc, -vnl * esc * 1.6, vt * esc * 1.6, { cor: 's2', larg: 2.6, rot: "v' = " + fx(vl, 2) + ' m/s', rotTam: 11.5, rotDx: -1.3, rotDy: 0.6 });
      g.circ(xp - 0.22, yc, 0.22, { preenche: 'texto', cor: null });
      g.arco(xp, yc, 1.5, Math.PI, Math.PI + Math.atan2(vt, vn), { cor: 'suave' });
      g.txt(p.ang + '°', xp - 1.9 * Math.cos(Math.atan2(vt, vn) / 2), yc - 1.9 * Math.sin(Math.atan2(vt, vn) / 2) * 0 + 0.0, { cor: 'suave', tam: 11, fundo: true });
      g.arco(xp, yc, 1.9, Math.PI, Math.PI - thl, { cor: 'suave' });
      g.txt(fx(thl * 180 / Math.PI, 1) + '°', xp - 2.3, yc + 1.0, { cor: 'suave', tam: 11, fundo: true });

      /* componentes */
      var cx = 1.6, cy = 1.1;
      g.txt('componentes', cx, 2.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('normal: ' + fx(vn, 2) + ' → ' + fx(vnl, 2) + ' m/s  (×e)', cx, 2.05, { cor: 's3', tam: 11.5, alin: 'esq' });
      g.txt('tangencial: ' + fx(vt, 2) + ' → ' + fx(vt, 2) + ' m/s  (igual)', cx, 1.5, { cor: 's4', tam: 11.5, alin: 'esq' });
      g.txt('energia perdida: ' + fx(100 * (1 - (vl * vl) / (v * v)), 0) + ' %', cx, 0.95, { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.txt('sem atrito entre bola e parede', cx, 0.2, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });

  /* ================= capítulo 5 ================= */

  /* 5.1 — centro de massa */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'O centro de massa é a média das posições ponderada pelas massas: ele fica sempre mais perto do corpo pesado, e divide a barra na razão inversa das massas.',
    vista: [-0.6, 12.6, -2.2, 4.6],
    altura: 350,
    controles: [
      { id: 'm1', rot: 'Massa à esquerda', min: 1, max: 10, val: 3, passo: 0.5, un: 'kg' },
      { id: 'm2', rot: 'Massa à direita', min: 1, max: 10, val: 6, passo: 0.5, un: 'kg' },
      { id: 'd', rot: 'Distância entre elas', min: 2, max: 9, val: 7, passo: 0.5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var m1 = p.m1, m2 = p.m2, d = p.d;
      var x1 = 1.6, x2 = x1 + d, xg = (m1 * x1 + m2 * x2) / (m1 + m2);
      g.linha(x1, 2.2, x2, 2.2, { cor: 'forte', larg: 3 });
      g.circ(x1, 2.2, 0.22 + 0.055 * m1, { preenche: 's1', cor: null, alfa: 0.9 });
      g.circ(x2, 2.2, 0.22 + 0.055 * m2, { preenche: 's2', cor: null, alfa: 0.9 });
      g.txt(fx(m1, 1) + ' kg', x1, 2.2 + 0.35 + 0.055 * m1 + 0.25, { cor: 's1', tam: 11.5, negrito: true });
      g.txt(fx(m2, 1) + ' kg', x2, 2.2 + 0.35 + 0.055 * m2 + 0.25, { cor: 's2', tam: 11.5, negrito: true });
      /* apoio no CM: a barra fica equilibrada */
      g.caminho([[xg, 2.05], [xg - 0.5, 1.1], [xg + 0.5, 1.1]], { cor: 'forte', larg: 1.6, fechar: true, preenche: 'baixo', alfa: 0.6 });
      g.hachura(xg - 1.1, 1.05, 2.2, 0, { cor: 'forte', d: 0.2 });
      g.circ(xg, 2.2, 0.13, { preenche: 'erro', cor: null });
      g.txt('G', xg, 2.95, { cor: 'erro', tam: 12.5, negrito: true, fundo: true });
      g.cota(x1, 3.9, xg, 3.9, fx(xg - x1, 2) + ' m', { dy: 0.3 });
      g.cota(xg, 3.9, x2, 3.9, fx(x2 - xg, 2) + ' m', { dy: 0.3 });
      g.txt('m₁·d₁ = m₂·d₂  →  ' + fx(m1 * (xg - x1), 1) + ' = ' + fx(m2 * (x2 - xg), 1), 6, 0.3, { cor: 'texto', tam: 12.5, negrito: true });
      g.txt('rG = Σmᵢrᵢ / Σmᵢ', 6, -0.4, { cor: 'suave', tam: 12 });
      g.txt('massa total ' + fx(m1 + m2, 1) + ' kg', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 5.2 — explosão: o CM segue a parábola */
  F('#fig-5-2', {
    titulo: 'Figura 5.2',
    legenda: 'Um projétil que explode no ar: os fragmentos vão para todo lado, mas as forças da explosão são internas e o centro de massa continua a mesma parábola.',
    vista: [-0.5, 11.5, -0.8, 6.5],
    altura: 350,
    animar: true,
    controles: [{ id: 'n', rot: 'Fragmentos', min: 2, max: 6, val: 4, passo: 1 }],
    desenhar: function (g, p, t) {
      var v0 = 9.2, th = rad(52), gg = 3.4;
      var vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
      var tv = 2 * vy / gg, tExp = tv * 0.45;
      var ciclo = tv + 0.9, tt = t % ciclo;
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var tq = tv * i / 60;
        pts.push([0.6 + vx * tq, vy * tq - 0.5 * gg * tq * tq]);
      }
      g.hachura(0, 0, 11, 0, { cor: 'forte', d: 0.2 });
      g.caminho(pts, { cor: 'borda', larg: 1.6, tracejado: true });
      var n = p.n;
      var cmx = 0.6 + vx * tt, cmy = vy * tt - 0.5 * gg * tt * tt;
      if (tt < tExp) {
        g.circ(cmx, cmy, 0.2, { preenche: 'acento', cor: null });
      } else {
        var dt2 = tt - tExp;
        for (i = 0; i < n; i++) {
          var a = Math.PI * (0.15 + 0.7 * i / Math.max(1, n - 1));
          var ux = 2.1 * Math.cos(a), uy = 2.1 * Math.sin(a);
          /* fragmentos iguais, velocidades relativas simétricas: o CM não muda */
          var sx = 0.6 + vx * tt + ux * dt2 * (i % 2 ? 1 : -1);
          var sy = vy * tt - 0.5 * gg * tt * tt + uy * dt2 * (i % 2 ? 1 : -1);
          if (sy < 0.12) sy = 0.12;
          g.circ(sx, sy, 0.13, { preenche: 's' + (i % 6 + 1), cor: null, alfa: 0.85 });
          g.linha(cmx, cmy, sx, sy, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        }
        g.circ(cmx, Math.max(0.1, cmy), 0.16, { cor: 'erro', larg: 2 });
        g.txt('G', cmx, Math.max(0.1, cmy) + 0.45, { cor: 'erro', tam: 12, negrito: true, fundo: true });
      }
      g.txt('ΣF externa = M·a_G  →  a explosão não desvia o centro de massa', 5.5, 6.1, { cor: 'suave', tam: 11.5 });
    }
  });

  /* ================= capítulo 6 ================= */

  /* 6.2 — rotação em torno de eixo fixo */
  F('#fig-6-2', {
    titulo: 'Figura 6.2',
    legenda: 'Num corpo que gira, cada ponto tem v = ωr e aceleração centrípeta ω²r. Em máquinas rápidas essa aceleração é enorme — daí a exigência de balanceamento.',
    vista: [-5.4, 7.6, -4.8, 4.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'rpm', rot: 'Rotação', min: 60, max: 3000, val: 600, passo: 30, un: 'rpm' },
      { id: 'r', rot: 'Raio do ponto', min: 20, max: 100, val: 100, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p, t) {
      var w = p.rpm * 2 * Math.PI / 60, r = p.r / 1000;
      var Rd = 3.2, rd = Rd * p.r / 100;
      var th = (t * Math.min(w, 12)) % (2 * Math.PI);
      g.circ(0, 0, Rd, { preenche: 'baixo', cor: 'forte', larg: 2, alfa: 0.6 });
      g.circ(0, 0, 0.3, { preenche: 'fundo', cor: 'forte' });
      for (var i = 0; i < 6; i++) {
        var a = th + i * Math.PI / 3;
        g.linha(0.3 * Math.cos(a), 0.3 * Math.sin(a), Rd * Math.cos(a), Rd * Math.sin(a), { cor: 'borda', larg: 1.4 });
      }
      var px = rd * Math.cos(th), py = rd * Math.sin(th);
      var v = w * r, an = w * w * r;
      g.circ(px, py, 0.17, { preenche: 'acento', cor: null });
      var ut = [-Math.sin(th), Math.cos(th)];
      g.seta(px, py, ut[0] * 1.9, ut[1] * 1.9, { cor: 's1', larg: 2.2, rot: 'v = ωr', rotTam: 11.5 });
      g.seta(px, py, -Math.cos(th) * 1.5, -Math.sin(th) * 1.5, { cor: 's3', larg: 2.2, rot: 'aₙ = ω²r', rotTam: 11.5, rotDx: -Math.cos(th) * 0.9, rotDy: -Math.sin(th) * 0.9 });
      g.arco(0, 0, Rd + 0.45, th + 0.35, th + 1.25, { cor: 'suave', ponta: true });
      g.txt('ω', (Rd + 0.95) * Math.cos(th + 0.8), (Rd + 0.95) * Math.sin(th + 0.8), { cor: 'suave', tam: 12.5 });
      var x0 = 4.3;
      g.txt('ω = ' + fx(w, 1) + ' rad/s', x0, 2.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('v = ' + fx(v, 1) + ' m/s', x0, 1.8, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('aₙ = ' + fx(an, 0) + ' m/s²', x0, 1.0, { cor: 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('= ' + fx(an / g9, 0) + ' g', x0, 0.4, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('r = ' + p.r + ' mm', x0, -0.4, { cor: 'fraco', tam: 11.5, alin: 'esq' });
    }
  });

  /* 6.3 — biela-manivela */
  F('#fig-6-3', {
    titulo: 'Figura 6.3',
    legenda: 'Mecanismo biela-manivela: a manivela gira, o pistão translada e a biela faz os dois movimentos ao mesmo tempo. Com a manivela a 90°, a biela está em translação instantânea e o pistão tem a velocidade do pino (exemplo 6.2).',
    vista: [-4.6, 9.4, -4.2, 4.2],
    altura: 350,
    animar: true,
    controles: [
      { id: 'th', rot: 'Ângulo da manivela', min: 0, max: 360, val: 90, passo: 1, un: '°' },
      { id: 'girar', rot: 'Girar sozinho (0 = não)', min: 0, max: 1, val: 1, passo: 1 }
    ],
    desenhar: function (g, p, t) {
      var r = 1.6, L = 4.8, w = 100;          /* manivela 100 mm, biela 300 mm, 100 rad/s */
      var th = p.girar ? (t * 1.4) % (2 * Math.PI) : rad(p.th);
      var cx = r * Math.cos(th), cy = r * Math.sin(th);
      var px = cx + Math.sqrt(Math.max(0, L * L - cy * cy));
      /* cinemática real (r = 0,1 m, L = 0,3 m, ω = 100 rad/s) */
      var R = 0.1, LL = 0.3;
      var beta = Math.asin(R * Math.sin(th) / LL);
      var vp = -R * w * (Math.sin(th) + (R / LL) * Math.sin(2 * th) / (2 * Math.cos(beta)));
      /* cilindro */
      g.ret(px - 0.9, -1.15, 5.2, 2.3, { cor: 'borda', larg: 1.4 });
      g.hachura(px + 4.3, -1.15, 2.3, Math.PI / 2, { cor: 'forte', d: 0.22 });
      g.circ(0, 0, 0.22, { preenche: 'baixo', cor: 'forte' });
      g.circ(0, 0, r, { cor: 'borda', larg: 1, tracejado: true });
      g.linha(0, 0, cx, cy, { cor: 's1', larg: 4 });
      g.linha(cx, cy, px, 0, { cor: 's2', larg: 3.4 });
      g.ret(px - 0.75, -0.95, 1.5, 1.9, { preenche: 'acento', cor: null, alfa: 0.8 });
      g.circ(cx, cy, 0.17, { preenche: 'texto', cor: null });
      g.circ(px, 0, 0.17, { preenche: 'texto', cor: null });
      g.linha(-4.4, 0, 9.2, 0, { cor: 'fraco', larg: 1, tracejado: [4, 5] });
      /* velocidades */
      var vpino = R * w;      /* 10 m/s */
      var k = 0.16;
      g.seta(cx, cy, -Math.sin(th) * vpino * k, Math.cos(th) * vpino * k, { cor: 's1', larg: 2, rot: 'v do pino = 10 m/s', rotTam: 11, rotDx: -1.6, rotDy: 0.3 });
      if (Math.abs(vp) > 0.2) g.seta(px, 1.6, vp * k, 0, { cor: 'erro', larg: 2.2, rot: 'v do pistão = ' + fx(Math.abs(vp), 1) + ' m/s', rotTam: 11, rotDy: 0.45, rotDx: 0 });
      g.txt('manivela 100 mm · biela 300 mm · ω = 100 rad/s', 2.4, 3.8, { cor: 'suave', tam: 11.5 });
      var quase90 = Math.abs(Math.abs(Math.sin(th)) - 1) < 0.004;
      g.txt(quase90 ? 'manivela a 90°: biela em translação instantânea (ω_biela ≈ 0)' : 'ω da biela = ' + fx(R * w * Math.cos(th) / (LL * Math.cos(beta)), 1) + ' rad/s',
        2.4, -3.4, { cor: quase90 ? 'ok' : 'suave', tam: 12, negrito: quase90 });
    }
  });

  /* 6.4 — centro instantâneo de rotação */
  F('#fig-6-4', {
    titulo: 'Figura 6.4',
    legenda: 'A escada que escorrega: as velocidades das duas pontas têm direções conhecidas, e as perpendiculares a elas se cruzam no centro instantâneo. Em relação a ele, a barra só gira.',
    vista: [-0.8, 11.2, -1, 7],
    altura: 350,
    controles: [{ id: 'ang', rot: 'Ângulo com o piso', min: 15, max: 80, val: 50, passo: 1, un: '°' }],
    desenhar: function (g, p) {
      var th = rad(p.ang);
      var L = 5.4;
      var ax = L * Math.cos(th), ay = 0, bx = 0, by = L * Math.sin(th);
      var ox = 1.4, oy = 0.6;
      /* paredes */
      g.linha(ox, oy, ox + 9, oy, { cor: 'forte', larg: 2.5 });
      g.hachura(ox, oy, 9, 0, { cor: 'forte', d: 0.22 });
      g.linha(ox, oy, ox, oy + 6, { cor: 'forte', larg: 2.5 });
      g.hachura(ox, oy, 6, Math.PI / 2, { cor: 'forte', d: 0.22 });
      /* barra */
      g.linha(ox + bx, oy + by, ox + ax, oy + ay, { cor: 'acento', larg: 4.5 });
      g.circ(ox + bx, oy + by, 0.17, { preenche: 'texto', cor: null });
      g.circ(ox + ax, oy + ay, 0.17, { preenche: 'texto', cor: null });
      g.txt('B', ox + bx - 0.4, oy + by, { cor: 'texto', tam: 12 });
      g.txt('A', ox + ax, oy + ay - 0.4, { cor: 'texto', tam: 12 });
      /* CIR: (ax, by) */
      var cirx = ox + ax, ciry = oy + by;
      g.linha(ox + ax, oy, cirx, ciry, { cor: 'fraco', larg: 1, tracejado: true });
      g.linha(ox, oy + by, cirx, ciry, { cor: 'fraco', larg: 1, tracejado: true });
      g.circ(cirx, ciry, 0.2, { cor: 'erro', larg: 2.2 });
      g.txt('CIR', cirx + 0.55, ciry + 0.3, { cor: 'erro', tam: 12, negrito: true, fundo: true });
      g.circ(ox + ax / 2, oy + by / 2, 0.14, { preenche: 's3', cor: null });
      /* velocidades (ω arbitrário) */
      var w = 1;
      g.seta(ox + ax, oy, -w * by * 0.42, 0, { cor: 's1', larg: 2.2, rot: 'v_A', rotTam: 11.5, rotDy: -0.45, rotDx: 0 });
      g.seta(ox, oy + by, 0, -w * ax * 0.42, { cor: 's2', larg: 2.2, rot: 'v_B', rotTam: 11.5, rotDx: -0.55, rotDy: 0 });
      /* v = ω ẑ × r, com r medido a partir do CIR */
      var mx = ox + ax / 2, my = oy + by / 2;
      g.seta(mx, my, -(my - ciry) * 0.42 * w, (mx - cirx) * 0.42 * w,
        { cor: 's3', larg: 2, rot: 'v do meio', rotTam: 11, rotDx: 0.2, rotDy: -0.5 });
      g.linha(cirx, ciry, mx, my, { cor: 'borda', larg: 1, tracejado: [3, 4] });
      g.txt('v = ω · (distância até o CIR)', 7.9, 6.5, { cor: 'suave', tam: 11.5 });
      g.txt('o CIR muda a cada instante', 7.9, 5.9, { cor: 'fraco', tam: 11 });
      g.txt('cada velocidade é perpendicular à linha que liga o ponto ao CIR', 5.6, -0.7, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* 6.5 — rolamento sem deslizamento */
  F('#fig-6-5', {
    titulo: 'Figura 6.5',
    legenda: 'Rolando sem deslizar, o ponto de contato está parado (é o CIR) e o topo anda a 2v. A trajetória de um ponto da borda é a ciclóide desenhada atrás da roda.',
    vista: [-0.6, 12.6, -1.4, 5.6],
    altura: 350,
    animar: true,
    controles: [{ id: 'v', rot: 'Velocidade do centro', min: 2, max: 20, val: 10, passo: 1, un: 'm/s' }],
    desenhar: function (g, p, t) {
      var R = 1.3, v = p.v;
      var perc = (t * 1.5) % 9.2;
      var cx = 1.2 + perc, cy = R + 0.5;
      var th = -perc / R;
      g.hachura(0.2, 0.5, 12, 0, { cor: 'forte', d: 0.2 });
      /* ciclóide do ponto da borda */
      var pts = [], i;
      for (i = 0; i <= 80; i++) {
        var s = 9.2 * i / 80;
        if (s > perc) break;
        var a = -s / R;
        pts.push([1.2 + s + R * Math.cos(a - Math.PI / 2), cy + R * Math.sin(a - Math.PI / 2)]);
      }
      if (pts.length > 1) g.caminho(pts, { cor: 'borda', larg: 1.4, tracejado: [5, 4] });
      g.circ(cx, cy, R, { cor: 'forte', larg: 2.2, preenche: 'baixo', alfa: 0.4 });
      for (i = 0; i < 4; i++) {
        var a2 = th + i * Math.PI / 2;
        g.linha(cx, cy, cx + R * Math.cos(a2), cy + R * Math.sin(a2), { cor: 'borda', larg: 1.2 });
      }
      var bx = cx + R * Math.cos(th - Math.PI / 2), by = cy + R * Math.sin(th - Math.PI / 2);
      g.circ(bx, by, 0.13, { preenche: 's2', cor: null });
      g.circ(cx, cy, 0.1, { preenche: 'texto', cor: null });
      var k = 0.11;
      g.seta(cx, cy, v * k, 0, { cor: 's1', larg: 2.2, rot: 'v = ωR', rotTam: 11, rotDy: 0.4, rotDx: 0 });
      g.seta(cx, cy + R, 2 * v * k, 0, { cor: 'erro', larg: 2.4, rot: '2v no topo', rotTam: 11, rotDy: 0.42, rotDx: 0 });
      g.circ(cx, cy - R, 0.16, { cor: 'ok', larg: 2 });
      g.txt('contato: v = 0 (CIR)', cx, cy - R - 0.55, { cor: 'ok', tam: 11.5, negrito: true, fundo: true });
      g.txt('ω = v/R = ' + fx(v / 0.3, 1) + ' rad/s  (R = 0,3 m)', 6, 5.2, { cor: 'suave', tam: 11.5 });
      g.txt('o atrito no contato é estático: não dissipa energia', 6, 4.6, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 7 ================= */

  /* 7.1 — momento de inércia e eixos paralelos */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Mesma massa, mesmo raio externo: quanto mais massa longe do eixo, maior o momento de inércia. Afastar o eixo do centro de massa custa ainda mais, por m·d² (teorema dos eixos paralelos).',
    vista: [-0.6, 12.6, -2.4, 5.6],
    altura: 350,
    controles: [
      { id: 'vazio', rot: 'Raio interno (furo)', min: 0, max: 95, val: 0, passo: 5, un: '% de R' },
      { id: 'd', rot: 'Distância do eixo ao centro', min: 0, max: 100, val: 0, passo: 5, un: '% de R' }
    ],
    desenhar: function (g, p) {
      var m = 1, R = 1, ri = R * p.vazio / 100, d = R * p.d / 100;
      /* cilindro vazado: I = m(R² + ri²)/2 */
      var k = (R * R + ri * ri) / 2;
      var Io = k + d * d;
      var Rd = 2.1, rid = Rd * p.vazio / 100, dd = Rd * p.d / 100;
      var cx = 3.2, cy = 2.6;
      g.circ(cx, cy, Rd, { preenche: 's1', cor: 'forte', larg: 1.8, alfa: 0.3 });
      if (rid > 0.02) g.circ(cx, cy, rid, { preenche: 'fundo', cor: 'forte', larg: 1.4 });
      g.circ(cx, cy, 0.09, { preenche: 'texto', cor: null });
      g.txt('G', cx - 0.35, cy + 0.3, { cor: 'suave', tam: 11.5 });
      g.circ(cx + dd, cy, 0.17, { cor: 'erro', larg: 2.2 });
      g.linha(cx + dd, cy - Rd - 0.45, cx + dd, cy + Rd + 0.45, { cor: 'erro', larg: 1.2, tracejado: true });
      g.txt('eixo de rotação', cx + dd, cy + Rd + 0.8, { cor: 'erro', tam: 11, fundo: true });
      if (dd > 0.05) g.cota(cx, cy - Rd - 0.35, cx + dd, cy - Rd - 0.35, 'd', { dy: -0.3 });

      /* barras comparativas */
      var x0 = 7.3, esc = 3.6 / 2.2;
      var casos = [['aro', 1], ['cilindro', 0.5], ['esfera', 0.4], ['este', Io]];
      casos.forEach(function (c, i) {
        var x = x0 + i * 1.15;
        g.ret(x, 0, 0.72, c[1] * esc, { preenche: i === 3 ? 'erro' : 's3', cor: null, alfa: i === 3 ? 0.8 : 0.45 });
        g.txt(c[0], x + 0.36, -0.35, { cor: 'suave', tam: 10.5 });
        g.txt(fx(c[1], 2), x + 0.36, c[1] * esc + 0.3, { cor: i === 3 ? 'erro' : 'suave', tam: 10.5, negrito: i === 3 });
      });
      g.linha(x0 - 0.2, 0, x0 + 4.5, 0, { cor: 'forte', larg: 1.3 });
      g.txt('I / (m·R²)', x0 + 2.2, 5.1, { cor: 'suave', tam: 12, negrito: true });
      g.txt('I_G = m(R² + rᵢ²)/2 = ' + fx(k, 3) + ' m·R²', 3.2, -0.9, { cor: 'suave', tam: 11.5 });
      g.txt('I_O = I_G + m·d² = ' + fx(Io, 3) + ' m·R²', 3.2, -1.6, { cor: 'erro', tam: 12.5, negrito: true });
      g.txt('raio de giração k = ' + fx(Math.sqrt(Io), 3) + ' R', 3.2, -2.2, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.2 — barra articulada: ΣM_O = I_O α */
  F('#fig-7-2', {
    titulo: 'Figura 7.2',
    legenda: 'A barra solta da horizontal (exemplos 7.2 e 8.2). No primeiro instante o pino sustenta só mg/4: o resto do peso "está caindo". Ao chegar à vertical, ω = √(3g/L).',
    vista: [-1.4, 10.6, -4.6, 3.4],
    altura: 350,
    animar: true,
    controles: [
      { id: 'L', rot: 'Comprimento da barra', min: 0.4, max: 2, val: 1, passo: 0.1, un: 'm' },
      { id: 'm', rot: 'Massa', min: 0.5, max: 10, val: 2, passo: 0.5, un: 'kg' }
    ],
    desenhar: function (g, p, t) {
      var L = p.L, m = p.m;
      /* integra o pêndulo rígido a partir da horizontal, em tempo real */
      var per = 2 * Math.PI * Math.sqrt((L / 3) / (g9 * 0.5));   /* escala de tempo típica */
      var tt = (t % (per * 0.9)) / 0.85;
      var th = 0, w = 0, dt = 0.002, n = Math.min(4000, Math.round(tt / dt));
      for (var i = 0; i < n; i++) {
        var al = -(3 * g9 / (2 * L)) * Math.cos(th);
        w += al * dt; th += w * dt;
        if (th < -Math.PI / 2) { th = -Math.PI / 2; w = -w * 0.55; }
      }
      var alpha = -(3 * g9 / (2 * L)) * Math.cos(th);   /* positivo = anti-horário */
      var Ld = 5.4;
      var px = 0.4, py = 1.4;
      var bx = px + Ld * Math.cos(th), by = py + Ld * Math.sin(th);
      g.hachura(px - 1, py + 0.35, 2, 0, { cor: 'forte', d: 0.22 });
      g.linha(px - 1, py + 0.35, px + 1, py + 0.35, { cor: 'forte', larg: 2 });
      g.linha(px, py + 0.35, px, py, { cor: 'forte', larg: 2 });
      g.caminho([[px, py], [bx, by]], { cor: 'acento', larg: 6, cap: 'round' });
      g.circ(px, py, 0.2, { preenche: 'fundo', cor: 'forte', larg: 2 });
      g.circ(px + Ld * Math.cos(th) / 2, py + Ld * Math.sin(th) / 2, 0.15, { preenche: 'texto', cor: null });
      g.arco(px, py, Ld, 0, th, { cor: 'borda', larg: 1, tracejado: true });

      var esc = 1.5 / (m * g9);
      var gx = px + Ld * Math.cos(th) / 2, gy = py + Ld * Math.sin(th) / 2;
      g.seta(gx, gy, 0, -m * g9 * esc, { cor: 'erro', larg: 2.2, rot: 'mg', rotTam: 11.5, rotDx: 0.55 });
      /* reação no pino: R = m·a_G − peso, com a_G = (L/2)(α·ut − ω²·ur) */
      var ur = [Math.cos(th), Math.sin(th)], ut = [-Math.sin(th), Math.cos(th)];
      var aGx = (L / 2) * (alpha * ut[0] - w * w * ur[0]);
      var aGy = (L / 2) * (alpha * ut[1] - w * w * ur[1]);
      var Rx = m * aGx, Ry = m * aGy + m * g9;
      g.seta(px, py, Rx * esc, Ry * esc, { cor: 's3', larg: 2.2, rot: 'R = ' + fx(Math.hypot(Rx, Ry), 1) + ' N', rotTam: 11, rotDx: -0.2, rotDy: 0.55 });

      var x0 = 7.4;
      g.txt('I_O = mL²/3 = ' + fx(m * L * L / 3, 3) + ' kg·m²', x0, 2.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('α = ' + fx(Math.abs(alpha), 1) + ' rad/s²', x0, 1.6, { cor: 's2', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('ω = ' + fx(Math.abs(w), 2) + ' rad/s', x0, 0.9, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('máximo √(3g/L) = ' + fx(Math.sqrt(3 * g9 / L), 2), x0, 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('na horizontal: α = 3g/2L e R = mg/4 = ' + fx(m * g9 / 4, 2) + ' N', 4.6, -4.2, { cor: 'suave', tam: 11.5 });
    }
  });

  /* 7.3 — rolamento na rampa: corrida das formas */
  F('#fig-7-3', {
    titulo: 'Figura 7.3',
    legenda: 'A aceleração ao rolar é g sen θ /(1 + I/mr²): não depende da massa nem do raio, só da forma. A ordem de chegada é sempre esfera, cilindro, casca, aro.',
    vista: [-0.6, 12.6, -2.6, 6.4],
    altura: 350,
    animar: true,
    controles: [{ id: 'ang', rot: 'Inclinação da rampa', min: 5, max: 40, val: 30, passo: 1, un: '°' }],
    desenhar: function (g, p, t) {
      var th = rad(p.ang);
      var formas = [
        { n: 'esfera', k: 0.4, c: 's1' },
        { n: 'cilindro', k: 0.5, c: 's2' },
        { n: 'casca', k: 2 / 3, c: 's3' },
        { n: 'aro', k: 1, c: 's4' }
      ];
      var L = 8.4;                       /* comprimento da rampa no desenho */
      var ox = 0.8, oy = 0.6;
      var ex = Math.cos(th), ey = Math.sin(th);
      /* rampa desenhada subindo para a esquerda: começa no alto */
      var tx = ox + L * ex, ty = oy + L * ey;
      g.caminho([[ox, oy], [tx, ty], [tx, oy]], { cor: 'forte', larg: 1.8, fechar: true, preenche: 'baixo', alfa: 0.35 });
      g.hachura(ox, oy, L * ex, 0, { cor: 'forte', d: 0.2 });
      g.arco(ox, oy, 1.4, 0, th, { cor: 'suave' });
      g.txt(p.ang + '°', ox + 1.75 * Math.cos(th / 2), oy + 1.75 * Math.sin(th / 2), { cor: 'suave', tam: 11 });

      var dur = 2.6, tt = (t % (dur + 0.8));
      formas.forEach(function (f, i) {
        var a = g9 * Math.sin(th) / (1 + f.k);
        var s = 0.5 * a * Math.min(tt, dur) * Math.min(tt, dur) * 0.26;
        if (s > L - 1.2) s = L - 1.2;
        var d = L - 1.2 - s;
        var cxp = ox + (d + 0.6) * ex - 0.42 * ey + i * 0.0;
        var cyp = oy + (d + 0.6) * ey + 0.42 * ex + i * 0.52;
        g.circ(cxp, cyp, 0.4, { cor: f.c, larg: 2.2, preenche: f.c, alfa: 0.18 });
        var ang = -s / 0.4;
        g.linha(cxp, cyp, cxp + 0.4 * Math.cos(ang + th), cyp + 0.4 * Math.sin(ang + th), { cor: f.c, larg: 1.4 });
        g.txt(f.n, 11.3, 5.4 - i * 0.62, { cor: f.c, tam: 11.5, alin: 'dir', negrito: true });
        g.txt('a = ' + fx(a, 2) + ' m/s²', 11.3, 5.4 - i * 0.62 - 0.26, { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      var mun = formas.map(function (f) { return (f.k / (1 + f.k)) * Math.tan(th); });
      g.txt('μ mínimo para rolar sem deslizar: esfera ' + fx(mun[0], 2) + ' · aro ' + fx(mun[3], 2), 5.6, -1.6, { cor: 'suave', tam: 11.5 });
      g.txt('a = g·sen θ / (1 + I/mr²)', 5.6, -2.3, { cor: 'fraco', tam: 11.5 });
    }
  });

  /* ================= capítulo 8 ================= */

  /* 8.1 — energia dividida entre translação e rotação */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Descendo a mesma altura, quem rola chega mais devagar: parte da energia foi para a rotação. Deslizando sem atrito, toda ela vira translação (exemplo 8.1).',
    vista: [-0.6, 12.6, -1.8, 6.4],
    altura: 350,
    controles: [
      { id: 'forma', rot: 'Forma (0 desliza · 1 esfera · 2 cilindro · 3 casca · 4 aro)', min: 0, max: 4, val: 1, passo: 1 },
      { id: 'h', rot: 'Altura da descida', min: 0.5, max: 5, val: 2, passo: 0.5, un: 'm' }
    ],
    desenhar: function (g, p) {
      var nomes = ['deslizando (sem atrito)', 'esfera maciça', 'cilindro maciço', 'casca esférica', 'aro'];
      var ks = [0, 0.4, 0.5, 2 / 3, 1];
      var k = ks[p.forma], h = p.h;
      var v = Math.sqrt(2 * g9 * h / (1 + k));
      var vmax = Math.sqrt(2 * g9 * h);
      var fTrans = 1 / (1 + k), fRot = k / (1 + k);
      /* rampa */
      var ox = 0.8, oy = 0.8, L = 5.2, th = rad(28);
      g.caminho([[ox, oy + L * Math.sin(th)], [ox + L * Math.cos(th), oy], [ox, oy]], { cor: 'forte', larg: 1.8, fechar: true, preenche: 'baixo', alfa: 0.3 });
      g.hachura(ox, oy, L * Math.cos(th), 0, { cor: 'forte', d: 0.2 });
      g.circ(ox + 1.2, oy + (L - 1.35) * Math.sin(th) + 0.45, 0.45, { cor: 'acento', larg: 2.2, preenche: 'acento', alfa: 0.2 });
      g.cota(ox - 0.5, oy, ox - 0.5, oy + L * Math.sin(th), 'h = ' + fx(h, 1) + ' m', { dx: -0.1 });
      g.txt(nomes[p.forma], ox + 2.6, oy + L * Math.sin(th) + 0.7, { cor: 'texto', tam: 12.5, negrito: true });

      /* barras de energia no fim da descida */
      var x0 = 7.2, esc = 4.2;
      g.ret(x0, 0.6, 1.1, fTrans * esc, { preenche: 's1', cor: null, alfa: 0.8 });
      g.ret(x0 + 1.5, 0.6, 1.1, fRot * esc, { preenche: 's4', cor: null, alfa: 0.8 });
      g.linha(x0 - 0.3, 0.6, x0 + 3.4, 0.6, { cor: 'forte', larg: 1.3 });
      g.txt('translação', x0 + 0.55, 0.25, { cor: 'suave', tam: 11 });
      g.txt(fx(100 * fTrans, 0) + ' %', x0 + 0.55, fTrans * esc + 0.95, { cor: 's1', tam: 12, negrito: true });
      g.txt('rotação', x0 + 2.05, 0.25, { cor: 'suave', tam: 11 });
      g.txt(fx(100 * fRot, 0) + ' %', x0 + 2.05, fRot * esc + 0.95, { cor: 's4', tam: 12, negrito: true });
      g.txt('para onde vai a energia', x0 + 1.3, 5.9, { cor: 'suave', tam: 12, negrito: true });
      g.txt('v = ' + fx(v, 2) + ' m/s', 3.4, -0.5, { cor: 'texto', tam: 13, negrito: true });
      g.txt('deslizando seria ' + fx(vmax, 2) + ' m/s', 3.4, -1.2, { cor: 'fraco', tam: 11.5 });
      g.txt('Ec = ½mv² + ½Iω²', 9.8, -0.5, { cor: 'suave', tam: 12 });
    }
  });

  /* 8.2 — conservação da quantidade de movimento angular */
  F('#fig-8-2', {
    titulo: 'Figura 8.2',
    legenda: 'Sem momento externo, I·ω é constante: recolher os braços diminui I e acelera o giro. A energia cinética aumenta — quem paga é o trabalho muscular de puxar os braços.',
    vista: [-5.6, 7.4, -4.6, 4.6],
    altura: 350,
    animar: true,
    controles: [{ id: 'I', rot: 'Momento de inércia', min: 0.8, max: 4, val: 4, passo: 0.1, un: 'kg·m²' }],
    desenhar: function (g, p, t) {
      var I0 = 4, w0 = 2 * Math.PI, I = p.I;
      var w = I0 * w0 / I;
      var H = I * w, E = 0.5 * I * w * w, E0 = 0.5 * I0 * w0 * w0;
      var th = (t * Math.min(w, 9)) % (2 * Math.PI);
      var braco = 0.6 + 2.3 * (I - 0.8) / 3.2;
      /* patinadora vista de cima */
      g.circ(0, 0, 3.3, { cor: 'borda', larg: 1, tracejado: true });
      g.circ(0, 0, 0.7, { preenche: 'acento', cor: null, alfa: 0.55 });
      var ux = Math.cos(th), uy = Math.sin(th);
      g.linha(-ux * braco, -uy * braco, ux * braco, uy * braco, { cor: 'acento', larg: 5 });
      g.circ(ux * braco, uy * braco, 0.26, { preenche: 'acento', cor: null });
      g.circ(-ux * braco, -uy * braco, 0.26, { preenche: 'acento', cor: null });
      g.arco(0, 0, 3.6, th + 0.3, th + 1.2, { cor: 's1', ponta: true, larg: 2 });

      var x0 = 4.2, esc = 3.2;
      g.txt('ω = ' + fx(w / (2 * Math.PI), 2) + ' voltas/s', x0, 3.2, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('H = I·ω = ' + fx(H, 1) + ' kg·m²/s', x0, 2.4, { cor: 'ok', tam: 12, alin: 'esq' });
      g.txt('(constante)', x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.ret(x0, 0.2, 0.8, (E / E0) * esc * 0.45, { preenche: 's4', cor: null, alfa: 0.8 });
      g.ret(x0 + 1.1, 0.2, 0.8, (H / (I0 * w0)) * esc * 0.45, { preenche: 'ok', cor: null, alfa: 0.8 });
      g.txt('E', x0 + 0.4, -0.15, { cor: 'suave', tam: 11 });
      g.txt('H', x0 + 1.5, -0.15, { cor: 'suave', tam: 11 });
      g.txt('E = ' + fx(E, 0) + ' J (' + fx(E / E0, 2) + '×)', x0, -0.9, { cor: 's4', tam: 11.5, alin: 'esq' });
      g.txt('braços recolhidos → gira mais rápido', 0, -4.2, { cor: 'suave', tam: 11.5 });
    }
  });

  /* 8.3 — centro de percussão */
  F('#fig-8-3', {
    titulo: 'Figura 8.3',
    legenda: 'O "ponto doce": bater a 2L/3 do pivô não gera reação no apoio, porque a translação causada pela força e a rotação em torno de G se cancelam ali. Fora dele, a pancada volta pela mão.',
    vista: [-0.6, 12.6, -3.4, 4.6],
    altura: 350,
    controles: [{ id: 'x', rot: 'Ponto do impacto (fração de L)', min: 10, max: 100, val: 67, passo: 1, un: '%' }],
    desenhar: function (g, p) {
      var L = 1, m = 1, b = L * p.x / 100;
      var Io = m * L * L / 3, d = L / 2, q = Io / (m * d);   /* = 2L/3 */
      /* impulso J no ponto b: v_G = J/m - (reação); reação impulsiva no pivô: */
      var Rimp = 1 - (m * d * b) / Io;                        /* fração de J que vai ao pivô */
      var Ld = 8.2, ox = 1.4, oy = 2.4;
      g.hachura(ox - 0.1, oy + 0.55, 0.9, 0, { cor: 'forte', d: 0.2 });
      g.linha(ox, oy, ox + Ld, oy, { cor: 'acento', larg: 8, cap: 'round' });
      g.circ(ox, oy, 0.22, { preenche: 'fundo', cor: 'forte', larg: 2 });
      g.txt('pivô', ox, oy - 0.65, { cor: 'suave', tam: 11 });
      g.circ(ox + Ld / 2, oy, 0.16, { preenche: 'texto', cor: null });
      g.txt('G', ox + Ld / 2, oy + 0.55, { cor: 'suave', tam: 11.5 });
      /* centro de percussão */
      var xq = ox + Ld * (q / L);
      g.linha(xq, oy - 1.2, xq, oy + 1.2, { cor: 'ok', larg: 1.4, tracejado: true });
      g.txt('centro de percussão q = 2L/3', xq, oy + 1.5, { cor: 'ok', tam: 11.5, fundo: true });
      /* impacto */
      var xi = ox + Ld * (b / L);
      g.seta(xi, oy + 1.9, 0, -1.3, { cor: 'erro', larg: 2.6, rot: 'pancada', rotTam: 11.5, rotDy: 0.6, rotDx: 0 });
      /* reação no pivô */
      var esc = 1.8;
      if (Math.abs(Rimp) > 0.02) {
        g.seta(ox, oy, 0, Rimp * esc, { cor: 's2', larg: 2.4, rot: 'reação ' + fx(Math.abs(Rimp) * 100, 0) + ' %', rotTam: 11, rotDx: -1.1, rotDy: Rimp > 0 ? 0.3 : -0.3 });
      } else {
        g.txt('reação nula', ox, oy - 1.3, { cor: 'ok', tam: 12, negrito: true, fundo: true });
      }
      /* barra de reação */
      var bx = 1.4, by = -2.4;
      g.linha(bx, by, bx + 9.2, by, { cor: 'forte', larg: 1.2 });
      g.ret(bx + 4.6, by, Math.max(-4.5, Math.min(4.5, Rimp * 4.6)), 0.5, { preenche: Math.abs(Rimp) < 0.02 ? 'ok' : 's2', cor: null, alfa: 0.8 });
      g.txt('reação impulsiva no pivô, em fração da pancada', bx + 4.6, by - 0.5, { cor: 'fraco', tam: 11 });
      g.txt(b < q - 0.02 * L ? 'batendo antes do ponto doce: o pivô leva um tranco para trás'
           : b > q + 0.02 * L ? 'batendo depois: o tranco inverte de sentido'
           : 'exatamente no ponto doce: nada chega ao pivô',
        6, 4.2, { cor: Math.abs(b - q) < 0.02 * L ? 'ok' : 'suave', tam: 12, negrito: true });
    }
  });

  /* ================= capítulo 9 ================= */

  /* 9.1 — transferência de carga */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Acelerando, a carga vai para trás; freando, vai para a frente. A transferência vale m·a·h/L — por isso um centro de massa alto faz o carro "mergulhar" mais (exemplo 9.1).',
    vista: [-0.6, 12.6, -2.6, 6.4],
    altura: 350,
    controles: [
      { id: 'a', rot: 'Aceleração (negativa = freando)', min: -8, max: 5, val: -7.85, passo: 0.25, un: 'm/s²' },
      { id: 'h', rot: 'Altura do centro de massa', min: 0.3, max: 1, val: 0.55, passo: 0.05, un: 'm' }
    ],
    desenhar: function (g, p) {
      var m = 1200, L = 2.6, b = 1.1, h = p.h, a = p.a;
      var W = m * g9;
      var dN = m * a * h / L;
      var Nf = W * (L - b) / L - dN, Nr = W * b / L + dN;
      var esc = 3.4 / W;
      var ox = 1.2, oy = 1.3, Ld = 6.6;
      var xf = ox, xr = ox + Ld;                  /* dianteiro à esquerda */
      g.hachura(0.4, oy - 0.42, 9.4, 0, { cor: 'forte', d: 0.2 });
      /* carroceria */
      g.caminho([[xf - 0.9, oy], [xr + 0.9, oy], [xr + 0.9, oy + 0.9], [xr - 0.4, oy + 0.9], [xr - 1.6, oy + 1.75], [xf + 1.2, oy + 1.75], [xf - 0.4, oy + 0.9], [xf - 0.9, oy + 0.9]],
        { cor: 'acento', larg: 2, fechar: true, preenche: 'acento', alfa: 0.18 });
      g.circ(xf, oy - 0.42 + 0.42, 0.42, { preenche: 'texto', cor: null, alfa: 0.75 });
      g.circ(xr, oy - 0.42 + 0.42, 0.42, { preenche: 'texto', cor: null, alfa: 0.75 });
      var gx = xf + (Ld * b / L), gy = oy + 0.5 + (h / 0.55) * 0.75;
      g.circ(gx, gy, 0.17, { preenche: 'erro', cor: null });
      g.txt('G', gx, gy + 0.45, { cor: 'erro', tam: 11.5, fundo: true });
      g.cota(gx, oy - 0.42, gx, gy, 'h', { dx: 0.3 });
      g.cota(xf, oy + 3.1, xr, oy + 3.1, 'L = 2,6 m', { dy: 0.3 });
      /* força de inércia */
      if (Math.abs(a) > 0.05) {
        g.seta(gx, gy, -Math.sign(a) * Math.min(2.4, Math.abs(a) * 0.3), 0,
          { cor: 'aviso', larg: 2.4, rot: 'm·a', rotTam: 11.5, rotDy: 0.45, rotDx: 0 });
      }
      /* cargas nos eixos */
      g.seta(xf, oy - 0.45, 0, -Math.max(0.2, Nf * esc), { cor: 's1', larg: 3, ponta: 0.26 });
      g.seta(xr, oy - 0.45, 0, -Math.max(0.2, Nr * esc), { cor: 's2', larg: 3, ponta: 0.26 });
      g.txt('dianteiro', xf, -2.2, { cor: 's1', tam: 11 });
      g.txt(fx(Nf / 1000, 2) + ' kN (' + fx(100 * Nf / W, 0) + ' %)', xf, -1.75, { cor: 's1', tam: 11.5, negrito: true });
      g.txt('traseiro', xr, -2.2, { cor: 's2', tam: 11 });
      g.txt(fx(Nr / 1000, 2) + ' kN (' + fx(100 * Nr / W, 0) + ' %)', xr, -1.75, { cor: 's2', tam: 11.5, negrito: true });
      g.txt('ΔN = m·a·h/L = ' + fx(Math.abs(dN) / 1000, 2) + ' kN', 5.6, 6.1, { cor: 'texto', tam: 12.5, negrito: true });
      g.txt(a < -0.05 ? 'freando: carga vai para a dianteira' : a > 0.05 ? 'acelerando: carga vai para a traseira' : 'parado: distribuição estática',
        5.6, 5.5, { cor: 'suave', tam: 11.5 });
      if (Nr <= 0 || Nf <= 0) g.txt('um dos eixos descolou do solo', 5.6, 4.9, { cor: 'erro', tam: 12, negrito: true });
      else g.txt('carro de 1200 kg, G a 1,1 m do eixo dianteiro', 5.6, 4.9, { cor: 'fraco', tam: 11 });
    }
  });

  /* 9.3 — vibração livre */
  F('#fig-9-3', {
    titulo: 'Figura 9.3',
    legenda: 'O oscilador livre, ponto de partida de Vibrações Mecânicas: a frequência natural depende só da razão entre rigidez e inércia, não da amplitude.',
    vista: [-0.6, 12.6, -2.4, 6.4],
    altura: 350,
    animar: true,
    controles: [
      { id: 'k', rot: 'Rigidez da mola', min: 2000, max: 60000, val: 20000, passo: 1000, un: 'N/m' },
      { id: 'm', rot: 'Massa', min: 10, max: 200, val: 50, passo: 5, un: 'kg' }
    ],
    desenhar: function (g, p, t) {
      var k = p.k, m = p.m;
      var wn = Math.sqrt(k / m), fn = wn / (2 * Math.PI), T = 1 / fn;
      var A = 0.8;
      var x = A * Math.cos(wn * t * 0.35);
      var ox = 2.6, oy = 4.6;
      /* teto e mola */
      g.hachura(ox - 1.2, oy + 0.9, 2.4, 0, { cor: 'forte', d: 0.22 });
      g.linha(ox - 1.2, oy + 0.9, ox + 1.2, oy + 0.9, { cor: 'forte', larg: 2 });
      var yb = oy - 1.6 - x;
      g.mola(ox, oy + 0.9, ox, yb + 0.55, 7, { cor: 'suave' });
      g.ret(ox - 0.85, yb - 0.55, 1.7, 1.1, { preenche: 'acento', cor: null, alfa: 0.85 });
      g.txt(m + ' kg', ox, yb, { cor: 'fundo', tam: 11.5, negrito: true });
      g.linha(ox - 1.6, oy - 1.6, ox + 1.6, oy - 1.6, { cor: 'fraco', larg: 1, tracejado: true });
      g.txt('equilíbrio', ox, oy - 2.1, { cor: 'fraco', tam: 10.5 });

      /* x(t) */
      var gx0 = 6.1, gy0 = 2.6, gw = 5.9, gh = 1.6;
      g.linha(gx0, gy0, gx0 + gw, gy0, { cor: 'fraco', larg: 1 });
      g.linha(gx0, gy0 - gh, gx0, gy0 + gh, { cor: 'fraco', larg: 1 });
      var pts = [], i;
      for (i = 0; i <= 120; i++) {
        var tt = i / 120 * 4 * Math.PI;
        pts.push([gx0 + gw * i / 120, gy0 + gh * 0.85 * Math.cos(tt + wn * t * 0.35)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2 });
      g.txt('x(t) = A cos(ωₙ t)', gx0 + gw / 2, gy0 + gh + 0.5, { cor: 'suave', tam: 11.5 });
      g.txt('ωₙ = √(k/m) = ' + fx(wn, 1) + ' rad/s', gx0, 0.4, { cor: 'texto', tam: 13, negrito: true, alin: 'esq' });
      g.txt('f = ' + fx(fn, 2) + ' Hz · período ' + fx(T, 2) + ' s', gx0, -0.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('o pêndulo composto obedece à mesma equação,', gx0, -1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('com I no lugar de m e mgd no lugar de k', gx0, -1.75, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });
})();

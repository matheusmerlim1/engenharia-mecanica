/* ============================================================
   Figuras ilustrativas de Macromecânica dos compósitos
   Anisotropia, cura, fibras, interface, regra das misturas,
   lâmina ortotrópica, transformação de eixos, laminado,
   tensões de cura, envelopes de falha e falha progressiva.
   Cada figura resolve as equações do capítulo ao desenhar.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.MMC) return;
  var F = window.Figura.criar;
  var C = window.MMC;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var rad = function (d) { return d * Math.PI / 180; };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* eixos de um gráfico embutido na figura, em coordenadas do desenho.
     Devolve os mapeadores X e Y e já desenha moldura, marcas e rótulos. */
  function eixos(g, o) {
    var bx = o.x, by = o.y, bw = o.w, bh = o.h;
    var x0 = o.xr[0], x1 = o.xr[1], y0 = o.yr[0], y1 = o.yr[1];
    var X = function (v) { return bx + bw * (lim(v, x0, x1) - x0) / (x1 - x0); };
    var Y = function (v) { return by + bh * (lim(v, y0, y1) - y0) / (y1 - y0); };
    g.linha(bx, by, bx + bw, by, { cor: 'fraco', larg: 1.2 });
    g.linha(bx, by, bx, by + bh, { cor: 'fraco', larg: 1.2 });
    (o.xt || []).forEach(function (v) {
      g.linha(X(v), by, X(v), by - 0.13, { cor: 'fraco', larg: 1 });
      g.txt(o.fx ? o.fx(v) : fx(v, o.xd == null ? 0 : o.xd), X(v), by - 0.42, { cor: 'fraco', tam: 9.5 });
    });
    (o.yt || []).forEach(function (v) {
      g.linha(bx, Y(v), bx - 0.13, Y(v), { cor: 'fraco', larg: 1 });
      g.txt(o.fy ? o.fy(v) : fx(v, o.yd == null ? 0 : o.yd), bx - 0.24, Y(v), { cor: 'fraco', tam: 9.5, alin: 'dir' });
    });
    if (o.xlab) g.txt(o.xlab, bx + bw / 2, by - 0.95, { cor: 'fraco', tam: 10.5 });
    if (o.ylab) g.txt(o.ylab, bx - 0.05, by + bh + 0.38, { cor: 'fraco', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, bx: bx, by: by, bw: bw, bh: bh };
  }
  function curva(g, e, xs, fn, o) {
    var pts = [], i;
    for (i = 0; i < xs.length; i++) pts.push([e.X(xs[i]), e.Y(fn(xs[i]))]);
    g.caminho(pts, o);
  }
  function serie(a, b, n) {
    var out = [], i;
    for (i = 0; i <= n; i++) out.push(a + (b - a) * i / n);
    return out;
  }

  /* ---------- 1.1 — isotrópico contra ortotrópico ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'O módulo de elasticidade medido em cada direção do plano. No metal é um círculo: tanto faz a direção. Na lâmina unidirecional é um lóbulo estreito — toda a rigidez está na direção da fibra, e a 45° já sobrou pouco mais que a matriz.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'E1', rot: 'Módulo na fibra E₁', min: 20, max: 170, val: 134, passo: 2, un: 'GPa' },
      { id: 'E2', rot: 'Módulo transversal E₂', min: 3, max: 30, val: 7, passo: 0.5, un: 'GPa' },
      { id: 'G12', rot: 'Cisalhamento G₁₂', min: 1.5, max: 12, val: 4.2, passo: 0.1, un: 'GPa' }
    ],
    desenhar: function (g, p) {
      var E1 = p.E1, E2 = p.E2, G12 = p.G12, n12 = 0.28;
      var cx = 3.3, cy = 2.2, R = 2.25, Eal = 71;
      var Emax = Math.max(E1, Eal), i;
      var esc = R / Emax;
      /* anéis de referência */
      [0.25, 0.5, 0.75, 1].forEach(function (f) {
        g.circ(cx, cy, R * f, { cor: 'fraco', larg: 1, tracejado: [3, 3] });
        g.txt(fx(Emax * f, 0), cx + 0.12, cy + R * f - 0.02, { cor: 'fraco', tam: 9, alin: 'esq' });
      });
      g.linha(cx - R - 0.5, cy, cx + R + 0.5, cy, { cor: 'fraco', larg: 1 });
      g.linha(cx, cy - R - 0.5, cx, cy + R + 0.5, { cor: 'fraco', larg: 1 });
      /* alumínio: círculo */
      g.circ(cx, cy, Eal * esc, { cor: 's5', larg: 2, tracejado: [6, 4] });
      /* lâmina: lóbulo de Ex(θ) */
      var pts = [];
      for (i = 0; i <= 360; i += 2) {
        var q = C.foraEixo(E1, E2, G12, n12, rad(i));
        pts.push([cx + q.Ex * esc * Math.cos(rad(i)), cy + q.Ex * esc * Math.sin(rad(i))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6, fechar: true, preenche: 's1', alfa: 0.12 });
      /* fibras na direção 0° */
      for (i = -3; i <= 3; i++) {
        g.linha(cx - R - 0.35, cy + i * 0.16, cx + R + 0.35, cy + i * 0.16, { cor: 's1', larg: 0.9, tracejado: [2, 3] });
      }
      var q45 = C.foraEixo(E1, E2, G12, n12, rad(45));
      g.linha(cx, cy, cx + q45.Ex * esc * Math.cos(rad(45)), cy + q45.Ex * esc * Math.sin(rad(45)),
        { cor: 'erro', larg: 2 });
      g.circ(cx + q45.Ex * esc * Math.cos(rad(45)), cy + q45.Ex * esc * Math.sin(rad(45)), 0.11,
        { preenche: 'erro', cor: null });
      g.txt('45°', cx + 0.95, cy + 0.52, { cor: 'erro', tam: 11, negrito: true, fundo: true });
      g.txt('E(θ) em GPa', cx, cy + R + 0.85, { cor: 'texto', tam: 12, negrito: true });
      g.txt('direção 1 (fibra)', cx + R + 0.55, cy - 0.3, { cor: 's1', tam: 10, alin: 'dir' });
      g.txt('direção 2', cx + 0.15, cy + R + 0.4, { cor: 'suave', tam: 10, alin: 'esq' });
      /* coluna de resultados */
      var xr = 7.3;
      g.txt('alumínio (isotrópico)', xr, 5.2, { cor: 's5', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E = 71 GPa em qualquer direção', xr, 4.65, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('lâmina unidirecional', xr, 3.95, { cor: 's1', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E(0°) = ' + fx(E1, 1) + ' GPa', xr, 3.4, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('E(45°) = ' + fx(q45.Ex, 2) + ' GPa', xr, 2.85, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('E(90°) = ' + fx(E2, 2) + ' GPa', xr, 2.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('anisotropia E₁/E₂ = ' + fx(E1 / E2, 1), xr, 1.7, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      g.txt('a 45° resta ' + fx(100 * q45.Ex / E1, 1) + ' % de E₁', xr, 1.15,
        { cor: q45.Ex / E1 < 0.2 ? 'erro' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ν₁₂ = 0,28 · lóbulo calculado com 1/E_x = c⁴/E₁ + (1/G₁₂ − 2ν₁₂/E₁)c²s² + s⁴/E₂',
        6, -1.1, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 2.1 — cinética de cura de uma matriz termorrígida ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Grau de cura e viscosidade ao longo do tempo. Antes do ponto de gel a resina escoa e molha a fibra; depois dele não há mais como acomodar o reforço. É essa janela que o ciclo de cura administra.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura de cura', min: 60, max: 180, val: 100, passo: 5, un: '°C' },
      { id: 'cat', rot: 'Teor de catalisador', min: 0.4, max: 2.5, val: 1, passo: 0.1, un: '%' },
      { id: 'ag', rot: 'Grau de cura no gel', min: 0.4, max: 0.8, val: 0.6, passo: 0.02, un: '' }
    ],
    desenhar: function (g, p) {
      var A = 3.1347e5, Ea = 60000, Rg = 8.314;
      var K = A * Math.exp(-Ea / (Rg * (p.T + 273.15))) * p.cat;
      var ag = p.ag;
      var tgel = ag / (K * (1 - ag));                  /* s */
      var t95 = 0.95 / (K * 0.05);
      var alfa = function (t) { return K * t / (1 + K * t); };
      var tmax = Math.max(4 * tgel, 60);
      var e = eixos(g, {
        x: 1.15, y: 1.0, w: 5.4, h: 4.1, xr: [0, tmax / 60], yr: [0, 1],
        xt: [0, tmax / 240, tmax / 120, tmax / 80, tmax / 60], yt: [0, 0.25, 0.5, 0.75, 1],
        xd: 1, yd: 2, xlab: 'tempo (min)', ylab: 'grau de cura α'
      });
      var ts = serie(0, tmax, 160);
      /* zona de gel */
      g.ret(e.X(0), e.by, e.X(tgel / 60) - e.X(0), e.bh, { cor: null, preenche: 'ok', alfa: 0.10 });
      g.txt('resina escoa', e.X(tgel / 120), e.by + e.bh - 0.3, { cor: 'ok', tam: 10, negrito: true });
      g.txt('sólido', e.X(tgel / 60) + 0.35, e.by + e.bh - 0.3, { cor: 'erro', tam: 10, negrito: true, alin: 'esq' });
      /* viscosidade normalizada: cresce e explode no gel */
      curva(g, e, ts, function (t) {
        var a = alfa(t);
        if (a >= ag * 0.995) return 1;
        return lim(0.06 * Math.pow(ag / (ag - a), 1.4), 0, 1);
      }, { cor: 's4', larg: 2, tracejado: [5, 4] });
      /* grau de cura */
      curva(g, e, ts, function (t) { return alfa(t); }, { cor: 's1', larg: 2.8 });
      g.linha(e.X(tgel / 60), e.by, e.X(tgel / 60), e.by + e.bh, { cor: 'erro', larg: 1.6, tracejado: [5, 4] });
      g.linha(e.bx, e.Y(ag), e.bx + e.bw, e.Y(ag), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      g.circ(e.X(tgel / 60), e.Y(ag), 0.13, { preenche: 'erro', cor: null });
      g.txt('ponto de gel', e.X(tgel / 60) + 0.15, e.Y(ag) + 0.45, { cor: 'erro', tam: 10.5, alin: 'esq', negrito: true, fundo: true });
      g.txt('α', e.bx + e.bw - 0.2, e.Y(alfa(tmax * 0.9)) + 0.3, { cor: 's1', tam: 11.5, alin: 'dir', negrito: true });
      g.txt('viscosidade', e.bx + e.bw - 0.2, e.by + 1.0, { cor: 's4', tam: 10.5, alin: 'dir', negrito: true, fundo: true });
      var xr = 7.3;
      g.txt('K = ' + K.toExponential(2).replace('.', ',').replace('e-', '×10⁻') + ' s⁻¹', xr, 5.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('tempo de gel', xr, 4.55, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt(tgel < 120 ? fx(tgel, 0) + ' s' : fx(tgel / 60, 1) + ' min', xr, 4.0, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('95 % de cura em ' + (t95 / 60 > 90 ? fx(t95 / 3600, 1) + ' h' : fx(t95 / 60, 0) + ' min'),
        xr, 3.35, { cor: 'texto', tam: 12, alin: 'esq' });
      g.txt('janela de laminação', xr, 2.7, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt(tgel / 60 < 10 ? 'curta: prensa a quente' : tgel / 60 < 60 ? 'média: laminação manual' : 'longa: infusão e RTM',
        xr, 2.15, { cor: tgel / 60 < 10 ? 'aviso' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('+10 °C ⇒ gel ' + fx(Math.exp(Ea / Rg * (1 / (p.T + 273.15) - 1 / (p.T + 283.15))), 2) + '× mais rápido',
        xr, 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('dobrar o catalisador ⇒ metade do tempo', xr, 1.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('cinética de 2ª ordem dα/dt = K(1−α)², K de Arrhenius com Eₐ = 60 kJ/mol · modelo didático',
        6, -1.1, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 3.1 — mapa de propriedades específicas das fibras ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Resistência e rigidez divididas pela massa específica. As fibras ocupam um canto do mapa onde nenhum metal chega; o compósito fica entre a fibra e a matriz, na posição que a fração volumétrica determina.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'fib', rot: 'Fibra: 1 vidro-E · 2 vidro-S · 3 carbono HR · 4 carbono HM · 5 aramida · 6 boro', min: 1, max: 6, val: 3, passo: 1 },
      { id: 'Vf', rot: 'Fração volumétrica de fibra', min: 0.2, max: 0.75, val: 0.6, passo: 0.01, un: '' },
      { id: 'mat', rot: 'Matriz: 1 epóxi · 2 poliéster · 3 PEEK', min: 1, max: 3, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var chavesF = ['vidroE', 'vidroS', 'carbonoHR', 'carbonoHM', 'aramida', 'boro'];
      var chavesM = ['epoxi', 'poliester', 'peek'];
      var kf = chavesF[Math.round(p.fib) - 1], km = chavesM[Math.round(p.mat) - 1];
      var r = C.micro({ Vf: p.Vf, Vv: 0, fibra: kf, matriz: km, xi: 2 });
      var e = eixos(g, {
        x: 1.3, y: 1.0, w: 5.2, h: 4.1, xr: [0, 230], yr: [0, 2600],
        xt: [0, 50, 100, 150, 200], yt: [0, 500, 1000, 1500, 2000, 2500],
        xlab: 'rigidez específica E/ρ (GPa·cm³/g)', ylab: 'σ/ρ (MPa·cm³/g)'
      });
      /* metais de referência */
      [['aço', 205, 7.85, 420], ['Al 7075', 71, 2.80, 505], ['Ti-6Al-4V', 114, 4.43, 900]]
        .forEach(function (q) {
          var X = e.X(q[1] / q[2]), Y = e.Y(q[3] / q[2]);
          g.circ(X, Y, 0.12, { preenche: 's5', cor: null });
          g.txt(q[0], X + 0.18, Y, { cor: 's5', tam: 9.5, alin: 'esq' });
        });
      /* todas as fibras */
      chavesF.forEach(function (k, i) {
        var f = C.fibras[k];
        var X = e.X(f.E / f.rho), Y = e.Y(f.sut / f.rho);
        var sel = k === kf;
        g.circ(X, Y, sel ? 0.18 : 0.11, { preenche: sel ? 's2' : 'fraco', cor: null });
        if (sel || i % 2 === 0) {
          g.txt(f.nome.split(' ')[0] + (k === 'carbonoHM' ? ' HM' : k === 'carbonoHR' ? ' HR' : ''),
            X + 0.2, Y + (sel ? 0.3 : 0), { cor: sel ? 's2' : 'fraco', tam: sel ? 10.5 : 9, alin: 'esq', negrito: sel });
        }
      });
      /* matriz e trilha do compósito */
      var m = C.matrizes[km];
      g.circ(e.X(m.E / m.rho), e.Y(m.sut / m.rho), 0.12, { preenche: 's6', cor: null });
      g.txt(m.nome.split(' ')[0], e.X(m.E / m.rho) + 0.2, e.Y(m.sut / m.rho), { cor: 's6', tam: 9.5, alin: 'esq' });
      var pts = [], i;
      for (i = 0; i <= 40; i++) {
        var q = C.micro({ Vf: 0.2 + 0.55 * i / 40, Vv: 0, fibra: kf, matriz: km, xi: 2 });
        pts.push([e.X(q.E1 / q.rho), e.Y(q.s1u / q.rho)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.2, tracejado: [5, 4] });
      g.circ(e.X(r.E1 / r.rho), e.Y(r.s1u / r.rho), 0.17, { preenche: 's1', cor: null });
      g.txt('compósito', e.X(r.E1 / r.rho) + 0.22, e.Y(r.s1u / r.rho) - 0.32, { cor: 's1', tam: 10.5, alin: 'esq', negrito: true });
      var xr = 7.3;
      g.txt(C.fibras[kf].nome, xr, 5.2, { cor: 's2', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E = ' + fx(C.fibras[kf].E, 0) + ' GPa · σ = ' + fx(C.fibras[kf].sut, 0) + ' MPa', xr, 4.65, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ρ = ' + fx(C.fibras[kf].rho, 2) + ' g/cm³', xr, 4.15, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('lâmina com V_f = ' + fx(p.Vf, 2), xr, 3.5, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E₁ = ' + fx(r.E1, 1) + ' GPa', xr, 2.95, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('σ₁ᵘ = ' + fx(r.s1u, 0) + ' MPa', xr, 2.4, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('ρ = ' + fx(r.rho, 3) + ' g/cm³', xr, 1.85, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('E₁/ρ = ' + fx(r.E1 / r.rho, 1) + ' (aço 26,1)', xr, 1.3,
        { cor: r.E1 / r.rho > 26.1 ? 'ok' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('σ₁ᵘ/ρ = ' + fx(r.s1u / r.rho, 0) + ' (aço 53,5)', xr, 0.8, { cor: 'ok', tam: 11.5, alin: 'esq' });
      g.txt('valores de fibra nua e de matriz pura; o compósito usa a regra das misturas na direção da fibra',
        6, -1.1, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 4.1 — transferência de carga e comprimento crítico ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'A fibra só é carregada pelo cisalhamento da interface: a tensão sobe a partir das duas pontas. Se a fibra for mais curta que o comprimento crítico, ela nunca chega à própria resistência e descola sem romper (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'L', rot: 'Comprimento da fibra', min: 0.1, max: 3, val: 1, passo: 0.05, un: 'mm' },
      { id: 'ti', rot: 'Resistência da interface τ_i', min: 10, max: 70, val: 40, passo: 1, un: 'MPa' },
      { id: 'd', rot: 'Diâmetro da fibra', min: 5, max: 20, val: 7, passo: 0.5, un: 'µm' }
    ],
    desenhar: function (g, p) {
      var sfu = 3500, d = p.d * 1e-3, ti = p.ti, L = p.L;
      var lc = sfu * d / (2 * ti);
      var etaL = L > lc ? 1 - lc / (2 * L) : L / (2 * lc);
      var smax = Math.min(sfu, 2 * ti * (L / 2) / d);
      /* desenho da fibra na matriz */
      var fx0 = 1.0, fw = 5.6, fy = 4.3;
      g.ret(fx0 - 0.25, fy - 0.55, fw + 0.5, 1.1, { cor: 'borda', larg: 1, preenche: 's6', alfa: 0.16 });
      g.txt('matriz', fx0 + fw + 0.35, fy + 0.42, { cor: 's6', tam: 10, alin: 'esq' });
      g.ret(fx0, fy - 0.17, fw, 0.34, { cor: 's2', larg: 1.4, preenche: 's2', alfa: 0.5 });
      g.txt('fibra', fx0 + fw / 2, fy + 0.42, { cor: 's2', tam: 10.5, negrito: true });
      var i;
      for (i = 0; i <= 10; i++) {
        var xx = fx0 + fw * i / 10;
        var dir = i < 5 ? 1 : i > 5 ? -1 : 0;
        if (dir) g.seta(xx, fy - 0.42, dir * 0.3, 0, { cor: 'acento', larg: 1.3, ponta: 0.13 });
      }
      g.txt('τ transmitido pela interface', fx0 + fw / 2, fy - 0.78, { cor: 'acento', tam: 10 });
      g.cota(fx0, fy + 0.72, fx0 + fw, fy + 0.72, 'L = ' + fx(L, 2) + ' mm', { dy: 0.22 });
      /* perfil de tensão na fibra */
      var e = eixos(g, {
        x: 1.0, y: 0.9, w: 5.6, h: 2.3, xr: [0, L], yr: [0, sfu * 1.08],
        xt: [0, L / 4, L / 2, 3 * L / 4, L], yt: [0, 1000, 2000, 3000],
        xd: 2, xlab: 'posição ao longo da fibra (mm)', ylab: 'σ_f (MPa)'
      });
      var pts = [], xs = serie(0, L, 100);
      for (i = 0; i < xs.length; i++) {
        var x = xs[i];
        var s = Math.min(sfu, 2 * ti * Math.min(x, L - x) / d);
        pts.push([e.X(x), e.Y(s)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      g.linha(e.bx, e.Y(sfu), e.bx + e.bw, e.Y(sfu), { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('σ_f ᵘ = 3500 MPa', e.bx + e.bw - 0.1, e.Y(sfu) - 0.26, { cor: 'erro', tam: 10, alin: 'dir', fundo: true });
      if (L > lc) {
        g.linha(e.X(lc / 2), e.by, e.X(lc / 2), e.by + e.bh, { cor: 'ok', larg: 1.2, tracejado: [4, 4] });
        g.txt('ℓ_c/2', e.X(lc / 2), e.by - 0.42, { cor: 'ok', tam: 9.5 });
      }
      var xr = 7.3;
      g.txt('ℓ_c = σ_f ᵘ d / (2τ_i)', xr, 5.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ℓ_c = ' + fx(lc, 3) + ' mm', xr, 4.6, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('ℓ_c/d = ' + fx(lc / d, 0), xr, 4.0, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('L/ℓ_c = ' + fx(L / lc, 2), xr, 3.4, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('σ_f máximo = ' + fx(smax, 0) + ' MPa', xr, 2.8, { cor: smax < sfu * 0.99 ? 'erro' : 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('eficiência η_L = ' + fx(100 * etaL, 1) + ' %', xr, 2.2, { cor: 'acento', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(L > lc ? 'fibra longa: rompe antes de descolar' : 'fibra curta: descola sem romper',
        xr, 1.55, { cor: L > lc ? 'ok' : 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt(L > 10 * lc ? 'L > 10ℓ_c: fibra praticamente contínua' : 'reforço descontínuo: η_L abaixo de 1',
        xr, 1.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('modelo de shear lag com τ constante na interface · fibra de carbono de alta resistência',
        6, -1.1, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 5.1 — regra das misturas ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'E₁ sobe em linha reta com a fração de fibra; E₂ fica rastejando perto da matriz e só reage perto de V_f = 1. A regra inversa é um limite inferior — Halpin-Tsai fica mais perto do medido (exemplo 5.2).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Vf', rot: 'Fração volumétrica de fibra', min: 0.05, max: 0.8, val: 0.55, passo: 0.01, un: '' },
      { id: 'Ef', rot: 'Módulo da fibra E_f', min: 20, max: 400, val: 73, passo: 2, un: 'GPa' },
      { id: 'Em', rot: 'Módulo da matriz E_m', min: 1.5, max: 8, val: 3.4, passo: 0.1, un: 'GPa' }
    ],
    desenhar: function (g, p) {
      var Ef = p.Ef, Em = p.Em, Vf = p.Vf;
      var E1 = function (v) { return Ef * v + Em * (1 - v); };
      var E2i = function (v) { return 1 / (v / Ef + (1 - v) / Em); };
      var E2h = function (v) {
        var r = Ef / Em, eta = (r - 1) / (r + 2);
        return Em * (1 + 2 * eta * v) / (1 - eta * v);
      };
      var e = eixos(g, {
        x: 1.3, y: 1.0, w: 5.2, h: 4.1, xr: [0, 1], yr: [0, Math.max(Ef, 1) * 1.05],
        xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, Ef / 4, Ef / 2, 3 * Ef / 4, Ef],
        xd: 2, xlab: 'fração volumétrica de fibra V_f', ylab: 'módulo (GPa)'
      });
      var xs = serie(0, 1, 100);
      curva(g, e, xs, E1, { cor: 's1', larg: 2.8 });
      curva(g, e, xs, E2h, { cor: 's4', larg: 2.4 });
      curva(g, e, xs, E2i, { cor: 's3', larg: 2.2, tracejado: [5, 4] });
      g.txt('E₁ (paralelo)', e.X(0.52), e.Y(E1(0.52)) + 0.42, { cor: 's1', tam: 11, negrito: true, fundo: true });
      g.txt('E₂ Halpin-Tsai', e.bx + 0.15, e.Y(E2h(0.8)) + 0.3, { cor: 's4', tam: 10.5, alin: 'esq', negrito: true, fundo: true });
      g.txt('E₂ regra inversa', e.bx + 0.15, e.Y(E2i(0.75)) - 0.3, { cor: 's3', tam: 10.5, alin: 'esq', negrito: true, fundo: true });
      g.linha(e.X(Vf), e.by, e.X(Vf), e.by + e.bh, { cor: 'fraco', larg: 1.2, tracejado: [4, 4] });
      g.circ(e.X(Vf), e.Y(E1(Vf)), 0.14, { preenche: 's1', cor: null });
      g.circ(e.X(Vf), e.Y(E2h(Vf)), 0.12, { preenche: 's4', cor: null });
      g.circ(e.X(Vf), e.Y(E2i(Vf)), 0.12, { preenche: 's3', cor: null });
      /* molas em paralelo e em série, como esquema */
      g.txt('direção 1: molas em paralelo', 2.4, 5.45, { cor: 's1', tam: 10, negrito: true });
      var xr = 7.3;
      g.txt('V_f = ' + fx(Vf, 2) + ' · V_m = ' + fx(1 - Vf, 2), xr, 5.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('E₁ = E_f V_f + E_m V_m', xr, 4.65, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.txt('E₁ = ' + fx(E1(Vf), 2) + ' GPa', xr, 4.1, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('E₂ inversa = ' + fx(E2i(Vf), 2) + ' GPa', xr, 3.45, { cor: 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('E₂ Halpin-Tsai = ' + fx(E2h(Vf), 2) + ' GPa', xr, 2.9, { cor: 's4', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('diferença entre modelos: ' + fx(100 * (E2h(Vf) / E2i(Vf) - 1), 0) + ' %', xr, 2.35, { cor: 'aviso', tam: 11.5, alin: 'esq' });
      g.txt('anisotropia E₁/E₂ = ' + fx(E1(Vf) / E2h(Vf), 1), xr, 1.75, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('a fibra responde por ' + fx(100 * Ef * Vf / E1(Vf), 1) + ' % de E₁', xr, 1.2, { cor: 'ok', tam: 11.5, alin: 'esq' });
      g.txt('E_f/E_m = ' + fx(Ef / Em, 1) + ' · Halpin-Tsai com ξ = 2 (fibras de seção circular)',
        6, -1.1, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 5.2 — fração volumétrica mínima e crítica ---------- */
  F('#fig-5-2', {
    titulo: 'Figura 5.2',
    legenda: 'Com pouca fibra, o compósito é mais fraco que a matriz pura: as fibras rompem primeiro e o que sobra é menos matriz para carregar. Só acima da fração crítica a fibra paga o que custa (exemplo 5.3).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'sfu', rot: 'Resistência da fibra σ_f ᵘ', min: 400, max: 4000, val: 2300, passo: 50, un: 'MPa' },
      { id: 'Ef', rot: 'Módulo da fibra E_f', min: 50, max: 400, val: 380, passo: 5, un: 'GPa' },
      { id: 'smu', rot: 'Resistência da matriz σ_m ᵘ', min: 25, max: 110, val: 70, passo: 1, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var sfu = p.sfu, Ef = p.Ef * 1000, Em = 3400, smu = p.smu;
      var efu = sfu / Ef;
      var sm = Math.min(Em * efu, smu);
      var Vcrit = (smu - sm) / (sfu - sm);
      var Vmin = (smu - sm) / (sfu + smu - sm);
      var s1u = function (v) { return sfu * v + sm * (1 - v); };
      var soMatriz = function (v) { return smu * (1 - v); };
      var Vlim = Math.max(0.1, Math.min(0.5, Vcrit * 6));
      var e = eixos(g, {
        x: 1.35, y: 1.0, w: 5.1, h: 4.1, xr: [0, Vlim], yr: [0, Math.max(s1u(Vlim), smu * 1.3)],
        xt: [0, Vlim / 4, Vlim / 2, 3 * Vlim / 4, Vlim],
        yt: [0, smu, smu * 2, smu * 3, smu * 4].filter(function (v) { return v <= Math.max(s1u(Vlim), smu * 1.3); }),
        xd: 3, xlab: 'fração volumétrica de fibra V_f', ylab: 'resistência (MPa)'
      });
      var xs = serie(0, Vlim, 100);
      curva(g, e, xs, s1u, { cor: 's1', larg: 2.8 });
      curva(g, e, xs, soMatriz, { cor: 's3', larg: 2.2, tracejado: [5, 4] });
      g.linha(e.bx, e.Y(smu), e.bx + e.bw, e.Y(smu), { cor: 'aviso', larg: 1.4, tracejado: [3, 3] });
      g.txt('matriz pura σ_m ᵘ', e.bx + e.bw - 0.12, e.Y(smu) + 0.28, { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      g.txt('compósito (fibras rompem)', e.X(Vlim * 0.55), e.Y(s1u(Vlim * 0.55)) + 0.42, { cor: 's1', tam: 10.5, negrito: true, fundo: true });
      g.txt('só matriz, após romperem', e.bx + 0.15, e.Y(soMatriz(Vlim * 0.18)) - 0.35, { cor: 's3', tam: 10, alin: 'esq', fundo: true });
      if (Vcrit > 0 && Vcrit < Vlim) {
        g.linha(e.X(Vcrit), e.by, e.X(Vcrit), e.by + e.bh, { cor: 'erro', larg: 1.6, tracejado: [5, 4] });
        g.txt('V_crit', e.X(Vcrit), e.by + e.bh + 0.3, { cor: 'erro', tam: 10.5, negrito: true });
        g.ret(e.bx, e.by, e.X(Vcrit) - e.bx, e.bh, { cor: null, preenche: 'erro', alfa: 0.08 });
        g.txt('fibra em vão', e.X(Vcrit / 2), e.by + 0.45, { cor: 'erro', tam: 10, negrito: true });
      }
      if (Vmin > 0 && Vmin < Vlim) {
        g.linha(e.X(Vmin), e.by, e.X(Vmin), e.by + e.bh * 0.7, { cor: 'ok', larg: 1.2, tracejado: [3, 3] });
      }
      var xr = 7.3;
      g.txt('ε_f ᵘ = σ_f ᵘ/E_f = ' + fx(100 * efu, 3) + ' %', xr, 5.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('σ_m* = E_m ε_f ᵘ = ' + fx(sm, 1) + ' MPa', xr, 4.65, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('tensão na matriz quando a fibra rompe', xr, 4.2, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('V_crit = ' + fx(100 * Vcrit, 2) + ' %', xr, 3.55, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('V_mín = ' + fx(100 * Vmin, 2) + ' %', xr, 2.95, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('em V_f = 0,60: σ₁ᵘ = ' + fx(s1u(0.6), 0) + ' MPa', xr, 2.3, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(Vcrit < 0.05 ? 'fibra forte: qualquer fração prática já vale' : 'fibra fraca: a fração crítica importa',
        xr, 1.7, { cor: Vcrit < 0.05 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ganho sobre a matriz: ' + fx(s1u(0.6) / smu, 0) + '×', xr, 1.15, { cor: 'texto', tam: 11.5, alin: 'esq' });
      g.txt('E_m = 3,4 GPa · V_crit = (σ_mᵘ − σ_m*)/(σ_fᵘ − σ_m*) · V_mín = (σ_mᵘ − σ_m*)/(σ_fᵘ + σ_mᵘ − σ_m*)',
        6, -1.1, { cor: 'fraco', tam: 10 });
    }
  });

  /* ---------- 6.1 — a lâmina ortotrópica responde diferente em 1 e em 2 ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'O mesmo elemento de lâmina sob a mesma tensão, aplicada em três direções. Na fibra ele quase não cede; transversalmente cede muito e contrai pouco de lado. São quatro constantes independentes, não duas (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'sig', rot: 'Tensão aplicada', min: 10, max: 200, val: 100, passo: 5, un: 'MPa' },
      { id: 'amp', rot: 'Amplificação do desenho', min: 2, max: 20, val: 8, passo: 1, un: '×' },
      { id: 'caso', rot: 'Destaque: 1 σ₁ · 2 σ₂ · 3 τ₁₂', min: 1, max: 3, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var L = C.laminas.carbono;
      var E1 = L.E1 * 1000, E2 = L.E2 * 1000, G12 = L.G12 * 1000, n12 = L.n12;
      var n21 = n12 * E2 / E1, s = p.sig, amp = p.amp, caso = Math.round(p.caso);
      var casos = [
        { rot: 'σ₁ na fibra', e1: s / E1, e2: -n12 * s / E1, g: 0 },
        { rot: 'σ₂ transversal', e1: -n21 * s / E2, e2: s / E2, g: 0 },
        { rot: 'τ₁₂ no plano', e1: 0, e2: 0, g: s / G12 }
      ];
      var lado = 1.25, i;
      for (i = 0; i < 3; i++) {
        var cx = 1.5 + i * 2.1, cy = 3.1;
        var sel = (i + 1) === caso;
        var q = casos[i];
        /* quadrado de referência */
        g.ret(cx, cy, lado, lado, { cor: 'fraco', larg: 1, tracejado: [3, 3] });
        /* deformado */
        var a = lado * (1 + q.e1 * amp), b = lado * (1 + q.e2 * amp), sh = lado * q.g * amp;
        g.caminho([[cx, cy], [cx + a, cy], [cx + a + sh, cy + b], [cx + sh, cy + b]],
          { cor: sel ? 's1' : 'suave', larg: sel ? 2.6 : 1.6, fechar: true, preenche: sel ? 's1' : 'borda', alfa: sel ? 0.18 : 0.10 });
        /* fibras horizontais */
        var k;
        for (k = 1; k <= 3; k++) {
          var fr = k / 4;
          g.linha(cx + sh * fr, cy + b * fr, cx + a + sh * fr, cy + b * fr, { cor: 's2', larg: 0.9, tracejado: [2, 3] });
        }
        /* setas de carga */
        if (i === 0) {
          g.seta(cx - 0.55, cy + b / 2, 0.42, 0, { cor: 'erro', larg: 1.6, ponta: 0.16 });
          g.seta(cx + a + sh + 0.55, cy + b / 2, -0.42, 0, { cor: 'erro', larg: 1.6, ponta: 0.16 });
        } else if (i === 1) {
          g.seta(cx + a / 2, cy - 0.55, 0, 0.42, { cor: 'erro', larg: 1.6, ponta: 0.16 });
          g.seta(cx + a / 2 + sh, cy + b + 0.55, 0, -0.42, { cor: 'erro', larg: 1.6, ponta: 0.16 });
        } else {
          g.seta(cx + 0.1, cy + b + 0.3, 0.9, 0, { cor: 'erro', larg: 1.6, ponta: 0.16 });
          g.seta(cx + a - 0.1, cy - 0.3, -0.9, 0, { cor: 'erro', larg: 1.6, ponta: 0.16 });
        }
        g.txt(q.rot, cx + lado / 2, cy + lado + 1.05, { cor: sel ? 's1' : 'fraco', tam: 10.5, negrito: sel });
        g.txt(i === 2 ? 'γ₁₂ = ' + fx(q.g * 100, 3) + ' %' : 'ε₁ = ' + fx(q.e1 * 100, 3) + ' %',
          cx + lado / 2, cy - 0.95, { cor: sel ? 'texto' : 'fraco', tam: 10 });
        if (i !== 2) g.txt('ε₂ = ' + fx(q.e2 * 100, 3) + ' %', cx + lado / 2, cy - 1.35, { cor: sel ? 'texto' : 'fraco', tam: 10 });
      }
      g.txt('fibra na horizontal · contorno tracejado = indeformado · amplificação ' + fx(amp, 0) + '×',
        3.6, 5.45, { cor: 'fraco', tam: 10 });
      var xr = 7.6;
      g.txt('carbono/epóxi', xr, 5.2, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E₁ = ' + fx(L.E1, 0) + ' · E₂ = ' + fx(L.E2, 1) + ' GPa', xr, 4.65, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('G₁₂ = ' + fx(L.G12, 1) + ' GPa · ν₁₂ = ' + fx(n12, 2), xr, 4.15, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('ν₂₁ = ν₁₂E₂/E₁ = ' + fx(n21, 4), xr, 3.6, { cor: 'suave', tam: 11.5, alin: 'esq', negrito: true });
      var Q = C.Q(L.E1, L.E2, L.G12, n12);
      g.txt('Q₁₁ = ' + fx(Q.Q11, 1) + ' GPa', xr, 2.95, { cor: 's1', tam: 12, alin: 'esq', negrito: true });
      g.txt('Q₂₂ = ' + fx(Q.Q22, 2) + ' GPa', xr, 2.45, { cor: 's3', tam: 12, alin: 'esq' });
      g.txt('Q₁₂ = ' + fx(Q.Q12, 2) + ' GPa', xr, 1.95, { cor: 's4', tam: 12, alin: 'esq' });
      g.txt('Q₆₆ = ' + fx(Q.Q66, 2) + ' GPa', xr, 1.45, { cor: 's6', tam: 12, alin: 'esq' });
      g.txt('razão ε₂/ε₁ sob a mesma σ: ' + fx(E1 / E2, 1) + '×', xr, 0.85, { cor: 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('estado plano de tensão · σ₁ e σ₂ não produzem distorção, τ₁₂ não produz alongamento (eixo do material)',
        6, -1.1, { cor: 'fraco', tam: 10 });
    }
  });

  /* ---------- 7.1 — constantes aparentes em função do ângulo ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Girar a lâmina em relação à carga derruba E_x nos primeiros graus e faz aparecer o acoplamento tração-cisalhamento, máximo perto de 45°. É por isso que a tolerância de orientação em fabricação é de poucos graus (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'th', rot: 'Ângulo da fibra θ', min: 0, max: 90, val: 30, passo: 1, un: '°' },
      { id: 'E1', rot: 'Módulo na fibra E₁', min: 30, max: 170, val: 134, passo: 2, un: 'GPa' },
      { id: 'E2', rot: 'Módulo transversal E₂', min: 3, max: 25, val: 7, passo: 0.5, un: 'GPa' }
    ],
    desenhar: function (g, p) {
      var E1 = p.E1, E2 = p.E2, G12 = 4.2, n12 = 0.25;
      var fe = function (t) { return C.foraEixo(E1, E2, G12, n12, rad(t)); };
      var q = fe(p.th), q0 = fe(0);
      var e = eixos(g, {
        x: 1.35, y: 1.0, w: 5.1, h: 4.1, xr: [0, 90], yr: [0, E1 * 1.05],
        xt: [0, 15, 30, 45, 60, 75, 90], yt: [0, E1 / 4, E1 / 2, 3 * E1 / 4, E1],
        xlab: 'ângulo da fibra θ (°)', ylab: 'módulo aparente (GPa)'
      });
      var ts = serie(0, 90, 91);
      curva(g, e, ts, function (t) { return fe(t).Ex; }, { cor: 's1', larg: 2.8 });
      curva(g, e, ts, function (t) { return fe(t).Ey; }, { cor: 's3', larg: 1.8 });
      curva(g, e, ts, function (t) { return fe(t).Gxy; }, { cor: 's4', larg: 2.2 });
      curva(g, e, ts, function (t) { return Math.abs(fe(t).etax) * E1 / 3; }, { cor: 'erro', larg: 2, tracejado: [5, 4] });
      g.txt('E_x', e.X(8), e.Y(fe(8).Ex) + 0.4, { cor: 's1', tam: 11, negrito: true, fundo: true });
      g.txt('E_y', e.X(80), e.Y(fe(80).Ey) + 0.4, { cor: 's3', tam: 11, negrito: true, fundo: true });
      g.txt('G_xy', e.X(45), e.Y(fe(45).Gxy) - 0.4, { cor: 's4', tam: 11, negrito: true, fundo: true });
      g.txt('|η_xy,x| (escala à parte)', e.X(50), e.Y(Math.abs(fe(50).etax) * E1 / 3) + 0.42,
        { cor: 'erro', tam: 10, negrito: true, fundo: true });
      g.linha(e.X(p.th), e.by, e.X(p.th), e.by + e.bh, { cor: 'fraco', larg: 1.2, tracejado: [4, 4] });
      g.circ(e.X(p.th), e.Y(q.Ex), 0.14, { preenche: 's1', cor: null });
      /* lâmina inclinada, como miniatura */
      var cx = 2.3, cy = 5.35;
      g.retGirado(cx - 0.5, cy - 0.22, 1.0, 0.44, rad(p.th), { cor: 's2', larg: 1.4, preenche: 's2', alfa: 0.3 });
      g.seta(cx - 1.25, cy, 0.5, 0, { cor: 'erro', larg: 1.4, ponta: 0.14 });
      g.seta(cx + 1.25, cy, -0.5, 0, { cor: 'erro', larg: 1.4, ponta: 0.14 });
      g.txt('θ = ' + fx(p.th, 0) + '°', cx + 1.5, cy, { cor: 's2', tam: 10.5, alin: 'esq', negrito: true });
      var xr = 7.3;
      g.txt('em θ = ' + fx(p.th, 0) + '°', xr, 5.2, { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E_x = ' + fx(q.Ex, 2) + ' GPa', xr, 4.6, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('E_y = ' + fx(q.Ey, 2) + ' GPa', xr, 4.0, { cor: 's3', tam: 12, alin: 'esq' });
      g.txt('G_xy = ' + fx(q.Gxy, 2) + ' GPa', xr, 3.5, { cor: 's4', tam: 12, alin: 'esq' });
      g.txt('ν_xy = ' + fx(q.nxy, 3), xr, 3.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('η_xy,x = ' + fx(q.etax, 3), xr, 2.45, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('perdeu ' + fx(100 * (1 - q.Ex / q0.Ex), 1) + ' % de E₁', xr, 1.85,
        { cor: q.Ex / q0.Ex < 0.5 ? 'erro' : 'aviso', tam: 12.5, alin: 'esq', negrito: true });
      var qb = C.Qbar(C.Q(E1, E2, G12, n12), rad(p.th));
      g.txt('Q̄₁₆ = ' + fx(qb.Q16, 2) + ' GPa', xr, 1.25, { cor: Math.abs(qb.Q16) > 1e-6 ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt(Math.abs(qb.Q16) > 1e-6 ? 'tracionar em x distorce a lâmina' : 'sem acoplamento neste ângulo',
        xr, 0.75, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('G₁₂ = 4,2 GPa e ν₁₂ = 0,25 fixos · η_xy,x desenhado em escala própria, só para comparar a forma',
        6, -1.1, { cor: 'fraco', tam: 10 });
    }
  });

  /* ---------- 8.1 — empilhamento, coordenadas z e as matrizes A, B, D ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'A posição z de cada camada é o que decide seu peso: em A entra proporcional à espessura, em B a z e em D a z². Espelhar a sequência anula B, e é por isso que quase todo laminado de projeto é simétrico (exemplo 8.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'nc', rot: 'Camadas na sequência', min: 1, max: 4, val: 2, passo: 1 },
      { id: 'simetrico', rot: 'Espelhar: 0 não · 1 sim', min: 0, max: 1, val: 1, passo: 1 },
      { id: 'esp', rot: 'Espessura de cada camada', min: 0.1, max: 0.5, val: 0.25, passo: 0.05, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var L = C.laminas.carbono;
      var mat = { E1: L.E1 * 1000, E2: L.E2 * 1000, G12: L.G12 * 1000, n12: L.n12 };
      var padrao = [0, 90, 45, -45];
      var base = padrao.slice(0, Math.round(p.nc));
      var sim = Math.round(p.simetrico) === 1;
      var cl = C.clt(mat, C.pilha(base, p.esp, sim));
      var n = cl.info.length, i;
      var x0 = 1.5, larg = 2.6, topo = 5.1, baixo = 0.9;
      var esc = (topo - baixo) / cl.h;
      cl.info.forEach(function (k, idx) {
        var y1 = baixo + (k.z0 + cl.h / 2) * esc, y2 = baixo + (k.z1 + cl.h / 2) * esc;
        var cor = 's' + (1 + (idx % 6));
        g.ret(x0, y1, larg, y2 - y1, { cor: cor, larg: 1.3, preenche: cor, alfa: 0.2 });
        /* riscos na direção da fibra */
        var tg = Math.tan(rad(k.th)), j;
        for (j = 0; j < 7; j++) {
          var xx = x0 + larg * (j + 0.5) / 7;
          if (Math.abs(k.th) > 80) {
            g.linha(xx, y1 + 0.02, xx, y2 - 0.02, { cor: cor, larg: 0.8 });
          } else {
            var dy = (y2 - y1) * 0.8, dx = dy * tg;
            g.linha(xx - dx / 2, y1 + 0.05, xx + dx / 2, y2 - 0.05, { cor: cor, larg: 0.8 });
          }
        }
        if (y2 - y1 > 0.3) {
          g.txt((k.th > 0 ? '+' : '') + fx(k.th, 0) + '°', x0 + larg / 2, (y1 + y2) / 2,
            { cor: 'texto', tam: 11, negrito: true, fundo: true });
        }
        g.txt('z' + idx + ' = ' + fx(k.z0, 3), x0 - 0.12, y1, { cor: 'fraco', tam: 9, alin: 'dir' });
      });
      g.txt('z' + n + ' = ' + fx(cl.info[n - 1].z1, 3), x0 - 0.12, topo, { cor: 'fraco', tam: 9, alin: 'dir' });
      g.linha(x0 - 0.45, baixo + cl.h / 2 * esc, x0 + larg + 0.45, baixo + cl.h / 2 * esc,
        { cor: 'erro', larg: 1.6, tracejado: [6, 4] });
      g.txt('plano médio z = 0', x0 + larg + 0.55, baixo + cl.h / 2 * esc, { cor: 'erro', tam: 10, alin: 'esq', negrito: true });
      g.txt(C.rotuloPilha(base, sim).replace(/<\/?sub>/g, ''), x0 + larg / 2, topo + 0.45,
        { cor: 'texto', tam: 12.5, negrito: true });
      g.txt('h = ' + fx(cl.h, 3) + ' mm · ' + n + ' camadas', x0 + larg / 2, baixo - 0.42, { cor: 'fraco', tam: 10 });
      /* barras com o peso de cada camada em A, B e D */
      var bx = 5.0, bw = 1.15;
      var somaA = 0, somaB = 0, somaD = 0;
      cl.info.forEach(function (k) {
        somaA += Math.abs(k.Qb[0][0] * (k.z1 - k.z0));
        somaB += Math.abs(k.Qb[0][0] * (k.z1 * k.z1 - k.z0 * k.z0) / 2);
        somaD += Math.abs(k.Qb[0][0] * (Math.pow(k.z1, 3) - Math.pow(k.z0, 3)) / 3);
      });
      [['A', somaA, 0], ['|B|', somaB, 1], ['D', somaD, 2]].forEach(function (col, ci) {
        var cx = bx + ci * bw;
        var ac = 0;
        cl.info.forEach(function (k, idx) {
          var v = ci === 0 ? Math.abs(k.Qb[0][0] * (k.z1 - k.z0))
            : ci === 1 ? Math.abs(k.Qb[0][0] * (k.z1 * k.z1 - k.z0 * k.z0) / 2)
              : Math.abs(k.Qb[0][0] * (Math.pow(k.z1, 3) - Math.pow(k.z0, 3)) / 3);
          var f = col[1] > 0 ? v / col[1] : 0;
          var hb = f * 3.6;
          g.ret(cx, baixo + ac, bw * 0.72, hb, { cor: 'fundo', larg: 0.8, preenche: 's' + (1 + (idx % 6)), alfa: 0.75 });
          ac += hb;
        });
        g.txt(col[0], cx + bw * 0.36, baixo - 0.42, { cor: 'suave', tam: 11.5, negrito: true });
      });
      g.txt('peso de cada camada', bx + bw * 1.5 - 0.1, baixo + 3.95, { cor: 'fraco', tam: 10 });
      g.txt('em A, em B e em D', bx + bw * 1.5 - 0.1, baixo + 3.55, { cor: 'fraco', tam: 10 });
      var maxB = 0;
      cl.B.forEach(function (l) { l.forEach(function (v) { maxB = Math.max(maxB, Math.abs(v)); }); });
      var xr = 8.75;
      g.txt('A₁₁ = ' + fx(cl.A[0][0] / 1000, 1) + ' kN/mm', xr, 5.2, { cor: 's1', tam: 12, alin: 'esq', negrito: true });
      g.txt('D₁₁ = ' + fx(cl.D[0][0], 0) + ' N·mm', xr, 4.65, { cor: 's4', tam: 12, alin: 'esq', negrito: true });
      g.txt('maior |B| = ' + fx(maxB, 1) + ' N', xr, 4.1,
        { cor: maxB > 1e-6 ? 'erro' : 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(cl.simetrico ? 'simétrico: B ≡ 0' : 'assimétrico: B ≠ 0', xr, 3.55,
        { cor: cl.simetrico ? 'ok' : 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt(cl.equilibrado ? 'equilibrado: A₁₆ = A₂₆ = 0' : 'não equilibrado: A₁₆ ≠ 0', xr, 3.0,
        { cor: cl.equilibrado ? 'ok' : 'aviso', tam: 11, alin: 'esq' });
      g.txt('E_x = ' + fx(cl.cons.Ex / 1000, 1) + ' GPa', xr, 2.4, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('E_y = ' + fx(cl.cons.Ey / 1000, 1) + ' GPa', xr, 1.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('G_xy = ' + fx(cl.cons.Gxy / 1000, 2) + ' GPa', xr, 1.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ν_xy = ' + fx(cl.cons.nxy, 3), xr, 0.9, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('carbono/epóxi · sequência tomada de [0/90/45/−45] · barras normalizadas pela soma de cada matriz',
        6, -1.1, { cor: 'fraco', tam: 10 });
    }
  });

  /* ---------- 9.1 — tensões de cura e empenamento ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Ao esfriar da cura, cada camada quer contrair muito na direção transversal e é impedida pelas vizinhas: sobra tração transversal, que já consome boa parte de Y_t. Se o laminado não for simétrico, a placa ainda sai empenada do molde (exemplo 9.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'dT', rot: 'Variação de temperatura ΔT', min: -250, max: 0, val: -150, passo: 10, un: '°C' },
      { id: 'simetrico', rot: 'Laminado: 0 [0/90] · 1 [0/90]ₛ', min: 0, max: 1, val: 1, passo: 1 },
      { id: 'dC', rot: 'Umidade absorvida', min: 0, max: 2, val: 0, passo: 0.1, un: '%' }
    ],
    desenhar: function (g, p) {
      var L = C.laminas.carbono;
      var mat = { E1: L.E1 * 1000, E2: L.E2 * 1000, G12: L.G12 * 1000, n12: L.n12 };
      var sim = Math.round(p.simetrico) === 1;
      var cl = C.clt(mat, C.pilha([0, 90], 0.25, sim));
      var t = C.termico(cl, L, p.dT, p.dC / 100);
      var sol = C.resolve6(cl.A, cl.B, cl.D, t.NT, t.MT);
      var cs = C.camadas(cl, sol.e0, sol.k, true);
      var kx = sol.k[0];
      /* placa, reta ou curvada por kx */
      var cx = 3.2, cy = 3.6, Lp = 4.6, i;
      var raio = Math.abs(kx) > 1e-7 ? 1 / kx : Infinity;
      var pts = [], ptsB = [];
      for (i = 0; i <= 40; i++) {
        var s = -Lp / 2 + Lp * i / 40;
        var w = isFinite(raio) ? -kx * s * s / 2 * 60 : 0;
        pts.push([cx + s, cy + w + 0.14]);
        ptsB.push([cx + s, cy + w - 0.14]);
      }
      g.caminho(pts, { cor: 's1', larg: 2 });
      g.caminho(ptsB, { cor: 's3', larg: 2 });
      g.caminho(pts.concat(ptsB.slice().reverse()), { cor: null, fechar: true, preenche: 's1', alfa: 0.18 });
      g.linha(cx - Lp / 2 - 0.3, cy, cx + Lp / 2 + 0.3, cy, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('camada 0°', cx + Lp / 2 + 0.4, pts[40][1], { cor: 's1', tam: 10, alin: 'esq' });
      g.txt('camada 90°', cx + Lp / 2 + 0.4, ptsB[40][1] - 0.32, { cor: 's3', tam: 10, alin: 'esq' });
      g.txt(sim ? 'laminado simétrico: sai plano' : 'laminado assimétrico: empena ao esfriar',
        cx, cy + 1.6, { cor: sim ? 'ok' : 'erro', tam: 11.5, negrito: true });
      g.txt('ΔT = ' + fx(p.dT, 0) + ' °C (molde → uso)', cx, cy + 2.05, { cor: 'fraco', tam: 10.5 });
      /* barras de σ₂ por camada */
      var bx = 1.1, by = 0.9, bw = 5.4, nC = cs.length;
      var s2max = 0;
      cs.forEach(function (q) { s2max = Math.max(s2max, Math.abs(q.s12[1])); });
      s2max = Math.max(s2max, L.Yt) * 1.15;
      var e = eixos(g, {
        x: bx, y: by, w: bw, h: 1.5, xr: [-s2max, s2max], yr: [0, nC],
        xt: [-s2max, -L.Yt, 0, L.Yt, s2max], yt: [], xd: 0,
        xlab: 'σ₂ residual em cada camada (MPa)'
      });
      cs.forEach(function (q, idx) {
        var v = q.s12[1];
        var y = by + 1.5 * (idx + 0.5) / nC;
        var alt = 1.5 / nC * 0.55;
        g.ret(e.X(Math.min(0, v)), y - alt / 2, Math.abs(e.X(v) - e.X(0)), alt,
          { cor: 'fundo', larg: 0.8, preenche: Math.abs(v) > L.Yt ? 'erro' : 'ok', alfa: 0.75 });
        g.txt((q.th > 0 ? '+' : '') + fx(q.th, 0) + '°', bx - 0.15, y, { cor: 'suave', tam: 9.5, alin: 'dir' });
      });
      g.linha(e.X(L.Yt), by, e.X(L.Yt), by + 1.5, { cor: 'erro', larg: 1.4, tracejado: [4, 3] });
      g.txt('Y_t', e.X(L.Yt), by + 1.7, { cor: 'erro', tam: 10, negrito: true });
      g.linha(e.X(0), by, e.X(0), by + 1.5, { cor: 'fraco', larg: 1 });
      var s2 = cs[0].s12[1];
      var xr = 8.0;
      g.txt('N^T_x = ' + fx(t.NT[0], 2) + ' N/mm', xr, 5.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('M^T_x = ' + fx(t.MT[0], 3) + ' N·mm/mm', xr, 4.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('α_x do laminado', xr, 4.1, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt(p.dT !== 0 ? (sol.e0[0] / p.dT * 1e6).toFixed(2).replace('.', ',') + '×10⁻⁶/°C' : '—',
        xr, 3.6, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('(alumínio: 23×10⁻⁶)', xr, 3.15, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('σ₂ residual = ' + fx(s2, 1) + ' MPa', xr, 2.5, { cor: Math.abs(s2) > L.Yt ? 'erro' : 'aviso', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('consome ' + fx(100 * Math.abs(s2) / L.Yt, 0) + ' % de Y_t = ' + fx(L.Yt, 0) + ' MPa',
        xr, 1.95, { cor: Math.abs(s2) > 0.6 * L.Yt ? 'erro' : 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(isFinite(raio) && Math.abs(raio) < 1e5 ? 'raio de curvatura ' + fx(Math.abs(raio), 0) + ' mm' : 'placa plana',
        xr, 1.35, { cor: isFinite(raio) && Math.abs(raio) < 1e5 ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt(p.dC > 0 ? 'umidade alivia: β₂Δc = +' + fx(L.b2 * p.dC / 100 * 100, 3) + ' %' : 'sem umidade absorvida',
        xr, 0.8, { cor: p.dC > 0 ? 'ok' : 'fraco', tam: 11, alin: 'esq' });
      g.txt('carbono/epóxi, camadas de 0,25 mm · α₁ = −0,3×10⁻⁶ e α₂ = 28×10⁻⁶/°C · β₂ = 0,44 · curvatura em escala exagerada',
        6, -1.1, { cor: 'fraco', tam: 9.5 });
    }
  });

  /* ---------- 10.1 — envelopes de falha ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'O retângulo da tensão máxima e as elipses de Tsai-Hill e Tsai-Wu. Nos quadrantes mistos eles discordam — e é justamente ali que a decisão de projeto deixa de ser detalhe (exemplo 10.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 's1', rot: 'σ₁ aplicado', min: -1200, max: 1200, val: 600, passo: 20, un: 'MPa' },
      { id: 's2', rot: 'σ₂ aplicado', min: -150, max: 60, val: 20, passo: 2, un: 'MPa' },
      { id: 't12', rot: 'τ₁₂ aplicado', min: 0, max: 62, val: 20, passo: 1, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var L = C.laminas.carbono, R = L, f12 = -0.5;
      var cr = C.criterios([p.s1, p.s2, p.t12], R, f12);
      var e = eixos(g, {
        x: 1.6, y: 2.1, w: 5.0, h: 3.1, xr: [-R.Xc * 1.2, R.Xt * 1.2], yr: [-R.Yc * 1.25, R.Yt * 1.6],
        xt: [-1000, -500, 0, 500, 1000], yt: [-150, -100, -50, 0, 50], xd: 0,
        xlab: 'σ₁ (MPa)', ylab: 'σ₂ (MPa)'
      });
      /* eixos pelo zero */
      g.linha(e.bx, e.Y(0), e.bx + e.bw, e.Y(0), { cor: 'fraco', larg: 1, tracejado: [2, 3] });
      g.linha(e.X(0), e.by, e.X(0), e.by + e.bh, { cor: 'fraco', larg: 1, tracejado: [2, 3] });
      var F1 = 1 / R.Xt - 1 / R.Xc, F2 = 1 / R.Yt - 1 / R.Yc;
      var F11 = 1 / (R.Xt * R.Xc), F22 = 1 / (R.Yt * R.Yc), F66 = 1 / (R.S * R.S);
      var F12 = f12 * Math.sqrt(F11 * F22);
      var cT = (p.t12 / R.S) * (p.t12 / R.S);
      function env(qual) {
        var pts = [], i;
        for (i = 0; i <= 240; i++) {
          var ph = i / 240 * 2 * Math.PI;
          var d1 = Math.cos(ph) * R.Xt, d2 = Math.sin(ph) * R.Yt;
          var X = d1 >= 0 ? R.Xt : R.Xc, Y = d2 >= 0 ? R.Yt : R.Yc, t = 0;
          if (qual === 'max') {
            var m = Math.max(Math.abs(d1) / X, Math.abs(d2) / Y);
            t = (m > 0 && cT < 1) ? 1 / m : 0;
          } else if (qual === 'hill') {
            var qd = (d1 / X) * (d1 / X) - d1 * d2 / (X * X) + (d2 / Y) * (d2 / Y);
            t = (qd > 0 && cT < 1) ? Math.sqrt((1 - cT) / qd) : 0;
          } else {
            var a = F11 * d1 * d1 + F22 * d2 * d2 + 2 * F12 * d1 * d2;
            var b = F1 * d1 + F2 * d2, c0 = F66 * p.t12 * p.t12 - 1;
            var disc = b * b - 4 * a * c0;
            t = (a > 1e-30 && disc >= 0) ? (-b + Math.sqrt(disc)) / (2 * a) : 0;
          }
          pts.push([e.X(t * d1), e.Y(t * d2)]);
        }
        pts.push(pts[0]);
        return pts;
      }
      g.caminho(env('max'), { cor: 's1', larg: 2.2 });
      g.caminho(env('hill'), { cor: 's3', larg: 2.2 });
      g.caminho(env('wu'), { cor: 's4', larg: 2.2, tracejado: [6, 4] });
      g.circ(e.X(p.s1), e.Y(p.s2), 0.15, { preenche: cr.fsMax >= 1 ? 'ok' : 'erro', cor: null });
      g.linha(e.X(0), e.Y(0), e.X(p.s1 * cr.fsHill), e.Y(p.s2 * cr.fsHill), { cor: 's3', larg: 1, tracejado: [3, 3] });
      g.txt('tensão máxima', e.bx + 0.12, e.by + e.bh - 0.22, { cor: 's1', tam: 10, alin: 'esq', negrito: true, fundo: true });
      g.txt('Tsai-Hill', e.bx + 0.12, e.by + e.bh - 0.62, { cor: 's3', tam: 10, alin: 'esq', negrito: true, fundo: true });
      g.txt('Tsai-Wu', e.bx + 0.12, e.by + e.bh - 1.02, { cor: 's4', tam: 10, alin: 'esq', negrito: true, fundo: true });
      g.txt('τ₁₂ = ' + fx(p.t12, 0) + ' MPa consome ' + fx(100 * cr.r6, 0) + ' % de S',
        e.bx + e.bw / 2, e.by + e.bh + 0.42, { cor: 'acento', tam: 10.5, negrito: true });
      var xr = 7.6;
      g.txt('σ₁/X = ' + fx(cr.r1, 3) + ' · σ₂/Y = ' + fx(cr.r2, 3), xr, 5.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('τ₁₂/S = ' + fx(cr.r6, 3), xr, 4.75, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('FS tensão máxima = ' + fx(cr.fsMax, 3), xr, 4.15, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('modo: ' + cr.modo, xr, 3.7, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('IH = ' + fx(cr.ih, 3), xr, 3.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('FS Tsai-Hill = ' + fx(cr.fsHill, 3), xr, 2.6, { cor: 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('FS Tsai-Wu = ' + fx(cr.fsWu, 3), xr, 2.05, { cor: 's4', tam: 12.5, alin: 'esq', negrito: true });
      var fss = [cr.fsMax, cr.fsHill, cr.fsWu];
      var disp = Math.max.apply(null, fss) / Math.max(Math.min.apply(null, fss), 1e-9) - 1;
      g.txt('discrepância ' + fx(100 * disp, 0) + ' %', xr, 1.45,
        { cor: disp > 0.25 ? 'aviso' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt(Math.min.apply(null, fss) < 1 ? 'a lâmina rompe' : 'a lâmina resiste', xr, 0.9,
        { cor: Math.min.apply(null, fss) < 1 ? 'erro' : 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt('carbono/epóxi: X_t = 1270, X_c = 1130, Y_t = 42, Y_c = 141, S = 63 MPa · F₁₂* = −0,5',
        6, -1.1, { cor: 'fraco', tam: 10 });
    }
  });

  /* ---------- 11.1 — falha progressiva: o joelho da curva ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'A curva do laminado cruzado tem um joelho: as camadas transversais trincam, a rigidez cai um pouco e as fibras longitudinais seguem carregando até a ruptura final. Entre FPF e LPF há reserva que vale massa (exemplo 11.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'n90', rot: 'Camadas a 90° no núcleo', min: 1, max: 4, val: 2, passo: 1 },
      { id: 'dT', rot: 'Variação de temperatura ΔT', min: -200, max: 0, val: 0, passo: 10, un: '°C' },
      { id: 'fator', rot: 'Degradação de E₂ após trincar', min: 0.05, max: 1, val: 0.1, passo: 0.05, un: '' }
    ],
    desenhar: function (g, p) {
      var L = C.laminas.carbono;
      var mat = { E1: L.E1 * 1000, E2: L.E2 * 1000, G12: L.G12 * 1000, n12: L.n12 };
      var t0 = 0.25, n90 = Math.round(p.n90), i;
      /* [0 / 90_n]_S  →  0, 90×n, 90×n, 0 */
      var angs = [0];
      for (i = 0; i < n90; i++) angs.push(90);
      var cam = C.pilha(angs, t0, true);
      var cl = C.clt(mat, cam);
      /* laminado degradado: 90° com E2 e G12 cortados */
      var Qd = C.Q(mat.E1, mat.E2 * p.fator, mat.G12 * p.fator, mat.n12 * p.fator);
      var Qi = cl.Q;
      var h = cl.h, z = -h / 2;
      var A2 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      cam.forEach(function (c) {
        var z0 = z, z1 = z + c.t;
        var Qb = C.toM(C.Qbar(Math.abs(c.th - 90) < 1e-6 ? Qd : Qi, rad(c.th)));
        var a, b;
        for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) A2[a][b] += Qb[a][b] * (z1 - z0);
        z = z1;
      });
      var a1 = C.inv3(cl.A), a2 = C.inv3(A2);
      var Ex1 = 1 / (a1[0][0] * h), Ex2 = 1 / (a2[0][0] * h);
      /* térmico */
      var tt = C.termico(cl, L, p.dT, 0);
      /* FPF: Nx que leva alguma camada 90° a σ2 = Yt */
      function s2por(Nx, Amat, usarT) {
        var sol = C.resolve6(Amat === cl.A ? cl.A : A2, cl.B, cl.D,
          [Nx + (usarT ? tt.NT[0] : 0), (usarT ? tt.NT[1] : 0), 0], [0, 0, 0]);
        var cs = C.camadas(cl, sol.e0, sol.k, usarT);
        var m = 0;
        cs.forEach(function (q) { if (Math.abs(q.th - 90) < 1e-6) m = Math.max(m, q.s12[1]); });
        return { s2: m, e: sol.e0[0] };
      }
      var e00 = s2por(0, cl.A, true);
      var s2cura = e00.s2;
      /* linear em Nx: usa a derivada */
      var ref = s2por(1000, cl.A, true);
      var slope = (ref.s2 - s2cura) / 1000;
      var NxFPF = slope > 1e-12 ? (L.Yt - s2cura) / slope : Infinity;
      if (!(NxFPF > 0)) NxFPF = 0;
      var eFPF = (s2por(NxFPF, cl.A, true).e - e00.e);
      /* LPF: σ1 na camada 0° chega a Xt, com A degradado */
      var solD = C.resolve6(A2, cl.B, cl.D, [1, 0, 0], [0, 0, 0]);
      var s1por1 = C.mul(C.toM(C.Qbar(Qi, 0)), solD.e0)[0];
      var NxLPF = s1por1 > 1e-12 ? L.Xt / s1por1 : Infinity;
      if (NxLPF < NxFPF) NxLPF = NxFPF;
      var eLPF = eFPF + (NxLPF - NxFPF) * a2[0][0];
      var sFPF = NxFPF / h, sLPF = NxLPF / h;
      var e = eixos(g, {
        x: 1.35, y: 1.0, w: 5.1, h: 4.1, xr: [0, Math.max(eLPF * 100 * 1.12, 0.1)], yr: [0, Math.max(sLPF * 1.12, 50)],
        xt: [0, eLPF * 100 / 3, 2 * eLPF * 100 / 3, eLPF * 100 * 1.12], yt: [0, sLPF / 3, 2 * sLPF / 3, sLPF],
        xd: 2, yd: 0, xlab: 'deformação ε_x (%)', ylab: 'tensão média N_x/h (MPa)'
      });
      /* bilinear */
      g.caminho([[e.X(0), e.Y(0)], [e.X(eFPF * 100), e.Y(sFPF)], [e.X(eLPF * 100), e.Y(sLPF)]],
        { cor: 's1', larg: 2.8 });
      /* elástico sem degradar */
      g.linha(e.X(0), e.Y(0), e.X(eFPF * 100 * sLPF / Math.max(sFPF, 1e-9)), e.Y(sLPF),
        { cor: 's3', larg: 1.6, tracejado: [6, 4] });
      g.circ(e.X(eFPF * 100), e.Y(sFPF), 0.15, { preenche: 'aviso', cor: null });
      g.circ(e.X(eLPF * 100), e.Y(sLPF), 0.15, { preenche: 'erro', cor: null });
      g.txt('FPF', e.X(eFPF * 100) + 0.2, e.Y(sFPF) - 0.3, { cor: 'aviso', tam: 11, alin: 'esq', negrito: true, fundo: true });
      g.txt('LPF', e.X(eLPF * 100) - 0.2, e.Y(sLPF) - 0.35, { cor: 'erro', tam: 11, alin: 'esq', negrito: true, fundo: true });
      g.txt('sem degradar', e.bx + e.bw - 0.15, e.by + e.bh - 0.3, { cor: 's3', tam: 10, alin: 'dir', negrito: true, fundo: true });
      /* miniatura do empilhamento */
      var sx = 1.9, sy = 5.1, sw = 1.0;
      var zz = 0;
      cam.forEach(function (c, idx) {
        var noventa = Math.abs(c.th - 90) < 1e-6;
        g.ret(sx, sy - zz - 0.17, sw, 0.16, { cor: noventa ? 's3' : 's1', larg: 0.8, preenche: noventa ? 's3' : 's1', alfa: 0.45 });
        zz += 0.17;
      });
      g.txt('[0/90' + (n90 > 1 ? '_' + n90 : '') + ']ₛ', sx + sw + 0.2, sy - zz / 2, { cor: 'texto', tam: 11, alin: 'esq', negrito: true });
      var xr = 7.4;
      g.txt('h = ' + fx(h, 2) + ' mm · ' + cam.length + ' camadas', xr, 5.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(p.dT < 0 ? 'σ₂ de cura = ' + fx(s2cura, 1) + ' MPa' : 'sem tensão de cura', xr, 4.7,
        { cor: p.dT < 0 ? 'aviso' : 'fraco', tam: 11, alin: 'esq' });
      g.txt('primeira ruptura (FPF)', xr, 4.1, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt(fx(sFPF, 0) + ' MPa', xr, 3.55, { cor: 'aviso', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('N_x = ' + fx(NxFPF, 0) + ' N/mm · camada 90°', xr, 3.1, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('ruptura final (LPF)', xr, 2.5, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt(fx(sLPF, 0) + ' MPa', xr, 1.95, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('reserva de ' + fx(100 * (sLPF / Math.max(sFPF, 1e-9) - 1), 0) + ' % após o joelho', xr, 1.45,
        { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('E_x: ' + fx(Ex1 / 1000, 1) + ' → ' + fx(Ex2 / 1000, 1) + ' GPa', xr, 0.9,
        { cor: 'texto', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('carbono/epóxi, camadas de 0,25 mm · método da degradação com fator ' + fx(p.fator, 2) + ' em E₂, G₁₂ e ν₁₂',
        6, -1.1, { cor: 'fraco', tam: 10 });
    }
  });

})();

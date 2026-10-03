/* ============================================================
   Figuras ilustrativas de Ciência dos Materiais I
   Tudo o que aparece é calculado: empacotamento, vacâncias por Arrhenius,
   perfil de cementação pela função erro, alavanca no diagrama e Hall-Petch.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var expo = function (v, n) {
    if (v === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(v)));
    return fx(v / Math.pow(10, e), n == null ? 2 : n) + ' × 10' + sup(e);
  };
  function sup(e) {
    var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(e).split('').map(function (c) { return m[c] || c; }).join('');
  }
  /* função erro, aproximação de Abramowitz-Stegun (7 dígitos) */
  function erf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }

  /* ================= capítulo 1 ================= */

  /* 1.1 — as três estruturas */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'As três estruturas e o que muda entre elas: átomos por célula, número de coordenação, relação entre o parâmetro de rede e o raio atômico, e o fator de empacotamento.',
    vista: [-0.6, 12.6, -2.8, 6.4],
    altura: 350,
    controles: [{ id: 'est', rot: 'Estrutura (1 CCC · 2 CFC · 3 HC)', min: 1, max: 3, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var est = p.est;
      var dados = {
        1: { n: 'Cúbica de corpo centrado (CCC)', at: 2, coord: 8, rel: 'a = 4R/√3', fec: 0.68, ex: 'Fe α, Cr, Mo, W' },
        2: { n: 'Cúbica de faces centradas (CFC)', at: 4, coord: 12, rel: 'a = 2R√2', fec: 0.74, ex: 'Fe γ, Al, Cu, Ni, aço inox austenítico' },
        3: { n: 'Hexagonal compacta (HC)', at: 6, coord: 12, rel: 'c/a = 1,633', fec: 0.74, ex: 'Mg, Zn, Ti α, Co' }
      }[est];
      var cx = 3.2, cy = 2.4, L = 2.4, dx = 1.0, dy = 0.75;   /* cubo em perspectiva */
      function P(x, y, z) { return [cx + x * L + z * dx, cy + y * L + z * dy]; }
      function aresta(a, b) { g.caminho([a, b], { cor: 'borda', larg: 1.6 }); }
      if (est !== 3) {
        var v = [];
        [0, 1].forEach(function (z) { [0, 1].forEach(function (y) { [0, 1].forEach(function (x) { v.push(P(x, y, z)); }); }); });
        /* 12 arestas */
        [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { aresta(v[e[0]], v[e[1]]); });
        var r = 0.34;
        v.forEach(function (q) { g.circ(q[0], q[1], r, { preenche: 's1', cor: 'forte', larg: 1, alfa: 0.75 }); });
        if (est === 1) {
          var c = P(0.5, 0.5, 0.5);
          g.circ(c[0], c[1], r, { preenche: 's2', cor: 'forte', larg: 1.2, alfa: 0.95 });
          g.txt('átomo central', c[0], c[1] - 0.75, { cor: 's2', tam: 11, fundo: true });
        } else {
          [[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]].forEach(function (f) {
            var q = P(f[0], f[1], f[2]);
            g.circ(q[0], q[1], r, { preenche: 's2', cor: 'forte', larg: 1.2, alfa: 0.95 });
          });
          g.txt('átomos nas faces', cx + 1.2, cy - 0.9, { cor: 's2', tam: 11, fundo: true });
        }
        g.cota(P(0, 0, 0)[0], P(0, 0, 0)[1] - 0.75, P(1, 0, 0)[0], P(1, 0, 0)[1] - 0.75, 'a', { dy: -0.25 });
      } else {
        /* prisma hexagonal simplificado */
        var i, pts = [], ptsT = [];
        for (i = 0; i < 6; i++) {
          var a = Math.PI / 3 * i;
          pts.push([cx + 1.5 * Math.cos(a), cy - 0.6 + 0.62 * Math.sin(a)]);
          ptsT.push([cx + 1.5 * Math.cos(a), cy + 1.9 + 0.62 * Math.sin(a)]);
        }
        g.caminho(pts, { cor: 'borda', larg: 1.6, fechar: true });
        g.caminho(ptsT, { cor: 'borda', larg: 1.6, fechar: true });
        for (i = 0; i < 6; i++) g.caminho([pts[i], ptsT[i]], { cor: 'borda', larg: 1.2 });
        pts.concat(ptsT).forEach(function (q) { g.circ(q[0], q[1], 0.3, { preenche: 's1', cor: 'forte', larg: 1, alfa: 0.75 }); });
        g.circ(cx, cy - 0.6, 0.3, { preenche: 's1', cor: 'forte', larg: 1, alfa: 0.75 });
        g.circ(cx, cy + 1.9, 0.3, { preenche: 's1', cor: 'forte', larg: 1, alfa: 0.75 });
        for (i = 0; i < 3; i++) {
          var b = Math.PI / 3 * (2 * i) + Math.PI / 3;
          g.circ(cx + 0.87 * Math.cos(b), cy + 0.65 + 0.36 * Math.sin(b), 0.3, { preenche: 's2', cor: 'forte', larg: 1.2, alfa: 0.95 });
        }
        g.txt('camada intermediária', cx, cy + 2.9, { cor: 's2', tam: 11 });
      }
      var x0 = 7.0;
      g.txt(dados.n, x0, 5.6, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('átomos por célula: ' + dados.at, x0, 4.7, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('número de coordenação: ' + dados.coord, x0, 4.05, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('relação com o raio: ' + dados.rel, x0, 3.4, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('fator de empacotamento: ' + fx(dados.fec, 2), x0, 2.6, { cor: 's3', tam: 13.5, alin: 'esq', negrito: true });
      g.ret(x0, 1.6, 4.4 * dados.fec, 0.5, { preenche: 's3', cor: null, alfa: 0.75 });
      g.ret(x0, 1.6, 4.4, 0.5, { cor: 'borda', larg: 1.2 });
      g.txt('exemplos: ' + dados.ex, x0, 0.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o espaço vazio (' + fx(100 * (1 - dados.fec), 0) + ' %) é onde se alojam os átomos intersticiais', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 1.2 — interstícios */
  F('#fig-1-2', {
    titulo: 'Figura 1.2',
    legenda: 'O interstício octaédrico do CFC (0,414R) é quase três vezes maior que o do CCC (0,155R). É por isso que o ferro γ dissolve 2,11 %C e o ferro α quase nada.',
    vista: [-0.6, 12.6, -3.0, 6.0],
    altura: 350,
    controles: [{ id: 'rs', rot: 'Raio do átomo intersticial', min: 20, max: 110, val: 71, passo: 1, un: 'pm' }],
    desenhar: function (g, p) {
      var rs = p.rs / 1000;                 /* nm */
      var casos = [
        { n: 'CFC (ferro γ)', R: 0.127, f: 0.414, x: 2.9, cor: 's3' },
        { n: 'CCC (ferro α)', R: 0.124, f: 0.155, x: 9.0, cor: 's2' }
      ];
      casos.forEach(function (c) {
        var ri = c.f * c.R;
        var esc = 4.6;                       /* nm -> unidades */
        var cy = 3.0;
        /* quatro átomos em volta do vazio octaédrico, em corte */
        var d = c.R * esc;
        [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (u) {
          g.circ(c.x + u[0] * (d + ri * esc), cy + u[1] * (d + ri * esc), d, { preenche: c.cor, cor: 'forte', larg: 1, alfa: 0.35 });
        });
        g.circ(c.x, cy, ri * esc, { cor: 'fraco', larg: 1.4, tracejado: true });
        var cabe = rs <= ri;
        g.circ(c.x, cy, rs * esc, { preenche: cabe ? 'ok' : 'erro', cor: null, alfa: 0.85 });
        g.txt(c.n, c.x, 5.6, { cor: 'texto', tam: 12.5, negrito: true });
        g.txt('vazio: ' + fx(c.f, 3) + 'R = ' + fx(ri * 1000, 1) + ' pm', c.x, -0.6, { cor: 'suave', tam: 11.5 });
        g.txt(cabe ? 'cabe sem distorcer' : 'força a rede: distorção', c.x, -1.3,
          { cor: cabe ? 'ok' : 'erro', tam: 12, negrito: true });
        g.txt('distorção ' + fx(100 * Math.max(0, rs / ri - 1), 0) + ' %', c.x, -1.95, { cor: 'fraco', tam: 11 });
      });
      g.txt('carbono: 71 pm · nitrogênio: 65 pm · hidrogênio: 46 pm', 6, -2.7, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 2 ================= */

  /* 2.1 — vacâncias e temperatura */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A concentração de vacâncias cresce exponencialmente com a temperatura: Nv/N = e^(−Qv/kT). Perto da fusão há uma vacância a cada poucos milhares de átomos; à temperatura ambiente, praticamente nenhuma.',
    vista: [-0.6, 12.6, -2.6, 6.4],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura', min: 300, max: 1800, val: 1200, passo: 25, un: 'K' },
      { id: 'Q', rot: 'Energia de formação Qv', min: 0.5, max: 1.5, val: 0.9, passo: 0.05, un: 'eV' }
    ],
    desenhar: function (g, p) {
      var k = 8.62e-5, T = p.T, Q = p.Q;
      var frac = Math.exp(-Q / (k * T));
      /* rede com vacâncias: proporção visual ampliada para caber na tela */
      var nx = 12, ny = 7, ox = 0.8, oy = 0.6, passo = 0.52;
      var visiveis = Math.min(nx * ny - 1, Math.max(0, Math.round(frac * 2.2e4)));
      var semente = 7, lista = [];
      for (var i = 0; i < visiveis; i++) {
        semente = (semente * 9301 + 49297) % 233280;
        lista.push(Math.floor(semente / 233280 * nx * ny));
      }
      for (var yy = 0; yy < ny; yy++) {
        for (var xx = 0; xx < nx; xx++) {
          var idx = yy * nx + xx;
          var vazio = lista.indexOf(idx) >= 0;
          var X = ox + xx * passo, Y = oy + yy * passo;
          if (vazio) g.circ(X, Y, 0.2, { cor: 'erro', larg: 1.4, tracejado: [3, 3] });
          else g.circ(X, Y, 0.21, { preenche: 's1', cor: null, alfa: 0.75 });
        }
      }
      g.txt('rede com ' + visiveis + ' vacância' + (visiveis === 1 ? '' : 's') + ' em ' + (nx * ny) + ' posições (proporção ampliada)',
        3.9, -0.4, { cor: 'fraco', tam: 11 });
      /* curva Nv/N × T */
      var gx = 7.4, gy = 0.6, gw = 4.6, gh = 4.6;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1 });
      var pts = [], i2;
      for (i2 = 0; i2 <= 60; i2++) {
        var TT = 300 + 1500 * i2 / 60;
        var f = Math.exp(-Q / (k * TT));
        var yv = (Math.log10(f) + 20) / 20;         /* escala log de 1e-20 a 1 */
        pts.push([gx + gw * (TT - 300) / 1500, gy + gh * Math.max(0, yv)]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.2 });
      var yv2 = (Math.log10(frac) + 20) / 20;
      g.circ(gx + gw * (T - 300) / 1500, gy + gh * Math.max(0, yv2), 0.16, { preenche: 'erro', cor: null });
      g.txt('T (K)', gx + gw / 2, gy - 0.45, { cor: 'fraco', tam: 11 });
      g.txt('Nv/N (log)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('T = ' + T + ' K', gx, 6.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Nv/N = ' + expo(frac, 2), gx, 5.4, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('1 vacância a cada ' + expo(1 / frac, 1) + ' átomos', gx, 4.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('é por essas vacâncias que a difusão substitucional acontece (capítulo 3)', 6, -2.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.2 — discordância em cunha */
  F('#fig-2-2', {
    titulo: 'Figura 2.2',
    legenda: 'A discordância move uma linha de ligações por vez, como a ruga de um tapete: é por isso que o metal escoa com tensão centenas de vezes menor que a prevista para romper todos os planos de uma vez.',
    vista: [-0.6, 12.6, -2.4, 5.6],
    altura: 350,
    animar: true,
    controles: [{ id: 'tau', rot: 'Tensão aplicada', min: 0, max: 100, val: 60, passo: 5, un: '%' }],
    desenhar: function (g, p, t) {
      var nx = 13, ny = 6, ox = 1.0, oy = 0.9, passo = 0.78;
      var v = p.tau / 100;
      var pos = 2 + ((t * v * 1.6) % (nx - 4));
      var i, j;
      for (j = 0; j < ny; j++) {
        for (i = 0; i < nx; i++) {
          var X = ox + i * passo, Y = oy + j * passo;
          var meio = j >= ny / 2;
          if (meio) {
            /* metade de cima: um semiplano extra desloca os átomos */
            var d = (i - pos);
            X += 0.26 * Math.tanh(-d * 0.8);
            if (i === nx - 1) continue;
          }
          g.circ(X, Y, 0.2, { preenche: meio ? 's1' : 's3', cor: null, alfa: 0.8 });
        }
      }
      /* semiplano extra em destaque */
      var px = ox + pos * passo;
      g.linha(px, oy + (ny / 2) * passo - 0.3, px, oy + (ny - 1) * passo + 0.35, { cor: 'erro', larg: 2.4 });
      g.txt('⊥', px, oy + (ny / 2) * passo - 0.75, { cor: 'erro', tam: 16, negrito: true });
      g.txt('semiplano extra', px, oy + ny * passo + 0.1, { cor: 'erro', tam: 11.5, fundo: true });
      g.linha(ox - 0.4, oy + (ny / 2) * passo - 0.39, ox + nx * passo, oy + (ny / 2) * passo - 0.39,
        { cor: 'fraco', larg: 1, tracejado: [5, 4] });
      g.txt('plano de escorregamento', ox + nx * passo * 0.5, oy + (ny / 2) * passo - 0.78, { cor: 'fraco', tam: 10.5, fundo: true });
      if (v > 0.01) {
        g.seta(ox - 0.9, oy + (ny - 1) * passo, 1.2, 0, { cor: 's2', larg: 2.2, rot: 'τ', rotTam: 12, rotDy: 0.42, rotDx: 0 });
        g.seta(ox + nx * passo + 0.9, oy, -1.2, 0, { cor: 's2', larg: 2.2, rot: 'τ', rotTam: 12, rotDy: -0.45, rotDx: 0 });
      }
      g.txt(v > 0.01 ? 'a discordância avança: deformação plástica' : 'sem tensão, a discordância fica parada',
        6, -1.1, { cor: v > 0.01 ? 'texto' : 'suave', tam: 12.5, negrito: true });
      g.txt('quando ela chega à superfície, deixa um degrau de um vetor de Burgers', 6, -1.8, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 3 ================= */

  /* 3.1 — perfil de cementação */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Perfil de carbono na cementação, pela segunda lei de Fick. A profundidade cresce com √(Dt): para dobrar a camada é preciso quadruplicar o tempo (exemplo 3.1).',
    vista: [-0.6, 12.6, -2.8, 6.2],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura', min: 850, max: 1050, val: 950, passo: 10, un: '°C' },
      { id: 'h', rot: 'Tempo', min: 0.5, max: 12, val: 2, passo: 0.5, un: 'h' }
    ],
    desenhar: function (g, p) {
      var D0 = 2.3e-5, Q = 148000, R = 8.314;
      var T = p.T + 273.15, tseg = p.h * 3600;
      var D = D0 * Math.exp(-Q / (R * T));
      var Cs = 1.2, C0 = 0.2, alvo = 0.4;
      var zalvo = 0.9062;                     /* erf(z) = 0,8 */
      var xalvo = 2 * zalvo * Math.sqrt(D * tseg) * 1000;   /* mm */
      var gx = 1.4, gy = 0.8, gw = 6.2, gh = 4.4;
      var xmax = 2.0;                         /* mm no eixo */
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 80; i++) {
        var x = xmax * i / 80;
        var C = Cs - (Cs - C0) * erf(x / 1000 / (2 * Math.sqrt(D * tseg)));
        pts.push([gx + gw * x / xmax, gy + gh * (C - 0) / 1.4]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.4 });
      g.caminho(pts.concat([[gx + gw, gy], [gx, gy]]), { cor: null, preenche: 's2', alfa: 0.12, fechar: true });
      /* linhas de referência */
      g.linha(gx, gy + gh * alvo / 1.4, gx + gw, gy + gh * alvo / 1.4, { cor: 'ok', larg: 1.2, tracejado: true });
      g.txt('0,40 %C', gx + gw + 0.15, gy + gh * alvo / 1.4, { cor: 'ok', tam: 11, alin: 'esq' });
      g.linha(gx, gy + gh * C0 / 1.4, gx + gw, gy + gh * C0 / 1.4, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('núcleo 0,20 %C', gx + gw - 0.15, gy + gh * C0 / 1.4 - 0.4, { cor: 'fraco', tam: 10.5, alin: 'dir' });
      if (xalvo < xmax) {
        g.linha(gx + gw * xalvo / xmax, gy, gx + gw * xalvo / xmax, gy + gh * alvo / 1.4, { cor: 'ok', larg: 1.2, tracejado: true });
        g.circ(gx + gw * xalvo / xmax, gy + gh * alvo / 1.4, 0.14, { preenche: 'ok', cor: null });
      }
      for (i = 0; i <= 4; i++) {
        g.linha(gx + gw * i / 4, gy, gx + gw * i / 4, gy - 0.16, { cor: 'fraco', larg: 1 });
        g.txt(fx(xmax * i / 4, 1), gx + gw * i / 4, gy - 0.45, { cor: 'fraco', tam: 10.5 });
      }
      g.txt('profundidade (mm)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('%C', gx - 0.45, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('superfície mantida a 1,20 %C', gx + 0.2, gy + gh + 0.45, { cor: 'suave', tam: 11, alin: 'esq' });
      var x0 = 8.9;
      g.txt('D = ' + expo(D, 2) + ' m²/s', x0, 4.9, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('camada efetiva (0,40 %C)', x0, 4.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(xalvo, 2) + ' mm', x0, 3.3, { cor: 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt('√(Dt) = ' + expo(Math.sqrt(D * tseg) * 1000, 2) + ' mm', x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('dobrar o tempo aumenta', x0, 1.6, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a camada só √2 = 1,41×', x0, 1.05, { cor: 'fraco', tam: 11, alin: 'esq' });
    }
  });

  /* 3.2 — Arrhenius */
  F('#fig-3-2', {
    titulo: 'Figura 3.2',
    legenda: 'Num gráfico de log D contra 1/T, a relação de Arrhenius vira reta, e a inclinação é a energia de ativação. O carbono (intersticial) difunde milhões de vezes mais rápido que o ferro (substitucional).',
    vista: [-0.6, 12.6, -2.6, 6.2],
    altura: 350,
    controles: [{ id: 'T', rot: 'Temperatura', min: 700, max: 1300, val: 950, passo: 10, un: '°C' }],
    desenhar: function (g, p) {
      var R = 8.314;
      var casos = [
        { n: 'C em Fe γ (intersticial)', D0: 2.3e-5, Q: 148000, cor: 's2' },
        { n: 'Fe em Fe γ (substitucional)', D0: 5.0e-5, Q: 284000, cor: 's4' }
      ];
      var gx = 1.6, gy = 0.9, gw = 6.6, gh = 4.6;
      var T1 = 700 + 273.15, T2 = 1300 + 273.15;
      var x = function (T) { return gx + gw * ((1 / T) - (1 / T2)) / ((1 / T1) - (1 / T2)); };
      var ymin = -20, ymax = -10;
      var y = function (D) { return gy + gh * (Math.log10(D) - ymin) / (ymax - ymin); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      casos.forEach(function (c, i) {
        var D1 = c.D0 * Math.exp(-c.Q / (R * T1)), D2 = c.D0 * Math.exp(-c.Q / (R * T2));
        g.caminho([[x(T1), y(D1)], [x(T2), y(D2)]], { cor: c.cor, larg: 2.4 });
        var T = p.T + 273.15, D = c.D0 * Math.exp(-c.Q / (R * T));
        g.circ(x(T), y(D), 0.16, { preenche: c.cor, cor: null });
        g.txt(c.n, 8.9, 5.2 - i * 1.5, { cor: c.cor, tam: 11.5, alin: 'esq', negrito: true });
        g.txt('Q = ' + (c.Q / 1000) + ' kJ/mol', 8.9, 4.65 - i * 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
        g.txt('D = ' + expo(D, 2) + ' m²/s', 8.9, 4.1 - i * 1.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      });
      [700, 900, 1100, 1300].forEach(function (Tc) {
        var X = x(Tc + 273.15);
        g.linha(X, gy, X, gy - 0.16, { cor: 'fraco', larg: 1 });
        g.txt(Tc + '°C', X, gy - 0.48, { cor: 'fraco', tam: 10.5 });
      });
      var Xp = x(p.T + 273.15);
      g.linha(Xp, gy, Xp, gy + gh, { cor: 'erro', larg: 1, tracejado: [4, 4] });
      g.txt('1/T →', gx + gw / 2, gy - 1.0, { cor: 'fraco', tam: 11 });
      g.txt('log D', gx - 0.4, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var rel = (2.3e-5 * Math.exp(-148000 / (R * (p.T + 273.15)))) / (5.0e-5 * Math.exp(-284000 / (R * (p.T + 273.15))));
      g.txt('a ' + p.T + ' °C o carbono difunde ' + expo(rel, 1) + ' vezes mais rápido que o ferro', 6, -2.0, { cor: 'suave', tam: 11.5 });
    }
  });

  /* ================= capítulo 4 ================= */

  /* 4.1 — Hume-Rothery */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'A primeira regra é geométrica: diferenças de raio acima de ~15 % distorcem demais a rede e limitam a solubilidade. As outras três (estrutura, eletronegatividade e valência) decidem o resto.',
    vista: [-0.6, 12.6, -2.6, 6.2],
    altura: 350,
    controles: [{ id: 'par', rot: 'Par (1 Cu-Ni · 2 Cu-Zn · 3 Cu-Ag · 4 Fe-C)', min: 1, max: 4, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var pares = {
        1: { a: 'Cu', b: 'Ni', ra: 128, rb: 125, est: 'CFC e CFC', eneg: '1,90 e 1,91', val: '+2 e +2', sol: 'ilimitada', ok: true },
        2: { a: 'Cu', b: 'Zn', ra: 128, rb: 133, est: 'CFC e HC', eneg: '1,90 e 1,65', val: '+2 e +2', sol: 'até ~35 % Zn', ok: false },
        3: { a: 'Cu', b: 'Ag', ra: 128, rb: 144, est: 'CFC e CFC', eneg: '1,90 e 1,93', val: '+2 e +1', sol: 'até ~8 % Ag', ok: false },
        4: { a: 'Fe', b: 'C', ra: 124, rb: 71, est: 'intersticial', eneg: '1,83 e 2,55', val: '—', sol: 'até 2,11 %C (γ)', ok: false }
      }[p.par];
      var dif = 100 * Math.abs(pares.rb - pares.ra) / pares.ra;
      /* rede com soluto */
      var ox = 1.0, oy = 1.0, passo = 0.72, n = 7;
      var esc = 0.0028;
      for (var j = 0; j < n; j++) {
        for (var i = 0; i < n; i++) {
          var sub = (i === 3 && j === 3) || (i === 5 && j === 1);
          var r = sub ? pares.rb * esc : pares.ra * esc;
          if (p.par === 4 && sub) {
            g.circ(ox + i * passo, oy + j * passo, pares.ra * esc, { preenche: 's1', cor: null, alfa: 0.75 });
            g.circ(ox + i * passo + passo / 2, oy + j * passo + passo / 2, pares.rb * esc, { preenche: 'erro', cor: null, alfa: 0.95 });
          } else {
            g.circ(ox + i * passo, oy + j * passo, r, { preenche: sub ? 's2' : 's1', cor: sub ? 'forte' : null, larg: 1.2, alfa: sub ? 0.95 : 0.7 });
          }
        }
      }
      g.txt(p.par === 4 ? 'solução intersticial' : 'solução substitucional', ox + 3 * passo, oy - 0.8, { cor: 'suave', tam: 11.5 });
      var x0 = 6.6;
      g.txt(pares.a + ' – ' + pares.b, x0, 5.6, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('raios: ' + pares.ra + ' e ' + pares.rb + ' pm → diferença ' + fx(dif, 1) + ' %', x0, 4.8, { cor: dif <= 15 ? 'ok' : 'erro', tam: 12, alin: 'esq' });
      g.txt('estrutura: ' + pares.est, x0, 4.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('eletronegatividade: ' + pares.eneg, x0, 3.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('valência: ' + pares.val, x0, 3.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('solubilidade: ' + pares.sol, x0, 2.1, { cor: pares.ok ? 'ok' : 'aviso', tam: 13.5, alin: 'esq', negrito: true });
      /* barra da regra dos 15 % */
      g.ret(x0, 0.9, 4.6, 0.42, { cor: 'borda', larg: 1.2 });
      g.ret(x0, 0.9, 4.6 * Math.min(1, 15 / 30), 0.42, { preenche: 'ok', cor: null, alfa: 0.25 });
      var X = x0 + 4.6 * Math.min(1, dif / 30);
      g.linha(X, 0.75, X, 1.47, { cor: 'erro', larg: 2.2 });
      g.txt('0 %', x0, 0.5, { cor: 'fraco', tam: 10 });
      g.txt('15 %', x0 + 2.3, 0.5, { cor: 'fraco', tam: 10 });
      g.txt('30 %', x0 + 4.6, 0.5, { cor: 'fraco', tam: 10 });
      g.txt('o soluto distorce a rede e trava discordâncias: é o endurecimento por solução sólida (capítulo 8)', 6, -2.0, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 5 ================= */

  /* 5.1 — regra da alavanca */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Diagrama isomorfo Cu-Ni: a linha de amarração dá as composições das duas fases, e a regra da alavanca dá as quantidades — sempre com o segmento oposto (exemplo 5.1).',
    vista: [-0.6, 12.6, -3.0, 6.4],
    altura: 350,
    controles: [
      { id: 'C', rot: 'Composição da liga', min: 5, max: 95, val: 35, passo: 1, un: '%Ni' },
      { id: 'T', rot: 'Temperatura', min: 1100, max: 1450, val: 1250, passo: 5, un: '°C' }
    ],
    desenhar: function (g, p) {
      var Tcu = 1085, Tni = 1455;
      /* liquidus e solidus aproximados do Cu-Ni */
      function Tliq(c) { return Tcu + (Tni - Tcu) * Math.pow(c / 100, 0.95); }
      function Tsol(c) { return Tcu + (Tni - Tcu) * Math.pow(c / 100, 1.55); }
      function cLiq(T) { var lo = 0, hi = 100, m; for (var i = 0; i < 50; i++) { m = (lo + hi) / 2; if (Tliq(m) < T) lo = m; else hi = m; } return m; }
      function cSol(T) { var lo = 0, hi = 100, m; for (var i = 0; i < 50; i++) { m = (lo + hi) / 2; if (Tsol(m) < T) lo = m; else hi = m; } return m; }
      var gx = 1.2, gy = 0.8, gw = 7.0, gh = 5.0;
      var X = function (c) { return gx + gw * c / 100; };
      var Y = function (T) { return gy + gh * (T - 1050) / 450; };
      var i, pl = [], ps = [];
      for (i = 0; i <= 50; i++) { var c = 100 * i / 50; pl.push([X(c), Y(Tliq(c))]); ps.push([X(c), Y(Tsol(c))]); }
      g.caminho(pl, { cor: 's1', larg: 2.2 });
      g.caminho(ps, { cor: 's3', larg: 2.2 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      for (i = 0; i <= 4; i++) {
        g.linha(X(i * 25), gy, X(i * 25), gy - 0.16, { cor: 'fraco', larg: 1 });
        g.txt((i * 25) + '', X(i * 25), gy - 0.45, { cor: 'fraco', tam: 10.5 });
      }
      [1100, 1200, 1300, 1400].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.16, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.3, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('%Ni', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('L', X(18), Y(1380), { cor: 's1', tam: 13, negrito: true });
      g.txt('α', X(78), Y(1150), { cor: 's3', tam: 13, negrito: true });
      g.txt('L + α', X(50), Y(1270), { cor: 'suave', tam: 11.5 });

      var C = p.C, T = p.T;
      var tl = Tliq(C), ts = Tsol(C);
      var estado = T > tl ? 'líquido' : (T < ts ? 'sólido (α)' : 'bifásico');
      g.linha(X(C), gy, X(C), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      g.circ(X(C), Y(T), 0.16, { preenche: 'erro', cor: null });
      var x0 = 9.0;
      g.txt(C + ' %Ni a ' + T + ' °C', x0, 5.9, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      if (estado === 'bifásico') {
        var CL = cLiq(T), Ca = cSol(T);
        var WL = (Ca - C) / (Ca - CL), Wa = 1 - WL;
        g.linha(X(CL), Y(T), X(Ca), Y(T), { cor: 'erro', larg: 2 });
        g.circ(X(CL), Y(T), 0.13, { preenche: 's1', cor: null });
        g.circ(X(Ca), Y(T), 0.13, { preenche: 's3', cor: null });
        g.txt('C_L = ' + fx(CL, 1), X(CL), Y(T) + 0.42, { cor: 's1', tam: 11, fundo: true });
        g.txt('C_α = ' + fx(Ca, 1), X(Ca), Y(T) - 0.45, { cor: 's3', tam: 11, fundo: true });
        g.txt('W_L = (C_α − C)/(C_α − C_L) = ' + fx(WL, 3), x0, 4.9, { cor: 's1', tam: 12, alin: 'esq' });
        g.txt('W_α = ' + fx(Wa, 3), x0, 4.3, { cor: 's3', tam: 12, alin: 'esq' });
        /* barra de proporção */
        g.ret(x0, 3.2, 3.2 * WL, 0.5, { preenche: 's1', cor: null, alfa: 0.8 });
        g.ret(x0 + 3.2 * WL, 3.2, 3.2 * Wa, 0.5, { preenche: 's3', cor: null, alfa: 0.8 });
        g.txt(fx(100 * WL, 0) + ' % líquido · ' + fx(100 * Wa, 0) + ' % α', x0, 2.8, { cor: 'suave', tam: 11, alin: 'esq' });
      } else {
        g.txt(estado === 'líquido' ? '100 % líquido' : '100 % sólido α', x0, 4.9, { cor: 'suave', tam: 12.5, alin: 'esq' });
        g.txt('região monofásica: nada a calcular', x0, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      }
      g.txt('liquidus ' + fx(tl, 0) + ' °C · solidus ' + fx(ts, 0) + ' °C', x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a fase cuja composição está mais perto da liga é a que aparece em maior quantidade', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 6 ================= */

  /* 6.1 — diagrama Fe-C */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'O canto do diagrama ferro-carbono que interessa aos aços. Mova o teor de carbono e a temperatura para ver as fases presentes e, na região bifásica, as frações pela regra da alavanca.',
    vista: [-0.6, 12.6, -3.0, 6.4],
    altura: 350,
    controles: [
      { id: 'C', rot: 'Teor de carbono', min: 0.05, max: 2.0, val: 0.4, passo: 0.05, un: '%C' },
      { id: 'T', rot: 'Temperatura', min: 400, max: 1200, val: 20 + 400, passo: 10, un: '°C' }
    ],
    desenhar: function (g, p) {
      var gx = 1.2, gy = 0.9, gw = 7.0, gh = 5.0;
      var Cmax = 2.2;
      var X = function (c) { return gx + gw * c / Cmax; };
      var Y = function (T) { return gy + gh * (T - 350) / 900; };
      /* linhas: A3 (912→727 em 0,76), Acm (727/0,76 → 1148/2,11), A1 = 727 */
      var i, a3 = [], acm = [];
      for (i = 0; i <= 40; i++) {
        var c = 0.76 * i / 40;
        a3.push([X(c), Y(912 - (912 - 727) * Math.pow(c / 0.76, 0.75))]);
      }
      for (i = 0; i <= 40; i++) {
        var c2 = 0.76 + (2.11 - 0.76) * i / 40;
        acm.push([X(c2), Y(727 + (1148 - 727) * Math.pow((c2 - 0.76) / (2.11 - 0.76), 0.85))]);
      }
      g.caminho(a3, { cor: 's1', larg: 2 });
      g.caminho(acm, { cor: 's4', larg: 2 });
      g.linha(X(0.022), Y(727), X(Cmax), Y(727), { cor: 's2', larg: 2 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      for (i = 0; i <= 4; i++) {
        g.linha(X(Cmax * i / 4), gy, X(Cmax * i / 4), gy - 0.16, { cor: 'fraco', larg: 1 });
        g.txt(fx(Cmax * i / 4, 1), X(Cmax * i / 4), gy - 0.45, { cor: 'fraco', tam: 10.5 });
      }
      [400, 600, 800, 1000, 1200].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.16, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.3, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('%C', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('°C', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('γ (austenita)', X(1.2), Y(1000), { cor: 'suave', tam: 12 });
      g.txt('α + γ', X(0.35), Y(790), { cor: 'fraco', tam: 10.5 });
      g.txt('γ + Fe₃C', X(1.6), Y(850), { cor: 'fraco', tam: 10.5 });
      g.txt('α + Fe₃C', X(1.2), Y(560), { cor: 'fraco', tam: 11 });
      g.circ(X(0.76), Y(727), 0.13, { preenche: 'erro', cor: null });
      g.txt('eutetoide 0,76 %C · 727 °C', X(0.76), Y(727) - 0.5, { cor: 'erro', tam: 10.5, fundo: true });

      var C = p.C, T = p.T;
      g.circ(X(C), Y(T), 0.17, { cor: 'texto', larg: 2.4 });
      g.linha(X(C), gy, X(C), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
      var x0 = 8.9, fases, det;
      if (T > 727) {
        var limA3 = 912 - (912 - 727) * Math.pow(Math.min(C, 0.76) / 0.76, 0.75);
        var limAcm = C > 0.76 ? 727 + (1148 - 727) * Math.pow((Math.min(C, 2.11) - 0.76) / (2.11 - 0.76), 0.85) : 0;
        if (C <= 0.76) { fases = T > limA3 ? 'austenita (γ)' : 'ferrita + austenita'; }
        else { fases = T > limAcm ? 'austenita (γ)' : 'austenita + cementita'; }
        det = 'acima de A1: é aqui que se austenitiza para temperar ou normalizar';
      } else {
        fases = 'ferrita + cementita';
        var Wa = (6.70 - C) / (6.70 - 0.022), Wc = 1 - Wa;
        var Wp = C <= 0.76 ? (C - 0.022) / (0.76 - 0.022) : (6.70 - C) / (6.70 - 0.76);
        det = 'perlita: ' + fx(100 * Wp, 1) + ' %';
        g.ret(x0, 2.4, 3.2 * Wa, 0.5, { preenche: 's1', cor: null, alfa: 0.8 });
        g.ret(x0 + 3.2 * Wa, 2.4, 3.2 * Wc, 0.5, { preenche: 's4', cor: null, alfa: 0.85 });
        g.txt('ferrita ' + fx(100 * Wa, 1) + ' % · Fe₃C ' + fx(100 * Wc, 1) + ' %', x0, 2.0, { cor: 'suave', tam: 11, alin: 'esq' });
        g.ret(x0, 1.0, 3.2 * Wp, 0.5, { preenche: 's2', cor: null, alfa: 0.8 });
        g.ret(x0 + 3.2 * Wp, 1.0, 3.2 * (1 - Wp), 0.5, { preenche: 'borda', cor: null, alfa: 0.9 });
        g.txt(C <= 0.76 ? 'perlita + ferrita pró-eut.' : 'perlita + cementita pró-eut.', x0, 0.6, { cor: 'suave', tam: 11, alin: 'esq' });
      }
      g.txt(fx(C, 2) + ' %C a ' + T + ' °C', x0, 5.9, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(fases, x0, 5.2, { cor: 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(det, x0, 4.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(C < 0.76 ? 'hipoeutetoide' : C > 0.76 ? 'hipereutetoide' : 'eutetoide', x0, 3.7, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('aço: até 2,11 %C — acima disso, ferro fundido', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 7 ================= */

  /* 7.1 — microestrutura após resfriamento lento */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Microestrutura ao fim do resfriamento lento: ferrita clara, perlita listrada e, nos hipereutetoides, a rede de cementita nos contornos. As proporções vêm da regra da alavanca (exemplo 7.1).',
    vista: [-0.6, 12.6, -2.8, 6.0],
    altura: 350,
    controles: [{ id: 'C', rot: 'Teor de carbono', min: 0.1, max: 1.4, val: 0.4, passo: 0.05, un: '%C' }],
    desenhar: function (g, p) {
      var C = p.C;
      var hipo = C < 0.76;
      var Wp = hipo ? (C - 0.022) / (0.76 - 0.022) : (6.70 - C) / (6.70 - 0.76);
      var Wpro = 1 - Wp;
      /* grãos: círculos empacotados, perlita listrada */
      var ox = 0.9, oy = 0.6, larg = 6.6, alt = 4.8;
      g.ret(ox, oy, larg, alt, { cor: 'forte', larg: 1.6, preenche: 'fundo' });
      var nx = 5, ny = 4, semente = 11;
      var total = nx * ny, nPerl = Math.round(total * Wp);
      var ordem = [];
      for (var i = 0; i < total; i++) ordem.push(i);
      /* embaralha de forma determinística */
      for (i = total - 1; i > 0; i--) {
        semente = (semente * 9301 + 49297) % 233280;
        var j = Math.floor(semente / 233280 * (i + 1));
        var tmp = ordem[i]; ordem[i] = ordem[j]; ordem[j] = tmp;
      }
      var perl = ordem.slice(0, nPerl);
      for (var gy2 = 0; gy2 < ny; gy2++) {
        for (var gx2 = 0; gx2 < nx; gx2++) {
          var idx = gy2 * nx + gx2;
          var cx = ox + larg * (gx2 + 0.5) / nx, cy = oy + alt * (gy2 + 0.5) / ny;
          var r = Math.min(larg / nx, alt / ny) * 0.52;
          var ehPerlita = perl.indexOf(idx) >= 0;
          g.circ(cx, cy, r, { preenche: ehPerlita ? 'baixo' : 'fundo', cor: 'borda', larg: 1.2 });
          if (ehPerlita) {
            for (var k = -4; k <= 4; k++) {
              var yy = cy + k * r / 5;
              var meia = Math.sqrt(Math.max(0, r * r - (yy - cy) * (yy - cy)));
              g.linha(cx - meia, yy, cx + meia, yy, { cor: 'texto', larg: 1 });
            }
          } else if (!hipo) {
            g.circ(cx, cy, r, { cor: 's4', larg: 2.6 });
          }
        }
      }
      g.txt(hipo ? 'grãos claros: ferrita pró-eutetoide · listrados: perlita'
                 : 'contornos destacados: cementita pró-eutetoide · listrados: perlita',
        ox + larg / 2, -0.4, { cor: 'fraco', tam: 11 });
      var x0 = 8.2;
      g.txt(fx(C, 2) + ' %C — ' + (hipo ? 'hipoeutetoide' : C > 0.76 ? 'hipereutetoide' : 'eutetoide'),
        x0, 5.4, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.ret(x0, 4.0, 3.6 * Wp, 0.55, { preenche: 's2', cor: null, alfa: 0.8 });
      g.ret(x0 + 3.6 * Wp, 4.0, 3.6 * Wpro, 0.55, { preenche: hipo ? 's1' : 's4', cor: null, alfa: 0.8 });
      g.txt('perlita ' + fx(100 * Wp, 1) + ' %', x0, 3.5, { cor: 's2', tam: 12, alin: 'esq', negrito: true });
      g.txt((hipo ? 'ferrita' : 'cementita') + ' pró-eutetoide ' + fx(100 * Wpro, 1) + ' %',
        x0, 2.9, { cor: hipo ? 's1' : 's4', tam: 12, alin: 'esq', negrito: true });
      g.txt('mais carbono: mais dureza', x0, 2.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('e menos ductilidade', x0, 1.45, { cor: 'fraco', tam: 11, alin: 'esq' });
      if (!hipo && C > 0.9) g.txt('rede de cementita: fragiliza', x0, 0.7, { cor: 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('resfriamento lento, de equilíbrio — resfriamento rápido dá bainita e martensita', 6, -2.2, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 8 ================= */

  /* 8.1 — Hall-Petch */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Refino de grão: cada contorno é um obstáculo às discordâncias. É o único mecanismo que aumenta resistência e tenacidade ao mesmo tempo (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.6, 6.2],
    altura: 350,
    controles: [
      { id: 'd', rot: 'Tamanho de grão', min: 2, max: 100, val: 50, passo: 1, un: 'μm' },
      { id: 'k', rot: 'Constante k', min: 0.2, max: 1.2, val: 0.74, passo: 0.02, un: 'MPa·√m' }
    ],
    desenhar: function (g, p) {
      var s0 = 70, k = p.k, d = p.d * 1e-6;
      var sy = s0 + k / Math.sqrt(d);
      /* grãos: quanto menor d, mais grãos no mesmo quadrado */
      var ox = 0.9, oy = 0.7, lado = 4.6;
      g.ret(ox, oy, lado, lado, { cor: 'forte', larg: 1.6, preenche: 'fundo' });
      var n = Math.max(2, Math.min(14, Math.round(100 / p.d * 3)));
      var passo = lado / n, semente = 5;
      for (var j = 0; j < n; j++) {
        for (var i = 0; i < n; i++) {
          semente = (semente * 9301 + 49297) % 233280;
          var jitter = (semente / 233280 - 0.5) * passo * 0.3;
          g.circ(ox + (i + 0.5) * passo + jitter, oy + (j + 0.5) * passo - jitter, passo * 0.5,
            { preenche: 's1', cor: 'borda', larg: 1.2, alfa: 0.25 });
        }
      }
      g.txt('≈ ' + (n * n) + ' grãos no mesmo campo', ox + lado / 2, -0.35, { cor: 'fraco', tam: 11 });
      /* curva sigma × d^-1/2 */
      var gx = 6.4, gy = 0.9, gw = 5.2, gh = 4.4;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var xmax = 1 / Math.sqrt(2e-6), smax = s0 + k * xmax;
      var pts = [], i2;
      for (i2 = 0; i2 <= 40; i2++) {
        var xv = xmax * i2 / 40;
        pts.push([gx + gw * xv / xmax, gy + gh * (s0 + k * xv) / smax]);
      }
      g.caminho(pts, { cor: 's2', larg: 2.4 });
      var xp = 1 / Math.sqrt(d);
      g.circ(gx + gw * xp / xmax, gy + gh * sy / smax, 0.16, { preenche: 'erro', cor: null });
      g.txt('d⁻¹ᐟ² →', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('σ escoamento', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('σy = σ₀ + k·d⁻¹ᐟ²', gx, gy + gh + 0.75, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('d = ' + p.d + ' μm  →  σy = ' + fx(sy, 0) + ' MPa', gx, gy + gh + 0.15, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('σ₀ = 70 MPa (resistência da rede sem contornos)', 6, -2.0, { cor: 'fraco', tam: 11 });
    }
  });

  /* 8.2 — encruamento */
  F('#fig-8-2', {
    titulo: 'Figura 8.2',
    legenda: 'Encruamento: deformar a frio sobe o escoamento e consome a ductilidade. Recozer refaz os grãos e devolve tudo ao ponto de partida.',
    vista: [-0.6, 12.6, -2.6, 6.2],
    altura: 350,
    controles: [{ id: 'tf', rot: 'Trabalho a frio', min: 0, max: 60, val: 20, passo: 5, un: '%' }],
    desenhar: function (g, p) {
      var tf = p.tf / 100;
      var s0 = 180, K = 530, n = 0.26;        /* curva σ = K εⁿ, aço baixo carbono */
      var eps0 = Math.pow(s0 / K, 1 / n);
      var epsTF = eps0 + 1.2 * tf;
      var syNovo = K * Math.pow(epsTF, n);
      var alongTotal = 0.35, alongRest = Math.max(0.02, alongTotal - 1.2 * tf);
      var gx = 1.2, gy = 0.9, gw = 6.4, gh = 4.6;
      var smax = 620, emax = 0.45;
      var X = function (e) { return gx + gw * e / emax; };
      var Y = function (s) { return gy + gh * s / smax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var e = eps0 + (alongTotal - eps0) * i / 60;
        pts.push([X(e), Y(K * Math.pow(e, n))]);
      }
      g.caminho([[X(0), Y(0)], [X(eps0), Y(s0)]].concat(pts), { cor: 'borda', larg: 2, tracejado: [5, 4] });
      /* curva do material encruado: começa no ponto atingido */
      var pts2 = [];
      for (i = 0; i <= 60; i++) {
        var e2 = epsTF + (alongTotal - epsTF) * i / 60;
        if (e2 < epsTF) continue;
        pts2.push([X(e2 - epsTF + 0.004), Y(K * Math.pow(e2, n))]);
      }
      g.caminho([[X(0), Y(0)], [X(0.004), Y(syNovo)]].concat(pts2), { cor: 's2', larg: 2.6 });
      g.circ(X(0.004), Y(syNovo), 0.14, { preenche: 's2', cor: null });
      g.txt('original', X(0.30), Y(K * Math.pow(0.30, n)) + 0.45, { cor: 'fraco', tam: 11 });
      g.txt('após ' + p.tf + ' % a frio', X(0.12), Y(syNovo) + 0.5, { cor: 's2', tam: 11.5, fundo: true });
      g.txt('deformação', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('tensão (MPa)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.4;
      g.txt('escoamento', x0, 5.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(s0, 0) + ' → ' + fx(syNovo, 0) + ' MPa', x0, 4.8, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('alongamento restante', x0, 3.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(100 * alongTotal, 0) + ' → ' + fx(100 * alongRest, 0) + ' %', x0, 3.3, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('o metal fica mais forte e menos', x0, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('dúctil: é o preço do encruamento', x0, 1.75, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('recozer recristaliza os grãos e devolve a ductilidade', 6, -2.0, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 10 ================= */

  /* 10.1 — transição dúctil-frágil */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Ensaio Charpy: os aços CCC perdem tenacidade abaixo da temperatura de transição; os CFC, não. Foi essa curva que explicou os navios partidos ao meio em água fria.',
    vista: [-0.6, 12.6, -2.6, 6.2],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura de serviço', min: -100, max: 100, val: 0, passo: 5, un: '°C' },
      { id: 'C', rot: 'Teor de carbono do aço CCC', min: 0.1, max: 0.8, val: 0.2, passo: 0.05, un: '%C' }
    ],
    desenhar: function (g, p) {
      var T = p.T, C = p.C;
      var T0 = -60 + 160 * (C - 0.1) / 0.7;        /* mais carbono, transição mais alta */
      var Emax = 200 - 150 * (C - 0.1) / 0.7;
      var Emin = 8;
      function Eccc(t) { return Emin + (Emax - Emin) / (1 + Math.exp(-(t - T0) / 18)); }
      function Ecfc(t) { return 180 + 0.25 * t; }
      var gx = 1.4, gy = 0.9, gw = 6.6, gh = 4.6;
      var X = function (t) { return gx + gw * (t + 120) / 240; };
      var Y = function (E) { return gy + gh * E / 240; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, p1 = [], p2 = [];
      for (i = 0; i <= 60; i++) {
        var t = -120 + 240 * i / 60;
        p1.push([X(t), Y(Eccc(t))]);
        p2.push([X(t), Y(Ecfc(t))]);
      }
      g.caminho(p1, { cor: 's2', larg: 2.6 });
      g.caminho(p2, { cor: 's3', larg: 2.6, tracejado: [7, 5] });
      [-100, -50, 0, 50, 100].forEach(function (t) {
        g.linha(X(t), gy, X(t), gy - 0.16, { cor: 'fraco', larg: 1 });
        g.txt(t + '', X(t), gy - 0.45, { cor: 'fraco', tam: 10.5 });
      });
      g.txt('temperatura (°C)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('energia (J)', gx - 0.3, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.linha(X(T), gy, X(T), gy + gh, { cor: 'erro', larg: 1.2, tracejado: [4, 4] });
      var E = Eccc(T);
      g.circ(X(T), Y(E), 0.16, { preenche: 'erro', cor: null });
      g.circ(X(T), Y(Ecfc(T)), 0.14, { preenche: 's3', cor: null });
      var x0 = 8.6;
      g.txt('aço CCC (ferrítico)', x0, 5.5, { cor: 's2', tam: 12, alin: 'esq', negrito: true });
      g.txt(fx(E, 0) + ' J a ' + T + ' °C', x0, 4.9, { cor: 's2', tam: 12.5, alin: 'esq' });
      g.txt('transição ≈ ' + fx(T0, 0) + ' °C', x0, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('aço CFC (austenítico)', x0, 3.4, { cor: 's3', tam: 12, alin: 'esq', negrito: true });
      g.txt(fx(Ecfc(T), 0) + ' J — sem transição', x0, 2.8, { cor: 's3', tam: 12.5, alin: 'esq' });
      g.txt(E < 27 ? 'abaixo de 27 J: frágil' : 'acima de 27 J: dúctil',
        x0, 1.7, { cor: E < 27 ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('mais carbono sobe a temperatura de transição e derruba o patamar dúctil', 6, -2.0, { cor: 'fraco', tam: 11 });
    }
  });
})();

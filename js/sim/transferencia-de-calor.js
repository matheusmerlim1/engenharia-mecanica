/* ============================================================
   Transferência de Calor — simuladores
   1. sim-parede    Condução em parede composta / tubo isolado
   2. sim-aleta     Aleta: distribuição de temperatura e eficiência
   3. sim-trocador  Trocador de calor: MLDT e ε-NUT
   4. sim-radiacao  Radiação: Planck, Wien e troca entre cinzas
   ============================================================ */
(function () {
  'use strict';

  /* ---------- constantes e utilitários compartilhados ---------- */
  var SIGMA = 5.670374e-8;        /* W/m²·K⁴ */
  var C1 = 3.741772e8;            /* W·µm⁴/m² */
  var C2 = 14387.77;              /* µm·K     */
  var LMB_VIS_1 = 0.38, LMB_VIS_2 = 0.78;

  /* Ponto de orvalho (Magnus-Tetens), T em °C, UR em % */
  function orvalho(T, UR) {
    var a = 17.62, b = 243.12;
    var g = Math.log(Math.max(1, Math.min(100, UR)) / 100) + a * T / (b + T);
    return b * g / (a - g);
  }

  /* Fração de emissão de corpo negro entre 0 e lambda·T (µm·K) */
  function fracCN(lambdaT) {
    if (!(lambdaT > 0)) return 0;
    var z = C2 / lambdaT, s = 0;
    for (var n = 1; n <= 500; n++) {
      var e = Math.exp(-n * z);
      if (!isFinite(e) || e === 0) break;
      var t = e * (z * z * z / n + 3 * z * z / (n * n) + 6 * z / (n * n * n) + 6 / (n * n * n * n));
      s += t;
      if (t < 1e-13 * (s + 1e-30)) break;
    }
    return Math.min(1, 15 / Math.pow(Math.PI, 4) * s);
  }

  /* Poder emissivo espectral de corpo negro, W/(m²·µm) */
  function planck(lambda, T) {
    if (!(lambda > 0) || !(T > 0)) return 0;
    var d = Math.exp(C2 / (lambda * T)) - 1;
    if (!isFinite(d) || d <= 0) return 0;
    return C1 / (Math.pow(lambda, 5) * d);
  }

  /* Funções de Bessel modificadas I0 e I1 (série de potências) */
  function I0(x) {
    var s = 1, t = 1, q = x * x / 4;
    for (var k = 1; k < 60; k++) { t *= q / (k * k); s += t; if (t < 1e-15 * s) break; }
    return s;
  }
  function I1(x) {
    var s = x / 2, t = x / 2, q = x * x / 4;
    for (var k = 1; k < 60; k++) { t *= q / (k * (k + 1)); s += t; if (t < 1e-15 * s) break; }
    return s;
  }

  /* Média logarítmica de duas diferenças */
  function mlog(d1, d2) {
    if (!(d1 > 0) || !(d2 > 0)) return NaN;
    if (Math.abs(d1 - d2) < 1e-9) return d1;
    return (d1 - d2) / Math.log(d1 / d2);
  }

  /* ============================================================
     1. sim-parede — condução em parede composta
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-parede')) return;

    var MAT = {
      nenhum:    { t: '— sem camada —',            k: 0 },
      concreto:  { t: 'Concreto armado (1,75)',    k: 1.75 },
      argamassa: { t: 'Argamassa/reboco (1,15)',   k: 1.15 },
      vidro:     { t: 'Vidro comum (1,00)',        k: 1.00 },
      tijolo:    { t: 'Tijolo cerâmico (0,90)',    k: 0.90 },
      bloco:     { t: 'Bloco de concreto (0,70)',  k: 0.70 },
      gesso:     { t: 'Gesso acartonado (0,35)',   k: 0.35 },
      madeira:   { t: 'Madeira (0,15)',            k: 0.15 },
      la:        { t: 'Lã de rocha (0,045)',       k: 0.045 },
      eps:       { t: 'EPS (0,040)',               k: 0.040 },
      pu:        { t: 'Poliuretano (0,026)',       k: 0.026 },
      aco:       { t: 'Aço carbono (54)',          k: 54 }
    };
    var OPT = Object.keys(MAT).map(function (v) { return { v: v, t: MAT[v].t }; });

    function camadaCtrl(i, matPad, ePad) {
      return [
        { id: 'm' + i, tipo: 'select', label: 'Camada ' + i + ' — material', valor: matPad, opcoes: OPT },
        { id: 'e' + i, label: 'Camada ' + i + ' — espessura', min: 0, max: 40, step: 0.5, valor: ePad, unidade: 'cm' }
      ];
    }

    var ctrls = [
      { id: 'geom', tipo: 'seg', label: 'Geometria', valor: 'plana',
        opcoes: [{ v: 'plana', t: 'Parede plana' }, { v: 'cil', t: 'Tubo cilíndrico' }] },
      { id: 'rint', label: 'Raio interno do tubo', min: 5, max: 250, step: 1, valor: 25, unidade: 'mm',
        desc: 'Só é usado na geometria cilíndrica.' },
      { tipo: 'separador' },
      { tipo: 'titulo', label: 'Camadas — de dentro para fora' }
    ];
    ctrls = ctrls
      .concat(camadaCtrl(1, 'argamassa', 2.5))
      .concat(camadaCtrl(2, 'tijolo', 9))
      .concat(camadaCtrl(3, 'eps', 3))
      .concat(camadaCtrl(4, 'argamassa', 2.5))
      .concat([
        { tipo: 'separador' },
        { id: 'hi', label: 'h interno', min: 1, max: 60, step: 0.1, valor: 7.7, unidade: 'W/m²·K',
          desc: 'NBR 15220: R_si = 0,13 m²·K/W → h ≈ 7,7' },
        { id: 'he', label: 'h externo', min: 1, max: 120, step: 0.5, valor: 25, unidade: 'W/m²·K',
          desc: 'NBR 15220: R_se = 0,04 m²·K/W → h = 25' },
        { id: 'Ti', label: 'Temperatura interna', min: -10, max: 80, step: 0.5, valor: 24, unidade: '°C' },
        { id: 'Te', label: 'Temperatura externa', min: -20, max: 60, step: 0.5, valor: 2, unidade: '°C' },
        { id: 'UR', label: 'Umidade relativa interna', min: 20, max: 98, step: 1, valor: 65, unidade: '%' }
      ]);

    Sim.build('#sim-parede', {
      titulo: '1. Condução em parede composta — analogia elétrica',
      descricao: 'Resistências em série: películas de convecção + camadas de condução. Veja qual camada realmente segura o calor, onde a condensação aparece e por que isolar um tubo fino pode aumentar a perda.',
      controlesLargos: true,
      controles: ctrls,
      graficos: [
        { id: 'perfil', xlabel: 'Posição na parede (cm) / raio (mm)', ylabel: 'Temperatura (°C)', aspect: 0.5,
          legenda: 'A inclinação em cada camada é inversamente proporcional a k: quanto mais isolante, mais forte a queda.' },
        { id: 'res', xlabel: 'Participação na resistência total (%)', aspect: 0.22,
          xlim: [0, 100], ylim: [0, 1], grid: false, legend: false,
          legenda: 'Barra empilhada das resistências. A camada que ocupa a maior fatia é a única que vale a pena engrossar.' },
        { id: 'rcrit', xlabel: 'Raio externo do isolamento (mm)', ylabel: "Perda q' (W/m)", aspect: 0.42,
          legenda: 'Estudo cilíndrico: abaixo do raio crítico, acrescentar isolante AUMENTA a perda de calor.' }
      ],
      saidas: [
        { id: 'Rt',   label: 'Resistência total' },
        { id: 'U',    label: 'Transmitância U' },
        { id: 'q',    label: 'Fluxo de calor' },
        { id: 'Tsi',  label: 'Superfície interna' },
        { id: 'Tse',  label: 'Superfície externa' },
        { id: 'Torv', label: 'Ponto de orvalho' },
        { id: 'cond', label: 'Condensação' },
        { id: 'rcr',  label: 'Raio crítico (última camada)' }
      ],
      nota: 'Regime permanente, unidimensional, contato térmico perfeito entre camadas e propriedades constantes. Na parede plana R é por m² (m²·K/W) e q é q″ (W/m²); no tubo R é por metro (m·K/W) e q é q′ (W/m).',
      formulas: [
        { g: 'Leis de taxa' },
        { tex: 'q = - k\\cdot A\\cdot \\frac{\mathrm{d}T}{\mathrm{d}x}', d: 'condução (Fourier); k em W/m·K', destaque: true },
        { tex: 'q = h\\cdot A\\cdot (Ts - T\\infty )', d: 'convecção (Newton); h NÃO é propriedade do material', destaque: true },
        { tex: 'q = \\varepsilon \\cdot \\sigma \\cdot A\\cdot (Ts^{4} - \\text{Tviz}^{4})', d: 'radiação; T sempre em kelvin' },

        { g: 'Resistências térmicas' },
        { tex: 'R_{\\text{plana}} =\\frac{L}{k\\cdot A}', d: 'parede plana; perfil de temperatura linear', destaque: true },
        { tex: 'R_{\\text{cil}} = \\ln \\frac{\\frac{r_{e}}{r_{i}}}{2\\pi \\cdot k\\cdot L}', d: 'casca cilíndrica; perfil logarítmico' },
        { tex: 'R_{\\text{esf}} = \\frac{\\frac{1}{r_{i}} - \\frac{1}{r_{e}}}{4\\pi \\cdot k}', d: 'casca esférica' },
        { tex: 'R_{\\text{conv}} =\\frac{1}{h\\cdot A}', d: 'película de convecção' },
        { tex: 'R_{\\text{rad}} =\\frac{1}{h_{r}\\cdot A}', d: 'h_r = εσ(Ts+Tviz)(Ts²+Tviz²)' },
        { tex: 'R_{\\text{contato}} =\\frac{R\'\' _{c}}{A}', d: 'resistência de contato entre sólidos' },

        { g: 'Associação e coeficiente global' },
        { tex: 'Em \\text{série}: R_{\\text{total}} = \\Sigma R_{i}', d: 'mesmo q em todas as camadas', destaque: true },
        { tex: 'Em \\text{paralelo}: \\frac{1}{R} = \\frac{\\Sigma 1}{R_{i}}', d: 'mesmo ΔT nos ramos' },
        { tex: 'q =\\frac{\\Delta T_{\\text{total}}}{R_{\\text{total}}}', d: 'analogia direta com a lei de Ohm', destaque: true },
        { tex: 'U =\\frac{1}{A\\cdot R_{\\text{total}}}', d: 'coeficiente global; em tubo, declare se é Uᵢ ou Uₑ' },
        { tex: '\\Delta T_{i} = q \\cdot R_{i}', d: 'a maior queda de temperatura está na maior resistência' },

        { g: 'Isolamento de tubos' },
        { tex: 'r_{\\text{cr}} =\\frac{k_{\\text{iso}}}{h}', d: 'raio crítico, cilindro: abaixo dele isolar AUMENTA a perda', destaque: true },
        { tex: 'r_{\\text{cr}} =\\frac{2\\cdot k_{\\text{iso}}}{h}', d: 'raio crítico, esfera' }
      ],
      formulasTitulo: 'Fórmulas — condução e resistência térmica',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      calcular: function (p, ctx) {
        var cil = p.geom === 'cil';

        /* --- monta as camadas válidas --- */
        var cam = [];
        for (var i = 1; i <= 4; i++) {
          var mk = MAT[p['m' + i]] || MAT.nenhum;
          var esp = p['e' + i] / 100;                 /* cm -> m */
          if (mk.k > 0 && esp > 1e-6) cam.push({ nome: mk.t.split(' (')[0], k: mk.k, L: esp });
        }
        if (!cam.length) cam.push({ nome: 'Tijolo cerâmico', k: 0.9, L: 0.09 });

        var dT = p.Ti - p.Te;
        var r0 = p.rint / 1000;

        /* --- resistências --- */
        var itens = [];
        var raios = [r0];
        if (cil) {
          itens.push({ nome: 'Película interna', R: 1 / (2 * Math.PI * r0 * p.hi), tipo: 'conv' });
          for (var a = 0; a < cam.length; a++) {
            var rA = raios[raios.length - 1], rB = rA + cam[a].L;
            raios.push(rB);
            itens.push({ nome: cam[a].nome, R: Math.log(rB / rA) / (2 * Math.PI * cam[a].k), tipo: 'cond' });
          }
          var rN = raios[raios.length - 1];
          itens.push({ nome: 'Película externa', R: 1 / (2 * Math.PI * rN * p.he), tipo: 'conv' });
        } else {
          itens.push({ nome: 'Película interna', R: 1 / p.hi, tipo: 'conv' });
          for (var b = 0; b < cam.length; b++) {
            itens.push({ nome: cam[b].nome, R: cam[b].L / cam[b].k, tipo: 'cond' });
          }
          itens.push({ nome: 'Película externa', R: 1 / p.he, tipo: 'conv' });
        }

        var Rt = 0;
        itens.forEach(function (it) { Rt += it.R; });
        var U = 1 / Rt;
        var q = dT / Rt;

        /* --- temperaturas nos nós --- */
        var Tnos = [p.Ti];
        for (var c = 0; c < itens.length; c++) Tnos.push(Tnos[c] - q * itens[c].R);
        var Tsi = Tnos[1], Tse = Tnos[Tnos.length - 2];
        var Tmin = Math.min.apply(null, Tnos.slice(1, Tnos.length - 1));
        var Torv = orvalho(p.Ti, p.UR);
        var risco = Tmin < Torv;
        var riscoSup = Tsi < Torv;

        /* ---------- gráfico 1: perfil de temperatura ---------- */
        var g1 = ctx.plot('perfil').clear();
        var xs = [], ys = [], marcas = [];
        if (cil) {
          var pos = r0 * 1000, folga = (raios[raios.length - 1] - r0) * 1000 * 0.18 + 3;
          xs.push(pos - folga); ys.push(p.Ti);
          xs.push(pos); ys.push(Tnos[1]);
          for (var d = 0; d < cam.length; d++) {
            var ra = raios[d], rb = raios[d + 1], Ta = Tnos[d + 1], Tb = Tnos[d + 2];
            var nn = 24;
            for (var s = 1; s <= nn; s++) {
              var rr = ra + (rb - ra) * s / nn;
              xs.push(rr * 1000);
              ys.push(Ta - (Ta - Tb) * Math.log(rr / ra) / Math.log(rb / ra));
            }
            marcas.push({ x: rb * 1000, T: Tb, nome: cam[d].nome });
          }
          xs.push(raios[raios.length - 1] * 1000 + folga); ys.push(p.Te);
          g1.o.xlabel = 'Raio (mm)';
        } else {
          var Ltot = 0; cam.forEach(function (cc) { Ltot += cc.L; });
          var mg = Ltot * 0.15 * 100 + 0.5;
          var x = 0;
          xs.push(-mg); ys.push(p.Ti);
          xs.push(0); ys.push(Tnos[1]);
          for (var e = 0; e < cam.length; e++) {
            x += cam[e].L * 100;
            xs.push(x); ys.push(Tnos[e + 2]);
            marcas.push({ x: x, T: Tnos[e + 2], nome: cam[e].nome });
          }
          xs.push(x + mg); ys.push(p.Te);
          g1.o.xlabel = 'Posição na parede (cm)';
        }
        g1.line(xs, ys, { color: Plot.serie(1), width: 2.4, label: 'T(x)' });
        g1.points(xs, ys, { color: Plot.serie(1), r: 2 });
        marcas.forEach(function (mm, i) {
          if (i < marcas.length - 1) g1.vline(mm.x, { color: Plot.serie(6), width: 1, dash: [3, 3] });
        });
        g1.hline(Torv, { color: Plot.serie(3), dash: [6, 4], text: 'orvalho ' + Plot.sig(Torv, 3) + ' °C' });
        g1.text(xs[0], ys[0], ' ar interno', { color: Plot.serie(4), size: 10.5, baseline: 'bottom' });
        g1.text(xs[xs.length - 1], ys[ys.length - 1], 'ar externo ', { color: Plot.serie(4), size: 10.5, align: 'right', baseline: 'top' });
        if (risco) {
          g1.marker(xs[1], Tsi, 'condensa', { color: Plot.serie(3) });
        }
        g1.draw();

        /* ---------- gráfico 2: barra empilhada das resistências ---------- */
        var g2 = ctx.plot('res').clear();
        g2.custom(function (c2, pl) {
          var acc = 0;
          var y0 = pl.py(0.72), y1 = pl.py(0.28);
          itens.forEach(function (it, i) {
            var pct = it.R / Rt * 100;
            var xa = pl.px(acc), xb = pl.px(acc + pct);
            c2.fillStyle = Plot.serie(it.tipo === 'conv' ? 6 : i);
            c2.globalAlpha = it.tipo === 'conv' ? 0.45 : 0.85;
            c2.fillRect(xa, y1, Math.max(0, xb - xa), y0 - y1);
            c2.globalAlpha = 1;
            if (pct > 7) {
              c2.fillStyle = Plot.cssVar('--bg-elev', '#fff');
              c2.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
              c2.textAlign = 'center'; c2.textBaseline = 'middle';
              c2.fillText(Math.round(pct) + '%', (xa + xb) / 2, (y0 + y1) / 2);
            }
            if (pct > 12) {
              c2.fillStyle = Plot.cssVar('--text', '#111');
              c2.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
              c2.textAlign = 'center'; c2.textBaseline = 'bottom';
              c2.fillText(it.nome, (xa + xb) / 2, y1 - 4);
            }
            acc += pct;
          });
        });
        g2.draw();

        /* ---------- gráfico 3: raio crítico ---------- */
        var g3 = ctx.plot('rcrit').clear();
        var ult = cam[cam.length - 1];
        var kIso = ult.k;
        var rBase = r0;
        var Rint = 1 / (2 * Math.PI * r0 * p.hi);
        for (var f = 0; f < cam.length - 1; f++) {
          var rA2 = rBase, rB2 = rBase + cam[f].L;
          Rint += Math.log(rB2 / rA2) / (2 * Math.PI * cam[f].k);
          rBase = rB2;
        }
        var rcr = kIso / p.he;
        var rMax = Math.max(rBase + ult.L, rcr) * 2.2 + 0.005;
        var rs = Plot.linspace(rBase * 1.001, rMax, 160);
        var qs = Plot.map(rs, function (r) {
          var R = Rint + Math.log(r / rBase) / (2 * Math.PI * kIso) + 1 / (2 * Math.PI * r * p.he);
          return dT / R;
        });
        g3.line(rs.map(function (r) { return r * 1000; }), qs, { color: Plot.serie(0), width: 2.2, label: "q'(r) com isolante " + ult.nome });
        if (rcr > rBase && rcr < rMax) {
          var Rc = Rint + Math.log(rcr / rBase) / (2 * Math.PI * kIso) + 1 / (2 * Math.PI * rcr * p.he);
          g3.vline(rcr * 1000, { color: Plot.serie(3), dash: [6, 4], text: 'r crítico = ' + Plot.sig(rcr * 1000, 3) + ' mm' });
          g3.marker(rcr * 1000, dT / Rc, 'máximo de perda', { color: Plot.serie(3) });
        }
        var rAtual = rBase + ult.L;
        var Ra = Rint + Math.log(rAtual / rBase) / (2 * Math.PI * kIso) + 1 / (2 * Math.PI * rAtual * p.he);
        g3.marker(rAtual * 1000, dT / Ra, 'projeto', { color: Plot.serie(2) });
        g3.draw();

        /* ---------- saídas ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        var listaR = itens.map(function (it) {
          return '  ' + it.nome + ': R = ' + sg(it.R, 4) + (cil ? ' m·K/W' : ' m²·K/W') +
                 '   (' + sg(it.R / Rt * 100, 3) + ' % do total)';
        }).join('\\n');
        var dom = itens.slice().sort(function (x, y) { return y.R - x.R; })[0];

        ctx.setPassos([
          { t: 'Geometria e camadas',
            c: (cil ? 'Parede CILÍNDRICA, raio interno ' + p.rint + ' mm' : 'Parede PLANA') + '\\n' +
               cam.map(function (c2) {
                 return '  ' + c2.nome + ': L = ' + (c2.L * 100) + ' cm, k = ' + c2.k + ' W/m·K';
               }).join('\\n') + '\\n' +
               'Ti = ' + p.Ti + ' °C   Te = ' + p.Te + ' °C   ΔT = ' + sg(dT, 4) + ' K' },
          { t: 'Resistência de cada elemento',
            tex: cil
              ? 'R_{cond} = \\frac{\\ln(r_e/r_i)}{2\\pi k} \\qquad R_{conv} = \\frac{1}{2\\pi r h}'
              : 'R_{cond} = \\frac{L}{k} \\qquad R_{conv} = \\frac{1}{h}',
            c: listaR,
            obs: 'A camada dominante é ' + dom.nome + ', com ' + sg(dom.R / Rt * 100, 3) +
                 ' % da resistência total — é nela que ocorre a maior queda de temperatura.' },
          { t: 'Resistência total (associação em série)',
            tex: 'R_{\\text{total}} = \\sum R_i',
            texSub: 'R_{\\text{total}} = ' + nt(Rt, 4) + (cil ? '\\ \\text{m·K/W}' : '\\ \\text{m}^2\\text{·K/W}'),
            obs: 'Em série as resistências somam, exatamente como resistores elétricos.' },
          { t: 'Coeficiente global',
            tex: 'U = \\frac{1}{R_{\\text{total}}}',
            texSub: 'U = \\frac{1}{' + nt(Rt, 4) + '} = ' + nt(U, 4) +
                    (cil ? '\\ \\text{W/m·K}' : '\\ \\text{W/m}^2\\text{·K}') },
          { t: 'Fluxo de calor',
            tex: 'q = \\frac{\\Delta T}{R_{\\text{total}}} = U \\cdot \\Delta T',
            texSub: 'q = \\frac{' + sg(dT, 4) + '}{' + nt(Rt, 4) + '} = ' + nt(q, 4) +
                    (cil ? '\\ \\text{W/m}' : '\\ \\text{W/m}^2'),
            obs: 'Em regime permanente, o MESMO q atravessa todas as camadas.' },
          { t: 'Temperaturas nas superfícies',
            tex: '\\Delta T_i = q \\cdot R_i',
            texSub: 'T_{\\text{sup},\\text{int}} = ' + sg(Tsi, 4) + '\\ ^\\circ\\text{C} \\qquad T_{sup,ext} = ' +
                    sg(Tse, 4) + '\\ ^\\circ\\text{C}',
            obs: 'A queda em cada camada é proporcional à sua resistência.' },
          { t: 'Verificação de condensação',
            texSub: 'T_{\\text{orvalho}} = ' + sg(Torv, 4) + '\\ ^\\circ\\text{C} \\quad\\text{versus}\\quad T_{sup} = ' +
                    sg(Tsi, 4) + '\\ ^\\circ\\text{C}',
            r: risco ? (riscoSup ? 'CONDENSA na superfície' : 'Condensação interna (intersticial)')
                     : 'Sem risco de condensação',
            obs: 'Se a superfície fica abaixo do ponto de orvalho do ar interno, forma-se água — origem de mofo e corrosão.' }
        ]);

        return {
          Rt:   { v: Rt, u: cil ? 'm·K/W' : 'm²·K/W' },
          U:    { v: U, u: cil ? 'W/m·K' : 'W/m²·K', classe: (!cil && U > 2.5) ? 'alerta' : '' },
          q:    { v: q, u: cil ? 'W/m' : 'W/m²', classe: 'destaque' },
          Tsi:  { v: Tsi, u: '°C', classe: riscoSup ? 'alerta' : 'ok' },
          Tse:  { v: Tse, u: '°C' },
          Torv: { v: Torv, u: '°C' },
          cond: { v: risco ? (riscoSup ? 'na superfície' : 'interna (intersticial)') : 'sem risco',
                  classe: risco ? 'alerta' : 'ok' },
          rcr:  { v: rcr * 1000, u: 'mm', classe: (cil && rcr > rBase) ? 'alerta' : '' }
        };
      }
    });
  })();

  /* ============================================================
     2. sim-aleta — distribuição de temperatura e eficiência
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-aleta')) return;

    var KMAT = {
      cobre:  { t: 'Cobre puro (401)',       k: 401 },
      alum:   { t: 'Alumínio 2024 (177)',    k: 177 },
      alupuro:{ t: 'Alumínio puro (237)',    k: 237 },
      latao:  { t: 'Latão (110)',            k: 110 },
      acoC:   { t: 'Aço carbono (60)',       k: 60 },
      inox:   { t: 'Aço inox AISI 304 (15)', k: 15 },
      titanio:{ t: 'Titânio (22)',           k: 22 }
    };

    Sim.build('#sim-aleta', {
      titulo: '2. Aleta — perfil de temperatura, eficiência e efetividade',
      descricao: 'Compare as três condições de ponta, veja o parâmetro mL saturar a eficiência e descubra a partir de quando a aleta deixa de compensar.',
      controles: [
        { id: 'geo', tipo: 'seg', label: 'Geometria', valor: 'ret',
          opcoes: [{ v: 'ret', t: 'Retangular' }, { v: 'pino', t: 'Pino' }, { v: 'tri', t: 'Triangular' }] },
        { id: 'mat', tipo: 'select', label: 'Material', valor: 'alupuro',
          opcoes: Object.keys(KMAT).map(function (v) { return { v: v, t: KMAT[v].t }; }) },
        { id: 'L', label: 'Comprimento L', min: 3, max: 200, step: 1, valor: 25, unidade: 'mm' },
        { id: 't', label: 'Espessura t (retangular/triangular)', min: 0.4, max: 12, step: 0.1, valor: 2, unidade: 'mm' },
        { id: 'D', label: 'Diâmetro D (pino)', min: 1, max: 30, step: 0.5, valor: 5, unidade: 'mm' },
        { tipo: 'separador' },
        { id: 'h', label: 'Coeficiente de convecção h', min: 5, max: 500, step: 5, valor: 100, unidade: 'W/m²·K',
          desc: 'Ar em convecção natural 5–25 · ar forçado 25–250 · líquidos 100–2000' },
        { id: 'Tb', label: 'Temperatura da base', min: 30, max: 400, step: 1, valor: 100, unidade: '°C' },
        { id: 'Tinf', label: 'Temperatura do fluido', min: -20, max: 120, step: 1, valor: 25, unidade: '°C' },
        { id: 'corr', tipo: 'check', label: 'Usar comprimento corrigido Lc', valor: true,
          desc: 'Lc = L + t/2 (retangular) ou L + D/4 (pino): equivale a fechar a ponta e tratá-la como adiabática.' }
      ],
      graficos: [
        { id: 'perfil', xlabel: 'Posição ao longo da aleta x (mm)', ylabel: 'Temperatura (°C)', aspect: 0.48,
          legendPos: 'topright',
          legenda: 'As três hipóteses de ponta. Se mL > 2,5 as três coincidem — é por isso que a hipótese adiabática quase sempre basta.' },
        { id: 'eta', xlabel: 'Parâmetro mL', ylabel: 'Eficiência η', aspect: 0.45, xlim: [0, 5], ylim: [0, 1.05],
          legendPos: 'topright',
          legenda: 'η cai monotonicamente com mL: aleta comprida é fria na ponta e desperdiça material.' }
      ],
      saidas: [
        { id: 'm',   label: 'Parâmetro m' },
        { id: 'mL',  label: 'mL' },
        { id: 'Af',  label: 'Área da aleta' },
        { id: 'qf',  label: 'Calor pela aleta' },
        { id: 'eta', label: 'Eficiência η' },
        { id: 'eps', label: 'Efetividade ε' },
        { id: 'Rf',  label: 'Resistência da aleta' },
        { id: 'Tp',  label: 'Temperatura da ponta' }
      ],
      nota: 'Aleta retangular e triangular calculadas por metro de largura (w = 1 m); k constante, h uniforme, condução unidimensional. m = √(hP/kA_c) para as aletas de seção constante e m = √(2h/kt) para a triangular.',
      formulas: [
        { g: 'Parâmetro da aleta' },
        { tex: 'm = \\sqrt{\\frac{h\\cdot P}{k\\cdot A_{t}}}', d: 'P = perímetro, A_t = área da seção transversal', destaque: true },
        { tex: 'm = \\sqrt{\\frac{2h}{k\\cdot t}}', d: 'aleta retangular fina de espessura t (P ≈ 2w, A_t = w·t)', destaque: true },
        { tex: 'L_{c} = L + \\frac{t}{2}', d: 'comprimento corrigido: equivale à ponta adiabática' },

        { g: 'Distribuição de temperatura' },
        { tex: '\\theta \\frac{x}{\\theta_{b}} = \\cosh \\frac{m(L_{c} - x)}{\\cosh (m\\cdot L_{c})}', d: 'aleta com ponta adiabática; θ = T − T∞', destaque: true },
        { tex: '\\theta \\frac{x}{\\theta_{b}} = e^(- m\\cdot x)', d: 'aleta infinitamente longa' },

        { g: 'Taxa de calor e desempenho' },
        { tex: 'q_{a} = \\sqrt{h\\cdot P\\cdot k\\cdot A_{t}} \\cdot \\theta_{b} \\cdot \\tanh (m\\cdot L_{c})', d: 'calor dissipado por uma aleta', destaque: true },
        { tex: '\\eta_{a} = \\tanh \\frac{m\\cdot L_{c}}{m\\cdot L_{c}}', d: 'EFICIÊNCIA: real / se toda a aleta estivesse em T_base', destaque: true },
        { tex: 'q_{a} = \\eta_{a} \\cdot h \\cdot A_{\\text{aleta}} \\cdot \\theta_{b}', d: 'forma equivalente, usando a eficiência' },
        { tex: '\\varepsilon_{a} =\\frac{q_{\\text{com}} \\text{aleta}}{q_{\\text{sem}} \\text{aleta}}', d: 'EFETIVIDADE: só se justifica se ε_a > 2', destaque: true },
        { tex: '\\varepsilon_{a} =\\frac{\\eta_{a} \\cdot A_{\\text{aleta}}}{A_{\\text{base}}}', d: 'relação entre as duas métricas' },

        { g: 'Conjunto de aletas' },
        { tex: 'A_{\\text{total}} = N\\cdot A_{\\text{aleta}} + A_{\\text{livre}}', d: 'área total da superfície aletada' },
        { tex: '\\eta_{o} = 1 - (N\\cdot \\frac{A_{\\text{aleta}}}{A_{\\text{total}}})(1 - \\eta_{a})', d: 'eficiência global do conjunto' },
        { tex: 'q_{\\text{total}} = \\eta_{o} \\cdot h \\cdot A_{\\text{total}} \\cdot \\theta_{b}', d: '' },

        { g: 'Quando aletar' },
        { tex: '\\frac{h\\cdot t}{k < 0,25}', d: 'critério prático: aleta compensa do lado do GÁS, não do líquido', destaque: true },
        { tex: '\\varepsilon_{a} < 1 \\to a \\text{aleta ATRAPALHA}', d: 'ocorre com h alto ou material de baixa condutividade' }
      ],
      formulasTitulo: 'Fórmulas — aletas',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      calcular: function (p, ctx) {
        var k = KMAT[p.mat].k;
        var h = p.h, L = p.L / 1000, t = p.t / 1000, D = p.D / 1000;
        var thb = p.Tb - p.Tinf;
        var w = 1;

        var Ac, P, m, Lc, Af, Ap = 0;
        if (p.geo === 'pino') {
          Ac = Math.PI * D * D / 4; P = Math.PI * D;
          m = Math.sqrt(h * P / (k * Ac));
          Lc = p.corr ? L + D / 4 : L;
          Af = Math.PI * D * Lc + (p.corr ? 0 : Math.PI * D * D / 4);
        } else if (p.geo === 'tri') {
          Ac = w * t; P = 2 * w;
          m = Math.sqrt(2 * h / (k * t));
          Lc = L;
          Af = 2 * w * Math.sqrt(L * L + t * t / 4);
          Ap = L * t / 2;
        } else {
          Ac = w * t; P = 2 * (w + t);
          m = Math.sqrt(h * P / (k * Ac));
          Lc = p.corr ? L + t / 2 : L;
          Af = 2 * w * Lc + (p.corr ? 0 : w * t);
        }
        var mL = m * Lc;
        var mLbruto = m * L;

        /* --- calor e eficiência --- */
        var M = Math.sqrt(h * P * k * Ac) * thb;
        var qf, eta;
        if (p.geo === 'tri') {
          eta = (1 / mL) * I1(2 * mL) / I0(2 * mL);
          qf = eta * h * Af * thb;
        } else {
          qf = M * Math.tanh(mL);
          eta = qf / (h * Af * thb);
        }
        var eps = qf / (h * Ac * thb);
        var Rf = thb / qf;

        /* --- gráfico 1: T(x) para as três condições de ponta --- */
        var xs = Plot.linspace(0, L, 120);
        var xmm = xs.map(function (x) { return x * 1000; });
        var hmk = h / (m * k);
        var denC = Math.cosh(m * L) + hmk * Math.sinh(m * L);
        var Tad = [], Tcv = [], Tinf2 = [], Ttri = [];
        for (var i = 0; i < xs.length; i++) {
          var x = xs[i];
          Tad.push(p.Tinf + thb * Math.cosh(m * (L - x)) / Math.cosh(m * L));
          Tcv.push(p.Tinf + thb * (Math.cosh(m * (L - x)) + hmk * Math.sinh(m * (L - x))) / denC);
          Tinf2.push(p.Tinf + thb * Math.exp(-m * x));
          var xi = L - x;
          Ttri.push(p.Tinf + thb * I0(2 * m * Math.sqrt(L * xi)) / I0(2 * m * L));
        }
        var g1 = ctx.plot('perfil').clear();
        if (p.geo === 'tri') {
          g1.line(xmm, Ttri, { color: Plot.serie(0), width: 2.6, label: 'Perfil triangular (Bessel)' });
        }
        g1.line(xmm, Tad, { color: Plot.serie(1), width: 2.4, label: 'Ponta adiabática' })
          .line(xmm, Tcv, { color: Plot.serie(2), width: 2, dash: [7, 4], label: 'Convecção na ponta' })
          .line(xmm, Tinf2, { color: Plot.serie(4), width: 1.8, dash: [3, 3], label: 'Aleta infinita' })
          .hline(p.Tinf, { color: Plot.serie(6), dash: [4, 4], text: 'T∞ = ' + p.Tinf + ' °C' })
          .marker(0, p.Tb, 'base', { color: Plot.serie(1) })
          .draw();

        /* --- gráfico 2: eficiência x mL --- */
        var mLs = Plot.linspace(0.02, 5, 160);
        var etaRet = Plot.map(mLs, function (u) { return Math.tanh(u) / u; });
        var etaTri = Plot.map(mLs, function (u) { return (1 / u) * I1(2 * u) / I0(2 * u); });
        var g2 = ctx.plot('eta').clear()
          .line(mLs, etaRet, { color: Plot.serie(1), width: 2.4, label: 'Seção constante: η = tanh(mL)/mL' })
          .line(mLs, etaTri, { color: Plot.serie(0), width: 2, dash: [6, 4], label: 'Perfil triangular' })
          .hline(0.6, { color: Plot.serie(6), dash: [4, 4], text: 'η = 60 %' })
          .vline(2.65, { color: Plot.serie(3), dash: [5, 4], text: 'mL = 2,65 → tanh(mL) = 0,99' });
        g2.marker(Math.min(mL, 5), eta, 'projeto (η = ' + Math.round(eta * 100) + ' %)', { color: Plot.serie(2) });
        g2.draw();

        var Tponta = (p.geo === 'tri') ? Ttri[Ttri.length - 1] : Tad[Tad.length - 1];

        var nta = Plot.numTex, sga = Plot.sig;
        ctx.setPassos([
          { t: 'Geometria e propriedades',
            c: 'Geometria: ' + ({ ret: 'aleta retangular', tri: 'aleta triangular', pino: 'pino cilíndrico' })[p.geo] + '\\n' +
               'Material: ' + KMAT[p.mat].t + '   k = ' + k + ' W/m·K\\n' +
               'L = ' + p.L + ' mm   ' + (p.geo === 'pino' ? 'D = ' + p.D + ' mm' : 't = ' + p.t + ' mm') + '\\n' +
               'h = ' + h + ' W/m²·K   Tb = ' + p.Tb + ' °C   T∞ = ' + p.Tinf + ' °C' },
          { t: 'Excesso de temperatura na base',
            tex: '\\theta_b = T_b - T_\\infty',
            texSub: '\\theta_b = ' + p.Tb + ' - ' + p.Tinf + ' = ' + sga(thb, 4) + '\\ \\text{K}',
            obs: 'Toda a análise de aleta trabalha com o EXCESSO sobre o ambiente, não com a temperatura absoluta.' },
          { t: 'Parâmetro da aleta',
            tex: 'm = \\sqrt{\\frac{h\\,P}{k\\,A_t}}',
            texSub: 'm = \\sqrt{\\frac{' + h + ' \\cdot ' + nta(P, 4) + '}{' + k + ' \\cdot ' +
                    nta(Ac, 4) + '}} = ' + nta(m, 4) + '\\ \\text{m}^{-1}',
            obs: 'Quanto maior m, mais rápido a temperatura cai ao longo da aleta. Material bom condutor reduz m.' },
          { t: 'Comprimento corrigido',
            tex: 'L_c = L + \\frac{t}{2}',
            texSub: 'L_c = ' + nta(Lc, 4) + '\\ \\text{m} \\quad\\Rightarrow\\quad m L_c = ' + nta(mL, 4),
            obs: p.corr ? 'A correção equivale a tratar a ponta como adiabática — erro abaixo de 1 % para aletas usuais.'
                        : 'Correção de ponta desligada: a área da extremidade entra explicitamente.' },
          { t: 'Eficiência da aleta',
            tex: '\\eta_a = \\frac{\\tanh(m L_c)}{m L_c}',
            texSub: '\\eta_a = \\frac{\\tanh(' + nta(mL, 4) + ')}{' + nta(mL, 4) + '} = ' +
                    nta(eta, 4) + ' = ' + sga(eta * 100, 3) + '\\%',
            obs: 'Compara o calor real com o que sairia se TODA a aleta estivesse na temperatura da base.' },
          { t: 'Calor dissipado',
            tex: 'q_a = \\eta_a \\, h \\, A_{\\text{aleta}} \\, \\theta_b',
            texSub: 'q_a = ' + nta(eta, 4) + ' \\cdot ' + h + ' \\cdot ' + nta(Af, 4) + ' \\cdot ' +
                    sga(thb, 4) + ' = ' + nta(qf, 4) + '\\ \\text{W}' },
          { t: 'Efetividade — a aleta compensou?',
            tex: '\\varepsilon_a = \\frac{q_{\\text{com}\\ \\text{aleta}}}{q_{\\text{sem}\\ \\text{aleta}}} = \\frac{q_a}{h A_c \\theta_b}',
            texSub: '\\varepsilon_a = \\frac{' + nta(qf, 4) + '}{' + h + ' \\cdot ' + nta(Ac, 4) +
                    ' \\cdot ' + sga(thb, 4) + '} = ' + nta(eps, 4),
            r: eps < 1 ? 'ε < 1 — a aleta ATRAPALHA'
                       : eps < 2 ? 'ε < 2 — ganho pequeno, não compensa'
                                 : 'ε > 2 — aleta justificada',
            obs: 'Critério prático: aletar quando h·t/k < 0,25, ou seja, do lado do GÁS, não do líquido. Aqui h·t/k = ' +
                 sga(h * (p.geo === 'pino' ? D : t) / k, 3) + '.' }
        ]);

        return {
          m:   { v: m, u: '1/m' },
          mL:  { v: mL, classe: mL > 3 ? 'alerta' : (mL < 0.5 ? 'ok' : '') },
          Af:  { v: Af, u: 'm²' },
          qf:  { v: qf, u: 'W', classe: 'destaque' },
          eta: { v: eta * 100, u: '%', classe: eta < 0.5 ? 'alerta' : 'ok' },
          eps: { v: eps, u: '', classe: eps < 2 ? 'alerta' : 'ok' },
          Rf:  { v: Rf, u: 'K/W' },
          Tp:  { v: Tponta, u: '°C' }
        };
      }
    });
  })();

  /* ============================================================
     3. sim-trocador — MLDT e ε-NUT
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-trocador')) return;

    function efetividade(tipo, NUT, Cr) {
      if (NUT <= 0) return 0;
      if (Cr < 1e-6) return 1 - Math.exp(-NUT);
      if (tipo === 'paralelo') {
        return (1 - Math.exp(-NUT * (1 + Cr))) / (1 + Cr);
      }
      if (tipo === 'casco') {
        var s = Math.sqrt(1 + Cr * Cr);
        var e = Math.exp(-NUT * s);
        return 2 / (1 + Cr + s * (1 + e) / (1 - e));
      }
      if (tipo === 'cruzado') {
        return 1 - Math.exp((1 / Cr) * Math.pow(NUT, 0.22) * (Math.exp(-Cr * Math.pow(NUT, 0.78)) - 1));
      }
      /* contracorrente */
      if (Math.abs(1 - Cr) < 1e-6) return NUT / (1 + NUT);
      var x = Math.exp(-NUT * (1 - Cr));
      return (1 - x) / (1 - Cr * x);
    }

    /* NUT de contracorrente que produz a mesma efetividade */
    function nutEquivCC(eps, Cr) {
      if (!(eps > 0)) return 0;
      if (Math.abs(1 - Cr) < 1e-6) return eps >= 0.999 ? 999 : eps / (1 - eps);
      var arg = (eps - 1) / (eps * Cr - 1);
      if (!(arg > 0)) return 999;
      return Math.log(arg) / (Cr - 1);
    }

    Sim.build('#sim-trocador', {
      titulo: '3. Trocador de calor — MLDT e ε-NUT',
      descricao: 'Os dois métodos no mesmo modelo. Veja o perfil de temperatura que explica a vantagem do contracorrente e onde o paralelo trava por cruzamento de temperatura.',
      controlesLargos: true,
      controles: [
        { id: 'tipo', tipo: 'select', label: 'Arranjo', valor: 'contra',
          opcoes: [
            { v: 'contra', t: 'Contracorrente' },
            { v: 'paralelo', t: 'Corrente paralela' },
            { v: 'casco', t: 'Casco-tubo 1 casco / 2 passes' },
            { v: 'cruzado', t: 'Corrente cruzada, ambos não misturados' }
          ] },
        { tipo: 'titulo', label: 'Fluido quente' },
        { id: 'mh', label: 'Vazão mássica quente', min: 0.05, max: 10, step: 0.05, valor: 2, unidade: 'kg/s' },
        { id: 'cph', label: 'cp quente', min: 0.8, max: 5, step: 0.01, valor: 4.18, unidade: 'kJ/kg·K',
          desc: 'Água 4,18 · óleo 2,0 · ar 1,005 · vapor superaquecido ≈ 2,0' },
        { id: 'Thi', label: 'Entrada do quente', min: 40, max: 250, step: 1, valor: 90, unidade: '°C' },
        { tipo: 'titulo', label: 'Fluido frio' },
        { id: 'mc', label: 'Vazão mássica fria', min: 0.05, max: 10, step: 0.05, valor: 1, unidade: 'kg/s' },
        { id: 'cpc', label: 'cp frio', min: 0.8, max: 5, step: 0.01, valor: 4.18, unidade: 'kJ/kg·K' },
        { id: 'Tci', label: 'Entrada do frio', min: -10, max: 120, step: 1, valor: 25, unidade: '°C' },
        { tipo: 'separador' },
        { id: 'U', label: 'Coeficiente global U', min: 50, max: 3000, step: 10, valor: 800, unidade: 'W/m²·K' },
        { id: 'A', label: 'Área de troca A', min: 0.2, max: 60, step: 0.2, valor: 10, unidade: 'm²' }
      ],
      graficos: [
        { id: 'perfil', xlabel: 'Fração da área de troca percorrida', ylabel: 'Temperatura (°C)', aspect: 0.48,
          legendPos: 'topright',
          legenda: 'No contracorrente as curvas correm juntas e a diferença motriz se mantém; no paralelo elas convergem e a troca morre na metade do equipamento.' },
        { id: 'enut', xlabel: 'NUT = U·A / C_mín', ylabel: 'Efetividade ε', aspect: 0.45, xlim: [0, 5], ylim: [0, 1.02],
          legendPos: 'bottomright',
          legenda: 'Acima de NUT ≈ 3 a curva satura: dobrar a área quase não aumenta a troca — é o limite econômico do projeto.' }
      ],
      saidas: [
        { id: 'Cmin', label: 'C mínimo' },
        { id: 'Cr',   label: 'Razão Cr' },
        { id: 'NUT',  label: 'NUT' },
        { id: 'eps',  label: 'Efetividade ε' },
        { id: 'q',    label: 'Carga térmica q' },
        { id: 'Tho',  label: 'Saída do quente' },
        { id: 'Tco',  label: 'Saída do frio' },
        { id: 'mldt', label: 'MLDT' },
        { id: 'F',    label: 'Fator de correção F' },
        { id: 'cruz', label: 'Aproximação Th,sai − Tc,sai' }
      ],
      nota: 'Regime permanente, U e cp constantes, perdas para o ambiente desprezíveis e sem mudança de fase. Para casco-tubo e corrente cruzada o perfil é traçado como o contracorrente equivalente (mesma efetividade), que é a base do fator F.',
      formulas: [
        { g: 'Balanços de energia' },
        { tex: 'q = \\dot{m}_{q}\\cdot c_{p},q\\cdot (T_{q},\\text{ent} - T_{q},\\text{sai})', d: 'lado quente', destaque: true },
        { tex: 'q = \\dot{m}_{f}\\cdot c_{p},f\\cdot (T_{f},\\text{sai} - T_{f},\\text{ent})', d: 'lado frio — o mesmo q', destaque: true },
        { tex: 'C = \\dot{m}\\cdot c_{p}', d: 'capacidade calorífica de corrente, em W/K' },

        { g: 'Método MLDT (temperaturas conhecidas)' },
        { tex: 'q = U\\cdot A\\cdot F\\cdot \\Delta T_{\\text{ml}}', d: 'equação de projeto', destaque: true },
        { tex: '\\Delta T_{\\text{ml}} = \\frac{\\Delta T_{1} - \\Delta T_{2}}{\\ln (\\Delta T_{1}/\\Delta T_{2})}', d: 'média logarítmica', destaque: true },
        { tex: '\\text{Contracorrente}: \\Delta T_{1} = T_{q},e - T_{f},s', d: 'e ΔT₂ = T_q,s − T_f,e' },
        { tex: '\\text{Paralelo}: \\Delta T_{1} = T_{q},e - T_{f},e', d: 'e ΔT₂ = T_q,s − T_f,s' },
        { tex: 'Se \\Delta T_{1} = \\Delta T_{2} \\to \\Delta T_{\\text{ml}} = \\Delta T', d: 'caso degenerado: a fórmula dá 0/0' },
        { tex: 'F = 1', d: 'contracorrente e paralelo puros; F < 1 em casco-tubo e corrente cruzada' },

        { g: 'Coeficiente global e incrustação' },
        { tex: '\\frac{1}{U\\cdot A} = \\frac{1}{h_{i}A_{i}} + R_{\\text{parede}} + \\frac{1}{h_{e}A_{e}}', d: 'soma das resistências' },
        { tex: '+ R\'\' \\frac{_{f},i}{A_{i}} + R\'\' \\frac{_{f},e}{A_{e}}', d: 'fatores de incrustação (fouling), tabelados pela TEMA' },

        { g: 'Método ε-NUT (saídas desconhecidas)' },
        { tex: 'C_{r} =\\frac{C_{\\text{mín}}}{C_{\\text{máx}}}', d: 'sempre ≤ 1 por definição', destaque: true },
        { tex: '\\mathrm{NUT} =\\frac{U\\cdot A}{C_{\\text{mín}}}', d: 'número de unidades de transferência ∝ área', destaque: true },
        { tex: 'q_{\\text{máx}} = C_{\\text{mín}}\\cdot (T_{q},\\text{ent} - T_{f},\\text{ent})', d: 'usa C_MÍN — é ele que limita a troca', destaque: true },
        { tex: '\\varepsilon =\\frac{q}{q_{\\text{máx}}}', d: 'eficácia' },
        { tex: '\\varepsilon = \\frac{1 - e^(- \\mathrm{NUT}(1- Cr))}{1 - Cr\\cdot e^(- \\mathrm{NUT}(1- Cr))}', d: 'contracorrente', destaque: true },
        { tex: '\\varepsilon = \\frac{1 - e^(- \\mathrm{NUT}(1+Cr))}{1 + Cr}', d: 'paralelo' },
        { tex: '\\varepsilon = \\frac{\\mathrm{NUT}}{1 + \\mathrm{NUT}}', d: 'contracorrente com Cr = 1' },
        { tex: '\\varepsilon = 1 - e^(- \\mathrm{NUT})', d: 'Cr = 0: condensador ou evaporador — independe do arranjo' }
      ],
      formulasTitulo: 'Fórmulas — trocadores de calor',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      calcular: function (p, ctx) {
        var Ch = p.mh * p.cph * 1000, Cc = p.mc * p.cpc * 1000;
        var Cmin = Math.min(Ch, Cc), Cmax = Math.max(Ch, Cc);
        var Cr = Cmin / Cmax;
        var UA = p.U * p.A;
        var NUT = UA / Cmin;
        var dTmax = p.Thi - p.Tci;
        var eps = efetividade(p.tipo, NUT, Cr);
        var q = eps * Cmin * dTmax;
        var Tho = p.Thi - q / Ch;
        var Tco = p.Tci + q / Cc;

        /* MLDT do arranjo (contracorrente para casco-tubo e cruzado) */
        var d1, d2, mldt, F;
        if (p.tipo === 'paralelo') {
          d1 = p.Thi - p.Tci; d2 = Tho - Tco;
          mldt = mlog(d1, d2);
        } else {
          d1 = p.Thi - Tco; d2 = Tho - p.Tci;
          mldt = mlog(d1, d2);
        }
        F = (mldt > 0) ? q / (UA * mldt) : NaN;

        /* --- gráfico 1: perfil ao longo do trocador --- */
        var n = 200, dxi = 1 / n;
        var UAe = UA;
        if (p.tipo === 'casco' || p.tipo === 'cruzado') UAe = nutEquivCC(eps, Cr) * Cmin;
        var y0, fode;
        if (p.tipo === 'paralelo') {
          y0 = [p.Thi, p.Tci];
          fode = function (xi, y) {
            var dd = y[0] - y[1];
            return [-UAe * dd / Ch, UAe * dd / Cc];
          };
        } else {
          y0 = [p.Thi, Tco];
          fode = function (xi, y) {
            var dd = y[0] - y[1];
            return [-UAe * dd / Ch, -UAe * dd / Cc];
          };
        }
        var sol = Plot.rk4(fode, 0, y0, dxi, n);
        var xi = sol.t, Th = sol.y.map(function (v) { return v[0]; }), Tc = sol.y.map(function (v) { return v[1]; });

        var g1 = ctx.plot('perfil').clear()
          .line(xi, Th, { color: Plot.serie(3), width: 2.6, label: 'Fluido quente' })
          .line(xi, Tc, { color: Plot.serie(0), width: 2.6, label: 'Fluido frio' })
          .hline(p.Thi, { color: Plot.serie(6), dash: [3, 3] })
          .hline(p.Tci, { color: Plot.serie(6), dash: [3, 3] })
          .marker(1, Th[Th.length - 1], 'Th,sai = ' + Plot.sig(Tho, 4) + ' °C', { color: Plot.serie(3), align: 'right', dx: -8 });
        if (p.tipo === 'paralelo') {
          g1.marker(1, Tc[Tc.length - 1], 'Tc,sai = ' + Plot.sig(Tco, 4) + ' °C', { color: Plot.serie(0), align: 'right', dx: -8, dy: 16 });
        } else {
          g1.marker(0, Tc[0], 'Tc,sai = ' + Plot.sig(Tco, 4) + ' °C', { color: Plot.serie(0), dx: 8 });
        }
        g1.draw();

        /* --- gráfico 2: ε x NUT --- */
        var nuts = Plot.linspace(0.02, 5, 140);
        var g2 = ctx.plot('enut').clear();
        [0, 0.25, 0.5, 0.75, 1].forEach(function (cr, i) {
          g2.line(nuts, Plot.map(nuts, function (u) { return efetividade(p.tipo, u, cr); }),
            { color: Plot.serie(i), width: i === 0 ? 1.6 : 2, label: 'Cr = ' + cr.toFixed(2) });
        });
        g2.marker(Math.min(NUT, 5), eps, 'projeto', { color: Plot.serie(3) })
          .vline(3, { color: Plot.serie(6), dash: [5, 4], text: 'saturação prática' })
          .draw();

        /* --- alertas --- */
        var aprox = Tho - Tco;
        var epsCC = efetividade('contra', NUT, Cr);
        var TcoCC = p.Tci + epsCC * Cmin * dTmax / Cc;
        var ThoCC = p.Thi - epsCC * Cmin * dTmax / Ch;
        var haveriaCruz = TcoCC > ThoCC;
        var classeCruz = '';
        var textoCruz = Plot.sig(aprox, 3) + ' K';
        if (p.tipo === 'paralelo') {
          if (aprox < 3) { classeCruz = 'alerta'; textoCruz = Plot.sig(aprox, 3) + ' K — pinch'; }
          else if (haveriaCruz) { classeCruz = 'alerta'; textoCruz = Plot.sig(aprox, 3) + ' K — cruzamento impossível'; }
        } else if (aprox < 0) {
          classeCruz = 'ok';
          textoCruz = Plot.sig(aprox, 3) + ' K — cruzamento (só no contracorrente)';
        }

        var ntt = Plot.numTex, sgt = Plot.sig;
        ctx.setPassos([
          { t: 'Capacidades caloríficas das correntes',
            tex: 'C = \\dot{m} \\, c_p',
            texSub: 'C_q = ' + p.mh + ' \\cdot ' + p.cph + ' = ' + ntt(Ch, 5) +
                    '\\ \\text{W/K} \\qquad C_f = ' + p.mc + ' \\cdot ' + p.cpc + ' = ' +
                    ntt(Cc, 5) + '\\ \\text{W/K}',
            obs: 'Quem tem MENOR C sofre a maior variação de temperatura — e é ele que limita a troca.' },
          { t: 'Razão de capacidades',
            tex: 'C_r = \\frac{C_{\\text{min}}}{C_{\\text{max}}}',
            texSub: 'C_r = \\frac{' + ntt(Cmin, 5) + '}{' + ntt(Math.max(Ch, Cc), 5) + '} = ' +
                    ntt(Cr, 3),
            obs: 'Sempre entre 0 e 1. Cr = 0 é mudança de fase (condensador ou evaporador).' },
          { t: 'Número de unidades de transferência',
            tex: '\\mathrm{NUT} = \\frac{U A}{C_{\\text{min}}}',
            texSub: '\\mathrm{NUT} = \\frac{' + p.U + ' \\cdot ' + p.A + '}{' + ntt(Cmin, 5) + '} = ' +
                    ntt(NUT, 4),
            obs: NUT > 3 ? 'Acima de NUT = 3 a eficácia satura: dobrar a área quase não aumenta a troca.'
                         : 'Faixa econômica usual de projeto: NUT entre 1 e 3.' },
          { t: 'Calor máximo termodinamicamente possível',
            tex: 'q_{\\text{max}} = C_{\\text{min}}\\,(T_{q,\\text{ent}} - T_{f,\\text{ent}})',
            texSub: 'q_{\\text{max}} = ' + ntt(Cmin, 5) + ' \\cdot (' + p.Thi + ' - ' + p.Tci + ') = ' +
                    ntt(Cmin * dTmax / 1000, 4) + '\\ \\text{kW}',
            obs: 'Ocorreria em um trocador de área infinita em contracorrente.' },
          { t: 'Eficácia do arranjo escolhido',
            tex: '\\varepsilon = \\frac{1 - e^{-\\mathrm{NUT}(1-C_r)}}{1 - C_r\\,e^{-\\mathrm{NUT}(1-C_r)}}',
            texSub: '\\varepsilon = ' + ntt(eps, 4) + ' = ' + sgt(eps * 100, 3) + '\\%',
            obs: 'Arranjo: ' + ({ contra: 'contracorrente', paralelo: 'paralelo' })[p.tipo] ||
                 'conforme selecionado' },
          { t: 'Calor efetivamente trocado',
            tex: 'q = \\varepsilon \\, q_{\\text{max}}',
            texSub: 'q = ' + ntt(eps, 4) + ' \\cdot ' + ntt(Cmin * dTmax / 1000, 4) + ' = ' +
                    ntt(q / 1000, 4) + '\\ \\text{kW}' },
          { t: 'Temperaturas de saída',
            tex: 'T_{q,\\text{sai}} = T_{q,\\text{ent}} - \\frac{q}{C_q} \\qquad T_{f,\\text{sai}} = T_{f,\\text{ent}} + \\frac{q}{C_f}',
            texSub: 'T_{q,\\text{sai}} = ' + sgt(Tho, 4) + '\\ ^\\circ\\text{C} \\qquad T_{f,sai} = ' +
                    sgt(Tco, 4) + '\\ ^\\circ\\text{C}',
            obs: 'Em contracorrente a saída do frio PODE superar a saída do quente — impossível em paralelo.' },
          { t: 'Conferência pela MLDT',
            tex: '\\Delta T_{\\text{ml}} = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1/\\Delta T_2)} \\qquad q = U A F \\Delta T_{\\text{ml}}',
            texSub: '\\Delta T_{\\text{ml}} = ' + sgt(mldt, 4) + '\\ \\text{K} \\qquad F = ' + sgt(F, 3),
            obs: 'Os dois métodos têm que dar o mesmo q. MLDT é melhor no dimensionamento; ε-NUT, na análise de desempenho.' }
        ]);

        return {
          Cmin: { v: Cmin, u: 'W/K' },
          Cr:   { v: Cr },
          NUT:  { v: NUT, classe: NUT > 3 ? 'alerta' : '' },
          eps:  { v: eps * 100, u: '%', classe: 'destaque' },
          q:    { v: q / 1000, u: 'kW', classe: 'destaque' },
          Tho:  { v: Tho, u: '°C' },
          Tco:  { v: Tco, u: '°C' },
          mldt: { v: mldt, u: 'K' },
          F:    { v: F, classe: (isFinite(F) && F < 0.75) ? 'alerta' : 'ok' },
          cruz: { v: textoCruz, classe: classeCruz }
        };
      }
    });
  })();

  /* ============================================================
     4. sim-radiacao — Planck, Wien e troca entre cinzas
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-radiacao')) return;

    Sim.build('#sim-radiacao', {
      titulo: '4. Radiação térmica — Planck, Wien e troca entre superfícies cinzas',
      descricao: 'A distribuição espectral com o pico de Wien marcado e a troca líquida entre duas superfícies cinzas, comparada lado a lado com a convecção.',
      controles: [
        { id: 'T1', label: 'Temperatura da superfície 1', min: 300, max: 3200, step: 10, valor: 800, unidade: 'K' },
        { id: 'T2', label: 'Temperatura da superfície 2 / vizinhança', min: 250, max: 1500, step: 10, valor: 300, unidade: 'K' },
        { tipo: 'separador' },
        { id: 'cfg', tipo: 'select', label: 'Configuração', valor: 'placas',
          opcoes: [
            { v: 'placas', t: 'Placas paralelas grandes' },
            { v: 'recinto', t: 'Superfície pequena em recinto grande' },
            { v: 'geral', t: 'Geral: F₁₂ e A₂/A₁ ajustáveis' }
          ] },
        { id: 'e1', label: 'Emissividade ε₁', min: 0.05, max: 1, step: 0.01, valor: 0.8, unidade: '',
          desc: 'Alumínio polido 0,05 · aço oxidado 0,8 · tinta preta 0,95 · tijolo 0,93' },
        { id: 'e2', label: 'Emissividade ε₂', min: 0.05, max: 1, step: 0.01, valor: 0.3, unidade: '' },
        { id: 'F12', label: 'Fator de forma F₁₂', min: 0.05, max: 1, step: 0.01, valor: 1, unidade: '' },
        { id: 'rA', label: 'Razão de áreas A₂/A₁', min: 0.5, max: 20, step: 0.5, valor: 1, unidade: '' },
        { tipo: 'separador' },
        { id: 'h', label: 'Coeficiente de convecção h', min: 2, max: 200, step: 1, valor: 10, unidade: 'W/m²·K',
          desc: 'Convecção natural em ar: 5 a 25 W/m²·K' },
        { id: 'verT2', tipo: 'check', label: 'Mostrar também o espectro de T₂', valor: false }
      ],
      graficos: [
        { id: 'planck', xlabel: 'Comprimento de onda λ (µm)', ylabel: 'E_λ,b (W/m²·µm)', aspect: 0.48,
          legendPos: 'topright',
          legenda: 'Faixa visível sombreada (0,38–0,78 µm). Enquanto o pico de Wien não chega perto dela, o corpo aquecido não brilha.' },
        { id: 'dom', xlabel: 'Temperatura da superfície 1 (K)', ylabel: 'Fluxo líquido (W/m²)', aspect: 0.45,
          legendPos: 'topleft',
          legenda: 'Radiação cresce com T⁴ e convecção com T: existe uma temperatura de cruzamento acima da qual a radiação domina.' }
      ],
      saidas: [
        { id: 'Eb',   label: 'Poder emissivo de corpo negro' },
        { id: 'E',    label: 'Poder emissivo da superfície' },
        { id: 'lmax', label: 'λ do pico (Wien)' },
        { id: 'fvis', label: 'Fração no visível' },
        { id: 'q',    label: 'Troca líquida q₁₂' },
        { id: 'hr',   label: 'h radiante equivalente' },
        { id: 'qc',   label: 'Convecção q_conv' },
        { id: 'raz',  label: 'q_rad / q_conv' },
        { id: 'Tcr',  label: 'Temperatura de cruzamento' }
      ],
      nota: 'Superfícies cinzas, difusas e isotérmicas; meio não participante. σ = 5,670×10⁻⁸ W/m²·K⁴, C₁ = 3,742×10⁸ W·µm⁴/m², C₂ = 14 388 µm·K. Fluxos por m² da superfície 1; a convecção usa T₂ como temperatura do fluido.',
      formulas: [
        { g: 'Corpo negro' },
        { tex: 'E_{b} = \\sigma \\cdot T^{4}', d: 'Stefan-Boltzmann; σ = 5,67×10⁻⁸ W/m²·K⁴, T em KELVIN', destaque: true },
        { tex: 'E_\\lambda b =\\frac{C_{1}}{\\lambda^{5}\\cdot [e^(C_{2}/\\lambda T) - 1]}', d: 'distribuição de Planck' },
        { tex: '\\lambda_{\\text{máx}} \\cdot T = 2 898 \\mu m\\cdot K', d: 'Lei do deslocamento de Wien', destaque: true },
        { tex: 'C_{1} = 3,742\\times 10^{8} W\\cdot \\frac{\\mu m^{4}}{m^{2}}', d: 'C₂ = 1,439×10⁴ μm·K' },

        { g: 'Superfícies reais' },
        { tex: 'E = \\varepsilon \\cdot \\sigma \\cdot T^{4}', d: 'ε = emissividade (0 a 1)', destaque: true },
        { tex: '\\alpha + \\rho + \\tau = 1', d: 'absortividade + refletividade + transmissividade' },
        { tex: '\\alpha = \\varepsilon', d: 'Lei de Kirchhoff: superfície cinza e difusa; bom emissor = bom absorvedor', destaque: true },

        { g: 'Fator de forma' },
        { tex: '\\Sigma ⱼ F_{\\text{ij}} = 1', d: 'regra da soma: tudo que sai de i chega em algum lugar' },
        { tex: 'A_{i}\\cdot F_{\\text{ij}} = Aⱼ\\cdot F_{\\text{ji}}', d: 'regra da reciprocidade', destaque: true },
        { tex: 'F_{\\text{ii}} = 0', d: 'superfície plana ou convexa não enxerga a si mesma' },

        { g: 'Troca entre superfícies' },
        { tex: 'q = \\varepsilon \\cdot \\sigma \\cdot A\\cdot (Ts^{4} - \\text{Tviz}^{4})', d: 'pequena superfície dentro de grande cavidade', destaque: true },
        { tex: 'q\'\' = \\sigma \\frac{T_{1}^{4} - T_{2}^{4}}{1/\\varepsilon_{1} + 1/\\varepsilon_{2} - 1}', d: 'duas placas paralelas infinitas', destaque: true },
        { tex: 'q = \\sigma \\frac{T_{1}^{4}- T_{2}^{4}}{(1- \\varepsilon_{1})/(\\varepsilon_{1}A_{1}) + 1/(A_{1}F_{12}) + (1- \\varepsilon_{2})/(\\varepsilon_{2}A_{2})}', d: 'circuito de duas superfícies cinzas' },
        { tex: 'h_{r} = \\varepsilon \\cdot \\sigma \\cdot (Ts+\\text{Tviz})(Ts^{2}+\\text{Tviz}^{2})', d: 'coeficiente de radiação equivalente — permite somar com h de convecção', destaque: true },
        { tex: 'q_{\\text{total}} = (h_{\\text{conv}} + h_{r})\\cdot A\\cdot \\Delta T', d: 'perto da ambiente, h_r é da mesma ordem de h_conv natural' }
      ],
      formulasTitulo: 'Fórmulas — radiação térmica',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      calcular: function (p, ctx) {
        var T1 = p.T1, T2 = p.T2;

        /* --- resistência radiante por m² de A1 --- */
        function Rrad() {
          if (p.cfg === 'placas') return 1 / p.e1 + 1 / p.e2 - 1;
          if (p.cfg === 'recinto') return 1 / p.e1;
          return (1 - p.e1) / p.e1 + 1 / p.F12 + (1 - p.e2) / (p.e2 * p.rA);
        }
        var R = Rrad();
        function qrad(T) { return SIGMA * (Math.pow(T, 4) - Math.pow(T2, 4)) / R; }
        function qconv(T) { return p.h * (T - T2); }

        var q = qrad(T1);
        var qc = qconv(T1);
        var Eb = SIGMA * Math.pow(T1, 4);
        var E = p.e1 * Eb;
        var lmax = 2897.8 / T1;
        var fvis = fracCN(LMB_VIS_2 * T1) - fracCN(LMB_VIS_1 * T1);
        var hr = (Math.abs(T1 - T2) > 1e-6) ? q / (T1 - T2) : 0;

        /* --- gráfico 1: distribuição de Planck --- */
        var lmA = 0.05, lmB = Math.max(6 * lmax, 1.2);
        var ls = Plot.linspace(lmA, lmB, 300);
        var es = Plot.map(ls, function (l) { return planck(l, T1); });
        var g1 = ctx.plot('planck').clear();
        var lv = [], ev = [];
        for (var i = 0; i < ls.length; i++) {
          if (ls[i] >= LMB_VIS_1 && ls[i] <= LMB_VIS_2) { lv.push(ls[i]); ev.push(es[i]); }
        }
        if (lv.length > 1) g1.area(lv, ev, { color: Plot.serie(5), alpha: 0.3, base: 0, stroke: false, label: 'faixa visível' });
        g1.line(ls, es, { color: Plot.serie(1), width: 2.6, label: 'Corpo negro a ' + T1 + ' K' });
        if (p.verT2) g1.line(ls, Plot.map(ls, function (l) { return planck(l, T2); }), { color: Plot.serie(0), width: 2, dash: [6, 4], label: 'Corpo negro a ' + T2 + ' K' });
        g1.vline(lmax, { color: Plot.serie(3), dash: [5, 4], text: 'Wien: λmáx = ' + Plot.sig(lmax, 3) + ' µm' })
          .marker(lmax, planck(lmax, T1), '', { color: Plot.serie(3) })
          .draw();

        /* --- gráfico 2: radiação x convecção --- */
        var Ta = T2 + 5, Tb = T2 + 900;
        var Ts = Plot.linspace(Ta, Tb, 200);
        var Tcross = Plot.bissec(function (T) { return qrad(T) - qconv(T); }, Ta, T2 + 4000);
        var g2 = ctx.plot('dom').clear()
          .line(Ts, Plot.map(Ts, qrad), { color: Plot.serie(3), width: 2.6, label: 'Radiação  ∝ (T⁴ − T₂⁴)' })
          .line(Ts, Plot.map(Ts, qconv), { color: Plot.serie(0), width: 2.4, label: 'Convecção  h·(T − T₂)' });
        if (isFinite(Tcross) && Tcross > Ta && Tcross < Tb) {
          g2.vline(Tcross, { color: Plot.serie(6), dash: [5, 4], text: 'cruzamento ' + Math.round(Tcross) + ' K' })
            .marker(Tcross, qconv(Tcross), 'radiação passa a dominar', { color: Plot.serie(6) });
        }
        g2.marker(Plot.clamp(T1, Ta, Tb), qrad(Plot.clamp(T1, Ta, Tb)), 'ponto atual', { color: Plot.serie(2) })
          .draw();

        var ntr = Plot.numTex, sgr = Plot.sig;
        ctx.setPassos([
          { t: 'Poder emissivo do corpo negro',
            tex: 'E_b = \\sigma T^4 \\qquad \\sigma = 5{,}67\\times10^{-8}\\ \\text{W/m}^2\\text{K}^4',
            texSub: 'E_b = 5{,}67\\times10^{-8} \\cdot (' + p.T1 + ')^4 = ' + ntr(Eb, 4) +
                    '\\ \\text{W/m}^2',
            obs: 'T em KELVIN, obrigatoriamente. A dependência é de quarta potência: dobrar T multiplica por 16.' },
          { t: 'Superfície real',
            tex: 'E = \\varepsilon \\, \\sigma T^4',
            texSub: 'E = ' + p.e1 + ' \\cdot ' + ntr(Eb, 4) + ' = ' + ntr(E, 4) + '\\ \\text{W/m}^2',
            obs: 'ε é a emissividade: 1 para corpo negro, 0,9 para tinta fosca, 0,05 para alumínio polido.' },
          { t: 'Comprimento de onda de pico (Wien)',
            tex: '\\lambda_{\\text{max}} \\, T = 2898\\ \\mu\\text{m·K}',
            texSub: '\\lambda_{\\text{max}} = \\frac{2898}{' + p.T1 + '} = ' + sgr(lmax, 4) + '\\ \\mu\\text{m}',
            obs: lmax < 0.78
              ? 'Abaixo de 0,78 µm: parte da emissão já é visível — o corpo brilha.'
              : 'Acima de 0,78 µm: emissão no infravermelho, invisível a olho nu. O Sol (5800 K) emite em 0,50 µm.' },
          { t: 'Troca líquida entre as superfícies',
            tex: 'q = \\frac{\\sigma (T_1^4 - T_2^4)}{\\frac{1-\\varepsilon_1}{\\varepsilon_1} + \\frac{1}{F_{12}} + \\frac{1-\\varepsilon_2}{\\varepsilon_2}}',
            texSub: 'q = ' + ntr(q, 4) + '\\ \\text{W/m}^2',
            obs: 'O denominador reúne as resistências de superfície e a resistência geométrica 1/F₁₂.' },
          { t: 'Coeficiente de radiação equivalente',
            tex: 'h_r = \\varepsilon \\sigma (T_1 + T_2)(T_1^2 + T_2^2)',
            texSub: 'h_r = ' + ntr(hr, 4) + '\\ \\text{W/m}^2\\text{·K}',
            obs: 'Linearizar assim permite SOMAR radiação com convecção: q_total = (h_conv + h_r)·A·ΔT.' },
          { t: 'Radiação versus convecção',
            texSub: 'q_{\\text{rad}} = ' + ntr(q, 4) + '\\ \\text{W/m}^2 \\qquad q_{conv} = ' + ntr(qc, 4) +
                    '\\ \\text{W/m}^2',
            r: Math.abs(qc) > 1e-9
              ? (q / qc > 1 ? 'A radiação DOMINA (' + sgr(q / qc, 3) + '× a convecção)'
                            : 'A convecção domina (' + sgr(qc / q, 3) + '× a radiação)')
              : 'Sem convecção',
            obs: 'Perto da temperatura ambiente as duas são da mesma ordem — desprezar a radiação pode subestimar a perda pela metade.' }
        ]);

        return {
          Eb:   { v: Eb, u: 'W/m²' },
          E:    { v: E, u: 'W/m²' },
          lmax: { v: lmax, u: 'µm', classe: (lmax < LMB_VIS_2 * 1.6) ? 'alerta' : '' },
          fvis: { v: fvis * 100, u: '%' },
          q:    { v: q, u: 'W/m²', classe: 'destaque' },
          hr:   { v: hr, u: 'W/m²·K' },
          qc:   { v: qc, u: 'W/m²' },
          raz:  { v: Math.abs(qc) > 1e-9 ? q / qc : NaN, classe: (Math.abs(qc) > 1e-9 && q / qc > 1) ? 'alerta' : 'ok' },
          Tcr:  { v: isFinite(Tcross) ? Tcross : NaN, u: 'K' }
        };
      }
    });
  })();

})();

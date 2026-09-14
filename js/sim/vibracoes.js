/* ============================================================
   Vibrações — simuladores
     1. sim-livre      : vibração livre de 1 GDL, os três regimes
     2. sim-forcada    : resposta forçada, ressonância e fase
     3. sim-isolamento : transmissibilidade e projeto de isoladores
     4. sim-2gdl       : dois graus de liberdade e absorvedor dinâmico
   ============================================================ */
(function () {
  'use strict';

  /* laco de animacao compartilhado: cada modelo registra um quadro e ele
     so faz algo quando aquele simulador esta com a animacao ligada */
  var quadros = [];
  function registrarQuadro(fn) { quadros.push(fn); }
  (function laco() {
    for (var iq = 0; iq < quadros.length; iq++) {
      try { quadros[iq](); } catch (e) { /* um modelo com erro nao trava os outros */ }
    }
    requestAnimationFrame(laco);
  })();

  var Gg = 9.81;

  /* ============================================================
     1. Vibração livre de 1 GDL
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-livre')) return;

    /* estado compartilhado entre o modelo e o laço de animação */
    var anim = {
      ativo: false, t0: 0, ctx: null, p: null,
      resposta: null, wn: 0, zeta: 0, amp: 1, tmax: 3, vel: 1
    };

    function desenharSistema(c, pl, x, xmax) {
      /* x = deslocamento atual em mm, xmax = escala */
      var X0 = pl.px(0);
      var yTeto = pl.py(1);
      var esc = 62 / Math.max(xmax, 1e-6);          /* mm -> pixels */
      var yEq = pl.py(0);                            /* posição de equilíbrio */
      var yM = yEq + x * esc;                        /* desloc. positivo = para baixo */

      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');

      /* teto com hachura */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X0 - 95, yTeto); c.lineTo(X0 + 95, yTeto); c.stroke();
      c.lineWidth = 1.1; c.strokeStyle = faint;
      for (var k = -95; k <= 88; k += 9) {
        c.beginPath(); c.moveTo(X0 + k, yTeto); c.lineTo(X0 + k + 8, yTeto - 9); c.stroke();
      }

      /* ---- mola (à esquerda) ---- */
      var xs0 = X0 - 42;
      var comp = yM - yTeto - 8;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(xs0, yTeto);
      var nEsp = 9, larg = 15;
      c.lineTo(xs0, yTeto + 10);
      for (var i = 0; i < nEsp; i++) {
        var y1 = yTeto + 10 + (comp - 20) * (i + 0.5) / nEsp;
        c.lineTo(xs0 + (i % 2 === 0 ? larg : -larg), y1);
      }
      c.lineTo(xs0, yTeto + 10 + (comp - 20));
      c.lineTo(xs0, yM);
      c.stroke();
      c.fillStyle = Plot.serie(0);
      c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('k', xs0 - 30, yTeto + comp / 2);

      /* ---- amortecedor (à direita) ---- */
      if (anim.zeta > 0.001) {
        var xd = X0 + 42;
        c.strokeStyle = Plot.serie(1); c.lineWidth = 2.2;
        /* haste superior */
        c.beginPath(); c.moveTo(xd, yTeto); c.lineTo(xd, yTeto + 26); c.stroke();
        /* cilindro fixo no teto */
        var hCil = 40;
        c.beginPath();
        c.moveTo(xd - 13, yTeto + 26); c.lineTo(xd - 13, yTeto + 26 + hCil);
        c.lineTo(xd + 13, yTeto + 26 + hCil); c.lineTo(xd + 13, yTeto + 26);
        c.stroke();
        /* pistão acompanha a massa */
        var yPist = Math.max(yTeto + 32, Math.min(yTeto + 26 + hCil - 6, yTeto + 30 + (yM - yTeto) * 0.35));
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(xd - 11, yPist); c.lineTo(xd + 11, yPist); c.stroke();
        c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(xd, yPist); c.lineTo(xd, yM); c.stroke();
        c.fillStyle = Plot.serie(1);
        c.fillText('c', xd + 30, yTeto + 46);
      }

      /* ---- massa ---- */
      var lm = 78, hm = 44;
      c.fillStyle = Plot.serie(2);
      c.globalAlpha = 0.42;
      c.fillRect(X0 - lm / 2, yM, lm, hm);
      c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(2); c.lineWidth = 2;
      c.strokeRect(X0 - lm / 2, yM, lm, hm);
      c.fillStyle = Plot.cssVar('--text', '#111');
      c.font = '600 15px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('m', X0, yM + hm / 2);

      /* ---- linha de equilíbrio e cota do deslocamento ---- */
      c.strokeStyle = faint; c.lineWidth = 1.2; c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(X0 - 110, yEq); c.lineTo(X0 + 118, yEq); c.stroke();
      c.setLineDash([]);
      c.fillStyle = faint;
      c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('equilíbrio', X0 + 74, yEq - 4);

      if (Math.abs(x) > 0.01) {
        c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6); c.lineWidth = 1.8;
        var xd2 = X0 + 66;
        c.beginPath(); c.moveTo(xd2, yEq); c.lineTo(xd2, yM); c.stroke();
        [yEq, yM].forEach(function (yy, idx) {
          var sg2 = idx === 0 ? (yM > yEq ? 1 : -1) : (yM > yEq ? -1 : 1);
          c.beginPath();
          c.moveTo(xd2, yy); c.lineTo(xd2 - 3.5, yy + sg2 * 7); c.lineTo(xd2 + 3.5, yy + sg2 * 7);
          c.closePath(); c.fill();
        });
        c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('x = ' + Plot.sig(x, 3) + ' mm', xd2 + 8, (yEq + yM) / 2);
      }
    }

    function quadro() {
      if (!anim.ctx || !anim.resposta) { requestAnimationFrame(quadro); return; }
      if (!anim.ativo) { requestAnimationFrame(quadro); return; }
      var pl = anim.ctx.plot('anim');
      if (!pl) { requestAnimationFrame(quadro); return; }
      var t = ((performance.now() - anim.t0) / 1000) * anim.vel;
      var ciclo = anim.tmax;
      t = t % ciclo;
      var x = anim.resposta(t);
      pl.clear();
      pl.setLimits([-1, 1], [-1.35, 1.15]);
      pl.custom(function (c, plot) { desenharSistema(c, plot, x, anim.amp); });
      pl.custom(function (c, plot) {
        c.fillStyle = Plot.cssVar('--text-faint', '#999');
        c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'right'; c.textBaseline = 'top';
        c.fillText('t = ' + t.toFixed(2) + ' s', plot._area.x + plot._area.w - 6, plot._area.y + 4);
      });
      pl.draw();

      /* marca o instante correspondente na curva de resposta.
         O grafico e redesenhado antes: sem isso os marcadores de cada
         quadro se acumulariam sobre a curva. */
      var pr = anim.ctx.plot('resp');
      if (pr) {
        pr.draw();
        var c2 = pr.ctx;
        c2.save();
        c2.strokeStyle = Plot.serie(6); c2.lineWidth = 1.4;
        c2.globalAlpha = 0.75;
        var X = pr.px(t);
        c2.beginPath(); c2.moveTo(X, pr._area.y); c2.lineTo(X, pr._area.y + pr._area.h); c2.stroke();
        c2.globalAlpha = 1;
        c2.fillStyle = Plot.serie(6);
        c2.beginPath(); c2.arc(X, pr.py(x), 4.5, 0, Math.PI * 2); c2.fill();
        c2.restore();
      }
      requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);

    Sim.build('#sim-livre', {
      titulo: 'Vibração livre de 1 grau de liberdade',
      descricao: 'O fator de amortecimento ζ decide o comportamento inteiro: abaixo de 1 o sistema oscila, acima de 1 apenas retorna. Em ζ = 1 está a fronteira, e é ali que o retorno é mais rápido sem ultrapassar.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Subamortecido leve (ζ = 0,05)',
          desc: 'Estrutura de aço: oscila muito antes de parar',
          valores: { m: 50, k: 200000, zeta: 0.05, x0: 10, v0: 0, tmax: 3 } },
        { nome: '2 · Suspensão automotiva (ζ = 0,3)',
          desc: 'Compromisso entre conforto e controle',
          valores: { m: 300, k: 30000, zeta: 0.3, x0: 50, v0: 0, tmax: 3 } },
        { nome: '3 · Criticamente amortecido (ζ = 1)',
          desc: 'Retorno mais rápido possível sem oscilar',
          valores: { m: 50, k: 200000, zeta: 1, x0: 10, v0: 0, tmax: 0.5 } },
        { nome: '4 · Superamortecido (ζ = 2)',
          desc: 'Volta devagar; porta com mola pneumática',
          valores: { m: 50, k: 200000, zeta: 2, x0: 10, v0: 0, tmax: 0.5 } },
        { nome: '5 · Impacto (deslocamento nulo, velocidade inicial)',
          desc: 'Sistema em repouso recebe um golpe',
          valores: { m: 50, k: 200000, zeta: 0.08, x0: 0, v0: 500, tmax: 2 } },
        { nome: '6 · Praticamente sem amortecimento',
          desc: 'ζ = 0,01: a envoltória quase não desce',
          valores: { m: 50, k: 200000, zeta: 0.01, x0: 10, v0: 0, tmax: 6 } }
      ],
      controles: [
        { id: 'm', label: 'Massa m', min: 1, max: 500, step: 1, valor: 50, unidade: 'kg' },
        { id: 'k', label: 'Rigidez k', min: 1000, max: 500000, step: 1000, valor: 200000, unidade: 'N/m' },
        { id: 'zeta', label: 'Fator de amortecimento ζ', min: 0, max: 2.5, step: 0.01, valor: 0.1, unidade: '',
          desc: '< 1 subamortecido · = 1 crítico · > 1 superamortecido' },
        { tipo: 'titulo', label: 'Condições iniciais' },
        { id: 'x0', label: 'Deslocamento inicial x₀', min: -50, max: 50, step: 1, valor: 10, unidade: 'mm' },
        { id: 'v0', label: 'Velocidade inicial v₀', min: -1000, max: 1000, step: 10, valor: 0, unidade: 'mm/s' },
        { id: 'tmax', label: 'Janela de tempo', min: 0.2, max: 8, step: 0.1, valor: 3, unidade: 's' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar o sistema', valor: true,
          desc: 'Mostra a massa oscilando de verdade, em tempo real.' },
        { id: 'vel', label: 'Velocidade da animação', min: 0.1, max: 2, step: 0.1, valor: 0.6,
          unidade: '×', desc: 'Abaixo de 1 deixa em câmera lenta.' }
      ],
      graficos: [
        { id: 'anim', axes: false, height: 300, grid: false, legend: false },
        { id: 'resp', titulo: 'Resposta no tempo x(t)', xlabel: 'Tempo (s)', ylabel: 'x (mm)',
          aspect: 0.42, legendPos: 'topright' },
        { id: 'comp', titulo: 'Comparação dos três regimes (mesmas condições iniciais)',
          xlabel: 'Tempo (s)', ylabel: 'x (mm)', aspect: 0.34, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'wn', label: 'Freq. natural ωn' },
        { id: 'fn', label: 'Freq. natural fn' },
        { id: 'Tn', label: 'Período Tn' },
        { id: 'cc', label: 'Amortec. crítico c_c' },
        { id: 'c', label: 'Amortecimento c' },
        { id: 'wd', label: 'Freq. amortecida ωd' },
        { id: 'delta', label: 'Decremento logarítmico' },
        { id: 'defl', label: 'Deflexão estática' },
        { id: 'regime', label: 'Regime' }
      ],
      formulas: [
        { g: 'Parâmetros do sistema' },
        { tex: '\\omega_{n} = \\sqrt{\\frac{k}{m}}', d: 'frequência natural não amortecida [rad/s]', destaque: true },
        { tex: 'f_{n} = \\frac{\\omega_{n}}{2\\pi }', d: 'em Hz;  T_n = 1/f_n' },
        { tex: '\\omega_{n} = \\sqrt{\\frac{g}{\\delta_{\\text{est}}}}', d: 'forma prática: δ_est é a deflexão sob o peso próprio', destaque: true },
        { tex: 'c_{c} = 2\\cdot \\sqrt{k\\cdot m} = 2\\cdot m\\cdot \\omega_{n}', d: 'amortecimento crítico' },
        { tex: '\\zeta = \\frac{c}{c_{c}}', d: 'fator de amortecimento, adimensional', destaque: true },
        { tex: '\\omega_{d} = \\omega_{n}\\cdot \\sqrt{1 - \\zeta^{2}}', d: 'frequência amortecida; só existe se ζ < 1' },

        { g: 'Equação do movimento' },
        { tex: 'm\\cdot \\ddot{x} + c\\cdot \\dot{x} + k\\cdot x = 0', d: 'vibração livre', destaque: true },
        { tex: '\\ddot{x} + 2\\zeta \\omega_{n}\\cdot \\dot{x} + \\omega_{n}^{2}\\cdot x = 0', d: 'forma normalizada' },

        { g: 'Solução por regime' },
        { tex: '\\zeta < 1: x = e^(- \\zeta \\omega_{n} t)\\cdot [A\\cdot \\cos (\\omega_{d} t) + B\\cdot \\operatorname{sen} (\\omega_{d} t)]', d: 'SUBAMORTECIDO: oscila com amplitude decrescente', destaque: true },
        { tex: 'A = x_{0} \\quad B = \\frac{v_{0} + \\zeta \\omega_{n} x_{0}}{\\omega_{d}}', d: 'constantes pelas condições iniciais' },
        { tex: '\\zeta = 1: x = (x_{0} + (v_{0} + \\omega_{n} x_{0})\\cdot t)\\cdot e^(- \\omega_{n} t)', d: 'CRÍTICO: retorno mais rápido sem oscilar', destaque: true },
        { tex: '\\zeta > 1: x = C_{1}e^(s_{1}t) + C_{2}e^(s_{2}t)', d: 'SUPERAMORTECIDO: duas exponenciais reais, sem oscilação' },
        { tex: 's = \\omega_{n}(- \\zeta \\pm \\sqrt{\\zeta^{2} - 1})', d: 'raízes da equação característica' },

        { g: 'Medida experimental do amortecimento' },
        { tex: '\\delta = \\ln (\\frac{x_{i}}{x_{i+1}}) = \\frac{2\\pi \\zeta }{\\sqrt{1 - \\zeta^{2}}}', d: 'decremento logarítmico entre picos sucessivos', destaque: true },
        { tex: '\\delta = (\\frac{1}{n})\\cdot \\ln (\\frac{x_{i}}{x_{i+n}})', d: 'usando n ciclos — mais preciso na prática' },
        { tex: '\\zeta \\approx \\frac{\\delta }{2\\pi }', d: 'aproximação válida para ζ pequeno' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Sistema massa-mola-amortecedor linear de 1 grau de liberdade, com amortecimento viscoso. Deslocamentos pequenos e parâmetros constantes.',
      calcular: function (p, ctx) {
        var wn = Math.sqrt(p.k / p.m);
        var cc = 2 * Math.sqrt(p.k * p.m);
        var c = p.zeta * cc;
        var z = p.zeta;
        var wd = z < 1 ? wn * Math.sqrt(1 - z * z) : 0;
        var defl = p.m * Gg / p.k;
        var delta = z < 1 && z > 0 ? 2 * Math.PI * z / Math.sqrt(1 - z * z) : NaN;

        var regime = z === 0 ? 'Não amortecido'
          : z < 0.999 ? 'Subamortecido (oscila)'
          : z < 1.001 ? 'Criticamente amortecido'
          : 'Superamortecido (não oscila)';

        function resposta(zz, t) {
          var x0 = p.x0, v0 = p.v0;
          var wnn = wn;
          if (zz < 0.999) {
            var wdd = wnn * Math.sqrt(1 - zz * zz);
            var A = x0, B = (v0 + zz * wnn * x0) / wdd;
            return Math.exp(-zz * wnn * t) * (A * Math.cos(wdd * t) + B * Math.sin(wdd * t));
          }
          if (zz < 1.001) {
            return (x0 + (v0 + wnn * x0) * t) * Math.exp(-wnn * t);
          }
          var r = Math.sqrt(zz * zz - 1);
          var s1 = wnn * (-zz + r), s2 = wnn * (-zz - r);
          var C1 = (v0 - s2 * x0) / (s1 - s2), C2 = x0 - C1;
          return C1 * Math.exp(s1 * t) + C2 * Math.exp(s2 * t);
        }

        var ts = Plot.linspace(0, p.tmax, 500);
        var xs = ts.map(function (t) { return resposta(z, t); });

        /* alimenta o laço de animação com o estado atual */
        var picoAbs = 0;
        xs.forEach(function (v) { if (Math.abs(v) > picoAbs) picoAbs = Math.abs(v); });
        anim.ctx = ctx;
        anim.p = p;
        anim.zeta = z;
        anim.wn = wn;
        anim.tmax = p.tmax;
        anim.vel = p.vel;
        anim.amp = Math.max(picoAbs, Math.abs(p.x0), 1);
        anim.resposta = function (t) { return resposta(z, t); };
        if (p.animar && !anim.ativo) { anim.ativo = true; anim.t0 = performance.now(); }
        if (!p.animar) {
          anim.ativo = false;
          var pa = ctx.plot('anim');
          pa.clear();
          pa.setLimits([-1, 1], [-1.35, 1.15]);
          pa.custom(function (c, plot) { desenharSistema(c, plot, p.x0, anim.amp); });
          pa.draw();
        }

        var g1 = ctx.plot('resp').clear();
        g1.line(ts, xs, { color: Plot.serie(0), width: 2.4, label: 'x(t)' });
        if (z < 0.999 && z > 0) {
          var amp = Math.sqrt(p.x0 * p.x0 + Math.pow((p.v0 + z * wn * p.x0) / wd, 2));
          g1.line(ts, ts.map(function (t) { return amp * Math.exp(-z * wn * t); }),
            { color: Plot.serie(7), width: 1.5, dash: [5, 4], label: 'envoltória ±A·e^(−ζωn·t)' });
          g1.line(ts, ts.map(function (t) { return -amp * Math.exp(-z * wn * t); }),
            { color: Plot.serie(7), width: 1.5, dash: [5, 4] });
        }
        g1.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.1 });
        g1.draw();

        /* comparação dos três regimes */
        var g2 = ctx.plot('comp').clear();
        [[0.1, 'ζ = 0,1 subamortecido', 0], [1, 'ζ = 1 crítico', 2], [2, 'ζ = 2 superamortecido', 1]]
          .forEach(function (cfg) {
            g2.line(ts, ts.map(function (t) { return resposta(cfg[0], t); }),
              { color: Plot.serie(cfg[2]), width: 2, label: cfg[1] });
          });
        g2.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.1 });
        g2.draw();

        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Frequência natural',
            c: 'ω_n = √(k/m) = √(' + p.k + '/' + p.m + ')\n' +
               'f_n = ω_n/(2π) = ' + sg(wn, 5) + '/6,2832',
            r: 'ω_n = ' + sg(wn, 5) + ' rad/s = ' + sg(wn / 2 / Math.PI, 5) + ' Hz',
            obs: 'Depende só de k e m — não do amortecimento nem das condições iniciais.' },
          { t: 'Conferência pela deflexão estática',
            c: 'δ_est = m·g/k = ' + p.m + ' × 9,81/' + p.k + ' = ' + sg(defl * 1000, 4) + ' mm\n' +
               'ω_n = √(g/δ_est) = √(9,81/' + sg(defl, 5) + ')',
            r: 'ω_n = ' + sg(Math.sqrt(Gg / defl), 5) + ' rad/s  ✓',
            obs: 'É o atalho de campo: basta medir quanto a estrutura afunda sob o próprio peso.' },
          { t: 'Amortecimento crítico e coeficiente c',
            c: 'c_c = 2√(k·m) = 2√(' + p.k + ' × ' + p.m + ')\n' +
               'c = ζ·c_c = ' + p.zeta + ' × ' + sg(cc, 5),
            r: 'c_c = ' + sg(cc, 5) + ' N·s/m      c = ' + sg(c, 5) + ' N·s/m' },
          { t: 'Regime de vibração',
            c: 'ζ = ' + sg(z, 4) + (z < 1 ? '  <  1' : z > 1 ? '  >  1' : '  =  1'),
            r: regime,
            obs: z < 1
              ? 'Oscila com frequência amortecida ω_d = ω_n√(1 − ζ²) = ' + sg(wd, 5) + ' rad/s, sempre menor que ω_n.'
              : z > 1
                ? 'Duas raízes reais negativas: o sistema volta ao equilíbrio sem cruzar o zero, mas mais devagar que no caso crítico.'
                : 'Fronteira entre os dois: é o retorno mais rápido possível sem ultrapassagem. É o alvo de projeto de instrumentos de medida e portas automáticas.' },
          z < 1 && z > 0
            ? { t: 'Decremento logarítmico',
                c: 'δ = 2πζ/√(1 − ζ²) = 2π × ' + sg(z, 4) + '/√(1 − ' + sg(z * z, 4) + ')\n' +
                   'x_i/x_{i+1} = e^δ',
                r: 'δ = ' + sg(delta, 4) + '   →   cada ciclo reduz a amplitude a 1/' + sg(Math.exp(delta), 4),
                obs: 'É assim que se mede ζ na bancada: registra-se a resposta livre e comparam-se dois picos. Para ζ pequeno vale a aproximação ζ ≈ δ/2π.' }
            : { t: 'Decremento logarítmico',
                c: 'Só é definido para ζ < 1',
                r: 'Não aplicável neste regime',
                obs: 'Sem oscilação não há picos sucessivos para comparar.' }
        ]);

        return {
          wn: { v: wn, u: 'rad/s', classe: 'destaque' },
          fn: { v: wn / 2 / Math.PI, u: 'Hz' },
          Tn: { v: 2 * Math.PI / wn, u: 's' },
          cc: { v: cc, u: 'N·s/m' },
          c: { v: c, u: 'N·s/m' },
          wd: { v: z < 1 ? wd : 0, u: 'rad/s' },
          delta: { v: isFinite(delta) ? delta : '—', u: '' },
          defl: { v: defl * 1000, u: 'mm' },
          regime: { v: regime, u: '', classe: z < 1 ? '' : 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     2. Resposta forçada e ressonância
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-forcada')) return;

    Sim.build('#sim-forcada', {
      titulo: 'Resposta a excitação harmônica — ressonância',
      descricao: 'O fator de amplificação mostra quanto a resposta supera a deflexão estática. Em r = 1 a amplitude é limitada apenas pelo amortecimento — é a ressonância.',
      controlesLargos: true,
      controles: [
        { id: 'tipo', tipo: 'seg', label: 'Tipo de excitação', valor: 'forca',
          opcoes: [{ v: 'forca', t: 'Força F₀' }, { v: 'desbal', t: 'Desbalanceamento' }, { v: 'base', t: 'Base móvel' }] },
        { id: 'zeta', label: 'Fator de amortecimento ζ', min: 0.01, max: 1, step: 0.01, valor: 0.1, unidade: '' },
        { id: 'r', label: 'Razão de frequências r = ω/ωn', min: 0, max: 4, step: 0.01, valor: 1, unidade: '',
          desc: 'r = 1 é a ressonância. Passar por ela na partida é inevitável em muitas máquinas.' },
        { tipo: 'separador' },
        { id: 'm', label: 'Massa m', min: 1, max: 500, step: 1, valor: 50, unidade: 'kg' },
        { id: 'k', label: 'Rigidez k', min: 1000, max: 500000, step: 1000, valor: 200000, unidade: 'N/m' },
        { id: 'F0', label: 'Amplitude da força F₀', min: 10, max: 5000, step: 10, valor: 500, unidade: 'N',
          desc: 'Usada no modo "Força".' }
      ],
      graficos: [
        { id: 'mag', titulo: 'Fator de amplificação', xlabel: 'Razão de frequências r = ω/ωn',
          ylabel: 'M = X/(F₀/k)', aspect: 0.44, legendPos: 'topright' },
        { id: 'fase', titulo: 'Ângulo de fase entre força e resposta', xlabel: 'r = ω/ωn',
          ylabel: 'φ (graus)', aspect: 0.30, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'wn', label: 'Freq. natural' },
        { id: 'w', label: 'Freq. de excitação' },
        { id: 'M', label: 'Fator de amplificação' },
        { id: 'X', label: 'Amplitude X' },
        { id: 'fase', label: 'Ângulo de fase' },
        { id: 'Mmax', label: 'Amplificação de pico' },
        { id: 'rpico', label: 'r do pico' },
        { id: 'zona', label: 'Zona de operação' }
      ],
      formulas: [
        { g: 'Excitação harmônica' },
        { tex: 'm\\cdot \\ddot{x} + c\\cdot \\dot{x} + k\\cdot x = F_{0}\\cdot \\operatorname{sen} (\\omega t)', d: 'equação do movimento forçado', destaque: true },
        { tex: 'r = \\frac{\\omega }{\\omega_{n}}', d: 'razão de frequências — o parâmetro que organiza tudo', destaque: true },
        { tex: 'x_{\\text{est}} = \\frac{F_{0}}{k}', d: 'deflexão que a força causaria se aplicada estaticamente' },

        { g: 'Resposta permanente' },
        { tex: 'M = \\frac{X}{F_{0}/k} = \\frac{1}{\\sqrt{(1 - r^{2})^{2} + (2\\zeta r)^{2}}}', d: 'fator de amplificação dinâmica', destaque: true },
        { tex: '\\phi = \\arctan [\\frac{2\\zeta r}{1 - r^{2}}]', d: 'atraso da resposta em relação à força', destaque: true },
        { tex: 'r ≪ 1 \\to M \\approx 1 e \\phi \\approx 0°', d: 'zona quase estática: a massa acompanha a força' },
        { tex: 'r = 1 \\to M = \\frac{1}{2\\zeta } e \\phi = 90°', d: 'RESSONÂNCIA: só o amortecimento limita a amplitude', destaque: true },
        { tex: 'r ≫ 1 \\to M \\to 0 e \\phi \\to 180°', d: 'zona inercial: a massa não consegue acompanhar' },

        { g: 'Pico verdadeiro' },
        { tex: 'r_{\\text{pico}} = \\sqrt{1 - 2\\zeta^{2}}', d: 'o máximo ocorre pouco ANTES de r = 1', destaque: true },
        { tex: 'M_{\\text{máx}} = \\frac{1}{2\\zeta \\sqrt{1 - \\zeta^{2}}}', d: 'valor no pico' },
        { tex: '\\text{Existe pico apenas se} \\zeta < 0,707', d: 'acima disso a curva é monotonicamente decrescente' },
        { tex: 'Q \\approx \\frac{1}{2\\zeta }', d: 'fator de qualidade — amplificação na ressonância' },

        { g: 'Desbalanceamento rotativo' },
        { tex: 'M\\cdot \\frac{X}{m_{e}\\cdot e} = \\frac{r^{2}}{\\sqrt{(1 - r^{2})^{2} + (2\\zeta r)^{2}}}', d: 'a força cresce com ω², então M → 1 em alta rotação', destaque: true },
        { tex: 'F_{0} = m_{e}\\cdot e\\cdot \\omega^{2}', d: 'força centrífuga do desbalanceamento' },

        { g: 'Excitação pela base' },
        { tex: '\\frac{X}{Y} =\\frac{\\sqrt{1 + (2\\zeta r)^{2}}}{\\sqrt{(1 - r^{2})^{2} + (2\\zeta r)^{2}}}', d: 'mesma expressão da transmissibilidade' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Regime permanente (a resposta transiente já se extinguiu), sistema linear com amortecimento viscoso e excitação harmônica pura.',
      calcular: function (p, ctx) {
        var wn = Math.sqrt(p.k / p.m);
        var z = p.zeta, r = p.r;
        var w = r * wn;

        function M(rr) { return 1 / Math.sqrt(Math.pow(1 - rr * rr, 2) + Math.pow(2 * z * rr, 2)); }
        function Mdes(rr) { return rr * rr * M(rr); }
        function Mbase(rr) { return Math.sqrt(1 + Math.pow(2 * z * rr, 2)) * M(rr); }
        function fase(rr) {
          var f = Math.atan2(2 * z * rr, 1 - rr * rr) * 180 / Math.PI;
          return f < 0 ? f + 180 : f;
        }

        var fn = p.tipo === 'desbal' ? Mdes : p.tipo === 'base' ? Mbase : M;
        var Mval = fn(r);
        var Xest = p.F0 / p.k;
        var X = p.tipo === 'forca' ? Mval * Xest : Mval;
        var rp = z < 0.7071 ? Math.sqrt(1 - 2 * z * z) : 0;
        var Mmax = z < 0.7071 ? 1 / (2 * z * Math.sqrt(1 - z * z)) : 1;

        var rs = Plot.linspace(0, 4, 240);
        var g1 = ctx.plot('mag').clear();
        [0.05, 0.1, 0.2, 0.5, 0.707].forEach(function (zz, i) {
          var f2 = function (rr) {
            var base = 1 / Math.sqrt(Math.pow(1 - rr * rr, 2) + Math.pow(2 * zz * rr, 2));
            return p.tipo === 'desbal' ? rr * rr * base
                 : p.tipo === 'base' ? Math.sqrt(1 + Math.pow(2 * zz * rr, 2)) * base : base;
          };
          g1.line(rs, rs.map(f2), { color: Plot.serie(i), width: Math.abs(zz - z) < 0.005 ? 2.8 : 1.3,
            label: 'ζ = ' + zz });
        });
        g1.line(rs, rs.map(fn), { color: Plot.serie(6), width: 2.6, label: 'ζ = ' + z + ' (atual)' });
        g1.vline(1, { color: Plot.serie(7), dash: [4, 3], width: 1.4, text: 'ressonância r = 1' });
        g1.marker(r, Mval, 'operação: M = ' + Plot.sig(Mval, 4), { color: Plot.serie(6), r: 5.5 });
        g1.setLimits([0, 4], [0, Math.min(11, Math.max(Mmax * 1.25, 3))]).draw();

        var g2 = ctx.plot('fase').clear();
        [0.05, 0.2, 0.707].forEach(function (zz, i) {
          g2.line(rs, rs.map(function (rr) {
            var f = Math.atan2(2 * zz * rr, 1 - rr * rr) * 180 / Math.PI;
            return f < 0 ? f + 180 : f;
          }), { color: Plot.serie(i), width: 1.5, label: 'ζ = ' + zz });
        });
        g2.line(rs, rs.map(fase), { color: Plot.serie(6), width: 2.4 });
        g2.hline(90, { color: Plot.serie(7), dash: [4, 3], width: 1.2, text: '90° na ressonância' });
        g2.vline(1, { color: Plot.serie(7), dash: [4, 3], width: 1.2 });
        g2.marker(r, fase(r), '', { color: Plot.serie(6), r: 5 });
        g2.setLimits([0, 4], [0, 185]).draw();

        var zona = r < 0.7 ? 'Quase estática (rígida)'
                 : r < 1.4 ? 'RESSONÂNCIA — evitar'
                 : 'Inercial (isolamento possível)';

        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Frequência natural e de excitação',
            c: 'ω_n = √(k/m) = √(' + p.k + '/' + p.m + ') = ' + sg(wn, 5) + ' rad/s\n' +
               'ω = r·ω_n = ' + r + ' × ' + sg(wn, 5),
            r: 'ω = ' + sg(w, 5) + ' rad/s = ' + sg(w / 2 / Math.PI, 4) + ' Hz  (' + sg(w * 60 / 2 / Math.PI, 5) + ' rpm)' },
          { t: 'Fator de amplificação',
            c: 'M = 1/√[(1 − r²)² + (2ζr)²]\n' +
               '(1 − r²)² = (1 − ' + sg(r * r, 4) + ')² = ' + sg(Math.pow(1 - r * r, 2), 4) + '\n' +
               '(2ζr)² = (2 × ' + z + ' × ' + r + ')² = ' + sg(Math.pow(2 * z * r, 2), 4),
            r: 'M = ' + sg(Mval, 4),
            obs: Math.abs(r - 1) < 0.02
              ? 'Em r = 1 o termo (1 − r²) some e resta M = 1/(2ζ) = ' + sg(1 / (2 * z), 4) + '. Só o amortecimento segura a amplitude.'
              : r < 1 ? 'Abaixo da ressonância a resposta acompanha a força.' : 'Acima da ressonância a inércia domina e a resposta cai.' },
          { t: 'Amplitude da resposta',
            c: p.tipo === 'forca'
              ? 'x_est = F₀/k = ' + p.F0 + '/' + p.k + ' = ' + sg(Xest * 1000, 4) + ' mm\n' +
                'X = M · x_est = ' + sg(Mval, 4) + ' × ' + sg(Xest * 1000, 4)
              : 'Neste modo, M já é a razão adimensional de amplitudes.',
            r: p.tipo === 'forca' ? 'X = ' + sg(X * 1000, 4) + ' mm' : 'razão = ' + sg(Mval, 4) },
          { t: 'Ângulo de fase',
            c: 'φ = arctan[2ζr/(1 − r²)] = arctan[' + sg(2 * z * r, 4) + '/' + sg(1 - r * r, 4) + ']',
            r: 'φ = ' + sg(fase(r), 4) + '°',
            obs: 'Na ressonância a fase é exatamente 90°, qualquer que seja ζ. É o critério experimental mais confiável para identificar a ressonância — mais do que procurar o pico de amplitude.' },
          { t: 'Pico verdadeiro da curva',
            c: z < 0.7071
              ? 'r_pico = √(1 − 2ζ²) = √(1 − 2×' + sg(z * z, 4) + ') = ' + sg(rp, 5) + '\n' +
                'M_máx = 1/(2ζ√(1 − ζ²)) = ' + sg(Mmax, 4)
              : 'ζ = ' + z + ' ≥ 0,707: a curva não tem pico, é decrescente desde r = 0.',
            r: z < 0.7071 ? 'Pico em r = ' + sg(rp, 4) + ' com M = ' + sg(Mmax, 4) : 'Sem pico de ressonância',
            obs: z < 0.7071
              ? 'O pico ocorre um pouco ANTES de r = 1. Para ζ pequeno a diferença é desprezível, e por isso se costuma dizer que a ressonância está em r = 1.'
              : 'Amortecimento acima de 0,707 elimina a amplificação — é o critério de projeto de acelerômetros e sismógrafos.' },
          { t: 'Leitura de projeto',
            c: 'Zona atual: ' + zona,
            r: zona,
            obs: r < 0.7
              ? 'Projeto rígido: aumente k ou reduza m para afastar ainda mais de r = 1.'
              : r < 1.4
                ? 'Faixa proibida. Toda máquina que parte do repouso atravessa a ressonância — deve fazê-lo rapidamente, e o amortecimento é o que limita a amplitude nessa passagem.'
                : 'Zona de isolamento: aqui vale reduzir k (molas mais macias) para aumentar r e reduzir a transmissão.' }
        ]);

        return {
          wn: { v: wn, u: 'rad/s' },
          w: { v: w, u: 'rad/s' },
          M: { v: Mval, u: '', classe: Mval > 3 ? 'alerta' : 'destaque' },
          X: { v: p.tipo === 'forca' ? X * 1000 : Mval, u: p.tipo === 'forca' ? 'mm' : '' },
          fase: { v: fase(r), u: '°' },
          Mmax: { v: Mmax, u: '' },
          rpico: { v: z < 0.7071 ? rp : '—', u: '' },
          zona: { v: zona, u: '', classe: zona.indexOf('RESSON') >= 0 ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     3. Isolamento de vibração
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-isolamento')) return;

    Sim.build('#sim-isolamento', {
      titulo: 'Isolamento de vibração — transmissibilidade',
      descricao: 'Só há isolamento acima de r = √2. Abaixo disso, o isolador AMPLIFICA a transmissão. E, ao contrário da intuição, mais amortecimento piora o isolamento na zona útil.',
      controlesLargos: true,
      controles: [
        { id: 'm', label: 'Massa da máquina', min: 10, max: 2000, step: 10, valor: 300, unidade: 'kg' },
        { id: 'rpm', label: 'Rotação de operação', min: 100, max: 6000, step: 10, valor: 1800, unidade: 'rpm' },
        { id: 'defl', label: 'Deflexão estática do isolador', min: 0.5, max: 60, step: 0.5, valor: 12, unidade: 'mm',
          desc: 'É o parâmetro que os catálogos de coxim fornecem. Define k = m·g/δ.' },
        { id: 'zeta', label: 'Amortecimento do isolador ζ', min: 0.01, max: 0.5, step: 0.01, valor: 0.05, unidade: '',
          desc: 'Mola de aço ≈ 0,005 · borracha ≈ 0,05 · elastômero especial ≈ 0,15' },
        { tipo: 'separador' },
        { id: 'F0', label: 'Força de excitação F₀', min: 10, max: 5000, step: 10, valor: 800, unidade: 'N' }
      ],
      graficos: [
        { id: 'tr', titulo: 'Transmissibilidade — note o cruzamento em r = √2',
          xlabel: 'Razão de frequências r = ω/ωn', ylabel: 'TR', aspect: 0.46, legendPos: 'topright' },
        { id: 'defl', titulo: 'Eficiência de isolamento em função da deflexão estática do coxim',
          xlabel: 'Deflexão estática (mm)', ylabel: 'Isolamento (%)', aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'k', label: 'Rigidez necessária' },
        { id: 'fn', label: 'Freq. natural do apoio' },
        { id: 'f', label: 'Freq. de excitação' },
        { id: 'r', label: 'Razão r' },
        { id: 'TR', label: 'Transmissibilidade' },
        { id: 'isol', label: 'Isolamento' },
        { id: 'Ftr', label: 'Força transmitida' },
        { id: 'diag', label: 'Diagnóstico' }
      ],
      formulas: [
        { g: 'Transmissibilidade' },
        { tex: '\\mathrm{TR} = \\frac{F_{\\text{transmitida}}}{F_{0}} = \\frac{X}{Y}', d: 'mesma expressão para força e para movimento de base', destaque: true },
        { tex: '\\mathrm{TR} =\\frac{\\sqrt{1 + (2\\zeta r)^{2}}}{\\sqrt{(1 - r^{2})^{2} + (2\\zeta r)^{2}}}', d: 'expressão geral', destaque: true },
        { tex: '\\mathrm{TR} = 1 em r = \\sqrt{2} \\approx 1,414', d: 'PARA QUALQUER ζ — todas as curvas se cruzam nesse ponto', destaque: true },
        { tex: 'r 1', d: 'o isolador AMPLIFICA: pior que fixar rígido' },
        { tex: 'r > \\sqrt{2} \\to \\mathrm{TR} < 1', d: 'zona de isolamento efetivo' },
        { tex: '\\text{Isolamento} (%) = (1 - \\mathrm{TR})\\cdot 100', d: 'quanto da excitação foi bloqueado' },

        { g: 'Projeto do isolador' },
        { tex: 'k = m\\cdot \\frac{g}{\\delta_{\\text{est}}}', d: 'a deflexão estática do catálogo define a rigidez', destaque: true },
        { tex: 'f_{n} = (\\frac{1}{2\\pi })\\cdot \\sqrt{\\frac{g}{\\delta_{\\text{est}}}}', d: 'frequência natural só depende da deflexão estática!', destaque: true },
        { tex: 'f_{n} \\approx \\frac{15,76}{\\sqrt{\\delta_{\\text{est}}}}', d: 'regra prática com δ em mm e f_n em Hz' },
        { tex: '\\text{Regra de projeto}: r \\ge 3', d: 'garante TR ≈ 0,13, ou seja, cerca de 87 % de isolamento' },

        { g: 'O paradoxo do amortecimento' },
        { tex: 'Em r > \\sqrt{2}, \\text{mais} \\zeta \\text{PIORA} o \\text{isolamento}', d: 'o amortecedor cria um caminho extra para a força', destaque: true },
        { tex: '\\text{Mas ζ é indispensável na partida}', d: 'a máquina cruza r = 1 ao acelerar; sem ζ a amplitude explodiria' },
        { tex: '\\text{Compromisso usual}: \\zeta \\text{entre} 0,03 e 0,10', d: 'suficiente na passagem, pouco prejudicial em regime' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Modelo de 1 grau de liberdade com base rígida e excitação harmônica. Considera-se que a máquina opera em rotação constante, e que a estrutura de apoio é muito mais rígida que o isolador.',
      calcular: function (p, ctx) {
        var d = p.defl / 1000;
        var k = p.m * Gg / d;
        var wn = Math.sqrt(Gg / d);
        var fnHz = wn / (2 * Math.PI);
        var w = p.rpm * 2 * Math.PI / 60;
        var fHz = w / (2 * Math.PI);
        var r = w / wn;
        var z = p.zeta;

        function TR(rr, zz) {
          return Math.sqrt(1 + Math.pow(2 * zz * rr, 2)) /
                 Math.sqrt(Math.pow(1 - rr * rr, 2) + Math.pow(2 * zz * rr, 2));
        }
        var tr = TR(r, z);
        var isol = (1 - tr) * 100;
        var Ftr = tr * p.F0;

        var rs = Plot.linspace(0, 5, 260);
        var g1 = ctx.plot('tr').clear();
        [0.02, 0.05, 0.1, 0.25, 0.5].forEach(function (zz, i) {
          g1.line(rs, rs.map(function (rr) { return TR(rr, zz); }),
            { color: Plot.serie(i), width: 1.4, label: 'ζ = ' + zz });
        });
        g1.line(rs, rs.map(function (rr) { return TR(rr, z); }),
          { color: Plot.serie(6), width: 2.8, label: 'ζ = ' + z + ' (atual)' });
        g1.hline(1, { color: Plot.cssVar('--text-faint', '#888'), dash: [4, 3], width: 1.3, text: 'TR = 1' });
        g1.vline(Math.SQRT2, { color: Plot.serie(7), dash: [5, 4], width: 1.8, text: 'r = √2' });
        g1.custom(function (c, pl) {
          var X1 = pl.px(Math.SQRT2), X2 = pl.px(5);
          c.fillStyle = Plot.cssVar('--ok', '#1c7c46');
          c.globalAlpha = 0.10;
          c.fillRect(X1, pl._area.y, X2 - X1, pl._area.h);
          c.globalAlpha = 1;
          c.fillStyle = Plot.cssVar('--ok', '#1c7c46');
          c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'top';
          c.fillText('zona de isolamento', X1 + 8, pl._area.y + 8);
        });
        g1.marker(r, tr, 'operação: TR = ' + Plot.sig(tr, 3), { color: Plot.serie(6), r: 5.5 });
        g1.setLimits([0, 5], [0, 5]).draw();

        var ds = Plot.linspace(0.5, 60, 120);
        var g2 = ctx.plot('defl').clear();
        g2.line(ds, ds.map(function (dd) {
          var wnn = Math.sqrt(Gg / (dd / 1000));
          return Math.max(0, (1 - TR(w / wnn, z)) * 100);
        }), { color: Plot.serie(2), width: 2.6 });
        g2.vline(p.defl, { color: Plot.serie(6), dash: [5, 4], width: 1.6, text: 'atual' });
        g2.hline(80, { color: Plot.serie(7), dash: [3, 3], width: 1.2, text: 'meta usual: 80 %' });
        g2.marker(p.defl, Math.max(0, isol), Plot.sig(Math.max(0, isol), 3) + ' %', { color: Plot.serie(6) });
        g2.setLimits([0, 60], [0, 100]).draw();

        var diag = r < 1.414 ? 'AMPLIFICA — isolador inadequado'
                 : r < 3 ? 'Isola, mas com pouca margem'
                 : 'Isolamento adequado';

        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Rigidez a partir da deflexão estática',
            c: 'k = m·g/δ_est = ' + p.m + ' × 9,81/' + sg(d, 4) + ' m',
            r: 'k = ' + sg(k / 1000, 4) + ' kN/m',
            obs: 'O catálogo de coxins informa a deflexão estática sob carga — é dela que sai a rigidez.' },
          { t: 'Frequência natural do apoio',
            c: 'f_n = (1/2π)·√(g/δ_est) = (1/2π)·√(9,81/' + sg(d, 4) + ')\n' +
               'Regra prática: f_n ≈ 15,76/√δ[mm] = 15,76/√' + p.defl,
            r: 'f_n = ' + sg(fnHz, 4) + ' Hz',
            obs: 'Repare: f_n depende SÓ da deflexão estática, não da massa. Uma máquina pesada e uma leve sobre coxins que afundem o mesmo tanto têm a mesma frequência natural.' },
          { t: 'Frequência de excitação e razão r',
            c: 'f = ' + p.rpm + ' rpm / 60 = ' + sg(fHz, 4) + ' Hz\n' +
               'r = f/f_n = ' + sg(fHz, 4) + '/' + sg(fnHz, 4),
            r: 'r = ' + sg(r, 4),
            obs: r < 1.414
              ? 'r abaixo de √2 = 1,414: o isolador está na região em que AMPLIFICA. Precisa de coxim mais macio (maior deflexão).'
              : 'r acima de √2: está na zona de isolamento.' },
          { t: 'Transmissibilidade',
            c: 'TR = √[1 + (2ζr)²]/√[(1 − r²)² + (2ζr)²]\n' +
               '2ζr = 2 × ' + z + ' × ' + sg(r, 4) + ' = ' + sg(2 * z * r, 4) + '\n' +
               '1 − r² = ' + sg(1 - r * r, 4),
            r: 'TR = ' + sg(tr, 4),
            obs: 'Fração da excitação que chega à fundação.' },
          { t: 'Isolamento e força transmitida',
            c: 'Isolamento = (1 − TR)×100 = (1 − ' + sg(tr, 4) + ')×100\n' +
               'F_transmitida = TR × F₀ = ' + sg(tr, 4) + ' × ' + p.F0,
            r: sg(Math.max(0, isol), 4) + ' % de isolamento    F_tr = ' + sg(Ftr, 4) + ' N',
            obs: diag },
          { t: 'O papel do amortecimento',
            c: 'TR com ζ = 0,02: ' + sg(TR(r, 0.02), 4) + '\n' +
               'TR com ζ = ' + z + ':    ' + sg(tr, 4) + '\n' +
               'TR com ζ = 0,30: ' + sg(TR(r, 0.3), 4),
            r: r > 1.414 ? 'Mais amortecimento PIORA o isolamento nesta zona' : 'Nesta zona, mais amortecimento ajuda',
            obs: 'O amortecedor transmite força proporcional à velocidade relativa, criando um caminho adicional para a excitação. Ainda assim ele é indispensável: na partida a máquina atravessa r = 1, e sem amortecimento a amplitude nessa passagem seria destrutiva.' }
        ]);

        return {
          k: { v: k / 1000, u: 'kN/m' },
          fn: { v: fnHz, u: 'Hz' },
          f: { v: fHz, u: 'Hz' },
          r: { v: r, u: '', classe: r < 1.414 ? 'alerta' : r > 3 ? 'ok' : '' },
          TR: { v: tr, u: '', classe: tr > 1 ? 'alerta' : 'destaque' },
          isol: { v: Math.max(0, isol), u: '%', classe: isol > 80 ? 'ok' : isol < 0 ? 'alerta' : '' },
          Ftr: { v: Ftr, u: 'N' },
          diag: { v: diag, u: '', classe: r < 1.414 ? 'alerta' : r > 3 ? 'ok' : '' }
        };
      }
    });
  })();

  /* ============================================================
     4. Dois graus de liberdade e absorvedor dinâmico
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-2gdl')) return;

    Sim.build('#sim-2gdl', {
      titulo: 'Dois graus de liberdade e absorvedor dinâmico',
      descricao: 'Cada grau de liberdade acrescenta uma frequência natural e um modo de vibrar. O absorvedor dinâmico explora isso: acopla-se uma segunda massa sintonizada para anular a vibração da primeira.',
      controlesLargos: true,
      controles: [
        { id: 'm1', label: 'Massa principal m₁', min: 1, max: 200, step: 1, valor: 50, unidade: 'kg' },
        { id: 'k1', label: 'Rigidez principal k₁', min: 1000, max: 500000, step: 1000, valor: 100000, unidade: 'N/m' },
        { tipo: 'titulo', label: 'Segunda massa (absorvedor)' },
        { id: 'mu', label: 'Razão de massas μ = m₂/m₁', min: 0.02, max: 0.5, step: 0.01, valor: 0.1, unidade: '',
          desc: 'Absorvedores reais usam entre 5 e 20 % da massa principal.' },
        { id: 'sint', label: 'Sintonia f = ω₂/ω₁', min: 0.5, max: 1.5, step: 0.01, valor: 1, unidade: '',
          desc: 'f = 1 sintoniza o absorvedor exatamente na frequência natural da massa principal.' },
        { tipo: 'separador' },
        { id: 'rexc', label: 'Frequência de excitação (ω/ω₁)', min: 0.2, max: 2.5, step: 0.01, valor: 1, unidade: '' }
      ],
      graficos: [
        { id: 'resp', titulo: 'Amplitude da massa principal — com e sem absorvedor',
          xlabel: 'ω/ω₁', ylabel: 'X₁·k₁/F₀', aspect: 0.46, legendPos: 'topright' },
        { id: 'modos', axes: false, height: 240, grid: false, legend: false }
      ],
      saidas: [
        { id: 'w1', label: 'ω₁ (sem absorvedor)' },
        { id: 'wa', label: '1ª freq. natural' },
        { id: 'wb', label: '2ª freq. natural' },
        { id: 'X1', label: 'Amplitude X₁ (adim.)' },
        { id: 'X2', label: 'Amplitude X₂ (adim.)' },
        { id: 'efeito', label: 'Efeito do absorvedor' }
      ],
      formulas: [
        { g: 'Sistema de 2 graus de liberdade' },
        { tex: '[M]{\\ddot{x}} + [K]{x} = {F}', d: 'forma matricial', destaque: true },
        { tex: '\\text{det}([K] - \\omega^{2}[M]) = 0', d: 'equação característica — suas raízes são as frequências naturais', destaque: true },
        { tex: '\\text{n GDL  →  n frequências naturais e n modos}', d: 'cada modo é uma forma de deformação própria' },

        { g: 'Caso clássico: m₁=m₂=m, k₁=k₂=k' },
        { tex: '\\omega_{1} = 0,618\\cdot \\sqrt{\\frac{k}{m}}', d: '1º modo: as duas massas em fase' },
        { tex: '\\omega_{2} = 1,618\\cdot \\sqrt{\\frac{k}{m}}', d: '2º modo: massas em oposição de fase' },
        { tex: '\\frac{\\omega_{2}}{\\omega_{1}} = 2,618 = \\phi^{2}', d: 'φ é a razão áurea — resultado exato deste sistema' },

        { g: 'Absorvedor dinâmico de vibração' },
        { tex: '\\omega_{2} = \\sqrt{\\frac{k_{2}}{m_{2}}} = \\omega_{\\text{excitação}}', d: 'condição de sintonia: o absorvedor é sintonizado NA excitação', destaque: true },
        { tex: 'X_{1} = 0 \\text{quando} \\omega = \\sqrt{\\frac{k_{2}}{m_{2}}}', d: 'a massa principal fica PARADA — o absorvedor toma toda a vibração', destaque: true },
        { tex: 'X_{2} = - \\frac{F_{0}}{k_{2}}', d: 'amplitude do absorvedor: quanto menor k₂, maior o curso necessário' },
        { tex: '\\mu = \\frac{m_{2}}{m_{1}}', d: 'razão de massas: controla a separação entre as duas novas ressonâncias' },

        { g: 'O preço do absorvedor' },
        { tex: '1 \\text{resson}\\hat{a}\\text{ncia vira} 2', d: 'uma abaixo e outra acima da frequência sintonizada', destaque: true },
        { tex: '\\text{μ maior → ressonâncias mais afastadas}', d: 'banda útil mais larga, mas absorvedor mais pesado' },
        { tex: '\\text{Só funciona em frequência fixa}', d: 'se a excitação varia, o sistema pode cair numa das novas ressonâncias' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Sistema não amortecido, para evidenciar o efeito de anulação exata. Com amortecimento real, X₁ não chega a zero, mas fica muito reduzida. Amplitudes normalizadas por F₀/k₁.',
      calcular: function (p, ctx) {
        var m1 = p.m1, k1 = p.k1;
        var m2 = p.mu * m1;
        var w1 = Math.sqrt(k1 / m1);
        var w2 = p.sint * w1;
        var k2 = m2 * w2 * w2;

        /* frequências naturais do sistema acoplado */
        var a11 = (k1 + k2) / m1, a12 = -k2 / m1;
        var a21 = -k2 / m2, a22 = k2 / m2;
        var tr = a11 + a22, det = a11 * a22 - a12 * a21;
        var disc = Math.sqrt(Math.max(0, tr * tr - 4 * det));
        var wa = Math.sqrt((tr - disc) / 2), wb = Math.sqrt((tr + disc) / 2);

        /* resposta forçada, sistema não amortecido */
        function X1n(w) {
          var d = (k1 + k2 - m1 * w * w) * (k2 - m2 * w * w) - k2 * k2;
          return (k2 - m2 * w * w) / d * k1;
        }
        function X2n(w) {
          var d = (k1 + k2 - m1 * w * w) * (k2 - m2 * w * w) - k2 * k2;
          return k2 / d * k1;
        }
        function semAbs(w) { return 1 / (1 - w * w / (w1 * w1)); }

        var wexc = p.rexc * w1;
        var X1 = X1n(wexc), X2 = X2n(wexc);

        var rs = Plot.linspace(0.2, 2.5, 400);
        var g1 = ctx.plot('resp').clear();
        g1.line(rs, rs.map(function (r) { return Math.min(12, Math.abs(semAbs(r * w1))); }),
          { color: Plot.serie(7), width: 1.6, dash: [5, 4], label: 'Sem absorvedor' });
        g1.line(rs, rs.map(function (r) { return Math.min(12, Math.abs(X1n(r * w1))); }),
          { color: Plot.serie(0), width: 2.6, label: 'Com absorvedor — X₁' });
        g1.line(rs, rs.map(function (r) { return Math.min(12, Math.abs(X2n(r * w1))); }),
          { color: Plot.serie(1), width: 1.6, label: 'Absorvedor — X₂' });
        g1.vline(wa / w1, { color: Plot.serie(6), dash: [3, 3], width: 1.3, text: 'ωa' });
        g1.vline(wb / w1, { color: Plot.serie(6), dash: [3, 3], width: 1.3, text: 'ωb' });
        g1.vline(p.sint, { color: Plot.serie(2), dash: [6, 3], width: 1.8, text: 'sintonia (X₁ = 0)' });
        g1.marker(p.rexc, Math.min(12, Math.abs(X1)), '', { color: Plot.serie(0), r: 5 });
        g1.setLimits([0.2, 2.5], [0, 8]).draw();

        /* desenho dos dois modos */
        var g2 = ctx.plot('modos').clear();
        g2.setLimits([0, 1], [0, 1]);
        g2.custom(function (c, pl) {
          var cor = Plot.cssVar('--text', '#111');
          [[0.27, wa, 'a'], [0.73, wb, 'b']].forEach(function (cfg, idx) {
            var cx = pl.px(cfg[0]);
            var w = cfg[1];
            /* razão de amplitudes do modo: X2/X1 = k2/(k2 − m2 w²) */
            var razao = k2 / (k2 - m2 * w * w);
            var esc = 34 / Math.max(1, Math.abs(razao));
            var a1 = 34, a2 = razao * esc * Math.abs(razao) / Math.abs(razao) * 1;
            a2 = razao * 34 / Math.max(1, Math.abs(razao));
            var y0 = pl.py(0.82), y1 = pl.py(0.52), y2 = pl.py(0.22);

            c.strokeStyle = Plot.cssVar('--text-faint', '#999');
            c.lineWidth = 1.2;
            c.beginPath(); c.moveTo(cx - 45, y0); c.lineTo(cx + 45, y0); c.stroke();
            for (var h = -45; h < 45; h += 8) {
              c.beginPath(); c.moveTo(cx + h, y0); c.lineTo(cx + h - 6, y0 - 7); c.stroke();
            }
            /* molas */
            c.strokeStyle = cor; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(cx, y0); c.lineTo(cx + a1 * 0.0, y1); c.stroke();
            c.beginPath(); c.moveTo(cx, y1); c.lineTo(cx, y2); c.stroke();
            /* massas deslocadas conforme o modo */
            c.fillStyle = Plot.serie(idx === 0 ? 0 : 1);
            c.globalAlpha = 0.75;
            c.fillRect(cx - 26 + a1 * 0.55, y1 - 13, 52, 26);
            c.fillRect(cx - 20 + a2 * 0.55, y2 - 11, 40, 22);
            c.globalAlpha = 1;
            c.strokeStyle = cor; c.lineWidth = 1.4;
            c.strokeRect(cx - 26 + a1 * 0.55, y1 - 13, 52, 26);
            c.strokeRect(cx - 20 + a2 * 0.55, y2 - 11, 40, 22);

            c.fillStyle = cor;
            c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText('Modo ' + (idx + 1) + ':  ω = ' + Plot.sig(w, 4) + ' rad/s', cx, pl.py(0.95));
            c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
            c.textBaseline = 'top';
            c.fillText(razao > 0 ? 'massas EM FASE' : 'massas em OPOSIÇÃO', cx, pl.py(0.06));
            c.fillText('X₂/X₁ = ' + Plot.sig(razao, 3), cx, pl.py(0.13));
          });
        });
        g2.draw();

        var sg = Plot.sig;
        var efeito = Math.abs(p.rexc - p.sint) < 0.02
          ? 'X₁ ≈ 0 — absorvedor atuando'
          : Math.abs(p.rexc - wa / w1) < 0.05 || Math.abs(p.rexc - wb / w1) < 0.05
            ? 'Perto de uma NOVA ressonância'
            : 'Fora da sintonia';

        ctx.setPassos([
          { t: 'Sistema original (1 GDL)',
            c: 'ω₁ = √(k₁/m₁) = √(' + k1 + '/' + m1 + ')',
            r: 'ω₁ = ' + sg(w1, 5) + ' rad/s = ' + sg(w1 / 2 / Math.PI, 4) + ' Hz',
            obs: 'Sem absorvedor, a amplitude tende ao infinito quando ω = ω₁.' },
          { t: 'Dimensionamento do absorvedor',
            c: 'm₂ = μ·m₁ = ' + p.mu + ' × ' + m1 + ' = ' + sg(m2, 4) + ' kg\n' +
               'ω₂ = f·ω₁ = ' + p.sint + ' × ' + sg(w1, 5) + ' = ' + sg(w2, 5) + ' rad/s\n' +
               'k₂ = m₂·ω₂² = ' + sg(m2, 4) + ' × ' + sg(w2, 5) + '²',
            r: 'k₂ = ' + sg(k2 / 1000, 4) + ' kN/m',
            obs: 'A condição de anulação exige apenas que √(k₂/m₂) seja igual à frequência da excitação. A razão de massas não entra nessa condição — ela controla outra coisa.' },
          { t: 'Novas frequências naturais',
            c: 'det([K] − ω²[M]) = 0 gera uma equação biquadrada em ω.\n' +
               'Raízes do sistema acoplado:',
            r: 'ω_a = ' + sg(wa, 5) + ' rad/s (' + sg(wa / w1, 4) + '·ω₁)      ω_b = ' + sg(wb, 5) + ' rad/s (' + sg(wb / w1, 4) + '·ω₁)',
            obs: 'A ressonância original desapareceu, mas surgiram DUAS novas, uma de cada lado. Esse é o preço do absorvedor.' },
          { t: 'Resposta na frequência de excitação',
            c: 'ω = ' + p.rexc + '·ω₁ = ' + sg(wexc, 5) + ' rad/s\n' +
               'X₁·k₁/F₀ = (k₂ − m₂ω²)/[(k₁ + k₂ − m₁ω²)(k₂ − m₂ω²) − k₂²] × k₁',
            r: 'X₁ = ' + sg(X1, 4) + '      X₂ = ' + sg(X2, 4) + '  (adimensionais)',
            obs: efeito },
          { t: 'Efeito da razão de massas',
            c: 'μ = ' + p.mu + '  →  separação ω_b/ω_a = ' + sg(wb / wa, 4),
            r: 'Com μ = 0,05 a separação seria ' + sg(Math.sqrt((1 + 0.05 / 2 + Math.sqrt(0.05 + 0.05 * 0.05 / 4)) / (1 + 0.05 / 2 - Math.sqrt(0.05 + 0.05 * 0.05 / 4))), 4),
            obs: 'Aumentar μ afasta as duas novas ressonâncias da frequência de trabalho, tornando o sistema mais tolerante a variações de rotação — ao custo de mais massa e mais espaço.' }
        ]);

        return {
          w1: { v: w1, u: 'rad/s' },
          wa: { v: wa, u: 'rad/s', classe: 'destaque' },
          wb: { v: wb, u: 'rad/s', classe: 'destaque' },
          X1: { v: Math.abs(X1), u: '', classe: Math.abs(X1) < 0.15 ? 'ok' : Math.abs(X1) > 4 ? 'alerta' : '' },
          X2: { v: Math.abs(X2), u: '' },
          efeito: { v: efeito, u: '', classe: efeito.indexOf('atuando') >= 0 ? 'ok' : efeito.indexOf('NOVA') >= 0 ? 'alerta' : '' }
        };
      }
    });
  })();

  /* ============================================================
     5. Balanceamento estático e dinâmico
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-balanceamento')) return;

    var A = { on: true, ang: 0, ultimo: 0, ctx: null, p: null, r: null };

    function rad(g) { return g * Math.PI / 180; }
    var TAU = Math.PI * 2;

    /* Resolve o balanceamento em dois planos.
       Cada massa i contribui com força m_i·r_i·ω² e, em relação ao plano A,
       momento m_i·r_i·z_i·ω². As correções nos planos A e B (em z = 0 e
       z = L) precisam anular as duas coisas. */
    function resolver(p) {
      var L = p.L / 1000;
      var massas = [
        { m: p.m1 / 1000, r: p.r1 / 1000, th: rad(p.a1), z: p.z1 / 1000 * L / (p.L / 1000) },
        { m: p.m2 / 1000, r: p.r2 / 1000, th: rad(p.a2), z: p.z2 / 1000 }
      ];
      massas[0].z = p.z1 / 1000;

      var w = p.n * TAU / 60;
      var Fx = 0, Fy = 0, Mx = 0, My = 0;
      massas.forEach(function (q) {
        var mr = q.m * q.r;
        Fx += mr * Math.cos(q.th);
        Fy += mr * Math.sin(q.th);
        Mx += mr * q.z * Math.cos(q.th);
        My += mr * q.z * Math.sin(q.th);
      });

      /* correções: plano B em z = L anula o momento; plano A anula o resto */
      var mrBx = -Mx / L, mrBy = -My / L;
      var mrAx = -Fx - mrBx, mrAy = -Fy - mrBy;

      function polar(x, y) {
        var mod = Math.sqrt(x * x + y * y);
        var ang = Math.atan2(y, x) * 180 / Math.PI;
        if (ang < 0) ang += 360;
        return { mr: mod, ang: ang };
      }
      var corA = polar(mrAx, mrAy), corB = polar(mrBx, mrBy);

      /* estado antes da correção */
      var U = Math.sqrt(Fx * Fx + Fy * Fy);           /* kg·m */
      var Ucon = Math.sqrt(Mx * Mx + My * My);        /* kg·m² — conjugado */
      var Fcent = U * w * w;                          /* N */
      var Mcent = Ucon * w * w;                       /* N·m */
      /* reações dinâmicas nos mancais, distantes L */
      var R1 = Math.abs(Fcent / 2) + Math.abs(Mcent / L) / 2;
      var R2 = Math.abs(Fcent / 2) + Math.abs(Mcent / L) / 2;

      /* qualidade ISO 1940: excentricidade residual equivalente */
      var Mrot = p.M;
      var eRes = U / Mrot * 1e6;                      /* μm */
      var Gres = eRes * w / 1000;                     /* mm/s */
      var ePerm = p.G * 1000 / w;                     /* μm */
      var Uperm = ePerm * 1e-6 * Mrot;                /* kg·m */

      var soEstatico = U > 1e-12 && Ucon / (U * L) < 0.02;
      var soConjugado = U < 1e-9 && Ucon > 1e-12;

      return { corA: corA, corB: corB, U: U, Ucon: Ucon, Fcent: Fcent, Mcent: Mcent,
               R1: R1, R2: R2, eRes: eRes, Gres: Gres, ePerm: ePerm, Uperm: Uperm,
               w: w, L: L, massas: massas, soEstatico: soEstatico,
               soConjugado: soConjugado, aprovado: U <= Uperm && Ucon <= Uperm * L };
    }

    function desenharRotor(c, pl, p, r, ang) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i;

      /* --- vista lateral, em cima --- */
      var xA = a.x + a.w * 0.22, xB = a.x + a.w * 0.66;
      var cyL = a.y + a.h * 0.30;
      var Rd = Math.min(a.h * 0.20, 52);

      c.setLineDash([]);
      /* eixo */
      c.strokeStyle = cor; c.lineWidth = 6;
      c.globalAlpha = 0.35;
      c.beginPath(); c.moveTo(xA - a.w * 0.12, cyL); c.lineTo(xB + a.w * 0.12, cyL); c.stroke();
      c.globalAlpha = 1;
      /* mancais */
      [[xA - a.w * 0.12, 'mancal 1'], [xB + a.w * 0.12, 'mancal 2']].forEach(function (q) {
        c.strokeStyle = borda; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(q[0] - 11, cyL + 16); c.lineTo(q[0], cyL + 3); c.lineTo(q[0] + 11, cyL + 16);
        c.closePath(); c.stroke();
        c.lineWidth = 1;
        for (var h = -12; h <= 8; h += 5) {
          c.beginPath(); c.moveTo(q[0] + h, cyL + 16); c.lineTo(q[0] + h + 4, cyL + 22); c.stroke();
        }
        c.fillStyle = faint; c.font = '9.5px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText(q[1], q[0], cyL + 24);
      });
      /* discos dos dois planos */
      [[xA, 'plano A', r.corA], [xB, 'plano B', r.corB]].forEach(function (q) {
        c.fillStyle = Plot.serie(0); c.globalAlpha = 0.16;
        c.fillRect(q[0] - 7, cyL - Rd, 14, 2 * Rd);
        c.globalAlpha = 1;
        c.strokeStyle = Plot.serie(0); c.lineWidth = 2;
        c.strokeRect(q[0] - 7, cyL - Rd, 14, 2 * Rd);
        c.fillStyle = Plot.serie(0); c.font = '600 10px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText(q[1], q[0], cyL - Rd - 5);
      });
      /* massas desbalanceadas, na vista lateral */
      r.massas.forEach(function (q, k) {
        var xm = xA + (xB - xA) * (q.z / r.L);
        var ym = cyL - Rd * (q.r / (p.r1 / 1000 || 1)) * 0.75 * Math.sin(q.th + ang);
        c.fillStyle = Plot.serie(5);
        c.beginPath(); c.arc(xm, ym, 6, 0, TAU); c.fill();
        c.fillStyle = Plot.serie(5); c.font = '600 9.5px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('m' + (k + 1), xm, ym - 8);
      });
      /* cota entre planos */
      var yc = cyL + Rd + 40;
      c.strokeStyle = faint; c.fillStyle = faint; c.lineWidth = 1;
      c.beginPath(); c.moveTo(xA, yc); c.lineTo(xB, yc); c.stroke();
      [[xA, 1], [xB, -1]].forEach(function (q) {
        c.beginPath();
        c.moveTo(q[0], yc); c.lineTo(q[0] + q[1] * 8, yc - 3.6);
        c.lineTo(q[0] + q[1] * 8, yc + 3.6); c.closePath(); c.fill();
      });
      c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('L = ' + p.L + ' mm entre planos', (xA + xB) / 2, yc - 5);

      /* --- vistas frontais dos dois planos, embaixo --- */
      var cyF = a.y + a.h * 0.76;
      var Rf = Math.min(a.h * 0.20, 56);
      [[a.x + a.w * 0.27, 'PLANO A', r.corA, 0],
       [a.x + a.w * 0.68, 'PLANO B', r.corB, 1]].forEach(function (q) {
        var cx = q[0];
        c.strokeStyle = borda; c.lineWidth = 2;
        c.beginPath(); c.arc(cx, cyF, Rf, 0, TAU); c.stroke();
        c.strokeStyle = faint; c.lineWidth = 1; c.setLineDash([3, 3]);
        c.beginPath(); c.moveTo(cx - Rf, cyF); c.lineTo(cx + Rf, cyF); c.stroke();
        c.beginPath(); c.moveTo(cx, cyF - Rf); c.lineTo(cx, cyF + Rf); c.stroke();
        c.setLineDash([]);
        c.fillStyle = cor; c.beginPath(); c.arc(cx, cyF, 4, 0, TAU); c.fill();

        /* massa desbalanceada daquele plano */
        var mm = r.massas[q[3]];
        if (mm && mm.m > 0) {
          var th = mm.th + ang;
          var rr = Rf * 0.78;
          var xm = cx + rr * Math.cos(th), ym = cyF - rr * Math.sin(th);
          c.strokeStyle = Plot.serie(5); c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(cx, cyF); c.lineTo(xm, ym); c.stroke();
          c.fillStyle = Plot.serie(5);
          c.beginPath(); c.arc(xm, ym, 7, 0, TAU); c.fill();
          c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
          c.font = '700 8.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(String(q[3] + 1), xm, ym);
        }

        /* massa de correção */
        if (q[2].mr > 1e-9) {
          var thc = rad(q[2].ang) + ang;
          var rc = Rf * 0.60;
          var xc = cx + rc * Math.cos(thc), yc2 = cyF - rc * Math.sin(thc);
          c.strokeStyle = Plot.serie(2); c.lineWidth = 2;
          c.beginPath(); c.moveTo(cx, cyF); c.lineTo(xc, yc2); c.stroke();
          c.fillStyle = Plot.serie(2);
          c.beginPath(); c.arc(xc, yc2, 8, 0, TAU); c.fill();
          c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
          c.font = '700 9px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('+', xc, yc2);
        }

        c.fillStyle = cor; c.font = '700 11px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText(q[1], cx, cyF + Rf + 8);
        c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
        c.fillStyle = Plot.serie(2);
        c.fillText('correção: ' + Plot.sig(q[2].mr / (p.rc / 1000) * 1000, 3) + ' g a ' +
                   Plot.sig(q[2].ang, 3) + '°', cx, cyF + Rf + 23);
      });

      /* legenda */
      c.fillStyle = cor; c.font = '650 12.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Rotor em dois planos — massas de desbalanceamento e correção', a.x + 4, a.y + 2);
      c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.fillStyle = faint;
      c.fillText('vermelho = desbalanceamento · verde = massa a acrescentar · ' +
                 (r.soConjugado ? 'este caso é de CONJUGADO PURO: estaticamente balanceado, dinamicamente não'
                  : (r.soEstatico ? 'este caso é praticamente ESTÁTICO: um plano resolveria'
                     : 'há força E conjugado: exige os dois planos')),
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-balanceamento', {
      titulo: 'Balanceamento estático e dinâmico',
      descricao: 'Duas massas desbalanceadas em planos diferentes. Veja quando um plano de correção basta, quando são necessários dois, e o caso traiçoeiro em que o rotor está estaticamente balanceado e mesmo assim castiga os mancais.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Desbalanceamento estático puro', desc: 'Uma massa só: a resultante não é nula, o conjugado quase',
          valores: { m1: 40, r1: 120, a1: 0, z1: 0, m2: 0, r2: 120, a2: 0, z2: 400, L: 400, rc: 120, n: 1800, M: 60, G: 6.3, animar: true } },
        { nome: '2 · Conjugado puro — o caso traiçoeiro', desc: 'Massas opostas em planos diferentes: passa no teste estático e vibra',
          valores: { m1: 40, r1: 120, a1: 0, z1: 0, m2: 40, r2: 120, a2: 180, z2: 400, L: 400, rc: 120, n: 1800, M: 60, G: 6.3, animar: true } },
        { nome: '3 · Desbalanceamento combinado', desc: 'Força e conjugado juntos — o caso geral',
          valores: { m1: 50, r1: 120, a1: 0, z1: 0, m2: 30, r2: 100, a2: 110, z2: 400, L: 400, rc: 120, n: 1800, M: 60, G: 6.3, animar: true } },
        { nome: '4 · Dobrando a rotação', desc: 'A força centrífuga quadruplica e a tolerância cai à metade',
          valores: { m1: 50, r1: 120, a1: 0, z1: 0, m2: 30, r2: 100, a2: 110, z2: 400, L: 400, rc: 120, n: 3600, M: 60, G: 6.3, animar: true } },
        { nome: '5 · Exigência de turbina (G 2,5)', desc: 'Grau mais severo: o mesmo rotor reprova',
          valores: { m1: 50, r1: 120, a1: 0, z1: 0, m2: 30, r2: 100, a2: 110, z2: 400, L: 400, rc: 120, n: 3600, M: 60, G: 2.5, animar: true } },
        { nome: '6 · Rotor bem balanceado', desc: 'Massas pequenas e quase opostas: aprovado',
          valores: { m1: 3, r1: 120, a1: 0, z1: 0, m2: 3, r2: 120, a2: 175, z2: 400, L: 400, rc: 120, n: 1800, M: 60, G: 6.3, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Massa desbalanceada 1' },
        { id: 'm1', label: 'Massa m₁', min: 0, max: 200, step: 1, valor: 50, unidade: 'g' },
        { id: 'r1', label: 'Raio r₁', min: 20, max: 300, step: 5, valor: 120, unidade: 'mm' },
        { id: 'a1', label: 'Ângulo θ₁', min: 0, max: 355, step: 5, valor: 0, unidade: '°' },
        { id: 'z1', label: 'Posição axial z₁', min: 0, max: 600, step: 10, valor: 0, unidade: 'mm' },
        { tipo: 'titulo', label: 'Massa desbalanceada 2' },
        { id: 'm2', label: 'Massa m₂', min: 0, max: 200, step: 1, valor: 30, unidade: 'g' },
        { id: 'r2', label: 'Raio r₂', min: 20, max: 300, step: 5, valor: 100, unidade: 'mm' },
        { id: 'a2', label: 'Ângulo θ₂', min: 0, max: 355, step: 5, valor: 110, unidade: '°' },
        { id: 'z2', label: 'Posição axial z₂', min: 0, max: 600, step: 10, valor: 400, unidade: 'mm' },
        { tipo: 'titulo', label: 'Rotor e critério' },
        { id: 'L', label: 'Distância entre planos L', min: 100, max: 600, step: 10, valor: 400, unidade: 'mm' },
        { id: 'rc', label: 'Raio de correção', min: 30, max: 300, step: 5, valor: 120, unidade: 'mm',
          desc: 'Onde se pode furar ou soldar o contrapeso. Raio maior = menos massa.' },
        { id: 'n', label: 'Rotação de serviço', min: 300, max: 6000, step: 50, valor: 1800, unidade: 'rpm' },
        { id: 'M', label: 'Massa do rotor', min: 5, max: 500, step: 5, valor: 60, unidade: 'kg' },
        { id: 'G', tipo: 'select', label: 'Grau de qualidade ISO 1940', valor: 6.3,
          opcoes: [
            { v: 40, t: 'G 40 — rodas de veículo' },
            { v: 16, t: 'G 16 — cardan, motor diesel' },
            { v: 6.3, t: 'G 6,3 — bombas e ventiladores' },
            { v: 2.5, t: 'G 2,5 — turbinas e turbocompressores' },
            { v: 1, t: 'G 1 — acionamento de precisão' },
            { v: 0.4, t: 'G 0,4 — fusos de retífica' }
          ] },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Girar o rotor', valor: true }
      ],
      graficos: [
        { id: 'rotor', axes: false, height: 420, grid: false, legend: false },
        { id: 'forca', titulo: 'Força centrífuga e tolerância em função da rotação',
          xlabel: 'Rotação (rpm)', ylabel: 'Força de desbalanceamento (N)', aspect: 0.34,
          legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'U', label: 'Desbalanceamento U' },
        { id: 'Uc', label: 'Desbalanc. de conjugado' },
        { id: 'F', label: 'Força centrífuga' },
        { id: 'Rm', label: 'Reação dinâmica no mancal' },
        { id: 'mA', label: 'Correção no plano A' },
        { id: 'mB', label: 'Correção no plano B' },
        { id: 'Gr', label: 'Qualidade atual G' },
        { id: 'sit', label: 'Situação' }
      ],
      formulas: [
        { g: 'As duas condições de balanceamento' },
        { tex: '\\sum m_i r_i \\vec{e}_i = 0', d: 'ESTÁTICO: anula a resultante das forças centrífugas', destaque: true },
        { tex: '\\sum m_i r_i z_i \\vec{e}_i = 0', d: 'DINÂMICO: anula também o conjugado — exige dois planos', destaque: true },
        { tex: '\\text{4 equações escalares} \\Rightarrow \\text{2 planos} \\times \\text{(massa, ângulo)}',
          d: 'é por isso que o balanceamento dinâmico precisa de exatamente dois planos' },

        { g: 'Força e conjugado' },
        { tex: 'F = m_e\\,e\\,\\omega^2 = U\\,\\omega^2', d: 'cresce com o QUADRADO da rotação', destaque: true },
        { tex: 'M = \\sum m_i r_i z_i\\,\\omega^2', d: 'conjugado que faz o eixo chicotear entre os mancais' },
        { tex: 'R_{\\text{mancal}} \\approx \\frac{F}{2} + \\frac{M}{2L}', d: 'carga dinâmica adicional em cada mancal' },

        { g: 'Correção em dois planos' },
        { tex: '(m r)_B = -\\frac{\\sum m_i r_i z_i}{L}', d: 'o plano B anula primeiro o momento', destaque: true },
        { tex: '(m r)_A = -\\sum m_i r_i - (m r)_B', d: 'o plano A fecha o equilíbrio de forças' },
        { tex: 'm_{\\text{corr}} = \\frac{(mr)}{r_{\\text{correção}}}',
          d: 'raio de correção maior significa contrapeso menor' },

        { g: 'Critério de aceitação — ISO 1940' },
        { tex: 'e_{\\text{perm}} = \\frac{G \\cdot 1000}{\\omega}',
          d: 'e_perm em μm, G em mm/s, ω em rad/s — a tolerância CAI com a rotação', destaque: true },
        { tex: 'U_{\\text{perm}} = e_{\\text{perm}} \\cdot M_{\\text{rotor}}',
          d: 'desbalanceamento residual admissível' },
        { tex: 'G = \\frac{e\\,\\omega}{1000}', d: 'grau de qualidade efetivamente atingido' },

        { g: 'Coeficientes de influência' },
        { tex: '\\alpha_{ij} = \\frac{\\vec{V}_i - \\vec{V}_i^{\\,0}}{\\vec{m}_j}',
          d: 'resposta do mancal i a uma massa de prova no plano j — número complexo' },
        { tex: '[\\alpha]\\{\\vec{m}\\} = -\\{\\vec{V}^{\\,0}\\}',
          d: 'resolve-se o sistema 2×2 complexo para achar as massas de correção' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Rotor rígido, operando abaixo da primeira velocidade crítica. Acima dela o eixo se deforma e o balanceamento precisa ser feito modo a modo, na rotação de serviço.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var nt = Plot.numTex, sg = Plot.sig;
        var rc = p.rc / 1000;

        /* ---- força × rotação ---- */
        var ns = Plot.linspace(200, Math.max(6000, p.n * 1.2), 80);
        var gf = ctx.plot('forca').clear();
        gf.line(ns, ns.map(function (nn) {
          var ww = nn * TAU / 60;
          return r.U * ww * ww;
        }), { color: Plot.serie(5), width: 2.6, label: 'Força do desbalanceamento atual' });
        gf.line(ns, ns.map(function (nn) {
          var ww = nn * TAU / 60;
          var Up = (p.G * 1000 / ww) * 1e-6 * p.M;
          return Up * ww * ww;
        }), { color: Plot.serie(2), width: 2.2, dash: [5, 4],
              label: 'Limite ISO G ' + p.G + ' (cresce só com ω)' });
        gf.vline(p.n, { color: Plot.serie(6), dash: [4, 3], width: 1.4,
                        text: 'serviço: ' + p.n + ' rpm' });
        gf.marker(p.n, r.Fcent, Plot.sig(r.Fcent, 4) + ' N', { color: Plot.serie(5) });
        gf.draw();

        /* ---- passo a passo ---- */
        ctx.setPassos([
          { t: '① Desbalanceamento resultante (condição estática)',
            tex: 'U = \\left|\\sum m_i r_i \\vec{e}_i\\right|',
            texSub: 'U = ' + nt(r.U * 1e6) + '\\ \\mathrm{g\\cdot mm}',
            obs: r.U < 1e-9
              ? 'A resultante é NULA: o rotor está estaticamente balanceado — fica parado em qualquer '
                + 'posição. Isso não garante nada sobre o conjugado.'
              : 'A resultante não é nula: colocado sobre facas, o rotor giraria sozinho até o ponto '
                + 'pesado ficar embaixo. É o desbalanceamento que o teste estático detecta.' },
          { t: '② Desbalanceamento de conjugado (condição dinâmica)',
            tex: 'U_c = \\left|\\sum m_i r_i z_i \\vec{e}_i\\right|',
            texSub: 'U_c = ' + nt(r.Ucon * 1e6) + '\\ \\mathrm{g\\cdot mm\\cdot m}',
            obs: r.soConjugado
              ? 'ATENÇÃO: aqui a resultante é nula mas o conjugado NÃO. O rotor passa no teste estático '
                + 'e ainda assim castiga os mancais com ' + sg(r.Mcent, 3) + ' N·m alternados. Só o '
                + 'balanceamento em dois planos resolve.'
              : 'O conjugado tenta girar o eixo em torno de um eixo perpendicular, carregando '
                + 'alternadamente cada mancal.' },
          { t: '③ Força centrífuga na rotação de serviço',
            tex: 'F = U\\,\\omega^2 \\quad\\text{com}\\quad \\omega = \\frac{2\\pi n}{60}',
            texSub: '\\omega = \\frac{2\\pi \\cdot ' + p.n + '}{60} = ' + nt(r.w) +
              '\\ \\mathrm{rad/s} \\;\\Rightarrow\\; F = ' + nt(r.U) + ' \\cdot ' + nt(r.w) +
              '^2 = ' + nt(r.Fcent) + '\\ \\mathrm{N}',
            obs: 'Compare com o peso do rotor, ' + sg(p.M * 9.81, 4) + ' N: a força de '
              + 'desbalanceamento representa ' + sg(r.Fcent / (p.M * 9.81) * 100, 3) + ' % dele — e '
              + 'gira junto com o eixo, ' + sg(p.n / 60, 3) + ' vezes por segundo.' },
          { t: '④ Massa de correção no plano B',
            tex: '(m r)_B = -\\frac{\\sum m_i r_i z_i}{L} \\;\\Rightarrow\\; m_B = \\frac{(mr)_B}{r_{\\text{corr}}}',
            texSub: 'm_B = \\frac{' + nt(r.corB.mr * 1e3) + '}{' + nt(rc) + '} = ' +
              nt(r.corB.mr / rc * 1000) + '\\ \\mathrm{g} \\quad\\text{a}\\quad ' +
              nt(r.corB.ang) + '^\\circ',
            obs: 'Este plano é escolhido primeiro porque é ele que anula o momento — o plano A não '
              + 'tem braço em relação a si mesmo.' },
          { t: '⑤ Massa de correção no plano A',
            tex: '(m r)_A = -\\sum m_i r_i - (m r)_B',
            texSub: 'm_A = \\frac{' + nt(r.corA.mr * 1e3) + '}{' + nt(rc) + '} = ' +
              nt(r.corA.mr / rc * 1000) + '\\ \\mathrm{g} \\quad\\text{a}\\quad ' +
              nt(r.corA.ang) + '^\\circ',
            obs: 'Com as duas massas colocadas, força e conjugado se anulam simultaneamente e o rotor '
              + 'fica dinamicamente balanceado.' },
          { t: '⑥ Verificação contra a ISO 1940',
            tex: 'e_{\\text{perm}} = \\frac{G \\cdot 1000}{\\omega} \\qquad U_{\\text{perm}} = e_{\\text{perm}} M',
            texSub: 'e_{\\text{perm}} = \\frac{' + p.G + ' \\cdot 1000}{' + nt(r.w) + '} = ' +
              nt(r.ePerm) + '\\ \\mu\\mathrm{m} \\;\\Rightarrow\\; U_{\\text{perm}} = ' +
              nt(r.Uperm * 1e6) + '\\ \\mathrm{g\\cdot mm}',
            obs: r.aprovado
              ? 'O desbalanceamento atual (' + sg(r.U * 1e6, 4) + ' g·mm) está dentro do permitido: APROVADO no grau G ' + p.G + '.'
              : 'O desbalanceamento atual (' + sg(r.U * 1e6, 4) + ' g·mm) excede o permitido ('
                + sg(r.Uperm * 1e6, 4) + ' g·mm): REPROVADO no grau G ' + p.G
                + '. A qualidade atingida é G ' + sg(r.Gres, 3) + '.' }
        ]);

        return {
          U: { v: r.U * 1e6, u: 'g·mm' },
          Uc: { v: r.Ucon * 1e6, u: 'g·mm·m', classe: r.soConjugado ? 'alerta' : '' },
          F: { v: r.Fcent, u: 'N' },
          Rm: { v: r.R1, u: 'N' },
          mA: { v: r.corA.mr / rc * 1000, u: 'g @ ' + Plot.sig(r.corA.ang, 3) + '°' },
          mB: { v: r.corB.mr / rc * 1000, u: 'g @ ' + Plot.sig(r.corB.ang, 3) + '°' },
          Gr: { v: r.Gres, u: 'mm/s', classe: r.Gres <= p.G ? 'ok' : 'alerta' },
          sit: { v: r.soConjugado ? 'conjugado puro' : (r.aprovado ? 'aprovado' : 'reprovado'),
                 u: '', classe: r.aprovado && !r.soConjugado ? 'ok' : 'alerta' }
        };
      }
    });

    function desenha() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('rotor');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharRotor(c, plot, A.p, A.r, A.ang); });
      pl.draw();
    }

    registrarQuadro(function () {
      if (!A.on || !A.ctx) return;
      var agora = performance.now();
      var dt = A.ultimo ? (agora - A.ultimo) / 1000 : 0.016;
      A.ultimo = agora;
      if (dt > 0.2 || dt <= 0) dt = 0.016;
      A.ang += TAU * (A.p.n / 60) * dt * 0.03;
      if (A.ang > TAU * 1e4) A.ang -= TAU * 1e4;
      desenha();
    });
  })();

})();

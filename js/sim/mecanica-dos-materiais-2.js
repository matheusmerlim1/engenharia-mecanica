/* ============================================================
   Mecanica dos Materiais II - simuladores
   1. sim-mohr        Circulo de Mohr (estado plano de tensoes)
   2. sim-flambagem   Colunas: Euler x Johnson
   3. sim-vaso        Vaso de pressao: parede fina x Lame
   4. sim-criterios   Criterios de falha estatica
   ============================================================ */

/* ------------------------------------------------------------
   1. CIRCULO DE MOHR
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-mohr')) return;

  var GR = Math.PI / 180;

  function seta(c, x0, y0, x1, y1, cor, larg) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1) return;
    var ux = dx / L, uy = dy / L, h = Math.min(9, L * 0.42);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 1.8;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.7, y1 - uy * h * 0.7); c.stroke();
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x1 - ux * h - uy * h * 0.36, y1 - uy * h + ux * h * 0.36);
    c.lineTo(x1 - ux * h + uy * h * 0.36, y1 - uy * h - ux * h * 0.36);
    c.closePath(); c.fill();
  }

  Sim.build('#sim-mohr', {
    titulo: 'Círculo de Mohr — estado plano de tensões',
    descricao: 'Ajuste o estado de tensão e gire o elemento. O círculo e o elemento girado são a mesma informação vista de dois jeitos.',
    controles: [
      { id: 'sx', label: 'σx', min: -250, max: 250, step: 1, valor: 100, unidade: 'MPa' },
      { id: 'sy', label: 'σy', min: -250, max: 250, step: 1, valor: -40, unidade: 'MPa' },
      { id: 'txy', label: 'τxy', min: -200, max: 200, step: 1, valor: 50, unidade: 'MPa' },
      { tipo: 'separador' },
      { id: 'th', label: 'Rotacao do elemento θ', min: 0, max: 180, step: 1, valor: 25, unidade: '°',
        desc: 'Positivo no sentido anti-horario. No circulo o ponto anda 2θ.' },
      { id: 'sz', tipo: 'check', label: 'Considerar σ3 = 0 (estado plano real)', valor: true,
        desc: 'Liga o calculo da τ maxima ABSOLUTA em 3D, que costuma ser maior que a do plano.' },
      { id: 'verEnv', tipo: 'check', label: 'Mostrar envoltoria σ(θ) e τ(θ)', valor: false }
    ],
    graficos: [
      { id: 'circ', xlabel: 'σ (MPa)', ylabel: 'τ (MPa)', aspect: 0.62, equalAspect: true, legendPos: 'topleft' },
      /* axes:false porque este quadro e um DESENHO: numero de eixo aqui nao
         significa nada e so polui (o quadrado tem lado arbitrario) */
      { id: 'elem', titulo: 'Elemento girado de θ', title: 'Elemento girado de θ',
        aspect: 0.62, equalAspect: true, axes: false,
        grid: false, legend: false, xlim: [-1.75, 1.75], ylim: [-1.4, 1.4],
        legenda: 'Setas cheias = tensao normal (para fora = tracao, para dentro = compressao). '
               + 'As setas tangenciais nas quatro faces formam o binario de cisalhamento.' }
    ],
    saidas: [
      { id: 's1', label: 'σ1' },
      { id: 's2', label: 'σ2' },
      { id: 'thp', label: 'θp' },
      { id: 'tmax', label: 'τmax no plano' },
      { id: 'tabs', label: 'τmax absoluta' },
      { id: 'smed', label: 'σmed' },
      { id: 'vm', label: 'von Mises σ\'' },
      { id: 'sxl', label: "σx' em θ" },
      { id: 'syl', label: "σy' em θ" },
      { id: 'txyl', label: "τx'y' em θ" }
    ],
      formulas: [
        { g: 'Transformação de tensões' },
        { tex: '\\sigma_{x\'} = \\frac{\\sigma_x+\\sigma_y}{2} + \\frac{\\sigma_x-\\sigma_y}{2}\\cos 2\\theta + \\tau_{\\text{xy}}\\sin 2\\theta', d: 'tensão normal no plano girado de θ', destaque: true },
        { tex: '\\tau_{x\'y\'} = -\\frac{\\sigma_x-\\sigma_y}{2}\\sin 2\\theta + \\tau_{\\text{xy}}\\cos 2\\theta', d: 'cisalhamento no plano girado' },
        { tex: '\\sigma_x + \\sigma_y = \\sigma_1 + \\sigma_2 = \\text{invariante}', d: 'a soma não muda com a rotação — ótimo teste de conferência' },

        { g: 'Círculo de Mohr' },
        { tex: '\\sigma_{m} = \\frac{\\sigma_x+\\sigma_y}{2}', d: 'abscissa do CENTRO do círculo', destaque: true },
        { tex: 'R = \\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2 + \\tau_{\\text{xy}}^2}', d: 'RAIO do círculo, e também o τ máximo no plano', destaque: true },
        { tex: '\\sigma_{1,2} = \\sigma_m \\pm R', d: 'tensões principais: cruzamentos com o eixo horizontal' },
        { tex: '\\tan 2\\theta_p = \\frac{2\\tau_{\\text{xy}}}{\\sigma_x - \\sigma_y}', d: 'orientação dos planos principais — atenção ao fator 2' },

        { g: 'Cisalhamento máximo' },
        { tex: '\\tau_{\\text{max}}^{\\text{plano}} = R', d: 'considerando apenas o plano analisado' },
        { tex: '\\tau_{\\text{max}}^{\\text{abs}} = \\frac{\\sigma_{\\text{max}} - \\sigma_{\\text{min}}}{2}', d: 'INCLUINDO σ₃; no estado plano σ₃ = 0 e isso muda o resultado', destaque: true },
        { tex: '\\theta_s = \\theta_p \\pm 45^\\circ', d: 'planos de τ máximo ficam a 45° dos principais' },

        { g: 'Critério de falha' },
        { tex: '\\sigma\'  = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}', d: 'von Mises no estado plano' }
      ],
      formulasTitulo: 'Fórmulas — transformação de tensões',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    nota: 'Convencao de plotagem: X = (σx, τxy) e Y = (σy, −τxy), com τ positivo para cima. Com essa convencao o ponto percorre o circulo no sentido HORARIO quando θ cresce no sentido anti-horario — o angulo no circulo e sempre 2θ. σ1 e σ2 sao as tensoes principais NO PLANO; se σ3 = 0 estiver ativo, a τmax absoluta usa as tres principais.',
    calcular: function (p, ctx) {
      var sx = p.sx, sy = p.sy, txy = p.txy, th = p.th * GR;
      var sm = (sx + sy) / 2, a = (sx - sy) / 2;
      var R = Math.sqrt(a * a + txy * txy);
      var s1 = sm + R, s2 = sm - R;
      var thp = 0.5 * Math.atan2(2 * txy, sx - sy) / GR;
      var tmax = R;

      /* tensoes na face girada */
      var c2 = Math.cos(2 * th), s2t = Math.sin(2 * th);
      var sxl = sm + a * c2 + txy * s2t;
      var syl = sm - a * c2 - txy * s2t;
      var txyl = -a * s2t + txy * c2;

      /* von Mises no estado plano */
      var vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);

      /* tau maxima absoluta com sigma3 = 0 */
      var pr = [s1, s2, p.sz ? 0 : s2];
      var tabs = (Math.max.apply(null, pr) - Math.min.apply(null, pr)) / 2;

      /* --------- grafico 1: o circulo --------- */
      var n = 181, xs = [], ys = [];
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1) * 2 * Math.PI;
        xs.push(sm + R * Math.cos(t));
        ys.push(R * Math.sin(t));
      }
      var pl = ctx.plot('circ');
      pl.clear()
        .line(xs, ys, { color: Plot.serie(0), width: 2.2, label: 'Circulo de Mohr' })
        .line([sx, sy], [txy, -txy], { color: Plot.serie(3), width: 1.4, dash: [5, 4], label: 'Diametro X–Y (θ = 0)' })
        .line([sxl, syl], [txyl, -txyl], { color: Plot.serie(1), width: 1.6, label: 'Diametro X\'–Y\' (2θ)' })
        .marker(sx, txy, 'X (σx, τxy)', { color: Plot.serie(3) })
        .marker(sy, -txy, 'Y (σy, −τxy)', { color: Plot.serie(3), align: 'right', dx: -7 })
        .marker(sxl, txyl, "X'", { color: Plot.serie(1) })
        .marker(s1, 0, 'σ1', { color: Plot.serie(2), dy: 14 })
        .marker(s2, 0, 'σ2', { color: Plot.serie(2), align: 'right', dx: -7, dy: 14 })
        .marker(sm, R, 'τmax', { color: Plot.serie(4) })
        .marker(sm, -R, '', { color: Plot.serie(4) })
        .marker(sm, 0, 'C', { color: Plot.serie(5), dy: 15, align: 'center' });

      if (p.sz && !(s1 > 0 && s2 > 0) && !(s1 < 0 && s2 < 0)) {
        /* estado plano com sinais opostos: o circulo do plano ja e o maior */
        pl.hline(tabs, { color: Plot.serie(6), dash: [3, 3], text: 'τ absoluta = ' + Plot.sig(tabs, 4) + ' MPa' });
      } else if (p.sz) {
        pl.hline(tabs, { color: Plot.serie(6), dash: [3, 3], text: 'τ ABS (com σ3=0) = ' + Plot.sig(tabs, 4) + ' MPa' });
      }
      pl.draw();

      /* --------- grafico 2: o elemento girado --------- */
      var pe = ctx.plot('elem');
      pe.clear();
      pe.custom(function (c, P) {
        var cT = Plot.cssVar('--text', '#111');
        var cM = Plot.cssVar('--text-muted', '#666');
        var cN = Plot.serie(0), cS = Plot.serie(4);
        var cx = P.px(0), cy = P.py(0);
        var lado = Math.abs(P.px(0.42) - P.px(0));
        var co = Math.cos(th), si = Math.sin(th);
        /* eixos do elemento em pixel (y cresce para baixo no canvas) */
        var ex = { x: co, y: -si };            /* direcao x' */
        var ey = { x: -si, y: -co };           /* direcao y' */

        /* quadrado */
        c.strokeStyle = cM; c.lineWidth = 1.6; c.setLineDash([]);
        c.beginPath();
        var q = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
        q.forEach(function (v, k) {
          var X = cx + (ex.x * v[0] + ey.x * v[1]) * lado;
          var Y = cy + (ex.y * v[0] + ey.y * v[1]) * lado;
          if (k === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
        });
        c.closePath();
        c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
        c.globalAlpha = 0.6; c.fill(); c.globalAlpha = 1; c.stroke();

        /* referencia dos eixos globais */
        c.strokeStyle = Plot.cssVar('--text-faint', '#999');
        c.lineWidth = 1; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(cx - lado * 2.4, cy); c.lineTo(cx + lado * 2.4, cy);
        c.moveTo(cx, cy - lado * 1.9); c.lineTo(cx, cy + lado * 1.9); c.stroke();
        c.setLineDash([]);

        var maxS = Math.max(Math.abs(sxl), Math.abs(syl), Math.abs(txyl), 1);
        var esc = lado * 0.95 / maxS;

        /* normais nas 4 faces */
        function normal(dir, val, rot) {
          var sgn = val >= 0 ? 1 : -1;
          var mx = cx + dir.x * lado, my = cy + dir.y * lado;
          var comp = Math.abs(val) * esc + 6;
          var x0, y0, x1, y1;
          if (sgn > 0) { x0 = mx; y0 = my; x1 = mx + dir.x * comp; y1 = my + dir.y * comp; }
          else { x0 = mx + dir.x * comp; y0 = my + dir.y * comp; x1 = mx; y1 = my; }
          seta(c, x0, y0, x1, y1, cN, 2);
          c.fillStyle = cN;
          c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'middle';
          var lx = mx + dir.x * (comp + 15), ly = my + dir.y * (comp + 15);
          c.fillText(rot + ' ' + Plot.sig(val, 3), lx, ly);
        }
        normal(ex, sxl, "σx'");
        normal({ x: -ex.x, y: -ex.y }, sxl, '');
        normal(ey, syl, "σy'");
        normal({ x: -ey.x, y: -ey.y }, syl, '');

        /* cisalhamento tangencial nas faces (binario positivo) */
        function cis(dir, tang, val) {
          var comp = Math.abs(val) * esc * 0.85 + 4;
          var sgn = val >= 0 ? 1 : -1;
          var mx = cx + dir.x * lado * 1.02, my = cy + dir.y * lado * 1.02;
          seta(c, mx - tang.x * comp * sgn * 0.5, my - tang.y * comp * sgn * 0.5,
                  mx + tang.x * comp * sgn * 0.5, my + tang.y * comp * sgn * 0.5, cS, 1.7);
        }
        cis(ex, ey, txyl);
        cis({ x: -ex.x, y: -ex.y }, { x: -ey.x, y: -ey.y }, txyl);
        cis(ey, ex, txyl);
        cis({ x: -ey.x, y: -ey.y }, { x: -ex.x, y: -ex.y }, txyl);

        c.fillStyle = cS;
        c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText("τx'y' = " + Plot.sig(txyl, 3) + ' MPa', P.px(-1.68), P.py(-1.15));
        c.fillStyle = cT;
        c.fillText('θ = ' + p.th.toFixed(0) + '°   (θp = ' + thp.toFixed(1) + '°)', P.px(-1.68), P.py(-1.32));
        if (Math.abs(txyl) < 0.5) {
          c.fillStyle = Plot.serie(2);
          c.textAlign = 'right';
          c.fillText('PLANO PRINCIPAL', P.px(1.68), P.py(-1.15));
        }
      });
      if (p.verEnv) {
        var ths = Plot.linspace(0, 180, 181);
        var sxs = Plot.map(ths, function (t) { return sm + a * Math.cos(2 * t * GR) + txy * Math.sin(2 * t * GR); });
        var tvs = Plot.map(ths, function (t) { return -a * Math.sin(2 * t * GR) + txy * Math.cos(2 * t * GR); });
        var sc = 1.15 / Math.max(Math.abs(s1), Math.abs(s2), 1);
        pe.line(Plot.map(ths, function (t) { return -1.6 + t / 180 * 3.2; }), Plot.map(sxs, function (v) { return v * sc; }),
                { color: Plot.serie(0), width: 1.2, dash: [4, 3] });
        pe.line(Plot.map(ths, function (t) { return -1.6 + t / 180 * 3.2; }), Plot.map(tvs, function (v) { return v * sc; }),
                { color: Plot.serie(4), width: 1.2, dash: [4, 3] });
      }
      pe.draw();

      var nt = Plot.numTex, sg = Plot.sig;
      ctx.setPassos([
        { t: 'Estado de tensão dado',
          texSub: '\\sigma_x = ' + nt(p.sx, 4) + '\\ \\text{MPa} \\quad \\sigma_y = ' + nt(p.sy, 4) +
                  '\\ \\text{MPa} \\quad \\tau_{xy} = ' + nt(p.txy, 4) + '\\ \\text{MPa}' },
        { t: 'Centro do círculo',
          tex: '\\sigma_m = \\frac{\\sigma_x + \\sigma_y}{2}',
          texSub: '\\sigma_m = \\frac{' + nt(p.sx, 4) + ' + (' + nt(p.sy, 4) + ')}{2} = ' +
                  nt(sm, 4) + '\\ \\text{MPa}' },
        { t: 'Raio do círculo',
          tex: 'R = \\sqrt{\\left(\\frac{\\sigma_x-\\sigma_y}{2}\\right)^2 + \\tau_{\\text{xy}}^2}',
          texSub: 'R = \\sqrt{\\left(' + nt((p.sx - p.sy) / 2, 4) + '\\right)^2 + (' +
                  nt(p.txy, 4) + ')^2} = ' + nt(R, 4) + '\\ \\text{MPa}',
          obs: 'Cuidado com o sinal de σy: se ele for negativo, a diferença AUMENTA.' },
        { t: 'Tensões principais',
          tex: '\\sigma_{1,2} = \\sigma_m \\pm R',
          texSub: '\\sigma_1 = ' + nt(sm, 4) + ' + ' + nt(R, 4) + ' = ' + nt(s1, 4) +
                  ' \\qquad \\sigma_2 = ' + nt(sm, 4) + ' - ' + nt(R, 4) + ' = ' + nt(sm - R, 4),
          r: 'σ₁ = ' + sg(s1, 4) + ' MPa    σ₂ = ' + sg(sm - R, 4) + ' MPa',
          obs: 'Conferência: σ₁ + σ₂ = ' + sg(s1 + sm - R, 4) + ' deve dar σx + σy = ' +
               sg(p.sx + p.sy, 4) + '.' },
        { t: 'Orientação dos planos principais',
          tex: '\\theta_p = \\frac{1}{2}\\arctan\\!\\left(\\frac{2\\tau_{\\text{xy}}}{\\sigma_x - \\sigma_y}\\right)',
          texSub: '2\\theta_p = \\arctan\\!\\left(\\frac{' + nt(2 * p.txy, 4) + '}{' +
                  nt(p.sx - p.sy, 4) + '}\\right) \\;\\Rightarrow\\; \\theta_p = ' + sg(thp, 4) + '^\\circ',
          obs: 'O ângulo no círculo é 2θp; o giro real do elemento é θp — metade.' },
        { t: 'Cisalhamento máximo',
          tex: '\\tau_{\\text{max}}^{\\text{plano}} = R \\qquad \\tau_{\\text{max}}^{\\text{abs}} = \\frac{\\sigma_{\\text{max}}-\\sigma_{\\text{min}}}{2}',
          texSub: '\\tau_{\\text{max}}^{\\text{plano}} = ' + nt(R, 4) + ' \\qquad \\tau_{max}^{abs} = ' +
                  nt(tabs, 4) + '\\ \\text{MPa}',
          obs: Math.abs(tabs - R) > 0.01
            ? 'Diferem! Como σ₁ e σ₂ têm o mesmo sinal, o maior cisalhamento envolve σ₃ = 0, num plano fora do papel.'
            : 'Coincidem, porque σ₁ e σ₂ têm sinais opostos e σ₃ = 0 fica entre eles.' },
        { t: 'Verificação por von Mises',
          tex: '\\sigma\'  = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}',
          texSub: '\\sigma\'  = ' + nt(vm, 4) + '\\ \\text{MPa}',
          r: 'n = ' + sg(n, 3),
          obs: 'Compare com Tresca, que usaria σ₁ − σ₃ = ' + sg(2 * tabs, 4) + ' MPa.' }
      ]);

      return {
        s1: { v: s1, u: 'MPa', classe: 'destaque' },
        s2: { v: s2, u: 'MPa', classe: 'destaque' },
        thp: { v: thp, u: '°' },
        tmax: { v: tmax, u: 'MPa' },
        tabs: { v: tabs, u: 'MPa', classe: tabs > tmax + 1e-9 ? 'alerta' : '' },
        smed: { v: sm, u: 'MPa' },
        vm: { v: vm, u: 'MPa' },
        sxl: { v: sxl, u: 'MPa' },
        syl: { v: syl, u: 'MPa' },
        txyl: { v: txyl, u: 'MPa', classe: Math.abs(txyl) < 0.5 ? 'ok' : '' }
      };
    }
  });
})();


/* ------------------------------------------------------------
   2. FLAMBAGEM DE COLUNAS - EULER x JOHNSON
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-flambagem')) return;

  var MAT = {
    a36: { t: 'Aco ASTM A36', E: 200000, Sy: 250 },
    a572: { t: 'Aco ASTM A572 Gr.50', E: 200000, Sy: 345 },
    aco1045: { t: 'Aco 1045 laminado', E: 200000, Sy: 530 },
    al6061: { t: 'Aluminio 6061-T6', E: 69000, Sy: 240 },
    madeira: { t: 'Madeira conifera (fc)', E: 11000, Sy: 30 }
  };

  /* Quatro vinculacoes lado a lado, com a deformada e o trecho que
     corresponde ao comprimento efetivo destacado. A que estiver
     selecionada aparece realcada. */
  function desenharVinculacoes(c, pl, Kativo, lam, p) {
    var a = pl._area;
    var cor = Plot.cssVar('--text', '#111');
    var faint = Plot.cssVar('--text-faint', '#999');
    var borda = Plot.cssVar('--border', '#ddd');

    var casos = [
      { K: 1.0, nome: 'Bi-rotulada', sub: 'K = 1,0', proj: '1,00' },
      { K: 0.5, nome: 'Bi-engastada', sub: 'K = 0,5', proj: '0,65' },
      { K: 0.7, nome: 'Engastada-rotulada', sub: 'K = 0,7', proj: '0,80' },
      { K: 2.0, nome: 'Engastada-livre', sub: 'K = 2,0', proj: '2,10' }
    ];

    var n = casos.length;
    var larg = a.w / n;
    var yTopo = a.y + 52, yBase = a.y + a.h - 60;
    var H = yBase - yTopo;
    var amp = Math.min(larg * 0.17, 24);

    c.font = '650 12.5px ' + Plot.cssVar('--font', 'sans-serif');
    c.fillStyle = cor;
    c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('De onde vem o K: a forma que a coluna assume ao flambar', a.x + 4, a.y + 2);
    c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
    c.fillStyle = faint;
    c.fillText('L_e é o trecho em destaque — o pedaço da deformada que vale por uma meia onda de seno',
               a.x + 4, a.y + 19);

    casos.forEach(function (cs, i) {
      var cx = a.x + larg * (i + 0.5);
      var ativo = Math.abs(cs.K - Kativo) < 1e-6;

      /* deformada: meia onda de seno, recortada conforme a vinculacao */
      c.setLineDash([]);
      /* eixo original */
      c.strokeStyle = borda; c.lineWidth = 1.2;
      c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(cx, yTopo); c.lineTo(cx, yBase); c.stroke();
      c.setLineDash([]);

      c.strokeStyle = ativo ? Plot.serie(0) : faint;
      c.lineWidth = ativo ? 3 : 1.6;
      c.globalAlpha = ativo ? 1 : 0.55;
      c.beginPath();
      for (var t = 0; t <= 60; t++) {
        var f = t / 60;
        var d;
        if (cs.K === 1.0) d = Math.sin(Math.PI * f);
        else if (cs.K === 0.5) d = 0.5 * (1 - Math.cos(2 * Math.PI * f));
        else if (cs.K === 0.7) d = Math.sin(Math.PI * f) * (1 - 0.55 * f);
        else d = 1 - Math.cos(Math.PI * f / 2);
        c.lineTo(cx + amp * d, yTopo + H * f);
      }
      c.stroke();
      c.globalAlpha = 1;

      /* trecho do comprimento efetivo */
      var f0, f1;
      if (cs.K === 1.0) { f0 = 0; f1 = 1; }
      else if (cs.K === 0.5) { f0 = 0.25; f1 = 0.75; }
      else if (cs.K === 0.7) { f0 = 0.30; f1 = 1.0; }
      else { f0 = 0; f1 = 1; }
      var xe = cx - amp - 14;
      c.strokeStyle = ativo ? Plot.serie(4) : borda;
      c.fillStyle = c.strokeStyle;
      c.lineWidth = ativo ? 2.2 : 1.2;
      c.beginPath();
      c.moveTo(xe, yTopo + H * f0); c.lineTo(xe, yTopo + H * f1);
      c.stroke();
      [[yTopo + H * f0, 1], [yTopo + H * f1, -1]].forEach(function (q) {
        c.beginPath();
        c.moveTo(xe, q[0]);
        c.lineTo(xe - 3.6, q[0] + q[1] * 8);
        c.lineTo(xe + 3.6, q[0] + q[1] * 8);
        c.closePath(); c.fill();
      });
      c.save();
      c.translate(xe - 6, (yTopo + H * (f0 + f1) / 2));
      c.rotate(-Math.PI / 2);
      c.font = (ativo ? '700 ' : '') + '10px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('L_e', 0, 0);
      c.restore();

      /* apoios */
      function rotula(y) {
        c.strokeStyle = ativo ? cor : faint; c.lineWidth = 1.8;
        c.beginPath(); c.arc(cx, y, 4.5, 0, Math.PI * 2); c.stroke();
      }
      function engaste(y, cima) {
        c.strokeStyle = ativo ? cor : faint; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(cx - 17, y); c.lineTo(cx + 17, y); c.stroke();
        c.lineWidth = 1;
        for (var h = -17; h <= 14; h += 6) {
          c.beginPath();
          c.moveTo(cx + h, y);
          c.lineTo(cx + h + 5, y + (cima ? -7 : 7));
          c.stroke();
        }
      }
      if (cs.K === 1.0) { rotula(yTopo); rotula(yBase); }
      else if (cs.K === 0.5) { engaste(yTopo, true); engaste(yBase, false); }
      else if (cs.K === 0.7) { rotula(yTopo); engaste(yBase, false); }
      else { engaste(yBase, false); }

      /* carga no topo */
      c.strokeStyle = ativo ? Plot.serie(5) : faint;
      c.fillStyle = c.strokeStyle;
      c.lineWidth = ativo ? 2.2 : 1.4;
      c.beginPath(); c.moveTo(cx, yTopo - 26); c.lineTo(cx, yTopo - 8); c.stroke();
      c.beginPath();
      c.moveTo(cx, yTopo - 4);
      c.lineTo(cx - 4, yTopo - 12); c.lineTo(cx + 4, yTopo - 12);
      c.closePath(); c.fill();

      /* rotulos */
      c.fillStyle = ativo ? cor : faint;
      c.font = (ativo ? '700 ' : '600 ') + '11px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(cs.nome, cx, yBase + 14);
      c.font = (ativo ? '700 ' : '') + '10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.fillStyle = ativo ? Plot.serie(4) : faint;
      c.fillText(cs.sub + '   ·   projeto ' + cs.proj, cx, yBase + 29);
      if (ativo) {
        c.fillStyle = Plot.serie(4);
        c.font = '700 10px ' + Plot.cssVar('--font', 'sans-serif');
        c.fillText('λ = ' + lam.toFixed(0), cx, yBase + 43);
      }
    });
    void p;
  }

  Sim.build('#sim-flambagem', {
    titulo: 'Flambagem de colunas — Euler x Johnson',
    descricao: 'A hipérbole de Euler só vale acima da esbeltez de transição. Abaixo dela ela mente para mais — é o erro clássico de projeto.',
    controlesLargos: true,
    controles: [
      { id: 'sec', tipo: 'select', label: 'Secao transversal', valor: 'ret',
        opcoes: [
          { v: 'ret', t: 'Retangular macica' },
          { v: 'circ', t: 'Circular macica' },
          { v: 'tubo', t: 'Tubular circular' },
          { v: 'perfilI', t: 'Perfil I' }
        ] },
      { id: 'd1', label: 'Dimensao maior h (ou D externo)', min: 15, max: 400, step: 1, valor: 80, unidade: 'mm' },
      { id: 'd2', label: 'Dimensao menor b (ou largura da mesa)', min: 8, max: 300, step: 1, valor: 40, unidade: 'mm',
        desc: 'Ignorada nas secoes circular e tubular.' },
      { id: 'esp', label: 'Espessura de parede / mesa', min: 1, max: 40, step: 0.5, valor: 6, unidade: 'mm',
        desc: 'Usada no tubo e no perfil I.' },
      { tipo: 'separador' },
      { id: 'L', label: 'Comprimento real L', min: 0.2, max: 12, step: 0.05, valor: 3, unidade: 'm' },
      { id: 'K', tipo: 'select', label: 'Condicao de extremidade', valor: '1',
        opcoes: [
          { v: '1', t: 'Bi-rotulada  K = 1,0' },
          { v: '2', t: 'Engastada-livre  K = 2,0' },
          { v: '0.5', t: 'Bi-engastada  K = 0,5' },
          { v: '0.7', t: 'Engastada-rotulada  K = 0,7' }
        ], desc: 'K teorico. A AISC/NBR 8800 recomenda valores de projeto maiores (0,65 / 2,10 / 0,80).' },
      { id: 'mat', tipo: 'select', label: 'Material', valor: 'a36',
        opcoes: Object.keys(MAT).map(function (k) { return { v: k, t: MAT[k].t }; }) },
      { id: 'P', label: 'Carga de compressao aplicada P', min: 1, max: 3000, step: 1, valor: 60, unidade: 'kN' }
    ],
    graficos: [
      { id: 'col', xlabel: 'Índice de esbeltez  λ = K·L/r', ylabel: 'Tensão crítica σ_cr (MPa)',
        aspect: 0.56, legendPos: 'topright' },
      { id: 'vinc', axes: false, height: 320, grid: false, legend: false }
    ],
    saidas: [
      { id: 'A', label: 'Area' },
      { id: 'I', label: 'I minimo' },
      { id: 'r', label: 'Raio de giracao r' },
      { id: 'lam', label: 'Esbeltez λ' },
      { id: 'lam1', label: 'Esbeltez de transicao λ1' },
      { id: 'sE', label: 'σcr por Euler' },
      { id: 'scr', label: 'σcr adotada' },
      { id: 'Pcr', label: 'Carga critica Pcr' },
      { id: 'FS', label: 'Fator de seguranca' },
      { id: 'reg', label: 'Regime' }
    ],
      formulas: [
        { g: 'Carga crítica de Euler' },
        { tex: 'P_{\\text{cr}} = \\frac{\\pi^2 E I}{(K L)^2}', d: 'só depende de E e da geometria — Sy NÃO aparece', destaque: true },
        { tex: '\\sigma_{\\text{cr}} = \\frac{\\pi^2 E}{\\lambda^2}', d: 'tensão crítica em função da esbeltez', destaque: true },
        { tex: 'r = \\sqrt{\\frac{I}{A}}', d: 'raio de giração; use sempre o MENOR momento de inércia' },
        { tex: '\\lambda = \\frac{K L}{r}', d: 'índice de esbeltez' },

        { g: 'Fator de comprimento efetivo K' },
        { tex: 'K = 2{,}0', d: 'engastada-livre — o pior caso' },
        { tex: 'K = 1{,}0', d: 'biarticulada (rotulada) — referência' },
        { tex: 'K = 0{,}7', d: 'engastada-articulada' },
        { tex: 'K = 0{,}5', d: 'biengastada — quadruplica a carga crítica' },

        { g: 'Limite de validade' },
        { tex: '\\lambda_{\\text{lim}} = \\sqrt{\\frac{2\\pi^2 E}{S_y}}', d: 'acima disso vale Euler; abaixo, Johnson', destaque: true },
        { tex: '\\sigma_{\\text{cr}} = S_y - \\frac{1}{E}\\left(\\frac{S_y}{2\\pi}\\cdot\\lambda\\right)^2', d: 'parábola de Johnson, para colunas intermediárias', destaque: true },
        { tex: 'n = \\frac{P_{\\text{cr}}}{P}', d: 'coeficiente de segurança à flambagem; usa-se 1,5 a 3' }
      ],
      formulasTitulo: 'Fórmulas — flambagem de colunas',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    nota: 'Euler: σcr = π²E/λ². Johnson (parabola): σcr = Sy − (1/E)·(Sy·λ/2π)², valida ate λ1 = √(2π²E/Sy), ponto em que as duas curvas se tocam com σcr = Sy/2. Coluna sem excentricidade, material elastico-perfeitamente plastico, sem tensao residual. Perfis reais seguem as curvas da NBR 8800 / AISC 360, sempre abaixo desta.',
    calcular: function (p, ctx) {
      var m = MAT[p.mat], E = m.E, Sy = m.Sy;
      var A, I1, I2, I, desc;

      if (p.sec === 'ret') {
        var h = Math.max(p.d1, p.d2), b = Math.min(p.d1, p.d2);
        A = b * h; I1 = b * h * h * h / 12; I2 = h * b * b * b / 12;
        I = Math.min(I1, I2); desc = h.toFixed(0) + ' x ' + b.toFixed(0) + ' mm';
      } else if (p.sec === 'circ') {
        var D = p.d1;
        A = Math.PI * D * D / 4; I = Math.PI * Math.pow(D, 4) / 64;
        desc = 'D = ' + D.toFixed(0) + ' mm';
      } else if (p.sec === 'tubo') {
        var De = p.d1, di = Math.max(1, De - 2 * p.esp);
        A = Math.PI * (De * De - di * di) / 4;
        I = Math.PI * (Math.pow(De, 4) - Math.pow(di, 4)) / 64;
        desc = 'D ' + De.toFixed(0) + ' x t ' + p.esp.toFixed(1) + ' mm';
      } else {
        var H = Math.max(p.d1, 4 * p.esp + 4), bf = p.d2, tf = p.esp, tw = p.esp;
        var hw = H - 2 * tf;
        A = 2 * bf * tf + hw * tw;
        var Iz = (bf * Math.pow(H, 3) - (bf - tw) * Math.pow(hw, 3)) / 12;
        var Iy = 2 * (tf * Math.pow(bf, 3) / 12) + hw * Math.pow(tw, 3) / 12;
        I = Math.min(Iy, Iz);
        desc = 'I ' + H.toFixed(0) + ' x ' + bf.toFixed(0) + ' x ' + tf.toFixed(1) + ' mm';
      }

      var r = Math.sqrt(I / A);                 /* mm */
      var K = parseFloat(p.K);
      var Le = K * p.L * 1000;                  /* mm */
      var lam = Le / r;
      var lam1 = Math.sqrt(2 * Math.PI * Math.PI * E / Sy);

      var sEuler = Math.PI * Math.PI * E / (lam * lam);
      var sJohnson = Sy - (1 / E) * Math.pow(Sy * lam / (2 * Math.PI), 2);
      var euler = lam >= lam1;
      var scr = euler ? sEuler : sJohnson;
      var Pcr = scr * A / 1000;                 /* kN */
      var FS = Pcr / p.P;

      /* ---- grafico ---- */
      var lmax = Math.max(240, lam * 1.35, lam1 * 1.9);
      var ls = Plot.linspace(6, lmax, 240);
      var eu = Plot.map(ls, function (v) { return Math.PI * Math.PI * E / (v * v); });
      var jo = Plot.map(ls, function (v) {
        return v <= lam1 ? Sy - (1 / E) * Math.pow(Sy * v / (2 * Math.PI), 2) : NaN;
      });
      var euValida = Plot.map(ls, function (v) { return v >= lam1 ? Math.PI * Math.PI * E / (v * v) : NaN; });

      /* tensao efetivamente aplicada na coluna: e a distancia ate a curva
         critica que representa o fator de seguranca */
      var sAplic = p.P * 1000 / A;              /* MPa, com A em mm² e P em kN */
      var seguro = FS >= 1;

      var gc = ctx.plot('col').clear();
      gc.setLimits([0, lmax], [0, Math.max(Sy * 1.35, sAplic * 1.15)]);
      /* faixa entre a tensao aplicada e a curva critica */
      var curvaCrit = Plot.map(ls, function (v) {
        return v >= lam1 ? Math.PI * Math.PI * E / (v * v)
                         : Sy - (1 / E) * Math.pow(Sy * v / (2 * Math.PI), 2);
      });
      gc.area(ls, curvaCrit, { base: 0, color: seguro ? Plot.serie(2) : Plot.serie(5),
                               alpha: 0.07, stroke: false });
      gc.line(ls, eu, { color: Plot.serie(3), width: 1.3, dash: [4, 4], label: 'Euler extrapolada (INVÁLIDA)' });
      gc.line(ls, euValida, { color: Plot.serie(0), width: 2.4, label: 'Euler — coluna esbelta' });
      gc.line(ls, jo, { color: Plot.serie(1), width: 2.4, label: 'Johnson — coluna intermediária' });
      gc.hline(Sy, { color: Plot.serie(2), dash: [6, 4], text: 'S_y = ' + Sy + ' MPa (escoamento)' });
      gc.hline(Sy / 2, { color: Plot.serie(5), dash: [2, 4], text: 'S_y/2 — ponto de tangência' });
      gc.vline(lam1, { color: Plot.serie(5), dash: [5, 4], text: 'λ₁ = ' + lam1.toFixed(0) });
      /* a linha que faltava: a tensao aplicada */
      gc.hline(sAplic, { color: seguro ? Plot.serie(4) : Plot.serie(5), dash: [], width: 2.2,
                         text: 'σ aplicada = P/A = ' + Plot.sig(sAplic, 4) + ' MPa' });
      /* segmento vertical mostrando a folga: e o fator de seguranca */
      gc.custom(function (c2, plot) {
        var X = plot.px(lam);
        var Ya = plot.py(sAplic), Yc = plot.py(Math.min(scr, plot._bounds.ymax));
        c2.setLineDash([]);
        c2.strokeStyle = seguro ? Plot.serie(2) : Plot.serie(5);
        c2.fillStyle = c2.strokeStyle;
        c2.lineWidth = 2.4;
        c2.beginPath(); c2.moveTo(X, Ya); c2.lineTo(X, Yc); c2.stroke();
        [[Ya, Yc], [Yc, Ya]].forEach(function (q) {
          var sg2 = q[1] > q[0] ? 1 : -1;
          c2.beginPath();
          c2.moveTo(X, q[0]);
          c2.lineTo(X - 4, q[0] + sg2 * 9);
          c2.lineTo(X + 4, q[0] + sg2 * 9);
          c2.closePath(); c2.fill();
        });
        var txt = seguro ? 'n = σ_cr/σ = ' + Plot.sig(FS, 3)
                         : 'FLAMBA: n = ' + Plot.sig(FS, 3) + ' < 1';
        c2.font = '700 11.5px ' + Plot.cssVar('--font', 'sans-serif');
        var l = c2.measureText(txt).width;
        var bx = X + 10;
        if (bx + l + 12 > plot._area.x + plot._area.w) bx = X - l - 22;
        var by = (Ya + Yc) / 2;
        c2.globalAlpha = 0.92;
        c2.fillStyle = Plot.cssVar('--bg-elev', '#fff');
        c2.fillRect(bx - 4, by - 9, l + 10, 18);
        c2.globalAlpha = 1;
        c2.strokeStyle = seguro ? Plot.serie(2) : Plot.serie(5);
        c2.lineWidth = 1.2;
        c2.strokeRect(bx - 4, by - 9, l + 10, 18);
        c2.fillStyle = c2.strokeStyle;
        c2.textAlign = 'left'; c2.textBaseline = 'middle';
        c2.fillText(txt, bx + 1, by);
      });
      gc.marker(lam, Math.min(scr, Sy * 1.3),
                'λ = ' + lam.toFixed(0) + '   σ_cr = ' + Plot.sig(scr, 3) + ' MPa',
                { color: Plot.serie(4), r: 5.5,
                  align: lam > lmax * 0.55 ? 'right' : 'left',
                  dx: lam > lmax * 0.55 ? -8 : 8 });
      gc.draw();

      /* ---- desenho das quatro vinculacoes, com a deformada de cada uma ---- */
      var gv = ctx.plot('vinc');
      if (gv) {
        gv.clear();
        gv.setLimits([0, 1], [0, 1]);
        gv.custom(function (c2, plot) { desenharVinculacoes(c2, plot, K, lam, p); });
        gv.draw();
      }

      var ntf = Plot.numTex, sgf = Plot.sig;
      ctx.setPassos([
        { t: 'Geometria da seção',
          texSub: 'A = ' + ntf(A * 1e4, 4) + '\\ \\text{cm}^2 \\qquad I_{min} = ' +
                  ntf(I / 1e4, 4) + '\\ \\text{cm}^4',
          obs: 'A flambagem ocorre no eixo de MENOR inércia — a coluna procura o caminho mais fácil.' },
        { t: 'Raio de giração',
          tex: 'r = \\sqrt{\\frac{I_{\\text{min}}}{A}}',
          texSub: 'r = \\sqrt{\\frac{' + ntf(I / 1e12, 4) + '}{' + ntf(A, 4) + '}} = ' +
                  ntf(r * 1000, 4) + '\\ \\text{mm}' },
        { t: 'Comprimento efetivo',
          tex: 'L_e = K \\cdot L',
          texSub: 'L_e = ' + K + ' \\cdot ' + p.L + ' = ' + ntf(Le, 4) + '\\ \\text{m}',
          obs: 'K depende só da vinculação. Passar de biarticulada (K=1) para biengastada (K=0,5) quadruplica Pcr.' },
        { t: 'Índice de esbeltez — o número que decide tudo',
          tex: '\\lambda = \\frac{L_e}{r} = \\frac{K\\,L}{\\sqrt{I_{\\text{min}}/A}}',
          texSub: '\\lambda = \\frac{' + K + ' \\cdot ' + ntf(p.L * 1000, 4) + '}{' + ntf(r, 4) +
                  '} = \\frac{' + ntf(Le, 4) + '}{' + ntf(r, 4) + '} = ' + ntf(lam, 4),
          r: 'λ = ' + sgf(lam, 4) + '   (transição em λ₁ = ' + sgf(lam1, 4) + ')',
          obs: 'Cada termo: L é o comprimento real (' + p.L + ' m) · K é o fator de vinculação (' +
               K + ' neste caso), e L_e = K·L é o comprimento da meia-onda de flambagem · ' +
               'r = √(I_mín/A) é o raio de giração, que mede quão espalhada é a seção em torno do ' +
               'eixo mais fraco (' + sgf(r, 4) + ' mm aqui). λ é adimensional: é quantos "raios de ' +
               'giração" cabem no comprimento efetivo. ' +
               (euler ? 'Como λ > λ₁, a coluna é ESBELTA e falha por instabilidade elástica: vale Euler.'
                      : 'Como λ < λ₁, a coluna é INTERMEDIÁRIA — Euler daria tensão acima do escoamento, ' +
                        'o que é fisicamente impossível. Vale Johnson.') },
        { t: 'Esbeltez limite',
          tex: '\\lambda_{\\text{lim}} = \\sqrt{\\frac{2\\pi^2 E}{S_y}}',
          texSub: '\\lambda_{\\text{lim}} = \\sqrt{\\frac{2\\pi^2 \\cdot ' + ntf(m.E / 1e6, 5) + '}{' +
                  ntf(m.Sy / 1e6, 4) + '}} = ' + ntf(lam1, 4),
          obs: 'E é o módulo de elasticidade do material (' + sgf(m.E / 1e6, 5) + ' MPa aqui) — a ' +
               'rigidez, não a resistência; S_y é o limite de escoamento (' + sgf(m.Sy / 1e6, 4) +
               ' MPa), a tensão em que o material começa a deformar permanentemente. λ₁ é a esbeltez ' +
               'em que a tensão de Euler iguala S_y/2, ponto em que as duas curvas se tocam com a mesma ' +
               'inclinação. Repare que λ₁ NÃO depende da geometria, só do material: para aço com ' +
               'S_y = 250 MPa dá cerca de 126, e para alumínio dá bem menos.' },
        { t: 'Tensão crítica',
          tex: euler ? '\\sigma_{cr} = \\frac{\\pi^2 E}{\\lambda^2}'
                     : '\\sigma_{cr} = S_y - \\frac{1}{E}\\left(\\frac{S_y \\lambda}{2\\pi}\\right)^2',
          texSub: '\\sigma_{\\text{cr}} = ' + ntf(scr / 1e6, 4) + '\\ \\text{MPa}',
          obs: 'Euler daria ' + sgf(sEuler / 1e6, 4) + ' MPa; Johnson daria ' +
               sgf(sJohnson / 1e6, 4) + ' MPa. Adota-se ' + (euler ? 'Euler' : 'Johnson') + '.' },
        { t: 'Carga crítica e verificação',
          tex: 'P_{\\text{cr}} = \\sigma_{\\text{cr}} \\cdot A \\qquad n = \\frac{P_{\\text{cr}}}{P}',
          texSub: 'P_{\\text{cr}} = ' + ntf(scr / 1e6, 4) + ' \\cdot ' + ntf(A * 1e6, 5) + ' = ' +
                  ntf(Pcr / 1000, 4) + '\\ \\text{kN} \\qquad n = ' + ntf(FS, 3),
          r: FS < 1 ? 'FLAMBA — n < 1' : FS < 1.5 ? 'Margem curta' : 'Aprovada',
          obs: 'Trocar por um aço mais resistente NÃO aumenta Pcr na região de Euler: só E entra, e todos os aços têm E ≈ 200 GPa.' }
      ]);

      return {
        A: { v: A, u: 'mm²' },
        I: { v: I / 1e4, u: 'cm⁴' },
        r: { v: r, u: 'mm' },
        lam: { v: lam, u: '', classe: euler ? '' : 'alerta' },
        lam1: { v: lam1, u: '' },
        sE: { v: sEuler, u: 'MPa', classe: euler ? '' : 'alerta' },
        scr: { v: scr, u: 'MPa', classe: 'destaque' },
        Pcr: { v: Pcr, u: 'kN', classe: 'destaque' },
        FS: { v: FS, u: '', classe: FS < 1 ? 'alerta' : FS < 1.9 ? '' : 'ok' },
        reg: {
          v: euler ? 'Euler (elastica) — ' + desc
                   : 'Johnson (inelastica) — Euler daria ' + Plot.sig(sEuler, 3) + ' MPa, valor INSEGURO',
          u: '', classe: euler ? 'ok' : 'alerta'
        }
      };
    }
  });
})();


/* ------------------------------------------------------------
   3. VASO DE PRESSAO - PAREDE FINA x LAME
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-vaso')) return;

  Sim.build('#sim-vaso', {
    titulo: 'Vaso de pressão — parede fina x parede espessa (Lamé)',
    descricao: 'Aumente a espessura e veja a hipótese de parede fina se afastar da solução exata de Lamé.',
    controles: [
      { id: 'geo', tipo: 'seg', label: 'Geometria', valor: 'cil',
        opcoes: [{ v: 'cil', t: 'Cilindrico' }, { v: 'esf', t: 'Esferico' }] },
      { id: 'ri', label: 'Raio interno ri', min: 20, max: 1500, step: 5, valor: 500, unidade: 'mm' },
      { id: 't', label: 'Espessura da parede t', min: 1, max: 400, step: 1, valor: 10, unidade: 'mm' },
      { tipo: 'separador' },
      { id: 'pi', label: 'Pressao interna pi', min: 0, max: 120, step: 0.1, valor: 2, unidade: 'MPa' },
      { id: 'pe', label: 'Pressao externa pe', min: 0, max: 60, step: 0.1, valor: 0, unidade: 'MPa' },
      { tipo: 'separador' },
      { tipo: 'titulo', label: 'Criterio ASME BPVC VIII-1' },
      { id: 'S', label: 'Tensao admissivel S', min: 30, max: 250, step: 1, valor: 138, unidade: 'MPa',
        desc: 'SA-516 Gr.70 a 200 °C ≈ 138 MPa (Secao II-D).' },
      { id: 'E', label: 'Eficiencia de junta E', min: 0.6, max: 1, step: 0.05, valor: 0.85, unidade: '',
        desc: '1,00 duplo cordao 100% radiografado · 0,85 radiografia por pontos · 0,70 sem exame.' },
      { id: 'ca', label: 'Sobre-espessura de corrosao CA', min: 0, max: 6, step: 0.5, valor: 3, unidade: 'mm' }
    ],
    graficos: [
      { id: 'lame', xlabel: 'Posicao na parede  r (mm)', ylabel: 'Tensao (MPa)', aspect: 0.5, legendPos: 'topright' }
    ],
    saidas: [
      { id: 'sth', label: 'σθ circunferencial (max)' },
      { id: 'sthf', label: 'σθ por parede fina' },
      { id: 'err', label: 'Erro da parede fina' },
      { id: 'sl', label: 'σL longitudinal' },
      { id: 'sr', label: 'σr radial (interna)' },
      { id: 'vm', label: 'von Mises na face interna' },
      { id: 'ratio', label: 'Razao t/ri' },
      { id: 'clas', label: 'Classificacao' },
      { id: 'tmin', label: 't minimo ASME (+CA)' }
    ],
      formulas: [
        { g: 'Parede fina (D/t > 20)' },
        { tex: '\\sigma_{\\text{circ}} = \\frac{p\\,D}{2t} = \\frac{p\\,r}{t}', d: 'tensão circunferencial no cilindro — a MAIOR', destaque: true },
        { tex: '\\sigma_{\\text{long}} = \\frac{p\\,D}{4t} = \\frac{p\\,r}{2t}', d: 'longitudinal: exatamente metade da circunferencial', destaque: true },
        { tex: '\\sigma_{\\text{esfera}} = \\frac{p\\,D}{4t}', d: 'esfera: igual nas duas direções, metade do cilindro' },

        { g: 'Parede espessa — equações de Lamé' },
        { tex: '\\sigma_\\theta(r) = \\frac{p_i r_i^2 - p_e r_e^2 + (p_i - p_e)\\frac{r_i^2 r_e^2}{r^2}}{r_e^2 - r_i^2}', d: 'circunferencial, máxima na face interna', destaque: true },
        { tex: '\\sigma_r(r) = \\frac{p_i r_i^2 - p_e r_e^2 - (p_i - p_e)\\frac{r_i^2 r_e^2}{r^2}}{r_e^2 - r_i^2}', d: 'radial; vale −pᵢ na face interna' },
        { tex: '\\sigma_\\theta(r_i) = p_i\\frac{r_e^2 + r_i^2}{r_e^2 - r_i^2}', d: 'caso só com pressão interna', destaque: true },
        { tex: '\\lim_{r_e \\to \\infty} \\sigma_\\theta(r_i) = p_i', d: 'existe um PISO: engrossar a parede não resolve tudo' },

        { g: 'Critério de falha e norma' },
        { tex: '\\sigma\'  = \\sqrt{\\frac{(\\sigma_1-\\sigma_2)^2 + (\\sigma_2-\\sigma_3)^2 + (\\sigma_3-\\sigma_1)^2}{2}}', d: 'von Mises no estado triaxial' },
        { tex: 't = \\frac{p R}{S E - 0{,}6 p} + CA', d: 'ASME VIII Div.1: E = eficiência de junta, CA = sobrespessura de corrosão', destaque: true }
      ],
      formulasTitulo: 'Fórmulas — vasos de pressão',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    nota: 'Lame (cilindro): σθ,σr = [pi·ri² − pe·ro² ± (pi−pe)·ri²ro²/r²]/(ro²−ri²); σL = (pi·ri² − pe·ro²)/(ro²−ri²) para tampos fechados. Esfera: mesma forma com r³ e o termo de σθ dividido por 2. Parede fina usa σθ = p·ri/t e σL = p·ri/2t, valida para t/ri ≤ 0,1 (erro ≈ t/2ri). ASME UG-27: t = P·R/(S·E − 0,6P) no cilindro e t = P·R/(2S·E − 0,2P) na esfera, com R = raio INTERNO no estado corroido.',
    calcular: function (p, ctx) {
      var ri = p.ri, t = p.t, ro = ri + t, pi = p.pi, pe = p.pe;
      var ri2 = ri * ri, ro2 = ro * ro;
      var esf = p.geo === 'esf';

      var rs = Plot.linspace(ri, ro, 160);
      var sth, sr, sL;

      if (!esf) {
        var den = ro2 - ri2;
        sth = Plot.map(rs, function (r) { return (pi * ri2 - pe * ro2 + (pi - pe) * ri2 * ro2 / (r * r)) / den; });
        sr = Plot.map(rs, function (r) { return (pi * ri2 - pe * ro2 - (pi - pe) * ri2 * ro2 / (r * r)) / den; });
        sL = (pi * ri2 - pe * ro2) / den;
      } else {
        var ri3 = ri2 * ri, ro3 = ro2 * ro, den3 = ro3 - ri3;
        sth = Plot.map(rs, function (r) { return (pi * ri3 - pe * ro3 + (pi - pe) * ri3 * ro3 / (2 * r * r * r)) / den3; });
        sr = Plot.map(rs, function (r) { return (pi * ri3 - pe * ro3 - (pi - pe) * ri3 * ro3 / (r * r * r)) / den3; });
        sL = sth[0];
      }

      var sthMax = sth[0];
      var srInt = sr[0];
      var pef = pi - pe;
      var sthFina = esf ? pef * ri / (2 * t) : pef * ri / t;
      var sLFina = esf ? sthFina : pef * ri / (2 * t);
      var err = sthMax !== 0 ? (sthFina - sthMax) / sthMax * 100 : 0;

      /* von Mises com as 3 principais na face interna */
      var a1 = sthMax, a2 = esf ? sthMax : sL, a3 = srInt;
      var vm = Math.sqrt(0.5 * (Math.pow(a1 - a2, 2) + Math.pow(a2 - a3, 2) + Math.pow(a3 - a1, 2)));

      var razao = t / ri;
      var fina = razao <= 0.1;

      /* ASME UG-27 no estado corroido */
      var Rc = ri + p.ca;
      var SE = p.S * p.E;
      var tAsme = esf ? pi * Rc / (2 * SE - 0.2 * pi) : pi * Rc / (SE - 0.6 * pi);
      var limite = esf ? 0.665 * SE : 0.385 * SE;
      var tTotal = tAsme + p.ca;
      var forade = pi >= limite || tAsme <= 0;

      var g = ctx.plot('lame');
      g.clear()
        .line(rs, sth, { color: Plot.serie(0), width: 2.4, label: 'σθ circunferencial (Lame)' })
        .line(rs, sr, { color: Plot.serie(3), width: 2.2, label: 'σr radial (Lame)' })
        .line([ri, ro], [sthFina, sthFina], { color: Plot.serie(1), width: 1.8, dash: [6, 4], label: 'σθ parede fina' })
        .line([ri, ro], [sLFina, sLFina], { color: Plot.serie(4), width: 1.5, dash: [2, 4], label: 'σL parede fina' })
        .hline(0, { color: Plot.serie(6), dash: [2, 3] })
        .marker(ri, sthMax, 'σθ max = ' + Plot.sig(sthMax, 4) + ' MPa', { color: Plot.serie(0) })
        .marker(ri, srInt, 'σr = −pi', { color: Plot.serie(3), dy: 16 })
        .vline(ri, { color: Plot.serie(5), dash: [3, 3], text: 'face interna' })
        .vline(ro, { color: Plot.serie(5), dash: [3, 3], text: 'face externa' });
      if (!fina) {
        g.text(ri + t * 0.5, sthMax * 0.55,
          'Parede espessa: erro da hipotese fina = ' + err.toFixed(1) + '%',
          { color: Plot.serie(2), size: 11.5, weight: '700', align: 'center' });
      }
      g.draw();

      var ntv = Plot.numTex, sgv = Plot.sig;
      ctx.setPassos([
        { t: 'Geometria e classificação',
          texSub: 'r_i = ' + ntv(p.ri, 4) + '\\ \\text{mm} \\quad t = ' + ntv(p.t, 4) +
                  '\\ \\text{mm} \\quad \\frac{D}{t} = ' + ntv(razao, 4),
          r: fina ? 'D/t > 20 → parede FINA' : 'D/t < 20 → parede ESPESSA',
          obs: fina ? 'A formulação simplificada é válida, com erro abaixo de 5 %.'
                    : 'A tensão varia sensivelmente ao longo da espessura: é preciso usar Lamé.' },
        { t: 'Solução de parede fina',
          tex: '\\sigma_{\\text{circ}} = \\frac{p D}{2t} \\qquad \\sigma_{\\text{long}} = \\frac{p D}{4t}',
          texSub: '\\sigma_{\\text{circ}} = ' + ntv(sthFina, 4) + '\\ \\text{MPa} \\qquad \\sigma_{long} = ' +
                  ntv(sLFina, 4) + '\\ \\text{MPa}',
          obs: 'A circunferencial é sempre o dobro da longitudinal — por isso o tubo rasga no sentido do comprimento.' },
        { t: 'Solução exata de Lamé',
          tex: '\\sigma_\\theta(r_i) = p_i\\frac{r_e^2 + r_i^2}{r_e^2 - r_i^2}',
          texSub: '\\sigma_\\theta(r_i) = ' + ntv(sthMax, 4) + '\\ \\text{MPa} \\qquad \\sigma_r(r_i) = ' +
                  ntv(srInt, 4) + '\\ \\text{MPa}',
          r: 'Diferença para parede fina: ' + sgv(err, 3) + ' %',
          obs: 'Na face interna a tensão radial vale exatamente −pᵢ, o que a formulação de parede fina ignora.' },
        { t: 'Tensão equivalente de von Mises',
          tex: '\\sigma\'  = \\sqrt{\\frac{(\\sigma_1-\\sigma_2)^2+(\\sigma_2-\\sigma_3)^2+(\\sigma_3-\\sigma_1)^2}{2}}',
          texSub: '\\sigma\'  = ' + ntv(vm, 4) + '\\ \\text{MPa}',
          obs: 'Combina circunferencial, longitudinal e radial no ponto mais solicitado, que é a face interna.' },
        { t: 'Espessura requerida pela ASME VIII',
          tex: 't = \\frac{p R}{S E - 0{,}6\\,p} + CA',
          texSub: 't_{\\text{req}} = ' + ntv(tAsme, 4) + ' + ' + p.ca + ' = ' + ntv(tTotal, 4) +
                  '\\ \\text{mm} \\quad\\text{versus}\\quad t_{adotado} = ' + p.t + '\\ \\text{mm}',
          r: p.t >= tTotal ? 'Espessura ADEQUADA' : 'Espessura INSUFICIENTE',
          obs: 'E é a eficiência da junta soldada (0,70 sem radiografia a 1,00 com radiografia total) e CA é a sobrespessura de corrosão.' }
      ]);

      return {
        sth: { v: sthMax, u: 'MPa', classe: 'destaque' },
        sthf: { v: sthFina, u: 'MPa' },
        err: { v: err, u: '%', classe: Math.abs(err) > 5 ? 'alerta' : 'ok' },
        sl: { v: esf ? sthMax : sL, u: 'MPa' },
        sr: { v: srInt, u: 'MPa' },
        vm: { v: vm, u: 'MPa' },
        ratio: { v: razao, u: '' },
        clas: { v: fina ? 'Parede FINA (t/ri ≤ 0,1)' : 'Parede ESPESSA — use Lame', u: '',
                classe: fina ? 'ok' : 'alerta' },
        tmin: { v: forade ? 'fora da faixa UG-27' : Plot.sig(tTotal, 4), u: forade ? '' : 'mm',
                classe: forade ? 'alerta' : (t >= tTotal ? 'ok' : 'alerta') }
      };
    }
  });
})();


/* ------------------------------------------------------------
   4. CRITERIOS DE FALHA ESTATICA
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-criterios')) return;

  Sim.build('#sim-criterios', {
    titulo: 'Critérios de falha estática no plano σ1–σ2',
    descricao: 'O ponto de operação dentro da envoltória significa n > 1. Compare o que cada critério permite no 2º e 4º quadrantes.',
    controles: [
      { id: 's1', label: 'σ1', min: -600, max: 600, step: 5, valor: 120, unidade: 'MPa' },
      { id: 's2', label: 'σ2', min: -600, max: 600, step: 5, valor: -60, unidade: 'MPa' },
      { tipo: 'separador' },
      { id: 'mat', tipo: 'seg', label: 'Comportamento', valor: 'duc',
        opcoes: [{ v: 'duc', t: 'Ductil' }, { v: 'fra', t: 'Fragil' }] },
      { id: 'Sy', label: 'Limite de escoamento Sy', min: 50, max: 900, step: 5, valor: 350, unidade: 'MPa' },
      { id: 'Sut', label: 'Limite de ruptura a tracao Sut', min: 50, max: 1200, step: 5, valor: 500, unidade: 'MPa' },
      { id: 'Suc', label: 'Limite a compressao Suc', min: 50, max: 2000, step: 10, valor: 500, unidade: 'MPa',
        desc: 'Ductil: Suc ≈ Sut. Ferro fundido cinzento: Suc ≈ 3 a 4 × Sut.' },
      { id: 'verTodas', tipo: 'check', label: 'Mostrar os 4 criterios', valor: true }
    ],
    graficos: [
      { id: 'env', xlabel: 'σ1 (MPa)', ylabel: 'σ2 (MPa)', aspect: 0.78, equalAspect: true, legendPos: 'bottomleft' }
    ],
    saidas: [
      { id: 'vm', label: "σ' von Mises" },
      { id: 'nvm', label: 'n — von Mises (DE)' },
      { id: 'ntr', label: 'n — Tresca (MSS)' },
      { id: 'ncm', label: 'n — Coulomb-Mohr' },
      { id: 'nmn', label: 'n — Tensao normal max' },
      { id: 'nproj', label: 'n de projeto' },
      { id: 'crit', label: 'Criterio indicado' }
    ],
      formulas: [
        { g: 'Materiais dúcteis' },
        { tex: '\\sigma\'  = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2} \\le \\frac{S_y}{n}', d: 'von Mises (energia de distorção) — padrão de projeto', destaque: true },
        { tex: '\\sigma_1 - \\sigma_3 \\le \\frac{S_y}{n}', d: 'Tresca (máxima tensão cisalhante) — sempre ≥ conservador', destaque: true },
        { tex: '\\tau_{\\text{esc}} = 0{,}577\\,S_y \\;(\\text{Mises}) \\quad 0{,}500\\,S_y \\;(\\text{Tresca})', d: 'em cisalhamento puro; é a maior diferença entre os dois, 15,5 %' },
        { tex: '\\sigma_1 = \\sigma_2 = \\sigma_3 \\Rightarrow \\sigma\'  = 0', d: 'estado hidrostático não causa escoamento: não há distorção' },

        { g: 'Materiais frágeis' },
        { tex: '\\frac{\\sigma_1}{S_{\\text{ut}}} - \\frac{\\sigma_3}{S_{\\text{uc}}} \\le \\frac{1}{n}', d: 'Mohr-Coulomb — trata Sut ≠ Suc', destaque: true },
        { tex: '\\sigma_1 \\le \\frac{S_{\\text{ut}}}{n}', d: 'tensão normal máxima — NÃO conservador no 4º quadrante' },

        { g: 'Leitura geométrica' },
        { tex: '\\text{elipse de Mises} \\supset \\text{hexágono de Tresca}', d: 'coincidem em 6 pontos; Tresca nunca é menos conservador' },
        { tex: 'n = \\frac{S_y}{\\sigma\' }', d: 'coeficiente de segurança pelo critério adotado' }
      ],
      formulasTitulo: 'Fórmulas — critérios de falha estática',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    nota: 'Ductil: use von Mises (energia de distorcao) — e o que melhor reproduz o ensaio; Tresca da o mesmo resultado nos quadrantes 1 e 3 e ate 15% a menos no 2º e 4º, sendo o limite inferior conservador. Fragil (Suc >> Sut): a tensao normal maxima superestima a resistencia no 4º quadrante; use Coulomb-Mohr. Todos valem para carga ESTATICA; com carga alternada a falha e por fadiga (Goodman/Soderberg) e nenhuma destas envoltorias se aplica.',
    calcular: function (p, ctx) {
      var s1 = p.s1, s2 = p.s2, Sy = p.Sy, Sut = p.Sut, Suc = p.Suc;
      var frag = p.mat === 'fra';

      /* --- fatores de seguranca --- */
      var vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
      var nvm = vm > 1e-9 ? Sy / vm : Infinity;

      var tresca;
      if (s1 >= 0 && s2 >= 0) tresca = Math.max(s1, s2);
      else if (s1 <= 0 && s2 <= 0) tresca = Math.max(-s1, -s2);
      else tresca = Math.abs(s1 - s2);
      var ntr = tresca > 1e-9 ? Sy / tresca : Infinity;

      var A = Math.max(s1, s2), B = Math.min(s1, s2);
      var ncm;
      if (A >= 0 && B >= 0) ncm = A > 1e-9 ? Sut / A : Infinity;
      else if (A <= 0 && B <= 0) ncm = B < -1e-9 ? Suc / (-B) : Infinity;
      else ncm = 1 / (A / Sut - B / Suc);

      var nmn;
      var cand = [];
      if (A > 1e-9) cand.push(Sut / A);
      if (B < -1e-9) cand.push(Suc / (-B));
      nmn = cand.length ? Math.min.apply(null, cand) : Infinity;

      var nproj = frag ? Math.min(ncm, nmn) : Math.min(nvm, ntr);

      /* --- envoltorias --- */
      var lim = Math.max(Sut, Suc, Sy, Math.abs(s1), Math.abs(s2)) * 1.18;
      var g = ctx.plot('env');
      g.clear().setLimits([-lim, lim], [-lim, lim]);

      /* elipse de von Mises */
      var n = 181, ex = [], ey = [];
      for (var i = 0; i < n; i++) {
        var th = i / (n - 1) * 2 * Math.PI;
        var u = Math.SQRT2 * Sy * Math.cos(th);
        var v = Math.sqrt(2 / 3) * Sy * Math.sin(th);
        ex.push((u + v) / Math.SQRT2);
        ey.push((u - v) / Math.SQRT2);
      }
      /* hexagono de Tresca */
      var tx = [Sy, Sy, 0, -Sy, -Sy, 0, Sy];
      var ty = [0, Sy, Sy, 0, -Sy, -Sy, 0];
      /* hexagono de Coulomb-Mohr */
      var cx = [Sut, Sut, 0, -Suc, -Suc, 0, Sut];
      var cy = [0, Sut, Sut, 0, -Suc, -Suc, 0];
      /* quadrado da tensao normal maxima */
      var nx = [Sut, -Suc, -Suc, Sut, Sut];
      var ny = [Sut, Sut, -Suc, -Suc, Sut];

      if (p.verTodas || !frag) {
        g.line(ex, ey, { color: Plot.serie(0), width: 2.3, label: 'von Mises (Sy)' })
         .line(tx, ty, { color: Plot.serie(1), width: 1.9, label: 'Tresca (Sy)' });
      }
      if (p.verTodas || frag) {
        g.line(cx, cy, { color: Plot.serie(2), width: 2.1, dash: [7, 4], label: 'Coulomb-Mohr (Sut/Suc)' })
         .line(nx, ny, { color: Plot.serie(3), width: 1.6, dash: [3, 4], label: 'Tensao normal max' });
      }

      /* linha de carregamento proporcional ate a falha */
      var esc = nproj && isFinite(nproj) ? nproj : 1;
      g.line([0, s1 * esc], [0, s2 * esc], { color: Plot.serie(5), width: 1.2, dash: [4, 3] })
       .marker(s1 * esc, s2 * esc, 'falha prevista', { color: Plot.serie(5), r: 3.5 })
       .marker(s1, s2, 'operacao (' + s1 + ', ' + s2 + ')',
               { color: Plot.serie(4), r: 6, align: s1 > 0 ? 'left' : 'right', dx: s1 > 0 ? 9 : -9 })
       .draw();

      var ntc = Plot.numTex, sgc = Plot.sig;
      ctx.setPassos([
        { t: 'Estado principal e material',
          texSub: '\\sigma_1 = ' + ntc(p.s1, 4) + '\\ \\text{MPa} \\quad \\sigma_2 = ' + ntc(p.s2, 4) +
                  '\\ \\text{MPa} \\quad \\sigma_3 = 0',
          obs: 'Material ' + (frag ? 'FRÁGIL: usar Mohr-Coulomb' : 'DÚCTIL: usar von Mises ou Tresca') + '.' },
        { t: 'Critério de von Mises',
          tex: '\\sigma\'  = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}',
          texSub: '\\sigma\'  = \\sqrt{(' + ntc(p.s1, 4) + ')^2 - (' + ntc(p.s1, 4) + ')(' +
                  ntc(p.s2, 4) + ') + (' + ntc(p.s2, 4) + ')^2} = ' + ntc(vm, 4) + '\\ \\text{MPa}',
          r: 'n = ' + sgc(nvm, 3),
          obs: 'Atenção ao sinal: com σ₂ negativo, o termo −σ₁σ₂ vira soma e aumenta σ′.' },
        { t: 'Critério de Tresca',
          tex: '\\sigma_{\\text{eq}} = \\sigma_{\\text{max}} - \\sigma_{\\text{min}}',
          texSub: '\\sigma_{\\text{eq}} = ' + ntc(tresca, 4) + '\\ \\text{MPa} \\quad\\Rightarrow\\quad n = ' +
                  ntc(ntr, 3),
          obs: 'Inclui σ₃ = 0 na conta. Tresca é ' +
               sgc((vm / tresca - 1) * -100, 3) + ' % mais conservador aqui.' },
        { t: 'Critério para material frágil',
          tex: '\\frac{\\sigma_1}{S_{\\text{ut}}} - \\frac{\\sigma_3}{S_{\\text{uc}}} \\le \\frac{1}{n}',
          texSub: 'n_{\\text{MC}} = ' + ntc(ncm, 3),
          obs: frag ? 'É o critério adequado para este material.'
                    : 'Mostrado apenas para comparação — em material dúctil use von Mises.' },
        { t: 'Coeficiente de projeto',
          texSub: 'n_{\\text{projeto}} = ' + ntc(nproj, 3),
          r: nproj < 1 ? 'FALHA — n < 1' : nproj < 1.5 ? 'Margem curta' : 'Aprovado',
          obs: 'Adota-se o critério apropriado ao material, e não simplesmente o menor valor.' }
      ]);

      return {
        vm: { v: vm, u: 'MPa' },
        nvm: { v: nvm, u: '', classe: frag ? '' : (nvm < 1 ? 'alerta' : 'destaque') },
        ntr: { v: ntr, u: '', classe: ntr < 1 ? 'alerta' : '' },
        ncm: { v: ncm, u: '', classe: frag ? (ncm < 1 ? 'alerta' : 'destaque') : '' },
        nmn: { v: nmn, u: '', classe: nmn < 1 ? 'alerta' : '' },
        nproj: { v: nproj, u: '', classe: nproj < 1 ? 'alerta' : nproj < 1.5 ? '' : 'ok' },
        crit: {
          v: frag ? 'Fragil → Coulomb-Mohr (n = ' + Plot.sig(ncm, 3) + ')'
                  : 'Ductil → von Mises (n = ' + Plot.sig(nvm, 3) + ')',
          u: '', classe: nproj < 1 ? 'alerta' : 'ok'
        }
      };
    }
  });
})();


/* ============================================================
   Roseta de extensômetros — de três leituras ao estado de tensão
   ------------------------------------------------------------
   Um extensômetro mede deformação em UMA direção. Como o estado plano
   tem três incógnitas (εx, εy, γxy), são necessárias três leituras em
   direções diferentes — e é isso que é uma roseta.
   ============================================================ */
(function () {
  'use strict';
  if (!document.getElementById('sim-roseta')) return;

  var TAU = Math.PI * 2;
  var A = { on: true, fase: 0, ultimo: 0, ctx: null, p: null, r: null };

  function rad(g) { return g * Math.PI / 180; }
  function fonte(px, peso) {
    return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif');
  }

  var TIPOS = {
    ret: { nome: 'Retangular 0° / 45° / 90°', ang: [0, 45, 90],
           obs: 'A mais comum. As fórmulas ficam diretas: εx e εy saem lidos, e só γxy exige conta.' },
    delta: { nome: 'Delta 0° / 60° / 120°', ang: [0, 60, 120],
             obs: 'Ângulos iguais entre si: a precisão é a mesma em qualquer orientação do campo.' },
    leque: { nome: 'Leque 0° / 45° / 90° (empilhada)', ang: [0, 45, 90],
             obs: 'Grades sobrepostas no mesmo ponto: mede um ponto só, mas aquece mais.' },
    livre: { nome: 'Ângulos livres', ang: [0, 45, 90],
             obs: 'Qualquer terna de ângulos serve, desde que sejam distintos.' }
  };

  /* resolve o sistema 3x3 de eps_theta = ex cos²θ + ey sin²θ + gxy sinθ cosθ */
  function resolver(p) {
    var t = TIPOS[p.tipo];
    var ang = p.tipo === 'livre' ? [p.a1, p.a2, p.a3] : t.ang;
    var eps = [p.e1, p.e2, p.e3].map(function (v) { return v * 1e-6; });   /* µε -> ε */
    var M = ang.map(function (g) {
      var th = rad(g), c = Math.cos(th), s = Math.sin(th);
      return [c * c, s * s, s * c];
    });
    /* eliminação de Gauss com pivoteamento */
    var Aug = M.map(function (row, i) { return row.concat([eps[i]]); });
    var n = 3, i, j, k;
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(Aug[k][i]) > Math.abs(Aug[piv][i])) piv = k;
      var tmp = Aug[i]; Aug[i] = Aug[piv]; Aug[piv] = tmp;
      if (Math.abs(Aug[i][i]) < 1e-14) return null;
      for (k = i + 1; k < n; k++) {
        var f = Aug[k][i] / Aug[i][i];
        for (j = i; j <= n; j++) Aug[k][j] -= f * Aug[i][j];
      }
    }
    var x = [0, 0, 0];
    for (i = n - 1; i >= 0; i--) {
      var sm = Aug[i][n];
      for (j = i + 1; j < n; j++) sm -= Aug[i][j] * x[j];
      x[i] = sm / Aug[i][i];
    }
    /* a eliminacao deixa residuos de ordem 1e-21; zera o que e ruido */
    var maior = Math.max(Math.abs(x[0]), Math.abs(x[1]), Math.abs(x[2]), 1e-12);
    x = x.map(function (v) { return Math.abs(v) < maior * 1e-9 ? 0 : v; });
    var ex = x[0], ey = x[1], gxy = x[2];

    var med = (ex + ey) / 2;
    var R = Math.sqrt(Math.pow((ex - ey) / 2, 2) + Math.pow(gxy / 2, 2));
    var e1 = med + R, e2 = med - R;
    var thp = 0.5 * Math.atan2(gxy, ex - ey) * 180 / Math.PI;
    var gmax = 2 * R;

    /* Hooke no estado plano de TENSÃO */
    var E = p.E * 1000;                       /* GPa -> MPa */
    var nu = p.nu;
    var s1 = E / (1 - nu * nu) * (e1 + nu * e2);
    var s2 = E / (1 - nu * nu) * (e2 + nu * e1);
    var sx = E / (1 - nu * nu) * (ex + nu * ey);
    var sy = E / (1 - nu * nu) * (ey + nu * ex);
    var txy = E / (2 * (1 + nu)) * gxy;
    var escS = Math.max(Math.abs(s1), Math.abs(s2), 1e-9);
    if (Math.abs(s1) < escS * 1e-9) s1 = 0;
    if (Math.abs(s2) < escS * 1e-9) s2 = 0;
    if (Math.abs(txy) < escS * 1e-9) txy = 0;
    var vm = Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2);
    /* deformação fora do plano, por Poisson */
    var ez = -nu / (1 - nu) * (ex + ey);

    return { ang: ang, eps: eps, ex: ex, ey: ey, gxy: gxy, med: med, R: R,
             e1: e1, e2: e2, thp: thp, gmax: gmax, s1: s1, s2: s2,
             sx: sx, sy: sy, txy: txy, vm: vm, ez: ez, tipo: t, M: M };
  }

  function desenharRoseta(c, pl, p, r, fase) {
    var a = pl._area;
    var cor = Plot.cssVar('--text', '#111');
    var faint = Plot.cssVar('--text-faint', '#999');
    var borda = Plot.cssVar('--border', '#ddd');
    var i;

    var cx = a.x + a.w * 0.27, cy = a.y + a.h * 0.54;
    var R = Math.min(a.w * 0.165, a.h * 0.285);

    /* peca deformada, exagerada, pulsando */
    var puls = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(fase * TAU));
    var pico = Math.max(Math.abs(r.ex), Math.abs(r.ey), Math.abs(r.gxy), 1e-9);
    var kEsc = 0.30 / pico;                       /* normaliza: pico vira 30% do lado */
    var dx = r.ex * kEsc * puls, dy = r.ey * kEsc * puls, dg = r.gxy * kEsc * puls;

    c.setLineDash([]);
    /* quadrado de referencia, sem deformar */
    c.strokeStyle = borda; c.lineWidth = 1.4; c.setLineDash([4, 3]);
    c.strokeRect(cx - R, cy - R, 2 * R, 2 * R);
    c.setLineDash([]);
    c.fillStyle = faint; c.font = fonte(9.5);
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText('sem carga', cx, cy - R - 5);

    /* quadrado deformado */
    var q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (v) {
      var X = v[0] * R * (1 + dx) + v[1] * R * dg / 2;
      var Y = v[1] * R * (1 + dy) + v[0] * R * dg / 2;
      return [cx + X, cy - Y];
    });
    c.fillStyle = Plot.serie(0); c.globalAlpha = 0.13;
    c.beginPath();
    c.moveTo(q[0][0], q[0][1]);
    for (i = 1; i < 4; i++) c.lineTo(q[i][0], q[i][1]);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
    c.strokeStyle = Plot.serie(0); c.lineWidth = 2.2;
    c.stroke();

    /* direcoes principais, antes das grades para ficarem por baixo */
    var thp = rad(r.thp);
    c.strokeStyle = Plot.serie(6); c.lineWidth = 2.2; c.setLineDash([7, 5]);
    c.beginPath();
    c.moveTo(cx - Math.cos(thp) * R * 1.30, cy + Math.sin(thp) * R * 1.30);
    c.lineTo(cx + Math.cos(thp) * R * 1.30, cy - Math.sin(thp) * R * 1.30);
    c.stroke();
    c.setLineDash([]);

    /* as tres grades da roseta */
    var cores = [Plot.serie(5), Plot.serie(2), Plot.serie(4)];
    r.ang.forEach(function (g, k) {
      var th = rad(g);
      var ux = Math.cos(th), uy = -Math.sin(th);          /* direcao da grade, em tela */
      var nx = -uy, ny = ux;                              /* normal unitaria */
      var L = R * 0.60, amp = 5.5;
      /* base clara sob a grade */
      c.save();
      c.translate(cx, cy); c.rotate(-th);
      c.fillStyle = cores[k]; c.globalAlpha = 0.14;
      c.fillRect(-L, -amp - 3, 2 * L, 2 * (amp + 3));
      c.globalAlpha = 1;
      c.restore();
      /* grade serpenteada */
      c.strokeStyle = cores[k]; c.lineWidth = 2.2;
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      var nz = 8;
      for (i = 0; i <= nz; i++) {
        var t = -L + (2 * L) * (i / nz);
        var lado = (i % 2 === 0 ? 1 : -1) * amp;
        var X = cx + ux * t + nx * lado;
        var Y = cy + uy * t + ny * lado;
        if (i === 0) c.moveTo(cx + ux * t, cy + uy * t);
        c.lineTo(X, Y);
        if (i === nz) c.lineTo(cx + ux * t, cy + uy * t);
      }
      c.stroke();
      c.lineCap = 'butt'; c.lineJoin = 'miter';
      /* rotulo SEMPRE do lado esquerdo/inferior, longe do painel numerico */
      var Lr = R * 1.34;
      var lx = cx - ux * Lr, ly = cy - uy * Lr;
      c.fillStyle = cores[k]; c.font = fonte(11, '700');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String.fromCharCode(97 + k) + ' · ' + g + '°', lx, ly - 9);
      c.font = fonte(9.5);
      c.fillText(Plot.sig(r.eps[k] * 1e6, 4) + ' µε', lx, ly + 4);
    });

    /* rotulo da direcao principal, tambem a esquerda */
    c.fillStyle = Plot.serie(6); c.font = fonte(10.5, '700');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('ε₁ · ' + Plot.sig(r.thp, 3) + '°',
               cx + Math.cos(thp) * R * 1.30 + 4, cy - Math.sin(thp) * R * 1.30 - 13);

    /* painel numerico */
    var px = a.x + a.w * 0.55, py = a.y + a.h * 0.16;
    c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillStyle = cor; c.font = fonte(12, '700');
    c.fillText('Estado de deformação no ponto', px, py);
    c.font = fonte(11); c.fillStyle = faint;
    [['ε_x = ' + Plot.sig(r.ex * 1e6, 4) + ' µε', 24],
     ['ε_y = ' + Plot.sig(r.ey * 1e6, 4) + ' µε', 41],
     ['γ_xy = ' + Plot.sig(r.gxy * 1e6, 4) + ' µrad', 58],
     ['ε_z = ' + Plot.sig(r.ez * 1e6, 4) + ' µε   (por Poisson)', 75]
    ].forEach(function (t) { c.fillText(t[0], px, py + t[1]); });

    c.fillStyle = cor; c.font = fonte(12, '700');
    c.fillText('Principais', px, py + 104);
    c.font = fonte(11); c.fillStyle = Plot.serie(6);
    [['ε₁ = ' + Plot.sig(r.e1 * 1e6, 4) + ' µε', 128],
     ['ε₂ = ' + Plot.sig(r.e2 * 1e6, 4) + ' µε', 145],
     ['θ_p = ' + Plot.sig(r.thp, 3) + '°', 162]
    ].forEach(function (t) { c.fillText(t[0], px, py + t[1]); });
    c.fillStyle = cor; c.font = fonte(12, '700');
    c.fillText('Tensões, por Hooke', px, py + 191);
    c.font = fonte(11); c.fillStyle = Plot.serie(2);
    [['σ₁ = ' + Plot.sig(r.s1, 4) + ' MPa', 215],
     ['σ₂ = ' + Plot.sig(r.s2, 4) + ' MPa', 232],
     ['von Mises = ' + Plot.sig(r.vm, 4) + ' MPa', 249]
    ].forEach(function (t) { c.fillText(t[0], px, py + t[1]); });

    c.fillStyle = cor; c.font = fonte(12.5, '650');
    c.fillText('Roseta colada na superfície — ' + r.tipo.nome, a.x + 4, a.y + 2);
    c.font = fonte(10.5); c.fillStyle = faint;
    c.fillText('a deformação do quadrado está exagerada para ficar visível; a escala do desenho não é a real',
               a.x + 4, a.y + 19);
  }

  Sim.build('#sim-roseta', {
    titulo: 'Roseta de extensômetros — das três leituras ao estado de tensão',
    descricao: 'Um extensômetro mede deformação em uma direção só. O estado plano tem três incógnitas, então são necessárias três leituras — e é exatamente isso que é uma roseta. Daqui saem as tensões principais e o von Mises, sem nunca medir tensão.',
    controlesLargos: true,
    exemplos: [
      { nome: '1 · Tração uniaxial pura', desc: 'εb no meio e εc negativo por Poisson',
        valores: { tipo: 'ret', e1: 500, e2: 175, e3: -150, a1: 0, a2: 45, a3: 90, E: 200, nu: 0.30, animar: true } },
      { nome: '2 · Cisalhamento puro', desc: 'εa = εc = 0 e εb = metade de γ',
        valores: { tipo: 'ret', e1: 0, e2: 400, e3: 0, a1: 0, a2: 45, a3: 90, E: 200, nu: 0.30, animar: true } },
      { nome: '3 · Estado biaxial', desc: 'Duas trativas; ε_b = (ε_a+ε_c)/2 anula γ_xy',
        valores: { tipo: 'ret', e1: 600, e2: 450, e3: 300, a1: 0, a2: 45, a3: 90, E: 200, nu: 0.30, animar: true } },
      { nome: '4 · Roseta delta', desc: 'Mesma precisão em qualquer orientação do campo',
        valores: { tipo: 'delta', e1: 500, e2: 100, e3: -200, a1: 0, a2: 60, a3: 120, E: 200, nu: 0.30, animar: true } },
      { nome: '5 · Vaso de pressão (2:1)', desc: 'Circunferencial é o dobro da longitudinal',
        valores: { tipo: 'ret', e1: 700, e2: 432, e3: 164, a1: 0, a2: 45, a3: 90, E: 200, nu: 0.30, animar: true } },
      { nome: '6 · Torção, roseta a 45° do eixo', desc: 'As grades caem sobre as direções principais: ε₁ = −ε₂',
        valores: { tipo: 'ret', e1: -350, e2: 0, e3: 350, a1: 0, a2: 45, a3: 90, E: 200, nu: 0.30, animar: true } },
      { nome: '7 · Alumínio, mesmo estado', desc: 'A deformação é a mesma; a tensão cai com E',
        valores: { tipo: 'ret', e1: 600, e2: 450, e3: 300, a1: 0, a2: 45, a3: 90, E: 70, nu: 0.33, animar: true } }
    ],
    controles: [
      { id: 'tipo', tipo: 'select', label: 'Tipo de roseta', valor: 'ret',
        opcoes: Object.keys(TIPOS).map(function (k) { return { v: k, t: TIPOS[k].nome }; }) },
      { tipo: 'titulo', label: 'Leituras dos extensômetros' },
      { id: 'e1', label: 'Extensômetro a', min: -1500, max: 1500, step: 1, valor: 500, unidade: 'µε' },
      { id: 'e2', label: 'Extensômetro b', min: -1500, max: 1500, step: 1, valor: 175, unidade: 'µε' },
      { id: 'e3', label: 'Extensômetro c', min: -1500, max: 1500, step: 1, valor: -150, unidade: 'µε' },
      { tipo: 'titulo', label: 'Ângulos (só no modo livre)' },
      { id: 'a1', label: 'Ângulo de a', min: 0, max: 175, step: 5, valor: 0, unidade: '°' },
      { id: 'a2', label: 'Ângulo de b', min: 0, max: 175, step: 5, valor: 45, unidade: '°' },
      { id: 'a3', label: 'Ângulo de c', min: 0, max: 175, step: 5, valor: 90, unidade: '°' },
      { tipo: 'titulo', label: 'Material' },
      { id: 'E', label: 'Módulo de elasticidade E', min: 20, max: 250, step: 1, valor: 200,
        unidade: 'GPa', desc: 'Aço 200 · alumínio 70 · titânio 110 · cobre 110' },
      { id: 'nu', label: 'Coeficiente de Poisson ν', min: 0.2, max: 0.45, step: 0.01, valor: 0.30,
        unidade: '' },
      { tipo: 'separador' },
      { id: 'animar', tipo: 'check', label: 'Pulsar a deformação', valor: true }
    ],
    graficos: [
      { id: 'roseta', axes: false, height: 360, grid: false, legend: false },
      { id: 'mohr', titulo: 'Círculo de Mohr das DEFORMAÇÕES',
        xlabel: 'ε (µε)', ylabel: 'γ/2 (µrad)', aspect: 0.60, equalAspect: true,
        legendPos: 'topleft' },
      { id: 'variacao', titulo: 'Deformação normal em função da direção',
        xlabel: 'Ângulo θ (°)', ylabel: 'ε_θ (µε)', aspect: 0.32, legendPos: 'topright' }
    ],
    saidas: [
      { id: 'ex', label: 'ε_x' },
      { id: 'ey', label: 'ε_y' },
      { id: 'gxy', label: 'γ_xy' },
      { id: 'e1', label: 'ε₁ principal' },
      { id: 'e2', label: 'ε₂ principal' },
      { id: 'thp', label: 'Direção principal θ_p' },
      { id: 's1', label: 'σ₁' },
      { id: 'vm', label: 'von Mises' }
    ],
    formulas: [
      { g: 'Por que três extensômetros' },
      { tex: '\\text{O estado plano de deformação tem TRÊS incógnitas: } \\varepsilon_x,\\ \\varepsilon_y,\\ \\gamma_{xy}',
        d: 'e cada extensômetro dá UMA equação — daí três grades', destaque: true },
      { tex: '\\text{Extensômetro NÃO mede tensão}',
        d: 'ele mede variação de resistência elétrica, que vira deformação; a tensão vem depois, por Hooke', destaque: true },

      { g: 'A equação de cada grade' },
      { tex: '\\varepsilon_\\theta = \\varepsilon_x\\cos^2\\theta + \\varepsilon_y\\sin^2\\theta + \\gamma_{xy}\\sin\\theta\\cos\\theta',
        d: 'transformação de deformação normal na direção θ', destaque: true },
      { tex: '\\begin{cases}\\varepsilon_a = \\varepsilon_\\theta(\\theta_a)\\\\ \\varepsilon_b = \\varepsilon_\\theta(\\theta_b)\\\\ \\varepsilon_c = \\varepsilon_\\theta(\\theta_c)\\end{cases}',
        d: 'sistema linear 3×3 nas três incógnitas' },

      { g: 'Roseta retangular 0/45/90 — solução direta' },
      { tex: '\\varepsilon_x = \\varepsilon_a \\qquad \\varepsilon_y = \\varepsilon_c',
        d: 'as grades a e c já estão nos próprios eixos', destaque: true },
      { tex: '\\gamma_{xy} = 2\\varepsilon_b - \\varepsilon_a - \\varepsilon_c',
        d: 'é a única que exige conta — e note que γ pode ser negativo', destaque: true },

      { g: 'Roseta delta 0/60/120' },
      { tex: '\\varepsilon_x = \\varepsilon_a \\qquad \\varepsilon_y = \\frac{2\\varepsilon_b + 2\\varepsilon_c - \\varepsilon_a}{3}',
        d: 'ângulos iguais entre si dão precisão uniforme', destaque: true },
      { tex: '\\gamma_{xy} = \\frac{2(\\varepsilon_b - \\varepsilon_c)}{\\sqrt{3}}' },

      { g: 'Deformações principais' },
      { tex: '\\varepsilon_{1,2} = \\frac{\\varepsilon_x + \\varepsilon_y}{2} \\pm \\sqrt{\\left(\\frac{\\varepsilon_x - \\varepsilon_y}{2}\\right)^2 + \\left(\\frac{\\gamma_{xy}}{2}\\right)^2}',
        d: 'mesma forma das tensões, com γ/2 no lugar de τ', destaque: true },
      { tex: '\\tan 2\\theta_p = \\frac{\\gamma_{xy}}{\\varepsilon_x - \\varepsilon_y}',
        d: 'atenção ao fator 2: o ângulo no círculo é o dobro do giro real' },
      { tex: '\\gamma_{\\text{máx}} = \\varepsilon_1 - \\varepsilon_2', d: 'diâmetro do círculo de Mohr' },

      { g: 'Da deformação para a tensão — Hooke no estado plano' },
      { tex: '\\sigma_1 = \\frac{E}{1-\\nu^2}(\\varepsilon_1 + \\nu\\,\\varepsilon_2)',
        d: 'estado plano de TENSÃO (σ₃ = 0), que é o caso de uma superfície livre', destaque: true },
      { tex: '\\sigma_2 = \\frac{E}{1-\\nu^2}(\\varepsilon_2 + \\nu\\,\\varepsilon_1)' },
      { tex: '\\varepsilon_3 = -\\frac{\\nu}{1-\\nu}(\\varepsilon_x + \\varepsilon_y)',
        d: 'a deformação fora do plano NÃO é zero — só a tensão é', destaque: true },
      { tex: '\\sigma\' = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}',
        d: 'von Mises, para comparar com o limite de escoamento' },

      { g: 'Na prática' },
      { tex: 'GF = \\frac{\\Delta R/R}{\\varepsilon}',
        d: 'fator do extensômetro; ~2,1 nos de constantan', destaque: true },
      { tex: '\\text{Ponte de Wheatstone: } \\Delta R/R \\approx 10^{-3} \\text{ para } 500\\ \\mu\\varepsilon',
        d: 'variação minúscula — daí a necessidade da ponte e da compensação de temperatura' },
      { tex: '\\text{A roseta só lê a SUPERFÍCIE}',
        d: 'por isso se assume estado plano de tensão: não há carga na face livre' }
    ],
    passos: [],
    passosTitulo: 'Resolução passo a passo',
    passosAbertos: true,
    nota: 'Supõe-se material isotrópico, linear-elástico e estado plano de tensão — condições que valem numa superfície livre longe de concentradores. Em compósito ou perto de um furo, as relações de Hooke usadas aqui não valem.',
    calcular: function (p, ctx) {
      var r = resolver(p);
      if (!r) return {};
      A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
      desenha();

      var nt = Plot.numTex, sg = Plot.sig;
      var u = 1e6;

      /* círculo de Mohr das deformações */
      var g = ctx.plot('mohr').clear();
      var ths = Plot.linspace(0, TAU, 120);
      g.line(ths.map(function (t) { return (r.med + r.R * Math.cos(t)) * u; }),
             ths.map(function (t) { return r.R * Math.sin(t) * u; }),
        { color: Plot.serie(0), width: 2.6, label: 'círculo de Mohr' });
      g.marker(r.ex * u, r.gxy / 2 * u, 'x', { color: Plot.serie(5), r: 5 });
      g.marker(r.ey * u, -r.gxy / 2 * u, 'y', { color: Plot.serie(2), r: 5 });
      g.marker(r.e1 * u, 0, 'ε₁', { color: Plot.serie(6), r: 5.5 });
      g.marker(r.e2 * u, 0, 'ε₂', { color: Plot.serie(6), r: 5.5 });
      g.line([r.ex * u, r.ey * u], [r.gxy / 2 * u, -r.gxy / 2 * u],
        { color: Plot.serie(3), width: 1.8, dash: [4, 3], label: 'diâmetro x-y' });
      g.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.1 });
      g.vline(r.med * u, { color: Plot.serie(7), dash: [3, 3], width: 1.2,
        text: 'centro ' + Plot.sig(r.med * u, 4) });
      g.draw();

      /* variação com o ângulo */
      var gs = Plot.linspace(0, 180, 120);
      var gv = ctx.plot('variacao').clear();
      gv.line(gs, gs.map(function (gg) {
        var th = rad(gg), c2 = Math.cos(th), s2 = Math.sin(th);
        return (r.ex * c2 * c2 + r.ey * s2 * s2 + r.gxy * s2 * c2) * u;
      }), { color: Plot.serie(0), width: 2.6, label: 'ε_θ' });
      r.ang.forEach(function (gg, k) {
        gv.marker(gg, r.eps[k] * u, String.fromCharCode(97 + k),
          { color: [Plot.serie(5), Plot.serie(2), Plot.serie(4)][k], r: 5 });
      });
      gv.hline(r.e1 * u, { color: Plot.serie(6), dash: [4, 3], width: 1.3,
        text: 'ε₁ = ' + Plot.sig(r.e1 * u, 4) });
      gv.hline(r.e2 * u, { color: Plot.serie(6), dash: [4, 3], width: 1.3,
        text: 'ε₂ = ' + Plot.sig(r.e2 * u, 4) });
      var tp = r.thp < 0 ? r.thp + 180 : r.thp;
      gv.vline(tp, { color: Plot.serie(6), dash: [2, 3], width: 1.4,
        text: 'θ_p = ' + Plot.sig(r.thp, 3) + '°' });
      gv.draw();

      /* passo a passo */
      var passos = [];
      passos.push({ t: '① Escrever a equação de cada extensômetro',
        tex: '\\varepsilon_\\theta = \\varepsilon_x\\cos^2\\theta + \\varepsilon_y\\sin^2\\theta + \\gamma_{xy}\\sin\\theta\\cos\\theta',
        texSub: r.ang.map(function (gg, k) {
          var th = rad(gg);
          return nt(r.eps[k] * u) + ' = ' + nt(Math.cos(th) * Math.cos(th)) + '\\varepsilon_x + ' +
            nt(Math.sin(th) * Math.sin(th)) + '\\varepsilon_y + ' +
            nt(Math.sin(th) * Math.cos(th)) + '\\gamma_{xy}';
        }).join(' \\\\ '),
        obs: 'Três equações e três incógnitas. Os ângulos são medidos a partir do eixo x, todos '
          + 'no mesmo sentido. As leituras estão em micro-deformação (µε = 10⁻⁶).' });

      if (p.tipo === 'ret' || p.tipo === 'leque') {
        passos.push({ t: '② Solução direta da roseta retangular',
          tex: '\\varepsilon_x = \\varepsilon_a \\qquad \\varepsilon_y = \\varepsilon_c \\qquad \\gamma_{xy} = 2\\varepsilon_b - \\varepsilon_a - \\varepsilon_c',
          texSub: '\\varepsilon_x = ' + nt(p.e1) + ' \\qquad \\varepsilon_y = ' + nt(p.e3) +
            ' \\qquad \\gamma_{xy} = 2(' + nt(p.e2) + ') - (' + nt(p.e1) + ') - (' + nt(p.e3) +
            ') = ' + nt(r.gxy * u) + '\\ \\mu\\varepsilon',
          obs: 'Com 0° e 90°, as grades a e c já apontam nos próprios eixos e dão εx e εy de graça. '
            + 'Só γxy exige conta — e ele pode perfeitamente ser negativo, o que apenas indica o '
            + 'sentido da distorção.' });
      } else if (p.tipo === 'delta') {
        passos.push({ t: '② Solução da roseta delta',
          tex: '\\varepsilon_x = \\varepsilon_a \\qquad \\varepsilon_y = \\frac{2\\varepsilon_b + 2\\varepsilon_c - \\varepsilon_a}{3} \\qquad \\gamma_{xy} = \\frac{2(\\varepsilon_b - \\varepsilon_c)}{\\sqrt{3}}',
          texSub: '\\varepsilon_x = ' + nt(p.e1) + ' \\qquad \\varepsilon_y = ' + nt(r.ey * u) +
            ' \\qquad \\gamma_{xy} = ' + nt(r.gxy * u) + '\\ \\mu\\varepsilon',
          obs: 'Os 60° entre grades distribuem melhor a informação: a incerteza do resultado é a '
            + 'mesma qualquer que seja a orientação do campo de deformação, o que não acontece na '
            + 'retangular.' });
      } else {
        passos.push({ t: '② Resolver o sistema 3×3',
          tex: '[M]\\{\\varepsilon\\} = \\{\\varepsilon_{lidos}\\}',
          texSub: '\\varepsilon_x = ' + nt(r.ex * u) + ' \\qquad \\varepsilon_y = ' + nt(r.ey * u) +
            ' \\qquad \\gamma_{xy} = ' + nt(r.gxy * u) + '\\ \\mu\\varepsilon',
          obs: 'Com ângulos quaisquer não há fórmula fechada: resolve-se o sistema por eliminação. '
            + 'A única exigência é que os três ângulos sejam distintos — se dois coincidirem, a '
            + 'matriz fica singular e não há solução.' });
      }

      passos.push({ t: '③ Deformações principais',
        tex: '\\varepsilon_{1,2} = \\frac{\\varepsilon_x+\\varepsilon_y}{2} \\pm \\sqrt{\\left(\\frac{\\varepsilon_x-\\varepsilon_y}{2}\\right)^2 + \\left(\\frac{\\gamma_{xy}}{2}\\right)^2}',
        texSub: '\\varepsilon_{1,2} = ' + nt(r.med * u) + ' \\pm ' + nt(r.R * u) +
          ' \\;\\Rightarrow\\; \\varepsilon_1 = ' + nt(r.e1 * u) + ',\\ \\varepsilon_2 = ' +
          nt(r.e2 * u) + '\\ \\mu\\varepsilon',
        obs: 'É a mesma fórmula das tensões principais, trocando σ por ε e τ por γ/2. Esse fator 2 '
          + 'é a origem de metade dos erros: no círculo de Mohr das deformações, o eixo vertical é '
          + 'γ/2, não γ.' });
      passos.push({ t: '④ Direção principal',
        tex: '\\tan 2\\theta_p = \\frac{\\gamma_{xy}}{\\varepsilon_x - \\varepsilon_y}',
        texSub: '2\\theta_p = \\arctan\\frac{' + nt(r.gxy * u) + '}{' + nt((r.ex - r.ey) * u) +
          '} \\;\\Rightarrow\\; \\theta_p = {' + nt(r.thp) + '}^\\circ',
        obs: 'θ_p é medido a partir do eixo x, no mesmo sentido dos ângulos das grades. A segunda '
          + 'direção principal fica a 90° desta. Use arco-tangente de dois argumentos para não '
          + 'perder o quadrante.' });
      passos.push({ t: '⑤ Tensões, por Hooke no estado plano de tensão',
        tex: '\\sigma_1 = \\frac{E}{1-\\nu^2}(\\varepsilon_1 + \\nu\\varepsilon_2)',
        texSub: '\\sigma_1 = \\frac{' + nt(p.E * 1000) + '}{1 - ' + nt(p.nu * p.nu) + '}(' +
          nt(r.e1) + ' + ' + nt(p.nu) + ' \\cdot ' + nt(r.e2) + ') = ' + nt(r.s1) +
          '\\ \\mathrm{MPa}',
        obs: 'A roseta está na SUPERFÍCIE, que é livre de carga: σ₃ = 0, e vale o estado plano de '
          + 'tensão. Atenção: σ₃ = 0 não significa ε₃ = 0 — a peça se contrai na espessura por '
          + 'Poisson, e aqui ε₃ vale ' + sg(r.ez * u, 4) + ' µε.' });
      passos.push({ t: '⑥ Comparar com o critério de escoamento',
        tex: '\\sigma\' = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}',
        texSub: '\\sigma\' = \\sqrt{ {' + nt(r.s1) + '}^2 - (' + nt(r.s1) + ')(' + nt(r.s2) +
          ') + {' + nt(r.s2) + '}^2} = ' + nt(r.vm) + '\\ \\mathrm{MPa}',
        obs: 'Este é o número que se compara com o limite de escoamento. Para aço ASTM A36 '
          + '(S_y = 250 MPa), o coeficiente de segurança aqui seria ' + sg(250 / Math.max(r.vm, 1e-6), 3)
          + '. E note o percurso inteiro: mediu-se resistência elétrica e chegou-se a um '
          + 'coeficiente de segurança, sem jamais medir tensão.' });
      ctx.setPassos(passos);

      return {
        ex: { v: r.ex * u, u: 'µε' },
        ey: { v: r.ey * u, u: 'µε' },
        gxy: { v: r.gxy * u, u: 'µrad' },
        e1: { v: r.e1 * u, u: 'µε' },
        e2: { v: r.e2 * u, u: 'µε' },
        thp: { v: r.thp, u: '°' },
        s1: { v: r.s1, u: 'MPa' },
        vm: { v: r.vm, u: 'MPa', classe: 'destaque' }
      };
    }
  });

  function desenha() {
    if (!A.ctx || !A.p || !A.r) return;
    var pl = A.ctx.plot('roseta');
    if (!pl) return;
    pl.clear();
    pl.setLimits([0, 1], [0, 1]);
    pl.custom(function (c, plot) { desenharRoseta(c, plot, A.p, A.r, A.fase); });
    pl.draw();
  }

  (function laco() {
    if (A.on && A.ctx) {
      var agora = performance.now();
      var dt = A.ultimo ? (agora - A.ultimo) / 1000 : 0.016;
      A.ultimo = agora;
      if (dt > 0.2 || dt <= 0) dt = 0.016;
      A.fase = (A.fase + dt * 0.35) % 1;
      desenha();
    }
    requestAnimationFrame(laco);
  })();
})();

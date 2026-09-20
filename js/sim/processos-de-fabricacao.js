/* ==========================================================================
   Processos de Fabricação — modelos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · Fundição: regra de Chvorinov, módulo de resfriamento e massalote
     · Laminação: redução máxima, força, torque e potência
     · Forjamento: recalque com atrito (colina de atrito)
     · Soldagem: aporte térmico, ciclo térmico t8/5 (EN 1011-2),
       carbono equivalente e pré-aquecimento
   ========================================================================== */
(function (global) {
  'use strict';
  var PF = {};

  /* ==========================================================================
     Fundição
     ========================================================================== */
  PF.LIGAS_FUND = {
    aco:   { nome: 'Aço-carbono', C: 2.2, contracaoLiq: 3.0, contracaoSol: 2.1, Tf: 1500 },
    ffc:   { nome: 'Ferro fundido cinzento', C: 1.8, contracaoLiq: 1.5, contracaoSol: -0.5, Tf: 1200 },
    alu:   { nome: 'Alumínio', C: 1.4, contracaoLiq: 4.0, contracaoSol: 1.3, Tf: 660 },
    bronze: { nome: 'Bronze', C: 1.6, contracaoLiq: 3.5, contracaoSol: 1.6, Tf: 1000 }
  };
  /* peça: placa a × b × e (mm); massalote cilíndrico D × H */
  PF.fundicao = function (p) {
    var L = PF.LIGAS_FUND[p.liga];
    var a = p.a / 10, b = p.b / 10, e = p.e / 10;        /* cm */
    var V = a * b * e;
    var A = 2 * (a * b + a * e + b * e);
    if (p.molde === 'arefa') A = A;                       /* mantido: toda a superfície troca calor */
    var M = V / A;                                        /* módulo de resfriamento, cm */
    var t = L.C * Math.pow(M, 2);                         /* min, Chvorinov com n = 2 */
    /* massalote cilíndrico com H = k·D, resfriando pelo topo aberto */
    var k = p.HD;
    var Dm = p.D / 10, Hm = k * Dm;
    var Vm = Math.PI * Dm * Dm / 4 * Hm;
    var Am = Math.PI * Dm * Hm + Math.PI * Dm * Dm / 4;   /* lateral + base (topo aberto) */
    var Mm = Vm / Am;
    var tm = L.C * Mm * Mm;
    var razao = Mm / M;
    /* volume necessário pela contração de solidificação */
    var Vnec = V * L.contracaoSol / 100 / 0.14;           /* eficiência de alimentação ~14 % */
    return { L: L, V: V, A: A, M: M, t: t, Dm: Dm, Hm: Hm, Vm: Vm, Am: Am, Mm: Mm, tm: tm,
             razao: razao, ok: razao >= 1.2 && Vm >= Vnec, Vnec: Vnec,
             Dmin: 0, rendimento: 100 * V / (V + Vm),
             contracaoTotal: L.contracaoLiq + L.contracaoSol };
  };

  /* ==========================================================================
     Laminação (Groover)
     ========================================================================== */
  PF.laminacao = function (p) {
    var d = p.t0 - p.t1;                                  /* redução absoluta, mm */
    var r = d / p.t0;                                     /* redução relativa */
    var R = p.D / 2;
    var dMax = p.mu * p.mu * R;                           /* redução máxima possível */
    var L = Math.sqrt(R * d);                             /* comprimento de contato */
    var eps = Math.log(p.t0 / p.t1);                      /* deformação verdadeira */
    var Ybar = p.K * Math.pow(eps, p.n) / (1 + p.n);      /* tensão de escoamento média */
    var F = Ybar * p.w * L;                               /* N (K em MPa, dimensões em mm) */
    var T = 0.5 * F * L / 1000;                           /* N·m por cilindro */
    var N = p.rpm / 60;
    var P = 2 * Math.PI * N * 2 * T;                      /* W (dois cilindros) */
    var v = Math.PI * p.D / 1000 * N;                     /* m/s na superfície do cilindro */
    return { d: d, r: r, dMax: dMax, possivel: d <= dMax, L: L, eps: eps, Ybar: Ybar,
             F: F, T: T, P: P, v: v, R: R, vSaida: v * p.t0 / p.t1 };
  };

  /* ==========================================================================
     Forjamento livre (recalque de cilindro, com atrito)
     ========================================================================== */
  PF.forjamento = function (p) {
    var V = Math.PI * p.d0 * p.d0 / 4 * p.h0;             /* volume constante */
    var h = p.h;
    var d = Math.sqrt(4 * V / (Math.PI * h));
    var eps = Math.log(p.h0 / h);
    var Yf = p.K * Math.pow(Math.max(eps, 1e-6), p.n);    /* tensão de escoamento instantânea */
    var Kf = 1 + 0.4 * p.mu * d / h;                      /* fator de forma (Groover) */
    var A = Math.PI * d * d / 4;
    var F = Kf * Yf * A;                                  /* N */
    var pMedia = F / A;
    var pMax = Yf * Math.exp(2 * p.mu * (d / 2) / h);      /* pico no centro (colina de atrito) */
    var W = 0;                                             /* trabalho por integração numérica */
    var n = 200;
    for (var i = 0; i < n; i++) {
      var h1 = p.h0 - (p.h0 - h) * i / n, h2 = p.h0 - (p.h0 - h) * (i + 1) / n;
      var hm = (h1 + h2) / 2;
      var dm = Math.sqrt(4 * V / (Math.PI * hm));
      var em = Math.log(p.h0 / hm);
      var Ym = p.K * Math.pow(Math.max(em, 1e-6), p.n);
      var Km = 1 + 0.4 * p.mu * dm / hm;
      W += Km * Ym * Math.PI * dm * dm / 4 * (h1 - h2);   /* N·mm */
    }
    return { V: V, d: d, eps: eps, Yf: Yf, Kf: Kf, A: A, F: F, pMedia: pMedia, pMax: pMax,
             W: W / 1000, razao: d / h };                  /* W em J */
  };

  /* ==========================================================================
     Soldagem
     ========================================================================== */
  PF.PROCESSOS = {
    smaw: { nome: 'Eletrodo revestido (SMAW)', eta: 0.8, V: [20, 30], I: [80, 250] },
    gmaw: { nome: 'MIG/MAG (GMAW)', eta: 0.85, V: [18, 30], I: [100, 350] },
    gtaw: { nome: 'TIG (GTAW)', eta: 0.65, V: [10, 20], I: [50, 250] },
    saw:  { nome: 'Arco submerso (SAW)', eta: 0.95, V: [25, 40], I: [300, 1000] },
    fcaw: { nome: 'Arame tubular (FCAW)', eta: 0.85, V: [20, 32], I: [120, 400] }
  };
  /* aporte térmico em kJ/mm */
  PF.aporte = function (p) {
    var proc = PF.PROCESSOS[p.processo];
    var H = proc.eta * p.V * p.I / (p.v * 1000);          /* kJ/mm, com v em mm/s */
    return { proc: proc, eta: proc.eta, H: H, Hbruto: p.V * p.I / (p.v * 1000), potencia: p.V * p.I };
  };
  /* tempo de resfriamento entre 800 e 500 °C — EN 1011-2 */
  PF.t85 = function (p) {
    var T0 = p.T0, Q = p.Q;                               /* Q em kJ/mm */
    var f3 = p.F3, f2 = p.F2;
    var t3 = (6700 - 5 * T0) * Q * (1 / (500 - T0) - 1 / (800 - T0)) * f3;
    var t2 = (4300 - 4.3 * T0) * 1e5 * Q * Q / (p.d * p.d) *
             (Math.pow(1 / (500 - T0), 2) - Math.pow(1 / (800 - T0), 2)) * f2;
    /* espessura de transição: onde os dois resultados coincidem */
    var dTrans = Q * Math.sqrt((4300 - 4.3 * T0) * 1e5 * (Math.pow(1 / (500 - T0), 2) - Math.pow(1 / (800 - T0), 2)) * f2 /
                 ((6700 - 5 * T0) * (1 / (500 - T0) - 1 / (800 - T0)) * f3));
    var tridim = p.d >= dTrans;
    return { t3: t3, t2: t2, t85: tridim ? t3 : t2, tridim: tridim, dTrans: dTrans };
  };
  /* carbono equivalente e pré-aquecimento */
  PF.carbonoEq = function (c) {
    var CE = c.C + c.Mn / 6 + (c.Cr + c.Mo + c.V) / 5 + (c.Ni + c.Cu) / 15;   /* IIW */
    var Pcm = c.C + c.Si / 30 + (c.Mn + c.Cu + c.Cr) / 20 + c.Ni / 60 + c.Mo / 15 + c.V / 10 + 5 * (c.B || 0);
    var CET = c.C + (c.Mn + c.Mo) / 10 + (c.Cr + c.Cu) / 20 + c.Ni / 40;      /* EN 1011-2 */
    return { CE: CE, Pcm: Pcm, CET: CET };
  };
  /* pré-aquecimento pelo método do CET (EN 1011-2, aço C-Mn) */
  PF.preaquecimento = function (p) {
    var Tp = 697 * p.CET + 160 * Math.tanh(p.d / 35) + 62 * Math.pow(p.HD, 0.35) + (53 * p.CET - 32) * p.Q - 328;
    return { Tp: Math.max(0, Tp), recomendado: Tp > 20 };
  };

  global.PF = PF;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Simuladores de Processos de Fabricação
     1. sim-fundicao   : solidificação, regra de Chvorinov e massalote
     2. sim-laminacao  : redução, força, torque e potência
     3. sim-forjamento : recalque com atrito e colina de atrito
     4. sim-soldagem   : aporte térmico, ciclo térmico t8/5 e pré-aquecimento
   ========================================================================== */
(function () {
  'use strict';
  var PF = window.PF;
  var TAU = Math.PI * 2;

  var quadros = [];
  function registrar(fn) { quadros.push(fn); }
  (function laco() {
    for (var i = 0; i < quadros.length; i++) {
      try { quadros[i](); } catch (e) { /* um modelo com erro não trava os outros */ }
    }
    requestAnimationFrame(laco);
  })();
  function relogio() {
    return { t: 0, dt: function () {
      var agora = performance.now();
      var d = this.t ? (agora - this.t) / 1000 : 0.016;
      this.t = agora;
      return (d > 0.2 || d <= 0) ? 0.016 : d;
    } };
  }
  function fonte(px, peso) { return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif'); }
  function rotulo(c, txt, x, y, cor, px, peso, alinh, base) {
    c.font = fonte(px || 11, peso); c.fillStyle = cor;
    c.textAlign = alinh || 'center'; c.textBaseline = base || 'middle';
    c.fillText(txt, x, y);
  }
  function seta(c, x1, y1, x2, y2, cor, larg, cabeca) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1.5) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(10, L * 0.45);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
    c.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
    c.closePath(); c.fill();
  }
  var nt = function (v, n) { return Plot.numTex(v, n); };
  var sg = function (v, n) { return Plot.sig(v, n); };
  /* cor do metal pela fração solidificada */
  function corMetal(f) {
    return 'rgb(' + Math.round(250 - 90 * f) + ',' + Math.round(180 - 110 * f) + ',' + Math.round(60 + 30 * f) + ')';
  }

  /* ==========================================================================
     1. Fundição: solidificação e massalote
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-fundicao')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var esc = Math.min((a.w * 0.5) / (p.a + p.D + 40), (a.h - 120) / Math.max(p.e * 3 + r.Hm * 10, 60));
      var x0 = a.x + 50, ySolo = a.y + a.h * 0.62;
      var Lp = p.a * esc, Hp = p.e * esc;
      var Dm = r.Dm * 10 * esc, Hm = r.Hm * 10 * esc;
      /* molde de areia */
      c.fillStyle = faint; c.globalAlpha = 0.25;
      c.fillRect(x0 - 26, ySolo - Hm - 26, Lp + Dm + 78, Hp + Hm + 52); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.4;
      c.strokeRect(x0 - 26, ySolo - Hm - 26, Lp + Dm + 78, Hp + Hm + 52);
      rotulo(c, 'molde de areia', x0 + (Lp + Dm) / 2, ySolo + Hp + 40, faint, 10.5, '600');
      /* ciclo de solidificação */
      var Tciclo = Math.max(r.tm, r.t) * 1.4;
      var tAtual = (A.t * 1.2) % Tciclo;
      var fPeca = Math.min(1, Math.sqrt(tAtual / r.t));
      var fMass = Math.min(1, Math.sqrt(tAtual / r.tm));
      /* peça */
      c.fillStyle = corMetal(fPeca);
      c.fillRect(x0, ySolo, Lp, Hp);
      /* casca solidificada */
      c.fillStyle = 'rgba(120,120,140,0.8)';
      var casca = Math.min(Hp / 2, fPeca * Hp / 2);
      c.fillRect(x0, ySolo, Lp, casca);
      c.fillRect(x0, ySolo + Hp - casca, Lp, casca);
      c.fillRect(x0, ySolo, casca, Hp);
      c.fillRect(x0 + Lp - casca, ySolo, casca, Hp);
      c.strokeStyle = cor; c.lineWidth = 1.6; c.strokeRect(x0, ySolo, Lp, Hp);
      rotulo(c, 'peça: M = ' + sg(r.M, 3) + ' cm  ·  t = ' + sg(r.t, 3) + ' min', x0 + Lp / 2, ySolo + Hp + 18, cor, 11, '700');
      /* massalote */
      var xm = x0 + Lp + 10;
      c.fillStyle = corMetal(fMass);
      c.fillRect(xm, ySolo - Hm, Dm, Hm + Hp);
      c.fillStyle = 'rgba(120,120,140,0.8)';
      var cascaM = Math.min(Dm / 2, fMass * Dm / 2);
      c.fillRect(xm, ySolo - Hm, cascaM, Hm + Hp);
      c.fillRect(xm + Dm - cascaM, ySolo - Hm, cascaM, Hm + Hp);
      /* rechupe no massalote (ou na peça, se o massalote solidificar antes) */
      var rech = Math.min(Hm * 0.45, Hm * 0.45 * fMass);
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.beginPath();
      c.ellipse(xm + Dm / 2, ySolo - Hm + rech * 0.6, Dm * 0.32, rech * 0.6, 0, 0, TAU);
      c.fill();
      c.strokeStyle = cor; c.lineWidth = 1.6;
      c.strokeRect(xm, ySolo - Hm, Dm, Hm + Hp);
      rotulo(c, 'massalote', xm + Dm / 2, ySolo - Hm - 14, Plot.serie(3), 11.5, '700');
      rotulo(c, 'M = ' + sg(r.Mm, 3) + ' cm · t = ' + sg(r.tm, 3) + ' min', xm + Dm / 2, ySolo + Hp + 18, Plot.serie(3), 10.5, '700');
      if (!r.ok) rotulo(c, 'massalote solidifica antes da peça: haverá rechupe na peça', x0 + (Lp + Dm) / 2, a.y + 18, 'rgb(220,60,60)', 11.5, '700');
      else rotulo(c, 'massalote solidifica depois: alimenta a contração da peça', x0 + (Lp + Dm) / 2, a.y + 18, 'rgb(60,170,110)', 11.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.68, ly = a.y + 46;
      var linhas = [
        ['módulo da peça V/A', sg(r.M, 3) + ' cm'],
        ['módulo do massalote', sg(r.Mm, 3) + ' cm'],
        ['razão entre módulos', sg(r.razao, 3) + '  (mínimo 1,2)'],
        ['tempo de solidificação da peça', sg(r.t, 3) + ' min'],
        ['contração de solidificação', sg(r.L.contracaoSol, 3) + ' %'],
        ['rendimento metálico', sg(r.rendimento, 3) + ' %']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, j === 2 ? (r.razao >= 1.2 ? 'rgb(60,170,110)' : 'rgb(220,60,60)') : cor, 12, '700', 'left');
      });
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('molde');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-fundicao', {
      titulo: 'Fundição — solidificação, regra de Chvorinov e massalote',
      descricao: 'O tempo de solidificação depende de quanto volume existe para cada área de troca de calor: é o módulo de resfriamento. A regra de Chvorinov transforma isso em tempo, e o projeto do massalote se resume a garantir que ele seja o último a solidificar — do contrário o rechupe aparece dentro da peça.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Placa de aço com massalote', desc: 'razão de módulos adequada', valores: { liga: 'aco', a: 200, b: 100, e: 40, D: 90, HD: 1.5 } },
        { nome: '2 · Massalote pequeno demais', desc: 'solidifica antes: rechupe na peça', valores: { liga: 'aco', a: 200, b: 100, e: 40, D: 50, HD: 1.5 } },
        { nome: '3 · Peça fina', desc: 'módulo pequeno: solidifica rápido', valores: { liga: 'aco', a: 200, b: 100, e: 12, D: 60, HD: 1.5 } },
        { nome: '4 · Ferro fundido cinzento', desc: 'grafita expande e quase dispensa massalote', valores: { liga: 'ffc', a: 200, b: 100, e: 40, D: 70, HD: 1.5 } },
        { nome: '5 · Alumínio', desc: 'constante de molde menor: solidifica antes', valores: { liga: 'alu', a: 200, b: 100, e: 40, D: 90, HD: 1.5 } },
        { nome: '6 · Massalote esbelto', desc: 'H/D = 2,5: módulo menor que o esperado', valores: { liga: 'aco', a: 200, b: 100, e: 40, D: 70, HD: 2.5 } }
      ],
      controles: [
        { id: 'liga', tipo: 'select', label: 'Liga fundida', valor: 'aco',
          opcoes: Object.keys(PF.LIGAS_FUND).map(function (k) { return { v: k, t: PF.LIGAS_FUND[k].nome }; }) },
        { tipo: 'titulo', label: 'Peça (placa)' },
        { id: 'a', label: 'Comprimento', min: 50, max: 600, step: 10, valor: 200, unidade: 'mm' },
        { id: 'b', label: 'Largura', min: 30, max: 400, step: 10, valor: 100, unidade: 'mm' },
        { id: 'e', label: 'Espessura', min: 5, max: 120, step: 1, valor: 40, unidade: 'mm' },
        { tipo: 'titulo', label: 'Massalote cilíndrico' },
        { id: 'D', label: 'Diâmetro', min: 20, max: 250, step: 5, valor: 90, unidade: 'mm' },
        { id: 'HD', label: 'Relação altura/diâmetro', min: 0.5, max: 3, step: 0.1, valor: 1.5, unidade: '' }
      ],
      graficos: [
        { id: 'molde', axes: false, height: 340, grid: false, legend: false },
        { id: 'chvorinov', titulo: 'Tempo de solidificação × módulo', xlabel: 'módulo de resfriamento V/A (cm)', ylabel: 'tempo (min)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'massalote', titulo: 'Razão de módulos × diâmetro do massalote', xlabel: 'diâmetro do massalote (mm)', ylabel: 'M massalote / M peça', aspect: 0.42, legend: false }
      ],
      saidas: [
        { id: 'V', label: 'Volume da peça' },
        { id: 'A', label: 'Área de troca' },
        { id: 'M', label: 'Módulo da peça' },
        { id: 't', label: 'Tempo de solidificação' },
        { id: 'Mm', label: 'Módulo do massalote' },
        { id: 'tm', label: 'Tempo do massalote' },
        { id: 'razao', label: 'Razão de módulos' },
        { id: 'rend', label: 'Rendimento metálico' },
        { id: 'estado', label: 'Verificação' }
      ],
      formulas: [
        { g: 'Solidificação' },
        { tex: 't_s = C\\left(\\frac{V}{A}\\right)^{n} \\qquad n \\approx 2', d: 'regra de Chvorinov; C depende do molde e da liga', destaque: true },
        { tex: 'M = \\frac{V}{A}', d: 'módulo de resfriamento: a grandeza que governa tudo', destaque: true },
        { g: 'Massalote' },
        { tex: 'M_{massalote} \\ge 1{,}2\\,M_{peça}', d: 'critério do módulo: o massalote precisa solidificar depois', destaque: true },
        { tex: 'M_{cil} = \\frac{\\pi D^2 H/4}{\\pi D H + \\pi D^2/4}', d: 'massalote cilíndrico com topo aberto; H/D entre 1 e 1,5 é o mais eficiente' },
        { tex: '\\eta = \\frac{V_{peça}}{V_{peça} + V_{massalote}}', d: 'rendimento metálico: o massalote é retrabalhado, não perdido' },
        { g: 'Contrações' },
        { tex: '\\text{líquida} + \\text{de solidificação} + \\text{sólida}', d: 'a de solidificação é a que o massalote alimenta; a sólida entra no modelo pela régua de contração' }
      ],
      passos: [],
      nota: 'Regra de Chvorinov com n = 2 e constantes de molde típicas para areia. O desenho mostra a solidificação progredindo da parede para o centro (√t) e o rechupe se formando no massalote. Peça tratada como placa retangular simples e massalote cilíndrico de topo aberto.',
      calcular: function (p, ctx) {
        var r = PF.fundicao(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('chvorinov').clear();
        var Ms = Plot.linspace(0.2, Math.max(r.Mm, r.M) * 1.8, 60);
        Object.keys(PF.LIGAS_FUND).forEach(function (k, j) {
          var L = PF.LIGAS_FUND[k];
          g.line(Ms, Ms.map(function (M) { return L.C * M * M; }),
            { color: Plot.serie(j), width: k === p.liga ? 2.8 : 1.5, label: L.nome });
        });
        g.marker(r.M, r.t, 'peça', { color: 'rgb(220,60,60)', r: 5 });
        g.marker(r.Mm, r.tm, 'massalote', { color: Plot.serie(3), r: 5 });
        g.draw();

        var gm = ctx.plot('massalote').clear();
        var Ds = Plot.linspace(20, 250, 60);
        gm.line(Ds, Ds.map(function (D) { return PF.fundicao({ liga: p.liga, a: p.a, b: p.b, e: p.e, D: D, HD: p.HD }).razao; }),
          { color: Plot.serie(3), width: 2.6 });
        gm.hline(1.2, { color: 'rgb(60,170,110)', dash: [4, 4], text: 'mínimo 1,2' });
        gm.marker(p.D, r.razao, 'seu massalote', { color: 'rgb(220,60,60)', r: 5 });
        gm.draw();

        ctx.setPassos([
          { t: '① Módulo de resfriamento da peça',
            tex: 'M = \\frac{V}{A}',
            texSub: 'V = ' + nt(r.V, 4) + '\\ cm^3,\\ A = ' + nt(r.A, 4) + '\\ cm^2 \\Rightarrow M = ' + nt(r.M, 4) + '\\ cm',
            obs: 'Duas peças de volumes muito diferentes podem solidificar no mesmo tempo, se tiverem o mesmo módulo. O que conta é a relação entre volume e superfície de troca.' },
          { t: '② Tempo de solidificação (Chvorinov)',
            tex: 't_s = C\\,M^2',
            texSub: 't_s = ' + nt(r.L.C, 3) + '\\cdot' + nt(r.M, 4) + '^2 = ' + nt(r.t, 4) + '\\ min',
            obs: 'A constante C reúne as propriedades do molde e a temperatura de vazamento. Dobrar a espessura da peça quadruplica o tempo.' },
          { t: '③ Módulo do massalote',
            tex: 'M_m = \\frac{V_m}{A_m} = \\frac{\\pi D^2H/4}{\\pi D H + \\pi D^2/4}',
            texSub: 'D = ' + nt(p.D, 3) + '\\ mm,\\ H = ' + nt(r.Hm * 10, 4) + '\\ mm \\Rightarrow M_m = ' + nt(r.Mm, 4) + '\\ cm \\Rightarrow t_m = ' + nt(r.tm, 4) + '\\ min',
            r: r.razao >= 1.2 ? 'Razão de módulos ' + sg(r.razao, 3) + ': adequada' : 'Razão de módulos ' + sg(r.razao, 3) + ': insuficiente',
            obs: 'A relação H/D entre 1 e 1,5 dá o melhor módulo por volume de metal gasto. Massalotes muito esbeltos perdem calor pela lateral e solidificam cedo.' },
          { t: '④ Rendimento e contração',
            tex: '\\eta = \\frac{V_{peça}}{V_{peça} + V_{massalote}}',
            texSub: '\\eta = \\frac{' + nt(r.V, 4) + '}{' + nt(r.V, 4) + ' + ' + nt(r.Vm, 4) + '} = ' + nt(r.rendimento, 3) + '\\ \\%',
            obs: 'Esta liga contrai ' + sg(r.L.contracaoSol, 3) + ' % na solidificação — é esse volume que o massalote precisa repor. O ferro fundido cinzento é o caso especial: a grafita se expande e compensa boa parte da contração, o que permite massalotes menores.' }
        ]);
        return {
          V: { v: r.V, u: 'cm³' },
          A: { v: r.A, u: 'cm²' },
          M: { v: r.M, u: 'cm', classe: 'destaque' },
          t: { v: r.t, u: 'min' },
          Mm: { v: r.Mm, u: 'cm' },
          tm: { v: r.tm, u: 'min' },
          razao: { v: r.razao, u: '', classe: r.razao >= 1.2 ? 'ok' : 'alerta' },
          rend: { v: r.rendimento, u: '%' },
          estado: { v: r.razao >= 1.2 ? 'Massalote adequado' : 'Massalote insuficiente', u: '', classe: r.razao >= 1.2 ? 'ok' : 'alerta' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Laminação
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-laminacao')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var esc = Math.min((a.h - 120) / (p.D + p.t0 * 2), (a.w * 0.5) / (p.D * 1.1));
      var cx = a.x + a.w * 0.32, cy = a.y + a.h * 0.5;
      var R = p.D / 2 * esc;
      var h0 = p.t0 * esc, h1 = p.t1 * esc;
      /* chapa entrando e saindo */
      c.fillStyle = corMetal(0.35);
      c.fillRect(a.x + 10, cy - h0 / 2, cx - a.x - 10, h0);
      c.fillRect(cx, cy - h1 / 2, a.x + a.w * 0.62 - cx, h1);
      c.strokeStyle = cor; c.lineWidth = 1.4;
      c.strokeRect(a.x + 10, cy - h0 / 2, cx - a.x - 10, h0);
      c.strokeRect(cx, cy - h1 / 2, a.x + a.w * 0.62 - cx, h1);
      /* marcas correndo (a saída é mais rápida) */
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
      for (var i = 0; i < 6; i++) {
        var f1 = ((A.t * 0.35 + i / 6) % 1);
        var xa = a.x + 10 + f1 * (cx - a.x - 10);
        c.beginPath(); c.moveTo(xa, cy - h0 / 2); c.lineTo(xa, cy + h0 / 2); c.stroke();
        var f2 = ((A.t * 0.35 * p.t0 / p.t1 + i / 6) % 1);
        var xb = cx + f2 * (a.x + a.w * 0.62 - cx);
        c.beginPath(); c.moveTo(xb, cy - h1 / 2); c.lineTo(xb, cy + h1 / 2); c.stroke();
      }
      /* cilindros */
      [[-1], [1]].forEach(function (s) {
        var yc = cy + s[0] * (R + h1 / 2);
        c.fillStyle = Plot.serie(0); c.globalAlpha = 0.3;
        c.beginPath(); c.arc(cx, yc, R, 0, TAU); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = cor; c.lineWidth = 1.8; c.stroke();
        var an = A.t * 1.4 * (s[0] > 0 ? -1 : 1);
        c.lineWidth = 1.2;
        for (var k = 0; k < 4; k++) {
          var ang = an + k * Math.PI / 2;
          c.beginPath(); c.moveTo(cx, yc); c.lineTo(cx + R * 0.85 * Math.cos(ang), yc + R * 0.85 * Math.sin(ang)); c.stroke();
        }
        /* força de laminação */
        seta(c, cx, yc - s[0] * R * 0.2, cx, cy + s[0] * h1 / 2, 'rgb(220,60,60)', 2.6, 10);
      });
      rotulo(c, 'F = ' + sg(r.F / 1000, 4) + ' kN', cx + R * 0.6, cy - R - 16, 'rgb(220,60,60)', 11.5, '700', 'left');
      rotulo(c, 't₀ = ' + sg(p.t0, 3) + ' mm', a.x + 40, cy - h0 / 2 - 14, cor, 11, '700', 'left');
      rotulo(c, 't₁ = ' + sg(p.t1, 3) + ' mm', a.x + a.w * 0.5, cy + h1 / 2 + 16, cor, 11, '700', 'left');
      rotulo(c, 'v entrada ' + sg(r.v, 3) + ' m/s → saída ' + sg(r.vSaida, 3) + ' m/s', cx, a.y + a.h - 16, faint, 10.5, '600');
      if (!r.possivel) rotulo(c, 'redução acima do máximo: os cilindros patinam e não "pegam" a chapa', cx, a.y + 16, 'rgb(220,60,60)', 11.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.68, ly = a.y + 30;
      var linhas = [
        ['redução', sg(r.d, 3) + ' mm  (' + sg(100 * r.r, 3) + ' %)'],
        ['redução máxima  μ²R', sg(r.dMax, 3) + ' mm'],
        ['comprimento de contato', sg(r.L, 4) + ' mm'],
        ['tensão de escoamento média', sg(r.Ybar, 4) + ' MPa'],
        ['força de laminação', sg(r.F / 1000, 4) + ' kN'],
        ['potência (dois cilindros)', sg(r.P / 1000, 4) + ' kW']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, j === 1 && !r.possivel ? 'rgb(220,60,60)' : cor, 12, '700', 'left');
      });
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('cilindros');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-laminacao', {
      titulo: 'Laminação — redução máxima, força e potência',
      descricao: 'O atrito é quem "morde" a chapa e a puxa para dentro dos cilindros — e é ele também que limita a redução possível em um passe. A força cresce com o comprimento de contato, e por isso cilindros de diâmetro menor reduzem mais com menos força, desde que resistam à flexão.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo clássico', desc: '25 → 22 mm, cilindros de 500 mm', valores: { t0: 25, t1: 22, w: 200, D: 500, mu: 0.12, K: 275, n: 0.15, rpm: 50 } },
        { nome: '2 · Redução acima do limite', desc: 'a chapa não é agarrada', valores: { t0: 25, t1: 20, w: 200, D: 500, mu: 0.12, K: 275, n: 0.15, rpm: 50 } },
        { nome: '3 · Mais atrito', desc: 'cilindros rugosos: maior redução possível', valores: { t0: 25, t1: 20, w: 200, D: 500, mu: 0.25, K: 275, n: 0.15, rpm: 50 } },
        { nome: '4 · Cilindros menores', desc: 'menos contato, menos força', valores: { t0: 25, t1: 22, w: 200, D: 250, mu: 0.12, K: 275, n: 0.15, rpm: 50 } },
        { nome: '5 · Laminação a quente', desc: 'K menor: muito menos força', valores: { t0: 25, t1: 20, w: 200, D: 500, mu: 0.4, K: 120, n: 0.1, rpm: 50 } },
        { nome: '6 · Chapa larga', desc: 'a força cresce proporcionalmente à largura', valores: { t0: 25, t1: 22, w: 1200, D: 500, mu: 0.12, K: 275, n: 0.15, rpm: 50 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Passe' },
        { id: 't0', label: 'Espessura de entrada', min: 1, max: 100, step: 0.5, valor: 25, unidade: 'mm' },
        { id: 't1', label: 'Espessura de saída', min: 0.5, max: 99, step: 0.5, valor: 22, unidade: 'mm' },
        { id: 'w', label: 'Largura da chapa', min: 50, max: 2000, step: 10, valor: 200, unidade: 'mm' },
        { tipo: 'titulo', label: 'Laminador' },
        { id: 'D', label: 'Diâmetro dos cilindros', min: 100, max: 1200, step: 10, valor: 500, unidade: 'mm' },
        { id: 'mu', label: 'Coeficiente de atrito', min: 0.05, max: 0.5, step: 0.01, valor: 0.12, unidade: '', desc: 'a frio 0,1 · a quente 0,2 a 0,5' },
        { id: 'rpm', label: 'Rotação dos cilindros', min: 5, max: 500, step: 5, valor: 50, unidade: 'rpm' },
        { tipo: 'titulo', label: 'Material (curva de escoamento)' },
        { id: 'K', label: 'Coeficiente de resistência K', min: 50, max: 900, step: 5, valor: 275, unidade: 'MPa' },
        { id: 'n', label: 'Expoente de encruamento n', min: 0.02, max: 0.5, step: 0.01, valor: 0.15, unidade: '' }
      ],
      graficos: [
        { id: 'cilindros', axes: false, height: 340, grid: false, legend: false },
        { id: 'forca', titulo: 'Força de laminação × redução', xlabel: 'redução (mm)', ylabel: 'força (kN)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'limite', titulo: 'Redução máxima × atrito e diâmetro', xlabel: 'coeficiente de atrito μ', ylabel: 'redução máxima (mm)', aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'd', label: 'Redução' },
        { id: 'dMax', label: 'Redução máxima' },
        { id: 'L', label: 'Comprimento de contato' },
        { id: 'eps', label: 'Deformação verdadeira' },
        { id: 'Ybar', label: 'Tensão de escoamento média' },
        { id: 'F', label: 'Força de laminação' },
        { id: 'T', label: 'Torque por cilindro' },
        { id: 'P', label: 'Potência' },
        { id: 'estado', label: 'Verificação' }
      ],
      formulas: [
        { g: 'Geometria do passe' },
        { tex: 'd = t_0 - t_1 \\qquad r = \\frac{d}{t_0} \\qquad L = \\sqrt{R\\,d}', d: 'L é o comprimento do arco de contato (projetado)', destaque: true },
        { tex: 'd_{máx} = \\mu^2 R', d: 'acima disso os cilindros patinam e não agarram a chapa', destaque: true },
        { g: 'Força e potência' },
        { tex: '\\bar Y = \\frac{K\\,\\epsilon^n}{1 + n} \\qquad \\epsilon = \\ln\\frac{t_0}{t_1}', d: 'tensão de escoamento média na deformação do passe' },
        { tex: 'F = \\bar Y\\,w\\,L', d: 'força de separação dos cilindros', destaque: true },
        { tex: 'T = \\frac{F L}{2} \\qquad P = 2\\pi N\\,(2T) = 2\\pi N F L', d: 'torque por cilindro e potência dos dois' },
        { g: 'Conservação de volume' },
        { tex: 't_0 v_0 = t_1 v_1', d: 'a chapa sai mais rápido do que entra; existe um ponto neutro onde a velocidade se iguala à do cilindro' }
      ],
      passos: [],
      nota: 'Laminação plana, sem alargamento lateral (chapa larga), atrito uniforme e cilindros rígidos. Reproduz o exemplo clássico do Groover. Na prática a força é maior por causa do achatamento elástico dos cilindros, corrigido pelo fator de Hitchcock.',
      calcular: function (p, ctx) {
        var t1 = Math.min(p.t1, p.t0 - 0.1);
        var r = PF.laminacao({ t0: p.t0, t1: t1, w: p.w, D: p.D, mu: p.mu, K: p.K, n: p.n, rpm: p.rpm });
        A.ctx = ctx; A.p = { t0: p.t0, t1: t1, D: p.D }; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('forca').clear();
        var ds = Plot.linspace(0.1, Math.max(r.dMax * 1.6, r.d * 1.4), 60);
        g.line(ds, ds.map(function (d) {
          return PF.laminacao({ t0: p.t0, t1: p.t0 - d, w: p.w, D: p.D, mu: p.mu, K: p.K, n: p.n, rpm: p.rpm }).F / 1000;
        }), { color: Plot.serie(0), width: 2.6, label: 'força (kN)' });
        g.vline(r.dMax, { color: 'rgb(220,60,60)', dash: [4, 4], text: 'redução máxima' });
        g.marker(r.d, r.F / 1000, 'seu passe', { color: Plot.serie(6), r: 5 });
        g.draw();

        var gl = ctx.plot('limite').clear();
        var mus = Plot.linspace(0.05, 0.5, 50);
        [250, 500, 1000].forEach(function (D, j) {
          gl.line(mus, mus.map(function (mu) { return mu * mu * D / 2; }),
            { color: Plot.serie(j), width: D === p.D ? 2.8 : 1.6, label: 'cilindros de ' + D + ' mm' });
        });
        gl.marker(p.mu, r.dMax, 'seu laminador', { color: 'rgb(220,60,60)', r: 5 });
        gl.setLimits([0.05, 0.5], [0, Math.min(mus[mus.length - 1] * mus[mus.length - 1] * 500, 60)]).draw();

        ctx.setPassos([
          { t: '① Redução e verificação do agarramento',
            tex: 'd = t_0 - t_1 \\qquad d_{máx} = \\mu^2 R',
            texSub: 'd = ' + nt(p.t0, 3) + ' - ' + nt(t1, 3) + ' = ' + nt(r.d, 3) + '\\ mm \\qquad d_{máx} = ' + nt(p.mu, 3) + '^2\\cdot' + nt(r.R, 4) + ' = ' + nt(r.dMax, 4) + '\\ mm',
            r: r.possivel ? 'Passe possível' : 'Redução acima do máximo',
            obs: 'A condição vem do equilíbrio na entrada: o atrito precisa vencer a componente que empurra a chapa para fora. Cilindros maiores ou mais rugosos agarram mais.' },
          { t: '② Deformação e tensão de escoamento média',
            tex: '\\epsilon = \\ln\\frac{t_0}{t_1} \\qquad \\bar Y = \\frac{K\\epsilon^n}{1+n}',
            texSub: '\\epsilon = \\ln\\frac{' + nt(p.t0, 3) + '}{' + nt(t1, 3) + '} = ' + nt(r.eps, 4) + ' \\Rightarrow \\bar Y = \\frac{' + nt(p.K, 4) + '\\cdot' + nt(r.eps, 4) + '^{' + nt(p.n, 3) + '}}{1 + ' + nt(p.n, 3) + '} = ' + nt(r.Ybar, 4) + '\\ MPa',
            obs: 'A laminação a quente trabalha acima da temperatura de recristalização: o material não encrua, K cai muito e a força despenca — por isso as grandes reduções são feitas a quente.' },
          { t: '③ Força de laminação',
            tex: 'L = \\sqrt{R d} \\qquad F = \\bar Y\\,w\\,L',
            texSub: 'L = \\sqrt{' + nt(r.R, 4) + '\\cdot' + nt(r.d, 3) + '} = ' + nt(r.L, 4) + '\\ mm \\Rightarrow F = ' + nt(r.Ybar, 4) + '\\cdot' + nt(p.w, 4) + '\\cdot' + nt(r.L, 4) + ' = ' + nt(r.F / 1000, 5) + '\\ kN',
            obs: 'É a força que tenta separar os cilindros — e que define o dimensionamento da gaiola. Reduzir o diâmetro dos cilindros reduz L e, portanto, a força; daí os laminadores Sendzimir, com cilindros de trabalho finos apoiados por cilindros maiores.' },
          { t: '④ Torque e potência',
            tex: 'T = \\frac{FL}{2} \\qquad P = 2\\pi N F L',
            texSub: 'T = ' + nt(r.T / 1000, 4) + '\\ kN\\cdot m \\Rightarrow P = ' + nt(r.P / 1000, 4) + '\\ kW',
            obs: 'A velocidade de saída (' + sg(r.vSaida, 3) + ' m/s) é maior que a de entrada (' + sg(r.v, 3) + ' m/s) porque o volume se conserva. Entre elas existe o ponto neutro, onde a chapa e o cilindro têm a mesma velocidade.' }
        ]);
        return {
          d: { v: r.d, u: 'mm' },
          dMax: { v: r.dMax, u: 'mm', classe: r.possivel ? 'ok' : 'alerta' },
          L: { v: r.L, u: 'mm' },
          eps: { v: r.eps, u: '' },
          Ybar: { v: r.Ybar, u: 'MPa' },
          F: { v: r.F / 1000, u: 'kN', classe: 'destaque' },
          T: { v: r.T / 1000, u: 'kN·m' },
          P: { v: r.P / 1000, u: 'kW', classe: 'destaque' },
          estado: { v: r.possivel ? 'Passe possível' : 'Os cilindros patinam', u: '', classe: r.possivel ? 'ok' : 'alerta' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Forjamento: recalque com atrito
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-forjamento')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      /* animação: recalca do h0 até h e recomeça */
      var ciclo = 3.2, tt = (A.t % ciclo) / ciclo;
      var hAtual = p.h0 - (p.h0 - p.h) * Math.min(1, tt * 1.25);
      var q = PF.forjamento({ d0: p.d0, h0: p.h0, h: hAtual, K: p.K, n: p.n, mu: p.mu });
      var esc = Math.min((a.w * 0.34) / (q.d * 1.3), (a.h - 130) / (p.h0 * 1.3));
      var cx = a.x + a.w * 0.3, yBase = a.y + a.h * 0.72;
      var hp = hAtual * esc, dp = q.d * esc;
      /* matrizes */
      c.fillStyle = faint; c.globalAlpha = 0.5;
      c.fillRect(cx - dp * 0.8, yBase, dp * 1.6, 16);
      c.fillRect(cx - dp * 0.8, yBase - hp - 16, dp * 1.6, 16);
      c.globalAlpha = 1; c.strokeStyle = cor; c.lineWidth = 1.5;
      c.strokeRect(cx - dp * 0.8, yBase, dp * 1.6, 16);
      c.strokeRect(cx - dp * 0.8, yBase - hp - 16, dp * 1.6, 16);
      /* peça com barrilamento */
      c.fillStyle = corMetal(0.15);
      c.beginPath();
      c.moveTo(cx - dp / 2, yBase);
      c.quadraticCurveTo(cx - dp / 2 - dp * 0.12 * p.mu * 4, yBase - hp / 2, cx - dp / 2, yBase - hp);
      c.lineTo(cx + dp / 2, yBase - hp);
      c.quadraticCurveTo(cx + dp / 2 + dp * 0.12 * p.mu * 4, yBase - hp / 2, cx + dp / 2, yBase);
      c.closePath(); c.fill();
      c.strokeStyle = cor; c.lineWidth = 1.6; c.stroke();
      rotulo(c, 'd = ' + sg(q.d, 4) + ' mm', cx, yBase + 32, cor, 11, '700');
      rotulo(c, 'h = ' + sg(hAtual, 4) + ' mm', cx - dp * 0.8 - 14, yBase - hp / 2, cor, 11, '700', 'right');
      /* força */
      seta(c, cx, yBase - hp - 70, cx, yBase - hp - 20, 'rgb(220,60,60)', 3, 12);
      rotulo(c, 'F = ' + sg(q.F / 1000, 4) + ' kN', cx, yBase - hp - 82, 'rgb(220,60,60)', 12, '700');
      /* colina de atrito */
      var y0 = a.y + 30, alt = 62;
      var escP = alt / Math.max(q.pMax, 1);
      c.strokeStyle = Plot.serie(3); c.lineWidth = 2.2;
      c.beginPath();
      for (var i = 0; i <= 60; i++) {
        var x = -q.d / 2 + q.d * i / 60;
        var pr = q.Yf * Math.exp(2 * p.mu * (q.d / 2 - Math.abs(x)) / hAtual);
        var X = cx + x * esc, Y = y0 + alt - pr * escP;
        if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
      }
      c.stroke();
      c.strokeStyle = faint; c.lineWidth = 1; c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(cx - dp / 2, y0 + alt); c.lineTo(cx + dp / 2, y0 + alt); c.stroke(); c.setLineDash([]);
      rotulo(c, 'colina de atrito: pressão na interface', cx, y0 - 8, Plot.serie(3), 10.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.62, ly = a.y + 40;
      var linhas = [
        ['deformação verdadeira', sg(r.eps, 4)],
        ['tensão de escoamento Yf', sg(r.Yf, 4) + ' MPa'],
        ['fator de forma Kf', sg(r.Kf, 4)],
        ['pressão média', sg(r.pMedia, 4) + ' MPa'],
        ['pressão no centro', sg(r.pMax, 4) + ' MPa'],
        ['força máxima', sg(r.F / 1000, 4) + ' kN'],
        ['trabalho de deformação', sg(r.W / 1000, 4) + ' kJ']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 32, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 32, cor, 12, '700', 'left');
      });
      rotulo(c, 'd/h = ' + sg(r.razao, 3) + ' — quanto maior, mais o atrito pesa', lx, ly + 7 * 32 + 6, Plot.serie(3), 10.5, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('recalque');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-forjamento', {
      titulo: 'Forjamento — recalque, atrito e colina de atrito',
      descricao: 'No recalque, o atrito entre a peça e as matrizes impede o material de escoar livremente para fora: a pressão necessária cresce do bordo para o centro, formando a chamada colina de atrito. Quanto mais achatada a peça (d/h grande), mais o atrito domina — e a força pode superar em muito a que o escoamento sozinho exigiria.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo clássico', desc: 'cilindro 50 × 75 mm recalcado a 36 mm', valores: { d0: 50, h0: 75, h: 36, K: 350, n: 0.17, mu: 0.1 } },
        { nome: '2 · Início do recalque', desc: 'pouca deformação, pouca força', valores: { d0: 50, h0: 75, h: 62, K: 350, n: 0.17, mu: 0.1 } },
        { nome: '3 · Peça bem achatada', desc: 'd/h alto: o atrito domina', valores: { d0: 50, h0: 75, h: 15, K: 350, n: 0.17, mu: 0.1 } },
        { nome: '4 · Sem lubrificação', desc: 'μ = 0,4: colina de atrito acentuada', valores: { d0: 50, h0: 75, h: 36, K: 350, n: 0.17, mu: 0.4 } },
        { nome: '5 · Forjamento a quente', desc: 'K menor: força bem mais baixa', valores: { d0: 50, h0: 75, h: 36, K: 120, n: 0.08, mu: 0.3 } },
        { nome: '6 · Material encruável', desc: 'n alto: a resistência cresce com a deformação', valores: { d0: 50, h0: 75, h: 36, K: 600, n: 0.4, mu: 0.1 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Tarugo cilíndrico' },
        { id: 'd0', label: 'Diâmetro inicial', min: 10, max: 300, step: 1, valor: 50, unidade: 'mm' },
        { id: 'h0', label: 'Altura inicial', min: 10, max: 400, step: 1, valor: 75, unidade: 'mm' },
        { id: 'h', label: 'Altura final', min: 2, max: 399, step: 1, valor: 36, unidade: 'mm' },
        { tipo: 'titulo', label: 'Material e atrito' },
        { id: 'K', label: 'Coeficiente de resistência K', min: 50, max: 900, step: 5, valor: 350, unidade: 'MPa' },
        { id: 'n', label: 'Expoente de encruamento n', min: 0.02, max: 0.5, step: 0.01, valor: 0.17, unidade: '' },
        { id: 'mu', label: 'Coeficiente de atrito', min: 0, max: 0.5, step: 0.01, valor: 0.1, unidade: '', desc: 'lubrificado 0,05 a 0,1 · a quente sem lubrificante até 0,4' }
      ],
      graficos: [
        { id: 'recalque', axes: false, height: 350, grid: false, legend: false },
        { id: 'curvaF', titulo: 'Força ao longo do recalque', xlabel: 'altura da peça (mm)', ylabel: 'força (kN)', aspect: 0.45, legendPos: 'topright' },
        { id: 'pressao', titulo: 'Distribuição de pressão na interface', xlabel: 'posição radial (mm)', ylabel: 'pressão (MPa)', aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'd', label: 'Diâmetro final' },
        { id: 'eps', label: 'Deformação verdadeira' },
        { id: 'Yf', label: 'Tensão de escoamento' },
        { id: 'Kf', label: 'Fator de forma Kf' },
        { id: 'F', label: 'Força necessária' },
        { id: 'pmed', label: 'Pressão média' },
        { id: 'pmax', label: 'Pressão no centro' },
        { id: 'W', label: 'Trabalho de deformação' }
      ],
      formulas: [
        { g: 'Deformação e escoamento' },
        { tex: '\\epsilon = \\ln\\frac{h_0}{h} \\qquad Y_f = K\\epsilon^n', d: 'tensão de escoamento instantânea (curva de escoamento verdadeira)', destaque: true },
        { tex: 'V = \\frac{\\pi d_0^2}{4}h_0 = \\frac{\\pi d^2}{4}h', d: 'volume constante: o diâmetro cresce conforme a altura diminui' },
        { g: 'Força com atrito' },
        { tex: 'F = K_f\\,Y_f\\,A \\qquad K_f = 1 + 0{,}4\\,\\mu\\,\\frac{d}{h}', d: 'o fator de forma cobre o efeito do atrito na interface', destaque: true },
        { tex: 'p(r) = Y_f\\,e^{\\,2\\mu(a - r)/h}', d: 'colina de atrito: a pressão cresce exponencialmente em direção ao centro', destaque: true },
        { g: 'Energia' },
        { tex: 'W = \\int F\\,dh', d: 'trabalho de deformação — define a energia do martelo ou a capacidade da prensa' },
        { tex: 'T_{recristalização} \\approx 0{,}5\\,T_{fusão}', d: 'acima dela o material não encrua: é o forjamento a quente' }
      ],
      passos: [],
      nota: 'Recalque de cilindro entre matrizes planas, com atrito de Coulomb e material que obedece à curva K·εⁿ. Reproduz o exemplo clássico do Groover. O barrilamento mostrado no desenho é ilustrativo; o modelo supõe seção cilíndrica média.',
      calcular: function (p, ctx) {
        var h = Math.min(p.h, p.h0 - 1);
        var r = PF.forjamento({ d0: p.d0, h0: p.h0, h: h, K: p.K, n: p.n, mu: p.mu });
        A.ctx = ctx; A.p = { d0: p.d0, h0: p.h0, h: h, K: p.K, n: p.n, mu: p.mu }; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('curvaF').clear();
        var hs = Plot.linspace(h, p.h0 * 0.995, 60);
        g.line(hs, hs.map(function (hh) {
          return PF.forjamento({ d0: p.d0, h0: p.h0, h: hh, K: p.K, n: p.n, mu: p.mu }).F / 1000;
        }), { color: Plot.serie(0), width: 2.6, label: 'com atrito (μ = ' + sg(p.mu, 3) + ')' });
        g.line(hs, hs.map(function (hh) {
          return PF.forjamento({ d0: p.d0, h0: p.h0, h: hh, K: p.K, n: p.n, mu: 0 }).F / 1000;
        }), { color: Plot.serie(5), width: 1.8, dash: [4, 4], label: 'sem atrito' });
        g.marker(h, r.F / 1000, 'final', { color: 'rgb(220,60,60)', r: 5 });
        g.draw();

        var gp = ctx.plot('pressao').clear();
        var rs = Plot.linspace(-r.d / 2, r.d / 2, 80);
        gp.line(rs, rs.map(function (x) { return r.Yf * Math.exp(2 * p.mu * (r.d / 2 - Math.abs(x)) / h); }),
          { color: Plot.serie(3), width: 2.6, label: 'p(r) com atrito' });
        gp.hline(r.Yf, { color: Plot.serie(5), dash: [4, 4], text: 'Yf (sem atrito)' });
        gp.hline(r.pMedia, { color: Plot.serie(0), dash: [2, 3], text: 'pressão média' });
        gp.draw();

        ctx.setPassos([
          { t: '① Volume constante e geometria final',
            tex: 'V = \\frac{\\pi d_0^2}{4}h_0 \\Rightarrow d = \\sqrt{\\frac{4V}{\\pi h}}',
            texSub: 'V = ' + nt(r.V, 5) + '\\ mm^3 \\Rightarrow d = ' + nt(r.d, 4) + '\\ mm \\quad (d/h = ' + nt(r.razao, 3) + ')',
            obs: 'A área em contato cresce ao longo do recalque, e a força cresce junto — por isso o pico de força ocorre sempre no fim do golpe.' },
          { t: '② Tensão de escoamento',
            tex: '\\epsilon = \\ln\\frac{h_0}{h} \\qquad Y_f = K\\,\\epsilon^n',
            texSub: '\\epsilon = \\ln\\frac{' + nt(p.h0, 3) + '}{' + nt(h, 3) + '} = ' + nt(r.eps, 4) + ' \\Rightarrow Y_f = ' + nt(p.K, 4) + '\\cdot' + nt(r.eps, 4) + '^{' + nt(p.n, 3) + '} = ' + nt(r.Yf, 4) + '\\ MPa',
            obs: 'No forjamento a quente, acima da temperatura de recristalização, o material não encrua: n é praticamente zero e K é muito menor — daí a enorme diferença de força entre forjar a frio e a quente.' },
          { t: '③ Fator de forma e força',
            tex: 'K_f = 1 + 0{,}4\\mu\\frac{d}{h} \\qquad F = K_f Y_f A',
            texSub: 'K_f = 1 + 0{,}4\\cdot' + nt(p.mu, 3) + '\\cdot' + nt(r.razao, 3) + ' = ' + nt(r.Kf, 4) + ' \\Rightarrow F = ' + nt(r.Kf, 4) + '\\cdot' + nt(r.Yf, 4) + '\\cdot' + nt(r.A, 5) + ' = ' + nt(r.F / 1000, 5) + '\\ kN',
            obs: 'Sem atrito a força seria ' + sg(r.Yf * r.A / 1000, 5) + ' kN: o atrito acrescenta ' + sg(100 * (r.Kf - 1), 3) + ' %. Em peças muito achatadas esse acréscimo chega a várias vezes.' },
          { t: '④ Colina de atrito e trabalho',
            tex: 'p(r) = Y_f e^{2\\mu(a-r)/h} \\qquad W = \\int F\\,dh',
            texSub: 'p_{centro} = ' + nt(r.pMax, 4) + '\\ MPa \\quad (\\text{média } ' + nt(r.pMedia, 4) + ') \\qquad W = ' + nt(r.W / 1000, 4) + '\\ kJ',
            obs: 'A pressão no centro pode passar de várias vezes a tensão de escoamento — é o que limita a vida das matrizes. Lubrificar reduz a colina e a força; por isso grafite e vidro são usados como lubrificantes no forjamento a quente.' }
        ]);
        return {
          d: { v: r.d, u: 'mm' },
          eps: { v: r.eps, u: '' },
          Yf: { v: r.Yf, u: 'MPa' },
          Kf: { v: r.Kf, u: '' },
          F: { v: r.F / 1000, u: 'kN', classe: 'destaque' },
          pmed: { v: r.pMedia, u: 'MPa' },
          pmax: { v: r.pMax, u: 'MPa' },
          W: { v: r.W / 1000, u: 'kJ' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Soldagem: aporte térmico, ciclo térmico e pré-aquecimento
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-soldagem')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var x0 = a.x + 40, x1 = a.x + a.w * 0.6, yTopo = a.y + a.h * 0.42;
      var esp = Math.min(p.d * 3.2, a.h * 0.22);
      /* chapa em corte */
      c.fillStyle = faint; c.globalAlpha = 0.3;
      c.fillRect(x0, yTopo, x1 - x0, esp); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.5; c.strokeRect(x0, yTopo, x1 - x0, esp);
      rotulo(c, 'chapa de ' + sg(p.d, 3) + ' mm', (x0 + x1) / 2, yTopo + esp + 20, faint, 10.5, '600');
      /* posição do arco */
      var frac = (A.t * 0.22) % 1;
      var xa = x0 + 20 + frac * (x1 - x0 - 40);
      /* cordão já depositado */
      c.fillStyle = 'rgb(150,150,160)';
      c.fillRect(x0 + 20, yTopo - 5, xa - x0 - 20, 7);
      /* poça de fusão e ZTA */
      var rP = Math.max(6, Math.min(26, r.H * 14));
      var grad = c.createRadialGradient(xa, yTopo, 2, xa, yTopo, rP * 2.4);
      grad.addColorStop(0, 'rgba(255,240,180,0.95)');
      grad.addColorStop(0.25, 'rgba(255,170,60,0.85)');
      grad.addColorStop(0.55, 'rgba(220,90,40,0.5)');
      grad.addColorStop(1, 'rgba(220,90,40,0)');
      c.save();
      c.beginPath(); c.rect(x0, yTopo - 12, x1 - x0, esp + 12); c.clip();
      c.fillStyle = grad;
      c.beginPath(); c.arc(xa, yTopo, rP * 2.4, 0, TAU); c.fill();
      c.restore();
      /* eletrodo e arco */
      c.strokeStyle = Plot.serie(2); c.lineWidth = 5;
      c.beginPath(); c.moveTo(xa, yTopo - 62); c.lineTo(xa, yTopo - 18); c.stroke();
      c.strokeStyle = 'rgba(255,245,200,0.9)'; c.lineWidth = 2;
      for (var i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(xa + (Math.random() - 0.5) * 4, yTopo - 18);
        c.lineTo(xa + (Math.random() - 0.5) * 8, yTopo - 2); c.stroke();
      }
      rotulo(c, r.proc.nome, xa, yTopo - 76, cor, 11, '700');
      seta(c, xa + 26, yTopo - 34, xa + 62, yTopo - 34, Plot.serie(0), 2.2, 9);
      rotulo(c, 'v = ' + sg(p.v, 3) + ' mm/s', xa + 44, yTopo - 48, Plot.serie(0), 10.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.64, ly = a.y + 26;
      var linhas = [
        ['aporte térmico líquido', sg(r.H, 3) + ' kJ/mm  (η = ' + sg(r.eta, 2) + ')'],
        ['regime de fluxo de calor', r.t.tridim ? 'tridimensional (chapa grossa)' : 'bidimensional (chapa fina)'],
        ['espessura de transição', sg(r.t.dTrans, 3) + ' mm'],
        ['tempo de resfriamento t8/5', sg(r.t.t85, 3) + ' s'],
        ['carbono equivalente CE (IIW)', sg(r.ce.CE, 3)],
        ['pré-aquecimento recomendado', r.pa.Tp > 20 ? sg(r.pa.Tp, 3) + ' °C' : 'não necessário']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34,
          j === 5 && r.pa.Tp > 20 ? 'rgb(220,110,40)' : (j === 4 && r.ce.CE > 0.45 ? 'rgb(220,110,40)' : cor), 12, '700', 'left');
      });
      var aviso = r.t.t85 < 5 ? 'resfriamento rápido: risco de martensita e trinca a frio'
        : r.t.t85 > 25 ? 'resfriamento lento: grão grosseiro e perda de tenacidade na ZTA'
        : 'faixa usual para aços C-Mn (5 a 25 s)';
      rotulo(c, aviso, lx, ly + 6 * 34 + 6, r.t.t85 < 5 || r.t.t85 > 25 ? 'rgb(220,110,40)' : 'rgb(60,170,110)', 10.5, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('junta');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-soldagem', {
      titulo: 'Soldagem — aporte térmico, ciclo térmico e pré-aquecimento',
      descricao: 'Toda a metalurgia da soldagem se resume ao ciclo térmico que a junta sofre. O aporte térmico define quanta energia entra por milímetro de cordão, e a espessura da chapa decide se o calor escoa em duas ou em três direções. O resultado é o tempo de resfriamento entre 800 e 500 °C — o t8/5 — que governa a microestrutura da zona afetada pelo calor.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Eletrodo revestido', desc: 'SMAW 150 A, chapa de 10 mm', valores: { processo: 'smaw', V: 25, I: 150, v: 3, d: 10, T0: 20, F2: 1, F3: 1, C: 0.18, Mn: 1.3, Si: 0.3, Cr: 0.1, Mo: 0.02, Ni: 0.1, Cu: 0.2, HD: 5 } },
        { nome: '2 · Aporte alto', desc: 'arco submerso: t8/5 longo', valores: { processo: 'saw', V: 32, I: 600, v: 6, d: 20, T0: 20, F2: 1, F3: 1, C: 0.18, Mn: 1.3, Si: 0.3, Cr: 0.1, Mo: 0.02, Ni: 0.1, Cu: 0.2, HD: 5 } },
        { nome: '3 · Chapa fina', desc: 'fluxo bidimensional de calor', valores: { processo: 'gmaw', V: 24, I: 200, v: 8, d: 4, T0: 20, F2: 1, F3: 1, C: 0.18, Mn: 1.3, Si: 0.3, Cr: 0.1, Mo: 0.02, Ni: 0.1, Cu: 0.2, HD: 5 } },
        { nome: '4 · Aço mais ligado', desc: 'CE alto: pré-aquecimento obrigatório', valores: { processo: 'smaw', V: 25, I: 160, v: 3, d: 30, T0: 20, F2: 1, F3: 1, C: 0.3, Mn: 1.4, Si: 0.3, Cr: 0.9, Mo: 0.2, Ni: 0.3, Cu: 0.2, HD: 5 } },
        { nome: '5 · Com pré-aquecimento', desc: 'o mesmo aço a 200 °C: t8/5 muito maior', valores: { processo: 'smaw', V: 25, I: 160, v: 3, d: 30, T0: 200, F2: 1, F3: 1, C: 0.3, Mn: 1.4, Si: 0.3, Cr: 0.9, Mo: 0.2, Ni: 0.3, Cu: 0.2, HD: 5 } },
        { nome: '6 · TIG em passe de raiz', desc: 'aporte baixo, resfriamento rápido', valores: { processo: 'gtaw', V: 14, I: 120, v: 2, d: 12, T0: 20, F2: 1, F3: 1, C: 0.18, Mn: 1.3, Si: 0.3, Cr: 0.1, Mo: 0.02, Ni: 0.1, Cu: 0.2, HD: 5 } }
      ],
      controles: [
        { id: 'processo', tipo: 'select', label: 'Processo de soldagem', valor: 'smaw',
          opcoes: Object.keys(PF.PROCESSOS).map(function (k) { return { v: k, t: PF.PROCESSOS[k].nome }; }) },
        { id: 'V', label: 'Tensão do arco', min: 8, max: 45, step: 0.5, valor: 25, unidade: 'V' },
        { id: 'I', label: 'Corrente', min: 30, max: 1000, step: 5, valor: 150, unidade: 'A' },
        { id: 'v', label: 'Velocidade de soldagem', min: 0.5, max: 25, step: 0.1, valor: 3, unidade: 'mm/s' },
        { tipo: 'titulo', label: 'Junta' },
        { id: 'd', label: 'Espessura da chapa', min: 1, max: 80, step: 0.5, valor: 10, unidade: 'mm' },
        { id: 'T0', label: 'Temperatura de pré-aquecimento', min: 0, max: 350, step: 5, valor: 20, unidade: '°C' },
        { tipo: 'titulo', label: 'Composição do aço (%)' },
        { id: 'C', label: 'Carbono', min: 0.05, max: 0.6, step: 0.01, valor: 0.18, unidade: '%' },
        { id: 'Mn', label: 'Manganês', min: 0, max: 2, step: 0.05, valor: 1.3, unidade: '%' },
        { id: 'Cr', label: 'Cromo', min: 0, max: 3, step: 0.05, valor: 0.1, unidade: '%' },
        { id: 'Mo', label: 'Molibdênio', min: 0, max: 1, step: 0.01, valor: 0.02, unidade: '%' },
        { id: 'Ni', label: 'Níquel', min: 0, max: 3, step: 0.05, valor: 0.1, unidade: '%' },
        { id: 'HD', label: 'Hidrogênio difusível', min: 1, max: 20, step: 1, valor: 5, unidade: 'ml/100 g', desc: 'eletrodo básico seco ≈ 5 · celulósico ≈ 15' }
      ],
      graficos: [
        { id: 'junta', axes: false, height: 330, grid: false, legend: false },
        { id: 'ciclo', titulo: 'Tempo de resfriamento × aporte térmico', xlabel: 'aporte térmico (kJ/mm)', ylabel: 't8/5 (s)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'ce', titulo: 'Pré-aquecimento × carbono equivalente (CET)', xlabel: 'CET', ylabel: 'temperatura de pré-aquecimento (°C)', aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'H', label: 'Aporte térmico líquido' },
        { id: 'eta', label: 'Rendimento térmico do processo' },
        { id: 'regime', label: 'Fluxo de calor' },
        { id: 'dTrans', label: 'Espessura de transição' },
        { id: 't85', label: 'Tempo t8/5' },
        { id: 'CE', label: 'Carbono equivalente (IIW)' },
        { id: 'CET', label: 'CET (EN 1011-2)' },
        { id: 'Tp', label: 'Pré-aquecimento' },
        { id: 'estado', label: 'Avaliação' }
      ],
      formulas: [
        { g: 'Aporte térmico' },
        { tex: 'H = \\eta\\,\\frac{V\\,I}{v}', d: 'energia por milímetro de cordão; η depende do processo (0,65 no TIG a 0,95 no arco submerso)', destaque: true },
        { g: 'Ciclo térmico (EN 1011-2)' },
        { tex: 't_{8/5} = (6700 - 5T_0)\\,Q\\left(\\frac{1}{500-T_0} - \\frac{1}{800-T_0}\\right)F_3', d: 'fluxo tridimensional — chapa grossa', destaque: true },
        { tex: 't_{8/5} = (4300 - 4{,}3T_0)\\,10^5\\frac{Q^2}{d^2}\\left[\\left(\\frac{1}{500-T_0}\\right)^2 - \\left(\\frac{1}{800-T_0}\\right)^2\\right]F_2', d: 'fluxo bidimensional — chapa fina', destaque: true },
        { tex: '5\\ s < t_{8/5} < 25\\ s', d: 'faixa usual para aços C-Mn: rápido demais forma martensita, lento demais engrossa o grão' },
        { g: 'Soldabilidade' },
        { tex: 'CE_{IIW} = C + \\frac{Mn}{6} + \\frac{Cr+Mo+V}{5} + \\frac{Ni+Cu}{15}', d: 'CE > 0,45 já pede cuidados de pré-aquecimento', destaque: true },
        { tex: 'CET = C + \\frac{Mn+Mo}{10} + \\frac{Cr+Cu}{20} + \\frac{Ni}{40}', d: 'usado no método de pré-aquecimento da EN 1011-2' },
        { tex: 'T_p = 697\\,CET + 160\\tanh\\frac{d}{35} + 62\\,HD^{0,35} + (53\\,CET - 32)Q - 328', d: 'temperatura de pré-aquecimento recomendada' }
      ],
      passos: [],
      nota: 'Fórmulas da EN 1011-2 para aços ferríticos, com fatores de forma F2 e F3 iguais a 1 (deposição sobre chapa). O pré-aquecimento pelo método CET vale para aços C-Mn e de baixa liga, em juntas com restrição moderada. A animação é ilustrativa: não resolve o campo de temperaturas.',
      calcular: function (p, ctx) {
        var ap = PF.aporte({ processo: p.processo, V: p.V, I: p.I, v: p.v });
        var t = PF.t85({ T0: p.T0, Q: ap.H, d: p.d, F2: p.F2 || 1, F3: p.F3 || 1 });
        var comp = { C: p.C, Mn: p.Mn, Si: p.Si || 0.3, Cr: p.Cr, Mo: p.Mo, V: 0, Ni: p.Ni, Cu: p.Cu || 0.2 };
        var ce = PF.carbonoEq(comp);
        var pa = PF.preaquecimento({ CET: ce.CET, d: p.d, HD: p.HD, Q: ap.H });
        var r = { proc: ap.proc, eta: ap.eta, H: ap.H, t: t, ce: ce, pa: pa };
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('ciclo').clear();
        var Qs = Plot.linspace(0.2, Math.max(3, ap.H * 1.6), 60);
        [[p.T0, Plot.serie(0), 'T₀ = ' + sg(p.T0, 3) + ' °C'], [20, Plot.serie(2), 'sem pré-aquecimento'],
         [150, Plot.serie(3), 'pré-aquecido a 150 °C']].forEach(function (q, j) {
          if (j > 0 && q[0] === p.T0) return;
          g.line(Qs, Qs.map(function (Q) { return PF.t85({ T0: q[0], Q: Q, d: p.d, F2: 1, F3: 1 }).t85; }),
            { color: q[1], width: j === 0 ? 2.8 : 1.6, label: q[2] });
        });
        g.area([0, 0, 4, 4], [5, 25, 25, 5], { color: 'rgb(60,170,110)', alpha: 0.1 });
        g.text(Qs[Math.floor(Qs.length * 0.75)], 15, 'faixa usual 5–25 s', { size: 10, align: 'center' });
        g.marker(ap.H, t.t85, 'operação', { color: 'rgb(220,60,60)', r: 5 });
        g.setLimits([0, Qs[Qs.length - 1]], [0, Math.max(40, t.t85 * 1.3)]).draw();

        var gc = ctx.plot('ce').clear();
        var cets = Plot.linspace(0.18, 0.5, 50);
        [10, 25, 50].forEach(function (d, j) {
          gc.line(cets, cets.map(function (x) { return PF.preaquecimento({ CET: x, d: d, HD: p.HD, Q: ap.H }).Tp; }),
            { color: Plot.serie(j), width: Math.abs(d - p.d) < 8 ? 2.8 : 1.6, label: 'chapa de ' + d + ' mm' });
        });
        gc.marker(ce.CET, pa.Tp, 'seu aço', { color: 'rgb(220,60,60)', r: 5 });
        gc.setLimits([0.18, 0.5], [0, 300]).draw();

        var aval = t.t85 < 5 ? 'Resfriamento rápido: risco de martensita'
          : t.t85 > 25 ? 'Resfriamento lento: grão grosseiro na ZTA' : 'Ciclo térmico adequado';
        ctx.setPassos([
          { t: '① Aporte térmico',
            tex: 'H = \\eta\\frac{V I}{v}',
            texSub: 'H = ' + nt(ap.eta, 3) + '\\cdot\\frac{' + nt(p.V, 3) + '\\cdot' + nt(p.I, 4) + '}{' + nt(p.v, 3) + '\\cdot 1000} = ' + nt(ap.H, 4) + '\\ kJ/mm',
            obs: 'O rendimento térmico do processo muda bastante: o TIG perde muito calor por radiação do arco (η ≈ 0,65), enquanto o arco submerso, coberto pelo fluxo, aproveita quase tudo (η ≈ 0,95).' },
          { t: '② Regime de fluxo de calor',
            tex: 'd \\ge d_{transição} \\Rightarrow \\text{tridimensional}',
            texSub: 'd_{transição} = ' + nt(t.dTrans, 4) + '\\ mm \\quad\\text{e a chapa tem } ' + nt(p.d, 3) + '\\ mm',
            r: t.tridim ? 'Fluxo tridimensional (chapa grossa)' : 'Fluxo bidimensional (chapa fina)',
            obs: t.tridim ? 'Na chapa grossa o calor escoa em três direções e o t8/5 não depende da espessura.'
              : 'Na chapa fina o calor só pode escoar no plano: o resfriamento fica bem mais lento e depende fortemente da espessura (1/d²).' },
          { t: '③ Tempo de resfriamento t8/5',
            tex: t.tridim ? 't_{8/5} = (6700 - 5T_0)Q\\left(\\frac{1}{500-T_0} - \\frac{1}{800-T_0}\\right)'
              : 't_{8/5} = (4300 - 4{,}3T_0)10^5\\frac{Q^2}{d^2}\\left[\\left(\\frac{1}{500-T_0}\\right)^2 - \\left(\\frac{1}{800-T_0}\\right)^2\\right]',
            texSub: 't_{8/5} = ' + nt(t.t85, 4) + '\\ s',
            r: aval,
            obs: 'Essa é a faixa de temperatura em que a austenita se transforma. Resfriando depressa forma-se martensita dura e frágil; devagar demais, o grão cresce e a tenacidade cai. Pré-aquecer e aumentar o aporte alongam o t8/5.' },
          { t: '④ Soldabilidade e pré-aquecimento',
            tex: 'CE_{IIW} = C + \\frac{Mn}{6} + \\frac{Cr+Mo+V}{5} + \\frac{Ni+Cu}{15}',
            texSub: 'CE = ' + nt(ce.CE, 4) + ',\\quad CET = ' + nt(ce.CET, 4) + ' \\Rightarrow T_p = ' + nt(pa.Tp, 4) + '\\ ^\\circ C',
            obs: (ce.CE > 0.45 ? 'Com CE acima de 0,45 o aço endurece facilmente na ZTA. ' : 'Com CE abaixo de 0,45 a soldabilidade é boa. ')
              + 'A trinca a frio exige quatro ingredientes simultâneos: microestrutura susceptível (martensita), hidrogênio difusível, tensão de tração e temperatura abaixo de ~150 °C. Pré-aquecer ataca dois deles de uma vez: alonga o t8/5 e dá tempo para o hidrogênio escapar.' }
        ]);
        return {
          H: { v: r.H, u: 'kJ/mm', classe: 'destaque' },
          eta: { v: r.eta, u: '' },
          regime: { v: t.tridim ? 'Tridimensional' : 'Bidimensional', u: '' },
          dTrans: { v: t.dTrans, u: 'mm' },
          t85: { v: t.t85, u: 's', classe: t.t85 < 5 || t.t85 > 25 ? 'alerta' : 'ok' },
          CE: { v: ce.CE, u: '', classe: ce.CE > 0.45 ? 'alerta' : 'ok' },
          CET: { v: ce.CET, u: '' },
          Tp: { v: pa.Tp > 20 ? sg(pa.Tp, 3) + ' °C' : 'não necessário', u: '', classe: pa.Tp > 20 ? 'alerta' : 'ok' },
          estado: { v: aval, u: '', classe: t.t85 < 5 || t.t85 > 25 ? 'alerta' : 'ok' }
        };
      }
    });
  })();
})();

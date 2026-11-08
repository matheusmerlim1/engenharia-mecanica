/* ============================================================
   Simuladores de Processos de Fabricação II
   (polímeros, compósitos e materiais não metálicos)

   1 · Reologia do fundido: lei da potência e janela de processo
   2 · Extrusora monorosca: vazão, pressão e ponto de operação
   3 · Extrusão de filme: soprado e plano
   4 · Injeção: capacidade, fechamento, ciclo e contração
   5 · Compósitos: regra das misturas e escolha do processo

   A biblioteca window.P2 reúne os modelos e as tabelas, e é
   reaproveitada pelas figuras de js/fig/processos-de-fabricacao-2.js.
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim;
  if (!Sim) return;

  var P2 = {};
  var L10 = function (v) { return Math.log(Math.max(v, 1e-300)) / Math.LN10; };
  P2.log10 = L10;
  P2.g = 9.80665;

  /* ---------------------------------------------------------------
     1 · Plastômetro de índice de fluidez (ASTM D1238 / ISO 1133)
     Capilar padrão: D = 2,095 mm, L = 8,000 mm; pistão D = 9,55 mm.
     --------------------------------------------------------------- */
  P2.MFI = {
    Dcap: 2.095e-3, Lcap: 8e-3, Dpist: 9.55e-3,
    cargas: [2.16, 3.8, 5, 10, 21.6]
  };
  P2.MFI.Rcap = P2.MFI.Dcap / 2;
  P2.MFI.Apist = Math.PI * P2.MFI.Dpist * P2.MFI.Dpist / 4;

  /* tensão de cisalhamento na parede do capilar, em Pa */
  P2.tauPlastometro = function (carga) {
    var P = carga * P2.g / P2.MFI.Apist;
    return P * P2.MFI.Rcap / (2 * P2.MFI.Lcap);
  };
  /* do índice de fluidez (g/10 min) à viscosidade aparente (Pa·s) */
  P2.deMFI = function (mfi, rhoMelt, carga) {
    var tau = P2.tauPlastometro(carga == null ? 2.16 : carga);
    var Q = (mfi / 600) / rhoMelt / 1e6;                   /* m³/s */
    var gam = 4 * Q / (Math.PI * Math.pow(P2.MFI.Rcap, 3));
    return { tau: tau, Q: Q, gam: gam, eta: tau / gam };
  };
  /* lei da potência: K a partir de um par (η, γ̇) */
  P2.Kpotencia = function (eta, gam, n) { return eta / Math.pow(gam, n - 1); };
  P2.eta = function (K, n, gam) { return K * Math.pow(Math.max(gam, 1e-6), n - 1); };
  P2.tau = function (K, n, gam) { return K * Math.pow(Math.max(gam, 1e-6), n); };
  /* deslocamento da consistência com a temperatura (Arrhenius) */
  P2.Karrhenius = function (K0, T0, T, Ea) {
    return K0 * Math.exp(Ea / 8.314 * (1 / (T + 273.15) - 1 / (T0 + 273.15)));
  };
  /* correção de Rabinowitsch: γ̇ real / γ̇ aparente na parede */
  P2.rabinowitsch = function (n) { return (3 * n + 1) / (4 * n); };

  /* faixas típicas de taxa de cisalhamento por processo, em 1/s */
  P2.janelas = [
    { id: 'compressao', nome: 'Compressão e calandragem', a: 1, b: 30 },
    { id: 'extrusao', nome: 'Extrusão', a: 50, b: 500 },
    { id: 'sopro', nome: 'Sopro e termoformagem', a: 10, b: 200 },
    { id: 'injecao', nome: 'Injeção', a: 1e3, b: 1e5 }
  ];

  /* ---------------------------------------------------------------
     2 · Polímeros: densidades, térmicas e contração
     ρ em g/cm³ (sólido a 20 °C e fundido), k em W/m·K, cp em J/kg·K
     --------------------------------------------------------------- */
  P2.polimeros = [
    { id: 'ps', nome: 'PS (poliestireno)', rs: 1.05, rm: 0.98, k: 0.15, cp: 1600,
      Tm: 210, Tw: 40, Te: 90, s: 0.005, mfi: 8, n: 0.30, cristalino: false },
    { id: 'abs', nome: 'ABS', rs: 1.05, rm: 0.95, k: 0.18, cp: 1700,
      Tm: 230, Tw: 50, Te: 95, s: 0.006, mfi: 6, n: 0.32, cristalino: false },
    { id: 'pmma', nome: 'PMMA (acrílico)', rs: 1.18, rm: 1.08, k: 0.19, cp: 1500,
      Tm: 230, Tw: 60, Te: 95, s: 0.005, mfi: 3, n: 0.28, cristalino: false },
    { id: 'pc', nome: 'PC (policarbonato)', rs: 1.20, rm: 1.07, k: 0.20, cp: 1500,
      Tm: 290, Tw: 85, Te: 130, s: 0.006, mfi: 10, n: 0.45, cristalino: false },
    { id: 'pvc', nome: 'PVC rígido', rs: 1.40, rm: 1.30, k: 0.17, cp: 1300,
      Tm: 190, Tw: 30, Te: 70, s: 0.004, mfi: 1, n: 0.30, cristalino: false },
    { id: 'pebd', nome: 'PEBD (polietileno de baixa densidade)', rs: 0.922, rm: 0.76, k: 0.25, cp: 2300,
      Tm: 180, Tw: 30, Te: 70, s: 0.020, mfi: 0.3, n: 0.45, cristalino: true },
    { id: 'pead', nome: 'PEAD (polietileno de alta densidade)', rs: 0.955, rm: 0.75, k: 0.25, cp: 2300,
      Tm: 220, Tw: 40, Te: 85, s: 0.022, mfi: 0.7, n: 0.50, cristalino: true },
    { id: 'pp', nome: 'PP (polipropileno)', rs: 0.905, rm: 0.73, k: 0.17, cp: 2100,
      Tm: 230, Tw: 40, Te: 90, s: 0.018, mfi: 12, n: 0.35, cristalino: true },
    { id: 'pa66', nome: 'PA 6.6 (náilon)', rs: 1.14, rm: 0.98, k: 0.24, cp: 2100,
      Tm: 280, Tw: 60, Te: 110, s: 0.015, mfi: 20, n: 0.55, cristalino: true },
    { id: 'pet', nome: 'PET', rs: 1.37, rm: 1.20, k: 0.24, cp: 1500,
      Tm: 275, Tw: 20, Te: 90, s: 0.015, mfi: 25, n: 0.55, cristalino: true }
  ];
  P2.polimero = function (id) {
    for (var i = 0; i < P2.polimeros.length; i++) if (P2.polimeros[i].id === id) return P2.polimeros[i];
    return P2.polimeros[0];
  };
  /* difusividade térmica, m²/s — com ρ do sólido, que é o estado em que a peça esfria */
  P2.alfa = function (p) { return p.k / (p.rs * 1000 * p.cp); };
  /* fator volumétrico: razão entre a massa específica do fundido e a do sólido */
  P2.fv = function (p) { return p.rm / p.rs; };
  /* capacidade de injeção de um material a partir da capacidade em PS */
  P2.capacidadeInjecao = function (p, ciPS) {
    var ps = P2.polimero('ps');
    return ciPS * (p.rs / ps.rs) * (P2.fv(p) / P2.fv(ps));
  };
  /* tempo de resfriamento de uma parede de espessura h (m), 1ª harmônica */
  P2.tempoResfriamento = function (h, al, Tmassa, Tmolde, Text) {
    var r = (4 / Math.PI) * (Tmassa - Tmolde) / (Text - Tmolde);
    if (!(r > 1)) return 0;
    return (h * h / (Math.PI * Math.PI * al)) * Math.log(r);
  };
  /* força de fechamento do curso: FF = A · P · S / 2, em kgf */
  P2.forcaFechamento = function (Acm2, Pkgf, S) { return Acm2 * Pkgf * S / 2; };

  /* ---------------------------------------------------------------
     3 · Extrusora monorosca
     --------------------------------------------------------------- */
  P2.anguloHelice = function (passo, D) { return Math.atan(passo / (Math.PI * D)); };
  /* vazão de arraste, m³/s — N em rev/s, dimensões em m */
  P2.vazaoArraste = function (D, N, H, phi, e) {
    var q = 0.5 * Math.PI * Math.PI * D * D * N * H * Math.sin(phi) * Math.cos(phi);
    var c = e ? Math.max(0.5, 1 - e / (Math.PI * D * Math.sin(phi))) : 1;
    return q * c;
  };
  /* coeficiente de vazão de pressão: Qp = B·ΔP/η */
  P2.coefPressao = function (D, H, phi, Lzona) {
    var Lc = Lzona / Math.sin(phi);
    return Math.PI * D * Math.pow(H, 3) * Math.pow(Math.sin(phi), 2) / (12 * Lc);
  };
  /* condutâncias de matriz: Q = K·ΔP/η */
  P2.Kcapilar = function (R, L, n) { return n * Math.PI * Math.pow(R, 4) / (8 * L); };
  P2.Kfenda = function (W, h, L) { return W * Math.pow(h, 3) / (12 * L); };
  P2.Kanel = function (Dm, h, L) { return Math.PI * Dm * Math.pow(h, 3) / (12 * L); };
  /* taxas de cisalhamento */
  P2.gamCanal = function (D, N, H) { return Math.PI * D * N / H; };
  P2.gamFenda = function (Q, W, h) { return 6 * Q / (W * h * h); };
  P2.gamAnel = function (Q, Dm, h) { return 6 * Q / (Math.PI * Dm * h * h); };
  P2.gamCapilar = function (Q, R, n) { return 4 * (Q / n) / (Math.PI * Math.pow(R, 3)); };

  /* ---------------------------------------------------------------
     4 · Filme: balanço de massa
     --------------------------------------------------------------- */
  P2.filmeSoprado = function (mdot, rho, Dd, h, bur, v) {
    var Q = mdot / 3600 / rho;                    /* m³/s, rho em kg/m³ */
    var Df = Dd * bur;
    var vdie = Q / (Math.PI * Dd * h);
    var t = Q / (Math.PI * Df * v);
    return { Q: Q, Df: Df, vdie: vdie, ddr: v / vdie, t: t,
      layflat: Math.PI * Df / 2, gram: rho * t, gam: P2.gamAnel(Q, Dd, h) };
  };
  P2.filmePlano = function (mdot, rho, W, h, v) {
    var Q = mdot / 3600 / rho;
    var vdie = Q / (W * h);
    var t = Q / (W * v);
    return { Q: Q, vdie: vdie, ddr: v / vdie, t: t, gram: rho * t, gam: P2.gamFenda(Q, W, h) };
  };

  /* ---------------------------------------------------------------
     5 · Compósitos: regra das misturas
     --------------------------------------------------------------- */
  P2.fibras = [
    { id: 'vidroe', nome: 'Fibra de vidro E', rho: 2.54, E: 73, G: 30, nu: 0.22, sig: 2400 },
    { id: 'vidros', nome: 'Fibra de vidro S', rho: 2.49, E: 86, G: 35, nu: 0.22, sig: 4400 },
    { id: 'carbonoalta', nome: 'Carbono (alta resistência)', rho: 1.80, E: 230, G: 15, nu: 0.30, sig: 3500 },
    { id: 'carbonomod', nome: 'Carbono (alto módulo)', rho: 1.90, E: 390, G: 20, nu: 0.30, sig: 2500 },
    { id: 'aramida', nome: 'Aramida', rho: 1.45, E: 124, G: 3, nu: 0.34, sig: 3600 }
  ];
  P2.matrizes = [
    { id: 'poliester', nome: 'Poliéster insaturado', rho: 1.20, E: 3.5, G: 1.3, nu: 0.35, sig: 60 },
    { id: 'epoxi', nome: 'Epóxi', rho: 1.20, E: 3.6, G: 1.3, nu: 0.35, sig: 80 },
    { id: 'vinilester', nome: 'Viniléster', rho: 1.15, E: 3.4, G: 1.2, nu: 0.35, sig: 75 },
    { id: 'pp', nome: 'PP (matriz termoplástica)', rho: 0.905, E: 1.5, G: 0.55, nu: 0.40, sig: 33 },
    { id: 'pa66', nome: 'PA 6.6 (matriz termoplástica)', rho: 1.14, E: 3.0, G: 1.1, nu: 0.39, sig: 80 }
  ];
  P2.acha = function (lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return lista[0];
  };
  /* fração volumétrica a partir da fração em massa */
  P2.volDeMassa = function (Wf, rf, rm) { return (Wf / rf) / (Wf / rf + (1 - Wf) / rm); };
  P2.massaDeVol = function (Vf, rf, rm) { return Vf * rf / (Vf * rf + (1 - Vf) * rm); };
  P2.lamina = function (fib, mat, Vf) {
    var Vm = 1 - Vf;
    return {
      Vf: Vf, Wf: P2.massaDeVol(Vf, fib.rho, mat.rho),
      rho: fib.rho * Vf + mat.rho * Vm,
      E1: fib.E * Vf + mat.E * Vm,
      E2: 1 / (Vf / fib.E + Vm / mat.E),
      G12: 1 / (Vf / fib.G + Vm / mat.G),
      nu12: fib.nu * Vf + mat.nu * Vm,
      sig1: fib.sig * Vf + mat.sig * Vm
    };
  };
  /* módulo fora do eixo, em GPa (θ em graus) */
  P2.Ex = function (lam, th) {
    var t = th * Math.PI / 180;
    var c = Math.cos(t), s = Math.sin(t);
    var d = Math.pow(c, 4) / lam.E1 + Math.pow(s, 4) / lam.E2 +
      (1 / lam.G12 - 2 * lam.nu12 / lam.E1) * Math.pow(s * c, 2);
    return 1 / d;
  };
  P2.processosComp = [
    { id: 'manual', nome: 'Laminação manual (hand lay-up)', wf: 0.25, serie: '< 1000 peças/ano' },
    { id: 'projecao', nome: 'Moldagem por projeção (spray-up)', wf: 0.15, serie: 'até 1000 peças/ano' },
    { id: 'vacuo', nome: 'Moldagem a vácuo / infusão', wf: 0.60, serie: '500 a 5000 peças/ano' },
    { id: 'rtm', nome: 'RTM', wf: 0.45, serie: 'séries médias' },
    { id: 'compressao', nome: 'Compressão a quente (SMC/BMC)', wf: 0.35, serie: '15 a 30 peças/h' },
    { id: 'autoclave', nome: 'Autoclave (pré-impregnado)', wf: 0.65, serie: 'pequenas séries' },
    { id: 'enrolamento', nome: 'Enrolamento filamentar', wf: 0.70, serie: 'peças de revolução' },
    { id: 'pultrusao', nome: 'Pultrusão', wf: 0.65, serie: 'contínua, 0,5 a 2 m/min' }
  ];

  global.P2 = P2;

  var Plot = global.Plot;
  function sg(v, n) { return Plot ? Plot.sig(v, n || 4) : v; }
  function nt(v, n) { return String(sg(v, n)).replace('.', ','); }
  function cor(i) { return Plot.serie(i); }

  /* =========================================================================
     1 · Reologia do fundido
     ========================================================================= */
  function montarReologia() {
    if (!document.getElementById('sim-reologia')) return;
    Sim.build('#sim-reologia', {
      titulo: '1. Reologia do fundido — do índice de fluidez à lei da potência',
      descricao: 'O ensaio de índice de fluidez entrega um ponto da curva de viscosidade; o expoente da lei da potência entrega o resto dela. Com os dois, dá para estimar a viscosidade na taxa de cisalhamento de cada processo — que é o número que decide pressão, torque e aquecimento viscoso.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · PEBD de filme', desc: 'MFI baixo, fundido forte: o caso do filme soprado',
          valores: { mfi: 0.3, n: 0.45, carga: 2.16, rho: 0.76, T: 190, Tref: 190, Ea: 50, gam: 150 } },
        { nome: '2 · PP de injeção', desc: 'MFI alto para preencher cavidades finas',
          valores: { mfi: 12, n: 0.35, carga: 2.16, rho: 0.73, T: 230, Tref: 190, Ea: 45, gam: 10000 } },
        { nome: '3 · PP de extrusão', desc: 'Mesma resina-base, grade mais viscoso',
          valores: { mfi: 3, n: 0.38, carga: 2.16, rho: 0.73, T: 210, Tref: 190, Ea: 45, gam: 200 } },
        { nome: '4 · As duas resinas da prática', desc: 'MFI 1,65 contra MFI 12 na mesma taxa',
          valores: { mfi: 1.65, n: 0.45, carga: 2.16, rho: 0.76, T: 190, Tref: 190, Ea: 50, gam: 100 } },
        { nome: '5 · PS de termoformagem', desc: 'Muito pseudoplástico, n baixo',
          valores: { mfi: 8, n: 0.28, carga: 5, rho: 0.98, T: 200, Tref: 200, Ea: 90, gam: 50 } },
        { nome: '6 · Bico de impressora 3D', desc: 'Taxa alta num canal de 0,4 mm',
          valores: { mfi: 8, n: 0.35, carga: 2.16, rho: 1.1, T: 210, Tref: 190, Ea: 60, gam: 860 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'O ensaio de índice de fluidez' },
        { id: 'mfi', label: 'Índice de fluidez (MFI)', min: 0.1, max: 50, step: 0.05, valor: 0.3, unidade: 'g/10 min' },
        { id: 'carga', tipo: 'select', label: 'Carga do plastômetro', valor: 2.16,
          opcoes: P2.MFI.cargas.map(function (c) { return { v: c, t: c + ' kg' }; }) },
        { id: 'rho', label: 'Massa específica do fundido', min: 0.6, max: 1.4, step: 0.01, valor: 0.76, unidade: 'g/cm³' },
        { tipo: 'titulo', label: 'A curva de viscosidade' },
        { id: 'n', label: 'Índice de pseudoplasticidade n', min: 0.15, max: 1, step: 0.01, valor: 0.45 },
        { id: 'Tref', label: 'Temperatura do ensaio', min: 150, max: 300, step: 5, valor: 190, unidade: '°C' },
        { id: 'T', label: 'Temperatura de processo', min: 150, max: 320, step: 5, valor: 190, unidade: '°C' },
        { id: 'Ea', label: 'Energia de ativação do escoamento', min: 20, max: 120, step: 1, valor: 50, unidade: 'kJ/mol' },
        { tipo: 'titulo', label: 'Ponto de interesse' },
        { id: 'gam', label: 'Taxa de cisalhamento', min: 0.1, max: 100000, step: 0.1, valor: 150, unidade: '1/s' }
      ],
      graficos: [
        { id: 'curva', titulo: 'Viscosidade × taxa de cisalhamento', xlabel: 'Taxa de cisalhamento (1/s)',
          ylabel: 'Viscosidade (Pa·s)', xlog: true, ylog: true, aspect: 0.52, legendPos: 'bottomleft' },
        { id: 'tensao', titulo: 'Tensão de cisalhamento × taxa', xlabel: 'Taxa de cisalhamento (1/s)',
          ylabel: 'Tensão (kPa)', xlog: true, aspect: 0.38, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'tau', label: 'Tensão na parede do capilar' },
        { id: 'gamE', label: 'Taxa no capilar do ensaio' },
        { id: 'etaE', label: 'Viscosidade do ensaio' },
        { id: 'K', label: 'Consistência K (na temperatura de processo)' },
        { id: 'etaP', label: 'Viscosidade na taxa escolhida' },
        { id: 'tauP', label: 'Tensão na taxa escolhida' },
        { id: 'queda', label: 'Queda de viscosidade do ensaio até a taxa' },
        { id: 'proc', label: 'Processo compatível' }
      ],
      formulas: [
        { g: 'Do ensaio à viscosidade' },
        { tex: '\\tau_w = \\frac{F/A_{pist}\\,R}{2L}', d: 'tensão na parede do capilar padrão', destaque: true },
        { tex: '\\dot\\gamma_{ap} = \\frac{4Q}{\\pi R^3}, \\qquad Q = \\frac{MFI/600}{\\rho_{fund}}',
          d: 'vazão do ensaio e taxa aparente', destaque: true },
        { tex: '\\eta_{ap} = \\tau_w / \\dot\\gamma_{ap}', d: 'um ponto da curva de viscosidade' },
        { g: 'Lei da potência' },
        { tex: '\\tau = K\\,\\dot\\gamma^{\\,n} \\qquad \\eta = K\\,\\dot\\gamma^{\\,n-1}',
          d: 'n < 1 pseudoplástico, n = 1 newtoniano, n > 1 dilatante', destaque: true },
        { tex: 'K(T) = K_0 \\exp\\!\\left[\\frac{E_a}{R}\\!\\left(\\frac{1}{T}-\\frac{1}{T_0}\\right)\\right]',
          d: 'deslocamento da curva com a temperatura' },
        { tex: '\\dot\\gamma_{real} = \\frac{3n+1}{4n}\\,\\dot\\gamma_{ap}', d: 'correção de Rabinowitsch' }
      ],
      nota: 'O plastômetro é um reômetro de um único ponto: ele mede a vazão sob uma tensão fixa, e não a curva inteira. Para programar extrusão ou injeção com segurança, o ponto do MFI precisa ser estendido pela lei da potência — ou medido num reômetro capilar (ASTM D3835).',
      calcular: function (p, ctx) {
        var e = P2.deMFI(p.mfi, p.rho, +p.carga);
        var K0 = P2.Kpotencia(e.eta, e.gam, p.n);
        var K = P2.Karrhenius(K0, p.Tref, p.T, p.Ea * 1000);
        var etaP = P2.eta(K, p.n, p.gam);
        var tauP = P2.tau(K, p.n, p.gam);

        /* curva de viscosidade em três temperaturas */
        var g = ctx.plot('curva').clear();
        var Ts = [p.Tref, p.T, p.T + 30];
        var xs = [], i, j, gg;
        for (i = 0; i <= 120; i++) xs.push(-1 + 6 * i / 120);     /* log10 de 0,1 a 1e5 */
        Ts.forEach(function (T, idx) {
          var Kt = P2.Karrhenius(K0, p.Tref, T, p.Ea * 1000);
          var ys = xs.map(function (lx) { return L10(P2.eta(Kt, p.n, Math.pow(10, lx))); });
          g.line(xs, ys, { color: cor(idx), width: idx === 1 ? 2.6 : 1.5,
            dash: idx === 1 ? null : [6, 4], label: nt(T, 3) + ' °C' });
        });
        /* janelas de processo: rótulo dentro do gráfico, fora da legenda */
        [P2.janelas[0], P2.janelas[1], P2.janelas[3]].forEach(function (w, idx) {
          g.vline(L10(Math.sqrt(w.a * w.b)), { color: cor(4 + idx), width: 1.1, dash: [3, 3], text: w.nome });
        });
        g.marker(L10(e.gam), L10(e.eta), 'ensaio: ' + nt(e.eta, 3) + ' Pa·s', { color: cor(3) });
        g.marker(L10(p.gam), L10(etaP), nt(etaP, 3) + ' Pa·s', { color: cor(2) });
        g.draw();

        /* tensão × taxa */
        var h = ctx.plot('tensao').clear();
        var ys2 = xs.map(function (lx) { return P2.tau(K, p.n, Math.pow(10, lx)) / 1000; });
        h.line(xs, ys2, { color: cor(0), width: 2.4, label: 'τ = K γ̇ⁿ' });
        var ysN = xs.map(function (lx) { return etaP * Math.pow(10, lx) / 1000; });
        h.line(xs, ysN, { color: cor(5), width: 1.4, dash: [6, 4], label: 'se fosse newtoniano com a mesma η' });
        h.hline(140, { color: cor(3), width: 1.2, text: 'fratura do fundido ≈ 140 kPa' });
        h.marker(L10(p.gam), tauP / 1000, nt(tauP / 1000, 3) + ' kPa', { color: cor(2) });
        h.setLimits(null, [0, Math.max(200, tauP / 1000 * 1.4)]);
        h.draw();

        var proc = 'fora das faixas usuais';
        for (i = 0; i < P2.janelas.length; i++) {
          if (p.gam >= P2.janelas[i].a && p.gam <= P2.janelas[i].b) { proc = P2.janelas[i].nome; break; }
        }

        ctx.setPassos([
          { t: '① A tensão que o plastômetro aplica',
            tex: '\\tau_w = \\frac{' + nt(p.carga, 3) + '\\times 9{,}807 / ' +
              nt(P2.MFI.Apist * 1e4, 4) + '\\times 10^{-4}\\;\\cdot\\;' + nt(P2.MFI.Rcap * 1000, 4) + '}{2\\times 8{,}0}',
            r: 'τ_w = ' + nt(e.tau / 1000, 4) + ' kPa',
            obs: 'A carga e o capilar são padronizados, então a tensão é sempre a mesma: ' +
              nt(P2.tauPlastometro(2.16) / 1000, 3) + ' kPa com 2,16 kg. O ensaio mede a vazão sob tensão fixa, não a viscosidade sob taxa fixa.' },
          { t: '② A vazão e a taxa de cisalhamento do ensaio',
            tex: 'Q = \\frac{' + nt(p.mfi, 3) + '/600}{' + nt(p.rho, 3) + '} = ' +
              nt(e.Q * 1e9, 4) + '\\ \\text{mm}^3/\\text{s}',
            texSub: '\\dot\\gamma_{ap} = \\frac{4Q}{\\pi R^3} = ' + nt(e.gam, 4) + '\\ \\text{s}^{-1}',
            obs: 'A taxa do ensaio é baixíssima: da ordem de 1 a 50 s⁻¹. Nenhum processo industrial trabalha aí — por isso o MFI, sozinho, não serve para dimensionar matriz nem molde.' },
          { t: '③ A viscosidade aparente e a consistência K',
            tex: '\\eta_{ap} = \\tau_w/\\dot\\gamma_{ap} = ' + nt(e.eta, 4) + '\\ \\text{Pa·s}',
            texSub: 'K = \\eta_{ap}\\,\\dot\\gamma_{ap}^{\\,1-n} = ' + nt(K0, 4) + '\\ \\text{Pa·s}^n' +
              (Math.abs(p.T - p.Tref) > 0.5 ? '\\;\\to\\; ' + nt(K, 4) + '\\ \\text{a}\\ ' + nt(p.T, 3) + '\\,^\\circ\\text{C}' : ''),
            obs: 'Com K e n a curva inteira fica definida. Subir a temperatura desloca a curva para baixo sem mudar a inclinação: ' +
              (Math.abs(p.T - p.Tref) > 0.5
                ? 'de ' + nt(p.Tref, 3) + ' para ' + nt(p.T, 3) + ' °C, K cai ' + nt((1 - K / K0) * 100, 3) + ' %.'
                : 'experimente mudar a temperatura de processo.') },
          { t: '④ A viscosidade onde o processo acontece',
            tex: '\\eta = K\\,\\dot\\gamma^{\\,n-1} = ' + nt(K, 4) + '\\times ' + nt(p.gam, 4) +
              '^{\\,' + nt(p.n - 1, 3) + '} = ' + nt(etaP, 4) + '\\ \\text{Pa·s}',
            obs: 'Da taxa do ensaio até ' + nt(p.gam, 4) + ' s⁻¹ a viscosidade cai por um fator de ' +
              nt(e.eta / etaP, 3) + '. É esse ganho que torna o processo possível: a mesma resina que parece sólida no funil escoa como mel na matriz.' },
          { t: '⑤ A tensão correspondente',
            tex: '\\tau = K\\,\\dot\\gamma^{\\,n} = ' + nt(tauP / 1000, 4) + '\\ \\text{kPa}',
            obs: tauP > 1.4e5
              ? 'Acima de cerca de 140 kPa começa a fratura do fundido: a massa não consegue mais se deformar viscosamente e trinca. Reduza a taxa ou suba a temperatura.'
              : 'Abaixo do limiar usual de fratura do fundido (≈ 140 kPa). Margem de ' + nt(140 - tauP / 1000, 3) + ' kPa.' }
        ]);

        return {
          tau: { v: sg(e.tau / 1000, 4), u: 'kPa' },
          gamE: { v: sg(e.gam, 3), u: '1/s' },
          etaE: { v: sg(e.eta, 4), u: 'Pa·s' },
          K: { v: sg(K, 4), u: 'Pa·sⁿ' },
          etaP: { v: sg(etaP, 4), u: 'Pa·s' },
          tauP: { v: sg(tauP / 1000, 4), u: 'kPa', classe: tauP > 1.4e5 ? 'alerta' : 'ok' },
          queda: { v: sg(e.eta / etaP, 3), u: '×' },
          proc: { v: proc }
        };
      }
    });
  }

  /* =========================================================================
     2 · Extrusora monorosca
     ========================================================================= */
  function montarExtrusora() {
    if (!document.getElementById('sim-extrusora')) return;
    Sim.build('#sim-extrusora', {
      titulo: '2. Extrusora monorosca — vazão de arraste, matriz e ponto de operação',
      descricao: 'A rosca empurra (vazão de arraste, proporcional à rotação) e a matriz resiste (vazão de pressão, proporcional à pressão). O ponto de operação é onde as duas curvas se cruzam: é ele que fixa a produção, a pressão na matriz e a força axial na rosca.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Tubo de PEAD', desc: 'Matriz anular: o caso-escola',
          valores: { D: 45, rpm: 90, hi: 5.4, hf: 2.25, Ldos: 10, e: 4.5, rho: 750,
            mfi: 0.7, n: 0.5, matriz: 'anel', Dm: 50, gap: 2, Lm: 30, R: 1.5, nfuros: 20, W: 400 } },
        { nome: '2 · Filme soprado de PEBD', desc: 'Anel de 1,2 mm: pressão alta',
          valores: { D: 45, rpm: 90, hi: 5.4, hf: 2.25, Ldos: 10, e: 4.5, rho: 760,
            mfi: 0.3, n: 0.45, matriz: 'anel', Dm: 100, gap: 1.2, Lm: 30, R: 1.5, nfuros: 20, W: 400 } },
        { nome: '3 · Chapa de PS', desc: 'Matriz de fenda larga',
          valores: { D: 45, rpm: 60, hi: 5.4, hf: 2.25, Ldos: 10, e: 4.5, rho: 980,
            mfi: 8, n: 0.3, matriz: 'fenda', Dm: 50, gap: 2, Lm: 40, R: 1.5, nfuros: 20, W: 400 } },
        { nome: '4 · Pelotização', desc: 'Vinte capilares: a matriz do laboratório',
          valores: { D: 45, rpm: 120, hi: 5.4, hf: 2.25, Ldos: 10, e: 4.5, rho: 760,
            mfi: 2, n: 0.4, matriz: 'capilar', Dm: 50, gap: 2, Lm: 20, R: 1.5, nfuros: 20, W: 400 } },
        { nome: '5 · Canal de dosagem fundo', desc: 'hf = 6 mm: a vazão passa a depender da matriz',
          valores: { D: 45, rpm: 90, hi: 9, hf: 6, Ldos: 10, e: 4.5, rho: 750,
            mfi: 0.7, n: 0.5, matriz: 'anel', Dm: 50, gap: 2, Lm: 30, R: 1.5, nfuros: 20, W: 400 } },
        { nome: '6 · Extrusora de 90 mm', desc: 'Dobrar o diâmetro quadruplica a produção',
          valores: { D: 90, rpm: 60, hi: 10.8, hf: 4.5, Ldos: 10, e: 9, rho: 750,
            mfi: 0.7, n: 0.5, matriz: 'anel', Dm: 110, gap: 3, Lm: 40, R: 1.5, nfuros: 20, W: 400 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Rosca (passo quadrado, p = D)' },
        { id: 'D', label: 'Diâmetro da rosca', min: 20, max: 165, step: 1, valor: 45, unidade: 'mm' },
        { id: 'rpm', label: 'Rotação', min: 10, max: 250, step: 1, valor: 90, unidade: 'rpm' },
        { id: 'hi', label: 'Altura do canal na alimentação (hi)', min: 2, max: 25, step: 0.1, valor: 5.4, unidade: 'mm' },
        { id: 'hf', label: 'Altura do canal na dosagem (hf)', min: 0.8, max: 12, step: 0.05, valor: 2.25, unidade: 'mm' },
        { id: 'Ldos', label: 'Comprimento da zona de dosagem', min: 4, max: 16, step: 0.5, valor: 10, unidade: 'D' },
        { id: 'e', label: 'Largura do filete no topo', min: 1, max: 20, step: 0.1, valor: 4.5, unidade: 'mm' },
        { tipo: 'titulo', label: 'Resina' },
        { id: 'mfi', label: 'Índice de fluidez', min: 0.1, max: 30, step: 0.05, valor: 0.7, unidade: 'g/10 min' },
        { id: 'n', label: 'Índice de pseudoplasticidade n', min: 0.2, max: 1, step: 0.01, valor: 0.5 },
        { id: 'rho', label: 'Massa específica do fundido', min: 600, max: 1400, step: 10, valor: 750, unidade: 'kg/m³' },
        { tipo: 'titulo', label: 'Matriz' },
        { id: 'matriz', tipo: 'seg', label: 'Tipo', valor: 'anel',
          opcoes: [{ v: 'anel', t: 'Anular' }, { v: 'fenda', t: 'Fenda' }, { v: 'capilar', t: 'Capilares' }] },
        { id: 'Dm', label: 'Diâmetro médio do anel', min: 20, max: 300, step: 1, valor: 50, unidade: 'mm' },
        { id: 'gap', label: 'Abertura do anel ou da fenda', min: 0.3, max: 8, step: 0.05, valor: 2, unidade: 'mm' },
        { id: 'W', label: 'Largura da fenda', min: 100, max: 2000, step: 10, valor: 400, unidade: 'mm' },
        { id: 'R', label: 'Raio de cada capilar', min: 0.5, max: 5, step: 0.05, valor: 1.5, unidade: 'mm' },
        { id: 'nfuros', label: 'Número de capilares', min: 1, max: 200, step: 1, valor: 20 },
        { id: 'Lm', label: 'Comprimento do paralelo', min: 5, max: 120, step: 1, valor: 30, unidade: 'mm' }
      ],
      graficos: [
        { id: 'carac', titulo: 'Curvas características: rosca e matriz', xlabel: 'Pressão na matriz (MPa)',
          ylabel: 'Vazão (kg/h)', aspect: 0.5, legendPos: 'topright' },
        { id: 'rot', titulo: 'Produção e pressão × rotação', xlabel: 'Rotação (rpm)',
          ylabel: 'Produção (kg/h)', aspect: 0.38, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'rc', label: 'Razão de compressão' },
        { id: 'qd', label: 'Vazão de arraste' },
        { id: 'q', label: 'Produção no ponto de operação' },
        { id: 'dp', label: 'Pressão na matriz' },
        { id: 'qp', label: 'Perda por vazão de pressão' },
        { id: 'gamc', label: 'Taxa de cisalhamento no canal' },
        { id: 'gamm', label: 'Taxa de cisalhamento na matriz' },
        { id: 'etam', label: 'Viscosidade na matriz' },
        { id: 'forca', label: 'Força axial na rosca' },
        { id: 'tres', label: 'Tempo de residência na dosagem' }
      ],
      formulas: [
        { g: 'Geometria' },
        { tex: '\\tan\\varphi = \\frac{p}{\\pi D} \\;\\Rightarrow\\; \\varphi = 17{,}66^\\circ \\ (p = D)',
          d: 'ângulo de hélice do passo quadrado' },
        { tex: 'RC = h_i/h_f', d: 'razão de compressão: 1,1:1 a 5:1, típica 2,25:1' },
        { g: 'Vazão' },
        { tex: 'Q_d = \\tfrac{1}{2}\\pi^2 D^2 N H \\sin\\varphi\\cos\\varphi',
          d: 'arraste: proporcional à rotação', destaque: true },
        { tex: 'Q_p = \\frac{\\pi D H^3 \\sin^2\\!\\varphi}{12\\,\\eta\\,L_c}\\,\\Delta P',
          d: 'contrafluxo de pressão: proporcional a H³', destaque: true },
        { tex: 'Q = Q_d - Q_p = \\frac{K_{matriz}}{\\eta_m}\\Delta P', d: 'ponto de operação' },
        { g: 'Matrizes' },
        { tex: 'K_{anel} = \\frac{\\pi D_m h^3}{12 L}, \\quad K_{fenda} = \\frac{W h^3}{12 L}, \\quad K_{cap} = \\frac{n\\pi R^4}{8 L}',
          d: 'condutância hidráulica de cada geometria' },
        { tex: 'F = \\Delta P\\,\\frac{\\pi D^2}{4}', d: 'força que empurra a rosca para trás' }
      ],
      nota: 'O modelo é isotérmico e usa a viscosidade da lei da potência avaliada na taxa de cada região. Ele mostra bem a física dominante: com canal de dosagem raso, a rosca é quase uma bomba de deslocamento positivo — quem fixa a pressão é a matriz. Vazamento pela folga do filete e aquecimento viscoso não entram na conta.',
      calcular: function (p, ctx) {
        var D = p.D / 1000, N = p.rpm / 60, hf = p.hf / 1000, hi = p.hi / 1000;
        var phi = P2.anguloHelice(D, D);
        var Lz = p.Ldos * D;
        var Qd = P2.vazaoArraste(D, N, hf, phi, p.e / 1000);
        var B = P2.coefPressao(D, hf, phi, Lz);

        /* viscosidades: lei da potência ancorada no MFI */
        var ens = P2.deMFI(p.mfi, p.rho / 1000, 2.16);
        var K = P2.Kpotencia(ens.eta, ens.gam, p.n);
        var gamC = P2.gamCanal(D, N, hf);
        var etaC = P2.eta(K, p.n, gamC);

        var Km, gamM;
        function geoMatriz(Q) {
          if (p.matriz === 'fenda') return P2.gamFenda(Q, p.W / 1000, p.gap / 1000);
          if (p.matriz === 'capilar') return P2.gamCapilar(Q, p.R / 1000, Math.round(p.nfuros));
          return P2.gamAnel(Q, p.Dm / 1000, p.gap / 1000);
        }
        if (p.matriz === 'fenda') Km = P2.Kfenda(p.W / 1000, p.gap / 1000, p.Lm / 1000);
        else if (p.matriz === 'capilar') Km = P2.Kcapilar(p.R / 1000, p.Lm / 1000, Math.round(p.nfuros));
        else Km = P2.Kanel(p.Dm / 1000, p.gap / 1000, p.Lm / 1000);

        /* ponto de operação: itera porque a viscosidade da matriz depende da vazão */
        var Q = Qd, etaM = etaC, dP = 0, i;
        for (i = 0; i < 40; i++) {
          gamM = geoMatriz(Math.max(Q, 1e-9));
          etaM = P2.eta(K, p.n, gamM);
          dP = Qd / (Km / etaM + B / etaC);
          Q = Km * dP / etaM;
        }
        var Qp = Qd - Q;
        var kgh = function (q) { return q * p.rho * 3600; };
        var forca = dP * Math.PI * D * D / 4;
        var volDos = Math.PI * D * hf * 0.5 * (Lz / Math.sin(phi));
        var tres = volDos / Qd;

        /* curvas características */
        var g = ctx.plot('carac').clear();
        var dPmax = Math.max(dP * 2.2, 5e6);
        var xs = [], i2;
        for (i2 = 0; i2 <= 60; i2++) xs.push(dPmax * i2 / 60);
        [0.5, 1, 1.5].forEach(function (fat, idx) {
          var Qdi = P2.vazaoArraste(D, N * fat, hf, phi, p.e / 1000);
          var ys = xs.map(function (dp) { return kgh(Math.max(0, Qdi - B * dp / etaC)); });
          g.line(xs.map(function (v) { return v / 1e6; }), ys,
            { color: cor(idx), width: fat === 1 ? 2.6 : 1.4, dash: fat === 1 ? null : [6, 4],
              label: 'rosca a ' + nt(p.rpm * fat, 3) + ' rpm' });
        });
        var ysM = xs.map(function (dp) {
          var q = Km * dp / etaM;
          return kgh(q);
        });
        g.line(xs.map(function (v) { return v / 1e6; }), ysM,
          { color: cor(3), width: 2.2, label: 'matriz' });
        g.marker(dP / 1e6, kgh(Q), nt(kgh(Q), 3) + ' kg/h a ' + nt(dP / 1e6, 3) + ' MPa', { color: cor(2) });
        g.setLimits([0, dPmax / 1e6], [0, kgh(P2.vazaoArraste(D, N * 1.5, hf, phi, p.e / 1000)) * 1.15]);
        g.draw();

        /* produção e pressão × rotação */
        var h = ctx.plot('rot').clear();
        var rs = [], prod = [], pres = [];
        for (i2 = 1; i2 <= 40; i2++) {
          var rpm = 250 * i2 / 40, Nn = rpm / 60;
          var Qdn = P2.vazaoArraste(D, Nn, hf, phi, p.e / 1000);
          var etaCn = P2.eta(K, p.n, P2.gamCanal(D, Nn, hf));
          var Qn = Qdn, dPn = 0, j;
          for (j = 0; j < 20; j++) {
            var etaMn = P2.eta(K, p.n, geoMatriz(Math.max(Qn, 1e-9)));
            dPn = Qdn / (Km / etaMn + B / etaCn);
            Qn = Km * dPn / etaMn;
          }
          rs.push(rpm); prod.push(kgh(Qn)); pres.push(dPn / 1e6);
        }
        h.line(rs, prod, { color: cor(0), width: 2.4, label: 'produção (kg/h)' });
        h.line(rs, pres.map(function (v) { return v * Math.max(1, Math.max.apply(null, prod) / Math.max.apply(null, pres) / 2); }),
          { color: cor(3), width: 1.8, dash: [6, 4], label: 'pressão (escala relativa)' });
        h.marker(p.rpm, kgh(Q), '', { color: cor(2) });
        h.draw();

        var rc = hi / hf;
        var alerta = [];
        if (rc < 1.5 || rc > 5) alerta.push('RC fora da faixa usual de 1,1:1 a 5:1');
        if (dP > 4e7) alerta.push('pressão acima de 40 MPa');

        ctx.setPassos([
          { t: '① Geometria e vazão de arraste',
            tex: 'Q_d = \\tfrac{1}{2}\\pi^2 (' + nt(p.D, 3) + '\\,\\text{mm})^2\\,(' +
              nt(N, 3) + '\\,\\text{s}^{-1})\\,(' + nt(p.hf, 3) + '\\,\\text{mm})\\sin\\varphi\\cos\\varphi',
            r: 'Q_d = ' + nt(kgh(Qd), 4) + ' kg/h',
            obs: 'Com passo quadrado, φ = 17,66°, e sen φ·cos φ = 0,289. A largura do filete (' +
              nt(p.e, 3) + ' mm) desconta ' + nt(100 * p.e / (Math.PI * p.D * Math.sin(phi)), 3) +
              ' % do canal. A vazão de arraste cresce com D², com N e com H.' },
          { t: '② Viscosidade de cada região',
            tex: '\\dot\\gamma_{canal} = \\frac{\\pi D N}{H} = ' + nt(gamC, 4) + '\\ \\text{s}^{-1}' +
              ' \\;\\Rightarrow\\; \\eta = ' + nt(etaC, 4) + '\\ \\text{Pa·s}',
            texSub: '\\dot\\gamma_{matriz} = ' + nt(gamM, 4) + '\\ \\text{s}^{-1} \\;\\Rightarrow\\; \\eta_m = ' +
              nt(etaM, 4) + '\\ \\text{Pa·s}',
            obs: 'A resina de MFI ' + nt(p.mfi, 3) + ' dá K = ' + nt(K, 4) + ' Pa·sⁿ com n = ' + nt(p.n, 3) +
              '. Note que a matriz trabalha numa taxa diferente do canal — e por isso com outra viscosidade.' },
          { t: '③ A matriz resiste',
            tex: 'K_{matriz} = ' + (p.matriz === 'anel'
              ? '\\frac{\\pi\\,' + nt(p.Dm, 3) + '\\cdot ' + nt(p.gap, 3) + '^3}{12\\cdot ' + nt(p.Lm, 3) + '}'
              : p.matriz === 'fenda'
                ? '\\frac{' + nt(p.W, 4) + '\\cdot ' + nt(p.gap, 3) + '^3}{12\\cdot ' + nt(p.Lm, 3) + '}'
                : '\\frac{' + Math.round(p.nfuros) + '\\pi\\,' + nt(p.R, 3) + '^4}{8\\cdot ' + nt(p.Lm, 3) + '}') +
              ' = ' + nt(Km * 1e12, 4) + '\\times 10^{-12}\\ \\text{m}^3',
            obs: 'A condutância vai com a terceira potência da abertura (ou a quarta do raio): fechar o paralelo em 20 % quase dobra a pressão.' },
          { t: '④ Ponto de operação',
            tex: '\\Delta P = \\frac{Q_d}{K_m/\\eta_m + B/\\eta_c} = ' + nt(dP / 1e6, 4) + '\\ \\text{MPa}',
            texSub: 'Q = ' + nt(kgh(Q), 4) + '\\ \\text{kg/h} \\quad (Q_p/Q_d = ' + nt(100 * Qp / Qd, 3) + '\\,\\%)',
            obs: Qp / Qd < 0.05
              ? 'A perda por vazão de pressão é de apenas ' + nt(100 * Qp / Qd, 2) +
                ' %: com canal de dosagem raso, a rosca entrega praticamente a vazão de arraste, e a matriz só decide a pressão. É justamente o que se quer — vazão estável.'
              : 'A vazão de pressão já come ' + nt(100 * Qp / Qd, 3) +
                ' % do arraste: o canal está fundo demais para essa matriz, e a produção passa a depender da pressão (logo, da temperatura e da resina).' },
          { t: '⑤ O que isso cobra da máquina',
            tex: 'F = \\Delta P\\,\\frac{\\pi D^2}{4} = ' + nt(forca / 1000, 4) + '\\ \\text{kN} = ' +
              nt(forca / 9806.65, 3) + '\\ \\text{tf}',
            obs: 'Essa força empurra a rosca contra o mancal de apoio. O tempo de residência na dosagem é de ' +
              nt(tres, 3) + ' s; resinas sensíveis como o PVC pedem tempo curto e cisalhamento baixo.' +
              (alerta.length ? ' Atenção: ' + alerta.join('; ') + '.' : '') }
        ]);

        return {
          rc: { v: nt(rc, 3) + ':1', classe: (rc < 1.5 || rc > 5) ? 'alerta' : 'ok' },
          qd: { v: sg(kgh(Qd), 4), u: 'kg/h' },
          q: { v: sg(kgh(Q), 4), u: 'kg/h' },
          dp: { v: sg(dP / 1e6, 4), u: 'MPa', classe: dP > 4e7 ? 'alerta' : 'ok' },
          qp: { v: sg(100 * Qp / Qd, 3), u: '%' },
          gamc: { v: sg(gamC, 4), u: '1/s' },
          gamm: { v: sg(gamM, 4), u: '1/s' },
          etam: { v: sg(etaM, 4), u: 'Pa·s' },
          forca: { v: sg(forca / 1000, 4), u: 'kN' },
          tres: { v: sg(tres, 3), u: 's' }
        };
      }
    });
  }

  /* =========================================================================
     3 · Extrusão de filme
     ========================================================================= */
  function montarFilme() {
    if (!document.getElementById('sim-filme')) return;
    Sim.build('#sim-filme', {
      titulo: '3. Extrusão de filme — soprado e plano',
      descricao: 'Num filme, a espessura não é usinada: ela sai de um balanço de massa entre o que a extrusora entrega, o quanto o balão incha e o quanto os rolos puxam. O simulador fecha esse balanço e mostra o par de estiramentos que decide a anisotropia do filme.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Filme de embalagem', desc: 'PEBD, 38 µm, balão de 2,5:1',
          valores: { proc: 'soprado', mdot: 50, rho: 920, Dd: 100, gap: 1.2, bur: 2.5, v: 30, W: 1200, alvo: 40 } },
        { nome: '2 · Filme mais fino', desc: 'Puxar mais rápido afina o filme',
          valores: { proc: 'soprado', mdot: 50, rho: 920, Dd: 100, gap: 1.2, bur: 2.5, v: 60, W: 1200, alvo: 20 } },
        { nome: '3 · Balão estreito', desc: 'BUR 1,5: filme grosso e anisotrópico',
          valores: { proc: 'soprado', mdot: 50, rho: 920, Dd: 100, gap: 1.2, bur: 1.5, v: 30, W: 1200, alvo: 60 } },
        { nome: '4 · Lona agrícola', desc: 'Espessura alta, balão largo',
          valores: { proc: 'soprado', mdot: 180, rho: 920, Dd: 200, gap: 2, bur: 3, v: 12, W: 1200, alvo: 150 } },
        { nome: '5 · Filme plano de PP', desc: 'Cast film: 20 µm a 90 m/min',
          valores: { proc: 'plano', mdot: 120, rho: 910, Dd: 100, gap: 0.8, bur: 2.5, v: 90, W: 1200, alvo: 20 } },
        { nome: '6 · Chapa para termoformagem', desc: 'A mesma matriz plana, bem mais espessa',
          valores: { proc: 'plano', mdot: 250, rho: 1050, Dd: 100, gap: 2.5, bur: 2.5, v: 3, W: 1000, alvo: 1300 } }
      ],
      controles: [
        { id: 'proc', tipo: 'seg', label: 'Processo', valor: 'soprado',
          opcoes: [{ v: 'soprado', t: 'Filme soprado' }, { v: 'plano', t: 'Filme plano (cast)' }] },
        { tipo: 'titulo', label: 'Extrusora' },
        { id: 'mdot', label: 'Vazão da extrusora', min: 5, max: 500, step: 1, valor: 50, unidade: 'kg/h' },
        { id: 'rho', label: 'Massa específica do fundido', min: 700, max: 1400, step: 10, valor: 920, unidade: 'kg/m³' },
        { tipo: 'titulo', label: 'Matriz' },
        { id: 'Dd', label: 'Diâmetro da matriz anular', min: 30, max: 400, step: 5, valor: 100, unidade: 'mm' },
        { id: 'W', label: 'Largura da matriz plana', min: 200, max: 3000, step: 10, valor: 1200, unidade: 'mm' },
        { id: 'gap', label: 'Abertura da matriz (die gap)', min: 0.3, max: 4, step: 0.05, valor: 1.2, unidade: 'mm' },
        { tipo: 'titulo', label: 'Puxamento' },
        { id: 'bur', label: 'Razão de sopro (BUR)', min: 1, max: 5, step: 0.05, valor: 2.5 },
        { id: 'v', label: 'Velocidade de puxamento', min: 1, max: 300, step: 1, valor: 30, unidade: 'm/min' },
        { id: 'alvo', label: 'Espessura desejada', min: 5, max: 2000, step: 1, valor: 40, unidade: 'µm' }
      ],
      graficos: [
        { id: 'esp', titulo: 'Espessura × velocidade de puxamento', xlabel: 'Velocidade (m/min)',
          ylabel: 'Espessura (µm)', aspect: 0.5, legendPos: 'topright' },
        { id: 'orient', titulo: 'Estiramento transversal × longitudinal', xlabel: 'Razão de sopro BUR',
          ylabel: 'Razão de estiramento DDR', aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'esp', label: 'Espessura do filme' },
        { id: 'gram', label: 'Gramatura' },
        { id: 'larg', label: 'Largura útil' },
        { id: 'vdie', label: 'Velocidade na saída da matriz' },
        { id: 'ddr', label: 'Razão de estiramento (DDR)' },
        { id: 'aniso', label: 'Balanço DDR/BUR' },
        { id: 'gam', label: 'Taxa de cisalhamento na matriz' },
        { id: 'prod', label: 'Produção linear' },
        { id: 'erro', label: 'Desvio da espessura desejada' }
      ],
      formulas: [
        { g: 'Balanço de massa' },
        { tex: 'Q = \\dot m / \\rho', d: 'vazão volumétrica do fundido', destaque: true },
        { tex: 'Q = \\pi D_f\\,t\\,v \\quad (\\text{soprado}) \\qquad Q = W t v \\quad (\\text{plano})',
          d: 'a espessura sai do balanço, não da matriz', destaque: true },
        { g: 'Estiramentos' },
        { tex: 'BUR = D_f/D_d \\qquad DDR = v/v_{matriz}', d: 'transversal e longitudinal' },
        { tex: 't = \\frac{h}{BUR \\times DDR}', d: 'a espessura é a abertura dividida pelos dois estiramentos' },
        { tex: '\\text{largura plana} = \\pi D_f/2', d: 'o balão colapsado' },
        { tex: 'g = \\rho\\,t', d: 'gramatura, em g/m²' }
      ],
      nota: 'Quando DDR ≈ BUR, o filme fica biaxialmente equilibrado e as propriedades na direção da máquina e na transversal se aproximam. DDR muito maior que BUR dá um filme que rasga com facilidade no sentido do comprimento — o erro clássico de quem só aumenta a velocidade dos rolos para afinar o filme.',
      calcular: function (p, ctx) {
        var soprado = p.proc === 'soprado';
        var v = p.v / 60;
        var r = soprado
          ? P2.filmeSoprado(p.mdot, p.rho, p.Dd / 1000, p.gap / 1000, p.bur, v)
          : P2.filmePlano(p.mdot, p.rho, p.W / 1000, p.gap / 1000, v);
        var esp = r.t * 1e6;
        var larg = soprado ? r.layflat : p.W / 1000;

        var g = ctx.plot('esp').clear();
        var vs = [], i;
        for (i = 1; i <= 60; i++) vs.push(300 * i / 60);
        var series = soprado ? [1.5, p.bur, 3.5] : [p.gap * 0.5, p.gap, p.gap * 2];
        series.forEach(function (s, idx) {
          var ys = vs.map(function (vv) {
            var rr = soprado
              ? P2.filmeSoprado(p.mdot, p.rho, p.Dd / 1000, p.gap / 1000, s, vv / 60)
              : P2.filmePlano(p.mdot, p.rho, p.W / 1000, s / 1000, vv / 60);
            return rr.t * 1e6;
          });
          g.line(vs, ys, { color: cor(idx), width: idx === 1 ? 2.6 : 1.4, dash: idx === 1 ? null : [6, 4],
            label: soprado ? 'BUR ' + nt(s, 3) : 'abertura ' + nt(s, 3) + ' mm' });
        });
        g.hline(p.alvo, { color: cor(3), width: 1.4, text: 'alvo ' + nt(p.alvo, 4) + ' µm' });
        g.marker(p.v, esp, nt(esp, 4) + ' µm', { color: cor(2) });
        g.setLimits([0, 300], [0, Math.max(p.alvo * 2.2, esp * 2)]);
        g.draw();

        var h = ctx.plot('orient').clear();
        if (soprado) {
          var burs = [], ddrs = [];
          for (i = 0; i <= 40; i++) {
            var b = 1 + 4 * i / 40;
            var rr = P2.filmeSoprado(p.mdot, p.rho, p.Dd / 1000, p.gap / 1000, b, v);
            burs.push(b); ddrs.push(rr.ddr);
          }
          h.line(burs, ddrs, { color: cor(0), width: 2.4, label: 'DDR nesta linha (v fixo)' });
          h.line([1, 5], [1, 5], { color: cor(3), width: 1.6, dash: [6, 4], label: 'biaxial equilibrado (DDR = BUR)' });
          h.marker(p.bur, r.ddr, 'DDR/BUR = ' + nt(r.ddr / p.bur, 3), { color: cor(2) });
          h.setLimits([1, 5], [0, Math.max(5, r.ddr * 1.3)]);
        } else {
          var gs = [], es = [];
          for (i = 1; i <= 40; i++) {
            var gp = 0.3 + 3.7 * i / 40;
            gs.push(gp);
            es.push(P2.filmePlano(p.mdot, p.rho, p.W / 1000, gp / 1000, v).ddr);
          }
          h.line(gs, es, { color: cor(0), width: 2.4, label: 'estiramento × abertura da matriz' });
          h.marker(p.gap, r.ddr, 'DDR = ' + nt(r.ddr, 3), { color: cor(2) });
        }
        h.draw();

        var desvio = 100 * (esp - p.alvo) / p.alvo;
        ctx.setPassos([
          { t: '① Do quilo por hora ao metro cúbico por segundo',
            tex: 'Q = \\frac{' + nt(p.mdot, 4) + '/3600}{' + nt(p.rho, 4) + '} = ' +
              nt(r.Q * 1e6, 4) + '\\ \\text{cm}^3/\\text{s}',
            obs: 'A massa específica é a do fundido, não a do granulado: é o volume quente que atravessa a matriz.' },
          { t: '② A velocidade com que o fundido sai da matriz',
            tex: soprado
              ? 'v_{matriz} = \\frac{Q}{\\pi D_d h} = \\frac{' + nt(r.Q * 1e6, 4) + '}{\\pi\\cdot ' +
                nt(p.Dd, 3) + '\\cdot ' + nt(p.gap, 3) + '} = ' + nt(r.vdie * 60, 4) + '\\ \\text{m/min}'
              : 'v_{matriz} = \\frac{Q}{W h} = ' + nt(r.vdie * 60, 4) + '\\ \\text{m/min}',
            obs: 'Os rolos puxam a ' + nt(p.v, 4) + ' m/min, ou seja ' + nt(r.ddr, 3) +
              ' vezes mais rápido. Esse é o estiramento longitudinal (DDR).' },
          { t: '③ A espessura pelo balanço de massa',
            tex: soprado
              ? 't = \\frac{Q}{\\pi D_f v} = \\frac{Q}{\\pi\\cdot ' + nt(r.Df * 1000, 4) + '\\cdot ' +
                nt(p.v, 4) + '/60} = ' + nt(esp, 4) + '\\ \\mu\\text{m}'
              : 't = \\frac{Q}{W v} = ' + nt(esp, 4) + '\\ \\mu\\text{m}',
            texSub: soprado
              ? 't = \\frac{h}{BUR \\times DDR} = \\frac{' + nt(p.gap * 1000, 4) + '}{' + nt(p.bur, 3) +
                '\\times ' + nt(r.ddr, 4) + '} = ' + nt(p.gap * 1000 / (p.bur * r.ddr), 4) + '\\ \\mu\\text{m}'
              : 't = \\frac{h}{DDR} = ' + nt(p.gap * 1000 / r.ddr, 4) + '\\ \\mu\\text{m}',
            obs: 'As duas contas são a mesma: a abertura da matriz dividida pelos estiramentos. Uma matriz de ' +
              nt(p.gap, 3) + ' mm produz um filme ' + nt(p.gap * 1000 / esp, 3) + ' vezes mais fino que ela.' },
          { t: '④ Gramatura e largura',
            tex: 'g = \\rho t = ' + nt(r.gram * 1000, 4) + '\\ \\text{g/m}^2',
            texSub: soprado
              ? '\\text{largura plana} = \\pi D_f/2 = ' + nt(larg * 1000, 4) + '\\ \\text{mm}'
              : '\\text{largura} = ' + nt(larg * 1000, 4) + '\\ \\text{mm}',
            obs: 'A gramatura é a grandeza que o cliente compra e a que a balança da bobinadeira controla: ' +
              nt(p.mdot, 4) + ' kg/h em ' + nt(p.v * 60, 4) + ' m/h de ' + nt(larg * 1000, 4) + ' mm.' },
          { t: '⑤ O filme está equilibrado?',
            tex: soprado ? 'DDR/BUR = ' + nt(r.ddr / p.bur, 3) : 'DDR = ' + nt(r.ddr, 3),
            r: Math.abs(desvio) < 3 ? 'espessura dentro do alvo' : 'desvio de ' + nt(desvio, 3) + ' % do alvo',
            obs: soprado
              ? (r.ddr / p.bur > 1.5
                ? 'O estiramento longitudinal é muito maior que o transversal: o filme fica orientado na direção da máquina e rasga com facilidade nessa direção. Suba o BUR em vez de só acelerar os rolos.'
                : r.ddr / p.bur < 0.67
                  ? 'O balão está sendo inflado muito mais do que puxado: orientação predominante na direção transversal.'
                  : 'DDR e BUR são da mesma ordem: orientação biaxial razoavelmente equilibrada.')
              : 'No filme plano não há estiramento transversal — a orientação é toda na direção da máquina, e por isso o refile das bordas é inevitável.' }
        ]);

        return {
          esp: { v: sg(esp, 4), u: 'µm' },
          gram: { v: sg(r.gram * 1000, 4), u: 'g/m²' },
          larg: { v: sg(larg * 1000, 4), u: 'mm' },
          vdie: { v: sg(r.vdie * 60, 3), u: 'm/min' },
          ddr: { v: sg(r.ddr, 3), u: '×' },
          aniso: soprado
            ? { v: sg(r.ddr / p.bur, 3), u: '×', classe: (r.ddr / p.bur > 1.5 || r.ddr / p.bur < 0.67) ? 'alerta' : 'ok' }
            : { v: 'só longitudinal' },
          gam: { v: sg(r.gam, 4), u: '1/s' },
          prod: { v: sg(p.v * 60, 4), u: 'm/h' },
          erro: { v: sg(desvio, 3), u: '%', classe: Math.abs(desvio) > 10 ? 'alerta' : 'ok' }
        };
      }
    });
  }

  /* =========================================================================
     4 · Injeção
     ========================================================================= */
  function montarInjecao() {
    if (!document.getElementById('sim-injecao')) return;
    Sim.build('#sim-injecao', {
      titulo: '4. Injeção — capacidade, força de fechamento, ciclo e contração',
      descricao: 'Escolher a injetora é responder a três perguntas numéricas: ela dosa o tiro? ela segura o molde fechado? e em quanto tempo a peça fica rígida? O simulador resolve as três e fecha o ciclo em peças por hora.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Peça de PP, uma cavidade', desc: 'O dimensionamento completo',
          valores: { mat: 'pp', mpeca: 85, cav: 1, mcanais: 15, aproj: 95, acanais: 15, h: 3,
            Pinj: 800, S: 1.2, ciPS: 220, ffMaq: 110, Dr: 40, tfech: 1.5, tinj: 1.2, trec: 6, tabre: 2.5, cota: 120 } },
        { nome: '2 · Parede mais grossa', desc: '4 mm: o resfriamento domina o ciclo',
          valores: { mat: 'pp', mpeca: 100, cav: 1, mcanais: 15, aproj: 95, acanais: 15, h: 4,
            Pinj: 800, S: 1.2, ciPS: 220, ffMaq: 110, Dr: 40, tfech: 1.5, tinj: 1.2, trec: 8, tabre: 2.5, cota: 120 } },
        { nome: '3 · Oito cavidades', desc: 'A força de fechamento estoura a máquina',
          valores: { mat: 'ps', mpeca: 22, cav: 8, mcanais: 24, aproj: 42, acanais: 30, h: 2,
            Pinj: 900, S: 1.2, ciPS: 400, ffMaq: 110, Dr: 40, tfech: 1.5, tinj: 0.8, trec: 4, tabre: 2.2, cota: 60 } },
        { nome: '4 · Pré-forma de PET', desc: 'Parede grossa e molde muito frio',
          valores: { mat: 'pet', mpeca: 24, cav: 4, mcanais: 10, aproj: 12, acanais: 14, h: 3.7,
            Pinj: 1200, S: 1.3, ciPS: 220, ffMaq: 110, Dr: 40, tfech: 1.2, tinj: 1.5, trec: 5, tabre: 2, cota: 95 } },
        { nome: '5 · Peça técnica em PA 6.6', desc: 'Semicristalino quente, molde a 60 °C',
          valores: { mat: 'pa66', mpeca: 60, cav: 1, mcanais: 12, aproj: 70, acanais: 12, h: 2.5,
            Pinj: 1000, S: 1.25, ciPS: 220, ffMaq: 110, Dr: 40, tfech: 1.5, tinj: 1, trec: 5, tabre: 2.5, cota: 80 } },
        { nome: '6 · Tiro pequeno demais', desc: 'Menos de 20 % da capacidade: degradação',
          valores: { mat: 'pc', mpeca: 12, cav: 1, mcanais: 6, aproj: 20, acanais: 8, h: 2,
            Pinj: 1100, S: 1.2, ciPS: 220, ffMaq: 110, Dr: 40, tfech: 1.5, tinj: 0.8, trec: 4, tabre: 2.5, cota: 40 } }
      ],
      controles: [
        { id: 'mat', tipo: 'select', label: 'Material', valor: 'pp',
          opcoes: P2.polimeros.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { tipo: 'titulo', label: 'Peça e molde' },
        { id: 'mpeca', label: 'Massa de cada peça', min: 1, max: 2000, step: 1, valor: 85, unidade: 'g' },
        { id: 'cav', label: 'Número de cavidades', min: 1, max: 32, step: 1, valor: 2 },
        { id: 'mcanais', label: 'Massa dos canais', min: 0, max: 300, step: 1, valor: 15, unidade: 'g' },
        { id: 'aproj', label: 'Área projetada de cada cavidade', min: 1, max: 2000, step: 1, valor: 95, unidade: 'cm²' },
        { id: 'acanais', label: 'Área projetada dos canais', min: 0, max: 500, step: 1, valor: 15, unidade: 'cm²' },
        { id: 'h', label: 'Espessura de parede', min: 0.5, max: 10, step: 0.1, valor: 3, unidade: 'mm' },
        { id: 'cota', label: 'Cota a controlar na peça', min: 5, max: 600, step: 1, valor: 120, unidade: 'mm' },
        { tipo: 'titulo', label: 'Processo' },
        { id: 'Pinj', label: 'Pressão de injeção', min: 300, max: 1800, step: 10, valor: 800, unidade: 'kgf/cm²' },
        { id: 'S', label: 'Fator de segurança', min: 1.1, max: 1.4, step: 0.05, valor: 1.2 },
        { tipo: 'titulo', label: 'Máquina' },
        { id: 'ciPS', label: 'Capacidade de injeção (em PS)', min: 20, max: 3000, step: 10, valor: 220, unidade: 'g' },
        { id: 'ffMaq', label: 'Força de fechamento disponível', min: 10, max: 1500, step: 5, valor: 110, unidade: 'tf' },
        { id: 'Dr', label: 'Diâmetro da rosca', min: 18, max: 120, step: 1, valor: 40, unidade: 'mm' },
        { tipo: 'titulo', label: 'Tempos do ciclo' },
        { id: 'tfech', label: 'Fechamento', min: 0.3, max: 8, step: 0.1, valor: 1.5, unidade: 's' },
        { id: 'tinj', label: 'Injeção', min: 0.2, max: 12, step: 0.1, valor: 1.2, unidade: 's' },
        { id: 'trec', label: 'Recalque', min: 0.5, max: 30, step: 0.5, valor: 6, unidade: 's' },
        { id: 'tabre', label: 'Abertura e extração', min: 0.5, max: 10, step: 0.1, valor: 2.5, unidade: 's' }
      ],
      graficos: [
        { id: 'ciclo', titulo: 'Composição do ciclo', ylabel: 'Tempo (s)', aspect: 0.4, legend: false },
        { id: 'esp', titulo: 'Tempo de resfriamento e produção × espessura', xlabel: 'Espessura de parede (mm)',
          ylabel: 'Tempo de resfriamento (s)', aspect: 0.46, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'ci', label: 'Capacidade de injeção no material' },
        { id: 'tiro', label: 'Massa do tiro' },
        { id: 'uso', label: 'Aproveitamento da capacidade' },
        { id: 'curso', label: 'Curso de dosagem' },
        { id: 'ff', label: 'Força de fechamento necessária' },
        { id: 'folga', label: 'Folga da máquina' },
        { id: 'tresf', label: 'Tempo de resfriamento' },
        { id: 'ciclo', label: 'Ciclo total' },
        { id: 'prod', label: 'Produção' },
        { id: 'tres', label: 'Tempo de residência no canhão' },
        { id: 'molde', label: 'Cota a usinar no molde' },
        { id: 'faixa', label: 'Dispersão da cota pela contração' }
      ],
      formulas: [
        { g: 'Capacidade de injeção' },
        { tex: 'CI = CI_{PS}\\,\\frac{P}{P_r}\\,\\frac{FV}{FV_r}', d: 'convertida da capacidade em poliestireno', destaque: true },
        { tex: 'FV = \\rho_{fund}/\\rho_{sol}', d: 'fator volumétrico: a expansão do material na temperatura de moldagem' },
        { tex: '0{,}20 \\le m_{tiro}/CI \\le 0{,}80', d: 'faixa recomendada de uso' },
        { g: 'Fechamento' },
        { tex: 'FF = \\frac{A\\,P\\,S}{2}', d: 'A em cm², P em kgf/cm², FF em kgf', destaque: true },
        { g: 'Resfriamento' },
        { tex: 't_{resf} = \\frac{h^2}{\\pi^2\\alpha}\\ln\\!\\left[\\frac{4}{\\pi}\\frac{T_{massa}-T_{molde}}{T_{extr}-T_{molde}}\\right]',
          d: 'parede plana, primeira harmônica', destaque: true },
        { tex: '\\alpha = k/(\\rho c_p)', d: 'difusividade térmica do polímero' },
        { g: 'Contração' },
        { tex: 'L_{molde} = L_{peça}\\,(1+s)', d: 's de 0,4 a 0,7 % nos amorfos e de 1,5 a 2,5 % nos semicristalinos' }
      ],
      nota: 'O tempo de resfriamento vai com o quadrado da espessura: reduzir a parede de 4 para 3 mm derruba o ciclo quase pela metade. É a providência de produtividade mais barata que existe num projeto de peça injetada — e também a que mais mexe no empenamento, porque muda a história térmica.',
      calcular: function (p, ctx) {
        var m = P2.polimero(p.mat);
        var al = P2.alfa(m);
        var ci = P2.capacidadeInjecao(m, p.ciPS);
        var cav = Math.round(p.cav);
        var tiro = p.mpeca * cav + p.mcanais;
        var uso = 100 * tiro / ci;
        var Ar = Math.PI * Math.pow(p.Dr / 10, 2) / 4;        /* cm² */
        var curso = (tiro / m.rm) / Ar;                        /* cm */
        var A = p.aproj * cav + p.acanais;
        var ff = P2.forcaFechamento(A, p.Pinj, p.S) / 1000;    /* tf */
        var tresf = P2.tempoResfriamento(p.h / 1000, al, m.Tm, m.Tw, m.Te);
        var resto = Math.max(0, tresf - p.trec);
        var ciclo = p.tfech + p.tinj + p.trec + resto + p.tabre;
        var pecas = 3600 / ciclo * cav;
        var tres = ci / tiro * ciclo;
        var molde = p.cota * (1 + m.s);
        var sMin = m.cristalino ? m.s - 0.003 : m.s - 0.001;
        var sMax = m.cristalino ? m.s + 0.007 : m.s + 0.002;
        var faixa = molde / (1 + sMin) - molde / (1 + sMax);

        /* ciclo em barras */
        var g = ctx.plot('ciclo').clear();
        var rot = ['fechamento', 'injeção', 'recalque', 'resfriamento', 'abertura'];
        var val = [p.tfech, p.tinj, p.trec, resto, p.tabre];
        g.o.xcat = rot.map(function (r, i) { return { v: i, label: r }; });
        g.bars([0, 1, 2, 3, 4], val, { color: cor(0), width: 0.62, alpha: 0.85 });
        val.forEach(function (v, i) {
          g.text(i, v, nt(v, 3) + ' s', { align: 'center', baseline: 'bottom', size: 11, color: cor(0) });
        });
        g.setLimits([-0.7, 4.8], [0, Math.max.apply(null, val) * 1.25]);
        g.draw();

        /* resfriamento × espessura */
        var h = ctx.plot('esp').clear();
        var hs = [], ts = [], ps = [];
        var i;
        for (i = 1; i <= 50; i++) {
          var hh = 0.5 + 9.5 * i / 50;
          var tt = P2.tempoResfriamento(hh / 1000, al, m.Tm, m.Tw, m.Te);
          var cc = p.tfech + p.tinj + p.trec + Math.max(0, tt - p.trec) + p.tabre;
          hs.push(hh); ts.push(tt); ps.push(3600 / cc * cav);
        }
        h.line(hs, ts, { color: cor(0), width: 2.4, label: 'tempo de resfriamento (s)' });
        var fat = Math.max.apply(null, ts) / Math.max.apply(null, ps);
        h.line(hs, ps.map(function (v) { return v * fat; }),
          { color: cor(2), width: 1.8, dash: [6, 4], label: 'produção (escala relativa)' });
        h.marker(p.h, tresf, nt(tresf, 3) + ' s', { color: cor(3) });
        h.draw();

        var av = [];
        if (uso > 80) av.push('tiro acima de 80 % da capacidade');
        if (uso < 20) av.push('tiro abaixo de 20 % da capacidade: tempo de residência alto');
        if (curso / (p.Dr / 10) > 3) av.push('curso acima de 3D');
        if (curso / (p.Dr / 10) < 1) av.push('curso abaixo de 1D');
        if (ff > p.ffMaq) av.push('força de fechamento insuficiente');

        ctx.setPassos([
          { t: '① A máquina dosa o tiro?',
            tex: 'CI = ' + nt(p.ciPS, 4) + '\\times\\frac{' + nt(m.rs, 4) + '}{1{,}05}\\times\\frac{' +
              nt(P2.fv(m), 4) + '}{0{,}9333} = ' + nt(ci, 4) + '\\ \\text{g}',
            texSub: 'm_{tiro} = ' + nt(p.mpeca, 4) + '\\times ' + cav + ' + ' + nt(p.mcanais, 4) +
              ' = ' + nt(tiro, 4) + '\\ \\text{g} \\;\\Rightarrow\\; ' + nt(uso, 3) + '\\,\\%\\ \\text{da}\\ CI',
            obs: (uso >= 20 && uso <= 80)
              ? 'Dentro da faixa de 20 a 80 %. Abaixo disso o material fica tempo demais no canhão; acima, a dosagem perde repetibilidade.'
              : 'Fora da faixa de 20 a 80 % da capacidade: ' +
                (uso > 80 ? 'a dosagem perde repetibilidade e o colchão pode acabar.' :
                  'o material passa ' + nt(tres, 3) + ' s no canhão e pode degradar.') },
          { t: '② O curso de dosagem cabe na rosca?',
            tex: 'V_{tiro} = ' + nt(tiro, 4) + '/' + nt(m.rm, 4) + ' = ' + nt(tiro / m.rm, 4) + '\\ \\text{cm}^3',
            texSub: '\\text{curso} = V/A_{rosca} = ' + nt(tiro / m.rm, 4) + '/' + nt(Ar, 4) + ' = ' +
              nt(curso, 3) + '\\ \\text{cm} = ' + nt(curso / (p.Dr / 10), 3) + 'D',
            obs: 'A recomendação é ficar entre 1D e 3D. Curso curto dá dosagem imprecisa; curso longo deixa material parado na ponta da rosca.' },
          { t: '③ A máquina segura o molde fechado?',
            tex: 'FF = \\frac{A\\,P\\,S}{2} = \\frac{' + nt(A, 4) + '\\times ' + nt(p.Pinj, 4) +
              '\\times ' + nt(p.S, 3) + '}{2} = ' + nt(ff * 1000, 5) + '\\ \\text{kgf}',
            r: 'FF = ' + nt(ff, 4) + ' tf  (máquina: ' + nt(p.ffMaq, 4) + ' tf)',
            obs: 'O fator ½ reconhece que a pressão média na cavidade é cerca de metade da pressão de injeção — aqui, ' +
              nt(p.Pinj / 2, 4) + ' kgf/cm² ou ' + nt(p.Pinj / 2 * 9.80665 / 100, 3) + ' MPa. ' +
              (ff > p.ffMaq
                ? 'Falta força: o molde abre e aparece rebarba. Reduza a área projetada, a pressão ou mude de máquina.'
                : 'Sobram ' + nt(p.ffMaq - ff, 3) + ' tf de folga.') },
          { t: '④ Quanto tempo a peça leva para endurecer',
            tex: '\\alpha = \\frac{' + nt(m.k, 3) + '}{' + nt(m.rs * 1000, 4) + '\\times ' + nt(m.cp, 4) +
              '} = ' + nt(al * 1e8, 4) + '\\times 10^{-8}\\ \\text{m}^2/\\text{s}',
            texSub: 't_{resf} = \\frac{(' + nt(p.h, 3) + '\\,\\text{mm})^2}{\\pi^2\\alpha}\\ln\\!\\left[\\frac{4}{\\pi}\\frac{' +
              nt(m.Tm, 4) + '-' + nt(m.Tw, 3) + '}{' + nt(m.Te, 3) + '-' + nt(m.Tw, 3) + '}\\right] = ' +
              nt(tresf, 4) + '\\ \\text{s}',
            obs: 'Com h ao quadrado: a mesma peça com ' + nt(p.h * 2, 3) + ' mm de parede levaria ' +
              nt(tresf * 4, 4) + ' s. É a etapa mais longa do ciclo e a que paga o projeto de refrigeração do molde.' },
          { t: '⑤ Ciclo e produção',
            tex: 't_{ciclo} = ' + nt(p.tfech, 3) + ' + ' + nt(p.tinj, 3) + ' + ' + nt(p.trec, 3) + ' + ' +
              nt(resto, 3) + ' + ' + nt(p.tabre, 3) + ' = ' + nt(ciclo, 4) + '\\ \\text{s}',
            texSub: '\\text{produção} = \\frac{3600}{' + nt(ciclo, 4) + '}\\times ' + cav + ' = ' +
              Math.floor(pecas) + '\\ \\text{peças/h} = ' + nt(pecas * p.mpeca / 1000, 4) + '\\ \\text{kg/h}',
            obs: 'O recalque de ' + nt(p.trec, 3) + ' s acontece dentro do resfriamento, então só o que sobra (' +
              nt(resto, 3) + ' s) soma ao ciclo. O material fica ' + nt(tres, 3) + ' s no canhão.' },
          { t: '⑥ A cota do molde',
            tex: 'L_{molde} = ' + nt(p.cota, 4) + '\\times(1 + ' + nt(m.s, 4) + ') = ' + nt(molde, 5) + '\\ \\text{mm}',
            obs: 'Se a contração real variar de ' + nt(sMin * 100, 3) + ' % a ' + nt(sMax * 100, 3) +
              ' % — o que a temperatura do molde e o recalque fazem com facilidade —, a cota da peça varre ' +
              nt(faixa, 3) + ' mm, isto é ' + nt(100 * faixa / p.cota, 3) +
              ' % da medida. Nenhuma tolerância mais estreita que isso se sustenta sem travar o processo.' +
              (av.length ? ' Pendências: ' + av.join('; ') + '.' : '') }
        ]);

        return {
          ci: { v: sg(ci, 4), u: 'g' },
          tiro: { v: sg(tiro, 4), u: 'g' },
          uso: { v: sg(uso, 3), u: '%', classe: (uso > 80 || uso < 20) ? 'alerta' : 'ok' },
          curso: { v: nt(curso / (p.Dr / 10), 3) + 'D',
            classe: (curso / (p.Dr / 10) > 3 || curso / (p.Dr / 10) < 1) ? 'alerta' : 'ok' },
          ff: { v: sg(ff, 4), u: 'tf', classe: ff > p.ffMaq ? 'alerta' : 'ok' },
          folga: { v: sg(p.ffMaq - ff, 3), u: 'tf', classe: ff > p.ffMaq ? 'alerta' : 'ok' },
          tresf: { v: sg(tresf, 4), u: 's' },
          ciclo: { v: sg(ciclo, 4), u: 's' },
          prod: { v: Math.floor(pecas), u: 'peças/h' },
          tres: { v: sg(tres, 3), u: 's', classe: tres > 300 ? 'alerta' : 'ok' },
          molde: { v: sg(molde, 5), u: 'mm' },
          faixa: { v: '± ' + nt(faixa / 2, 3), u: 'mm' }
        };
      }
    });
  }

  /* =========================================================================
     5 · Compósitos
     ========================================================================= */
  function montarCompositos() {
    if (!document.getElementById('sim-compositos')) return;
    Sim.build('#sim-compositos', {
      titulo: '5. Compósitos — regra das misturas e escolha do processo',
      descricao: 'O processo de fabricação decide a fração de fibra, e a fração de fibra decide a rigidez. Este simulador liga as duas pontas: do teor em massa que cada processo alcança até o módulo na direção da fibra, fora do eixo e por unidade de massa.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Laminação manual, vidro/poliéster', desc: 'O caso mais comum e o menos rígido',
          valores: { fib: 'vidroe', mat: 'poliester', Wf: 25, th: 0 } },
        { nome: '2 · Pultrusão de perfil', desc: 'Fibra alinhada e teor alto',
          valores: { fib: 'vidroe', mat: 'poliester', Wf: 65, th: 0 } },
        { nome: '3 · Autoclave, carbono/epóxi', desc: 'Rigidez específica de três aços',
          valores: { fib: 'carbonoalta', mat: 'epoxi', Wf: 65, th: 0 } },
        { nome: '4 · O mesmo laminado a 45°', desc: 'Fora do eixo a rigidez desaba',
          valores: { fib: 'carbonoalta', mat: 'epoxi', Wf: 65, th: 45 } },
        { nome: '5 · Carbono de alto módulo', desc: 'Para rigidez acima de tudo',
          valores: { fib: 'carbonomod', mat: 'epoxi', Wf: 60, th: 0 } },
        { nome: '6 · Termoplástico reforçado', desc: 'Vidro curto em PP, injetável',
          valores: { fib: 'vidroe', mat: 'pp', Wf: 30, th: 0 } }
      ],
      controles: [
        { id: 'fib', tipo: 'select', label: 'Reforço', valor: 'vidroe',
          opcoes: P2.fibras.map(function (x) { return { v: x.id, t: x.nome }; }) },
        { id: 'mat', tipo: 'select', label: 'Matriz', valor: 'poliester',
          opcoes: P2.matrizes.map(function (x) { return { v: x.id, t: x.nome }; }) },
        { tipo: 'titulo', label: 'Composição' },
        { id: 'Wf', label: 'Teor de fibra em massa', min: 5, max: 80, step: 1, valor: 25, unidade: '%' },
        { id: 'th', label: 'Ângulo da carga em relação à fibra', min: 0, max: 90, step: 1, valor: 0, unidade: '°' }
      ],
      graficos: [
        { id: 'vf', titulo: 'Módulo × fração volumétrica de fibra', xlabel: 'Fração volumétrica V_f',
          ylabel: 'Módulo (GPa)', aspect: 0.5, legendPos: 'topleft' },
        { id: 'ang', titulo: 'Módulo fora do eixo', xlabel: 'Ângulo θ (°)', ylabel: 'E_x (GPa)',
          aspect: 0.4, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'vf', label: 'Fração volumétrica' },
        { id: 'rho', label: 'Massa específica do laminado' },
        { id: 'e1', label: 'Módulo na direção da fibra' },
        { id: 'e2', label: 'Módulo transversal' },
        { id: 'ex', label: 'Módulo no ângulo escolhido' },
        { id: 'g12', label: 'Módulo de cisalhamento' },
        { id: 'esp', label: 'Rigidez específica E₁/ρ' },
        { id: 'vsaco', label: 'Em relação ao aço' },
        { id: 'sig', label: 'Resistência estimada na direção da fibra' },
        { id: 'proc', label: 'Processos compatíveis com esse teor' }
      ],
      formulas: [
        { g: 'Composição' },
        { tex: 'V_f = \\frac{W_f/\\rho_f}{W_f/\\rho_f + W_m/\\rho_m}', d: 'de teor em massa para teor em volume', destaque: true },
        { tex: '\\rho_c = \\rho_f V_f + \\rho_m V_m', d: 'massa específica do laminado' },
        { g: 'Rigidez' },
        { tex: 'E_1 = E_f V_f + E_m V_m', d: 'regra das misturas: deformação igual nas duas fases', destaque: true },
        { tex: 'E_2 = \\left(\\frac{V_f}{E_f} + \\frac{V_m}{E_m}\\right)^{-1}', d: 'regra inversa: tensão igual', destaque: true },
        { tex: '\\nu_{12} = \\nu_f V_f + \\nu_m V_m \\qquad G_{12} = \\left(\\frac{V_f}{G_f}+\\frac{V_m}{G_m}\\right)^{-1}' },
        { tex: '\\frac{1}{E_x} = \\frac{\\cos^4\\theta}{E_1} + \\frac{\\sin^4\\theta}{E_2} + \\left(\\frac{1}{G_{12}} - \\frac{2\\nu_{12}}{E_1}\\right)\\sin^2\\theta\\cos^2\\theta',
          d: 'módulo fora do eixo da fibra', destaque: true }
      ],
      nota: 'A regra das misturas acerta E₁ com boa precisão e subestima E₂ e G₁₂, porque a matriz em torno da fibra não se deforma de maneira uniforme — modelos como Halpin–Tsai corrigem isso. Como estimativa de projeto, a direção da fibra é confiável; a transversal, otimista por baixo.',
      calcular: function (p, ctx) {
        var fib = P2.acha(P2.fibras, p.fib), mat = P2.acha(P2.matrizes, p.mat);
        var Vf = P2.volDeMassa(p.Wf / 100, fib.rho, mat.rho);
        var lam = P2.lamina(fib, mat, Vf);
        var Ex = P2.Ex(lam, p.th);
        var espec = lam.E1 / lam.rho;

        var g = ctx.plot('vf').clear();
        var vs = [], e1 = [], e2 = [], es = [], i;
        for (i = 0; i <= 50; i++) {
          var v = i / 50 * 0.8;
          var l = P2.lamina(fib, mat, v);
          vs.push(v); e1.push(l.E1); e2.push(l.E2); es.push(l.E1 / l.rho);
        }
        g.line(vs, e1, { color: cor(0), width: 2.6, label: 'E₁ (direção da fibra)' });
        g.line(vs, e2, { color: cor(2), width: 2, label: 'E₂ (transversal)' });
        g.hline(210, { color: cor(5), width: 1.2, text: 'aço 210 GPa' });
        g.hline(70, { color: cor(6), width: 1.2, text: 'alumínio 70 GPa' });
        g.marker(Vf, lam.E1, nt(lam.E1, 4) + ' GPa', { color: cor(3) });
        g.setLimits([0, 0.8], [0, Math.max(240, lam.E1 * 1.2)]);
        g.draw();

        var h = ctx.plot('ang').clear();
        var ths = [], exs = [];
        for (i = 0; i <= 90; i += 2) { ths.push(i); exs.push(P2.Ex(lam, i)); }
        h.line(ths, exs, { color: cor(0), width: 2.4, label: 'E_x(θ)' });
        h.marker(p.th, Ex, nt(Ex, 4) + ' GPa', { color: cor(3) });
        h.setLimits([0, 90], [0, lam.E1 * 1.15]);
        h.draw();

        var comp = P2.processosComp.filter(function (x) { return Math.abs(x.wf - p.Wf / 100) <= 0.08; })
          .map(function (x) { return x.nome.replace(/ \(.*\)/, ''); });

        ctx.setPassos([
          { t: '① De teor em massa para teor em volume',
            tex: 'V_f = \\frac{' + nt(p.Wf / 100, 3) + '/' + nt(fib.rho, 4) + '}{' + nt(p.Wf / 100, 3) + '/' +
              nt(fib.rho, 4) + ' + ' + nt(1 - p.Wf / 100, 3) + '/' + nt(mat.rho, 4) + '} = ' + nt(Vf, 4),
            obs: 'A fibra é mais densa que a matriz, então o teor em volume é sempre menor que o teor em massa: ' +
              nt(p.Wf, 3) + ' % em massa dão só ' + nt(Vf * 100, 3) +
              ' % em volume. Quem carrega a carga é o volume, e é por isso que a conversão não pode ser esquecida.' },
          { t: '② Massa específica do laminado',
            tex: '\\rho_c = ' + nt(fib.rho, 4) + '\\times ' + nt(Vf, 4) + ' + ' + nt(mat.rho, 4) +
              '\\times ' + nt(1 - Vf, 4) + ' = ' + nt(lam.rho, 4) + '\\ \\text{g/cm}^3',
            obs: 'Contra 7,85 do aço e 2,70 do alumínio. Essa é a metade da vantagem do compósito — a outra metade vem do módulo.' },
          { t: '③ Rigidez na direção da fibra e na transversal',
            tex: 'E_1 = ' + nt(fib.E, 4) + '\\times ' + nt(Vf, 4) + ' + ' + nt(mat.E, 3) + '\\times ' +
              nt(1 - Vf, 4) + ' = ' + nt(lam.E1, 4) + '\\ \\text{GPa}',
            texSub: 'E_2 = \\left(\\frac{' + nt(Vf, 4) + '}{' + nt(fib.E, 4) + '} + \\frac{' + nt(1 - Vf, 4) +
              '}{' + nt(mat.E, 3) + '}\\right)^{-1} = ' + nt(lam.E2, 4) + '\\ \\text{GPa}',
            obs: 'A razão E₁/E₂ é de ' + nt(lam.E1 / lam.E2, 3) +
              ': o laminado unidirecional é quase um material diferente em cada direção. A matriz contribui com ' +
              nt(100 * mat.E * (1 - Vf) / lam.E1, 2) + ' % de E₁ e manda em E₂.' },
          { t: '④ Fora do eixo da fibra',
            tex: 'E_x(' + nt(p.th, 3) + '^\\circ) = ' + nt(Ex, 4) + '\\ \\text{GPa}',
            obs: p.th === 0
              ? 'Em 0° toda a rigidez da fibra aparece. Gire a carga para 45° e veja o que sobra: ' +
                nt(P2.Ex(lam, 45), 4) + ' GPa, ou seja ' + nt(lam.E1 / P2.Ex(lam, 45), 3) + ' vezes menos.'
              : 'Contra ' + nt(lam.E1, 4) + ' GPa em 0°: uma queda de ' + nt(lam.E1 / Ex, 3) +
                ' vezes. É por isso que o enrolamento filamentar escolhe o ângulo pelo esforço em serviço, e por isso que a pultrusão precisa de mantas para resistir no sentido transversal.' },
          { t: '⑤ Rigidez específica e processo',
            tex: 'E_1/\\rho_c = ' + nt(lam.E1, 4) + '/' + nt(lam.rho, 4) + ' = ' + nt(espec, 4) +
              '\\ \\text{GPa}/(\\text{g/cm}^3)',
            texSub: '\\text{aço} = 210/7{,}85 = 26{,}75 \\qquad \\text{alumínio} = 70/2{,}70 = 25{,}93',
            obs: 'O laminado é ' + nt(espec / 26.75, 3) +
              ' vezes mais rígido que o aço por unidade de massa. ' +
              (comp.length ? 'Esse teor de fibra é típico de: ' + comp.join(', ') + '.'
                : 'Esse teor fica entre as faixas típicas dos processos tabelados — laminação manual chega a 25 %, RTM a 45 %, pultrusão e autoclave a 65 %.') }
        ]);

        return {
          vf: { v: sg(Vf, 4) },
          rho: { v: sg(lam.rho, 4), u: 'g/cm³' },
          e1: { v: sg(lam.E1, 4), u: 'GPa' },
          e2: { v: sg(lam.E2, 4), u: 'GPa' },
          ex: { v: sg(Ex, 4), u: 'GPa' },
          g12: { v: sg(lam.G12, 4), u: 'GPa' },
          esp: { v: sg(espec, 4), u: 'GPa/(g/cm³)' },
          vsaco: { v: sg(espec / 26.75, 3), u: '×', classe: espec > 26.75 ? 'ok' : 'alerta' },
          sig: { v: sg(lam.sig1, 4), u: 'MPa' },
          proc: { v: comp.length ? comp.join(', ') : 'fora das faixas tabeladas' }
        };
      }
    });
  }

  function montarTudo() {
    montarReologia();
    montarExtrusora();
    montarFilme();
    montarInjecao();
    montarCompositos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarTudo);
  } else {
    montarTudo();
  }
})(window);

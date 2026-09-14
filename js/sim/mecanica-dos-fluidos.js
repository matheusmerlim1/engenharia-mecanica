/* ============================================================
   Mecânica dos Fluidos — simuladores
     1. sim-perda-carga : tubulação, Colebrook, curva do sistema
     2. sim-moody       : diagrama de Moody interativo
     3. sim-bernoulli   : Venturi com linhas de energia e piezométrica
     4. sim-hidrostatica: força e centro de pressão em comporta
   ============================================================ */
(function () {
  'use strict';

  var G = 9.81;

  /* ---------- propriedades dos fluidos (20 °C salvo indicação) ---------- */
  var FLUIDOS = {
    agua20:  { nome: 'Água 20 °C',        rho: 998,  nu: 1.004e-6 },
    agua60:  { nome: 'Água 60 °C',        rho: 983,  nu: 4.75e-7 },
    oleoSAE30: { nome: 'Óleo SAE 30',     rho: 891,  nu: 2.4e-4 },
    glicerina: { nome: 'Glicerina',       rho: 1260, nu: 1.18e-3 },
    ar:      { nome: 'Ar 20 °C, 1 atm',   rho: 1.204, nu: 1.51e-5 },
    gasolina: { nome: 'Gasolina',         rho: 680,  nu: 4.6e-7 }
  };

  /* ---------- rugosidade absoluta [m] ---------- */
  var MATERIAIS = {
    pvc:     { nome: 'PVC / plástico', eps: 0.0015e-3 },
    aco:     { nome: 'Aço comercial',  eps: 0.046e-3 },
    galv:    { nome: 'Aço galvanizado', eps: 0.15e-3 },
    ffundido: { nome: 'Ferro fundido', eps: 0.26e-3 },
    concreto: { nome: 'Concreto',      eps: 1.0e-3 },
    aco_enf: { nome: 'Aço enferrujado', eps: 2.0e-3 }
  };

  /* Colebrook-White por substituição sucessiva; laminar por 64/Re */
  function fatorAtrito(Re, rr) {
    if (!isFinite(Re) || Re <= 0) return NaN;
    if (Re < 2300) return 64 / Re;
    var f = 0.02, i, nf;
    for (i = 0; i < 60; i++) {
      nf = Math.pow(-2 * Math.log(rr / 3.7 + 2.51 / (Re * Math.sqrt(f))) / Math.LN10, -2);
      if (Math.abs(nf - f) < 1e-13) { f = nf; break; }
      f = nf;
    }
    /* faixa crítica 2300 < Re < 4000: interpola para não dar salto */
    if (Re < 4000) {
      var fl = 64 / 2300;
      var t = (Re - 2300) / 1700;
      return fl * (1 - t) + f * t;
    }
    return f;
  }

  function regime(Re) {
    if (Re < 2300) return { nome: 'Laminar', cls: 'ok' };
    if (Re < 4000) return { nome: 'Transição', cls: 'alerta' };
    return { nome: 'Turbulento', cls: '' };
  }

  /* ============================================================
     1. Perda de carga em tubulação
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-perda-carga')) return;

    var ACESSORIOS = [
      { id: 'nCot90', label: 'Cotovelo 90° raio longo', K: 0.30 },
      { id: 'nCot45', label: 'Cotovelo 45°', K: 0.20 },
      { id: 'nTe', label: 'Tê (passagem direta)', K: 0.20 },
      { id: 'nValG', label: 'Válvula gaveta aberta', K: 0.15 },
      { id: 'nValGl', label: 'Válvula globo aberta', K: 6.0 },
      { id: 'nRet', label: 'Válvula de retenção', K: 2.0 }
    ];

    Sim.build('#sim-perda-carga', {
      titulo: 'Perda de carga em tubulação',
      descricao: 'Darcy-Weisbach com fator de atrito de Colebrook-White, mais as perdas localizadas dos acessórios. A curva do sistema é o que se cruza com a curva da bomba para achar o ponto de operação.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Recalque predial em PVC',
          desc: 'Caso típico de instalação hidráulica',
          valores: { D: 50, L: 40, mat: 'pvc', fluido: 'agua20', Q: 3, dz: 12,
                     nCot90: 6, nCot45: 0, nTe: 2, nValG: 2, nValGl: 0, nRet: 1 } },
        { nome: '2 · Adutora longa em aço',
          desc: 'Trecho longo: a perda distribuída domina',
          valores: { D: 150, L: 800, mat: 'aco', fluido: 'agua20', Q: 40, dz: 25,
                     nCot90: 8, nCot45: 4, nTe: 2, nValG: 3, nValGl: 0, nRet: 1 } },
        { nome: '3 · Tubo velho e incrustado',
          desc: 'Mesma vazão do caso 2, mas com ε 40× maior',
          valores: { D: 150, L: 800, mat: 'aco_enf', fluido: 'agua20', Q: 40, dz: 25,
                     nCot90: 8, nCot45: 4, nTe: 2, nValG: 3, nValGl: 0, nRet: 1 } },
        { nome: '4 · Óleo pesado (laminar)',
          desc: 'Viscosidade alta derruba o Reynolds: f = 64/Re',
          valores: { D: 50, L: 40, mat: 'aco', fluido: 'oleoSAE30', Q: 1.5, dz: 5,
                     nCot90: 4, nCot45: 0, nTe: 0, nValG: 1, nValGl: 0, nRet: 0 } },
        { nome: '5 · Válvula globo estrangulando',
          desc: 'Uma válvula globo (K = 6) vale por dezenas de metros de tubo',
          valores: { D: 50, L: 40, mat: 'aco', fluido: 'agua20', Q: 4, dz: 8,
                     nCot90: 4, nCot45: 0, nTe: 0, nValG: 0, nValGl: 2, nRet: 1 } },
        { nome: '6 · Diâmetro subdimensionado',
          desc: 'Metade do diâmetro: hf sobe cerca de 32 vezes',
          valores: { D: 25, L: 40, mat: 'pvc', fluido: 'agua20', Q: 3, dz: 12,
                     nCot90: 6, nCot45: 0, nTe: 2, nValG: 2, nValGl: 0, nRet: 1 } }
      ],
      exemplosNota: 'Clique para carregar. A resolução passo a passo fica no fim do simulador.',
      controles: [
        { tipo: 'titulo', label: 'Tubulação' },
        { id: 'D', label: 'Diâmetro interno D', min: 15, max: 400, step: 1, valor: 75, unidade: 'mm' },
        { id: 'L', label: 'Comprimento reto L', min: 1, max: 1000, step: 1, valor: 120, unidade: 'm' },
        { id: 'mat', tipo: 'select', label: 'Material do tubo', valor: 'aco',
          opcoes: Object.keys(MATERIAIS).map(function (k) {
            return { v: k, t: MATERIAIS[k].nome + ' (ε = ' + (MATERIAIS[k].eps * 1000) + ' mm)' }; }) },
        { id: 'dz', label: 'Desnível geométrico Δz', min: -30, max: 80, step: 1, valor: 10, unidade: 'm',
          desc: 'Altura a vencer. Negativo = escoamento a favor da gravidade.' },

        { tipo: 'titulo', label: 'Escoamento' },
        { id: 'fluido', tipo: 'select', label: 'Fluido', valor: 'agua20',
          opcoes: Object.keys(FLUIDOS).map(function (k) { return { v: k, t: FLUIDOS[k].nome }; }) },
        { id: 'Q', label: 'Vazão Q', min: 0.1, max: 120, step: 0.1, valor: 8, unidade: 'L/s' },

        { tipo: 'titulo', label: 'Acessórios (perdas localizadas)' }
      ].concat(ACESSORIOS.map(function (a) {
        return { id: a.id, label: a.label + '  (K = ' + a.K + ')', min: 0, max: 12, step: 1,
                 valor: a.id === 'nCot90' ? 4 : a.id === 'nValG' ? 1 : 0, unidade: 'un' };
      })),
      graficos: [
        { id: 'sistema', titulo: 'Curva do sistema', xlabel: 'Vazão Q (L/s)',
          ylabel: 'Altura manométrica H (m)', aspect: 0.46, legendPos: 'topleft' },
        { id: 'reparticao', titulo: 'Composição da altura manométrica no ponto de operação',
          xlabel: '', ylabel: 'Altura (m)', aspect: 0.34, legend: false, grid: true,
          xcat: [{ v: 0, label: 'Δz  desnível' },
                 { v: 1, label: 'h_f  distribuída' },
                 { v: 2, label: 'h_m  localizadas' },
                 { v: 3, label: 'H  total' }] }
      ],
      saidas: [
        { id: 'v', label: 'Velocidade v' },
        { id: 'Re', label: 'Reynolds' },
        { id: 'reg', label: 'Regime' },
        { id: 'rr', label: 'Rugosidade ε/D' },
        { id: 'f', label: 'Fator de atrito f' },
        { id: 'hf', label: 'Perda distribuída' },
        { id: 'hm', label: 'Perdas localizadas' },
        { id: 'Leq', label: 'Compr. equivalente' },
        { id: 'H', label: 'Altura manométrica' },
        { id: 'Pot', label: 'Potência hidráulica' }
      ],
      formulas: [
        { g: 'Cinemática' },
        { tex: 'A = \\pi \\cdot \\frac{D^{2}}{4}', d: 'área da seção interna' },
        { tex: 'v = \\frac{Q}{A}', d: 'velocidade média', destaque: true },
        { tex: 'Re = v\\cdot \\frac{D}{\\nu } = \\rho \\cdot v\\cdot \\frac{D}{\\mu }', d: 'Reynolds; laminar até 2300, turbulento acima de 4000', destaque: true },

        { g: 'Fator de atrito' },
        { tex: 'f = \\frac{64}{Re}', d: 'LAMINAR — não depende da rugosidade', destaque: true },
        { tex: '\\frac{1}{\\sqrt{f}} = - 2\\cdot \\log_{10}[ \\frac{\\varepsilon }{3,7D} + \\frac{2,51}{Re\\cdot \\sqrt{f}} ]', d: 'Colebrook-White (implícita, resolvida por iteração)', destaque: true },
        { tex: 'f = \\frac{0{,}25}{\\left[\\log_{10}\\!\\left(\\frac{\\varepsilon}{3{,}7D} + \\frac{5{,}74}{Re^{0{,}9}}\\right)\\right]^{2}}', d: 'Swamee-Jain — explícita, erro < 1 % de Colebrook' },
        { tex: '\\frac{1}{\\sqrt{f}} = - 2\\cdot \\log_{10}[\\frac{\\varepsilon }{3,7D}]', d: 'turbulência plena: f só depende de ε/D (patamar de Moody)' },

        { g: 'Perdas de carga' },
        { tex: 'h_{f} = f\\cdot (\\frac{L}{D})\\cdot \\frac{v^{2}}{2g}', d: 'DISTRIBUÍDA (Darcy-Weisbach)', destaque: true },
        { tex: 'h_{m} = \\Sigma K\\cdot \\frac{v^{2}}{2g}', d: 'LOCALIZADA, uma parcela por acessório', destaque: true },
        { tex: 'L_{\\text{eq}} = K\\cdot \\frac{D}{f}', d: 'comprimento de tubo reto equivalente ao acessório' },

        { g: 'Equação da energia' },
        { tex: 'H = \\Delta z + \\Delta (\\frac{p}{\\gamma }) + \\Delta (\\frac{v^{2}}{2g}) + h_{f} + h_{m}', d: 'altura manométrica que a bomba precisa fornecer', destaque: true },
        { tex: 'H_{\\text{sistema}} = \\Delta z + k\\cdot Q^{2}', d: 'em regime turbulento a curva é praticamente uma parábola' },
        { tex: 'P_{\\text{hid}} = \\rho \\cdot g\\cdot Q\\cdot H', d: 'potência hidráulica; divida por η para a potência de eixo' },
        { tex: '\\gamma = \\rho \\cdot g', d: 'peso específico' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo (com os valores atuais)',
      passosAbertos: false,
      nota: 'Escoamento incompressível, permanente e plenamente desenvolvido, em tubo de seção circular constante. Colebrook resolvido por substituição sucessiva; na faixa crítica (2300 < Re < 4000) o valor é interpolado, pois ali o escoamento é instável e nenhuma correlação é confiável.',
      calcular: function (p, ctx) {
        var fl = FLUIDOS[p.fluido], mat = MATERIAIS[p.mat];
        var D = p.D / 1000, A = Math.PI * D * D / 4;
        var Q = p.Q / 1000;
        var v = Q / A;
        var Re = v * D / fl.nu;
        var rr = mat.eps / D;
        var f = fatorAtrito(Re, rr);
        var reg = regime(Re);

        var K = 0;
        ACESSORIOS.forEach(function (a) { K += (p[a.id] || 0) * a.K; });

        var hf = f * (p.L / D) * v * v / (2 * G);
        var hm = K * v * v / (2 * G);
        var H = p.dz + hf + hm;
        var Leq = f > 0 ? K * D / f : 0;
        var Pot = fl.rho * G * Q * Math.max(H, 0);

        /* ---- curva do sistema ---- */
        var Qs = Plot.linspace(0.05, Math.max(p.Q * 1.9, 1), 90);
        var Hs = Qs.map(function (q) {
          var vv = (q / 1000) / A;
          var rre = vv * D / fl.nu;
          var ff = fatorAtrito(rre, rr);
          return p.dz + (ff * (p.L / D) + K) * vv * vv / (2 * G);
        });
        var Hdist = Qs.map(function (q) {
          var vv = (q / 1000) / A;
          var ff = fatorAtrito(vv * D / fl.nu, rr);
          return p.dz + ff * (p.L / D) * vv * vv / (2 * G);
        });

        var gs = ctx.plot('sistema').clear();
        gs.line(Qs, Hs, { color: Plot.serie(0), width: 2.6, label: 'Sistema (total)' });
        gs.line(Qs, Hdist, { color: Plot.serie(1), width: 1.6, dash: [5, 4], label: 'Só perda distribuída' });
        gs.hline(p.dz, { color: Plot.serie(2), dash: [4, 4], width: 1.4, text: 'Δz = ' + p.dz + ' m' });
        gs.marker(p.Q, H, 'operação: H = ' + Plot.sig(H, 4) + ' m', { color: Plot.serie(6) });
        /* limite laminar/turbulento em vazão */
        var Qlam = 2300 * fl.nu * D / 4 * Math.PI * 1000 / 1;
        Qlam = 2300 * fl.nu * Math.PI * D / 4 * 1000;
        if (Qlam > Qs[0] && Qlam < Qs[Qs.length - 1]) {
          gs.vline(Qlam, { color: Plot.serie(7), dash: [3, 3], width: 1.2, text: 'Re = 2300' });
        }
        gs.draw();

        /* ---- repartição ----
           Tres parcelas mais o total. Os limites verticais sao fixados com
           folga para o rotulo de cada barra nao encostar na moldura, e o
           rotulo vai abaixo da barra quando a parcela e negativa (Delta z
           negativo significa recalque, com o reservatorio acima da bomba). */
        var parcelas = [p.dz, hf, hm, H];
        var gr = ctx.plot('reparticao').clear();
        var yAlto = Math.max.apply(null, parcelas.concat([0]));
        var yBaixo = Math.min.apply(null, parcelas.concat([0]));
        var faixa = Math.max(yAlto - yBaixo, 1e-6);
        gr.setLimits([-0.62, 3.62], [yBaixo - faixa * 0.10, yAlto + faixa * 0.20]);
        var cores = [Plot.serie(2), Plot.serie(3), Plot.serie(5), Plot.serie(0)];
        parcelas.forEach(function (val, i) {
          gr.bars([i], [val], { color: cores[i], barw: 0.54 });
        });
        var rot = ['Δz', 'h_f', 'h_m', 'H'];
        parcelas.forEach(function (val, i) {
          gr.text(i, val, rot[i] + ' = ' + Plot.sig(val, 3) + ' m',
            { align: 'center', dy: val >= 0 ? -7 : 13, size: 11.5 });
        });
        gr.draw();

        /* ---- passo a passo ---- */
        var sig = Plot.sig;
        var nt = Plot.numTex;
        var swj = 0.25 / Math.pow(Math.log(rr / 3.7 + 5.74 / Math.pow(Re, 0.9)) / Math.LN10, 2);

        ctx.setPassos([
          { t: 'Dados do problema',
            c: 'D = ' + p.D + ' mm = ' + sig(D, 4) + ' m\n' +
               'L = ' + p.L + ' m       Δz = ' + p.dz + ' m\n' +
               'Q = ' + p.Q + ' L/s = ' + sig(Q, 4) + ' m³/s\n' +
               'Fluido: ' + fl.nome + '   ρ = ' + fl.rho + ' kg/m³   ν = ' + fl.nu.toExponential(3) + ' m²/s\n' +
               'Tubo: ' + mat.nome + '   ε = ' + (mat.eps * 1000) + ' mm' },

          { t: 'Área da seção',
            tex: 'A = \\frac{\\pi D^{2}}{4}',
            texSub: 'A = \\frac{\\pi \\cdot (' + nt(D) + ')^{2}}{4} = ' + nt(A) + '\\ \\text{m}^{2}' },

          { t: 'Velocidade média',
            tex: 'v = \\frac{Q}{A}',
            texSub: 'v = \\frac{' + nt(Q) + '}{' + nt(A) + '} = ' + nt(v) + '\\ \\text{m/s}',
            obs: 'Faixa econômica para água: 1 a 3 m/s.' },

          { t: 'Número de Reynolds',
            tex: 'Re = \\frac{v D}{\\nu} = \\frac{4Q}{\\pi D \\nu}',
            texSub: 'Re = \\frac{4 \\cdot ' + nt(Q) + '}{\\pi \\cdot ' + nt(D) + ' \\cdot ' +
                    nt(fl.nu) + '} = ' + nt(Re, 5),
            r: 'Regime: ' + reg.nome,
            obs: reg.nome === 'Laminar'
              ? 'Re < 2300: a rugosidade não influencia o fator de atrito.'
              : reg.nome === 'Transição'
                ? 'Zona crítica: nenhuma correlação é confiável entre 2300 e 4000.'
                : 'Re > 4000: turbulento, a rugosidade entra na conta.' },

          { t: 'Rugosidade relativa',
            tex: '\\frac{\\varepsilon}{D}',
            texSub: '\\frac{\\varepsilon}{D} = \\frac{' + (mat.eps * 1000) + '}{' + p.D +
                    '} = ' + nt(rr, 3),
            obs: 'É a curva do diagrama de Moody em que o ponto de operação cai.' },

          reg.nome === 'Laminar'
            ? { t: 'Fator de atrito (laminar)',
                tex: 'f = \\frac{64}{Re}',
                texSub: 'f = \\frac{64}{' + nt(Re, 5) + '} = ' + nt(f, 4),
                obs: 'No regime laminar f não depende da rugosidade.' }
            : { t: 'Fator de atrito — Colebrook-White',
                tex: '\\frac{1}{\\sqrt{f}} = -2\\log_{10}\\left[\\frac{\\varepsilon}{3{,}7D} + ' +
                     '\\frac{2{,}51}{Re\\sqrt{f}}\\right]',
                texSub: '\\frac{1}{\\sqrt{f}} = -2\\log_{10}\\left[\\frac{' + nt(rr, 3) +
                        '}{3{,}7} + \\frac{2{,}51}{' + nt(Re, 5) + '\\sqrt{f}}\\right] ' +
                        '\\;\\Rightarrow\\; f = ' + nt(f, 4),
                obs: 'Equação implícita, resolvida por iteração. Conferindo por Swamee-Jain (explícita): f = ' +
                     sig(swj, 4) + ', diferença de ' + sig(Math.abs(swj - f) / f * 100, 2) + ' %.' },

          { t: 'Perda de carga distribuída — Darcy-Weisbach',
            tex: 'h_f = f \\cdot \\frac{L}{D} \\cdot \\frac{v^{2}}{2g}',
            texSub: 'h_f = ' + nt(f, 4) + ' \\cdot \\frac{' + p.L + '}{' + nt(D) +
                    '} \\cdot \\frac{(' + nt(v) + ')^{2}}{2 \\cdot 9{,}81} = ' + nt(hf) + '\\ \\text{m}',
            obs: 'Cresce com v² (logo com Q²) e com 1/D⁵ a vazão fixa.' },

          { t: 'Perdas localizadas',
            tex: 'h_m = \\sum K \\cdot \\frac{v^{2}}{2g} \\qquad L_{\\text{eq}} = \\frac{\\sum K \\cdot D}{f}',
            texSub: 'h_m = ' + nt(K, 4) + ' \\cdot \\frac{(' + nt(v) + ')^{2}}{2 \\cdot 9{,}81} = ' +
                    nt(hm) + '\\ \\text{m} \\qquad L_{eq} = ' + nt(Leq) + '\\ \\text{m}',
            obs: K > 0
              ? 'Os acessórios equivalem a ' + sig(Leq, 3) + ' m de tubo reto (' +
                sig(Leq / p.L * 100, 3) + ' % do trecho).'
              : 'Nenhum acessório selecionado.' },

          { t: 'Altura manométrica total',
            tex: 'H = \\Delta z + h_f + h_m',
            texSub: 'H = ' + p.dz + ' + ' + nt(hf) + ' + ' + nt(hm) + ' = ' + nt(H) + '\\ \\text{m}',
            obs: 'É a altura que a bomba precisa fornecer nessa vazão.' },

          { t: 'Potência hidráulica',
            tex: 'P = \\rho\\, g\\, Q\\, H',
            texSub: 'P = ' + fl.rho + ' \\cdot 9{,}81 \\cdot ' + nt(Q) + ' \\cdot ' + nt(H) +
                    ' = ' + nt(Pot) + '\\ \\text{W} = ' + nt(Pot / 1000, 3) + '\\ \\text{kW}',
            obs: 'Potência entregue ao fluido. A de eixo é P/η, com η da bomba entre 0,55 e 0,80.' }
        ]);

        return {
          v: { v: v, u: 'm/s', classe: v > 3 ? 'alerta' : v < 0.5 ? '' : 'ok' },
          Re: { v: Re, u: '' },
          reg: { v: reg.nome, u: '', classe: reg.cls },
          rr: { v: rr, u: '' },
          f: { v: f, u: '' },
          hf: { v: hf, u: 'm', classe: 'destaque' },
          hm: { v: hm, u: 'm' },
          Leq: { v: Leq, u: 'm' },
          H: { v: H, u: 'm', classe: 'destaque' },
          Pot: { v: Pot / 1000, u: 'kW' }
        };
      }
    });
  })();

  /* ============================================================
     2. Diagrama de Moody
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-moody')) return;

    Sim.build('#sim-moody', {
      titulo: 'Diagrama de Moody',
      descricao: 'O mapa do fator de atrito. Mova o ponto de operação e veja quando f deixa de depender de Re e passa a depender só da rugosidade.',
      controles: [
        { id: 'logRe', label: 'Reynolds (log₁₀)', min: 2.6, max: 8, step: 0.02, valor: 5.1, unidade: '',
          desc: 'De 400 a 10⁸. O eixo do diagrama é logarítmico.' },
        { id: 'rrExp', label: 'Rugosidade relativa ε/D (log₁₀)', min: -6, max: -1.3, step: 0.05, valor: -3.2,
          unidade: '', desc: 'De 10⁻⁶ (tubo liso) a 5×10⁻² (muito rugoso).' },
        { tipo: 'separador' },
        { id: 'mostrarLiso', tipo: 'check', label: 'Mostrar curva de tubo liso', valor: true },
        { id: 'mostrarPleno', tipo: 'check', label: 'Mostrar limite de turbulência plena', valor: true,
          desc: 'À direita dessa linha, f é constante: só a rugosidade importa.' }
      ],
      graficos: [
        { id: 'moody', titulo: 'Fator de atrito de Darcy', xlabel: 'log₁₀ (Re)',
          ylabel: 'f', aspect: 0.55, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Re', label: 'Reynolds' },
        { id: 'rr', label: 'ε/D' },
        { id: 'reg', label: 'Regime' },
        { id: 'f', label: 'Fator de atrito f' },
        { id: 'zona', label: 'Zona do diagrama' },
        { id: 'fpleno', label: 'f na turbulência plena' }
      ],
      formulas: [
        { g: 'As quatro zonas do diagrama' },
        { tex: 'f = \\frac{64}{Re}', d: 'ZONA LAMINAR (Re < 2300): reta descendente, independe de ε/D', destaque: true },
        { tex: '2300 < Re < 4000', d: 'ZONA CRÍTICA: instável, sem correlação confiável' },
        { tex: '\\frac{1}{\\sqrt{f}} = - 2\\cdot \\log_{10}[\\frac{\\varepsilon }{3,7D} + \\frac{2,51}{Re\\sqrt{f}}]', d: 'ZONA DE TRANSIÇÃO: f depende de Re E de ε/D', destaque: true },
        { tex: '\\frac{1}{\\sqrt{f}} = - 2\\cdot \\log_{10}[\\frac{\\varepsilon }{3,7D}]', d: 'TURBULÊNCIA PLENA: as curvas ficam horizontais, f só depende de ε/D', destaque: true },

        { g: 'Fronteira da turbulência plena' },
        { tex: 'Re\\cdot (\\frac{\\varepsilon }{D})\\cdot \\sqrt{f} > 200', d: 'critério usual para considerar f independente de Re' },
        { tex: '\\delta_{v} \\approx \\frac{5\\nu }{u}*', d: 'espessura da subcamada viscosa; quando δ_v < ε, as asperezas ficam expostas' },

        { g: 'Tubo hidraulicamente liso' },
        { tex: '\\frac{1}{\\sqrt{f}} = 2\\cdot \\log_{10}(Re\\sqrt{f}) - 0,8', d: 'Prandtl — limite de ε/D → 0' },
        { tex: 'f = 0,316\\cdot Re^(- 0,25)', d: 'Blasius, válida para 4000 < Re < 10⁵ em tubo liso' }
      ],
      passos: [],
      passosTitulo: 'Como ler o diagrama neste ponto',
      passosAbertos: false,
      nota: 'O eixo horizontal está em log₁₀(Re) e o vertical em escala linear de f, para facilitar a leitura. No diagrama clássico ambos são logarítmicos, mas as zonas e o comportamento das curvas são os mesmos.',
      calcular: function (p, ctx) {
        var Re = Math.pow(10, p.logRe);
        var rr = Math.pow(10, p.rrExp);
        var f = fatorAtrito(Re, rr);
        var reg = regime(Re);
        var fpleno = Math.pow(-2 * Math.log(rr / 3.7) / Math.LN10, -2);

        var g = ctx.plot('moody').clear();

        /* ramo laminar */
        var xl = Plot.linspace(2.6, Math.log10(2300), 30);
        g.line(xl, xl.map(function (x) { return 64 / Math.pow(10, x); }),
          { color: Plot.serie(7), width: 2.6, label: 'Laminar f = 64/Re' });

        /* família de curvas ε/D */
        var familia = [1e-6, 1e-5, 5e-5, 2e-4, 1e-3, 4e-3, 1.5e-2, 5e-2];
        var xt = Plot.linspace(Math.log10(4000), 8, 90);
        familia.forEach(function (r, i) {
          g.line(xt, xt.map(function (x) { return fatorAtrito(Math.pow(10, x), r); }),
            { color: Plot.serie(i % 8), width: 1.3 });
          var fFim = fatorAtrito(1e8, r);
          g.text(8, fFim, ' ' + (r >= 1e-3 ? r.toFixed(3) : r.toExponential(0)),
            { align: 'right', size: 9.5, baseline: 'bottom', color: Plot.serie(i % 8) });
        });

        if (p.mostrarLiso) {
          g.line(xt, xt.map(function (x) { return fatorAtrito(Math.pow(10, x), 0); }),
            { color: Plot.cssVar('--text', '#111'), width: 2, dash: [6, 3], label: 'Tubo liso' });
        }
        if (p.mostrarPleno) {
          /* lugar geométrico Re·(ε/D)·√f = 200 */
          var xp = [], yp = [];
          familia.forEach(function (r) {
            var ff = Math.pow(-2 * Math.log(r / 3.7) / Math.LN10, -2);
            var ReP = 200 / (r * Math.sqrt(ff));
            if (ReP > 4000 && ReP < 1e8) { xp.push(Math.log10(ReP)); yp.push(ff); }
          });
          g.line(xp, yp, { color: Plot.serie(3), width: 2, dash: [3, 3], label: 'Início da turbulência plena' });
        }

        /* zona crítica */
        g.custom(function (c, pl) {
          var X1 = pl.px(Math.log10(2300)), X2 = pl.px(Math.log10(4000));
          c.fillStyle = Plot.cssVar('--warn', '#a86500');
          c.globalAlpha = 0.13;
          c.fillRect(X1, pl._area.y, X2 - X1, pl._area.h);
          c.globalAlpha = 1;
          c.fillStyle = Plot.cssVar('--warn', '#a86500');
          c.save();
          c.translate((X1 + X2) / 2, pl._area.y + 46);
          c.rotate(-Math.PI / 2);
          c.font = '9.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'middle';
          c.fillText('zona crítica', 0, 0);
          c.restore();
        });

        g.marker(p.logRe, f, 'operação: f = ' + Plot.sig(f, 4), { color: Plot.serie(6), r: 5.5 });
        g.setLimits([2.6, 8], [0, 0.105]).draw();

        var criterio = Re * rr * Math.sqrt(f);
        var ntm = Plot.numTex, sgm = Plot.sig;
        var fLiso = fatorAtrito(Re, 0);
        ctx.setPassos([
          { t: 'Ponto de operação escolhido',
            texSub: 'Re = ' + ntm(Re, 4) + ' \\qquad \\frac{\\varepsilon}{D} = ' + ntm(rr, 3),
            obs: 'O diagrama de Moody é lido cruzando estes dois valores.' },
          { t: 'Em que zona o ponto caiu',
            c: 'Re < 2300 ........ laminar\\n' +
               '2300 a 4000 ...... crítica (instável)\\n' +
               'Re > 4000 ........ turbulenta',
            r: 'Zona: ' + zona,
            obs: Re < 2300
              ? 'No laminar a rugosidade não influencia: f depende só de Re.'
              : 'Acima de 4000 a rugosidade relativa entra na conta.' },
          Re < 2300
            ? { t: 'Fator de atrito (laminar)',
                tex: 'f = \\frac{64}{Re}',
                texSub: 'f = \\frac{64}{' + ntm(Re, 4) + '} = ' + ntm(f, 4) }
            : { t: 'Fator de atrito (Colebrook)',
                tex: '\\frac{1}{\\sqrt{f}} = -2\\log_{10}\\left[\\frac{\\varepsilon}{3{,}7D} + \\frac{2{,}51}{Re\\sqrt{f}}\\right]',
                texSub: 'f = ' + ntm(f, 4),
                obs: 'Tubo liso no mesmo Reynolds daria f = ' + sgm(fLiso, 4) +
                     '. A rugosidade acrescenta ' + sgm((f / fLiso - 1) * 100, 3) + ' % de atrito.' },
          { t: 'Limite da turbulência plena',
            tex: 'Re \\cdot \\frac{\\varepsilon}{D} \\cdot \\sqrt{f} > 200',
            texSub: ntm(Re, 4) + ' \\cdot ' + ntm(rr, 3) + ' \\cdot \\sqrt{' + ntm(f, 4) + '} = ' +
                    ntm(criterio, 4),
            r: criterio > 200 ? 'Turbulência plena: f não depende mais de Re'
                              : 'Ainda na transição: f depende de Re E de ε/D',
            obs: 'Na turbulência plena a subcamada viscosa fica mais fina que as asperezas, que passam a se projetar no escoamento.' },
          { t: 'Valor assintótico',
            tex: '\\frac{1}{\\sqrt{f}} = -2\\log_{10}\\left(\\frac{\\varepsilon}{3{,}7D}\\right)',
            texSub: 'f_{\\infty} = ' + ntm(fpleno, 4),
            obs: 'É o patamar horizontal da curva. O f atual está a ' +
                 sgm(Math.abs(f / fpleno - 1) * 100, 3) + ' % dele.' }
        ]);


        var zona = Re < 2300 ? 'Laminar'
                 : Re < 4000 ? 'Crítica'
                 : criterio > 200 ? 'Turbulência plena'
                 : 'Transição';

        return {
          Re: { v: Re, u: '' },
          rr: { v: rr, u: '' },
          reg: { v: reg.nome, u: '', classe: reg.cls },
          f: { v: f, u: '', classe: 'destaque' },
          zona: { v: zona, u: '', classe: zona === 'Crítica' ? 'alerta' : zona === 'Turbulência plena' ? 'ok' : '' },
          fpleno: { v: fpleno, u: '' }
        };
      }
    });
  })();

  /* ============================================================
     3. Bernoulli — Venturi com linhas de energia
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-bernoulli')) return;

    Sim.build('#sim-bernoulli', {
      titulo: 'Bernoulli em um Venturi',
      descricao: 'Estreitar a seção acelera o fluido e derruba a pressão. As linhas de energia (LE) e piezométrica (LP) mostram para onde vai cada parcela da carga.',
      controlesLargos: true,
      controles: [
        { id: 'D1', label: 'Diâmetro da tubulação D₁', min: 40, max: 300, step: 5, valor: 100, unidade: 'mm' },
        { id: 'beta', label: 'Relação de diâmetros D₂/D₁', min: 0.25, max: 0.9, step: 0.01, valor: 0.5, unidade: '',
          desc: 'Garganta do Venturi. Valores usuais de medição: 0,4 a 0,75.' },
        { id: 'Q', label: 'Vazão Q', min: 1, max: 120, step: 1, valor: 20, unidade: 'L/s' },
        { id: 'p1', label: 'Pressão de entrada p₁', min: 20, max: 600, step: 5, valor: 200, unidade: 'kPa' },
        { tipo: 'separador' },
        { id: 'fluido', tipo: 'select', label: 'Fluido', valor: 'agua20',
          opcoes: Object.keys(FLUIDOS).map(function (k) { return { v: k, t: FLUIDOS[k].nome }; }) },
        { id: 'perda', tipo: 'check', label: 'Incluir perda de carga real', valor: true,
          desc: 'Sem perdas, a LE é horizontal — é a hipótese de Bernoulli ideal.' },
        { id: 'Cd', label: 'Coeficiente de descarga Cd', min: 0.90, max: 1.0, step: 0.005, valor: 0.98,
          unidade: '', desc: 'Venturi bem construído: 0,97 a 0,99. Placa de orifício: ~0,61.' }
      ],
      graficos: [
        { id: 'duto', axes: false, height: 300, grid: false, legend: false },
        { id: 'cargas', titulo: 'Distribuição das parcelas de carga ao longo do Venturi',
          xlabel: 'Posição', ylabel: 'Carga (m)', aspect: 0.34, legendPos: 'bottomleft' }
      ],
      saidas: [
        { id: 'v1', label: 'v₁ (tubulação)' },
        { id: 'v2', label: 'v₂ (garganta)' },
        { id: 'p2', label: 'p₂ (garganta)' },
        { id: 'dp', label: 'Δp medido' },
        { id: 'Re', label: 'Reynolds na garganta' },
        { id: 'cav', label: 'Risco de cavitação' }
      ],
      formulas: [
        { g: 'Conservação de massa' },
        { tex: 'Q = A_{1}\\cdot v_{1} = A_{2}\\cdot v_{2}', d: 'continuidade para fluido incompressível', destaque: true },
        { tex: 'v_{2} = v_{1}\\cdot (\\frac{D_{1}}{D_{2}})^{2} = \\frac{v_{1}}{\\beta^{2}}', d: 'a velocidade cresce com o QUADRADO da razão de diâmetros', destaque: true },

        { g: 'Equação de Bernoulli' },
        { tex: '\\frac{p}{\\gamma } + \\frac{v^{2}}{2g} + z = \\text{constante}', d: 'ao longo de uma linha de corrente, sem atrito', destaque: true },
        { tex: '\\frac{p_{1}}{\\gamma } + \\frac{v_{1}^{2}}{2g} = \\frac{p_{2}}{\\gamma } + \\frac{v_{2}^{2}}{2g}', d: 'Venturi horizontal: a cota z se cancela' },
        { tex: '\\Delta p = \\frac{\\rho }{2\\cdot} (v_{2}^{2} - v_{1}^{2})', d: 'queda de pressão na garganta', destaque: true },
        { tex: '\\frac{p}{\\gamma } = \\text{carga de pressão}', d: 'v²/2g = carga cinética · z = carga de posição' },

        { g: 'Medição de vazão' },
        { tex: 'Q = Cd\\cdot A_{2}\\cdot \\sqrt{\\frac{2\\Delta p}{\\rho (1 - \\beta^{4})}}', d: 'equação do medidor Venturi', destaque: true },
        { tex: '\\beta = \\frac{D_{2}}{D_{1}}', d: 'razão de diâmetros' },
        { tex: 'Cd \\approx 0,98 (\\text{Venturi}) \\cdot 0,61 (\\text{placa de} \\text{orifício})', d: 'corrige as perdas e a contração da veia' },

        { g: 'Linhas de referência' },
        { tex: 'LE = \\frac{p}{\\gamma } + \\frac{v^{2}}{2g} + z', d: 'linha de energia — só desce, e apenas por perda', destaque: true },
        { tex: 'LP = \\frac{p}{\\gamma } + z', d: 'linha piezométrica — sobe e desce com a velocidade' },
        { tex: 'LE - LP = \\frac{v^{2}}{2g}', d: 'a distância entre elas é a carga cinética' },

        { g: 'Cavitação' },
        { tex: 'p_{2} > p_{\\text{vapor}}', d: 'condição para não cavitar; água a 20 °C: p_v ≈ 2,34 kPa abs', destaque: true }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Escoamento incompressível, permanente, eixo horizontal (z constante). A perda de carga real é estimada por um coeficiente equivalente ao Cd informado; um Venturi recupera de 85 a 95 % da queda de pressão, ao contrário da placa de orifício.',
      calcular: function (p, ctx) {
        var fl = FLUIDOS[p.fluido];
        var gama = fl.rho * G;
        var D1 = p.D1 / 1000, D2 = D1 * p.beta;
        var A1 = Math.PI * D1 * D1 / 4, A2 = Math.PI * D2 * D2 / 4;
        var Q = p.Q / 1000;
        var v1 = Q / A1, v2 = Q / A2;
        var p1 = p.p1 * 1000;

        var dpIdeal = fl.rho / 2 * (v2 * v2 - v1 * v1);
        /* perda irreversível estimada a partir do Cd */
        var perdaTotal = p.perda ? (1 / (p.Cd * p.Cd) - 1) * dpIdeal : 0;
        var p2 = p1 - dpIdeal;
        var p3 = p1 - perdaTotal;                       /* recuperada na saída */
        var Re2 = v2 * D2 / fl.nu;

        /* ---------- desenho do duto ---------- */
        var xs = [0, 0.3, 0.42, 0.58, 0.72, 1];         /* posições relativas */
        var rr = [1, 1, p.beta, p.beta, 1, 1];
        var dd = ctx.plot('duto').clear();
        dd.setLimits([-0.06, 1.18], [-1.5, 1.9]);
        dd.custom(function (c, pl) {
          var yEixo = pl.py(0);
          var esc = (pl.py(0) - pl.py(1)) * 0.85;
          /* parede do duto */
          c.strokeStyle = Plot.cssVar('--text', '#111');
          c.lineWidth = 2.2;
          [1, -1].forEach(function (sg) {
            c.beginPath();
            xs.forEach(function (x, i) {
              var X = pl.px(x), Y = yEixo - sg * rr[i] * esc * 0.5;
              if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
            });
            c.stroke();
          });
          /* fluido */
          c.fillStyle = Plot.serie(0);
          c.globalAlpha = 0.18;
          c.beginPath();
          xs.forEach(function (x, i) {
            var X = pl.px(x), Y = yEixo - rr[i] * esc * 0.5;
            if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
          });
          for (var i = xs.length - 1; i >= 0; i--) {
            c.lineTo(pl.px(xs[i]), yEixo + rr[i] * esc * 0.5);
          }
          c.closePath(); c.fill();
          c.globalAlpha = 1;

          /* setas de velocidade proporcionais */
          c.strokeStyle = Plot.serie(1); c.fillStyle = Plot.serie(1); c.lineWidth = 2;
          [[0.15, v1], [0.5, v2], [0.88, v1]].forEach(function (par) {
            var X = pl.px(par[0]), comp = Math.min(52, 9 + par[1] * 4.2);
            c.beginPath(); c.moveTo(X - comp / 2, yEixo); c.lineTo(X + comp / 2 - 5, yEixo); c.stroke();
            c.beginPath();
            c.moveTo(X + comp / 2, yEixo);
            c.lineTo(X + comp / 2 - 8, yEixo - 4.5);
            c.lineTo(X + comp / 2 - 8, yEixo + 4.5);
            c.closePath(); c.fill();
            c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'top';
            c.fillText(Plot.sig(par[1], 3) + ' m/s', X, yEixo + 9);
          });

          /* rotulos de diametro e pressao */
          c.fillStyle = Plot.cssVar('--text-muted', '#666');
          c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'bottom';
          c.fillText('D₁ = ' + p.D1 + ' mm', pl.px(0.15), yEixo - esc * 0.5 - 8);
          c.fillText('D₂ = ' + Plot.sig(D2 * 1000, 3) + ' mm', pl.px(0.5), yEixo - esc * 0.5 * p.beta - 8);

          c.fillStyle = Plot.serie(2);
          c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
          c.fillText('p₁ = ' + Plot.sig(p1 / 1000, 4) + ' kPa', pl.px(0.06), yEixo + esc * 0.62);
          c.fillStyle = p2 < 2340 ? Plot.cssVar('--err', '#c33') : Plot.serie(2);
          c.fillText('p₂ = ' + Plot.sig(p2 / 1000, 4) + ' kPa', pl.px(0.5), yEixo + esc * 0.62);
          c.fillStyle = Plot.serie(2);
          c.fillText('p₃ = ' + Plot.sig(p3 / 1000, 4) + ' kPa', pl.px(0.93), yEixo + esc * 0.62);
        });
        dd.draw();

        /* ---------- linhas de energia ---------- */
        var xg = [0, 0.3, 0.5, 0.7, 1];
        var vg = [v1, v1, v2, v1, v1];
        var pg = [p1, p1 - perdaTotal * 0.12, p2, p1 - perdaTotal * 0.75, p3];
        var cargaP = pg.map(function (pp) { return pp / gama; });
        var cargaV = vg.map(function (vv) { return vv * vv / (2 * G); });
        var LE = cargaP.map(function (cp, i) { return cp + cargaV[i]; });

        var gc = ctx.plot('cargas').clear();
        gc.area(xg, cargaP, { base: 0, color: Plot.serie(2), alpha: 0.16, label: 'Carga de pressão p/γ' });
        gc.line(xg, LE, { color: Plot.serie(7), width: 2.6, label: 'Linha de energia (LE)' });
        gc.line(xg, cargaP, { color: Plot.serie(2), width: 2.2, label: 'Linha piezométrica (LP)' });
        gc.line(xg, cargaV, { color: Plot.serie(1), width: 1.8, dash: [5, 4], label: 'Carga cinética v²/2g' });
        gc.setLimits([0, 1], null).draw();

        var pv = 2340;                                    /* pressão de vapor da água a 20 °C, Pa abs */
        var cav = p2 < pv;

        ctx.setPassos([
          { t: 'Continuidade',
            c: 'A₁ = π·D₁²/4 = ' + Plot.sig(A1 * 1e4, 4) + ' cm²\n' +
               'A₂ = π·D₂²/4 = ' + Plot.sig(A2 * 1e4, 4) + ' cm²   (D₂ = β·D₁ = ' + Plot.sig(D2 * 1000, 4) + ' mm)\n' +
               'v₁ = Q/A₁ = ' + Plot.sig(Q, 4) + '/' + Plot.sig(A1, 4) + '\n' +
               'v₂ = Q/A₂ = ' + Plot.sig(Q, 4) + '/' + Plot.sig(A2, 4),
            r: 'v₁ = ' + Plot.sig(v1, 4) + ' m/s      v₂ = ' + Plot.sig(v2, 4) + ' m/s',
            obs: 'v₂/v₁ = 1/β² = ' + Plot.sig(1 / (p.beta * p.beta), 4) + '×. Reduzir o diâmetro pela metade quadruplica a velocidade.' },
          { t: 'Bernoulli entre 1 e 2 (duto horizontal)',
            c: 'p₁/γ + v₁²/2g = p₂/γ + v₂²/2g\n' +
               'Δp = ρ/2·(v₂² − v₁²) = ' + fl.rho + '/2 × (' + Plot.sig(v2, 4) + '² − ' + Plot.sig(v1, 4) + '²)',
            r: 'Δp = ' + Plot.sig(dpIdeal / 1000, 4) + ' kPa   →   p₂ = ' + Plot.sig(p2 / 1000, 4) + ' kPa',
            obs: 'A carga cinética ganha exatamente o que a carga de pressão perde — é isso que a linha de energia horizontal significa.' },
          { t: 'Verificação de cavitação',
            c: 'p₂ = ' + Plot.sig(p2 / 1000, 4) + ' kPa   versus   p_vapor ≈ 2,34 kPa (água a 20 °C)',
            r: cav ? 'p₂ < p_vapor  →  CAVITA' : 'p₂ > p_vapor  →  sem cavitação',
            obs: 'Se a pressão na garganta cai abaixo da pressão de vapor, formam-se bolhas que implodem a jusante e corroem o metal. É o limite prático do estrangulamento.' },
          { t: 'Vazão medida pelo Δp',
            c: 'Q = Cd·A₂·√[ 2Δp / (ρ·(1 − β⁴)) ]\n' +
               'β⁴ = ' + Plot.sig(Math.pow(p.beta, 4), 4) + '\n' +
               'Q = ' + p.Cd + ' × ' + Plot.sig(A2, 4) + ' × √[2×' + Plot.sig(dpIdeal, 4) +
               '/(' + fl.rho + '×' + Plot.sig(1 - Math.pow(p.beta, 4), 4) + ')]',
            r: 'Q = ' + Plot.sig(p.Cd * A2 * Math.sqrt(2 * dpIdeal / (fl.rho * (1 - Math.pow(p.beta, 4)))) * 1000, 4) + ' L/s',
            obs: 'É assim que o Venturi funciona como medidor: mede-se Δp com um manômetro diferencial e calcula-se Q.' },
          { t: 'Reynolds na garganta',
            c: 'Re₂ = v₂·D₂/ν = ' + Plot.sig(v2, 4) + ' × ' + Plot.sig(D2, 4) + ' / ' + fl.nu.toExponential(3),
            r: 'Re₂ = ' + Plot.sig(Re2, 4) + '  (' + regime(Re2).nome + ')',
            obs: 'O Cd tabelado dos medidores só vale acima de um Reynolds mínimo (tipicamente 2×10⁵ para Venturi).' }
        ]);

        return {
          v1: { v: v1, u: 'm/s' },
          v2: { v: v2, u: 'm/s', classe: 'destaque' },
          p2: { v: p2 / 1000, u: 'kPa', classe: cav ? 'alerta' : '' },
          dp: { v: dpIdeal / 1000, u: 'kPa' },
          Re: { v: Re2, u: '' },
          cav: { v: cav ? 'CAVITA' : 'Sem risco', u: '', classe: cav ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     4. Hidrostática — força em comporta plana
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-hidrostatica')) return;

    Sim.build('#sim-hidrostatica', {
      titulo: 'Força hidrostática em comporta plana',
      descricao: 'A pressão cresce linearmente com a profundidade, então a resultante não age no centroide: ela desce para o centro de pressão. É esse braço extra que dimensiona a dobradiça.',
      controles: [
        { id: 'h', label: 'Altura da comporta h', min: 0.5, max: 8, step: 0.1, valor: 3, unidade: 'm' },
        { id: 'b', label: 'Largura da comporta b', min: 0.5, max: 10, step: 0.1, valor: 2, unidade: 'm' },
        { id: 'ys', label: 'Profundidade do topo', min: 0, max: 12, step: 0.1, valor: 0, unidade: 'm',
          desc: 'Zero = topo da comporta na superfície livre.' },
        { tipo: 'separador' },
        { id: 'fluido', tipo: 'select', label: 'Fluido', valor: 'agua20',
          opcoes: Object.keys(FLUIDOS).map(function (k) { return { v: k, t: FLUIDOS[k].nome }; }) },
        { id: 'theta', label: 'Inclinação com a horizontal', min: 20, max: 90, step: 1, valor: 90, unidade: '°',
          desc: '90° = comporta vertical.' }
      ],
      graficos: [
        { id: 'esq', axes: false, height: 330, grid: false, legend: false }
      ],
      saidas: [
        { id: 'hc', label: 'Profundidade do centroide' },
        { id: 'pc', label: 'Pressão no centroide' },
        { id: 'F', label: 'Força resultante' },
        { id: 'ycp', label: 'Centro de pressão (na placa)' },
        { id: 'ecc', label: 'Excentricidade y_cp − y_c' },
        { id: 'Mdob', label: 'Momento na base' }
      ],
      formulas: [
        { g: 'Distribuição de pressão' },
        { tex: 'p(h) = p_{0} + \\rho \\cdot g\\cdot h', d: 'cresce linearmente com a profundidade', destaque: true },
        { tex: '\\gamma = \\rho \\cdot g', d: 'peso específico; água: 9 810 N/m³' },

        { g: 'Força resultante' },
        { tex: 'F = p_{c}\\cdot A = \\rho \\cdot g\\cdot h_{c}\\cdot A', d: 'pressão no CENTROIDE vezes a área', destaque: true },
        { tex: 'h_{c} = y_{c}\\cdot \\operatorname{sen} \\theta', d: 'profundidade do centroide; θ = inclinação da placa' },
        { tex: 'F = \\rho \\cdot g\\cdot (\\frac{h}{2})\\cdot (h\\cdot b)', d: 'comporta retangular vertical com topo na superfície' },

        { g: 'Centro de pressão' },
        { tex: 'y_{\\text{cp}} = y_{c} + \\frac{I_{\\text{xc}}}{y_{c}\\cdot A}', d: 'sempre ABAIXO do centroide', destaque: true },
        { tex: 'I_{\\text{xc}} = b\\cdot \\frac{h^{3}}{12}', d: 'momento de inércia da placa retangular em torno do seu centroide' },
        { tex: 'y_{\\text{cp}} = \\frac{2h}{3}', d: 'caso particular: retângulo vertical com topo na superfície', destaque: true },
        { tex: 'e = \\frac{I_{\\text{xc}}}{y_{c}\\cdot A}', d: 'excentricidade; diminui à medida que a placa afunda' },

        { g: 'Momento na dobradiça' },
        { tex: 'M = F\\cdot (\\text{dist}\\hat{a}\\text{ncia do eixo ao centro de} \\text{pressão})', d: 'é o que dimensiona o eixo e o atuador' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Fluido em repouso, densidade constante e pressão atmosférica atuando nos dois lados da comporta (por isso trabalha-se com pressão manométrica). Para a placa inclinada, y é medido ao longo da placa a partir da superfície livre.',
      calcular: function (p, ctx) {
        var fl = FLUIDOS[p.fluido];
        var gama = fl.rho * G;
        var th = p.theta * Math.PI / 180;
        var A = p.h * p.b;

        /* y medido ao longo da placa a partir da superficie livre */
        var yTopo = p.ys / Math.sin(th);
        var yc = yTopo + p.h / 2;
        var hc = yc * Math.sin(th);
        var pc = gama * hc;
        var F = pc * A;
        var Ixc = p.b * Math.pow(p.h, 3) / 12;
        var ecc = Ixc / (yc * A);
        var ycp = yc + ecc;
        var hcp = ycp * Math.sin(th);
        /* momento em relacao a base da comporta */
        var yBase = yTopo + p.h;
        var Mdob = F * (yBase - ycp);

        var dd = ctx.plot('esq').clear();
        var pMax = gama * (yBase * Math.sin(th));
        dd.setLimits([-1.25, 1.35], [-1.2, 1.15]);
        dd.custom(function (c, pl) {
          var X = function (u) { return pl.px(u); };
          var Y = function (u) { return pl.py(u); };
          /* normaliza a geometria para o quadro */
          var esc = 1.9 / Math.max(yBase, 1e-6);
          var yTopoN = 0.85 - yTopo * esc;
          var yBaseN = 0.85 - yBase * esc;

          /* agua */
          c.fillStyle = Plot.serie(0);
          c.globalAlpha = 0.15;
          c.fillRect(X(-1.15), Y(0.85), X(0) - X(-1.15), Y(-1.1) - Y(0.85));
          c.globalAlpha = 1;
          /* superficie livre */
          c.strokeStyle = Plot.serie(0); c.lineWidth = 2;
          c.beginPath(); c.moveTo(X(-1.15), Y(0.85)); c.lineTo(X(0.05), Y(0.85)); c.stroke();
          c.fillStyle = Plot.serie(0);
          c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'bottom';
          c.fillText('superfície livre', X(-1.13), Y(0.85) - 5);

          /* comporta */
          c.strokeStyle = Plot.cssVar('--text', '#111'); c.lineWidth = 4;
          c.beginPath(); c.moveTo(X(0), Y(yTopoN)); c.lineTo(X(0), Y(yBaseN)); c.stroke();

          /* diagrama triangular de pressao */
          var largMax = 0.95;
          var pTopo = gama * (yTopo * Math.sin(th));
          var wTopo = pMax > 0 ? largMax * pTopo / pMax : 0;
          c.fillStyle = Plot.serie(1);
          c.globalAlpha = 0.28;
          c.beginPath();
          c.moveTo(X(0), Y(yTopoN));
          c.lineTo(X(wTopo), Y(yTopoN));
          c.lineTo(X(largMax), Y(yBaseN));
          c.lineTo(X(0), Y(yBaseN));
          c.closePath(); c.fill();
          c.globalAlpha = 1;
          c.strokeStyle = Plot.serie(1); c.lineWidth = 1.8;
          c.stroke();
          /* setas do diagrama */
          c.strokeStyle = Plot.serie(1); c.lineWidth = 1.2;
          for (var k = 0; k <= 6; k++) {
            var t = k / 6;
            var yy = yTopoN + (yBaseN - yTopoN) * t;
            var ww = wTopo + (largMax - wTopo) * t;
            c.beginPath(); c.moveTo(X(ww), Y(yy)); c.lineTo(X(0.02), Y(yy)); c.stroke();
            c.beginPath();
            c.moveTo(X(0), Y(yy));
            c.lineTo(X(0.055), Y(yy) - 3.5);
            c.lineTo(X(0.055), Y(yy) + 3.5);
            c.closePath(); c.fillStyle = Plot.serie(1); c.fill();
          }
          c.fillStyle = Plot.serie(1);
          c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'middle';
          c.fillText('p_máx = ' + Plot.sig(pMax / 1000, 4) + ' kPa', X(largMax) + 6, Y(yBaseN));

          /* centroide e centro de pressao */
          var ycN = 0.85 - yc * esc, ycpN = 0.85 - ycp * esc;
          c.fillStyle = Plot.serie(4);
          c.beginPath(); c.arc(X(0), Y(ycN), 4, 0, Math.PI * 2); c.fill();
          c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'right'; c.textBaseline = 'middle';
          c.fillText('centroide  y_c = ' + Plot.sig(yc, 3) + ' m', X(-0.04), Y(ycN));

          /* forca resultante no centro de pressao */
          c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6); c.lineWidth = 2.6;
          c.beginPath(); c.moveTo(X(-0.02), Y(ycpN)); c.lineTo(X(0.62), Y(ycpN)); c.stroke();
          c.beginPath();
          c.moveTo(X(0), Y(ycpN));
          c.lineTo(X(0.075), Y(ycpN) - 5.5);
          c.lineTo(X(0.075), Y(ycpN) + 5.5);
          c.closePath(); c.fill();
          c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'bottom';
          c.fillText('F = ' + Plot.sig(F / 1000, 4) + ' kN', X(0.14), Y(ycpN) - 6);
          c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
          c.textBaseline = 'top';
          c.fillText('centro de pressão  y_cp = ' + Plot.sig(ycp, 3) + ' m', X(0.14), Y(ycpN) + 5);
        });
        dd.draw();

        ctx.setPassos([
          { t: 'Geometria e centroide',
            c: 'A = h·b = ' + p.h + ' × ' + p.b + ' = ' + Plot.sig(A, 4) + ' m²\n' +
               'y_c = y_topo + h/2 = ' + Plot.sig(yTopo, 4) + ' + ' + (p.h / 2) + '\n' +
               'h_c = y_c·sen θ = ' + Plot.sig(yc, 4) + ' × sen(' + p.theta + '°)',
            r: 'y_c = ' + Plot.sig(yc, 4) + ' m     h_c = ' + Plot.sig(hc, 4) + ' m' },
          { t: 'Pressão no centroide',
            c: 'p_c = ρ·g·h_c = ' + fl.rho + ' × 9,81 × ' + Plot.sig(hc, 4),
            r: 'p_c = ' + Plot.sig(pc / 1000, 4) + ' kPa',
            obs: 'Pressão manométrica: a atmosfera age nos dois lados e se cancela.' },
          { t: 'Força resultante',
            c: 'F = p_c·A = ' + Plot.sig(pc / 1000, 4) + ' kPa × ' + Plot.sig(A, 4) + ' m²',
            r: 'F = ' + Plot.sig(F / 1000, 4) + ' kN',
            obs: 'A força usa a pressão no CENTROIDE, mas não é aplicada nele — esse é o erro clássico.' },
          { t: 'Centro de pressão',
            c: 'I_xc = b·h³/12 = ' + p.b + ' × ' + p.h + '³/12 = ' + Plot.sig(Ixc, 4) + ' m⁴\n' +
               'e = I_xc/(y_c·A) = ' + Plot.sig(Ixc, 4) + '/(' + Plot.sig(yc, 4) + ' × ' + Plot.sig(A, 4) + ')\n' +
               'y_cp = y_c + e = ' + Plot.sig(yc, 4) + ' + ' + Plot.sig(ecc, 4),
            r: 'y_cp = ' + Plot.sig(ycp, 4) + ' m   (e = ' + Plot.sig(ecc, 3) + ' m abaixo do centroide)',
            obs: p.ys < 0.01 && Math.abs(p.theta - 90) < 0.5
              ? 'Topo na superfície e placa vertical: cai no caso particular y_cp = 2h/3 = ' +
                Plot.sig(2 * p.h / 3, 4) + ' m. Confere.'
              : 'Quanto mais fundo a placa, menor a excentricidade — o diagrama de pressão fica mais uniforme e o centro de pressão se aproxima do centroide.' },
          { t: 'Momento na base da comporta',
            c: 'braço = y_base − y_cp = ' + Plot.sig(yBase, 4) + ' − ' + Plot.sig(ycp, 4) + '\n' +
               'M = F × braço = ' + Plot.sig(F / 1000, 4) + ' × ' + Plot.sig(yBase - ycp, 4),
            r: 'M = ' + Plot.sig(Mdob / 1000, 4) + ' kN·m',
            obs: 'É esse momento que dimensiona a dobradiça, o eixo e o atuador da comporta.' }
        ]);

        return {
          hc: { v: hc, u: 'm' },
          pc: { v: pc / 1000, u: 'kPa' },
          F: { v: F / 1000, u: 'kN', classe: 'destaque' },
          ycp: { v: ycp, u: 'm', classe: 'destaque' },
          ecc: { v: ecc, u: 'm' },
          Mdob: { v: Mdob / 1000, u: 'kN·m' }
        };
      }
    });
  })();

})();

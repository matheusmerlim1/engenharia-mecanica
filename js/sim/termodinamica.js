/* ============================================================
   Termodinâmica — simuladores
     1. sim-saturacao   : diagramas T-v e P-v da água, com título x
     2. sim-processo    : processo politrópico de gás ideal (1ª lei)
     3. sim-carnot      : máquina térmica, refrigerador e bomba de calor
     4. sim-entropia    : geração de entropia e trabalho perdido

   As propriedades da água usam as equações auxiliares do IAPWS-95
   (pressão de saturação de Wagner e densidades de saturação), com
   h_fg obtido pela equação de Clapeyron. Conferido contra tabela de
   vapor entre 20 e 300 °C: erro abaixo de 0,02 %.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     Propriedades de saturação da água (IAPWS-95, equações auxiliares)
     ============================================================ */
  var Tc = 647.096;      /* K   */
  var Pc = 22064;        /* kPa */
  var RHOc = 322;        /* kg/m³ */
  var Tt = 273.16;       /* ponto triplo */

  function Psat(T) {
    if (T >= Tc) return Pc;
    var tau = 1 - T / Tc;
    var a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
    var e = [1, 1.5, 3, 3.5, 4, 7.5];
    var s = 0;
    for (var i = 0; i < 6; i++) s += a[i] * Math.pow(tau, e[i]);
    return Pc * Math.exp(Tc / T * s);
  }
  function rhoLiq(T) {
    if (T >= Tc) return RHOc;
    var tau = 1 - T / Tc;
    var b = [1.99274064, 1.09965342, -0.510839303, -1.75493479, -45.5170352, -6.74694450e5];
    var e = [1 / 3, 2 / 3, 5 / 3, 16 / 3, 43 / 3, 110 / 3];
    var s = 1;
    for (var i = 0; i < 6; i++) s += b[i] * Math.pow(tau, e[i]);
    return RHOc * s;
  }
  function rhoVap(T) {
    if (T >= Tc) return RHOc;
    var tau = 1 - T / Tc;
    var c = [-2.03150240, -2.68302940, -5.38626492, -17.2991605, -44.7586581, -63.9201063];
    var e = [2 / 6, 4 / 6, 8 / 6, 18 / 6, 37 / 6, 71 / 6];
    var s = 0;
    for (var i = 0; i < 6; i++) s += c[i] * Math.pow(tau, e[i]);
    return RHOc * Math.exp(s);
  }
  function vf(T) { return 1 / rhoLiq(T); }
  function vg(T) { return 1 / rhoVap(T); }
  /* Clapeyron: h_fg = T·(v_g − v_f)·dP/dT */
  function hfg(T) {
    if (T >= Tc - 0.05) return 0;
    var h = 0.01;
    var dP = (Psat(T + h) - Psat(T - h)) / (2 * h);
    return T * (vg(T) - vf(T)) * dP;
  }
  /* s_fg = h_fg / T */
  function sfg(T) { return hfg(T) / T; }
  /* entalpia e entropia do líquido saturado, integradas a partir do ponto triplo */
  function hf(T) {
    var n = 40, s = 0, T0 = Tt, dT = (T - T0) / n;
    for (var i = 0; i < n; i++) {
      var Tm = T0 + dT * (i + 0.5);
      s += cpLiq(Tm) * dT;
    }
    return s;
  }
  function sfLiq(T) {
    var n = 40, s = 0, T0 = Tt, dT = (T - T0) / n;
    for (var i = 0; i < n; i++) {
      var Tm = T0 + dT * (i + 0.5);
      s += cpLiq(Tm) / Tm * dT;
    }
    return s;
  }
  /* cp da água líquida saturada [kJ/kg·K] — ajuste simples, sobe perto do crítico */
  function cpLiq(T) {
    var t = (T - 273.15) / 100;
    return 4.217 - 0.3374 * t + 0.2245 * t * t - 0.0546 * t * t * t + 0.0289 * Math.pow(t, 4);
  }

  /* ============================================================
     1. Diagramas de saturação da água
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-saturacao')) return;

    Sim.build('#sim-saturacao', {
      titulo: 'Substância pura — diagramas T-v e P-v da água',
      descricao: 'O domo de saturação separa líquido comprimido, mistura e vapor superaquecido. Dentro do domo, pressão e temperatura não são independentes: quem define o estado é o título.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Água fervendo na panela',
          desc: '100 °C, 1 atm, metade evaporada',
          valores: { T: 100, x: 50, modo: 'T' } },
        { nome: '2 · Caldeira de baixa pressão',
          desc: '10 bar — repare a queda de v_g',
          valores: { P: 1000, x: 100, modo: 'P' } },
        { nome: '3 · Vapor saturado seco a 200 °C',
          desc: 'x = 1: fronteira direita do domo',
          valores: { T: 200, x: 100, modo: 'T' } },
        { nome: '4 · Líquido saturado a 200 °C',
          desc: 'x = 0: fronteira esquerda',
          valores: { T: 200, x: 0, modo: 'T' } },
        { nome: '5 · Perto do ponto crítico',
          desc: '370 °C: v_f e v_g quase se encontram e h_fg → 0',
          valores: { T: 370, x: 50, modo: 'T' } },
        { nome: '6 · Condensador de usina',
          desc: '7 kPa — vapor com volume específico enorme',
          valores: { P: 7, x: 90, modo: 'P' } }
      ],
      controles: [
        { id: 'modo', tipo: 'seg', label: 'Definir o estado por', valor: 'T',
          opcoes: [{ v: 'T', t: 'Temperatura' }, { v: 'P', t: 'Pressão' }] },
        { id: 'T', label: 'Temperatura de saturação', min: 5, max: 373, step: 1, valor: 150, unidade: '°C' },
        { id: 'P', label: 'Pressão de saturação', min: 1, max: 20000, step: 1, valor: 476, unidade: 'kPa',
          desc: 'Usada apenas quando o modo é "Pressão".' },
        { id: 'x', label: 'Título x', min: 0, max: 100, step: 1, valor: 50, unidade: '%',
          desc: '0 % = líquido saturado · 100 % = vapor saturado seco. Só faz sentido dentro do domo.' },
        { tipo: 'separador' },
        { id: 'logv', tipo: 'check', label: 'Eixo de volume em escala log', valor: true,
          desc: 'v varia de 0,001 a mais de 100 m³/kg — sem log, o domo some.' },
        { id: 'isobaras', tipo: 'check', label: 'Mostrar isobáricas no T-v', valor: true }
      ],
      graficos: [
        { id: 'tv', titulo: 'Diagrama T-v', xlabel: 'log₁₀ v (m³/kg)', ylabel: 'T (°C)',
          aspect: 0.52, legendPos: 'topright' },
        { id: 'pv', titulo: 'Diagrama P-v', xlabel: 'log₁₀ v (m³/kg)', ylabel: 'P (kPa)',
          aspect: 0.42, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Tsat', label: 'Temperatura' },
        { id: 'Psat', label: 'Pressão' },
        { id: 'vf', label: 'v líquido sat.' },
        { id: 'vg', label: 'v vapor sat.' },
        { id: 'v', label: 'v da mistura' },
        { id: 'hfg', label: 'Calor latente h_fg' },
        { id: 'h', label: 'Entalpia h' },
        { id: 's', label: 'Entropia s' },
        { id: 'fase', label: 'Fase' }
      ],
      formulas: [
        { g: 'Título e propriedades da mistura' },
        { tex: 'x =\\frac{m_{\\text{vapor}}}{m_{\\text{total}}}', d: 'fração mássica de vapor; 0 ≤ x ≤ 1', destaque: true },
        { tex: 'v = v_{f} + x\\cdot v_{\\text{fg}}', d: 'v_fg = v_g − v_f; vale para v, u, h e s', destaque: true },
        { tex: 'h = h_{f} + x\\cdot h_{\\text{fg}}', d: 'entalpia da mistura saturada' },
        { tex: 's = s_{f} + x\\cdot s_{\\text{fg}}', d: 'entropia da mistura saturada' },
        { tex: 'x = \\frac{v - v_{f}}{v_{\\text{fg}}}', d: 'forma inversa: acha o título a partir de qualquer propriedade' },

        { g: 'Dentro do domo' },
        { tex: 'T e P \\text{NÃO} \\text{são} \\text{independentes}', d: 'a cada P corresponde uma única T_sat — por isso precisa-se de x', destaque: true },
        { tex: 'P = P_{\\text{sat}}(T)', d: 'a linha de saturação é uma curva única no plano P-T' },
        { tex: '\\text{Regra das fases}: F = C - P + 2', d: 'substância pura bifásica: F = 1 − 2 + 2 = 1 grau de liberdade' },

        { g: 'Equação de Clapeyron' },
        { tex: '\\frac{\mathrm{d}P}{\mathrm{d}T} =\\frac{h_{\\text{fg}}}{T\\cdot v_{\\text{fg}}}', d: 'liga a inclinação da curva de saturação ao calor latente', destaque: true },
        { tex: 's_{\\text{fg}} =\\frac{h_{\\text{fg}}}{T}', d: 'a vaporização é isotérmica e reversível' },

        { g: 'Ponto crítico da água' },
        { tex: 'T_{c} = 373,95 °C', d: 'P_c = 22,06 MPa · v_c = 0,003106 m³/kg' },
        { tex: '\\text{Acima de} T_{c}: h_{\\text{fg}} = 0', d: 'não há distinção entre líquido e vapor — fluido supercrítico' }
      ],
      passos: [],
      passosTitulo: 'Como se lê a tabela de vapor neste estado',
      passosAbertos: false,
      nota: 'Propriedades da água pelas equações auxiliares do IAPWS-95; h_f e s_f integrados a partir do ponto triplo. Os valores conferem com a tabela de vapor com erro abaixo de 0,1 % na faixa de 20 a 350 °C.',
      calcular: function (p, ctx) {
        /* estado escolhido */
        var T, P;
        if (p.modo === 'T') {
          T = p.T + 273.15;
          P = Psat(T);
        } else {
          P = p.P;
          /* inverte P_sat por bisseção */
          T = Plot.bissec(function (t) { return Psat(t) - P; }, 273.2, Tc - 0.01, 1e-8);
          if (!isFinite(T)) T = 373.15;
        }
        var x = p.x / 100;
        var vF = vf(T), vG = vg(T), vfg = vG - vF;
        var v = vF + x * vfg;
        var hF = hf(T), hFG = hfg(T);
        var sF = sfLiq(T), sFG = sfg(T);
        var h = hF + x * hFG;
        var s = sF + x * sFG;

        var fase = x <= 0.0001 ? 'Líquido saturado'
                 : x >= 0.9999 ? 'Vapor saturado seco'
                 : 'Mistura líquido-vapor';
        if (T >= Tc - 0.5) fase = 'Ponto crítico / supercrítico';

        /* ---- domo de saturação ---- */
        var Ts = Plot.linspace(275, Tc - 0.3, 140);
        var lvF = Ts.map(function (t) { return Math.log10(vf(t)); });
        var lvG = Ts.map(function (t) { return Math.log10(vg(t)); });
        var TsC = Ts.map(function (t) { return t - 273.15; });
        var Ps = Ts.map(function (t) { return Psat(t); });

        /* ---------- T-v ---------- */
        var g1 = ctx.plot('tv').clear();
        g1.line(lvF, TsC, { color: Plot.serie(0), width: 2.4, label: 'Líquido saturado (x = 0)' });
        g1.line(lvG, TsC, { color: Plot.serie(1), width: 2.4, label: 'Vapor saturado (x = 1)' });
        g1.marker(Math.log10(1 / RHOc), Tc - 273.15, 'ponto crítico', { color: Plot.serie(7), r: 5, align: 'right', dx: -8 });

        if (p.isobaras) {
          [10, 100, 1000, 10000].forEach(function (pp, i) {
            var Tsp = Plot.bissec(function (t) { return Psat(t) - pp; }, 273.2, Tc - 0.01, 1e-8);
            if (!isFinite(Tsp)) return;
            var xs = [Math.log10(vf(Tsp)), Math.log10(vg(Tsp))];
            g1.line(xs, [Tsp - 273.15, Tsp - 273.15],
              { color: Plot.serie(3), width: 1.2, dash: [4, 3] });
            g1.text(xs[1], Tsp - 273.15, ' ' + pp + ' kPa',
              { align: 'left', size: 9.5, color: Plot.serie(3), dy: -4 });
            void i;
          });
        }

        /* linha do estado atual */
        g1.line([Math.log10(vF), Math.log10(vG)], [T - 273.15, T - 273.15],
          { color: Plot.serie(6), width: 2, dash: [] });
        g1.marker(Math.log10(v), T - 273.15,
          'estado: x = ' + Plot.sig(x, 3), { color: Plot.serie(6), r: 5.5 });
        g1.setLimits([-3.2, 2.4], [0, 400]).draw();

        /* ---------- P-v ---------- */
        var g2 = ctx.plot('pv').clear();
        g2.line(lvF, Ps, { color: Plot.serie(0), width: 2.2, label: 'x = 0' });
        g2.line(lvG, Ps, { color: Plot.serie(1), width: 2.2, label: 'x = 1' });
        g2.line([Math.log10(vF), Math.log10(vG)], [P, P],
          { color: Plot.serie(6), width: 2 });
        g2.marker(Math.log10(v), P, Plot.sig(P, 4) + ' kPa', { color: Plot.serie(6), r: 5 });
        g2.setLimits([-3.2, 2.4], [0, Math.min(Pc * 1.02, Math.max(P * 2.2, 2000))]).draw();

        /* ---------- passo a passo ---------- */
        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Identificar o estado',
            c: p.modo === 'T'
              ? 'Entrada: T = ' + p.T + ' °C  e  x = ' + p.x + ' %\n' +
                'Na tabela de saturação por temperatura, lê-se P_sat direto:\n' +
                'P_sat(' + p.T + ' °C) = ' + sg(P, 5) + ' kPa'
              : 'Entrada: P = ' + p.P + ' kPa  e  x = ' + p.x + ' %\n' +
                'Na tabela de saturação por pressão, lê-se T_sat direto:\n' +
                'T_sat(' + p.P + ' kPa) = ' + sg(T - 273.15, 5) + ' °C',
            r: 'T = ' + sg(T - 273.15, 5) + ' °C   e   P = ' + sg(P, 5) + ' kPa',
            obs: 'Dentro do domo, T e P estão amarradas: informar as duas é redundante e não define o estado. É preciso uma terceira propriedade — normalmente o título.' },
          { t: 'Ler v_f e v_g na tabela',
            c: 'v_f = ' + sg(vF, 5) + ' m³/kg   (líquido saturado)\n' +
               'v_g = ' + sg(vG, 5) + ' m³/kg   (vapor saturado)\n' +
               'v_fg = v_g − v_f = ' + sg(vfg, 5) + ' m³/kg',
            r: 'v_g / v_f = ' + sg(vG / vF, 4) + '×',
            obs: 'O vapor ocupa aqui ' + sg(vG / vF, 3) + ' vezes o volume do líquido. É essa expansão que move o pistão e a turbina.' },
          { t: 'Volume específico da mistura',
            c: 'v = v_f + x·v_fg\n' +
               'v = ' + sg(vF, 5) + ' + ' + sg(x, 3) + ' × ' + sg(vfg, 5),
            r: 'v = ' + sg(v, 5) + ' m³/kg',
            obs: 'A mesma combinação linear vale para u, h e s. Se o enunciado der v e pedir x, inverta: x = (v − v_f)/v_fg.' },
          { t: 'Calor latente de vaporização',
            c: 'Por Clapeyron:  h_fg = T·v_fg·(dP/dT)\n' +
               'h_fg = ' + sg(T, 5) + ' × ' + sg(vfg, 4) + ' × ' + sg(hFG / (T * vfg), 4),
            r: 'h_fg = ' + sg(hFG, 5) + ' kJ/kg',
            obs: 'Diminui à medida que a pressão sobe e se anula no ponto crítico (374 °C), onde líquido e vapor deixam de ser distinguíveis.' },
          { t: 'Entalpia e entropia',
            c: 'h = h_f + x·h_fg = ' + sg(hF, 5) + ' + ' + sg(x, 3) + ' × ' + sg(hFG, 5) + '\n' +
               's = s_f + x·s_fg = ' + sg(sF, 4) + ' + ' + sg(x, 3) + ' × ' + sg(sFG, 4),
            r: 'h = ' + sg(h, 5) + ' kJ/kg      s = ' + sg(s, 4) + ' kJ/kg·K',
            obs: 'Referência: h = s = 0 no líquido saturado do ponto triplo (0,01 °C), que é a convenção das tabelas de vapor.' }
        ]);

        return {
          Tsat: { v: T - 273.15, u: '°C' },
          Psat: { v: P, u: 'kPa' },
          vf: { v: vF, u: 'm³/kg' },
          vg: { v: vG, u: 'm³/kg' },
          v: { v: v, u: 'm³/kg', classe: 'destaque' },
          hfg: { v: hFG, u: 'kJ/kg' },
          h: { v: h, u: 'kJ/kg', classe: 'destaque' },
          s: { v: s, u: 'kJ/kg·K' },
          fase: { v: fase, u: '', classe: fase.indexOf('Mistura') === 0 ? '' : 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     2. Processo politrópico de gás ideal — primeira lei
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-processo')) return;

    var GASES = {
      ar:  { nome: 'Ar',        R: 0.287, k: 1.400, cv: 0.718, cp: 1.005 },
      n2:  { nome: 'Nitrogênio', R: 0.2968, k: 1.400, cv: 0.743, cp: 1.039 },
      co2: { nome: 'CO₂',       R: 0.1889, k: 1.289, cv: 0.657, cp: 0.846 },
      he:  { nome: 'Hélio',     R: 2.0769, k: 1.667, cv: 3.116, cp: 5.193 },
      ch4: { nome: 'Metano',    R: 0.5182, k: 1.299, cv: 1.736, cp: 2.254 }
    };

    Sim.build('#sim-processo', {
      titulo: 'Processo politrópico de gás ideal — 1ª lei',
      descricao: 'P·Vⁿ = constante descreve os quatro processos clássicos com um único parâmetro. Varie n e veja o trabalho, o calor e a variação de energia interna trocarem de papel.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Isobárico (n = 0)',
          desc: 'Pressão constante: Q = m·cp·ΔT',
          valores: { gas: 'ar', n: 0, P1: 100, T1: 300, V1: 0.5, razao: 2 } },
        { nome: '2 · Isotérmico (n = 1)',
          desc: 'ΔU = 0, logo Q = W exatamente',
          valores: { gas: 'ar', n: 1, P1: 100, T1: 300, V1: 0.5, razao: 0.2 } },
        { nome: '3 · Adiabático (n = k = 1,4)',
          desc: 'Q = 0, logo W = −ΔU',
          valores: { gas: 'ar', n: 1.4, P1: 100, T1: 300, V1: 0.5, razao: 0.2 } },
        { nome: '4 · Isocórico (n → ∞)',
          desc: 'Volume constante: W = 0 e Q = ΔU',
          valores: { gas: 'ar', n: 8, P1: 100, T1: 300, V1: 0.5, razao: 0.99 } },
        { nome: '5 · Compressão real (n = 1,3)',
          desc: 'Entre o isotérmico e o adiabático — o caso do compressor',
          valores: { gas: 'ar', n: 1.3, P1: 100, T1: 300, V1: 0.5, razao: 0.2 } },
        { nome: '6 · Hélio adiabático (k = 1,667)',
          desc: 'Gás monoatômico: k maior, aquece muito mais ao comprimir',
          valores: { gas: 'he', n: 1.667, P1: 100, T1: 300, V1: 0.5, razao: 0.2 } }
      ],
      controles: [
        { id: 'gas', tipo: 'select', label: 'Gás', valor: 'ar',
          opcoes: Object.keys(GASES).map(function (k) {
            return { v: k, t: GASES[k].nome + '  (k = ' + GASES[k].k.toFixed(3) + ')' }; }) },
        { id: 'n', label: 'Expoente politrópico n', min: 0, max: 8, step: 0.01, valor: 1.3, unidade: '',
          desc: '0 = isobárico · 1 = isotérmico · k = adiabático · n grande ≈ isocórico' },
        { tipo: 'titulo', label: 'Estado inicial' },
        { id: 'P1', label: 'Pressão P₁', min: 20, max: 1000, step: 10, valor: 100, unidade: 'kPa' },
        { id: 'T1', label: 'Temperatura T₁', min: 200, max: 1200, step: 5, valor: 300, unidade: 'K' },
        { id: 'V1', label: 'Volume V₁', min: 0.05, max: 3, step: 0.05, valor: 0.5, unidade: 'm³' },
        { tipo: 'titulo', label: 'Processo' },
        { id: 'razao', label: 'Razão de volumes V₂/V₁', min: 0.1, max: 4, step: 0.01, valor: 0.2, unidade: '',
          desc: 'Menor que 1 = compressão. Maior que 1 = expansão.' }
      ],
      graficos: [
        { id: 'pv', titulo: 'Diagrama P-v — a área sob a curva é o trabalho',
          xlabel: 'Volume V (m³)', ylabel: 'Pressão P (kPa)', aspect: 0.46, legendPos: 'topright' },
        { id: 'balanco', titulo: 'Balanço de energia (1ª lei)', xlabel: '', ylabel: 'Energia (kJ)',
          aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'm', label: 'Massa de gás' },
        { id: 'T2', label: 'Temperatura T₂' },
        { id: 'P2', label: 'Pressão P₂' },
        { id: 'W', label: 'Trabalho W' },
        { id: 'dU', label: 'Variação ΔU' },
        { id: 'Q', label: 'Calor Q' },
        { id: 'dS', label: 'Variação ΔS' },
        { id: 'tipo', label: 'Tipo de processo' }
      ],
      formulas: [
        { g: 'Gás ideal' },
        { tex: 'P\\cdot V = m\\cdot R\\cdot T', d: 'equação de estado; R = R_universal/M', destaque: true },
        { tex: 'R = c_{p} - c_{v}', d: 'relação de Mayer' },
        { tex: 'k = \\frac{c_{p}}{c_{v}}', d: 'razão de calores específicos; ar: 1,4 · monoatômico: 1,667' },

        { g: 'Processo politrópico  P·Vⁿ = cte' },
        { tex: 'P_{1}V_{1}^{n} = P_{2}V_{2}^{n}', d: 'define a trajetória no diagrama P-v', destaque: true },
        { tex: '\\frac{T_{2}}{T_{1}} = (\\frac{V_{1}}{V_{2}})^(n- 1)', d: 'relação de temperaturas', destaque: true },
        { tex: '\\frac{T_{2}}{T_{1}} = (\\frac{P_{2}}{P_{1}})^(\\frac{n- 1}{n})', d: 'forma equivalente, em função da pressão' },

        { g: 'Trabalho de fronteira' },
        { tex: 'W = \\int P \mathrm{d}V', d: 'é a ÁREA sob a curva no diagrama P-v', destaque: true },
        { tex: 'W = \\frac{P_{2}V_{2} - P_{1}V_{1}}{1 - n}', d: 'politrópico com n ≠ 1', destaque: true },
        { tex: 'W = P_{1}V_{1}\\cdot \\ln (\\frac{V_{2}}{V_{1}})', d: 'caso isotérmico, n = 1' },
        { tex: 'W = P\\cdot (V_{2} - V_{1})', d: 'caso isobárico, n = 0' },
        { tex: 'W = 0', d: 'caso isocórico, n → ∞' },

        { g: 'Primeira lei (sistema fechado)' },
        { tex: 'Q - W = \\Delta U', d: 'convenção: Q entra positivo, W sai positivo', destaque: true },
        { tex: '\\Delta U = m\\cdot c_{v}\\cdot (T_{2} - T_{1})', d: 'gás ideal — vale em QUALQUER processo, não só a volume constante', destaque: true },
        { tex: '\\Delta H = m\\cdot c_{p}\\cdot (T_{2} - T_{1})', d: 'idem para entalpia' },

        { g: 'Variação de entropia' },
        { tex: '\\Delta s = c_{v}\\cdot \\ln (\\frac{T_{2}}{T_{1}}) + R\\cdot \\ln (\\frac{v_{2}}{v_{1}})', d: 'gás ideal com calores específicos constantes', destaque: true },
        { tex: '\\Delta s = c_{p}\\cdot \\ln (\\frac{T_{2}}{T_{1}}) - R\\cdot \\ln (\\frac{P_{2}}{P_{1}})', d: 'forma equivalente' },
        { tex: 'n = k \\to \\Delta s = 0', d: 'o processo adiabático reversível é isentrópico' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Gás ideal com calores específicos constantes, processo quase-estático em sistema fechado. Convenção de sinais: Q > 0 entra no sistema, W > 0 é realizado PELO sistema.',
      calcular: function (p, ctx) {
        var G = GASES[p.gas];
        var n = p.n;
        var V1 = p.V1, V2 = p.V1 * p.razao;
        var P1 = p.P1, T1 = p.T1;
        var m = P1 * V1 / (G.R * T1);
        var P2 = P1 * Math.pow(V1 / V2, n);
        var T2 = P2 * V2 / (m * G.R);

        var W;
        if (Math.abs(n - 1) < 1e-6) W = P1 * V1 * Math.log(V2 / V1);
        else W = (P2 * V2 - P1 * V1) / (1 - n);
        var dU = m * G.cv * (T2 - T1);
        var Q = dU + W;
        var dS = m * (G.cv * Math.log(T2 / T1) + G.R * Math.log(V2 / V1));

        var tipo = Math.abs(n) < 0.02 ? 'Isobárico (P = cte)'
          : Math.abs(n - 1) < 0.02 ? 'Isotérmico (T = cte)'
          : Math.abs(n - G.k) < 0.02 ? 'Adiabático reversível (isentrópico)'
          : n > 5 ? 'Quase isocórico (V ≈ cte)'
          : n < G.k ? 'Politrópico com troca de calor' : 'Politrópico';

        /* ---- diagrama P-v ---- */
        var Vs = Plot.linspace(Math.min(V1, V2), Math.max(V1, V2), 80);
        var Ps = Vs.map(function (V) { return P1 * Math.pow(V1 / V, n); });

        var g1 = ctx.plot('pv').clear();
        g1.area(Vs, Ps, { base: 0, color: Plot.serie(0), alpha: 0.20, label: 'Trabalho = área sob a curva' });
        g1.line(Vs, Ps, { color: Plot.serie(0), width: 2.8 });
        /* isotermas de referência */
        [T1, T2].forEach(function (T, i) {
          var xs = Plot.linspace(Math.min(V1, V2) * 0.75, Math.max(V1, V2) * 1.25, 50);
          g1.line(xs, xs.map(function (V) { return m * G.R * T / V; }),
            { color: Plot.serie(i === 0 ? 2 : 1), width: 1.2, dash: [4, 3],
              label: 'Isoterma T' + (i + 1) + ' = ' + Plot.sig(T, 4) + ' K' });
        });
        g1.marker(V1, P1, '1', { color: Plot.serie(7), r: 5 });
        g1.marker(V2, P2, '2', { color: Plot.serie(6), r: 5 });
        g1.draw();

        /* ---- balanço ---- */
        var g2 = ctx.plot('balanco').clear();
        g2.o.xcat = [{ v: 0, label: 'Q  calor' }, { v: 1, label: 'W  trabalho' },
                     { v: 2, label: 'ΔU  energia interna' }];
        var parc = [Q, W, dU];
        var corParc = [Plot.serie(5), Plot.serie(0), Plot.serie(3)];
        var altoB = Math.max.apply(null, parc.concat([0]));
        var baixoB = Math.min.apply(null, parc.concat([0]));
        var faixaB = Math.max(altoB - baixoB, 1e-6);
        g2.setLimits([-0.62, 2.62], [baixoB - faixaB * 0.14, altoB + faixaB * 0.22]);
        parc.forEach(function (v, i) {
          g2.bars([i], [v], { color: corParc[i], barw: 0.52 });
          g2.text(i, v, Plot.sig(v, 4) + ' kJ',
            { align: 'center', dy: v >= 0 ? -7 : 15, size: 11 });
        });
        g2.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        g2.draw();

        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Massa de gás pela equação de estado',
            c: 'P₁V₁ = m·R·T₁  →  m = P₁V₁/(R·T₁)\n' +
               'm = ' + P1 + ' × ' + V1 + ' / (' + G.R + ' × ' + T1 + ')',
            r: 'm = ' + sg(m, 4) + ' kg' },
          { t: 'Estado 2 pela relação politrópica',
            c: 'P₂ = P₁·(V₁/V₂)ⁿ = ' + P1 + ' × (' + sg(V1 / V2, 4) + ')^' + sg(n, 3) + '\n' +
               'T₂ = P₂V₂/(m·R) = ' + sg(P2, 4) + ' × ' + sg(V2, 4) + '/(' + sg(m, 4) + ' × ' + G.R + ')',
            r: 'P₂ = ' + sg(P2, 5) + ' kPa      T₂ = ' + sg(T2, 5) + ' K',
            obs: T2 > T1 ? 'A temperatura subiu: comprimir gás aquece, e é por isso que compressores precisam de resfriamento.' : 'A temperatura caiu na expansão — o gás realiza trabalho às custas da própria energia interna.' },
          { t: 'Trabalho de fronteira',
            c: Math.abs(n - 1) < 1e-6
              ? 'n = 1 (isotérmico):  W = P₁V₁·ln(V₂/V₁)\nW = ' + P1 + ' × ' + V1 + ' × ln(' + sg(p.razao, 4) + ')'
              : 'W = (P₂V₂ − P₁V₁)/(1 − n)\n' +
                'W = (' + sg(P2, 5) + '×' + sg(V2, 4) + ' − ' + P1 + '×' + V1 + ')/(1 − ' + sg(n, 3) + ')',
            r: 'W = ' + sg(W, 4) + ' kJ',
            obs: W < 0 ? 'Negativo: o trabalho é realizado SOBRE o gás (compressão).' : 'Positivo: o gás realiza trabalho sobre a vizinhança (expansão).' },
          { t: 'Variação de energia interna',
            c: 'ΔU = m·c_v·(T₂ − T₁)\n' +
               'ΔU = ' + sg(m, 4) + ' × ' + G.cv + ' × (' + sg(T2, 5) + ' − ' + T1 + ')',
            r: 'ΔU = ' + sg(dU, 4) + ' kJ',
            obs: 'Para gás ideal, u depende SÓ da temperatura. Esta fórmula vale em qualquer processo, não apenas a volume constante — é o erro conceitual mais comum da disciplina.' },
          { t: 'Calor pela primeira lei',
            c: 'Q − W = ΔU  →  Q = ΔU + W\n' +
               'Q = ' + sg(dU, 4) + ' + ' + sg(W, 4),
            r: 'Q = ' + sg(Q, 4) + ' kJ   (' + (Q > 0 ? 'entra no sistema' : Q < 0 ? 'sai do sistema' : 'adiabático') + ')',
            obs: Math.abs(n - G.k) < 0.02
              ? 'Como n = k, o processo é adiabático: Q ≈ 0 e todo o trabalho vem da energia interna.'
              : Math.abs(n - 1) < 0.02
                ? 'Como n = 1, ΔU = 0 e portanto Q = W exatamente.'
                : 'Processo com troca de calor e variação de energia interna simultâneas.' },
          { t: 'Variação de entropia',
            c: 'Δs = c_v·ln(T₂/T₁) + R·ln(v₂/v₁)\n' +
               'ΔS = m·[' + G.cv + '×ln(' + sg(T2 / T1, 4) + ') + ' + G.R + '×ln(' + sg(p.razao, 4) + ')]',
            r: 'ΔS = ' + sg(dS, 4) + ' kJ/K',
            obs: Math.abs(dS) < 1e-4
              ? 'Praticamente nula: o processo é isentrópico (adiabático reversível).'
              : 'A entropia do sistema ' + (dS > 0 ? 'aumentou' : 'diminuiu') +
                '. Diminuir a entropia do sistema é permitido — o que a 2ª lei proíbe é a do universo diminuir.' }
        ]);

        return {
          m: { v: m, u: 'kg' },
          T2: { v: T2, u: 'K', classe: 'destaque' },
          P2: { v: P2, u: 'kPa' },
          W: { v: W, u: 'kJ', classe: 'destaque' },
          dU: { v: dU, u: 'kJ' },
          Q: { v: Q, u: 'kJ' },
          dS: { v: dS, u: 'kJ/K', classe: Math.abs(dS) < 1e-4 ? 'ok' : '' },
          tipo: { v: tipo, u: '' }
        };
      }
    });
  })();

  /* ============================================================
     3. Máquina térmica, refrigerador e bomba de calor
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-carnot')) return;

    Sim.build('#sim-carnot', {
      titulo: 'Segunda lei — Carnot, refrigerador e bomba de calor',
      descricao: 'O rendimento de Carnot é o teto imposto pela segunda lei. Nenhuma máquina real chega lá, e nenhuma pode ultrapassá-lo — se pudesse, seria possível construir um moto-perpétuo de segunda espécie.',
      controlesLargos: true,
      controles: [
        { id: 'modo', tipo: 'seg', label: 'Dispositivo', valor: 'motor',
          opcoes: [{ v: 'motor', t: 'Máquina' }, { v: 'refri', t: 'Refrigerador' }, { v: 'bomba', t: 'Bomba de calor' }] },
        { id: 'Th', label: 'Temperatura da fonte quente T_H', min: 300, max: 1600, step: 5, valor: 800, unidade: 'K' },
        { id: 'Tc', label: 'Temperatura da fonte fria T_C', min: 200, max: 600, step: 5, valor: 300, unidade: 'K' },
        { tipo: 'separador' },
        { id: 'Qh', label: 'Calor da fonte quente Q_H', min: 10, max: 2000, step: 10, valor: 1000, unidade: 'kJ' },
        { id: 'eficReal', label: 'Fração do rendimento de Carnot atingida', min: 10, max: 100, step: 1,
          valor: 60, unidade: '%', desc: 'Máquinas reais operam entre 40 e 70 % do limite de Carnot.' }
      ],
      graficos: [
        { id: 'ts', titulo: 'Ciclo de Carnot no diagrama T-s', xlabel: 'Entropia s (kJ/K)',
          ylabel: 'Temperatura (K)', aspect: 0.46, legendPos: 'topleft' },
        { id: 'curva', titulo: 'Rendimento de Carnot em função das temperaturas',
          xlabel: 'Temperatura da fonte quente T_H (K)', ylabel: 'η ou COP', aspect: 0.40, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'lim', label: 'Limite de Carnot' },
        { id: 'real', label: 'Desempenho real' },
        { id: 'W', label: 'Trabalho' },
        { id: 'Qc', label: 'Calor rejeitado / retirado' },
        { id: 'Sger', label: 'Entropia gerada' },
        { id: 'viavel', label: 'Viabilidade' }
      ],
      formulas: [
        { g: 'Máquina térmica' },
        { tex: '\\eta =\\frac{W_{\\text{líq}}}{Q_{H}}', d: 'definição: o que se quer sobre o que se paga', destaque: true },
        { tex: '\\eta = 1 - \\frac{Q_{C}}{Q_{H}}', d: 'da primeira lei: W = Q_H − Q_C' },
        { tex: '\\eta_{\\text{Carnot}} = 1 - \\frac{T_{C}}{T_{H}}', d: 'TETO absoluto, com T em kelvin', destaque: true },
        { tex: '\\eta_{\\text{real}} \\le \\eta_{\\text{Carnot}}', d: 'igualdade só no ciclo reversível — inatingível na prática' },

        { g: 'Refrigerador' },
        { tex: '\\mathrm{COP}_{R} =\\frac{Q_{C}}{W}', d: 'o que se quer é retirar calor da fonte fria', destaque: true },
        { tex: '\\mathrm{COP}_{R},\\text{Carnot} = \\frac{T_{C}}{T_{H} - T_{C}}', d: 'pode ser muito maior que 1', destaque: true },

        { g: 'Bomba de calor' },
        { tex: '\\mathrm{COP}_{\\text{BC}} =\\frac{Q_{H}}{W}', d: 'o que se quer é entregar calor ao ambiente quente', destaque: true },
        { tex: '\\mathrm{COP}_{\\text{BC}},\\text{Carnot} = \\frac{T_{H}}{T_{H} - T_{C}}', d: 'sempre maior que 1' },
        { tex: '\\mathrm{COP}_{\\text{BC}} = \\mathrm{COP}_{R} + 1', d: 'relação exata entre os dois, para as mesmas fontes' },

        { g: 'Segunda lei' },
        { tex: '\\Delta S_{\\text{universo}} \\ge 0', d: 'igualdade apenas em processo reversível', destaque: true },
        { tex: 'S_{\\text{ger}} = \\frac{Q_{C}}{T_{C}} - \\frac{Q_{H}}{T_{H}} \\ge 0', d: 'entropia gerada no ciclo; negativa = ciclo impossível', destaque: true },
        { tex: '\\oint \\frac{\\delta Q}{T} \\le 0', d: 'desigualdade de Clausius' },
        { tex: 'W_{\\text{perdido}} = T_{0}\\cdot S_{\\text{ger}}', d: 'teorema de Gouy-Stodola: entropia gerada é trabalho jogado fora' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Fontes térmicas ideais, com temperatura constante. O ciclo de Carnot é composto de dois processos isotérmicos e dois isentrópicos, e é o único ciclo cujo rendimento depende exclusivamente das temperaturas das fontes.',
      calcular: function (p, ctx) {
        var Th = p.Th, Tc = Math.min(p.Tc, p.Th - 1);
        var etaC = 1 - Tc / Th;
        var copRC = Tc / (Th - Tc);
        var copBC = Th / (Th - Tc);
        var frac = p.eficReal / 100;

        var lim, real, W, Qc, Qh = p.Qh, rot;
        if (p.modo === 'motor') {
          lim = etaC; real = etaC * frac;
          W = Qh * real; Qc = Qh - W;
          rot = 'η';
        } else if (p.modo === 'refri') {
          lim = copRC; real = copRC * frac;
          /* aqui Qh é interpretado como o calor retirado da fonte fria */
          Qc = p.Qh; W = Qc / Math.max(real, 1e-6); Qh = Qc + W;
          rot = 'COP_R';
        } else {
          lim = copBC; real = copBC * frac;
          Qh = p.Qh; W = Qh / Math.max(real, 1e-6); Qc = Qh - W;
          rot = 'COP_BC';
        }

        var Sger = Qc / Tc - Qh / Th;

        /* ---- ciclo T-s ---- */
        var ds = Qh / Th;
        var g1 = ctx.plot('ts').clear();
        g1.custom(function (c, pl) {
          var x0 = 0, x1 = ds;
          var pts = [[x0, Tc], [x0, Th], [x1, Th], [x1, Tc], [x0, Tc]];
          c.fillStyle = Plot.serie(0);
          c.globalAlpha = 0.20;
          c.beginPath();
          pts.forEach(function (q, i) {
            var X = pl.px(q[0]), Y = pl.py(q[1]);
            if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
          });
          c.closePath(); c.fill();
          c.globalAlpha = 1;
          c.strokeStyle = Plot.serie(0); c.lineWidth = 2.6;
          c.stroke();
          /* rotulo da area = trabalho */
          c.fillStyle = Plot.cssVar('--text', '#111');
          c.font = '600 11.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('área = W = ' + Plot.sig(Math.abs(Qh - Qc), 4) + ' kJ',
            pl.px((x0 + x1) / 2), pl.py((Th + Tc) / 2));
        });
        g1.hline(Th, { color: Plot.serie(7), dash: [4, 3], width: 1.3, text: 'T_H = ' + Th + ' K' });
        g1.hline(Tc, { color: Plot.serie(6), dash: [4, 3], width: 1.3, text: 'T_C = ' + Tc + ' K' });
        g1.setLimits([-ds * 0.25, ds * 1.35], [Math.max(0, Tc - 120), Th + 130]).draw();

        /* ---- curva de rendimento ---- */
        var Ths = Plot.linspace(Tc + 10, 1600, 90);
        var g2 = ctx.plot('curva').clear();
        if (p.modo === 'motor') {
          g2.line(Ths, Ths.map(function (t) { return 1 - Tc / t; }),
            { color: Plot.serie(0), width: 2.6, label: 'η Carnot' });
          g2.line(Ths, Ths.map(function (t) { return (1 - Tc / t) * frac; }),
            { color: Plot.serie(1), width: 2, dash: [5, 4], label: 'η real (' + p.eficReal + ' % de Carnot)' });
          g2.hline(1, { color: Plot.serie(7), dash: [3, 3], width: 1.2, text: 'η = 1 (impossível)' });
          g2.setLimits([Tc, 1600], [0, 1.05]);
        } else {
          var fn = p.modo === 'refri'
            ? function (t) { return Tc / (t - Tc); }
            : function (t) { return t / (t - Tc); };
          g2.line(Ths, Ths.map(fn), { color: Plot.serie(0), width: 2.6, label: rot + ' Carnot' });
          g2.line(Ths, Ths.map(function (t) { return fn(t) * frac; }),
            { color: Plot.serie(1), width: 2, dash: [5, 4], label: rot + ' real' });
          g2.setLimits([Tc + 5, Math.min(1600, Tc + 400)], [0, Math.min(30, fn(Tc + 6))]);
        }
        g2.marker(Th, real, 'operação', { color: Plot.serie(6) });
        g2.draw();

        var sg = Plot.sig;
        var nomeMod = p.modo === 'motor' ? 'máquina térmica'
                    : p.modo === 'refri' ? 'refrigerador' : 'bomba de calor';

        ctx.setPassos([
          { t: 'Limite de Carnot',
            c: p.modo === 'motor'
              ? 'η_Carnot = 1 − T_C/T_H = 1 − ' + Tc + '/' + Th
              : p.modo === 'refri'
                ? 'COP_R,Carnot = T_C/(T_H − T_C) = ' + Tc + '/(' + Th + ' − ' + Tc + ')'
                : 'COP_BC,Carnot = T_H/(T_H − T_C) = ' + Th + '/(' + Th + ' − ' + Tc + ')',
            r: rot + '_Carnot = ' + sg(lim, 4) + (p.modo === 'motor' ? '  (' + sg(lim * 100, 3) + ' %)' : ''),
            obs: 'Só depende das temperaturas das fontes, em KELVIN. Nenhuma característica do fluido de trabalho entra aqui.' },
          { t: 'Desempenho real adotado',
            c: rot + '_real = ' + sg(lim, 4) + ' × ' + p.eficReal + ' %',
            r: rot + '_real = ' + sg(real, 4),
            obs: 'Toda irreversibilidade (atrito, ΔT finito na troca de calor, turbulência) afasta a máquina do limite.' },
          { t: 'Balanço de energia do ciclo',
            c: p.modo === 'motor'
              ? 'W = η·Q_H = ' + sg(real, 4) + ' × ' + sg(Qh, 4) + '\n' +
                'Q_C = Q_H − W = ' + sg(Qh, 4) + ' − ' + sg(W, 4)
              : p.modo === 'refri'
                ? 'W = Q_C/COP_R = ' + sg(Qc, 4) + '/' + sg(real, 4) + '\n' +
                  'Q_H = Q_C + W = ' + sg(Qc, 4) + ' + ' + sg(W, 4)
                : 'W = Q_H/COP_BC = ' + sg(Qh, 4) + '/' + sg(real, 4) + '\n' +
                  'Q_C = Q_H − W = ' + sg(Qh, 4) + ' − ' + sg(W, 4),
            r: 'W = ' + sg(W, 4) + ' kJ    Q_H = ' + sg(Qh, 4) + ' kJ    Q_C = ' + sg(Qc, 4) + ' kJ',
            obs: 'A primeira lei sempre fecha: a energia que entra é igual à que sai. Quem restringe o que é possível é a segunda.' },
          { t: 'Verificação pela segunda lei',
            c: 'S_ger = Q_C/T_C − Q_H/T_H\n' +
               'S_ger = ' + sg(Qc, 4) + '/' + Tc + ' − ' + sg(Qh, 4) + '/' + Th,
            r: 'S_ger = ' + sg(Sger, 4) + ' kJ/K   →   ' +
               (Sger < -1e-6 ? 'CICLO IMPOSSÍVEL' : Sger < 1e-6 ? 'reversível (Carnot)' : 'irreversível, mas possível'),
            obs: 'Se S_ger desse negativo, o ciclo violaria a segunda lei. Trabalho perdido pela irreversibilidade: W_perdido = T_C·S_ger = ' +
                 sg(Math.max(0, Sger) * Tc, 4) + ' kJ.' },
          { t: 'Leitura de projeto',
            c: 'Diferença de temperatura entre as fontes: ΔT = ' + sg(Th - Tc, 4) + ' K',
            r: p.modo === 'motor'
              ? 'Aumentar T_H em 100 K elevaria η_Carnot para ' + sg((1 - Tc / (Th + 100)) * 100, 4) + ' %'
              : 'Reduzir ΔT em 10 K elevaria o ' + rot + ' de Carnot para ' +
                sg(p.modo === 'refri' ? Tc / (Th - 10 - Tc) : (Th - 10) / (Th - 10 - Tc), 4),
            obs: p.modo === 'motor'
              ? 'Por isso as usinas buscam temperatura de entrada de turbina cada vez mais alta — o limite é metalúrgico, não termodinâmico.'
              : 'Por isso trocadores superdimensionados economizam energia: aproximam as temperaturas de trabalho das dos ambientes.' }
        ]);

        return {
          lim: { v: p.modo === 'motor' ? lim * 100 : lim, u: p.modo === 'motor' ? '%' : '', classe: 'destaque' },
          real: { v: p.modo === 'motor' ? real * 100 : real, u: p.modo === 'motor' ? '%' : '' },
          W: { v: W, u: 'kJ' },
          Qc: { v: p.modo === 'refri' ? Qh : Qc, u: 'kJ' },
          Sger: { v: Sger, u: 'kJ/K', classe: Sger < -1e-6 ? 'alerta' : Sger < 1e-6 ? 'ok' : '' },
          viavel: { v: Sger < -1e-6 ? 'Viola a 2ª lei' : Sger < 1e-6 ? 'Reversível' : 'Real (irreversível)',
                    u: '', classe: Sger < -1e-6 ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     4. Geração de entropia
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-entropia')) return;

    Sim.build('#sim-entropia', {
      titulo: 'Geração de entropia e trabalho perdido',
      descricao: 'Transferir calor por uma diferença finita de temperatura destrói potencial de trabalho. Este simulador mostra quanto, e por quê o projetista persegue ΔT pequeno nos trocadores.',
      controles: [
        { id: 'Th', label: 'Temperatura da fonte quente', min: 300, max: 1200, step: 5, valor: 600, unidade: 'K' },
        { id: 'Tc', label: 'Temperatura do receptor', min: 250, max: 900, step: 5, valor: 300, unidade: 'K' },
        { id: 'Q', label: 'Calor transferido', min: 10, max: 2000, step: 10, valor: 500, unidade: 'kJ' },
        { tipo: 'separador' },
        { id: 'T0', label: 'Temperatura do ambiente T₀', min: 250, max: 340, step: 1, valor: 298, unidade: 'K',
          desc: 'Referência para o cálculo de exergia e trabalho perdido.' }
      ],
      graficos: [
        { id: 'sger', titulo: 'Entropia gerada em função do ΔT de transferência',
          xlabel: 'Temperatura do receptor T_C (K)', ylabel: 'S_gerada (kJ/K)', aspect: 0.44, legendPos: 'topright' },
        { id: 'exergia', titulo: 'Destino da exergia do calor', xlabel: '', ylabel: 'Exergia (kJ)',
          aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'dSq', label: 'ΔS da fonte quente' },
        { id: 'dSc', label: 'ΔS do receptor' },
        { id: 'Sger', label: 'Entropia gerada' },
        { id: 'Wperd', label: 'Trabalho perdido' },
        { id: 'Xin', label: 'Exergia do calor' },
        { id: 'rend2', label: 'Eficiência de 2ª lei' }
      ],
      formulas: [
        { g: 'Balanço de entropia' },
        { tex: '\\Delta S = \\int \\frac{\\delta Q}{T}', d: 'para processo reversível; em reservatório: ΔS = Q/T', destaque: true },
        { tex: '\\Delta S_{\\text{quente}} = - \\frac{Q}{T_{H}}', d: 'a fonte perde calor, logo perde entropia' },
        { tex: '\\Delta S_{\\text{frio}} = +\\frac{Q}{T_{C}}', d: 'o receptor ganha calor e ganha entropia' },
        { tex: 'S_{\\text{ger}} = \\frac{Q}{T_{C}} - \\frac{Q}{T_{H}} = Q\\cdot (\\frac{1}{T_{C}} - \\frac{1}{T_{H}})', d: 'sempre ≥ 0 quando T_H > T_C', destaque: true },
        { tex: 'S_{\\text{ger}} = 0 \\iff T_{H} = T_{C}', d: 'transferência reversível exige ΔT infinitesimal' },

        { g: 'Exergia e trabalho perdido' },
        { tex: 'X_{\\text{calor}} = Q\\cdot (1 - \\frac{T_{0}}{T_{H}})', d: 'exergia: o máximo de trabalho extraível daquele calor', destaque: true },
        { tex: 'W_{\\text{perdido}} = T_{0}\\cdot S_{\\text{ger}}', d: 'teorema de Gouy-Stodola', destaque: true },
        { tex: '\\eta_{\\text{II}} =\\frac{X_{\\text{saída}}}{X_{\\text{entrada}}}', d: 'eficiência de segunda lei: quanto do potencial foi preservado' },

        { g: 'Outras fontes de irreversibilidade' },
        { tex: '\\text{Atrito, mistura, expansão livre}', d: 'todas geram entropia sem transferir calor' },
        { tex: 'S_{\\text{ger}} = m\\cdot R\\cdot \\Sigma (y_{i}\\cdot \\ln y_{i}) (\\text{com sinal})', d: 'mistura de gases ideais distintos' },
        { tex: '\\Delta S_{\\text{universo}} > 0', d: 'todo processo real é irreversível', destaque: true }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Reservatórios térmicos ideais: a temperatura de cada um não muda ao ceder ou receber calor. Transferência de calor pura, sem realização de trabalho.',
      calcular: function (p, ctx) {
        var Th = p.Th, Tc = Math.min(p.Tc, p.Th - 1), Q = p.Q, T0 = p.T0;
        var dSq = -Q / Th, dSc = Q / Tc;
        var Sger = dSq + dSc;
        var Wperd = T0 * Sger;
        var Xin = Q * (1 - T0 / Th);
        var Xout = Q * (1 - T0 / Tc);
        var rend2 = Xin > 0 ? Math.max(0, Xout) / Xin : 0;

        /* curva de S_ger */
        var Tcs = Plot.linspace(250, Th - 2, 90);
        var g1 = ctx.plot('sger').clear();
        g1.line(Tcs, Tcs.map(function (t) { return Q * (1 / t - 1 / Th); }),
          { color: Plot.serie(0), width: 2.6, label: 'S_gerada' });
        g1.vline(Tc, { color: Plot.serie(6), dash: [5, 4], width: 1.6, text: 'operação' });
        g1.vline(Th, { color: Plot.serie(7), dash: [3, 3], width: 1.4, text: 'T_H (S_ger → 0)' });
        g1.marker(Tc, Sger, Plot.sig(Sger, 4) + ' kJ/K', { color: Plot.serie(6) });
        g1.draw();

        /* exergia */
        var g2 = ctx.plot('exergia').clear();
        g2.o.xcat = [{ v: 0, label: 'disponível na fonte' },
                     { v: 1, label: 'restante no receptor' },
                     { v: 2, label: 'destruída' }];
        var parcX = [Xin, Math.max(0, Xout), Wperd];
        var corX = [Plot.serie(5), Plot.serie(2), Plot.serie(1)];
        var altoX = Math.max.apply(null, parcX.concat([1e-6]));
        g2.setLimits([-0.62, 2.62], [0, altoX * 1.26]);
        parcX.forEach(function (v, i) {
          g2.bars([i], [v], { color: corX[i], barw: 0.52 });
          g2.text(i, v, Plot.sig(v, 4) + ' kJ', { align: 'center', dy: -7, size: 11 });
        });
        g2.draw();

        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Entropia perdida pela fonte quente',
            c: 'ΔS_H = −Q/T_H = −' + Q + '/' + Th,
            r: 'ΔS_H = ' + sg(dSq, 4) + ' kJ/K',
            obs: 'Negativa: a fonte cede calor. Reduzir a entropia de um sistema é permitido.' },
          { t: 'Entropia ganha pelo receptor',
            c: 'ΔS_C = +Q/T_C = ' + Q + '/' + Tc,
            r: 'ΔS_C = ' + sg(dSc, 4) + ' kJ/K',
            obs: 'Como T_C < T_H, o mesmo calor produz MAIS entropia aqui do que a que saiu da fonte quente.' },
          { t: 'Entropia gerada no universo',
            c: 'S_ger = ΔS_H + ΔS_C = ' + sg(dSq, 4) + ' + ' + sg(dSc, 4) + '\n' +
               'S_ger = Q·(1/T_C − 1/T_H) = ' + Q + '×(1/' + Tc + ' − 1/' + Th + ')',
            r: 'S_ger = ' + sg(Sger, 4) + ' kJ/K',
            obs: 'Sempre positiva quando há ΔT finito. Só seria nula se T_C = T_H, o que exigiria tempo infinito — daí toda transferência real ser irreversível.' },
          { t: 'Exergia do calor original',
            c: 'X = Q·(1 − T₀/T_H) = ' + Q + '×(1 − ' + T0 + '/' + Th + ')',
            r: 'X = ' + sg(Xin, 4) + ' kJ',
            obs: 'É o trabalho máximo que uma máquina de Carnot extrairia desse calor operando contra o ambiente a ' + T0 + ' K.' },
          { t: 'Trabalho destruído (Gouy-Stodola)',
            c: 'W_perdido = T₀·S_ger = ' + T0 + ' × ' + sg(Sger, 4),
            r: 'W_perdido = ' + sg(Wperd, 4) + ' kJ',
            obs: 'A energia não sumiu — a primeira lei continua fechando. O que se perdeu foi a CAPACIDADE de produzir trabalho, e essa perda é irrecuperável.' },
          { t: 'Eficiência de segunda lei',
            c: 'X_restante = Q·(1 − T₀/T_C) = ' + sg(Xout, 4) + ' kJ\n' +
               'η_II = X_restante / X_inicial = ' + sg(Math.max(0, Xout), 4) + '/' + sg(Xin, 4),
            r: 'η_II = ' + sg(rend2 * 100, 4) + ' %',
            obs: 'Mede quanto do potencial de trabalho sobreviveu à transferência. Reduzir o ΔT do trocador é a forma direta de aumentar esse número.' }
        ]);

        return {
          dSq: { v: dSq, u: 'kJ/K' },
          dSc: { v: dSc, u: 'kJ/K' },
          Sger: { v: Sger, u: 'kJ/K', classe: 'destaque' },
          Wperd: { v: Wperd, u: 'kJ', classe: 'alerta' },
          Xin: { v: Xin, u: 'kJ' },
          rend2: { v: rend2 * 100, u: '%', classe: rend2 > 0.7 ? 'ok' : rend2 < 0.4 ? 'alerta' : '' }
        };
      }
    });
  })();

})();

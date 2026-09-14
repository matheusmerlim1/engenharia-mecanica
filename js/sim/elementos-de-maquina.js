/* ============================================================
   Elementos de Máquina I — simuladores
   1. sim-fadiga   : limite de fadiga corrigido pelos fatores de Marin + curva S-N
   2. sim-goodman  : critérios de falha por fadiga com tensão média
   3. sim-parafuso : junta parafusada pré-carregada (rigidez, pré-carga, torque)
   4. sim-solda    : solda de filete sob carga excêntrica (momento polar unitário)

   Modelo e constantes conforme Shigley (Budynas & Nisbett, "Elementos de
   Máquinas de Shigley", 8ª/10ª ed.) e Norton, "Projeto de Máquinas".
   ============================================================ */

/* ------------------------------------------------------------
   1. LIMITE DE RESISTÊNCIA À FADIGA — FATORES DE MARIN
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-fadiga')) return;

  /* ka = a * Sut^b   (Shigley Tab. 6-2, Sut em MPa) */
  var ACAB = {
    ret:  { a: 1.58, b: -0.085, t: 'Retificado' },
    usi:  { a: 4.51, b: -0.265, t: 'Usinado / laminado a frio' },
    lam:  { a: 57.7, b: -0.718, t: 'Laminado a quente' },
    forj: { a: 272,  b: -0.995, t: 'Forjado' }
  };
  var KE = { r50: 1.000, r90: 0.897, r95: 0.868, r99: 0.814, r999: 0.753 };

  function seLinha(Sut) { return Sut <= 1400 ? 0.5 * Sut : 700; }

  function fatorKa(Sut, acab) {
    var A = ACAB[acab] || ACAB.usi;
    return Math.min(1, A.a * Math.pow(Sut, A.b));
  }

  function fatorKb(d, carreg) {
    if (carreg === 'axial') return 1;              /* não há gradiente de tensão */
    if (d < 2.79) d = 2.79;
    if (d <= 51) return 1.24 * Math.pow(d, -0.107);
    if (d <= 254) return 1.51 * Math.pow(d, -0.157);
    return 1.51 * Math.pow(254, -0.157);
  }

  function fatorKc(carreg) {
    return carreg === 'flexao' ? 1 : carreg === 'axial' ? 0.85 : 0.59;
  }

  /* kd — Shigley Eq. 6-27, válida de 37 a 540 °C */
  function fatorKd(T) {
    if (T <= 37) return 1;
    var Tc = Math.min(T, 540);
    return 0.9877 + 0.6507e-3 * Tc - 0.3414e-5 * Tc * Tc +
           0.5621e-8 * Tc * Tc * Tc - 6.246e-12 * Tc * Tc * Tc * Tc;
  }

  /* fração da resistência em 10^3 ciclos (Shigley Fig. 6-18) */
  function fracF(Sut) {
    var k = Sut / 6.8948;                 /* MPa -> kpsi */
    if (k < 70) return 0.9;
    if (k > 200) k = 200;
    return 1.06 - 2.8e-3 * k + 6.9e-6 * k * k;
  }

  Sim.build('#sim-fadiga', {
    titulo: 'Limite de resistência à fadiga — fatores de Marin',
    descricao: 'Se = ka·kb·kc·kd·ke·Se′. Veja quanto o corpo de prova de laboratório perde ' +
               'quando vira peça real: acabamento bruto e diâmetro grande derrubam Se em mais de 50 %.',
    controles: [
      { id: 'Sut', label: 'Resistência à tração Sut', min: 300, max: 1800, step: 10, valor: 690,
        unidade: 'MPa', desc: 'Aço 1050 laminado ≈ 690 · 1020 ≈ 470 · 4340 temperado ≈ 1280' },
      { id: 'acab', tipo: 'select', label: 'Acabamento superficial (ka)', valor: 'usi',
        opcoes: [
          { v: 'ret', t: 'Retificado' },
          { v: 'usi', t: 'Usinado / laminado a frio' },
          { v: 'lam', t: 'Laminado a quente' },
          { v: 'forj', t: 'Forjado' }
        ] },
      { id: 'd', label: 'Diâmetro da seção (kb)', min: 5, max: 200, step: 1, valor: 30, unidade: 'mm',
        desc: 'Só age em flexão/torção. Em carga axial kb = 1.' },
      { id: 'carreg', tipo: 'seg', label: 'Carregamento (kc)', valor: 'flexao',
        opcoes: [ { v: 'flexao', t: 'Flexão' }, { v: 'axial', t: 'Axial' }, { v: 'torcao', t: 'Torção' } ] },
      { id: 'T', label: 'Temperatura de operação (kd)', min: 20, max: 540, step: 5, valor: 20, unidade: '°C' },
      { id: 'conf', tipo: 'select', label: 'Confiabilidade (ke)', valor: 'r99',
        opcoes: [
          { v: 'r50', t: '50 %  (ke = 1,000)' },
          { v: 'r90', t: '90 %  (ke = 0,897)' },
          { v: 'r95', t: '95 %  (ke = 0,868)' },
          { v: 'r99', t: '99 %  (ke = 0,814)' },
          { v: 'r999', t: '99,9 % (ke = 0,753)' }
        ] },
      { tipo: 'separador' },
      { id: 'sa', label: 'Tensão alternada aplicada σa', min: 20, max: 800, step: 5, valor: 260, unidade: 'MPa',
        desc: 'Usada para estimar a vida N na reta de vida finita.' }
    ],
    graficos: [
      { id: 'sn',  titulo: 'Diagrama S–N (Wöhler)', xlabel: 'log₁₀ N (ciclos até a falha)',
        ylabel: 'Resistência à fadiga Sf (MPa)', aspect: 0.52, legendPos: 'bottomleft' },
      { id: 'sut', titulo: 'Se′ e Se em função de Sut', xlabel: 'Sut (MPa)',
        ylabel: 'Limite de fadiga (MPa)', aspect: 0.42 }
    ],
    saidas: [
      { id: 'Sel', label: "Se′ (corpo de prova)" },
      { id: 'ka', label: 'ka superfície' },
      { id: 'kb', label: 'kb tamanho' },
      { id: 'kc', label: 'kc carregamento' },
      { id: 'kd', label: 'kd temperatura' },
      { id: 'ke', label: 'ke confiabilidade' },
      { id: 'Se', label: 'Se corrigido' },
      { id: 'N',  label: 'Vida estimada N' }
    ],
    nota: 'Se′ = 0,5·Sut para aços com Sut ≤ 1400 MPa; acima disso satura em 700 MPa. ' +
          'Reta de vida finita Sf = a·N^b entre 10³ e 10⁶ ciclos, com a = (f·Sut)²/Se e ' +
          'b = −⅓·log₁₀(f·Sut/Se). Não inclui kf (concentração de tensão) nem tensão média.',
      formulas: [
        { g: 'Limite de fadiga do corpo de prova' },
        { f: "Se′ = 0,5·Sut", d: 'aços com Sut ≤ 1400 MPa', destaque: true },
        { f: "Se′ = 700 MPa", d: 'aços com Sut > 1400 MPa — satura, não cresce mais' },
        { f: "Se′ = 0,4·Sut", d: 'ferros fundidos (estimativa)' },

        { g: 'Fatores modificadores de Marin' },
        { tex: 'Se = ka\\cdot kb\\cdot kc\\cdot kd\\cdot ke\\cdot kf\\cdot Se\'', d: 'do corpo de prova para a peça real', destaque: true },
        { tex: 'ka = a\\cdot \\text{Sut}^{b}', d: 'superfície: retificado (1,58; −0,085) · usinado (4,51; −0,265) · laminado a quente (57,7; −0,718) · forjado (272; −0,995)' },
        { tex: 'kb = 1,24\\cdot d^(- 0,107)', d: 'tamanho, para 2,79 ≤ d ≤ 51 mm' },
        { tex: 'kb = 1,51\\cdot d^(- 0,157)', d: 'tamanho, para 51 < d ≤ 254 mm' },
        { tex: 'kb = 1', d: 'SEMPRE 1 em carregamento axial — não há gradiente de tensão' },
        { tex: 'kc =\\frac{1}{0,85 / 0,59}', d: 'carregamento: flexão / axial / torção' },
        { tex: 'kd = \\frac{ST}{\\text{SRT}}', d: 'temperatura; ≈ 1 até 250 °C' },
        { tex: 'ke =\\frac{0,897}{0,868 / 0,814 / 0,753}', d: 'confiabilidade: 90 % / 95 % / 99 % / 99,9 %' },

        { g: 'Vida finita — curva S-N' },
        { tex: 'Sf = a\\cdot N^{b}', d: 'região de 10³ a 10⁶ ciclos, reta em escala log-log', destaque: true },
        { tex: 'a =\\frac{(f\\cdot \\text{Sut})^{2}}{Se}', d: 'f ≈ 0,9 (Sut baixo) a 0,8 (Sut alto)' },
        { tex: 'b = - (\\frac{1}{3})\\cdot \\log_{10}(f\\cdot \\frac{\\text{Sut}}{Se})', d: 'inclinação negativa da reta' },
        { tex: 'N = (\\frac{\\sigma a}{a})^(\\frac{1}{b})', d: 'vida estimada para uma amplitude σa' },

        { g: 'Concentração de tensão em fadiga' },
        { tex: 'Kf = 1 + q\\cdot (Kt - 1)', d: 'q = sensibilidade ao entalhe, entre 0 e 1' },
        { tex: '\\sigma a,\\text{efetivo} = Kf\\cdot \\sigma a', d: 'aplica-se sempre à parcela alternada' }
      ],
      formulasTitulo: 'Fórmulas — limite de fadiga e fatores de Marin',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    calcular: function (p, ctx) {
      var Sut = p.Sut;
      var Sel = seLinha(Sut);
      var ka = fatorKa(Sut, p.acab);
      var kb = fatorKb(p.d, p.carreg);
      var kc = fatorKc(p.carreg);
      var kd = fatorKd(p.T);
      var ke = KE[p.conf] || 1;
      var Se = ka * kb * kc * kd * ke * Sel;

      var f = fracF(Sut);
      var S1000 = f * Sut;
      var a = S1000 * S1000 / Se;
      var b = -Math.log10(S1000 / Se) / 3;

      /* ---------- gráfico 1: S-N ---------- */
      var g = ctx.plot('sn').clear();
      /* trecho de baixo ciclo: de N=1 (Sut) até N=10^3 (f·Sut) */
      g.line([0, 3], [Sut, S1000], { color: Plot.serie(3), dash: [6, 4], label: 'Baixo ciclo (N < 10³)' });
      /* reta de vida finita, em escala log-log fica reta em log10 N */
      var lx = Plot.linspace(3, 6, 60);
      var ly = Plot.map(lx, function (L) { return a * Math.pow(Math.pow(10, L), b); });
      g.line(lx, ly, { color: Plot.serie(0), width: 2.4, label: 'Vida finita  Sf = a·N^b' });
      g.line([6, 8], [Se, Se], { color: Plot.serie(1), width: 2.4, label: 'Patamar Se (vida infinita)' });
      g.vline(3, { color: Plot.serie(4), text: '10³ ciclos' });
      g.vline(6, { color: Plot.serie(4), text: '10⁶ ciclos' });
      g.hline(Se, { color: Plot.serie(1), text: 'Se = ' + Plot.sig(Se, 4) + ' MPa' });

      var Nv, Ntxt, classeN;
      if (p.sa <= Se) {
        Nv = Infinity; Ntxt = '> 10⁶ (infinita)'; classeN = 'ok';
        g.hline(p.sa, { color: Plot.serie(2), text: 'σa = ' + p.sa + ' MPa → vida infinita' });
      } else if (p.sa >= S1000) {
        Nv = NaN; Ntxt = '< 10³ (baixo ciclo)'; classeN = 'alerta';
        g.hline(p.sa, { color: Plot.serie(2), text: 'σa = ' + p.sa + ' MPa → fora do método σ–N' });
      } else {
        Nv = Math.pow(p.sa / a, 1 / b);
        Ntxt = Plot.sig(Nv, 3) + ' ciclos'; classeN = 'destaque';
        g.hline(p.sa, { color: Plot.serie(2), text: 'σa = ' + p.sa + ' MPa' });
        g.marker(Math.log10(Nv), p.sa, 'N ≈ ' + Plot.sig(Nv, 3), { color: Plot.serie(2) });
      }
      g.setLimits([0, 8], [0, Math.max(Sut, p.sa) * 1.12]).draw();

      /* ---------- gráfico 2: Se' e Se x Sut ---------- */
      var xs = Plot.linspace(300, 1800, 90);
      var y1 = Plot.map(xs, seLinha);
      var y2 = Plot.map(xs, function (S) {
        return fatorKa(S, p.acab) * kb * kc * kd * ke * seLinha(S);
      });
      ctx.plot('sut').clear()
        .line(xs, y1, { color: Plot.serie(0), label: "Se′ = 0,5·Sut (satura em 700)" })
        .line(xs, y2, { color: Plot.serie(1), label: 'Se corrigido por Marin' })
        .hline(700, { color: Plot.serie(4), text: 'patamar 700 MPa (aços)' })
        .vline(1400, { color: Plot.serie(4), text: 'Sut = 1400 MPa' })
        .marker(Sut, Sel, "Se′", { color: Plot.serie(0) })
        .marker(Sut, Se, 'Se', { color: Plot.serie(1), dy: 14 })
        .draw();

      var nt = Plot.numTex, sg = Plot.sig;
      ctx.setPassos([
        { t: 'Limite de fadiga do corpo de prova',
          tex: 'S_e\\prime  = 0{,}5\\,S_{\\text{ut}} \\quad (S_{\\text{ut}} \\le 1400\\ \\text{MPa})',
          texSub: 'S_e\\prime  = 0{,}5 \\cdot ' + nt(Sut, 5) + ' = ' + nt(Sel, 4) + '\\ \\text{MPa}',
          obs: 'Valor do CORPO DE PROVA: polido, 7,6 mm, flexão rotativa. A peça real vale menos.' },
        { t: 'Fator de superfície k_a',
          tex: 'k_a = a \\cdot S_{\\text{ut}}^{\\,b}',
          texSub: 'k_a = ' + nt(ACAB[p.acab].a, 4) + ' \\cdot ' + nt(Sut, 5) +
                  '^{' + ACAB[p.acab].b + '} = ' + nt(ka, 4),
          obs: 'Acabamento: ' + ACAB[p.acab].t + '. Quanto mais rugosa a superfície, mais fácil nuclear a trinca.' },
        { t: 'Fator de tamanho k_b',
          tex: 'k_b = 1{,}24\\,d^{-0{,}107} \\quad (2{,}79 \\le d \\le 51\\ \\text{mm})',
          texSub: 'k_b = 1{,}24 \\cdot ' + p.d + '^{-0{,}107} = ' + nt(kb, 4),
          obs: p.carreg === 'axial'
            ? 'Em carregamento AXIAL adota-se k_b = 1: não há gradiente de tensão na seção.'
            : 'Peça maior tem mais volume sob tensão alta, logo maior chance de conter um defeito crítico.' },
        { t: 'Demais fatores de Marin',
          tex: 'S_e = k_a k_b k_c k_d k_e \\cdot S_e\\prime ',
          texSub: 'S_e = ' + nt(ka, 4) + ' \\cdot ' + nt(kb, 4) + ' \\cdot ' + nt(kc, 3) +
                  ' \\cdot ' + nt(kd, 3) + ' \\cdot ' + nt(ke, 3) + ' \\cdot ' + nt(Sel, 4) +
                  ' = ' + nt(Se, 4) + '\\ \\text{MPa}',
          obs: 'k_c = ' + sg(kc, 3) + ' (carregamento) · k_d = ' + sg(kd, 3) +
               ' (temperatura) · k_e = ' + sg(ke, 3) + ' (confiabilidade ' + p.conf + ' %).' },
        { t: 'Perda total em relação ao corpo de prova',
          texSub: '\\frac{S_e}{S_e\\prime } = \\frac{' + nt(Se, 4) + '}{' + nt(Sel, 4) + '} = ' +
                  nt(Se / Sel, 3) + ' \\;\\Rightarrow\\; ' + sg((1 - Se / Sel) * 100, 3) +
                  '\\%\\ \\text{de perda}',
          obs: 'É essa diferença que separa o ensaio de laboratório do componente real.' },
        { t: 'Vida para a amplitude aplicada',
          tex: 'S_f = a\\,N^{\\,b} \\;\\Rightarrow\\; N = \\left(\\frac{\\sigma_a}{a}\\right)^{1/b}',
          texSub: '\\sigma_a = ' + nt(p.sa, 4) + '\\ \\text{MPa} \\quad a = ' + nt(a, 5) +
                  ' \\quad b = ' + nt(b, 4),
          r: p.sa <= Se ? 'σa ≤ Se → VIDA INFINITA' : 'N ≈ ' + Ntxt + ' ciclos',
          obs: p.sa <= Se
            ? 'Abaixo do limite de fadiga corrigido o aço tem vida infinita (acima de 10⁶ ciclos).'
            : 'Região de vida finita: a peça vai falhar, a questão é quando.' }
      ]);

      return {
        Sel: { v: Sel, u: 'MPa' },
        ka: { v: ka, classe: ka < 0.6 ? 'alerta' : '' },
        kb: { v: kb },
        kc: { v: kc },
        kd: { v: kd, classe: kd < 0.9 ? 'alerta' : '' },
        ke: { v: ke },
        Se: { v: Se, u: 'MPa', classe: 'destaque' },
        N:  { v: Ntxt, classe: classeN }
      };
    }
  });
})();


/* ------------------------------------------------------------
   2. FADIGA COM TENSÃO MÉDIA — GOODMAN / SODERBERG / GERBER / ASME
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-goodman')) return;

  Sim.build('#sim-goodman', {
    titulo: 'Diagrama de fadiga com tensão média',
    descricao: 'Ponto de operação (σm, σa) contra os quatro critérios clássicos. ' +
               'Goodman é a reta mais baixa entre os que passam por Se e Sut — por isso é o critério de projeto.',
    controles: [
      { id: 'Sut', label: 'Sut', min: 300, max: 1600, step: 10, valor: 690, unidade: 'MPa' },
      { id: 'Sy',  label: 'Sy (escoamento)', min: 150, max: 1400, step: 10, valor: 580, unidade: 'MPa' },
      { id: 'Se',  label: 'Se corrigido', min: 40, max: 700, step: 5, valor: 193, unidade: 'MPa',
        desc: 'Saída do simulador anterior. Se > Sy não faz sentido físico.' },
      { tipo: 'separador' },
      { id: 'sa', label: 'Tensão alternada σa', min: 0, max: 500, step: 5, valor: 70, unidade: 'MPa' },
      { id: 'sm', label: 'Tensão média σm', min: 0, max: 900, step: 5, valor: 120, unidade: 'MPa' },
      { id: 'verLanger', tipo: 'check', label: 'Mostrar reta de Langer (escoamento no 1º ciclo)', valor: true },
      { id: 'verCarga', tipo: 'check', label: 'Mostrar reta de carga (r = σa/σm constante)', valor: true }
    ],
    graficos: [
      { id: 'diag', titulo: 'Plano σm – σa', xlabel: 'Tensão média σm (MPa)',
        ylabel: 'Tensão alternada σa (MPa)', aspect: 0.62, legendPos: 'topleft' }
    ],
    saidas: [
      { id: 'nGood', label: 'n Goodman mod.' },
      { id: 'nSod',  label: 'n Soderberg' },
      { id: 'nGer',  label: 'n Gerber' },
      { id: 'nAsme', label: 'n ASME-elíptico' },
      { id: 'nLan',  label: 'n Langer (escoam.)' },
      { id: 'crit',  label: 'Critério dominante' }
    ],
    nota: 'Goodman: σa/Se + σm/Sut = 1/n · Soderberg: σa/Se + σm/Sy = 1/n · ' +
          'Gerber: n·σa/Se + (n·σm/Sut)² = 1 · ASME: (n·σa/Se)² + (n·σm/Sy)² = 1 · ' +
          'Langer: σa + σm = Sy/n. Válido para σm ≥ 0; com σm < 0 use σa = Se (a compressão média não reduz a vida).',
      formulas: [
        { g: 'Decomposição do carregamento cíclico' },
        { tex: '\\sigma m = \\frac{\\sigma \\text{máx} + \\sigma \\text{mín}}{2}', d: 'tensão média', destaque: true },
        { tex: '\\sigma a = |\\sigma \\text{máx} - \\sigma \\text{mín}|/2', d: 'amplitude alternada — é ela que causa fadiga', destaque: true },
        { tex: 'R =\\frac{\\sigma \\text{mín}}{\\sigma \\text{máx}}', d: 'razão de tensões: −1 alternado puro, 0 repetido' },
        { tex: 'A =\\frac{\\sigma a}{\\sigma m}', d: 'razão de amplitude' },

        { g: 'Critérios de falha por fadiga' },
        { tex: '\\frac{1}{n} = \\frac{\\sigma a}{Se} + \\frac{\\sigma m}{\\text{Sut}}', d: 'Goodman modificado — reta; padrão de projeto', destaque: true },
        { tex: '\\frac{1}{n} = \\frac{\\sigma a}{Se} + \\frac{\\sigma m}{Sy}', d: 'Soderberg — reta; o mais conservador, já protege do escoamento' },
        { tex: 'n\\cdot \\frac{\\sigma a}{Se} + (n\\cdot \\frac{\\sigma m}{\\text{Sut}})^{2} = 1', d: 'Gerber — parábola; melhor ajuste experimental' },
        { tex: '(n\\cdot \\frac{\\sigma a}{Se})^{2} + (n\\cdot \\frac{\\sigma m}{Sy})^{2} = 1', d: 'ASME elíptica — usada em eixos' },

        { g: 'Verificação obrigatória à parte' },
        { tex: 'ny =\\frac{Sy}{\\sigma a + \\sigma m}', d: 'escoamento no primeiro ciclo — Goodman e Gerber não cobrem isso', destaque: true },
        { tex: 'n_{\\text{projeto}} = \\text{mín}(n_{\\text{fadiga}}, ny)', d: 'adota-se sempre o menor' },

        { g: 'Casos particulares' },
        { tex: '\\sigma m \\le 0 \\to \\sigma a,\\text{adm} = Se', d: 'média de compressão não é prejudicial: fecha a trinca' },
        { tex: '\\sigma m = 0 \\to n = \\frac{Se}{\\sigma a}', d: 'carregamento totalmente alternado' },
        { tex: '\\text{Ordem: Soderberg} < \\text{Goodman} < \\text{Gerber}', d: 'do mais conservador para o menos' }
      ],
      formulasTitulo: 'Fórmulas — tensão média e critérios de fadiga',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    calcular: function (p, ctx) {
      var Sut = p.Sut, Sy = Math.min(p.Sy, p.Sut), Se = Math.min(p.Se, Sy);
      var sa = p.sa, sm = p.sm;

      var nGood = sa / Se + sm / Sut > 0 ? 1 / (sa / Se + sm / Sut) : Infinity;
      var nSod  = sa / Se + sm / Sy  > 0 ? 1 / (sa / Se + sm / Sy)  : Infinity;
      var nAsme = (sa || sm) ? 1 / Math.sqrt(Math.pow(sa / Se, 2) + Math.pow(sm / Sy, 2)) : Infinity;
      var nLan  = (sa + sm) > 0 ? Sy / (sa + sm) : Infinity;
      var nGer;
      if (sa <= 0) nGer = Sut / Math.max(sm, 1e-9);
      else if (sm <= 0) nGer = Se / sa;
      else {
        nGer = 0.5 * Math.pow(Sut / sm, 2) * (sa / Se) *
               (-1 + Math.sqrt(1 + Math.pow(2 * sm * Se / (Sut * sa), 2)));
      }

      var xs, ys, i;
      var g = ctx.plot('diag').clear();

      /* Goodman */
      g.line([0, Sut], [Se, 0], { color: Plot.serie(0), width: 2.4, label: 'Goodman modificado' });
      /* Soderberg */
      g.line([0, Sy], [Se, 0], { color: Plot.serie(1), label: 'Soderberg' });
      /* Gerber */
      xs = Plot.linspace(0, Sut, 80);
      ys = Plot.map(xs, function (x) { return Se * (1 - Math.pow(x / Sut, 2)); });
      g.line(xs, ys, { color: Plot.serie(2), label: 'Gerber (parábola)' });
      /* ASME elíptico */
      xs = Plot.linspace(0, Sy, 80);
      ys = Plot.map(xs, function (x) { return Se * Math.sqrt(Math.max(0, 1 - Math.pow(x / Sy, 2))); });
      g.line(xs, ys, { color: Plot.serie(3), label: 'ASME-elíptico' });
      /* Langer */
      if (p.verLanger) {
        g.line([0, Sy], [Sy, 0], { color: Plot.serie(5), dash: [6, 4], label: 'Langer (escoamento)' });
      }
      /* reta de carga */
      if (p.verCarga) {
        var esc = Sut / Math.max(sm, 1e-6);
        var k = Math.min(esc, sa > 0 ? Se * 1.6 / sa : 50);
        g.line([0, sm * k], [0, sa * k], { color: Plot.serie(6), dash: [3, 3], label: 'Reta de carga r = σa/σm' });
      }

      var nmin = Math.min(nGood, nLan);
      g.marker(sm, sa, 'operação (n = ' + Plot.sig(nmin, 3) + ')',
        { color: nmin < 1 ? Plot.serie(7) : Plot.serie(4), r: 5.5, align: 'left' });

      g.setLimits([0, Sut * 1.05], [0, Math.max(Se, sa, Sy * 0.55) * 1.25]).draw();

      var crit = nLan < nGood ? 'Escoamento (Langer)' : 'Fadiga (Goodman)';

      var ntg = Plot.numTex, sgg = Plot.sig;
      ctx.setPassos([
        { t: 'Componentes do carregamento',
          tex: '\\sigma_m = \\frac{\\sigma_{\\text{max}} + \\sigma_{\\text{min}}}{2} \\qquad \\sigma_a = \\frac{|\\sigma_{\\text{max}} - \\sigma_{\\text{min}}|}{2}',
          texSub: '\\sigma_a = ' + ntg(p.sa, 4) + '\\ \\text{MPa} \\qquad \\sigma_m = ' +
                  ntg(p.sm, 4) + '\\ \\text{MPa}',
          obs: 'σa é o que causa fadiga; σm de tração agrava, porque mantém a trinca aberta.' },
        { t: 'Critério de Goodman modificado',
          tex: '\\frac{1}{n} = \\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_{\\text{ut}}}',
          texSub: '\\frac{1}{n} = \\frac{' + ntg(p.sa, 4) + '}{' + ntg(p.Se, 4) + '} + \\frac{' +
                  ntg(p.sm, 4) + '}{' + ntg(p.Sut, 5) + '} = ' + ntg(1 / nGood, 4) +
                  ' \\;\\Rightarrow\\; n = ' + ntg(nGood, 3),
          obs: 'É a reta padrão de projeto: simples e levemente conservadora.' },
        { t: 'Soderberg — o mais conservador',
          tex: '\\frac{1}{n} = \\frac{\\sigma_a}{S_e} + \\frac{\\sigma_m}{S_y}',
          texSub: 'n_{\\text{Sod}} = ' + ntg(nSod, 3),
          obs: 'Usa S_y em vez de S_ut, então já protege contra o escoamento — por isso dá o menor n.' },
        { t: 'Verificação do escoamento no 1º ciclo',
          tex: 'n_y = \\frac{S_y}{\\sigma_a + \\sigma_m}',
          texSub: 'n_y = \\frac{' + ntg(p.Sy, 5) + '}{' + ntg(p.sa, 4) + ' + ' + ntg(p.sm, 4) +
                  '} = ' + ntg(nLan, 3),
          obs: 'Goodman e Gerber NÃO garantem isso. A peça pode escoar já na primeira aplicação da carga máxima.' },
        { t: 'Coeficiente de projeto',
          texSub: 'n_{\\text{projeto}} = \\min(n_{\\text{fadiga}},\\, n_y) = ' + ntg(nmin, 3),
          r: nmin < 1 ? 'REPROVADO — n < 1' : nmin < 1.5 ? 'Aprovado com margem curta' : 'Aprovado',
          obs: 'Critério mais restritivo: ' + crit + '.' }
      ]);

      return {
        nGood: { v: nGood, classe: nGood < 1 ? 'alerta' : 'destaque' },
        nSod:  { v: nSod,  classe: nSod < 1 ? 'alerta' : '' },
        nGer:  { v: nGer,  classe: nGer < 1 ? 'alerta' : '' },
        nAsme: { v: nAsme, classe: nAsme < 1 ? 'alerta' : '' },
        nLan:  { v: nLan,  classe: nLan < 1 ? 'alerta' : '' },
        crit:  { v: crit, classe: nmin < 1 ? 'alerta' : 'ok' }
      };
    }
  });
})();


/* ------------------------------------------------------------
   3. JUNTA PARAFUSADA PRÉ-CARREGADA
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-parafuso')) return;

  /* At e Ar da série métrica — ISO 261/262, valores de Shigley Tab. 8-1 */
  var ROSCA = {
    'M6x1':     { d: 6,  p: 1.00, At: 20.1, Ar: 17.9, serie: 'grosso' },
    'M8x1.25':  { d: 8,  p: 1.25, At: 36.6, Ar: 32.8, serie: 'grosso' },
    'M10x1.5':  { d: 10, p: 1.50, At: 58.0, Ar: 52.3, serie: 'grosso' },
    'M12x1.75': { d: 12, p: 1.75, At: 84.3, Ar: 76.3, serie: 'grosso' },
    'M14x2':    { d: 14, p: 2.00, At: 115,  Ar: 104,  serie: 'grosso' },
    'M16x2':    { d: 16, p: 2.00, At: 157,  Ar: 144,  serie: 'grosso' },
    'M20x2.5':  { d: 20, p: 2.50, At: 245,  Ar: 225,  serie: 'grosso' },
    'M24x3':    { d: 24, p: 3.00, At: 353,  Ar: 324,  serie: 'grosso' },
    'M10x1.25': { d: 10, p: 1.25, At: 61.2, Ar: 56.3, serie: 'fino' },
    'M12x1.25': { d: 12, p: 1.25, At: 92.1, Ar: 86.0, serie: 'fino' },
    'M16x1.5':  { d: 16, p: 1.50, At: 167,  Ar: 157,  serie: 'fino' },
    'M20x1.5':  { d: 20, p: 1.50, At: 272,  Ar: 259,  serie: 'fino' }
  };

  /* ISO 898-1 — Sp, Sy, Sut mínimos em MPa (Shigley Tab. 8-11) */
  var CLASSE = {
    '4.8':  { Sp: 310, Sy: 340, Sut: 420 },
    '5.8':  { Sp: 380, Sy: 420, Sut: 520 },
    '8.8':  { Sp: 600, Sy: 660, Sut: 830 },
    '10.9': { Sp: 830, Sy: 940, Sut: 1040 },
    '12.9': { Sp: 970, Sy: 1100, Sut: 1220 }
  };

  var EMEMBRO = { aco: 207000, ff: 100000, alu: 71000 };

  Sim.build('#sim-parafuso', {
    titulo: 'Junta parafusada pré-carregada',
    descricao: 'Rigidez do parafuso e dos membros, constante da junta C, pré-carga e torque de aperto. ' +
               'O gráfico mostra por que só uma fração C da carga externa chega ao parafuso.',
    controles: [
      { id: 'rosca', tipo: 'select', label: 'Rosca métrica (ISO 261/262)', valor: 'M12x1.75',
        opcoes: [
          { v: 'M6x1',     t: 'M6 × 1,0   (grosso)' },
          { v: 'M8x1.25',  t: 'M8 × 1,25  (grosso)' },
          { v: 'M10x1.5',  t: 'M10 × 1,5  (grosso)' },
          { v: 'M12x1.75', t: 'M12 × 1,75 (grosso)' },
          { v: 'M14x2',    t: 'M14 × 2,0  (grosso)' },
          { v: 'M16x2',    t: 'M16 × 2,0  (grosso)' },
          { v: 'M20x2.5',  t: 'M20 × 2,5  (grosso)' },
          { v: 'M24x3',    t: 'M24 × 3,0  (grosso)' },
          { v: 'M10x1.25', t: 'M10 × 1,25 (fino)' },
          { v: 'M12x1.25', t: 'M12 × 1,25 (fino)' },
          { v: 'M16x1.5',  t: 'M16 × 1,5  (fino)' },
          { v: 'M20x1.5',  t: 'M20 × 1,5  (fino)' }
        ] },
      { id: 'classe', tipo: 'select', label: 'Classe de resistência (ISO 898-1)', valor: '8.8',
        opcoes: [
          { v: '4.8',  t: '4.8   — Sp 310 MPa' },
          { v: '5.8',  t: '5.8   — Sp 380 MPa' },
          { v: '8.8',  t: '8.8   — Sp 600 MPa' },
          { v: '10.9', t: '10.9 — Sp 830 MPa' },
          { v: '12.9', t: '12.9 — Sp 970 MPa' }
        ] },
      { id: 'l', label: 'Comprimento de aperto (grip)', min: 8, max: 100, step: 1, valor: 30, unidade: 'mm' },
      { id: 'mat', tipo: 'select', label: 'Material dos membros', valor: 'aco',
        opcoes: [ { v: 'aco', t: 'Aço (E = 207 GPa)' }, { v: 'ff', t: 'Ferro fundido (100 GPa)' },
                  { v: 'alu', t: 'Alumínio (71 GPa)' } ] },
      { tipo: 'separador' },
      { id: 'np', label: 'Número de parafusos', min: 1, max: 16, step: 1, valor: 4, unidade: '' },
      { id: 'Pext', label: 'Carga externa total de tração', min: 0, max: 400, step: 2, valor: 40, unidade: 'kN' },
      { id: 'uso', tipo: 'seg', label: 'Tipo de conexão', valor: 'reut',
        opcoes: [ { v: 'reut', t: 'Reutilizável (0,75·Fp)' }, { v: 'perm', t: 'Permanente (0,90·Fp)' } ] },
      { id: 'K', tipo: 'select', label: 'Coeficiente de torque K', valor: '0.20',
        opcoes: [ { v: '0.15', t: '0,15 — lubrificado' }, { v: '0.20', t: '0,20 — aço seco (padrão)' },
                  { v: '0.30', t: '0,30 — galvanizado' } ] }
    ],
    graficos: [
      { id: 'junta', axes: false, height: 300, grid: false, legend: false },
      { id: 'forcas', titulo: 'Diagrama de forças da junta', xlabel: 'Carga externa por parafuso P (kN)',
        ylabel: 'Força (kN)', aspect: 0.55, legendPos: 'topleft' }
    ],
    saidas: [
      { id: 'At', label: 'Área resistente At' },
      { id: 'kbo', label: 'Rigidez do parafuso kb' },
      { id: 'kmo', label: 'Rigidez dos membros km' },
      { id: 'C',  label: 'Constante da junta C' },
      { id: 'Fp', label: 'Carga de prova Fp' },
      { id: 'Fi', label: 'Pré-carga Fi' },
      { id: 'T',  label: 'Torque de aperto T' },
      { id: 'npe', label: 'n escoamento' },
      { id: 'n0', label: 'n separação' },
      { id: 'nL', label: 'n de carga' },
      { id: 'nf', label: 'n fadiga (Goodman)' },
      { id: 'estado', label: 'Estado da junta' }
    ],
    nota: 'kb = Ad·At·E/(Ad·lt + At·ld) com ld/lt da Eq. 8-13; km pelos troncos de cone a 30° ' +
          '(Eq. 8-23, face de aperto 1,5·d). E do parafuso = 207 GPa. T = K·Fi·d. ' +
          'Fadiga: carga repetida 0→P, σa = C·P/(2At), σm = σa + Fi/At, Se = 129 MPa (rosca laminada, Shigley Tab. 8-17).',
      formulas: [
        { g: 'Rigidez da junta' },
        { tex: 'kb =\\frac{Ad\\cdot At\\cdot E}{Ad\\cdot lt + At\\cdot ld}', d: 'rigidez do parafuso (parte lisa + parte roscada)' },
        { tex: 'km =\\frac{0,5774\\cdot \\pi \\cdot E\\cdot d}{2\\cdot \\ln [5\\cdot (0,5774\\cdot l+0,5d)/(0,5774\\cdot l+2,5d)]}', d: 'rigidez dos membros, cone de pressão de 30° (Shigley)' },
        { tex: 'C =\\frac{kb}{kb + km}', d: 'constante de rigidez da junta; tipicamente 0,1 a 0,3', destaque: true },

        { g: 'Distribuição da carga externa P' },
        { tex: 'Fb = C\\cdot P + Fi', d: 'força no PARAFUSO — só a fração C de P chega nele', destaque: true },
        { tex: 'Fm = (1 - C)\\cdot P - Fi', d: 'força nos MEMBROS (negativa = ainda comprimidos)', destaque: true },
        { tex: 'P_{0} =\\frac{Fi}{1 - C}', d: 'carga externa que SEPARA a junta', destaque: true },
        { tex: 'n_{0} =\\frac{P_{0}}{P}', d: 'coeficiente de segurança contra separação' },

        { g: 'Pré-carga e aperto' },
        { tex: 'Fi = 0,75\\cdot At\\cdot Sp', d: 'junta reutilizável' },
        { tex: 'Fi = 0,90\\cdot At\\cdot Sp', d: 'junta permanente' },
        { tex: 'T = K\\cdot Fi\\cdot d', d: 'torque de aperto; K ≈ 0,20 sem lubrificação, 0,15 lubrificado' },
        { tex: '\\sigma i = \\frac{Fi}{At} \\le Sp', d: 'a pré-carga não pode exceder a resistência de prova' },

        { g: 'Verificações' },
        { tex: 'np = \\frac{Sp\\cdot At - Fi}{C\\cdot P}', d: 'coeficiente de segurança à carga estática' },
        { tex: '\\sigma a = C\\cdot \\frac{P}{2At} \\quad \\sigma m = C\\cdot \\frac{P}{2At} + \\frac{Fi}{At}', d: 'componentes para o critério de fadiga' },
        { tex: 'nf = (Sp\\cdot At - Fi)\\cdot ... (\\text{Goodman})', d: 'com σa e σm acima, aplica-se Goodman modificado' },
        { tex: '\\text{Classe} x.y \\to \\text{Sut} = 100x \\text{MPa}', d: 'e Sy = 10·x·y MPa (ISO 898-1)' }
      ],
      formulasTitulo: 'Fórmulas — junta parafusada pré-carregada',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    calcular: function (p, ctx) {
      var R = ROSCA[p.rosca], CL = CLASSE[p.classe];
      var d = R.d, At = R.At, l = p.l;
      var Eb = 207000, Em = EMEMBRO[p.mat];

      /* comprimento roscado dentro do grip (Shigley Eq. 8-13, L ≤ 125 mm) */
      var Ad = Math.PI * d * d / 4;
      var L = Math.ceil((l + 1.5 * d) / 5) * 5;
      var LT = (L <= 125) ? (2 * d + 6) : (2 * d + 12);
      var ld = Math.max(0, L - LT);
      var lt = l - ld;
      var kb;
      if (lt <= 0) { ld = l; lt = 0; kb = Ad * Eb / l; }
      else if (ld <= 0) { kb = At * Eb / l; }
      else { kb = Ad * At * Eb / (Ad * lt + At * ld); }

      /* membros: dois troncos de cone idênticos, face de aperto D = 1,5·d */
      var km = 0.5774 * Math.PI * Em * d /
               (2 * Math.log(5 * (0.5774 * l + 0.5 * d) / (0.5774 * l + 2.5 * d)));
      var C = kb / (kb + km);

      var Fp = At * CL.Sp;                       /* N */
      var Fi = (p.uso === 'perm' ? 0.90 : 0.75) * Fp;
      var K = parseFloat(p.K);
      var T = K * Fi * d / 1000;                 /* N·mm -> N·m */

      var P = p.Pext * 1000 / p.np;              /* N por parafuso */
      var Fb = Fi + C * P;
      var Fm = Fi - (1 - C) * P;                 /* > 0 enquanto houver compressão */
      var P0 = Fi / (1 - C);                     /* carga de separação */

      var npe = Fp / Fb;                         /* escoamento: Fb até Sp·At */
      var n0 = P > 0 ? Fi / (P * (1 - C)) : Infinity;
      var nL = P > 0 ? (Fp - Fi) / (C * P) : Infinity;

      /* fadiga da junta, carga repetida 0 -> P */
      var SeB = 129, SutB = CL.Sut;
      var sigA = C * P / (2 * At);
      var sigI = Fi / At;
      var sigM = sigA + sigI;
      var nf = sigA > 0 ? 1 / (sigA / SeB + sigM / SutB) : Infinity;

      /* ---------- diagrama de forças ---------- */
      var Pmax = Math.max(P0 * 1.35, P * 1.3, 1000);
      var xs = Plot.linspace(0, Pmax, 120);
      var fb = Plot.map(xs, function (x) { return (x < P0 ? Fi + C * x : x) / 1000; });
      var fm = Plot.map(xs, function (x) { return Math.max(0, Fi - (1 - C) * x) / 1000; });
      var xk = Plot.map(xs, function (x) { return x / 1000; });

      /* ================= desenho em corte da junta parafusada ================= */
      (function () {
        var jp = ctx.plot('junta').clear();
        /* unidades de desenho: milimetros reais do parafuso */
        var dN = d;                       /* diametro nominal, mm */
        var Lg = p.l;                     /* comprimento de aperto */
        var dCab = 1.5 * dN;              /* entre faces da cabeca sextavada */
        var hCab = 0.7 * dN;              /* altura da cabeca */
        var hPor = 0.8 * dN;              /* altura da porca */
        var folga = Lg * 0.30 + dN;
        var meiaL = Lg / 2;

        /* largura util do desenho: membros com 3.5 diametros para cada lado */
        var meiaW = Math.max(3.6 * dN, Lg * 0.95);
        jp.setLimits([-meiaW * 1.32, meiaW * 1.32],
                     [-(meiaL + hPor + folga * 0.6), meiaL + hCab + folga * 0.6]);

        jp.custom(function (c, pl) {
          var esc = Math.abs(pl.px(1) - pl.px(0));         /* px por mm em x */
          var escY = Math.abs(pl.py(0) - pl.py(1));
          var X = function (v) { return pl.px(v); };
          var Y = function (v) { return pl.py(v); };
          var cTxt = Plot.cssVar('--text', '#111');
          var cFaint = Plot.cssVar('--text-faint', '#999');

          /* ---------- cone de pressao nos membros (Shigley, 30 graus) ---------- */
          var rTopo = dCab / 2;
          var rBase = dCab / 2 + Lg / 2 * Math.tan(30 * Math.PI / 180);
          c.fillStyle = Plot.serie(2);
          c.globalAlpha = 0.14;
          [1, -1].forEach(function (sg) {
            [1, -1].forEach(function (lado) {
              c.beginPath();
              c.moveTo(X(lado * rTopo), Y(sg * meiaL));
              c.lineTo(X(lado * rBase), Y(0));
              c.lineTo(X(lado * dN / 2), Y(0));
              c.lineTo(X(lado * dN / 2), Y(sg * meiaL));
              c.closePath(); c.fill();
            });
          });
          c.globalAlpha = 1;

          /* ---------- membros (duas chapas) ---------- */
          c.fillStyle = Plot.cssVar('--text-muted', '#888');
          c.globalAlpha = 0.20;
          c.fillRect(X(-meiaW), Y(meiaL), X(meiaW) - X(-meiaW), Y(0) - Y(meiaL));
          c.fillRect(X(-meiaW), Y(0), X(meiaW) - X(-meiaW), Y(-meiaL) - Y(0));
          c.globalAlpha = 1;
          c.strokeStyle = Plot.cssVar('--text', '#111');
          c.lineWidth = 1.5;
          c.strokeRect(X(-meiaW), Y(meiaL), X(meiaW) - X(-meiaW), Y(0) - Y(meiaL));
          c.strokeRect(X(-meiaW), Y(0), X(meiaW) - X(-meiaW), Y(-meiaL) - Y(0));
          /* hachura leve nas chapas */
          c.strokeStyle = cFaint; c.lineWidth = 0.7;
          c.globalAlpha = 0.5;
          for (var hx = X(-meiaW); hx < X(meiaW); hx += 9) {
            c.beginPath(); c.moveTo(hx, Y(meiaL)); c.lineTo(hx + 12, Y(-meiaL)); c.stroke();
          }
          c.globalAlpha = 1;
          /* linha de junta */
          c.strokeStyle = Plot.cssVar('--text', '#111'); c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(X(-meiaW), Y(0)); c.lineTo(X(meiaW), Y(0)); c.stroke();

          /* ---------- furo ---------- */
          c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
          c.fillRect(X(-dN / 2 * 1.08), Y(meiaL), X(dN / 2 * 1.08) - X(-dN / 2 * 1.08), Y(-meiaL) - Y(meiaL));

          /* ---------- parafuso ---------- */
          var corP = Plot.serie(0);
          c.fillStyle = corP; c.globalAlpha = 0.30;
          /* haste */
          c.fillRect(X(-dN / 2), Y(meiaL), X(dN / 2) - X(-dN / 2), Y(-meiaL - hPor) - Y(meiaL));
          c.globalAlpha = 1;
          c.strokeStyle = corP; c.lineWidth = 1.6;
          c.strokeRect(X(-dN / 2), Y(meiaL), X(dN / 2) - X(-dN / 2), Y(-meiaL - hPor) - Y(meiaL));

          /* cabeca sextavada */
          c.fillStyle = corP; c.globalAlpha = 0.55;
          c.fillRect(X(-dCab / 2), Y(meiaL + hCab), X(dCab / 2) - X(-dCab / 2), Y(meiaL) - Y(meiaL + hCab));
          c.globalAlpha = 1;
          c.strokeRect(X(-dCab / 2), Y(meiaL + hCab), X(dCab / 2) - X(-dCab / 2), Y(meiaL) - Y(meiaL + hCab));
          /* chanfros da cabeca */
          c.beginPath();
          c.moveTo(X(-dCab / 2), Y(meiaL + hCab * 0.75));
          c.lineTo(X(dCab / 2), Y(meiaL + hCab * 0.75));
          c.stroke();

          /* porca */
          c.fillStyle = corP; c.globalAlpha = 0.55;
          c.fillRect(X(-dCab / 2), Y(-meiaL), X(dCab / 2) - X(-dCab / 2), Y(-meiaL - hPor) - Y(-meiaL));
          c.globalAlpha = 1;
          c.strokeRect(X(-dCab / 2), Y(-meiaL), X(dCab / 2) - X(-dCab / 2), Y(-meiaL - hPor) - Y(-meiaL));

          /* rosca: tracos ao longo do trecho roscado */
          c.strokeStyle = corP; c.lineWidth = 1;
          var yIniR = -meiaL - hPor, yFimR = -meiaL + Math.min(Lg * 0.55, lt > 0 ? lt : Lg * 0.55);
          var passoR = Math.max(2.4, R.p);
          for (var yr = yIniR; yr <= yFimR; yr += passoR) {
            c.beginPath();
            c.moveTo(X(-dN / 2), Y(yr));
            c.lineTo(X(dN / 2), Y(yr + passoR * 0.55));
            c.stroke();
          }

          /* ---------- cargas externas P/2 em cada membro ---------- */
          var Pk = P / 1000;
          c.strokeStyle = Plot.serie(3); c.fillStyle = Plot.serie(3); c.lineWidth = 2.2;
          [[meiaW * 0.72, 1], [-meiaW * 0.72, 1]].forEach(function (par) { void par; });
          function seta(xm, ySt, dir, rot) {
            var Xa = X(xm), Ya = Y(ySt);
            c.beginPath(); c.moveTo(Xa, Ya); c.lineTo(Xa, Ya - dir * 34); c.stroke();
            c.beginPath();
            c.moveTo(Xa, Ya - dir * 42);
            c.lineTo(Xa - 5, Ya - dir * 32);
            c.lineTo(Xa + 5, Ya - dir * 32);
            c.closePath(); c.fill();
            if (rot) {
              c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
              c.textAlign = 'center'; c.textBaseline = dir > 0 ? 'bottom' : 'top';
              c.fillText(rot, Xa, Ya - dir * 47);
            }
          }
          if (Pk > 0) {
            seta(meiaW * 0.68, meiaL, 1, 'P/2');
            seta(-meiaW * 0.68, meiaL, 1, 'P/2');
            seta(meiaW * 0.68, -meiaL, -1, null);
            seta(-meiaW * 0.68, -meiaL, -1, null);
          }

          /* ---------- rotulos ---------- */
          c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'middle';
          c.fillStyle = corP;
          c.fillText(p.rosca + '  classe ' + p.classe, X(dCab / 2) + 8, Y(meiaL + hCab / 2));
          c.fillStyle = Plot.serie(2);
          c.fillText('cone de pressão 30°', X(rBase) + 6, Y(meiaL * 0.45));
          c.fillStyle = cFaint;
          c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
          c.fillText('porca', X(dCab / 2) + 8, Y(-meiaL - hPor / 2));

          /* cota do grip */
          var Xc = X(-meiaW) - 0;
          c.strokeStyle = cFaint; c.fillStyle = cFaint; c.lineWidth = 1;
          var Xcota = X(-meiaW * 1.16);
          c.beginPath(); c.moveTo(Xcota, Y(meiaL)); c.lineTo(Xcota, Y(-meiaL)); c.stroke();
          [[Y(meiaL), 1], [Y(-meiaL), -1]].forEach(function (pr) {
            c.beginPath();
            c.moveTo(Xcota, pr[0]); c.lineTo(Xcota - 3.5, pr[0] + pr[1] * 7);
            c.lineTo(Xcota + 3.5, pr[0] + pr[1] * 7); c.closePath(); c.fill();
          });
          c.save();
          c.translate(Xcota - 7, (Y(meiaL) + Y(-meiaL)) / 2);
          c.rotate(-Math.PI / 2);
          c.textAlign = 'center'; c.textBaseline = 'bottom';
          c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.fillText('grip l = ' + p.l + ' mm', 0, 0);
          c.restore();
          void Xc; void esc; void escY; void cTxt;
        });
        jp.draw();
      })();

      var estadoJunta = P <= 0 ? 'Sem carga externa'
        : (P >= P0 ? 'JUNTA SEPARADA' : (Fb > Fp ? 'Parafuso escoando' : 'Junta unida — elástica'));
      var estadoCls = P >= P0 || Fb > Fp ? 'alerta' : P <= 0 ? '' : 'ok';

      var g = ctx.plot('forcas').clear()
        .line(xk, fb, { color: Plot.serie(0), width: 2.4, label: 'Força no parafuso Fb' })
        .line(xk, fm, { color: Plot.serie(1), width: 2.4, label: 'Compressão nos membros |Fm|' })
        .line(xk, xk, { color: Plot.serie(5), dash: [4, 4], label: 'Sem pré-carga (Fb = P)' })
        .hline(Fp / 1000, { color: Plot.serie(7), text: 'Fp = Sp·At (escoamento)' })
        .hline(Fi / 1000, { color: Plot.serie(4), text: 'Fi (pré-carga)' })
        .vline(P0 / 1000, { color: Plot.serie(7), text: 'separação da junta' })
        .marker(P / 1000, Fb / 1000, 'operação', { color: Plot.serie(2) });
      /* o topo tem que caber a MAIOR ordenada realmente desenhada:
         depois da separacao a curva do parafuso vira Fb = P e sobe ate Pmax */
      var yTopo = Math.max(Fp, Fb, Pmax, Fi + C * Pmax) / 1000 * 1.12;
      g.setLimits([0, Pmax / 1000], [0, yTopo]).draw();

      var ntp = Plot.numTex, sgp = Plot.sig;
      ctx.setPassos([
        { t: 'Rosca e classe escolhidas',
          c: p.rosca + '   classe ' + p.classe + '\\n' +
             'd  = ' + d + ' mm      passo = ' + R.p + ' mm\\n' +
             'At = ' + At + ' mm²   (área de tração, tabelada na ISO 898-1)\\n' +
             'Sp = ' + CL.Sp + ' MPa   Sy = ' + CL.Sy + ' MPa   Sut = ' + CL.Sut + ' MPa' },
        { t: 'Rigidez do parafuso e dos membros',
          tex: 'k_b = \\frac{A_d A_t E}{A_d l_t + A_t l_d} \\qquad k_m = \\frac{0{,}5774\\,\\pi E d}{2\\ln\\!\\left[5\\frac{0{,}5774 l + 0{,}5d}{0{,}5774 l + 2{,}5d}\\right]}',
          texSub: 'k_b = ' + ntp(kb / 1000, 4) + '\\ \\text{kN/mm} \\qquad k_m = ' +
                  ntp(km / 1000, 4) + '\\ \\text{kN/mm}',
          obs: 'Os membros são muito mais rígidos que o parafuso — é isso que faz a junta funcionar.' },
        { t: 'Constante de rigidez da junta',
          tex: 'C = \\frac{k_b}{k_b + k_m}',
          texSub: 'C = \\frac{' + ntp(kb / 1000, 4) + '}{' + ntp(kb / 1000, 4) + ' + ' +
                  ntp(km / 1000, 4) + '} = ' + ntp(C, 3),
          obs: 'Só a fração C da carga externa chega ao parafuso. Os ' +
               sgp((1 - C) * 100, 3) + ' % restantes apenas aliviam a compressão dos membros.' },
        { t: 'Pré-carga e torque de aperto',
          tex: 'F_i = ' + (p.uso === 'perm' ? '0{,}90' : '0{,}75') + '\\,A_t S_p \\qquad T = K F_i d',
          texSub: 'F_i = ' + (p.uso === 'perm' ? '0{,}90' : '0{,}75') + ' \\cdot ' + At +
                  ' \\cdot ' + CL.Sp + ' = ' + ntp(Fi / 1000, 4) + '\\ \\text{kN}' +
                  ' \\qquad T = ' + K + ' \\cdot ' + ntp(Fi / 1000, 4) + ' \\cdot ' + d +
                  ' = ' + ntp(T, 4) + '\\ \\text{N·m}',
          obs: 'Junta ' + (p.uso === 'perm' ? 'permanente' : 'reutilizável') + '.' },
        { t: 'Forças com a carga externa aplicada',
          tex: 'F_b = C P + F_i \\qquad F_m = F_i - (1-C) P',
          texSub: 'P = \\frac{' + p.Pext + '}{' + p.np + '} = ' + ntp(P / 1000, 4) +
                  '\\ \\text{kN/parafuso}' +
                  ' \\\\\\\\ F_b = ' + ntp(C, 3) + ' \\cdot ' + ntp(P / 1000, 4) + ' + ' +
                  ntp(Fi / 1000, 4) + ' = ' + ntp(Fb / 1000, 4) + '\\ \\text{kN}',
          obs: 'A força no parafuso subiu só ' + sgp(C * P / 1000, 3) +
               ' kN, apesar de a carga externa por parafuso ser ' + sgp(P / 1000, 3) + ' kN.' },
        { t: 'Carga que separa a junta',
          tex: 'P_0 = \\frac{F_i}{1 - C}',
          texSub: 'P_0 = \\frac{' + ntp(Fi / 1000, 4) + '}{1 - ' + ntp(C, 3) + '} = ' +
                  ntp(P0 / 1000, 4) + '\\ \\text{kN}',
          r: estadoJunta,
          obs: 'Acima de P₀ o parafuso passa a receber 100 % da carga externa e a fadiga dispara.' },
        { t: 'Coeficientes de segurança',
          texSub: 'n_{\\text{escoamento}} = ' + ntp(npe, 3) + ' \\quad n_{separação} = ' + ntp(n0, 3) +
                  ' \\quad n_{carga} = ' + ntp(nL, 3) + ' \\quad n_{fadiga} = ' + ntp(nf, 3),
          obs: 'O menor deles governa o projeto.' }
      ]);

      return {
        At:  { v: At, u: 'mm²' },
        kbo: { v: kb / 1000, u: 'kN/mm' },
        kmo: { v: km / 1000, u: 'kN/mm' },
        C:   { v: C, classe: 'destaque' },
        Fp:  { v: Fp / 1000, u: 'kN' },
        Fi:  { v: Fi / 1000, u: 'kN' },
        T:   { v: T, u: 'N·m', classe: 'destaque' },
        npe: { v: npe, classe: npe < 1 ? 'alerta' : 'ok' },
        n0:  { v: n0, classe: n0 < 1 ? 'alerta' : (n0 < 1.5 ? '' : 'ok') },
        nL:  { v: nL, classe: nL < 1 ? 'alerta' : '' },
        nf:  { v: nf, classe: nf < 1 ? 'alerta' : '' },
        estado: { v: estadoJunta, u: '', classe: estadoCls }
      };
    }
  });
})();


/* ------------------------------------------------------------
   4. SOLDA DE FILETE SOB CARGA EXCÊNTRICA
   ------------------------------------------------------------ */
(function () {
  'use strict';
  if (!document.getElementById('sim-solda')) return;

  /* Metal de adição — AWS A5.1 / Shigley Tab. 9-3 e 9-6 (MPa) */
  var ELETRODO = {
    E60:  { Sut: 427, Sy: 345 },
    E70:  { Sut: 482, Sy: 393 },
    E80:  { Sut: 551, Sy: 462 },
    E90:  { Sut: 620, Sy: 531 },
    E100: { Sut: 689, Sy: 600 }
  };

  /* devolve segmentos do cordão e propriedades unitárias, já no referencial do centroide */
  function padrao(tipo, b, d) {
    var segs, A1, Ju, cx, cy;
    if (tipo === 'par') {
      /* dois filetes verticais de comprimento d, afastados de b */
      A1 = 1.414 * d;                        /* por unidade de perna: A = 1,414·h·d */
      Ju = d * (3 * b * b + d * d) / 6;
      cx = 0; cy = 0;
      segs = [
        [-b / 2, -d / 2, -b / 2, d / 2],
        [ b / 2, -d / 2,  b / 2, d / 2]
      ];
    } else if (tipo === 'ret') {
      /* retângulo b × d soldado nos quatro lados */
      A1 = 1.414 * (b + d);
      Ju = Math.pow(b + d, 3) / 6;
      cx = 0; cy = 0;
      segs = [
        [-b / 2, -d / 2,  b / 2, -d / 2],
        [ b / 2, -d / 2,  b / 2,  d / 2],
        [ b / 2,  d / 2, -b / 2,  d / 2],
        [-b / 2,  d / 2, -b / 2, -d / 2]
      ];
    } else {
      /* L: um cordão horizontal b e um vertical d, unidos na origem local */
      A1 = 0.707 * (b + d);
      Ju = (Math.pow(b + d, 4) - 6 * b * b * d * d) / (12 * (b + d));
      cx = b * b / (2 * (b + d));
      cy = d * d / (2 * (b + d));
      segs = [
        [0 - cx, 0 - cy, b - cx, 0 - cy],
        [0 - cx, 0 - cy, 0 - cx, d - cy]
      ];
    }
    return { A1: A1, Ju: Ju, segs: segs, cx: cx, cy: cy };
  }

  Sim.build('#sim-solda', {
    titulo: 'Solda de filete sob carga excêntrica',
    descricao: 'Método do momento polar de inércia unitário: J = 0,707·h·Ju. ' +
               'A tensão primária é uniforme; a secundária cresce com a distância ao centroide — ' +
               'e é ela que decide onde a solda rompe.',
    controles: [
      { id: 'tipo', tipo: 'select', label: 'Padrão do cordão', valor: 'par',
        opcoes: [
          { v: 'par', t: 'Dois filetes paralelos (verticais)' },
          { v: 'ret', t: 'Retângulo (4 lados)' },
          { v: 'L',   t: 'Em L (1 horizontal + 1 vertical)' }
        ] },
      { id: 'h', label: 'Perna do filete h', min: 3, max: 16, step: 0.5, valor: 6, unidade: 'mm',
        desc: 'Garganta efetiva te = 0,707·h.' },
      { id: 'b', label: 'Dimensão horizontal b', min: 20, max: 250, step: 5, valor: 80, unidade: 'mm' },
      { id: 'd', label: 'Dimensão vertical d', min: 20, max: 250, step: 5, valor: 60, unidade: 'mm' },
      { tipo: 'separador' },
      { id: 'F', label: 'Carga vertical F', min: 1, max: 120, step: 1, valor: 20, unidade: 'kN' },
      { id: 'e', label: 'Excentricidade e', min: 0, max: 500, step: 5, valor: 100, unidade: 'mm',
        desc: 'Distância do ponto de aplicação ao centroide do grupo de solda.' },
      { id: 'el', tipo: 'select', label: 'Eletrodo (AWS A5.1)', valor: 'E70',
        opcoes: [
          { v: 'E60',  t: 'E60xx — Sut 427 MPa' },
          { v: 'E70',  t: 'E70xx — Sut 482 MPa' },
          { v: 'E80',  t: 'E80xx — Sut 551 MPa' },
          { v: 'E90',  t: 'E90xx — Sut 620 MPa' },
          { v: 'E100', t: 'E100xx — Sut 689 MPa' }
        ] }
    ],
    graficos: [
      { id: 'geo', titulo: 'Cordão, centroide e ponto crítico', xlabel: 'x (mm)', ylabel: 'y (mm)',
        aspect: 0.62, equalAspect: true, grid: false, legend: false },
      { id: 'curva', titulo: 'Tensão resultante × excentricidade', xlabel: 'Excentricidade e (mm)',
        ylabel: 'τ resultante (MPa)', aspect: 0.42, legendPos: 'topleft' }
    ],
    saidas: [
      { id: 'te', label: 'Garganta te' },
      { id: 'A',  label: 'Área da garganta' },
      { id: 'Ju', label: 'Ju unitário' },
      { id: 'J',  label: 'J = 0,707·h·Ju' },
      { id: 't1', label: "Primária τ′" },
      { id: 't2', label: "Secundária τ″" },
      { id: 'tr', label: 'Resultante τ' },
      { id: 'tadm', label: 'τ admissível' },
      { id: 'n',  label: 'Fator de segurança' }
    ],
    nota: 'Cisalhamento puro na garganta (hipótese clássica AWS): τ′ = V/A, τ″ = M·r/J, soma vetorial. ' +
          'τ admissível = 0,30·Sut do eletrodo (AWS D1.1 / Shigley Tab. 9-6). ' +
          'O metal-base também precisa ser verificado — aqui só o cordão é avaliado.',
      formulas: [
        { g: 'Geometria do filete' },
        { tex: 't_{g} = 0,707\\cdot h', d: 'garganta do filete de pernas iguais — o plano crítico, a 45°', destaque: true },
        { tex: 'A = t_{g} \\cdot L_{\\text{total}}', d: 'área resistente; L_total = soma dos comprimentos de cordão' },

        { g: 'Carga centrada' },
        { tex: '\\tau =\\frac{F}{0,707\\cdot h\\cdot L}', d: 'por convenção, SEMPRE cisalhamento na garganta', destaque: true },
        { tex: '\\tau_{\\text{adm}} \\approx 0,30\\cdot \\text{Sut,eletrodo}', d: 'AWS D1.1 para solda de filete' },

        { g: 'Carga excêntrica — cisalhamento primário e secundário' },
        { f: "τ′ = V / A", d: 'cisalhamento direto: uniforme em todo o cordão', destaque: true },
        { f: "τ″ = M·r / J", d: 'cisalhamento por torção: cresce com a distância ao centroide', destaque: true },
        { tex: 'M = V \\cdot e', d: 'e = excentricidade da carga em relação ao centroide do grupo' },
        { tex: 'J = 0,707\\cdot h\\cdot J_{u}', d: 'J_u = momento polar unitário do grupo de soldas' },
        { tex: 'J_{u} = I_{\\text{ux}} + I_{\\text{uy}}', d: 'somam-se as contribuições de cada cordão (com Steiner)' },
        { tex: '\\tau_{\\text{res}} = \\sqrt{\\tau \' x + \\tau \'\' x}^{2} + (\\tau \' y + \\tau \'\' y)^{2}', d: 'SOMA VETORIAL no ponto mais distante do centroide', destaque: true },
        { tex: 'n =\\frac{\\tau_{\\text{adm}}}{\\tau_{\\text{res}}}', d: 'coeficiente de segurança' },

        { g: 'Regras de norma (AWS D1.1)' },
        { tex: 'h_{\\text{mín}} = \\frac{\\frac{\\frac{3}{5}}{6}}{8} mm', d: 'chapa até 6 / 6 a 13 / 13 a 19 / acima de 19 mm' },
        { tex: 'h_{\\text{máx}} = t - 1,5 mm', d: 'para chapa com t ≥ 6 mm, na borda' },
        { tex: 'L_{\\text{mín}} = 4\\cdot h', d: 'comprimento mínimo efetivo do cordão' }
      ],
      formulasTitulo: 'Fórmulas — solda de filete',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
    calcular: function (p, ctx) {
      var b = p.b, d = p.d, h = p.h, F = p.F * 1000, e = p.e;
      var G = padrao(p.tipo, b, d);
      var te = 0.707 * h;
      var A = G.A1 * h;                 /* mm² : A1 já traz o 0,707 ou 1,414 */
      var J = 0.707 * h * G.Ju;         /* mm⁴ */
      var M = F * e;                    /* N·mm, sentido horário se e > 0 */

      /* amostra o cordão e procura o ponto de maior tensão resultante */
      function tensaoEm(x, y) {
        var tx = M * y / J;
        var ty = -M * x / J - F / A;
        return { tx: tx, ty: ty, t: Math.sqrt(tx * tx + ty * ty) };
      }
      var best = { t: -1, x: 0, y: 0 }, i, k, s, xx, yy, r;
      for (i = 0; i < G.segs.length; i++) {
        s = G.segs[i];
        for (k = 0; k <= 40; k++) {
          xx = s[0] + (s[2] - s[0]) * k / 40;
          yy = s[1] + (s[3] - s[1]) * k / 40;
          r = tensaoEm(xx, yy);
          if (r.t > best.t) { best = { t: r.t, x: xx, y: yy, tx: r.tx, ty: r.ty }; }
        }
      }
      var rmax = Math.sqrt(best.x * best.x + best.y * best.y);
      var t1 = F / A;
      var t2 = M * rmax / J;
      var tr = best.t;

      var EL = ELETRODO[p.el];
      var tadm = 0.30 * EL.Sut;
      var n = tadm / tr;

      /* ---------- desenho da junta soldada ---------- */
      var gx = [], gy = [];
      G.segs.forEach(function (sg) { gx.push(sg[0], sg[2], NaN); gy.push(sg[1], sg[3], NaN); });

      /* extensao do grupo de solda */
      var xw0 = Infinity, xw1 = -Infinity, yw0 = Infinity, yw1 = -Infinity;
      G.segs.forEach(function (sg) {
        xw0 = Math.min(xw0, sg[0], sg[2]); xw1 = Math.max(xw1, sg[0], sg[2]);
        yw0 = Math.min(yw0, sg[1], sg[3]); yw1 = Math.max(yw1, sg[1], sg[3]);
      });
      var alturaW = Math.max(yw1 - yw0, 1);

      /* limites com folga a direita para o rotulo da forca caber inteiro */
      var xIni = xw0 - Math.max(28, alturaW * 0.42);
      var xFim = Math.max(e, xw1) + Math.max(46, alturaW * 0.72);
      var geo = ctx.plot('geo').clear();
      geo.setLimits([xIni, xFim], [yw0 - alturaW * 0.45, yw1 + alturaW * 0.45]);

      geo.custom(function (c, pl) {
        var esp = Math.abs(pl.px(1) - pl.px(0));      /* pixels por mm */
        var Yc = pl.py(0);

        /* ---- coluna de apoio (hachurada) ---- */
        var Xp = pl.px(xw0);
        var larg = Math.max(12, 22 * esp / Math.max(esp, 0.25));
        var Ytopo = pl.py(yw1 + alturaW * 0.30), Ybase = pl.py(yw0 - alturaW * 0.30);
        c.fillStyle = Plot.cssVar('--text-muted', '#888');
        c.globalAlpha = 0.16;
        c.fillRect(Xp - larg, Ytopo, larg, Ybase - Ytopo);
        c.globalAlpha = 1;
        c.strokeStyle = Plot.cssVar('--text', '#111');
        c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(Xp, Ytopo); c.lineTo(Xp, Ybase); c.stroke();
        c.lineWidth = 1;
        c.strokeStyle = Plot.cssVar('--text-faint', '#999');
        for (var yh = Ytopo; yh <= Ybase; yh += 7) {
          c.beginPath(); c.moveTo(Xp - larg, yh + 6); c.lineTo(Xp, yh); c.stroke();
        }

        /* ---- chapa/consolo ate o ponto de aplicacao ---- */
        var Xe = pl.px(e);
        var yTop = pl.py(yw1), yBot = pl.py(yw0);
        var redu = 0.42;
        var yTopE = pl.py(yw1 * redu), yBotE = pl.py(yw0 * redu);
        c.fillStyle = Plot.serie(0);
        c.globalAlpha = 0.13;
        c.beginPath();
        c.moveTo(Xp, yTop); c.lineTo(Xe, yTopE); c.lineTo(Xe, yBotE); c.lineTo(Xp, yBot);
        c.closePath(); c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = Plot.cssVar('--text-muted', '#888');
        c.lineWidth = 1.3;
        c.stroke();

        /* ---- cordoes de solda, com o triangulo do filete ---- */
        c.lineCap = 'butt';
        G.segs.forEach(function (sg) {
          var X1 = pl.px(sg[0]), Y1 = pl.py(sg[1]), X2 = pl.px(sg[2]), Y2 = pl.py(sg[3]);
          c.strokeStyle = Plot.serie(0);
          c.lineWidth = Math.max(4, Math.min(11, p.h * esp * 0.9));
          c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke();
          /* dentes do filete ao longo do cordao */
          var dx = X2 - X1, dy = Y2 - Y1, comp = Math.hypot(dx, dy);
          var ux = dx / comp, uy = dy / comp, nx = -uy, ny = ux;
          var lado = Math.max(4, Math.min(9, p.h * esp * 0.75));
          var passo = Math.max(9, lado * 1.5);
          c.fillStyle = Plot.serie(0);
          c.globalAlpha = 0.55;
          for (var t = passo * 0.5; t < comp; t += passo) {
            var bx = X1 + ux * t, by = Y1 + uy * t;
            var sinal = (sg[0] + sg[2]) / 2 < 0 || (sg[1] + sg[3]) / 2 < 0 ? -1 : 1;
            c.beginPath();
            c.moveTo(bx - ux * lado * 0.5, by - uy * lado * 0.5);
            c.lineTo(bx + ux * lado * 0.5, by + uy * lado * 0.5);
            c.lineTo(bx + nx * lado * sinal, by + ny * lado * sinal);
            c.closePath(); c.fill();
          }
          c.globalAlpha = 1;
        });
        c.lineCap = 'round';

        /* ---- cota da excentricidade e ---- */
        var Ycota = pl.py(yw0 - alturaW * 0.34);
        c.strokeStyle = Plot.cssVar('--text-faint', '#999');
        c.fillStyle = Plot.cssVar('--text-faint', '#999');
        c.lineWidth = 1;
        c.setLineDash([]);
        c.beginPath(); c.moveTo(pl.px(0), Ycota); c.lineTo(Xe, Ycota); c.stroke();
        [pl.px(0), Xe].forEach(function (X, k) {
          var sg2 = k === 0 ? 1 : -1;
          c.beginPath();
          c.moveTo(X, Ycota); c.lineTo(X + sg2 * 7, Ycota - 3.5); c.lineTo(X + sg2 * 7, Ycota + 3.5);
          c.closePath(); c.fill();
        });
        c.beginPath(); c.moveTo(pl.px(0), pl.py(0)); c.lineTo(pl.px(0), Ycota + 5); c.stroke();
        c.beginPath(); c.moveTo(Xe, pl.py(0)); c.lineTo(Xe, Ycota + 5); c.stroke();
        c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText('e = ' + p.e + ' mm', (pl.px(0) + Xe) / 2, Ycota - 4);

        /* ---- seta da carga F ---- */
        var Y0 = Yc, Y1f = Yc - 52;
        c.strokeStyle = Plot.serie(3); c.fillStyle = Plot.serie(3); c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(Xe, Y1f); c.lineTo(Xe, Y0 - 4); c.stroke();
        c.beginPath(); c.moveTo(Xe, Y0); c.lineTo(Xe - 5.5, Y0 - 12); c.lineTo(Xe + 5.5, Y0 - 12);
        c.closePath(); c.fill();
        /* rotulo preso dentro da area de desenho */
        c.font = '600 11.5px ' + Plot.cssVar('--font', 'sans-serif');
        var txt = 'F = ' + p.F + ' kN';
        var meia = c.measureText(txt).width / 2;
        var lim = pl._area.x + pl._area.w - 4;
        var Xtxt = Math.min(Xe, lim - meia);
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText(txt, Xtxt, Y1f - 4);

        /* ---- raio r do centroide ao ponto critico ---- */
        var Xc = pl.px(best.x), Ycr = pl.py(best.y);
        c.strokeStyle = Plot.serie(5); c.lineWidth = 1.2; c.setLineDash([3, 3]);
        c.beginPath(); c.moveTo(pl.px(0), pl.py(0)); c.lineTo(Xc, Ycr); c.stroke();
        c.setLineDash([]);
        c.fillStyle = Plot.serie(5);
        c.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('r = ' + Plot.sig(Math.hypot(best.x, best.y), 3) + ' mm',
                   (pl.px(0) + Xc) / 2 + 16, (pl.py(0) + Ycr) / 2);

        /* ---- vetor da tensao resultante no ponto critico ---- */
        var esc = 38 / Math.max(tr, 1e-6);
        c.strokeStyle = n < 1 ? Plot.serie(7) : Plot.serie(2);
        c.fillStyle = c.strokeStyle;
        c.lineWidth = 2.2;
        var Vx = best.tx * esc, Vy = -best.ty * esc;
        c.beginPath(); c.moveTo(Xc, Ycr); c.lineTo(Xc + Vx, Ycr + Vy); c.stroke();
        var ang = Math.atan2(Vy, Vx);
        c.beginPath();
        c.moveTo(Xc + Vx, Ycr + Vy);
        c.lineTo(Xc + Vx - 8 * Math.cos(ang - 0.4), Ycr + Vy - 8 * Math.sin(ang - 0.4));
        c.lineTo(Xc + Vx - 8 * Math.cos(ang + 0.4), Ycr + Vy - 8 * Math.sin(ang + 0.4));
        c.closePath(); c.fill();
      });

      geo.marker(0, 0, 'centroide G', { color: Plot.serie(4), r: 4.5, dy: -9 });
      geo.marker(best.x, best.y, 'crítico  τ = ' + Plot.sig(tr, 4) + ' MPa',
        { color: n < 1 ? Plot.serie(7) : Plot.serie(2), r: 5.5,
          align: best.x > 0 ? 'right' : 'left', dx: best.x > 0 ? -10 : 10, dy: 20 });
      geo.draw();

      /* ---------- curva τ x e ---------- */
      var es = Plot.linspace(0, Math.max(e * 1.6, 200), 70);
      var ts = Plot.map(es, function (ee) {
        var Mi = F * ee, m = 0;
        G.segs.forEach(function (sg) {
          for (var q = 0; q <= 20; q++) {
            var X = sg[0] + (sg[2] - sg[0]) * q / 20, Y = sg[1] + (sg[3] - sg[1]) * q / 20;
            var ax = Mi * Y / J, ay = -Mi * X / J - F / A;
            var mag = Math.sqrt(ax * ax + ay * ay);
            if (mag > m) m = mag;
          }
        });
        return m;
      });
      ctx.plot('curva').clear()
        .line(es, ts, { color: Plot.serie(0), width: 2.4, label: 'τ resultante' })
        .hline(tadm, { color: Plot.serie(7), text: 'τ adm = ' + Plot.sig(tadm, 3) + ' MPa (' + p.el + 'xx)' })
        .marker(e, tr, 'ponto de projeto', { color: Plot.serie(2) })
        .draw();

      var nts = Plot.numTex, sgs = Plot.sig;
      ctx.setPassos([
        { t: 'Garganta e área resistente',
          tex: 't_g = 0{,}707\\,h \\qquad A = t_g \\cdot L_{\\text{total}}',
          texSub: 't_g = 0{,}707 \\cdot ' + p.h + ' = ' + nts(te, 4) + '\\ \\text{mm} \\qquad A = ' +
                  nts(A, 5) + '\\ \\text{mm}^2',
          obs: 'A garganta é o menor plano do cordão, a 45° das pernas — é onde a solda rompe.' },
        { t: 'Cisalhamento primário (carga direta)',
          tex: '\\tau\\prime  = \\frac{V}{A}',
          texSub: '\\tau\\prime  = \\frac{' + nts(F, 5) + '}{' + nts(A, 5) + '} = ' + nts(t1, 4) +
                  '\\ \\text{MPa}',
          obs: 'Uniforme em todo o cordão.' },
        { t: 'Momento da carga excêntrica',
          tex: 'M = V \\cdot e',
          texSub: 'M = ' + nts(F, 5) + ' \\cdot ' + p.e + ' = ' + nts(M, 5) + '\\ \\text{N·mm}',
          obs: 'A excentricidade é medida do ponto de aplicação até o centroide do grupo de soldas.' },
        { t: 'Momento polar do grupo',
          tex: 'J = 0{,}707\\,h \\cdot J_u',
          texSub: 'J_u = ' + nts(G.Ju, 5) + '\\ \\text{mm}^3 \\quad\\Rightarrow\\quad J = ' +
                  nts(J, 5) + '\\ \\text{mm}^4',
          obs: 'J_u é o momento polar unitário do padrão de cordão escolhido.' },
        { t: 'Cisalhamento secundário no ponto crítico',
          tex: '\\tau\\prime \\prime  = \\frac{M \\cdot r}{J}',
          texSub: 'r = ' + nts(rmax, 4) + '\\ \\text{mm} \\quad\\Rightarrow\\quad \\tau\\prime \\prime  = \\frac{' +
                  nts(M, 5) + ' \\cdot ' + nts(rmax, 4) + '}{' + nts(J, 5) + '} = ' +
                  nts(t2, 4) + '\\ \\text{MPa}',
          obs: 'Cresce com a distância ao centroide: o ponto crítico é sempre o mais afastado.' },
        { t: 'Resultante (soma VETORIAL)',
          tex: '\\tau_{\\text{res}} = \\sqrt{(\\tau\\prime _x + \\tau\\prime \\prime _x)^2 + (\\tau\\prime _y + \\tau\\prime \\prime _y)^2}',
          texSub: '\\tau_{\\text{res}} = ' + nts(tr, 4) + '\\ \\text{MPa}',
          obs: 'Não se somam os módulos: as duas parcelas têm direções diferentes.' },
        { t: 'Verificação',
          tex: 'n = \\frac{\\tau_{\\text{adm}}}{\\tau_{\\text{res}}} \\qquad \\tau_{\\text{adm}} \\approx 0{,}30\\,S_{\\text{ut},\\text{eletrodo}}',
          texSub: '\\tau_{\\text{adm}} = 0{,}30 \\cdot ' + EL.Sut + ' = ' + nts(tadm, 4) +
                  '\\ \\text{MPa} \\quad\\Rightarrow\\quad n = ' + nts(n, 3),
          r: n < 1 ? 'REPROVADO' : 'Aprovado',
          obs: 'Eletrodo ' + p.el + '. A AWS D1.1 também impõe perna mínima em função da espessura da chapa.' }
      ]);

      return {
        te:   { v: te, u: 'mm' },
        A:    { v: A, u: 'mm²' },
        Ju:   { v: G.Ju, u: 'mm³' },
        J:    { v: J, u: 'mm⁴' },
        t1:   { v: t1, u: 'MPa' },
        t2:   { v: t2, u: 'MPa' },
        tr:   { v: tr, u: 'MPa', classe: 'destaque' },
        tadm: { v: tadm, u: 'MPa' },
        n:    { v: n, classe: n < 1 ? 'alerta' : (n < 1.5 ? '' : 'ok') }
      };
    }
  });
})();

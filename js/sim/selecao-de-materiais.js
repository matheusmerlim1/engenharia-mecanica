/* ==========================================================================
   Seleção de Materiais — modelos interativos
   --------------------------------------------------------------------------
   Base usada (tudo verificável):
     · Método de Ashby: função → restrições → objetivo → variáveis livres
     · Índices de desempenho obtidos eliminando a variável livre
     · Dados de propriedade: valores típicos de cada classe, nas faixas
       publicadas em tabelas de seleção de materiais (ordem de grandeza e
       posição relativa é o que importa num mapa de propriedades)
     · Fatores de forma elásticos e de resistência à flexão
     · Trade-off por função penalidade Z = C + α·m, com α = valor de troca
   ========================================================================== */
(function (global) {
  'use strict';

  var SM = {};

  /* ---------------------------------------------------------------
     Biblioteca de materiais
     rho kg/m³ · E GPa · sy MPa (escoamento ou ruptura à flexão) ·
     KIC MPa·√m · custo USD/kg · Hm MJ/kg · CO2 kg/kg · Tmax °C
     --------------------------------------------------------------- */
  SM.familias = {
    metal: { nome: 'Metais', cor: 0 },
    polimero: { nome: 'Polímeros', cor: 1 },
    ceramico: { nome: 'Cerâmicos e vidros', cor: 2 },
    composito: { nome: 'Compósitos', cor: 3 },
    natural: { nome: 'Naturais', cor: 4 },
    espuma: { nome: 'Espumas', cor: 5 }
  };

  SM.mats = [
    { id: 'aco', nome: 'Aço baixo carbono', fam: 'metal', rho: 7850, E: 210, sy: 350, KIC: 90, custo: 0.9, Hm: 29, CO2: 2.0, Tmax: 500 },
    { id: 'acoliga', nome: 'Aço liga temperado', fam: 'metal', rho: 7850, E: 210, sy: 1000, KIC: 60, custo: 1.4, Hm: 34, CO2: 2.3, Tmax: 500 },
    { id: 'inox', nome: 'Aço inoxidável 304', fam: 'metal', rho: 7900, E: 200, sy: 300, KIC: 100, custo: 4.5, Hm: 81, CO2: 5.1, Tmax: 750 },
    { id: 'ffundido', nome: 'Ferro fundido cinzento', fam: 'metal', rho: 7150, E: 120, sy: 230, KIC: 25, custo: 0.7, Hm: 20, CO2: 1.6, Tmax: 500 },
    { id: 'al6061', nome: 'Alumínio 6061-T6', fam: 'metal', rho: 2700, E: 70, sy: 270, KIC: 26, custo: 2.3, Hm: 200, CO2: 12, Tmax: 180 },
    { id: 'al7075', nome: 'Alumínio 7075-T6', fam: 'metal', rho: 2800, E: 72, sy: 500, KIC: 24, custo: 3.2, Hm: 210, CO2: 13, Tmax: 150 },
    { id: 'mg', nome: 'Magnésio AZ91', fam: 'metal', rho: 1800, E: 45, sy: 170, KIC: 15, custo: 4.0, Hm: 320, CO2: 20, Tmax: 150 },
    { id: 'ti', nome: 'Titânio Ti-6Al-4V', fam: 'metal', rho: 4430, E: 115, sy: 900, KIC: 70, custo: 28, Hm: 650, CO2: 44, Tmax: 500 },
    { id: 'cu', nome: 'Cobre', fam: 'metal', rho: 8930, E: 120, sy: 250, KIC: 70, custo: 6.5, Hm: 70, CO2: 3.8, Tmax: 250 },
    { id: 'latao', nome: 'Latão', fam: 'metal', rho: 8500, E: 100, sy: 300, KIC: 40, custo: 5.5, Hm: 65, CO2: 3.5, Tmax: 200 },
    { id: 'niquel', nome: 'Superliga de níquel', fam: 'metal', rho: 8300, E: 210, sy: 800, KIC: 80, custo: 32, Hm: 230, CO2: 14, Tmax: 1000 },
    { id: 'zinco', nome: 'Liga de zinco', fam: 'metal', rho: 6700, E: 95, sy: 250, KIC: 20, custo: 2.6, Hm: 70, CO2: 4.0, Tmax: 100 },
    { id: 'chumbo', nome: 'Chumbo', fam: 'metal', rho: 11300, E: 14, sy: 12, KIC: 15, custo: 2.2, Hm: 28, CO2: 1.7, Tmax: 100 },

    { id: 'pp', nome: 'Polipropileno', fam: 'polimero', rho: 910, E: 1.5, sy: 32, KIC: 4.0, custo: 1.5, Hm: 85, CO2: 3.0, Tmax: 100 },
    { id: 'pead', nome: 'Polietileno de alta densidade', fam: 'polimero', rho: 950, E: 1.0, sy: 26, KIC: 3.5, custo: 1.3, Hm: 80, CO2: 2.8, Tmax: 90 },
    { id: 'pvc', nome: 'PVC rígido', fam: 'polimero', rho: 1400, E: 3.0, sy: 45, KIC: 3.0, custo: 1.6, Hm: 70, CO2: 3.1, Tmax: 70 },
    { id: 'ps', nome: 'Poliestireno', fam: 'polimero', rho: 1050, E: 3.2, sy: 45, KIC: 1.0, custo: 1.7, Hm: 95, CO2: 3.4, Tmax: 70 },
    { id: 'pa', nome: 'Poliamida (náilon 66)', fam: 'polimero', rho: 1140, E: 2.8, sy: 70, KIC: 4.0, custo: 3.5, Hm: 120, CO2: 5.5, Tmax: 110 },
    { id: 'pc', nome: 'Policarbonato', fam: 'polimero', rho: 1200, E: 2.4, sy: 65, KIC: 3.5, custo: 4.2, Hm: 110, CO2: 5.0, Tmax: 120 },
    { id: 'pmma', nome: 'Acrílico (PMMA)', fam: 'polimero', rho: 1190, E: 3.0, sy: 70, KIC: 1.5, custo: 3.0, Hm: 100, CO2: 4.5, Tmax: 90 },
    { id: 'abs', nome: 'ABS', fam: 'polimero', rho: 1050, E: 2.3, sy: 45, KIC: 3.5, custo: 2.6, Hm: 95, CO2: 3.8, Tmax: 90 },
    { id: 'epoxi', nome: 'Epóxi', fam: 'polimero', rho: 1250, E: 3.0, sy: 70, KIC: 0.7, custo: 6.0, Hm: 140, CO2: 6.0, Tmax: 140 },
    { id: 'ptfe', nome: 'PTFE', fam: 'polimero', rho: 2150, E: 0.5, sy: 25, KIC: 3.0, custo: 12, Hm: 180, CO2: 7.5, Tmax: 250 },
    { id: 'borracha', nome: 'Elastômero (borracha)', fam: 'polimero', rho: 1100, E: 0.01, sy: 10, KIC: 0.2, custo: 2.5, Hm: 100, CO2: 3.0, Tmax: 100 },

    { id: 'alumina', nome: 'Alumina', fam: 'ceramico', rho: 3900, E: 380, sy: 350, KIC: 4.0, custo: 20, Hm: 50, CO2: 3.0, Tmax: 1400 },
    { id: 'sic', nome: 'Carbeto de silício', fam: 'ceramico', rho: 3150, E: 410, sy: 450, KIC: 4.0, custo: 40, Hm: 70, CO2: 4.0, Tmax: 1500 },
    { id: 'si3n4', nome: 'Nitreto de silício', fam: 'ceramico', rho: 3200, E: 310, sy: 600, KIC: 5.0, custo: 60, Hm: 90, CO2: 5.0, Tmax: 1300 },
    { id: 'vidro', nome: 'Vidro soda-cal', fam: 'ceramico', rho: 2500, E: 70, sy: 50, KIC: 0.7, custo: 1.5, Hm: 15, CO2: 0.9, Tmax: 500 },
    { id: 'concreto', nome: 'Concreto', fam: 'ceramico', rho: 2400, E: 25, sy: 6, KIC: 0.5, custo: 0.1, Hm: 1.3, CO2: 0.13, Tmax: 400 },
    { id: 'tijolo', nome: 'Tijolo e pedra', fam: 'ceramico', rho: 2100, E: 20, sy: 10, KIC: 0.8, custo: 0.3, Hm: 3.0, CO2: 0.22, Tmax: 800 },

    { id: 'cfrp', nome: 'CFRP quasi-isotrópico', fam: 'composito', rho: 1550, E: 100, sy: 600, KIC: 35, custo: 50, Hm: 400, CO2: 25, Tmax: 180 },
    { id: 'gfrp', nome: 'GFRP', fam: 'composito', rho: 1850, E: 25, sy: 250, KIC: 20, custo: 8, Hm: 110, CO2: 6.0, Tmax: 150 },
    { id: 'smc', nome: 'SMC (fibra curta)', fam: 'composito', rho: 1900, E: 15, sy: 100, KIC: 10, custo: 4.0, Hm: 90, CO2: 5.0, Tmax: 150 },

    { id: 'madeira', nome: 'Madeira (paralela à fibra)', fam: 'natural', rho: 600, E: 12, sy: 40, KIC: 5.0, custo: 1.0, Hm: 8, CO2: 0.4, Tmax: 100 },
    { id: 'madeiraT', nome: 'Madeira (perpendicular)', fam: 'natural', rho: 600, E: 0.8, sy: 3, KIC: 0.5, custo: 1.0, Hm: 8, CO2: 0.4, Tmax: 100 },
    { id: 'bambu', nome: 'Bambu', fam: 'natural', rho: 700, E: 18, sy: 60, KIC: 5.0, custo: 1.0, Hm: 5, CO2: 0.3, Tmax: 100 },
    { id: 'compensado', nome: 'Compensado', fam: 'natural', rho: 700, E: 9, sy: 30, KIC: 2.0, custo: 1.2, Hm: 12, CO2: 0.6, Tmax: 100 },

    { id: 'espumaR', nome: 'Espuma rígida de polímero', fam: 'espuma', rho: 100, E: 0.08, sy: 1.5, KIC: 0.08, custo: 5, Hm: 100, CO2: 4.0, Tmax: 90 },
    { id: 'espumaF', nome: 'Espuma flexível', fam: 'espuma', rho: 70, E: 0.002, sy: 0.3, KIC: 0.05, custo: 4, Hm: 90, CO2: 3.5, Tmax: 80 },
    { id: 'cortica', nome: 'Cortiça', fam: 'espuma', rho: 200, E: 0.03, sy: 1.0, KIC: 0.1, custo: 6, Hm: 4, CO2: 0.3, Tmax: 100 }
  ];

  SM.porId = function (id) {
    for (var i = 0; i < SM.mats.length; i++) if (SM.mats[i].id === id) return SM.mats[i];
    return null;
  };

  /* ---------------------------------------------------------------
     Propriedades disponíveis como eixo de mapa
     --------------------------------------------------------------- */
  SM.props = {
    rho: { nome: 'Massa específica ρ', un: 'kg/m³', get: function (m) { return m.rho; } },
    E: { nome: 'Módulo de Young E', un: 'GPa', get: function (m) { return m.E; } },
    sy: { nome: 'Resistência σ', un: 'MPa', get: function (m) { return m.sy; } },
    KIC: { nome: 'Tenacidade K_IC', un: 'MPa·√m', get: function (m) { return m.KIC; } },
    custo: { nome: 'Custo', un: 'US$/kg', get: function (m) { return m.custo; } },
    custoVol: { nome: 'Custo por volume', un: 'US$/m³', get: function (m) { return m.custo * m.rho; } },
    Hm: { nome: 'Energia incorporada', un: 'MJ/kg', get: function (m) { return m.Hm; } },
    CO2: { nome: 'CO₂ incorporado', un: 'kg/kg', get: function (m) { return m.CO2; } },
    Tmax: { nome: 'Temperatura máxima de serviço', un: '°C', get: function (m) { return m.Tmax; } }
  };

  /* ---------------------------------------------------------------
     Índices de desempenho
     expo: expoente da propriedade principal · den: 'rho' ou 'custo·rho'
     --------------------------------------------------------------- */
  SM.indices = [
    { id: 'tiranteE', nome: 'Tirante leve e rígido', prop: 'E', expo: 1, tex: 'M = E/\\rho',
      desc: 'barra tracionada com rigidez axial dada', inc: 1 },
    { id: 'vigaE', nome: 'Viga leve e rígida', prop: 'E', expo: 0.5, tex: 'M = E^{1/2}/\\rho',
      desc: 'viga em flexão com rigidez dada e seção livre', inc: 1 },
    { id: 'painelE', nome: 'Painel leve e rígido', prop: 'E', expo: 1 / 3, tex: 'M = E^{1/3}/\\rho',
      desc: 'placa em flexão com rigidez dada e espessura livre', inc: 1 },
    { id: 'colunaE', nome: 'Coluna leve que não flamba', prop: 'E', expo: 0.5, tex: 'M = E^{1/2}/\\rho',
      desc: 'coluna com carga crítica de flambagem dada', inc: 1 },
    { id: 'tiranteS', nome: 'Tirante leve e resistente', prop: 'sy', expo: 1, tex: 'M = \\sigma_f/\\rho',
      desc: 'barra tracionada com carga dada', inc: 1 },
    { id: 'vigaS', nome: 'Viga leve e resistente', prop: 'sy', expo: 2 / 3, tex: 'M = \\sigma_f^{2/3}/\\rho',
      desc: 'viga em flexão com momento dado e seção livre', inc: 1 },
    { id: 'painelS', nome: 'Painel leve e resistente', prop: 'sy', expo: 0.5, tex: 'M = \\sigma_f^{1/2}/\\rho',
      desc: 'placa em flexão com carga dada e espessura livre', inc: 1 },
    { id: 'mola', nome: 'Mola que armazena energia por massa', prop: 'mola', expo: 1, tex: 'M = \\sigma_f^2/E\\rho',
      desc: 'energia elástica máxima por unidade de massa', inc: 1 },
    { id: 'vaso', nome: 'Vaso com vazamento antes da ruptura', prop: 'vaso', expo: 1, tex: 'M = K_{IC}^2/\\sigma_f',
      desc: 'a trinca atravessa a parede antes de se tornar instável', inc: 1 }
  ];

  SM.valorIndice = function (m, ind) {
    if (ind.prop === 'mola') return m.sy * m.sy / (m.E * 1000) / m.rho * 1000;
    if (ind.prop === 'vaso') return m.KIC * m.KIC / m.sy;
    var v = ind.prop === 'E' ? m.E : m.sy;   /* convenção de Ashby: E em GPa, σ em MPa, ρ em Mg/m³ */
    return Math.pow(v, ind.expo) / m.rho * 1000;
  };

  /* massa de uma peça com mesma função, relativa a um material de referência */
  SM.massaRelativa = function (m, ref, ind) {
    return SM.valorIndice(ref, ind) / SM.valorIndice(m, ind);
  };

  /* ---------------------------------------------------------------
     Fatores de forma (flexão)
     --------------------------------------------------------------- */
  SM.formas = [
    { id: 'quadrada', nome: 'Seção quadrada maciça', fe: 1.0, ff: 1.0 },
    { id: 'retangular', nome: 'Retângulo 1:3 (de pé)', fe: 3.0, ff: 1.7 },
    { id: 'tubo', nome: 'Tubo circular (d/t = 10)', fe: 6.5, ff: 3.1 },
    { id: 'tubofino', nome: 'Tubo circular (d/t = 25)', fe: 16, ff: 5.5 },
    { id: 'caixa', nome: 'Seção caixa (h/t = 20)', fe: 14, ff: 5.0 },
    { id: 'I', nome: 'Perfil I laminado', fe: 10, ff: 4.3 }
  ];
  /* limites práticos de fator de forma por família (microflambagem local) */
  SM.formaMax = { metal: 65, composito: 40, polimero: 25, natural: 8, ceramico: 2, espuma: 2 };

  var Plot = global.Plot;
  function sg(v, n) { return global.Plot ? global.Plot.sig(v, n || 3) : v; }
  function nt(v, n) { return sg(v, n).toString().replace('.', ','); }
  function corFam(f) { return Plot.serie(SM.familias[f].cor); }
  function log10(v) { return Math.log(Math.max(v, 1e-9)) / Math.LN10; }

  global.SM = SM;

  /* =========================================================================
     1 · Mapa de propriedades (Ashby)
     ========================================================================= */
  function montarMapa() {
    if (!document.getElementById('sim-mapa')) return;
    Sim.build('#sim-mapa', {
      titulo: '1. Mapa de propriedades — o gráfico de Ashby',
      descricao: 'Cada material é um ponto; cada família ocupa uma região. A linha-guia tem a inclinação do índice escolhido: tudo que fica acima dela é melhor que a referência, e deslizá-la até restarem poucos candidatos é a própria seleção.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · O mapa clássico E × ρ', desc: 'Módulo contra massa específica, com a guia da viga',
          valores: { eixoX: 'rho', eixoY: 'E', indice: 'vigaE', nivel: 2.2, mostrarGuia: true, rotulos: true } },
        { nome: '2 · Viga leve e rígida', desc: 'Guia de inclinação 2 no mapa E × ρ',
          valores: { eixoX: 'rho', eixoY: 'E', indice: 'vigaE', nivel: 3.0, mostrarGuia: true, rotulos: true } },
        { nome: '3 · Tirante leve e resistente', desc: 'Mapa σ × ρ com guia de inclinação 1',
          valores: { eixoX: 'rho', eixoY: 'sy', indice: 'tiranteS', nivel: 100, mostrarGuia: true, rotulos: true } },
        { nome: '4 · Mola de alta energia', desc: 'σ × E: a guia vai com σ²/E',
          valores: { eixoX: 'E', eixoY: 'sy', indice: 'mola', nivel: 1.0, mostrarGuia: true, rotulos: true } },
        { nome: '5 · Vaso que vaza antes de romper', desc: 'K_IC × σ com a guia de inclinação 1/2',
          valores: { eixoX: 'sy', eixoY: 'KIC', indice: 'vaso', nivel: 20, mostrarGuia: true, rotulos: true } },
        { nome: '6 · Barato e rígido', desc: 'Troca a massa pelo custo no eixo horizontal',
          valores: { eixoX: 'custoVol', eixoY: 'E', indice: 'vigaE', nivel: 2.2, mostrarGuia: false, rotulos: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Eixos do mapa' },
        { id: 'eixoY', tipo: 'select', label: 'Eixo vertical', valor: 'E',
          opcoes: [{ v: 'E', t: 'Módulo E' }, { v: 'sy', t: 'Resistência σ' }, { v: 'KIC', t: 'Tenacidade K_IC' },
                   { v: 'Tmax', t: 'Temperatura máxima' }, { v: 'Hm', t: 'Energia incorporada' }] },
        { id: 'eixoX', tipo: 'select', label: 'Eixo horizontal', valor: 'rho',
          opcoes: [{ v: 'rho', t: 'Massa específica ρ' }, { v: 'custo', t: 'Custo por kg' },
                   { v: 'custoVol', t: 'Custo por m³' }, { v: 'E', t: 'Módulo E' }, { v: 'sy', t: 'Resistência σ' }] },
        { tipo: 'titulo', label: 'Linha-guia' },
        { id: 'indice', tipo: 'select', label: 'Índice de desempenho', valor: 'vigaE',
          opcoes: SM.indices.map(function (i) { return { v: i.id, t: i.nome }; }) },
        { id: 'nivel', label: 'Posição da guia (valor do índice)', min: 0.05, max: 400, step: 0.05, valor: 2.2,
          desc: 'Arraste para subir a exigência e encurtar a lista' },
        { tipo: 'separador' },
        { id: 'mostrarGuia', tipo: 'check', label: 'Mostrar a linha-guia', valor: true },
        { id: 'rotulos', tipo: 'check', label: 'Nomear os materiais', valor: true }
      ],
      graficos: [
        { id: 'mapa', titulo: 'Mapa de propriedades', xlog: true, ylog: true, aspect: 0.62, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'n', label: 'Materiais no mapa' },
        { id: 'aprov', label: 'Acima da guia' },
        { id: 'melhor', label: 'Melhor índice' },
        { id: 'valor', label: 'Valor do melhor' }
      ],
      formulas: [
        { g: 'Como a guia é construída' },
        { tex: 'M = \\frac{E^{1/2}}{\\rho} \\;\\Rightarrow\\; \\log E = 2\\log\\rho + 2\\log M', d: 'num mapa log-log a guia é uma reta de inclinação 2', destaque: true },
        { tex: 'M = \\frac{E^{1/3}}{\\rho} \\;\\Rightarrow\\; \\text{inclinação } 3' },
        { tex: 'M = \\frac{E}{\\rho} \\;\\Rightarrow\\; \\text{inclinação } 1' },
        { g: 'Leitura' },
        { tex: '\\text{acima da guia} \\;\\Leftrightarrow\\; M_{material} > M_{guia}', d: 'subir a guia encurta a lista de candidatos' }
      ],
      nota: 'Os valores são típicos de cada classe: num mapa de propriedades o que importa é a posição relativa e a ordem de grandeza. Para projeto, use a folha de dados do fornecedor.',
      calcular: function (p, ctx) {
        var px = SM.props[p.eixoX], py = SM.props[p.eixoY];
        var ind = null, i;
        for (i = 0; i < SM.indices.length; i++) if (SM.indices[i].id === p.indice) ind = SM.indices[i];
        var g = ctx.plot('mapa').clear();
        g.o.xlabel = px.nome + ' (' + px.un + ')';
        g.o.ylabel = py.nome + ' (' + py.un + ')';

        var xs = SM.mats.map(function (m) { return log10(px.get(m)); });
        var ys = SM.mats.map(function (m) { return log10(py.get(m)); });
        var xmin = Math.min.apply(null, xs) - 0.35, xmax = Math.max.apply(null, xs) + 0.35;
        var ymin = Math.min.apply(null, ys) - 0.4, ymax = Math.max.apply(null, ys) + 0.4;

        var aprovados = [];
        Object.keys(SM.familias).forEach(function (fam) {
          var lista = SM.mats.filter(function (m) { return m.fam === fam; });
          g.points(lista.map(function (m) { return log10(px.get(m)); }),
                   lista.map(function (m) { return log10(py.get(m)); }),
                   { color: corFam(fam), r: 5, label: SM.familias[fam].nome });
        });
        if (p.rotulos) {
          SM.mats.forEach(function (m) {
            var nome = m.nome.length > 17 ? m.nome.slice(0, 16) + '…' : m.nome;
            g.text(log10(px.get(m)), log10(py.get(m)), nome,
              { color: corFam(m.fam), size: 9.5, dy: -8, align: 'center' });
          });
        }
        /* linha-guia: só faz sentido nos mapas em que o índice é definido */
        var incl = null;
        if (p.eixoX === 'rho' && p.eixoY === 'E') incl = ind.prop === 'E' ? 1 / ind.expo : null;
        if (p.eixoX === 'rho' && p.eixoY === 'sy') incl = ind.prop === 'sy' ? 1 / ind.expo : null;
        if (p.eixoX === 'E' && p.eixoY === 'sy' && ind.id === 'mola') incl = 0.5;
        if (p.eixoX === 'sy' && p.eixoY === 'KIC' && ind.id === 'vaso') incl = 0.5;

        if (p.mostrarGuia && incl) {
          var xg = [xmin, xmax], yg;
          if (ind.id === 'mola') yg = xg.map(function (x) { return 0.5 * (x + log10(p.nivel * 1000)) + 0.5 * 3; });
          else if (ind.id === 'vaso') yg = xg.map(function (x) { return 0.5 * x + log10(Math.sqrt(p.nivel)); });
          else yg = xg.map(function (x) { return incl * x + log10(p.nivel) * incl - incl * 3 + 0; });
          /* para E/rho e derivados: log(prop) = incl*(log rho + log M) com prop em MPa */
          if (ind.prop === 'E' || ind.prop === 'sy') {
            yg = xg.map(function (x) {
              /* M = prop^e/(ρ/1000) ⇒ log prop = (1/e)·(log M + log ρ − 3) */
              return incl * (x + log10(p.nivel) - 3);
            });
          }
          g.line(xg, yg, { color: Plot.cssVar('--text', '#111'), width: 2.2, dash: [7, 5], label: 'guia · ' + ind.nome });
          SM.mats.forEach(function (m) { if (SM.valorIndice(m, ind) >= p.nivel) aprovados.push(m); });
        } else {
          SM.mats.forEach(function (m) { if (SM.valorIndice(m, ind) >= p.nivel) aprovados.push(m); });
        }
        g.setLimits([xmin, xmax], [ymin, ymax]);
        g.draw();

        var ordenados = SM.mats.slice().sort(function (a, b) { return SM.valorIndice(b, ind) - SM.valorIndice(a, ind); });
        var top = ordenados.slice(0, 6);
        ctx.setPassos([
          { t: '① A função vira um índice',
            tex: ind.tex,
            obs: ind.desc.charAt(0).toUpperCase() + ind.desc.slice(1) + '. O índice reúne as propriedades que o desempenho exige; '
              + 'maximizá-lo é maximizar o desempenho, qualquer que seja o tamanho da peça.' },
          { t: '② No mapa log-log, o índice é uma reta',
            tex: '\\log\\,\\text{prop} = ' + (incl ? nt(incl, 2) : 'n') + '\\,\\log\\rho + \\text{const}',
            obs: 'Tomando o logaritmo dos dois lados de M = prop^{1/n}/ρ, a condição M = constante vira uma reta de '
              + 'inclinação n. Mover a reta para cima aumenta a exigência sem mudar a inclinação.' },
          { t: '③ A lista curta',
            obs: 'Com o nível em ' + nt(p.nivel, 3) + ', ' + aprovados.length + ' de ' + SM.mats.length
              + ' materiais ficam acima da guia. Os primeiros colocados são: '
              + top.map(function (m) { return m.nome + ' (' + nt(SM.valorIndice(m, ind), 3) + ')'; }).join(', ') + '.' },
          { t: '④ O que o mapa não decide',
            obs: 'O índice ordena por desempenho, não por viabilidade. Custo, processo, temperatura de serviço, '
              + 'corrosão e disponibilidade entram depois, como restrições que cortam a lista curta — e é comum '
              + 'o primeiro colocado ser eliminado por uma delas.' }
        ]);
        return {
          n: { v: SM.mats.length, u: 'materiais' },
          aprov: { v: aprovados.length, u: 'acima da guia', classe: aprovados.length ? 'ok' : 'alerta' },
          melhor: { v: top[0].nome },
          valor: { v: sg(SM.valorIndice(top[0], ind), 3) }
        };
      }
    });
  }

  /* =========================================================================
     2 · Índice de desempenho e massa da peça
     ========================================================================= */
  function montarIndice() {
    if (!document.getElementById('sim-indice')) return;
    Sim.build('#sim-indice', {
      titulo: '2. Índice de desempenho — da função à massa da peça',
      descricao: 'Escolha a função e o objetivo: o simulador monta o índice, ordena os materiais e calcula a massa (e o custo) de uma peça real que cumpra exatamente a mesma especificação. É a diferença entre dizer que um material é melhor e dizer quanto ele economiza.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Viga leve e rígida', desc: 'O caso clássico: seção livre, rigidez dada',
          valores: { indice: 'vigaE', ref: 'aco', L: 1, carga: 1000, defl: 2, objetivo: 'massa' } },
        { nome: '2 · Tirante: só E/ρ importa', desc: 'Sem liberdade de seção, o índice muda',
          valores: { indice: 'tiranteE', ref: 'aco', L: 1, carga: 1000, defl: 2, objetivo: 'massa' } },
        { nome: '3 · Painel de piso', desc: 'Placa em flexão: expoente 1/3',
          valores: { indice: 'painelE', ref: 'aco', L: 1, carga: 1000, defl: 2, objetivo: 'massa' } },
        { nome: '4 · Agora o objetivo é custo', desc: 'A ordem muda completamente',
          valores: { indice: 'vigaE', ref: 'aco', L: 1, carga: 1000, defl: 2, objetivo: 'custo' } },
        { nome: '5 · Viga resistente, não rígida', desc: 'Troca a restrição de rigidez por resistência',
          valores: { indice: 'vigaS', ref: 'aco', L: 1, carga: 1000, defl: 2, objetivo: 'massa' } },
        { nome: '6 · Mola de energia máxima', desc: 'σ²/Eρ: aço de mola contra compósito',
          valores: { indice: 'mola', ref: 'acoliga', L: 1, carga: 1000, defl: 2, objetivo: 'massa' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'O problema' },
        { id: 'indice', tipo: 'select', label: 'Função e restrição', valor: 'vigaE',
          opcoes: SM.indices.map(function (i) { return { v: i.id, t: i.nome }; }) },
        { id: 'objetivo', tipo: 'select', label: 'Objetivo', valor: 'massa',
          opcoes: [{ v: 'massa', t: 'Minimizar massa' }, { v: 'custo', t: 'Minimizar custo do material' }] },
        { id: 'ref', tipo: 'select', label: 'Material de referência', valor: 'aco',
          opcoes: SM.mats.filter(function (m) { return m.fam === 'metal' || m.fam === 'composito' || m.fam === 'natural'; })
            .map(function (m) { return { v: m.id, t: m.nome }; }) },
        { tipo: 'titulo', label: 'A peça (viga biapoiada de seção quadrada)' },
        { id: 'L', label: 'Vão', min: 0.3, max: 4, step: 0.05, valor: 1, unidade: 'm' },
        { id: 'carga', label: 'Carga no meio do vão', min: 100, max: 20000, step: 50, valor: 1000, unidade: 'N' },
        { id: 'defl', label: 'Flecha máxima admitida', min: 0.5, max: 20, step: 0.1, valor: 2, unidade: 'mm' }
      ],
      graficos: [
        { id: 'rank', titulo: 'Índice de desempenho', ylabel: '', aspect: 0.42, legend: false },
        { id: 'massa', titulo: 'Massa da peça equivalente', ylabel: 'kg', aspect: 0.36, legend: false }
      ],
      saidas: [
        { id: 'tex', label: 'Índice' },
        { id: 'melhor', label: 'Primeiro colocado' },
        { id: 'massaRef', label: 'Massa com a referência' },
        { id: 'massaMelhor', label: 'Massa com o primeiro' },
        { id: 'ganho', label: 'Economia de massa' },
        { id: 'custoMelhor', label: 'Custo do material' }
      ],
      formulas: [
        { g: 'A receita' },
        { tex: 'm = A\\,L\\,\\rho', d: '① escreva o objetivo', destaque: true },
        { tex: 'S = \\frac{48EI}{L^3} = \\frac{48E}{L^3}\\frac{A^2}{12} \\;\\Rightarrow\\; A = L\\sqrt{\\frac{S\\,L}{4E}}',
          d: '② escreva a restrição e isole a variável livre' },
        { tex: 'm = \\sqrt{\\frac{S}{4}}\\,L^{5/2}\\,\\frac{\\rho}{E^{1/2}}', d: '③ substitua: separa em geometria × material', destaque: true },
        { tex: 'M = \\frac{E^{1/2}}{\\rho} \\quad\\text{(maximizar)}', d: '④ o índice é o que sobra do material' },
        { g: 'Com o objetivo em custo' },
        { tex: 'M_C = \\frac{E^{1/2}}{C_m\\,\\rho}', d: 'basta trocar ρ por C_m·ρ no denominador' }
      ],
      nota: 'A peça usada na conta é uma viga biapoiada de seção quadrada com carga no meio do vão; a área é a variável livre. Mudar a geometria muda os números, mas não a ordem dos materiais — que é o que o índice garante.',
      calcular: function (p, ctx) {
        var ind = null, i;
        for (i = 0; i < SM.indices.length; i++) if (SM.indices[i].id === p.indice) ind = SM.indices[i];
        var custo = p.objetivo === 'custo';
        function valor(m) {
          var v = SM.valorIndice(m, ind);
          return custo ? v / m.custo : v;
        }
        var ref = SM.porId(p.ref);
        var ordenados = SM.mats.slice().sort(function (a, b) { return valor(b) - valor(a); });
        var top = ordenados.slice(0, 8);

        /* massa real de uma viga biapoiada de seção quadrada */
        var S = p.carga / (p.defl / 1000);                 /* rigidez exigida, N/m */
        function massaViga(m) {
          var E = m.E * 1e9;
          var A = p.L * Math.sqrt(S * p.L / (4 * E));      /* de S = 4EA²/L³ (I = A²/12) */
          return A * p.L * m.rho;
        }
        var mRef = massaViga(ref);

        var g = ctx.plot('rank').clear();
        g.o.xcat = top.map(function (m, k) { return { v: k, label: m.nome.split(' ')[0] }; });
        top.forEach(function (m, k) {
          g.bars([k], [valor(m)], { color: corFam(m.fam), barw: 0.7 });
          g.text(k, valor(m), sg(valor(m), 3), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        g.setLimits([-0.6, top.length - 0.4], [0, Math.max.apply(null, top.map(valor)) * 1.25]);
        g.draw();

        var gm = ctx.plot('massa').clear();
        gm.o.xcat = top.map(function (m, k) { return { v: k, label: m.nome.split(' ')[0] }; });
        top.forEach(function (m, k) {
          gm.bars([k], [massaViga(m)], { color: corFam(m.fam), barw: 0.7 });
          gm.text(k, massaViga(m), sg(massaViga(m), 3), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        gm.hline(mRef, { color: Plot.serie(6), width: 1.6, text: 'referência: ' + ref.nome });
        gm.setLimits([-0.6, top.length - 0.4], [0, Math.max(mRef, Math.max.apply(null, top.map(massaViga))) * 1.25]);
        gm.draw();

        var best = top[0], mBest = massaViga(best);
        ctx.setPassos([
          { t: '① Objetivo e restrição',
            tex: 'm = A L \\rho \\qquad S = \\frac{48EI}{L^3}',
            obs: 'A massa é o que se quer minimizar; a rigidez é o que não se pode perder. A área da seção é a '
              + 'variável livre: ela pode mudar de material para material, desde que a rigidez continue a mesma.' },
          { t: '② Eliminar a variável livre',
            tex: 'A = L\\sqrt{\\frac{S L}{4E}} \\;\\Rightarrow\\; m = \\sqrt{\\frac{S}{4}}\\;L^{5/2}\\;\\frac{\\rho}{E^{1/2}}',
            texSub: 'S = \\frac{F}{\\delta} = \\frac{' + nt(p.carga) + '}{' + nt(p.defl / 1000, 3) + '} = ' + nt(S, 4) + '\\ \\text{N/m}',
            obs: 'Depois da substituição a massa se separa em três fatores: um de carregamento, um de geometria e '
              + 'um só de material. Esse último, invertido, é o índice.' },
          { t: '③ Ordenar pelo índice',
            tex: ind.tex + (custo ? ' \\;\\to\\; M_C = \\frac{\\text{prop}^{e}}{C_m\\rho}' : ''),
            obs: 'Primeiro colocado: ' + best.nome + ', com M = ' + nt(valor(best), 3) + '. '
              + 'A referência (' + ref.nome + ') tem M = ' + nt(valor(ref), 3) + '.' },
          { t: '④ Traduzir em quilos',
            texSub: 'm_{' + best.nome.split(' ')[0] + '} = ' + nt(mBest, 3) + '\\ \\text{kg} \\qquad m_{ref} = ' + nt(mRef, 3) + '\\ \\text{kg}',
            obs: 'A viga de ' + best.nome + ' pesa ' + nt(100 * (1 - mBest / mRef), 3) + ' % menos que a de '
              + ref.nome + ' cumprindo exatamente a mesma especificação. O custo do material, porém, passa de US$ '
              + nt(mRef * ref.custo, 3) + ' para US$ ' + nt(mBest * best.custo, 3) + ' — é esse o conflito do capítulo seguinte.' }
        ]);
        return {
          tex: { v: ind.nome },
          melhor: { v: best.nome, classe: 'ok' },
          massaRef: { v: sg(mRef, 3), u: 'kg' },
          massaMelhor: { v: sg(mBest, 3), u: 'kg' },
          ganho: { v: sg(100 * (1 - mBest / mRef), 3), u: '%', classe: mBest < mRef ? 'ok' : 'alerta' },
          custoMelhor: { v: 'US$ ' + sg(mBest * best.custo, 3) }
        };
      }
    });
  }

  /* =========================================================================
     3 · Múltiplas restrições: qual está ativa
     ========================================================================= */
  function montarRestricoes() {
    if (!document.getElementById('sim-restricoes')) return;
    Sim.build('#sim-restricoes', {
      titulo: '3. Múltiplas restrições — descobrir qual delas manda',
      descricao: 'Uma viga precisa ser rígida o bastante e resistente o bastante. Cada restrição exige uma área mínima; vence a maior delas. O material muda qual restrição está ativa — e é por isso que não existe um índice único quando há mais de uma exigência.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Rigidez manda', desc: 'Flecha apertada, carga modesta',
          valores: { L: 1, carga: 800, defl: 1.5, fs: 2 } },
        { nome: '2 · Resistência manda', desc: 'Carga alta, flecha folgada',
          valores: { L: 1, carga: 6000, defl: 8, fs: 2 } },
        { nome: '3 · Vão longo', desc: 'Dobrar o vão muda a restrição ativa',
          valores: { L: 2.5, carga: 2000, defl: 5, fs: 2 } },
        { nome: '4 · Fator de segurança alto', desc: 'A resistência passa a mandar',
          valores: { L: 1, carga: 2000, defl: 4, fs: 4 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A viga' },
        { id: 'L', label: 'Vão', min: 0.3, max: 4, step: 0.05, valor: 1, unidade: 'm' },
        { id: 'carga', label: 'Carga no meio do vão', min: 100, max: 20000, step: 50, valor: 2000, unidade: 'N' },
        { id: 'defl', label: 'Flecha máxima admitida', min: 0.5, max: 20, step: 0.1, valor: 4, unidade: 'mm' },
        { id: 'fs', label: 'Fator de segurança sobre o escoamento', min: 1, max: 6, step: 0.1, valor: 2 }
      ],
      graficos: [
        { id: 'massas', titulo: 'Massa exigida por cada restrição', ylabel: 'kg', aspect: 0.44, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'vencedor', label: 'Material mais leve' },
        { id: 'massa', label: 'Massa' },
        { id: 'ativa', label: 'Restrição ativa' },
        { id: 'quantos', label: 'Materiais em que a rigidez manda' }
      ],
      formulas: [
        { g: 'As duas restrições' },
        { tex: 'A_{rigidez} = L\\sqrt{\\frac{S\\,L}{4E}}', d: 'de S = 48EI/L³ com I = A²/12', destaque: true },
        { tex: 'A_{resistência} = \\left(\\frac{3FLn}{2\\sigma_f}\\right)^{2/3}', d: 'de σ = Mc/I com M = FL/4 e seção quadrada', destaque: true },
        { tex: 'A = \\max(A_{rigidez},\\,A_{resistência})', d: 'a restrição ativa é a que pede mais área' },
        { tex: 'm = A\\,L\\,\\rho' }
      ],
      nota: 'Seção quadrada maciça, viga biapoiada com carga central. A restrição ativa depende do material: é comum a rigidez mandar nos polímeros e a resistência mandar nos aços de alta resistência.',
      calcular: function (p, ctx) {
        var S = p.carga / (p.defl / 1000);
        function areas(m) {
          var E = m.E * 1e9, sf = m.sy * 1e6 / p.fs;
          var Ar = p.L * Math.sqrt(S * p.L / (4 * E));
          var As = Math.pow(3 * p.carga * p.L / (2 * sf), 2 / 3);
          return { Ar: Ar, As: As, A: Math.max(Ar, As), ativa: Ar >= As ? 'rigidez' : 'resistência' };
        }
        var lista = SM.mats.filter(function (m) { return m.fam !== 'espuma' && m.E > 0.05; })
          .map(function (m) {
            var a = areas(m);
            return { m: m, massa: a.A * p.L * m.rho, mr: a.Ar * p.L * m.rho, ms: a.As * p.L * m.rho, ativa: a.ativa };
          })
          .sort(function (a, b) { return a.massa - b.massa; });
        var top = lista.slice(0, 8);
        var rig = lista.filter(function (x) { return x.ativa === 'rigidez'; }).length;

        var g = ctx.plot('massas').clear();
        g.o.xcat = top.map(function (x, k) { return { v: k, label: x.m.nome.split(' ')[0] }; });
        top.forEach(function (x, k) {
          g.bars([k - 0.17], [x.mr], { color: Plot.serie(0), barw: 0.32, label: k === 0 ? 'rigidez' : null });
          g.bars([k + 0.17], [x.ms], { color: Plot.serie(3), barw: 0.32, label: k === 0 ? 'resistência' : null });
          g.text(k, Math.max(x.mr, x.ms), sg(x.massa, 3), { align: 'center', dy: -3, size: 10, weight: '600' });
        });
        g.setLimits([-0.6, top.length - 0.4], [0, Math.max.apply(null, top.map(function (x) { return Math.max(x.mr, x.ms); })) * 1.25]);
        g.draw();

        var b = top[0];
        ctx.setPassos([
          { t: '① Cada restrição pede uma área',
            tex: 'A_{rig} = L\\sqrt{\\frac{SL}{4E}} \\qquad A_{res} = \\left(\\frac{3FLn}{2\\sigma_f}\\right)^{2/3}',
            texSub: 'S = \\frac{' + nt(p.carga) + '}{' + nt(p.defl / 1000, 3) + '} = ' + nt(S, 4) + '\\ \\text{N/m}',
            obs: 'As duas contas são independentes: uma vem da deformação admitida, a outra da tensão admissível. '
              + 'A peça precisa satisfazer as duas ao mesmo tempo.' },
          { t: '② A maior área vence',
            obs: 'Para ' + b.m.nome + ', a rigidez pede ' + nt(b.mr, 3) + ' kg e a resistência pede ' + nt(b.ms, 3)
              + ' kg: a restrição ativa é a de ' + b.ativa + '. Dimensionar pela outra deixaria a peça fora de '
              + 'especificação.' },
          { t: '③ A restrição ativa muda com o material',
            obs: 'Nesta configuração, a rigidez é a restrição ativa em ' + rig + ' dos ' + lista.length
              + ' materiais avaliados. Em geral ela manda nos materiais de baixo módulo, e a resistência manda '
              + 'nos de alta resistência — por isso não existe um índice único que resolva as duas.' },
          { t: '④ O método do acoplamento',
            tex: 'M_1 = \\frac{E^{1/2}}{\\rho} \\qquad M_2 = \\frac{\\sigma_f^{2/3}}{\\rho}',
            obs: 'Quando as duas restrições concorrem, traça-se cada índice num eixo e a razão entre eles define '
              + 'uma equação de acoplamento. Materiais acima das duas linhas servem; o resto é eliminado — e o '
              + 'vencedor aqui foi ' + b.m.nome + ', com ' + nt(b.massa, 3) + ' kg.' }
        ]);
        return {
          vencedor: { v: b.m.nome, classe: 'ok' },
          massa: { v: sg(b.massa, 3), u: 'kg' },
          ativa: { v: b.ativa, classe: b.ativa === 'rigidez' ? '' : 'alerta' },
          quantos: { v: rig + ' de ' + lista.length }
        };
      }
    });
  }

  /* =========================================================================
     4 · Objetivos conflitantes: massa contra custo
     ========================================================================= */
  function montarTradeoff() {
    if (!document.getElementById('sim-tradeoff')) return;
    Sim.build('#sim-tradeoff', {
      titulo: '4. Objetivos conflitantes — massa contra custo',
      descricao: 'Quando há dois objetivos que brigam, não existe o melhor material: existe uma fronteira de soluções não dominadas. O que escolhe um ponto dessa fronteira é o valor de troca — quanto se aceita pagar por quilo economizado.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Produto de consumo', desc: 'Massa quase não vale nada: α = 2 US$/kg',
          valores: { alfa: 2, L: 1, carga: 1000, defl: 2 } },
        { nome: '2 · Automóvel', desc: 'Entre 5 e 20 US$ por quilo economizado',
          valores: { alfa: 12, L: 1, carga: 1000, defl: 2 } },
        { nome: '3 · Aeronave comercial', desc: 'Da ordem de 200 a 500 US$/kg',
          valores: { alfa: 300, L: 1, carga: 1000, defl: 2 } },
        { nome: '4 · Veículo espacial', desc: 'Milhares de dólares por quilo',
          valores: { alfa: 3000, L: 1, carga: 1000, defl: 2 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Valor de troca' },
        { id: 'alfa', label: 'Quanto vale economizar 1 kg', min: 0.5, max: 5000, step: 0.5, valor: 12, unidade: 'US$/kg',
          desc: 'Consumo ≈ 2 · automóvel 5 a 20 · aeronave 200 a 500 · espaço > 3000' },
        { tipo: 'titulo', label: 'A peça (viga biapoiada, seção quadrada)' },
        { id: 'L', label: 'Vão', min: 0.3, max: 4, step: 0.05, valor: 1, unidade: 'm' },
        { id: 'carga', label: 'Carga no meio do vão', min: 100, max: 20000, step: 50, valor: 1000, unidade: 'N' },
        { id: 'defl', label: 'Flecha máxima admitida', min: 0.5, max: 20, step: 0.1, valor: 2, unidade: 'mm' }
      ],
      graficos: [
        { id: 'pareto', titulo: 'Massa × custo do material', xlabel: 'Massa (kg)', ylabel: 'Custo (US$)', aspect: 0.56, legendPos: 'topright' },
        { id: 'z', titulo: 'Função penalidade Z = C + α·m', ylabel: 'Z (US$)', aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'escolhido', label: 'Escolha com este α' },
        { id: 'massaE', label: 'Massa' },
        { id: 'custoE', label: 'Custo' },
        { id: 'zE', label: 'Penalidade Z' },
        { id: 'npareto', label: 'Na fronteira' }
      ],
      formulas: [
        { g: 'Função penalidade' },
        { tex: 'Z = C + \\alpha\\,m', d: 'α é o valor de troca: US$ por kg economizado', destaque: true },
        { tex: '\\text{minimizar } Z \\;\\Leftrightarrow\\; \\text{tangenciar a fronteira com inclinação } -\\alpha' },
        { g: 'Fronteira de Pareto' },
        { tex: '\\text{não dominado} \\;\\Leftrightarrow\\; \\nexists\\, j:\\; m_j \\le m_i \\;\\text{e}\\; C_j \\le C_i',
          d: 'nenhuma outra solução é melhor nos dois objetivos ao mesmo tempo' }
      ],
      nota: 'O custo considerado é só o do material da peça. Num produto real entram processo, montagem e ciclo de vida — o método é o mesmo, mudando o que entra em C.',
      calcular: function (p, ctx) {
        var S = p.carga / (p.defl / 1000);
        var lista = SM.mats.filter(function (m) { return m.fam !== 'espuma' && m.E > 0.05; }).map(function (m) {
          var E = m.E * 1e9;
          var A = p.L * Math.sqrt(S * p.L / (4 * E));
          var massa = A * p.L * m.rho;
          return { m: m, massa: massa, custo: massa * m.custo, Z: massa * m.custo + p.alfa * massa };
        });
        var pareto = lista.filter(function (a) {
          return !lista.some(function (b) {
            return b !== a && b.massa <= a.massa && b.custo <= a.custo && (b.massa < a.massa || b.custo < a.custo);
          });
        }).sort(function (a, b) { return a.massa - b.massa; });
        var melhor = lista.slice().sort(function (a, b) { return a.Z - b.Z; })[0];

        var g = ctx.plot('pareto').clear();
        Object.keys(SM.familias).forEach(function (fam) {
          var sub = lista.filter(function (x) { return x.m.fam === fam; });
          if (!sub.length) return;
          g.points(sub.map(function (x) { return x.massa; }), sub.map(function (x) { return x.custo; }),
            { color: corFam(fam), r: 4.5, label: SM.familias[fam].nome });
        });
        g.line(pareto.map(function (x) { return x.massa; }), pareto.map(function (x) { return x.custo; }),
          { color: Plot.cssVar('--text', '#111'), width: 2, dash: [6, 4], label: 'fronteira de Pareto' });
        pareto.forEach(function (x) {
          g.text(x.massa, x.custo, x.m.nome.split(' ')[0], { size: 9.5, dy: -8, align: 'center', color: corFam(x.m.fam) });
        });
        /* reta de penalidade passando pelo escolhido */
        var xr = [0, Math.max.apply(null, lista.map(function (x) { return x.massa; })) * 1.05];
        g.line(xr, xr.map(function (x) { return melhor.Z - p.alfa * x; }),
          { color: Plot.serie(6), width: 1.8, label: 'Z = ' + sg(melhor.Z, 3) + ' US$' });
        g.marker(melhor.massa, melhor.custo, '', { r: 7, color: Plot.serie(6) });
        g.setLimits(null, null);
        g.draw();

        var topZ = lista.slice().sort(function (a, b) { return a.Z - b.Z; }).slice(0, 8);
        var gz = ctx.plot('z').clear();
        gz.o.xcat = topZ.map(function (x, k) { return { v: k, label: x.m.nome.split(' ')[0] }; });
        topZ.forEach(function (x, k) {
          gz.bars([k], [x.custo], { color: Plot.serie(1), barw: 0.7 });
          gz.bars([k], [x.Z], { color: Plot.serie(3), barw: 0.7, alpha: 0.35 });
          gz.text(k, x.Z, sg(x.Z, 3), { align: 'center', dy: -3, size: 10, weight: '600' });
        });
        gz.setLimits([-0.6, topZ.length - 0.4], [0, Math.max.apply(null, topZ.map(function (x) { return x.Z; })) * 1.25]);
        gz.draw();

        ctx.setPassos([
          { t: '① Dois objetivos, nenhuma soma automática',
            obs: 'Massa e custo têm unidades diferentes: não dá para somar sem antes dizer quanto um vale em '
              + 'relação ao outro. Antes disso, só se pode eliminar as soluções dominadas.' },
          { t: '② A fronteira de Pareto',
            obs: 'Dos ' + lista.length + ' materiais, ' + pareto.length + ' são não dominados: '
              + pareto.map(function (x) { return x.m.nome.split(' ')[0]; }).join(', ')
              + '. Qualquer um fora dessa fronteira é pior em massa e em custo ao mesmo tempo que algum outro.' },
          { t: '③ O valor de troca escolhe o ponto',
            tex: 'Z = C + \\alpha\\,m',
            texSub: 'Z = ' + nt(melhor.custo, 3) + ' + ' + nt(p.alfa, 3) + ' \\times ' + nt(melhor.massa, 3)
              + ' = ' + nt(melhor.Z, 4) + '\\ \\text{US\\$}',
            obs: 'Com α = ' + nt(p.alfa, 3) + ' US$/kg, o mínimo de Z é ' + melhor.m.nome + '. Geometricamente, é '
              + 'o ponto em que a reta de inclinação −α tangencia a fronteira.' },
          { t: '④ Por que α muda tudo',
            obs: 'Com α baixo o custo domina e vence um material barato; com α alto a massa domina e vencem '
              + 'compósitos e ligas leves. É exatamente por isso que a mesma peça é de aço no portão e de fibra '
              + 'de carbono no avião — não há contradição técnica, só valores de troca diferentes.' }
        ]);
        return {
          escolhido: { v: melhor.m.nome, classe: 'ok' },
          massaE: { v: sg(melhor.massa, 3), u: 'kg' },
          custoE: { v: 'US$ ' + sg(melhor.custo, 3) },
          zE: { v: 'US$ ' + sg(melhor.Z, 4) },
          npareto: { v: pareto.length + ' de ' + lista.length }
        };
      }
    });
  }

  /* =========================================================================
     5 · Material e forma
     ========================================================================= */
  function montarForma() {
    if (!document.getElementById('sim-forma')) return;
    Sim.build('#sim-forma', {
      titulo: '5. Material e forma — o fator de forma',
      descricao: 'A mesma massa de material pode render rigidezes muito diferentes conforme a seção. O fator de forma mede esse ganho, e ele entra no índice: o que seleciona não é o material, é o par material-forma.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Maciço contra tubo', desc: 'O mesmo aço, duas seções',
          valores: { mat: 'aco', forma: 'tubo', comparar: 'al6061', forma2: 'quadrada' } },
        { nome: '2 · Aço tubular contra alumínio maciço', desc: 'A forma vence o material',
          valores: { mat: 'aco', forma: 'tubofino', comparar: 'al6061', forma2: 'quadrada' } },
        { nome: '3 · Madeira em perfil caixa', desc: 'Limite de forma baixo nos naturais',
          valores: { mat: 'madeira', forma: 'caixa', comparar: 'aco', forma2: 'I' } },
        { nome: '4 · Cerâmico não aceita forma', desc: 'Alumina fica presa à seção maciça',
          valores: { mat: 'alumina', forma: 'quadrada', comparar: 'acoliga', forma2: 'tubo' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Primeira opção' },
        { id: 'mat', tipo: 'select', label: 'Material', valor: 'aco',
          opcoes: SM.mats.filter(function (m) { return m.fam !== 'espuma'; }).map(function (m) { return { v: m.id, t: m.nome }; }) },
        { id: 'forma', tipo: 'select', label: 'Seção', valor: 'tubo',
          opcoes: SM.formas.map(function (f) { return { v: f.id, t: f.nome }; }) },
        { tipo: 'titulo', label: 'Segunda opção' },
        { id: 'comparar', tipo: 'select', label: 'Material', valor: 'al6061',
          opcoes: SM.mats.filter(function (m) { return m.fam !== 'espuma'; }).map(function (m) { return { v: m.id, t: m.nome }; }) },
        { id: 'forma2', tipo: 'select', label: 'Seção', valor: 'quadrada',
          opcoes: SM.formas.map(function (f) { return { v: f.id, t: f.nome }; }) }
      ],
      graficos: [
        { id: 'comp', titulo: 'Índice com forma: E^{1/2}/ρ × √φ', ylabel: '', aspect: 0.4, legend: false }
      ],
      saidas: [
        { id: 'i1', label: 'Opção 1 · índice com forma' },
        { id: 'i2', label: 'Opção 2 · índice com forma' },
        { id: 'ganho', label: 'Vantagem da opção 1' },
        { id: 'limite', label: 'Forma viável?' }
      ],
      formulas: [
        { g: 'Fator de forma elástico' },
        { tex: '\\phi_B^e = \\frac{12 I}{A^2}', d: 'quanto a seção rende em flexão comparada à quadrada maciça', destaque: true },
        { tex: 'M = \\frac{(\\phi_B^e E)^{1/2}}{\\rho}', d: 'o par material-forma é que deve ser maximizado', destaque: true },
        { g: 'Resistência' },
        { tex: '\\phi_B^f = \\frac{Z}{Z_{quadrada}} \\qquad M = \\frac{(\\phi_B^f \\sigma_f)^{2/3}}{\\rho}' },
        { g: 'Limite' },
        { tex: '\\phi_{máx} \\approx 65 \\text{ (metais)} \\quad 40 \\text{ (compósitos)} \\quad 25 \\text{ (polímeros)} \\quad 2 \\text{ (cerâmicos)}',
          d: 'acima disso a parede flamba localmente ou o material não se conforma' }
      ],
      nota: 'Os fatores de forma listados são valores típicos de seções comerciais. O limite por família vem da combinação entre conformabilidade e flambagem local da parede fina.',
      calcular: function (p, ctx) {
        function acha(id, lista, campo) {
          for (var i = 0; i < lista.length; i++) if (lista[i][campo || 'id'] === id) return lista[i];
          return lista[0];
        }
        var m1 = SM.porId(p.mat), f1 = acha(p.forma, SM.formas);
        var m2 = SM.porId(p.comparar), f2 = acha(p.forma2, SM.formas);
        function idx(m, f) { return Math.sqrt(f.fe * m.E * 1000) / m.rho * 1000; }
        function viavel(m, f) { return f.fe <= (SM.formaMax[m.fam] || 2); }
        var i1 = idx(m1, f1), i2 = idx(m2, f2);
        var base1 = Math.sqrt(m1.E * 1000) / m1.rho * 1000, base2 = Math.sqrt(m2.E * 1000) / m2.rho * 1000;

        var g = ctx.plot('comp').clear();
        var rot = [m1.nome.split(' ')[0] + ' maciço', m1.nome.split(' ')[0] + ' + forma',
                   m2.nome.split(' ')[0] + ' maciço', m2.nome.split(' ')[0] + ' + forma'];
        var vals = [base1, i1, base2, i2];
        var cores = [corFam(m1.fam), corFam(m1.fam), corFam(m2.fam), corFam(m2.fam)];
        g.o.xcat = rot.map(function (r, k) { return { v: k, label: r }; });
        vals.forEach(function (v, k) {
          g.bars([k], [v], { color: cores[k], barw: 0.66, alpha: k % 2 ? 1 : 0.45 });
          g.text(k, v, sg(v, 3), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        g.setLimits([-0.6, 3.4], [0, Math.max.apply(null, vals) * 1.25]);
        g.draw();

        ctx.setPassos([
          { t: '① O que a forma faz',
            tex: '\\phi_B^e = \\frac{12I}{A^2}',
            obs: 'Um tubo com d/t = 10 tem φ ≈ 6,5: com a mesma área de material, ele é seis vezes e meia mais '
              + 'rígido em flexão que a barra quadrada maciça. A forma não muda o material, muda onde ele está.' },
          { t: '② A forma entra dentro do índice',
            tex: 'M = \\frac{(\\phi_B^e E)^{1/2}}{\\rho}',
            texSub: 'M_1 = \\frac{(' + nt(f1.fe, 3) + ' \\times ' + nt(m1.E, 3) + ')^{1/2}}{' + nt(m1.rho / 1000, 3) + '} = ' + nt(i1, 3),
            obs: 'Como φ entra multiplicando E, um material medíocre numa boa forma pode superar um material '
              + 'excelente numa forma ruim.' },
          { t: '③ A comparação',
            obs: m1.nome + ' em ' + f1.nome.toLowerCase() + ' dá M = ' + nt(i1, 3) + '; ' + m2.nome + ' em '
              + f2.nome.toLowerCase() + ' dá M = ' + nt(i2, 3) + '. '
              + (i1 > i2 ? 'A primeira opção vence por ' + nt(100 * (i1 / i2 - 1), 3) + ' %.'
                        : 'A segunda opção vence por ' + nt(100 * (i2 / i1 - 1), 3) + ' %.') },
          { t: '④ Nem toda forma é possível',
            obs: 'O fator de forma tem teto: parede fina demais flamba localmente, e nem todo material se conforma '
              + 'em perfil. ' + (viavel(m1, f1) ? 'A forma escolhida é viável neste material.'
                : 'A forma escolhida está acima do limite prático de ' + (SM.formaMax[m1.fam] || 2) + ' para esta família.')
              + ' É por isso que cerâmicos quase sempre aparecem em seção maciça e metais aparecem em perfil.' }
        ]);
        return {
          i1: { v: sg(i1, 3), classe: i1 >= i2 ? 'ok' : '' },
          i2: { v: sg(i2, 3), classe: i2 > i1 ? 'ok' : '' },
          ganho: { v: sg(100 * (i1 / i2 - 1), 3), u: '%' },
          limite: { v: viavel(m1, f1) ? 'sim' : 'acima do limite', classe: viavel(m1, f1) ? 'ok' : 'alerta' }
        };
      }
    });
  }

  function iniciar() {
    if (!global.Sim || !global.Plot) return;
    montarMapa();
    montarIndice();
    montarRestricoes();
    montarTradeoff();
    montarForma();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

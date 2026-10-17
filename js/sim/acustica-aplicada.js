/* ============================================================
   Simuladores de Acústica Aplicada
   1 · Níveis, fontes e distância
   2 · Espectro, ponderações e exposição
   3 · Impedância, reflexão e transmissão
   4 · Reverberação e campo sonoro em salas
   5 · Isolamento e ruído ocupacional
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim;
  if (!Sim) return;

  var AC = {};

  /* ---------------------------------------------------------------
     Constantes e utilitários
     --------------------------------------------------------------- */
  AC.PREF = 2e-5;          /* Pa — referência de pressão no ar */
  AC.IREF = 1e-12;         /* W/m² */
  AC.WREF = 1e-12;         /* W */

  var L10 = function (v) { return Math.log(Math.max(v, 1e-300)) / Math.LN10; };
  AC.log10 = L10;

  /* soma incoerente de níveis em dB */
  AC.somaNiveis = function (lista) {
    var s = 0, i;
    for (i = 0; i < lista.length; i++) s += Math.pow(10, lista[i] / 10);
    return 10 * L10(s);
  };
  /* subtração de níveis (ruído de fundo) */
  AC.subtraiNiveis = function (total, fundo) {
    var d = Math.pow(10, total / 10) - Math.pow(10, fundo / 10);
    return d <= 0 ? null : 10 * L10(d);
  };
  AC.nivel = function (p) { return 20 * L10(p / AC.PREF); };
  AC.pressao = function (nps) { return AC.PREF * Math.pow(10, nps / 20); };

  /* velocidade do som no ar (Laplace) */
  AC.cAr = function (T) { return 331.3 * Math.sqrt(1 + T / 273.15); };
  AC.rhoAr = function (T) { return 1.293 * 273.15 / (273.15 + T); };

  /* ponderação A (IEC 61672) e C */
  AC.pondA = function (f) {
    var f2 = f * f;
    var n = Math.pow(12194, 2) * f2 * f2;
    var d = (f2 + Math.pow(20.6, 2))
      * Math.sqrt((f2 + Math.pow(107.7, 2)) * (f2 + Math.pow(737.9, 2)))
      * (f2 + Math.pow(12194, 2));
    return 20 * L10(n / d) + 2.00;
  };
  AC.pondC = function (f) {
    var f2 = f * f;
    var n = Math.pow(12194, 2) * f2;
    var d = (f2 + Math.pow(20.6, 2)) * (f2 + Math.pow(12194, 2));
    return 20 * L10(n / d) + 0.06;
  };

  AC.bandas = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000];
  AC.rotBanda = function (f) { return f >= 1000 ? (f / 1000) + 'k' : String(f); };

  /* atenuação do ar, dB/km — valores típicos a 20 °C e 70 % de umidade */
  AC.mAr = { 31.5: 0.1, 63: 0.2, 125: 0.4, 250: 1.0, 500: 1.9, 1000: 3.7, 2000: 9.7, 4000: 32.8, 8000: 117 };

  /* ---------------------------------------------------------------
     Meios: massa específica e velocidade do som
     --------------------------------------------------------------- */
  AC.meios = [
    { id: 'ar', nome: 'Ar (20 °C)', rho: 1.21, c: 343 },
    { id: 'helio', nome: 'Hélio', rho: 0.166, c: 1007 },
    { id: 'co2', nome: 'Dióxido de carbono', rho: 1.84, c: 267 },
    { id: 'agua', nome: 'Água doce (20 °C)', rho: 998, c: 1481 },
    { id: 'mar', nome: 'Água do mar', rho: 1026, c: 1500 },
    { id: 'glicerina', nome: 'Glicerina', rho: 1260, c: 1920 },
    { id: 'oleo', nome: 'Óleo lubrificante', rho: 900, c: 1390 },
    { id: 'borracha', nome: 'Borracha', rho: 1100, c: 1550 },
    { id: 'madeira', nome: 'Madeira', rho: 600, c: 3800 },
    { id: 'concreto', nome: 'Concreto', rho: 2400, c: 3400 },
    { id: 'aluminio', nome: 'Alumínio', rho: 2700, c: 6300 },
    { id: 'aco', nome: 'Aço', rho: 7850, c: 5900 }
  ];
  AC.meio = function (id) {
    for (var i = 0; i < AC.meios.length; i++) if (AC.meios[i].id === id) return AC.meios[i];
    return AC.meios[0];
  };

  /* ---------------------------------------------------------------
     Materiais de acabamento: coeficiente de absorção por banda
     ordem: 125, 250, 500, 1k, 2k, 4k
     --------------------------------------------------------------- */
  AC.absorventes = [
    { id: 'concreto', nome: 'Concreto aparente', a: [0.01, 0.01, 0.02, 0.02, 0.02, 0.03] },
    { id: 'reboco', nome: 'Reboco pintado', a: [0.02, 0.02, 0.03, 0.03, 0.04, 0.05] },
    { id: 'tijolo', nome: 'Alvenaria aparente', a: [0.03, 0.03, 0.03, 0.04, 0.05, 0.07] },
    { id: 'vidro', nome: 'Vidro em caixilho', a: [0.18, 0.06, 0.04, 0.03, 0.02, 0.02] },
    { id: 'madeira', nome: 'Painel de madeira (lambri)', a: [0.15, 0.11, 0.10, 0.07, 0.06, 0.07] },
    { id: 'gesso', nome: 'Gesso acartonado', a: [0.29, 0.10, 0.05, 0.04, 0.07, 0.09] },
    { id: 'forro', nome: 'Forro mineral acústico', a: [0.30, 0.45, 0.65, 0.75, 0.75, 0.70] },
    { id: 'carpete', nome: 'Carpete sobre laje', a: [0.02, 0.06, 0.14, 0.37, 0.60, 0.65] },
    { id: 'cortina', nome: 'Cortina pesada franzida', a: [0.07, 0.31, 0.49, 0.75, 0.70, 0.60] },
    { id: 'espuma', nome: 'Espuma acústica 25 mm', a: [0.10, 0.25, 0.55, 0.75, 0.85, 0.90] },
    { id: 'la', nome: 'Lã mineral 50 mm', a: [0.20, 0.55, 0.80, 0.90, 0.92, 0.95] },
    { id: 'plateia', nome: 'Plateia ocupada', a: [0.60, 0.74, 0.88, 0.96, 0.93, 0.85] }
  ];
  AC.absorvente = function (id) {
    for (var i = 0; i < AC.absorventes.length; i++) if (AC.absorventes[i].id === id) return AC.absorventes[i];
    return AC.absorventes[0];
  };
  AC.bandasSala = [125, 250, 500, 1000, 2000, 4000];

  /* ---------------------------------------------------------------
     Paredes: massa por área e rigidez, para a lei da massa
     --------------------------------------------------------------- */
  AC.paredes = [
    { id: 'concreto', nome: 'Concreto', rho: 2400, E: 30e9, nu: 0.20, h: 100 },
    { id: 'tijolo', nome: 'Alvenaria rebocada', rho: 1800, E: 10e9, nu: 0.20, h: 150 },
    { id: 'gesso', nome: 'Gesso acartonado (2 chapas)', rho: 850, E: 2.5e9, nu: 0.25, h: 25 },
    { id: 'vidro', nome: 'Vidro', rho: 2500, E: 70e9, nu: 0.22, h: 6 },
    { id: 'madeira', nome: 'Compensado', rho: 650, E: 7e9, nu: 0.25, h: 18 },
    { id: 'aco', nome: 'Chapa de aço', rho: 7850, E: 210e9, nu: 0.30, h: 1.5 },
    { id: 'chumbo', nome: 'Lâmina de chumbo', rho: 11300, E: 16e9, nu: 0.44, h: 1.5 }
  ];
  AC.parede = function (id) {
    for (var i = 0; i < AC.paredes.length; i++) if (AC.paredes[i].id === id) return AC.paredes[i];
    return AC.paredes[0];
  };
  /* lei da massa em incidência de campo + queda na coincidência */
  AC.leiDaMassa = function (m, f) { return 20 * L10(m * f) - 47; };
  AC.fCoincidencia = function (p, hmm) {
    var cL = Math.sqrt(p.E / (p.rho * (1 - p.nu * p.nu)));
    return { cL: cL, fc: 343 * 343 / (1.8 * cL * hmm / 1000) };
  };
  /* TL de uma parede real: lei da massa, vale da coincidência e a subida mais
     rápida acima de f_c (cerca de 9 dB/oitava em vez de 6). É contínua em f. */
  AC.tl = function (p, hmm, f) {
    var m = p.rho * hmm / 1000;
    var fc = AC.fCoincidencia(p, hmm).fc;
    var r = L10(f / fc);
    var vale = 8 * Math.exp(-Math.pow(r / 0.25, 2));
    var subida = r > 0 ? 10 * r : 0;
    return Math.max(0, AC.leiDaMassa(m, f) - vale + subida);
  };

  /* perda de transmissão de uma parede composta (parede + abertura) */
  AC.tlComposta = function (partes) {
    var st = 0, ts = 0, i;
    for (i = 0; i < partes.length; i++) {
      st += partes[i].S;
      ts += partes[i].S * Math.pow(10, -partes[i].TL / 10);
    }
    return 10 * L10(st / ts);
  };

  /* ---------------------------------------------------------------
     Ruído ocupacional
     --------------------------------------------------------------- */
  AC.tempoMax = function (nivel, q) { return 8 / Math.pow(2, (nivel - 85) / q); };
  AC.leq = function (trechos) {
    var t = 0, s = 0, i;
    for (i = 0; i < trechos.length; i++) { t += trechos[i].h; s += trechos[i].h * Math.pow(10, trechos[i].L / 10); }
    return t > 0 ? 10 * L10(s / t) : 0;
  };

  global.AC = AC;

  var Plot = global.Plot;
  function sg(v, n) { return global.Plot ? global.Plot.sig(v, n || 3) : v; }
  function nt(v, n) { return sg(v, n).toString().replace('.', ','); }
  function cor(i) { return Plot.serie(i); }

  /* =========================================================================
     1 · Níveis, fontes e distância
     ========================================================================= */
  function montarNiveis() {
    if (!document.getElementById('sim-niveis')) return;
    Sim.build('#sim-niveis', {
      titulo: '1. Níveis, fontes e distância — do watt ao decibel',
      descricao: 'Uma fonte emite certa potência acústica; o microfone mede pressão. O simulador percorre o caminho inteiro: potência → nível de potência → nível de pressão a uma distância, com o fator de diretividade, a absorção do ar e a soma de várias fontes.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Fonte de 0,2 W em campo livre', desc: 'O caso-escola: NWS e NPS a 1 m',
          valores: { W: 0.2, Q: 1, r: 1, n: 1, f: 1000, ar: false } },
        { nome: '2 · Máquina apoiada no piso', desc: 'Q = 2 muda o nível em 3 dB',
          valores: { W: 0.2, Q: 2, r: 10, n: 1, f: 1000, ar: false } },
        { nome: '3 · Seis fontes iguais', desc: 'Soma incoerente: +10 log 6',
          valores: { W: 0.01, Q: 2, r: 5, n: 6, f: 1000, ar: false } },
        { nome: '4 · Apito de navio a 2 km', desc: 'Aqui a absorção do ar pesa',
          valores: { W: 10, Q: 2, r: 2000, n: 1, f: 1000, ar: true } },
        { nome: '5 · Agudo distante', desc: 'A 4 kHz o ar engole o som',
          valores: { W: 10, Q: 2, r: 2000, n: 1, f: 4000, ar: true } },
        { nome: '6 · Fonte no canto', desc: 'Q = 8: duas paredes e o piso',
          valores: { W: 0.05, Q: 8, r: 3, n: 1, f: 500, ar: false } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A fonte' },
        { id: 'W', label: 'Potência acústica de cada fonte', min: 0.0001, max: 50, step: 0.0001, valor: 0.2, unidade: 'W' },
        { id: 'n', label: 'Número de fontes idênticas', min: 1, max: 20, step: 1, valor: 1 },
        { id: 'Q', tipo: 'select', label: 'Diretividade (onde a fonte está)', valor: 1,
          opcoes: [{ v: 1, t: 'Q = 1 · campo livre, longe de tudo' },
                   { v: 2, t: 'Q = 2 · apoiada no piso' },
                   { v: 4, t: 'Q = 4 · junto a piso e parede' },
                   { v: 8, t: 'Q = 8 · no canto (duas paredes e o piso)' }] },
        { tipo: 'titulo', label: 'O receptor' },
        { id: 'r', label: 'Distância à fonte', min: 0.5, max: 5000, step: 0.5, valor: 1, unidade: 'm' },
        { id: 'f', tipo: 'select', label: 'Banda de frequência', valor: 1000,
          opcoes: AC.bandas.map(function (b) { return { v: b, t: AC.rotBanda(b) + ' Hz' }; }) },
        { id: 'ar', tipo: 'check', label: 'Incluir a absorção do ar', valor: false }
      ],
      graficos: [
        { id: 'queda', titulo: 'Nível de pressão × distância', xlabel: 'Distância (m)', ylabel: 'NPS (dB)',
          xlog: true, aspect: 0.5, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'nws', label: 'Nível de potência (NWS)' },
        { id: 'nps', label: 'NPS no receptor' },
        { id: 'prms', label: 'Pressão eficaz' },
        { id: 'div', label: 'Perda por divergência' },
        { id: 'atm', label: 'Perda no ar' },
        { id: 'soma', label: 'Ganho das n fontes' }
      ],
      formulas: [
        { g: 'Da potência ao nível' },
        { tex: 'L_W = 10\\log_{10}\\frac{W}{10^{-12}}', d: 'nível de potência sonora, dB re 1 pW', destaque: true },
        { tex: 'L_p = L_W + 10\\log_{10}\\frac{Q}{4\\pi r^2} - \\alpha_{ar} r',
          d: 'nível de pressão a r metros, em campo livre', destaque: true },
        { g: 'Somas e diferenças' },
        { tex: 'L_{total} = 10\\log_{10}\\sum_i 10^{L_i/10}', d: 'fontes incoerentes somam potências, nunca níveis' },
        { tex: 'n\\ \\text{fontes iguais} \\;\\Rightarrow\\; +10\\log_{10} n', d: '2 fontes: +3 dB; 10 fontes: +10 dB' },
        { tex: 'L_p = 20\\log_{10}\\frac{p_{rms}}{2\\times10^{-5}}', d: 'de volta à pressão, em pascal' }
      ],
      nota: 'O modelo é de campo livre: vale ao ar livre ou em câmara anecoica. Dentro de uma sala, a partir da distância crítica o campo reverberante domina e o nível para de cair — é o simulador 4 que trata desse caso.',
      calcular: function (p, ctx) {
        var Q = +p.Q, n = Math.round(p.n), f = +p.f;
        var LW = 10 * L10(p.W / AC.WREF);
        var LWtot = LW + 10 * L10(n);
        var mkm = p.ar ? AC.mAr[f] : 0;
        function nivelEm(r) {
          return LWtot + 10 * L10(Q / (4 * Math.PI * r * r)) - mkm * r / 1000;
        }
        var Lp = nivelEm(p.r);
        var div = -10 * L10(Q / (4 * Math.PI * p.r * p.r));
        var atm = mkm * p.r / 1000;

        var g = ctx.plot('queda').clear();
        var xs = [], ys = [], ysSem = [], i, r;
        var rmax = Math.max(p.r * 3, 20);
        for (i = 0; i <= 120; i++) {
          r = 0.5 * Math.pow(rmax / 0.5, i / 120);
          xs.push(L10(r));
          ys.push(nivelEm(r));
          ysSem.push(LWtot + 10 * L10(Q / (4 * Math.PI * r * r)));
        }
        if (p.ar) {
          g.line(xs, ysSem, { color: cor(5), width: 1.4, dash: [5, 4], label: 'sem absorção do ar' });
        }
        g.line(xs, ys, { color: cor(0), width: 2.4, label: 'fonte pontual (−6 dB por dobro)' });
        /* comparação com uma fonte linear, que cai metade disso */
        var yl = xs.map(function (lx) {
          return nivelEm(p.r) + 10 * L10(p.r / Math.pow(10, lx));
        });
        g.line(xs, yl, { color: cor(2), width: 1.6, dash: [7, 5], label: 'fonte linear (−3 dB por dobro)' });
        g.marker(L10(p.r), Lp, nt(Lp, 4) + ' dB', { color: cor(3) });
        g.setLimits([L10(0.5), L10(rmax)], null);
        g.draw();

        ctx.setPassos([
          { t: '① A potência vira nível',
            tex: 'L_W = 10\\log_{10}\\frac{' + nt(p.W, 3) + '}{10^{-12}} = ' + nt(LW, 4) + '\\ \\text{dB}',
            obs: 'O nível de potência é uma propriedade da fonte: não depende de onde se mede. '
              + (n > 1 ? 'Com ' + n + ' fontes iguais, a potência total é ' + n + ' vezes maior, o que soma '
                + nt(10 * L10(n), 3) + ' dB.' : 'Uma fonte só.') },
          { t: '② A potência se espalha',
            tex: 'L_p = L_W + 10\\log_{10}\\frac{Q}{4\\pi r^2}',
            texSub: '10\\log_{10}\\frac{' + Q + '}{4\\pi\\,(' + nt(p.r, 4) + ')^2} = ' + nt(-div, 4) + '\\ \\text{dB}',
            obs: 'A mesma potência atravessa uma esfera cada vez maior. Com Q = ' + Q + ', ela se distribui por '
              + (Q === 1 ? 'toda a esfera' : Q === 2 ? 'meia esfera' : Q === 4 ? 'um quarto de esfera' : 'um oitavo de esfera')
              + '. Dobrar a distância custa sempre 6 dB — e isso não depende de Q.' },
          { t: '③ O ar absorve',
            tex: p.ar ? 'A_{atm} = \\alpha\\,r = ' + nt(AC.mAr[f], 3) + '\\ \\text{dB/km} \\times ' + nt(p.r / 1000, 4) + '\\ \\text{km} = ' + nt(atm, 3) + '\\ \\text{dB}'
              : 'A_{atm} = 0',
            obs: p.ar
              ? 'A absorção cresce muito com a frequência: ' + nt(AC.mAr[125], 3) + ' dB/km em 125 Hz contra '
                + nt(AC.mAr[4000], 3) + ' dB/km em 4 kHz. É por isso que, de longe, só se ouvem os graves do show.'
              : 'Desligada. Abaixo de uns 100 m e em frequências baixas ela é mesmo desprezível; em quilômetros e em agudos, não.' },
          { t: '④ O resultado',
            texSub: 'L_p = ' + nt(LWtot, 4) + ' - ' + nt(div, 4) + (atm ? ' - ' + nt(atm, 3) : '') + ' = ' + nt(Lp, 4) + '\\ \\text{dB}',
            obs: 'Isso equivale a uma pressão eficaz de ' + nt(AC.pressao(Lp), 3) + ' Pa — contra os 101 325 Pa da pressão '
              + 'atmosférica. O som é uma flutuação minúscula sobre um valor enorme, e é por isso que a escala é logarítmica.' }
        ]);
        return {
          nws: { v: sg(LWtot, 4), u: 'dB' },
          nps: { v: sg(Lp, 4), u: 'dB', classe: Lp > 85 ? 'alerta' : 'ok' },
          prms: { v: sg(AC.pressao(Lp), 3), u: 'Pa' },
          div: { v: sg(div, 3), u: 'dB' },
          atm: { v: sg(atm, 3), u: 'dB' },
          soma: { v: sg(10 * L10(n), 3), u: 'dB' }
        };
      }
    });
  }

  /* =========================================================================
     2 · Espectro, ponderações e exposição
     ========================================================================= */
  function montarEspectro() {
    if (!document.getElementById('sim-espectro')) return;
    var ids = AC.bandas.map(function (b) { return 'b' + String(b).replace('.', ''); });
    Sim.build('#sim-espectro', {
      titulo: '2. Espectro, ponderações e exposição — o nível global em dB(A)',
      descricao: 'Um número só não descreve um ruído. O espectro por bandas de oitava mostra onde está a energia; a ponderação A corrige pela sensibilidade do ouvido; e o nível global em dB(A), com o tempo de exposição, é o que a norma de higiene ocupacional cobra.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ruído de banda larga', desc: 'O espectro das listas, para conferir a conta',
          valores: { b315: 60, b63: 65, b125: 70, b250: 75, b500: 65, b1000: 55, b2000: 45, b4000: 40, b8000: 32, horas: 8 } },
        { nome: '2 · Compressor alternativo', desc: 'Energia concentrada nos graves',
          valores: { b315: 95, b63: 97, b125: 94, b250: 88, b500: 84, b1000: 82, b2000: 79, b4000: 74, b8000: 68, horas: 8 } },
        { nome: '3 · Jato de ar comprimido', desc: 'O oposto: tudo nos agudos',
          valores: { b315: 70, b63: 74, b125: 78, b250: 83, b500: 89, b1000: 94, b2000: 99, b4000: 101, b8000: 96, horas: 4 } },
        { nome: '4 · Escritório silencioso', desc: 'Bem abaixo do limite',
          valores: { b315: 50, b63: 45, b125: 42, b250: 40, b500: 38, b1000: 36, b2000: 33, b4000: 30, b8000: 26, horas: 8 } },
        { nome: '5 · Serra circular', desc: 'Ultrapassa o limite em menos de uma hora',
          valores: { b315: 82, b63: 85, b125: 88, b250: 92, b500: 96, b1000: 100, b2000: 103, b4000: 104, b8000: 99, horas: 2 } },
        { nome: '6 · Tráfego a 20 m', desc: 'Espectro cheio nos médios',
          valores: { b315: 68, b63: 70, b125: 71, b250: 70, b500: 69, b1000: 68, b2000: 64, b4000: 58, b8000: 50, horas: 8 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'NPS por banda de oitava (dB)' }
      ].concat(AC.bandas.map(function (b, i) {
        return { id: ids[i], label: AC.rotBanda(b) + ' Hz', min: 10, max: 120, step: 1,
                 valor: [60, 65, 70, 75, 65, 55, 45, 40, 32][i], unidade: 'dB' };
      })).concat([
        { tipo: 'titulo', label: 'Exposição' },
        { id: 'horas', label: 'Tempo de exposição na jornada', min: 0.25, max: 12, step: 0.25, valor: 8, unidade: 'h' }
      ]),
      graficos: [
        { id: 'esp', titulo: 'Espectro: medido e ponderado', ylabel: 'NPS (dB)', aspect: 0.46, legendPos: 'topright' },
        { id: 'pond', titulo: 'As curvas de ponderação', xlabel: 'Frequência (Hz)', ylabel: 'Correção (dB)',
          xlog: true, aspect: 0.34, legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'glob', label: 'Nível global (linear)' },
        { id: 'globA', label: 'Nível global em A' },
        { id: 'globC', label: 'Nível global em C' },
        { id: 'domin', label: 'Banda dominante em A' },
        { id: 'tmax', label: 'Tempo máximo (q = 5 dB)' },
        { id: 'dose', label: 'Dose da jornada' }
      ],
      formulas: [
        { g: 'Nível global' },
        { tex: 'L_{glob} = 10\\log_{10}\\sum_i 10^{L_i/10}', d: 'soma energética das bandas', destaque: true },
        { tex: 'L_{A} = 10\\log_{10}\\sum_i 10^{(L_i + A_i)/10}', d: 'cada banda corrigida antes de somar', destaque: true },
        { g: 'Bandas' },
        { tex: 'f_{sup}/f_{inf} = 2 \\quad\\text{(oitava)} \\qquad 2^{1/3} \\quad\\text{(terço)}', d: 'largura relativa constante' },
        { tex: 'f_{inf} = f_c/\\sqrt{2},\\quad f_{sup} = f_c\\sqrt{2}', d: 'limites de uma banda de oitava' },
        { g: 'Exposição' },
        { tex: 'T_{max} = \\frac{8}{2^{(L_A-85)/q}}', d: 'q = 5 dB (critério brasileiro) ou 3 dB (ISO)' },
        { tex: 'D = \\sum_i \\frac{C_i}{T_i} \\le 1', d: 'dose diária: acima de 1 (100 %), excedida' }
      ],
      nota: 'A ponderação A nasceu da curva isofônica de 40 fones e descreve mal ruídos intensos; por isso a diferença L_C − L_A é usada como indicador de conteúdo grave, que a proteção auditiva atenua pior.',
      calcular: function (p, ctx) {
        var niveis = ids.map(function (id) { return p[id]; });
        var A = AC.bandas.map(AC.pondA);
        var C = AC.bandas.map(AC.pondC);
        var nA = niveis.map(function (v, i) { return v + A[i]; });
        var nC = niveis.map(function (v, i) { return v + C[i]; });
        var glob = AC.somaNiveis(niveis), globA = AC.somaNiveis(nA), globC = AC.somaNiveis(nC);
        var iDom = 0, k;
        for (k = 1; k < nA.length; k++) if (nA[k] > nA[iDom]) iDom = k;

        var g = ctx.plot('esp').clear();
        g.o.xcat = AC.bandas.map(function (b, i) { return { v: i, label: AC.rotBanda(b) }; });
        AC.bandas.forEach(function (b, i) {
          g.bars([i - 0.19], [niveis[i]], { color: cor(0), barw: 0.36 });
          g.bars([i + 0.19], [Math.max(nA[i], 0)], { color: cor(3), barw: 0.36 });
        });
        g.hline(globA, { color: cor(1), width: 1.8, dash: [6, 4], text: 'global ' + nt(globA, 4) + ' dB(A)' });
        g.line([-0.6, AC.bandas.length - 0.4], [0, 0], { color: cor(0), width: 0, label: 'medido (linear)' });
        g.line([-0.6, AC.bandas.length - 0.4], [0, 0], { color: cor(3), width: 0, label: 'ponderado A' });
        g.setLimits([-0.6, AC.bandas.length - 0.4],
          [0, Math.max.apply(null, niveis.concat([globA])) * 1.12]);
        g.draw();

        var gp = ctx.plot('pond').clear();
        var xs = [], ya = [], yc = [], i, fq;
        for (i = 0; i <= 100; i++) {
          fq = 16 * Math.pow(20000 / 16, i / 100);
          xs.push(L10(fq)); ya.push(AC.pondA(fq)); yc.push(AC.pondC(fq));
        }
        gp.line(xs, ya, { color: cor(3), width: 2.2, label: 'ponderação A' });
        gp.line(xs, yc, { color: cor(2), width: 1.8, dash: [6, 4], label: 'ponderação C' });
        gp.hline(0, { color: cor(5), width: 1 });
        gp.setLimits([L10(16), L10(20000)], [-50, 8]);
        gp.draw();

        var tmax = AC.tempoMax(globA, 5);
        var dose = globA >= 85 ? p.horas / tmax : 0;

        ctx.setPassos([
          { t: '① Somar as bandas não é somar os números',
            tex: 'L_{glob} = 10\\log_{10}\\sum 10^{L_i/10} = ' + nt(glob, 4) + '\\ \\text{dB}',
            obs: 'A banda mais alta tem ' + nt(Math.max.apply(null, niveis), 4) + ' dB e o global é '
              + nt(glob, 4) + ' dB: só ' + nt(glob - Math.max.apply(null, niveis), 2)
              + ' dB acima dela. Bandas 10 dB abaixo da maior quase não contribuem — a soma energética é dominada pelas maiores.' },
          { t: '② Corrigir pelo ouvido',
            tex: 'L_A = 10\\log_{10}\\sum 10^{(L_i + A_i)/10} = ' + nt(globA, 4) + '\\ \\text{dB(A)}',
            texSub: 'A_{125} = ' + nt(A[2], 3) + ' \\quad A_{1k} = 0 \\quad A_{4k} = ' + nt(A[7], 3),
            obs: 'A ponderação A despreza os graves: em 31,5 Hz ela subtrai ' + nt(-A[0], 3)
              + ' dB. Por isso um ruído grave e intenso pode ter dB(A) modesto — e ainda assim incomodar e vibrar a estrutura.' },
          { t: '③ Quem manda no dB(A)',
            obs: 'Depois da ponderação, a banda dominante é a de ' + AC.rotBanda(AC.bandas[iDom]) + ' Hz, com '
              + nt(nA[iDom], 4) + ' dB(A). É nela que um tratamento acústico precisa atuar: atenuar 10 dB numa banda '
              + 'que está 15 dB abaixo da dominante não muda nada no global.' },
          { t: '④ Quanto tempo se pode ficar ali',
            tex: 'T_{max} = \\frac{8}{2^{(' + nt(globA, 4) + '-85)/5}} = ' + (globA >= 85 ? nt(tmax, 3) + '\\ \\text{h}' : '\\text{sem limite}'),
            obs: globA < 85
              ? 'Abaixo de 85 dB(A) não há limite de jornada pelo critério brasileiro — o que não significa conforto: '
                + 'para trabalho intelectual, 85 dB(A) é insuportável.'
              : 'Com ' + nt(p.horas, 3) + ' h de exposição, a dose é ' + nt(100 * dose, 3) + ' %. '
                + (dose > 1 ? 'Acima de 100 %: a exposição é excessiva e exige medida de controle.'
                            : 'Abaixo de 100 %: dentro do limite, mas sem margem para horas extras.')
                + ' Pelo critério ISO (q = 3 dB), mais severo, o tempo cairia para '
                + nt(AC.tempoMax(globA, 3), 3) + ' h.' }
        ]);
        return {
          glob: { v: sg(glob, 4), u: 'dB' },
          globA: { v: sg(globA, 4), u: 'dB(A)', classe: globA >= 85 ? 'alerta' : 'ok' },
          globC: { v: sg(globC, 4), u: 'dB(C)' },
          domin: { v: AC.rotBanda(AC.bandas[iDom]) + ' Hz' },
          tmax: { v: globA >= 85 ? sg(tmax, 3) : '—', u: globA >= 85 ? 'h' : '' },
          dose: { v: sg(100 * dose, 3), u: '%', classe: dose > 1 ? 'alerta' : 'ok' }
        };
      }
    });
  }

  /* =========================================================================
     3 · Impedância, reflexão e transmissão
     ========================================================================= */
  function montarInterface() {
    if (!document.getElementById('sim-interface')) return;
    Sim.build('#sim-interface', {
      titulo: '3. Impedância, reflexão e transmissão — o que acontece na interface',
      descricao: 'Quando uma onda plana encontra outro meio, parte volta e parte passa. Quem decide é a impedância característica ρc de cada lado — não a massa específica nem a velocidade isoladamente. O simulador mostra a onda incidente, a refletida, a transmitida e o padrão estacionário que elas formam.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ar para água', desc: 'O caso extremo: quase tudo volta',
          valores: { m1: 'ar', m2: 'agua', A: 1, f: 500, x: 0.5 } },
        { nome: '2 · Água para glicerina', desc: 'Impedâncias próximas: quase tudo passa',
          valores: { m1: 'agua', m2: 'glicerina', A: 1, f: 500, x: 0.5 } },
        { nome: '3 · Ar para um gás mais denso', desc: 'O pulso em duto das listas',
          valores: { m1: 'ar', m2: 'co2', A: 3, f: 500, x: 0.5 } },
        { nome: '4 · Parede rígida', desc: 'Ar contra concreto: onda estacionária',
          valores: { m1: 'ar', m2: 'concreto', A: 1, f: 100, x: 0.486 } },
        { nome: '5 · Casamento quase perfeito', desc: 'Água do mar e água doce',
          valores: { m1: 'mar', m2: 'agua', A: 1, f: 1000, x: 0.3 } },
        { nome: '6 · Saindo do aço para o ar', desc: 'A onda fica presa na estrutura',
          valores: { m1: 'aco', m2: 'ar', A: 1, f: 500, x: 0.2 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Os dois meios' },
        { id: 'm1', tipo: 'select', label: 'Meio de origem', valor: 'ar',
          opcoes: AC.meios.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { id: 'm2', tipo: 'select', label: 'Meio de destino', valor: 'agua',
          opcoes: AC.meios.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { tipo: 'titulo', label: 'A onda' },
        { id: 'A', label: 'Amplitude da onda incidente', min: 0.1, max: 20, step: 0.1, valor: 1, unidade: 'Pa' },
        { id: 'f', label: 'Frequência', min: 20, max: 5000, step: 10, valor: 500, unidade: 'Hz' },
        { id: 'x', label: 'Ponto de medida antes da interface', min: 0, max: 3, step: 0.002, valor: 0.5, unidade: 'm' }
      ],
      graficos: [
        { id: 'campo', titulo: 'Amplitude da pressão ao longo do eixo', xlabel: 'Posição (m) — a interface está em 0',
          ylabel: 'Amplitude (Pa)', aspect: 0.5, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'z1', label: 'Impedância do meio 1' },
        { id: 'z2', label: 'Impedância do meio 2' },
        { id: 'R', label: 'Coeficiente de reflexão' },
        { id: 'T', label: 'Transmissão em pressão' },
        { id: 'TL', label: 'Perda na transmissão' },
        { id: 'swr', label: 'Nível no ponto de medida' }
      ],
      formulas: [
        { g: 'Impedância' },
        { tex: 'z = \\rho_0 c', d: 'impedância característica, rayl (Pa·s/m)', destaque: true },
        { g: 'Na interface' },
        { tex: 'R = \\frac{z_2 - z_1}{z_2 + z_1}', d: 'razão entre pressão refletida e incidente', destaque: true },
        { tex: 'T = \\frac{2z_2}{z_2 + z_1} = 1 + R', d: 'a pressão transmitida pode ser MAIOR que a incidente' },
        { tex: '\\tau = \\frac{4z_1z_2}{(z_1+z_2)^2}', d: 'fração da intensidade que passa' },
        { tex: 'TL = -10\\log_{10}\\tau', d: 'perda na transmissão, em dB' },
        { g: 'Campo resultante' },
        { tex: '|p(x)| = A\\sqrt{1 + R^2 + 2R\\cos 2kx}', d: 'onda estacionária antes da interface' },
        { tex: 'k = \\omega/c = 2\\pi f/c', d: 'número de onda' }
      ],
      nota: 'Tudo aqui vale para incidência normal e meios sem perdas. Com incidência oblíqua aparecem o ângulo crítico e a refração — e com meios dissipativos a impedância passa a ser complexa.',
      calcular: function (p, ctx) {
        var m1 = AC.meio(p.m1), m2 = AC.meio(p.m2);
        var z1 = m1.rho * m1.c, z2 = m2.rho * m2.c;
        var R = (z2 - z1) / (z2 + z1);
        var T = 2 * z2 / (z2 + z1);
        var tau = 4 * z1 * z2 / Math.pow(z1 + z2, 2);
        var TL = -10 * L10(tau);
        var k1 = 2 * Math.PI * p.f / m1.c, k2 = 2 * Math.PI * p.f / m2.c;
        var A = p.A;

        function env(x) {   /* envoltória da onda estacionária, x > 0 antes da interface */
          return A * Math.sqrt(1 + R * R + 2 * R * Math.cos(2 * k1 * x));
        }
        var pMed = env(p.x);
        var npsMed = AC.nivel(pMed / Math.SQRT2);

        var g = ctx.plot('campo').clear();
        var lam1 = m1.c / p.f, lam2 = m2.c / p.f;
        var xmin = -Math.min(3, 2.5 * lam2), xmax = Math.min(3, 2.5 * lam1);
        var xs1 = [], ys1 = [], ysn = [], i, x;
        for (i = 0; i <= 160; i++) {
          x = xmax * i / 160;
          xs1.push(-x); ys1.push(env(x)); ysn.push(-env(x));
        }
        xs1.reverse(); ys1.reverse(); ysn.reverse();
        /* o eixo é desenhado com a interface em 0 e o meio 1 à esquerda */
        var xe = xs1.map(function (v) { return v; });
        g.line(xe, ys1, { color: cor(0), width: 2.2, label: 'envoltória no meio 1 (incidente + refletida)' });
        g.line(xe, ysn, { color: cor(0), width: 2.2 });
        var xs2 = [], ys2 = [], yn2 = [];
        for (i = 0; i <= 80; i++) {
          x = -xmin * i / 80;
          xs2.push(x); ys2.push(A * Math.abs(T)); yn2.push(-A * Math.abs(T));
        }
        g.line(xs2, ys2, { color: cor(3), width: 2.2, label: 'transmitida (progressiva, amplitude constante)' });
        g.line(xs2, yn2, { color: cor(3), width: 2.2 });
        g.vline(0, { color: cor(5), width: 2, text: m1.nome + '  |  ' + m2.nome });
        g.line([-p.x, -p.x], [-pMed, pMed], { color: cor(1), width: 1.6, dash: [5, 4] });
        g.marker(-p.x, pMed, nt(pMed, 3) + ' Pa', { color: cor(1) });
        g.hline(A, { color: cor(2), width: 1, dash: [3, 3], text: 'incidente A = ' + nt(A, 3) + ' Pa' });
        g.setLimits([-xmax, -xmin], [-A * Math.max(1 + Math.abs(R), Math.abs(T)) * 1.25,
                                      A * Math.max(1 + Math.abs(R), Math.abs(T)) * 1.25]);
        g.draw();

        var maxE = A * (1 + Math.abs(R)), minE = A * Math.abs(1 - Math.abs(R));
        ctx.setPassos([
          { t: '① Quem decide é a impedância',
            tex: 'z_1 = ' + nt(m1.rho, 4) + ' \\times ' + nt(m1.c, 4) + ' = ' + nt(z1, 4) + '\\ \\text{rayl}',
            texSub: 'z_2 = ' + nt(m2.rho, 4) + ' \\times ' + nt(m2.c, 4) + ' = ' + nt(z2, 4) + '\\ \\text{rayl}',
            obs: 'A razão entre as impedâncias é ' + nt(z2 / z1, 3) + '. '
              + (Math.abs(L10(z2 / z1)) > 1.5
                ? 'Com impedâncias tão diferentes, a interface se comporta quase como uma parede: o som volta.'
                : Math.abs(L10(z2 / z1)) < 0.2
                  ? 'Impedâncias próximas: a interface é quase transparente ao som.'
                  : 'Diferença moderada: parte volta, parte passa.') },
          { t: '② Reflexão e transmissão',
            tex: 'R = \\frac{' + nt(z2, 4) + ' - ' + nt(z1, 4) + '}{' + nt(z2, 4) + ' + ' + nt(z1, 4) + '} = ' + nt(R, 4),
            texSub: 'T = 1 + R = ' + nt(T, 4),
            obs: (R > 0
              ? 'R positivo: a onda refletida volta em fase, e a pressão na interface sobe para ' + nt(A * T, 3) + ' Pa — '
                + 'maior que a incidente. Não há violação de energia: a velocidade de partícula cai na mesma proporção.'
              : 'R negativo: a onda refletida volta invertida, e a pressão na interface cai para ' + nt(A * T, 3) + ' Pa. '
                + 'É o que acontece ao sair para um meio mais "mole".') },
          { t: '③ Quanta energia passa',
            tex: '\\tau = \\frac{4z_1z_2}{(z_1+z_2)^2} = ' + nt(tau, 4) + ' \\quad\\Rightarrow\\quad TL = ' + nt(TL, 3) + '\\ \\text{dB}',
            obs: 'Passa ' + nt(100 * tau, 3) + ' % da intensidade. '
              + (TL > 20 ? 'Mais de 20 dB de perda: na prática, a onda não atravessa.'
                : TL < 1 ? 'Menos de 1 dB: a interface praticamente não existe para o som.'
                  : 'Perda moderada.') },
          { t: '④ O padrão estacionário',
            texSub: '|p|_{max} = A(1+|R|) = ' + nt(maxE, 3) + '\\ \\text{Pa} \\qquad |p|_{min} = ' + nt(minE, 3) + '\\ \\text{Pa}',
            obs: 'A soma da incidente com a refletida cria ventres e nós espaçados de λ/2 = '
              + nt(lam1 / 2, 3) + ' m. No ponto de medida, a ' + nt(p.x, 3) + ' m da interface, a amplitude é '
              + nt(pMed, 3) + ' Pa, o que dá ' + nt(npsMed, 4) + ' dB. Andar meio comprimento de onda muda o nível medido — '
              + 'é por isso que, numa sala com modos, mover a cabeça muda o que se ouve.' }
        ]);
        return {
          z1: { v: sg(z1, 4), u: 'rayl' },
          z2: { v: sg(z2, 4), u: 'rayl' },
          R: { v: sg(R, 4) },
          T: { v: sg(T, 4) },
          TL: { v: sg(TL, 3), u: 'dB', classe: TL > 10 ? 'alerta' : 'ok' },
          swr: { v: sg(npsMed, 4), u: 'dB' }
        };
      }
    });
  }

  /* =========================================================================
     4 · Reverberação e campo sonoro em salas
     ========================================================================= */
  function montarSala() {
    if (!document.getElementById('sim-sala')) return;
    Sim.build('#sim-sala', {
      titulo: '4. Reverberação e campo sonoro — projetar uma sala',
      descricao: 'Dentro de uma sala, o som que chega ao ouvinte é a soma do campo direto, que cai com a distância, e do campo reverberante, que é o mesmo em toda parte. O simulador calcula o tempo de reverberação por banda, a distância crítica e o nível resultante, a partir das dimensões e dos acabamentos.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Sala da lista', desc: '5 × 7 × 4 m com acabamentos dados',
          valores: { Lx: 7, Ly: 5, Lz: 4, par: 'reboco', teto: 'forro', piso: 'carpete', W: 0.1, Q: 2, r: 3 } },
        { nome: '2 · Sala nua de concreto', desc: 'Reverberação insuportável',
          valores: { Lx: 7, Ly: 5, Lz: 4, par: 'concreto', teto: 'concreto', piso: 'concreto', W: 0.1, Q: 2, r: 3 } },
        { nome: '3 · Sala de aula tratada', desc: 'Forro absorvente resolve a maior parte',
          valores: { Lx: 9, Ly: 7, Lz: 3.2, par: 'reboco', teto: 'forro', piso: 'carpete', W: 0.05, Q: 2, r: 5 } },
        { nome: '4 · Galpão industrial', desc: 'Volume grande e nada de absorção',
          valores: { Lx: 30, Ly: 20, Lz: 8, par: 'concreto', teto: 'aco', piso: 'concreto', W: 1, Q: 2, r: 10 } },
        { nome: '5 · Estúdio', desc: 'Lã mineral nas paredes: campo seco',
          valores: { Lx: 6, Ly: 4.5, Lz: 3, par: 'la', teto: 'la', piso: 'madeira', W: 0.01, Q: 1, r: 2 } },
        { nome: '6 · Sala de concerto', desc: 'Volume grande com plateia ocupada',
          valores: { Lx: 40, Ly: 24, Lz: 15, par: 'madeira', teto: 'reboco', piso: 'plateia', W: 0.5, Q: 2, r: 20 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Geometria' },
        { id: 'Lx', label: 'Comprimento', min: 2, max: 60, step: 0.5, valor: 7, unidade: 'm' },
        { id: 'Ly', label: 'Largura', min: 2, max: 40, step: 0.5, valor: 5, unidade: 'm' },
        { id: 'Lz', label: 'Pé-direito', min: 2, max: 20, step: 0.1, valor: 4, unidade: 'm' },
        { tipo: 'titulo', label: 'Acabamentos' },
        { id: 'par', tipo: 'select', label: 'Paredes', valor: 'reboco',
          opcoes: AC.absorventes.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { id: 'teto', tipo: 'select', label: 'Teto', valor: 'forro',
          opcoes: AC.absorventes.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { id: 'piso', tipo: 'select', label: 'Piso', valor: 'carpete',
          opcoes: AC.absorventes.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { tipo: 'titulo', label: 'Fonte e receptor' },
        { id: 'W', label: 'Potência acústica da fonte', min: 0.0001, max: 5, step: 0.0001, valor: 0.1, unidade: 'W' },
        { id: 'Q', tipo: 'select', label: 'Diretividade', valor: 2,
          opcoes: [{ v: 1, t: 'Q = 1 · suspensa' }, { v: 2, t: 'Q = 2 · no piso' },
                   { v: 4, t: 'Q = 4 · piso e parede' }, { v: 8, t: 'Q = 8 · no canto' }] },
        { id: 'r', label: 'Distância fonte-receptor', min: 0.5, max: 40, step: 0.5, valor: 3, unidade: 'm' }
      ],
      graficos: [
        { id: 'trev', titulo: 'Tempo de reverberação por banda', ylabel: 'T₆₀ (s)', aspect: 0.4, legendPos: 'topright' },
        { id: 'campo', titulo: 'Nível × distância: direto, reverberante e total', xlabel: 'Distância (m)',
          ylabel: 'NPS (dB)', xlog: true, aspect: 0.42, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'vol', label: 'Volume' },
        { id: 'sup', label: 'Superfície total' },
        { id: 'alfa', label: 'Absorção média a 500 Hz' },
        { id: 't500', label: 'T₆₀ a 500 Hz (Sabine)' },
        { id: 'rc', label: 'Distância crítica' },
        { id: 'nps', label: 'NPS no receptor' }
      ],
      formulas: [
        { g: 'Absorção e reverberação' },
        { tex: 'A = \\sum_i S_i\\,\\alpha_i \\qquad \\bar\\alpha = A/S', d: 'área de absorção equivalente, em m² sabine', destaque: true },
        { tex: 'T_{60} = \\frac{0{,}161\\,V}{A}', d: 'fórmula de Sabine — vale para ᾱ pequeno', destaque: true },
        { tex: 'T_{60} = \\frac{0{,}161\\,V}{-S\\ln(1-\\bar\\alpha)}', d: 'Eyring — correta em salas muito absorventes' },
        { tex: 'T_{60} = \\frac{0{,}161\\,V}{A + 4mV}', d: 'com a absorção do ar, que pesa acima de 2 kHz' },
        { g: 'Campo direto e reverberante' },
        { tex: 'L_p = L_W + 10\\log_{10}\\left(\\frac{Q}{4\\pi r^2} + \\frac{4}{R}\\right)', d: 'os dois campos somados', destaque: true },
        { tex: 'R = \\frac{S\\bar\\alpha}{1-\\bar\\alpha}', d: 'constante da sala, em m²' },
        { tex: 'r_c = \\sqrt{\\frac{QR}{16\\pi}}', d: 'distância crítica: onde os dois campos se igualam' },
        { g: 'Limite de validade' },
        { tex: 'f_S \\approx 2000\\sqrt{T_{60}/V}', d: 'frequência de Schroeder: abaixo dela a sala é modal' }
      ],
      nota: 'A teoria estatística usada aqui supõe campo difuso e distribuição uniforme de absorção. Abaixo da frequência de Schroeder a sala responde por modos discretos, e nenhuma fórmula de reverberação se aplica.',
      calcular: function (p, ctx) {
        var V = p.Lx * p.Ly * p.Lz;
        var Spar = 2 * (p.Lx + p.Ly) * p.Lz, Steto = p.Lx * p.Ly, Spiso = Steto;
        var S = Spar + Steto + Spiso;
        var mp = AC.absorvente(p.par), mt = AC.absorvente(p.teto), mpi = AC.absorvente(p.piso);
        var Q = +p.Q;
        var LW = 10 * L10(p.W / AC.WREF);

        var dados = AC.bandasSala.map(function (b, i) {
          var A = Spar * mp.a[i] + Steto * mt.a[i] + Spiso * mpi.a[i];
          var al = A / S;
          var tSab = 0.161 * V / A;
          var tEyr = 0.161 * V / (-S * Math.log(1 - Math.min(al, 0.999)));
          return { f: b, A: A, al: al, tSab: tSab, tEyr: tEyr, R: A / (1 - Math.min(al, 0.999)) };
        });
        var d500 = dados[2];
        var Rsala = d500.R;
        var rc = Math.sqrt(Q * Rsala / (16 * Math.PI));
        function nivelEm(r) {
          return LW + 10 * L10(Q / (4 * Math.PI * r * r) + 4 / Rsala);
        }
        var Lp = nivelEm(p.r);
        var fS = 2000 * Math.sqrt(d500.tSab / V);
        var BR = (dados[0].tSab + dados[1].tSab) / (dados[2].tSab + dados[3].tSab);

        var g = ctx.plot('trev').clear();
        g.o.xcat = AC.bandasSala.map(function (b, i) { return { v: i, label: AC.rotBanda(b) }; });
        dados.forEach(function (d, i) {
          g.bars([i - 0.18], [d.tSab], { color: cor(0), barw: 0.34 });
          g.bars([i + 0.18], [d.tEyr], { color: cor(3), barw: 0.34 });
        });
        g.line([-0.6, 5.4], [0, 0], { color: cor(0), width: 0, label: 'Sabine' });
        g.line([-0.6, 5.4], [0, 0], { color: cor(3), width: 0, label: 'Eyring' });
        g.setLimits([-0.6, 5.4], [0, Math.max.apply(null, dados.map(function (d) { return d.tSab; })) * 1.2]);
        g.draw();

        var gc = ctx.plot('campo').clear();
        var xs = [], yt = [], yd = [], yr = [], i, r;
        var rmax = Math.max(p.r * 2, Math.sqrt(p.Lx * p.Lx + p.Ly * p.Ly));
        for (i = 0; i <= 120; i++) {
          r = 0.3 * Math.pow(rmax / 0.3, i / 120);
          xs.push(L10(r));
          yt.push(nivelEm(r));
          yd.push(LW + 10 * L10(Q / (4 * Math.PI * r * r)));
          yr.push(LW + 10 * L10(4 / Rsala));
        }
        gc.line(xs, yd, { color: cor(2), width: 1.6, dash: [6, 4], label: 'campo direto' });
        gc.line(xs, yr, { color: cor(3), width: 1.6, dash: [6, 4], label: 'campo reverberante' });
        gc.line(xs, yt, { color: cor(0), width: 2.4, label: 'total' });
        gc.vline(L10(rc), { color: cor(1), width: 1.6, text: 'r_c = ' + nt(rc, 3) + ' m' });
        gc.marker(L10(p.r), Lp, nt(Lp, 4) + ' dB', { color: cor(1) });
        gc.setLimits([L10(0.3), L10(rmax)], null);
        gc.draw();

        ctx.setPassos([
          { t: '① Somar a absorção',
            tex: 'A = S_{par}\\alpha_{par} + S_{teto}\\alpha_{teto} + S_{piso}\\alpha_{piso}',
            texSub: 'A_{500} = ' + nt(Spar, 4) + '(' + nt(mp.a[2], 3) + ') + ' + nt(Steto, 4) + '(' + nt(mt.a[2], 3) + ') + '
              + nt(Spiso, 4) + '(' + nt(mpi.a[2], 3) + ') = ' + nt(d500.A, 4) + '\\ \\text{m}^2',
            obs: 'A absorção se mede em metros quadrados: um m² sabine é uma janela aberta de 1 m², que absorve tudo. '
              + 'A sala tem ' + nt(S, 4) + ' m² de superfície e ' + nt(d500.A, 4) + ' m² de absorção — ᾱ = ' + nt(d500.al, 3) + '.' },
          { t: '② O tempo de reverberação',
            tex: 'T_{60} = \\frac{0{,}161 \\times ' + nt(V, 4) + '}{' + nt(d500.A, 4) + '} = ' + nt(d500.tSab, 3) + '\\ \\text{s}',
            texSub: 'T_{Eyring} = ' + nt(d500.tEyr, 3) + '\\ \\text{s}',
            obs: d500.al > 0.25
              ? 'Com ᾱ = ' + nt(d500.al, 3) + ', Sabine superestima: ele supõe absorção pequena. A diferença para Eyring é de '
                + nt(100 * (d500.tSab / d500.tEyr - 1), 3) + ' %, e em sala muito tratada deve-se usar Eyring.'
              : 'Com ᾱ = ' + nt(d500.al, 3) + ', pequeno, as duas fórmulas praticamente coincidem — a diferença é de '
                + nt(100 * (d500.tSab / d500.tEyr - 1), 2) + ' %.' },
          { t: '③ Direto ou reverberante',
            tex: 'R = \\frac{S\\bar\\alpha}{1-\\bar\\alpha} = ' + nt(Rsala, 4) + '\\ \\text{m}^2 \\qquad r_c = \\sqrt{\\frac{QR}{16\\pi}} = ' + nt(rc, 3) + '\\ \\text{m}',
            obs: 'Além de ' + nt(rc, 3) + ' m, o campo reverberante domina e o nível para de cair: afastar-se mais da máquina '
              + 'não adianta nada. ' + (p.r > rc
                ? 'O receptor, a ' + nt(p.r, 3) + ' m, já está nessa região — só tratamento absorvente reduz o nível ali.'
                : 'O receptor, a ' + nt(p.r, 3) + ' m, ainda está no campo direto — afastá-lo ou enclausurar a fonte funciona.') },
          { t: '④ Verificar os limites',
            tex: 'f_S \\approx 2000\\sqrt{T/V} = ' + nt(fS, 3) + '\\ \\text{Hz}',
            obs: 'Abaixo de ' + nt(fS, 3) + ' Hz a sala não tem campo difuso: ela responde por modos isolados, e nem Sabine '
              + 'nem Eyring valem. A razão de baixos é BR = ' + nt(BR, 3) + '; '
              + (BR > 1.2 ? 'acima de 1,2, a sala é "quente", boa para música romântica e ruim para fala.'
                : BR < 0.9 ? 'abaixo de 0,9, a sala é "seca" nos graves, o que favorece inteligibilidade e prejudica música.'
                  : 'entre 0,9 e 1,2, equilibrada.') }
        ]);
        return {
          vol: { v: sg(V, 4), u: 'm³' },
          sup: { v: sg(S, 4), u: 'm²' },
          alfa: { v: sg(d500.al, 3) },
          t500: { v: sg(d500.tSab, 3), u: 's', classe: d500.tSab > 1.5 ? 'alerta' : 'ok' },
          rc: { v: sg(rc, 3), u: 'm' },
          nps: { v: sg(Lp, 4), u: 'dB', classe: Lp > 85 ? 'alerta' : 'ok' }
        };
      }
    });
  }

  /* =========================================================================
     5 · Isolamento e ruído ocupacional
     ========================================================================= */
  function montarIsolamento() {
    if (!document.getElementById('sim-isolamento')) return;
    Sim.build('#sim-isolamento', {
      titulo: '5. Isolamento — a lei da massa e o furo que estraga tudo',
      descricao: 'Isolar é impedir o som de passar de um ambiente a outro, e quem faz isso é a massa por unidade de área. O simulador traça a perda de transmissão da parede, mostra o vale da coincidência e calcula o efeito de uma abertura — que costuma dominar o resultado.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Parede de concreto', desc: 'Massa alta: isolamento alto',
          valores: { mat: 'concreto', h: 100, Spar: 12, fresta: 0, Lfonte: 95 } },
        { nome: '2 · A mesma parede com 0,1 % de fresta', desc: 'O resultado despenca',
          valores: { mat: 'concreto', h: 100, Spar: 12, fresta: 0.1, Lfonte: 95 } },
        { nome: '3 · Vidro simples 6 mm', desc: 'Coincidência bem no meio da fala',
          valores: { mat: 'vidro', h: 6, Spar: 4, fresta: 0, Lfonte: 80 } },
        { nome: '4 · Vidro laminado 12 mm', desc: 'Dobrar a espessura dá +6 dB',
          valores: { mat: 'vidro', h: 12, Spar: 4, fresta: 0, Lfonte: 80 } },
        { nome: '5 · Enclausuramento em chapa fina', desc: 'Pouca massa: pouco isolamento',
          valores: { mat: 'aco', h: 1.5, Spar: 6, fresta: 0, Lfonte: 100 } },
        { nome: '6 · Divisória de gesso', desc: 'Solução leve para escritório',
          valores: { mat: 'gesso', h: 25, Spar: 10, fresta: 0.02, Lfonte: 75 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A parede' },
        { id: 'mat', tipo: 'select', label: 'Material', valor: 'concreto',
          opcoes: AC.paredes.map(function (m) { return { v: m.id, t: m.nome }; }) },
        { id: 'h', label: 'Espessura', min: 1, max: 300, step: 0.5, valor: 100, unidade: 'mm' },
        { id: 'Spar', label: 'Área da parede', min: 1, max: 60, step: 0.5, valor: 12, unidade: 'm²' },
        { id: 'fresta', label: 'Abertura (fresta, passagem de duto)', min: 0, max: 2, step: 0.01, valor: 0, unidade: '% da área' },
        { tipo: 'titulo', label: 'O ruído' },
        { id: 'Lfonte', label: 'Nível no lado da fonte', min: 50, max: 120, step: 1, valor: 95, unidade: 'dB' }
      ],
      graficos: [
        { id: 'tl', titulo: 'Perda de transmissão × frequência', xlabel: 'Frequência (Hz)', ylabel: 'TL (dB)',
          xlog: true, aspect: 0.46, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'massa', label: 'Massa por área' },
        { id: 'fc', label: 'Frequência de coincidência' },
        { id: 'tl500', label: 'TL real a 500 Hz' },
        { id: 'tlcomp', label: 'TL com a abertura' },
        { id: 'perda', label: 'Quanto a abertura custa' },
        { id: 'recep', label: 'Nível do outro lado' }
      ],
      formulas: [
        { g: 'Lei da massa' },
        { tex: 'TL = 20\\log_{10}(m\\,f) - 47', d: 'm em kg/m², f em Hz — incidência de campo', destaque: true },
        { tex: '\\text{dobrar } m \\text{ ou } f \\;\\Rightarrow\\; +6\\ \\text{dB}', d: 'a regra prática que decide o projeto' },
        { g: 'Coincidência' },
        { tex: 'f_c = \\frac{c_0^2}{1{,}8\\,c_L\\,h}', d: 'onde a onda de flexão casa com a onda no ar', destaque: true },
        { tex: 'c_L = \\sqrt{\\frac{E}{\\rho(1-\\nu^2)}}', d: 'velocidade das ondas longitudinais na placa' },
        { g: 'Parede composta' },
        { tex: '\\bar\\tau = \\frac{\\sum S_i\\,10^{-TL_i/10}}{\\sum S_i}', d: 'médias em transmissão, nunca em dB', destaque: true },
        { tex: 'TL_{comp} = -10\\log_{10}\\bar\\tau', d: 'o elo fraco domina' },
        { g: 'Do outro lado' },
        { tex: 'L_2 = L_1 - TL + 10\\log_{10}\\frac{S}{A_2}', d: 'nível no ambiente receptor' }
      ],
      nota: 'A lei da massa descreve uma parede simples e homogênea. Paredes duplas com caixa de ar e material absorvente ultrapassam largamente esse limite acima da frequência de ressonância massa-mola-massa — e é por isso que divisórias leves de alto desempenho existem.',
      calcular: function (p, ctx) {
        var mat = AC.parede(p.mat);
        var m = mat.rho * p.h / 1000;
        var coin = AC.fCoincidencia(mat, p.h);
        var Sab = p.Spar * p.fresta / 100;
        var Spl = p.Spar - Sab;

        function tlComp(f) {
          var tlp = AC.tl(mat, p.h, f);
          if (Sab <= 0) return tlp;
          return AC.tlComposta([{ S: Spl, TL: tlp }, { S: Sab, TL: 0 }]);
        }
        var tl500 = AC.tl(mat, p.h, 500);
        var tlc500 = tlComp(500);

        var g = ctx.plot('tl').clear();
        var xs = [], ym = [], yr = [], yc = [], i, f;
        for (i = 0; i <= 120; i++) {
          f = 50 * Math.pow(10000 / 50, i / 120);
          xs.push(L10(f));
          ym.push(Math.max(0, AC.leiDaMassa(m, f)));
          yr.push(AC.tl(mat, p.h, f));
          yc.push(tlComp(f));
        }
        g.line(xs, ym, { color: cor(5), width: 1.4, dash: [4, 4], label: 'lei da massa pura' });
        g.line(xs, yr, { color: cor(0), width: 2.4, label: 'parede real (com coincidência)' });
        if (Sab > 0) g.line(xs, yc, { color: cor(1), width: 2.2, label: 'com abertura de ' + nt(p.fresta, 3) + ' %' });
        g.vline(L10(coin.fc), { color: cor(3), width: 1.6, dash: [5, 4], text: 'f_c = ' + nt(coin.fc, 3) + ' Hz' });
        AC.bandas.forEach(function (b) {
          if (b >= 50 && b <= 10000) g.marker(L10(b), tlComp(b), '', { color: cor(2), r: 3 });
        });
        g.setLimits([L10(50), L10(10000)], [0, Math.max(60, Math.max.apply(null, yr) * 1.15)]);
        g.draw();

        var L2 = p.Lfonte - tlc500;
        ctx.setPassos([
          { t: '① Tudo depende da massa por área',
            tex: 'm = \\rho\\,h = ' + nt(mat.rho, 4) + ' \\times ' + nt(p.h / 1000, 4) + ' = ' + nt(m, 4) + '\\ \\text{kg/m}^2',
            obs: 'Nem rigidez, nem espessura isolada: o que isola é a inércia da parede. Um painel de chumbo de 1,5 mm '
              + '(17 kg/m²) isola mais que um compensado de 18 mm (12 kg/m²) — e ocupa dez vezes menos espaço.' },
          { t: '② A lei da massa',
            tex: 'TL_{500} = 20\\log_{10}(' + nt(m, 4) + ' \\times 500) - 47 = ' + nt(AC.leiDaMassa(m, 500), 3) + '\\ \\text{dB}',
            obs: 'Cada dobro de massa ou de frequência acrescenta 6 dB. Note a consequência dura: para ganhar 10 dB é preciso '
              + 'triplicar a massa. Isolamento sai caro em quilos, e é por isso que parede dupla — que foge da lei da massa — existe.' },
          { t: '③ O vale da coincidência',
            tex: 'c_L = ' + nt(coin.cL, 4) + '\\ \\text{m/s} \\qquad f_c = \\frac{343^2}{1{,}8 \\times ' + nt(coin.cL, 4)
              + ' \\times ' + nt(p.h / 1000, 4) + '} = ' + nt(coin.fc, 3) + '\\ \\text{Hz}',
            obs: 'Em f_c o comprimento da onda de flexão na placa iguala o da onda no ar, a placa "acompanha" o som e deixa passar: '
              + 'a perda cai até 10 dB. '
              + (coin.fc > 300 && coin.fc < 4000
                ? 'Aqui ela cai bem dentro da faixa da fala — é o defeito clássico do vidro simples e da chapa fina.'
                : coin.fc <= 300
                  ? 'Aqui ela fica nos graves, abaixo da faixa crítica: parede pesada tem coincidência baixa, o que é bom.'
                  : 'Aqui ela fica acima da faixa de interesse, o que é a situação confortável.') },
          { t: '④ A abertura domina',
            tex: Sab > 0
              ? '\\bar\\tau = \\frac{' + nt(Spl, 4) + '\\times10^{-' + nt(tl500, 3) + '/10} + ' + nt(Sab, 4) + '\\times 1}{' + nt(p.Spar, 4) + '}'
              : '\\text{sem abertura: } TL = ' + nt(tl500, 3) + '\\ \\text{dB}',
            texSub: 'TL_{comp} = ' + nt(tlc500, 3) + '\\ \\text{dB}',
            obs: Sab > 0
              ? 'Uma abertura de apenas ' + nt(p.fresta, 3) + ' % da área derruba a perda de ' + nt(tl500, 3) + ' para '
                + nt(tlc500, 3) + ' dB — ' + nt(tl500 - tlc500, 3) + ' dB jogados fora. Como a média é feita em transmissão, '
                + 'e não em decibéis, o elo fraco manda: o limite de uma parede com 1 % de abertura é 20 dB, '
                + 'por mais pesada que ela seja. Vedar frestas é o investimento de melhor retorno em isolamento.'
              : 'Sem abertura, a parede entrega os ' + nt(tl500, 3) + ' dB do material. Experimente abrir 0,1 % de fresta '
                + 'e veja o que acontece: é a lição mais importante deste simulador.' }
        ]);
        return {
          massa: { v: sg(m, 4), u: 'kg/m²' },
          fc: { v: sg(coin.fc, 3), u: 'Hz', classe: (coin.fc > 300 && coin.fc < 4000) ? 'alerta' : 'ok' },
          tl500: { v: sg(tl500, 3), u: 'dB' },
          tlcomp: { v: sg(tlc500, 3), u: 'dB', classe: Sab > 0 ? 'alerta' : 'ok' },
          perda: { v: sg(tl500 - tlc500, 3), u: 'dB', classe: (tl500 - tlc500) > 5 ? 'alerta' : 'ok' },
          recep: { v: sg(L2, 4), u: 'dB', classe: L2 > 85 ? 'alerta' : 'ok' }
        };
      }
    });
  }

  function iniciar() {
    montarNiveis();
    montarEspectro();
    montarInterface();
    montarSala();
    montarIsolamento();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

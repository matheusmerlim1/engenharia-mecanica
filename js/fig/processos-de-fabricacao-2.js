/* ============================================================
   Figuras ilustrativas de Processos de Fabricação II
   Materiais não metálicos, massa molar, reologia, plastômetro,
   rosca, ponto de operação, inchamento, filme soprado, ciclo de
   injeção, molde, garrafa PET, rotomoldagem, compósitos e FDM.
   Usa a biblioteca window.P2 (js/sim/processos-de-fabricacao-2.js).
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.P2) return;
  var F = window.Figura.criar, P2 = window.P2;
  var fx = function (v, n) { n = n == null ? 1 : n; return v.toLocaleString('pt-BR', { maximumFractionDigits: n }); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var log10 = function (v) { return Math.log(Math.max(v, 1e-12)) / Math.LN10; };
  var TAU = 2 * Math.PI;
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function pot10(e) { return '10' + String(e).split('').map(function (c) { return SUP[c]; }).join(''); }
  function rotEixo(v) {
    if (v >= 1e4) return pot10(Math.round(log10(v)));
    if (v >= 1) return fx(v, 0);
    if (v >= 0.01) return fx(v, 2);
    return pot10(Math.round(log10(v)));
  }

  /* eixos log-log desenhados à mão, para as figuras de reologia */
  function eixosLog(g, x0, x1, y0, y1, dx0, dx1, dy0, dy1, rx, ry) {
    var X = function (v) { return x0 + (x1 - x0) * (log10(v) - dx0) / (dx1 - dx0); };
    var Y = function (v) { return y0 + (y1 - y0) * (log10(v) - dy0) / (dy1 - dy0); };
    var e;
    for (e = Math.ceil(dx0); e <= Math.floor(dx1); e++) {
      var xx = X(Math.pow(10, e));
      g.linha(xx, y0, xx, y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
      g.txt(pot10(e), xx, y0 - 0.32, { cor: 'fraco', tam: 10 });
    }
    for (e = Math.ceil(dy0); e <= Math.floor(dy1); e++) {
      var yy = Y(Math.pow(10, e));
      g.linha(x0, yy, x1, yy, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
      g.txt(pot10(e), x0 - 0.18, yy, { cor: 'fraco', tam: 10, alin: 'dir' });
    }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
    g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    if (rx) g.txt(rx, (x0 + x1) / 2, y0 - 0.82, { cor: 'suave', tam: 10.5 });
    if (ry) g.txt(ry, x0 - 0.95, (y0 + y1) / 2, { cor: 'suave', tam: 10.5 });
    return { X: X, Y: Y };
  }

  /* observações do painel: quebra cada texto na largura disponível e desce linha a linha */
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) {
      var linhas = [], atual = '';
      ctx.save();
      ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      it.t.split(' ').forEach(function (pal) {
        var prova = atual ? atual + ' ' + pal : pal;
        if (atual && ctx.measureText(prova).width > larg) { linhas.push(atual); atual = pal; }
        else atual = prova;
      });
      linhas.push(atual);
      ctx.restore();
      linhas.forEach(function (l) {
        g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' });
        y -= passo;
      });
    });
  }

  /* caixa com título, para os mapas e quadros */
  function caixa(g, x, y, w, h, titulo, cor, aceso) {
    g.ret(x, y, w, h, { cor: aceso ? cor : 'borda', larg: aceso ? 2 : 1,
      preenche: aceso ? cor : 'baixo', alfa: aceso ? 0.18 : 0.5 });
    g.txt(titulo, x + w / 2, y + h / 2, { cor: aceso ? cor : 'fraco',
      tam: 10.5, negrito: !!aceso });
  }

  /* ---------- 1.1 — as classes de materiais e seus processos ---------- */
  var CLASSES = [
    { nome: 'Termoplástico', lig: 'covalente na cadeia, secundária entre cadeias',
      estado: 'funde e volta a solidificar quantas vezes quiser',
      procs: ['extrusão', 'injeção', 'sopro', 'termoformagem', 'rotomoldagem', 'calandragem'],
      ex: 'PE, PP, PS, PVC, PET, PA', cor: 's1' },
    { nome: 'Termorrígido', lig: 'ligações cruzadas após a cura',
      estado: 'cura uma vez; depois degrada em vez de fundir',
      procs: ['compressão', 'transferência', 'fundição (casting)', 'RIM'],
      ex: 'poliéster, epóxi, fenólica, PU', cor: 's3' },
    { nome: 'Cerâmico', lig: 'iônica e covalente',
      estado: 'conformado em pó ou pasta e depois queimado',
      procs: ['prensagem', 'extrusão de massa plástica', 'colagem de barbotina', 'sinterização'],
      ex: 'óxidos, nitretos, carbetos, argilas', cor: 's5' },
    { nome: 'Compósito', lig: 'reforço + matriz, com interface',
      estado: 'a peça e o material nascem no mesmo processo',
      procs: ['laminação manual', 'projeção', 'RTM', 'pultrusão', 'enrolamento', 'autoclave'],
      ex: 'GFRP, CFRP, SMC', cor: 's6' }
  ];
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Cada classe de material não metálico aceita um conjunto próprio de processos, e a razão está na ligação química: o que funde e volta a solidificar pode ser extrudado e injetado; o que cura uma única vez é prensado; o que não funde é conformado em pó e queimado.',
    vista: [-0.4, 13.4, -0.6, 7.4],
    altura: 480,
    controles: [
      { id: 'c', rot: 'Classe: 1 termoplástico · 2 termorrígido · 3 cerâmico · 4 compósito',
        min: 1, max: 4, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var k = CLASSES[Math.round(p.c) - 1];
      g.txt('Materiais não metálicos', 6.5, 7.0, { cor: 'texto', tam: 13, negrito: true });
      /* as quatro classes como abas */
      CLASSES.forEach(function (c, i) {
        caixa(g, 0.3 + i * 3.25, 5.5, 3, 0.95, c.nome, c.cor, c === k);
      });
      /* painel da classe escolhida */
      g.ret(0.3, 2.6, 12.7, 2.6, { cor: k.cor, larg: 1.6, preenche: 'baixo', alfa: 0.35 });
      g.txt('Ligação química', 0.7, 4.85, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(k.lig, 0.7, 4.45, { cor: 'texto', tam: 11.5, alin: 'esq' });
      g.txt('Diante do calor', 0.7, 3.95, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(k.estado, 0.7, 3.55, { cor: 'texto', tam: 11.5, alin: 'esq' });
      g.txt('Exemplos', 0.7, 3.05, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(k.ex, 2.2, 3.05, { cor: k.cor, tam: 11.5, alin: 'esq', negrito: true });
      /* processos */
      g.txt('Processos de fabricação característicos', 6.65, 2.15, { cor: 'suave', tam: 11 });
      var n = k.procs.length, larg = Math.min(2.6, 12.7 / n - 0.15);
      k.procs.forEach(function (pr, i) {
        var x = 6.65 - (n * (larg + 0.15) - 0.15) / 2 + i * (larg + 0.15);
        caixa(g, x, 0.9, larg, 0.95, pr, k.cor, true);
      });
      g.txt('o processo não é escolhido pelo formato da peça, e sim pelo que a ligação química permite fazer com o material',
        6.65, 0.3, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 2.1 — distribuição de massa molar ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A massa molar de um polímero comercial não é um número, é uma distribuição. A média numérica Mn conta moléculas; a ponderal Mw dá peso às grandes. A razão entre as duas é a dispersão, e é ela que diz o quanto a resina é homogênea.',
    vista: [-1.2, 12.8, -1.2, 7.2],
    altura: 480,
    controles: [
      { id: 'mn', rot: 'Massa molar numérica média', min: 10000, max: 200000, val: 41000, passo: 1000, un: 'g/mol' },
      { id: 'pd', rot: 'Dispersão Mw/Mn', min: 1.05, max: 8, val: 2.86, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var sig2 = Math.log(p.pd), sig = Math.sqrt(sig2);
      var mu = Math.log(p.mn) - sig2 / 2;
      var Mn = Math.exp(mu + sig2 / 2), Mw = Math.exp(mu + 3 * sig2 / 2);
      var Mz = Math.exp(mu + 5 * sig2 / 2);
      var x0 = 0.6, x1 = 8.4, y0 = 1.2, y1 = 6.2;
      var d0 = 3, d1 = 6.6;
      var X = function (M) { return x0 + (x1 - x0) * (log10(M) - d0) / (d1 - d0); };
      var e, i;
      for (e = d0; e <= d1; e++) {
        var xx = X(Math.pow(10, e));
        g.linha(xx, y0, xx, y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        g.txt(pot10(e), xx, y0 - 0.33, { cor: 'fraco', tam: 10 });
      }
      g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
      g.txt('massa molar (g/mol, escala log)', (x0 + x1) / 2, y0 - 0.85, { cor: 'suave', tam: 10.5 });
      /* distribuição em número e em massa (log-normal) */
      var ptsN = [], ptsW = [], maxN = 0, maxW = 0, vals = [];
      for (i = 0; i <= 160; i++) {
        var lm = d0 + (d1 - d0) * i / 160;
        var M = Math.pow(10, lm);
        var z = (Math.log(M) - mu) / sig;
        var fn = Math.exp(-z * z / 2);                 /* número, em ln M */
        var fw = fn * M / Math.exp(mu + sig2 / 2);     /* ponderada pela massa */
        vals.push([X(M), fn, fw]);
        if (fn > maxN) maxN = fn;
        if (fw > maxW) maxW = fw;
      }
      vals.forEach(function (v) {
        ptsN.push([v[0], y0 + (y1 - y0) * 0.82 * v[1] / maxN]);
        ptsW.push([v[0], y0 + (y1 - y0) * 0.82 * v[2] / maxW]);
      });
      g.caminho(ptsN.concat([[x1, y0], [x0, y0]]), { cor: null, preenche: 's1', alfa: 0.16, fechar: true });
      g.caminho(ptsN, { cor: 's1', larg: 2.2 });
      g.caminho(ptsW, { cor: 's3', larg: 2.2, tracejado: [7, 4] });
      g.txt('em número', X(Mn) * 0.7 + x0 * 0.3, y1 - 0.2, { cor: 's1', tam: 10.5, negrito: true });
      g.txt('em massa', X(Mw) + 0.9, y1 - 0.7, { cor: 's3', tam: 10.5, negrito: true });
      /* marcas de Mn, Mw, Mz */
      [[Mn, 'Mn', 's1'], [Mw, 'Mw', 's3'], [Mz, 'Mz', 's5']].forEach(function (m, idx) {
        var xx = X(m[0]);
        g.linha(xx, y0, xx, y1 - 0.9 + idx * 0.05, { cor: m[2], larg: 1.6 });
        g.txt(m[1] + ' = ' + fx(m[0] / 1000, 1) + 'k', xx, y1 - 0.72 + idx * 0.42,
          { cor: m[2], tam: 10.5, negrito: true, fundo: true });
      });
      /* painel numérico */
      var xr = 9.1;
      g.txt('Dispersão', xr, 6.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['Mn (numérica)', fx(Mn, 0) + ' g/mol'],
       ['Mw (ponderal)', fx(Mw, 0) + ' g/mol'],
       ['Mz', fx(Mz, 0) + ' g/mol'],
       ['Mw/Mn', fx(p.pd, 2)],
       ['grau de polimerização (PE)', fx(Mn / 28.05, 0)],
       ['grau de polimerização (PS)', fx(Mn / 104.15, 0)]].forEach(function (r, idx) {
        g.txt(r[0], xr, 5.6 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(r[1], 12.7, 5.6 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      var tipo = p.pd < 1.6 ? 'policondensação (≈ 2)' : p.pd < 5.5 ? 'poliadição (2 a 5)'
        : p.pd < 30 ? 'coordenação (8 a 30)' : 'ramificado';
      notas(g, xr, 1.95, 12.7, [
        { t: 'compatível com: ' + tipo, cor: 's6' },
        { t: 'dispersão estreita → fusão mais definida' },
        { t: 'dispersão larga → frações leves facilitam o processo' }
      ]);
      g.txt('as frações pequenas lubrificam o escoamento; as grandes dão resistência do fundido',
        6.3, -0.75, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 3.1 — a curva de viscosidade ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'A curva de viscosidade de um fundido tem três regiões: um platô newtoniano em taxas baixíssimas, a região pseudoplástica onde quase todo processo acontece, e um segundo platô em taxas altíssimas. A lei da potência descreve a região do meio — a que interessa.',
    vista: [-1.4, 12.6, -1.3, 7.2],
    altura: 480,
    controles: [
      { id: 'n', rot: 'Índice de pseudoplasticidade n', min: 0.2, max: 1, val: 0.45, passo: 0.01 },
      { id: 'eta0', rot: 'Viscosidade do platô newtoniano', min: 1000, max: 100000, val: 30000, passo: 500, un: 'Pa·s' },
      { id: 'gam', rot: 'Taxa de cisalhamento de interesse', min: 0.1, max: 100000, val: 150, passo: 0.1, un: '1/s' }
    ],
    desenhar: function (g, p) {
      var ax = eixosLog(g, 0.7, 8.6, 1.0, 6.3, -2, 6, 0, 5.2,
        'taxa de cisalhamento γ̇ (1/s)', 'viscosidade η (Pa·s)');
      /* modelo de Carreau: platô, lei da potência e segundo platô */
      var lam = 1 / 0.5, etaInf = Math.max(5, p.eta0 * 1e-4);
      function eta(gam) {
        var c = p.eta0 / Math.pow(1 + Math.pow(lam * gam, 2), (1 - p.n) / 2);
        return Math.max(c, etaInf);
      }
      var pts = [], i;
      for (i = 0; i <= 200; i++) {
        var lg = -2 + 8 * i / 200, gg = Math.pow(10, lg);
        pts.push([ax.X(gg), ax.Y(eta(gg))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      /* a reta da lei da potência, estendida */
      var K = eta(100) / Math.pow(100, p.n - 1);
      var r1 = [ax.X(1), ax.Y(K * Math.pow(1, p.n - 1))];
      var r2 = [ax.X(1e5), ax.Y(Math.max(K * Math.pow(1e5, p.n - 1), 1))];
      g.caminho([r1, r2], { cor: 's3', larg: 1.4, tracejado: [7, 5] });
      g.txt('η = K γ̇ⁿ⁻¹  (inclinação n − 1 = ' + fx(p.n - 1, 2) + ')', ax.X(300), ax.Y(eta(300)) + 0.55,
        { cor: 's3', tam: 10.5, fundo: true });
      /* regiões */
      g.linha(ax.X(0.2), 1.0, ax.X(0.2), 6.3, { cor: 'borda', larg: 1, tracejado: [2, 4] });
      g.linha(ax.X(2e4), 1.0, ax.X(2e4), 6.3, { cor: 'borda', larg: 1, tracejado: [2, 4] });
      g.txt('① platô\nnewtoniano', ax.X(0.03), 5.9, { cor: 'fraco', tam: 10 });
      g.txt('② região pseudoplástica', ax.X(60), 6.0, { cor: 'suave', tam: 10.5 });
      g.txt('③ 2º platô', ax.X(1e5), 5.9, { cor: 'fraco', tam: 10 });
      /* janelas de processo */
      P2.janelas.forEach(function (w, idx) {
        var xa = ax.X(w.a), xb = ax.X(w.b);
        var yy = 1.25 + idx * 0.42;
        g.linha(xa, yy, xb, yy, { cor: 's' + (idx + 4), larg: 3.2, cap: 'butt' });
        g.txt(w.nome, xb + 0.12, yy, { cor: 's' + (idx + 4), tam: 9.5, alin: 'esq' });
      });
      /* ponto de interesse */
      var eg = eta(p.gam);
      g.circ(ax.X(p.gam), ax.Y(eg), 0.12, { preenche: 'erro', cor: null });
      g.linha(ax.X(p.gam), 1.0, ax.X(p.gam), ax.Y(eg), { cor: 'erro', larg: 1, tracejado: [4, 4] });
      /* painel */
      var xr = 9.3;
      g.txt('No ponto escolhido', xr, 6.3, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      [['taxa γ̇', fx(p.gam, p.gam < 10 ? 2 : 0) + ' 1/s'],
       ['viscosidade η', fx(eg, 0) + ' Pa·s'],
       ['tensão τ = ηγ̇', fx(eg * p.gam / 1000, 1) + ' kPa'],
       ['K (na região da lei)', fx(K, 0) + ' Pa·sⁿ'],
       ['η₀/η', fx(p.eta0 / eg, 1) + ' ×'],
       ['classificação', p.n < 0.99 ? 'pseudoplástico' : 'newtoniano']].forEach(function (r, idx) {
        g.txt(r[0], xr, 5.65 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(r[1], 12.4, 5.65 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      g.txt('n = 1 newtoniano', xr, 2.0, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('n < 1 pseudoplástico (todo fundido)', xr, 1.58, { cor: 's1', tam: 10, alin: 'esq' });
      g.txt('n > 1 dilatante (raro, pastas)', xr, 1.16, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('quanto menor n, mais a viscosidade cai ao acelerar a rosca — é o que torna o processo possível',
        6, -0.85, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 4.1 — o plastômetro de índice de fluidez ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'O plastômetro aplica uma tensão fixa — 19,4 kPa com a carga de 2,16 kg — e mede quanta massa escoa em dez minutos. Daí sai um único ponto da curva de viscosidade, numa taxa de cisalhamento baixíssima: útil para comparar lotes, insuficiente para dimensionar matriz.',
    vista: [-0.6, 13.4, -0.8, 8.2],
    altura: 480,
    controles: [
      { id: 'mfi', rot: 'Índice de fluidez medido', min: 0.1, max: 30, val: 2, passo: 0.05, un: 'g/10 min' },
      { id: 'carga', rot: 'Carga: 1 → 2,16 kg · 2 → 5 kg · 3 → 10 kg · 4 → 21,6 kg', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'rho', rot: 'Massa específica do fundido', min: 0.7, max: 1.4, val: 0.76, passo: 0.01, un: 'g/cm³' }
    ],
    desenhar: function (g, p) {
      var cargas = [2.16, 5, 10, 21.6];
      var W = cargas[Math.round(p.carga) - 1];
      var r = P2.deMFI(p.mfi, p.rho, W);
      /* o equipamento, em corte */
      var cx = 2.6;
      /* peso */
      var hw = 0.5 + 0.5 * Math.log(W / 2.16 + 1);
      g.ret(cx - 1.1, 7.0 - hw * 0.5, 2.2, hw, { cor: 'forte', larg: 1.4, preenche: 'suave', alfa: 0.35 });
      g.txt(fx(W, 2) + ' kg', cx, 7.0, { cor: 'texto', tam: 11.5, negrito: true });
      /* pistão */
      g.ret(cx - 0.18, 3.4, 0.36, 3.2, { cor: 'forte', larg: 1.2, preenche: 'baixo', alfa: 0.7 });
      g.txt('pistão 9,55 mm', cx + 0.3, 6.1, { cor: 'fraco', tam: 10, alin: 'esq' });
      /* barril aquecido */
      g.ret(cx - 0.75, 1.3, 1.5, 2.3, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.4 });
      g.ret(cx - 0.52, 1.5, 1.04, 1.9, { cor: null, preenche: 's3', alfa: 0.3 });
      g.txt('190 °C', cx, 2.4, { cor: 's3', tam: 11, negrito: true });
      /* resistências */
      [0, 1, 2].forEach(function (i) {
        g.linha(cx - 0.75, 1.7 + i * 0.6, cx - 1.05, 1.7 + i * 0.6, { cor: 'erro', larg: 2 });
        g.linha(cx + 0.75, 1.7 + i * 0.6, cx + 1.05, 1.7 + i * 0.6, { cor: 'erro', larg: 2 });
      });
      /* capilar */
      g.ret(cx - 0.11, 0.75, 0.22, 0.55, { cor: 'forte', larg: 1.2, preenche: 'fundo' });
      g.txt('capilar 2,095 × 8,0 mm', cx + 0.45, 0.95, { cor: 'fraco', tam: 9.5, alin: 'esq' });
      /* o fio extrudado, com comprimento proporcional ao MFI */
      var Lf = lim(0.15 + Math.log(1 + p.mfi) * 0.22, 0.15, 0.85);
      g.caminho([[cx, 0.75], [cx, 0.75 - Lf], [cx + 0.18, 0.72 - Lf]], { cor: 's1', larg: 3 });
      g.txt('corte a cada ' + fx(600 / Math.max(p.mfi, 0.1) * 0.3, 0) + ' s para pesar 0,3 g',
        cx + 0.5, 0.2, { cor: 's1', tam: 9.5, alin: 'esq' });
      /* o caminho dos números */
      var xr = 6.0;
      g.txt('Do ensaio à viscosidade', xr, 7.8, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      var linhas = [
        ['tensão na parede  τ = (F/A)·R/2L', fx(r.tau / 1000, 2) + ' kPa'],
        ['vazão  Q = (MFI/600)/ρ', fx(r.Q * 1e9, 2) + ' mm³/s'],
        ['taxa aparente  γ̇ = 4Q/πR³', fx(r.gam, 2) + ' 1/s'],
        ['viscosidade aparente  η = τ/γ̇', fx(r.eta, 0) + ' Pa·s'],
        ['correção de Rabinowitsch', fx(P2.rabinowitsch(0.45), 2) + ' ×'],
        ['massa molar relativa (∝ MFI⁻¹ᐟ³·⁴)', fx(Math.pow(2 / Math.max(p.mfi, 0.1), 1 / 3.4), 2) + ' ×']
      ];
      linhas.forEach(function (l, i) {
        g.txt(l[0], xr, 7.1 - i * 0.62, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(l[1], 13.1, 7.1 - i * 0.62, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      /* a barra das taxas: onde o ensaio cai e onde os processos trabalham */
      var bx0 = 6.0, bx1 = 13.1, by = 2.2;
      var BX = function (v) { return bx0 + (bx1 - bx0) * (log10(lim(v, 0.1, 1e5)) + 1) / 6; };
      g.linha(bx0, by, bx1, by, { cor: 'forte', larg: 1.4 });
      [0.1, 1, 10, 100, 1000, 1e4, 1e5].forEach(function (v) {
        g.linha(BX(v), by, BX(v), by - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(rotEixo(v), BX(v), by - 0.42, { cor: 'fraco', tam: 9.5 });
      });
      g.txt('taxa de cisalhamento (1/s)', (bx0 + bx1) / 2, by - 0.85, { cor: 'suave', tam: 10 });
      P2.janelas.forEach(function (w, i) {
        g.linha(BX(w.a), by + 0.35 + i * 0.4, BX(w.b), by + 0.35 + i * 0.4,
          { cor: 's' + (i + 4), larg: 3.4, cap: 'butt' });
        var cabe = BX(w.b) < 11.6;
        g.txt(w.nome, cabe ? BX(w.b) + 0.12 : BX(w.a) - 0.12, by + 0.35 + i * 0.4,
          { cor: 's' + (i + 4), tam: 9.5, alin: cabe ? 'esq' : 'dir' });
      });
      g.seta(BX(r.gam), by + 0.95, 0, -0.55, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.txt('o ensaio mede aqui', BX(r.gam), by + 1.15, { cor: 'erro', tam: 10, negrito: true, fundo: true });
      g.txt('o MFI é um reômetro de um ponto: compara resinas, não substitui a curva completa',
        6.5, -0.5, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 5.1 — a rosca e suas três zonas ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A rosca tem três zonas: alimentação com canal fundo, compressão com canal decrescente e dosagem com canal raso e constante. A razão entre as duas alturas é a razão de compressão, e é ela que compacta o material, expulsa o ar e termina a fusão.',
    vista: [-0.6, 13.4, -0.6, 7.4],
    altura: 480,
    controles: [
      { id: 'D', rot: 'Diâmetro da rosca', min: 25, max: 120, val: 45, passo: 1, un: 'mm' },
      { id: 'hi', rot: 'Altura do canal na alimentação', min: 2, max: 20, val: 5.4, passo: 0.1, un: 'mm' },
      { id: 'hf', rot: 'Altura do canal na dosagem', min: 0.8, max: 10, val: 2.25, passo: 0.05, un: 'mm' },
      { id: 'ld', rot: 'Relação L/D', min: 16, max: 36, val: 30, passo: 1 }
    ],
    desenhar: function (g, p) {
      var x0 = 0.9, x1 = 12.6, yc = 4.2;
      var esc = 0.16;                        /* mm de canal → unidades do desenho */
      var hi = p.hi * esc, hf = p.hf * esc;
      var Lali = 0.27, Lcomp = 0.33;         /* frações de L */
      var xa = x0 + (x1 - x0) * Lali, xb = xa + (x1 - x0) * Lcomp;
      /* canhão */
      g.ret(x0 - 0.35, yc - 1.75, (x1 - x0) + 0.7, 3.5, { cor: 'forte', larg: 1.8, preenche: 'baixo', alfa: 0.3 });
      /* eixo da rosca */
      var raio = 1.05;
      function hcanal(x) {
        if (x <= xa) return hi;
        if (x >= xb) return hf;
        return hi + (hf - hi) * (x - xa) / (xb - xa);
      }
      var cima = [], baixo = [], i;
      for (i = 0; i <= 120; i++) {
        var xx = x0 + (x1 - x0) * i / 120;
        cima.push([xx, yc + raio - hcanal(xx)]);
        baixo.push([xx, yc - raio + hcanal(xx)]);
      }
      g.caminho(cima.concat(baixo.slice().reverse()), { cor: 's1', larg: 1.6, preenche: 's1', alfa: 0.25, fechar: true });
      /* filetes */
      var passo = (x1 - x0) / (p.ld * 0.62);
      for (i = 0; x0 + i * passo < x1; i++) {
        var xf = x0 + i * passo;
        g.linha(xf, yc + raio, xf, yc + raio - hcanal(xf), { cor: 's1', larg: 2.2 });
        g.linha(xf, yc - raio, xf, yc - raio + hcanal(xf), { cor: 's1', larg: 2.2 });
      }
      /* zonas */
      [[x0, xa, 'alimentação', 's4'], [xa, xb, 'compressão', 's3'], [xb, x1, 'dosagem', 's6']].forEach(function (z) {
        g.linha(z[0], yc + 2.05, z[1], yc + 2.05, { cor: z[3], larg: 3, cap: 'butt' });
        g.txt(z[2], (z[0] + z[1]) / 2, yc + 2.35, { cor: z[3], tam: 11, negrito: true });
      });
      g.cota(x0, yc + raio + 0.1, x0, yc + raio - hi - 0.1, '', { cor: 'fraco' });
      g.txt('hi = ' + fx(p.hi, 2) + ' mm', x0 + 0.1, yc + raio - hi / 2, { cor: 'fraco', tam: 10, alin: 'esq', fundo: true });
      g.txt('hf = ' + fx(p.hf, 2) + ' mm', x1 - 0.1, yc + raio - hf / 2 - 0.3, { cor: 'fraco', tam: 10, alin: 'dir', fundo: true });
      /* alimentação e matriz */
      g.ret(x0 + 0.2, yc + 1.9, 0.9, 0.55, { cor: null, preenche: 'fundo', alfa: 0.01 });
      g.caminho([[x0 + 0.1, yc + 3.0], [x0 + 1.1, yc + 3.0], [x0 + 0.75, yc + 1.78], [x0 + 0.45, yc + 1.78]],
        { cor: 'suave', larg: 1.4, fechar: true });
      g.txt('funil', x0 + 1.3, yc + 2.85, { cor: 'suave', tam: 10, alin: 'esq' });
      g.ret(x1 + 0.35, yc - 1.0, 0.5, 2.0, { cor: 'forte', larg: 1.4, preenche: 'suave', alfa: 0.3 });
      g.txt('matriz', x1 + 0.75, yc + 1.3, { cor: 'suave', tam: 10, alin: 'dir' });
      /* números */
      var rc = p.hi / p.hf, phi = P2.anguloHelice(1, 1) * 180 / Math.PI;
      var nums = [
        ['razão de compressão hi/hf', fx(rc, 2) + ':1'],
        ['ângulo de hélice (p = D)', fx(phi, 2) + '°'],
        ['comprimento total L', fx(p.ld * p.D, 0) + ' mm'],
        ['hi em diâmetros', fx(p.hi / p.D, 3) + ' D'],
        ['hf em diâmetros', fx(p.hf / p.D, 3) + ' D']
      ];
      nums.forEach(function (l, idx) {
        g.txt(l[0], 0.6, 1.55 - idx * 0.42, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 6.3, 1.55 - idx * 0.42, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      var aviso = (rc < 1.1 || rc > 5) ? 'fora da faixa usual (1,1:1 a 5:1)'
        : (rc < 2 ? 'razão baixa: típica de PVC e resinas sensíveis'
          : rc > 4 ? 'razão alta: PEBD e PP de alta produtividade' : 'faixa típica (valor usual 2,25:1)');
      g.txt(aviso, 7.0, 1.55, { cor: (rc < 1.1 || rc > 5) ? 'erro' : 's6', tam: 10.5, alin: 'esq' });
      g.txt('hf pequeno dá cisalhamento alto e vazão estável; hi grande garante alimentação',
        7.0, 1.05, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('L/D de 16:1 a 32:1 — quanto maior, melhor a mistura e maior o gasto de energia',
        7.0, 0.6, { cor: 'fraco', tam: 10, alin: 'esq' });
    }
  });

  /* ---------- 6.1 — ponto de operação ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'A rosca entrega uma vazão que quase não depende da pressão; a matriz passa uma vazão proporcional à pressão. O cruzamento das duas curvas é o ponto de operação. Mudar a rotação sobe a reta da rosca; fechar a matriz deita a curva dela.',
    vista: [-1.5, 12.5, -1.2, 7.2],
    altura: 480,
    controles: [
      { id: 'rpm', rot: 'Rotação da rosca', min: 10, max: 200, val: 90, passo: 5, un: 'rpm' },
      { id: 'gap', rot: 'Abertura da matriz anular', min: 0.6, max: 4, val: 2, passo: 0.05, un: 'mm' },
      { id: 'hf', rot: 'Altura do canal na dosagem', min: 1, max: 8, val: 2.25, passo: 0.05, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var D = 0.045, e = 0.0045, rho = 750, Ldos = 10 * D;
      var phi = P2.anguloHelice(D, D);
      var hf = p.hf / 1000;
      var K = 22000, n = 0.5;                        /* lei da potência da resina */
      var Km = P2.Kanel(0.05, p.gap / 1000, 0.03);
      var x0 = 0.9, x1 = 8.8, y0 = 1.1, y1 = 6.4;
      var dPmax = 30e6, Qmax = 70;                   /* MPa e kg/h */
      var X = function (dp) { return x0 + (x1 - x0) * lim(dp / dPmax, 0, 1); };
      var Y = function (q) { return y0 + (y1 - y0) * lim(q / Qmax, 0, 1); };
      var i, j;
      for (i = 0; i <= 6; i++) {
        g.linha(X(i * 5e6), y0, X(i * 5e6), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        g.txt(fx(i * 5, 0), X(i * 5e6), y0 - 0.33, { cor: 'fraco', tam: 10 });
      }
      for (i = 0; i <= 7; i++) {
        g.linha(x0, Y(i * 10), x1, Y(i * 10), { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        g.txt(fx(i * 10, 0), x0 - 0.18, Y(i * 10), { cor: 'fraco', tam: 10, alin: 'dir' });
      }
      g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
      g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
      g.txt('pressão na matriz ΔP (MPa)', (x0 + x1) / 2, y0 - 0.82, { cor: 'suave', tam: 10.5 });
      g.txt('vazão (kg/h)', x0 - 1.0, (y0 + y1) / 2, { cor: 'suave', tam: 10.5 });
      /* retas da rosca para três rotações */
      function roscaQ(rpm, dp) {
        var N = rpm / 60;
        var Qd = P2.vazaoArraste(D, N, hf, phi, e);
        var etac = P2.eta(K, n, P2.gamCanal(D, N, hf));
        var B = P2.coefPressao(D, hf, phi, Ldos);
        return Math.max(0, Qd - B * dp / etac) * rho * 3600;
      }
      [p.rpm * 0.5, p.rpm, p.rpm * 1.5].forEach(function (rpm, idx) {
        var pts = [];
        for (i = 0; i <= 40; i++) {
          var dp = dPmax * i / 40;
          pts.push([X(dp), Y(roscaQ(rpm, dp))]);
        }
        g.caminho(pts, { cor: 's1', larg: idx === 1 ? 2.6 : 1.3,
          tracejado: idx === 1 ? null : [6, 4], alfaLinha: idx === 1 ? 1 : 0.75 });
        g.txt(fx(rpm, 0) + ' rpm', x1 - 0.1, Y(roscaQ(rpm, dPmax)) + 0.22,
          { cor: 's1', tam: 10, alin: 'dir', fundo: true });
      });
      /* curva da matriz: Q = Km ΔP/η(γ̇(Q)) */
      function matrizQ(dp) {
        var Q = 1e-6;
        for (j = 0; j < 30; j++) {
          var et = P2.eta(K, n, P2.gamAnel(Math.max(Q, 1e-9), 0.05, p.gap / 1000));
          Q = Km * dp / et;
        }
        return Q * rho * 3600;
      }
      var ptsM = [];
      for (i = 0; i <= 60; i++) {
        var dp2 = dPmax * i / 60;
        ptsM.push([X(dp2), Y(matrizQ(dp2))]);
      }
      g.caminho(ptsM, { cor: 's3', larg: 2.4 });
      g.txt('matriz: abertura ' + fx(p.gap, 2) + ' mm', X(dPmax * 0.62), Y(matrizQ(dPmax * 0.62)) + 0.4,
        { cor: 's3', tam: 10.5, fundo: true });
      /* ponto de operação */
      var dpOp = 0, Qop = 0;
      var N = p.rpm / 60;
      var Qd = P2.vazaoArraste(D, N, hf, phi, e);
      var etac = P2.eta(K, n, P2.gamCanal(D, N, hf));
      var B = P2.coefPressao(D, hf, phi, Ldos);
      var Q = Qd;
      for (j = 0; j < 60; j++) {
        var etam = P2.eta(K, n, P2.gamAnel(Math.max(Q, 1e-9), 0.05, p.gap / 1000));
        dpOp = Qd / (Km / etam + B / etac);
        Q = Km * dpOp / etam;
      }
      Qop = Q * rho * 3600;
      g.circ(X(dpOp), Y(Qop), 0.14, { preenche: 'erro', cor: null });
      g.linha(X(dpOp), y0, X(dpOp), Y(Qop), { cor: 'erro', larg: 1, tracejado: [4, 4] });
      g.linha(x0, Y(Qop), X(dpOp), Y(Qop), { cor: 'erro', larg: 1, tracejado: [4, 4] });
      g.txt('ponto de operação', X(dpOp) + 0.2, Y(Qop) + 0.35, { cor: 'erro', tam: 10.5, alin: 'esq', negrito: true, fundo: true });
      /* painel */
      var xr = 9.4;
      g.txt('Ponto de operação', xr, 6.3, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      [['vazão de arraste', fx(Qd * rho * 3600, 1) + ' kg/h'],
       ['produção', fx(Qop, 1) + ' kg/h'],
       ['pressão na matriz', fx(dpOp / 1e6, 2) + ' MPa'],
       ['vazão de pressão', fx(100 * (1 - Qop / (Qd * rho * 3600)), 2) + ' %'],
       ['γ̇ no canal', fx(P2.gamCanal(D, N, hf), 0) + ' 1/s'],
       ['γ̇ na matriz', fx(P2.gamAnel(Q, 0.05, p.gap / 1000), 0) + ' 1/s'],
       ['força axial', fx(dpOp * Math.PI * D * D / 4 / 1000, 2) + ' kN']].forEach(function (l, idx) {
        g.txt(l[0], xr, 5.65 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 12.4, 5.65 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      notas(g, xr, 1.9, 12.4, [
        { t: 'a reta da rosca é quase horizontal:', cor: 's1' },
        { t: 'a vazão vem da rotação, a pressão vem da matriz' },
        { t: 'canal fundo inclina a reta e a produção passa a depender da matriz' }
      ]);
      g.txt('extrusora de 45 mm, dosagem de 10D, resina com K = 22 000 Pa·sⁿ e n = 0,5',
        5.5, -0.8, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 7.1 — inchamento do extrudado e drawdown ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'O fundido sai da matriz e incha: a deformação elástica guardada nos canais se recupera fora deles. Depois o puxador afina o perfil antes de ele solidificar. A matriz precisa ser projetada para o produto depois dos dois efeitos, não para a cota de desenho.',
    vista: [-0.6, 13.4, -0.8, 6.8],
    altura: 480,
    controles: [
      { id: 'dd', rot: 'Diâmetro do canal da matriz', min: 1, max: 8, val: 3, passo: 0.1, un: 'mm' },
      { id: 'b', rot: 'Inchamento Dx/Dd', min: 1, max: 2, val: 1.35, passo: 0.01 },
      { id: 'dr', rot: 'Drawdown Dx/Df', min: 1, max: 3, val: 2.03, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var Dx = p.dd * p.b, Df = Dx / p.dr;
      var esc = 0.42;
      var yc = 4.0;
      /* matriz */
      g.ret(0.6, yc - 1.9, 2.6, 3.8, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.35 });
      var hd = p.dd * esc / 2;
      g.caminho([[0.6, yc + 1.2], [2.0, yc + hd], [3.2, yc + hd]], { cor: 'forte', larg: 1.6 });
      g.caminho([[0.6, yc - 1.2], [2.0, yc - hd], [3.2, yc - hd]], { cor: 'forte', larg: 1.6 });
      g.txt('convergência', 1.5, yc + 1.6, { cor: 'fraco', tam: 9.5 });
      g.txt('paralelo e lábios', 2.6, yc - 1.65, { cor: 'fraco', tam: 9.5 });
      g.cota(3.05, yc - hd, 3.05, yc + hd, 'Dd = ' + fx(p.dd, 2) + ' mm', { cor: 's1', dx: 0.0, dy: 0 });
      /* extrudado inchando */
      var hx = Dx * esc / 2;
      var pts1 = [], pts2 = [], i;
      for (i = 0; i <= 40; i++) {
        var t = i / 40, xx = 3.2 + t * 1.8;
        var hh = hd + (hx - hd) * (1 - Math.exp(-3.2 * t));
        pts1.push([xx, yc + hh]); pts2.push([xx, yc - hh]);
      }
      g.caminho(pts1.concat(pts2.slice().reverse()), { cor: 's3', larg: 1.8, preenche: 's3', alfa: 0.2, fechar: true });
      g.cota(5.05, yc - hx, 5.05, yc + hx, 'Dx = ' + fx(Dx, 2) + ' mm', { cor: 's3', dy: 0 });
      g.txt('inchamento', 4.1, Math.min(yc + hx + 0.5, g.vista[3] - 0.2), { cor: 's3', tam: 10, negrito: true });
      /* afinamento até o calibrador */
      var hfm = Df * esc / 2;
      var pts3 = [], pts4 = [];
      for (i = 0; i <= 40; i++) {
        var t2 = i / 40, x2 = 5.0 + t2 * 3.4;
        var h2 = hx + (hfm - hx) * t2 * t2;
        pts3.push([x2, yc + h2]); pts4.push([x2, yc - h2]);
      }
      g.caminho(pts3.concat(pts4.slice().reverse()), { cor: 's6', larg: 1.8, preenche: 's6', alfa: 0.18, fechar: true });
      g.txt('puxamento (drawdown)', 6.7, Math.min(yc + hx + 0.5, g.vista[3] - 0.2), { cor: 's6', tam: 10, negrito: true });
      g.cota(8.45, yc - hfm, 8.45, yc + hfm, 'Df = ' + fx(Df, 2) + ' mm', { cor: 's6', dy: 0 });
      /* calha de resfriamento e puxador */
      g.ret(5.6, yc - 2.5, 2.6, 1.0, { cor: 'info', larg: 1.2, preenche: 'info', alfa: 0.15 });
      g.txt('calha de resfriamento', 6.9, yc - 2.0, { cor: 'info', tam: 9.5 });
      g.circ(9.0, yc + 0.85, 0.45, { cor: 'suave', larg: 1.4 });
      g.circ(9.0, yc - 0.85, 0.45, { cor: 'suave', larg: 1.4 });
      g.arco(9.0, yc + 0.85, 0.3, 0.6, 2.8, { cor: 'suave', ponta: true });
      g.txt('puxador', 9.0, yc + 1.6, { cor: 'suave', tam: 9.5 });
      /* painel */
      var xr = 9.9;
      g.txt('Cotas', xr, 6.2, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      [['canal da matriz Dd', fx(p.dd, 2) + ' mm'],
       ['após o inchamento Dx', fx(Dx, 2) + ' mm'],
       ['razão de áreas Dx²/Dd²', fx(p.b * p.b, 2) + ' ×'],
       ['após o puxamento Df', fx(Df, 2) + ' mm'],
       ['matriz para obter 3,00 mm', fx(3 / p.b * p.dr, 2) + ' mm'],
       ['orientação molecular', p.dr > 1.8 ? 'alta (anisotropia)' : p.dr > 1.3 ? 'moderada' : 'baixa']
      ].forEach(function (l, idx) {
        g.txt(l[0], xr, 5.55 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 13.2, 5.55 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      notas(g, xr, 1.9, 13.3, [
        { t: 'reduzem o inchamento: paralelo mais longo, matriz mais quente e massa molar menor' },
        { t: 'puxar demais orienta a cadeia e deixa o perfil fraco na direção transversal', cor: 'aviso' }
      ]);
      g.txt('a cota do produto é o resultado de dois efeitos opostos: ele incha e depois é esticado',
        6.4, -0.5, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 8.1 — torre de filme soprado ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'No filme soprado a espessura sai de um balanço de massa: a abertura da matriz dividida pelo estiramento transversal (BUR) e pelo longitudinal (DDR). Os dois juntos levam 1,2 mm de fundido a algumas dezenas de micrômetros de filme.',
    vista: [-0.6, 13.4, -0.6, 9.4],
    altura: 480,
    controles: [
      { id: 'mdot', rot: 'Vazão da extrusora', min: 10, max: 200, val: 50, passo: 5, un: 'kg/h' },
      { id: 'bur', rot: 'Razão de sopro BUR', min: 1, max: 4, val: 2.5, passo: 0.05 },
      { id: 'v', rot: 'Velocidade de puxamento', min: 5, max: 120, val: 30, passo: 1, un: 'm/min' }
    ],
    desenhar: function (g, p) {
      var Dd = 0.1, gap = 0.0012, rho = 920;
      var r = P2.filmeSoprado(p.mdot, rho, Dd, gap, p.bur, p.v / 60);
      var cx = 4.2, ybase = 0.9, ytopo = 8.2;
      var esc = 3.0;                                /* m de diâmetro → unidades */
      var rd = Dd / 2 * esc, rf = r.Df / 2 * esc;
      /* matriz */
      g.ret(cx - rd - 0.5, ybase - 0.55, 2 * (rd + 0.5), 0.55, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.4 });
      g.txt('matriz anular ⌀100 mm, abertura 1,2 mm', cx, ybase - 0.85, { cor: 'fraco', tam: 9.5 });
      /* balão: cresce até a linha de névoa e segue cilíndrico */
      var yfrost = ybase + (ytopo - ybase) * 0.42;
      var esq = [], dir = [], i;
      for (i = 0; i <= 50; i++) {
        var t = i / 50, yy = ybase + (yfrost - ybase) * t;
        var rr = rd + (rf - rd) * (1 - Math.cos(t * Math.PI / 2));
        esq.push([cx - rr, yy]); dir.push([cx + rr, yy]);
      }
      var corpo = esq.concat([[cx - rf, ytopo - 1.2]]);
      var corpoD = [[cx + rf, ytopo - 1.2]].concat(dir.slice().reverse());
      g.caminho(corpo.concat(corpoD), { cor: 's1', larg: 2, preenche: 's1', alfa: 0.12, fechar: true });
      /* colapso */
      g.caminho([[cx - rf, ytopo - 1.2], [cx - 0.12, ytopo - 0.1], [cx + 0.12, ytopo - 0.1], [cx + rf, ytopo - 1.2]],
        { cor: 's1', larg: 1.6 });
      /* linha de névoa */
      g.linha(cx - rf - 0.5, yfrost, cx + rf + 0.5, yfrost, { cor: 'aviso', larg: 1.6, tracejado: [6, 4] });
      g.txt('linha de névoa (solidificação)', cx + rf + 0.65, yfrost, { cor: 'aviso', tam: 10, alin: 'esq' });
      /* ar de resfriamento */
      [-1, 1].forEach(function (s) {
        g.seta(cx + s * (rd + 0.8), ybase + 0.3, -s * 0.5, 0.35, { cor: 'info', larg: 1.4, ponta: 0.18 });
      });
      g.txt('ar de resfriamento', cx - rd - 1.0, ybase + 0.95, { cor: 'info', tam: 9.5, alin: 'esq' });
      g.seta(cx, ybase + 0.2, 0, 0.9, { cor: 'info', larg: 1.4, ponta: 0.2 });
      g.txt('ar interno mantém o balão', cx + 0.25, ybase + 1.3, { cor: 'info', tam: 9.5, alin: 'esq' });
      /* rolos */
      g.circ(cx - 0.45, ytopo + 0.25, 0.33, { cor: 'suave', larg: 1.4 });
      g.circ(cx + 0.45, ytopo + 0.25, 0.33, { cor: 'suave', larg: 1.4 });
      g.txt('rolos a ' + fx(p.v, 0) + ' m/min', cx, ytopo + 0.85, { cor: 'suave', tam: 10 });
      /* cotas */
      g.cota(cx - rd, ybase - 0.1, cx + rd, ybase - 0.1, '', { cor: 'fraco' });
      g.txt('Dd', cx, ybase - 0.28, { cor: 'fraco', tam: 9.5, fundo: true });
      g.cota(cx - rf, yfrost + 0.45, cx + rf, yfrost + 0.45, 'Df = ' + fx(r.Df * 1000, 0) + ' mm', { cor: 's1', dy: 0.28 });
      /* painel */
      var xr = 8.4;
      g.txt('Balanço de massa', xr, 8.9, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['vazão volumétrica Q', fx(r.Q * 1e6, 2) + ' cm³/s'],
       ['velocidade na matriz', fx(r.vdie * 60, 2) + ' m/min'],
       ['estiramento longitudinal DDR', fx(r.ddr, 2) + ' ×'],
       ['estiramento transversal BUR', fx(p.bur, 2) + ' ×'],
       ['espessura t = h/(BUR·DDR)', fx(r.t * 1e6, 1) + ' µm'],
       ['gramatura ρt', fx(r.gram * 1000, 1) + ' g/m²'],
       ['largura plana πDf/2', fx(r.layflat * 1000, 0) + ' mm'],
       ['taxa de cisalhamento na matriz', fx(r.gam, 0) + ' 1/s']].forEach(function (l, idx) {
        g.txt(l[0], xr, 8.25 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 13.2, 8.25 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      var bal = r.ddr / p.bur;
      var txt = bal > 1.5 ? 'orientado na direção da máquina: rasga fácil no comprimento'
        : bal < 0.67 ? 'orientado na direção transversal' : 'orientação biaxial equilibrada';
      notas(g, xr, 3.4, 13.3, [
        { t: 'DDR/BUR = ' + fx(bal, 2) + ' → ' + txt, cor: (bal > 1.5 || bal < 0.67) ? 'aviso' : 'ok' },
        { t: 'para afinar o filme sem desequilibrar a orientação, suba o BUR e a velocidade juntos' },
        { t: 'BUR usual de 2:1 a 3:1 · filme abaixo de 100 µm · refile só no filme plano' }
      ]);
    }
  });

  /* ---------- 9.1 — o ciclo de injeção ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'O ciclo de injeção é uma sequência de etapas com tempos muito desiguais: o preenchimento dura cerca de um segundo e o resfriamento, dezenas. A pressão na cavidade sobe no preenchimento, atinge o pico na pressurização, é mantida no recalque e cai durante o resfriamento.',
    vista: [-1.4, 12.6, -1.2, 7.2],
    altura: 480,
    controles: [
      { id: 'tinj', rot: 'Tempo de injeção', min: 0.3, max: 5, val: 1.2, passo: 0.1, un: 's' },
      { id: 'trec', rot: 'Tempo de recalque', min: 1, max: 20, val: 6, passo: 0.5, un: 's' },
      { id: 'tresf', rot: 'Tempo de resfriamento', min: 3, max: 60, val: 16, passo: 1, un: 's' },
      { id: 'pico', rot: 'Pressão de injeção', min: 300, max: 1600, val: 800, passo: 20, un: 'kgf/cm²' }
    ],
    desenhar: function (g, p) {
      var tfech = 1.5, tabre = 2.5;
      var resto = Math.max(0, p.tresf - p.trec);
      var etapas = [
        ['fechamento', tfech, 's4'], ['injeção', p.tinj, 's1'], ['recalque', p.trec, 's3'],
        ['resfriamento', resto, 's6'], ['abertura e extração', tabre, 's5']
      ];
      var total = etapas.reduce(function (a, b) { return a + b[1]; }, 0);
      var x0 = 0.8, x1 = 11.8;
      var X = function (t) { return x0 + (x1 - x0) * t / total; };
      /* barra de etapas */
      var acc = 0;
      etapas.forEach(function (e) {
        var xa = X(acc), xb = X(acc + e[1]);
        g.ret(xa, 5.5, xb - xa, 0.85, { cor: e[2], larg: 1.4, preenche: e[2], alfa: 0.25 });
        if (xb - xa > 1.8) {
          g.txt(e[0], (xa + xb) / 2, 5.92, { cor: e[2], tam: 10, negrito: true });
          g.txt(fx(e[1], 1) + ' s', (xa + xb) / 2, 5.2, { cor: 'fraco', tam: 9.5 });
        } else {
          g.txt(e[0], (xa + xb) / 2, 6.6, { cor: e[2], tam: 9.5 });
          g.txt(fx(e[1], 1) + ' s', (xa + xb) / 2, 5.2, { cor: 'fraco', tam: 9 });
        }
        acc += e[1];
      });
      g.txt('ciclo total = ' + fx(total, 1) + ' s   →   ' + fx(3600 / total, 0) + ' ciclos/h',
        (x0 + x1) / 2, 6.95, { cor: 'texto', tam: 12, negrito: true });
      /* curva de pressão na cavidade */
      var y0 = 1.2, y1 = 4.45;
      var Y = function (pr) { return y0 + (y1 - y0) * lim(pr / 1600, 0, 1); };
      g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
      g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
      [0, 400, 800, 1200, 1600].forEach(function (pr) {
        g.linha(x0, Y(pr), x1, Y(pr), { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        g.txt(fx(pr, 0), x0 - 0.18, Y(pr), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.txt('pressão na cavidade (kgf/cm²)', x0 - 0.25, y1 + 0.3, { cor: 'suave', tam: 10, alin: 'esq' });
      g.txt('tempo', (x0 + x1) / 2, y0 - 0.55, { cor: 'suave', tam: 10 });
      var pts = [], i;
      var t0 = tfech, t1 = tfech + p.tinj, t2 = t1 + p.trec;
      for (i = 0; i <= 200; i++) {
        var t = total * i / 200, pr = 0;
        if (t <= t0) pr = 0;
        else if (t <= t1) pr = p.pico * Math.pow((t - t0) / p.tinj, 1.7);
        else if (t <= t2) pr = p.pico * (0.95 - 0.25 * (t - t1) / p.trec);
        else pr = p.pico * 0.7 * Math.exp(-2.2 * (t - t2) / Math.max(resto + tabre, 0.5));
        pts.push([X(t), Y(pr)]);
      }
      g.caminho(pts, { cor: 'erro', larg: 2.4 });
      g.caminho(pts.concat([[X(total), y0], [x0, y0]]), { cor: null, preenche: 'erro', alfa: 0.1, fechar: true });
      g.linha(X(t1), y0, X(t1), Y(p.pico), { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('pico: comutação para recalque', X(t1) + 0.15, Y(p.pico) + 0.3,
        { cor: 'erro', tam: 10, alin: 'esq', fundo: true });
      g.txt('o molde já está cheio aqui', X(t1) + 0.15, Y(p.pico * 0.2),
        { cor: 'fraco', tam: 9.5, alin: 'esq' });
      g.txt('congelamento do ponto de injeção: a pressão deixa de chegar à peça',
        X(t2) + 0.15, Y(p.pico * 0.5), { cor: 'suave', tam: 9.5, alin: 'esq' });
      g.txt('resfriamento ocupa ' + fx(100 * p.tresf / total, 0) + ' % do ciclo — é onde se ganha produtividade',
        (x0 + x1) / 2, -0.75, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 10.1 — molde, resfriamento e contração ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'A peça esfria de fora para dentro: a casca em contato com o aço congela primeiro e o núcleo contrai depois, preso por ela. Daí saem as tensões residuais, o rechupe nas regiões espessas e o empenamento quando os dois lados do molde não estão na mesma temperatura.',
    vista: [-0.6, 13.4, -0.8, 7.2],
    altura: 480,
    controles: [
      { id: 'h', rot: 'Espessura da parede', min: 1, max: 8, val: 3, passo: 0.1, un: 'mm' },
      { id: 'tw', rot: 'Temperatura do molde', min: 10, max: 100, val: 40, passo: 5, un: '°C' },
      { id: 'dt', rot: 'Desequilíbrio entre os lados', min: 0, max: 40, val: 0, passo: 1, un: '°C' }
    ],
    desenhar: function (g, p) {
      var m = P2.polimero('pp'), al = P2.alfa(m);
      var t = P2.tempoResfriamento(p.h / 1000, al, m.Tm, p.tw, m.Te);
      var esc = 0.5;
      var yc = 4.3, hh = p.h * esc;
      /* placas do molde */
      g.ret(0.8, yc + hh / 2, 6.6, 1.7, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.45 });
      g.ret(0.8, yc - hh / 2 - 1.7, 6.6, 1.7, { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.45 });
      g.txt('placa fixa a ' + fx(p.tw + p.dt / 2, 0) + ' °C', 4.1, Math.min(yc + hh / 2 + 1.35, g.vista[3] - 0.6), { cor: 'suave', tam: 10 });
      g.txt('placa móvel a ' + fx(p.tw - p.dt / 2, 0) + ' °C', 4.1, yc - hh / 2 - 1.35, { cor: 'suave', tam: 10 });
      /* canais de refrigeração */
      [0, 1, 2, 3].forEach(function (i) {
        var xx = 1.6 + i * 1.6;
        g.circ(xx, yc + hh / 2 + 0.75, 0.3, { cor: 'info', larg: 1.3, preenche: 'info', alfa: 0.2 });
        g.circ(xx, yc - hh / 2 - 0.75, 0.3, { cor: 'info', larg: 1.3, preenche: 'info', alfa: 0.2 });
      });
      g.txt('canais de refrigeração (Re > 10 000)', 4.1, Math.min(yc + hh / 2 + 1.75, g.vista[3] - 0.2), { cor: 'info', tam: 9.5 });
      /* a peça: casca congelada e núcleo */
      g.ret(0.8, yc - hh / 2, 6.6, hh, { cor: 's1', larg: 1.4, preenche: 's1', alfa: 0.12 });
      var casca = hh * lim(0.5 - 0.35 * Math.exp(-p.h / 3), 0.1, 0.45) * 0.5;
      g.ret(0.8, yc + hh / 2 - casca, 6.6, casca, { cor: null, preenche: 's4', alfa: 0.35 });
      g.ret(0.8, yc - hh / 2, 6.6, casca, { cor: null, preenche: 's4', alfa: 0.35 });
      g.txt('casca congelada', 2.0, yc + hh / 2 - casca / 2, { cor: 's4', tam: 9.5 });
      g.txt('núcleo ainda fundido — contrai depois, preso pela casca', 4.1, yc, { cor: 's1', tam: 10 });
      g.cota(7.6, yc - hh / 2, 7.6, yc + hh / 2, fx(p.h, 1) + ' mm', { cor: 'fraco', dx: 0.35, dy: 0 });
      /* perfil de temperatura na espessura */
      var px0 = 8.9, px1 = 12.9, py0 = 2.6, py1 = 6.4;
      g.linha(px0, py0, px1, py0, { cor: 'forte', larg: 1.2 });
      g.linha(px0, py0, px0, py1, { cor: 'forte', larg: 1.2 });
      g.txt('T (°C)', px0 - 0.1, py1 + 0.2, { cor: 'suave', tam: 9.5, alin: 'dir' });
      g.txt('posição na espessura', (px0 + px1) / 2, py0 - 0.4, { cor: 'suave', tam: 9.5 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var z = -1 + 2 * i / 60;
        var Tl = p.tw + p.dt / 2 * (-z);
        var T = Tl + (m.Tm - Tl) * Math.cos(z * Math.PI / 2);
        pts.push([px0 + (px1 - px0) * (i / 60), py0 + (py1 - py0) * lim((T - 20) / (m.Tm - 20), 0, 1)]);
      }
      g.caminho(pts, { cor: 'erro', larg: 2.2 });
      g.linha(px0, py0 + (py1 - py0) * (m.Te - 20) / (m.Tm - 20), px1,
        py0 + (py1 - py0) * (m.Te - 20) / (m.Tm - 20), { cor: 'ok', larg: 1.4, tracejado: [5, 4] });
      g.txt('T de extração ' + fx(m.Te, 0) + ' °C', px1, py0 + (py1 - py0) * (m.Te - 20) / (m.Tm - 20) + 0.25,
        { cor: 'ok', tam: 9.5, alin: 'dir' });
      /* números */
      var nums = [
        ['difusividade α do PP', fx(al * 1e8, 2) + '×10⁻⁸ m²/s'],
        ['tempo de resfriamento', fx(t, 1) + ' s'],
        ['se a parede dobrasse', fx(P2.tempoResfriamento(p.h / 500, al, m.Tm, p.tw, m.Te), 1) + ' s'],
        ['contração linear típica', fx(m.s * 100, 1) + ' %'],
        ['empenamento esperado', p.dt > 20 ? 'alto' : p.dt > 8 ? 'moderado' : 'baixo']
      ];
      nums.forEach(function (l, idx) {
        g.txt(l[0], 0.8, 1.9 - idx * 0.44, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 6.6, 1.9 - idx * 0.44, { cor: idx === 4 && p.dt > 8 ? 'aviso' : 'texto',
          tam: 11, alin: 'dir', negrito: true });
      });
      notas(g, 7.2, 1.9, 13.3, [
        { t: 'molde mais quente: menos tensão, mais brilho, mais cristalinidade — e ciclo mais longo' },
        { t: 'molde mais frio: ciclo curto, mas tensões e pós-contração' },
        { t: 'lados em temperaturas diferentes: a peça empena para o lado quente', cor: p.dt > 8 ? 'aviso' : 'fraco' }
      ]);
      g.txt('o tempo de resfriamento cresce com o quadrado da espessura — é o número que governa o ciclo',
        6.4, -0.5, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 11.1 — da pré-forma à garrafa ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'A garrafa PET nasce de uma pré-forma injetada e espessa, reaquecida acima da Tg e estirada em duas direções: para baixo pela haste e para fora pelo ar. O produto das duas razões é o estiramento planar — e é ele que fixa a espessura final e a orientação que dá resistência e barreira.',
    vista: [-0.6, 13.4, -0.8, 9.0],
    altura: 560,
    controles: [
      { id: 'ax', rot: 'Estiramento axial (haste)', min: 1, max: 4, val: 2.6, passo: 0.05 },
      { id: 'rs', rot: 'Razão de sopro (radial)', min: 1, max: 5, val: 2.63, passo: 0.05 },
      { id: 'tp', rot: 'Espessura da pré-forma', min: 1.5, max: 6, val: 3.7, passo: 0.1, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var Dp = 24.6, Lp = 90;
      var Df = Dp * p.rs, Lf = Lp * p.ax;
      var t = p.tp / (p.ax * p.rs);
      var esc = 0.0183;                       /* mm → unidades, a mesma para pré-forma e garrafa */
      var yb = 0.9;
      /* pré-forma */
      var cxp = 2.0, rp = Dp / 2 * esc, hp = Lp * esc;
      g.ret(cxp - rp, yb, 2 * rp, hp, { cor: 's1', larg: 1.8, preenche: 's1', alfa: 0.18 });
      g.ret(cxp - rp - 0.12, yb + hp, 2 * (rp + 0.12), 0.5, { cor: 's1', larg: 1.8, preenche: 's1', alfa: 0.3 });
      g.caminho([[cxp - rp, yb], [cxp, yb - 0.35], [cxp + rp, yb]], { cor: 's1', larg: 1.8 });
      g.txt('pré-forma injetada', cxp, hp + yb + 1.4, { cor: 's1', tam: 11, negrito: true });
      g.txt(fx(Dp, 1) + ' mm · parede ' + fx(p.tp, 1) + ' mm', cxp, hp + yb + 1.08, { cor: 'fraco', tam: 9.5 });
      g.txt('gargalo já na cota final', cxp, yb + hp + 0.76, { cor: 'fraco', tam: 9 });
      /* forno */
      g.ret(4.0, yb + 0.3, 1.5, 2.0, { cor: 'erro', larg: 1.4, preenche: 'erro', alfa: 0.12 });
      g.txt('forno', 4.75, yb + 2.95, { cor: 'erro', tam: 10, negrito: true });
      g.txt('90 a 120 °C', 4.75, yb + 2.6, { cor: 'erro', tam: 9.5 });
      g.txt('acima da Tg (≈ 78 °C),', 4.75, yb + 1.4, { cor: 'fraco', tam: 9 });
      g.txt('abaixo da cristalização', 4.75, yb + 1.05, { cor: 'fraco', tam: 9 });
      /* garrafa */
      var cxg = 8.4, rg = Df / 2 * esc, hg = Lf * esc;
      var pts = [], i;
      for (i = 0; i <= 40; i++) {
        var tt = i / 40, yy = yb + hg * tt;
        var rr = tt < 0.12 ? rg * (0.55 + 0.45 * tt / 0.12)
          : tt > 0.86 ? rg * (1 - 0.72 * (tt - 0.86) / 0.14) : rg;
        pts.push([cxg - rr, yy]);
      }
      var dir = pts.slice().reverse().map(function (q) { return [2 * cxg - q[0], q[1]]; });
      g.caminho(pts.concat(dir), { cor: 's6', larg: 2, preenche: 's6', alfa: 0.14, fechar: true });
      g.ret(cxg - 0.28, yb + hg, 0.56, 0.45, { cor: 's6', larg: 1.8, preenche: 's6', alfa: 0.3 });
      g.txt('garrafa soprada', cxg, yb + hg + 1.2, { cor: 's6', tam: 11, negrito: true });
      g.txt(fx(Df, 1) + ' mm · parede ' + fx(t, 2) + ' mm', cxg, yb + hg + 0.85, { cor: 'fraco', tam: 9.5 });
      /* setas de estiramento */
      g.seta(cxg, yb + hg * 0.5, 0, -hg * 0.42, { cor: 's3', larg: 2, ponta: 0.25, rot: 'axial ' + fx(p.ax, 2) + '×', rotDx: 0.9, rotDy: 0.2 });
      g.seta(cxg, yb + hg * 0.55, rg * 0.85, 0, { cor: 's5', larg: 2, ponta: 0.25 });
      g.seta(cxg, yb + hg * 0.55, -rg * 0.85, 0, { cor: 's5', larg: 2, ponta: 0.25 });
      g.txt('radial ' + fx(p.rs, 2) + '×', cxg, yb + hg * 0.55 + 0.35, { cor: 's5', tam: 10, negrito: true, fundo: true });
      /* painel */
      var xr = 10.4;
      g.txt('Estiramento biaxial', xr, 7.9, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      [['axial (haste)', fx(p.ax, 2) + ' ×'],
       ['radial (ar)', fx(p.rs, 2) + ' ×'],
       ['planar (produto)', fx(p.ax * p.rs, 2) + ' ×'],
       ['parede da pré-forma', fx(p.tp, 2) + ' mm'],
       ['parede da garrafa', fx(t, 3) + ' mm'],
       ['razão de diâmetros', fx(Df / Dp, 2) + ' ×'],
       ['volume aproximado', fx(Math.PI * Math.pow(Df / 2, 2) * Lf * 0.72 / 1e6, 2) + ' L']
      ].forEach(function (l, idx) {
        g.txt(l[0], xr, 7.25 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 13.2, 7.25 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      var pl = p.ax * p.rs;
      var diag = pl < 5 ? 'estiramento baixo: pouca orientação, parede grossa e barreira ruim'
        : pl > 14 ? 'estiramento excessivo: risco de branqueamento por tensão'
          : 'faixa usual (planar de 6 a 12): orientação biaxial que dá resistência e barreira';
      notas(g, xr, 3.3, 13.3, [
        { t: diag, cor: (pl < 5 || pl > 14) ? 'aviso' : 'ok' },
        { t: 'single stage: injeta e sopra na mesma máquina, aproveitando o calor da injeção' },
        { t: 'two stage: a pré-forma viaja e é soprada no envasador' }
      ]);
      g.txt('a secagem do PET antes da injeção é obrigatória: úmido, ele hidrolisa e perde massa molar',
        6.4, -0.5, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 12.1 — rotomoldagem ---------- */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Na rotomoldagem não há pressão: a carga de pó é pesada, o molde gira em dois eixos dentro do forno e o pó adere e funde contra a parede quente. A espessura da peça é a carga dividida pela área interna e pela massa específica — não existe outra forma de controlá-la.',
    vista: [-0.6, 13.4, -0.8, 7.4],
    altura: 480,
    controles: [
      { id: 'a', rot: 'Comprimento da caixa', min: 0.4, max: 2, val: 1.0, passo: 0.05, un: 'm' },
      { id: 'b', rot: 'Largura', min: 0.3, max: 1.5, val: 0.8, passo: 0.05, un: 'm' },
      { id: 'c', rot: 'Altura', min: 0.3, max: 1.5, val: 0.6, passo: 0.05, un: 'm' },
      { id: 'carga', rot: 'Carga de pó', min: 2, max: 60, val: 17.7, passo: 0.1, un: 'kg' }
    ],
    desenhar: function (g, p) {
      var rho = 940;
      var A = 2 * (p.a * p.b + p.a * p.c + p.b * p.c);
      var esp = p.carga / (rho * A) * 1000;
      var V = p.a * p.b * p.c * 1000;
      /* as quatro etapas */
      var etapas = ['carregar o pó', 'girar no forno', 'resfriar girando', 'extrair'];
      etapas.forEach(function (et, i) {
        var cx = 1.9 + i * 3.1, cy = 4.6;
        g.ret(cx - 1.25, cy - 1.15, 2.5, 2.3, { cor: 'borda', larg: 1,
          preenche: i === 1 ? 'erro' : i === 2 ? 'info' : 'baixo', alfa: i === 1 || i === 2 ? 0.1 : 0.4 });
        /* molde */
        g.ret(cx - 0.8, cy - 0.65, 1.6, 1.3, { cor: 'forte', larg: 1.5 });
        if (i === 0) {
          g.circ(cx, cy - 0.35, 0.3, { preenche: 's4', cor: null, alfa: 0.8 });
          g.txt(fx(p.carga, 1) + ' kg', cx, cy + 0.35, { cor: 's4', tam: 10, negrito: true });
        } else if (i === 1) {
          g.ret(cx - 0.8, cy - 0.65, 1.6, 1.3, { cor: null, preenche: 's3', alfa: 0.25 });
          g.arco(cx, cy, 1.0, 0.3, 2.6, { cor: 'erro', ponta: true });
          g.txt('biaxial', cx, cy + 1.25, { cor: 'erro', tam: 9.5 });
          g.txt('200 a 300 °C', cx, cy - 1.45, { cor: 'erro', tam: 9.5 });
        } else if (i === 2) {
          [0, 1, 2].forEach(function (k) {
            g.seta(cx - 0.6 + k * 0.6, cy - 1.0, 0, 0.3, { cor: 'info', larg: 1.2, ponta: 0.15 });
          });
          g.ret(cx - 0.8, cy - 0.65, 1.6, 1.3, { cor: null, preenche: 's6', alfa: 0.2 });
        } else {
          g.ret(cx - 0.72, cy - 0.57, 1.44, 1.14, { cor: 's6', larg: 1.6, preenche: 's6', alfa: 0.18 });
          g.txt('parede ' + fx(esp, 2) + ' mm', cx, cy + 0.9, { cor: 's6', tam: 10, negrito: true });
        }
        g.txt((i + 1) + '. ' + et, cx, cy - 1.45 + (i === 1 ? -0.4 : 0), { cor: 'suave', tam: 10 });
      });
      /* números */
      var nums = [
        ['área interna 2(ab+ac+bc)', fx(A, 2) + ' m²'],
        ['volume interno', fx(V, 0) + ' L'],
        ['carga de pó', fx(p.carga, 1) + ' kg'],
        ['espessura m/(ρA)', fx(esp, 2) + ' mm'],
        ['carga para 5 mm', fx(rho * A * 0.005, 1) + ' kg']
      ];
      nums.forEach(function (l, idx) {
        g.txt(l[0], 0.7, 2.25 - idx * 0.46, { cor: 'fraco', tam: 10.5, alin: 'esq' });
        g.txt(l[1], 6.2, 2.25 - idx * 0.46, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
      });
      var ok = esp >= 2.5 && esp <= 6;
      g.txt(ok ? 'espessura na faixa usual do processo (2,5 a 6 mm)'
        : esp < 2.5 ? 'fina demais: risco de furos e fusão incompleta'
          : 'grossa demais: ciclo longo e risco de degradar o interior',
        7.0, 2.6, { cor: ok ? 'ok' : 'aviso', tam: 10.5, alin: 'esq' });
      g.txt('sem pressão: moldes baratos, peças sem tensão interna', 7.0, 2.14, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('em troca: ciclo lento, parede desigual e pouca precisão dimensional',
        7.0, 1.7, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('matéria-prima em pó micronizado, com distribuição estreita e boa fluidez',
        7.0, 1.26, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('a espessura é decidida na balança, antes de o molde fechar',
        6.4, -0.5, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 13.1 — regra das misturas ---------- */
  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'Na direção da fibra os dois materiais se deformam juntos e os módulos somam em proporção ao volume; na transversal eles compartilham a tensão e a matriz manda. Entre uma direção e outra, a rigidez do laminado cai por uma ordem de grandeza.',
    vista: [-1.4, 12.6, -1.2, 7.2],
    altura: 480,
    controles: [
      { id: 'fib', rot: 'Reforço: 1 vidro E · 2 carbono · 3 aramida', min: 1, max: 3, val: 2, passo: 1 },
      { id: 'vf', rot: 'Fração volumétrica de fibra', min: 0.05, max: 0.75, val: 0.55, passo: 0.01 },
      { id: 'th', rot: 'Ângulo da carga', min: 0, max: 90, val: 0, passo: 1, un: '°' }
    ],
    desenhar: function (g, p) {
      var fibras = [P2.acha(P2.fibras, 'vidroe'), P2.acha(P2.fibras, 'carbonoalta'), P2.acha(P2.fibras, 'aramida')];
      var fib = fibras[Math.round(p.fib) - 1];
      var mat = P2.acha(P2.matrizes, 'epoxi');
      var lam = P2.lamina(fib, mat, p.vf);
      var Ex = P2.Ex(lam, p.th);
      /* gráfico E × Vf */
      var x0 = 0.8, x1 = 7.4, y0 = 1.2, y1 = 6.4;
      var Emax = Math.max(fib.E * 0.82, 60);
      var X = function (v) { return x0 + (x1 - x0) * v / 0.8; };
      var Y = function (E) { return y0 + (y1 - y0) * lim(E / Emax, 0, 1); };
      var i;
      for (i = 0; i <= 8; i++) {
        g.linha(X(i * 0.1), y0, X(i * 0.1), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        if (i % 2 === 0) g.txt(fx(i * 0.1, 1), X(i * 0.1), y0 - 0.33, { cor: 'fraco', tam: 10 });
      }
      var passoE = Emax > 150 ? 50 : Emax > 60 ? 20 : 10;
      for (i = 0; i * passoE <= Emax; i++) {
        g.linha(x0, Y(i * passoE), x1, Y(i * passoE), { cor: 'borda', larg: 0.8, tracejado: [3, 4] });
        g.txt(fx(i * passoE, 0), x0 - 0.18, Y(i * passoE), { cor: 'fraco', tam: 10, alin: 'dir' });
      }
      g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 });
      g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
      g.txt('fração volumétrica de fibra Vf', (x0 + x1) / 2, y0 - 0.82, { cor: 'suave', tam: 10.5 });
      g.txt('módulo (GPa)', x0 - 0.95, (y0 + y1) / 2, { cor: 'suave', tam: 10.5 });
      var p1 = [], p2 = [];
      for (i = 0; i <= 60; i++) {
        var v = 0.8 * i / 60;
        var l = P2.lamina(fib, mat, v);
        p1.push([X(v), Y(l.E1)]); p2.push([X(v), Y(l.E2)]);
      }
      g.caminho(p1, { cor: 's1', larg: 2.6 });
      g.caminho(p2, { cor: 's3', larg: 2.2 });
      g.txt('E₁ = Ef·Vf + Em·Vm', X(0.5), Y(P2.lamina(fib, mat, 0.5).E1) + 0.4,
        { cor: 's1', tam: 10.5, fundo: true });
      g.txt('E₂ (regra inversa)', X(0.55), Y(P2.lamina(fib, mat, 0.55).E2) + 0.42,
        { cor: 's3', tam: 10.5, fundo: true });
      /* referências metálicas */
      [[210, 'aço', 's5'], [70, 'alumínio', 's6']].forEach(function (r) {
        if (r[0] <= Emax) {
          g.linha(x0, Y(r[0]), x1, Y(r[0]), { cor: r[2], larg: 1.2, tracejado: [6, 4] });
          g.txt(r[1] + ' ' + r[0] + ' GPa', x1 - 0.1, Y(r[0]) + 0.25, { cor: r[2], tam: 9.5, alin: 'dir', fundo: true });
        }
      });
      g.circ(X(p.vf), Y(lam.E1), 0.13, { preenche: 'erro', cor: null });
      g.circ(X(p.vf), Y(lam.E2), 0.11, { preenche: 'erro', cor: null, alfa: 0.6 });
      g.linha(X(p.vf), y0, X(p.vf), Y(lam.E1), { cor: 'erro', larg: 1, tracejado: [4, 4] });
      /* lâmina com fibras no ângulo escolhido */
      var lx = 8.3, ly = 4.3, lw = 3.5, lh = 2.0;
      g.ret(lx, ly, lw, lh, { cor: 'forte', larg: 1.4, preenche: 'baixo', alfa: 0.4 });
      var th = p.th * Math.PI / 180;
      for (i = -8; i <= 14; i++) {
        var d = i * 0.33;
        /* fibras orientadas a θ do eixo x, recortadas na caixa */
        var ca = Math.cos(th), sa = Math.sin(th);
        var px = lx + lw / 2 - d * sa, py = ly + lh / 2 + d * ca;
        var t0 = -2.6, t1 = 2.6;
        var ax = px + t0 * ca, ay = py + t0 * sa, bx = px + t1 * ca, by = py + t1 * sa;
        /* recorte simples: só desenha se o ponto médio cai dentro */
        if (px > lx - 0.1 && px < lx + lw + 0.1 && py > ly - 0.1 && py < ly + lh + 0.1) {
          var cl = function (q, lo, hi) { return q < lo ? lo : q > hi ? hi : q; };
          g.linha(cl(ax, lx + 0.05, lx + lw - 0.05), cl(ay, ly + 0.05, ly + lh - 0.05),
            cl(bx, lx + 0.05, lx + lw - 0.05), cl(by, ly + 0.05, ly + lh - 0.05),
            { cor: 's1', larg: 1.6, alfaLinha: 0.85 });
        }
      }
      g.seta(lx - 0.7, ly + lh / 2, 0.55, 0, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.seta(lx + lw + 0.7, ly + lh / 2, -0.55, 0, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.txt('carga', lx + lw / 2, ly + lh + 0.3, { cor: 'erro', tam: 10 });
      g.txt('θ = ' + fx(p.th, 0) + '°', lx + lw / 2, ly - 0.35, { cor: 's1', tam: 10.5, negrito: true });
      /* painel */
      var xr = 8.3;
      [['fibra', fib.nome.replace('Fibra de ', '')],
       ['Vf (volume)', fx(p.vf, 2)],
       ['Wf (massa)', fx(lam.Wf * 100, 1) + ' %'],
       ['ρ do laminado', fx(lam.rho, 3) + ' g/cm³'],
       ['E₁', fx(lam.E1, 1) + ' GPa'],
       ['E₂', fx(lam.E2, 2) + ' GPa'],
       ['Ex(θ)', fx(Ex, 2) + ' GPa'],
       ['E₁/ρ ÷ (aço 26,8)', fx(lam.E1 / lam.rho / 26.75, 2) + ' ×']
      ].forEach(function (l, idx) {
        g.txt(l[0], xr, 3.75 - idx * 0.44, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 12.4, 3.75 - idx * 0.44, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      g.txt('matriz epóxi (E = 3,6 GPa) em todos os casos', xr, 0.2, { cor: 'fraco', tam: 9.5, alin: 'esq' });
      g.txt('girar a carga 45° derruba a rigidez: é por isso que se laminam camadas em várias direções',
        6, -0.8, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 14.1 — deposição por filamento fundido ---------- */
  F('#fig-14-1', {
    titulo: 'Figura 14.1',
    legenda: 'Na impressão por filamento fundido a peça é uma pilha de cordões extrudados. A vazão do bico é o produto de três números — largura, altura e velocidade — e é ela que decide o tempo de impressão. A adesão entre camadas é o elo fraco: a peça é anisotrópica por construção.',
    vista: [-0.6, 13.4, -0.8, 8.0],
    altura: 520,
    controles: [
      { id: 'hc', rot: 'Altura da camada', min: 0.05, max: 0.4, val: 0.2, passo: 0.01, un: 'mm' },
      { id: 'w', rot: 'Largura do cordão', min: 0.2, max: 0.9, val: 0.45, passo: 0.01, un: 'mm' },
      { id: 'v', rot: 'Velocidade de impressão', min: 10, max: 150, val: 60, passo: 5, un: 'mm/s' },
      { id: 'vol', rot: 'Volume da peça', min: 2, max: 200, val: 30, passo: 1, un: 'cm³' }
    ],
    desenhar: function (g, p) {
      var Q = p.w * p.hc * p.v;                      /* mm³/s */
      var Af = Math.PI * 1.75 * 1.75 / 4;
      var vf = Q / Af;
      var gam = 4 * Q / (Math.PI * Math.pow(0.2, 3));
      var tempo = p.vol * 1000 / Q;
      /* o bico depositando */
      var bx = 3.4, by = 4.6, esc = 7.0;             /* mm → unidades */
      g.caminho([[bx - 0.55, by + 1.7], [bx + 0.55, by + 1.7], [bx + 0.18, by + 0.25], [bx - 0.18, by + 0.25]],
        { cor: 'forte', larg: 1.6, preenche: 'baixo', alfa: 0.5, fechar: true });
      g.txt('bico 0,4 mm', bx + 0.75, by + 0.6, { cor: 'fraco', tam: 9.5, alin: 'esq' });
      g.ret(bx - 0.09, by + 1.7, 0.18, 1.5, { cor: 's1', larg: 1.4, preenche: 's1', alfa: 0.3 });
      g.txt('filamento 1,75 mm a ' + fx(vf, 2) + ' mm/s', bx + 0.35, by + 2.9, { cor: 's1', tam: 9.5, alin: 'esq' });
      g.seta(bx, by + 3.0, 0, -0.5, { cor: 's1', larg: 1.6, ponta: 0.2 });
      /* camadas já depositadas */
      var hc = p.hc * esc, w = p.w * esc;
      var n = Math.min(14, Math.round(1.8 / Math.max(hc, 0.08)));
      var i, j;
      for (i = 0; i < n; i++) {
        for (j = 0; j < 9; j++) {
          var xx = 1.0 + j * w, yy = by - 0.1 - i * hc;
          if (xx >= 7.2) break;
          if (i === 0 && j > 4) continue;
          g.ret(xx, yy - hc, Math.min(w * 0.96, 7.2 - xx), hc * 0.92,
            { cor: 's6', larg: 0.7, preenche: 's6', alfa: i === 0 ? 0.45 : 0.2 });
        }
      }
      g.cota(1.0 - 0.3, by - 0.1, 1.0 - 0.3, by - 0.1 - hc * n, fx(p.hc * n, 2) + ' mm', { cor: 'fraco', dx: -0.1, dy: 0 });
      g.txt(n + ' camadas de ' + fx(p.hc, 2) + ' mm', 2.8, by - 0.1 - hc * n - 0.45, { cor: 'fraco', tam: 9.5 });
      g.txt('a interface entre camadas é a direção fraca da peça', 3.0, by - 0.1 - hc * n - 0.9,
        { cor: 'aviso', tam: 9.5 });
      /* painel */
      var xr = 7.6;
      g.txt('Vazão e tempo', xr, 6.9, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      [['vazão do bico  w·h·v', fx(Q, 2) + ' mm³/s'],
       ['velocidade do filamento', fx(vf, 2) + ' mm/s'],
       ['taxa de cisalhamento no bico', fx(gam, 0) + ' 1/s'],
       ['tempo ideal de impressão', fx(tempo / 3600, 2) + ' h'],
       ['com metade da altura de camada', fx(tempo / 1800, 2) + ' h'],
       ['massa em PLA (1,24 g/cm³)', fx(p.vol * 1.24, 1) + ' g'],
       ['camadas para 40 mm de altura', fx(40 / p.hc, 0)]
      ].forEach(function (l, idx) {
        g.txt(l[0], xr, 6.25 - idx * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
        g.txt(l[1], 13.2, 6.25 - idx * 0.56, { cor: 'texto', tam: 11, alin: 'dir', negrito: true });
      });
      notas(g, xr, 2.3, 13.3, [
        { t: 'a taxa de cisalhamento no bico é da ordem da extrusão convencional — é uma extrusora de bancada, com matriz de 0,4 mm' },
        { t: 'camada fina melhora o acabamento e multiplica o tempo na mesma proporção' }
      ]);
      g.txt('ISO/ASTM 52900 · extrusão de material (FDM) e fotopolimerização em cuba (SLA)',
        6.4, -0.5, { cor: 'fraco', tam: 10.5 });
    }
  });
})();

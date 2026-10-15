/* ============================================================
   Figuras ilustrativas de Seleção de Materiais
   O método, o universo dos materiais, mapas de propriedades,
   índices, restrições múltiplas, trade-off, forma, híbridos,
   processo e eco-seleção. Usa a biblioteca window.SM.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.SM) return;
  var F = window.Figura.criar, SM = window.SM;
  var fx = function (v, n) { n = n == null ? 1 : n; return v.toLocaleString('pt-BR', { maximumFractionDigits: n }); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var log10 = function (v) { return Math.log(Math.max(v, 1e-12)) / Math.LN10; };
  var CORFAM = { metal: 's1', polimero: 's2', ceramico: 's3', composito: 'erro', natural: 'ok', espuma: 's4' };
  var NOMEFAM = { metal: 'metais', polimero: 'polímeros', ceramico: 'cerâmicos', composito: 'compósitos', natural: 'naturais', espuma: 'espumas' };
  var curto = function (n) { return n.split(' ')[0].replace(/[()]/g, ''); };

  /* eixo logarítmico: devolve X(v) dentro de [x0,x1] */
  function escalaLog(v0, v1, x0, x1) {
    var a = log10(v0), b = log10(v1);
    return function (v) { return x0 + (x1 - x0) * (log10(lim(v, v0, v1)) - a) / (b - a); };
  }
  function decadas(v0, v1) {
    var d = [], e = Math.ceil(log10(v0));
    for (; e <= Math.floor(log10(v1)); e++) d.push(Math.pow(10, e));
    return d;
  }
  /* em faixas estreitas, só as decadas deixariam um ou dois rotulos: usa 1-2-5 */
  function marcas(v0, v1) {
    if (log10(v1) - log10(v0) > 2.6) return decadas(v0, v1);
    var m = [], e = Math.floor(log10(v0)), i, k;
    for (; e <= Math.ceil(log10(v1)); e++) {
      for (i = 0; i < 3; i++) {
        k = [1, 2, 5][i] * Math.pow(10, e);
        if (k >= v0 && k <= v1) m.push(k);
      }
    }
    return m;
  }
  function rotLog(v) {
    if (v >= 1000) return '10' + String(Math.round(log10(v))).replace(/[0-9]/g, function (c) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]; });
    if (v >= 1) return fx(v, 0);
    return fx(v, v >= 0.1 ? 1 : v >= 0.01 ? 2 : 3);
  }

  /* ---------- 1.1 — o método da seleção ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'O método em quatro passos: traduzir o problema, triar pelas restrições, ordenar pelo objetivo e documentar. A triagem corta por cumprir ou não cumprir; a ordenação é que escolhe entre os que sobraram.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Tmin', rot: 'Temperatura mínima de serviço exigida', min: 50, max: 1200, val: 150, passo: 10, un: '°C' },
      { id: 'custoMax', rot: 'Custo máximo aceitável', min: 0.5, max: 60, val: 10, passo: 0.5, un: 'US$/kg' },
      { id: 'Emin', rot: 'Módulo mínimo exigido', min: 0.01, max: 200, val: 10, passo: 0.5, un: 'GPa' }
    ],
    desenhar: function (g, p) {
      var todos = SM.mats.length;
      var passa1 = SM.mats.filter(function (m) { return m.Tmax >= p.Tmin; });
      var passa2 = passa1.filter(function (m) { return m.custo <= p.custoMax; });
      var passa3 = passa2.filter(function (m) { return m.E >= p.Emin; });
      var etapas = [
        { n: todos, rot: 'todos os materiais', cor: 'fraco' },
        { n: passa1.length, rot: 'T de serviço ≥ ' + fx(p.Tmin, 0) + ' °C', cor: 's4' },
        { n: passa2.length, rot: 'custo ≤ ' + fx(p.custoMax, 1) + ' US$/kg', cor: 'aviso' },
        { n: passa3.length, rot: 'E ≥ ' + fx(p.Emin, 1) + ' GPa', cor: 'ok' }
      ];
      var fx0 = 1.2, fw = 5.0, fy = 4.6, fh = 0.78;
      etapas.forEach(function (e, i) {
        var w = fw * Math.max(e.n / todos, 0.04);
        var x = fx0 + (fw - w) / 2, y = fy - i * (fh + 0.42);
        g.ret(x, y - fh, w, fh, { cor: 'fundo', larg: 1.2, preenche: e.cor, alfa: 0.7 });
        g.txt(e.n + '', x + w / 2, y - fh / 2, { cor: 'texto', tam: 12.5, negrito: true });
        g.txt(e.rot, fx0 + fw + 0.25, y - fh / 2, { cor: e.cor === 'fraco' ? 'suave' : e.cor, tam: 10.5, alin: 'esq' });
        if (i < 3) {
          g.seta(fx0 + fw / 2, y - fh - 0.06, 0, -0.3, { cor: 'fraco', larg: 1.4, ponta: 0.16 });
        }
      });
      g.txt('triagem: corta quem não cumpre', fx0 + fw / 2, fy + 0.4, { cor: 'fraco', tam: 11 });
      var xr = 8.6;
      g.txt('restaram ' + passa3.length + ' candidatos', xr, 5.0, { cor: passa3.length ? 'ok' : 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('de ' + todos + ' materiais', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      var lista = passa3.slice(0, 7);
      var yy = 3.7;
      lista.forEach(function (m) {
        g.txt('· ' + m.nome, xr, yy, { cor: CORFAM[m.fam], tam: 11, alin: 'esq' });
        yy -= 0.45;
      });
      if (passa3.length > 7) g.txt('… e mais ' + (passa3.length - 7), xr, yy, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      if (!passa3.length) g.txt('relaxe uma restrição', xr, 3.7, { cor: 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('a ordenação pelo índice só começa depois da triagem — e nunca o contrário', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — o universo dos materiais ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Cada propriedade cobre várias ordens de grandeza, e cada família ocupa uma faixa. É essa dispersão que torna o gráfico log-log a única forma razoável de ver todos os materiais ao mesmo tempo.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'prop', rot: 'Propriedade: 1 módulo E · 2 resistência · 3 massa específica · 4 custo', min: 1, max: 4, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var k = Math.round(p.prop);
      var cfg = [
        { get: function (m) { return m.E; }, nome: 'Módulo de Young E', un: 'GPa', v0: 0.001, v1: 1000 },
        { get: function (m) { return m.sy; }, nome: 'Resistência σ', un: 'MPa', v0: 0.1, v1: 2000 },
        { get: function (m) { return m.rho; }, nome: 'Massa específica ρ', un: 'kg/m³', v0: 50, v1: 20000 },
        { get: function (m) { return m.custo; }, nome: 'Custo', un: 'US$/kg', v0: 0.05, v1: 100 }
      ][k - 1];
      var gx = 2.6, gw = 8.6, gy = 0.9;
      var X = escalaLog(cfg.v0, cfg.v1, gx, gx + gw);
      var fams = Object.keys(SM.familias);
      var h = 4.0 / fams.length;
      decadas(cfg.v0, cfg.v1).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + 4.1, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), X(d), gy - 0.35, { cor: 'fraco', tam: 10 });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      fams.forEach(function (fam, i) {
        var vals = SM.mats.filter(function (m) { return m.fam === fam; }).map(cfg.get);
        if (!vals.length) return;
        var v0 = Math.min.apply(null, vals), v1 = Math.max.apply(null, vals);
        var y = gy + 4.1 - (i + 0.5) * h;
        g.ret(X(v0), y - h * 0.26, X(v1) - X(v0), h * 0.52,
          { cor: 'fundo', larg: 1, preenche: CORFAM[fam], alfa: 0.55 });
        g.txt(NOMEFAM[fam], gx - 0.2, y, { cor: CORFAM[fam], tam: 11, alin: 'dir' });
        g.txt(rotLog(v0) + ' a ' + rotLog(v1), (X(v0) + X(v1)) / 2, y, { cor: 'texto', tam: 9.5 });
      });
      g.txt(cfg.nome + ' (' + cfg.un + ', escala log)', gx + gw / 2, gy - 0.85, { cor: 'fraco', tam: 11 });
      var vals = SM.mats.map(cfg.get);
      var razao = Math.max.apply(null, vals) / Math.min.apply(null, vals);
      g.txt('do menor ao maior: fator de ' + (razao > 1000 ? fx(razao / 1000, 0) + ' mil' : fx(razao, 0)) +
        ' — ' + fx(log10(razao), 1) + ' ordens de grandeza', gx + gw / 2, gy + 4.5, { cor: 'suave', tam: 12, negrito: true });
      g.txt('num gráfico linear, todas as famílias leves ficariam espremidas contra o eixo', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — o mapa E × ρ ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'O mapa de propriedades mais usado: módulo contra massa específica. As famílias se agrupam, e as diagonais são índices — tudo que fica sobre uma mesma diagonal tem o mesmo desempenho naquela função.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'guia', rot: 'Guia: 0 nenhuma · 1 E/ρ · 2 E^½/ρ · 3 E^⅓/ρ', min: 0, max: 3, val: 2, passo: 1 },
      { id: 'nivel', rot: 'Altura da guia (% da faixa do índice)', min: 0, max: 100, val: 60, passo: 1, un: '%' },
      { id: 'rot', rot: 'Nomear os materiais: 0 não · 1 sim', min: 0, max: 1, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var gx = 1.5, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = escalaLog(50, 20000, gx, gx + gw);
      var Y = escalaLog(0.001, 1000, gy, gy + gh);
      decadas(50, 20000).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), X(d), gy - 0.35, { cor: 'fraco', tam: 9.5 });
      });
      decadas(0.001, 1000).forEach(function (d) {
        g.linha(gx, Y(d), gx + gw, Y(d), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), gx - 0.15, Y(d), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var n = Math.round(p.guia), acima = [], nivel = 0;
      if (n) {
        var expo = n === 1 ? 1 : n === 2 ? 0.5 : 1 / 3;
        var val = function (m) { return Math.pow(m.E, expo) / m.rho * 1000; };
        /* a guia percorre a faixa do índice em escala log, para servir aos três expoentes */
        var vs = SM.mats.map(val).sort(function (x, y) { return x - y; });
        var v0 = vs[Math.floor(vs.length * 0.45)], v1 = vs[vs.length - 1];
        nivel = v0 * Math.pow(v1 / v0, p.nivel / 100);
        var pts = [], i;
        for (i = 0; i <= 30; i++) {
          var rho = 50 * Math.pow(20000 / 50, i / 30);
          var E = Math.pow(nivel * rho / 1000, 1 / expo);   /* M = E^e/(ρ/1000), E em GPa */
          if (E >= 0.001 && E <= 1000) pts.push([X(rho), Y(E)]);
        }
        if (pts.length > 1) g.caminho(pts, { cor: 'texto', larg: 2.2, tracejado: [7, 5] });
        SM.mats.forEach(function (m) { if (val(m) >= nivel) acima.push(m); });
        acima.sort(function (x, y) { return val(y) - val(x); });
      }
      SM.mats.forEach(function (m) {
        g.circ(X(m.rho), Y(m.E), 0.11, { preenche: CORFAM[m.fam], cor: null, alfa: 0.9 });
      });
      /* rotular todos sobrepõe tudo: só os representativos de cada região */
      if (Math.round(p.rot)) {
        [['aco', 0.3, 'c'], ['cu', -0.3, 'c'], ['ti', 0.3, 'd'], ['al6061', -0.30, 'd'],
         ['mg', 0.3, 'e'], ['alumina', 0.3, 'c'], ['vidro', -0.30, 'e'], ['concreto', -0.32, 'd'],
         ['cfrp', 0.3, 'e'], ['gfrp', 0.30, 'e'], ['madeira', 0.3, 'e'], ['pp', -0.32, 'c'],
         ['borracha', -0.32, 'c'], ['espumaR', 0.3, 'e'], ['cortica', -0.32, 'c']
        ].forEach(function (r) {
          var m = SM.porId(r[0]);
          if (!m) return;
          var dx = r[2] === 'e' ? -0.18 : r[2] === 'd' ? 0.18 : 0;
          g.txt(curto(m.nome), X(m.rho) + dx, Y(m.E) + r[1],
            { cor: CORFAM[m.fam], tam: 9, fundo: true,
              alin: r[2] === 'e' ? 'dir' : r[2] === 'd' ? 'esq' : 'centro' });
        });
      }
      g.txt('ρ (kg/m³)', gx + gw / 2, gy - 0.8, { cor: 'fraco', tam: 11 });
      g.txt('E (GPa)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6, yy = 5.0;
      Object.keys(SM.familias).forEach(function (fam) {
        g.circ(xr, yy, 0.12, { preenche: CORFAM[fam], cor: null });
        g.txt(NOMEFAM[fam], xr + 0.3, yy, { cor: CORFAM[fam], tam: 11, alin: 'esq' });
        yy -= 0.42;
      });
      if (n) {
        g.txt('guia ' + ['', 'E/ρ', 'E^½/ρ', 'E^⅓/ρ'][n] + ' = ' + fx(nivel, 2), xr, yy - 0.3,
          { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
        g.txt(acima.length + ' materiais acima dela', xr, yy - 0.85, { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
        g.txt(acima.slice(0, 4).map(function (m) { return curto(m.nome); }).join(', '), xr, yy - 1.35, { cor: 'suave', tam: 10.5, alin: 'esq' });
      }
      g.txt('a inclinação da guia é 1/e: 1 para tirante, 2 para viga e 3 para painel', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — a receita do índice ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'A receita: escreva o objetivo, escreva a restrição, elimine a variável livre. O que sobra se separa em três fatores — carga, geometria e material —, e só o último depende da escolha.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'mat', rot: 'Material: 1 aço · 2 alumínio · 3 CFRP · 4 madeira', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'L', rot: 'Vão da viga', min: 0.3, max: 3, val: 1, passo: 0.1, un: 'm' },
      { id: 'S', rot: 'Rigidez exigida', min: 100, max: 3000, val: 500, passo: 50, un: 'kN/m' }
    ],
    desenhar: function (g, p) {
      var ids = ['aco', 'al6061', 'cfrp', 'madeira'];
      var m = SM.porId(ids[Math.round(p.mat) - 1]);
      var S = p.S * 1000, L = p.L;
      var A = L * Math.sqrt(S * L / (4 * m.E * 1e9));
      var lado = Math.sqrt(A), massa = A * L * m.rho;
      var M = Math.sqrt(m.E) / m.rho * 1000;
      /* desenho da viga */
      var vx = 1.0, vy = 3.4, vw = 4.6;
      g.linha(vx, vy, vx + vw, vy, { cor: 'forte', larg: 3 });
      g.ret(vx, vy - 0.02, vw, Math.max(0.12, lado * 12), { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.45 });
      g.seta(vx + vw / 2, vy + 1.1, 0, -0.55, { cor: 'erro', larg: 2.2, ponta: 0.2 });
      g.txt('F', vx + vw / 2 + 0.25, vy + 0.9, { cor: 'erro', tam: 12, negrito: true });
      g.linha(vx, vy - 0.35, vx, vy, { cor: 'fraco', larg: 1.4 });
      g.linha(vx + vw, vy - 0.35, vx + vw, vy, { cor: 'fraco', larg: 1.4 });
      g.cota(vx, vy - 0.65, vx + vw, vy - 0.65, 'L = ' + fx(L, 2) + ' m', { dy: -0.3 });
      g.ret(vx + vw + 0.5, vy, Math.max(0.18, lado * 12), Math.max(0.18, lado * 12),
        { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.45 });
      g.txt('seção', vx + vw + 0.5 + Math.max(0.18, lado * 12) / 2, vy - 0.3, { cor: 'fraco', tam: 10 });
      g.txt('lado ' + fx(lado * 1000, 1) + ' mm', vx + vw + 0.5, vy + Math.max(0.18, lado * 12) + 0.3, { cor: 'suave', tam: 10.5, alin: 'esq' });
      /* três fatores */
      var bx = 1.0, by = 1.1, bw = 5.2;
      var fatores = [
        { rot: 'carga', v: Math.sqrt(S / 4), cor: 'erro' },
        { rot: 'geometria', v: Math.pow(L, 2.5), cor: 'aviso' },
        { rot: 'material ρ/E^½', v: m.rho / Math.sqrt(m.E * 1e9), cor: CORFAM[m.fam], dec: 5 }
      ];
      g.txt('m = ', bx - 0.15, by + 0.35, { cor: 'texto', tam: 13, alin: 'dir', negrito: true });
      fatores.forEach(function (f, i) {
        var w = bw / 3 - 0.15;
        g.ret(bx + i * (bw / 3), by, w, 0.7, { cor: 'fundo', larg: 1.2, preenche: f.cor, alfa: 0.4 });
        g.txt(f.rot, bx + i * (bw / 3) + w / 2, by + 0.48, { cor: 'texto', tam: 10 });
        g.txt(fx(f.v, f.dec || 3), bx + i * (bw / 3) + w / 2, by + 0.2, { cor: 'texto', tam: 11, negrito: true });
        if (i < 2) g.txt('×', bx + (i + 1) * (bw / 3) - 0.08, by + 0.35, { cor: 'fraco', tam: 12 });
      });
      g.txt('só este muda com o material', bx + 2 * (bw / 3) + bw / 6, by - 0.3, { cor: CORFAM[m.fam], tam: 10 });
      g.txt('= ' + fx(massa, 3) + ' kg   (fatores em unidades SI)', bx + bw / 2, by - 0.62, { cor: 'erro', tam: 11.5, negrito: true });
      var xr = 7.4;
      g.txt(m.nome, xr, 5.0, { cor: CORFAM[m.fam], tam: 13, alin: 'esq', negrito: true });
      g.txt('E = ' + fx(m.E, 1) + ' GPa · ρ = ' + fx(m.rho, 0) + ' kg/m³', xr, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('área exigida ' + fx(A * 1e4, 2) + ' cm²', xr, 3.7, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('massa = ' + fx(massa, 3) + ' kg', xr, 3.0, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('índice M = E^½/ρ = ' + fx(M, 3), xr, 2.3, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('a massa é inversamente', xr, 1.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('proporcional ao índice:', xr, 1.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('dobrar M corta a massa pela metade', xr, 0.8, { cor: 'suave', tam: 10.5, alin: 'esq' });
      g.txt('viga biapoiada de seção quadrada, área livre · S = 48EI/L³ com I = A²/12', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — os índices clássicos ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'O mesmo conjunto de materiais, três funções diferentes: a ordem muda. Não existe o melhor material — existe o melhor material para uma função, uma restrição e um objetivo.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'ind', rot: 'Índice: 1 tirante E/ρ · 2 viga E^½/ρ · 3 painel E^⅓/ρ · 4 viga σ^⅔/ρ', min: 1, max: 4, val: 2, passo: 1 },
      { id: 'n', rot: 'Quantos mostrar', min: 5, max: 12, val: 8, passo: 1 }
    ],
    desenhar: function (g, p) {
      var k = Math.round(p.ind), n = Math.round(p.n);
      var defs = [
        { nome: 'tirante leve e rígido', tex: 'E/ρ', f: function (m) { return m.E / m.rho * 1000; } },
        { nome: 'viga leve e rígida', tex: 'E^½/ρ', f: function (m) { return Math.sqrt(m.E) / m.rho * 1000; } },
        { nome: 'painel leve e rígido', tex: 'E^⅓/ρ', f: function (m) { return Math.pow(m.E, 1 / 3) / m.rho * 1000; } },
        { nome: 'viga leve e resistente', tex: 'σ^⅔/ρ', f: function (m) { return Math.pow(m.sy, 2 / 3) / m.rho * 1000; } }
      ][k - 1];
      var lista = SM.mats.filter(function (m) { return m.fam !== 'espuma'; })
        .map(function (m) { return { m: m, v: defs.f(m) }; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, n);
      var gx = 3.2, gw = 5.4, gy = 0.9, gh = 4.1;
      var vmax = lista[0].v * 1.08;
      lista.forEach(function (x, i) {
        var h = gh / n;
        var y = gy + gh - (i + 0.5) * h;
        var w = gw * x.v / vmax;
        g.ret(gx, y - h * 0.34, w, h * 0.68, { cor: 'fundo', larg: 1, preenche: CORFAM[x.m.fam], alfa: 0.75 });
        g.txt(x.m.nome, gx - 0.2, y, { cor: CORFAM[x.m.fam], tam: 10.5, alin: 'dir' });
        g.txt(fx(x.v, 3), gx + w + 0.15, y, { cor: 'texto', tam: 10.5, alin: 'esq', negrito: true });
      });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.txt('índice ' + defs.tex, gx + gw / 2, gy - 0.4, { cor: 'fraco', tam: 11 });
      g.txt(defs.nome, gx + gw / 2, gy + gh + 0.4, { cor: 'texto', tam: 13, negrito: true });
      var aco = SM.porId('aco'), prim = lista[0];
      g.txt('massa relativa ao aço: ' + fx(defs.f(aco) / prim.v, 3) + ' × para o primeiro colocado',
        6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — a guia deslizante ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Selecionar graficamente é deslizar a guia até restar uma lista curta. O que está acima da linha é melhor que o nível exigido; subir demais esvazia a lista, e aí é a especificação que precisa ser revista.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'nivel', rot: 'Nível exigido do índice E^½/ρ', min: 0.5, max: 8, val: 3, passo: 0.05 },
      { id: 'Tmin', rot: 'Restrição extra: T de serviço mínima', min: 50, max: 1200, val: 100, passo: 10, un: '°C' }
    ],
    desenhar: function (g, p) {
      var gx = 1.4, gy = 0.9, gw = 5.4, gh = 4.1;
      var X = escalaLog(300, 20000, gx, gx + gw);
      var Y = escalaLog(0.05, 1000, gy, gy + gh);
      decadas(300, 20000).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), X(d), gy - 0.35, { cor: 'fraco', tam: 9.5 });
      });
      decadas(0.05, 1000).forEach(function (d) {
        g.linha(gx, Y(d), gx + gw, Y(d), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), gx - 0.15, Y(d), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 30; i++) {
        var rho = 300 * Math.pow(20000 / 300, i / 30);
        var E = Math.pow(p.nivel * rho / 1000, 2);
        if (E >= 0.05 && E <= 1000) pts.push([X(rho), Y(E)]);
      }
      if (pts.length > 1) {
        g.caminho(pts, { cor: 'erro', larg: 2.4, tracejado: [7, 5] });
        var fecho = pts.concat([[pts[pts.length - 1][0], gy + gh], [pts[0][0], gy + gh]]);
        g.caminho(fecho, { cor: null, preenche: 'ok', alfa: 0.08, fechar: true });
      }
      var aprovados = [], reprovados = [];
      SM.mats.forEach(function (m) {
        var ok = Math.sqrt(m.E) / m.rho * 1000 >= p.nivel && m.Tmax >= p.Tmin;
        (ok ? aprovados : reprovados).push(m);
        g.circ(X(m.rho), Y(m.E), ok ? 0.15 : 0.09,
          { preenche: ok ? CORFAM[m.fam] : 'fraco', cor: null, alfa: ok ? 1 : 0.45 });
      });
      /* os aprovados ficam amontoados no mesmo canto: quem os nomeia é a lista ao lado */
      aprovados.sort(function (x, y) { return Math.sqrt(y.E) / y.rho - Math.sqrt(x.E) / x.rho; });
      g.txt('ρ (kg/m³)', gx + gw / 2, gy - 0.8, { cor: 'fraco', tam: 11 });
      g.txt('E (GPa)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4;
      g.txt('M ≥ ' + fx(p.nivel, 2), xr, 5.0, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('T de serviço ≥ ' + fx(p.Tmin, 0) + ' °C', xr, 4.4, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt(aprovados.length + ' aprovados', xr, 3.7, { cor: aprovados.length ? 'ok' : 'erro', tam: 14, alin: 'esq', negrito: true });
      var yy = 3.1;
      aprovados.slice(0, 8).forEach(function (m) {
        g.txt('· ' + m.nome, xr, yy, { cor: CORFAM[m.fam], tam: 10.5, alin: 'esq' });
        yy -= 0.36;
      });
      if (!aprovados.length) {
        g.txt('nenhum material atende:', xr, 3.1, { cor: 'erro', tam: 11.5, alin: 'esq' });
        g.txt('é hora de rever a especificação', xr, 2.65, { cor: 'erro', tam: 11.5, alin: 'esq' });
      }
      if (aprovados.length > 8) g.txt('… e mais ' + (aprovados.length - 8), xr, yy, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('os pontos cheios são os aprovados, em ordem de índice · a área sombreada é a região viável', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — restrições múltiplas ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Com duas restrições, cada material tem uma que manda. A área exigida é a maior das duas — e dimensionar pela outra deixaria a peça fora de especificação.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'carga', rot: 'Carga no meio do vão', min: 200, max: 12000, val: 2000, passo: 100, un: 'N' },
      { id: 'defl', rot: 'Flecha máxima admitida', min: 0.5, max: 15, val: 10, passo: 0.1, un: 'mm' },
      { id: 'fs', rot: 'Fator de segurança', min: 1, max: 5, val: 2, passo: 0.1 }
    ],
    desenhar: function (g, p) {
      var L = 1, S = p.carga / (p.defl / 1000);
      var lista = ['aco', 'al6061', 'ti', 'cfrp', 'gfrp', 'madeira', 'pa', 'vidro'].map(function (id) {
        var m = SM.porId(id);
        var Ar = L * Math.sqrt(S * L / (4 * m.E * 1e9));
        var As = Math.pow(3 * p.carga * L / (2 * m.sy * 1e6 / p.fs), 2 / 3);
        return { m: m, mr: Ar * L * m.rho, ms: As * L * m.rho };
      });
      var vmax = Math.max.apply(null, lista.map(function (x) { return Math.max(x.mr, x.ms); })) * 1.2;
      var gx = 1.3, gy = 1.1, gw = 5.8, gh = 3.8;
      var Y = function (v) { return gy + gh * lim(v / vmax, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var bw = gw / lista.length;
      lista.forEach(function (x, i) {
        var xc = gx + (i + 0.5) * bw;
        g.ret(xc - bw * 0.34, gy, bw * 0.3, Y(x.mr) - gy, { cor: 'fundo', larg: 1, preenche: 's1', alfa: 0.8 });
        g.ret(xc + 0.02, gy, bw * 0.3, Y(x.ms) - gy, { cor: 'fundo', larg: 1, preenche: 'erro', alfa: 0.8 });
        var manda = x.mr >= x.ms;
        g.circ(xc - bw * 0.19 + (manda ? 0 : bw * 0.36), Y(Math.max(x.mr, x.ms)) + 0.2, 0.1,
          { preenche: 'aviso', cor: null });
        g.txt(curto(x.m.nome), xc, gy - 0.3, { cor: 'suave', tam: 9.5 });
      });
      g.txt('massa exigida (kg)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.ret(gx + 0.1, gy + gh - 0.3, 0.22, 0.22, { preenche: 's1', cor: null });
      g.txt('rigidez', gx + 0.45, gy + gh - 0.19, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.ret(gx + 1.5, gy + gh - 0.3, 0.22, 0.22, { preenche: 'erro', cor: null });
      g.txt('resistência', gx + 1.85, gy + gh - 0.19, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.circ(gx + 3.3, gy + gh - 0.19, 0.1, { preenche: 'aviso', cor: null });
      g.txt('restrição ativa', gx + 3.5, gy + gh - 0.19, { cor: 'aviso', tam: 10.5, alin: 'esq' });
      var rig = lista.filter(function (x) { return x.mr >= x.ms; });
      var melhor = lista.slice().sort(function (a, b) { return Math.max(a.mr, a.ms) - Math.max(b.mr, b.ms); })[0];
      var xr = 7.6;
      g.txt('mais leve: ' + melhor.m.nome, xr, 5.0, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(fx(Math.max(melhor.mr, melhor.ms), 3) + ' kg', xr, 4.4, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('nele manda a ' + (melhor.mr >= melhor.ms ? 'rigidez' : 'resistência'), xr, 3.8,
        { cor: 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('rigidez manda em ' + rig.length + ' de ' + lista.length, xr, 3.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(rig.map(function (x) { return curto(x.m.nome); }).join(', '), xr, 2.6, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt('S = F/δ = ' + fx(S / 1000, 0) + ' kN/m', xr, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('aperte a flecha e a rigidez', xr, 1.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('passa a mandar em todos', xr, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('viga biapoiada de 1 m, seção quadrada maciça', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — trade-off ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Com dois objetivos em conflito não há vencedor absoluto: há uma fronteira. Os eixos são logarítmicos porque o custo varia cem vezes entre os candidatos; o valor de troca — quanto se paga por quilo economizado — é que escolhe um ponto sobre a fronteira.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'alfa', rot: 'Valor de troca', min: 1, max: 2000, val: 12, passo: 1, un: 'US$/kg' }
    ],
    desenhar: function (g, p) {
      var L = 1, S = 500000;
      var lista = SM.mats.filter(function (m) { return m.fam !== 'espuma' && m.E > 0.5; }).map(function (m) {
        var A = L * Math.sqrt(S * L / (4 * m.E * 1e9));
        var massa = A * L * m.rho;
        return { m: m, massa: massa, custo: massa * m.custo, Z: massa * m.custo + p.alfa * massa };
      });
      var pareto = lista.filter(function (a) {
        return !lista.some(function (b) {
          return b !== a && b.massa <= a.massa && b.custo <= a.custo && (b.massa < a.massa || b.custo < a.custo);
        });
      }).sort(function (a, b) { return a.massa - b.massa; });
      var esc = lista.slice().sort(function (a, b) { return a.Z - b.Z; })[0];

      var gx = 1.4, gy = 0.9, gw = 5.4, gh = 4.1;
      var m0 = Math.min.apply(null, lista.map(function (x) { return x.massa; })) * 0.7;
      var m1 = Math.max.apply(null, lista.map(function (x) { return x.massa; })) * 1.4;
      var c0 = Math.min.apply(null, lista.map(function (x) { return x.custo; })) * 0.6;
      var c1 = Math.max.apply(null, lista.map(function (x) { return x.custo; })) * 1.6;
      var X = escalaLog(m0, m1, gx, gx + gw);
      var Y = escalaLog(c0, c1, gy, gy + gh);
      marcas(m0, m1).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), X(d), gy - 0.35, { cor: 'fraco', tam: 9.5 });
      });
      marcas(c0, c1).forEach(function (d) {
        g.linha(gx, Y(d), gx + gw, Y(d), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), gx - 0.15, Y(d), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });

      /* curva de penalidade que passa pelo ótimo: C = Z − αm, em eixos log */
      var pts = [], i, mm, cc;
      for (i = 0; i <= 60; i++) {
        mm = m0 * Math.pow(esc.Z / p.alfa / m0, i / 60);
        cc = esc.Z - p.alfa * mm;
        if (cc > c0 * 0.9 && mm <= m1) pts.push([X(mm), Y(cc)]);
      }
      if (pts.length > 1) g.caminho(pts, { cor: 'aviso', larg: 1.8, tracejado: [4, 4] });

      g.caminho(pareto.map(function (x) { return [X(x.massa), Y(x.custo)]; }),
        { cor: 'texto', larg: 2, tracejado: [6, 4] });
      lista.forEach(function (x) {
        var naFronteira = pareto.indexOf(x) >= 0;
        g.circ(X(x.massa), Y(x.custo), naFronteira ? 0.16 : 0.1,
          { preenche: CORFAM[x.m.fam], cor: null, alfa: naFronteira ? 1 : 0.35 });
      });
      pareto.forEach(function (x, k) {
        var dy = k % 2 ? -0.36 : 0.32;
        g.txt(curto(x.m.nome), X(x.massa), Y(x.custo) + dy,
          { cor: CORFAM[x.m.fam], tam: 9.5, fundo: true });
      });
      g.circ(X(esc.massa), Y(esc.custo), 0.22, { cor: 'aviso', larg: 2.4 });

      g.txt('massa da viga (kg, log)', gx + gw / 2, gy - 0.8, { cor: 'fraco', tam: 11 });
      g.txt('custo do material (US$, log)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });

      var xr = 7.4;
      g.txt('α = ' + fx(p.alfa, 0) + ' US$/kg', xr, 5.0, { cor: 'aviso', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(p.alfa < 5 ? 'produto de consumo' : p.alfa < 50 ? 'automóvel' : p.alfa < 800 ? 'aeronave' : 'veículo espacial',
        xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('escolha: ' + esc.m.nome, xr, 3.6, { cor: CORFAM[esc.m.fam], tam: 13, alin: 'esq', negrito: true });
      g.txt('massa ' + fx(esc.massa, 3) + ' kg', xr, 3.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('custo US$ ' + fx(esc.custo, 2), xr, 2.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('Z = C + αm = US$ ' + fx(esc.Z, 2), xr, 1.9, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt(pareto.length + ' materiais na fronteira', xr, 1.2, { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('os pontos apagados são dominados: pior nos dois objetivos que algum da fronteira', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — fator de forma ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'A mesma área de material, seções diferentes: o fator de forma mede quanto a geometria rende em flexão. Ele entra multiplicando o módulo dentro do índice — mas tem teto, porque parede fina flamba.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'mat', rot: 'Material: 1 aço · 2 alumínio · 3 madeira · 4 alumina', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'forma', rot: 'Seção: 1 quadrada · 2 retângulo · 3 tubo · 4 tubo fino · 5 caixa · 6 perfil I', min: 1, max: 6, val: 3, passo: 1 }
    ],
    desenhar: function (g, p) {
      var ids = ['aco', 'al6061', 'madeira', 'alumina'];
      var m = SM.porId(ids[Math.round(p.mat) - 1]);
      var f = SM.formas[Math.round(p.forma) - 1];
      var base = Math.sqrt(m.E) / m.rho * 1000;
      var com = Math.sqrt(f.fe * m.E) / m.rho * 1000;
      var teto = SM.formaMax[m.fam] || 2;
      var viavel = f.fe <= teto;
      /* desenho das seções */
      var cx = 2.4, cy = 3.6, s = 1.0;
      g.txt('mesma área de material, seções diferentes', cx, cy + 1.95, { cor: 'fraco', tam: 10.5 });
      g.ret(cx - 1.75 - s / 2, cy - s / 2, s, s, { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.5 });
      g.txt('quadrada', cx - 1.75, cy - s / 2 - 0.3, { cor: 'fraco', tam: 10 });
      g.txt('φ = 1', cx - 1.75, cy + s / 2 + 0.3, { cor: 'fraco', tam: 10.5 });
      var k = Math.round(p.forma);
      var R = s * 0.75;
      if (k === 1) {
        g.ret(cx + 1.0 - s / 2, cy - s / 2, s, s, { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.5 });
      } else if (k === 2) {
        g.ret(cx + 1.0 - s * 0.29, cy - s * 0.87, s * 0.58, s * 1.74, { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.5 });
      } else if (k === 3 || k === 4) {
        var t = k === 3 ? 0.1 : 0.05;
        g.circ(cx + 1.0, cy, R, { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.5 });
        g.circ(cx + 1.0, cy, R * (1 - 2 * t), { cor: 'forte', larg: 1.4, preenche: 'fundo', alfa: 1 });
      } else if (k === 5) {
        g.ret(cx + 1.0 - R, cy - R, 2 * R, 2 * R, { cor: 'forte', larg: 1.6, preenche: CORFAM[m.fam], alfa: 0.5 });
        g.ret(cx + 1.0 - R * 0.86, cy - R * 0.86, 1.72 * R, 1.72 * R, { cor: 'forte', larg: 1.4, preenche: 'fundo', alfa: 1 });
      } else {
        g.ret(cx + 1.0 - R, cy + R * 0.7, 2 * R, R * 0.3, { cor: 'forte', larg: 1.4, preenche: CORFAM[m.fam], alfa: 0.5 });
        g.ret(cx + 1.0 - R, cy - R, 2 * R, R * 0.3, { cor: 'forte', larg: 1.4, preenche: CORFAM[m.fam], alfa: 0.5 });
        g.ret(cx + 1.0 - R * 0.14, cy - R * 0.7, R * 0.28, R * 1.4, { cor: 'forte', larg: 1.4, preenche: CORFAM[m.fam], alfa: 0.5 });
      }
      g.txt(f.nome.split(' ')[0] + (k > 2 ? '' : ''), cx + 1.0, cy - s * 0.95 - 0.3, { cor: 'suave', tam: 10 });
      g.txt('φ = ' + fx(f.fe, 1), cx + 1.0, cy + s * 0.95 + 0.3, { cor: viavel ? 'ok' : 'erro', tam: 11.5, negrito: true });
      /* barras de índice */
      var bx = 1.0, by = 1.35, bw = 4.6;
      var vmax = Math.max(base, com) * 1.2;
      g.ret(bx, by + 0.6, bw * base / vmax, 0.42, { cor: 'fundo', larg: 1, preenche: 'fraco', alfa: 0.7 });
      g.txt('maciço ' + fx(base, 3), bx + 0.12, by + 0.81, { cor: 'texto', tam: 10.5, alin: 'esq' });
      g.ret(bx, by, bw * com / vmax, 0.42, { cor: 'fundo', larg: 1, preenche: CORFAM[m.fam], alfa: 0.85 });
      g.txt('com forma ' + fx(com, 3), bx + 0.12, by + 0.21, { cor: 'texto', tam: 10.5, alin: 'esq' });
      var xr = 7.2;
      g.txt(m.nome, xr, 5.0, { cor: CORFAM[m.fam], tam: 13, alin: 'esq', negrito: true });
      g.txt(f.nome, xr, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('φ_B^e = ' + fx(f.fe, 1), xr, 3.7, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('índice sobe √φ = ' + fx(Math.sqrt(f.fe), 2) + '×', xr, 3.1, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('massa cai para ' + fx(100 / Math.sqrt(f.fe), 0) + ' %', xr, 2.5, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('teto da família: φ ≈ ' + fx(teto, 0), xr, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(viavel ? 'forma viável neste material' : 'acima do teto: parede flambaria',
        xr, 1.2, { cor: viavel ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('φ_B^e = 12I/A² · o índice com forma é (φE)^½/ρ', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — híbridos ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Combinar dois materiais cria pontos que não existem na natureza. Os limites de Voigt e Reuss delimitam o que é possível, e o sanduíche ocupa justamente o canto vazio do mapa: rígido e leve.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'a', rot: 'Material A: 1 aço · 2 alumínio · 3 CFRP · 4 alumina', min: 1, max: 4, val: 3, passo: 1 },
      { id: 'b', rot: 'Material B: 1 espuma rígida · 2 polipropileno · 3 madeira · 4 cortiça', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'fv', rot: 'Fração do material A', min: 0, max: 100, val: 20, passo: 1, un: '%' }
    ],
    desenhar: function (g, p) {
      var A = SM.porId(['aco', 'al6061', 'cfrp', 'alumina'][Math.round(p.a) - 1]);
      var B = SM.porId(['espumaR', 'pp', 'madeira', 'cortica'][Math.round(p.b) - 1]);
      var f = p.fv / 100;
      var rho = f * A.rho + (1 - f) * B.rho;
      var Ev = f * A.E + (1 - f) * B.E;                      /* Voigt */
      var Er = 1 / (f / A.E + (1 - f) / B.E);                /* Reuss */
      var gx = 1.4, gy = 0.9, gw = 5.4, gh = 4.1;
      var X = escalaLog(50, 20000, gx, gx + gw);
      var Y = escalaLog(0.001, 1000, gy, gy + gh);
      decadas(50, 20000).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), X(d), gy - 0.35, { cor: 'fraco', tam: 9.5 });
      });
      decadas(0.001, 1000).forEach(function (d) {
        g.linha(gx, Y(d), gx + gw, Y(d), { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), gx - 0.15, Y(d), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      SM.mats.forEach(function (m) {
        g.circ(X(m.rho), Y(m.E), 0.08, { preenche: 'fraco', cor: null, alfa: 0.4 });
      });
      var i, pv = [], pr = [];
      for (i = 0; i <= 40; i++) {
        var ff = i / 40;
        var r = ff * A.rho + (1 - ff) * B.rho;
        pv.push([X(r), Y(ff * A.E + (1 - ff) * B.E)]);
        pr.push([X(r), Y(1 / (ff / A.E + (1 - ff) / B.E))]);
      }
      g.caminho(pv, { cor: 'ok', larg: 2.4 });
      g.caminho(pr, { cor: 'erro', larg: 2.4, tracejado: [6, 4] });
      g.txt('Voigt (em paralelo)', pv[16][0] - 0.18, pv[16][1] + 0.30, { cor: 'ok', tam: 10, alin: 'dir', fundo: true });
      g.txt('Reuss (em série)', pr[22][0], pr[22][1] - 0.34, { cor: 'erro', tam: 10, fundo: true });
      g.circ(X(A.rho), Y(A.E), 0.15, { preenche: CORFAM[A.fam], cor: null });
      g.txt(curto(A.nome), X(A.rho), Y(A.E) + 0.3, { cor: CORFAM[A.fam], tam: 10, fundo: true });
      g.circ(X(B.rho), Y(B.E), 0.15, { preenche: CORFAM[B.fam], cor: null });
      g.txt(curto(B.nome), X(B.rho), Y(B.E) - 0.3, { cor: CORFAM[B.fam], tam: 10, fundo: true });
      g.circ(X(rho), Y(Ev), 0.17, { cor: 'texto', larg: 2 });
      g.txt('ρ (kg/m³)', gx + gw / 2, gy - 0.8, { cor: 'fraco', tam: 11 });
      g.txt('E (GPa)', gx - 0.1, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var Msand = Math.pow(Ev, 1 / 3) / rho * 1000;
      var Maco = Math.pow(SM.porId('aco').E, 1 / 3) / SM.porId('aco').rho * 1000;
      var xr = 7.4;
      g.txt('híbrido com ' + fx(p.fv, 0) + ' % de ' + curto(A.nome), xr, 5.0, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      g.txt('ρ = ' + fx(rho, 0) + ' kg/m³', xr, 4.35, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('E entre ' + fx(Er, 2) + ' e ' + fx(Ev, 1) + ' GPa', xr, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('(Reuss e Voigt)', xr, 3.35, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('índice de painel E^⅓/ρ', xr, 2.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Msand, 3) + ' contra ' + fx(Maco, 3) + ' do aço', xr, 2.2, { cor: Msand > Maco ? 'ok' : 'aviso', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('o sanduíche fica perto do limite', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('de Voigt em flexão: as faces', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('trabalham longe da linha neutra', xr, 0.7, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('os limites valem para qualquer arranjo: nada pode estar acima de Voigt', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 11.1 — seleção de processo ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'O processo tem suas próprias restrições: massa, espessura, tolerância e tamanho de lote. Um material que não pode ser conformado na forma pedida simplesmente sai da lista, por melhor que seja seu índice.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'massa', rot: 'Massa da peça', min: 0.01, max: 1000, val: 2, passo: 0.01, un: 'kg' },
      { id: 'lote', rot: 'Tamanho do lote', min: 1, max: 1000000, val: 10000, passo: 1, un: 'peças' }
    ],
    desenhar: function (g, p) {
      var proc = [
        { nome: 'fundição em areia', m0: 0.1, m1: 1000, l0: 1, l1: 10000, fam: 'metais' },
        { nome: 'fundição sob pressão', m0: 0.01, m1: 50, l0: 1000, l1: 1000000, fam: 'metais' },
        { nome: 'forjamento', m0: 0.1, m1: 500, l0: 100, l1: 1000000, fam: 'metais' },
        { nome: 'usinagem', m0: 0.001, m1: 1000, l0: 1, l1: 10000, fam: 'metais' },
        { nome: 'injeção de polímero', m0: 0.001, m1: 25, l0: 10000, l1: 1000000, fam: 'polímeros' },
        { nome: 'extrusão', m0: 0.01, m1: 100, l0: 1000, l1: 1000000, fam: 'polímeros' },
        { nome: 'laminação manual', m0: 0.1, m1: 1000, l0: 1, l1: 1000, fam: 'compósitos' },
        { nome: 'prensagem de pó', m0: 0.001, m1: 10, l0: 1000, l1: 1000000, fam: 'cerâmicos' },
        { nome: 'impressão 3D', m0: 0.001, m1: 10, l0: 1, l1: 1000, fam: 'vários' }
      ];
      var gx = 3.0, gw = 5.0, gy = 0.9, gh = 4.1;
      var X = escalaLog(0.001, 1000, gx, gx + gw);
      decadas(0.001, 1000).forEach(function (d) {
        g.linha(X(d), gy, X(d), gy + gh, { cor: 'borda', larg: 1, tracejado: [4, 4] });
        g.txt(rotLog(d), X(d), gy - 0.35, { cor: 'fraco', tam: 9.5 });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      var h = gh / proc.length;
      proc.forEach(function (pr, i) {
        var y = gy + gh - (i + 0.5) * h;
        var okLote = p.lote >= pr.l0 && p.lote <= pr.l1;
        var okMassa = p.massa >= pr.m0 && p.massa <= pr.m1;
        var ok = okLote && okMassa;
        g.ret(X(pr.m0), y - h * 0.3, X(pr.m1) - X(pr.m0), h * 0.6,
          { cor: 'fundo', larg: 1, preenche: ok ? 'ok' : okMassa ? 'aviso' : 'fraco', alfa: ok ? 0.8 : 0.3 });
        g.txt(pr.nome, gx - 0.2, y, { cor: ok ? 'ok' : 'fraco', tam: 10, alin: 'dir' });
      });
      g.linha(X(p.massa), gy, X(p.massa), gy + gh, { cor: 'erro', larg: 1.8, tracejado: [5, 4] });
      g.txt(fx(p.massa, 3) + ' kg', X(p.massa), gy + gh + 0.3, { cor: 'erro', tam: 11, negrito: true, fundo: true });
      g.txt('massa da peça (kg, log)', gx + gw / 2, gy - 0.8, { cor: 'fraco', tam: 11 });
      var viaveis = proc.filter(function (pr) {
        return p.lote >= pr.l0 && p.lote <= pr.l1 && p.massa >= pr.m0 && p.massa <= pr.m1;
      });
      var xr = 8.6;
      g.txt('lote de ' + (p.lote >= 1000 ? fx(p.lote / 1000, 0) + ' mil' : fx(p.lote, 0)) + ' peças',
        xr, 5.0, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      g.txt(viaveis.length + ' processos viáveis', xr, 4.4, { cor: viaveis.length ? 'ok' : 'erro', tam: 13, alin: 'esq', negrito: true });
      var yy = 3.95;
      viaveis.slice(0, 7).forEach(function (pr) {
        g.txt('· ' + pr.nome, xr, yy, { cor: 'ok', tam: 10.5, alin: 'esq' });
        g.txt(pr.fam, xr + 0.3, yy - 0.26, { cor: 'fraco', tam: 9.5, alin: 'esq' });
        yy -= 0.56;
      });
      if (viaveis.length > 7) g.txt('… e mais ' + (viaveis.length - 7), xr, yy, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      if (!viaveis.length) g.txt('reveja massa ou lote', xr, 3.95, { cor: 'erro', tam: 11.5, alin: 'esq' });
      g.txt('verde: viável · amarelo: massa cabe, mas o lote não · faixas típicas', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 12.1 — eco-seleção ---------- */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Trocar aço por alumínio num automóvel só compensa em energia se a vida for longa o bastante: a energia a mais na produção precisa ser paga pela economia de combustível. Com alumínio reciclado, a conta fecha de imediato.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'km', rot: 'Vida do veículo', min: 50, max: 500, val: 200, passo: 10, un: 'mil km' },
      { id: 'reciclado', rot: 'Alumínio: 0 primário · 1 reciclado', min: 0, max: 1, val: 0, passo: 1 },
      { id: 'cons', rot: 'Consumo por 100 kg de massa', min: 0.2, max: 1.0, val: 0.5, passo: 0.05, un: 'L/100 km' }
    ],
    desenhar: function (g, p) {
      var km = p.km * 1000, PCI = 34.8, k = p.cons;
      var Hal = Math.round(p.reciclado) ? 25 : 200;
      var casos = [
        { nome: 'aço', massa: 1200, Hm: 29, cor: 's1' },
        { nome: 'alumínio', massa: 900, Hm: Hal, cor: 'erro' }
      ].map(function (c) {
        var Em = c.massa * c.Hm / 1000;
        var Euso = (k * c.massa / 100) / 100 * km * PCI / 1000;
        return { nome: c.nome, massa: c.massa, Em: Em, Euso: Euso, tot: Em + Euso, cor: c.cor };
      });
      var dEm = casos[1].Em - casos[0].Em;
      var porKm = ((k * casos[0].massa / 100) - (k * casos[1].massa / 100)) / 100 * PCI / 1000;  /* GJ/km */
      var kmEq = porKm > 0 ? dEm / porKm : Infinity;
      var gx = 1.6, gy = 1.0, gw = 4.4, gh = 3.8;
      var vmax = Math.max(casos[0].tot, casos[1].tot) * 1.2;
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      casos.forEach(function (c, i) {
        var xc = gx + gw * (i + 0.5) / 2, bw = gw / 4;
        var hm = gh * c.Em / vmax, hu = gh * c.Euso / vmax;
        g.ret(xc - bw / 2, gy, bw, hm, { cor: 'fundo', larg: 1, preenche: 'aviso', alfa: 0.85 });
        g.ret(xc - bw / 2, gy + hm, bw, hu, { cor: 'fundo', larg: 1, preenche: 's1', alfa: 0.7 });
        g.txt(fx(c.tot, 0) + ' GJ', xc, gy + hm + hu + 0.3, { cor: 'texto', tam: 12, negrito: true });
        g.txt(c.nome + ' · ' + fx(c.massa, 0) + ' kg', xc, gy - 0.35, { cor: 'suave', tam: 11 });
        if (hm > 0.35) g.txt(fx(c.Em, 0), xc, gy + hm / 2, { cor: 'texto', tam: 10 });
        if (hu > 0.35) g.txt(fx(c.Euso, 0), xc, gy + hm + hu / 2, { cor: 'texto', tam: 10 });
      });
      g.ret(gx + 0.1, gy - 0.95, 0.22, 0.22, { preenche: 'aviso', cor: null });
      g.txt('produção do material', gx + 0.45, gy - 0.84, { cor: 'aviso', tam: 10.5, alin: 'esq' });
      g.ret(gx + 3.05, gy - 0.95, 0.22, 0.22, { preenche: 's1', cor: null });
      g.txt('uso (combustível)', gx + 3.4, gy - 0.84, { cor: 's1', tam: 10.5, alin: 'esq' });
      g.txt('energia de ciclo de vida (GJ)', gx - 0.1, gy + gh + 0.45, { cor: 'fraco', tam: 11, alin: 'esq' });
      var venceu = casos[1].tot < casos[0].tot;
      var xr = 6.6;
      g.txt(Math.round(p.reciclado) ? 'alumínio reciclado (25 MJ/kg)' : 'alumínio primário (200 MJ/kg)',
        xr, 5.0, { cor: 'texto', tam: 12, alin: 'esq', negrito: true });
      g.txt('energia a mais no material', xr, 4.35, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt((dEm > 0 ? '+' : '') + fx(dEm, 1) + ' GJ', xr, 3.85, { cor: dEm > 0 ? 'erro' : 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt('economia no uso ' + fx(porKm * 1000, 3) + ' MJ/km', xr, 3.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(dEm <= 0 ? 'paga desde o primeiro quilômetro' :
        'equilíbrio em ' + fx(kmEq / 1000, 0) + ' mil km', xr, 2.5,
        { cor: dEm <= 0 ? 'ok' : kmEq <= km ? 'ok' : 'aviso', tam: 13, alin: 'esq', negrito: true });
      g.txt('com ' + fx(p.km, 0) + ' mil km de vida:', xr, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(venceu ? 'o alumínio compensa' : 'o aço ainda gasta menos no total',
        xr, 1.3, { cor: venceu ? 'ok' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('diferença de ' + fx(Math.abs(casos[0].tot - casos[1].tot), 0) + ' GJ', xr, 0.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('gasolina a 34,8 MJ/L · a fase de uso domina quase sempre em produto que se move', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

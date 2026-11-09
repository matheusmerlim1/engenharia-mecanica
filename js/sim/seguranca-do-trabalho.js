/* ============================================================
   Simuladores de Segurança do Trabalho
   1 · Dose de ruído na jornada (NR-15 e NHO 01) — animado
   2 · Queda com talabarte e absorvedor (NR-35) — animado
   3 · Atmosfera inflamável e purga por ventilação — animado
   ============================================================ */
(function (global) {
  'use strict';
  var g0 = 9.81, ST = {};

  /* NR-15, Anexo 1: nível em dB(A) e máxima exposição diária em minutos */
  ST.TAB15 = [[85, 480], [86, 420], [87, 360], [88, 300], [89, 270], [90, 240], [91, 210], [92, 180], [93, 160], [94, 135], [95, 120], [96, 105], [98, 75], [100, 60], [102, 45], [104, 35], [105, 30], [106, 25], [108, 20], [110, 15], [112, 10], [114, 8], [115, 7]];
  /* nível intermediário: vale o tempo do nível imediatamente mais elevado (item 4 do Anexo 1) */
  ST.t15 = function (L) {
    if (L < 85) return Infinity;
    for (var i = 0; i < ST.TAB15.length; i++) if (L <= ST.TAB15[i][0]) return ST.TAB15[i][1];
    return 0;
  };
  ST.tNHO = function (L) { return L < 80 ? Infinity : 480 / Math.pow(2, (L - 85) / 3); };
  /* períodos: [{L, h}] — devolve dose em %, contribuições e nível equivalente em 8 h */
  ST.dose = function (per, crit) {
    var f = crit === 'nho' ? ST.tNHO : ST.t15, soma = 0, proibido = false;
    var partes = per.map(function (q) {
      var T = f(q.L), c = q.h * 60;
      if (T === 0) { proibido = proibido || q.h > 0; return 0; }
      var u = T === Infinity ? 0 : c / T; soma += u; return u;
    });
    var D = 100 * soma, Leq = D > 0 ? (crit === 'nho' ? 85 + 10 * Math.log10(D / 100) : 85 + 16.61 * Math.log10(D / 100)) : NaN;
    return { D: D, partes: partes, Leq: Leq, proibido: proibido };
  };
  ST.somaDB = function (a) { return 10 * Math.log10(a.reduce(function (s, L) { return s + Math.pow(10, L / 10); }, 0)); };

  /* calor — relação que reproduz o Quadro 1 do Anexo 3 da NR-15 */
  ST.limCalor = function (M) { return 56.7 - 11.5 * Math.log10(M); };
  ST.ibutg = function (tbn, tg, tbs, sol) { return sol ? 0.7 * tbn + 0.2 * tg + 0.1 * tbs : 0.7 * tbn + 0.3 * tg; };

  /* NR-35: queda livre seguida de frenagem a força constante do absorvedor */
  ST.queda = function (o) {
    var ff = Math.max(0, o.L - o.A), fator = ff / o.L, peso = o.m * g0;
    var d = peso * ff / (o.F - peso), t1 = Math.sqrt(2 * ff / g0), v = g0 * t1, a = (o.F - peso) / o.m, t2 = v / a;
    return {
      ff: ff, fator: fator, d: d, t1: t1, t2: t2, v: v, peso: peso,
      y: function (t) { if (t <= t1) return 0.5 * g0 * t * t; if (t <= t1 + t2) { var u = t - t1; return ff + v * u - 0.5 * a * u * u; } return ff + d; },
      Frigido: peso + Math.sqrt(peso * peso + 2 * peso * (o.EA || 1e5) * fator)
    };
  };

  /* Le Chatelier e purga por diluição em mistura perfeita */
  ST.GASES = { ch4: { n: 'metano', lie: 5.0, lse: 15 }, c2: { n: 'etano', lie: 3.0, lse: 12.4 }, c3: { n: 'propano', lie: 2.1, lse: 9.5 } };
  ST.mistura = function (y) {
    var tot = (y.ch4 + y.c2 + y.c3) || 1, a = 0, b = 0;
    ['ch4', 'c2', 'c3'].forEach(function (k) { var f = 100 * y[k] / tot; a += f / ST.GASES[k].lie; b += f / ST.GASES[k].lse; });
    return { lie: 100 / a, lse: 100 / b };
  };
  ST.tempoPurga = function (C0, Cf, V, Q) { return C0 <= Cf ? 0 : (V / Q) * Math.log(C0 / Cf) * 60; };

  /* NR-13 */
  ST.grupo = function (PV) { return PV >= 100 ? 1 : PV >= 30 ? 2 : PV >= 2.5 ? 3 : PV >= 1 ? 4 : 5; };
  ST.TAB13 = { A: [1, 1, 2, 3, 3], B: [1, 2, 3, 4, 4], C: [1, 2, 3, 4, 5], D: [2, 3, 4, 5, 5] };
  ST.INSP13 = [null, [1, 3, 3, 6], [2, 4, 4, 8], [3, 6, 5, 10], [4, 8, 6, 12], [5, 10, 7, null]];
  ST.categoria = function (PV, cl) { return ST.TAB13[cl][ST.grupo(PV) - 1]; };

  /* NR-10, tabela de raios: limite superior da faixa em kV, Rr e Rc em metros */
  ST.TAB10 = [[1, .2, .7], [3, .22, 1.22], [6, .25, 1.25], [10, .35, 1.35], [15, .38, 1.38], [20, .4, 1.4], [30, .56, 1.56], [36, .58, 1.58], [45, .63, 1.63], [60, .83, 1.83], [70, .9, 1.9], [110, 1, 2], [132, 1.1, 3.1], [150, 1.2, 3.2], [220, 1.6, 3.6], [275, 1.8, 3.8], [380, 2.5, 4.5], [480, 3.2, 5.2], [700, 5.2, 7.2]];
  ST.zonas = function (kV) { for (var i = 0; i < ST.TAB10.length; i++) if (kV < ST.TAB10[i][0]) return { Rr: ST.TAB10[i][1], Rc: ST.TAB10[i][2] }; return null; };

  /* NR-12, Anexo I: distância mínima da cortina de luz, em mm */
  ST.adicionalC = function (d) { return d <= 14 ? 0 : d <= 20 ? 80 : d <= 30 ? 130 : d <= 40 ? 240 : 850; };
  ST.distancia = function (T, d) {
    var C = ST.adicionalC(d), S = 2000 * T + C, K = 2000;
    if (S > 500) { K = 1600; S = Math.max(500, 1600 * T + C); }
    return { S: S, K: K, C: C };
  };

  /* taxas da ABNT NBR 14280 */
  ST.TF = function (n, H) { return n * 1e6 / H; };
  ST.TG = function (dias, H) { return dias * 1e6 / H; };

  global.ST = ST;
  var Sim = global.Sim, Plot = global.Plot;
  if (!Sim) return;
  var cor = function (i) { return Plot.serie(i); };
  var nt = function (v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 2 : n }); };
  function animador(desenhar, periodo) {
    var A = { on: false, t: 0, ctx: null }, ult = 0;
    function tick(t) {
      global.requestAnimationFrame(tick);
      if (!A.on || !A.ctx || !A.ctx.root.getClientRects().length) return;
      if (t - ult < periodo) return;
      ult = t; A.t += 1; desenhar(A);
    }
    global.requestAnimationFrame(tick);
    return A;
  }

  function montarRuido() {
    if (!document.getElementById('sim-ruido')) return;
    var A = animador(function (a) { desenha(a); }, 60);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var fr = d.total > 0 ? (a.t % 130) / 110 : 0, h = Math.min(1, fr) * d.total, g = a.ctx.plot('jornada').clear(), i, acum = 0, ini = 0;
      for (i = 0; i < d.pts.length - 1; i++) if (h >= d.pts[i][0]) { var q = d.pts[i], r = d.pts[i + 1]; acum = h >= r[0] ? r[1] : q[1] + (r[1] - q[1]) * (r[0] > q[0] ? (h - q[0]) / (r[0] - q[0]) : 0); }
      g.setLimits([0, Math.max(8, d.total)], [0, d.ymax]);
      g.line(d.pts.map(function (p) { return p[0]; }), d.pts.map(function (p) { return p[1]; }), { color: cor(0), width: 2.4, label: 'dose acumulada' });
      g.hline(100, { color: cor(3), width: 1.5, dash: [6, 4], text: 'limite' });
      g.hline(50, { color: cor(2), width: 1.3, dash: [3, 4], text: 'nível de ação' });
      g.points([h], [acum], { color: cor(3), size: 5 });
      g.draw(); ini = acum; return ini;
    }
    Sim.build('#sim-ruido', {
      titulo: '1. Dose de ruído na jornada',
      descricao: 'A dose soma, período a período, o tempo exposto dividido pelo tempo permitido. Compare o critério legal da NR-15 com o da NHO 01, que é mais rigoroso, e veja o efeito do protetor.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: '3 h a 90, 2 h a 95, 3 h a 85', valores: { crit: 'nr15', L1: 90, h1: 3, L2: 95, h2: 2, L3: 85, h3: 3, nrr: 0 } },
        { nome: '2 · Mesma jornada na NHO 01', desc: 'q = 3 dB', valores: { crit: 'nho', L1: 90, h1: 3, L2: 95, h2: 2, L3: 85, h3: 3, nrr: 0 } },
        { nome: '3 · Com protetor', desc: 'NRRsf de 8 dB', valores: { crit: 'nr15', L1: 90, h1: 3, L2: 95, h2: 2, L3: 85, h3: 3, nrr: 8 } },
        { nome: '4 · Limite exato', desc: '85 dB(A) por 8 h', valores: { crit: 'nr15', L1: 85, h1: 8, L2: 85, h2: 0, L3: 85, h3: 0, nrr: 0 } }
      ],
      controles: [
        { id: 'crit', tipo: 'seg', label: 'Critério', valor: 'nr15', opcoes: [{ v: 'nr15', t: 'NR-15 (q = 5)' }, { v: 'nho', t: 'NHO 01 (q = 3)' }] },
        { id: 'L1', label: 'Nível no período 1', min: 70, max: 115, step: 1, valor: 90, unidade: 'dB(A)' },
        { id: 'h1', label: 'Duração do período 1', min: 0, max: 12, step: 0.25, valor: 3, unidade: 'h' },
        { id: 'L2', label: 'Nível no período 2', min: 70, max: 115, step: 1, valor: 95, unidade: 'dB(A)' },
        { id: 'h2', label: 'Duração do período 2', min: 0, max: 12, step: 0.25, valor: 2, unidade: 'h' },
        { id: 'L3', label: 'Nível no período 3', min: 70, max: 115, step: 1, valor: 85, unidade: 'dB(A)' },
        { id: 'h3', label: 'Duração do período 3', min: 0, max: 12, step: 0.25, valor: 3, unidade: 'h' },
        { id: 'nrr', label: 'Atenuação do protetor (NRRsf)', min: 0, max: 30, step: 1, valor: 0, unidade: 'dB' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'jornada', titulo: 'Dose acumulada ao longo da jornada', xlabel: 'tempo (h)', ylabel: 'dose (%)', aspect: 0.5, legendPos: 'topleft' },
        { id: 'partes', titulo: 'Contribuição de cada período', xlabel: 'período', ylabel: 'dose (%)', aspect: 0.42, legend: false }
      ],
      saidas: [{ id: 'D', label: 'Dose diária' }, { id: 'Leq', label: 'Nível equivalente em 8 h' }, { id: 'folga', label: 'Margem até o limite' }, { id: 'sit', label: 'Situação' }],
      formulas: [
        { tex: 'D = 100\\,\\sum_i \\frac{C_i}{T_i}', d: 'dose em %, com C e T no mesmo tempo', destaque: true },
        { tex: 'T_{NHO} = \\frac{480}{2^{(L-85)/3}}', d: 'tempo permitido em minutos, NHO 01' },
        { tex: 'L_{eq,NR15} = 85 + 16{,}61\\log_{10}(D/100)', d: 'jornada de referência de 8 h' }
      ],
      nota: 'Na NR-15 valem os tempos do Quadro do Anexo 1, e nível intermediário usa o tempo do nível imediatamente mais elevado. Abaixo de 85 dB(A) o Quadro não traz limite. Na NHO 01 entram no cálculo os níveis a partir de 80 dB(A). O protetor é abatido diretamente do nível.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var per = [{ L: p.L1 - p.nrr, h: p.h1 }, { L: p.L2 - p.nrr, h: p.h2 }, { L: p.L3 - p.nrr, h: p.h3 }], R = ST.dose(per, p.crit), pts = [[0, 0]], tt = 0, ac = 0;
        per.forEach(function (q, i) { tt += q.h; ac += 100 * R.partes[i]; pts.push([tt, ac]); });
        A.dados = { pts: pts, total: tt, ymax: Math.max(120, R.D * 1.15) };
        desenha(A);
        var gb = ctx.plot('partes').clear();
        gb.setLimits([0.4, 3.6], [0, Math.max(10, 100 * Math.max.apply(null, R.partes)) * 1.2]);
        gb.bars([1, 2, 3], R.partes.map(function (u) { return 100 * u; }), { color: cor(1), width: 0.55 });
        gb.draw();
        var maior = R.partes.indexOf(Math.max.apply(null, R.partes)) + 1, acao = R.D >= 50 && R.D <= 100;
        var sit = R.proibido ? 'proibido sem proteção' : R.D > 100 ? 'acima do limite' : acao ? 'acima do nível de ação' : 'abaixo do nível de ação';
        var classe = R.proibido || R.D > 100 ? 'alerta' : acao ? 'destaque' : 'ok';
        ctx.setPassos([
          { t: '① Tempo permitido em cada nível', obs: per.map(function (q, i) { var T = p.crit === 'nho' ? ST.tNHO(q.L) : ST.t15(q.L); return 'P' + (i + 1) + ': ' + (T === Infinity ? 'sem limite' : T === 0 ? 'proibido' : nt(T, 0) + ' min'); }).join(' · ') },
          { t: '② Soma das frações', obs: 'A dose é ' + nt(R.D, 1) + ' %. O período ' + maior + ' pesa mais.' },
          { t: '③ Decisão', obs: R.D > 100 ? 'Reduzir o nível na fonte, depois o tempo. O protetor é a última medida.' : acao ? 'Dentro do limite, mas o controle sistemático e o monitoramento são exigidos.' : 'Manter o reconhecimento atualizado no PGR.' }
        ]);
        return { D: { v: R.D, u: '%', classe: classe }, Leq: { v: isNaN(R.Leq) ? '—' : R.Leq, u: 'dB(A)' }, folga: { v: 100 - R.D, u: '%' }, sit: { v: sit, classe: classe } };
      }
    });
  }

  function montarQueda() {
    if (!document.getElementById('sim-queda')) return;
    var A = animador(function (a) { desenha(a); }, 30), H_ARG = 1.5;
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var fim = d.q.t1 + d.q.t2, ciclo = fim + 1.3, tv = (a.t * 0.03) % (ciclo + 0.7), t = Math.max(0, tv - 0.7), y = d.q.y(t), g = a.ctx.plot('anim').clear();
      var yAnc = H_ARG + d.A, yArg = H_ARG - y, yTopo = Math.max(yAnc, 3.2) + 0.5;
      g.setLimits([0, 6], [-d.H - 0.5, yTopo]);
      g.custom(function (c, pl) {
        var X = function (v) { return pl.px(v); }, Y = function (v) { return pl.py(v); }, xp = 2.6;
        c.fillStyle = cor(7); c.globalAlpha = 0.35; c.fillRect(X(0), Y(0), X(2.2) - X(0), 8); c.fillRect(X(0), Y(-d.H), X(6) - X(0), 10); c.globalAlpha = 1;
        c.strokeStyle = cor(7); c.lineWidth = 3; c.beginPath(); c.moveTo(X(2.2), Y(yTopo)); c.lineTo(X(2.2), Y(-0.05)); c.stroke();
        c.fillStyle = cor(3); c.beginPath(); c.arc(X(2.2), Y(yAnc), 5, 0, 7); c.fill();
        var abs = Math.max(0, y - d.q.ff), yAbs = yAnc - abs;
        c.strokeStyle = cor(3); c.lineWidth = 4; c.beginPath(); c.moveTo(X(2.2), Y(yAnc)); c.lineTo(X(xp), Y(yAbs)); c.stroke();
        c.strokeStyle = cor(1); c.lineWidth = 2; c.beginPath(); c.moveTo(X(xp), Y(yAbs)); c.lineTo(X(xp), Y(yArg)); c.stroke();
        c.strokeStyle = cor(0); c.lineWidth = 3; c.beginPath(); c.moveTo(X(xp), Y(yArg + 0.15)); c.lineTo(X(xp), Y(yArg - 0.75)); c.moveTo(X(xp), Y(yArg - 0.75)); c.lineTo(X(xp - 0.22), Y(yArg - 1.5)); c.moveTo(X(xp), Y(yArg - 0.75)); c.lineTo(X(xp + 0.22), Y(yArg - 1.5)); c.moveTo(X(xp - 0.28), Y(yArg - 0.1)); c.lineTo(X(xp + 0.28), Y(yArg - 0.1)); c.stroke();
        c.fillStyle = cor(0); c.beginPath(); c.arc(X(xp), Y(yArg + 0.32), 7, 0, 7); c.fill();
        var pes = yArg - 1.5, livre = pes + d.H;
        c.fillStyle = getComputedStyle(a.ctx.root).color; c.font = '12px system-ui, sans-serif'; c.textAlign = 'left';
        c.fillText('t = ' + nt(t, 2) + ' s', X(3.2), Y(yTopo) + 18);
        c.fillText(t <= d.q.t1 ? 'queda livre' : t <= fim ? 'absorvedor abrindo' : 'retido', X(3.2), Y(yTopo) + 35);
        c.fillText('folga até o obstáculo: ' + nt(livre, 2) + ' m', X(3.2), Y(yTopo) + 52);
        c.fillText('obstáculo', X(0.1), Y(-d.H) - 5);
      });
      g.draw();
    }
    Sim.build('#sim-queda', {
      titulo: '2. Queda com talabarte e absorvedor de energia',
      descricao: 'Mude a altura da ancoragem e veja o fator de queda, o quanto o absorvedor abre e se o trabalhador para antes do obstáculo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'Ancoragem nos pés, fator 2', valores: { m: 100, L: 1.8, A: -1.8, F: 4, H: 6 } },
        { nome: '2 · Ancoragem acima', desc: 'Fator menor que 1', valores: { m: 100, L: 1.8, A: 1, F: 4, H: 6 } },
        { nome: '3 · Pouca altura livre', desc: 'Atinge o solo', valores: { m: 100, L: 1.8, A: -1.8, F: 4, H: 3.5 } },
        { nome: '4 · Absorvedor rígido', desc: 'Passa de 6 kN', valores: { m: 100, L: 1.8, A: -1.8, F: 7, H: 6 } }
      ],
      controles: [
        { id: 'm', label: 'Massa do trabalhador com ferramentas', min: 60, max: 140, step: 5, valor: 100, unidade: 'kg' },
        { id: 'L', label: 'Comprimento do talabarte', min: 0.6, max: 2, step: 0.1, valor: 1.8, unidade: 'm' },
        { id: 'A', label: 'Ancoragem acima do engate dorsal', min: -2, max: 1.5, step: 0.1, valor: -1.8, unidade: 'm' },
        { id: 'F', label: 'Força de frenagem do absorvedor', min: 2, max: 8, step: 0.25, valor: 4, unidade: 'kN' },
        { id: 'H', label: 'Altura livre abaixo da plataforma', min: 2, max: 10, step: 0.1, valor: 6, unidade: 'm' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'A queda em escala', height: 330, grid: false, legend: false, xticks: 0 },
        { id: 'f', titulo: 'Força sobre o trabalhador', xlabel: 'tempo (s)', ylabel: 'força (kN)', aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [{ id: 'fator', label: 'Fator de queda' }, { id: 'ff', label: 'Queda livre' }, { id: 'v', label: 'Velocidade ao frear' }, { id: 'd', label: 'Abertura do absorvedor' }, { id: 'zlq', label: 'Zona livre abaixo da ancoragem' }, { id: 'folga', label: 'Folga final' }, { id: 'rig', label: 'Força se não houvesse absorvedor' }],
      formulas: [
        { tex: 'FQ = \\frac{h_{livre}}{L}', d: 'fator de queda', destaque: true },
        { tex: 'd = \\frac{m\\,g\\,h_{livre}}{F - m\\,g}', d: 'balanço de energia na frenagem' },
        { tex: 'ZLQ = L + d + 1{,}5 + 1{,}0', d: 'altura do engate aos pés e margem, em metros' }
      ],
      nota: 'Modelo: queda livre seguida de força de frenagem constante. O valor sem absorvedor é ilustrativo, com talabarte elástico de rigidez axial EA = 100 kN. Curso máximo adotado para o absorvedor: 1,75 m. Em projeto real, valem as curvas e os dados do fabricante.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var An = Math.max(p.A, -p.L), q = ST.queda({ m: p.m, L: p.L, A: An, F: p.F * 1000 }), pe = q.peso / 1000, fim = q.t1 + q.t2, zlq = p.L + q.d + H_ARG + 1, folga = p.H - q.ff - q.d, ok = folga >= 1, esgota = q.d > 1.75;
        A.dados = { q: q, A: An, H: p.H };
        desenha(A);
        var g = ctx.plot('f').clear();
        g.setLimits([0, Math.max(fim * 1.25, 0.2)], [0, Math.max(p.F, 6) * 1.25]);
        g.line([0, q.t1, q.t1, fim, fim, fim * 1.25], [0, 0, p.F, p.F, pe, pe], { color: cor(0), width: 2.6, label: 'no trabalhador' });
        g.hline(6, { color: cor(3), width: 1.5, dash: [6, 4], text: '6 kN' });
        g.draw();
        ctx.setPassos([
          { t: '① Queda livre', obs: nt(q.ff, 2) + ' m (fator ' + nt(q.fator, 2) + '), chegando a ' + nt(q.v, 1) + ' m/s.' },
          { t: '② Frenagem', obs: 'O absorvedor dissipa a energia em ' + nt(q.d, 2) + ' m.' + (esgota ? ' Passa do curso máximo adotado: a força real sobe no fim.' : '') },
          { t: '③ Verificação', obs: (p.F > 6 ? 'Força acima de 6 kN: o sistema não atende à NR-35. ' : '') + (ok ? 'Sobra ' + nt(folga, 2) + ' m até o obstáculo.' : folga > 0 ? 'A margem de 1 m não é atendida.' : 'O trabalhador atinge o obstáculo.') }
        ]);
        return { fator: { v: q.fator, classe: q.fator > 1 ? 'alerta' : 'ok' }, ff: { v: q.ff, u: 'm' }, v: { v: q.v, u: 'm/s' }, d: { v: q.d, u: 'm', classe: esgota ? 'alerta' : '' }, zlq: { v: zlq, u: 'm', classe: 'destaque' }, folga: { v: folga, u: 'm', classe: ok ? 'ok' : 'alerta' }, rig: { v: q.Frigido / 1000, u: 'kN', classe: 'alerta' } };
      }
    });
  }

  function montarPurga() {
    if (!document.getElementById('sim-purga')) return;
    var A = animador(function (a) { desenha(a); }, 50);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var fr = (a.t % 170) / 150, t = Math.min(1, fr) * d.tmax, C = d.C0 * Math.exp(-d.Q * t / 60 / d.V), g = a.ctx.plot('c').clear();
      g.setLimits([0, d.tmax], [Math.log10(d.ymin), Math.log10(d.ymax)]);
      var ts = Plot.linspace(0, d.tmax, 120);
      g.line(ts, ts.map(function (u) { return Math.log10(Math.max(d.ymin, d.C0 * Math.exp(-d.Q * u / 60 / d.V))); }), { color: cor(0), width: 2.5, label: 'concentração' });
      g.hline(Math.log10(d.m.lse), { color: cor(3), width: 1.4, dash: [6, 4], text: 'LSE' });
      g.hline(Math.log10(d.m.lie), { color: cor(3), width: 1.8, text: 'LIE' });
      g.hline(Math.log10(d.m.lie * 0.1), { color: cor(2), width: 1.5, dash: [4, 4], text: '10 % do LIE' });
      g.points([t], [Math.log10(Math.max(d.ymin, C))], { color: cor(3), size: 5 });
      g.draw();
    }
    Sim.build('#sim-purga', {
      titulo: '3. Atmosfera inflamável e purga por ventilação',
      descricao: 'A regra de Le Chatelier dá o limite da mistura. A curva mostra quanto tempo a ventilação leva para trazer o ambiente a 10 % do LIE, e se ele atravessa a faixa explosiva no caminho.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'Gás natural num tanque', valores: { ch4: 80, c2: 15, c3: 5, C0: 3, V: 200, Q: 1000 } },
        { nome: '2 · Partindo da mistura rica', desc: 'Atravessa a faixa', valores: { ch4: 100, c2: 0, c3: 0, C0: 18, V: 200, Q: 1000 } },
        { nome: '3 · Ventilação fraca', desc: 'Purga demorada', valores: { ch4: 80, c2: 15, c3: 5, C0: 3, V: 800, Q: 300 } },
        { nome: '4 · Propano', desc: 'LIE baixo', valores: { ch4: 0, c2: 0, c3: 100, C0: 2, V: 200, Q: 1000 } }
      ],
      controles: [
        { id: 'ch4', label: 'Metano na mistura combustível', min: 0, max: 100, step: 1, valor: 80, unidade: '%' },
        { id: 'c2', label: 'Etano', min: 0, max: 100, step: 1, valor: 15, unidade: '%' },
        { id: 'c3', label: 'Propano', min: 0, max: 100, step: 1, valor: 5, unidade: '%' },
        { id: 'C0', label: 'Concentração inicial no ar', min: 0.2, max: 25, step: 0.1, valor: 3, unidade: '% vol' },
        { id: 'V', label: 'Volume do espaço', min: 10, max: 2000, step: 10, valor: 200, unidade: 'm³' },
        { id: 'Q', label: 'Vazão de ar limpo', min: 50, max: 10000, step: 50, valor: 1000, unidade: 'm³/h' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [{ id: 'c', titulo: 'Concentração durante a purga (escala logarítmica)', xlabel: 'tempo (min)', ylabel: '% em volume', aspect: 0.56, legendPos: 'bottomleft', ylog: true }],
      saidas: [{ id: 'lie', label: 'LIE da mistura' }, { id: 'lse', label: 'LSE da mistura' }, { id: 'pct', label: 'Leitura inicial' }, { id: 'est', label: 'Estado inicial' }, { id: 't10', label: 'Tempo até 10 % do LIE' }, { id: 'tr', label: 'Renovações necessárias' }],
      formulas: [
        { tex: 'LIE_m = \\frac{100}{\\sum_i y_i/LIE_i}', d: 'Le Chatelier, com y em % do combustível', destaque: true },
        { tex: 'C(t) = C_0\\,e^{-Qt/V}', d: 'diluição em mistura perfeita' }
      ],
      nota: 'Limites à temperatura e pressão ambientes. A mistura perfeita é uma idealização: em tanques reais há regiões mortas, por isso a leitura deve ser feita com medidor calibrado e em vários pontos. Ventilação com oxigênio puro é proibida pela NR-33.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var m = ST.mistura(p), alvo = 0.1 * m.lie, t10 = ST.tempoPurga(p.C0, alvo, p.V, p.Q), tmax = Math.max(t10 * 1.25, 2), est = p.C0 > m.lse ? 'rica' : p.C0 >= m.lie ? 'explosiva' : 'pobre';
        A.dados = { m: m, C0: p.C0, V: p.V, Q: p.Q, tmax: tmax, ymin: alvo * 0.4, ymax: Math.max(p.C0, m.lse) * 1.8 };
        desenha(A);
        var trav = p.C0 > m.lse;
        ctx.setPassos([
          { t: '① A mistura', obs: 'LIE de ' + nt(m.lie, 2) + ' % e LSE de ' + nt(m.lse, 2) + ' % em volume.' },
          { t: '② O estado', obs: p.C0 > m.lse ? 'Rica demais para queimar, mas a entrada de ar a leva para dentro da faixa.' : p.C0 >= m.lie ? 'Dentro da faixa explosiva: qualquer ignição causa explosão.' : 'Abaixo do LIE, porém a ' + nt(100 * p.C0 / m.lie, 0) + ' % dele.' },
          { t: '③ A purga', obs: 'Chega a 10 % do LIE em ' + nt(t10, 1) + ' min.' + (trav ? ' No caminho atravessa a faixa explosiva: a prática é inertizar antes de admitir ar.' : '') }
        ]);
        return { lie: { v: m.lie, u: '% vol' }, lse: { v: m.lse, u: '% vol' }, pct: { v: 100 * p.C0 / m.lie, u: '% do LIE', classe: p.C0 >= 0.1 * m.lie ? 'alerta' : 'ok' }, est: { v: est, classe: est === 'pobre' ? '' : 'alerta' }, t10: { v: t10, u: 'min', classe: 'destaque' }, tr: { v: p.Q * t10 / 60 / p.V, u: 'volumes' } };
      }
    });
  }

  function iniciar() { montarRuido(); montarQueda(); montarPurga(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window);

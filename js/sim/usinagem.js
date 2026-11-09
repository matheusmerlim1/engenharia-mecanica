/* ============================================================
   Simuladores de Usinagem
   1 · Torneamento: rotação, potência, rugosidade e tempo (animado)
   2 · Fresamento concordante e discordante (animado)
   3 · Vida de ferramenta, custo e velocidade ótima
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim, Plot = global.Plot;
  if (!Sim) return;
  var cor = function (i) { return Plot.serie(i); };
  var nt = function (v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }); };
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

  function montarTorno() {
    if (!document.getElementById('sim-torno')) return;
    var A = animador(function (a) { desenha(a); }, 50);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var fr = (a.t % 120) / 120, xt = 0.5 + 8.5 * fr, g = a.ctx.plot('anim').clear();
      g.setLimits([0, 10], [-1.4, 1.4]);
      g.custom(function (c, pl) {
        var r0 = d.D / d.Dref, r1 = (d.D - 2 * d.ap) / d.Dref, X = function (v) { return pl.px(v); }, Y = function (v) { return pl.py(v); };
        c.fillStyle = cor(0); c.globalAlpha = 0.28;
        c.fillRect(X(xt), Y(r0), X(9.5) - X(xt), Y(-r0) - Y(r0));
        c.fillRect(X(0.5), Y(r1), X(xt) - X(0.5), Y(-r1) - Y(r1));
        c.globalAlpha = 1; c.strokeStyle = cor(0); c.lineWidth = 1.4;
        c.strokeRect(X(0.5), Y(r1), X(xt) - X(0.5), Y(-r1) - Y(r1));
        c.strokeRect(X(xt), Y(r0), X(9.5) - X(xt), Y(-r0) - Y(r0));
        c.fillStyle = cor(3);
        c.beginPath(); c.moveTo(X(xt), Y(r1)); c.lineTo(X(xt) + 16, Y(r1) - 34); c.lineTo(X(xt) - 8, Y(r1) - 34); c.closePath(); c.fill();
        var fase = a.t * 0.35 % (2 * Math.PI), k;
        c.strokeStyle = cor(5); c.lineWidth = 1.2;
        for (k = 0; k < 7; k++) { var xx = 0.9 + k * 1.3, ph = fase + k, yy = Math.cos(ph) * r1 * 0.9; if (xx < xt) { c.beginPath(); c.moveTo(X(xx), Y(yy) - 3); c.lineTo(X(xx), Y(yy) + 3); c.stroke(); } }
      });
      g.draw();
    }
    Sim.build('#sim-torno', {
      titulo: '1. Torneamento — rotação, potência, rugosidade e tempo',
      descricao: 'Ajuste os parâmetros e veja o que limita o corte: a potência da máquina, a rotação máxima ou o acabamento exigido.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo 3', desc: 'Aço, 150 m/min', valores: { D: 80, L: 200, vc: 150, f: 0.25, ap: 3, ks: 2000, re: 0.8, Pm: 10 } },
        { nome: '2 · Desbaste pesado', desc: 'Falta potência', valores: { D: 120, L: 300, vc: 180, f: 0.5, ap: 6, ks: 2200, re: 1.2, Pm: 10 } },
        { nome: '3 · Acabamento', desc: 'Avanço baixo', valores: { D: 50, L: 100, vc: 250, f: 0.08, ap: 0.5, ks: 2500, re: 0.4, Pm: 10 } },
        { nome: '4 · Alumínio', desc: 'Velocidade alta', valores: { D: 40, L: 120, vc: 400, f: 0.2, ap: 2, ks: 800, re: 0.8, Pm: 10 } }
      ],
      controles: [
        { id: 'D', label: 'Diâmetro D', min: 10, max: 300, step: 1, valor: 80, unidade: 'mm' },
        { id: 'L', label: 'Comprimento L', min: 10, max: 800, step: 5, valor: 200, unidade: 'mm' },
        { id: 'vc', label: 'Velocidade de corte', min: 10, max: 600, step: 5, valor: 150, unidade: 'm/min' },
        { id: 'f', label: 'Avanço f', min: 0.03, max: 1, step: 0.01, valor: 0.25, unidade: 'mm/rot' },
        { id: 'ap', label: 'Profundidade aₚ', min: 0.1, max: 10, step: 0.1, valor: 3, unidade: 'mm' },
        { id: 'ks', label: 'Força específica kₛ', min: 500, max: 4000, step: 50, valor: 2000, unidade: 'MPa' },
        { id: 're', label: 'Raio de ponta', min: 0.2, max: 2.4, step: 0.1, valor: 0.8, unidade: 'mm' },
        { id: 'Pm', label: 'Potência da máquina', min: 1, max: 40, step: 0.5, valor: 10, unidade: 'kW' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'A peça e a ferramenta', height: 150, grid: false, legend: false },
        { id: 'p', titulo: 'Potência necessária contra velocidade de corte', xlabel: 'vc (m/min)', ylabel: 'P (kW)', aspect: 0.36, legendPos: 'topleft' }
      ],
      saidas: [{ id: 'n', label: 'Rotação' }, { id: 'Q', label: 'Taxa de remoção' }, { id: 'F', label: 'Força de corte' }, { id: 'P', label: 'Potência no motor' }, { id: 'Ra', label: 'Rₐ teórica' }, { id: 't', label: 'Tempo de corte' }],
      formulas: [
        { tex: 'n = \\frac{1000\\,v_c}{\\pi D}', d: 'rotação', destaque: true },
        { tex: 'F_c = k_s\\,f\\,a_p, \\quad P = F_c\\,v_c/\\eta', d: 'rendimento de 80 %' },
        { tex: 'R_a \\approx \\frac{f^2}{32\\,r_\\varepsilon}', d: 'rugosidade teórica' }
      ],
      nota: 'Rendimento mecânico suposto de 80 %. A força específica é considerada constante neste simulador.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var n = 1000 * p.vc / (Math.PI * p.D), Q = p.vc * p.f * p.ap, F = p.ks * p.f * p.ap, Pc = F * p.vc / 60 / 1000, Pmot = Pc / 0.8, Ra = p.f * p.f / (32 * p.re) * 1000, t = p.L / (p.f * n);
        A.dados = { D: p.D, ap: Math.min(p.ap, p.D / 2 * 0.8), Dref: p.D * 1.15 };
        desenha(A);
        var xs = Plot.linspace(10, 600, 60), g = ctx.plot('p').clear();
        g.line(xs, xs.map(function (v) { return F * v / 60 / 1000 / 0.8; }), { color: cor(0), width: 2.4, label: 'necessária' });
        g.hline(p.Pm, { color: cor(3), width: 1.4, dash: [6, 4], text: 'máquina' });
        g.marker(p.vc, Pmot, 'ponto', { color: cor(3) });
        g.draw();
        var ok = Pmot <= p.Pm, pos = p.Pm * 0.8 * 60000 / F;
        ctx.setPassos([
          { t: '① Rotação', obs: 'n = ' + nt(n, 0) + ' rpm.' },
          { t: '② Potência', obs: ok ? 'O motor atende, com folga de ' + nt(p.Pm - Pmot, 2) + ' kW.' : 'Falta potência. Com esta seção de cavaco, a velocidade máxima é ' + nt(pos, 0) + ' m/min.' }
        ]);
        return { n: { v: n, u: 'rpm' }, Q: { v: Q, u: 'cm³/min' }, F: { v: F, u: 'N' }, P: { v: Pmot, u: 'kW', classe: ok ? 'ok' : 'alerta' }, Ra: { v: Ra, u: 'µm' }, t: { v: t, u: 'min', classe: 'destaque' } };
      }
    });
  }

  function montarFresa() {
    if (!document.getElementById('sim-fresa')) return;
    var A = animador(function (a) { desenha(a); }, 40);
    function desenha(a) {
      var d = a.dados; if (!d) return;
      var g = a.ctx.plot('anim').clear(), ang = a.t * 0.05 * d.sentido, R = 1;
      g.setLimits([-2.2, 2.2], [-1.3, 1.3]);
      g.custom(function (c, pl) {
        var X = function (v) { return pl.px(v); }, Y = function (v) { return pl.py(v); }, escala = Math.abs(X(1) - X(0)), yc = 0, k;
        c.fillStyle = cor(0); c.globalAlpha = 0.25; c.fillRect(X(-2.2), Y(-1.3), X(2.2) - X(-2.2), Y(d.y1) - Y(-1.3)); c.globalAlpha = 1;
        c.strokeStyle = cor(1); c.lineWidth = 2; c.beginPath(); c.arc(X(0), Y(yc), R * escala, 0, 2 * Math.PI); c.stroke();
        for (k = 0; k < d.z; k++) {
          var t = ang + 2 * Math.PI * k / d.z, x = Math.cos(t) * R, y = Math.sin(t) * R, corte = y <= d.y1;
          c.fillStyle = corte ? cor(3) : cor(1);
          c.beginPath(); c.arc(X(x), Y(y), corte ? 6 : 4, 0, 2 * Math.PI); c.fill();
        }
        c.fillStyle = cor(5); c.font = '12px system-ui'; c.textAlign = 'center';
        c.fillText(d.nome, X(0), Y(0) + 4);
        c.strokeStyle = cor(2); c.lineWidth = 2; c.beginPath(); c.moveTo(X(-2), Y(1.05)); c.lineTo(X(-1.2), Y(1.05)); c.lineTo(X(-1.3), Y(1.13)); c.moveTo(X(-1.2), Y(1.05)); c.lineTo(X(-1.3), Y(0.97)); c.stroke();
        c.fillStyle = cor(2); c.textAlign = 'left'; c.fillText('avanço', X(-1.1), Y(1.05) + 4);
      });
      g.draw();
    }
    Sim.build('#sim-fresa', {
      titulo: '2. Fresamento — concordante e discordante',
      descricao: 'A espessura do cavaco varia ao longo do corte. No concordante, ela começa no máximo; no discordante, começa em zero, e o dente desliza antes de cortar.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'Fresa de 80 mm', valores: { D: 80, z: 6, vc: 120, fz: 0.15, ae: 40, ap: 3, modo: 'conc', L: 300 } },
        { nome: '2 · Discordante', desc: 'Mesma situação', valores: { D: 80, z: 6, vc: 120, fz: 0.15, ae: 40, ap: 3, modo: 'disc', L: 300 } },
        { nome: '3 · Fresa cheia', desc: 'aₑ igual ao diâmetro', valores: { D: 50, z: 4, vc: 150, fz: 0.1, ae: 50, ap: 5, modo: 'conc', L: 200 } },
        { nome: '4 · Corte lateral leve', desc: 'Pouca largura', valores: { D: 50, z: 4, vc: 200, fz: 0.1, ae: 5, ap: 10, modo: 'conc', L: 200 } }
      ],
      controles: [
        { id: 'modo', tipo: 'seg', label: 'Modo', valor: 'conc', opcoes: [{ v: 'conc', t: 'Concordante' }, { v: 'disc', t: 'Discordante' }] },
        { id: 'D', label: 'Diâmetro D', min: 10, max: 160, step: 1, valor: 80, unidade: 'mm' },
        { id: 'z', label: 'Número de dentes', min: 1, max: 12, step: 1, valor: 6 },
        { id: 'vc', label: 'Velocidade de corte', min: 20, max: 400, step: 5, valor: 120, unidade: 'm/min' },
        { id: 'fz', label: 'Avanço por dente', min: 0.02, max: 0.5, step: 0.01, valor: 0.15, unidade: 'mm' },
        { id: 'ae', label: 'Largura aₑ', min: 1, max: 160, step: 1, valor: 40, unidade: 'mm' },
        { id: 'ap', label: 'Profundidade aₚ', min: 0.2, max: 20, step: 0.1, valor: 3, unidade: 'mm' },
        { id: 'L', label: 'Curso', min: 20, max: 800, step: 10, valor: 300, unidade: 'mm' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'anim', titulo: 'Vista do plano de corte', height: 190, grid: false, legend: false },
        { id: 'h', titulo: 'Espessura do cavaco ao longo do corte', xlabel: 'fração do arco de contato', ylabel: 'h (mm)', aspect: 0.3, legend: false }
      ],
      saidas: [{ id: 'n', label: 'Rotação' }, { id: 'vf', label: 'Avanço da mesa' }, { id: 'Q', label: 'Taxa de remoção' }, { id: 'hm', label: 'Maior espessura' }, { id: 'arco', label: 'Ângulo de contato' }, { id: 't', label: 'Tempo' }],
      formulas: [{ tex: 'v_f = f_z\\,z\\,n', d: 'velocidade de avanço', destaque: true }, { tex: 'h(\\theta) = f_z\\,\\text{sen}\\,\\theta', d: 'espessura do cavaco no ângulo θ' }],
      nota: 'O tempo inclui aproximação de um diâmetro.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.on = !!p.animar;
        var ae = Math.min(p.ae, p.D), n = 1000 * p.vc / (Math.PI * p.D), vf = p.fz * p.z * n, Q = ae * p.ap * vf / 1000;
        var phi = Math.acos(Math.max(-1, 1 - 2 * ae / p.D)), fr = Plot.linspace(0, 1, 100);
        var hf = function (u) { var th = p.modo === 'disc' ? u * phi : (1 - u) * phi; return p.fz * Math.sin(th); };
        var g = ctx.plot('h').clear();
        g.area(fr, fr.map(hf), { base: 0, alpha: 0.3, color: cor(3) }); g.line(fr, fr.map(hf), { color: cor(3), width: 2.4 }); g.draw();
        A.dados = { z: Math.round(p.z), sentido: p.modo === 'conc' ? 1 : -1, y1: -1 + 2 * ae / p.D, y0: 0, nome: p.modo === 'conc' ? 'concordante' : 'discordante' };
        desenha(A);
        var hm = phi >= Math.PI / 2 ? p.fz : p.fz * Math.sin(phi), t = (p.L + p.D) / vf;
        ctx.setPassos([{ t: '① O que muda', obs: p.modo === 'conc' ? 'O dente entra com o cavaco grosso e sai com espessura nula: menos atrito e melhor vida.' : 'O dente entra com espessura nula, desliza e encrua a superfície antes de cortar.' }]);
        return { n: { v: n, u: 'rpm' }, vf: { v: vf, u: 'mm/min' }, Q: { v: Q, u: 'cm³/min', classe: 'destaque' }, hm: { v: hm, u: 'mm' }, arco: { v: phi * 180 / Math.PI, u: '°' }, t: { v: t, u: 'min' } };
      }
    });
  }

  function montarTaylor() {
    if (!document.getElementById('sim-taylor')) return;
    Sim.build('#sim-taylor', {
      titulo: '3. Vida de ferramenta, custo e velocidade ótima',
      descricao: 'Velocidades altas reduzem o custo de máquina e aumentam o de ferramenta. A curva de custo tem um mínimo, e a de tempo tem outro, em velocidade maior.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'Metal duro', valores: { n: 0.25, C: 300, tt: 2, Cf: 10, Co: 2, tc: 2, v: 150 } },
        { nome: '2 · Aço rápido', desc: 'n pequeno', valores: { n: 0.125, C: 70, tt: 3, Cf: 8, Co: 2, tc: 10, v: 35 } },
        { nome: '3 · Pastilha cara', desc: 'Custo da aresta alto', valores: { n: 0.25, C: 300, tt: 2, Cf: 40, Co: 2, tc: 2, v: 150 } },
        { nome: '4 · Máquina cara', desc: 'Minuto de máquina caro', valores: { n: 0.25, C: 300, tt: 2, Cf: 10, Co: 8, tc: 2, v: 150 } }
      ],
      controles: [
        { id: 'n', label: 'Expoente de Taylor n', min: 0.08, max: 0.7, step: 0.005, valor: 0.25 },
        { id: 'C', label: 'Constante C', min: 30, max: 1200, step: 5, valor: 300 },
        { id: 'tt', label: 'Tempo de troca', min: 0.2, max: 15, step: 0.1, valor: 2, unidade: 'min' },
        { id: 'Cf', label: 'Custo por aresta', min: 1, max: 100, step: 1, valor: 10, unidade: 'R$' },
        { id: 'Co', label: 'Custo de máquina', min: 0.2, max: 15, step: 0.1, valor: 2, unidade: 'R$/min' },
        { id: 'tc', label: 'Tempo de corte em 100 m/min', min: 0.5, max: 30, step: 0.5, valor: 2, unidade: 'min' },
        { id: 'v', label: 'Velocidade adotada', min: 10, max: 900, step: 5, valor: 150, unidade: 'm/min' }
      ],
      graficos: [
        { id: 'c', titulo: 'Custo por peça', xlabel: 'vc (m/min)', ylabel: 'R$', aspect: 0.46, legendPos: 'topright' },
        { id: 'T', titulo: 'Vida da ferramenta', xlabel: 'vc (m/min)', ylabel: 'T (min)', aspect: 0.28, legend: false }
      ],
      saidas: [{ id: 'T', label: 'Vida na velocidade adotada' }, { id: 'vmc', label: 'Velocidade de mínimo custo' }, { id: 'vmp', label: 'Velocidade de máxima produção' }, { id: 'Tmc', label: 'Vida de mínimo custo' }, { id: 'cp', label: 'Custo por peça' }, { id: 'zona', label: 'Situação' }],
      formulas: [
        { tex: 'v_c\\,T^n = C', d: 'Taylor', destaque: true },
        { tex: 'T_{mc} = \\left(\\frac{1}{n} - 1\\right)\\left(t_t + \\frac{C_f}{C_o}\\right)', d: 'vida de mínimo custo' },
        { tex: 'T_{mp} = \\left(\\frac{1}{n} - 1\\right) t_t', d: 'vida de máxima produção' }
      ],
      nota: 'O tempo de corte é inversamente proporcional à velocidade. Tempos improdutivos sem relação com a ferramenta não alteram o ótimo e foram omitidos.',
      calcular: function (p, ctx) {
        var vida = function (v) { return Math.pow(p.C / v, 1 / p.n); };
        var Tmc = (1 / p.n - 1) * (p.tt + p.Cf / p.Co), Tmp = (1 / p.n - 1) * p.tt, vmc = p.C / Math.pow(Tmc, p.n), vmp = p.C / Math.pow(Tmp, p.n);
        var tcv = function (v) { return p.tc * 100 / v; };
        var mq = function (v) { return p.Co * tcv(v); }, fer = function (v) { return tcv(v) / vida(v) * (p.Cf + p.Co * p.tt); }, tot = function (v) { return mq(v) + fer(v); };
        var v1 = Math.max(10, vmc * 0.35), v2 = vmp * 1.9, xs = Plot.linspace(v1, v2, 200), g = ctx.plot('c').clear();
        var ymax = tot(vmc) * 2.4;
        g.line(xs, xs.map(mq), { color: cor(1), width: 1.8, label: 'máquina' });
        g.line(xs, xs.map(fer), { color: cor(2), width: 1.8, label: 'ferramenta' });
        g.line(xs, xs.map(tot), { color: cor(0), width: 2.8, label: 'total' });
        g.vline(vmc, { color: cor(3), width: 1.2, dash: [4, 4], text: 'custo' });
        g.vline(vmp, { color: cor(5), width: 1.2, dash: [4, 4], text: 'produção' });
        g.setLimits([v1, v2], [0, ymax]);
        g.draw();
        var h = ctx.plot('T').clear(); h.line(xs, xs.map(vida), { color: cor(0), width: 2.4 }); h.setLimits([v1, v2], [0, vida(v1) > 3 * Tmc ? 3 * Tmc : vida(v1)]); h.marker(Math.max(v1, Math.min(v2, p.v)), Math.min(3 * Tmc, vida(p.v)), 'T', { color: cor(3) }); h.draw();
        var zona = p.v < vmc ? 'abaixo do intervalo' : p.v > vmp ? 'acima do intervalo' : 'intervalo eficiente';
        ctx.setPassos([{ t: '① Vidas ótimas', obs: 'Mínimo custo em T = ' + nt(Tmc, 1) + ' min, e máxima produção em T = ' + nt(Tmp, 1) + ' min.' }, { t: '② A sua escolha', obs: 'A ' + nt(p.v, 0) + ' m/min, a vida é ' + nt(vida(p.v), 1) + ' min.' }]);
        return { T: { v: vida(p.v), u: 'min' }, vmc: { v: vmc, u: 'm/min', classe: 'ok' }, vmp: { v: vmp, u: 'm/min' }, Tmc: { v: Tmc, u: 'min' }, cp: { v: tot(p.v), u: 'R$' }, zona: { v: zona, classe: zona === 'intervalo eficiente' ? 'ok' : 'alerta' } };
      }
    });
  }
  function iniciar() { montarTorno(); montarFresa(); montarTaylor(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

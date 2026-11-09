/* ============================================================
   Simuladores de Eletrotécnica
   1 · Potência trifásica e correção do fator de potência
   2 · Motor de indução: curva conjugado × rotação
   3 · Métodos de partida
   ============================================================ */
(function (global) {
  'use strict';
  /* motor pelo circuito equivalente de Thévenin; X proporcional a f */
  var EL = {};
  EL.motor = function (o) {
    var fr = o.f / 60, X1 = o.X1 * fr, X2 = o.X2 * fr, Xm = o.Xm * fr, ws = 4 * Math.PI * o.f / o.p;
    var den = o.R1 * o.R1 + (X1 + Xm) * (X1 + Xm);
    var Rth = o.R1 * Xm * Xm / den, Xth = Xm * (o.R1 * o.R1 + X1 * (X1 + Xm)) / den;
    var Vth = o.V * Xm / Math.sqrt(den), R2 = o.R2;
    return {
      ws: ws, Vth: Vth, Rth: Rth, Xth: Xth,
      T: function (s) { var a = R2 / s; return 3 * Vth * Vth * a / (ws * ((Rth + a) * (Rth + a) + (Xth + X2) * (Xth + X2))); },
      I: function (s) { var a = R2 / s; return Vth / Math.hypot(Rth + a, Xth + X2); },
      sm: R2 / Math.hypot(Rth, Xth + X2)
    };
  };
  global.EL = EL;
  var Sim = global.Sim, Plot = global.Plot;
  if (!Sim) return;
  var cor = function (i) { return Plot.serie(i); };
  var nt = function (v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 2 : n }); };
  var BASE = { V: 220, f: 60, p: 4, R1: 0.2, X1: 0.5, R2: 0.25, X2: 0.5, Xm: 20 };

  function montarTrifasico() {
    if (!document.getElementById('sim-trifasico')) return;
    Sim.build('#sim-trifasico', {
      titulo: '1. Potência trifásica e correção do fator de potência',
      descricao: 'O triângulo de potências mostra o que os capacitores fazem: encolhem o cateto reativo e, com ele, a potência aparente e a corrente.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: '100 kW, de 0,70 para 0,95', valores: { P: 100, V: 380, fp1: 0.7, fp2: 0.95 } },
        { nome: '2 · Limite da tarifa', desc: 'Corrigir até 0,92', valores: { P: 200, V: 380, fp1: 0.78, fp2: 0.92 } },
        { nome: '3 · Exagero', desc: 'De 0,95 para 1,00', valores: { P: 100, V: 380, fp1: 0.95, fp2: 1 } }
      ],
      controles: [
        { id: 'P', label: 'Potência ativa', min: 5, max: 1000, step: 5, valor: 100, unidade: 'kW' },
        { id: 'V', label: 'Tensão de linha', min: 220, max: 690, step: 10, valor: 380, unidade: 'V' },
        { id: 'fp1', label: 'Fator de potência atual', min: 0.4, max: 1, step: 0.01, valor: 0.7 },
        { id: 'fp2', label: 'Fator de potência desejado', min: 0.4, max: 1, step: 0.01, valor: 0.95 }
      ],
      graficos: [{ id: 't', titulo: 'Triângulo de potências', xlabel: 'P (kW)', ylabel: 'Q (kvar)', aspect: 0.56, legendPos: 'topleft' }],
      saidas: [{ id: 'Qc', label: 'Banco de capacitores' }, { id: 'S1', label: 'S antes' }, { id: 'S2', label: 'S depois' }, { id: 'I1', label: 'Corrente antes' }, { id: 'I2', label: 'Corrente depois' }, { id: 'red', label: 'Redução da perda nos cabos' }],
      formulas: [{ tex: 'Q_c = P\\,(\\tan\\varphi_1 - \\tan\\varphi_2)', d: 'banco de capacitores', destaque: true }],
      nota: 'A perda nos cabos é proporcional ao quadrado da corrente. O fator de potência é considerado indutivo.',
      calcular: function (p, ctx) {
        var Q1 = p.P * Math.tan(Math.acos(p.fp1)), Q2 = p.P * Math.tan(Math.acos(p.fp2)), Qc = Q1 - Q2, S1 = p.P / p.fp1, S2 = p.P / p.fp2;
        var I1 = S1 * 1000 / (Math.sqrt(3) * p.V), I2 = S2 * 1000 / (Math.sqrt(3) * p.V), g = ctx.plot('t').clear();
        g.line([0, p.P, p.P, 0], [0, 0, Q1, 0], { color: cor(3), width: 2.4, label: 'antes' });
        g.line([0, p.P, p.P, 0], [0, 0, Q2, 0], { color: cor(1), width: 2.6, label: 'depois' });
        g.setLimits([0, p.P * 1.15], [0, Math.max(Q1, p.P * 0.1) * 1.2]);
        g.draw();
        ctx.setPassos([{ t: '① O reativo', obs: 'De ' + nt(Q1, 1) + ' kvar para ' + nt(Q2, 1) + ' kvar. O banco fornece a diferença.' }, { t: '② A corrente', obs: 'Passa de ' + nt(I1, 1) + ' A para ' + nt(I2, 1) + ' A, sem alterar a potência ativa.' }]);
        return { Qc: { v: Math.max(0, Qc), u: 'kvar', classe: Qc >= 0 ? 'destaque' : 'alerta' }, S1: { v: S1, u: 'kVA' }, S2: { v: S2, u: 'kVA' }, I1: { v: I1, u: 'A' }, I2: { v: I2, u: 'A', classe: 'ok' }, red: { v: 100 * (1 - I2 * I2 / (I1 * I1)), u: '%' } };
      }
    });
  }

  function montarMotor() {
    if (!document.getElementById('sim-motor')) return;
    Sim.build('#sim-motor', {
      titulo: '2. Motor de indução — curva conjugado × rotação',
      descricao: 'A curva vem do circuito equivalente. Dobre a resistência do rotor e veja o conjugado máximo permanecer igual, deslocando-se para baixo na rotação.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo do capítulo', desc: 'Motor de 4 polos em 60 Hz', valores: { V: 220, f: 60, p: 4, R2: 0.25, Tc: 80, tipo: 'cte' } },
        { nome: '2 · Resistência dobrada', desc: 'O máximo não muda', valores: { V: 220, f: 60, p: 4, R2: 0.5, Tc: 80, tipo: 'cte' } },
        { nome: '3 · Tensão 10 % menor', desc: 'Conjugado cai 19 %', valores: { V: 198, f: 60, p: 4, R2: 0.25, Tc: 80, tipo: 'cte' } },
        { nome: '4 · Carga de bomba', desc: 'Conjugado cresce com n²', valores: { V: 220, f: 60, p: 4, R2: 0.25, Tc: 80, tipo: 'bomba' } },
        { nome: '5 · Inversor em 30 Hz', desc: 'V/f constante', valores: { V: 110, f: 30, p: 4, R2: 0.25, Tc: 80, tipo: 'cte' } }
      ],
      controles: [
        { id: 'V', label: 'Tensão por fase', min: 40, max: 260, step: 2, valor: 220, unidade: 'V' },
        { id: 'f', label: 'Frequência', min: 10, max: 90, step: 1, valor: 60, unidade: 'Hz' },
        { id: 'p', tipo: 'select', label: 'Polos', valor: 4, opcoes: [{ v: 2, t: '2 polos' }, { v: 4, t: '4 polos' }, { v: 6, t: '6 polos' }, { v: 8, t: '8 polos' }] },
        { id: 'R2', label: 'Resistência do rotor R₂', min: 0.05, max: 2, step: 0.01, valor: 0.25, unidade: 'Ω' },
        { id: 'Tc', label: 'Conjugado nominal da carga', min: 10, max: 400, step: 1, valor: 80, unidade: 'N·m' },
        { id: 'tipo', tipo: 'seg', label: 'Carga', valor: 'cte', opcoes: [{ v: 'cte', t: 'Constante' }, { v: 'bomba', t: 'Bomba (n²)' }] }
      ],
      graficos: [{ id: 'c', titulo: 'Conjugado contra rotação', xlabel: 'n (rpm)', ylabel: 'T (N·m)', aspect: 0.54, legendPos: 'topleft' }],
      saidas: [{ id: 'ns', label: 'Rotação síncrona' }, { id: 'Tp', label: 'Conjugado de partida' }, { id: 'Tm', label: 'Conjugado máximo' }, { id: 'nop', label: 'Rotação de operação' }, { id: 'I', label: 'Corrente' }, { id: 'P', label: 'Potência no eixo' }],
      formulas: [{ tex: 'T = \\frac{3 V_{th}^2 (R_2/s)}{\\omega_s[(R_{th} + R_2/s)^2 + (X_{th} + X_2)^2]}', d: 'conjugado do circuito equivalente', destaque: true }, { tex: 's_{max} = \\frac{R_2}{\\sqrt{R_{th}^2 + (X_{th} + X_2)^2}}', d: 'o máximo independe de R₂' }],
      nota: 'Parâmetros por fase: R₁ = 0,2 Ω, X₁ = X₂ = 0,5 Ω e Xₘ = 20 Ω em 60 Hz. As reatâncias variam com a frequência.',
      calcular: function (p, ctx) {
        var polos = +p.p, m = EL.motor({ V: p.V, f: p.f, p: polos, R1: 0.2, X1: 0.5, R2: p.R2, X2: 0.5, Xm: 20 }), ns = 120 * p.f / polos, N = 400, i, ns2 = [], Ts = [], Tl = [];
        var carga = function (n) { return p.tipo === 'bomba' ? p.Tc * Math.pow(n * polos / (4 * 1750), 2) : p.Tc; };
        for (i = 0; i <= N; i++) { var s = Math.max(1e-4, 1 - i / N * 0.9999), n = (1 - s) * ns; ns2.push(n); Ts.push(m.T(s)); Tl.push(carga(n)); }
        var g = ctx.plot('c').clear();
        g.line(ns2, Ts, { color: cor(0), width: 2.8, label: 'motor' });
        g.line(ns2, Tl, { color: cor(3), width: 2, dash: [6, 4], label: 'carga' });
        var sop = null, lo = 1e-4, hi = m.sm, it;
        if (m.T(m.sm) >= carga((1 - m.sm) * ns)) {
          for (it = 0; it < 80; it++) { var mid = (lo + hi) / 2; if (m.T(mid) - carga((1 - mid) * ns) > 0) hi = mid; else lo = mid; }
          sop = (lo + hi) / 2;
          g.points([(1 - sop) * ns], [m.T(sop)], { color: cor(3), size: 6, label: 'operação' });
        }
        g.vline(ns, { color: cor(5), width: 1, dash: [4, 4], text: 'nₛ' });
        g.draw();
        var Tp = m.T(1), Tmax = m.T(m.sm), parte = Tp > carga(0);
        ctx.setPassos([
          { t: '① A curva', obs: 'Conjugado máximo de ' + nt(Tmax, 0) + ' N·m em s = ' + nt(m.sm, 3) + '.' },
          { t: '② O ponto de operação', obs: sop ? 'Estabiliza em ' + nt((1 - sop) * ns, 0) + ' rpm, com escorregamento de ' + nt(100 * sop, 2) + ' %.' : 'A carga é maior que o conjugado máximo: o motor não sustenta a rotação.' }
        ]);
        return {
          ns: { v: ns, u: 'rpm' }, Tp: { v: Tp, u: 'N·m', classe: parte ? 'ok' : 'alerta' }, Tm: { v: Tmax, u: 'N·m', classe: 'destaque' },
          nop: { v: sop ? (1 - sop) * ns : 'parado', u: sop ? 'rpm' : '', classe: sop ? '' : 'alerta' }, I: { v: sop ? m.I(sop) : m.I(1), u: 'A' }, P: { v: sop ? m.T(sop) * (1 - sop) * m.ws / 1000 : 0, u: 'kW' }
        };
      }
    });
  }

  function montarPartida() {
    if (!document.getElementById('sim-partida')) return;
    Sim.build('#sim-partida', {
      titulo: '3. Métodos de partida',
      descricao: 'Compare o quanto cada método alivia a rede e se o conjugado reduzido ainda dá conta da carga. A integração da dinâmica mostra o tempo de aceleração e a corrente ao longo da partida.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Direta', desc: 'Referência', valores: { met: 'dir', Tc: 80, tipo: 'bomba', J: 0.6, tap: 65 } },
        { nome: '2 · Estrela-triângulo em bomba', desc: 'Parte bem', valores: { met: 'yd', Tc: 80, tipo: 'bomba', J: 0.6, tap: 65 } },
        { nome: '3 · Estrela-triângulo com carga constante', desc: 'Conjugado insuficiente', valores: { met: 'yd', Tc: 80, tipo: 'cte', J: 0.6, tap: 65 } },
        { nome: '4 · Compensadora a 65 %', desc: 'Mesma carga constante', valores: { met: 'comp', Tc: 80, tipo: 'cte', J: 0.6, tap: 65 } },
        { nome: '5 · Inversor', desc: 'Corrente limitada', valores: { met: 'inv', Tc: 80, tipo: 'cte', J: 0.6, tap: 65 } }
      ],
      controles: [
        { id: 'met', tipo: 'select', label: 'Método', valor: 'yd', opcoes: [{ v: 'dir', t: 'Partida direta' }, { v: 'yd', t: 'Estrela-triângulo' }, { v: 'comp', t: 'Compensadora' }, { v: 'inv', t: 'Inversor' }] },
        { id: 'tap', label: 'Tap da compensadora', min: 50, max: 85, step: 5, valor: 65, unidade: '%' },
        { id: 'Tc', label: 'Conjugado nominal da carga', min: 10, max: 150, step: 1, valor: 80, unidade: 'N·m' },
        { id: 'tipo', tipo: 'seg', label: 'Carga', valor: 'bomba', opcoes: [{ v: 'bomba', t: 'Bomba (n²)' }, { v: 'cte', t: 'Constante' }] },
        { id: 'J', label: 'Inércia total', min: 0.1, max: 6, step: 0.1, valor: 0.6, unidade: 'kg·m²' }
      ],
      graficos: [
        { id: 'c', titulo: 'Conjugado disponível e carga', xlabel: 'n (rpm)', ylabel: 'T (N·m)', aspect: 0.42, legendPos: 'topleft' },
        { id: 'i', titulo: 'Corrente de linha ao longo do tempo', xlabel: 't (s)', ylabel: 'I (A)', aspect: 0.32, legendPos: 'topright' }
      ],
      saidas: [{ id: 'Ip', label: 'Corrente no início' }, { id: 'Tp', label: 'Conjugado no início' }, { id: 'ta', label: 'Tempo de aceleração' }, { id: 'res', label: 'Resultado' }],
      formulas: [{ tex: 'J\\,\\frac{d\\omega}{dt} = T_m - T_c', d: 'equação do movimento', destaque: true }, { tex: 'I_Y = I_\\Delta/3, \\quad T_Y = T_\\Delta/3', d: 'estrela-triângulo' }],
      nota: 'Motor do capítulo 6, de 4 polos. O inversor é representado como limite de 1,5 vez o conjugado de 80 N·m e corrente de 1,5 vez 25 A. Na estrela-triângulo, a transição ocorre em 90 % da rotação síncrona.',
      calcular: function (p, ctx) {
        var m = EL.motor(BASE), ns = 1800, ws = m.ws, TN = 80, IN = 25;
        var fat = function (nv) { return p.met === 'yd' ? (nv < 0.9 * ns ? 1 / 3 : 1) : p.met === 'comp' ? (nv < 0.85 * ns ? Math.pow(p.tap / 100, 2) : 1) : 1; };
        var carga = function (n) { return p.tipo === 'bomba' ? p.Tc * Math.pow(n / 1750, 2) : p.Tc; };
        var Tmot = function (n) {
          if (p.met === 'inv') return n < 0.97 * ns ? 1.5 * TN : Math.max(0, 1.5 * TN * (ns - n) / (0.03 * ns));
          var s = Math.max(1e-4, 1 - n / ns); return fat(n) * m.T(s);
        };
        var Ilin = function (n) {
          if (p.met === 'inv') return 1.5 * IN;
          var s = Math.max(1e-4, 1 - n / ns); return fat(n) * m.I(s);
        };
        var xs = Plot.linspace(0, ns * 0.9995, 400), g = ctx.plot('c').clear();
        g.line(xs, xs.map(Tmot), { color: cor(0), width: 2.6, label: 'motor' });
        g.line(xs, xs.map(carga), { color: cor(3), width: 2, dash: [6, 4], label: 'carga' });
        g.draw();
        var w = 0, t = 0, dt = 0.002, ts = [], is = [], ta = null, pre = false, cnt = 0;
        while (t < 30) {
          var n = w * 60 / (2 * Math.PI), Tl = n <= 0 ? (p.tipo === 'bomba' ? 0 : p.Tc) : carga(n), Tm = Tmot(n), dw = (Tm - Tl) / p.J;
          if (n <= 0 && dw <= 0) { pre = true; break; }
          w = Math.max(0, w + dw * dt); t += dt;
          if (cnt++ % 10 === 0) { ts.push(t); is.push(Ilin(n)); }
          if (ta === null && Math.abs(dw) < 0.4 && n > 0.88 * ns) ta = t;
          if (ta !== null && t > ta * 1.25 + 0.3) break;
          if (ta === null && Math.abs(dw) < 0.05) break;
        }
        var nf = w * 60 / (2 * Math.PI), ok = ta !== null && !pre;
        var q = ctx.plot('i').clear();
        if (ts.length > 1) q.line(ts, is, { color: cor(2), width: 2.4, label: 'corrente' });
        q.hline(IN, { color: cor(5), width: 1, dash: [4, 4], text: 'nominal' });
        q.draw();
        var txt = pre ? 'não parte' : ok ? 'acelera' : 'estabiliza em ' + nt(nf, 0) + ' rpm';
        ctx.setPassos([{ t: '① A partida', obs: pre ? 'O conjugado de partida é menor que o da carga, e o eixo nem sequer começa a girar.' : ok ? 'O motor chega à rotação nominal.' : 'O conjugado reduzido cruza a curva de carga antes da transição, e o motor fica preso em baixa rotação.' }]);
        return { Ip: { v: Ilin(0), u: 'A' }, Tp: { v: Tmot(0), u: 'N·m' }, ta: { v: ok ? ta : '—', u: ok ? 's' : '' }, res: { v: txt, classe: ok ? 'ok' : 'alerta' } };
      }
    });
  }
  function iniciar() { montarTrifasico(); montarMotor(); montarPartida(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

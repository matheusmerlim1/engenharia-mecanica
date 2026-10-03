/* ============================================================
   Figuras ilustrativas de Termodinâmica
   Domo de saturação, gás ideal, politrópicos, balanços das duas leis,
   exergia e os quatro ciclos — tudo calculado pelas relações do capítulo.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };

  /* Tsat da água pela equação de Antoine (P em kPa, T em °C) — erro < 1 °C até 10 MPa */
  function Tsat(P) {
    var mmHg = P * 7.50062;
    return 1730.63 / (8.07131 - Math.log10(mmHg)) - 233.426;
  }
  /* entropias de saturação da água, interpoladas da tabela (kJ/kg·K) */
  var TAB_T = [0, 50, 100, 150, 200, 250, 300, 340, 374];
  var TAB_SF = [0, 0.7038, 1.3069, 1.8418, 2.3309, 2.7935, 3.2552, 3.6594, 4.407];
  var TAB_SG = [9.156, 8.0763, 7.3549, 6.8379, 6.4323, 6.0730, 5.7059, 5.3357, 4.407];
  function interp(T, tab) {
    T = Math.max(0, Math.min(374, T));
    for (var i = 1; i < TAB_T.length; i++) {
      if (T <= TAB_T[i]) {
        var f = (T - TAB_T[i - 1]) / (TAB_T[i] - TAB_T[i - 1]);
        return tab[i - 1] + f * (tab[i] - tab[i - 1]);
      }
    }
    return tab[tab.length - 1];
  }
  var sf = function (T) { return interp(T, TAB_SF); };
  var sg = function (T) { return interp(T, TAB_SG); };

  /* ================= capítulo 2 ================= */

  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Domo de saturação no diagrama T-v. Dentro do domo, pressão e temperatura andam juntas e só o título distingue os estados (exemplo 2.1).',
    vista: [-0.6, 12.6, -2.8, 6.0],
    altura: 350,
    controles: [
      { id: 'P', rot: 'Pressão', min: 10, max: 10000, val: 1000, passo: 10, un: 'kPa' },
      { id: 'x', rot: 'Título (−1 = sub-resfriado · 2 = superaquecido)', min: -1, max: 2, val: 0.8, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      /* correlações simples de água: Tsat(P) e volumes */
      var P = p.P;
      var Ts = Math.min(373, Math.max(7, Tsat(P)));
      var vf = 0.001 + 0.00022 * Math.pow(P / 1000, 0.8);
      var vg = 0.1943 * Math.pow(1000 / P, 0.94);
      var x = p.x;
      var gx = 1.3, gy = 1.0, gw = 6.4, gh = 4.4;
      var X = function (v) { return gx + gw * (Math.log10(Math.max(1e-4, v)) + 3.2) / 4.2; };
      var Y = function (T) { return gy + gh * T / 420; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* domo */
      var i, esq = [], dir = [];
      for (i = 0; i <= 40; i++) {
        var T = 10 + (374 - 10) * i / 40;
        var f = T / 374;
        esq.push([X(0.001 + 0.0022 * Math.pow(f, 6)), Y(T)]);
        dir.push([X(0.003 / Math.pow(Math.max(0.03, f), 5.2) * 0.9), Y(T)]);
      }
      g.caminho(esq, { cor: 's1', larg: 2.2 });
      g.caminho(dir, { cor: 's2', larg: 2.2 });
      g.circ(X(0.003), Y(374), 0.14, { preenche: 'erro', cor: null });
      g.txt('ponto crítico', X(0.003), Y(374) + 0.45, { cor: 'erro', tam: 10.5, fundo: true });
      g.txt('líquido', X(0.0013), Y(140), { cor: 's1', tam: 11 });
      g.txt('vapor', X(3), Y(300), { cor: 's2', tam: 11 });
      g.txt('L + V', X(0.06), Y(120), { cor: 'fraco', tam: 11 });
      /* linha de pressão constante */
      g.linha(X(vf), Y(Ts), X(vg), Y(Ts), { cor: 'info', larg: 2 });
      g.txt(fx(P, 0) + ' kPa', X(vg) + 0.15, Y(Ts), { cor: 'info', tam: 10.5, alin: 'esq' });
      var estado, vv, Tp;
      if (x < 0) { estado = 'líquido sub-resfriado'; vv = vf * 0.98; Tp = Ts - 40; }
      else if (x > 1) { estado = 'vapor superaquecido'; vv = vg * 1.8; Tp = Ts + 60; }
      else { estado = 'mistura (título ' + fx(x, 2) + ')'; vv = vf + x * (vg - vf); Tp = Ts; }
      g.circ(X(vv), Y(Math.min(410, Tp)), 0.16, { preenche: 'erro', cor: null });
      for (i = 0; i <= 4; i++) {
        var vx = Math.pow(10, -3.2 + 4.2 * i / 4);
        g.linha(X(vx), gy, X(vx), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(vx < 0.01 ? fx(vx, 4) : vx < 1 ? fx(vx, 3) : fx(vx, 1), X(vx), gy - 0.45, { cor: 'fraco', tam: 9.5 });
      }
      [100, 200, 300, 400].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.15, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.28, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('v (m³/kg, log)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.4;
      g.txt('Tsat = ' + fx(Ts, 1) + ' °C', x0, 5.2, { cor: 'info', tam: 13, alin: 'esq', negrito: true });
      g.txt(estado, x0, 4.4, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('v = ' + fx(vv, 4) + ' m³/kg', x0, 3.6, { cor: 'suave', tam: 12, alin: 'esq' });
      if (x >= 0 && x <= 1) {
        g.txt('v_f = ' + fx(vf, 4) + ' · v_g = ' + fx(vg, 3), x0, 3.0, { cor: 'fraco', tam: 11, alin: 'esq' });
        g.ret(x0, 1.9, 3.6 * (1 - x), 0.5, { preenche: 's1', cor: null, alfa: 0.8 });
        g.ret(x0 + 3.6 * (1 - x), 1.9, 3.6 * x, 0.5, { preenche: 's2', cor: null, alfa: 0.8 });
        g.txt('líquido ' + fx(100 * (1 - x), 0) + ' % · vapor ' + fx(100 * x, 0) + ' %', x0, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      } else {
        g.txt('fora do domo: P e T são independentes', x0, 3.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      }
      g.txt('valores aproximados, para leitura do diagrama — use a tabela para cálculo', 6, -2.4, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 3 ================= */

  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Gás ideal: PV = mRT. O fator de compressibilidade Z mostra onde a hipótese vale — perto de 1, o erro é pequeno; perto do domo, não (exemplo 3.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'P', rot: 'Pressão', min: 50, max: 2000, val: 200, passo: 25, un: 'kPa' },
      { id: 'T', rot: 'Temperatura', min: 250, max: 800, val: 300, passo: 10, un: 'K' },
      { id: 'V', rot: 'Volume do reservatório', min: 0.1, max: 3, val: 0.5, passo: 0.1, un: 'm³' }
    ],
    desenhar: function (g, p) {
      var R = 0.287, P = p.P, T = p.T, V = p.V;
      var m = P * V / (R * T);
      var rho = m / V;
      /* Z aproximado do ar (Pr e Tr do ar: Pc 3770 kPa, Tc 132,5 K) */
      var Pr = P / 3770, Tr = T / 132.5;
      var Z = 1 + Pr * (0.083 - 0.422 / Math.pow(Tr, 1.6)) / Tr;
      var ox = 1.0, oy = 1.2, larg = 4.4, alt = 3.0;
      g.ret(ox, oy, larg, alt, { cor: 'forte', larg: 2, preenche: 'acento', alfa: 0.12 });
      var n = Math.max(6, Math.min(90, Math.round(rho * 14)));
      var semente = 3;
      for (var i = 0; i < n; i++) {
        semente = (semente * 9301 + 49297) % 233280; var rx = semente / 233280;
        semente = (semente * 9301 + 49297) % 233280; var ry = semente / 233280;
        g.circ(ox + 0.2 + rx * (larg - 0.4), oy + 0.2 + ry * (alt - 0.4), 0.09, { preenche: 's1', cor: null, alfa: 0.8 });
      }
      g.txt(fx(V, 1) + ' m³ · ' + fx(P, 0) + ' kPa · ' + fx(T, 0) + ' K', ox + larg / 2, oy - 0.5, { cor: 'suave', tam: 11.5 });
      var x0 = 6.4;
      g.txt('m = PV/RT = ' + fx(m, 3) + ' kg', x0, 5.0, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('densidade ' + fx(rho, 3) + ' kg/m³', x0, 4.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Z ≈ ' + fx(Z, 3), x0, 3.3, { cor: Math.abs(Z - 1) < 0.02 ? 'ok' : 'aviso', tam: 13.5, alin: 'esq', negrito: true });
      g.ret(x0, 2.2, 4.4, 0.42, { cor: 'borda', larg: 1.2 });
      g.ret(x0 + 2.2 - Math.min(2.2, Math.abs(Z - 1) * 22) * (Z < 1 ? 1 : 0), 2.2, Math.min(2.2, Math.abs(Z - 1) * 22), 0.42,
        { preenche: Math.abs(Z - 1) < 0.02 ? 'ok' : 'aviso', cor: null, alfa: 0.8 });
      g.linha(x0 + 2.2, 2.05, x0 + 2.2, 2.77, { cor: 'texto', larg: 1.6 });
      g.txt('Z = 1 (gás ideal)', x0 + 2.2, 1.75, { cor: 'fraco', tam: 10.5 });
      g.txt(Math.abs(Z - 1) < 0.02 ? 'hipótese de gás ideal: erro < 2 %' : 'desvio de ' + fx(100 * Math.abs(Z - 1), 1) + ' %: considere tabela',
        x0, 0.9, { cor: Math.abs(Z - 1) < 0.02 ? 'ok' : 'aviso', tam: 12, alin: 'esq', negrito: true });
      g.txt('cp − cv = R = 0,287 kJ/kg·K e k = 1,4 para o ar', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 4 ================= */

  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Processos politrópicos no diagrama P-v: a área sob a curva é o trabalho. Mude n e veja o caminho — e o trabalho — mudarem entre os mesmos estados (exemplo 4.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'n', rot: 'Expoente politrópico n', min: 0, max: 2, val: 1.3, passo: 0.05 },
      { id: 'rp', rot: 'Razão de pressões P₂/P₁', min: 1.5, max: 10, val: 5, passo: 0.5 }
    ],
    desenhar: function (g, p) {
      var n = p.n, rp = p.rp, P1 = 100, V1 = 0.5;
      var P2 = P1 * rp;
      var V2 = n > 0.001 ? V1 * Math.pow(P1 / P2, 1 / n) : V1;
      var W = Math.abs(n - 1) < 1e-6 ? P1 * V1 * Math.log(V2 / V1) : (P2 * V2 - P1 * V1) / (1 - n);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.4;
      var X = function (V) { return gx + gw * V / 0.6; };
      var Y = function (P) { return gy + gh * P / 1100; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var V = V2 + (V1 - V2) * i / 60;
        var P = n > 0.001 ? P1 * Math.pow(V1 / V, n) : P1;
        pts.push([X(V), Y(Math.min(1100, P))]);
      }
      g.caminho(pts.concat([[X(V1), gy], [X(V2), gy]]), { cor: null, preenche: 's2', alfa: 0.2, fechar: true });
      g.caminho(pts, { cor: 's2', larg: 2.6 });
      g.circ(X(V1), Y(P1), 0.14, { preenche: 'texto', cor: null });
      g.txt('1', X(V1) + 0.3, Y(P1) - 0.1, { cor: 'texto', tam: 12 });
      g.circ(X(V2), Y(Math.min(1100, P2)), 0.14, { preenche: 'texto', cor: null });
      g.txt('2', X(V2) - 0.3, Y(Math.min(1100, P2)) + 0.2, { cor: 'texto', tam: 12 });
      /* referências: isotérmico e isentrópico */
      [[1, 'isotérmico', 'fraco'], [1.4, 'isentrópico', 'borda']].forEach(function (ref) {
        var q = [];
        for (i = 0; i <= 40; i++) {
          var V = V1 * Math.pow(P1 / P2, 1 / ref[0]) + (V1 - V1 * Math.pow(P1 / P2, 1 / ref[0])) * i / 40;
          q.push([X(V), Y(Math.min(1100, P1 * Math.pow(V1 / V, ref[0])))]);
        }
        g.caminho(q, { cor: ref[2], larg: 1.2, tracejado: [5, 4] });
      });
      g.txt('v', gx + gw / 2, gy - 0.5, { cor: 'fraco', tam: 11 });
      g.txt('P (kPa)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var nome = n < 0.05 ? 'isobárico (n = 0)' : Math.abs(n - 1) < 0.03 ? 'isotérmico (n = 1)' :
        Math.abs(n - 1.4) < 0.03 ? 'isentrópico (n = k = 1,4)' : n > 1.9 ? 'quase isocórico' : 'politrópico';
      var x0 = 8.2;
      g.txt(nome, x0, 5.2, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('V₂ = ' + fx(V2, 3) + ' m³', x0, 4.4, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('W = ' + fx(W, 1) + ' kJ', x0, 3.6, { cor: W < 0 ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt(W < 0 ? 'trabalho realizado sobre o gás' : 'trabalho realizado pelo gás', x0, 3.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('área sombreada = |W|', x0, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('estado 1: 100 kPa e 0,5 m³ de ar', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 5 ================= */

  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Balanço de energia de um sistema fechado: o que entra de calor, menos o que sai de trabalho, fica como energia interna. As barras fecham sempre.',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'Q', rot: 'Calor fornecido', min: -20, max: 40, val: 10, passo: 1, un: 'kJ' },
      { id: 'W', rot: 'Trabalho realizado', min: -20, max: 40, val: 4, passo: 1, un: 'kJ' }
    ],
    desenhar: function (g, p) {
      var Q = p.Q, W = p.W, dU = Q - W;
      var ox = 2.6, oy = 1.6, larg = 3.0, alt = 2.4;
      g.ret(ox, oy, larg, alt, { cor: 'forte', larg: 2, tracejado: [6, 4], preenche: 'acento', alfa: 0.12 });
      g.txt('sistema fechado', ox + larg / 2, oy + alt + 0.5, { cor: 'suave', tam: 12, negrito: true });
      g.txt('ΔU = ' + fx(dU, 1) + ' kJ', ox + larg / 2, oy + alt / 2, { cor: dU >= 0 ? 'ok' : 'erro', tam: 14, negrito: true });
      var k = 1.6 / 40;
      if (Math.abs(Q) > 0.2) g.seta(ox - 1.9, oy + alt * 0.7, Math.max(0.4, Math.abs(Q) * k) * (Q > 0 ? 1 : -1) + (Q > 0 ? 1.5 : -0), 0,
        { cor: 'erro', larg: 2.4, rot: 'Q = ' + fx(Q, 0) + ' kJ', rotTam: 11.5, rotDy: 0.45, rotDx: 0 });
      if (Math.abs(W) > 0.2) g.seta(ox + larg, oy + alt * 0.35, Math.max(0.4, Math.abs(W) * k) * (W > 0 ? 1 : -1), 0,
        { cor: 's1', larg: 2.4, rot: 'W = ' + fx(W, 0) + ' kJ', rotTam: 11.5, rotDy: -0.5, rotDx: 0.3 });
      /* barras do balanço */
      var x0 = 7.6, esc = 3.6 / 40;
      [['Q (entra)', Q, 'erro'], ['W (sai)', W, 's1'], ['ΔU (fica)', dU, 'ok']].forEach(function (b, i) {
        var y = 4.2 - i * 1.3;
        g.linha(x0, y - 0.1, x0, y + 0.72, { cor: 'fraco', larg: 1 });
        g.ret(x0, y, Math.abs(b[1]) * esc * (b[1] >= 0 ? 1 : -1), 0.6, { preenche: b[2], cor: null, alfa: 0.8 });
        g.txt(b[0] + ': ' + fx(b[1], 1) + ' kJ', x0, y + 1.0, { cor: b[2], tam: 11.5, alin: 'esq', negrito: true });
      });
      g.txt('Q − W = ΔU', 6, -2.3, { cor: 'suave', tam: 12.5, negrito: true });
    }
  });

  /* ================= capítulo 6 ================= */

  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Regime permanente: a mesma equação serve a todos os equipamentos. O que muda é quais termos podem ser desprezados (exemplo 6.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'eq', rot: 'Equipamento (1 bocal · 2 turbina · 3 compressor · 4 trocador · 5 válvula)', min: 1, max: 5, val: 1, passo: 1 },
      { id: 'dh', rot: 'Queda de entalpia', min: 20, max: 400, val: 200, passo: 10, un: 'kJ/kg' }
    ],
    desenhar: function (g, p) {
      var dh = p.dh;
      var eq = p.eq;
      var ox = 1.4, cy = 3.0;
      var info = {};
      if (eq === 1) {
        g.caminho([[ox, cy - 1.0], [ox + 3.4, cy - 0.45], [ox + 3.4, cy + 0.45], [ox, cy + 1.0]],
          { cor: 'forte', larg: 2, fechar: true, preenche: 'acento', alfa: 0.18 });
        info = { n: 'Bocal', desp: 'Q̇ = 0 e Ẇ = 0', res: 'v₂ = √(2Δh)', val: fx(Math.sqrt(2 * dh * 1000), 0) + ' m/s' };
      } else if (eq === 2 || eq === 3) {
        g.caminho([[ox, cy - (eq === 2 ? 0.5 : 1.0)], [ox + 3.4, cy - (eq === 2 ? 1.0 : 0.5)],
                   [ox + 3.4, cy + (eq === 2 ? 1.0 : 0.5)], [ox, cy + (eq === 2 ? 0.5 : 1.0)]],
          { cor: 'forte', larg: 2, fechar: true, preenche: 'acento', alfa: 0.18 });
        g.linha(ox + 1.7, cy + (eq === 2 ? 0.8 : 0.6), ox + 1.7, cy + 2.0, { cor: 'forte', larg: 2 });
        g.circ(ox + 1.7, cy + 2.2, 0.28, { cor: 'forte', larg: 2, preenche: 'baixo' });
        info = eq === 2
          ? { n: 'Turbina', desp: 'cinética e potencial desprezíveis', res: 'ẇ = Δh', val: fx(dh, 0) + ' kJ/kg produzidos' }
          : { n: 'Compressor', desp: 'cinética e potencial desprezíveis', res: 'ẇ = −Δh', val: fx(dh, 0) + ' kJ/kg consumidos' };
      } else if (eq === 4) {
        g.ret(ox, cy - 1.1, 3.4, 2.2, { cor: 'forte', larg: 2, preenche: 'acento', alfa: 0.12 });
        for (var i = 0; i < 3; i++) g.linha(ox + 0.2, cy - 0.6 + i * 0.6, ox + 3.2, cy - 0.6 + i * 0.6, { cor: 's2', larg: 1.8 });
        info = { n: 'Trocador de calor', desp: 'Ẇ = 0; sem perda para fora', res: 'ṁ₁Δh₁ = ṁ₂Δh₂', val: 'calor de um fluido vai todo para o outro' };
      } else {
        g.linha(ox, cy, ox + 1.4, cy, { cor: 'forte', larg: 6 });
        g.linha(ox + 2.0, cy, ox + 3.4, cy, { cor: 'forte', larg: 6 });
        g.caminho([[ox + 1.4, cy - 0.6], [ox + 1.7, cy], [ox + 1.4, cy + 0.6]], { cor: 'forte', larg: 2, fechar: true, preenche: 'baixo' });
        g.caminho([[ox + 2.0, cy - 0.6], [ox + 1.7, cy], [ox + 2.0, cy + 0.6]], { cor: 'forte', larg: 2, fechar: true, preenche: 'baixo' });
        info = { n: 'Válvula (estrangulamento)', desp: 'Q̇ = 0, Ẇ = 0, Δec e Δep desprezíveis', res: 'h₂ = h₁', val: 'isentálpico: a pressão cai e a entalpia não muda' };
      }
      g.seta(ox - 1.1, cy, 0.9, 0, { cor: 's3', larg: 2.2, rot: 'entrada', rotTam: 10.5, rotDy: 0.45, rotDx: -0.2 });
      g.seta(ox + 3.5, cy, 0.9, 0, { cor: 's2', larg: 2.2, rot: 'saída', rotTam: 10.5, rotDy: 0.45, rotDx: 0.2 });
      var x0 = 7.2;
      g.txt(info.n, x0, 5.2, { cor: 'texto', tam: 14, alin: 'esq', negrito: true });
      g.txt('despreza-se: ' + info.desp, x0, 4.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('resta: ' + info.res, x0, 3.5, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt(info.val, x0, 2.6, { cor: 'ok', tam: 12, alin: 'esq' });
      g.txt('Q̇ − Ẇ = Σṁₛ(h + v²/2 + gz)ₛ − Σṁₑ(…)ₑ', 6, -2.3, { cor: 'fraco', tam: 11.5 });
    }
  });

  /* ================= capítulo 7 ================= */

  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'O limite de Carnot depende só das temperaturas dos reservatórios. Qualquer máquina real fica abaixo da curva — e nenhuma pode ficar acima (exemplo 7.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'TH', rot: 'Fonte quente', min: 350, max: 1500, val: 813, passo: 10, un: 'K' },
      { id: 'TL', rot: 'Fonte fria', min: 250, max: 500, val: 303, passo: 5, un: 'K' },
      { id: 'real', rot: 'Rendimento real da máquina', min: 5, max: 70, val: 38, passo: 1, un: '%' }
    ],
    desenhar: function (g, p) {
      var TH = Math.max(p.TH, p.TL + 20), TL = p.TL, real = p.real / 100;
      var carnot = 1 - TL / TH;
      var frac = real / carnot;
      var gx = 1.3, gy = 1.0, gw = 5.6, gh = 4.4;
      var X = function (T) { return gx + gw * (T - 300) / 1200; };
      var Y = function (e) { return gy + gh * e; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var T = 300 + 1200 * i / 60;
        if (T <= TL) continue;
        pts.push([X(T), Y(1 - TL / T)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.caminho(pts.concat([[X(1500), gy], [X(Math.max(301, TL)), gy]]), { cor: null, preenche: 'erro', alfa: 0.07, fechar: true });
      g.txt('impossível', X(1100), Y(0.85), { cor: 'erro', tam: 11.5 });
      g.txt('região possível', X(900), Y(0.2), { cor: 'ok', tam: 11.5 });
      g.circ(X(TH), Y(carnot), 0.15, { preenche: 's1', cor: null });
      g.circ(X(TH), Y(Math.min(carnot, real)), 0.15, { preenche: real > carnot ? 'erro' : 'ok', cor: null });
      g.linha(X(TH), Y(Math.min(carnot, real)), X(TH), Y(carnot), { cor: 'fraco', larg: 1.2, tracejado: [4, 3] });
      [400, 700, 1000, 1300].forEach(function (T) {
        g.linha(X(T), gy, X(T), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(T + '', X(T), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [0.25, 0.5, 0.75].forEach(function (e) {
        g.linha(gx, Y(e), gx - 0.15, Y(e), { cor: 'fraco', larg: 1 });
        g.txt(fx(100 * e, 0) + '%', gx - 0.28, Y(e), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('T da fonte quente (K)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      var x0 = 7.6;
      g.txt('Carnot: ' + fx(100 * carnot, 1) + ' %', x0, 5.0, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('real: ' + fx(100 * real, 1) + ' %', x0, 4.2, { cor: real > carnot ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt(real > carnot ? 'viola a segunda lei!' : 'aproveita ' + fx(100 * frac, 0) + ' % do máximo teórico',
        x0, 3.4, { cor: real > carnot ? 'erro' : 'suave', tam: 12, alin: 'esq', negrito: real > carnot });
      g.txt('COP máx (refrigerador) ' + fx(TL / (TH - TL), 2), x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('COP máx (bomba de calor) ' + fx(TH / (TH - TL), 2), x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('η = 1 − T_L/T_H, com as temperaturas em kelvin', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 8 ================= */

  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Transferir calor com diferença de temperatura gera entropia: o que o reservatório quente perde é menos do que o frio ganha (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.6],
    altura: 350,
    controles: [
      { id: 'TH', rot: 'Reservatório quente', min: 320, max: 1200, val: 800, passo: 10, un: 'K' },
      { id: 'TL', rot: 'Reservatório frio', min: 250, max: 600, val: 300, passo: 10, un: 'K' },
      { id: 'Q', rot: 'Calor transferido', min: 100, max: 2000, val: 1000, passo: 50, un: 'kJ' }
    ],
    desenhar: function (g, p) {
      var TH = Math.max(p.TH, p.TL + 10), TL = p.TL, Q = p.Q;
      var dSh = -Q / TH, dSl = Q / TL, Sger = dSl + dSh;
      var ox = 1.2, oy = 2.0;
      g.ret(ox, oy, 2.4, 2.0, { preenche: 'erro', cor: 'forte', larg: 1.6, alfa: 0.25 });
      g.txt(fx(TH, 0) + ' K', ox + 1.2, oy + 1.0, { cor: 'erro', tam: 13, negrito: true });
      g.ret(ox + 5.0, oy, 2.4, 2.0, { preenche: 's1', cor: 'forte', larg: 1.6, alfa: 0.25 });
      g.txt(fx(TL, 0) + ' K', ox + 6.2, oy + 1.0, { cor: 's1', tam: 13, negrito: true });
      g.seta(ox + 2.5, oy + 1.0, 2.4, 0, { cor: 's2', larg: 3, rot: 'Q = ' + fx(Q, 0) + ' kJ', rotTam: 12, rotDy: 0.55, rotDx: -1.2 });
      g.txt('−' + fx(Math.abs(dSh), 3) + ' kJ/K', ox + 1.2, oy - 0.5, { cor: 'erro', tam: 11.5 });
      g.txt('+' + fx(dSl, 3) + ' kJ/K', ox + 6.2, oy - 0.5, { cor: 's1', tam: 11.5 });
      var x0 = 1.2, y0 = 0.8;
      g.ret(x0, y0 - 0.9, 8.8 * Math.min(1, dSl / (dSl + 0.001)) * 0.0 + 8.8 * (dSl / Math.max(dSl, 1e-9)) * 0, 0.5, { cor: null });
      var esc = 7.0 / Math.max(dSl, 1e-9);
      g.ret(x0, y0 - 1.1, Math.abs(dSh) * esc, 0.5, { preenche: 'erro', cor: null, alfa: 0.75 });
      g.ret(x0 + Math.abs(dSh) * esc, y0 - 1.1, Sger * esc, 0.5, { preenche: 'aviso', cor: null, alfa: 0.9 });
      g.txt('entropia que sai do quente', x0, y0 - 1.55, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.txt('gerada: ' + fx(Sger, 3) + ' kJ/K', x0 + Math.abs(dSh) * esc + 0.15, y0 - 1.55, { cor: 'aviso', tam: 11, alin: 'esq', negrito: true });
      g.txt('S gerada = Q/T_L − Q/T_H = ' + fx(Sger, 3) + ' kJ/K', 6, 5.2, { cor: 'aviso', tam: 13.5, negrito: true });
      g.txt('exergia destruída (T₀ = 300 K): ' + fx(300 * Sger, 0) + ' kJ', 6, 4.6, { cor: 'suave', tam: 12 });
      g.txt('quanto maior a diferença de temperatura, mais entropia gerada', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 9 ================= */

  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Exergia de uma fonte de calor: só parte dela pode virar trabalho, e essa parte cai depressa quando a temperatura se aproxima da do ambiente.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura da fonte', min: 320, max: 1200, val: 600, passo: 10, un: 'K' },
      { id: 'T0', rot: 'Ambiente (estado morto)', min: 270, max: 320, val: 300, passo: 1, un: 'K' },
      { id: 'Q', rot: 'Calor disponível', min: 100, max: 2000, val: 1000, passo: 50, un: 'kJ' }
    ],
    desenhar: function (g, p) {
      var T = Math.max(p.T, p.T0 + 5), T0 = p.T0, Q = p.Q;
      var exergia = Q * (1 - T0 / T), anergia = Q - exergia;
      var gx = 1.3, gy = 1.2, gw = 5.4, gh = 3.8;
      var X = function (TT) { return gx + gw * (TT - 300) / 900; };
      var Y = function (f) { return gy + gh * f; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 60; i++) {
        var TT = 300 + 900 * i / 60;
        if (TT <= T0) continue;
        pts.push([X(TT), Y(1 - T0 / TT)]);
      }
      g.caminho(pts, { cor: 's4', larg: 2.6 });
      g.circ(X(T), Y(1 - T0 / T), 0.15, { preenche: 'erro', cor: null });
      [400, 700, 1000].forEach(function (TT) {
        g.linha(X(TT), gy, X(TT), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(TT + '', X(TT), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('T da fonte (K)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('fração útil', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.4, esc = 4.2 / Q;
      g.ret(x0, 3.4, exergia * esc, 0.65, { preenche: 'ok', cor: null, alfa: 0.85 });
      g.ret(x0 + exergia * esc, 3.4, anergia * esc, 0.65, { preenche: 'borda', cor: null, alfa: 0.9 });
      g.txt('exergia ' + fx(exergia, 0) + ' kJ', x0, 4.4, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt('anergia ' + fx(anergia, 0) + ' kJ', x0, 2.9, { cor: 'fraco', tam: 12, alin: 'esq' });
      g.txt(fx(100 * exergia / Q, 1) + ' % do calor pode virar trabalho', x0, 2.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('o resto precisa ser rejeitado ao ambiente', x0, 1.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('exergia do calor = Q(1 − T₀/T): é o mesmo fator de Carnot', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 10 ================= */

  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Ciclo Rankine no diagrama T-s, com o domo real da água. Subir a pressão da caldeira e superaquecer melhoram o rendimento; o limite prático é a umidade no fim da expansão.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'Pc', rot: 'Pressão da caldeira', min: 2, max: 20, val: 8, passo: 0.5, un: 'MPa' },
      { id: 'Tmax', rot: 'Temperatura máxima', min: 350, max: 600, val: 480, passo: 10, un: '°C' },
      { id: 'Pcond', rot: 'Pressão do condensador', min: 5, max: 100, val: 10, passo: 5, un: 'kPa' }
    ],
    desenhar: function (g, p) {
      var Pc = p.Pc * 1000, Tmax = p.Tmax, Pcond = p.Pcond;
      var Tcond = Tsat(Pcond), Tsatc = Tsat(Pc);
      if (Tmax < Tsatc + 10) Tmax = Tsatc + 10;
      /* entropias: 1 e 2 na linha de líquido; 3 superaquecido; 4 isentrópico até o condensador */
      var s1 = sf(Tcond), s2 = s1, s3 = sg(Tsatc) + 2.3 * Math.log((Tmax + 273.15) / (Tsatc + 273.15));
      var s4 = s3;
      var x4 = (s4 - sf(Tcond)) / (sg(Tcond) - sf(Tcond));
      /* rendimento: Carnot com a temperatura média termodinâmica, descontadas as irreversibilidades típicas */
      var Tm = (Tsatc + Tmax) / 2 + 273.15;
      var eta = (1 - (Tcond + 273.15) / Tm) * 0.74;
      var gx = 1.3, gy = 1.0, gw = 5.8, gh = 4.4;
      var X = function (sv) { return gx + gw * (sv - 0) / 9.5; };
      var Y = function (T) { return gy + gh * T / 650; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, dome = [];
      for (i = 0; i <= 30; i++) { var T = 5 + (374 - 5) * i / 30; dome.push([X(sf(T)), Y(T)]); }
      for (i = 30; i >= 0; i--) { var T2 = 5 + (374 - 5) * i / 30; dome.push([X(sg(T2)), Y(T2)]); }
      g.caminho(dome, { cor: 'borda', larg: 1.8 });
      g.txt('domo de saturação', X(8.6), Y(230), { cor: 'fraco', tam: 10.5 });
      /* ciclo: 1-2 bomba, 2-3 caldeira (líquido, vaporização, superaquecimento), 3-4 turbina, 4-1 condensador */
      var ciclo = [[X(s1), Y(Tcond)], [X(s2), Y(Tcond + 3)], [X(sf(Tsatc)), Y(Tsatc)], [X(sg(Tsatc)), Y(Tsatc)],
                   [X(s3), Y(Tmax)], [X(s4), Y(Tcond)], [X(s1), Y(Tcond)]];
      g.caminho(ciclo, { cor: 's2', larg: 2.6, preenche: 's2', alfa: 0.12, fechar: true });
      [[0, '1'], [1, '2'], [4, '3'], [5, '4']].forEach(function (d) {
        g.circ(ciclo[d[0]][0], ciclo[d[0]][1], 0.13, { preenche: 'texto', cor: null });
        g.txt(d[1], ciclo[d[0]][0] + (d[1] === '4' ? 0.3 : -0.3), ciclo[d[0]][1] + 0.3, { cor: 'texto', tam: 11.5, fundo: true });
      });
      [2, 4, 6, 8].forEach(function (sv) {
        g.linha(X(sv), gy, X(sv), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(sv + '', X(sv), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [100, 200, 300, 400, 500, 600].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.15, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.28, Y(T), { cor: 'fraco', tam: 9.5, alin: 'dir' });
      });
      g.txt('s (kJ/kg·K)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.5, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.8;
      g.txt('Tsat da caldeira ' + fx(Tsatc, 0) + ' °C', x0, 5.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('condensador ' + fx(Tcond, 0) + ' °C', x0, 4.6, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('η ≈ ' + fx(100 * eta, 1) + ' %', x0, 3.7, { cor: 's2', tam: 15, alin: 'esq', negrito: true });
      g.txt('título na saída da turbina', x0, 2.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(Math.min(1, x4), 3), x0, 2.3, { cor: x4 < 0.88 ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt(x4 < 0.88 ? 'umidade alta: use reaquecimento' : 'dentro do limite usual (≥ 0,88)',
        x0, 1.6, { cor: x4 < 0.88 ? 'erro' : 'ok', tam: 11.5, alin: 'esq' });
      g.txt('estimativa para leitura do ciclo; o projeto usa tabelas de vapor', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 11 ================= */

  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Rendimento dos ciclos a ar padrão. O Otto depende só da razão de compressão; o Diesel paga uma penalidade pelo corte, mas usa r muito maior (exemplo 11.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'r', rot: 'Razão de compressão', min: 4, max: 24, val: 9, passo: 0.5 },
      { id: 'rc', rot: 'Razão de corte (Diesel)', min: 1.2, max: 4, val: 2, passo: 0.1 }
    ],
    desenhar: function (g, p) {
      var k = 1.4, r = p.r, rc = p.rc;
      var otto = 1 - Math.pow(r, 1 - k);
      var diesel = 1 - (1 / Math.pow(r, k - 1)) * ((Math.pow(rc, k) - 1) / (k * (rc - 1)));
      var gx = 1.3, gy = 1.0, gw = 5.8, gh = 4.4;
      var X = function (rr) { return gx + gw * (rr - 4) / 20; };
      var Y = function (e) { return gy + gh * e / 0.75; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, po = [], pd = [];
      for (i = 0; i <= 60; i++) {
        var rr = 4 + 20 * i / 60;
        po.push([X(rr), Y(1 - Math.pow(rr, 1 - k))]);
        pd.push([X(rr), Y(1 - (1 / Math.pow(rr, k - 1)) * ((Math.pow(rc, k) - 1) / (k * (rc - 1))))]);
      }
      g.caminho(po, { cor: 's1', larg: 2.6 });
      g.caminho(pd, { cor: 's2', larg: 2.6 });
      g.circ(X(r), Y(otto), 0.15, { preenche: 's1', cor: null });
      g.circ(X(r), Y(diesel), 0.15, { preenche: 's2', cor: null });
      /* faixas práticas */
      g.ret(X(8), gy, X(12) - X(8), gh, { preenche: 's1', cor: null, alfa: 0.08 });
      g.ret(X(14), gy, X(22) - X(14), gh, { preenche: 's2', cor: null, alfa: 0.08 });
      g.txt('gasolina', (X(8) + X(12)) / 2, gy + gh - 0.3, { cor: 's1', tam: 10.5 });
      g.txt('diesel', (X(14) + X(22)) / 2, gy + gh - 0.3, { cor: 's2', tam: 10.5 });
      [4, 8, 12, 16, 20, 24].forEach(function (rr) {
        g.linha(X(rr), gy, X(rr), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(rr + '', X(rr), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [0.2, 0.4, 0.6].forEach(function (e) {
        g.linha(gx, Y(e), gx - 0.15, Y(e), { cor: 'fraco', larg: 1 });
        g.txt(fx(100 * e, 0) + '%', gx - 0.28, Y(e), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('razão de compressão', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      var x0 = 7.8;
      g.txt('Otto: ' + fx(100 * otto, 1) + ' %', x0, 4.8, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('Diesel: ' + fx(100 * diesel, 1) + ' %', x0, 4.0, { cor: 's2', tam: 14, alin: 'esq', negrito: true });
      g.txt('com o mesmo r, o Otto rende mais', x0, 3.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('mas o Diesel comprime só ar e', x0, 2.55, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('chega a r = 16 a 22 sem detonar', x0, 2.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('corte rc = ' + fx(rc, 2) + ': quanto maior, menor o rendimento do Diesel', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* ================= capítulo 12 ================= */

  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Brayton: o rendimento cresce com a razão de pressão, mas o trabalho líquido passa por um máximo — e o compressor consome boa parte do que a turbina produz (exemplo 12.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'rp', rot: 'Razão de pressão', min: 2, max: 30, val: 10, passo: 0.5 },
      { id: 'Tmax', rot: 'Temperatura na entrada da turbina', min: 900, max: 1700, val: 1300, passo: 20, un: 'K' }
    ],
    desenhar: function (g, p) {
      var k = 1.4, cp = 1.005, T1 = 300, rp = p.rp, T3 = p.Tmax;
      var eta = 1 - Math.pow(rp, (1 - k) / k);
      var T2 = T1 * Math.pow(rp, (k - 1) / k);
      var T4 = T3 / Math.pow(rp, (k - 1) / k);
      var wT = cp * (T3 - T4), wC = cp * (T2 - T1), wliq = wT - wC;
      var rbw = wC / wT;
      var gx = 1.3, gy = 1.0, gw = 5.8, gh = 4.4;
      var X = function (r) { return gx + gw * (r - 2) / 28; };
      var Ye = function (e) { return gy + gh * e / 0.8; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pe = [], pw = [], wmax = 0;
      for (i = 0; i <= 60; i++) {
        var r = 2 + 28 * i / 60;
        var e = 1 - Math.pow(r, (1 - k) / k);
        var t2 = T1 * Math.pow(r, (k - 1) / k), t4 = T3 / Math.pow(r, (k - 1) / k);
        var w = cp * (T3 - t4) - cp * (t2 - T1);
        wmax = Math.max(wmax, w);
        pe.push([X(r), Ye(e)]); pw.push([X(r), w]);
      }
      g.caminho(pe, { cor: 's1', larg: 2.6 });
      g.caminho(pw.map(function (q) { return [q[0], gy + gh * q[1] / (wmax * 1.2)]; }), { cor: 's4', larg: 2.2, tracejado: [6, 4] });
      g.circ(X(rp), Ye(eta), 0.15, { preenche: 's1', cor: null });
      g.circ(X(rp), gy + gh * wliq / (wmax * 1.2), 0.15, { preenche: 's4', cor: null });
      [5, 10, 15, 20, 25, 30].forEach(function (r) {
        g.linha(X(r), gy, X(r), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(r + '', X(r), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('razão de pressão', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('η (cheia) · trabalho líquido (tracejada)', gx + gw / 2, gy + gh + 0.4, { cor: 'fraco', tam: 10.5 });
      var x0 = 7.8;
      g.txt('η = ' + fx(100 * eta, 1) + ' %', x0, 5.0, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('w líquido ' + fx(wliq, 0) + ' kJ/kg', x0, 4.2, { cor: 's4', tam: 13, alin: 'esq', negrito: true });
      g.txt('turbina ' + fx(wT, 0) + ' · compressor ' + fx(wC, 0), x0, 3.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.ret(x0, 2.4, 4.2 * rbw, 0.5, { preenche: 'erro', cor: null, alfa: 0.75 });
      g.ret(x0, 2.4, 4.2, 0.5, { cor: 'borda', larg: 1.2 });
      g.txt('o compressor consome ' + fx(100 * rbw, 0) + ' % do trabalho da turbina', x0, 1.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T₂ = ' + fx(T2, 0) + ' K · T₄ = ' + fx(T4, 0) + ' K', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(T4 > T2 ? 'T₄ > T₂: a regeneração ainda compensa' : 'T₄ < T₂: regenerar não ajuda mais', 6, -2.3,
        { cor: T4 > T2 ? 'ok' : 'aviso', tam: 11.5 });
    }
  });

  /* ================= capítulo 13 ================= */

  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'COP de refrigeração: quanto menor a diferença entre evaporador e condensador, melhor. É por isso que o ar-condicionado perde eficiência em dia quente (exemplo 13.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'TL', rot: 'Evaporador', min: -40, max: 15, val: -10, passo: 1, un: '°C' },
      { id: 'TH', rot: 'Condensador', min: 25, max: 65, val: 40, passo: 1, un: '°C' },
      { id: 'ef', rot: 'Fração do COP de Carnot', min: 30, max: 80, val: 60, passo: 5, un: '%' }
    ],
    desenhar: function (g, p) {
      var TL = p.TL + 273.15, TH = p.TH + 273.15, f = p.ef / 100;
      var copC = TL / (TH - TL), copR = f * copC;
      var QL = 3.5;                     /* kW de carga térmica, para o exemplo numérico */
      var W = QL / copR, QH = QL + W;
      var ox = 1.4, oy = 1.2;
      g.ret(ox, oy + 3.0, 3.4, 1.0, { preenche: 'erro', cor: 'forte', larg: 1.4, alfa: 0.25 });
      g.txt('condensador ' + p.TH + ' °C', ox + 1.7, oy + 3.5, { cor: 'erro', tam: 11.5 });
      g.ret(ox, oy, 3.4, 1.0, { preenche: 's1', cor: 'forte', larg: 1.4, alfa: 0.25 });
      g.txt('evaporador ' + p.TL + ' °C', ox + 1.7, oy + 0.5, { cor: 's1', tam: 11.5 });
      g.ret(ox + 1.0, oy + 1.4, 1.4, 1.2, { preenche: 'acento', cor: 'forte', larg: 1.4, alfa: 0.3 });
      g.txt('compressor', ox + 1.7, oy + 2.0, { cor: 'suave', tam: 10.5 });
      g.seta(ox + 1.7, oy + 1.05, 0, 0.3, { cor: 's1', larg: 2, ponta: 0.18 });
      g.seta(ox + 1.7, oy + 2.65, 0, 0.3, { cor: 'erro', larg: 2, ponta: 0.18 });
      g.seta(ox + 3.6, oy + 2.0, -1.1, 0, { cor: 's4', larg: 2.4, rot: 'W', rotTam: 12, rotDx: 0.4, rotDy: 0 });
      g.seta(ox - 0.3, oy + 0.5, -1.0, 0, { cor: 's1', larg: 2.2, rot: 'Q_L', rotTam: 11.5, rotDx: -0.4, rotDy: 0.1 });
      g.seta(ox + 3.5, oy + 3.5, 1.0, 0, { cor: 'erro', larg: 2.2, rot: 'Q_H', rotTam: 11.5, rotDx: 0.4, rotDy: 0.1 });
      var x0 = 7.2;
      g.txt('COP de Carnot ' + fx(copC, 2), x0, 5.0, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('COP real ' + fx(copR, 2), x0, 4.2, { cor: 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt('para ' + fx(QL, 1) + ' kW de carga:', x0, 3.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('compressor ' + fx(W, 2) + ' kW', x0, 2.7, { cor: 's4', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('calor rejeitado ' + fx(QH, 2) + ' kW', x0, 2.1, { cor: 'erro', tam: 12, alin: 'esq' });
      g.ret(x0, 1.0, 4.2 * Math.min(1, copR / 8), 0.5, { preenche: 'ok', cor: null, alfa: 0.8 });
      g.txt('bomba de calor: COP = ' + fx(TH / (TH - TL) * f, 2) + ' (um a mais)', x0, 0.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('aproximar as temperaturas é o caminho mais barato para ganhar eficiência', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

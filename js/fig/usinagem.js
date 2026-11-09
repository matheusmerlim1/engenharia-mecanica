/* ============================================================
   Figuras ilustrativas de Usinagem
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar, VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }); }
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) { var linhas = [], atual = ''; ctx.save(); ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'; it.t.split(' ').forEach(function (p) { var q = atual ? atual + ' ' + p : p; if (atual && ctx.measureText(q).width > larg) { linhas.push(atual); atual = p; } else atual = q; }); linhas.push(atual); ctx.restore(); linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; }); });
  }
  function painel(g, t, linhas, obs) {
    g.txt(t, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) { g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' }); g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true }); });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function eixos(g, xa, xb, ya, yb, rx, ry, px, py) {
    var x0 = 0.9, x1 = 8.3, y0 = 0.7, y1 = 6.7, v, X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); }, Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) { g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 }); }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) { g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' }); }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 }); g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 }); g.txt(ry, x0 - 0.3, y1 + 0.38, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) { var p = [], i, m = n || 200, fe = function () { if (p.length > 1) g.caminho(p, o); p = []; }; for (i = 0; i <= m; i++) { var v = xa + (xb - xa) * i / m, y = f(v); if (!isFinite(y) || y < a.ya || y > a.yb) fe(); else p.push([a.X(v), a.Y(y)]); } fe(); }

  /* 1.1 */
  F('#fig-1-1', {
    titulo: 'Figura 1.1', legenda: 'A velocidade de corte depende do diâmetro. Para manter a mesma velocidade em uma peça menor, a rotação precisa aumentar na mesma proporção.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'D', rot: 'Diâmetro D', min: 20, max: 200, val: 100, passo: 1, un: 'mm' }, { id: 'n', rot: 'Rotação n', min: 100, max: 3000, val: 500, passo: 10, un: 'rpm' }],
    desenhar: function (g, p) {
      var R = 2.8 * p.D / 200 + 0.3, cx = 4.5, cy = 3.7;
      g.circ(cx, cy, R, { cor: 's1', larg: 2, preenche: 's1', alfa: 0.2 });
      g.linha(cx, cy, cx + R, cy, { cor: 'forte', larg: 1.4 });
      g.txt('D/2', cx + R / 2, cy + 0.3, { cor: 'suave', tam: 10.5 });
      g.seta(cx, cy + R, 1.5, 0, { cor: 'erro', larg: 2.4, ponta: 0.25 });
      g.txt('v', cx + 1.7, cy + R + 0.3, { cor: 'erro', tam: 12, negrito: true });
      g.arco(cx, cy, R * 0.55, 0.3, 2.6, { cor: 'aviso', ponta: true });
      var vc = Math.PI * p.D * p.n / 1000;
      painel(g, 'Velocidade de corte', [['vc', fx(vc, 1) + ' m/min', 'erro'], ['em m/s', fx(vc / 60, 2)], ['n para 120 m/min', fx(120000 / (Math.PI * p.D), 0) + ' rpm', 'ok']], [{ t: 'vc = πDn/1000, com D em mm' }]);
    }
  });

  /* 2.1 */
  F('#fig-2-1', {
    titulo: 'Figura 2.1', legenda: 'O material é cisalhado ao longo de um plano inclinado de φ. Quanto maior o atrito na face da ferramenta, menor o ângulo de cisalhamento e mais espesso o cavaco.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'g', rot: 'Ângulo de saída', min: -10, max: 30, val: 10, passo: 1, un: '°' }, { id: 'b', rot: 'Ângulo de atrito β', min: 20, max: 75, val: 60, passo: 1, un: '°' }],
    desenhar: function (g, p) {
      var ga = p.g * Math.PI / 180, phi = (45 + p.g / 2 - p.b / 2) * Math.PI / 180, x0 = 4.8, y0 = 3.0, h = 1.2;
      g.ret(0.5, 1.0, 7.9, y0 - 1.0, { cor: 's1', larg: 1.4, preenche: 's1', alfa: 0.2 });
      g.ret(0.5, y0, x0 - h / Math.tan(phi) - 0.5, h, { cor: 's1', larg: 1.4, preenche: 's1', alfa: 0.35 });
      var xs = x0 - h / Math.tan(phi);
      var u = [Math.sin(ga), Math.cos(ga)];
      var L = 3.0, hc = h * Math.cos(phi - ga) / Math.sin(phi);
      var ext = hc > 2.6 ? 2.6 : hc;
      g.caminho([[xs, y0 + h], [x0, y0], [x0 + u[0] * L, y0 + u[1] * L], [x0 + u[0] * L - ext * Math.cos(ga), y0 + u[1] * L + ext * Math.sin(ga)]], { cor: 'aviso', larg: 1.8, preenche: 'aviso', alfa: 0.3, fechar: true });
      g.caminho([[x0, y0], [x0 + u[0] * 4.2, y0 + u[1] * 4.2], [x0 + 3.2, y0 + 4.0], [x0 + 2.0, y0 + 0.25]], { cor: 'forte', larg: 1.4, preenche: 'forte', alfa: 0.35, fechar: true });
      g.linha(xs, y0 + h, x0, y0, { cor: 'erro', larg: 3 });
      g.txt('plano de cisalhamento', (xs + x0) / 2, y0 - 0.4, { cor: 'erro', tam: 10.5, negrito: true });
      var r = Math.sin(phi) / Math.cos(phi - ga);
      painel(g, 'Corte ortogonal', [['φ', fx(phi * 180 / Math.PI, 1) + '°', 'erro'], ['razão r = h/hc', fx(r, 3)], ['hc / h', fx(1 / r, 2), 'aviso']], [{ t: 'Merchant: φ = 45° + γ/2 − β/2' }, { t: 'azul: peça; laranja: cavaco; cinza: ferramenta' }]);
    }
  });

  /* 3.1 */
  F('#fig-3-1', {
    titulo: 'Figura 3.1', legenda: 'A força específica de corte cresce quando o cavaco fica fino. A força total ainda aumenta com o avanço, mas menos que proporcionalmente.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k', rot: 'kₛ₁', min: 800, max: 2800, val: 1700, passo: 50, un: 'MPa' }, { id: 'm', rot: 'Expoente mc', min: 0.1, max: 0.4, val: 0.25, passo: 0.01 }, { id: 'ap', rot: 'Profundidade aₚ', min: 1, max: 6, val: 3, passo: 0.1, un: 'mm' }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 1, 0, 6000, 'avanço f (mm/rot)', 'kₛ (MPa) e Fc (N)', 0.2, 1000), ks = function (f) { return p.k * Math.pow(f, -p.m); };
      curva(g, a, ks, 0.03, 1, { cor: 'erro', larg: 2.4 });
      curva(g, a, function (f) { return ks(f) * f * p.ap; }, 0.01, 1, { cor: 's1', larg: 2.6 });
      painel(g, 'Em f = 0,25', [['kₛ', fx(ks(0.25), 0) + ' MPa', 'erro'], ['Fc', fx(ks(0.25) * 0.25 * p.ap, 0) + ' N', 's1'], ['kₛ em f = 0,5', fx(ks(0.5), 0) + ' MPa']], [{ t: 'vermelho: força específica; azul: força de corte' }]);
    }
  });

  /* 4.1 */
  F('#fig-4-1', {
    titulo: 'Figura 4.1', legenda: 'Curvas qualitativas de dureza a quente. O aço rápido perde dureza acima de cerca de 600 °C, e é por isso que opera em velocidades muito menores que metal duro e cerâmica.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'T', rot: 'Temperatura na aresta', min: 20, max: 1200, val: 700, passo: 10, un: '°C' }],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 1200, 0, 100, 'temperatura (°C)', 'dureza relativa (%)', 200, 20);
      var M = [['aço rápido', 's3', function (T) { return 42 / (1 + Math.exp((T - 620) / 55)); }], ['metal duro', 's1', function (T) { return 60 / (1 + Math.exp((T - 1000) / 180)); }], ['cerâmica', 'aviso', function (T) { return 72 / (1 + Math.exp((T - 1300) / 220)); }], ['CBN', 'erro', function (T) { return 96 / (1 + Math.exp((T - 1500) / 250)); }]];
      M.forEach(function (m) { curva(g, a, m[2], 0, 1200, { cor: m[1], larg: 2.4 }); });
      g.linha(a.X(p.T), a.y0, a.X(p.T), a.y1, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      painel(g, 'A ' + fx(p.T, 0) + ' °C', M.map(function (m) { return [m[0], fx(m[2](p.T), 0) + ' %', m[1]]; }), [{ t: 'curvas qualitativas, para comparar materiais' }]);
    }
  });

  /* 5.1 */
  F('#fig-5-1', {
    titulo: 'Figura 5.1', legenda: 'O desgaste de flanco tem três fases. A vida da ferramenta termina quando o desgaste atinge o critério adotado, e velocidades maiores chegam ali mais cedo.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'v', rot: 'Velocidade de corte', min: 80, max: 300, val: 150, passo: 5, un: 'm/min' }],
    desenhar: function (g, p) {
      var C = 300, n = 0.25, T = Math.pow(C / p.v, 1 / n), a = eixos(g, 0, 100, 0, 0.6, 'tempo (min)', 'VB (mm)', 20, 0.1);
      var vb = function (t, T0) { var x = t / T0; return 0.09 * (1 - Math.exp(-x * 14)) + 0.18 * x + 0.03 * Math.pow(x, 8); };
      [100, 150, 200, 250].forEach(function (v) { var Tv = Math.pow(C / v, 1 / n); curva(g, a, function (t) { return vb(t, Tv); }, 0, 100, { cor: 'borda', larg: 1.2 }); });
      curva(g, a, function (t) { return vb(t, T); }, 0, 100, { cor: 's1', larg: 2.8 });
      g.linha(a.x0, a.Y(0.3), a.x1, a.Y(0.3), { cor: 'erro', larg: 1.6, tracejado: [5, 4] });
      g.txt('critério 0,3 mm', a.x1 - 0.1, a.Y(0.3) + 0.25, { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true });
      if (T <= 100) { g.linha(a.X(T), a.y0, a.X(T), a.Y(0.3), { cor: 'fraco', larg: 1, tracejado: [4, 4] }); g.circ(a.X(T), a.Y(0.3), 0.12, { preenche: 'erro', cor: null }); }
      painel(g, 'Vida da ferramenta', [['vc', fx(p.v, 0) + ' m/min'], ['vida T', fx(T, 1) + ' min', 's1'], ['C e n', '300 e 0,25']], [{ t: 'curvas cinza: outras velocidades' }]);
    }
  });

  /* 6.1 */
  F('#fig-6-1', {
    titulo: 'Figura 6.1', legenda: 'A ponta da ferramenta deixa arcos na superfície. A altura entre eles cresce com o quadrado do avanço e diminui com o raio de ponta.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'f', rot: 'Avanço f', min: 0.05, max: 0.6, val: 0.3, passo: 0.01, un: 'mm/rot' }, { id: 'r', rot: 'Raio de ponta', min: 0.2, max: 2, val: 0.8, passo: 0.1, un: 'mm' }],
    desenhar: function (g, p) {
      var Rt = p.f * p.f / (8 * p.r), esc = 8 / (1.6), H = Math.max(1.6, Math.min(4, Rt * 60)), base = 2.0, N = Math.floor(1.6 / p.f) + 2, i, pts = [];
      for (i = 0; i <= 400; i++) {
        var x = i / 400 * 1.6, u = ((x + p.f / 2) % p.f) - p.f / 2, y = (u * u / (2 * p.r)) / Rt;
        pts.push([0.5 + x * esc, base + Math.min(1.2, y) * H]);
      }
      g.caminho(pts.concat([[8.5, 0.8], [0.5, 0.8]]), { cor: 's1', larg: 1.8, preenche: 's1', alfa: 0.25, fechar: true });
      g.linha(0.5, base + H, 8.5, base + H, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.txt('amplificação vertical', 4.5, 6.5, { cor: 'fraco', tam: 10 });
      void N;
      painel(g, 'Rugosidade teórica', [['Rt', fx(Rt * 1000, 2) + ' µm', 's1'], ['Ra', fx(p.f * p.f / (32 * p.r) * 1000, 2) + ' µm', 'ok']], [{ t: 'reduzir o avanço à metade divide a rugosidade por quatro' }]);
    }
  });

  /* 7.1 */
  F('#fig-7-1', {
    titulo: 'Figura 7.1', legenda: 'A velocidade de corte da broca cresce linearmente do centro à periferia. O centro não corta: ele empurra o material.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'D', rot: 'Diâmetro', min: 5, max: 40, val: 20, passo: 1, un: 'mm' }, { id: 'n', rot: 'Rotação', min: 100, max: 2500, val: 800, passo: 10, un: 'rpm' }],
    desenhar: function (g, p) {
      var vm = Math.PI * p.D * p.n / 1000, a = eixos(g, 0, p.D / 2 * 1.1, 0, Math.max(vm * 1.2, 10), 'raio (mm)', 'vc (m/min)', Math.max(1, Math.round(p.D / 10)), Math.max(10, Math.round(vm / 5 / 10) * 10));
      curva(g, a, function (r) { return vm * r / (p.D / 2); }, 0, p.D / 2, { cor: 'erro', larg: 2.8 });
      g.circ(a.X(p.D / 2), a.Y(vm), 0.13, { preenche: 'erro', cor: null }); g.circ(a.X(0), a.Y(0), 0.13, { preenche: 's1', cor: null });
      painel(g, 'Broca', [['vc na periferia', fx(vm, 1) + ' m/min', 'erro'], ['vc no centro', '0', 's1']], [{ t: 'a aresta transversal extruda o material e gera boa parte da força de avanço' }]);
    }
  });

  /* 8.1 */
  F('#fig-8-1', {
    titulo: 'Figura 8.1', legenda: 'A largura de corte define quantos graus de cada volta o dente passa dentro do material. Em largura pequena, o dente corta pouco tempo e esfria mais.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'ae', rot: 'aₑ / D', min: 0.05, max: 1, val: 0.5, passo: 0.01 }, { id: 'z', rot: 'Dentes', min: 1, max: 10, val: 4, passo: 1 }],
    desenhar: function (g, p) {
      var R = 2.7, cx = 4.5, cy = 4.0, ybase = cy - R + 2 * R * p.ae, i, phi = Math.acos(Math.max(-1, 1 - 2 * p.ae));
      g.ret(0.7, 0.8, 7.6, ybase - 0.8, { cor: 'borda', larg: 1, preenche: 's1', alfa: 0.25 });
      g.circ(cx, cy, R, { cor: 'forte', larg: 1.8 });
      var pts = [[cx, cy]]; for (i = 0; i <= 60; i++) { var t = -Math.PI / 2 - phi + 2 * phi * i / 60; pts.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
      g.caminho(pts, { cor: 'erro', larg: 1.4, preenche: 'erro', alfa: 0.3, fechar: true });
      var dentes = Math.round(p.z), ativos = 2 * phi / (2 * Math.PI) * dentes;
      for (i = 0; i < dentes; i++) { var a = 2 * Math.PI * i / dentes - Math.PI / 2; g.circ(cx + R * Math.cos(a), cy + R * Math.sin(a), 0.14, { preenche: 'texto', cor: null }); }
      painel(g, 'Contato', [['ângulo de contato', fx(2 * phi * 90 / Math.PI, 0) + '°', 'erro'], ['fração da volta', fx(phi / Math.PI * 100, 0) + ' %'], ['dentes em corte', fx(ativos, 2), ativos < 1 ? 'aviso' : 'ok']], [{ t: 'com menos de um dente em corte, a força oscila muito' }]);
    }
  });
})();

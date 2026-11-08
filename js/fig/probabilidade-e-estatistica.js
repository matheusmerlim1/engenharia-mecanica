/* ============================================================
   Figuras ilustrativas de Probabilidade e Estatística
   Assimetria, Venn, Bayes, densidade e acumulada, Poisson,
   Weibull, correlação, t contra normal, intervalo, erros de
   teste, regressão, sistemas e capacidade.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura || !window.PE) return;
  var F = window.Figura.criar, PE = window.PE;
  var VISTA = [-0.6, 13.4, -0.9, 7.8], ALTURA = 500, XR = 9.0, XV = 13.2;
  function fx(v, n) { return (+v).toLocaleString('pt-BR', { maximumFractionDigits: n == null ? 3 : n }); }
  function notas(g, x, y, xMax, itens) {
    var ctx = g.ctx, larg = g.X(xMax) - g.X(x), passo = 15 / Math.abs(g.X(1) - g.X(0));
    itens.forEach(function (it) {
      var linhas = [], atual = '';
      ctx.save(); ctx.font = '10px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      it.t.split(' ').forEach(function (pal) { var prova = atual ? atual + ' ' + pal : pal; if (atual && ctx.measureText(prova).width > larg) { linhas.push(atual); atual = pal; } else atual = prova; });
      linhas.push(atual); ctx.restore();
      linhas.forEach(function (l) { g.txt(l, x, y, { cor: it.cor || 'fraco', tam: 10, alin: 'esq' }); y -= passo; });
    });
  }
  function painel(g, titulo, linhas, obs) {
    g.txt(titulo, XR, 7.3, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
    linhas.forEach(function (l, i) {
      g.txt(l[0], XR, 6.65 - i * 0.56, { cor: 'fraco', tam: 10, alin: 'esq' });
      g.txt(l[1], XV, 6.65 - i * 0.56, { cor: l[2] || 'texto', tam: 11, alin: 'dir', negrito: true });
    });
    if (obs) notas(g, XR, 6.65 - linhas.length * 0.56 - 0.1, XV, obs);
  }
  function eixos(g, xa, xb, ya, yb, rx, ry, px, py) {
    var x0 = 0.9, x1 = 8.3, y0 = 0.7, y1 = 6.7, v;
    var X = function (u) { return x0 + (x1 - x0) * (u - xa) / (xb - xa); };
    var Y = function (u) { return y0 + (y1 - y0) * (u - ya) / (yb - ya); };
    for (v = Math.ceil(xa / px - 1e-9) * px; v <= xb + 1e-9; v += px) { g.linha(X(v), y0, X(v), y1, { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), X(v), y0 - 0.3, { cor: 'fraco', tam: 10 }); }
    for (v = Math.ceil(ya / py - 1e-9) * py; v <= yb + 1e-9; v += py) { g.linha(x0, Y(v), x1, Y(v), { cor: 'borda', larg: 0.8, tracejado: [3, 4] }); g.txt(fx(v, 2), x0 - 0.15, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' }); }
    g.linha(x0, y0, x1, y0, { cor: 'forte', larg: 1.4 }); g.linha(x0, y0, x0, y1, { cor: 'forte', larg: 1.4 });
    g.txt(rx, (x0 + x1) / 2, y0 - 0.72, { cor: 'suave', tam: 10.5 });
    g.txt(ry, x0 - 0.3, y1 + 0.38, { cor: 'suave', tam: 10.5, alin: 'esq' });
    return { X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1, ya: ya, yb: yb };
  }
  function curva(g, a, f, xa, xb, o, n) {
    var pts = [], i, m = n || 240, fecha = function () { if (pts.length > 1) g.caminho(pts, o); pts = []; };
    for (i = 0; i <= m; i++) { var v = xa + (xb - xa) * i / m, y = f(v); if (!isFinite(y) || y < a.ya || y > a.yb) fecha(); else pts.push([a.X(v), a.Y(y)]); }
    fecha();
  }
  function area(g, a, f, xa, xb, o) {
    var pts = [[a.X(xa), a.Y(0)]], i;
    for (i = 0; i <= 120; i++) { var v = xa + (xb - xa) * i / 120, y = Math.min(a.yb, f(v)); pts.push([a.X(v), a.Y(y)]); }
    pts.push([a.X(xb), a.Y(0)]);
    g.caminho(pts, { cor: null, preenche: o, alfa: 0.3, fechar: true });
  }

  /* 1.1 */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Com a cauda alongada para a direita, a média é arrastada mais que a mediana, e a moda fica no pico. Em uma distribuição simétrica, as três coincidem.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'k', rot: 'Forma (maior = mais simétrica)', min: 1.2, max: 20, val: 2, passo: 0.1 }],
    desenhar: function (g, p) {
      var k = p.k, th = 1, f = function (x) { return x <= 0 ? 0 : Math.exp((k - 1) * Math.log(x) - x / th - PE.lnGama(k) - k * Math.log(th)); };
      var moda = (k - 1) * th, media = k * th, med = PE.inv(function (x) { return PE.gamaP(k, x / th); }, 0.5, 0, 200);
      var xb = k + 4 * Math.sqrt(k) + 1, pico = f(moda) * 1.25, a = eixos(g, 0, xb, 0, pico, 'x', 'f(x)', Math.max(1, Math.round(xb / 6)), pico / 4);
      area(g, a, f, 0, xb, 's1'); curva(g, a, f, 0.001, xb, { cor: 's1', larg: 2.4 });
      [[moda, 'ok'], [med, 'aviso'], [media, 'erro']].forEach(function (m) { g.linha(a.X(m[0]), a.y0, a.X(m[0]), a.y1, { cor: m[1], larg: 2 }); });
      painel(g, 'Medidas de posição', [['moda', fx(moda, 2), 'ok'], ['mediana', fx(med, 2), 'aviso'], ['média', fx(media, 2), 'erro'], ['média − mediana', fx(media - med, 3)]],
        [{ t: 'verde: moda; laranja: mediana; vermelho: média' }]);
    }
  });

  /* 2.1 */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A soma P(A) + P(B) conta a interseção duas vezes, e por isso ela é subtraída uma vez na regra da união.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'a', rot: 'P(A)', min: 0.1, max: 0.6, val: 0.3, passo: 0.01 },
      { id: 'b', rot: 'P(B)', min: 0.1, max: 0.5, val: 0.2, passo: 0.01 },
      { id: 'c', rot: 'Sobreposição (fração de B)', min: 0, max: 1, val: 0.5, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var i = Math.min(p.a, p.b) * p.c, un = p.a + p.b - i;
      g.ret(0.7, 0.7, 7.6, 6.2, { cor: 'forte', larg: 1.4 });
      g.txt('Ω', 1.1, 6.5, { cor: 'suave', tam: 12 });
      var ra = 3.3 * Math.sqrt(p.a), rb = 3.3 * Math.sqrt(p.b), d = (ra + rb) * (1 - p.c) + Math.abs(ra - rb) * p.c, xa = 4.5 - d / 2 * rb / (ra + rb) - 0.1;
      var xb = xa + d;
      g.circ(xa, 3.7, ra, { cor: 's1', larg: 2, preenche: 's1', alfa: 0.28 });
      g.circ(xb, 3.7, rb, { cor: 'erro', larg: 2, preenche: 'erro', alfa: 0.28 });
      g.txt('A', xa - ra * 0.45, 3.7, { cor: 's1', tam: 14, negrito: true });
      g.txt('B', xb + rb * 0.45, 3.7, { cor: 'erro', tam: 14, negrito: true });
      var ind = Math.abs(i - p.a * p.b) < 0.004;
      painel(g, 'Probabilidades', [['P(A)', fx(p.a, 2), 's1'], ['P(B)', fx(p.b, 2), 'erro'], ['P(A ∩ B)', fx(i, 3)], ['P(A ∪ B)', fx(un, 3), 'ok'], ['P(A)·P(B)', fx(p.a * p.b, 3)], ['independentes?', ind ? 'sim' : 'não', ind ? 'ok' : 'aviso']],
        [{ t: 'disjuntos (sobreposição zero) nunca são independentes' }]);
    }
  });

  /* 3.1 */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Cada área representa uma fração das peças. A probabilidade posterior é a fração verdadeira dentro de todos os resultados positivos, em que entram também os falsos alarmes.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'p', rot: 'Peças com defeito', min: 0.5, max: 30, val: 5, passo: 0.5, un: '%' },
      { id: 's', rot: 'Sensibilidade', min: 50, max: 100, val: 95, passo: 1, un: '%' },
      { id: 'f', rot: 'Falso alarme', min: 0, max: 40, val: 10, passo: 1, un: '%' }
    ],
    desenhar: function (g, p) {
      var x0 = 0.8, y0 = 0.8, W = 7.5, H = 5.9, pr = p.p / 100, se = p.s / 100, fa = p.f / 100, wd = Math.max(W * pr, 0.04);
      g.ret(x0, y0, wd, H * se, { cor: null, preenche: 'erro', alfa: 0.7 });
      g.ret(x0, y0 + H * se, wd, H * (1 - se), { cor: null, preenche: 'erro', alfa: 0.18 });
      g.ret(x0 + wd, y0, W - wd, H * fa, { cor: null, preenche: 'aviso', alfa: 0.6 });
      g.ret(x0 + wd, y0 + H * fa, W - wd, H * (1 - fa), { cor: null, preenche: 'ok', alfa: 0.14 });
      g.ret(x0, y0, W, H, { cor: 'forte', larg: 1.4 });
      g.txt('peças boas', x0 + wd + (W - wd) / 2, y0 + H + 0.3, { cor: 'suave', tam: 10.5 });
      var Pp = pr * se + (1 - pr) * fa, post = pr * se / Pp;
      painel(g, 'Peça reprovada', [['P(+)', fx(Pp, 4)], ['verdadeiros positivos', fx(pr * se, 4), 'erro'], ['falsos alarmes', fx((1 - pr) * fa, 4), 'aviso'], ['P(defeito | +)', fx(post, 4), 'ok']],
        [{ t: 'vermelho: defeito detectado; laranja: peça boa reprovada' }, { t: 'à esquerda ficam as peças defeituosas' }]);
    }
  });

  /* 4.1 */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'A função acumulada é a área sob a densidade até x. A densidade mostra onde os valores se concentram, e a acumulada responde diretamente perguntas de probabilidade.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'x', rot: 'Valor x', min: 0, max: 6, val: 1.5, passo: 0.05 },
      { id: 'l', rot: 'Taxa λ', min: 0.3, max: 2, val: 0.8, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 6, 0, 2.1, 'x', 'f(x), F(x)', 1, 0.5), l = p.l, f = function (x) { return l * Math.exp(-l * x); }, Fx = function (x) { return 1 - Math.exp(-l * x); };
      area(g, a, f, 0, p.x, 's1');
      curva(g, a, f, 0, 6, { cor: 's1', larg: 2.4 }); curva(g, a, Fx, 0, 6, { cor: 'erro', larg: 2.2 });
      g.linha(a.X(p.x), a.y0, a.X(p.x), a.Y(Fx(p.x)), { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.circ(a.X(p.x), a.Y(Fx(p.x)), 0.12, { preenche: 'erro', cor: null });
      painel(g, 'Exponencial', [['F(x) = área azul', fx(Fx(p.x), 4), 'erro'], ['f(x)', fx(f(p.x), 4), 's1'], ['média 1/λ', fx(1 / l, 3)], ['P(X > x)', fx(1 - Fx(p.x), 4)]], [{ t: 'azul: densidade; vermelho: acumulada' }]);
    }
  });

  /* 5.1 */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Barras: binomial. Pontos: Poisson de mesma média. Com n grande e p pequeno, as duas praticamente coincidem; aumentando p, elas se afastam.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'n', rot: 'n', min: 5, max: 200, val: 50, passo: 1 },
      { id: 'p', rot: 'p', min: 0.01, max: 0.5, val: 0.04, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var n = Math.round(p.n), l = n * p.p, K = Math.max(8, Math.ceil(l + 4 * Math.sqrt(l) + 2)), i, ymax = 0;
      for (i = 0; i <= K; i++) ymax = Math.max(ymax, PE.binom(i, n, p.p));
      ymax *= 1.2;
      var a = eixos(g, -0.5, K + 0.5, 0, ymax, 'k', 'P(X = k)', Math.max(1, Math.ceil(K / 8)), ymax / 4), maxd = 0;
      for (i = 0; i <= K; i++) {
        var b = PE.binom(i, n, p.p), q = i === 0 ? Math.exp(-l) : PE.poisson(i, l);
        maxd = Math.max(maxd, Math.abs(b - q));
        g.ret(a.X(i - 0.35), a.Y(0), a.X(i + 0.35) - a.X(i - 0.35), Math.max(0.001, a.Y(b) - a.Y(0)), { cor: 's1', larg: 1, preenche: 's1', alfa: 0.35 });
        if (q <= ymax) g.circ(a.X(i), a.Y(q), 0.1, { preenche: 'erro', cor: null });
      }
      painel(g, 'Binomial × Poisson', [['λ = np', fx(l, 2)], ['P(0) binomial', fx(PE.binom(0, n, p.p), 4), 's1'], ['P(0) Poisson', fx(Math.exp(-l), 4), 'erro'], ['maior diferença', fx(maxd, 4), maxd < 0.01 ? 'ok' : 'aviso']], [{ t: 'barras azuis: binomial; pontos vermelhos: Poisson' }]);
    }
  });

  /* 6.1 */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'O parâmetro de forma da Weibull revela o mecanismo de falha: abaixo de 1, a taxa decresce; igual a 1, é constante; acima de 1, cresce, indicando desgaste.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'b', rot: 'Forma β', min: 0.5, max: 4, val: 2, passo: 0.05 }],
    desenhar: function (g, p) {
      var b = p.b, a = eixos(g, 0, 3, 0, 3, 't/η', 'R(t) e h(t)·η', 0.5, 0.5);
      curva(g, a, function (t) { return Math.exp(-Math.pow(t, b)); }, 0, 3, { cor: 's1', larg: 2.4 });
      curva(g, a, function (t) { return t === 0 ? (b > 1 ? 0 : b === 1 ? 1 : NaN) : b * Math.pow(t, b - 1); }, 0.001, 3, { cor: 'erro', larg: 2.2 });
      var tx = b < 0.97 ? 'decrescente' : b > 1.03 ? 'crescente' : 'constante';
      painel(g, 'β = ' + fx(b, 2), [['taxa de falha', tx, b < 0.97 ? 'aviso' : b > 1.03 ? 'erro' : 'ok'], ['R(η)', fx(Math.exp(-1), 4)], ['R(0,5η)', fx(Math.exp(-Math.pow(0.5, b)), 4), 's1']], [{ t: 'azul: confiabilidade; vermelho: taxa de falha' }, { t: 'R(η) = 36,8 % para qualquer β' }]);
    }
  });

  /* 7.1 */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'O coeficiente de correlação mede o quanto os pontos se alinham em uma reta. Com ρ igual a zero não há tendência linear; perto de ±1, os pontos quase formam uma reta.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'r', rot: 'Correlação ρ', min: -1, max: 1, val: 0.7, passo: 0.01 }],
    desenhar: function (g, p) {
      var a = eixos(g, -3, 3, -3, 3, 'x', 'y', 1, 1), r = PE.rng(42), i, sxy = 0, sxx = 0, syy = 0, N = 120, q = Math.sqrt(1 - p.r * p.r);
      for (i = 0; i < N; i++) {
        var x = PE.gauss(r), z = PE.gauss(r), y = p.r * x + q * z;
        sxy += x * y; sxx += x * x; syy += y * y;
        if (Math.abs(x) < 3 && Math.abs(y) < 3) g.circ(a.X(x), a.Y(y), 0.07, { preenche: 's1', cor: null, alfa: 0.75 });
      }
      painel(g, 'Correlação', [['ρ escolhido', fx(p.r, 2), 's1'], ['r da amostra', fx(sxy / Math.sqrt(sxx * syy), 3)], ['r²', fx(p.r * p.r, 3)]], [{ t: 'cento e vinte pontos sorteados de uma normal bivariada' }]);
    }
  });

  /* 8.1 */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'A distribuição t tem caudas mais pesadas que a normal, porque o desvio-padrão também foi estimado. Com mais graus de liberdade, ela se aproxima da normal.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'v', rot: 'Graus de liberdade', min: 1, max: 60, val: 4, passo: 1 }],
    desenhar: function (g, p) {
      var v = Math.round(p.v), a = eixos(g, -5, 5, 0, 0.5, 't', 'densidade', 1, 0.1);
      var c = Math.exp(PE.lnGama((v + 1) / 2) - PE.lnGama(v / 2)) / Math.sqrt(v * Math.PI), f = function (t) { return c * Math.pow(1 + t * t / v, -(v + 1) / 2); };
      curva(g, a, PE.phi, -5, 5, { cor: 's1', larg: 2.2 }); curva(g, a, f, -5, 5, { cor: 'erro', larg: 2.4 });
      var t = PE.tq(0.975, v);
      painel(g, 'gl = ' + v, [['t crítico (95 %)', fx(t, 3), 'erro'], ['z crítico (95 %)', '1,960', 's1'], ['intervalo maior em', fx(100 * (t / 1.95996 - 1), 1) + ' %']], [{ t: 'azul: normal padrão; vermelho: t' }]);
    }
  });

  /* 9.1 */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'A semilargura do intervalo cai com a raiz do tamanho da amostra: as primeiras observações rendem muito, e as seguintes, cada vez menos.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 's', rot: 'Desvio-padrão σ', min: 1, max: 20, val: 10, passo: 0.5 },
      { id: 'c', rot: 'Confiança', min: 80, max: 99.5, val: 95, passo: 0.5, un: '%' },
      { id: 'n', rot: 'Tamanho n', min: 2, max: 200, val: 40, passo: 1 }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, 0, 200, 0, 30, 'n', 'semilargura', 50, 5), z = PE.zq(1 - (1 - p.c / 100) / 2);
      curva(g, a, function (n) { return n < 1 ? NaN : z * p.s / Math.sqrt(n); }, 1, 200, { cor: 's1', larg: 2.6 });
      var e = z * p.s / Math.sqrt(p.n);
      if (e <= 30) g.circ(a.X(p.n), a.Y(e), 0.13, { preenche: 'erro', cor: null });
      painel(g, 'Intervalo', [['z', fx(z, 3)], ['semilargura', fx(e, 3), 'erro'], ['para a metade: n =', fx(4 * p.n, 0)]], [{ t: 'cortar o erro pela metade exige quatro vezes mais dados' }]);
    }
  });

  /* 10.1 */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'A região crítica é definida sob a hipótese nula. α é a cauda da curva da nula além do limite; β é a parte da curva verdadeira que cai na região de aceitação.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'd', rot: 'Desvio real (em erros-padrão)', min: 0, max: 5, val: 2.5, passo: 0.05 },
      { id: 'al', rot: 'α (unilateral)', min: 0.5, max: 20, val: 5, passo: 0.5, un: '%' }
    ],
    desenhar: function (g, p) {
      var a = eixos(g, -3.5, 8.5, 0, 0.5, 'estatística z', 'densidade', 2, 0.1), al = p.al / 100, c = PE.zq(1 - al), d = p.d;
      var f0 = PE.phi, f1 = function (x) { return PE.phi(x - d); };
      area(g, a, f0, c, 8.5, 'erro'); area(g, a, f1, -3.5, c, 'aviso');
      curva(g, a, f0, -3.5, 8.5, { cor: 's1', larg: 2.4 }); curva(g, a, f1, -3.5, 8.5, { cor: 'ok', larg: 2.4 });
      g.linha(a.X(c), a.y0, a.X(c), a.y1, { cor: 'texto', larg: 1.6, tracejado: [5, 4] });
      var b = PE.Phi(c - d);
      painel(g, 'Erros do teste', [['valor crítico', fx(c, 3)], ['α (vermelho)', fx(al, 3), 'erro'], ['β (laranja)', fx(b, 4), 'aviso'], ['poder 1 − β', fx(1 - b, 4), 'ok']], [{ t: 'azul: distribuição sob H₀; verde: distribuição real' }, { t: 'diminuir α aumenta β' }]);
    }
  });

  /* 11.1 */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Mova um único ponto para longe dos demais e veja a reta e o coeficiente de correlação mudarem. Antes de confiar em r, olhe o gráfico.',
    vista: VISTA, altura: ALTURA,
    controles: [{ id: 'y', rot: 'Altura do último ponto', min: 0, max: 40, val: 12, passo: 0.5 }],
    desenhar: function (g, p) {
      var X = [1, 2, 3, 4, 5, 6, 7, 8, 12], Y = [2.2, 4.1, 6.2, 7.9, 10.1, 11.8, 14.3, 15.9, p.y], n = 9, a = eixos(g, 0, 13, 0, 40, 'x', 'y', 2, 10);
      var mx = 0, my = 0, i; for (i = 0; i < n; i++) { mx += X[i] / n; my += Y[i] / n; }
      var Sx = 0, Sy = 0, Sxy = 0; for (i = 0; i < n; i++) { Sx += (X[i] - mx) * (X[i] - mx); Sy += (Y[i] - my) * (Y[i] - my); Sxy += (X[i] - mx) * (Y[i] - my); }
      var b = Sxy / Sx, a0 = my - b * mx;
      curva(g, a, function (x) { return a0 + b * x; }, 0, 13, { cor: 's1', larg: 2.4 });
      X.forEach(function (x, j) { g.circ(a.X(x), a.Y(Y[j]), j === 8 ? 0.15 : 0.1, { preenche: j === 8 ? 'erro' : 'ok', cor: null }); });
      painel(g, 'Ajuste', [['inclinação b₁', fx(b, 3), 's1'], ['intercepto b₀', fx(a0, 3)], ['r', fx(Sxy / Math.sqrt(Sx * Sy), 4)], ['r²', fx(Sxy * Sxy / (Sx * Sy), 4)]], [{ t: 'em vermelho, o ponto que pode ser movido' }]);
    }
  });

  /* 12.1 */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Em série, basta um componente falhar para o sistema parar, e a confiabilidade cai a cada elemento acrescentado. Em paralelo, o sistema só para se todos falharem.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'n', rot: 'Número de componentes', min: 1, max: 6, val: 3, passo: 1 },
      { id: 'r', rot: 'Confiabilidade de cada um', min: 0.5, max: 0.999, val: 0.9, passo: 0.001 }
    ],
    desenhar: function (g, p) {
      var n = Math.round(p.n), i, r = p.r, Rs = Math.pow(r, n), Rp = 1 - Math.pow(1 - r, n);
      g.txt('série', 0.9, 6.6, { cor: 's1', tam: 11, alin: 'esq', negrito: true });
      var w = 7.0 / n, y1 = 5.3;
      g.linha(0.7, y1, 8.3, y1, { cor: 'forte', larg: 1.4 });
      for (i = 0; i < n; i++) { var x = 0.9 + i * w + w * 0.15; g.ret(x, y1 - 0.4, w * 0.7, 0.8, { cor: 's1', larg: 1.4, preenche: 's1', alfa: 0.3 }); }
      g.txt('paralelo', 0.9, 3.4, { cor: 'erro', tam: 11, alin: 'esq', negrito: true });
      var yb = 0.75, hh = 2.3, dy = n > 1 ? hh / (n - 1) : 0, yc = yb + hh / 2;
      g.linha(0.7, yc, 2.5, yc, { cor: 'forte', larg: 1.4 }); g.linha(6.5, yc, 8.3, yc, { cor: 'forte', larg: 1.4 });
      if (n > 1) { g.linha(2.5, yb, 2.5, yb + hh, { cor: 'forte', larg: 1.4 }); g.linha(6.5, yb, 6.5, yb + hh, { cor: 'forte', larg: 1.4 }); }
      for (i = 0; i < n; i++) { var yy = n > 1 ? yb + i * dy : yc; g.linha(2.5, yy, 3.3, yy, { cor: 'forte', larg: 1.2 }); g.linha(5.7, yy, 6.5, yy, { cor: 'forte', larg: 1.2 }); g.ret(3.3, yy - Math.min(0.17, 0.17), 2.4, 0.34, { cor: 'erro', larg: 1.4, preenche: 'erro', alfa: 0.3 }); }
      painel(g, 'Sistema com ' + n, [['R de cada', fx(r, 3)], ['R em série', fx(Rs, 4), 's1'], ['R em paralelo', fx(Rp, 6), 'erro']], [{ t: 'em série multiplicam-se as confiabilidades; em paralelo, as probabilidades de falha' }]);
    }
  });

  /* 13.1 */
  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'Cp compara a largura da especificação com a largura natural do processo. Cpk também considera onde o processo está centrado: é a distância até o limite mais próximo.',
    vista: VISTA, altura: ALTURA,
    controles: [
      { id: 'm', rot: 'Média do processo', min: 47, max: 53, val: 50.5, passo: 0.05 },
      { id: 's', rot: 'Desvio-padrão', min: 0.2, max: 1.5, val: 0.516, passo: 0.002 }
    ],
    desenhar: function (g, p) {
      var LIE = 48, LSE = 52, ym = 0.8 / p.s * 0.5 + 0.2, a = eixos(g, 46, 54, 0, Math.max(2.2, PE.phi(0) / p.s * 1.2), 'x', 'densidade', 1, 0.5), f = function (x) { return PE.phi((x - p.m) / p.s) / p.s; };
      area(g, a, f, 46, LIE, 'erro'); area(g, a, f, LSE, 54, 'erro');
      curva(g, a, f, 46, 54, { cor: 's1', larg: 2.4 }, 400);
      [LIE, LSE].forEach(function (L) { g.linha(a.X(L), a.y0, a.X(L), a.y1, { cor: 'erro', larg: 2, tracejado: [5, 4] }); });
      g.txt('LIE', a.X(LIE), a.y1 + 0.25, { cor: 'erro', tam: 10.5, negrito: true }); g.txt('LSE', a.X(LSE), a.y1 + 0.25, { cor: 'erro', tam: 10.5, negrito: true });
      var Cp = (LSE - LIE) / (6 * p.s), Cpk = Math.min(LSE - p.m, p.m - LIE) / (3 * p.s), ppm = (1 - PE.Phi((LSE - p.m) / p.s) + PE.Phi((LIE - p.m) / p.s)) * 1e6;
      painel(g, 'Capacidade', [['Cp', fx(Cp, 2), Cp >= 1.33 ? 'ok' : 'aviso'], ['Cpk', fx(Cpk, 2), Cpk >= 1.33 ? 'ok' : 'aviso'], ['fora da especif.', ppm < 1 ? '< 1 ppm' : fx(ppm, 0) + ' ppm']], [{ t: 'o alvo usual é pelo menos 1,33' }]);
    }
  });
})();

/* ============================================================
   Figuras ilustrativas de Elementos de Máquina I
   von Mises × Tresca, curva S-N, fatores de Marin, Goodman,
   junta pré-carregada, solda, mola e eixo — todos calculados.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var expo = function (v) {
    if (v <= 0) return '0';
    var e = Math.floor(Math.log10(v));
    var m = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return fx(v / Math.pow(10, e), 1) + ' × 10' + String(e).split('').map(function (c) { return m[c] || c; }).join('');
  };

  /* 1.1 — von Mises × Tresca */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Os dois critérios no plano das tensões principais: Tresca é o hexágono inscrito, sempre mais conservador que a elipse de von Mises (exemplo 1.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'sig', rot: 'Tensão normal σ', min: -300, max: 300, val: 120, passo: 10, un: 'MPa' },
      { id: 'tau', rot: 'Cisalhamento τ', min: 0, max: 200, val: 50, passo: 5, un: 'MPa' },
      { id: 'Sy', rot: 'Escoamento do material', min: 200, max: 700, val: 350, passo: 10, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var sg = p.sig, tau = p.tau, Sy = p.Sy;
      var s1 = sg / 2 + Math.sqrt(sg * sg / 4 + tau * tau);
      var s2 = sg / 2 - Math.sqrt(sg * sg / 4 + tau * tau);
      var vm = Math.sqrt(sg * sg + 3 * tau * tau);
      var tr = Math.sqrt(sg * sg + 4 * tau * tau);
      var cx = 3.6, cy = 2.6, esc = 2.2 / Sy;
      var X = function (v) { return cx + v * esc; }, Y = function (v) { return cy + v * esc; };
      g.linha(X(-Sy * 1.4), cy, X(Sy * 1.4), cy, { cor: 'fraco', larg: 1.1 });
      g.linha(cx, Y(-Sy * 1.4), cx, Y(Sy * 1.4), { cor: 'fraco', larg: 1.1 });
      g.txt('σ₁', X(Sy * 1.35), cy - 0.35, { cor: 'fraco', tam: 11 });
      g.txt('σ₂', cx - 0.4, Y(Sy * 1.3), { cor: 'fraco', tam: 11 });
      /* elipse de von Mises: σ1² − σ1σ2 + σ2² = Sy² */
      var pts = [], i;
      for (i = 0; i <= 90; i++) {
        var th = 2 * Math.PI * i / 90;
        var a = Math.cos(th), b = Math.sin(th);
        var r = Sy / Math.sqrt(a * a - a * b + b * b);
        pts.push([X(r * a), Y(r * b)]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.2, fechar: true });
      /* hexágono de Tresca */
      var hex = [[Sy, 0], [Sy, Sy], [0, Sy], [-Sy, 0], [-Sy, -Sy], [0, -Sy]].map(function (q) { return [X(q[0]), Y(q[1])]; });
      g.caminho(hex, { cor: 's2', larg: 2, fechar: true, tracejado: [6, 4] });
      g.circ(X(s1), Y(s2), 0.16, { preenche: vm > Sy ? 'erro' : 'ok', cor: null });
      var x0 = 7.6;
      g.txt('σ₁ = ' + fx(s1, 1) + ' · σ₂ = ' + fx(s2, 1) + ' MPa', x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('von Mises ' + fx(vm, 1) + ' MPa', x0, 4.1, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('n = ' + fx(Sy / vm, 2), x0, 3.5, { cor: 's1', tam: 12, alin: 'esq' });
      g.txt('Tresca ' + fx(tr, 1) + ' MPa', x0, 2.6, { cor: 's2', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('n = ' + fx(Sy / tr, 2), x0, 2.0, { cor: 's2', tam: 12, alin: 'esq' });
      g.txt(vm > Sy ? 'fora da elipse: escoa' : 'dentro: não escoa', x0, 1.1,
        { cor: vm > Sy ? 'erro' : 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('Tresca inscrito em von Mises: a diferença máxima é de 15 %', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.1 — curva S-N */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Diagrama S-N em escala log-log: reta de vida finita entre 10³ e 10⁶ ciclos e, nos aços, o patamar do limite de fadiga (exemplo 2.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'Sut', rot: 'Resistência à tração', min: 400, max: 1200, val: 700, passo: 20, un: 'MPa' },
      { id: 'S', rot: 'Tensão alternada de trabalho', min: 150, max: 800, val: 450, passo: 10, un: 'MPa' },
      { id: 'ferroso', rot: 'Material (1 aço · 0 alumínio)', min: 0, max: 1, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var Sut = p.Sut, S = p.S, aco = p.ferroso === 1;
      var Se = aco ? 0.5 * Sut : 0.4 * Sut;
      var a = Math.pow(0.9 * Sut, 2) / Se, b = -Math.log10(0.9 * Sut / Se) / 3;
      var N = Math.pow(S / a, 1 / b);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (n) { return gx + gw * (Math.log10(n)) / 9; };
      var Y = function (s) { return gy + gh * (Math.log10(s) - 2) / 1.2; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [[X(1e3), Y(0.9 * Sut)], [X(1e6), Y(Se)]];
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      if (aco) g.caminho([[X(1e6), Y(Se)], [X(1e9), Y(Se)]], { cor: 's1', larg: 2.6 });
      else {
        var p2 = [];
        for (var i = 0; i <= 20; i++) {
          var n = Math.pow(10, 6 + 3 * i / 20);
          p2.push([X(n), Y(a * Math.pow(n, b))]);
        }
        g.caminho(p2, { cor: 's1', larg: 2.6, tracejado: [6, 4] });
      }
      g.caminho([[X(1), Y(0.9 * Sut)], [X(1e3), Y(0.9 * Sut)]], { cor: 'borda', larg: 1.6, tracejado: [5, 4] });
      if (N > 1 && N < 1e9) {
        g.circ(X(N), Y(S), 0.15, { preenche: 'erro', cor: null });
        g.linha(X(N), gy, X(N), Y(S), { cor: 'erro', larg: 1, tracejado: [4, 3] });
      }
      g.linha(gx, Y(S), gx + gw, Y(S), { cor: 'erro', larg: 1.2, tracejado: [5, 4] });
      [3, 5, 7, 9].forEach(function (e) {
        g.linha(X(Math.pow(10, e)), gy, X(Math.pow(10, e)), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt('10' + ['', '', '', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'][e], X(Math.pow(10, e)), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [200, 400, 800].forEach(function (s) {
        g.linha(gx, Y(s), gx - 0.15, Y(s), { cor: 'fraco', larg: 1 });
        g.txt(s + '', gx - 0.28, Y(s), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('ciclos', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('S (MPa)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.2;
      g.txt('Se′ = ' + fx(Se, 0) + ' MPa', x0, 5.0, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('a = ' + fx(a, 0) + ' · b = ' + fx(b, 4), x0, 4.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      if (aco && S <= Se) {
        g.txt('vida infinita', x0, 3.2, { cor: 'ok', tam: 15, alin: 'esq', negrito: true });
        g.txt('a tensão está no patamar', x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      } else {
        g.txt('vida ≈ ' + expo(N) + ' ciclos', x0, 3.2, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
        g.txt(N < 1e3 ? 'região de baixo ciclo: verifique escoamento' : 'vida finita', x0, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      }
      g.txt(aco ? 'aços têm limite de fadiga; ligas de alumínio, não' : 'alumínio: sem patamar — especifica-se a vida',
        6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 3.1 — fatores de Marin */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Cada fator de Marin corta um pedaço do limite de fadiga do corpo de prova. Acabamento e tamanho costumam ser os mais severos (exemplo 3.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'Sut', rot: 'Resistência à tração', min: 400, max: 1200, val: 700, passo: 20, un: 'MPa' },
      { id: 'sup', rot: 'Superfície (1 retificada · 2 usinada · 3 laminada · 4 forjada)', min: 1, max: 4, val: 2, passo: 1 },
      { id: 'd', rot: 'Diâmetro', min: 8, max: 150, val: 30, passo: 2, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var Sut = p.Sut, d = p.d;
      var sup = { 1: { a: 1.58, b: -0.085, n: 'retificada' }, 2: { a: 4.51, b: -0.265, n: 'usinada' },
                  3: { a: 57.7, b: -0.718, n: 'laminada a quente' }, 4: { a: 272, b: -0.995, n: 'forjada' } }[p.sup];
      var ka = Math.min(1, sup.a * Math.pow(Sut, sup.b));
      var kb = d <= 51 ? 1.24 * Math.pow(d, -0.107) : 1.51 * Math.pow(d, -0.157);
      var kc = 1, kd = 1, ke = 0.897;          /* flexão, ambiente, 90 % de confiabilidade */
      var Sel = 0.5 * Sut;
      var Se = Sel * ka * kb * kc * kd * ke;
      var fat = [['Se′ = 0,5·Sut', 1, 's1'], ['k_a ' + sup.n, ka, 's2'], ['k_b tamanho', kb, 's3'],
                 ['k_c flexão', kc, 's4'], ['k_e 90 % confiab.', ke, 's6']];
      var x0 = 1.2, esc = 6.4;
      fat.forEach(function (f, i) {
        var y = 4.6 - i * 0.95;
        g.txt(f[0], x0, y + 0.55, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.ret(x0, y - 0.1, esc * f[1], 0.5, { preenche: f[2], cor: null, alfa: 0.8 });
        g.ret(x0, y - 0.1, esc, 0.5, { cor: 'borda', larg: 1 });
        g.txt(fx(f[1], 3), x0 + esc + 0.25, y + 0.15, { cor: f[2], tam: 11.5, alin: 'esq', negrito: true });
      });
      g.txt('Se′ = ' + fx(Sel, 0) + ' MPa  →  Se = ' + fx(Se, 0) + ' MPa', x0, -0.5,
        { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('restam ' + fx(100 * Se / Sel, 0) + ' % do limite do corpo de prova', x0, -1.2, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('o acabamento é quase sempre o fator mais caro: polir sai mais barato que aumentar a seção', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 4.1 — Goodman */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Diagrama de fadiga com tensão média: Goodman (reta), Gerber (parábola) e Soderberg (até Sy). O ponto de trabalho mostra qual critério aprova a peça (exemplo 4.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'sa', rot: 'Tensão alternada', min: 10, max: 300, val: 80, passo: 5, un: 'MPa' },
      { id: 'sm', rot: 'Tensão média', min: 0, max: 600, val: 120, passo: 10, un: 'MPa' },
      { id: 'Se', rot: 'Limite de fadiga corrigido', min: 100, max: 400, val: 250, passo: 10, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var sa = p.sa, sm = p.sm, Se = p.Se, Sut = 700, Sy = 450;
      var nGood = 1 / (sa / Se + sm / Sut);
      var nGerb = (1 / 2) * Math.pow(Sut / sm, 2) * (sa / Se) * (-1 + Math.sqrt(1 + Math.pow(2 * sm * Se / (Sut * sa), 2)));
      var nSod = 1 / (sa / Se + sm / Sy);
      var nEsc = Sy / (sa + sm);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var X = function (v) { return gx + gw * v / 800; }, Y = function (v) { return gy + gh * v / 400; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.caminho([[X(0), Y(Se)], [X(Sut), Y(0)]], { cor: 's1', larg: 2.4 });
      g.caminho([[X(0), Y(Se)], [X(Sy), Y(0)]], { cor: 's4', larg: 1.8, tracejado: [6, 4] });
      var ger = [], i;
      for (i = 0; i <= 40; i++) {
        var smv = Sut * i / 40;
        ger.push([X(smv), Y(Se * (1 - Math.pow(smv / Sut, 2)))]);
      }
      g.caminho(ger, { cor: 's3', larg: 1.8, tracejado: [3, 3] });
      g.caminho([[X(0), Y(Sy)], [X(Sy), Y(0)]], { cor: 'borda', larg: 1.4 });
      g.circ(X(sm), Y(sa), 0.16, { preenche: nGood >= 1 ? 'ok' : 'erro', cor: null });
      [200, 400, 600, 800].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      [100, 200, 300, 400].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.15, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.28, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('σ média (MPa)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('σ alternada', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('Goodman', X(430), Y(Se * (1 - 430 / Sut)) + 0.35, { cor: 's1', tam: 10.5 });
      g.txt('Gerber', X(300), Y(Se * (1 - Math.pow(300 / Sut, 2))) + 0.4, { cor: 's3', tam: 10.5 });
      var x0 = 8.2;
      g.txt('Goodman n = ' + fx(nGood, 2), x0, 5.0, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('Gerber n = ' + fx(nGerb, 2), x0, 4.2, { cor: 's3', tam: 12.5, alin: 'esq' });
      g.txt('Soderberg n = ' + fx(nSod, 2), x0, 3.5, { cor: 's4', tam: 12.5, alin: 'esq' });
      g.txt('escoamento n = ' + fx(nEsc, 2), x0, 2.8, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(nGood >= 1.5 ? 'aprovado com folga' : nGood >= 1 ? 'aprovado, margem pequena' : 'reprovado por Goodman',
        x0, 1.9, { cor: nGood >= 1.5 ? 'ok' : nGood >= 1 ? 'aviso' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('Sut = 700 MPa e Sy = 450 MPa neste exemplo', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 5.1 — junta pré-carregada */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Numa junta pré-carregada, só a fração C da carga externa chega ao parafuso. O resto apenas alivia a compressão das peças — até a separação.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'C', rot: 'Constante da junta C = kb/(kb+km)', min: 0.05, max: 0.6, val: 0.25, passo: 0.05 },
      { id: 'Fi', rot: 'Pré-carga', min: 5, max: 60, val: 30, passo: 1, un: 'kN' },
      { id: 'P', rot: 'Carga externa', min: 0, max: 80, val: 20, passo: 2, un: 'kN' }
    ],
    desenhar: function (g, p) {
      var C = p.C, Fi = p.Fi, P = p.P;
      var Fb = Fi + C * P, Fm = Fi - (1 - C) * P;
      var Psep = Fi / (1 - C);
      var separou = Fm <= 0;
      var gx = 1.3, gy = 1.0, gw = 6.0, gh = 4.2;
      var X = function (v) { return gx + gw * v / 90; }, Y = function (v) { return gy + gh * v / 90; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      /* força no parafuso e na junta em função da carga externa */
      var pb = [], pm = [], i;
      for (i = 0; i <= 60; i++) {
        var Pv = 90 * i / 60;
        pb.push([X(Pv), Y(Pv < Psep ? Fi + C * Pv : Pv)]);
        pm.push([X(Pv), Y(Math.max(0, Fi - (1 - C) * Pv))]);
      }
      g.caminho(pb, { cor: 's1', larg: 2.6 });
      g.caminho(pm, { cor: 's3', larg: 2.6 });
      g.linha(X(Psep), gy, X(Psep), gy + gh, { cor: 'aviso', larg: 1.3, tracejado: [5, 4] });
      g.txt('separação', X(Psep), gy + gh + 0.3, { cor: 'aviso', tam: 11, fundo: true });
      g.circ(X(P), Y(Math.min(Fb, Math.max(Fb, P))), 0.15, { preenche: 'erro', cor: null });
      [30, 60, 90].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.45, { cor: 'fraco', tam: 10 });
        g.linha(gx, Y(v), gx - 0.15, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.28, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('carga externa P (kN)', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('força (kN)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      g.txt('parafuso', X(70), Y(Fi + C * 70) + 0.35, { cor: 's1', tam: 10.5 });
      g.txt('junta', X(20), Y(Math.max(0, Fi - (1 - C) * 20)) - 0.4, { cor: 's3', tam: 10.5 });
      var x0 = 8.0;
      g.txt('F parafuso ' + fx(Fb, 1) + ' kN', x0, 5.0, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('F junta ' + fx(Math.max(0, Fm), 1) + ' kN', x0, 4.2, { cor: 's3', tam: 13, alin: 'esq' });
      g.txt('só ' + fx(100 * C, 0) + ' % da carga externa', x0, 3.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('chega ao parafuso', x0, 2.75, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('separação em P = ' + fx(Psep, 1) + ' kN', x0, 1.9, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt(separou ? 'JUNTA SEPARADA: o parafuso recebe tudo' : 'junta ainda comprimida',
        x0, 1.1, { cor: separou ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('amplitude no parafuso: σa ∝ C·P/2 — por isso C baixo melhora a fadiga', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 6.1 — solda em filete */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'A garganta efetiva do filete vale 0,707 h, e toda a carga é tratada como cisalhamento nela — convenção simples e conservadora (exemplo 6.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'h', rot: 'Perna do filete', min: 3, max: 12, val: 6, passo: 0.5, un: 'mm' },
      { id: 'L', rot: 'Comprimento de cada cordão', min: 40, max: 250, val: 100, passo: 10, un: 'mm' },
      { id: 'F', rot: 'Carga', min: 5, max: 120, val: 20, passo: 5, un: 'kN' }
    ],
    desenhar: function (g, p) {
      var h = p.h, L = p.L, Fv = p.F * 1000;
      var t = 0.707 * h, A = t * 2 * L, tau = Fv / A;
      var adm = 90;                     /* eletrodo E70, cisalhamento admissível aproximado */
      /* desenho do filete */
      var ox = 1.6, oy = 1.4, esc = 0.26;
      g.ret(ox, oy, 4.6, 0.7, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.25 });
      g.ret(ox + 1.6, oy + 0.7, 0.7, 2.6, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.25 });
      var hh = h * esc;
      g.caminho([[ox + 1.6, oy + 0.7], [ox + 1.6 - hh, oy + 0.7], [ox + 1.6, oy + 0.7 + hh]],
        { cor: 's2', larg: 1.8, fechar: true, preenche: 's2', alfa: 0.4 });
      g.caminho([[ox + 2.3, oy + 0.7], [ox + 2.3 + hh, oy + 0.7], [ox + 2.3, oy + 0.7 + hh]],
        { cor: 's2', larg: 1.8, fechar: true, preenche: 's2', alfa: 0.4 });
      g.linha(ox + 1.6 - hh, oy + 0.7, ox + 1.6, oy + 0.7 + hh, { cor: 'erro', larg: 2 });
      g.txt('garganta 0,707h', ox + 0.2, oy + 1.9, { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.cota(ox + 2.3, oy + 0.55, ox + 2.3 + hh, oy + 0.55, 'h', { dy: -0.3 });
      g.seta(ox + 1.95, oy + 3.6, 0, 1.0, { cor: 'erro', larg: 2.4, rot: fx(p.F, 0) + ' kN', rotTam: 11.5, rotDx: 0.9, rotDy: 0 });
      var x0 = 7.2;
      g.txt('garganta t = ' + fx(t, 2) + ' mm', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('área = ' + fx(A, 0) + ' mm² (2 cordões)', x0, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('τ = ' + fx(tau, 1) + ' MPa', x0, 3.4, { cor: tau > adm ? 'erro' : 'ok', tam: 15, alin: 'esq', negrito: true });
      g.ret(x0, 2.3, 4.0 * Math.min(1, tau / (adm * 1.5)), 0.5, { preenche: tau > adm ? 'erro' : 'ok', cor: null, alfa: 0.85 });
      g.linha(x0 + 4.0 * (adm / (adm * 1.5)), 2.15, x0 + 4.0 * (adm / (adm * 1.5)), 2.95, { cor: 'texto', larg: 1.6 });
      g.txt('admissível ' + adm + ' MPa (E70)', x0, 1.85, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(tau > adm ? 'aumente a perna ou o comprimento' : 'dimensão adequada para carga estática',
        x0, 1.1, { cor: tau > adm ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('em fadiga, a classe do detalhe soldado é mais restritiva que o admissível estático', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.1 — mola helicoidal */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Mola helicoidal: a rigidez cai com o cubo do diâmetro médio e cresce com a quarta potência do arame. O fator de Wahl corrige a tensão no lado interno da espira (exemplo 7.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'd', rot: 'Diâmetro do arame', min: 2, max: 10, val: 4, passo: 0.5, un: 'mm' },
      { id: 'D', rot: 'Diâmetro médio', min: 15, max: 60, val: 30, passo: 1, un: 'mm' },
      { id: 'F', rot: 'Força', min: 10, max: 300, val: 50, passo: 10, un: 'N' }
    ],
    desenhar: function (g, p) {
      var d = p.d, D = p.D, Fv = p.F, G = 79300, Na = 10;
      var C = D / d;
      var k = G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * Na);
      var Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
      var tau = Kw * 8 * Fv * D / (Math.PI * Math.pow(d, 3));
      var defl = Fv / k;
      var adm = 700;                    /* arame de mola, torção admissível aproximada */
      /* desenho da mola */
      var cx = 3.0, topo = 4.8, base = 1.0, esc = 0.055;
      var Rm = D * esc, raio = d * esc;
      var pts = [], i;
      for (i = 0; i <= 200; i++) {
        var f = i / 200;
        var ang = f * Na * 2 * Math.PI;
        pts.push([cx + Rm * Math.cos(ang), topo - (topo - base) * f + 0.12 * Math.sin(ang)]);
      }
      g.caminho(pts, { cor: 'acento', larg: Math.max(1.5, raio * 26) });
      g.hachura(cx - Rm - 0.5, base - 0.15, 2 * Rm + 1.0, 0, { cor: 'forte', d: 0.2 });
      g.seta(cx, topo + 1.4, 0, -1.0, { cor: 'erro', larg: 2.4, rot: fx(Fv, 0) + ' N', rotTam: 11.5, rotDx: 0.9, rotDy: 0 });
      g.cota(cx - Rm, base - 0.6, cx + Rm, base - 0.6, 'D = ' + D + ' mm', { dy: -0.3 });
      var x0 = 6.6;
      g.txt('índice C = ' + fx(C, 2), x0, 5.0, { cor: C < 6 || C > 12 ? 'aviso' : 'suave', tam: 12, alin: 'esq' });
      g.txt('k = Gd⁴/(8D³N) = ' + fx(k, 2) + ' N/mm', x0, 4.2, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('deflexão ' + fx(defl, 2) + ' mm', x0, 3.5, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Kw = ' + fx(Kw, 3), x0, 2.8, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('τ = ' + fx(tau, 0) + ' MPa', x0, 2.0, { cor: tau > adm ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.ret(x0, 1.0, 4.4 * Math.min(1, tau / (adm * 1.3)), 0.5, { preenche: tau > adm ? 'erro' : 'ok', cor: null, alfa: 0.85 });
      g.txt('admissível ≈ ' + adm + ' MPa (arame de mola)', x0, 0.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(C < 6 ? 'índice baixo: difícil de enrolar' : C > 12 ? 'índice alto: mola instável' : 'índice na faixa recomendada (6 a 12)',
        6, -2.3, { cor: C < 6 || C > 12 ? 'aviso' : 'fraco', tam: 11 });
    }
  });

  /* 8.1 — eixo por fadiga */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Diâmetro de eixo pelo critério DE-Goodman: a flexão alternada entra dividida pelo limite de fadiga; o torque médio, pela resistência à tração (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'M', rot: 'Momento fletor alternado', min: 50, max: 600, val: 200, passo: 10, un: 'N·m' },
      { id: 'T', rot: 'Torque médio', min: 0, max: 600, val: 150, passo: 10, un: 'N·m' },
      { id: 'Kf', rot: 'Concentração Kf', min: 1, max: 2.5, val: 1, passo: 0.1 }
    ],
    desenhar: function (g, p) {
      var Ma = p.M * 1000, Tm = p.T * 1000, Kf = p.Kf, Se = 200, Sut = 700, n = 2;
      var termoM = 2 * Kf * Ma / Se, termoT = Math.sqrt(3) * Kf * Tm / Sut;
      var d = Math.pow(16 * n / Math.PI * (termoM + termoT), 1 / 3);
      var comerciais = [20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80];
      var dc = comerciais.filter(function (v) { return v >= d; })[0] || 90;
      /* eixo */
      var ox = 1.4, cy = 3.4, esc = 0.055;
      g.ret(ox, cy - d * esc / 2, 5.0, d * esc, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.3 });
      g.circ(ox + 0.6, cy, d * esc / 2 + 0.25, { cor: 'forte', larg: 1.6 });
      g.circ(ox + 4.4, cy, d * esc / 2 + 0.25, { cor: 'forte', larg: 1.6 });
      g.seta(ox + 2.5, cy + d * esc / 2 + 1.5, 0, -1.0, { cor: 'erro', larg: 2.2, rot: 'M', rotTam: 11.5, rotDx: 0.5, rotDy: 0 });
      g.arco(ox + 3.6, cy, d * esc / 2 + 0.6, 0.6, 2.4, { cor: 's2', larg: 2, ponta: true });
      g.txt('T', ox + 3.6, cy + d * esc / 2 + 1.1, { cor: 's2', tam: 12, negrito: true });
      g.cota(ox + 1.3, cy - d * esc / 2, ox + 1.3, cy + d * esc / 2, 'd', { dx: 0.4 });
      var x0 = 7.2;
      g.txt('2·Kf·Ma/Se = ' + fx(termoM, 0), x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('√3·Kf·Tm/Sut = ' + fx(termoT, 0), x0, 4.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('d = ' + fx(d, 1) + ' mm', x0, 3.4, { cor: 'erro', tam: 16, alin: 'esq', negrito: true });
      g.txt('adotar ' + dc + ' mm (comercial)', x0, 2.7, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      var fM = termoM / (termoM + termoT);
      g.ret(x0, 1.6, 4.2 * fM, 0.5, { preenche: 'erro', cor: null, alfa: 0.8 });
      g.ret(x0 + 4.2 * fM, 1.6, 4.2 * (1 - fM), 0.5, { preenche: 's2', cor: null, alfa: 0.8 });
      g.txt('flexão ' + fx(100 * fM, 0) + ' % · torção ' + fx(100 * (1 - fM), 0) + ' %', x0, 1.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('Se = 200 MPa · Sut = 700 MPa · n = 2', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

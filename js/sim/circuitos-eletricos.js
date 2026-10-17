/* ============================================================
   Simuladores de Circuitos Elétricos
   1 · Circuito resistivo: divisores, Kirchhoff e potência
   2 · Nós e malhas no mesmo circuito
   3 · Thévenin, Norton e máxima transferência de potência
   4 · Transitórios: RC, RL e RLC nos três amortecimentos
   5 · Fasores, potências e correção do fator de potência
   Expõe window.CE, a biblioteca usada também pelas figuras.
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim, Plot = global.Plot;
  if (!Sim) return;

  var CE = {};

  /* ---------------------------------------------------------------
     Álgebra: resolve A x = b por eliminação de Gauss com pivotamento.
     É o motor da análise nodal e da análise de malhas.
     --------------------------------------------------------------- */
  CE.resolver = function (A, b) {
    var n = b.length, i, j, k, M = [];
    for (i = 0; i < n; i++) M.push(A[i].slice().concat([b[i]]));
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp;
      if (Math.abs(M[i][i]) < 1e-14) return null;
      for (k = i + 1; k < n; k++) {
        var f = M[k][i] / M[i][i];
        for (j = i; j <= n; j++) M[k][j] -= f * M[i][j];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  };
  /* maior resíduo |Ax − b|: é a conferência que o simulador mostra */
  CE.residuo = function (A, b, x) {
    var r = 0;
    for (var i = 0; i < b.length; i++) {
      var s = -b[i];
      for (var j = 0; j < x.length; j++) s += A[i][j] * x[j];
      r = Math.max(r, Math.abs(s));
    }
    return r;
  };

  /* ---------------------------------------------------------------
     Associações e divisores
     --------------------------------------------------------------- */
  CE.serie = function (lista) {
    var s = 0;
    for (var i = 0; i < lista.length; i++) s += lista[i];
    return s;
  };
  CE.paralelo = function (lista) {
    var s = 0;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] <= 0) return 0;
      s += 1 / lista[i];
    }
    return s > 0 ? 1 / s : Infinity;
  };
  CE.par2 = function (a, b) { return CE.paralelo([a, b]); };
  /* divisor de tensão e divisor de corrente, nas formas usadas no texto */
  CE.divTensao = function (V, Rk, Rtot) { return V * Rk / Rtot; };
  CE.divCorrente = function (I, Rk, Rpar) { return I * Rpar / Rk; };
  /* transformação estrela-triângulo */
  CE.yParaDelta = function (r1, r2, r3) {
    var p = r1 * r2 + r2 * r3 + r3 * r1;
    return { ra: p / r1, rb: p / r2, rc: p / r3 };
  };
  CE.deltaParaY = function (ra, rb, rc) {
    var s = ra + rb + rc;
    return { r1: rb * rc / s, r2: ra * rc / s, r3: ra * rb / s };
  };

  /* ---------------------------------------------------------------
     Thévenin, Norton e máxima transferência
     --------------------------------------------------------------- */
  CE.thevenin = function (Vth, Rth, RL) {
    var i = Vth / (Rth + RL);
    return {
      i: i, v: i * RL, p: i * i * RL,
      pFonte: Vth * i, pInterna: i * i * Rth,
      eta: (Rth + RL) > 0 ? RL / (Rth + RL) : 0,
      In: Rth > 0 ? Vth / Rth : Infinity,
      pMax: Rth > 0 ? Vth * Vth / (4 * Rth) : Infinity
    };
  };

  /* ---------------------------------------------------------------
     Elementos que armazenam energia
     --------------------------------------------------------------- */
  CE.wCap = function (C, v) { return 0.5 * C * v * v; };
  CE.wInd = function (L, i) { return 0.5 * L * i * i; };
  CE.capSerie = function (lista) { return CE.paralelo(lista); };   /* mesma conta dos resistores em paralelo */
  CE.capParalelo = function (lista) { return CE.serie(lista); };

  /* ---------------------------------------------------------------
     Primeira ordem: resposta natural e ao degrau
     --------------------------------------------------------------- */
  CE.tauRC = function (R, C) { return R * C; };
  CE.tauRL = function (L, R) { return L / R; };
  /* x(t) = x∞ + (x0 − x∞) e^(−t/τ) — a fórmula única dos circuitos de primeira ordem */
  CE.primeiraOrdem = function (x0, xinf, tau, t) {
    return xinf + (x0 - xinf) * Math.exp(-t / tau);
  };

  /* ---------------------------------------------------------------
     Segunda ordem: RLC série
     --------------------------------------------------------------- */
  CE.rlc = function (R, L, C) {
    var w0 = 1 / Math.sqrt(L * C);
    var alfa = R / (2 * L);
    var zeta = alfa / w0;
    var o = { w0: w0, f0: w0 / (2 * Math.PI), alfa: alfa, zeta: zeta, Rc: 2 * Math.sqrt(L / C) };
    if (zeta > 1.0001) {
      var d = Math.sqrt(alfa * alfa - w0 * w0);
      o.regime = 'super'; o.s1 = -alfa + d; o.s2 = -alfa - d; o.wd = 0;
    } else if (zeta < 0.9999) {
      o.regime = 'sub'; o.wd = Math.sqrt(w0 * w0 - alfa * alfa);
      o.fd = o.wd / (2 * Math.PI);
      o.sobressinal = Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta));
      o.tPico = Math.PI / o.wd;
    } else {
      o.regime = 'critico'; o.s1 = -alfa; o.s2 = -alfa; o.wd = 0;
    }
    return o;
  };
  /* tensão no capacitor e corrente, resposta ao degrau Vs com vC(0)=0 e i(0)=0 */
  CE.rlcDegrau = function (p, Vs, L, t) {
    var v, i;
    if (p.regime === 'super') {
      var e1 = Math.exp(p.s1 * t), e2 = Math.exp(p.s2 * t), d = p.s1 - p.s2;
      v = Vs * (1 + (p.s2 * e1 - p.s1 * e2) / d);
      i = Vs / (L * d) * (e1 - e2);
    } else if (p.regime === 'critico') {
      var e = Math.exp(-p.alfa * t);
      v = Vs * (1 - e * (1 + p.alfa * t));
      i = Vs * t * e / L;
    } else {
      var ea = Math.exp(-p.alfa * t);
      v = Vs * (1 - ea * (Math.cos(p.wd * t) + p.alfa / p.wd * Math.sin(p.wd * t)));
      i = Vs / (p.wd * L) * ea * Math.sin(p.wd * t);
    }
    return { v: v, i: i };
  };

  /* ---------------------------------------------------------------
     Regime permanente senoidal: fasores e potências
     --------------------------------------------------------------- */
  CE.cx = function (re, im) { return { re: re, im: im }; };
  CE.cxMod = function (z) { return Math.hypot(z.re, z.im); };
  CE.cxFase = function (z) { return Math.atan2(z.im, z.re); };
  CE.cxSoma = function (a, b) { return CE.cx(a.re + b.re, a.im + b.im); };
  CE.cxMul = function (a, b) { return CE.cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); };
  CE.cxDiv = function (a, b) {
    var d = b.re * b.re + b.im * b.im;
    return CE.cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  };
  CE.xl = function (f, L) { return 2 * Math.PI * f * L; };
  CE.xc = function (f, C) { return 1 / (2 * Math.PI * f * C); };
  /* triângulo de potências a partir de V eficaz e da impedância */
  CE.potencias = function (V, Z) {
    var mod = CE.cxMod(Z), th = CE.cxFase(Z);
    var I = V / mod;
    return {
      I: I, Zmod: mod, theta: th, thetaGrau: th * 180 / Math.PI,
      S: V * I, P: V * I * Math.cos(th), Q: V * I * Math.sin(th), fp: Math.cos(th)
    };
  };
  /* capacitor em paralelo que leva o fator de potência de fp1 a fp2 */
  CE.correcaoFP = function (P, fp1, fp2, V, f) {
    var t1 = Math.tan(Math.acos(fp1)), t2 = Math.tan(Math.acos(fp2));
    var Qc = P * (t1 - t2);
    return { Qc: Qc, C: Qc / (2 * Math.PI * f * V * V), tg1: t1, tg2: t2 };
  };
  /* trifásico equilibrado */
  CE.trifasico = function (VL, Zr, Zx, ligacao) {
    var Zm = Math.hypot(Zr, Zx), fp = Zr / Zm;
    var Vf = ligacao === 'delta' ? VL : VL / Math.sqrt(3);
    var If = Vf / Zm;
    var IL = ligacao === 'delta' ? If * Math.sqrt(3) : If;
    return {
      Vf: Vf, If: If, IL: IL, Zm: Zm, fp: fp,
      P: 3 * If * If * Zr, Q: 3 * If * If * Zx, S: Math.sqrt(3) * VL * IL
    };
  };

  global.CE = CE;

  /* --------------------------------------------------------------- formato */
  function sg(v, n) { return Plot ? Plot.sig(v, n || 4) : v; }
  function nt(v, n) { return String(sg(v, n)).replace('.', ','); }
  function cor(i) { return Plot.serie(i); }
  function nTex(v, n) { return Plot.numTex(v, n || 4); }

  /* =========================================================================
     1 · Circuito resistivo: divisores, Kirchhoff e potência
     ========================================================================= */
  function montarResistivo() {
    if (!document.getElementById('sim-resistivo')) return;
    Sim.build('#sim-resistivo', {
      titulo: '1. Circuito resistivo: divisores, Kirchhoff e potência',
      descricao: 'Uma fonte alimenta R1 em série, o paralelo R2–R3 e R4 em série. O simulador reduz o circuito, aplica os dois divisores, confere as duas leis de Kirchhoff e fecha o balanço de potência. Mexa em R3 e veja a corrente migrar de um ramo para o outro.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · O circuito do Exemplo 4.1', desc: '24 V, 6 Ω, 12 Ω ∥ 6 Ω e 2 Ω: corrente de 2 A',
          valores: { Vs: 24, R1: 6, R2: 12, R3: 6, R4: 2 } },
        { nome: '2 · Ramos iguais', desc: 'R2 = R3: a corrente se divide ao meio',
          valores: { Vs: 24, R1: 6, R2: 8, R3: 8, R4: 2 } },
        { nome: '3 · Um ramo quase em curto', desc: 'R3 pequeno engole a corrente do paralelo',
          valores: { Vs: 24, R1: 6, R2: 12, R3: 0.5, R4: 2 } },
        { nome: '4 · Divisor carregado', desc: 'R1 grande derruba a tensão do paralelo',
          valores: { Vs: 24, R1: 100, R2: 12, R3: 6, R4: 2 } },
        { nome: '5 · Só série', desc: 'R3 enorme: o ramo paralelo desaparece',
          valores: { Vs: 12, R1: 4, R2: 8, R3: 500, R4: 4 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Fonte' },
        { id: 'Vs', label: 'Tensão da fonte', min: 1, max: 240, step: 1, valor: 24, unidade: 'V' },
        { tipo: 'titulo', label: 'Resistores' },
        { id: 'R1', label: 'R1 (série, antes do paralelo)', min: 0.5, max: 200, step: 0.5, valor: 6, unidade: 'Ω' },
        { id: 'R2', label: 'R2 (ramo do paralelo)', min: 0.5, max: 200, step: 0.5, valor: 12, unidade: 'Ω' },
        { id: 'R3', label: 'R3 (ramo do paralelo)', min: 0.5, max: 200, step: 0.5, valor: 6, unidade: 'Ω' },
        { id: 'R4', label: 'R4 (série, depois do paralelo)', min: 0.5, max: 200, step: 0.5, valor: 2, unidade: 'Ω' }
      ],
      graficos: [
        { id: 'barras', titulo: 'Tensão em cada elemento', ylabel: 'V (volt)',
          aspect: 0.42, legenda: 'A soma das três tensões em série devolve exatamente a tensão da fonte — é a LKT no gráfico.' },
        { id: 'div', titulo: 'Divisão da corrente entre R2 e R3', xlabel: 'R3 (Ω)', ylabel: 'corrente (A)',
          xlog: true, aspect: 0.5, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'req', label: 'Resistência equivalente' },
        { id: 'it', label: 'Corrente total' },
        { id: 'vp', label: 'Tensão no paralelo' },
        { id: 'i2', label: 'Corrente em R2' },
        { id: 'i3', label: 'Corrente em R3' },
        { id: 'pt', label: 'Potência da fonte' },
        { id: 'lkc', label: 'Erro na LKC' },
        { id: 'lkt', label: 'Erro na LKT' }
      ],
      formulas: [
        { g: 'Reduzir' },
        { tex: 'R_{eq} = R_1 + \\dfrac{R_2R_3}{R_2+R_3} + R_4', d: 'série soma; paralelo soma condutâncias', destaque: true },
        { tex: 'I = \\dfrac{V_s}{R_{eq}}', d: 'lei de Ohm no circuito reduzido', destaque: true },
        { g: 'Dividir' },
        { tex: 'V_k = V_s\\dfrac{R_k}{R_{eq}}', d: 'divisor de tensão: quem tem mais resistência fica com mais tensão' },
        { tex: 'I_2 = I\\dfrac{R_3}{R_2+R_3} \\qquad I_3 = I\\dfrac{R_2}{R_2+R_3}', d: 'divisor de corrente: o inverso — a corrente prefere o ramo fácil' },
        { g: 'Conferir' },
        { tex: '\\sum i_{n\\acute{o}} = 0 \\qquad \\sum v_{\\text{laço}} = 0', d: 'LKC e LKT, as duas leis de Kirchhoff' },
        { tex: 'P = V_sI = \\sum R_k i_k^2', d: 'o que a fonte entrega é o que os resistores dissipam' }
      ],
      nota: 'Todos os elementos são ideais e lineares: a fonte não tem resistência interna e os resistores não mudam com a temperatura. Num chuveiro ou num forno reais a resistência cresce com o aquecimento, e a corrente de regime fica abaixo da calculada aqui.',
      calcular: function (p, ctx) {
        var Rp = CE.par2(p.R2, p.R3);
        var Req = p.R1 + Rp + p.R4;
        var I = p.Vs / Req;
        var V1 = I * p.R1, Vp = I * Rp, V4 = I * p.R4;
        var I2 = Vp / p.R2, I3 = Vp / p.R3;
        var P1 = I * I * p.R1, P2 = Vp * I2, P3 = Vp * I3, P4 = I * I * p.R4;
        var Pt = p.Vs * I;
        var errLKC = Math.abs(I - I2 - I3);
        var errLKT = Math.abs(p.Vs - V1 - Vp - V4);

        var g = ctx.plot('barras').clear();
        var rot = [{ v: 0, label: 'R1' }, { v: 1, label: 'R2 ∥ R3' }, { v: 2, label: 'R4' }, { v: 3, label: 'soma' }, { v: 4, label: 'fonte' }];
        g.o.xcat = rot;
        g.bars([0, 1, 2], [V1, Vp, V4], { color: cor(0), barw: 0.55, alpha: 0.85 });
        g.bars([3, 4], [V1 + Vp + V4, p.Vs], { color: cor(2), barw: 0.55, alpha: 0.85 });
        [[0, V1], [1, Vp], [2, V4], [3, V1 + Vp + V4], [4, p.Vs]].forEach(function (b) {
          g.text(b[0], b[1], nt(b[1], 4) + ' V', { align: 'center', baseline: 'bottom', dy: -4, size: 10.5 });
        });
        g.setLimits([-0.6, 4.6], null);
        g.draw();

        var g2 = ctx.plot('div').clear();
        var xs = [], y2 = [], y3 = [], yt = [], i, R3;
        for (i = 0; i <= 140; i++) {
          R3 = 0.5 * Math.pow(400, i / 140);
          var rp = CE.par2(p.R2, R3), it = p.Vs / (p.R1 + rp + p.R4), vp = it * rp;
          xs.push(Math.log(R3) / Math.LN10);
          y2.push(vp / p.R2); y3.push(vp / R3); yt.push(it);
        }
        g2.line(xs, yt, { color: cor(2), width: 2.2, label: 'corrente total I' });
        g2.line(xs, y2, { color: cor(0), width: 2, label: 'I₂ (em R2)' });
        g2.line(xs, y3, { color: cor(1), width: 2, dash: [6, 4], label: 'I₃ (em R3)' });
        g2.vline(Math.log(p.R3) / Math.LN10, { color: cor(3), text: 'R3 = ' + nt(p.R3, 4) + ' Ω' });
        g2.marker(Math.log(p.R3) / Math.LN10, I2, '', { color: cor(0) });
        g2.marker(Math.log(p.R3) / Math.LN10, I3, '', { color: cor(1) });
        g2.draw();

        ctx.setPassos([
          { t: '① Reduzir o paralelo',
            tex: 'R_2 \\parallel R_3 = \\frac{' + nTex(p.R2) + ' \\times ' + nTex(p.R3) + '}{' + nTex(p.R2) + ' + ' + nTex(p.R3) + '} = ' + nTex(Rp) + '\\ \\Omega',
            obs: 'O paralelo é sempre menor que o menor dos dois — aqui, menor que ' + nt(Math.min(p.R2, p.R3), 4) + ' Ω. '
              + 'Dois caminhos facilitam a passagem; é por isso que o paralelo soma condutâncias, não resistências.' },
          { t: '② Fechar a série e achar a corrente',
            tex: 'R_{eq} = ' + nTex(p.R1) + ' + ' + nTex(Rp) + ' + ' + nTex(p.R4) + ' = ' + nTex(Req) + '\\ \\Omega',
            texSub: 'I = \\frac{' + nTex(p.Vs) + '}{' + nTex(Req) + '} = ' + nTex(I) + '\\ \\text{A}',
            obs: 'Essa corrente atravessa R1, o conjunto paralelo e R4 — são elementos em série, e série significa a mesma corrente.' },
          { t: '③ Divisor de tensão',
            texSub: 'V_1 = ' + nTex(V1) + '\\ \\text{V} \\quad V_p = ' + nTex(Vp) + '\\ \\text{V} \\quad V_4 = ' + nTex(V4) + '\\ \\text{V}',
            obs: 'Soma: ' + nt(V1 + Vp + V4, 5) + ' V contra ' + nt(p.Vs, 5) + ' V da fonte. A LKT não é uma verificação opcional: '
              + 'é a própria razão de o divisor funcionar.' },
          { t: '④ Divisor de corrente',
            tex: 'I_2 = I\\frac{R_3}{R_2+R_3} = ' + nTex(I) + ' \\times \\frac{' + nTex(p.R3) + '}{' + nTex(p.R2 + p.R3) + '} = ' + nTex(I2) + '\\ \\text{A}',
            texSub: 'I_3 = ' + nTex(I3) + '\\ \\text{A} \\qquad I_2 + I_3 = ' + nTex(I2 + I3) + '\\ \\text{A}',
            obs: 'Repare na troca de papéis: no divisor de tensão o numerador é o próprio resistor; no divisor de corrente é o <em>outro</em>. '
              + (p.R3 < p.R2 ? 'Como R3 é menor, é por ele que passa a maior parte da corrente.'
                : p.R3 > p.R2 ? 'Como R3 é maior, é por R2 que passa a maior parte da corrente.'
                  : 'Com os dois ramos iguais, a corrente se divide exatamente ao meio.') },
          { t: '⑤ Balanço de potência',
            texSub: 'P_{fonte} = ' + nTex(Pt) + '\\ \\text{W} \\qquad \\sum P_R = ' + nTex(P1 + P2 + P3 + P4) + '\\ \\text{W}',
            obs: 'R1 dissipa ' + nt(P1, 4) + ' W, R2 ' + nt(P2, 4) + ' W, R3 ' + nt(P3, 4) + ' W e R4 ' + nt(P4, 4) + ' W. '
              + 'O elemento mais quente é ' + (function () {
                var m = [['R1', P1], ['R2', P2], ['R3', P3], ['R4', P4]].sort(function (a, b) { return b[1] - a[1]; })[0];
                return m[0] + ', com ' + nt(m[1], 4) + ' W';
              })() + ' — e é esse que define a especificação de watts na compra.' }
        ]);

        return {
          req: { v: sg(Req, 4), u: 'Ω' },
          it: { v: sg(I, 4), u: 'A' },
          vp: { v: sg(Vp, 4), u: 'V' },
          i2: { v: sg(I2, 4), u: 'A' },
          i3: { v: sg(I3, 4), u: 'A' },
          pt: { v: sg(Pt, 4), u: 'W' },
          lkc: { v: sg(errLKC, 2), u: 'A', classe: errLKC < 1e-9 ? 'ok' : 'alerta' },
          lkt: { v: sg(errLKT, 2), u: 'V', classe: errLKT < 1e-9 ? 'ok' : 'alerta' }
        };
      }
    });
  }

  /* =========================================================================
     2 · Nós e malhas no mesmo circuito
     ========================================================================= */
  function montarNos() {
    if (!document.getElementById('sim-nos')) return;
    Sim.build('#sim-nos', {
      titulo: '2. Nós e malhas no mesmo circuito',
      descricao: 'O mesmo circuito de dois nós e duas malhas resolvido pelos dois métodos, lado a lado: monta-se a matriz nodal, monta-se a matriz de malhas e comparam-se os resultados. Eles têm de coincidir — e coincidem até o último dígito.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · O circuito dos Exemplos 5.1 e 6.1', desc: '24 V, 4 Ω, 20 Ω, 5 Ω e 5 Ω: vA = 15 V e vB = 7,5 V',
          valores: { Vs1: 24, Vs2: 0, R0: 4, R3: 20, R1: 5, R2: 5 } },
        { nome: '2 · Duas fontes se opondo', desc: 'Vs2 empurra corrente de volta pelo ramo de cima',
          valores: { Vs1: 24, Vs2: 12, R0: 4, R3: 20, R1: 5, R2: 5 } },
        { nome: '3 · Só a segunda fonte', desc: 'Vs1 = 0: o circuito se inverte',
          valores: { Vs1: 0, Vs2: 24, R0: 4, R3: 20, R1: 5, R2: 5 } },
        { nome: '4 · Ramo do meio quase aberto', desc: 'R3 grande: o circuito vira uma malha só',
          valores: { Vs1: 24, Vs2: 0, R0: 4, R3: 2000, R1: 5, R2: 5 } },
        { nome: '5 · Ramo do meio quase em curto', desc: 'R3 pequeno: vA cai e o ramo de cima seca',
          valores: { Vs1: 24, Vs2: 0, R0: 4, R3: 0.5, R1: 5, R2: 5 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Fontes' },
        { id: 'Vs1', label: 'Vs1 (ramo da esquerda)', min: 0, max: 120, step: 1, valor: 24, unidade: 'V' },
        { id: 'Vs2', label: 'Vs2 (ramo da direita)', min: -120, max: 120, step: 1, valor: 0, unidade: 'V' },
        { tipo: 'titulo', label: 'Resistores' },
        { id: 'R0', label: 'R0 (em série com Vs1)', min: 0.5, max: 200, step: 0.5, valor: 4, unidade: 'Ω' },
        { id: 'R3', label: 'R3 (ramo do meio, de A ao terra)', min: 0.5, max: 2000, step: 0.5, valor: 20, unidade: 'Ω' },
        { id: 'R1', label: 'R1 (ramo de cima, de A a B)', min: 0.5, max: 200, step: 0.5, valor: 5, unidade: 'Ω' },
        { id: 'R2', label: 'R2 (em série com Vs2)', min: 0.5, max: 200, step: 0.5, valor: 5, unidade: 'Ω' }
      ],
      graficos: [
        { id: 'ramos', titulo: 'Corrente em cada ramo pelos dois métodos', ylabel: 'i (A)',
          aspect: 0.42, legendPos: 'topright',
          legenda: 'As barras claras vêm da análise nodal e os pontos, da análise de malhas. Sobrepostos sempre: é o mesmo circuito.' },
        { id: 'varre', titulo: 'Tensões de nó quando R3 varia', xlabel: 'R3 (Ω)', ylabel: 'tensão de nó (V)',
          xlog: true, aspect: 0.5, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'va', label: 'Tensão do nó A' },
        { id: 'vb', label: 'Tensão do nó B' },
        { id: 'i1', label: 'Corrente de malha i₁' },
        { id: 'i2', label: 'Corrente de malha i₂' },
        { id: 'i3', label: 'Corrente em R3' },
        { id: 'pf', label: 'Potência das fontes' },
        { id: 'pr', label: 'Potência dissipada' },
        { id: 'res', label: 'Resíduo das matrizes' }
      ],
      formulas: [
        { g: 'Análise nodal — duas equações, dois nós' },
        { tex: '\\left(\\frac{1}{R_0}+\\frac{1}{R_3}+\\frac{1}{R_1}\\right)v_A - \\frac{v_B}{R_1} = \\frac{V_{s1}}{R_0}', d: 'LKC no nó A', destaque: true },
        { tex: '-\\frac{v_A}{R_1} + \\left(\\frac{1}{R_1}+\\frac{1}{R_2}\\right)v_B = \\frac{V_{s2}}{R_2}', d: 'LKC no nó B', destaque: true },
        { g: 'Análise de malhas — duas equações, duas malhas' },
        { tex: '(R_0+R_3)\\,i_1 - R_3\\,i_2 = V_{s1}', d: 'LKT na malha da esquerda', destaque: true },
        { tex: '-R_3\\,i_1 + (R_3+R_1+R_2)\\,i_2 = -V_{s2}', d: 'LKT na malha da direita', destaque: true },
        { g: 'Ponte entre os dois' },
        { tex: 'v_A = (i_1-i_2)R_3 \\qquad v_B = v_A - i_2R_1', d: 'de correntes de malha para tensões de nó' },
        { tex: 'G_{kk} = \\sum \\frac{1}{R}\\ \\text{no nó} \\qquad R_{kk} = \\sum R\\ \\text{na malha}', d: 'a diagonal é sempre positiva; fora dela, negativa' }
      ],
      nota: 'A escolha do método é prática, não teórica: conte os nós essenciais menos um e conte as malhas, e use o que der o sistema menor. Aqui os dois dão 2 × 2; num circuito com muitas fontes de tensão em série, malhas vence, e num circuito largo com muitos ramos em paralelo, nós vence.',
      calcular: function (p, ctx) {
        /* nodal */
        var An = [[1 / p.R0 + 1 / p.R3 + 1 / p.R1, -1 / p.R1], [-1 / p.R1, 1 / p.R1 + 1 / p.R2]];
        var bn = [p.Vs1 / p.R0, p.Vs2 / p.R2];
        var vn = CE.resolver(An, bn) || [0, 0];
        var vA = vn[0], vB = vn[1];
        /* malhas */
        var Am = [[p.R0 + p.R3, -p.R3], [-p.R3, p.R3 + p.R1 + p.R2]];
        var bm = [p.Vs1, -p.Vs2];
        var im = CE.resolver(Am, bm) || [0, 0];
        var i1 = im[0], i2 = im[1];
        var res = Math.max(CE.residuo(An, bn, vn), CE.residuo(Am, bm, im) / Math.max(1, p.R3));

        /* correntes de ramo pelos dois caminhos */
        var ramoN = [(p.Vs1 - vA) / p.R0, vA / p.R3, (vA - vB) / p.R1, (vB - p.Vs2) / p.R2];
        var ramoM = [i1, i1 - i2, i2, i2];
        var Pfonte = p.Vs1 * ramoN[0] + p.Vs2 * (-ramoN[3]);
        var Pdiss = ramoN[0] * ramoN[0] * p.R0 + ramoN[1] * ramoN[1] * p.R3
          + ramoN[2] * ramoN[2] * p.R1 + ramoN[3] * ramoN[3] * p.R2;

        var g = ctx.plot('ramos').clear();
        g.o.xcat = [{ v: 0, label: 'R0' }, { v: 1, label: 'R3' }, { v: 2, label: 'R1' }, { v: 3, label: 'R2' }];
        g.bars([0, 1, 2, 3], ramoN, { color: cor(0), barw: 0.5, alpha: 0.75, label: 'nodal' });
        g.points([0, 1, 2, 3], ramoM, { color: cor(3), r: 5, label: 'malhas' });
        ramoN.forEach(function (v, k) {
          g.text(k, v, nt(v, 4) + ' A', { align: 'center', baseline: v >= 0 ? 'bottom' : 'top', dy: v >= 0 ? -5 : 12, size: 10.5 });
        });
        g.hline(0, { color: cor(5), width: 1 });
        g.setLimits([-0.6, 3.6], null);
        g.draw();

        var g2 = ctx.plot('varre').clear();
        var xs = [], ya = [], yb = [], k, R3;
        for (k = 0; k <= 140; k++) {
          R3 = 0.5 * Math.pow(4000, k / 140);
          var A2 = [[1 / p.R0 + 1 / R3 + 1 / p.R1, -1 / p.R1], [-1 / p.R1, 1 / p.R1 + 1 / p.R2]];
          var v2 = CE.resolver(A2, bn) || [0, 0];
          xs.push(Math.log(R3) / Math.LN10);
          ya.push(v2[0]); yb.push(v2[1]);
        }
        g2.line(xs, ya, { color: cor(0), width: 2.2, label: 'v_A' });
        g2.line(xs, yb, { color: cor(1), width: 2, dash: [6, 4], label: 'v_B' });
        g2.vline(Math.log(p.R3) / Math.LN10, { color: cor(3), text: 'R3 = ' + nt(p.R3, 4) + ' Ω' });
        g2.marker(Math.log(p.R3) / Math.LN10, vA, nt(vA, 4) + ' V', { color: cor(0) });
        g2.marker(Math.log(p.R3) / Math.LN10, vB, nt(vB, 4) + ' V', { color: cor(1) });
        g2.draw();

        ctx.setPassos([
          { t: '① Escolher o nó de referência',
            obs: 'O terra é o nó de baixo, comum aos quatro ramos. Com três nós essenciais sobram duas incógnitas: v<sub>A</sub> e v<sub>B</sub>. '
              + 'Toda tensão do circuito vira diferença entre essas duas e zero.' },
          { t: '② Montar a matriz nodal',
            tex: '\\begin{bmatrix}' + nTex(An[0][0], 4) + ' & ' + nTex(An[0][1], 4) + '\\\\ '
              + nTex(An[1][0], 4) + ' & ' + nTex(An[1][1], 4) + '\\end{bmatrix}'
              + '\\begin{bmatrix}v_A\\\\v_B\\end{bmatrix} = '
              + '\\begin{bmatrix}' + nTex(bn[0], 4) + '\\\\' + nTex(bn[1], 4) + '\\end{bmatrix}',
            obs: 'A diagonal é a soma das condutâncias que chegam ao nó, sempre positiva. Fora da diagonal vai o negativo da condutância '
              + 'que liga os dois nós — e a matriz sai simétrica porque só há resistores e fontes independentes.' },
          { t: '③ Resolver',
            texSub: 'v_A = ' + nTex(vA, 5) + '\\ \\text{V} \\qquad v_B = ' + nTex(vB, 5) + '\\ \\text{V}',
            obs: 'Com as tensões de nó, qualquer corrente sai de uma subtração e uma divisão: i = (v<sub>A</sub> − v<sub>B</sub>)/R<sub>1</sub> = '
              + nt(ramoN[2], 4) + ' A no ramo de cima.' },
          { t: '④ Agora pelas malhas',
            tex: '\\begin{bmatrix}' + nTex(Am[0][0], 4) + ' & ' + nTex(Am[0][1], 4) + '\\\\ '
              + nTex(Am[1][0], 4) + ' & ' + nTex(Am[1][1], 4) + '\\end{bmatrix}'
              + '\\begin{bmatrix}i_1\\\\i_2\\end{bmatrix} = '
              + '\\begin{bmatrix}' + nTex(bm[0], 4) + '\\\\' + nTex(bm[1], 4) + '\\end{bmatrix}',
            texSub: 'i_1 = ' + nTex(i1, 5) + '\\ \\text{A} \\qquad i_2 = ' + nTex(i2, 5) + '\\ \\text{A}',
            obs: 'R3 é o ramo compartilhado: ele aparece nas duas equações e sua corrente real é i₁ − i₂ = ' + nt(i1 - i2, 4) + ' A. '
              + 'Corrente de malha é uma variável auxiliar, não é o que um amperímetro lê — o amperímetro lê a corrente de ramo.' },
          { t: '⑤ Conferir',
            texSub: 'v_A = (i_1-i_2)R_3 = ' + nTex((i1 - i2) * p.R3, 5) + '\\ \\text{V}',
            obs: 'Os dois métodos concordam com resíduo de ' + sg(res, 2) + '. O balanço fecha também em potência: as fontes entregam '
              + nt(Pfonte, 5) + ' W e os resistores dissipam ' + nt(Pdiss, 5) + ' W.'
              + (p.Vs2 > 0 && ramoN[3] > 0 ? ' Note que Vs2 está <em>absorvendo</em> potência: a corrente entra pelo seu terminal positivo, como numa bateria em carga.' : '') }
        ]);

        return {
          va: { v: sg(vA, 5), u: 'V' },
          vb: { v: sg(vB, 5), u: 'V' },
          i1: { v: sg(i1, 4), u: 'A' },
          i2: { v: sg(i2, 4), u: 'A' },
          i3: { v: sg(i1 - i2, 4), u: 'A' },
          pf: { v: sg(Pfonte, 4), u: 'W' },
          pr: { v: sg(Pdiss, 4), u: 'W' },
          res: { v: sg(res, 2), u: '', classe: res < 1e-9 ? 'ok' : 'alerta' }
        };
      }
    });
  }

  /* =========================================================================
     3 · Thévenin, Norton e máxima transferência de potência
     ========================================================================= */
  function montarThevenin() {
    if (!document.getElementById('sim-thevenin')) return;
    Sim.build('#sim-thevenin', {
      titulo: '3. Thévenin, Norton e máxima transferência de potência',
      descricao: 'Um circuito com fonte de tensão, fonte de corrente e três resistores é reduzido a um par (Vth, Rth) e ao seu equivalente de Norton. Depois varia-se a carga para ver onde a potência é máxima e quanto custa, em rendimento, trabalhar nesse ponto.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · O circuito do Exemplo 8.1', desc: '24 V, 12 Ω, 6 Ω e 2 Ω: Vth = 8 V e Rth = 6 Ω',
          valores: { Vs: 24, Is: 0, R1: 12, R2: 6, R3: 2, RL: 6 } },
        { nome: '2 · Casamento perfeito', desc: 'RL = Rth: potência máxima e rendimento de 50 %',
          valores: { Vs: 24, Is: 0, R1: 12, R2: 6, R3: 2, RL: 6 } },
        { nome: '3 · Carga alta', desc: 'RL = 10 Rth: pouca potência, mas rendimento alto',
          valores: { Vs: 24, Is: 0, R1: 12, R2: 6, R3: 2, RL: 60 } },
        { nome: '4 · Com fonte de corrente', desc: 'A fonte de corrente muda Vth e não muda Rth',
          valores: { Vs: 24, Is: 2, R1: 12, R2: 6, R3: 2, RL: 6 } },
        { nome: '5 · Quase um curto', desc: 'RL pequeno: corrente alta e potência baixa',
          valores: { Vs: 24, Is: 0, R1: 12, R2: 6, R3: 2, RL: 0.5 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'O circuito que será reduzido' },
        { id: 'Vs', label: 'Fonte de tensão Vs', min: 0, max: 120, step: 1, valor: 24, unidade: 'V' },
        { id: 'R1', label: 'R1 (em série com Vs)', min: 0.5, max: 200, step: 0.5, valor: 12, unidade: 'Ω' },
        { id: 'Is', label: 'Fonte de corrente Is (entra no nó)', min: -5, max: 5, step: 0.1, valor: 0, unidade: 'A' },
        { id: 'R2', label: 'R2 (do nó ao terra)', min: 0.5, max: 200, step: 0.5, valor: 6, unidade: 'Ω' },
        { id: 'R3', label: 'R3 (até o terminal de saída)', min: 0, max: 100, step: 0.5, valor: 2, unidade: 'Ω' },
        { tipo: 'titulo', label: 'A carga' },
        { id: 'RL', label: 'Resistência de carga RL', min: 0.1, max: 200, step: 0.1, valor: 6, unidade: 'Ω' }
      ],
      graficos: [
        { id: 'pot', titulo: 'Potência na carga', xlabel: 'RL (Ω)', ylabel: 'P (W)',
          xlog: true, aspect: 0.5, legendPos: 'topleft',
          legenda: 'A curva é achatada perto do máximo: errar a carga por um fator de dois custa pouca potência. Errar por um fator de dez custa muito.' },
        { id: 'ren', titulo: 'Rendimento e potência relativa', xlabel: 'RL (Ω)', ylabel: '%',
          xlog: true, aspect: 0.5, legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'vth', label: 'Tensão de Thévenin' },
        { id: 'rth', label: 'Resistência de Thévenin' },
        { id: 'in', label: 'Corrente de Norton' },
        { id: 'il', label: 'Corrente na carga' },
        { id: 'vl', label: 'Tensão na carga' },
        { id: 'pl', label: 'Potência na carga' },
        { id: 'pmax', label: 'Potência máxima possível' },
        { id: 'eta', label: 'Rendimento' }
      ],
      formulas: [
        { g: 'Equivalente de Thévenin' },
        { tex: 'V_{th} = \\left(\\frac{V_s}{R_1} + I_s\\right)(R_1 \\parallel R_2)', d: 'tensão de circuito aberto no terminal', destaque: true },
        { tex: 'R_{th} = R_3 + (R_1 \\parallel R_2)', d: 'resistência vista do terminal, com as fontes zeradas', destaque: true },
        { g: 'Equivalente de Norton' },
        { tex: 'I_N = \\frac{V_{th}}{R_{th}} \\qquad R_N = R_{th}', d: 'mesma rede, outra roupa' },
        { g: 'Carga' },
        { tex: 'i_L = \\frac{V_{th}}{R_{th}+R_L} \\qquad P_L = i_L^2R_L', d: 'é tudo o que a carga precisa saber do circuito' },
        { tex: 'P_{max} = \\frac{V_{th}^2}{4R_{th}} \\quad \\text{em} \\quad R_L = R_{th}', d: 'máxima transferência de potência', destaque: true },
        { tex: '\\eta = \\frac{R_L}{R_L+R_{th}}', d: 'no casamento, η = 50 %' }
      ],
      nota: 'Zerar as fontes para achar Rth significa curto-circuitar as fontes de tensão e abrir as fontes de corrente — e isso vale só para fontes independentes. Com fonte dependente é preciso excitar o terminal e calcular Rth = v/i, porque a fonte controlada continua respondendo.',
      calcular: function (p, ctx) {
        var Rp = CE.par2(p.R1, p.R2);
        var Vth = (p.Vs / p.R1 + p.Is) * Rp;
        var Rth = p.R3 + Rp;
        var r = CE.thevenin(Vth, Rth, p.RL);

        var g = ctx.plot('pot').clear();
        var xs = [], ys = [], i, RL;
        for (i = 0; i <= 160; i++) {
          RL = Math.max(0.05, Rth / 40) * Math.pow(1600, i / 160);
          xs.push(Math.log(RL) / Math.LN10);
          ys.push(Math.pow(Vth / (Rth + RL), 2) * RL);
        }
        g.line(xs, ys, { color: cor(0), width: 2.4, label: 'P na carga' });
        g.vline(Math.log(Rth) / Math.LN10, { color: cor(2), text: 'RL = Rth = ' + nt(Rth, 4) + ' Ω' });
        g.hline(r.pMax, { color: cor(2), width: 1, text: 'Pmax = ' + nt(r.pMax, 4) + ' W' });
        g.marker(Math.log(p.RL) / Math.LN10, r.p, nt(r.p, 4) + ' W', { color: cor(3) });
        g.draw();

        var g2 = ctx.plot('ren').clear();
        var xs2 = [], ye = [], yp = [];
        for (i = 0; i <= 160; i++) {
          RL = Math.max(0.05, Rth / 40) * Math.pow(1600, i / 160);
          xs2.push(Math.log(RL) / Math.LN10);
          ye.push(100 * RL / (RL + Rth));
          yp.push(100 * Math.pow(Vth / (Rth + RL), 2) * RL / r.pMax);
        }
        g2.line(xs2, ye, { color: cor(1), width: 2.2, label: 'rendimento η' });
        g2.line(xs2, yp, { color: cor(0), width: 2, dash: [6, 4], label: 'P / Pmax' });
        g2.vline(Math.log(Rth) / Math.LN10, { color: cor(2), text: 'casamento' });
        g2.hline(50, { color: cor(5), width: 1, text: '50 %' });
        g2.marker(Math.log(p.RL) / Math.LN10, 100 * r.eta, nt(100 * r.eta, 3) + ' %', { color: cor(1) });
        g2.draw();

        ctx.setPassos([
          { t: '① Abrir o terminal e achar Vth',
            tex: 'V_{th} = \\left(\\frac{' + nTex(p.Vs) + '}{' + nTex(p.R1) + '}' + (p.Is >= 0 ? ' + ' : ' - ') + nTex(Math.abs(p.Is)) + '\\right)'
              + nTex(Rp) + ' = ' + nTex(Vth, 5) + '\\ \\text{V}',
            obs: 'Com o terminal aberto não passa corrente por R3, e por isso R3 não aparece em Vth. Em compensação ele aparece inteiro em Rth: '
              + 'um resistor em série com a saída não altera a tensão de circuito aberto, mas altera tudo o que a carga recebe.' },
          { t: '② Zerar as fontes e achar Rth',
            tex: 'R_{th} = R_3 + (R_1 \\parallel R_2) = ' + nTex(p.R3) + ' + ' + nTex(Rp) + ' = ' + nTex(Rth, 5) + '\\ \\Omega',
            obs: 'Fonte de tensão zerada é um curto; fonte de corrente zerada é um aberto. O que sobra é uma rede só de resistores, '
              + 'e Rth é a resistência que um ohmímetro leria no terminal.' },
          { t: '③ Norton é a mesma coisa',
            texSub: 'I_N = \\frac{' + nTex(Vth, 5) + '}{' + nTex(Rth, 5) + '} = ' + nTex(r.In, 5) + '\\ \\text{A}',
            obs: 'Nenhuma medida feita no terminal distingue as duas versões. Em curto, as duas entregam ' + nt(r.In, 4) + ' A; '
              + 'em aberto, as duas mostram ' + nt(Vth, 4) + ' V.' },
          { t: '④ Pendurar a carga',
            tex: 'i_L = \\frac{' + nTex(Vth, 5) + '}{' + nTex(Rth, 5) + ' + ' + nTex(p.RL) + '} = ' + nTex(r.i, 5) + '\\ \\text{A}',
            texSub: 'P_L = ' + nTex(r.i, 5) + '^2 \\times ' + nTex(p.RL) + ' = ' + nTex(r.p, 5) + '\\ \\text{W}',
            obs: 'A carga recebe ' + nt(r.v, 4) + ' V, ou ' + nt(100 * r.v / Math.max(Vth, 1e-9), 3) + ' % da tensão em aberto. '
              + 'O resto fica em Rth, dentro do próprio circuito.' },
          { t: '⑤ Onde a potência é máxima',
            tex: 'P_{max} = \\frac{V_{th}^2}{4R_{th}} = ' + nTex(r.pMax, 5) + '\\ \\text{W}',
            obs: 'Agora você está em ' + nt(100 * r.p / Math.max(r.pMax, 1e-12), 3) + ' % do máximo, com rendimento de '
              + nt(100 * r.eta, 3) + ' %. ' + (Math.abs(p.RL - Rth) / Rth < 0.05
                ? 'Está casado: potência máxima e exatamente metade da energia desperdiçada dentro do circuito.'
                : p.RL < Rth ? 'Com RL abaixo de Rth sobra corrente e falta tensão — é o lado quente e ineficiente da curva.'
                  : 'Com RL acima de Rth o rendimento é alto, mas a potência entregue é menor.')
              + ' É por isso que casar impedância faz sentido em antena e em transdutor, onde o sinal é o produto, e não faz sentido '
              + 'em linha de distribuição, onde a conta de energia é o produto.' }
        ]);

        return {
          vth: { v: sg(Vth, 5), u: 'V' },
          rth: { v: sg(Rth, 5), u: 'Ω' },
          in: { v: sg(r.In, 4), u: 'A' },
          il: { v: sg(r.i, 4), u: 'A' },
          vl: { v: sg(r.v, 4), u: 'V' },
          pl: { v: sg(r.p, 4), u: 'W', classe: Math.abs(p.RL - Rth) / Rth < 0.05 ? 'ok' : '' },
          pmax: { v: sg(r.pMax, 4), u: 'W' },
          eta: { v: sg(100 * r.eta, 3), u: '%', classe: r.eta < 0.5 ? 'alerta' : 'ok' }
        };
      }
    });
  }

  /* =========================================================================
     4 · Transitórios: RC, RL e RLC
     ========================================================================= */
  function montarTransitorio() {
    if (!document.getElementById('sim-transitorio')) return;
    Sim.build('#sim-transitorio', {
      titulo: '4. Transitórios: RC, RL e RLC nos três amortecimentos',
      descricao: 'Fecha-se a chave em t = 0 e o circuito sai de um estado permanente para outro. Em primeira ordem a resposta é uma exponencial só; em segunda ordem ela pode se arrastar, chegar no limite ou oscilar — e é o resistor que decide qual dos três.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · RC do Exemplo 10.1', desc: '1 MΩ e 0,1 µF: τ = 100 ms',
          valores: { tipo: 'rc', exc: 'degrau', Vs: 100, R: 1e6, L: 200, C: 0.1 } },
        { nome: '2 · RL do Exemplo 10.2', desc: '12 V, 4 Ω e 0,2 H: τ = 50 ms e i∞ = 3 A',
          valores: { tipo: 'rl', exc: 'degrau', Vs: 12, R: 4, L: 200, C: 10 } },
        { nome: '3 · RLC superamortecido', desc: 'R = 500 Ω, bem acima dos 200 Ω críticos',
          valores: { tipo: 'rlc', exc: 'degrau', Vs: 10, R: 500, L: 100, C: 10 } },
        { nome: '4 · RLC crítico', desc: 'R = 200 Ω = 2√(L/C): o limite exato',
          valores: { tipo: 'rlc', exc: 'degrau', Vs: 10, R: 200, L: 100, C: 10 } },
        { nome: '5 · RLC subamortecido', desc: 'R = 40 Ω: 52,7 % de sobressinal',
          valores: { tipo: 'rlc', exc: 'degrau', Vs: 10, R: 40, L: 100, C: 10 } },
        { nome: '6 · Descarga oscilante', desc: 'Resposta natural com o capacitor carregado',
          valores: { tipo: 'rlc', exc: 'natural', Vs: 10, R: 20, L: 100, C: 10 } }
      ],
      controles: [
        { id: 'tipo', tipo: 'seg', label: 'Circuito', valor: 'rc',
          opcoes: [{ v: 'rc', t: 'RC' }, { v: 'rl', t: 'RL' }, { v: 'rlc', t: 'RLC série' }] },
        { id: 'exc', tipo: 'seg', label: 'Excitação', valor: 'degrau',
          opcoes: [{ v: 'degrau', t: 'Degrau (liga)' }, { v: 'natural', t: 'Natural (desliga)' }] },
        { tipo: 'titulo', label: 'Parâmetros' },
        { id: 'Vs', label: 'Tensão da fonte (ou valor inicial)', min: 1, max: 400, step: 1, valor: 100, unidade: 'V' },
        { id: 'R', label: 'Resistência', min: 0.1, max: 2e6, step: 0.1, valor: 1e6, unidade: 'Ω' },
        { id: 'L', label: 'Indutância', min: 1, max: 1000, step: 1, valor: 200, unidade: 'mH' },
        { id: 'C', label: 'Capacitância', min: 0.01, max: 1000, step: 0.01, valor: 0.1, unidade: 'µF' }
      ],
      graficos: [
        { id: 'v', titulo: 'Tensão no elemento que armazena energia', xlabel: 't / τ (ou t, em ms)', ylabel: 'v (V)',
          aspect: 0.5, legendPos: 'bottomright' },
        { id: 'i', titulo: 'Corrente', xlabel: 't', ylabel: 'i (A)', aspect: 0.45, legendPos: 'topright',
          legenda: 'Em primeira ordem a corrente salta em t = 0 e decai; em segunda ordem ela parte de zero, porque a inércia do indutor não permite salto.' }
      ],
      saidas: [
        { id: 'reg', label: 'Regime' },
        { id: 'tau', label: 'Constante de tempo τ' },
        { id: 'w0', label: 'Frequência natural ω₀' },
        { id: 'zeta', label: 'Amortecimento ζ' },
        { id: 'wd', label: 'ω amortecida' },
        { id: 'pico', label: 'Pico da resposta' },
        { id: 't99', label: 'Tempo de acomodação' },
        { id: 'w', label: 'Energia armazenada no fim' }
      ],
      formulas: [
        { g: 'Primeira ordem — uma fórmula só' },
        { tex: 'x(t) = x_\\infty + \\left(x_0 - x_\\infty\\right)e^{-t/\\tau}', d: 'serve para v no capacitor e i no indutor', destaque: true },
        { tex: '\\tau = RC \\qquad \\tau = L/R', d: 'constante de tempo; em 5τ o transitório acabou (99,3 %)' },
        { g: 'Segunda ordem — RLC série' },
        { tex: '\\omega_0 = \\frac{1}{\\sqrt{LC}} \\qquad \\alpha = \\frac{R}{2L} \\qquad \\zeta = \\frac{\\alpha}{\\omega_0}', destaque: true },
        { tex: 'R_{cr} = 2\\sqrt{L/C}', d: 'o resistor que separa oscilar de não oscilar', destaque: true },
        { tex: 's_{1,2} = -\\alpha \\pm \\sqrt{\\alpha^2-\\omega_0^2}', d: 'duas raízes reais, uma dupla ou um par complexo' },
        { tex: '\\omega_d = \\sqrt{\\omega_0^2-\\alpha^2} \\qquad M_p = e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}', d: 'oscilação amortecida e sobressinal' },
        { g: 'Energia' },
        { tex: 'W_C = \\tfrac{1}{2}Cv^2 \\qquad W_L = \\tfrac{1}{2}Li^2', d: 'a tensão do capacitor e a corrente do indutor não dão saltos' }
      ],
      nota: 'Os três regimes não são três fórmulas diferentes: são o mesmo par de raízes conforme o discriminante α² − ω₀² seja positivo, nulo ou negativo. O caso crítico é o limite dos dois outros — e, por ser um ponto só na reta dos reais, nunca é obtido exatamente num circuito de verdade.',
      calcular: function (p, ctx) {
        var R = p.R, L = p.L / 1000, C = p.C * 1e-6, Vs = p.Vs;
        var natural = p.exc === 'natural';
        var N = 320, k, t;
        var ts = [], vs = [], is = [], env1 = [], env2 = [];
        var saida = {};
        var gv = ctx.plot('v').clear(), gi = ctx.plot('i').clear();

        if (p.tipo === 'rc' || p.tipo === 'rl') {
          var tau = p.tipo === 'rc' ? CE.tauRC(R, C) : CE.tauRL(L, R);
          var tmax = 6 * tau;
          var Iinf = Vs / R;
          for (k = 0; k <= N; k++) {
            t = tmax * k / N;
            ts.push(t * 1000);
            if (p.tipo === 'rc') {
              vs.push(natural ? Vs * Math.exp(-t / tau) : Vs * (1 - Math.exp(-t / tau)));
              is.push((natural ? -1 : 1) * Iinf * Math.exp(-t / tau));
            } else {
              is.push(natural ? Iinf * Math.exp(-t / tau) : Iinf * (1 - Math.exp(-t / tau)));
              vs.push((natural ? -1 : 1) * Vs * Math.exp(-t / tau));
            }
          }
          gv.line(ts, vs, { color: cor(0), width: 2.4, label: p.tipo === 'rc' ? 'v no capacitor' : 'v no indutor' });
          [1, 2, 3, 5].forEach(function (n) {
            gv.vline(n * tau * 1000, { color: cor(5), width: 1, text: n + 'τ' });
          });
          var vFim = p.tipo === 'rc' ? (natural ? 0 : Vs) : 0;
          gv.hline(vFim, { color: cor(2), width: 1, text: 'valor final' });
          gv.draw();
          gi.line(ts, is, { color: cor(1), width: 2.4, label: p.tipo === 'rc' ? 'i no circuito' : 'i no indutor' });
          gi.hline(0, { color: cor(5), width: 1 });
          gi.draw();

          var vCfim = p.tipo === 'rc' ? (natural ? 0 : Vs) : 0;
          var iLfim = p.tipo === 'rl' ? (natural ? 0 : Iinf) : 0;
          saida = {
            reg: { v: 'primeira ordem', u: '' },
            tau: { v: sg(tau * 1000, 4), u: 'ms' },
            w0: { v: sg(1 / tau, 4), u: 'rad/s' },
            zeta: { v: '—', u: '' },
            wd: { v: '—', u: '' },
            pico: { v: sg(p.tipo === 'rc' ? Vs : Iinf, 4), u: p.tipo === 'rc' ? 'V' : 'A' },
            t99: { v: sg(5 * tau * 1000, 4), u: 'ms' },
            w: { v: sg(p.tipo === 'rc' ? CE.wCap(C, vCfim) * 1000 : CE.wInd(L, iLfim) * 1000, 4), u: 'mJ' }
          };
          ctx.setPassos([
            { t: '① Achar a constante de tempo',
              tex: p.tipo === 'rc'
                ? '\\tau = RC = ' + nTex(R) + ' \\times ' + nTex(C) + ' = ' + nTex(tau, 4) + '\\ \\text{s}'
                : '\\tau = L/R = ' + nTex(L) + ' / ' + nTex(R) + ' = ' + nTex(tau, 4) + '\\ \\text{s}',
              obs: 'τ é o tempo em que a resposta percorre 63,2 % do caminho que falta. Em 3τ já foram 95 % e em 5τ, 99,3 % — '
                + 'é esse o critério prático de "transitório acabou".' },
            { t: '② Marcar o antes e o depois',
              texSub: p.tipo === 'rc'
                ? 'v_C(0^+) = ' + nTex(natural ? Vs : 0, 4) + '\\ \\text{V} \\qquad v_C(\\infty) = ' + nTex(natural ? 0 : Vs, 4) + '\\ \\text{V}'
                : 'i_L(0^+) = ' + nTex(natural ? Iinf : 0, 4) + '\\ \\text{A} \\qquad i_L(\\infty) = ' + nTex(natural ? 0 : Iinf, 4) + '\\ \\text{A}',
              obs: p.tipo === 'rc'
                ? 'A tensão do capacitor não dá saltos, então v_C(0⁺) = v_C(0⁻). Em regime permanente de corrente contínua o capacitor é um aberto, e a corrente vai a zero.'
                : 'A corrente do indutor não dá saltos, então i_L(0⁺) = i_L(0⁻). Em regime permanente o indutor é um curto, e a tensão nele vai a zero.' },
            { t: '③ Escrever a resposta',
              tex: p.tipo === 'rc'
                ? (natural ? 'v_C(t) = ' + nTex(Vs, 4) + '\\,e^{-t/\\tau}' : 'v_C(t) = ' + nTex(Vs, 4) + '\\left(1-e^{-t/\\tau}\\right)')
                : (natural ? 'i_L(t) = ' + nTex(Iinf, 4) + '\\,e^{-t/\\tau}' : 'i_L(t) = ' + nTex(Iinf, 4) + '\\left(1-e^{-t/\\tau}\\right)'),
              obs: 'A fórmula única x(t) = x∞ + (x₀ − x∞)e^(−t/τ) dispensa resolver a equação diferencial de novo a cada circuito: '
                + 'basta o valor inicial, o valor final e τ.' },
            { t: '④ O salto e a energia',
              texSub: p.tipo === 'rc'
                ? 'i(0^+) = V_s/R = ' + nTex(Iinf, 4) + '\\ \\text{A}'
                : 'v_L(0^+) = ' + nTex(Vs, 4) + '\\ \\text{V}',
              obs: p.tipo === 'rc'
                ? 'Quem salta é a corrente, que não tem inércia nesse circuito: de 0 a ' + nt(Iinf, 4) + ' A instantaneamente. '
                + 'No fim, o capacitor guarda ' + nt(CE.wCap(C, vCfim) * 1000, 4) + ' mJ — e o resistor dissipou exatamente a mesma coisa durante a carga.'
                : 'Quem salta é a tensão do indutor: ela vai instantaneamente a ' + nt(Vs, 4) + ' V e decai. '
                + 'No fim, o indutor guarda ' + nt(CE.wInd(L, iLfim) * 1000, 4) + ' mJ no campo magnético.' }
          ]);
        } else {
          var o = CE.rlc(R, L, C);
          var tmax2;
          if (o.regime === 'sub') tmax2 = Math.max(5 / o.alfa, 2.5 * 2 * Math.PI / o.wd);
          else if (o.regime === 'super') tmax2 = 5 / Math.abs(o.s1);
          else tmax2 = 7 / o.alfa;
          for (k = 0; k <= N; k++) {
            t = tmax2 * k / N;
            var st = CE.rlcDegrau(o, Vs, L, t);
            ts.push(t * 1000);
            vs.push(natural ? Vs - st.v : st.v);
            is.push(natural ? -st.i : st.i);
            if (o.regime === 'sub') {
              var e = Vs * Math.exp(-o.alfa * t) * Math.sqrt(1 + Math.pow(o.alfa / o.wd, 2));
              env1.push(natural ? e : Vs + e);
              env2.push(natural ? -e : Vs - e);
            }
          }
          gv.line(ts, vs, { color: cor(0), width: 2.4, label: 'v no capacitor' });
          if (o.regime === 'sub') {
            gv.line(ts, env1, { color: cor(3), width: 1.2, dash: [5, 4], label: 'envelope e^(−αt)' });
            gv.line(ts, env2, { color: cor(3), width: 1.2, dash: [5, 4] });
          }
          gv.hline(natural ? 0 : Vs, { color: cor(2), width: 1, text: 'valor final' });
          if (o.regime === 'sub' && !natural) {
            gv.marker(o.tPico * 1000, Vs * (1 + o.sobressinal),
              'pico ' + nt(100 * o.sobressinal, 3) + ' % acima', { color: cor(3) });
          }
          gv.draw();
          gi.line(ts, is, { color: cor(1), width: 2.4, label: 'i no circuito' });
          gi.hline(0, { color: cor(5), width: 1 });
          gi.draw();

          var vFinal = natural ? 0 : Vs;
          saida = {
            reg: {
              v: o.regime === 'sub' ? 'subamortecido' : o.regime === 'super' ? 'superamortecido' : 'crítico',
              u: '', classe: o.regime === 'sub' ? 'alerta' : 'ok'
            },
            tau: { v: sg(1000 / o.alfa, 4), u: 'ms (1/α)' },
            w0: { v: sg(o.w0, 5), u: 'rad/s' },
            zeta: { v: sg(o.zeta, 4), u: '' },
            wd: { v: o.regime === 'sub' ? sg(o.wd, 5) : '—', u: o.regime === 'sub' ? 'rad/s' : '' },
            pico: { v: sg(o.regime === 'sub' && !natural ? Vs * (1 + o.sobressinal) : Vs, 4), u: 'V' },
            t99: { v: sg((o.regime === 'super' ? 5 / Math.abs(o.s1) : 5 / o.alfa) * 1000, 4), u: 'ms' },
            w: { v: sg(CE.wCap(C, vFinal) * 1000, 4), u: 'mJ' }
          };
          ctx.setPassos([
            { t: '① Os dois parâmetros do circuito',
              tex: '\\omega_0 = \\frac{1}{\\sqrt{LC}} = ' + nTex(o.w0, 5) + '\\ \\text{rad/s} \\qquad \\alpha = \\frac{R}{2L} = ' + nTex(o.alfa, 5) + '\\ \\text{s}^{-1}',
              obs: 'ω₀ sai de L e C, e é a frequência com que o circuito oscilaria sem resistor: f₀ = ' + nt(o.f0, 5) + ' Hz. '
                + 'α sai de R e L, e mede quão rápido a energia é consumida.' },
            { t: '② Comparar com o resistor crítico',
              tex: 'R_{cr} = 2\\sqrt{L/C} = ' + nTex(o.Rc, 5) + '\\ \\Omega \\qquad \\zeta = \\alpha/\\omega_0 = ' + nTex(o.zeta, 4),
              obs: 'Com R = ' + nt(R, 4) + ' Ω contra ' + nt(o.Rc, 4) + ' Ω críticos, o circuito é '
                + (o.regime === 'sub' ? '<strong>subamortecido</strong>: ele vai oscilar.'
                  : o.regime === 'super' ? '<strong>superamortecido</strong>: não oscila, e chega devagar.'
                    : '<strong>criticamente amortecido</strong>: é o mais rápido sem ultrapassar o alvo.') },
            { t: '③ As raízes da equação característica',
              tex: o.regime === 'sub'
                ? 's = -' + nTex(o.alfa, 5) + ' \\pm j\\,' + nTex(o.wd, 5) + '\\ \\text{s}^{-1}'
                : 's_1 = ' + nTex(o.s1, 5) + '\\ \\text{s}^{-1} \\qquad s_2 = ' + nTex(o.s2, 5) + '\\ \\text{s}^{-1}',
              obs: o.regime === 'sub'
                ? 'Par complexo conjugado: a parte real dá o decaimento e a imaginária, a oscilação de ' + nt(o.fd, 5) + ' Hz — '
                + 'abaixo de f₀, porque o amortecimento sempre reduz a frequência.'
                : o.regime === 'super'
                  ? 'Duas raízes reais. A resposta é a soma de duas exponenciais, e quem manda no fim é a mais lenta, '
                  + 'de constante ' + nt(1000 / Math.abs(o.s1), 4) + ' ms.'
                  : 'Raiz dupla em −α. Aparece o termo t·e^(−αt), que não existe nos outros dois casos.' },
            { t: '④ A resposta',
              tex: o.regime === 'sub'
                ? 'v_C(t) = V_s\\left[1-e^{-\\alpha t}\\left(\\cos\\omega_d t + \\frac{\\alpha}{\\omega_d}\\sin\\omega_d t\\right)\\right]'
                : o.regime === 'super'
                  ? 'v_C(t) = V_s\\left[1+\\frac{s_2e^{s_1t}-s_1e^{s_2t}}{s_1-s_2}\\right]'
                  : 'v_C(t) = V_s\\left[1-e^{-\\alpha t}(1+\\alpha t)\\right]',
              obs: o.regime === 'sub'
                ? 'O sobressinal é e^(−πζ/√(1−ζ²)) = ' + nt(100 * o.sobressinal, 4) + ' %, atingido em t = π/ω_d = ' + nt(o.tPico * 1000, 4) + ' ms. '
                + 'O capacitor chega a ' + nt(Vs * (1 + o.sobressinal), 5) + ' V, acima da fonte — e é por isso que isolação se dimensiona pelo transitório, não pelo regime.'
                : 'Sem sobressinal: a tensão sobe monotonamente até ' + nt(Vs, 4) + ' V. '
                + 'Na resposta natural, o mesmo circuito simplesmente descarrega sem passar do zero.' },
            { t: '⑤ Onde está a energia',
              texSub: 'W_C = \\tfrac{1}{2}Cv^2 \\to ' + nTex(CE.wCap(C, vFinal) * 1000, 4) + '\\ \\text{mJ}',
              obs: 'Durante o transitório a energia vai e volta entre o campo elétrico do capacitor e o campo magnético do indutor, '
                + 'e o resistor cobra pedágio em cada passagem. No regime permanente de corrente contínua a corrente é zero, '
                + 'o indutor está vazio e o capacitor guarda toda a energia que sobrou.' }
          ]);
        }
        return saida;
      }
    });
  }

  /* =========================================================================
     5 · Fasores, potências e correção do fator de potência
     ========================================================================= */
  function montarFasores() {
    if (!document.getElementById('sim-fasores')) return;
    Sim.build('#sim-fasores', {
      titulo: '5. Fasores, potências e correção do fator de potência',
      descricao: 'Uma carga R–L alimentada em regime permanente senoidal: impedância, fasor de corrente, triângulo de potências e o capacitor que corrige o fator de potência. O simulador mostra o que a correção muda — e o que ela não muda.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · A carga do Exemplo 13.1', desc: '220 V, 30 Ω e 0,1 H: I = 4,57 A atrasada 51,5°',
          valores: { V: 220, f: 60, R: 30, L: 100, fp2: 0.92 } },
        { nome: '2 · Motor com fator de potência ruim', desc: 'FP = 0,70: muita corrente para pouca potência',
          valores: { V: 220, f: 60, R: 2.371, L: 6.42, fp2: 0.95 } },
        { nome: '3 · Carga quase resistiva', desc: 'Pouca indutância: FP perto de 1 e nada a corrigir',
          valores: { V: 220, f: 60, R: 30, L: 10, fp2: 0.95 } },
        { nome: '4 · Carga muito indutiva', desc: 'A reativa domina e a corrente explode',
          valores: { V: 220, f: 60, R: 5, L: 100, fp2: 0.92 } },
        { nome: '5 · Rede de 380 V', desc: 'Mesma carga em tensão maior: menos corrente',
          valores: { V: 380, f: 60, R: 30, L: 100, fp2: 0.95 } },
        { nome: '6 · Rede de 50 Hz', desc: 'A reatância cai com a frequência',
          valores: { V: 220, f: 50, R: 30, L: 100, fp2: 0.95 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Rede' },
        { id: 'V', label: 'Tensão eficaz', min: 100, max: 600, step: 1, valor: 220, unidade: 'V' },
        { id: 'f', label: 'Frequência', min: 40, max: 70, step: 1, valor: 60, unidade: 'Hz' },
        { tipo: 'titulo', label: 'Carga R–L série' },
        { id: 'R', label: 'Resistência', min: 0.5, max: 100, step: 0.001, valor: 30, unidade: 'Ω' },
        { id: 'L', label: 'Indutância', min: 1, max: 300, step: 0.01, valor: 100, unidade: 'mH' },
        { tipo: 'titulo', label: 'Correção' },
        { id: 'fp2', label: 'Fator de potência desejado', min: 0.7, max: 1, step: 0.01, valor: 0.92 }
      ],
      graficos: [
        { id: 'fas', titulo: 'Diagrama de fasores (referência: a tensão)', aspect: 0.52,
          axes: false, legendPos: 'topleft',
          legenda: 'A tensão é a referência no eixo horizontal. A corrente da carga está atrasada; o capacitor devolve uma corrente adiantada de 90°, e a soma é a corrente que a rede passa a fornecer.' },
        { id: 'tri', titulo: 'Triângulo de potências', xlabel: 'P (kW)', ylabel: 'Q (kvar)',
          aspect: 0.5, equalAspect: true, legendPos: 'topleft' },
        { id: 'temp', titulo: 'Tensão, corrente e potência instantânea', xlabel: 't (ms)', ylabel: 'valor normalizado',
          aspect: 0.45, legendPos: 'bottomright',
          legenda: 'A potência instantânea oscila a 2f e fica negativa em parte do ciclo: nesses intervalos a carga devolve energia à rede. É exatamente isso que a potência reativa mede.' }
      ],
      saidas: [
        { id: 'xl', label: 'Reatância indutiva' },
        { id: 'z', label: 'Módulo da impedância' },
        { id: 'th', label: 'Ângulo da impedância' },
        { id: 'i', label: 'Corrente da carga' },
        { id: 'p', label: 'Potência ativa' },
        { id: 'q', label: 'Potência reativa' },
        { id: 's', label: 'Potência aparente' },
        { id: 'fp', label: 'Fator de potência' },
        { id: 'cap', label: 'Capacitor necessário' },
        { id: 'inova', label: 'Corrente corrigida' },
        { id: 'red', label: 'Redução da corrente' },
        { id: 'perdas', label: 'Queda nas perdas da linha' }
      ],
      formulas: [
        { g: 'Impedância' },
        { tex: 'X_L = \\omega L = 2\\pi fL \\qquad \\mathbf{Z} = R + jX_L', destaque: true },
        { tex: '|\\mathbf{Z}| = \\sqrt{R^2+X_L^2} \\qquad \\theta = \\arctan\\frac{X_L}{R}', d: 'θ > 0: corrente atrasada' },
        { tex: '\\mathbf{I} = \\dfrac{\\mathbf{V}}{\\mathbf{Z}}', d: 'lei de Ohm fasorial — divide módulos e subtrai ângulos', destaque: true },
        { g: 'Potências' },
        { tex: 'S = VI \\qquad P = VI\\cos\\theta \\qquad Q = VI\\sin\\theta', destaque: true },
        { tex: 'S^2 = P^2 + Q^2 \\qquad \\text{FP} = \\cos\\theta = P/S' },
        { g: 'Correção' },
        { tex: 'Q_C = P(\\tan\\theta_1 - \\tan\\theta_2)', d: 'reativa que o capacitor tem de fornecer', destaque: true },
        { tex: 'C = \\dfrac{Q_C}{2\\pi fV^2}', d: 'capacitor em paralelo com a carga', destaque: true }
      ],
      nota: 'Corrigir o fator de potência não reduz a potência ativa nem a energia faturada em kWh: reduz a corrente, e com ela as perdas na linha, a queda de tensão e a necessidade de condutor e de transformador. O capacitor entra em paralelo com a carga, nunca em série, e deve ser desligado junto com ela — capacitor sobrando em rede leve eleva a tensão.',
      calcular: function (p, ctx) {
        var w = 2 * Math.PI * p.f, L = p.L / 1000;
        var XL = CE.xl(p.f, L);
        var Z = CE.cx(p.R, XL);
        var r = CE.potencias(p.V, Z);
        var fp2 = Math.min(0.9999, Math.max(r.fp, p.fp2));
        var c = CE.correcaoFP(r.P, r.fp, fp2, p.V, p.f);
        var S2 = r.P / fp2, I2 = S2 / p.V;

        /* ---- fasores ---- */
        var g = ctx.plot('fas').clear();
        var esc = p.V / Math.max(r.I, 1e-9) * 0.55;        /* escala para a corrente caber junto da tensão */
        var ix = r.I * Math.cos(-r.theta) * esc, iy = r.I * Math.sin(-r.theta) * esc;
        var icx = 0, icy = c.Qc / p.V * esc;                /* corrente do capacitor: +90° */
        g.line([0, p.V], [0, 0], { color: cor(0), width: 3, label: 'V = ' + nt(p.V, 4) + ' V' });
        g.line([0, ix], [0, iy], { color: cor(1), width: 3, label: 'I da carga = ' + nt(r.I, 4) + ' A' });
        if (c.Qc > 1e-6) {
          g.line([ix, ix + icx], [iy, iy + icy], { color: cor(2), width: 2, dash: [6, 4], label: 'I do capacitor' });
          g.line([0, ix + icx], [0, iy + icy], { color: cor(3), width: 3, label: 'I da rede = ' + nt(I2, 4) + ' A' });
        }
        g.line([0, p.V * 1.05], [0, 0], { color: cor(5), width: 1, dash: [4, 4] });
        g.text(p.V, 0, 'V', { align: 'right', baseline: 'bottom', dx: -4, dy: -5, size: 12, weight: '600' });
        g.text(ix, iy, nt(-r.thetaGrau, 3) + '°', { align: 'left', baseline: 'top', dx: 6, dy: 6, size: 11 });
        g.setLimits([-0.1 * p.V, 1.15 * p.V], [-0.75 * p.V, 0.45 * p.V]);
        g.draw();

        /* ---- triângulo de potências ---- */
        var g2 = ctx.plot('tri').clear();
        var P = r.P / 1000, Q = r.Q / 1000, Qc = c.Qc / 1000;
        g2.line([0, P, P, 0], [0, 0, Q, 0], { color: cor(1), width: 2.4, label: 'carga: S = ' + nt(r.S / 1000, 4) + ' kVA' });
        if (Qc > 1e-6) {
          g2.line([0, P, P, 0], [0, 0, Q - Qc, 0], { color: cor(3), width: 2.4, dash: [7, 4], label: 'corrigida: S = ' + nt(S2 / 1000, 4) + ' kVA' });
          g2.line([P, P], [Q, Q - Qc], { color: cor(2), width: 3, label: 'capacitor: ' + nt(Qc, 4) + ' kvar' });
        }
        g2.marker(P, Q, 'θ₁ = ' + nt(r.thetaGrau, 3) + '°', { color: cor(1) });
        if (Qc > 1e-6) g2.marker(P, Q - Qc, 'θ₂ = ' + nt(Math.acos(fp2) * 180 / Math.PI, 3) + '°', { color: cor(3) });
        g2.text(P / 2, 0, 'P = ' + nt(P, 4) + ' kW', { align: 'center', baseline: 'top', dy: 14, size: 11 });
        g2.draw();

        /* ---- formas de onda ---- */
        var g3 = ctx.plot('temp').clear();
        var T = 1 / p.f, ts = [], vv = [], ii = [], pp = [], Vp = p.V * Math.SQRT2, Ip = r.I * Math.SQRT2;
        for (var k = 0; k <= 300; k++) {
          var t = 2 * T * k / 300;
          ts.push(t * 1000);
          var v = Vp * Math.sin(w * t), i = Ip * Math.sin(w * t - r.theta);
          vv.push(v / Vp); ii.push(i / Ip); pp.push(v * i / (Vp * Ip));
        }
        g3.line(ts, vv, { color: cor(0), width: 2, label: 'v(t)' });
        g3.line(ts, ii, { color: cor(1), width: 2, dash: [6, 4], label: 'i(t)' });
        g3.area(ts, pp, { color: cor(2), base: 0, alpha: 0.18, label: 'p(t) = v·i' });
        g3.hline(0, { color: cor(5), width: 1 });
        g3.hline(r.fp / 2, { color: cor(3), width: 1.2, text: 'média = FP/2' });
        g3.draw();

        ctx.setPassos([
          { t: '① Da indutância à reatância',
            tex: 'X_L = 2\\pi fL = 2\\pi \\times ' + nTex(p.f) + ' \\times ' + nTex(L, 4) + ' = ' + nTex(XL, 5) + '\\ \\Omega',
            obs: 'Reatância tem unidade de ohm, mas não dissipa: ela só empurra a corrente para trás no tempo. '
              + 'E cresce com a frequência — a mesma bobina que oferece ' + nt(XL, 4) + ' Ω a ' + nt(p.f, 3) + ' Hz ofereceria '
              + nt(CE.xl(2 * p.f, L), 4) + ' Ω ao dobro da frequência.' },
          { t: '② A impedância e a corrente',
            tex: '|\\mathbf{Z}| = \\sqrt{' + nTex(p.R) + '^2 + ' + nTex(XL, 4) + '^2} = ' + nTex(r.Zmod, 5) + '\\ \\Omega '
              + '\\qquad \\theta = ' + nTex(r.thetaGrau, 4) + '^\\circ',
            texSub: 'I = \\frac{' + nTex(p.V) + '}{' + nTex(r.Zmod, 5) + '} = ' + nTex(r.I, 5) + '\\ \\text{A}',
            obs: 'A corrente está atrasada ' + nt(r.thetaGrau, 4) + '° em relação à tensão, o que no tempo equivale a '
              + nt(r.thetaGrau / 360 / p.f * 1000, 4) + ' ms. Note que V_R = ' + nt(r.I * p.R, 4) + ' V e V_L = ' + nt(r.I * XL, 4)
              + ' V somam ' + nt(r.I * p.R + r.I * XL, 4) + ' V na aritmética comum — e exatamente ' + nt(p.V, 4) + ' V na soma fasorial.' },
          { t: '③ O triângulo de potências',
            tex: 'P = VI\\cos\\theta = ' + nTex(r.P, 5) + '\\ \\text{W} \\qquad Q = VI\\sin\\theta = ' + nTex(r.Q, 5) + '\\ \\text{var}',
            texSub: 'S = VI = ' + nTex(r.S, 5) + '\\ \\text{VA} \\qquad \\text{FP} = ' + nTex(r.fp, 4),
            obs: 'Só P faz trabalho e aparece na conta de energia. Q vai e volta duas vezes por ciclo, não é consumida — mas é transportada, '
              + 'e é por isso que ela custa condutor, transformador e perda. A concessionária cobra pelo FP abaixo de 0,92 justamente por isso.' },
          { t: '④ Dimensionar o capacitor',
            tex: 'Q_C = P(\\tan\\theta_1-\\tan\\theta_2) = ' + nTex(r.P, 5) + '(' + nTex(c.tg1, 4) + ' - ' + nTex(c.tg2, 4) + ') = ' + nTex(c.Qc, 5) + '\\ \\text{var}',
            texSub: 'C = \\frac{' + nTex(c.Qc, 5) + '}{2\\pi \\times ' + nTex(p.f) + ' \\times ' + nTex(p.V) + '^2} = ' + nTex(c.C * 1e6, 5) + '\\ \\mu\\text{F}',
            obs: c.Qc > 1e-6
              ? 'São ' + nt(c.C * 1e6, 4) + ' µF em paralelo com a carga para levar o fator de potência de ' + nt(r.fp, 4) + ' a ' + nt(fp2, 4) + '. '
              + 'Em 380 V o mesmo kvar exigiria menos capacitância, porque Q_C cresce com o quadrado da tensão.'
              : 'A carga já está com fator de potência igual ou melhor que o alvo: não há nada a corrigir.' },
          { t: '⑤ O que muda e o que não muda',
            texSub: 'I: ' + nTex(r.I, 4) + ' \\to ' + nTex(I2, 4) + '\\ \\text{A} \\qquad P: ' + nTex(r.P, 5) + ' \\to ' + nTex(r.P, 5) + '\\ \\text{W}',
            obs: 'A corrente cai ' + nt(100 * (1 - I2 / Math.max(r.I, 1e-9)), 3) + ' % e as perdas na linha, que vão com i², caem '
              + nt(100 * (1 - Math.pow(I2 / Math.max(r.I, 1e-9), 2)), 3) + ' %. A potência ativa e o kWh faturado são os mesmos: '
              + 'o capacitor não economiza energia, economiza corrente.' }
        ]);

        return {
          xl: { v: sg(XL, 4), u: 'Ω' },
          z: { v: sg(r.Zmod, 4), u: 'Ω' },
          th: { v: sg(r.thetaGrau, 4), u: '°' },
          i: { v: sg(r.I, 4), u: 'A' },
          p: { v: sg(r.P / 1000, 4), u: 'kW' },
          q: { v: sg(r.Q / 1000, 4), u: 'kvar' },
          s: { v: sg(r.S / 1000, 4), u: 'kVA' },
          fp: { v: sg(r.fp, 4), u: '', classe: r.fp < 0.92 ? 'alerta' : 'ok' },
          cap: { v: sg(c.C * 1e6, 4), u: 'µF' },
          inova: { v: sg(I2, 4), u: 'A' },
          red: { v: sg(100 * (1 - I2 / Math.max(r.I, 1e-9)), 3), u: '%' },
          perdas: { v: sg(100 * (1 - Math.pow(I2 / Math.max(r.I, 1e-9), 2)), 3), u: '%' }
        };
      }
    });
  }

  function iniciar() {
    montarResistivo();
    montarNos();
    montarThevenin();
    montarTransitorio();
    montarFasores();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

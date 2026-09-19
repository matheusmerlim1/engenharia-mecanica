/* Elementos de Máquinas II — modelos (engrenagens, molas, freios) e simuladores */
/* ==========================================================================
   Elementos de Máquinas II — modelos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · Engrenamento   dentes retos com perfil evolvente: raios primitivo, de base,
                      de adendo; razão de contato; número mínimo de dentes sem
                      interferência (AGMA / Shigley eq. 13-11 e 13-10)
     · Trens          simples, compostos e planetários (fórmula de Willis)
     · AGMA           convenção do Norton: σ_b = Wt Ka Km Ks KB KI /(F m J Kv),
                      σ_c = Cp √(Wt Ca Cm Cs Cf /(F I d Cv)); resistências
                      AGMA 2001 para aço grau 1 (Shigley tab. 14-2/14-5)
     · Lewis          fator de forma Y (Shigley tab. 14-2, 20°, profundidade completa)
     · Molas          helicoidais de compressão: Bergsträsser, Sut = A d^m
                      (Shigley tab. 10-4), fadiga de Zimmerli com Goodman
     · Freios         embreagem de disco (pressão e desgaste uniformes), freio de
                      cinta (e^{fθ}) e energia dissipada
   ========================================================================== */
(function (global) {
  'use strict';
  var EM2 = {};
  var rad = function (g) { return g * Math.PI / 180; };

  /* involuta: inv(φ) = tan φ − φ */
  EM2.inv = function (phi) { return Math.tan(phi) - phi; };

  /* ---------------------------------------------------------------
     Geometria de um par de dentes retos (sistema métrico, módulo m em mm)
     --------------------------------------------------------------- */
  EM2.par = function (p) {
    var phi = rad(p.phi), m = p.m, k = p.k || 1;              /* k = 1: profundidade completa */
    var rp = m * p.Np / 2, rg = m * p.Ng / 2;
    var rbp = rp * Math.cos(phi), rbg = rg * Math.cos(phi);
    var a = k * m, b = 1.25 * m;
    var rap = rp + a, rag = rg + a, rdp = rp - b, rdg = rg - b;
    var C = rp + rg;
    var pc = Math.PI * m, pb = pc * Math.cos(phi);
    var Z = Math.sqrt(rap * rap - rbp * rbp) + Math.sqrt(rag * rag - rbg * rbg) - C * Math.sin(phi);
    var mG = p.Ng / p.Np;
    var s2 = Math.pow(Math.sin(phi), 2);
    var NpMin = 2 * k / ((1 + 2 * mG) * s2) * (mG + Math.sqrt(mG * mG + (1 + 2 * mG) * s2));
    var NrackMin = 2 * k / s2;
    /* maior coroa que ainda não interfere com o pinhão dado */
    var NgMax = (p.Np * p.Np * s2 - 4 * k * k) / (4 * k - 2 * p.Np * s2);
    /* interferência real: o ponto de tangência (fim da linha de ação no lado do pinhão)
       fica dentro do adendo da coroa? */
    var rMaxG = Math.sqrt(rbg * rbg + C * C * s2);              /* raio da coroa no ponto de interferência */
    var rMaxP = Math.sqrt(rbp * rbp + C * C * s2);
    var interfere = rag > rMaxG + 1e-9 || rap > rMaxP + 1e-9;
    return { phi: phi, rp: rp, rg: rg, rbp: rbp, rbg: rbg, rap: rap, rag: rag, rdp: rdp, rdg: rdg, a: a, b: b,
             C: C, pc: pc, pb: pb, Z: Z, mc: Z / pb, mG: mG, NpMin: NpMin, NrackMin: NrackMin,
             NgMax: NgMax > 0 ? NgMax : Infinity, interfere: interfere, rMaxG: rMaxG, rMaxP: rMaxP };
  };

  /* ---------------------------------------------------------------
     Trens de engrenagens
     tipo 'simples': N[] em série (engrenagens intermediárias só invertem)
     tipo 'composto': pares [N motora, N movida][]
     tipo 'planetario': Ns (sol), Nr (anel), fixo 'anel'|'sol'|'braco', entrada 'sol'|'anel'|'braco'
     --------------------------------------------------------------- */
  EM2.trem = function (p) {
    if (p.tipo === 'simples') {
      var N = p.N, e = (N.length % 2 === 0 ? -1 : 1) * N[0] / N[N.length - 1];
      /* sinal: engrenagens externas em série invertem o sentido a cada contato */
      return { e: e, wSaida: p.w * e, detalhes: N };
    }
    if (p.tipo === 'composto') {
      var e2 = 1, sinal = 1;
      p.pares.forEach(function (q) { e2 *= q[0] / q[1]; sinal *= -1; });
      return { e: sinal * e2, wSaida: p.w * sinal * e2 };
    }
    /* planetário: Np = (Nr − Ns)/2; valor de trem com braço fixo e = −Ns/Nr (sol → anel) */
    var Np = (p.Nr - p.Ns) / 2;
    var eSR = -p.Ns / p.Nr;                               /* (ωR − ωA)/(ωS − ωA) = −Ns/Nr */
    var w = { sol: null, anel: null, braco: null };
    w[p.fixo] = 0;
    w[p.entrada] = p.w;
    /* resolve a incógnita restante pela fórmula de Willis */
    var livre = ['sol', 'anel', 'braco'].filter(function (k) { return w[k] === null; })[0];
    if (livre === 'braco') {                               /* ωR − ωA = eSR (ωS − ωA) */
      w.braco = (w.anel - eSR * w.sol) / (1 - eSR);
    } else if (livre === 'anel') {
      w.anel = w.braco + eSR * (w.sol - w.braco);
    } else {
      w.sol = w.braco + (w.anel - w.braco) / eSR;
    }
    /* velocidade absoluta do planeta: (ωP − ωA)/(ωS − ωA) = −Ns/Np */
    var wPlaneta = w.braco + (-p.Ns / Np) * (w.sol - w.braco);
    return { Np: Np, w: w, wPlaneta: wPlaneta, eSR: eSR, livre: livre };
  };

  /* ---------------------------------------------------------------
     Lewis e AGMA (convenção do Norton, SI)
     --------------------------------------------------------------- */
  var LEWIS_Y = [[12, 0.245], [13, 0.261], [14, 0.277], [15, 0.290], [16, 0.296], [17, 0.303], [18, 0.309], [19, 0.314],
                 [20, 0.322], [21, 0.328], [22, 0.331], [24, 0.337], [26, 0.346], [28, 0.353], [30, 0.359], [34, 0.371],
                 [38, 0.384], [43, 0.397], [50, 0.409], [60, 0.422], [75, 0.435], [100, 0.447], [150, 0.460], [300, 0.472],
                 [400, 0.480], [100000, 0.485]];
  EM2.lewisY = function (N) {
    var t = LEWIS_Y;
    if (N <= t[0][0]) return t[0][1];
    for (var i = 0; i < t.length - 1; i++)
      if (N <= t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * (N - t[i][0]) / (t[i + 1][0] - t[i][0]);
    return t[t.length - 1][1];
  };
  /* fator dinâmico AGMA (Norton): Kv = [A/(A + √(200 V))]^B, V em m/s */
  EM2.Kv = function (Qv, V) {
    var B = Math.pow(12 - Qv, 2 / 3) / 4, A = 50 + 56 * (1 - B);
    return { Kv: Math.pow(A / (A + Math.sqrt(200 * V)), B), A: A, B: B, Vmax: Math.pow(A + Qv - 3, 2) / 200 };
  };
  /* fator de distribuição de carga pela largura de face (Norton tab. 12-16) */
  EM2.Km = function (Fmm) {
    var t = [[0, 1.6], [50, 1.6], [150, 1.7], [250, 1.8], [500, 2.0]];
    for (var i = 0; i < t.length - 1; i++)
      if (Fmm <= t[i + 1][0]) return t[i][1] + (t[i + 1][1] - t[i][1]) * (Fmm - t[i][0]) / (t[i + 1][0] - t[i][0]);
    return 2.0;
  };
  EM2.KB = function (mB) { return mB >= 1.2 ? 1 : Math.max(1, -2 * mB + 3.4); };

  EM2.agma = function (p) {
    var g = EM2.par(p);
    var dp = 2 * g.rp / 1000, dg = 2 * g.rg / 1000;          /* m */
    var w = p.rpm * 2 * Math.PI / 60;
    var V = w * dp / 2;
    var Wt = p.Wt !== undefined ? p.Wt : p.P * 1000 / V;     /* N */
    var P = Wt * V / 1000;                                    /* kW */
    var T = Wt * dp / 2;                                      /* N·m no pinhão */
    var Wr = Wt * Math.tan(g.phi), W = Wt / Math.cos(g.phi);
    var kv = EM2.Kv(p.Qv, V);
    var Km = EM2.Km(p.F), KB = EM2.KB(p.mB);
    var J = EM2.fatorJ(p.phi, p.Np, p.Ng);
    var Yp = EM2.lewisY(p.Np), Yg = EM2.lewisY(p.Ng);
    var Jp = J ? J.Jp : Yp, Jg = J ? J.Jg : Yg;               /* fora da tabela: usa Lewis e avisa */
    var base = Wt / (p.F * p.m) * p.Ka * Km / kv.Kv * p.Ks * KB;   /* MPa: N/(mm·mm) */
    var sbp = base / Jp;
    var sbg = base / Jg * (p.KIg || 1);
    var sLewis = Wt / (p.F * p.m * Yp);
    var fI = EM2.fatorI(g, p.m);
    var Cp = p.Cp || EM2.Cp(p.matP || 'aco', p.matG || 'aco');
    var sc = Cp * Math.sqrt(Wt / (p.F * fI.I * dp * 1000) * p.Ka * Km / kv.Kv * p.Ks);
    /* resistências AGMA 2001, aço grau 1 endurecido, em MPa */
    var St = 0.533 * p.HB + 88.3, Sc = 2.22 * p.HB + 200;
    var ciclos = p.vida * 60 * p.rpm;                         /* ciclos do pinhão */
    var ciclosG = ciclos / g.mG;
    var YN = function (n) { return n > 3e6 ? 1.3558 * Math.pow(n, -0.0178) : 1; };
    var ZN = function (n) { return n > 1e7 ? 1.4488 * Math.pow(n, -0.023) : 1; };
    var KR = { '0.9': 0.85, '0.99': 1.0, '0.999': 1.25, '0.9999': 1.5 }[String(p.conf)] || 1;
    var Sfbp = St * YN(ciclos) / KR, Sfbg = St * YN(ciclosG) / KR;
    var Sfcp = Sc * ZN(ciclos) / KR, Sfcg = Sc * ZN(ciclosG) / KR;
    return { g: g, dp: dp, dg: dg, V: V, T: T, P: P, Wt: Wt, Wr: Wr, W: W, kv: kv, Km: Km, KB: KB,
             J: J, Jp: Jp, Jg: Jg, Yp: Yp, Yg: Yg, sbp: sbp, sbg: sbg, sLewis: sLewis, fI: fI, I: fI.I, Cp: Cp, sc: sc,
             St: St, Sc: Sc, ciclos: ciclos, ciclosG: ciclosG, YNp: YN(ciclos), YNg: YN(ciclosG), ZNp: ZN(ciclos), ZNg: ZN(ciclosG), KR: KR,
             Sfbp: Sfbp, Sfbg: Sfbg, Sfcp: Sfcp, Sfcg: Sfcg,
             nbp: Sfbp / sbp, nbg: Sfbg / sbg, ncp: Math.pow(Sfcp / sc, 2), ncg: Math.pow(Sfcg / sc, 2),
             Fmin: 8 * p.m, Fmax: 16 * p.m };
  };

  /* ---------------------------------------------------------------
     Fator geométrico J (AGMA, carga no HPSTC, profundidade completa)
     Norton, tabelas 11-9 (20°) e 11-13 (25°). null = dente com adelgaçamento (U)
     --------------------------------------------------------------- */
  var J_DENTES = [12, 14, 17, 21, 26, 35, 55, 135];
  var U = null;
  /* J_TAB[phi][linha = dentes da coroa][coluna = dentes do pinhão] = [J pinhão, J coroa] */
  var J_TAB = {
    20: [
      [[U, U]],
      [[U, U], [U, U]],
      [[U, U], [U, U], [U, U]],
      [[U, U], [U, U], [U, U], [0.33, 0.33]],
      [[U, U], [U, U], [U, U], [0.33, 0.35], [0.35, 0.35]],
      [[U, U], [U, U], [U, U], [0.34, 0.37], [0.36, 0.38], [0.39, 0.39]],
      [[U, U], [U, U], [U, U], [0.34, 0.40], [0.37, 0.41], [0.40, 0.42], [0.43, 0.43]],
      [[U, U], [U, U], [U, U], [0.35, 0.43], [0.38, 0.44], [0.41, 0.45], [0.45, 0.47], [0.49, 0.49]]
    ],
    25: [
      [[U, U]],
      [[U, U], [0.33, 0.33]],
      [[U, U], [0.33, 0.36], [0.36, 0.36]],
      [[U, U], [0.33, 0.39], [0.36, 0.39], [0.39, 0.39]],
      [[U, U], [0.33, 0.41], [0.37, 0.42], [0.40, 0.42], [0.43, 0.43]],
      [[U, U], [0.34, 0.44], [0.37, 0.45], [0.40, 0.45], [0.43, 0.46], [0.46, 0.46]],
      [[U, U], [0.34, 0.47], [0.38, 0.48], [0.41, 0.49], [0.44, 0.49], [0.47, 0.50], [0.51, 0.51]],
      [[U, U], [0.35, 0.51], [0.38, 0.52], [0.42, 0.53], [0.45, 0.53], [0.48, 0.54], [0.53, 0.56], [0.57, 0.57]]
    ]
  };
  function posTab(N) {
    var t = J_DENTES;
    if (N <= t[0]) return 0;
    for (var i = 0; i < t.length - 1; i++) if (N <= t[i + 1]) return i + (N - t[i]) / (t[i + 1] - t[i]);
    return t.length - 1;
  }
  /* interpolação bilinear; devolve null se qualquer vizinho for U */
  EM2.fatorJ = function (phiGraus, Np, Ng) {
    var T = J_TAB[phiGraus];
    if (!T) return null;
    var a = Math.min(Np, Ng), b = Math.max(Np, Ng);
    var c = posTab(a), l = posTab(b);
    if (Np < J_DENTES[0] || c > l) return null;
    var c0 = Math.floor(c), c1 = Math.min(c0 + 1, J_DENTES.length - 1), fc = c - c0;
    var l0 = Math.floor(l), l1 = Math.min(l0 + 1, J_DENTES.length - 1), fl = l - l0;
    function val(li, ci, k) {
      if (ci > li) ci = li;                 /* acima da diagonal usa o par igual */
      var v = T[li][ci]; return v ? v[k] : null;
    }
    function bil(k) {
      var v00 = val(l0, c0, k), v01 = val(l0, c1, k), v10 = val(l1, c0, k), v11 = val(l1, c1, k);
      if (fc === 0) { v01 = v00; v11 = v10; }
      if (fl === 0) { v10 = v00; v11 = v01; }
      if (v00 === null || v01 === null || v10 === null || v11 === null) return null;
      return (v00 * (1 - fc) + v01 * fc) * (1 - fl) + (v10 * (1 - fc) + v11 * fc) * fl;
    }
    var jp = bil(0), jg = bil(1);
    return jp === null || jg === null ? null : { Jp: jp, Jg: jg };
  };
  /* coeficiente elástico Cp (MPa^0,5), Norton tab. 11-18: pinhão × coroa */
  EM2.CP_MAT = { aco: 'Aço', fm: 'Ferro maleável', fn: 'Ferro nodular', ff: 'Ferro fundido', ba: 'Bronze-alumínio', bs: 'Bronze-estanho' };
  var CP_ORD = ['aco', 'fm', 'fn', 'ff', 'ba', 'bs'];
  var CP_TAB = [[191, 181, 179, 174, 162, 158], [181, 174, 172, 168, 158, 154], [179, 172, 170, 166, 156, 152],
                [174, 168, 166, 163, 154, 149], [162, 158, 156, 154, 145, 141], [158, 154, 152, 149, 141, 137]];
  EM2.Cp = function (mp, mg) { return CP_TAB[CP_ORD.indexOf(mp)][CP_ORD.indexOf(mg)]; };
  /* fator geométrico de superfície I (Norton eq. 11-22, engrenagens externas, adendo padrão) */
  EM2.fatorI = function (g, m) {
    var rhoP = Math.sqrt(Math.pow(g.rp + m, 2) - Math.pow(g.rp * Math.cos(g.phi), 2)) - Math.PI * m * Math.cos(g.phi);
    var rhoG = g.C * Math.sin(g.phi) - rhoP;
    return { I: Math.cos(g.phi) / ((1 / rhoP + 1 / rhoG) * 2 * g.rp), rhoP: rhoP, rhoG: rhoG,
             Ishigley: Math.cos(g.phi) * Math.sin(g.phi) / 2 * g.mG / (g.mG + 1) };
  };

  /* ---------------------------------------------------------------
     Forças num trem pinhão → intermediária → coroa (Shigley ex. 13-7)
     beta: ângulo entre as linhas de centro 2-3 e 3-4, medido no centro de 3
     --------------------------------------------------------------- */
  EM2.forcasIntermediaria = function (p) {
    var phi = rad(p.phi);
    var d2 = p.m * p.N2 / 1000, d3 = p.m * p.N3 / 1000;
    var w2 = p.rpm * 2 * Math.PI / 60, V = w2 * d2 / 2;
    var Wt = p.P * 1000 / V, Wr = Wt * Math.tan(phi);
    /* centro 3 na origem; centro 2 na direção a2, centro 4 na direção a4 (radianos) */
    var a2 = rad(p.ang2), a4 = a2 + rad(p.beta);
    var u2 = [Math.cos(a2), Math.sin(a2)], u4 = [Math.cos(a4), Math.sin(a4)];
    /* pinhão gira no sentido s2 (+1 anti-horário); a intermediária gira ao contrário */
    var s3 = -p.sentido;
    /* força de 2 sobre 3: radial aponta para o centro de 3 (−u2); tangencial move o dente de 3 no sentido de rotação de 3 */
    var t2 = [-u2[1] * s3, u2[0] * s3];
    var F23 = [-u2[0] * Wr + t2[0] * Wt, -u2[1] * Wr + t2[1] * Wt];
    /* força de 4 sobre 3: radial para o centro de 3 (−u4); tangencial resiste ao giro de 3 */
    var t4 = [u4[1] * s3, -u4[0] * s3];
    var F43 = [-u4[0] * Wr + t4[0] * Wt, -u4[1] * Wr + t4[1] * Wt];
    var Fb = [-(F23[0] + F43[0]), -(F23[1] + F43[1])];
    return { d2: d2, d3: d3, V: V, Wt: Wt, Wr: Wr, W: Wt / Math.cos(phi), T2: Wt * d2 / 2, T3: 0,
             F23: F23, F43: F43, Fb: Fb, FbMod: Math.hypot(Fb[0], Fb[1]), u2: u2, u4: u4,
             rpm3: -p.rpm * p.N2 / p.N3 * 1, rpm4: p.rpm * p.N2 / p.N4 };
  };

  /* ---------------------------------------------------------------
     Molas helicoidais de compressão
     p: d (mm), D (mm, diâmetro médio), Na, material, Fmin, Fmax (N), extremidades
     --------------------------------------------------------------- */
  EM2.MATERIAIS_MOLA = {
    A228: { nome: 'Corda de piano (ASTM A228)', A: 2211, b: 0.145, G: 81.7, E: 203.4, ssy: 0.45, rho: 7850 },
    A229: { nome: 'Temperado em óleo (ASTM A229)', A: 1855, b: 0.187, G: 77.2, E: 196.5, ssy: 0.50, rho: 7850 },
    A227: { nome: 'Estirado a frio (ASTM A227)', A: 1783, b: 0.190, G: 80.0, E: 197.2, ssy: 0.45, rho: 7850 },
    A232: { nome: 'Cromo-vanádio (ASTM A232)', A: 2005, b: 0.168, G: 77.2, E: 203.4, ssy: 0.50, rho: 7850 },
    A401: { nome: 'Cromo-silício (ASTM A401)', A: 1974, b: 0.108, G: 77.2, E: 203.4, ssy: 0.50, rho: 7850 },
    A313: { nome: 'Inox 302 (ASTM A313)', A: 1867, b: 0.146, G: 69.0, E: 193, ssy: 0.35, rho: 7920 }
  };
  EM2.mola = function (p) {
    var mt = EM2.MATERIAIS_MOLA[p.material];
    var C = p.D / p.d;
    var KB = (4 * C + 2) / (4 * C - 3);
    var Ks = 1 + 0.5 / C;
    var k = Math.pow(p.d, 4) * mt.G * 1000 / (8 * Math.pow(p.D, 3) * p.Na);     /* N/mm */
    var Sut = mt.A / Math.pow(p.d, mt.b);                                        /* MPa */
    var Ssy = mt.ssy * Sut, Ssu = 0.67 * Sut;
    var tau = function (F) { return KB * 8 * F * p.D / (Math.PI * Math.pow(p.d, 3)); };
    var tMax = tau(p.Fmax), tMin = tau(p.Fmin);
    var ta = (tMax - tMin) / 2, tm = (tMax + tMin) / 2;
    /* Zimmerli, sem jateamento: Ssa = 241, Ssm = 379 MPa → limite de Goodman com Ssu */
    var Ssa = 241, Ssm = 379;
    var Sse = Ssa / (1 - Ssm / Ssu);
    var nf = 1 / (ta / Sse + tm / Ssu);
    var nEst = Ssy / tMax;
    var Nt = p.Na + 2;                                    /* extremidades esquadradas e retificadas */
    var Ls = Nt * p.d;
    var yMax = p.Fmax / k;
    var folga = 0.15 * yMax;                               /* 15 % de folga até fechar */
    var L0 = Ls + yMax + folga;
    var ySolido = L0 - Ls, tSolido = tau(k * ySolido);
    /* estabilidade (Shigley): extremidades planas paralelas → α = 0,5; L0 < 2,63 D/α */
    var LcritFlamb = 2.63 * p.D / 0.5;
    var massa = Math.PI * Math.PI * p.d * p.d * p.D * p.Na * mt.rho / 4 / 1e9;   /* kg */
    var fn = 0.5 * Math.sqrt(k * 1000 / massa);           /* Hz, extremidades fixas entre placas */
    return { mt: mt, C: C, KB: KB, Ks: Ks, k: k, Sut: Sut, Ssy: Ssy, Ssu: Ssu, tMax: tMax, tMin: tMin, ta: ta, tm: tm,
             Sse: Sse, nf: nf, nEst: nEst, Nt: Nt, Ls: Ls, L0: L0, yMax: yMax, yMin: p.Fmin / k, tSolido: tSolido,
             nSolido: Ssy / tSolido, LcritFlamb: LcritFlamb, flamba: L0 > LcritFlamb, massa: massa, fn: fn,
             Cruim: C < 4 || C > 12 };
  };

  /* ---------------------------------------------------------------
     Embreagem de disco (N superfícies de atrito)
     p: ro, ri (mm), f, pmax (MPa) ou F (N), N, modelo 'desgaste'|'pressao'
     --------------------------------------------------------------- */
  EM2.embreagem = function (p) {
    var ro = p.ro / 1000, ri = p.ri / 1000, pmax = p.pmax * 1e6;
    var F, T;
    if (p.modelo === 'desgaste') {
      F = 2 * Math.PI * pmax * ri * (ro - ri);
      T = p.N * p.f * F * (ro + ri) / 2;
    } else {
      F = Math.PI * pmax * (ro * ro - ri * ri);
      T = p.N * p.f * F * 2 * (Math.pow(ro, 3) - Math.pow(ri, 3)) / (3 * (ro * ro - ri * ri));
    }
    /* com a mesma força, o modelo de desgaste uniforme dá torque menor (conservador) */
    var Tw = p.N * p.f * F * (ro + ri) / 2;
    var Tp = p.N * p.f * F * 2 * (Math.pow(ro, 3) - Math.pow(ri, 3)) / (3 * (ro * ro - ri * ri));
    return { F: F, T: T, Tw: Tw, Tp: Tp, riOtimo: p.ro / Math.sqrt(3) };
  };
  /* energia de uma frenagem e aquecimento */
  EM2.frenagem = function (p) {
    var w1 = p.rpm1 * 2 * Math.PI / 60, w2 = p.rpm2 * 2 * Math.PI / 60;
    var E = 0.5 * p.I * (w1 * w1 - w2 * w2);                 /* J */
    var t = p.I * (w1 - w2) / p.T;                           /* s, torque constante */
    var dT = E / (p.m * p.c);
    return { E: E, t: t, dT: dT, P: E / t };
  };
  /* freio de cinta: P1/P2 = e^{fθ}, T = (P1 − P2) r, p_max = P1/(b r) */
  EM2.cinta = function (p) {
    var th = rad(p.theta), r = p.D / 2000;
    var razao = Math.exp(p.f * th);
    var P1 = p.P1, P2 = P1 / razao;
    return { razao: razao, P1: P1, P2: P2, T: (P1 - P2) * r, pmax: P1 / (p.b / 1000 * r) / 1e6 };
  };

  global.EM2 = EM2;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Simuladores de Elementos de Máquinas II
     1. sim-engrenamento : par de dentes retos em evolvente, linha de ação
     2. sim-trens        : trens compostos e planetários
     3. sim-intermediaria: forças num trem com engrenagem intermediária
     4. sim-agma         : tensões de flexão e de contato (AGMA)
     5. sim-mola         : mola helicoidal de compressão, fadiga
     6. sim-freio        : embreagem de disco e freio de cinta
   ========================================================================== */
(function () {
  'use strict';
  var EM2 = window.EM2;
  var TAU = Math.PI * 2;

  var quadros = [];
  function registrar(fn) { quadros.push(fn); }
  (function laco() {
    for (var i = 0; i < quadros.length; i++) {
      try { quadros[i](); } catch (e) { /* um modelo com erro não trava os outros */ }
    }
    requestAnimationFrame(laco);
  })();
  function relogio() {
    return { t: 0, dt: function () {
      var agora = performance.now();
      var d = this.t ? (agora - this.t) / 1000 : 0.016;
      this.t = agora;
      return (d > 0.2 || d <= 0) ? 0.016 : d;
    } };
  }
  function fonte(px, peso) {
    return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif');
  }
  function seta(c, x1, y1, x2, y2, cor, larg, cabeca) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1.5) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(10, L * 0.45);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
    c.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
    c.closePath(); c.fill();
  }
  function rotulo(c, txt, x, y, cor, px, peso, alinh, base) {
    c.font = fonte(px || 11, peso); c.fillStyle = cor;
    c.textAlign = alinh || 'center'; c.textBaseline = base || 'middle';
    c.fillText(txt, x, y);
  }
  /* seta curva indicando o sentido de rotação */
  function giro(c, x, y, r, sentido, cor) {
    var a0 = -2.4, a1 = -0.9;
    c.strokeStyle = cor; c.lineWidth = 1.8; c.setLineDash([]);
    c.beginPath(); c.arc(x, y, r, a0, a1, false); c.stroke();
    var fim = sentido > 0 ? a0 : a1, tg = sentido > 0 ? -1 : 1;
    var px = x + r * Math.cos(fim), py = y + r * Math.sin(fim);
    var tx = -Math.sin(fim) * tg, ty = Math.cos(fim) * tg;
    c.fillStyle = cor; c.beginPath();
    c.moveTo(px + tx * 8, py + ty * 8);
    c.lineTo(px - ty * 4.5, py + tx * 4.5);
    c.lineTo(px + ty * 4.5, py - tx * 4.5);
    c.closePath(); c.fill();
  }
  var nt = function (v, n) { return Plot.numTex(v, n); };
  var sg = function (v, n) { return Plot.sig(v, n); };

  /* ---------- perfil de uma engrenagem de dentes retos (coordenadas em mm) ----------
     Flanco em evolvente acima do círculo de base; abaixo dele, flanco radial até o pé.
     ψ(r) = π/(2N) + inv φ − inv α_r é o meio-ângulo do dente no raio r. */
  var cachePerfil = {};
  function perfil(N, m, phiGraus) {
    var chave = N + '|' + m + '|' + phiGraus;
    if (cachePerfil[chave]) return cachePerfil[chave];
    var phi = phiGraus * Math.PI / 180;
    var rp = m * N / 2, rb = rp * Math.cos(phi), ra = rp + m, rd = Math.max(rp - 1.25 * m, 0.3 * rp);
    var invPhi = EM2.inv(phi);
    var meio = function (r) {
      if (r <= rb) return Math.PI / (2 * N) + invPhi;
      return Math.PI / (2 * N) + invPhi - EM2.inv(Math.acos(rb / r));
    };
    var flanco = [], n = 10, r0 = Math.max(rb, rd), i;
    for (i = 0; i <= n; i++) {
      var r = r0 + (ra - r0) * i / n;
      flanco.push([r, meio(r)]);
    }
    var pts = [], passo = TAU / N;
    for (var k = 0; k < N; k++) {
      var c0 = k * passo;
      /* pé à esquerda do dente → subida pelo flanco inferior → topo → descida pelo flanco superior */
      var aPe = meio(r0);
      pts.push([rd * Math.cos(c0 - aPe), rd * Math.sin(c0 - aPe)]);
      for (i = 0; i < flanco.length; i++) {
        var q = flanco[i];
        pts.push([q[0] * Math.cos(c0 - q[1]), q[0] * Math.sin(c0 - q[1])]);
      }
      for (i = flanco.length - 1; i >= 0; i--) {
        var q2 = flanco[i];
        pts.push([q2[0] * Math.cos(c0 + q2[1]), q2[0] * Math.sin(c0 + q2[1])]);
      }
      pts.push([rd * Math.cos(c0 + aPe), rd * Math.sin(c0 + aPe)]);
      /* arco do pé até o próximo dente */
      var ini = c0 + aPe, fim = c0 + passo - aPe;
      for (i = 1; i < 4; i++) {
        var a = ini + (fim - ini) * i / 4;
        pts.push([rd * Math.cos(a), rd * Math.sin(a)]);
      }
    }
    var res = { pts: pts, rp: rp, rb: rb, ra: ra, rd: rd };
    cachePerfil[chave] = res;
    return res;
  }
  /* desenha o perfil com centro (x, y) em pixels, escala s px/mm, girado de ang (anti-horário na tela) */
  function desenhaPerfil(c, pf, x, y, s, ang, cor, alfa) {
    var ca = Math.cos(ang), sa = Math.sin(ang);
    c.beginPath();
    pf.pts.forEach(function (q, i) {
      var X = x + s * (q[0] * ca - q[1] * sa), Y = y - s * (q[0] * sa + q[1] * ca);
      if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
    });
    c.closePath();
    c.fillStyle = cor; c.globalAlpha = alfa === undefined ? 0.28 : alfa; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = cor; c.lineWidth = 1.3; c.stroke();
    /* cubo e raio de referência (mostra o giro) */
    var rc = Math.max(pf.rd * 0.22 * s, 4);
    c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
    c.beginPath(); c.arc(x, y, rc, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x + rc * ca, y - rc * sa); c.lineTo(x + pf.rd * 0.8 * s * ca, y - pf.rd * 0.8 * s * sa); c.stroke();
  }
  /* engrenagem simplificada (dentes trapezoidais), interna ou externa — para os trens */
  function engSimples(c, x, y, rp, m, N, ang, cor, interna, alfa) {
    var passo = TAU / N, ra = interna ? rp - m : rp + m, rd = interna ? rp + 1.25 * m : rp - 1.25 * m;
    var topo = passo * 0.18, pe = passo * 0.30;
    c.beginPath();
    for (var k = 0; k < N; k++) {
      var a = ang + k * passo;
      var P = [[rd, a - pe - passo * 0.02], [ra, a - topo], [ra, a + topo], [rd, a + pe + passo * 0.02]];
      P.forEach(function (q, i) {
        var X = x + q[0] * Math.cos(q[1]), Y = y - q[0] * Math.sin(q[1]);
        if (k === 0 && i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
      });
    }
    c.closePath();
    if (interna) {
      var rext = rp + 3.2 * m;
      c.moveTo(x + rext, y); c.arc(x, y, rext, 0, TAU, true);
    }
    c.fillStyle = cor; c.globalAlpha = alfa === undefined ? 0.3 : alfa; c.fill('evenodd'); c.globalAlpha = 1;
    c.strokeStyle = cor; c.lineWidth = 1.2; c.stroke();
    if (!interna) {
      var rc = Math.max(rd * 0.2, 3.5);
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.beginPath(); c.arc(x, y, rc, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x + rc * Math.cos(ang), y - rc * Math.sin(ang));
      c.lineTo(x + rd * 0.85 * Math.cos(ang), y - rd * 0.85 * Math.sin(ang)); c.stroke();
    } else {
      /* marca na coroa interna para ver o giro */
      c.beginPath(); c.arc(x + (rp + 2.2 * m) * Math.cos(ang), y - (rp + 2.2 * m) * Math.sin(ang), Math.max(m * 0.6, 2.5), 0, TAU);
      c.fillStyle = cor; c.fill();
    }
  }
  /* fase de B para engrenar com A: A com dentes centrados em θA, B na direção δ a partir de A */
  function faseExterna(thA, NA, NB, delta) {
    var fA = (delta - thA) * NA / TAU;
    return delta + Math.PI - (TAU / NB) * (0.5 - fA);
  }
  /* coroa interna R engrenando com o planeta P (P na direção δ a partir do centro de R) */
  function faseInterna(thP, NP, NR, delta) {
    var fP = (delta - thP) * NP / TAU;
    return delta - (TAU / NR) * (fP - 0.5);
  }

  /* ==========================================================================
     1. Engrenamento de dentes retos
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-engrenamento')) return;
    var A = { ctx: null, p: null, g: null, th: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, g = A.g;
      if (!p || !g) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var zoom = p.zoom === 'dentes';
      /* enquadramento: par inteiro, ou uma janela em volta do ponto primitivo */
      var s, xP, yP;
      if (zoom) {
        var jan = 7 * p.m;
        s = Math.min(a.w, a.h * 1.4) / (2 * jan);
        xP = a.x + a.w * 0.5; yP = a.y + a.h * 0.5;
      } else {
        var largura = g.rap + g.C + g.rag, altura = 2 * Math.max(g.rap, g.rag);
        s = Math.min((a.w - 20) / largura, (a.h - 30) / altura);
        xP = a.x + (a.w - largura * s) / 2 + (g.rap + g.rp) * s; yP = a.y + a.h / 2 + 6;
      }
      var x1 = xP - g.rp * s, x2 = xP + g.rg * s;
      var thp = A.th;
      var thg = Math.PI + Math.PI / p.Ng - thp * p.Np / p.Ng;
      var pfP = perfil(p.Np, p.m, p.phi), pfG = perfil(p.Ng, p.m, p.phi);
      c.save();
      c.beginPath(); c.rect(a.x, a.y, a.w, a.h); c.clip();
      /* círculos de referência */
      c.setLineDash([4, 4]); c.lineWidth = 1;
      [[x1, g.rp, Plot.serie(0)], [x2, g.rg, Plot.serie(1)]].forEach(function (q) {
        c.strokeStyle = q[2]; c.beginPath(); c.arc(q[0], yP, q[1] * s, 0, TAU); c.stroke();
      });
      c.setLineDash([2, 3]); c.strokeStyle = faint;
      [[x1, g.rbp], [x2, g.rbg]].forEach(function (q) { c.beginPath(); c.arc(q[0], yP, q[1] * s, 0, TAU); c.stroke(); });
      c.setLineDash([]);
      desenhaPerfil(c, pfP, x1, yP, s, thp, Plot.serie(0), 0.26);
      desenhaPerfil(c, pfG, x2, yP, s, thg, Plot.serie(1), 0.22);

      /* linha de ação T1–T2 e trecho de contato */
      var phi = g.phi;
      var T1 = [x1 + g.rbp * s * Math.cos(phi), yP + g.rbp * s * Math.sin(phi)];
      var T2 = [x2 - g.rbg * s * Math.cos(phi), yP - g.rbg * s * Math.sin(phi)];
      var ux = Math.sin(phi), uy = -Math.cos(phi);        /* de T1 para T2, na tela */
      var LT = g.C * Math.sin(phi);
      var sP = g.rp * Math.sin(phi);
      var Zg = Math.sqrt(g.rag * g.rag - g.rbg * g.rbg) - g.rg * Math.sin(phi);
      var Zp = Math.sqrt(g.rap * g.rap - g.rbp * g.rbp) - g.rp * Math.sin(phi);
      var sIni = sP - Zg, sFim = sP + Zp;
      var ponto = function (sv) { return [T1[0] + ux * sv * s, T1[1] + uy * sv * s]; };
      if (p.linha) {
        c.strokeStyle = Plot.serie(3); c.lineWidth = 1.2; c.setLineDash([6, 4]);
        c.beginPath(); c.moveTo(T1[0] - ux * 30, T1[1] - uy * 30); c.lineTo(T2[0] + ux * 30, T2[1] + uy * 30); c.stroke();
        c.setLineDash([]);
        var q0 = ponto(Math.max(sIni, sIni)), q1 = ponto(sFim);
        c.strokeStyle = g.interfere ? 'rgb(220,50,50)' : Plot.serie(3); c.lineWidth = 4; c.globalAlpha = 0.55;
        c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke(); c.globalAlpha = 1;
        [T1, T2].forEach(function (q, i) {
          c.fillStyle = Plot.serie(3); c.beginPath(); c.arc(q[0], q[1], 3.5, 0, TAU); c.fill();
          if (!zoom) rotulo(c, i ? 'T₂' : 'T₁', q[0] + (i ? 12 : -12), q[1], Plot.serie(3), 11, '700');
        });
        /* pontos de contato atuais: um a cada passo de base */
        var pbMM = g.pb;
        var s0 = sP + g.rbp * (thp + Math.PI / (2 * p.Np));
        var base0 = s0 - Math.floor((s0 - sIni) / pbMM) * pbMM;
        var nPar = 0;
        for (var sv = base0; sv <= sFim + 1e-9; sv += pbMM) {
          if (sv < sIni - 1e-9) continue;
          nPar++;
          var q = ponto(sv);
          c.fillStyle = 'rgb(230,60,40)'; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
          c.strokeStyle = cor; c.lineWidth = 1; c.stroke();
        }
        A.nPar = nPar;
        if (g.interfere && sIni < 0) {
          var qi = ponto(0);
          rotulo(c, 'interferência: o contato começa antes de T₁', qi[0] - 6, qi[1] + 16, 'rgb(220,50,50)', 11, '700', 'right');
        }
      }
      /* ponto primitivo e ângulo de pressão */
      c.fillStyle = cor; c.beginPath(); c.arc(xP, yP, 3.5, 0, TAU); c.fill();
      if (zoom) {
        rotulo(c, 'P', xP + 10, yP - 10, cor, 12, '700');
        c.strokeStyle = faint; c.lineWidth = 1; c.setLineDash([3, 3]);
        c.beginPath(); c.moveTo(xP, a.y); c.lineTo(xP, a.y + a.h); c.stroke(); c.setLineDash([]);
        c.strokeStyle = Plot.serie(3); c.lineWidth = 1.5;
        c.beginPath(); c.arc(xP, yP, 46, -Math.PI / 2, -Math.PI / 2 + phi, false); c.stroke();
        rotulo(c, 'φ = ' + p.phi + '°', xP + 30, yP - 58, Plot.serie(3), 12, '700', 'left');
      }
      c.restore();
      /* legenda */
      rotulo(c, 'pinhão · ' + p.Np + ' dentes', a.x + 8, a.y + 12, Plot.serie(0), 11.5, '700', 'left');
      rotulo(c, 'coroa · ' + p.Ng + ' dentes', a.x + a.w - 8, a.y + 12, Plot.serie(1), 11.5, '700', 'right');
      rotulo(c, 'pares em contato agora: ' + (A.nPar || 0) + '   ·   razão de contato ' + sg(g.mc, 3),
        a.x + a.w / 2, a.y + a.h - 10, faint, 11, '600');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('par');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.th += dt * (A.p.zoom === 'dentes' ? 0.12 : 0.35) * 20 / A.p.Np;
      desenha();
    });

    Sim.build('#sim-engrenamento', {
      titulo: 'Engrenamento de dentes retos — evolvente e linha de ação',
      descricao: 'Dois perfis em evolvente desenhados a partir do módulo, do número de dentes e do ângulo de pressão. O ponto de contato corre sempre sobre a mesma reta, a linha de ação, e é isso que mantém a relação de velocidades constante. A razão de contato diz quantos pares de dentes dividem a carga, em média.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Par típico 20°', desc: '22 × 60 dentes, m = 3 mm', valores: { m: 3, Np: 22, Ng: 60, phi: '20', zoom: 'par', linha: true, animar: true } },
        { nome: '2 · Pinhão pequeno demais', desc: '12 dentes a 20°: há interferência', valores: { m: 3, Np: 12, Ng: 40, phi: '20', zoom: 'par', linha: true, animar: true } },
        { nome: '3 · A mesma coisa a 25°', desc: '12 × 40, φ = 25°: sem interferência', valores: { m: 3, Np: 12, Ng: 40, phi: '25', zoom: 'par', linha: true, animar: true } },
        { nome: '4 · Olhando os dentes de perto', desc: 'zoom no ponto primitivo', valores: { m: 3, Np: 22, Ng: 60, phi: '20', zoom: 'dentes', linha: true, animar: true } },
        { nome: '5 · Sistema antigo de 14,5°', desc: 'razão de contato maior, dentes mais fracos', valores: { m: 3, Np: 32, Ng: 64, phi: '14.5', zoom: 'par', linha: true, animar: true } },
        { nome: '6 · Par 1:1', desc: '13 dentes é o mínimo a 20°', valores: { m: 4, Np: 13, Ng: 13, phi: '20', zoom: 'par', linha: true, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Geometria' },
        { id: 'm', label: 'Módulo m', min: 1, max: 10, step: 0.25, valor: 3, unidade: 'mm', desc: 'm = d/N; o passo circular é p = π·m' },
        { id: 'Np', label: 'Dentes do pinhão Np', min: 8, max: 60, step: 1, valor: 22, unidade: '' },
        { id: 'Ng', label: 'Dentes da coroa Ng', min: 8, max: 150, step: 1, valor: 60, unidade: '' },
        { id: 'phi', tipo: 'seg', label: 'Ângulo de pressão φ', valor: '20',
          opcoes: [{ v: '14.5', t: '14,5°' }, { v: '20', t: '20°' }, { v: '25', t: '25°' }] },
        { tipo: 'titulo', label: 'Visualização' },
        { id: 'zoom', tipo: 'seg', label: 'Enquadramento', valor: 'par',
          opcoes: [{ v: 'par', t: 'Par inteiro' }, { v: 'dentes', t: 'Zoom nos dentes' }] },
        { id: 'linha', tipo: 'check', label: 'Mostrar a linha de ação e os contatos', valor: true },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'par', axes: false, height: 400, grid: false, legend: false },
        { id: 'min', titulo: 'Menor pinhão sem interferência', xlabel: 'Relação de transmissão mG = Ng/Np', ylabel: 'Dentes do pinhão', aspect: 0.5, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'dp', label: 'Diâmetros primitivos' },
        { id: 'C', label: 'Distância entre centros' },
        { id: 'pc', label: 'Passo circular p' },
        { id: 'pb', label: 'Passo de base pb' },
        { id: 'Z', label: 'Comprimento de ação Z' },
        { id: 'mc', label: 'Razão de contato' },
        { id: 'Nmin', label: 'Np mínimo (sem interferência)' },
        { id: 'estado', label: 'Interferência' }
      ],
      formulas: [
        { g: 'Nomenclatura (profundidade completa)' },
        { tex: 'm = \\frac{d}{N} \\qquad p = \\pi m \\qquad a = m \\qquad b = 1{,}25\\,m', d: 'módulo, passo circular, adendo e dedendo', destaque: true },
        { tex: 'r_b = r\\cos\\phi \\qquad p_b = p\\cos\\phi', d: 'raio e passo de base' },
        { tex: 'C = \\frac{d_p + d_g}{2} = \\frac{m\\,(N_p + N_g)}{2}', d: 'distância entre centros' },
        { g: 'Lei do engrenamento' },
        { tex: 'm_V = \\frac{\\omega_g}{\\omega_p} = \\frac{r_p}{r_g} = \\frac{N_p}{N_g}', d: 'a normal comum no contato passa sempre pelo ponto primitivo', destaque: true },
        { tex: '\\text{inv}\\,\\phi = \\tan\\phi - \\phi', d: 'função evolvente' },
        { g: 'Razão de contato' },
        { tex: 'Z = \\sqrt{r_{ap}^2 - r_{bp}^2} + \\sqrt{r_{ag}^2 - r_{bg}^2} - C\\,\\text{sen}\\,\\phi', d: 'comprimento de ação', destaque: true },
        { tex: 'm_p = \\frac{Z}{p_b} \\ge 1{,}2', d: 'número médio de pares em contato; abaixo de 1,2 o engrenamento fica ruidoso' },
        { g: 'Interferência' },
        { tex: 'N_p = \\frac{2k}{(1+2m_G)\\,\\text{sen}^2\\phi}\\left(m_G + \\sqrt{m_G^2 + (1+2m_G)\\,\\text{sen}^2\\phi}\\right)', d: 'menor pinhão que engrena sem interferência (k = 1)' },
        { tex: 'N_p = \\frac{2k}{\\text{sen}^2\\phi}', d: 'limite para engrenar com uma cremalheira' }
      ],
      passos: [],
      nota: 'Perfis com adendo a = m e dedendo b = 1,25·m. Abaixo do círculo de base o flanco é desenhado radial (o adelgaçamento real do pé, quando há interferência, não é desenhado). Folga de engrenamento nula.',
      calcular: function (p, ctx) {
        var phiG = parseFloat(p.phi);
        var g = EM2.par({ m: p.m, Np: p.Np, Ng: p.Ng, phi: phiG });
        A.ctx = ctx; A.p = { m: p.m, Np: p.Np, Ng: p.Ng, phi: phiG, zoom: p.zoom, linha: p.linha }; A.g = g; A.on = !!p.animar;
        desenha();

        /* curvas de Np mínimo */
        var gm = ctx.plot('min').clear();
        var xs = Plot.linspace(1, 8, 80);
        [[14.5, 5], [20, 0], [25, 2]].forEach(function (q) {
          var s2 = Math.pow(Math.sin(q[0] * Math.PI / 180), 2);
          gm.line(xs, xs.map(function (mG) { return 2 / ((1 + 2 * mG) * s2) * (mG + Math.sqrt(mG * mG + (1 + 2 * mG) * s2)); }),
            { color: Plot.serie(q[1]), width: q[0] === phiG ? 2.8 : 1.6, label: 'φ = ' + String(q[0]).replace('.', ',') + '°' });
        });
        gm.marker(Math.min(g.mG, 8), p.Np, 'seu par', { color: g.interfere ? 'rgb(220,50,50)' : Plot.serie(3), r: 5 });
        gm.setLimits([1, 8], [0, 36]).draw();

        var Nmin = Math.ceil(g.NpMin - 1e-9);
        var passos = [
          { t: '① Diâmetros e distância entre centros',
            tex: 'd = mN \\qquad C = \\frac{d_p + d_g}{2}',
            texSub: 'd_p = ' + nt(p.m) + '\\cdot' + p.Np + ' = ' + nt(2 * g.rp, 4) + '\\ mm,\\quad d_g = ' + nt(2 * g.rg, 4) + '\\ mm,\\quad C = ' + nt(g.C, 4) + '\\ mm' },
          { t: '② Círculos de base e passos',
            tex: 'r_b = r\\cos\\phi \\qquad p = \\pi m \\qquad p_b = p\\cos\\phi',
            texSub: 'r_{bp} = ' + nt(g.rbp, 4) + ',\\ r_{bg} = ' + nt(g.rbg, 4) + '\\ mm,\\quad p = ' + nt(g.pc, 4) + ',\\ p_b = ' + nt(g.pb, 4) + '\\ mm',
            obs: 'O passo de base é a distância entre dois dentes vizinhos medida sobre a linha de ação — o espaçamento entre os pontos vermelhos da animação.' },
          { t: '③ Comprimento de ação',
            tex: 'Z = \\sqrt{r_{ap}^2 - r_{bp}^2} + \\sqrt{r_{ag}^2 - r_{bg}^2} - C\\,\\text{sen}\\,\\phi',
            texSub: 'Z = \\sqrt{' + nt(g.rap, 4) + '^2 - ' + nt(g.rbp, 4) + '^2} + \\sqrt{' + nt(g.rag, 4) + '^2 - ' + nt(g.rbg, 4) + '^2} - ' + nt(g.C, 4) + '\\,\\text{sen}\\,' + p.phi + '^\\circ = ' + nt(g.Z, 4) + '\\ mm',
            obs: 'É o trecho da linha de ação entre os dois círculos de adendo: o contato começa onde o adendo da coroa corta a linha e termina onde o adendo do pinhão a corta.' },
          { t: '④ Razão de contato',
            tex: 'm_p = \\frac{Z}{p_b}',
            texSub: 'm_p = \\frac{' + nt(g.Z, 4) + '}{' + nt(g.pb, 4) + '} = ' + nt(g.mc, 3),
            obs: 'Em ' + sg(100 * (g.mc - Math.floor(g.mc)), 2) + ' % do tempo há ' + (Math.floor(g.mc) + 1) + ' pares em contato; no resto, ' + Math.floor(g.mc) + '. ' + (g.mc < 1.2 ? 'Abaixo de 1,2: engrenamento ruidoso e sensível a erros de montagem.' : 'Acima de 1,2, como se recomenda.') },
          { t: '⑤ Verificação de interferência',
            tex: 'N_{p,\\min} = \\frac{2}{(1+2m_G)\\,\\text{sen}^2\\phi}\\left(m_G + \\sqrt{m_G^2 + (1+2m_G)\\,\\text{sen}^2\\phi}\\right)',
            texSub: 'm_G = ' + nt(g.mG, 4) + ' \\Rightarrow N_{p,\\min} = ' + nt(g.NpMin, 4) + ' \\to ' + Nmin + '\\ \\text{dentes}',
            r: p.Np >= Nmin ? 'Np = ' + p.Np + ' ≥ ' + Nmin + ': sem interferência' : 'Np = ' + p.Np + ' < ' + Nmin + ': HÁ interferência',
            obs: p.Np >= Nmin ? 'O contato fica todo dentro do trecho T₁T₂ da linha de ação, onde os dois perfis são evolventes.'
              : 'A ponta do dente da coroa tenta tocar o pinhão abaixo do círculo de base, onde não há evolvente: na fabricação por geração isso vira adelgaçamento (undercut) do pé, que enfraquece o dente. Saídas: mais dentes, φ = 25° ou adendo alongado no pinhão.' }
        ];
        ctx.setPassos(passos);

        return {
          dp: { v: sg(2 * g.rp, 4) + ' / ' + sg(2 * g.rg, 4), u: 'mm' },
          C: { v: g.C, u: 'mm' },
          pc: { v: g.pc, u: 'mm' },
          pb: { v: g.pb, u: 'mm' },
          Z: { v: g.Z, u: 'mm' },
          mc: { v: g.mc, u: '', classe: g.mc < 1.2 ? 'alerta' : 'destaque' },
          Nmin: { v: Nmin, u: 'dentes' },
          estado: { v: g.interfere ? 'Há interferência' : 'Sem interferência', u: '', classe: g.interfere ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Trens de engrenagens
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-trens')) return;
    var A = { ctx: null, p: null, r: null, ang: { in: 0 }, rel: relogio(), on: true };

    function desenharComposto(c, a, p, r) {
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var m = 1;
      var r2 = p.N2 / 2, r3 = p.N3 / 2, r4 = p.N4 / 2, r5 = p.N5 / 2;
      var dir = -50 * Math.PI / 180;                     /* engrenagem 5 abaixo e à direita de 3, num plano atrás dela */
      /* coordenadas em "mm de módulo 1" */
      var O2 = [0, 0], O3 = [r2 + r3, 0];
      var O5 = [O3[0] + (r4 + r5) * Math.cos(dir), (r4 + r5) * Math.sin(dir)];
      var xs = [O2[0] - r2 - 1, O3[0] + r3 + 1, O5[0] + r5 + 1], ys = [r2 + 1, r3 + 1, -r3 - 1, O5[1] - r5 - 1, O5[1] + r5 + 1];
      var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
      var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
      var s = Math.min((a.w - 20) / (xmax - xmin), (a.h - 50) / (ymax - ymin));
      var X = function (x) { return a.x + (a.w - (xmax - xmin) * s) / 2 + (x - xmin) * s; };
      var Y = function (y) { return a.y + 22 + (a.h - 50 - (ymax - ymin) * s) / 2 + (ymax - y) * s; };
      var th2 = A.ang.in;
      var th3 = faseExterna(th2, p.N2, p.N3, 0);
      var th4 = th3;                                       /* 4 solidária a 3 */
      var th5 = faseExterna(th4, p.N4, p.N5, dir);
      /* plano de trás (5) mais apagado; plano da frente (2, 3) e a 4 por cima */
      engSimples(c, X(O5[0]), Y(O5[1]), r5 * s, m * s, p.N5, th5, Plot.serie(2), false, 0.14);
      engSimples(c, X(O3[0]), Y(O3[1]), r3 * s, m * s, p.N3, th3, Plot.serie(1), false, 0.22);
      engSimples(c, X(O2[0]), Y(O2[1]), r2 * s, m * s, p.N2, th2, Plot.serie(0), false, 0.32);
      engSimples(c, X(O3[0]), Y(O3[1]), r4 * s, m * s, p.N4, th4, Plot.serie(4), false, 0.55);
      rotulo(c, '2 · entrada · N = ' + p.N2, X(O2[0]), Y(O2[1] + r2) - 14, Plot.serie(0), 11, '700');
      rotulo(c, sg(r.w2, 4) + ' rpm', X(O2[0]), Y(O2[1] - r2) + 13, Plot.serie(0), 10.5, '600');
      rotulo(c, '3 · N = ' + p.N3 + '  |  4 · N = ' + p.N4 + ' (mesmo eixo) · ' + sg(r.w3, 4) + ' rpm', X(O3[0]), Y(O3[1] + r3) - 14, Plot.serie(1), 11, '700');
      rotulo(c, '5 · saída · N = ' + p.N5 + ' · ' + sg(r.w5, 4) + ' rpm', X(O5[0]), Y(O5[1] - r5) + 14, Plot.serie(2), 11, '700');
      giro(c, X(O2[0]), Y(O2[1]), Math.max(12, r2 * s * 0.35), r.w2 >= 0 ? 1 : -1, Plot.serie(0));
      giro(c, X(O3[0]), Y(O3[1]), Math.max(12, r4 * s * 0.5), r.w3 >= 0 ? 1 : -1, Plot.serie(4));
      giro(c, X(O5[0]), Y(O5[1]), Math.max(12, r5 * s * 0.35), r.w5 >= 0 ? 1 : -1, Plot.serie(2));
      rotulo(c, 'e = (N₂/N₃)(N₄/N₅) = ' + sg(r.e, 4), a.x + 8, a.y + 10, cor, 11.5, '700', 'left');
      rotulo(c, 'a 5 fica num plano atrás de 3', a.x + 8, a.y + 27, faint, 10, '400', 'left');
    }

    function desenharPlanetario(c, a, p, r) {
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var Ns = p.Ns, Npl = p.Npl, Nr = Ns + 2 * Npl, m = 1;
      var rs = Ns / 2, rpl = Npl / 2, rr = Nr / 2, rArm = rs + rpl;
      var Rext = rr + 3.4;
      var s = Math.min((a.w * 0.62) / (2 * Rext), (a.h - 40) / (2 * Rext));
      var cx = a.x + a.w * 0.36, cy = a.y + a.h / 2 + 6;
      /* ângulos atuais: o laço integra ω de cada membro */
      var thS = A.ang.sol, thA = A.ang.braco, thR = A.ang.anel;
      var n = p.nPl, soma = Ns + Nr;
      var posPl = [];
      for (var k = 0; k < n; k++) posPl.push(Math.round(k * soma / n) * TAU / soma);
      /* anel interno: fase a partir do primeiro planeta */
      var planetas = posPl.map(function (d0) {
        var d = d0 + thA;
        return { d: d, th: faseExterna(thS, Ns, Npl, d) };
      });
      var thRdes = faseInterna(planetas[0].th, Npl, Nr, planetas[0].d);
      void thR;
      engSimples(c, cx, cy, rr * s, m * s, Nr, thRdes, Plot.serie(2), true, 0.22);
      /* braço */
      c.strokeStyle = Plot.serie(4); c.lineWidth = Math.max(5, rs * s * 0.28); c.lineCap = 'round'; c.globalAlpha = 0.55;
      planetas.forEach(function (q) {
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + rArm * s * Math.cos(q.d), cy - rArm * s * Math.sin(q.d)); c.stroke();
      });
      c.globalAlpha = 1; c.lineCap = 'butt';
      planetas.forEach(function (q) {
        engSimples(c, cx + rArm * s * Math.cos(q.d), cy - rArm * s * Math.sin(q.d), rpl * s, m * s, Npl, q.th, Plot.serie(1), false, 0.3);
      });
      engSimples(c, cx, cy, rs * s, m * s, Ns, thS, Plot.serie(0), false, 0.34);
      planetas.forEach(function (q) {
        c.fillStyle = Plot.serie(4); c.beginPath();
        c.arc(cx + rArm * s * Math.cos(q.d), cy - rArm * s * Math.sin(q.d), Math.max(3, rpl * s * 0.16), 0, TAU); c.fill();
      });
      /* painel lateral */
      var lx = a.x + a.w * 0.72, ly = a.y + 26;
      var nomes = { sol: 'Sol (N = ' + Ns + ')', braco: 'Braço (porta-planetas)', anel: 'Anel interno (N = ' + Nr + ')' };
      var cores = { sol: Plot.serie(0), braco: Plot.serie(4), anel: Plot.serie(2) };
      ['sol', 'braco', 'anel'].forEach(function (k, j) {
        var papel = k === p.fixo ? 'FIXO' : k === p.entrada ? 'entrada' : 'saída';
        rotulo(c, nomes[k], lx, ly + j * 50, cores[k], 11.5, '700', 'left');
        rotulo(c, papel + ' · ' + sg(r.w[k], 4) + ' rpm', lx, ly + j * 50 + 17, papel === 'FIXO' ? faint : cor, 11, papel === 'saída' ? '700' : '400', 'left');
      });
      rotulo(c, 'Planetas (N = ' + Npl + ')', lx, ly + 150, Plot.serie(1), 11.5, '700', 'left');
      rotulo(c, 'giro absoluto ' + sg(r.wPlaneta, 4) + ' rpm', lx, ly + 167, cor, 11, '400', 'left');
      rotulo(c, 'relação ' + sg(r.relacao, 4) + ' : 1', lx, ly + 205, cor, 13, '700', 'left');
      if (!r.montavel) rotulo(c, '(Ns + Nr)/n não é inteiro: planetas desigualmente espaçados', lx, ly + 228, 'rgb(220,110,40)', 10, '600', 'left');
    }

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      if (p.tipo === 'composto') desenharComposto(c, a, p, r); else desenharPlanetario(c, a, p, r);
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('trem');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.r) return;
      var r = A.r, p = A.p;
      /* velocidade de exibição: a entrada gira a ~0,25 volta/s, independentemente do rpm real */
      var k = 0.25 * TAU / Math.max(Math.abs(p.w), 1e-9) * dt;
      if (p.tipo === 'composto') A.ang.in += p.w * k;
      else { A.ang.sol += r.w.sol * k; A.ang.braco += r.w.braco * k; A.ang.anel += r.w.anel * k; }
      desenha();
    });

    Sim.build('#sim-trens', {
      titulo: 'Trens de engrenagens — composto e planetário',
      descricao: 'No trem composto a relação é o produto das relações de cada par, o que permite grandes reduções em pouco espaço. No planetário há dois graus de liberdade: fixando um dos três membros (sol, braço ou anel) e acionando outro, a fórmula de Willis dá a velocidade do terceiro.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Redutor composto de dois estágios', desc: '20/60 · 18/72 = 1/12', valores: { tipo: 'composto', w: 1800, N2: 20, N3: 60, N4: 18, N5: 72, animar: true } },
        { nome: '2 · Planetário: anel fixo', desc: 'sol aciona, braço é a saída (redução máxima)', valores: { tipo: 'planetario', w: 100, Ns: 24, Npl: 24, nPl: 3, fixo: 'anel', entrada: 'sol', animar: true } },
        { nome: '3 · Planetário: braço fixo', desc: 'vira um trem simples: o anel gira ao contrário', valores: { tipo: 'planetario', w: 100, Ns: 24, Npl: 24, nPl: 3, fixo: 'braco', entrada: 'sol', animar: true } },
        { nome: '4 · Planetário: sol fixo', desc: 'anel aciona, braço sai (sobremarcha se inverter)', valores: { tipo: 'planetario', w: 100, Ns: 24, Npl: 24, nPl: 3, fixo: 'sol', entrada: 'anel', animar: true } },
        { nome: '5 · Sobremarcha', desc: 'sol fixo, braço aciona: saída mais rápida', valores: { tipo: 'planetario', w: 100, Ns: 30, Npl: 15, nPl: 4, fixo: 'sol', entrada: 'braco', animar: true } },
        { nome: '6 · Exemplo da aula', desc: 'Ns 20, anel fixo, sol a 100 rpm', valores: { tipo: 'planetario', w: 100, Ns: 20, Npl: 30, nPl: 2, fixo: 'anel', entrada: 'sol', animar: true } }
      ],
      controles: [
        { id: 'tipo', tipo: 'seg', label: 'Tipo de trem', valor: 'composto',
          opcoes: [{ v: 'composto', t: 'Composto (2 estágios)' }, { v: 'planetario', t: 'Planetário' }] },
        { id: 'w', label: 'Rotação de entrada', min: -3000, max: 3000, step: 10, valor: 1800, unidade: 'rpm', desc: 'positivo = anti-horário' },
        { tipo: 'titulo', label: 'Trem composto' },
        { id: 'N2', label: 'N₂ (motora)', min: 12, max: 60, step: 1, valor: 20, unidade: '' },
        { id: 'N3', label: 'N₃', min: 12, max: 120, step: 1, valor: 60, unidade: '' },
        { id: 'N4', label: 'N₄ (no eixo de 3)', min: 12, max: 60, step: 1, valor: 18, unidade: '' },
        { id: 'N5', label: 'N₅ (saída)', min: 12, max: 120, step: 1, valor: 72, unidade: '' },
        { tipo: 'titulo', label: 'Trem planetário' },
        { id: 'Ns', label: 'Dentes do sol Ns', min: 12, max: 60, step: 1, valor: 24, unidade: '' },
        { id: 'Npl', label: 'Dentes de cada planeta', min: 12, max: 60, step: 1, valor: 24, unidade: '', desc: 'o anel fica com Nr = Ns + 2·Np' },
        { id: 'nPl', label: 'Número de planetas', min: 1, max: 6, step: 1, valor: 3, unidade: '' },
        { id: 'fixo', tipo: 'select', label: 'Membro fixo', valor: 'anel',
          opcoes: [{ v: 'anel', t: 'Anel interno' }, { v: 'sol', t: 'Sol' }, { v: 'braco', t: 'Braço' }] },
        { id: 'entrada', tipo: 'select', label: 'Membro de entrada', valor: 'sol',
          opcoes: [{ v: 'sol', t: 'Sol' }, { v: 'anel', t: 'Anel interno' }, { v: 'braco', t: 'Braço' }] },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'trem', axes: false, height: 420, grid: false, legend: false },
        { id: 'vel', titulo: 'Rotação de cada membro', xlabel: '', ylabel: 'rpm', aspect: 0.42, legend: false }
      ],
      saidas: [
        { id: 'e', label: 'Valor do trem e' },
        { id: 'saida', label: 'Rotação de saída' },
        { id: 'rel', label: 'Relação de redução' },
        { id: 'sentido', label: 'Sentido da saída' },
        { id: 'extra', label: 'Observação' }
      ],
      formulas: [
        { g: 'Trens simples e compostos' },
        { tex: 'e = \\frac{\\omega_{saída}}{\\omega_{entrada}} = \\pm\\frac{\\text{produto dos dentes das motoras}}{\\text{produto dos dentes das movidas}}', d: 'sinal: cada par externo inverte o sentido', destaque: true },
        { tex: 'e = \\left(-\\frac{N_2}{N_3}\\right)\\left(-\\frac{N_4}{N_5}\\right)', d: 'dois estágios externos: a saída gira no mesmo sentido da entrada' },
        { tex: '\\text{engrenagem intermediária: } e = -\\frac{N_2}{N_3}\\cdot\\left(-\\frac{N_3}{N_4}\\right) = \\frac{N_2}{N_4}', d: 'não muda a relação, só o sentido' },
        { g: 'Trem planetário (fórmula de Willis)' },
        { tex: 'e = \\frac{\\omega_L - \\omega_A}{\\omega_F - \\omega_A}', d: 'F = primeira engrenagem, L = última, A = braço', destaque: true },
        { tex: 'e_{sol \\to anel} = -\\frac{N_s}{N_r}', d: 'valor do trem visto do braço (planetas como intermediárias)' },
        { tex: 'N_r = N_s + 2N_p', d: 'condição geométrica (mesmo módulo)' },
        { tex: '\\frac{N_s + N_r}{n} \\in \\mathbb{Z}', d: 'para montar n planetas igualmente espaçados' },
        { tex: '\\text{anel fixo: } \\frac{\\omega_A}{\\omega_s} = \\frac{N_s}{N_s + N_r}', d: 'caso mais comum: redução de 1 + Nr/Ns' }
      ],
      passos: [],
      nota: 'Todas as engrenagens com o mesmo módulo; os desenhos usam dentes trapezoidais simplificados. Na animação a entrada gira a um quarto de volta por segundo, qualquer que seja a rotação; as demais giram na proporção correta.',
      calcular: function (p, ctx) {
        var r, passos = [], out;
        var gb = ctx.plot('vel').clear();
        if (p.tipo === 'composto') {
          var t = EM2.trem({ tipo: 'composto', pares: [[p.N2, p.N3], [p.N4, p.N5]], w: p.w });
          r = { e: t.e, w2: p.w, w3: -p.w * p.N2 / p.N3, w5: t.wSaida };
          gb.o.xcat = [{ v: 0, label: 'engrenagem 2\n(entrada)' }, { v: 1, label: 'eixo 3-4' }, { v: 2, label: 'engrenagem 5\n(saída)' }];
          [p.w, r.w3, r.w5].forEach(function (v, k) {
            gb.bars([k], [v], { color: [Plot.serie(0), Plot.serie(1), Plot.serie(2)][k], barw: 0.5 });
            gb.text(k, v, sg(v, 4), { align: 'center', dy: v >= 0 ? -7 : 15, size: 11 });
          });
          var lim = Math.max(Math.abs(p.w), 1) * 1.25;
          gb.setLimits([-0.6, 2.6], [-lim, lim]);
          passos.push({ t: '① Primeiro estágio (2 → 3)',
            tex: '\\omega_3 = -\\frac{N_2}{N_3}\\,\\omega_2',
            texSub: '\\omega_3 = -\\frac{' + p.N2 + '}{' + p.N3 + '}\\cdot' + nt(p.w, 4) + ' = ' + nt(r.w3, 4) + '\\ rpm' });
          passos.push({ t: '② Segundo estágio (4 → 5); 4 gira com 3',
            tex: '\\omega_5 = -\\frac{N_4}{N_5}\\,\\omega_4, \\quad \\omega_4 = \\omega_3',
            texSub: '\\omega_5 = -\\frac{' + p.N4 + '}{' + p.N5 + '}\\cdot(' + nt(r.w3, 4) + ') = ' + nt(r.w5, 4) + '\\ rpm' });
          passos.push({ t: '③ Valor do trem',
            tex: 'e = \\frac{N_2 N_4}{N_3 N_5}',
            texSub: 'e = \\frac{' + p.N2 + '\\cdot' + p.N4 + '}{' + p.N3 + '\\cdot' + p.N5 + '} = ' + nt(r.e, 4) + ' \\;\\Rightarrow\\; \\text{redução } ' + nt(1 / r.e, 4) + ':1',
            obs: 'Para conseguir a mesma redução num só par, a coroa teria ' + sg(p.N2 / r.e, 4) + ' dentes — com o pinhão de ' + p.N2 + ' dentes, um diâmetro ' + sg(1 / r.e, 3) + ' vezes maior que o do pinhão. É por isso que reduções acima de ~10:1 usam dois ou mais estágios.' });
          out = {
            e: { v: r.e, u: '' },
            saida: { v: r.w5, u: 'rpm', classe: 'destaque' },
            rel: { v: sg(1 / Math.abs(r.e), 4) + ' : 1', u: '' },
            sentido: { v: r.w5 * p.w >= 0 ? 'Mesmo da entrada' : 'Oposto à entrada', u: '' },
            extra: { v: 'Dois pares externos', u: '' }
          };
        } else {
          var Nr = p.Ns + 2 * p.Npl;
          var ent = p.entrada === p.fixo ? (p.fixo === 'sol' ? 'anel' : 'sol') : p.entrada;
          var tp = EM2.trem({ tipo: 'planetario', Ns: p.Ns, Nr: Nr, fixo: p.fixo, entrada: ent, w: p.w });
          var livre = tp.livre;
          r = { w: tp.w, wPlaneta: tp.wPlaneta, relacao: Math.abs(p.w / tp.w[livre]), montavel: ((p.Ns + Nr) / p.nPl) % 1 === 0, livre: livre };
          if (!A.ang.sol && A.ang.sol !== 0) A.ang = { sol: 0, braco: 0, anel: 0 };
          if (A.ang.sol === undefined) A.ang = { sol: 0, braco: 0, anel: 0 };
          var nomes = { sol: 'sol', braco: 'braço', anel: 'anel' };
          gb.o.xcat = [{ v: 0, label: 'sol' }, { v: 1, label: 'braço' }, { v: 2, label: 'anel' }, { v: 3, label: 'planeta\n(absoluto)' }];
          [tp.w.sol, tp.w.braco, tp.w.anel, tp.wPlaneta].forEach(function (v, k) {
            gb.bars([k], [v], { color: [Plot.serie(0), Plot.serie(4), Plot.serie(2), Plot.serie(1)][k], barw: 0.5 });
            gb.text(k, v, sg(v, 4), { align: 'center', dy: v >= 0 ? -7 : 15, size: 11 });
          });
          var lim2 = Math.max(Math.abs(p.w), Math.abs(tp.wPlaneta), Math.abs(tp.w[livre]), 1) * 1.25;
          gb.setLimits([-0.6, 3.6], [-lim2, lim2]);
          var eSR = -p.Ns / Nr;
          passos.push({ t: '① Geometria',
            tex: 'N_r = N_s + 2N_p',
            texSub: 'N_r = ' + p.Ns + ' + 2\\cdot' + p.Npl + ' = ' + Nr,
            obs: r.montavel ? '(Ns + Nr)/n = ' + (p.Ns + Nr) / p.nPl + ': os ' + p.nPl + ' planetas montam igualmente espaçados.'
              : '(Ns + Nr)/n = ' + sg((p.Ns + Nr) / p.nPl, 4) + ' não é inteiro: com ' + p.nPl + ' planetas não dá para espaçá-los igualmente, e o desenho os coloca nas posições possíveis mais próximas.' });
          passos.push({ t: '② Valor do trem com o braço parado',
            tex: 'e = \\frac{\\omega_r - \\omega_A}{\\omega_s - \\omega_A} = \\left(-\\frac{N_s}{N_p}\\right)\\left(+\\frac{N_p}{N_r}\\right) = -\\frac{N_s}{N_r}',
            texSub: 'e = -\\frac{' + p.Ns + '}{' + Nr + '} = ' + nt(eSR, 4),
            obs: 'O planeta é uma engrenagem intermediária: seu número de dentes some da relação. O contato com o anel interno não inverte o sentido.' });
          passos.push({ t: '③ Condições: ' + nomes[p.fixo] + ' fixo, ' + nomes[ent] + ' a ' + sg(p.w, 4) + ' rpm',
            tex: '\\omega_{' + (p.fixo === 'braco' ? 'A' : p.fixo === 'sol' ? 's' : 'r') + '} = 0',
            texSub: livre === 'braco' ? '\\omega_A = \\frac{\\omega_r - e\\,\\omega_s}{1 - e} = \\frac{' + nt(tp.w.anel, 4) + ' - (' + nt(eSR, 4) + ')(' + nt(tp.w.sol, 4) + ')}{1 - (' + nt(eSR, 4) + ')} = ' + nt(tp.w.braco, 4) + '\\ rpm'
              : livre === 'anel' ? '\\omega_r = \\omega_A + e\\,(\\omega_s - \\omega_A) = ' + nt(tp.w.braco, 4) + ' + (' + nt(eSR, 4) + ')(' + nt(tp.w.sol, 4) + ' - ' + nt(tp.w.braco, 4) + ') = ' + nt(tp.w.anel, 4) + '\\ rpm'
              : '\\omega_s = \\omega_A + \\frac{\\omega_r - \\omega_A}{e} = ' + nt(tp.w.sol, 4) + '\\ rpm',
            r: 'Saída (' + nomes[livre] + '): ' + sg(tp.w[livre], 4) + ' rpm' });
          passos.push({ t: '④ Rotação do planeta',
            tex: '\\frac{\\omega_p - \\omega_A}{\\omega_s - \\omega_A} = -\\frac{N_s}{N_p}',
            texSub: '\\omega_p = ' + nt(tp.w.braco, 4) + ' - \\frac{' + p.Ns + '}{' + p.Npl + '}(' + nt(tp.w.sol, 4) + ' - ' + nt(tp.w.braco, 4) + ') = ' + nt(tp.wPlaneta, 4) + '\\ rpm',
            obs: 'É a rotação absoluta, vista do chão. Em relação ao braço o planeta gira a ' + sg(tp.wPlaneta - tp.w.braco, 4) + ' rpm — é essa que importa para os mancais do planeta.' });
          out = {
            e: { v: eSR, u: 'sol → anel, braço parado' },
            saida: { v: tp.w[livre], u: 'rpm (' + nomes[livre] + ')', classe: 'destaque' },
            rel: { v: sg(r.relacao, 4) + ' : 1', u: r.relacao > 1 ? 'redução' : 'multiplicação' },
            sentido: { v: tp.w[livre] * p.w >= 0 ? 'Mesmo da entrada' : 'Oposto à entrada', u: '' },
            extra: { v: p.entrada === p.fixo ? 'Entrada = fixo: usei ' + nomes[ent] + ' como entrada' : (r.montavel ? 'Montagem simétrica ok' : 'Planetas não simétricos'), u: '', classe: p.entrada === p.fixo || !r.montavel ? 'alerta' : '' }
          };
        }
        gb.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        gb.draw();
        if (!A.p || A.p.tipo !== p.tipo) A.ang = p.tipo === 'composto' ? { in: 0 } : { sol: 0, braco: 0, anel: 0 };
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();
        ctx.setPassos(passos);
        return out;
      }
    });
  })();

  /* ==========================================================================
     3. Forças num trem com engrenagem intermediária
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-intermediaria')) return;
    var A = { ctx: null, p: null, r: null, th: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var r2 = p.N2 / 2, r3 = p.N3 / 2, r4 = p.N4 / 2;
      var u2 = r.u2, u4 = r.u4;
      var O3 = [0, 0], O2 = [u2[0] * (r2 + r3), u2[1] * (r2 + r3)], O4 = [u4[0] * (r3 + r4), u4[1] * (r3 + r4)];
      var xs = [O2[0] - r2, O2[0] + r2, O3[0] - r3, O3[0] + r3, O4[0] - r4, O4[0] + r4];
      var ys = [O2[1] - r2, O2[1] + r2, O3[1] - r3, O3[1] + r3, O4[1] - r4, O4[1] + r4];
      var xmin = Math.min.apply(null, xs) - 2, xmax = Math.max.apply(null, xs) + 2;
      var ymin = Math.min.apply(null, ys) - 2, ymax = Math.max.apply(null, ys) + 2;
      /* metade esquerda: o trem; metade direita: diagrama de corpo livre de 3 */
      var wEsq = a.w * 0.52;
      var s = Math.min((wEsq - 10) / (xmax - xmin), (a.h - 30) / (ymax - ymin));
      var X = function (x) { return a.x + (wEsq - (xmax - xmin) * s) / 2 + (x - xmin) * s; };
      var Y = function (y) { return a.y + 18 + (a.h - 30 - (ymax - ymin) * s) / 2 + (ymax - y) * s; };
      var d2 = Math.atan2(u2[1], u2[0]), d4 = Math.atan2(u4[1], u4[0]);
      var th2 = A.th * p.sentido;
      var th3 = faseExterna(th2, p.N2, p.N3, d2 + Math.PI);
      var th4 = faseExterna(th3, p.N3, p.N4, d4);
      engSimples(c, X(O3[0]), Y(O3[1]), r3 * s, s, p.N3, th3, Plot.serie(1), false, 0.2);
      engSimples(c, X(O2[0]), Y(O2[1]), r2 * s, s, p.N2, th2, Plot.serie(0), false, 0.32);
      engSimples(c, X(O4[0]), Y(O4[1]), r4 * s, s, p.N4, th4, Plot.serie(2), false, 0.3);
      [[O2, r2, '2 · pinhão', Plot.serie(0), p.sentido], [O3, r3, '3 · intermediária', Plot.serie(1), -p.sentido], [O4, r4, '4 · coroa', Plot.serie(2), p.sentido]].forEach(function (q) {
        rotulo(c, q[2], X(q[0][0]), Y(q[0][1]) + Math.max(q[1] * s * 0.45, 16), q[3], 11, '700');
        giro(c, X(q[0][0]), Y(q[0][1]), Math.max(11, q[1] * s * 0.3), q[4], q[3]);
      });
      if (r.colide) rotulo(c, 'as engrenagens 2 e 4 se sobrepõem: aumente o ângulo', a.x + wEsq / 2, a.y + a.h - 8, 'rgb(220,50,50)', 11, '700');

      /* ---------- DCL da engrenagem 3 ---------- */
      var cx = a.x + wEsq + (a.w - wEsq) / 2, cy = a.y + a.h / 2 + 8;
      var R = Math.min((a.w - wEsq) * 0.21, a.h * 0.23);
      var Fmax = Math.max(r.W, r.FbMod, 1);
      var esc = R * 1.35 / Fmax;
      c.strokeStyle = Plot.serie(1); c.lineWidth = 1.6; c.fillStyle = Plot.serie(1); c.globalAlpha = 0.12;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.globalAlpha = 1; c.stroke();
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff'); c.beginPath(); c.arc(cx, cy, 5, 0, TAU); c.fill(); c.stroke();
      rotulo(c, 'Diagrama de corpo livre da engrenagem 3', cx, a.y + 10, cor, 11.5, '700');
      /* forças de contato: vetor com origem no ponto primitivo de cada engrenamento */
      [[u2, r.F23, 'F₂₃', Plot.serie(0)], [u4, r.F43, 'F₄₃', Plot.serie(2)]].forEach(function (q) {
        var px = cx + q[0][0] * R, py = cy - q[0][1] * R;
        var fx = q[1][0] * esc, fy = -q[1][1] * esc;
        /* componentes radial e tangencial tracejadas */
        c.setLineDash([4, 3]); c.strokeStyle = q[3]; c.lineWidth = 1; c.globalAlpha = 0.6;
        var rad = [-q[0][0], -q[0][1]], compR = q[1][0] * rad[0] + q[1][1] * rad[1];
        var fr = [rad[0] * compR * esc, -rad[1] * compR * esc];
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + fr[0], py + fr[1]); c.lineTo(px + fx, py + fy); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
        seta(c, px, py, px + fx, py + fy, q[3], 2.6, 11);
        c.fillStyle = q[3]; c.beginPath(); c.arc(px, py, 3.5, 0, TAU); c.fill();
        var Lf = Math.hypot(fx, fy) || 1;
        rotulo(c, q[2] + ' = ' + sg(Math.hypot(q[1][0], q[1][1]) / 1000, 3) + ' kN', px + fx + fx / Lf * 40, py + fy + fy / Lf * 14, q[3], 11, '700');
      });
      /* reação do eixo */
      var bx = r.Fb[0] * esc, by = -r.Fb[1] * esc;
      seta(c, cx, cy, cx + bx, cy + by, 'rgb(220,60,60)', 3, 12);
      var Lb = Math.hypot(bx, by) || 1;
      rotulo(c, 'F_b3 = ' + sg(r.FbMod / 1000, 3) + ' kN', cx + bx + bx / Lb * 40, cy + by + by / Lb * 14, 'rgb(220,60,60)', 11.5, '700');
      rotulo(c, 'torque no eixo de 3 = 0  ·  φ = ' + p.phi + '°', cx, a.y + a.h - 8, faint, 10.5, '600');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('dcl');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.th += dt * 0.25 * TAU * 0.5;
      desenha();
    });

    Sim.build('#sim-intermediaria', {
      titulo: 'Forças no engrenamento — pinhão, intermediária e coroa',
      descricao: 'A força entre dentes age ao longo da linha de ação e se decompõe em tangencial (transmite o torque) e radial (só afasta as engrenagens). A intermediária não transmite torque ao seu eixo, mas o mancal dela carrega a soma vetorial das duas forças de contato — e essa soma depende de como as três estão arranjadas.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo da aula', desc: '2,5 kW a 1750 rpm, m = 2,5 mm, 20°, centros a 90°', valores: { P: 2.5, rpm: 1750, m: 2.5, N2: 20, N3: 50, N4: 30, phi: '20', beta: 90, sentido: '1', animar: true } },
        { nome: '2 · Trem em linha', desc: '2, 3 e 4 alinhados: as radiais se cancelam', valores: { P: 2.5, rpm: 1750, m: 2.5, N2: 20, N3: 50, N4: 30, phi: '20', beta: 180, sentido: '1', animar: true } },
        { nome: '3 · Arranjo desfavorável', desc: 'centros a 140°: as forças quase se somam', valores: { P: 2.5, rpm: 1750, m: 2.5, N2: 20, N3: 50, N4: 30, phi: '20', beta: 140, sentido: '1', animar: true } },
        { nome: '4 · Arranjo favorável', desc: 'centros a 300°: as forças quase se anulam', valores: { P: 2.5, rpm: 1750, m: 2.5, N2: 20, N3: 50, N4: 30, phi: '20', beta: 300, sentido: '1', animar: true } },
        { nome: '5 · Ângulo de pressão 25°', desc: 'mais força radial para o mesmo torque', valores: { P: 2.5, rpm: 1750, m: 2.5, N2: 20, N3: 50, N4: 30, phi: '25', beta: 90, sentido: '1', animar: true } },
        { nome: '6 · Invertendo o giro', desc: 'o arranjo favorável vira desfavorável', valores: { P: 2.5, rpm: 1750, m: 2.5, N2: 20, N3: 50, N4: 30, phi: '20', beta: 300, sentido: '-1', animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Transmissão' },
        { id: 'P', label: 'Potência', min: 0.1, max: 50, step: 0.1, valor: 2.5, unidade: 'kW' },
        { id: 'rpm', label: 'Rotação do pinhão', min: 100, max: 6000, step: 10, valor: 1750, unidade: 'rpm' },
        { id: 'sentido', tipo: 'seg', label: 'Giro do pinhão', valor: '1', opcoes: [{ v: '1', t: 'Anti-horário' }, { v: '-1', t: 'Horário' }] },
        { tipo: 'titulo', label: 'Engrenagens' },
        { id: 'm', label: 'Módulo', min: 1, max: 8, step: 0.25, valor: 2.5, unidade: 'mm' },
        { id: 'N2', label: 'N₂ (pinhão)', min: 12, max: 60, step: 1, valor: 20, unidade: '' },
        { id: 'N3', label: 'N₃ (intermediária)', min: 12, max: 100, step: 1, valor: 50, unidade: '' },
        { id: 'N4', label: 'N₄ (coroa)', min: 12, max: 100, step: 1, valor: 30, unidade: '' },
        { id: 'phi', tipo: 'seg', label: 'Ângulo de pressão', valor: '20', opcoes: [{ v: '20', t: '20°' }, { v: '25', t: '25°' }] },
        { id: 'beta', label: 'Ângulo entre as linhas de centro 3-2 e 3-4', min: 40, max: 320, step: 1, valor: 90, unidade: '°' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'dcl', axes: false, height: 400, grid: false, legend: false },
        { id: 'fb', titulo: 'Carga no mancal da intermediária × arranjo', xlabel: 'Ângulo entre as linhas de centro (°)', ylabel: 'F_b3 (kN)', aspect: 0.45, legend: false }
      ],
      saidas: [
        { id: 'V', label: 'Velocidade na linha primitiva' },
        { id: 'Wt', label: 'Força tangencial Wt' },
        { id: 'Wr', label: 'Força radial Wr' },
        { id: 'W', label: 'Força total W' },
        { id: 'T2', label: 'Torque no pinhão' },
        { id: 'T4', label: 'Torque na coroa' },
        { id: 'Fb', label: 'Reação no eixo de 3' },
        { id: 'rpm4', label: 'Rotação da coroa' }
      ],
      formulas: [
        { g: 'Da potência à força' },
        { tex: 'V = \\frac{\\pi d n}{60} \\qquad W_t = \\frac{H}{V} = \\frac{2T}{d}', d: 'força tangencial: a única que transmite potência', destaque: true },
        { tex: 'W_r = W_t\\tan\\phi \\qquad W = \\frac{W_t}{\\cos\\phi}', d: 'radial e total, ao longo da linha de ação', destaque: true },
        { g: 'Engrenagem intermediária' },
        { tex: 'W_{t,23} = W_{t,43} \\quad\\Rightarrow\\quad T_3 = 0', d: 'as duas tangenciais têm o mesmo módulo e momentos opostos' },
        { tex: '\\vec F_{b3} = -(\\vec F_{23} + \\vec F_{43})', d: 'o mancal equilibra a soma vetorial' },
        { tex: 'm_{V} = \\frac{N_2}{N_4}', d: 'a intermediária não altera a relação, só o sentido de giro' },
        { tex: 'K_I = 1{,}42', d: 'fator AGMA de ciclo de carga: cada dente da intermediária é carregado nos dois flancos a cada volta' }
      ],
      passos: [],
      nota: 'Sem atrito entre dentes, rendimento de 100 %. O pinhão fica sempre abaixo da intermediária; o ângulo gira a coroa em volta dela.',
      calcular: function (p, ctx) {
        var phiG = parseFloat(p.phi), sent = parseInt(p.sentido, 10);
        var base = { m: p.m, N2: p.N2, N3: p.N3, N4: p.N4, phi: phiG, rpm: p.rpm, P: p.P, ang2: -90, sentido: sent };
        var r = EM2.forcasIntermediaria(Object.assign({ beta: p.beta }, base));
        r.W = r.Wt / Math.cos(phiG * Math.PI / 180);
        var dist24 = p.m * Math.sqrt(Math.pow((p.N2 + p.N3) / 2, 2) + Math.pow((p.N3 + p.N4) / 2, 2) - 2 * (p.N2 + p.N3) / 2 * (p.N3 + p.N4) / 2 * Math.cos(p.beta * Math.PI / 180));
        r.colide = dist24 < p.m * ((p.N2 + p.N4) / 2 + 2);
        A.ctx = ctx; A.p = { N2: p.N2, N3: p.N3, N4: p.N4, phi: p.phi, sentido: sent }; A.r = r; A.on = !!p.animar;
        desenha();

        var bs = Plot.linspace(40, 320, 141);
        var fb = bs.map(function (b) { return EM2.forcasIntermediaria(Object.assign({ beta: b }, base)).FbMod / 1000; });
        var g = ctx.plot('fb').clear();
        g.line(bs, fb, { color: Plot.serie(3), width: 2.4 });
        g.marker(p.beta, r.FbMod / 1000, sg(r.FbMod / 1000, 3) + ' kN', { color: 'rgb(220,60,60)', r: 5 });
        g.hline(2 * r.W / 1000, { color: Plot.serie(5), dash: [4, 4], text: '2W (forças paralelas)' });
        g.setLimits([40, 320], [0, 2.2 * r.W / 1000]).draw();

        var T2 = r.Wt * r.d2 / 2, T4 = r.Wt * p.m * p.N4 / 2000;
        var F23m = Math.hypot(r.F23[0], r.F23[1]);
        ctx.setPassos([
          { t: '① Diâmetro primitivo e velocidade do pinhão',
            tex: 'd_2 = mN_2 \\qquad V = \\frac{\\pi d_2 n_2}{60}',
            texSub: 'd_2 = ' + nt(p.m) + '\\cdot' + p.N2 + ' = ' + nt(r.d2 * 1000, 4) + '\\ mm,\\quad V = \\frac{\\pi\\cdot' + nt(r.d2, 4) + '\\cdot' + p.rpm + '}{60} = ' + nt(r.V, 4) + '\\ m/s' },
          { t: '② Força tangencial transmitida',
            tex: 'W_t = \\frac{H}{V}',
            texSub: 'W_t = \\frac{' + nt(p.P * 1000, 4) + '}{' + nt(r.V, 4) + '} = ' + nt(r.Wt, 4) + '\\ N',
            obs: 'É a mesma força tangencial nos dois engrenamentos (2-3 e 3-4): a intermediária só repassa o esforço.' },
          { t: '③ Componente radial e força total',
            tex: 'W_r = W_t\\tan\\phi \\qquad W = W_t/\\cos\\phi',
            texSub: 'W_r = ' + nt(r.Wt, 4) + '\\tan ' + phiG + '^\\circ = ' + nt(r.Wr, 4) + '\\ N,\\quad W = ' + nt(r.W, 4) + '\\ N' },
          { t: '④ Forças que 2 e 4 exercem sobre 3',
            tex: '\\vec F_{23} = W_r(-\\hat u_2) + W_t\\,\\hat t_2 \\qquad \\vec F_{43} = W_r(-\\hat u_4) - W_t\\,\\hat t_4',
            texSub: '\\vec F_{23} = (' + nt(r.F23[0], 4) + ';\\ ' + nt(r.F23[1], 4) + ')\\ N \\qquad \\vec F_{43} = (' + nt(r.F43[0], 4) + ';\\ ' + nt(r.F43[1], 4) + ')\\ N',
            obs: 'As radiais apontam para o centro de 3 (dentes empurram para dentro). A tangencial de 2 empurra 3 no sentido do giro de 3; a de 4 resiste a ele — por isso os momentos se anulam.' },
          { t: '⑤ Reação no eixo da intermediária',
            tex: '\\vec F_{b3} = -(\\vec F_{23} + \\vec F_{43})',
            texSub: '\\vec F_{b3} = (' + nt(r.Fb[0], 4) + ';\\ ' + nt(r.Fb[1], 4) + ')\\ N \\;\\Rightarrow\\; |F_{b3}| = ' + nt(r.FbMod, 4) + '\\ N',
            obs: 'Cada força de contato vale ' + sg(F23m, 4) + ' N, mas o mancal recebe ' + sg(r.FbMod, 4) + ' N. Com o trem em linha (180°) as radiais se cancelam e sobra 2·Wt. Conforme o lado em que fica a coroa, as duas forças se somam (até 2·W) ou quase se anulam — e o lado favorável troca quando o sentido de giro se inverte. O gráfico mostra a carga do mancal para todos os arranjos.' }
        ]);
        return {
          V: { v: r.V, u: 'm/s' },
          Wt: { v: r.Wt / 1000, u: 'kN', classe: 'destaque' },
          Wr: { v: r.Wr / 1000, u: 'kN' },
          W: { v: r.W / 1000, u: 'kN' },
          T2: { v: T2, u: 'N·m' },
          T4: { v: T4, u: 'N·m' },
          Fb: { v: r.FbMod / 1000, u: 'kN', classe: r.colide ? 'alerta' : 'destaque' },
          rpm4: { v: sent * p.rpm * p.N2 / p.N4, u: 'rpm' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Tensões AGMA de flexão e de contato
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-agma')) return;
    var A = { ctx: null, p: null, r: null, th: 0, rel: relogio(), on: true };

    /* St e Sc (MPa) para coroas que não são de aço */
    var RES_COROA = { fn: [152, 531], ff: [59, 448], ba: [163, 448], bs: [39, 207] };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var g = r.g;
      /* janela em volta do ponto primitivo, como uma lupa */
      var jan = 5.2 * p.m;
      var s = Math.min(a.w * 0.62, a.h * 1.1) / (2 * jan);
      var xP = a.x + a.w * 0.36, yP = a.y + a.h * 0.5;
      var x1 = xP - g.rp * s, x2 = xP + g.rg * s;
      var thp = A.th, thg = Math.PI + Math.PI / p.Ng - thp * p.Np / p.Ng;
      var pfP = perfil(p.Np, p.m, p.phi), pfG = perfil(p.Ng, p.m, p.phi);
      c.save();
      c.beginPath(); c.rect(a.x, a.y, a.w * 0.72, a.h); c.clip();
      desenhaPerfil(c, pfP, x1, yP, s, thp, Plot.serie(0), 0.24);
      desenhaPerfil(c, pfG, x2, yP, s, thg, Plot.serie(1), 0.2);
      /* contatos sobre a linha de ação, com a força W */
      var phi = g.phi;
      var T1 = [x1 + g.rbp * s * Math.cos(phi), yP + g.rbp * s * Math.sin(phi)];
      var ux = Math.sin(phi), uy = -Math.cos(phi);
      var sP = g.rp * Math.sin(phi);
      var Zg = Math.sqrt(g.rag * g.rag - g.rbg * g.rbg) - g.rg * Math.sin(phi);
      var Zp = Math.sqrt(g.rap * g.rap - g.rbp * g.rbp) - g.rp * Math.sin(phi);
      var sIni = sP - Zg, sFim = sP + Zp, pb = g.pb;
      var s0 = sP + g.rbp * (thp + Math.PI / (2 * p.Np));
      var base0 = s0 - Math.floor((s0 - sIni) / pb) * pb;
      var contatos = [];
      for (var sv = base0; sv <= sFim + 1e-9; sv += pb) if (sv >= sIni - 1e-9) contatos.push(sv);
      c.strokeStyle = Plot.serie(3); c.lineWidth = 1; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(T1[0] + ux * (sIni - 3 * p.m) * s, T1[1] + uy * (sIni - 3 * p.m) * s);
      c.lineTo(T1[0] + ux * (sFim + 3 * p.m) * s, T1[1] + uy * (sFim + 3 * p.m) * s); c.stroke(); c.setLineDash([]);
      /* faixa onde um único par carrega tudo: entre sFim − pb e sIni + pb (o HPSTC é a ponta superior) */
      var sHi = sFim - pb, sHf = sIni + pb;
      if (sHf > sHi) {
        c.strokeStyle = 'rgb(230,120,30)'; c.lineWidth = 6; c.globalAlpha = 0.45;
        c.beginPath(); c.moveTo(T1[0] + ux * sHf * s, T1[1] + uy * sHf * s); c.lineTo(T1[0] + ux * sHi * s, T1[1] + uy * sHi * s); c.stroke();
        c.globalAlpha = 1;
      }
      var comp = 44;
      contatos.forEach(function (sv) {
        var q = [T1[0] + ux * sv * s, T1[1] + uy * sv * s];
        var frac = contatos.length > 1 ? 1 / contatos.length : 1;
        /* força do pinhão sobre a coroa: ao longo da linha de ação, de T1 para T2 */
        seta(c, q[0] - ux * comp * frac * 0.2, q[1] - uy * comp * frac * 0.2, q[0] + ux * comp * frac * 1.6, q[1] + uy * comp * frac * 1.6, 'rgb(220,60,60)', 2.4, 10);
        c.fillStyle = 'rgb(220,60,60)'; c.beginPath(); c.arc(q[0], q[1], 4.2, 0, TAU); c.fill();
      });
      c.restore();
      rotulo(c, contatos.length === 1 ? 'um só par carrega W inteira' : contatos.length + ' pares dividem a carga', xP, a.y + a.h - 10, contatos.length === 1 ? 'rgb(220,60,60)' : faint, 11, '700');
      rotulo(c, 'faixa laranja: contato de um só par (onde está o HPSTC)', xP, a.y + 12, 'rgb(210,110,30)', 10.5, '600');

      /* painel: tensões × resistências */
      var lx = a.x + a.w * 0.75, ly = a.y + 22, larg = a.w * 0.22;
      var itens = [
        ['Flexão · pinhão', r.sbp, r.Sfbp, Plot.serie(0)],
        ['Flexão · coroa', r.sbg, r.Sfbg, Plot.serie(1)],
        ['Contato · pinhão', r.sc, r.Sfcp, Plot.serie(4)],
        ['Contato · coroa', r.sc, r.Sfcg, Plot.serie(2)]
      ];
      itens.forEach(function (q, j) {
        var y = ly + j * 62, f = Math.min(q[1] / q[2], 1.2);
        rotulo(c, q[0], lx, y, cor, 11, '700', 'left');
        c.fillStyle = Plot.cssVar('--border', '#ddd'); c.fillRect(lx, y + 10, larg, 12);
        c.fillStyle = q[1] > q[2] ? 'rgb(220,60,60)' : q[3]; c.fillRect(lx, y + 10, larg * Math.min(f, 1.2) / 1.2, 12);
        c.strokeStyle = cor; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx + larg / 1.2, y + 7); c.lineTo(lx + larg / 1.2, y + 25); c.stroke();
        rotulo(c, sg(q[1], 3) + ' / ' + sg(q[2], 3) + ' MPa', lx, y + 35, faint, 10.5, '400', 'left');
      });
      rotulo(c, 'barra: tensão atuante', lx, ly + 250, faint, 9.5, '400', 'left');
      rotulo(c, 'traço: resistência corrigida', lx, ly + 263, faint, 9.5, '400', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('dentes');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.th += dt * 0.05 * 20 / A.p.Np;
      desenha();
    });

    Sim.build('#sim-agma', {
      titulo: 'Tensões nos dentes — AGMA flexão e contato',
      descricao: 'A equação de Lewis trata o dente como uma viga em balanço; a AGMA a corrige com o fator geométrico J e com fatores de dinâmica, distribuição de carga, aplicação, tamanho e borda. Na superfície, a pressão de Hertz entre os dois flancos causa a fadiga superficial (pitting). As duas tensões são comparadas com resistências corrigidas pela vida e pela confiabilidade.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Exemplo da aula', desc: 'Wt = 0,546 kN, m = 4 mm, 25°, Qv 6, F = 48 mm, 14 × 17 intermediária', valores: { P: 2.8, rpm: 1750, m: 4, Np: 14, Ng: 17, phi: '25', F: 48, Qv: 6, Ka: '1', Ks: 1, mB: 2, inter: true, mat: 'aco-aco', HB: 250, vida: 5000, conf: '0.99', animar: true } },
        { nome: '2 · Redutor industrial', desc: '15 kW, 1750 rpm, 21 × 63, Qv 8', valores: { P: 15, rpm: 1750, m: 4, Np: 21, Ng: 63, phi: '20', F: 50, Qv: 8, Ka: '1.25', Ks: 1, mB: 2, inter: false, mat: 'aco-aco', HB: 300, vida: 20000, conf: '0.99', animar: true } },
        { nome: '3 · Face estreita demais', desc: 'F = 20 mm < 8m: o pitting domina', valores: { P: 15, rpm: 1750, m: 4, Np: 21, Ng: 63, phi: '20', F: 20, Qv: 8, Ka: '1.25', Ks: 1, mB: 2, inter: false, mat: 'aco-aco', HB: 300, vida: 20000, conf: '0.99', animar: true } },
        { nome: '4 · Qualidade baixa em alta rotação', desc: 'Qv 5 a 5000 rpm: Kv despenca', valores: { P: 15, rpm: 5000, m: 3, Np: 26, Ng: 78, phi: '20', F: 36, Qv: 5, Ka: '1', Ks: 1, mB: 2, inter: false, mat: 'aco-aco', HB: 300, vida: 20000, conf: '0.99', animar: true } },
        { nome: '5 · Coroa de ferro fundido', desc: 'Cp menor, mas resistência também menor', valores: { P: 5, rpm: 1200, m: 4, Np: 21, Ng: 55, phi: '20', F: 40, Qv: 7, Ka: '1.25', Ks: 1, mB: 2, inter: false, mat: 'aco-ff', HB: 250, vida: 10000, conf: '0.99', animar: true } },
        { nome: '6 · Engrenagem em anel fino', desc: 'mB = 0,6: KB penaliza a flexão', valores: { P: 15, rpm: 1750, m: 4, Np: 21, Ng: 63, phi: '20', F: 50, Qv: 8, Ka: '1.25', Ks: 1, mB: 0.6, inter: false, mat: 'aco-aco', HB: 300, vida: 20000, conf: '0.99', animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Carga' },
        { id: 'P', label: 'Potência', min: 0.1, max: 100, step: 0.1, valor: 15, unidade: 'kW' },
        { id: 'rpm', label: 'Rotação do pinhão', min: 50, max: 6000, step: 10, valor: 1750, unidade: 'rpm' },
        { id: 'Ka', tipo: 'select', label: 'Fator de aplicação Ka', valor: '1.25',
          opcoes: [{ v: '1', t: '1,00 — motor uniforme, carga uniforme' }, { v: '1.25', t: '1,25 — choque moderado' },
                   { v: '1.5', t: '1,50 — choque moderado nos dois lados' }, { v: '1.75', t: '1,75 — choque pesado' }, { v: '2', t: '2,00 — choque pesado nos dois lados' }] },
        { tipo: 'titulo', label: 'Geometria' },
        { id: 'm', label: 'Módulo', min: 1, max: 12, step: 0.25, valor: 4, unidade: 'mm' },
        { id: 'Np', label: 'Dentes do pinhão', min: 12, max: 100, step: 1, valor: 21, unidade: '' },
        { id: 'Ng', label: 'Dentes da coroa', min: 12, max: 200, step: 1, valor: 63, unidade: '' },
        { id: 'phi', tipo: 'seg', label: 'Ângulo de pressão', valor: '20', opcoes: [{ v: '20', t: '20°' }, { v: '25', t: '25°' }] },
        { id: 'F', label: 'Largura de face F', min: 5, max: 200, step: 1, valor: 50, unidade: 'mm', desc: 'regra prática: 8m < F < 16m' },
        { id: 'Qv', label: 'Índice de qualidade Qv', min: 5, max: 11, step: 1, valor: 8, unidade: '' },
        { id: 'Ks', label: 'Fator de tamanho Ks', min: 1, max: 1.5, step: 0.05, valor: 1, unidade: '' },
        { id: 'mB', label: 'Razão de recuo da borda mB', min: 0.5, max: 2, step: 0.05, valor: 2, unidade: '', desc: 'mB ≥ 1,2 (ou disco sólido): KB = 1' },
        { id: 'inter', tipo: 'check', label: 'A coroa é uma intermediária (KI = 1,42)', valor: false },
        { tipo: 'titulo', label: 'Material e vida' },
        { id: 'mat', tipo: 'select', label: 'Materiais (pinhão – coroa)', valor: 'aco-aco',
          opcoes: [{ v: 'aco-aco', t: 'Aço – aço (Cp = 191)' }, { v: 'aco-fn', t: 'Aço – ferro nodular (179)' }, { v: 'aco-ff', t: 'Aço – ferro fundido (174)' },
                   { v: 'aco-ba', t: 'Aço – bronze-alumínio (162)' }, { v: 'aco-bs', t: 'Aço – bronze-estanho (158)' }] },
        { id: 'HB', label: 'Dureza Brinell (aço grau 1)', min: 150, max: 400, step: 5, valor: 300, unidade: 'HB' },
        { id: 'vida', label: 'Vida de projeto', min: 100, max: 100000, step: 100, valor: 20000, unidade: 'h' },
        { id: 'conf', tipo: 'select', label: 'Confiabilidade', valor: '0.99',
          opcoes: [{ v: '0.9', t: '90 % (KR = 0,85)' }, { v: '0.99', t: '99 % (KR = 1,00)' }, { v: '0.999', t: '99,9 % (KR = 1,25)' }, { v: '0.9999', t: '99,99 % (KR = 1,50)' }] },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'dentes', axes: false, height: 330, grid: false, legend: false },
        { id: 'kv', titulo: 'Fator dinâmico Kv × velocidade', xlabel: 'Velocidade na linha primitiva (m/s)', ylabel: 'Kv', aspect: 0.45, legendPos: 'topright' },
        { id: 'face', titulo: 'Coeficientes de segurança × largura de face', xlabel: 'F (mm)', ylabel: 'n', aspect: 0.45, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Wt', label: 'Força tangencial Wt' },
        { id: 'V', label: 'Velocidade primitiva' },
        { id: 'Kv', label: 'Kv · Km · KB' },
        { id: 'J', label: 'J pinhão / coroa' },
        { id: 'sbp', label: 'σb pinhão' },
        { id: 'sbg', label: 'σb coroa' },
        { id: 'sc', label: 'σc (contato)' },
        { id: 'nb', label: 'n flexão (pinhão / coroa)' },
        { id: 'nc', label: 'n contato (pinhão / coroa)' },
        { id: 'aviso', label: 'Verificação' }
      ],
      formulas: [
        { g: 'Flexão' },
        { tex: '\\sigma = \\frac{W_t}{F\\,m\\,Y}', d: 'equação de Lewis: o dente como viga em balanço, carga na ponta' },
        { tex: '\\sigma_b = \\frac{W_t}{F\\,m\\,J}\\,\\frac{K_a K_m}{K_v}\\,K_s K_B K_I', d: 'equação AGMA de flexão (convenção do Norton, com m em mm)', destaque: true },
        { tex: 'K_v = \\left(\\frac{A}{A + \\sqrt{200\\,V}}\\right)^B \\quad B = \\frac{(12 - Q_v)^{2/3}}{4} \\quad A = 50 + 56(1 - B)', d: 'fator dinâmico, V em m/s' },
        { tex: 'K_B = -2m_B + 3{,}4\\ \\ (0{,}5 \\le m_B \\le 1{,}2) \\qquad m_B = \\frac{t_R}{h_t}', d: 'fator de espessura de borda' },
        { g: 'Contato (pitting)' },
        { tex: '\\sigma_c = C_p\\sqrt{\\frac{W_t}{F\\,I\\,d}\\,\\frac{C_a C_m}{C_v}\\,C_s C_f}', d: 'equação AGMA de superfície; C_a = K_a, C_m = K_m, C_v = K_v, C_s = K_s', destaque: true },
        { tex: 'I = \\frac{\\cos\\phi}{\\left(\\frac{1}{\\rho_p} + \\frac{1}{\\rho_g}\\right)d_p}', d: 'fator geométrico de superfície; ρ = raios de curvatura dos flancos' },
        { tex: '\\rho_p = \\sqrt{(r_p + m)^2 - (r_p\\cos\\phi)^2} - \\pi m\\cos\\phi \\qquad \\rho_g = C\\,\\text{sen}\\,\\phi - \\rho_p', d: 'curvaturas no ponto mais baixo de contato de um só par' },
        { g: 'Resistências (aço grau 1, AGMA 2001)' },
        { tex: 'S_t = 0{,}533\\,H_B + 88{,}3 \\qquad S_c = 2{,}22\\,H_B + 200 \\quad (\\text{MPa})', d: 'resistências de flexão e de contato para 10⁷ ciclos, 99 %' },
        { tex: 'S_{fb} = \\frac{Y_N}{K_R}S_t \\qquad S_{fc} = \\frac{Z_N}{K_R}S_c', d: 'Y_N = 1,3558 N^{-0,0178}; Z_N = 1,4488 N^{-0,023}' },
        { tex: 'n_b = \\frac{S_{fb}}{\\sigma_b} \\qquad n_c = \\left(\\frac{S_{fc}}{\\sigma_c}\\right)^2', d: 'no contato a tensão cresce com √W: o quadrado compara cargas', destaque: true }
      ],
      passos: [],
      nota: 'J pelas tabelas 11-9 e 11-13 do Norton (profundidade completa, carga no HPSTC), interpoladas; nas combinações marcadas U (adelgaçamento) usa-se o Y de Lewis, com aviso. Km pela tabela 11-16 (engrenagens comerciais). Fator de acabamento Cf = 1. Coroa de aço com a mesma dureza do pinhão; coroas de outros materiais com St e Sc tabelados: ferro nodular 60-40-18 (152 e 531 MPa), ferro fundido classe 30 (59 e 448), bronze-alumínio (163 e 448), bronze-estanho (39 e 207).',
      calcular: function (p, ctx) {
        var phiG = parseFloat(p.phi), mats = p.mat.split('-');
        var ent = { m: p.m, Np: p.Np, Ng: Math.max(p.Ng, p.Np), phi: phiG, rpm: p.rpm, P: p.P, F: p.F, Qv: p.Qv, Ka: parseFloat(p.Ka), Ks: p.Ks, mB: p.mB,
                    KIg: p.inter ? 1.42 : 1, matP: mats[0], matG: mats[1], HB: p.HB, vida: p.vida, conf: p.conf };
        var r = EM2.agma(ent);
        /* coroa de outro material: St e Sc tabelados (Shigley, tab. 14-4 e 14-7), corrigidos pela vida */
        var corrige = function (q) {
          var t = RES_COROA[mats[1]];
          if (!t) return;
          q.Sfbg = t[0] * q.YNg / q.KR; q.Sfcg = t[1] * q.ZNg / q.KR;
          q.nbg = q.Sfbg / q.sbg; q.ncg = Math.pow(q.Sfcg / q.sc, 2);
        };
        corrige(r);
        A.ctx = ctx; A.p = { m: p.m, Np: p.Np, Ng: ent.Ng, phi: phiG }; A.r = r; A.on = !!p.animar;
        desenha();

        /* Kv */
        var gk = ctx.plot('kv').clear();
        var Vmax = Math.max(40, r.V * 1.3), vs = Plot.linspace(0.1, Vmax, 120);
        [5, 7, 9, 11].forEach(function (Q, j) {
          var kk = EM2.Kv(Q, 1);
          var xs = vs.filter(function (v) { return v <= kk.Vmax; });
          gk.line(xs, xs.map(function (v) { return EM2.Kv(Q, v).Kv; }), { color: Plot.serie(j), width: Q === p.Qv ? 2.8 : 1.5, label: 'Qv = ' + Q });
        });
        if ([5, 7, 9, 11].indexOf(p.Qv) < 0) {
          var xq = vs.filter(function (v) { return v <= r.kv.Vmax; });
          gk.line(xq, xq.map(function (v) { return EM2.Kv(p.Qv, v).Kv; }), { color: Plot.serie(5), width: 2.8, label: 'Qv = ' + p.Qv });
        }
        gk.marker(r.V, r.kv.Kv, 'operação', { color: r.V > r.kv.Vmax ? 'rgb(220,60,60)' : Plot.serie(6), r: 5 });
        gk.setLimits([0, Vmax], [0.3, 1.02]).draw();

        /* n × F */
        var gf = ctx.plot('face').clear();
        var Fs = Plot.linspace(Math.max(4 * p.m, 5), 20 * p.m, 60);
        var ns = Fs.map(function (F) {
          var q = EM2.agma(Object.assign({}, ent, { F: F }));
          corrige(q);
          return [Math.min(q.Sfbp / q.sbp, q.Sfbg / q.sbg), Math.min(Math.pow(q.Sfcp / q.sc, 2), Math.pow(q.Sfcg / q.sc, 2))];
        });
        gf.area([8 * p.m, 8 * p.m, 16 * p.m, 16 * p.m], [0, 1e3, 1e3, 0], { color: Plot.serie(2), alpha: 0.08 });
        gf.line(Fs, ns.map(function (q) { return q[0]; }), { color: Plot.serie(0), width: 2.4, label: 'flexão (menor n)' });
        gf.line(Fs, ns.map(function (q) { return q[1]; }), { color: Plot.serie(4), width: 2.4, label: 'contato (menor n)' });
        gf.hline(1, { color: 'rgb(220,60,60)', dash: [4, 4], text: 'n = 1' });
        gf.vline(p.F, { color: Plot.serie(6), text: 'F atual' });
        var nTopo = Math.min(Math.max(ns[ns.length - 1][0], ns[ns.length - 1][1], 2) * 1.1, 30);
        gf.setLimits([Fs[0], Fs[Fs.length - 1]], [0, nTopo]).draw();

        var avisos = [];
        if (!r.J) avisos.push('J fora da tabela (U): usei Lewis');
        if (p.F < r.Fmin || p.F > r.Fmax) avisos.push('F fora de 8m–16m');
        if (r.V > r.kv.Vmax) avisos.push('V acima do limite para Qv ' + p.Qv);
        if (p.mB < 1.2) avisos.push('borda fina');
        var nbMin = Math.min(r.nbp, r.nbg), ncMin = Math.min(r.ncp, r.ncg);
        var modo = ncMin < nbMin ? 'pitting (contato)' : 'flexão do dente';
        var KI = p.inter ? 1.42 : 1;

        ctx.setPassos([
          { t: '① Força tangencial',
            tex: 'd_p = mN_p,\\quad V = \\frac{\\pi d_p n}{60},\\quad W_t = \\frac{H}{V}',
            texSub: 'd_p = ' + nt(r.dp * 1000, 4) + '\\ mm,\\quad V = ' + nt(r.V, 4) + '\\ m/s,\\quad W_t = \\frac{' + nt(p.P * 1000, 4) + '}{' + nt(r.V, 4) + '} = ' + nt(r.Wt, 4) + '\\ N' },
          { t: '② Fator dinâmico Kv',
            tex: 'B = \\frac{(12 - Q_v)^{2/3}}{4},\\ \\ A = 50 + 56(1 - B),\\ \\ K_v = \\left(\\frac{A}{A + \\sqrt{200V}}\\right)^B',
            texSub: 'B = ' + nt(r.kv.B, 4) + ',\\ A = ' + nt(r.kv.A, 4) + ' \\Rightarrow K_v = ' + nt(r.kv.Kv, 4),
            obs: r.V > r.kv.Vmax ? 'V = ' + sg(r.V, 3) + ' m/s passa do limite de ' + sg(r.kv.Vmax, 3) + ' m/s para Qv ' + p.Qv + ': é preciso uma qualidade melhor.' : 'Limite de uso desta qualidade: ' + sg(r.kv.Vmax, 3) + ' m/s.' },
          { t: '③ Demais fatores',
            tex: 'K_a = ' + nt(ent.Ka) + ',\\ K_m = ' + nt(r.Km, 3) + ',\\ K_s = ' + nt(p.Ks) + ',\\ K_B = ' + nt(r.KB, 3) + ',\\ K_I = ' + nt(KI),
            texSub: 'J_p = ' + nt(r.Jp, 3) + ',\\ J_g = ' + nt(r.Jg, 3) + (r.J ? '\\ (\\text{tabela, HPSTC})' : '\\ (\\text{Lewis } Y\\text{: combinação U na tabela})'),
            obs: 'Km sai da tabela 11-16 pela largura de face; J, da tabela do ângulo de pressão escolhido, cruzando os dentes do pinhão e da coroa.' },
          { t: '④ Tensões de flexão',
            tex: '\\sigma_b = \\frac{W_t}{F m J}\\frac{K_a K_m}{K_v}K_s K_B K_I',
            texSub: '\\sigma_{bp} = \\frac{' + nt(r.Wt, 4) + '}{' + p.F + '\\cdot' + nt(p.m) + '\\cdot' + nt(r.Jp, 3) + '}\\cdot\\frac{' + nt(ent.Ka) + '\\cdot' + nt(r.Km, 3) + '}{' + nt(r.kv.Kv, 3) + '}\\cdot' + nt(r.KB, 3) + ' = ' + nt(r.sbp, 4) + '\\ MPa,\\quad \\sigma_{bg} = ' + nt(r.sbg, 4) + '\\ MPa',
            obs: 'Só com Lewis (Y = ' + sg(r.Yp, 3) + ', sem fatores) daria ' + sg(r.sLewis, 3) + ' MPa no pinhão.' + (p.inter ? ' A coroa, como intermediária, leva K_I = 1,42: cada dente dela é carregado nos dois flancos, em flexão alternada.' : '') },
          { t: '⑤ Tensão de contato',
            tex: 'I = \\frac{\\cos\\phi}{(1/\\rho_p + 1/\\rho_g)\\,d_p},\\qquad \\sigma_c = C_p\\sqrt{\\frac{W_t}{F I d_p}\\frac{C_a C_m}{C_v}C_s}',
            texSub: '\\rho_p = ' + nt(r.fI.rhoP, 4) + ',\\ \\rho_g = ' + nt(r.fI.rhoG, 4) + '\\ mm \\Rightarrow I = ' + nt(r.I, 4) + ',\\quad \\sigma_c = ' + r.Cp + '\\sqrt{\\frac{' + nt(r.Wt, 4) + '}{' + p.F + '\\cdot' + nt(r.I, 3) + '\\cdot' + nt(r.dp * 1000, 4) + '}\\cdot\\frac{' + nt(ent.Ka) + '\\cdot' + nt(r.Km, 3) + '}{' + nt(r.kv.Kv, 3) + '}} = ' + nt(r.sc, 4) + '\\ MPa',
            obs: 'A tensão de contato é a mesma nos dois flancos (ação e reação), mas o pinhão sofre mais ciclos.' },
          { t: '⑥ Resistências corrigidas',
            tex: 'S_t = 0{,}533H_B + 88{,}3,\\ \\ S_c = 2{,}22H_B + 200,\\ \\ S_{fb} = \\frac{Y_N}{K_R}S_t,\\ \\ S_{fc} = \\frac{Z_N}{K_R}S_c',
            texSub: 'N_p = ' + nt(r.ciclos, 3) + '\\ \\text{ciclos} \\Rightarrow Y_N = ' + nt(r.YNp, 4) + ',\\ Z_N = ' + nt(r.ZNp, 4) + ';\\quad S_{fb} = ' + nt(r.Sfbp, 4) + ',\\ S_{fc} = ' + nt(r.Sfcp, 4) + '\\ MPa',
            obs: 'A coroa gira ' + sg(r.g.mG, 3) + ' vezes mais devagar, sofre ' + sg(r.ciclosG, 3) + ' ciclos e tem resistências corrigidas um pouco maiores.' },
          { t: '⑦ Coeficientes de segurança',
            tex: 'n_b = \\frac{S_{fb}}{\\sigma_b}\\qquad n_c = \\left(\\frac{S_{fc}}{\\sigma_c}\\right)^2',
            texSub: 'n_{bp} = ' + nt(r.nbp, 3) + ',\\ n_{bg} = ' + nt(r.nbg, 3) + ',\\quad n_{cp} = ' + nt(r.ncp, 3) + ',\\ n_{cg} = ' + nt(r.ncg, 3),
            r: 'Modo de falha que governa: ' + modo,
            obs: 'É comum que o pitting governe em engrenagens de aço: aumentar a dureza superficial (cementação, têmpera por indução) ajuda muito mais no contato do que na flexão.' }
        ]);
        return {
          Wt: { v: r.Wt, u: 'N' },
          V: { v: r.V, u: 'm/s' },
          Kv: { v: sg(r.kv.Kv, 3) + ' · ' + sg(r.Km, 3) + ' · ' + sg(r.KB, 3), u: '' },
          J: { v: sg(r.Jp, 3) + ' / ' + sg(r.Jg, 3), u: r.J ? '' : 'Lewis', classe: r.J ? '' : 'alerta' },
          sbp: { v: r.sbp, u: 'MPa' },
          sbg: { v: r.sbg, u: 'MPa' },
          sc: { v: r.sc, u: 'MPa' },
          nb: { v: sg(r.nbp, 3) + ' / ' + sg(r.nbg, 3), u: '', classe: nbMin < 1 ? 'alerta' : 'destaque' },
          nc: { v: sg(r.ncp, 3) + ' / ' + sg(r.ncg, 3), u: '', classe: ncMin < 1 ? 'alerta' : 'destaque' },
          aviso: { v: avisos.length ? avisos.join(' · ') : 'Dentro das recomendações', u: '', classe: avisos.length ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ==========================================================================
     5. Mola helicoidal de compressão
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-mola')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      /* carga oscilando entre Fmin e Fmax */
      var fase = 0.5 - 0.5 * Math.cos(A.t * 2.2);
      var F = p.Fmin + (p.Fmax - p.Fmin) * fase;
      var y = F / r.k, L = r.L0 - y;
      var tau = r.KB * 8 * F * p.D / (Math.PI * Math.pow(p.d, 3));
      /* eixo da mola na horizontal; escala pelo comprimento livre */
      var x0 = a.x + 40, largUtil = a.w * 0.66 - 60;
      var s = Math.min(largUtil / r.L0, (a.h - 90) / (p.D + p.d));
      var yc = a.y + a.h * 0.46;
      var X = function (z) { return x0 + z * s; };
      /* placa fixa e placa móvel */
      c.fillStyle = faint;
      c.fillRect(X(0) - 10, yc - (p.D / 2 + p.d) * s - 12, 10, (p.D + 2 * p.d) * s + 24);
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.8;
      c.fillRect(X(L), yc - (p.D / 2 + p.d) * s - 12, 8, (p.D + 2 * p.d) * s + 24);
      c.globalAlpha = 1;
      /* fantasmas: comprimento livre e sólido */
      c.setLineDash([4, 4]); c.strokeStyle = faint; c.lineWidth = 1;
      [[r.L0, 'L₀ livre'], [r.Ls, 'Ls sólido']].forEach(function (q, j) {
        c.beginPath(); c.moveTo(X(q[0]), yc - (p.D / 2 + p.d) * s - 22); c.lineTo(X(q[0]), yc + (p.D / 2 + p.d) * s + 22); c.stroke();
        rotulo(c, q[1] + ' = ' + sg(q[0], 3) + ' mm', X(q[0]), yc + (p.D / 2 + p.d) * s + 32 + j * 14, faint, 10, '600');
      });
      c.setLineDash([]);
      /* hélice: espiras das pontas esquadradas com passo = d */
      var Nt = r.Nt, pts = [], n = Math.ceil(Nt * 40);
      var zDe = function (u) {
        if (u <= 1) return p.d / 2 + u * p.d;
        if (u >= Nt - 1) return L - p.d / 2 - (Nt - u) * p.d;
        return p.d * 1.5 + (u - 1) * (L - 3 * p.d) / (Nt - 2);
      };
      for (var i = 0; i <= n; i++) {
        var u = Nt * i / n;
        pts.push([zDe(u), Math.cos(TAU * u) * p.D / 2, Math.sin(TAU * u)]);
      }
      var frac = Math.min(tau / r.Ssy, 1.1);
      var corFio = frac > 1 ? 'rgb(220,50,50)' : 'rgb(' + Math.round(60 + 180 * frac) + ',' + Math.round(130 - 40 * frac) + ',' + Math.round(220 - 170 * frac) + ')';
      c.lineCap = 'round';
      [false, true].forEach(function (frente) {
        c.strokeStyle = corFio; c.lineWidth = Math.max(p.d * s, 1.5); c.globalAlpha = frente ? 1 : 0.35;
        c.beginPath();
        var aberto = false;
        pts.forEach(function (q) {
          var naFrente = q[2] >= 0;
          if (naFrente === frente) {
            if (!aberto) { c.moveTo(X(q[0]), yc - q[1] * s); aberto = true; } else c.lineTo(X(q[0]), yc - q[1] * s);
          } else aberto = false;
        });
        c.stroke();
      });
      c.globalAlpha = 1; c.lineCap = 'butt';
      /* força aplicada */
      seta(c, X(L) + 70, yc, X(L) + 12, yc, 'rgb(220,60,60)', 3, 12);
      rotulo(c, 'F = ' + sg(F, 3) + ' N', X(L) + 42, yc - 14, 'rgb(220,60,60)', 11.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.72, ly = a.y + 20;
      var linhas = [
        ['deflexão y', sg(y, 3) + ' mm'],
        ['comprimento L', sg(L, 3) + ' mm'],
        ['τ no fio (com K_B)', sg(tau, 3) + ' MPa'],
        ['τ / Ssy', sg(tau / r.Ssy, 2)],
        ['índice C = D/d', sg(r.C, 3)],
        ['frequência natural', sg(r.fn, 3) + ' Hz']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, j === 3 && tau > r.Ssy ? 'rgb(220,50,50)' : cor, 12, '700', 'left');
      });
      if (r.flamba) rotulo(c, 'L₀ > 5,26·D: risco de flambagem — use guia', a.x + 8, a.y + a.h - 8, 'rgb(220,110,40)', 10.5, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('mola');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-mola', {
      titulo: 'Mola helicoidal de compressão — rigidez, tensão e fadiga',
      descricao: 'A mola é uma barra de torção enrolada: a força axial vira torque no fio. O fator de Bergsträsser corrige a tensão pela curvatura e pelo cisalhamento direto. Sob carga que oscila entre Fmin e Fmax, a fadiga é verificada com os dados de Zimmerli e a reta de Goodman em torção.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Mola de válvula', desc: 'corda de piano, carga pulsante', valores: { material: 'A228', d: 3, D: 24, Na: 8, Fmin: 100, Fmax: 220, animar: true } },
        { nome: '2 · Fio fino, carga alta', desc: 'fadiga reprovada', valores: { material: 'A228', d: 2, D: 16, Na: 10, Fmin: 40, Fmax: 120, animar: true } },
        { nome: '3 · Cromo-silício', desc: 'maior resistência a altas temperaturas', valores: { material: 'A401', d: 4, D: 30, Na: 6, Fmin: 200, Fmax: 450, animar: true } },
        { nome: '4 · Mola esbelta', desc: 'muitas espiras: risco de flambagem', valores: { material: 'A229', d: 2.5, D: 14, Na: 30, Fmin: 20, Fmax: 60, animar: true } },
        { nome: '5 · Índice pequeno', desc: 'C < 4: difícil de enrolar e K_B alto', valores: { material: 'A232', d: 5, D: 17, Na: 6, Fmin: 500, Fmax: 1200, animar: true } }
      ],
      controles: [
        { id: 'material', tipo: 'select', label: 'Material do fio', valor: 'A228',
          opcoes: Object.keys(EM2.MATERIAIS_MOLA).map(function (k) { return { v: k, t: EM2.MATERIAIS_MOLA[k].nome }; }) },
        { tipo: 'titulo', label: 'Geometria' },
        { id: 'd', label: 'Diâmetro do fio d', min: 0.5, max: 12, step: 0.1, valor: 3, unidade: 'mm' },
        { id: 'D', label: 'Diâmetro médio D', min: 4, max: 120, step: 0.5, valor: 24, unidade: 'mm' },
        { id: 'Na', label: 'Espiras ativas Na', min: 2, max: 40, step: 0.5, valor: 8, unidade: '' },
        { tipo: 'titulo', label: 'Carregamento' },
        { id: 'Fmin', label: 'Força mínima Fmin', min: 0, max: 5000, step: 5, valor: 100, unidade: 'N' },
        { id: 'Fmax', label: 'Força máxima Fmax', min: 1, max: 5000, step: 5, valor: 220, unidade: 'N' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar (carga oscilando)', valor: true }
      ],
      graficos: [
        { id: 'mola', axes: false, height: 300, grid: false, legend: false },
        { id: 'goodman', titulo: 'Diagrama de fadiga em torção (Goodman + Zimmerli)', xlabel: 'Tensão média τm (MPa)', ylabel: 'Amplitude τa (MPa)', aspect: 0.5, legendPos: 'topright' },
        { id: 'fy', titulo: 'Força × deflexão', xlabel: 'Deflexão y (mm)', ylabel: 'Força (N)', aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'k', label: 'Rigidez k' },
        { id: 'C', label: 'Índice C · K_B' },
        { id: 'Sut', label: 'Sut · Ssy' },
        { id: 'tmax', label: 'τ máxima' },
        { id: 'nEst', label: 'n estático (em Fmax)' },
        { id: 'nSol', label: 'n com a mola fechada' },
        { id: 'nf', label: 'n fadiga (Goodman)' },
        { id: 'L0', label: 'L₀ · Ls' },
        { id: 'fn', label: 'Frequência natural' },
        { id: 'aviso', label: 'Verificação' }
      ],
      formulas: [
        { g: 'Tensão e rigidez' },
        { tex: '\\tau = K_B\\,\\frac{8FD}{\\pi d^3} \\qquad K_B = \\frac{4C + 2}{4C - 3} \\qquad C = \\frac{D}{d}', d: 'Bergsträsser: curvatura + cisalhamento direto', destaque: true },
        { tex: 'k = \\frac{d^4 G}{8 D^3 N_a}', d: 'rigidez; cresce com d⁴ e cai com D³', destaque: true },
        { tex: '4 \\le C \\le 12', d: 'faixa recomendada do índice de mola' },
        { g: 'Resistência do fio' },
        { tex: 'S_{ut} = \\frac{A}{d^{\\,m}}', d: 'fios finos são mais resistentes (trefilação); A e m tabelados por material' },
        { tex: 'S_{sy} \\approx 0{,}45\\text{ a }0{,}50\\,S_{ut} \\qquad S_{su} = 0{,}67\\,S_{ut}', d: 'escoamento e ruptura em torção' },
        { g: 'Fadiga (Zimmerli, sem jateamento)' },
        { tex: 'S_{sa} = 241\\ MPa \\quad S_{sm} = 379\\ MPa', d: 'resistência à fadiga de molas, independe do material abaixo de 10 mm' },
        { tex: 'S_{se} = \\frac{S_{sa}}{1 - S_{sm}/S_{su}} \\qquad \\frac{1}{n_f} = \\frac{\\tau_a}{S_{se}} + \\frac{\\tau_m}{S_{su}}', d: 'reta de Goodman em torção', destaque: true },
        { g: 'Comprimentos e dinâmica' },
        { tex: 'N_t = N_a + 2 \\qquad L_s = N_t d \\qquad L_0 = L_s + y_{max} + y_{folga}', d: 'extremidades esquadradas e retificadas; folga de 15 %' },
        { tex: 'L_0 < 2{,}63\\,\\frac{D}{\\alpha} \\quad (\\alpha = 0{,}5)', d: 'estabilidade: sem flambagem entre placas paralelas' },
        { tex: 'f_n = \\frac12\\sqrt{\\frac{k}{m}} \\qquad m = \\frac{\\pi^2 d^2 D N_a \\rho}{4}', d: 'frequência natural (surge), extremidades entre placas' }
      ],
      passos: [],
      nota: 'Extremidades esquadradas e retificadas; comprimento livre dimensionado com 15 % de folga além da deflexão máxima. Resistências pela tabela 10-4 do Shigley. Dados de Zimmerli para molas sem jateamento de granalha.',
      calcular: function (p, ctx) {
        var Fmin = Math.min(p.Fmin, p.Fmax), Fmax = Math.max(p.Fmin, p.Fmax, 1e-6);
        var r = EM2.mola({ d: p.d, D: p.D, Na: p.Na, material: p.material, Fmin: Fmin, Fmax: Fmax });
        A.ctx = ctx; A.p = { d: p.d, D: p.D, Na: p.Na, Fmin: Fmin, Fmax: Fmax }; A.r = r; A.on = !!p.animar;
        desenha();

        var gg = ctx.plot('goodman').clear();
        gg.line([0, r.Ssu], [r.Sse, 0], { color: Plot.serie(0), width: 2.4, label: 'Goodman' });
        gg.line([0, r.Ssy], [r.Ssy, 0], { color: Plot.serie(5), width: 1.6, dash: [5, 4], label: 'escoamento τa + τm = Ssy' });
        gg.marker(379, 241, 'Zimmerli', { color: Plot.serie(2), r: 4 });
        var fim = r.ta > 0 ? Math.min(r.Ssu / r.tm, r.Sse / r.ta) : 0;
        var tmL = r.tm > 0 ? 1 / (r.ta / r.Sse / r.tm + 1 / r.Ssu) : 0;
        gg.line([0, tmL], [0, tmL * r.ta / Math.max(r.tm, 1e-9)], { color: Plot.serie(3), width: 1.4, dash: [3, 3], label: 'reta de carga' });
        gg.marker(r.tm, r.ta, 'operação', { color: r.nf < 1 ? 'rgb(220,60,60)' : Plot.serie(6), r: 5 });
        void fim;
        gg.setLimits([0, r.Ssu * 1.05], [0, Math.max(r.Sse, r.ta) * 1.25]).draw();

        var gy = ctx.plot('fy').clear();
        var ySol = r.L0 - r.Ls;
        gy.line([0, ySol], [0, r.k * ySol], { color: Plot.serie(0), width: 2.4, label: 'F = k·y' });
        gy.vline(ySol, { color: 'rgb(220,60,60)', text: 'mola fechada' });
        gy.marker(r.yMin, Fmin, 'Fmin', { color: Plot.serie(2), r: 4.5 });
        gy.marker(r.yMax, Fmax, 'Fmax', { color: Plot.serie(3), r: 4.5 });
        gy.setLimits([0, ySol * 1.1], [0, r.k * ySol * 1.12]).draw();

        var avisos = [];
        if (r.Cruim) avisos.push('C fora de 4–12');
        if (r.nSolido < 1.2) avisos.push('escoa se fechar');
        if (r.flamba) avisos.push('risco de flambagem');
        if (r.nf < 1) avisos.push('falha por fadiga');
        ctx.setPassos([
          { t: '① Índice de mola e fator de Bergsträsser',
            tex: 'C = \\frac{D}{d} \\qquad K_B = \\frac{4C + 2}{4C - 3}',
            texSub: 'C = \\frac{' + nt(p.D) + '}{' + nt(p.d) + '} = ' + nt(r.C, 4) + ' \\;\\Rightarrow\\; K_B = ' + nt(r.KB, 4),
            obs: r.Cruim ? 'Fora da faixa 4–12: abaixo de 4 a mola é difícil de enrolar e o K_B dispara; acima de 12 ela embaraça e é instável.' : 'Dentro da faixa recomendada de 4 a 12.' },
          { t: '② Rigidez',
            tex: 'k = \\frac{d^4 G}{8 D^3 N_a}',
            texSub: 'k = \\frac{' + nt(p.d) + '^4\\cdot' + nt(r.mt.G * 1000, 4) + '}{8\\cdot' + nt(p.D) + '^3\\cdot' + nt(p.Na) + '} = ' + nt(r.k, 4) + '\\ N/mm' },
          { t: '③ Resistência do fio',
            tex: 'S_{ut} = \\frac{A}{d^{\\,m}}',
            texSub: 'S_{ut} = \\frac{' + r.mt.A + '}{' + nt(p.d) + '^{' + nt(r.mt.b) + '}} = ' + nt(r.Sut, 4) + '\\ MPa,\\quad S_{sy} = ' + nt(r.mt.ssy) + 'S_{ut} = ' + nt(r.Ssy, 4) + ',\\quad S_{su} = ' + nt(r.Ssu, 4) + '\\ MPa' },
          { t: '④ Tensões no fio',
            tex: '\\tau = K_B\\frac{8FD}{\\pi d^3} \\qquad \\tau_a = \\frac{\\tau_{max} - \\tau_{min}}{2} \\qquad \\tau_m = \\frac{\\tau_{max} + \\tau_{min}}{2}',
            texSub: '\\tau_{max} = ' + nt(r.tMax, 4) + ',\\ \\tau_{min} = ' + nt(r.tMin, 4) + '\\ \\Rightarrow\\ \\tau_a = ' + nt(r.ta, 4) + ',\\ \\tau_m = ' + nt(r.tm, 4) + '\\ MPa' },
          { t: '⑤ Verificação estática',
            tex: 'n = \\frac{S_{sy}}{\\tau_{max}}',
            texSub: 'n = \\frac{' + nt(r.Ssy, 4) + '}{' + nt(r.tMax, 4) + '} = ' + nt(r.nEst, 3) + ' \\qquad n_{fechada} = ' + nt(r.nSolido, 3),
            obs: 'A verificação com a mola fechada (comprimido até Ls) garante que ela não perde altura se for comprimida além do previsto na montagem.' },
          { t: '⑥ Fadiga — Goodman com os dados de Zimmerli',
            tex: 'S_{se} = \\frac{S_{sa}}{1 - S_{sm}/S_{su}} \\qquad n_f = \\frac{1}{\\tau_a/S_{se} + \\tau_m/S_{su}}',
            texSub: 'S_{se} = \\frac{241}{1 - 379/' + nt(r.Ssu, 4) + '} = ' + nt(r.Sse, 4) + '\\ MPa \\;\\Rightarrow\\; n_f = ' + nt(r.nf, 3),
            r: r.nf >= 1 ? 'Resiste à fadiga (vida infinita)' : 'Falha por fadiga',
            obs: 'O jateamento de granalha (shot peening) deixa tensões residuais de compressão na superfície e sobe Ssa para 398 MPa.' },
          { t: '⑦ Comprimentos, estabilidade e frequência natural',
            tex: 'L_s = (N_a + 2)d,\\quad L_0 = L_s + 1{,}15\\,y_{max},\\quad f_n = \\frac12\\sqrt{k/m}',
            texSub: 'L_s = ' + nt(r.Ls, 4) + ',\\ L_0 = ' + nt(r.L0, 4) + '\\ mm\\ (\\text{limite } ' + nt(r.LcritFlamb, 4) + '),\\ m = ' + nt(r.massa * 1000, 3) + '\\ g,\\ f_n = ' + nt(r.fn, 4) + '\\ Hz',
            obs: 'A frequência natural deve ficar bem acima (15 a 20 vezes) da frequência da carga — do contrário a mola entra em ressonância (surge), como em molas de válvula de motor.' }
        ]);
        return {
          k: { v: r.k, u: 'N/mm', classe: 'destaque' },
          C: { v: sg(r.C, 3) + ' · ' + sg(r.KB, 3), u: '', classe: r.Cruim ? 'alerta' : '' },
          Sut: { v: sg(r.Sut, 4) + ' · ' + sg(r.Ssy, 4), u: 'MPa' },
          tmax: { v: r.tMax, u: 'MPa' },
          nEst: { v: r.nEst, u: '', classe: r.nEst < 1 ? 'alerta' : '' },
          nSol: { v: r.nSolido, u: '', classe: r.nSolido < 1.2 ? 'alerta' : '' },
          nf: { v: r.nf, u: '', classe: r.nf < 1 ? 'alerta' : 'destaque' },
          L0: { v: sg(r.L0, 3) + ' · ' + sg(r.Ls, 3), u: 'mm' },
          fn: { v: r.fn, u: 'Hz' },
          aviso: { v: avisos.length ? avisos.join(' · ') : 'Projeto aprovado', u: '', classe: avisos.length ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ==========================================================================
     6. Freios e embreagens
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-freio')) return;
    var A = { ctx: null, p: null, r: null, ang: 0, rel: relogio(), on: true };

    function desenharDisco(c, a, p, r) {
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var R = Math.min(a.w * 0.26, a.h * 0.42), cx = a.x + a.w * 0.3, cy = a.y + a.h / 2 + 4;
      var Ri = R * p.ri / p.ro;
      /* anel de atrito colorido pela pressão local */
      var corP = function (f) {
        return 'rgb(' + Math.round(250 - 30 * f) + ',' + Math.round(220 - 150 * f) + ',' + Math.round(120 - 90 * f) + ')';
      };
      var grad = c.createRadialGradient(cx, cy, Ri, cx, cy, R);
      for (var i = 0; i <= 8; i++) {
        var rr = p.ri + (p.ro - p.ri) * i / 8;
        var pr = p.modelo === 'desgaste' ? p.pmax * p.ri / rr : r.pUnif;
        grad.addColorStop(i / 8, corP(pr / p.pmax));
      }
      c.fillStyle = grad;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.arc(cx, cy, Ri, 0, TAU, true); c.fill('evenodd');
      c.strokeStyle = cor; c.lineWidth = 1.4;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      c.beginPath(); c.arc(cx, cy, Ri, 0, TAU); c.stroke();
      /* ranhuras girando */
      c.strokeStyle = cor; c.lineWidth = 1; c.globalAlpha = 0.5;
      for (var k = 0; k < 8; k++) {
        var an = A.ang + k * TAU / 8;
        c.beginPath(); c.moveTo(cx + Ri * Math.cos(an), cy - Ri * Math.sin(an)); c.lineTo(cx + R * Math.cos(an), cy - R * Math.sin(an)); c.stroke();
      }
      c.globalAlpha = 1;
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff'); c.beginPath(); c.arc(cx, cy, Ri * 0.45, 0, TAU); c.fill(); c.stroke();
      rotulo(c, 'ro = ' + p.ro + ' mm', cx, cy - R - 12, cor, 11, '700');
      rotulo(c, 'ri = ' + p.ri, cx, cy - Ri + 14, faint, 10, '600');
      rotulo(c, p.modelo === 'desgaste' ? 'desgaste uniforme: p·r = constante (mais pressão por dentro)' : 'pressão uniforme: disco novo', cx, a.y + a.h - 8, faint, 10.5, '600');
      /* vista lateral com N faces */
      var sx = a.x + a.w * 0.62, larg = 16, gap = 6, nDiscos = p.N + 1;
      var alt = R * 1.6, topo = cy - alt / 2;
      var pressao = 0.5 + 0.5 * Math.sin(A.ang * 0.6);
      var fecha = r.progresso;
      for (var j = 0; j < nDiscos; j++) {
        var xj = sx + j * (larg + gap * (1 - fecha));
        c.fillStyle = j % 2 ? Plot.serie(1) : Plot.serie(0); c.globalAlpha = 0.55;
        c.fillRect(xj, topo, larg, alt); c.globalAlpha = 1;
        c.strokeStyle = cor; c.strokeRect(xj, topo, larg, alt);
      }
      void pressao;
      var xFim = sx + (nDiscos - 1) * (larg + gap * (1 - fecha)) + larg;
      seta(c, xFim + 60, cy, xFim + 8, cy, 'rgb(220,60,60)', 3, 12);
      rotulo(c, 'F = ' + sg(r.F / 1000, 3) + ' kN', xFim + 34, cy - 16, 'rgb(220,60,60)', 11.5, '700');
      rotulo(c, p.N + (p.N === 1 ? ' face' : ' faces') + ' de atrito', (sx + xFim) / 2, topo - 12, cor, 11, '700');
      rotulo(c, 'T = ' + sg(r.T, 4) + ' N·m', (sx + xFim) / 2, topo + alt + 16, Plot.serie(3), 12, '700');
    }
    function desenharCinta(c, a, p, r) {
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var R = Math.min(a.w * 0.18, a.h * 0.28), cx = a.x + a.w * 0.36, cy = a.y + a.h * 0.58;
      var th = p.theta * Math.PI / 180;
      var aIni = -Math.PI / 2 - th / 2, aFim = -Math.PI / 2 + th / 2;   /* tambor gira anti-horário: aFim é o lado tenso */
      /* tambor */
      c.fillStyle = faint; c.globalAlpha = 0.18; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.5; c.stroke();
      for (var k = 0; k < 6; k++) {
        var an = A.ang + k * TAU / 6;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * 0.85 * Math.cos(an), cy - R * 0.85 * Math.sin(an)); c.stroke();
      }
      giro(c, cx, cy, R * 0.35, 1, cor);
      /* cinta: espessura proporcional à tração local */
      var n = 60, Rb = R + 5;
      for (var i = 0; i < n; i++) {
        var a0 = aIni + th * i / n, a1 = aIni + th * (i + 1) / n;
        var P = r.P2 * Math.exp(p.f * th * (i + 0.5) / n);
        c.strokeStyle = 'rgb(' + Math.round(80 + 170 * P / r.P1) + ',90,' + Math.round(200 - 150 * P / r.P1) + ')';
        c.lineWidth = 2 + 7 * P / r.P1;
        c.beginPath(); c.arc(cx, cy, Rb, -a0, -a1, true); c.stroke();
      }
      /* pernas tangentes e forças */
      function ponta(ang, sentido, F, nome, cortxt) {
        var px = cx + Rb * Math.cos(ang), py = cy - Rb * Math.sin(ang);
        var tx = -Math.sin(ang) * sentido, ty = -Math.cos(ang) * sentido;   /* tangente na tela */
        var L = R * 0.55;
        c.strokeStyle = cortxt; c.lineWidth = 2 + 7 * F / r.P1;
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + tx * L, py + ty * L); c.stroke();
        seta(c, px + tx * L, py + ty * L, px + tx * (L + 32), py + ty * (L + 32), cortxt, 2.4, 11);
        /* rótulo ao lado do ponto em que a cinta deixa o tambor (as pernas podem se cruzar) */
        var lado = Math.cos(ang) >= 0 ? 1 : -1;
        rotulo(c, nome + ' = ' + sg(F / 1000, 3) + ' kN', cx + lado * (Rb + 16), py + 4, cortxt, 11.5, '700', lado > 0 ? 'left' : 'right');
      }
      ponta(aFim, 1, r.P1, 'P₁ (tenso)', 'rgb(220,60,60)');
      ponta(aIni, -1, r.P2, 'P₂ (frouxo)', 'rgb(70,110,210)');
      rotulo(c, 'θ = ' + p.theta + '°  ·  P₁/P₂ = exp(fθ) = ' + sg(r.razao, 3), cx, a.y + a.h - 10, cor, 11.5, '700');
      rotulo(c, 'T = (P₁ − P₂)·r = ' + sg(r.T, 4) + ' N·m', a.x + a.w - 10, a.y + 14, Plot.serie(3), 12, '700', 'right');
    }
    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      if (p.tipo === 'disco') desenharDisco(c, a, p, r); else desenharCinta(c, a, p, r);
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('freio');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.r) return;
      /* ciclo de frenagem: gira, aperta, desacelera até parar, solta */
      A.ciclo = (A.ciclo || 0) + dt;
      var T = 5, t = A.ciclo % T, w;
      if (t < 1) { w = 1; A.r.progresso = 0; }
      else if (t < 4) { w = Math.max(0, 1 - (t - 1) / 2.5); A.r.progresso = 1; }
      else { w = 0; A.r.progresso = 1 - (t - 4); }
      A.ang += dt * 5 * w;
      desenha();
    });

    Sim.build('#sim-freio', {
      titulo: 'Freios e embreagens — disco e cinta',
      descricao: 'Numa embreagem de disco o torque depende de como a pressão se distribui: disco novo tem pressão uniforme; depois de amaciado, o desgaste uniforme concentra pressão perto do raio interno e é a hipótese mais conservadora. No freio de cinta a tração cresce exponencialmente ao longo do contato, com e elevado a fθ, o mesmo efeito do cabo enrolado num cabrestante. A energia da frenagem vira calor no tambor ou no disco.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Embreagem de automóvel', desc: 'disco seco, 2 faces, desgaste uniforme', valores: { tipo: 'disco', ro: 120, ri: 80, f: 0.35, pmax: 0.25, N: 2, modelo: 'desgaste', D: 300, b: 60, theta: 270, I: 0.3, rpm: 3000, massa: 6, animar: true } },
        { nome: '2 · Raio interno ótimo', desc: 'ri = ro/√3 dá o máximo torque no desgaste uniforme', valores: { tipo: 'disco', ro: 150, ri: 87, f: 0.3, pmax: 0.8, N: 2, modelo: 'desgaste', D: 300, b: 60, theta: 270, I: 2, rpm: 1500, massa: 10, animar: true } },
        { nome: '3 · Embreagem multidisco em óleo', desc: '8 faces, f = 0,1', valores: { tipo: 'disco', ro: 90, ri: 60, f: 0.1, pmax: 1.5, N: 8, modelo: 'desgaste', D: 300, b: 60, theta: 270, I: 0.5, rpm: 3000, massa: 8, animar: true } },
        { nome: '4 · Freio de cinta', desc: 'θ = 270°, f = 0,25', valores: { tipo: 'cinta', ro: 150, ri: 87, f: 0.25, pmax: 0.2, N: 2, modelo: 'desgaste', D: 400, b: 60, theta: 270, I: 2, rpm: 1500, massa: 25, animar: true } },
        { nome: '5 · Cinta com duas voltas', desc: 'θ = 540°: P₁/P₂ ≈ 10', valores: { tipo: 'cinta', ro: 150, ri: 87, f: 0.25, pmax: 0.2, N: 2, modelo: 'desgaste', D: 400, b: 60, theta: 540, I: 2, rpm: 1500, massa: 25, animar: true } }
      ],
      controles: [
        { id: 'tipo', tipo: 'seg', label: 'Dispositivo', valor: 'disco', opcoes: [{ v: 'disco', t: 'Embreagem de disco' }, { v: 'cinta', t: 'Freio de cinta' }] },
        { id: 'f', label: 'Coeficiente de atrito f', min: 0.05, max: 0.6, step: 0.01, valor: 0.3, unidade: '' },
        { id: 'pmax', label: 'Pressão máxima admissível', min: 0.05, max: 3, step: 0.01, valor: 0.8, unidade: 'MPa' },
        { tipo: 'titulo', label: 'Disco' },
        { id: 'ro', label: 'Raio externo ro', min: 30, max: 300, step: 1, valor: 150, unidade: 'mm' },
        { id: 'ri', label: 'Raio interno ri', min: 10, max: 290, step: 1, valor: 87, unidade: 'mm' },
        { id: 'N', label: 'Número de faces de atrito', min: 1, max: 12, step: 1, valor: 2, unidade: '' },
        { id: 'modelo', tipo: 'seg', label: 'Hipótese', valor: 'desgaste', opcoes: [{ v: 'desgaste', t: 'Desgaste uniforme' }, { v: 'pressao', t: 'Pressão uniforme' }] },
        { tipo: 'titulo', label: 'Cinta' },
        { id: 'D', label: 'Diâmetro do tambor', min: 100, max: 1000, step: 5, valor: 400, unidade: 'mm' },
        { id: 'b', label: 'Largura da cinta', min: 20, max: 200, step: 1, valor: 60, unidade: 'mm' },
        { id: 'theta', label: 'Ângulo de abraçamento θ', min: 90, max: 720, step: 5, valor: 270, unidade: '°' },
        { tipo: 'titulo', label: 'Frenagem' },
        { id: 'I', label: 'Inércia da carga', min: 0.01, max: 50, step: 0.01, valor: 2, unidade: 'kg·m²' },
        { id: 'rpm', label: 'Rotação inicial', min: 100, max: 6000, step: 10, valor: 1500, unidade: 'rpm' },
        { id: 'massa', label: 'Massa que absorve o calor', min: 0.5, max: 100, step: 0.5, valor: 10, unidade: 'kg', desc: 'ferro fundido, c = 500 J/kg·K' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'freio', axes: false, height: 340, grid: false, legend: false },
        { id: 'g1', titulo: '', xlabel: '', ylabel: '', aspect: 0.45, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'F', label: 'Força de acionamento' },
        { id: 'T', label: 'Torque de frenagem' },
        { id: 'comp', label: 'Comparação' },
        { id: 'E', label: 'Energia dissipada' },
        { id: 't', label: 'Tempo de parada' },
        { id: 'dT', label: 'Aquecimento' }
      ],
      formulas: [
        { g: 'Embreagem de disco (por face)' },
        { tex: 'F = 2\\pi p_a r_i (r_o - r_i) \\qquad T = N f F\\,\\frac{r_o + r_i}{2}', d: 'desgaste uniforme: p·r = constante = p_a·r_i', destaque: true },
        { tex: 'F = \\pi p_a (r_o^2 - r_i^2) \\qquad T = N f F\\,\\frac{2}{3}\\frac{r_o^3 - r_i^3}{r_o^2 - r_i^2}', d: 'pressão uniforme (disco novo)', destaque: true },
        { tex: 'r_i = \\frac{r_o}{\\sqrt 3} \\approx 0{,}577\\,r_o', d: 'raio interno que maximiza o torque no desgaste uniforme' },
        { g: 'Freio de cinta' },
        { tex: '\\frac{P_1}{P_2} = e^{f\\theta} \\qquad T = (P_1 - P_2)\\,r', d: 'P₁ no lado para onde o tambor gira', destaque: true },
        { tex: 'p_{max} = \\frac{P_1}{b\\,r}', d: 'pressão máxima na cinta, junto ao lado tenso' },
        { g: 'Energia e temperatura' },
        { tex: 'E = \\frac12 I(\\omega_1^2 - \\omega_2^2) \\qquad t = \\frac{I\\,\\Delta\\omega}{T}', d: 'torque de frenagem constante', destaque: true },
        { tex: '\\Delta T = \\frac{E}{m\\,c}', d: 'aquecimento se todo o calor ficar na massa m (frenagem rápida)' }
      ],
      passos: [],
      nota: 'Coeficiente de atrito constante. Na cinta, a pressão máxima define P₁. No aquecimento supõe-se que a frenagem é curta demais para perder calor para o ambiente.',
      calcular: function (p, ctx) {
        var ri = Math.min(p.ri, p.ro - 2), r, passos = [], out = {};
        var g = ctx.plot('g1').clear();
        if (p.tipo === 'disco') {
          var dw = EM2.embreagem({ ro: p.ro, ri: ri, f: p.f, pmax: p.pmax, N: p.N, modelo: 'desgaste' });
          var dp = EM2.embreagem({ ro: p.ro, ri: ri, f: p.f, pmax: p.pmax, N: p.N, modelo: 'pressao' });
          r = p.modelo === 'desgaste' ? dw : dp;
          /* com a mesma força, a pressão uniforme equivalente */
          r.pUnif = r.F / (Math.PI * (Math.pow(p.ro / 1000, 2) - Math.pow(ri / 1000, 2))) / 1e6;
          /* T × ri/ro */
          var xs = Plot.linspace(0.05, 0.98, 90);
          g.o.titulo = 'Torque × razão de raios (mesmo ro e p_a)';
          g.o.xlabel = 'ri / ro'; g.o.ylabel = 'Torque (N·m)';
          g.line(xs, xs.map(function (x) { return EM2.embreagem({ ro: p.ro, ri: x * p.ro, f: p.f, pmax: p.pmax, N: p.N, modelo: 'desgaste' }).T; }), { color: Plot.serie(0), width: 2.4, label: 'desgaste uniforme' });
          g.line(xs, xs.map(function (x) { return EM2.embreagem({ ro: p.ro, ri: x * p.ro, f: p.f, pmax: p.pmax, N: p.N, modelo: 'pressao' }).T; }), { color: Plot.serie(1), width: 2.4, label: 'pressão uniforme' });
          g.vline(1 / Math.sqrt(3), { color: Plot.serie(5), text: 'ro/√3' });
          g.marker(ri / p.ro, r.T, 'seu disco', { color: 'rgb(220,60,60)', r: 5 });
          g.setLimits([0, 1], [0, dp.T * 1.6]);
          var rmedW = (p.ro + ri) / 2, rmedP = 2 / 3 * (Math.pow(p.ro, 3) - Math.pow(ri, 3)) / (p.ro * p.ro - ri * ri);
          passos.push({ t: '① Força de acionamento (' + (p.modelo === 'desgaste' ? 'desgaste uniforme' : 'pressão uniforme') + ')',
            tex: p.modelo === 'desgaste' ? 'F = 2\\pi p_a r_i (r_o - r_i)' : 'F = \\pi p_a (r_o^2 - r_i^2)',
            texSub: p.modelo === 'desgaste' ? 'F = 2\\pi\\cdot' + nt(p.pmax * 1e6, 3) + '\\cdot' + nt(ri / 1000, 3) + '\\cdot(' + nt(p.ro / 1000, 3) + ' - ' + nt(ri / 1000, 3) + ') = ' + nt(r.F, 4) + '\\ N'
              : 'F = \\pi\\cdot' + nt(p.pmax * 1e6, 3) + '\\cdot(' + nt(p.ro / 1000, 3) + '^2 - ' + nt(ri / 1000, 3) + '^2) = ' + nt(r.F, 4) + '\\ N',
            obs: p.modelo === 'desgaste' ? 'A pressão máxima acontece no raio interno. Com desgaste uniforme, p·r é constante: o disco desgasta mais depressa por fora (maior velocidade) até que a pressão lá caia.' : 'Hipótese válida só para o disco novo, perfeitamente plano e rígido.' });
          passos.push({ t: '② Torque',
            tex: 'T = N f F\\,r_{med}',
            texSub: 'r_{med} = ' + nt(p.modelo === 'desgaste' ? rmedW : rmedP, 4) + '\\ mm \\;\\Rightarrow\\; T = ' + p.N + '\\cdot' + nt(p.f) + '\\cdot' + nt(r.F, 4) + '\\cdot' + nt((p.modelo === 'desgaste' ? rmedW : rmedP) / 1000, 4) + ' = ' + nt(r.T, 4) + '\\ N\\cdot m' });
          passos.push({ t: '③ Comparando as hipóteses com a mesma força F',
            tex: '\\frac{T_{desgaste}}{T_{pressão}} = \\frac{(r_o + r_i)/2}{\\frac23\\frac{r_o^3 - r_i^3}{r_o^2 - r_i^2}}',
            texSub: '= \\frac{' + nt(rmedW, 4) + '}{' + nt(rmedP, 4) + '} = ' + nt(rmedW / rmedP, 4),
            obs: 'O desgaste uniforme dá sempre um pouco menos de torque para a mesma força: por isso é a hipótese de projeto — a embreagem continua transmitindo o torque depois de amaciada.' });
          out.F = { v: r.F / 1000, u: 'kN' };
          out.comp = { v: 'T(desg.) / T(press.) = ' + sg(rmedW / rmedP, 4), u: 'mesma F' };
        } else {
          var P1 = p.pmax * 1e6 * (p.b / 1000) * (p.D / 2000);
          r = EM2.cinta({ theta: p.theta, f: p.f, P1: P1, D: p.D, b: p.b });
          r.F = r.P1;
          var al = Plot.linspace(0, p.theta, 100);
          g.o.titulo = 'Tração ao longo da cinta';
          g.o.xlabel = 'Ângulo a partir do lado frouxo (°)'; g.o.ylabel = 'Tração (kN)';
          g.line(al, al.map(function (x) { return r.P2 * Math.exp(p.f * x * Math.PI / 180) / 1000; }), { color: 'rgb(220,60,60)', width: 2.4, label: 'P(α) = P₂·exp(fα)' });
          g.area(al, al.map(function (x) { return r.P2 * Math.exp(p.f * x * Math.PI / 180) / 1000; }), { color: 'rgb(220,60,60)', alpha: 0.08 });
          g.setLimits([0, p.theta], [0, r.P1 / 1000 * 1.15]);
          passos.push({ t: '① Tração no lado tenso pela pressão admissível',
            tex: 'P_1 = p_{max}\\,b\\,r',
            texSub: 'P_1 = ' + nt(p.pmax * 1e6, 3) + '\\cdot' + nt(p.b / 1000) + '\\cdot' + nt(p.D / 2000) + ' = ' + nt(r.P1, 4) + '\\ N' });
          passos.push({ t: '② Relação entre as trações',
            tex: '\\frac{P_1}{P_2} = e^{f\\theta}',
            texSub: 'e^{' + nt(p.f) + '\\cdot' + nt(p.theta * Math.PI / 180, 4) + '} = ' + nt(r.razao, 4) + ' \\;\\Rightarrow\\; P_2 = ' + nt(r.P2, 4) + '\\ N',
            obs: 'Cada volta a mais multiplica a razão por exp(2πf) = ' + sg(Math.exp(TAU * p.f), 3) + ': é assim que um marinheiro segura um navio com um cabo enrolado no cabeço.' });
          passos.push({ t: '③ Torque de frenagem',
            tex: 'T = (P_1 - P_2)\\,r',
            texSub: 'T = (' + nt(r.P1, 4) + ' - ' + nt(r.P2, 4) + ')\\cdot' + nt(p.D / 2000) + ' = ' + nt(r.T, 4) + '\\ N\\cdot m',
            obs: 'Se o tambor girar ao contrário, P₁ e P₂ trocam de lado: com a mesma força no lado frouxo o torque cai muito. Freios de cinta são fortemente direcionais.' });
          out.F = { v: r.P1 / 1000, u: 'kN (P₁)' };
          out.comp = { v: 'P₁/P₂ = ' + sg(r.razao, 4), u: '' };
        }
        g.draw();
        var fr = EM2.frenagem({ I: p.I, rpm1: p.rpm, rpm2: 0, T: r.T, m: p.massa, c: 500 });
        passos.push({ t: '④ Energia, tempo de parada e aquecimento',
          tex: 'E = \\tfrac12 I\\omega^2,\\quad t = \\frac{I\\omega}{T},\\quad \\Delta T = \\frac{E}{mc}',
          texSub: '\\omega = ' + nt(p.rpm * TAU / 60, 4) + '\\ rad/s \\Rightarrow E = ' + nt(fr.E / 1000, 4) + '\\ kJ,\\ t = ' + nt(fr.t, 3) + '\\ s,\\ \\Delta T = ' + nt(fr.dT, 3) + '\\ K',
          obs: 'Potência média dissipada: ' + sg(fr.P / 1000, 3) + ' kW. Frenagens repetidas acumulam calor; acima de ~250 °C o coeficiente de atrito cai (fading).' });
        A.ctx = ctx; A.p = { tipo: p.tipo, ro: p.ro, ri: ri, pmax: p.pmax, N: p.N, modelo: p.modelo, f: p.f, theta: p.theta };
        r.progresso = A.r ? A.r.progresso || 0 : 0;
        A.r = r; A.on = !!p.animar;
        desenha();
        ctx.setPassos(passos);
        out.T = { v: r.T, u: 'N·m', classe: 'destaque' };
        out.E = { v: fr.E / 1000, u: 'kJ' };
        out.t = { v: fr.t, u: 's' };
        out.dT = { v: fr.dT, u: 'K', classe: fr.dT > 150 ? 'alerta' : '' };
        return out;
      }
    });
  })();
})();

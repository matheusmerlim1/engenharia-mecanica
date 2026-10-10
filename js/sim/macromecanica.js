/* ==========================================================================
   Macromecânica dos compósitos — modelos (sem DOM, conferidos em node)
   --------------------------------------------------------------------------
     · micro      regra das misturas, regra inversa e Halpin-Tsai; frações
                  volumétricas e mássicas, vazios, massa específica
     · Q / Qbar   lâmina ortotrópica em estado plano de tensão e a rigidez
                  transformada de uma lâmina fora de eixo
     · foraEixo   constantes aparentes Ex, Ey, Gxy, νxy e o acoplamento ηxy
     · clt        teoria clássica dos laminados: matrizes A, B e D, constantes
                  do laminado e tensões camada a camada
     · termico    forças e momentos térmicos/higroscópicos equivalentes
     · criterios  tensão máxima, Tsai-Hill e Tsai-Wu
   ========================================================================== */
(function (global) {
  'use strict';
  var MMC = {};
  var rad = function (g) { return g * Math.PI / 180; };
  MMC.rad = rad;

  /* ---------------- biblioteca de constituintes ---------------- */
  MMC.fibras = {
    vidroE: { nome: 'Vidro-E', E: 73, Er: 73, G: 29.9, nu: 0.22, rho: 2.54, sut: 2000, alfa: 5.0e-6 },
    vidroS: { nome: 'Vidro-S', E: 86, Er: 86, G: 35.2, nu: 0.22, rho: 2.49, sut: 2800, alfa: 5.6e-6 },
    carbonoHR: { nome: 'Carbono alta resistência (PAN)', E: 230, Er: 15, G: 22, nu: 0.20, rho: 1.76, sut: 3500, alfa: -0.5e-6 },
    carbonoHM: { nome: 'Carbono alto módulo', E: 380, Er: 12, G: 20, nu: 0.20, rho: 1.90, sut: 2300, alfa: -1.0e-6 },
    aramida: { nome: 'Aramida', E: 124, Er: 5.4, G: 2.9, nu: 0.35, rho: 1.44, sut: 3600, alfa: -4.0e-6 },
    boro: { nome: 'Boro', E: 400, Er: 400, G: 167, nu: 0.20, rho: 2.57, sut: 3600, alfa: 4.5e-6 }
  };
  MMC.matrizes = {
    epoxi: { nome: 'Epóxi', E: 3.4, nu: 0.35, rho: 1.20, sut: 70, alfa: 60e-6, Tg: 120 },
    poliester: { nome: 'Poliéster', E: 3.0, nu: 0.37, rho: 1.20, sut: 55, alfa: 80e-6, Tg: 90 },
    fenolica: { nome: 'Fenólica', E: 4.4, nu: 0.36, rho: 1.30, sut: 50, alfa: 45e-6, Tg: 220 },
    peek: { nome: 'PEEK (termoplástico)', E: 3.7, nu: 0.37, rho: 1.32, sut: 95, alfa: 47e-6, Tg: 143 },
    pa66: { nome: 'Poliamida 6.6 (termoplástico)', E: 2.8, nu: 0.39, rho: 1.14, sut: 80, alfa: 90e-6, Tg: 60 }
  };

  /* ---------------- lâminas de catálogo (valores de projeto) ---------------- */
  MMC.laminas = {
    vidro: {
      nome: 'Vidro-E/epóxi (Vf ≈ 0,55)', E1: 41.7, E2: 10.3, G12: 4.0, n12: 0.28,
      a1: 7.0e-6, a2: 24e-6, b1: 0.0, b2: 0.35, rho: 1.94,
      Xt: 1020, Xc: 620, Yt: 40, Yc: 140, S: 60, e1t: 0.0245, e2t: 0.0039, g12u: 0.015
    },
    vidroS: {
      nome: 'Vidro-S/epóxi (Vf ≈ 0,60)', E1: 55, E2: 16, G12: 7.6, n12: 0.28,
      a1: 6.6e-6, a2: 20e-6, b1: 0.0, b2: 0.33, rho: 2.00,
      Xt: 1620, Xc: 690, Yt: 40, Yc: 140, S: 80, e1t: 0.0295, e2t: 0.0025, g12u: 0.0105
    },
    carbono: {
      nome: 'Carbono/epóxi (T300, Vf ≈ 0,60)', E1: 134, E2: 7.0, G12: 4.2, n12: 0.25,
      a1: -0.3e-6, a2: 28e-6, b1: 0.0, b2: 0.44, rho: 1.58,
      Xt: 1270, Xc: 1130, Yt: 42, Yc: 141, S: 63, e1t: 0.0095, e2t: 0.0060, g12u: 0.015
    },
    carbonoIM: {
      nome: 'Carbono IM/epóxi (Vf ≈ 0,60)', E1: 160, E2: 9.0, G12: 5.6, n12: 0.28,
      a1: -0.2e-6, a2: 27e-6, b1: 0.0, b2: 0.44, rho: 1.57,
      Xt: 2000, Xc: 1200, Yt: 55, Yc: 180, S: 90, e1t: 0.0125, e2t: 0.0061, g12u: 0.016
    },
    aramida: {
      nome: 'Aramida/epóxi (Vf ≈ 0,60)', E1: 76, E2: 5.5, G12: 2.0, n12: 0.35,
      a1: -4.0e-6, a2: 58e-6, b1: 0.0, b2: 0.50, rho: 1.38,
      Xt: 1380, Xc: 280, Yt: 28, Yc: 140, S: 55, e1t: 0.0182, e2t: 0.0051, g12u: 0.0275
    }
  };
  MMC.opcoesLamina = function () {
    var out = [];
    Object.keys(MMC.laminas).forEach(function (k) { out.push({ v: k, t: MMC.laminas[k].nome }); });
    return out;
  };

  /* ---------------- micromecânica ---------------- */
  /* p = { Vf, Vv, fibra, matriz, xi } — módulos em GPa, ρ em g/cm³ */
  MMC.micro = function (p) {
    var f = MMC.fibras[p.fibra] || MMC.fibras.vidroE;
    var m = MMC.matrizes[p.matriz] || MMC.matrizes.epoxi;
    var Vv = p.Vv || 0, Vf = p.Vf, Vm = 1 - Vf - Vv;
    if (Vm < 0) { Vm = 0; Vf = Math.max(0, 1 - Vv); }
    var Gm = m.E / (2 * (1 + m.nu));
    var E1 = f.E * Vf + m.E * Vm;
    var E2inv = 1 / (Vf / f.Er + Vm / m.E);
    var G12inv = 1 / (Vf / f.G + Vm / Gm);
    var n12 = f.nu * Vf + m.nu * Vm;
    var xi = p.xi == null ? 2 : p.xi;
    function ht(Mm, Mf, x) {
      var r = Mf / Mm, eta = (r - 1) / (r + x);
      return Mm * (1 + x * eta * Vf) / (1 - eta * Vf);
    }
    var E2ht = ht(m.E, f.Er, xi), G12ht = ht(Gm, f.G, 1);
    var rho = f.rho * Vf + m.rho * Vm;        /* vazios não têm massa */
    var Wf = rho > 0 ? f.rho * Vf / rho : 0;
    /* resistência longitudinal e frações mínima e crítica */
    var efu = f.sut / (f.E * 1000);           /* deformação de ruptura da fibra */
    var smEstrela = Math.min(m.E * 1000 * efu, m.sut);
    var s1u = f.sut * Vf + smEstrela * Vm;
    var Vcrit = (m.sut - smEstrela) / (f.sut - smEstrela);
    var Vmin = (m.sut - smEstrela) / (f.sut + m.sut - smEstrela);
    return {
      f: f, m: m, Vf: Vf, Vm: Vm, Vv: Vv, Gm: Gm, Wf: Wf,
      E1: E1, E2inv: E2inv, E2ht: E2ht, G12inv: G12inv, G12ht: G12ht,
      n12: n12, rho: rho, efu: efu, smEstrela: smEstrela, s1u: s1u,
      Vcrit: Vcrit > 0 ? Vcrit : 0, Vmin: Vmin > 0 ? Vmin : 0
    };
  };
  /* frações a partir de massas (ensaio de calcinação / digestão ácida) */
  MMC.fracoes = function (mc, mf, vol, rf, rm) {
    var mm = mc - mf, rc = mc / vol;
    var Wf = mf / mc, Wm = mm / mc;
    var Vf = (mf / rf) / vol, Vm = (mm / rm) / vol;
    var rteo = 1 / (Wf / rf + Wm / rm);
    return { mm: mm, rc: rc, Wf: Wf, Wm: Wm, Vf: Vf, Vm: Vm, Vv: 1 - Vf - Vm, rteo: rteo };
  };

  /* ---------------- lâmina ortotrópica em EPT ---------------- */
  MMC.Q = function (E1, E2, G12, n12) {
    var n21 = n12 * E2 / E1, d = 1 - n12 * n21;
    return { n21: n21, den: d, Q11: E1 / d, Q22: E2 / d, Q12: n12 * E2 / d, Q66: G12, Q16: 0, Q26: 0 };
  };
  MMC.Qbar = function (Q, th) {
    var c = Math.cos(th), s = Math.sin(th);
    var c2 = c * c, s2 = s * s, c4 = c2 * c2, s4 = s2 * s2, cs = c2 * s2;
    var a = Q.Q11, b = Q.Q22, d = Q.Q12, g = Q.Q66;
    return {
      Q11: a * c4 + 2 * (d + 2 * g) * cs + b * s4,
      Q22: a * s4 + 2 * (d + 2 * g) * cs + b * c4,
      Q12: (a + b - 4 * g) * cs + d * (c4 + s4),
      Q66: (a + b - 2 * d - 2 * g) * cs + g * (c4 + s4),
      Q16: (a - d - 2 * g) * c2 * c * s + (d - b + 2 * g) * c * s2 * s,
      Q26: (a - d - 2 * g) * c * s2 * s + (d - b + 2 * g) * c2 * c * s
    };
  };
  MMC.toM = function (q) {
    return [[q.Q11, q.Q12, q.Q16], [q.Q12, q.Q22, q.Q26], [q.Q16, q.Q26, q.Q66]];
  };
  /* constantes aparentes de uma lâmina a θ do eixo de carga */
  MMC.foraEixo = function (E1, E2, G12, n12, th) {
    var S11 = 1 / E1, S22 = 1 / E2, S12 = -n12 / E1, S66 = 1 / G12;
    var c = Math.cos(th), s = Math.sin(th);
    var c2 = c * c, s2 = s * s, c4 = c2 * c2, s4 = s2 * s2, cs = c2 * s2;
    var s11 = S11 * c4 + (2 * S12 + S66) * cs + S22 * s4;
    var s22 = S11 * s4 + (2 * S12 + S66) * cs + S22 * c4;
    var s12 = S12 * (c4 + s4) + (S11 + S22 - S66) * cs;
    var s66 = 2 * (2 * S11 + 2 * S22 - 4 * S12 - S66) * cs + S66 * (c4 + s4);
    var s16 = (2 * S11 - 2 * S12 - S66) * c2 * c * s - (2 * S22 - 2 * S12 - S66) * c * s2 * s;
    var s26 = (2 * S11 - 2 * S12 - S66) * c * s2 * s - (2 * S22 - 2 * S12 - S66) * c2 * c * s;
    return {
      Ex: 1 / s11, Ey: 1 / s22, Gxy: 1 / s66, nxy: -s12 / s11,
      etax: s16 / s11, etay: s26 / s22,
      S11: s11, S22: s22, S12: s12, S66: s66, S16: s16
    };
  };

  /* ---------------- álgebra 3×3 ---------------- */
  MMC.mul = function (A, b) {
    return A.map(function (l) { return l[0] * b[0] + l[1] * b[1] + l[2] * b[2]; });
  };
  MMC.inv3 = function (M) {
    var a = M[0][0], b = M[0][1], c = M[0][2];
    var d = M[1][0], e = M[1][1], f = M[1][2];
    var g = M[2][0], h = M[2][1], i = M[2][2];
    var A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    var det = a * A + b * B + c * C;
    if (!det) det = 1e-30;
    return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
  };
  /* tensões: [σ1 σ2 τ12] = Ts(θ)·[σx σy τxy] */
  MMC.Ts = function (th) {
    var c = Math.cos(th), s = Math.sin(th);
    return [[c * c, s * s, 2 * c * s], [s * s, c * c, -2 * c * s], [-c * s, c * s, c * c - s * s]];
  };
  /* deformações (γ de engenharia) */
  MMC.Te = function (th) {
    var c = Math.cos(th), s = Math.sin(th);
    return [[c * c, s * s, c * s], [s * s, c * c, -c * s], [-2 * c * s, 2 * c * s, c * c - s * s]];
  };

  /* ---------------- teoria clássica dos laminados ----------------
     mat em MPa, espessuras em mm → A [N/mm], B [N], D [N·mm] */
  MMC.clt = function (mat, camadas) {
    var Q = MMC.Q(mat.E1, mat.E2, mat.G12, mat.n12);
    var h = 0, i, j;
    camadas.forEach(function (c) { h += c.t; });
    var z = -h / 2;
    var A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      B = [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
      D = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    var info = [];
    camadas.forEach(function (c) {
      var z0 = z, z1 = z + c.t;
      var Qb = MMC.toM(MMC.Qbar(Q, rad(c.th)));
      for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) {
        A[i][j] += Qb[i][j] * (z1 - z0);
        B[i][j] += Qb[i][j] * (z1 * z1 - z0 * z0) / 2;
        D[i][j] += Qb[i][j] * (z1 * z1 * z1 - z0 * z0 * z0) / 3;
      }
      info.push({ th: c.th, t: c.t, z0: z0, z1: z1, zm: (z0 + z1) / 2, Qb: Qb });
      z = z1;
    });
    /* constantes do laminado a partir de a = A⁻¹ */
    var a = MMC.inv3(A);
    var cons = {
      Ex: 1 / (a[0][0] * h), Ey: 1 / (a[1][1] * h), Gxy: 1 / (a[2][2] * h),
      nxy: -a[0][1] / a[0][0], nyx: -a[0][1] / a[1][1]
    };
    /* classificação */
    var maxA = Math.max(Math.abs(A[0][0]), Math.abs(A[1][1]), 1e-30);
    var maxD = Math.max(Math.abs(D[0][0]), Math.abs(D[1][1]), 1e-30);
    var simetrico = Math.max(Math.abs(B[0][0]), Math.abs(B[0][1]), Math.abs(B[1][1]),
      Math.abs(B[0][2]), Math.abs(B[1][2]), Math.abs(B[2][2])) / (maxA * h) < 1e-6;
    var equilibrado = (Math.abs(A[0][2]) + Math.abs(A[1][2])) / maxA < 1e-6;
    var torcao = (Math.abs(D[0][2]) + Math.abs(D[1][2])) / maxD < 1e-6;
    return {
      Q: Q, A: A, B: B, D: D, a: a, h: h, info: info, cons: cons,
      simetrico: simetrico, equilibrado: equilibrado, semTorcao: torcao
    };
  };
  /* resolve {N;M} = [[A,B],[B,D]]·{e0;k} (Gauss-Jordan 6×6) */
  MMC.resolve6 = function (A, B, D, N, M) {
    var K = [], i, j, c, p, f;
    for (i = 0; i < 3; i++) K.push([A[i][0], A[i][1], A[i][2], B[i][0], B[i][1], B[i][2], N[i]]);
    for (i = 0; i < 3; i++) K.push([B[i][0], B[i][1], B[i][2], D[i][0], D[i][1], D[i][2], M[i]]);
    for (c = 0; c < 6; c++) {
      p = c;
      for (i = c + 1; i < 6; i++) if (Math.abs(K[i][c]) > Math.abs(K[p][c])) p = i;
      var t = K[c]; K[c] = K[p]; K[p] = t;
      if (!K[c][c]) K[c][c] = 1e-30;
      for (i = 0; i < 6; i++) {
        if (i === c) continue;
        f = K[i][c] / K[c][c];
        for (j = c; j <= 6; j++) K[i][j] -= f * K[c][j];
      }
    }
    var x = [];
    for (i = 0; i < 6; i++) x.push(K[i][6] / K[i][i]);
    return { e0: [x[0], x[1], x[2]], k: [x[3], x[4], x[5]] };
  };
  /* forças e momentos equivalentes de temperatura e de umidade */
  MMC.termico = function (c, mat, dT, dC) {
    var NT = [0, 0, 0], MT = [0, 0, 0];
    c.info.forEach(function (k) {
      var th = rad(k.th), m = Math.cos(th), n = Math.sin(th);
      var a1 = mat.a1 * dT + (mat.b1 || 0) * (dC || 0);
      var a2 = mat.a2 * dT + (mat.b2 || 0) * (dC || 0);
      var ex = a1 * m * m + a2 * n * n;
      var ey = a1 * n * n + a2 * m * m;
      var exy = 2 * (a1 - a2) * m * n;
      var fz = MMC.mul(k.Qb, [ex, ey, exy]);
      for (var i = 0; i < 3; i++) {
        NT[i] += fz[i] * (k.z1 - k.z0);
        MT[i] += fz[i] * (k.z1 * k.z1 - k.z0 * k.z0) / 2;
      }
      k.livre = [ex, ey, exy];
    });
    return { NT: NT, MT: MT };
  };
  /* estado em cada camada, dados e0, k e (opcionalmente) a dilatação livre.
     usarLivre precisa ser pedido: sem ele a parcela higrotérmica não entra,
     mesmo que MMC.termico tenha sido chamado antes para o mesmo laminado. */
  MMC.camadas = function (c, e0, k, usarLivre) {
    return c.info.map(function (q) {
      var tot = [e0[0] + q.zm * k[0], e0[1] + q.zm * k[1], e0[2] + q.zm * k[2]];
      var liv = usarLivre ? (q.livre || [0, 0, 0]) : [0, 0, 0];
      var mec = [tot[0] - liv[0], tot[1] - liv[1], tot[2] - liv[2]];
      var sxy = MMC.mul(q.Qb, mec);
      return {
        th: q.th, zm: q.zm, t: q.t, exy: tot, mec: mec, sxy: sxy,
        s12: MMC.mul(MMC.Ts(rad(q.th)), sxy),
        e12: MMC.mul(MMC.Te(rad(q.th)), tot)
      };
    });
  };

  /* ---------------- critérios de falha ---------------- */
  /* s = [σ1, σ2, τ12] em MPa; R com Xt, Xc, Yt, Yc, S (magnitudes) */
  MMC.criterios = function (s, R, f12) {
    var s1 = s[0], s2 = s[1], t = s[2];
    var X = s1 >= 0 ? R.Xt : R.Xc, Y = s2 >= 0 ? R.Yt : R.Yc;
    var r1 = Math.abs(s1) / X, r2 = Math.abs(s2) / Y, r6 = Math.abs(t) / R.S;
    var pior = r1 >= r2 && r1 >= r6 ? 'fibra' : r2 >= r6 ? 'matriz' : 'cisalhamento';
    var maxR = Math.max(r1, r2, r6);
    var ih = (s1 / X) * (s1 / X) - s1 * s2 / (X * X) + (s2 / Y) * (s2 / Y) + (t / R.S) * (t / R.S);
    var F1 = 1 / R.Xt - 1 / R.Xc, F2 = 1 / R.Yt - 1 / R.Yc;
    var F11 = 1 / (R.Xt * R.Xc), F22 = 1 / (R.Yt * R.Yc), F66 = 1 / (R.S * R.S);
    var F12 = (f12 == null ? -0.5 : f12) * Math.sqrt(F11 * F22);
    var qa = F11 * s1 * s1 + F22 * s2 * s2 + F66 * t * t + 2 * F12 * s1 * s2;
    var qb = F1 * s1 + F2 * s2;
    var fsWu = qa > 1e-30 ? (-qb + Math.sqrt(qb * qb + 4 * qa)) / (2 * qa) : Infinity;
    return {
      r1: r1, r2: r2, r6: r6, modo: pior, X: X, Y: Y,
      fsMax: maxR > 0 ? 1 / maxR : Infinity,
      ih: ih, fsHill: ih > 0 ? 1 / Math.sqrt(ih) : Infinity,
      iw: qa + qb, fsWu: fsWu,
      F1: F1, F2: F2, F11: F11, F22: F22, F66: F66, F12: F12
    };
  };
  /* critério da deformação máxima */
  MMC.defMax = function (e, R, mat) {
    var e1t = R.e1t, e2t = R.e2t, g = R.g12u;
    var e1c = R.Xc / (mat.E1 * 1000), e2c = R.Yc / (mat.E2 * 1000);
    var r1 = Math.abs(e[0]) / (e[0] >= 0 ? e1t : e1c);
    var r2 = Math.abs(e[1]) / (e[1] >= 0 ? e2t : e2c);
    var r6 = Math.abs(e[2]) / g;
    var m = Math.max(r1, r2, r6);
    return { r1: r1, r2: r2, r6: r6, fs: m > 0 ? 1 / m : Infinity };
  };
  /* resistência de uma lâmina fora de eixo sob σx uniaxial */
  MMC.foraEixoResistencia = function (th, R, f12) {
    var c = Math.cos(th), s = Math.sin(th);
    var c2 = c * c, s2 = s * s, cs = c * s;
    function fs(sx) { return MMC.criterios([sx * c2, sx * s2, -sx * cs], R, f12); }
    var u = fs(1);
    return {
      maxTensao: u.fsMax, hill: u.fsHill, wu: u.fsWu, modo: u.modo,
      maxComp: fs(-1).fsMax, hillComp: fs(-1).fsHill, wuComp: fs(-1).fsWu
    };
  };
  /* pilha a partir de uma lista de ângulos, com simetria opcional */
  MMC.pilha = function (angs, t, simetrico) {
    var out = angs.map(function (a) { return { th: a, t: t }; });
    if (simetrico) {
      for (var i = angs.length - 1; i >= 0; i--) out.push({ th: angs[i], t: t });
    }
    return out;
  };
  MMC.rotuloPilha = function (angs, simetrico, rep) {
    var s = '[' + angs.map(function (a) {
      return (a > 0 ? '+' : '') + (Math.round(a * 10) / 10).toString().replace('.', ',');
    }).join('/') + ']';
    if (rep && rep > 1) s += '<sub>' + rep + '</sub>';
    return s + (simetrico ? 'S' : 'T');
  };

  global.MMC = MMC;
})(window);

/* ==========================================================================
   Simuladores
     1. sim-micromecanica : da fibra e da matriz às propriedades da lâmina
     2. sim-fora-eixo     : rigidez transformada e constantes aparentes
     3. sim-laminado      : empilhamento → matrizes A, B, D
     4. sim-falha         : envelopes de tensão máxima, Tsai-Hill e Tsai-Wu
     5. sim-progressiva   : cura, tensões térmicas e falha ply-by-ply
   ========================================================================== */
(function () {
  'use strict';
  var MMC = window.MMC;
  var nt = function (v, n) { return Plot.numTex(v, n || 4); };
  var sg = function (v, n) { return Plot.sig(v, n || 4); };
  var pt = function (v, n) { return String(sg(v, n)).replace('.', ','); };
  var rad = MMC.rad;

  function rotulo(c, txt, x, y, cor, px, peso, alinh, base) {
    c.font = (peso ? peso + ' ' : '') + (px || 11) + 'px ' + Plot.cssVar('--font', 'sans-serif');
    c.fillStyle = cor;
    c.textAlign = alinh || 'center'; c.textBaseline = base || 'middle';
    c.fillText(txt, x, y);
  }
  /* desenha uma matriz 3×3 de números dentro da área do gráfico */
  function matriz3(c, M, x, y, titulo, cor, esc, dec) {
    var cText = Plot.cssVar('--text', '#111'), cFaint = Plot.cssVar('--text-faint', '#888');
    rotulo(c, titulo, x, y - 16, cor, 11.5, '700', 'left');
    var lh = 15, cw = 60;
    c.strokeStyle = cFaint; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + 5, y - 6); c.lineTo(x, y - 6); c.lineTo(x, y + 2 * lh + 8); c.lineTo(x + 5, y + 2 * lh + 8);
    c.moveTo(x + 3 * cw - 5, y - 6); c.lineTo(x + 3 * cw, y - 6); c.lineTo(x + 3 * cw, y + 2 * lh + 8); c.lineTo(x + 3 * cw - 5, y + 2 * lh + 8);
    c.stroke();
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
      var v = M[i][j] * (esc || 1);
      if (Math.abs(v) < 1e-9) v = 0;
      rotulo(c, v === 0 ? '0' : pt(v, dec || 4), x + cw * (j + 0.88), y + i * lh, Math.abs(v) < 1e-9 ? cFaint : cText, 11, '400', 'right');
    }
  }

  /* ========================================================================
     1. Micromecânica
     ======================================================================== */
  (function () {
    if (!document.getElementById('sim-micromecanica')) return;

    Sim.build('#sim-micromecanica', {
      titulo: 'Micromecânica: da fibra e da matriz às propriedades da lâmina',
      descricao: 'A regra das misturas trata fibra e matriz como molas em paralelo na direção 1 e em série na direção 2. O resultado é imediato: E₁ cresce em linha reta com a fração de fibra, enquanto E₂ e G₁₂ ficam presos perto da matriz até frações de fibra muito altas. Compare os dois modelos para E₂ e veja quanto de vazio o processo pode custar.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Vidro-E/epóxi 55 %', desc: 'o laminado de uso geral', valores: { fibra: 'vidroE', matriz: 'epoxi', Vf: 0.55, Vv: 0.01, xi: 2, modelo: 'ht' } },
        { nome: '2 · Carbono/epóxi 60 %', desc: 'prepreg aeronáutico em autoclave', valores: { fibra: 'carbonoHR', matriz: 'epoxi', Vf: 0.60, Vv: 0.005, xi: 2, modelo: 'ht' } },
        { nome: '3 · Laminação manual malfeita', desc: 'Vf baixa e 5 % de vazios', valores: { fibra: 'vidroE', matriz: 'poliester', Vf: 0.30, Vv: 0.05, xi: 2, modelo: 'ht' } },
        { nome: '4 · Carbono alto módulo', desc: 'satélites: rigidez acima de tudo', valores: { fibra: 'carbonoHM', matriz: 'epoxi', Vf: 0.62, Vv: 0.005, xi: 2, modelo: 'ht' } },
        { nome: '5 · Aramida/epóxi', desc: 'balística e cabos: ótimo à tração', valores: { fibra: 'aramida', matriz: 'epoxi', Vf: 0.60, Vv: 0.01, xi: 2, modelo: 'ht' } },
        { nome: '6 · Termoplástico (PEEK)', desc: 'carbono/PEEK, reciclável e tenaz', valores: { fibra: 'carbonoHR', matriz: 'peek', Vf: 0.58, Vv: 0.01, xi: 2, modelo: 'ht' } },
        { nome: '7 · Regra inversa × Halpin-Tsai', desc: 'o mesmo caso nos dois modelos', valores: { fibra: 'carbonoHR', matriz: 'epoxi', Vf: 0.60, Vv: 0.005, xi: 2, modelo: 'inv' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Constituintes' },
        {
          id: 'fibra', tipo: 'select', label: 'Fibra', valor: 'vidroE',
          opcoes: Object.keys(MMC.fibras).map(function (k) { return { v: k, t: MMC.fibras[k].nome }; })
        },
        {
          id: 'matriz', tipo: 'select', label: 'Matriz', valor: 'epoxi',
          opcoes: Object.keys(MMC.matrizes).map(function (k) { return { v: k, t: MMC.matrizes[k].nome }; })
        },
        { tipo: 'titulo', label: 'Mistura' },
        {
          id: 'Vf', label: 'Fração volumétrica de fibra V_f', min: 0, max: 0.8, step: 0.01, valor: 0.55, unidade: '',
          desc: 'Laminação manual 0,30–0,45 · RTM 0,45–0,55 · prepreg em autoclave 0,55–0,65 · bobinamento até 0,70'
        },
        {
          id: 'Vv', label: 'Fração de vazios V_v', min: 0, max: 0.08, step: 0.002, valor: 0.01, unidade: '',
          desc: 'Autoclave < 1 % · infusão 1–2 % · laminação manual 3–6 %'
        },
        { tipo: 'separador' },
        {
          id: 'modelo', tipo: 'seg', label: 'Modelo para E₂ e G₁₂', valor: 'ht',
          opcoes: [{ v: 'inv', t: 'Regra inversa' }, { v: 'ht', t: 'Halpin-Tsai' }]
        },
        {
          id: 'xi', label: 'Fator de reforço ξ (E₂)', min: 0.5, max: 4, step: 0.1, valor: 2, unidade: '',
          desc: 'ξ = 2 para fibras circulares; ξ → 0 reproduz a regra inversa'
        }
      ],
      graficos: [
        {
          id: 'mod', titulo: 'Módulos da lâmina em função da fração de fibra',
          xlabel: 'Fração volumétrica de fibra V_f', ylabel: 'Módulo (GPa)', aspect: 0.48, legendPos: 'topleft'
        },
        {
          id: 'esp', titulo: 'Rigidez específica e resistência longitudinal',
          xlabel: 'Fração volumétrica de fibra V_f', ylabel: 'E₁/ρ (GPa·cm³/g)', aspect: 0.42, legendPos: 'topleft'
        }
      ],
      saidas: [
        { id: 'Vm', label: 'Fração de matriz V_m' },
        { id: 'Wf', label: 'Fração em massa de fibra' },
        { id: 'E1', label: 'E₁ (direção da fibra)' },
        { id: 'E2', label: 'E₂ (transversal)' },
        { id: 'G12', label: 'G₁₂' },
        { id: 'n12', label: 'ν₁₂' },
        { id: 'n21', label: 'ν₂₁' },
        { id: 'razao', label: 'Anisotropia E₁/E₂' },
        { id: 'rho', label: 'Massa específica' },
        { id: 'esp', label: 'Rigidez específica E₁/ρ' },
        { id: 's1u', label: 'Resistência longitudinal σ₁ᵘ' },
        { id: 'Vcrit', label: 'Fração crítica de fibra' }
      ],
      formulas: [
        { g: 'Frações' },
        { tex: 'V_f + V_m + V_v = 1 \\qquad \\rho_c = \\rho_f V_f + \\rho_m V_m', d: 'o vazio ocupa volume e não tem massa', destaque: true },
        { tex: 'V_v = \\frac{\\rho_{teo} - \\rho_c}{\\rho_{teo}} \\qquad \\rho_{teo} = \\left(\\frac{W_f}{\\rho_f} + \\frac{W_m}{\\rho_m}\\right)^{-1}', d: 'vazios medidos por pesagem hidrostática' },
        { g: 'Molas em paralelo — direção 1' },
        { tex: 'E_1 = E_f V_f + E_m V_m \\qquad \\nu_{12} = \\nu_f V_f + \\nu_m V_m', d: 'mesma deformação na fibra e na matriz', destaque: true },
        { g: 'Molas em série — direção 2' },
        { tex: '\\frac{1}{E_2} = \\frac{V_f}{E_f} + \\frac{V_m}{E_m} \\qquad \\frac{1}{G_{12}} = \\frac{V_f}{G_f} + \\frac{V_m}{G_m}', d: 'mesma tensão na fibra e na matriz (limite inferior)' },
        { tex: 'E_2 = E_m\\,\\frac{1 + \\xi\\eta V_f}{1 - \\eta V_f}, \\quad \\eta = \\frac{E_f/E_m - 1}{E_f/E_m + \\xi}', d: 'Halpin-Tsai: semiempírico, mais perto do medido', destaque: true },
        { g: 'Reciprocidade e resistência' },
        { tex: '\\frac{\\nu_{12}}{E_1} = \\frac{\\nu_{21}}{E_2} \\;\\Rightarrow\\; \\nu_{21} = \\nu_{12}\\frac{E_2}{E_1}' },
        { tex: '\\sigma_1^u = \\sigma_f^u V_f + \\sigma_m^* V_m, \\quad \\sigma_m^* = E_m\\,\\varepsilon_f^u', d: 'σₘ* = tensão na matriz quando a fibra rompe' },
        { tex: 'V_{crit} = \\frac{\\sigma_m^u - \\sigma_m^*}{\\sigma_f^u - \\sigma_m^*}', d: 'abaixo dela a fibra não paga o que custa' }
      ],
      passos: [],
      nota: 'Fibra perfeitamente alinhada e igualmente espaçada, matriz homogênea e isotrópica, interface perfeita e lâmina livre de tensões residuais. Para carbono e aramida o módulo transversal da fibra é muito menor que o axial: é ele que entra em E₂. O vazio entra apenas como volume — por isso V_m = 1 − V_f − V_v.',
      calcular: function (p, ctx) {
        var r = MMC.micro(p);
        var E2 = p.modelo === 'ht' ? r.E2ht : r.E2inv;
        var G12 = p.modelo === 'ht' ? r.G12ht : r.G12inv;
        var n21 = r.E1 > 0 ? r.n12 * E2 / r.E1 : 0;

        /* curvas em função de Vf */
        var g1 = ctx.plot('mod').clear();
        var xs = Plot.linspace(0, 0.8, 81);
        function serieVf(fn) {
          return xs.map(function (v) {
            return fn(MMC.micro({ Vf: v, Vv: p.Vv * v / Math.max(p.Vf, 1e-6), fibra: p.fibra, matriz: p.matriz, xi: p.xi }));
          });
        }
        g1.line(xs, serieVf(function (q) { return q.E1; }), { color: Plot.serie(0), width: 2.6, label: 'E₁ (regra das misturas)' });
        g1.line(xs, serieVf(function (q) { return q.E2inv; }), { color: Plot.serie(2), width: p.modelo === 'inv' ? 2.6 : 1.4, dash: p.modelo === 'inv' ? null : [5, 4], label: 'E₂ regra inversa' });
        g1.line(xs, serieVf(function (q) { return q.E2ht; }), { color: Plot.serie(3), width: p.modelo === 'ht' ? 2.6 : 1.4, dash: p.modelo === 'ht' ? null : [5, 4], label: 'E₂ Halpin-Tsai' });
        g1.line(xs, serieVf(function (q) { return p.modelo === 'ht' ? q.G12ht : q.G12inv; }), { color: Plot.serie(4), width: 2, label: 'G₁₂' });
        g1.marker(p.Vf, r.E1, 'E₁ = ' + pt(r.E1, 4) + ' GPa', { color: Plot.serie(0), r: 5 });
        g1.marker(p.Vf, E2, 'E₂ = ' + pt(E2, 3) + ' GPa', { color: p.modelo === 'ht' ? Plot.serie(3) : Plot.serie(2), r: 5 });
        g1.vline(p.Vf, { text: 'V_f = ' + pt(p.Vf, 3), color: Plot.cssVar('--text-faint', '#888'), dash: [4, 4] });
        g1.hline(r.m.E, { text: 'matriz pura ' + pt(r.m.E, 3) + ' GPa', color: Plot.serie(5), dash: [3, 3] });
        g1.setLimits([0, 0.8], null).draw();

        var g2 = ctx.plot('esp').clear();
        g2.line(xs, serieVf(function (q) { return q.rho > 0 ? q.E1 / q.rho : 0; }), { color: Plot.serie(1), width: 2.6, label: 'E₁/ρ do compósito' });
        g2.line(xs, serieVf(function (q) { return q.s1u / 100; }), { color: Plot.serie(6), width: 2, label: 'σ₁ᵘ/100 (MPa)' });
        g2.hline(205 / 7.85, { text: 'aço: E/ρ = 26,1', color: Plot.serie(5), dash: [5, 4] });
        g2.hline(71 / 2.80, { text: 'alumínio: 25,4', color: Plot.serie(7), dash: [5, 4] });
        if (r.Vcrit > 0.001 && r.Vcrit < 0.8) {
          g2.vline(r.Vcrit, { text: 'V_crit = ' + pt(r.Vcrit, 3), color: Plot.serie(2), dash: [4, 4] });
        }
        g2.marker(p.Vf, r.rho > 0 ? r.E1 / r.rho : 0, 'aqui', { color: Plot.serie(1), r: 5 });
        g2.setLimits([0, 0.8], null).draw();

        ctx.setPassos([
          {
            t: '① Fração de matriz e massa específica',
            tex: 'V_m = 1 - V_f - V_v \\qquad \\rho_c = \\rho_f V_f + \\rho_m V_m',
            texSub: 'V_m = 1 - ' + nt(p.Vf, 3) + ' - ' + nt(p.Vv, 3) + ' = ' + nt(r.Vm, 4) +
              ' \\quad \\rho_c = ' + nt(r.f.rho, 4) + '\\cdot' + nt(r.Vf, 3) + ' + ' + nt(r.m.rho, 4) + '\\cdot' + nt(r.Vm, 3) + ' = ' + nt(r.rho, 4) + '\\ \\mathrm{g/cm^3}',
            obs: 'A fração em massa de fibra fica em ' + pt(100 * r.Wf, 3) + ' %. Num ensaio de calcinação é ela que se mede; a fração volumétrica sai depois, pelas massas específicas.'
          },
          {
            t: '② Direção 1: molas em paralelo',
            tex: 'E_1 = E_f V_f + E_m V_m',
            texSub: 'E_1 = ' + nt(r.f.E, 4) + '\\cdot' + nt(r.Vf, 3) + ' + ' + nt(r.m.E, 3) + '\\cdot' + nt(r.Vm, 3) + ' = ' + nt(r.E1, 4) + '\\ \\mathrm{GPa}',
            obs: 'A fibra responde por ' + pt(100 * r.f.E * r.Vf / Math.max(r.E1, 1e-9), 3) + ' % da rigidez longitudinal. É por isso que E₁ é praticamente uma reta em V_f.'
          },
          {
            t: '③ Direção 2: molas em série',
            tex: '\\frac{1}{E_2} = \\frac{V_f}{E_{f2}} + \\frac{V_m}{E_m}',
            texSub: 'E_2 = \\left(\\frac{' + nt(r.Vf, 3) + '}{' + nt(r.f.Er, 4) + '} + \\frac{' + nt(r.Vm, 3) + '}{' + nt(r.m.E, 3) + '}\\right)^{-1} = ' + nt(r.E2inv, 4) + '\\ \\mathrm{GPa}',
            r: 'Halpin-Tsai com ξ = ' + pt(p.xi, 2) + ': E₂ = ' + pt(r.E2ht, 4) + ' GPa',
            obs: 'A regra inversa é um limite inferior: na série, a camada mole domina. O valor medido fica entre os dois, em geral mais perto de Halpin-Tsai. Use o modelo que a bibliografia da sua disciplina adotar e diga qual foi.'
          },
          {
            t: '④ Poisson e cisalhamento',
            tex: '\\nu_{12} = \\nu_f V_f + \\nu_m V_m \\qquad \\nu_{21} = \\nu_{12}\\frac{E_2}{E_1}',
            texSub: '\\nu_{12} = ' + nt(r.n12, 4) + ' \\qquad \\nu_{21} = ' + nt(r.n12, 4) + '\\cdot\\frac{' + nt(E2, 4) + '}{' + nt(r.E1, 4) + '} = ' + nt(n21, 4),
            obs: 'ν₂₁ é muito menor que ν₁₂ — não porque o material "tenha dois Poisson independentes", mas porque a reciprocidade ν₁₂/E₁ = ν₂₁/E₂ obriga. Só três das quatro constantes elásticas são independentes… mais G₁₂, que completa as quatro.'
          },
          {
            t: '⑤ Leitura de projeto',
            tex: '\\frac{E_1}{\\rho_c} \\qquad \\frac{E_1}{E_2}',
            texSub: '\\frac{E_1}{\\rho_c} = ' + nt(r.rho > 0 ? r.E1 / r.rho : 0, 4) + '\\ \\mathrm{GPa\\,cm^3/g} \\qquad \\frac{E_1}{E_2} = ' + nt(E2 > 0 ? r.E1 / E2 : 0, 3),
            r: (r.rho > 0 && r.E1 / r.rho > 26.1 ? 'Rigidez específica acima do aço' : 'Rigidez específica abaixo do aço (26,1)'),
            obs: 'Com V_v = ' + pt(100 * p.Vv, 3) + ' % de vazios, perdem-se ' + pt(100 * p.Vv / Math.max(1 - p.Vv, 1e-9), 3) +
              ' % da matriz útil, e os vazios são o sítio preferencial de início de trinca e de absorção de umidade. Em estrutura aeronáutica o limite típico é 1 %.'
          }
        ]);

        return {
          Vm: { v: r.Vm, u: '' },
          Wf: { v: 100 * r.Wf, u: '%' },
          E1: { v: r.E1, u: 'GPa', classe: 'destaque' },
          E2: { v: E2, u: 'GPa', classe: 'destaque' },
          G12: { v: G12, u: 'GPa' },
          n12: { v: r.n12, u: '' },
          n21: { v: n21, u: '' },
          razao: { v: E2 > 0 ? r.E1 / E2 : 0, u: '' },
          rho: { v: r.rho, u: 'g/cm³' },
          esp: { v: r.rho > 0 ? r.E1 / r.rho : 0, u: 'GPa·cm³/g', classe: (r.rho > 0 && r.E1 / r.rho > 26.1) ? 'ok' : '' },
          s1u: { v: r.s1u, u: 'MPa' },
          Vcrit: { v: r.Vcrit, u: '', classe: p.Vf < r.Vcrit ? 'alerta' : 'ok' }
        };
      }
    });
  })();

  /* ========================================================================
     2. Lâmina fora de eixo
     ======================================================================== */
  (function () {
    if (!document.getElementById('sim-fora-eixo')) return;

    /* roseta polar de Ex(θ) e Gxy(θ) */
    function roseta(c, pl, p, L) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var cx = a.x + a.w * 0.5, cy = a.y + a.h * 0.56;
      var R = Math.min(a.w * 0.40, a.h * 0.40);
      var i, q, Emax = 0;
      for (i = 0; i <= 90; i++) {
        q = MMC.foraEixo(L.E1, L.E2, L.G12, L.n12, rad(i));
        if (q.Ex > Emax) Emax = q.Ex;
        if (q.Gxy > Emax) Emax = q.Gxy;
      }
      /* círculos de referência */
      c.setLineDash([3, 3]); c.lineWidth = 1; c.strokeStyle = faint;
      [0.25, 0.5, 0.75, 1].forEach(function (f) {
        c.beginPath(); c.arc(cx, cy, R * f, 0, Math.PI * 2); c.stroke();
        rotulo(c, pt(Emax * f, 3), cx + 3, cy - R * f, faint, 9.5, '400', 'left');
      });
      c.setLineDash([]);
      /* eixos */
      c.strokeStyle = faint; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - R - 14, cy); c.lineTo(cx + R + 14, cy);
      c.moveTo(cx, cy - R - 14); c.lineTo(cx, cy + R + 14); c.stroke();
      rotulo(c, 'x (0°)', cx + R + 16, cy + 11, faint, 10, '600', 'right');
      rotulo(c, 'y (90°)', cx + 4, cy - R - 20, faint, 10, '600', 'left');
      /* lóbulos: um ponto por grau, em 4 quadrantes por simetria */
      function lobo(fn, cor2, larg) {
        c.strokeStyle = cor2; c.lineWidth = larg; c.beginPath();
        for (i = 0; i <= 360; i++) {
          q = MMC.foraEixo(L.E1, L.E2, L.G12, L.n12, rad(i));
          var v = fn(q) / Emax * R;
          var X = cx + v * Math.cos(rad(i)), Y = cy - v * Math.sin(rad(i));
          if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
        }
        c.closePath(); c.stroke();
        c.globalAlpha = 0.10; c.fillStyle = cor2; c.fill(); c.globalAlpha = 1;
      }
      lobo(function (q) { return q.Gxy; }, Plot.serie(4), 1.8);
      lobo(function (q) { return q.Ex; }, Plot.serie(0), 2.6);
      /* direção atual da fibra e o valor de Ex nela */
      var qa = MMC.foraEixo(L.E1, L.E2, L.G12, L.n12, rad(p.th));
      var rr = qa.Ex / Emax * R;
      c.strokeStyle = Plot.serie(3); c.lineWidth = 2; c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(cx, cy);
      c.lineTo(cx + (R + 10) * Math.cos(rad(p.th)), cy - (R + 10) * Math.sin(rad(p.th)));
      c.stroke(); c.setLineDash([]);
      c.fillStyle = Plot.serie(0);
      c.beginPath(); c.arc(cx + rr * Math.cos(rad(p.th)), cy - rr * Math.sin(rad(p.th)), 4.5, 0, Math.PI * 2); c.fill();
      rotulo(c, 'θ = ' + pt(p.th, 3) + '°', cx + (R + 14) * Math.cos(rad(p.th)), cy - (R + 14) * Math.sin(rad(p.th)) - 8, Plot.serie(3), 11, '700');
      rotulo(c, 'E_x (θ)', a.x + 8, a.y + 12, Plot.serie(0), 11.5, '700', 'left');
      rotulo(c, 'G_xy (θ)', a.x + 8, a.y + 28, Plot.serie(4), 11.5, '700', 'left');
      rotulo(c, 'raio em GPa · escala máxima ' + pt(Emax, 4) + ' GPa', cx, a.y + a.h - 8, faint, 10, '400');
    }

    Sim.build('#sim-fora-eixo', {
      titulo: 'Lâmina fora de eixo: a rigidez transformada Q̄ e as constantes aparentes',
      descricao: 'Gire a lâmina em relação ao eixo de carga e acompanhe o que a matriz de rigidez faz. Em θ = 0° e 90° a lâmina é ortotrópica no eixo de carga e Q̄₁₆ = Q̄₂₆ = 0; em qualquer outro ângulo aparecem termos de acoplamento tração-cisalhamento — tracionar provoca distorção. É esse acoplamento que o laminado equilibrado anula somando +θ com −θ.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Fibra no eixo (0°)', desc: 'rigidez máxima, sem acoplamento', valores: { lamina: 'carbono', th: 0 } },
        { nome: '2 · A 45°: o pior dos mundos', desc: 'E_x despenca e η_xy é máximo', valores: { lamina: 'carbono', th: 45 } },
        { nome: '3 · G_xy máximo', desc: 'a 45° o cisalhamento aparente é o maior', valores: { lamina: 'carbono', th: 45 } },
        { nome: '4 · Fibra a 90°', desc: 'carrega a matriz: E_x = E₂', valores: { lamina: 'carbono', th: 90 } },
        { nome: '5 · 10° já custa caro', desc: 'desalinhamento de fabricação', valores: { lamina: 'carbono', th: 10 } },
        { nome: '6 · Vidro/epóxi a 30°', desc: 'anisotropia menor, queda mais suave', valores: { lamina: 'vidro', th: 30 } },
        { nome: '7 · Aramida a 54,7°', desc: 'ângulo de bobinamento de vaso', valores: { lamina: 'aramida', th: 54.7 } }
      ],
      controles: [
        { id: 'lamina', tipo: 'select', label: 'Lâmina', valor: 'carbono', opcoes: MMC.opcoesLamina() },
        {
          id: 'th', label: 'Ângulo da fibra θ', min: -90, max: 90, step: 0.5, valor: 30, unidade: '°',
          desc: 'Medido do eixo x de carga para o eixo 1 da fibra, positivo no sentido anti-horário'
        },
        { tipo: 'separador' },
        { id: 'verQ', tipo: 'check', label: 'Mostrar as componentes de Q̄ no gráfico', valor: true }
      ],
      graficos: [
        {
          id: 'cart', titulo: 'Constantes aparentes em função do ângulo da fibra',
          xlabel: 'Ângulo da fibra θ (°)', ylabel: 'Módulo aparente (GPa)', aspect: 0.46, legendPos: 'topright'
        },
        { id: 'polar', axes: false, grid: false, legend: false, height: 330 },
        {
          id: 'qb', titulo: 'Componentes da rigidez transformada Q̄',
          xlabel: 'Ângulo da fibra θ (°)', ylabel: 'Q̄_ij (GPa)', aspect: 0.42, legendPos: 'topright'
        }
      ],
      saidas: [
        { id: 'Ex', label: 'E_x aparente' },
        { id: 'Ey', label: 'E_y aparente' },
        { id: 'Gxy', label: 'G_xy aparente' },
        { id: 'nxy', label: 'ν_xy aparente' },
        { id: 'etax', label: 'η_xy,x (acoplamento)' },
        { id: 'q11', label: 'Q̄₁₁' },
        { id: 'q12', label: 'Q̄₁₂' },
        { id: 'q22', label: 'Q̄₂₂' },
        { id: 'q66', label: 'Q̄₆₆' },
        { id: 'q16', label: 'Q̄₁₆' },
        { id: 'q26', label: 'Q̄₂₆' },
        { id: 'perda', label: 'Perda de E_x frente a 0°' }
      ],
      formulas: [
        { g: 'A lâmina no eixo do material' },
        { tex: 'Q_{11} = \\frac{E_1}{1-\\nu_{12}\\nu_{21}}, \\quad Q_{22} = \\frac{E_2}{1-\\nu_{12}\\nu_{21}}, \\quad Q_{12} = \\frac{\\nu_{12}E_2}{1-\\nu_{12}\\nu_{21}}, \\quad Q_{66} = G_{12}', destaque: true },
        { g: 'Transformação de eixos' },
        { tex: '[\\bar{Q}] = [T_\\sigma]^{-1}[Q][T_\\varepsilon] \\qquad c = \\cos\\theta,\\ s = \\mathrm{sen}\\,\\theta', d: 'θ do eixo de carga x para o eixo 1 da fibra' },
        { tex: '\\bar{Q}_{11} = Q_{11}c^4 + 2(Q_{12}+2Q_{66})c^2s^2 + Q_{22}s^4', destaque: true },
        { tex: '\\bar{Q}_{12} = (Q_{11}+Q_{22}-4Q_{66})c^2s^2 + Q_{12}(c^4+s^4)' },
        { tex: '\\bar{Q}_{22} = Q_{11}s^4 + 2(Q_{12}+2Q_{66})c^2s^2 + Q_{22}c^4' },
        { tex: '\\bar{Q}_{66} = (Q_{11}+Q_{22}-2Q_{12}-2Q_{66})c^2s^2 + Q_{66}(c^4+s^4)' },
        { tex: '\\bar{Q}_{16} = (Q_{11}-Q_{12}-2Q_{66})c^3s + (Q_{12}-Q_{22}+2Q_{66})cs^3', d: 'acoplamento tração-cisalhamento: zero só em 0° e 90°' },
        { tex: '\\bar{Q}_{26} = (Q_{11}-Q_{12}-2Q_{66})cs^3 + (Q_{12}-Q_{22}+2Q_{66})c^3s' },
        { g: 'Constantes aparentes' },
        { tex: '\\frac{1}{E_x} = \\frac{c^4}{E_1} + \\left(\\frac{1}{G_{12}} - \\frac{2\\nu_{12}}{E_1}\\right)c^2s^2 + \\frac{s^4}{E_2}', destaque: true },
        { tex: '\\eta_{xy,x} = \\frac{\\bar{S}_{16}}{\\bar{S}_{11}}', d: 'distorção por unidade de deformação axial' }
      ],
      passos: [],
      nota: 'Estado plano de tensão, lâmina fina, material linear elástico ortotrópico. A rotação é só de eixos: o material é o mesmo, muda a direção em que se olha. Atenção ao sinal de θ: Q̄₁₆ e Q̄₂₆ são funções ímpares de θ — é essa propriedade que permite anular o acoplamento com pares ±θ.',
      calcular: function (p, ctx) {
        var L = MMC.laminas[p.lamina];
        var Q = MMC.Q(L.E1, L.E2, L.G12, L.n12);
        var th = rad(p.th);
        var qb = MMC.Qbar(Q, th);
        var fe = MMC.foraEixo(L.E1, L.E2, L.G12, L.n12, th);

        var ts = Plot.linspace(-90, 90, 181);
        function mapa(fn) {
          return ts.map(function (t) { return fn(MMC.foraEixo(L.E1, L.E2, L.G12, L.n12, rad(t))); });
        }
        var g1 = ctx.plot('cart').clear();
        g1.line(ts, mapa(function (q) { return q.Ex; }), { color: Plot.serie(0), width: 2.8, label: 'E_x' });
        g1.line(ts, mapa(function (q) { return q.Ey; }), { color: Plot.serie(1), width: 1.8, label: 'E_y' });
        g1.line(ts, mapa(function (q) { return q.Gxy; }), { color: Plot.serie(4), width: 2.2, label: 'G_xy' });
        g1.line(ts, mapa(function (q) { return q.nxy * 20; }), { color: Plot.serie(2), width: 1.6, dash: [6, 4], label: 'ν_xy × 20' });
        g1.marker(p.th, fe.Ex, 'E_x = ' + pt(fe.Ex, 4) + ' GPa', { color: Plot.serie(0), r: 5 });
        g1.vline(p.th, { text: 'θ = ' + pt(p.th, 3) + '°', color: Plot.cssVar('--text-faint', '#888') });
        g1.hline(L.E2, { text: 'E₂ = ' + pt(L.E2, 3) + ' GPa', color: Plot.serie(1) });
        g1.setLimits([-90, 90], [0, L.E1 * 1.08]).draw();

        var g2 = ctx.plot('polar');
        g2.clear(); g2.setLimits([0, 1], [0, 1]);
        g2.custom(function (c, pl) { roseta(c, pl, p, L); });
        g2.draw();

        var g3 = ctx.plot('qb').clear();
        if (p.verQ) {
          function mapaQ(k) { return ts.map(function (t) { return MMC.Qbar(Q, rad(t))[k]; }); }
          g3.line(ts, mapaQ('Q11'), { color: Plot.serie(0), width: 2.4, label: 'Q̄₁₁' });
          g3.line(ts, mapaQ('Q22'), { color: Plot.serie(1), width: 1.8, label: 'Q̄₂₂' });
          g3.line(ts, mapaQ('Q12'), { color: Plot.serie(2), width: 1.8, label: 'Q̄₁₂' });
          g3.line(ts, mapaQ('Q66'), { color: Plot.serie(4), width: 1.8, label: 'Q̄₆₆' });
          g3.line(ts, mapaQ('Q16'), { color: Plot.serie(3), width: 2.4, label: 'Q̄₁₆' });
          g3.line(ts, mapaQ('Q26'), { color: Plot.serie(6), width: 1.8, dash: [5, 4], label: 'Q̄₂₆' });
          g3.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [2, 3] });
          g3.vline(p.th, { text: 'θ', color: Plot.cssVar('--text-faint', '#888') });
          g3.marker(p.th, qb.Q16, 'Q̄₁₆ = ' + pt(qb.Q16, 4), { color: Plot.serie(3), r: 5 });
        } else {
          g3.line(ts, ts.map(function (t) { return 0; }), { color: Plot.cssVar('--text-faint', '#888'), width: 1 });
          g3.text(0, 0, 'Marque "Mostrar as componentes de Q̄" para ver as seis curvas.', { align: 'center', size: 12 });
        }
        g3.setLimits([-90, 90], null).draw();

        var Ex0 = MMC.foraEixo(L.E1, L.E2, L.G12, L.n12, 0).Ex;
        ctx.setPassos([
          {
            t: '① Quarta constante e denominador',
            tex: '\\nu_{21} = \\nu_{12}\\frac{E_2}{E_1} \\qquad 1 - \\nu_{12}\\nu_{21}',
            texSub: '\\nu_{21} = ' + nt(L.n12, 3) + '\\cdot\\frac{' + nt(L.E2, 3) + '}{' + nt(L.E1, 4) + '} = ' + nt(Q.n21, 4) +
              ' \\quad\\Rightarrow\\quad 1-\\nu_{12}\\nu_{21} = ' + nt(Q.den, 6),
            obs: 'O denominador fica muito perto de 1 nos compósitos muito anisotrópicos — não porque o efeito de Poisson desapareça, mas porque ν₂₁ é pequeno. Em metais, 1 − ν² ≈ 0,91.'
          },
          {
            t: '② Matriz de rigidez no eixo do material',
            tex: 'Q_{11} = \\frac{E_1}{1-\\nu_{12}\\nu_{21}},\\ Q_{22} = \\frac{E_2}{1-\\nu_{12}\\nu_{21}},\\ Q_{12} = \\frac{\\nu_{12}E_2}{1-\\nu_{12}\\nu_{21}},\\ Q_{66} = G_{12}',
            texSub: 'Q_{11} = ' + nt(Q.Q11, 5) + ',\\ Q_{22} = ' + nt(Q.Q22, 4) + ',\\ Q_{12} = ' + nt(Q.Q12, 4) + ',\\ Q_{66} = ' + nt(Q.Q66, 4) + '\\ \\mathrm{GPa}',
            obs: 'Quatro constantes independentes, quatro termos não nulos. Q₁₆ = Q₂₆ = 0 porque, no eixo do material, tração e cisalhamento não se misturam.'
          },
          {
            t: '③ Transformação para θ = ' + pt(p.th, 3) + '°',
            tex: 'c = \\cos\\theta = ' + nt(Math.cos(th), 4) + ', \\quad s = \\mathrm{sen}\\,\\theta = ' + nt(Math.sin(th), 4),
            texSub: '\\bar{Q}_{11} = ' + nt(qb.Q11, 5) + ',\\ \\bar{Q}_{22} = ' + nt(qb.Q22, 5) + ',\\ \\bar{Q}_{12} = ' + nt(qb.Q12, 5) +
              ',\\ \\bar{Q}_{66} = ' + nt(qb.Q66, 5) + ',\\ \\bar{Q}_{16} = ' + nt(qb.Q16, 5) + ',\\ \\bar{Q}_{26} = ' + nt(qb.Q26, 5) + '\\ \\mathrm{GPa}',
            r: Math.abs(qb.Q16) < 1e-6 ? 'Q̄₁₆ = Q̄₂₆ = 0: não há acoplamento' : 'Q̄₁₆ ≠ 0: tracionar em x distorce a lâmina',
            obs: 'A lâmina a θ ≠ 0°, 90° é um material "anisotrópico generalizado" no eixo de carga: ela tem seis constantes aparentes, não quatro. Nada mudou no material — mudou o eixo em que se escreve a lei constitutiva.'
          },
          {
            t: '④ Constantes aparentes',
            tex: '\\frac{1}{E_x} = \\frac{c^4}{E_1} + \\left(\\frac{1}{G_{12}} - \\frac{2\\nu_{12}}{E_1}\\right)c^2s^2 + \\frac{s^4}{E_2}',
            texSub: 'E_x = ' + nt(fe.Ex, 4) + ',\\ E_y = ' + nt(fe.Ey, 4) + ',\\ G_{xy} = ' + nt(fe.Gxy, 4) + '\\ \\mathrm{GPa},\\quad \\nu_{xy} = ' + nt(fe.nxy, 4),
            r: 'E_x caiu ' + pt(100 * (1 - fe.Ex / Ex0), 3) + ' % em relação à fibra alinhada',
            obs: 'A queda é brutal nos primeiros graus: a 10° o carbono/epóxi já perde cerca de metade de E₁. Em fabricação, tolerância de orientação de ±2° não é capricho.'
          },
          {
            t: '⑤ Acoplamento tração-cisalhamento',
            tex: '\\eta_{xy,x} = \\frac{\\bar{S}_{16}}{\\bar{S}_{11}} \\qquad \\gamma_{xy} = \\eta_{xy,x}\\,\\varepsilon_x',
            texSub: '\\eta_{xy,x} = ' + nt(fe.etax, 4),
            obs: Math.abs(fe.etax) < 1e-6
              ? 'Sem acoplamento neste ângulo.'
              : 'Uma tira a ' + pt(p.th, 3) + '° tracionada em x sofre distorção γ_xy = ' + pt(fe.etax, 3) +
              '·ε_x. Num corpo de prova preso por garras rígidas isso gera flexão parasita e o módulo medido sai errado — a norma ASTM D3039 pede corpos de prova a 0° ou 90° justamente por isso. No laminado, somar uma camada a −' + pt(Math.abs(p.th), 3) + '° cancela o efeito (laminado equilibrado).'
          }
        ]);

        return {
          Ex: { v: fe.Ex, u: 'GPa', classe: 'destaque' },
          Ey: { v: fe.Ey, u: 'GPa' },
          Gxy: { v: fe.Gxy, u: 'GPa' },
          nxy: { v: fe.nxy, u: '' },
          etax: { v: fe.etax, u: '', classe: Math.abs(fe.etax) > 0.3 ? 'alerta' : '' },
          q11: { v: qb.Q11, u: 'GPa' },
          q12: { v: qb.Q12, u: 'GPa' },
          q22: { v: qb.Q22, u: 'GPa' },
          q66: { v: qb.Q66, u: 'GPa' },
          q16: { v: qb.Q16, u: 'GPa', classe: Math.abs(qb.Q16) > 1e-6 ? 'alerta' : 'ok' },
          q26: { v: qb.Q26, u: 'GPa' },
          perda: { v: 100 * (1 - fe.Ex / Ex0), u: '%' }
        };
      }
    });
  })();

  /* ========================================================================
     3. Calculadora de laminado: empilhamento → A, B, D
     ======================================================================== */
  (function () {
    if (!document.getElementById('sim-laminado')) return;

    function angulos(p) {
      var base = [];
      for (var i = 1; i <= Math.round(p.nc); i++) base.push(p['t' + i]);
      return base;
    }
    function desenharPilha(c, pl, dados) {
      var a = pl._area, p = dados.p, cl = dados.cl, L = dados.L;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var n = cl.info.length;
      var larg = Math.min(a.w * 0.34, 190);
      var x0 = a.x + 44, topo = a.y + 26, baixo = a.y + a.h - 34;
      var hpx = baixo - topo;
      var esc = hpx / cl.h;
      /* cada camada */
      cl.info.forEach(function (k, i) {
        var y1 = topo + (cl.h / 2 - k.z1) * esc, y2 = topo + (cl.h / 2 - k.z0) * esc;
        var cc = Plot.serie(i % 8);
        c.fillStyle = cc; c.globalAlpha = 0.17;
        c.fillRect(x0, y1, larg, y2 - y1);
        c.globalAlpha = 1;
        c.strokeStyle = cc; c.lineWidth = 1.2;
        c.strokeRect(x0, y1, larg, y2 - y1);
        /* riscos na direção da fibra, recortados na camada */
        c.save();
        c.beginPath(); c.rect(x0, y1, larg, y2 - y1); c.clip();
        c.strokeStyle = cc; c.lineWidth = 1; c.globalAlpha = 0.75;
        var tg = Math.tan(rad(k.th));
        var alt = y2 - y1;
        for (var q = -larg; q < larg * 2; q += 9) {
          c.beginPath();
          c.moveTo(x0 + q, y2);
          c.lineTo(x0 + q + (Math.abs(tg) > 12 ? (tg > 0 ? larg * 3 : -larg * 3) : alt * tg), y1);
          c.stroke();
        }
        c.globalAlpha = 1;
        c.restore();
        /* rótulo do ângulo */
        if (y2 - y1 > 12) {
          var rot = (k.th > 0 ? '+' : '') + pt(k.th, 3) + '°';
          c.fillStyle = elev; c.globalAlpha = 0.8;
          c.fillRect(x0 + larg / 2 - 20, (y1 + y2) / 2 - 7, 40, 14);
          c.globalAlpha = 1;
          rotulo(c, rot, x0 + larg / 2, (y1 + y2) / 2, cor, 10.5, '700');
        }
        /* cota z */
        if (n <= 10) {
          rotulo(c, pt(k.z1, 3), x0 - 6, y1, faint, 9.5, '400', 'right');
        }
      });
      if (n <= 10) rotulo(c, pt(cl.info[n - 1].z1, 3), x0 - 6, baixo, faint, 9.5, '400', 'right');
      rotulo(c, 'z (mm)', x0 - 6, topo - 14, faint, 10, '600', 'right');
      /* plano médio */
      c.strokeStyle = Plot.serie(3); c.lineWidth = 1.6; c.setLineDash([6, 4]);
      c.beginPath(); c.moveTo(x0 - 14, topo + hpx / 2); c.lineTo(x0 + larg + 16, topo + hpx / 2); c.stroke();
      c.setLineDash([]);
      rotulo(c, 'z = 0', x0 + larg + 18, topo + hpx / 2, Plot.serie(3), 10, '700', 'left');
      rotulo(c, dados.rotulo, x0 + larg / 2, topo - 14, cor, 12, '700');
      rotulo(c, 'h = ' + pt(cl.h, 4) + ' mm · ' + n + ' camadas · ' + L.nome.split('(')[0].trim(),
        x0 + larg / 2, baixo + 16, faint, 10, '400');
      /* matrizes */
      var mx = x0 + larg + 78;
      matriz3(c, cl.A, mx, a.y + 34, 'A (kN/mm)', Plot.serie(0), 1e-3, 4);
      matriz3(c, cl.B, mx, a.y + 34 + 78, 'B (N)', Plot.serie(2), 1, 4);
      matriz3(c, cl.D, mx, a.y + 34 + 156, 'D (N·mm)', Plot.serie(4), 1, 4);
    }

    Sim.build('#sim-laminado', {
      titulo: 'Calculadora de laminado: empilhamento, matrizes A, B, D e acoplamentos',
      descricao: 'Monte o empilhamento camada a camada e veja as três matrizes se formarem. A diz como o laminado estica no plano, D como ele flete, e B é o acoplamento entre os dois — só existe quando o empilhamento não é simétrico em relação ao plano médio. É B que empena o laminado na saída do molde e o que leva uma placa a curvar ao ser apenas tracionada.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Unidirecional [0]₄', desc: 'tudo na mesma direção', valores: { lamina: 'carbono', nc: 2, t1: 0, t2: 0, t3: 90, t4: 45, t5: -45, t6: 90, esp: 0.25, sim: true, Nx: 100, Ny: 0, Nxy: 0, Mx: 0 } },
        { nome: '2 · Cruzado [0/90]_S', desc: 'B = 0, duas direções', valores: { lamina: 'carbono', nc: 2, t1: 0, t2: 90, t3: 90, t4: 45, t5: -45, t6: 90, esp: 0.25, sim: true, Nx: 100, Ny: 0, Nxy: 0, Mx: 0 } },
        { nome: '3 · Angular [±45]_S', desc: 'equilibrado: A₁₆ = A₂₆ = 0', valores: { lamina: 'carbono', nc: 2, t1: 45, t2: -45, t3: 90, t4: 45, t5: -45, t6: 90, esp: 0.25, sim: true, Nx: 0, Ny: 0, Nxy: 100, Mx: 0 } },
        { nome: '4 · Quase-isotrópico [0/45/−45/90]_S', desc: 'A isotrópica no plano', valores: { lamina: 'carbono', nc: 4, t1: 0, t2: 45, t3: -45, t4: 90, t5: -45, t6: 90, esp: 0.25, sim: true, Nx: 100, Ny: 0, Nxy: 0, Mx: 0 } },
        { nome: '5 · Assimétrico [0/90]', desc: 'B ≠ 0: tracionar faz curvar', valores: { lamina: 'carbono', nc: 2, t1: 0, t2: 90, t3: 90, t4: 45, t5: -45, t6: 90, esp: 0.25, sim: false, Nx: 100, Ny: 0, Nxy: 0, Mx: 0 } },
        { nome: '6 · Sob flexão pura', desc: 'o mesmo cruzado, só com M_x', valores: { lamina: 'carbono', nc: 2, t1: 0, t2: 90, t3: 90, t4: 45, t5: -45, t6: 90, esp: 0.25, sim: true, Nx: 0, Ny: 0, Nxy: 0, Mx: 20 } },
        { nome: '7 · Vaso bobinado [±54,7]₃_S', desc: 'ângulo de netting analysis', valores: { lamina: 'vidro', nc: 6, t1: 54.7, t2: -54.7, t3: 54.7, t4: -54.7, t5: 54.7, t6: -54.7, esp: 0.4, sim: true, Nx: 100, Ny: 200, Nxy: 0, Mx: 0 } }
      ],
      controles: [
        { id: 'lamina', tipo: 'select', label: 'Lâmina', valor: 'carbono', opcoes: MMC.opcoesLamina() },
        { id: 'esp', label: 'Espessura de cada camada', min: 0.1, max: 0.6, step: 0.01, valor: 0.25, unidade: 'mm', desc: 'Prepreg unidirecional 0,125–0,25 mm · tecido 0,20–0,40 mm' },
        { tipo: 'titulo', label: 'Empilhamento' },
        { id: 'nc', label: 'Camadas na sequência', min: 1, max: 6, step: 1, valor: 2, unidade: '' },
        { id: 't1', label: 'Camada 1 — ângulo', min: -90, max: 90, step: 2.5, valor: 0, unidade: '°' },
        { id: 't2', label: 'Camada 2 — ângulo', min: -90, max: 90, step: 2.5, valor: 90, unidade: '°' },
        { id: 't3', label: 'Camada 3 — ângulo', min: -90, max: 90, step: 2.5, valor: 45, unidade: '°' },
        { id: 't4', label: 'Camada 4 — ângulo', min: -90, max: 90, step: 2.5, valor: -45, unidade: '°' },
        { id: 't5', label: 'Camada 5 — ângulo', min: -90, max: 90, step: 2.5, valor: 90, unidade: '°' },
        { id: 't6', label: 'Camada 6 — ângulo', min: -90, max: 90, step: 2.5, valor: 0, unidade: '°' },
        { id: 'sim', tipo: 'check', label: 'Espelhar a sequência (laminado simétrico)', valor: true },
        { tipo: 'titulo', label: 'Carregamento por unidade de largura' },
        { id: 'Nx', label: 'N_x', min: -400, max: 400, step: 5, valor: 100, unidade: 'N/mm' },
        { id: 'Ny', label: 'N_y', min: -400, max: 400, step: 5, valor: 0, unidade: 'N/mm' },
        { id: 'Nxy', label: 'N_xy', min: -400, max: 400, step: 5, valor: 0, unidade: 'N/mm' },
        { id: 'Mx', label: 'M_x', min: -60, max: 60, step: 1, valor: 0, unidade: 'N·mm/mm' }
      ],
      graficos: [
        { id: 'pilha', axes: false, grid: false, legend: false, height: 390 },
        {
          id: 'tensao', titulo: 'Tensões no eixo da fibra, camada a camada',
          xlabel: 'Tensão (MPa)', ylabel: 'Posição z (mm)', aspect: 0.5, legendPos: 'topright'
        }
      ],
      saidas: [
        { id: 'h', label: 'Espessura total h' },
        { id: 'tipo', label: 'Classificação' },
        { id: 'Ex', label: 'E_x do laminado' },
        { id: 'Ey', label: 'E_y do laminado' },
        { id: 'Gxy', label: 'G_xy do laminado' },
        { id: 'nxy', label: 'ν_xy do laminado' },
        { id: 'maxB', label: 'Maior termo de B' },
        { id: 'ex', label: 'ε⁰_x' },
        { id: 'ey', label: 'ε⁰_y' },
        { id: 'gxy', label: 'γ⁰_xy' },
        { id: 'kx', label: 'Curvatura κ_x' },
        { id: 'raio', label: 'Raio de curvatura em x' }
      ],
      formulas: [
        { g: 'Hipótese de Kirchhoff' },
        { tex: '\\varepsilon_x = \\varepsilon^0_x + z\\,\\kappa_x \\qquad \\varepsilon_y = \\varepsilon^0_y + z\\,\\kappa_y \\qquad \\gamma_{xy} = \\gamma^0_{xy} + z\\,\\kappa_{xy}', d: 'a normal ao plano médio continua reta e normal', destaque: true },
        { g: 'Equações constitutivas do laminado' },
        { tex: '\\begin{Bmatrix} N \\\\ M \\end{Bmatrix} = \\begin{bmatrix} A & B \\\\ B & D \\end{bmatrix} \\begin{Bmatrix} \\varepsilon^0 \\\\ \\kappa \\end{Bmatrix}', destaque: true },
        { tex: 'A_{ij} = \\sum_{k=1}^{n} (\\bar{Q}_{ij})_k\\,(z_k - z_{k-1})', d: 'rigidez extensional [N/mm]' },
        { tex: 'B_{ij} = \\frac{1}{2}\\sum_{k=1}^{n} (\\bar{Q}_{ij})_k\\,(z_k^2 - z_{k-1}^2)', d: 'acoplamento extensão-flexão [N]' },
        { tex: 'D_{ij} = \\frac{1}{3}\\sum_{k=1}^{n} (\\bar{Q}_{ij})_k\\,(z_k^3 - z_{k-1}^3)', d: 'rigidez à flexão e à torção [N·mm]' },
        { g: 'Constantes equivalentes (a = A⁻¹)' },
        { tex: 'E_x = \\frac{1}{a_{11}h}, \\quad E_y = \\frac{1}{a_{22}h}, \\quad G_{xy} = \\frac{1}{a_{33}h}, \\quad \\nu_{xy} = -\\frac{a_{12}}{a_{11}}', d: 'válidas só para laminado simétrico sob carga no plano' },
        { g: 'Tensões camada a camada' },
        { tex: '\\{\\sigma\\}_{xy} = [\\bar{Q}]_k\\{\\varepsilon^0 + z\\kappa\\} \\qquad \\{\\sigma\\}_{12} = [T_\\sigma]\\{\\sigma\\}_{xy}', d: 'a deformação é contínua; a tensão salta de camada em camada' }
      ],
      passos: [],
      nota: 'Teoria clássica dos laminados: camadas perfeitamente aderidas, estado plano de tensão em cada lâmina, deformação linear na espessura e cisalhamento transverso desprezado (válido para placas finas, h bem menor que o vão). A deformação é contínua ao longo de z; a tensão é descontínua porque cada camada tem Q̄ diferente. Tensões interlaminares, que é o que descola o laminado nas bordas, ficam fora da TCL.',
      calcular: function (p, ctx) {
        var L = MMC.laminas[p.lamina];
        var mat = { E1: L.E1 * 1000, E2: L.E2 * 1000, G12: L.G12 * 1000, n12: L.n12 };
        var base = angulos(p);
        var cam = MMC.pilha(base, p.esp, p.sim);
        var cl = MMC.clt(mat, cam);
        var sol = MMC.resolve6(cl.A, cl.B, cl.D, [p.Nx, p.Ny, p.Nxy], [p.Mx, 0, 0]);
        var cs = MMC.camadas(cl, sol.e0, sol.k);
        var rotuloP = MMC.rotuloPilha(base, p.sim).replace(/<\/?sub>/g, '');
        var maxB = 0;
        cl.B.forEach(function (l) { l.forEach(function (v) { maxB = Math.max(maxB, Math.abs(v)); }); });

        var gp = ctx.plot('pilha');
        gp.clear(); gp.setLimits([0, 1], [0, 1]);
        gp.custom(function (c, pl) { desenharPilha(c, pl, { p: p, cl: cl, L: L, rotulo: rotuloP }); });
        gp.draw();

        /* tensões por camada, em degraus ao longo de z */
        var g2 = ctx.plot('tensao').clear();
        function degrau(sel) {
          var xs = [], ys = [];
          cs.forEach(function (q, i) {
            var k = cl.info[i];
            xs.push(sel(q)); ys.push(k.z0);
            xs.push(sel(q)); ys.push(k.z1);
            xs.push(NaN); ys.push(NaN);
          });
          return { xs: xs, ys: ys };
        }
        var d1 = degrau(function (q) { return q.s12[0]; });
        var d2 = degrau(function (q) { return q.s12[1]; });
        var d3 = degrau(function (q) { return q.s12[2]; });
        g2.line(d1.xs, d1.ys, { color: Plot.serie(0), width: 2.6, label: 'σ₁ (na fibra)' });
        g2.line(d2.xs, d2.ys, { color: Plot.serie(2), width: 2.2, label: 'σ₂ (transversal)' });
        g2.line(d3.xs, d3.ys, { color: Plot.serie(4), width: 1.8, label: 'τ₁₂' });
        g2.vline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [2, 3] });
        g2.hline(0, { text: 'plano médio', color: Plot.serie(3) });
        g2.hline(L.Yt, { text: '', color: Plot.cssVar('--bg-elev', '#fff'), width: 0 });
        g2.setLimits(null, [-cl.h / 2 * 1.08, cl.h / 2 * 1.08]).draw();

        /* classificação em texto */
        var classe = [];
        classe.push(cl.simetrico ? 'simétrico' : 'assimétrico');
        if (cl.equilibrado) classe.push('equilibrado');
        var soAngs = {};
        base.forEach(function (t) { soAngs[t] = 1; });
        var chaves = Object.keys(soAngs);
        if (chaves.length === 1) classe.push('unidirecional');
        else if (chaves.every(function (t) { return Math.abs(t) < 1e-6 || Math.abs(Math.abs(t) - 90) < 1e-6; })) classe.push('cruzado');
        else if (chaves.length === 2 && Math.abs(Number(chaves[0]) + Number(chaves[1])) < 1e-6) classe.push('angular');
        /* quase-isotrópico: A₁₁ = A₂₂ e A₆₆ = (A₁₁ − A₁₂)/2 */
        var qi = Math.abs(cl.A[0][0] - cl.A[1][1]) / Math.max(cl.A[0][0], 1e-9) < 1e-6 &&
          Math.abs(cl.A[2][2] - (cl.A[0][0] - cl.A[0][1]) / 2) / Math.max(cl.A[2][2], 1e-9) < 1e-6;
        if (qi) classe.push('quase-isotrópico');

        var cmax = cs.reduce(function (m, q, i) {
          var cr = MMC.criterios(q.s12, L);
          return cr.fsMax < m.fs ? { fs: cr.fsMax, i: i, cr: cr, q: q } : m;
        }, { fs: Infinity });

        ctx.setPassos([
          {
            t: '① Coordenadas das camadas',
            tex: 'z_0 = -\\frac{h}{2} \\qquad z_k = z_{k-1} + t_k \\qquad h = \\sum t_k',
            texSub: 'h = ' + cl.info.length + '\\times' + nt(p.esp, 3) + ' = ' + nt(cl.h, 4) + '\\ \\mathrm{mm},\\quad z_0 = ' + nt(-cl.h / 2, 4) + '\\ \\mathrm{mm}',
            obs: 'Empilhamento ' + rotuloP + '. A contagem de z começa pela face inferior; é essa origem no plano médio que faz B somar zero quando a sequência é espelhada.'
          },
          {
            t: '② Q̄ de cada orientação',
            tex: '[\\bar{Q}]_k = f(\\theta_k,\\,E_1,\\,E_2,\\,G_{12},\\,\\nu_{12})',
            texSub: cl.info.slice(0, 4).map(function (k) {
              return '\\theta = ' + nt(k.th, 3) + '^\\circ:\\ \\bar{Q}_{11} = ' + nt(k.Qb[0][0] / 1000, 4) + '\\ \\mathrm{GPa}';
            }).join(',\\quad '),
            obs: 'Camadas com o mesmo ângulo têm a mesma Q̄ — só a posição z muda, e é ela que decide o peso da camada em A, B e D.'
          },
          {
            t: '③ Somatórios de A, B e D',
            tex: 'A_{11} = \\sum \\bar{Q}_{11}\\Delta z, \\quad B_{11} = \\tfrac12\\sum \\bar{Q}_{11}\\Delta(z^2), \\quad D_{11} = \\tfrac13\\sum \\bar{Q}_{11}\\Delta(z^3)',
            texSub: 'A_{11} = ' + nt(cl.A[0][0], 5) + '\\ \\mathrm{N/mm}, \\quad B_{11} = ' + nt(cl.B[0][0], 4) +
              '\\ \\mathrm{N}, \\quad D_{11} = ' + nt(cl.D[0][0], 5) + '\\ \\mathrm{N\\,mm}',
            r: cl.simetrico ? 'B ≡ 0: laminado simétrico' : 'B ≠ 0 (maior termo ' + pt(maxB, 4) + ' N): há acoplamento',
            obs: cl.simetrico
              ? 'Com a sequência espelhada, cada camada acima do plano médio tem uma gêmea abaixo com z de sinal oposto: as parcelas de B se cancelam duas a duas. Projeto aeronáutico usa quase sempre laminado simétrico por isso.'
              : 'Com B ≠ 0 o laminado curva ao ser tracionado e estica ao ser fletido. Na prática, uma placa assimétrica sai empenada do molde só pela contração de cura — ver o capítulo de tensões térmicas.'
          },
          {
            t: '④ Deformações e curvaturas',
            tex: '\\begin{Bmatrix} N \\\\ M \\end{Bmatrix} = \\begin{bmatrix} A & B \\\\ B & D \\end{bmatrix}\\begin{Bmatrix} \\varepsilon^0 \\\\ \\kappa \\end{Bmatrix}',
            texSub: '\\varepsilon^0 = \\{' + nt(sol.e0[0], 4) + ';\\ ' + nt(sol.e0[1], 4) + ';\\ ' + nt(sol.e0[2], 4) +
              '\\} \\qquad \\kappa = \\{' + nt(sol.k[0], 4) + ';\\ ' + nt(sol.k[1], 4) + ';\\ ' + nt(sol.k[2], 4) + '\\}\\ \\mathrm{mm^{-1}}',
            obs: Math.abs(sol.k[0]) > 1e-9
              ? 'A curvatura κ_x = ' + pt(sol.k[0], 3) + ' mm⁻¹ corresponde a um raio de ' + pt(1 / Math.abs(sol.k[0]), 4) + ' mm.'
              : 'Sem curvatura: a carga é puramente de membrana e o laminado é simétrico.'
          },
          {
            t: '⑤ Camada mais solicitada',
            tex: '\\{\\sigma\\}_{12} = [T_\\sigma]\\,[\\bar{Q}]_k\\{\\varepsilon^0 + z_k\\kappa\\}',
            texSub: cmax.q ? '\\theta = ' + nt(cmax.q.th, 3) + '^\\circ:\\ \\sigma_1 = ' + nt(cmax.q.s12[0], 4) +
              ',\\ \\sigma_2 = ' + nt(cmax.q.s12[1], 4) + ',\\ \\tau_{12} = ' + nt(cmax.q.s12[2], 4) + '\\ \\mathrm{MPa}' : '',
            r: cmax.cr ? 'Fator de segurança pela tensão máxima: ' + pt(cmax.cr.fsMax, 3) + ' (modo ' + cmax.cr.modo + ')' : '',
            obs: 'Nos laminados cruzados e quase-isotrópicos a primeira ruptura quase sempre é transversal à fibra (σ₂ contra Y_t), porque Y_t é uma ordem de grandeza menor que X_t. A estrutura não cai nessa hora: é o joelho da curva, tratado no capítulo de falha progressiva.'
          }
        ]);

        return {
          h: { v: cl.h, u: 'mm' },
          tipo: { v: classe.join(', '), u: '', classe: cl.simetrico ? 'ok' : 'alerta' },
          Ex: { v: cl.cons.Ex / 1000, u: 'GPa', classe: 'destaque' },
          Ey: { v: cl.cons.Ey / 1000, u: 'GPa' },
          Gxy: { v: cl.cons.Gxy / 1000, u: 'GPa' },
          nxy: { v: cl.cons.nxy, u: '' },
          maxB: { v: maxB, u: 'N', classe: maxB > 1e-6 ? 'alerta' : 'ok' },
          ex: { v: sol.e0[0] * 100, u: '%' },
          ey: { v: sol.e0[1] * 100, u: '%' },
          gxy: { v: sol.e0[2] * 100, u: '%' },
          kx: { v: sol.k[0], u: '1/mm' },
          raio: { v: Math.abs(sol.k[0]) > 1e-9 ? 1 / Math.abs(sol.k[0]) : Infinity, u: 'mm' }
        };
      }
    });
  })();

  /* ========================================================================
     4. Critérios de falha: envelopes em σ₁ × σ₂
     ======================================================================== */
  (function () {
    if (!document.getElementById('sim-falha')) return;

    /* envelopes traçados por varredura radial, com solução fechada em cada raio */
    function envelope(R, L, tau, f12, qual) {
      var xs = [], ys = [], i;
      var F1 = 1 / R.Xt - 1 / R.Xc, F2 = 1 / R.Yt - 1 / R.Yc;
      var F11 = 1 / (R.Xt * R.Xc), F22 = 1 / (R.Yt * R.Yc), F66 = 1 / (R.S * R.S);
      var F12 = f12 * Math.sqrt(F11 * F22);
      var cTau = (tau / R.S) * (tau / R.S);
      var E1 = L.E1 * 1000, E2 = L.E2 * 1000, n21 = L.n12 * L.E2 / L.E1;
      for (i = 0; i <= 240; i++) {
        var ph = i / 240 * 2 * Math.PI;
        var d1 = Math.cos(ph) * R.Xt, d2 = Math.sin(ph) * R.Yt;
        var X = d1 >= 0 ? R.Xt : R.Xc, Y = d2 >= 0 ? R.Yt : R.Yc;
        var t = 0;
        if (qual === 'max') {
          var m = Math.max(Math.abs(d1) / X, Math.abs(d2) / Y);
          t = m > 0 && cTau < 1 ? 1 / m : 0;
        } else if (qual === 'def') {
          var e1 = (d1 - L.n12 * d2) / E1, e2 = (d2 - n21 * d1) / E2;
          var l1 = e1 >= 0 ? R.e1t : R.Xc / E1, l2 = e2 >= 0 ? R.e2t : R.Yc / E2;
          var mm = Math.max(Math.abs(e1) / l1, Math.abs(e2) / l2);
          t = mm > 0 ? 1 / mm : 0;
        } else if (qual === 'hill') {
          var qd = (d1 / X) * (d1 / X) - d1 * d2 / (X * X) + (d2 / Y) * (d2 / Y);
          t = qd > 0 && cTau < 1 ? Math.sqrt((1 - cTau) / qd) : 0;
        } else {
          var a = F11 * d1 * d1 + F22 * d2 * d2 + 2 * F12 * d1 * d2;
          var b = F1 * d1 + F2 * d2;
          var cc = F66 * tau * tau - 1;
          var disc = b * b - 4 * a * cc;
          t = (a > 1e-30 && disc >= 0) ? (-b + Math.sqrt(disc)) / (2 * a) : 0;
        }
        xs.push(t * d1); ys.push(t * d2);
      }
      xs.push(xs[0]); ys.push(ys[0]);
      return { xs: xs, ys: ys };
    }

    Sim.build('#sim-falha', {
      titulo: 'Critérios de falha da lâmina: tensão máxima, Tsai-Hill e Tsai-Wu',
      descricao: 'O envelope é o contorno dentro do qual a lâmina não rompe. A tensão máxima dá um retângulo — cada tensão disputa seu próprio limite, sem interação. Tsai-Hill e Tsai-Wu dão elipses: as tensões interagem, e o envelope encolhe nos quadrantes mistos. Tsai-Wu é o único que distingue tração de compressão por termos lineares, e por isso sai deslocado do centro.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Tração longitudinal pura', desc: 'os três critérios coincidem', valores: { lamina: 'carbono', s1: 600, s2: 0, t12: 0, f12: -0.5, verMax: true, verHill: true, verWu: true, verDef: false } },
        { nome: '2 · Quadrante misto', desc: 'tração em 1, compressão em 2', valores: { lamina: 'carbono', s1: 600, s2: -60, t12: 20, f12: -0.5, verMax: true, verHill: true, verWu: true, verDef: false } },
        { nome: '3 · Cisalhamento consome o envelope', desc: 'τ₁₂ alto encolhe a elipse', valores: { lamina: 'carbono', s1: 400, s2: 15, t12: 50, f12: -0.5, verMax: true, verHill: true, verWu: true, verDef: false } },
        { nome: '4 · Onde os critérios discordam', desc: 'σ₁ compressivo e σ₂ trativo', valores: { lamina: 'carbono', s1: -400, s2: 25, t12: 40, f12: -0.5, verMax: true, verHill: true, verWu: true, verDef: false } },
        { nome: '5 · F₁₂* = 0', desc: 'sem termo de interação em Tsai-Wu', valores: { lamina: 'carbono', s1: -400, s2: 25, t12: 40, f12: 0, verMax: true, verHill: true, verWu: true, verDef: false } },
        { nome: '6 · Vidro/epóxi', desc: 'anisotropia de resistência menor', valores: { lamina: 'vidro', s1: 500, s2: 20, t12: 25, f12: -0.5, verMax: true, verHill: true, verWu: true, verDef: true } },
        { nome: '7 · Aramida em compressão', desc: 'X_c é 5× menor que X_t', valores: { lamina: 'aramida', s1: -200, s2: 10, t12: 20, f12: -0.5, verMax: true, verHill: true, verWu: true, verDef: false } }
      ],
      controles: [
        { id: 'lamina', tipo: 'select', label: 'Lâmina', valor: 'carbono', opcoes: MMC.opcoesLamina() },
        { tipo: 'titulo', label: 'Estado de tensão no eixo da fibra' },
        { id: 's1', label: 'σ₁ (na direção da fibra)', min: -1400, max: 1400, step: 10, valor: 600, unidade: 'MPa' },
        { id: 's2', label: 'σ₂ (transversal)', min: -180, max: 180, step: 1, valor: 20, unidade: 'MPa' },
        { id: 't12', label: 'τ₁₂', min: -100, max: 100, step: 1, valor: 20, unidade: 'MPa' },
        { tipo: 'titulo', label: 'Tsai-Wu' },
        {
          id: 'f12', label: 'Coeficiente normalizado F₁₂*', min: -1, max: 1, step: 0.05, valor: -0.5, unidade: '',
          desc: 'F₁₂ = F₁₂*·√(F₁₁F₂₂). Com F₁₂* = −0,5 o critério vira Hoffman; é o valor de uso quando não há ensaio biaxial'
        },
        { tipo: 'titulo', label: 'Envelopes no gráfico' },
        { id: 'verMax', tipo: 'check', label: 'Tensão máxima', valor: true },
        { id: 'verHill', tipo: 'check', label: 'Tsai-Hill', valor: true },
        { id: 'verWu', tipo: 'check', label: 'Tsai-Wu', valor: true },
        { id: 'verDef', tipo: 'check', label: 'Deformação máxima', valor: false }
      ],
      graficos: [
        {
          id: 'env', titulo: 'Envelope de falha no plano σ₁ × σ₂ (para o τ₁₂ dado)',
          xlabel: 'σ₁ (MPa)', ylabel: 'σ₂ (MPa)', aspect: 0.55, legendPos: 'bottomright'
        },
        {
          id: 'off', titulo: 'Resistência de uma lâmina fora de eixo sob σ_x uniaxial de tração',
          xlabel: 'Ângulo da fibra θ (°)', ylabel: 'σ_x admissível (MPa)', aspect: 0.44, legendPos: 'topright'
        }
      ],
      saidas: [
        { id: 'r1', label: 'σ₁/X' },
        { id: 'r2', label: 'σ₂/Y' },
        { id: 'r6', label: 'τ₁₂/S' },
        { id: 'fsMax', label: 'FS — tensão máxima' },
        { id: 'modo', label: 'Modo de falha previsto' },
        { id: 'fsDef', label: 'FS — deformação máxima' },
        { id: 'ih', label: 'Índice de Tsai-Hill' },
        { id: 'fsHill', label: 'FS — Tsai-Hill' },
        { id: 'iw', label: 'Índice de Tsai-Wu' },
        { id: 'fsWu', label: 'FS — Tsai-Wu' },
        { id: 'veredito', label: 'Veredito' },
        { id: 'disp', label: 'Discrepância máxima' }
      ],
      formulas: [
        { g: 'Tensão máxima — sem interação' },
        { tex: '-X_c < \\sigma_1 < X_t, \\qquad -Y_c < \\sigma_2 < Y_t, \\qquad |\\tau_{12}| < S', d: 'três desigualdades independentes; dá o modo de falha de graça', destaque: true },
        { g: 'Deformação máxima' },
        { tex: '-\\varepsilon_1^c < \\varepsilon_1 < \\varepsilon_1^t, \\quad \\varepsilon_1 = \\frac{\\sigma_1 - \\nu_{12}\\sigma_2}{E_1}', d: 'o efeito de Poisson entra: o envelope vira um paralelogramo' },
        { g: 'Tsai-Hill — critério do máximo trabalho' },
        { tex: '\\left(\\frac{\\sigma_1}{X}\\right)^2 - \\frac{\\sigma_1\\sigma_2}{X^2} + \\left(\\frac{\\sigma_2}{Y}\\right)^2 + \\left(\\frac{\\tau_{12}}{S}\\right)^2 = 1', d: 'X e Y conforme o sinal de σ₁ e σ₂; derivado de von Mises para material ortotrópico', destaque: true },
        { g: 'Tsai-Wu — interação quadrática' },
        { tex: 'F_1\\sigma_1 + F_2\\sigma_2 + F_{11}\\sigma_1^2 + F_{22}\\sigma_2^2 + F_{66}\\tau_{12}^2 + 2F_{12}\\sigma_1\\sigma_2 = 1', destaque: true },
        { tex: 'F_1 = \\frac{1}{X_t} - \\frac{1}{X_c}, \\quad F_2 = \\frac{1}{Y_t} - \\frac{1}{Y_c}', d: 'termos lineares: distinguem tração de compressão' },
        { tex: 'F_{11} = \\frac{1}{X_tX_c}, \\quad F_{22} = \\frac{1}{Y_tY_c}, \\quad F_{66} = \\frac{1}{S^2}, \\quad F_{12} = F_{12}^*\\sqrt{F_{11}F_{22}}' },
        { g: 'Fator de segurança' },
        { tex: 'FS \\cdot \\text{(carga)} \\Rightarrow \\text{índice} = 1', d: 'em Tsai-Hill FS = 1/√IH; em Tsai-Wu resolve-se a quadrática em FS' }
      ],
      passos: [],
      nota: 'Critérios de falha da lâmina em estado plano de tensão, com as resistências medidas em ensaios uniaxiais. Nenhum deles enxerga o mecanismo físico: são ajustes a envelopes experimentais. A tensão máxima informa o modo de falha, o que os interativos não fazem; os interativos acertam melhor nos quadrantes mistos. Os dados de Y_c e S são os que mais variam entre fontes — confira sempre de onde vieram.',
      calcular: function (p, ctx) {
        var L = MMC.laminas[p.lamina];
        var R = L;
        var s = [p.s1, p.s2, p.t12];
        var cr = MMC.criterios(s, R, p.f12);
        var n21 = L.n12 * L.E2 / L.E1;
        var e = [(p.s1 - L.n12 * p.s2) / (L.E1 * 1000), (p.s2 - n21 * p.s1) / (L.E2 * 1000), p.t12 / (L.G12 * 1000)];
        var cd = MMC.defMax(e, R, { E1: L.E1, E2: L.E2 });

        var g1 = ctx.plot('env').clear();
        var env;
        if (p.verMax) { env = envelope(R, L, p.t12, p.f12, 'max'); g1.line(env.xs, env.ys, { color: Plot.serie(0), width: 2.4, label: 'Tensão máxima' }); }
        if (p.verDef) { env = envelope(R, L, p.t12, p.f12, 'def'); g1.line(env.xs, env.ys, { color: Plot.serie(6), width: 1.8, dash: [7, 4], label: 'Deformação máxima' }); }
        if (p.verHill) { env = envelope(R, L, p.t12, p.f12, 'hill'); g1.line(env.xs, env.ys, { color: Plot.serie(2), width: 2.4, label: 'Tsai-Hill' }); }
        if (p.verWu) { env = envelope(R, L, p.t12, p.f12, 'wu'); g1.line(env.xs, env.ys, { color: Plot.serie(4), width: 2.4, label: 'Tsai-Wu' }); }
        g1.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [2, 3] });
        g1.vline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [2, 3] });
        g1.marker(p.s1, p.s2, 'estado atual', { color: cr.fsMax >= 1 ? Plot.serie(1) : Plot.serie(3), r: 5.5 });
        /* raio até o envelope de Tsai-Hill, mostrando o FS graficamente */
        g1.line([0, p.s1 * cr.fsHill], [0, p.s2 * cr.fsHill], { color: Plot.serie(2), width: 1.2, dash: [4, 3] });
        g1.setLimits([-R.Xc * 1.25, R.Xt * 1.25], [-R.Yc * 1.45, R.Yt * 1.9]).draw();

        var g2 = ctx.plot('off').clear();
        var ts = Plot.linspace(0, 90, 91);
        function sx(sel) {
          return ts.map(function (t) {
            var q = MMC.foraEixoResistencia(rad(t), R, p.f12);
            return sel(q);
          });
        }
        g2.line(ts, sx(function (q) { return q.maxTensao; }), { color: Plot.serie(0), width: 2.4, label: 'Tensão máxima' });
        g2.line(ts, sx(function (q) { return q.hill; }), { color: Plot.serie(2), width: 2.4, label: 'Tsai-Hill' });
        g2.line(ts, sx(function (q) { return q.wu; }), { color: Plot.serie(4), width: 2, dash: [6, 4], label: 'Tsai-Wu' });
        g2.hline(R.Yt, { text: 'Y_t = ' + pt(R.Yt, 3) + ' MPa', color: Plot.serie(1) });
        g2.setLimits([0, 90], [0, R.Xt * 1.05]).draw();

        var fss = [cr.fsMax, cr.fsHill, cr.fsWu];
        var disp = (Math.max.apply(null, fss) / Math.max(Math.min.apply(null, fss), 1e-9) - 1) * 100;

        ctx.setPassos([
          {
            t: '① Razões de tensão e o modo de falha',
            tex: 'R_1 = \\frac{|\\sigma_1|}{X}, \\quad R_2 = \\frac{|\\sigma_2|}{Y}, \\quad R_6 = \\frac{|\\tau_{12}|}{S}',
            texSub: 'R_1 = \\frac{' + nt(Math.abs(p.s1), 4) + '}{' + nt(cr.X, 4) + '} = ' + nt(cr.r1, 4) +
              ',\\quad R_2 = \\frac{' + nt(Math.abs(p.s2), 4) + '}{' + nt(cr.Y, 4) + '} = ' + nt(cr.r2, 4) +
              ',\\quad R_6 = \\frac{' + nt(Math.abs(p.t12), 4) + '}{' + nt(R.S, 3) + '} = ' + nt(cr.r6, 4),
            r: 'FS = 1/max(R) = ' + pt(cr.fsMax, 4) + ' — modo: ' + cr.modo,
            obs: 'X = ' + pt(cr.X, 4) + ' MPa (σ₁ ' + (p.s1 >= 0 ? 'de tração' : 'de compressão') + ') e Y = ' + pt(cr.Y, 4) +
              ' MPa (σ₂ ' + (p.s2 >= 0 ? 'de tração' : 'de compressão') + '). Esse é o grande mérito do critério: ele diz onde a lâmina vai romper.'
          },
          {
            t: '② Deformação máxima',
            tex: '\\varepsilon_1 = \\frac{\\sigma_1 - \\nu_{12}\\sigma_2}{E_1}, \\quad \\varepsilon_2 = \\frac{\\sigma_2 - \\nu_{21}\\sigma_1}{E_2}',
            texSub: '\\varepsilon_1 = ' + nt(e[0] * 100, 4) + '\\%,\\quad \\varepsilon_2 = ' + nt(e[1] * 100, 4) + '\\%,\\quad \\gamma_{12} = ' + nt(e[2] * 100, 4) + '\\%',
            r: 'FS = ' + pt(cd.fs, 4),
            obs: 'A diferença em relação à tensão máxima vem do termo de Poisson: um σ₂ de tração alivia ε₁, e um σ₁ grande pode levar ε₂ ao limite mesmo com σ₂ pequeno. É o critério que melhor explica a falha de laminados cruzados de carbono.'
          },
          {
            t: '③ Tsai-Hill',
            tex: 'IH = \\left(\\frac{\\sigma_1}{X}\\right)^2 - \\frac{\\sigma_1\\sigma_2}{X^2} + \\left(\\frac{\\sigma_2}{Y}\\right)^2 + \\left(\\frac{\\tau_{12}}{S}\\right)^2',
            texSub: 'IH = ' + nt((p.s1 / cr.X) * (p.s1 / cr.X), 4) + ' - ' + nt(p.s1 * p.s2 / (cr.X * cr.X), 4) +
              ' + ' + nt((p.s2 / cr.Y) * (p.s2 / cr.Y), 4) + ' + ' + nt((p.t12 / R.S) * (p.t12 / R.S), 4) + ' = ' + nt(cr.ih, 4),
            r: 'IH ' + (cr.ih < 1 ? '< 1: não rompe' : '≥ 1: rompe') + ' · FS = 1/√IH = ' + pt(cr.fsHill, 4),
            obs: 'Como o índice é homogêneo de grau 2 nas tensões, o fator de segurança sai direto: FS = 1/√IH. O termo cruzado −σ₁σ₂/X² é o que faz o envelope ser uma elipse inclinada em vez de um retângulo.'
          },
          {
            t: '④ Coeficientes de Tsai-Wu',
            tex: 'F_1 = \\frac{1}{X_t}-\\frac{1}{X_c}, \\ F_2 = \\frac{1}{Y_t}-\\frac{1}{Y_c}, \\ F_{11} = \\frac{1}{X_tX_c}, \\ F_{22} = \\frac{1}{Y_tY_c}, \\ F_{66} = \\frac{1}{S^2}',
            texSub: 'F_1 = ' + nt(cr.F1, 4) + ',\\ F_2 = ' + nt(cr.F2, 4) + ',\\ F_{11} = ' + nt(cr.F11, 4) +
              ',\\ F_{22} = ' + nt(cr.F22, 4) + ',\\ F_{66} = ' + nt(cr.F66, 4) + ',\\ F_{12} = ' + nt(cr.F12, 4),
            obs: 'F₂ é muito maior que F₁ porque Y_t e Y_c são pequenos e bem diferentes entre si. Não existe ensaio simples para F₁₂: ele se ajusta por ensaio biaxial ou se adota F₁₂* entre −1 e 1. Com F₁₂* = −0,5 o critério coincide com Hoffman; com X_t = X_c e Y_t = Y_c ele degenera em Tsai-Hill.'
          },
          {
            t: '⑤ Tsai-Wu e a comparação final',
            tex: 'a\\,FS^2 + b\\,FS = 1, \\quad a = F_{11}\\sigma_1^2 + F_{22}\\sigma_2^2 + F_{66}\\tau^2 + 2F_{12}\\sigma_1\\sigma_2, \\quad b = F_1\\sigma_1 + F_2\\sigma_2',
            texSub: 'FS_{TW} = ' + nt(cr.fsWu, 4) + ' \\qquad FS_{TH} = ' + nt(cr.fsHill, 4) + ' \\qquad FS_{max} = ' + nt(cr.fsMax, 4),
            r: 'Discrepância entre os critérios: ' + pt(disp, 3) + ' %',
            obs: disp > 25
              ? 'Discrepância grande: é sinal de estado de tensão em quadrante misto, onde os critérios realmente divergem. Nesse caso a escolha do critério é decisão de projeto, não detalhe — adote o mais conservador e diga qual usou.'
              : 'Os três critérios concordam aqui. Em carregamento quase uniaxial isso é esperado: todos são ajustados para reproduzir os mesmos ensaios uniaxiais.'
          }
        ]);

        return {
          r1: { v: cr.r1, u: '' },
          r2: { v: cr.r2, u: '' },
          r6: { v: cr.r6, u: '' },
          fsMax: { v: cr.fsMax, u: '', classe: cr.fsMax < 1 ? 'alerta' : 'ok' },
          modo: { v: cr.modo, u: '' },
          fsDef: { v: cd.fs, u: '', classe: cd.fs < 1 ? 'alerta' : '' },
          ih: { v: cr.ih, u: '', classe: cr.ih > 1 ? 'alerta' : '' },
          fsHill: { v: cr.fsHill, u: '', classe: cr.fsHill < 1 ? 'alerta' : 'destaque' },
          iw: { v: cr.iw, u: '', classe: cr.iw > 1 ? 'alerta' : '' },
          fsWu: { v: cr.fsWu, u: '', classe: cr.fsWu < 1 ? 'alerta' : 'destaque' },
          veredito: {
            v: Math.min(cr.fsMax, cr.fsHill, cr.fsWu) < 1 ? 'A lâmina rompe' : 'A lâmina resiste',
            u: '', classe: Math.min(cr.fsMax, cr.fsHill, cr.fsWu) < 1 ? 'alerta' : 'ok'
          },
          disp: { v: disp, u: '%' }
        };
      }
    });
  })();

  /* ========================================================================
     5. Cura, tensões térmicas e falha progressiva ply-by-ply
     ======================================================================== */
  (function () {
    if (!document.getElementById('sim-progressiva')) return;

    var PILHAS = {
      ud: { rot: '[0]₄', angs: [0, 0], sim: true },
      cruzado: { rot: '[0/90]_S', angs: [0, 90], sim: true },
      cruzado3: { rot: '[0/90/0]_S', angs: [0, 90, 0], sim: true },
      angular: { rot: '[±45]_S', angs: [45, -45], sim: true },
      qi: { rot: '[0/45/−45/90]_S', angs: [0, 45, -45, 90], sim: true },
      assim: { rot: '[0/90]_T', angs: [0, 90], sim: false }
    };

    /* monta o laminado, com as camadas marcadas em "degradadas" ou não */
    function monta(L, esp, pil, degr, fator) {
      var cam = MMC.pilha(pil.angs, esp, pil.sim);
      var h = 0; cam.forEach(function (c) { h += c.t; });
      var z = -h / 2, i, j;
      var A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        B = [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        D = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      var Qint = MMC.Q(L.E1 * 1000, L.E2 * 1000, L.G12 * 1000, L.n12);
      var Qdeg = MMC.Q(L.E1 * 1000, L.E2 * 1000 * fator, L.G12 * 1000 * fator, L.n12 * fator);
      var info = [];
      cam.forEach(function (c, k) {
        var z0 = z, z1 = z + c.t;
        var dq = degr && degr[k];
        var Qb = MMC.toM(MMC.Qbar(dq ? Qdeg : Qint, MMC.rad(c.th)));
        for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) {
          A[i][j] += Qb[i][j] * (z1 - z0);
          B[i][j] += Qb[i][j] * (z1 * z1 - z0 * z0) / 2;
          D[i][j] += Qb[i][j] * (z1 * z1 * z1 - z0 * z0 * z0) / 3;
        }
        info.push({ th: c.th, t: c.t, z0: z0, z1: z1, zm: (z0 + z1) / 2, Qb: Qb, deg: !!dq });
        z = z1;
      });
      var a = MMC.inv3(A);
      return { A: A, B: B, D: D, a: a, h: h, info: info, Ex: 1 / (a[0][0] * h) };
    }
    /* estado das camadas para um dado Nx, já com a parcela térmica/higroscópica */
    function estado(cl, L, dT, dC, Nx) {
      var t = MMC.termico(cl, L, dT, dC);
      var sol = MMC.resolve6(cl.A, cl.B, cl.D,
        [Nx + t.NT[0], t.NT[1], t.NT[2]], [t.MT[0], t.MT[1], t.MT[2]]);
      return { cs: MMC.camadas(cl, sol.e0, sol.k, true), e0: sol.e0, k: sol.k, NT: t.NT, MT: t.MT };
    }
    /* maior razão de tensão entre as camadas (só os modos pedidos) */
    function pico(cs, L, modos) {
      var melhor = { r: 0 };
      cs.forEach(function (q, i) {
        var cr = MMC.criterios(q.s12, L);
        var r = modos === 'fibra' ? cr.r1 : Math.max(cr.r2, cr.r6);
        if (r > melhor.r) melhor = { r: r, i: i, cr: cr, q: q };
      });
      return melhor;
    }
    function acha(cl, L, dT, dC, modos, Nmax) {
      var lo = 0, hi = Nmax, i, mid;
      if (pico(estado(cl, L, dT, dC, 0).cs, L, modos).r >= 1) return 0;
      if (pico(estado(cl, L, dT, dC, hi).cs, L, modos).r < 1) return Infinity;
      for (i = 0; i < 60; i++) {
        mid = (lo + hi) / 2;
        if (pico(estado(cl, L, dT, dC, mid).cs, L, modos).r < 1) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }

    function barras(c, pl, d) {
      var a = pl._area, cs = d.cs, L = d.L;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var n = cs.length;
      var topo = a.y + 34, baixo = a.y + a.h - 30;
      var lh = Math.min(30, (baixo - topo) / n);
      var x0 = a.x + 86, larg = a.w - 86 - 150;
      rotulo(c, 'camada', a.x + 78, topo - 18, faint, 10.5, '700', 'right');
      rotulo(c, 'quanto de cada limite já foi consumido', x0 + larg / 2, topo - 18, faint, 10.5, '700');
      rotulo(c, 'σ₂ (MPa)', a.x + a.w - 8, topo - 18, faint, 10.5, '700', 'right');
      for (var i = 0; i < n; i++) {
        var q = cs[i], y = topo + i * lh + lh / 2;
        var cr = MMC.criterios(q.s12, L);
        rotulo(c, (q.th > 0 ? '+' : '') + pt(q.th, 3) + '°' + (d.info[i].deg ? ' (trincada)' : ''),
          a.x + 78, y, d.info[i].deg ? Plot.serie(1) : cor, 11, '700', 'right');
        /* trilha */
        c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
        c.fillRect(x0, y - 9, larg, 18);
        /* três barrinhas: fibra, matriz, cisalhamento */
        [[cr.r1, 0], [cr.r2, 2], [cr.r6, 4]].forEach(function (par, j) {
          var w = Math.min(1, par[0]) * larg;
          c.fillStyle = Plot.serie(par[1]);
          c.globalAlpha = par[0] >= 1 ? 1 : 0.8;
          c.fillRect(x0, y - 9 + j * 6, w, 5);
          c.globalAlpha = 1;
        });
        /* linha do limite */
        c.strokeStyle = Plot.serie(1); c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(x0 + larg, y - 10); c.lineTo(x0 + larg, y + 10); c.stroke();
        rotulo(c, pt(q.s12[1], 3), a.x + a.w - 8, y, cr.r2 >= 1 ? Plot.serie(1) : cor, 11, '600', 'right');
      }
      rotulo(c, 'barras: σ₁/X (claro) · σ₂/Y · τ₁₂/S — a linha vertical é o limite',
        x0 + larg / 2, baixo + 14, faint, 10, '400');
    }

    Sim.build('#sim-progressiva', {
      titulo: 'Cura, tensões térmicas e falha progressiva camada a camada',
      descricao: 'O laminado já sai do molde carregado: ao esfriar da temperatura de cura, cada camada quer encolher muito na direção transversal à fibra e é impedida pelas vizinhas. Some a isso a carga de serviço e a primeira camada trinca bem antes do colapso. Acompanhe o joelho da curva — a primeira ruptura (FPF) — e quanto ainda sobra até a ruptura final (LPF).',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Cruzado, só a cura', desc: '[0/90]_S esfriando 150 °C, sem carga', valores: { lamina: 'carbono', pilha: 'cruzado', esp: 0.25, dT: -150, dC: 0, fator: 0.1 } },
        { nome: '2 · Cruzado sob tração', desc: 'o joelho de FPF aparece', valores: { lamina: 'carbono', pilha: 'cruzado', esp: 0.25, dT: -150, dC: 0, fator: 0.1 } },
        { nome: '3 · Sem tensão de cura', desc: 'ΔT = 0: compare o Nx de FPF', valores: { lamina: 'carbono', pilha: 'cruzado', esp: 0.25, dT: 0, dC: 0, fator: 0.1 } },
        { nome: '4 · Umidade alivia a cura', desc: 'o laminado incha e compensa', valores: { lamina: 'carbono', pilha: 'cruzado', esp: 0.25, dT: -150, dC: 0.012, fator: 0.1 } },
        { nome: '5 · Quase-isotrópico', desc: '[0/45/−45/90]_S: mais modos de falha', valores: { lamina: 'carbono', pilha: 'qi', esp: 0.25, dT: -150, dC: 0, fator: 0.1 } },
        { nome: '6 · Unidirecional', desc: '[0]₄: sem restrição mútua, sem tensão de cura', valores: { lamina: 'carbono', pilha: 'ud', esp: 0.25, dT: -150, dC: 0, fator: 0.1 } },
        { nome: '7 · Assimétrico empena', desc: '[0/90]_T com B ≠ 0: curvatura de cura', valores: { lamina: 'carbono', pilha: 'assim', esp: 0.25, dT: -150, dC: 0, fator: 0.1 } },
        { nome: '8 · Vidro/epóxi', desc: 'α menos desigual, cura mais branda', valores: { lamina: 'vidro', pilha: 'cruzado', esp: 0.3, dT: -120, dC: 0, fator: 0.1 } }
      ],
      controles: [
        { id: 'lamina', tipo: 'select', label: 'Lâmina', valor: 'carbono', opcoes: MMC.opcoesLamina() },
        {
          id: 'pilha', tipo: 'select', label: 'Empilhamento', valor: 'cruzado',
          opcoes: Object.keys(PILHAS).map(function (k) { return { v: k, t: PILHAS[k].rot }; })
        },
        { id: 'esp', label: 'Espessura de cada camada', min: 0.1, max: 0.5, step: 0.01, valor: 0.25, unidade: 'mm' },
        { tipo: 'titulo', label: 'Histórico higrotérmico' },
        {
          id: 'dT', label: 'Variação de temperatura ΔT', min: -200, max: 80, step: 5, valor: -150, unidade: '°C',
          desc: 'Negativo = uso mais frio que a cura. Epóxi de autoclave cura a 180 °C; em voo a −55 °C, ΔT ≈ −235 °C'
        },
        {
          id: 'dC', label: 'Umidade absorvida Δc', min: 0, max: 0.02, step: 0.001, valor: 0, unidade: '',
          desc: 'Fração em massa de água. Epóxi saturado chega a 1,5–2 %; o inchamento é de sinal oposto à contração de cura'
        },
        { tipo: 'titulo', label: 'Degradação após a primeira ruptura' },
        {
          id: 'fator', label: 'Fator de redução de E₂ e G₁₂', min: 0.01, max: 1, step: 0.01, valor: 0.1, unidade: '',
          desc: 'Método da degradação: 0,1 é o valor usual para camada com trinca transversal; 1 = sem degradação'
        }
      ],
      graficos: [
        {
          id: 'curva', titulo: 'Tensão média no laminado × deformação, com FPF e LPF',
          xlabel: 'Deformação ε_x (%)', ylabel: 'Tensão média N_x/h (MPa)', aspect: 0.48, legendPos: 'topleft'
        },
        { id: 'margens', axes: false, grid: false, legend: false, height: 250 }
      ],
      saidas: [
        { id: 'NTx', label: 'Força térmica N^T_x' },
        { id: 'alfa', label: 'α_x do laminado' },
        { id: 's2cura', label: 'σ₂ residual de cura (pior camada)' },
        { id: 'fracao', label: 'Y_t já consumido pela cura' },
        { id: 'kappa', label: 'Curvatura de cura κ_x' },
        { id: 'NxFPF', label: 'N_x de primeira ruptura' },
        { id: 'sFPF', label: 'Tensão média na FPF' },
        { id: 'camFPF', label: 'Camada que trinca primeiro' },
        { id: 'NxLPF', label: 'N_x de ruptura final' },
        { id: 'sLPF', label: 'Tensão média na LPF' },
        { id: 'reserva', label: 'Reserva depois da FPF' },
        { id: 'perdaE', label: 'Queda de E_x na FPF' }
      ],
      formulas: [
        { g: 'Deformação livre de origem térmica e higroscópica' },
        { tex: '\\varepsilon_1^{lv} = \\alpha_1\\Delta T + \\beta_1\\Delta c \\qquad \\varepsilon_2^{lv} = \\alpha_2\\Delta T + \\beta_2\\Delta c', d: 'α₂ ≫ α₁: a matriz contrai muito mais que a fibra', destaque: true },
        { tex: '\\begin{Bmatrix} \\varepsilon_x \\\\ \\varepsilon_y \\\\ \\gamma_{xy}\\end{Bmatrix}^{lv} = \\begin{Bmatrix} \\alpha_1 c^2 + \\alpha_2 s^2 \\\\ \\alpha_1 s^2 + \\alpha_2 c^2 \\\\ 2(\\alpha_1-\\alpha_2)cs \\end{Bmatrix}\\Delta T', d: 'levada ao eixo do laminado' },
        { g: 'Forças e momentos equivalentes' },
        { tex: 'N^T_{ij} = \\sum_k [\\bar{Q}]_k\\{\\varepsilon^{lv}\\}_k (z_k - z_{k-1}) \\qquad M^T_{ij} = \\tfrac12\\sum_k [\\bar{Q}]_k\\{\\varepsilon^{lv}\\}_k (z_k^2 - z_{k-1}^2)', destaque: true },
        { tex: '\\{N\\} + \\{N^T\\} = [A]\\{\\varepsilon^0\\} + [B]\\{\\kappa\\}', d: 'o efeito térmico entra como carregamento' },
        { g: 'Tensão em cada camada' },
        { tex: '\\{\\sigma\\}_k = [\\bar{Q}]_k\\left(\\{\\varepsilon^0 + z\\kappa\\} - \\{\\varepsilon^{lv}\\}_k\\right)', d: 'só a parcela impedida gera tensão', destaque: true },
        { g: 'Falha progressiva' },
        { tex: 'E_2 \\to f\\,E_2, \\quad G_{12} \\to f\\,G_{12}, \\quad \\nu_{12} \\to f\\,\\nu_{12}', d: 'camada trincada: método da degradação, f ≈ 0,1' },
        { tex: 'N_x^{FPF} \\;\\to\\; \\text{trinca transversal} \\;\\to\\; N_x^{LPF} \\;\\to\\; \\text{ruptura de fibra}' }
      ],
      passos: [],
      nota: 'β é o coeficiente de expansão higroscópica (deformação por fração de massa de água absorvida); β₁ ≈ 0 e β₂ entre 0,3 e 0,5 nos compósitos de epóxi. O ΔT usado é a diferença entre a temperatura de uso e a de cura — negativo na saída do molde. A degradação adotada é a mais simples da literatura (corte de E₂, G₁₂ e ν₁₂ por um fator), suficiente para localizar o joelho da curva; modelos de dano contínuo descrevem melhor a evolução da trinca.',
      calcular: function (p, ctx) {
        var L = MMC.laminas[p.lamina];
        var pil = PILHAS[p.pilha];
        var cl = monta(L, p.esp, pil, null, p.fator);
        var Nmax = L.Xt * cl.h * 1.2;

        /* estado de cura (sem carga mecânica) */
        var cura = estado(cl, L, p.dT, p.dC, 0);
        var picoCura = pico(cura.cs, L, 'matriz');
        var s2cura = picoCura.q ? picoCura.q.s12[1] : 0;

        /* FPF: trinca transversal ou por cisalhamento */
        var NxFPF = acha(cl, L, p.dT, p.dC, 'matriz', Nmax);
        /* se a matriz nunca falha antes da fibra, FPF é a própria ruptura de fibra */
        var NxFibra = acha(cl, L, p.dT, p.dC, 'fibra', Nmax);
        var houveFPF = isFinite(NxFPF) && NxFPF < NxFibra;
        var NxJoelho = houveFPF ? NxFPF : NxFibra;

        /* degradação das camadas que trincaram e segunda etapa */
        var estJoelho = estado(cl, L, p.dT, p.dC, NxJoelho);
        var degr = estJoelho.cs.map(function (q) {
          var cr = MMC.criterios(q.s12, L);
          return houveFPF && Math.max(cr.r2, cr.r6) > 0.999;
        });
        var cl2 = houveFPF ? monta(L, p.esp, pil, degr, p.fator) : cl;
        var NxLPF = acha(cl2, L, p.dT, p.dC, 'fibra', Nmax * 1.5);
        if (!isFinite(NxLPF) || NxLPF < NxJoelho) NxLPF = NxJoelho;

        /* curva tensão média × deformação, medida a partir do estado pós-cura */
        var e00 = cura.e0[0];
        var pontos = { xs: [0], ys: [0] };
        var eJ = estado(cl, L, p.dT, p.dC, NxJoelho).e0[0] - e00;
        pontos.xs.push(eJ * 100); pontos.ys.push(NxJoelho / cl.h);
        var eL = (estado(cl2, L, p.dT, p.dC, NxLPF).e0[0] - estado(cl2, L, p.dT, p.dC, NxJoelho).e0[0]) + eJ;
        pontos.xs.push(eL * 100); pontos.ys.push(NxLPF / cl.h);

        var g1 = ctx.plot('curva').clear();
        g1.line(pontos.xs, pontos.ys, { color: Plot.serie(0), width: 2.8, label: 'Laminado com degradação' });
        /* referência: laminado sem degradar, extrapolado */
        var eRef = eJ * (NxLPF / Math.max(NxJoelho, 1e-9));
        g1.line([0, eRef * 100], [0, NxLPF / cl.h], { color: Plot.serie(2), width: 1.6, dash: [6, 4], label: 'Sem degradar (elástico)' });
        g1.marker(eJ * 100, NxJoelho / cl.h, houveFPF ? 'FPF · ' + pt(NxJoelho / cl.h, 4) + ' MPa' : 'ruptura direta', { color: Plot.serie(1), r: 5.5 });
        g1.marker(eL * 100, NxLPF / cl.h, 'LPF · ' + pt(NxLPF / cl.h, 4) + ' MPa', { color: Plot.serie(3), r: 5.5 });
        g1.hline(NxJoelho / cl.h, { text: 'primeira ruptura', color: Plot.serie(1) });
        g1.setLimits([0, Math.max(eL * 100 * 1.15, 0.05)], [0, Math.max(NxLPF / cl.h * 1.15, 10)]).draw();

        var g2 = ctx.plot('margens');
        g2.clear(); g2.setLimits([0, 1], [0, 1]);
        g2.custom(function (c, pl) { barras(c, pl, { cs: estJoelho.cs, info: cl2.info, L: L }); });
        g2.draw();

        var alfa = p.dT !== 0 ? (cura.e0[0] - (p.dC ? 0 : 0)) / p.dT : 0;
        var camFPF = picoCura.q ? picoCura.q.th : 0;
        var iFPF = estJoelho.cs.reduce(function (m, q, i) {
          var cr = MMC.criterios(q.s12, L);
          var r = Math.max(cr.r2, cr.r6);
          return r > m.r ? { r: r, th: q.th } : m;
        }, { r: 0, th: 0 });

        ctx.setPassos([
          {
            t: '① Deformação livre de cada camada',
            tex: '\\varepsilon_1^{lv} = \\alpha_1\\Delta T + \\beta_1\\Delta c, \\qquad \\varepsilon_2^{lv} = \\alpha_2\\Delta T + \\beta_2\\Delta c',
            texSub: '\\varepsilon_1^{lv} = ' + nt(L.a1, 3) + '\\cdot(' + nt(p.dT, 4) + ') = ' + nt(L.a1 * p.dT * 100, 4) +
              '\\%, \\qquad \\varepsilon_2^{lv} = ' + nt(L.a2, 3) + '\\cdot(' + nt(p.dT, 4) + ') + ' + nt(L.b2, 3) + '\\cdot' + nt(p.dC, 3) +
              ' = ' + nt((L.a2 * p.dT + L.b2 * p.dC) * 100, 4) + '\\%',
            obs: 'α₂/α₁ chega a ' + (Math.abs(L.a1) > 1e-9 ? pt(Math.abs(L.a2 / L.a1), 3) : 'mais de cem') +
              ' nesta lâmina: a fibra praticamente não varia de comprimento, a matriz varia muito. Essa desigualdade é a origem de toda a tensão residual de cura.'
          },
          {
            t: '② Forças térmicas equivalentes',
            tex: '\\{N^T\\} = \\sum_k [\\bar{Q}]_k\\{\\varepsilon^{lv}\\}_k \\Delta z_k',
            texSub: 'N^T = \\{' + nt(cura.NT[0], 4) + ';\\ ' + nt(cura.NT[1], 4) + ';\\ ' + nt(cura.NT[2], 4) +
              '\\}\\ \\mathrm{N/mm} \\qquad M^T_x = ' + nt(cura.MT[0], 4) + '\\ \\mathrm{N\\,mm/mm}',
            r: Math.abs(cura.MT[0]) > 1e-6 ? 'M^T ≠ 0: a placa sai empenada do molde' : 'M^T = 0: laminado simétrico, placa plana',
            obs: 'O efeito térmico entra na equação constitutiva como se fosse um carregamento aplicado. Se o laminado for simétrico, M^T some e só há contração no plano; se não for, a placa curva sozinha ao esfriar — é por isso que placa assimétrica praticamente não se usa.'
          },
          {
            t: '③ Coeficiente de dilatação do laminado',
            tex: '\\alpha_x^{lam} = \\frac{\\varepsilon^0_x}{\\Delta T}',
            texSub: '\\varepsilon^0_x = ' + nt(cura.e0[0] * 100, 4) + '\\% \\;\\Rightarrow\\; \\alpha_x^{lam} = ' + nt(alfa, 4) + '\\ ^\\circ\\mathrm{C}^{-1}',
            obs: 'Reparar na ordem de grandeza: um laminado cruzado de carbono tem α da ordem de 10⁻⁶/°C, cem vezes menor que o alumínio (23×10⁻⁶). É o que permite usar compósito em estrutura óptica e em antena de satélite, onde a estabilidade dimensional vale mais que a rigidez.'
          },
          {
            t: '④ Tensão residual de cura',
            tex: '\\{\\sigma\\}_k = [\\bar{Q}]_k\\left(\\{\\varepsilon^0\\} - \\{\\varepsilon^{lv}\\}_k\\right)',
            texSub: '\\sigma_2^{res} = ' + nt(s2cura, 4) + '\\ \\mathrm{MPa} \\quad \\text{contra} \\quad Y_t = ' + nt(L.Yt, 3) + '\\ \\mathrm{MPa}',
            r: 'A cura já consumiu ' + pt(100 * Math.abs(s2cura) / L.Yt, 3) + ' % da resistência transversal',
            obs: Math.abs(s2cura) > L.Yt
              ? 'Acima de Y_t: a camada trinca só de esfriar, antes de qualquer carga. É o microfissuramento que aparece em laminados de carbono curados em alta temperatura e usados em criogenia.'
              : 'Ignorar essa parcela é o erro clássico: o cálculo "dá certo" na prova e a peça trinca no molde. A tensão de cura é de tração transversal porque cada camada é impedida de encolher pelas vizinhas de orientação diferente.'
          },
          {
            t: '⑤ Primeira ruptura (FPF) e ruptura final (LPF)',
            tex: 'N_x^{FPF} \\;\\to\\; E_2 \\to ' + nt(p.fator, 3) + 'E_2 \\;\\to\\; N_x^{LPF}',
            texSub: 'N_x^{FPF} = ' + nt(NxJoelho, 4) + '\\ \\mathrm{N/mm} \\;(\\sigma = ' + nt(NxJoelho / cl.h, 4) +
              '\\ \\mathrm{MPa}) \\qquad N_x^{LPF} = ' + nt(NxLPF, 4) + '\\ \\mathrm{N/mm} \\;(\\sigma = ' + nt(NxLPF / cl.h, 4) + '\\ \\mathrm{MPa})',
            r: houveFPF
              ? 'Reserva após a primeira trinca: ' + pt(100 * (NxLPF / Math.max(NxJoelho, 1e-9) - 1), 3) + ' % · camada crítica: ' + pt(iFPF.th, 3) + '°'
              : 'Não há FPF separada: a fibra rompe antes de a matriz trincar',
            obs: houveFPF
              ? 'A camada a ' + pt(iFPF.th, 3) + '° trinca transversalmente e perde rigidez, mas a estrutura segue carregando pelas fibras das outras direções: E_x cai de ' +
              pt(cl.Ex / 1000, 4) + ' para ' + pt(cl2.Ex / 1000, 4) + ' GPa. Projeto que admite FPF é mais leve; projeto que a proíbe (vaso de pressão, estrutura que precisa de estanqueidade) dimensiona pela FPF e paga em massa.'
              : 'Num unidirecional carregado na fibra não existe camada transversal para trincar: a curva é reta até a ruptura, sem joelho.'
          }
        ]);

        return {
          NTx: { v: cura.NT[0], u: 'N/mm' },
          alfa: { v: alfa, u: '1/°C' },
          s2cura: { v: s2cura, u: 'MPa', classe: Math.abs(s2cura) > L.Yt ? 'alerta' : '' },
          fracao: { v: 100 * Math.abs(s2cura) / L.Yt, u: '%', classe: Math.abs(s2cura) > 0.6 * L.Yt ? 'alerta' : '' },
          kappa: { v: cura.k[0], u: '1/mm', classe: Math.abs(cura.k[0]) > 1e-6 ? 'alerta' : 'ok' },
          NxFPF: { v: NxJoelho, u: 'N/mm' },
          sFPF: { v: NxJoelho / cl.h, u: 'MPa', classe: 'destaque' },
          camFPF: { v: houveFPF ? (iFPF.th > 0 ? '+' : '') + pt(iFPF.th, 3) + '°' : 'nenhuma', u: '' },
          NxLPF: { v: NxLPF, u: 'N/mm' },
          sLPF: { v: NxLPF / cl.h, u: 'MPa', classe: 'destaque' },
          reserva: { v: 100 * (NxLPF / Math.max(NxJoelho, 1e-9) - 1), u: '%', classe: 'ok' },
          perdaE: { v: 100 * (1 - cl2.Ex / cl.Ex), u: '%' }
        };
      }
    });
  })();
})();

/* ==========================================================================
   Mecânica dos Fluidos II — modelos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · Camada limite: solução de Blasius (Runge-Kutta com tiro) e correlações
       turbulentas; espessuras, atrito local e arrasto
     · Escoamento externo: Cd de esfera e cilindro, velocidade terminal
     · Escoamento potencial: cilindro com circulação e Kutta-Joukowski;
       polar de aerofólio (teoria da linha sustentadora)
     · Canais abertos: energia específica, profundidade crítica, Manning,
       ressalto hidráulico
     · Escoamento compressível com atrito (Fanno) e com calor (Rayleigh)
   ========================================================================== */
(function (global) {
  'use strict';
  var MF2 = {};

  /* ---------------- fluidos ---------------- */
  MF2.FLUIDOS = {
    ar:    { nome: 'Ar a 20 °C', rho: 1.204, mu: 1.825e-5 },
    arq:   { nome: 'Ar a 200 °C', rho: 0.746, mu: 2.58e-5 },
    agua:  { nome: 'Água a 20 °C', rho: 998.2, mu: 1.002e-3 },
    aguaq: { nome: 'Água a 80 °C', rho: 971.8, mu: 3.55e-4 },
    oleo:  { nome: 'Óleo SAE 30 a 20 °C', rho: 891, mu: 0.29 },
    glic:  { nome: 'Glicerina a 20 °C', rho: 1260, mu: 1.49 }
  };

  /* ==========================================================================
     Camada limite laminar — solução de Blasius
     f''' + ½ f f'' = 0,  f(0) = f'(0) = 0,  f'(∞) = 1
     Resolvida por Runge-Kutta 4 com tiro em f''(0).
     ========================================================================== */
  function blasiusRK(s, etaMax, h) {
    /* y = [f, f', f''] */
    var y = [0, 0, s], eta = 0, saida = [[0, 0, 0, s]];
    var deriv = function (v) { return [v[1], v[2], -0.5 * v[0] * v[2]]; };
    var n = Math.round(etaMax / h);
    for (var i = 0; i < n; i++) {
      var k1 = deriv(y);
      var y2 = [y[0] + h / 2 * k1[0], y[1] + h / 2 * k1[1], y[2] + h / 2 * k1[2]];
      var k2 = deriv(y2);
      var y3 = [y[0] + h / 2 * k2[0], y[1] + h / 2 * k2[1], y[2] + h / 2 * k2[2]];
      var k3 = deriv(y3);
      var y4 = [y[0] + h * k3[0], y[1] + h * k3[1], y[2] + h * k3[2]];
      var k4 = deriv(y4);
      y = [y[0] + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
           y[1] + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
           y[2] + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
      eta += h;
      saida.push([eta, y[0], y[1], y[2]]);
    }
    return saida;
  }
  var _blasius = null;
  MF2.blasius = function () {
    if (_blasius) return _blasius;
    /* tiro: procura s = f''(0) tal que f'(∞) = 1 */
    var lo = 0.1, hi = 1.0, s, perfil;
    for (var it = 0; it < 60; it++) {
      s = (lo + hi) / 2;
      perfil = blasiusRK(s, 10, 0.005);
      if (perfil[perfil.length - 1][2] < 1) lo = s; else hi = s;
    }
    /* espessuras integrais */
    var dStar = 0, theta = 0;
    for (var i = 1; i < perfil.length; i++) {
      var u0 = perfil[i - 1][2], u1 = perfil[i][2], dh = perfil[i][0] - perfil[i - 1][0];
      dStar += dh * ((1 - u0) + (1 - u1)) / 2;
      theta += dh * ((u0 * (1 - u0)) + (u1 * (1 - u1))) / 2;
    }
    /* η em que u/U = 0,99 */
    var eta99 = 0;
    for (i = 1; i < perfil.length; i++) {
      if (perfil[i][2] >= 0.99) {
        var a = perfil[i - 1], b = perfil[i];
        eta99 = a[0] + (0.99 - a[2]) * (b[0] - a[0]) / (b[2] - a[2]);
        break;
      }
    }
    _blasius = { fpp0: s, perfil: perfil, dStar: dStar, theta: theta, eta99: eta99,
                 H: dStar / theta };
    return _blasius;
  };

  /* camada limite sobre placa plana: espessuras, atrito e arrasto */
  MF2.placa = function (p) {
    var f = p.fluido, nu = f.mu / f.rho;
    var ReL = p.U * p.L / nu;
    var B = MF2.blasius();
    var Recr = p.Recr;
    var xcr = Recr * nu / p.U;
    function local(x) {
      var Rex = p.U * x / nu;
      if (Rex < 1e-9) return { x: x, Rex: 0, delta: 0, dStar: 0, theta: 0, cf: 0, regime: 'laminar' };
      var lam = p.regime === 'laminar' || (p.regime === 'auto' && Rex < Recr);
      if (lam) {
        return { x: x, Rex: Rex, regime: 'laminar',
                 delta: B.eta99 * x / Math.sqrt(Rex),
                 dStar: B.dStar * x / Math.sqrt(Rex),
                 theta: B.theta * x / Math.sqrt(Rex),
                 cf: 2 * B.fpp0 / Math.sqrt(Rex) };     /* = 0,664/√Re_x */
      }
      return { x: x, Rex: Rex, regime: 'turbulenta',
               delta: 0.16 * x / Math.pow(Rex, 1 / 7),
               dStar: 0.02 * x / Math.pow(Rex, 1 / 7),
               theta: 0.016 * x / Math.pow(Rex, 1 / 7),
               cf: 0.0592 / Math.pow(Rex, 0.2) };
    }
    var fim = local(p.L);
    /* coeficiente de arrasto médio */
    var CD;
    if (p.regime === 'laminar' || (p.regime === 'auto' && ReL < Recr)) CD = 1.328 / Math.sqrt(ReL);
    else if (p.regime === 'turbulenta') CD = 0.074 / Math.pow(ReL, 0.2);
    else CD = 0.074 / Math.pow(ReL, 0.2) - (0.074 / Math.pow(Recr, 0.2) - 1.328 / Math.sqrt(Recr)) * Recr / ReL;
    var A = p.L * p.b;
    var D = CD * 0.5 * f.rho * p.U * p.U * A;
    return { nu: nu, ReL: ReL, xcr: xcr, B: B, fim: fim, CD: CD, D: D, A: A,
             local: local, turbulentaEm: p.regime === 'auto' ? xcr : (p.regime === 'turbulenta' ? 0 : Infinity) };
  };

  /* ==========================================================================
     Arrasto de corpos rombudos
     ========================================================================== */
  /* esfera: correlação de Clift-Gauvin, com a crise do arrasto acrescentada */
  MF2.cdEsfera = function (Re) {
    if (Re <= 0) return Infinity;
    var cd = 24 / Re * (1 + 0.15 * Math.pow(Re, 0.687)) + 0.42 / (1 + 42500 * Math.pow(Re, -1.16));
    if (Re > 2e5) {                                    /* crise do arrasto (transição na camada limite) */
      var t = Math.min(1, (Math.log10(Re) - Math.log10(2e5)) / (Math.log10(5e5) - Math.log10(2e5)));
      cd = cd * (1 - t) + 0.12 * t;
      if (Re > 5e5) cd = 0.12 + 0.06 * Math.min(1, (Math.log10(Re) - Math.log10(5e5)) / 1.5);
    }
    return cd;
  };
  /* cilindro longo em escoamento cruzado */
  MF2.cdCilindro = function (Re) {
    if (Re <= 0) return Infinity;
    var cd = 1.1 + 10 * Math.pow(Re, -2 / 3);
    if (Re > 2e5) {
      var t = Math.min(1, (Math.log10(Re) - Math.log10(2e5)) / (Math.log10(5e5) - Math.log10(2e5)));
      cd = cd * (1 - t) + 0.35 * t;
    }
    return cd;
  };
  MF2.CD_FIXOS = {
    placaN: { nome: 'Placa plana normal ao escoamento', cd: 1.98 },
    cubo:   { nome: 'Cubo de frente', cd: 1.05 },
    carro:  { nome: 'Automóvel moderno', cd: 0.30 },
    onibus: { nome: 'Ônibus', cd: 0.80 },
    gota:   { nome: 'Corpo aerodinâmico (gota)', cd: 0.04 },
    parab:  { nome: 'Paraquedas', cd: 1.35 }
  };
  MF2.arrasto = function (p) {
    var f = p.fluido, Re = f.rho * p.U * p.D / f.mu;
    var cd = p.corpo === 'esfera' ? MF2.cdEsfera(Re)
      : p.corpo === 'cilindro' ? MF2.cdCilindro(Re)
      : MF2.CD_FIXOS[p.corpo].cd;
    var A = p.corpo === 'cilindro' ? p.D * p.b : Math.PI * p.D * p.D / 4;
    if (p.Aref) A = p.Aref;
    var D = cd * 0.5 * f.rho * p.U * p.U * A;
    var P = D * p.U;
    /* número de Strouhal da esteira de von Kármán (cilindro, 250 < Re < 2e5) */
    var St = Re > 250 && Re < 2e5 ? 0.198 * (1 - 19.7 / Re) : null;
    return { Re: Re, cd: cd, A: A, D: D, P: P, St: St,
             fVortex: St ? St * p.U / p.D : null,
             separa: Re > 10 };
  };
  /* velocidade terminal de uma esfera em queda (resolve Cd(Re) junto) */
  MF2.terminal = function (p) {
    var f = p.fluido, g = 9.81, d = p.D;
    var W = (p.rhoS - f.rho) * g * Math.PI * Math.pow(d, 3) / 6;
    var lo = 1e-6, hi = 1e3, U;
    for (var i = 0; i < 200; i++) {
      U = Math.sqrt(lo * hi);
      var Re = f.rho * U * d / f.mu;
      var Fd = MF2.cdEsfera(Re) * 0.5 * f.rho * U * U * Math.PI * d * d / 4;
      if (Fd < W) lo = U; else hi = U;
    }
    var ReT = f.rho * U * d / f.mu;
    var Ustokes = (p.rhoS - f.rho) * g * d * d / (18 * f.mu);
    return { U: U, Re: ReT, W: W, cd: MF2.cdEsfera(ReT), Ustokes: Ustokes, stokesVale: ReT < 1 };
  };

  /* ==========================================================================
     Escoamento potencial: cilindro com circulação, e polar de aerofólio
     ========================================================================== */
  MF2.cilindroCirc = function (p) {
    /* ψ = U senθ (r − a²/r) − (Γ/2π) ln(r/a) */
    var a = p.a, U = p.U, G = p.gama;
    var L = p.rho * U * G;                              /* Kutta-Joukowski, por metro */
    var razao = G / (4 * Math.PI * U * a);
    var estag;
    if (Math.abs(razao) <= 1) {
      var th = Math.asin(-razao);
      estag = [{ r: a, th: th }, { r: a, th: Math.PI - th }];
    } else {
      var r1 = a * (Math.abs(razao) + Math.sqrt(razao * razao - 1));
      estag = [{ r: r1, th: razao > 0 ? -Math.PI / 2 : Math.PI / 2 }];
    }
    return { L: L, cl: L / (0.5 * p.rho * U * U * 2 * a), estag: estag, razao: razao,
             psi: function (r, th) { return U * Math.sin(th) * (r - a * a / r) - G / (2 * Math.PI) * Math.log(r / a); },
             vel: function (r, th) {
               var vr = U * Math.cos(th) * (1 - a * a / (r * r));
               var vt = -U * Math.sin(th) * (1 + a * a / (r * r)) + G / (2 * Math.PI * r);
               return { vr: vr, vt: vt, v: Math.hypot(vr, vt) };
             },
             cp: function (th) {
               var v = -2 * U * Math.sin(th) + G / (2 * Math.PI * a);
               return 1 - v * v / (U * U);
             } };
  };
  MF2.aerofolio = function (p) {
    var alfa = p.alfa * Math.PI / 180, a0 = p.alfa0 * Math.PI / 180;
    var AR = p.AR, e = p.e;
    var a2d = 2 * Math.PI;                              /* teoria do aerofólio fino */
    var a3d = a2d / (1 + a2d / (Math.PI * e * AR));     /* correção de alongamento finito */
    var cl = a3d * (alfa - a0);
    var clMax = p.clMax;
    var estol = cl > clMax;
    if (estol) cl = clMax - 0.6 * (cl - clMax);         /* queda pós-estol (modelo simples) */
    var cdi = cl * cl / (Math.PI * e * AR);
    var cd = p.cd0 + cdi;
    var q = 0.5 * p.rho * p.U * p.U;
    var S = p.c * p.b;
    return { cl: cl, cd: cd, cdi: cdi, ld: cl / cd, L: cl * q * S, D: cd * q * S, q: q, S: S,
             a3d: a3d, estol: estol, alfaEstol: (clMax / a3d + a0) * 180 / Math.PI,
             gama: cl * p.U * p.c / 2 };
  };

  /* ==========================================================================
     Canais abertos (seção retangular)
     ========================================================================== */
  MF2.canal = function (p) {
    var g = 9.81, q = p.Q / p.b;
    var yc = Math.pow(q * q / g, 1 / 3);
    var Ec = 1.5 * yc;
    var E = function (y) { return y + q * q / (2 * g * y * y); };
    var Fr = function (y) { return q / (y * Math.sqrt(g * Math.pow(y, 3))); };
    /* profundidade normal pela equação de Manning, por bisseção */
    var lo = 1e-4, hi = 50, yn;
    for (var i = 0; i < 200; i++) {
      yn = (lo + hi) / 2;
      var A = p.b * yn, P = p.b + 2 * yn, R = A / P;
      var Q = A * Math.pow(R, 2 / 3) * Math.sqrt(p.S) / p.n;
      if (Q < p.Q) lo = yn; else hi = yn;
    }
    var y1 = p.y, Fr1 = Fr(y1);
    var y2 = y1 / 2 * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);   /* conjugada do ressalto */
    var perda = Math.pow(y2 - y1, 3) / (4 * y1 * y2);
    var tipo = Fr1 > 1.01 ? 'supercrítico (torrencial)' : Fr1 < 0.99 ? 'subcrítico (fluvial)' : 'crítico';
    var classe = Fr1 < 1.7 ? 'ondulado' : Fr1 < 2.5 ? 'fraco' : Fr1 < 4.5 ? 'oscilante' : Fr1 < 9 ? 'estável' : 'forte';
    return { q: q, yc: yc, Ec: Ec, E: E, Fr: Fr, Fr1: Fr1, y1: y1, y2: y2, perda: perda,
             yn: yn, tipo: tipo, classe: classe, Ey: E(y1), E2: E(y2),
             v1: q / y1, v2: q / y2, declividadeCritica: Fr(yn) > 1 };
  };

  /* ==========================================================================
     Escoamento compressível com atrito (Fanno) e com calor (Rayleigh)
     ========================================================================== */
  MF2.fanno = function (M, k) {
    var M2 = M * M;
    var raiz = (k + 1) * M2 / (2 + (k - 1) * M2);
    return {
      fLD: (1 - M2) / (k * M2) + (k + 1) / (2 * k) * Math.log(raiz),   /* 4fL*/ /* D */
      TT: (k + 1) / (2 + (k - 1) * M2),
      PP: (1 / M) * Math.sqrt((k + 1) / (2 + (k - 1) * M2)),
      P0P0: (1 / M) * Math.pow((2 + (k - 1) * M2) / (k + 1), (k + 1) / (2 * (k - 1))),
      VV: M * Math.sqrt((k + 1) / (2 + (k - 1) * M2))
    };
  };
  MF2.rayleigh = function (M, k) {
    var M2 = M * M;
    return {
      TT: M2 * Math.pow((1 + k) / (1 + k * M2), 2),
      T0T0: ((k + 1) * M2 * (2 + (k - 1) * M2)) / Math.pow(1 + k * M2, 2),
      PP: (1 + k) / (1 + k * M2),
      P0P0: ((1 + k) / (1 + k * M2)) * Math.pow((2 + (k - 1) * M2) / (k + 1), k / (k - 1)),
      VV: M2 * (1 + k) / (1 + k * M2)
    };
  };
  /* inverte a relação de Fanno: dado 4fL*/ /* D, acha M (ramo subsônico ou supersônico) */
  MF2.fannoM = function (fLD, k, supersonico) {
    var lo = supersonico ? 1.0001 : 1e-4, hi = supersonico ? 30 : 0.9999;
    for (var i = 0; i < 200; i++) {
      var M = (lo + hi) / 2, v = MF2.fanno(M, k).fLD;
      if (supersonico) { if (v < fLD) lo = M; else hi = M; }   /* no ramo supersônico 4fL*/ /* D cresce com M */
      else { if (v > fLD) lo = M; else hi = M; }
    }
    return (lo + hi) / 2;
  };
  MF2.isentropico = function (M, k) {
    var t = 1 + (k - 1) / 2 * M * M;
    return { TT0: 1 / t, PP0: Math.pow(t, -k / (k - 1)), rr0: Math.pow(t, -1 / (k - 1)),
             AAc: (1 / M) * Math.pow(2 / (k + 1) * t, (k + 1) / (2 * (k - 1))) };
  };

  global.MF2 = MF2;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Simuladores de Mecânica dos Fluidos II
     1. sim-camada-limite : camada limite sobre placa plana (Blasius e turbulenta)
     2. sim-arrasto       : arrasto de corpos, curva Cd × Re e velocidade terminal
     3. sim-sustentacao   : escoamento potencial com circulação e polar de aerofólio
     4. sim-canal         : canais abertos, energia específica e ressalto hidráulico
     5. sim-fanno         : escoamento compressível com atrito (Fanno) e calor (Rayleigh)
   ========================================================================== */
(function () {
  'use strict';
  var MF2 = window.MF2;
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
  function fonte(px, peso) { return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif'); }
  function rotulo(c, txt, x, y, cor, px, peso, alinh, base) {
    c.font = fonte(px || 11, peso); c.fillStyle = cor;
    c.textAlign = alinh || 'center'; c.textBaseline = base || 'middle';
    c.fillText(txt, x, y);
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
  var nt = function (v, n) { return Plot.numTex(v, n); };
  var sg = function (v, n) { return Plot.sig(v, n); };

  /* ==========================================================================
     1. Camada limite sobre placa plana
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-camada-limite')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true, part: [] };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var x0 = a.x + 50, x1 = a.x + a.w - 150, yPl = a.y + a.h - 60;
      var esc = (x1 - x0) / p.L;                       /* px por metro na direção x */
      var dMax = r.local(p.L).delta;
      var escY = Math.min((a.h - 130) / Math.max(dMax * 2.0, 1e-6), esc * 40);
      /* placa */
      c.fillStyle = faint; c.globalAlpha = 0.5;
      c.fillRect(x0, yPl, x1 - x0, 8); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.4; c.strokeRect(x0, yPl, x1 - x0, 8);
      /* camada limite (δ, δ* e θ) */
      var curva = function (chave, corL, tracejado, rotuloTxt) {
        c.strokeStyle = corL; c.lineWidth = 2.2; c.setLineDash(tracejado || []);
        c.beginPath();
        for (var i = 0; i <= 120; i++) {
          var x = p.L * i / 120, q = r.local(x);
          var X = x0 + x * esc, Y = yPl - q[chave] * escY;
          if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
        }
        c.stroke(); c.setLineDash([]);
        void rotuloTxt;
      };
      /* região da camada limite, sombreada */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.12;
      c.beginPath(); c.moveTo(x0, yPl);
      for (var ib = 0; ib <= 120; ib++) {
        var xb = p.L * ib / 120;
        c.lineTo(x0 + xb * esc, yPl - r.local(xb).delta * escY);
      }
      c.lineTo(x1, yPl); c.closePath(); c.fill(); c.globalAlpha = 1;
      curva('delta', Plot.serie(0), null);
      curva('dStar', Plot.serie(2), [5, 4]);
      curva('theta', Plot.serie(3), [3, 3]);
      /* legenda das três espessuras, fora do desenho */
      var fimL = r.local(p.L);
      [['δ = ' + sg(fimL.delta * 1000, 3) + ' mm', Plot.serie(0)],
       ['δ* = ' + sg(fimL.dStar * 1000, 3) + ' mm', Plot.serie(2)],
       ['θ = ' + sg(fimL.theta * 1000, 3) + ' mm', Plot.serie(3)]].forEach(function (q, j) {
        c.strokeStyle = q[1]; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(x1 + 12, a.y + 26 + j * 20); c.lineTo(x1 + 32, a.y + 26 + j * 20); c.stroke();
        rotulo(c, q[0], x1 + 38, a.y + 26 + j * 20, q[1], 11, '700', 'left');
      });
      /* transição */
      if (isFinite(r.turbulentaEm) && r.turbulentaEm > 0 && r.turbulentaEm < p.L) {
        var Xt = x0 + r.turbulentaEm * esc;
        c.strokeStyle = 'rgb(220,110,40)'; c.lineWidth = 1.5; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(Xt, a.y + 30); c.lineTo(Xt, yPl); c.stroke(); c.setLineDash([]);
        rotulo(c, 'transição  Re = ' + sg(p.Recr, 3), Xt, a.y + 20, 'rgb(220,110,40)', 10.5, '700');
      }
      /* perfis de velocidade em três posições */
      [0.25, 0.55, 0.9].forEach(function (fx) {
        var x = p.L * fx, q = r.local(x), X = x0 + x * esc;
        var n = 14;
        c.strokeStyle = Plot.serie(1); c.lineWidth = 1.6;
        c.beginPath();
        for (var i = 0; i <= n; i++) {
          var yy = q.delta * i / n;
          var u = perfilU(yy / Math.max(q.delta, 1e-12), q.regime);
          var X2 = X + u * 42, Y2 = yPl - yy * escY;
          if (i) c.lineTo(X2, Y2); else c.moveTo(X2, Y2);
        }
        c.stroke();
        c.strokeStyle = Plot.serie(1); c.lineWidth = 1;
        c.beginPath(); c.moveTo(X, yPl); c.lineTo(X, yPl - q.delta * escY); c.stroke();
        seta(c, X, yPl - q.delta * escY - 4, X + 42, yPl - q.delta * escY - 4, faint, 1, 6);
      });
      /* partículas do escoamento livre */
      c.strokeStyle = Plot.serie(5); c.lineWidth = 1.6; c.lineCap = 'round';
      A.part.forEach(function (q) {
        var X = x0 + q.x * esc, Y = yPl - q.y * escY;
        var loc = r.local(Math.max(q.x, 1e-6));
        var uu = q.y >= loc.delta ? 1 : Math.pow(Math.min(1, q.y / Math.max(loc.delta, 1e-12)), loc.regime === 'turbulenta' ? 1 / 7 : 0.55);
        if (X > x0 && X < x1) { c.beginPath(); c.moveTo(X, Y); c.lineTo(Math.max(x0, X - 6 - 10 * uu), Y); c.stroke(); }
      });
      c.lineCap = 'butt';
      seta(c, a.x + 10, a.y + a.h * 0.28, a.x + 46, a.y + a.h * 0.28, cor, 2.4, 10);
      rotulo(c, 'U = ' + sg(p.U, 3) + ' m/s', a.x + 28, a.y + a.h * 0.28 - 14, cor, 11, '700');
      rotulo(c, 'placa plana · L = ' + sg(p.L, 3) + ' m', (x0 + x1) / 2, yPl + 24, faint, 11, '600');
      rotulo(c, 'δ  espessura (u = 0,99U)   ·   δ* deslocamento   ·   θ quantidade de movimento',
        (x0 + x1) / 2, a.y + a.h - 10, faint, 10, '400');
    }
    /* perfil adimensional: Blasius (interpolado) ou lei de 1/7 */
    var Bcache = null;
    function perfilU(fy, regime) {
      if (fy >= 1) return 1;
      if (regime === 'turbulenta') return Math.pow(Math.max(fy, 0), 1 / 7);
      if (!Bcache) Bcache = MF2.blasius();
      var eta = fy * Bcache.eta99, per = Bcache.perfil;
      var i = Math.min(per.length - 2, Math.max(0, Math.floor(eta / 0.005)));
      var a = per[i], b = per[i + 1];
      return a[2] + (b[2] - a[2]) * (eta - a[0]) / (b[0] - a[0]);
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('placa');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.r) return;
      A.t += dt;
      var p = A.p, r = A.r;
      if (A.part.length < 55) A.part.push({ x: 0, y: Math.random() * r.local(p.L).delta * 1.9 });
      A.part.forEach(function (q) {
        var loc = r.local(Math.max(q.x, 1e-6));
        var u = q.y >= loc.delta ? 1 : perfilU(q.y / Math.max(loc.delta, 1e-12), loc.regime);
        q.x += u * p.U * dt * 0.25;
        if (q.x > p.L) { q.x = 0; q.y = Math.random() * r.local(p.L).delta * 1.9; }
      });
      desenha();
    });

    Sim.build('#sim-camada-limite', {
      titulo: 'Camada limite sobre placa plana',
      descricao: 'Junto à parede a velocidade cai a zero: é aí que vive o atrito. A solução de Blasius, resolvida aqui numericamente pelo método do tiro, dá o perfil laminar exato; depois da transição o perfil fica bem mais cheio e o atrito cresce. As três espessuras — δ, δ* e θ — medem coisas diferentes e aparecem em lugares diferentes do projeto.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Placa no ar', desc: 'U = 5 m/s, 2 m: a transição ocorre no fim', valores: { fluido: 'ar', U: 5, L: 2, b: 1, Recr: 500000, regime: 'auto' } },
        { nome: '2 · Toda laminar', desc: 'placa curta: Re abaixo do crítico', valores: { fluido: 'ar', U: 5, L: 0.5, b: 1, Recr: 500000, regime: 'auto' } },
        { nome: '3 · Toda turbulenta', desc: 'placa rugosa, transição forçada na borda', valores: { fluido: 'ar', U: 5, L: 2, b: 1, Recr: 500000, regime: 'turbulenta' } },
        { nome: '4 · Água', desc: 'ν bem menor: camada limite fina', valores: { fluido: 'agua', U: 2, L: 1.5, b: 1, Recr: 500000, regime: 'auto' } },
        { nome: '5 · Óleo', desc: 'ν alta: camada limite espessa e laminar', valores: { fluido: 'oleo', U: 3, L: 2, b: 1, Recr: 500000, regime: 'auto' } },
        { nome: '6 · Asa em cruzeiro', desc: 'U = 60 m/s: quase tudo turbulento', valores: { fluido: 'ar', U: 60, L: 2, b: 1, Recr: 500000, regime: 'auto' } }
      ],
      controles: [
        { id: 'fluido', tipo: 'select', label: 'Fluido', valor: 'ar',
          opcoes: Object.keys(MF2.FLUIDOS).map(function (k) { return { v: k, t: MF2.FLUIDOS[k].nome }; }) },
        { id: 'U', label: 'Velocidade da corrente livre', min: 0.1, max: 100, step: 0.1, valor: 5, unidade: 'm/s' },
        { id: 'L', label: 'Comprimento da placa', min: 0.05, max: 10, step: 0.05, valor: 2, unidade: 'm' },
        { id: 'b', label: 'Largura da placa', min: 0.1, max: 10, step: 0.1, valor: 1, unidade: 'm' },
        { tipo: 'separador' },
        { id: 'regime', tipo: 'seg', label: 'Regime', valor: 'auto',
          opcoes: [{ v: 'auto', t: 'Transição em Re_cr' }, { v: 'laminar', t: 'Só laminar' }, { v: 'turbulenta', t: 'Só turbulenta' }] },
        { id: 'Recr', label: 'Reynolds crítico de transição', min: 100000, max: 3000000, step: 50000, valor: 500000, unidade: '' }
      ],
      graficos: [
        { id: 'placa', axes: false, height: 340, grid: false, legend: false },
        { id: 'perfil', titulo: 'Perfis de velocidade', xlabel: 'u/U', ylabel: 'y/δ', aspect: 0.5, legendPos: 'topleft' },
        { id: 'cf', titulo: 'Espessura e atrito ao longo da placa', xlabel: 'x (m)', ylabel: 'δ (mm)  ·  c_f × 1000', aspect: 0.45, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'Re', label: 'Reynolds no fim da placa' },
        { id: 'regime', label: 'Regime no fim' },
        { id: 'xcr', label: 'Posição da transição' },
        { id: 'delta', label: 'δ no fim' },
        { id: 'dStar', label: 'δ* no fim' },
        { id: 'theta', label: 'θ no fim' },
        { id: 'cf', label: 'c_f no fim' },
        { id: 'CD', label: 'C_D médio' },
        { id: 'D', label: 'Arrasto (um lado)' }
      ],
      formulas: [
        { g: 'Equação de Blasius (laminar)' },
        { tex: "f''' + \\tfrac{1}{2}f f'' = 0, \\qquad f(0) = f'(0) = 0,\\ f'(\\infty) = 1", d: 'solução de semelhança com η = y√(U/νx); aqui resolvida por Runge-Kutta com tiro', destaque: true },
        { tex: "f''(0) = 0{,}332 \\qquad \\eta_{99} = 4{,}91", d: 'valores que geram todas as fórmulas abaixo' },
        { tex: '\\frac{\\delta}{x} = \\frac{4{,}91}{\\sqrt{Re_x}} \\qquad \\frac{\\delta^*}{x} = \\frac{1{,}72}{\\sqrt{Re_x}} \\qquad \\frac{\\theta}{x} = \\frac{0{,}664}{\\sqrt{Re_x}}', d: 'as três espessuras crescem com √x', destaque: true },
        { tex: 'c_f = \\frac{0{,}664}{\\sqrt{Re_x}} \\qquad C_D = \\frac{1{,}328}{\\sqrt{Re_L}}', d: 'atrito local e arrasto médio laminares' },
        { g: 'Camada limite turbulenta (lei de 1/7)' },
        { tex: '\\frac{u}{U} = \\left(\\frac{y}{\\delta}\\right)^{1/7} \\qquad \\frac{\\delta}{x} = \\frac{0{,}16}{Re_x^{1/7}} \\qquad c_f = \\frac{0{,}0592}{Re_x^{1/5}}', destaque: true },
        { tex: 'C_D = \\frac{0{,}074}{Re_L^{1/5}} - \\frac{1742}{Re_L}', d: 'placa com transição em Re = 5×10⁵' },
        { g: 'O que cada espessura significa' },
        { tex: '\\delta^* = \\int_0^\\infty\\left(1 - \\frac{u}{U}\\right)dy', d: 'deslocamento: o quanto as linhas de corrente externas são empurradas' },
        { tex: '\\theta = \\int_0^\\infty\\frac{u}{U}\\left(1 - \\frac{u}{U}\\right)dy \\qquad \\tau_w = \\rho U^2\\frac{d\\theta}{dx}', d: 'quantidade de movimento: ligada diretamente ao atrito (von Kármán)' }
      ],
      passos: [],
      nota: 'Placa lisa, sem gradiente de pressão e com escoamento incompressível. Na opção com transição, as correlações turbulentas são aplicadas como se a camada fosse turbulenta desde a borda de ataque — a hipótese usual dos livros. As espessuras turbulentas usam o perfil de 1/7.',
      calcular: function (p, ctx) {
        var fl = MF2.FLUIDOS[p.fluido];
        var r = MF2.placa({ fluido: fl, U: p.U, L: p.L, b: p.b, Recr: p.Recr, regime: p.regime });
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        if (!A.part.length) for (var i = 0; i < 40; i++) A.part.push({ x: Math.random() * p.L, y: Math.random() * r.local(p.L).delta * 1.9 });
        desenha();

        var B = r.B;
        var gp = ctx.plot('perfil').clear();
        var etas = [], us = [];
        for (i = 0; i < B.perfil.length; i += 20) { etas.push(B.perfil[i][2]); us.push(B.perfil[i][0] / B.eta99); }
        gp.line(etas, us, { color: Plot.serie(0), width: 2.6, label: 'Blasius (laminar, exato)' });
        var ys = Plot.linspace(0, 1, 60);
        gp.line(ys.map(function (y) { return Math.pow(y, 1 / 7); }), ys, { color: Plot.serie(3), width: 2.4, label: 'turbulento (lei de 1/7)' });
        gp.line(ys, ys, { color: Plot.serie(5), width: 1.4, dash: [4, 4], label: 'linear (aproximação grosseira)' });
        gp.setLimits([0, 1.05], [0, 1.05]).draw();

        var gc = ctx.plot('cf').clear();
        var xs = Plot.linspace(p.L / 200, p.L, 160);
        gc.line(xs, xs.map(function (x) { return r.local(x).delta * 1000; }), { color: Plot.serie(0), width: 2.6, label: 'δ (mm)' });
        gc.line(xs, xs.map(function (x) { return r.local(x).cf * 1000; }), { color: Plot.serie(3), width: 2.4, label: 'c_f × 1000' });
        if (isFinite(r.turbulentaEm) && r.turbulentaEm > 0 && r.turbulentaEm < p.L) {
          gc.vline(r.turbulentaEm, { color: 'rgb(220,110,40)', text: 'transição' });
        }
        gc.setLimits([0, p.L], [0, Math.max(r.local(p.L).delta * 1000, 8) * 1.25]).draw();

        var fim = r.fim;
        ctx.setPassos([
          { t: '① Reynolds e regime',
            tex: 'Re_x = \\frac{U x}{\\nu}',
            texSub: '\\nu = \\frac{\\mu}{\\rho} = ' + nt(r.nu, 4) + '\\ m^2/s \\Rightarrow Re_L = \\frac{' + nt(p.U, 3) + '\\cdot' + nt(p.L, 3) + '}{' + nt(r.nu, 4) + '} = ' + nt(r.ReL, 4),
            r: 'No fim da placa: ' + fim.regime,
            obs: p.regime === 'auto' && r.xcr < p.L && r.xcr > 0
              ? 'A transição acontece em x = ' + sg(r.xcr, 3) + ' m, onde Re atinge ' + sg(p.Recr, 3) + '.'
              : 'Toda a placa está no regime ' + fim.regime + '.' },
          { t: '② Espessura da camada limite',
            tex: fim.regime === 'laminar' ? '\\delta = \\frac{4{,}91\\,x}{\\sqrt{Re_x}}' : '\\delta = \\frac{0{,}16\\,x}{Re_x^{1/7}}',
            texSub: '\\delta(L) = ' + nt(fim.delta * 1000, 4) + '\\ mm \\qquad \\delta^* = ' + nt(fim.dStar * 1000, 4) + '\\ mm \\qquad \\theta = ' + nt(fim.theta * 1000, 4) + '\\ mm',
            obs: 'δ* é o deslocamento que as linhas de corrente externas sofrem — é ele que se soma ao perfil de uma asa ou de um bocal quando se corrige a geometria. θ está ligado ao arrasto: τ_w = ρU²dθ/dx.' },
          { t: '③ Atrito local',
            tex: fim.regime === 'laminar' ? 'c_f = \\frac{0{,}664}{\\sqrt{Re_x}}' : 'c_f = \\frac{0{,}0592}{Re_x^{0{,}2}}',
            texSub: 'c_f(L) = ' + nt(fim.cf, 4) + ' \\Rightarrow \\tau_w = c_f\\tfrac12\\rho U^2 = ' + nt(fim.cf * 0.5 * fl.rho * p.U * p.U, 4) + '\\ Pa',
            obs: 'O atrito cai ao longo da placa (a camada engrossa), mas dá um salto na transição: o perfil turbulento é mais cheio e o gradiente na parede, maior.' },
          { t: '④ Arrasto total de um lado da placa',
            tex: 'C_D = \\frac{0{,}074}{Re_L^{0{,}2}} - \\frac{1742}{Re_L} \\qquad D = C_D\\,\\tfrac12\\rho U^2 A',
            texSub: 'C_D = ' + nt(r.CD, 4) + ' \\Rightarrow D = ' + nt(r.CD, 4) + '\\cdot\\tfrac12\\cdot' + nt(fl.rho, 4) + '\\cdot' + nt(p.U, 3) + '^2\\cdot' + nt(r.A, 4) + ' = ' + nt(r.D, 4) + '\\ N',
            obs: 'Para as duas faces, o dobro. Num navio ou num avião esse arrasto de atrito é a maior parcela do arrasto total — daí o esforço em manter a superfície lisa e a camada limite laminar o máximo possível.' }
        ]);
        return {
          Re: { v: r.ReL, u: '' },
          regime: { v: fim.regime, u: '', classe: fim.regime === 'laminar' ? 'ok' : '' },
          xcr: { v: isFinite(r.xcr) && p.regime === 'auto' ? (r.xcr < p.L ? sg(r.xcr, 3) + ' m' : 'além da placa') : '—', u: '' },
          delta: { v: fim.delta * 1000, u: 'mm', classe: 'destaque' },
          dStar: { v: fim.dStar * 1000, u: 'mm' },
          theta: { v: fim.theta * 1000, u: 'mm' },
          cf: { v: fim.cf, u: '' },
          CD: { v: r.CD, u: '' },
          D: { v: r.D, u: 'N', classe: 'destaque' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Arrasto de corpos e velocidade terminal
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-arrasto')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true, part: [] };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var cx = a.x + a.w * 0.34, cy = a.y + a.h * 0.5;
      var R = Math.min(a.w * 0.08, a.h * 0.2);
      /* partículas: linhas de corrente que desviam do corpo e uma esteira */
      c.fillStyle = Plot.serie(5);
      A.part.forEach(function (q) {
        var x = a.x + q.x * a.w * 0.62, y = cy + q.y * R * 3.2;
        c.globalAlpha = q.est ? 0.45 : 0.9;
        c.beginPath(); c.arc(x, y, q.est ? 2.6 : 1.8, 0, TAU); c.fill();
      });
      c.globalAlpha = 1;
      /* corpo */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.5;
      if (p.corpo === 'esfera' || p.corpo === 'cilindro') {
        c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = cor; c.lineWidth = 1.8; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      } else if (p.corpo === 'gota') {
        c.beginPath(); c.moveTo(cx - R, cy); c.quadraticCurveTo(cx - R * 0.2, cy - R * 0.8, cx + R * 2.2, cy);
        c.quadraticCurveTo(cx - R * 0.2, cy + R * 0.8, cx - R, cy); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = cor; c.lineWidth = 1.6; c.stroke();
      } else {
        c.fillRect(cx - R * 0.3, cy - R, R * 0.6, 2 * R); c.globalAlpha = 1;
        c.strokeStyle = cor; c.lineWidth = 1.8; c.strokeRect(cx - R * 0.3, cy - R, R * 0.6, 2 * R);
      }
      /* ponto de separação e esteira */
      if (r.separa) {
        var thSep = r.Re > 2e5 ? 120 : 82;
        [1, -1].forEach(function (s) {
          var th = s * thSep * Math.PI / 180;
          c.fillStyle = 'rgb(220,60,60)';
          c.beginPath(); c.arc(cx + R * Math.cos(th), cy - R * Math.sin(th), 3.5, 0, TAU); c.fill();
        });
        rotulo(c, 'separação em ' + sg(thSep, 3) + '°', cx, cy - R - 14, 'rgb(220,60,60)', 10.5, '700');
        c.strokeStyle = 'rgb(220,60,60)'; c.lineWidth = 1.2; c.setLineDash([4, 3]);
        c.beginPath();
        c.moveTo(cx + R * Math.cos(thSep * Math.PI / 180), cy - R * Math.sin(thSep * Math.PI / 180));
        c.quadraticCurveTo(cx + R * 2.2, cy - R * 1.2, cx + R * (3.2 + 0.8 * (r.Re > 2e5 ? -1 : 1)), cy);
        c.stroke();
        c.beginPath();
        c.moveTo(cx + R * Math.cos(-thSep * Math.PI / 180), cy - R * Math.sin(-thSep * Math.PI / 180));
        c.quadraticCurveTo(cx + R * 2.2, cy + R * 1.2, cx + R * (3.2 + 0.8 * (r.Re > 2e5 ? -1 : 1)), cy);
        c.stroke(); c.setLineDash([]);
        rotulo(c, 'esteira', cx + R * 2.6, cy + R * 1.5, faint, 10.5, '600');
      }
      /* força de arrasto */
      seta(c, cx, cy, cx + Math.min(R * 3, 90), cy, 'rgb(220,60,60)', 3, 12);
      rotulo(c, 'D = ' + sg(r.D, 4) + ' N', cx + Math.min(R * 3, 90) + 10, cy - 12, 'rgb(220,60,60)', 11.5, '700', 'left');
      seta(c, a.x + 8, cy - R * 2.4, a.x + 44, cy - R * 2.4, cor, 2.2, 10);
      rotulo(c, 'U = ' + sg(p.U, 3) + ' m/s', a.x + 26, cy - R * 2.4 - 14, cor, 11, '700');
      /* painel */
      var lx = a.x + a.w * 0.64, ly = a.y + 24;
      var linhas = [
        ['Reynolds', sg(r.Re, 4)],
        ['coeficiente de arrasto C_D', sg(r.cd, 3)],
        ['área de referência', sg(r.A, 4) + ' m²'],
        ['força de arrasto', sg(r.D, 4) + ' N'],
        ['potência para vencer', sg(r.P, 4) + ' W'],
        ['desprendimento de vórtices', r.fVortex ? sg(r.fVortex, 3) + ' Hz (St = ' + sg(r.St, 3) + ')' : '—']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, cor, 12, '700', 'left');
      });
      if (r.Re > 2e5 && r.Re < 1e6 && (p.corpo === 'esfera' || p.corpo === 'cilindro')) {
        rotulo(c, 'crise do arrasto: a camada limite virou', lx, ly + 6 * 34 + 2, 'rgb(220,110,40)', 11, '700', 'left');
        rotulo(c, 'turbulenta e a separação foi adiada', lx, ly + 6 * 34 + 17, 'rgb(220,110,40)', 11, '700', 'left');
      }
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('corpo');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.r) return;
      A.t += dt;
      if (A.part.length < 90) A.part.push({ x: 0, y: (Math.random() - 0.5) * 2, est: false });
      A.part.forEach(function (q) {
        var desvio = Math.exp(-Math.pow((q.x - 0.55) * 6, 2)) * 0.5 * Math.sign(q.y || 1);
        q.x += dt * (0.35 + 0.1 * Math.abs(q.y));
        q.y += dt * desvio * (q.x < 0.55 ? 1 : -0.4) * (A.r.separa ? 1 : 0.4);
        q.est = q.x > 0.58 && Math.abs(q.y) < 0.55;
        if (q.est) q.y += Math.sin(A.t * 6 + q.x * 10) * dt * (A.r.St ? 1.2 : 0.2);
        if (q.x > 1) { q.x = 0; q.y = (Math.random() - 0.5) * 2; }
      });
      desenha();
    });

    Sim.build('#sim-arrasto', {
      titulo: 'Arrasto de corpos e velocidade terminal',
      descricao: 'Em corpos rombudos quase todo o arrasto vem da pressão: a camada limite se separa, forma-se uma esteira e a pressão atrás nunca se recupera. O coeficiente de arrasto varia com o Reynolds e chega a cair bruscamente por volta de Re = 3×10⁵ — a crise do arrasto, que é o motivo de as bolas de golfe terem covinhas.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Esfera no ar', desc: 'bola de 70 mm a 20 m/s', valores: { corpo: 'esfera', fluido: 'ar', U: 20, D: 0.07, b: 1, rhoS: 1000 } },
        { nome: '2 · Crise do arrasto', desc: 'a mesma esfera a 90 m/s: C_D despenca', valores: { corpo: 'esfera', fluido: 'ar', U: 90, D: 0.07, b: 1, rhoS: 1000 } },
        { nome: '3 · Escoamento de Stokes', desc: 'gota de 0,1 mm: Re ≪ 1', valores: { corpo: 'esfera', fluido: 'ar', U: 0.3, D: 0.0001, b: 1, rhoS: 1000 } },
        { nome: '4 · Cilindro e vórtices', desc: 'cabo de 20 mm ao vento: von Kármán', valores: { corpo: 'cilindro', fluido: 'ar', U: 12, D: 0.02, b: 10, rhoS: 7800 } },
        { nome: '5 · Automóvel', desc: 'C_D = 0,30 e área frontal de 2,2 m²', valores: { corpo: 'carro', fluido: 'ar', U: 30, D: 1.67, b: 1, rhoS: 1000 } },
        { nome: '6 · Esfera de aço na glicerina', desc: 'velocidade terminal no regime de Stokes', valores: { corpo: 'esfera', fluido: 'glic', U: 0.02, D: 0.003, b: 1, rhoS: 7800 } }
      ],
      controles: [
        { id: 'corpo', tipo: 'select', label: 'Corpo', valor: 'esfera',
          opcoes: [{ v: 'esfera', t: 'Esfera' }, { v: 'cilindro', t: 'Cilindro (escoamento cruzado)' }].concat(
            Object.keys(MF2.CD_FIXOS).map(function (k) { return { v: k, t: MF2.CD_FIXOS[k].nome }; })) },
        { id: 'fluido', tipo: 'select', label: 'Fluido', valor: 'ar',
          opcoes: Object.keys(MF2.FLUIDOS).map(function (k) { return { v: k, t: MF2.FLUIDOS[k].nome }; }) },
        { id: 'U', label: 'Velocidade relativa', min: 0.01, max: 120, step: 0.01, valor: 20, unidade: 'm/s' },
        { id: 'D', label: 'Dimensão característica', min: 0.0001, max: 5, step: 0.0001, valor: 0.07, unidade: 'm', desc: 'diâmetro, ou largura equivalente' },
        { id: 'b', label: 'Comprimento (cilindro)', min: 0.1, max: 50, step: 0.1, valor: 1, unidade: 'm' },
        { tipo: 'titulo', label: 'Velocidade terminal (esfera em queda)' },
        { id: 'rhoS', label: 'Massa específica do sólido', min: 20, max: 20000, step: 10, valor: 1000, unidade: 'kg/m³' }
      ],
      graficos: [
        { id: 'corpo', axes: false, height: 330, grid: false, legend: false },
        { id: 'cdre', titulo: 'Curva C_D × Reynolds', xlabel: 'Reynolds', ylabel: 'C_D', aspect: 0.5, xlog: true, ylog: true, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Re', label: 'Reynolds' },
        { id: 'cd', label: 'Coeficiente de arrasto' },
        { id: 'A', label: 'Área de referência' },
        { id: 'D', label: 'Força de arrasto' },
        { id: 'P', label: 'Potência para vencer' },
        { id: 'fv', label: 'Frequência de vórtices' },
        { id: 'Ut', label: 'Velocidade terminal' },
        { id: 'regime', label: 'Regime' }
      ],
      formulas: [
        { g: 'Arrasto' },
        { tex: 'D = C_D\\,\\tfrac12\\rho U^2 A', d: 'A é a área frontal projetada (ou a área planiforme, em asas)', destaque: true },
        { tex: 'C_D = f(Re,\\ \\text{forma},\\ \\text{rugosidade})', d: 'no arrasto de corpos rombudos, a parcela de pressão domina' },
        { tex: 'C_D = \\frac{24}{Re}\\ \\ (Re \\ll 1) \\quad\\Rightarrow\\quad D = 3\\pi\\mu U d', d: 'escoamento de Stokes, sem separação', destaque: true },
        { g: 'Velocidade terminal' },
        { tex: '(\\rho_s - \\rho)g\\frac{\\pi d^3}{6} = C_D\\,\\tfrac12\\rho U_t^2\\frac{\\pi d^2}{4}', d: 'peso aparente igual ao arrasto', destaque: true },
        { tex: 'U_t = \\frac{(\\rho_s - \\rho)g d^2}{18\\mu}', d: 'forma fechada, válida só no regime de Stokes (Re < 1)' },
        { g: 'Esteira' },
        { tex: 'St = \\frac{f d}{U} \\approx 0{,}21\\ \\ (250 < Re < 2\\times10^5)', d: 'esteira de von Kármán: vórtices alternados que fazem o cabo "cantar"', destaque: true }
      ],
      passos: [],
      nota: 'C_D da esfera pela correlação de Clift-Gauvin, com a crise do arrasto acrescentada empiricamente; cilindro por correlação ajustada à curva clássica; demais corpos com C_D tabelado, praticamente constante na faixa usual de Reynolds. A velocidade terminal resolve o balanço com C_D(Re) por bisseção.',
      calcular: function (p, ctx) {
        var fl = MF2.FLUIDOS[p.fluido];
        var Aref = null;
        if (p.corpo === 'carro') Aref = 2.2;
        if (p.corpo === 'onibus') Aref = 7.5;
        if (p.corpo === 'parab') Aref = Math.PI * p.D * p.D / 4;
        var r = MF2.arrasto({ fluido: fl, U: p.U, D: p.D, b: p.b, corpo: p.corpo, Aref: Aref });
        var t = MF2.terminal({ fluido: fl, D: p.D, rhoS: p.rhoS });
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('cdre').clear();
        var Res = [];
        for (var e = -1; e <= 7; e += 0.05) Res.push(Math.pow(10, e));
        g.line(Res.map(function (x) { return Math.log10(x); }), Res.map(function (x) { return Math.log10(MF2.cdEsfera(x)); }),
          { color: Plot.serie(0), width: 2.4, label: 'esfera' });
        g.line(Res.map(function (x) { return Math.log10(x); }), Res.map(function (x) { return Math.log10(MF2.cdCilindro(x)); }),
          { color: Plot.serie(2), width: 2.4, label: 'cilindro' });
        g.line(Res.map(function (x) { return Math.log10(x); }), Res.map(function (x) { return Math.log10(24 / x); }),
          { color: Plot.serie(5), width: 1.6, dash: [4, 4], label: 'Stokes: 24/Re' });
        g.marker(Math.log10(r.Re), Math.log10(r.cd), 'operação', { color: 'rgb(220,60,60)', r: 5 });
        g.setLimits([-1, 7], [Math.log10(0.05), Math.log10(300)]).draw();

        var regime = r.Re < 1 ? 'Stokes (sem separação)' : r.Re < 1000 ? 'intermediário'
          : r.Re < 2e5 ? 'subcrítico (esteira larga)' : r.Re < 1e6 ? 'crise do arrasto' : 'supercrítico';
        ctx.setPassos([
          { t: '① Número de Reynolds',
            tex: 'Re = \\frac{\\rho U D}{\\mu}',
            texSub: 'Re = \\frac{' + nt(fl.rho, 4) + '\\cdot' + nt(p.U, 3) + '\\cdot' + nt(p.D, 3) + '}{' + nt(fl.mu, 3) + '} = ' + nt(r.Re, 4),
            r: 'Regime: ' + regime,
            obs: 'É o Reynolds que diz se o arrasto é viscoso (Re ≪ 1, sem separação) ou dominado pela pressão da esteira (Re grande).' },
          { t: '② Coeficiente de arrasto',
            texSub: 'C_D = ' + nt(r.cd, 4) + (p.corpo === 'esfera' || p.corpo === 'cilindro' ? '\\ \\text{(da curva } C_D \\times Re)' : '\\ \\text{(tabelado)}'),
            obs: r.Re > 2e5 && r.Re < 1e6 && (p.corpo === 'esfera' || p.corpo === 'cilindro')
              ? 'Aqui está a crise do arrasto: a camada limite passa a turbulenta antes da separação, gruda mais tempo na superfície, a esteira encolhe e o C_D cai de ~0,5 para ~0,1. As covinhas da bola de golfe antecipam esse efeito.'
              : 'Entre Re ≈ 10³ e 2×10⁵ o C_D da esfera é quase constante, em torno de 0,45: é a faixa em que o arrasto é praticamente todo de pressão.' },
          { t: '③ Força e potência',
            tex: 'D = C_D\\,\\tfrac12\\rho U^2 A \\qquad P = D\\,U',
            texSub: 'D = ' + nt(r.cd, 3) + '\\cdot\\tfrac12\\cdot' + nt(fl.rho, 4) + '\\cdot' + nt(p.U, 3) + '^2\\cdot' + nt(r.A, 4) + ' = ' + nt(r.D, 4) + '\\ N \\Rightarrow P = ' + nt(r.P, 4) + '\\ W',
            obs: 'A potência cresce com o cubo da velocidade: dobrar a velocidade de um veículo exige oito vezes mais potência só para vencer o arrasto.' },
          { t: '④ Velocidade terminal de uma esfera desse diâmetro',
            tex: 'U_t: \\ (\\rho_s - \\rho)g\\frac{\\pi d^3}{6} = C_D(Re)\\,\\tfrac12\\rho U_t^2\\frac{\\pi d^2}{4}',
            texSub: 'U_t = ' + nt(t.U, 4) + '\\ m/s \\quad (Re = ' + nt(t.Re, 3) + ',\\ C_D = ' + nt(t.cd, 3) + ')',
            obs: t.stokesVale
              ? 'Como Re < 1, vale a forma fechada de Stokes: U = (ρs − ρ)gd²/18μ = ' + sg(t.Ustokes, 4) + ' m/s — é assim que se mede viscosidade no viscosímetro de queda de esfera.'
              : 'Fora do regime de Stokes (Re = ' + sg(t.Re, 3) + '), a fórmula fechada daria ' + sg(t.Ustokes, 4) + ' m/s, muito acima do real: é preciso resolver com C_D(Re).' }
        ]);
        return {
          Re: { v: r.Re, u: '' },
          cd: { v: r.cd, u: '', classe: 'destaque' },
          A: { v: r.A, u: 'm²' },
          D: { v: r.D, u: 'N', classe: 'destaque' },
          P: { v: r.P, u: 'W' },
          fv: { v: r.fVortex ? sg(r.fVortex, 4) + ' Hz' : '—', u: '' },
          Ut: { v: t.U, u: 'm/s' },
          regime: { v: regime, u: '', classe: r.Re > 2e5 && r.Re < 1e6 ? 'alerta' : '' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Escoamento potencial com circulação e polar de aerofólio
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-sustentacao')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true, part: [] };

    function desenharCilindro(c, a, p, r) {
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var cx = a.x + a.w * 0.32, cy = a.y + a.h * 0.5;
      var R = Math.min(a.w * 0.095, a.h * 0.2);
      var esc = R / p.a;
      /* linhas de corrente pela função ψ */
      var cil = r.cil;
      c.lineWidth = 1.2;
      for (var k = -6; k <= 6; k++) {
        var psi = k * p.U * p.a * 0.55;
        c.strokeStyle = Plot.serie(5); c.globalAlpha = 0.55;
        c.beginPath();
        var primeiro = true;
        for (var i = 0; i <= 160; i++) {
          var X = -2.6 * p.a + 5.2 * p.a * i / 160;
          /* resolve ψ(x, y) = psi em y por bisseção, separadamente acima e abaixo */
          var yv = resolveY(cil, X, psi, p.a);
          if (yv === null) { primeiro = true; continue; }
          var px = cx + X * esc, py = cy - yv * esc;
          if (primeiro) { c.moveTo(px, py); primeiro = false; } else c.lineTo(px, py);
        }
        c.stroke(); c.globalAlpha = 1;
      }
      /* cilindro */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.45;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.8; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      /* rotação (efeito Magnus) */
      if (Math.abs(p.gama) > 1e-9) {
        var sinal = p.gama > 0 ? -1 : 1;
        c.strokeStyle = Plot.serie(3); c.lineWidth = 2;
        c.beginPath(); c.arc(cx, cy, R * 0.55, A.t * 2 * sinal, A.t * 2 * sinal + 4, false); c.stroke();
        rotulo(c, 'Γ = ' + sg(p.gama, 3) + ' m²/s', cx, cy + R + 16, Plot.serie(3), 11, '700');
      }
      /* pontos de estagnação */
      cil.estag.forEach(function (e) {
        c.fillStyle = 'rgb(220,60,60)';
        c.beginPath(); c.arc(cx + e.r * esc * Math.cos(e.th), cy - e.r * esc * Math.sin(e.th), 4, 0, TAU); c.fill();
      });
      /* sustentação */
      if (Math.abs(r.cil.L) > 1e-9) {
        var dir = r.cil.L > 0 ? -1 : 1;
        seta(c, cx, cy, cx, cy + dir * Math.min(R * 2.4, 80), 'rgb(60,170,110)', 3, 12);
        rotulo(c, "L' = " + sg(Math.abs(r.cil.L), 4) + ' N/m', cx + 12, cy + dir * Math.min(R * 2.4, 80) - dir * 12, 'rgb(60,170,110)', 11.5, '700', 'left');
      }
      seta(c, a.x + 8, cy, a.x + 44, cy, cor, 2.2, 10);
      rotulo(c, 'U = ' + sg(p.U, 3) + ' m/s', a.x + 26, cy - 14, cor, 11, '700');
      /* painel */
      var lx = a.x + a.w * 0.68, ly = a.y + 26;
      var linhas = [
        ['circulação Γ', sg(p.gama, 4) + ' m²/s'],
        ["sustentação L' = ρUΓ", sg(r.cil.L, 4) + ' N/m'],
        ['Γ/(4πUa)', sg(r.cil.razao, 3)],
        ['pontos de estagnação', r.cil.estag.length === 2 ? 'dois, sobre o cilindro' : 'um, fora do cilindro'],
        ['velocidade máxima na superfície', sg(Math.abs(-2 * p.U + p.gama / (TAU * p.a)), 4) + ' m/s']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 36, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 14 + j * 36, cor, 12, '700', 'left');
      });
      rotulo(c, 'sem circulação não há sustentação:', lx, ly + 5 * 36 + 6, faint, 10.5, '400', 'left');
      rotulo(c, 'é o paradoxo de d\u2019Alembert', lx, ly + 5 * 36 + 21, faint, 10.5, '400', 'left');
    }
    /* ψ(x,y) = psi resolvido em y (ramo superior ou inferior conforme o sinal de psi) */
    function resolveY(cil, X, psi, a) {
      var f = function (y) {
        var rr = Math.hypot(X, y);
        if (rr < a) return NaN;
        return cil.psi(rr, Math.atan2(y, X)) - psi;
      };
      var lo = psi >= 0 ? 0.0005 : -6 * a, hi = psi >= 0 ? 6 * a : -0.0005;
      var flo = f(lo), fhi = f(hi);
      if (isNaN(flo) || isNaN(fhi) || flo * fhi > 0) return null;
      for (var i = 0; i < 40; i++) {
        var m = (lo + hi) / 2, fm = f(m);
        if (isNaN(fm)) return null;
        if (flo * fm <= 0) { hi = m; fhi = fm; } else { lo = m; flo = fm; }
      }
      return (lo + hi) / 2;
    }

    function desenharAsa(c, a, p, r) {
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var cx = a.x + a.w * 0.32, cy = a.y + a.h * 0.5;
      var L = Math.min(a.w * 0.3, a.h * 0.7);
      var al = p.alfa * Math.PI / 180;
      /* perfil simples (arco + espessura) girado de α */
      c.save();
      c.translate(cx, cy); c.rotate(-(-al));
      c.beginPath();
      for (var i = 0; i <= 40; i++) {
        var xx = i / 40, yt = 0.12 * (0.2969 * Math.sqrt(xx) - 0.126 * xx - 0.3516 * xx * xx + 0.2843 * Math.pow(xx, 3) - 0.1015 * Math.pow(xx, 4));
        var yc = 0.04 * (xx < 0.4 ? (2 * 0.4 * xx - xx * xx) / 0.16 : ((1 - 2 * 0.4) + 2 * 0.4 * xx - xx * xx) / Math.pow(1 - 0.4, 2));
        var px = (xx - 0.25) * L, py = -(yc + yt) * L;
        if (i) c.lineTo(px, py); else c.moveTo(px, py);
      }
      for (i = 40; i >= 0; i--) {
        var x2 = i / 40, yt2 = 0.12 * (0.2969 * Math.sqrt(x2) - 0.126 * x2 - 0.3516 * x2 * x2 + 0.2843 * Math.pow(x2, 3) - 0.1015 * Math.pow(x2, 4));
        var yc2 = 0.04 * (x2 < 0.4 ? (2 * 0.4 * x2 - x2 * x2) / 0.16 : ((1 - 2 * 0.4) + 2 * 0.4 * x2 - x2 * x2) / Math.pow(1 - 0.4, 2));
        c.lineTo((x2 - 0.25) * L, -(yc2 - yt2) * L);
      }
      c.closePath();
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.6; c.stroke();
      c.restore();
      /* corrente livre e esteira */
      c.strokeStyle = Plot.serie(5); c.lineWidth = 1.2; c.globalAlpha = 0.6;
      for (var k = -3; k <= 3; k++) {
        var y0 = cy + k * L * 0.16;
        c.beginPath();
        for (i = 0; i <= 60; i++) {
          var X = a.x + 10 + (a.w * 0.56 - 10) * i / 60;
          var dx = (X - cx) / L;
          var defl = -r.aer.cl * 0.06 * L * Math.exp(-Math.pow(dx * 1.1, 2)) * (1 + Math.sign(dx) * 0.6);
          var Y = y0 + defl * (1 - Math.min(1, Math.abs(k) / 4));
          if (i) c.lineTo(X, Y); else c.moveTo(X, Y);
        }
        c.stroke();
      }
      c.globalAlpha = 1;
      /* estol: separação */
      if (r.aer.estol) {
        c.fillStyle = 'rgba(220,60,60,0.25)';
        c.beginPath(); c.ellipse(cx + L * 0.35, cy - L * 0.18, L * 0.35, L * 0.2, -al, 0, TAU); c.fill();
        rotulo(c, 'ESTOL: escoamento descolado', cx + L * 0.2, cy - L * 0.45, 'rgb(220,60,60)', 12, '700');
      }
      /* forças */
      seta(c, cx, cy, cx, cy - Math.min(L * 0.8 * Math.max(r.aer.cl, 0.05) / 1.2, 90), 'rgb(60,170,110)', 3, 12);
      rotulo(c, 'L = ' + sg(r.aer.L / 1000, 4) + ' kN', cx + 10, cy - Math.min(L * 0.8 * Math.max(r.aer.cl, 0.05) / 1.2, 90) + 8, 'rgb(60,170,110)', 11.5, '700', 'left');
      seta(c, cx, cy, cx + Math.min(L * 0.5 * r.aer.cd * 20, 70), cy, 'rgb(220,60,60)', 2.6, 11);
      rotulo(c, 'D = ' + sg(r.aer.D / 1000, 3) + ' kN', cx + Math.min(L * 0.5 * r.aer.cd * 20, 70) + 8, cy + 14, 'rgb(220,60,60)', 11, '700', 'left');
      rotulo(c, 'α = ' + sg(p.alfa, 3) + '°', cx - L * 0.4, cy + 22, cor, 11.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.62, ly = a.y + 26;
      var linhas = [
        ['coeficiente de sustentação c_L', sg(r.aer.cl, 3)],
        ['arrasto induzido c_Di', sg(r.aer.cdi, 3)],
        ['coeficiente de arrasto total', sg(r.aer.cd, 3)],
        ['eficiência L/D', sg(r.aer.ld, 3)],
        ['inclinação da curva (3D)', sg(r.aer.a3d, 3) + ' /rad'],
        ['ângulo de estol', sg(r.aer.alfaEstol, 3) + '°']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, j === 0 && r.aer.estol ? 'rgb(220,60,60)' : cor, 12, '700', 'left');
      });
    }
    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      if (p.modo === 'cilindro') desenharCilindro(c, a, p, r); else desenharAsa(c, a, p, r);
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('campo');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-sustentacao', {
      titulo: 'Sustentação — circulação, Kutta-Joukowski e polar da asa',
      descricao: 'No escoamento potencial sem circulação um corpo não sofre arrasto nem sustentação: é o paradoxo de d\u2019Alembert. Basta acrescentar circulação para aparecer sustentação, dada por L = ρUΓ. Numa asa real, a condição de Kutta fixa essa circulação, e o alongamento finito cobra o preço do arrasto induzido.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Cilindro sem circulação', desc: 'escoamento simétrico: sustentação nula', valores: { modo: 'cilindro', U: 10, a: 0.1, gama: 0, rho: 1.204, alfa: 5, alfa0: -2, AR: 8, e: 0.9, clMax: 1.4, cd0: 0.008, c: 1.5, b: 12 } },
        { nome: '2 · Efeito Magnus', desc: 'cilindro girando: os pontos de estagnação descem', valores: { modo: 'cilindro', U: 10, a: 0.1, gama: 8, rho: 1.204, alfa: 5, alfa0: -2, AR: 8, e: 0.9, clMax: 1.4, cd0: 0.008, c: 1.5, b: 12 } },
        { nome: '3 · Circulação máxima', desc: 'Γ = 4πUa: os dois pontos se juntam', valores: { modo: 'cilindro', U: 10, a: 0.1, gama: 12.57, rho: 1.204, alfa: 5, alfa0: -2, AR: 8, e: 0.9, clMax: 1.4, cd0: 0.008, c: 1.5, b: 12 } },
        { nome: '4 · Asa em cruzeiro', desc: 'α = 3°, AR = 8', valores: { modo: 'asa', U: 60, a: 0.1, gama: 0, rho: 1.204, alfa: 3, alfa0: -2, AR: 8, e: 0.9, clMax: 1.4, cd0: 0.008, c: 1.5, b: 12 } },
        { nome: '5 · Perto do estol', desc: 'α = 14°: c_L máximo', valores: { modo: 'asa', U: 40, a: 0.1, gama: 0, rho: 1.204, alfa: 14, alfa0: -2, AR: 8, e: 0.9, clMax: 1.4, cd0: 0.008, c: 1.5, b: 12 } },
        { nome: '6 · Asa curta (AR = 4)', desc: 'mais arrasto induzido, menos inclinação', valores: { modo: 'asa', U: 60, a: 0.1, gama: 0, rho: 1.204, alfa: 6, alfa0: -2, AR: 4, e: 0.85, clMax: 1.4, cd0: 0.008, c: 1.5, b: 12 } }
      ],
      controles: [
        { id: 'modo', tipo: 'seg', label: 'Caso', valor: 'cilindro',
          opcoes: [{ v: 'cilindro', t: 'Cilindro com circulação' }, { v: 'asa', t: 'Asa finita' }] },
        { id: 'U', label: 'Velocidade da corrente', min: 1, max: 120, step: 1, valor: 10, unidade: 'm/s' },
        { id: 'rho', label: 'Massa específica do fluido', min: 0.2, max: 1100, step: 0.1, valor: 1.204, unidade: 'kg/m³' },
        { tipo: 'titulo', label: 'Cilindro' },
        { id: 'a', label: 'Raio do cilindro', min: 0.02, max: 1, step: 0.01, valor: 0.1, unidade: 'm' },
        { id: 'gama', label: 'Circulação Γ', min: -25, max: 25, step: 0.1, valor: 0, unidade: 'm²/s' },
        { tipo: 'titulo', label: 'Asa' },
        { id: 'alfa', label: 'Ângulo de ataque α', min: -8, max: 22, step: 0.5, valor: 5, unidade: '°' },
        { id: 'alfa0', label: 'Ângulo de sustentação nula', min: -6, max: 0, step: 0.5, valor: -2, unidade: '°', desc: 'depende do arqueamento do perfil' },
        { id: 'AR', label: 'Alongamento AR = b²/S', min: 2, max: 20, step: 0.5, valor: 8, unidade: '' },
        { id: 'e', label: 'Fator de eficiência de envergadura', min: 0.6, max: 1, step: 0.01, valor: 0.9, unidade: '' },
        { id: 'clMax', label: 'c_L máximo (estol)', min: 0.8, max: 2.2, step: 0.05, valor: 1.4, unidade: '' },
        { id: 'cd0', label: 'Arrasto parasita c_D0', min: 0.004, max: 0.05, step: 0.001, valor: 0.008, unidade: '' },
        { id: 'c', label: 'Corda média', min: 0.3, max: 5, step: 0.1, valor: 1.5, unidade: 'm' },
        { id: 'b', label: 'Envergadura', min: 2, max: 40, step: 0.5, valor: 12, unidade: 'm' }
      ],
      graficos: [
        { id: 'campo', axes: false, height: 340, grid: false, legend: false },
        { id: 'cp', titulo: 'Distribuição de pressão no cilindro / curva c_L × α', xlabel: 'θ (°)  ou  α (°)', ylabel: 'C_p  ou  c_L', aspect: 0.45, legendPos: 'bottomright' },
        { id: 'polar', titulo: 'Polar de arrasto', xlabel: 'c_D', ylabel: 'c_L', aspect: 0.45, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'L', label: 'Sustentação' },
        { id: 'cl', label: 'Coeficiente de sustentação' },
        { id: 'cd', label: 'Coeficiente de arrasto' },
        { id: 'ld', label: 'Eficiência L/D' },
        { id: 'estag', label: 'Estagnação / estol' },
        { id: 'extra', label: 'Observação' }
      ],
      formulas: [
        { g: 'Escoamento potencial' },
        { tex: '\\psi = U\\,\\text{sen}\\,\\theta\\left(r - \\frac{a^2}{r}\\right) - \\frac{\\Gamma}{2\\pi}\\ln\\frac{r}{a}', d: 'cilindro com circulação: corrente uniforme + dipolo + vórtice', destaque: true },
        { tex: "L' = \\rho U \\Gamma", d: 'teorema de Kutta-Joukowski — vale para qualquer forma bidimensional', destaque: true },
        { tex: 'C_p = 1 - \\left(\\frac{v_\\theta}{U}\\right)^2, \\qquad v_\\theta = -2U\\,\\text{sen}\\,\\theta + \\frac{\\Gamma}{2\\pi a}', d: 'sem circulação, C_p é simétrico e a resultante é nula (d\u2019Alembert)' },
        { tex: '\\frac{\\Gamma}{4\\pi U a} \\le 1', d: 'acima disso os pontos de estagnação saem da superfície do cilindro' },
        { g: 'Asa finita' },
        { tex: 'a_{2D} = 2\\pi \\quad\\Rightarrow\\quad a_{3D} = \\frac{a_{2D}}{1 + a_{2D}/(\\pi e AR)}', d: 'a asa finita tem curva menos inclinada', destaque: true },
        { tex: 'c_L = a_{3D}\\,(\\alpha - \\alpha_0)', d: 'até o estol' },
        { tex: 'c_{D_i} = \\frac{c_L^2}{\\pi e AR} \\qquad c_D = c_{D_0} + c_{D_i}', d: 'arrasto induzido: o preço dos vórtices de ponta de asa', destaque: true },
        { tex: 'AR = \\frac{b^2}{S}', d: 'alongamento; planadores usam AR acima de 20 para reduzir o induzido' }
      ],
      passos: [],
      nota: 'Escoamento potencial (invíscido e irrotacional) no caso do cilindro: as linhas de corrente são exatas, mas não há esteira nem arrasto — daí o paradoxo. No caso da asa usa-se a teoria do aerofólio fino com correção de alongamento; o comportamento pós-estol é um modelo simples, apenas ilustrativo.',
      calcular: function (p, ctx) {
        var cil = MF2.cilindroCirc({ a: p.a, U: p.U, gama: p.gama, rho: p.rho });
        var aer = MF2.aerofolio({ alfa: p.alfa, alfa0: p.alfa0, AR: p.AR, e: p.e, clMax: p.clMax,
                                  cd0: p.cd0, rho: p.rho, U: p.U, c: p.c, b: p.b });
        var r = { cil: cil, aer: aer };
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('cp').clear();
        if (p.modo === 'cilindro') {
          g.o.xlabel = 'θ (°) medido a partir do bordo de ataque'; g.o.ylabel = 'C_p';
          var ths = Plot.linspace(0, 360, 181);
          g.line(ths, ths.map(function (t) { return cil.cp(t * Math.PI / 180); }), { color: Plot.serie(0), width: 2.6, label: 'com circulação' });
          var semG = MF2.cilindroCirc({ a: p.a, U: p.U, gama: 0, rho: p.rho });
          g.line(ths, ths.map(function (t) { return semG.cp(t * Math.PI / 180); }), { color: Plot.serie(5), width: 1.8, dash: [4, 4], label: 'sem circulação (simétrico)' });
          g.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1 });
          var cpMin = Math.min.apply(null, ths.map(function (t) { return cil.cp(t * Math.PI / 180); }));
          g.setLimits([0, 360], [Math.min(cpMin, -3.2) * 1.15, 1.4]).draw();
        } else {
          g.o.xlabel = 'ângulo de ataque α (°)'; g.o.ylabel = 'c_L';
          var als = Plot.linspace(-8, 22, 80);
          var cls = als.map(function (al) { return MF2.aerofolio({ alfa: al, alfa0: p.alfa0, AR: p.AR, e: p.e, clMax: p.clMax, cd0: p.cd0, rho: p.rho, U: p.U, c: p.c, b: p.b }).cl; });
          g.line(als, cls, { color: Plot.serie(0), width: 2.6, label: 'asa finita (AR = ' + sg(p.AR, 3) + ')' });
          g.line(als, als.map(function (al) { return 2 * Math.PI * (al - p.alfa0) * Math.PI / 180; }), { color: Plot.serie(5), width: 1.8, dash: [4, 4], label: 'aerofólio 2D (2π)' });
          g.marker(p.alfa, aer.cl, 'operação', { color: 'rgb(220,60,60)', r: 5 });
          g.hline(p.clMax, { color: 'rgb(220,110,40)', dash: [3, 3], text: 'c_L máximo' });
          g.setLimits([-8, 22], [-0.8, p.clMax * 1.45]).draw();
        }

        var gp = ctx.plot('polar').clear();
        var alsP = Plot.linspace(-6, 20, 60);
        var pts = alsP.map(function (al) { return MF2.aerofolio({ alfa: al, alfa0: p.alfa0, AR: p.AR, e: p.e, clMax: p.clMax, cd0: p.cd0, rho: p.rho, U: p.U, c: p.c, b: p.b }); });
        gp.line(pts.map(function (q) { return q.cd; }), pts.map(function (q) { return q.cl; }), { color: Plot.serie(2), width: 2.6, label: 'polar c_L × c_D' });
        [4, 8, 16].forEach(function (ar, j) {
          if (ar === p.AR) return;
          var pp = alsP.map(function (al) { return MF2.aerofolio({ alfa: al, alfa0: p.alfa0, AR: ar, e: p.e, clMax: p.clMax, cd0: p.cd0, rho: p.rho, U: p.U, c: p.c, b: p.b }); });
          gp.line(pp.map(function (q) { return q.cd; }), pp.map(function (q) { return q.cl; }), { color: Plot.serie(j + 3), width: 1.4, dash: [4, 3], label: 'AR = ' + ar });
        });
        gp.marker(aer.cd, aer.cl, 'operação', { color: 'rgb(220,60,60)', r: 5 });
        gp.draw();

        var passos;
        if (p.modo === 'cilindro') {
          passos = [
            { t: '① Campo de velocidades',
              tex: 'v_\\theta = -2U\\,\\text{sen}\\,\\theta + \\frac{\\Gamma}{2\\pi a}',
              texSub: 'No topo (θ = 90°): v = ' + nt(-2 * p.U + p.gama / (TAU * p.a), 4) + '\\ m/s \\qquad \\text{na base: } ' + nt(2 * p.U + p.gama / (TAU * p.a), 4) + '\\ m/s',
              obs: 'A circulação acelera o escoamento de um lado e o retarda do outro. Onde a velocidade é maior, a pressão é menor — e a resultante é a sustentação.' },
            { t: '② Pontos de estagnação',
              tex: '\\text{sen}\\,\\theta_{est} = -\\frac{\\Gamma}{4\\pi U a}',
              texSub: '\\frac{\\Gamma}{4\\pi U a} = ' + nt(cil.razao, 4) + (Math.abs(cil.razao) <= 1 ? ' \\Rightarrow \\theta = ' + cil.estag.map(function (e) { return nt(e.th * 180 / Math.PI, 4) + '^\\circ'; }).join(',\\ ') : ' > 1'),
              r: Math.abs(cil.razao) <= 1 ? 'Dois pontos sobre o cilindro' : 'Um único ponto, fora do cilindro',
              obs: Math.abs(cil.razao) <= 1 ? 'Sem circulação eles ficam em 0° e 180°. Com Γ eles descem (ou sobem) simetricamente, até se encontrarem quando Γ = 4πUa.' : 'Passado o limite Γ = 4πUa, o ponto de estagnação sai da superfície e todo o cilindro fica envolvido pelo escoamento girante.' },
            { t: '③ Sustentação por Kutta-Joukowski',
              tex: "L' = \\rho U \\Gamma",
              texSub: "L' = " + nt(p.rho, 4) + '\\cdot' + nt(p.U, 3) + '\\cdot' + nt(p.gama, 4) + ' = ' + nt(cil.L, 4) + '\\ N/m',
              obs: 'O resultado independe da forma do corpo: qualquer perfil bidimensional com circulação Γ sustenta ρUΓ por metro. É a base de toda a aerodinâmica de asas.' },
            { t: '④ Arrasto: zero',
              texSub: "D' = 0",
              obs: 'O escoamento potencial não prevê arrasto nenhum, com ou sem circulação — o paradoxo de d\u2019Alembert. Falta a viscosidade: é ela que cria a camada limite, a separação e a esteira, que é de onde o arrasto realmente vem.' }
          ];
        } else {
          passos = [
            { t: '① Inclinação da curva de sustentação',
              tex: 'a_{3D} = \\frac{2\\pi}{1 + 2\\pi/(\\pi e AR)}',
              texSub: 'a_{3D} = \\frac{6{,}283}{1 + 6{,}283/(\\pi\\cdot' + nt(p.e, 3) + '\\cdot' + nt(p.AR, 3) + ')} = ' + nt(aer.a3d, 4) + '\\ /rad',
              obs: 'A asa finita "sente" um ângulo de ataque menor que o geométrico, por causa da velocidade induzida pelos vórtices de ponta: a curva fica menos inclinada que os 2π do aerofólio infinito.' },
            { t: '② Coeficiente de sustentação',
              tex: 'c_L = a_{3D}(\\alpha - \\alpha_0)',
              texSub: 'c_L = ' + nt(aer.a3d, 4) + '\\cdot(' + nt(p.alfa, 3) + ' - (' + nt(p.alfa0, 3) + '))\\frac{\\pi}{180} = ' + nt(aer.cl, 4),
              r: aer.estol ? 'Acima do estol (α > ' + sg(aer.alfaEstol, 3) + '°)' : 'Regime linear',
              obs: aer.estol ? 'Passado o ângulo de estol, o escoamento se separa do extradorso: o c_L cai e o arrasto dispara. É por isso que a velocidade de estol define a velocidade mínima de voo.' : 'O ângulo de sustentação nula é negativo porque o perfil é arqueado: mesmo a 0° ele já sustenta.' },
            { t: '③ Arrasto induzido',
              tex: 'c_{D_i} = \\frac{c_L^2}{\\pi e AR}',
              texSub: 'c_{D_i} = \\frac{' + nt(aer.cl, 4) + '^2}{\\pi\\cdot' + nt(p.e, 3) + '\\cdot' + nt(p.AR, 3) + '} = ' + nt(aer.cdi, 4) + ' \\Rightarrow c_D = ' + nt(p.cd0, 3) + ' + ' + nt(aer.cdi, 4) + ' = ' + nt(aer.cd, 4),
              obs: 'O induzido cresce com o quadrado da sustentação e cai com o alongamento: por isso planadores têm asas longas e finas, e aviões de transporte usam winglets para "alongar" a asa sem aumentar a envergadura.' },
            { t: '④ Forças e eficiência',
              tex: 'L = c_L\\tfrac12\\rho U^2 S \\qquad D = c_D\\tfrac12\\rho U^2 S',
              texSub: 'S = ' + nt(aer.S, 4) + '\\ m^2 \\Rightarrow L = ' + nt(aer.L / 1000, 4) + '\\ kN,\\ D = ' + nt(aer.D / 1000, 4) + '\\ kN \\Rightarrow L/D = ' + nt(aer.ld, 4),
              obs: 'A eficiência L/D é a razão de planeio: com L/D = 20, o avião percorre 20 km para cada km de altura perdida com o motor desligado.' }
          ];
        }
        ctx.setPassos(passos);
        return {
          L: { v: p.modo === 'cilindro' ? sg(cil.L, 4) + ' N/m' : sg(aer.L / 1000, 4) + ' kN', u: '', classe: 'destaque' },
          cl: { v: p.modo === 'cilindro' ? cil.cl : aer.cl, u: '' },
          cd: { v: p.modo === 'cilindro' ? 0 : aer.cd, u: p.modo === 'cilindro' ? '(potencial: sem arrasto)' : '' },
          ld: { v: p.modo === 'cilindro' ? '—' : sg(aer.ld, 4), u: '' },
          estag: { v: p.modo === 'cilindro' ? (Math.abs(cil.razao) <= 1 ? 'Dois pontos no cilindro' : 'Fora do cilindro')
            : (aer.estol ? 'Estol' : 'Sem estol (limite ' + sg(aer.alfaEstol, 3) + '°)'), u: '',
            classe: p.modo === 'asa' && aer.estol ? 'alerta' : 'ok' },
          extra: { v: p.modo === 'cilindro' ? 'Paradoxo de d\u2019Alembert' : 'c_Di = ' + sg(aer.cdi, 3), u: '' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Canais abertos: energia específica e ressalto hidráulico
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-canal')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var x0 = a.x + 40, x1 = a.x + a.w - 40, yF = a.y + a.h - 46;
      var yMax = Math.max(r.y2, r.yc, p.y) * 1.5;
      var esc = (a.h - 110) / yMax;
      var xJump = x0 + (x1 - x0) * 0.45;
      /* fundo do canal */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, yF); c.lineTo(x1, yF); c.stroke();
      c.fillStyle = faint; c.globalAlpha = 0.25; c.fillRect(x0, yF, x1 - x0, 14); c.globalAlpha = 1;
      /* superfície da água: y1 antes, transição, y2 depois */
      var superf = function (X) {
        if (X < xJump) return p.y;
        var t = Math.min(1, (X - xJump) / ((x1 - xJump) * 0.35));
        var base = p.y + (r.y2 - p.y) * (1 - Math.cos(Math.PI * t)) / 2;
        var onda = t > 0.05 && t < 1 ? Math.sin(t * 12 - A.t * 6) * (r.y2 - p.y) * 0.06 * (1 - t) : 0;
        return base + onda;
      };
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.28;
      c.beginPath(); c.moveTo(x0, yF);
      for (var X = x0; X <= x1; X += 3) c.lineTo(X, yF - superf(X) * esc);
      c.lineTo(x1, yF); c.closePath(); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 2;
      c.beginPath();
      for (X = x0; X <= x1; X += 3) { var Y = yF - superf(X) * esc; if (X === x0) c.moveTo(X, Y); else c.lineTo(X, Y); }
      c.stroke();
      /* profundidade crítica */
      c.strokeStyle = 'rgb(220,110,40)'; c.lineWidth = 1.4; c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(x0, yF - r.yc * esc); c.lineTo(x1, yF - r.yc * esc); c.stroke();
      rotulo(c, 'yc = ' + sg(r.yc, 3) + ' m', x1 - 6, yF - r.yc * esc - 10, 'rgb(220,110,40)', 10.5, '700', 'right');
      /* profundidade normal */
      c.strokeStyle = Plot.serie(2); c.setLineDash([2, 4]);
      c.beginPath(); c.moveTo(x0, yF - r.yn * esc); c.lineTo(x1, yF - r.yn * esc); c.stroke(); c.setLineDash([]);
      rotulo(c, 'yn = ' + sg(r.yn, 3) + ' m (Manning)', x0 + 6, yF - r.yn * esc - 10, Plot.serie(2), 10.5, '700', 'left');
      /* rotulagem dos escoamentos */
      rotulo(c, 'y₁ = ' + sg(p.y, 3) + ' m · Fr₁ = ' + sg(r.Fr1, 3), (x0 + xJump) / 2, yF - p.y * esc - 20, cor, 11.5, '700');
      rotulo(c, 'v₁ = ' + sg(r.v1, 3) + ' m/s', (x0 + xJump) / 2, yF - p.y * esc - 6, faint, 10.5, '600');
      rotulo(c, 'y₂ = ' + sg(r.y2, 3) + ' m · Fr₂ = ' + sg(r.Fr(r.y2), 3), (xJump + x1) / 2, yF - r.y2 * esc - 20, cor, 11.5, '700');
      rotulo(c, 'v₂ = ' + sg(r.v2, 3) + ' m/s', (xJump + x1) / 2, yF - r.y2 * esc - 6, faint, 10.5, '600');
      /* turbulência do ressalto */
      if (r.Fr1 > 1.05) {
        c.fillStyle = 'rgba(255,255,255,0.75)';
        for (var i = 0; i < 26; i++) {
          var f = i / 26;
          var xb = xJump + f * (x1 - xJump) * 0.3;
          var yb = yF - superf(xb) * esc + Math.sin(i * 2.1 + A.t * 5) * 6;
          c.beginPath(); c.arc(xb, yb, 2 + 1.5 * Math.abs(Math.sin(i + A.t * 3)), 0, TAU); c.fill();
        }
        rotulo(c, 'RESSALTO HIDRÁULICO (' + r.classe + ')', xJump + (x1 - xJump) * 0.18, a.y + 18, 'rgb(220,60,60)', 12, '700');
        rotulo(c, 'perda de energia: ' + sg(r.perda, 3) + ' m (' + sg(100 * r.perda / r.Ey, 3) + ' % de E₁)',
          xJump + (x1 - xJump) * 0.18, a.y + 34, faint, 10.5, '600');
      } else {
        rotulo(c, 'escoamento ' + r.tipo + ': não há ressalto', (x0 + x1) / 2, a.y + 20, faint, 12, '700');
      }
      seta(c, x0 + 6, yF - p.y * esc * 0.5, x0 + 46, yF - p.y * esc * 0.5, 'rgb(255,255,255)', 2, 9);
      rotulo(c, 'Q = ' + sg(p.Q, 3) + ' m³/s · b = ' + sg(p.b, 3) + ' m', (x0 + x1) / 2, yF + 28, faint, 11, '600');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('canal');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-canal', {
      titulo: 'Canais abertos — energia específica e ressalto hidráulico',
      descricao: 'Num canal a superfície é livre, e o número de Froude cumpre o papel que o Mach tem no escoamento compressível: abaixo de 1 as perturbações sobem o canal, acima de 1 não conseguem. A passagem de supercrítico para subcrítico só pode acontecer por um ressalto hidráulico, que dissipa energia.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ressalto a jusante de comporta', desc: 'Fr₁ ≈ 4: ressalto oscilante', valores: { Q: 8, b: 4, y: 0.4, n: 0.014, S: 0.001 } },
        { nome: '2 · Ressalto forte', desc: 'Fr₁ ≈ 9: grande dissipação', valores: { Q: 12, b: 4, y: 0.3, n: 0.014, S: 0.001 } },
        { nome: '3 · Ressalto ondulado', desc: 'Fr₁ entre 1 e 1,7: apenas ondulações', valores: { Q: 4, b: 4, y: 0.42, n: 0.014, S: 0.001 } },
        { nome: '4 · Escoamento fluvial', desc: 'Fr < 1: não há ressalto', valores: { Q: 6, b: 4, y: 1.6, n: 0.014, S: 0.0005 } },
        { nome: '5 · Canal de concreto íngreme', desc: 'declividade alta: y normal supercrítica', valores: { Q: 10, b: 3, y: 0.45, n: 0.013, S: 0.02 } },
        { nome: '6 · Canal de terra', desc: 'n = 0,03: mesma vazão, profundidade maior', valores: { Q: 10, b: 3, y: 0.45, n: 0.03, S: 0.001 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Canal retangular' },
        { id: 'Q', label: 'Vazão', min: 0.2, max: 60, step: 0.1, valor: 8, unidade: 'm³/s' },
        { id: 'b', label: 'Largura do canal', min: 0.5, max: 20, step: 0.1, valor: 4, unidade: 'm' },
        { id: 'y', label: 'Profundidade a montante y₁', min: 0.05, max: 6, step: 0.01, valor: 0.4, unidade: 'm' },
        { tipo: 'titulo', label: 'Escoamento uniforme (Manning)' },
        { id: 'n', label: 'Coeficiente de Manning n', min: 0.009, max: 0.05, step: 0.001, valor: 0.014, unidade: '', desc: 'concreto 0,013 · alvenaria 0,017 · terra 0,025–0,035' },
        { id: 'S', label: 'Declividade de fundo', min: 0.0001, max: 0.05, step: 0.0001, valor: 0.001, unidade: 'm/m' }
      ],
      graficos: [
        { id: 'canal', axes: false, height: 340, grid: false, legend: false },
        { id: 'energia', titulo: 'Curva de energia específica', xlabel: 'Energia específica E (m)', ylabel: 'Profundidade y (m)', aspect: 0.55, legendPos: 'bottomright' },
        { id: 'jump', titulo: 'Conjugadas e perda de energia', xlabel: 'Froude a montante Fr₁', ylabel: 'y₂/y₁  ·  perda relativa (%)', aspect: 0.45, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'q', label: 'Vazão por metro' },
        { id: 'yc', label: 'Profundidade crítica' },
        { id: 'yn', label: 'Profundidade normal' },
        { id: 'Fr1', label: 'Froude a montante' },
        { id: 'tipo', label: 'Regime' },
        { id: 'y2', label: 'Profundidade conjugada' },
        { id: 'perda', label: 'Perda de energia' },
        { id: 'classe', label: 'Tipo de ressalto' }
      ],
      formulas: [
        { g: 'Energia específica' },
        { tex: 'E = y + \\frac{v^2}{2g} = y + \\frac{q^2}{2gy^2}', d: 'energia medida a partir do fundo do canal; q = Q/b', destaque: true },
        { tex: 'y_c = \\sqrt[3]{\\frac{q^2}{g}} \\qquad E_{min} = \\frac{3}{2}y_c', d: 'profundidade crítica: mínimo da curva de energia', destaque: true },
        { tex: 'Fr = \\frac{v}{\\sqrt{gy}}', d: 'Fr < 1 subcrítico (fluvial) · Fr > 1 supercrítico (torrencial)' },
        { g: 'Escoamento uniforme' },
        { tex: 'Q = \\frac{1}{n}A R_h^{2/3}S^{1/2}, \\qquad R_h = \\frac{A}{P}', d: 'equação de Manning; R_h é o raio hidráulico', destaque: true },
        { g: 'Ressalto hidráulico' },
        { tex: '\\frac{y_2}{y_1} = \\frac{1}{2}\\left(\\sqrt{1 + 8Fr_1^2} - 1\\right)', d: 'conjugadas, da equação da quantidade de movimento', destaque: true },
        { tex: '\\Delta E = \\frac{(y_2 - y_1)^3}{4\\,y_1 y_2}', d: 'energia dissipada — é o que se quer numa bacia de dissipação', destaque: true },
        { tex: 'Fr_1 < 1{,}7\\ \\text{ondulado} \\ \\cdot\\ 2{,}5\\ \\text{a}\\ 4{,}5\\ \\text{oscilante} \\ \\cdot\\ > 9\\ \\text{forte}', d: 'classificação do ressalto' }
      ],
      passos: [],
      nota: 'Canal retangular, fundo praticamente horizontal na região do ressalto e distribuição hidrostática de pressão fora dele. A profundidade normal vem da equação de Manning resolvida por bisseção; o ressalto é posicionado arbitrariamente no desenho.',
      calcular: function (p, ctx) {
        var r = MF2.canal(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('energia').clear();
        var ys = Plot.linspace(Math.min(p.y, r.yc) * 0.25, Math.max(r.y2, r.yc, p.y) * 1.8, 160);
        g.line(ys.map(function (y) { return r.E(y); }), ys, { color: Plot.serie(0), width: 2.6, label: 'E(y) para q = ' + sg(r.q, 3) + ' m²/s' });
        g.line(ys, ys, { color: Plot.serie(5), width: 1.4, dash: [4, 4], label: 'E = y (assíntota)' });
        g.hline(r.yc, { color: 'rgb(220,110,40)', dash: [4, 4], text: 'y crítica' });
        g.marker(r.Ey, p.y, 'montante', { color: 'rgb(220,60,60)', r: 5 });
        g.marker(r.E2, r.y2, 'jusante', { color: Plot.serie(2), r: 5 });
        g.setLimits([0, Math.max(r.Ey, r.E2) * 1.4], [0, ys[ys.length - 1]]).draw();

        var gj = ctx.plot('jump').clear();
        var frs = Plot.linspace(1, 12, 80);
        gj.line(frs, frs.map(function (F) { return 0.5 * (Math.sqrt(1 + 8 * F * F) - 1); }), { color: Plot.serie(0), width: 2.6, label: 'y₂/y₁' });
        gj.line(frs, frs.map(function (F) {
          var rr = 0.5 * (Math.sqrt(1 + 8 * F * F) - 1);
          var E1 = 1 + F * F / 2, dE = Math.pow(rr - 1, 3) / (4 * rr);
          return 100 * dE / E1;
        }), { color: Plot.serie(3), width: 2.4, label: 'perda relativa (%)' });
        if (r.Fr1 > 1) gj.marker(Math.min(r.Fr1, 12), Math.min(r.y2 / p.y, 20), 'seu ressalto', { color: 'rgb(220,60,60)', r: 5 });
        gj.setLimits([1, 12], [0, 100]).draw();

        ctx.setPassos([
          { t: '① Vazão específica e profundidade crítica',
            tex: 'q = \\frac{Q}{b} \\qquad y_c = \\sqrt[3]{q^2/g}',
            texSub: 'q = \\frac{' + nt(p.Q, 4) + '}{' + nt(p.b, 3) + '} = ' + nt(r.q, 4) + '\\ m^2/s \\Rightarrow y_c = ' + nt(r.yc, 4) + '\\ m,\\quad E_{min} = ' + nt(r.Ec, 4) + '\\ m',
            obs: 'A profundidade crítica só depende da vazão por metro: é a profundidade em que a energia específica é mínima, e em que Fr = 1.' },
          { t: '② Regime do escoamento a montante',
            tex: 'Fr_1 = \\frac{v_1}{\\sqrt{g y_1}}',
            texSub: 'v_1 = \\frac{q}{y_1} = ' + nt(r.v1, 4) + '\\ m/s \\Rightarrow Fr_1 = ' + nt(r.Fr1, 4),
            r: 'Escoamento ' + r.tipo,
            obs: r.Fr1 > 1 ? 'Como Fr > 1, nenhuma perturbação consegue subir o canal: o escoamento é controlado por montante, e a passagem para o regime fluvial só acontece por um ressalto.'
              : 'Com Fr < 1 as ondas sobem o canal e o escoamento é controlado por jusante — é o caso de rios e canais de irrigação.' },
          { t: '③ Profundidade normal (Manning)',
            tex: 'Q = \\frac{1}{n}A R_h^{2/3}S^{1/2}',
            texSub: 'n = ' + nt(p.n, 3) + ',\\ S = ' + nt(p.S, 3) + ' \\Rightarrow y_n = ' + nt(r.yn, 4) + '\\ m',
            obs: r.yn > r.yc ? 'Como y_n > y_c, a declividade é suave e o escoamento uniforme seria fluvial.' : 'Como y_n < y_c, a declividade é forte: o escoamento uniforme seria torrencial.' },
          { t: '④ Ressalto hidráulico',
            tex: '\\frac{y_2}{y_1} = \\tfrac12\\left(\\sqrt{1 + 8Fr_1^2} - 1\\right) \\qquad \\Delta E = \\frac{(y_2-y_1)^3}{4y_1y_2}',
            texSub: r.Fr1 > 1 ? 'y_2 = \\tfrac{' + nt(p.y, 3) + '}{2}\\left(\\sqrt{1 + 8\\cdot' + nt(r.Fr1, 4) + '^2} - 1\\right) = ' + nt(r.y2, 4) + '\\ m \\Rightarrow \\Delta E = ' + nt(r.perda, 4) + '\\ m'
              : '\\text{Fr}_1 < 1: \\text{não há ressalto}',
            r: r.Fr1 > 1 ? 'Ressalto ' + r.classe + ', dissipando ' + sg(100 * r.perda / r.Ey, 3) + ' % da energia' : 'Sem ressalto',
            obs: 'A conjugada sai da equação da quantidade de movimento, não da energia — justamente porque há perda. Bacias de dissipação a jusante de vertedouros são projetadas para conter o ressalto e proteger o leito do rio.' }
        ]);
        return {
          q: { v: r.q, u: 'm²/s' },
          yc: { v: r.yc, u: 'm', classe: 'destaque' },
          yn: { v: r.yn, u: 'm' },
          Fr1: { v: r.Fr1, u: '', classe: r.Fr1 > 1 ? 'alerta' : 'ok' },
          tipo: { v: r.tipo, u: '' },
          y2: { v: r.Fr1 > 1 ? sg(r.y2, 4) + ' m' : '—', u: '' },
          perda: { v: r.Fr1 > 1 ? sg(r.perda, 4) + ' m' : '—', u: '', classe: 'destaque' },
          classe: { v: r.Fr1 > 1.05 ? 'Ressalto ' + r.classe : 'Sem ressalto', u: '' }
        };
      }
    });
  })();

  /* ==========================================================================
     5. Escoamento compressível com atrito (Fanno) e com calor (Rayleigh)
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-fanno')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var x0 = a.x + 60, x1 = a.x + a.w * 0.62, yc = a.y + a.h * 0.42, H = Math.min(a.h * 0.22, 70);
      /* duto */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, yc - H / 2); c.lineTo(x1, yc - H / 2); c.stroke();
      c.beginPath(); c.moveTo(x0, yc + H / 2); c.lineTo(x1, yc + H / 2); c.stroke();
      /* comprimento até o bloqueio */
      var frac = Math.min(1, r.L / Math.max(r.Lmax, 1e-9));
      c.fillStyle = p.modo === 'fanno' ? Plot.serie(3) : 'rgb(230,90,60)';
      c.globalAlpha = 0.18;
      c.fillRect(x0, yc - H / 2, (x1 - x0) * frac, H); c.globalAlpha = 1;
      /* partículas acelerando ou desacelerando */
      c.fillStyle = Plot.serie(5);
      for (var i = 0; i < 16; i++) {
        var f = ((A.t * 0.5 + i / 16) % 1);
        var acel = r.M2 > r.M1 ? f * f : 1 - (1 - f) * (1 - f);
        var X = x0 + (x1 - x0) * frac * acel;
        c.beginPath(); c.arc(X, yc - H / 3 + (i % 4) * H / 6, 2.4, 0, TAU); c.fill();
      }
      /* entradas e saídas */
      rotulo(c, 'entrada  M₁ = ' + sg(p.M1, 3), x0, yc - H / 2 - 16, cor, 11.5, '700');
      rotulo(c, 'saída  M₂ = ' + sg(r.M2, 3), x0 + (x1 - x0) * frac, yc - H / 2 - 16, Plot.serie(2), 11.5, '700');
      rotulo(c, 'D = ' + sg(p.D * 1000, 3) + ' mm', (x0 + x1) / 2, yc + H / 2 + 18, faint, 10.5, '600');
      if (frac >= 0.999) {
        c.strokeStyle = 'rgb(220,60,60)'; c.lineWidth = 2; c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(x1, yc - H / 2 - 8); c.lineTo(x1, yc + H / 2 + 8); c.stroke(); c.setLineDash([]);
        rotulo(c, 'BLOQUEIO: M = 1', x1, yc + H / 2 + 34, 'rgb(220,60,60)', 11.5, '700');
      }
      /* seta do efeito */
      if (p.modo === 'fanno') {
        for (i = 0; i < 6; i++) {
          var xx = x0 + (x1 - x0) * (0.1 + 0.15 * i);
          seta(c, xx, yc + H / 2 + 4, xx - 12, yc + H / 2 + 4, 'rgb(150,120,200)', 1.6, 7);
        }
        rotulo(c, 'atrito na parede', (x0 + x1) / 2, yc + H / 2 + 46, 'rgb(150,120,200)', 10.5, '700');
      } else {
        for (i = 0; i < 6; i++) {
          var xf = x0 + (x1 - x0) * (0.1 + 0.15 * i);
          seta(c, xf, yc + H / 2 + 26, xf, yc + H / 2 + 6, p.q > 0 ? 'rgb(230,90,60)' : 'rgb(70,140,230)', 1.8, 8);
        }
        rotulo(c, p.q > 0 ? 'calor fornecido' : 'calor retirado', (x0 + x1) / 2, yc + H / 2 + 42, p.q > 0 ? 'rgb(230,90,60)' : 'rgb(70,140,230)', 10.5, '700');
      }
      /* painel */
      var lx = a.x + a.w * 0.68, ly = a.y + 24;
      var linhas = [
        ['Mach na saída', sg(r.M2, 4)],
        ['comprimento até o bloqueio L*', sg(r.Lmax, 4) + ' m'],
        ['comprimento usado', sg(r.L, 4) + ' m  (' + sg(100 * frac, 3) + ' %)'],
        ['T₂/T₁', sg(r.T21, 4)],
        ['P₂/P₁', sg(r.P21, 4)],
        ['P₀₂/P₀₁', sg(r.P021, 4)]
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, cor, 12, '700', 'left');
      });
      rotulo(c, p.modo === 'fanno' ? 'atrito sempre empurra M para 1' : (p.q > 0 ? 'aquecer empurra M para 1' : 'resfriar afasta M de 1'),
        lx, ly + 6 * 34 + 4, p.modo === 'fanno' ? Plot.serie(3) : 'rgb(230,90,60)', 11, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('duto');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-fanno', {
      titulo: 'Escoamento compressível em duto — Fanno e Rayleigh',
      descricao: 'Num duto de área constante, tanto o atrito (linha de Fanno) quanto a troca de calor (linha de Rayleigh) empurram o escoamento na direção de Mach 1. Chegando lá, o escoamento bloqueia: alongar o duto ou fornecer mais calor não aumenta a vazão — ela se reajusta.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ar em tubulação longa', desc: 'M₁ = 0,3 e 8 m de tubo: L* são 13,2 m', valores: { modo: 'fanno', M1: 0.3, k: 1.4, D: 0.05, f: 0.005, L: 8, q: 200, T1: 300, P1: 200 } },
        { nome: '2 · No bloqueio', desc: 'o duto atinge o comprimento máximo', valores: { modo: 'fanno', M1: 0.3, k: 1.4, D: 0.05, f: 0.005, L: 13.2, q: 200, T1: 300, P1: 200 } },
        { nome: '3 · Entrada supersônica', desc: 'M₁ = 2: o atrito desacelera até M = 1', valores: { modo: 'fanno', M1: 2, k: 1.4, D: 0.05, f: 0.005, L: 0.8, q: 200, T1: 300, P1: 200 } },
        { nome: '4 · Combustor (Rayleigh)', desc: 'calor fornecido a M₁ = 0,3', valores: { modo: 'rayleigh', M1: 0.3, k: 1.4, D: 0.1, f: 0.005, L: 1, q: 500, T1: 300, P1: 200 } },
        { nome: '5 · Resfriamento', desc: 'retirar calor afasta o escoamento de M = 1', valores: { modo: 'rayleigh', M1: 0.5, k: 1.4, D: 0.1, f: 0.005, L: 1, q: -200, T1: 300, P1: 200 } },
        { nome: '6 · Rayleigh supersônico', desc: 'aquecer um escoamento a M = 2 o desacelera', valores: { modo: 'rayleigh', M1: 2, k: 1.4, D: 0.1, f: 0.005, L: 1, q: 300, T1: 300, P1: 200 } }
      ],
      controles: [
        { id: 'modo', tipo: 'seg', label: 'Processo', valor: 'fanno',
          opcoes: [{ v: 'fanno', t: 'Fanno (atrito)' }, { v: 'rayleigh', t: 'Rayleigh (calor)' }] },
        { id: 'M1', label: 'Mach na entrada', min: 0.05, max: 4, step: 0.01, valor: 0.3, unidade: '' },
        { id: 'k', label: 'Razão de calores específicos k', min: 1.1, max: 1.67, step: 0.01, valor: 1.4, unidade: '' },
        { id: 'T1', label: 'Temperatura na entrada', min: 150, max: 1200, step: 5, valor: 300, unidade: 'K' },
        { id: 'P1', label: 'Pressão na entrada', min: 20, max: 2000, step: 5, valor: 200, unidade: 'kPa' },
        { tipo: 'titulo', label: 'Duto com atrito (Fanno)' },
        { id: 'D', label: 'Diâmetro do duto', min: 0.005, max: 0.5, step: 0.005, valor: 0.05, unidade: 'm' },
        { id: 'f', label: 'Fator de atrito de Fanning', min: 0.001, max: 0.02, step: 0.0005, valor: 0.005, unidade: '', desc: 'f de Darcy = 4·f de Fanning' },
        { id: 'L', label: 'Comprimento do duto', min: 0.1, max: 300, step: 0.1, valor: 8, unidade: 'm' },
        { tipo: 'titulo', label: 'Duto com troca de calor (Rayleigh)' },
        { id: 'q', label: 'Calor por unidade de massa', min: -600, max: 1500, step: 10, valor: 500, unidade: 'kJ/kg' }
      ],
      graficos: [
        { id: 'duto', axes: false, height: 320, grid: false, legend: false },
        { id: 'linhas', titulo: 'Linhas de Fanno e de Rayleigh no diagrama T-s', xlabel: 'Entropia relativa s − s₁ (kJ/kg·K)', ylabel: 'Temperatura (K)', aspect: 0.55, legendPos: 'topleft' },
        { id: 'razoes', titulo: 'Razões críticas em função do Mach', xlabel: 'Número de Mach', ylabel: 'razão', aspect: 0.45, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'M2', label: 'Mach na saída' },
        { id: 'Lmax', label: 'Comprimento de bloqueio L*' },
        { id: 'T2', label: 'Temperatura na saída' },
        { id: 'P2', label: 'Pressão na saída' },
        { id: 'P021', label: 'Perda de pressão de estagnação' },
        { id: 'T02', label: 'Temperatura de estagnação na saída' },
        { id: 'estado', label: 'Situação' }
      ],
      formulas: [
        { g: 'Fanno — área constante, adiabático, com atrito' },
        { tex: '\\frac{4f L^*}{D} = \\frac{1 - M^2}{kM^2} + \\frac{k+1}{2k}\\ln\\frac{(k+1)M^2}{2 + (k-1)M^2}', d: 'comprimento máximo até o bloqueio', destaque: true },
        { tex: '\\frac{T}{T^*} = \\frac{k+1}{2 + (k-1)M^2} \\qquad \\frac{P}{P^*} = \\frac{1}{M}\\sqrt{\\frac{k+1}{2 + (k-1)M^2}}', d: 'T₀ é constante: o processo é adiabático' },
        { tex: '\\Delta s > 0 \\Rightarrow M \\to 1', d: 'subsônico acelera, supersônico desacelera — sempre em direção a M = 1', destaque: true },
        { g: 'Rayleigh — área constante, sem atrito, com calor' },
        { tex: '\\frac{T_0}{T_0^*} = \\frac{(k+1)M^2\\,[2 + (k-1)M^2]}{(1 + kM^2)^2} \\qquad \\frac{P}{P^*} = \\frac{1+k}{1+kM^2}', destaque: true },
        { tex: 'q = c_p (T_{02} - T_{01})', d: 'o calor fornecido aparece na temperatura de estagnação' },
        { tex: 'q > 0 \\Rightarrow M \\to 1', d: 'aquecer empurra para o sônico; resfriar afasta' },
        { g: 'Curiosidade do Rayleigh subsônico' },
        { tex: 'M > 1/\\sqrt{k} \\Rightarrow \\text{aquecer diminui a temperatura estática}', d: 'a aceleração é tão forte que T cai, embora T₀ suba' }
      ],
      passos: [],
      nota: 'Gás ideal com k constante, duto de área constante e escoamento unidimensional. Em Fanno, adiabático e com atrito; em Rayleigh, sem atrito e com troca de calor. Se o duto for mais longo que L* (ou o calor maior que o de bloqueio), o escoamento se reajusta — a vazão cai — e o simulador limita o resultado a M = 1.',
      calcular: function (p, ctx) {
        var k = p.k, cp = 1.005 * (k === 1.4 ? 1 : 1);
        cp = 0.287 * k / (k - 1);                         /* kJ/kg·K, ar */
        var sup = p.M1 > 1;
        var r = {};
        var iso1 = MF2.isentropico(p.M1, k);
        r.T01 = p.T1 / iso1.TT0; r.P01 = p.P1 / iso1.PP0;
        if (p.modo === 'fanno') {
          var f1 = MF2.fanno(p.M1, k);
          r.Lmax = f1.fLD * p.D / (4 * p.f);
          r.L = Math.min(p.L, r.Lmax);
          var fLD2 = f1.fLD - 4 * p.f * r.L / p.D;
          r.M2 = fLD2 <= 1e-9 ? 1 : MF2.fannoM(fLD2, k, sup);
          var f2 = MF2.fanno(r.M2, k);
          r.T21 = f2.TT / f1.TT; r.P21 = f2.PP / f1.PP; r.P021 = f2.P0P0 / f1.P0P0;
          r.T2 = p.T1 * r.T21; r.P2 = p.P1 * r.P21;
          r.T02 = r.T01;                                   /* adiabático */
          r.bloqueou = p.L >= r.Lmax - 1e-9;
          r.q = 0;
        } else {
          var g1 = MF2.rayleigh(p.M1, k);
          r.T0max = r.T01 / g1.T0T0;
          var T02 = r.T01 + p.q / cp;
          r.qMax = cp * (r.T0max - r.T01);
          r.bloqueou = T02 >= r.T0max - 1e-9;
          if (r.bloqueou) T02 = r.T0max;
          var alvo = T02 / r.T0max;
          /* inverte T0/T0* pelo mesmo ramo (subsônico ou supersônico) */
          var lo = sup ? 1 : 1e-4, hi = sup ? 12 : 1;
          for (var i = 0; i < 200; i++) {
            var M = (lo + hi) / 2, v = MF2.rayleigh(M, k).T0T0;
            if (sup) { if (v > alvo) lo = M; else hi = M; }
            else { if (v < alvo) lo = M; else hi = M; }
          }
          r.M2 = (lo + hi) / 2;
          var g2 = MF2.rayleigh(r.M2, k);
          r.T21 = g2.TT / g1.TT; r.P21 = g2.PP / g1.PP; r.P021 = g2.P0P0 / g1.P0P0;
          r.T2 = p.T1 * r.T21; r.P2 = p.P1 * r.P21; r.T02 = T02;
          r.Lmax = Infinity; r.L = p.L; r.q = p.q;
        }
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        /* linhas de Fanno e Rayleigh no plano T-s, a partir do estado 1 */
        var g = ctx.plot('linhas').clear();
        var linha = function (fn, cor, label) {
          var Ms = [], Ts = [], Ss = [];
          for (var m = 0.06; m <= 4; m += 0.02) Ms.push(m);
          var ref = fn(p.M1, k);
          Ms.forEach(function (m) {
            var q = fn(m, k);
            var T = p.T1 * q.TT / ref.TT, P = p.P1 * q.PP / ref.PP;
            Ts.push(T);
            Ss.push(cp * Math.log(T / p.T1) - 0.287 * Math.log(P / p.P1));
          });
          g.line(Ss, Ts, { color: cor, width: 2.4, label: label });
        };
        linha(MF2.fanno, Plot.serie(3), 'linha de Fanno (atrito)');
        linha(MF2.rayleigh, 'rgb(230,90,60)', 'linha de Rayleigh (calor)');
        g.marker(0, p.T1, 'estado 1', { color: Plot.serie(6), r: 5 });
        var s2 = cp * Math.log(r.T2 / p.T1) - 0.287 * Math.log(r.P2 / p.P1);
        g.marker(s2, r.T2, 'estado 2', { color: 'rgb(220,60,60)', r: 5 });
        g.draw();

        var gr = ctx.plot('razoes').clear();
        var Ms = Plot.linspace(0.1, 3.5, 120);
        var fn = p.modo === 'fanno' ? MF2.fanno : MF2.rayleigh;
        gr.line(Ms, Ms.map(function (m) { return fn(m, k).TT; }), { color: Plot.serie(0), width: 2.2, label: 'T/T*' });
        gr.line(Ms, Ms.map(function (m) { return Math.min(fn(m, k).PP, 6); }), { color: Plot.serie(2), width: 2.2, label: 'P/P*' });
        gr.line(Ms, Ms.map(function (m) { return Math.min(fn(m, k).P0P0, 6); }), { color: Plot.serie(3), width: 2.2, label: 'P₀/P₀*' });
        if (p.modo === 'fanno') gr.line(Ms, Ms.map(function (m) { return Math.min(MF2.fanno(m, k).fLD, 6); }), { color: Plot.serie(5), width: 2, dash: [4, 3], label: '4fL*/D' });
        else gr.line(Ms, Ms.map(function (m) { return MF2.rayleigh(m, k).T0T0; }), { color: Plot.serie(5), width: 2, dash: [4, 3], label: 'T₀/T₀*' });
        gr.vline(p.M1, { color: Plot.serie(6), text: 'M₁' });
        gr.vline(1, { color: Plot.cssVar('--text-faint', '#888'), dash: [2, 3] });
        gr.setLimits([0, 3.5], [0, 4]).draw();

        var passos;
        if (p.modo === 'fanno') {
          var f1b = MF2.fanno(p.M1, k);
          passos = [
            { t: '① Comprimento máximo (bloqueio)',
              tex: '\\frac{4fL^*}{D} = \\frac{1-M^2}{kM^2} + \\frac{k+1}{2k}\\ln\\frac{(k+1)M^2}{2+(k-1)M^2}',
              texSub: '\\frac{4fL^*}{D} = ' + nt(f1b.fLD, 4) + ' \\Rightarrow L^* = \\frac{' + nt(f1b.fLD, 4) + '\\cdot' + nt(p.D, 3) + '}{4\\cdot' + nt(p.f, 4) + '} = ' + nt(r.Lmax, 4) + '\\ m',
              obs: 'Esse é o comprimento em que o escoamento chega exatamente a M = 1. Um duto mais longo não é impossível: a vazão simplesmente se reduz até que o novo M₁ dê o L* certo.' },
            { t: '② Estado na saída',
              tex: '\\frac{4fL^*_2}{D} = \\frac{4fL^*_1}{D} - \\frac{4fL}{D}',
              texSub: '\\frac{4fL}{D} = ' + nt(4 * p.f * r.L / p.D, 4) + ' \\Rightarrow \\frac{4fL^*_2}{D} = ' + nt(Math.max(f1b.fLD - 4 * p.f * r.L / p.D, 0), 4) + ' \\Rightarrow M_2 = ' + nt(r.M2, 4),
              r: r.bloqueou ? 'O duto bloqueia: M₂ = 1' : 'M₂ = ' + sg(r.M2, 4),
              obs: sup ? 'Entrando supersônico, o atrito desacelera o escoamento em direção a M = 1.' : 'Entrando subsônico, o atrito acelera o escoamento — parece estranho, mas a queda de pressão obriga o gás a se expandir.' },
            { t: '③ Propriedades',
              tex: '\\frac{T_2}{T_1} = \\frac{T_2/T^*}{T_1/T^*} \\qquad \\frac{P_2}{P_1} = \\frac{P_2/P^*}{P_1/P^*}',
              texSub: 'T_2 = ' + nt(r.T2, 4) + '\\ K,\\quad P_2 = ' + nt(r.P2, 4) + '\\ kPa,\\quad \\frac{P_{02}}{P_{01}} = ' + nt(r.P021, 4),
              obs: 'A temperatura de estagnação não muda (o processo é adiabático), mas a pressão de estagnação cai ' + sg(100 * (1 - r.P021), 3) + ' %: essa perda é a medida da irreversibilidade do atrito.' }
          ];
        } else {
          passos = [
            { t: '① Temperatura de estagnação',
              tex: 'q = c_p\\,(T_{02} - T_{01})',
              texSub: 'T_{01} = ' + nt(r.T01, 4) + '\\ K \\Rightarrow T_{02} = ' + nt(r.T01, 4) + ' + \\frac{' + nt(p.q, 4) + '}{' + nt(cp, 4) + '} = ' + nt(r.T02, 4) + '\\ K',
              obs: 'Todo o calor aparece na temperatura de estagnação. O limite é T₀* = ' + sg(r.T0max, 4) + ' K, que corresponde a M = 1.' },
            { t: '② Calor de bloqueio',
              tex: '\\frac{T_0}{T_0^*} = \\frac{(k+1)M^2[2+(k-1)M^2]}{(1+kM^2)^2}',
              texSub: 'q_{max} = c_p(T_0^* - T_{01}) = ' + nt(r.qMax, 4) + '\\ kJ/kg',
              r: r.bloqueou ? 'Calor acima do máximo: o escoamento bloqueia' : 'Abaixo do bloqueio',
              obs: 'Se o combustor tentar fornecer mais calor que isso, o escoamento se reajusta: a vazão cai (ou aparece um choque, no caso supersônico).' },
            { t: '③ Mach e propriedades na saída',
              texSub: 'M_2 = ' + nt(r.M2, 4) + ' \\Rightarrow T_2 = ' + nt(r.T2, 4) + '\\ K,\\ P_2 = ' + nt(r.P2, 4) + '\\ kPa,\\ \\frac{P_{02}}{P_{01}} = ' + nt(r.P021, 4),
              obs: p.q > 0 ? 'Aquecendo, o Mach vai em direção a 1 e a pressão cai. Curiosidade: para M entre 1/√k = ' + sg(1 / Math.sqrt(k), 3) + ' e 1, fornecer calor faz a temperatura estática cair, porque a aceleração é mais forte que o aquecimento.' : 'Resfriando, o escoamento se afasta de M = 1 e a pressão sobe.' }
          ];
        }
        ctx.setPassos(passos);
        return {
          M2: { v: r.M2, u: '', classe: 'destaque' },
          Lmax: { v: isFinite(r.Lmax) ? sg(r.Lmax, 4) + ' m' : '—', u: '' },
          T2: { v: r.T2, u: 'K' },
          P2: { v: r.P2, u: 'kPa' },
          P021: { v: 100 * (1 - r.P021), u: '% de P₀ perdidos' },
          T02: { v: r.T02, u: 'K' },
          estado: { v: r.bloqueou ? 'Bloqueado (M = 1 na saída)' : 'Não bloqueado', u: '', classe: r.bloqueou ? 'alerta' : 'ok' }
        };
      }
    });
  })();
})();

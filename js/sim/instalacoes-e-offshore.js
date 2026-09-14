/* ==========================================================================
   Instalações e Offshore — modelos físicos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · Ondas       teoria linear de Airy: ω² = g k tanh(k d), cinemática e energia
     · Espectro    JONSWAP (forma DNV-RP-C205), m0 = Hs²/16
     · Morison     f = ½ρ C_D D |u|u + ρ C_M (πD²/4) du/dt, com esticamento de Wheeler
     · Heave       sistema de 1 GL: T_n = 2π √((M + A)/(ρ g A_wp + K_tendões))
     · Catenária   linha inextensível com trecho apoiado no fundo
     · Separador   Souders-Brown (gás) + tempo de retenção (líquido), API 12J
   ========================================================================== */
(function (global) {
  'use strict';
  var OFF = {};
  var G = 9.81, RHO = 1025;
  OFF.G = G; OFF.RHO = RHO;

  /* ---------------------------------------------------------------
     Ondas lineares
     --------------------------------------------------------------- */
  /* número de onda k por Newton sobre ω² = g k tanh(kd) */
  OFF.numeroOnda = function (T, d) {
    var w = 2 * Math.PI / T;
    var k = w * w / G;                                    /* chute: águas profundas */
    if (d < 1e4) k = Math.max(k, w / Math.sqrt(G * d));   /* e águas rasas, o maior */
    for (var i = 0; i < 60; i++) {
      var th = Math.tanh(k * d);
      var f = G * k * th - w * w;
      var df = G * th + G * k * d * (1 - th * th);
      var dk = f / df;
      k -= dk;
      if (Math.abs(dk) < 1e-12 * k) break;
    }
    return k;
  };

  OFF.onda = function (H, T, d) {
    var k = OFF.numeroOnda(T, d);
    var w = 2 * Math.PI / T;
    var L = 2 * Math.PI / k;
    var L0 = G * T * T / (2 * Math.PI);
    var c = L / T;
    var n = 0.5 * (1 + 2 * k * d / Math.sinh(2 * k * d));
    var kd = k * d;
    var regime = d / L > 0.5 ? 'profundas' : (d / L < 0.05 ? 'rasas' : 'intermediárias');
    return {
      H: H, T: T, d: d, k: k, w: w, L: L, L0: L0, c: c, cg: n * c, n: n, kd: kd,
      regime: regime,
      E: RHO * G * H * H / 8,                           /* J/m² */
      P: RHO * G * H * H / 8 * n * c,                   /* W/m de crista */
      esbeltez: H / L,
      quebra: H / L > 0.142 * Math.tanh(kd),            /* limite de Miche */
      uMax: Math.PI * H / T * Math.cosh(kd) / Math.sinh(kd)  /* na superfície */
    };
  };

  /* cinemática no ponto (x, z) e instante t; z = 0 no nível médio, z = -d no fundo */
  OFF.cinematica = function (o, x, z, t) {
    var fase = o.k * x - o.w * t;
    var a = o.H / 2;
    var ch = Math.cosh(o.k * (z + o.d)), sh = Math.sinh(o.k * (z + o.d)), sd = Math.sinh(o.kd);
    return {
      eta: a * Math.cos(fase),
      u: a * o.w * ch / sd * Math.cos(fase),
      wv: a * o.w * sh / sd * Math.sin(fase),
      ax: a * o.w * o.w * ch / sd * Math.sin(fase),
      /* semieixos da órbita da partícula */
      A: a * ch / sd, B: a * sh / sd
    };
  };

  /* Fenton & McKee (1990) — aproximação explícita do comprimento de onda */
  OFF.comprimentoFenton = function (T, d) {
    var L0 = G * T * T / (2 * Math.PI);
    return L0 * Math.pow(Math.tanh(Math.pow(2 * Math.PI * Math.sqrt(d / G) / T, 1.5)), 2 / 3);
  };

  /* ---------------------------------------------------------------
     Espectro JONSWAP (DNV-RP-C205), ω em rad/s
     --------------------------------------------------------------- */
  OFF.jonswap = function (w, Hs, Tp, gama) {
    var wp = 2 * Math.PI / Tp;
    var sig = w <= wp ? 0.07 : 0.09;
    var Ag = 1 - 0.287 * Math.log(gama);
    var r = Math.exp(-Math.pow(w - wp, 2) / (2 * sig * sig * wp * wp));
    return Ag * (5 / 16) * Hs * Hs * Math.pow(wp, 4) * Math.pow(w, -5) *
           Math.exp(-1.25 * Math.pow(w / wp, -4)) * Math.pow(gama, r);
  };

  /* ---------------------------------------------------------------
     Plataformas: catálogo e resposta em heave
     --------------------------------------------------------------- */
  OFF.TIPOS = {
    jaqueta:   { nome: 'Jaqueta (fixa)', lda: [0, 400], fixa: true, arvore: 'seca', estoca: false,
                 ancor: 'estacas cravadas', custo: 1.0, Tn: 2.0 },
    gravidade: { nome: 'Gravidade (concreto)', lda: [0, 350], fixa: true, arvore: 'seca', estoca: true,
                 ancor: 'peso próprio + lastro', custo: 1.6, Tn: 1.5 },
    torre:     { nome: 'Torre complacente', lda: [300, 900], fixa: true, arvore: 'seca', estoca: false,
                 ancor: 'estacas; flexível no topo', custo: 1.5, Tn: 30 },
    jackup:    { nome: 'Autoelevatória (jack-up)', lda: [0, 150], fixa: true, arvore: 'seca', estoca: false,
                 ancor: 'pernas apoiadas no fundo', custo: 0.5, Tn: 4 },
    semi:      { nome: 'Semissubmersível', lda: [100, 3000], fixa: false, arvore: 'molhada', estoca: false,
                 ancor: 'catenária ou taut-leg', custo: 1.8,
                 M: 80e6, Aa: 0.4, Awp: 1300, K: 0, prof: 18, zeta: 0.08, Lx: 0 },
    tlp:       { nome: 'TLP (pernas atirantadas)', lda: [300, 1800], fixa: false, arvore: 'seca', estoca: false,
                 ancor: 'tendões verticais tracionados', custo: 2.2,
                 M: 60e6, Aa: 0.3, Awp: 1600, K: 237e6, prof: 18, zeta: 0.05, Lx: 0 },
    spar:      { nome: 'Spar', lda: [500, 3000], fixa: false, arvore: 'seca', estoca: false,
                 ancor: 'taut-leg ou catenária', custo: 2.0,
                 M: 220e6, Aa: 0.2, Awp: 1257, K: 0, prof: 70, zeta: 0.05, Lx: 0 },
    fpso:      { nome: 'FPSO', lda: [50, 3000], fixa: false, arvore: 'molhada', estoca: true,
                 ancor: 'turret (ponto único) ou spread mooring', custo: 1.4,
                 M: 323e6, Aa: 1.0, Awp: 16700, K: 0, prof: 8, zeta: 0.25, Lx: 320 },
    sonda:     { nome: 'Navio-sonda (MODU)', lda: [200, 3600], fixa: false, arvore: '—', estoca: false,
                 ancor: 'posicionamento dinâmico', custo: 1.2,
                 M: 100e6, Aa: 1.0, Awp: 6000, K: 0, prof: 6, zeta: 0.25, Lx: 230 }
  };

  OFF.heave = function (tipo) {
    var t = OFF.TIPOS[tipo];
    if (t.fixa) return { Tn: t.Tn, K: Infinity, fixa: true };
    var massa = t.M * (1 + t.Aa);
    var Kh = RHO * G * t.Awp;
    var K = Kh + t.K;
    return { Tn: 2 * Math.PI * Math.sqrt(massa / K), K: K, Kh: Kh, massa: massa, fixa: false };
  };

  /* RAO de heave: X/η = (ρ g A_wp · e^{-k·prof} · C_L / K) · DAF
       e^{-k·prof}  a pressão da onda decai com a profundidade (casco fundo quase não sente)
       C_L          num casco longo, cristas e cavados se cancelam ao longo do comprimento:
                    |sen(kL/2)/(kL/2)| — o navio "ignora" ondas mais curtas que ele
       ζ            amortecimento: navio irradia muita onda (≈ 0,25); spar e TLP quase nada */
  OFF.raoHeave = function (tipo, T) {
    var t = OFF.TIPOS[tipo], h = OFF.heave(tipo);
    if (h.fixa) return 0;
    var k = OFF.numeroOnda(T, 3000);
    var wn = 2 * Math.PI / h.Tn, w = 2 * Math.PI / T, r = w / wn;
    var arg = k * (t.Lx || 0) / 2;
    var CL = arg > 1e-6 ? Math.abs(Math.sin(arg) / arg) : 1;
    var est = RHO * G * t.Awp * Math.exp(-k * t.prof) * CL / h.K;
    return est / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * t.zeta * r, 2));
  };

  /* resposta significativa em heave num mar JONSWAP */
  OFF.respostaMar = function (tipo, Hs, Tp, gama) {
    var m0 = 0, m0r = 0, dw = 0.002, w;
    for (w = 0.05; w < 3.0; w += dw) {
      var S = OFF.jonswap(w, Hs, Tp, gama);
      var R = OFF.raoHeave(tipo, 2 * Math.PI / w);
      m0 += S * dw; m0r += S * R * R * dw;
    }
    return { m0: m0, HsCalc: 4 * Math.sqrt(m0), heaveSig: 4 * Math.sqrt(m0r) };
  };

  /* ---------------------------------------------------------------
     Morison num cilindro vertical, com esticamento de Wheeler
     p: D, d, H, T, Cd, Cm, U (corrente), n (pontos na vertical)
     --------------------------------------------------------------- */
  OFF.morison = function (p, t, esticar) {
    var o = OFF.onda(p.H, p.T, p.d);
    var eta = (p.H / 2) * Math.cos(-o.w * t);
    var topo = esticar === false ? 0 : eta;
    var n = p.n || 60, dz = (topo + p.d) / n;
    var A = Math.PI * p.D * p.D / 4;
    var Fd = 0, Fi = 0, Md = 0, Mi = 0, perfil = [];
    for (var i = 0; i <= n; i++) {
      var z = -p.d + i * dz;
      /* Wheeler: a cinemática da superfície instantânea é levada ao nível médio */
      var zs = esticar === false ? z : p.d * (z - eta) / (p.d + eta);
      var cin = OFF.cinematica(o, 0, zs, t);
      var u = cin.u + (p.U || 0);
      var fd = 0.5 * RHO * p.Cd * p.D * Math.abs(u) * u;
      var fi = RHO * p.Cm * A * cin.ax;
      var peso = (i === 0 || i === n) ? 0.5 : 1;
      Fd += fd * dz * peso; Fi += fi * dz * peso;
      Md += fd * (z + p.d) * dz * peso; Mi += fi * (z + p.d) * dz * peso;
      if (i % 6 === 0) perfil.push({ z: z, u: u, f: fd + fi });
    }
    return { onda: o, eta: eta, Fd: Fd, Fi: Fi, F: Fd + Fi, Md: Md, Mi: Mi, M: Md + Mi, perfil: perfil };
  };

  OFF.morisonCiclo = function (p) {
    var o = OFF.onda(p.H, p.T, p.d);
    var N = 72, serie = [], Fmax = 0, Mmax = 0, tFmax = 0;
    for (var j = 0; j <= N; j++) {
      var t = j / N * p.T;
      var r = OFF.morison(p, t, true);
      serie.push({ t: t, Fd: r.Fd, Fi: r.Fi, F: r.F, M: r.M, eta: r.eta });
      if (Math.abs(r.F) > Math.abs(Fmax)) { Fmax = r.F; tFmax = t; }
      if (Math.abs(r.M) > Math.abs(Mmax)) Mmax = r.M;
    }
    var uMax = o.uMax + Math.abs(p.U || 0);
    return {
      onda: o, serie: serie, Fmax: Fmax, Mmax: Mmax, tFmax: tFmax,
      KC: uMax * p.T / p.D, braco: Math.abs(Mmax / Fmax),
      Fi0: RHO * p.Cm * Math.PI * p.D * p.D / 4 * G * (p.H / 2) * Math.tanh(o.kd),   /* inércia, forma fechada, até o nível médio */
      Fd0: 0.5 * RHO * p.Cd * p.D * Math.pow(p.H / 2 * o.w, 2) / Math.pow(Math.sinh(o.kd), 2) *
           (Math.sinh(2 * o.kd) / (4 * o.k) + p.d / 2),                                   /* arrasto, forma fechada, sem corrente */
      D_L: p.D / o.L
    };
  };

  /* ---------------------------------------------------------------
     Catenária com trecho apoiado (linha inextensível)
     h: altura do fairlead sobre o fundo; w: peso submerso (N/m); L: comprimento
     --------------------------------------------------------------- */
  OFF.catenariaH = function (H, h, w, L) {
    var a = H / w;
    var s = Math.sqrt(h * h + 2 * h * a);                 /* trecho suspenso */
    var x = a * Math.acosh(1 + h / a);                    /* projeção horizontal do suspenso */
    return { a: a, s: s, x: x, apoiado: L - s, X: L - s + x,
             T: H + w * h, V: w * s, ang: Math.atan2(w * s, H) * 180 / Math.PI, arranca: s > L };
  };
  /* H tal que a distância horizontal âncora-fairlead seja X */
  OFF.catenariaX = function (X, h, w, L) {
    var lo = 1, hi = w * L * 50, i, mid, c;
    var lim = OFF.catenariaH(hi, h, w, L);
    for (i = 0; i < 200; i++) {
      mid = Math.sqrt(lo * hi);
      c = OFF.catenariaH(mid, h, w, L);
      /* X cresce com H enquanto houver trecho apoiado */
      if (c.s > L || c.X > X) hi = mid; else lo = mid;
    }
    c = OFF.catenariaH(lo, h, w, L);
    c.H = lo;
    c.noLimite = Math.abs(c.X - X) > 0.5;                 /* não alcança: linha curta */
    return c;
  };

  /* linha taut de poliéster: reta, elástica */
  OFF.taut = function (X, h, EA, L0, w) {
    var l = Math.sqrt(X * X + h * h);
    var T = Math.max(0, EA * (l - L0) / L0);
    return { l: l, T: T, H: T * X / l, V: T * h / l, ang: Math.atan2(h, X) * 180 / Math.PI };
  };

  OFF.LINHAS = {
    amarra:     { nome: 'Amarra de aço R4, 120 mm', w: 2440, EA: 1.26e9, MBL: 12.0e6 },
    cabo:       { nome: 'Cabo de aço 102 mm', w: 410, EA: 0.96e9, MBL: 9.0e6 },
    poliester:  { nome: 'Poliéster 160 mm', w: 45, EA: 0.35e9, MBL: 10.0e6 }
  };

  /* sistema simétrico de n linhas; deslocamento δ na direção 0° */
  OFF.ancoragem = function (p) {
    var ln = OFF.LINHAS[p.linha];
    var n = p.nLinhas, sis = [], i;
    var R0 = p.raio;                                      /* raio horizontal âncora-fairlead */
    var taut = p.tipo === 'taut';
    var L0taut = 0;
    var semTracao = false;
    if (!taut) {
      /* catenária: o comprimento sai da pré-tensão pedida no fairlead.
         T = H + w·h, então H0 = T0 − w·h — e se o peso da linha já passa de T0, não há solução */
      var H0 = p.T0 - ln.w * p.h;
      if (H0 <= 0.02 * p.T0) { H0 = 0.02 * p.T0 + 1; semTracao = true; }
      var c0 = OFF.catenariaH(H0, p.h, ln.w, 1e9);
      p.L = R0 - c0.x + c0.s;
      if (p.L < c0.s) p.L = c0.s;
    }
    if (taut) {
      /* comprimento indeformado tal que a pré-tensão seja T0 */
      var l0 = Math.sqrt(R0 * R0 + p.h * p.h);
      L0taut = l0 / (1 + p.T0 / ln.EA);
    }
    function linhaEm(X) {
      if (taut) return OFF.taut(X, p.h, ln.EA, L0taut, ln.w);
      return OFF.catenariaX(X, p.h, ln.w, p.L);
    }
    function restauradora(delta) {
      var Fx = 0, Tmax = 0, pior = null;
      for (var j = 0; j < n; j++) {
        var th = 2 * Math.PI * j / n;
        var dx = R0 * Math.cos(th) + delta, dy = R0 * Math.sin(th);
        var X = Math.sqrt(dx * dx + dy * dy);
        var c = linhaEm(X);
        Fx -= c.H * dx / X;                               /* linha puxa o fairlead para a âncora */
        if (c.T > Tmax) { Tmax = c.T; pior = c; }
      }
      return { F: -Fx, Tmax: Tmax, pior: pior };
    }
    /* deslocamento de equilíbrio sob a força ambiental */
    var lo = -0.3 * p.h, hi = 0.5 * p.h, k;
    for (k = 0; k < 80; k++) {
      var mid = (lo + hi) / 2;
      if (restauradora(mid).F > p.Fenv) hi = mid; else lo = mid;
    }
    var delta = (lo + hi) / 2;
    var eq = restauradora(delta);
    /* linha a barlavento (a mais tracionada) e a sotavento, no plano do desenho */
    var barl = linhaEm(R0 + delta), sotav = linhaEm(R0 - delta);
    var zero = restauradora(0);
    return {
      delta: delta, offset: 100 * delta / p.h, eq: eq, barl: barl, sotav: sotav,
      T0: zero.pior ? zero.Tmax : 0, Tmax: eq.Tmax, FS: ln.MBL / eq.Tmax, MBL: ln.MBL,
      raioLDA: R0 / p.h, restauradora: restauradora, linha: ln, L0taut: L0taut,
      L: p.L, pesoLinha: ln.w * p.h, semTracao: semTracao,
      /* âncora de arrasto não resiste a esforço vertical: precisa de trecho apoiado */
      arranca: !taut && (barl.noLimite || barl.apoiado < 0.02 * p.L),
      rigidez: (restauradora(0.01 * p.h).F - restauradora(-0.01 * p.h).F) / (0.02 * p.h)
    };
  };

  /* ---------------------------------------------------------------
     Processamento primário no topside
     p: Qliq (m³/d de líquido), bsw (%), rgo (m³/m³), P (bar abs), T (°C),
        tRet (min), efHidro (%), efFlot (%), toGin (mg/L), Pexp (bar)
     --------------------------------------------------------------- */
  OFF.processo = function (p) {
    var Qo = p.Qliq * (1 - p.bsw / 100);                  /* m³/d de óleo */
    var Qw = p.Qliq * p.bsw / 100;
    var QgStd = Qo * p.rgo;                               /* Sm³/d */
    var Tk = p.T + 273.15, Z = 0.90, MW = 20;
    var rhoG = p.P * 1e5 * MW / (Z * 8314 * Tk);          /* kg/m³ */
    var QgAct = QgStd * (1.01325 / p.P) * (Tk / 288.15) * Z / 86400;   /* m³/s */
    var rhoL = 0.85 * 1000 * (1 - p.bsw / 100) + 1030 * p.bsw / 100;
    var Ksb = 0.12;                                       /* m/s, horizontal com eliminador de névoa */
    var vMax = Ksb * Math.sqrt((rhoL - rhoG) / rhoG);
    var Agas = QgAct / vMax;                              /* m² de seção para o gás */
    var Vliq = p.Qliq / 1440 * p.tRet;                    /* m³ retidos */
    /* vaso horizontal, L/D = 4, líquido ocupando metade da seção */
    var Dl = Math.cbrt(Vliq / (0.5 * Math.PI / 4 * 4));
    var Dg = Math.sqrt(Agas / (0.5 * Math.PI / 4));
    var D = Math.max(Dl, Dg);
    var Lv = 4 * D;
    /* tratamento de água produzida */
    var tog1 = p.toGin * (1 - p.efHidro / 100);
    var tog2 = tog1 * (1 - p.efFlot / 100);
    var oleoMar = Qw * tog2 / 1e6 * 1000 / 1000;         /* t/d de óleo descartado (mg/L × m³ → g/1000) */
    /* compressão até a pressão de exportação: estágios com razão ≤ 4, k = 1,27, η = 0,75 */
    var r = p.Pexp / p.P;
    var nEst = Math.max(1, Math.ceil(Math.log(r) / Math.log(4)));
    var kk = 1.27, eta = 0.75;
    var W = nEst * kk / (kk - 1) * (p.P * 1e5) * QgAct *
            (Math.pow(r, (kk - 1) / (nEst * kk)) - 1) / eta;          /* W */
    return {
      Qo: Qo, Qw: Qw, QgStd: QgStd, QgAct: QgAct, rhoG: rhoG, rhoL: rhoL, vMax: vMax,
      Agas: Agas, Vliq: Vliq, Dl: Dl, Dg: Dg, D: D, Lv: Lv, limitante: Dg > Dl ? 'gás' : 'líquido',
      tog1: tog1, tog2: tog2, atende: tog2 <= 29, oleoMar: Qw * tog2 * 1e-6,
      r: r, nEst: nEst, Wcomp: W / 1e6, bbl: Qo * 6.2898
    };
  };

  global.OFF = OFF;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Simuladores
     1. sim-plataformas : cada tipo de plataforma na sua lâmina d'água, balançando
                          no mar — período natural, RAO e resposta espectral
     2. sim-ondas       : teoria linear de Airy com órbitas das partículas
     3. sim-morison     : força de onda e corrente num cilindro (perna de jaqueta)
     4. sim-ancoragem   : catenária x taut-leg, offset, tração e fator de segurança
     5. sim-processo    : processamento primário no topside
   ========================================================================== */
(function () {
  'use strict';
  var OFF = window.OFF;
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
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(9, L * 0.45);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
    c.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
    c.closePath(); c.fill();
  }
  function naPolilinha(pts, s) {
    var tot = 0, seg = [], i;
    for (i = 0; i < pts.length - 1; i++) {
      var L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push(L); tot += L;
    }
    var alvo = ((s % 1) + 1) % 1 * tot;
    for (i = 0; i < seg.length; i++) {
      if (alvo <= seg[i] || i === seg.length - 1) {
        var f = seg[i] > 0 ? alvo / seg[i] : 0;
        return [pts[i][0] + f * (pts[i + 1][0] - pts[i][0]), pts[i][1] + f * (pts[i + 1][1] - pts[i][1])];
      }
      alvo -= seg[i];
    }
    return pts[pts.length - 1];
  }
  function tubo(c, pts, cor, larg, fase, n, rPart, corPart) {
    var i;
    c.setLineDash([]); c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = Plot.cssVar('--border-strong', '#999'); c.lineWidth = larg + 3;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
    c.strokeStyle = cor; c.globalAlpha = 0.30; c.lineWidth = larg; c.stroke(); c.globalAlpha = 1;
    if (n > 0) {
      c.fillStyle = corPart || cor;
      for (i = 0; i < n; i++) {
        var p = naPolilinha(pts, fase + i / n);
        c.beginPath(); c.arc(p[0], p[1], rPart || 2.2, 0, TAU); c.fill();
      }
    }
    c.lineCap = 'butt';
  }
  var nt = function (v, n) { return Plot.numTex(v, n); };
  var sg = function (v, n) { return Plot.sig(v, n); };
  var COR_MAR = 'rgba(40,110,190,0.20)', COR_MAR_LINHA = 'rgb(60,140,220)';
  var COR_FUNDO = 'rgba(150,120,80,0.55)';

  /* ==========================================================================
     1. Tipos de plataforma
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-plataformas')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function classeLDA(h) {
      return h < 300 ? 'águas rasas' : (h <= 1500 ? 'águas profundas' : 'águas ultraprofundas');
    }

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, k;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var tipo = OFF.TIPOS[p.tipo];

      var ySup = Y0 + H * 0.24, yFun = Y0 + H * 0.93;
      /* escala vertical em raiz quadrada: 50 m e 3000 m cabem no mesmo quadro */
      function yProf(z) { return ySup + (yFun - ySup) * Math.sqrt(Math.max(0, z) / 3000); }
      var yLDA = yProf(p.lda);
      var cx = X0 + W * 0.36;

      /* mar e ondas */
      var ampV = Math.min(9, 1.2 * p.Hs);
      var Lvis = W * 0.22 * Math.max(0.5, p.Tp / 10);
      function eta(x) { return ampV * Math.sin(TAU * (x / Lvis) - TAU * t / p.Tp); }
      c.fillStyle = COR_MAR;
      c.beginPath(); c.moveTo(X0, yLDA);
      for (k = 0; k <= 80; k++) { var xx = X0 + W * 0.72 * k / 80; c.lineTo(xx, ySup - eta(xx)); }
      c.lineTo(X0 + W * 0.72, yLDA); c.closePath(); c.fill();
      c.strokeStyle = COR_MAR_LINHA; c.lineWidth = 2; c.beginPath();
      for (k = 0; k <= 80; k++) { xx = X0 + W * 0.72 * k / 80; if (k) c.lineTo(xx, ySup - eta(xx)); else c.moveTo(xx, ySup - eta(xx)); }
      c.stroke();
      /* fundo */
      c.fillStyle = COR_FUNDO;
      c.fillRect(X0, yLDA, W * 0.72, Math.max(4, yFun - yLDA + 8));
      c.strokeStyle = 'rgb(120,90,50)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X0, yLDA); c.lineTo(X0 + W * 0.72, yLDA); c.stroke();

      /* régua de profundidade */
      c.font = fonte(9); c.textAlign = 'right'; c.textBaseline = 'middle';
      [0, 100, 300, 1000, 1500, 2000, 3000].forEach(function (z) {
        var y = yProf(z);
        c.strokeStyle = faint; c.lineWidth = 1;
        c.beginPath(); c.moveTo(X0 + 38, y); c.lineTo(X0 + 44, y); c.stroke();
        c.fillStyle = faint; c.fillText(z + ' m', X0 + 36, y);
      });
      c.save(); c.globalAlpha = 0.10;
      c.fillStyle = Plot.serie(2); c.fillRect(X0 + 35, ySup, 6, yProf(300) - ySup);
      c.fillStyle = Plot.serie(0); c.fillRect(X0 + 35, yProf(300), 6, yProf(1500) - yProf(300));
      c.fillStyle = Plot.serie(6); c.fillRect(X0 + 35, yProf(1500), 6, yFun - yProf(1500));
      c.restore();

      /* movimento vertical: heave com a RAO no período de pico (ilustrativo, exagerado ×3) */
      var hv = tipo.fixa ? 0 : -3 * Math.min(6, r.rao * p.Hs / 2) * Math.sin(TAU * t / p.Tp - 0.6);
      var fora = p.lda < tipo.lda[0] || p.lda > tipo.lda[1];
      var corEst = fora ? Plot.serie(6) : cor;
      c.strokeStyle = corEst; c.fillStyle = elev; c.lineWidth = 2;

      function deck(y, w) {
        c.fillStyle = elev; c.strokeStyle = corEst; c.lineWidth = 2;
        c.fillRect(cx - w / 2, y - 14, w, 14); c.strokeRect(cx - w / 2, y - 14, w, 14);
        c.strokeRect(cx - w * 0.30, y - 34, 10, 20);                /* torre/queimador */
        c.beginPath(); c.moveTo(cx + w * 0.25, y - 14); c.lineTo(cx + w * 0.25, y - 40); c.lineTo(cx + w * 0.40, y - 48); c.stroke();
      }
      function ancoras(xs, yTopo) {
        c.strokeStyle = faint; c.lineWidth = 1.4;
        xs.forEach(function (xa) {
          c.beginPath(); c.moveTo(xa > cx ? cx + 22 : cx - 22, yTopo);
          c.quadraticCurveTo(xa - (xa - cx) * 0.1, yLDA - 4, xa, yLDA);
          c.stroke();
          c.fillStyle = faint; c.fillRect(xa - 3, yLDA - 3, 6, 5);
        });
      }

      if (p.tipo === 'jaqueta' || p.tipo === 'torre') {
        var base = p.tipo === 'jaqueta' ? 70 : 34, topo = p.tipo === 'jaqueta' ? 40 : 30;
        var ang = p.tipo === 'torre' ? 0.012 * Math.sin(TAU * t / 30) * p.Hs : 0;
        c.save(); c.translate(cx, yLDA); c.rotate(ang); c.translate(-cx, -yLDA);
        c.strokeStyle = corEst; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx - base / 2, yLDA); c.lineTo(cx - topo / 2, ySup - 18);
        c.moveTo(cx + base / 2, yLDA); c.lineTo(cx + topo / 2, ySup - 18); c.stroke();
        c.lineWidth = 1;
        var nb = Math.max(2, Math.round((yLDA - ySup) / 26));
        for (k = 0; k < nb; k++) {
          var f1 = k / nb, f2 = (k + 1) / nb;
          var y1 = yLDA - f1 * (yLDA - ySup + 18), y2 = yLDA - f2 * (yLDA - ySup + 18);
          var w1 = base + (topo - base) * f1, w2 = base + (topo - base) * f2;
          c.beginPath(); c.moveTo(cx - w1 / 2, y1); c.lineTo(cx + w2 / 2, y2);
          c.moveTo(cx + w1 / 2, y1); c.lineTo(cx - w2 / 2, y2);
          c.moveTo(cx - w2 / 2, y2); c.lineTo(cx + w2 / 2, y2); c.stroke();
        }
        deck(ySup - 18, topo + 40);
        c.restore();
        c.strokeStyle = faint; c.lineWidth = 2;
        c.beginPath(); c.moveTo(cx - base / 2, yLDA); c.lineTo(cx - base / 2, yLDA + 10);
        c.moveTo(cx + base / 2, yLDA); c.lineTo(cx + base / 2, yLDA + 10); c.stroke();
      } else if (p.tipo === 'gravidade') {
        c.fillStyle = 'rgba(160,160,160,0.6)'; c.strokeStyle = corEst; c.lineWidth = 2;
        var hb = Math.min(40, (yLDA - ySup) * 0.35);
        c.fillRect(cx - 50, yLDA - hb, 100, hb); c.strokeRect(cx - 50, yLDA - hb, 100, hb);
        for (k = -1; k <= 1; k += 2) {
          c.beginPath();
          c.moveTo(cx + k * 30 - 9, yLDA - hb); c.lineTo(cx + k * 22 - 6, ySup - 18);
          c.lineTo(cx + k * 22 + 6, ySup - 18); c.lineTo(cx + k * 30 + 9, yLDA - hb); c.closePath();
          c.fill(); c.stroke();
        }
        deck(ySup - 18, 90);
        c.fillStyle = faint; c.font = fonte(9); c.textAlign = 'center';
        c.fillText('tanques de óleo na base', cx, yLDA - hb / 2);
      } else if (p.tipo === 'jackup') {
        var yH = ySup - 26;
        c.lineWidth = 3; c.strokeStyle = corEst;
        [-40, 0, 40].forEach(function (dx) {
          c.beginPath(); c.moveTo(cx + dx, yLDA); c.lineTo(cx + dx, yH - 40); c.stroke();
          c.fillStyle = faint; c.beginPath(); c.ellipse(cx + dx, yLDA, 9, 4, 0, 0, TAU); c.fill();
        });
        c.fillStyle = elev; c.lineWidth = 2;
        c.fillRect(cx - 56, yH - 12, 112, 16); c.strokeRect(cx - 56, yH - 12, 112, 16);
        c.strokeRect(cx - 8, yH - 50, 16, 38);
      } else if (p.tipo === 'semi' || p.tipo === 'tlp') {
        var y0 = ySup + hv, yPont = y0 + 22;
        c.fillStyle = elev; c.strokeStyle = corEst; c.lineWidth = 2;
        c.fillRect(cx - 50, yPont, 100, 10); c.strokeRect(cx - 50, yPont, 100, 10);
        [-38, 38].forEach(function (dx) { c.fillRect(cx + dx - 7, y0 - 16, 14, 40); c.strokeRect(cx + dx - 7, y0 - 16, 14, 40); });
        deck(y0 - 16, 104);
        if (p.tipo === 'semi') ancoras([cx - W * 0.30, cx + W * 0.30], yPont + 5);
        else {
          c.strokeStyle = faint; c.lineWidth = 1.6;
          [-44, -36, 36, 44].forEach(function (dx) {
            c.beginPath(); c.moveTo(cx + dx, yPont + 10); c.lineTo(cx + dx, yLDA); c.stroke();
          });
          c.fillStyle = faint; c.fillRect(cx - 52, yLDA - 5, 104, 5);
        }
      } else if (p.tipo === 'spar') {
        var ys = ySup + hv, prof = Math.max(24, yProf(150) - ySup);
        c.fillStyle = elev; c.strokeStyle = corEst; c.lineWidth = 2;
        c.fillRect(cx - 14, ys - 14, 28, prof + 14); c.strokeRect(cx - 14, ys - 14, 28, prof + 14);
        c.strokeStyle = faint; c.lineWidth = 1;
        for (k = 1; k < 5; k++) { c.beginPath(); c.moveTo(cx - 14, ys + k * prof / 5); c.lineTo(cx + 14, ys + k * prof / 5); c.stroke(); }
        deck(ys - 14, 80);
        ancoras([cx - W * 0.28, cx + W * 0.28], ys + prof * 0.6);
      } else if (p.tipo === 'fpso' || p.tipo === 'sonda') {
        var yn = ySup + hv, Lc = p.tipo === 'fpso' ? 190 : 150;
        c.fillStyle = elev; c.strokeStyle = corEst; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(cx - Lc / 2, yn - 12); c.lineTo(cx + Lc / 2, yn - 12);
        c.lineTo(cx + Lc / 2 - 12, yn + 12); c.lineTo(cx - Lc / 2 + 6, yn + 12); c.closePath();
        c.fill(); c.stroke();
        if (p.tipo === 'fpso') {
          /* módulos de processo e turret na proa */
          for (k = 0; k < 5; k++) c.strokeRect(cx - Lc / 2 + 30 + k * 24, yn - 26, 18, 14);
          c.strokeRect(cx - Lc / 2 + 4, yn - 30, 16, 18);
          c.fillStyle = faint; c.beginPath(); c.arc(cx + Lc / 2 - 24, yn, 6, 0, TAU); c.fill();
          ancoras([cx + Lc / 2 + W * 0.10, cx - W * 0.25], yn + 10);
          /* riser em lazy-wave */
          c.strokeStyle = Plot.serie(3); c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(cx + Lc / 2 - 24, yn + 10);
          var ym = ySup + (yLDA - ySup) * 0.55;
          c.bezierCurveTo(cx + Lc / 2 - 10, ym, cx + Lc / 2 + 40, ym - 30, cx + Lc / 2 + 50, yLDA);
          c.stroke();
        } else {
          c.beginPath(); c.moveTo(cx - 10, yn - 12); c.lineTo(cx, yn - 70); c.lineTo(cx + 10, yn - 12); c.stroke();
          c.strokeStyle = Plot.serie(3); c.lineWidth = 2;
          c.beginPath(); c.moveTo(cx, yn + 12); c.lineTo(cx, yLDA - 10); c.stroke();
          c.fillStyle = Plot.serie(6); c.fillRect(cx - 6, yLDA - 12, 12, 12);
          /* propulsores do posicionamento dinâmico */
          for (k = 0; k < 3; k++) {
            var fb = (t * 0.8 + k / 3) % 1;
            c.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - fb)) + ')';
            c.beginPath(); c.arc(cx - Lc / 2 + 10 - fb * 26, yn + 16 + fb * 6, 2 + fb * 3, 0, TAU); c.fill();
          }
        }
      }

      /* painel */
      var lx = X0 + W * 0.74, ly = Y0 + 6;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12.5, '700');
      c.fillText(tipo.nome, lx, ly);
      c.font = fonte(10.5); c.fillStyle = faint;
      var linhas = [
        ['Lâmina d’água', p.lda + ' m · ' + classeLDA(p.lda)],
        ['Faixa usual', tipo.lda[0] + '–' + tipo.lda[1] + ' m'],
        ['Árvore de natal', tipo.arvore],
        ['Estoca óleo', tipo.estoca ? 'sim' : 'não'],
        ['Fixação', tipo.ancor],
        ['Heave natural', tipo.fixa ? '— (fixa)' : sg(r.h.Tn, 3) + ' s'],
        ['Heave significativo', tipo.fixa ? '—' : sg(r.resp.heaveSig, 2) + ' m']
      ];
      var yy = ly + 22;
      linhas.forEach(function (ln) {
        c.fillStyle = faint; c.font = fonte(9.5); c.fillText(ln[0], lx, yy);
        c.fillStyle = cor; c.font = fonte(10.5, '600');
        var txt = ln[1];
        if (c.measureText(txt).width > W * 0.25) {
          var m = txt.lastIndexOf(' ', Math.floor(txt.length * 0.55));
          c.fillText(txt.slice(0, m), lx, yy + 12); c.fillText(txt.slice(m + 1), lx, yy + 25); yy += 13;
        } else c.fillText(txt, lx, yy + 12);
        yy += 31;
      });
      if (fora) {
        c.fillStyle = Plot.serie(6); c.font = fonte(11, '700');
        c.fillText('⚠ fora da faixa de', lx, yy + 2);
        c.fillText('   lâmina d’água usual', lx, yy + 16);
      }
      c.fillStyle = faint; c.font = fonte(9); c.textAlign = 'left';
      c.fillText('escala vertical em raiz quadrada · heave exagerado 3×', X0 + 36, Y0 + 4);
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('cena');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt * 2;                /* 2× o tempo real */
      desenha();
    });

    var ops = Object.keys(OFF.TIPOS).map(function (k) { return { v: k, t: OFF.TIPOS[k].nome }; });

    Sim.build('#sim-plataformas', {
      titulo: 'Tipos de plataforma — lâmina d’água, movimento e escolha do conceito',
      descricao: 'Plataforma fixa resiste à onda; plataforma flutuante tenta não responder a ela. Escolha o tipo e a lâmina d’água e veja o conceito no mar: o período natural em heave decide se a estrutura dança com as ondas ou as ignora.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Jaqueta em águas rasas', desc: 'Bacia de Campos nos anos 1980', valores: { tipo: 'jaqueta', lda: 120, Hs: 4, Tp: 10, animar: true } },
        { nome: '2 · Semissubmersível', desc: 'Produção sem estocagem', valores: { tipo: 'semi', lda: 1300, Hs: 5, Tp: 11, animar: true } },
        { nome: '3 · FPSO no pré-sal', desc: 'Estoca e alivia por navio', valores: { tipo: 'fpso', lda: 2150, Hs: 5, Tp: 11, animar: true } },
        { nome: '4 · TLP: heave quase nulo', desc: 'Permite árvore de natal seca', valores: { tipo: 'tlp', lda: 1000, Hs: 5, Tp: 11, animar: true } },
        { nome: '5 · Spar em mar de tempestade', desc: 'Casco fundo não sente a onda', valores: { tipo: 'spar', lda: 1800, Hs: 10, Tp: 15, animar: true } },
        { nome: '6 · Jaqueta fora da faixa', desc: 'Custo e período natural explodem', valores: { tipo: 'jaqueta', lda: 700, Hs: 5, Tp: 11, animar: true } },
        { nome: '7 · Jack-up perfurando', desc: 'MODU de águas rasas', valores: { tipo: 'jackup', lda: 90, Hs: 3, Tp: 8, animar: true } },
        { nome: '8 · Mar longo e semi em ressonância', desc: 'Swell de 18 s perto do período natural', valores: { tipo: 'semi', lda: 1300, Hs: 4, Tp: 18, animar: true } }
      ],
      controles: [
        { id: 'tipo', tipo: 'select', label: 'Tipo de plataforma', valor: 'semi', opcoes: ops },
        { id: 'lda', label: 'Lâmina d’água (LDA)', min: 20, max: 3000, step: 10, valor: 1300, unidade: 'm' },
        { tipo: 'titulo', label: 'Estado de mar (JONSWAP)' },
        { id: 'Hs', label: 'Altura significativa Hs', min: 1, max: 14, step: 0.5, valor: 5, unidade: 'm' },
        { id: 'Tp', label: 'Período de pico Tp', min: 5, max: 20, step: 0.5, valor: 11, unidade: 's' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'cena', axes: false, height: 440, grid: false, legend: false },
        { id: 'rao', titulo: 'RAO de heave e o espectro do mar', xlabel: 'Período (s)', ylabel: 'RAO (m/m) · espectro normalizado',
          aspect: 0.50, legendPos: 'topright' },
        { id: 'faixas', titulo: 'Faixa de lâmina d’água de cada conceito', xlabel: 'Lâmina d’água (m)', ylabel: '',
          aspect: 0.42, legend: false }
      ],
      saidas: [
        { id: 'classe', label: 'Classe de lâmina d’água' },
        { id: 'Tn', label: 'Período natural em heave' },
        { id: 'K', label: 'Rigidez vertical' },
        { id: 'rao', label: 'RAO no período de pico' },
        { id: 'heave', label: 'Heave significativo' },
        { id: 'arvore', label: 'Árvore de natal' }
      ],
      formulas: [
        { g: 'Classificação da lâmina d’água' },
        { tex: '\\text{rasas} < 300\\ m \\quad \\text{profundas } 300\\text{ a }1500\\ m \\quad \\text{ultraprofundas} > 1500\\ m', d: 'convenção usada no Brasil', destaque: true },
        { g: 'Heave como sistema de 1 grau de liberdade' },
        { tex: 'T_n = 2\\pi\\sqrt{\\frac{M + A_{33}}{\\rho g A_{wp} + K_{tend}}}', d: 'massa + massa adicional sobre rigidez hidrostática + tendões', destaque: true },
        { tex: 'X_{est} = \\frac{\\rho g A_{wp}\\,e^{-k\\,z_c}\\,C_L}{K}\\,\\eta', d: 'resposta quase estática: a pressão da onda decai com a profundidade' },
        { tex: 'C_L = \\left|\\frac{\\sin(kL/2)}{kL/2}\\right|', d: 'casco longo: cristas e cavados se cancelam' },
        { tex: 'RAO = \\frac{X_{est}/\\eta}{\\sqrt{(1-r^2)^2 + (2\\zeta r)^2}}, \\quad r = \\frac{T_n}{T}', d: 'fator de amplificação dinâmica', destaque: true },
        { g: 'Resposta num mar irregular' },
        { tex: 'S(\\omega) = A_\\gamma\\,\\frac{5}{16}H_s^2\\omega_p^4\\,\\omega^{-5}\\,e^{-\\frac{5}{4}\\left(\\frac{\\omega}{\\omega_p}\\right)^{-4}}\\,\\gamma^{\\,r}', d: 'JONSWAP (DNV-RP-C205)' },
        { tex: 'H_{1/3}^{heave} = 4\\sqrt{\\int_0^\\infty |RAO(\\omega)|^2\\,S(\\omega)\\,d\\omega}', d: 'altura significativa da resposta', destaque: true },
        { tex: 'T_{onda} \\approx 5\\text{ a }20\\ s', d: 'fique longe dessa faixa: TLP abaixo (≈ 3 s), spar e semi acima (≈ 20 a 30 s)' }
      ],
      passos: [],
      nota: 'Parâmetros de massa, área de linha d’água e amortecimento são de unidades típicas de cada conceito; a resposta é um modelo de 1 grau de liberdade com decaimento exponencial da pressão e cancelamento ao longo do casco. As faixas de lâmina d’água são as usuais da indústria, não limites rígidos.',
      calcular: function (p, ctx) {
        var tipo = OFF.TIPOS[p.tipo];
        var h = OFF.heave(p.tipo);
        var rao = OFF.raoHeave(p.tipo, p.Tp);
        var resp = tipo.fixa ? { heaveSig: 0 } : OFF.respostaMar(p.tipo, p.Hs, p.Tp, 3.3);
        A.ctx = ctx; A.p = p; A.r = { h: h, rao: rao, resp: resp }; A.on = !!p.animar;
        desenha();

        var Ts = Plot.linspace(2, 35, 200);
        var g = ctx.plot('rao').clear();
        var Smax = OFF.jonswap(2 * Math.PI / p.Tp, p.Hs, p.Tp, 3.3);
        g.area(Ts, Ts.map(function (T) { return OFF.jonswap(2 * Math.PI / T, p.Hs, p.Tp, 3.3) / Smax; }),
               { color: Plot.serie(0), alpha: 0.18, label: 'espectro do mar (normalizado)' });
        ['semi', 'tlp', 'spar', 'fpso'].forEach(function (tp, j) {
          if (tp === p.tipo) return;
          g.line(Ts, Ts.map(function (T) { return Math.min(3, OFF.raoHeave(tp, T)); }),
                 { color: Plot.cssVar('--text-faint', '#999'), width: 1.1, dash: [3, 3] });
        });
        if (!tipo.fixa) {
          g.line(Ts, Ts.map(function (T) { return Math.min(3, OFF.raoHeave(p.tipo, T)); }),
                 { color: Plot.serie(6), width: 2.8, label: 'RAO · ' + tipo.nome });
          g.vline(h.Tn, { color: Plot.serie(6), width: 1.2, text: 'T_n = ' + sg(h.Tn, 3) + ' s' });
        }
        g.marker(p.Tp, Math.min(3, rao), 'Tp', { color: Plot.serie(6), r: 4.5 });
        g.setLimits([2, 35], [0, 1.6]);
        g.draw();

        var keys = Object.keys(OFF.TIPOS);
        var gf = ctx.plot('faixas').clear();
        keys.forEach(function (kk, j) {
          var tt = OFF.TIPOS[kk], y = keys.length - j;
          var dentro = p.lda >= tt.lda[0] && p.lda <= tt.lda[1];
          gf.line([tt.lda[0], tt.lda[1]], [y, y], { color: kk === p.tipo ? Plot.serie(6) : (dentro ? Plot.serie(2) : Plot.cssVar('--text-faint', '#999')), width: kk === p.tipo ? 9 : 6 });
          gf.text(tt.lda[1], y, '  ' + tt.nome, { size: 10, baseline: 'middle', color: kk === p.tipo ? Plot.serie(6) : undefined });
        });
        gf.vline(p.lda, { color: Plot.serie(0), width: 1.6, text: p.lda + ' m' });
        gf.vline(300, { color: Plot.cssVar('--text-faint', '#999'), width: 1, dash: [2, 4] });
        gf.vline(1500, { color: Plot.cssVar('--text-faint', '#999'), width: 1, dash: [2, 4] });
        gf.o.yticks = 0;
        gf.setLimits([0, 5600], [0.3, keys.length + 0.7]);
        gf.draw();

        var passos = [];
        if (tipo.fixa) {
          passos.push({ t: '① Plataforma fixa: resiste em vez de flutuar',
            tex: 'T_n^{estrutura} \\ll T_{onda} \\quad (' + nt(tipo.Tn) + '\\ s \\ll ' + nt(p.Tp) + '\\ s)',
            texSub: '\\text{faixa usual: } ' + tipo.lda[0] + '\\text{ a }' + tipo.lda[1] + '\\ m',
            obs: p.tipo === 'torre'
              ? 'A torre complacente é a exceção: é “fixa” no fundo mas flexível o bastante para ter período de ~30 s, acima das ondas — ela cede à onda em vez de resistir, e é isso que a deixa chegar a ~900 m.'
              : 'Uma estrutura fixa precisa ser rígida o bastante para que seu período natural fique bem abaixo do das ondas; senão entra em ressonância. Com a lâmina d’água, a estrutura fica mais alta e mais flexível, o período sobe e o aço necessário cresce muito rápido — é o que limita a jaqueta a algumas centenas de metros.' });
        } else {
          var t = tipo, kW = 2 * Math.PI / p.Tp;
          var k = OFF.numeroOnda(p.Tp, 3000);
          passos.push({ t: '① Período natural em heave',
            tex: 'T_n = 2\\pi\\sqrt{\\frac{M(1 + a)}{\\rho g A_{wp} + K_{tend}}}',
            texSub: 'T_n = 2\\pi\\sqrt{\\frac{' + nt(t.M) + '\\times' + nt(1 + t.Aa) + '}{1025\\times 9{,}81\\times ' + nt(t.Awp) + (t.K ? ' + ' + nt(t.K) : '') + '}} = ' + nt(h.Tn, 3) + '\\ s',
            obs: p.tipo === 'tlp'
              ? 'Os tendões somam uma rigidez ' + sg(t.K / h.Kh, 2) + ' vezes maior que a hidrostática: o período cai para ~3 s, abaixo das ondas. A TLP praticamente não sobe e desce — o que permite árvore de natal seca no convés.'
              : 'Área de linha d’água pequena (colunas finas, casco cilíndrico) dá rigidez hidrostática pequena e período longo. O navio, com ' + nt(t.Awp) + ' m² de linha d’água, fica com período bem mais curto, dentro da faixa das ondas.' });
          passos.push({ t: '② Resposta quase estática à onda',
            tex: '\\frac{X_{est}}{\\eta} = \\frac{\\rho g A_{wp}\\,e^{-k z_c}\\,C_L}{K}',
            texSub: 'k = ' + nt(k, 3) + '\\ m^{-1},\\ e^{-k z_c} = ' + nt(Math.exp(-k * t.prof), 3) + (t.Lx ? ',\\ C_L = ' + nt(Math.abs(Math.sin(k * t.Lx / 2) / (k * t.Lx / 2)), 3) : '') + ' \\;\\Rightarrow\\; X_{est}/\\eta = ' + nt(OFF.RHO * OFF.G * t.Awp * Math.exp(-k * t.prof) * (t.Lx ? Math.abs(Math.sin(k * t.Lx / 2) / (k * t.Lx / 2)) : 1) / h.K, 3),
            obs: 'Dois efeitos reduzem a força vertical da onda: a pressão dinâmica decai exponencialmente com a profundidade (a spar, com casco de ~150 m, quase não a sente) e, num casco longo, cristas e cavados empurram partes diferentes em sentidos opostos.' });
          passos.push({ t: '③ Amplificação dinâmica no período de pico',
            tex: 'RAO = \\frac{X_{est}/\\eta}{\\sqrt{(1 - r^2)^2 + (2\\zeta r)^2}}',
            texSub: 'r = \\frac{T_n}{T_p} = \\frac{' + nt(h.Tn, 3) + '}{' + nt(p.Tp) + '} = ' + nt(h.Tn / p.Tp, 3) + ' \\;\\Rightarrow\\; RAO = ' + nt(rao, 3) + '\\ m/m',
            obs: Math.abs(h.Tn / p.Tp - 1) < 0.25
              ? 'r perto de 1: ressonância. O único freio é o amortecimento ζ = ' + t.zeta + '. É por isso que swell longo (Tp de 16 a 20 s) é perigoso para semissubmersíveis.'
              : (h.Tn > p.Tp ? 'O período natural está acima do das ondas: a plataforma é “lenta” demais para acompanhar — responde pouco.' : 'O período natural está abaixo do das ondas: a plataforma acompanha a onda quase estaticamente, limitada pela rigidez.') });
          passos.push({ t: '④ Resposta num mar irregular',
            tex: 'H_{1/3}^{heave} = 4\\sqrt{\\int |RAO|^2 S(\\omega)\\,d\\omega}',
            texSub: 'H_s = ' + nt(p.Hs) + '\\ m,\\ T_p = ' + nt(p.Tp) + '\\ s \\;\\Rightarrow\\; H_{1/3}^{heave} = ' + nt(resp.heaveSig, 3) + '\\ m',
            obs: 'O mar real é a soma de ondas de muitos períodos. A resposta é o espectro do mar filtrado pela RAO ao quadrado — é por isso que no gráfico interessa onde a RAO é grande em relação ao espectro, não o valor num período só.' });
        }
        passos.push({ t: (tipo.fixa ? '②' : '⑤') + ' Escolha do conceito',
          tex: '\\text{LDA} = ' + p.lda + '\\ m \\;\\Rightarrow\\; \\text{' + classeLDA(p.lda) + '}',
          texSub: '\\text{faixa de ' + tipo.nome.replace(/[()]/g, '') + ': } ' + tipo.lda[0] + '\\text{ a }' + tipo.lda[1] + '\\ m',
          obs: 'A escolha junta lâmina d’água, necessidade de estocagem (sem oleoduto, só FPSO ou gravidade estocam), árvore seca ou molhada, estado de mar e distância da costa. Árvore seca (jaqueta, TLP, spar) facilita intervenção nos poços; árvore molhada (semi, FPSO) libera a plataforma para se mover mais.' });
        ctx.setPassos(passos);

        return {
          classe: { v: classeLDA(p.lda), u: '' },
          Tn: tipo.fixa ? { v: '—', u: 'fixa' } : { v: h.Tn, u: 's' },
          K: tipo.fixa ? { v: '—', u: '' } : { v: h.K / 1e6, u: 'MN/m' },
          rao: { v: rao, u: 'm/m' },
          heave: { v: resp.heaveSig, u: 'm', classe: resp.heaveSig > 3 ? 'alerta' : 'destaque' },
          arvore: { v: tipo.arvore, u: '' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Ondas de Airy
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-ondas')) return;
    var A = { ctx: null, p: null, o: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, o = A.o;
      if (!p || !o) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, i, j;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');

      /* janela: 1,5 comprimento de onda na horizontal; vertical até o fundo ou L/2 */
      var janX = 1.5 * o.L;
      var profVis = Math.min(p.d, 0.55 * o.L);
      var esc = Math.min(W * 0.96 / janX, H * 0.78 / (profVis + 1.3 * p.H));
      var xm = X0 + W * 0.02, ySup = Y0 + H * 0.16 + 0.6 * p.H * esc;
      function px(x) { return xm + x * esc; }
      function py(z) { return ySup - z * esc; }

      /* água */
      c.fillStyle = COR_MAR;
      c.beginPath(); c.moveTo(px(0), py(-profVis));
      for (i = 0; i <= 100; i++) { var x = janX * i / 100; c.lineTo(px(x), py(OFF.cinematica(o, x, 0, t).eta)); }
      c.lineTo(px(janX), py(-profVis)); c.closePath(); c.fill();
      c.strokeStyle = COR_MAR_LINHA; c.lineWidth = 2.4; c.beginPath();
      for (i = 0; i <= 100; i++) { x = janX * i / 100; var yy = py(OFF.cinematica(o, x, 0, t).eta); if (i) c.lineTo(px(x), yy); else c.moveTo(px(x), yy); }
      c.stroke();
      /* nível médio */
      c.strokeStyle = faint; c.setLineDash([4, 4]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(janX), py(0)); c.stroke(); c.setLineDash([]);

      if (p.d <= profVis + 1e-6) {
        c.fillStyle = COR_FUNDO; c.fillRect(px(0), py(-p.d), janX * esc, 8);
        c.strokeStyle = 'rgb(120,90,50)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(px(0), py(-p.d)); c.lineTo(px(janX), py(-p.d)); c.stroke();
      } else {
        c.fillStyle = faint; c.font = fonte(10); c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText('fundo a ' + sg(p.d, 3) + ' m — fora da janela: a onda não o sente', px(janX / 2), py(-profVis) + 4);
      }

      /* órbitas e partículas */
      var nx = 7, nz = 5;
      for (j = 0; j < nz; j++) {
        var z0 = -profVis * (j + 0.3) / nz;
        for (i = 0; i < nx; i++) {
          var x0 = janX * (i + 0.5) / nx;
          var cin = OFF.cinematica(o, x0, z0, t);
          var Ax = cin.A * esc, Bz = cin.B * esc;
          c.strokeStyle = faint; c.lineWidth = 0.8;
          if (Ax > 0.6) { c.beginPath(); c.ellipse(px(x0), py(z0), Ax, Math.max(0.3, Bz), 0, 0, TAU); c.stroke(); }
          /* posição da partícula na órbita */
          var fase = o.k * x0 - o.w * t;
          var xp = px(x0) + Ax * Math.sin(fase), zp = py(z0) - Bz * Math.cos(fase);
          c.fillStyle = Plot.serie(3);
          c.beginPath(); c.arc(xp, zp, 3, 0, TAU); c.fill();
        }
      }
      /* velocidade sob a crista e sob o cavado */
      var xc = ((o.w * t / o.k) % o.L + o.L) % o.L;       /* crista: fase = 0 */
      [[xc, 'crista'], [(xc + o.L / 2) % o.L, 'cavado']].forEach(function (pc) {
        if (pc[0] > janX) return;
        for (var jj = 0; jj < 6; jj++) {
          var zz = -profVis * jj / 6;
          var u = OFF.cinematica(o, pc[0], zz, t).u;
          var L = Math.max(-40, Math.min(40, u / Math.max(0.05, o.uMax) * 36));
          seta(c, px(pc[0]), py(zz) + 2, px(pc[0]) + L, py(zz) + 2, Plot.serie(6), 1.8, 6);
        }
        c.fillStyle = Plot.serie(6); c.font = fonte(9.5, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText(pc[1], px(pc[0]), py(OFF.cinematica(o, pc[0], 0, t).eta) - 6);
      });

      /* cota do comprimento de onda */
      var yL = Y0 + 10;
      c.strokeStyle = cor; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(px(0), yL); c.lineTo(px(o.L), yL); c.stroke();
      c.beginPath(); c.moveTo(px(0), yL - 5); c.lineTo(px(0), yL + 5); c.moveTo(px(o.L), yL - 5); c.lineTo(px(o.L), yL + 5); c.stroke();
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('L = ' + sg(o.L, 3) + ' m', px(o.L / 2), yL + 3);
      c.textAlign = 'right'; c.font = fonte(10.5, '700'); c.fillStyle = cor;
      c.fillText('águas ' + o.regime + '  ·  d/L = ' + sg(p.d / o.L, 2), X0 + W - 4, yL + 3);
      c.font = fonte(9.5); c.fillStyle = faint;
      c.fillText('órbitas ' + (o.regime === 'profundas' ? 'circulares, somem com a profundidade' : (o.regime === 'rasas' ? 'achatadas: vaivém horizontal até o fundo' : 'elípticas')), X0 + W - 4, yL + 18);
      if (o.quebra) {
        c.fillStyle = Plot.serie(6); c.font = fonte(11, '700');
        c.fillText('⚠ H/L acima do limite de Miche: a onda quebra', X0 + W - 4, yL + 33);
      }
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

    Sim.build('#sim-ondas', {
      titulo: 'Ondas lineares (Airy) — comprimento, órbitas e energia',
      descricao: 'Numa onda, a água não viaja: cada partícula gira numa órbita e volta ao lugar. O que viaja é a energia. A relação de dispersão liga período, profundidade e comprimento — e decide se o fundo “sente” a onda.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Mar aberto', desc: 'Águas profundas', valores: { H: 4, T: 9, d: 1500, animar: true } },
        { nome: '2 · Swell chegando à costa', desc: 'Águas intermediárias', valores: { H: 2, T: 14, d: 40, animar: true } },
        { nome: '3 · Onda na praia', desc: 'Águas rasas: órbitas achatadas', valores: { H: 1, T: 10, d: 3, animar: true } },
        { nome: '4 · Onda centenária de projeto', desc: 'Bacia de Campos', valores: { H: 15, T: 14, d: 1000, animar: true } },
        { nome: '5 · Onda íngreme demais', desc: 'Passa do limite de quebra', valores: { H: 12, T: 6, d: 500, animar: true } }
      ],
      controles: [
        { id: 'H', label: 'Altura da onda H', min: 0.5, max: 25, step: 0.1, valor: 4, unidade: 'm' },
        { id: 'T', label: 'Período T', min: 3, max: 20, step: 0.1, valor: 9, unidade: 's' },
        { id: 'd', label: 'Profundidade d', min: 1, max: 3000, step: 1, valor: 1500, unidade: 'm' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'canal', axes: false, height: 380, grid: false, legend: false },
        { id: 'vel', titulo: 'Velocidade orbital máxima ao longo da profundidade', xlabel: 'Velocidade (m/s)', ylabel: 'z (m)',
          aspect: 0.50, legendPos: 'bottomright' },
        { id: 'disp', titulo: 'Comprimento de onda x profundidade (este período)', xlabel: 'Profundidade d (m)', ylabel: 'L (m)',
          aspect: 0.42, xlog: true, legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'L', label: 'Comprimento de onda' },
        { id: 'c', label: 'Celeridade' },
        { id: 'cg', label: 'Velocidade de grupo' },
        { id: 'regime', label: 'Regime' },
        { id: 'u', label: 'Velocidade na superfície' },
        { id: 'E', label: 'Energia por m²' },
        { id: 'P', label: 'Potência por m de crista' },
        { id: 'est', label: 'Esbeltez H/L' }
      ],
      formulas: [
        { g: 'Dispersão' },
        { tex: '\\omega^2 = g\\,k\\,\\tanh(k d), \\quad k = \\frac{2\\pi}{L},\\ \\omega = \\frac{2\\pi}{T}', d: 'implícita em L: resolve-se por iteração', destaque: true },
        { tex: 'L_0 = \\frac{g T^2}{2\\pi} \\approx 1{,}56\\,T^2', d: 'águas profundas (d/L > 1/2)' },
        { tex: 'c = \\sqrt{g d}', d: 'águas rasas (d/L < 1/20): toda onda anda igual' },
        { tex: 'L \\approx L_0\\left[\\tanh\\left(\\left(2\\pi\\sqrt{d/g}/T\\right)^{3/2}\\right)\\right]^{2/3}', d: 'Fenton-McKee: explícita, erro < 2 %' },
        { g: 'Cinemática' },
        { tex: 'u = \\frac{H}{2}\\,\\omega\\,\\frac{\\cosh k(z+d)}{\\sinh kd}\\cos(kx - \\omega t)', d: 'velocidade horizontal', destaque: true },
        { tex: 'a_x = \\frac{H}{2}\\,\\omega^2\\,\\frac{\\cosh k(z+d)}{\\sinh kd}\\sin(kx - \\omega t)', d: 'aceleração — defasada 90° da velocidade' },
        { g: 'Energia' },
        { tex: 'E = \\frac{1}{8}\\rho g H^2', d: 'J/m² — cresce com o quadrado da altura', destaque: true },
        { tex: 'P = E\\,c_g, \\quad c_g = \\frac{c}{2}\\left(1 + \\frac{2kd}{\\sinh 2kd}\\right)', d: 'a energia anda com o grupo, não com a crista' },
        { tex: '\\frac{H}{L} \\leq 0{,}142\\tanh(kd)', d: 'limite de quebra de Miche' }
      ],
      passos: [],
      nota: 'Teoria linear (amplitude pequena). Para ondas íngremes de projeto, a norma pede teorias não lineares (Stokes de 5ª ordem, função de corrente), que dão cristas mais altas e cavados mais rasos.',
      calcular: function (p, ctx) {
        var o = OFF.onda(p.H, p.T, p.d);
        A.ctx = ctx; A.p = p; A.o = o; A.on = !!p.animar;
        desenha();

        var zs = Plot.linspace(-Math.min(p.d, o.L), 0, 80);
        var g = ctx.plot('vel').clear();
        g.line(zs.map(function (z) { return OFF.cinematica(o, 0, z, 0).u; }), zs, { color: Plot.serie(6), width: 2.6, label: 'u máx (horizontal)' });
        g.line(zs.map(function (z) { return OFF.cinematica(o, 0, z, -o.T / 4).wv; }), zs, { color: Plot.serie(0), width: 2.2, label: 'w máx (vertical)' });
        g.hline(-o.L / 2, { color: Plot.cssVar('--text-faint', '#999'), width: 1, text: 'z = −L/2' });
        g.draw();

        var ds = [], Ls = [];
        for (var e = 0; e <= 3.5; e += 0.05) { var dd = Math.pow(10, e); ds.push(e); Ls.push(OFF.onda(1, p.T, dd).L); }
        var gd = ctx.plot('disp').clear();
        gd.line(ds, Ls, { color: Plot.serie(0), width: 2.6, label: 'teoria linear' });
        gd.line(ds, ds.map(function (e2) { return Math.sqrt(9.81 * Math.pow(10, e2)) * p.T; }), { color: Plot.serie(3), width: 1.4, dash: [4, 3], label: 'rasas: L = T√(gd)' });
        gd.hline(o.L0, { color: Plot.serie(2), width: 1.4, text: 'profundas: L₀ = ' + sg(o.L0, 3) + ' m' });
        gd.marker(Math.log10(p.d), o.L, 'd = ' + sg(p.d, 3) + ' m', { color: Plot.serie(6), r: 5 });
        gd.setLimits([0, 3.5], [0, o.L0 * 1.15]);
        gd.draw();

        /* iterações de Newton, para mostrar */
        var w = 2 * Math.PI / p.T, k = w * w / 9.81, it = [k];
        for (var i = 0; i < 4; i++) {
          var th = Math.tanh(k * p.d);
          k -= (9.81 * k * th - w * w) / (9.81 * th + 9.81 * k * p.d * (1 - th * th));
          it.push(k);
        }
        var cs = OFF.cinematica(o, 0, 0, 0), cb = OFF.cinematica(o, 0, -p.d, 0);
        ctx.setPassos([
          { t: '① Relação de dispersão, por Newton',
            tex: 'f(k) = g k \\tanh(kd) - \\omega^2 = 0, \\qquad k_{n+1} = k_n - \\frac{f(k_n)}{f\'(k_n)}',
            texSub: '\\omega = \\frac{2\\pi}{' + nt(p.T) + '} = ' + nt(w, 4) + ' \\;\\Rightarrow\\; k: ' + it.map(function (v) { return nt(v, 5); }).join(' \\to ') + '\\ m^{-1}',
            obs: 'Começa-se pelo valor de águas profundas, k₀ = ω²/g, e três ou quatro iterações bastam. A equação é implícita porque a velocidade da onda depende do próprio comprimento de onda quando o fundo interfere.' },
          { t: '② Comprimento e celeridade',
            tex: 'L = \\frac{2\\pi}{k}, \\qquad c = \\frac{L}{T}',
            texSub: 'L = \\frac{2\\pi}{' + nt(o.k, 4) + '} = ' + nt(o.L, 4) + '\\ m \\qquad c = ' + nt(o.c, 3) + '\\ m/s \\qquad L_0 = ' + nt(o.L0, 4) + '\\ m',
            obs: 'd/L = ' + sg(p.d / o.L, 2) + ': águas ' + o.regime + '. ' + (o.regime === 'profundas' ? 'O fundo não influencia e L = L₀.' : 'O fundo freia a onda: ela fica mais curta e mais lenta que em águas profundas — é por isso que as ondas “giram” para ficar paralelas à praia (refração).') },
          { t: '③ Órbitas: na superfície e no fundo',
            tex: 'A = \\frac{H}{2}\\frac{\\cosh k(z+d)}{\\sinh kd}, \\qquad B = \\frac{H}{2}\\frac{\\sinh k(z+d)}{\\sinh kd}',
            texSub: '\\text{superfície: } A = ' + nt(cs.A, 3) + ',\\ B = ' + nt(cs.B, 3) + '\\ m \\qquad \\text{fundo: } A = ' + nt(cb.A, 3) + ',\\ B = 0',
            obs: 'Em águas profundas as órbitas são círculos que encolhem pela metade a cada ~L/9 de profundidade: a L/2 abaixo da superfície o movimento já é 4 % do da superfície. Por isso o fundo de uma plataforma em 1 000 m de lâmina está parado — mas as colunas perto da superfície levam a pancada inteira.' },
          { t: '④ Energia e potência',
            tex: 'E = \\frac{\\rho g H^2}{8}, \\qquad P = E\\,c_g',
            texSub: 'E = \\frac{1025\\times9{,}81\\times' + nt(p.H) + '^2}{8} = ' + nt(o.E / 1e3, 4) + '\\ kJ/m^2 \\qquad P = ' + nt(o.P / 1e3, 4) + '\\ kW/m',
            obs: 'A energia cresce com H²: dobrar a altura quadruplica a energia e a carga. Um trecho de mar de 1 km de crista com essa onda transporta ' + sg(o.P, 3) + ' MW — é o recurso que os conversores de energia das ondas tentam aproveitar.' },
          { t: '⑤ A onda se sustenta?',
            tex: '\\frac{H}{L} \\leq 0{,}142\\,\\tanh(kd)',
            texSub: '\\frac{H}{L} = ' + nt(o.esbeltez, 3) + ' \\quad\\text{limite} = ' + nt(0.142 * Math.tanh(o.kd), 3),
            obs: o.quebra ? 'Acima do limite: a crista fica mais rápida que a própria onda e desaba. Essa onda não existe como onda estável.' : 'Dentro do limite. Ondas de tempestade em mar aberto raramente passam de H/L ≈ 1/10.' }
        ]);

        return {
          L: { v: o.L, u: 'm', classe: 'destaque' },
          c: { v: o.c, u: 'm/s' },
          cg: { v: o.cg, u: 'm/s' },
          regime: { v: o.regime, u: '' },
          u: { v: o.uMax, u: 'm/s' },
          E: { v: o.E / 1e3, u: 'kJ/m²' },
          P: { v: o.P / 1e3, u: 'kW/m' },
          est: { v: o.esbeltez, u: o.quebra ? 'quebra' : '', classe: o.quebra ? 'alerta' : '' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Equação de Morison
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-morison')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, i;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var o = r.onda, tt = A.t % p.T;
      var inst = OFF.morison(Object.assign({ n: 30 }, p), tt, true);

      var altura = p.d + 0.8 * p.H + 6;
      var esc = H * 0.86 / altura;
      var xC = X0 + W * 0.30;
      var ySup = Y0 + H * 0.06 + (0.6 * p.H + 6) * esc;
      function py(z) { return ySup - z * esc; }
      var Dpx = Math.max(6, Math.min(W * 0.10, p.D * esc));
      var janX = W * 0.62;
      /* horizontal: a onda é desenhada com seu comprimento real na mesma escala, se couber */
      var escX = Math.min(esc, janX / (1.2 * o.L));

      /* água com a onda passando */
      c.fillStyle = COR_MAR;
      c.beginPath(); c.moveTo(X0, py(-p.d));
      for (i = 0; i <= 90; i++) {
        var xs = X0 + janX * i / 90;
        var xm = (xs - xC) / escX;
        c.lineTo(xs, py(OFF.cinematica(o, xm, 0, tt).eta));
      }
      c.lineTo(X0 + janX, py(-p.d)); c.closePath(); c.fill();
      c.strokeStyle = COR_MAR_LINHA; c.lineWidth = 2.2; c.beginPath();
      for (i = 0; i <= 90; i++) {
        xs = X0 + janX * i / 90; xm = (xs - xC) / escX;
        var yv = py(OFF.cinematica(o, xm, 0, tt).eta);
        if (i) c.lineTo(xs, yv); else c.moveTo(xs, yv);
      }
      c.stroke();
      c.fillStyle = COR_FUNDO; c.fillRect(X0, py(-p.d), janX, 10);

      /* corrente */
      if (p.U > 0.01) {
        for (i = 0; i < 4; i++) {
          var ycorr = py(-p.d * (0.2 + 0.2 * i));
          var xa = X0 + ((A.t * 40 * p.U + i * 37) % (janX * 0.25));
          seta(c, xa, ycorr, xa + 16 + 10 * p.U, ycorr, 'rgba(60,140,220,0.7)', 1.6, 6);
        }
      }

      /* cilindro */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.fillRect(xC - Dpx / 2, py(0.8 * p.H + 4), Dpx, (0.8 * p.H + 4 + p.d) * esc);
      c.strokeRect(xC - Dpx / 2, py(0.8 * p.H + 4), Dpx, (0.8 * p.H + 4 + p.d) * esc);

      /* distribuição de força ao longo da altura (setas proporcionais) */
      var fmax = 1e-9;
      r.perfilMax.forEach(function (q) { fmax = Math.max(fmax, Math.abs(q.f)); });
      inst.perfil.forEach(function (q) {
        var Lf = q.f / fmax * W * 0.16;
        seta(c, xC + Dpx / 2 + 2, py(q.z), xC + Dpx / 2 + 2 + Lf, py(q.z),
             q.f >= 0 ? Plot.serie(6) : Plot.serie(0), 2, 6);
      });
      /* resultante na base (cisalhamento) */
      var Lr = inst.F / Math.abs(r.Fmax) * W * 0.14;
      seta(c, xC, py(-p.d) + 16, xC + Lr, py(-p.d) + 16, Plot.serie(3), 3.2, 10);
      c.fillStyle = Plot.serie(3); c.font = fonte(10.5, '700'); c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('F = ' + sg(inst.F / 1e3, 3) + ' kN', xC + Math.max(0, Lr) + 6, py(-p.d) + 10);

      /* painel */
      var lx = X0 + W * 0.66, ly = Y0 + 4;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700');
      c.fillText('Força de onda no cilindro', lx, ly);
      c.font = fonte(10.5);
      var linhas = [
        ['t/T', sg(tt / p.T, 2)],
        ['arrasto', sg(inst.Fd / 1e3, 3) + ' kN'],
        ['inércia', sg(inst.Fi / 1e3, 3) + ' kN'],
        ['total', sg(inst.F / 1e3, 3) + ' kN'],
        ['momento na base', sg(inst.M / 1e6, 3) + ' MN·m'],
        ['KC', sg(r.KC, 3)],
        ['D/L', sg(r.D_L, 2)]
      ];
      linhas.forEach(function (ln, j) {
        c.fillStyle = faint; c.fillText(ln[0], lx, ly + 22 + j * 17);
        c.fillStyle = cor; c.fillText(ln[1], lx + W * 0.19, ly + 22 + j * 17);
      });
      var yy = ly + 22 + linhas.length * 17 + 6;
      c.font = fonte(10.5, '700');
      if (r.D_L > 0.2) { c.fillStyle = Plot.serie(6); c.fillText('⚠ D/L > 0,2: difração', lx, yy); c.font = fonte(10); c.fillText('Morison deixa de valer', lx, yy + 14); }
      else if (r.KC < 5) { c.fillStyle = Plot.serie(0); c.fillText('KC < 5: inércia domina', lx, yy); }
      else if (r.KC > 25) { c.fillStyle = Plot.serie(6); c.fillText('KC > 25: arrasto domina', lx, yy); }
      else { c.fillStyle = Plot.serie(3); c.fillText('5 < KC < 25: os dois contam', lx, yy); }
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('cil');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.p) return;
      A.t += dt * Math.max(1, A.p.T / 8);
      desenha();
      var g = A.ctx.plot('forca');
      if (g && g._area) {
        g.draw();
        var tt = (A.t % A.p.T) / A.p.T, gc = g.ctx, X = g.px(tt);
        gc.save(); gc.strokeStyle = Plot.serie(7); gc.lineWidth = 1.5; gc.setLineDash([3, 3]);
        gc.beginPath(); gc.moveTo(X, g._area.y); gc.lineTo(X, g._area.y + g._area.h); gc.stroke(); gc.restore();
      }
    });

    Sim.build('#sim-morison', {
      titulo: 'Equação de Morison — onda e corrente numa perna de jaqueta',
      descricao: 'Para um membro esbelto, a força da onda é a soma de duas parcelas defasadas 90°: arrasto, proporcional ao quadrado da velocidade, e inércia, proporcional à aceleração. Qual domina depende do número de Keulegan-Carpenter.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Perna de jaqueta em tempestade', desc: 'KC alto: arrasto relevante', valores: { D: 1.5, d: 80, H: 12, T: 12, Cd: 1.0, Cm: 2.0, U: 0.5, animar: true } },
        { nome: '2 · Monoestaca eólica', desc: 'KC baixo: inércia domina', valores: { D: 6, d: 30, H: 6, T: 9, Cd: 0.7, Cm: 2.0, U: 0.5, animar: true } },
        { nome: '3 · Coluna grossa: difração', desc: 'D/L > 0,2 — fora da validade', valores: { D: 12, d: 40, H: 3, T: 5, Cd: 0.7, Cm: 2.0, U: 0, animar: true } },
        { nome: '4 · Condutor com corrente forte', desc: 'Corrente soma no arrasto', valores: { D: 0.8, d: 150, H: 8, T: 11, Cd: 1.0, Cm: 1.8, U: 1.5, animar: true } },
        { nome: '5 · Crescimento marinho', desc: 'D e Cd maiores pela incrustação', valores: { D: 1.7, d: 80, H: 12, T: 12, Cd: 1.2, Cm: 1.8, U: 0.5, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Estrutura' },
        { id: 'D', label: 'Diâmetro do membro D', min: 0.3, max: 14, step: 0.1, valor: 1.5, unidade: 'm' },
        { id: 'd', label: 'Lâmina d’água d', min: 10, max: 250, step: 1, valor: 80, unidade: 'm' },
        { id: 'Cd', label: 'Coeficiente de arrasto C_D', min: 0.5, max: 1.4, step: 0.05, valor: 1.0, unidade: '',
          desc: 'liso 0,65 · rugoso ou com incrustação 1,05 (DNV-RP-C205)' },
        { id: 'Cm', label: 'Coeficiente de inércia C_M', min: 1.2, max: 2.0, step: 0.05, valor: 2.0, unidade: '' },
        { tipo: 'titulo', label: 'Mar' },
        { id: 'H', label: 'Altura da onda H', min: 1, max: 30, step: 0.5, valor: 12, unidade: 'm' },
        { id: 'T', label: 'Período T', min: 4, max: 20, step: 0.5, valor: 12, unidade: 's' },
        { id: 'U', label: 'Corrente U', min: 0, max: 2.5, step: 0.05, valor: 0.5, unidade: 'm/s' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'cil', axes: false, height: 400, grid: false, legend: false },
        { id: 'forca', titulo: 'Força horizontal na base ao longo de um período', xlabel: 't/T', ylabel: 'Força (kN)',
          aspect: 0.46, legendPos: 'topright' },
        { id: 'dist', titulo: 'Força por metro no instante de força máxima', xlabel: 'Força (kN/m)', ylabel: 'z (m)',
          aspect: 0.50, legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'L', label: 'Comprimento de onda' },
        { id: 'KC', label: 'Keulegan-Carpenter' },
        { id: 'DL', label: 'D/L' },
        { id: 'F', label: 'Força máxima na base' },
        { id: 'M', label: 'Momento máximo na base' },
        { id: 'braco', label: 'Braço da resultante' },
        { id: 'dom', label: 'Parcela dominante' }
      ],
      formulas: [
        { g: 'Morison (força por unidade de comprimento)' },
        { tex: 'f = \\underbrace{\\tfrac{1}{2}\\rho\\,C_D\\,D\\,|u|\\,u}_{arrasto} + \\underbrace{\\rho\\,C_M\\,\\tfrac{\\pi D^2}{4}\\,\\dot u}_{inércia}', d: 'u inclui a corrente', destaque: true },
        { tex: 'F = \\int_{-d}^{\\eta} f\\,dz, \\qquad M = \\int_{-d}^{\\eta} f\\,(z + d)\\,dz', d: 'cisalhamento e momento na base' },
        { g: 'Formas fechadas (sem corrente, até o nível médio)' },
        { tex: 'F_{I,máx} = \\rho\\,C_M\\,\\frac{\\pi D^2}{4}\\,g\\,\\frac{H}{2}\\tanh(kd)', d: 'confere o cálculo numérico' },
        { tex: 'F_{D,máx} = \\frac{\\rho C_D D}{2}\\left(\\frac{H\\omega}{2\\sinh kd}\\right)^2\\left[\\frac{\\sinh 2kd}{4k} + \\frac{d}{2}\\right]' },
        { g: 'Regimes' },
        { tex: 'KC = \\frac{u_{máx}\\,T}{D}', d: 'Keulegan-Carpenter', destaque: true },
        { tex: 'KC < 5:\\ \\text{inércia} \\qquad KC > 25:\\ \\text{arrasto}' },
        { tex: '\\frac{D}{L} > 0{,}2 \\;\\Rightarrow\\; \\text{difração (MacCamy-Fuchs, potencial)}', d: 'o corpo altera a onda: Morison deixa de valer' },
        { g: 'Esticamento de Wheeler' },
        { tex: 'z\' = d\\,\\frac{z - \\eta}{d + \\eta}', d: 'leva a cinemática da superfície instantânea ao nível médio' }
      ],
      passos: [],
      nota: 'Teoria linear de Airy com esticamento de Wheeler; a corrente é uniforme e somada vetorialmente à velocidade da onda. Para projeto, a norma (DNV-RP-C205, API RP 2A) usa teoria de onda não linear, fator de bloqueio da corrente e coeficientes que dependem de KC e da rugosidade.',
      calcular: function (p, ctx) {
        var r = OFF.morisonCiclo(p);
        var tMax = r.tFmax;
        var instMax = OFF.morison(Object.assign({ n: 30 }, p), tMax, true);
        r.perfilMax = instMax.perfil;
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var ts = r.serie.map(function (q) { return q.t / p.T; });
        var g = ctx.plot('forca').clear();
        g.line(ts, r.serie.map(function (q) { return q.Fd / 1e3; }), { color: Plot.serie(0), width: 2, label: 'arrasto' });
        g.line(ts, r.serie.map(function (q) { return q.Fi / 1e3; }), { color: Plot.serie(2), width: 2, label: 'inércia' });
        g.line(ts, r.serie.map(function (q) { return q.F / 1e3; }), { color: Plot.serie(3), width: 3, label: 'total' });
        g.hline(0, { color: Plot.cssVar('--text-faint', '#999'), width: 1, dash: [] });
        g.marker(tMax / p.T, r.Fmax / 1e3, 'máx ' + sg(r.Fmax / 1e3, 3) + ' kN', { color: Plot.serie(3), r: 5 });
        g.draw();

        var gd = ctx.plot('dist').clear();
        var zs = instMax.perfil.map(function (q) { return q.z; });
        gd.line(instMax.perfil.map(function (q) { return q.f / 1e3; }), zs, { color: Plot.serie(3), width: 2.6, label: 'f(z) em t = ' + sg(tMax / p.T, 2) + ' T' });
        gd.vline(0, { color: Plot.cssVar('--text-faint', '#999'), width: 1, dash: [] });
        gd.hline(-p.d + r.braco, { color: Plot.serie(6), width: 1.3, text: 'resultante a ' + sg(r.braco, 3) + ' m do fundo' });
        gd.draw();

        var o = r.onda;
        var dom = Math.abs(instMax.Fd) > Math.abs(instMax.Fi) ? 'arrasto' : 'inércia';
        ctx.setPassos([
          { t: '① A onda nesta lâmina d’água',
            tex: '\\omega^2 = g k \\tanh(kd)',
            texSub: 'k = ' + nt(o.k, 4) + '\\ m^{-1} \\;\\Rightarrow\\; L = ' + nt(o.L, 4) + '\\ m,\\ kd = ' + nt(o.kd, 3) + '\\ (\\text{águas ' + o.regime + '})',
            obs: 'Tudo em Morison depende da cinemática da onda na posição do membro, e ela depende de kd. Em águas rasas a velocidade não decai com a profundidade, e a perna inteira recebe carga.' },
          { t: '② Validade: o membro é esbelto?',
            tex: '\\frac{D}{L} < 0{,}2',
            texSub: '\\frac{D}{L} = \\frac{' + nt(p.D) + '}{' + nt(o.L, 4) + '} = ' + nt(r.D_L, 3),
            obs: r.D_L > 0.2 ? 'Não é: o corpo é grande o bastante para espalhar a onda. O resultado abaixo é só indicativo — o correto é teoria de difração (MacCamy-Fuchs ou painéis).' : 'É esbelto: a onda passa pelo cilindro sem ser alterada, e Morison se aplica.' },
          { t: '③ Número de Keulegan-Carpenter',
            tex: 'KC = \\frac{(u_{máx} + U)\\,T}{D}',
            texSub: 'KC = \\frac{(' + nt(o.uMax, 3) + ' + ' + nt(p.U) + ')\\times' + nt(p.T) + '}{' + nt(p.D) + '} = ' + nt(r.KC, 3),
            obs: 'KC compara a distância que a água percorre num meio ciclo com o diâmetro. Se ela anda pouco (KC pequeno), não chega a formar esteira e a força é de aceleração — inércia. Se anda muito, forma vórtices e a força é de arrasto.' },
          { t: '④ Força máxima: inércia pela forma fechada',
            tex: 'F_{I,máx} = \\rho\\,C_M\\,\\frac{\\pi D^2}{4}\\,g\\,\\frac{H}{2}\\tanh(kd)',
            texSub: 'F_{I} = 1025\\times' + nt(p.Cm) + '\\times' + nt(Math.PI * p.D * p.D / 4, 3) + '\\times9{,}81\\times' + nt(p.H / 2) + '\\times' + nt(Math.tanh(o.kd), 3) + ' = ' + nt(r.Fi0 / 1e3, 4) + '\\ kN',
            obs: 'Integrando a aceleração de Airy de −d até o nível médio o cosh(k(z+d)) some com o sinh(kd) e sobra tanh(kd). Serve para conferir o cálculo numérico — que aqui usa Wheeler e vai até a superfície instantânea, por isso dá um pouco mais.' },
          { t: '⑤ Resultado ao longo do ciclo',
            tex: 'F(t) = \\int_{-d}^{\\eta} \\left(f_D + f_I\\right) dz',
            texSub: 'F_{máx} = ' + nt(r.Fmax / 1e3, 4) + '\\ kN \\quad M_{máx} = ' + nt(r.Mmax / 1e6, 4) + '\\ MN\\cdot m \\quad \\text{braço} = ' + nt(r.braco, 3) + '\\ m',
            obs: 'Arrasto e inércia estão defasados 90°: o arrasto é máximo sob a crista (velocidade máxima), a inércia um quarto de período antes. O máximo do total cai entre os dois. O braço alto mostra por que a carga perto da superfície manda no momento de tombamento da jaqueta.' }
        ]);

        return {
          L: { v: o.L, u: 'm' },
          KC: { v: r.KC, u: '' },
          DL: { v: r.D_L, u: '', classe: r.D_L > 0.2 ? 'alerta' : '' },
          F: { v: Math.abs(r.Fmax) / 1e3, u: 'kN', classe: 'destaque' },
          M: { v: Math.abs(r.Mmax) / 1e6, u: 'MN·m' },
          braco: { v: r.braco, u: 'm do fundo' },
          dom: { v: dom, u: '' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Sistema de ancoragem
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-ancoragem')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    /* pontos (x, z) da linha do fairlead até a âncora, em metros; x a partir do fairlead */
    function forma(c0, p, sentido) {
      var pts = [], i;
      if (p.tipo === 'taut') {
        return [[0, p.h], [sentido * c0.l * Math.cos(c0.ang * Math.PI / 180), 0]];
      }
      var a = c0.a, xs = c0.x;
      for (i = 0; i <= 40; i++) {
        var xi = xs * (1 - i / 40);                      /* do fairlead ao ponto de toque */
        var z = a * (Math.cosh(xi / a) - 1);
        pts.push([sentido * (xs - xi), z]);
      }
      pts.push([sentido * (xs + Math.max(0, c0.apoiado)), 0]);
      return pts;
    }

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, i;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');

      var raio = p.raio;
      var alcance = raio * 1.12 + Math.abs(r.delta);
      var escX = W * 0.46 / alcance;
      var escZ = H * 0.62 / p.h;
      var xC = X0 + W * 0.50;
      var ySup = Y0 + H * 0.22, yFun = ySup + p.h * escZ;
      /* a plataforma oscila em torno do deslocamento médio (deriva lenta) */
      var osc = r.delta * (1 + 0.25 * Math.sin(TAU * t / 14));
      var xp = xC + osc * escX;

      c.fillStyle = COR_MAR; c.fillRect(X0, ySup, W, yFun - ySup);
      c.strokeStyle = COR_MAR_LINHA; c.lineWidth = 2;
      c.beginPath();
      for (i = 0; i <= 60; i++) { var xx = X0 + W * i / 60; var yv = ySup + 2.5 * Math.sin(i * 0.9 - t * 1.4); if (i) c.lineTo(xx, yv); else c.moveTo(xx, yv); }
      c.stroke();
      c.fillStyle = COR_FUNDO; c.fillRect(X0, yFun, W, 10);

      /* linhas: barlavento (âncora do lado para onde a plataforma é empurrada = direita?) */
      function desenhaLinha(sentido, estado, corL) {
        var pts = forma(estado, p, sentido);
        c.strokeStyle = corL; c.lineWidth = 2.2; c.beginPath();
        pts.forEach(function (q, j) {
          var X = xp + q[0] * escX, Y = yFun - q[1] * escZ;
          if (j) c.lineTo(X, Y); else c.moveTo(X, Y);
        });
        c.stroke();
        var ult = pts[pts.length - 1];
        var xa = xp + ult[0] * escX;
        c.fillStyle = corL; c.beginPath();
        c.moveTo(xa - 7 * sentido, yFun); c.lineTo(xa + 5 * sentido, yFun - 7); c.lineTo(xa + 5 * sentido, yFun + 4); c.closePath(); c.fill();
        if (p.tipo !== 'taut' && estado.x !== undefined) {
          var xt = xp + sentido * estado.x * escX;
          c.fillStyle = Plot.serie(3);
          c.beginPath(); c.arc(xt, yFun, 3.5, 0, TAU); c.fill();
        }
        return xa;
      }
      /* força ambiental empurra para +x: a linha da esquerda (âncora em −x) é a mais tracionada */
      var xaB = desenhaLinha(-1, r.barl, Plot.serie(6));
      var xaS = desenhaLinha(1, r.sotav, Plot.serie(0));

      /* plataforma semissubmersível */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.fillRect(xp - 34, ySup + 12, 68, 8); c.strokeRect(xp - 34, ySup + 12, 68, 8);
      [-26, 26].forEach(function (dx) { c.fillRect(xp + dx - 5, ySup - 16, 10, 30); c.strokeRect(xp + dx - 5, ySup - 16, 10, 30); });
      c.fillRect(xp - 38, ySup - 28, 76, 12); c.strokeRect(xp - 38, ySup - 28, 76, 12);
      /* posição neutra */
      c.strokeStyle = faint; c.setLineDash([3, 3]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(xC, ySup - 40); c.lineTo(xC, yFun); c.stroke(); c.setLineDash([]);
      /* força ambiental */
      if (p.Fenv > 0) {
        var Lf = Math.min(W * 0.16, 20 + p.Fenv / 1e6 * 10);
        seta(c, xp - 60 - Lf, ySup - 24, xp - 44, ySup - 24, Plot.serie(3), 3, 10);
        c.fillStyle = Plot.serie(3); c.font = fonte(10.5, '700'); c.textAlign = 'right'; c.textBaseline = 'bottom';
        c.fillText('vento + onda + corrente ' + sg(p.Fenv / 1e3, 3) + ' kN', xp - 50, ySup - 30);
      }
      /* cota do offset */
      c.strokeStyle = Plot.serie(3); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(xC, ySup - 44); c.lineTo(xp, ySup - 44); c.stroke();
      c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('offset ' + sg(r.delta, 3) + ' m (' + sg(r.offset, 2) + ' % LDA)', xC + (xp - xC) / 2, Y0 + 12);

      /* LDA e raio */
      c.fillStyle = faint; c.font = fonte(10); c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('LDA ' + p.h + ' m', X0 + 4, (ySup + yFun) / 2);
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('raio de ancoragem ' + sg(raio, 3) + ' m = ' + sg(r.raioLDA, 2) + '× LDA', xC, yFun + 12);

      /* rótulos das linhas */
      c.font = fonte(10.5, '700'); c.textBaseline = 'bottom';
      c.fillStyle = Plot.serie(6); c.textAlign = 'left';
      c.fillText('T = ' + sg(r.barl.T / 1e3, 3) + ' kN · ' + sg(90 - r.barl.ang, 2) + '° da vertical', X0 + 4, ySup + 34);
      c.fillStyle = Plot.serie(0); c.textAlign = 'right';
      c.fillText('T = ' + sg(r.sotav.T / 1e3, 3) + ' kN', X0 + W - 4, ySup + 34);
      if (p.tipo !== 'taut') {
        c.font = fonte(9.5); c.fillStyle = faint;
        c.textAlign = 'left'; c.fillText('apoiado no fundo: ' + sg(Math.max(0, r.barl.apoiado), 3) + ' m', X0 + 4, yFun - 4);
        c.textAlign = 'right'; c.fillText(sg(Math.max(0, r.sotav.apoiado), 3) + ' m', X0 + W - 4, yFun - 4);
      }
      /* avisos */
      c.textAlign = 'left'; c.textBaseline = 'top'; c.font = fonte(11, '700');
      var ya = Y0 + 22;
      if (r.semTracao) { c.fillStyle = Plot.serie(6); c.fillText('⚠ o peso da linha (' + sg(r.pesoLinha / 1e3, 3) + ' kN) passa da pré-tensão', X0 + 4, ya); ya += 15; }
      if (r.arranca) { c.fillStyle = Plot.serie(6); c.fillText('⚠ sem trecho apoiado: a âncora de arrasto é arrancada', X0 + 4, ya); ya += 15; }
      if (r.FS < 1.67) { c.fillStyle = Plot.serie(6); c.fillText('⚠ FS = ' + sg(r.FS, 3) + ' < 1,67 (API RP 2SK, intacta)', X0 + 4, ya); }
      c.font = fonte(9); c.fillStyle = faint; c.textAlign = 'right';
      c.fillText('escalas horizontal e vertical diferentes', X0 + W - 4, Y0 + 2);
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('mar');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-ancoragem', {
      titulo: 'Ancoragem — catenária x taut-leg',
      descricao: 'Na catenária, é o peso da linha que segura a plataforma: ela se afasta, levanta amarra do fundo e o peso suspenso aumenta a tração. Na taut-leg, a linha vai esticada até a âncora e é a elasticidade do poliéster que restaura. Mesma força ambiental, geometrias completamente diferentes.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Catenária em águas rasas', desc: 'Amarra de aço, raio 3× LDA', valores: { tipo: 'catenaria', linha: 'amarra', h: 300, raioLDA: 3.0, T0: 1500, nLinhas: 8, Fenv: 1500, animar: true } },
        { nome: '2 · Amarra pura a 1 500 m', desc: 'O peso próprio já passa da tração', valores: { tipo: 'catenaria', linha: 'amarra', h: 1500, raioLDA: 2.0, T0: 1200, nLinhas: 8, Fenv: 2500, animar: true } },
        { nome: '3 · Cabo de aço a 1 500 m', desc: 'Leve, mas precisa de raio enorme', valores: { tipo: 'catenaria', linha: 'cabo', h: 1500, raioLDA: 2.0, T0: 1500, nLinhas: 8, Fenv: 2500, animar: true } },
        { nome: '4 · Taut-leg de poliéster (DICAS)', desc: 'Raio ≈ LDA, offset mínimo', valores: { tipo: 'taut', linha: 'poliester', h: 1500, raioLDA: 1.0, T0: 1200, nLinhas: 8, Fenv: 2500, animar: true } },
        { nome: '5 · Tempestade de 100 anos', desc: 'Taut-leg com força ambiental alta', valores: { tipo: 'taut', linha: 'poliester', h: 1500, raioLDA: 1.0, T0: 1200, nLinhas: 8, Fenv: 7000, animar: true } },
        { nome: '6 · Só 6 linhas', desc: 'Menos linhas na mesma tempestade', valores: { tipo: 'taut', linha: 'poliester', h: 1500, raioLDA: 1.0, T0: 1200, nLinhas: 6, Fenv: 7000, animar: true } }
      ],
      controles: [
        { id: 'tipo', tipo: 'select', label: 'Tipo de ancoragem', valor: 'catenaria',
          opcoes: [{ v: 'catenaria', t: 'Catenária convencional' }, { v: 'taut', t: 'Taut-leg (linha esticada)' }] },
        { id: 'linha', tipo: 'select', label: 'Material da linha', valor: 'amarra',
          opcoes: Object.keys(OFF.LINHAS).map(function (k) { return { v: k, t: OFF.LINHAS[k].nome }; }) },
        { id: 'h', label: 'Lâmina d’água', min: 100, max: 3000, step: 10, valor: 300, unidade: 'm' },
        { id: 'raioLDA', label: 'Raio de ancoragem / LDA', min: 0.6, max: 4, step: 0.05, valor: 3, unidade: '×' },
        { id: 'T0', label: 'Pré-tensão no fairlead', min: 200, max: 4000, step: 50, valor: 1500, unidade: 'kN' },
        { id: 'nLinhas', label: 'Número de linhas', min: 4, max: 16, step: 2, valor: 8, unidade: '' },
        { id: 'Fenv', label: 'Força ambiental média', min: 0, max: 9000, step: 50, valor: 1500, unidade: 'kN' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'mar', axes: false, height: 400, grid: false, legend: false },
        { id: 'rest', titulo: 'Curva de restauração do sistema', xlabel: 'Offset (% da LDA)', ylabel: 'Força restauradora (kN)',
          aspect: 0.48, legendPos: 'topleft' },
        { id: 'tens', titulo: 'Tração na linha mais carregada', xlabel: 'Offset (% da LDA)', ylabel: 'Tração (kN)',
          aspect: 0.42, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'L', label: 'Comprimento da linha' },
        { id: 'off', label: 'Offset' },
        { id: 'offp', label: 'Offset / LDA' },
        { id: 'T', label: 'Tração máxima' },
        { id: 'FS', label: 'Fator de segurança' },
        { id: 'K', label: 'Rigidez horizontal' },
        { id: 'ang', label: 'Ângulo no fairlead' }
      ],
      formulas: [
        { g: 'Catenária (linha inextensível)' },
        { tex: 'a = \\frac{H}{w}', d: 'parâmetro da catenária · w = peso submerso por metro', destaque: true },
        { tex: 's = \\sqrt{h^2 + 2ha}, \\qquad x = a\\,\\cosh^{-1}\\!\\left(1 + \\frac{h}{a}\\right)', d: 'comprimento suspenso e sua projeção horizontal' },
        { tex: 'T = H + w\\,h = \\sqrt{H^2 + (w s)^2}', d: 'tração no fairlead', destaque: true },
        { tex: 'X = L - s + x', d: 'distância âncora–fairlead; L − s fica apoiado no fundo' },
        { g: 'Taut-leg (linha elástica esticada)' },
        { tex: 'T = EA\\,\\frac{\\ell - \\ell_0}{\\ell_0}, \\qquad \\ell = \\sqrt{X^2 + h^2}', d: 'a restauração vem do alongamento', destaque: true },
        { tex: 'H = T\\,\\frac{X}{\\ell}' },
        { g: 'Sistema e critérios' },
        { tex: 'F_{rest}(\\delta) = \\sum_i H_i(\\delta)\\cos\\theta_i', d: 'soma das componentes na direção do deslocamento' },
        { tex: 'FS = \\frac{MBL}{T_{máx}} \\geq 1{,}67', d: 'API RP 2SK, condição intacta, análise dinâmica' },
        { tex: '\\delta \\lesssim 5\\text{ a }10\\ \\%\\ \\text{da LDA}', d: 'limite típico imposto pelos risers' }
      ],
      passos: [],
      nota: 'Análise quase estática com linhas homogêneas (sem trechos de amarra + poliéster + amarra), sistema simétrico e força ambiental média numa direção. Projeto real inclui a resposta dinâmica de primeira e segunda ordem, arrasto hidrodinâmico nas linhas e o caso com uma linha rompida.',
      calcular: function (p, ctx) {
        var q = { tipo: p.tipo, linha: p.linha, nLinhas: Math.round(p.nLinhas), h: p.h, raio: p.raioLDA * p.h,
                  L: 0, T0: p.T0 * 1e3, Fenv: p.Fenv * 1e3 };
        var r = OFF.ancoragem(q);
        A.ctx = ctx; A.p = q; A.r = r; A.on = !!p.animar;
        desenha();

        var offs = Plot.linspace(0, Math.max(3, 1.8 * Math.abs(r.offset)), 50);
        var F = [], T = [];
        offs.forEach(function (o) { var e = r.restauradora(o / 100 * p.h); F.push(e.F / 1e3); T.push(e.Tmax / 1e3); });
        var g = ctx.plot('rest').clear();
        g.line(offs, F, { color: Plot.serie(0), width: 2.8, label: p.tipo === 'taut' ? 'taut-leg' : 'catenária' });
        /* comparação com o outro conceito, mesma LDA e pré-tensão */
        var outro = Object.assign({}, q, p.tipo === 'taut'
          ? { tipo: 'catenaria', linha: 'cabo', raio: 2 * p.h }
          : { tipo: 'taut', linha: 'poliester', raio: 1 * p.h });
        var ro = OFF.ancoragem(outro);
        g.line(offs, offs.map(function (o) { return ro.restauradora(o / 100 * p.h).F / 1e3; }),
               { color: Plot.cssVar('--text-faint', '#999'), width: 1.6, dash: [5, 4], label: p.tipo === 'taut' ? 'catenária de cabo (2× LDA)' : 'taut-leg de poliéster (1× LDA)' });
        g.hline(p.Fenv, { color: Plot.serie(3), width: 1.3, text: 'força ambiental' });
        g.marker(r.offset, p.Fenv, 'equilíbrio', { color: Plot.serie(6), r: 5.5 });
        g.setLimits([0, offs[offs.length - 1]], [0, Math.max(p.Fenv * 1.4, F[F.length - 1] * 1.05)]);
        g.draw();

        var gt = ctx.plot('tens').clear();
        gt.line(offs, T, { color: Plot.serie(6), width: 2.6, label: 'linha a barlavento' });
        gt.hline(r.MBL / 1e3, { color: Plot.serie(7), width: 1.3, text: 'carga de ruptura (MBL)' });
        gt.hline(r.MBL / 1.67 / 1e3, { color: Plot.serie(3), width: 1.3, text: 'MBL / 1,67' });
        gt.marker(r.offset, r.Tmax / 1e3, 'FS = ' + sg(r.FS, 3), { color: Plot.serie(6), r: 5 });
        gt.setLimits([0, offs[offs.length - 1]], [0, r.MBL / 1e3 * 1.1]);
        gt.draw();

        var ln = r.linha;
        var passos = [];
        if (p.tipo === 'taut') {
          passos.push({ t: '① Comprimento indeformado para a pré-tensão',
            tex: '\\ell_0 = \\frac{\\sqrt{R^2 + h^2}}{1 + T_0/EA}',
            texSub: '\\ell_0 = \\frac{\\sqrt{' + nt(q.raio) + '^2 + ' + nt(p.h) + '^2}}{1 + ' + nt(q.T0) + '/' + nt(ln.EA) + '} = ' + nt(r.L0taut, 5) + '\\ m',
            obs: 'A linha esticada chega à âncora num ângulo de ' + sg(Math.atan2(p.h, q.raio) * 180 / Math.PI, 2) + '° com o fundo. A âncora recebe esforço vertical — por isso taut-leg usa estacas de sucção, torpedo ou âncoras de carga vertical (VLA), nunca âncora de arrasto comum.' });
        } else {
          passos.push({ t: '① Da pré-tensão ao comprimento da linha',
            tex: 'H_0 = T_0 - w h, \\qquad L = R - x(H_0) + s(H_0)',
            texSub: 'H_0 = ' + nt(q.T0) + ' - ' + nt(ln.w) + '\\times' + nt(p.h) + ' = ' + nt(q.T0 - ln.w * p.h) + '\\ N \\;\\Rightarrow\\; L = ' + nt(r.L, 5) + '\\ m',
            obs: r.semTracao
              ? 'Não fecha: só o peso da linha suspensa (' + sg(ln.w * p.h / 1e3, 3) + ' kN) já passa da pré-tensão pedida. É por isso que, em águas profundas, não se usa amarra pura — usa-se amarra só nas pontas e cabo de aço ou poliéster no meio.'
              : 'Numa catenária a tração no fairlead é a componente horizontal mais o peso de uma coluna de linha da altura da lâmina d’água. Em águas profundas, esse peso sozinho consome a capacidade da linha.' });
        }
        passos.push({ t: '② Equilíbrio sob a força ambiental',
          tex: '\\sum_i H_i(\\delta)\\cos\\theta_i = F_{amb}',
          texSub: 'F_{amb} = ' + nt(p.Fenv) + '\\ kN \\;\\Rightarrow\\; \\delta = ' + nt(r.delta, 3) + '\\ m = ' + nt(r.offset, 3) + '\\ \\%\\ LDA',
          obs: 'A plataforma anda até que as linhas de barlavento, mais tracionadas, e as de sotavento, mais frouxas, somem uma força igual à ambiental. ' + (r.offset > 8 ? 'Offset acima de ~8 % da LDA já compromete a maioria dos risers rígidos.' : 'Offset dentro do usual para risers flexíveis.') });
        if (p.tipo !== 'taut') {
          var cb = r.barl;
          passos.push({ t: '③ A linha mais carregada',
            tex: 'a = \\frac{H}{w},\\quad s = \\sqrt{h^2 + 2ha},\\quad T = H + wh',
            texSub: 'H = ' + nt(cb.H / 1e3, 4) + '\\ kN,\\ a = ' + nt(cb.a, 4) + '\\ m,\\ s = ' + nt(cb.s, 4) + '\\ m \\;\\Rightarrow\\; T = ' + nt(cb.T / 1e3, 4) + '\\ kN',
            obs: 'Trecho ainda apoiado no fundo: ' + sg(Math.max(0, cb.apoiado), 3) + ' m. ' + (r.arranca ? 'Acabou: toda a linha está suspensa e a âncora de arrasto passa a receber força vertical — ela sai do fundo.' : 'Enquanto houver amarra apoiada, a âncora só recebe força horizontal, que é o que uma âncora de arrasto suporta.') });
        } else {
          var tb = r.barl;
          passos.push({ t: '③ A linha mais carregada',
            tex: 'T = EA\\,\\frac{\\ell - \\ell_0}{\\ell_0}',
            texSub: '\\ell = ' + nt(tb.l, 5) + '\\ m \\;\\Rightarrow\\; T = ' + nt(ln.EA) + '\\times\\frac{' + nt(tb.l - r.L0taut, 3) + '}{' + nt(r.L0taut, 5) + '} = ' + nt(tb.T / 1e3, 4) + '\\ kN',
            obs: 'Alguns metros de alongamento numa linha de ~2 km já dão centenas de kN: a rigidez é alta e o offset fica pequeno. É o princípio do DICAS da Petrobras, que combina taut-leg com complacência diferenciada na proa e na popa do FPSO.' });
        }
        passos.push({ t: '④ Fator de segurança',
          tex: 'FS = \\frac{MBL}{T_{máx}}',
          texSub: 'FS = \\frac{' + nt(r.MBL / 1e3) + '}{' + nt(r.Tmax / 1e3, 4) + '} = ' + nt(r.FS, 3),
          obs: 'A API RP 2SK pede FS ≥ 1,67 na condição intacta com análise dinâmica e ≥ 1,25 com uma linha rompida. ' + (r.FS < 1.67 ? 'Não atende: aumente o número de linhas, a bitola ou revise a pré-tensão.' : 'Atende na condição intacta.') });
        ctx.setPassos(passos);

        return {
          L: { v: p.tipo === 'taut' ? r.L0taut : r.L, u: 'm' },
          off: { v: r.delta, u: 'm' },
          offp: { v: r.offset, u: '% LDA', classe: r.offset > 8 ? 'alerta' : '' },
          T: { v: r.Tmax / 1e3, u: 'kN' },
          FS: { v: r.FS, u: '', classe: r.FS < 1.67 ? 'alerta' : 'ok' },
          K: { v: r.rigidez / 1e3, u: 'kN/m' },
          ang: { v: 90 - r.barl.ang, u: '° da vertical' }
        };
      }
    });
  })();

  /* ==========================================================================
     5. Processamento primário no topside
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-processo')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, t = A.t, k;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var cO = 'rgb(140,90,30)', cG = 'rgb(235,190,60)', cW = 'rgb(60,140,220)', cM = 'rgb(110,80,60)';
      var tot = r.Qo + r.Qw;

      /* chegada dos poços */
      tubo(c, [[X0 + 2, Y0 + H * 0.50], [X0 + W * 0.12, Y0 + H * 0.50]], cM, 7, t * 0.8, 6, 2.6, cM);
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('risers / manifold', X0 + 2, Y0 + H * 0.50 - 7);

      /* separador trifásico horizontal */
      var sx = X0 + W * 0.12, sy = Y0 + H * 0.36, sw = W * 0.30, sh = H * 0.28;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(sx + sh / 2, sy); c.lineTo(sx + sw - sh / 2, sy);
      c.arc(sx + sw - sh / 2, sy + sh / 2, sh / 2, -Math.PI / 2, Math.PI / 2);
      c.lineTo(sx + sh / 2, sy + sh); c.arc(sx + sh / 2, sy + sh / 2, sh / 2, Math.PI / 2, Math.PI * 1.5);
      c.closePath(); c.fill(); c.stroke();
      c.save(); c.clip();
      var nivel = sy + sh * 0.50;                      /* interface gás/líquido */
      var fracW = Math.min(0.85, r.Qw / Math.max(1, tot));
      var yInt = nivel + (sy + sh - nivel) * (1 - fracW);  /* interface óleo/água */
      c.fillStyle = 'rgba(140,90,30,0.55)'; c.fillRect(sx, nivel, sw, yInt - nivel);
      c.fillStyle = 'rgba(60,140,220,0.45)'; c.fillRect(sx, yInt, sw * 0.78, sy + sh - yInt);
      c.fillStyle = 'rgba(140,90,30,0.55)'; c.fillRect(sx + sw * 0.78, nivel, sw * 0.22, sy + sh - nivel);
      /* bolhas de gás subindo, gotas de água descendo */
      for (k = 0; k < 16; k++) {
        var fb = (t * 0.7 + k / 16) % 1;
        c.fillStyle = cG;
        c.beginPath(); c.arc(sx + sw * (0.12 + 0.6 * ((k * 0.618) % 1)), nivel + (sy + sh - nivel) * (1 - fb) * 0.9 - 2, 2, 0, TAU); c.fill();
        c.fillStyle = cW;
        c.beginPath(); c.arc(sx + sw * (0.15 + 0.55 * ((k * 0.382) % 1)), nivel + (yInt - nivel) * fb, 1.8, 0, TAU); c.fill();
      }
      c.restore();
      /* vertedouro */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx + sw * 0.78, sy + sh); c.lineTo(sx + sw * 0.78, nivel + 4); c.stroke();
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('Separador trifásico', sx + sw / 2, sy - 4);
      c.font = fonte(9.5); c.fillStyle = faint; c.textBaseline = 'top';
      c.fillText(sg(r.D, 3) + ' m × ' + sg(r.Lv, 3) + ' m · ' + sg(p.P, 3) + ' bar · retém ' + sg(p.tRet, 2) + ' min', sx + sw / 2, sy + sh + 4);

      /* gás → depurador → compressores → exportação */
      var yG = Y0 + H * 0.12;
      tubo(c, [[sx + sw * 0.80, sy + 4], [sx + sw * 0.80, yG], [X0 + W * 0.50, yG]], cG, 5, t, 5, 2.2, cG);
      var xc0 = X0 + W * 0.50, dxc = Math.min(W * 0.09, W * 0.36 / r.nEst);
      for (k = 0; k < r.nEst; k++) {
        var xk = xc0 + k * dxc + dxc / 2;
        c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
        c.beginPath(); c.arc(xk, yG, 12, 0, TAU); c.fill(); c.stroke();
        var ang = t * 12 + k;
        c.strokeStyle = cG; c.lineWidth = 2;
        for (var pa = 0; pa < 4; pa++) {
          c.beginPath(); c.moveTo(xk, yG);
          c.lineTo(xk + 9 * Math.cos(ang + pa * Math.PI / 2), yG + 9 * Math.sin(ang + pa * Math.PI / 2)); c.stroke();
        }
        c.fillStyle = faint; c.font = fonte(8.5); c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText(sg(p.P * Math.pow(r.r, (k + 1) / r.nEst), 3) + ' bar', xk, yG + 15);
      }
      tubo(c, [[xc0 + r.nEst * dxc, yG], [X0 + W * 0.99, yG]], cG, 5, t * 1.4, 4, 2.2, cG);
      c.fillStyle = cG; c.font = fonte(10.5, '700'); c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText('gás → exportação, gas lift, injeção', X0 + W * 0.99, yG + 30);
      c.fillStyle = cor; c.font = fonte(9.5);
      c.fillText(sg(r.QgStd / 1e6, 3) + ' MM Sm³/d · compressão ' + sg(r.Wcomp, 3) + ' MW', X0 + W * 0.99, yG + 45);

      /* óleo → tratador eletrostático → tanques */
      var yO = Y0 + H * 0.50;
      tubo(c, [[sx + sw, yO], [X0 + W * 0.46, yO]], cO, 6, t * 0.9, 5, 2.4, cO);
      var tx = X0 + W * 0.46, tw = W * 0.13;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.fillRect(tx, yO - 18, tw, 36); c.strokeRect(tx, yO - 18, tw, 36);
      c.strokeStyle = Plot.serie(6); c.lineWidth = 1.3;
      for (k = 0; k < 3; k++) {
        var yk = yO - 10 + k * 10;
        c.beginPath();
        for (var s = 0; s <= 12; s++) {
          var xs = tx + 8 + (tw - 16) * s / 12, ys = yk + (s % 2 ? -2 : 2) * (0.5 + 0.5 * Math.sin(t * 30));
          if (s) c.lineTo(xs, ys); else c.moveTo(xs, ys);
        }
        c.stroke();
      }
      c.fillStyle = cor; c.font = fonte(9.5, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('tratador eletrostático', tx + tw / 2, yO - 21);
      tubo(c, [[tx + tw, yO], [X0 + W * 0.99, yO]], cO, 6, t * 0.9, 4, 2.4, cO);
      c.fillStyle = cO; c.font = fonte(10.5, '700'); c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText('óleo → tanques → aliviador', X0 + W * 0.99, yO + 8);
      c.fillStyle = cor; c.font = fonte(9.5);
      c.fillText(sg(r.bbl / 1000, 3) + ' mil bbl/d · BSW < 1 %', X0 + W * 0.99, yO + 23);

      /* água → hidrociclone → flotador → descarte */
      var yW = Y0 + H * 0.84;
      tubo(c, [[sx + sw * 0.4, sy + sh], [sx + sw * 0.4, yW], [X0 + W * 0.42, yW]], cW, 5, t, 5, 2.2, cW);
      /* hidrociclone */
      var hx = X0 + W * 0.43;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(hx, yW - 16); c.lineTo(hx + 26, yW - 16); c.lineTo(hx + 16, yW + 16); c.lineTo(hx + 10, yW + 16); c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = cW; c.lineWidth = 1.2;
      c.beginPath(); c.arc(hx + 13, yW - 6, 6, t * 20, t * 20 + 4.5); c.stroke();
      c.fillStyle = cor; c.font = fonte(9); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('hidrociclone', hx + 13, yW + 19);
      c.fillText(sg(r.tog1, 3) + ' mg/L', hx + 13, yW + 31);
      tubo(c, [[hx + 26, yW], [X0 + W * 0.56, yW]], cW, 4, t, 3, 2, cW);
      /* flotador */
      var fx = X0 + W * 0.56;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.fillRect(fx, yW - 16, W * 0.10, 32); c.strokeRect(fx, yW - 16, W * 0.10, 32);
      for (k = 0; k < 10; k++) {
        var fb2 = (t * 1.2 + k / 10) % 1;
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.beginPath(); c.arc(fx + W * 0.10 * ((k * 0.618) % 1), yW + 14 - fb2 * 28, 1.6, 0, TAU); c.fill();
      }
      c.fillStyle = cor; c.font = fonte(9); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('flotador', fx + W * 0.05, yW + 19);
      tubo(c, [[fx + W * 0.10, yW], [X0 + W * 0.99, yW]], cW, 4, t, 3, 2, cW);
      c.fillStyle = r.atende ? Plot.serie(2) : Plot.serie(6); c.font = fonte(10.5, '700');
      c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText('descarte: TOG ' + sg(r.tog2, 3) + ' mg/L', X0 + W * 0.99, yW + 8);
      c.font = fonte(9.5);
      c.fillText(r.atende ? 'atende CONAMA 393 (≤ 29)' : 'acima de 29 mg/L — não atende', X0 + W * 0.99, yW + 23);
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('planta');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt * 0.35;
      desenha();
    });

    Sim.build('#sim-processo', {
      titulo: 'Processamento primário — separar óleo, gás e água no convés',
      descricao: 'Do poço chega uma mistura de óleo, gás, água e areia. O topside separa as três fases, trata o óleo até BSW abaixo de 1 %, comprime o gás e limpa a água até poder devolvê-la ao mar. O separador é dimensionado ou pelo gás ou pelo líquido — o que exigir o vaso maior.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · FPSO de 150 mil bbl/d', desc: 'Início de produção, pouca água', valores: { Qliq: 30000, bsw: 20, rgo: 250, P: 10, T: 60, tRet: 3, efHidro: 90, efFlot: 75, toGin: 1000, Pexp: 250, animar: true } },
        { nome: '2 · Campo maduro', desc: 'BSW de 70 %: a planta vira estação de água', valores: { Qliq: 30000, bsw: 70, rgo: 120, P: 10, T: 60, tRet: 5, efHidro: 90, efFlot: 75, toGin: 1000, Pexp: 250, animar: true } },
        { nome: '3 · Pré-sal com muito gás', desc: 'RGO alta: o gás dimensiona o vaso', valores: { Qliq: 30000, bsw: 10, rgo: 450, P: 10, T: 60, tRet: 3, efHidro: 90, efFlot: 75, toGin: 1000, Pexp: 250, animar: true } },
        { nome: '4 · Separador em pressão maior', desc: 'Gás mais denso, menos compressão', valores: { Qliq: 30000, bsw: 10, rgo: 450, P: 25, T: 60, tRet: 3, efHidro: 90, efFlot: 75, toGin: 1000, Pexp: 250, animar: true } },
        { nome: '5 · Hidrociclone ruim', desc: 'Descarte fora da resolução', valores: { Qliq: 30000, bsw: 40, rgo: 250, P: 10, T: 60, tRet: 3, efHidro: 80, efFlot: 70, toGin: 1500, Pexp: 250, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Produção' },
        { id: 'Qliq', label: 'Vazão de líquido (óleo + água)', min: 3000, max: 60000, step: 500, valor: 30000, unidade: 'm³/d' },
        { id: 'bsw', label: 'BSW (água e sedimentos)', min: 0, max: 90, step: 1, valor: 20, unidade: '%' },
        { id: 'rgo', label: 'Razão gás-óleo (RGO)', min: 30, max: 600, step: 5, valor: 250, unidade: 'Sm³/m³' },
        { tipo: 'titulo', label: 'Separador' },
        { id: 'P', label: 'Pressão de operação', min: 3, max: 40, step: 0.5, valor: 10, unidade: 'bar abs' },
        { id: 'T', label: 'Temperatura', min: 30, max: 90, step: 1, valor: 60, unidade: '°C' },
        { id: 'tRet', label: 'Tempo de retenção do líquido', min: 1, max: 10, step: 0.5, valor: 3, unidade: 'min' },
        { tipo: 'titulo', label: 'Água produzida e gás' },
        { id: 'toGin', label: 'Óleo na água que sai do separador', min: 200, max: 3000, step: 50, valor: 1000, unidade: 'mg/L' },
        { id: 'efHidro', label: 'Eficiência do hidrociclone', min: 60, max: 98, step: 1, valor: 90, unidade: '%' },
        { id: 'efFlot', label: 'Eficiência do flotador', min: 40, max: 95, step: 1, valor: 75, unidade: '%' },
        { id: 'Pexp', label: 'Pressão de exportação do gás', min: 80, max: 350, step: 5, valor: 250, unidade: 'bar' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'planta', axes: false, height: 400, grid: false, legend: false },
        { id: 'dim', titulo: 'Diâmetro do separador: quem manda, gás ou líquido', xlabel: 'Razão gás-óleo (Sm³/m³)', ylabel: 'Diâmetro (m)',
          aspect: 0.46, legendPos: 'topleft' },
        { id: 'tog', titulo: 'Teor de óleo na água ao longo do tratamento', xlabel: '', ylabel: 'TOG (mg/L)',
          aspect: 0.36, legend: false, ylog: true }
      ],
      saidas: [
        { id: 'oleo', label: 'Óleo' },
        { id: 'gas', label: 'Gás' },
        { id: 'agua', label: 'Água produzida' },
        { id: 'sep', label: 'Separador (D × L)' },
        { id: 'lim', label: 'Dimensiona pelo' },
        { id: 'tog', label: 'TOG no descarte' },
        { id: 'comp', label: 'Potência de compressão' }
      ],
      formulas: [
        { g: 'Capacidade de gás — Souders-Brown' },
        { tex: 'v_{máx} = K\\sqrt{\\frac{\\rho_L - \\rho_G}{\\rho_G}}', d: 'K ≈ 0,12 m/s em vaso horizontal com eliminador de névoa', destaque: true },
        { tex: 'A_{gás} = \\frac{Q_{G,real}}{v_{máx}}, \\qquad Q_{G,real} = Q_{G,std}\\,\\frac{P_{std}}{P}\\,\\frac{T}{T_{std}}\\,Z' },
        { tex: '\\rho_G = \\frac{P\\,M}{Z R T}', d: 'gás mais denso em pressão alta: menos velocidade permitida, mas muito menos volume' },
        { g: 'Capacidade de líquido — tempo de retenção' },
        { tex: 'V_{líq} = Q_L\\,t_r', d: 'API 12J: 3 a 5 min em trifásicos', destaque: true },
        { tex: 'V_{líq} = \\frac{1}{2}\\,\\frac{\\pi D^2}{4}\\,L, \\quad L = 4D', d: 'metade do vaso com líquido' },
        { g: 'Água produzida' },
        { tex: 'TOG_{sai} = TOG_{entra}\\,(1 - \\eta_{hidro})(1 - \\eta_{flot})', destaque: true },
        { tex: 'TOG \\leq 29\\ mg/L\\ \\text{(média mensal)}', d: 'Resolução CONAMA 393/2007' },
        { g: 'Compressão' },
        { tex: 'W = \\frac{n\\,k}{k-1}\\,\\frac{P_1 Q_1}{\\eta}\\left[\\left(\\frac{P_2}{P_1}\\right)^{\\frac{k-1}{nk}} - 1\\right]', d: 'n estágios iguais, razão por estágio ≤ 4' }
      ],
      passos: [],
      nota: 'Dimensionamento preliminar de separador horizontal (API 12J) com metade do vaso ocupada por líquido e L/D = 4; gás com M = 20 kg/kmol e Z = 0,90. Separadores reais de FPSO são dimensionados também para golfadas (slug), espuma e movimento do casco.',
      calcular: function (p, ctx) {
        var r = OFF.processo(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var rgos = Plot.linspace(30, 600, 60);
        var g = ctx.plot('dim').clear();
        g.line(rgos, rgos.map(function (x) { return OFF.processo(Object.assign({}, p, { rgo: x })).Dg; }), { color: Plot.serie(3), width: 2.4, label: 'exigido pelo gás' });
        g.line(rgos, rgos.map(function (x) { return OFF.processo(Object.assign({}, p, { rgo: x })).Dl; }), { color: Plot.serie(0), width: 2.4, label: 'exigido pelo líquido' });
        g.marker(p.rgo, r.D, 'D = ' + sg(r.D, 3) + ' m', { color: Plot.serie(6), r: 5 });
        g.draw();

        var gt = ctx.plot('tog').clear();
        var etapas = [['saída do separador', p.toGin], ['após hidrociclone', r.tog1], ['após flotador', r.tog2]];
        gt.o.xcat = etapas.map(function (e, j) { return { v: j, label: e[0] }; });
        etapas.forEach(function (e, j) {
          gt.bars([j], [Math.log10(e[1])], { color: j === 2 ? (r.atende ? Plot.serie(2) : Plot.serie(6)) : Plot.serie(0), barw: 0.6 });
          gt.text(j, Math.log10(e[1]), sg(e[1], 3) + ' mg/L', { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        gt.hline(Math.log10(29), { color: Plot.serie(6), width: 1.4, text: 'CONAMA 393: 29 mg/L' });
        gt.setLimits([-0.6, 2.6], [0, Math.log10(Math.max(p.toGin, 100)) + 0.5]);
        gt.draw();

        ctx.setPassos([
          { t: '① Vazões de cada fase',
            tex: 'Q_o = Q_L(1 - BSW), \\quad Q_w = Q_L\\,BSW, \\quad Q_{G} = Q_o\\,RGO',
            texSub: 'Q_o = ' + nt(r.Qo) + '\\ m^3/d\\ (' + nt(r.bbl, 4) + '\\ bbl/d),\\ Q_w = ' + nt(r.Qw) + ',\\ Q_G = ' + nt(r.QgStd / 1e6, 3) + '\\ MM\\ Sm^3/d',
            obs: 'Um barril é 0,159 m³. BSW (basic sediment and water) cresce ao longo da vida do campo: um campo maduro pode produzir mais água que óleo, e aí a planta passa a ser limitada pelo tratamento de água.' },
          { t: '② Volume real do gás no separador',
            tex: 'Q_{G,real} = Q_{G,std}\\,\\frac{1{,}013}{P}\\,\\frac{T}{288}\\,Z',
            texSub: 'Q_{G,real} = \\frac{' + nt(r.QgStd) + '}{86400}\\times\\frac{1{,}013}{' + nt(p.P) + '}\\times\\frac{' + nt(p.T + 273.15, 4) + '}{288}\\times 0{,}9 = ' + nt(r.QgAct, 3) + '\\ m^3/s',
            obs: 'A “vazão padrão” está a 1 atm e 15 °C. Dentro do vaso, a ' + sg(p.P, 3) + ' bar, o gás ocupa ' + sg(p.P / 1.013, 3) + ' vezes menos volume — é por isso que subir a pressão de separação reduz o diâmetro necessário.' },
          { t: '③ Velocidade máxima do gás (Souders-Brown)',
            tex: 'v_{máx} = K\\sqrt{\\frac{\\rho_L - \\rho_G}{\\rho_G}}',
            texSub: '\\rho_G = ' + nt(r.rhoG, 3) + ',\\ \\rho_L = ' + nt(r.rhoL, 3) + ' \\;\\Rightarrow\\; v_{máx} = 0{,}12\\sqrt{\\frac{' + nt(r.rhoL, 3) + ' - ' + nt(r.rhoG, 3) + '}{' + nt(r.rhoG, 3) + '}} = ' + nt(r.vMax, 3) + '\\ m/s \\;\\Rightarrow\\; A_{gás} = ' + nt(r.Agas, 3) + '\\ m^2',
            obs: 'Acima dessa velocidade, o arrasto do gás sobre as gotas de líquido vence o peso delas e o gás sai carregando líquido (arraste) — que vai direto para os compressores.' },
          { t: '④ Volume de líquido e diâmetro',
            tex: 'V = Q_L\\,t_r, \\quad D_{líq} = \\sqrt[3]{\\frac{V}{\\tfrac{1}{2}\\cdot\\tfrac{\\pi}{4}\\cdot 4}}, \\quad D_{gás} = \\sqrt{\\frac{A_{gás}}{\\tfrac{1}{2}\\cdot\\tfrac{\\pi}{4}}}',
            texSub: 'V = ' + nt(r.Vliq, 3) + '\\ m^3 \\;\\Rightarrow\\; D_{líq} = ' + nt(r.Dl, 3) + '\\ m,\\ D_{gás} = ' + nt(r.Dg, 3) + '\\ m \\;\\Rightarrow\\; D = ' + nt(r.D, 3) + '\\ m,\\ L = ' + nt(r.Lv, 3) + '\\ m',
            obs: 'O vaso tem de atender às duas exigências ao mesmo tempo. Aqui quem manda é o ' + r.limitante + '. Os tempos de retenção longos existem porque a água precisa de tempo para decantar do óleo — óleo pesado e emulsionado pede mais.' },
          { t: '⑤ Tratamento da água produzida',
            tex: 'TOG = TOG_0\\,(1 - \\eta_h)(1 - \\eta_f)',
            texSub: 'TOG = ' + nt(p.toGin) + '\\times(1 - ' + nt(p.efHidro / 100) + ')\\times(1 - ' + nt(p.efFlot / 100) + ') = ' + nt(r.tog2, 3) + '\\ mg/L',
            obs: (r.atende ? 'Atende' : 'Não atende') + ' a Resolução CONAMA 393/2007 (média mensal ≤ 29 mg/L). São ' + sg(r.Qw, 3) + ' m³/d descartados com ' + sg(r.Qw * r.tog2 * 1e-3, 3) + ' kg/d de óleo. Quando não se consegue, a alternativa é reinjetar a água no reservatório.' },
          { t: '⑥ Compressão do gás',
            tex: 'W = \\frac{nk}{k-1}\\frac{P_1Q_1}{\\eta}\\left[r^{\\frac{k-1}{nk}} - 1\\right], \\quad n = \\left\\lceil\\frac{\\ln r}{\\ln 4}\\right\\rceil',
            texSub: 'r = \\frac{' + nt(p.Pexp) + '}{' + nt(p.P) + '} = ' + nt(r.r, 3) + ',\\ n = ' + r.nEst + ' \\;\\Rightarrow\\; W = ' + nt(r.Wcomp, 3) + '\\ MW',
            obs: 'A compressão é quase sempre a maior carga elétrica da plataforma, e a geração é feita por turbinas a gás queimando o próprio gás produzido. Estágios com resfriamento intermediário limitam a temperatura de descarga e economizam potência.' }
        ]);

        return {
          oleo: { v: r.bbl / 1000, u: 'mil bbl/d' },
          gas: { v: r.QgStd / 1e6, u: 'MM Sm³/d' },
          agua: { v: r.Qw, u: 'm³/d' },
          sep: { v: sg(r.D, 3) + ' × ' + sg(r.Lv, 3), u: 'm' },
          lim: { v: r.limitante, u: '' },
          tog: { v: r.tog2, u: 'mg/L', classe: r.atende ? 'ok' : 'alerta' },
          comp: { v: r.Wcomp, u: 'MW', classe: 'destaque' }
        };
      }
    });
  })();
})();

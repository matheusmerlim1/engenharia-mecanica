/* ==========================================================================
   Motores de Combustão Interna — modelos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · Cinemática do mecanismo biela-manivela
     · Parâmetros geométricos: cilindrada, taxa de compressão, velocidade média
     · Ciclos padrão a ar frio: Otto, Diesel e misto (Sabathé)
     · Desempenho: pme, torque, potência, consumos e rendimentos
     · Combustão: relação ar-combustível estequiométrica, λ, produtos
   ========================================================================== */
(function (global) {
  'use strict';
  var MCI = {};
  var R = 0.287;                                   /* kJ/kg·K, ar */

  /* ---------------- geometria e cinemática ---------------- */
  MCI.geometria = function (p) {
    var D = p.D / 1000, S = p.S / 1000;            /* m */
    var Vd = Math.PI * D * D / 4 * S;              /* m³ por cilindro */
    var Vc = Vd / (p.rc - 1);                      /* volume morto */
    var Vtot = p.z * Vd;
    var vm = 2 * S * p.rpm / 60;                   /* velocidade média do pistão */
    return { D: D, S: S, Vd: Vd, Vc: Vc, Vtot: Vtot, cilindrada: Vtot * 1e6, vm: vm,
             rel: S / D, r: S / 2, lam: (S / 2) / (p.L / 1000) };
  };
  /* posição, velocidade e aceleração do pistão (θ = 0 no PMS) */
  MCI.pistao = function (th, r, L, w) {
    var sen = Math.sin(th), cos = Math.cos(th);
    var raiz = Math.sqrt(L * L - r * r * sen * sen);
    var x = r * cos + raiz;                        /* distância do eixo ao pino */
    var s = r + L - x;                             /* deslocamento a partir do PMS */
    /* velocidade e aceleração por diferenciação numérica da forma fechada:
       s é o deslocamento a partir do PMS, positivo no sentido PMS → PMI */
    var h = 1e-5;
    var sv = function (t) {
      var sn = Math.sin(t), cs = Math.cos(t);
      return r + L - (r * cs + Math.sqrt(L * L - r * r * sn * sn));
    };
    var vExata = w * (sv(th + h) - sv(th - h)) / (2 * h);
    var aExata = w * w * (sv(th + h) - 2 * sv(th) + sv(th - h)) / (h * h);
    return { s: s, v: vExata, a: aExata, x: x };
  };
  /* volume instantâneo da câmara */
  MCI.volume = function (th, g) {
    return g.Vc + Math.PI * g.D * g.D / 4 * MCI.pistao(th, g.r, g.Lm, 1).s;
  };

  /* ---------------- ciclos padrão a ar frio ---------------- */
  MCI.otto = function (rc, k) { return 1 - Math.pow(rc, 1 - k); };
  MCI.diesel = function (rc, corte, k) {
    return 1 - Math.pow(rc, 1 - k) * (Math.pow(corte, k) - 1) / (k * (corte - 1));
  };
  MCI.sabathe = function (rc, alfa, corte, k) {
    return 1 - Math.pow(rc, 1 - k) * (alfa * Math.pow(corte, k) - 1) /
           ((alfa - 1) + k * alfa * (corte - 1));
  };
  /* estados do ciclo misto, para os diagramas (padrão a ar frio) */
  MCI.cicloEstados = function (p) {
    var k = p.k, cv = R / (k - 1), cp = k * cv;
    var T1 = p.T1, P1 = p.P1, v1 = R * T1 / P1;
    var v2 = v1 / p.rc, T2 = T1 * Math.pow(p.rc, k - 1), P2 = P1 * Math.pow(p.rc, k);
    var alfa = p.alfa, corte = p.corte;
    var P3 = P2 * alfa, T3 = T2 * alfa, v3 = v2;
    var v4 = v3 * corte, T4 = T3 * corte, P4 = P3;
    var v5 = v1, T5 = T4 * Math.pow(v4 / v5, k - 1), P5 = P4 * Math.pow(v4 / v5, k);
    var qent = cv * (T3 - T2) + cp * (T4 - T3);
    var qsai = cv * (T5 - T1);
    var wliq = qent - qsai;
    return { k: k, cv: cv, cp: cp, T1: T1, T2: T2, T3: T3, T4: T4, T5: T5,
             P1: P1, P2: P2, P3: P3, P4: P4, P5: P5, v1: v1, v2: v2, v3: v3, v4: v4, v5: v5,
             qent: qent, qsai: qsai, wliq: wliq, eta: wliq / qent, pme: wliq / (v1 - v2) };
  };

  /* ---------------- desempenho ---------------- */
  MCI.desempenho = function (p) {
    var g = MCI.geometria(p);
    var x = p.tempos === 2 ? 1 : 2;                 /* ciclos por volta */
    var n = p.rpm / 60;
    var Pot = p.pme * 1e5 * g.Vtot * n / x;         /* W, pme em bar */
    var T = Pot / (2 * Math.PI * n);                /* N·m */
    var rhoAr = p.Padm / (R * (p.Tadm + 273.15));         /* kg/m³ — Padm em kPa, R em kJ/kg·K */
    var mAr = p.etaV / 100 * rhoAr * g.Vtot * n / x;      /* kg/s */
    var mComb = mAr / p.afr;                        /* kg/s */
    var Qcomb = mComb * p.pci * 1000;               /* W */
    var etaT = Pot / Qcomb;
    var ce = mComb * 3.6e9 / Pot;                   /* g/kWh */
    var Potind = Pot / (p.etaM / 100);
    return { g: g, Pot: Pot, PotCV: Pot / 735.5, T: T, mAr: mAr, mComb: mComb, Qcomb: Qcomb,
             etaT: etaT, ce: ce, Potind: Potind, Patrito: Potind - Pot, rhoAr: rhoAr,
             consumoH: mComb * 3600, vm: g.vm, pmeInd: p.pme / (p.etaM / 100) };
  };

  /* ---------------- combustão ---------------- */
  MCI.COMBUSTIVEIS = {
    gasolina: { nome: 'Gasolina (C₈H₁₈)', C: 8, H: 18, O: 0, M: 114.23, pci: 44000, octano: 95, cetano: null, rho: 745 },
    etanol:   { nome: 'Etanol (C₂H₅OH)', C: 2, H: 6, O: 1, M: 46.07, pci: 26800, octano: 109, cetano: null, rho: 789 },
    diesel:   { nome: 'Diesel (C₁₂H₂₃)', C: 12, H: 23, O: 0, M: 167.31, pci: 42500, octano: null, cetano: 50, rho: 840 },
    metano:   { nome: 'Gás natural (CH₄)', C: 1, H: 4, O: 0, M: 16.04, pci: 50000, octano: 120, cetano: null, rho: 0.717 },
    biodiesel: { nome: 'Biodiesel (C₁₉H₃₄O₂)', C: 19, H: 34, O: 2, M: 294.5, pci: 37500, octano: null, cetano: 55, rho: 880 }
  };
  MCI.combustao = function (p) {
    var f = MCI.COMBUSTIVEIS[p.comb];
    var a = f.C + f.H / 4 - f.O / 2;                /* mols de O₂ por mol de combustível */
    var molAr = a / 0.21;                           /* mols de ar */
    var AFR = molAr * 28.97 / f.M;                  /* base mássica */
    var lam = p.lambda;
    var aReal = a * lam;
    var prod = { CO2: f.C, H2O: f.H / 2, N2: 3.76 * aReal, O2: Math.max(0, (lam - 1) * a) };
    var molProd = prod.CO2 + prod.H2O + prod.N2 + prod.O2;
    var rica = lam < 1;
    return { f: f, a: a, AFR: AFR, AFRreal: AFR * lam, lambda: lam, phi: 1 / lam, rica: rica,
             prod: prod, molProd: molProd, percCO2: 100 * prod.CO2 / molProd,
             percH2O: 100 * prod.H2O / molProd, percO2: 100 * prod.O2 / molProd,
             percN2: 100 * prod.N2 / molProd, energia: f.pci };
  };


  /* curva característica: rendimento volumétrico em função da rotação e atrito
     pelo ajuste de Heywood, fmep [bar] = 0,97 + 0,15(N/1000) + 0,05(N/1000)²  */
  MCI.curva = function (p, rpm) {
    var g = MCI.geometria({ D: p.D, S: p.S, rc: p.rc, z: p.z, rpm: rpm, L: p.L });
    var x = p.tempos === 2 ? 1 : 2, n = rpm / 60;
    var rel = (rpm - p.rpmEtaV) / p.rpmEtaV;
    var etaV = p.etaV / 100 * (1 - 0.55 * rel * rel);          /* pico em rpmEtaV */
    etaV = Math.max(0.2, etaV);
    var rho = p.Padm / (R * (p.Tadm + 273.15));
    var pmeInd = p.etaInd / 100 * etaV * rho * p.pci / p.afr / 100;   /* bar */
    var fmep = 0.97 + 0.15 * (rpm / 1000) + 0.05 * Math.pow(rpm / 1000, 2);
    var pme = pmeInd - fmep;
    var Pot = pme * 1e5 * g.Vtot * n / x;
    var T = Pot > 0 ? Pot / (2 * Math.PI * n) : 0;
    var mComb = etaV * rho * g.Vtot * n / x / p.afr;
    return { rpm: rpm, etaV: etaV, pmeInd: pmeInd, fmep: fmep, pme: pme, Pot: Pot, T: T,
             etaM: pme / pmeInd, etaT: Pot / (mComb * p.pci * 1000),
             ce: Pot > 0 ? mComb * 3.6e9 / Pot : NaN, vm: g.vm, mComb: mComb };
  };

  global.MCI = MCI;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Simuladores de Motores de Combustão Interna
     1. sim-motor       : mecanismo biela-manivela e os quatro tempos
     2. sim-ciclos-mci  : ciclos Otto, Diesel e misto (padrão a ar frio)
     3. sim-desempenho  : curvas características, rendimentos e balanço
     4. sim-combustao   : relação ar-combustível, λ e emissões
   ========================================================================== */
(function () {
  'use strict';
  var MCI = window.MCI;
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
     1. Mecanismo biela-manivela e os quatro tempos
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-motor')) return;
    var A = { ctx: null, p: null, g: null, th: 0, rel: relogio(), on: true };

    /* pressão aproximada no cilindro, para colorir o gás e desenhar o laço */
    function pressao(th, p, g) {
      var ciclo = ((th % (2 * TAU)) + 2 * TAU) % (2 * TAU);
      var V = g.Vc + Math.PI * g.D * g.D / 4 * MCI.pistao(th, g.r, p.L / 1000, 1).s;
      var V1 = g.Vc + g.Vd, k = 1.35;
      if (ciclo < TAU / 2) return p.Padm / 100 * 0.92;                 /* admissão */
      if (ciclo < TAU) return (p.Padm / 100) * Math.pow(V1 / V, k);    /* compressão */
      if (ciclo < 1.5 * TAU) {                                          /* expansão */
        var P3 = (p.Padm / 100) * Math.pow(p.rc, k) * p.alfa;
        return P3 * Math.pow(g.Vc / V, k);
      }
      return 1.15;                                                      /* escape */
    }
    function fase(th) {
      var c = ((th % (2 * TAU)) + 2 * TAU) % (2 * TAU);
      if (c < TAU / 2) return 0;
      if (c < TAU) return 1;
      if (c < 1.5 * TAU) return 2;
      return 3;
    }
    var NOMES = ['Admissão', 'Compressão', 'Expansão (trabalho)', 'Escape'];
    var CORES = ['rgb(70,140,230)', 'rgb(230,170,60)', 'rgb(230,70,50)', 'rgb(120,120,130)'];

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, g = A.g;
      if (!p || !g) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var th = A.th, fs = fase(th), q = MCI.pistao(th, g.r, p.L / 1000, 1);
      /* escala: o desenho ocupa a metade esquerda */
      var alt = (p.S + p.L + p.S / 2) / 1000;
      var esc = Math.min((a.w * 0.42) / (p.D / 1000 * 2.6), (a.h - 60) / alt);
      var cxm = a.x + a.w * 0.22, cym = a.y + a.h - 40;               /* centro da manivela */
      var X = function (v) { return cxm + v * esc; }, Y = function (v) { return cym - v * esc; };
      var D = p.D / 1000, S = p.S / 1000, r = g.r, L = p.L / 1000;
      var yPino = q.x;                                                 /* altura do pino acima do eixo */
      var yTopo = r + L + (g.Vc / (Math.PI * D * D / 4));              /* topo da câmara */
      /* cilindro */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(X(-D / 2), Y(0)); c.lineTo(X(-D / 2), Y(yTopo));
      c.lineTo(X(D / 2), Y(yTopo)); c.lineTo(X(D / 2), Y(0)); c.stroke();
      /* gás */
      var Pcil = pressao(th, p, g);
      var fQuente = Math.min(1, Math.max(0, (Pcil - 1) / 60));
      c.fillStyle = fs === 0 ? 'rgba(70,140,230,0.28)' : fs === 3 ? 'rgba(120,120,130,0.3)'
        : 'rgba(' + Math.round(120 + 130 * fQuente) + ',' + Math.round(140 - 90 * fQuente) + ',60,' + (0.25 + 0.45 * fQuente) + ')';
      c.fillRect(X(-D / 2), Y(yTopo), D * esc, (yTopo - yPino) * esc);
      /* pistão */
      var hPist = D * 0.7;
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.55;
      c.fillRect(X(-D / 2), Y(yPino), D * esc, hPist * esc); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.5;
      c.strokeRect(X(-D / 2), Y(yPino), D * esc, hPist * esc);
      /* biela e manivela */
      var xMan = r * Math.sin(th), yMan = r * Math.cos(th);
      c.strokeStyle = Plot.serie(3); c.lineWidth = Math.max(3, D * esc * 0.09); c.lineCap = 'round';
      c.beginPath(); c.moveTo(X(0), Y(yPino)); c.lineTo(X(xMan), Y(yMan)); c.stroke();
      c.strokeStyle = Plot.serie(4);
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(xMan), Y(yMan)); c.stroke();
      c.lineCap = 'butt';
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff'); c.strokeStyle = cor; c.lineWidth = 1.4;
      [[0, 0, 7], [xMan, yMan, 5], [0, yPino, 5]].forEach(function (o) {
        c.beginPath(); c.arc(X(o[0]), Y(o[1]), o[2], 0, TAU); c.fill(); c.stroke();
      });
      c.setLineDash([3, 3]); c.strokeStyle = faint; c.lineWidth = 1;
      c.beginPath(); c.arc(X(0), Y(0), r * esc, 0, TAU); c.stroke(); c.setLineDash([]);
      /* válvulas */
      var cicloG = (((th % (2 * TAU)) + 2 * TAU) % (2 * TAU)) * 180 / Math.PI;
      var abreAdm = cicloG > 355 || cicloG < 190, abreEsc = cicloG > 530 && cicloG < 725;
      [[-D * 0.25, abreAdm, 'adm', 'rgb(70,140,230)'], [D * 0.25, abreEsc, 'esc', 'rgb(200,80,60)']].forEach(function (v) {
        var curso = v[1] ? D * 0.08 : 0;
        c.strokeStyle = v[3]; c.lineWidth = 3;
        c.beginPath(); c.moveTo(X(v[0]), Y(yTopo + D * 0.35)); c.lineTo(X(v[0]), Y(yTopo - curso)); c.stroke();
        c.beginPath();
        c.moveTo(X(v[0] - D * 0.11), Y(yTopo - curso)); c.lineTo(X(v[0] + D * 0.11), Y(yTopo - curso)); c.stroke();
        rotulo(c, v[2], X(v[0]), Y(yTopo + D * 0.45), v[3], 10, '700');
      });
      /* vela ou injetor */
      if (p.ignicao === 'centelha') {
        c.strokeStyle = 'rgb(240,200,60)'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(X(0), Y(yTopo + D * 0.3)); c.lineTo(X(0), Y(yTopo)); c.stroke();
        if (fs === 2 && cicloG < 375) {
          c.fillStyle = 'rgb(255,230,120)';
          c.beginPath(); c.arc(X(0), Y(yTopo - D * 0.05), 5 + 3 * Math.random(), 0, TAU); c.fill();
        }
        rotulo(c, 'vela', X(0), Y(yTopo + D * 0.42), 'rgb(240,200,60)', 10, '700');
      } else {
        c.strokeStyle = 'rgb(120,200,255)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(X(0), Y(yTopo + D * 0.3)); c.lineTo(X(0), Y(yTopo)); c.stroke();
        if (fs === 2 && cicloG < 400) {
          c.fillStyle = 'rgba(160,220,255,0.8)';
          for (var j = 0; j < 6; j++) {
            var ang = -Math.PI / 2 + (j - 2.5) * 0.18;
            c.beginPath();
            c.arc(X(0) + Math.cos(ang) * D * esc * 0.3, Y(yTopo) - Math.sin(ang) * D * esc * 0.3, 2.5, 0, TAU);
            c.fill();
          }
        }
        rotulo(c, 'injetor', X(0), Y(yTopo + D * 0.42), 'rgb(120,200,255)', 10, '700');
      }
      /* rótulos */
      rotulo(c, NOMES[fs], a.x + a.w * 0.22, a.y + 16, CORES[fs], 14, '700');
      rotulo(c, 'ângulo de virabrequim: ' + sg(cicloG, 3) + '°', a.x + a.w * 0.22, a.y + 34, faint, 10.5, '600');
      rotulo(c, 'PMS', X(-D / 2) - 12, Y(yTopo - (g.Vc / (Math.PI * D * D / 4))), faint, 9.5, '600', 'right');
      rotulo(c, 'PMI', X(-D / 2) - 12, Y(r + L - S), faint, 9.5, '600', 'right');
      c.setLineDash([2, 4]); c.strokeStyle = faint;
      [yTopo - g.Vc / (Math.PI * D * D / 4), r + L - S].forEach(function (yv) {
        c.beginPath(); c.moveTo(X(-D / 2) - 8, Y(yv)); c.lineTo(X(D / 2) + 8, Y(yv)); c.stroke();
      });
      c.setLineDash([]);
      /* painel com o estado atual */
      var lx = a.x + a.w * 0.52, ly = a.y + 30;
      var linhas = [
        ['deslocamento a partir do PMS', sg(q.s * 1000, 4) + ' mm'],
        ['velocidade do pistão', sg(q.v * A.w, 4) + ' m/s'],
        ['aceleração', sg(q.a * A.w * A.w / 1000, 4) + ' km/s²'],
        ['volume do cilindro', sg((g.Vc + Math.PI * D * D / 4 * q.s) * 1e6, 4) + ' cm³'],
        ['pressão aproximada', sg(Pcil, 3) + ' bar'],
        ['velocidade média do pistão', sg(g.vm, 3) + ' m/s']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, cor, 12, '700', 'left');
      });
      /* diagrama dos tempos */
      var bx = lx, by = ly + 6 * 34 + 10, bw = a.w * 0.4, bh = 16;
      for (var t = 0; t < 4; t++) {
        c.fillStyle = CORES[t]; c.globalAlpha = t === fs ? 0.85 : 0.25;
        c.fillRect(bx + t * bw / 4, by, bw / 4 - 2, bh); c.globalAlpha = 1;
        rotulo(c, ['adm', 'comp', 'exp', 'esc'][t], bx + t * bw / 4 + bw / 8, by + bh / 2, '#fff', 10, '700');
      }
      rotulo(c, 'dois giros do virabrequim = um ciclo', bx, by + bh + 14, faint, 10, '400', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('motor');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
      /* diagrama P-V acompanhando o ciclo */
      var p = A.p, g = A.g;
      var gv = A.ctx.plot('pv').clear();
      var Vs = [], Ps = [], i;
      for (i = 0; i <= 360; i++) {
        var thv = i * TAU / 180;
        var V = (g.Vc + Math.PI * g.D * g.D / 4 * MCI.pistao(thv, g.r, p.L / 1000, 1).s) * 1e6;
        Vs.push(V); Ps.push(pressao(thv, p, g));
      }
      gv.line(Vs, Ps, { color: Plot.serie(3), width: 2.2, label: 'ciclo aproximado' });
      var Vat = (g.Vc + Math.PI * g.D * g.D / 4 * MCI.pistao(A.th, g.r, p.L / 1000, 1).s) * 1e6;
      gv.marker(Vat, pressao(A.th, p, g), '', { color: 'rgb(230,60,40)', r: 5 });
      gv.setLimits([0, (g.Vc + g.Vd) * 1e6 * 1.05], [0, Math.max.apply(null, Ps) * 1.1]).draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.th += dt * A.vel;
      desenha();
    });

    Sim.build('#sim-motor', {
      titulo: 'Mecanismo biela-manivela e os quatro tempos',
      descricao: 'O pistão não se move harmonicamente: a biela finita distorce o movimento, e é por isso que a aceleração no PMS é maior que no PMI. Acompanhe os quatro tempos, a abertura das válvulas e o ponto do ciclo no diagrama pressão-volume.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Motor 1.8 de 4 cilindros', desc: '80 × 90 mm, rc 10, ignição por centelha', valores: { D: 80, S: 90, L: 150, rc: 10, z: 4, rpm: 3000, ignicao: 'centelha', alfa: 2.2, Padm: 100, animar: true, vel: 1.2 } },
        { nome: '2 · Diesel', desc: 'rc 18, injeção direta', valores: { D: 95, S: 105, L: 170, rc: 18, z: 4, rpm: 2000, ignicao: 'compressao', alfa: 1.6, Padm: 100, animar: true, vel: 1.2 } },
        { nome: '3 · Motor de alto giro', desc: 'curso curto: menor velocidade média do pistão', valores: { D: 88, S: 72, L: 130, rc: 12, z: 4, rpm: 7000, ignicao: 'centelha', alfa: 2.4, Padm: 100, animar: true, vel: 1.2 } },
        { nome: '4 · Motor marítimo lento', desc: 'curso longo, 120 rpm', valores: { D: 300, S: 600, L: 900, rc: 16, z: 6, rpm: 120, ignicao: 'compressao', alfa: 1.5, Padm: 250, animar: true, vel: 0.8 } },
        { nome: '5 · Turbinado', desc: 'admissão a 1,8 bar', valores: { D: 80, S: 90, L: 150, rc: 9, z: 4, rpm: 4000, ignicao: 'centelha', alfa: 2.6, Padm: 180, animar: true, vel: 1.2 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Geometria' },
        { id: 'D', label: 'Diâmetro do cilindro', min: 50, max: 400, step: 1, valor: 80, unidade: 'mm' },
        { id: 'S', label: 'Curso', min: 40, max: 800, step: 1, valor: 90, unidade: 'mm' },
        { id: 'L', label: 'Comprimento da biela', min: 70, max: 1200, step: 1, valor: 150, unidade: 'mm' },
        { id: 'rc', label: 'Taxa de compressão', min: 6, max: 24, step: 0.5, valor: 10, unidade: ':1' },
        { id: 'z', label: 'Número de cilindros', min: 1, max: 16, step: 1, valor: 4, unidade: '' },
        { tipo: 'titulo', label: 'Operação' },
        { id: 'rpm', label: 'Rotação', min: 60, max: 9000, step: 10, valor: 3000, unidade: 'rpm' },
        { id: 'ignicao', tipo: 'seg', label: 'Ignição', valor: 'centelha',
          opcoes: [{ v: 'centelha', t: 'Centelha (Otto)' }, { v: 'compressao', t: 'Compressão (Diesel)' }] },
        { id: 'Padm', label: 'Pressão de admissão', min: 40, max: 300, step: 5, valor: 100, unidade: 'kPa' },
        { id: 'alfa', label: 'Razão de pressão na combustão', min: 1.2, max: 3.5, step: 0.1, valor: 2.2, unidade: '' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.2, max: 4, step: 0.1, valor: 1.2, unidade: 'rad/s' }
      ],
      graficos: [
        { id: 'motor', axes: false, height: 400, grid: false, legend: false },
        { id: 'pv', titulo: 'Diagrama pressão-volume (aproximado)', xlabel: 'Volume do cilindro (cm³)', ylabel: 'Pressão (bar)', aspect: 0.45, legendPos: 'topright' },
        { id: 'cin', titulo: 'Cinemática do pistão ao longo de uma volta', xlabel: 'Ângulo de virabrequim (°)', ylabel: 'valor normalizado', aspect: 0.42, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'cil', label: 'Cilindrada total' },
        { id: 'unit', label: 'Cilindrada unitária' },
        { id: 'Vc', label: 'Volume da câmara' },
        { id: 'rel', label: 'Relação curso/diâmetro' },
        { id: 'lam', label: 'Relação r/L' },
        { id: 'vm', label: 'Velocidade média do pistão' },
        { id: 'amax', label: 'Aceleração máxima' },
        { id: 'estado', label: 'Classificação' }
      ],
      formulas: [
        { g: 'Geometria' },
        { tex: 'V_d = \\frac{\\pi D^2}{4}S \\qquad V_{total} = z\\,V_d \\qquad r_c = \\frac{V_d + V_c}{V_c}', d: 'cilindrada unitária, total e taxa de compressão', destaque: true },
        { tex: '\\bar{v}_p = \\frac{2 S n}{60}', d: 'velocidade média do pistão; limite prático de 8 a 15 m/s pela fadiga e pelo atrito', destaque: true },
        { g: 'Cinemática (θ medido a partir do PMS)' },
        { tex: 's(\\theta) = r + L - \\left(r\\cos\\theta + \\sqrt{L^2 - r^2\\text{sen}^2\\theta}\\right)', d: 'deslocamento exato do pistão', destaque: true },
        { tex: 'a_{PMS} \\approx \\omega^2 r\\,(1 + \\lambda) \\qquad a_{PMI} \\approx \\omega^2 r\\,(1 - \\lambda)', d: 'λ = r/L; a biela finita torna a aceleração no PMS maior' },
        { tex: 'F_{alternante} = m_{alt}\\,a', d: 'força de inércia; é ela que dimensiona a biela e o contrapeso' }
      ],
      passos: [],
      nota: 'A pressão no cilindro é uma aproximação didática (compressão e expansão politrópicas com k = 1,35, admissão e escape a pressão constante): serve para acompanhar o ciclo, não para calcular potência. O cruzamento de válvulas está representado de forma simplificada.',
      calcular: function (p, ctx) {
        var g = MCI.geometria(p);
        g.Lm = p.L / 1000;
        A.ctx = ctx; A.p = p; A.g = g; A.on = !!p.animar;
        A.vel = p.vel; A.w = p.rpm * TAU / 60;
        desenha();

        var gc = ctx.plot('cin').clear();
        var ths = Plot.linspace(0, 360, 181);
        var ss = [], vs = [], as = [];
        ths.forEach(function (t) {
          var q = MCI.pistao(t * Math.PI / 180, g.r, p.L / 1000, 1);
          ss.push(q.s / (p.S / 1000)); vs.push(q.v); as.push(q.a);
        });
        var vMax = Math.max.apply(null, vs.map(Math.abs)), aMax = Math.max.apply(null, as.map(Math.abs));
        gc.line(ths, ss, { color: Plot.serie(0), width: 2.2, label: 's / curso' });
        gc.line(ths, vs.map(function (v) { return v / vMax; }), { color: Plot.serie(2), width: 2.2, label: 'velocidade (normalizada)' });
        gc.line(ths, as.map(function (v) { return v / aMax; }), { color: Plot.serie(3), width: 2.2, label: 'aceleração (normalizada)' });
        gc.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1 });
        gc.setLimits([0, 360], [-1.15, 1.35]).draw();

        var w = p.rpm * TAU / 60;
        var aPMS = Math.abs(MCI.pistao(0, g.r, p.L / 1000, 1).a) * w * w;
        var aPMI = Math.abs(MCI.pistao(Math.PI, g.r, p.L / 1000, 1).a) * w * w;
        var lam = g.r / (p.L / 1000);
        var tipo = g.rel > 1.15 ? 'supraquadrado (curso longo)' : g.rel < 0.95 ? 'subquadrado (curso curto, alto giro)' : 'quadrado';
        ctx.setPassos([
          { t: '① Cilindrada e câmara',
            tex: 'V_d = \\frac{\\pi D^2}{4}S \\qquad V_c = \\frac{V_d}{r_c - 1}',
            texSub: 'V_d = \\frac{\\pi\\cdot' + nt(p.D, 3) + '^2}{4}\\cdot' + nt(p.S, 3) + ' = ' + nt(g.Vd * 1e6, 4) + '\\ cm^3 \\Rightarrow V_{total} = ' + p.z + '\\cdot V_d = ' + nt(g.cilindrada, 4) + '\\ cm^3,\\quad V_c = ' + nt(g.Vc * 1e6, 4) + '\\ cm^3',
            obs: 'A taxa de compressão relaciona os dois volumes: r_c = (V_d + V_c)/V_c = ' + sg(p.rc, 3) + '. É ela que fixa a temperatura no fim da compressão — e, no motor Otto, o limite é a detonação.' },
          { t: '② Velocidade média do pistão',
            tex: '\\bar{v}_p = \\frac{2Sn}{60}',
            texSub: '\\bar{v}_p = \\frac{2\\cdot' + nt(p.S / 1000, 3) + '\\cdot' + nt(p.rpm, 4) + '}{60} = ' + nt(g.vm, 4) + '\\ m/s',
            r: g.vm > 16 ? 'Acima do usual: ' + sg(g.vm, 3) + ' m/s' : 'Dentro da faixa usual',
            obs: 'Motores de automóvel ficam entre 8 e 15 m/s na rotação máxima; motores marítimos lentos, abaixo de 9 m/s. É esse número, e não a rotação, que mede o quanto o motor está solicitado.' },
          { t: '③ Cinemática do pistão',
            tex: 's(\\theta) = r + L - \\left(r\\cos\\theta + \\sqrt{L^2 - r^2\\text{sen}^2\\theta}\\right),\\quad \\lambda = r/L',
            texSub: '\\lambda = \\frac{' + nt(g.r * 1000, 3) + '}{' + nt(p.L, 3) + '} = ' + nt(lam, 3) + ' \\Rightarrow a_{PMS} = ' + nt(aPMS / 1000, 4) + '\\ km/s^2,\\quad a_{PMI} = ' + nt(aPMI / 1000, 4) + '\\ km/s^2',
            obs: 'A aceleração no PMS é ' + sg(aPMS / aPMI, 3) + ' vezes a do PMI: a biela finita "adianta" o movimento na subida. Quanto menor λ (biela mais longa), mais o movimento se aproxima do harmônico simples.' },
          { t: '④ Proporções do motor',
            texSub: 'S/D = ' + nt(g.rel, 3) + ' \\Rightarrow \\text{' + tipo + '}',
            obs: 'Curso longo favorece torque em baixa e melhor combustão; curso curto permite rotação alta com a mesma velocidade média do pistão, e é a escolha de motores esportivos.' }
        ]);
        return {
          cil: { v: g.cilindrada, u: 'cm³', classe: 'destaque' },
          unit: { v: g.Vd * 1e6, u: 'cm³' },
          Vc: { v: g.Vc * 1e6, u: 'cm³' },
          rel: { v: g.rel, u: 'S/D' },
          lam: { v: lam, u: 'r/L' },
          vm: { v: g.vm, u: 'm/s', classe: g.vm > 16 ? 'alerta' : 'destaque' },
          amax: { v: aPMS / 1000, u: 'km/s²' },
          estado: { v: tipo, u: '' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Ciclos teóricos: Otto, Diesel e misto
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-ciclos-mci')) return;

    Sim.build('#sim-ciclos-mci', {
      titulo: 'Ciclos teóricos — Otto, Diesel e misto (Sabathé)',
      descricao: 'Os três ciclos padrão a ar frio diferem apenas em como o calor entra: a volume constante (Otto), a pressão constante (Diesel) ou em duas partes (misto, o que mais se parece com o motor real). Com a mesma taxa de compressão o Otto é sempre o mais eficiente — mas o Diesel pode usar taxas muito maiores, e é aí que ele ganha.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Otto de automóvel', desc: 'rc 10, só calor a volume constante', valores: { rc: 10, alfa: 3, corte: 1.0, k: 1.4, T1: 300, P1: 100 } },
        { nome: '2 · Diesel', desc: 'rc 18, corte 2 — η = 63 %', valores: { rc: 18, alfa: 1.0, corte: 2, k: 1.4, T1: 300, P1: 100 } },
        { nome: '3 · Ciclo misto', desc: 'o que mais se aproxima do motor real', valores: { rc: 18, alfa: 1.5, corte: 1.5, k: 1.4, T1: 300, P1: 100 } },
        { nome: '4 · Otto com a mesma rc do Diesel', desc: 'comparação injusta na prática: haveria detonação', valores: { rc: 18, alfa: 3, corte: 1.0, k: 1.4, T1: 300, P1: 100 } },
        { nome: '5 · Carga parcial no Diesel', desc: 'corte menor: mais eficiente, menos trabalho', valores: { rc: 18, alfa: 1.0, corte: 1.4, k: 1.4, T1: 300, P1: 100 } },
        { nome: '6 · Efeito de k', desc: 'gases reais têm k menor que 1,4', valores: { rc: 10, alfa: 3, corte: 1.0, k: 1.3, T1: 300, P1: 100 } }
      ],
      controles: [
        { id: 'rc', label: 'Taxa de compressão', min: 5, max: 24, step: 0.5, valor: 18, unidade: ':1' },
        { id: 'alfa', label: 'Razão de pressão α (parte a volume constante)', min: 1, max: 4, step: 0.05, valor: 1.5, unidade: '', desc: 'α = 1 → ciclo Diesel puro' },
        { id: 'corte', label: 'Razão de corte (parte a pressão constante)', min: 1, max: 4, step: 0.05, valor: 1.5, unidade: '', desc: 'corte = 1 → ciclo Otto puro' },
        { tipo: 'separador' },
        { id: 'k', label: 'Razão de calores específicos k', min: 1.25, max: 1.45, step: 0.01, valor: 1.4, unidade: '' },
        { id: 'T1', label: 'Temperatura no início da compressão', min: 250, max: 400, step: 5, valor: 300, unidade: 'K' },
        { id: 'P1', label: 'Pressão no início da compressão', min: 50, max: 300, step: 5, valor: 100, unidade: 'kPa' }
      ],
      graficos: [
        { id: 'pv', titulo: 'Diagrama P-v', xlabel: 'Volume específico (m³/kg)', ylabel: 'Pressão (kPa)', aspect: 0.5, legendPos: 'topright' },
        { id: 'ts', titulo: 'Diagrama T-s', xlabel: 'Entropia relativa (kJ/kg·K)', ylabel: 'Temperatura (K)', aspect: 0.48, legendPos: 'topleft' },
        { id: 'eta', titulo: 'Rendimento × taxa de compressão', xlabel: 'Taxa de compressão', ylabel: 'Rendimento térmico', aspect: 0.45, legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'tipo', label: 'Ciclo equivalente' },
        { id: 'T2', label: 'T no fim da compressão' },
        { id: 'Tmax', label: 'T máxima' },
        { id: 'Pmax', label: 'P máxima' },
        { id: 'qent', label: 'Calor fornecido' },
        { id: 'w', label: 'Trabalho líquido' },
        { id: 'eta', label: 'Rendimento térmico' },
        { id: 'pme', label: 'Pressão média efetiva' }
      ],
      formulas: [
        { g: 'Rendimentos (padrão a ar frio)' },
        { tex: '\\eta_{Otto} = 1 - \\frac{1}{r_c^{\\,k-1}}', d: 'depende só da taxa de compressão', destaque: true },
        { tex: '\\eta_{Diesel} = 1 - \\frac{1}{r_c^{\\,k-1}}\\left[\\frac{r_{corte}^{\\,k} - 1}{k\\,(r_{corte} - 1)}\\right]', d: 'o termo entre colchetes é sempre maior que 1', destaque: true },
        { tex: '\\eta_{misto} = 1 - \\frac{1}{r_c^{\\,k-1}}\\left[\\frac{\\alpha\\,r_{corte}^{\\,k} - 1}{(\\alpha - 1) + k\\,\\alpha\\,(r_{corte} - 1)}\\right]', d: 'α = 1 recai no Diesel; corte = 1 recai no Otto', destaque: true },
        { g: 'Estados' },
        { tex: 'T_2 = T_1 r_c^{\\,k-1} \\qquad P_2 = P_1 r_c^{\\,k}', d: 'compressão isentrópica' },
        { tex: 'q_{ent} = c_v(T_3 - T_2) + c_p(T_4 - T_3) \\qquad q_{sai} = c_v(T_5 - T_1)', d: 'calor entra em duas etapas no ciclo misto' },
        { tex: 'pme = \\frac{w_{líq}}{v_1 - v_2}', d: 'a pressão constante que produziria o mesmo trabalho no mesmo curso', destaque: true }
      ],
      passos: [],
      nota: 'Padrão a ar frio: ar como gás ideal com calores específicos constantes, processos internamente reversíveis, admissão e escape substituídos por rejeição de calor. O motor real tem rendimento bem menor — o ciclo teórico serve para entender as tendências.',
      calcular: function (p, ctx) {
        var e = MCI.cicloEstados(p);
        var tipo = p.corte <= 1.001 ? 'Otto (calor a volume constante)'
          : p.alfa <= 1.001 ? 'Diesel (calor a pressão constante)' : 'Misto (Sabathé)';

        /* P-v */
        var g = ctx.plot('pv').clear();
        var pts = function (va, vb, Pa, k) {
          var xs = Plot.linspace(va, vb, 40);
          return [xs, xs.map(function (v) { return Pa * Math.pow(va / v, k); })];
        };
        var comp = pts(e.v1, e.v2, e.P1, p.k);
        g.line(comp[0], comp[1], { color: Plot.serie(0), width: 2.4, label: '1→2 compressão isentrópica' });
        g.line([e.v2, e.v3], [e.P2, e.P3], { color: 'rgb(230,80,50)', width: 2.6, label: '2→3 calor a volume constante' });
        g.line([e.v3, e.v4], [e.P3, e.P4], { color: 'rgb(230,150,50)', width: 2.6, label: '3→4 calor a pressão constante' });
        var exp = pts(e.v4, e.v5, e.P4, p.k);
        g.line(exp[0], exp[1], { color: Plot.serie(2), width: 2.4, label: '4→5 expansão isentrópica' });
        g.line([e.v5, e.v1], [e.P5, e.P1], { color: Plot.serie(3), width: 2.4, label: '5→1 rejeição de calor' });
        [['1', e.v1, e.P1], ['2', e.v2, e.P2], ['3', e.v3, e.P3], ['4', e.v4, e.P4], ['5', e.v5, e.P5]].forEach(function (q) {
          g.marker(q[1], q[2], q[0], { color: Plot.serie(6), r: 4 });
        });
        g.setLimits([0, e.v1 * 1.05], [0, e.P3 * 1.1]).draw();

        /* T-s: entropia relativa a 1 */
        var gt = ctx.plot('ts').clear();
        var s = function (T, v) { return e.cv * Math.log(T / e.T1) + 0.287 * Math.log(v / e.v1); };
        var linhaT = function (Ta, Tb, va, vb, n) {
          var xs = [], ys = [];
          for (var i = 0; i <= n; i++) {
            var f = i / n, T = Ta + (Tb - Ta) * f, v = va + (vb - va) * f;
            xs.push(s(T, v)); ys.push(T);
          }
          return [xs, ys];
        };
        var c12 = linhaT(e.T1, e.T2, e.v1, e.v2, 20);
        gt.line(c12[0], c12[1], { color: Plot.serie(0), width: 2.4, label: 'compressão (s constante)' });
        var c23 = linhaT(e.T2, e.T3, e.v2, e.v3, 20);
        gt.line(c23[0], c23[1], { color: 'rgb(230,80,50)', width: 2.6, label: 'calor a v constante' });
        var c34 = linhaT(e.T3, e.T4, e.v3, e.v4, 20);
        gt.line(c34[0], c34[1], { color: 'rgb(230,150,50)', width: 2.6, label: 'calor a P constante' });
        var c45 = linhaT(e.T4, e.T5, e.v4, e.v5, 20);
        gt.line(c45[0], c45[1], { color: Plot.serie(2), width: 2.4, label: 'expansão (s constante)' });
        var c51 = linhaT(e.T5, e.T1, e.v5, e.v1, 20);
        gt.line(c51[0], c51[1], { color: Plot.serie(3), width: 2.4, label: 'rejeição a v constante' });
        gt.draw();

        /* η × rc */
        var ge = ctx.plot('eta').clear();
        var rcs = Plot.linspace(5, 24, 60);
        ge.line(rcs, rcs.map(function (r) { return MCI.otto(r, p.k); }), { color: Plot.serie(0), width: 2.2, label: 'Otto' });
        ge.line(rcs, rcs.map(function (r) { return MCI.diesel(r, Math.max(p.corte, 1.05), p.k); }), { color: Plot.serie(2), width: 2.2, label: 'Diesel (corte ' + sg(Math.max(p.corte, 1.05), 3) + ')' });
        ge.line(rcs, rcs.map(function (r) { return MCI.sabathe(r, Math.max(p.alfa, 1.001), Math.max(p.corte, 1.001), p.k); }), { color: Plot.serie(3), width: 2.6, label: 'misto (α ' + sg(p.alfa, 3) + ')' });
        ge.area([9, 9, 12, 12], [0, 1, 1, 0], { color: Plot.serie(5), alpha: 0.07 });
        ge.text(10.5, 0.2, 'faixa Otto', { size: 10, align: 'center' });
        ge.area([16, 16, 22, 22], [0, 1, 1, 0], { color: Plot.serie(1), alpha: 0.07 });
        ge.text(19, 0.2, 'faixa Diesel', { size: 10, align: 'center' });
        ge.marker(p.rc, e.eta, 'seu ciclo', { color: 'rgb(220,60,60)', r: 5 });
        ge.setLimits([5, 24], [0.3, 0.75]).draw();

        ctx.setPassos([
          { t: '① Compressão isentrópica 1→2',
            tex: 'T_2 = T_1 r_c^{\\,k-1} \\qquad P_2 = P_1 r_c^{\\,k}',
            texSub: 'T_2 = ' + nt(p.T1, 4) + '\\cdot' + nt(p.rc, 3) + '^{' + nt(p.k - 1, 3) + '} = ' + nt(e.T2, 4) + '\\ K,\\quad P_2 = ' + nt(e.P2, 4) + '\\ kPa',
            obs: 'No Diesel é essa temperatura que precisa passar da temperatura de autoignição do combustível (≈ 500 °C) — por isso a taxa de compressão alta.' },
          { t: '② Fornecimento de calor',
            tex: 'q_{ent} = c_v(T_3 - T_2) + c_p(T_4 - T_3)',
            texSub: 'T_3 = ' + nt(e.T3, 4) + '\\ K,\\ T_4 = ' + nt(e.T4, 4) + '\\ K \\Rightarrow q_{ent} = ' + nt(e.qent, 4) + '\\ kJ/kg',
            obs: 'No Otto todo o calor entra com o pistão parado no PMS (volume constante); no Diesel, enquanto o pistão desce e a pressão se mantém.' },
          { t: '③ Expansão e rejeição',
            tex: 'T_5 = T_4\\left(\\frac{v_4}{v_5}\\right)^{k-1} \\qquad q_{sai} = c_v(T_5 - T_1)',
            texSub: 'T_5 = ' + nt(e.T5, 4) + '\\ K \\Rightarrow q_{sai} = ' + nt(e.qsai, 4) + '\\ kJ/kg' },
          { t: '④ Rendimento e pressão média efetiva',
            tex: '\\eta = 1 - \\frac{q_{sai}}{q_{ent}} \\qquad pme = \\frac{w_{líq}}{v_1 - v_2}',
            texSub: '\\eta = 1 - \\frac{' + nt(e.qsai, 4) + '}{' + nt(e.qent, 4) + '} = ' + nt(e.eta, 4) + ' \\qquad pme = ' + nt(e.pme, 4) + '\\ kPa',
            r: tipo + ': η = ' + sg(100 * e.eta, 3) + ' %',
            obs: 'Com a mesma taxa de compressão, o Otto seria mais eficiente (' + sg(100 * MCI.otto(p.rc, p.k), 3) + ' %). O Diesel ganha na prática porque pode comprimir 18:1 ou mais sem detonar, enquanto o Otto para em 10 ou 12:1.' }
        ]);
        return {
          tipo: { v: tipo, u: '' },
          T2: { v: e.T2, u: 'K' },
          Tmax: { v: e.T4, u: 'K' },
          Pmax: { v: e.P3, u: 'kPa' },
          qent: { v: e.qent, u: 'kJ/kg' },
          w: { v: e.wliq, u: 'kJ/kg' },
          eta: { v: e.eta, u: '', classe: 'destaque' },
          pme: { v: e.pme, u: 'kPa' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Curvas características, rendimentos e balanço energético
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-desempenho')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      /* ---- fluxo de energia (Sankey simplificado) ---- */
      var x0 = a.x + 30, x1 = a.x + a.w * 0.62, yTop = a.y + 40, alt = a.h - 110;
      var fr = { util: r.etaT, atrito: r.fAtrito, escape: r.fEscape, arref: r.fArref };
      var soma = fr.util + fr.atrito + fr.escape + fr.arref;
      ['util', 'atrito', 'escape', 'arref'].forEach(function (k) { fr[k] /= soma; });
      var ordem = [['util', 'trabalho no eixo', 'rgb(60,170,110)'], ['atrito', 'atrito e acessórios', 'rgb(150,120,200)'],
                   ['arref', 'arrefecimento', 'rgb(70,140,230)'], ['escape', 'gases de escape', 'rgb(230,90,60)']];
      /* entrada */
      c.fillStyle = 'rgb(230,170,60)'; c.globalAlpha = 0.6;
      c.fillRect(x0, yTop, 26, alt); c.globalAlpha = 1;
      rotulo(c, 'energia do', x0 + 13, yTop - 24, cor, 10.5, '700');
      rotulo(c, 'combustível', x0 + 13, yTop - 11, cor, 10.5, '700');
      rotulo(c, sg(r.Qcomb / 1000, 4) + ' kW', x0 + 13, yTop + alt + 14, cor, 11, '700');
      var y = yTop;
      ordem.forEach(function (o, i) {
        var h = fr[o[0]] * alt;
        /* faixa ligando a entrada à saída */
        c.fillStyle = o[2]; c.globalAlpha = 0.35;
        c.beginPath();
        c.moveTo(x0 + 26, y); c.lineTo(x1, yTop + i * (alt / 4) + (alt / 4 - h) / 2);
        c.lineTo(x1, yTop + i * (alt / 4) + (alt / 4 - h) / 2 + h); c.lineTo(x0 + 26, y + h);
        c.closePath(); c.fill(); c.globalAlpha = 1;
        /* partículas correndo */
        c.fillStyle = o[2];
        for (var j = 0; j < 4; j++) {
          var f = ((A.t * 0.35 + j / 4 + i * 0.13) % 1);
          var ya = y + h / 2, yb = yTop + i * (alt / 4) + alt / 8;
          c.beginPath(); c.arc(x0 + 26 + f * (x1 - x0 - 26), ya + (yb - ya) * f, 2.6, 0, TAU); c.fill();
        }
        var yc = yTop + i * (alt / 4) + alt / 8;
        rotulo(c, o[1], x1 + 12, yc - 7, o[2], 11.5, '700', 'left');
        rotulo(c, sg(100 * fr[o[0]], 3) + ' %   ·   ' + sg(r.Qcomb * fr[o[0]] / 1000, 3) + ' kW', x1 + 12, yc + 8, faint, 10.5, '400', 'left');
        y += h;
      });
      rotulo(c, 'Balanço energético a ' + sg(p.rpm, 4) + ' rpm', a.x + a.w * 0.35, a.y + 14, cor, 12.5, '700');
      /* sobrealimentação */
      if (p.Padm > 105) {
        var tx = a.x + 40, ty = a.y + a.h - 40;
        c.strokeStyle = Plot.serie(3); c.lineWidth = 2;
        c.beginPath(); c.arc(tx, ty, 16, 0, TAU); c.stroke();
        for (var k = 0; k < 6; k++) {
          var an = A.t * 6 + k * TAU / 6;
          c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + 14 * Math.cos(an), ty - 14 * Math.sin(an)); c.stroke();
        }
        rotulo(c, 'sobrealimentado: ' + sg(p.Padm, 4) + ' kPa', tx + 26, ty, Plot.serie(3), 11, '700', 'left');
      } else {
        rotulo(c, 'aspirado naturalmente', a.x + 40, a.y + a.h - 40, faint, 11, '600', 'left');
      }
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('balanco');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-desempenho', {
      titulo: 'Curvas características, rendimentos e balanço energético',
      descricao: 'Torque e potência não sobem juntos: o torque acompanha o rendimento volumétrico e cai quando o motor não consegue mais respirar, enquanto a potência ainda cresce com a rotação até o atrito vencer. O consumo específico é mínimo perto do pico de torque, e o balanço mostra para onde vai o resto da energia do combustível.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Motor 1.8 aspirado', desc: 'gasolina, pico de ηv a 4000 rpm', valores: { D: 80, S: 90, L: 150, z: 4, rc: 10, tempos: 4, rpm: 3000, etaV: 90, rpmEtaV: 4000, etaInd: 38, Padm: 100, Tadm: 40, comb: 'gasolina' } },
        { nome: '2 · O mesmo motor turbinado', desc: 'admissão a 180 kPa', valores: { D: 80, S: 90, L: 150, z: 4, rc: 9, tempos: 4, rpm: 3000, etaV: 90, rpmEtaV: 4000, etaInd: 38, Padm: 180, Tadm: 55, comb: 'gasolina' } },
        { nome: '3 · Diesel de caminhão', desc: '7,2 L, rotação baixa, alto rendimento', valores: { D: 108, S: 130, L: 210, z: 6, rc: 17, tempos: 4, rpm: 1600, etaV: 92, rpmEtaV: 1800, etaInd: 47, Padm: 220, Tadm: 45, comb: 'diesel' } },
        { nome: '4 · Motor a etanol', desc: 'mais combustível por kg de ar, rc maior', valores: { D: 80, S: 90, L: 150, z: 4, rc: 12.5, tempos: 4, rpm: 3500, etaV: 90, rpmEtaV: 4000, etaInd: 40, Padm: 100, Tadm: 40, comb: 'etanol' } },
        { nome: '5 · Motor marítimo 2 tempos', desc: 'um ciclo por volta, 120 rpm', valores: { D: 300, S: 600, L: 900, z: 6, rc: 16, tempos: 2, rpm: 120, etaV: 90, rpmEtaV: 130, etaInd: 52, Padm: 300, Tadm: 45, comb: 'diesel' } },
        { nome: '6 · Em alta rotação', desc: 'o atrito come o ganho', valores: { D: 80, S: 90, L: 150, z: 4, rc: 10, tempos: 4, rpm: 6500, etaV: 90, rpmEtaV: 4000, etaInd: 38, Padm: 100, Tadm: 40, comb: 'gasolina' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Motor' },
        { id: 'D', label: 'Diâmetro do cilindro', min: 50, max: 400, step: 1, valor: 80, unidade: 'mm' },
        { id: 'S', label: 'Curso', min: 40, max: 800, step: 1, valor: 90, unidade: 'mm' },
        { id: 'L', label: 'Comprimento da biela', min: 70, max: 1200, step: 1, valor: 150, unidade: 'mm' },
        { id: 'z', label: 'Cilindros', min: 1, max: 16, step: 1, valor: 4, unidade: '' },
        { id: 'rc', label: 'Taxa de compressão', min: 6, max: 24, step: 0.5, valor: 10, unidade: ':1' },
        { id: 'tempos', tipo: 'seg', label: 'Ciclo', valor: 4, opcoes: [{ v: 4, t: '4 tempos' }, { v: 2, t: '2 tempos' }] },
        { tipo: 'titulo', label: 'Respiração e combustão' },
        { id: 'rpm', label: 'Rotação de operação', min: 60, max: 9000, step: 10, valor: 3000, unidade: 'rpm' },
        { id: 'etaV', label: 'Rendimento volumétrico máximo', min: 50, max: 110, step: 1, valor: 90, unidade: '%' },
        { id: 'rpmEtaV', label: 'Rotação do pico de ηv', min: 100, max: 8000, step: 50, valor: 4000, unidade: 'rpm' },
        { id: 'etaInd', label: 'Rendimento indicado', min: 20, max: 55, step: 1, valor: 38, unidade: '%' },
        { id: 'Padm', label: 'Pressão de admissão', min: 40, max: 350, step: 5, valor: 100, unidade: 'kPa' },
        { id: 'Tadm', label: 'Temperatura de admissão', min: 0, max: 120, step: 1, valor: 40, unidade: '°C' },
        { id: 'comb', tipo: 'select', label: 'Combustível', valor: 'gasolina',
          opcoes: [{ v: 'gasolina', t: 'Gasolina' }, { v: 'etanol', t: 'Etanol' }, { v: 'diesel', t: 'Diesel' }, { v: 'metano', t: 'Gás natural' }] }
      ],
      graficos: [
        { id: 'balanco', axes: false, height: 330, grid: false, legend: false },
        { id: 'curvas', titulo: 'Curvas de torque e potência', xlabel: 'Rotação (rpm)', ylabel: 'Torque (N·m) · Potência (kW)', aspect: 0.48, legendPos: 'topleft' },
        { id: 'ce', titulo: 'Consumo específico', xlabel: 'Rotação (rpm)', ylabel: 'ce (g/kWh)', aspect: 0.42, legendPos: 'topleft' },
        { id: 'rends', titulo: 'Rendimentos × rotação', xlabel: 'Rotação (rpm)', ylabel: 'rendimento (%)', aspect: 0.42, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'cil', label: 'Cilindrada' },
        { id: 'pme', label: 'pme efetiva' },
        { id: 'T', label: 'Torque' },
        { id: 'P', label: 'Potência' },
        { id: 'etaV', label: 'Rendimento volumétrico' },
        { id: 'etaM', label: 'Rendimento mecânico' },
        { id: 'etaT', label: 'Rendimento térmico' },
        { id: 'ce', label: 'Consumo específico' },
        { id: 'cons', label: 'Consumo horário' },
        { id: 'pico', label: 'Picos' }
      ],
      formulas: [
        { g: 'Da pressão média à potência' },
        { tex: 'P = \\frac{pme \\cdot V_{total} \\cdot n}{x}', d: 'x = 2 no 4 tempos (um ciclo a cada 2 voltas) e 1 no 2 tempos; n em rev/s', destaque: true },
        { tex: 'T = \\frac{P}{2\\pi n} = \\frac{pme \\cdot V_{total}}{2\\pi x}', d: 'o torque não depende da rotação: só da pme e da cilindrada', destaque: true },
        { g: 'Rendimentos' },
        { tex: '\\eta_v = \\frac{\\dot m_{ar}}{\\rho_{adm} V_{total} n/x}', d: 'volumétrico: o quanto o motor consegue respirar', destaque: true },
        { tex: '\\eta_m = \\frac{P_{efetiva}}{P_{indicada}} = \\frac{pme}{pmi}', d: 'mecânico: desconta atrito e acessórios' },
        { tex: '\\eta_t = \\frac{P}{\\dot m_c\\,PCI} = \\frac{3{,}6\\times10^{6}}{ce\\,\\cdot\\,PCI}', d: 'térmico efetivo; ce em g/kWh e PCI em kJ/kg', destaque: true },
        { tex: 'pmf = 0{,}97 + 0{,}15\\frac{N}{1000} + 0{,}05\\left(\\frac{N}{1000}\\right)^2', d: 'perdas por atrito em bar (ajuste de Heywood), crescem com o quadrado da rotação' }
      ],
      passos: [],
      nota: 'O rendimento volumétrico é modelado como uma parábola com máximo na rotação escolhida, e o atrito pela correlação de Heywood — são aproximações de comportamento, calibradas para reproduzir as formas típicas das curvas de catálogo. Rendimento indicado constante com a rotação.',
      calcular: function (p, ctx) {
        var f = MCI.COMBUSTIVEIS[p.comb];
        var afr = MCI.combustao({ comb: p.comb, lambda: 1 }).AFR;
        var base = { D: p.D, S: p.S, L: p.L, z: p.z, rc: p.rc, tempos: p.tempos, etaV: p.etaV,
                     rpmEtaV: p.rpmEtaV, etaInd: p.etaInd, Padm: p.Padm, Tadm: p.Tadm, afr: afr, pci: f.pci };
        var r = MCI.curva(base, p.rpm);
        r.Qcomb = r.mComb * f.pci * 1000;
        /* repartição da energia: útil, atrito, escape e arrefecimento */
        r.fAtrito = (r.pmeInd - r.pme) / r.pmeInd * (r.etaT / Math.max(r.etaM, 0.05)) * r.etaM;
        r.fAtrito = r.etaT * (1 / Math.max(r.etaM, 0.05) - 1);
        var resto = 1 - r.etaT - r.fAtrito;
        r.fEscape = resto * 0.58; r.fArref = resto * 0.42;
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var rpms = Plot.linspace(Math.max(200, p.rpmEtaV * 0.25), p.rpmEtaV * 1.9, 60);
        var dados = rpms.map(function (n) { return MCI.curva(base, n); });
        var gc = ctx.plot('curvas').clear();
        gc.line(rpms, dados.map(function (d) { return d.T; }), { color: Plot.serie(0), width: 2.6, label: 'torque (N·m)' });
        gc.line(rpms, dados.map(function (d) { return d.Pot / 1000; }), { color: Plot.serie(2), width: 2.6, label: 'potência (kW)' });
        var iT = 0, iP = 0;
        dados.forEach(function (d, i) { if (d.T > dados[iT].T) iT = i; if (d.Pot > dados[iP].Pot) iP = i; });
        gc.marker(rpms[iT], dados[iT].T, 'torque máx', { color: Plot.serie(0), r: 4.5 });
        gc.marker(rpms[iP], dados[iP].Pot / 1000, 'potência máx', { color: Plot.serie(2), r: 4.5 });
        gc.vline(p.rpm, { color: Plot.serie(6), text: 'operação' });
        gc.setLimits([rpms[0], rpms[rpms.length - 1]], [0, Math.max(dados[iT].T, dados[iP].Pot / 1000) * 1.2]).draw();

        var ge = ctx.plot('ce').clear();
        ge.line(rpms, dados.map(function (d) { return d.ce; }), { color: Plot.serie(3), width: 2.6, label: 'consumo específico' });
        var ceMin = Math.min.apply(null, dados.map(function (d) { return d.ce; })), iC = 0;
        dados.forEach(function (d, i) { if (d.ce < dados[iC].ce) iC = i; });
        ge.marker(rpms[iC], dados[iC].ce, 'mínimo: ' + sg(dados[iC].ce, 4) + ' g/kWh', { color: Plot.serie(3), r: 4.5 });
        ge.vline(p.rpm, { color: Plot.serie(6), text: 'operação' });
        ge.setLimits([rpms[0], rpms[rpms.length - 1]], [ceMin * 0.8, Math.min(ceMin * 2.4, 900)]).draw();

        var gr = ctx.plot('rends').clear();
        gr.line(rpms, dados.map(function (d) { return d.etaV * 100; }), { color: Plot.serie(1), width: 2.4, label: 'volumétrico ηv' });
        gr.line(rpms, dados.map(function (d) { return d.etaM * 100; }), { color: Plot.serie(4), width: 2.4, label: 'mecânico ηm' });
        gr.line(rpms, dados.map(function (d) { return d.etaT * 100; }), { color: Plot.serie(2), width: 2.4, label: 'térmico ηt' });
        gr.vline(p.rpm, { color: Plot.serie(6) });
        gr.setLimits([rpms[0], rpms[rpms.length - 1]], [0, 105]).draw();

        var x = p.tempos === 2 ? 1 : 2;
        ctx.setPassos([
          { t: '① Ar admitido',
            tex: '\\dot m_{ar} = \\eta_v\\,\\rho_{adm}\\,V_{total}\\,\\frac{n}{x}',
            texSub: '\\rho = \\frac{' + nt(p.Padm, 4) + '}{0{,}287\\cdot' + nt(p.Tadm + 273.15, 4) + '} = ' + nt(p.Padm / (0.287 * (p.Tadm + 273.15)), 4) + '\\ kg/m^3 \\Rightarrow \\dot m_{ar} = ' + nt(r.mComb * afr, 4) + '\\ kg/s',
            obs: 'A sobrealimentação age exatamente aqui: mais pressão na admissão significa mais massa de ar no mesmo volume — e, com a mesma relação ar-combustível, mais potência. O resfriamento do ar (intercooler) aumenta ainda mais a densidade.' },
          { t: '② Da combustão à pressão média indicada',
            tex: 'pmi = \\eta_i\\,\\frac{\\eta_v\\,\\rho\\,PCI}{AFR}',
            texSub: 'pmi = ' + nt(r.pmeInd, 4) + '\\ bar \\qquad (AFR_{estequiométrica} = ' + nt(afr, 3) + ')',
            obs: 'O etanol tem PCI menor, mas também AFR menor: por kg de ar ele entrega mais energia que a gasolina — é por isso que motores flex rendem um pouco mais de potência com etanol.' },
          { t: '③ Atrito e pressão média efetiva',
            tex: 'pmf = 0{,}97 + 0{,}15\\frac{N}{1000} + 0{,}05\\left(\\frac{N}{1000}\\right)^2 \\qquad pme = pmi - pmf',
            texSub: 'pmf = ' + nt(r.fmep, 3) + '\\ bar \\Rightarrow pme = ' + nt(r.pmeInd, 4) + ' - ' + nt(r.fmep, 3) + ' = ' + nt(r.pme, 4) + '\\ bar \\quad (\\eta_m = ' + nt(r.etaM, 3) + ')',
            obs: 'O atrito cresce com o quadrado da rotação. É ele que faz o rendimento mecânico cair e, em última instância, limita a rotação máxima útil.' },
          { t: '④ Torque e potência',
            tex: 'T = \\frac{pme\\,V_{total}}{2\\pi x} \\qquad P = 2\\pi n T',
            texSub: 'T = ' + nt(r.T, 4) + '\\ N\\cdot m \\qquad P = ' + nt(r.Pot / 1000, 4) + '\\ kW = ' + nt(r.Pot / 735.5, 4) + '\\ cv',
            r: 'Torque máximo a ' + sg(rpms[iT], 4) + ' rpm · potência máxima a ' + sg(rpms[iP], 4) + ' rpm',
            obs: 'O torque é proporcional à pme — ou seja, à quantidade de ar que entrou por ciclo. A potência é torque vezes rotação, e por isso o pico acontece bem depois do pico de torque.' },
          { t: '⑤ Consumo e balanço',
            tex: 'ce = \\frac{\\dot m_c}{P} \\qquad \\eta_t = \\frac{3{,}6\\times10^6}{ce\\cdot PCI}',
            texSub: 'ce = ' + nt(r.ce, 4) + '\\ g/kWh \\Rightarrow \\eta_t = ' + nt(r.etaT * 100, 3) + '\\ \\%',
            obs: 'Do total de energia do combustível, cerca de ' + sg(100 * r.etaT, 3) + ' % chega ao eixo; o resto sai pelo escape, pelo sistema de arrefecimento e no atrito interno. Motores Diesel grandes de rotação baixa chegam a 50 % justamente porque perdem menos nessas três vias.' }
        ]);
        return {
          cil: { v: r.g ? r.g.cilindrada : MCI.geometria(base).cilindrada, u: 'cm³' },
          pme: { v: r.pme, u: 'bar' },
          T: { v: r.T, u: 'N·m', classe: 'destaque' },
          P: { v: r.Pot / 1000, u: 'kW (' + sg(r.Pot / 735.5, 4) + ' cv)', classe: 'destaque' },
          etaV: { v: r.etaV * 100, u: '%' },
          etaM: { v: r.etaM * 100, u: '%' },
          etaT: { v: r.etaT * 100, u: '%' },
          ce: { v: r.ce, u: 'g/kWh' },
          cons: { v: r.mComb * 3600, u: 'kg/h' },
          pico: { v: sg(rpms[iT], 4) + ' / ' + sg(rpms[iP], 4), u: 'rpm (torque / potência)' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Combustão: relação ar-combustível, λ e emissões
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-combustao')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var cx = a.x + a.w * 0.26, cy = a.y + a.h * 0.52;
      var W = Math.min(a.w * 0.34, a.h * 0.62), H = W * 0.62;
      /* câmara */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.strokeRect(cx - W / 2, cy - H / 2, W, H);
      /* mistura: cor pela riqueza */
      var rica = r.lambda < 1;
      var fRica = Math.max(0, Math.min(1, (1.3 - r.lambda) / 0.6));
      c.fillStyle = 'rgba(' + Math.round(80 + 150 * fRica) + ',' + Math.round(150 - 60 * fRica) + ',' + Math.round(220 - 150 * fRica) + ',0.25)';
      c.fillRect(cx - W / 2, cy - H / 2, W, H);
      /* frente de chama avançando */
      var avanco = (A.t * 0.55) % 1.6;
      if (avanco < 1) {
        var rF = avanco * W * 0.78;
        var grad = c.createRadialGradient(cx, cy - H * 0.3, rF * 0.25, cx, cy - H * 0.3, Math.max(rF, 1));
        grad.addColorStop(0, 'rgba(255,220,120,0.85)');
        grad.addColorStop(0.7, 'rgba(240,120,50,0.55)');
        grad.addColorStop(1, 'rgba(240,120,50,0)');
        c.save();
        c.beginPath(); c.rect(cx - W / 2, cy - H / 2, W, H); c.clip();
        c.fillStyle = grad;
        c.beginPath(); c.arc(cx, cy - H * 0.3, Math.max(rF, 1), 0, TAU); c.fill();
        c.restore();
      }
      /* moléculas de ar e de combustível */
      c.fillStyle = 'rgba(80,150,230,0.9)';
      for (var i = 0; i < 26; i++) {
        var fx = cx - W / 2 + 8 + ((i * 37 + A.t * 12) % (W - 16));
        var fy = cy - H / 2 + 10 + ((i * 53) % (H - 20));
        c.beginPath(); c.arc(fx, fy, 2.2, 0, TAU); c.fill();
      }
      c.fillStyle = 'rgba(230,160,60,0.95)';
      var nComb = Math.round(26 * (1 / r.lambda) * 0.45);
      for (i = 0; i < nComb; i++) {
        var gx = cx - W / 2 + 14 + ((i * 61 + A.t * 12) % (W - 24));
        var gy = cy - H / 2 + 16 + ((i * 41) % (H - 28));
        c.beginPath(); c.arc(gx, gy, 3, 0, TAU); c.fill();
      }
      rotulo(c, '● ar   ● combustível', cx, cy + H / 2 + 16, faint, 10.5, '600');
      rotulo(c, rica ? 'mistura RICA (λ < 1)' : r.lambda > 1.02 ? 'mistura POBRE (λ > 1)' : 'mistura estequiométrica',
        cx, cy - H / 2 - 16, rica ? 'rgb(230,120,50)' : r.lambda > 1.02 ? 'rgb(70,140,230)' : 'rgb(60,170,110)', 12.5, '700');
      /* detonação */
      if (r.risco) {
        c.strokeStyle = 'rgb(220,60,60)'; c.lineWidth = 2.5;
        for (i = 0; i < 3; i++) {
          var yy = cy + H * 0.3 - i * 6;
          c.beginPath();
          for (var xx = 0; xx <= 8; xx++) {
            var px = cx - W * 0.35 + xx * W * 0.09;
            var py = yy + (xx % 2 ? -4 : 4) * (0.6 + 0.4 * Math.sin(A.t * 20 + i));
            if (xx) c.lineTo(px, py); else c.moveTo(px, py);
          }
          c.stroke();
        }
        rotulo(c, 'risco de detonação', cx, cy + H * 0.44, 'rgb(220,60,60)', 11, '700');
      }
      /* painel */
      var lx = a.x + a.w * 0.56, ly = a.y + 26;
      var linhas = [
        ['combustível', r.f.nome],
        ['AFR estequiométrica (massa)', sg(r.AFR, 4) + ' : 1'],
        ['AFR de operação', sg(r.AFRreal, 4) + ' : 1'],
        ['λ · razão de equivalência φ', sg(r.lambda, 3) + '  ·  ' + sg(r.phi, 3)],
        ['poder calorífico inferior', sg(r.f.pci, 5) + ' kJ/kg'],
        [r.f.octano ? 'octanagem (RON)' : 'número de cetano', sg(r.f.octano || r.f.cetano, 3)]
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, cor, 12, '700', 'left');
      });
      rotulo(c, 'energia por kg de ar: ' + sg(r.f.pci / r.AFR, 4) + ' kJ', lx, ly + 6 * 34 + 6, Plot.serie(3), 11.5, '700', 'left');
      rotulo(c, '(é isso que define a potência, não o PCI sozinho)', lx, ly + 6 * 34 + 22, faint, 10, '400', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('camara');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-combustao', {
      titulo: 'Combustão — relação ar-combustível, λ e emissões',
      descricao: 'A relação ar-combustível estequiométrica sai direto do balanço químico e muda muito de um combustível para outro: 15,1 para a gasolina, 9,0 para o etanol. O fator λ diz o quanto a mistura se afasta da estequiométrica — e é ele que governa potência, consumo, emissões e a possibilidade de usar catalisador de três vias.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Gasolina estequiométrica', desc: 'λ = 1: a janela do catalisador', valores: { comb: 'gasolina', lambda: 1, rc: 10, avanco: 20 } },
        { nome: '2 · Mistura rica (plena carga)', desc: 'λ = 0,88: potência máxima e mais CO', valores: { comb: 'gasolina', lambda: 0.88, rc: 10, avanco: 20 } },
        { nome: '3 · Mistura pobre', desc: 'λ = 1,2: economia, mas NOx e falha de ignição', valores: { comb: 'gasolina', lambda: 1.2, rc: 10, avanco: 20 } },
        { nome: '4 · Etanol', desc: 'AFR 9,0 e octanagem alta permitem rc maior', valores: { comb: 'etanol', lambda: 1, rc: 12.5, avanco: 22 } },
        { nome: '5 · Diesel em carga parcial', desc: 'sempre pobre: a carga se controla pelo combustível', valores: { comb: 'diesel', lambda: 2.5, rc: 18, avanco: 12 } },
        { nome: '6 · Gás natural', desc: 'AFR 17,2 e octanagem muito alta', valores: { comb: 'metano', lambda: 1, rc: 13, avanco: 24 } }
      ],
      controles: [
        { id: 'comb', tipo: 'select', label: 'Combustível', valor: 'gasolina',
          opcoes: Object.keys(MCI.COMBUSTIVEIS).map(function (k) { return { v: k, t: MCI.COMBUSTIVEIS[k].nome }; }) },
        { id: 'lambda', label: 'Fator lambda λ = AFR real / AFR estequiométrica', min: 0.6, max: 3, step: 0.01, valor: 1, unidade: '' },
        { tipo: 'titulo', label: 'Condição do motor' },
        { id: 'rc', label: 'Taxa de compressão', min: 6, max: 24, step: 0.5, valor: 10, unidade: ':1' },
        { id: 'avanco', label: 'Avanço de ignição', min: 0, max: 40, step: 1, valor: 20, unidade: '° antes do PMS' }
      ],
      graficos: [
        { id: 'camara', axes: false, height: 320, grid: false, legend: false },
        { id: 'emissoes', titulo: 'Emissões em função de λ (tendências)', xlabel: 'λ', ylabel: 'concentração relativa', aspect: 0.45, legendPos: 'topright' },
        { id: 'prod', titulo: 'Composição dos produtos de combustão', xlabel: '', ylabel: '% em mols', aspect: 0.4, legend: false }
      ],
      saidas: [
        { id: 'AFR', label: 'AFR estequiométrica' },
        { id: 'AFRreal', label: 'AFR de operação' },
        { id: 'phi', label: 'Razão de equivalência φ' },
        { id: 'energia', label: 'Energia por kg de ar' },
        { id: 'CO2', label: 'CO₂ nos produtos' },
        { id: 'O2', label: 'O₂ nos produtos' },
        { id: 'tipo', label: 'Mistura' },
        { id: 'deto', label: 'Detonação' }
      ],
      formulas: [
        { g: 'Balanço estequiométrico' },
        { tex: 'C_nH_mO_p + a\\,(O_2 + 3{,}76\\,N_2) \\to n\\,CO_2 + \\frac{m}{2}H_2O + 3{,}76a\\,N_2', d: 'com a = n + m/4 − p/2', destaque: true },
        { tex: 'AFR = \\frac{a}{0{,}21}\\cdot\\frac{M_{ar}}{M_{comb}}', d: 'base mássica; M_ar = 28,97 kg/kmol', destaque: true },
        { tex: '\\lambda = \\frac{AFR_{real}}{AFR_{esteq}} = \\frac{1}{\\phi}', d: 'λ > 1: pobre (excesso de ar) · λ < 1: rica' },
        { g: 'Consequências' },
        { tex: '\\lambda \\approx 0{,}85\\text{ a }0{,}9', d: 'potência máxima — mistura rica queima mais rápido' },
        { tex: '\\lambda \\approx 1{,}05\\text{ a }1{,}1', d: 'consumo mínimo — e também o pico de NOx' },
        { tex: '\\lambda = 1 \\pm 0{,}01', d: 'janela do catalisador de três vias: fora dela, ou não oxida CO e HC, ou não reduz NOx', destaque: true },
        { g: 'Detonação' },
        { tex: 'T_2 = T_1 r_c^{\\,k-1}', d: 'quanto maior rc, mais perto da autoignição da mistura não queimada' }
      ],
      passos: [],
      nota: 'As curvas de emissões são tendências qualitativas normalizadas, da forma clássica dos livros de motores — servem para mostrar o comportamento com λ, não para prever valores. O balanço químico supõe combustão completa; em mistura rica, parte do carbono sai como CO e H₂, o que o balanço simplificado não representa.',
      calcular: function (p, ctx) {
        var r = MCI.combustao(p);
        var rcLim = { gasolina: 11.5, etanol: 13.5, metano: 14, diesel: 24, biodiesel: 24 }[p.comb];
        r.risco = p.rc > rcLim || (p.avanco > 28 && p.rc > rcLim - 2);
        r.rcLim = rcLim;
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        /* emissões — formas típicas, normalizadas */
        var g = ctx.plot('emissoes').clear();
        var ls = Plot.linspace(0.7, 1.6, 120);
        var CO = ls.map(function (l) { return l < 1 ? 1 - 0.85 * (l - 0.7) / 0.3 : 0.15 * Math.exp(-(l - 1) * 8) + 0.02; });
        var HC = ls.map(function (l) { return 0.35 + 0.9 * Math.pow(Math.max(0, 1 - l) / 0.3, 2) + 1.2 * Math.pow(Math.max(0, l - 1.25) / 0.35, 2); });
        var NOx = ls.map(function (l) { return Math.exp(-Math.pow((l - 1.08) / 0.16, 2)); });
        g.line(ls, CO, { color: 'rgb(150,120,200)', width: 2.4, label: 'CO' });
        g.line(ls, HC, { color: 'rgb(230,150,50)', width: 2.4, label: 'HC' });
        g.line(ls, NOx, { color: 'rgb(220,60,60)', width: 2.4, label: 'NOx' });
        g.area([0.99, 0.99, 1.01, 1.01], [0, 2, 2, 0], { color: 'rgb(60,170,110)', alpha: 0.25 });
        g.text(1.0, 1.35, 'janela λ = 1', { size: 10, align: 'center' });
        g.vline(Math.min(Math.max(p.lambda, 0.7), 1.6), { color: Plot.serie(6), text: 'λ = ' + sg(p.lambda, 3) });
        g.setLimits([0.7, 1.6], [0, 1.5]).draw();

        var gp = ctx.plot('prod').clear();
        gp.o.xcat = [{ v: 0, label: 'N₂' }, { v: 1, label: 'CO₂' }, { v: 2, label: 'H₂O' }, { v: 3, label: 'O₂' }];
        var vals = [r.percN2, r.percCO2, r.percH2O, r.percO2];
        var cores = [Plot.serie(5), 'rgb(150,120,200)', Plot.serie(0), Plot.serie(2)];
        vals.forEach(function (v, k) {
          gp.bars([k], [v], { color: cores[k], barw: 0.5 });
          gp.text(k, v, sg(v, 3) + ' %', { align: 'center', dy: -7, size: 11 });
        });
        gp.setLimits([-0.6, 3.6], [0, Math.max.apply(null, vals) * 1.25]).draw();

        var f = r.f;
        ctx.setPassos([
          { t: '① Balanço estequiométrico',
            tex: 'C_{' + f.C + '}H_{' + f.H + '}' + (f.O ? 'O_{' + f.O + '}' : '') + ' + a(O_2 + 3{,}76N_2) \\to ' + f.C + '\\,CO_2 + ' + nt(f.H / 2, 3) + '\\,H_2O + 3{,}76a\\,N_2',
            texSub: 'a = ' + f.C + ' + \\frac{' + f.H + '}{4}' + (f.O ? ' - \\frac{' + f.O + '}{2}' : '') + ' = ' + nt(r.a, 4),
            obs: 'O nitrogênio entra como acompanhante (3,76 mols por mol de O₂) e, em primeira aproximação, sai inerte — mas é dele que se formam os NOx nas altas temperaturas da chama.' },
          { t: '② Relação ar-combustível',
            tex: 'AFR = \\frac{a}{0{,}21}\\cdot\\frac{28{,}97}{M_{comb}}',
            texSub: 'AFR = \\frac{' + nt(r.a, 4) + '}{0{,}21}\\cdot\\frac{28{,}97}{' + nt(f.M, 5) + '} = ' + nt(r.AFR, 4),
            obs: 'Para cada kg de combustível são necessários ' + sg(r.AFR, 3) + ' kg de ar. O etanol precisa de bem menos ar porque a própria molécula já traz oxigênio.' },
          { t: '③ Condição de operação',
            tex: '\\lambda = \\frac{AFR_{real}}{AFR_{esteq}} \\qquad \\phi = \\frac{1}{\\lambda}',
            texSub: '\\lambda = ' + nt(p.lambda, 3) + ' \\Rightarrow AFR_{real} = ' + nt(r.AFRreal, 4) + ',\\quad \\phi = ' + nt(r.phi, 3),
            r: r.rica ? 'Mistura rica' : p.lambda > 1.02 ? 'Mistura pobre' : 'Estequiométrica',
            obs: r.rica ? 'Com falta de ar, parte do carbono sai como CO e sobra combustível não queimado: a potência é máxima perto de λ ≈ 0,88, mas o consumo e as emissões pioram.'
              : p.lambda > 1.02 ? 'Com excesso de ar a queima é mais completa e o consumo cai, mas a temperatura ainda alta favorece o NOx; muito pobre, a chama falha (misfire) e o HC dispara.'
              : 'É a condição que o catalisador de três vias exige: só com λ entre 0,99 e 1,01 ele oxida CO e HC e reduz NOx ao mesmo tempo.' },
          { t: '④ Energia disponível por kg de ar',
            tex: '\\frac{PCI}{AFR}',
            texSub: '\\frac{' + nt(f.pci, 5) + '}{' + nt(r.AFR, 4) + '} = ' + nt(f.pci / r.AFR, 4) + '\\ kJ/kg_{ar}',
            obs: 'Como o motor é limitado pela massa de ar que consegue admitir, é essa razão — e não o PCI isolado — que determina a potência. Por isso o etanol, com PCI 40 % menor, entrega potência igual ou maior que a gasolina.' },
          { t: '⑤ Detonação',
            texSub: 'r_c = ' + nt(p.rc, 3) + ' \\quad\\text{limite típico para este combustível: } ' + nt(rcLim, 3),
            r: r.risco ? 'Risco de detonação' : 'Dentro do limite',
            obs: 'A detonação é a autoignição da mistura ainda não queimada, comprimida pela chama que avança. Ela depende da octanagem, da taxa de compressão, do avanço de ignição e da temperatura de admissão. O Diesel funciona ao contrário: ali a autoignição é desejada, e o que se mede é o número de cetano.' }
        ]);
        return {
          AFR: { v: r.AFR, u: ': 1', classe: 'destaque' },
          AFRreal: { v: r.AFRreal, u: ': 1' },
          phi: { v: r.phi, u: '' },
          energia: { v: f.pci / r.AFR, u: 'kJ/kg de ar', classe: 'destaque' },
          CO2: { v: r.percCO2, u: '% mol' },
          O2: { v: r.percO2, u: '% mol' },
          tipo: { v: r.rica ? 'Rica' : p.lambda > 1.02 ? 'Pobre' : 'Estequiométrica', u: '' },
          deto: { v: r.risco ? 'Risco de detonação' : 'Sem risco', u: '', classe: r.risco ? 'alerta' : 'ok' }
        };
      }
    });
  })();
})();

/* ============================================================
   Termodinâmica II — ciclos térmicos
     1. sim-rankine     : ciclo de potência a vapor — simples, com
                          superaquecimento, com reaquecimento e regenerativo
     2. sim-otto-diesel : ciclos de ignição por centelha e por compressão
     3. sim-brayton     : turbina a gás, com e sem regenerador
     4. sim-refrigeracao: compressão de vapor com R-134a, e bomba de calor

   Cada ciclo tem o ESQUEMA DA INSTALAÇÃO animado — o fluido escoa pelos
   componentes, colorido pela temperatura, e o ponto correspondente anda
   pelo diagrama T-s ao mesmo tempo — mais a tabela de o que acontece em
   cada componente: o que varia, o que se conserva e por quê.

   Propriedades da água: equações auxiliares do IAPWS-95 na saturação e
   virial truncado v = RT/P + B(T) no vapor superaquecido, com B(T)
   ajustado a tabela. Conferido entre 0,1 e 20 MPa e 150 a 600 °C:
   erro máximo de 0,40 % em h e 0,21 % em s. O ciclo Rankine de
   referência (3 MPa / 350 °C / 10 kPa) fecha em 33,5 % contra 33,4 %
   da tabela de vapor.

   R-134a: Wagner ajustado para p_sat (erro máximo 0,05 %), correlação de
   Watson para h_fg ancorada em 198,60 kJ/kg a 0 °C e cp do líquido
   ajustado às diferenças de h_f da tabela.
   ============================================================ */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  /* ============================================================
     Propriedades da água
     ============================================================ */
  var AGUA = (function () {
    var Tc = 647.096, Pc = 22064, RHOc = 322, Tt = 273.16, R = 0.461526;

    function Psat(T) {
      if (T >= Tc) return Pc;
      var tau = 1 - T / Tc;
      var a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
      var e = [1, 1.5, 3, 3.5, 4, 7.5], s = 0;
      for (var i = 0; i < 6; i++) s += a[i] * Math.pow(tau, e[i]);
      return Pc * Math.exp(Tc / T * s);
    }
    function rhoLiq(T) {
      var tau = 1 - T / Tc;
      var b = [1.99274064, 1.09965342, -0.510839303, -1.75493479, -45.5170352, -6.74694450e5];
      var e = [1 / 3, 2 / 3, 5 / 3, 16 / 3, 43 / 3, 110 / 3], s = 1;
      for (var i = 0; i < 6; i++) s += b[i] * Math.pow(tau, e[i]);
      return RHOc * s;
    }
    function rhoVap(T) {
      var tau = 1 - T / Tc;
      var c = [-2.03150240, -2.68302940, -5.38626492, -17.2991605, -44.7586581, -63.9201063];
      var e = [2 / 6, 4 / 6, 8 / 6, 18 / 6, 37 / 6, 71 / 6], s = 0;
      for (var i = 0; i < 6; i++) s += c[i] * Math.pow(tau, e[i]);
      return RHOc * Math.exp(s);
    }
    function vf(T) { return 1 / rhoLiq(T); }
    function vg(T) { return 1 / rhoVap(T); }
    /* Clapeyron: h_fg = T (v_g − v_f) dP/dT */
    function hfg(T) {
      if (T >= Tc - 0.05) return 0;
      var h = 0.01;
      return T * (vg(T) - vf(T)) * ((Psat(T + h) - Psat(T - h)) / (2 * h));
    }
    function sfg(T) { return hfg(T) / T; }
    function cpLiq(T) {
      var t = (T - 273.15) / 100;
      return 4.217 - 0.3374 * t + 0.2245 * t * t - 0.0546 * t * t * t + 0.0289 * Math.pow(t, 4);
    }
    function hf(T) {
      var n = 60, s = 0, dT = (T - Tt) / n;
      for (var i = 0; i < n; i++) s += cpLiq(Tt + dT * (i + 0.5)) * dT;
      return s;
    }
    function sf(T) {
      var n = 60, s = 0, dT = (T - Tt) / n;
      for (var i = 0; i < n; i++) { var Tm = Tt + dT * (i + 0.5); s += cpLiq(Tm) / Tm * dT; }
      return s;
    }
    function hg(T) { return hf(T) + hfg(T); }
    function sg(T) { return sf(T) + sfg(T); }
    function Tsat(P) {
      var a = 273.17, b = Tc - 0.01;
      for (var i = 0; i < 70; i++) { var m = (a + b) / 2; if (Psat(m) < P) a = m; else b = m; }
      return (a + b) / 2;
    }

    /* vapor superaquecido: v = RT/P + B(T) */
    var cB = [0.011873743, -0.024086305, 0.015305556, -0.0043402523];
    function B(T) { var u = 1000 / T; return cB[0] + cB[1] * u + cB[2] * u * u + cB[3] * u * u * u; }
    function dBdT(T) {
      var u = 1000 / T, du = -1000 / (T * T);
      return (cB[1] + 2 * cB[2] * u + 3 * cB[3] * u * u) * du;
    }
    var M = 18.015;
    function cpIG(T) { return (32.24 + 0.1923e-2 * T + 1.055e-5 * T * T - 3.595e-9 * T * T * T) / M; }
    /* ancoragem a 50 °C, onde a correção de pressão é desprezível */
    var Ta = 323.15, Pa = Psat(Ta), P0 = 1;
    var hIGa = hg(Ta) - (B(Ta) - Ta * dBdT(Ta)) * Pa;
    var sIGa = sg(Ta) + R * Math.log(Pa / P0) + dBdT(Ta) * Pa;
    function hIG(T) {
      var n = Math.max(20, Math.round(Math.abs(T - Ta) / 5)), s = 0, dT = (T - Ta) / n;
      for (var i = 0; i < n; i++) s += cpIG(Ta + dT * (i + 0.5)) * dT;
      return hIGa + s;
    }
    function sIG(T) {
      var n = Math.max(20, Math.round(Math.abs(T - Ta) / 5)), s = 0, dT = (T - Ta) / n;
      for (var i = 0; i < n; i++) { var Tm = Ta + dT * (i + 0.5); s += cpIG(Tm) / Tm * dT; }
      return sIGa + s;
    }
    function hSup(T, P) { return hIG(T) + (B(T) - T * dBdT(T)) * P; }
    function sSup(T, P) { return sIG(T) - R * Math.log(P / P0) - dBdT(T) * P; }

    /* estado a partir de P e T (superaquecido) */
    function porPT(P, T) {
      var Ts = Tsat(P);
      if (T <= Ts + 0.01) {
        return { P: P, T: Ts, h: hg(Ts), s: sg(Ts), x: 1, fase: 'vapor saturado' };
      }
      return { P: P, T: T, h: hSup(T, P), s: sSup(T, P), x: null, fase: 'superaquecido',
               sup: T - Ts };
    }
    /* estado a partir de P e s (expansão isentrópica) */
    function porPs(P, sAlvo) {
      var Ts = Tsat(P);
      var sfc = sf(Ts), sfgc = sfg(Ts);
      var x = (sAlvo - sfc) / sfgc;
      if (x < 1) {
        return { P: P, T: Ts, h: hf(Ts) + x * hfg(Ts), s: sAlvo, x: x, fase: 'mistura' };
      }
      var a = Ts, b = 1300;
      for (var i = 0; i < 60; i++) { var m = (a + b) / 2; if (sSup(m, P) < sAlvo) a = m; else b = m; }
      var T = (a + b) / 2;
      return { P: P, T: T, h: hSup(T, P), s: sAlvo, x: null, fase: 'superaquecido', sup: T - Ts };
    }
    /* estado a partir de P e h */
    function porPh(P, hAlvo) {
      var Ts = Tsat(P);
      var hfc = hf(Ts), hfgc = hfg(Ts);
      if (hAlvo < hfc) return { P: P, T: Ts, h: hAlvo, s: sf(Ts), x: 0, fase: 'líquido' };
      var x = (hAlvo - hfc) / hfgc;
      if (x < 1) {
        return { P: P, T: Ts, h: hAlvo, s: sf(Ts) + x * sfg(Ts), x: x, fase: 'mistura' };
      }
      var a = Ts, b = 1300;
      for (var i = 0; i < 60; i++) { var m = (a + b) / 2; if (hSup(m, P) < hAlvo) a = m; else b = m; }
      var T = (a + b) / 2;
      return { P: P, T: T, h: hAlvo, s: sSup(T, P), x: null, fase: 'superaquecido', sup: T - Ts };
    }

    return { Tc: Tc, Pc: Pc, R: R, Psat: Psat, Tsat: Tsat, vf: vf, vg: vg,
             hf: hf, hg: hg, hfg: hfg, sf: sf, sg: sg, sfg: sfg,
             hSup: hSup, sSup: sSup, porPT: porPT, porPs: porPs, porPh: porPh };
  })();

  /* ============================================================
     Utilidades de desenho
     ============================================================ */
  function fonte(px, peso) {
    return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif');
  }

  function seta(c, x1, y1, x2, y2, cor, larg, cabeca) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1e-6) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(12, L * 0.34);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.42, y2 - uy * h - ux * h * 0.42);
    c.lineTo(x2 - ux * h - uy * h * 0.42, y2 - uy * h + ux * h * 0.42);
    c.closePath(); c.fill();
  }

  /* cor do fluido pela temperatura: azul (frio) → laranja → vermelho (quente) */
  function corFluido(T, Tmin, Tmax) {
    var t = Math.max(0, Math.min(1, (T - Tmin) / Math.max(Tmax - Tmin, 1)));
    var paradas = [[60, 130, 246], [56, 189, 248], [250, 204, 21], [249, 115, 22], [239, 68, 68]];
    var f = t * (paradas.length - 1);
    var i = Math.min(paradas.length - 2, Math.floor(f));
    var u = f - i;
    var a = paradas[i], b = paradas[i + 1];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * u) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * u) + ')';
  }

  function caixa(c, x, y, w, h, cor, rotulo, sub) {
    c.setLineDash([]);
    c.fillStyle = cor; c.globalAlpha = 0.10;
    c.fillRect(x, y, w, h);
    c.globalAlpha = 1;
    c.strokeStyle = cor; c.lineWidth = 2.2;
    c.strokeRect(x, y, w, h);
    c.fillStyle = cor;
    c.font = fonte(11.5, '700');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(rotulo, x + w / 2, y + h / 2 - (sub ? 7 : 0));
    if (sub) {
      c.font = fonte(9.5);
      c.fillStyle = Plot.cssVar('--text-muted', '#666');
      c.fillText(sub, x + w / 2, y + h / 2 + 9);
    }
  }

  /* trocador de calor: caixa com serpentina */
  function serpentina(c, x, y, w, h, cor) {
    c.strokeStyle = cor; c.lineWidth = 1.6; c.setLineDash([]);
    var n = 4, dy = h / (n + 1);
    c.beginPath();
    for (var i = 1; i <= n; i++) {
      var yy = y + dy * i;
      c.moveTo(x + 7, yy);
      for (var k = 0; k <= 10; k++) {
        c.lineTo(x + 7 + (w - 14) * k / 10, yy + (k % 2 ? 3.4 : -3.4));
      }
    }
    c.stroke();
  }

  /* chama sob a caldeira */
  function chama(c, x, y, larg, fase) {
    var n = 7;
    for (var i = 0; i < n; i++) {
      var xf = x + larg * (i + 0.5) / n;
      var a = 12 + 7 * Math.sin(fase * TAU * 2.4 + i * 1.7);
      c.beginPath();
      c.moveTo(xf - 5, y);
      c.quadraticCurveTo(xf - 4, y - a * 0.6, xf, y - a);
      c.quadraticCurveTo(xf + 4, y - a * 0.6, xf + 5, y);
      c.closePath();
      c.fillStyle = i % 2 ? '#f59e0b' : '#ef4444';
      c.globalAlpha = 0.75;
      c.fill();
    }
    c.globalAlpha = 1;
  }

  /* rotor girando dentro de um círculo */
  function rotorGirando(c, cx, cy, r, ang, cor, pas) {
    c.strokeStyle = cor; c.lineWidth = 2.2; c.lineCap = 'round'; c.setLineDash([]);
    for (var i = 0; i < (pas || 5); i++) {
      var th = ang + i * TAU / (pas || 5);
      c.beginPath();
      c.moveTo(cx + r * 0.22 * Math.cos(th), cy + r * 0.22 * Math.sin(th));
      c.lineTo(cx + r * 0.86 * Math.cos(th + 0.5), cy + r * 0.86 * Math.sin(th + 0.5));
      c.stroke();
    }
    c.lineCap = 'butt';
  }

  /* turbina: trapézio que se abre no sentido do escoamento */
  function turbina(c, x, y, w, h, cor, ang, rotulo) {
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(x, y + h * 0.20);
    c.lineTo(x + w, y);
    c.lineTo(x + w, y + h);
    c.lineTo(x, y + h * 0.80);
    c.closePath();
    c.fillStyle = cor; c.globalAlpha = 0.18; c.fill(); c.globalAlpha = 1;
    c.strokeStyle = cor; c.lineWidth = 2.2; c.stroke();
    /* pás girando */
    c.strokeStyle = cor; c.lineWidth = 1.6;
    for (var i = 0; i < 7; i++) {
      var xx = x + w * (i + 0.5) / 7;
      var hh = h * (0.28 + 0.24 * (i / 7));
      var ph = Math.sin(ang * 2 + i * 0.9);
      c.beginPath();
      c.moveTo(xx, y + h / 2 - hh * (0.5 + 0.16 * ph));
      c.lineTo(xx, y + h / 2 + hh * (0.5 + 0.16 * ph));
      c.stroke();
    }
    c.fillStyle = cor; c.font = fonte(11.5, '700');
    c.textAlign = 'center'; c.textBaseline = 'top';
    c.fillText(rotulo, x + w / 2, y + h + 5);
  }

  /* ============================================================
     Motor de planta: desenha componentes ligados por tubos, com
     partículas escoando e coloridas pela temperatura do trecho
     ============================================================ */
  function desenharPlanta(c, pl, planta, fase) {
    var a = pl._area;
    var faint = Plot.cssVar('--text-faint', '#999');
    var texto = Plot.cssVar('--text', '#111');

    /* --- tubos primeiro, para ficarem atrás dos componentes --- */
    planta.tubos.forEach(function (t) {
      c.strokeStyle = texto; c.globalAlpha = 0.16; c.lineWidth = 9;
      c.lineCap = 'round'; c.lineJoin = 'round'; c.setLineDash([]);
      c.beginPath();
      c.moveTo(t.pts[0][0], t.pts[0][1]);
      for (var i = 1; i < t.pts.length; i++) c.lineTo(t.pts[i][0], t.pts[i][1]);
      c.stroke();
      c.globalAlpha = 1; c.lineCap = 'butt';
    });

    /* --- partículas --- */
    planta.tubos.forEach(function (t, idx) {
      var segs = [], tot = 0, k;
      for (k = 1; k < t.pts.length; k++) {
        var L = Math.hypot(t.pts[k][0] - t.pts[k - 1][0], t.pts[k][1] - t.pts[k - 1][1]);
        segs.push({ a: t.pts[k - 1], b: t.pts[k], L: L, s0: tot });
        tot += L;
      }
      var n = Math.max(3, Math.round(tot / 26));
      c.fillStyle = t.cor;
      for (var m = 0; m < n; m++) {
        var s = (((fase * (t.vel || 1) + m / n) % 1) + 1) % 1 * tot;
        for (k = 0; k < segs.length; k++) {
          if (s >= segs[k].s0 && s <= segs[k].s0 + segs[k].L) {
            var u = (s - segs[k].s0) / segs[k].L;
            var X = segs[k].a[0] + (segs[k].b[0] - segs[k].a[0]) * u;
            var Y = segs[k].a[1] + (segs[k].b[1] - segs[k].a[1]) * u;
            c.globalAlpha = 0.9;
            c.beginPath(); c.arc(X, Y, t.r || 3.2, 0, TAU); c.fill();
            break;
          }
        }
      }
      c.globalAlpha = 1;
      void idx;
    });

    /* --- componentes --- */
    planta.desenhos.forEach(function (fn) { fn(c); });

    /* --- rótulos de estado --- */
    (planta.estados || []).forEach(function (e) {
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.strokeStyle = e.cor || faint; c.lineWidth = 1.6; c.setLineDash([]);
      c.beginPath(); c.arc(e.x, e.y, 11, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = e.cor || texto;
      c.font = fonte(11, '700');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(e.n, e.x, e.y + 0.5);
      if (e.info) {
        c.font = fonte(9.5);
        c.fillStyle = Plot.cssVar('--text-muted', '#666');
        c.textAlign = e.lado === 'esq' ? 'right' : 'left';
        c.textBaseline = 'middle';
        var dx = e.lado === 'esq' ? -15 : 15;
        e.info.split('\n').forEach(function (linha, i) {
          c.fillText(linha, e.x + dx, e.y - (e.info.split('\n').length - 1) * 5.5 + i * 11);
        });
      }
    });

    /* --- título --- */
    if (planta.titulo) {
      c.fillStyle = texto; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(planta.titulo, a.x + 4, a.y + 2);
    }
    if (planta.subtitulo) {
      c.fillStyle = faint; c.font = fonte(10.5);
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(planta.subtitulo, a.x + 4, a.y + 19);
    }
  }

  /* passo de tempo protegido contra saltos */
  function relogio() {
    return { t: 0, dt: function () {
      var agora = performance.now();
      var d = this.t ? (agora - this.t) / 1000 : 0.016;
      this.t = agora;
      return (d > 0.2 || d <= 0) ? 0.016 : d;
    } };
  }

  var quadros = [];
  function registrar(fn) { quadros.push(fn); }
  (function laco() {
    for (var i = 0; i < quadros.length; i++) {
      try { quadros[i](); } catch (e) { /* um ciclo com erro não trava os outros */ }
    }
    requestAnimationFrame(laco);
  })();

  /* domo de saturação da água no plano T-s */
  function domoAgua() {
    var Ts = [], sfs = [], sgs = [];
    for (var i = 0; i <= 70; i++) {
      var T = 274 + (AGUA.Tc - 275) * Math.pow(i / 70, 0.85);
      Ts.push(T - 273.15);
      sfs.push(AGUA.sf(T));
      sgs.push(AGUA.sg(T));
    }
    var s = sfs.concat(sgs.slice().reverse());
    var t = Ts.concat(Ts.slice().reverse());
    return { s: s, T: t };
  }

  /* ============================================================
     1. Ciclo Rankine — potência a vapor
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-rankine')) return;

    var A = { on: true, fase: 0, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };
    var DOMO = domoAgua();

    /* ---------- modelo ---------- */
    function resolver(p) {
      var Pc = p.Pcond, Pb = p.Pcald;
      var Tc1 = AGUA.Tsat(Pc), Tb = AGUA.Tsat(Pb);
      var e = {};

      /* 1: líquido saturado saindo do condensador */
      e[1] = { P: Pc, T: Tc1, h: AGUA.hf(Tc1), s: AGUA.sf(Tc1), x: 0, fase: 'líquido saturado' };
      var v1 = AGUA.vf(Tc1);

      var wBomba, hSaida;
      if (p.modo === 'regenerativo') {
        /* bomba 1 leva do condensador até a pressão de extração */
        var Pe = Math.min(Math.max(p.Pext, Pc * 1.2), Pb * 0.9);
        var etaB = p.etaB / 100, etaT = p.etaT / 100;
        var wB1 = v1 * (Pe - Pc) / etaB;
        e[2] = AGUA.porPh(Pe, e[1].h + wB1);
        e[2].fase = 'líquido comprimido';
        /* 3: líquido saturado saindo do aquecedor de mistura */
        var Te = AGUA.Tsat(Pe);
        e[3] = { P: Pe, T: Te, h: AGUA.hf(Te), s: AGUA.sf(Te), x: 0, fase: 'líquido saturado' };
        var v3 = AGUA.vf(Te);
        var wB2 = v3 * (Pb - Pe) / etaB;
        e[4] = AGUA.porPh(Pb, e[3].h + wB2);
        e[4].fase = 'líquido comprimido';
        /* 5: entrada da turbina */
        e[5] = AGUA.porPT(Pb, p.T3 + 273.15);
        /* 6: extração */
        var h6s = AGUA.porPs(Pe, e[5].s).h;
        e[6] = AGUA.porPh(Pe, e[5].h - etaT * (e[5].h - h6s));
        /* 7: saída da turbina */
        var h7s = AGUA.porPs(Pc, e[5].s).h;
        e[7] = AGUA.porPh(Pc, e[5].h - etaT * (e[5].h - h7s));
        /* fração extraída: balanço no aquecedor de mistura
           y·h6 + (1−y)·h2 = h3 */
        var y = (e[3].h - e[2].h) / (e[6].h - e[2].h);
        y = Math.max(0, Math.min(0.95, y));
        var qin = e[5].h - e[4].h;
        var qout = (1 - y) * (e[7].h - e[1].h);
        var wt = (e[5].h - e[6].h) + (1 - y) * (e[6].h - e[7].h);
        wBomba = (1 - y) * wB1 + wB2;
        var wliq = wt - wBomba;
        return { e: e, y: y, qin: qin, qout: qout, wt: wt, wp: wBomba, wliq: wliq,
                 eta: wliq / qin, Tb: Tb, Tc: Tc1, Pe: Pe, x: e[7].x,
                 ordem: [4, 5, 6, 7, 1, 2, 3], modo: p.modo };
      }

      /* bomba única */
      var etaB2 = p.etaB / 100, etaT2 = p.etaT / 100;
      wBomba = v1 * (Pb - Pc) / etaB2;
      e[2] = AGUA.porPh(Pb, e[1].h + wBomba);
      e[2].fase = 'líquido comprimido';

      if (p.modo === 'reaquecimento') {
        var Pr = Math.min(Math.max(p.Preaq, Pc * 2), Pb * 0.8);
        e[3] = AGUA.porPT(Pb, p.T3 + 273.15);
        var h4s = AGUA.porPs(Pr, e[3].s).h;
        e[4] = AGUA.porPh(Pr, e[3].h - etaT2 * (e[3].h - h4s));
        e[5] = AGUA.porPT(Pr, p.T5 + 273.15);
        var h6sr = AGUA.porPs(Pc, e[5].s).h;
        e[6] = AGUA.porPh(Pc, e[5].h - etaT2 * (e[5].h - h6sr));
        var qinR = (e[3].h - e[2].h) + (e[5].h - e[4].h);
        var wtR = (e[3].h - e[4].h) + (e[5].h - e[6].h);
        return { e: e, qin: qinR, qout: e[6].h - e[1].h, wt: wtR, wp: wBomba,
                 wliq: wtR - wBomba, eta: (wtR - wBomba) / qinR, Tb: Tb, Tc: Tc1,
                 Pr: Pr, x: e[6].x, ordem: [1, 2, 3, 4, 5, 6], modo: p.modo };
      }

      /* simples ou com superaquecimento */
      var T3 = p.modo === 'simples' ? Tb : p.T3 + 273.15;
      e[3] = AGUA.porPT(Pb, T3);
      var h4si = AGUA.porPs(Pc, e[3].s).h;
      e[4] = AGUA.porPh(Pc, e[3].h - etaT2 * (e[3].h - h4si));
      var qinS = e[3].h - e[2].h;
      var wtS = e[3].h - e[4].h;
      return { e: e, qin: qinS, qout: e[4].h - e[1].h, wt: wtS, wp: wBomba,
               wliq: wtS - wBomba, eta: (wtS - wBomba) / qinS, Tb: Tb, Tc: Tc1,
               x: e[4].x, ordem: [1, 2, 3, 4], modo: p.modo };
    }

    /* ---------- esquema animado da instalação ---------- */
    function montarPlanta(p, r, fase) {
      return function (c, pl) {
        var a = pl._area;
        var e = r.e;
        var faint = Plot.cssVar('--text-faint', '#999');
        var Tmin = r.Tc - 5, Tmax = Math.max(r.Tb + 60, (e[3] ? e[3].T : r.Tb) + 5);
        function cor(est) { return corFluido(est ? est.T : Tmin, Tmin, Tmax); }

        var X = function (u) { return a.x + a.w * u; };
        var Y = function (u) { return a.y + a.h * u; };

        var tubos = [], desenhos = [], estados = [];
        var regen = r.modo === 'regenerativo';
        var reaq = r.modo === 'reaquecimento';

        /* --- caldeira --- */
        var bx = X(0.05), by = Y(0.22), bw = a.w * 0.15, bh = a.h * 0.46;
        desenhos.push(function (c2) {
          serpentina(c2, bx, by, bw, bh, Plot.serie(5));
          caixa(c2, bx, by, bw, bh, Plot.serie(5), 'CALDEIRA',
                reaq ? 'e reaquecedor' : (p.modo === 'simples' ? 'evapora' : 'evapora e superaquece'));
          chama(c2, bx, by + bh + 16, bw, fase);
          seta(c2, bx + bw / 2, by + bh + 46, bx + bw / 2, by + bh + 20, Plot.serie(5), 2.4, 9);
          c2.fillStyle = Plot.serie(5); c2.font = fonte(11, '700');
          c2.textAlign = 'center'; c2.textBaseline = 'top';
          c2.fillText('Q_ent = ' + Plot.sig(r.qin, 4) + ' kJ/kg', bx + bw / 2, by + bh + 50);
        });

        /* --- turbina --- */
        var tx = X(0.40), ty = Y(0.10), tw = a.w * 0.20, th2 = a.h * 0.24;
        desenhos.push(function (c2) {
          turbina(c2, tx, ty, tw, th2, Plot.serie(2), fase * 8,
                  reaq ? 'TURBINA AP + BP' : 'TURBINA');
          seta(c2, tx + tw * 0.55, ty + th2 * 0.5, tx + tw + a.w * 0.09, ty - a.h * 0.02,
               Plot.serie(3), 2.6, 11);
          c2.fillStyle = Plot.serie(3); c2.font = fonte(11, '700');
          c2.textAlign = 'left'; c2.textBaseline = 'middle';
          c2.fillText('W_turb = ' + Plot.sig(r.wt, 4) + ' kJ/kg',
                      tx + tw + a.w * 0.10, ty - a.h * 0.02);
        });

        /* --- condensador --- */
        var cx2 = X(0.74), cy2 = Y(0.42), cw = a.w * 0.17, ch = a.h * 0.20;
        desenhos.push(function (c2) {
          serpentina(c2, cx2, cy2, cw, ch, Plot.serie(0));
          caixa(c2, cx2, cy2, cw, ch, Plot.serie(0), 'CONDENSADOR', 'rejeita calor');
          seta(c2, cx2 + cw / 2, cy2 + ch + 6, cx2 + cw / 2, cy2 + ch + 40, Plot.serie(0), 2.4, 9);
          c2.fillStyle = Plot.serie(0); c2.font = fonte(11, '700');
          c2.textAlign = 'center'; c2.textBaseline = 'top';
          c2.fillText('Q_sai = ' + Plot.sig(r.qout, 4) + ' kJ/kg', cx2 + cw / 2, cy2 + ch + 44);
          /* água de resfriamento atravessando */
          c2.strokeStyle = Plot.serie(1); c2.lineWidth = 1.6; c2.setLineDash([]);
          for (var k = 0; k < 3; k++) {
            var yy = cy2 + ch * (k + 1) / 4;
            var dx = ((fase * 2 + k * 0.33) % 1) * 14;
            seta(c2, cx2 - 24 + dx, yy, cx2 - 6 + dx, yy, Plot.serie(1), 1.4, 6);
          }
          c2.fillStyle = faint; c2.font = fonte(9);
          c2.textAlign = 'center'; c2.textBaseline = 'bottom';
          c2.fillText('água de resfriamento', cx2 + cw / 2, cy2 - 6);
        });

        /* --- bomba(s) --- */
        var px = X(regen ? 0.62 : 0.50), py = Y(0.80), pr = Math.min(a.h * 0.075, 20);
        desenhos.push(function (c2) {
          c2.fillStyle = Plot.cssVar('--bg-elev', '#fff');
          c2.beginPath(); c2.arc(px, py, pr, 0, TAU); c2.fill();
          c2.strokeStyle = Plot.serie(4); c2.lineWidth = 2.2;
          c2.beginPath(); c2.arc(px, py, pr, 0, TAU); c2.stroke();
          rotorGirando(c2, px, py, pr, fase * TAU * 3, Plot.serie(4), 5);
          c2.fillStyle = Plot.serie(4); c2.font = fonte(10.5, '700');
          c2.textAlign = 'center'; c2.textBaseline = 'top';
          c2.fillText(regen ? 'BOMBA 1' : 'BOMBA', px, py + pr + 5);
          seta(c2, px, py + pr + 34, px, py + pr + 20, Plot.serie(3), 2, 8);
          c2.fillStyle = Plot.serie(3); c2.font = fonte(10);
          c2.fillText('W_bomba = ' + Plot.sig(r.wp, 3) + ' kJ/kg', px, py + pr + 36);
        });

        /* --- aquecedor de mistura e segunda bomba, no regenerativo --- */
        var ax2 = X(0.34), ay2 = Y(0.72), aw2 = a.w * 0.13, ah2 = a.h * 0.16;
        var p2x = X(0.22), p2y = Y(0.80);
        if (regen) {
          desenhos.push(function (c2) {
            caixa(c2, ax2, ay2, aw2, ah2, Plot.serie(4), 'AQUECEDOR', 'mistura aberta');
            c2.fillStyle = Plot.cssVar('--bg-elev', '#fff');
            c2.beginPath(); c2.arc(p2x, p2y, pr, 0, TAU); c2.fill();
            c2.strokeStyle = Plot.serie(4); c2.lineWidth = 2.2;
            c2.beginPath(); c2.arc(p2x, p2y, pr, 0, TAU); c2.stroke();
            rotorGirando(c2, p2x, p2y, pr, fase * TAU * 3, Plot.serie(4), 5);
            c2.fillStyle = Plot.serie(4); c2.font = fonte(10.5, '700');
            c2.textAlign = 'center'; c2.textBaseline = 'top';
            c2.fillText('BOMBA 2', p2x, p2y + pr + 5);
          });
        }

        /* --- tubulação --- */
        var topoCald = [bx + bw / 2, by];
        if (regen) {
          /* 4 → caldeira → 5 → turbina */
          tubos.push({ pts: [topoCald, [bx + bw / 2, Y(0.12)], [tx, Y(0.12)],
                             [tx, ty + th2 * 0.5]], cor: cor(e[5]), vel: 1.1 });
          /* extração 6 → aquecedor */
          tubos.push({ pts: [[tx + tw * 0.5, ty + th2 * 0.9], [tx + tw * 0.5, Y(0.60)],
                             [ax2 + aw2 / 2, Y(0.60)], [ax2 + aw2 / 2, ay2]],
                       cor: cor(e[6]), vel: 0.8, r: 2.8 });
          /* 7 → condensador */
          tubos.push({ pts: [[tx + tw, ty + th2 * 0.75], [X(0.825), ty + th2 * 0.75],
                             [X(0.825), cy2]], cor: cor(e[7]), vel: 1.0 });
          /* condensador → bomba1 → aquecedor */
          tubos.push({ pts: [[cx2 + cw / 2, cy2 + ch], [cx2 + cw / 2, py], [px + pr, py]],
                       cor: cor(e[1]), vel: 0.6 });
          tubos.push({ pts: [[px - pr, py], [ax2 + aw2, ay2 + ah2 * 0.5]],
                       cor: cor(e[2]), vel: 0.6 });
          /* aquecedor → bomba2 → caldeira */
          tubos.push({ pts: [[ax2, ay2 + ah2 * 0.5], [p2x + pr, p2y]], cor: cor(e[3]), vel: 0.6 });
          tubos.push({ pts: [[p2x - pr, p2y], [bx + bw / 2, p2y], [bx + bw / 2, by + bh]],
                       cor: cor(e[4]), vel: 0.6 });
          estados = [
            { n: '5', x: tx - 16, y: Y(0.12) + 18, cor: cor(e[5]),
              info: Plot.sig(e[5].T - 273.15, 4) + ' °C\n' + Plot.sig(p.Pcald / 1000, 3) + ' MPa',
              lado: 'esq' },
            { n: '6', x: tx + tw * 0.5, y: Y(0.60), cor: cor(e[6]),
              info: 'extração ' + Plot.sig(r.y * 100, 3) + ' %', lado: 'dir' },
            { n: '7', x: X(0.825), y: ty + th2 * 0.75, cor: cor(e[7]),
              info: 'x = ' + (e[7].x !== null ? Plot.sig(e[7].x, 3) : '—'), lado: 'dir' },
            { n: '1', x: cx2 + cw / 2, y: py, cor: cor(e[1]), info: '', lado: 'dir' },
            { n: '3', x: ax2 - 12, y: ay2 + ah2 * 0.5, cor: cor(e[3]), info: '', lado: 'esq' },
            { n: '4', x: bx + bw / 2, y: by + bh + 2, cor: cor(e[4]), info: '', lado: 'dir' }
          ];
        } else if (reaq) {
          tubos.push({ pts: [topoCald, [bx + bw / 2, Y(0.10)], [tx, Y(0.10)],
                             [tx, ty + th2 * 0.4]], cor: cor(e[3]), vel: 1.1 });
          /* saída AP volta à caldeira para reaquecer */
          tubos.push({ pts: [[tx + tw * 0.45, ty + th2], [tx + tw * 0.45, Y(0.45)],
                             [bx + bw + 8, Y(0.45)]], cor: cor(e[4]), vel: 0.9, r: 2.8 });
          tubos.push({ pts: [[bx + bw + 8, Y(0.38)], [tx + tw * 0.62, Y(0.38)],
                             [tx + tw * 0.62, ty + th2]], cor: cor(e[5]), vel: 1.1, r: 2.8 });
          tubos.push({ pts: [[tx + tw, ty + th2 * 0.75], [X(0.825), ty + th2 * 0.75],
                             [X(0.825), cy2]], cor: cor(e[6]), vel: 1.0 });
          tubos.push({ pts: [[cx2 + cw / 2, cy2 + ch], [cx2 + cw / 2, py], [px + pr, py]],
                       cor: cor(e[1]), vel: 0.6 });
          tubos.push({ pts: [[px - pr, py], [bx + bw / 2, py], [bx + bw / 2, by + bh]],
                       cor: cor(e[2]), vel: 0.6 });
          estados = [
            { n: '3', x: tx - 16, y: Y(0.10) + 18, cor: cor(e[3]),
              info: Plot.sig(e[3].T - 273.15, 4) + ' °C', lado: 'esq' },
            { n: '4', x: tx + tw * 0.45, y: Y(0.45), cor: cor(e[4]),
              info: Plot.sig(r.Pr / 1000, 3) + ' MPa', lado: 'dir' },
            { n: '5', x: tx + tw * 0.62, y: Y(0.38), cor: cor(e[5]),
              info: 'reaquecido a ' + Plot.sig(e[5].T - 273.15, 4) + ' °C', lado: 'dir' },
            { n: '6', x: X(0.825), y: ty + th2 * 0.75, cor: cor(e[6]),
              info: 'x = ' + (e[6].x !== null ? Plot.sig(e[6].x, 3) : '—'), lado: 'dir' },
            { n: '1', x: cx2 + cw / 2, y: py, cor: cor(e[1]), info: '', lado: 'dir' },
            { n: '2', x: bx + bw / 2, y: by + bh + 2, cor: cor(e[2]), info: '', lado: 'dir' }
          ];
        } else {
          tubos.push({ pts: [topoCald, [bx + bw / 2, Y(0.10)], [tx, Y(0.10)],
                             [tx, ty + th2 * 0.5]], cor: cor(e[3]), vel: 1.1 });
          tubos.push({ pts: [[tx + tw, ty + th2 * 0.75], [X(0.825), ty + th2 * 0.75],
                             [X(0.825), cy2]], cor: cor(e[4]), vel: 1.0 });
          tubos.push({ pts: [[cx2 + cw / 2, cy2 + ch], [cx2 + cw / 2, py], [px + pr, py]],
                       cor: cor(e[1]), vel: 0.6 });
          tubos.push({ pts: [[px - pr, py], [bx + bw / 2, py], [bx + bw / 2, by + bh]],
                       cor: cor(e[2]), vel: 0.6 });
          estados = [
            { n: '3', x: tx - 16, y: Y(0.10) + 18, cor: cor(e[3]),
              info: Plot.sig(e[3].T - 273.15, 4) + ' °C\n' + Plot.sig(p.Pcald / 1000, 3) + ' MPa',
              lado: 'esq' },
            { n: '4', x: X(0.825), y: ty + th2 * 0.75, cor: cor(e[4]),
              info: 'x = ' + (e[4].x !== null ? Plot.sig(e[4].x, 3) : 'superaq.'), lado: 'dir' },
            { n: '1', x: cx2 + cw / 2, y: py, cor: cor(e[1]),
              info: Plot.sig(e[1].T - 273.15, 3) + ' °C', lado: 'dir' },
            { n: '2', x: bx + bw / 2, y: by + bh + 2, cor: cor(e[2]), info: '', lado: 'dir' }
          ];
        }

        desenharPlanta(c, pl, {
          tubos: tubos, desenhos: desenhos, estados: estados,
          titulo: 'Ciclo Rankine — ' + ({ simples: 'simples',
            superaquecido: 'com superaquecimento', reaquecimento: 'com reaquecimento',
            regenerativo: 'regenerativo' }[r.modo]),
          subtitulo: 'η = ' + Plot.sig(r.eta * 100, 4) + ' %   ·   w_líq = ' +
            Plot.sig(r.wliq, 4) + ' kJ/kg   ·   a cor das partículas é a temperatura do vapor'
        }, fase);
      };
    }

    Sim.build('#sim-rankine', {
      titulo: 'Ciclo Rankine — a usina a vapor por dentro',
      descricao: 'O esquema à esquerda é a instalação de verdade: o vapor escoa, a chama aquece, a turbina gira e a cor das partículas é a temperatura do fluido. Ao lado, o mesmo ciclo no diagrama T-s, com o ponto andando junto.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Rankine simples', desc: 'Sem superaquecimento: sai muito úmido da turbina',
          valores: { modo: 'simples', Pcald: 3000, Pcond: 10, T3: 350, T5: 400, Preaq: 500, Pext: 400, etaT: 100, etaB: 100, animar: true, vel: 1 } },
        { nome: '2 · Com superaquecimento a 350 °C', desc: 'O caso de referência: η ≈ 33 %',
          valores: { modo: 'superaquecido', Pcald: 3000, Pcond: 10, T3: 350, T5: 400, Preaq: 500, Pext: 400, etaT: 100, etaB: 100, animar: true, vel: 1 } },
        { nome: '3 · Alta pressão e alta temperatura', desc: '15 MPa e 600 °C — usina moderna',
          valores: { modo: 'superaquecido', Pcald: 15000, Pcond: 10, T3: 600, T5: 600, Preaq: 2000, Pext: 1000, etaT: 100, etaB: 100, animar: true, vel: 1 } },
        { nome: '4 · Com reaquecimento', desc: 'Resolve a umidade no fim da expansão',
          valores: { modo: 'reaquecimento', Pcald: 15000, Pcond: 10, T3: 600, T5: 600, Preaq: 2000, Pext: 1000, etaT: 100, etaB: 100, animar: true, vel: 1 } },
        { nome: '5 · Regenerativo', desc: 'Extrai vapor da turbina para preaquecer a água',
          valores: { modo: 'regenerativo', Pcald: 15000, Pcond: 10, T3: 600, T5: 600, Preaq: 2000, Pext: 1000, etaT: 100, etaB: 100, animar: true, vel: 1 } },
        { nome: '6 · Turbina real (87 %)', desc: 'Com irreversibilidade: a expansão deixa de ser vertical',
          valores: { modo: 'superaquecido', Pcald: 15000, Pcond: 10, T3: 600, T5: 600, Preaq: 2000, Pext: 1000, etaT: 87, etaB: 85, animar: true, vel: 1 } },
        { nome: '7 · Condensador ruim (50 kPa)', desc: 'Elevar a pressão de condensação destrói o rendimento',
          valores: { modo: 'superaquecido', Pcald: 3000, Pcond: 50, T3: 350, T5: 400, Preaq: 500, Pext: 400, etaT: 100, etaB: 100, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'modo', tipo: 'select', label: 'Configuração do ciclo', valor: 'superaquecido',
          opcoes: [
            { v: 'simples', t: 'Simples (vapor saturado)' },
            { v: 'superaquecido', t: 'Com superaquecimento' },
            { v: 'reaquecimento', t: 'Com reaquecimento' },
            { v: 'regenerativo', t: 'Regenerativo (aquecedor de mistura)' }
          ] },
        { id: 'Pcald', label: 'Pressão da caldeira', min: 500, max: 20000, step: 100, valor: 3000,
          unidade: 'kPa', desc: 'Sobe a temperatura média de fornecimento — e o rendimento.' },
        { id: 'Pcond', label: 'Pressão do condensador', min: 5, max: 100, step: 1, valor: 10,
          unidade: 'kPa', desc: 'Quanto menor, maior o rendimento. Limitada pela água de resfriamento.' },
        { id: 'T3', label: 'Temperatura na entrada da turbina', min: 250, max: 650, step: 10,
          valor: 350, unidade: '°C', desc: 'Limitada pelo material dos tubos, na prática 600 a 620 °C.' },
        { tipo: 'separador' },
        { id: 'Preaq', label: 'Pressão de reaquecimento', min: 200, max: 6000, step: 100,
          valor: 2000, unidade: 'kPa', desc: 'Só no modo com reaquecimento. Ótimo ≈ 1/4 da pressão da caldeira.' },
        { id: 'T5', label: 'Temperatura após reaquecer', min: 250, max: 650, step: 10,
          valor: 600, unidade: '°C' },
        { id: 'Pext', label: 'Pressão de extração', min: 100, max: 4000, step: 50,
          valor: 1000, unidade: 'kPa', desc: 'Só no modo regenerativo.' },
        { tipo: 'separador' },
        { id: 'etaT', label: 'Rendimento isentrópico da turbina', min: 60, max: 100, step: 1,
          valor: 100, unidade: '%' },
        { id: 'etaB', label: 'Rendimento isentrópico da bomba', min: 60, max: 100, step: 1,
          valor: 100, unidade: '%' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar a instalação', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.2, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'planta', axes: false, height: 420, grid: false, legend: false },
        { id: 'ts', titulo: 'Diagrama T-s com o domo de saturação da água',
          xlabel: 'Entropia s (kJ/kg·K)', ylabel: 'Temperatura (°C)', aspect: 0.52,
          legendPos: 'topleft' },
        { id: 'comp', titulo: 'Energia trocada em cada componente',
          xlabel: '', ylabel: 'kJ/kg', aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'eta', label: 'Rendimento térmico' },
        { id: 'etaCarnot', label: 'Carnot entre T_cald e T_cond' },
        { id: 'wliq', label: 'Trabalho líquido' },
        { id: 'qin', label: 'Calor fornecido' },
        { id: 'qout', label: 'Calor rejeitado' },
        { id: 'bwr', label: 'Fração consumida pela bomba' },
        { id: 'titulo', label: 'Título na saída da turbina' },
        { id: 'mdot', label: 'Vazão para 100 MW' }
      ],
      formulas: [
        { g: 'Os quatro processos ideais' },
        { tex: '1 \\to 2:\\ \\text{bomba, compressão isentrópica}', d: 's constante · P sobe muito · T sobe pouco · h sobe pouco', destaque: true },
        { tex: '2 \\to 3:\\ \\text{caldeira, aquecimento isobárico}', d: 'P constante · T sobe · h sobe muito · s sobe muito', destaque: true },
        { tex: '3 \\to 4:\\ \\text{turbina, expansão isentrópica}', d: 's constante · P despenca · T cai · h cai (é o trabalho)', destaque: true },
        { tex: '4 \\to 1:\\ \\text{condensador, rejeição isobárica}', d: 'P e T constantes (mistura!) · h cai · s cai', destaque: true },

        { g: 'Balanço de cada componente (regime permanente)' },
        { tex: 'w_{\\text{bomba}} = h_2 - h_1 \\approx v_1(P_2 - P_1)',
          d: 'líquido é praticamente incompressível — por isso a bomba consome tão pouco', destaque: true },
        { tex: 'q_{\\text{ent}} = h_3 - h_2', d: 'na caldeira não há trabalho: todo o calor vira entalpia' },
        { tex: 'w_{\\text{turb}} = h_3 - h_4', d: 'na turbina não há calor: toda a queda de entalpia vira trabalho', destaque: true },
        { tex: 'q_{\\text{sai}} = h_4 - h_1', d: 'no condensador, calor rejeitado à água de resfriamento' },

        { g: 'Rendimento' },
        { tex: '\\eta = \\frac{w_{\\text{líq}}}{q_{\\text{ent}}} = \\frac{w_{\\text{turb}} - w_{\\text{bomba}}}{h_3 - h_2}',
          d: 'o que se ganha dividido pelo que se paga', destaque: true },
        { tex: '\\eta = 1 - \\frac{q_{\\text{sai}}}{q_{\\text{ent}}}', d: 'forma equivalente pela primeira lei' },
        { tex: 'BWR = \\frac{w_{\\text{bomba}}}{w_{\\text{turb}}}',
          d: 'no Rankine fica em torno de 1 %; no Brayton chega a 50 %' },

        { g: 'Como aumentar o rendimento' },
        { tex: 'P_{\\text{cond}} \\downarrow', d: 'baixa a temperatura média de rejeição — o mais eficaz, limitado pela água disponível' },
        { tex: 'T_3 \\uparrow', d: 'sobe a temperatura média de fornecimento e ainda seca a saída da turbina' },
        { tex: 'P_{\\text{cald}} \\uparrow', d: 'sobe a temperatura de evaporação, mas MOLHA a saída da turbina' },
        { tex: '\\text{Reaquecimento}', d: 'expande em dois estágios e reaquece no meio: resolve a umidade e ganha alguns pontos' },
        { tex: '\\text{Regeneração}', d: 'extrai vapor para preaquecer a água: sobe a temperatura média de fornecimento' },

        { g: 'Máquinas reais' },
        { tex: '\\eta_{T} = \\frac{h_3 - h_4}{h_3 - h_{4s}}', d: 'rendimento isentrópico da turbina: real sobre ideal', destaque: true },
        { tex: '\\eta_{B} = \\frac{h_{2s} - h_1}{h_2 - h_1}', d: 'na bomba a razão se inverte: ideal sobre real' },
        { tex: 'x_4 \\ge 0{,}88', d: 'limite prático: abaixo disso as gotas erodem as pás da turbina', destaque: true }
      ],
      passos: [],
      passosTitulo: 'O que acontece em cada componente',
      passosAbertos: true,
      nota: 'Propriedades da água pelas equações auxiliares do IAPWS-95 na saturação e virial truncado no vapor superaquecido. Conferido contra tabela de vapor: erro máximo de 0,40 % em h e 0,21 % em s; o ciclo de referência de 3 MPa / 350 °C / 10 kPa fecha em 33,5 % contra 33,4 % da tabela.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        var e = r.e;
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        desenhaPlanta();

        /* ---------- diagrama T-s ---------- */
        var g = ctx.plot('ts').clear();
        g.line(DOMO.s, DOMO.T, { color: Plot.cssVar('--text-faint', '#999'), width: 1.6,
          dash: [4, 3], label: 'domo de saturação' });

        /* caminho do ciclo */
        var sc = [], Tc2 = [];
        function isobarica(P, sA, sB, n) {
          /* percorre a isobárica de sA a sB, ponto a ponto */
          var out = [];
          for (var i = 0; i <= n; i++) {
            var ss = sA + (sB - sA) * i / n;
            var Ts = AGUA.Tsat(P);
            var sfc = AGUA.sf(Ts), sgc = AGUA.sg(Ts);
            if (ss <= sfc) out.push([ss, Ts - 273.15]);
            else if (ss <= sgc) out.push([ss, Ts - 273.15]);
            else {
              var a2 = Ts, b2 = 1300;
              for (var k = 0; k < 40; k++) { var m = (a2 + b2) / 2; if (AGUA.sSup(m, P) < ss) a2 = m; else b2 = m; }
              out.push([ss, (a2 + b2) / 2 - 273.15]);
            }
          }
          return out;
        }
        function empilha(pts) { pts.forEach(function (q) { sc.push(q[0]); Tc2.push(q[1]); }); }

        var ordem = r.ordem;
        for (var i = 0; i < ordem.length; i++) {
          var eA = e[ordem[i]], eB = e[ordem[(i + 1) % ordem.length]];
          if (Math.abs(eA.P - eB.P) < 1e-6) empilha(isobarica(eA.P, eA.s, eB.s, 26));
          else { sc.push(eA.s); Tc2.push(eA.T - 273.15); sc.push(eB.s); Tc2.push(eB.T - 273.15); }
        }
        sc.push(sc[0]); Tc2.push(Tc2[0]);
        g.line(sc, Tc2, { color: Plot.serie(5), width: 2.8, label: 'ciclo' });
        A.ts = { s: sc, T: Tc2 };
        ordem.forEach(function (n) {
          g.marker(e[n].s, e[n].T - 273.15, String(n), { color: Plot.serie(6), r: 4.5 });
        });
        g.hline(r.Tb - 273.15, { color: Plot.serie(1), dash: [3, 3], width: 1.1,
          text: 'T_sat caldeira = ' + Plot.sig(r.Tb - 273.15, 4) + ' °C' });
        g.hline(r.Tc - 273.15, { color: Plot.serie(0), dash: [3, 3], width: 1.1,
          text: 'T_sat condensador = ' + Plot.sig(r.Tc - 273.15, 3) + ' °C' });
        g.draw();

        /* ---------- barras por componente ---------- */
        var gb = ctx.plot('comp').clear();
        gb.o.xcat = [{ v: 0, label: 'caldeira\nq entra' }, { v: 1, label: 'turbina\nw sai' },
                     { v: 2, label: 'condensador\nq sai' }, { v: 3, label: 'bomba\nw entra' },
                     { v: 4, label: 'líquido\nw útil' }];
        var vals = [r.qin, r.wt, -r.qout, -r.wp, r.wliq];
        var cores = [Plot.serie(5), Plot.serie(2), Plot.serie(0), Plot.serie(4), Plot.serie(3)];
        var alto = Math.max.apply(null, vals), baixo = Math.min.apply(null, vals);
        var faixa = Math.max(alto - baixo, 1);
        gb.setLimits([-0.62, 4.62], [baixo - faixa * 0.14, alto + faixa * 0.20]);
        vals.forEach(function (v, k) {
          gb.bars([k], [v], { color: cores[k], barw: 0.5 });
          gb.text(k, v, Plot.sig(Math.abs(v), 4), { align: 'center', dy: v >= 0 ? -7 : 15, size: 11 });
        });
        gb.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        gb.draw();

        /* ---------- o que acontece em cada componente ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        var i1 = r.modo === 'regenerativo' ? 1 : 1;
        var iTurbEnt = r.modo === 'regenerativo' ? 5 : 3;
        var iTurbSai = r.modo === 'regenerativo' ? 7 : (r.modo === 'reaquecimento' ? 6 : 4);
        var iCald = r.modo === 'regenerativo' ? 4 : 2;
        var passos = [
          { t: '① Bomba — comprime o líquido (1 → ' + (r.modo === 'regenerativo' ? '2' : '2') + ')',
            tex: 'w_{\\text{bomba}} = v_1(P_2 - P_1) \\quad\\text{com } s = \\text{const}',
            texSub: 'w_{\\text{bomba}} = ' + nt(AGUA.vf(r.Tc)) + '(' + p.Pcald + ' - ' + p.Pcond +
              ') = ' + nt(r.wp) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: pressão (muito) e entalpia (pouquíssimo). NÃO MUDA: entropia (ideal) e '
              + 'praticamente o volume específico — o líquido é incompressível. É por isso que a bomba '
              + 'consome só ' + sg(r.wp / r.wt * 100, 3) + ' % do que a turbina produz.' },
          { t: '② Caldeira — fornece calor a pressão constante (' + iCald + ' → ' + iTurbEnt + ')',
            tex: 'q_{\\text{ent}} = h_3 - h_2 \\quad\\text{com } P = \\text{const}',
            texSub: 'q_{\\text{ent}} = ' + nt(e[iTurbEnt].h) + ' - ' + nt(e[iCald].h) + ' = ' +
              nt(r.qin) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: entalpia (muito), entropia (muito) e temperatura. NÃO MUDA: a pressão. '
              + 'Dentro do domo a temperatura também fica parada em ' + sg(r.Tb - 273.15, 4) +
              ' °C enquanto a água evapora — todo o calor vai para o calor latente.' },
          { t: '③ Turbina — expande e produz trabalho (' + iTurbEnt + ' → ' + iTurbSai + ')',
            tex: 'w_{\\text{turb}} = h_3 - h_4 \\quad\\text{com } q = 0',
            texSub: 'w_{\\text{turb}} = ' + nt(e[iTurbEnt].h) + ' - ' + nt(e[iTurbSai].h) + ' = ' +
              nt(r.wt) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: pressão, temperatura e entalpia — a queda de h É o trabalho. NÃO MUDA: a entropia, '
              + (p.etaT >= 100 ? 'porque a expansão é isentrópica (linha vertical no T-s).'
                : 'só na turbina ideal; com η_T = ' + p.etaT + ' % a entropia AUMENTA e a linha inclina para a direita.') },
          { t: '④ Condensador — rejeita calor a pressão constante (' + iTurbSai + ' → 1)',
            tex: 'q_{\\text{sai}} = h_4 - h_1 \\quad\\text{com } P = T = \\text{const}',
            texSub: 'q_{\\text{sai}} = ' + nt(e[iTurbSai].h) + ' - ' + nt(e[1].h) + ' = ' +
              nt(r.qout) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: entalpia e entropia, ambas caindo. NÃO MUDA: pressão E temperatura, porque o '
              + 'fluido está dentro do domo — condensa a ' + sg(r.Tc - 273.15, 3) + ' °C do começo ao fim. '
              + 'Este calor não é perdido por ineficiência: a segunda lei OBRIGA a rejeitá-lo.' },
          { t: '⑤ Rendimento térmico',
            tex: '\\eta = \\frac{w_{\\text{turb}} - w_{\\text{bomba}}}{q_{\\text{ent}}}',
            texSub: '\\eta = \\frac{' + nt(r.wt) + ' - ' + nt(r.wp) + '}{' + nt(r.qin) + '} = ' +
              nt(r.eta) + ' = ' + nt(r.eta * 100) + '\\%',
            obs: 'Carnot entre as mesmas temperaturas daria ' +
              sg((1 - r.Tc / r.Tb) * 100, 4) + ' %. A diferença existe porque o calor não entra todo na '
              + 'temperatura máxima: parte é usada para aquecer o líquido de ' + sg(r.Tc - 273.15, 3) +
              ' °C até ' + sg(r.Tb - 273.15, 4) + ' °C.' },
          { t: '⑥ Título na saída da turbina',
            tex: 'x_4 = \\frac{h_4 - h_f}{h_{fg}}',
            texSub: e[iTurbSai].x !== null
              ? 'x = \\frac{' + nt(e[iTurbSai].h) + ' - ' + nt(AGUA.hf(r.Tc)) + '}{' +
                nt(AGUA.hfg(r.Tc)) + '} = ' + nt(e[iTurbSai].x)
              : '\\text{saída superaquecida: não há título}',
            obs: e[iTurbSai].x === null ? 'A expansão termina fora do domo — situação ideal, sem gotas.'
              : (e[iTurbSai].x < 0.88
                ? 'ABAIXO de 0,88: gotas demais, erosão nas pás do último estágio. Superaqueça mais, '
                  + 'reaqueça, ou baixe a pressão da caldeira.'
                : 'Acima de 0,88 — dentro do aceitável para as pás da turbina.') }
        ];
        if (r.modo === 'reaquecimento') {
          passos.splice(3, 0, { t: '③b Reaquecedor — devolve o vapor à caldeira (4 → 5)',
            tex: 'q_{\\text{reaq}} = h_5 - h_4 \\quad\\text{com } P = \\text{const}',
            texSub: 'q_{\\text{reaq}} = ' + nt(e[5].h) + ' - ' + nt(e[4].h) + ' = ' +
              nt(e[5].h - e[4].h) + '\\ \\mathrm{kJ/kg}',
            obs: 'O vapor sai da turbina de alta a ' + sg(r.Pr / 1000, 3) + ' MPa, volta à caldeira, '
              + 'reaquece até ' + sg(e[5].T - 273.15, 4) + ' °C e expande de novo. O ganho principal '
              + 'não é rendimento (uns 4 pontos), é SECAR o fim da expansão.' });
        }
        if (r.modo === 'regenerativo') {
          passos.splice(2, 0, { t: '②b Aquecedor de mistura — preaquece a água (2 + 6 → 3)',
            tex: 'y\\,h_6 + (1-y)h_2 = h_3',
            texSub: 'y = \\frac{h_3 - h_2}{h_6 - h_2} = \\frac{' + nt(e[3].h) + ' - ' + nt(e[2].h) +
              '}{' + nt(e[6].h) + ' - ' + nt(e[2].h) + '} = ' + nt(r.y),
            obs: 'Extrai-se ' + sg(r.y * 100, 3) + ' % do vapor da turbina a ' + sg(r.Pe / 1000, 3) +
              ' MPa e mistura-se com a água do condensador. Perde-se trabalho naquela fração, mas a '
              + 'água entra na caldeira muito mais quente — a temperatura MÉDIA de fornecimento sobe, '
              + 'e o rendimento com ela.' });
        }
        ctx.setPassos(passos);

        var etaCarnot = 1 - r.Tc / r.Tb;
        var mdot = r.wliq > 0 ? 100000 / r.wliq : NaN;
        return {
          eta: { v: r.eta * 100, u: '%', classe: 'destaque' },
          etaCarnot: { v: etaCarnot * 100, u: '%' },
          wliq: { v: r.wliq, u: 'kJ/kg' },
          qin: { v: r.qin, u: 'kJ/kg' },
          qout: { v: r.qout, u: 'kJ/kg' },
          bwr: { v: r.wp / r.wt * 100, u: '%' },
          titulo: { v: r.x !== null && r.x !== undefined ? Plot.sig(r.x, 4) : 'superaq.', u: '',
                    classe: (r.x !== null && r.x < 0.88) ? 'alerta' : 'ok' },
          mdot: { v: mdot, u: 'kg/s' }
        };
      }
    });

    function desenhaPlanta() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('planta');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(montarPlanta(A.p, A.r, A.fase));
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.r) return;
      var dt = A.rel.dt();
      A.fase = (A.fase + dt * 0.22 * A.vel) % 1;
      desenhaPlanta();
      /* ponto correndo pelo diagrama T-s, na mesma fase */
      var g = A.ctx.plot('ts');
      if (g && A.ts) {
        g.draw();
        var n = A.ts.s.length;
        var idx = Math.min(n - 1, Math.floor(A.fase * (n - 1)));
        var c2 = g.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath();
        c2.arc(g.px(A.ts.s[idx]), g.py(A.ts.T[idx]), 6, 0, TAU);
        c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 2;
        c2.stroke();
        c2.restore();
      }
    });
  })();

  /* ============================================================
     2. Ciclos Otto e Diesel — motores alternativos
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-otto-diesel')) return;

    var A = { on: true, fase: 0, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };

    /* padrão a ar frio: ar como gás ideal com calores específicos constantes */
    function resolver(p) {
      var k = p.k, cv = 0.718, cp = cv * k;
      var T1 = p.T1 + 273.15, P1 = p.P1;
      var r = p.r;
      var e = {};
      e[1] = { T: T1, P: P1, v: 0.287 * T1 / P1 };
      /* 1→2 compressão isentrópica */
      e[2] = { T: T1 * Math.pow(r, k - 1), v: e[1].v / r };
      e[2].P = 0.287 * e[2].T / e[2].v;

      var qin, qout, rc = 1;
      if (p.ciclo === 'otto') {
        /* 2→3 calor a VOLUME constante */
        e[3] = { v: e[2].v, T: e[2].T + p.qin / cv };
        e[3].P = 0.287 * e[3].T / e[3].v;
        /* 3→4 expansão isentrópica até v1 */
        e[4] = { v: e[1].v, T: e[3].T * Math.pow(1 / r, k - 1) };
        e[4].P = 0.287 * e[4].T / e[4].v;
        qin = cv * (e[3].T - e[2].T);
        qout = cv * (e[4].T - e[1].T);
      } else {
        /* 2→3 calor a PRESSÃO constante */
        e[3] = { P: e[2].P, T: e[2].T + p.qin / cp };
        e[3].v = 0.287 * e[3].T / e[3].P;
        rc = e[3].v / e[2].v;
        e[4] = { v: e[1].v, T: e[3].T * Math.pow(e[3].v / e[1].v, k - 1) };
        e[4].P = 0.287 * e[4].T / e[4].v;
        qin = cp * (e[3].T - e[2].T);
        qout = cv * (e[4].T - e[1].T);
      }
      var wliq = qin - qout;
      var eta = wliq / qin;
      /* rendimentos pelas formas fechadas, para conferência */
      var etaOtto = 1 - Math.pow(r, 1 - k);
      var etaDiesel = 1 - Math.pow(r, 1 - k) * (Math.pow(rc, k) - 1) / (k * (rc - 1));
      var pme = wliq / (e[1].v - e[2].v);
      return { e: e, qin: qin, qout: qout, wliq: wliq, eta: eta, rc: rc,
               etaOtto: etaOtto, etaDiesel: etaDiesel, pme: pme, k: k, r: r,
               ciclo: p.ciclo };
    }

    /* posição do pistão pelo mecanismo biela-manivela */
    function posPistao(th, lam) {
      return (1 - Math.cos(th) + (1 - Math.sqrt(1 - lam * lam * Math.sin(th) * Math.sin(th))) / lam) /
             (2 + (1 - Math.sqrt(1 - lam * lam)) / lam);
    }

    /* qual processo está acontecendo, em função da fase 0..1 */
    function processo(fase, ciclo) {
      if (fase < 0.25) return { n: 0, nome: '1→2 compressão isentrópica',
        obs: 'válvulas fechadas · s constante · T e P sobem' };
      if (fase < 0.30) return { n: 1, nome: ciclo === 'otto' ? '2→3 combustão a volume constante'
        : '2→3 combustão a pressão constante',
        obs: ciclo === 'otto' ? 'faísca · o pistão quase não anda · P dispara'
                              : 'injeção · o pistão desce enquanto queima · P constante' };
      if (fase < 0.55) return { n: 2, nome: '3→4 expansão isentrópica',
        obs: 'é aqui que o motor produz trabalho · s constante' };
      if (fase < 0.60) return { n: 3, nome: '4→1 rejeição a volume constante',
        obs: 'abre o escape · P cai sem o pistão andar' };
      if (fase < 0.80) return { n: 4, nome: 'escape', obs: 'expulsa os gases queimados' };
      return { n: 5, nome: 'admissão', obs: 'aspira mistura fresca' };
    }

    function desenharMotor(c, pl, p, r, fase) {
      var a = pl._area;
      var texto = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var proc = processo(fase, r.ciclo);

      /* dois giros da manivela em um ciclo de quatro tempos */
      var th = fase * TAU * 2;
      var s = posPistao(th, 0.30);

      var cxCil = a.x + a.w * 0.27;
      var larg = Math.min(a.w * 0.22, 124);
      var yTopo = a.y + 74;
      var curso = a.h * 0.34;
      var folga = curso / Math.max(r.r - 1, 0.5);      /* volume morto pela taxa */
      var yPist = yTopo + folga + s * curso;

      /* camisa */
      c.setLineDash([]);
      c.strokeStyle = borda; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(cxCil - larg / 2, yTopo - 2);
      c.lineTo(cxCil - larg / 2, yTopo + folga + curso + 44);
      c.moveTo(cxCil + larg / 2, yTopo - 2);
      c.lineTo(cxCil + larg / 2, yTopo + folga + curso + 44);
      c.moveTo(cxCil - larg / 2, yTopo - 2);
      c.lineTo(cxCil + larg / 2, yTopo - 2);
      c.stroke();

      /* gás, colorido pela temperatura instantânea aproximada */
      var Test = proc.n === 1 ? r.e[3].T : (proc.n === 2 ? (r.e[3].T + r.e[4].T) / 2
        : (proc.n === 0 ? (r.e[1].T + r.e[2].T) / 2 : r.e[1].T));
      c.fillStyle = corFluido(Test, r.e[1].T, r.e[3].T);
      c.globalAlpha = 0.45;
      c.fillRect(cxCil - larg / 2 + 2, yTopo, larg - 4, yPist - yTopo);
      c.globalAlpha = 1;

      /* pistão */
      c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
      c.fillRect(cxCil - larg / 2 + 2, yPist, larg - 4, 26);
      c.strokeStyle = texto; c.lineWidth = 2;
      c.strokeRect(cxCil - larg / 2 + 2, yPist, larg - 4, 26);

      /* biela e manivela */
      var cyMan = yTopo + folga + curso + 84;
      var rMan = curso / 2;
      var xPino = cxCil + rMan * Math.sin(th), yPino = cyMan - rMan * Math.cos(th);
      c.strokeStyle = Plot.serie(1); c.lineWidth = 3.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cxCil, yPist + 13); c.lineTo(xPino, yPino); c.stroke();
      c.strokeStyle = borda; c.lineWidth = 1.6;
      c.beginPath(); c.arc(cxCil, cyMan, rMan, 0, TAU); c.stroke();
      c.strokeStyle = Plot.serie(1); c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(cxCil, cyMan); c.lineTo(xPino, yPino); c.stroke();
      c.lineCap = 'butt';
      c.fillStyle = texto;
      c.beginPath(); c.arc(cxCil, cyMan, 4.5, 0, TAU); c.fill();

      /* válvulas */
      function valvula(x, aberta, rotulo, cor) {
        c.strokeStyle = aberta ? cor : faint;
        c.lineWidth = 2; c.setLineDash([]);
        c.beginPath();
        c.moveTo(x - 9, yTopo - 20); c.lineTo(x + 9, yTopo - 20); c.lineTo(x, yTopo - 4);
        c.closePath();
        if (aberta) { c.fillStyle = cor; c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1; }
        c.stroke();
        c.fillStyle = aberta ? cor : faint;
        c.font = fonte(9.5, aberta ? '700' : '400');
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText(rotulo, x, yTopo - 24);
      }
      valvula(cxCil - larg * 0.28, proc.n === 5, 'admissão', Plot.serie(0));
      valvula(cxCil + larg * 0.28, proc.n === 4 || proc.n === 3, 'escape', Plot.serie(5));

      /* vela ou bico injetor */
      if (r.ciclo === 'otto') {
        c.strokeStyle = proc.n === 1 ? Plot.serie(4) : faint;
        c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(cxCil, yTopo - 22); c.lineTo(cxCil, yTopo + 5); c.stroke();
        if (proc.n === 1) {
          c.strokeStyle = Plot.serie(4); c.lineWidth = 1.6;
          for (var i = 0; i < 6; i++) {
            var ang = i * TAU / 6 + fase * 40;
            c.beginPath();
            c.moveTo(cxCil, yTopo + 6);
            c.lineTo(cxCil + Math.cos(ang) * 13, yTopo + 6 + Math.sin(ang) * 9);
            c.stroke();
          }
        }
        c.fillStyle = faint; c.font = fonte(9.5);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('vela', cxCil + 6, yTopo - 30);
      } else {
        c.strokeStyle = proc.n === 1 ? Plot.serie(5) : faint;
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(cxCil, yTopo - 22); c.lineTo(cxCil, yTopo + 3); c.stroke();
        if (proc.n === 1) {
          c.fillStyle = Plot.serie(5);
          for (var j = 0; j < 9; j++) {
            var ph = ((fase * 12 + j * 0.11) % 1);
            c.globalAlpha = 0.8 * (1 - ph);
            c.beginPath();
            c.arc(cxCil + (j - 4) * 3.4 * ph * 2, yTopo + 6 + ph * 22, 2.2, 0, TAU);
            c.fill();
          }
          c.globalAlpha = 1;
        }
        c.fillStyle = faint; c.font = fonte(9.5);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('injetor', cxCil + 6, yTopo - 30);
      }

      /* eixo com volante, mostrando o trabalho saindo */
      var xv = a.x + a.w * 0.66;
      c.strokeStyle = texto; c.lineWidth = 4;
      c.beginPath(); c.moveTo(cxCil + rMan, cyMan); c.lineTo(xv - 26, cyMan); c.stroke();
      c.strokeStyle = Plot.serie(3); c.lineWidth = 2.4;
      c.beginPath(); c.arc(xv, cyMan, 26, 0, TAU); c.stroke();
      rotorGirando(c, xv, cyMan, 26, th, Plot.serie(3), 6);
      c.fillStyle = Plot.serie(3); c.font = fonte(10.5, '700');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('volante', xv, cyMan + 30);
      seta(c, xv + 30, cyMan, xv + 76, cyMan, Plot.serie(3), 2.6, 10);
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.font = fonte(11.5, '700');
      c.fillText('w = ' + Plot.sig(r.wliq, 4) + ' kJ/kg', xv + 82, cyMan);

      /* calor entrando e saindo */
      seta(c, cxCil - larg / 2 - 54, yTopo + 14, cxCil - larg / 2 - 8, yTopo + 14,
           Plot.serie(5), 2.4, 9);
      c.fillStyle = Plot.serie(5); c.font = fonte(10.5, '700');
      c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('q_ent = ' + Plot.sig(r.qin, 4), cxCil - larg / 2 - 54, yTopo + 8);
      seta(c, cxCil + larg / 2 + 8, yTopo + 40, cxCil + larg / 2 + 54, yTopo + 40,
           Plot.serie(0), 2.4, 9);
      c.fillStyle = Plot.serie(0);
      c.fillText('q_sai = ' + Plot.sig(r.qout, 4), cxCil + larg / 2 + 8, yTopo + 34);

      /* faixa de estado */
      c.fillStyle = texto; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Ciclo ' + (r.ciclo === 'otto' ? 'Otto — ignição por centelha'
        : 'Diesel — ignição por compressão'), a.x + 4, a.y + 2);
      c.font = fonte(11.5, '700');
      c.fillStyle = Plot.serie(6);
      c.fillText(proc.nome, a.x + 4, a.y + 20);
      c.font = fonte(10);
      c.fillStyle = faint;
      c.fillText(proc.obs, a.x + 4, a.y + 36);
    }

    Sim.build('#sim-otto-diesel', {
      titulo: 'Ciclos Otto e Diesel — o motor por dentro',
      descricao: 'O pistão desce e sobe de verdade, a vela solta faísca no ponto certo, o injetor pulveriza combustível, e o ponto correspondente anda pelos diagramas p-v e T-s ao mesmo tempo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Motor a gasolina', desc: 'Otto com taxa 9:1 — o limite da detonação',
          valores: { ciclo: 'otto', r: 9, qin: 1800, T1: 27, P1: 100, k: 1.4, animar: true, vel: 1 } },
        { nome: '2 · Gasolina de alta octanagem', desc: 'Taxa 12:1: mais rendimento, exige combustível melhor',
          valores: { ciclo: 'otto', r: 12, qin: 1800, T1: 27, P1: 100, k: 1.4, animar: true, vel: 1 } },
        { nome: '3 · Motor diesel', desc: 'Taxa 18:1 — só o ar é comprimido, não há detonação',
          valores: { ciclo: 'diesel', r: 18, qin: 1800, T1: 27, P1: 100, k: 1.4, animar: true, vel: 1 } },
        { nome: '4 · Diesel e Otto na MESMA taxa', desc: 'Compare: na mesma taxa o Otto rende mais',
          valores: { ciclo: 'diesel', r: 9, qin: 1800, T1: 27, P1: 100, k: 1.4, animar: true, vel: 1 } },
        { nome: '5 · Carga parcial', desc: 'Menos combustível: o corte de admissão fica menor',
          valores: { ciclo: 'diesel', r: 18, qin: 800, T1: 27, P1: 100, k: 1.4, animar: true, vel: 1 } },
        { nome: '6 · Taxa muito alta (22:1)', desc: 'Diesel de grande porte, pressões elevadíssimas',
          valores: { ciclo: 'diesel', r: 22, qin: 1800, T1: 27, P1: 100, k: 1.4, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'ciclo', tipo: 'seg', label: 'Ciclo', valor: 'otto',
          opcoes: [{ v: 'otto', t: 'Otto (centelha)' }, { v: 'diesel', t: 'Diesel (compressão)' }] },
        { id: 'r', label: 'Taxa de compressão r', min: 5, max: 24, step: 0.5, valor: 9, unidade: ':1',
          desc: 'Otto: limitada pela detonação, 8 a 12. Diesel: 15 a 22, porque comprime só ar.' },
        { id: 'qin', label: 'Calor fornecido por ciclo', min: 300, max: 2600, step: 50, valor: 1800,
          unidade: 'kJ/kg', desc: 'É a "carga" do motor: quanto combustível se queima.' },
        { id: 'T1', label: 'Temperatura na admissão', min: -10, max: 80, step: 5, valor: 27, unidade: '°C' },
        { id: 'P1', label: 'Pressão na admissão', min: 50, max: 300, step: 10, valor: 100, unidade: 'kPa',
          desc: 'Acima de 100 kPa representa motor turbinado.' },
        { id: 'k', label: 'Razão de calores específicos k', min: 1.3, max: 1.4, step: 0.01, valor: 1.4,
          unidade: '', desc: 'Ar frio 1,4. Com o gás quente real cai para cerca de 1,3.' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Mover o motor', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.1, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'motor', axes: false, height: 460, grid: false, legend: false },
        { id: 'pv', titulo: 'Diagrama p-v — a área interna é o trabalho líquido',
          xlabel: 'Volume específico v (m³/kg)', ylabel: 'Pressão (kPa)', aspect: 0.44,
          legendPos: 'topright' },
        { id: 'ts', titulo: 'Diagrama T-s — a área interna é o calor líquido',
          xlabel: 'Entropia relativa Δs (kJ/kg·K)', ylabel: 'Temperatura (°C)', aspect: 0.40,
          legendPos: 'topleft' },
        { id: 'curva', titulo: 'Rendimento em função da taxa de compressão',
          xlabel: 'Taxa de compressão r', ylabel: 'Rendimento térmico', aspect: 0.32,
          legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'eta', label: 'Rendimento térmico' },
        { id: 'T2', label: 'T após compressão' },
        { id: 'T3', label: 'T máxima do ciclo' },
        { id: 'P3', label: 'P máxima do ciclo' },
        { id: 'wliq', label: 'Trabalho líquido' },
        { id: 'pme', label: 'Pressão média efetiva' },
        { id: 'rc', label: 'Razão de corte r_c' },
        { id: 'carnot', label: 'Carnot entre T1 e T3' }
      ],
      formulas: [
        { g: 'Ciclo Otto — quatro processos' },
        { tex: '1 \\to 2:\\ \\text{compressão isentrópica}', d: 's constante · T e P sobem', destaque: true },
        { tex: '2 \\to 3:\\ \\text{calor a VOLUME constante}', d: 'a faísca queima tudo tão rápido que o pistão não anda', destaque: true },
        { tex: '3 \\to 4:\\ \\text{expansão isentrópica}', d: 'o tempo motor: é onde o trabalho é produzido' },
        { tex: '4 \\to 1:\\ \\text{rejeição a volume constante}', d: 'abre o escape e a pressão cai de repente' },
        { tex: '\\eta_{Otto} = 1 - \\frac{1}{r^{\\,k-1}}',
          d: 'depende SÓ da taxa de compressão e de k — não da quantidade de calor', destaque: true },

        { g: 'Ciclo Diesel' },
        { tex: '2 \\to 3:\\ \\text{calor a PRESSÃO constante}', d: 'o combustível é injetado aos poucos enquanto o pistão já desce', destaque: true },
        { tex: 'r_c = \\frac{v_3}{v_2}', d: 'razão de corte: até onde vai a injeção' },
        { tex: '\\eta_{Diesel} = 1 - \\frac{1}{r^{\\,k-1}}\\left[\\frac{r_c^{\\,k} - 1}{k(r_c - 1)}\\right]',
          d: 'o colchete é sempre MAIOR que 1: na mesma taxa, o Diesel rende menos', destaque: true },
        { tex: 'r_c \\to 1 \\;\\Rightarrow\\; \\eta_{Diesel} \\to \\eta_{Otto}',
          d: 'com injeção instantânea os dois ciclos coincidem' },

        { g: 'Por que o Diesel real rende mais' },
        { tex: 'r_{Otto} \\le 12 \\quad\\text{contra}\\quad r_{Diesel} \\approx 18\\ \\text{a}\\ 22',
          d: 'o Otto comprime MISTURA e detonaria; o Diesel comprime só AR', destaque: true },
        { tex: 'T_2 = T_1 r^{\\,k-1} > T_{\\text{autoignição}}',
          d: 'no Diesel a compressão precisa passar da autoignição do combustível' },

        { g: 'Relações do gás ideal em processo isentrópico' },
        { tex: '\\frac{T_2}{T_1} = \\left(\\frac{v_1}{v_2}\\right)^{k-1} = \\left(\\frac{P_2}{P_1}\\right)^{\\frac{k-1}{k}}',
          d: 'as duas formas equivalentes', destaque: true },
        { tex: 'q_{v} = c_v \\Delta T \\qquad q_{p} = c_p \\Delta T',
          d: 'a volume constante entra c_v; a pressão constante, c_p' },
        { tex: 'PME = \\frac{w_{\\text{líq}}}{v_1 - v_2}',
          d: 'pressão média efetiva: a pressão constante que daria o mesmo trabalho' }
      ],
      passos: [],
      passosTitulo: 'O que acontece em cada processo',
      passosAbertos: true,
      nota: 'Padrão a ar frio: o fluido é ar como gás ideal com calores específicos constantes, a combustão é substituída por transferência de calor e o ciclo é fechado. O rendimento real de um motor é cerca de metade do previsto aqui, mas as TENDÊNCIAS estão todas corretas.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        var e = r.e;
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        desenhaMotor();

        var cv = 0.718, cp = cv * p.k;

        /* ---------- p-v ---------- */
        var xs = [], ys = [], i;
        function isentropica(vA, vB, PA, n) {
          var out = [];
          for (i = 0; i <= n; i++) {
            var vv = vA + (vB - vA) * i / n;
            out.push([vv, PA * Math.pow(vA / vv, p.k)]);
          }
          return out;
        }
        function empilha(pts) { pts.forEach(function (q) { xs.push(q[0]); ys.push(q[1]); }); }
        empilha(isentropica(e[1].v, e[2].v, e[1].P, 30));
        if (p.ciclo === 'otto') { xs.push(e[2].v); ys.push(e[3].P); }
        else { xs.push(e[3].v); ys.push(e[3].P); }
        empilha(isentropica(e[3].v, e[4].v, e[3].P, 30));
        xs.push(e[1].v); ys.push(e[1].P);
        xs.push(e[1].v); ys.push(e[1].P);
        var gp = ctx.plot('pv').clear();
        gp.line(xs, ys, { color: Plot.serie(5), width: 2.8, label: 'ciclo' });
        [1, 2, 3, 4].forEach(function (n) {
          gp.marker(e[n].v, e[n].P, String(n), { color: Plot.serie(6), r: 4.5 });
        });
        gp.draw();
        A.pv = { xs: xs, ys: ys };

        /* ---------- T-s (entropia relativa ao estado 1) ---------- */
        function ds(est) {
          return cv * Math.log(est.T / e[1].T) + 0.287 * Math.log(est.v / e[1].v);
        }
        var ss = [], TT = [];
        ss.push(0); TT.push(e[1].T - 273.15);
        ss.push(ds(e[2])); TT.push(e[2].T - 273.15);
        /* 2→3: sobe a entropia junto com a temperatura */
        for (i = 0; i <= 24; i++) {
          var f = i / 24;
          var Ti = e[2].T + (e[3].T - e[2].T) * f;
          var vi = p.ciclo === 'otto' ? e[2].v : 0.287 * Ti / e[2].P;
          ss.push(cv * Math.log(Ti / e[1].T) + 0.287 * Math.log(vi / e[1].v));
          TT.push(Ti - 273.15);
        }
        ss.push(ds(e[4])); TT.push(e[4].T - 273.15);
        for (i = 24; i >= 0; i--) {
          var f2 = i / 24;
          var Tj = e[1].T + (e[4].T - e[1].T) * f2;
          ss.push(cv * Math.log(Tj / e[1].T));
          TT.push(Tj - 273.15);
        }
        var gt = ctx.plot('ts').clear();
        gt.line(ss, TT, { color: Plot.serie(5), width: 2.8, label: 'ciclo' });
        [1, 2, 3, 4].forEach(function (n) {
          gt.marker(ds(e[n]), e[n].T - 273.15, String(n), { color: Plot.serie(6), r: 4.5 });
        });
        gt.draw();

        /* ---------- rendimento x taxa ---------- */
        var rs = Plot.linspace(4, 24, 60);
        var gc = ctx.plot('curva').clear();
        gc.line(rs, rs.map(function (rr) { return 1 - Math.pow(rr, 1 - p.k); }),
          { color: Plot.serie(0), width: 2.6, label: 'Otto' });
        gc.line(rs, rs.map(function (rr) {
          var T2 = e[1].T * Math.pow(rr, p.k - 1);
          var T3 = T2 + p.qin / cp;
          var rcx = T3 / T2;
          return 1 - Math.pow(rr, 1 - p.k) * (Math.pow(rcx, p.k) - 1) / (p.k * (rcx - 1));
        }), { color: Plot.serie(5), width: 2.6, label: 'Diesel (com esta carga)' });
        gc.vline(12, { color: Plot.serie(4), dash: [4, 3], width: 1.2, text: 'limite de detonação do Otto' });
        gc.marker(p.r, r.eta, 'atual: ' + Plot.sig(r.eta * 100, 4) + ' %', { color: Plot.serie(6) });
        gc.draw();

        /* ---------- passo a passo ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        var passos = [
          { t: '① 1→2 Compressão isentrópica',
            tex: 'T_2 = T_1 r^{\\,k-1}',
            texSub: 'T_2 = ' + nt(e[1].T) + ' \\cdot ' + p.r + '^{' + nt(p.k - 1) + '} = ' +
              nt(e[2].T) + '\\ \\mathrm{K} = ' + nt(e[2].T - 273.15) + '\\ ^\\circ\\mathrm{C}',
            obs: 'MUDA: pressão, temperatura e volume. NÃO MUDA: a entropia — no diagrama T-s é uma '
              + 'reta vertical. ' + (p.ciclo === 'diesel'
                ? 'O ar chega a ' + sg(e[2].T - 273.15, 4) + ' °C, bem acima dos ~250 °C de autoignição '
                  + 'do diesel: por isso não precisa de vela.'
                : 'A ' + sg(e[2].T - 273.15, 4) + ' °C a mistura ainda não se autoinflama — se '
                  + 'inflamasse, seria detonação, o barulho de "batida de pino".') },
          { t: '② 2→3 Fornecimento de calor',
            tex: p.ciclo === 'otto' ? 'q_{\\text{ent}} = c_v(T_3 - T_2) \\quad v = \\text{const}'
              : 'q_{\\text{ent}} = c_p(T_3 - T_2) \\quad P = \\text{const}',
            texSub: 'T_3 = ' + nt(e[2].T) + ' + \\frac{' + p.qin + '}{' +
              nt(p.ciclo === 'otto' ? cv : cp) + '} = ' + nt(e[3].T) + '\\ \\mathrm{K} = ' +
              nt(e[3].T - 273.15) + '\\ ^\\circ\\mathrm{C}',
            obs: p.ciclo === 'otto'
              ? 'MUDA: pressão (dispara para ' + sg(e[3].P / 1000, 4) + ' MPa), temperatura e entropia. '
                + 'NÃO MUDA: o volume — a queima é tão rápida que o pistão praticamente não sai do PMS.'
              : 'MUDA: volume (o pistão já desce), temperatura e entropia. NÃO MUDA: a pressão — a '
                + 'injeção é dosada para manter P constante. A razão de corte fica em ' + sg(r.rc, 3) + '.' },
          { t: '③ 3→4 Expansão isentrópica — o tempo motor',
            tex: 'T_4 = T_3\\left(\\frac{v_3}{v_4}\\right)^{k-1}',
            texSub: 'T_4 = ' + nt(e[3].T) + '\\left(' + nt(e[3].v / e[4].v) + '\\right)^{' +
              nt(p.k - 1) + '} = ' + nt(e[4].T) + '\\ \\mathrm{K}',
            obs: 'MUDA: pressão, temperatura e volume. NÃO MUDA: a entropia. É o único processo em que '
              + 'o motor entrega trabalho — os outros três consomem ou apenas trocam calor.' },
          { t: '④ 4→1 Rejeição de calor a volume constante',
            tex: 'q_{\\text{sai}} = c_v(T_4 - T_1)',
            texSub: 'q_{\\text{sai}} = 0{,}718(' + nt(e[4].T) + ' - ' + nt(e[1].T) + ') = ' +
              nt(r.qout) + '\\ \\mathrm{kJ/kg}',
            obs: 'No motor real isto é a abertura da válvula de escape: os gases ainda quentes '
              + '(' + sg(e[4].T - 273.15, 4) + ' °C) saem pelo escapamento. Esta energia é a que o '
              + 'turbocompressor e o sistema de recuperação tentam aproveitar.' },
          { t: '⑤ Rendimento térmico',
            tex: p.ciclo === 'otto' ? '\\eta = 1 - \\frac{1}{r^{\\,k-1}}'
              : '\\eta = 1 - \\frac{1}{r^{\\,k-1}}\\left[\\frac{r_c^{\\,k}-1}{k(r_c-1)}\\right]',
            texSub: p.ciclo === 'otto'
              ? '\\eta = 1 - \\frac{1}{' + p.r + '^{' + nt(p.k - 1) + '}} = ' + nt(r.eta) + ' = ' +
                nt(r.eta * 100) + '\\%'
              : '\\eta = 1 - \\frac{1}{' + p.r + '^{' + nt(p.k - 1) + '}}\\left[\\frac{' +
                nt(Math.pow(r.rc, p.k)) + ' - 1}{' + nt(p.k) + '(' + nt(r.rc) + ' - 1)}\\right] = ' +
                nt(r.eta * 100) + '\\%',
            obs: p.ciclo === 'otto'
              ? 'Repare que o calor fornecido NÃO aparece: no Otto ideal o rendimento depende só da '
                + 'taxa de compressão. Um Otto com a taxa de um Diesel (' + p.r + ' → 18) renderia ' +
                sg((1 - Math.pow(18, 1 - p.k)) * 100, 4) + ' %.'
              : 'Na MESMA taxa de compressão, o Otto renderia ' + sg(r.etaOtto * 100, 4) +
                ' % contra ' + sg(r.eta * 100, 4) + ' % do Diesel. O Diesel só ganha na prática '
                + 'porque pode usar taxa muito maior, já que comprime apenas ar.' },
          { t: '⑥ Pressão média efetiva',
            tex: 'PME = \\frac{w_{\\text{líq}}}{v_1 - v_2}',
            texSub: 'PME = \\frac{' + nt(r.wliq) + '}{' + nt(e[1].v) + ' - ' + nt(e[2].v) + '} = ' +
              nt(r.pme) + '\\ \\mathrm{kPa}',
            obs: 'É a pressão constante que, agindo durante todo o curso, daria o mesmo trabalho. '
              + 'Serve para comparar motores de cilindradas diferentes.' }
        ];
        ctx.setPassos(passos);

        return {
          eta: { v: r.eta * 100, u: '%', classe: 'destaque' },
          T2: { v: e[2].T - 273.15, u: '°C' },
          T3: { v: e[3].T - 273.15, u: '°C', classe: e[3].T > 2500 ? 'alerta' : '' },
          P3: { v: e[3].P / 1000, u: 'MPa' },
          wliq: { v: r.wliq, u: 'kJ/kg' },
          pme: { v: r.pme, u: 'kPa' },
          rc: { v: p.ciclo === 'diesel' ? r.rc : 1, u: '' },
          carnot: { v: (1 - e[1].T / e[3].T) * 100, u: '%' }
        };
      }
    });

    function desenhaMotor() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('motor');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharMotor(c, plot, A.p, A.r, A.fase); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.r) return;
      var dt = A.rel.dt();
      A.fase = (A.fase + dt * 0.16 * A.vel) % 1;
      desenhaMotor();
      var gp = A.ctx.plot('pv');
      if (gp && A.pv) {
        gp.draw();
        var n = A.pv.xs.length;
        /* a fase percorre os quatro processos na primeira metade do ciclo */
        var f = Math.min(1, A.fase / 0.6);
        var idx = Math.min(n - 1, Math.floor(f * (n - 1)));
        var c2 = gp.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath(); c2.arc(gp.px(A.pv.xs[idx]), gp.py(A.pv.ys[idx]), 6, 0, TAU); c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 2; c2.stroke();
        c2.restore();
      }
    });
  })();

  /* ============================================================
     3. Ciclo Brayton — turbina a gás
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-brayton')) return;

    var A = { on: true, fase: 0, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };

    function resolver(p) {
      var k = p.k, cp = 1.005;
      var T1 = p.T1 + 273.15, T3 = p.T3 + 273.15;
      var rp = p.rp, expo = (k - 1) / k;
      var e = {};
      e[1] = { T: T1, P: p.P1 };
      /* 1→2 compressão */
      var T2s = T1 * Math.pow(rp, expo);
      var T2 = T1 + (T2s - T1) / (p.etaC / 100);
      e[2] = { T: T2, P: p.P1 * rp, Ts: T2s };
      /* 3: entrada da turbina */
      e[3] = { T: T3, P: p.P1 * rp };
      /* 3→4 expansão */
      var T4s = T3 * Math.pow(1 / rp, expo);
      var T4 = T3 - (T3 - T4s) * (p.etaT / 100);
      e[4] = { T: T4, P: p.P1, Ts: T4s };

      /* regenerador: preaquece o ar com os gases de escape */
      var eps = p.regen ? p.eficReg / 100 : 0;
      var T2r = T2 + eps * (T4 - T2);
      e[5] = { T: T2r, P: e[2].P };            /* saída do regenerador, lado frio */
      var T4r = T4 - eps * (T4 - T2);
      e[6] = { T: T4r, P: p.P1 };              /* saída do regenerador, lado quente */

      var wC = cp * (T2 - T1);
      var wT = cp * (T3 - T4);
      var qin = cp * (T3 - T2r);
      var qout = cp * (T4r - T1);
      var wliq = wT - wC;
      var eta = wliq / qin;
      var bwr = wC / wT;
      var qReg = cp * (T2r - T2);
      /* razão de pressão que maximiza o trabalho líquido */
      var rpOtimo = Math.pow(T3 / T1, k / (2 * (k - 1)));

      return { e: e, wC: wC, wT: wT, qin: qin, qout: qout, wliq: wliq, eta: eta,
               bwr: bwr, qReg: qReg, rpOtimo: rpOtimo, eps: eps, cp: cp, k: k,
               T2r: T2r, T4r: T4r };
    }

    function montarPlanta(p, r, fase) {
      return function (c, pl) {
        var a = pl._area;
        var e = r.e;
        var faint = Plot.cssVar('--text-faint', '#999');
        var Tmin = e[1].T - 10, Tmax = e[3].T;
        function cf(T) { return corFluido(T, Tmin, Tmax); }
        var X = function (u) { return a.x + a.w * u; };
        var Y = function (u) { return a.y + a.h * u; };

        var tubos = [], desenhos = [], estados = [];

        /* compressor e turbina no mesmo eixo */
        var cx = X(0.16), cy = Y(0.30), cw = a.w * 0.14, ch = a.h * 0.24;
        var tx = X(0.62), ty = Y(0.28), tw = a.w * 0.15, th2 = a.h * 0.28;
        desenhos.push(function (c2) {
          /* compressor: trapézio que fecha no sentido do escoamento */
          c2.setLineDash([]);
          c2.beginPath();
          c2.moveTo(cx, cy); c2.lineTo(cx + cw, cy + ch * 0.22);
          c2.lineTo(cx + cw, cy + ch * 0.78); c2.lineTo(cx, cy + ch);
          c2.closePath();
          c2.fillStyle = Plot.serie(0); c2.globalAlpha = 0.18; c2.fill(); c2.globalAlpha = 1;
          c2.strokeStyle = Plot.serie(0); c2.lineWidth = 2.2; c2.stroke();
          c2.strokeStyle = Plot.serie(0); c2.lineWidth = 1.5;
          for (var i = 0; i < 7; i++) {
            var xx = cx + cw * (i + 0.5) / 7;
            var hh = ch * (0.52 - 0.22 * (i / 7)) * (0.9 + 0.1 * Math.sin(fase * 30 + i));
            c2.beginPath();
            c2.moveTo(xx, cy + ch / 2 - hh / 2); c2.lineTo(xx, cy + ch / 2 + hh / 2);
            c2.stroke();
          }
          c2.fillStyle = Plot.serie(0); c2.font = fonte(11.5, '700');
          c2.textAlign = 'center'; c2.textBaseline = 'top';
          c2.fillText('COMPRESSOR', cx + cw / 2, cy + ch + 6);

          turbina(c2, tx, ty, tw, th2, Plot.serie(2), fase * 30, 'TURBINA');

          /* eixo comum */
          c2.strokeStyle = Plot.cssVar('--text', '#111'); c2.lineWidth = 5;
          c2.globalAlpha = 0.4;
          c2.beginPath();
          c2.moveTo(cx + cw / 2, cy + ch / 2); c2.lineTo(tx + tw / 2, ty + th2 / 2);
          c2.stroke();
          c2.globalAlpha = 1;
          c2.fillStyle = faint; c2.font = fonte(9.5);
          c2.textAlign = 'center'; c2.textBaseline = 'bottom';
          c2.fillText('eixo comum', (cx + cw + tx) / 2, cy + ch / 2 - 9);

          /* trabalho líquido saindo */
          seta(c2, tx + tw, ty + th2 * 0.4, X(0.93), ty + th2 * 0.25, Plot.serie(3), 2.8, 12);
          c2.fillStyle = Plot.serie(3); c2.font = fonte(11.5, '700');
          c2.textAlign = 'right'; c2.textBaseline = 'bottom';
          c2.fillText('w_líq = ' + Plot.sig(r.wliq, 4) + ' kJ/kg', X(0.97), ty + th2 * 0.18);
          c2.font = fonte(10);
          c2.fillStyle = faint;
          c2.fillText('BWR = ' + Plot.sig(r.bwr * 100, 3) + ' % volta para o compressor',
                      X(0.97), ty + th2 * 0.18 + 18);
        });

        /* câmara de combustão */
        var bx = X(0.40), by = Y(0.14), bw = a.w * 0.16, bh = a.h * 0.16;
        desenhos.push(function (c2) {
          caixa(c2, bx, by, bw, bh, Plot.serie(5), 'COMBUSTOR', 'q entra');
          chama(c2, bx + 6, by + bh - 4, bw - 12, fase);
          seta(c2, bx - 46, by + bh * 0.4, bx - 6, by + bh * 0.4, Plot.serie(5), 2.4, 9);
          c2.fillStyle = Plot.serie(5); c2.font = fonte(10.5, '700');
          c2.textAlign = 'right'; c2.textBaseline = 'bottom';
          c2.fillText('q_ent = ' + Plot.sig(r.qin, 4) + ' kJ/kg', bx - 6, by + bh * 0.4 - 8);
        });

        /* regenerador */
        var rx = X(0.40), ry = Y(0.62), rw = a.w * 0.16, rh = a.h * 0.16;
        if (p.regen) {
          desenhos.push(function (c2) {
            caixa(c2, rx, ry, rw, rh, Plot.serie(4), 'REGENERADOR',
                  'ε = ' + Plot.sig(r.eps * 100, 3) + ' %');
            serpentina(c2, rx, ry, rw, rh, Plot.serie(4));
            c2.fillStyle = Plot.serie(4); c2.font = fonte(9.5);
            c2.textAlign = 'center'; c2.textBaseline = 'top';
            c2.fillText('recupera ' + Plot.sig(r.qReg, 4) + ' kJ/kg do escape',
                        rx + rw / 2, ry + rh + 5);
          });
        }

        /* admissão e escape */
        desenhos.push(function (c2) {
          seta(c2, X(0.03), cy + ch / 2, cx - 6, cy + ch / 2, Plot.serie(0), 2.4, 10);
          c2.fillStyle = Plot.serie(0); c2.font = fonte(10.5, '600');
          c2.textAlign = 'left'; c2.textBaseline = 'bottom';
          c2.fillText('ar a ' + Plot.sig(e[1].T - 273.15, 3) + ' °C', X(0.03), cy + ch / 2 - 8);
          var xesc = p.regen ? rx : X(0.80);
          seta(c2, xesc + (p.regen ? rw / 2 : 0), Y(0.88), xesc + (p.regen ? rw / 2 : 0), Y(0.97),
               Plot.serie(1), 2.4, 9);
          c2.fillStyle = Plot.serie(1); c2.font = fonte(10.5, '600');
          c2.textAlign = 'center'; c2.textBaseline = 'top';
          c2.fillText('escape a ' + Plot.sig(r.T4r - 273.15, 4) + ' °C  ·  q_sai = ' +
                      Plot.sig(r.qout, 4) + ' kJ/kg',
                      xesc + (p.regen ? rw / 2 : 0), Y(0.97) + 2);
        });

        /* tubos */
        if (p.regen) {
          tubos.push({ pts: [[cx + cw, cy + ch / 2], [rx + rw / 2, cy + ch / 2],
                             [rx + rw / 2, ry]], cor: cf(e[2].T), vel: 1.0 });
          tubos.push({ pts: [[rx + rw, ry + rh / 2], [bx + bw / 2, ry + rh / 2],
                             [bx + bw / 2, by + bh]], cor: cf(r.T2r), vel: 1.0 });
          tubos.push({ pts: [[bx + bw, by + bh / 2], [tx, by + bh / 2], [tx, ty + th2 * 0.4]],
                       cor: cf(e[3].T), vel: 1.3 });
          tubos.push({ pts: [[tx + tw, ty + th2 * 0.8], [X(0.82), ty + th2 * 0.8],
                             [X(0.82), ry + rh / 2], [rx + rw, ry + rh / 2]],
                       cor: cf(e[4].T), vel: 1.2 });
          tubos.push({ pts: [[rx + rw / 2, ry + rh], [rx + rw / 2, Y(0.88)]],
                       cor: cf(r.T4r), vel: 0.9 });
          estados = [
            { n: '1', x: cx - 10, y: cy + ch / 2, cor: cf(e[1].T), info: '', lado: 'esq' },
            { n: '2', x: rx + rw / 2, y: cy + ch / 2, cor: cf(e[2].T),
              info: Plot.sig(e[2].T - 273.15, 4) + ' °C', lado: 'esq' },
            { n: '3', x: bx + bw / 2 + 22, y: ry + rh / 2, cor: cf(r.T2r),
              info: 'preaquecido a ' + Plot.sig(r.T2r - 273.15, 4) + ' °C', lado: 'dir' },
            { n: '4', x: tx - 12, y: by + bh / 2, cor: cf(e[3].T),
              info: Plot.sig(e[3].T - 273.15, 4) + ' °C', lado: 'esq' },
            { n: '5', x: X(0.82), y: ty + th2 * 0.8, cor: cf(e[4].T),
              info: Plot.sig(e[4].T - 273.15, 4) + ' °C', lado: 'dir' }
          ];
        } else {
          tubos.push({ pts: [[cx + cw, cy + ch / 2], [bx + bw / 2, cy + ch / 2],
                             [bx + bw / 2, by + bh]], cor: cf(e[2].T), vel: 1.0 });
          tubos.push({ pts: [[bx + bw, by + bh / 2], [tx, by + bh / 2], [tx, ty + th2 * 0.4]],
                       cor: cf(e[3].T), vel: 1.3 });
          tubos.push({ pts: [[tx + tw, ty + th2 * 0.8], [X(0.80), ty + th2 * 0.8],
                             [X(0.80), Y(0.88)]], cor: cf(e[4].T), vel: 1.2 });
          estados = [
            { n: '1', x: cx - 10, y: cy + ch / 2, cor: cf(e[1].T), info: '', lado: 'esq' },
            { n: '2', x: bx + bw / 2, y: cy + ch / 2, cor: cf(e[2].T),
              info: Plot.sig(e[2].T - 273.15, 4) + ' °C', lado: 'esq' },
            { n: '3', x: tx - 12, y: by + bh / 2, cor: cf(e[3].T),
              info: Plot.sig(e[3].T - 273.15, 4) + ' °C', lado: 'esq' },
            { n: '4', x: X(0.80), y: ty + th2 * 0.8, cor: cf(e[4].T),
              info: Plot.sig(e[4].T - 273.15, 4) + ' °C', lado: 'dir' }
          ];
        }

        desenharPlanta(c, pl, {
          tubos: tubos, desenhos: desenhos, estados: estados,
          titulo: 'Ciclo Brayton — turbina a gás' + (p.regen ? ' com regenerador' : ' simples'),
          subtitulo: 'η = ' + Plot.sig(r.eta * 100, 4) + ' %   ·   ciclo ABERTO na prática: o ar entra ' +
            'da atmosfera e sai pelo escape   ·   a cor das partículas é a temperatura do gás'
        }, fase);
      };
    }

    Sim.build('#sim-brayton', {
      titulo: 'Ciclo Brayton — a turbina a gás',
      descricao: 'Compressor e turbina no mesmo eixo: boa parte do que a turbina produz é consumida ali mesmo para comprimir o ar. É esse detalhe — o BWR — que separa o Brayton do Rankine.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Brayton ideal', desc: 'Sem irreversibilidade: só a razão de pressão decide',
          valores: { rp: 10, T1: 25, T3: 1000, P1: 100, k: 1.4, etaC: 100, etaT: 100, regen: false, eficReg: 80, animar: true, vel: 1 } },
        { nome: '2 · Turbina a gás real', desc: 'Compressor 82 % e turbina 87 %: o rendimento despenca',
          valores: { rp: 10, T1: 25, T3: 1000, P1: 100, k: 1.4, etaC: 82, etaT: 87, regen: false, eficReg: 80, animar: true, vel: 1 } },
        { nome: '3 · Com regenerador', desc: 'O escape preaquece o ar e recupera vários pontos',
          valores: { rp: 10, T1: 25, T3: 1000, P1: 100, k: 1.4, etaC: 82, etaT: 87, regen: true, eficReg: 80, animar: true, vel: 1 } },
        { nome: '4 · Razão de pressão alta demais', desc: 'Com rp = 25 o regenerador deixa de servir',
          valores: { rp: 25, T1: 25, T3: 1000, P1: 100, k: 1.4, etaC: 82, etaT: 87, regen: true, eficReg: 80, animar: true, vel: 1 } },
        { nome: '5 · Turbina moderna, 1400 °C', desc: 'Pás refrigeradas permitem T3 muito maior',
          valores: { rp: 18, T1: 15, T3: 1400, P1: 100, k: 1.4, etaC: 88, etaT: 90, regen: false, eficReg: 80, animar: true, vel: 1 } },
        { nome: '6 · Compressor ruim', desc: 'Com η_C = 70 % o ciclo quase não entrega trabalho',
          valores: { rp: 10, T1: 25, T3: 1000, P1: 100, k: 1.4, etaC: 70, etaT: 80, regen: false, eficReg: 80, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'rp', label: 'Razão de pressão r_p', min: 2, max: 40, step: 0.5, valor: 10, unidade: '×',
          desc: 'É o parâmetro que governa o rendimento do Brayton ideal.' },
        { id: 'T1', label: 'Temperatura de admissão', min: -20, max: 50, step: 5, valor: 25, unidade: '°C' },
        { id: 'T3', label: 'Temperatura de entrada na turbina', min: 600, max: 1600, step: 25,
          valor: 1000, unidade: '°C', desc: 'Limitada pelo material das pás: 900 °C sem refrigeração, até 1600 °C com pás refrigeradas e revestimento cerâmico.' },
        { id: 'P1', label: 'Pressão de admissão', min: 60, max: 200, step: 5, valor: 100, unidade: 'kPa' },
        { id: 'k', label: 'Razão de calores específicos k', min: 1.3, max: 1.4, step: 0.01, valor: 1.4, unidade: '' },
        { tipo: 'separador' },
        { id: 'etaC', label: 'Rendimento isentrópico do compressor', min: 60, max: 100, step: 1, valor: 100, unidade: '%' },
        { id: 'etaT', label: 'Rendimento isentrópico da turbina', min: 60, max: 100, step: 1, valor: 100, unidade: '%' },
        { tipo: 'separador' },
        { id: 'regen', tipo: 'check', label: 'Usar regenerador', valor: false,
          desc: 'Só funciona se o escape estiver MAIS QUENTE que a saída do compressor.' },
        { id: 'eficReg', label: 'Efetividade do regenerador', min: 40, max: 95, step: 5, valor: 80, unidade: '%' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar a instalação', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.2, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'planta', axes: false, height: 420, grid: false, legend: false },
        { id: 'ts', titulo: 'Diagrama T-s', xlabel: 'Entropia relativa Δs (kJ/kg·K)',
          ylabel: 'Temperatura (°C)', aspect: 0.44, legendPos: 'topleft' },
        { id: 'curva', titulo: 'Rendimento e trabalho líquido em função da razão de pressão',
          xlabel: 'Razão de pressão r_p', ylabel: 'Rendimento  |  w_líq / 1000', aspect: 0.34,
          legendPos: 'topright' }
      ],
      saidas: [
        { id: 'eta', label: 'Rendimento térmico' },
        { id: 'T2', label: 'T saída do compressor' },
        { id: 'T4', label: 'T saída da turbina' },
        { id: 'wT', label: 'Trabalho da turbina' },
        { id: 'wC', label: 'Trabalho do compressor' },
        { id: 'wliq', label: 'Trabalho líquido' },
        { id: 'bwr', label: 'BWR (fração ao compressor)' },
        { id: 'rpOt', label: 'r_p de máximo trabalho' }
      ],
      formulas: [
        { g: 'Os quatro processos' },
        { tex: '1 \\to 2:\\ \\text{compressor, isentrópico}', d: 's constante · T e P sobem · CONSOME trabalho', destaque: true },
        { tex: '2 \\to 3:\\ \\text{combustor, isobárico}', d: 'P constante · T sobe muito · entra calor', destaque: true },
        { tex: '3 \\to 4:\\ \\text{turbina, isentrópico}', d: 's constante · T e P caem · PRODUZ trabalho', destaque: true },
        { tex: '4 \\to 1:\\ \\text{rejeição isobárica}', d: 'na turbina aberta é simplesmente o escape para a atmosfera' },

        { g: 'Rendimento' },
        { tex: '\\eta_{\\text{Brayton}} = 1 - \\frac{1}{r_p^{\\,(k-1)/k}}',
          d: 'no ciclo IDEAL depende só da razão de pressão — nem da temperatura máxima', destaque: true },
        { tex: '\\frac{T_2}{T_1} = \\frac{T_3}{T_4} = r_p^{\\,(k-1)/k}',
          d: 'as duas razões de temperatura são iguais no ciclo ideal' },

        { g: 'Back Work Ratio — o problema do Brayton' },
        { tex: 'BWR = \\frac{w_{\\text{compressor}}}{w_{\\text{turbina}}}',
          d: 'no Brayton fica entre 40 e 60 %; no Rankine, em torno de 1 %', destaque: true },
        { tex: 'w_{\\text{líq}} = c_p(T_3 - T_4) - c_p(T_2 - T_1)',
          d: 'a diferença entre dois números grandes — daí a sensibilidade aos rendimentos' },
        { tex: '\\eta_C \\downarrow 10\\% \\Rightarrow \\eta_{\\text{ciclo}} \\downarrow \\text{muito mais}',
          d: 'comprimir gás custa caro: o gás é compressível e aquece' },

        { g: 'Razão de pressão ótima' },
        { tex: 'r_{p,\\text{ótimo}} = \\left(\\frac{T_3}{T_1}\\right)^{\\frac{k}{2(k-1)}}',
          d: 'maximiza o TRABALHO LÍQUIDO — não o rendimento, que cresce sempre', destaque: true },
        { tex: '\\eta \\nearrow \\text{ com } r_p \\qquad w_{\\text{líq}} \\text{ tem máximo}',
          d: 'projeto real fica entre os dois: mais trabalho por kg significa máquina menor' },

        { g: 'Regeneração' },
        { tex: '\\varepsilon = \\frac{T_5 - T_2}{T_4 - T_2}',
          d: 'efetividade: quanto do calor disponível no escape foi de fato recuperado', destaque: true },
        { tex: 'T_4 > T_2 \\;\\Rightarrow\\; \\text{regenerador funciona}',
          d: 'com razão de pressão alta o escape esfria e o regenerador deixa de servir — ou até atrapalha', destaque: true },
        { tex: '\\eta_{\\text{regen}} = 1 - \\frac{T_1}{T_3}r_p^{\\,(k-1)/k}',
          d: 'com regeneração ideal; aqui o rendimento CAI com r_p, ao contrário do ciclo simples' },

        { g: 'Melhorias adicionais' },
        { tex: '\\text{Inter-resfriamento}', d: 'divide a compressão e resfria no meio: reduz o trabalho do compressor' },
        { tex: '\\text{Reaquecimento}', d: 'divide a expansão e reaquece: aumenta o trabalho da turbina' },
        { tex: '\\text{Ciclo combinado}', d: 'o escape do Brayton vira a caldeira de um Rankine: leva o conjunto a mais de 60 %' }
      ],
      passos: [],
      passosTitulo: 'O que acontece em cada componente',
      passosAbertos: true,
      nota: 'Padrão a ar frio: ar como gás ideal com cp = 1,005 kJ/kg·K constante. A turbina real trabalha com produtos de combustão e cp variável, mas as tendências — especialmente a importância do BWR e o efeito dos rendimentos isentrópicos — são exatamente estas.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        var e = r.e;
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        desenhaPlanta();

        var cp = r.cp, R = 0.287;
        function ds(T, P) { return cp * Math.log(T / e[1].T) - R * Math.log(P / e[1].P); }

        /* ---------- T-s ---------- */
        var ss = [], TT = [], i;
        function isobar(P, Ta, Tb, n) {
          for (i = 0; i <= n; i++) {
            var T = Ta + (Tb - Ta) * i / n;
            ss.push(ds(T, P)); TT.push(T - 273.15);
          }
        }
        ss.push(ds(e[1].T, e[1].P)); TT.push(e[1].T - 273.15);
        ss.push(ds(e[2].T, e[2].P)); TT.push(e[2].T - 273.15);
        isobar(e[2].P, e[2].T, e[3].T, 26);
        ss.push(ds(e[4].T, e[4].P)); TT.push(e[4].T - 273.15);
        isobar(e[1].P, e[4].T, e[1].T, 26);

        var gt = ctx.plot('ts').clear();
        gt.line(ss, TT, { color: Plot.serie(5), width: 2.8, label: 'ciclo' });
        if (p.regen) {
          gt.line([ds(e[2].T, e[2].P), ds(r.T2r, e[2].P)],
                  [e[2].T - 273.15, r.T2r - 273.15],
                  { color: Plot.serie(4), width: 3.4, label: 'calor recuperado no regenerador' });
          gt.line([ds(e[4].T, e[1].P), ds(r.T4r, e[1].P)],
                  [e[4].T - 273.15, r.T4r - 273.15],
                  { color: Plot.serie(4), width: 3.4, dash: [5, 4] });
        }
        [1, 2, 3, 4].forEach(function (n) {
          gt.marker(ds(e[n].T, e[n].P), e[n].T - 273.15, String(n), { color: Plot.serie(6), r: 4.5 });
        });
        gt.draw();
        A.ts = { s: ss, T: TT };

        /* ---------- rendimento x razão de pressão ---------- */
        var rps = Plot.linspace(2, 40, 90);
        var gc = ctx.plot('curva').clear();
        var expo = (p.k - 1) / p.k;
        gc.line(rps, rps.map(function (x) { return 1 - Math.pow(x, -expo); }),
          { color: Plot.serie(0), width: 2.6, label: 'η ideal' });
        gc.line(rps, rps.map(function (x) {
          var T2s = e[1].T * Math.pow(x, expo);
          var T2 = e[1].T + (T2s - e[1].T) / (p.etaC / 100);
          var T4s = e[3].T * Math.pow(1 / x, expo);
          var T4 = e[3].T - (e[3].T - T4s) * (p.etaT / 100);
          var w = cp * (e[3].T - T4) - cp * (T2 - e[1].T);
          var q = cp * (e[3].T - T2);
          return w > 0 ? w / q : NaN;
        }), { color: Plot.serie(5), width: 2.6, label: 'η real (com os rendimentos atuais)' });
        gc.line(rps, rps.map(function (x) {
          var T2s = e[1].T * Math.pow(x, expo);
          var T2 = e[1].T + (T2s - e[1].T) / (p.etaC / 100);
          var T4s = e[3].T * Math.pow(1 / x, expo);
          var T4 = e[3].T - (e[3].T - T4s) * (p.etaT / 100);
          return (cp * (e[3].T - T4) - cp * (T2 - e[1].T)) / 1000;
        }), { color: Plot.serie(3), width: 2.2, dash: [5, 4], label: 'w_líq / 1000 (kJ/kg)' });
        gc.vline(r.rpOtimo, { color: Plot.serie(3), dash: [4, 3], width: 1.4,
          text: 'r_p de máximo trabalho = ' + Plot.sig(r.rpOtimo, 3) });
        gc.marker(p.rp, r.eta, 'atual: η = ' + Plot.sig(r.eta * 100, 4) + ' %', { color: Plot.serie(6) });
        gc.draw();

        /* ---------- passo a passo ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        var passos = [
          { t: '① Compressor — comprime o ar (1 → 2)',
            tex: 'T_{2s} = T_1 r_p^{(k-1)/k} \\qquad w_C = c_p(T_2 - T_1)',
            texSub: 'T_{2s} = ' + nt(e[1].T) + ' \\cdot ' + p.rp + '^{' + nt(expo) + '} = ' +
              nt(e[2].Ts) + '\\ \\mathrm{K} \\;\\Rightarrow\\; T_2 = ' + nt(e[2].T) + '\\ \\mathrm{K}' +
              ' \\;\\Rightarrow\\; w_C = ' + nt(r.wC) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: pressão, temperatura e volume específico. NÃO MUDA: a entropia, ' +
              (p.etaC >= 100 ? 'porque a compressão é isentrópica.'
                : 'só no caso ideal — com η_C = ' + p.etaC + ' % a entropia AUMENTA e o ar sai ' +
                  sg(e[2].T - e[2].Ts, 3) + ' K mais quente do que sairia no caso ideal.') +
              ' Esta é a etapa que consome ' + sg(r.bwr * 100, 3) + ' % do que a turbina produz.' },
          { t: '② Combustor — queima a pressão constante (' + (p.regen ? '5' : '2') + ' → 3)',
            tex: 'q_{\\text{ent}} = c_p(T_3 - T_2)',
            texSub: 'q_{\\text{ent}} = 1{,}005(' + nt(e[3].T) + ' - ' + nt(r.T2r) + ') = ' +
              nt(r.qin) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: temperatura, volume e entropia. NÃO MUDA: a pressão — na turbina a gás o ' +
              'combustor é um duto aberto nas duas pontas, e a pressão é imposta pelo compressor. ' +
              (p.regen ? 'Com o regenerador, o ar já chega a ' + sg(r.T2r - 273.15, 4) +
                ' °C, e por isso o combustor precisa fornecer menos calor.'
                : 'A temperatura T₃ é o limite de projeto: acima dela as pás não resistem.') },
          { t: '③ Turbina — expande e produz trabalho (3 → 4)',
            tex: 'T_{4s} = T_3 r_p^{-(k-1)/k} \\qquad w_T = c_p(T_3 - T_4)',
            texSub: 'T_{4s} = ' + nt(e[3].T) + ' \\cdot ' + p.rp + '^{-' + nt(expo) + '} = ' +
              nt(e[4].Ts) + '\\ \\mathrm{K} \\;\\Rightarrow\\; T_4 = ' + nt(e[4].T) +
              '\\ \\mathrm{K} \\;\\Rightarrow\\; w_T = ' + nt(r.wT) + '\\ \\mathrm{kJ/kg}',
            obs: 'MUDA: pressão, temperatura e volume. NÃO MUDA: a entropia no caso ideal. ' +
              'Repare que a turbina produz ' + sg(r.wT, 4) + ' kJ/kg mas o líquido é só ' +
              sg(r.wliq, 4) + ' — a diferença vai inteira para mover o compressor no mesmo eixo.' },
          { t: '④ Trabalho líquido e rendimento',
            tex: 'w_{\\text{líq}} = w_T - w_C \\qquad \\eta = \\frac{w_{\\text{líq}}}{q_{\\text{ent}}}',
            texSub: 'w_{\\text{líq}} = ' + nt(r.wT) + ' - ' + nt(r.wC) + ' = ' + nt(r.wliq) +
              ' \\;\\Rightarrow\\; \\eta = \\frac{' + nt(r.wliq) + '}{' + nt(r.qin) + '} = ' +
              nt(r.eta * 100) + '\\%',
            obs: 'O ciclo ideal com esta razão de pressão daria ' +
              sg((1 - Math.pow(p.rp, -expo)) * 100, 4) + ' %. A diferença vem inteira dos ' +
              'rendimentos isentrópicos: como w_líq é a diferença de dois números grandes, ' +
              'qualquer perda em um deles corta muito do resultado.' },
          { t: '⑤ Back Work Ratio — o que separa o Brayton do Rankine',
            tex: 'BWR = \\frac{w_C}{w_T}',
            texSub: 'BWR = \\frac{' + nt(r.wC) + '}{' + nt(r.wT) + '} = ' + nt(r.bwr * 100) + '\\%',
            obs: 'No Rankine a bomba consome cerca de 1 % do trabalho da turbina, porque comprime ' +
              'LÍQUIDO, que é praticamente incompressível. Aqui o compressor engole ' +
              sg(r.bwr * 100, 3) + ' %, porque comprime GÁS — que muda muito de volume e aquece ' +
              'no processo. É por isso que a turbina a gás só passou a ser viável quando os ' +
              'compressores atingiram rendimentos acima de 80 %.' }
        ];
        if (p.regen) {
          passos.splice(1, 0, { t: '①b Regenerador — o escape preaquece o ar (2 → 5)',
            tex: '\\varepsilon = \\frac{T_5 - T_2}{T_4 - T_2}',
            texSub: 'T_5 = ' + nt(e[2].T) + ' + ' + nt(r.eps) + '(' + nt(e[4].T) + ' - ' +
              nt(e[2].T) + ') = ' + nt(r.T2r) + '\\ \\mathrm{K}',
            obs: e[4].T > e[2].T + 5
              ? 'O escape sai a ' + sg(e[4].T - 273.15, 4) + ' °C e o ar do compressor está a ' +
                sg(e[2].T - 273.15, 4) + ' °C: há diferença de temperatura, então o regenerador ' +
                'funciona e recupera ' + sg(r.qReg, 4) + ' kJ/kg que iriam pela chaminé.'
              : 'ATENÇÃO: com esta razão de pressão o escape (' + sg(e[4].T - 273.15, 4) +
                ' °C) já está MAIS FRIO que a saída do compressor (' + sg(e[2].T - 273.15, 4) +
                ' °C). O regenerador não tem o que recuperar — instalá-lo aqui só acrescenta ' +
                'perda de carga. Regeneração pede razão de pressão BAIXA.' });
        }
        ctx.setPassos(passos);

        return {
          eta: { v: r.eta * 100, u: '%', classe: 'destaque' },
          T2: { v: e[2].T - 273.15, u: '°C' },
          T4: { v: e[4].T - 273.15, u: '°C' },
          wT: { v: r.wT, u: 'kJ/kg' },
          wC: { v: r.wC, u: 'kJ/kg' },
          wliq: { v: r.wliq, u: 'kJ/kg' },
          bwr: { v: r.bwr * 100, u: '%', classe: r.bwr > 0.6 ? 'alerta' : '' },
          rpOt: { v: r.rpOtimo, u: '×' }
        };
      }
    });

    function desenhaPlanta() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('planta');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(montarPlanta(A.p, A.r, A.fase));
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.r) return;
      var dt = A.rel.dt();
      A.fase = (A.fase + dt * 0.26 * A.vel) % 1;
      desenhaPlanta();
      var g = A.ctx.plot('ts');
      if (g && A.ts) {
        g.draw();
        var n = A.ts.s.length;
        var idx = Math.min(n - 1, Math.floor(A.fase * (n - 1)));
        var c2 = g.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath(); c2.arc(g.px(A.ts.s[idx]), g.py(A.ts.T[idx]), 6, 0, TAU); c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 2; c2.stroke();
        c2.restore();
      }
    });
  })();

})();

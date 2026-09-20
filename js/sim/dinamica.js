/* ==========================================================================
   Dinâmica — modelos (sem DOM, validados em node)
   --------------------------------------------------------------------------
     · Partícula: plano inclinado com atrito, d'Alembert, trabalho e energia
     · Impacto direto central: coeficiente de restituição e perda de energia
     · Rolamento sem deslizamento de corpos em plano inclinado
     · Corpo rígido: momento de inércia, pêndulo composto, centro de percussão
     · Dinâmica longitudinal do veículo: transferência de carga e limites
   ========================================================================== */
(function (global) {
  'use strict';
  var DIN = {};
  var g = 9.81;
  DIN.g = g;

  /* ---------------- partícula em plano inclinado ---------------- */
  DIN.bloco = function (p) {
    var th = p.theta * Math.PI / 180;
    var N = p.m * g * Math.cos(th);
    var Fmotriz = p.F * Math.cos((p.angF || 0) * Math.PI / 180);
    var Fperp = p.F * Math.sin((p.angF || 0) * Math.PI / 180);
    N = p.m * g * Math.cos(th) - Fperp;
    var pesoX = p.m * g * Math.sin(th);
    var liquida = Fmotriz - pesoX;                    /* positiva: sobe o plano */
    var atritoMax = p.mue * N;
    var moveSe = Math.abs(liquida) > atritoMax;
    var a = 0, atrito = 0, estado;
    if (!moveSe && Math.abs(p.v0) < 1e-9) {
      atrito = -liquida; estado = 'em repouso (atrito estático segura)';
    } else {
      var sentido = Math.abs(p.v0) > 1e-9 ? Math.sign(p.v0) : Math.sign(liquida);
      atrito = -sentido * p.muc * N;
      a = (liquida + atrito) / p.m;
      estado = 'em movimento';
    }
    /* cinemática com aceleração constante */
    var v = p.v0 + a * p.t, x = p.v0 * p.t + 0.5 * a * p.t * p.t;
    var tPara = a !== 0 ? -p.v0 / a : Infinity;
    var dPara = (tPara > 0 && isFinite(tPara)) ? p.v0 * tPara + 0.5 * a * tPara * tPara : null;
    /* energia ao longo do deslocamento x */
    var Wpeso = -p.m * g * Math.sin(th) * x;
    var Watrito = atrito * x;
    var WF = Fmotriz * x;
    return { th: th, N: N, pesoX: pesoX, atritoMax: atritoMax, atrito: atrito, a: a, v: v, x: x,
             estado: estado, moveSe: moveSe, tPara: tPara, dPara: dPara,
             Wpeso: Wpeso, Watrito: Watrito, WF: WF,
             dEc: 0.5 * p.m * (v * v - p.v0 * p.v0), pot: Fmotriz * v,
             thLim: Math.atan(p.mue) * 180 / Math.PI };
  };

  /* ---------------- impacto direto central ---------------- */
  DIN.impacto = function (p) {
    var m1 = p.m1, m2 = p.m2, v1 = p.v1, v2 = p.v2, e = p.e;
    var vG = (m1 * v1 + m2 * v2) / (m1 + m2);         /* velocidade do centro de massa */
    var v1f = vG + e * m2 / (m1 + m2) * (v2 - v1);
    var v2f = vG + e * m1 / (m1 + m2) * (v1 - v2);
    var Ei = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    var Ef = 0.5 * m1 * v1f * v1f + 0.5 * m2 * v2f * v2f;
    var mred = m1 * m2 / (m1 + m2);
    var perda = 0.5 * mred * (1 - e * e) * Math.pow(v1 - v2, 2);
    var J = m1 * (v1f - v1);                           /* impulso sobre o corpo 1 */
    return { vG: vG, v1f: v1f, v2f: v2f, Ei: Ei, Ef: Ef, perda: perda, perc: Ei > 0 ? 100 * perda / Ei : 0,
             J: J, mred: mred, tipo: e >= 0.999 ? 'perfeitamente elástico' : e <= 0.001 ? 'perfeitamente plástico' : 'parcialmente elástico',
             pIni: m1 * v1 + m2 * v2, pFim: m1 * v1f + m2 * v2f };
  };

  /* ---------------- rolamento em plano inclinado ---------------- */
  DIN.CORPOS = {
    esfera:    { nome: 'Esfera maciça', k: 2 / 5 },
    esfOca:    { nome: 'Casca esférica', k: 2 / 3 },
    cilindro:  { nome: 'Cilindro maciço (disco)', k: 1 / 2 },
    tubo:      { nome: 'Tubo de parede fina (aro)', k: 1 },
    semRolar:  { nome: 'Bloco deslizando (sem rolar)', k: 0 }
  };
  DIN.rolamento = function (p) {
    var th = p.theta * Math.PI / 180, k = DIN.CORPOS[p.corpo].k;
    var a = g * Math.sin(th) / (1 + k);
    var atrito = k / (1 + k) * p.m * g * Math.sin(th);
    var muNec = k * Math.tan(th) / (1 + k);
    var rola = p.mu >= muNec && p.corpo !== 'semRolar';
    if (p.corpo === 'semRolar' || !rola) {             /* escorrega: atrito cinético */
      a = g * (Math.sin(th) - p.mu * Math.cos(th));
      atrito = p.mu * p.m * g * Math.cos(th);
    }
    var L = p.L;
    var t = Math.sqrt(2 * L / a), v = Math.sqrt(2 * a * L);
    var h = L * Math.sin(th);
    var Ec = 0.5 * p.m * v * v, Erot = 0.5 * k * p.m * v * v;
    return { k: k, a: a, atrito: atrito, muNec: muNec, rola: rola, t: t, v: v, h: h,
             omega: v / p.r, Ec: Ec, Erot: rola ? Erot : 0, Epot: p.m * g * h,
             fracRot: rola ? k / (1 + k) : 0, I: k * p.m * p.r * p.r };
  };

  /* ---------------- corpo rígido: pêndulo composto ---------------- */
  DIN.FORMAS = {
    barra:  { nome: 'Barra delgada (pivô na ponta)', I: function (m, L) { return m * L * L / 3; }, d: function (L) { return L / 2; } },
    barraC: { nome: 'Barra delgada (pivô a 1/4 do topo)', I: function (m, L) { return m * L * L / 12 + m * Math.pow(L / 4, 2); }, d: function (L) { return L / 4; } },
    disco:  { nome: 'Disco (pivô na borda)', I: function (m, L) { return 1.5 * m * Math.pow(L / 2, 2); }, d: function (L) { return L / 2; } },
    aro:    { nome: 'Aro (pivô na borda)', I: function (m, L) { return 2 * m * Math.pow(L / 2, 2); }, d: function (L) { return L / 2; } },
    esfera: { nome: 'Esfera (pivô na superfície)', I: function (m, L) { return 7 / 5 * m * Math.pow(L / 2, 2); }, d: function (L) { return L / 2; } }
  };
  DIN.pendulo = function (p) {
    var f = DIN.FORMAS[p.forma];
    var Io = f.I(p.m, p.L), d = f.d(p.L);
    var wn = Math.sqrt(p.m * g * d / Io);
    var T = 2 * Math.PI / wn;
    var Lequiv = Io / (p.m * d);                       /* comprimento do pêndulo simples equivalente */
    var q = Lequiv;                                    /* centro de percussão, medido do pivô */
    var th0 = p.theta0 * Math.PI / 180;
    /* solução exata do período por integral elíptica (série) */
    var corr = 1 + Math.pow(th0, 2) / 16 + 11 * Math.pow(th0, 4) / 3072;
    var alfaMax = p.m * g * d * Math.sin(th0) / Io;
    var wMax = wn * th0;                                /* pequenas oscilações */
    var Rx = 0, Ry = 0;
    /* reações no pivô no ponto mais baixo (θ = 0), com a solução de pequenas oscilações */
    var an = wMax * wMax * d;                           /* aceleração normal do centro de massa */
    Ry = p.m * g + p.m * an;
    return { Io: Io, d: d, wn: wn, T: T, Texato: T * corr, Lequiv: Lequiv, q: q,
             alfaMax: alfaMax, wMax: wMax, Rbaixo: Ry, Rx: Rx, Icm: Io - p.m * d * d,
             f: wn / (2 * Math.PI), energia: p.m * g * d * (1 - Math.cos(th0)) };
  };

  /* ---------------- dinâmica longitudinal do veículo ---------------- */
  DIN.veiculo = function (p) {
    var m = p.m, L = p.L, b = p.b, h = p.h, mu = p.mu;
    /* b: distância do eixo dianteiro ao centro de massa */
    var a = p.a;                                       /* aceleração longitudinal (positiva acelerando) */
    var Nf = m * g * (L - b) / L - m * a * h / L;
    var Nr = m * g * b / L + m * a * h / L;
    /* acelerações máximas conforme a tração */
    var aTras = mu * g * (b / L) / (1 - mu * h / L);
    var aDiant = mu * g * ((L - b) / L) / (1 + mu * h / L);
    var aInteg = mu * g;
    var aFrenagem = -mu * g;
    var aTomba = g * (L - b) / h;                       /* empinar (aceleração) */
    var aTombaFrente = -g * b / h;                      /* capotar para a frente na frenagem */
    return { Nf: Nf, Nr: Nr, Ntot: Nf + Nr, aTras: aTras, aDiant: aDiant, aInteg: aInteg,
             aFrenagem: aFrenagem, aTomba: aTomba, aTombaFrente: aTombaFrente,
             transfer: m * a * h / L, levantou: Nf <= 0 || Nr <= 0,
             distFrenagem: p.v0 * p.v0 / (2 * mu * g), tempoFrenagem: p.v0 / (mu * g),
             pot: m * a * p.v0 };
  };

  global.DIN = DIN;
})(typeof window !== 'undefined' ? window : global);

/* ==========================================================================
   Simuladores de Dinâmica
     1. sim-bloco     : partícula em plano inclinado com atrito (DCL e energia)
     2. sim-impacto   : impacto direto central e coeficiente de restituição
     3. sim-rolamento : corrida de corpos que rolam num plano inclinado
     4. sim-pendulo   : pêndulo composto, momento de inércia e percussão
     5. sim-veiculo   : transferência de carga e limites de aceleração
   ========================================================================== */
(function () {
  'use strict';
  var DIN = window.DIN;
  var TAU = Math.PI * 2, G = DIN.g;

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
     1. Partícula em plano inclinado
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-bloco')) return;
    var A = { ctx: null, p: null, r: null, s: 0, v: 0, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var th = r.th;
      var Lp = Math.min(a.w * 0.5, (a.h - 90) / Math.max(Math.sin(th), 0.15));
      var x0 = a.x + 40, y0 = a.y + a.h - 50;                    /* base do plano */
      var x1 = x0 + Lp * Math.cos(th), y1 = y0 - Lp * Math.sin(th);
      /* plano */
      c.fillStyle = faint; c.globalAlpha = 0.25;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y0); c.closePath(); c.fill();
      c.globalAlpha = 1; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.stroke();
      rotulo(c, p.theta + '°', x0 + 34, y0 - 10, cor, 12, '700');
      /* bloco na posição atual */
      var frac = Math.max(0, Math.min(1, 0.5 + A.s / (Lp / 60)));
      var bx = x0 + (x1 - x0) * frac, by = y0 + (y1 - y0) * frac;
      var lado = 34;
      c.save();
      c.translate(bx, by); c.rotate(-th);
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.6;
      c.fillRect(-lado / 2, -lado, lado, lado); c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 1.6; c.strokeRect(-lado / 2, -lado, lado, lado);
      rotulo(c, sg(p.m, 3) + ' kg', 0, -lado / 2, cor, 10.5, '700');
      c.restore();
      /* forças: peso, normal, atrito, aplicada */
      var cxB = bx + lado / 2 * Math.sin(th), cyB = by - lado / 2 * Math.cos(th);
      var esc = 60 / Math.max(p.m * G, 1);
      seta(c, cxB, cyB, cxB, cyB + p.m * G * esc, 'rgb(220,60,60)', 2.6, 10);
      rotulo(c, 'P = ' + sg(p.m * G, 3) + ' N', cxB + 8, cyB + p.m * G * esc + 10, 'rgb(220,60,60)', 10.5, '700', 'left');
      seta(c, cxB, cyB, cxB + r.N * esc * Math.sin(th), cyB - r.N * esc * Math.cos(th), Plot.serie(2), 2.6, 10);
      rotulo(c, 'N = ' + sg(r.N, 3) + ' N', cxB + r.N * esc * Math.sin(th) + 8, cyB - r.N * esc * Math.cos(th) - 8, Plot.serie(2), 10.5, '700', 'left');
      var fa = r.atrito * esc;
      seta(c, cxB, cyB, cxB + fa * Math.cos(th), cyB - fa * Math.sin(th), 'rgb(230,150,50)', 2.6, 10);
      rotulo(c, 'fat = ' + sg(Math.abs(r.atrito), 3) + ' N', cxB + fa * Math.cos(th) * 1.15, cyB - fa * Math.sin(th) - 14, 'rgb(230,150,50)', 10.5, '700');
      if (p.F > 0) {
        var ang = th + p.angF * Math.PI / 180;
        seta(c, cxB, cyB, cxB + p.F * esc * Math.cos(ang), cyB - p.F * esc * Math.sin(ang), Plot.serie(3), 2.8, 11);
        rotulo(c, 'F = ' + sg(p.F, 3) + ' N', cxB + p.F * esc * Math.cos(ang), cyB - p.F * esc * Math.sin(ang) - 14, Plot.serie(3), 11, '700');
      }
      /* painel */
      var lx = a.x + a.w * 0.62, ly = a.y + 26;
      var linhas = [
        ['componente do peso no plano', sg(r.pesoX, 4) + ' N'],
        ['atrito máximo estático  μe·N', sg(r.atritoMax, 4) + ' N'],
        ['estado', r.estado],
        ['aceleração', sg(r.a, 3) + ' m/s²'],
        ['ângulo limite de escorregamento', sg(r.thLim, 3) + '°'],
        ['velocidade em t = ' + sg(p.t, 3) + ' s', sg(r.v, 3) + ' m/s']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, j === 2 ? (r.moveSe ? 'rgb(220,110,40)' : 'rgb(60,170,110)') : cor, 12, '700', 'left');
      });
      rotulo(c, "d'Alembert: some −m·a ao DCL e o problema vira estático", lx, ly + 6 * 34 + 6, faint, 10, '400', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('plano');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx || !A.r) return;
      var r = A.r;
      A.v += r.a * dt; A.s += A.v * dt;
      if (A.s < -30 || A.s > 30 || (!r.moveSe && Math.abs(A.p.v0) < 1e-9)) { A.s = A.p.v0 !== 0 ? 0 : 0; A.v = A.p.v0; }
      desenha();
    });

    Sim.build('#sim-bloco', {
      titulo: 'Partícula em plano inclinado — atrito, DCL e energia',
      descricao: 'O bloco só desliza quando a componente do peso ao longo do plano vence o atrito estático máximo. O diagrama de corpo livre resolve tudo: a normal sai do equilíbrio perpendicular ao plano, e a segunda lei na direção do movimento dá a aceleração. O princípio de d\u2019Alembert transforma esse problema dinâmico num problema de equilíbrio.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Na iminência do movimento', desc: 'θ igual ao ângulo de atrito', valores: { m: 10, theta: 22, mue: 0.4, muc: 0.3, F: 0, angF: 0, v0: 0, t: 2 } },
        { nome: '2 · Descendo o plano', desc: '30°: o peso vence o atrito', valores: { m: 10, theta: 30, mue: 0.4, muc: 0.3, F: 0, angF: 0, v0: 0, t: 2 } },
        { nome: '3 · Em repouso', desc: '10°: o atrito estático segura', valores: { m: 10, theta: 10, mue: 0.4, muc: 0.3, F: 0, angF: 0, v0: 0, t: 2 } },
        { nome: '4 · Empurrado para cima', desc: 'força paralela ao plano', valores: { m: 10, theta: 20, mue: 0.4, muc: 0.3, F: 80, angF: 0, v0: 0, t: 2 } },
        { nome: '5 · Força inclinada', desc: 'a componente perpendicular alivia a normal', valores: { m: 10, theta: 20, mue: 0.4, muc: 0.3, F: 80, angF: 25, v0: 0, t: 2 } },
        { nome: '6 · Lançado para cima', desc: 'sobe, para e volta: o atrito muda de sentido', valores: { m: 10, theta: 20, mue: 0.4, muc: 0.3, F: 0, angF: 0, v0: 6, t: 1 } }
      ],
      controles: [
        { id: 'm', label: 'Massa do bloco', min: 0.5, max: 200, step: 0.5, valor: 10, unidade: 'kg' },
        { id: 'theta', label: 'Inclinação do plano', min: 0, max: 60, step: 1, valor: 30, unidade: '°' },
        { tipo: 'titulo', label: 'Atrito' },
        { id: 'mue', label: 'Coeficiente estático μe', min: 0, max: 1, step: 0.01, valor: 0.4, unidade: '' },
        { id: 'muc', label: 'Coeficiente cinético μc', min: 0, max: 1, step: 0.01, valor: 0.3, unidade: '' },
        { tipo: 'titulo', label: 'Força aplicada e movimento' },
        { id: 'F', label: 'Força aplicada', min: 0, max: 500, step: 5, valor: 0, unidade: 'N' },
        { id: 'angF', label: 'Ângulo da força com o plano', min: -45, max: 45, step: 1, valor: 0, unidade: '°' },
        { id: 'v0', label: 'Velocidade inicial (subindo o plano)', min: -10, max: 10, step: 0.5, valor: 0, unidade: 'm/s' },
        { id: 't', label: 'Instante analisado', min: 0.1, max: 10, step: 0.1, valor: 2, unidade: 's' }
      ],
      graficos: [
        { id: 'plano', axes: false, height: 330, grid: false, legend: false },
        { id: 'cinematica', titulo: 'Velocidade e posição ao longo do tempo', xlabel: 'tempo (s)', ylabel: 'v (m/s) · x (m)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'energia', titulo: 'Balanço de energia no deslocamento', xlabel: '', ylabel: 'energia (J)', aspect: 0.4, legend: false }
      ],
      saidas: [
        { id: 'N', label: 'Força normal' },
        { id: 'pesoX', label: 'Peso no plano' },
        { id: 'fmax', label: 'Atrito estático máximo' },
        { id: 'estado', label: 'Estado' },
        { id: 'a', label: 'Aceleração' },
        { id: 'v', label: 'Velocidade em t' },
        { id: 'x', label: 'Deslocamento em t' },
        { id: 'thLim', label: 'Ângulo de atrito' }
      ],
      formulas: [
        { g: 'Diagrama de corpo livre' },
        { tex: 'N = mg\\cos\\theta - F\\,\\text{sen}\\,\\beta \\qquad P_x = mg\\,\\text{sen}\\,\\theta', d: 'β é o ângulo entre a força aplicada e o plano', destaque: true },
        { tex: 'f_{max} = \\mu_e N \\qquad f_{cin} = \\mu_c N', d: 'o atrito estático se ajusta até o máximo; o cinético é fixo' },
        { tex: '\\tan\\phi_s = \\mu_e', d: 'ângulo de atrito: acima dele o corpo escorrega sozinho', destaque: true },
        { g: 'Segunda lei e d\u2019Alembert' },
        { tex: '\\sum F_x = m a_x', d: 'na direção do movimento' },
        { tex: '\\sum F_x - m a_x = 0', d: 'princípio de d\u2019Alembert: a força de inércia −ma transforma o problema em estático', destaque: true },
        { g: 'Trabalho e energia' },
        { tex: 'W_{total} = \\Delta E_c = \\tfrac12 m v^2 - \\tfrac12 m v_0^2', d: 'teorema do trabalho-energia cinética', destaque: true },
        { tex: 'W_{peso} = -mg\\,\\text{sen}\\,\\theta\\cdot x \\qquad W_{atrito} = -f\\,|x| \\le 0', d: 'o atrito sempre retira energia mecânica' },
        { tex: 'P = F\\,v', d: 'potência instantânea' }
      ],
      passos: [],
      nota: 'Bloco tratado como partícula (sem tombamento), atrito de Coulomb com coeficientes constantes e aceleração constante durante o intervalo analisado. Se a velocidade muda de sinal, o sentido do atrito muda junto — o simulador considera o sentido no instante inicial.',
      calcular: function (p, ctx) {
        var r = DIN.bloco(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true; A.v = p.v0; A.s = 0;
        desenha();

        var g1 = ctx.plot('cinematica').clear();
        var ts = Plot.linspace(0, Math.max(p.t, 0.2), 60);
        g1.line(ts, ts.map(function (t) { return p.v0 + r.a * t; }), { color: Plot.serie(0), width: 2.6, label: 'velocidade (m/s)' });
        g1.line(ts, ts.map(function (t) { return p.v0 * t + 0.5 * r.a * t * t; }), { color: Plot.serie(2), width: 2.4, label: 'posição (m)' });
        g1.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1 });
        if (r.tPara > 0 && r.tPara < p.t) g1.vline(r.tPara, { color: 'rgb(220,110,40)', text: 'para em ' + sg(r.tPara, 3) + ' s' });
        g1.marker(p.t, r.v, 'v = ' + sg(r.v, 3), { color: Plot.serie(6), r: 4.5 });
        g1.draw();

        var g2 = ctx.plot('energia').clear();
        g2.o.xcat = [{ v: 0, label: 'trabalho da\nforça F' }, { v: 1, label: 'trabalho do\npeso' },
                     { v: 2, label: 'trabalho do\natrito' }, { v: 3, label: 'variação da\nenergia cinética' }];
        var vals = [r.WF, r.Wpeso, r.Watrito, r.dEc];
        var cores = [Plot.serie(3), 'rgb(220,60,60)', 'rgb(230,150,50)', Plot.serie(0)];
        var alto = Math.max.apply(null, vals.concat([0])), baixo = Math.min.apply(null, vals.concat([0]));
        var faixa = Math.max(alto - baixo, 1);
        g2.setLimits([-0.6, 3.6], [baixo - faixa * 0.15, alto + faixa * 0.2]);
        vals.forEach(function (v, k) {
          g2.bars([k], [v], { color: cores[k], barw: 0.5 });
          g2.text(k, v, sg(v, 4) + ' J', { align: 'center', dy: v >= 0 ? -7 : 15, size: 11 });
        });
        g2.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        g2.draw();

        ctx.setPassos([
          { t: '① Força normal',
            tex: 'N = mg\\cos\\theta - F\\,\\text{sen}\\,\\beta',
            texSub: 'N = ' + nt(p.m, 3) + '\\cdot' + nt(G, 3) + '\\cos' + nt(p.theta, 3) + '^\\circ' + (p.F > 0 ? ' - ' + nt(p.F, 3) + '\\,\\text{sen}\\,' + nt(p.angF, 3) + '^\\circ' : '') + ' = ' + nt(r.N, 4) + '\\ N',
            obs: p.angF > 0 ? 'A componente perpendicular da força aplicada alivia a normal — e, com ela, o atrito. É por isso que puxar uma caixa costuma ser mais fácil que empurrá-la para baixo.' : 'Sem componente perpendicular, a normal é simplesmente a componente do peso.' },
          { t: '② O bloco se move?',
            tex: 'f_{max} = \\mu_e N \\qquad\\text{compara-se com } |F_x - mg\\,\\text{sen}\\,\\theta|',
            texSub: 'f_{max} = ' + nt(p.mue, 3) + '\\cdot' + nt(r.N, 4) + ' = ' + nt(r.atritoMax, 4) + '\\ N \\qquad \\text{força líquida} = ' + nt(Math.abs(r.pesoX - p.F * Math.cos(p.angF * Math.PI / 180)), 4) + '\\ N',
            r: r.estado,
            obs: 'O ângulo de atrito é φ = arctan μe = ' + sg(r.thLim, 3) + '°. Num plano com essa inclinação o bloco fica na iminência de escorregar, qualquer que seja a massa — a massa cancela dos dois lados.' },
          { t: '③ Aceleração pela segunda lei',
            tex: '\\sum F_x = m a \\Rightarrow a = \\frac{F\\cos\\beta - mg\\,\\text{sen}\\,\\theta \\pm \\mu_c N}{m}',
            texSub: 'a = ' + nt(r.a, 4) + '\\ m/s^2',
            obs: r.moveSe || Math.abs(p.v0) > 0 ? 'Com o bloco em movimento, entra o atrito cinético (μc = ' + sg(p.muc, 3) + '), sempre contrário à velocidade.' : 'Sem movimento, a aceleração é nula e o atrito assume exatamente o valor necessário para o equilíbrio.' },
          { t: '④ Cinemática e energia',
            tex: 'v = v_0 + at \\qquad x = v_0 t + \\tfrac12 a t^2 \\qquad W_{total} = \\Delta E_c',
            texSub: 'v(' + nt(p.t, 3) + ') = ' + nt(r.v, 4) + '\\ m/s,\\quad x = ' + nt(r.x, 4) + '\\ m,\\quad \\Delta E_c = ' + nt(r.dEc, 4) + '\\ J',
            obs: 'Conferindo o balanço: W_F + W_peso + W_atrito = ' + sg(r.WF + r.Wpeso + r.Watrito, 4) + ' J, igual à variação de energia cinética. O trabalho do atrito é sempre negativo: essa energia vira calor.' }
        ]);
        return {
          N: { v: r.N, u: 'N' },
          pesoX: { v: r.pesoX, u: 'N' },
          fmax: { v: r.atritoMax, u: 'N' },
          estado: { v: r.estado, u: '', classe: r.moveSe ? 'alerta' : 'ok' },
          a: { v: r.a, u: 'm/s²', classe: 'destaque' },
          v: { v: r.v, u: 'm/s' },
          x: { v: r.x, u: 'm' },
          thLim: { v: r.thLim, u: '°' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Impacto direto central
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-impacto')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true, fase: 0 };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var y = a.y + a.h * 0.42, x0 = a.x + 40, x1 = a.x + a.w * 0.72;
      /* trilho */
      c.strokeStyle = faint; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x0, y + 28); c.lineTo(x1, y + 28); c.stroke();
      /* posições animadas: antes do choque se aproximam, depois se afastam */
      var T = 3.2, t = A.t % T, xc = (x0 + x1) / 2;
      var r1 = 14 + 10 * Math.pow(p.m1 / Math.max(p.m1, p.m2), 1 / 3);
      var r2 = 14 + 10 * Math.pow(p.m2 / Math.max(p.m1, p.m2), 1 / 3);
      var esc = 26;                                    /* px por (m/s) de deslocamento por segundo */
      var x1p, x2p, antes = t < T / 2;
      if (antes) {
        var dt = T / 2 - t;
        x1p = xc - r1 - p.v1 * esc * dt * 0 - (r1 + 4) - Math.max(0, p.v1) * esc * dt;
        x1p = xc - r1 - 4 - p.v1 * esc * dt;
        x2p = xc + r2 + 4 - p.v2 * esc * dt;
      } else {
        var dt2 = t - T / 2;
        x1p = xc - r1 - 4 + r.v1f * esc * dt2;
        x2p = xc + r2 + 4 + r.v2f * esc * dt2;
      }
      [[x1p, r1, p.m1, antes ? p.v1 : r.v1f, Plot.serie(0)], [x2p, r2, p.m2, antes ? p.v2 : r.v2f, Plot.serie(2)]].forEach(function (q, j) {
        c.fillStyle = q[4]; c.globalAlpha = 0.55;
        c.beginPath(); c.arc(q[0], y, q[1], 0, TAU); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = cor; c.lineWidth = 1.6; c.stroke();
        rotulo(c, (j ? 'm₂ = ' : 'm₁ = ') + sg(q[2], 3) + ' kg', q[0], y + q[1] + 16, q[4], 11, '700');
        if (Math.abs(q[3]) > 1e-6) {
          seta(c, q[0], y - q[1] - 14, q[0] + Math.sign(q[3]) * (18 + Math.min(Math.abs(q[3]) * 6, 40)), y - q[1] - 14, q[4], 2.4, 9);
          rotulo(c, sg(q[3], 3) + ' m/s', q[0], y - q[1] - 30, q[4], 10.5, '700');
        }
      });
      /* faísca no momento do choque */
      if (Math.abs(t - T / 2) < 0.12) {
        c.strokeStyle = 'rgb(255,220,120)'; c.lineWidth = 2;
        for (var i = 0; i < 8; i++) {
          var an = i * TAU / 8;
          c.beginPath(); c.moveTo(xc + 10 * Math.cos(an), y + 10 * Math.sin(an));
          c.lineTo(xc + 22 * Math.cos(an), y + 22 * Math.sin(an)); c.stroke();
        }
      }
      rotulo(c, antes ? 'antes do impacto' : 'depois do impacto', xc, a.y + 18, antes ? faint : cor, 12.5, '700');
      /* painel */
      var lx = a.x + a.w * 0.76, ly = a.y + 26;
      var linhas = [
        ['tipo de impacto', r.tipo],
        ['velocidade do centro de massa', sg(r.vG, 4) + ' m/s'],
        ["v₁'", sg(r.v1f, 4) + ' m/s'],
        ["v₂'", sg(r.v2f, 4) + ' m/s'],
        ['energia perdida', sg(r.perda, 4) + ' J  (' + sg(r.perc, 3) + ' %)'],
        ['impulso trocado', sg(Math.abs(r.J), 4) + ' N·s']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, cor, 12, '700', 'left');
      });
      rotulo(c, 'quantidade de movimento sempre se conserva', lx, ly + 6 * 34 + 4, Plot.serie(2), 10.5, '700', 'left');
      rotulo(c, 'energia só se e = 1', lx, ly + 6 * 34 + 19, Plot.serie(2), 10.5, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('choque');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-impacto', {
      titulo: 'Impacto direto central — restituição e perda de energia',
      descricao: 'Num choque a quantidade de movimento do sistema sempre se conserva, porque as forças internas são iguais e opostas. A energia cinética, não: só o impacto perfeitamente elástico (e = 1) a conserva. O coeficiente de restituição mede a razão entre as velocidades de afastamento e de aproximação.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Elástico, massas iguais', desc: 'trocam de velocidade', valores: { m1: 2, m2: 2, v1: 10, v2: 0, e: 1 } },
        { nome: '2 · Perfeitamente plástico', desc: 'saem juntos, com v do centro de massa', valores: { m1: 2, m2: 2, v1: 10, v2: 0, e: 0 } },
        { nome: '3 · Choque real', desc: 'e = 0,6: perde parte da energia', valores: { m1: 2, m2: 2, v1: 10, v2: 0, e: 0.6 } },
        { nome: '4 · Leve contra pesado', desc: 'a bola leve volta quase com a mesma velocidade', valores: { m1: 0.5, m2: 20, v1: 8, v2: 0, e: 0.9 } },
        { nome: '5 · Choque frontal', desc: 'corpos vindo um contra o outro', valores: { m1: 5, m2: 3, v1: 6, v2: -2, e: 0.7 } },
        { nome: '6 · Pesado contra leve', desc: 'o leve sai quase com o dobro da velocidade', valores: { m1: 20, m2: 0.5, v1: 4, v2: 0, e: 1 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Corpo 1' },
        { id: 'm1', label: 'Massa m₁', min: 0.1, max: 50, step: 0.1, valor: 2, unidade: 'kg' },
        { id: 'v1', label: 'Velocidade v₁', min: -20, max: 20, step: 0.5, valor: 10, unidade: 'm/s' },
        { tipo: 'titulo', label: 'Corpo 2' },
        { id: 'm2', label: 'Massa m₂', min: 0.1, max: 50, step: 0.1, valor: 2, unidade: 'kg' },
        { id: 'v2', label: 'Velocidade v₂', min: -20, max: 20, step: 0.5, valor: 0, unidade: 'm/s' },
        { tipo: 'separador' },
        { id: 'e', label: 'Coeficiente de restituição e', min: 0, max: 1, step: 0.01, valor: 0.6, unidade: '', desc: '0 = perfeitamente plástico · 1 = perfeitamente elástico' }
      ],
      graficos: [
        { id: 'choque', axes: false, height: 300, grid: false, legend: false },
        { id: 've', titulo: 'Velocidades finais em função de e', xlabel: 'coeficiente de restituição e', ylabel: 'velocidade (m/s)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'bal', titulo: 'Quantidade de movimento e energia', xlabel: '', ylabel: '', aspect: 0.4, legend: false }
      ],
      saidas: [
        { id: 'vG', label: 'Velocidade do centro de massa' },
        { id: 'v1f', label: "v₁' depois" },
        { id: 'v2f', label: "v₂' depois" },
        { id: 'p', label: 'Quantidade de movimento' },
        { id: 'Ei', label: 'Energia antes' },
        { id: 'Ef', label: 'Energia depois' },
        { id: 'perda', label: 'Energia perdida' },
        { id: 'J', label: 'Impulso trocado' }
      ],
      formulas: [
        { g: 'As duas equações do impacto' },
        { tex: 'm_1 v_1 + m_2 v_2 = m_1 v_1\' + m_2 v_2\'', d: 'conservação da quantidade de movimento — sempre válida', destaque: true },
        { tex: 'e = \\frac{v_2\' - v_1\'}{v_1 - v_2}', d: 'coeficiente de restituição: afastamento sobre aproximação', destaque: true },
        { g: 'Resultado' },
        { tex: 'v_1\' = v_G + e\\,\\frac{m_2}{m_1+m_2}(v_2 - v_1) \\qquad v_2\' = v_G + e\\,\\frac{m_1}{m_1+m_2}(v_1 - v_2)', d: 'com v_G = (m₁v₁ + m₂v₂)/(m₁+m₂)' },
        { tex: '\\Delta E = \\tfrac12\\,\\frac{m_1 m_2}{m_1+m_2}\\,(1 - e^2)(v_1 - v_2)^2', d: 'energia dissipada; nula apenas se e = 1', destaque: true },
        { g: 'Casos particulares' },
        { tex: 'e = 1,\\ m_1 = m_2 \\Rightarrow \\text{as velocidades se trocam}', d: 'o berço de Newton' },
        { tex: 'e = 0 \\Rightarrow v_1\' = v_2\' = v_G', d: 'os corpos seguem juntos' },
        { tex: 'J = m_1(v_1\' - v_1) = -m_2(v_2\' - v_2)', d: 'impulso: mesma intensidade, sentidos opostos (terceira lei)' }
      ],
      passos: [],
      nota: 'Impacto direto e central: as velocidades estão na linha que une os centros, e não há rotação nem atrito entre os corpos. Fora disso (impacto oblíquo), aplica-se a restituição na direção normal e conserva-se a quantidade de movimento na tangencial.',
      calcular: function (p, ctx) {
        var r = DIN.impacto(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('ve').clear();
        var es = Plot.linspace(0, 1, 50);
        g.line(es, es.map(function (e) { return DIN.impacto({ m1: p.m1, m2: p.m2, v1: p.v1, v2: p.v2, e: e }).v1f; }),
          { color: Plot.serie(0), width: 2.6, label: "v₁' " });
        g.line(es, es.map(function (e) { return DIN.impacto({ m1: p.m1, m2: p.m2, v1: p.v1, v2: p.v2, e: e }).v2f; }),
          { color: Plot.serie(2), width: 2.6, label: "v₂' " });
        g.hline(r.vG, { color: Plot.serie(5), dash: [4, 4], text: 'v do centro de massa' });
        g.vline(p.e, { color: Plot.serie(6), text: 'e atual' });
        g.draw();

        var gb = ctx.plot('bal').clear();
        gb.o.xcat = [{ v: 0, label: 'quantidade de\nmovimento antes' }, { v: 1, label: 'quantidade de\nmovimento depois' },
                     { v: 2, label: 'energia\nantes (J)' }, { v: 3, label: 'energia\ndepois (J)' }];
        var vals = [r.pIni, r.pFim, r.Ei, r.Ef];
        var cores = [Plot.serie(2), Plot.serie(2), Plot.serie(3), Plot.serie(3)];
        var alto = Math.max.apply(null, vals.concat([0])), baixo = Math.min.apply(null, vals.concat([0]));
        var faixa = Math.max(alto - baixo, 1);
        gb.setLimits([-0.6, 3.6], [baixo - faixa * 0.12, alto + faixa * 0.2]);
        vals.forEach(function (v, k) {
          gb.bars([k], [v], { color: cores[k], barw: 0.5 });
          gb.text(k, v, sg(v, 4), { align: 'center', dy: v >= 0 ? -7 : 15, size: 11 });
        });
        gb.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        gb.draw();

        ctx.setPassos([
          { t: '① Quantidade de movimento do sistema',
            tex: 'p = m_1 v_1 + m_2 v_2 = (m_1 + m_2)\\,v_G',
            texSub: 'p = ' + nt(p.m1, 3) + '\\cdot' + nt(p.v1, 3) + ' + ' + nt(p.m2, 3) + '\\cdot' + nt(p.v2, 3) + ' = ' + nt(r.pIni, 4) + '\\ kg\\cdot m/s \\Rightarrow v_G = ' + nt(r.vG, 4) + '\\ m/s',
            obs: 'O centro de massa não sente o choque: as forças internas se cancelam, e ele continua com a mesma velocidade antes, durante e depois.' },
          { t: '② Coeficiente de restituição',
            tex: 'e = \\frac{v_2\' - v_1\'}{v_1 - v_2}',
            texSub: 'e = ' + nt(p.e, 3) + ' \\Rightarrow \\text{velocidade de afastamento} = ' + nt(p.e, 3) + '\\cdot' + nt(p.v1 - p.v2, 4) + ' = ' + nt(p.e * (p.v1 - p.v2), 4) + '\\ m/s',
            r: r.tipo,
            obs: 'e = 1 significa que os corpos se afastam tão rápido quanto se aproximaram; e = 0, que seguem juntos. Aço contra aço dá cerca de 0,6 a 0,8; massa de vidraceiro, praticamente zero.' },
          { t: '③ Velocidades depois do impacto',
            tex: "v_1' = v_G + e\\frac{m_2}{m_1+m_2}(v_2 - v_1) \\qquad v_2' = v_G + e\\frac{m_1}{m_1+m_2}(v_1 - v_2)",
            texSub: "v_1' = " + nt(r.v1f, 4) + '\\ m/s \\qquad v_2\' = ' + nt(r.v2f, 4) + '\\ m/s',
            obs: 'Conferindo: m₁v₁\' + m₂v₂\' = ' + sg(r.pFim, 4) + ' kg·m/s, igual ao valor antes do choque.' },
          { t: '④ Energia dissipada',
            tex: '\\Delta E = \\tfrac12\\frac{m_1m_2}{m_1+m_2}(1 - e^2)(v_1 - v_2)^2',
            texSub: '\\Delta E = ' + nt(r.perda, 4) + '\\ J \\quad (' + nt(r.perc, 3) + '\\ \\% \\text{ da energia inicial})',
            obs: p.e >= 0.999 ? 'Com e = 1 não há perda: é o único caso em que a energia cinética se conserva.'
              : 'Essa energia vira deformação permanente, calor e som. No choque perfeitamente plástico a perda é máxima — mas nunca 100 %, porque o centro de massa continua se movendo.' }
        ]);
        return {
          vG: { v: r.vG, u: 'm/s' },
          v1f: { v: r.v1f, u: 'm/s', classe: 'destaque' },
          v2f: { v: r.v2f, u: 'm/s', classe: 'destaque' },
          p: { v: r.pIni, u: 'kg·m/s (conservada)' },
          Ei: { v: r.Ei, u: 'J' },
          Ef: { v: r.Ef, u: 'J' },
          perda: { v: sg(r.perda, 4) + ' J (' + sg(r.perc, 3) + ' %)', u: '', classe: r.perda > 0 ? 'alerta' : 'ok' },
          J: { v: Math.abs(r.J), u: 'N·s' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Rolamento em plano inclinado
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-rolamento')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };
    var ORDEM = ['esfera', 'cilindro', 'esfOca', 'tubo', 'semRolar'];

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var th = p.theta * Math.PI / 180;
      var Lp = Math.min(a.w * 0.62, (a.h - 80) / Math.max(Math.sin(th), 0.12));
      var x0 = a.x + 30, y0 = a.y + a.h - 44;
      var x1 = x0 + Lp * Math.cos(th), y1 = y0 - Lp * Math.sin(th);
      c.fillStyle = faint; c.globalAlpha = 0.2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y0); c.closePath(); c.fill();
      c.globalAlpha = 1; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x0, y0); c.lineTo(x1, y0); c.stroke();
      rotulo(c, p.theta + '°', x1 - 30, y0 - 10, cor, 12, '700');
      /* corrida: cada corpo parte do topo */
      var corridos = ORDEM.filter(function (k) { return p.corrida || k === p.corpo; });
      var tMax = 0;
      corridos.forEach(function (k) {
        var q = DIN.rolamento({ corpo: k, theta: p.theta, m: p.m, r: p.r, L: p.L, mu: p.mu });
        tMax = Math.max(tMax, q.t);
      });
      var tciclo = (A.t % (tMax * 1.35));
      corridos.forEach(function (k, j) {
        var q = DIN.rolamento({ corpo: k, theta: p.theta, m: p.m, r: p.r, L: p.L, mu: p.mu });
        var s = Math.min(p.L, 0.5 * q.a * tciclo * tciclo);
        var fr = s / p.L;
        var raio = 13;
        var px = x1 - (x1 - x0) * fr, py = y1 - (y1 - y0) * fr;
        var nx = px - raio * Math.sin(th), ny = py - raio * Math.cos(th);
        var cores = [Plot.serie(0), Plot.serie(2), Plot.serie(3), Plot.serie(4), Plot.serie(5)];
        var deslocado = j * 0;
        void deslocado;
        c.fillStyle = cores[ORDEM.indexOf(k)]; c.globalAlpha = k === p.corpo ? 0.75 : 0.35;
        c.beginPath(); c.arc(nx, ny, raio, 0, TAU); c.fill(); c.globalAlpha = 1;
        c.strokeStyle = cor; c.lineWidth = 1.4; c.stroke();
        /* marca de rotação */
        var giro = q.rola ? s / p.r : 0;
        c.beginPath(); c.moveTo(nx, ny);
        c.lineTo(nx + raio * 0.8 * Math.cos(-giro - th), ny + raio * 0.8 * Math.sin(-giro - th)); c.stroke();
        if (k === p.corpo) {
          rotulo(c, DIN.CORPOS[k].nome, nx, ny - raio - 12, cores[ORDEM.indexOf(k)], 11, '700');
        }
      });
      /* painel */
      var lx = a.x + a.w * 0.68, ly = a.y + 22;
      rotulo(c, p.corrida ? 'Corrida: quem chega primeiro?' : 'Corpo selecionado', lx, ly - 4, cor, 12, '700', 'left');
      var lista = corridos.map(function (k) {
        var q = DIN.rolamento({ corpo: k, theta: p.theta, m: p.m, r: p.r, L: p.L, mu: p.mu });
        return [DIN.CORPOS[k].nome, q];
      }).sort(function (x, y) { return x[1].t - y[1].t; });
      lista.forEach(function (q, j) {
        rotulo(c, (j + 1) + 'º  ' + q[0], lx, ly + 22 + j * 32, cor, 11, '700', 'left');
        rotulo(c, 'a = ' + sg(q[1].a, 3) + ' m/s²  ·  t = ' + sg(q[1].t, 3) + ' s  ·  v = ' + sg(q[1].v, 3) + ' m/s',
          lx, ly + 36 + j * 32, faint, 10, '400', 'left');
      });
      rotulo(c, 'quem tem menos inércia de rotação chega antes', lx, ly + 26 + lista.length * 32 + 8, Plot.serie(2), 10.5, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('rampa');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-rolamento', {
      titulo: 'Rolamento sem deslizamento — quem desce mais rápido',
      descricao: 'Na descida, a energia potencial se divide entre translação e rotação. Quanto maior a inércia de rotação em relação à massa, mais energia fica "presa" no giro e menor a aceleração — e isso não depende da massa nem do raio, apenas da forma. O atrito estático é o que garante o rolamento, e não dissipa energia.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · A corrida clássica', desc: 'esfera, cilindro, casca e aro juntos', valores: { corpo: 'esfera', theta: 25, m: 2, r: 0.1, L: 3, mu: 0.4, corrida: true } },
        { nome: '2 · Só a esfera', desc: 'a = 5g·senθ/7', valores: { corpo: 'esfera', theta: 25, m: 2, r: 0.1, L: 3, mu: 0.4, corrida: false } },
        { nome: '3 · Aro (pior caso)', desc: 'metade da energia vai para a rotação', valores: { corpo: 'tubo', theta: 25, m: 2, r: 0.1, L: 3, mu: 0.4, corrida: false } },
        { nome: '4 · Atrito insuficiente', desc: 'μ baixo: escorrega em vez de rolar', valores: { corpo: 'esfera', theta: 35, m: 2, r: 0.1, L: 3, mu: 0.08, corrida: false } },
        { nome: '5 · Bloco deslizando', desc: 'sem rotação, mas com atrito dissipando', valores: { corpo: 'semRolar', theta: 25, m: 2, r: 0.1, L: 3, mu: 0.25, corrida: false } },
        { nome: '6 · Rampa suave', desc: '10°: menos atrito necessário', valores: { corpo: 'esfera', theta: 10, m: 2, r: 0.1, L: 3, mu: 0.4, corrida: true } }
      ],
      controles: [
        { id: 'corpo', tipo: 'select', label: 'Corpo', valor: 'esfera',
          opcoes: Object.keys(DIN.CORPOS).map(function (k) { return { v: k, t: DIN.CORPOS[k].nome }; }) },
        { id: 'corrida', tipo: 'check', label: 'Mostrar todos ao mesmo tempo (corrida)', valor: true },
        { tipo: 'titulo', label: 'Rampa' },
        { id: 'theta', label: 'Inclinação', min: 2, max: 60, step: 1, valor: 25, unidade: '°' },
        { id: 'L', label: 'Comprimento da rampa', min: 0.3, max: 20, step: 0.1, valor: 3, unidade: 'm' },
        { id: 'mu', label: 'Coeficiente de atrito', min: 0, max: 1, step: 0.01, valor: 0.4, unidade: '' },
        { tipo: 'titulo', label: 'Corpo' },
        { id: 'm', label: 'Massa', min: 0.1, max: 50, step: 0.1, valor: 2, unidade: 'kg' },
        { id: 'r', label: 'Raio', min: 0.01, max: 1, step: 0.01, valor: 0.1, unidade: 'm' }
      ],
      graficos: [
        { id: 'rampa', axes: false, height: 340, grid: false, legend: false },
        { id: 'acel', titulo: 'Aceleração × inclinação', xlabel: 'inclinação (°)', ylabel: 'aceleração (m/s²)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'energia', titulo: 'Divisão da energia no fim da descida', xlabel: '', ylabel: 'energia (J)', aspect: 0.4, legend: false }
      ],
      saidas: [
        { id: 'k', label: 'I/(m·r²)' },
        { id: 'I', label: 'Momento de inércia' },
        { id: 'a', label: 'Aceleração' },
        { id: 'muNec', label: 'μ necessário para rolar' },
        { id: 'estado', label: 'Movimento' },
        { id: 'v', label: 'Velocidade no fim' },
        { id: 'omega', label: 'Rotação no fim' },
        { id: 'frac', label: 'Fração da energia em rotação' }
      ],
      formulas: [
        { g: 'Rolamento sem deslizamento' },
        { tex: 'v_G = \\omega r \\qquad a_G = \\alpha r', d: 'condição cinemática do rolamento', destaque: true },
        { tex: 'a_G = \\frac{g\\,\\text{sen}\\,\\theta}{1 + I_G/(m r^2)}', d: 'não depende da massa nem do raio, só da forma', destaque: true },
        { tex: 'f = \\frac{I_G/(mr^2)}{1 + I_G/(mr^2)}\\,mg\\,\\text{sen}\\,\\theta \\qquad \\mu_{nec} = \\frac{I_G/(mr^2)}{1 + I_G/(mr^2)}\\tan\\theta', d: 'atrito estático necessário' },
        { g: 'Momentos de inércia (I = k·m·r²)' },
        { tex: 'k = \\tfrac{2}{5}\\ \\text{esfera} \\quad \\tfrac12\\ \\text{cilindro} \\quad \\tfrac23\\ \\text{casca} \\quad 1\\ \\text{aro}', d: 'ordem de chegada: esfera, cilindro, casca, aro' },
        { g: 'Energia' },
        { tex: 'mgh = \\tfrac12 m v^2 + \\tfrac12 I_G\\omega^2 = \\tfrac12 m v^2 (1 + k)', d: 'o atrito estático no rolamento não dissipa energia', destaque: true },
        { tex: '\\frac{E_{rot}}{E_{total}} = \\frac{k}{1 + k}', d: 'no aro, metade da energia fica na rotação' }
      ],
      passos: [],
      nota: 'Corpos homogêneos, rampa rígida e sem resistência ao rolamento. O atrito estático no rolamento puro não realiza trabalho (o ponto de contato tem velocidade nula) — por isso a energia se conserva. Quando μ é insuficiente, o corpo escorrega e o atrito passa a ser cinético, dissipando energia.',
      calcular: function (p, ctx) {
        var r = DIN.rolamento(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('acel').clear();
        var ths = Plot.linspace(1, 60, 60);
        ORDEM.forEach(function (k, j) {
          g.line(ths, ths.map(function (t) { return DIN.rolamento({ corpo: k, theta: t, m: p.m, r: p.r, L: p.L, mu: p.mu }).a; }),
            { color: [Plot.serie(0), Plot.serie(2), Plot.serie(3), Plot.serie(4), Plot.serie(5)][j],
              width: k === p.corpo ? 2.8 : 1.5, label: DIN.CORPOS[k].nome });
        });
        g.marker(p.theta, r.a, 'operação', { color: 'rgb(220,60,60)', r: 5 });
        g.setLimits([0, 60], [0, G]).draw();

        var ge = ctx.plot('energia').clear();
        ge.o.xcat = [{ v: 0, label: 'potencial\nperdida' }, { v: 1, label: 'cinética de\ntranslação' },
                     { v: 2, label: 'cinética de\nrotação' }, { v: 3, label: 'dissipada pelo\natrito' }];
        var dissip = r.Epot - r.Ec - r.Erot;
        var vals = [r.Epot, r.Ec, r.Erot, Math.max(0, dissip)];
        var cores = [Plot.serie(5), Plot.serie(0), Plot.serie(3), 'rgb(220,60,60)'];
        ge.setLimits([-0.6, 3.6], [0, r.Epot * 1.25]);
        vals.forEach(function (v, k) {
          ge.bars([k], [v], { color: cores[k], barw: 0.5 });
          ge.text(k, v, sg(v, 4) + ' J', { align: 'center', dy: -7, size: 11 });
        });
        ge.draw();

        ctx.setPassos([
          { t: '① Momento de inércia',
            tex: 'I_G = k\\,m r^2',
            texSub: 'k = ' + nt(r.k, 3) + ' \\Rightarrow I_G = ' + nt(r.k, 3) + '\\cdot' + nt(p.m, 3) + '\\cdot' + nt(p.r, 3) + '^2 = ' + nt(r.I, 4) + '\\ kg\\cdot m^2',
            obs: 'k mede o quanto a massa está afastada do eixo. A esfera maciça concentra massa perto do centro (k = 0,4); o aro põe tudo na periferia (k = 1).' },
          { t: '② Aceleração do centro de massa',
            tex: 'a_G = \\frac{g\\,\\text{sen}\\,\\theta}{1 + k}',
            texSub: 'a_G = \\frac{' + nt(G, 3) + '\\cdot\\text{sen}\\,' + nt(p.theta, 3) + '^\\circ}{1 + ' + nt(r.k, 3) + '} = ' + nt(r.a, 4) + '\\ m/s^2',
            obs: 'Repare que massa e raio somem da conta: duas esferas de tamanhos diferentes descem juntas. Só a forma importa.' },
          { t: '③ Atrito necessário',
            tex: '\\mu_{nec} = \\frac{k}{1+k}\\tan\\theta',
            texSub: '\\mu_{nec} = \\frac{' + nt(r.k, 3) + '}{1 + ' + nt(r.k, 3) + '}\\tan' + nt(p.theta, 3) + '^\\circ = ' + nt(r.muNec, 4) + ' \\quad (\\mu \\text{ disponível} = ' + nt(p.mu, 3) + ')',
            r: r.rola ? 'Rola sem deslizar' : 'Escorrega: o atrito não é suficiente',
            obs: r.rola ? 'O ponto de contato tem velocidade nula, então esse atrito estático não realiza trabalho: a energia mecânica se conserva.'
              : 'Sem atrito suficiente, o corpo desliza e gira menos que o necessário. O atrito passa a ser cinético e dissipa energia.' },
          { t: '④ Velocidade no fim da rampa',
            tex: 'mgh = \\tfrac12 m v^2(1 + k) \\Rightarrow v = \\sqrt{\\frac{2gh}{1+k}}',
            texSub: 'h = L\\,\\text{sen}\\,\\theta = ' + nt(r.h, 4) + '\\ m \\Rightarrow v = ' + nt(r.v, 4) + '\\ m/s,\\ \\omega = v/r = ' + nt(r.omega, 4) + '\\ rad/s,\\ t = ' + nt(r.t, 4) + '\\ s',
            obs: 'Do total de energia, ' + sg(100 * r.fracRot, 3) + ' % ficam na rotação. É por isso que um aro chega por último: metade da energia dele está girando, não avançando.' }
        ]);
        return {
          k: { v: r.k, u: '' },
          I: { v: r.I, u: 'kg·m²' },
          a: { v: r.a, u: 'm/s²', classe: 'destaque' },
          muNec: { v: r.muNec, u: '' },
          estado: { v: r.rola ? 'Rola sem deslizar' : 'Escorrega', u: '', classe: r.rola ? 'ok' : 'alerta' },
          v: { v: r.v, u: 'm/s' },
          omega: { v: r.omega, u: 'rad/s' },
          frac: { v: 100 * r.fracRot, u: '%' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. Pêndulo composto
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-pendulo')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var px = a.x + a.w * 0.3, py = a.y + 42;
      var esc = Math.min((a.h - 100) / p.L, a.w * 0.22 / Math.max(p.L / 2, 0.2));
      var th0 = p.theta0 * Math.PI / 180;
      var th = th0 * Math.cos(r.wn * A.t);              /* pequenas oscilações */
      var w = -th0 * r.wn * Math.sin(r.wn * A.t);
      /* suporte */
      c.strokeStyle = faint; c.lineWidth = 3;
      c.beginPath(); c.moveTo(px - 40, py - 10); c.lineTo(px + 40, py - 10); c.stroke();
      c.save();
      c.translate(px, py); c.rotate(th);
      /* corpo */
      c.strokeStyle = cor; c.lineWidth = 1.6; c.fillStyle = Plot.serie(0); c.globalAlpha = 0.5;
      if (p.forma === 'barra' || p.forma === 'barraC') {
        var topo = p.forma === 'barraC' ? -p.L / 4 * esc : 0;
        c.fillRect(-7, topo, 14, p.L * esc);
        c.globalAlpha = 1; c.strokeRect(-7, topo, 14, p.L * esc);
      } else if (p.forma === 'disco' || p.forma === 'aro') {
        c.beginPath(); c.arc(0, p.L / 2 * esc, p.L / 2 * esc, 0, TAU);
        if (p.forma === 'aro') { c.globalAlpha = 0.25; c.fill(); c.globalAlpha = 1; } else c.fill();
        c.globalAlpha = 1; c.stroke();
        if (p.forma === 'aro') { c.lineWidth = 4; c.stroke(); }
      } else {
        c.beginPath(); c.arc(0, p.L / 2 * esc, p.L / 2 * esc, 0, TAU); c.fill();
        c.globalAlpha = 1; c.stroke();
      }
      /* centro de massa e centro de percussão */
      c.fillStyle = 'rgb(220,60,60)';
      c.beginPath(); c.arc(0, r.d * esc, 5, 0, TAU); c.fill();
      c.fillStyle = Plot.serie(3);
      c.beginPath(); c.arc(0, r.q * esc, 5, 0, TAU); c.fill();
      c.restore();
      /* pivô */
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff'); c.strokeStyle = cor; c.lineWidth = 1.6;
      c.beginPath(); c.arc(px, py, 6, 0, TAU); c.fill(); c.stroke();
      /* vertical e arco do ângulo */
      c.setLineDash([3, 3]); c.strokeStyle = faint; c.lineWidth = 1;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + p.L * esc * 1.05); c.stroke(); c.setLineDash([]);
      rotulo(c, 'G (centro de massa)', px + r.d * esc * Math.sin(th) + 12, py + r.d * esc * Math.cos(th), 'rgb(220,60,60)', 10.5, '700', 'left');
      rotulo(c, 'centro de percussão', px + r.q * esc * Math.sin(th) + 12, py + r.q * esc * Math.cos(th), Plot.serie(3), 10.5, '700', 'left');
      /* painel */
      var lx = a.x + a.w * 0.62, ly = a.y + 26;
      var linhas = [
        ['momento de inércia no pivô I_O', sg(r.Io, 4) + ' kg·m²'],
        ['momento de inércia no centro I_G', sg(r.Icm, 4) + ' kg·m²'],
        ['distância pivô-centro de massa d', sg(r.d, 4) + ' m'],
        ['frequência natural', sg(r.f, 4) + ' Hz  (' + sg(r.wn, 4) + ' rad/s)'],
        ['período (pequenas oscilações)', sg(r.T, 4) + ' s'],
        ['pêndulo simples equivalente', sg(r.Lequiv, 4) + ' m']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 34, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 34, cor, 12, '700', 'left');
      });
      rotulo(c, 'ângulo: ' + sg(th * 180 / Math.PI, 3) + '°   ·   ω = ' + sg(w, 3) + ' rad/s',
        lx, ly + 6 * 34 + 6, Plot.serie(2), 11, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('pend');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-pendulo', {
      titulo: 'Pêndulo composto — momento de inércia e centro de percussão',
      descricao: 'Um corpo rígido oscilando em torno de um pivô é um pêndulo composto: o que governa o período é a razão entre o momento de inércia no pivô e o momento do peso. O teorema dos eixos paralelos liga I_O a I_G, e existe um ponto — o centro de percussão — em que uma pancada não gera reação no pivô. É o "ponto doce" do bastão e da raquete.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Barra pivotada na ponta', desc: 'T = 2π√(2L/3g)', valores: { forma: 'barra', m: 3, L: 1.2, theta0: 10 } },
        { nome: '2 · Barra pivotada a 1/4', desc: 'mesma barra, outro pivô', valores: { forma: 'barraC', m: 3, L: 1.2, theta0: 10 } },
        { nome: '3 · Disco pela borda', desc: 'I_O = 3mR²/2', valores: { forma: 'disco', m: 2, L: 0.6, theta0: 10 } },
        { nome: '4 · Aro pela borda', desc: 'I_O = 2mR²: período maior', valores: { forma: 'aro', m: 2, L: 0.6, theta0: 10 } },
        { nome: '5 · Esfera pela superfície', desc: 'I_O = 7mR²/5', valores: { forma: 'esfera', m: 2, L: 0.6, theta0: 10 } },
        { nome: '6 · Amplitude grande', desc: '45°: o período real já não é o das pequenas oscilações', valores: { forma: 'barra', m: 3, L: 1.2, theta0: 45 } }
      ],
      controles: [
        { id: 'forma', tipo: 'select', label: 'Corpo e posição do pivô', valor: 'barra',
          opcoes: Object.keys(DIN.FORMAS).map(function (k) { return { v: k, t: DIN.FORMAS[k].nome }; }) },
        { id: 'm', label: 'Massa', min: 0.1, max: 50, step: 0.1, valor: 3, unidade: 'kg' },
        { id: 'L', label: 'Comprimento (ou diâmetro)', min: 0.1, max: 3, step: 0.05, valor: 1.2, unidade: 'm' },
        { id: 'theta0', label: 'Amplitude inicial', min: 2, max: 60, step: 1, valor: 10, unidade: '°' }
      ],
      graficos: [
        { id: 'pend', axes: false, height: 340, grid: false, legend: false },
        { id: 'Tpivo', titulo: 'Período de uma barra em função da posição do pivô', xlabel: 'distância do pivô ao centro de massa d (m)', ylabel: 'período (s)', aspect: 0.45, legendPos: 'topright' },
        { id: 'osc', titulo: 'Oscilação', xlabel: 'tempo (s)', ylabel: 'ângulo (°) · velocidade angular (rad/s)', aspect: 0.42, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Io', label: 'I no pivô' },
        { id: 'Icm', label: 'I no centro de massa' },
        { id: 'd', label: 'Distância pivô-G' },
        { id: 'wn', label: 'Frequência natural' },
        { id: 'T', label: 'Período' },
        { id: 'Texato', label: 'Período com amplitude real' },
        { id: 'Lequiv', label: 'Pêndulo simples equivalente' },
        { id: 'R', label: 'Reação no pivô (ponto mais baixo)' }
      ],
      formulas: [
        { g: 'Momento de inércia' },
        { tex: 'I_O = I_G + m d^2', d: 'teorema dos eixos paralelos (Steiner)', destaque: true },
        { tex: 'I_G = \\tfrac{1}{12}mL^2\\ \\text{(barra)} \\quad \\tfrac12 mR^2\\ \\text{(disco)} \\quad mR^2\\ \\text{(aro)} \\quad \\tfrac25 mR^2\\ \\text{(esfera)}' },
        { g: 'Oscilação' },
        { tex: '\\sum M_O = I_O\\ddot\\theta \\Rightarrow I_O\\ddot\\theta + mgd\\,\\text{sen}\\,\\theta = 0', d: 'equação do movimento em torno do pivô', destaque: true },
        { tex: '\\omega_n = \\sqrt{\\frac{mgd}{I_O}} \\qquad T = 2\\pi\\sqrt{\\frac{I_O}{mgd}}', d: 'pequenas oscilações (sen θ ≈ θ)', destaque: true },
        { tex: 'T \\approx T_0\\left(1 + \\frac{\\theta_0^2}{16}\\right)', d: 'primeira correção para amplitude grande' },
        { g: 'Pêndulo equivalente e percussão' },
        { tex: 'L_{eq} = \\frac{I_O}{m d}', d: 'comprimento do pêndulo simples de mesmo período' },
        { tex: 'q = \\frac{I_O}{m d}', d: 'centro de percussão: uma pancada aí não gera reação horizontal no pivô', destaque: true }
      ],
      passos: [],
      nota: 'Corpo rígido homogêneo, pivô sem atrito e oscilações no plano. A animação usa a solução de pequenas oscilações; o período com amplitude real é estimado pela série da integral elíptica e é mostrado à parte.',
      calcular: function (p, ctx) {
        var r = DIN.pendulo(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        /* período de uma barra em função da posição do pivô */
        var g = ctx.plot('Tpivo').clear();
        var ds = Plot.linspace(0.02 * p.L, 0.5 * p.L, 80);
        var Ts = ds.map(function (d) { return 2 * Math.PI * Math.sqrt((p.L * p.L / 12 + d * d) / (G * d)); });
        g.line(ds, Ts, { color: Plot.serie(0), width: 2.6, label: 'barra de ' + sg(p.L, 3) + ' m' });
        var dOt = p.L / Math.sqrt(12);
        g.vline(dOt, { color: 'rgb(220,110,40)', dash: [4, 4], text: 'mínimo em L/√12' });
        if (p.forma === 'barra' || p.forma === 'barraC') g.marker(r.d, r.T, 'seu pivô', { color: 'rgb(220,60,60)', r: 5 });
        g.setLimits([0, 0.5 * p.L], [0, Math.min(Math.max.apply(null, Ts), 6)]).draw();

        var go = ctx.plot('osc').clear();
        var ts = Plot.linspace(0, 2.2 * r.T, 160);
        go.line(ts, ts.map(function (t) { return p.theta0 * Math.cos(r.wn * t); }), { color: Plot.serie(0), width: 2.6, label: 'ângulo (°)' });
        go.line(ts, ts.map(function (t) { return -p.theta0 * Math.PI / 180 * r.wn * Math.sin(r.wn * t) * 10; }),
          { color: Plot.serie(2), width: 2.2, label: 'velocidade angular × 10 (rad/s)' });
        go.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1 });
        go.vline(r.T, { color: Plot.serie(5), text: 'T = ' + sg(r.T, 3) + ' s' });
        go.draw();

        ctx.setPassos([
          { t: '① Momento de inércia no pivô',
            tex: 'I_O = I_G + m d^2',
            texSub: 'I_G = ' + nt(r.Icm, 4) + '\\ kg\\cdot m^2,\\ d = ' + nt(r.d, 4) + '\\ m \\Rightarrow I_O = ' + nt(r.Icm, 4) + ' + ' + nt(p.m, 3) + '\\cdot' + nt(r.d, 4) + '^2 = ' + nt(r.Io, 4) + '\\ kg\\cdot m^2',
            obs: 'O teorema dos eixos paralelos vale apenas a partir do eixo que passa pelo centro de massa — nunca entre dois eixos quaisquer.' },
          { t: '② Equação do movimento',
            tex: '\\sum M_O = I_O\\ddot\\theta \\Rightarrow I_O\\ddot\\theta + mgd\\,\\text{sen}\\,\\theta = 0',
            texSub: '\\text{para pequenos ângulos: } \\ddot\\theta + \\frac{mgd}{I_O}\\theta = 0',
            obs: 'É a mesma forma da equação massa-mola: o "k" é mgd e a "massa" é I_O. Toda a teoria de vibrações livres se aplica diretamente.' },
          { t: '③ Frequência natural e período',
            tex: '\\omega_n = \\sqrt{\\frac{mgd}{I_O}} \\qquad T = \\frac{2\\pi}{\\omega_n}',
            texSub: '\\omega_n = \\sqrt{\\frac{' + nt(p.m, 3) + '\\cdot' + nt(G, 3) + '\\cdot' + nt(r.d, 4) + '}{' + nt(r.Io, 4) + '}} = ' + nt(r.wn, 4) + '\\ rad/s \\Rightarrow T = ' + nt(r.T, 4) + '\\ s',
            r: 'Período: ' + sg(r.T, 4) + ' s  ·  frequência: ' + sg(r.f, 4) + ' Hz',
            obs: 'Com amplitude de ' + sg(p.theta0, 3) + '°, o período real é cerca de ' + sg(r.Texato, 4) + ' s — ' + sg(100 * (r.Texato / r.T - 1), 2) + ' % maior. O erro da aproximação de pequenas oscilações cresce com o quadrado da amplitude.' },
          { t: '④ Pêndulo equivalente e centro de percussão',
            tex: 'L_{eq} = q = \\frac{I_O}{m d}',
            texSub: 'q = \\frac{' + nt(r.Io, 4) + '}{' + nt(p.m, 3) + '\\cdot' + nt(r.d, 4) + '} = ' + nt(r.q, 4) + '\\ m',
            obs: 'Um pêndulo simples com esse comprimento oscilaria no mesmo ritmo. E uma pancada aplicada exatamente nesse ponto não produz reação horizontal no pivô: é o "ponto doce" do taco de beisebol, da raquete e do martelo.' }
        ]);
        return {
          Io: { v: r.Io, u: 'kg·m²', classe: 'destaque' },
          Icm: { v: r.Icm, u: 'kg·m²' },
          d: { v: r.d, u: 'm' },
          wn: { v: r.wn, u: 'rad/s' },
          T: { v: r.T, u: 's', classe: 'destaque' },
          Texato: { v: r.Texato, u: 's' },
          Lequiv: { v: r.Lequiv, u: 'm' },
          R: { v: r.Rbaixo, u: 'N' }
        };
      }
    });
  })();

  /* ==========================================================================
     5. Dinâmica longitudinal do veículo
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-veiculo')) return;
    var A = { ctx: null, p: null, r: null, t: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var cor = Plot.cssVar('--text', '#111'), faint = Plot.cssVar('--text-faint', '#888');
      var esc = Math.min((a.w * 0.6) / (p.L * 1.5), (a.h - 120) / (p.h * 3));
      var solo = a.y + a.h - 56;
      var xf = a.x + a.w * 0.16 + p.L * esc, xr = a.x + a.w * 0.16;   /* dianteiro à direita */
      var rRoda = 0.32 * esc;
      /* inclinação do chassi pela transferência de carga (exagerada) */
      var pitch = Math.max(-0.12, Math.min(0.12, -p.a / 30));
      c.strokeStyle = faint; c.lineWidth = 2;
      c.beginPath(); c.moveTo(a.x + 20, solo); c.lineTo(a.x + a.w - 20, solo); c.stroke();
      c.save();
      c.translate((xf + xr) / 2, solo - rRoda - p.h * esc * 0.45);
      c.rotate(pitch);
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.45;
      c.fillRect(-p.L * esc * 0.62, -p.h * esc * 0.55, p.L * esc * 1.24, p.h * esc * 1.0);
      c.globalAlpha = 1; c.strokeStyle = cor; c.lineWidth = 1.6;
      c.strokeRect(-p.L * esc * 0.62, -p.h * esc * 0.55, p.L * esc * 1.24, p.h * esc * 1.0);
      /* centro de massa */
      var xg = (p.L / 2 - p.b) * esc;
      c.fillStyle = 'rgb(220,60,60)';
      c.beginPath(); c.arc(-xg, 0, 5.5, 0, TAU); c.fill();
      rotulo(c, 'CG', -xg, -14, 'rgb(220,60,60)', 10.5, '700');
      c.restore();
      /* rodas */
      [[xr, r.Nr, 'traseiro'], [xf, r.Nf, 'dianteiro']].forEach(function (q) {
        c.fillStyle = Plot.cssVar('--bg-elev', '#fff'); c.strokeStyle = cor; c.lineWidth = 2;
        c.beginPath(); c.arc(q[0], solo - rRoda, rRoda, 0, TAU); c.fill(); c.stroke();
        var an = A.t * 4;
        c.beginPath(); c.moveTo(q[0], solo - rRoda);
        c.lineTo(q[0] + rRoda * 0.8 * Math.cos(an), solo - rRoda + rRoda * 0.8 * Math.sin(an)); c.stroke();
        /* força normal */
        var escN = 70 / Math.max(r.Nf, r.Nr, 1);
        seta(c, q[0], solo, q[0], solo - Math.max(q[1], 0) * escN - 2, Plot.serie(2), 2.6, 9);
        rotulo(c, sg(Math.max(q[1], 0) / 1000, 3) + ' kN', q[0], solo + 16, Plot.serie(2), 11, '700');
        rotulo(c, q[2], q[0], solo + 30, faint, 10, '400');
      });
      /* aceleração */
      if (Math.abs(p.a) > 0.01) {
        var cxA = (xf + xr) / 2, cyA = solo - rRoda - p.h * esc * 1.2;
        seta(c, cxA, cyA, cxA + Math.sign(p.a) * Math.min(Math.abs(p.a) * 8, 80), cyA, 'rgb(230,150,50)', 3, 11);
        rotulo(c, 'a = ' + sg(p.a, 3) + ' m/s²', cxA, cyA - 16, 'rgb(230,150,50)', 11.5, '700');
      }
      if (r.levantou) rotulo(c, 'uma das rodas perdeu contato com o solo!', (xf + xr) / 2, a.y + 20, 'rgb(220,60,60)', 12, '700');
      /* painel */
      var lx = a.x + a.w * 0.7, ly = a.y + 26;
      var linhas = [
        ['carga no eixo dianteiro', sg(r.Nf / 1000, 4) + ' kN  (' + sg(100 * r.Nf / r.Ntot, 3) + ' %)'],
        ['carga no eixo traseiro', sg(r.Nr / 1000, 4) + ' kN  (' + sg(100 * r.Nr / r.Ntot, 3) + ' %)'],
        ['transferência de carga', sg(Math.abs(r.transfer) / 1000, 4) + ' kN'],
        ['a máx com tração traseira', sg(r.aTras, 3) + ' m/s²'],
        ['a máx com tração dianteira', sg(r.aDiant, 3) + ' m/s²'],
        ['a máx com tração integral', sg(r.aInteg, 3) + ' m/s²']
      ];
      linhas.forEach(function (ln, j) {
        rotulo(c, ln[0], lx, ly + j * 33, faint, 10, '400', 'left');
        rotulo(c, ln[1], lx, ly + 13 + j * 33, cor, 12, '700', 'left');
      });
      rotulo(c, 'frenagem máxima: ' + sg(r.aFrenagem, 3) + ' m/s²', lx, ly + 6 * 33 + 6, 'rgb(220,60,60)', 11, '700', 'left');
    }
    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('carro');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.t += dt;
      desenha();
    });

    Sim.build('#sim-veiculo', {
      titulo: 'Dinâmica do veículo — transferência de carga e limites',
      descricao: 'Ao acelerar, o veículo "senta" atrás; ao frear, mergulha para a frente. A causa é o momento da força de inércia em torno do contato dos pneus: parte do peso migra de um eixo para o outro. Essa transferência muda a carga disponível para o atrito — e é ela que define a aceleração máxima de cada tipo de tração.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Carro parado', desc: 'distribuição estática de carga', valores: { m: 1400, L: 2.6, b: 1.1, h: 0.55, mu: 0.9, a: 0, v0: 27.8 } },
        { nome: '2 · Acelerando forte', desc: 'carga migra para o eixo traseiro', valores: { m: 1400, L: 2.6, b: 1.1, h: 0.55, mu: 0.9, a: 4.5, v0: 27.8 } },
        { nome: '3 · Frenagem de emergência', desc: 'o eixo dianteiro assume quase 80 %', valores: { m: 1400, L: 2.6, b: 1.1, h: 0.55, mu: 0.9, a: -8.8, v0: 27.8 } },
        { nome: '4 · Piso molhado', desc: 'μ = 0,4: tudo cai pela metade', valores: { m: 1400, L: 2.6, b: 1.1, h: 0.55, mu: 0.4, a: -3.9, v0: 27.8 } },
        { nome: '5 · Centro de massa alto', desc: 'SUV: mais transferência, risco de empinar', valores: { m: 2000, L: 2.8, b: 1.3, h: 0.85, mu: 0.9, a: 5, v0: 27.8 } },
        { nome: '6 · Moto empinando', desc: 'entre-eixos curto e CG alto', valores: { m: 250, L: 1.4, b: 0.75, h: 0.6, mu: 1.1, a: 9, v0: 20 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Veículo' },
        { id: 'm', label: 'Massa total', min: 100, max: 5000, step: 10, valor: 1400, unidade: 'kg' },
        { id: 'L', label: 'Entre-eixos', min: 0.8, max: 6, step: 0.05, valor: 2.6, unidade: 'm' },
        { id: 'b', label: 'Distância do eixo dianteiro ao CG', min: 0.2, max: 5, step: 0.05, valor: 1.1, unidade: 'm' },
        { id: 'h', label: 'Altura do centro de massa', min: 0.15, max: 2, step: 0.05, valor: 0.55, unidade: 'm' },
        { tipo: 'titulo', label: 'Condição' },
        { id: 'mu', label: 'Coeficiente de atrito pneu-solo', min: 0.1, max: 1.3, step: 0.05, valor: 0.9, unidade: '' },
        { id: 'a', label: 'Aceleração longitudinal', min: -12, max: 12, step: 0.1, valor: 0, unidade: 'm/s²', desc: 'negativa: frenagem' },
        { id: 'v0', label: 'Velocidade para o cálculo de frenagem', min: 5, max: 60, step: 1, valor: 27.8, unidade: 'm/s' }
      ],
      graficos: [
        { id: 'carro', axes: false, height: 330, grid: false, legend: false },
        { id: 'cargas', titulo: 'Cargas nos eixos em função da aceleração', xlabel: 'aceleração longitudinal (m/s²)', ylabel: 'carga no eixo (kN)', aspect: 0.45, legendPos: 'topleft' },
        { id: 'limites', titulo: 'Aceleração máxima × coeficiente de atrito', xlabel: 'coeficiente de atrito μ', ylabel: 'aceleração máxima (m/s²)', aspect: 0.45, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'Nf', label: 'Carga no eixo dianteiro' },
        { id: 'Nr', label: 'Carga no eixo traseiro' },
        { id: 'transfer', label: 'Transferência de carga' },
        { id: 'aTras', label: 'a máx — tração traseira' },
        { id: 'aDiant', label: 'a máx — tração dianteira' },
        { id: 'aInteg', label: 'a máx — tração integral' },
        { id: 'dist', label: 'Distância de frenagem' },
        { id: 'estado', label: 'Verificação' }
      ],
      formulas: [
        { g: 'Equilíbrio dinâmico (d’Alembert)' },
        { tex: 'N_f = \\frac{mg\\,(L-b)}{L} - \\frac{m a h}{L} \\qquad N_r = \\frac{mg\\,b}{L} + \\frac{m a h}{L}', d: 'b: distância do eixo dianteiro ao centro de massa', destaque: true },
        { tex: '\\Delta N = \\frac{m a h}{L}', d: 'transferência de carga: proporcional à altura do CG e inversa ao entre-eixos', destaque: true },
        { g: 'Limites de tração' },
        { tex: 'a_{máx} = \\frac{\\mu g\\,(b/L)}{1 - \\mu h/L}\\ \\ \\text{(traseira)} \\qquad \\frac{\\mu g\\,((L-b)/L)}{1 + \\mu h/L}\\ \\ \\text{(dianteira)}', d: 'a transferência ajuda a tração traseira e atrapalha a dianteira', destaque: true },
        { tex: 'a_{máx} = \\mu g \\ \\ \\text{(tração integral)}', d: 'com as quatro rodas tracionando, o limite é o atrito total' },
        { g: 'Frenagem e tombamento' },
        { tex: 'a_{fren} = -\\mu g \\qquad d = \\frac{v_0^2}{2\\mu g}', d: 'distância de frenagem cresce com o quadrado da velocidade', destaque: true },
        { tex: 'a > \\frac{g(L-b)}{h} \\Rightarrow \\text{empina} \\qquad |a| > \\frac{g\\,b}{h} \\Rightarrow \\text{capota para a frente}' }
      ],
      passos: [],
      nota: 'Modelo de dois eixos no plano longitudinal, com veículo rígido (sem suspensão), pista horizontal e arrasto aerodinâmico desprezado. O movimento de mergulho e agachamento mostrado no desenho é ilustrativo — no modelo o chassi é rígido.',
      calcular: function (p, ctx) {
        var r = DIN.veiculo(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = true;
        desenha();

        var g = ctx.plot('cargas').clear();
        var as = Plot.linspace(-12, 12, 80);
        g.line(as, as.map(function (x) { return DIN.veiculo({ m: p.m, L: p.L, b: p.b, h: p.h, mu: p.mu, a: x, v0: p.v0 }).Nf / 1000; }),
          { color: Plot.serie(0), width: 2.6, label: 'eixo dianteiro' });
        g.line(as, as.map(function (x) { return DIN.veiculo({ m: p.m, L: p.L, b: p.b, h: p.h, mu: p.mu, a: x, v0: p.v0 }).Nr / 1000; }),
          { color: Plot.serie(2), width: 2.6, label: 'eixo traseiro' });
        g.hline(0, { color: 'rgb(220,60,60)', dash: [4, 4], text: 'roda sem contato' });
        g.vline(p.a, { color: Plot.serie(6), text: 'a atual' });
        g.marker(p.a, r.Nf / 1000, '', { color: Plot.serie(0), r: 4 });
        g.marker(p.a, r.Nr / 1000, '', { color: Plot.serie(2), r: 4 });
        g.draw();

        var gl = ctx.plot('limites').clear();
        var mus = Plot.linspace(0.1, 1.3, 60);
        gl.line(mus, mus.map(function (mu) { return DIN.veiculo({ m: p.m, L: p.L, b: p.b, h: p.h, mu: mu, a: 0, v0: p.v0 }).aTras; }),
          { color: Plot.serie(2), width: 2.4, label: 'tração traseira' });
        gl.line(mus, mus.map(function (mu) { return DIN.veiculo({ m: p.m, L: p.L, b: p.b, h: p.h, mu: mu, a: 0, v0: p.v0 }).aDiant; }),
          { color: Plot.serie(0), width: 2.4, label: 'tração dianteira' });
        gl.line(mus, mus.map(function (mu) { return mu * G; }), { color: Plot.serie(3), width: 2.4, label: 'tração integral (μg)' });
        gl.hline(r.aTomba, { color: 'rgb(220,60,60)', dash: [4, 4], text: 'empina (a = g(L−b)/h)' });
        gl.vline(p.mu, { color: Plot.serie(6), text: 'μ atual' });
        gl.setLimits([0.1, 1.3], [0, Math.min(Math.max(1.3 * G, r.aTomba * 1.1), 25)]).draw();

        ctx.setPassos([
          { t: '① Distribuição estática',
            tex: 'N_{f0} = \\frac{mg(L-b)}{L} \\qquad N_{r0} = \\frac{mg\\,b}{L}',
            texSub: 'N_{f0} = ' + nt(p.m * G * (p.L - p.b) / p.L / 1000, 4) + '\\ kN \\quad N_{r0} = ' + nt(p.m * G * p.b / p.L / 1000, 4) + '\\ kN',
            obs: 'Quanto mais perto do eixo dianteiro estiver o centro de massa, maior a carga que ele suporta parado. Carros de passeio ficam tipicamente com 55 a 60 % no eixo dianteiro.' },
          { t: '② Transferência de carga',
            tex: '\\Delta N = \\frac{m a h}{L}',
            texSub: '\\Delta N = \\frac{' + nt(p.m, 4) + '\\cdot' + nt(p.a, 3) + '\\cdot' + nt(p.h, 3) + '}{' + nt(p.L, 3) + '} = ' + nt(r.transfer / 1000, 4) + '\\ kN \\Rightarrow N_f = ' + nt(r.Nf / 1000, 4) + '\\ kN,\\ N_r = ' + nt(r.Nr / 1000, 4) + '\\ kN',
            r: r.levantou ? 'Uma roda perdeu contato' : 'Os dois eixos permanecem carregados',
            obs: 'A transferência é proporcional à altura do CG e inversamente proporcional ao entre-eixos. É por isso que carros de corrida são baixos e longos, e caminhões carregados em cima freiam mal.' },
          { t: '③ Aceleração máxima conforme a tração',
            tex: 'a_{tras} = \\frac{\\mu g (b/L)}{1 - \\mu h/L} \\qquad a_{diant} = \\frac{\\mu g ((L-b)/L)}{1 + \\mu h/L}',
            texSub: 'a_{tras} = ' + nt(r.aTras, 4) + '\\ m/s^2 \\quad a_{diant} = ' + nt(r.aDiant, 4) + '\\ m/s^2 \\quad a_{4\\times4} = \\mu g = ' + nt(r.aInteg, 4) + '\\ m/s^2',
            obs: 'A tração traseira se beneficia da própria aceleração, que aumenta a carga no eixo motriz — daí a vantagem em arrancadas. A dianteira sofre o efeito contrário.' },
          { t: '④ Frenagem',
            tex: 'a = -\\mu g \\qquad d = \\frac{v_0^2}{2\\mu g}',
            texSub: 'de ' + nt(p.v0 * 3.6, 4) + '\\ km/h: d = \\frac{' + nt(p.v0, 4) + '^2}{2\\cdot' + nt(p.mu, 3) + '\\cdot' + nt(G, 3) + '} = ' + nt(r.distFrenagem, 4) + '\\ m \\ \\text{em}\\ ' + nt(r.tempoFrenagem, 3) + '\\ s',
            obs: 'A distância cresce com o quadrado da velocidade: a 120 km/h ela é 44 % maior que a 100 km/h. Com pista molhada (μ ≈ 0,4), quase dobra. O limite de tombamento para a frente seria a = ' + sg(Math.abs(r.aTombaFrente), 3) + ' m/s².' }
        ]);
        return {
          Nf: { v: r.Nf / 1000, u: 'kN', classe: r.Nf <= 0 ? 'alerta' : '' },
          Nr: { v: r.Nr / 1000, u: 'kN', classe: r.Nr <= 0 ? 'alerta' : '' },
          transfer: { v: Math.abs(r.transfer) / 1000, u: 'kN', classe: 'destaque' },
          aTras: { v: r.aTras, u: 'm/s²' },
          aDiant: { v: r.aDiant, u: 'm/s²' },
          aInteg: { v: r.aInteg, u: 'm/s²' },
          dist: { v: r.distFrenagem, u: 'm' },
          estado: { v: r.levantou ? 'Roda sem contato com o solo' : (p.a > r.aTomba ? 'Empinando' : 'Ambos os eixos carregados'), u: '',
                    classe: r.levantou || p.a > r.aTomba ? 'alerta' : 'ok' }
        };
      }
    });
  })();
})();

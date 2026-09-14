/* ============================================================
   Mecânica dos Materiais — simuladores
     1. sim-viga      : diagramas V, M e linha elástica (viga genérica)
     2. sim-tensao    : ensaio de tração — curva tensão x deformação
     3. sim-torcao    : torção de eixos — cisalhamento e ângulo de torção
     4. sim-flexao    : distribuição de tensão de flexão na seção

   O solver de vigas usa elementos finitos de Euler-Bernoulli
   (2 GDL por nó), o que resolve igualmente os casos isostáticos
   e os hiperestáticos (biengastada, engastada-apoiada).
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     Solver de viga — Euler-Bernoulli por elementos finitos
     Convenção interna: w positivo para BAIXO, cargas positivas
     para baixo. Retorna V(x), M(x) e v(x) (deflexão, positiva
     para cima) na convenção usual de resistência dos materiais.
     ============================================================ */

  /* Resolve A·x = b por eliminação de Gauss com pivoteamento parcial */
  function resolver(A, b) {
    var n = b.length, i, j, k;
    var M = A.map(function (r, idx) { return r.slice().concat([b[idx]]); });
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      var t = M[i]; M[i] = M[piv]; M[piv] = t;
      if (Math.abs(M[i][i]) < 1e-300) return null;
      for (k = i + 1; k < n; k++) {
        var f = M[k][i] / M[i][i];
        if (f === 0) continue;
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
  }

  /*
    cfg = {
      L    : vão total [m]
      EI   : rigidez à flexão [N·m²]
      apoio: 'balanco' | 'biapoiada' | 'engastada-apoiada' | 'biengastada'
      P    : { x, valor }  carga concentrada [N] (para baixo positiva) — opcional
      q    : { x1, x2, valor } carga distribuída [N/m] — opcional
      M0   : { x, valor }  momento concentrado aplicado [N·m] — opcional
      nel  : número de elementos
    }
  */
  function resolverViga(cfg) {
    var L = cfg.L, EI = cfg.EI, nel = cfg.nel || 240;
    var h = L / nel, nn = nel + 1, ndof = 2 * nn;

    /* malha com os pontos de carga encaixados em nós */
    var xs = new Array(nn), i;
    for (i = 0; i < nn; i++) xs[i] = i * h;
    function noMaisProximo(x) { return Math.max(0, Math.min(nel, Math.round(x / h))); }

    /* ---- matriz de rigidez global ---- */
    var K = [];
    for (i = 0; i < ndof; i++) K.push(new Float64Array(ndof));
    var c = EI / (h * h * h);
    var ke = [
      [12 * c, 6 * h * c, -12 * c, 6 * h * c],
      [6 * h * c, 4 * h * h * c, -6 * h * c, 2 * h * h * c],
      [-12 * c, -6 * h * c, 12 * c, -6 * h * c],
      [6 * h * c, 2 * h * h * c, -6 * h * c, 4 * h * h * c]
    ];
    var e, a, b2;
    for (e = 0; e < nel; e++) {
      var g = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
      for (a = 0; a < 4; a++) for (b2 = 0; b2 < 4; b2++) K[g[a]][g[b2]] += ke[a][b2];
    }

    /* ---- vetor de cargas ---- */
    var F = new Float64Array(ndof);
    var qEl = new Float64Array(nel);   /* carga distribuída efetiva por elemento */

    if (cfg.q && cfg.q.valor) {
      var x1 = Math.min(cfg.q.x1, cfg.q.x2), x2 = Math.max(cfg.q.x1, cfg.q.x2);
      var n1 = noMaisProximo(x1), n2 = noMaisProximo(x2);
      for (e = n1; e < n2; e++) {
        var qv = cfg.q.valor;
        qEl[e] = qv;
        /* cargas nodais consistentes para carga uniforme no elemento */
        F[2 * e] += qv * h / 2;
        F[2 * e + 1] += qv * h * h / 12;
        F[2 * e + 2] += qv * h / 2;
        F[2 * e + 3] += -qv * h * h / 12;
      }
    }
    var noP = null;
    if (cfg.P && cfg.P.valor) {
      noP = noMaisProximo(cfg.P.x);
      F[2 * noP] += cfg.P.valor;
    }
    var noM = null;
    if (cfg.M0 && cfg.M0.valor) {
      noM = noMaisProximo(cfg.M0.x);
      F[2 * noM + 1] += cfg.M0.valor;
    }

    /* ---- condições de contorno ---- */
    var fixos = {};
    function engaste(no) { fixos[2 * no] = true; fixos[2 * no + 1] = true; }
    function apoio(no) { fixos[2 * no] = true; }
    var ap = cfg.apoio;
    if (ap === 'balanco') engaste(0);
    else if (ap === 'biapoiada') { apoio(0); apoio(nel); }
    else if (ap === 'engastada-apoiada') { engaste(0); apoio(nel); }
    else { engaste(0); engaste(nel); }

    /* ---- redução e solução ---- */
    var livres = [];
    for (i = 0; i < ndof; i++) if (!fixos[i]) livres.push(i);
    var nl = livres.length;
    var Kr = [], Fr = new Array(nl);
    for (i = 0; i < nl; i++) {
      var linha = new Array(nl);
      for (var j = 0; j < nl; j++) linha[j] = K[livres[i]][livres[j]];
      Kr.push(linha);
      Fr[i] = F[livres[i]];
    }
    var sol = resolver(Kr, Fr);
    var u = new Float64Array(ndof);
    if (sol) for (i = 0; i < nl; i++) u[livres[i]] = sol[i];

    /* ---- reações (força para cima positiva) ---- */
    var reacoes = [];
    Object.keys(fixos).forEach(function (d) {
      d = +d;
      if (d % 2 !== 0) return;             /* só as verticais entram no cortante */
      var s = 0;
      for (var jj = 0; jj < ndof; jj++) s += K[d][jj] * u[jj];
      var R = s - F[d];                    /* força do apoio, para baixo positiva */
      reacoes.push({ no: d / 2, x: xs[d / 2], R: -R });   /* converte para cima positiva */
    });

    /* ---- cortante por equilíbrio do segmento à esquerda ----
       Vat(x) vale para qualquer x; nos nós usamos o limite à direita,
       que é o que aparece no diagrama (o salto sob a carga fica visível). */
    function Vat(x, incluirNo) {
      var tol = incluirNo ? 1e-12 : -1e-12;
      var v = 0;
      reacoes.forEach(function (r) { if (r.x <= x + tol) v += r.R; });
      if (noP !== null && xs[noP] <= x + tol) v -= cfg.P.valor;
      /* integral da carga distribuída até x */
      var acum = 0;
      for (var ee = 0; ee < nel; ee++) {
        var xa = xs[ee], xb = xs[ee + 1];
        if (xb <= x) acum += qEl[ee] * h;
        else if (xa < x) acum += qEl[ee] * (x - xa);
      }
      return v - acum;
    }

    var V = new Float64Array(nn);
    for (i = 0; i < nn; i++) V[i] = Vat(xs[i], true);

    /* ---- momento fletor: integra o cortante pelo ponto médio de cada
       elemento (exato para V linear e imune aos saltos nos nós) ---- */
    var M = new Float64Array(nn);
    /* momento inicial conhecido conforme o apoio */
    var M0ini = 0;
    if (ap === 'balanco' || ap === 'engastada-apoiada' || ap === 'biengastada') {
      /* engaste em x=0: M = -EI·w'' obtido do primeiro elemento */
      var w1 = u[0], t1 = u[1], w2 = u[2], t2 = u[3];
      var wpp = (-6 * w1) / (h * h) + (-4 * t1) / h + (6 * w2) / (h * h) + (-2 * t2) / h;
      M0ini = -EI * wpp;
    }
    M[0] = M0ini;
    for (i = 1; i < nn; i++) {
      M[i] = M[i - 1] + Vat((xs[i - 1] + xs[i]) / 2, true) * h;
      if (noM !== null && noM === i) M[i] += cfg.M0.valor;
    }

    /* ---- deflexão (positiva para cima) ---- */
    var defl = new Float64Array(nn);
    for (i = 0; i < nn; i++) defl[i] = -u[2 * i];

    /* ---- extremos ---- */
    function extremo(arr) {
      var vmax = -Infinity, imax = 0, vmin = Infinity, imin = 0;
      for (var k = 0; k < arr.length; k++) {
        if (arr[k] > vmax) { vmax = arr[k]; imax = k; }
        if (arr[k] < vmin) { vmin = arr[k]; imin = k; }
      }
      return { max: vmax, xmax: xs[imax], min: vmin, xmin: xs[imin],
               abs: Math.abs(vmax) >= Math.abs(vmin) ? vmax : vmin,
               xabs: Math.abs(vmax) >= Math.abs(vmin) ? xs[imax] : xs[imin] };
    }

    return {
      x: Array.prototype.slice.call(xs),
      V: Array.prototype.slice.call(V),
      M: Array.prototype.slice.call(M),
      defl: Array.prototype.slice.call(defl),
      reacoes: reacoes,
      extV: extremo(V), extM: extremo(M), extD: extremo(defl)
    };
  }

  /* ============================================================
     1. Viga — diagramas de esforços e linha elástica
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-viga')) return;

    /* --- Seções: perfis laminados e formas simples ---
       I em m⁴, c = distância da linha neutra à fibra extrema em m,
       A em m², h = altura total em m. */
    function secRet(b, h) {
      return { I: b * h * h * h / 12, c: h / 2, A: b * h, h: h,
               nome: 'Retangular ' + (b * 1000) + '×' + (h * 1000) + ' mm' };
    }
    function secCirc(d) {
      return { I: Math.PI * Math.pow(d, 4) / 64, c: d / 2, A: Math.PI * d * d / 4, h: d,
               nome: 'Maciça Ø' + (d * 1000) + ' mm' };
    }
    function secTubo(de, t) {
      var di = de - 2 * t;
      return { I: Math.PI * (Math.pow(de, 4) - Math.pow(di, 4)) / 64, c: de / 2,
               A: Math.PI * (de * de - di * di) / 4, h: de,
               nome: 'Tubo Ø' + (de * 1000) + '×' + (t * 1000) + ' mm' };
    }
    /* Perfis W laminados — I e altura de catálogo; W e A derivados por coerência */
    function secW(nome, h_mm, I_cm4, A_cm2) {
      return { I: I_cm4 * 1e-8, c: h_mm / 2000, A: A_cm2 * 1e-4, h: h_mm / 1000, nome: nome };
    }

    var SECOES = {
      'w150x13':  secW('W 150 × 13,0', 148, 635, 16.6),
      'w200x15':  secW('W 200 × 15,0', 200, 1305, 19.4),
      'w200x22':  secW('W 200 × 22,5', 206, 2029, 28.9),
      'w250x25':  secW('W 250 × 25,3', 257, 3473, 32.6),
      'w310x28':  secW('W 310 × 28,3', 309, 5497, 36.0),
      'w310x38':  secW('W 310 × 38,7', 310, 8581, 49.7),
      'w410x38':  secW('W 410 × 38,8', 399, 12777, 49.4),
      'ret50x100': secRet(0.05, 0.10),
      'ret50x150': secRet(0.05, 0.15),
      'ret100x200': secRet(0.10, 0.20),
      'circ80':   secCirc(0.08),
      'tubo100':  secTubo(0.10, 0.005),
      'tubo150':  secTubo(0.15, 0.008)
    };
    var ORDEM_SEC = ['w150x13', 'w200x15', 'w200x22', 'w250x25', 'w310x28', 'w310x38', 'w410x38',
                     'ret50x100', 'ret50x150', 'ret100x200', 'circ80', 'tubo100', 'tubo150'];

    var MATS = {
      a36:   { nome: 'Aço ASTM A36 (fy 250)',     E: 200e9, sy: 250e6 },
      a572:  { nome: 'Aço ASTM A572 G50 (fy 345)', E: 200e9, sy: 345e6 },
      a992:  { nome: 'Aço ASTM A992 (fy 345)',     E: 200e9, sy: 345e6 },
      alu:   { nome: 'Alumínio 6061-T6 (fy 240)',  E: 69e9,  sy: 240e6 },
      mad:   { nome: 'Madeira conífera (fc 40)',   E: 11e9,  sy: 40e6 },
      inox:  { nome: 'Inox AISI 304 (fy 210)',     E: 193e9, sy: 210e6 }
    };

    var LIM_FLECHA = { 'L/180': 180, 'L/250': 250, 'L/350': 350, 'L/500': 500 };

    /* ---------- desenho do esquema estrutural ---------- */
    function desenharEsquema(c2, plot, p, r) {
      var L = p.L;
      var Y = plot.py(0);
      var X0 = plot.px(0), X1 = plot.px(L);
      var alt = 13;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#888');

      /* corpo da viga */
      c2.fillStyle = Plot.cssVar('--text-muted', '#666');
      c2.globalAlpha = 0.28;
      c2.fillRect(X0, Y - alt / 2, X1 - X0, alt);
      c2.globalAlpha = 1;
      c2.strokeStyle = cor; c2.lineWidth = 1.7;
      c2.strokeRect(X0, Y - alt / 2, X1 - X0, alt);

      c2.strokeStyle = cor; c2.fillStyle = cor;

      function hachura(x, meia, yBase) {
        c2.lineWidth = 1.1;
        for (var k = -meia; k <= meia; k += 5) {
          c2.beginPath();
          c2.moveTo(x + k, yBase);
          c2.lineTo(x + k - 5, yBase + 7);
          c2.stroke();
        }
      }
      function engaste(X, lado) {
        c2.lineWidth = 2.6;
        c2.beginPath(); c2.moveTo(X, Y - 26); c2.lineTo(X, Y + 26); c2.stroke();
        c2.lineWidth = 1.1;
        for (var k = -26; k <= 26; k += 6) {
          c2.beginPath();
          c2.moveTo(X, Y + k); c2.lineTo(X - lado * 9, Y + k + 6);
          c2.stroke();
        }
      }
      function pino(X) {
        c2.lineWidth = 1.7;
        c2.beginPath();
        c2.moveTo(X, Y + alt / 2); c2.lineTo(X - 10, Y + alt / 2 + 15);
        c2.lineTo(X + 10, Y + alt / 2 + 15); c2.closePath(); c2.stroke();
        hachura(X, 13, Y + alt / 2 + 16);
      }
      function rolete(X) {
        c2.lineWidth = 1.7;
        c2.beginPath();
        c2.moveTo(X, Y + alt / 2); c2.lineTo(X - 10, Y + alt / 2 + 11);
        c2.lineTo(X + 10, Y + alt / 2 + 11); c2.closePath(); c2.stroke();
        [-5.5, 5.5].forEach(function (dx) {
          c2.beginPath(); c2.arc(X + dx, Y + alt / 2 + 14.5, 3.4, 0, Math.PI * 2); c2.stroke();
        });
        hachura(X, 13, Y + alt / 2 + 18.5);
      }

      if (p.apoio === 'balanco') engaste(X0, 1);
      else if (p.apoio === 'biapoiada') { pino(X0); rolete(X1); }
      else if (p.apoio === 'engastada-apoiada') { engaste(X0, 1); rolete(X1); }
      else { engaste(X0, 1); engaste(X1, -1); }

      /* carga distribuída */
      if (p.q > 0 && p.qx2 > p.qx1) {
        var qa = plot.px(p.qx1 * L), qb = plot.px(p.qx2 * L);
        c2.strokeStyle = Plot.serie(2); c2.fillStyle = Plot.serie(2);
        c2.lineWidth = 1.6;
        var topo = Y - alt / 2 - 30;
        c2.beginPath(); c2.moveTo(qa, topo); c2.lineTo(qb, topo); c2.stroke();
        var n = Math.max(3, Math.min(16, Math.round((qb - qa) / 26)));
        for (var i = 0; i <= n; i++) {
          var xx = qa + (qb - qa) * i / n;
          c2.beginPath(); c2.moveTo(xx, topo); c2.lineTo(xx, Y - alt / 2 - 4); c2.stroke();
          c2.beginPath();
          c2.moveTo(xx, Y - alt / 2 - 2);
          c2.lineTo(xx - 3.5, Y - alt / 2 - 9);
          c2.lineTo(xx + 3.5, Y - alt / 2 - 9);
          c2.closePath(); c2.fill();
        }
        c2.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
        c2.textAlign = 'center'; c2.textBaseline = 'bottom';
        c2.fillText('q = ' + p.q + ' kN/m', (qa + qb) / 2, topo - 5);
      }

      /* carga concentrada */
      if (p.P !== 0) {
        var Xp = plot.px(p.Px * L);
        c2.strokeStyle = Plot.serie(1); c2.fillStyle = Plot.serie(1);
        c2.lineWidth = 2.4;
        var s = p.P > 0 ? 1 : -1;
        var yTopo = Y - s * (alt / 2 + 54);
        var yPonta = Y - s * (alt / 2 + 3);
        c2.beginPath(); c2.moveTo(Xp, yTopo); c2.lineTo(Xp, yPonta); c2.stroke();
        c2.beginPath();
        c2.moveTo(Xp, yPonta);
        c2.lineTo(Xp - 5, yPonta + s * 9);
        c2.lineTo(Xp + 5, yPonta + s * 9);
        c2.closePath(); c2.fill();
        c2.font = '600 11.5px ' + Plot.cssVar('--font', 'sans-serif');
        c2.textAlign = 'center'; c2.textBaseline = s > 0 ? 'bottom' : 'top';
        c2.fillText('P = ' + Math.abs(p.P) + ' kN', Xp, yTopo - s * 4);
      }

      /* momento concentrado */
      if (p.Mext !== 0) {
        var Xm = plot.px(p.Mx * L);
        c2.strokeStyle = Plot.serie(3); c2.fillStyle = Plot.serie(3);
        c2.lineWidth = 2.2;
        c2.beginPath();
        c2.arc(Xm, Y, 17, 0.6, Math.PI * 1.55, p.Mext < 0);
        c2.stroke();
        var ang = p.Mext > 0 ? Math.PI * 1.55 : 0.6;
        c2.beginPath();
        c2.arc(Xm + 17 * Math.cos(ang), Y + 17 * Math.sin(ang), 3.4, 0, Math.PI * 2);
        c2.fill();
        c2.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
        c2.textAlign = 'left'; c2.textBaseline = 'middle';
        c2.fillText('M = ' + p.Mext + ' kN·m', Xm + 22, Y - 16);
      }

      /* reações */
      c2.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c2.fillStyle = Plot.serie(0);
      c2.textAlign = 'center'; c2.textBaseline = 'top';
      r.reacoes.forEach(function (re) {
        c2.fillText(Plot.sig(re.R / 1000, 3) + ' kN', plot.px(re.x), Y + alt / 2 + 36);
      });

      /* cotas */
      c2.strokeStyle = faint; c2.fillStyle = faint; c2.lineWidth = 1;
      c2.setLineDash([3, 3]);
      c2.beginPath();
      c2.moveTo(X0, Y + alt / 2 + 54); c2.lineTo(X1, Y + alt / 2 + 54);
      c2.stroke();
      c2.setLineDash([]);
      c2.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c2.textAlign = 'center'; c2.textBaseline = 'top';
      c2.fillText('L = ' + L.toFixed(1) + ' m', (X0 + X1) / 2, Y + alt / 2 + 57);
    }

    /* ---------- fórmulas fechadas do caso corrente ---------- */
    function formulasCaso(p, sec, mat, r) {
      var L = p.L, EI = mat.E * sec.I;
      var itens = [];
      var temP = p.P !== 0, temQ = p.q > 0 && p.qx2 > p.qx1;
      var qTotal = temQ && p.qx1 < 0.001 && p.qx2 > 0.999;
      var Pcentro = temP && Math.abs(p.Px - 0.5) < 0.02;
      var Pponta = temP && p.Px > 0.98;

      function reg(f, d, valor) { itens.push({ f: f, d: d, v: valor, destaque: true }); }
      function conf(nome, teorico) {
        return nome + ' = ' + Plot.sig(teorico, 4);
      }

      var nomes = {
        'balanco': 'Em balanço (engastada-livre)',
        'biapoiada': 'Biapoiada',
        'engastada-apoiada': 'Engastada e apoiada',
        'biengastada': 'Biengastada'
      };
      itens.push({ g: 'Caso atual — ' + nomes[p.apoio] });

      var reconhecido = false;

      if (p.apoio === 'balanco' && Pponta && !temQ) {
        reconhecido = true;
        reg('V<sub>máx</sub> = P', 'constante ao longo de todo o vão', conf('V', Math.abs(p.P)) + ' kN');
        reg('M<sub>máx</sub> = P·L', 'no engaste', conf('M', Math.abs(p.P) * L) + ' kN·m');
        reg('δ<sub>máx</sub> = P·L³/(3·E·I)', 'na extremidade livre',
            conf('δ', Math.abs(p.P) * 1000 * Math.pow(L, 3) / (3 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'balanco' && temP && !temQ) {
        reconhecido = true;
        var a = p.Px * L;
        reg('V<sub>máx</sub> = P', 'no trecho entre o engaste e a carga', conf('V', Math.abs(p.P)) + ' kN');
        reg('M<sub>máx</sub> = P·a', 'no engaste, a = distância da carga', conf('M', Math.abs(p.P) * a) + ' kN·m');
        reg('δ<sub>máx</sub> = P·a²·(3L − a)/(6·E·I)', 'na extremidade livre',
            conf('δ', Math.abs(p.P) * 1000 * a * a * (3 * L - a) / (6 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'balanco' && qTotal && !temP) {
        reconhecido = true;
        reg('V<sub>máx</sub> = q·L', 'no engaste', conf('V', p.q * L) + ' kN');
        reg('M<sub>máx</sub> = q·L²/2', 'no engaste', conf('M', p.q * L * L / 2) + ' kN·m');
        reg('δ<sub>máx</sub> = q·L⁴/(8·E·I)', 'na extremidade livre',
            conf('δ', p.q * 1000 * Math.pow(L, 4) / (8 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'biapoiada' && Pcentro && !temQ) {
        reconhecido = true;
        reg('R<sub>A</sub> = R<sub>B</sub> = P/2', 'reações iguais', conf('R', Math.abs(p.P) / 2) + ' kN');
        reg('V<sub>máx</sub> = P/2', 'constante em cada metade', conf('V', Math.abs(p.P) / 2) + ' kN');
        reg('M<sub>máx</sub> = P·L/4', 'sob a carga', conf('M', Math.abs(p.P) * L / 4) + ' kN·m');
        reg('δ<sub>máx</sub> = P·L³/(48·E·I)', 'no meio do vão',
            conf('δ', Math.abs(p.P) * 1000 * Math.pow(L, 3) / (48 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'biapoiada' && temP && !temQ) {
        reconhecido = true;
        var aa = p.Px * L, bb = L - aa;
        reg('R<sub>A</sub> = P·b/L', 'apoio esquerdo', conf('R', Math.abs(p.P) * bb / L) + ' kN');
        reg('V<sub>máx</sub> = P·máx(a,b)/L', 'maior das duas reações',
            conf('V', Math.abs(p.P) * Math.max(aa, bb) / L) + ' kN');
        reg('M<sub>máx</sub> = P·a·b/L', 'sob a carga', conf('M', Math.abs(p.P) * aa * bb / L) + ' kN·m');
        reg('δ<sub>máx</sub> = P·b·(L²−b²)<sup>3/2</sup>/(9√3·L·E·I)', 'em x = √((L²−b²)/3) a partir de A',
            conf('δ', Math.abs(p.P) * 1000 * bb * Math.pow(L * L - bb * bb, 1.5) /
                 (9 * Math.sqrt(3) * L * EI) * 1000) + ' mm');
      } else if (p.apoio === 'biapoiada' && qTotal && !temP) {
        reconhecido = true;
        reg('R<sub>A</sub> = R<sub>B</sub> = q·L/2', 'reações iguais', conf('R', p.q * L / 2) + ' kN');
        reg('V<sub>máx</sub> = q·L/2', 'nos apoios', conf('V', p.q * L / 2) + ' kN');
        reg('M<sub>máx</sub> = q·L²/8', 'no meio do vão', conf('M', p.q * L * L / 8) + ' kN·m');
        reg('δ<sub>máx</sub> = 5·q·L⁴/(384·E·I)', 'no meio do vão',
            conf('δ', 5 * p.q * 1000 * Math.pow(L, 4) / (384 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'biengastada' && Pcentro && !temQ) {
        reconhecido = true;
        reg('R<sub>A</sub> = R<sub>B</sub> = P/2', '', conf('R', Math.abs(p.P) / 2) + ' kN');
        reg('V<sub>máx</sub> = P/2', '', conf('V', Math.abs(p.P) / 2) + ' kN');
        reg('M<sub>engaste</sub> = P·L/8', 'negativo nos dois engastes',
            conf('M', Math.abs(p.P) * L / 8) + ' kN·m');
        reg('M<sub>vão</sub> = P·L/8', 'positivo sob a carga', conf('M', Math.abs(p.P) * L / 8) + ' kN·m');
        reg('δ<sub>máx</sub> = P·L³/(192·E·I)', 'no meio do vão',
            conf('δ', Math.abs(p.P) * 1000 * Math.pow(L, 3) / (192 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'biengastada' && qTotal && !temP) {
        reconhecido = true;
        reg('R<sub>A</sub> = R<sub>B</sub> = q·L/2', '', conf('R', p.q * L / 2) + ' kN');
        reg('V<sub>máx</sub> = q·L/2', 'nos engastes', conf('V', p.q * L / 2) + ' kN');
        reg('M<sub>engaste</sub> = q·L²/12', 'negativo — é o maior em módulo',
            conf('M', p.q * L * L / 12) + ' kN·m');
        reg('M<sub>vão</sub> = q·L²/24', 'positivo, no meio', conf('M', p.q * L * L / 24) + ' kN·m');
        reg('δ<sub>máx</sub> = q·L⁴/(384·E·I)', 'no meio do vão — 5× menor que a biapoiada',
            conf('δ', p.q * 1000 * Math.pow(L, 4) / (384 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'engastada-apoiada' && qTotal && !temP) {
        reconhecido = true;
        reg('R<sub>apoio</sub> = 3·q·L/8', 'no rolete', conf('R', 3 * p.q * L / 8) + ' kN');
        reg('V<sub>máx</sub> = 5·q·L/8', 'no engaste', conf('V', 5 * p.q * L / 8) + ' kN');
        reg('M<sub>engaste</sub> = q·L²/8', 'negativo, valor máximo em módulo',
            conf('M', p.q * L * L / 8) + ' kN·m');
        reg('M<sub>vão</sub> = 9·q·L²/128', 'positivo, em x = 5L/8',
            conf('M', 9 * p.q * L * L / 128) + ' kN·m');
        reg('δ<sub>máx</sub> = q·L⁴/(185·E·I)', 'em x ≈ 0,4215·L a partir do engaste',
            conf('δ', p.q * 1000 * Math.pow(L, 4) / (185 * EI) * 1000) + ' mm');
      } else if (p.apoio === 'engastada-apoiada' && Pcentro && !temQ) {
        reconhecido = true;
        reg('R<sub>apoio</sub> = 5·P/16', 'no rolete', conf('R', 5 * Math.abs(p.P) / 16) + ' kN');
        reg('V<sub>máx</sub> = 11·P/16', 'no engaste', conf('V', 11 * Math.abs(p.P) / 16) + ' kN');
        reg('M<sub>engaste</sub> = 3·P·L/16', 'negativo', conf('M', 3 * Math.abs(p.P) * L / 16) + ' kN·m');
        reg('M<sub>vão</sub> = 5·P·L/32', 'positivo, sob a carga',
            conf('M', 5 * Math.abs(p.P) * L / 32) + ' kN·m');
        reg('δ<sub>máx</sub> = P·L³/(48√5·E·I)', 'em x = L/√5 do apoio',
            conf('δ', Math.abs(p.P) * 1000 * Math.pow(L, 3) / (48 * Math.sqrt(5) * EI) * 1000) + ' mm');
      }

      if (!reconhecido) {
        itens.push('Combinação de cargas fora dos casos tabelados — os diagramas ao lado vêm da solução por elementos finitos. Para ver a fórmula fechada, deixe apenas uma carga ativa (P ou q) e, no caso de P, posicione-a no meio do vão (0,50·L) ou na ponta.');
      } else {
        itens.push('Os valores à direita são a fórmula avaliada com os parâmetros atuais. Compare com as saídas numéricas: a diferença mede o erro do modelo de elementos finitos, que fica abaixo de 0,01 %.');
      }

      itens.push({ g: 'Relações gerais' });
      itens.push({ tex: '\\frac{\mathrm{d}V}{\mathrm{d}x} = - q(x)', d: 'a inclinação do cortante é a carga distribuída' });
      itens.push({ tex: '\\frac{\mathrm{d}M}{\mathrm{d}x} = V(x)', d: 'onde V cruza zero, M é máximo ou mínimo' });
      itens.push({ tex: 'E\\cdot I\\cdot \\frac{\mathrm{d}^{2}v}{\mathrm{d}x^{2}} = M(x)', d: 'equação da linha elástica' });

      itens.push({ g: 'Verificação da seção' });
      itens.push({ tex: '\\sigma = M_{\\text{máx}}\\cdot \\frac{c}{I} = \\frac{M_{\\text{máx}}}{W}', d: 'tensão normal na fibra extrema' });
      itens.push({ tex: 'W = \\frac{I}{c}', d: 'módulo de resistência elástico da seção',
                   v: Plot.sig(sec.I / sec.c * 1e6, 4) + ' cm³' });
      itens.push({ tex: 'n = \\frac{f_{y}}{\\sigma }', d: 'coeficiente de segurança ao escoamento por flexão' });
      itens.push({ tex: '\\delta \\le L/' + p.limFlecha, d: 'critério de rigidez em serviço (NBR 8800, anexo C)' });

      return itens;
    }

    /* ---------- resolucao passo a passo com os numeros atuais ---------- */
    function passosCaso(p, sec, mat, r) {
      var L = p.L, I = sec.I;
      var W = I / sec.c;
      var Mabs = Math.abs(r.extM.abs) / 1000;      /* kN.m */
      var Vabs = Math.abs(r.extV.abs) / 1000;      /* kN */
      var flecha = Math.abs(r.extD.abs) * 1000;    /* mm */
      var sigma = Math.abs(r.extM.abs) * sec.c / I / 1e6;
      var fy = mat.sy / 1e6;
      var n = fy / (sigma || 1e-9);
      var g = Plot.sig;
      var num = function (v, d) { return Number(v.toFixed(d === undefined ? 3 : d)).toString(); };
      var out = [];

      /* ---- cargas ativas, reduzidas a resultantes ---- */
      var cargas = [];
      if (p.P !== 0) {
        cargas.push({ F: p.P, x: p.Px * L, rot: 'P', desc: 'P = ' + p.P + ' kN em x = ' + num(p.Px * L) + ' m' });
      }
      var Lq = 0, xcq = 0;
      if (p.q > 0 && p.qx2 > p.qx1) {
        Lq = (p.qx2 - p.qx1) * L;
        xcq = (p.qx1 + p.qx2) / 2 * L;
        cargas.push({ F: p.q * Lq, x: xcq, rot: 'q·Lq',
          desc: 'q = ' + p.q + ' kN/m em ' + num(Lq) + ' m  →  resultante ' + num(p.q * Lq) +
                ' kN aplicada no centroide x = ' + num(xcq) + ' m' });
      }
      var Ftot = cargas.reduce(function (a, c) { return a + c.F; }, 0);

      var nomeApoio = { 'balanco': 'engastada-livre (balanço)', 'biapoiada': 'biapoiada',
        'engastada-apoiada': 'engastada e apoiada', 'biengastada': 'biengastada' }[p.apoio];
      var grauHip = { 'balanco': 0, 'biapoiada': 0, 'engastada-apoiada': 1, 'biengastada': 3 }[p.apoio];

      /* ================= 1. dados ================= */
      var linhasCarga = cargas.map(function (c) { return '  ' + c.desc; });
      if (p.Mext !== 0) linhasCarga.push('  M = ' + p.Mext + ' kN·m em x = ' + num(p.Mx * L) + ' m');
      if (!linhasCarga.length) linhasCarga.push('  nenhuma carga aplicada');

      out.push({
        t: 'Dados do problema',
        c: 'Vinculação: ' + nomeApoio + '\n' +
           'Vão:        L = ' + L + ' m\n' +
           'Cargas:\n' + linhasCarga.join('\n') + '\n' +
           'Seção:      ' + sec.nome + '\n' +
           'Material:   ' + mat.nome + '  (E = ' + (mat.E / 1e9) + ' GPa, fy = ' + fy + ' MPa)'
      });

      /* ================= 2. estaticidade ================= */
      var incog = { 'balanco': 2, 'biapoiada': 3, 'engastada-apoiada': 4, 'biengastada': 6 }[p.apoio];
      out.push({
        t: 'A estrutura é isostática?',
        c: 'reações incógnitas: ' + incog + '\n' +
           'equações de equilíbrio no plano: 3   (ΣFx = 0, ΣFy = 0, ΣM = 0)\n' +
           'grau de hiperestaticidade = ' + incog + ' − 3 = ' + grauHip,
        r: grauHip === 0 ? 'Isostática — dá para resolver só com equilíbrio'
                         : grauHip + '× hiperestática — o equilíbrio não basta',
        obs: grauHip === 0
          ? 'Os próximos passos são a conta que você faria à mão.'
          : 'Faltam ' + grauHip + ' equação(ões). É preciso usar compatibilidade de deslocamentos: no engaste a rotação e o deslocamento são nulos; no rolete o deslocamento é nulo. Aqui o solver resolve isso por elementos finitos.'
      });

      /* ================= 3. reações ================= */
      if (grauHip === 0 && p.apoio === 'biapoiada') {
        var somaM = cargas.map(function (c) {
          return num(c.F) + '·' + num(c.x);
        }).join(' + ') || '0';
        var valM = cargas.reduce(function (a, c) { return a + c.F * c.x; }, 0);
        if (p.Mext !== 0) { somaM += ' ' + (p.Mext > 0 ? '+ ' : '− ') + Math.abs(p.Mext); valM += p.Mext; }
        var RB = valM / L;
        var RA = Ftot - RB;
        out.push({
          t: 'Reações de apoio — ΣM = 0 e depois ΣFy = 0',
          c: 'Momento em torno do apoio A (x = 0):\n' +
             '  ΣM_A = 0  →  R_B·L = Σ Fᵢ·xᵢ\n' +
             '  R_B·' + num(L) + ' = ' + somaM + ' = ' + num(valM) + '\n' +
             '  R_B = ' + num(valM) + ' / ' + num(L) + '\n\n' +
             'Equilíbrio vertical:\n' +
             '  ΣFy = 0  →  R_A = ΣFᵢ − R_B\n' +
             '  R_A = ' + num(Ftot) + ' − ' + num(RB),
          r: 'R_A = ' + g(RA, 4) + ' kN      R_B = ' + g(RB, 4) + ' kN',
          obs: 'Confere com o solver: ' + r.reacoes.map(function (re) {
                 return 'R(x=' + num(re.x, 2) + ') = ' + g(re.R / 1000, 4) + ' kN'; }).join(' · ')
        });
      } else if (grauHip === 0 && p.apoio === 'balanco') {
        var somaMe = cargas.map(function (c) { return num(c.F) + '·' + num(c.x); }).join(' + ') || '0';
        var valMe = cargas.reduce(function (a, c) { return a + c.F * c.x; }, 0);
        out.push({
          t: 'Reações no engaste — ΣFy = 0 e ΣM = 0',
          c: 'Força vertical:\n' +
             '  ΣFy = 0  →  R = Σ Fᵢ = ' + (cargas.map(function (c) { return num(c.F); }).join(' + ') || '0') + '\n' +
             '  R = ' + num(Ftot) + ' kN\n\n' +
             'Momento no engaste (x = 0):\n' +
             '  ΣM = 0  →  M_r = Σ Fᵢ·xᵢ = ' + somaMe + '\n' +
             '  M_r = ' + num(valMe) + ' kN·m',
          r: 'R = ' + g(Ftot, 4) + ' kN      M_r = ' + g(valMe, 4) + ' kN·m',
          obs: 'No balanço as duas reações saem direto, sem sistema de equações — a extremidade livre não tem apoio.'
        });
      } else {
        out.push({
          t: 'Reações de apoio — por compatibilidade',
          c: 'Método: remove-se o(s) apoio(s) redundante(s), calcula-se a flecha nesse ponto\n' +
             'sob a carga real e sob a reação incógnita, e impõe-se deslocamento nulo:\n' +
             '  δ_carga + δ_R = 0   →   resolve R\n\n' +
             'Reações obtidas:\n' +
             r.reacoes.map(function (re) {
               return '  x = ' + num(re.x, 2) + ' m  →  R = ' + g(re.R / 1000, 4) + ' kN';
             }).join('\n'),
          r: 'Σ R = ' + g(r.reacoes.reduce(function (a, re) { return a + re.R; }, 0) / 1000, 4) +
             ' kN   (carga total aplicada = ' + g(Ftot, 4) + ' kN)',
          obs: 'A soma das reações verticais tem que fechar com a carga total — é a verificação de que o resultado está coerente. O restante do equilíbrio é fechado pelos momentos de engastamento.'
        });
      }

      /* ========== 3-bis. equações de V(x) e M(x) trecho a trecho ==========
         Os trechos são separados pelas descontinuidades: apoios, carga
         concentrada, início e fim da carga distribuída e momento aplicado.
         Dentro de cada trecho as funções são polinômios e podem ser
         escritas de uma vez. */
      (function () {
        var pontos = [0, L];
        r.reacoes.forEach(function (re) { pontos.push(re.x); });
        if (p.P !== 0) pontos.push(p.Px * L);
        if (Lq > 0) { pontos.push(p.qx1 * L); pontos.push(p.qx2 * L); }
        if (p.Mext !== 0) pontos.push(p.Mx * L);
        pontos = pontos.filter(function (v) { return v >= -1e-9 && v <= L + 1e-9; })
                       .sort(function (a2, b2) { return a2 - b2; });
        /* remove repetidos */
        var lim = [];
        pontos.forEach(function (v) {
          if (!lim.length || v - lim[lim.length - 1] > 1e-6) lim.push(v);
        });
        if (lim.length < 2) return;

        /* Zera resíduo numérico: 1e-8 kN·m é zero, não um valor. */
        function z(v) { return Math.abs(v) < 1e-6 ? 0 : v; }

        /* o solver devolve V e M amostrados; aqui basta interpolar */
        function amostra(vet, x) {
          var xs2 = r.x;
          if (x <= xs2[0]) return vet[0];
          if (x >= xs2[xs2.length - 1]) return vet[vet.length - 1];
          for (var i2 = 1; i2 < xs2.length; i2++) {
            if (xs2[i2] >= x) {
              var f = (x - xs2[i2 - 1]) / (xs2[i2] - xs2[i2 - 1]);
              return vet[i2 - 1] + (vet[i2] - vet[i2 - 1]) * f;
            }
          }
          return vet[vet.length - 1];
        }

        /* monta a expressão de V(x) e de M(x) válida no trecho que começa
           logo depois de xIni, somando o que ficou à esquerda */
        function equacoes(xIni) {
          var tv = [], tm = [];
          r.reacoes.forEach(function (re) {
            if (re.x <= xIni + 1e-9) {
              var R = re.R / 1000;
              if (Math.abs(R) < 1e-9) return;
              tv.push((R >= 0 ? '+ ' : '− ') + g(Math.abs(R), 4));
              tm.push((R >= 0 ? '+ ' : '− ') + g(Math.abs(R), 4) +
                      (re.x < 1e-9 ? '·x' : '·(x − ' + num(re.x, 3) + ')'));
            }
          });
          if (p.P !== 0 && p.Px * L <= xIni + 1e-9) {
            var xp = p.Px * L;
            tv.push((p.P >= 0 ? '− ' : '+ ') + num(Math.abs(p.P)));
            tm.push((p.P >= 0 ? '− ' : '+ ') + num(Math.abs(p.P)) +
                    (xp < 1e-9 ? '·x' : '·(x − ' + num(xp, 3) + ')'));
          }
          if (Lq > 0 && p.qx1 * L <= xIni + 1e-9) {
            var a1 = p.qx1 * L, a2 = p.qx2 * L;
            if (xIni < a2 - 1e-9) {
              /* ainda dentro do trecho carregado */
              tv.push('− ' + num(p.q) + '·(x − ' + num(a1, 3) + ')');
              tm.push('− ' + num(p.q / 2) + '·(x − ' + num(a1, 3) + ')²');
            } else {
              var Rq2 = p.q * (a2 - a1), xg2 = (a1 + a2) / 2;
              tv.push('− ' + g(Rq2, 4));
              tm.push('− ' + g(Rq2, 4) + '·(x − ' + num(xg2, 3) + ')');
            }
          }
          if (p.Mext !== 0 && p.Mx * L <= xIni + 1e-9) {
            tm.push((p.Mext >= 0 ? '+ ' : '− ') + num(Math.abs(p.Mext)));
          }
          return {
            V: tv.length ? tv.join(' ').replace(/^\+ /, '') : '0',
            M: tm.length ? tm.join(' ').replace(/^\+ /, '') : '0'
          };
        }

        var linhas = [];
        for (var t = 0; t < lim.length - 1; t++) {
          var xa = lim[t], xb = lim[t + 1];
          var xm = (xa + xb) / 2;
          var eq = equacoes(xm);
          /* V salta nas fronteiras do trecho: interpolar em cima delas
             misturaria os dois lados. Ajusta-se uma reta com dois pontos
             BEM dentro do trecho e extrapola-se para as extremidades — o
             que é exato, porque no trecho V é constante ou linear. */
          var dx = xb - xa;
          var q1 = amostra(r.V, xa + dx * 0.25) / 1000;
          var q2 = amostra(r.V, xa + dx * 0.75) / 1000;
          var Va = z(q1 + (q1 - q2) * 0.5);
          var Vb = z(q2 + (q2 - q1) * 0.5);
          var Ma = z(amostra(r.M, xa) / 1000), Mb = z(amostra(r.M, xb) / 1000);
          var grau = (Lq > 0 && p.qx1 * L <= xm && xm <= p.qx2 * L)
            ? 'V linear e M parabólico (há carga distribuída aqui)'
            : 'V constante e M linear (nenhuma carga distribuída neste trecho)';
          linhas.push(
            'TRECHO ' + (t + 1) + ':   ' + num(xa, 3) + ' m  ≤  x  ≤  ' + num(xb, 3) + ' m\n' +
            '  V(x) = ' + eq.V + '\n' +
            '  M(x) = ' + eq.M + '\n' +
            '  nos extremos:  V(' + num(xa, 3) + '⁺) = ' + g(Va, 4) + ' kN' +
            '   ·   V(' + num(xb, 3) + '⁻) = ' + g(Vb, 4) + ' kN\n' +
            '                 M(' + num(xa, 3) + ') = ' + g(Ma, 4) + ' kN·m' +
            '   ·   M(' + num(xb, 3) + ') = ' + g(Mb, 4) + ' kN·m\n' +
            '  ' + grau);
        }

        out.push({
          t: 'Equações de V(x) e M(x), trecho a trecho',
          c: 'Regra do corte: em cada trecho, some tudo que age À ESQUERDA da seção.\n' +
             'Reação para cima entra positiva em V; carga para baixo, negativa.\n' +
             'Para M, cada força entra multiplicada pelo seu braço até a seção.\n\n' +
             linhas.join('\n\n'),
          r: 'V máximo = ' + g(Math.abs(r.extV.abs) / 1000, 4) + ' kN   ·   ' +
             'M máximo = ' + g(Math.abs(r.extM.abs) / 1000, 4) + ' kN·m',
          obs: 'As duas relações que amarram tudo: dV/dx = −q e dM/dx = V. Por isso o momento ' +
               'é máximo onde o cortante cruza zero, e o cortante dá um SALTO igual à carga ' +
               'concentrada em cada ponto de aplicação. Onde não há carga distribuída, V é ' +
               'constante e M é uma reta; sob carga distribuída uniforme, V é reta e M é parábola.'
        });
      })();

      /* ================= 4. cortante ================= */
      var xv = r.extV.xabs;
      var termosV = [], valV = 0;
      r.reacoes.forEach(function (re) {
        if (re.x <= xv + 1e-9) { termosV.push('+ ' + g(re.R / 1000, 4)); valV += re.R / 1000; }
      });
      if (p.P !== 0 && p.Px * L <= xv + 1e-9) { termosV.push('− ' + num(Math.abs(p.P))); valV -= p.P; }
      if (Lq > 0) {
        var cob = Math.max(0, Math.min(xv, p.qx2 * L) - p.qx1 * L);
        if (cob > 1e-9) { termosV.push('− ' + p.q + '·' + num(cob)); valV -= p.q * cob; }
      }
      out.push({
        t: 'Esforço cortante — corte de seção',
        c: 'Corta-se a viga em x = ' + num(xv) + ' m e soma-se tudo que age no trecho À ESQUERDA:\n\n' +
           '  V(x) = Σ R(à esq.) − Σ P(à esq.) − ∫₀ˣ q dx\n' +
           '  V = ' + (termosV.join(' ') || '0') + '\n' +
           '  V = ' + num(valV) + ' kN',
        r: '|V|máx = ' + g(Vabs, 4) + ' kN   em x = ' + num(xv) + ' m',
        obs: 'Convenção: cortante positivo quando a resultante à esquerda aponta para cima. O diagrama salta exatamente sob cada carga concentrada, com salto igual ao valor da carga.'
      });

      /* ================= 5. momento ================= */
      var xm = r.extM.xabs;
      var termosM = [], valM2 = 0;
      r.reacoes.forEach(function (re) {
        if (re.x < xm - 1e-9) {
          termosM.push('+ ' + g(re.R / 1000, 4) + '·(' + num(xm) + '−' + num(re.x, 2) + ')');
          valM2 += re.R / 1000 * (xm - re.x);
        }
      });
      if (p.P !== 0 && p.Px * L < xm - 1e-9) {
        termosM.push('− ' + num(Math.abs(p.P)) + '·(' + num(xm) + '−' + num(p.Px * L) + ')');
        valM2 -= p.P * (xm - p.Px * L);
      }
      if (Lq > 0) {
        var cob2 = Math.max(0, Math.min(xm, p.qx2 * L) - p.qx1 * L);
        if (cob2 > 1e-9) {
          var braco = xm - (p.qx1 * L + cob2 / 2);
          termosM.push('− ' + p.q + '·' + num(cob2) + '·' + num(braco));
          valM2 -= p.q * cob2 * braco;
        }
      }
      var passoM = {
        t: 'Momento fletor — momentos no corte',
        c: 'Mesmo corte, agora somando MOMENTOS das forças à esquerda em relação à seção x = ' + num(xm) + ' m:\n\n' +
           '  M(x) = Σ R·(x − x_R) − Σ P·(x − x_P) − q·Lc·(x − x̄c)\n' +
           '  M = ' + (termosM.join(' ') || '0') + '\n' +
           '  M = ' + num(valM2) + ' kN·m',
        r: '|M|máx = ' + g(Mabs, 4) + ' kN·m   em x = ' + num(xm) + ' m'
      };
      if (grauHip > 0) {
        passoM.c = 'Como a estrutura é hiperestática, o corte só funciona DEPOIS de conhecer as reações\n' +
                   '(passo anterior). Com elas em mãos, a conta é a mesma:\n\n' + passoM.c;
      }
      passoM.obs = 'M é máximo ou mínimo exatamente onde V cruza o zero — é a consequência direta de dM/dx = V.';
      out.push(passoM);

      /* ================= 5b. fórmula pronta, quando existe ================= */
      var temP = p.P !== 0, temQ = Lq > 0, semM = p.Mext === 0;
      var qTotal = temQ && p.qx1 < 0.001 && p.qx2 > 0.999;
      var Pcentro = temP && Math.abs(p.Px - 0.5) < 0.02;
      var Pponta = temP && p.Px > 0.98;
      var pronta = null;
      if (semM) {
        if (p.apoio === 'biapoiada' && Pcentro && !temQ)
          pronta = { M: 'M_máx = P·L/4', vM: Math.abs(p.P) * L / 4, V: 'V_máx = P/2', vV: Math.abs(p.P) / 2 };
        else if (p.apoio === 'biapoiada' && qTotal && !temP)
          pronta = { M: 'M_máx = q·L²/8', vM: p.q * L * L / 8, V: 'V_máx = q·L/2', vV: p.q * L / 2 };
        else if (p.apoio === 'balanco' && Pponta && !temQ)
          pronta = { M: 'M_máx = P·L', vM: Math.abs(p.P) * L, V: 'V_máx = P', vV: Math.abs(p.P) };
        else if (p.apoio === 'balanco' && qTotal && !temP)
          pronta = { M: 'M_máx = q·L²/2', vM: p.q * L * L / 2, V: 'V_máx = q·L', vV: p.q * L };
        else if (p.apoio === 'biengastada' && qTotal && !temP)
          pronta = { M: 'M_engaste = q·L²/12', vM: p.q * L * L / 12, V: 'V_máx = q·L/2', vV: p.q * L / 2 };
        else if (p.apoio === 'biengastada' && Pcentro && !temQ)
          pronta = { M: 'M_engaste = P·L/8', vM: Math.abs(p.P) * L / 8, V: 'V_máx = P/2', vV: Math.abs(p.P) / 2 };
        else if (p.apoio === 'engastada-apoiada' && qTotal && !temP)
          pronta = { M: 'M_engaste = q·L²/8', vM: p.q * L * L / 8, V: 'V_máx = 5·q·L/8', vV: 5 * p.q * L / 8 };
        else if (p.apoio === 'engastada-apoiada' && Pcentro && !temQ)
          pronta = { M: 'M_engaste = 3·P·L/16', vM: 3 * Math.abs(p.P) * L / 16, V: 'V_máx = 11·P/16', vV: 11 * Math.abs(p.P) / 16 };
      }
      if (pronta) {
        var errM = Math.abs(pronta.vM - Mabs) / (Mabs || 1) * 100;
        out.push({
          t: 'Atalho: este caso tem fórmula pronta',
          c: '  ' + pronta.V + ' = ' + g(pronta.vV, 4) + ' kN\n' +
             '  ' + pronta.M + ' = ' + g(pronta.vM, 4) + ' kN·m',
          r: 'Bate com o corte de seção (diferença de ' + errM.toFixed(3) + ' %)',
          obs: 'Em prova, use a fórmula tabelada quando o caso for exatamente um dos padrões. O corte de seção acima é o que fundamenta a fórmula — e é o único caminho quando o carregamento foge do padrão.'
        });
      } else {
        out.push({
          t: 'Este caso NÃO tem fórmula pronta',
          c: 'A combinação de vinculação e carregamento escolhida não é um dos casos tabelados.',
          r: 'Só o corte de seção (ou o método numérico) resolve',
          obs: 'Para cair num caso tabelado: deixe uma única carga ativa, com q cobrindo o vão inteiro (0 a 1·L) ou P no meio do vão (0,50·L) ou na ponta.'
        });
      }

      /* ================= 6. seção ================= */
      out.push({
        t: 'Propriedades da seção',
        c: 'I = ' + g(I * 1e8, 4) + ' cm⁴\n' +
           'c = ' + g(sec.c * 1000, 4) + ' mm   (distância da linha neutra à fibra extrema)\n' +
           'W = I/c = ' + g(I * 1e8, 4) + ' cm⁴ / ' + g(sec.c * 100, 4) + ' cm',
        r: 'W = ' + g(W * 1e6, 4) + ' cm³'
      });

      /* ================= 7. tensão ================= */
      out.push({
        t: 'Tensão normal de flexão',
        c: 'σ = M·c/I = M/W\n' +
           'σ = ' + g(Mabs * 1e6, 4) + ' N·mm / ' + g(W * 1e9, 4) + ' mm³',
        r: 'σ = ' + g(sigma, 4) + ' MPa',
        obs: 'Na fibra extrema da seção de momento máximo. Tração de um lado da linha neutra, compressão do outro.'
      });

      /* ================= 8. regime e resistência ================= */
      var regime = sigma > fy ? 'PLÁSTICO — a seção escoou'
                 : sigma > 0.9 * fy ? 'elástico, mas a menos de 10 % do escoamento'
                 : 'ELÁSTICO — todas as fórmulas usadas são válidas';
      out.push({
        t: 'Regime de trabalho e coeficiente de segurança',
        c: 'σ = ' + g(sigma, 4) + ' MPa   versus   fy = ' + g(fy, 4) + ' MPa\n' +
           'n = fy/σ = ' + g(fy, 4) + ' / ' + g(sigma, 4),
        r: 'n = ' + g(n, 3) + '   →   ' + regime,
        obs: sigma > fy
          ? 'ATENÇÃO: acima do escoamento, σ = M·c/I deixa de valer (a distribuição de tensão não é mais linear) e a flecha calculada está subestimada. Aumente a seção ou reduza a carga.'
          : 'Verifica apenas escoamento por flexão. Não cobre cisalhamento na alma, flambagem lateral com torção, instabilidade local nem fadiga.'
      });

      /* ================= 9. flecha ================= */
      var lim = L * 1000 / p.limFlecha;
      out.push({
        t: 'Verificação de rigidez (estado limite de serviço)',
        c: 'δ_calculada = ' + g(flecha, 4) + ' mm\n' +
           'δ_limite = L/' + p.limFlecha + ' = ' + (L * 1000) + ' mm / ' + p.limFlecha + ' = ' + g(lim, 4) + ' mm',
        r: flecha <= lim ? 'δ ≤ δ_limite  →  APROVADA' : 'δ > δ_limite  →  REPROVADA por flecha',
        obs: 'A flecha cresce com L⁴: dobrar o vão multiplica por 16. Em vãos longos este critério costuma governar antes da resistência — uma viga pode ter n = 3 e mesmo assim ser reprovada aqui.'
      });

      return out;
    }

    Sim.build('#sim-viga', {
      titulo: 'Viga — cortante, momento fletor e linha elástica',
      descricao: 'Escolha a vinculação, o carregamento e a seção. A solução é por elementos finitos, então vale também para os casos hiperestáticos (biengastada e engastada-apoiada). As fórmulas fechadas do caso aparecem no painel abaixo.',
      controlesLargos: true,
      controles: [
        { tipo: 'titulo', label: 'Vinculação e vão' },
        { id: 'apoio', tipo: 'select', label: 'Vinculação', valor: 'biapoiada',
          opcoes: [
            { v: 'biapoiada', t: 'Biapoiada (pino + rolete)' },
            { v: 'balanco', t: 'Em balanço (engastada-livre)' },
            { v: 'engastada-apoiada', t: 'Engastada e apoiada' },
            { v: 'biengastada', t: 'Biengastada' }
          ],
          desc: 'Os dois últimos são hiperestáticos — não saem só por equilíbrio.' },
        { id: 'L', label: 'Vão L', min: 1, max: 12, step: 0.5, valor: 6, unidade: 'm' },

        { tipo: 'titulo', label: '① Carga concentrada P' },
        { id: 'P', label: 'Intensidade P', min: -80, max: 80, step: 1, valor: 20, unidade: 'kN',
          desc: 'Positiva para baixo. Zere para desligar esta carga.' },
        { id: 'Px', label: 'Posição da carga', min: 0, max: 1, step: 0.01, valor: 0.5, unidade: '·L' },

        { tipo: 'titulo', label: '② Carga distribuída q' },
        { id: 'q', label: 'Intensidade q', min: 0, max: 40, step: 0.5, valor: 0, unidade: 'kN/m',
          desc: 'Zero = desligada. Aumente para ver a parábola no momento fletor.' },
        { id: 'qx1', label: 'Início do trecho', min: 0, max: 1, step: 0.01, valor: 0, unidade: '·L' },
        { id: 'qx2', label: 'Fim do trecho', min: 0, max: 1, step: 0.01, valor: 1, unidade: '·L' },

        { tipo: 'titulo', label: '③ Momento aplicado' },
        { id: 'Mext', label: 'Momento M', min: -60, max: 60, step: 1, valor: 0, unidade: 'kN·m' },
        { id: 'Mx', label: 'Posição', min: 0, max: 1, step: 0.01, valor: 0.5, unidade: '·L' },

        { tipo: 'separador' },
        { tipo: 'titulo', label: 'Seção e material — base do coef. de segurança' },
        { id: 'secao', tipo: 'select', label: 'Seção transversal', valor: 'w200x22',
          opcoes: ORDEM_SEC.map(function (k) { return { v: k, t: SECOES[k].nome }; }),
          desc: 'Perfis W com I de catálogo; demais seções calculadas pela geometria.' },
        { id: 'mat', tipo: 'select', label: 'Material', valor: 'a36',
          opcoes: Object.keys(MATS).map(function (k) { return { v: k, t: MATS[k].nome }; }),
          desc: 'Define E (rigidez, entra na flecha) e fy (resistência, entra no coef. de segurança).' },
        { id: 'limFlecha', tipo: 'select', label: 'Limite de flecha', valor: 250,
          opcoes: Object.keys(LIM_FLECHA).map(function (k) { return { v: LIM_FLECHA[k], t: k }; }),
          desc: 'Critério de serviço: L/250 é o usual para vigas de piso.' }
      ],
      graficos: [
        { id: 'esq', axes: false, height: 210, legend: false, grid: false },
        { id: 'v', titulo: 'Esforço cortante V(x)', ylabel: 'V (kN)', aspect: 0.24, legend: false },
        { id: 'm', titulo: 'Momento fletor M(x)', ylabel: 'M (kN·m)', aspect: 0.24, legend: false },
        { id: 'd', titulo: 'Linha elástica (deflexão)', xlabel: 'Posição x (m)', ylabel: 'v (mm)', aspect: 0.24, legend: false }
      ],
      saidas: [
        { id: 'Vmax', label: '|V| máximo' },
        { id: 'Mmax', label: '|M| máximo' },
        { id: 'dmax', label: 'Flecha máxima' },
        { id: 'W', label: 'Módulo W da seção' },
        { id: 'sigma', label: 'σ = M/W' },
        { id: 'fy', label: 'fy do material' },
        { id: 'fs', label: 'n = fy/σ' },
        { id: 'regime', label: 'Regime' },
        { id: 'razao', label: 'Flecha (limite ' + 'L/250' + ')' }
      ],
      exemplos: [
        { nome: '1 · Biapoiada com carga central',
          desc: 'Caso mais básico: M = PL/4 e δ = PL³/48EI',
          valores: { apoio: 'biapoiada', L: 6, P: 20, Px: 0.5, q: 0, qx1: 0, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w200x22', mat: 'a36', limFlecha: 250 } },
        { nome: '2 · Biapoiada com carga uniforme',
          desc: 'M = qL²/8 e δ = 5qL⁴/384EI — a viga de piso',
          valores: { apoio: 'biapoiada', L: 6, P: 0, Px: 0.5, q: 15, qx1: 0, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w310x28', mat: 'a36', limFlecha: 250 } },
        { nome: '3 · Balanço com carga na ponta',
          desc: 'M = PL no engaste e δ = PL³/3EI — marquise, mão-francesa',
          valores: { apoio: 'balanco', L: 2.5, P: 15, Px: 1, q: 0, qx1: 0, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w200x22', mat: 'a36', limFlecha: 180 } },
        { nome: '4 · Biengastada com carga uniforme',
          desc: 'Compare com o exemplo 2: mesmo q, momento menor e 1/5 da flecha',
          valores: { apoio: 'biengastada', L: 6, P: 0, Px: 0.5, q: 15, qx1: 0, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w310x28', mat: 'a36', limFlecha: 250 } },
        { nome: '5 · Engastada-apoiada (hiperestática)',
          desc: 'R no rolete = 3qL/8 e M no engaste = qL²/8',
          valores: { apoio: 'engastada-apoiada', L: 4, P: 0, Px: 0.5, q: 10, qx1: 0, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w250x25', mat: 'a36', limFlecha: 250 } },
        { nome: '6 · Seção subdimensionada (falha)',
          desc: 'Vão maior num perfil pequeno: n < 1 e flecha reprovada',
          valores: { apoio: 'biapoiada', L: 8, P: 0, Px: 0.5, q: 15, qx1: 0, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w150x13', mat: 'a36', limFlecha: 250 } },
        { nome: '7 · Carga parcial + concentrada',
          desc: 'Combinação fora das tabelas — só o método numérico resolve',
          valores: { apoio: 'biapoiada', L: 8, P: 30, Px: 0.25, q: 12, qx1: 0.4, qx2: 1,
                     Mext: 0, Mx: 0.5, secao: 'w310x38', mat: 'a572', limFlecha: 250 } }
      ],
      exemplosTitulo: 'Exemplos resolvidos',
      exemplosNota: 'Clique para carregar o caso. A resolução passo a passo aparece no fim do simulador.',
      formulas: [],
      passos: [],
      passosTitulo: 'Resolução passo a passo (com os valores atuais)',
      passosAbertos: false,
      formulasTitulo: 'Fórmulas — caso atual e verificação',
      nota: 'Euler-Bernoulli, material elástico linear, pequenas deflexões e seção constante. O <strong>coeficiente de segurança é n = f<sub>y</sub>/σ</strong>, com σ = M<sub>máx</sub>·c/I calculado na seção e no material escolhidos acima — é verificação de <em>escoamento por flexão</em> apenas. Não inclui cisalhamento, flambagem lateral com torção, instabilidade local da alma nem fadiga.',
      calcular: function (p, ctx) {
        var sec = SECOES[p.secao], mat = MATS[p.mat];
        var EI = mat.E * sec.I;

        var r = resolverViga({
          L: p.L, EI: EI, apoio: p.apoio, nel: 240,
          P: p.P ? { x: p.Px * p.L, valor: p.P * 1000 } : null,
          q: (p.q && p.qx2 > p.qx1) ? { x1: p.qx1 * p.L, x2: p.qx2 * p.L, valor: p.q * 1000 } : null,
          M0: p.Mext ? { x: p.Mx * p.L, valor: p.Mext * 1000 } : null
        });

        var xs = r.x;
        var Vk = r.V.map(function (v) { return v / 1000; });
        var Mk = r.M.map(function (m) { return m / 1000; });
        var dm = r.defl.map(function (d) { return d * 1000; });

        /* esquema estrutural */
        var pe = ctx.plot('esq');
        pe.clear();
        pe.setLimits([-p.L * 0.06, p.L * 1.06], [-1, 1]);
        pe.custom(function (c2, plot) { desenharEsquema(c2, plot, p, r); });
        pe.draw();

        /* cortante */
        var pv = ctx.plot('v');
        pv.clear();
        pv.setLimits([0, p.L], null);
        pv.area(xs, Vk, { base: 0, color: Plot.serie(0), alpha: 0.20 });
        pv.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        pv.marker(r.extV.xabs, r.extV.abs / 1000, Plot.sig(r.extV.abs / 1000, 4) + ' kN',
          { color: Plot.serie(0) });
        pv.draw();

        /* momento */
        var pm = ctx.plot('m');
        pm.clear();
        pm.setLimits([0, p.L], null);
        pm.area(xs, Mk, { base: 0, color: Plot.serie(1), alpha: 0.20 });
        pm.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        pm.marker(r.extM.xabs, r.extM.abs / 1000, Plot.sig(r.extM.abs / 1000, 4) + ' kN·m',
          { color: Plot.serie(1) });
        for (var i = 1; i < Mk.length; i++) {
          if (Mk[i - 1] * Mk[i] < 0) {
            var den = Math.abs(Mk[i - 1]) + Math.abs(Mk[i]);
            var xz = xs[i - 1] + (xs[i] - xs[i - 1]) * Math.abs(Mk[i - 1]) / (den || 1);
            pm.vline(xz, { color: Plot.cssVar('--text-faint', '#888'), dash: [3, 3], width: 1,
                           text: 'inflexão' });
          }
        }
        pm.draw();

        /* linha elástica */
        var pd = ctx.plot('d');
        pd.clear();
        pd.setLimits([0, p.L], null);
        pd.area(xs, dm, { base: 0, color: Plot.serie(4), alpha: 0.14 });
        pd.line(xs, dm, { color: Plot.serie(4), width: 2.6 });
        pd.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [4, 4], width: 1.2 });
        pd.marker(r.extD.xabs, r.extD.abs * 1000, Plot.sig(Math.abs(r.extD.abs) * 1000, 4) + ' mm',
          { color: Plot.serie(4) });
        var lim = p.L * 1000 / p.limFlecha;
        if (Math.abs(r.extD.abs) * 1000 > lim * 0.35) {
          pd.hline(-lim, { color: Plot.serie(6), dash: [6, 4], width: 1.4,
                           text: 'limite L/' + p.limFlecha });
        }
        pd.draw();

        /* resultados */
        var Mabs = Math.abs(r.extM.abs);
        var W = sec.I / sec.c;
        var sigma = Mabs * sec.c / sec.I / 1e6;
        var fy = mat.sy / 1e6;
        var n = fy / (sigma || 1e-9);
        var flecha = Math.abs(r.extD.abs) * 1000;
        var razao = flecha > 1e-9 ? p.L * 1000 / flecha : Infinity;

        /* painel de fórmulas do caso */
        ctx.setFormulas(formulasCaso(p, sec, mat, r));
        ctx.setPassos(passosCaso(p, sec, mat, r));

        return {
          Vmax: { v: Math.abs(r.extV.abs) / 1000, u: 'kN' },
          Mmax: { v: Mabs / 1000, u: 'kN·m', classe: 'destaque' },
          dmax: { v: flecha, u: 'mm' },
          W: { v: W * 1e6, u: 'cm³' },
          sigma: { v: sigma, u: 'MPa', classe: sigma > fy ? 'alerta' : '' },
          fy: { v: fy, u: 'MPa' },
          fs: { v: n, u: '', classe: n < 1 ? 'alerta' : n >= 1.67 ? 'ok' : '' },
          regime: { v: sigma > fy ? 'Plástico' : sigma > 0.9 * fy ? 'Elástico (no limite)' : 'Elástico',
                    u: '', classe: sigma > fy ? 'alerta' : sigma > 0.9 * fy ? '' : 'ok' },
          razao: { v: isFinite(razao) ? 'L/' + Plot.sig(razao, 3) : '—', u: '',
                   classe: razao < p.limFlecha ? 'alerta' : 'ok' }
        };
      }
    });
  })();


  /* ============================================================
     2. Ensaio de tração — curva tensão x deformação
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-tensao')) return;

    /* modelo Ramberg-Osgood até a estricção + queda pós-carga máxima */
    var MATERIAIS = {
      aco1020: { nome: 'Aço 1020 laminado', E: 205e3, sy: 295, su: 395, ef: 0.36, n: 0.22, patamar: true },
      aco4340: { nome: 'Aço 4340 temperado', E: 205e3, sy: 1100, su: 1250, ef: 0.12, n: 0.10, patamar: false },
      alu6061: { nome: 'Alumínio 6061-T6', E: 69e3, sy: 275, su: 310, ef: 0.15, n: 0.09, patamar: false },
      cobre:   { nome: 'Cobre recozido', E: 110e3, sy: 70, su: 220, ef: 0.45, n: 0.35, patamar: false },
      ffc:     { nome: 'Ferro fundido cinzento', E: 100e3, sy: 170, su: 200, ef: 0.008, n: 0.05, patamar: false }
    };

    Sim.build('#sim-tensao', {
      titulo: 'Ensaio de tração — curva tensão × deformação',
      descricao: 'Compare materiais e leia na curva o que cada propriedade significa: rigidez, escoamento, encruamento, resiliência e tenacidade.',
      controles: [
        { id: 'mat', tipo: 'select', label: 'Material', valor: 'aco1020',
          opcoes: Object.keys(MATERIAIS).map(function (k) { return { v: k, t: MATERIAIS[k].nome }; }) },
        { id: 'eps', label: 'Deformação aplicada ε', min: 0, max: 100, step: 0.5, valor: 30, unidade: '% da faixa',
          desc: 'Ponto de leitura sobre a curva. Como a faixa elástica é minúscula perto da ruptura (0,14 % contra 36 % no aço 1020), ligue "Ampliar região elástica" abaixo para o slider varrer só o começo da curva e conseguir parar no regime elástico.' },
        { tipo: 'separador' },
        { id: 'comparar', tipo: 'check', label: 'Sobrepor todos os materiais', valor: false },
        { id: 'descarga', tipo: 'check', label: 'Mostrar descarga elástica', valor: true,
          desc: 'A reta de descarga tem a mesma inclinação E — é ela que separa deformação elástica de plástica.' },
        { id: 'resil', tipo: 'check', label: 'Sombrear resiliência e tenacidade', valor: true },
        { id: 'zoom', tipo: 'check', label: 'Ampliar região elástica', valor: false,
          desc: 'Reescala o gráfico E o slider para o início da curva — é a única forma de parar no regime elástico.' }
      ],
      graficos: [
        { id: 'curva', xlabel: 'Deformação de engenharia ε (mm/mm)', ylabel: 'Tensão σ (MPa)',
          aspect: 0.52, legendPos: 'bottomright' }
      ],
      saidas: [
        { id: 'E', label: 'Módulo E' },
        { id: 'sy', label: 'Escoamento' },
        { id: 'su', label: 'Limite de resistência' },
        { id: 'sig', label: 'σ no ponto' },
        { id: 'regime', label: 'Regime' },
        { id: 'plast', label: 'Deform. plástica' },
        { id: 'Ur', label: 'Resiliência' }
      ],
      formulas: [
        { g: 'Grandezas de engenharia' },
        { tex: '\\sigma =\\frac{F}{A_{0}}', d: 'tensão de engenharia — sempre com a área INICIAL', destaque: true },
        { tex: '\\varepsilon =\\frac{\\Delta L}{L_{0}}', d: 'deformação de engenharia, adimensional', destaque: true },
        { tex: '\\sigma = E \\cdot \\varepsilon', d: 'Lei de Hooke — só vale no trecho reto inicial' },
        { tex: 'E =\\frac{\\Delta \\sigma }{\\Delta \\varepsilon }', d: 'módulo de elasticidade: a inclinação da reta' },

        { g: 'Propriedades lidas na curva' },
        { tex: '\\sigma_{e} (\\text{offset} 0,2 %)', d: 'reta paralela ao trecho elástico a partir de ε = 0,002' },
        { tex: '\\sigma_{u} =\\frac{F_{\\text{máx}}}{A_{0}}', d: 'limite de resistência — o pico da curva' },
        { tex: 'U_{r} =\\frac{\\sigma_{e}^{2}}{2E}', d: 'módulo de resiliência: área elástica, em MJ/m³' },
        { tex: 'U_{t} = \\int_{0}^\\varepsilon f \\sigma d\\varepsilon', d: 'tenacidade: área total sob a curva até a ruptura' },
        { tex: 'AL% = \\frac{L_{f} - L_{0}}{L_{0}} \\times 100', d: 'alongamento percentual — mede ductilidade' },
        { tex: 'RA% = \\frac{A_{0} - A_{f}}{A_{0}} \\times 100', d: 'redução de área na fratura' },

        { g: 'Tensão e deformação verdadeiras' },
        { tex: '\\sigma_{v} =\\frac{F}{A_{\\text{real}}}= \\sigma (1 + \\varepsilon )', d: 'continua crescendo mesmo depois de σᵤ' },
        { tex: '\\varepsilon_{v} = \\ln (1 + \\varepsilon )', d: 'válida até o início da estricção' },
        { tex: '\\sigma_{v} = K \\cdot \\varepsilon_{v} ^{n}', d: 'lei de encruamento (Hollomon); n = expoente de encruamento' },

        { g: 'Constantes elásticas' },
        { tex: '\\nu = -\\frac{\\varepsilon_{\\text{lateral}}}{\\varepsilon_{\\text{longitudinal}}}', d: 'coeficiente de Poisson; metais: 0,25 a 0,35' },
        { tex: 'G =\\frac{E}{2(1 + \\nu )}', d: 'módulo de cisalhamento' },
        { tex: 'K =\\frac{E}{3(1 - 2\\nu )}', d: 'módulo volumétrico' },

        { g: 'Descarga e deformação permanente' },
        { tex: '\\varepsilon_{\\text{plástica}} = \\varepsilon_{\\text{total}} - \\frac{\\sigma }{E}', d: 'a reta de descarga tem a mesma inclinação E' }
      ],
      formulasTitulo: 'Fórmulas — ensaio de tração',
      passos: [],
      passosTitulo: 'Como se lê a curva neste ponto',
      passosAbertos: false,
      nota: 'O campo <strong>Regime</strong> diz onde o ponto de leitura caiu: elástico (recupera tudo ao descarregar), escoamento, encruamento plástico, estricção ou rompido. Curva de engenharia (área inicial A₀). O trecho descendente após σu é a estricção — a tensão verdadeira continua subindo. Valores típicos de referência, não substituem o ensaio.',
      calcular: function (p, ctx) {
        var m = MATERIAIS[p.mat];

        function curva(mm) {
          var ey = mm.sy / mm.E;
          var eu = mm.ef * 0.62;                     /* deformação na carga máxima */
          var xs = [], ys = [];
          var i, e;
          /* trecho elástico */
          for (i = 0; i <= 20; i++) {
            e = ey * i / 20;
            xs.push(e); ys.push(mm.E * e);
          }
          /* patamar de escoamento (aço doce) */
          if (mm.patamar) {
            for (i = 1; i <= 10; i++) {
              e = ey + (0.018 - ey) * i / 10;
              xs.push(e); ys.push(mm.sy * (1 + 0.004 * Math.sin(i * 1.7)));
            }
          }
          /* encruamento até σu */
          var e0 = xs[xs.length - 1], s0 = ys[ys.length - 1];
          for (i = 1; i <= 60; i++) {
            e = e0 + (eu - e0) * i / 60;
            var t = (e - e0) / (eu - e0);
            xs.push(e);
            ys.push(s0 + (mm.su - s0) * Math.pow(t, mm.n / 0.35 * 0.55 + 0.35));
          }
          /* estricção: queda até a ruptura */
          for (i = 1; i <= 25; i++) {
            e = eu + (mm.ef - eu) * i / 25;
            var t2 = i / 25;
            xs.push(e);
            ys.push(mm.su * (1 - 0.16 * t2 * t2));
          }
          return { xs: xs, ys: ys, ey: ey, eu: eu };
        }

        var c = curva(m);
        var pl = ctx.plot('curva');
        pl.clear();

        /* Ampliando a regiao elastica, a deformacao util cai para menos de
           0,4 %: em unidade adimensional o eixo viraria 0,001 · 0,002. Passa
           entao a milesimos (por mil = mm/m) e tudo que e desenhado usa o
           mesmo fator kx. */
        var kx = p.zoom ? 1000 : 1;
        pl.o.xlabel = p.zoom ? 'Deformação ε (‰ = mm por metro)'
                             : 'Deformação ε (adimensional)';
        function ex(v) { return v * kx; }
        function exs(v) { return v.map(ex); }
        if (p.zoom) pl.setLimits([0, c.ey * 3 * kx], [0, m.sy * 1.35]);
        else pl.setLimits([0, m.ef * 1.06], null);

        if (p.comparar) {
          Object.keys(MATERIAIS).forEach(function (k, i) {
            var cc = curva(MATERIAIS[k]);
            pl.line(exs(cc.xs), cc.ys, {
              color: Plot.serie(i), width: k === p.mat ? 2.8 : 1.4,
              label: MATERIAIS[k].nome.split(' ')[0] + (k === p.mat ? ' ◂' : '')
            });
          });
          pl.setLimits(null, null);
        } else {
          /* áreas de resiliência e tenacidade */
          if (p.resil && !p.zoom) {
            pl.area(exs(c.xs), c.ys, { base: 0, color: Plot.serie(2), alpha: 0.10, stroke: false, label: 'Tenacidade (área total)' });
            var xe = [], ye = [];
            for (var i = 0; i < c.xs.length && c.xs[i] <= c.ey; i++) { xe.push(ex(c.xs[i])); ye.push(c.ys[i]); }
            xe.push(ex(c.ey)); ye.push(m.sy);
            pl.area(xe, ye, { base: 0, color: Plot.serie(0), alpha: 0.35, stroke: false, label: 'Resiliência (área elástica)' });
          }
          pl.line(exs(c.xs), c.ys, { color: Plot.serie(0), width: 2.6, label: m.nome });

          /* marcos */
          pl.hline(m.sy, { color: Plot.serie(3), dash: [5, 4], width: 1.2, text: 'σe = ' + m.sy + ' MPa' });
          pl.hline(m.su, { color: Plot.serie(1), dash: [5, 4], width: 1.2, text: 'σu = ' + m.su + ' MPa' });
        }

        /* ponto de leitura */
        /* com o zoom ligado, o slider varre so a regiao elastica/escoamento,
           que e onde o regime muda — sem isso a faixa elastica e inalcancavel */
        var eEscala = p.zoom ? c.ey * 3 : m.ef;
        var eLido = eEscala * p.eps / 100;
        var sLido = 0, k;
        for (k = 1; k < c.xs.length; k++) {
          if (c.xs[k] >= eLido) {
            var t = (eLido - c.xs[k - 1]) / (c.xs[k] - c.xs[k - 1] || 1);
            sLido = c.ys[k - 1] + t * (c.ys[k] - c.ys[k - 1]);
            break;
          }
        }
        if (!sLido) sLido = c.ys[c.ys.length - 1];

        /* ---- em que regime esta o ponto de leitura? ---- */
        var fimPatamar = m.patamar ? 0.018 : c.ey;
        var reg, regCls, regDesc;
        if (eLido <= c.ey * 1.001) {
          reg = 'Elástico'; regCls = 'ok';
          regDesc = 'σ = E·ε vale; ao descarregar a peça volta ao comprimento original.';
        } else if (m.patamar && eLido <= fimPatamar) {
          reg = 'Escoamento'; regCls = '';
          regDesc = 'patamar de escoamento: a deformação cresce sem aumento de tensão.';
        } else if (eLido <= c.eu) {
          reg = 'Plástico (encruamento)'; regCls = '';
          regDesc = 'deformação permanente; o material encrua e a tensão volta a subir.';
        } else if (eLido < m.ef * 0.999) {
          reg = 'Estricção'; regCls = 'alerta';
          regDesc = 'deformação localizada no pescoço; a curva de engenharia cai, a verdadeira sobe.';
        } else {
          reg = 'Rompido'; regCls = 'alerta';
          regDesc = 'a deformação aplicada atingiu o alongamento de ruptura.';
        }

        /* sombreia a faixa elastica e marca as fronteiras */
        if (!p.comparar) {
          pl.vline(ex(c.ey), { color: Plot.serie(0), dash: [4, 3], width: 1.2,
            text: 'fim do elástico: ε = ' + Plot.sig(ex(c.ey), 3) + (p.zoom ? ' ‰' : '') });
          if (!p.zoom || ex(c.eu) < c.ey * 3 * kx) {
            pl.vline(ex(c.eu), { color: Plot.serie(1), dash: [4, 3], width: 1.2, text: 'início da estricção' });
          }
        }

        pl.marker(ex(eLido), sLido, reg + '  ·  ' + Plot.sig(sLido, 4) + ' MPa',
          { color: regCls === 'ok' ? Plot.serie(2) : regCls === 'alerta' ? Plot.serie(6) : Plot.serie(1),
            align: eLido > m.ef * 0.6 ? 'right' : 'left',
            dx: eLido > m.ef * 0.6 ? -8 : 8 });

        var ePlast = Math.max(0, eLido - sLido / m.E);
        if (p.descarga && ePlast > 1e-6 && !p.comparar) {
          pl.line([ex(ePlast), ex(eLido)], [0, sLido], {
            color: Plot.serie(6), dash: [5, 4], width: 1.6, label: 'descarga (inclinação E)'
          });
        }

        pl.draw();

        var sg = Plot.sig;
        ctx.setPassos([
          { t: 'Material e propriedades de catálogo',
            c: m.nome + '\n' +
               'E  = ' + m.E / 1000 + ' GPa   (inclinação do trecho reto)\n' +
               'σe = ' + m.sy + ' MPa   (limite de escoamento)\n' +
               'σu = ' + m.su + ' MPa   (limite de resistência)\n' +
               'εf = ' + sg(m.ef * 100, 3) + ' %    (alongamento na ruptura)' },
          { t: 'Deformação elástica limite',
            tex: '\\varepsilon_e = \\frac{\\sigma_e}{E}',
            c: 'εe = ' + m.sy + '/' + m.E + ' = ' + sg(c.ey, 4) + ' = ' + sg(c.ey * 100, 3) + ' %',
            r: 'A faixa elástica ocupa só ' + sg(c.ey / m.ef * 100, 3) + ' % do alongamento total',
            obs: 'É por isso que, sem ampliar o gráfico, o regime elástico é praticamente invisível.' },
          { t: 'Ponto de leitura',
            c: 'ε aplicada = ' + sg(eLido, 4) + ' = ' + sg(eLido * 100, 4) + ' %\n' +
               'σ correspondente (lido na curva) = ' + sg(sLido, 4) + ' MPa',
            r: 'Regime: ' + reg,
            obs: regDesc },
          { t: 'Separação entre elástico e plástico',
            tex: '\\varepsilon_{\\text{pl}} = \\varepsilon_{\\text{total}} - \\frac{\\sigma}{E}',
            c: 'εpl = ' + sg(eLido, 4) + ' − ' + sg(sLido, 4) + '/' + m.E + '\n' +
               'εpl = ' + sg(eLido, 4) + ' − ' + sg(sLido / m.E, 4),
            r: 'εpl = ' + sg(ePlast * 100, 4) + ' %  (deformação que NÃO volta)',
            obs: 'A reta de descarga tem a mesma inclinação E. O que sobra no eixo horizontal ao descarregar é a deformação permanente.' },
          { t: 'Módulo de resiliência',
            tex: 'U_r = \\frac{\\sigma_e^{2}}{2E}',
            c: 'Ur = ' + m.sy + '²/(2 × ' + m.E + ') MPa',
            r: 'Ur = ' + sg(m.sy * m.sy / (2 * m.E), 4) + ' MJ/m³',
            obs: 'Energia elástica armazenada por unidade de volume até o escoamento. Cresce com o QUADRADO de σe — daí aços de mola terem σe tão alto.' }
        ]);

        /* resiliência: área elástica = σe²/2E */
        var Ur = m.sy * m.sy / (2 * m.E);   /* MPa = MJ/m³ */

        return {
          E: { v: m.E / 1000, u: 'GPa' },
          sy: { v: m.sy, u: 'MPa' },
          su: { v: m.su, u: 'MPa' },
          sig: { v: sLido, u: 'MPa', classe: 'destaque' },
          regime: { v: reg, u: '', classe: regCls },
          plast: { v: ePlast * 100, u: '%', classe: ePlast > 1e-6 ? 'alerta' : 'ok' },
          Ur: { v: Ur, u: 'MJ/m³' }
        };
      }
    });
  })();

  /* ============================================================
     3. Torção de eixos
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-torcao')) return;

    /* Cilindro visto de lado, com a malha desenhada na superficie da
       FRENTE. Os aneis circunferenciais nao se movem; as geratrizes
       inclinam progressivamente, e por isso cada celula da malha, que era
       um retangulo, vira um losango. O angulo desse losango e o gamma. */
    function desenharEixo(c, pl, p, r) {          /* r = { theta, gama, tmax } */
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i, k;

      var x0 = a.x + a.w * 0.17, x1 = a.x + a.w * 0.74;
      var cy = a.y + a.h * 0.46;
      var R = Math.min(a.h * 0.21, 58);
      var rx = R * 0.30;                       /* perspectiva das tampas */
      var Rint = R * p.razao;

      /* angulo de torcao, exagerado para ser visivel na tela */
      var EXAG = 14;
      var phi = Math.max(-1.15, Math.min(1.15, r.theta * EXAG));

      /* ---------- engaste ---------- */
      c.setLineDash([]);
      c.strokeStyle = cor; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(x0 - 14, cy - R * 1.55); c.lineTo(x0 - 14, cy + R * 1.55); c.stroke();
      c.lineWidth = 1.2; c.strokeStyle = faint;
      for (var hy = -R * 1.55; hy <= R * 1.5; hy += 10) {
        c.beginPath();
        c.moveTo(x0 - 14, cy + hy); c.lineTo(x0 - 27, cy + hy + 9); c.stroke();
      }

      /* ---------- corpo ---------- */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.13;
      c.fillRect(x0, cy - R, x1 - x0, 2 * R);
      c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0, cy - R); c.lineTo(x1, cy - R);
      c.moveTo(x0, cy + R); c.lineTo(x1, cy + R);
      c.stroke();
      /* tampa esquerda: so a metade de tras aparece */
      c.lineWidth = 1.4; c.strokeStyle = borda;
      c.beginPath(); c.ellipse(x0, cy, rx, R, 0, -Math.PI / 2, Math.PI / 2, true); c.stroke();
      c.setLineDash([4, 3]);
      c.beginPath(); c.ellipse(x0, cy, rx, R, 0, -Math.PI / 2, Math.PI / 2, false); c.stroke();
      c.setLineDash([]);
      /* tampa direita, cheia */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.24;
      c.beginPath(); c.ellipse(x1, cy, rx, R, 0, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 2;
      c.beginPath(); c.ellipse(x1, cy, rx, R, 0, 0, Math.PI * 2); c.stroke();
      if (Rint > 1.5) {
        c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
        c.beginPath(); c.ellipse(x1, cy, rx * p.razao, Rint, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = borda; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(x1, cy, rx * p.razao, Rint, 0, 0, Math.PI * 2); c.stroke();
        c.fillStyle = faint;
        c.font = '9.5px ' + Plot.cssVar('--font', 'sans-serif');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('vazado', x1, cy);
      }

      /* ---------- malha na superficie da frente ---------- */
      var nAnel = 6, nGer = 5;
      /* geratrizes: comecam retas no engaste e inclinam ao longo de x */
      c.lineWidth = 1.6;
      for (k = 0; k < nGer; k++) {
        /* posicao angular na metade da frente, entre -70 e +70 graus */
        var th0 = -1.22 + 2.44 * k / (nGer - 1);
        c.strokeStyle = Plot.serie(1);
        c.beginPath();
        for (i = 0; i <= 30; i++) {
          var f = i / 30;
          var th = th0 + phi * f;
          c.lineTo(x0 + (x1 - x0) * f + rx * Math.sin(th), cy + R * Math.sin(th) * 0 + R * Math.sin(th));
        }
        c.stroke();
      }
      /* aneis: arcos frontais, que NAO se movem */
      c.strokeStyle = borda; c.lineWidth = 1.1;
      for (i = 1; i < nAnel; i++) {
        var xx = x0 + (x1 - x0) * i / nAnel;
        c.beginPath();
        c.ellipse(xx, cy, rx, R, 0, -Math.PI / 2, Math.PI / 2, false);
        c.stroke();
      }

      /* ---------- geratriz de referencia e o angulo gamma ---------- */
      var thRef = 0;                              /* frente, na "linha do meio" */
      c.strokeStyle = faint; c.lineWidth = 1.6; c.setLineDash([6, 4]);
      c.beginPath();
      c.moveTo(x0 + rx * Math.sin(thRef), cy + R * Math.sin(thRef));
      c.lineTo(x1 + rx * Math.sin(thRef), cy + R * Math.sin(thRef));
      c.stroke();
      c.setLineDash([]);

      /* celula da malha junto ao engaste: retangulo -> losango */
      var xc0 = x0 + (x1 - x0) * 0.06, xc1 = x0 + (x1 - x0) * 0.26;
      var dth = 0.34;
      function Pt(xf, th) {
        var f = (xf - x0) / (x1 - x0);
        var t = th + phi * f;
        return [xf + rx * Math.sin(t), cy + R * Math.sin(t)];
      }
      var A1 = Pt(xc0, 0), B1 = Pt(xc1, 0), C1 = Pt(xc1, dth), D1 = Pt(xc0, dth);
      c.strokeStyle = Plot.serie(3); c.fillStyle = Plot.serie(3); c.lineWidth = 2;
      c.globalAlpha = 0.18;
      c.beginPath();
      c.moveTo(A1[0], A1[1]); c.lineTo(B1[0], B1[1]);
      c.lineTo(C1[0], C1[1]); c.lineTo(D1[0], D1[1]); c.closePath();
      c.fill();
      c.globalAlpha = 1;
      c.stroke();
      /* chamada saindo da celula, escrita fora do cilindro */
      var xTxt = x0 + (x1 - x0) * 0.10, yTxt = cy + R * 1.30;
      c.lineWidth = 1.2; c.setLineDash([2, 3]);
      c.beginPath();
      c.moveTo((A1[0] + C1[0]) / 2, (A1[1] + C1[1]) / 2);
      c.lineTo(xTxt + 4, yTxt - 3);
      c.stroke();
      c.setLineDash([]);
      c.font = '600 11.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('γ = ' + Plot.sig(r.gama * 1000, 3) + ' mrad', xTxt, yTxt);
      c.font = '9.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.fillStyle = faint;
      c.fillText('a célula da malha era um retângulo e virou losango', xTxt, yTxt + 15);

      /* ---------- torque na ponta livre ---------- */
      c.strokeStyle = Plot.serie(5); c.fillStyle = Plot.serie(5); c.lineWidth = 2.8;
      c.beginPath();
      c.ellipse(x1 + rx * 1.2, cy, rx * 1.5, R * 0.86, 0, -Math.PI * 0.75, Math.PI * 0.62);
      c.stroke();
      var af = Math.PI * 0.62;
      var xa = x1 + rx * 1.2 + rx * 1.5 * Math.cos(af), ya = cy + R * 0.86 * Math.sin(af);
      c.beginPath();
      c.moveTo(xa, ya);
      c.lineTo(xa + 2, ya - 12);
      c.lineTo(xa + 11, ya - 3);
      c.closePath(); c.fill();
      c.font = '700 12px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('T = ' + p.T + ' N·m', x1 + rx * 2.9, cy - R * 0.9);

      /* ---------- angulo phi na secao livre ---------- */
      c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6); c.lineWidth = 1.8;
      c.setLineDash([5, 3]);
      c.beginPath(); c.moveTo(x1, cy); c.lineTo(x1, cy + R); c.stroke();
      c.setLineDash([]);
      c.beginPath();
      c.moveTo(x1, cy);
      c.lineTo(x1 + rx * Math.sin(phi + Math.PI / 2) * 0 + rx * Math.sin(phi),
               cy + R * Math.cos(phi));
      c.stroke();
      c.beginPath();
      c.arc(x1, cy, R * 0.42, Math.PI / 2 - Math.abs(phi), Math.PI / 2);
      c.stroke();
      c.font = '600 11.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('φ = ' + Plot.sig(r.theta * 180 / Math.PI, 3) + '°', x1 + 4, cy + R * 0.5);

      /* ---------- cota do comprimento ---------- */
      var yL = cy + R * 2.05;
      c.strokeStyle = faint; c.fillStyle = faint; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x0, yL); c.lineTo(x1, yL); c.stroke();
      [[x0, 1], [x1, -1]].forEach(function (q) {
        c.beginPath();
        c.moveTo(q[0], yL);
        c.lineTo(q[0] + q[1] * 9, yL - 4);
        c.lineTo(q[0] + q[1] * 9, yL + 4);
        c.closePath(); c.fill();
      });
      c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('L = ' + p.L + ' m   ·   Ø' + p.de + ' mm', (x0 + x1) / 2, yL + 6);

      /* ---------- textos ---------- */
      c.fillStyle = cor;
      c.font = '650 12.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Eixo sob torção — as geratrizes retas viram hélices', a.x + 4, a.y + 2);
      c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
      c.fillStyle = faint;
      c.fillText('γ = ρ·φ/L   ·   a seção transversal permanece PLANA e circular, apenas gira   ·   ' +
                 'ângulo de torção desenhado com exagero de ' + EXAG + '× para ficar visível',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-torcao', {
      titulo: 'Torção de eixo circular',
      descricao: 'A tensão de cisalhamento cresce linearmente do centro para a superfície. É por isso que o material do miolo quase não trabalha — e é por isso que o eixo vazado é tão eficiente.',
      controles: [
        { id: 'T', label: 'Torque aplicado T', min: 10, max: 5000, step: 10, valor: 800, unidade: 'N·m' },
        { id: 'de', label: 'Diâmetro externo', min: 10, max: 150, step: 1, valor: 50, unidade: 'mm' },
        { id: 'razao', label: 'Diâmetro interno / externo', min: 0, max: 0.92, step: 0.01, valor: 0, unidade: '',
          desc: '0 = eixo maciço. Acima de 0,9 a parede fica fina demais e o eixo pode enrugar.' },
        { id: 'L', label: 'Comprimento', min: 0.1, max: 4, step: 0.05, valor: 1, unidade: 'm' },
        { tipo: 'separador' },
        { id: 'G', label: 'Módulo de cisalhamento G', min: 25, max: 85, step: 1, valor: 77, unidade: 'GPa',
          desc: 'Aço ≈ 77 · Alumínio ≈ 26 · Latão ≈ 39' },
        { id: 'tadm', label: 'Tensão admissível', min: 20, max: 300, step: 5, valor: 120, unidade: 'MPa' },
        { id: 'compMassa', tipo: 'check', label: 'Comparar com maciço de mesma massa', valor: true }
      ],
      graficos: [
        { id: 'eixo', axes: false, height: 330, grid: false, legend: false },
        { id: 'dist', titulo: 'Distribuição de τ na seção', xlabel: 'Raio r (mm)', ylabel: 'τ (MPa)', aspect: 0.42 },
        { id: 'eficiencia', titulo: 'Efeito do furo central (mesmo diâmetro externo)',
          xlabel: 'Razão di/de', ylabel: 'Valor relativo ao maciço', aspect: 0.42, legendPos: 'bottomleft' }
      ],
      saidas: [
        { id: 'J', label: 'Momento polar J' },
        { id: 'tmax', label: 'τ máximo' },
        { id: 'theta', label: 'Ângulo de torção' },
        { id: 'grau', label: 'Torção por metro' },
        { id: 'fs', label: 'Coef. de segurança' },
        { id: 'estado', label: 'Situação' },
        { id: 'massa', label: 'Massa relativa' }
      ],
      formulas: [
        { g: 'Momento polar de inércia' },
        { tex: 'J =\\frac{\\pi \\cdot d^{4}}{32}', d: 'eixo circular maciço', destaque: true },
        { tex: 'J = \\pi \\cdot \\frac{d_{e}^{4} - d_{i}^{4}}{32}', d: 'eixo circular vazado', destaque: true },
        { tex: 'J = I_{x} + I_{y}', d: 'definição geral: soma dos momentos de inércia principais' },

        { g: 'Tensão de cisalhamento' },
        { tex: '\\tau (\\rho ) =\\frac{T\\cdot \\rho }{J}', d: 'linear no raio: nula no centro, máxima na superfície', destaque: true },
        { tex: '\\tau_{\\text{máx}} =\\frac{T\\cdot c}{J}', d: 'c = raio externo = dₑ/2', destaque: true },
        { tex: '\\gamma =\\frac{\\rho \\cdot \\phi }{L}', d: 'deformação angular; τ = G·γ' },

        { g: 'Ângulo de torção' },
        { tex: '\\phi =\\frac{T\\cdot L}{G\\cdot J}', d: 'resultado em radianos — multiplique por 57,3 para graus', destaque: true },
        { tex: '\\phi = \\Sigma \\frac{T_{i}L_{i}}{G_{i}J_{i}}', d: 'eixo com trechos de seção ou torque diferentes' },
        { tex: '\\frac{\\phi }{L} \\le 0,25 a 0,5 °/m', d: 'critério prático de rigidez para eixos de transmissão' },

        { g: 'Potência e verificação' },
        { tex: 'P = T\\cdot \\omega', d: 'P em W, T em N·m, ω em rad/s' },
        { tex: '\\omega =\\frac{2\\pi \\cdot n}{60}', d: 'n em rpm → ω em rad/s' },
        { tex: 'n =\\frac{\\tau_{\\text{adm}}}{\\tau_{\\text{máx}}}', d: 'coeficiente de segurança ao cisalhamento' },
        { tex: '\\tau_{\\text{adm}} = 0,577\\cdot \\frac{S_{y}}{n} (\\text{von Mises})', d: 'ou 0,5·S_y/n pelo critério de Tresca' },

        { g: 'Eixo vazado × maciço (mesmo dₑ)' },
        { tex: '\\frac{J}{J_{0}} = 1 - (\\frac{d_{i}}{d_{e}})^{4}', d: 'perda de rigidez ao remover o miolo' },
        { tex: '\\frac{m}{m_{0}} = 1 - (\\frac{d_{i}}{d_{e}})^{2}', d: 'perda de massa — cai mais rápido que a rigidez' },
        { tex: '\\frac{\\text{Válido} \\text{só} p}{\\text{seção} \\text{circular}}', d: 'seções não circulares empenam; τ = Tρ/J não se aplica' }
      ],
      formulasTitulo: 'Fórmulas — torção de eixos',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Válido para eixo circular (maciço ou vazado) em regime elástico. Seções não circulares empenam e não seguem τ = T·r/J.',
      calcular: function (p, ctx) {
        var de = p.de / 1000, di = de * p.razao;
        var J = Math.PI * (Math.pow(de, 4) - Math.pow(di, 4)) / 32;
        var G = p.G * 1e9;
        var tmax = p.T * (de / 2) / J / 1e6;             /* MPa */
        var theta = p.T * p.L / (G * J);                  /* rad */
        var gama = tmax * 1e6 / G;                        /* rad, na superfície */

        /* esquema do eixo torcionando */
        var pe2 = ctx.plot('eixo');
        if (pe2) {
          pe2.clear();
          pe2.setLimits([0, 1], [0, 1]);
          pe2.custom(function (c2, plot) {
            desenharEixo(c2, plot, p, { theta: theta, gama: gama, tmax: tmax });
          });
          pe2.draw();
        }

        /* distribuição de τ */
        var r0 = di / 2 * 1000, r1 = de / 2 * 1000;
        var rs = Plot.linspace(r0, r1, 60);
        var ts = rs.map(function (r) { return p.T * (r / 1000) / J / 1e6; });

        var pd = ctx.plot('dist');
        pd.clear();
        if (r0 > 0) {
          pd.setLimits([0, r1 * 1.02], [0, tmax * 1.15]);
          pd.area([0, r0], [0, 0], { base: 0, color: Plot.cssVar('--text-faint', '#999'), alpha: 0.12, stroke: false });
          pd.text(r0 / 2, tmax * 0.5, 'furo', { align: 'center', size: 11, color: Plot.cssVar('--text-faint', '#999') });
          pd.vline(r0, { color: Plot.cssVar('--text-faint', '#999'), dash: [4, 3], width: 1.2 });
        }
        pd.area(rs, ts, { base: 0, color: Plot.serie(0), alpha: 0.22, label: 'τ(r) = T·r/J' });
        pd.hline(p.tadm, { color: Plot.serie(6), dash: [6, 4], width: 1.5, text: 'τ admissível' });
        pd.marker(r1, tmax, Plot.sig(tmax, 3) + ' MPa', { color: Plot.serie(0), align: 'right', dx: -8 });
        pd.draw();

        /* eficiência do furo */
        var razoes = Plot.linspace(0, 0.95, 60);
        var Jmac = Math.PI * Math.pow(de, 4) / 32;
        var relJ = razoes.map(function (k) { return (1 - Math.pow(k, 4)); });
        var relMassa = razoes.map(function (k) { return (1 - k * k); });
        var relEspec = razoes.map(function (k, i) { return relJ[i] / (relMassa[i] || 1e-9); });

        var pe = ctx.plot('eficiencia');
        pe.clear();
        pe.setLimits([0, 0.95], [0, 3.2]);
        pe.line(razoes, relJ, { color: Plot.serie(0), label: 'Rigidez J/J₀' });
        pe.line(razoes, relMassa, { color: Plot.serie(1), label: 'Massa m/m₀' });
        pe.line(razoes, relEspec, { color: Plot.serie(2), width: 2.6, label: 'Rigidez específica' });
        pe.vline(p.razao, { color: Plot.serie(6), dash: [5, 4], width: 1.6, text: 'atual' });
        pe.hline(1, { color: Plot.cssVar('--text-faint', '#999'), dash: [3, 3], width: 1 });
        pe.draw();

        var fs = p.tadm / (tmax || 1e-9);
        var massaRel = (1 - p.razao * p.razao);

        var sgT = Plot.sig;
        ctx.setPassos([
          { t: 'Geometria da seção',
            c: 'de = ' + p.de + ' mm = ' + sgT(de, 4) + ' m\n' +
               'di = ' + sgT(di * 1000, 4) + ' mm   (razão di/de = ' + p.razao + ')\n' +
               'c = de/2 = ' + sgT(de / 2 * 1000, 4) + ' mm' },
          { t: 'Momento polar de inércia',
            tex: 'J = \\frac{\\pi (d_e^{4} - d_i^{4})}{32}',
            c: 'J = π(' + sgT(de, 4) + '⁴ − ' + sgT(di, 4) + '⁴)/32',
            r: 'J = ' + sgT(J * 1e12, 4) + ' mm⁴ = ' + sgT(J, 4) + ' m⁴',
            obs: p.razao > 0
              ? 'O furo removeu ' + sgT((1 - (1 - Math.pow(p.razao, 4))) * 100, 3) + ' % do J e ' +
                sgT(p.razao * p.razao * 100, 3) + ' % da massa — a assimetria que favorece o eixo vazado.'
              : 'Eixo maciço: J = πd⁴/32.' },
          { t: 'Tensão máxima de cisalhamento',
            tex: '\\tau_{\\text{max}} = \\frac{T \\cdot c}{J}',
            c: 'τ = ' + p.T + ' × ' + sgT(de / 2, 4) + ' / ' + sgT(J, 4),
            r: 'τmax = ' + sgT(tmax, 4) + ' MPa',
            obs: 'Ocorre na superfície. No centro do eixo a tensão é nula.' },
          { t: 'Ângulo de torção',
            tex: '\\varphi = \\frac{T \\cdot L}{G \\cdot J}',
            c: 'φ = ' + p.T + ' × ' + p.L + ' / (' + (p.G * 1e9) + ' × ' + sgT(J, 4) + ')\n' +
               'φ = ' + sgT(theta, 4) + ' rad × 57,3',
            r: 'φ = ' + sgT(theta * 180 / Math.PI, 4) + '°  →  ' +
               sgT(theta * 180 / Math.PI / p.L, 4) + ' °/m',
            obs: 'Critério prático de rigidez para eixos de transmissão: 0,25 a 0,5 °/m. ' +
                 (theta * 180 / Math.PI / p.L > 0.5 ? 'Este eixo está acima do limite.' : 'Este eixo atende.') },
          { t: 'Verificação de resistência',
            tex: 'n = \\frac{\\tau_{\\text{adm}}}{\\tau_{\\text{max}}}',
            c: 'n = ' + p.tadm + '/' + sgT(tmax, 4),
            r: 'n = ' + sgT(fs, 3) + (fs < 1 ? '  →  REPROVADO' : '  →  aprovado'),
            obs: 'τadm costuma vir de 0,577·Sy/n (von Mises) ou 0,5·Sy/n (Tresca).' }
        ]);

        var saidas = {
          J: { v: J * 1e12 / 1e3, u: '×10³ mm⁴' },
          tmax: { v: tmax, u: 'MPa', classe: tmax > p.tadm ? 'alerta' : 'destaque' },
          theta: { v: theta * 180 / Math.PI, u: '°' },
          grau: { v: theta * 180 / Math.PI / p.L, u: '°/m',
                  classe: theta * 180 / Math.PI / p.L > 0.5 ? 'alerta' : 'ok' },
          fs: { v: fs, u: '', classe: fs < 1 ? 'alerta' : fs > 1.5 ? 'ok' : '' },
          estado: { v: tmax > p.tadm ? 'Acima do admissível' : fs < 1.5 ? 'Elástico, margem curta' : 'Elástico, folgado',
                    u: '', classe: tmax > p.tadm ? 'alerta' : fs < 1.5 ? '' : 'ok' },
          massa: { v: massaRel * 100, u: '% do maciço' }
        };
        return saidas;
      }
    });
  })();

  /* ============================================================
     4. Flexão — distribuição de tensão na seção
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-flexao')) return;

    function propriedades(tipo, p) {
      /* devolve { I, c, A, contorno(y) -> largura, nome } em metros */
      if (tipo === 'ret') {
        var b = p.b / 1000, h = p.h / 1000;
        return { I: b * h * h * h / 12, c: h / 2, A: b * h, ymin: -h / 2, ymax: h / 2,
                 larg: function () { return b; }, nome: 'Retangular' };
      }
      if (tipo === 'circ') {
        var d = p.h / 1000, R = d / 2;
        return { I: Math.PI * Math.pow(d, 4) / 64, c: R, A: Math.PI * R * R, ymin: -R, ymax: R,
                 larg: function (y) { var s = R * R - y * y; return s > 0 ? 2 * Math.sqrt(s) : 0; },
                 nome: 'Circular maciça' };
      }
      if (tipo === 'tubo') {
        var de = p.h / 1000, Re = de / 2, Ri = Re * 0.85;
        return { I: Math.PI * (Math.pow(de, 4) - Math.pow(2 * Ri, 4)) / 64, c: Re,
                 A: Math.PI * (Re * Re - Ri * Ri), ymin: -Re, ymax: Re,
                 larg: function (y) {
                   var se = Re * Re - y * y, si = Ri * Ri - y * y;
                   return (se > 0 ? 2 * Math.sqrt(se) : 0) - (si > 0 ? 2 * Math.sqrt(si) : 0);
                 }, nome: 'Tubular' };
      }
      /* perfil I */
      var bf = p.b / 1000, hh = p.h / 1000;
      var tf = Math.max(0.004, hh * 0.09), tw = Math.max(0.003, bf * 0.13);
      var hAlma = hh - 2 * tf;
      var I = (bf * hh * hh * hh - (bf - tw) * hAlma * hAlma * hAlma) / 12;
      return { I: I, c: hh / 2, A: 2 * bf * tf + tw * hAlma, ymin: -hh / 2, ymax: hh / 2,
               larg: function (y) { return Math.abs(y) > hAlma / 2 ? bf : tw; },
               nome: 'Perfil I', tf: tf, tw: tw, bf: bf, h: hh, hAlma: hAlma };
    }

    Sim.build('#sim-flexao', {
      titulo: 'Flexão — tensão normal e cisalhante na seção',
      descricao: 'σ = M·y/I é linear e máxima nas fibras extremas; τ = VQ/(I·t) é parabólica e máxima na linha neutra. Trocar a forma da seção sem mudar a área muda tudo.',
      controles: [
        { id: 'tipo', tipo: 'select', label: 'Seção', valor: 'ret',
          opcoes: [
            { v: 'ret', t: 'Retangular' },
            { v: 'perfilI', t: 'Perfil I' },
            { v: 'circ', t: 'Circular maciça' },
            { v: 'tubo', t: 'Tubular (t = 7,5 % D)' }
          ] },
        { id: 'h', label: 'Altura / diâmetro h', min: 20, max: 400, step: 5, valor: 200, unidade: 'mm' },
        { id: 'b', label: 'Largura / mesa b', min: 10, max: 300, step: 5, valor: 100, unidade: 'mm',
          desc: 'Ignorado nas seções circulares.' },
        { tipo: 'separador' },
        { id: 'M', label: 'Momento fletor M', min: 0, max: 300, step: 1, valor: 60, unidade: 'kN·m' },
        { id: 'V', label: 'Cortante V', min: 0, max: 500, step: 5, valor: 100, unidade: 'kN' },
        { id: 'sadm', label: 'Tensão admissível', min: 20, max: 400, step: 5, valor: 165, unidade: 'MPa' },
        { id: 'girar', tipo: 'check', label: 'Girar a seção 90°', valor: false,
          desc: 'Mostra por que a viga deitada é muito pior: I cai com h³.' }
      ],
      graficos: [
        { id: 'sec', titulo: 'Seção e distribuição de σ', xlabel: 'σ (MPa) ← | → largura (mm)',
          ylabel: 'y (mm)', aspect: 0.62, legend: false },
        { id: 'cis', titulo: 'Distribuição de τ = VQ/(I·t)', xlabel: 'τ (MPa)', ylabel: 'y (mm)', aspect: 0.62, legend: false }
      ],
      saidas: [
        { id: 'I', label: 'Momento de inércia I' },
        { id: 'W', label: 'Módulo resistente W' },
        { id: 'A', label: 'Área' },
        { id: 'smax', label: 'σ máximo' },
        { id: 'tmax', label: 'τ máximo' },
        { id: 'fs', label: 'Coef. de segurança' },
        { id: 'regimeF', label: 'Regime' }
      ],
      formulas: [
        { g: 'Tensão normal de flexão' },
        { tex: '\\sigma (y) = -\\frac{M\\cdot y}{I}', d: 'linear com a distância à linha neutra', destaque: true },
        { tex: '\\sigma_{\\text{máx}} =\\frac{M\\cdot c}{I}=\\frac{M}{W}', d: 'na fibra extrema; c = distância da LN à borda', destaque: true },
        { tex: 'W =\\frac{I}{c}', d: 'módulo de resistência elástico — é o que se procura no catálogo' },
        { tex: '\\text{LN passa pelo centroide}', d: 'consequência de ∫σ dA = 0 na flexão pura' },

        { g: 'Cisalhamento transversal' },
        { tex: '\\tau =\\frac{V\\cdot Q}{I\\cdot t}', d: 'nulo nas bordas, máximo na linha neutra', destaque: true },
        { tex: 'Q = \\int_{A}\' y \mathrm{d}A = A\' \\cdot \\bar{y}\'', d: 'momento estático da área acima da fibra analisada' },
        { tex: '\\tau_{\\text{máx}} = 1,5\\cdot \\frac{V}{A}', d: 'seção retangular' },
        { tex: '\\tau_{\\text{máx}} = \\frac{4V}{3A}', d: 'seção circular maciça' },
        { tex: '\\frac{\\tau_{\\text{máx}} \\approx V}{A_{\\text{alma}}}', d: 'perfil I — a alma absorve 90 a 95 % do cortante' },

        { g: 'Momento de inércia das seções' },
        { tex: '\\text{Ret}\\hat{a}\\text{ngulo}: I = b\\cdot \\frac{h^{3}}{12}', d: 'W = b·h²/6' },
        { tex: '\\text{Círculo}: I = \\pi \\cdot \\frac{d^{4}}{64}', d: 'W = π·d³/32' },
        { tex: '\\text{Tubo}: I = \\pi \\frac{d_{e}^{4} - d_{i}^{4}}{64}', d: 'muito eficiente: massa longe da LN' },
        { tex: '\\text{Perfil} I: I = \\frac{B\\cdot H^{3} - b\\cdot h^{3}}{12}', d: 'seção vazada equivalente, para mesas simétricas' },
        { tex: '\\text{Steiner}: I = I_{c} + A\\cdot d^{2}', d: 'transporte de eixo — indispensável em seção composta' },

        { g: 'Leitura de projeto' },
        { tex: 'I \\propto h^{3} \\quad e \\quad W \\propto h^{2}', d: 'girar a seção 90° muda I por (h/b)² e σ por (h/b)' },
        { tex: 'n =\\frac{\\sigma_{\\text{adm}}}{\\sigma_{\\text{máx}}}', d: 'verificação de resistência à flexão' },
        { tex: '\\text{Hipóteses: flexão pura,}', d: 'eixo forte, material elástico linear, seção simétrica' }
      ],
      formulasTitulo: 'Fórmulas — flexão na seção',
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Flexão pura em torno do eixo forte, material elástico linear e seção simétrica. Q é o momento estático da área acima da fibra analisada.',
      calcular: function (p, ctx) {
        var pp = Object.assign({}, p);
        if (p.girar) { pp.h = p.b; pp.b = p.h; }
        var s = propriedades(p.tipo, pp);

        var M = p.M * 1000, V = p.V * 1000;
        var smax = M * s.c / s.I / 1e6;

        /* momento estático Q(y) por integração da área acima de y */
        var N = 120;
        var ys = Plot.linspace(s.ymin, s.ymax, N);
        var Q = new Array(N), tau = new Array(N);
        for (var i = 0; i < N; i++) {
          var y = ys[i], acc = 0;
          var passos = 160;
          var dy = (s.ymax - y) / passos;
          for (var k = 0; k < passos; k++) {
            var yc = y + dy * (k + 0.5);
            acc += s.larg(yc) * dy * yc;
          }
          Q[i] = acc;
          var t = s.larg(y);
          tau[i] = t > 1e-9 ? V * Q[i] / (s.I * t) / 1e6 : NaN;
        }
        var tmax = 0;
        tau.forEach(function (t) { if (isFinite(t) && t > tmax) tmax = t; });

        /* --- desenho da seção + diagrama σ --- */
        var ymm = ys.map(function (y) { return y * 1000; });
        var sig = ys.map(function (y) { return -M * y / s.I / 1e6; });

        var ps = ctx.plot('sec');
        ps.clear();
        var hmm = (s.ymax - s.ymin) * 1000;
        var escala = Math.max(smax * 1.3, 1);
        /* Limite vertical FIXO na maior altura possivel do controle: assim a
           secao encolhe e cresce de verdade ao mexer em h, em vez de o
           grafico se reajustar e mascarar a mudanca. */
        var H_REF = 420;
        ps.setLimits([-escala * 1.9, escala * 1.25], [-H_REF / 2, H_REF / 2]);

        /* contorno da seção desenhado à esquerda, em unidades de σ */
        ps.custom(function (c2, plot) {
          /* mesma quantidade de pixels por milimetro nas duas direcoes:
             e isso que preserva a proporcao entre largura e altura */
          var pxPorMm = Math.abs(plot.py(1) - plot.py(0));
          var cxPix = plot.px(-escala * 1.15);
          function Xdir(largM) { return cxPix + largM * 1000 * pxPorMm / 2; }
          function Xesq(largM) { return cxPix - largM * 1000 * pxPorMm / 2; }

          c2.fillStyle = Plot.serie(0);
          c2.globalAlpha = 0.18;
          c2.beginPath();
          var started = false;
          ys.forEach(function (y) {
            var X = Xdir(s.larg(y)), Y = plot.py(y * 1000);
            if (!started) { c2.moveTo(X, Y); started = true; } else c2.lineTo(X, Y);
          });
          for (var j = ys.length - 1; j >= 0; j--) {
            c2.lineTo(Xesq(s.larg(ys[j])), plot.py(ys[j] * 1000));
          }
          c2.closePath();
          c2.fill();
          c2.globalAlpha = 1;
          c2.strokeStyle = Plot.serie(0);
          c2.lineWidth = 1.8;
          c2.stroke();

          /* cotas de b e h, para a proporcao ficar explicita */
          var faint = Plot.cssVar('--text-faint', '#999');
          var largMax = 0;
          ys.forEach(function (y) { largMax = Math.max(largMax, s.larg(y)); });
          var yTopo = plot.py(s.ymax * 1000), yBase = plot.py(s.ymin * 1000);
          c2.strokeStyle = faint; c2.fillStyle = faint; c2.lineWidth = 1;
          c2.setLineDash([]);
          /* altura, a esquerda */
          var xCota = Xesq(largMax) - 16;
          c2.beginPath(); c2.moveTo(xCota, yTopo); c2.lineTo(xCota, yBase); c2.stroke();
          [[yTopo, 1], [yBase, -1]].forEach(function (q) {
            c2.beginPath();
            c2.moveTo(xCota, q[0]);
            c2.lineTo(xCota - 3.6, q[0] + q[1] * 8);
            c2.lineTo(xCota + 3.6, q[0] + q[1] * 8);
            c2.closePath(); c2.fill();
          });
          c2.save();
          c2.translate(xCota - 5, (yTopo + yBase) / 2);
          c2.rotate(-Math.PI / 2);
          c2.font = '600 10px ' + Plot.cssVar('--font', 'sans-serif');
          c2.textAlign = 'center'; c2.textBaseline = 'bottom';
          c2.fillText('h = ' + Math.round(hmm) + ' mm', 0, 0);
          c2.restore();
          /* largura, embaixo */
          var yCota = yBase + 16;
          c2.beginPath(); c2.moveTo(Xesq(largMax), yCota); c2.lineTo(Xdir(largMax), yCota); c2.stroke();
          [[Xesq(largMax), 1], [Xdir(largMax), -1]].forEach(function (q) {
            c2.beginPath();
            c2.moveTo(q[0], yCota);
            c2.lineTo(q[0] + q[1] * 8, yCota - 3.6);
            c2.lineTo(q[0] + q[1] * 8, yCota + 3.6);
            c2.closePath(); c2.fill();
          });
          c2.font = '600 10px ' + Plot.cssVar('--font', 'sans-serif');
          c2.textAlign = 'center'; c2.textBaseline = 'top';
          c2.fillText('b = ' + Math.round(largMax * 1000) + ' mm', cxPix, yCota + 4);

          /* linha neutra */
          c2.strokeStyle = Plot.cssVar('--err', '#c33');
          c2.lineWidth = 1.4;
          c2.setLineDash([6, 4]);
          c2.beginPath();
          c2.moveTo(cxPix - Math.max(largMax * 1000 * pxPorMm * 0.72, 26), plot.py(0));
          c2.lineTo(cxPix + Math.max(largMax * 1000 * pxPorMm * 0.72, 26), plot.py(0));
          c2.stroke();
          c2.setLineDash([]);
          c2.fillStyle = Plot.cssVar('--err', '#c33');
          c2.font = '600 10px ' + Plot.cssVar('--font', 'sans-serif');
          c2.textAlign = 'center'; c2.textBaseline = 'bottom';
          c2.fillText('LN', cxPix, plot.py(0) - 4);
        });

        /* diagrama de tensão */
        ps.custom(function (c2, plot) {
          c2.fillStyle = Plot.serie(1);
          c2.globalAlpha = 0.20;
          c2.beginPath();
          c2.moveTo(plot.px(0), plot.py(ymm[0]));
          for (var j = 0; j < ymm.length; j++) c2.lineTo(plot.px(sig[j]), plot.py(ymm[j]));
          c2.lineTo(plot.px(0), plot.py(ymm[ymm.length - 1]));
          c2.closePath(); c2.fill();
          c2.globalAlpha = 1;
          c2.strokeStyle = Plot.serie(1); c2.lineWidth = 2;
          c2.beginPath();
          for (var k2 = 0; k2 < ymm.length; k2++) {
            var X = plot.px(sig[k2]), Y = plot.py(ymm[k2]);
            if (k2 === 0) c2.moveTo(X, Y); else c2.lineTo(X, Y);
          }
          c2.stroke();
        });
        ps.vline(0, { color: Plot.cssVar('--text-faint', '#999'), dash: [], width: 1 });
        ps.text(smax * 0.5, s.ymin * 1000 * 0.82, 'tração', { align: 'center', size: 10.5, color: Plot.serie(1) });
        ps.text(-smax * 0.5, s.ymax * 1000 * 0.82, 'compressão', { align: 'center', size: 10.5, color: Plot.serie(1) });
        ps.marker(smax, s.ymin * 1000, Plot.sig(smax, 3) + ' MPa', { color: Plot.serie(1), align: 'right', dx: -7, dy: 14 });
        ps.draw();

        /* --- cisalhamento --- */
        var pc = ctx.plot('cis');
        pc.clear();
        pc.setLimits([0, Math.max(tmax * 1.25, 0.5)], [s.ymin * 1000 * 1.1, s.ymax * 1000 * 1.1]);
        pc.area(tau, ymm, { base: 0, color: Plot.serie(2), alpha: 0.2 });
        /* area() espera x crescente; desenha manualmente para o eixo invertido */
        pc.clear();
        pc.setLimits([0, Math.max(tmax * 1.25, 0.5)], [s.ymin * 1000 * 1.1, s.ymax * 1000 * 1.1]);
        pc.custom(function (c2, plot) {
          c2.fillStyle = Plot.serie(2); c2.globalAlpha = 0.2;
          c2.beginPath();
          c2.moveTo(plot.px(0), plot.py(ymm[0]));
          for (var j = 0; j < ymm.length; j++) {
            if (!isFinite(tau[j])) continue;
            c2.lineTo(plot.px(tau[j]), plot.py(ymm[j]));
          }
          c2.lineTo(plot.px(0), plot.py(ymm[ymm.length - 1]));
          c2.closePath(); c2.fill();
          c2.globalAlpha = 1;
          c2.strokeStyle = Plot.serie(2); c2.lineWidth = 2.2;
          c2.beginPath();
          var st = false;
          for (var k3 = 0; k3 < ymm.length; k3++) {
            if (!isFinite(tau[k3])) { st = false; continue; }
            var X = plot.px(tau[k3]), Y = plot.py(ymm[k3]);
            if (!st) { c2.moveTo(X, Y); st = true; } else c2.lineTo(X, Y);
          }
          c2.stroke();
        });
        pc.hline(0, { color: Plot.cssVar('--err', '#c33'), dash: [6, 4], width: 1.3, text: 'linha neutra' });
        pc.marker(tmax, 0, Plot.sig(tmax, 3) + ' MPa', { color: Plot.serie(2), align: 'right', dx: -7 });
        pc.draw();

        var fs = p.sadm / (smax || 1e-9);

        var sgF = Plot.sig;
        ctx.setPassos([
          { t: 'Seção escolhida',
            c: s.nome + (p.girar ? '  (girada 90°)' : '') + '\n' +
               'altura h = ' + sgF((s.ymax - s.ymin) * 1000, 4) + ' mm\n' +
               'c = h/2 = ' + sgF(s.c * 1000, 4) + ' mm\n' +
               'área A = ' + sgF(s.A * 1e6, 4) + ' mm²' },
          { t: 'Momento de inércia e módulo resistente',
            tex: 'I = \\int y^{2} \mathrm{d}A \\qquad W = \\frac{I}{c}',
            c: 'I = ' + sgF(s.I * 1e12, 4) + ' mm⁴\n' +
               'W = I/c = ' + sgF(s.I * 1e12, 4) + '/' + sgF(s.c * 1000, 4),
            r: 'W = ' + sgF(s.I / s.c * 1e9, 4) + ' mm³',
            obs: 'I depende de h³ e W de h². Girar a seção 90° troca as duas dimensões e muda tudo.' },
          { t: 'Tensão normal de flexão',
            tex: '\\sigma_{\\text{max}} = \\frac{M \\cdot c}{I} = \\frac{M}{W}',
            c: 'σ = ' + (p.M * 1e6) + ' N·mm / ' + sgF(s.I / s.c * 1e9, 4) + ' mm³',
            r: 'σmax = ' + sgF(smax, 4) + ' MPa',
            obs: 'Máxima na fibra extrema, nula na linha neutra, e varia LINEARMENTE entre elas.' },
          { t: 'Cisalhamento transversal',
            tex: '\\tau = \\frac{V \\cdot Q}{I \\cdot t}',
            c: 'Q = momento estático da área acima da fibra\n' +
               'Máximo na linha neutra, nulo nas bordas',
            r: 'τmax = ' + sgF(tmax, 4) + ' MPa',
            obs: 'Para retângulo, τmax = 1,5·V/A; para círculo, 4V/3A; em perfil I, quase todo o cortante fica na alma.' },
          { t: 'Verificação',
            tex: 'n = \\frac{\\sigma_{\\text{adm}}}{\\sigma_{\\text{max}}}',
            c: 'n = ' + p.sadm + '/' + sgF(smax, 4),
            r: 'n = ' + sgF(fs, 3) + (fs < 1 ? '  →  REPROVADO' : '  →  aprovado'),
            obs: 'Verificação por flexão apenas. Vigas curtas e muito carregadas podem falhar antes por cisalhamento.' }
        ]);

        return {
          I: { v: s.I * 1e12 / 1e6, u: '×10⁶ mm⁴' },
          W: { v: s.I / s.c * 1e9 / 1e3, u: '×10³ mm³' },
          A: { v: s.A * 1e6, u: 'mm²' },
          smax: { v: smax, u: 'MPa', classe: smax > p.sadm ? 'alerta' : 'destaque' },
          tmax: { v: tmax, u: 'MPa' },
          fs: { v: fs, u: '', classe: fs < 1 ? 'alerta' : fs > 1.5 ? 'ok' : '' },
          regimeF: { v: smax > p.sadm ? 'Acima do admissível' : smax > 0.9 * p.sadm ? 'Elástico, no limite' : 'Elástico',
                     u: '', classe: smax > p.sadm ? 'alerta' : smax > 0.9 * p.sadm ? '' : 'ok' }
        };
      }
    });
  })();

})();

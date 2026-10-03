/* ============================================================
   Figura — ilustrações do texto, desenhadas no próprio site
   ------------------------------------------------------------
   Diferente de Sim (o simulador completo, com saídas, fórmulas e passo a passo),
   uma Figura é pequena e serve ao parágrafo ao lado: mostra a ideia, aceita um ou
   dois controles e, quando ajuda, anima.

     Figura.criar('#fig-1-4', {
       titulo: 'Figura 1.4',
       legenda: 'As componentes normal e tangencial da aceleração.',
       vista: [-1, 11, -1, 7],          // coordenadas do desenho (x0,x1,y0,y1), y para cima
       altura: 260,                      // altura em px (padrão 250)
       animar: true,                     // chama desenhar(g, p, t) a ~60 fps
       controles: [{ id: 'v', rot: 'Velocidade', min: 5, max: 30, val: 15, passo: 1, un: 'm/s' }],
       desenhar: function (g, p, t) { ... }    // p.v = valor do controle; t = segundos
     });

   A figura só anima quando está visível na tela (IntersectionObserver), o que
   importa aqui: nas páginas em formato de livro as outras páginas ficam ocultas.
   As cores saem das variáveis do tema, e o desenho é refeito quando o tema muda.
   ============================================================ */
(function (global) {
  'use strict';

  var CORES = {
    texto: '--text', suave: '--text-muted', fraco: '--text-faint',
    borda: '--border', forte: '--border-strong', fundo: '--bg-elev', baixo: '--bg-sunken',
    acento: '--accent', ok: '--ok', aviso: '--warn', erro: '--err', info: '--info',
    s1: '--s1', s2: '--s2', s3: '--s3', s4: '--s4', s5: '--s5', s6: '--s6', s7: '--s7', s8: '--s8'
  };
  function cssVar(nome, padrao) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return v || padrao;
  }
  function num(v) { return Math.round(v * 1000) / 1000; }

  /* pincel: coordenadas do desenho, não pixels */
  function Pincel(ctx, cssW, cssH, vista) {
    this.ctx = ctx;
    this.larguraTela = cssW; this.alturaTela = cssH;
    var vx = vista[1] - vista[0], vy = vista[3] - vista[2];
    var e = Math.min(cssW / vx, cssH / vy);
    this.e = e;
    this.ox = (cssW - e * vx) / 2 - vista[0] * e;
    this.oy = cssH - (cssH - e * vy) / 2 + vista[2] * e;
    this.vista = vista;
  }
  Pincel.prototype.X = function (x) { return this.ox + x * this.e; };
  Pincel.prototype.Y = function (y) { return this.oy - y * this.e; };
  Pincel.prototype.D = function (d) { return d * this.e; };          /* distância */
  Pincel.prototype.cor = function (nome) {
    if (!nome) return cssVar('--text', '#111');
    if (nome.charAt(0) === '#' || nome.indexOf('rgb') === 0) return nome;
    return cssVar(CORES[nome] || nome, '#888');
  };
  Pincel.prototype.alfa = function (cor, a) {
    var c = this.cor(cor), ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = a; return c;   /* use com g.fim() */
  };
  Pincel.prototype.fim = function () { this.ctx.restore(); };

  Pincel.prototype.caminho = function (pts, o) {
    o = o || {};
    var ctx = this.ctx, self = this;
    ctx.save();
    ctx.beginPath();
    pts.forEach(function (p, i) {
      var x = self.X(p[0]), y = self.Y(p[1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    if (o.fechar) ctx.closePath();
    if (o.preenche) { ctx.globalAlpha = o.alfa == null ? 1 : o.alfa; ctx.fillStyle = this.cor(o.preenche); ctx.fill(); ctx.globalAlpha = 1; }
    if (o.cor !== null) {
      ctx.globalAlpha = o.alfaLinha == null ? 1 : o.alfaLinha;
      ctx.strokeStyle = this.cor(o.cor || 'texto');
      ctx.lineWidth = o.larg == null ? 1.6 : o.larg;
      ctx.lineJoin = 'round'; ctx.lineCap = o.cap || 'round';
      if (o.tracejado) ctx.setLineDash(o.tracejado === true ? [6, 5] : o.tracejado);
      ctx.stroke();
    }
    ctx.restore();
    return this;
  };
  Pincel.prototype.linha = function (x1, y1, x2, y2, o) { return this.caminho([[x1, y1], [x2, y2]], o); };
  Pincel.prototype.ret = function (x, y, w, h, o) {
    return this.caminho([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], Object.assign({ fechar: true }, o || {}));
  };
  /* retângulo girado em torno do canto inferior esquerdo */
  Pincel.prototype.retGirado = function (x, y, w, h, ang, o) {
    var c = Math.cos(ang), s = Math.sin(ang);
    function p(dx, dy) { return [x + dx * c - dy * s, y + dx * s + dy * c]; }
    return this.caminho([p(0, 0), p(w, 0), p(w, h), p(0, h)], Object.assign({ fechar: true }, o || {}));
  };
  Pincel.prototype.circ = function (x, y, r, o) {
    o = o || {};
    var ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.X(x), this.Y(y), this.D(r), 0, 2 * Math.PI);
    if (o.preenche) { ctx.globalAlpha = o.alfa == null ? 1 : o.alfa; ctx.fillStyle = this.cor(o.preenche); ctx.fill(); ctx.globalAlpha = 1; }
    if (o.cor !== null) {
      ctx.strokeStyle = this.cor(o.cor || 'texto');
      ctx.lineWidth = o.larg == null ? 1.6 : o.larg;
      if (o.tracejado) ctx.setLineDash(o.tracejado === true ? [5, 4] : o.tracejado);
      ctx.stroke();
    }
    ctx.restore();
    return this;
  };
  Pincel.prototype.arco = function (x, y, r, a0, a1, o) {
    o = o || {};
    var ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    /* o sentido segue o sinal de (a1 − a0): sem isso o arco daria a volta longa */
    ctx.arc(this.X(x), this.Y(y), this.D(r), -a0, -a1, a1 > a0);
    ctx.strokeStyle = this.cor(o.cor || 'suave');
    ctx.lineWidth = o.larg == null ? 1.4 : o.larg;
    if (o.tracejado) ctx.setLineDash(o.tracejado === true ? [5, 4] : o.tracejado);
    ctx.stroke();
    if (o.ponta) {   /* seta na ponta do arco, para indicar rotação */
      var a = a1, px = x + r * Math.cos(a), py = y + r * Math.sin(a);
      var dir = (a1 > a0 ? 1 : -1);
      var tg = a + dir * Math.PI / 2;
      this.pontaSeta(px, py, tg, o.cor || 'suave', 0.26);
    }
    ctx.restore();
    return this;
  };
  Pincel.prototype.pontaSeta = function (x, y, ang, cor, tam) {
    var ctx = this.ctx, px = this.X(x), py = this.Y(y), d = this.D(tam || 0.3);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-ang);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-d, d * 0.42); ctx.lineTo(-d, -d * 0.42);
    ctx.closePath();
    ctx.fillStyle = this.cor(cor || 'texto');
    ctx.fill();
    ctx.restore();
    return this;
  };
  /* vetor com rótulo: o pé fica em (x,y) e a ponta em (x+dx, y+dy) */
  Pincel.prototype.seta = function (x, y, dx, dy, o) {
    o = o || {};
    var m = Math.hypot(dx, dy);
    if (m < 1e-9) return this;
    var cor = o.cor || 'acento';
    var tam = o.ponta == null ? Math.min(0.34, m * 0.45) : o.ponta;
    var ang = Math.atan2(dy, dx);
    var cx = x + dx - tam * 0.85 * Math.cos(ang), cy = y + dy - tam * 0.85 * Math.sin(ang);
    this.linha(x, y, cx, cy, { cor: cor, larg: o.larg == null ? 2 : o.larg, tracejado: o.tracejado });
    this.pontaSeta(x + dx, y + dy, ang, cor, tam);
    if (o.rot) {
      var fx = o.rotDx == null ? Math.cos(ang) * 0.5 : o.rotDx;
      var fy = o.rotDy == null ? Math.sin(ang) * 0.5 : o.rotDy;
      this.txt(o.rot, x + dx + fx, y + dy + fy, { cor: cor, tam: o.rotTam || 12, alin: o.rotAlin || 'centro', negrito: true, fundo: o.rotFundo !== false });
    }
    return this;
  };
  Pincel.prototype.txt = function (s, x, y, o) {
    o = o || {};
    var ctx = this.ctx, px = this.X(x), py = this.Y(y);
    var tam = o.tam || 12;
    ctx.save();
    ctx.font = (o.negrito ? '600 ' : '') + tam + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = o.alin === 'esq' ? 'left' : o.alin === 'dir' ? 'right' : 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.fundo) {
      var w = ctx.measureText(s).width, h = tam + 4;
      var bx = ctx.textAlign === 'left' ? px - 2 : ctx.textAlign === 'right' ? px - w - 2 : px - w / 2 - 2;
      var by = py - h / 2;
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = this.cor('fundo');
      ctx.fillRect(bx, by, w + 4, h);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = this.cor(o.cor || 'texto');
    ctx.fillText(s, px, py);
    ctx.restore();
    return this;
  };
  /* piso/parede hachurados */
  Pincel.prototype.hachura = function (x, y, comp, ang, o) {
    o = o || {};
    var n = Math.max(3, Math.round(this.D(comp) / 9));
    var c = Math.cos(ang), s = Math.sin(ang);
    this.linha(x, y, x + comp * c, y + comp * s, { cor: o.cor || 'forte', larg: 1.8 });
    var d = o.d == null ? 0.26 : o.d;
    for (var i = 0; i <= n; i++) {
      var f = i / n, bx = x + comp * c * f, by = y + comp * s * f;
      this.linha(bx, by, bx - d * Math.cos(ang + Math.PI / 4), by - d * Math.sin(ang + Math.PI / 4),
        { cor: o.cor || 'forte', larg: 1 });
    }
    return this;
  };
  /* mola em ziguezague entre dois pontos */
  Pincel.prototype.mola = function (x1, y1, x2, y2, voltas, o) {
    o = o || {};
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1e-6) return this;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var a = o.amp == null ? 0.22 : o.amp, n = voltas || 6;
    var pts = [[x1, y1]];
    var L0 = L * 0.15, L1 = L * 0.85;
    pts.push([x1 + ux * L0, y1 + uy * L0]);
    for (var i = 0; i < n * 2; i++) {
      var f = L0 + (L1 - L0) * (i + 0.5) / (n * 2);
      var lado = i % 2 ? -1 : 1;
      pts.push([x1 + ux * f + nx * a * lado, y1 + uy * f + ny * a * lado]);
    }
    pts.push([x1 + ux * L1, y1 + uy * L1], [x2, y2]);
    return this.caminho(pts, { cor: o.cor || 'suave', larg: o.larg || 1.6 });
  };
  /* cota com as duas pontas, para medidas */
  Pincel.prototype.cota = function (x1, y1, x2, y2, rot, o) {
    o = o || {};
    var cor = o.cor || 'fraco';
    this.seta(x1, y1, (x2 - x1), (y2 - y1), { cor: cor, larg: 1.1, ponta: 0.2 });
    this.seta(x2, y2, (x1 - x2), (y1 - y2), { cor: cor, larg: 1.1, ponta: 0.2 });
    if (rot) this.txt(rot, (x1 + x2) / 2 + (o.dx || 0), (y1 + y2) / 2 + (o.dy || 0.3), { cor: cor, tam: 11.5, fundo: true });
    return this;
  };
  Pincel.prototype.num = num;

  /* ---------------------------------------------------------- figura */
  function criar(sel, cfg) {
    var host = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!host) return null;
    cfg = cfg || {};
    var ctrls = cfg.controles || [];

    var fig = document.createElement('figure');
    fig.className = 'fig';
    var tela = document.createElement('div');
    tela.className = 'fig-tela';
    var cv = document.createElement('canvas');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', (cfg.titulo ? cfg.titulo + '. ' : '') + (cfg.legenda || 'Figura ilustrativa'));
    tela.appendChild(cv);
    fig.appendChild(tela);

    var pcontrole = null;
    if (ctrls.length || cfg.animar) {
      pcontrole = document.createElement('div');
      pcontrole.className = 'fig-ctrl';
      fig.appendChild(pcontrole);
    }
    var cap = document.createElement('figcaption');
    cap.innerHTML = (cfg.titulo ? '<strong>' + cfg.titulo + '</strong> ' : '') + (cfg.legenda || '');
    fig.appendChild(cap);
    host.appendChild(fig);

    var p = {};
    var campos = {};
    ctrls.forEach(function (c, i) {
      p[c.id] = c.val;
      var cx = document.createElement('label');
      cx.className = 'fig-campo';
      var id = (host.id || 'fig') + '-' + c.id + '-' + i;
      cx.innerHTML = '<span class="fig-rot" id="' + id + '-rot">' + c.rot + '</span>' +
        '<input type="range" id="' + id + '" min="' + c.min + '" max="' + c.max + '" step="' + (c.passo || 1) +
        '" value="' + c.val + '" aria-labelledby="' + id + '-rot">' +
        '<output for="' + id + '" class="fig-val"></output>';
      pcontrole.appendChild(cx);
      var inp = cx.querySelector('input'), out = cx.querySelector('output');
      function mostra() {
        out.textContent = (Math.round(p[c.id] * 100) / 100) + (c.un ? ' ' + c.un : '');
      }
      inp.addEventListener('input', function () {
        p[c.id] = parseFloat(inp.value);
        mostra();
        if (!anima) desenhar();
      });
      campos[c.id] = { inp: inp, mostra: mostra };
      mostra();
    });

    var anima = !!cfg.animar, tocando = true, t0 = null, t = 0, rafId = null, visivel = false;
    var btn = null;
    if (anima) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn sm ghost fig-play';
      pcontrole.appendChild(btn);
      function rotulo() {
        btn.textContent = tocando ? '⏸ Pausar' : '▶ Animar';
        btn.setAttribute('aria-label', tocando ? 'Pausar a animação' : 'Retomar a animação');
      }
      btn.addEventListener('click', function () { tocando = !tocando; rotulo(); laco(); });
      rotulo();
      if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tocando = false; rotulo();
      }
    }

    var ctx = cv.getContext('2d');
    function desenhar() {
      /* a altura acompanha a proporção da vista, até o limite de cfg.altura:
         assim o desenho preenche a largura disponível em vez de ficar perdido no meio */
      var vista = cfg.vista || [0, 10, 0, 6];
      var prop = (vista[1] - vista[0]) / (vista[3] - vista[2]);
      var larguraMax = Math.max(200, tela.clientWidth || 600);
      var teto = cfg.altura || 300;
      var cssH = Math.max(180, Math.min(teto, larguraMax / prop));
      var cssW = Math.min(larguraMax, Math.round(cssH * prop));
      var dpr = global.devicePixelRatio || 1;
      if (cv.width !== Math.round(cssW * dpr) || cv.height !== Math.round(cssH * dpr)) {
        cv.width = Math.round(cssW * dpr);
        cv.height = Math.round(cssH * dpr);
        cv.style.width = cssW + 'px';
        cv.style.height = cssH + 'px';
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      var g = new Pincel(ctx, cssW, cssH, vista);
      ctx.fillStyle = g.cor('fundo');
      ctx.fillRect(0, 0, cssW, cssH);
      try { cfg.desenhar(g, p, t); } catch (e) { if (global.console) console.error('Figura', cfg.titulo, e); }
    }

    function laco() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (!anima || !tocando || !visivel) { desenhar(); return; }
      var passo = function (ts) {
        if (t0 == null) t0 = ts;
        t += Math.min(0.05, (ts - t0) / 1000);
        t0 = ts;
        desenhar();
        rafId = requestAnimationFrame(passo);
      };
      t0 = null;
      rafId = requestAnimationFrame(passo);
    }

    if (global.ResizeObserver) new ResizeObserver(function () { desenhar(); }).observe(tela);
    else global.addEventListener('resize', desenhar);
    /* o tema muda as cores: redesenha */
    new MutationObserver(function () { desenhar(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    /* só anima o que está na tela — nas páginas do livro as demais ficam ocultas */
    if (global.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        visivel = es[0].isIntersecting;
        laco();
      }, { rootMargin: '120px' }).observe(fig);
    } else { visivel = true; }
    document.addEventListener('visibilitychange', function () { laco(); });

    desenhar();
    return { desenhar: desenhar, p: p, fig: fig };
  }

  global.Figura = { criar: criar, Pincel: Pincel };
})(window);

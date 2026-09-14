/* ============================================================
   Plot - biblioteca minima de graficos em canvas 2D
   Sem dependencias. Compativel com tema claro/escuro.

   Uso:
     const p = Plot.create(canvasEl, { xlabel:'x', ylabel:'y' });
     p.clear();
     p.line(xs, ys, { color: Plot.serie(0), label: 'curva' });
     p.draw();
   ============================================================ */
(function (global) {
  'use strict';

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  var SERIES = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'];

  /* mesma formatacao do Plot.sig, disponivel dentro do modulo */
  function sig(v, n) {
    if (!isFinite(v)) return '--';
    if (v === 0) return '0';
    n = n || 4;
    var a = Math.abs(v);
    if (a >= 1e6 || a < 1e-4) return v.toExponential(n - 1).replace('e+', 'e');
    return String(Number(v.toPrecision(n)));
  }

  function serie(i) {
    return cssVar(SERIES[((i % SERIES.length) + SERIES.length) % SERIES.length], '#0b6bcb');
  }

  function niceNum(range, round) {
    if (!isFinite(range) || range <= 0) return 1;
    var exp = Math.floor(Math.log10(range));
    var frac = range / Math.pow(10, exp);
    var nf;
    if (round) {
      nf = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
    } else {
      nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
    }
    return nf * Math.pow(10, exp);
  }

  function ticks(min, max, count) {
    if (!isFinite(min) || !isFinite(max)) return [0];
    if (min === max) { min -= 0.5; max += 0.5; }
    var range = niceNum(max - min, false);
    var step = niceNum(range / Math.max(1, (count || 6) - 1), true);
    var start = Math.ceil(min / step) * step;
    var out = [];
    for (var v = start; v <= max + step * 1e-6; v += step) {
      out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    }
    return out;
  }

  /* marcas de eixo logaritmico: 1, 2 e 5 de cada decada (em log10) */
  function ticksLog(min, max) {
    var out = [], d0 = Math.floor(min), d1 = Math.ceil(max);
    var dens = (d1 - d0) > 4 ? [1] : [1, 2, 5];
    for (var d = d0; d <= d1; d++) {
      dens.forEach(function (m) {
        var v = d + Math.log10(m);
        if (v >= min - 1e-9 && v <= max + 1e-9) out.push(v);
      });
    }
    return out.length >= 2 ? out : [min, max];
  }
  function fmtLog(v) {
    var r = Math.pow(10, v);
    if (r >= 1e5 || r < 1e-3) return r.toExponential(0).replace('e+', 'e');
    return String(Number(r.toPrecision(3)));
  }

  function fmt(v, step) {
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) return v.toExponential(1).replace('e+', 'e');
    var dec = 0;
    if (step !== undefined && step > 0) {
      dec = Math.max(0, Math.min(6, -Math.floor(Math.log10(step)) + 0));
      if (!isFinite(dec)) dec = 2;
    } else {
      dec = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
    }
    var s = v.toFixed(dec);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  function Plot(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = Object.assign({
      xlabel: '', ylabel: '', title: '',
      xlim: null, ylim: null,          // [min,max] ou null (auto)
      grid: true, legend: true,
      padding: { l: 58, r: 16, t: 18, b: 42 },
      aspect: 0.56,                     // altura = largura * aspect
      height: null,                     // altura fixa em px (sobrepoe aspect)
      xticks: 6, yticks: 5, xcat: null,
      xlog: false, ylog: false,        // dados ja em log10; marcas 1-2-5 por decada
      yZeroLine: false,
      equalAspect: false
    }, opts || {});
    this.items = [];
    this._bounds = null;
    var self = this;
    this._ro = null;
    if (global.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self.draw(); });
      this._ro.observe(canvas.parentElement || canvas);
    } else {
      global.addEventListener('resize', function () { self.draw(); });
    }
  }

  Plot.prototype.clear = function () { this.items = []; return this; };

  Plot.prototype.line = function (xs, ys, o) {
    this.items.push(Object.assign({ type: 'line', xs: xs, ys: ys, width: 2 }, o || {}));
    return this;
  };
  Plot.prototype.points = function (xs, ys, o) {
    this.items.push(Object.assign({ type: 'points', xs: xs, ys: ys, r: 3.2 }, o || {}));
    return this;
  };
  Plot.prototype.area = function (xs, ys, o) {
    this.items.push(Object.assign({ type: 'area', xs: xs, ys: ys, base: 0, alpha: 0.16 }, o || {}));
    return this;
  };
  Plot.prototype.bars = function (xs, ys, o) {
    this.items.push(Object.assign({ type: 'bars', xs: xs, ys: ys, width: 0.7, alpha: 0.85 }, o || {}));
    return this;
  };
  Plot.prototype.hline = function (y, o) {
    this.items.push(Object.assign({ type: 'hline', y: y, width: 1.2, dash: [5, 4] }, o || {}));
    return this;
  };
  Plot.prototype.vline = function (x, o) {
    this.items.push(Object.assign({ type: 'vline', x: x, width: 1.2, dash: [5, 4] }, o || {}));
    return this;
  };
  Plot.prototype.text = function (x, y, str, o) {
    this.items.push(Object.assign({ type: 'text', x: x, y: y, str: str, align: 'left', baseline: 'bottom', size: 11 }, o || {}));
    return this;
  };
  Plot.prototype.marker = function (x, y, str, o) {
    this.items.push(Object.assign({ type: 'marker', x: x, y: y, str: str || '', r: 4 }, o || {}));
    return this;
  };
  /* Desenho livre em coordenadas de dados: fn(ctx, plot) */
  Plot.prototype.custom = function (fn, o) {
    this.items.push(Object.assign({ type: 'custom', fn: fn }, o || {}));
    return this;
  };

  Plot.prototype.setLimits = function (xlim, ylim) {
    this.o.xlim = xlim || null; this.o.ylim = ylim || null; return this;
  };

  Plot.prototype._computeBounds = function () {
    var xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity, any = false;
    this.items.forEach(function (it) {
      if (it.type === 'hline') { if (isFinite(it.y)) { ymin = Math.min(ymin, it.y); ymax = Math.max(ymax, it.y); any = true; } return; }
      if (it.type === 'vline') { if (isFinite(it.x)) { xmin = Math.min(xmin, it.x); xmax = Math.max(xmax, it.x); any = true; } return; }
      if (it.type === 'text' || it.type === 'marker') {
        if (isFinite(it.x) && isFinite(it.y)) { xmin = Math.min(xmin, it.x); xmax = Math.max(xmax, it.x); ymin = Math.min(ymin, it.y); ymax = Math.max(ymax, it.y); any = true; }
        return;
      }
      if (!it.xs) return;
      for (var i = 0; i < it.xs.length; i++) {
        var x = it.xs[i], y = it.ys[i];
        if (!isFinite(x) || !isFinite(y)) continue;
        if (x < xmin) xmin = x; if (x > xmax) xmax = x;
        if (y < ymin) ymin = y; if (y > ymax) ymax = y;
        any = true;
      }
      if (it.type === 'area' && isFinite(it.base)) { ymin = Math.min(ymin, it.base); ymax = Math.max(ymax, it.base); }
      if (it.type === 'bars') { ymin = Math.min(ymin, 0); ymax = Math.max(ymax, 0); }
    });
    if (!any) { xmin = 0; xmax = 1; ymin = 0; ymax = 1; }
    if (xmin === xmax) { xmin -= 0.5; xmax += 0.5; }
    if (ymin === ymax) { ymin -= 0.5; ymax += 0.5; }
    /* rotulo escrito no topo de uma barra precisa de folga extra, senao a
       moldura corta a primeira linha do texto */
    var temTexto = false;
    for (var q = 0; q < this.items.length; q++) {
      if (this.items[q].type === 'text' || this.items[q].type === 'marker') { temTexto = true; break; }
    }
    var faixa = ymax - ymin;
    ymin -= faixa * 0.08;
    ymax += faixa * (temTexto ? 0.18 : 0.08);
    if (this.o.xlim) { xmin = this.o.xlim[0]; xmax = this.o.xlim[1]; }
    if (this.o.ylim) { ymin = this.o.ylim[0]; ymax = this.o.ylim[1]; }
    this._bounds = { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  };

  /* dados -> pixel */
  Plot.prototype.px = function (x) {
    var b = this._bounds, a = this._area;
    return a.x + (x - b.xmin) / (b.xmax - b.xmin) * a.w;
  };
  Plot.prototype.py = function (y) {
    var b = this._bounds, a = this._area;
    return a.y + a.h - (y - b.ymin) / (b.ymax - b.ymin) * a.h;
  };
  /* pixel -> dados */
  Plot.prototype.ux = function (px) {
    var b = this._bounds, a = this._area;
    return b.xmin + (px - a.x) / a.w * (b.xmax - b.xmin);
  };
  Plot.prototype.uy = function (py) {
    var b = this._bounds, a = this._area;
    return b.ymin + (a.y + a.h - py) / a.h * (b.ymax - b.ymin);
  };

  /* ------------------------------------------------------------
     Leitura de coordenadas ao passar o mouse.
     O canvas guarda o ultimo desenho em _bounds e _area, entao basta
     converter pixel em dado. Com series de linha, procura-se o ponto de
     x mais proximo e mostra-se o y DAQUELA curva — que e como se le um
     diagrama de cortante ou de momento.
     ------------------------------------------------------------ */
  Plot.prototype._ligarLeitura = function () {
    if (this._leituraLigada || this.o.axes === false) return;
    this._leituraLigada = true;
    var self = this;
    var cv = this.canvas;
    var cx = null, cy = null;

    function redesenha() {
      if (!self._area || !self._bounds) return;
      self.draw();
      if (cx === null) return;
      var a = self._area;
      if (cx < a.x || cx > a.x + a.w || cy < a.y || cy > a.y + a.h) return;
      var ctx = self.ctx;
      var xd = self.ux(cx);

      /* curva mais proxima verticalmente do ponteiro */
      var melhor = null;
      self.items.forEach(function (it, idx) {
        if ((it.type !== 'line' && it.type !== 'area') || !it.xs || it.xs.length < 2) return;
        var jm = -1, dm = Infinity;
        for (var j = 0; j < it.xs.length; j++) {
          var d = Math.abs(it.xs[j] - xd);
          if (d < dm && isFinite(it.ys[j])) { dm = d; jm = j; }
        }
        if (jm < 0) return;
        var dy = Math.abs(self.py(it.ys[jm]) - cy);
        if (!melhor || dy < melhor.dy) {
          melhor = { x: it.xs[jm], y: it.ys[jm], dy: dy,
                     cor: it.color || serie(idx), rotulo: it.label || '' };
        }
      });

      var px, py, vx, vy, cor, rot;
      if (melhor && melhor.dy < 60) {
        vx = melhor.x; vy = melhor.y; cor = melhor.cor; rot = melhor.rotulo;
        px = self.px(vx); py = self.py(vy);
      } else {
        vx = xd; vy = self.uy(cy); cor = cssVar('--text-muted', '#666'); rot = '';
        px = cx; py = cy;
      }

      ctx.save();
      /* cruz de referencia */
      ctx.strokeStyle = cor; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, a.y); ctx.lineTo(px, a.y + a.h);
      ctx.moveTo(a.x, py); ctx.lineTo(a.x + a.w, py);
      ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      /* ponto */
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = cssVar('--bg-elev', '#fff'); ctx.lineWidth = 1.6; ctx.stroke();

      /* quadro com os valores */
      function limpaEixo(t) {
        return (t || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
      }
      var nomeX = limpaEixo(self.o.xlabel) || 'x';
      var nomeY = limpaEixo(self.o.ylabel) || 'y';
      var l1 = nomeX + ' = ' + sig(self.o.xlog ? Math.pow(10, vx) : vx, 4);
      var l2 = nomeY + ' = ' + sig(self.o.ylog ? Math.pow(10, vy) : vy, 4);
      ctx.font = '11px ' + cssVar('--font', 'sans-serif');
      var larg = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width);
      if (rot) larg = Math.max(larg, ctx.measureText(rot).width);
      var alt = rot ? 46 : 32;
      var bx = px + 12, by = py - alt - 10;
      if (bx + larg + 14 > a.x + a.w) bx = px - larg - 26;
      if (by < a.y + 2) by = py + 14;
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = cssVar('--bg-elev', '#fff');
      ctx.fillRect(bx, by, larg + 14, alt);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cor; ctx.lineWidth = 1.2;
      ctx.strokeRect(bx, by, larg + 14, alt);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      var yy = by + 6;
      if (rot) {
        ctx.fillStyle = cor;
        ctx.font = '600 10.5px ' + cssVar('--font', 'sans-serif');
        ctx.fillText(rot, bx + 7, yy); yy += 14;
      }
      ctx.fillStyle = cssVar('--text', '#111');
      ctx.font = '11px ' + cssVar('--font', 'sans-serif');
      ctx.fillText(l1, bx + 7, yy);
      ctx.fillText(l2, bx + 7, yy + 14);
      ctx.restore();
    }

    cv.style.cursor = 'crosshair';
    cv.addEventListener('mousemove', function (ev) {
      var rct = cv.getBoundingClientRect();
      cx = (ev.clientX - rct.left) * (cv.width / (global.devicePixelRatio || 1)) / rct.width;
      cy = (ev.clientY - rct.top) * (cv.height / (global.devicePixelRatio || 1)) / rct.height;
      redesenha();
    });
    cv.addEventListener('mouseleave', function () {
      cx = null; cy = null;
      if (self._area) self.draw();
    });
    /* toque: mesma leitura, sem a cruz depois de soltar */
    cv.addEventListener('touchmove', function (ev) {
      if (!ev.touches.length) return;
      var rct = cv.getBoundingClientRect();
      var t = ev.touches[0];
      cx = (t.clientX - rct.left) * (cv.width / (global.devicePixelRatio || 1)) / rct.width;
      cy = (t.clientY - rct.top) * (cv.height / (global.devicePixelRatio || 1)) / rct.height;
      redesenha();
      ev.preventDefault();
    }, { passive: false });
  };

  Plot.prototype.draw = function () {
    var cv = this.canvas, ctx = this.ctx, o = this.o;
    var host = cv.parentElement || cv;
    var cssW = Math.max(220, host.clientWidth || 600);
    var cssH = o.height || Math.round(cssW * o.aspect);
    var dpr = global.devicePixelRatio || 1;
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    cv.style.width = '100%';
    cv.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cText = cssVar('--text', '#111'), cMuted = cssVar('--text-muted', '#666'),
        cFaint = cssVar('--text-faint', '#999'), cBorder = cssVar('--border', '#ddd'),
        cElev = cssVar('--bg-elev', '#fff'), cSunk = cssVar('--bg-sunken', '#eee');

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = cElev;
    ctx.fillRect(0, 0, cssW, cssH);

    /* axes:false -> tela limpa para desenhos esquematicos
       (sem grade, sem moldura, sem numeros nos eixos) */
    var semEixos = o.axes === false;
    var p = semEixos ? { l: 10, r: 10, t: 6, b: 6 } : o.padding;
    var padT = p.t + (o.title ? 16 : 0);
    var padB = p.b + (o.xlabel ? 14 : 0);
    var padL = p.l + (o.ylabel ? 8 : 0);
    this._area = { x: padL, y: padT, w: Math.max(10, cssW - padL - p.r), h: Math.max(10, cssH - padT - padB) };
    var a = this._area;

    this._computeBounds();
    var b = this._bounds;

    if (o.equalAspect) {
      var sx = a.w / (b.xmax - b.xmin), sy = a.h / (b.ymax - b.ymin);
      var s = Math.min(sx, sy);
      var cx = (b.xmin + b.xmax) / 2, cy = (b.ymin + b.ymax) / 2;
      b.xmin = cx - a.w / (2 * s); b.xmax = cx + a.w / (2 * s);
      b.ymin = cy - a.h / (2 * s); b.ymax = cy + a.h / (2 * s);
    }

    /* xcat troca as marcas numericas do eixo x por categorias nomeadas */
    var xt = o.xcat ? o.xcat.map(function (c) { return c.v; })
                    : o.xlog ? ticksLog(b.xmin, b.xmax)
                    : ticks(b.xmin, b.xmax, o.xticks);
    var xtLab = o.xcat ? o.xcat.map(function (c) { return c.label; })
              : o.xlog ? xt.map(fmtLog) : null;
    /* yticks: 0 esconde as marcas do eixo y (eixo so de posicao, sem valor) */
    var yt = o.yticks === 0 ? [] : o.ylog ? ticksLog(b.ymin, b.ymax) : ticks(b.ymin, b.ymax, o.yticks);
    var xstep = (!o.xcat && xt.length > 1) ? xt[1] - xt[0] : undefined;
    var ystep = yt.length > 1 ? yt[1] - yt[0] : undefined;

    /* fundo da area de plot */
    if (!semEixos) {
    ctx.fillStyle = cSunk;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.globalAlpha = 1;
    }

    /* grade */
    if (o.grid && !semEixos) {
      ctx.strokeStyle = cBorder; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.beginPath();
      var self = this;
      xt.forEach(function (t) {
        var X = Math.round(self.px(t)) + 0.5;
        if (X < a.x - 1 || X > a.x + a.w + 1) return;
        ctx.moveTo(X, a.y); ctx.lineTo(X, a.y + a.h);
      });
      yt.forEach(function (t) {
        var Y = Math.round(self.py(t)) + 0.5;
        if (Y < a.y - 1 || Y > a.y + a.h + 1) return;
        ctx.moveTo(a.x, Y); ctx.lineTo(a.x + a.w, Y);
      });
      ctx.stroke();
    }

    /* eixo zero */
    if (!semEixos && !o.ylog && b.ymin < 0 && b.ymax > 0) {
      ctx.strokeStyle = cFaint; ctx.lineWidth = 1.2; ctx.setLineDash([]);
      ctx.beginPath();
      var Y0 = Math.round(this.py(0)) + 0.5;
      ctx.moveTo(a.x, Y0); ctx.lineTo(a.x + a.w, Y0); ctx.stroke();
    }
    /* em eixo categorico o x = 0 e so o indice da primeira barra */
    if (!semEixos && !o.xcat && !o.xlog && b.xmin < 0 && b.xmax > 0) {
      ctx.strokeStyle = cFaint; ctx.lineWidth = 1.2; ctx.setLineDash([]);
      ctx.beginPath();
      var X0 = Math.round(this.px(0)) + 0.5;
      ctx.moveTo(X0, a.y); ctx.lineTo(X0, a.y + a.h); ctx.stroke();
    }

    /* series */
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.x - 1, a.y - 1, a.w + 2, a.h + 2);
    ctx.clip();
    this._drawItems(ctx, cText, cMuted);
    ctx.restore();

    /* moldura */
    if (!semEixos) {
      ctx.strokeStyle = cBorder; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.strokeRect(a.x + 0.5, a.y + 0.5, a.w - 1, a.h - 1);
    }

    /* rotulos de eixo */
    if (!semEixos) {
    ctx.fillStyle = cMuted;
    ctx.font = '11px ' + cssVar('--font', 'sans-serif');
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var s2 = this;
    xt.forEach(function (t, i) {
      var X = s2.px(t);
      if (X < a.x - 2 || X > a.x + a.w + 2) return;
      ctx.fillText(xtLab ? xtLab[i] : fmt(t, xstep), X, a.y + a.h + 7);
    });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    yt.forEach(function (t) {
      var Y = s2.py(t);
      if (Y < a.y - 2 || Y > a.y + a.h + 2) return;
      ctx.fillText(o.ylog ? fmtLog(t) : fmt(t, ystep), a.x - 8, Y);
    });
    }

    if (o.xlabel && !semEixos) {
      ctx.fillStyle = cText; ctx.font = '600 11.5px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(o.xlabel, a.x + a.w / 2, cssH - 4);
    }
    if (o.ylabel && !semEixos) {
      ctx.save();
      ctx.translate(12, a.y + a.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = cText; ctx.font = '600 11.5px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(o.ylabel, 0, 0);
      ctx.restore();
    }
    if (o.title) {
      ctx.fillStyle = cText; ctx.font = '650 13px ' + cssVar('--font', 'sans-serif');
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(o.title, a.x, 6);
    }

    if (o.legend) this._drawLegend(ctx, cText, cElev, cBorder);
    this._ligarLeitura();
    return this;
  };

  /* escreve um rotulo sobre uma tarja da cor do fundo, para ele nao se
     perder por cima da curva ou da grade */
  function tarja(ctx, texto, x, y, cor, alinha) {
    ctx.font = '10.5px ' + cssVar('--font', 'sans-serif');
    var l = ctx.measureText(texto).width;
    var px = alinha === 'right' ? x - l - 5 : x + 5;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = cssVar('--bg-elev', '#fff');
    ctx.fillRect(px - 3, y - 8, l + 6, 15);
    ctx.restore();
    ctx.fillStyle = cor;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(texto, px, y);
  }

  Plot.prototype._drawItems = function (ctx, cText) {
    var self = this;
    var a = this._area;
    var nVert = 0;              /* empilha rotulos de vline */
    this.items.forEach(function (it, idx) {
      var color = it.color || serie(idx);
      ctx.strokeStyle = color; ctx.fillStyle = color;
      ctx.lineWidth = it.width || 2;
      ctx.setLineDash(it.dash || []);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';

      if (it.type === 'line') {
        ctx.beginPath();
        var started = false;
        for (var i = 0; i < it.xs.length; i++) {
          var x = it.xs[i], y = it.ys[i];
          if (!isFinite(x) || !isFinite(y)) { started = false; continue; }
          var X = self.px(x), Y = self.py(y);
          if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      } else if (it.type === 'area') {
        ctx.beginPath();
        var first = true, lastX = 0;
        for (var j = 0; j < it.xs.length; j++) {
          if (!isFinite(it.xs[j]) || !isFinite(it.ys[j])) continue;
          var Xa = self.px(it.xs[j]), Ya = self.py(it.ys[j]);
          if (first) { ctx.moveTo(Xa, self.py(it.base)); ctx.lineTo(Xa, Ya); first = false; }
          else ctx.lineTo(Xa, Ya);
          lastX = Xa;
        }
        ctx.lineTo(lastX, self.py(it.base));
        ctx.closePath();
        ctx.globalAlpha = it.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (it.stroke !== false) {
          ctx.beginPath();
          var st = false;
          for (var k = 0; k < it.xs.length; k++) {
            if (!isFinite(it.xs[k]) || !isFinite(it.ys[k])) { st = false; continue; }
            var Xs = self.px(it.xs[k]), Ys = self.py(it.ys[k]);
            if (!st) { ctx.moveTo(Xs, Ys); st = true; } else ctx.lineTo(Xs, Ys);
          }
          ctx.stroke();
        }
      } else if (it.type === 'bars') {
        var n = it.xs.length;
        /* barw fixa a largura em unidades de dados; sem ela a largura sai do
           espacamento entre barras (e uma serie de uma barra so ocuparia
           metade do grafico) */
        var bw;
        if (isFinite(it.barw)) bw = Math.abs(self.px(it.xs[0] + it.barw) - self.px(it.xs[0]));
        else if (n > 1) bw = Math.abs(self.px(it.xs[1]) - self.px(it.xs[0])) * it.width;
        else bw = a.w * 0.5;
        ctx.globalAlpha = it.alpha;
        for (var m = 0; m < n; m++) {
          if (!isFinite(it.ys[m])) continue;
          var Xb = self.px(it.xs[m]), Y0 = self.py(0), Yb = self.py(it.ys[m]);
          ctx.fillRect(Xb - bw / 2, Math.min(Y0, Yb), bw, Math.abs(Yb - Y0));
        }
        ctx.globalAlpha = 1;
      } else if (it.type === 'points') {
        for (var q = 0; q < it.xs.length; q++) {
          if (!isFinite(it.xs[q]) || !isFinite(it.ys[q])) continue;
          ctx.beginPath();
          ctx.arc(self.px(it.xs[q]), self.py(it.ys[q]), it.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (it.type === 'hline') {
        ctx.beginPath();
        ctx.moveTo(a.x, self.py(it.y)); ctx.lineTo(a.x + a.w, self.py(it.y));
        ctx.stroke();
        if (it.text) {
          tarja(ctx, it.text, a.x + a.w - 5, self.py(it.y) - 9, color, 'right');
        }
      } else if (it.type === 'vline') {
        ctx.beginPath();
        ctx.moveTo(self.px(it.x), a.y); ctx.lineTo(self.px(it.x), a.y + a.h);
        ctx.stroke();
        if (it.text) {
          /* na horizontal, do lado em que couber, e uma linha abaixo da
             anterior quando ha varias verticais no mesmo grafico */
          ctx.font = '10.5px ' + cssVar('--font', 'sans-serif');
          var X = self.px(it.x);
          var larg = ctx.measureText(it.text).width;
          var cabeDireita = X + larg + 12 < a.x + a.w;
          var Y = a.y + 10 + (nVert % 3) * 15;
          nVert++;
          tarja(ctx, it.text, X, Y, color, cabeDireita ? 'left' : 'right');
        }
      } else if (it.type === 'text') {
        ctx.font = (it.weight || '') + ' ' + (it.size || 11) + 'px ' + cssVar('--font', 'sans-serif');
        ctx.textAlign = it.align; ctx.textBaseline = it.baseline;
        ctx.fillStyle = it.color || cText;
        ctx.fillText(it.str, self.px(it.x) + (it.dx || 0), self.py(it.y) + (it.dy || 0));
      } else if (it.type === 'marker') {
        ctx.beginPath();
        ctx.arc(self.px(it.x), self.py(it.y), it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cssVar('--bg-elev', '#fff'); ctx.lineWidth = 1.5; ctx.stroke();
        if (it.str) {
          ctx.fillStyle = it.color || cText;
          ctx.font = '600 10.5px ' + cssVar('--font', 'sans-serif');
          ctx.textAlign = it.align || 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(it.str, self.px(it.x) + (it.dx !== undefined ? it.dx : 7), self.py(it.y) + (it.dy !== undefined ? it.dy : -5));
        }
      } else if (it.type === 'custom') {
        ctx.save();
        it.fn(ctx, self);
        ctx.restore();
      }
      ctx.setLineDash([]);
    });
  };

  Plot.prototype._drawLegend = function (ctx, cText, cElev, cBorder) {
    var self = this;
    var labeled = this.items.filter(function (it) { return it.label; });
    if (!labeled.length) return;
    ctx.font = '11px ' + cssVar('--font', 'sans-serif');
    var pad = 7, lh = 15, sw = 16;
    var w = 0;
    labeled.forEach(function (it) { w = Math.max(w, ctx.measureText(it.label).width); });
    w += sw + 8 + pad * 2;
    var h = labeled.length * lh + pad * 2 - 3;
    var a = this._area;
    var lx = a.x + a.w - w - 8, ly = a.y + 8;
    if (this.o.legendPos === 'topleft') lx = a.x + 8;
    if (this.o.legendPos === 'bottomright') ly = a.y + a.h - h - 8;
    if (this.o.legendPos === 'bottomleft') { lx = a.x + 8; ly = a.y + a.h - h - 8; }

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = cElev;
    ctx.strokeStyle = cBorder; ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(lx, ly, w, h, 6); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(lx, ly, w, h); ctx.strokeRect(lx, ly, w, h); }
    ctx.globalAlpha = 1;

    labeled.forEach(function (it, i) {
      var idx = self.items.indexOf(it);
      var color = it.color || serie(idx);
      var yy = ly + pad + i * lh + 6;
      ctx.strokeStyle = color; ctx.lineWidth = it.width || 2;
      ctx.setLineDash(it.dash || []);
      ctx.beginPath(); ctx.moveTo(lx + pad, yy); ctx.lineTo(lx + pad + sw, yy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cText;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(it.label, lx + pad + sw + 7, yy);
    });
  };

  /* ---------- utilitarios numericos ---------- */
  var util = {
    linspace: function (a, b, n) {
      n = Math.max(2, n | 0);
      var out = new Array(n), st = (b - a) / (n - 1);
      for (var i = 0; i < n; i++) out[i] = a + st * i;
      return out;
    },
    map: function (xs, fn) {
      var out = new Array(xs.length);
      for (var i = 0; i < xs.length; i++) out[i] = fn(xs[i], i);
      return out;
    },
    /* Bisseccao para f(x)=0 em [a,b] */
    bissec: function (f, a, b, tol, itmax) {
      tol = tol || 1e-10; itmax = itmax || 200;
      var fa = f(a), fb = f(b);
      if (fa * fb > 0) return NaN;
      var m = a;
      for (var i = 0; i < itmax; i++) {
        m = 0.5 * (a + b);
        var fm = f(m);
        if (Math.abs(fm) < tol || (b - a) / 2 < tol) return m;
        if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
      }
      return m;
    },
    /* Ponto fixo / Newton numerico */
    newton: function (f, x0, tol, itmax) {
      tol = tol || 1e-10; itmax = itmax || 100;
      var x = x0;
      for (var i = 0; i < itmax; i++) {
        var h = Math.max(1e-8, Math.abs(x) * 1e-7);
        var fx = f(x);
        var d = (f(x + h) - f(x - h)) / (2 * h);
        if (!isFinite(d) || d === 0) break;
        var xn = x - fx / d;
        if (Math.abs(xn - x) < tol) return xn;
        x = xn;
      }
      return x;
    },
    /* Integracao cumulativa (trapezio) */
    cumtrapz: function (xs, ys) {
      var out = new Array(xs.length); out[0] = 0;
      for (var i = 1; i < xs.length; i++) {
        out[i] = out[i - 1] + 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]);
      }
      return out;
    },
    trapz: function (xs, ys) {
      var s = 0;
      for (var i = 1; i < xs.length; i++) s += 0.5 * (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]);
      return s;
    },
    /* Runge-Kutta 4 para y' = f(t,y), y vetor */
    rk4: function (f, t0, y0, dt, n) {
      var ts = [t0], ys = [y0.slice()], y = y0.slice(), t = t0;
      var add = function (a, b, s) { return a.map(function (v, i) { return v + s * b[i]; }); };
      for (var i = 0; i < n; i++) {
        var k1 = f(t, y);
        var k2 = f(t + dt / 2, add(y, k1, dt / 2));
        var k3 = f(t + dt / 2, add(y, k2, dt / 2));
        var k4 = f(t + dt, add(y, k3, dt));
        y = y.map(function (v, j) { return v + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
        t += dt;
        ts.push(t); ys.push(y.slice());
      }
      return { t: ts, y: ys };
    },
    /* Formata numero com N algarismos significativos */
    sig: function (v, n) {
      if (!isFinite(v)) return '--';
      if (v === 0) return '0';
      n = n || 4;
      var a = Math.abs(v);
      if (a >= 1e6 || a < 1e-4) return v.toExponential(n - 1).replace('e+', 'e');
      return String(Number(v.toPrecision(n)));
    },
    clamp: function (v, a, b) { return Math.min(b, Math.max(a, v)); }
  };

  /* numero formatado para dentro de uma expressao LaTeX:
     virgula decimal e potencia de dez de verdade */
  function numTex(v, n) {
    if (!isFinite(v)) return '\text{--}';
    if (v === 0) return '0';
    n = n || 4;
    var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) {
      var e = Math.floor(Math.log10(a));
      var m = v / Math.pow(10, e);
      return String(Number(m.toPrecision(n))).replace('.', '{,}') +
             ' \\times 10^{' + e + '}';
    }
    return String(Number(v.toPrecision(n))).replace('.', '{,}');
  }

  var API = {
    create: function (canvas, opts) { return new Plot(canvas, opts); },
    numTex: numTex,
    serie: serie,
    cssVar: cssVar,
    fmt: fmt,
    Plot: Plot
  };
  Object.assign(API, util);

  global.Plot = API;
})(window);

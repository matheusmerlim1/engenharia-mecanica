/* ============================================================
   Ciência dos Materiais I — simuladores
     1. sim-fec          : diagrama ferro-carbono interativo, com
                           resfriamento lento ANIMADO e a microestrutura
                           se formando junto
     2. sim-isomorfo     : solidificação de uma liga isomorfa (Cu-Ni),
                           regra da alavanca e segregação
     3. sim-discordancias: movimento de discordância e os quatro
                           mecanismos de endurecimento
     4. sim-difusao      : cementação — 2ª lei de Fick com o perfil de
                           carbono avançando no tempo

   Pontos invariantes do diagrama Fe-Fe3C usados aqui:
     peritético  0,17 %C a 1493 °C
     eutético    4,30 %C a 1147 °C   (L → γ + Fe3C, ledeburita)
     eutetoide   0,76 %C a  727 °C   (γ → α + Fe3C, perlita)
     solubilidade máxima de C: 2,14 % em γ a 1147 °C
                               0,022 % em α a 727 °C
     Fe3C = 6,67 %C · Fe puro funde a 1538 °C
   ============================================================ */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  /* ---------- laço de animação compartilhado ---------- */
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
    if (L < 1e-6) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(11, L * 0.34);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.42, y2 - uy * h - ux * h * 0.42);
    c.lineTo(x2 - ux * h - uy * h * 0.42, y2 - uy * h + ux * h * 0.42);
    c.closePath(); c.fill();
  }

  /* gerador pseudoaleatório determinístico: a microestrutura precisa ser
     a mesma a cada quadro, senão os grãos "fervem" na tela */
  function semente(s) {
    var x = s || 1;
    return function () {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return x / 0x7fffffff;
    };
  }

  /* ============================================================
     Diagrama Fe-Fe3C — as linhas de fronteira
     ============================================================ */
  var FEC = (function () {
    var Ceut = 0.76, Teut = 727;        /* eutetoide */
    var Cec = 4.30, Tec = 1147;         /* eutético */
    var Cmax = 2.14;                    /* C máximo em γ */
    var Calfa = 0.022;                  /* C máximo em α */
    var CFe3C = 6.67;
    var Tfe = 1538, Tper = 1493, Cper = 0.17;

    /* A3: fronteira γ / (α + γ), de (0, 912) a (0,76, 727) */
    function A3(C) {
      if (C <= 0) return 912;
      if (C >= Ceut) return Teut;
      var t = C / Ceut;
      return 912 - (912 - Teut) * Math.pow(t, 0.62);
    }
    /* Acm: fronteira γ / (γ + Fe3C), de (0,76, 727) a (2,14, 1147) */
    function Acm(C) {
      if (C <= Ceut) return Teut;
      if (C >= Cmax) return Tec;
      var t = (C - Ceut) / (Cmax - Ceut);
      return Teut + (Tec - Teut) * Math.pow(t, 0.78);
    }
    /* solvus da ferrita: C máximo dissolvido em α */
    function solvusAlfa(T) {
      if (T >= Teut) return Calfa;
      var t = Math.max(0, (T - 200) / (Teut - 200));
      return Calfa * Math.pow(t, 2.2);
    }
    /* liquidus */
    function liquidus(C) {
      if (C <= Cper) return Tfe - (Tfe - Tper) * (C / Cper);
      if (C <= Cec) {
        var t = (C - Cper) / (Cec - Cper);
        return Tper - (Tper - Tec) * Math.pow(t, 0.86);
      }
      var u = (C - Cec) / (CFe3C - Cec);
      return Tec + (1227 - Tec) * Math.pow(u, 0.72);
    }
    /* solidus do lado da austenita: de (0,17, 1493) a (2,14, 1147) */
    function solidus(C) {
      if (C <= Cper) return Tfe - (Tfe - Tper) * (C / Cper);
      if (C >= Cmax) return Tec;
      var t = (C - Cper) / (Cmax - Cper);
      return Tper - (Tper - Tec) * Math.pow(t, 0.70);
    }

    /* Que fases existem em (C, T)? Devolve nomes, composições e frações. */
    function fases(C, T) {
      var r = { lista: [], regiao: '', obs: '' };
      function par(nome, comp, frac, cor) {
        r.lista.push({ nome: nome, C: comp, W: frac, cor: cor });
      }
      var Tliq = liquidus(C);
      if (T >= Tliq) {
        r.regiao = 'Líquido';
        par('Líquido', C, 1, 0);
        r.obs = 'Acima da linha liquidus tudo está fundido.';
        return r;
      }
      if (T >= Tec) {
        if (C < Cmax) {
          /* L + γ */
          var Cs = 0, Cl = 0;
          /* na temperatura T, a composição do sólido sai da solidus e a do
             líquido, da liquidus — ambas invertidas numericamente */
          Cs = invSolidus(T); Cl = invLiquidus(T);
          var Ws = (Cl - C) / (Cl - Cs);
          Ws = Math.max(0, Math.min(1, Ws));
          if (T >= solidus(C)) {
            r.regiao = 'Líquido + Austenita (γ)';
            par('Líquido', Cl, 1 - Ws, 0);
            par('Austenita γ', Cs, Ws, 1);
            r.obs = 'Zona pastosa: cristais de γ crescem dentro do líquido.';
          } else {
            r.regiao = 'Austenita (γ)';
            par('Austenita γ', C, 1, 1);
            r.obs = 'Solução sólida CFC: o carbono cabe nos interstícios octaédricos.';
          }
          return r;
        }
        /* C > 2,14 acima de 1147: líquido + γ ou líquido + Fe3C */
        if (C < Cec) {
          var Cl2 = invLiquidus(T), Cs2 = Cmax;
          var Ws2 = (Cl2 - C) / (Cl2 - Cs2);
          r.regiao = 'Líquido + Austenita (γ)';
          par('Líquido', Cl2, 1 - Ws2, 0);
          par('Austenita γ', Cs2, Ws2, 1);
          r.obs = 'Ferro fundido hipoeutético: austenita primária dentro do líquido.';
          return r;
        }
        var Cl3 = invLiquidusDir(T);
        var Wc = (C - Cl3) / (CFe3C - Cl3);
        r.regiao = 'Líquido + Cementita (Fe₃C)';
        par('Líquido', Cl3, 1 - Wc, 0);
        par('Cementita Fe₃C', CFe3C, Wc, 3);
        r.obs = 'Ferro fundido hipereutético: cementita primária em placas.';
        return r;
      }
      /* abaixo de 1147 */
      if (C > Cmax) {
        /* γ + Fe3C, com a γ vindo da Acm */
        if (T >= Teut) {
          var Cg = Cmax;
          var Wg = (CFe3C - C) / (CFe3C - Cg);
          r.regiao = 'Austenita + Cementita';
          par('Austenita γ', Cg, Wg, 1);
          par('Cementita Fe₃C', CFe3C, 1 - Wg, 3);
          r.obs = 'Ferro fundido: a ledeburita já se formou.';
          return r;
        }
      }
      if (T >= Teut) {
        if (C <= Calfa) {
          if (T >= A3(C)) { r.regiao = 'Austenita (γ)'; par('Austenita γ', C, 1, 1); return r; }
          r.regiao = 'Ferrita (α)'; par('Ferrita α', C, 1, 2);
          r.obs = 'Solução sólida CCC: mal dissolve carbono, no máximo 0,022 %.';
          return r;
        }
        if (C < Ceut) {
          if (T >= A3(C)) {
            r.regiao = 'Austenita (γ)';
            par('Austenita γ', C, 1, 1);
            r.obs = 'Solução sólida CFC: o carbono cabe nos interstícios octaédricos.';
            return r;
          }
          /* α + γ: ferrita proeutetoide nucleando no contorno de grão */
          var Ca = solvusAlfa(T), Cg2 = invA3(T);
          var Wa = (Cg2 - C) / (Cg2 - Ca);
          Wa = Math.max(0, Math.min(1, Wa));
          r.regiao = 'Ferrita (α) + Austenita (γ)';
          par('Ferrita α', Ca, Wa, 2);
          par('Austenita γ', Cg2, 1 - Wa, 1);
          r.obs = 'A ferrita proeutetoide nucleia nos contornos de grão da austenita e '
                + 'expulsa carbono, enriquecendo a γ que sobra.';
          return r;
        }
        if (T >= Acm(C)) {
          r.regiao = 'Austenita (γ)'; par('Austenita γ', C, 1, 1); return r;
        }
        var Cg3 = invAcm(T);
        var Wg3 = (CFe3C - C) / (CFe3C - Cg3);
        r.regiao = 'Austenita (γ) + Cementita (Fe₃C)';
        par('Austenita γ', Cg3, Wg3, 1);
        par('Cementita Fe₃C', CFe3C, 1 - Wg3, 3);
        r.obs = 'A cementita proeutetoide precipita em rede nos contornos de grão — '
              + 'é ela que fragiliza o aço hipereutetoide.';
        return r;
      }
      /* abaixo de 727: α + Fe3C */
      var Ca2 = solvusAlfa(T);
      var Wa2 = (CFe3C - C) / (CFe3C - Ca2);
      Wa2 = Math.max(0, Math.min(1, Wa2));
      r.regiao = 'Ferrita (α) + Cementita (Fe₃C)';
      par('Ferrita α', Ca2, Wa2, 2);
      par('Cementita Fe₃C', CFe3C, 1 - Wa2, 3);
      r.obs = 'Estrutura final de equilíbrio de todo aço: ferrita mole com cementita dura dispersa.';
      return r;
    }

    /* inversões numéricas das curvas */
    function inverter(f, Talvo, a, b) {
      for (var i = 0; i < 50; i++) {
        var m = (a + b) / 2;
        if (f(m) > Talvo) a = m; else b = m;
      }
      return (a + b) / 2;
    }
    function invA3(T) { return inverter(A3, T, 0, Ceut); }
    function invAcm(T) { return inverter(function (C) { return -Acm(C); }, -T, Ceut, Cmax); }
    function invLiquidus(T) { return inverter(liquidus, T, 0, Cec); }
    function invLiquidusDir(T) { return inverter(function (C) { return -liquidus(C); }, -T, Cec, CFe3C); }
    function invSolidus(T) { return inverter(solidus, T, 0, Cmax); }

    /* classe da liga */
    function classe(C) {
      if (C < 0.022) return { n: 'Ferro comercialmente puro', d: 'praticamente só ferrita' };
      if (C < 0.25) return { n: 'Aço de baixo carbono', d: 'dúctil e soldável; estrutura, chapas, perfis' };
      if (C < 0.76) return { n: 'Aço hipoeutetoide de médio carbono', d: 'ferrita proeutetoide + perlita; eixos, engrenagens' };
      if (Math.abs(C - 0.76) < 0.02) return { n: 'Aço eutetoide', d: '100 % perlita; trilhos, arames' };
      if (C <= 2.14) return { n: 'Aço hipereutetoide de alto carbono', d: 'cementita em rede + perlita; ferramentas, molas' };
      if (C < 4.30) return { n: 'Ferro fundido hipoeutético', d: 'austenita primária + ledeburita' };
      if (Math.abs(C - 4.30) < 0.05) return { n: 'Ferro fundido eutético', d: '100 % ledeburita; o de menor ponto de fusão' };
      return { n: 'Ferro fundido hipereutético', d: 'cementita primária + ledeburita; muito frágil' };
    }

    /* microconstituintes à temperatura ambiente, em equilíbrio */
    function microTemp(C) {
      var out = [];
      if (C <= Calfa) {
        out.push({ nome: 'Ferrita α', W: 1, cor: 2 });
        return out;
      }
      if (C < Ceut) {
        var Wpro = (Ceut - C) / (Ceut - Calfa);
        out.push({ nome: 'Ferrita proeutetoide', W: Wpro, cor: 2 });
        out.push({ nome: 'Perlita', W: 1 - Wpro, cor: 4 });
        return out;
      }
      if (Math.abs(C - Ceut) < 0.02) {
        out.push({ nome: 'Perlita', W: 1, cor: 4 });
        return out;
      }
      if (C <= Cmax) {
        var Wcem = (C - Ceut) / (CFe3C - Ceut);
        out.push({ nome: 'Perlita', W: 1 - Wcem, cor: 4 });
        out.push({ nome: 'Cementita proeutetoide', W: Wcem, cor: 3 });
        return out;
      }
      if (C < Cec) {
        var Wled = (C - Cmax) / (Cec - Cmax);
        out.push({ nome: 'Perlita (da austenita primária)', W: 1 - Wled, cor: 4 });
        out.push({ nome: 'Ledeburita transformada', W: Wled, cor: 5 });
        return out;
      }
      var Wcp = (C - Cec) / (CFe3C - Cec);
      out.push({ nome: 'Ledeburita transformada', W: 1 - Wcp, cor: 5 });
      out.push({ nome: 'Cementita primária', W: Wcp, cor: 3 });
      return out;
    }

    return { Ceut: Ceut, Teut: Teut, Cec: Cec, Tec: Tec, Cmax: Cmax, Calfa: Calfa,
             CFe3C: CFe3C, Tfe: Tfe, Tper: Tper, Cper: Cper,
             A3: A3, Acm: Acm, solvusAlfa: solvusAlfa, liquidus: liquidus, solidus: solidus,
             fases: fases, classe: classe, microTemp: microTemp,
             invA3: invA3, invAcm: invAcm, invLiquidus: invLiquidus, invSolidus: invSolidus };
  })();

  /* ============================================================
     1. Diagrama ferro-carbono com resfriamento animado
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-fec')) return;

    var A = { on: true, T: 1600, rel: relogio(), ctx: null, p: null, vel: 1 };

    /* ---- desenho da microestrutura no estado (C, T) ---- */
    function desenharMicro(c, pl, C, T) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var f = FEC.fases(C, T);

      /* moldura circular, como o campo de um microscópio */
      var cx = a.x + a.w * 0.30, cy = a.y + a.h * 0.54;
      var R = Math.min(a.w * 0.26, a.h * 0.40);

      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
      c.fillRect(cx - R, cy - R, 2 * R, 2 * R);

      var rnd = semente(7);
      var grao = [];
      var nG = 15;
      for (var i = 0; i < nG; i++) {
        grao.push({ x: cx + (rnd() - 0.5) * 2.3 * R, y: cy + (rnd() - 0.5) * 2.3 * R });
      }

      var Tliq = FEC.liquidus(C);
      var Tsol = C <= FEC.Cmax ? FEC.solidus(C) : FEC.Tec;

      if (T >= Tliq) {
        /* líquido: pontos agitados */
        c.fillStyle = Plot.serie(0);
        for (i = 0; i < 200; i++) {
          c.globalAlpha = 0.35 + 0.4 * rnd();
          c.beginPath();
          c.arc(cx + (rnd() - 0.5) * 2 * R, cy + (rnd() - 0.5) * 2 * R, 2 + rnd() * 2, 0, TAU);
          c.fill();
        }
        c.globalAlpha = 1;
      } else {
        /* fração solidificada */
        var fsol = T >= Tsol ? Math.max(0, Math.min(1, (Tliq - T) / Math.max(Tliq - Tsol, 1e-6))) : 1;
        if (fsol < 1) {
          c.fillStyle = Plot.serie(0); c.globalAlpha = 0.5;
          c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
          c.globalAlpha = 1;
        }
        /* grãos (células de Voronoi aproximadas por círculos crescentes) */
        var raioG = R * (0.30 + 0.55 * fsol);
        grao.forEach(function (g, k) {
          if (k / nG > fsol + 0.02) return;
          c.beginPath();
          c.arc(g.x, g.y, raioG * (0.7 + 0.5 * ((k * 37) % 11) / 11), 0, TAU);
          /* cor conforme a fase dominante daquele instante */
          var faseCor = 1;                                   /* austenita */
          if (T < FEC.Teut) faseCor = 2;
          c.fillStyle = Plot.serie(faseCor);
          c.globalAlpha = 0.55;
          c.fill();
          c.globalAlpha = 1;
          c.strokeStyle = Plot.cssVar('--bg-elev', '#fff');
          c.lineWidth = 1.6;
          c.stroke();
        });

        /* ferrita ou cementita proeutetoide no contorno de grão */
        if (T < FEC.Teut || (T < (C < FEC.Ceut ? FEC.A3(C) : FEC.Acm(C)) && T >= FEC.Teut)) {
          var proC = C < FEC.Ceut ? 2 : 3;
          var espes = 3 + 7 * (C < FEC.Ceut ? (FEC.Ceut - Math.min(C, FEC.Ceut)) / FEC.Ceut
                                            : Math.min(1, (C - FEC.Ceut) / 1.4));
          c.strokeStyle = Plot.serie(proC);
          c.lineWidth = espes;
          c.globalAlpha = 0.75;
          grao.forEach(function (g, k) {
            c.beginPath();
            c.arc(g.x, g.y, raioG * (0.7 + 0.5 * ((k * 37) % 11) / 11), 0, TAU);
            c.stroke();
          });
          c.globalAlpha = 1;
        }

        /* perlita: lamelas dentro dos grãos, abaixo de 727 */
        if (T < FEC.Teut && C > FEC.Calfa) {
          var Wp = C < FEC.Ceut ? (C - FEC.Calfa) / (FEC.Ceut - FEC.Calfa)
                                : (FEC.CFe3C - Math.min(C, FEC.CFe3C)) / (FEC.CFe3C - FEC.Ceut);
          Wp = Math.max(0, Math.min(1, Wp));
          grao.forEach(function (g, k) {
            if (rnd() > Wp) return;
            var rg = raioG * (0.7 + 0.5 * ((k * 37) % 11) / 11) * 0.82;
            var ang = ((k * 53) % 180) * Math.PI / 180;
            c.save();
            c.beginPath(); c.arc(g.x, g.y, rg, 0, TAU); c.clip();
            c.translate(g.x, g.y); c.rotate(ang);
            c.strokeStyle = Plot.serie(3); c.lineWidth = 1.6;
            for (var y = -rg; y <= rg; y += 5) {
              c.beginPath(); c.moveTo(-rg, y); c.lineTo(rg, y); c.stroke();
            }
            c.restore();
          });
        }
      }
      c.restore();

      c.strokeStyle = Plot.cssVar('--border', '#ddd'); c.lineWidth = 2.4;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();

      /* legenda das fases presentes */
      var lx = a.x + a.w * 0.60, ly = a.y + a.h * 0.22;
      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(f.regiao, lx, ly);
      ly += 22;
      f.lista.forEach(function (q) {
        c.fillStyle = Plot.serie(q.cor);
        c.fillRect(lx, ly + 2, 13, 13);
        c.fillStyle = cor; c.font = fonte(11.5, '600');
        c.fillText(q.nome, lx + 20, ly + 1);
        c.fillStyle = faint; c.font = fonte(10.5);
        c.fillText(Plot.sig(q.W * 100, 3) + ' %   ·   ' + Plot.sig(q.C, 3) + ' %C',
                   lx + 20, ly + 16);
        ly += 34;
      });
      c.fillStyle = faint; c.font = fonte(10.5);
      var palavras = f.obs.split(' ');
      var linha = '', linhas = [];
      palavras.forEach(function (w) {
        if ((linha + ' ' + w).length > 42) { linhas.push(linha); linha = w; }
        else linha = linha ? linha + ' ' + w : w;
      });
      if (linha) linhas.push(linha);
      linhas.forEach(function (t, i2) { c.fillText(t, lx, ly + 6 + i2 * 14); });

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Microestrutura a ' + Math.round(T) + ' °C', a.x + 4, a.y + 2);
      c.font = fonte(10.5);
      c.fillStyle = faint;
      c.fillText('representação esquemática — o objetivo é ver O QUE aparece e quando, não a escala real',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-fec', {
      titulo: 'Diagrama ferro-carbono — resfriamento lento animado',
      descricao: 'Escolha o teor de carbono e desça a temperatura: o ponto caminha pelo diagrama, as fases mudam e a microestrutura se forma junto, do líquido até a perlita.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Aço de baixo carbono (0,2 %C)', desc: 'Muita ferrita, pouca perlita — dúctil e soldável',
          valores: { C: 0.20, T: 1600, animar: true, vel: 1 } },
        { nome: '2 · Aço eutetoide (0,76 %C)', desc: '100 % perlita: a austenita se decompõe de uma vez a 727 °C',
          valores: { C: 0.76, T: 1600, animar: true, vel: 1 } },
        { nome: '3 · Aço hipoeutetoide (0,45 %C)', desc: 'Ferrita proeutetoide nos contornos + perlita nos grãos',
          valores: { C: 0.45, T: 1600, animar: true, vel: 1 } },
        { nome: '4 · Aço hipereutetoide (1,2 %C)', desc: 'Cementita em REDE nos contornos: é ela que fragiliza',
          valores: { C: 1.20, T: 1600, animar: true, vel: 1 } },
        { nome: '5 · Ferro fundido eutético (4,3 %C)', desc: 'Menor ponto de fusão de todos: 1147 °C',
          valores: { C: 4.30, T: 1600, animar: true, vel: 1 } },
        { nome: '6 · Ferro fundido hipoeutético (3,0 %C)', desc: 'Austenita primária dentro do líquido, depois ledeburita',
          valores: { C: 3.00, T: 1600, animar: true, vel: 1 } },
        { nome: '7 · Parado a 800 °C, aço 0,45 %', desc: 'Região α + γ: veja a regra da alavanca em ação',
          valores: { C: 0.45, T: 800, animar: false, vel: 1 } }
      ],
      controles: [
        { id: 'C', label: 'Teor de carbono', min: 0, max: 6.67, step: 0.01, valor: 0.45, unidade: '%C',
          desc: 'Até 2,14 % é aço; acima disso, ferro fundido.' },
        { id: 'T', label: 'Temperatura', min: 400, max: 1600, step: 5, valor: 1600, unidade: '°C' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Resfriar lentamente', valor: true,
          desc: 'Desce a temperatura sozinha, do líquido até 400 °C, e recomeça.' },
        { id: 'vel', label: 'Velocidade do resfriamento', min: 0.2, max: 4, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'diag', titulo: 'Diagrama de equilíbrio Fe-Fe₃C',
          xlabel: 'Carbono (% em massa)', ylabel: 'Temperatura (°C)', aspect: 0.62,
          legend: false },
        { id: 'micro', axes: false, height: 340, grid: false, legend: false },
        { id: 'consti', titulo: 'Microconstituintes à temperatura ambiente (equilíbrio)',
          xlabel: '', ylabel: 'Fração em massa (%)', aspect: 0.28, legend: false }
      ],
      saidas: [
        { id: 'classe', label: 'Classe da liga' },
        { id: 'regiao', label: 'Região do diagrama' },
        { id: 'f1', label: 'Fase 1' },
        { id: 'f2', label: 'Fase 2' },
        { id: 'A1', label: 'Temperatura A₁' },
        { id: 'A3', label: 'A₃ ou A_cm' },
        { id: 'dureza', label: 'Dureza estimada (recozido)' },
        { id: 'sut', label: 'Resistência estimada' }
      ],
      formulas: [
        { g: 'Regra da alavanca' },
        { tex: 'W_\\alpha = \\frac{C_\\gamma - C_0}{C_\\gamma - C_\\alpha} \\qquad W_\\gamma = \\frac{C_0 - C_\\alpha}{C_\\gamma - C_\\alpha}',
          d: 'a fração de cada fase é o braço OPOSTO da alavanca dividido pelo total', destaque: true },
        { tex: 'W_\\alpha + W_\\gamma = 1', d: 'conferência obrigatória: as frações somam 1' },
        { tex: '\\text{braço oposto} \\;\\Rightarrow\\; \\text{quanto mais perto de uma fase, mais dela existe}',
          d: 'o erro clássico é usar o braço do mesmo lado' },

        { g: 'Pontos invariantes do diagrama' },
        { tex: '\\text{Eutetoide: } \\gamma_{0{,}76} \\to \\alpha_{0{,}022} + Fe_3C_{6{,}67} \\ \\text{ a } 727\\ ^\\circ C',
          d: 'sólido → dois sólidos; o produto lamelar é a PERLITA', destaque: true },
        { tex: '\\text{Eutético: } L_{4{,}30} \\to \\gamma_{2{,}14} + Fe_3C \\ \\text{ a } 1147\\ ^\\circ C',
          d: 'líquido → dois sólidos; o produto é a LEDEBURITA', destaque: true },
        { tex: '\\text{Peritético: } L_{0{,}53} + \\delta_{0{,}09} \\to \\gamma_{0{,}17} \\ \\text{ a } 1493\\ ^\\circ C',
          d: 'líquido + sólido → outro sólido; sem importância prática nos aços comuns' },

        { g: 'Frações à temperatura ambiente' },
        { tex: 'W_{\\alpha,\\text{total}} = \\frac{6{,}67 - C_0}{6{,}67 - 0{,}022}',
          d: 'toda a ferrita, proeutetoide mais a que está dentro da perlita', destaque: true },
        { tex: 'W_{Fe_3C,\\text{total}} = \\frac{C_0 - 0{,}022}{6{,}67 - 0{,}022}',
          d: 'toda a cementita' },
        { tex: 'W_{\\alpha\'} = \\frac{0{,}76 - C_0}{0{,}76 - 0{,}022} \\qquad W_{\\text{perlita}} = \\frac{C_0 - 0{,}022}{0{,}76 - 0{,}022}',
          d: 'aço HIPOeutetoide: ferrita proeutetoide e perlita', destaque: true },
        { tex: 'W_{Fe_3C\'} = \\frac{C_0 - 0{,}76}{6{,}67 - 0{,}76} \\qquad W_{\\text{perlita}} = \\frac{6{,}67 - C_0}{6{,}67 - 0{,}76}',
          d: 'aço HIPEReutetoide: cementita proeutetoide e perlita', destaque: true },

        { g: 'As fases, uma a uma' },
        { tex: '\\alpha \\ \\text{(ferrita)}: \\ CCC, \\ 0{,}022\\%C \\ \\text{máx}',
          d: 'mole (80 HB) e muito dúctil; magnética abaixo de 768 °C' },
        { tex: '\\gamma \\ \\text{(austenita)}: \\ CFC, \\ 2{,}14\\%C \\ \\text{máx}',
          d: 'dissolve 100× mais carbono que a ferrita — é isso que torna a têmpera possível', destaque: true },
        { tex: 'Fe_3C \\ \\text{(cementita)}: \\ 6{,}67\\%C, \\ \\text{ortorrômbica}',
          d: 'duríssima (~800 HV) e frágil; é um carbeto, não uma solução sólida' },
        { tex: '\\delta: \\ CCC \\ \\text{de alta temperatura}', d: 'só acima de 1394 °C; sem relevância prática' },

        { g: 'Microconstituintes (não são fases)' },
        { tex: '\\text{Perlita} = \\alpha + Fe_3C \\ \\text{em lamelas alternadas}',
          d: '88 % ferrita e 12 % cementita, em camadas — daí o aspecto de madrepérola', destaque: true },
        { tex: '\\text{Ledeburita} = \\gamma + Fe_3C \\ \\text{do eutético}',
          d: 'abaixo de 727 °C a γ dela vira perlita: é a "ledeburita transformada"' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Diagrama Fe-Fe₃C metaestável (o estável seria Fe-grafita) e resfriamento em EQUILÍBRIO, isto é, lento o bastante para a difusão acompanhar. Resfriamento rápido produz bainita e martensita, que não aparecem neste diagrama — isso é assunto das curvas TTT, em Ciência dos Materiais II.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.p = p; A.on = !!p.animar; A.vel = p.vel;
        if (!p.animar) A.T = p.T;
        var T = p.animar ? A.T : p.T;
        var C = p.C;

        /* ---------- diagrama ---------- */
        var g = ctx.plot('diag').clear();
        var Cs = Plot.linspace(0, FEC.CFe3C, 200);
        g.setLimits([0, FEC.CFe3C], [400, 1600]);

        /* liquidus e solidus */
        g.line(Cs, Cs.map(FEC.liquidus), { color: Plot.serie(0), width: 2.2 });
        var Cs2 = Plot.linspace(0, FEC.Cmax, 80);
        g.line(Cs2, Cs2.map(FEC.solidus), { color: Plot.serie(0), width: 1.8 });
        /* A3 e Acm */
        var Ca = Plot.linspace(0, FEC.Ceut, 60);
        g.line(Ca, Ca.map(FEC.A3), { color: Plot.serie(1), width: 2.2 });
        var Cb = Plot.linspace(FEC.Ceut, FEC.Cmax, 60);
        g.line(Cb, Cb.map(FEC.Acm), { color: Plot.serie(1), width: 2.2 });
        /* horizontais invariantes */
        g.line([0, FEC.CFe3C], [FEC.Teut, FEC.Teut], { color: Plot.serie(3), width: 2.2 });
        g.line([FEC.Cmax, FEC.CFe3C], [FEC.Tec, FEC.Tec], { color: Plot.serie(3), width: 2.2 });
        g.line([0.09, 0.53], [FEC.Tper, FEC.Tper], { color: Plot.serie(3), width: 1.6 });
        /* solvus da ferrita e limite da cementita */
        var Ts = Plot.linspace(400, FEC.Teut, 40);
        g.line(Ts.map(FEC.solvusAlfa), Ts, { color: Plot.serie(2), width: 1.6 });
        g.line([FEC.CFe3C, FEC.CFe3C], [400, 1227], { color: Plot.serie(3), width: 2.4 });

        /* rótulos das regiões */
        [[0.4, 1520, 'L'], [1.0, 1300, 'γ + L'], [1.2, 1000, 'γ (austenita)'],
         [0.30, 790, 'α + γ'], [1.55, 900, 'γ + Fe₃C'], [1.6, 600, 'α + Fe₃C'],
         [3.2, 1300, 'L + γ'], [5.4, 1300, 'L + Fe₃C'], [3.4, 950, 'γ + Fe₃C'],
         [4.6, 600, 'α + Fe₃C  (ledeburita transformada)']].forEach(function (q) {
          g.text(q[0], q[1], q[2], { align: 'center', size: 10.5,
            color: Plot.cssVar('--text-muted', '#666') });
        });
        /* pontos invariantes */
        g.marker(FEC.Ceut, FEC.Teut, 'eutetoide 0,76 % · 727 °C', { color: Plot.serie(5), r: 5,
          align: 'left', dx: 8 });
        g.marker(FEC.Cec, FEC.Tec, 'eutético 4,30 % · 1147 °C', { color: Plot.serie(5), r: 5,
          align: 'right', dx: -8 });

        /* linha da liga e ponto atual */
        g.vline(C, { color: Plot.serie(6), dash: [4, 3], width: 1.6,
          text: 'liga com ' + Plot.sig(C, 3) + ' %C' });
        g.marker(C, T, Math.round(T) + ' °C', { color: Plot.serie(6), r: 6 });
        g.draw();

        /* ---------- microestrutura ---------- */
        desenhaMicro();

        /* ---------- microconstituintes ---------- */
        var mc = FEC.microTemp(C);
        var gc = ctx.plot('consti').clear();
        gc.o.xcat = mc.map(function (q, i) { return { v: i, label: q.nome }; });
        var alto = Math.max.apply(null, mc.map(function (q) { return q.W; }));
        gc.setLimits([-0.62, mc.length - 0.38], [0, Math.max(alto * 118, 20)]);
        mc.forEach(function (q, i) {
          gc.bars([i], [q.W * 100], { color: Plot.serie(q.cor), barw: 0.5 });
          gc.text(i, q.W * 100, Plot.sig(q.W * 100, 3) + ' %',
            { align: 'center', dy: -7, size: 11 });
        });
        gc.draw();

        /* ---------- saídas e passos ---------- */
        var f = FEC.fases(C, T);
        var cl = FEC.classe(C);
        var Wp = 0;
        mc.forEach(function (q) { if (q.nome.indexOf('Perlita') === 0) Wp = q.W; });
        var Wcem = C <= FEC.Ceut ? 0 : (C - FEC.Ceut) / (FEC.CFe3C - FEC.Ceut);
        var HB = C <= FEC.Cmax
          ? 80 + 170 * Wp + 480 * Wcem
          : 250 + 300 * Math.min(1, (C - FEC.Cmax) / 2);
        var sut = 3.45 * HB;

        var nt = Plot.numTex, sg = Plot.sig;
        var passos = [];
        passos.push({ t: 'Classificar a liga pelo teor de carbono',
          tex: 'C_0 = ' + nt(C) + '\\%',
          texSub: C < FEC.Ceut ? 'C_0 < 0{,}76\\% \\;\\Rightarrow\\; \\text{HIPOeutetoide}'
            : (Math.abs(C - FEC.Ceut) < 0.02 ? 'C_0 = 0{,}76\\% \\;\\Rightarrow\\; \\text{EUTETOIDE}'
              : (C <= FEC.Cmax ? 'C_0 > 0{,}76\\% \\;\\Rightarrow\\; \\text{HIPEReutetoide}'
                : 'C_0 > 2{,}14\\% \\;\\Rightarrow\\; \\text{FERRO FUNDIDO}')),
          obs: cl.n + ': ' + cl.d + '. A fronteira aço/ferro fundido é 2,14 %, que é a máxima '
            + 'solubilidade de carbono na austenita — acima dela sempre sobra líquido para formar '
            + 'o eutético.' });
        passos.push({ t: 'Temperaturas críticas desta liga',
          tex: 'A_1 = 727\\ ^\\circ C \\qquad ' + (C < FEC.Ceut ? 'A_3' : 'A_{cm}'),
          texSub: 'A_1 = 727\\ ^\\circ C \\qquad ' + (C < FEC.Ceut ? 'A_3 = ' + nt(FEC.A3(C))
            : 'A_{cm} = ' + nt(FEC.Acm(Math.min(C, FEC.Cmax)))) + '\\ ^\\circ C',
          obs: 'A₁ é a horizontal do eutetoide e vale 727 °C para qualquer teor. '
            + (C < FEC.Ceut
              ? 'A₃ é onde a ferrita começa a aparecer ao resfriar — abaixo dela a austenita já não é estável sozinha.'
              : 'A_cm é onde a cementita começa a precipitar da austenita ao resfriar.') });
        if (f.lista.length === 2) {
          var q1 = f.lista[0], q2 = f.lista[1];
          passos.push({ t: 'Regra da alavanca a ' + Math.round(T) + ' °C',
            tex: 'W_1 = \\frac{C_2 - C_0}{C_2 - C_1}',
            texSub: 'W_1 = \\frac{' + nt(q2.C) + ' - ' + nt(C) + '}{' + nt(q2.C) + ' - ' +
              nt(q1.C) + '} = ' + nt(q1.W) + ' \\qquad W_2 = ' + nt(q2.W),
            obs: 'A conodal (linha horizontal) corta as duas fronteiras em ' + sg(q1.C, 3) +
              ' e ' + sg(q2.C, 3) + ' %C. A fração de cada fase é o braço OPOSTO sobre o total: '
              + q1.nome + ' fica com ' + sg(q1.W * 100, 3) + ' % e ' + q2.nome + ' com ' +
              sg(q2.W * 100, 3) + ' %. Somando: ' + sg((q1.W + q2.W) * 100, 4) + ' %.' });
        }
        if (C > FEC.Calfa && C <= FEC.Cmax) {
          if (C < FEC.Ceut) {
            passos.push({ t: 'Microconstituintes abaixo de 727 °C',
              tex: 'W_{\\alpha\'} = \\frac{0{,}76 - C_0}{0{,}76 - 0{,}022} \\qquad W_{\\text{perlita}} = \\frac{C_0 - 0{,}022}{0{,}76 - 0{,}022}',
              texSub: 'W_{\\alpha\'} = \\frac{0{,}76 - ' + nt(C) + '}{0{,}738} = ' +
                nt((FEC.Ceut - C) / (FEC.Ceut - FEC.Calfa)) + ' \\qquad W_{\\text{perlita}} = ' +
                nt((C - FEC.Calfa) / (FEC.Ceut - FEC.Calfa)),
              obs: 'Ao cruzar A₃, a ferrita proeutetoide nucleia nos contornos de grão da austenita '
                + 'e vai expulsando carbono. Quando a austenita restante chega a 0,76 %, ela atinge '
                + '727 °C e se decompõe DE UMA VEZ em perlita.' });
          } else {
            passos.push({ t: 'Microconstituintes abaixo de 727 °C',
              tex: 'W_{Fe_3C\'} = \\frac{C_0 - 0{,}76}{6{,}67 - 0{,}76} \\qquad W_{\\text{perlita}} = \\frac{6{,}67 - C_0}{6{,}67 - 0{,}76}',
              texSub: 'W_{Fe_3C\'} = \\frac{' + nt(C) + ' - 0{,}76}{5{,}91} = ' +
                nt((C - FEC.Ceut) / (FEC.CFe3C - FEC.Ceut)) + ' \\qquad W_{\\text{perlita}} = ' +
                nt((FEC.CFe3C - C) / (FEC.CFe3C - FEC.Ceut)),
              obs: 'A cementita proeutetoide precipita formando uma REDE contínua nos contornos de '
                + 'grão. Como ela é duríssima e frágil, essa rede é um caminho fácil para a trinca — '
                + 'por isso aço hipereutetoide sempre passa por esferoidização antes de usinar.' });
          }
          passos.push({ t: 'Fases totais (somando o que está dentro da perlita)',
            tex: 'W_{\\alpha} = \\frac{6{,}67 - C_0}{6{,}648} \\qquad W_{Fe_3C} = \\frac{C_0 - 0{,}022}{6{,}648}',
            texSub: 'W_{\\alpha} = ' + nt((FEC.CFe3C - C) / (FEC.CFe3C - FEC.Calfa)) +
              ' \\qquad W_{Fe_3C} = ' + nt((C - FEC.Calfa) / (FEC.CFe3C - FEC.Calfa)),
            obs: 'Não confunda: FASES são ferrita e cementita, e só existem duas. '
              + 'MICROCONSTITUINTES são o que se enxerga no microscópio — ferrita proeutetoide, '
              + 'perlita, ledeburita — e a perlita, sozinha, já é um arranjo das duas fases.' });
        }
        passos.push({ t: 'Estimativa de dureza e resistência',
          tex: 'HB \\approx 80 + 170\\,W_{\\text{perlita}} \\qquad \\sigma_u \\approx 3{,}45\\,HB',
          texSub: 'HB \\approx ' + nt(HB) + ' \\;\\Rightarrow\\; \\sigma_u \\approx ' +
            nt(sut) + '\\ \\mathrm{MPa}',
          obs: 'Estimativa para o estado RECOZIDO. A ferrita vale cerca de 80 HB e a perlita, 250 HB; '
            + 'a dureza cresce quase linearmente com a fração de perlita. Temperado, o mesmo aço '
            + 'passaria facilmente de 600 HB — mas aí a estrutura é martensita, e este diagrama não '
            + 'a prevê.' });
        ctx.setPassos(passos);

        return {
          classe: { v: cl.n, u: '', classe: 'destaque' },
          regiao: { v: f.regiao, u: '' },
          f1: { v: f.lista[0] ? f.lista[0].nome + ' ' + Plot.sig(f.lista[0].W * 100, 3) + ' %' : '—', u: '' },
          f2: { v: f.lista[1] ? f.lista[1].nome + ' ' + Plot.sig(f.lista[1].W * 100, 3) + ' %' : '—', u: '' },
          A1: { v: 727, u: '°C' },
          A3: { v: C < FEC.Ceut ? FEC.A3(C) : FEC.Acm(Math.min(C, FEC.Cmax)), u: '°C' },
          dureza: { v: HB, u: 'HB' },
          sut: { v: sut, u: 'MPa' }
        };
      }
    });

    function desenhaMicro() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('micro');
      if (!pl) return;
      var T = A.on ? A.T : A.p.T;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharMicro(c, plot, A.p.C, T); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.T -= dt * 70 * A.vel;
      if (A.T < 400) A.T = 1600;
      desenhaMicro();
      /* o ponto desce pelo diagrama junto com a microestrutura */
      var g = A.ctx.plot('diag');
      if (g) {
        g.draw();
        var c2 = g.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath(); c2.arc(g.px(A.p.C), g.py(A.T), 6.5, 0, TAU); c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 2; c2.stroke();
        /* tarja atras do numero, para nao se perder sobre a curva nem
           colidir com o rotulo da linha da liga */
        var txt = Math.round(A.T) + ' °C';
        c2.font = fonte(11, '700');
        var lg = c2.measureText(txt).width;
        var bx2 = g.px(A.p.C) + 11;
        if (bx2 + lg + 8 > g._area.x + g._area.w) bx2 = g.px(A.p.C) - lg - 19;
        c2.globalAlpha = 0.9;
        c2.fillStyle = Plot.cssVar('--bg-elev', '#fff');
        c2.fillRect(bx2 - 3, g.py(A.T) - 8, lg + 6, 16);
        c2.globalAlpha = 1;
        c2.fillStyle = Plot.serie(6);
        c2.textAlign = 'left'; c2.textBaseline = 'middle';
        c2.fillText(txt, bx2, g.py(A.T));
        c2.restore();
      }
    });
  })();

  /* ============================================================
     2. Liga isomorfa (Cu-Ni) — solidificação e segregação
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-isomorfo')) return;

    var A = { on: true, T: 1500, rel: relogio(), ctx: null, p: null, vel: 1 };

    /* Lente Cu-Ni: ancorada nos pontos de fusão dos metais puros
       (Cu 1085 °C, Ni 1455 °C) e na abertura de cerca de 45 °C no meio. */
    function liq(x) { return 1085 + 370 * x + 170 * x * (1 - x); }
    function sol(x) { return 1085 + 370 * x - 130 * x * (1 - x) * (1 - 0.35 * x); }
    function inv(f, T, a, b) {
      for (var i = 0; i < 50; i++) { var m = (a + b) / 2; if (f(m) < T) a = m; else b = m; }
      return (a + b) / 2;
    }

    function estado(x0, T) {
      var Tl = liq(x0), Ts = sol(x0);
      if (T >= Tl) return { fase: 'Líquido', WL: 1, WS: 0, xL: x0, xS: NaN, Tl: Tl, Ts: Ts };
      if (T <= Ts) return { fase: 'Sólido α', WL: 0, WS: 1, xL: NaN, xS: x0, Tl: Tl, Ts: Ts };
      var xL = inv(liq, T, 0, 1);
      var xS = inv(sol, T, 0, 1);
      var WS = (x0 - xL) / (xS - xL);
      WS = Math.max(0, Math.min(1, WS));
      return { fase: 'Líquido + α', WL: 1 - WS, WS: WS, xL: xL, xS: xS, Tl: Tl, Ts: Ts };
    }

    function desenharMicro(c, pl, p, e) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var cx = a.x + a.w * 0.28, cy = a.y + a.h * 0.55;
      var R = Math.min(a.w * 0.24, a.h * 0.38);

      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      /* líquido de fundo */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.30;
      c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      c.globalAlpha = 1;

      var rnd = semente(11);
      var nucleos = [];
      for (var i = 0; i < 9; i++) {
        nucleos.push({ x: cx + (rnd() - 0.5) * 1.9 * R, y: cy + (rnd() - 0.5) * 1.9 * R,
                       f: 0.55 + rnd() * 0.9 });
      }
      /* grãos crescem com a fração sólida; cada anel tem a composição de quando se formou */
      var fs = e.WS;
      nucleos.forEach(function (n) {
        var rg = R * 0.46 * n.f * Math.pow(fs, 0.5);
        if (rg < 1) return;
        var camadas = 6;
        for (var k = camadas; k >= 1; k--) {
          var frac = k / camadas;
          /* o núcleo (k pequeno) solidificou primeiro e é mais rico no de maior
             ponto de fusão — é a segregação, ou coring */
          var riqueza = p.segregar ? 1 - 0.75 * (1 - frac) : 0.45;
          c.beginPath(); c.arc(n.x, n.y, rg * frac, 0, TAU);
          c.fillStyle = Plot.serie(riqueza > 0.6 ? 2 : 1);
          c.globalAlpha = 0.35 + 0.5 * riqueza;
          c.fill();
        }
        c.globalAlpha = 1;
        c.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c.lineWidth = 1.6;
        c.beginPath(); c.arc(n.x, n.y, rg, 0, TAU); c.stroke();
        /* braços de dendrita */
        if (fs > 0.05 && fs < 0.92) {
          c.strokeStyle = Plot.serie(1); c.lineWidth = 2; c.globalAlpha = 0.7;
          for (var b = 0; b < 4; b++) {
            var ang = b * Math.PI / 2 + n.f;
            c.beginPath();
            c.moveTo(n.x, n.y);
            c.lineTo(n.x + Math.cos(ang) * rg * 1.5, n.y + Math.sin(ang) * rg * 1.5);
            c.stroke();
          }
          c.globalAlpha = 1;
        }
      });
      c.restore();
      c.strokeStyle = Plot.cssVar('--border', '#ddd'); c.lineWidth = 2.4;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();

      var lx = a.x + a.w * 0.58, ly = a.y + a.h * 0.24;
      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(e.fase + ' a ' + Math.round(A.on ? A.T : p.T) + ' °C', lx, ly);
      ly += 24;
      c.font = fonte(11.5, '600');
      if (e.WL > 0.001) {
        c.fillStyle = Plot.serie(0); c.fillRect(lx, ly + 2, 13, 13);
        c.fillStyle = cor;
        c.fillText('Líquido  ' + Plot.sig(e.WL * 100, 3) + ' %', lx + 20, ly + 1);
        c.fillStyle = faint; c.font = fonte(10.5);
        c.fillText(isFinite(e.xL) ? Plot.sig(e.xL * 100, 3) + ' % Ni' : '', lx + 20, ly + 16);
        ly += 34;
      }
      if (e.WS > 0.001) {
        c.font = fonte(11.5, '600');
        c.fillStyle = Plot.serie(1); c.fillRect(lx, ly + 2, 13, 13);
        c.fillStyle = cor;
        c.fillText('Sólido α  ' + Plot.sig(e.WS * 100, 3) + ' %', lx + 20, ly + 1);
        c.fillStyle = faint; c.font = fonte(10.5);
        c.fillText(isFinite(e.xS) ? Plot.sig(e.xS * 100, 3) + ' % Ni' : '', lx + 20, ly + 16);
        ly += 34;
      }
      c.fillStyle = faint; c.font = fonte(10.5);
      c.fillText(p.segregar
        ? 'Cores diferentes dentro do grão = segregação: o miolo'
        : 'Resfriamento lento: composição uniforme dentro do grão.', lx, ly + 6);
      if (p.segregar) {
        c.fillText('solidificou primeiro e é mais rico em níquel.', lx, ly + 20);
      }

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Solidificação de uma liga isomorfa Cu-Ni', a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('isomorfa = solubilidade total nos dois estados: não há eutético nem composto',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-isomorfo', {
      titulo: 'Liga isomorfa Cu-Ni — solidificação e regra da alavanca',
      descricao: 'O caso mais simples de diagrama binário: cobre e níquel se dissolvem um no outro em qualquer proporção, sólidos ou líquidos. Resfrie e veja os grãos crescerem, a composição mudar e a segregação aparecer.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · 35 % Ni, resfriamento de equilíbrio', desc: 'Difusão acompanha: grão de composição uniforme',
          valores: { x: 35, T: 1500, segregar: false, animar: true, vel: 1 } },
        { nome: '2 · 35 % Ni, resfriamento real', desc: 'A difusão no sólido não acompanha: aparece a segregação',
          valores: { x: 35, T: 1500, segregar: true, animar: true, vel: 1 } },
        { nome: '3 · Parado no meio da lente', desc: 'Regra da alavanca no ponto de máxima diferença',
          valores: { x: 50, T: 1290, segregar: true, animar: false, vel: 1 } },
        { nome: '4 · Rico em cobre (15 % Ni)', desc: 'Solidifica logo abaixo do ponto de fusão do cobre',
          valores: { x: 15, T: 1500, segregar: true, animar: true, vel: 1 } },
        { nome: '5 · Rico em níquel (80 % Ni)', desc: 'Precisa de temperatura muito mais alta',
          valores: { x: 80, T: 1500, segregar: true, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'x', label: 'Teor de níquel', min: 0, max: 100, step: 1, valor: 35, unidade: '% Ni' },
        { id: 'T', label: 'Temperatura', min: 1000, max: 1500, step: 5, valor: 1500, unidade: '°C' },
        { tipo: 'separador' },
        { id: 'segregar', tipo: 'check', label: 'Mostrar segregação (resfriamento real)', valor: true,
          desc: 'Na prática a difusão no sólido é lenta demais e o grão fica com o miolo diferente da casca.' },
        { id: 'animar', tipo: 'check', label: 'Resfriar', valor: true },
        { id: 'vel', label: 'Velocidade', min: 0.2, max: 4, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'diag', titulo: 'Diagrama Cu-Ni (isomorfo)', xlabel: 'Níquel (% em massa)',
          ylabel: 'Temperatura (°C)', aspect: 0.52, legendPos: 'topleft' },
        { id: 'micro', axes: false, height: 320, grid: false, legend: false }
      ],
      saidas: [
        { id: 'fase', label: 'Fases presentes' },
        { id: 'Tl', label: 'Liquidus desta liga' },
        { id: 'Ts', label: 'Solidus desta liga' },
        { id: 'WL', label: 'Fração de líquido' },
        { id: 'WS', label: 'Fração de sólido' },
        { id: 'xL', label: 'Composição do líquido' },
        { id: 'xS', label: 'Composição do sólido' },
        { id: 'faixa', label: 'Intervalo de solidificação' }
      ],
      formulas: [
        { g: 'Regra da alavanca' },
        { tex: 'W_S = \\frac{C_0 - C_L}{C_S - C_L} \\qquad W_L = \\frac{C_S - C_0}{C_S - C_L}',
          d: 'a conodal liga as duas fronteiras; a fração é o braço OPOSTO sobre o total', destaque: true },
        { tex: 'W_S + W_L = 1', d: 'conferência obrigatória' },

        { g: 'O que caracteriza um sistema isomorfo' },
        { tex: '\\text{Solubilidade total nos dois estados}',
          d: 'só há uma fase sólida, α, em toda a faixa de composição', destaque: true },
        { tex: '\\text{Regras de Hume-Rothery}',
          d: 'raios atômicos dentro de 15 %, mesma estrutura cristalina, valência e eletronegatividade próximas' },
        { tex: 'Cu: CFC,\\ r = 0{,}128\\ nm \\qquad Ni: CFC,\\ r = 0{,}125\\ nm',
          d: 'diferença de apenas 2,3 % — por isso se dissolvem em qualquer proporção' },

        { g: 'Segregação (coring)' },
        { tex: '\\text{1º sólido a formar} \\Rightarrow \\text{rico no metal de MAIOR ponto de fusão}',
          d: 'no Cu-Ni, o miolo do grão é rico em níquel', destaque: true },
        { tex: '\\text{Consequência: fusão localizada abaixo do solidus}',
          d: 'a casca do grão, pobre em Ni, funde antes — problema sério em soldagem' },
        { tex: '\\text{Correção: recozimento de homogeneização}',
          d: 'mantém-se abaixo do solidus tempo suficiente para a difusão igualar tudo' },

        { g: 'Intervalo de solidificação' },
        { tex: '\\Delta T = T_{liquidus} - T_{solidus}',
          d: 'quanto maior, mais dendrítica a estrutura e mais difícil a fundição', destaque: true },
        { tex: '\\Delta T = 0 \\Rightarrow \\text{metal puro ou composição eutética}',
          d: 'solidifica a temperatura constante — daí a boa fluidez das ligas eutéticas' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'A lente Cu-Ni está ancorada nos pontos de fusão dos metais puros (Cu 1085 °C, Ni 1455 °C) e na abertura típica de cerca de 45 °C no meio da faixa. É uma representação didática: para valores de projeto use o diagrama de referência.',
      calcular: function (p, ctx) {
        A.ctx = ctx; A.p = p; A.on = !!p.animar; A.vel = p.vel;
        if (!p.animar) A.T = p.T;
        var T = p.animar ? A.T : p.T;
        var x0 = p.x / 100;
        var e = estado(x0, T);

        var xs = Plot.linspace(0, 1, 120);
        var g = ctx.plot('diag').clear();
        g.setLimits([0, 100], [1000, 1500]);
        g.line(xs.map(function (v) { return v * 100; }), xs.map(liq),
          { color: Plot.serie(0), width: 2.6, label: 'liquidus' });
        g.line(xs.map(function (v) { return v * 100; }), xs.map(sol),
          { color: Plot.serie(1), width: 2.6, label: 'solidus' });
        g.text(20, 1420, 'Líquido', { align: 'center', size: 11.5,
          color: Plot.cssVar('--text-muted', '#666') });
        g.text(72, 1120, 'Sólido α (CFC)', { align: 'center', size: 11.5,
          color: Plot.cssVar('--text-muted', '#666') });
        g.text(52, 1290, 'L + α', { align: 'center', size: 11.5,
          color: Plot.cssVar('--text-muted', '#666') });
        g.vline(p.x, { color: Plot.serie(6), dash: [4, 3], width: 1.6,
          text: 'liga: ' + p.x + ' % Ni' });
        /* conodal e os dois extremos */
        if (e.WL > 0.001 && e.WS > 0.001) {
          g.line([e.xL * 100, e.xS * 100], [T, T],
            { color: Plot.serie(3), width: 2.4, label: 'conodal' });
          g.marker(e.xL * 100, T, 'C_L = ' + Plot.sig(e.xL * 100, 3) + ' %',
            { color: Plot.serie(0), r: 5, align: 'right', dx: -8 });
          g.marker(e.xS * 100, T, 'C_S = ' + Plot.sig(e.xS * 100, 3) + ' %',
            { color: Plot.serie(1), r: 5, align: 'left', dx: 8 });
        }
        g.marker(p.x, T, Math.round(T) + ' °C', { color: Plot.serie(6), r: 6 });
        g.draw();

        desenhaMicro();

        var nt = Plot.numTex, sg = Plot.sig;
        var passos = [
          { t: 'Temperaturas de início e fim de solidificação',
            tex: 'T_{liquidus} \\quad\\text{e}\\quad T_{solidus}',
            texSub: 'T_{liq} = ' + nt(e.Tl) + '\\ ^\\circ C \\qquad T_{sol} = ' + nt(e.Ts) +
              '\\ ^\\circ C \\qquad \\Delta T = ' + nt(e.Tl - e.Ts) + '\\ ^\\circ C',
            obs: 'Ao contrário de um metal puro, a liga não funde a uma temperatura: ela tem um '
              + 'INTERVALO de ' + sg(e.Tl - e.Ts, 3) + ' °C em que líquido e sólido coexistem. '
              + 'É esse intervalo que produz a estrutura dendrítica das peças fundidas.' }
        ];
        if (e.WL > 0.001 && e.WS > 0.001) {
          passos.push({ t: 'Traçar a conodal e ler as composições',
            tex: 'C_L \\ \\text{na liquidus} \\qquad C_S \\ \\text{na solidus}',
            texSub: 'C_L = ' + nt(e.xL * 100) + '\\%\\ Ni \\qquad C_S = ' + nt(e.xS * 100) + '\\%\\ Ni',
            obs: 'A conodal é a horizontal na temperatura de interesse. Ela sempre corta a liquidus '
              + 'à ESQUERDA (líquido mais pobre no metal refratário) e a solidus à DIREITA.' });
          passos.push({ t: 'Regra da alavanca',
            tex: 'W_S = \\frac{C_0 - C_L}{C_S - C_L}',
            texSub: 'W_S = \\frac{' + nt(p.x) + ' - ' + nt(e.xL * 100) + '}{' + nt(e.xS * 100) +
              ' - ' + nt(e.xL * 100) + '} = ' + nt(e.WS) + ' \\qquad W_L = ' + nt(e.WL),
            obs: 'Repare no braço OPOSTO: para achar a fração de SÓLIDO usa-se a distância do ponto '
              + 'até a composição do LÍQUIDO. Somando: ' + sg((e.WL + e.WS) * 100, 4) + ' %.' });
        }
        passos.push({ t: 'Primeiro sólido a se formar',
          tex: 'C_S(T_{liq}) \\ \\text{— a composição do primeiro cristal}',
          texSub: 'C_S(' + nt(e.Tl) + '^\\circ C) = ' + nt(inv(sol, e.Tl, 0, 1) * 100) + '\\%\\ Ni',
          obs: 'O primeiro sólido tem ' + sg(inv(sol, e.Tl, 0, 1) * 100, 3) + ' % Ni contra ' + p.x +
            ' % da liga: é mais rico no metal de maior ponto de fusão. Se a difusão no sólido não '
            + 'acompanhar o resfriamento — e nunca acompanha, na prática — esse miolo rico fica '
            + 'preso e o grão sai SEGREGADO.' });
        ctx.setPassos(passos);

        return {
          fase: { v: e.fase, u: '', classe: 'destaque' },
          Tl: { v: e.Tl, u: '°C' },
          Ts: { v: e.Ts, u: '°C' },
          WL: { v: e.WL * 100, u: '%' },
          WS: { v: e.WS * 100, u: '%' },
          xL: { v: isFinite(e.xL) ? Plot.sig(e.xL * 100, 4) : '—', u: '% Ni' },
          xS: { v: isFinite(e.xS) ? Plot.sig(e.xS * 100, 4) : '—', u: '% Ni' },
          faixa: { v: e.Tl - e.Ts, u: '°C' }
        };
      }
    });

    function desenhaMicro() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('micro');
      if (!pl) return;
      var T = A.on ? A.T : A.p.T;
      var e = estado(A.p.x / 100, T);
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharMicro(c, plot, A.p, e); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.T -= dt * 28 * A.vel;
      if (A.T < 1000) A.T = 1500;
      desenhaMicro();
      var g = A.ctx.plot('diag');
      if (g) {
        g.draw();
        var c2 = g.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath(); c2.arc(g.px(A.p.x), g.py(A.T), 6.5, 0, TAU); c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 2; c2.stroke();
        c2.restore();
      }
    });
  })();

  /* ============================================================
     3. Discordâncias e mecanismos de endurecimento
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-discordancias')) return;

    var A = { on: true, x: 0, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };

    function resolver(p) {
      /* Hall-Petch: sigma = sigma0 + k/sqrt(d) — d em mm, k em MPa.mm^(1/2) */
      var d = p.grao / 1000;                          /* µm -> mm */
      var hp = p.k / Math.sqrt(d);
      /* solução sólida: proporcional a c^(1/2) */
      var ss = p.Ks * Math.sqrt(p.solut / 100);
      /* encruamento: sigma = K.eps^n, tomado como acréscimo sobre o recozido */
      var enc = p.eps > 0 ? p.K * Math.pow(p.eps / 100, p.n) - p.sigma0 : 0;
      enc = Math.max(0, enc);
      /* precipitação, Orowan: dsigma = G.b/L */
      var G = 80e3;                                   /* MPa */
      var b = 0.25e-6;                                /* mm */
      var L = p.espac / 1000;                         /* nm -> µm -> mm: nm*1e-6 mm */
      L = p.espac * 1e-6;
      var prec = p.precip ? G * b / L * 0.8 : 0;
      var total = p.sigma0 + hp + ss + enc + prec;
      /* ductilidade cai conforme se endurece */
      var alon = Math.max(2, 40 * Math.pow(p.sigma0 / total, 1.4));
      return { hp: hp, ss: ss, enc: enc, prec: prec, total: total, d: d, alon: alon, G: G, b: b, L: L };
    }

    function desenharPlano(c, pl, p, r, xd) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i, j;

      var x0 = a.x + a.w * 0.08, x1 = a.x + a.w * 0.92;
      var cy = a.y + a.h * 0.54;
      var passo = Math.min((x1 - x0) / 26, 24);
      var nCol = Math.floor((x1 - x0) / passo);
      var nLin = 7;
      var yTop = cy - passo * (nLin - 1) / 2;

      /* posição da discordância, em colunas */
      var xc = x0 + xd * (x1 - x0);

      /* obstáculos */
      var obst = [];
      if (p.solut > 0) {
        var rnd = semente(3);
        var nS = Math.round(p.solut * 1.6);
        for (i = 0; i < nS; i++) {
          obst.push({ col: Math.floor(rnd() * nCol), lin: Math.floor(rnd() * nLin),
                      tipo: 'sol' });
        }
      }
      if (p.precip) {
        var nP = Math.max(2, Math.round(600 / p.espac));
        for (i = 0; i < nP; i++) {
          obst.push({ col: Math.round((i + 0.5) * nCol / nP), lin: Math.floor(nLin / 2),
                      tipo: 'prec' });
        }
      }
      /* contornos de grão: quanto menor o grão, mais contornos */
      var nCont = Math.max(1, Math.round(nCol * passo / (p.grao * 1.6)));
      var contornos = [];
      for (i = 1; i <= nCont; i++) contornos.push(x0 + (x1 - x0) * i / (nCont + 1));

      /* rede de átomos, com o semiplano extra da discordância */
      c.setLineDash([]);
      for (j = 0; j < nLin; j++) {
        for (i = 0; i < nCol; i++) {
          var X = x0 + i * passo + passo / 2;
          var Y = yTop + j * passo;
          /* acima do plano de escorregamento, os átomos à direita da
             discordância são empurrados: é o semiplano extra */
          if (j < Math.floor(nLin / 2)) {
            var dist = (X - xc) / passo;
            if (dist > -0.5 && dist < 4) X += passo * 0.42 * Math.exp(-dist * dist / 4);
            if (dist >= -4 && dist <= -0.5) X -= passo * 0.30 * Math.exp(-dist * dist / 8);
          }
          c.fillStyle = Plot.serie(0);
          c.globalAlpha = 0.55;
          c.beginPath(); c.arc(X, Y, passo * 0.20, 0, TAU); c.fill();
          c.globalAlpha = 1;
        }
      }

      /* plano de escorregamento */
      var ySlip = yTop + (Math.floor(nLin / 2) - 0.5) * passo;
      c.strokeStyle = faint; c.lineWidth = 1.2; c.setLineDash([5, 4]);
      c.beginPath(); c.moveTo(x0, ySlip); c.lineTo(x1, ySlip); c.stroke();
      c.setLineDash([]);
      c.fillStyle = faint; c.font = fonte(9.5);
      c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('plano de escorregamento', x0, ySlip - 4);

      /* símbolo ⊥ da discordância em cunha */
      c.strokeStyle = Plot.serie(5); c.lineWidth = 3;
      c.beginPath();
      c.moveTo(xc, ySlip); c.lineTo(xc, ySlip - passo * 2.2);
      c.moveTo(xc - passo * 0.5, ySlip); c.lineTo(xc + passo * 0.5, ySlip);
      c.stroke();
      c.fillStyle = Plot.serie(5); c.font = fonte(11, '700');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('discordância', xc, ySlip - passo * 2.6);

      /* contornos de grão */
      c.strokeStyle = Plot.serie(2); c.lineWidth = 3;
      contornos.forEach(function (xg) {
        c.beginPath(); c.moveTo(xg, yTop - passo * 0.8); c.lineTo(xg, yTop + passo * (nLin - 0.2));
        c.stroke();
      });
      if (contornos.length) {
        c.fillStyle = Plot.serie(2); c.font = fonte(9.5, '600');
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText('contorno de grão', contornos[0], yTop + passo * (nLin - 0.1));
      }

      /* obstáculos desenhados */
      obst.forEach(function (o) {
        var X = x0 + o.col * passo + passo / 2;
        var Y = yTop + o.lin * passo;
        if (o.tipo === 'sol') {
          c.fillStyle = Plot.serie(3);
          c.beginPath(); c.arc(X, Y, passo * 0.28, 0, TAU); c.fill();
        } else {
          c.fillStyle = Plot.serie(4);
          c.beginPath(); c.arc(X, ySlip, passo * 0.42, 0, TAU); c.fill();
          c.strokeStyle = Plot.serie(4); c.lineWidth = 1.6; c.stroke();
        }
      });

      /* tensão aplicada */
      seta(c, x0 - 4, yTop - passo * 1.4, x0 + passo * 3, yTop - passo * 1.4, Plot.serie(6), 2.4, 10);
      seta(c, x1 + 4, yTop + passo * (nLin - 0.4) + passo * 0.6,
           x1 - passo * 3, yTop + passo * (nLin - 0.4) + passo * 0.6, Plot.serie(6), 2.4, 10);
      c.fillStyle = Plot.serie(6); c.font = fonte(11, '700');
      c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('τ aplicada', x0, yTop - passo * 1.7);

      /* legenda */
      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Discordância em cunha escorregando pelo cristal', a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('deformar plasticamente é mover discordâncias · endurecer é IMPEDIR esse movimento',
                 a.x + 4, a.y + 19);
      var ly = a.y + a.h - 42;
      var itens = [];
      if (p.solut > 0) itens.push([3, 'átomo de soluto']);
      if (p.precip) itens.push([4, 'precipitado']);
      if (contornos.length) itens.push([2, 'contorno de grão']);
      var lx = a.x + 6;
      itens.forEach(function (q) {
        c.fillStyle = Plot.serie(q[0]);
        c.beginPath(); c.arc(lx + 6, ly + 7, 5.5, 0, TAU); c.fill();
        c.fillStyle = faint; c.font = fonte(10);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(q[1], lx + 17, ly + 7);
        lx += 22 + c.measureText(q[1]).width;
      });
      void borda;
    }

    Sim.build('#sim-discordancias', {
      titulo: 'Discordâncias e os quatro mecanismos de endurecimento',
      descricao: 'Deformar plasticamente um metal é mover discordâncias. Todo endurecimento, sem exceção, funciona colocando obstáculos no caminho delas — e todo endurecimento custa ductilidade.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ferro recozido, grão grosseiro', desc: 'Nenhum obstáculo: mole e muito dúctil',
          valores: { sigma0: 70, grao: 250, k: 23.4, solut: 0, Ks: 300, eps: 0, K: 600, n: 0.22, precip: false, espac: 300, animar: true, vel: 1 } },
        { nome: '2 · Refino de grão', desc: 'Grão de 10 µm: o único mecanismo que endurece SEM perder tenacidade',
          valores: { sigma0: 70, grao: 10, k: 23.4, solut: 0, Ks: 300, eps: 0, K: 600, n: 0.22, precip: false, espac: 300, animar: true, vel: 1 } },
        { nome: '3 · Solução sólida', desc: 'Átomos de soluto distorcem a rede e ancoram a discordância',
          valores: { sigma0: 70, grao: 50, k: 23.4, solut: 2, Ks: 300, eps: 0, K: 600, n: 0.22, precip: false, espac: 300, animar: true, vel: 1 } },
        { nome: '4 · Encruamento a frio (30 %)', desc: 'Discordâncias se emaranham umas nas outras',
          valores: { sigma0: 70, grao: 50, k: 23.4, solut: 0, Ks: 300, eps: 30, K: 600, n: 0.22, precip: false, espac: 300, animar: true, vel: 1 } },
        { nome: '5 · Endurecimento por precipitação', desc: 'Partículas finas e próximas: o mecanismo mais eficaz',
          valores: { sigma0: 70, grao: 50, k: 23.4, solut: 0, Ks: 300, eps: 0, K: 600, n: 0.22, precip: true, espac: 80, animar: true, vel: 1 } },
        { nome: '6 · Tudo junto', desc: 'Os mecanismos somam — e a ductilidade despenca',
          valores: { sigma0: 70, grao: 8, k: 23.4, solut: 2, Ks: 300, eps: 25, K: 600, n: 0.22, precip: true, espac: 100, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'sigma0', label: 'Tensão de atrito da rede σ₀', min: 20, max: 200, step: 5, valor: 70,
          unidade: 'MPa', desc: 'O que a rede cristalina resiste sozinha, sem nenhum obstáculo.' },
        { tipo: 'titulo', label: '① Refino de grão (Hall-Petch)' },
        { id: 'grao', label: 'Tamanho de grão d', min: 1, max: 400, step: 1, valor: 50, unidade: 'µm' },
        { id: 'k', label: 'Constante k_y', min: 4, max: 45, step: 0.5, valor: 23.4,
          unidade: 'MPa·mm^½', desc: '23,4 para o ferro (= 0,74 MPa·m^½). Latão 12,4 · alumínio ≈ 2.' },
        { tipo: 'titulo', label: '② Solução sólida' },
        { id: 'solut', label: 'Teor de soluto', min: 0, max: 8, step: 0.1, valor: 0, unidade: '%' },
        { id: 'Ks', label: 'Constante do soluto', min: 50, max: 800, step: 10, valor: 300, unidade: 'MPa' },
        { tipo: 'titulo', label: '③ Encruamento' },
        { id: 'eps', label: 'Deformação a frio', min: 0, max: 60, step: 1, valor: 0, unidade: '%' },
        { id: 'K', label: 'Coeficiente de resistência K', min: 300, max: 1500, step: 25, valor: 600, unidade: 'MPa' },
        { id: 'n', label: 'Expoente de encruamento n', min: 0.05, max: 0.5, step: 0.01, valor: 0.22,
          unidade: '', desc: 'Aço baixo carbono 0,21 · latão 0,49 · alumínio 0,20' },
        { tipo: 'titulo', label: '④ Precipitação' },
        { id: 'precip', tipo: 'check', label: 'Ter precipitados', valor: false },
        { id: 'espac', label: 'Espaçamento entre partículas L', min: 30, max: 800, step: 10,
          valor: 300, unidade: 'nm', desc: 'Quanto mais próximas, mais difícil a discordância passar.' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Mover a discordância', valor: true },
        { id: 'vel', label: 'Velocidade', min: 0.1, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'plano', axes: false, height: 340, grid: false, legend: false },
        { id: 'contrib', titulo: 'De onde vem cada MPa do limite de escoamento',
          xlabel: '', ylabel: 'σ (MPa)', aspect: 0.30, legend: false },
        { id: 'hp', titulo: 'Hall-Petch: limite de escoamento × tamanho de grão',
          xlabel: 'd^(−1/2)  (mm^−½)', ylabel: 'Limite de escoamento (MPa)', aspect: 0.34,
          legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'total', label: 'Limite de escoamento' },
        { id: 'hp', label: 'Ganho por refino de grão' },
        { id: 'ss', label: 'Ganho por solução sólida' },
        { id: 'enc', label: 'Ganho por encruamento' },
        { id: 'prec', label: 'Ganho por precipitação' },
        { id: 'dmm', label: 'd^(−1/2)' },
        { id: 'alon', label: 'Alongamento estimado' },
        { id: 'domin', label: 'Mecanismo dominante' }
      ],
      formulas: [
        { g: 'A ideia central' },
        { tex: '\\text{Deformação plástica} = \\text{movimento de discordâncias}',
          d: 'romper uma ligação de cada vez custa muito menos que romper o plano inteiro de uma vez', destaque: true },
        { tex: '\\tau_{teórico} \\approx G/10 \\qquad \\tau_{real} \\approx G/10^{4}',
          d: 'a diferença de mil vezes entre o previsto e o medido foi o que revelou a existência das discordâncias' },
        { tex: '\\text{Endurecer} = \\text{dificultar esse movimento}',
          d: 'os quatro mecanismos abaixo fazem exatamente isso, de maneiras diferentes', destaque: true },

        { g: '① Refino de grão — Hall-Petch' },
        { tex: '\\sigma_y = \\sigma_0 + \\frac{k_y}{\\sqrt{d}}',
          d: 'o contorno de grão trava a discordância porque os planos não continuam do outro lado', destaque: true },
        { tex: 'd \\downarrow \\;\\Rightarrow\\; \\sigma_y \\uparrow \\ \\text{E} \\ \\text{tenacidade} \\uparrow',
          d: 'é o ÚNICO mecanismo que endurece sem fragilizar — por isso é o preferido', destaque: true },

        { g: '② Solução sólida' },
        { tex: '\\Delta\\sigma \\propto \\sqrt{c}',
          d: 'átomos de soluto distorcem a rede e criam um campo de tensões que ancora a discordância', destaque: true },
        { tex: '\\text{substitucional: raio} \\pm 15\\% \\qquad \\text{intersticial: C, N, H, B}',
          d: 'intersticiais distorcem muito mais e endurecem muito mais por átomo' },

        { g: '③ Encruamento (trabalho a frio)' },
        { tex: '\\sigma = K\\,\\varepsilon^{\\,n}',
          d: 'lei de Hollomon; n é o expoente de encruamento', destaque: true },
        { tex: '\\rho_{disc} \\uparrow \\;\\Rightarrow\\; \\text{elas se emaranham e se travam}',
          d: 'a densidade sai de 10¹⁰ para 10¹⁶ linhas por m² com deformação severa' },
        { tex: '\\text{Recozimento desfaz: recuperação} \\to \\text{recristalização} \\to \\text{crescimento}',
          d: 'a recristalização apaga o encruamento e devolve a ductilidade' },

        { g: '④ Precipitação — mecanismo de Orowan' },
        { tex: '\\Delta\\tau = \\frac{G\\,b}{L}',
          d: 'a discordância curva-se entre as partículas e deixa um anel em torno de cada uma', destaque: true },
        { tex: 'L \\downarrow \\;\\Rightarrow\\; \\Delta\\tau \\uparrow',
          d: 'partículas finas e MUITO próximas: é o segredo das ligas Al-Cu e das superligas' },
        { tex: '\\text{Superenvelhecer} \\Rightarrow \\text{partícula cresce, } L \\uparrow, \\text{ amolece}',
          d: 'existe um tempo ótimo de envelhecimento; passar dele piora' },

        { g: 'O preço de tudo isso' },
        { tex: '\\sigma_y \\uparrow \\;\\Rightarrow\\; \\text{alongamento} \\downarrow',
          d: 'com uma exceção: o refino de grão melhora as duas coisas', destaque: true }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Os mecanismos são somados linearmente, o que é uma aproximação razoável quando nenhum domina esmagadoramente. Modelos mais precisos somam em quadratura os que atuam na mesma escala.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        desenhaPlano();

        var nt = Plot.numTex, sg = Plot.sig;

        /* contribuições */
        var itens = [
          { n: 'rede σ₀', v: p.sigma0, c: 7 },
          { n: 'refino de grão', v: r.hp, c: 2 },
          { n: 'solução sólida', v: r.ss, c: 3 },
          { n: 'encruamento', v: r.enc, c: 5 },
          { n: 'precipitação', v: r.prec, c: 4 },
          { n: 'TOTAL', v: r.total, c: 0 }
        ];
        var gc = ctx.plot('contrib').clear();
        gc.o.xcat = itens.map(function (q, i) { return { v: i, label: q.n }; });
        gc.setLimits([-0.62, itens.length - 0.38], [0, r.total * 1.24]);
        itens.forEach(function (q, i) {
          gc.bars([i], [q.v], { color: Plot.serie(q.c), barw: 0.5 });
          gc.text(i, q.v, Plot.sig(q.v, 4), { align: 'center', dy: -7, size: 11 });
        });
        gc.draw();

        /* Hall-Petch */
        var ds = Plot.linspace(1, 400, 90);
        var gh = ctx.plot('hp').clear();
        gh.line(ds.map(function (d) { return 1 / Math.sqrt(d / 1000); }),
                ds.map(function (d) { return p.sigma0 + p.k / Math.sqrt(d / 1000); }),
          { color: Plot.serie(0), width: 2.6, label: 'σ_y = σ₀ + k_y·d^(−1/2)' });
        gh.hline(p.sigma0, { color: Plot.serie(7), dash: [4, 3], width: 1.3,
          text: 'σ₀ = ' + p.sigma0 + ' MPa (intercepto)' });
        gh.marker(1 / Math.sqrt(r.d), p.sigma0 + r.hp,
          'd = ' + p.grao + ' µm', { color: Plot.serie(6) });
        gh.draw();

        var maiores = itens.slice(1, 5).sort(function (a2, b2) { return b2.v - a2.v; });
        ctx.setPassos([
          { t: '① Refino de grão — equação de Hall-Petch',
            tex: '\\sigma_y = \\sigma_0 + \\frac{k_y}{\\sqrt{d}}',
            texSub: '\\Delta\\sigma = \\frac{' + nt(p.k) + '}{\\sqrt{' + nt(r.d) + '}} = ' +
              nt(r.hp) + '\\ \\mathrm{MPa}',
            obs: 'd = ' + p.grao + ' µm = ' + sg(r.d, 3) + ' mm. O contorno de grão bloqueia a '
              + 'discordância porque os planos cristalinos mudam de orientação do outro lado: ela '
              + 'não tem por onde continuar. Reduzir o grão de 250 para 10 µm neste material '
              + 'acrescentaria ' + sg(p.k / Math.sqrt(0.010) - p.k / Math.sqrt(0.250), 4) + ' MPa.' },
          { t: '② Endurecimento por solução sólida',
            tex: '\\Delta\\sigma = K_s\\sqrt{c}',
            texSub: '\\Delta\\sigma = ' + p.Ks + '\\sqrt{' + nt(p.solut / 100) + '} = ' +
              nt(r.ss) + '\\ \\mathrm{MPa}',
            obs: p.solut > 0
              ? 'O átomo de soluto tem raio diferente do solvente e distorce a rede em volta. Essa '
                + 'distorção cria um campo de tensões que atrai e prende a discordância — para '
                + 'soltá-la é preciso mais tensão.'
              : 'Sem soluto neste caso. Note que a dependência é com a RAIZ do teor: dobrar o '
                + 'soluto não dobra o ganho.' },
          { t: '③ Encruamento — lei de Hollomon',
            tex: '\\sigma = K\\varepsilon^{\\,n}',
            texSub: p.eps > 0
              ? '\\sigma = ' + p.K + ' \\cdot ' + nt(p.eps / 100) + '^{' + nt(p.n) + '} = ' +
                nt(p.K * Math.pow(p.eps / 100, p.n)) + '\\ \\mathrm{MPa} \\;\\Rightarrow\\; ' +
                '\\Delta\\sigma = ' + nt(r.enc) + '\\ \\mathrm{MPa}'
              : '\\varepsilon = 0 \\;\\Rightarrow\\; \\text{material recozido, sem encruamento}',
            obs: 'Deformando a frio, a densidade de discordâncias sobe de 10¹⁰ para até 10¹⁶ por m². '
              + 'Elas passam a se cruzar e a se travar umas nas outras. O preço é a ductilidade: '
              + 'com ' + p.eps + ' % de deformação a frio o alongamento cai para cerca de '
              + sg(r.alon, 3) + ' %.' },
          { t: '④ Precipitação — mecanismo de Orowan',
            tex: '\\Delta\\tau = \\frac{G\\,b}{L}',
            texSub: p.precip
              ? '\\Delta\\tau = \\frac{80\\,000 \\cdot 0{,}25\\times 10^{-6}}{' + nt(r.L) +
                '} \\;\\Rightarrow\\; \\Delta\\sigma \\approx ' + nt(r.prec) + '\\ \\mathrm{MPa}'
              : '\\text{sem precipitados neste caso}',
            obs: 'A discordância não consegue atravessar a partícula dura: ela se curva entre duas '
              + 'vizinhas até fechar um anel em torno de cada uma e seguir adiante. Quanto MENOR o '
              + 'espaçamento L, mais apertada a curva e maior a tensão necessária. É por isso que '
              + 'superenvelhecer amolece: as partículas engrossam e se afastam.' },
          { t: 'Soma e o preço em ductilidade',
            tex: '\\sigma_y = \\sigma_0 + \\Delta\\sigma_{\\text{grão}} + \\Delta\\sigma_{\\text{sol}} + \\Delta\\sigma_{\\text{enc}} + \\Delta\\sigma_{\\text{prec}}',
            texSub: '\\sigma_y = ' + p.sigma0 + ' + ' + nt(r.hp) + ' + ' + nt(r.ss) + ' + ' +
              nt(r.enc) + ' + ' + nt(r.prec) + ' = ' + nt(r.total) + '\\ \\mathrm{MPa}',
            obs: 'O mecanismo que mais contribui aqui é ' + maiores[0].n + ', com ' +
              sg(maiores[0].v, 4) + ' MPa. Alongamento estimado: ' + sg(r.alon, 3) + ' %. '
              + 'Guarde a exceção: refinar o grão é o único caminho que sobe a resistência E a '
              + 'tenacidade ao mesmo tempo — todos os outros trocam ductilidade por resistência.' }
        ]);

        return {
          total: { v: r.total, u: 'MPa', classe: 'destaque' },
          hp: { v: r.hp, u: 'MPa' },
          ss: { v: r.ss, u: 'MPa' },
          enc: { v: r.enc, u: 'MPa' },
          prec: { v: r.prec, u: 'MPa' },
          dmm: { v: 1 / Math.sqrt(r.d), u: 'mm^−½' },
          alon: { v: r.alon, u: '%', classe: r.alon < 8 ? 'alerta' : '' },
          domin: { v: maiores[0].n, u: '' }
        };
      }
    });

    function desenhaPlano() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('plano');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharPlano(c, plot, A.p, A.r, A.x); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p || !A.r) return;
      var dt = A.rel.dt();
      /* quanto mais duro o material, mais devagar a discordância avança */
      var vel = 0.30 * A.vel * (A.p.sigma0 / Math.max(A.r.total, 1)) * 3;
      A.x += dt * vel;
      if (A.x > 1) A.x = 0;
      desenhaPlano();
    });
  })();

  /* ============================================================
     4. Difusão — cementação de um aço
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-difusao')) return;

    var A = { on: true, t: 0, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };

    /* função erro, por série e por aproximação racional */
    function erf(x) {
      var s = x < 0 ? -1 : 1;
      x = Math.abs(x);
      var t = 1 / (1 + 0.3275911 * x);
      var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
        - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return s * y;
    }
    function invErf(y) {
      var a = 0, b = 3;
      for (var i = 0; i < 60; i++) { var m = (a + b) / 2; if (erf(m) < y) a = m; else b = m; }
      return (a + b) / 2;
    }

    /* pares D0 [m²/s] e Q [J/mol] */
    var PARES = {
      cfe:  { nome: 'C em ferro γ (CFC)', D0: 2.3e-5, Q: 148000, obs: 'a cementação clássica' },
      cfea: { nome: 'C em ferro α (CCC)', D0: 6.2e-7, Q: 80000, obs: 'muito mais rápido, mas a α dissolve pouquíssimo C' },
      nfe:  { nome: 'N em ferro α (CCC)', D0: 3.0e-7, Q: 76100, obs: 'nitretação, feita a 500-550 °C' },
      fefe: { nome: 'Fe em ferro γ (autodifusão)', D0: 5.0e-5, Q: 284000, obs: 'substitucional: precisa de lacuna, por isso o Q é alto' },
      cual: { nome: 'Cu em alumínio', D0: 6.5e-5, Q: 136000, obs: 'envelhecimento das ligas Al-Cu' },
      znCu: { nome: 'Zn em cobre', D0: 2.4e-5, Q: 189000, obs: 'homogeneização do latão' }
    };

    function resolver(p) {
      var par = PARES[p.par];
      var R = 8.314;
      var T = p.T + 273.15;
      var D = par.D0 * Math.exp(-par.Q / (R * T));
      var t = p.t * 3600;                                   /* h -> s */
      var raiz = Math.sqrt(D * t);
      /* profundidade de camada até o teor de corte */
      var alvo = (p.Cs - p.Cc) / (p.Cs - p.C0);
      var z = alvo > 0 && alvo < 1 ? invErf(alvo) : NaN;
      var camada = isFinite(z) ? z * 2 * raiz * 1000 : NaN;  /* mm */
      return { par: par, D: D, t: t, raiz: raiz, camada: camada, z: z, T: T,
               conc: function (x) {                          /* x em mm */
                 if (raiz <= 0) return p.C0;
                 return p.Cs - (p.Cs - p.C0) * erf(x / 1000 / (2 * raiz));
               } };
    }

    function desenharPeca(c, pl, p, r, tAtual) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');

      var x0 = a.x + a.w * 0.10, x1 = a.x + a.w * 0.62;
      var yTop = a.y + a.h * 0.30, yBot = a.y + a.h * 0.78;
      var prof = 3.0;                                        /* mm mostrados */

      /* gradiente de carbono pintado faixa a faixa */
      var n = 90;
      for (var i = 0; i < n; i++) {
        var xa = x0 + (x1 - x0) * i / n;
        var xb = x0 + (x1 - x0) * (i + 1) / n;
        var xmm = prof * i / n;
        var Cx = r.conc(xmm);
        var f = Math.max(0, Math.min(1, (Cx - p.C0) / Math.max(p.Cs - p.C0, 1e-9)));
        c.fillStyle = Plot.serie(5);
        c.globalAlpha = 0.12 + 0.72 * f;
        c.fillRect(xa, yTop, xb - xa + 1, yBot - yTop);
      }
      c.globalAlpha = 1;
      c.strokeStyle = Plot.cssVar('--border', '#ddd'); c.lineWidth = 2;
      c.strokeRect(x0, yTop, x1 - x0, yBot - yTop);

      /* átomos de carbono difundindo */
      var rnd = semente(21);
      c.fillStyle = Plot.serie(3);
      for (i = 0; i < 130; i++) {
        var u = rnd();
        var xmm2 = prof * Math.pow(u, 2.4) * (0.3 + 0.7 * Math.min(1, tAtual / Math.max(p.t, 0.1)));
        var Cx2 = r.conc(xmm2);
        if (rnd() > (Cx2 - p.C0) / Math.max(p.Cs - p.C0, 1e-9)) continue;
        var X = x0 + (x1 - x0) * xmm2 / prof;
        var Y = yTop + 6 + rnd() * (yBot - yTop - 12);
        c.globalAlpha = 0.85;
        c.beginPath(); c.arc(X, Y, 2.6, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;

      /* atmosfera rica em carbono, à esquerda */
      c.fillStyle = Plot.serie(5); c.globalAlpha = 0.20;
      c.fillRect(x0 - 40, yTop, 38, yBot - yTop);
      c.globalAlpha = 1;
      for (i = 0; i < 5; i++) {
        var ya = yTop + (yBot - yTop) * (i + 0.5) / 5;
        seta(c, x0 - 34, ya, x0 - 5, ya, Plot.serie(5), 1.8, 7);
      }
      c.fillStyle = Plot.serie(5); c.font = fonte(10, '600');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('atmosfera', x0 - 21, yTop - 6);
      c.fillText('C_s = ' + p.Cs + ' %', x0 - 21, yTop - 18);

      /* profundidade de camada */
      if (isFinite(r.camada) && r.camada < prof) {
        var Xc = x0 + (x1 - x0) * r.camada / prof;
        c.strokeStyle = Plot.serie(2); c.lineWidth = 2.2; c.setLineDash([5, 4]);
        c.beginPath(); c.moveTo(Xc, yTop - 4); c.lineTo(Xc, yBot + 4); c.stroke();
        c.setLineDash([]);
        c.fillStyle = Plot.serie(2); c.font = fonte(11, '700');
        c.textAlign = 'center'; c.textBaseline = 'top';
        c.fillText('camada ' + Plot.sig(r.camada, 3) + ' mm', Xc, yBot + 8);
      }

      /* escala */
      c.strokeStyle = faint; c.fillStyle = faint; c.lineWidth = 1;
      c.font = fonte(9.5);
      c.textAlign = 'center'; c.textBaseline = 'top';
      for (i = 0; i <= 3; i++) {
        var Xm = x0 + (x1 - x0) * i / 3;
        c.beginPath(); c.moveTo(Xm, yBot); c.lineTo(Xm, yBot + 5); c.stroke();
        c.fillText((prof * i / 3).toFixed(1), Xm, yBot + 24);
      }
      c.fillText('profundidade a partir da superfície (mm)', (x0 + x1) / 2, yBot + 38);

      /* dados */
      var lx = a.x + a.w * 0.70, ly = a.y + a.h * 0.32;
      c.fillStyle = cor; c.font = fonte(11.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(r.par.nome, lx, ly);
      c.font = fonte(10.5); c.fillStyle = faint;
      [['T = ' + p.T + ' °C', 22],
       ['D = ' + Plot.sig(r.D, 3) + ' m²/s', 38],
       ['t = ' + Plot.sig(tAtual, 3) + ' h', 54],
       ['√(Dt) = ' + Plot.sig(r.raiz * 1000, 3) + ' mm', 70],
       ['camada = ' + (isFinite(r.camada) ? Plot.sig(r.camada, 3) + ' mm' : '—'), 86]
      ].forEach(function (q) { c.fillText(q[0], lx, ly + q[1]); });

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Cementação — o carbono entrando pela superfície', a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('a cor é o teor de carbono · a camada dura cresce com a RAIZ do tempo',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-difusao', {
      titulo: 'Difusão — cementação e a 2ª lei de Fick',
      descricao: 'Endurecer a superfície sem endurecer o núcleo: é assim que se faz uma engrenagem que resiste ao desgaste nos dentes e absorve impacto no corpo. A camada cresce com a raiz do tempo, e é isso que torna dobrar a espessura tão caro.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Cementação padrão a 925 °C', desc: 'Cinco horas dão cerca de 1 mm de camada',
          valores: { par: 'cfe', T: 925, t: 5, Cs: 1.2, C0: 0.2, Cc: 0.4, animar: true, vel: 1 } },
        { nome: '2 · Dobrar o tempo (10 h)', desc: 'A camada NÃO dobra: cresce só 41 %',
          valores: { par: 'cfe', T: 925, t: 10, Cs: 1.2, C0: 0.2, Cc: 0.4, animar: true, vel: 1 } },
        { nome: '3 · Quadruplicar o tempo (20 h)', desc: 'Agora sim dobra: √4 = 2',
          valores: { par: 'cfe', T: 925, t: 20, Cs: 1.2, C0: 0.2, Cc: 0.4, animar: true, vel: 1 } },
        { nome: '4 · Subir 75 °C em vez de esperar', desc: 'Temperatura é muito mais eficaz que tempo',
          valores: { par: 'cfe', T: 1000, t: 5, Cs: 1.2, C0: 0.2, Cc: 0.4, animar: true, vel: 1 } },
        { nome: '5 · Nitretação a 520 °C', desc: 'Difusão lenta, camada fina — mas sem deformar a peça',
          valores: { par: 'nfe', T: 520, t: 40, Cs: 0.5, C0: 0.02, Cc: 0.1, animar: true, vel: 1 } },
        { nome: '6 · Autodifusão do ferro', desc: 'Q muito maior: mecanismo por lacunas, não intersticial',
          valores: { par: 'fefe', T: 1000, t: 20, Cs: 1.0, C0: 0.0, Cc: 0.3, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'par', tipo: 'select', label: 'Par difusivo', valor: 'cfe',
          opcoes: Object.keys(PARES).map(function (k) { return { v: k, t: PARES[k].nome }; }) },
        { id: 'T', label: 'Temperatura do tratamento', min: 400, max: 1100, step: 5, valor: 925,
          unidade: '°C', desc: 'D cresce exponencialmente com T — é o parâmetro mais poderoso.' },
        { id: 't', label: 'Tempo', min: 0.5, max: 60, step: 0.5, valor: 5, unidade: 'h' },
        { tipo: 'separador' },
        { id: 'Cs', label: 'Teor na superfície C_s', min: 0.2, max: 1.4, step: 0.05, valor: 1.2,
          unidade: '%', desc: 'Imposto pela atmosfera do forno. Acima de 1,2 % começa a formar carbonetos em rede.' },
        { id: 'C0', label: 'Teor inicial do aço C₀', min: 0, max: 0.6, step: 0.01, valor: 0.2, unidade: '%' },
        { id: 'Cc', label: 'Teor de corte da camada', min: 0.1, max: 0.9, step: 0.05, valor: 0.4,
          unidade: '%', desc: 'Convenção usual: a camada efetiva vai até 0,4 %C, que é onde a dureza após têmpera atinge 50 HRC.' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Rodar o tempo', valor: true },
        { id: 'vel', label: 'Velocidade', min: 0.2, max: 4, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'peca', axes: false, height: 320, grid: false, legend: false },
        { id: 'perfil', titulo: 'Perfil de carbono ao longo da profundidade',
          xlabel: 'Profundidade x (mm)', ylabel: 'Teor de carbono (%)', aspect: 0.42,
          legendPos: 'topright' },
        { id: 'arr', titulo: 'Arrhenius: coeficiente de difusão × temperatura',
          xlabel: '1000/T  (K⁻¹)', ylabel: 'log₁₀ D  (D em m²/s)', aspect: 0.34, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'D', label: 'Coeficiente de difusão D' },
        { id: 'raiz', label: '√(D·t)' },
        { id: 'camada', label: 'Profundidade de camada' },
        { id: 'z', label: 'z = x/(2√Dt) no corte' },
        { id: 'Q', label: 'Energia de ativação Q' },
        { id: 'D0', label: 'Fator pré-exponencial D₀' },
        { id: 't2', label: 'Tempo para dobrar a camada' },
        { id: 'Talt', label: 'T para a mesma camada em 1 h' }
      ],
      formulas: [
        { g: 'As duas leis de Fick' },
        { tex: 'J = -D\\,\\frac{\\partial C}{\\partial x}',
          d: '1ª lei: regime PERMANENTE — o fluxo é proporcional ao gradiente e vai do concentrado ao diluído', destaque: true },
        { tex: '\\frac{\\partial C}{\\partial t} = D\\,\\frac{\\partial^2 C}{\\partial x^2}',
          d: '2ª lei: regime TRANSIENTE — é o caso da cementação', destaque: true },

        { g: 'Solução para sólido semi-infinito' },
        { tex: '\\frac{C_x - C_0}{C_s - C_0} = 1 - \\mathrm{erf}\\!\\left(\\frac{x}{2\\sqrt{Dt}}\\right)',
          d: 'C_s constante na superfície, C₀ uniforme no início', destaque: true },
        { tex: 'C_x = C_s - (C_s - C_0)\\,\\mathrm{erf}\\!\\left(\\frac{x}{2\\sqrt{Dt}}\\right)',
          d: 'forma equivalente, direta para calcular' },
        { tex: 'x \\propto \\sqrt{D\\,t}',
          d: 'a consequência prática mais importante: para DOBRAR a camada é preciso QUADRUPLICAR o tempo', destaque: true },
        { tex: '\\frac{x_1^2}{D_1 t_1} = \\frac{x_2^2}{D_2 t_2}',
          d: 'regra de escala entre dois tratamentos com o mesmo perfil relativo' },

        { g: 'Dependência com a temperatura — Arrhenius' },
        { tex: 'D = D_0 \\exp\\!\\left(-\\frac{Q}{RT}\\right)',
          d: 'Q é a energia de ativação; R = 8,314 J/mol·K e T em KELVIN', destaque: true },
        { tex: '\\ln D = \\ln D_0 - \\frac{Q}{R}\\cdot\\frac{1}{T}',
          d: 'em papel ln D contra 1/T é uma reta de inclinação −Q/R — é assim que se mede Q' },
        { tex: 'T \\uparrow \\;\\Rightarrow\\; D \\uparrow \\ \\text{exponencialmente}',
          d: 'subir 100 °C costuma multiplicar D por 10; por isso aquecer rende muito mais que esperar', destaque: true },

        { g: 'Os dois mecanismos' },
        { tex: '\\text{Intersticial: C, N, H, B}',
          d: 'átomo pequeno pula de interstício em interstício; Q baixo, difusão rápida', destaque: true },
        { tex: '\\text{Substitucional: precisa de uma LACUNA vizinha}',
          d: 'Q alto, porque é preciso criar a lacuna E mover o átomo — daí a autodifusão ser tão lenta' },
        { tex: 'Q_{\\text{intersticial}} \\ll Q_{\\text{substitucional}}',
          d: 'C em γ-Fe: 148 kJ/mol · autodifusão do Fe: 284 kJ/mol' },

        { g: 'Na prática' },
        { tex: '\\text{Cementação: 900 a 950 } ^\\circ C, \\ \\gamma',
          d: 'precisa ser austenita, que é onde o carbono se dissolve' },
        { tex: '\\text{Nitretação: 500 a 550 } ^\\circ C, \\ \\alpha',
          d: 'abaixo de A₁: não há transformação de fase e a peça praticamente não deforma' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Solução clássica para sólido semi-infinito com concentração constante na superfície: vale enquanto a camada for pequena diante da espessura da peça, o que é sempre o caso em cementação. D constante ao longo do perfil é uma simplificação — na realidade D depende do próprio teor de carbono.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        if (!p.animar) A.t = p.t;
        desenhaPeca();

        /* perfil */
        var xs = Plot.linspace(0, 3, 120);
        var gp = ctx.plot('perfil').clear();
        [0.25, 0.5, 1, 2].forEach(function (fr, i) {
          var tt = p.t * fr * 3600;
          var rz = Math.sqrt(r.D * tt);
          gp.line(xs, xs.map(function (x) {
            return p.Cs - (p.Cs - p.C0) * erf(x / 1000 / (2 * rz));
          }), { color: Plot.serie(i === 2 ? 0 : 7), width: i === 2 ? 2.8 : 1.3,
                dash: i === 2 ? [] : [4, 3],
                label: Plot.sig(p.t * fr, 3) + ' h' });
        });
        gp.hline(p.Cc, { color: Plot.serie(2), dash: [5, 4], width: 1.6,
          text: 'corte: ' + p.Cc + ' %C' });
        gp.hline(p.C0, { color: Plot.serie(7), dash: [2, 3], width: 1.2,
          text: 'núcleo: ' + p.C0 + ' %C' });
        if (isFinite(r.camada)) {
          gp.marker(r.camada, p.Cc, 'camada = ' + Plot.sig(r.camada, 3) + ' mm',
            { color: Plot.serie(6) });
        }
        gp.draw();

        /* Arrhenius */
        var Ts = Plot.linspace(p.T - 300 + 273.15, p.T + 300 + 273.15, 60);
        var ga = ctx.plot('arr').clear();
        Object.keys(PARES).forEach(function (k, i) {
          var q = PARES[k];
          ga.line(Ts.map(function (T) { return 1000 / T; }),
                  Ts.map(function (T) { return Math.log(q.D0 * Math.exp(-q.Q / (8.314 * T))) / Math.LN10; }),
            { color: k === p.par ? Plot.serie(0) : Plot.serie(7),
              width: k === p.par ? 2.8 : 1.1,
              dash: k === p.par ? [] : [3, 3],
              label: k === p.par ? q.nome : '' });
          void i;
        });
        ga.marker(1000 / r.T, Math.log(r.D) / Math.LN10,
          p.T + ' °C  ·  D = ' + Plot.sig(r.D, 3), { color: Plot.serie(6) });
        ga.draw();

        var nt = Plot.numTex, sg = Plot.sig;
        /* temperatura que daria a mesma camada em 1 h */
        var Dnec = Math.pow(r.camada / 1000 / (2 * r.z), 2) / 3600;
        var Talt = isFinite(Dnec) && Dnec > 0
          ? r.par.Q / (8.314 * Math.log(r.par.D0 / Dnec)) - 273.15 : NaN;

        ctx.setPassos([
          { t: 'Coeficiente de difusão na temperatura do tratamento',
            tex: 'D = D_0\\exp\\!\\left(-\\frac{Q}{RT}\\right)',
            texSub: 'D = ' + nt(r.par.D0) + '\\exp\\!\\left(-\\frac{' + nt(r.par.Q) +
              '}{8{,}314 \\cdot ' + nt(r.T) + '}\\right) = ' + nt(r.D) + '\\ \\mathrm{m^2/s}',
            obs: 'T = ' + p.T + ' °C = ' + sg(r.T, 4) + ' K — em kelvin, sempre. ' + r.par.obs + '. '
              + 'A 100 °C abaixo, D cairia para ' +
              sg(r.par.D0 * Math.exp(-r.par.Q / (8.314 * (r.T - 100))), 3) + ' m²/s, ou seja, ' +
              sg(r.D / (r.par.D0 * Math.exp(-r.par.Q / (8.314 * (r.T - 100)))), 3) + ' vezes menos.' },
          { t: 'Comprimento característico de difusão',
            tex: '\\sqrt{D\\,t}',
            texSub: '\\sqrt{' + nt(r.D) + ' \\cdot ' + nt(r.t) + '} = ' + nt(r.raiz) +
              '\\ \\mathrm{m} = ' + nt(r.raiz * 1000) + '\\ \\mathrm{mm}',
            obs: 't = ' + p.t + ' h = ' + sg(r.t, 5) + ' s. Esta raiz é a escala de tudo: a camada '
              + 'sempre sai como um múltiplo dela.' },
          { t: 'Argumento da função erro no teor de corte',
            tex: '\\frac{C_s - C_x}{C_s - C_0} = \\mathrm{erf}(z) \\quad\\text{com}\\quad z = \\frac{x}{2\\sqrt{Dt}}',
            texSub: '\\mathrm{erf}(z) = \\frac{' + nt(p.Cs) + ' - ' + nt(p.Cc) + '}{' + nt(p.Cs) +
              ' - ' + nt(p.C0) + '} = ' + nt((p.Cs - p.Cc) / (p.Cs - p.C0)) +
              ' \\;\\Rightarrow\\; z = ' + nt(r.z),
            obs: 'Inverte-se a função erro (por tabela, na prova) para achar z. Note que z depende '
              + 'SÓ dos teores, não da temperatura nem do tempo — a temperatura e o tempo entram '
              + 'depois, na raiz.' },
          { t: 'Profundidade de camada',
            tex: 'x = z \\cdot 2\\sqrt{D\\,t}',
            texSub: 'x = ' + nt(r.z) + ' \\cdot 2 \\cdot ' + nt(r.raiz * 1000) + ' = ' +
              nt(r.camada) + '\\ \\mathrm{mm}',
            obs: 'Camadas usuais de cementação vão de 0,5 a 2 mm. Acima de 2 mm o tempo de forno '
              + 'fica proibitivo — o próximo passo mostra por quê.' },
          { t: 'Por que dobrar a camada custa quatro vezes mais tempo',
            tex: 'x \\propto \\sqrt{t} \\;\\Rightarrow\\; \\frac{t_2}{t_1} = \\left(\\frac{x_2}{x_1}\\right)^2',
            texSub: 't_2 = ' + p.t + ' \\cdot 2^2 = ' + nt(p.t * 4) + '\\ \\mathrm{h} \\ ' +
              '\\text{para } x_2 = ' + nt(r.camada * 2) + '\\ \\mathrm{mm}',
            obs: 'Este é o resultado que governa o custo do tratamento. Como o tempo entra na raiz, '
              + 'esperar rende cada vez menos. Subir a temperatura, ao contrário, entra no '
              + 'expoente: ' + (isFinite(Talt)
                ? 'a mesma camada sairia em 1 hora a cerca de ' + sg(Talt, 4) + ' °C.'
                : 'é sempre o caminho mais eficaz, quando o material permite.') }
        ]);

        return {
          D: { v: r.D, u: 'm²/s' },
          raiz: { v: r.raiz * 1000, u: 'mm' },
          camada: { v: r.camada, u: 'mm', classe: 'destaque' },
          z: { v: r.z, u: '' },
          Q: { v: r.par.Q / 1000, u: 'kJ/mol' },
          D0: { v: r.par.D0, u: 'm²/s' },
          t2: { v: p.t * 4, u: 'h' },
          Talt: { v: isFinite(Talt) ? Talt : NaN, u: '°C' }
        };
      }
    });

    function desenhaPeca() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('peca');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharPeca(c, plot, A.p, A.r, A.on ? A.t : A.p.t); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.t += dt * A.p.t * 0.30 * A.vel;
      if (A.t > A.p.t) A.t = 0;
      desenhaPeca();
    });
  })();


  /* ============================================================
     5. Estruturas cristalinas e o fator de empacotamento
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-cristal')) return;

    var A = { on: true, ang: 0.6, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };

    /* Cada estrutura devolve: átomos da célula (em coordenadas fracionárias),
       número de átomos POR célula, número de coordenação, relação entre a
       aresta a e o raio R, e o volume da célula em função de R. */
    var ESTRUTURAS = {
      cs: {
        nome: 'Cúbica simples (CS)',
        n: 1, NC: 6,
        relacao: 'a = 2R',
        aR: 2,
        volume: function (R) { return Math.pow(2 * R, 3); },
        volTex: '(2R)^3 = 8R^3',
        FEA: Math.PI / 6,
        exemplos: 'Polônio — praticamente nenhum metal cristaliza assim',
        atomos: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
                 [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]],
        toque: 'aresta'
      },
      ccc: {
        nome: 'Cúbica de corpo centrado (CCC)',
        n: 2, NC: 8,
        relacao: 'a = 4R/√3',
        aR: 4 / Math.sqrt(3),
        volume: function (R) { return Math.pow(4 * R / Math.sqrt(3), 3); },
        volTex: '\\left(\\frac{4R}{\\sqrt{3}}\\right)^3 = \\frac{64R^3}{3\\sqrt{3}}',
        FEA: Math.PI * Math.sqrt(3) / 8,
        exemplos: 'Ferro α, cromo, tungstênio, molibdênio, vanádio',
        atomos: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
                 [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1], [0.5, 0.5, 0.5]],
        toque: 'diagonal do cubo'
      },
      cfc: {
        nome: 'Cúbica de faces centradas (CFC)',
        n: 4, NC: 12,
        relacao: 'a = 2R√2',
        aR: 2 * Math.sqrt(2),
        volume: function (R) { return Math.pow(2 * Math.sqrt(2) * R, 3); },
        volTex: '(2R\\sqrt{2})^3 = 16R^3\\sqrt{2}',
        FEA: Math.PI / (3 * Math.sqrt(2)),
        exemplos: 'Ferro γ, alumínio, cobre, níquel, prata, ouro, chumbo',
        atomos: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
                 [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
                 [0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5],
                 [0, 0.5, 0.5], [1, 0.5, 0.5]],
        toque: 'diagonal da face'
      },
      hc: {
        nome: 'Hexagonal compacta (HC)',
        n: 6, NC: 12,
        relacao: 'a = 2R  e  c/a = 1,633',
        aR: 2,
        volume: function (R) {
          var a = 2 * R, c = 1.633 * a;
          return 3 * Math.sqrt(3) / 2 * a * a * c;
        },
        volTex: '\\frac{3\\sqrt{3}}{2}a^2 c \\quad\\text{com}\\quad a = 2R,\\ c = 1{,}633a',
        FEA: Math.PI / (3 * Math.sqrt(2)),
        exemplos: 'Magnésio, zinco, titânio α, cádmio, cobalto, zircônio',
        hexagonal: true,
        toque: 'aresta da base'
      }
    };

    /* projeção isométrica simples: (x,y,z) fracionário -> pixel */
    function proj(x, y, z, cx, cy, esc, ang) {
      /* rotaciona em torno do eixo vertical e inclina */
      var ca = Math.cos(ang), sa = Math.sin(ang);
      var X = (x - 0.5) * ca - (y - 0.5) * sa;
      var Y = (x - 0.5) * sa + (y - 0.5) * ca;
      var Z = z - 0.5;
      var incl = 0.55;
      return [cx + X * esc, cy - Z * esc + Y * esc * incl, Y];
    }

    function desenharCelula(c, pl, p, r, ang) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var est = r.est;
      var i;

      /* alcance do desenho a partir do centro, em unidades de aresta:
         meia celula mais o raio do atomo do vertice, que avanca para fora */
      var raioRel = p.tocando ? 1 / est.aR : 0.16;
      var alcance = 0.5 * (1 + 0.55) + raioRel;      /* +0,55 pela inclinacao */
      var cx = a.x + a.w * 0.28, cy = a.y + a.h * 0.54;
      var esc = Math.min(a.w * 0.25, a.h * 0.42) / alcance;
      var raioPx = esc * raioRel;

      var pontos = [];
      if (est.hexagonal) {
        /* prisma hexagonal: dois hexágonos e o triângulo interno */
        var hexBase = [];
        for (i = 0; i < 6; i++) {
          var th = i * TAU / 6;
          hexBase.push([0.5 + 0.5 * Math.cos(th), 0.5 + 0.5 * Math.sin(th)]);
        }
        hexBase.forEach(function (q) {
          pontos.push({ p: [q[0], q[1], 0], tipo: 'v' });
          pontos.push({ p: [q[0], q[1], 1], tipo: 'v' });
        });
        pontos.push({ p: [0.5, 0.5, 0], tipo: 'f' });
        pontos.push({ p: [0.5, 0.5, 1], tipo: 'f' });
        /* três átomos no plano intermediário, nos vazios alternados */
        [[0, 2, 4]].forEach(function (idx) {
          idx.forEach(function (k) {
            var q1 = hexBase[k], q2 = hexBase[(k + 1) % 6];
            pontos.push({ p: [(0.5 + q1[0] + q2[0]) / 3, (0.5 + q1[1] + q2[1]) / 3, 0.5],
                          tipo: 'i' });
          });
        });
        /* arestas do prisma */
        c.strokeStyle = borda; c.lineWidth = 1.4; c.setLineDash([]);
        for (i = 0; i < 6; i++) {
          var A1 = proj(hexBase[i][0], hexBase[i][1], 0, cx, cy, esc, ang);
          var B1 = proj(hexBase[(i + 1) % 6][0], hexBase[(i + 1) % 6][1], 0, cx, cy, esc, ang);
          var A2 = proj(hexBase[i][0], hexBase[i][1], 1, cx, cy, esc, ang);
          var B2 = proj(hexBase[(i + 1) % 6][0], hexBase[(i + 1) % 6][1], 1, cx, cy, esc, ang);
          c.beginPath(); c.moveTo(A1[0], A1[1]); c.lineTo(B1[0], B1[1]); c.stroke();
          c.beginPath(); c.moveTo(A2[0], A2[1]); c.lineTo(B2[0], B2[1]); c.stroke();
          c.beginPath(); c.moveTo(A1[0], A1[1]); c.lineTo(A2[0], A2[1]); c.stroke();
        }
      } else {
        est.atomos.forEach(function (q) {
          var tipo = 'v';
          if (q[0] === 0.5 && q[1] === 0.5 && q[2] === 0.5) tipo = 'c';
          else if (q.filter(function (v) { return v === 0.5; }).length === 2) tipo = 'f';
          pontos.push({ p: q, tipo: tipo });
        });
        /* arestas do cubo */
        c.strokeStyle = borda; c.lineWidth = 1.4; c.setLineDash([]);
        var arestas = [[0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1],
                       [1, 1, 1, 0, 1, 1], [1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 1, 0],
                       [1, 0, 0, 1, 1, 0], [1, 0, 0, 1, 0, 1], [0, 1, 0, 1, 1, 0],
                       [0, 1, 0, 0, 1, 1], [0, 0, 1, 1, 0, 1], [0, 0, 1, 0, 1, 1]];
        arestas.forEach(function (e) {
          var A1 = proj(e[0], e[1], e[2], cx, cy, esc, ang);
          var B1 = proj(e[3], e[4], e[5], cx, cy, esc, ang);
          c.beginPath(); c.moveTo(A1[0], A1[1]); c.lineTo(B1[0], B1[1]); c.stroke();
        });
        /* direção de toque destacada */
        if (p.tocando) {
          c.strokeStyle = Plot.serie(6); c.lineWidth = 2.4; c.setLineDash([5, 4]);
          var d1, d2;
          if (p.est === 'cs') { d1 = [0, 0, 0]; d2 = [1, 0, 0]; }
          else if (p.est === 'ccc') { d1 = [0, 0, 0]; d2 = [1, 1, 1]; }
          else { d1 = [1, 0, 0]; d2 = [0, 1, 0]; }
          var P1 = proj(d1[0], d1[1], d1[2], cx, cy, esc, ang);
          var P2 = proj(d2[0], d2[1], d2[2], cx, cy, esc, ang);
          c.beginPath(); c.moveTo(P1[0], P1[1]); c.lineTo(P2[0], P2[1]); c.stroke();
          c.setLineDash([]);
        }
      }

      /* átomos, desenhados de trás para a frente */
      var proj3 = pontos.map(function (q) {
        var P = proj(q.p[0], q.p[1], q.p[2], cx, cy, esc, ang);
        return { X: P[0], Y: P[1], prof: P[2], tipo: q.tipo };
      });
      proj3.sort(function (u, v) { return u.prof - v.prof; });
      proj3.forEach(function (q) {
        var corA = q.tipo === 'c' ? Plot.serie(5)
                 : (q.tipo === 'f' ? Plot.serie(3)
                 : (q.tipo === 'i' ? Plot.serie(4) : Plot.serie(0)));
        c.fillStyle = corA;
        c.globalAlpha = 0.55 + 0.35 * (q.prof + 0.7);
        c.beginPath(); c.arc(q.X, q.Y, raioPx, 0, TAU); c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = Plot.cssVar('--bg-elev', '#fff');
        c.lineWidth = 1.4;
        c.beginPath(); c.arc(q.X, q.Y, raioPx, 0, TAU); c.stroke();
      });

      /* painel de dados */
      var lx = a.x + a.w * 0.62, ly = a.y + a.h * 0.20;
      c.fillStyle = cor; c.font = fonte(13, '700');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(est.nome, lx, ly);
      c.font = fonte(11);
      c.fillStyle = faint;
      [['átomos por célula: ' + est.n, 24],
       ['número de coordenação: ' + est.NC, 42],
       ['relação: ' + est.relacao, 60],
       ['os átomos se tocam na ' + est.toque, 78],
       ['fator de empacotamento: ' + Plot.sig(est.FEA, 4), 100],
       ['exemplos: ' + est.exemplos, 122]
      ].forEach(function (q, i2) {
        if (i2 === 4) { c.font = fonte(12, '700'); c.fillStyle = Plot.serie(2); }
        else if (i2 === 5) { c.font = fonte(10); c.fillStyle = faint; }
        c.fillText(q[0], lx, ly + q[1]);
      });

      /* legenda das cores */
      var itens = [[0, 'vértice']];
      if (p.est === 'ccc') itens.push([5, 'centro do corpo']);
      if (p.est === 'cfc') itens.push([3, 'centro de face']);
      if (p.est === 'hc') { itens.push([3, 'centro da base']); itens.push([4, 'plano intermediário']); }
      var bx = a.x + 8, by = a.y + a.h - 26;
      itens.forEach(function (q) {
        c.fillStyle = Plot.serie(q[0]);
        c.beginPath(); c.arc(bx + 6, by + 6, 5.5, 0, TAU); c.fill();
        c.fillStyle = faint; c.font = fonte(10);
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(q[1], bx + 16, by + 6);
        bx += 26 + c.measureText(q[1]).width;
      });

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Célula unitária' + (p.tocando ? ' — átomos no tamanho real' : ' — raios reduzidos'),
                 a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('a célula gira para mostrar as três dimensões · marque "átomos encostados" para ver o empacotamento',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-cristal', {
      titulo: 'Estruturas cristalinas e o fator de empacotamento',
      descricao: 'CS, CCC, CFC e HC lado a lado, com a célula girando. O fator de empacotamento sai de uma conta só — mas é ele que explica a ductilidade, a solubilidade do carbono e até a densidade do metal.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Ferro α (CCC) à temperatura ambiente', desc: 'FEA 0,68 · coordenação 8',
          valores: { est: 'ccc', R: 0.124, M: 55.85, tocando: true, animar: true, vel: 1 } },
        { nome: '2 · Ferro γ (CFC) acima de 912 °C', desc: 'FEA 0,74 · coordenação 12 — mais compacto',
          valores: { est: 'cfc', R: 0.126, M: 55.85, tocando: true, animar: true, vel: 1 } },
        { nome: '3 · Magnésio (HC)', desc: 'Mesmo FEA do CFC, mas só 3 sistemas de escorregamento',
          valores: { est: 'hc', R: 0.160, M: 24.31, tocando: true, animar: true, vel: 1 } },
        { nome: '4 · Alumínio (CFC)', desc: 'Confira a densidade calculada contra os 2,70 g/cm³ reais',
          valores: { est: 'cfc', R: 0.143, M: 26.98, tocando: true, animar: true, vel: 1 } },
        { nome: '5 · Tungstênio (CCC)', desc: 'O metal de maior ponto de fusão',
          valores: { est: 'ccc', R: 0.137, M: 183.8, tocando: true, animar: true, vel: 1 } },
        { nome: '6 · Cúbica simples', desc: 'FEA 0,52 — tão vazia que quase nenhum metal a adota',
          valores: { est: 'cs', R: 0.150, M: 209, tocando: true, animar: true, vel: 1 } },
        { nome: '7 · Ver as posições sem os átomos cheios', desc: 'Raios reduzidos: fica mais fácil contar',
          valores: { est: 'cfc', R: 0.126, M: 55.85, tocando: false, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'est', tipo: 'select', label: 'Estrutura', valor: 'ccc',
          opcoes: Object.keys(ESTRUTURAS).map(function (k) {
            return { v: k, t: ESTRUTURAS[k].nome };
          }) },
        { id: 'R', label: 'Raio atômico R', min: 0.06, max: 0.25, step: 0.001, valor: 0.124,
          unidade: 'nm', desc: 'Fe 0,124 · Al 0,143 · Cu 0,128 · Mg 0,160 · W 0,137' },
        { id: 'M', label: 'Massa atômica', min: 5, max: 240, step: 0.01, valor: 55.85,
          unidade: 'g/mol' },
        { tipo: 'separador' },
        { id: 'tocando', tipo: 'check', label: 'Átomos encostados (tamanho real)', valor: true,
          desc: 'Desmarque para enxergar as posições sem as esferas se cobrindo.' },
        { id: 'animar', tipo: 'check', label: 'Girar a célula', valor: true },
        { id: 'vel', label: 'Velocidade', min: 0.1, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'celula', axes: false, height: 380, grid: false, legend: false },
        { id: 'comp', titulo: 'Fator de empacotamento das quatro estruturas',
          xlabel: '', ylabel: 'FEA', aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'n', label: 'Átomos por célula' },
        { id: 'NC', label: 'Número de coordenação' },
        { id: 'aresta', label: 'Aresta a' },
        { id: 'Vc', label: 'Volume da célula' },
        { id: 'Vat', label: 'Volume ocupado pelos átomos' },
        { id: 'FEA', label: 'Fator de empacotamento' },
        { id: 'rho', label: 'Densidade calculada' },
        { id: 'vazio', label: 'Espaço vazio' }
      ],
      formulas: [
        { g: 'A definição' },
        { tex: 'FEA = \\frac{\\text{volume dos átomos da célula}}{\\text{volume da célula}} = \\frac{n \\cdot \\frac{4}{3}\\pi R^3}{V_{célula}}',
          d: 'fração do espaço realmente ocupada por matéria', destaque: true },

        { g: 'Como se conta o número de átomos por célula' },
        { tex: '\\text{vértice: } 1/8 \\qquad \\text{aresta: } 1/4 \\qquad \\text{face: } 1/2 \\qquad \\text{interior: } 1',
          d: 'cada átomo é dividido entre as células vizinhas que o compartilham', destaque: true },
        { tex: 'CS: \\ 8 \\times \\tfrac{1}{8} = 1', d: 'só os oito vértices' },
        { tex: 'CCC: \\ 8 \\times \\tfrac{1}{8} + 1 = 2', d: 'vértices mais o do centro do corpo', destaque: true },
        { tex: 'CFC: \\ 8 \\times \\tfrac{1}{8} + 6 \\times \\tfrac{1}{2} = 4', d: 'vértices mais seis centros de face', destaque: true },
        { tex: 'HC: \\ 12 \\times \\tfrac{1}{6} + 2 \\times \\tfrac{1}{2} + 3 = 6',
          d: 'doze vértices do prisma (1/6 cada), duas bases (1/2) e três inteiros no meio', destaque: true },

        { g: 'Como se acha a relação entre a e R' },
        { tex: '\\text{Procure a direção em que os átomos SE TOCAM}',
          d: 'é a única informação geométrica de que se precisa', destaque: true },
        { tex: 'CS: \\ \\text{tocam na ARESTA} \\Rightarrow a = 2R', d: 'dois raios cabem na aresta' },
        { tex: 'CCC: \\ \\text{tocam na DIAGONAL DO CUBO} \\Rightarrow a\\sqrt{3} = 4R',
          d: 'a diagonal vale a√3 e contém quatro raios', destaque: true },
        { tex: 'CFC: \\ \\text{tocam na DIAGONAL DA FACE} \\Rightarrow a\\sqrt{2} = 4R',
          d: 'a diagonal da face vale a√2 e contém quatro raios', destaque: true },
        { tex: 'HC: \\ \\text{tocam na ARESTA DA BASE} \\Rightarrow a = 2R, \\ c/a = 1{,}633',
          d: 'a razão c/a ideal vale √(8/3) = 1,633', destaque: true },

        { g: 'Os quatro resultados' },
        { tex: 'FEA_{CS} = \\frac{\\pi}{6} = 0{,}524', d: 'coordenação 6 — estrutura muito vazia' },
        { tex: 'FEA_{CCC} = \\frac{\\pi\\sqrt{3}}{8} = 0{,}680', d: 'coordenação 8', destaque: true },
        { tex: 'FEA_{CFC} = \\frac{\\pi}{3\\sqrt{2}} = 0{,}740', d: 'coordenação 12 — o máximo possível para esferas iguais', destaque: true },
        { tex: 'FEA_{HC} = \\frac{\\pi}{3\\sqrt{2}} = 0{,}740', d: 'IGUAL ao CFC: as duas são estruturas compactas', destaque: true },

        { g: 'CFC e HC: mesmo empacotamento, comportamento diferente' },
        { tex: '\\text{CFC: } ABCABC \\qquad \\text{HC: } ABABAB',
          d: 'a diferença está só na SEQUÊNCIA de empilhamento dos planos compactos', destaque: true },
        { tex: '\\text{CFC: 12 sistemas de escorregamento} \\Rightarrow \\text{dúctil}',
          d: 'quatro planos {111} × três direções 〈110〉' },
        { tex: '\\text{HC: 3 sistemas} \\Rightarrow \\text{pouco dúctil a frio}',
          d: 'só o plano basal; daí magnésio e zinco serem difíceis de conformar a frio', destaque: true },

        { g: 'Densidade teórica' },
        { tex: '\\rho = \\frac{n\\,A}{V_c\\,N_A}',
          d: 'n átomos por célula · A massa atômica · N_A = 6,022 × 10²³', destaque: true },
        { tex: '\\text{Comparar com a densidade medida valida a estrutura}',
          d: 'diferença grande indica que a estrutura suposta está errada' },

        { g: 'Por que o CFC dissolve mais carbono que o CCC' },
        { tex: '\\text{Interstício octaédrico CFC: } r = 0{,}414R \\Rightarrow 0{,}052\\ nm',
          d: 'no ferro γ', destaque: true },
        { tex: '\\text{Interstício octaédrico CCC: } r = 0{,}155R \\Rightarrow 0{,}019\\ nm',
          d: 'no ferro α — quase três vezes menor' },
        { tex: '\\text{Mais vazio TOTAL} \\ne \\text{vazio individual MAIOR}',
          d: 'o CCC tem 32 % de vazio contra 26 % do CFC, mas todo espalhado em buracos pequenos', destaque: true }
      ],
      passos: [],
      passosTitulo: 'Como calcular o fator de empacotamento, passo a passo',
      passosAbertos: true,
      nota: 'A razão c/a = 1,633 do HC é a ideal, para esferas rígidas. Metais reais desviam: zinco tem 1,856 (alongado) e titânio 1,587 (achatado), e esse desvio muda quais sistemas de escorregamento operam.',
      calcular: function (p, ctx) {
        var est = ESTRUTURAS[p.est];
        var R = p.R;                                   /* nm */
        var Vc = est.volume(R);                        /* nm³ */
        var Vat = est.n * (4 / 3) * Math.PI * R * R * R;
        var FEA = Vat / Vc;
        var NA = 6.022e23;
        /* nm³ -> cm³: 1 nm = 1e-7 cm, logo 1 nm³ = 1e-21 cm³ */
        var rho = est.n * p.M / (Vc * 1e-21 * NA);
        var aresta = est.hexagonal ? 2 * R : est.aR * R;
        var r = { est: est, Vc: Vc, Vat: Vat, FEA: FEA, rho: rho, aresta: aresta };
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        desenhaCelula();

        /* comparação */
        var ks = Object.keys(ESTRUTURAS);
        var gc = ctx.plot('comp').clear();
        gc.o.xcat = ks.map(function (k, i) {
          return { v: i, label: k.toUpperCase() + '  (NC ' + ESTRUTURAS[k].NC + ')' };
        });
        gc.setLimits([-0.62, ks.length - 0.38], [0, 0.95]);
        ks.forEach(function (k, i) {
          gc.bars([i], [ESTRUTURAS[k].FEA],
            { color: k === p.est ? Plot.serie(6) : Plot.serie(1), barw: 0.52 });
          gc.text(i, ESTRUTURAS[k].FEA, Plot.sig(ESTRUTURAS[k].FEA, 3),
            { align: 'center', dy: -7, size: 11 });
        });
        gc.hline(0.74, { color: Plot.serie(2), dash: [4, 3], width: 1.3,
          text: '0,740 = máximo possível para esferas iguais' });
        gc.draw();

        var nt = Plot.numTex, sg = Plot.sig;
        var contagem = {
          cs: '8 \\times \\tfrac{1}{8} = 1',
          ccc: '8 \\times \\tfrac{1}{8} + 1 = 2',
          cfc: '8 \\times \\tfrac{1}{8} + 6 \\times \\tfrac{1}{2} = 4',
          hc: '12 \\times \\tfrac{1}{6} + 2 \\times \\tfrac{1}{2} + 3 = 6'
        };
        var obsContagem = {
          cs: 'Cada átomo de vértice é compartilhado por OITO células vizinhas, então cada célula '
            + 'fica com 1/8 dele. Oito vértices dão um átomo inteiro.',
          ccc: 'Os oito vértices dão um átomo, e o do centro do corpo pertence inteiramente a esta '
            + 'célula — não é compartilhado com ninguém. Total: 2.',
          cfc: 'Os oito vértices dão um átomo. Cada um dos seis centros de face é dividido com '
            + 'apenas UMA célula vizinha, então vale 1/2. Seis meios dão três. Total: 4.',
          hc: 'O prisma hexagonal tem 12 vértices, cada um compartilhado por SEIS células, valendo '
            + '1/6. Os dois centros de base são divididos com uma vizinha cada, valendo 1/2. E os '
            + 'três do plano intermediário estão inteiramente dentro. Total: 2 + 1 + 3 = 6.'
        };
        var obsRelacao = {
          cs: 'Na cúbica simples os átomos se tocam ao longo da própria aresta: dois raios cabem '
            + 'nela, logo a = 2R.',
          ccc: 'O átomo do centro toca os dos vértices ao longo da DIAGONAL DO CUBO, que mede a√3. '
            + 'Essa diagonal contém quatro raios (meio átomo + um inteiro + meio átomo = 4R). '
            + 'Logo a√3 = 4R.',
          cfc: 'Os átomos se tocam ao longo da DIAGONAL DA FACE, que mede a√2 e contém quatro raios. '
            + 'Logo a√2 = 4R. Note que a diagonal do cubo NÃO é a direção de contato aqui.',
          hc: 'Na base hexagonal os átomos se tocam ao longo da aresta, logo a = 2R. A altura c sai '
            + 'da geometria do empilhamento compacto: c/a = √(8/3) = 1,633.'
        };

        ctx.setPassos([
          { t: '① Contar os átomos que pertencem à célula',
            tex: 'n = \\sum \\text{(fração de cada átomo)}',
            texSub: 'n = ' + contagem[p.est],
            obs: obsContagem[p.est] + ' A regra geral: vértice vale 1/8 (cúbico) ou 1/6 (hexagonal), '
              + 'aresta 1/4, face 1/2 e interior 1.' },
          { t: '② Achar a relação entre a aresta e o raio',
            tex: est.relacao,
            texSub: est.hexagonal
              ? 'a = 2 \\cdot ' + nt(R) + ' = ' + nt(2 * R) + '\\ \\mathrm{nm} \\qquad c = 1{,}633a = ' +
                nt(1.633 * 2 * R) + '\\ \\mathrm{nm}'
              : 'a = ' + nt(est.aR) + ' \\cdot ' + nt(R) + ' = ' + nt(aresta) + '\\ \\mathrm{nm}',
            obs: obsRelacao[p.est] + ' Este é o único passo que exige geometria — o resto é conta.' },
          { t: '③ Volume da célula',
            tex: 'V_c = ' + est.volTex,
            texSub: 'V_c = ' + nt(Vc) + '\\ \\mathrm{nm^3}',
            obs: est.hexagonal
              ? 'A área da base hexagonal regular de lado a vale (3√3/2)a², e o volume é essa área '
                + 'vezes a altura c.'
              : 'Basta elevar a aresta ao cubo, substituindo a em função de R.' },
          { t: '④ Volume ocupado pelos átomos',
            tex: 'V_{átomos} = n \\cdot \\frac{4}{3}\\pi R^3',
            texSub: 'V_{átomos} = ' + est.n + ' \\cdot \\frac{4}{3}\\pi (' + nt(R) + ')^3 = ' +
              nt(Vat) + '\\ \\mathrm{nm^3}',
            obs: 'Trata-se cada átomo como uma esfera rígida de raio R. É uma idealização, mas '
              + 'reproduz muito bem as densidades medidas.' },
          { t: '⑤ Fator de empacotamento',
            tex: 'FEA = \\frac{V_{átomos}}{V_c}',
            texSub: 'FEA = \\frac{' + nt(Vat) + '}{' + nt(Vc) + '} = ' + nt(FEA),
            obs: 'Repare que o R se cancela: o FEA é um número puro, próprio da estrutura, e não '
              + 'depende de qual metal seja. Sobra ' + sg((1 - FEA) * 100, 3) + ' % de espaço vazio '
              + 'nesta estrutura. ' + (Math.abs(FEA - 0.74) < 0.005
                ? 'O valor 0,740 é o MÁXIMO possível para esferas iguais — CFC e HC empatam nesse limite.'
                : '') },
          { t: '⑥ Densidade teórica, para conferir',
            tex: '\\rho = \\frac{n\\,A}{V_c\\,N_A}',
            texSub: '\\rho = \\frac{' + est.n + ' \\cdot ' + nt(p.M) + '}{' + nt(Vc) +
              '\\times 10^{-21} \\cdot 6{,}022\\times 10^{23}} = ' + nt(rho) + '\\ \\mathrm{g/cm^3}',
            obs: 'Converter nm³ para cm³ multiplica por 10⁻²¹. Comparar este valor com a densidade '
              + 'medida é a maneira clássica de confirmar qual estrutura o metal tem: se a diferença '
              + 'passar de poucos por cento, a estrutura suposta está errada.' }
        ]);

        return {
          n: { v: est.n, u: 'átomos' },
          NC: { v: est.NC, u: '' },
          aresta: { v: aresta, u: 'nm' },
          Vc: { v: Vc, u: 'nm³' },
          Vat: { v: Vat, u: 'nm³' },
          FEA: { v: FEA, u: '', classe: 'destaque' },
          rho: { v: rho, u: 'g/cm³' },
          vazio: { v: (1 - FEA) * 100, u: '%' }
        };
      }
    });

    function desenhaCelula() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('celula');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharCelula(c, plot, A.p, A.r, A.ang); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.ang += dt * 0.45 * A.vel;
      if (A.ang > TAU) A.ang -= TAU;
      desenhaCelula();
    });
  })();

  /* ============================================================
     6. Efeito dos elementos de liga sobre o diagrama Fe-C
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-elementos')) return;

    /* Curvas de Bain, ajustadas aos valores clássicos:
       dT  = deslocamento da temperatura eutetoide, em °C por % do elemento
       dC  = deslocamento da composição eutetoide (sempre para BAIXO)
       Os coeficientes são de primeira ordem, com saturação. */
    var ELEM = {
      Ti: { nome: 'Titânio', dT: 150, dC: 0.42, tipo: 'alfa', sat: 1.2,
            papel: 'Forma TiC estabilíssimo: refina o grão e fixa o carbono. Base dos aços microligados e dos inox estabilizados (321).' },
      Mo: { nome: 'Molibdênio', dT: 62, dC: 0.17, tipo: 'alfa', sat: 4,
            papel: 'O mais eficaz para empurrar o nariz da curva TTT. Dá dureza secundária e evita a fragilização de revenido.' },
      W:  { nome: 'Tungstênio', dT: 30, dC: 0.08, tipo: 'alfa', sat: 8,
            papel: 'Carbonetos duríssimos e estáveis a quente: é a base do aço rápido.' },
      Si: { nome: 'Silício', dT: 42, dC: 0.09, tipo: 'alfa', sat: 3,
            papel: 'Desoxidante e endurecedor por solução sólida. Eleva o limite elástico — daí os aços de mola. Grafitizante em ferro fundido.' },
      Cr: { nome: 'Cromo', dT: 17, dC: 0.035, tipo: 'alfa', sat: 12,
            papel: 'Temperabilidade, resistência ao desgaste e a carbonetos. Acima de 10,5 % forma a película passiva: é o que faz o inox.' },
      Mn: { nome: 'Manganês', dT: -18, dC: 0.05, tipo: 'gama', sat: 8,
            papel: 'Temperabilidade barata. Neutraliza o enxofre formando MnS, evitando a fragilidade a quente.' },
      Ni: { nome: 'Níquel', dT: -14, dC: 0.03, tipo: 'gama', sat: 8,
            papel: 'Tenacidade, sobretudo a baixa temperatura. Estabiliza a austenita — em teor alto ela persiste à temperatura ambiente, como no inox 304.' },
      Cu: { nome: 'Cobre', dT: -10, dC: 0.02, tipo: 'gama', sat: 2,
            papel: 'Estabiliza a austenita e endurece por precipitação de partículas ricas em cobre. É o que dá a resistência atmosférica dos aços patináveis (Corten). Acima de 0,3 % pode causar fragilidade a quente se não houver níquel junto.' },
      Sn: { nome: 'Estanho', dT: 25, dC: 0.06, tipo: 'alfa', sat: 0.5,
            papel: 'Residual indesejado, vindo da sucata. Segrega para os contornos de grão e é uma das causas da fragilização de revenido. Em cobre, porém, é o elemento do BRONZE.' },
      Al: { nome: 'Alumínio', dT: 30, dC: 0.07, tipo: 'alfa', sat: 1.5,
            papel: 'Desoxidante e refinador de grão por AlN. Em teor alto forma a camada de nitretos da nitretação (aços Nitralloy).' },
      V:  { nome: 'Vanádio', dT: 100, dC: 0.30, tipo: 'alfa', sat: 1.5,
            papel: 'Refina o grão por precipitação de VC e VN. Dá dureza secundária forte.' }
    };

    function eutetoide(sel, teor) {
      var e = ELEM[sel];
      var x = Math.min(teor, e.sat * 1.6);
      /* saturação suave: o efeito por ponto percentual diminui */
      var f = e.sat / (e.sat + x);
      var T = 727 + e.dT * x * (0.55 + 0.45 * f);
      var C = 0.76 - e.dC * x * (0.55 + 0.45 * f);
      return { T: T, C: Math.max(0.05, C), e: e };
    }

    Sim.build('#sim-elementos', {
      titulo: 'O que os elementos de liga fazem com o diagrama Fe-C',
      descricao: 'Nenhum elemento deixa o diagrama intacto. Todos abaixam o teor de carbono do eutetoide; quanto à temperatura, uns a sobem e outros a descem — e essa divisão separa os estabilizadores de ferrita dos de austenita.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Cromo 12 % (inox ferrítico)', desc: 'Sobe A₁ e derruba o carbono eutetoide para ~0,35 %',
          valores: { el: 'Cr', teor: 12, comparar: true } },
        { nome: '2 · Níquel 8 % (base do inox 304)', desc: 'DESCE A₁ — com Cr junto, a austenita fica estável à temperatura ambiente',
          valores: { el: 'Ni', teor: 8, comparar: true } },
        { nome: '3 · Manganês 2 %', desc: 'Estabiliza austenita, como o níquel, mas muito mais barato',
          valores: { el: 'Mn', teor: 2, comparar: true } },
        { nome: '4 · Molibdênio 1 %', desc: 'Efeito forte por ponto percentual, tanto em T quanto em C',
          valores: { el: 'Mo', teor: 1, comparar: true } },
        { nome: '5 · Cobre 1 % (aço patinável)', desc: 'Estabiliza austenita e endurece por precipitação',
          valores: { el: 'Cu', teor: 1, comparar: true } },
        { nome: '6 · Estanho 0,05 % (residual)', desc: 'Teor mínimo, mas segrega nos contornos e fragiliza',
          valores: { el: 'Sn', teor: 0.05, comparar: true } },
        { nome: '7 · Titânio 0,3 % (microligado)', desc: 'Efeito enorme por ponto: fixa o carbono como TiC',
          valores: { el: 'Ti', teor: 0.3, comparar: true } }
      ],
      controles: [
        { id: 'el', tipo: 'select', label: 'Elemento de liga', valor: 'Cr',
          opcoes: Object.keys(ELEM).map(function (k) {
            return { v: k, t: ELEM[k].nome + '  (' + (ELEM[k].tipo === 'alfa' ? 'estabiliza ferrita' : 'estabiliza austenita') + ')' };
          }) },
        { id: 'teor', label: 'Teor', min: 0, max: 14, step: 0.05, valor: 2, unidade: '%' },
        { tipo: 'separador' },
        { id: 'comparar', tipo: 'check', label: 'Mostrar todos os elementos nas curvas', valor: true }
      ],
      graficos: [
        { id: 'temp', titulo: 'Efeito sobre a TEMPERATURA eutetoide (curva de Bain)',
          xlabel: 'Teor do elemento (%)', ylabel: 'Temperatura eutetoide (°C)', aspect: 0.40,
          legendPos: 'topleft' },
        { id: 'carb', titulo: 'Efeito sobre o TEOR DE CARBONO do eutetoide',
          xlabel: 'Teor do elemento (%)', ylabel: 'Carbono eutetoide (%)', aspect: 0.40,
          legendPos: 'topright' },
        { id: 'diag', titulo: 'O ponto eutetoide deslocado no diagrama',
          xlabel: 'Carbono (%)', ylabel: 'Temperatura (°C)', aspect: 0.40, legend: false }
      ],
      saidas: [
        { id: 'tipo', label: 'Tipo de estabilizador' },
        { id: 'Teut', label: 'Nova temperatura eutetoide' },
        { id: 'dT', label: 'Deslocamento em T' },
        { id: 'Ceut', label: 'Novo carbono eutetoide' },
        { id: 'dC', label: 'Deslocamento em C' },
        { id: 'classif', label: 'Um aço 0,45 %C passa a ser' },
        { id: 'carboneto', label: 'Forma carboneto?' },
        { id: 'papel', label: 'Papel principal' }
      ],
      formulas: [
        { g: 'A regra geral' },
        { tex: '\\text{TODOS os elementos ABAIXAM o carbono eutetoide}',
          d: 'sem exceção — o ponto eutetoide sempre anda para a esquerda', destaque: true },
        { tex: '\\text{A temperatura eutetoide sobe OU desce, conforme o elemento}',
          d: 'e é essa divisão que classifica os elementos em dois grupos', destaque: true },

        { g: 'Estabilizadores de FERRITA (alfagênicos)' },
        { tex: 'Ti,\\ Nb,\\ V,\\ W,\\ Mo,\\ Si,\\ Cr,\\ Al,\\ Sn,\\ P',
          d: 'SOBEM a temperatura eutetoide e FECHAM o campo austenítico', destaque: true },
        { tex: '\\text{Em teor alto: o campo } \\gamma \\text{ desaparece}',
          d: 'a liga fica ferrítica em qualquer temperatura e NÃO PODE ser temperada — é o caso do inox 430' },
        { tex: '\\text{Quase todos formam CARBONETOS}',
          d: 'e carbonetos são o que dá resistência ao desgaste e dureza secundária' },

        { g: 'Estabilizadores de AUSTENITA (gamagênicos)' },
        { tex: 'Ni,\\ Mn,\\ Cu,\\ Co,\\ C,\\ N',
          d: 'DESCEM a temperatura eutetoide e ABREM o campo austenítico', destaque: true },
        { tex: '\\text{Em teor alto: austenita estável à temperatura AMBIENTE}',
          d: 'é o princípio do inox 304 (18 Cr, 8 Ni) e do aço Hadfield (12 % Mn)', destaque: true },
        { tex: 'Ni_{eq} = Ni + 30C + 0{,}5Mn \\qquad Cr_{eq} = Cr + Mo + 1{,}5Si + 0{,}5Nb',
          d: 'equivalentes do diagrama de Schaeffler: preveem a estrutura da solda de inox' },

        { g: 'Consequências práticas' },
        { tex: 'C_{eutetoide} \\downarrow \\Rightarrow \\text{um aço 0,45 \\%C pode virar HIPEReutetoide}',
          d: 'a mesma composição de carbono muda de classificação ao acrescentar liga', destaque: true },
        { tex: 'A_1 \\uparrow \\Rightarrow \\text{temperar exige forno mais quente}',
          d: 'toda a rotina de tratamento térmico se desloca junto' },
        { tex: '\\text{Nariz da TTT para a DIREITA} \\Rightarrow \\text{maior temperabilidade}',
          d: 'o efeito prático mais importante da adição de liga' },

        { g: 'Casos particulares que valem citar' },
        { tex: 'Cu: \\ \\text{endurece por precipitação e resiste à atmosfera}',
          d: 'base dos aços patináveis (Corten, A588); acima de 0,3 % pode dar fragilidade a quente', destaque: true },
        { tex: 'Sn: \\ \\text{residual da sucata, segrega nos contornos}',
          d: 'uma das causas da fragilização de revenido — mas é o elemento do BRONZE em ligas de cobre' },
        { tex: 'Mn: \\ \\text{neutraliza o enxofre formando MnS}',
          d: 'sem ele o FeS funde nos contornos e o aço racha ao ser laminado a quente' },
        { tex: 'S,\\ P: \\ \\text{impurezas}',
          d: 'S melhora a usinabilidade mas fragiliza a quente; P fragiliza a frio' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'As curvas de Bain aqui são ajustes de primeira ordem com saturação, calibrados nos valores clássicos (Cr 12 % → A₁ ≈ 800 °C e C_eut ≈ 0,35 %; Ni 8 % → A₁ ≈ 610 °C). Para valores de projeto use os diagramas ternários ou pseudobinários do sistema específico.',
      calcular: function (p, ctx) {
        var r = eutetoide(p.el, p.teor);
        var nt = Plot.numTex, sg = Plot.sig;
        var xs = Plot.linspace(0, 14, 90);

        /* temperatura eutetoide */
        var gt = ctx.plot('temp').clear();
        Object.keys(ELEM).forEach(function (k) {
          if (!p.comparar && k !== p.el) return;
          gt.line(xs, xs.map(function (x) { return eutetoide(k, x).T; }),
            { color: k === p.el ? Plot.serie(0) : Plot.serie(7),
              width: k === p.el ? 3 : 1.2,
              dash: k === p.el ? [] : [3, 3],
              label: k === p.el ? ELEM[k].nome : '' });
          if (k === p.el || !p.comparar) return;
          /* rótulo discreto no fim de cada curva */
          gt.text(13.6, eutetoide(k, 13.6).T, k,
            { align: 'left', size: 9.5, color: Plot.cssVar('--text-faint', '#999') });
        });
        gt.hline(727, { color: Plot.serie(3), dash: [5, 4], width: 1.4,
          text: '727 °C — Fe-C puro' });
        gt.marker(p.teor, r.T, ELEM[p.el].nome + ' ' + p.teor + ' % → ' + Plot.sig(r.T, 4) + ' °C',
          { color: Plot.serie(6) });
        gt.draw();

        /* carbono eutetoide */
        var gc = ctx.plot('carb').clear();
        Object.keys(ELEM).forEach(function (k) {
          if (!p.comparar && k !== p.el) return;
          gc.line(xs, xs.map(function (x) { return eutetoide(k, x).C; }),
            { color: k === p.el ? Plot.serie(0) : Plot.serie(7),
              width: k === p.el ? 3 : 1.2,
              dash: k === p.el ? [] : [3, 3],
              label: k === p.el ? ELEM[k].nome : '' });
          if (k !== p.el && p.comparar) {
            gc.text(13.6, eutetoide(k, 13.6).C, k,
              { align: 'left', size: 9.5, color: Plot.cssVar('--text-faint', '#999') });
          }
        });
        gc.hline(0.76, { color: Plot.serie(3), dash: [5, 4], width: 1.4,
          text: '0,76 % — Fe-C puro' });
        gc.marker(p.teor, r.C, Plot.sig(r.C, 3) + ' %C', { color: Plot.serie(6) });
        gc.draw();

        /* diagrama com o ponto deslocado */
        var gd = ctx.plot('diag').clear();
        gd.setLimits([0, 2.2], [500, 1000]);
        /* A3 e Acm originais */
        var Cs = Plot.linspace(0, 0.76, 40);
        gd.line(Cs, Cs.map(function (C) { return 912 - (912 - 727) * Math.pow(C / 0.76, 0.62); }),
          { color: Plot.serie(7), width: 1.6, dash: [4, 3] });
        var Cb = Plot.linspace(0.76, 2.14, 40);
        gd.line(Cb, Cb.map(function (C) {
          return 727 + (1147 - 727) * Math.pow((C - 0.76) / (2.14 - 0.76), 0.78);
        }), { color: Plot.serie(7), width: 1.6, dash: [4, 3] });
        gd.line([0, 2.2], [727, 727], { color: Plot.serie(7), width: 1.6, dash: [4, 3] });
        gd.text(1.6, 745, 'Fe-C puro', { align: 'center', size: 10,
          color: Plot.cssVar('--text-faint', '#999') });

        /* deslocado */
        var Cs2 = Plot.linspace(0, r.C, 40);
        gd.line(Cs2, Cs2.map(function (C) {
          return (912 + (r.T - 727) * 0.75) - ((912 + (r.T - 727) * 0.75) - r.T) * Math.pow(C / r.C, 0.62);
        }), { color: Plot.serie(0), width: 2.6 });
        var Cb2 = Plot.linspace(r.C, 2.14, 40);
        gd.line(Cb2, Cb2.map(function (C) {
          return r.T + (1147 - r.T) * Math.pow((C - r.C) / (2.14 - r.C), 0.78);
        }), { color: Plot.serie(0), width: 2.6 });
        gd.line([0, 2.2], [r.T, r.T], { color: Plot.serie(0), width: 2.6 });
        gd.marker(0.76, 727, 'original', { color: Plot.serie(7), r: 5, align: 'right', dx: -8 });
        gd.marker(r.C, r.T, 'com ' + p.teor + ' % ' + p.el, { color: Plot.serie(6), r: 6 });
        gd.vline(0.45, { color: Plot.serie(5), dash: [3, 3], width: 1.4,
          text: 'aço com 0,45 %C' });
        gd.draw();

        var classif = 0.45 < r.C ? 'hipoeutetoide' : (Math.abs(0.45 - r.C) < 0.02 ? 'eutetoide' : 'HIPEReutetoide');
        var formaCarb = ['Ti', 'V', 'Mo', 'W', 'Cr', 'Nb'].indexOf(p.el) >= 0;

        ctx.setPassos([
          { t: 'Que tipo de estabilizador é este elemento',
            tex: r.e.tipo === 'alfa' ? '\\text{Alfagênico: estabiliza a FERRITA}'
              : '\\text{Gamagênico: estabiliza a AUSTENITA}',
            texSub: '\\Delta T_{eutetoide} = ' + nt(r.T - 727) + '\\ ^\\circ C',
            obs: r.e.tipo === 'alfa'
              ? 'Sobe a temperatura eutetoide e FECHA o campo austenítico. Em teor suficiente o '
                + 'campo γ desaparece e a liga fica ferrítica em qualquer temperatura — nesse ponto '
                + 'ela deixa de poder ser temperada. É o caso do inox 430, com 17 % de cromo.'
              : 'Desce a temperatura eutetoide e ABRE o campo austenítico. Em teor suficiente a '
                + 'austenita passa a ser estável até a temperatura ambiente — é o princípio do inox '
                + '304 (18 Cr, 8 Ni) e do aço Hadfield, com 12 % de manganês.' },
          { t: 'Nova temperatura eutetoide A₁',
            tex: 'A_1 = 727 + \\Delta T(\\%\\text{elemento})',
            texSub: 'A_1 = 727 ' + (r.T >= 727 ? '+' : '-') + ' ' + nt(Math.abs(r.T - 727)) +
              ' = ' + nt(r.T) + '\\ ^\\circ C',
            obs: 'Toda a rotina de tratamento térmico se desloca junto: austenitizar, recozer e '
              + 'normalizar passam a exigir ' + (r.T > 727 ? 'temperaturas mais altas' : 'temperaturas mais baixas')
              + '. Usar a tabela do Fe-C puro num aço ligado é erro comum e leva a austenitização '
              + 'incompleta ou a crescimento de grão.' },
          { t: 'Novo teor de carbono do eutetoide',
            tex: 'C_{eut} = 0{,}76 - \\Delta C(\\%\\text{elemento})',
            texSub: 'C_{eut} = 0{,}76 - ' + nt(0.76 - r.C) + ' = ' + nt(r.C) + '\\%',
            obs: 'TODOS os elementos abaixam o carbono eutetoide, sem exceção — o ponto sempre anda '
              + 'para a esquerda. A razão é que o elemento ocupa lugar na austenita e reduz a '
              + 'quantidade de carbono que ela consegue reter até a reação.' },
          { t: 'Consequência sobre a classificação do aço',
            tex: '\\text{um aço com } 0{,}45\\%C',
            texSub: '0{,}45 \\ ' + (0.45 < r.C ? '<' : '>') + ' \\ ' + nt(r.C) +
              ' \\;\\Rightarrow\\; \\text{' + classif + '}',
            obs: 0.45 < r.C
              ? 'Continua hipoeutetoide: ao resfriar, forma ferrita proeutetoide nos contornos e '
                + 'depois perlita.'
              : 'MUDOU DE CLASSE. Com o eutetoide deslocado para ' + sg(r.C, 3) + ' %, um aço de '
                + '0,45 %C — que seria hipoeutetoide no Fe-C puro — passa a ser HIPEReutetoide, e '
                + 'agora precipita CEMENTITA em rede nos contornos. É por isso que aços ferramenta '
                + 'ligados formam carbonetos com teores de carbono que pareceriam modestos.' },
          { t: 'Papel prático deste elemento',
            tex: '\\text{' + r.e.nome + '}',
            texSub: formaCarb ? '\\text{forma carbonetos estáveis}' : '\\text{não forma carbonetos}',
            obs: r.e.papel }
        ]);

        return {
          tipo: { v: r.e.tipo === 'alfa' ? 'ferrita (alfagênico)' : 'austenita (gamagênico)', u: '',
                  classe: 'destaque' },
          Teut: { v: r.T, u: '°C' },
          dT: { v: r.T - 727, u: '°C' },
          Ceut: { v: r.C, u: '%' },
          dC: { v: r.C - 0.76, u: '%' },
          classif: { v: classif, u: '', classe: classif.indexOf('HIPER') === 0 ? 'alerta' : '' },
          carboneto: { v: formaCarb ? 'sim' : 'não', u: '' },
          papel: { v: r.e.nome, u: '' }
        };
      }
    });
  })();

})();

/* ============================================================
   Ciência dos Materiais II — simuladores
     1. sim-ttt            : curvas TTT e CCT com a curva de resfriamento
                             ANIMADA e o produto que se forma em cada caso
     2. sim-temperabilidade: ensaio Jominy, severidade do meio e diâmetro
                             crítico
     3. sim-revenimento    : dureza e tenacidade após revenir, parâmetro
                             de Hollomon-Jaffe
     4. sim-corrosao       : par galvânico, série eletroquímica, taxa de
                             corrosão e proteção catódica

   Modelos: as curvas TTT usam a forma clássica de C, com o nariz
   deslocado por carbono e elementos de liga; Ms e Mf pela equação de
   Andrews; dureza da martensita pela correlação com o carbono; e a
   taxa de corrosão pela lei de Faraday.
   ============================================================ */
(function () {
  'use strict';

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
    if (L < 1e-6) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(11, L * 0.34);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.42, y2 - uy * h - ux * h * 0.42);
    c.lineTo(x2 - ux * h - uy * h * 0.42, y2 - uy * h + ux * h * 0.42);
    c.closePath(); c.fill();
  }

  function semente(s) {
    var x = s || 1;
    return function () {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return x / 0x7fffffff;
    };
  }

  /* ============================================================
     Modelo das curvas TTT
     ============================================================ */
  var TTT = (function () {
    /* Ms pela equação de Andrews (1965), em °C */
    function Ms(p) {
      return 539 - 423 * p.C - 30.4 * p.Mn - 17.7 * p.Ni - 12.1 * p.Cr - 7.5 * p.Mo;
    }
    function Mf(p) { return Ms(p) - 215; }

    /* Deslocamento do nariz: carbono e liga atrasam a difusão.
       A referência é o aço eutetoide puro, com nariz em ~1 s a 550 °C. */
    function fatorLiga(p) {
      var f = 1;
      f *= Math.pow(10, 0.9 * Math.abs(p.C - 0.76) * 1.2);   /* longe do eutetoide, mais lento */
      f *= Math.pow(10, 0.35 * p.Mn + 0.55 * p.Cr + 0.85 * p.Mo + 0.20 * p.Ni + 0.35 * p.Si);
      return f;
    }
    var A1 = 727;

    /* tempo de INÍCIO da transformação, em segundos, na temperatura T */
    function tInicio(T, p) {
      var ms = Ms(p);
      if (T >= A1 - 1) return 1e9;
      if (T <= ms) return NaN;                       /* abaixo de Ms é martensita */
      var Tn = 550;                                  /* temperatura do nariz */
      var tn = 1.0 * fatorLiga(p);                   /* tempo no nariz */
      /* dois ramos: acima do nariz a força motriz é pequena;
         abaixo, a difusão é lenta. Ambos crescem afastando-se de Tn. */
      var d;
      if (T > Tn) {
        d = (T - Tn) / (A1 - Tn);
        return tn * Math.pow(10, 3.6 * Math.pow(d, 1.7));
      }
      d = (Tn - T) / (Tn - Math.max(ms, 150));
      return tn * Math.pow(10, 2.3 * Math.pow(d, 1.9));
    }
    function tFim(T, p) { return tInicio(T, p) * 12; }

    /* produto formado ao resfriar continuamente, dada a taxa em °C/s */
    function produto(taxa, p, Taus) {
      var ms = Ms(p);
      /* taxa crítica: a que passa exatamente pelo nariz */
      var tn = tInicio(550, p);
      var vc = ((Taus || 850) - 550) / tn;          /* °C/s para chegar a 550 °C no tempo do nariz */
      if (taxa >= vc) {
        return { nome: 'Martensita', cor: 5, frac: 1, dureza: durezaMart(p.C),
                 obs: 'A curva passou À ESQUERDA do nariz: nenhuma difusão teve tempo de acontecer.' };
      }
      if (taxa >= vc * 0.35) {
        var fm = (taxa - vc * 0.35) / (vc * 0.65);
        return { nome: 'Martensita + bainita', cor: 4, frac: fm,
                 dureza: durezaMart(p.C) * (0.60 + 0.40 * fm),
                 obs: 'A curva tangenciou o nariz: parte transformou em bainita antes de chegar a Ms.' };
      }
      if (taxa >= vc * 0.02) {
        return { nome: 'Perlita fina', cor: 3, frac: 1, dureza: 12 + 30 * Math.min(p.C, 0.9),
                 obs: 'Transformação logo abaixo do nariz: lamelas finas, dureza intermediária.' };
      }
      return { nome: 'Perlita grosseira', cor: 2, frac: 1, dureza: 6 + 22 * Math.min(p.C, 0.9),
               obs: 'Resfriamento lento, transformação perto de 700 °C: lamelas grosseiras e material mole.' };
    }

    /* Dureza da martensita, HRC — interpolada na curva de referência
       (Krauss / ASM). Depende SO do carbono: elemento de liga nao a altera. */
    var CURVA_HRC = [[0.05, 32], [0.10, 38], [0.20, 45], [0.30, 51], [0.40, 57],
                     [0.50, 60], [0.60, 64], [0.70, 65], [0.80, 65], [1.20, 65]];
    function durezaMart(C) {
      if (C <= CURVA_HRC[0][0]) return CURVA_HRC[0][1];
      for (var i = 1; i < CURVA_HRC.length; i++) {
        if (C <= CURVA_HRC[i][0]) {
          var a = CURVA_HRC[i - 1], b = CURVA_HRC[i];
          return a[1] + (b[1] - a[1]) * (C - a[0]) / (b[0] - a[0]);
        }
      }
      return CURVA_HRC[CURVA_HRC.length - 1][1];
    }
    /* fração de martensita já formada na temperatura T (Koistinen-Marburger) */
    function fracMart(T, p) {
      var ms = Ms(p);
      if (T >= ms) return 0;
      return 1 - Math.exp(-0.011 * (ms - T));
    }

    return { Ms: Ms, Mf: Mf, A1: A1, tInicio: tInicio, tFim: tFim, produto: produto,
             durezaMart: durezaMart, fracMart: fracMart, fatorLiga: fatorLiga };
  })();

  /* ============================================================
     1. Curvas TTT / CCT com resfriamento animado
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-ttt')) return;

    var A = { on: true, t: 0, rel: relogio(), ctx: null, p: null, r: null, vel: 1 };

    /* meios de resfriamento e a taxa aproximada que produzem */
    var MEIOS = {
      salmoura: { nome: 'Salmoura agitada', taxa: 600, H: 5.0 },
      agua:     { nome: 'Água agitada', taxa: 300, H: 1.5 },
      aguap:    { nome: 'Água parada', taxa: 150, H: 1.0 },
      oleo:     { nome: 'Óleo agitado', taxa: 45, H: 0.5 },
      oleop:    { nome: 'Óleo parado', taxa: 25, H: 0.3 },
      ar:       { nome: 'Ar soprado', taxa: 5, H: 0.05 },
      arcalmo:  { nome: 'Ar calmo (normalização)', taxa: 1.2, H: 0.02 },
      forno:    { nome: 'Forno (recozimento)', taxa: 0.02, H: 0.005 }
    };

    function desenharMicro(c, pl, p, r, prog) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var cx = a.x + a.w * 0.26, cy = a.y + a.h * 0.56;
      var R = Math.min(a.w * 0.22, a.h * 0.38);

      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
      c.fillRect(cx - R, cy - R, 2 * R, 2 * R);

      var rnd = semente(13);
      var nG = 12, graos = [];
      for (var i = 0; i < nG; i++) {
        graos.push({ x: cx + (rnd() - 0.5) * 2.2 * R, y: cy + (rnd() - 0.5) * 2.2 * R,
                     r: R * (0.30 + rnd() * 0.22) });
      }
      /* austenita de fundo */
      graos.forEach(function (g) {
        c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU);
        c.fillStyle = Plot.serie(1); c.globalAlpha = 0.45; c.fill(); c.globalAlpha = 1;
        c.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c.lineWidth = 1.8; c.stroke();
      });
      /* produto formado, conforme a fração já transformada */
      var f = Math.max(0, Math.min(1, prog));
      var nome = r.prod.nome;
      graos.forEach(function (g, k) {
        if (k / nG > f) return;
        c.save();
        c.beginPath(); c.arc(g.x, g.y, g.r * 0.94, 0, TAU); c.clip();
        if (nome.indexOf('Martensita') === 0) {
          /* agulhas cruzadas */
          c.strokeStyle = Plot.serie(5); c.lineWidth = 2.4;
          for (var m = 0; m < 9; m++) {
            var ang = (m * 47 % 180) * Math.PI / 180;
            var off = (m - 4) * g.r * 0.22;
            c.beginPath();
            c.moveTo(g.x + Math.cos(ang) * g.r - Math.sin(ang) * off,
                     g.y + Math.sin(ang) * g.r + Math.cos(ang) * off);
            c.lineTo(g.x - Math.cos(ang) * g.r - Math.sin(ang) * off,
                     g.y - Math.sin(ang) * g.r + Math.cos(ang) * off);
            c.stroke();
          }
        } else if (nome.indexOf('bainita') > 0 || nome.indexOf('Bainita') === 0) {
          c.strokeStyle = Plot.serie(4); c.lineWidth = 2.6; c.lineCap = 'round';
          for (var b = 0; b < 7; b++) {
            var an2 = ((b * 61) % 180) * Math.PI / 180;
            c.beginPath();
            c.moveTo(g.x - Math.cos(an2) * g.r * 0.7, g.y - Math.sin(an2) * g.r * 0.7);
            c.lineTo(g.x + Math.cos(an2) * g.r * 0.7, g.y + Math.sin(an2) * g.r * 0.7);
            c.stroke();
          }
          c.lineCap = 'butt';
        } else {
          /* perlita lamelar, mais fina ou mais grossa */
          var passo = nome.indexOf('fina') > 0 ? 4 : 8;
          var ang3 = ((k * 53) % 180) * Math.PI / 180;
          c.translate(g.x, g.y); c.rotate(ang3);
          c.strokeStyle = Plot.serie(nome.indexOf('fina') > 0 ? 3 : 2);
          c.lineWidth = passo === 4 ? 1.6 : 2.6;
          for (var y = -g.r; y <= g.r; y += passo) {
            c.beginPath(); c.moveTo(-g.r, y); c.lineTo(g.r, y); c.stroke();
          }
        }
        c.restore();
      });
      c.restore();
      c.strokeStyle = Plot.cssVar('--border', '#ddd'); c.lineWidth = 2.4;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();

      /* legenda */
      var lx = a.x + a.w * 0.55, ly = a.y + a.h * 0.26;
      c.fillStyle = cor; c.font = fonte(13, '700');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText(r.prod.nome, lx, ly);
      c.font = fonte(11.5, '600');
      c.fillStyle = Plot.serie(r.prod.cor);
      c.fillText(Plot.sig(r.prod.dureza, 3) + ' HRC', lx, ly + 22);
      c.font = fonte(10.5); c.fillStyle = faint;
      var palavras = r.prod.obs.split(' ');
      var linha = '', linhas = [];
      palavras.forEach(function (w) {
        if ((linha + ' ' + w).length > 40) { linhas.push(linha); linha = w; }
        else linha = linha ? linha + ' ' + w : w;
      });
      if (linha) linhas.push(linha);
      linhas.forEach(function (t, i2) { c.fillText(t, lx, ly + 46 + i2 * 14); });
      c.fillStyle = faint;
      c.fillText('transformado: ' + Math.round(f * 100) + ' %', lx, ly + 50 + linhas.length * 14);

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Microestrutura resultante', a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('representação esquemática · agulhas = martensita · lamelas = perlita · ripas = bainita',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-ttt', {
      titulo: 'Curvas TTT e CCT — o que se forma depende da velocidade',
      descricao: 'O diagrama de equilíbrio só prevê perlita. Resfriando rápido a difusão não acompanha, e aparecem bainita e martensita. Escolha o meio de têmpera e veja a curva de resfriamento cruzar — ou escapar — do nariz.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Aço 1080 temperado em água', desc: 'Passa à esquerda do nariz: martensita pura',
          valores: { C: 0.80, Mn: 0.75, Cr: 0, Ni: 0, Mo: 0, Si: 0.25, meio: 'agua', Taus: 850, animar: true, vel: 1 } },
        { nome: '2 · Mesmo aço em óleo', desc: 'Tangencia o nariz: martensita com bainita',
          valores: { C: 0.80, Mn: 0.75, Cr: 0, Ni: 0, Mo: 0, Si: 0.25, meio: 'oleo', Taus: 850, animar: true, vel: 1 } },
        { nome: '3 · Mesmo aço ao ar', desc: 'Cruza o nariz: perlita fina, sem endurecer',
          valores: { C: 0.80, Mn: 0.75, Cr: 0, Ni: 0, Mo: 0, Si: 0.25, meio: 'arcalmo', Taus: 850, animar: true, vel: 1 } },
        { nome: '4 · Recozimento no forno', desc: 'Perlita grosseira: o estado mais mole possível',
          valores: { C: 0.80, Mn: 0.75, Cr: 0, Ni: 0, Mo: 0, Si: 0.25, meio: 'forno', Taus: 850, animar: true, vel: 1 } },
        { nome: '5 · Aço 4140 (Cr-Mo) em óleo', desc: 'A liga empurra o nariz para a direita: tempera em óleo',
          valores: { C: 0.40, Mn: 0.87, Cr: 0.95, Ni: 0, Mo: 0.20, Si: 0.25, meio: 'oleo', Taus: 850, animar: true, vel: 1 } },
        { nome: '6 · Aço 4340 ao ar', desc: 'Tão temperável que endurece resfriando ao ar',
          valores: { C: 0.40, Mn: 0.70, Cr: 0.80, Ni: 1.80, Mo: 0.25, Si: 0.25, meio: 'ar', Taus: 850, animar: true, vel: 1 } },
        { nome: '7 · Baixo carbono em salmoura', desc: 'Mesmo temperando forte, martensita mole: falta carbono',
          valores: { C: 0.20, Mn: 0.45, Cr: 0, Ni: 0, Mo: 0, Si: 0.25, meio: 'salmoura', Taus: 900, animar: true, vel: 1 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Composição do aço' },
        { id: 'C', label: 'Carbono', min: 0.1, max: 1.2, step: 0.01, valor: 0.40, unidade: '%',
          desc: 'Define a DUREZA da martensita — e só ele.' },
        { id: 'Mn', label: 'Manganês', min: 0, max: 2, step: 0.05, valor: 0.87, unidade: '%' },
        { id: 'Cr', label: 'Cromo', min: 0, max: 3, step: 0.05, valor: 0.95, unidade: '%' },
        { id: 'Ni', label: 'Níquel', min: 0, max: 4, step: 0.05, valor: 0, unidade: '%' },
        { id: 'Mo', label: 'Molibdênio', min: 0, max: 1, step: 0.05, valor: 0.20, unidade: '%',
          desc: 'O mais eficaz para empurrar o nariz — por isso está em quase todo aço temperável.' },
        { id: 'Si', label: 'Silício', min: 0, max: 2, step: 0.05, valor: 0.25, unidade: '%' },
        { tipo: 'titulo', label: 'Tratamento' },
        { id: 'Taus', label: 'Temperatura de austenitização', min: 780, max: 1000, step: 10,
          valor: 850, unidade: '°C' },
        { id: 'meio', tipo: 'select', label: 'Meio de resfriamento', valor: 'oleo',
          opcoes: Object.keys(MEIOS).map(function (k) {
            return { v: k, t: MEIOS[k].nome + '  (~' + MEIOS[k].taxa + ' °C/s)' };
          }) },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Resfriar', valor: true },
        { id: 'vel', label: 'Velocidade', min: 0.2, max: 4, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'ttt', titulo: 'Diagrama TTT com a curva de resfriamento',
          xlabel: 'log₁₀ do tempo (s)', ylabel: 'Temperatura (°C)', aspect: 0.56,
          legendPos: 'topright' },
        { id: 'micro', axes: false, height: 320, grid: false, legend: false },
        { id: 'dureza', titulo: 'Dureza obtida em cada meio de resfriamento',
          xlabel: '', ylabel: 'Dureza (HRC)', aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'prod', label: 'Produto formado' },
        { id: 'dur', label: 'Dureza resultante' },
        { id: 'Ms', label: 'Temperatura M_s' },
        { id: 'Mf', label: 'Temperatura M_f' },
        { id: 'tn', label: 'Tempo no nariz' },
        { id: 'vc', label: 'Taxa crítica de têmpera' },
        { id: 'taxa', label: 'Taxa do meio escolhido' },
        { id: 'retida', label: 'Austenita retida a 25 °C' }
      ],
      formulas: [
        { g: 'Por que o diagrama de equilíbrio não basta' },
        { tex: '\\text{Fe-C prevê apenas } \\alpha + Fe_3C',
          d: 'ele supõe difusão completa — resfriamento infinitamente lento', destaque: true },
        { tex: '\\text{Resfriando rápido: a difusão NÃO acompanha}',
          d: 'aparecem produtos fora do equilíbrio: bainita e martensita', destaque: true },
        { tex: 'TTT: \\ \\text{isotérmico} \\qquad CCT: \\ \\text{resfriamento contínuo}',
          d: 'a CCT é a que vale na prática; fica deslocada para a direita e para baixo da TTT' },

        { g: 'Os produtos, do mais lento ao mais rápido' },
        { tex: '\\text{Perlita grosseira} \\ (\\sim 700\\ ^\\circ C)',
          d: 'lamelas espessas, ~15 HRC — o estado recozido', destaque: true },
        { tex: '\\text{Perlita fina} \\ (\\sim 600\\ ^\\circ C)',
          d: 'lamelas finas, ~30 HRC — mais dura porque há mais interfaces bloqueando discordâncias' },
        { tex: '\\text{Bainita} \\ (400\\ \\text{a}\\ 550\\ ^\\circ C)',
          d: 'ferrita em ripas com carbonetos finos; dura E tenaz — o melhor compromisso', destaque: true },
        { tex: '\\text{Martensita} \\ (T < M_s)',
          d: 'transformação SEM difusão, por cisalhamento da rede: TCC supersaturada em carbono', destaque: true },

        { g: 'Martensita' },
        { tex: 'M_s = 539 - 423C - 30{,}4Mn - 17{,}7Ni - 12{,}1Cr - 7{,}5Mo',
          d: 'equação de Andrews, em °C — o carbono é de longe o mais influente', destaque: true },
        { tex: 'f = 1 - \\exp[-0{,}011(M_s - T)]',
          d: 'Koistinen-Marburger: a fração transformada depende SÓ da temperatura, não do tempo', destaque: true },
        { tex: 'HRC_{max} \\approx f(\\%C) \\ \\text{apenas}',
          d: 'a dureza da martensita depende só do carbono; a liga não a aumenta', destaque: true },
        { tex: 'M_f < 25\\ ^\\circ C \\;\\Rightarrow\\; \\text{austenita retida}',
          d: 'em aço de alto carbono sobra austenita não transformada, que é mole e instável' },

        { g: 'Taxa crítica de têmpera' },
        { tex: 'v_c = \\text{a taxa que tangencia o nariz da curva}',
          d: 'mais rápido que ela: martensita. Mais devagar: começa a difundir', destaque: true },
        { tex: '\\text{Liga} \\uparrow \\;\\Rightarrow\\; \\text{nariz para a DIREITA} \\;\\Rightarrow\\; v_c \\downarrow',
          d: 'é isso que o elemento de liga faz: dá tempo, permitindo temperar em meio mais brando' },
        { tex: 'Mo > Cr > Mn > Ni',
          d: 'ordem aproximada de eficácia para atrasar a transformação difusional' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'As curvas TTT aqui são geradas por um modelo de forma clássica em C, calibrado no aço eutetoide (nariz em cerca de 1 s a 550 °C) e deslocado pelo carbono e pelos elementos de liga. Servem para entender o comportamento; para projeto use os diagramas TTT/CCT levantados experimentalmente para aquele aço.',
      calcular: function (p, ctx) {
        var meio = MEIOS[p.meio];
        var ms = TTT.Ms(p), mf = TTT.Mf(p);
        var tn = TTT.tInicio(550, p);
        var vc = (p.Taus - 550) / tn;
        var prod = TTT.produto(meio.taxa, p, p.Taus);
        var retida = ms > 25 ? Math.max(0, 1 - TTT.fracMart(25, p)) : 1;
        var r = { meio: meio, ms: ms, mf: mf, tn: tn, vc: vc, prod: prod, retida: retida };
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.vel = p.vel;
        desenhaMicro();

        /* ---------- diagrama TTT ---------- */
        var g = ctx.plot('ttt').clear();
        g.setLimits([-2, 6], [0, 900]);
        var Ts = [];
        for (var T = Math.max(ms + 5, 160); T < TTT.A1 - 2; T += 4) Ts.push(T);
        g.line(Ts.map(function (T) { return Math.log(TTT.tInicio(T, p)) / Math.LN10; }), Ts,
          { color: Plot.serie(0), width: 2.6, label: 'início da transformação' });
        g.line(Ts.map(function (T) { return Math.log(TTT.tFim(T, p)) / Math.LN10; }), Ts,
          { color: Plot.serie(1), width: 2.2, dash: [5, 4], label: 'fim da transformação' });
        g.hline(TTT.A1, { color: Plot.serie(3), dash: [4, 3], width: 1.6, text: 'A₁ = 727 °C' });
        g.hline(ms, { color: Plot.serie(5), dash: [], width: 2,
          text: 'M_s = ' + Plot.sig(ms, 4) + ' °C' });
        g.hline(mf, { color: Plot.serie(5), dash: [3, 4], width: 1.4,
          text: 'M_f = ' + Plot.sig(mf, 4) + ' °C' });
        /* rótulos das regiões */
        g.text(Math.log(tn * 60) / Math.LN10, 660, 'perlita grosseira',
          { align: 'center', size: 10.5, color: Plot.cssVar('--text-muted', '#666') });
        g.text(Math.log(tn * 40) / Math.LN10, 580, 'perlita fina',
          { align: 'center', size: 10.5, color: Plot.cssVar('--text-muted', '#666') });
        g.text(Math.log(tn * 60) / Math.LN10, Math.max(ms + 60, 420), 'bainita',
          { align: 'center', size: 10.5, color: Plot.cssVar('--text-muted', '#666') });
        g.text(2.5, Math.max(ms - 90, 60), 'martensita',
          { align: 'center', size: 11, color: Plot.serie(5) });

        /* curva de resfriamento do meio escolhido, e das outras opções */
        function curvaRes(taxa) {
          var xs = [], ys = [];
          for (var i = 0; i <= 90; i++) {
            var lt = -2 + 8 * i / 90;
            var t = Math.pow(10, lt);
            var Tc = p.Taus - taxa * t;
            if (Tc < 20) { xs.push(lt); ys.push(20); break; }
            xs.push(lt); ys.push(Tc);
          }
          return { xs: xs, ys: ys };
        }
        Object.keys(MEIOS).forEach(function (k) {
          if (k === p.meio) return;
          var cv = curvaRes(MEIOS[k].taxa);
          g.line(cv.xs, cv.ys, { color: Plot.cssVar('--text-faint', '#999'), width: 1,
            dash: [2, 3] });
        });
        var cvAtual = curvaRes(meio.taxa);
        g.line(cvAtual.xs, cvAtual.ys, { color: Plot.serie(6), width: 3,
          label: meio.nome });
        var cvCrit = curvaRes(vc);
        g.line(cvCrit.xs, cvCrit.ys, { color: Plot.serie(4), width: 1.8, dash: [6, 4],
          label: 'taxa crítica ' + Plot.sig(vc, 3) + ' °C/s' });
        g.draw();
        A.curva = cvAtual;

        /* ---------- dureza por meio ---------- */
        var gd = ctx.plot('dureza').clear();
        var ks = Object.keys(MEIOS);
        gd.o.xcat = ks.map(function (k, i) { return { v: i, label: MEIOS[k].nome.split(' ')[0] }; });
        var durs = ks.map(function (k) { return TTT.produto(MEIOS[k].taxa, p, p.Taus).dureza; });
        gd.setLimits([-0.62, ks.length - 0.38], [0, Math.max.apply(null, durs) * 1.24]);
        ks.forEach(function (k, i) {
          gd.bars([i], [durs[i]], { color: k === p.meio ? Plot.serie(6) : Plot.serie(1), barw: 0.52 });
          gd.text(i, durs[i], Plot.sig(durs[i], 3), { align: 'center', dy: -7, size: 10.5 });
        });
        gd.draw();

        /* ---------- passo a passo ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        ctx.setPassos([
          { t: 'Temperatura de início da martensita — equação de Andrews',
            tex: 'M_s = 539 - 423C - 30{,}4Mn - 17{,}7Ni - 12{,}1Cr - 7{,}5Mo',
            texSub: 'M_s = 539 - 423(' + nt(p.C) + ') - 30{,}4(' + nt(p.Mn) + ') - 17{,}7(' +
              nt(p.Ni) + ') - 12{,}1(' + nt(p.Cr) + ') - 7{,}5(' + nt(p.Mo) + ') = ' +
              nt(ms) + '\\ ^\\circ C',
            obs: 'O carbono pesa muito mais que todos os outros somados: cada 0,1 % dele abaixa M_s '
              + 'em 42 °C. Por isso aço de alto carbono termina a transformação abaixo da temperatura '
              + 'ambiente — e sobra austenita retida.' },
          { t: 'Posição do nariz da curva',
            tex: 't_{nariz} \\approx 1\\ \\mathrm{s} \\times f(\\text{liga})',
            texSub: 't_{nariz} = ' + nt(tn) + '\\ \\mathrm{s} \\quad\\text{a}\\quad 550\\ ^\\circ C',
            obs: 'O nariz é o ponto de transformação mais RÁPIDA: acima dele falta força motriz, '
              + 'abaixo falta difusão. Os elementos de liga o empurram para a direita — aqui o '
              + 'fator de atraso vale ' + sg(TTT.fatorLiga(p), 3) + '× em relação ao aço eutetoide puro.' },
          { t: 'Taxa crítica de têmpera',
            tex: 'v_c = \\frac{T_{aus} - T_{nariz}}{t_{nariz}}',
            texSub: 'v_c = \\frac{' + p.Taus + ' - 550}{' + nt(tn) + '} = ' + nt(vc) +
              '\\ ^\\circ\\mathrm{C/s}',
            obs: 'É a velocidade mínima para passar à esquerda do nariz e obter martensita. Abaixo '
              + 'dela, parte do material transforma por difusão antes de chegar a M_s.' },
          { t: 'Comparação com o meio escolhido',
            tex: 'v_{meio} \\ \\text{contra} \\ v_c',
            texSub: nt(meio.taxa) + ' \\ ' + (meio.taxa >= vc ? '>' : '<') + ' \\ ' + nt(vc) +
              ' \\;\\Rightarrow\\; \\text{' + prod.nome + '}',
            obs: prod.obs + ' Dureza resultante: ' + sg(prod.dureza, 3) + ' HRC.' },
          { t: 'Dureza da martensita depende SÓ do carbono',
            tex: 'HRC_{martensita} = f(\\%C)',
            texSub: '\\%C = ' + nt(p.C) + ' \\;\\Rightarrow\\; HRC_{max} \\approx ' +
              nt(TTT.durezaMart(p.C)),
            obs: 'Este é o ponto mais mal compreendido do capítulo. Cromo, molibdênio e níquel NÃO '
              + 'tornam a martensita mais dura: eles apenas facilitam obtê-la, empurrando o nariz. '
              + 'Um aço 4340 temperado tem a mesma dureza de um 1040 temperado — só que o 4340 '
              + 'consegue isso em peça grossa e em óleo, e o 1040 não.' },
          { t: 'Austenita retida',
            tex: 'f_{\\gamma} = \\exp[-0{,}011(M_s - 25)]',
            texSub: 'f_{\\gamma} = \\exp[-0{,}011(' + nt(ms) + ' - 25)] = ' + nt(retida) +
              ' = ' + nt(retida * 100) + '\\%',
            obs: mf < 25
              ? 'M_f = ' + sg(mf, 4) + ' °C está ABAIXO da temperatura ambiente: sobra ' +
                sg(retida * 100, 3) + ' % de austenita não transformada. Ela é mole, prejudica a '
                + 'dureza e ainda pode transformar depois, em serviço, causando variação dimensional. '
                + 'A correção é o tratamento sub-zero.'
              : 'M_f = ' + sg(mf, 4) + ' °C está acima da temperatura ambiente: a transformação '
                + 'se completa e praticamente não sobra austenita retida.' }
        ]);

        return {
          prod: { v: prod.nome, u: '', classe: 'destaque' },
          dur: { v: prod.dureza, u: 'HRC' },
          Ms: { v: ms, u: '°C' },
          Mf: { v: mf, u: '°C', classe: mf < 25 ? 'alerta' : '' },
          tn: { v: tn, u: 's' },
          vc: { v: vc, u: '°C/s' },
          taxa: { v: meio.taxa, u: '°C/s' },
          retida: { v: retida * 100, u: '%', classe: retida > 0.05 ? 'alerta' : 'ok' }
        };
      }
    });

    function desenhaMicro() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('micro');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharMicro(c, plot, A.p, A.r, A.on ? A.t : 1); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.r) return;
      var dt = A.rel.dt();
      A.t += dt * 0.32 * A.vel;
      if (A.t > 1.6) A.t = 0;
      desenhaMicro();
      /* ponto correndo pela curva de resfriamento */
      var g = A.ctx.plot('ttt');
      if (g && A.curva) {
        g.draw();
        var n = A.curva.xs.length;
        var idx = Math.min(n - 1, Math.floor(Math.min(A.t, 1) * (n - 1)));
        var c2 = g.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath();
        c2.arc(g.px(A.curva.xs[idx]), g.py(A.curva.ys[idx]), 6, 0, TAU);
        c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 2; c2.stroke();
        c2.restore();
      }
    });
  })();

  /* ============================================================
     2. Temperabilidade — ensaio Jominy e diâmetro crítico
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-temperabilidade')) return;

    var A = { on: true, fase: 0, rel: relogio(), ctx: null, p: null, r: null };

    /* Severidade de têmpera H de Grossmann, em pol⁻¹ */
    var MEIOS = {
      ar:      { nome: 'Ar parado', H: 0.02 },
      oleop:   { nome: 'Óleo parado', H: 0.30 },
      oleo:    { nome: 'Óleo agitado', H: 0.50 },
      oleof:   { nome: 'Óleo fortemente agitado', H: 0.80 },
      aguap:   { nome: 'Água parada', H: 1.00 },
      agua:    { nome: 'Água agitada', H: 1.50 },
      aguaf:   { nome: 'Água fortemente agitada', H: 2.00 },
      salmoura: { nome: 'Salmoura agitada', H: 5.00 }
    };

    /* Diâmetro ideal DI pelo método de Grossmann.
       Base para tamanho de grão ASTM 7; multiplicadores por elemento. */
    function calcDI(p) {
      var base = 13.7 * Math.sqrt(p.C);          /* mm */
      /* grão mais fino: menos temperabilidade (menos sítios? não — MAIS
         contornos, mais nucleação de perlita, logo MENOS temperável) */
      base *= Math.pow(7 / p.grao, 0.5);
      var f = (1 + 3.333 * p.Mn) * (1 + 0.700 * p.Si) * (1 + 0.363 * p.Ni)
            * (1 + 2.160 * p.Cr) * (1 + 3.000 * p.Mo);
      return base * f;
    }
    /* fração do DI que se tempera em um meio de severidade H */
    function fatorH(H) {
      /* ajuste às curvas de Grossmann: cresce depressa e satura perto de 1 */
      return 1 - Math.exp(-1.45 * Math.pow(H, 0.62));
    }

    function jominy(J, p, r) {
      /* J em mm a partir da extremidade temperada */
      var Hmax = TTT.durezaMart(p.C);
      var Hmin = 6 + 22 * Math.min(p.C, 0.9);
      var J50 = Math.max(1.2, r.DI / 12);
      return Hmin + (Hmax - Hmin) / (1 + Math.pow(J / J50, 2.2));
    }

    function desenharCorpo(c, pl, p, r, fase) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');

      /* corpo de prova Jominy: cilindro vertical, jato d'água embaixo */
      var cx = a.x + a.w * 0.22;
      var yTop = a.y + a.h * 0.16, yBot = a.y + a.h * 0.80;
      var larg = Math.min(a.w * 0.09, 46);
      var Lmm = 100;                                  /* comprimento do corpo */

      c.setLineDash([]);
      /* gradiente de dureza pintado ao longo do comprimento */
      var n = 60;
      for (var i = 0; i < n; i++) {
        var ya = yBot - (yBot - yTop) * i / n;
        var yb = yBot - (yBot - yTop) * (i + 1) / n;
        var Jmm = Lmm * i / n;
        var h = jominy(Jmm, p, r);
        var f = (h - 6) / Math.max(TTT.durezaMart(p.C) - 6, 1);
        c.fillStyle = Plot.serie(5);
        c.globalAlpha = 0.10 + 0.72 * Math.max(0, Math.min(1, f));
        c.fillRect(cx - larg / 2, yb, larg, ya - yb + 1);
      }
      c.globalAlpha = 1;
      c.strokeStyle = borda; c.lineWidth = 2;
      c.strokeRect(cx - larg / 2, yTop, larg, yBot - yTop);

      /* jato de água */
      var jx = cx, jy = yBot;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 3.4; c.lineCap = 'round';
      for (var k = 0; k < 6; k++) {
        var ph = ((fase * 2 + k / 6) % 1);
        var yy = jy + 46 - ph * 40;
        c.globalAlpha = 0.85 * (0.3 + 0.7 * ph);
        c.beginPath(); c.moveTo(jx, yy); c.lineTo(jx, yy - 12); c.stroke();
      }
      c.globalAlpha = 1; c.lineCap = 'butt';
      /* respingos */
      c.fillStyle = Plot.serie(0);
      for (k = 0; k < 12; k++) {
        var ang = Math.PI + (k / 12) * Math.PI;
        var d2 = 12 + ((fase * 60 + k * 7) % 26);
        c.globalAlpha = 0.7 * (1 - d2 / 40);
        c.beginPath();
        c.arc(jx + Math.cos(ang) * d2, jy + 4 - Math.abs(Math.sin(ang)) * d2 * 0.5, 2.4, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
      c.fillStyle = Plot.serie(0); c.font = fonte(10.5, '600');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('jato de água a 24 °C', jx, jy + 52);

      /* escala e leituras */
      c.strokeStyle = faint; c.fillStyle = faint; c.lineWidth = 1;
      c.font = fonte(9.5);
      c.textAlign = 'right'; c.textBaseline = 'middle';
      [0, 10, 20, 30, 50, 100].forEach(function (Jm) {
        var Y = yBot - (yBot - yTop) * Jm / Lmm;
        c.beginPath(); c.moveTo(cx - larg / 2 - 6, Y); c.lineTo(cx - larg / 2, Y); c.stroke();
        c.fillText(Jm + ' mm', cx - larg / 2 - 9, Y);
      });
      c.textAlign = 'left';
      [0, 10, 20, 30, 50].forEach(function (Jm) {
        var Y = yBot - (yBot - yTop) * Jm / Lmm;
        c.fillStyle = Plot.serie(6); c.font = fonte(10, '600');
        c.fillText(Plot.sig(jominy(Jm, p, r), 3) + ' HRC', cx + larg / 2 + 8, Y);
      });

      /* barra redonda temperada, à direita */
      var bx = a.x + a.w * 0.68, by = a.y + a.h * 0.50;
      var Rb = Math.min(a.w * 0.13, a.h * 0.26);
      var Dc = r.Dcrit;
      /* núcleo endurecido em relação ao diâmetro escolhido */
      var frac = Math.max(0, Math.min(1, Dc / Math.max(p.Dbarra, 1)));
      c.fillStyle = Plot.serie(1); c.globalAlpha = 0.25;
      c.beginPath(); c.arc(bx, by, Rb, 0, TAU); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = Plot.serie(5); c.globalAlpha = 0.55;
      c.beginPath();
      c.arc(bx, by, Rb, 0, TAU);
      c.arc(bx, by, Rb * (1 - frac), 0, TAU, true);
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = borda; c.lineWidth = 2;
      c.beginPath(); c.arc(bx, by, Rb, 0, TAU); c.stroke();
      c.strokeStyle = Plot.serie(5); c.lineWidth = 1.6; c.setLineDash([4, 3]);
      c.beginPath(); c.arc(bx, by, Rb * (1 - frac), 0, TAU); c.stroke();
      c.setLineDash([]);
      c.fillStyle = cor; c.font = fonte(11, '700');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('Barra Ø' + p.Dbarra + ' mm', bx, by + Rb + 10);
      c.font = fonte(10.5);
      c.fillStyle = frac >= 1 ? Plot.serie(2) : Plot.serie(5);
      c.fillText(frac >= 1 ? 'endurece até o núcleo'
                 : 'só a casca endurece (' + Plot.sig(Dc, 3) + ' mm de Ø crítico)',
                 bx, by + Rb + 26);
      c.fillStyle = faint; c.font = fonte(9.5);
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('vermelho = martensita  ·  azul = núcleo não temperado', bx, by - Rb - 8);

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Ensaio Jominy (ASTM A255) e a barra real', a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('a extremidade recebe o jato e resfria depressa; longe dela, cada vez mais devagar',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-temperabilidade', {
      titulo: 'Temperabilidade — ensaio Jominy e diâmetro crítico',
      descricao: 'Temperabilidade não é dureza: é a PROFUNDIDADE até onde a dureza chega. Um 1040 e um 4140 temperados atingem quase a mesma dureza na superfície — a diferença aparece no núcleo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Aço 1040 em água', desc: 'Baixa temperabilidade: só a casca endurece',
          valores: { C: 0.40, Mn: 0.75, Si: 0.25, Ni: 0, Cr: 0, Mo: 0, grao: 7, meio: 'agua', Dbarra: 50, animar: true } },
        { nome: '2 · Aço 4140 em óleo', desc: 'Cr-Mo: tempera em óleo e chega mais fundo',
          valores: { C: 0.40, Mn: 0.87, Si: 0.25, Ni: 0, Cr: 0.95, Mo: 0.20, grao: 7, meio: 'oleo', Dbarra: 50, animar: true } },
        { nome: '3 · Aço 4340 em óleo', desc: 'O mais temperável dos aços de construção mecânica',
          valores: { C: 0.40, Mn: 0.70, Si: 0.25, Ni: 1.80, Cr: 0.80, Mo: 0.25, grao: 7, meio: 'oleo', Dbarra: 100, animar: true } },
        { nome: '4 · Mesmo 1040, barra fina', desc: 'Com Ø 20 mm o 1040 já endurece até o centro',
          valores: { C: 0.40, Mn: 0.75, Si: 0.25, Ni: 0, Cr: 0, Mo: 0, grao: 7, meio: 'agua', Dbarra: 20, animar: true } },
        { nome: '5 · Efeito do grão grosseiro', desc: 'Grão maior = MAIS temperável (menos sítios de nucleação)',
          valores: { C: 0.40, Mn: 0.75, Si: 0.25, Ni: 0, Cr: 0, Mo: 0, grao: 4, meio: 'agua', Dbarra: 50, animar: true } },
        { nome: '6 · Alto carbono, baixa liga', desc: 'Dureza máxima alta, mas temperabilidade baixa',
          valores: { C: 0.90, Mn: 0.40, Si: 0.25, Ni: 0, Cr: 0, Mo: 0, grao: 7, meio: 'agua', Dbarra: 50, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Composição' },
        { id: 'C', label: 'Carbono', min: 0.1, max: 1.0, step: 0.01, valor: 0.40, unidade: '%',
          desc: 'Define a dureza MÁXIMA; contribui pouco para a temperabilidade.' },
        { id: 'Mn', label: 'Manganês', min: 0, max: 2, step: 0.05, valor: 0.87, unidade: '%' },
        { id: 'Si', label: 'Silício', min: 0, max: 2, step: 0.05, valor: 0.25, unidade: '%' },
        { id: 'Ni', label: 'Níquel', min: 0, max: 4, step: 0.05, valor: 0, unidade: '%' },
        { id: 'Cr', label: 'Cromo', min: 0, max: 3, step: 0.05, valor: 0.95, unidade: '%' },
        { id: 'Mo', label: 'Molibdênio', min: 0, max: 1, step: 0.05, valor: 0.20, unidade: '%' },
        { id: 'grao', label: 'Tamanho de grão ASTM', min: 3, max: 10, step: 1, valor: 7, unidade: '',
          desc: 'Número MAIOR significa grão MENOR — e menos temperabilidade.' },
        { tipo: 'titulo', label: 'Têmpera' },
        { id: 'meio', tipo: 'select', label: 'Meio de resfriamento', valor: 'oleo',
          opcoes: Object.keys(MEIOS).map(function (k) {
            return { v: k, t: MEIOS[k].nome + '  (H = ' + MEIOS[k].H.toFixed(2) + ')' };
          }) },
        { id: 'Dbarra', label: 'Diâmetro da barra', min: 5, max: 200, step: 5, valor: 50, unidade: 'mm' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar o jato', valor: true }
      ],
      graficos: [
        { id: 'corpo', axes: false, height: 340, grid: false, legend: false },
        { id: 'jominy', titulo: 'Curva Jominy — dureza × distância da extremidade temperada',
          xlabel: 'Distância Jominy (mm)', ylabel: 'Dureza (HRC)', aspect: 0.40,
          legendPos: 'topright' },
        { id: 'di', titulo: 'Contribuição de cada elemento para o diâmetro ideal D_I',
          xlabel: '', ylabel: 'Multiplicador', aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'DI', label: 'Diâmetro ideal D_I' },
        { id: 'H', label: 'Severidade H do meio' },
        { id: 'Dcrit', label: 'Diâmetro crítico real' },
        { id: 'Hsup', label: 'Dureza na superfície' },
        { id: 'Hnucleo', label: 'Dureza no núcleo' },
        { id: 'Hmax', label: 'Dureza máxima possível' },
        { id: 'J50', label: 'Distância Jominy de meia queda' },
        { id: 'ok', label: 'Tempera até o núcleo?' }
      ],
      formulas: [
        { g: 'Dureza e temperabilidade são coisas diferentes' },
        { tex: '\\text{Dureza máxima} = f(\\%C) \\ \\text{apenas}',
          d: 'quanto a martensita pode ficar dura — depende SÓ do carbono', destaque: true },
        { tex: '\\text{Temperabilidade} = f(\\text{liga, grão})',
          d: 'até que profundidade se consegue formar martensita — é a liga que decide', destaque: true },
        { tex: '1040 \\ \\text{e} \\ 4140 \\ \\text{temperados: mesma dureza na superfície}',
          d: 'a diferença está no núcleo, e é enorme' },

        { g: 'Ensaio Jominy — ASTM A255' },
        { tex: '\\text{Corpo de prova } \\varnothing 25 \\times 100\\ \\mathrm{mm}',
          d: 'austenitizado e resfriado por um jato de água apenas na extremidade', destaque: true },
        { tex: 'J_{1{,}5} , J_{3} , J_{5} \\ldots \\ \\text{durezas ao longo do comprimento}',
          d: 'cada distância corresponde a uma taxa de resfriamento conhecida' },
        { tex: '\\text{Curva plana} \\Rightarrow \\text{alta temperabilidade}',
          d: 'a queda rápida da dureza indica aço pouco temperável' },

        { g: 'Diâmetro ideal de Grossmann' },
        { tex: 'D_I = D_{I,base}(\\%C, \\text{grão}) \\times \\prod f_i',
          d: 'o diâmetro que teria 50 % de martensita no centro num meio de severidade INFINITA', destaque: true },
        { tex: 'f_{Mn} = 1 + 3{,}33\\,\\%Mn \\qquad f_{Cr} = 1 + 2{,}16\\,\\%Cr \\qquad f_{Mo} = 1 + 3{,}00\\,\\%Mo',
          d: 'multiplicadores de Grossmann — note que o carbono NÃO aparece aqui', destaque: true },
        { tex: 'f_{Ni} = 1 + 0{,}363\\,\\%Ni \\qquad f_{Si} = 1 + 0{,}70\\,\\%Si',
          d: 'níquel e silício contribuem pouco, mas contribuem' },
        { tex: '\\text{Grão MAIOR} \\Rightarrow \\text{MAIS temperável}',
          d: 'menos contorno de grão significa menos sítios para a perlita nuclear', destaque: true },

        { g: 'Severidade de têmpera H' },
        { tex: 'D_{crítico} = D_I \\cdot g(H)',
          d: 'o diâmetro que de fato tempera naquele meio', destaque: true },
        { tex: 'H_{ar} \\approx 0{,}02 \\quad H_{óleo} \\approx 0{,}5 \\quad H_{água} \\approx 1{,}0 \\quad H_{salmoura} \\approx 5',
          d: 'em pol⁻¹; agitar aumenta muito o H' },
        { tex: '\\text{Meio mais severo} \\Rightarrow \\text{mais trinca e distorção}',
          d: 'daí a preferência por óleo sempre que a liga permitir', destaque: true },

        { g: 'Por que se paga por elemento de liga' },
        { tex: '\\text{Liga} \\uparrow \\Rightarrow D_I \\uparrow \\Rightarrow \\text{pode temperar em ÓLEO}',
          d: 'menos trinca, menos distorção, peça maior temperada até o centro' },
        { tex: '\\text{Aço-carbono grosso: casca dura, núcleo mole}',
          d: 'estrutura mista, tensões residuais e propriedades irregulares' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Os multiplicadores de Grossmann e o fator de severidade são correlações empíricas: dão a ordem de grandeza e as tendências corretas, mas para projeto use a curva Jominy medida daquele lote de aço, que é o que a norma exige.',
      calcular: function (p, ctx) {
        var meio = MEIOS[p.meio];
        var DI = calcDI(p);
        var Dcrit = DI * fatorH(meio.H);
        var r = { DI: DI, Dcrit: Dcrit, meio: meio };
        r.J50 = Math.max(1.2, DI / 12);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenhaCorpo();

        var Hmax = TTT.durezaMart(p.C);
        var Hsup = jominy(1.5, p, r);
        /* a dureza no núcleo corresponde a uma distância Jominy equivalente */
        var Jeq = p.Dbarra / 2 * (1.4 / Math.max(meio.H, 0.05)) * 0.5;
        var Hnuc = jominy(Math.min(Jeq, 100), p, r);
        var temperaTudo = Dcrit >= p.Dbarra;

        /* ---------- curva Jominy ---------- */
        var Js = Plot.linspace(0, 60, 100);
        var gj = ctx.plot('jominy').clear();
        gj.line(Js, Js.map(function (J) { return jominy(J, p, r); }),
          { color: Plot.serie(0), width: 2.8, label: 'este aço' });
        /* referências: 1040 e 4340 */
        var ref1 = { C: p.C, Mn: 0.75, Si: 0.25, Ni: 0, Cr: 0, Mo: 0, grao: 7 };
        var ref2 = { C: p.C, Mn: 0.70, Si: 0.25, Ni: 1.80, Cr: 0.80, Mo: 0.25, grao: 7 };
        var r1 = { DI: calcDI(ref1) }; r1.J50 = Math.max(1.2, r1.DI / 12);
        var r2 = { DI: calcDI(ref2) }; r2.J50 = Math.max(1.2, r2.DI / 12);
        gj.line(Js, Js.map(function (J) { return jominy(J, ref1, r1); }),
          { color: Plot.serie(7), width: 1.4, dash: [4, 3], label: 'sem liga (só Mn), mesmo %C' });
        gj.line(Js, Js.map(function (J) { return jominy(J, ref2, r2); }),
          { color: Plot.serie(4), width: 1.4, dash: [2, 3], label: 'tipo 4340, mesmo %C' });
        gj.hline(Hmax, { color: Plot.serie(5), dash: [5, 4], width: 1.4,
          text: 'máximo ' + Plot.sig(Hmax, 3) + ' HRC (100 % martensita)' });
        gj.hline(Hmax * 0.85, { color: Plot.serie(2), dash: [3, 3], width: 1.2,
          text: '~50 % martensita' });
        gj.marker(r.J50, jominy(r.J50, p, r), 'J₅₀ = ' + Plot.sig(r.J50, 3) + ' mm',
          { color: Plot.serie(6) });
        gj.draw();

        /* ---------- multiplicadores ---------- */
        var mult = [
          { n: 'base (%C, grão)', v: 13.7 * Math.sqrt(p.C) * Math.pow(7 / p.grao, 0.5), c: 7 },
          { n: 'Mn', v: 1 + 3.333 * p.Mn, c: 1 },
          { n: 'Si', v: 1 + 0.700 * p.Si, c: 2 },
          { n: 'Ni', v: 1 + 0.363 * p.Ni, c: 3 },
          { n: 'Cr', v: 1 + 2.160 * p.Cr, c: 4 },
          { n: 'Mo', v: 1 + 3.000 * p.Mo, c: 5 }
        ];
        var gm = ctx.plot('di').clear();
        gm.o.xcat = mult.map(function (q, i) { return { v: i, label: q.n }; });
        var alto = Math.max.apply(null, mult.map(function (q) { return q.v; }));
        gm.setLimits([-0.62, mult.length - 0.38], [0, alto * 1.26]);
        mult.forEach(function (q, i) {
          gm.bars([i], [q.v], { color: Plot.serie(q.c), barw: 0.52 });
          gm.text(i, q.v, Plot.sig(q.v, 3) + (i === 0 ? ' mm' : '×'),
            { align: 'center', dy: -7, size: 10.5 });
        });
        gm.draw();

        /* ---------- passo a passo ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        ctx.setPassos([
          { t: 'Diâmetro ideal de base, pelo carbono e pelo grão',
            tex: 'D_{I,base} \\approx 13{,}7\\sqrt{\\%C} \\ \\text{(grão ASTM 7)}',
            texSub: 'D_{I,base} = 13{,}7\\sqrt{' + nt(p.C) + '} \\cdot \\sqrt{7/' + p.grao +
              '} = ' + nt(mult[0].v) + '\\ \\mathrm{mm}',
            obs: 'Repare que o carbono entra pela RAIZ: dobrar o carbono não dobra a temperabilidade. '
              + 'E o grão ' + (p.grao > 7 ? 'mais fino que ASTM 7 REDUZ' : 'mais grosseiro que ASTM 7 AUMENTA')
              + ' a temperabilidade, porque contorno de grão é onde a perlita nucleia.' },
          { t: 'Multiplicadores de Grossmann',
            tex: 'D_I = D_{I,base} \\times f_{Mn} f_{Si} f_{Ni} f_{Cr} f_{Mo}',
            texSub: 'D_I = ' + nt(mult[0].v) + ' \\times ' + nt(mult[1].v) + ' \\times ' +
              nt(mult[2].v) + ' \\times ' + nt(mult[3].v) + ' \\times ' + nt(mult[4].v) +
              ' \\times ' + nt(mult[5].v) + ' = ' + nt(DI) + '\\ \\mathrm{mm}',
            obs: 'Cada elemento multiplica, não soma — por isso pequenas adições combinadas rendem '
              + 'tanto. Molibdênio é o mais eficaz por ponto percentual (3,00 por %), seguido de '
              + 'manganês (3,33 por %, mas usado em teores menores) e cromo (2,16 por %).' },
          { t: 'Efeito do meio de resfriamento',
            tex: 'D_{crítico} = D_I \\cdot g(H)',
            texSub: 'H = ' + nt(meio.H) + ' \\;\\Rightarrow\\; g(H) = ' + nt(fatorH(meio.H)) +
              ' \\;\\Rightarrow\\; D_{crítico} = ' + nt(Dcrit) + '\\ \\mathrm{mm}',
            obs: 'O D_I supõe severidade infinita, que não existe. Em ' + meio.nome.toLowerCase() +
              ' aproveita-se ' + sg(fatorH(meio.H) * 100, 3) + ' % dele. Trocar por água aumentaria '
              + 'para ' + sg(DI * fatorH(1.5), 4) + ' mm — ao custo de muito mais risco de trinca.' },
          { t: 'Verificação da barra',
            tex: 'D_{crítico} \\ \\text{contra} \\ D_{barra}',
            texSub: nt(Dcrit) + ' \\ ' + (temperaTudo ? '\\ge' : '<') + ' \\ ' + p.Dbarra +
              '\\ \\mathrm{mm}',
            obs: temperaTudo
              ? 'A barra tempera até o núcleo: propriedades uniformes em toda a seção.'
              : 'A barra NÃO tempera até o núcleo. Só a casca vira martensita; o miolo fica com '
                + 'perlita ou bainita, mais mole. Isso não é necessariamente ruim — em eixo sujeito '
                + 'a flexão, casca dura e núcleo tenaz é exatamente o que se quer. Vira problema '
                + 'quando o projeto exige resistência uniforme.' },
          { t: 'Dureza esperada',
            tex: 'HRC_{superfície} \\ \\text{e} \\ HRC_{núcleo}',
            texSub: 'HRC_{sup} \\approx ' + nt(Hsup) + ' \\qquad HRC_{núcleo} \\approx ' + nt(Hnuc) +
              ' \\qquad HRC_{máx} = ' + nt(Hmax),
            obs: 'A dureza máxima de ' + sg(Hmax, 3) + ' HRC é fixada pelos ' + p.C +
              ' % de carbono e mais nada. Acrescentar cromo ou molibdênio não a aumenta em nada — '
              + 'apenas faz com que ela seja alcançada mais fundo na peça.' }
        ]);

        return {
          DI: { v: DI, u: 'mm' },
          H: { v: meio.H, u: 'pol⁻¹' },
          Dcrit: { v: Dcrit, u: 'mm', classe: 'destaque' },
          Hsup: { v: Hsup, u: 'HRC' },
          Hnucleo: { v: Hnuc, u: 'HRC' },
          Hmax: { v: Hmax, u: 'HRC' },
          J50: { v: r.J50, u: 'mm' },
          ok: { v: temperaTudo ? 'sim' : 'não', u: '', classe: temperaTudo ? 'ok' : 'alerta' }
        };
      }
    });

    function desenhaCorpo() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('corpo');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharCorpo(c, plot, A.p, A.r, A.fase); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.fase = (A.fase + dt * 0.9) % 1;
      desenhaCorpo();
    });
  })();

  /* ============================================================
     3. Revenimento — parâmetro de Hollomon-Jaffe
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-revenimento')) return;

    function resolver(p) {
      var Hq = TTT.durezaMart(p.C);                    /* dureza temperada */
      var T = p.T + 273.15;
      var Pjh = T * (p.Cte + Math.log(p.t) / Math.LN10) / 1000;   /* em milhares */
      /* queda de dureza calibrada: 200 °C/1 h quase não revém;
         600 °C/1 h derruba para ~30 HRC num aço 0,4 %C */
      var P0 = (200 + 273.15) * p.Cte / 1000;
      var queda = Math.max(0, (Pjh - P0)) * 3.4;
      var HRC = Math.max(12, Hq - queda);
      /* tenacidade sobe, mas há duas faixas de fragilização */
      var Tc = p.T;
      var ten = 12 + 90 * Math.max(0, Math.min(1, (Tc - 150) / 500));
      var fragil = '';
      if (Tc >= 230 && Tc <= 370) {
        ten *= 0.40;
        fragil = 'fragilização da martensita revenida (230 a 370 °C)';
      } else if (Tc >= 400 && Tc <= 560 && (p.Mn + p.Cr) > 0.8 && p.Mo < 0.15) {
        ten *= 0.55;
        fragil = 'fragilização de revenido (400 a 560 °C) — evitável com Mo';
      }
      /* dureza secundária em aços com Mo, V, W */
      var sec = 0;
      if (p.Mo > 0.3 && Tc > 480 && Tc < 620) {
        sec = 6 * Math.min(p.Mo, 1) * Math.exp(-Math.pow((Tc - 550) / 60, 2));
        HRC += sec;
      }
      var sut = 3.2 * (HRC * 10 + 100);
      return { Hq: Hq, HRC: HRC, P: Pjh, ten: ten, fragil: fragil, sec: sec, sut: sut, T: T };
    }

    Sim.build('#sim-revenimento', {
      titulo: 'Revenimento — trocar dureza por tenacidade',
      descricao: 'Martensita recém-temperada é dura e quebradiça demais para uso. O revenimento devolve tenacidade ao custo de dureza — e a troca é governada por um único número que combina temperatura e tempo.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Alívio de tensões (180 °C)', desc: 'Quase não perde dureza; usado em ferramentas',
          valores: { C: 0.45, Mn: 0.80, Cr: 0.95, Mo: 0.20, T: 180, t: 1, Cte: 20 } },
        { nome: '2 · Revenido médio (400 °C)', desc: 'Dentro da faixa de fragilização — evitar',
          valores: { C: 0.45, Mn: 0.80, Cr: 0.95, Mo: 0.20, T: 400, t: 1, Cte: 20 } },
        { nome: '3 · Beneficiamento (600 °C)', desc: 'O tratamento clássico de eixo e engrenagem',
          valores: { C: 0.45, Mn: 0.80, Cr: 0.95, Mo: 0.20, T: 600, t: 2, Cte: 20 } },
        { nome: '4 · Mesma temperatura, 8 horas', desc: 'Tempo entra pelo LOG: 8× o tempo vale pouco',
          valores: { C: 0.45, Mn: 0.80, Cr: 0.95, Mo: 0.20, T: 600, t: 8, Cte: 20 } },
        { nome: '5 · Aço-ferramenta com Mo alto', desc: 'Dureza secundária: a dureza volta a SUBIR por volta de 550 °C',
          valores: { C: 0.85, Mn: 0.30, Cr: 4.0, Mo: 0.90, T: 550, t: 2, Cte: 20 } },
        { nome: '6 · Fragilização de revenido', desc: 'Cr-Mn sem Mo, resfriado devagar de 500 °C',
          valores: { C: 0.40, Mn: 1.5, Cr: 1.0, Mo: 0.0, T: 500, t: 2, Cte: 20 } }
      ],
      controles: [
        { id: 'C', label: 'Carbono', min: 0.15, max: 1.2, step: 0.01, valor: 0.45, unidade: '%' },
        { id: 'Mn', label: 'Manganês', min: 0, max: 2, step: 0.05, valor: 0.80, unidade: '%' },
        { id: 'Cr', label: 'Cromo', min: 0, max: 5, step: 0.05, valor: 0.95, unidade: '%' },
        { id: 'Mo', label: 'Molibdênio', min: 0, max: 1.2, step: 0.05, valor: 0.20, unidade: '%',
          desc: 'Acima de 0,3 % dá dureza secundária e evita a fragilização de revenido.' },
        { tipo: 'separador' },
        { id: 'T', label: 'Temperatura de revenimento', min: 100, max: 700, step: 10, valor: 600,
          unidade: '°C', desc: 'É o parâmetro dominante — muito mais que o tempo.' },
        { id: 't', label: 'Tempo', min: 0.5, max: 24, step: 0.5, valor: 2, unidade: 'h' },
        { id: 'Cte', label: 'Constante C de Hollomon-Jaffe', min: 15, max: 22, step: 0.5, valor: 20,
          unidade: '', desc: '≈ 20 para aços-carbono e baixa liga.' }
      ],
      graficos: [
        { id: 'curva', titulo: 'Dureza e tenacidade em função da temperatura de revenimento',
          xlabel: 'Temperatura de revenimento (°C)', ylabel: 'HRC  |  energia absorvida (J)',
          aspect: 0.42, legendPos: 'topright' },
        { id: 'hj', titulo: 'Combinações de temperatura e tempo que dão a MESMA dureza',
          xlabel: 'Tempo (h)', ylabel: 'Temperatura (°C)', aspect: 0.34, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Hq', label: 'Dureza temperada' },
        { id: 'HRC', label: 'Dureza após revenir' },
        { id: 'perda', label: 'Perda de dureza' },
        { id: 'P', label: 'Parâmetro de Hollomon-Jaffe' },
        { id: 'ten', label: 'Tenacidade estimada' },
        { id: 'sut', label: 'Resistência estimada' },
        { id: 'sec', label: 'Ganho por dureza secundária' },
        { id: 'aviso', label: 'Faixa de fragilização' }
      ],
      formulas: [
        { g: 'Por que revenir é obrigatório' },
        { tex: '\\text{Martensita recém-temperada: dura e FRÁGIL}',
          d: 'rede TCC supersaturada e enorme tensão residual — a peça pode trincar sozinha', destaque: true },
        { tex: '\\text{Revenir} = \\text{precipitar carbonetos finos e aliviar a rede}',
          d: 'troca-se dureza por tenacidade de forma controlada' },
        { tex: '\\text{Têmpera + revenimento} = \\text{BENEFICIAMENTO}',
          d: 'o tratamento padrão de eixos, engrenagens, parafusos e molas' },

        { g: 'Parâmetro de Hollomon-Jaffe' },
        { tex: 'P = T\\,(C + \\log t)',
          d: 'T em KELVIN, t em horas, C ≈ 20 para aços comuns', destaque: true },
        { tex: '\\text{Mesmo } P \\;\\Rightarrow\\; \\text{mesma dureza}',
          d: 'permite trocar tempo por temperatura de forma quantitativa', destaque: true },
        { tex: '\\text{Dobrar o tempo} \\equiv \\text{subir } \\sim 0{,}3\\log 2 \\cdot T',
          d: 'o tempo entra pelo LOGARITMO: 8× o tempo equivale a poucos graus a mais' },

        { g: 'As etapas do revenimento' },
        { tex: '100\\ \\text{a}\\ 250\\ ^\\circ C: \\ \\text{carboneto } \\varepsilon',
          d: 'alívio de tensões; dureza praticamente mantida' },
        { tex: '200\\ \\text{a}\\ 300\\ ^\\circ C: \\ \\text{austenita retida} \\to \\text{bainita}',
          d: 'estabiliza dimensionalmente a peça' },
        { tex: '250\\ \\text{a}\\ 400\\ ^\\circ C: \\ \\varepsilon \\to Fe_3C',
          d: 'a cementita se forma em filmes nos contornos — é a origem da fragilização' },
        { tex: '> 400\\ ^\\circ C: \\ \\text{coalescimento e esferoidização}',
          d: 'a dureza cai e a tenacidade sobe rapidamente' },

        { g: 'As duas fragilizações' },
        { tex: '230\\ \\text{a}\\ 370\\ ^\\circ C: \\ \\text{fragilização da martensita revenida}',
          d: 'faixa a EVITAR — a tenacidade despenca em vez de subir', destaque: true },
        { tex: '400\\ \\text{a}\\ 560\\ ^\\circ C: \\ \\text{fragilização de revenido}',
          d: 'em aços Cr-Mn resfriados devagar; evita-se com 0,2 a 0,3 % de Mo ou resfriando rápido', destaque: true },

        { g: 'Dureza secundária' },
        { tex: 'Mo,\\ V,\\ W,\\ Cr \\ \\text{em teor alto} \\Rightarrow \\text{pico perto de } 550\\ ^\\circ C',
          d: 'carbonetos finos precipitam e a dureza volta a SUBIR', destaque: true },
        { tex: '\\text{É o que permite ao aço rápido cortar a quente}',
          d: 'a ferramenta reventa em serviço em vez de amolecer' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'A queda de dureza é calibrada em aços de baixa liga: 180 °C praticamente não revém, e 600 °C por 2 h leva um 0,45 %C para perto de 30 HRC. Aços-ferramenta de alta liga se comportam de forma bem diferente, com o pico de dureza secundária dominando.',
      calcular: function (p, ctx) {
        var r = resolver(p);
        var nt = Plot.numTex, sg = Plot.sig;

        var Ts = Plot.linspace(100, 700, 120);
        var g = ctx.plot('curva').clear();
        g.line(Ts, Ts.map(function (T) {
          var q = Object.assign({}, p, { T: T });
          return resolver(q).HRC;
        }), { color: Plot.serie(0), width: 2.8, label: 'dureza (HRC)' });
        g.line(Ts, Ts.map(function (T) {
          var q = Object.assign({}, p, { T: T });
          return resolver(q).ten;
        }), { color: Plot.serie(2), width: 2.6, label: 'tenacidade (J)' });
        /* faixas a evitar */
        g.line([230, 230], [0, 120], { color: Plot.serie(5), width: 1.2, dash: [3, 3] });
        g.line([370, 370], [0, 120], { color: Plot.serie(5), width: 1.2, dash: [3, 3] });
        g.text(300, 112, 'fragilização', { align: 'center', size: 10, color: Plot.serie(5) });
        g.vline(p.T, { color: Plot.serie(6), dash: [4, 3], width: 1.6,
          text: 'atual: ' + p.T + ' °C' });
        g.marker(p.T, r.HRC, Plot.sig(r.HRC, 3) + ' HRC', { color: Plot.serie(0) });
        g.draw();

        /* isolinhas de mesmo P */
        var ts = Plot.linspace(0.5, 24, 60);
        var gh = ctx.plot('hj').clear();
        [r.P, r.P * 0.94, r.P * 1.06].forEach(function (Pv, i) {
          gh.line(ts, ts.map(function (t) {
            return Pv * 1000 / (p.Cte + Math.log(t) / Math.LN10) - 273.15;
          }), { color: i === 0 ? Plot.serie(0) : Plot.serie(7),
                width: i === 0 ? 2.8 : 1.3, dash: i === 0 ? [] : [4, 3],
                label: i === 0 ? 'P = ' + Plot.sig(r.P, 4) + ' (dureza atual)' : '' });
        });
        gh.marker(p.t, p.T, p.T + ' °C · ' + p.t + ' h', { color: Plot.serie(6) });
        gh.draw();

        ctx.setPassos([
          { t: 'Dureza de partida — martensita recém-temperada',
            tex: 'HRC_{têmpera} = f(\\%C)',
            texSub: '\\%C = ' + nt(p.C) + ' \\;\\Rightarrow\\; HRC_{têmpera} \\approx ' + nt(r.Hq),
            obs: 'Nesta condição a peça é dura, mas frágil demais para qualquer uso: há tensão '
              + 'residual enorme, e trincas espontâneas dias após a têmpera não são raras. Revenir '
              + 'não é opcional.' },
          { t: 'Parâmetro de Hollomon-Jaffe',
            tex: 'P = T\\,(C + \\log t)',
            texSub: 'P = ' + nt(r.T) + '(' + nt(p.Cte) + ' + \\log ' + nt(p.t) + ') = ' +
              nt(r.P * 1000) + ' = ' + nt(r.P) + ' \\times 10^3',
            obs: 'T em KELVIN (' + p.T + ' °C = ' + sg(r.T, 4) + ' K) e t em horas. Este único '
              + 'número resume o efeito combinado de temperatura e tempo: duas combinações com o '
              + 'mesmo P dão praticamente a mesma dureza.' },
          { t: 'Dureza após revenir',
            tex: 'HRC = HRC_{têmpera} - k(P - P_0)',
            texSub: 'HRC \\approx ' + nt(r.Hq) + ' - ' + nt(r.Hq - r.HRC) + ' = ' + nt(r.HRC),
            obs: 'Perda de ' + sg(r.Hq - r.HRC, 3) + ' HRC. ' + (r.sec > 0.5
              ? 'Note o ganho de ' + sg(r.sec, 3) + ' HRC por DUREZA SECUNDÁRIA: com ' + p.Mo +
                ' % de Mo, carbonetos finos precipitam por volta de 550 °C e a dureza volta a subir.'
              : 'A precipitação e o coalescimento dos carbonetos vão amolecendo a martensita.') },
          { t: 'Troca entre tempo e temperatura',
            tex: '\\text{Mesmo } P \\Rightarrow \\text{mesma dureza}',
            texSub: p.T + '\\ ^\\circ C \\times ' + p.t + '\\ \\mathrm{h} \\ \\equiv \\ ' +
              nt(r.P * 1000 / (p.Cte + Math.log(p.t * 8) / Math.LN10) - 273.15) +
              '\\ ^\\circ C \\times ' + nt(p.t * 8) + '\\ \\mathrm{h}',
            obs: 'Multiplicar o tempo por 8 equivale a baixar apenas cerca de ' +
              sg(p.T - (r.P * 1000 / (p.Cte + Math.log(p.t * 8) / Math.LN10) - 273.15), 3) +
              ' °C. É por isso que na prática se ajusta a TEMPERATURA, não o tempo: o tempo entra '
              + 'pelo logaritmo e rende pouquíssimo.' },
          { t: 'Verificação das faixas de fragilização',
            tex: '230 \\ \\text{a}\\ 370\\ ^\\circ C \\quad\\text{e}\\quad 400 \\ \\text{a}\\ 560\\ ^\\circ C',
            texSub: 'T = ' + p.T + '\\ ^\\circ C',
            obs: r.fragil
              ? 'ATENÇÃO: está na faixa de ' + r.fragil + '. A tenacidade estimada cai para ' +
                sg(r.ten, 3) + ' J, bem abaixo do que se obteria fora dela. Escolha outra '
                + 'temperatura ou, no caso da segunda faixa, acrescente molibdênio.'
              : 'Fora das duas faixas de fragilização. Tenacidade estimada: ' + sg(r.ten, 3) + ' J.' }
        ]);

        return {
          Hq: { v: r.Hq, u: 'HRC' },
          HRC: { v: r.HRC, u: 'HRC', classe: 'destaque' },
          perda: { v: r.Hq - r.HRC, u: 'HRC' },
          P: { v: r.P, u: '×10³' },
          ten: { v: r.ten, u: 'J', classe: r.fragil ? 'alerta' : 'ok' },
          sut: { v: r.sut, u: 'MPa' },
          sec: { v: r.sec, u: 'HRC' },
          aviso: { v: r.fragil || 'fora das faixas', u: '',
                   classe: r.fragil ? 'perigo' : 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     4. Corrosão — par galvânico e proteção catódica
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-corrosao')) return;

    var A = { on: true, fase: 0, rel: relogio(), ctx: null, p: null, r: null };

    /* Série galvânica em água do mar — potencial em V contra Ag/AgCl.
       Mais negativo = mais anódico = corrói primeiro.
       EW = massa equivalente (massa atômica / valência), em g/mol. */
    var METAIS = {
      mg:    { nome: 'Magnésio', E: -1.60, EW: 12.15, rho: 1.74 },
      zn:    { nome: 'Zinco', E: -1.03, EW: 32.70, rho: 7.13 },
      alz:   { nome: 'Liga Al-Zn (anodo)', E: -1.05, EW: 8.99, rho: 2.77 },
      al:    { nome: 'Alumínio', E: -0.79, EW: 8.99, rho: 2.70 },
      aco:   { nome: 'Aço-carbono', E: -0.61, EW: 27.92, rho: 7.87 },
      ffc:   { nome: 'Ferro fundido', E: -0.60, EW: 27.92, rho: 7.20 },
      inox_a: { nome: 'Inox 304 (ativo)', E: -0.53, EW: 25.12, rho: 8.00 },
      pb:    { nome: 'Chumbo', E: -0.31, EW: 103.6, rho: 11.34 },
      lat:   { nome: 'Latão', E: -0.30, EW: 32.00, rho: 8.50 },
      cu:    { nome: 'Cobre', E: -0.26, EW: 31.77, rho: 8.96 },
      brz:   { nome: 'Bronze', E: -0.25, EW: 31.00, rho: 8.80 },
      inox_p: { nome: 'Inox 304 (passivo)', E: -0.05, EW: 25.12, rho: 8.00 },
      ti:    { nome: 'Titânio', E: -0.05, EW: 11.98, rho: 4.51 },
      graf:  { nome: 'Grafite', E: 0.25, EW: 0, rho: 2.20 }
    };

    function resolver(p) {
      var a = METAIS[p.anodo], c = METAIS[p.catodo];
      var dE = c.E - a.E;                       /* V; positivo = a corrói */
      var razao = p.Ac / Math.max(p.Aa, 0.1);   /* área catódica / anódica */
      /* densidade de corrente no anodo: cresce com a diferença de potencial
         e com a razão de áreas; a resistividade do meio limita */
      var i0 = 8;                                /* µA/cm² de referência */
      var i = Math.max(0, dE) * i0 * 12 * razao / (1 + p.rho_e / 30);
      /* Faraday: taxa de penetração em mm/ano */
      var CR = a.EW > 0 ? 3.27e-3 * i * a.EW / a.rho : 0;
      var perda = CR * a.rho / 10;               /* mg/(cm²·ano) aproximado */
      var vida = p.esp > 0 && CR > 1e-9 ? p.esp / CR : Infinity;
      /* proteção catódica por anodo de sacrifício */
      var Ianodo = p.Aa * i * 1e-6;              /* A, corrente que circula */
      var Iprot = p.Aprot * p.iprot * 1e-3;      /* A necessária para proteger */
      var massaAno = METAIS[p.anodoSac];
      var consumo = massaAno.EW > 0
        ? Iprot * massaAno.EW * 31.536e6 / (96485 * 1000) : 0;  /* kg/ano */
      var vidaAno = consumo > 0 ? p.massaAno / consumo : Infinity;
      return { a: a, c: c, dE: dE, razao: razao, i: i, CR: CR, perda: perda, vida: vida,
               Ianodo: Ianodo, Iprot: Iprot, consumo: consumo, vidaAno: vidaAno,
               massaAno: massaAno };
    }

    function desenharCelula(c, pl, p, r, fase) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i;

      /* eletrólito */
      var x0 = a.x + a.w * 0.08, x1 = a.x + a.w * 0.66;
      var yTop = a.y + a.h * 0.28, yBot = a.y + a.h * 0.86;
      c.setLineDash([]);
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.16;
      c.fillRect(x0, yTop, x1 - x0, yBot - yTop);
      c.globalAlpha = 1;
      c.strokeStyle = borda; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0, yTop - 10); c.lineTo(x0, yBot); c.lineTo(x1, yBot); c.lineTo(x1, yTop - 10);
      c.stroke();
      c.fillStyle = Plot.serie(0); c.font = fonte(10, '600');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('eletrólito · ρ = ' + p.rho_e + ' Ω·cm', x0 + 6, yTop + 6);

      /* eletrodos, com largura proporcional à área */
      var totalA = p.Aa + p.Ac;
      var wA = Math.max(14, (x1 - x0) * 0.55 * p.Aa / totalA);
      var wC = Math.max(14, (x1 - x0) * 0.55 * p.Ac / totalA);
      var xa = x0 + (x1 - x0) * 0.26 - wA / 2;
      var xc = x0 + (x1 - x0) * 0.74 - wC / 2;
      var yEle = yTop - 34, hEle = yBot - yTop - 16;

      function eletrodo(x, w, met, tipo) {
        c.fillStyle = tipo === 'a' ? Plot.serie(5) : Plot.serie(2);
        c.globalAlpha = 0.35;
        c.fillRect(x, yEle, w, hEle + 34);
        c.globalAlpha = 1;
        c.strokeStyle = tipo === 'a' ? Plot.serie(5) : Plot.serie(2);
        c.lineWidth = 2.2;
        c.strokeRect(x, yEle, w, hEle + 34);
        c.save();
        c.translate(x + w / 2, yEle + (hEle + 34) / 2);
        if (w < 46) c.rotate(-Math.PI / 2);
        c.fillStyle = cor; c.font = fonte(11, '700');
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(met.nome, 0, -7);
        c.font = fonte(10);
        c.fillStyle = tipo === 'a' ? Plot.serie(5) : Plot.serie(2);
        c.fillText(tipo === 'a' ? 'ÂNODO (corrói)' : 'CÁTODO (protegido)', 0, 8);
        c.restore();
      }
      eletrodo(xa, wA, r.a, 'a');
      eletrodo(xc, wC, r.c, 'c');

      /* corrosão do ânodo: pites crescendo */
      if (r.CR > 1e-6) {
        c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
        var rnd = 1;
        for (i = 0; i < 9; i++) {
          rnd = (rnd * 1103515245 + 12345) & 0x7fffffff;
          var u = (rnd / 0x7fffffff);
          var prof = Math.min(wA * 0.4, 3 + r.CR * 12 * (0.5 + 0.5 * Math.sin(fase * 4 + i)));
          c.beginPath();
          c.arc(xa + wA, yTop + 10 + u * (hEle - 20), prof, 0, TAU);
          c.fill();
        }
      }

      /* fio externo com elétrons */
      var yFio = yEle - 26;
      c.strokeStyle = cor; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(xa + wA / 2, yEle); c.lineTo(xa + wA / 2, yFio);
      c.lineTo(xc + wC / 2, yFio); c.lineTo(xc + wC / 2, yEle);
      c.stroke();
      /* elétrons correndo do ânodo para o cátodo */
      c.fillStyle = Plot.serie(4);
      for (i = 0; i < 7; i++) {
        var ph = ((fase * 1.6 + i / 7) % 1);
        var X = xa + wA / 2 + (xc - xa + (wC - wA) / 2) * ph;
        c.beginPath(); c.arc(X, yFio, 3.4, 0, TAU); c.fill();
      }
      c.fillStyle = Plot.serie(4); c.font = fonte(10, '700');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('e⁻  →  corrente de ' + Plot.sig(r.Ianodo * 1000, 3) + ' mA',
                 (xa + xc + wC) / 2, yFio - 7);

      /* íons metálicos saindo do ânodo */
      c.fillStyle = Plot.serie(5);
      for (i = 0; i < 8; i++) {
        var ph2 = ((fase * 1.1 + i / 8) % 1);
        var Xi = xa + wA + ph2 * 40;
        var Yi = yTop + 20 + (i / 8) * (hEle - 40) + Math.sin(fase * 5 + i) * 5;
        c.globalAlpha = 0.85 * (1 - ph2 * 0.6);
        c.beginPath(); c.arc(Xi, Yi, 3.2, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      c.fillStyle = Plot.serie(5); c.font = fonte(9.5, '600');
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('M → Mⁿ⁺ + n e⁻', xa + wA + 6, yBot - 22);
      c.fillStyle = Plot.serie(2);
      c.textAlign = 'right';
      c.fillText('O₂ + 2H₂O + 4e⁻ → 4OH⁻', xc - 6, yBot - 22);

      /* painel de resultados */
      var lx = a.x + a.w * 0.72, ly = a.y + a.h * 0.30;
      c.fillStyle = cor; c.font = fonte(12, '700');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('ΔE = ' + Plot.sig(r.dE, 3) + ' V', lx, ly);
      c.font = fonte(10.5); c.fillStyle = faint;
      [['razão de áreas: ' + Plot.sig(r.razao, 3) + '×', 22],
       ['densidade: ' + Plot.sig(r.i, 3) + ' µA/cm²', 38],
       ['taxa: ' + Plot.sig(r.CR, 3) + ' mm/ano', 54],
       ['vida da parede: ' + (isFinite(r.vida) ? Plot.sig(r.vida, 3) + ' anos' : '—'), 70]
      ].forEach(function (q) { c.fillText(q[0], lx, ly + q[1]); });
      c.font = fonte(10.5, '700');
      c.fillStyle = r.razao > 5 ? Plot.serie(5) : Plot.serie(2);
      c.fillText(r.razao > 5 ? 'ÂNODO PEQUENO: ataque concentrado'
                 : 'razão de áreas favorável', lx, ly + 92);

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Par galvânico — quem corrói e com que velocidade', a.x + 4, a.y + 2);
      c.font = fonte(10.5); c.fillStyle = faint;
      c.fillText('o metal mais NEGATIVO na série é o ânodo e se sacrifica pelo outro',
                 a.x + 4, a.y + 19);
    }

    Sim.build('#sim-corrosao', {
      titulo: 'Corrosão galvânica e proteção catódica',
      descricao: 'Dois metais diferentes em contato dentro de um eletrólito formam uma pilha. O mais negativo corrói — e a velocidade depende tanto da diferença de potencial quanto, sobretudo, da razão entre as áreas.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Aço com parafuso de latão', desc: 'Ânodo grande: corrosão distribuída e lenta',
          valores: { anodo: 'aco', catodo: 'lat', Aa: 500, Ac: 10, rho_e: 25, esp: 6, anodoSac: 'zn', Aprot: 20, iprot: 20, massaAno: 20, animar: true } },
        { nome: '2 · Chapa de latão com parafuso de aço', desc: 'ÂNODO PEQUENO: o parafuso some em pouco tempo',
          valores: { anodo: 'aco', catodo: 'lat', Aa: 10, Ac: 500, rho_e: 25, esp: 6, anodoSac: 'zn', Aprot: 20, iprot: 20, massaAno: 20, animar: true } },
        { nome: '3 · Alumínio com cobre', desc: 'Diferença de potencial grande: par a evitar sempre',
          valores: { anodo: 'al', catodo: 'cu', Aa: 100, Ac: 100, rho_e: 25, esp: 4, anodoSac: 'zn', Aprot: 20, iprot: 20, massaAno: 20, animar: true } },
        { nome: '4 · Aço galvanizado', desc: 'O zinco é o ânodo e protege o aço mesmo com o revestimento riscado',
          valores: { anodo: 'zn', catodo: 'aco', Aa: 20, Ac: 500, rho_e: 25, esp: 0.08, anodoSac: 'zn', Aprot: 20, iprot: 20, massaAno: 20, animar: true } },
        { nome: '5 · Aço em água doce', desc: 'Resistividade alta freia a corrente e a corrosão',
          valores: { anodo: 'aco', catodo: 'cu', Aa: 100, Ac: 100, rho_e: 2000, esp: 6, anodoSac: 'zn', Aprot: 20, iprot: 20, massaAno: 20, animar: true } },
        { nome: '6 · Casco protegido por anodo de zinco', desc: 'Dimensionamento do anodo de sacrifício',
          valores: { anodo: 'zn', catodo: 'aco', Aa: 50, Ac: 5000, rho_e: 25, esp: 8, anodoSac: 'zn', Aprot: 500, iprot: 20, massaAno: 50, animar: true } }
      ],
      controles: [
        { id: 'anodo', tipo: 'select', label: 'Metal 1', valor: 'aco',
          opcoes: Object.keys(METAIS).map(function (k) {
            return { v: k, t: METAIS[k].nome + '  (' + METAIS[k].E.toFixed(2) + ' V)' };
          }) },
        { id: 'catodo', tipo: 'select', label: 'Metal 2', valor: 'lat',
          opcoes: Object.keys(METAIS).map(function (k) {
            return { v: k, t: METAIS[k].nome + '  (' + METAIS[k].E.toFixed(2) + ' V)' };
          }) },
        { id: 'Aa', label: 'Área do metal 1', min: 1, max: 2000, step: 1, valor: 500, unidade: 'cm²' },
        { id: 'Ac', label: 'Área do metal 2', min: 1, max: 5000, step: 1, valor: 10, unidade: 'cm²' },
        { id: 'rho_e', label: 'Resistividade do eletrólito', min: 10, max: 5000, step: 10,
          valor: 25, unidade: 'Ω·cm', desc: 'Água do mar ≈ 25 · água doce ≈ 2000 · solo 1000 a 10000.' },
        { id: 'esp', label: 'Espessura da parede', min: 0.05, max: 25, step: 0.05, valor: 6,
          unidade: 'mm' },
        { tipo: 'titulo', label: 'Proteção catódica por ânodo de sacrifício' },
        { id: 'anodoSac', tipo: 'select', label: 'Material do ânodo', valor: 'zn',
          opcoes: [{ v: 'zn', t: 'Zinco' }, { v: 'alz', t: 'Liga Al-Zn-In' }, { v: 'mg', t: 'Magnésio' }] },
        { id: 'Aprot', label: 'Área a proteger', min: 10, max: 20000, step: 10, valor: 500, unidade: 'm²' },
        { id: 'iprot', label: 'Densidade de corrente de proteção', min: 5, max: 150, step: 5,
          valor: 20, unidade: 'mA/m²', desc: 'Aço nu em água do mar: 60 a 100. Com revestimento bom: 5 a 20.' },
        { id: 'massaAno', label: 'Massa total de ânodos', min: 5, max: 5000, step: 5, valor: 50,
          unidade: 'kg' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar a pilha', valor: true }
      ],
      graficos: [
        { id: 'celula', axes: false, height: 340, grid: false, legend: false },
        { id: 'serie', titulo: 'Série galvânica em água do mar (V contra Ag/AgCl)',
          xlabel: '', ylabel: 'Potencial (V)', aspect: 0.34, legend: false },
        { id: 'razao', titulo: 'Efeito da razão de áreas na taxa de corrosão do ânodo',
          xlabel: 'Área do cátodo / área do ânodo', ylabel: 'Taxa de corrosão (mm/ano)',
          aspect: 0.32, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'quem', label: 'Quem corrói' },
        { id: 'dE', label: 'Diferença de potencial' },
        { id: 'razao', label: 'Razão de áreas C/A' },
        { id: 'i', label: 'Densidade de corrente' },
        { id: 'CR', label: 'Taxa de penetração' },
        { id: 'vida', label: 'Vida até perfurar' },
        { id: 'Iprot', label: 'Corrente de proteção' },
        { id: 'vidaAno', label: 'Vida dos ânodos' }
      ],
      formulas: [
        { g: 'As duas semirreações' },
        { tex: '\\text{ÂNODO (oxidação): } M \\to M^{n+} + n\\,e^-',
          d: 'é aqui que o metal se dissolve — o ânodo é quem corrói', destaque: true },
        { tex: '\\text{CÁTODO (redução): } O_2 + 2H_2O + 4e^- \\to 4OH^-',
          d: 'em meio neutro aerado; em meio ácido é 2H⁺ + 2e⁻ → H₂', destaque: true },
        { tex: '\\text{Ânodo, cátodo, eletrólito e contato elétrico}',
          d: 'os quatro elementos da pilha — falta um, não há corrosão' },

        { g: 'Quem corrói' },
        { tex: 'E_{\\text{mais negativo}} \\Rightarrow \\text{ÂNODO}',
          d: 'a série galvânica em água do mar é o que vale na prática, não a série de potenciais padrão', destaque: true },
        { tex: '\\Delta E = E_{cátodo} - E_{ânodo}',
          d: 'força motriz: quanto maior, mais rápida a corrosão' },
        { tex: '\\text{Inox: dois potenciais!}',
          d: 'passivo (−0,05 V, nobre) e ativo (−0,53 V) — se a película romper, ele vira ânodo', destaque: true },

        { g: 'O efeito de área — o mais importante' },
        { tex: 'i_{ânodo} \\propto \\frac{A_{cátodo}}{A_{ânodo}}',
          d: 'toda a corrente gerada na área catódica se concentra na área anódica', destaque: true },
        { tex: '\\text{Ânodo PEQUENO + cátodo GRANDE} = \\text{desastre}',
          d: 'parafuso de aço em chapa de latão fura em meses; o contrário dura décadas', destaque: true },
        { tex: '\\text{Regra: nunca use fixador menos nobre que a peça}',
          d: 'o fixador é sempre a peça de menor área' },

        { g: 'Taxa de corrosão — lei de Faraday' },
        { tex: 'CR \\ [\\mathrm{mm/ano}] = \\frac{3{,}27 \\times 10^{-3} \\cdot i \\cdot EW}{\\rho}',
          d: 'i em µA/cm² · EW = massa equivalente · ρ em g/cm³', destaque: true },
        { tex: 'EW = \\frac{\\text{massa atômica}}{\\text{valência}}',
          d: 'ferro divalente: 55,85/2 = 27,9 g/mol' },
        { tex: 'm = \\frac{I\\,t\\,EW}{F}, \\quad F = 96\\,485\\ \\mathrm{C/mol}',
          d: 'forma original da lei de Faraday, para a massa consumida' },

        { g: 'Proteção catódica' },
        { tex: '\\text{Ânodo de sacrifício: Zn, Al-Zn-In ou Mg}',
          d: 'liga-se um metal mais anódico, que se consome no lugar da estrutura', destaque: true },
        { tex: 'I_{prot} = i_{prot} \\cdot A_{estrutura}',
          d: 'aço nu em água do mar exige 60 a 100 mA/m²; bem revestido, 5 a 20' },
        { tex: 'm_{anodo} = \\frac{I\\,t}{\\text{capacidade}}',
          d: 'zinco rende cerca de 780 A·h/kg; alumínio, 2600; magnésio, 1230', destaque: true },
        { tex: '\\text{Corrente impressa: retificador + anodo inerte}',
          d: 'alternativa para estruturas grandes, com corrente ajustável' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'A densidade de corrente galvânica é estimada por um modelo simplificado que reproduz as tendências corretas — efeito do ΔE, da razão de áreas e da resistividade. Para projeto real, a corrente sai de ensaio ou de norma (NACE SP0169, DNV-RP-B401).',
      calcular: function (p, ctx) {
        var r = resolver(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenhaCelula();

        var quem = r.dE > 0 ? r.a.nome : (r.dE < 0 ? r.c.nome : 'nenhum (mesmo potencial)');

        /* série galvânica */
        var ks = Object.keys(METAIS).sort(function (x, y) { return METAIS[x].E - METAIS[y].E; });
        var gs = ctx.plot('serie').clear();
        gs.o.xcat = ks.map(function (k, i) { return { v: i, label: METAIS[k].nome }; });
        gs.setLimits([-0.62, ks.length - 0.38], [-1.8, 0.45]);
        ks.forEach(function (k, i) {
          var sel = (k === p.anodo || k === p.catodo);
          gs.bars([i], [METAIS[k].E], { color: sel ? Plot.serie(6) : Plot.serie(1), barw: 0.5 });
          if (sel) {
            gs.text(i, METAIS[k].E, METAIS[k].E.toFixed(2) + ' V',
              { align: 'center', dy: METAIS[k].E >= 0 ? -7 : 15, size: 10.5 });
          }
        });
        gs.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        gs.draw();

        /* efeito da razão de áreas */
        var rs = Plot.linspace(0.05, 60, 90);
        var gr = ctx.plot('razao').clear();
        gr.line(rs, rs.map(function (x) {
          var q = Object.assign({}, p, { Aa: 100, Ac: 100 * x });
          return resolver(q).CR;
        }), { color: Plot.serie(0), width: 2.8, label: 'este par galvânico' });
        gr.vline(1, { color: Plot.serie(2), dash: [4, 3], width: 1.3, text: 'áreas iguais' });
        gr.vline(r.razao, { color: Plot.serie(6), dash: [], width: 1.8,
          text: 'atual: ' + Plot.sig(r.razao, 3) + '×' });
        gr.marker(r.razao, r.CR, Plot.sig(r.CR, 3) + ' mm/ano', { color: Plot.serie(6) });
        gr.draw();

        var nt = Plot.numTex, sg = Plot.sig;
        var CAP = { zn: 780, alz: 2600, mg: 1230 };
        var cap = CAP[p.anodoSac] || 780;
        var vidaA = r.Iprot > 0 ? p.massaAno * cap / (r.Iprot * 8760) : Infinity;

        ctx.setPassos([
          { t: 'Quem é o ânodo',
            tex: 'E_{\\text{mais negativo}} \\Rightarrow \\text{ânodo}',
            texSub: 'E_{' + r.a.nome + '} = ' + nt(r.a.E) + '\\ V \\qquad E_{' + r.c.nome +
              '} = ' + nt(r.c.E) + '\\ V \\;\\Rightarrow\\; \\Delta E = ' + nt(r.dE) + '\\ V',
            obs: r.dE > 0
              ? quem + ' é o ânodo e corrói; o outro fica protegido. Diferenças acima de 0,25 V já '
                + 'são consideradas perigosas em ambiente marinho.'
              : (r.dE < 0
                ? 'Os papéis se invertem: quem corrói é o ' + quem + '.'
                : 'Mesmo potencial: não há pilha galvânica.') },
          { t: 'Razão de áreas — o fator que mais pesa',
            tex: 'i_{ânodo} \\propto \\frac{A_{cátodo}}{A_{ânodo}}',
            texSub: '\\frac{A_c}{A_a} = \\frac{' + nt(p.Ac) + '}{' + nt(p.Aa) + '} = ' +
              nt(r.razao) + ' \\;\\Rightarrow\\; i = ' + nt(r.i) + '\\ \\mu A/cm^2',
            obs: r.razao > 5
              ? 'RAZÃO DESFAVORÁVEL. Toda a corrente que a grande área catódica consegue gerar '
                + 'precisa sair por uma área anódica pequena — e a densidade de corrente ali dispara. '
                + 'É por isso que um parafuso de aço em chapa de latão fura em meses, enquanto o '
                + 'contrário dura décadas.'
              : 'Razão favorável: a corrosão se distribui por uma área anódica ampla e a penetração '
                + 'por ano fica baixa.' },
          { t: 'Taxa de penetração pela lei de Faraday',
            tex: 'CR = \\frac{3{,}27 \\times 10^{-3}\\,i\\,EW}{\\rho}',
            texSub: 'CR = \\frac{3{,}27\\times 10^{-3} \\cdot ' + nt(r.i) + ' \\cdot ' +
              nt(r.a.EW) + '}{' + nt(r.a.rho) + '} = ' + nt(r.CR) + '\\ \\mathrm{mm/ano}',
            obs: 'EW = massa atômica / valência (' + sg(r.a.EW, 4) + ' g/mol para o ' +
              r.a.nome.toLowerCase() + '). Com parede de ' + p.esp + ' mm, a perfuração viria em '
              + (isFinite(r.vida) ? sg(r.vida, 3) + ' anos.' : 'tempo indefinido.') },
          { t: 'Efeito da resistividade do meio',
            tex: 'i \\propto \\frac{1}{1 + \\rho_e/30}',
            texSub: '\\rho_e = ' + nt(p.rho_e) + '\\ \\Omega\\cdot cm',
            obs: p.rho_e < 100
              ? 'Meio muito condutor (água do mar): a corrente circula com facilidade e a corrosão '
                + 'galvânica atinge longas distâncias ao longo da estrutura.'
              : 'Meio pouco condutor: a corrente é limitada pela resistência do eletrólito, e o '
                + 'ataque fica restrito à vizinhança imediata da junta. É por isso que o mesmo par '
                + 'que destrói uma peça no mar quase não incomoda em ambiente seco.' },
          { t: 'Dimensionamento da proteção catódica',
            tex: 'I_{prot} = i_{prot} \\cdot A \\qquad t = \\frac{m \\cdot \\text{capacidade}}{I_{prot}}',
            texSub: 'I_{prot} = ' + nt(p.iprot) + ' \\cdot ' + nt(p.Aprot) + ' = ' +
              nt(r.Iprot * 1000) + '\\ \\mathrm{mA} \\;\\Rightarrow\\; t = \\frac{' +
              nt(p.massaAno) + ' \\cdot ' + cap + '}{' + nt(r.Iprot) + ' \\cdot 8760} = ' +
              nt(vidaA) + '\\ \\mathrm{anos}',
            obs: 'Capacidade do ' + r.massaAno.nome.toLowerCase() + ': ' + cap + ' A·h/kg. '
              + 'O alumínio rende mais que o triplo do zinco por quilo, mas exige ativação por '
              + 'índio para não passivar; o magnésio tem potencial muito negativo e serve melhor '
              + 'em solo, onde a resistividade é alta.' }
        ]);

        return {
          quem: { v: quem, u: '', classe: 'destaque' },
          dE: { v: r.dE, u: 'V' },
          razao: { v: r.razao, u: '×', classe: r.razao > 5 ? 'alerta' : '' },
          i: { v: r.i, u: 'µA/cm²' },
          CR: { v: r.CR, u: 'mm/ano', classe: r.CR > 0.5 ? 'alerta' : 'ok' },
          vida: { v: isFinite(r.vida) ? r.vida : NaN, u: 'anos' },
          Iprot: { v: r.Iprot * 1000, u: 'mA' },
          vidaAno: { v: isFinite(vidaA) ? vidaA : NaN, u: 'anos' }
        };
      }
    });

    function desenhaCelula() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('celula');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharCelula(c, plot, A.p, A.r, A.fase); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.fase = (A.fase + dt * 0.7) % 1;
      desenhaCelula();
    });
  })();

})();

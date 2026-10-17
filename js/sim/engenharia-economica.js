/* ============================================================
   Simuladores de Engenharia Econômica
   1 · Juros simples e compostos
   2 · Séries de pagamentos
   3 · Sistemas de amortização
   4 · VPL, TIR e os critérios de decisão
   5 · Comparação de alternativas
   ============================================================ */
(function (global) {
  'use strict';
  var Sim = global.Sim;
  if (!Sim) return;

  var EE = {};

  /* ---------------------------------------------------------------
     Matemática financeira — os fatores clássicos
     --------------------------------------------------------------- */
  /* F/P: capitalização de um pagamento único */
  EE.fp = function (i, n) { return Math.pow(1 + i, n); };
  /* P/F: desconto de um pagamento único */
  EE.pf = function (i, n) { return Math.pow(1 + i, -n); };
  /* P/A: valor presente de série uniforme postecipada */
  EE.pa = function (i, n) { return i === 0 ? n : (1 - Math.pow(1 + i, -n)) / i; };
  /* A/P: prestação que amortiza um principal */
  EE.ap = function (i, n) { return 1 / EE.pa(i, n); };
  /* F/A: montante de série uniforme postecipada */
  EE.fa = function (i, n) { return i === 0 ? n : (Math.pow(1 + i, n) - 1) / i; };
  /* A/F: depósito uniforme que forma um montante */
  EE.af = function (i, n) { return 1 / EE.fa(i, n); };
  /* P/G: valor presente de um gradiente aritmético unitário */
  EE.pg = function (i, n) {
    if (i === 0) return n * (n - 1) / 2;
    return (EE.pa(i, n) - n * Math.pow(1 + i, -n)) / i;
  };
  /* valor presente de série em progressão geométrica (razão g) */
  EE.pGeo = function (A1, g, i, n) {
    if (Math.abs(i - g) < 1e-12) return A1 * n / (1 + i);
    return A1 * (1 - Math.pow((1 + g) / (1 + i), n)) / (i - g);
  };

  /* taxas */
  EE.efetiva = function (nominal, m) { return Math.pow(1 + nominal / m, m) - 1; };
  EE.continua = function (nominal) { return Math.exp(nominal) - 1; };
  EE.equivalente = function (i, de, para) { return Math.pow(1 + i, para / de) - 1; };
  EE.real = function (nominal, inflacao) { return (1 + nominal) / (1 + inflacao) - 1; };

  /* ---------------------------------------------------------------
     Avaliação de fluxos de caixa
     --------------------------------------------------------------- */
  EE.vpl = function (fc, i) {
    var s = 0, k;
    for (k = 0; k < fc.length; k++) s += fc[k] / Math.pow(1 + i, k);
    return s;
  };
  /* TIR por bisseção; devolve null quando não há raiz única no intervalo */
  EE.tir = function (fc) {
    var lo = -0.9999, hi = 10, k, m;
    if (EE.vpl(fc, lo) * EE.vpl(fc, hi) > 0) return null;
    var cresce = EE.vpl(fc, lo) > EE.vpl(fc, hi);
    for (k = 0; k < 200; k++) {
      m = (lo + hi) / 2;
      if ((EE.vpl(fc, m) > 0) === cresce) lo = m; else hi = m;
    }
    return m;
  };
  /* número de inversões de sinal: mais de uma avisa sobre TIR múltipla */
  EE.inversoes = function (fc) {
    var n = 0, ant = 0, k;
    for (k = 0; k < fc.length; k++) {
      if (fc[k] === 0) continue;
      var s = fc[k] > 0 ? 1 : -1;
      if (ant && s !== ant) n++;
      ant = s;
    }
    return n;
  };
  /* payback simples e descontado, interpolados dentro do período */
  EE.payback = function (fc, i) {
    var ac = 0, k, ant;
    for (k = 0; k < fc.length; k++) {
      ant = ac;
      ac += fc[k] / Math.pow(1 + i, k);
      if (ant < 0 && ac >= 0) return k - 1 + (-ant) / (ac - ant);
    }
    return null;
  };
  /* custo anual equivalente (ou anuidade equivalente) */
  EE.cae = function (fc, i) { return EE.vpl(fc, i) / EE.pa(i, fc.length - 1); };
  /* índice de lucratividade: valor presente das entradas sobre o investimento */
  EE.il = function (fc, i) {
    var ent = 0, sai = 0, k;
    for (k = 0; k < fc.length; k++) {
      var v = fc[k] / Math.pow(1 + i, k);
      if (v >= 0) ent += v; else sai -= v;
    }
    return sai > 0 ? ent / sai : null;
  };

  /* ---------------------------------------------------------------
     Sistemas de amortização
     --------------------------------------------------------------- */
  EE.tabela = function (P, i, n, sistema) {
    var linhas = [], saldo = P, k, am, ju, pr;
    var pmt = P * EE.ap(i, n);
    for (k = 1; k <= n; k++) {
      ju = saldo * i;
      if (sistema === 'sac') { am = P / n; pr = am + ju; }
      else if (sistema === 'americano') { am = (k === n) ? P : 0; pr = am + ju; }
      else { pr = pmt; am = pr - ju; }            /* price */
      linhas.push({ k: k, juros: ju, amort: am, presta: pr, saldo: Math.max(0, saldo - am) });
      saldo -= am;
    }
    return linhas;
  };

  global.EE = EE;

  var Plot = global.Plot;
  function sg(v, n) { return global.Plot ? global.Plot.sig(v, n || 3) : v; }
  function nt(v, n) { return sg(v, n).toString().replace('.', ','); }
  function din(v) {
    return (Math.round(v * 100) / 100).toLocaleString('pt-BR',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function pct(v, d) {
    return (Math.round(v * Math.pow(10, d == null ? 2 : d)) / Math.pow(10, d == null ? 2 : d))
      .toLocaleString('pt-BR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }) + ' %';
  }
  function cor(k) { return Plot.serie(k); }

  /* =========================================================================
     1 · Juros simples e compostos
     ========================================================================= */
  function montarJuros() {
    if (!document.getElementById('sim-juros')) return;
    Sim.build('#sim-juros', {
      titulo: '1. Juros simples e compostos — o dinheiro no tempo',
      descricao: 'A diferença entre os dois regimes não está na fórmula, está no que acontece com os juros de cada período. No regime simples eles ficam de fora; no composto, entram na base do período seguinte — e a partir daí a distância só cresce.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Um ano, os dois iguais', desc: 'Em um único período não há diferença',
          valores: { P: 1000, i: 10, n: 1, un: 12 } },
        { nome: '2 · Dez meses a 10 % a.m.', desc: 'A diferença já é de 30 %',
          valores: { P: 1000, i: 10, n: 10, un: 12 } },
        { nome: '3 · A longo prazo', desc: 'Trinta períodos: o composto dispara',
          valores: { P: 1000, i: 10, n: 30, un: 12 } },
        { nome: '4 · Taxa baixa, prazo longo', desc: '0,5 % a.m. por 20 anos',
          valores: { P: 10000, i: 0.5, n: 240, un: 12 } },
        { nome: '5 · Poupança de aposentadoria', desc: '0,8 % a.m. por 30 anos',
          valores: { P: 50000, i: 0.8, n: 360, un: 12 } },
        { nome: '6 · Aplicação de curto prazo', desc: 'Seis meses a 2 % a.m.',
          valores: { P: 25000, i: 2, n: 6, un: 12 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'A aplicação' },
        { id: 'P', label: 'Capital aplicado (principal)', min: 100, max: 500000, step: 100, valor: 1000, unidade: '$' },
        { id: 'i', label: 'Taxa de juros por período', min: 0.1, max: 20, step: 0.1, valor: 10, unidade: '%' },
        { id: 'n', label: 'Número de períodos', min: 1, max: 360, step: 1, valor: 10 },
        { id: 'un', tipo: 'select', label: 'Períodos por ano (para a taxa anual)', valor: 12,
          opcoes: [{ v: 1, t: 'anual' }, { v: 2, t: 'semestral' }, { v: 4, t: 'trimestral' },
                   { v: 12, t: 'mensal' }, { v: 360, t: 'diário (ano comercial)' }] }
      ],
      graficos: [
        { id: 'cresc', titulo: 'Montante acumulado', xlabel: 'Período', ylabel: '$', aspect: 0.5, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'ss', label: 'Montante a juros simples' },
        { id: 'sc', label: 'Montante a juros compostos' },
        { id: 'js', label: 'Juros do regime simples' },
        { id: 'jc', label: 'Juros do regime composto' },
        { id: 'dif', label: 'Vantagem do composto' },
        { id: 'ano', label: 'Taxa efetiva anual' }
      ],
      formulas: [
        { g: 'Juros simples' },
        { tex: 'J = P\\,i\\,n \\qquad S = P(1 + i\\,n)', d: 'os juros não entram na base: crescimento linear', destaque: true },
        { g: 'Juros compostos' },
        { tex: 'S = P(1+i)^n', d: 'os juros de cada período entram na base do seguinte', destaque: true },
        { tex: 'P = S(1+i)^{-n}', d: 'o desconto é a operação inversa da capitalização' },
        { g: 'Taxas' },
        { tex: 'i_{ef} = \\left(1 + \\frac{i_{nom}}{m}\\right)^m - 1', d: 'nominal com m capitalizações → efetiva' },
        { tex: 'i_{eq} = (1+i)^{p/d} - 1', d: 'equivalência entre taxas de períodos diferentes' }
      ],
      nota: 'Praticamente todo o sistema financeiro opera a juros compostos. O regime simples sobrevive em operações de prazo muito curto, em multas e em alguns descontos comerciais — e é usado aqui sobretudo como contraste.',
      calcular: function (p, ctx) {
        var i = p.i / 100, n = Math.round(p.n), un = +p.un;
        var Ss = p.P * (1 + i * n);
        var Sc = p.P * Math.pow(1 + i, n);
        var ia = Math.pow(1 + i, un) - 1;

        var g = ctx.plot('cresc').clear();
        var xs = [], ys = [], yc = [], k;
        var passo = Math.max(1, Math.round(n / 120));
        for (k = 0; k <= n; k += passo) {
          xs.push(k); ys.push(p.P * (1 + i * k)); yc.push(p.P * Math.pow(1 + i, k));
        }
        if (xs[xs.length - 1] !== n) { xs.push(n); ys.push(Ss); yc.push(Sc); }
        g.line(xs, ys, { color: cor(2), width: 2, dash: [6, 4], label: 'simples (reta)' });
        g.line(xs, yc, { color: cor(0), width: 2.6, label: 'composto (exponencial)' });
        g.hline(p.P, { color: cor(5), width: 1, dash: [3, 3], text: 'principal' });
        g.marker(n, Sc, '$ ' + din(Sc), { color: cor(0) });
        g.draw();

        ctx.setPassos([
          { t: '① O regime simples',
            tex: 'S = P(1 + i\\,n) = ' + nt(p.P, 6) + '\\,(1 + ' + nt(i, 4) + ' \\times ' + n + ') = ' + nt(Ss, 6),
            obs: 'Os juros de cada período são sempre calculados sobre o mesmo principal. O capital cresce em linha reta, '
              + 'e o juro de cada período é constante: $ ' + din(p.P * i) + '.' },
          { t: '② O regime composto',
            tex: 'S = P(1+i)^n = ' + nt(p.P, 6) + '\\,(1 + ' + nt(i, 4) + ')^{' + n + '} = ' + nt(Sc, 6),
            obs: 'Aqui os juros do período entram na base do período seguinte. O juro do primeiro período é o mesmo, '
              + '$ ' + din(p.P * i) + '; o do último já é $ ' + din(Sc - p.P * Math.pow(1 + i, n - 1)) + '.' },
          { t: '③ Onde está a diferença',
            texSub: '\\Delta = ' + nt(Sc - Ss, 6) + ' \\qquad \\frac{S_{comp}}{S_{simp}} = ' + nt(Sc / Ss, 4),
            obs: n === 1
              ? 'Com um único período os dois regimes coincidem exatamente — é o único caso em que isso acontece. '
                + 'Para n < 1 o simples rende mais; para n > 1, o composto.'
              : 'Em ' + n + ' períodos o composto rende $ ' + din(Sc - Ss) + ' a mais, '
                + nt(100 * (Sc / Ss - 1), 3) + ' % acima do simples. A diferença não é linear: ela cresce com o prazo.' },
          { t: '④ A taxa efetiva anual',
            tex: 'i_{ano} = (1 + i)^{' + un + '} - 1 = ' + nt(100 * ia, 4) + '\\,\\%',
            obs: 'Uma taxa de ' + nt(p.i, 4) + ' % por período, capitalizada ' + un + ' vezes ao ano, equivale a '
              + nt(100 * ia, 4) + ' % ao ano. Note que isso é bem mais que ' + nt(p.i * un, 4)
              + ' %: multiplicar a taxa pelo número de períodos é a conta do regime simples, e não vale aqui.' }
        ]);
        return {
          ss: { v: '$ ' + din(Ss) },
          sc: { v: '$ ' + din(Sc), classe: 'ok' },
          js: { v: '$ ' + din(Ss - p.P) },
          jc: { v: '$ ' + din(Sc - p.P) },
          dif: { v: '$ ' + din(Sc - Ss), classe: Sc - Ss > 0 ? 'ok' : '' },
          ano: { v: pct(100 * ia, 2) }
        };
      }
    });
  }

  /* =========================================================================
     2 · Séries de pagamentos
     ========================================================================= */
  function montarSeries() {
    if (!document.getElementById('sim-series')) return;
    Sim.build('#sim-series', {
      titulo: '2. Séries de pagamentos — uniformes, gradientes e perpetuidades',
      descricao: 'Quase nenhum fluxo real é um pagamento único: são prestações, aluguéis, receitas que crescem. Este simulador monta o diagrama de caixa, aplica o fator certo e mostra o valor presente, o montante e a prestação equivalente.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Financiamento clássico', desc: '12 prestações, taxa mensal',
          valores: { tipo: 'uniforme', A: 1000, n: 12, i: 2, g: 0, car: 0, modo: 'post' } },
        { nome: '2 · A mesma série antecipada', desc: 'A primeira parcela no ato: vale mais',
          valores: { tipo: 'uniforme', A: 1000, n: 12, i: 2, g: 0, car: 0, modo: 'ante' } },
        { nome: '3 · Compre hoje, pague depois', desc: 'Três meses de carência',
          valores: { tipo: 'uniforme', A: 1000, n: 12, i: 2, g: 0, car: 3, modo: 'post' } },
        { nome: '4 · Gradiente aritmético', desc: 'Receita que sobe $ 200 por ano',
          valores: { tipo: 'gradiente', A: 1000, n: 5, i: 10, g: 200, car: 0, modo: 'post' } },
        { nome: '5 · Gradiente geométrico', desc: 'Receita que sobe 8 % ao ano',
          valores: { tipo: 'geometrico', A: 1000, n: 10, i: 12, g: 8, car: 0, modo: 'post' } },
        { nome: '6 · Perpetuidade', desc: 'Renda que não acaba nunca',
          valores: { tipo: 'perpetua', A: 20, n: 60, i: 2, g: 0, car: 0, modo: 'post' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'O tipo de série' },
        { id: 'tipo', tipo: 'select', label: 'Série', valor: 'uniforme',
          opcoes: [{ v: 'uniforme', t: 'Uniforme — parcelas iguais' },
                   { v: 'gradiente', t: 'Gradiente aritmético — cresce $ G por período' },
                   { v: 'geometrico', t: 'Gradiente geométrico — cresce g % por período' },
                   { v: 'perpetua', t: 'Perpetuidade — sem fim' }] },
        { id: 'modo', tipo: 'select', label: 'Momento do pagamento', valor: 'post',
          opcoes: [{ v: 'post', t: 'Postecipada — no fim de cada período' },
                   { v: 'ante', t: 'Antecipada — no início de cada período' }] },
        { tipo: 'titulo', label: 'Os valores' },
        { id: 'A', label: 'Parcela (a primeira, nos gradientes)', min: 10, max: 50000, step: 10, valor: 1000, unidade: '$' },
        { id: 'n', label: 'Número de parcelas', min: 1, max: 360, step: 1, valor: 12 },
        { id: 'i', label: 'Taxa por período', min: 0.1, max: 25, step: 0.1, valor: 2, unidade: '%' },
        { id: 'g', label: 'Crescimento ($ no aritmético, % no geométrico)', min: -2000, max: 2000, step: 10, valor: 0 },
        { id: 'car', label: 'Carência antes da primeira parcela', min: 0, max: 24, step: 1, valor: 0, unidade: 'períodos' }
      ],
      graficos: [
        { id: 'fluxo', titulo: 'Diagrama de fluxo de caixa', xlabel: 'Período', ylabel: '$', aspect: 0.44, legend: false },
        { id: 'acum', titulo: 'Valor presente acumulado parcela a parcela', xlabel: 'Período', ylabel: '$', aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'vp', label: 'Valor presente (P)' },
        { id: 'vf', label: 'Montante final (F)' },
        { id: 'aeq', label: 'Parcela uniforme equivalente' },
        { id: 'soma', label: 'Soma nominal das parcelas' },
        { id: 'juros', label: 'Juros embutidos' },
        { id: 'fator', label: 'Fator aplicado' }
      ],
      formulas: [
        { g: 'Série uniforme' },
        { tex: 'P = A\\,\\frac{1-(1+i)^{-n}}{i} = A\\,(P/A,i,n)', d: 'valor presente de n parcelas iguais', destaque: true },
        { tex: 'F = A\\,\\frac{(1+i)^n-1}{i} = A\\,(F/A,i,n)', d: 'montante acumulado ao fim' },
        { tex: 'P_{ante} = P_{post}\\,(1+i)', d: 'antecipada: tudo um período mais perto do presente' },
        { tex: 'P_{dif} = P_{post}\\,(1+i)^{-c}', d: 'diferida: desconta-se a carência de c períodos' },
        { g: 'Gradientes' },
        { tex: 'P = A\\,(P/A,i,n) + G\\,\\frac{(P/A,i,n) - n(1+i)^{-n}}{i}', d: 'aritmético: base uniforme mais o gradiente' },
        { tex: 'P = A_1\\,\\frac{1-\\left(\\frac{1+g}{1+i}\\right)^n}{i-g}', d: 'geométrico, para i ≠ g' },
        { g: 'Perpetuidade' },
        { tex: 'P = \\frac{A}{i}', d: 'o valor presente converge, mesmo com infinitas parcelas', destaque: true }
      ],
      nota: 'Todos os fatores supõem que a taxa se refere ao mesmo período das parcelas. Se as parcelas são mensais, a taxa tem de ser mensal — converter antes, pela fórmula de equivalência, é o erro mais comum nesta matéria.',
      calcular: function (p, ctx) {
        var i = p.i / 100, n = Math.round(p.n), c = Math.round(p.car);
        var ante = p.modo === 'ante';
        var parcelas = [], k, vp = 0, fator = '', nome = '';

        if (p.tipo === 'perpetua') {
          n = Math.min(n, 120);
          for (k = 1; k <= n; k++) parcelas.push(p.A);
          vp = p.A / i;
          fator = '1/i = ' + nt(1 / i, 4);
          nome = 'perpetuidade';
        } else {
          for (k = 1; k <= n; k++) {
            if (p.tipo === 'gradiente') parcelas.push(p.A + p.g * (k - 1));
            else if (p.tipo === 'geometrico') parcelas.push(p.A * Math.pow(1 + p.g / 100, k - 1));
            else parcelas.push(p.A);
          }
          if (p.tipo === 'uniforme') { vp = p.A * EE.pa(i, n); fator = '(P/A) = ' + nt(EE.pa(i, n), 5); nome = 'uniforme'; }
          else if (p.tipo === 'gradiente') { vp = p.A * EE.pa(i, n) + p.g * EE.pg(i, n); fator = '(P/A) + G·(P/G)'; nome = 'gradiente aritmético'; }
          else { vp = EE.pGeo(p.A, p.g / 100, i, n); fator = 'série geométrica'; nome = 'gradiente geométrico'; }
          if (ante) vp *= (1 + i);
          if (c > 0) vp *= Math.pow(1 + i, -c);
        }
        var vf = p.tipo === 'perpetua' ? null : vp * Math.pow(1 + i, n + c);
        var aeq = p.tipo === 'perpetua' ? p.A : vp * EE.ap(i, n + c);
        var somaNom = parcelas.reduce(function (s, x) { return s + x; }, 0);

        var g = ctx.plot('fluxo').clear();
        var desl = c + (ante ? 0 : 1);
        parcelas.forEach(function (v, k2) {
          g.bars([k2 + desl], [v], { color: cor(0), barw: 0.6 });
        });
        g.bars([0], [-vp], { color: cor(3), barw: 0.6 });
        g.text(0, -vp, 'P = ' + din(vp), { color: cor(3), size: 10.5, dy: 14, align: 'left' });
        g.hline(0, { color: cor(5), width: 1.4 });
        g.setLimits([-0.8, parcelas.length + desl], null);
        g.draw();

        var ga = ctx.plot('acum').clear();
        var xs = [0], ys = [0], ac = 0;
        parcelas.forEach(function (v, k2) {
          ac += v / Math.pow(1 + i, k2 + desl);
          xs.push(k2 + desl); ys.push(ac);
        });
        ga.line(xs, ys, { color: cor(0), width: 2.2 });
        if (p.tipo === 'perpetua') {
          ga.hline(p.A / i, { color: cor(3), width: 1.6, dash: [5, 4], text: 'limite A/i = ' + din(p.A / i) });
        }
        ga.draw();

        ctx.setPassos([
          { t: '① A série',
            obs: 'Série ' + nome + (ante ? ' antecipada' : ' postecipada') + (c ? ', com ' + c + ' período(s) de carência' : '')
              + '. A primeira parcela cai no período ' + desl + ' e a última no ' + (parcelas.length + desl - 1) + '. '
              + (p.tipo === 'gradiente' ? 'Ela começa em $ ' + din(parcelas[0]) + ' e termina em $ ' + din(parcelas[parcelas.length - 1]) + '.'
                : p.tipo === 'geometrico' ? 'Ela cresce ' + nt(p.g, 3) + ' % por período, de $ ' + din(parcelas[0]) + ' a $ ' + din(parcelas[parcelas.length - 1]) + '.'
                  : 'Todas as parcelas valem $ ' + din(p.A) + '.') },
          { t: '② O fator',
            tex: p.tipo === 'uniforme'
              ? 'P = A\\,\\frac{1-(1+i)^{-n}}{i} = ' + nt(p.A, 6) + ' \\times ' + nt(EE.pa(i, n), 5)
              : p.tipo === 'perpetua' ? 'P = \\frac{A}{i} = \\frac{' + nt(p.A, 5) + '}{' + nt(i, 4) + '}'
                : 'P = \\sum_{k=1}^{n} \\frac{A_k}{(1+i)^{k}}',
            obs: p.tipo === 'perpetua'
              ? 'Pode parecer estranho que infinitas parcelas somem um valor finito, mas as parcelas distantes valem '
                + 'quase nada hoje: a de número 100 vale $ ' + din(p.A / Math.pow(1 + i, 100)) + '. A série converge.'
              : 'O fator ' + fator + ' resume toda a soma das parcelas descontadas. É o que as tabelas financeiras tabelavam '
                + 'antes da calculadora — daí a notação (P/A, i, n).' },
          { t: '③ Antecipada, postecipada, diferida',
            texSub: ante ? 'P_{ante} = P_{post}(1+i) = \\;+\\,' + nt(100 * i, 3) + '\\,\\%'
              : c > 0 ? 'P_{dif} = P_{post}(1+i)^{-' + c + '}' : 'P = P_{post}',
            obs: ante
              ? 'Na série antecipada cada parcela está um período mais perto do presente, e por isso o valor presente é '
                + nt(100 * i, 3) + ' % maior. É o caso do aluguel e do financiamento com entrada.'
              : c > 0
                ? 'A carência de ' + c + ' período(s) empurra toda a série para a frente, e o valor presente cai '
                  + nt(100 * (1 - Math.pow(1 + i, -c)), 3) + ' %. É o "compre hoje e comece a pagar depois" — que não é de graça: '
                  + 'os juros correm durante a carência.'
                : 'Postecipada, sem carência: o caso-padrão das fórmulas, com a primeira parcela ao fim do primeiro período.' },
          { t: '④ Quanto disso é juro',
            texSub: 'P = ' + nt(vp, 6) + ' \\qquad \\sum A_k = ' + nt(somaNom, 6),
            obs: p.tipo === 'perpetua'
              ? 'Numa perpetuidade a soma nominal é infinita, mas o valor presente é $ ' + din(vp) + '. '
                + 'É exatamente o capital que, aplicado a ' + nt(p.i, 3) + ' % por período, gera a renda sem nunca ser consumido.'
              : 'Pagando $ ' + din(somaNom) + ' ao longo do tempo, liquida-se uma dívida de hoje de $ ' + din(vp) + '. '
                + 'A diferença, $ ' + din(somaNom - vp) + ', são os juros — ' + nt(100 * (somaNom / vp - 1), 3)
                + ' % sobre o valor presente.' }
        ]);
        return {
          vp: { v: '$ ' + din(vp), classe: 'ok' },
          vf: { v: vf === null ? '∞' : '$ ' + din(vf) },
          aeq: { v: '$ ' + din(aeq) },
          soma: { v: p.tipo === 'perpetua' ? '∞' : '$ ' + din(somaNom) },
          juros: { v: p.tipo === 'perpetua' ? '—' : '$ ' + din(somaNom - vp) },
          fator: { v: fator }
        };
      }
    });
  }

  /* =========================================================================
     3 · Sistemas de amortização
     ========================================================================= */
  function montarAmortizacao() {
    if (!document.getElementById('sim-amortizacao')) return;
    Sim.build('#sim-amortizacao', {
      titulo: '3. Sistemas de amortização — SAC, Price e americano',
      descricao: 'O mesmo empréstimo, a mesma taxa e o mesmo prazo pagos de três maneiras. O total de juros muda, e muda por um motivo simples: quanto mais devagar a dívida é amortizada, mais tempo o saldo devedor fica rendendo juros para quem emprestou.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Empréstimo de 5 anos', desc: 'O caso de comparação dos três sistemas',
          valores: { P: 100000, i: 10, n: 5, sistema: 'price' } },
        { nome: '2 · O mesmo em SAC', desc: 'Prestação decrescente, menos juros',
          valores: { P: 100000, i: 10, n: 5, sistema: 'sac' } },
        { nome: '3 · O mesmo em americano', desc: 'Só juros, principal no fim',
          valores: { P: 100000, i: 10, n: 5, sistema: 'americano' } },
        { nome: '4 · Financiamento de veículo', desc: '48 meses a 1,5 % a.m.',
          valores: { P: 60000, i: 1.5, n: 48, sistema: 'price' } },
        { nome: '5 · Financiamento imobiliário', desc: '240 meses em SAC',
          valores: { P: 300000, i: 0.8, n: 240, sistema: 'sac' } },
        { nome: '6 · Capital de giro', desc: '12 meses a 3 % a.m.',
          valores: { P: 50000, i: 3, n: 12, sistema: 'price' } }
      ],
      controles: [
        { tipo: 'titulo', label: 'O empréstimo' },
        { id: 'P', label: 'Valor financiado', min: 1000, max: 1000000, step: 1000, valor: 100000, unidade: '$' },
        { id: 'i', label: 'Taxa por período', min: 0.1, max: 15, step: 0.1, valor: 10, unidade: '%' },
        { id: 'n', label: 'Número de parcelas', min: 2, max: 360, step: 1, valor: 5 },
        { id: 'sistema', tipo: 'select', label: 'Sistema em destaque', valor: 'price',
          opcoes: [{ v: 'price', t: 'Price (francês) — prestação constante' },
                   { v: 'sac', t: 'SAC — amortização constante' },
                   { v: 'americano', t: 'Americano — só juros, principal no fim' }] }
      ],
      graficos: [
        { id: 'presta', titulo: 'Prestação de cada período', xlabel: 'Período', ylabel: '$', aspect: 0.42, legendPos: 'topright' },
        { id: 'comp', titulo: 'Composição da prestação no sistema escolhido', xlabel: 'Período', ylabel: '$', aspect: 0.38, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'pr1', label: 'Primeira prestação' },
        { id: 'prn', label: 'Última prestação' },
        { id: 'tot', label: 'Total pago' },
        { id: 'jur', label: 'Total de juros' },
        { id: 'rel', label: 'Juros sobre o principal' },
        { id: 'comp2', label: 'Juros contra o Price' }
      ],
      formulas: [
        { g: 'Price (francês)' },
        { tex: 'A = P\\,\\frac{i(1+i)^n}{(1+i)^n-1} = P\\,(A/P,i,n)', d: 'prestação constante', destaque: true },
        { tex: 'J_k = SD_{k-1}\\,i \\qquad Am_k = A - J_k', d: 'a amortização cresce e os juros caem' },
        { g: 'SAC' },
        { tex: 'Am_k = \\frac{P}{n} \\qquad A_k = \\frac{P}{n} + SD_{k-1}\\,i', d: 'amortização constante, prestação decrescente', destaque: true },
        { g: 'Americano' },
        { tex: 'A_k = P\\,i \\;(k<n) \\qquad A_n = P\\,i + P', d: 'só juros até o fim, quando se paga tudo' },
        { g: 'Em todos' },
        { tex: '\\sum_k Am_k = P', d: 'a soma das amortizações é sempre o principal' }
      ],
      nota: 'Os três sistemas são equivalentes do ponto de vista financeiro: descontados à própria taxa do contrato, os três fluxos têm valor presente igual ao valor financiado. O total nominal pago difere porque o prazo médio do saldo devedor difere — não porque um seja "mais caro" em taxa.',
      calcular: function (p, ctx) {
        var i = p.i / 100, n = Math.round(p.n);
        var sis = ['price', 'sac', 'americano'];
        var tabs = {};
        sis.forEach(function (s) { tabs[s] = EE.tabela(p.P, i, n, s); });
        var T = tabs[p.sistema];
        var tot = T.reduce(function (s, l) { return s + l.presta; }, 0);
        var jur = tot - p.P;
        var totPrice = tabs.price.reduce(function (s, l) { return s + l.presta; }, 0);

        var g = ctx.plot('presta').clear();
        var xs = T.map(function (l) { return l.k; });
        var rot = { price: 'Price', sac: 'SAC', americano: 'Americano' };
        sis.forEach(function (s, k) {
          g.line(xs, tabs[s].map(function (l) { return l.presta; }),
            { color: cor(k), width: s === p.sistema ? 2.8 : 1.4,
              dash: s === p.sistema ? null : [5, 4], label: rot[s] });
        });
        g.draw();

        var gc = ctx.plot('comp').clear();
        gc.area(xs, T.map(function (l) { return l.juros; }), { color: cor(3), alpha: 0.5, label: 'juros' });
        gc.area(xs, T.map(function (l) { return l.presta; }), { color: cor(0), alpha: 0.25, label: 'prestação' });
        gc.line(xs, T.map(function (l) { return l.juros; }), { color: cor(3), width: 2 });
        gc.line(xs, T.map(function (l) { return l.presta; }), { color: cor(0), width: 2.2 });
        gc.draw();

        /* verificação: o valor presente do fluxo tem de devolver o principal */
        var fc = [0].concat(T.map(function (l) { return l.presta; }));
        var conf = EE.vpl(fc, i);

        ctx.setPassos([
          { t: '① A prestação do Price',
            tex: 'A = P\\,(A/P,i,n) = ' + nt(p.P, 7) + ' \\times ' + nt(EE.ap(i, n), 6) + ' = ' + nt(p.P * EE.ap(i, n), 7),
            obs: 'No Price a prestação é constante, e o que muda é a composição: no primeiro período quase tudo é juro, '
              + 'no último quase tudo é amortização. É o sistema de financiamento de veículo e de crédito pessoal.' },
          { t: '② A prestação do SAC',
            tex: 'Am = \\frac{P}{n} = ' + nt(p.P / n, 7) + ' \\qquad A_1 = Am + P\\,i = ' + nt(tabs.sac[0].presta, 7),
            obs: 'No SAC a amortização é fixa e a prestação cai de $ ' + din(tabs.sac[0].presta) + ' para $ '
              + din(tabs.sac[n - 1].presta) + '. A primeira prestação é mais pesada que a do Price — por isso o SAC exige '
              + 'mais renda na aprovação —, mas a dívida cai mais rápido.' },
          { t: '③ Por que os totais diferem',
            texSub: 'Price: ' + nt(totPrice, 7) + ' \\quad SAC: '
              + nt(tabs.sac.reduce(function (s, l) { return s + l.presta; }, 0), 7) + ' \\quad Americano: '
              + nt(tabs.americano.reduce(function (s, l) { return s + l.presta; }, 0), 7),
            obs: 'Não é a taxa que muda, é o tempo que o dinheiro fica emprestado. No americano o saldo devedor permanece '
              + 'integral até o fim e os juros são máximos; no SAC ele cai linearmente e os juros são mínimos; o Price fica no meio.' },
          { t: '④ A verificação que fecha',
            texSub: '\\sum_{k=1}^{n} \\frac{A_k}{(1+i)^k} = ' + nt(conf, 7),
            obs: 'Descontado à taxa do contrato, o fluxo de prestações vale exatamente o principal de $ ' + din(p.P)
              + '. Os três sistemas passam nesse teste — o que prova que são financeiramente equivalentes, por mais diferentes '
              + 'que pareçam os totais nominais.' }
        ]);
        return {
          pr1: { v: '$ ' + din(T[0].presta) },
          prn: { v: '$ ' + din(T[n - 1].presta) },
          tot: { v: '$ ' + din(tot) },
          jur: { v: '$ ' + din(jur), classe: 'alerta' },
          rel: { v: pct(100 * jur / p.P, 1) },
          comp2: { v: (tot > totPrice ? '+' : '') + '$ ' + din(tot - totPrice),
                   classe: tot > totPrice ? 'alerta' : tot < totPrice ? 'ok' : '' }
        };
      }
    });
  }

  /* =========================================================================
     4 · VPL, TIR e os critérios de decisão
     ========================================================================= */
  function montarVpl() {
    if (!document.getElementById('sim-vpl')) return;
    Sim.build('#sim-vpl', {
      titulo: '4. VPL, TIR e os critérios de decisão',
      descricao: 'O perfil do VPL contra a taxa de desconto resume quase tudo: onde ele corta o eixo está a TIR, à esquerda está a faixa de taxas que torna o projeto viável, e a inclinação mostra o quanto a decisão é sensível ao custo do capital.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · O caso clássico', desc: '200 mil hoje, 75 mil por 5 anos',
          valores: { I: 200000, FC: 75000, n: 5, k: 15, res: 0 } },
        { nome: '2 · Projeto de longo prazo', desc: '30 mil hoje, 5 mil por 12 anos',
          valores: { I: 30000, FC: 5000, n: 12, k: 8, res: 0 } },
        { nome: '3 · Com valor residual', desc: 'O equipamento vale algo no fim',
          valores: { I: 200000, FC: 60000, n: 5, k: 15, res: 50000 } },
        { nome: '4 · No limite da viabilidade', desc: 'A taxa quase iguala a TIR',
          valores: { I: 200000, FC: 75000, n: 5, k: 25, res: 0 } },
        { nome: '5 · Custo do capital alto', desc: 'A mesma proposta, agora inviável',
          valores: { I: 200000, FC: 75000, n: 5, k: 30, res: 0 } },
        { nome: '6 · Retorno rápido', desc: 'Paga-se em menos de dois anos',
          valores: { I: 100000, FC: 60000, n: 5, k: 15, res: 0 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'O projeto' },
        { id: 'I', label: 'Investimento inicial', min: 1000, max: 2000000, step: 1000, valor: 200000, unidade: '$' },
        { id: 'FC', label: 'Fluxo de caixa anual', min: 100, max: 500000, step: 100, valor: 75000, unidade: '$/ano' },
        { id: 'n', label: 'Vida do projeto', min: 1, max: 30, step: 1, valor: 5, unidade: 'anos' },
        { id: 'res', label: 'Valor residual no último ano', min: 0, max: 500000, step: 1000, valor: 0, unidade: '$' },
        { tipo: 'titulo', label: 'O custo do capital' },
        { id: 'k', label: 'Taxa mínima de atratividade (TMA)', min: 0.5, max: 60, step: 0.5, valor: 15, unidade: '% a.a.' }
      ],
      graficos: [
        { id: 'perfil', titulo: 'Perfil do VPL contra a taxa de desconto', xlabel: 'Taxa de desconto (% a.a.)',
          ylabel: 'VPL ($)', aspect: 0.48, legendPos: 'topright' },
        { id: 'acum', titulo: 'Saldo acumulado descontado — o payback', xlabel: 'Ano', ylabel: '$', aspect: 0.36, legend: false }
      ],
      saidas: [
        { id: 'vpl', label: 'VPL à TMA' },
        { id: 'tir', label: 'TIR' },
        { id: 'pb', label: 'Payback simples' },
        { id: 'pbd', label: 'Payback descontado' },
        { id: 'il', label: 'Índice de lucratividade' },
        { id: 'cae', label: 'Anuidade equivalente' }
      ],
      formulas: [
        { g: 'Valor presente líquido' },
        { tex: 'VPL = \\sum_{k=0}^{n} \\frac{FC_k}{(1+k_a)^k}', d: 'aceite se VPL > 0', destaque: true },
        { g: 'Taxa interna de retorno' },
        { tex: '\\sum_{k=0}^{n} \\frac{FC_k}{(1+i^*)^k} = 0', d: 'a taxa que zera o VPL; aceite se i* > TMA', destaque: true },
        { g: 'Os demais critérios' },
        { tex: 'IL = \\frac{VP\\text{(entradas)}}{VP\\text{(saídas)}}', d: 'aceite se IL > 1 — equivale ao VPL > 0' },
        { tex: 'AE = \\frac{VPL}{(P/A,k_a,n)}', d: 'o VPL distribuído em parcelas anuais iguais' },
        { tex: 'payback_{desc}: \\sum_{k=0}^{m} \\frac{FC_k}{(1+k_a)^k} = 0', d: 'quando o saldo descontado cruza o zero' }
      ],
      nota: 'O VPL e a TIR concordam sempre que o fluxo é convencional — uma única inversão de sinal — e o projeto é analisado isoladamente. Em projetos com várias inversões a TIR pode ter mais de uma raiz, e em comparação entre alternativas ela pode apontar a opção errada: nesses casos o VPL decide.',
      calcular: function (p, ctx) {
        var k = p.k / 100, n = Math.round(p.n);
        var fc = [-p.I], j;
        for (j = 1; j <= n; j++) fc.push(p.FC + (j === n ? p.res : 0));
        var VPL = EE.vpl(fc, k);
        var TIR = EE.tir(fc);
        var pb = EE.payback(fc, 0), pbd = EE.payback(fc, k);
        var IL = EE.il(fc, k), AE = EE.cae(fc, k);

        var g = ctx.plot('perfil').clear();
        var xs = [], ys = [], t;
        var tmax = Math.max(p.k * 2, TIR === null ? 50 : 100 * TIR * 1.6, 20);
        for (j = 0; j <= 160; j++) {
          t = tmax * j / 160;
          xs.push(t); ys.push(EE.vpl(fc, t / 100));
        }
        g.line(xs, ys, { color: cor(0), width: 2.6, label: 'VPL(taxa)' });
        g.hline(0, { color: cor(5), width: 1.4 });
        g.vline(p.k, { color: cor(3), width: 1.8, dash: [5, 4], text: 'TMA ' + nt(p.k, 3) + ' %' });
        if (TIR !== null && 100 * TIR <= tmax) {
          g.marker(100 * TIR, 0, 'TIR ' + nt(100 * TIR, 4) + ' %', { color: cor(1) });
        }
        g.marker(p.k, VPL, '$ ' + din(VPL), { color: cor(3) });
        g.draw();

        var ga = ctx.plot('acum').clear();
        var xa = [], ya = [], yn = [], ac = 0, acn = 0;
        for (j = 0; j < fc.length; j++) {
          ac += fc[j] / Math.pow(1 + k, j); acn += fc[j];
          xa.push(j); ya.push(ac); yn.push(acn);
        }
        ga.line(xa, yn, { color: cor(2), width: 1.5, dash: [5, 4], label: 'sem descontar' });
        ga.line(xa, ya, { color: cor(0), width: 2.4, label: 'descontado' });
        ga.hline(0, { color: cor(5), width: 1.2 });
        if (pbd !== null) ga.vline(pbd, { color: cor(1), width: 1.6, dash: [4, 3] });
        ga.draw();

        var inv = EE.inversoes(fc);
        ctx.setPassos([
          { t: '① Descontar cada parcela',
            tex: 'VPL = -' + nt(p.I, 7) + ' + \\sum_{k=1}^{' + n + '} \\frac{' + nt(p.FC, 6) + '}{(1+' + nt(k, 4) + ')^k}'
              + (p.res ? ' + \\frac{' + nt(p.res, 6) + '}{(1+' + nt(k, 4) + ')^{' + n + '}}' : ''),
            texSub: 'VPL = ' + nt(VPL, 7),
            obs: VPL > 0
              ? 'VPL positivo: o projeto recupera o investimento, remunera o capital à TMA de ' + nt(p.k, 3)
                + ' % e ainda sobra $ ' + din(VPL) + ' em valor de hoje. Aceitar.'
              : 'VPL negativo: o projeto não consegue remunerar o capital à TMA de ' + nt(p.k, 3)
                + ' %. Faltam $ ' + din(-VPL) + ' em valor de hoje. Rejeitar.' },
          { t: '② A taxa que zera o VPL',
            tex: TIR === null ? '\\text{sem raiz real no intervalo}' : 'i^* = ' + nt(100 * TIR, 5) + '\\,\\%',
            obs: TIR === null
              ? 'Não há TIR neste fluxo: ou ele não inverte de sinal, ou inverte de um jeito que não produz raiz única.'
              : 'A TIR é o rendimento intrínseco do projeto, independente da TMA. Como ' + nt(100 * TIR, 4) + ' % '
                + (TIR > k ? 'supera' : 'não alcança') + ' a TMA de ' + nt(p.k, 3) + ' %, a TIR '
                + (TIR > k ? 'aprova' : 'reprova') + ' o projeto — e concorda com o VPL, como tem de acontecer num fluxo '
                + 'com uma só inversão de sinal.' },
          { t: '③ Em quanto tempo se recupera',
            texSub: 'payback_{simples} = ' + (pb === null ? '-' : nt(pb, 3)) + '\\ \\text{anos} \\qquad payback_{desc} = '
              + (pbd === null ? '\\text{não recupera}' : nt(pbd, 3) + '\\ \\text{anos}'),
            obs: pbd === null
              ? 'Descontado à TMA, o saldo nunca chega a zero dentro da vida do projeto.'
              : 'O payback simples ignora o custo do capital e por isso é sempre otimista: ' + nt(pb, 3) + ' contra '
                + nt(pbd, 3) + ' anos. Nenhum dos dois mede rentabilidade — os dois ignoram tudo que acontece depois da '
                + 'recuperação. Servem como critério de risco e de liquidez, nunca como critério único.' },
          { t: '④ O que os outros critérios acrescentam',
            texSub: 'IL = ' + (IL === null ? '-' : nt(IL, 4)) + ' \\qquad AE = ' + nt(AE, 6) + '\\ \\text{/ano}',
            obs: 'O índice de lucratividade é o VPL em forma de razão: IL > 1 equivale a VPL > 0, e ele ajuda a ordenar '
              + 'projetos quando o capital é racionado. A anuidade equivalente distribui o VPL em ' + n
              + ' parcelas anuais de $ ' + din(AE) + ' — é a forma certa de comparar projetos de durações diferentes.'
              + (inv > 1 ? ' Atenção: este fluxo tem ' + inv + ' inversões de sinal, e a TIR pode ter mais de uma raiz.' : '') }
        ]);
        return {
          vpl: { v: '$ ' + din(VPL), classe: VPL > 0 ? 'ok' : 'alerta' },
          tir: { v: TIR === null ? '—' : pct(100 * TIR, 2), classe: TIR !== null && TIR > k ? 'ok' : 'alerta' },
          pb: { v: pb === null ? '—' : sg(pb, 3), u: pb === null ? '' : 'anos' },
          pbd: { v: pbd === null ? 'não recupera' : sg(pbd, 3), u: pbd === null ? '' : 'anos',
                 classe: pbd === null ? 'alerta' : '' },
          il: { v: IL === null ? '—' : sg(IL, 4), classe: IL !== null && IL > 1 ? 'ok' : 'alerta' },
          cae: { v: '$ ' + din(AE) }
        };
      }
    });
  }

  /* =========================================================================
     5 · Comparação de alternativas
     ========================================================================= */
  function montarAlternativas() {
    if (!document.getElementById('sim-alternativas')) return;
    Sim.build('#sim-alternativas', {
      titulo: '5. Comparação de alternativas — vidas diferentes e TIR incremental',
      descricao: 'Comparar duas propostas com durações diferentes pelo VPL direto é um erro clássico. O simulador mostra as três saídas corretas: repetir até o mínimo múltiplo comum, usar o custo anual equivalente, e analisar o investimento incremental.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Vidas diferentes', desc: 'Três anos contra seis: o caso clássico',
          valores: { IA: 50000, CA: 12000, nA: 3, IB: 80000, CB: 7000, nB: 6, k: 12 } },
        { nome: '2 · Mesma vida', desc: 'Sem o problema do horizonte',
          valores: { IA: 50000, CA: 12000, nA: 6, IB: 80000, CB: 7000, nB: 6, k: 12 } },
        { nome: '3 · Custo do capital alto', desc: 'A 25 % o barato passa a ganhar',
          valores: { IA: 50000, CA: 12000, nA: 3, IB: 80000, CB: 7000, nB: 6, k: 25 } },
        { nome: '4 · Custo do capital baixo', desc: 'A 5 % compensa investir mais',
          valores: { IA: 50000, CA: 12000, nA: 3, IB: 80000, CB: 7000, nB: 6, k: 5 } },
        { nome: '5 · Máquina contra terceirizar', desc: 'Investir ou pagar por serviço',
          valores: { IA: 0, CA: 45000, nA: 5, IB: 150000, CB: 8000, nB: 5, k: 15 } },
        { nome: '6 · Reforma contra troca', desc: 'Equipamento recuperado ou novo',
          valores: { IA: 40000, CA: 25000, nA: 4, IB: 120000, CB: 9000, nB: 8, k: 10 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Alternativa A' },
        { id: 'IA', label: 'Investimento inicial de A', min: 0, max: 500000, step: 1000, valor: 50000, unidade: '$' },
        { id: 'CA', label: 'Custo anual de A', min: 0, max: 200000, step: 500, valor: 12000, unidade: '$/ano' },
        { id: 'nA', label: 'Vida de A', min: 1, max: 20, step: 1, valor: 3, unidade: 'anos' },
        { tipo: 'titulo', label: 'Alternativa B' },
        { id: 'IB', label: 'Investimento inicial de B', min: 0, max: 500000, step: 1000, valor: 80000, unidade: '$' },
        { id: 'CB', label: 'Custo anual de B', min: 0, max: 200000, step: 500, valor: 7000, unidade: '$/ano' },
        { id: 'nB', label: 'Vida de B', min: 1, max: 20, step: 1, valor: 6, unidade: 'anos' },
        { tipo: 'titulo', label: 'O custo do capital' },
        { id: 'k', label: 'Taxa mínima de atratividade', min: 0.5, max: 40, step: 0.5, valor: 12, unidade: '% a.a.' }
      ],
      graficos: [
        { id: 'cae', titulo: 'Custo anual equivalente contra a taxa', xlabel: 'Taxa (% a.a.)',
          ylabel: 'CAE ($/ano)', aspect: 0.46, legendPos: 'topleft' },
        { id: 'vp', titulo: 'Valor presente dos custos no horizonte comum', ylabel: '$', aspect: 0.32, legend: false }
      ],
      saidas: [
        { id: 'caeA', label: 'CAE da alternativa A' },
        { id: 'caeB', label: 'CAE da alternativa B' },
        { id: 'mmc', label: 'Horizonte comum (MMC)' },
        { id: 'vpA', label: 'VP de A no horizonte' },
        { id: 'vpB', label: 'VP de B no horizonte' },
        { id: 'esc', label: 'Escolha' }
      ],
      formulas: [
        { g: 'O problema do horizonte' },
        { tex: 'VP_A \\ne VP_B \\;\\text{não decide se}\\; n_A \\ne n_B', d: 'comparar durações diferentes exige um ajuste', destaque: true },
        { g: 'Saída 1 — repetição até o MMC' },
        { tex: 'n^* = \\mathrm{mmc}(n_A, n_B)', d: 'repete-se cada alternativa até o horizonte comum' },
        { g: 'Saída 2 — custo anual equivalente' },
        { tex: 'CAE = \\frac{VP}{(P/A,k_a,n)}', d: 'dispensa o MMC: já está em $/ano', destaque: true },
        { g: 'Saída 3 — análise incremental' },
        { tex: '\\Delta = B - A \\;\\Rightarrow\\; TIR_\\Delta > k_a \\;?', d: 'o investimento a mais se paga?' }
      ],
      nota: 'Repetir até o mínimo múltiplo comum supõe que cada alternativa será reposta nas mesmas condições — hipótese razoável para equipamento de uso contínuo e frágil quando há mudança tecnológica à vista. Quando a hipótese não se sustenta, define-se um horizonte de estudo e atribui-se valor residual ao que sobrar.',
      calcular: function (p, ctx) {
        var k = p.k / 100, nA = Math.round(p.nA), nB = Math.round(p.nB);
        function mdc(a, b) { return b ? mdc(b, a % b) : a; }
        var MMC = nA * nB / mdc(nA, nB);

        function fluxo(I, C, n, ate) {
          var fc = [], j;
          for (j = 0; j <= ate; j++) fc.push(j === 0 ? -I : -C);
          for (j = n; j < ate; j += n) fc[j] -= I;    /* reposição ao fim de cada ciclo */
          return fc;
        }
        var fcA = fluxo(p.IA, p.CA, nA, MMC), fcB = fluxo(p.IB, p.CB, nB, MMC);
        var vpA = EE.vpl(fcA, k), vpB = EE.vpl(fcB, k);
        /* o CAE sai do ciclo isolado e não muda com a repetição */
        var caeA = EE.vpl(fluxo(p.IA, p.CA, nA, nA), k) / EE.pa(k, nA);
        var caeB = EE.vpl(fluxo(p.IB, p.CB, nB, nB), k) / EE.pa(k, nB);
        var melhor = caeA > caeB ? 'B' : 'A';

        var g = ctx.plot('cae').clear();
        var xs = [], ya = [], yb = [], t, j;
        for (j = 0; j <= 140; j++) {
          t = 0.5 + (Math.max(p.k * 2, 30) - 0.5) * j / 140;
          var tt = t / 100;
          xs.push(t);
          ya.push(-EE.vpl(fluxo(p.IA, p.CA, nA, nA), tt) / EE.pa(tt, nA));
          yb.push(-EE.vpl(fluxo(p.IB, p.CB, nB, nB), tt) / EE.pa(tt, nB));
        }
        g.line(xs, ya, { color: cor(0), width: 2.4, label: 'A (' + nA + ' anos)' });
        g.line(xs, yb, { color: cor(3), width: 2.4, label: 'B (' + nB + ' anos)' });
        g.vline(p.k, { color: cor(5), width: 1.6, dash: [5, 4], text: 'TMA' });
        /* taxa de indiferença, quando existe dentro da faixa */
        var ind = null;
        for (j = 1; j < xs.length; j++) {
          if ((ya[j - 1] - yb[j - 1]) * (ya[j] - yb[j]) < 0) { ind = xs[j]; break; }
        }
        if (ind !== null) g.marker(ind, -EE.vpl(fluxo(p.IA, p.CA, nA, nA), ind / 100) / EE.pa(ind / 100, nA),
          'indiferença ' + nt(ind, 3) + ' %', { color: cor(1) });
        g.draw();

        var gv = ctx.plot('vp').clear();
        gv.o.xcat = [{ v: 0, label: 'A repetida' }, { v: 1, label: 'B repetida' }];
        gv.bars([0], [-vpA], { color: cor(0), barw: 0.5 });
        gv.bars([1], [-vpB], { color: cor(3), barw: 0.5 });
        gv.text(0, -vpA, din(-vpA), { align: 'center', dy: -4, size: 11, weight: '600' });
        gv.text(1, -vpB, din(-vpB), { align: 'center', dy: -4, size: 11, weight: '600' });
        gv.setLimits([-0.6, 1.6], [0, Math.max(-vpA, -vpB) * 1.2]);
        gv.draw();

        ctx.setPassos([
          { t: '① Por que não comparar os VP direto',
            obs: nA === nB
              ? 'Aqui as duas vidas são iguais (' + nA + ' anos), e por isso o valor presente dos custos já decide: '
                + 'A custa $ ' + din(-EE.vpl(fluxo(p.IA, p.CA, nA, nA), k)) + ' e B custa $ '
                + din(-EE.vpl(fluxo(p.IB, p.CB, nB, nB), k)) + ' em valor de hoje.'
              : 'A dura ' + nA + ' anos e B dura ' + nB + '. Comparar o VP de um ciclo de cada seria comparar '
                + 'serviços diferentes — a alternativa curta parece barata só porque entrega menos tempo de serviço.' },
          { t: '② Saída 1: repetir até o MMC',
            tex: 'n^* = \\mathrm{mmc}(' + nA + ',\\,' + nB + ') = ' + MMC + '\\ \\text{anos}',
            texSub: 'VP_A = ' + nt(-vpA, 7) + ' \\qquad VP_B = ' + nt(-vpB, 7),
            obs: 'Repetindo cada alternativa até ' + MMC + ' anos, as duas entregam o mesmo serviço pelo mesmo tempo e '
              + 'os valores presentes passam a ser comparáveis. ' + (vpA > vpB ? 'A' : 'B') + ' custa menos.' },
          { t: '③ Saída 2: o custo anual equivalente',
            texSub: 'CAE_A = ' + nt(-caeA, 6) + '\\ \\text{/ano} \\qquad CAE_B = ' + nt(-caeB, 6) + '\\ \\text{/ano}',
            obs: 'O CAE chega à mesma conclusão sem precisar do MMC, porque já está em $/ano. É o método preferido na prática — '
              + 'e repare que o CAE calculado sobre um ciclo é idêntico ao calculado sobre a série repetida: a repetição '
              + 'não muda o custo por ano.' },
          { t: '④ A decisão e sua robustez',
            obs: 'À TMA de ' + nt(p.k, 3) + ' %, a escolha é a alternativa ' + melhor + ', com economia de $ '
              + din(Math.abs(caeA - caeB)) + ' por ano. '
              + (ind !== null
                ? 'A decisão se inverte em torno de ' + nt(ind, 3) + ' % — acima dessa taxa, o capital fica caro e a '
                  + 'alternativa de menor investimento inicial passa a ganhar. Vale conferir se a TMA adotada está longe '
                  + 'dessa fronteira.'
                : 'Dentro de toda a faixa de taxas do gráfico a decisão não muda, o que a torna robusta à incerteza sobre a TMA.') }
        ]);
        return {
          caeA: { v: '$ ' + din(-caeA) + '/ano', classe: melhor === 'A' ? 'ok' : '' },
          caeB: { v: '$ ' + din(-caeB) + '/ano', classe: melhor === 'B' ? 'ok' : '' },
          mmc: { v: MMC, u: 'anos' },
          vpA: { v: '$ ' + din(-vpA) },
          vpB: { v: '$ ' + din(-vpB) },
          esc: { v: 'alternativa ' + melhor, classe: 'ok' }
        };
      }
    });
  }

  function iniciar() {
    montarJuros();
    montarSeries();
    montarAmortizacao();
    montarVpl();
    montarAlternativas();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(window);

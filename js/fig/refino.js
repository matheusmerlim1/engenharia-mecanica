/* ============================================================
   Figuras ilustrativas de Refino de Petróleo
   Caracterização, curva PEV, esquemas, dessalgação, destilação,
   vácuo, FCC, rotas de conversão, HDS, mistura e Claus.
   Os modelos são simplificados, mas os balanços fecham.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* curva PEV modelo: T(v) ajustada ao °API do cru */
  function pev(API) {
    /* forma de Weibull ajustada a um cru de 31 °API (55 % de claros até 370 °C)
       e deslocada com o °API: mais leve, curva mais baixa */
    var A = 440.8 * (1 + 0.012 * (31 - API)), b = 0.5436;
    return {
      T: function (v) {
        var f = lim(v, 0, 99.5) / 100;
        return -20 + A * Math.pow(-Math.log(1 - f), b);
      },
      v: function (T) {
        var x = lim(T + 20, 1, 1e4) / A;
        return 100 * (1 - Math.exp(-Math.pow(x, 1 / b)));
      }
    };
  }

  /* ---------- 1.1 — °API e fator de caracterização ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Duas réguas bastam para situar um petróleo: o °API diz se é leve ou pesado, e o K_UOP diz se é parafínico ou aromático — duas frações com o mesmo ponto de ebulição podem ter caráter oposto (exemplo 1.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'd', rot: 'Densidade relativa a 60 °F', min: 0.75, max: 1.05, val: 0.87, passo: 0.005 },
      { id: 'Tb', rot: 'Ebulição média de uma fração', min: 100, max: 500, val: 300, passo: 10, un: '°C' },
      { id: 'df', rot: 'Densidade dessa fração', min: 0.70, max: 1.0, val: 0.85, passo: 0.005 }
    ],
    desenhar: function (g, p) {
      var d = p.d, Tb = p.Tb, df = p.df;
      var API = 141.5 / d - 131.5;
      var K = Math.pow((Tb + 273.15) * 1.8, 1 / 3) / df;
      var classe = API > 31.1 ? 'leve' : API > 22.3 ? 'médio' : API > 10 ? 'pesado' : 'extrapesado';
      var carater = K >= 12.5 ? 'parafínico' : K >= 11.7 ? 'naftênico-parafínico' : K >= 11.0 ? 'naftênico' : 'aromático';
      /* régua de °API */
      var bx = 0.9, bw = 5.8, by = 3.6;
      var faixas = [[0, 10, 'extrapesado', 'erro'], [10, 22.3, 'pesado', 'aviso'], [22.3, 31.1, 'médio', 's4'], [31.1, 50, 'leve', 'ok']];
      var XA = function (a) { return bx + bw * lim(a, 0, 50) / 50; };
      faixas.forEach(function (f) {
        g.ret(XA(f[0]), by, XA(f[1]) - XA(f[0]), 0.5, { cor: 'fundo', larg: 1, preenche: f[3], alfa: 0.55 });
        if (XA(f[1]) - XA(f[0]) > 0.9) g.txt(f[2], (XA(f[0]) + XA(f[1])) / 2, by + 0.25, { cor: 'texto', tam: 10 });
      });
      g.seta(XA(API), by + 1.05, 0, -0.42, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.txt(fx(API, 1) + ' °API', XA(API), by + 1.35, { cor: 'erro', tam: 12.5, negrito: true, fundo: true });
      [0, 10, 20, 30, 40, 50].forEach(function (a) {
        g.linha(XA(a), by, XA(a), by - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(a + '', XA(a), by - 0.42, { cor: 'fraco', tam: 10 });
      });
      g.txt('°API = 141,5/d − 131,5', bx + bw / 2, by - 0.85, { cor: 'fraco', tam: 11 });
      /* régua de K_UOP */
      var ky = 1.0;
      var kf = [[10, 11, 'aromático', 'erro'], [11, 11.9, 'naftênico', 'aviso'], [11.9, 12.5, 'misto', 's4'], [12.5, 13.5, 'parafínico', 'ok']];
      var XK = function (a) { return bx + bw * lim(a - 10, 0, 3.5) / 3.5; };
      kf.forEach(function (f) {
        g.ret(XK(f[0]), ky, XK(f[1]) - XK(f[0]), 0.5, { cor: 'fundo', larg: 1, preenche: f[3], alfa: 0.55 });
        if (XK(f[1]) - XK(f[0]) > 0.9) g.txt(f[2], (XK(f[0]) + XK(f[1])) / 2, ky + 0.25, { cor: 'texto', tam: 10 });
      });
      g.seta(XK(K), ky + 1.0, 0, -0.4, { cor: 's1', larg: 2, ponta: 0.2 });
      g.txt('K = ' + fx(K, 2), XK(K), ky + 1.3, { cor: 's1', tam: 12.5, negrito: true, fundo: true });
      [10, 11, 12, 13].forEach(function (a) {
        g.linha(XK(a), ky, XK(a), ky - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(a, 0), XK(a), ky - 0.42, { cor: 'fraco', tam: 10 });
      });
      g.txt('K_UOP = ∛(T_B em °R) / d', bx + bw / 2, ky - 0.85, { cor: 'fraco', tam: 11 });
      var xr = 7.4;
      g.txt('d = ' + fx(d, 3) + ' a 60 °F', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(fx(API, 2) + ' °API — cru ' + classe, xr, 4.3, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('fração a ' + fx(Tb, 0) + ' °C (' + fx((Tb + 273.15) * 1.8, 0) + ' °R)', xr, 3.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('com densidade ' + fx(df, 3), xr, 3.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('K_UOP = ' + fx(K, 3), xr, 2.3, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('caráter ' + carater, xr, 1.7, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(K >= 11.9 ? 'bom para diesel e querosene' : 'bom para gasolina, ruim para cetano',
        xr, 1.0, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt('a água, com d = 1, vale exatamente 10 °API', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 2.1 — curva PEV e rendimentos ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'A curva PEV e os cortes: cada faixa de temperatura corresponde a uma fatia do barril. Quanto mais pesado o cru, mais a curva sobe e menos destilados claros ele entrega (exemplo 2.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'API', rot: 'Grau API do cru', min: 14, max: 42, val: 31, passo: 0.5, un: '°API' },
      { id: 'corte', rot: 'Temperatura de corte do diesel', min: 300, max: 400, val: 370, passo: 5, un: '°C' }
    ],
    desenhar: function (g, p) {
      var API = p.API, corte = p.corte, c = pev(API);
      var cortes = [
        { nome: 'gás e GLP', t0: -50, t1: 20, cor: 's4' },
        { nome: 'naftas', t0: 20, t1: 175, cor: 'ok' },
        { nome: 'querosene', t0: 175, t1: 235, cor: 's1' },
        { nome: 'diesel', t0: 235, t1: corte, cor: 'aviso' },
        { nome: 'gasóleo de vácuo', t0: corte, t1: 565, cor: 's3' },
        { nome: 'resíduo', t0: 565, t1: 1000, cor: 'erro' }
      ];
      var gx = 1.3, gy = 0.8, gw = 5.6, gh = 4.1;
      var X = function (v) { return gx + gw * lim(v, 0, 100) / 100; };
      var Y = function (T) { return gy + gh * lim(T + 50, 0, 750) / 750; };
      cortes.forEach(function (k) {
        var v0 = lim(c.v(k.t0), 0, 100), v1 = lim(c.v(k.t1), 0, 100);
        k.rend = v1 - v0;
        if (k.rend > 0.4) g.ret(X(v0), gy, X(v1) - X(v0), gh, { preenche: k.cor, cor: null, alfa: 0.14 });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 100; i++) pts.push([X(i), Y(c.T(i))]);
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      [175, 235, corte, 565].forEach(function (T) {
        var v = c.v(T);
        if (v > 99.5) return;
        g.linha(gx, Y(T), X(v), Y(T), { cor: 'fraco', larg: 1, tracejado: [4, 3] });
        g.linha(X(v), gy, X(v), Y(T), { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      });
      [0, 20, 40, 60, 80, 100].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [200, 400, 600].forEach(function (T) {
        g.linha(gx, Y(T), gx - 0.14, Y(T), { cor: 'fraco', larg: 1 });
        g.txt(T + '', gx - 0.26, Y(T), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('% volume acumulado', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4, y = 5.0, claros = 0;
      cortes.forEach(function (k, idx) {
        if (idx < 4) claros += k.rend;
        g.ret(xr, y - 0.13, 0.26, 0.26, { preenche: k.cor, cor: null, alfa: 0.75 });
        g.txt(k.nome, xr + 0.4, y, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.txt(fx(Math.max(0, k.rend), 1) + ' %', xr + 4.6, y, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
        y -= 0.55;
      });
      g.txt('destilados claros: ' + fx(claros, 1) + ' %', xr, 1.5, { cor: 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt('resíduo atmosférico: ' + fx(100 - claros, 1) + ' %', xr, 0.9, { cor: 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('curva modelo ajustada ao °API — a PEV real vem de ensaio (ASTM D2892 e D5236)', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — esquemas de refino ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Os quatro esquemas e o que cada um faz com o fundo do barril: quanto mais conversão, menos óleo combustível sobra — e maior a complexidade medida pelo índice de Nelson.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'esq', rot: 'Esquema: 1 topping · 2 conversão · 3 profunda · 4 lubrificantes', min: 1, max: 4, val: 2, passo: 1 },
      { id: 'API', rot: 'Grau API do cru', min: 14, max: 42, val: 31, passo: 0.5, un: '°API' }
    ],
    desenhar: function (g, p) {
      var esq = Math.round(p.esq), API = p.API, c = pev(API);
      var claros = c.v(370), gov = c.v(565) - c.v(370), res = 100 - c.v(565);
      var nomes = ['topping', 'conversão', 'conversão profunda', 'lubrificantes'];
      var nelson = [2, 6, 12, 8][esq - 1];
      var leves, oc, outros = 0, rotulo;
      if (esq === 1) { leves = claros; oc = gov + res; rotulo = 'óleo combustível'; }
      else if (esq === 2) { leves = claros + 0.75 * gov; oc = 0.25 * gov + res; rotulo = 'óleo combustível'; }
      else if (esq === 3) { leves = claros + 0.78 * gov + 0.62 * res; oc = 0; outros = 0.22 * gov + 0.38 * res; rotulo = 'coque e gás'; }
      else { leves = claros + 0.35 * gov; outros = 0.65 * gov + 0.55 * res; oc = 0.45 * res; rotulo = 'básicos e asfalto'; }
      var bx = 0.9, bw = 5.4, by = 1.2, bh = 3.4;
      var faixas = [[leves, 'ok', 'derivados claros'], [outros, 's4', rotulo], [oc, 'erro', esq === 4 ? 'asfalto' : 'óleo combustível']];
      var ac = 0;
      faixas.forEach(function (f) {
        if (f[0] <= 0.3) return;
        var h = bh * f[0] / 100;
        g.ret(bx, by + ac, bw, h, { cor: 'fundo', larg: 1.2, preenche: f[1], alfa: 0.55 });
        if (h > 0.4) {
          g.txt(f[2], bx + 0.2, by + ac + h / 2, { cor: 'texto', tam: 11, alin: 'esq' });
          g.txt(fx(f[0], 1) + ' %', bx + bw - 0.2, by + ac + h / 2, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
        }
        ac += h;
      });
      g.linha(bx, by, bx, by + bh, { cor: 'fraco', larg: 1 });
      g.txt('100 % do barril', bx + bw / 2, by + bh + 0.35, { cor: 'fraco', tam: 11 });
      g.txt(nomes[esq - 1], bx + bw / 2, by - 0.42, { cor: 'texto', tam: 13, negrito: true });
      var xr = 7.0;
      g.txt('unidades do esquema', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      var lista = [
        ['destilação atmosférica', 'reforma', 'hidrotratamento'],
        ['atmosférica', 'vácuo', 'FCC', 'reforma e HDT'],
        ['atmosférica e vácuo', 'FCC', 'coqueamento ou HCC', 'HDT em tudo'],
        ['atmosférica e vácuo', 'desasfaltação', 'extração de aromáticos', 'desparafinação']
      ][esq - 1];
      var yy = 4.45;
      lista.forEach(function (u) { g.txt('· ' + u, xr, yy, { cor: 'suave', tam: 11.5, alin: 'esq' }); yy -= 0.5; });
      g.txt('índice de Nelson ≈ ' + nelson, xr, yy - 0.15, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('claros diretos do cru: ' + fx(claros, 1) + ' %', xr, yy - 0.85, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(esq === 1 ? 'vulnerável: depende de vender o fundo' :
        esq === 3 ? 'praticamente não sobra óleo combustível' : 'parte do fundo ainda sobra',
        xr, yy - 1.45, { cor: esq === 1 ? 'erro' : esq === 3 ? 'ok' : 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('rendimentos de conversão típicos — cada refinaria tem os seus', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — dessalgação em estágios ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'As eficiências dos estágios se multiplicam, não se somam: é por isso que dois estágios resolvem o que um não resolve, e por isso que cru salgado exige dessalgadoras em série (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'sal', rot: 'Sal na entrada', min: 5, max: 200, val: 50, passo: 5, un: 'lb/1000 bbl' },
      { id: 'ef', rot: 'Eficiência de cada estágio', min: 50, max: 98, val: 90, passo: 1, un: '%' },
      { id: 'n', rot: 'Estágios em série', min: 1, max: 3, val: 2, passo: 1 }
    ],
    desenhar: function (g, p) {
      var sal = p.sal, ef = p.ef / 100, n = Math.round(p.n), limite = 1;
      var gx = 1.3, gy = 0.9, gw = 5.4, gh = 4.0;
      var Y = function (v) { return gy + gh * (Math.log10(lim(v, 0.01, 200)) + 2) / 4.3; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(limite), gx + gw, Y(limite), { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('limite usual 1 lb/1000 bbl', gx + gw - 0.12, Y(limite) + 0.26, { cor: 'erro', tam: 10.5, alin: 'dir' });
      var i, s = sal, bw = gw / 4.6, xs = [gx + 0.45];
      for (i = 1; i <= 3; i++) xs.push(gx + 0.45 + i * gw / 4);
      var vals = [sal];
      for (i = 1; i <= 3; i++) { s = s * (1 - ef); vals.push(s); }
      for (i = 0; i <= 3; i++) {
        var ativo = i <= n;
        g.ret(xs[i] - bw / 2, gy, bw, Y(vals[i]) - gy,
          { cor: 'fundo', larg: 1, preenche: i === 0 ? 'fraco' : vals[i] <= limite ? 'ok' : 'aviso', alfa: ativo ? 0.75 : 0.18 });
        if (ativo) g.txt(fx(vals[i], vals[i] < 1 ? 2 : 1), xs[i], Y(vals[i]) + 0.28, { cor: 'texto', tam: 10.5, negrito: true });
        g.txt(i === 0 ? 'entrada' : i + 'º estágio', xs[i], gy - 0.42, { cor: ativo ? 'suave' : 'fraco', tam: 10 });
      }
      [0.1, 1, 10, 100].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v < 1 ? '0,1' : fx(v, 0), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('sal (lb/1000 bbl, escala log)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var fim = vals[n];
      var xr = 7.4;
      g.txt('entrada ' + fx(sal, 0) + ' lb/1000 bbl', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(n + (n > 1 ? ' estágios' : ' estágio') + ' a ' + fx(p.ef, 0) + ' %', xr, 4.3, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('saída ' + fx(fim, fim < 1 ? 3 : 2) + ' lb/1000 bbl', xr, 3.5, { cor: fim <= limite ? 'ok' : 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('remoção total de ' + fx(100 * (1 - fim / sal), 2) + ' %', xr, 2.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fim <= limite ? 'dentro do limite: topo da torre protegido' : 'acima do limite: HCl e corrosão no topo',
        xr, 2.1, { cor: fim <= limite ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('cada estágio deixa passar ' + fx(100 * (1 - ef), 0) + ' %', xr, 1.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('do que entrou nele', xr, 1.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('cloretos de magnésio e cálcio hidrolisam a HCl acima de ~120 °C', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — torre atmosférica ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A torre separa faixas de ebulição: cada retirada lateral sai no prato cuja temperatura corresponde ao fim do corte. Subir a temperatura do forno recupera destilado — até o limite do craqueamento (exemplo 5.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Tf', rot: 'Temperatura de saída do forno', min: 330, max: 400, val: 370, passo: 5, un: '°C' },
      { id: 'API', rot: 'Grau API do cru', min: 14, max: 42, val: 31, passo: 0.5, un: '°API' },
      { id: 'carga', rot: 'Carga da torre', min: 5, max: 60, val: 30, passo: 1, un: 'mil m³/d' }
    ],
    desenhar: function (g, p) {
      var Tf = p.Tf, API = p.API, carga = p.carga * 1000, c = pev(API);
      var craque = Tf > 385;
      var corte = Math.min(Tf - 5, 380);
      var cortes = [
        { nome: 'nafta', t1: 175, cor: 'ok' },
        { nome: 'querosene', t1: 235, cor: 's1' },
        { nome: 'diesel', t1: corte, cor: 'aviso' }
      ];
      var tx = 1.6, tw = 1.5, ty = 0.6, th = 4.2;
      g.ret(tx, ty, tw, th, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.45 });
      var i, ant = 0, claros = 0;
      var zonaY = ty + th * 0.18;
      g.linha(tx, zonaY, tx + tw, zonaY, { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('zona de flash', tx + tw / 2, zonaY - 0.28, { cor: 'erro', tam: 10 });
      g.seta(tx - 1.0, zonaY, 0.85, 0, { cor: 'erro', larg: 2, ponta: 0.2 });
      g.txt('cru a ' + fx(Tf, 0) + ' °C', tx - 1.05, zonaY + 0.3, { cor: 'erro', tam: 10.5, alin: 'esq' });
      cortes.forEach(function (k, idx) {
        var v = c.v(k.t1);
        k.rend = v - ant; ant = v; claros += k.rend;
        var yy = ty + th * (0.72 - 0.21 * idx);
        g.linha(tx + tw, yy, tx + tw + 0.75, yy, { cor: k.cor, larg: 2 });
        g.pontaSeta(tx + tw + 0.75, yy, 0, k.cor, 0.2);
        g.txt(k.nome + ' ' + fx(k.rend, 1) + ' %', tx + tw + 0.85, yy + 0.22, { cor: k.cor, tam: 10.5, alin: 'esq' });
        g.txt(fx(k.rend * carga / 100, 0) + ' m³/d', tx + tw + 0.85, yy - 0.22, { cor: 'fraco', tam: 10, alin: 'esq' });
      });
      var vGLP = c.v(20);
      g.linha(tx + tw / 2, ty + th, tx + tw / 2, ty + th + 0.5, { cor: 's4', larg: 2 });
      g.pontaSeta(tx + tw / 2, ty + th + 0.5, Math.PI / 2, 's4', 0.2);
      g.txt('gás e GLP ' + fx(vGLP, 1) + ' %', tx + tw / 2, ty + th + 0.75, { cor: 's4', tam: 10.5 });
      g.linha(tx + tw / 2, ty, tx + tw / 2, ty - 0.5, { cor: 'erro', larg: 2 });
      g.pontaSeta(tx + tw / 2, ty - 0.5, -Math.PI / 2, 'erro', 0.2);
      claros += vGLP;
      g.txt('resíduo ' + fx(100 - claros, 1) + ' %', tx + tw / 2, ty - 0.75, { cor: 'erro', tam: 10.5 });
      var xr = 7.2;
      g.txt('carga ' + fx(carga, 0) + ' m³/dia', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('≈ ' + fx(carga * 6.29, 0) + ' bbl/dia', xr, 4.45, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('claros: ' + fx(claros, 1) + ' %', xr, 3.7, { cor: 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt('= ' + fx(claros * carga / 100, 0) + ' m³/dia', xr, 3.1, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('resíduo para o vácuo:', xr, 2.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx((100 - claros) * carga / 100, 0) + ' m³/dia', xr, 1.9, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt(craque ? 'acima de 385 °C: craqueamento no forno' : 'abaixo do limite de craqueamento',
        xr, 1.1, { cor: craque ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('o corte do diesel acompanha a temperatura do forno, limitado a 380 °C', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — vácuo ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Abaixar a pressão desloca a ebulição para longe da faixa de craqueamento: o mesmo corte que ferveria a 565 °C na atmosfera ferve pouco acima de 350 °C sob 25 mmHg (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'AET', rot: 'Temperatura atmosférica equivalente', min: 350, max: 650, val: 565, passo: 5, un: '°C' },
      { id: 'P', rot: 'Pressão na zona de flash', min: 5, max: 200, val: 25, passo: 1, un: 'mmHg' }
    ],
    desenhar: function (g, p) {
      var AET = p.AET, P = p.P, R = 8.314;
      function Treal(Pmm) {
        var Tb = AET + 273.15, dH = 88 * Tb;
        return 1 / (1 / Tb - R * Math.log(Pmm / 760) / dH) - 273.15;
      }
      var T = Treal(P), Tcraq = 400;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (v) { return gx + gw * (Math.log10(lim(v, 1, 760))) / Math.log10(760); };
      var Y = function (v) { return gy + gh * lim(v - 150, 0, 550) / 550; };
      g.ret(gx, Y(Tcraq), gw, gy + gh - Y(Tcraq), { preenche: 'erro', cor: null, alfa: 0.1 });
      g.linha(gx, Y(Tcraq), gx + gw, Y(Tcraq), { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('craqueamento térmico acima de 400 °C', gx + gw - 0.12, Y(Tcraq) + 0.26, { cor: 'erro', tam: 10.5, alin: 'dir' });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 90; i++) {
        var Pm = Math.pow(10, Math.log10(760) * i / 90);
        pts.push([X(Pm), Y(Treal(Pm))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.circ(X(P), Y(T), 0.16, { preenche: 'erro', cor: null });
      g.linha(X(P), gy, X(P), Y(T), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.linha(gx, Y(T), X(P), Y(T), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.circ(X(760), Y(AET), 0.13, { preenche: 'fraco', cor: null });
      g.txt('1 atm', X(760) - 0.12, Y(AET) + 0.28, { cor: 'fraco', tam: 10, alin: 'dir' });
      [1, 10, 100, 760].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(v === 760 ? '760' : fx(v, 0), X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [200, 300, 400, 500, 600].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('pressão (mmHg, escala log)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('T de ebulição (°C)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4;
      g.txt('corte de ' + fx(AET, 0) + ' °C AET', xr, 5.0, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('a ' + fx(P, 0) + ' mmHg', xr, 4.4, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('ferve a ' + fx(T, 0) + ' °C', xr, 3.6, { cor: T < Tcraq ? 'ok' : 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('margem até o craqueamento:', xr, 2.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Tcraq - T, 0) + ' °C', xr, 2.4, { cor: T < Tcraq ? 'ok' : 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(T < Tcraq ? 'vaporiza sem quebrar as moléculas' : 'craquearia antes de ferver',
        xr, 1.7, { cor: T < Tcraq ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ganho em relação a 1 atm: ' + fx(AET - T, 0) + ' °C', xr, 1.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('estimativa por Clausius-Clapeyron com ΔH_v pela regra de Trouton (88 T_b)', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — rendimentos do FCC ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Mais severidade converte mais, mas não entrega mais gasolina indefinidamente: passado o ponto ótimo, o que se ganha vem como GLP, gás e coque — e o regenerador tem limite (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura de saída do riser', min: 490, max: 550, val: 521, passo: 1, un: '°C' },
      { id: 'carga', rot: 'Carga (mil m³/d de gasóleo)', min: 1, max: 12, val: 6, passo: 0.5 }
    ],
    desenhar: function (g, p) {
      var T = p.T, carga = p.carga * 1000;
      function rend(Tr) {
        var s = lim((Tr - 490) / 60, 0, 1);
        var conv = 60 + 25 * s;
        var wg = 0.72 - 0.20 * s, wl = 0.18 + 0.15 * s, wd = 0.025 + 0.03 * s, wc = 0.075 + 0.02 * s;
        var naoconv = 100 - conv;
        return {
          s: s, conv: conv,
          gasolina: conv * wg, glp: conv * wl, gas: conv * wd, coque: conv * wc,
          lco: naoconv * 0.63, dec: naoconv * 0.37
        };
      }
      var r = rend(T);
      var gx = 1.3, gy = 0.9, gw = 5.4, gh = 4.1;
      var X = function (v) { return gx + gw * lim(v - 490, 0, 60) / 60; };
      var Y = function (v) { return gy + gh * lim(v, 0, 90) / 90; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var series = [
        { k: 'conv', cor: 'fraco', nome: 'conversão', larg: 1.6, tracejado: [5, 4] },
        { k: 'gasolina', cor: 's1', nome: 'gasolina', larg: 2.8 },
        { k: 'glp', cor: 'ok', nome: 'GLP', larg: 2.2 },
        { k: 'lco', cor: 'aviso', nome: 'LCO', larg: 2 },
        { k: 'coque', cor: 'erro', nome: 'coque', larg: 2 }
      ];
      var i;
      series.forEach(function (se) {
        var pts = [];
        for (i = 0; i <= 60; i++) { var Tr = 490 + i; pts.push([X(Tr), Y(rend(Tr)[se.k])]); }
        g.caminho(pts, { cor: se.cor, larg: se.larg, tracejado: se.tracejado });
        if (se.k === 'conv' || se.k === 'gasolina') g.txt(se.nome, gx + gw + 0.12, Y(rend(550)[se.k]), { cor: se.cor, tam: 10, alin: 'esq' });
      });
      g.linha(X(T), gy, X(T), gy + gh, { cor: 'suave', larg: 1, tracejado: [3, 3] });
      g.circ(X(T), Y(r.gasolina), 0.14, { preenche: 's1', cor: null });
      [490, 510, 530, 550].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [20, 40, 60, 80].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('temperatura do riser (°C)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('% massa', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.9, soma = r.gasolina + r.glp + r.gas + r.coque + r.lco + r.dec;
      g.txt('conversão ' + fx(r.conv, 1) + ' %', xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      var linhas = [['gasolina', r.gasolina, 's1'], ['GLP', r.glp, 'ok'], ['gás seco', r.gas, 's4'],
                    ['LCO', r.lco, 'aviso'], ['decantado', r.dec, 'fraco'], ['coque', r.coque, 'erro']];
      var yy = 4.3;
      linhas.forEach(function (l) {
        g.txt(l[0], xr, yy, { cor: l[2], tam: 11.5, alin: 'esq' });
        g.txt(fx(l[1], 1) + ' %', xr + 2.6, yy, { cor: l[2], tam: 11.5, alin: 'dir', negrito: true });
        g.txt(fx(l[1] * carga / 100, 0), xr + 4.3, yy, { cor: 'fraco', tam: 10.5, alin: 'dir' });
        yy -= 0.48;
      });
      g.txt('m³/d', xr + 4.3, 4.78, { cor: 'fraco', tam: 10, alin: 'dir' });
      g.txt('soma ' + fx(soma, 0) + ' %', xr, yy - 0.1, { cor: 'suave', tam: 11, alin: 'esq' });
      g.txt(r.coque > 7 ? 'coque alto: regenerador no limite' : 'coque dentro da faixa usual',
        xr, yy - 0.65, { cor: r.coque > 7 ? 'erro' : 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('conversão = 100 − (LCO + decantado) · modelo de severidade com balanço fechado', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — rejeitar carbono ou adicionar hidrogênio ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Converter pesado em leve é um problema de hidrogênio. Ou se rejeita carbono, perdendo rendimento em coque, ou se adiciona hidrogênio, pagando por ele — e a conta sai do balanço atômico.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'HCc', rot: 'H/C atômico da carga', min: 1.1, max: 1.8, val: 1.4, passo: 0.01 },
      { id: 'HCp', rot: 'H/C atômico do produto desejado', min: 1.5, max: 2.1, val: 1.8, passo: 0.01 },
      { id: 'rota', rot: 'Rota: 1 rejeitar carbono · 2 adicionar H₂', min: 1, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var HCc = p.HCc, HCp = Math.max(p.HCp, p.HCc + 0.05), rota = Math.round(p.rota);
      var HCcoque = 0.5;
      /* base: 100 kmol de carbono na carga */
      var xC = (HCp - HCc) / (HCp - HCcoque) * 100;          /* kmol C que viram coque */
      var massaCarga = 100 * (12 + HCc), massaCoque = xC * (12 + HCcoque);
      var rendCoque = 100 * massaCoque / massaCarga;
      var H2 = (HCp - HCc) / 2 * 100;                        /* kmol H2 por 100 kmol C */
      var Nm3porT = H2 * 22.414 / (massaCarga / 1000);
      var gx = 0.9, gy = 1.0, gw = 5.4, gh = 3.9;
      var X = function (v) { return gx + gw * lim(v - 0.4, 0, 1.8) / 1.8; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      [0.5, 1.0, 1.5, 2.0].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 1), X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('razão H/C atômica', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      var refs = [[0.5, 'coque', 'erro'], [1.4, 'resíduo', 'aviso'], [1.75, 'gasóleo', 's4'], [1.9, 'gasolina', 'ok'], [2.1, 'GLP', 's1']];
      refs.forEach(function (r, i) {
        var yy = gy + 0.6 + (i % 2) * 0.45;
        g.linha(X(r[0]), gy, X(r[0]), yy, { cor: r[2], larg: 1.2, tracejado: [3, 3] });
        g.circ(X(r[0]), gy, 0.1, { preenche: r[2], cor: null });
        g.txt(r[1], X(r[0]), yy + 0.25, { cor: r[2], tam: 10, fundo: true });
      });
      g.seta(X(HCc), gy + 2.6, X(HCp) - X(HCc), 0, { cor: rota === 1 ? 'aviso' : 'ok', larg: 2.6, ponta: 0.22 });
      g.txt(rota === 1 ? 'rejeitando carbono' : 'adicionando hidrogênio',
        (X(HCc) + X(HCp)) / 2, gy + 2.95, { cor: rota === 1 ? 'aviso' : 'ok', tam: 11.5, negrito: true, fundo: true });
      g.circ(X(HCc), gy + 2.6, 0.14, { preenche: 'texto', cor: null });
      g.txt('carga ' + fx(HCc, 2), X(HCc), gy + 2.25, { cor: 'texto', tam: 10.5, fundo: true });
      g.circ(X(HCp), gy + 2.6, 0.14, { preenche: 'erro', cor: null });
      g.txt('produto ' + fx(HCp, 2), X(HCp), gy + 2.25, { cor: 'erro', tam: 10.5, fundo: true });
      var xr = 6.9;
      if (rota === 1) {
        g.txt('rejeição de carbono (coqueamento)', xr, 5.0, { cor: 'aviso', tam: 12.5, alin: 'esq', negrito: true });
        g.txt('por 100 kmol de C na carga:', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
        g.txt(fx(xC, 1) + ' kmol de C vão para o coque', xr, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.txt('rendimento de coque ' + fx(rendCoque, 1) + ' % massa', xr, 3.1, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
        g.txt('líquido recuperado ' + fx(100 - rendCoque, 1) + ' %', xr, 2.4, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
        g.txt('investimento baixo, perde rendimento', xr, 1.7, { cor: 'suave', tam: 11, alin: 'esq' });
        g.txt('e o coque vale pouco', xr, 1.25, { cor: 'fraco', tam: 11, alin: 'esq' });
      } else {
        g.txt('adição de hidrogênio (hidrocraqueamento)', xr, 5.0, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
        g.txt('por 100 kmol de C na carga:', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
        g.txt(fx(H2, 1) + ' kmol de H₂ consumidos', xr, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.txt('consumo ≈ ' + fx(Nm3porT, 0) + ' Nm³/t de carga', xr, 3.1, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
        g.txt('praticamente não há perda de líquido', xr, 2.4, { cor: 'ok', tam: 12, alin: 'esq', negrito: true });
        g.txt('investimento alto e hidrogênio caro —', xr, 1.7, { cor: 'suave', tam: 11, alin: 'esq' });
        g.txt('é o que a reforma catalítica ajuda a pagar', xr, 1.25, { cor: 'fraco', tam: 11, alin: 'esq' });
      }
      g.txt('balanço atômico em base 100 kmol de carbono · coque tratado como CH₀,₅', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — severidade do hidrotratamento ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Os últimos ppm de enxofre são os mais caros: a cinética de ordem 1,5 faz a curva achatar justamente onde a especificação exige chegar (exemplo 9.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Temperatura do reator', min: 300, max: 380, val: 340, passo: 1, un: '°C' },
      { id: 'LHSV', rot: 'LHSV', min: 0.3, max: 4, val: 1, passo: 0.1, un: 'h⁻¹' },
      { id: 'S0', rot: 'Enxofre na carga', min: 1000, max: 20000, val: 12000, passo: 500, un: 'ppm' }
    ],
    desenhar: function (g, p) {
      var T = p.T, LHSV = p.LHSV, S0 = p.S0, n = 1.5, R = 8.314, Ea = 1.2e5;
      var k0 = 0.614, T0 = 613.15;                 /* calibrado: 12 000 → 10 ppm a 340 °C e LHSV 1 */
      function kT(Tc) { return k0 * Math.exp(-Ea / R * (1 / (Tc + 273.15) - 1 / T0)); }
      function Ssai(Tc, L, Sin) {
        var a = Math.pow(Sin, 1 - n) + (n - 1) * kT(Tc) / L;
        return Math.pow(a, 1 / (1 - n));
      }
      var S = Ssai(T, LHSV, S0), spec = 10;
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (v) { return gx + gw * lim(v - 300, 0, 80) / 80; };
      var Y = function (v) { return gy + gh * (Math.log10(lim(v, 0.1, 20000)) + 1) / 5.3; };
      g.ret(gx, gy, gw, Y(spec) - gy, { preenche: 'ok', cor: null, alfa: 0.08 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(spec), gx + gw, Y(spec), { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('S-10: limite de 10 ppm', gx + 0.12, Y(spec) + 0.26, { cor: 'erro', tam: 10.5, alin: 'esq' });
      var i, j, lhs = [0.5, 1, 2, 4];
      lhs.forEach(function (L) {
        var pts = [];
        for (j = 0; j <= 80; j++) { var Tc = 300 + j; pts.push([X(Tc), Y(Ssai(Tc, L, S0))]); }
        g.caminho(pts, { cor: Math.abs(L - LHSV) < 0.05 ? 's1' : 'fraco', larg: Math.abs(L - LHSV) < 0.05 ? 2.8 : 1.2 });
        g.txt('LHSV ' + fx(L, 1), gx + gw * 0.17, Y(Ssai(300 + 80 * 0.17, L, S0)) + 0.28, { cor: 'fraco', tam: 9.5, fundo: true });
      });
      var cur = [];
      for (j = 0; j <= 80; j++) { var Tc2 = 300 + j; cur.push([X(Tc2), Y(Ssai(Tc2, LHSV, S0))]); }
      g.caminho(cur, { cor: 's1', larg: 2.8 });
      g.circ(X(T), Y(S), 0.16, { preenche: 'erro', cor: null });
      [300, 320, 340, 360, 380].forEach(function (v) {
        g.linha(X(v), gy, X(v), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(v + '', X(v), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [1, 10, 100, 1000, 10000].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v >= 1000 ? fx(v / 1000, 0) + 'k' : fx(v, 0), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('temperatura do reator (°C)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('S no produto (ppm, log)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6;
      g.txt('carga com ' + fx(S0 / 10000, 2) + ' % de S', xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('S no produto', xr, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var ok = S <= spec * 1.001;
      g.txt(S < 1 ? fx(S, 2) + ' ppm' : fx(S, 1) + ' ppm', xr, 3.6, { cor: ok ? 'ok' : 'erro', tam: 15.5, alin: 'esq', negrito: true });
      g.txt(ok ? 'dentro da especificação S-10' : 'fora da especificação',
        xr, 2.9, { cor: ok ? 'ok' : 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('remoção de ' + fx(100 * (1 - S / S0), 3) + ' %', xr, 2.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      var S10 = Ssai(T + 10, LHSV, S0);
      g.txt('+10 °C levaria a ' + (S10 < 1 ? fx(S10, 2) : fx(S10, 1)) + ' ppm', xr, 1.5, { cor: 'aviso', tam: 11.5, alin: 'esq' });
      g.txt('mas encurta a vida do catalisador', xr, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ordem 1,5 com energia de ativação de 120 kJ/mol · calibrado em 12 000 → 10 ppm a 340 °C', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — mistura de correntes ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Enxofre se mistura em proporção: não existe diluir para dentro da especificação. Uma única corrente alta estoura o pool inteiro — foi essa conta que obrigou a construir novas unidades de hidrotratamento (exemplo 10.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'fa', rot: 'Fração da corrente hidrotratada', min: 0, max: 100, val: 60, passo: 1, un: '%' },
      { id: 'Sa', rot: 'Enxofre da corrente hidrotratada', min: 1, max: 50, val: 8, passo: 1, un: 'ppm' },
      { id: 'Sb', rot: 'Enxofre da outra corrente', min: 20, max: 2000, val: 300, passo: 10, un: 'ppm' }
    ],
    desenhar: function (g, p) {
      var fa = p.fa / 100, Sa = p.Sa, Sb = p.Sb, spec = 10;
      var S = fa * Sa + (1 - fa) * Sb;
      var faNec = (spec - Sb) / (Sa - Sb);
      var gx = 1.3, gy = 0.9, gw = 5.4, gh = 4.1;
      var X = function (v) { return gx + gw * lim(v, 0, 1); };
      var Y = function (v) { return gy + gh * (Math.log10(lim(v, 1, 2000))) / Math.log10(2000); };
      g.ret(gx, gy, gw, Y(spec) - gy, { preenche: 'ok', cor: null, alfa: 0.08 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(spec), gx + gw, Y(spec), { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('limite 10 ppm', gx + 0.12, Y(spec) + 0.26, { cor: 'erro', tam: 10.5, alin: 'esq' });
      var i, pts = [];
      for (i = 0; i <= 100; i++) { var f = i / 100; pts.push([X(f), Y(f * Sa + (1 - f) * Sb)]); }
      g.caminho(pts, { cor: 's1', larg: 2.8 });
      g.circ(X(fa), Y(S), 0.16, { preenche: S <= spec ? 'ok' : 'erro', cor: null });
      g.linha(X(fa), gy, X(fa), Y(S), { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      if (faNec > 0 && faNec < 1) {
        g.linha(X(faNec), gy, X(faNec), Y(spec), { cor: 'aviso', larg: 1.2, tracejado: [4, 3] });
        g.txt(fx(100 * faNec, 1) + ' % para atender', X(faNec) - 0.12, Y(spec) - 0.4, { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        g.linha(X(f), gy, X(f), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(100 * f, 0) + ' %', X(f), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [10, 100, 1000].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 0), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('fração da corrente limpa no pool', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('S do pool (ppm, log)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4;
      g.txt(fx(p.fa, 0) + ' % a ' + fx(Sa, 0) + ' ppm', xr, 5.0, { cor: 'ok', tam: 12, alin: 'esq' });
      g.txt(fx(100 - p.fa, 0) + ' % a ' + fx(Sb, 0) + ' ppm', xr, 4.45, { cor: 'erro', tam: 12, alin: 'esq' });
      g.txt('pool com ' + fx(S, 1) + ' ppm', xr, 3.6, { cor: S <= spec ? 'ok' : 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt(S <= spec ? 'atende ao limite' : fx(S / spec, 1) + '× o limite', xr, 2.9,
        { cor: S <= spec ? 'ok' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(faNec >= 1 || faNec < 0 ? 'nenhuma mistura atende: é preciso tratar' :
        'só com ' + fx(100 * faNec, 1) + ' % da corrente limpa', xr, 2.2, { cor: 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('enxofre se mistura quase linearmente;', xr, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('octanagem e cetano, não — precisam de', xr, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('índices de mistura próprios', xr, 0.7, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('mistura em base mássica · a linha é reta, mas o eixo vertical é logarítmico', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 11.1 — recuperação de enxofre (Claus) ---------- */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Cada estágio do Claus converte uma parte do que sobrou: a recuperação sobe depressa e satura perto de 97 %. Chegar a 99,9 % exige uma unidade de tratamento de gás residual.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'n', rot: 'Estágios catalíticos', min: 0, max: 3, val: 2, passo: 1 },
      { id: 'tgt', rot: 'Tratamento de gás residual: 0 não · 1 sim', min: 0, max: 1, val: 0, passo: 1 },
      { id: 'S', rot: 'Enxofre na carga da refinaria', min: 10, max: 400, val: 120, passo: 10, un: 't/d' }
    ],
    desenhar: function (g, p) {
      var n = Math.round(p.n), tgt = Math.round(p.tgt), Sc = p.S;
      var etapas = [0.65, 0.70, 0.55, 0.40];       /* térmico e os três catalíticos */
      var rest = 1, rec = [], i;
      for (i = 0; i <= n; i++) { rest *= (1 - etapas[i]); rec.push(100 * (1 - rest)); }
      var total = tgt ? 99.9 : rec[rec.length - 1];
      var gx = 1.3, gy = 1.0, gw = 5.4, gh = 3.9;
      var Y = function (v) { return gy + gh * lim(v, 0, 100) / 100; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, Y(100), gx + gw, Y(100), { cor: 'borda', larg: 1, tracejado: [5, 4] });
      var nb = rec.length + (tgt ? 1 : 0), bw = gw / (nb + 1.2);
      for (i = 0; i < nb; i++) {
        var v = (tgt && i === nb - 1) ? 99.9 : rec[i];
        var xx = gx + bw * 0.6 + i * bw * 1.15;
        g.ret(xx, gy, bw, Y(v) - gy, { cor: 'fundo', larg: 1, preenche: i === 0 ? 's4' : (tgt && i === nb - 1) ? 'ok' : 's1', alfa: 0.7 });
        g.txt(fx(v, 2) + ' %', xx + bw / 2, Y(v) + 0.3, { cor: 'texto', tam: 11, negrito: true });
        g.txt(i === 0 ? 'térmico' : (tgt && i === nb - 1) ? 'TGT' : i + 'º cat.', xx + bw / 2, gy - 0.42, { cor: 'suave', tam: 10 });
      }
      [25, 50, 75, 100].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(v + '', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('recuperação acumulada (%)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var emitido = Sc * (100 - total) / 100;
      var xr = 7.4;
      g.txt('recuperação total', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(total, 2) + ' %', xr, 4.3, { cor: total > 99 ? 'ok' : 'aviso', tam: 16, alin: 'esq', negrito: true });
      g.txt('enxofre na carga ' + fx(Sc, 0) + ' t/dia', xr, 3.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('recuperado ' + fx(Sc * total / 100, 1) + ' t/dia', xr, 2.9, { cor: 's1', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('emitido como SO₂ ' + fx(emitido, 2) + ' t/dia', xr, 2.2, { cor: emitido > 2 ? 'erro' : 'ok', tam: 13, alin: 'esq', negrito: true });
      g.txt(tgt ? 'com TGT o gás residual é reciclado' : n >= 2 ? 'típico de refinaria sem TGT' : 'recuperação insuficiente',
        xr, 1.5, { cor: tgt ? 'ok' : n >= 2 ? 'aviso' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('o enxofre recuperado é vendido como produto', xr, 0.95, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('conversões por estágio típicas: 65 % no térmico, depois 70 %, 55 % e 40 % do que restou', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

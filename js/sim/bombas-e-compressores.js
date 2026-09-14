/* ============================================================
   Bombas e Compressores — simuladores
     1. sim-rotor       : rotor centrífugo animado, triângulos de velocidade
                          e equação de Euler
     2. sim-instalacao  : curva da bomba x curva do sistema, ponto de
                          operação, potência, NPSH e cavitação — com a
                          instalação animada
     3. sim-associacao  : associação série/paralelo e leis de semelhança
                          (rotação variável contra estrangulamento)
     4. sim-compressor  : compressor alternativo animado, diagrama p-V,
                          espaço nocivo e múltiplos estágios
     5. sim-turbina     : turbina hidráulica Pelton/Francis gerando
                          potência, com rotor animado

   Toda a hidráulica usa g = 9,81 m/s² e água a 20 °C
   (ρ = 998,2 kg/m³, p_v = 2,34 kPa) salvo indicação em contrário.
   ============================================================ */
(function () {
  'use strict';

  var G = 9.81;
  var RHO = 998.2;          /* kg/m³, água a 20 °C */
  var PATM = 101.325;       /* kPa ao nível do mar */
  var PV20 = 2.34;          /* kPa, pressão de vapor da água a 20 °C */

  var TAU = Math.PI * 2;

  function grau(r) { return r * 180 / Math.PI; }
  function rad(g) { return g * Math.PI / 180; }

  /* laço de animação único, compartilhado por todos os simuladores:
     cada modelo registra uma função de quadro e ela só faz algo quando
     aquele simulador está com a animação ligada */
  var quadros = [];
  function registrar(fn) { quadros.push(fn); }
  (function laco() {
    for (var i = 0; i < quadros.length; i++) {
      try { quadros[i](); } catch (e) { /* um modelo com erro não trava os outros */ }
    }
    requestAnimationFrame(laco);
  })();

  /* passo de tempo protegido contra saltos (aba em segundo plano) */
  function relogio() {
    return { t: 0, dt: function () {
      var agora = performance.now();
      var d = this.t ? (agora - this.t) / 1000 : 0.016;
      this.t = agora;
      return (d > 0.2 || d <= 0) ? 0.016 : d;
    } };
  }

  /* seta em coordenadas de pixel */
  function seta(c, x1, y1, x2, y2, cor, larg, cabeca) {
    var dx = x2 - x1, dy = y2 - y1;
    var L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1e-6) return;
    var ux = dx / L, uy = dy / L;
    var h = cabeca || Math.min(11, L * 0.34);
    c.strokeStyle = cor; c.fillStyle = cor;
    c.lineWidth = larg || 2;
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.75, y2 - uy * h * 0.75);
    c.stroke();
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.42, y2 - uy * h - ux * h * 0.42);
    c.lineTo(x2 - ux * h - uy * h * 0.42, y2 - uy * h + ux * h * 0.42);
    c.closePath(); c.fill();
  }

  function fonte(px, peso) {
    return (peso ? peso + ' ' : '') + px + 'px ' + Plot.cssVar('--font', 'sans-serif');
  }

  /* ============================================================
     1. Rotor centrífugo — equação de Euler
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-rotor')) return;

    var A = { on: true, vel: 1, ang: 0, rel: relogio(), ctx: null, p: null, r: null };

    /* traçado de uma pá: integra dθ = dr/(r·tan β) do olhal até a periferia */
    function pontosPa(R1, R2, b1, b2, fase) {
      var pts = [], n = 46;
      var th = fase;
      for (var i = 0; i <= n; i++) {
        var s = i / n;
        var r = R1 + (R2 - R1) * s;
        var b = rad(b1 + (b2 - b1) * s);
        if (i > 0) th -= ((R2 - R1) / n) / (r * Math.tan(b));
        pts.push([r * Math.cos(th), r * Math.sin(th)]);
      }
      return pts;
    }

    function desenharRotor(c, pl, p, r, ang) {
      var a = pl._area;
      var R2 = p.D2 / 2000, R1 = p.D1 / 2000;
      /* a voluta chega a 1,52 R2 e o bocal a 1,60 R2; sobra margem para as
         cotas. A escala sai da menor das duas dimensoes do quadro, senao o
         desenho estoura na vertical. */
      var esc = Math.min(a.w / (R2 * 4.3), a.h / (R2 * 4.0));
      var cx = a.x + a.w * 0.44, cy = a.y + a.h * 0.55;
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i;

      /* voluta em espiral, terminando no bocal de recalque */
      c.strokeStyle = borda; c.lineWidth = 2.4; c.setLineDash([]);
      c.beginPath();
      for (i = 0; i <= 150; i++) {
        var t = i / 150;
        var th = t * TAU * 0.97 - Math.PI / 2;
        var rv = (R2 * 1.10 + R2 * 0.42 * t) * esc;
        var X = cx + rv * Math.cos(th), Y = cy + rv * Math.sin(th);
        if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
      }
      c.stroke();
      var rf = R2 * 1.52 * esc;
      c.beginPath();
      c.moveTo(cx, cy - rf); c.lineTo(cx + rf * 1.05, cy - rf);
      c.moveTo(cx, cy - rf + R2 * 0.55 * esc); c.lineTo(cx + rf * 1.05, cy - rf + R2 * 0.55 * esc);
      c.stroke();
      c.fillStyle = faint; c.font = fonte(10.5);
      c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.fillText('recalque', cx + rf * 1.03, cy - rf - 4);

      /* disco do rotor */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.12;
      c.beginPath(); c.arc(cx, cy, R2 * esc, 0, TAU); c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 1.6;
      c.beginPath(); c.arc(cx, cy, R2 * esc, 0, TAU); c.stroke();
      c.strokeStyle = faint; c.lineWidth = 1.2; c.setLineDash([4, 4]);
      c.beginPath(); c.arc(cx, cy, R1 * esc, 0, TAU); c.stroke();
      c.setLineDash([]);

      /* pás */
      c.strokeStyle = Plot.serie(0); c.lineWidth = 3.4;
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (var k = 0; k < p.z; k++) {
        var pts = pontosPa(R1, R2, p.b1, p.b2, ang + k * TAU / p.z);
        c.beginPath();
        for (var j = 0; j < pts.length; j++) {
          var Xp = cx + pts[j][0] * esc, Yp = cy - pts[j][1] * esc;
          if (j === 0) c.moveTo(Xp, Yp); else c.lineTo(Xp, Yp);
        }
        c.stroke();
      }
      c.lineCap = 'butt';

      /* cubo */
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.beginPath(); c.arc(cx, cy, R1 * esc * 0.42, 0, TAU); c.fill();
      c.strokeStyle = Plot.cssVar('--text', '#111'); c.lineWidth = 1.6;
      c.beginPath(); c.arc(cx, cy, R1 * esc * 0.42, 0, TAU); c.stroke();

      /* partículas percorrendo os canais entre as pás */
      c.fillStyle = Plot.serie(3);
      for (var m = 0; m < p.z * 3; m++) {
        var canal = m % p.z;
        var s2 = (ang * 0.20 + m * 0.31) % 1;
        if (s2 < 0) s2 += 1;
        var pts2 = pontosPa(R1, R2, p.b1, p.b2, ang + canal * TAU / p.z + 0.5 * TAU / p.z);
        var q2 = pts2[Math.min(pts2.length - 1, Math.floor(s2 * (pts2.length - 1)))];
        c.globalAlpha = 0.30 + 0.60 * s2;
        c.beginPath();
        c.arc(cx + q2[0] * esc, cy - q2[1] * esc, 2.7, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;

      /* sentido de rotação */
      c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6); c.lineWidth = 2;
      var ra = R2 * esc * 1.34;
      c.beginPath(); c.arc(cx, cy, ra, rad(196), rad(252)); c.stroke();
      var af = rad(252);
      seta(c, cx + ra * Math.cos(af - 0.07), cy + ra * Math.sin(af - 0.07),
        cx + ra * Math.cos(af), cy + ra * Math.sin(af), Plot.serie(6), 2, 9);
      c.font = fonte(11, '600');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.n + ' rpm', cx - ra * 0.90, cy + ra * 0.72);

      /* sucção pelo olhal */
      seta(c, cx - R1 * esc * 2.6, cy, cx - R1 * esc * 1.05, cy, Plot.serie(2), 2.4, 10);
      c.fillStyle = Plot.serie(2); c.font = fonte(10.5, '600');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('sucção', cx - R1 * esc * 1.8, cy - 6);

      /* cotas */
      c.strokeStyle = faint; c.fillStyle = faint; c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R2 * esc * 0.96, cy - R2 * esc * 0.28); c.stroke();
      c.setLineDash([]);
      c.font = fonte(10.5);
      c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('D₂ = ' + p.D2 + ' mm', cx + R2 * esc * 0.42, cy - R2 * esc * 0.16);
      c.textBaseline = 'top';
      c.fillText('D₁ = ' + p.D1 + ' mm  ·  ' + p.z + ' pás  ·  β₂ = ' + p.b2 + '°',
        cx - R2 * esc * 1.6, cy + R2 * esc * 1.30);
    }

    /* triângulo de velocidades na saída */
    function desenharTriangulo(c, pl, r, p) {
      var a = pl._area;
      var faint = Plot.cssVar('--text-faint', '#999');
      /* c_m2 costuma ser menos de 10 % de u_2: em escala 1:1 o triangulo
         vira uma linha. Amplia-se so a vertical, e o fator vai escrito no
         desenho para ninguem medir o angulo com transferidor. */
      var escH = a.w * 0.56 / Math.max(Math.abs(r.u2), 1e-6);
      var escV = a.h * 0.44 / Math.max(r.cm2, 1e-6);
      var amp = Math.max(1, Math.min(escV / escH, 8));
      var esc = escH;
      var x0 = a.x + a.w * 0.19, y0 = a.y + a.h * 0.78;
      var xu = x0 + r.u2 * esc;
      var xv = x0 + r.cu2 * esc, yv = y0 - r.cm2 * esc * amp;

      c.strokeStyle = faint; c.lineWidth = 1.1; c.setLineDash([4, 3]);
      c.beginPath(); c.moveTo(xv, yv); c.lineTo(xv, y0); c.stroke();
      c.beginPath(); c.moveTo(x0, yv); c.lineTo(xv, yv); c.stroke();
      c.setLineDash([]);

      seta(c, x0, y0, xu, y0, Plot.serie(1), 2.6);      /* u2 */
      seta(c, x0, y0, xv, yv, Plot.serie(0), 2.6);      /* c2 */
      seta(c, xu, y0, xv, yv, Plot.serie(3), 2.6);      /* w2 */

      c.font = fonte(11.5, '600');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillStyle = Plot.serie(1);
      c.fillText('u₂ = ' + Plot.sig(r.u2, 3) + ' m/s', (x0 + xu) / 2, y0 + 7);
      c.fillStyle = Plot.serie(0);
      c.textBaseline = 'bottom'; c.textAlign = 'center';
      c.fillText('c₂ = ' + Plot.sig(r.c2, 3) + ' m/s', (x0 + xv) / 2, yv - 22);
      c.fillStyle = Plot.serie(3);
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('w₂ = ' + Plot.sig(r.w2, 3) + ' m/s', (xu + xv) / 2 + 12, (y0 + yv) / 2 + 16);
      c.fillStyle = faint;
      c.font = fonte(10.5);
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('c_m2 = ' + Plot.sig(r.cm2, 3) + ' m/s', xv + 9, (y0 + yv) / 2);
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('c_u2 = ' + Plot.sig(r.cu2, 3) + ' m/s — é ela que gera altura', (x0 + xv) / 2, yv - 7);

      c.fillStyle = Plot.cssVar('--text', '#111');
      c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Triângulo de velocidades na SAÍDA do rotor', a.x + 4, a.y + 2);
      c.font = fonte(10.5);
      c.fillStyle = faint;
      c.fillText('c⃗ = w⃗ + u⃗   ·   absoluta = relativa à pá + arrasto da pá   ·   β₂ = ' + p.b2 + '°' +
        (amp > 1.05 ? '   ·   escala vertical ampliada ' + Plot.sig(amp, 2) + '×' : ''),
        a.x + 4, a.y + 19);
    }

    Sim.build('#sim-rotor', {
      titulo: 'Rotor centrífugo — equação de Euler',
      descricao: 'A altura que a bomba gera nasce de uma coisa só: a velocidade tangencial que o rotor entrega ao líquido. Gire as pás, mude o ângulo de saída e veja o triângulo de velocidades reagir.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Bomba de processo (pás para trás)', desc: 'β₂ = 25°, o arranjo padrão: curva estável e caindo',
          valores: { n: 1750, D2: 250, D1: 100, b2: 25, b1: 20, larg: 20, Q: 90, z: 6, etaH: 82, animar: true, vel: 1 } },
        { nome: '2 · Pás radiais (β₂ = 90°)', desc: 'Altura teórica independente da vazão: u₂²/g',
          valores: { n: 1750, D2: 250, D1: 100, b2: 90, b1: 20, larg: 20, Q: 90, z: 6, etaH: 78, animar: true, vel: 1 } },
        { nome: '3 · Pás para a frente (β₂ = 140°)', desc: 'Curva crescente — instável, quase não se usa em bomba',
          valores: { n: 1750, D2: 250, D1: 100, b2: 140, b1: 20, larg: 20, Q: 90, z: 6, etaH: 70, animar: true, vel: 1 } },
        { nome: '4 · Dobrando a rotação', desc: 'H sobe com o quadrado: é a lei de semelhança aparecendo',
          valores: { n: 3500, D2: 250, D1: 100, b2: 25, b1: 20, larg: 20, Q: 180, z: 6, etaH: 82, animar: true, vel: 0.5 } },
        { nome: '5 · Poucas pás (z = 3)', desc: 'O escorregamento cresce e o desvio da Euler ideal fica evidente',
          valores: { n: 1750, D2: 250, D1: 100, b2: 25, b1: 20, larg: 20, Q: 90, z: 3, etaH: 78, animar: true, vel: 1 } },
        { nome: '6 · Rotor grande e lento', desc: 'Mesma altura com menos rotação: o que conta é u₂',
          valores: { n: 875, D2: 500, D1: 200, b2: 25, b1: 20, larg: 34, Q: 120, z: 7, etaH: 84, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'n', label: 'Rotação n', min: 200, max: 3600, step: 25, valor: 1750, unidade: 'rpm',
          desc: 'A altura cresce com o quadrado da rotação.' },
        { id: 'D2', label: 'Diâmetro externo D₂', min: 100, max: 600, step: 10, valor: 250, unidade: 'mm' },
        { id: 'D1', label: 'Diâmetro do olhal D₁', min: 40, max: 300, step: 10, valor: 100, unidade: 'mm' },
        { id: 'larg', label: 'Largura da pá b₂', min: 5, max: 60, step: 1, valor: 20, unidade: 'mm',
          desc: 'Controla a área de saída e, portanto, a velocidade meridional.' },
        { tipo: 'separador' },
        { id: 'b2', label: 'Ângulo da pá na saída β₂', min: 10, max: 160, step: 5, valor: 25, unidade: '°',
          desc: '< 90° para trás (padrão) · = 90° radial · > 90° para a frente' },
        { id: 'b1', label: 'Ângulo da pá na entrada β₁', min: 8, max: 60, step: 2, valor: 20, unidade: '°' },
        { id: 'z', label: 'Número de pás z', min: 2, max: 12, step: 1, valor: 6, unidade: '' },
        { tipo: 'separador' },
        { id: 'Q', label: 'Vazão Q', min: 5, max: 400, step: 5, valor: 90, unidade: 'm³/h' },
        { id: 'etaH', label: 'Rendimento hidráulico', min: 50, max: 92, step: 1, valor: 82, unidade: '%' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Girar o rotor', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.1, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'rotor', axes: false, height: 400, grid: false, legend: false },
        { id: 'tri', axes: false, height: 250, grid: false, legend: false },
        { id: 'curva', titulo: 'Altura teórica de Euler em função da vazão',
          xlabel: 'Vazão Q (m³/h)', ylabel: 'Altura H (m)', aspect: 0.38, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'u2', label: 'Velocidade da pá u₂' },
        { id: 'cm2', label: 'Vel. meridional c_m2' },
        { id: 'cu2', label: 'Componente útil c_u2' },
        { id: 'Hinf', label: 'H Euler (z → ∞)' },
        { id: 'Hz', label: 'H Euler (z pás)' },
        { id: 'H', label: 'H real' },
        { id: 'Pot', label: 'Potência de eixo' },
        { id: 'greac', label: 'Grau de reação' }
      ],
      formulas: [
        { g: 'Equação de Euler das turbomáquinas' },
        { tex: 'H_{\\infty} = \\frac{u_2 c_{u2} - u_1 c_{u1}}{g}',
          d: 'forma geral; sem pré-rotação na entrada (c_{u1} = 0) o segundo termo some', destaque: true },
        { tex: 'H_{\\infty} = \\frac{u_2\\,c_{u2}}{g}', d: 'entrada radial: TODA a altura vem da saída do rotor', destaque: true },

        { g: 'Cinemática do rotor' },
        { tex: 'u_2 = \\frac{\\pi D_2 n}{60}', d: 'velocidade tangencial da ponta da pá [m/s]', destaque: true },
        { tex: 'c_{m2} = \\frac{Q}{\\pi D_2 b_2}', d: 'velocidade meridional: vazão dividida pela área lateral de saída' },
        { tex: 'c_{u2} = u_2 - \\frac{c_{m2}}{\\tan\\beta_2}', d: 'sai direto do triângulo de velocidades', destaque: true },
        { tex: 'c_2 = \\sqrt{c_{u2}^{\\,2} + c_{m2}^{\\,2}} \\qquad w_2 = \\frac{c_{m2}}{\\sin\\beta_2}',
          d: 'velocidade absoluta e velocidade relativa à pá' },

        { g: 'Efeito do ângulo da pá' },
        { tex: 'H_{\\infty} = \\frac{u_2^{\\,2}}{g} - \\frac{u_2}{g\\,\\pi D_2 b_2 \\tan\\beta_2}\\,Q',
          d: 'reta em Q — o sinal do coeficiente angular é o sinal de tan β₂', destaque: true },
        { tex: '\\beta_2 < 90^\\circ \\;\\Rightarrow\\; \\text{curva decrescente}', d: 'pás para trás: estável, é o que se usa em bomba' },
        { tex: '\\beta_2 = 90^\\circ \\;\\Rightarrow\\; H_{\\infty} = u_2^{\\,2}/g', d: 'pás radiais: altura independe da vazão' },
        { tex: '\\beta_2 > 90^\\circ \\;\\Rightarrow\\; \\text{curva crescente}', d: 'pás para a frente: instável em bomba, comum no ventilador sirocco' },

        { g: 'Número finito de pás (escorregamento)' },
        { tex: '\\Delta c_{u2} = \\frac{\\pi\\,u_2 \\sin\\beta_2}{z}',
          d: 'correção de Stodola: o líquido não segue perfeitamente o contorno da pá', destaque: true },
        { tex: 'H_z = \\frac{u_2\\,(c_{u2\\infty} - \\Delta c_{u2})}{g}',
          d: 'altura de Euler com z pás — é uma perda de TROCA de energia, não de atrito' },

        { g: 'Altura real e potência' },
        { tex: 'H = \\eta_h\\,H_z', d: 'o rendimento hidráulico desconta atrito nos canais e choque na entrada', destaque: true },
        { tex: 'P_{\\text{eixo}} = \\frac{\\rho\\,g\\,Q\\,H}{\\eta_{\\text{total}}}', d: 'potência que o motor precisa entregar [W]' },
        { tex: '\\eta_{\\text{total}} = \\eta_h \\cdot \\eta_v \\cdot \\eta_m', d: 'hidráulico × volumétrico × mecânico' },
        { tex: '\\sigma_r = 1 - \\frac{c_{u2}}{2u_2}',
          d: 'grau de reação: parcela entregue já como pressão — o resto é energia cinética que a voluta converte' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'A equação de Euler vale para o rotor ideal, com infinitas pás infinitamente finas. O modelo aplica primeiro a correção de escorregamento de Stodola e depois o rendimento hidráulico: a distância entre as três alturas mostradas é exatamente o que separa a teoria da máquina real.',
      calcular: function (p, ctx) {
        var Q = p.Q / 3600;
        var D2 = p.D2 / 1000, b2 = p.larg / 1000;
        var u2 = Math.PI * D2 * p.n / 60;
        var A2 = Math.PI * D2 * b2;
        var cm2 = Q / A2;
        var b2r = rad(p.b2);
        var cu2i = u2 - cm2 / Math.tan(b2r);
        var dcu = Math.PI * u2 * Math.sin(b2r) / p.z;
        var cu2 = cu2i - dcu;
        var c2 = Math.sqrt(cu2 * cu2 + cm2 * cm2);
        var w2 = cm2 / Math.sin(b2r);
        var Hinf = u2 * cu2i / G;
        var Hz = u2 * cu2 / G;
        var H = p.etaH / 100 * Hz;
        var etaTot = p.etaH / 100 * 0.93;
        var Pot = RHO * G * Q * Math.max(H, 0) / etaTot;
        var sigmaR = 1 - cu2 / (2 * u2);

        var r = { u2: u2, cm2: cm2, cu2: cu2, c2: c2, w2: w2 };

        A.ctx = ctx; A.p = p; A.r = r;
        A.on = !!p.animar; A.vel = p.vel;
        desenhaRotor();

        var pt = ctx.plot('tri').clear();
        pt.setLimits([0, 1], [0, 1]);
        pt.custom(function (c, pl) { desenharTriangulo(c, pl, r, p); });
        pt.draw();

        var Qs = Plot.linspace(0, Math.max(p.Q * 2.2, 40), 60);
        function curva(beta) {
          var br = rad(beta);
          return Qs.map(function (q) {
            var cm = (q / 3600) / A2;
            var cu = u2 - cm / Math.tan(br) - Math.PI * u2 * Math.sin(br) / p.z;
            return u2 * cu / G;
          });
        }
        var gc = ctx.plot('curva').clear();
        gc.line(Qs, curva(p.b2), { color: Plot.serie(0), width: 2.8, label: 'β₂ = ' + p.b2 + '° (atual)' });
        if (Math.abs(p.b2 - 25) > 3) gc.line(Qs, curva(25), { color: Plot.serie(1), width: 1.5, dash: [5, 4], label: 'β₂ = 25° (para trás)' });
        if (Math.abs(p.b2 - 90) > 3) gc.line(Qs, curva(90), { color: Plot.serie(3), width: 1.5, dash: [5, 4], label: 'β₂ = 90° (radial)' });
        if (Math.abs(p.b2 - 140) > 3) gc.line(Qs, curva(140), { color: Plot.serie(5), width: 1.5, dash: [5, 4], label: 'β₂ = 140° (para a frente)' });
        gc.hline(u2 * u2 / G, { color: Plot.serie(7), width: 1.2, dash: [2, 4], text: 'u₂²/g = ' + Plot.sig(u2 * u2 / G, 4) + ' m' });
        gc.marker(p.Q, Hz, 'operação: H_z = ' + Plot.sig(Hz, 4) + ' m', { color: Plot.serie(6) });
        gc.draw();

        var nt = Plot.numTex, sig = Plot.sig;
        ctx.setPassos([
          { t: 'Velocidade tangencial na saída do rotor',
            tex: 'u_2 = \\frac{\\pi D_2 n}{60}',
            texSub: 'u_2 = \\frac{\\pi \\cdot ' + nt(D2) + ' \\cdot ' + p.n + '}{60} = ' + nt(u2) + '\\ \\mathrm{m/s}',
            obs: 'é a velocidade da ponta da pá — o teto de tudo que a bomba pode fazer' },
          { t: 'Área de saída e velocidade meridional',
            tex: 'c_{m2} = \\frac{Q}{\\pi D_2 b_2}',
            texSub: 'c_{m2} = \\frac{' + nt(Q) + '}{\\pi \\cdot ' + nt(D2) + ' \\cdot ' + nt(b2) + '} = ' + nt(cm2) + '\\ \\mathrm{m/s}',
            obs: 'Q = ' + p.Q + ' m³/h = ' + sig(Q, 4) + ' m³/s' },
          { t: 'Componente tangencial pelo triângulo (pá ideal)',
            tex: 'c_{u2\\infty} = u_2 - \\frac{c_{m2}}{\\tan\\beta_2}',
            texSub: 'c_{u2\\infty} = ' + nt(u2) + ' - \\frac{' + nt(cm2) + '}{\\tan ' + p.b2 + '^\\circ} = ' + nt(cu2i) + '\\ \\mathrm{m/s}',
            obs: p.b2 < 90 ? 'β₂ < 90°: o termo subtrai, e por isso a curva cai com a vazão'
              : (p.b2 > 90 ? 'β₂ > 90°: a tangente é negativa, o termo SOMA e a curva sobe'
                : 'β₂ = 90°: a tangente é infinita, o termo é nulo e H não depende de Q') },
          { t: 'Correção pelo número finito de pás (Stodola)',
            tex: '\\Delta c_{u2} = \\frac{\\pi u_2 \\sin\\beta_2}{z}',
            texSub: '\\Delta c_{u2} = \\frac{\\pi \\cdot ' + nt(u2) + ' \\cdot \\sin ' + p.b2 + '^\\circ}{' + p.z + '} = ' + nt(dcu) + '\\ \\mathrm{m/s}',
            obs: 'com z = ' + p.z + ' pás o líquido escorrega para trás: c_u2 real = ' + sig(cu2, 4) + ' m/s' },
          { t: 'Altura de Euler com z pás',
            tex: 'H_z = \\frac{u_2\\,c_{u2}}{g}',
            texSub: 'H_z = \\frac{' + nt(u2) + ' \\cdot ' + nt(cu2) + '}{9{,}81} = ' + nt(Hz) + '\\ \\mathrm{m}',
            obs: 'com infinitas pás daria ' + sig(Hinf, 4) + ' m — a diferença é só o escorregamento' },
          { t: 'Altura real',
            tex: 'H = \\eta_h H_z',
            texSub: 'H = ' + nt(p.etaH / 100) + ' \\cdot ' + nt(Hz) + ' = ' + nt(H) + '\\ \\mathrm{m}',
            obs: 'aqui entram atrito nos canais e choque na entrada das pás' },
          { t: 'Potência de eixo',
            tex: 'P = \\frac{\\rho g Q H}{\\eta_{\\text{total}}}',
            texSub: 'P = \\frac{998{,}2 \\cdot 9{,}81 \\cdot ' + nt(Q) + ' \\cdot ' + nt(H) + '}{' + nt(etaTot) + '} = ' + nt(Pot / 1000) + '\\ \\mathrm{kW}',
            obs: 'rendimento total ≈ ' + sig(etaTot * 100, 3) + ' % (hidráulico × volumétrico × mecânico)' }
        ]);

        return {
          u2: { v: u2, u: 'm/s' },
          cm2: { v: cm2, u: 'm/s' },
          cu2: { v: cu2, u: 'm/s' },
          Hinf: { v: Hinf, u: 'm' },
          Hz: { v: Hz, u: 'm' },
          H: { v: H, u: 'm', classe: 'destaque' },
          Pot: { v: Pot / 1000, u: 'kW' },
          greac: { v: sigmaR, u: '' }
        };
      }
    });

    function desenhaRotor() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('rotor');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharRotor(c, plot, A.p, A.r, A.ang); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx) return;
      var dt = A.rel.dt();
      /* gira na rotação real, reduzida por um fator para o olho acompanhar */
      A.ang -= TAU * (A.p.n / 60) * dt * 0.035 * A.vel;
      if (A.ang < -TAU * 1e4) A.ang += TAU * 1e4;
      desenhaRotor();
    });
  })();

  /* ============================================================
     2. Instalação de recalque — ponto de operação, NPSH e cavitação
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-instalacao')) return;

    var A = { on: true, fase: 0, rel: relogio(), ctx: null, p: null, r: null };

    /* desenha a instalação: reservatório de sucção, bomba, tubo de recalque
       e reservatório superior, com partículas escoando na velocidade do
       ponto de operação */
    function desenharInstalacao(c, pl, p, r, fase) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var agua = Plot.serie(0);

      /* escala vertical: Δz + folga */
      var zTopo = Math.max(p.dz, 1) * 1.30;
      var zMin = Math.min(p.zs, 0) - Math.max(zTopo * 0.10, 1);
      var yDe = function (z) {
        return a.y + a.h - (z - zMin) / (zTopo - zMin) * (a.h - 26) - 14;
      };
      var xSuc = a.x + a.w * 0.13;
      var xBomba = a.x + a.w * 0.40;
      var xRec = a.x + a.w * 0.72;
      var yBomba = yDe(0);

      /* reservatório inferior */
      var yNS = yDe(p.zs);
      var largR = a.w * 0.20;
      c.strokeStyle = borda; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(xSuc - largR / 2, yNS - 26);
      c.lineTo(xSuc - largR / 2, yDe(p.zs) + 46);
      c.lineTo(xSuc + largR / 2, yDe(p.zs) + 46);
      c.lineTo(xSuc + largR / 2, yNS - 26);
      c.stroke();
      c.fillStyle = agua; c.globalAlpha = 0.28;
      c.fillRect(xSuc - largR / 2 + 1, yNS, largR - 2, yDe(p.zs) + 46 - yNS);
      c.globalAlpha = 1;
      c.strokeStyle = agua; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(xSuc - largR / 2, yNS); c.lineTo(xSuc + largR / 2, yNS); c.stroke();

      /* reservatório superior, na cota de descarga */
      var yND = yDe(p.dz);
      c.strokeStyle = borda; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(xRec - largR / 2, yND - 30);
      c.lineTo(xRec - largR / 2, yND + 42);
      c.lineTo(xRec + largR / 2, yND + 42);
      c.lineTo(xRec + largR / 2, yND - 30);
      c.stroke();
      c.fillStyle = agua; c.globalAlpha = 0.28;
      c.fillRect(xRec - largR / 2 + 1, yND, largR - 2, 42);
      c.globalAlpha = 1;
      c.strokeStyle = agua; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(xRec - largR / 2, yND); c.lineTo(xRec + largR / 2, yND); c.stroke();

      /* tubulação: sucção (horizontal e subida) e recalque */
      var esp = 9;
      var caminho = [
        [xSuc, yNS + 18], [xSuc, yBomba], [xBomba - 22, yBomba],
        [xBomba + 22, yBomba], [xRec, yBomba], [xRec, yND - 12]
      ];
      c.strokeStyle = cor; c.lineWidth = esp; c.lineCap = 'round'; c.lineJoin = 'round';
      c.globalAlpha = 0.22;
      c.beginPath();
      c.moveTo(caminho[0][0], caminho[0][1]);
      for (var i = 1; i < caminho.length; i++) c.lineTo(caminho[i][0], caminho[i][1]);
      c.stroke();
      c.globalAlpha = 1;
      c.lineCap = 'butt';

      /* partículas de água percorrendo a tubulação, na velocidade do escoamento */
      if (r && r.Q > 0) {
        var segs = [], tot = 0, k;
        for (k = 1; k < caminho.length; k++) {
          var L = Math.hypot(caminho[k][0] - caminho[k - 1][0], caminho[k][1] - caminho[k - 1][1]);
          segs.push({ a: caminho[k - 1], b: caminho[k], L: L, s0: tot });
          tot += L;
        }
        c.fillStyle = agua;
        var nPart = 26;
        for (var m = 0; m < nPart; m++) {
          var s = ((fase + m / nPart) % 1) * tot;
          for (k = 0; k < segs.length; k++) {
            if (s >= segs[k].s0 && s <= segs[k].s0 + segs[k].L) {
              var u = (s - segs[k].s0) / segs[k].L;
              var X = segs[k].a[0] + (segs[k].b[0] - segs[k].a[0]) * u;
              var Y = segs[k].a[1] + (segs[k].b[1] - segs[k].a[1]) * u;
              c.globalAlpha = 0.85;
              c.beginPath(); c.arc(X, Y, 3.1, 0, TAU); c.fill();
              break;
            }
          }
        }
        c.globalAlpha = 1;
      }

      /* jato caindo no reservatório superior */
      if (r && r.Q > 0) {
        c.strokeStyle = agua; c.lineWidth = 2.2; c.globalAlpha = 0.7;
        c.beginPath(); c.moveTo(xRec, yND - 12); c.lineTo(xRec, yND); c.stroke();
        c.globalAlpha = 1;
      }

      /* bomba: círculo com voluta e rotor girando */
      var Rb = 21;
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.beginPath(); c.arc(xBomba, yBomba, Rb, 0, TAU); c.fill();
      c.strokeStyle = r && r.cavita ? Plot.serie(5) : Plot.serie(2);
      c.lineWidth = 2.6;
      c.beginPath(); c.arc(xBomba, yBomba, Rb, 0, TAU); c.stroke();
      c.strokeStyle = r && r.cavita ? Plot.serie(5) : Plot.serie(2);
      c.lineWidth = 2.4; c.lineCap = 'round';
      for (var b = 0; b < 5; b++) {
        var th = fase * TAU * 6 + b * TAU / 5;
        c.beginPath();
        c.moveTo(xBomba + Rb * 0.22 * Math.cos(th), yBomba + Rb * 0.22 * Math.sin(th));
        c.lineTo(xBomba + Rb * 0.78 * Math.cos(th + 0.55), yBomba + Rb * 0.78 * Math.sin(th + 0.55));
        c.stroke();
      }
      c.lineCap = 'butt';
      c.fillStyle = cor; c.font = fonte(11, '600');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('BOMBA', xBomba, yBomba + Rb + 6);

      /* bolhas de cavitação na entrada da bomba */
      if (r && r.cavita) {
        c.fillStyle = Plot.serie(5);
        for (var v = 0; v < 9; v++) {
          var ph = (fase * 2.4 + v * 0.37) % 1;
          c.globalAlpha = 0.75 * (1 - ph);
          c.beginPath();
          c.arc(xBomba - Rb - 16 + ph * 22, yBomba - 5 + Math.sin(v * 2.1 + fase * 12) * 6,
            1.4 + ph * 3.0, 0, TAU);
          c.fill();
        }
        c.globalAlpha = 1;
        c.fillStyle = Plot.serie(5); c.font = fonte(11, '700');
        c.textAlign = 'right'; c.textBaseline = 'bottom';
        c.fillText('CAVITAÇÃO', xBomba - Rb - 6, yBomba - 16);
      }

      /* cota de altura geométrica */
      var xc = a.x + a.w * 0.945;
      c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6); c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(xc, yNS); c.lineTo(xc, yND); c.stroke();
      seta(c, xc, yNS - 1, xc, yND, Plot.serie(6), 1.6, 8);
      seta(c, xc, yND + 1, xc, yNS, Plot.serie(6), 1.6, 8);
      c.setLineDash([3, 3]); c.lineWidth = 1; c.strokeStyle = faint;
      c.beginPath(); c.moveTo(xSuc, yNS); c.lineTo(xc, yNS); c.stroke();
      c.beginPath(); c.moveTo(xRec, yND); c.lineTo(xc, yND); c.stroke();
      c.setLineDash([]);
      c.save();
      c.translate(xc - 7, (yNS + yND) / 2);
      c.rotate(-Math.PI / 2);
      c.fillStyle = Plot.serie(6); c.font = fonte(11.5, '700');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('Δz = ' + Plot.sig(p.dz - p.zs, 3) + ' m', 0, 0);
      c.restore();

      /* nível de referência da sucção */
      c.fillStyle = faint; c.font = fonte(10);
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText(p.zs >= 0 ? 'sucção afogada (z_s = +' + p.zs + ' m)'
                           : 'sucção negativa (z_s = ' + p.zs + ' m)', xSuc, yNS - 8);

      /* faixa de dados */
      c.fillStyle = cor; c.font = fonte(11.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      if (r) {
        c.fillText('Q = ' + Plot.sig(r.Q * 3600, 4) + ' m³/h   ·   H = ' + Plot.sig(r.H, 4) +
          ' m   ·   v = ' + Plot.sig(r.v, 3) + ' m/s   ·   P = ' + Plot.sig(r.Pot, 3) + ' kW',
          a.x + 4, a.y + 2);
      }
    }

    Sim.build('#sim-instalacao', {
      titulo: 'Instalação de recalque — ponto de operação e cavitação',
      descricao: 'A bomba não escolhe a vazão: ela é imposta pelo cruzamento da curva da bomba com a curva do sistema. Mexa na instalação e veja o ponto de operação caminhar — e a bomba cavitar quando a sucção fica exigente demais.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Recalque predial típico', desc: 'Sucção afogada, bomba longe da cavitação',
          valores: { H0: 45, Qbep: 30, Hbep: 36, dz: 22, zs: 1.5, Lsuc: 6, Lrec: 45, D: 65, K: 6, etaMax: 72, Ts: 20, animar: true } },
        { nome: '2 · Sucção negativa de 4 m', desc: 'NPSH disponível despenca — margem no limite',
          valores: { H0: 45, Qbep: 30, Hbep: 36, dz: 22, zs: -4, Lsuc: 12, Lrec: 45, D: 65, K: 6, etaMax: 72, Ts: 20, animar: true } },
        { nome: '3 · Cavitando', desc: 'Sucção negativa profunda com tubo estreito: bolhas na entrada do rotor',
          valores: { H0: 45, Qbep: 30, Hbep: 36, dz: 22, zs: -6.5, Lsuc: 20, Lrec: 45, D: 50, K: 10, etaMax: 72, Ts: 20, animar: true } },
        { nome: '4 · Água quente a 70 °C', desc: 'A pressão de vapor sobe e come a margem de NPSH',
          valores: { H0: 45, Qbep: 30, Hbep: 36, dz: 22, zs: -2, Lsuc: 10, Lrec: 45, D: 65, K: 6, etaMax: 72, Ts: 70, animar: true } },
        { nome: '5 · Tubulação estrangulada', desc: 'Fecha-se a válvula: o ponto sobe pela curva e a vazão cai',
          valores: { H0: 45, Qbep: 30, Hbep: 36, dz: 22, zs: 1.5, Lsuc: 6, Lrec: 45, D: 65, K: 60, etaMax: 72, Ts: 20, animar: true } },
        { nome: '6 · Só desnível, quase sem perda', desc: 'Curva do sistema praticamente horizontal',
          valores: { H0: 45, Qbep: 30, Hbep: 36, dz: 34, zs: 2, Lsuc: 4, Lrec: 12, D: 100, K: 3, etaMax: 72, Ts: 20, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Curva da bomba (catálogo)' },
        { id: 'H0', label: 'Altura de shutoff H₀', min: 10, max: 120, step: 1, valor: 45, unidade: 'm',
          desc: 'Altura com a válvula totalmente fechada, vazão nula.' },
        { id: 'Qbep', label: 'Vazão de melhor rendimento', min: 5, max: 200, step: 1, valor: 30, unidade: 'm³/h' },
        { id: 'Hbep', label: 'Altura nesse ponto', min: 5, max: 110, step: 1, valor: 36, unidade: 'm' },
        { id: 'etaMax', label: 'Rendimento máximo', min: 40, max: 88, step: 1, valor: 72, unidade: '%' },
        { tipo: 'titulo', label: 'Instalação' },
        { id: 'dz', label: 'Cota do reservatório superior', min: 2, max: 80, step: 1, valor: 22, unidade: 'm' },
        { id: 'zs', label: 'Cota do nível de sucção z_s', min: -8, max: 6, step: 0.5, valor: 1.5, unidade: 'm',
          desc: 'Positivo = bomba afogada. Negativo = bomba acima do nível, o caso perigoso.' },
        { id: 'Lsuc', label: 'Comprimento da sucção', min: 1, max: 40, step: 1, valor: 6, unidade: 'm' },
        { id: 'Lrec', label: 'Comprimento do recalque', min: 5, max: 300, step: 5, valor: 45, unidade: 'm' },
        { id: 'D', label: 'Diâmetro da tubulação', min: 25, max: 200, step: 5, valor: 65, unidade: 'mm' },
        { id: 'K', label: 'ΣK dos acessórios', min: 1, max: 120, step: 1, valor: 6, unidade: '',
          desc: 'Válvulas, curvas e entradas. Estrangular a válvula é aumentar este número.' },
        { id: 'Ts', label: 'Temperatura da água', min: 10, max: 90, step: 5, valor: 20, unidade: '°C',
          desc: 'Água quente tem pressão de vapor alta e cavita muito mais fácil.' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar a instalação', valor: true }
      ],
      graficos: [
        { id: 'inst', axes: false, height: 380, grid: false, legend: false },
        { id: 'curvas', titulo: 'Curva da bomba × curva do sistema',
          xlabel: 'Vazão Q (m³/h)', ylabel: 'Altura H (m)', aspect: 0.42, legendPos: 'topright' },
        { id: 'npsh', titulo: 'NPSH disponível × NPSH requerido',
          xlabel: 'Vazão Q (m³/h)', ylabel: 'NPSH (m)', aspect: 0.34, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'Q', label: 'Vazão de operação' },
        { id: 'H', label: 'Altura manométrica' },
        { id: 'v', label: 'Velocidade na tubulação' },
        { id: 'eta', label: 'Rendimento no ponto' },
        { id: 'Pot', label: 'Potência de eixo' },
        { id: 'npshd', label: 'NPSH disponível' },
        { id: 'npshr', label: 'NPSH requerido' },
        { id: 'diag', label: 'Diagnóstico' }
      ],
      formulas: [
        { g: 'Altura manométrica do sistema' },
        { tex: 'H_{\\text{sis}} = \\Delta z + \\frac{\\Delta p}{\\rho g} + h_f + h_m',
          d: 'o que a bomba precisa vencer: desnível, pressão, perda distribuída e localizada', destaque: true },
        { tex: 'H_{\\text{sis}} = \\Delta z + \\left(f\\frac{L}{D} + \\sum K\\right)\\frac{v^2}{2g}',
          d: 'com reservatórios abertos: uma parcela fixa e uma que cresce com Q²', destaque: true },
        { tex: 'H_{\\text{sis}} \\approx \\Delta z + C\\,Q^2', d: 'forma prática: parábola de vértice em Δz' },

        { g: 'Ponto de operação' },
        { tex: 'H_{\\text{bomba}}(Q) = H_{\\text{sis}}(Q)', d: 'a vazão é o CRUZAMENTO das duas curvas — a bomba não escolhe', destaque: true },
        { tex: 'H_{\\text{bomba}} = H_0 - a\\,Q^2', d: 'curva de catálogo aproximada por parábola descendente' },
        { tex: 'Q_{\\text{op}} = \\sqrt{\\dfrac{H_0 - \\Delta z}{a + C}}', d: 'solução explícita quando as duas são parábolas', destaque: true },

        { g: 'Potência' },
        { tex: 'P_{\\text{hidráulica}} = \\rho\\,g\\,Q\\,H', d: 'potência entregue ao líquido [W]' },
        { tex: 'P_{\\text{eixo}} = \\frac{\\rho\\,g\\,Q\\,H}{\\eta}', d: 'potência no eixo da bomba', destaque: true },
        { tex: 'P_{\\text{motor}} \\ge 1{,}15\\,P_{\\text{eixo}}', d: 'folga usual de seleção do motor elétrico' },

        { g: 'NPSH e cavitação' },
        { tex: '\\mathrm{NPSH}_{\\text{disp}} = \\frac{p_{\\text{atm}} - p_v}{\\rho g} + z_s - h_{f,\\text{succ}}',
          d: 'energia disponível na entrada da bomba ACIMA da pressão de vapor', destaque: true },
        { tex: '\\mathrm{NPSH}_{\\text{disp}} > \\mathrm{NPSH}_{\\text{req}} + 0{,}5\\ \\mathrm{m}',
          d: 'critério de projeto: margem mínima de segurança', destaque: true },
        { tex: '\\mathrm{NPSH}_{\\text{disp}} < \\mathrm{NPSH}_{\\text{req}} \\;\\Rightarrow\\; \\text{CAVITA}',
          d: 'bolhas de vapor se formam e implodem no rotor: ruído, vibração e erosão' },
        { tex: 'p_v(T)\\ \\uparrow \\;\\Rightarrow\\; \\mathrm{NPSH}_{\\text{disp}}\\ \\downarrow',
          d: 'por isso água quente exige bomba afogada' },

        { g: 'Rendimento' },
        { tex: '\\eta(Q) = \\eta_{\\text{max}}\\left[2\\frac{Q}{Q_{\\text{bep}}} - \\left(\\frac{Q}{Q_{\\text{bep}}}\\right)^{2}\\right]',
          d: 'parábola com máximo no ponto de melhor rendimento (BEP)' },
        { tex: '0{,}7\\,Q_{\\text{bep}} \\le Q \\le 1{,}2\\,Q_{\\text{bep}}',
          d: 'faixa recomendada de operação — fora dela há recirculação e desgaste' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'O NPSH requerido é dado pelo fabricante; aqui ele é estimado por uma parábola típica calibrada no ponto de melhor rendimento. Em projeto real, use sempre a curva do catálogo da bomba escolhida.',
      calcular: function (p, ctx) {
        /* pressão de vapor da água pela equação de Antoine (kPa) */
        function pvap(T) {
          return Math.pow(10, 8.07131 - 1730.63 / (233.426 + T)) * 0.133322;
        }
        /* densidade e viscosidade cinemática aproximadas da água */
        function rhoAgua(T) { return 1000.6 - 0.0616 * T - 0.00385 * T * T; }
        function nuAgua(T) { return 1.79e-6 / (1 + 0.0337 * T + 0.000221 * T * T); }

        var rho = rhoAgua(p.Ts), nu = nuAgua(p.Ts), pv = pvap(p.Ts);
        var D = p.D / 1000, Aa = Math.PI * D * D / 4;
        var Ltot = p.Lsuc + p.Lrec;
        var dzTotal = p.dz - p.zs;

        /* fator de atrito de Swamee-Jain, aço comercial */
        var eps = 4.6e-5;
        function fatorAtrito(Re) {
          if (Re < 2300) return Re > 0 ? 64 / Re : 0.05;
          var t = Math.log10(eps / (3.7 * D) + 5.74 / Math.pow(Re, 0.9));
          return 0.25 / (t * t);
        }
        /* perda total da instalação para uma vazão em m³/s */
        function perda(Qs, L, Ksum) {
          if (Qs <= 0) return 0;
          var v = Qs / Aa;
          var f = fatorAtrito(v * D / nu);
          return (f * L / D + Ksum) * v * v / (2 * G);
        }
        function Hsis(Qh) { return dzTotal + perda(Qh / 3600, Ltot, p.K); }

        /* curva da bomba: H0 no shutoff, passando pelo BEP */
        var aB = (p.H0 - p.Hbep) / (p.Qbep * p.Qbep);
        function Hbomba(Qh) { return p.H0 - aB * Qh * Qh; }

        /* ponto de operação por bissecção */
        var q1 = 0, q2 = p.Qbep * 3;
        if (Hbomba(0) <= Hsis(0)) { q2 = 0; }
        for (var it = 0; it < 80; it++) {
          var qm = (q1 + q2) / 2;
          if (Hbomba(qm) > Hsis(qm)) q1 = qm; else q2 = qm;
        }
        var Qop = (q1 + q2) / 2;
        var Hop = Hsis(Qop);
        var Qs = Qop / 3600;
        var v = Qs / Aa;
        var Re = v * D / nu;
        var eta = p.etaMax / 100 * (2 * (Qop / p.Qbep) - Math.pow(Qop / p.Qbep, 2));
        eta = Math.max(eta, 0.05);
        var Pot = rho * G * Qs * Math.max(Hop, 0) / eta / 1000;

        /* NPSH */
        var hfSuc = perda(Qs, p.Lsuc, p.K * 0.35);
        var npshd = (PATM - pv) * 1000 / (rho * G) + p.zs - hfSuc;
        /* NPSH requerido: parábola típica, ≈ 12 % da altura do BEP na vazão nominal */
        var cR = 0.12 * p.Hbep / (p.Qbep * p.Qbep);
        var npshr = cR * Qop * Qop + 0.6;
        var margem = npshd - npshr;
        var cavita = margem < 0;

        var r = { Q: Qs, H: Hop, v: v, Pot: Pot, cavita: cavita };
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenhaInst();

        /* ---- curvas ---- */
        var Qg = Plot.linspace(0, Math.max(p.Qbep * 2.2, Qop * 1.5), 90);
        var gc = ctx.plot('curvas').clear();
        gc.line(Qg, Qg.map(Hbomba), { color: Plot.serie(0), width: 2.8, label: 'Curva da bomba' });
        gc.line(Qg, Qg.map(Hsis), { color: Plot.serie(1), width: 2.4, label: 'Curva do sistema' });
        gc.line(Qg, Qg.map(function () { return dzTotal; }),
          { color: Plot.serie(2), width: 1.4, dash: [5, 4], label: 'Δz (parcela estática)' });
        gc.line(Qg, Qg.map(function (q) {
          return p.etaMax / 100 * (2 * (q / p.Qbep) - Math.pow(q / p.Qbep, 2)) * p.H0;
        }), { color: Plot.serie(4), width: 1.4, dash: [2, 3], label: 'Rendimento (escala relativa)' });
        gc.marker(Qop, Hop, 'operação: ' + Plot.sig(Qop, 4) + ' m³/h · ' + Plot.sig(Hop, 4) + ' m',
          { color: Plot.serie(6) });
        gc.vline(p.Qbep, { color: Plot.serie(4), dash: [3, 3], width: 1.2, text: 'BEP' });
        gc.draw();

        /* ---- NPSH ---- */
        var gn = ctx.plot('npsh').clear();
        gn.line(Qg, Qg.map(function (q) {
          return (PATM - pv) * 1000 / (rho * G) + p.zs - perda(q / 3600, p.Lsuc, p.K * 0.35);
        }), { color: Plot.serie(0), width: 2.6, label: 'NPSH disponível' });
        gn.line(Qg, Qg.map(function (q) { return cR * q * q + 0.6; }),
          { color: Plot.serie(5), width: 2.6, label: 'NPSH requerido' });
        gn.line(Qg, Qg.map(function (q) { return cR * q * q + 1.1; }),
          { color: Plot.serie(5), width: 1.2, dash: [4, 3], label: 'requerido + margem 0,5 m' });
        gn.marker(Qop, npshd, (cavita ? 'CAVITA' : 'margem ') + (cavita ? '' : Plot.sig(margem, 3) + ' m'),
          { color: cavita ? Plot.serie(5) : Plot.serie(6) });
        gn.draw();

        /* ---- passo a passo ---- */
        var nt = Plot.numTex, sig = Plot.sig;
        var f = fatorAtrito(Re);
        ctx.setPassos([
          { t: 'Curva da bomba a partir do catálogo',
            tex: 'H_{\\text{bomba}} = H_0 - a\\,Q^2 \\quad\\text{com}\\quad a = \\frac{H_0 - H_{\\text{bep}}}{Q_{\\text{bep}}^2}',
            texSub: 'a = \\frac{' + p.H0 + ' - ' + p.Hbep + '}{' + p.Qbep + '^2} = ' + nt(aB) +
              ' \\;\\Rightarrow\\; H_{bomba} = ' + p.H0 + ' - ' + nt(aB) + '\\,Q^2',
            obs: 'dois pontos de catálogo bastam para a parábola: shutoff e melhor rendimento' },
          { t: 'Curva do sistema',
            tex: 'H_{\\text{sis}} = \\Delta z + \\left(f\\frac{L}{D} + \\sum K\\right)\\frac{v^2}{2g}',
            texSub: 'H_{\\text{sis}} = ' + nt(dzTotal) + ' + \\left(' + nt(f) + '\\cdot\\frac{' + Ltot + '}{' +
              nt(D) + '} + ' + p.K + '\\right)\\frac{v^2}{2g}',
            obs: 'Δz = ' + p.dz + ' − (' + p.zs + ') = ' + sig(dzTotal, 4) + ' m; L total = ' + Ltot + ' m' },
          { t: 'Ponto de operação: as duas curvas se cruzam',
            tex: 'H_{\\text{bomba}}(Q_{\\text{op}}) = H_{\\text{sis}}(Q_{\\text{op}})',
            texSub: 'Q_{\\text{op}} = ' + nt(Qop) + '\\ \\mathrm{m^3/h} \\qquad H_{op} = ' + nt(Hop) + '\\ \\mathrm{m}',
            obs: 'resolvido numericamente porque f depende de Re, que depende de Q' },
          { t: 'Velocidade e regime',
            tex: 'v = \\frac{Q}{A} \\qquad Re = \\frac{vD}{\\nu}',
            texSub: 'v = \\frac{' + nt(Qs) + '}{' + nt(Aa) + '} = ' + nt(v) + '\\ \\mathrm{m/s} \\qquad Re = ' + nt(Re),
            obs: v > 3 ? 'acima de 3 m/s: velocidade alta, perde muita carga e faz ruído'
              : (v < 0.6 ? 'abaixo de 0,6 m/s: baixa, favorece sedimentação' : 'faixa usual de projeto: 1 a 3 m/s') },
          { t: 'Rendimento no ponto de operação',
            tex: '\\eta = \\eta_{\\text{max}}\\left[2\\frac{Q}{Q_{\\text{bep}}} - \\left(\\frac{Q}{Q_{\\text{bep}}}\\right)^2\\right]',
            texSub: '\\eta = ' + nt(p.etaMax / 100) + '\\left[2\\cdot' + nt(Qop / p.Qbep) + ' - ' +
              nt(Math.pow(Qop / p.Qbep, 2)) + '\\right] = ' + nt(eta),
            obs: 'Q/Q_bep = ' + sig(Qop / p.Qbep, 3) +
              (Math.abs(Qop / p.Qbep - 1) > 0.3 ? ' — longe do BEP, rendimento penalizado' : ' — dentro da faixa recomendada') },
          { t: 'Potência de eixo',
            tex: 'P = \\frac{\\rho g Q H}{\\eta}',
            texSub: 'P = \\frac{' + nt(rho) + ' \\cdot 9{,}81 \\cdot ' + nt(Qs) + ' \\cdot ' + nt(Hop) +
              '}{' + nt(eta) + '} = ' + nt(Pot) + '\\ \\mathrm{kW}',
            obs: 'motor comercial imediatamente acima de ' + sig(Pot * 1.15, 3) + ' kW' },
          { t: 'NPSH disponível na entrada da bomba',
            tex: '\\mathrm{NPSH}_{\\text{disp}} = \\frac{p_{\\text{atm}} - p_v}{\\rho g} + z_s - h_{f,\\text{succ}}',
            texSub: '\\mathrm{NPSH}_{\\text{disp}} = \\frac{(' + nt(PATM) + ' - ' + nt(pv) + ')\\cdot 10^3}{' + nt(rho) +
              ' \\cdot 9{,}81} + (' + p.zs + ') - ' + nt(hfSuc) + ' = ' + nt(npshd) + '\\ \\mathrm{m}',
            obs: 'a ' + p.Ts + ' °C a pressão de vapor da água é ' + sig(pv, 3) + ' kPa' },
          { t: 'Verificação da cavitação',
            tex: '\\mathrm{NPSH}_{\\text{disp}} > \\mathrm{NPSH}_{\\text{req}} + 0{,}5\\ \\mathrm{m}\\ ?',
            texSub: nt(npshd) + ' \\;' + (margem > 0.5 ? '>' : '<') + '\\; ' + nt(npshr) +
              ' + 0{,}5 \\quad\\Rightarrow\\quad \\text{margem} = ' + nt(margem) + '\\ \\mathrm{m}',
            obs: cavita ? 'CAVITA: baixe a bomba, encurte a sucção ou aumente o diâmetro'
              : (margem < 0.5 ? 'margem insuficiente — projeto no limite' : 'margem adequada') }
        ]);

        var diag = cavita ? 'CAVITA' : (margem < 0.5 ? 'margem baixa' : 'seguro');
        return {
          Q: { v: Qop, u: 'm³/h', classe: 'destaque' },
          H: { v: Hop, u: 'm' },
          v: { v: v, u: 'm/s', classe: (v > 3 || v < 0.6) ? 'alerta' : '' },
          eta: { v: eta * 100, u: '%' },
          Pot: { v: Pot, u: 'kW' },
          npshd: { v: npshd, u: 'm' },
          npshr: { v: npshr, u: 'm' },
          diag: { v: diag, u: '', classe: cavita ? 'perigo' : (margem < 0.5 ? 'alerta' : 'ok') }
        };
      }
    });

    function desenhaInst() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('inst');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharInstalacao(c, plot, A.p, A.r, A.fase); });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.r) return;
      var dt = A.rel.dt();
      A.fase = (A.fase + dt * Math.min(A.r.v * 0.09, 0.6)) % 1;
      desenhaInst();
    });
  })();

  /* ============================================================
     3. Associação de bombas e leis de semelhança
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-associacao')) return;

    Sim.build('#sim-associacao', {
      titulo: 'Associação de bombas e leis de semelhança',
      descricao: 'Duas bombas em paralelo não dobram a vazão, e duas em série não dobram a altura útil: quem decide é a curva do sistema. Aqui também se compara estrangular a válvula com reduzir a rotação por inversor.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Uma bomba, sistema com muito desnível', desc: 'Curva do sistema quase horizontal: paralelo rende pouco',
          valores: { H0: 50, Qbep: 40, Hbep: 40, arranjo: 'par', nb: 2, dz: 35, C: 0.004, rot: 100 } },
        { nome: '2 · Paralelo em sistema de perda alta', desc: 'Δz pequeno e perda grande: o paralelo também decepciona',
          valores: { H0: 50, Qbep: 40, Hbep: 40, arranjo: 'par', nb: 2, dz: 5, C: 0.020, rot: 100 } },
        { nome: '3 · Série para vencer altura', desc: 'Duas bombas iguais em série dobram a altura em cada vazão',
          valores: { H0: 50, Qbep: 40, Hbep: 40, arranjo: 'ser', nb: 2, dz: 60, C: 0.004, rot: 100 } },
        { nome: '4 · Três em paralelo', desc: 'O ganho por bomba diminui a cada máquina acrescentada',
          valores: { H0: 50, Qbep: 40, Hbep: 40, arranjo: 'par', nb: 3, dz: 10, C: 0.010, rot: 100 } },
        { nome: '5 · Inversor a 80 % da rotação', desc: 'A curva desce pelas leis de semelhança e a potência cai com o cubo',
          valores: { H0: 50, Qbep: 40, Hbep: 40, arranjo: 'uma', nb: 1, dz: 10, C: 0.010, rot: 80 } },
        { nome: '6 · Inversor a 60 %', desc: 'Redução agressiva: cuidado para não cair abaixo do desnível',
          valores: { H0: 50, Qbep: 40, Hbep: 40, arranjo: 'uma', nb: 1, dz: 10, C: 0.010, rot: 60 } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Bomba unitária' },
        { id: 'H0', label: 'Altura de shutoff H₀', min: 10, max: 100, step: 1, valor: 50, unidade: 'm' },
        { id: 'Qbep', label: 'Vazão nominal', min: 5, max: 150, step: 1, valor: 40, unidade: 'm³/h' },
        { id: 'Hbep', label: 'Altura nominal', min: 5, max: 95, step: 1, valor: 40, unidade: 'm' },
        { tipo: 'titulo', label: 'Arranjo' },
        { id: 'arranjo', tipo: 'seg', label: 'Associação', valor: 'par',
          opcoes: [{ v: 'uma', t: 'Uma bomba' }, { v: 'par', t: 'Paralelo' }, { v: 'ser', t: 'Série' }] },
        { id: 'nb', label: 'Número de bombas', min: 1, max: 4, step: 1, valor: 2, unidade: '' },
        { id: 'rot', label: 'Rotação (inversor)', min: 40, max: 110, step: 1, valor: 100, unidade: '%',
          desc: 'Reduzir rotação é o jeito eficiente de reduzir vazão.' },
        { tipo: 'titulo', label: 'Sistema' },
        { id: 'dz', label: 'Parcela estática Δz', min: 0, max: 80, step: 1, valor: 10, unidade: 'm',
          desc: 'Quanto maior o Δz, mais horizontal a curva e pior o paralelo.' },
        { id: 'C', label: 'Coeficiente de perda C', min: 0.001, max: 0.05, step: 0.001, valor: 0.010,
          unidade: 'm/(m³/h)²', desc: 'H_sis = Δz + C·Q². Estrangular a válvula aumenta C.' }
      ],
      graficos: [
        { id: 'assoc', titulo: 'Curvas do arranjo × curva do sistema',
          xlabel: 'Vazão Q (m³/h)', ylabel: 'Altura H (m)', aspect: 0.44, legendPos: 'topright' },
        { id: 'pot', titulo: 'Estrangular a válvula × reduzir a rotação',
          xlabel: 'Vazão desejada Q (m³/h)', ylabel: 'Potência de eixo (kW)', aspect: 0.34, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'Qop', label: 'Vazão do arranjo' },
        { id: 'Hop', label: 'Altura no ponto' },
        { id: 'Qu', label: 'Vazão de uma só bomba' },
        { id: 'ganho', label: 'Ganho do arranjo' },
        { id: 'Qb', label: 'Vazão por bomba' },
        { id: 'Pot', label: 'Potência total' }
      ],
      formulas: [
        { g: 'Como se somam as curvas' },
        { tex: '\\textbf{Paralelo:}\\quad Q_{\\text{total}} = \\sum Q_i \\quad\\text{com}\\quad H \\text{ igual em todas}',
          d: 'somam-se as VAZÕES na horizontal, para cada altura', destaque: true },
        { tex: '\\textbf{Série:}\\quad H_{\\text{total}} = \\sum H_i \\quad\\text{com}\\quad Q \\text{ igual em todas}',
          d: 'somam-se as ALTURAS na vertical, para cada vazão', destaque: true },

        { g: 'Por que o paralelo rende menos do que parece' },
        { tex: 'H_{\\text{sis}} = \\Delta z + C\\,Q^2',
          d: 'ao dobrar Q, a perda quadruplica: o sistema reage subindo a exigência', destaque: true },
        { tex: '\\frac{Q_{2\\,\\text{bombas}}}{Q_{1\\,\\text{bomba}}} < 2',
          d: 'sempre — e quanto mais inclinada a curva do sistema, pior o aproveitamento' },
        { tex: '\\Delta z \\text{ grande} \\Rightarrow \\text{paralelo eficiente}',
          d: 'sistema pouco inclinado: o ponto anda quase na horizontal' },

        { g: 'Leis de semelhança (mesma bomba, rotação diferente)' },
        { tex: '\\frac{Q_2}{Q_1} = \\frac{n_2}{n_1}', d: 'vazão proporcional à rotação', destaque: true },
        { tex: '\\frac{H_2}{H_1} = \\left(\\frac{n_2}{n_1}\\right)^{2}', d: 'altura com o QUADRADO', destaque: true },
        { tex: '\\frac{P_2}{P_1} = \\left(\\frac{n_2}{n_1}\\right)^{3}', d: 'potência com o CUBO — é daqui que vem a economia do inversor', destaque: true },

        { g: 'Semelhança por diâmetro (usinagem do rotor)' },
        { tex: '\\frac{Q_2}{Q_1} = \\frac{D_2}{D_1} \\qquad \\frac{H_2}{H_1} = \\left(\\frac{D_2}{D_1}\\right)^{2} \\qquad \\frac{P_2}{P_1} = \\left(\\frac{D_2}{D_1}\\right)^{3}',
          d: 'válido para cortes moderados, até cerca de 15 % do diâmetro' },

        { g: 'Rotação específica' },
        { tex: 'n_s = \\frac{n\\sqrt{Q}}{H^{3/4}}',
          d: 'define o tipo de rotor: baixo = radial, médio = mista, alto = axial', destaque: true },

        { g: 'Estrangular × inversor' },
        { tex: 'P = \\frac{\\rho g Q H}{\\eta}',
          d: 'estrangulando, H sobe junto com a perda na válvula: a potência quase não cai' },
        { tex: 'P \\propto n^3', d: 'com inversor, reduzir 20 % da rotação corta cerca de 50 % da potência', destaque: true }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'As leis de semelhança valem com rendimento aproximadamente constante, o que é razoável para variações de rotação de até cerca de ±30 %. Fora disso, o rendimento cai e a economia prevista pelo cubo é otimista.',
      calcular: function (p, ctx) {
        var k = p.rot / 100;
        var n = p.arranjo === 'uma' ? 1 : p.nb;
        var aB = (p.H0 - p.Hbep) / (p.Qbep * p.Qbep);

        /* curva de uma bomba na rotação k */
        function Huma(Q) { return k * k * p.H0 - aB * Q * Q; }
        /* curva do arranjo */
        function Harr(Q) {
          if (p.arranjo === 'ser') return n * Huma(Q);
          if (p.arranjo === 'par') return Huma(Q / n);
          return Huma(Q);
        }
        function Hsis(Q) { return p.dz + p.C * Q * Q; }

        function cruzar(fH) {
          var q1 = 0, q2 = p.Qbep * 6;
          if (fH(0) <= Hsis(0)) return 0;
          for (var i = 0; i < 90; i++) {
            var qm = (q1 + q2) / 2;
            if (fH(qm) > Hsis(qm)) q1 = qm; else q2 = qm;
          }
          return (q1 + q2) / 2;
        }
        var Qop = cruzar(Harr);
        var Hop = Hsis(Qop);
        var Qu = cruzar(Huma);
        var ganho = Qu > 0 ? Qop / Qu : 0;
        var Qb = p.arranjo === 'par' ? Qop / n : Qop;

        var etaMax = 0.72;
        function eta(Q) {
          var x = Q / (p.Qbep * k);
          return Math.max(0.08, etaMax * (2 * x - x * x));
        }
        var Pot = RHO * G * (Qop / 3600) * Math.max(Hop, 0) / eta(Qb) / 1000;

        /* ---- gráfico das curvas ---- */
        var Qmax = Math.max(p.Qbep * n * 1.6, Qop * 1.4, 10);
        var Qg = Plot.linspace(0, Qmax, 100);
        var ga = ctx.plot('assoc').clear();
        ga.line(Qg, Qg.map(Huma), { color: Plot.serie(1), width: 1.8, dash: [5, 4], label: 'Uma bomba' });
        if (n > 1) {
          ga.line(Qg, Qg.map(Harr), { color: Plot.serie(0), width: 2.8,
            label: (p.arranjo === 'par' ? n + ' em paralelo' : n + ' em série') });
        }
        ga.line(Qg, Qg.map(Hsis), { color: Plot.serie(3), width: 2.4, label: 'Sistema' });
        if (k !== 1) {
          ga.line(Qg, Qg.map(function (Q) { return p.H0 - aB * Q * Q; }),
            { color: Plot.serie(7), width: 1.3, dash: [2, 3], label: 'Bomba a 100 % da rotação' });
        }
        ga.marker(Qop, Hop, 'arranjo: ' + Plot.sig(Qop, 4) + ' m³/h', { color: Plot.serie(6) });
        if (n > 1 && Qu > 0) ga.marker(Qu, Hsis(Qu), 'uma só: ' + Plot.sig(Qu, 4) + ' m³/h', { color: Plot.serie(1) });
        ga.draw();

        /* ---- estrangular × inversor ---- */
        var Qalvo = Plot.linspace(Math.max(cruzar(Huma) * 0.25, 1), cruzar(Huma), 40);
        var potEstr = Qalvo.map(function (Q) {
          /* estrangulando: a bomba fica na sua curva, o excesso vira perda na válvula */
          var Hb = p.H0 - aB * Q * Q;
          return RHO * G * (Q / 3600) * Hb / eta(Q) / 1000;
        });
        var potInv = Qalvo.map(function (Q) {
          /* inversor: a rotação cai até o ponto pousar na curva do sistema */
          var Hn = Hsis(Q);
          var kk = Math.sqrt((Hn + aB * Q * Q) / p.H0);
          var x = Q / (p.Qbep * Math.max(kk, 0.2));
          var e = Math.max(0.08, etaMax * (2 * x - x * x));
          return RHO * G * (Q / 3600) * Hn / e / 1000;
        });
        var gp = ctx.plot('pot').clear();
        gp.line(Qalvo, potEstr, { color: Plot.serie(5), width: 2.6, label: 'Estrangulando a válvula' });
        gp.line(Qalvo, potInv, { color: Plot.serie(0), width: 2.6, label: 'Reduzindo a rotação (inversor)' });
        gp.draw();

        /* ---- passo a passo ---- */
        var nt = Plot.numTex, sig = Plot.sig;
        var passos = [];
        passos.push({ t: 'Curva de uma bomba',
          tex: 'H = H_0 - a Q^2 \\quad\\text{com}\\quad a = \\frac{H_0 - H_{\\text{bep}}}{Q_{\\text{bep}}^2}',
          texSub: 'a = \\frac{' + p.H0 + ' - ' + p.Hbep + '}{' + p.Qbep + '^2} = ' + nt(aB) +
            ' \\;\\Rightarrow\\; H = ' + nt(k * k * p.H0) + ' - ' + nt(aB) + '\\,Q^2',
          obs: k !== 1 ? 'a ' + p.rot + ' % da rotação o shutoff cai por (n₂/n₁)² = ' + sig(k * k, 3)
            : 'rotação nominal' });
        if (p.arranjo === 'par' && n > 1) {
          passos.push({ t: 'Somando as vazões (paralelo)',
            tex: 'H_{\\text{arranjo}}(Q) = H_{\\text{uma}}\\!\\left(\\frac{Q}{n}\\right)',
            texSub: 'H_{\\text{arranjo}}(Q) = ' + nt(k * k * p.H0) + ' - ' + nt(aB) + '\\left(\\frac{Q}{' + n + '}\\right)^2',
            obs: 'a curva se estica horizontalmente por ' + n + '×, mas a altura de shutoff é a MESMA' });
        } else if (p.arranjo === 'ser' && n > 1) {
          passos.push({ t: 'Somando as alturas (série)',
            tex: 'H_{\\text{arranjo}}(Q) = n\\,H_{\\text{uma}}(Q)',
            texSub: 'H_{\\text{arranjo}}(Q) = ' + n + '\\left(' + nt(k * k * p.H0) + ' - ' + nt(aB) + 'Q^2\\right)',
            obs: 'a curva se estica verticalmente por ' + n + '×, e a vazão de shutoff não muda' });
        }
        passos.push({ t: 'Ponto de operação',
          tex: 'H_{\\text{arranjo}}(Q) = \\Delta z + C\\,Q^2',
          texSub: 'Q_{\\text{op}} = ' + nt(Qop) + '\\ \\mathrm{m^3/h} \\qquad H_{op} = ' + nt(Hop) + '\\ \\mathrm{m}',
          obs: 'com Δz = ' + p.dz + ' m e C = ' + sig(p.C, 3) });
        if (n > 1) {
          passos.push({ t: 'Ganho real do arranjo',
            tex: '\\text{ganho} = \\frac{Q_{\\text{arranjo}}}{Q_{\\text{uma}}}',
            texSub: '\\text{ganho} = \\frac{' + nt(Qop) + '}{' + nt(Qu) + '} = ' + nt(ganho) + '\\times',
            obs: p.arranjo === 'par'
              ? 'com ' + n + ' bombas em paralelo o ganho ideal seria ' + n + '×, mas a curva do sistema comeu a diferença'
              : 'em série o ganho aparece na altura, não na vazão' });
        }
        passos.push({ t: 'Potência de eixo do conjunto',
          tex: 'P = \\frac{\\rho g Q H}{\\eta}',
          texSub: 'P = \\frac{998{,}2 \\cdot 9{,}81 \\cdot ' + nt(Qop / 3600) + ' \\cdot ' + nt(Hop) +
            '}{' + nt(eta(Qb)) + '} = ' + nt(Pot) + '\\ \\mathrm{kW}',
          obs: p.arranjo === 'par' && n > 1 ? 'cada bomba passa ' + sig(Qb, 4) + ' m³/h' : '' });
        if (k !== 1) {
          passos.push({ t: 'Economia do inversor (lei do cubo)',
            tex: '\\frac{P_2}{P_1} = \\left(\\frac{n_2}{n_1}\\right)^{3}',
            texSub: '\\frac{P_2}{P_1} = ' + nt(k) + '^3 = ' + nt(Math.pow(k, 3)) +
              ' \\quad\\Rightarrow\\quad \\text{corte de } ' + nt((1 - Math.pow(k, 3)) * 100) + '\\%',
            obs: 'reduzir a rotação em ' + sig((1 - k) * 100, 3) + ' % corta cerca de ' +
              sig((1 - Math.pow(k, 3)) * 100, 3) + ' % da potência — estrangulando, o corte seria muito menor' });
        }
        ctx.setPassos(passos);

        return {
          Qop: { v: Qop, u: 'm³/h', classe: 'destaque' },
          Hop: { v: Hop, u: 'm' },
          Qu: { v: Qu, u: 'm³/h' },
          ganho: { v: ganho, u: '×' },
          Qb: { v: Qb, u: 'm³/h' },
          Pot: { v: Pot, u: 'kW' }
        };
      }
    });
  })();

  /* ============================================================
     4. Compressor alternativo — diagrama p-V animado
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-compressor')) return;

    var A = { on: true, ang: 0, rel: relogio(), ctx: null, p: null, r: null };

    /* posição adimensional do pistão (0 = PMS, 1 = PMI) pelo mecanismo
       biela-manivela, com relação biela/manivela lambda */
    function posPistao(th, lam) {
      return (1 - Math.cos(th) + (1 - Math.sqrt(1 - lam * lam * Math.sin(th) * Math.sin(th))) / lam) /
             (2 + (1 - Math.sqrt(1 - lam * lam)) / lam);
    }

    function desenharCilindro(c, pl, p, r, th) {
      var a = pl._area;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');

      var lam = 0.30;
      var s = posPistao(th, lam);                  /* 0 no PMS, 1 no PMI */

      var cxCil = a.x + a.w * 0.30;
      var largCil = Math.min(a.w * 0.20, 110);
      var yTopo = a.y + 34;
      var curso = a.h * 0.40;
      var folga = curso * p.c / 100;               /* espaço nocivo */
      var yPist = yTopo + folga + s * curso;

      /* camisa do cilindro */
      c.strokeStyle = borda; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(cxCil - largCil / 2, yTopo - 2);
      c.lineTo(cxCil - largCil / 2, yTopo + folga + curso + 46);
      c.moveTo(cxCil + largCil / 2, yTopo - 2);
      c.lineTo(cxCil + largCil / 2, yTopo + folga + curso + 46);
      c.moveTo(cxCil - largCil / 2, yTopo - 2);
      c.lineTo(cxCil + largCil / 2, yTopo - 2);
      c.stroke();

      /* gás no cilindro, colorido pela pressão instantânea */
      var frac = r ? Math.min(1, Math.max(0, (r.pInst - r.p1) / Math.max(r.p2 - r.p1, 1e-6))) : 0;
      c.fillStyle = Plot.serie(frac > 0.6 ? 5 : (frac > 0.25 ? 4 : 0));
      c.globalAlpha = 0.20 + 0.42 * frac;
      c.fillRect(cxCil - largCil / 2 + 2, yTopo, largCil - 4, yPist - yTopo);
      c.globalAlpha = 1;

      /* espaço nocivo destacado */
      c.strokeStyle = Plot.serie(5); c.lineWidth = 1.2; c.setLineDash([3, 3]);
      c.beginPath();
      c.moveTo(cxCil - largCil / 2, yTopo + folga);
      c.lineTo(cxCil + largCil / 2, yTopo + folga);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = Plot.serie(5); c.font = fonte(9.5);
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('espaço nocivo ' + p.c + ' %', cxCil + largCil / 2 + 6, yTopo + folga / 2 + 2);

      /* pistão */
      c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
      c.fillRect(cxCil - largCil / 2 + 2, yPist, largCil - 4, 26);
      c.strokeStyle = cor; c.lineWidth = 2;
      c.strokeRect(cxCil - largCil / 2 + 2, yPist, largCil - 4, 26);

      /* biela e manivela */
      var cxMan = cxCil, cyMan = yTopo + folga + curso + 92;
      var rMan = curso / 2;
      var xPino = cxMan + rMan * Math.sin(th), yPino = cyMan - rMan * Math.cos(th);
      c.strokeStyle = Plot.serie(1); c.lineWidth = 3.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cxCil, yPist + 13); c.lineTo(xPino, yPino); c.stroke();
      c.strokeStyle = borda; c.lineWidth = 1.6;
      c.beginPath(); c.arc(cxMan, cyMan, rMan, 0, TAU); c.stroke();
      c.strokeStyle = Plot.serie(1); c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(cxMan, cyMan); c.lineTo(xPino, yPino); c.stroke();
      c.lineCap = 'butt';
      c.fillStyle = cor;
      c.beginPath(); c.arc(cxMan, cyMan, 4.5, 0, TAU); c.fill();

      /* válvulas de sucção e descarga */
      var abreSuc = r && r.faseNome === 'admissão';
      var abreDesc = r && r.faseNome === 'descarga';
      function valvula(x, aberta, rotulo, cor2) {
        c.strokeStyle = aberta ? cor2 : faint;
        c.fillStyle = aberta ? cor2 : 'transparent';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x - 9, yTopo - 20); c.lineTo(x + 9, yTopo - 20);
        c.lineTo(x, yTopo - 4); c.closePath();
        if (aberta) { c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1; }
        c.stroke();
        c.fillStyle = aberta ? cor2 : faint;
        c.font = fonte(9.5, aberta ? '700' : '400');
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText(rotulo, x, yTopo - 24);
      }
      valvula(cxCil - largCil * 0.28, abreSuc, 'sucção', Plot.serie(0));
      valvula(cxCil + largCil * 0.28, abreDesc, 'descarga', Plot.serie(5));

      /* setas de entrada e saída de gás */
      if (abreSuc) seta(c, cxCil - largCil * 0.28 - 46, yTopo - 32, cxCil - largCil * 0.28 - 8, yTopo - 26, Plot.serie(0), 2, 8);
      if (abreDesc) seta(c, cxCil + largCil * 0.28 + 8, yTopo - 26, cxCil + largCil * 0.28 + 46, yTopo - 32, Plot.serie(5), 2, 8);

      /* estado instantâneo */
      c.fillStyle = cor; c.font = fonte(12, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Compressor alternativo — ' + (r ? r.faseNome : ''), a.x + 4, a.y + 2);
      if (r) {
        c.font = fonte(11);
        c.fillStyle = faint;
        c.fillText('p = ' + Plot.sig(r.pInst, 4) + ' kPa   ·   V/V_deslocado = ' + Plot.sig(r.vInst, 3),
          a.x + 4, a.y + 19);
      }

      /* estágios, quando houver mais de um */
      if (p.N > 1) {
        var xg = a.x + a.w * 0.66;
        c.fillStyle = cor; c.font = fonte(11.5, '650');
        c.textAlign = 'left'; c.textBaseline = 'top';
        c.fillText(p.N + ' estágios com inter-resfriamento', xg, a.y + 40);
        for (var e = 0; e < p.N; e++) {
          var yb = a.y + 66 + e * 42;
          c.strokeStyle = Plot.serie(1); c.lineWidth = 1.8;
          c.strokeRect(xg, yb, 54, 26);
          c.fillStyle = Plot.serie(1); c.font = fonte(10.5, '600');
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('estágio ' + (e + 1), xg + 27, yb + 13);
          if (e < p.N - 1) {
            c.strokeStyle = Plot.serie(0); c.lineWidth = 1.8;
            c.strokeRect(xg + 74, yb, 62, 26);
            c.fillStyle = Plot.serie(0);
            c.fillText('resfria', xg + 105, yb + 13);
            seta(c, xg + 54, yb + 13, xg + 72, yb + 13, faint, 1.6, 7);
            seta(c, xg + 105, yb + 28, xg + 27, yb + 40, faint, 1.6, 7);
          }
        }
      }
    }

    Sim.build('#sim-compressor', {
      titulo: 'Compressor alternativo — diagrama p-V animado',
      descricao: 'O pistão se move de verdade e o ponto anda pelo diagrama p-V junto com ele. Aumente o espaço nocivo e veja a eficiência volumétrica despencar; acrescente estágios e veja o trabalho cair.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Compressor de ar de oficina', desc: 'Comprime até 8 bar em um estágio',
          valores: { p1: 100, p2: 800, T1: 25, n: 1.30, c: 5, N: 1, Vd: 2, rpm: 900, animar: true, vel: 1 } },
        { nome: '2 · Espaço nocivo alto (12 %)', desc: 'O gás retido reexpande e engole a admissão',
          valores: { p1: 100, p2: 800, T1: 25, n: 1.30, c: 12, N: 1, Vd: 2, rpm: 900, animar: true, vel: 1 } },
        { nome: '3 · Alta pressão em um estágio', desc: 'Temperatura de descarga proibitiva',
          valores: { p1: 100, p2: 4000, T1: 25, n: 1.35, c: 5, N: 1, Vd: 2, rpm: 900, animar: true, vel: 1 } },
        { nome: '4 · O mesmo em dois estágios', desc: 'Inter-resfriamento derruba trabalho e temperatura',
          valores: { p1: 100, p2: 4000, T1: 25, n: 1.35, c: 5, N: 2, Vd: 2, rpm: 900, animar: true, vel: 1 } },
        { nome: '5 · Três estágios', desc: 'O ganho por estágio adicional vai diminuindo',
          valores: { p1: 100, p2: 4000, T1: 25, n: 1.35, c: 5, N: 3, Vd: 2, rpm: 900, animar: true, vel: 1 } },
        { nome: '6 · Compressão isotérmica ideal (n = 1)', desc: 'O menor trabalho possível — inatingível na prática',
          valores: { p1: 100, p2: 800, T1: 25, n: 1.0, c: 5, N: 1, Vd: 2, rpm: 900, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'p1', label: 'Pressão de admissão p₁', min: 50, max: 500, step: 10, valor: 100, unidade: 'kPa' },
        { id: 'p2', label: 'Pressão de descarga p₂', min: 200, max: 6000, step: 50, valor: 800, unidade: 'kPa' },
        { id: 'T1', label: 'Temperatura de admissão', min: -20, max: 60, step: 5, valor: 25, unidade: '°C' },
        { id: 'n', label: 'Expoente politrópico n', min: 1.0, max: 1.4, step: 0.01, valor: 1.30, unidade: '',
          desc: 'n = 1 isotérmico · n = 1,4 adiabático do ar · real fica entre os dois' },
        { tipo: 'separador' },
        { id: 'c', label: 'Espaço nocivo c', min: 0, max: 20, step: 1, valor: 5, unidade: '%',
          desc: 'Volume que sobra no PMS. O gás preso ali reexpande e reduz a admissão.' },
        { id: 'N', label: 'Número de estágios', min: 1, max: 4, step: 1, valor: 1, unidade: '' },
        { id: 'Vd', label: 'Volume deslocado', min: 0.2, max: 20, step: 0.2, valor: 2, unidade: 'L' },
        { id: 'rpm', label: 'Rotação', min: 200, max: 1800, step: 50, valor: 900, unidade: 'rpm' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Mover o pistão', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.1, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'cil', axes: false, height: 380, grid: false, legend: false },
        { id: 'pv', titulo: 'Diagrama p-V do ciclo indicado',
          xlabel: 'Volume no cilindro (L)', ylabel: 'Pressão (kPa)', aspect: 0.42, legendPos: 'topright' },
        { id: 'est', titulo: 'Trabalho por estágio e efeito do inter-resfriamento',
          xlabel: '', ylabel: 'Trabalho específico (kJ/kg)', aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'rp', label: 'Razão de pressão total' },
        { id: 'rpe', label: 'Razão por estágio' },
        { id: 'T2', label: 'Temperatura de descarga' },
        { id: 'etav', label: 'Eficiência volumétrica' },
        { id: 'w', label: 'Trabalho específico' },
        { id: 'Pot', label: 'Potência' },
        { id: 'mdot', label: 'Vazão mássica' },
        { id: 'econ', label: 'Economia vs 1 estágio' }
      ],
      formulas: [
        { g: 'Processo politrópico' },
        { tex: 'p\\,V^{\\,n} = \\text{constante}', d: 'n = 1 isotérmico · n = k adiabático reversível · real entre os dois', destaque: true },
        { tex: '\\frac{T_2}{T_1} = \\left(\\frac{p_2}{p_1}\\right)^{\\frac{n-1}{n}}',
          d: 'a temperatura de descarga só depende da RAZÃO de pressão, não da diferença', destaque: true },

        { g: 'Trabalho de compressão em regime permanente' },
        { tex: 'w = \\frac{n}{n-1}RT_1\\left[\\left(\\frac{p_2}{p_1}\\right)^{\\frac{n-1}{n}} - 1\\right]',
          d: 'trabalho por unidade de massa [kJ/kg] — vale para n ≠ 1', destaque: true },
        { tex: 'w = R\\,T_1 \\ln\\frac{p_2}{p_1}', d: 'caso isotérmico (n = 1): o MENOR trabalho possível' },
        { tex: 'w_{\\text{isot}} < w_{\\text{polit}} < w_{\\text{adiab}}', d: 'por isso todo compressor grande é resfriado' },

        { g: 'Espaço nocivo e eficiência volumétrica' },
        { tex: '\\eta_v = 1 + c - c\\left(\\frac{p_2}{p_1}\\right)^{1/n}',
          d: 'o gás retido no PMS reexpande e ocupa parte do curso de admissão', destaque: true },
        { tex: '\\eta_v = 0 \\;\\Rightarrow\\; \\text{o compressor não aspira nada}',
          d: 'acontece quando a razão de pressão fica alta demais para aquele espaço nocivo' },
        { tex: '\\dot m = \\eta_v\\,\\rho_1 V_{\\text{desl}}\\,\\frac{N_{\\text{rot}}}{60}', d: 'vazão mássica efetivamente admitida' },

        { g: 'Múltiplos estágios com inter-resfriamento' },
        { tex: 'r_{\\text{estágio}} = \\left(\\frac{p_2}{p_1}\\right)^{1/N}',
          d: 'razão de pressão ÓTIMA: igual em todos os estágios', destaque: true },
        { tex: 'p_{\\text{int}} = \\sqrt{p_1 p_2}', d: 'caso de dois estágios: média geométrica' },
        { tex: 'w_{\\text{total}} = N\\,\\frac{n}{n-1}RT_1\\left[\\left(\\frac{p_2}{p_1}\\right)^{\\frac{n-1}{nN}} - 1\\right]',
          d: 'com resfriamento até T₁ entre estágios', destaque: true },
        { tex: 'N \\uparrow \\;\\Rightarrow\\; w \\to w_{\\text{isotérmico}}',
          d: 'infinitos estágios resfriados equivalem à compressão isotérmica' },

        { g: 'Potência' },
        { tex: 'P = \\dot m\\,w', d: 'potência de compressão [kW]' },
        { tex: 'R_{\\text{ar}} = 0{,}287\\ \\mathrm{kJ/kg\\,K}', d: 'constante do ar usada no modelo' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Modelo de ar como gás ideal com R = 0,287 kJ/kg·K e compressão politrópica de expoente n único. O diagrama p-V mostra o ciclo indicado real, com reexpansão do gás retido no espaço nocivo.',
      calcular: function (p, ctx) {
        var R = 0.287;
        var T1 = p.T1 + 273.15;
        var rp = p.p2 / p.p1;
        var rpe = Math.pow(rp, 1 / p.N);
        var n = p.n;
        var expo = (n - 1) / n;
        var T2 = T1 * Math.pow(rpe, expo);
        var c = p.c / 100;
        var etav = 1 + c - c * Math.pow(rpe, 1 / n);
        etav = Math.max(etav, 0);

        function trab(razao, estagios) {
          if (Math.abs(n - 1) < 1e-6) return estagios * R * T1 * Math.log(Math.pow(razao, 1 / estagios));
          return estagios * (n / (n - 1)) * R * T1 * (Math.pow(Math.pow(razao, 1 / estagios), expo) - 1);
        }
        var w = trab(rp, p.N);
        var w1 = trab(rp, 1);
        var wIso = R * T1 * Math.log(rp);
        var econ = w1 > 0 ? (1 - w / w1) * 100 : 0;

        var rho1 = p.p1 / (R * T1);
        var Vd = p.Vd / 1000;
        var mdot = etav * rho1 * Vd * (p.rpm / 60);
        var Pot = mdot * w;

        /* ---- diagrama p-V do ciclo indicado ---- */
        var Vmorto = c * p.Vd;
        var Vmax = p.Vd + Vmorto;
        /* 1-2 compressão politrópica de Vmax até V2 */
        var V2 = Vmax * Math.pow(1 / rpe, 1 / n);
        /* 3-4 reexpansão do volume morto */
        var V4 = Vmorto * Math.pow(rpe, 1 / n);
        var xs = [], ys = [], i, t;
        for (i = 0; i <= 40; i++) {                       /* compressão */
          t = Vmax + (V2 - Vmax) * i / 40;
          xs.push(t); ys.push(p.p1 * Math.pow(Vmax / t, n));
        }
        for (i = 0; i <= 12; i++) {                       /* descarga isobárica */
          xs.push(V2 + (Vmorto - V2) * i / 12); ys.push(p.p1 * rpe);
        }
        for (i = 0; i <= 40; i++) {                       /* reexpansão */
          t = Vmorto + (V4 - Vmorto) * i / 40;
          xs.push(t); ys.push(p.p1 * rpe * Math.pow(Vmorto / t, n));
        }
        for (i = 0; i <= 12; i++) {                       /* admissão isobárica */
          xs.push(V4 + (Vmax - V4) * i / 12); ys.push(p.p1);
        }
        var gpv = ctx.plot('pv').clear();
        gpv.line(xs, ys, { color: Plot.serie(0), width: 2.6, label: 'Ciclo indicado (1 estágio)' });
        gpv.hline(p.p1, { color: Plot.serie(2), dash: [4, 4], width: 1.2, text: 'p₁' });
        gpv.hline(p.p1 * rpe, { color: Plot.serie(5), dash: [4, 4], width: 1.2, text: 'p descarga do estágio' });
        gpv.vline(Vmorto, { color: Plot.serie(7), dash: [3, 3], width: 1.2, text: 'volume morto' });
        /* isotérmica de referência, para comparar as áreas */
        var xi = Plot.linspace(V2, Vmax, 40);
        gpv.line(xi, xi.map(function (V) { return p.p1 * Vmax / V; }),
          { color: Plot.serie(4), width: 1.4, dash: [2, 3], label: 'isotérmica (n = 1), trabalho mínimo' });
        A.pv = { xs: xs, ys: ys, Vmax: Vmax, Vmorto: Vmorto, V2: V2, V4: V4 };
        gpv.draw();

        /* ---- barras de trabalho por número de estágios ---- */
        var ge = ctx.plot('est').clear();
        var rot = [], vals = [], cores = [];
        for (i = 1; i <= 4; i++) {
          rot.push({ v: i - 1, label: i + (i === 1 ? ' estágio' : ' estágios') });
          vals.push(trab(rp, i));
          cores.push(i === p.N ? Plot.serie(0) : Plot.serie(1));
        }
        rot.push({ v: 4, label: 'isotérmico' });
        vals.push(wIso); cores.push(Plot.serie(4));
        ge.o.xcat = rot;
        ge.setLimits([-0.6, 4.6], [0, Math.max.apply(null, vals) * 1.22]);
        vals.forEach(function (v, idx) {
          ge.bars([idx], [v], { color: cores[idx], barw: 0.52 });
          ge.text(idx, v, Plot.sig(v, 4) + ' kJ/kg', { align: 'center', dy: -7, size: 11 });
        });
        ge.draw();

        var r = { p1: p.p1, p2: p.p1 * rpe, pInst: p.p1, vInst: 1, faseNome: 'admissão' };
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar; A.n = n; A.rpe = rpe;
        desenhaCil();

        /* ---- passo a passo ---- */
        var nt = Plot.numTex, sig = Plot.sig;
        ctx.setPassos([
          { t: 'Razão de pressão por estágio',
            tex: 'r_{\\text{est}} = \\left(\\frac{p_2}{p_1}\\right)^{1/N}',
            texSub: 'r_{\\text{est}} = \\left(\\frac{' + p.p2 + '}{' + p.p1 + '}\\right)^{1/' + p.N + '} = ' + nt(rpe),
            obs: 'razão total ' + sig(rp, 4) + '× dividida igualmente entre os ' + p.N +
              (p.N === 1 ? ' estágio' : ' estágios') + ' — é a divisão que minimiza o trabalho' },
          { t: 'Temperatura de descarga do estágio',
            tex: 'T_2 = T_1\\left(\\frac{p_2}{p_1}\\right)^{\\frac{n-1}{n}}',
            texSub: 'T_2 = ' + nt(T1) + ' \\cdot ' + nt(rpe) + '^{' + nt(expo) + '} = ' + nt(T2) +
              '\\ \\mathrm{K} = ' + nt(T2 - 273.15) + '\\ ^\\circ\\mathrm{C}',
            obs: T2 - 273.15 > 180 ? 'acima de 180 °C o óleo lubrificante degrada — é o limite prático que obriga a dividir em estágios'
              : 'temperatura dentro do aceitável para o lubrificante' },
          { t: 'Eficiência volumétrica com espaço nocivo',
            tex: '\\eta_v = 1 + c - c\\left(\\frac{p_2}{p_1}\\right)^{1/n}',
            texSub: '\\eta_v = 1 + ' + nt(c) + ' - ' + nt(c) + ' \\cdot ' + nt(rpe) + '^{1/' + nt(n) +
              '} = ' + nt(etav),
            obs: 'o compressor aspira só ' + sig(etav * 100, 3) + ' % do volume que desloca' },
          { t: 'Trabalho específico de compressão',
            tex: 'w = N\\frac{n}{n-1}RT_1\\left[r_{\\text{est}}^{\\frac{n-1}{n}} - 1\\right]',
            texSub: 'w = ' + p.N + ' \\cdot \\frac{' + nt(n) + '}{' + nt(n - 1) + '} \\cdot 0{,}287 \\cdot ' +
              nt(T1) + '\\left[' + nt(Math.pow(rpe, expo)) + ' - 1\\right] = ' + nt(w) + '\\ \\mathrm{kJ/kg}',
            obs: 'em um único estágio seriam ' + sig(w1, 4) + ' kJ/kg; o mínimo teórico (isotérmico) é ' +
              sig(wIso, 4) + ' kJ/kg' },
          { t: 'Vazão mássica',
            tex: '\\dot m = \\eta_v\\,\\rho_1 V_{\\text{desl}}\\frac{N_{\\text{rot}}}{60} \\quad\\text{com}\\quad \\rho_1 = \\frac{p_1}{RT_1}',
            texSub: '\\rho_1 = \\frac{' + p.p1 + '}{0{,}287 \\cdot ' + nt(T1) + '} = ' + nt(rho1) +
              '\\ \\mathrm{kg/m^3} \\;\\Rightarrow\\; \\dot m = ' + nt(mdot) + '\\ \\mathrm{kg/s}',
            obs: 'volume deslocado ' + p.Vd + ' L a ' + p.rpm + ' rpm' },
          { t: 'Potência de compressão',
            tex: 'P = \\dot m\\,w',
            texSub: 'P = ' + nt(mdot) + ' \\cdot ' + nt(w) + ' = ' + nt(Pot) + '\\ \\mathrm{kW}',
            obs: p.N > 1 ? 'o inter-resfriamento economiza ' + sig(econ, 3) + ' % em relação ao estágio único'
              : 'dividir em 2 estágios economizaria ' + sig((1 - trab(rp, 2) / w1) * 100, 3) + ' %' }
        ]);

        return {
          rp: { v: rp, u: '×' },
          rpe: { v: rpe, u: '×' },
          T2: { v: T2 - 273.15, u: '°C', classe: (T2 - 273.15) > 180 ? 'alerta' : '' },
          etav: { v: etav * 100, u: '%', classe: etav < 0.55 ? 'alerta' : '' },
          w: { v: w, u: 'kJ/kg' },
          Pot: { v: Pot, u: 'kW', classe: 'destaque' },
          mdot: { v: mdot, u: 'kg/s' },
          econ: { v: econ, u: '%' }
        };
      }
    });

    function desenhaCil() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('cil');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) { desenharCilindro(c, plot, A.p, A.r, A.ang); });
      pl.draw();
    }

    /* estado instantâneo do gás em função do ângulo de manivela */
    function estadoInstantaneo(p, th, n, rpe) {
      var s = posPistao(th, 0.30);
      var Vmorto = (p.c / 100) * p.Vd;
      var V = Vmorto + s * p.Vd;                 /* volume no cilindro, em L */
      var Vmax = Vmorto + p.Vd;
      var pDesc = p.p1 * rpe;
      var V2 = Vmax * Math.pow(1 / rpe, 1 / n);
      var V4 = Vmorto * Math.pow(rpe, 1 / n);
      var subindo = Math.sin(th) < 0 || (th % TAU) > Math.PI;   /* pistão indo ao PMS */
      var pInst, fase;
      if (subindo) {
        if (V > V2) { pInst = p.p1 * Math.pow(Vmax / V, n); fase = 'compressão'; }
        else { pInst = pDesc; fase = 'descarga'; }
      } else {
        if (V < V4) { pInst = pDesc * Math.pow(Vmorto / V, n); fase = 'reexpansão'; }
        else { pInst = p.p1; fase = 'admissão'; }
      }
      return { V: V, p: pInst, fase: fase, s: s };
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.ang = (A.ang + TAU * (A.p.rpm / 60) * dt * 0.06 * A.p.vel) % TAU;
      var e = estadoInstantaneo(A.p, A.ang, A.n, A.rpe);
      A.r.pInst = e.p; A.r.vInst = e.V / (A.p.Vd + (A.p.c / 100) * A.p.Vd);
      A.r.faseNome = e.fase;
      desenhaCil();
      /* ponto correndo pelo diagrama p-V */
      var pv = A.ctx.plot('pv');
      if (pv) {
        pv.draw();
        var c2 = pv.ctx;
        c2.save();
        c2.fillStyle = Plot.serie(6);
        c2.beginPath(); c2.arc(pv.px(e.V), pv.py(e.p), 5.2, 0, TAU); c2.fill();
        c2.strokeStyle = Plot.cssVar('--bg-elev', '#fff'); c2.lineWidth = 1.6;
        c2.beginPath(); c2.arc(pv.px(e.V), pv.py(e.p), 5.2, 0, TAU); c2.stroke();
        c2.restore();
      }
    });
  })();

  /* ============================================================
     5. Turbina hidráulica gerando potência
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-turbina')) return;

    var A = { on: true, ang: 0, fase: 0, rel: relogio(), ctx: null, p: null, r: null };

    /* --- roda Pelton: conchas duplas na periferia, jato saindo do injetor --- */
    function desenharPelton(c, pl, p, r, ang, fase) {
      var a = pl._area;
      var cx = a.x + a.w * 0.58, cy = a.y + a.h * 0.52;
      var Rr = Math.min(a.w * 0.20, a.h * 0.36);
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i;

      /* reservatório e conduto forçado, à esquerda */
      var xRes = a.x + a.w * 0.06, yRes = a.y + 26;
      c.strokeStyle = borda; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(xRes - 26, yRes - 12); c.lineTo(xRes - 26, yRes + 40);
      c.lineTo(xRes + 40, yRes + 40); c.lineTo(xRes + 40, yRes - 12);
      c.stroke();
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.26;
      c.fillRect(xRes - 25, yRes, 64, 40);
      c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(xRes - 26, yRes); c.lineTo(xRes + 40, yRes); c.stroke();

      /* conduto descendo até o injetor */
      var xInj = cx - Rr - 46, yInj = cy;
      c.strokeStyle = cor; c.globalAlpha = 0.22; c.lineWidth = 11;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(xRes + 7, yRes + 20);
      c.lineTo(xRes + 7, yInj - 30);
      c.lineTo(xInj - 30, yInj);
      c.stroke();
      c.globalAlpha = 1; c.lineCap = 'butt';

      /* cota da queda bruta */
      c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6);
      seta(c, xRes - 40, yRes, xRes - 40, yInj, Plot.serie(6), 1.6, 8);
      seta(c, xRes - 40, yInj, xRes - 40, yRes, Plot.serie(6), 1.6, 8);
      c.save();
      c.translate(xRes - 46, (yRes + yInj) / 2);
      c.rotate(-Math.PI / 2);
      c.font = fonte(11.5, '700');
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('H = ' + p.H + ' m', 0, 0);
      c.restore();

      /* injetor com agulha */
      c.fillStyle = Plot.cssVar('--bg-sunken', '#eee');
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(xInj - 30, yInj - 13); c.lineTo(xInj - 4, yInj - 4);
      c.lineTo(xInj - 4, yInj + 4); c.lineTo(xInj - 30, yInj + 13);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = faint; c.font = fonte(10);
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('injetor', xInj - 17, yInj + 16);

      /* jato: segmentos animados entre o injetor e a roda */
      if (r && r.V1 > 0) {
        c.strokeStyle = Plot.serie(0); c.lineWidth = 5.4; c.lineCap = 'round';
        c.globalAlpha = 0.85;
        for (i = 0; i < 7; i++) {
          var s0 = ((fase * 2 + i / 7) % 1);
          var xa = xInj - 2 + s0 * (Rr + 44) * 0.86;
          c.beginPath();
          c.moveTo(xa, yInj); c.lineTo(xa + 11, yInj);
          c.stroke();
        }
        c.globalAlpha = 1; c.lineCap = 'butt';
      }

      /* roda */
      c.strokeStyle = borda; c.lineWidth = 2;
      c.beginPath(); c.arc(cx, cy, Rr, 0, TAU); c.stroke();
      c.strokeStyle = faint; c.lineWidth = 1.2;
      c.beginPath(); c.arc(cx, cy, Rr * 0.30, 0, TAU); c.stroke();
      /* raios */
      for (i = 0; i < 6; i++) {
        var thr = ang + i * TAU / 6;
        c.beginPath();
        c.moveTo(cx + Rr * 0.30 * Math.cos(thr), cy + Rr * 0.30 * Math.sin(thr));
        c.lineTo(cx + Rr * 0.92 * Math.cos(thr), cy + Rr * 0.92 * Math.sin(thr));
        c.stroke();
      }
      /* conchas */
      var nc = 14;
      for (i = 0; i < nc; i++) {
        var th = ang + i * TAU / nc;
        var xb = cx + Rr * Math.cos(th), yb = cy + Rr * Math.sin(th);
        c.save();
        c.translate(xb, yb);
        c.rotate(th);
        c.fillStyle = Plot.serie(1); c.globalAlpha = 0.55;
        c.beginPath();
        c.ellipse(0, 0, 9, 6.4, 0, 0, TAU);
        c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = Plot.serie(1); c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(0, 0, 9, 6.4, 0, 0, TAU); c.stroke();
        c.beginPath(); c.moveTo(0, -6.4); c.lineTo(0, 6.4); c.stroke();  /* aresta divisora */
        c.restore();
      }

      /* eixo e gerador */
      var xg = cx + Rr + 74;
      c.strokeStyle = cor; c.lineWidth = 5;
      c.beginPath(); c.moveTo(cx + Rr * 0.30, cy); c.lineTo(xg - 34, cy); c.stroke();
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.strokeStyle = Plot.serie(4); c.lineWidth = 2.4;
      c.beginPath(); c.roundRect ? c.roundRect(xg - 34, cy - 30, 68, 60, 8) : c.rect(xg - 34, cy - 30, 68, 60);
      c.fill(); c.stroke();
      /* rotor do gerador girando */
      c.strokeStyle = Plot.serie(4); c.lineWidth = 2;
      c.beginPath(); c.arc(xg, cy, 17, 0, TAU); c.stroke();
      for (i = 0; i < 4; i++) {
        var tg = ang * 1.0 + i * Math.PI / 2;
        c.beginPath();
        c.moveTo(xg + 4 * Math.cos(tg), cy + 4 * Math.sin(tg));
        c.lineTo(xg + 15 * Math.cos(tg), cy + 15 * Math.sin(tg));
        c.stroke();
      }
      c.fillStyle = Plot.serie(4); c.font = fonte(10.5, '700');
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('GERADOR', xg, cy + 34);

      /* saída elétrica pulsando com a potência */
      if (r) {
        var pulso = 0.55 + 0.45 * Math.sin(fase * TAU * 3);
        c.globalAlpha = pulso;
        seta(c, xg + 36, cy, xg + 78, cy, Plot.serie(3), 2.6, 10);
        c.globalAlpha = 1;
        c.fillStyle = Plot.serie(3); c.font = fonte(12, '700');
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(Plot.sig(r.Pel, 4) + ' kW', xg + 84, cy - 8);
        c.font = fonte(10);
        c.fillStyle = faint;
        c.fillText('n = ' + Plot.sig(r.n, 4) + ' rpm', xg + 84, cy + 9);
      }

      /* canal de fuga */
      c.strokeStyle = Plot.serie(0); c.globalAlpha = 0.30; c.lineWidth = 8;
      c.beginPath();
      c.moveTo(cx - Rr * 0.5, cy + Rr + 12); c.lineTo(cx - Rr * 0.5, a.y + a.h - 12);
      c.lineTo(a.x + a.w * 0.10, a.y + a.h - 12);
      c.stroke();
      c.globalAlpha = 1;
      c.fillStyle = faint; c.font = fonte(10);
      c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('canal de fuga', a.x + a.w * 0.10, a.y + a.h - 16);

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Turbina Pelton — ação, jato livre à pressão atmosférica', a.x + 4, a.y + 2);
    }

    /* --- turbina Francis: distribuidor + rotor de pás curvas --- */
    function desenharFrancis(c, pl, p, r, ang, fase) {
      var a = pl._area;
      var cx = a.x + a.w * 0.52, cy = a.y + a.h * 0.50;
      var Rext = Math.min(a.w * 0.19, a.h * 0.36);
      var Rint = Rext * 0.52;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#999');
      var borda = Plot.cssVar('--border', '#ddd');
      var i;

      /* caixa espiral */
      c.strokeStyle = borda; c.lineWidth = 2.6;
      c.beginPath();
      for (i = 0; i <= 160; i++) {
        var t = i / 160;
        var th = t * TAU * 0.98 + Math.PI * 0.5;
        var rv = Rext * 1.55 + Rext * 0.62 * (1 - t);
        var X = cx + rv * Math.cos(th), Y = cy + rv * Math.sin(th);
        if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y);
      }
      c.stroke();
      c.fillStyle = faint; c.font = fonte(10);
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('caixa espiral', cx + Rext * 1.7, cy - Rext * 1.5);

      /* pás diretrizes do distribuidor */
      var nd = 12;
      c.strokeStyle = Plot.serie(4); c.lineWidth = 2.6; c.lineCap = 'round';
      for (i = 0; i < nd; i++) {
        var td = i * TAU / nd;
        var ab = rad(p.alfa);
        var x1 = cx + Rext * 1.34 * Math.cos(td), y1 = cy + Rext * 1.34 * Math.sin(td);
        var x2 = cx + Rext * 1.06 * Math.cos(td + ab * 0.6), y2 = cy + Rext * 1.06 * Math.sin(td + ab * 0.6);
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
      c.lineCap = 'butt';

      /* rotor */
      c.fillStyle = Plot.serie(0); c.globalAlpha = 0.10;
      c.beginPath(); c.arc(cx, cy, Rext, 0, TAU); c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 1.6;
      c.beginPath(); c.arc(cx, cy, Rext, 0, TAU); c.stroke();
      c.beginPath(); c.arc(cx, cy, Rint, 0, TAU); c.stroke();
      /* pás curvas do rotor */
      var nr = 11;
      c.strokeStyle = Plot.serie(0); c.lineWidth = 3.0; c.lineCap = 'round';
      for (i = 0; i < nr; i++) {
        var th0 = ang + i * TAU / nr;
        c.beginPath();
        for (var j = 0; j <= 18; j++) {
          var s = j / 18;
          var rr = Rext - (Rext - Rint) * s;
          var thh = th0 + s * 0.85;
          var Xp = cx + rr * Math.cos(thh), Yp = cy + rr * Math.sin(thh);
          if (j === 0) c.moveTo(Xp, Yp); else c.lineTo(Xp, Yp);
        }
        c.stroke();
      }
      c.lineCap = 'butt';

      /* água entrando pela periferia e saindo pelo centro */
      c.fillStyle = Plot.serie(2);
      for (i = 0; i < 22; i++) {
        var ph = (fase * 1.6 + i / 22) % 1;
        var tq = i * TAU / 22 + ang * 0.4;
        var rq = Rext * 1.42 - ph * (Rext * 1.42 - Rint * 0.6);
        var thq = tq + ph * 1.5;
        c.globalAlpha = 0.30 + 0.55 * (1 - ph);
        c.beginPath();
        c.arc(cx + rq * Math.cos(thq), cy + rq * Math.sin(thq), 2.6, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;

      /* tubo de sucção */
      c.strokeStyle = borda; c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(cx - Rint, cy + Rext * 0.2); c.lineTo(cx - Rint * 1.5, a.y + a.h - 16);
      c.moveTo(cx + Rint, cy + Rext * 0.2); c.lineTo(cx + Rint * 1.5, a.y + a.h - 16);
      c.stroke();
      c.fillStyle = faint; c.font = fonte(10);
      c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('tubo de sucção (recupera energia cinética)', cx, a.y + a.h - 4);

      /* eixo e gerador acima */
      c.strokeStyle = cor; c.lineWidth = 5;
      c.beginPath(); c.moveTo(cx, cy - Rint); c.lineTo(cx, a.y + 58); c.stroke();
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.strokeStyle = Plot.serie(4); c.lineWidth = 2.4;
      c.beginPath(); c.rect(cx - 40, a.y + 22, 80, 38); c.fill(); c.stroke();
      c.fillStyle = Plot.serie(4); c.font = fonte(10.5, '700');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('GERADOR', cx, a.y + 41);
      if (r) {
        var pulso = 0.55 + 0.45 * Math.sin(fase * TAU * 3);
        c.globalAlpha = pulso;
        seta(c, cx + 42, a.y + 41, cx + 92, a.y + 41, Plot.serie(3), 2.6, 10);
        c.globalAlpha = 1;
        c.fillStyle = Plot.serie(3); c.font = fonte(12, '700');
        c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(Plot.sig(r.Pel, 4) + ' kW', cx + 98, a.y + 41);
      }

      c.fillStyle = cor; c.font = fonte(12.5, '650');
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('Turbina Francis — reação, o rotor trabalha afogado e sob pressão', a.x + 4, a.y + 2);
    }

    Sim.build('#sim-turbina', {
      titulo: 'Turbina hidráulica gerando energia',
      descricao: 'A mesma queda pode virar Pelton ou Francis — quem decide é a rotação específica. Ajuste queda e vazão, veja o rotor girar, o jato bater nas conchas e a potência sair pelo gerador.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · PCH de alta queda (Pelton)', desc: 'Muita queda e pouca vazão: o caso clássico da Pelton',
          valores: { tipo: 'pelton', H: 450, Q: 0.8, npar: 4, phi: 0.46, k: 0.97, beta2: 165, alfa: 20, etaM: 97, etaG: 96, animar: true, vel: 1 } },
        { nome: '2 · Pelton fora do ponto ótimo', desc: 'Coeficiente de velocidade longe de 0,5: rendimento cai',
          valores: { tipo: 'pelton', H: 450, Q: 0.8, npar: 4, phi: 0.30, k: 0.97, beta2: 165, alfa: 20, etaM: 97, etaG: 96, animar: true, vel: 1 } },
        { nome: '3 · Média queda (Francis)', desc: 'Vazão maior, queda média: a Francis domina essa faixa',
          valores: { tipo: 'francis', H: 90, Q: 12, npar: 4, phi: 0.46, k: 0.97, beta2: 165, alfa: 22, etaM: 97, etaG: 96, animar: true, vel: 1 } },
        { nome: '4 · Baixa queda e muita vazão', desc: 'Rotação específica alta — aqui já se pensa em Kaplan',
          valores: { tipo: 'francis', H: 14, Q: 60, npar: 8, phi: 0.46, k: 0.97, beta2: 165, alfa: 26, etaM: 97, etaG: 96, animar: true, vel: 1 } },
        { nome: '5 · Concha com desvio ruim', desc: 'β₂ = 120° em vez de 165°: perde-se boa parte da energia do jato',
          valores: { tipo: 'pelton', H: 450, Q: 0.8, npar: 4, phi: 0.46, k: 0.97, beta2: 120, alfa: 20, etaM: 97, etaG: 96, animar: true, vel: 1 } },
        { nome: '6 · Microgeração', desc: 'Queda modesta e vazão pequena: poucos kW',
          valores: { tipo: 'pelton', H: 45, Q: 0.08, npar: 8, phi: 0.46, k: 0.96, beta2: 165, alfa: 20, etaM: 94, etaG: 92, animar: true, vel: 1 } }
      ],
      controles: [
        { id: 'tipo', tipo: 'seg', label: 'Tipo de turbina', valor: 'pelton',
          opcoes: [{ v: 'pelton', t: 'Pelton (ação)' }, { v: 'francis', t: 'Francis (reação)' }] },
        { id: 'H', label: 'Queda líquida H', min: 5, max: 800, step: 5, valor: 320, unidade: 'm' },
        { id: 'Q', label: 'Vazão Q', min: 0.02, max: 100, step: 0.02, valor: 1.2, unidade: 'm³/s' },
        { id: 'npar', label: 'Pares de polos do gerador', min: 1, max: 20, step: 1, valor: 4, unidade: '',
          desc: 'Define a rotação síncrona: n = 60·f/p, com f = 60 Hz.' },
        { tipo: 'titulo', label: 'Pelton' },
        { id: 'phi', label: 'Coeficiente de velocidade u/V₁', min: 0.15, max: 0.75, step: 0.01, valor: 0.46,
          unidade: '', desc: 'O ótimo teórico é 0,5. Na prática usa-se 0,44 a 0,48.' },
        { id: 'k', label: 'Coef. de velocidade do injetor', min: 0.90, max: 0.99, step: 0.01, valor: 0.97, unidade: '' },
        { id: 'beta2', label: 'Ângulo de saída da concha β₂', min: 100, max: 178, step: 2, valor: 165, unidade: '°',
          desc: '180° seria o desvio perfeito, mas a água voltaria contra a concha seguinte.' },
        { tipo: 'titulo', label: 'Francis' },
        { id: 'alfa', label: 'Ângulo do distribuidor α₁', min: 8, max: 40, step: 1, valor: 22, unidade: '°',
          desc: 'É o controle de carga: fechar as pás diretrizes reduz a vazão.' },
        { tipo: 'separador' },
        { id: 'etaM', label: 'Rendimento mecânico', min: 88, max: 99, step: 1, valor: 97, unidade: '%' },
        { id: 'etaG', label: 'Rendimento do gerador', min: 85, max: 99, step: 1, valor: 96, unidade: '%' },
        { id: 'animar', tipo: 'check', label: 'Girar o rotor', valor: true },
        { id: 'vel', label: 'Velocidade da animação', min: 0.1, max: 3, step: 0.1, valor: 1, unidade: '×' }
      ],
      graficos: [
        { id: 'maq', axes: false, height: 380, grid: false, legend: false },
        { id: 'rend', titulo: 'Rendimento hidráulico em função da relação u/V₁',
          xlabel: 'u / V₁', ylabel: 'Rendimento hidráulico', aspect: 0.34, legendPos: 'topright' },
        { id: 'ns', titulo: 'Rotação específica e o tipo de turbina adequado',
          xlabel: '', ylabel: 'n_s', aspect: 0.30, legend: false }
      ],
      saidas: [
        { id: 'Pdisp', label: 'Potência disponível' },
        { id: 'V1', label: 'Velocidade do jato V₁' },
        { id: 'u', label: 'Velocidade do rotor u' },
        { id: 'etaH', label: 'Rendimento hidráulico' },
        { id: 'etaT', label: 'Rendimento total' },
        { id: 'Peixo', label: 'Potência de eixo' },
        { id: 'Pel', label: 'Potência elétrica' },
        { id: 'nsOut', label: 'Rotação específica' },
        { id: 'reco', label: 'Turbina indicada' }
      ],
      formulas: [
        { g: 'Potência disponível' },
        { tex: 'P_{\\text{disp}} = \\rho\\,g\\,Q\\,H', d: 'toda a energia que a queda oferece [W]', destaque: true },
        { tex: 'P_{\\text{el}} = \\eta_h\\,\\eta_m\\,\\eta_g\\,\\rho g Q H', d: 'o que efetivamente chega à rede', destaque: true },

        { g: 'Turbina Pelton (ação)' },
        { tex: 'V_1 = k_v\\sqrt{2gH}', d: 'velocidade do jato na saída do injetor; k_v ≈ 0,97', destaque: true },
        { tex: 'F = \\rho\\,Q\\,(V_1 - u)\\,(1 - \\cos\\beta_2)',
          d: 'força na concha: a água entra com V₁−u e sai desviada de β₂' },
        { tex: 'P = \\rho\\,Q\\,u\\,(V_1 - u)(1 - \\cos\\beta_2)', d: 'potência no rotor', destaque: true },
        { tex: '\\eta_h = \\frac{2u(V_1-u)(1-\\cos\\beta_2)}{V_1^{\\,2}}',
          d: 'rendimento hidráulico — máximo em u = V₁/2', destaque: true },
        { tex: '\\frac{\mathrm{d}P}{\mathrm{d}u} = 0 \\;\\Rightarrow\\; u = \\frac{V_1}{2}',
          d: 'a pá deve andar à METADE da velocidade do jato' },
        { tex: '\\beta_2 \\to 180^\\circ', d: 'desvio ideal; usa-se 165° para a água não bater na concha seguinte' },

        { g: 'Turbina Francis (reação)' },
        { tex: 'H = \\frac{u_1 c_{u1} - u_2 c_{u2}}{g}',
          d: 'a mesma equação de Euler, com os papéis trocados: aqui a máquina RETIRA energia', destaque: true },
        { tex: 'c_{u2} = 0 \\;\\Rightarrow\\; H = \\frac{u_1 c_{u1}}{g}',
          d: 'projeto ótimo: a água sai sem rotação residual' },
        { tex: 'c_{u1} = c_1\\cos\\alpha_1', d: 'o distribuidor impõe α₁ e controla a carga da máquina' },

        { g: 'Rotação e escolha do tipo' },
        { tex: 'n = \\frac{60 f}{p}', d: 'rotação síncrona do gerador: f = 60 Hz e p pares de polos', destaque: true },
        { tex: 'n_s = \\frac{n\\sqrt{P}}{H^{5/4}}',
          d: 'rotação específica em potência (P em cv, H em m) — é ela que define o tipo', destaque: true },
        { tex: 'n_s < 30 \\;\\Rightarrow\\; \\text{Pelton}', d: 'alta queda, pouca vazão' },
        { tex: '30 < n_s < 450 \\;\\Rightarrow\\; \\text{Francis}', d: 'faixa mais ampla, média queda' },
        { tex: 'n_s > 450 \\;\\Rightarrow\\; \\text{Kaplan / bulbo}', d: 'baixa queda, muita vazão' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Modelo de água a 20 °C, gerador síncrono em 60 Hz. Para a Francis o rendimento hidráulico é estimado por uma curva típica em função do ângulo do distribuidor; para a Pelton ele sai da própria equação da quantidade de movimento na concha.',
      calcular: function (p, ctx) {
        var Pdisp = RHO * G * p.Q * p.H / 1000;      /* kW */
        var n = 60 * 60 / p.npar;                     /* rpm síncrono, 60 Hz */
        var V1 = p.k * Math.sqrt(2 * G * p.H);
        var u = p.phi * V1;
        var b2r = rad(p.beta2);
        var etaH;
        if (p.tipo === 'pelton') {
          /* eta_h = 2u(V1-u)(1-cos b2)/V1^2 vale 1 no otimo u = V1/2 com b2 = 180 graus.
             O fator k_v^2 desconta a perda do injetor em relacao a queda bruta. */
          etaH = 2 * p.phi * (1 - p.phi) * (1 - Math.cos(b2r)) * p.k * p.k;
        } else {
          /* curva típica da Francis: máximo perto de α₁ = 22° */
          var d = (p.alfa - 22) / 22;
          etaH = 0.93 * (1 - 0.85 * d * d);
        }
        etaH = Math.max(0.02, Math.min(etaH, 0.96));
        var etaT = etaH * p.etaM / 100 * p.etaG / 100;
        var Peixo = Pdisp * etaH * p.etaM / 100;
        var Pel = Pdisp * etaT;

        /* rotação específica em cv (convenção brasileira) */
        var Pcv = Peixo * 1000 / 735.5;
        var ns = n * Math.sqrt(Pcv) / Math.pow(p.H, 1.25);
        var reco = ns < 30 ? 'Pelton' : (ns < 450 ? 'Francis' : 'Kaplan / bulbo');
        var coerente = (p.tipo === 'pelton' && ns < 60) || (p.tipo === 'francis' && ns >= 30);

        var r = { V1: V1, u: u, Pel: Pel, n: n };
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenhaMaq();

        /* ---- curva de rendimento ---- */
        var xs = Plot.linspace(0, 1, 80);
        var gr = ctx.plot('rend').clear();
        gr.line(xs, xs.map(function (x) {
          return Math.max(0, 2 * x * (1 - x) * (1 - Math.cos(b2r)) * p.k * p.k);
        }), { color: Plot.serie(0), width: 2.8, label: 'β₂ = ' + p.beta2 + '° (atual)' });
        if (Math.abs(p.beta2 - 165) > 4) {
          gr.line(xs, xs.map(function (x) {
            return Math.max(0, 2 * x * (1 - x) * (1 - Math.cos(rad(165))) * p.k * p.k);
          }), { color: Plot.serie(1), width: 1.5, dash: [5, 4], label: 'β₂ = 165° (usual)' });
        }
        gr.line(xs, xs.map(function (x) { return Math.max(0, 4 * x * (1 - x)) * p.k * p.k; }),
          { color: Plot.serie(7), width: 1.2, dash: [2, 3], label: 'desvio perfeito (β₂ = 180°)' });
        gr.vline(0.5, { color: Plot.serie(4), dash: [3, 3], width: 1.2, text: 'u/V₁ = 0,5 (ótimo)' });
        if (p.tipo === 'pelton') {
          gr.marker(p.phi, etaH, 'operação: η_h = ' + Plot.sig(etaH, 3), { color: Plot.serie(6) });
        }
        gr.draw();

        /* ---- faixas de rotação específica ---- */
        var gn = ctx.plot('ns').clear();
        gn.o.xcat = [{ v: 0, label: 'Pelton\nn_s < 30' }, { v: 1, label: 'Francis\n30 a 450' },
                     { v: 2, label: 'Kaplan\nn_s > 450' }, { v: 3, label: 'esta máquina' }];
        var vals = [30, 450, 900, ns];
        var cores = [Plot.serie(1), Plot.serie(1), Plot.serie(1), Plot.serie(0)];
        gn.setLimits([-0.6, 3.6], [0, Math.max(900, ns) * 1.2]);
        vals.forEach(function (v, i) {
          gn.bars([i], [v], { color: cores[i], barw: 0.5 });
          gn.text(i, v, (i === 3 ? 'n_s = ' : 'até ') + Plot.sig(v, 4), { align: 'center', dy: -7, size: 11 });
        });
        gn.draw();

        /* ---- passo a passo ---- */
        var nt = Plot.numTex, sig = Plot.sig;
        var passos = [
          { t: 'Potência disponível na queda',
            tex: 'P_{\\text{disp}} = \\rho\\,g\\,Q\\,H',
            texSub: 'P_{\\text{disp}} = 998{,}2 \\cdot 9{,}81 \\cdot ' + nt(p.Q) + ' \\cdot ' + p.H +
              ' = ' + nt(Pdisp) + '\\ \\mathrm{kW}',
            obs: 'é o teto absoluto: nenhuma turbina entrega mais do que isso' },
          { t: 'Rotação síncrona do gerador',
            tex: 'n = \\frac{60 f}{p}',
            texSub: 'n = \\frac{60 \\cdot 60}{' + p.npar + '} = ' + nt(n) + '\\ \\mathrm{rpm}',
            obs: 'a turbina é obrigada a girar nessa rotação para o gerador sincronizar com a rede' }
        ];
        if (p.tipo === 'pelton') {
          passos.push({ t: 'Velocidade do jato na saída do injetor',
            tex: 'V_1 = k_v\\sqrt{2gH}',
            texSub: 'V_1 = ' + nt(p.k) + '\\sqrt{2 \\cdot 9{,}81 \\cdot ' + p.H + '} = ' + nt(V1) + '\\ \\mathrm{m/s}',
            obs: 'toda a queda vira energia cinética: o jato sai à pressão atmosférica' });
          passos.push({ t: 'Velocidade tangencial da concha',
            tex: 'u = \\varphi\\,V_1',
            texSub: 'u = ' + nt(p.phi) + ' \\cdot ' + nt(V1) + ' = ' + nt(u) + '\\ \\mathrm{m/s}',
            obs: Math.abs(p.phi - 0.5) < 0.06 ? 'próximo do ótimo teórico u = V₁/2'
              : 'longe do ótimo u = V₁/2 — o rendimento já sofre com isso' });
          passos.push({ t: 'Rendimento hidráulico pela quantidade de movimento',
            tex: '\\eta_h = \\frac{2u(V_1-u)(1-\\cos\\beta_2)}{V_1^{\\,2}} = 2\\varphi(1-\\varphi)(1-\\cos\\beta_2)\\,k_v^2',
            texSub: '\\eta_h = 2 \\cdot ' + nt(p.phi) + '(1 - ' + nt(p.phi) + ')(1 - \\cos ' +
              p.beta2 + '^\\circ) \\cdot ' + nt(p.k * p.k) + ' = ' + nt(etaH),
            obs: 'com β₂ = ' + p.beta2 + '° o desvio aproveita ' + sig((1 - Math.cos(b2r)) / 2 * 100, 3) +
              ' % do máximo teórico (β₂ = 180° daria 100 %)' });
        } else {
          passos.push({ t: 'Rendimento hidráulico da Francis',
            tex: 'H = \\frac{u_1 c_{u1}}{g} \\quad\\text{com}\\quad c_{u1} = c_1\\cos\\alpha_1',
            texSub: '\\alpha_1 = ' + p.alfa + '^\\circ \\;\\Rightarrow\\; \\eta_h \\approx ' + nt(etaH),
            obs: 'o distribuidor a ' + p.alfa + '° ' +
              (Math.abs(p.alfa - 22) < 4 ? 'está perto do ponto de projeto' : 'está fora do ponto de projeto: há choque na entrada das pás') });
        }
        passos.push({ t: 'Potência de eixo e potência elétrica',
          tex: 'P_{\\text{el}} = \\eta_h\\,\\eta_m\\,\\eta_g\\,P_{\\text{disp}}',
          texSub: 'P_{\\text{el}} = ' + nt(etaH) + ' \\cdot ' + nt(p.etaM / 100) + ' \\cdot ' + nt(p.etaG / 100) +
            ' \\cdot ' + nt(Pdisp) + ' = ' + nt(Pel) + '\\ \\mathrm{kW}',
          obs: 'rendimento total da usina: ' + sig(etaT * 100, 3) + ' %' });
        passos.push({ t: 'Rotação específica e verificação do tipo',
          tex: 'n_s = \\frac{n\\sqrt{P}}{H^{5/4}}',
          texSub: 'n_s = \\frac{' + nt(n) + '\\sqrt{' + nt(Pcv) + '}}{' + p.H + '^{1{,}25}} = ' + nt(ns),
          obs: coerente ? 'coerente com a ' + (p.tipo === 'pelton' ? 'Pelton' : 'Francis') + ' escolhida'
            : 'para n_s = ' + sig(ns, 4) + ' a máquina indicada seria ' + reco });
        ctx.setPassos(passos);

        return {
          Pdisp: { v: Pdisp, u: 'kW' },
          V1: { v: V1, u: 'm/s' },
          u: { v: u, u: 'm/s' },
          etaH: { v: etaH * 100, u: '%' },
          etaT: { v: etaT * 100, u: '%' },
          Peixo: { v: Peixo, u: 'kW' },
          Pel: { v: Pel, u: 'kW', classe: 'destaque' },
          nsOut: { v: ns, u: '' },
          reco: { v: reco, u: '', classe: coerente ? 'ok' : 'alerta' }
        };
      }
    });

    function desenhaMaq() {
      if (!A.ctx || !A.p) return;
      var pl = A.ctx.plot('maq');
      if (!pl) return;
      pl.clear();
      pl.setLimits([0, 1], [0, 1]);
      pl.custom(function (c, plot) {
        if (A.p.tipo === 'pelton') desenharPelton(c, plot, A.p, A.r, A.ang, A.fase);
        else desenharFrancis(c, plot, A.p, A.r, A.ang, A.fase);
      });
      pl.draw();
    }

    registrar(function () {
      if (!A.on || !A.ctx || !A.p) return;
      var dt = A.rel.dt();
      A.ang += TAU * (A.r.n / 60) * dt * 0.03 * A.p.vel;
      if (A.ang > TAU * 1e4) A.ang -= TAU * 1e4;
      A.fase = (A.fase + dt * 0.9 * A.p.vel) % 1;
      desenhaMaq();
    });
  })();

})();

/* ============================================================
   Figuras ilustrativas de Elementos de Máquina II
   Engrenamento, razão de contato, Willis, forças no dente, Lewis,
   contato hertziano, freio, vida L10, Stribeck e correias.
   Cada figura calcula o que mostra com as equações do capítulo.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var rad = function (d) { return d * Math.PI / 180; };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* 1.1 — lei do engrenamento: a linha de ação tangencia os dois círculos de base */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'A linha de ação é tangente aos dois círculos de base e cruza a linha de centros sempre no mesmo ponto primitivo — é essa propriedade da evolvente que mantém a relação de transmissão constante.',
    vista: [-5.6, 5.6, -4.3, 4.3],
    altura: 350,
    controles: [
      { id: 'phi', rot: 'Ângulo de pressão', min: 14.5, max: 25, val: 20, passo: 0.5, un: '°' },
      { id: 'z1', rot: 'Dentes do pinhão', min: 12, max: 40, val: 20, passo: 1 }
    ],
    desenhar: function (g, p) {
      var phi = rad(p.phi), z1 = p.z1, z2 = 40;
      var r2 = 3.1, r1 = r2 * z1 / z2;
      var px = r1 - r2;                     /* ponto primitivo, centrado na vista */
      var c1 = px - r1, c2 = px + r2;
      var sx = Math.sin(phi), cs = Math.cos(phi);
      g.linha(-5.3, 0, 5.3, 0, { cor: 'fraco', larg: 1, tracejado: [4, 4] });
      g.circ(c1, 0, r1, { cor: 's1', larg: 2.2 });
      g.circ(c2, 0, r2, { cor: 's3', larg: 2.2 });
      g.circ(c1, 0, r1 * cs, { cor: 's1', larg: 1.2, tracejado: [5, 4] });
      g.circ(c2, 0, r2 * cs, { cor: 's3', larg: 1.2, tracejado: [5, 4] });
      g.circ(c1, 0, 0.07, { preenche: 's1', cor: null });
      g.circ(c2, 0, 0.07, { preenche: 's3', cor: null });
      /* linha de ação: passa pelo primitivo a φ da tangente comum (a vertical) */
      var a = -r1 * sx - 1.5, b = r2 * sx + 1.5;
      g.linha(px + a * sx, a * cs, px + b * sx, b * cs, { cor: 'erro', larg: 2.2 });
      g.circ(px - r1 * sx * sx, -r1 * sx * cs, 0.1, { preenche: 'erro', cor: null });
      g.circ(px + r2 * sx * sx, r2 * sx * cs, 0.1, { preenche: 'erro', cor: null });
      g.linha(px, -2.2, px, 2.2, { cor: 'suave', larg: 1, tracejado: [3, 3] });
      g.arco(px, 0, 0.95, Math.PI / 2, Math.PI / 2 - phi, { cor: 'suave' });
      g.txt('φ = ' + fx(p.phi, 1) + '°', px - 0.18, 1.0, { cor: 'suave', tam: 11.5, alin: 'dir', fundo: true });
      g.circ(px, 0, 0.11, { preenche: 'texto', cor: null });
      g.txt('ponto primitivo', px, -0.45, { cor: 'texto', tam: 11, fundo: true });
      g.txt('linha de ação', px + b * sx + 0.18, b * cs + 0.3, { cor: 'erro', tam: 11, alin: 'esq', fundo: true });
      g.txt('pinhão ' + z1 + 'z', c1, -r1 - 0.45, { cor: 's1', tam: 11.5, fundo: true });
      g.txt('coroa ' + z2 + 'z', c2, -r2 - 0.45, { cor: 's3', tam: 11.5, fundo: true });
      g.txt('i = z₂/z₁ = ' + fx(z2 / z1, 2), 0, 4.0, { cor: 'texto', tam: 13.5, negrito: true });
      g.txt('tracejado fino: círculos de base · pontos vermelhos: tangências', 0, -4.05, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* 3.1 — razão de contato */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Razão de contato: quantos pares de dentes dividem a carga, em média. Abaixo de 1,2 o engrenamento perde continuidade e fica ruidoso (exemplo 3.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'm', rot: 'Módulo', min: 1, max: 10, val: 4, passo: 0.5, un: 'mm' },
      { id: 'z1', rot: 'Dentes do pinhão', min: 10, max: 60, val: 20, passo: 1 },
      { id: 'z2', rot: 'Dentes da coroa', min: 15, max: 120, val: 40, passo: 1 }
    ],
    desenhar: function (g, p) {
      var m = p.m, z1 = p.z1, z2 = Math.max(p.z2, p.z1), phi = rad(20);
      var sp = Math.sin(phi), cp = Math.cos(phi), pb = Math.PI * m * cp;
      function razao(za, zb) {
        var ra = m * za / 2, rb = m * zb / 2;
        var la = Math.sqrt(Math.pow(ra + m, 2) - Math.pow(ra * cp, 2));
        var lb = Math.sqrt(Math.pow(rb + m, 2) - Math.pow(rb * cp, 2));
        return (la + lb - (ra + rb) * sp) / pb;
      }
      var mp = razao(z1, z2);
      var zmin = 2 / (sp * sp);
      var gx = 1.3, gy = 0.5, gw = 5.9, gh = 4.4;
      var X = function (z) { return gx + gw * (lim(z, 10, 60) - 10) / 50; };
      var Y = function (v) { return gy + gh * (lim(v, 1, 2.2) - 1) / 1.2; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 50; i++) { var z = 10 + i; pts.push([X(z), Y(razao(z, z2))]); }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(gx, Y(1.2), gx + gw, Y(1.2), { cor: 'aviso', larg: 1.4, tracejado: [5, 4] });
      g.txt('mínimo prático 1,2', gx + gw - 0.1, Y(1.2) - 0.28, { cor: 'aviso', tam: 10.5, alin: 'dir' });
      g.linha(X(zmin), gy, X(zmin), gy + gh, { cor: 'erro', larg: 1.2, tracejado: [4, 4] });
      g.txt('z mín ' + fx(zmin, 1), X(zmin), gy + gh + 0.3, { cor: 'erro', tam: 10.5, fundo: true });
      g.circ(X(z1), Y(mp), 0.15, { preenche: 'erro', cor: null });
      [20, 30, 40, 50, 60].forEach(function (z) {
        g.linha(X(z), gy, X(z), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(z + '', X(z), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [1.2, 1.6, 2.0].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 1), gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('dentes do pinhão', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('m_p', gx - 0.26, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.8;
      g.txt('m_p = ' + fx(mp, 3), x0, 5.0, { cor: mp < 1.2 ? 'erro' : 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt('L_ab = ' + fx(mp * pb, 2) + ' mm', x0, 4.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('passo de base p_b = ' + fx(pb, 2) + ' mm', x0, 3.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('distância entre centros ' + fx(m * (z1 + z2) / 2, 1) + ' mm', x0, 2.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('relação i = ' + fx(z2 / z1, 3), x0, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(z1 < zmin ? 'risco de interferência: rebaixe o pé' : 'sem interferência (z₁ ≥ z mín)',
        x0, 1.5, { cor: z1 < zmin ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('ângulo de pressão 20° · dentes de altura padrão (adendo = m)', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 4.1 — trem planetário pela fórmula de Willis */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'O mesmo conjunto planetário entrega relações diferentes conforme o elemento que se fixa — é assim que um câmbio automático troca de marcha sem desengrenar nada.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'zs', rot: 'Dentes do sol', min: 12, max: 60, val: 20, passo: 1 },
      { id: 'za', rot: 'Dentes do anel', min: 50, max: 140, val: 80, passo: 2 },
      { id: 'caso', rot: 'Fixo: 1 anel · 2 sol · 3 braço', min: 1, max: 3, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var zs = p.zs, za = Math.max(p.za, zs + 24), zp = (za - zs) / 2;
      var caso = Math.round(p.caso), i;
      var rel, entrada, saida, fixo, formula;
      if (caso === 1) { rel = 1 + za / zs; entrada = 'sol'; saida = 'braço'; fixo = 'anel'; formula = '1 + z_anel/z_sol'; }
      else if (caso === 2) { rel = 1 + zs / za; entrada = 'anel'; saida = 'braço'; fixo = 'sol'; formula = '1 + z_sol/z_anel'; }
      else { rel = -za / zs; entrada = 'sol'; saida = 'anel'; fixo = 'braço'; formula = '− z_anel/z_sol'; }
      var cx = 3.2, cy = 2.6, R = 2.5, esc = R / (za / 2);
      var rp = (zs / 2 + zp / 2) * esc;
      g.circ(cx, cy, R, { cor: caso === 1 ? 'erro' : 's3', larg: caso === 1 ? 3.2 : 2 });
      g.circ(cx, cy, R + 0.2, { cor: caso === 1 ? 'erro' : 's3', larg: caso === 1 ? 2 : 1.2 });
      /* braço: a circunferência que liga os centros dos planetas */
      g.circ(cx, cy, rp, { cor: caso === 3 ? 'erro' : 'forte', larg: caso === 3 ? 3.4 : 1.8, tracejado: [6, 4] });
      for (i = 0; i < 3; i++) {
        var ang = 2 * Math.PI * i / 3 + 0.35;
        g.circ(cx + rp * Math.cos(ang), cy + rp * Math.sin(ang), zp / 2 * esc,
          { cor: 's2', larg: 1.8, preenche: 's2', alfa: 0.18 });
      }
      g.circ(cx, cy, zs / 2 * esc, { cor: caso === 2 ? 'erro' : 's1', larg: caso === 2 ? 3.2 : 2, preenche: 's1', alfa: 0.18 });
      g.circ(cx, cy, 0.12, { preenche: 'texto', cor: null });
      g.txt('anel ' + za + 'z', cx, cy - R - 0.45, { cor: caso === 1 ? 'erro' : 's3', tam: 11, fundo: true });
      g.txt('sol ' + zs + 'z', cx, cy + 0.4, { cor: caso === 2 ? 'erro' : 's1', tam: 11, fundo: true });
      g.txt('planeta ' + fx(zp, 0) + 'z', cx + 1.8, cy + 2.6, { cor: 's2', tam: 11, fundo: true });
      var bx = cx + rp * Math.cos(3.9), by = cy + rp * Math.sin(3.9);
      g.linha(bx, by, cx - 2.9, cy - 2.05, { cor: caso === 3 ? 'erro' : 'fraco', larg: 1, tracejado: [3, 3] });
      g.txt('braço', cx - 3.0, cy - 2.1, { cor: caso === 3 ? 'erro' : 'suave', tam: 11, alin: 'esq', fundo: true });
      var x0 = 7.0;
      g.txt('elemento fixo: ' + fixo, x0, 5.0, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('entrada ' + entrada + ' → saída ' + saida, x0, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('relação = ' + formula, x0, 3.6, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('= ' + fx(rel, 3), x0, 2.9, { cor: 's1', tam: 16, alin: 'esq', negrito: true });
      g.txt(rel < 0 ? 'sentido invertido na saída' : 'mesmo sentido na saída', x0, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('torque de saída ' + fx(Math.abs(rel), 2) + '× o de entrada', x0, 1.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('planeta: z = (z_anel − z_sol)/2 = ' + fx(zp, 0), x0, 0.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('Willis: (n_última − n_braço)/(n_primeira − n_braço) = produto das relações dos pares', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 5.1 — decomposição das forças no dente */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'A força age na linha de ação: só a componente tangencial transmite torque; a radial apenas carrega os mancais, e em dentes helicoidais aparece ainda a axial.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'T', rot: 'Torque', min: 20, max: 500, val: 100, passo: 10, un: 'N·m' },
      { id: 'd', rot: 'Diâmetro primitivo', min: 40, max: 300, val: 100, passo: 5, un: 'mm' },
      { id: 'psi', rot: 'Ângulo de hélice', min: 0, max: 35, val: 0, passo: 1, un: '°' }
    ],
    desenhar: function (g, p) {
      var T = p.T * 1000, d = p.d, psi = rad(p.psi), phi = rad(20);
      var Wt = 2 * T / d;
      var Wr = Wt * Math.tan(phi) / Math.cos(psi);
      var Wa = Wt * Math.tan(psi);
      var W = Math.sqrt(Wt * Wt + Wr * Wr + Wa * Wa);
      var cx = 2.9, cy = 2.5, R = 1.9;
      g.circ(cx, cy, R, { cor: 's1', larg: 2.2, preenche: 's1', alfa: 0.12 });
      g.circ(cx, cy, R * 0.22, { cor: 'forte', larg: 1.6 });
      g.circ(cx, cy, 0.09, { preenche: 'texto', cor: null });
      var qx = cx + R, qy = cy, esc = 1.9 / Wt;
      g.seta(qx, qy, 0, Wt * esc, { cor: 'erro', larg: 2.4, rot: 'W_t ' + fx(Wt, 0) + ' N', rotTam: 11.5, rotDx: 0.6, rotDy: 0.3 });
      g.seta(qx, qy, -Wr * esc, 0, { cor: 's3', larg: 2.2, rot: 'W_r ' + fx(Wr, 0) + ' N', rotTam: 11.5, rotDx: -0.15, rotDy: 0.42 });
      if (p.psi > 0) g.seta(qx, qy, Wa * esc * 0.75, -Wa * esc * 0.75, { cor: 's4', larg: 2, rot: 'W_a ' + fx(Wa, 0) + ' N', rotTam: 11, rotDx: 0.85, rotDy: -0.25 });
      g.arco(cx, cy, R * 0.5, 0.5, 2.0, { cor: 'suave', ponta: true, larg: 1.8 });
      g.txt('T', cx - 0.7, cy + 1.1, { cor: 'suave', tam: 12.5, negrito: true });
      g.cota(cx, cy - 0.8, cx + R, cy - 0.8, 'd/2 = ' + fx(d / 2, 1) + ' mm', { dy: -0.36 });
      var x0 = 6.6;
      g.txt('W_t = 2T/d = ' + fx(Wt, 0) + ' N', x0, 5.0, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('W_r = W_t·tanφ/cosψ = ' + fx(Wr, 0) + ' N', x0, 4.2, { cor: 's3', tam: 12.5, alin: 'esq' });
      g.txt('W_a = W_t·tanψ = ' + fx(Wa, 0) + ' N', x0, 3.5, { cor: 's4', tam: 12.5, alin: 'esq' });
      g.txt('resultante ' + fx(W, 0) + ' N', x0, 2.8, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(p.psi > 0 ? 'hélice de ' + p.psi + '°: exige mancal axial' : 'dentes retos: nenhuma carga axial',
        x0, 2.0, { cor: p.psi > 0 ? 'aviso' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('a 1500 rpm isso equivale a ' + fx(T * 2 * Math.PI * 25 / 1e6, 2) + ' kW', x0, 1.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('ângulo de pressão normal de 20°', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 6.1 — Lewis e os fatores AGMA */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'O dente tratado como viga em balanço engastada na raiz: a tensão cai com o módulo e com a largura de face, e os fatores AGMA depois corrigem o que Lewis ignora (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'Wt', rot: 'Força tangencial', min: 200, max: 5000, val: 1000, passo: 100, un: 'N' },
      { id: 'm', rot: 'Módulo', min: 1, max: 10, val: 4, passo: 0.5, un: 'mm' },
      { id: 'Ff', rot: 'Largura de face', min: 10, max: 120, val: 40, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var Wt = p.Wt, m = p.m, Ff = p.Ff;
      var Y = 0.322;                             /* pinhão de 20 dentes a 20° */
      var sig = Wt / (Ff * m * Y);
      var kAGMA = 1.7, agma = sig * kAGMA, adm = 200;
      var cx = 2.8, base = 0.9;
      var h = 1.5 + 1.0 * (m / 10), b = 0.55 + 0.55 * (m / 10);
      g.caminho([[cx - b, base], [cx - b * 0.78, base + h], [cx - b * 0.3, base + h * 1.22],
                 [cx + b * 0.3, base + h * 1.22], [cx + b * 0.78, base + h], [cx + b, base]],
        { cor: 'forte', larg: 2, preenche: 'acento', alfa: 0.22 });
      g.linha(cx - b * 1.9, base, cx + b * 1.9, base, { cor: 'forte', larg: 2.4 });
      g.hachura(cx - b * 1.9, base - 0.04, b * 3.8, 0, { cor: 'forte', d: 0.22 });
      g.seta(cx - b * 0.3 - 1.4, base + h * 1.12, 1.1, 0, { cor: 'erro', larg: 2.4, rot: 'W_t', rotTam: 12, rotDx: -0.85, rotDy: 0.4 });
      g.txt('raiz: onde a flexão é máxima', cx, base - 0.62, { cor: 'fraco', tam: 10.5 });
      g.cota(cx - b, base + h * 1.45, cx + b, base + h * 1.45, 'espessura t', { dy: 0.32 });
      var x0 = 6.2;
      g.txt('fator de forma Y = ' + fx(Y, 3), x0, 5.0, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('σ = W_t /(F·m·Y) = ' + fx(sig, 1) + ' MPa', x0, 4.2, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('× fatores AGMA (≈' + fx(kAGMA, 1) + ') = ' + fx(agma, 1) + ' MPa', x0, 3.4, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      var lmax = 5.6, frac = lim(agma / (adm * 1.5), 0, 1);
      g.ret(x0, 2.25, lmax * frac, 0.45, { preenche: agma > adm ? 'erro' : 'ok', cor: null, alfa: 0.8 });
      g.ret(x0, 2.25, lmax, 0.45, { cor: 'borda', larg: 1 });
      g.linha(x0 + lmax / 1.5, 2.1, x0 + lmax / 1.5, 2.85, { cor: 'texto', larg: 1.8 });
      g.txt('limite ' + adm + ' MPa', x0 + lmax / 1.5 - 0.12, 3.0, { cor: 'texto', tam: 10.5, alin: 'dir' });
      g.txt(agma > adm ? 'passou do admissível: suba o módulo' : 'dentro do admissível à flexão',
        x0, 1.6, { cor: agma > adm ? 'aviso' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt('dobrar o módulo divide σ por dois; dobrar a largura também,', x0, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('mas piora a distribuição de carga ao longo do dente', x0, 0.45, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('pinhão de 20 dentes a 20° · fatores AGMA estimados em 1,7 no conjunto', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.1 — contato hertziano */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Os flancos se tocam numa faixa de centésimos de milímetro: a pressão chega a centenas de MPa e é ela, não a flexão, que descasca o dente por pitting (exemplo 7.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'F', rot: 'Força normal', min: 200, max: 5000, val: 1000, passo: 100, un: 'N' },
      { id: 'L', rot: 'Largura em contato', min: 10, max: 120, val: 40, passo: 5, un: 'mm' },
      { id: 'd1', rot: 'Diâmetro do pinhão', min: 20, max: 200, val: 80, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var Fn = p.F, L = p.L, d1 = p.d1, d2 = 2 * d1, E = 207000, v = 0.3;
      var b = Math.sqrt(2 * Fn / (Math.PI * L) * (2 * (1 - v * v) / E) / (2 / d1 + 2 / d2));
      var pmax = 2 * Fn / (Math.PI * b * L);
      var cx = 1.9, cy = 2.9;
      var r1 = 0.6 + 0.4 * (d1 / 200), r2 = 2 * r1;
      g.circ(cx, cy + r1 + 0.04, r1, { cor: 's1', larg: 2, preenche: 's1', alfa: 0.12 });
      g.circ(cx, cy - r2 - 0.04, r2, { cor: 's3', larg: 2, preenche: 's3', alfa: 0.12 });
      g.txt('pinhão', cx, cy + 2 * r1 + 0.4, { cor: 's1', tam: 11, fundo: true });
      g.txt('coroa', cx, cy - 2 * r2 - 0.4, { cor: 's3', tam: 11, fundo: true });
      g.circ(cx, cy, 0.09, { preenche: 'erro', cor: null });
      /* inset: distribuição elíptica de pressão, ampliada */
      var ix = 5.1, iy = 1.8, iw = 1.0, ih = 1.6;
      g.linha(cx + 0.14, cy, ix - iw - 0.25, iy + ih * 0.5, { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      var i, pts = [];
      for (i = 0; i <= 40; i++) { var f = -1 + 2 * i / 40; pts.push([ix + f * iw, iy + ih * Math.sqrt(Math.max(0, 1 - f * f))]); }
      g.caminho(pts, { cor: 'erro', larg: 2, preenche: 'erro', alfa: 0.2, fechar: true });
      g.linha(ix - iw * 1.5, iy, ix + iw * 1.5, iy, { cor: 'forte', larg: 2 });
      g.seta(ix, iy, 0, ih, { cor: 'erro', larg: 1.4, ponta: 0.18 });
      g.txt('p máx', ix + 0.15, iy + ih + 0.3, { cor: 'erro', tam: 11, alin: 'esq' });
      g.cota(ix - iw, iy - 0.4, ix + iw, iy - 0.4, '2b = ' + fx(2 * b, 3) + ' mm', { dy: -0.34 });
      g.txt('(ampliado)', ix - 0.12, iy + ih + 0.75, { cor: 'fraco', tam: 10.5, alin: 'dir' });
      var x0 = 7.0;
      g.txt('semilargura b = ' + fx(b, 4) + ' mm', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('p máx = 2F/(π b L) = ' + fx(pmax, 0) + ' MPa', x0, 4.1, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('área de contato ' + fx(2 * b * L, 2) + ' mm²', x0, 3.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('pressão média ' + fx(Fn / (2 * b * L), 0) + ' MPa', x0, 2.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(pmax > 1200 ? 'acima do usual: pitting em poucos ciclos' : 'na faixa usual de engrenagens endurecidas',
        x0, 1.9, { cor: pmax > 1200 ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('p máx cresce com a raiz da força: dobrar F sobe só 41 %', x0, 1.1, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('aço com E = 207 GPa e ν = 0,3 · cilindros equivalentes em contato linear', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 10.1 — freio a disco */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Freio a disco pelo critério de desgaste uniforme: o torque cresce rápido com o raio externo, mas toda a energia do veículo vira calor na mesma pastilha (exemplo 10.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'ri', rot: 'Raio interno da pastilha', min: 20, max: 120, val: 50, passo: 5, un: 'mm' },
      { id: 'ro', rot: 'Raio externo', min: 40, max: 200, val: 100, passo: 5, un: 'mm' },
      { id: 'pm', rot: 'Pressão máxima', min: 0.2, max: 3, val: 1, passo: 0.1, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var ro = p.ro, ri = Math.min(p.ri, ro - 10), pm = p.pm, mu = 0.35;
      var T = 2 * mu * pm * Math.PI * ri * (ro * ro - ri * ri) / 1000;
      var Fax = 2 * Math.PI * pm * ri * (ro - ri) / 1000;
      var area = 2 * (1.2 / 2) * (ro * ro - ri * ri) / 100;   /* dois setores de 1,2 rad, em cm² */
      var cx = 2.8, cy = 2.4, esc = 1.95 / ro;
      g.circ(cx, cy, ro * esc, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.5 });
      g.circ(cx, cy, ri * esc, { cor: 'forte', larg: 1.4, tracejado: [4, 3] });
      g.circ(cx, cy, Math.max(0.12, ri * esc * 0.35), { cor: 'forte', larg: 1.4 });
      var i, j;
      for (i = 0; i < 2; i++) {
        var a0 = i * Math.PI + 0.5, a1 = a0 + 1.2, pts = [], a;
        for (j = 0; j <= 12; j++) { a = a0 + (a1 - a0) * j / 12; pts.push([cx + ro * esc * Math.cos(a), cy + ro * esc * Math.sin(a)]); }
        for (j = 12; j >= 0; j--) { a = a0 + (a1 - a0) * j / 12; pts.push([cx + ri * esc * Math.cos(a), cy + ri * esc * Math.sin(a)]); }
        g.caminho(pts, { cor: 'erro', larg: 1.6, fechar: true, preenche: 'erro', alfa: 0.28 });
      }
      g.arco(cx, cy, ro * esc + 0.3, 0.2, 1.3, { cor: 'suave', ponta: true, larg: 1.8 });
      g.txt('pastilhas', cx, cy + ro * esc + 0.6, { cor: 'erro', tam: 11, fundo: true });
      g.cota(cx, cy + 0.2, cx + ri * esc, cy + 0.2, 'r_i', { dy: 0.3 });
      g.cota(cx, cy - 0.26, cx + ro * esc, cy - 0.26, 'r_o', { dy: -0.34 });
      var x0 = 6.4;
      g.txt('T = 2 µ p_máx π r_i (r_o² − r_i²)', x0, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T = ' + fx(T, 0) + ' N·m', x0, 4.3, { cor: 'erro', tam: 15.5, alin: 'esq', negrito: true });
      g.txt('força de aperto ' + fx(Fax, 1) + ' kN', x0, 3.5, { cor: 'suave', tam: 12.5, alin: 'esq' });
      g.txt('área de atrito ' + fx(area, 1) + ' cm² · µ = 0,35 · 2 faces', x0, 2.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      var E = 0.5 * 1500 * Math.pow(100 / 3.6, 2) / 1e6;
      g.txt('frear 1,5 t de 100 km/h dissipa ' + fx(E, 2) + ' MJ', x0, 2.1, { cor: 'aviso', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('num disco de ~8 kg de ferro fundido isso são', x0, 1.5, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('centenas de °C — daí o fade e os discos ventilados', x0, 1.05, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('critério de desgaste uniforme: a pressão máxima ocorre no raio interno', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 11.1 — vida de rolamento */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'A vida do rolamento cai com o cubo da carga: dobrar a carga divide a vida por oito. Pequenas sobrecargas de montagem custam anos de serviço (exemplo 11.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'C', rot: 'Capacidade dinâmica C', min: 5, max: 80, val: 25.5, passo: 0.5, un: 'kN' },
      { id: 'P', rot: 'Carga equivalente P', min: 1, max: 30, val: 5, passo: 0.5, un: 'kN' },
      { id: 'n', rot: 'Rotação', min: 100, max: 3600, val: 1500, passo: 50, un: 'rpm' }
    ],
    desenhar: function (g, p) {
      var C = p.C, P = p.P, n = p.n;
      var L10 = Math.pow(C / P, 3);
      var Lh = L10 * 1e6 / (60 * n);
      var gx = 1.3, gy = 0.6, gw = 5.9, gh = 4.3;
      var X = function (v) { return gx + gw * lim(v, 0, 30) / 30; };
      var Y = function (h) { return gy + gh * (Math.log10(lim(h, 100, 1e6)) - 2) / 4; };
      [1000, 10000, 100000].forEach(function (h) {
        g.linha(gx, Y(h), gx + gw, Y(h), { cor: 'borda', larg: 1, tracejado: [5, 4] });
        g.txt((h / 1000) + ' mil h', gx + gw - 0.15, Y(h) + 0.24, { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 1; i <= 120; i++) {
        var pp = 30 * i / 120;
        pts.push([X(pp), Y(Math.pow(C / pp, 3) * 1e6 / (60 * n))]);
      }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.linha(X(P), gy, X(P), Y(Lh), { cor: 'erro', larg: 1, tracejado: [3, 3] });
      g.circ(X(P), Y(Lh), 0.15, { preenche: 'erro', cor: null });
      [5, 10, 15, 20, 25, 30].forEach(function (pp) {
        g.linha(X(pp), gy, X(pp), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(pp + '', X(pp), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('carga equivalente P (kN)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('vida (h)', gx - 0.26, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.7;
      g.txt('L₁₀ = (C/P)³', x0, 5.0, { cor: 'fraco', tam: 12, alin: 'esq' });
      g.txt('C/P = ' + fx(C / P, 2), x0, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt(fx(L10, 1) + ' milhões de voltas', x0, 3.6, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt(fx(Lh, 0) + ' h de serviço', x0, 2.8, { cor: 'erro', tam: 15.5, alin: 'esq', negrito: true });
      g.txt(Lh > 20000 ? 'serve para serviço contínuo' : Lh > 5000 ? 'serve para serviço intermitente' : 'vida curta: suba de tamanho',
        x0, 2.0, { cor: Lh > 20000 ? 'ok' : Lh > 5000 ? 'aviso' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('10 % de sobrecarga tira ' + fx(100 * (1 - 1 / Math.pow(1.1, 3)), 0) + ' % da vida', x0, 1.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('L₁₀: vida que 90 % dos rolamentos iguais alcançam (ISO 281)', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 12.1 — curva de Stribeck */
  F('#fig-12-1', {
    titulo: 'Figura 12.1',
    legenda: 'Curva de Stribeck: o atrito despenca quando o filme se forma e volta a subir quando o óleo é grosso demais. Toda partida e toda parada atravessam a faixa de desgaste.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'mu', rot: 'Viscosidade do óleo', min: 5, max: 200, val: 50, passo: 5, un: 'mPa·s' },
      { id: 'n', rot: 'Rotação', min: 10, max: 3000, val: 1000, passo: 10, un: 'rpm' },
      { id: 'P', rot: 'Pressão no mancal', min: 0.5, max: 10, val: 2, passo: 0.5, un: 'MPa' }
    ],
    desenhar: function (g, p) {
      var visc = p.mu / 1000, n = p.n / 60, P = p.P * 1e6;
      var S = visc * n / P * 1e7;              /* µN/P em unidades de 10⁻⁷ */
      function atrito(s) { return 0.12 * Math.exp(-s / 0.6) + 0.0015 + 0.0035 * s; }
      var f = atrito(S);
      var gx = 1.3, gy = 0.7, gw = 6.0, gh = 4.2;
      var X = function (s) { return gx + gw * lim(s, 0, 8) / 8; };
      var Y = function (v) { return gy + gh * lim(v, 0, 0.14) / 0.14; };
      g.ret(gx, gy, X(0.6) - gx, gh, { preenche: 'erro', cor: null, alfa: 0.09 });
      g.ret(X(0.6), gy, X(1.8) - X(0.6), gh, { preenche: 'aviso', cor: null, alfa: 0.09 });
      g.ret(X(1.8), gy, gx + gw - X(1.8), gh, { preenche: 'ok', cor: null, alfa: 0.09 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      for (i = 0; i <= 100; i++) { var s = 8 * i / 100; pts.push([X(s), Y(atrito(s))]); }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      g.circ(X(S), Y(f), 0.15, { preenche: 'erro', cor: null });
      g.txt('limite', X(0.3), gy + gh - 0.28, { cor: 'erro', tam: 10.5 });
      g.txt('misto', X(1.2), gy + gh - 0.75, { cor: 'aviso', tam: 10.5 });
      g.txt('hidrodinâmico', X(4.6), gy + gh - 0.28, { cor: 'ok', tam: 10.5 });
      [2, 4, 6, 8].forEach(function (s) {
        g.linha(X(s), gy, X(s), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(s + '', X(s), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('µN/P  (×10⁻⁷)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('atrito f', gx - 0.26, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.9;
      g.txt('µN/P = ' + fx(S, 2) + ' ×10⁻⁷', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('f ≈ ' + fx(f, 4), x0, 4.2, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt(S < 0.6 ? 'regime limite: há contato' : S < 1.8 ? 'regime misto: o filme rompe' : 'hidrodinâmico: filme completo',
        x0, 3.4, { cor: S < 0.6 ? 'erro' : S < 1.8 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('à direita do vale o atrito volta', x0, 2.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('a crescer: óleo grosso demais só', x0, 2.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('gera calor sem proteger mais', x0, 1.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('baixe a rotação e o ponto anda para a esquerda: o desgaste se concentra na partida', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* 13.1 — correias */
  F('#fig-13-1', {
    titulo: 'Figura 13.1',
    legenda: 'A capacidade da correia vem da razão entre as trações, que cresce exponencialmente com o atrito e com o arco de contato — e o efeito de cunha da correia em V multiplica o atrito efetivo.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Correia: 1 plana · 2 em V', min: 1, max: 2, val: 1, passo: 1 },
      { id: 'theta', rot: 'Arco de contato', min: 120, max: 220, val: 165, passo: 5, un: '°' },
      { id: 'mu', rot: 'Coeficiente de atrito', min: 0.15, max: 0.6, val: 0.3, passo: 0.05 }
    ],
    desenhar: function (g, p) {
      var tipo = Math.round(p.tipo), th = rad(p.theta), mu = p.mu, beta = rad(38);
      var muEf = tipo === 1 ? mu : mu / Math.sin(beta / 2);
      var razao = Math.exp(muEf * th);
      var Ti = 1000;                            /* tração inicial de referência */
      var T1 = 2 * Ti * razao / (1 + razao), T2 = 2 * Ti / (1 + razao);
      var Pot = (T1 - T2) * 10 / 1000;          /* kW a 10 m/s */
      var cor = tipo === 1 ? 's1' : 's2', larg = tipo === 1 ? 2.6 : 4.2;
      /* a geometria segue o arco pedido: γ = (π − θ)/2 dá a inclinação das tangentes */
      var gam = (Math.PI - th) / 2, sg = Math.sin(gam);
      var S = 2.875, d = S + 0.55;               /* folga de 0,55 entre as polias */
      var rA = (S - d * sg) / 2, rB = (S + d * sg) / 2;
      var cy = 2.5, c1 = 0.5 + rA, c2 = c1 + d;
      var at = Math.PI / 2 + gam;                 /* ângulo dos pontos de tangência */
      var ax = Math.cos(at), ay = Math.sin(at);
      g.circ(c1, cy, rA, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.5 });
      g.circ(c2, cy, rB, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.5 });
      g.circ(c1, cy, 0.1, { preenche: 'texto', cor: null });
      g.circ(c2, cy, 0.1, { preenche: 'texto', cor: null });
      g.linha(c1 + rA * ax, cy + rA * ay, c2 + rB * ax, cy + rB * ay, { cor: cor, larg: larg });
      g.linha(c1 + rA * ax, cy - rA * ay, c2 + rB * ax, cy - rB * ay, { cor: cor, larg: larg });
      g.arco(c1, cy, rA, at, 2 * Math.PI - at, { cor: cor, larg: larg });
      g.arco(c2, cy, rB, -at, at, { cor: cor, larg: larg });
      g.arco(c1, cy, rA + 0.32, at, 2 * Math.PI - at, { cor: 'erro', larg: 1.4, tracejado: [4, 3] });
      g.txt('θ = ' + fx(p.theta, 0) + '°', c1, cy + rA + 0.8, { cor: 'erro', tam: 11, fundo: true });
      g.txt('T₁ lado tenso', (c1 + c2) / 2 + 0.3, cy + (rA + rB) / 2 * ay + 0.4, { cor: 'erro', tam: 11, fundo: true });
      g.txt('T₂ lado frouxo', (c1 + c2) / 2 + 0.3, cy - (rA + rB) / 2 * ay - 0.42, { cor: 's3', tam: 11, fundo: true });
      g.arco(c2, cy, rB * 0.55, 0.4, 1.9, { cor: 'suave', ponta: true, larg: 1.6 });
      var x0 = 7.4;
      g.txt(tipo === 1 ? 'correia plana' : 'correia em V (β = 38°)', x0, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(tipo === 1 ? 'µ efetivo = µ = ' + fx(muEf, 3) : 'µ efetivo = µ/sen(β/2) = ' + fx(muEf, 3),
        x0, 4.3, { cor: 's2', tam: 12, alin: 'esq', negrito: true });
      g.txt('T₁/T₂ = e^(µθ) = ' + fx(razao, 2), x0, 3.5, { cor: 'erro', tam: 14.5, alin: 'esq', negrito: true });
      g.txt('com tração inicial de 1 kN:', x0, 2.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('T₁ = ' + fx(T1, 0) + ' N · T₂ = ' + fx(T2, 0) + ' N', x0, 2.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('a 10 m/s transmite ' + fx(Pot, 1) + ' kW', x0, 1.5, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('quem limita é a polia de menor arco de contato — daí o diâmetro mínimo recomendado', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

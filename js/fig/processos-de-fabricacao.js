/* ============================================================
   Figuras ilustrativas de Processos de Fabricação I
   Chvorinov, curva de escoamento, laminação, recalque, dobra,
   aporte térmico, ciclo térmico e ensaios — todos calculados.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };

  /* 1.1 — escolha do processo de fundição */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Cada processo de fundição ocupa uma faixa de lote, tolerância e custo de ferramental. A escolha é econômica tanto quanto técnica.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'pr', rot: 'Processo (1 areia · 2 cera perdida · 3 coquilha · 4 sob pressão)', min: 1, max: 4, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var pr = {
        1: { n: 'Areia verde', tol: 1.5, rug: 12, lote: 1, ferr: 1, peso: 'até toneladas', mat: 'qualquer metal', cor: 's1' },
        2: { n: 'Cera perdida', tol: 0.2, rug: 2, lote: 3, ferr: 4, peso: 'gramas a dezenas de kg', mat: 'aços, superligas', cor: 's2' },
        3: { n: 'Coquilha (molde metálico)', tol: 0.5, rug: 5, lote: 6, ferr: 6, peso: 'até ~50 kg', mat: 'não ferrosos', cor: 's3' },
        4: { n: 'Injeção sob pressão', tol: 0.1, rug: 1.5, lote: 9, ferr: 9, peso: 'até ~20 kg', mat: 'Al, Zn, Mg', cor: 's4' }
      }[p.pr];
      var x0 = 1.2, esc = 5.4;
      var barras = [['tolerância (mm)', pr.tol / 1.5, fx(pr.tol, 2)], ['rugosidade Ra (µm)', pr.rug / 12, fx(pr.rug, 1)],
                    ['lote mínimo viável', pr.lote / 9, ['', 'unitário', '', 'dezenas', '', '', 'centenas', '', '', 'milhares'][pr.lote]],
                    ['custo de ferramental', pr.ferr / 9, ['', 'baixo', '', '', 'médio', '', 'alto', '', '', 'muito alto'][pr.ferr]]];
      g.txt(pr.n, x0, 5.2, { cor: pr.cor, tam: 15, alin: 'esq', negrito: true });
      barras.forEach(function (b, i) {
        var y = 4.1 - i * 1.0;
        g.txt(b[0], x0, y + 0.55, { cor: 'suave', tam: 11.5, alin: 'esq' });
        g.ret(x0, y, esc * b[1], 0.5, { preenche: pr.cor, cor: null, alfa: 0.8 });
        g.ret(x0, y, esc, 0.5, { cor: 'borda', larg: 1 });
        g.txt(b[2], x0 + esc + 0.25, y + 0.25, { cor: pr.cor, tam: 11.5, alin: 'esq', negrito: true });
      });
      var bx = 8.6;
      g.txt('peso típico', bx, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(pr.peso, bx, 3.8, { cor: 'texto', tam: 12, alin: 'esq' });
      g.txt('materiais', bx, 2.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(pr.mat, bx, 2.3, { cor: 'texto', tam: 12, alin: 'esq' });
      g.txt('molde ' + (p.pr <= 2 ? 'perdido' : 'permanente'), bx, 1.4, { cor: p.pr <= 2 ? 's1' : 's3', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('quanto melhor a tolerância, mais caro o ferramental — e maior o lote necessário', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 2.1 — Chvorinov e massalote */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'Regra de Chvorinov: quem tem módulo V/A maior solidifica depois. O massalote precisa de módulo maior que o da peça para alimentá-la (exemplo 2.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'a', rot: 'Lado da placa', min: 50, max: 200, val: 100, passo: 5, un: 'mm' },
      { id: 'e', rot: 'Espessura', min: 5, max: 60, val: 20, passo: 1, un: 'mm' },
      { id: 'B', rot: 'Constante do molde B', min: 0.5, max: 4, val: 2, passo: 0.1, un: 's/mm²' }
    ],
    desenhar: function (g, p) {
      var a = p.a, e = p.e, B = p.B;
      var V = a * a * e, A = 2 * a * a + 4 * a * e, M = V / A;
      var ts = B * M * M;
      var Mm = 1.25 * M, Dm = 5 * Mm;          /* cilindro com H = D: V/A = D/5 */
      var tm = B * Mm * Mm;
      var esc = 2.0 / 200, ox = 2.4, cy = 3.0;
      g.ret(ox - a * esc / 2, cy - e * esc / 2, a * esc, e * esc, { preenche: 'acento', cor: 'forte', larg: 1.6, alfa: 0.35 });
      g.txt('peça', ox, cy - e * esc / 2 - 0.5, { cor: 'suave', tam: 11.5 });
      var mx = ox + a * esc / 2 + Dm * esc / 2 + 0.4;
      g.ret(mx - Dm * esc / 2, cy - Dm * esc / 2, Dm * esc, Dm * esc, { preenche: 's2', cor: 'forte', larg: 1.6, alfa: 0.35 });
      g.txt('massalote', mx, cy - Dm * esc / 2 - 0.5, { cor: 's2', tam: 11.5 });
      var x0 = 7.0;
      g.txt('módulo da peça V/A = ' + fx(M, 2) + ' mm', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('t solidificação = ' + fx(ts, 0) + ' s', x0, 4.2, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('massalote (H = D)', x0, 3.3, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('D = ' + fx(Dm, 0) + ' mm → t = ' + fx(tm, 0) + ' s', x0, 2.6, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('solidifica ' + fx(tm / ts, 2) + '× depois da peça', x0, 1.9, { cor: 'ok', tam: 11.5, alin: 'esq' });
      g.txt('rendimento metálico ≈ ' + fx(100 * V / (V + Math.PI * Math.pow(Dm, 3) / 4), 0) + ' %', x0, 1.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('o massalote vira sucata: o projeto busca o menor que ainda alimente', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 3.1 — curva de escoamento */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Curva de escoamento a frio: a tensão cresce com a deformação (encruamento). A média é o que entra nas fórmulas de força dos processos.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'K', rot: 'Coeficiente K', min: 300, max: 1400, val: 550, passo: 25, un: 'MPa' },
      { id: 'n', rot: 'Expoente n', min: 0.05, max: 0.5, val: 0.22, passo: 0.01 },
      { id: 'eps', rot: 'Deformação verdadeira', min: 0.02, max: 1.2, val: 0.13, passo: 0.01 }
    ],
    desenhar: function (g, p) {
      var K = p.K, n = p.n, eps = p.eps;
      var Yf = K * Math.pow(eps, n), Ybar = Yf / (1 + n);
      var gx = 1.3, gy = 1.0, gw = 6.2, gh = 4.2;
      var smax = K * Math.pow(1.2, n) * 1.05;
      var X = function (e) { return gx + gw * e / 1.2; }, Y = function (sv) { return gy + gh * sv / smax; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 1; i <= 60; i++) { var e = 1.2 * i / 60; pts.push([X(e), Y(K * Math.pow(e, n))]); }
      g.caminho(pts, { cor: 's1', larg: 2.6 });
      var area = [];
      for (i = 1; i <= 40; i++) { var e2 = eps * i / 40; area.push([X(e2), Y(K * Math.pow(e2, n))]); }
      g.caminho([[X(0), Y(0)]].concat(area, [[X(eps), Y(0)]]), { cor: null, preenche: 's1', alfa: 0.2, fechar: true });
      g.circ(X(eps), Y(Yf), 0.15, { preenche: 'erro', cor: null });
      g.linha(gx, Y(Ybar), X(eps), Y(Ybar), { cor: 's3', larg: 1.6, tracejado: [5, 4] });
      g.txt('Ȳ média', gx + 0.15, Y(Ybar) + 0.3, { cor: 's3', tam: 10.5, alin: 'esq' });
      [0.3, 0.6, 0.9, 1.2].forEach(function (e3) {
        g.linha(X(e3), gy, X(e3), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(fx(e3, 1), X(e3), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('deformação verdadeira', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      g.txt('tensão (MPa)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.2;
      g.txt('Yf = Kεⁿ = ' + fx(Yf, 0) + ' MPa', x0, 4.8, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('Ȳ = Kεⁿ/(1+n) = ' + fx(Ybar, 0) + ' MPa', x0, 4.0, { cor: 's3', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('redução equivalente ' + fx(100 * (1 - Math.exp(-eps)), 1) + ' %', x0, 3.2, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('a área sombreada é o trabalho', x0, 2.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('específico de deformação', x0, 1.85, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('a quente, n → 0 e a tensão quase não cresce com a deformação', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 4.1 — laminação */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Laminação: a força depende do arco de contato, que cresce com o raio do cilindro e com a redução. Cilindro menor, força menor (exemplo 4.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'h0', rot: 'Espessura inicial', min: 5, max: 60, val: 25, passo: 1, un: 'mm' },
      { id: 'dh', rot: 'Redução', min: 0.5, max: 10, val: 3, passo: 0.5, un: 'mm' },
      { id: 'R', rot: 'Raio do cilindro', min: 100, max: 600, val: 250, passo: 10, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var h0 = p.h0, dh = Math.min(p.dh, h0 - 1), hf = h0 - dh, R = p.R, w = 300;
      var K = 550, n = 0.22, mu = 0.25;
      var eps = Math.log(h0 / hf), Ybar = K * Math.pow(eps, n) / (1 + n);
      var L = Math.sqrt(R * dh), Fv = Ybar * w * L / 1000, T = 0.5 * Fv * L / 1000;
      var dhmax = mu * mu * R;
      var esc = 0.04, ox = 3.0, cy = 2.8;
      var Rd = R * esc;
      g.circ(ox, cy + h0 * esc * 1.6 + Rd, Rd, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.3 });
      g.circ(ox, cy - h0 * esc * 1.6 - Rd, Rd, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.3 });
      g.ret(ox - 3.2, cy - h0 * esc * 1.6, 3.2, h0 * esc * 3.2, { preenche: 'acento', cor: null, alfa: 0.5 });
      g.ret(ox, cy - hf * esc * 1.6, 3.2, hf * esc * 3.2, { preenche: 'acento', cor: null, alfa: 0.5 });
      g.cota(ox - 3.0, cy - h0 * esc * 1.6, ox - 3.0, cy + h0 * esc * 1.6, h0 + ' mm', { dx: -0.3 });
      g.cota(ox + 3.0, cy - hf * esc * 1.6, ox + 3.0, cy + hf * esc * 1.6, hf + ' mm', { dx: 0.3 });
      var x0 = 7.4;
      g.txt('ε = ' + fx(eps, 3) + ' · Ȳ = ' + fx(Ybar, 0) + ' MPa', x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('L = √(R·Δh) = ' + fx(L, 1) + ' mm', x0, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('F = ' + fx(Fv, 0) + ' kN', x0, 3.4, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('torque por cilindro ' + fx(T, 1) + ' kN·m', x0, 2.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Δh máximo (mordida) ' + fx(dhmax, 1) + ' mm', x0, 1.8, { cor: dh > dhmax ? 'erro' : 'ok', tam: 12, alin: 'esq', negrito: true });
      g.txt(dh > dhmax ? 'os cilindros não mordem a chapa' : 'mordida garantida com µ = 0,25', x0, 1.1, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('largura 300 mm · aço com K = 550 MPa e n = 0,22', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 5.1 — recalque */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Recalque: o atrito nas faces aumenta a força e cria o efeito barril. O fator de forma cresce conforme a peça achata (exemplo 5.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'D', rot: 'Diâmetro atual', min: 40, max: 250, val: 100, passo: 5, un: 'mm' },
      { id: 'h', rot: 'Altura atual', min: 10, max: 120, val: 50, passo: 2, un: 'mm' },
      { id: 'mu', rot: 'Atrito µ', min: 0, max: 0.5, val: 0.2, passo: 0.02 }
    ],
    desenhar: function (g, p) {
      var D = p.D, h = p.h, mu = p.mu, Yf = 250;
      var A = Math.PI * D * D / 4, Kf = 1 + 0.4 * mu * D / h;
      var Fv = Yf * A * Kf / 1000;
      var esc = 0.022, ox = 3.0, base = 1.2;
      g.ret(ox - 2.4, base - 0.5, 4.8, 0.45, { preenche: 'forte', cor: null, alfa: 0.6 });
      g.ret(ox - 2.4, base + h * esc, 4.8, 0.45, { preenche: 'forte', cor: null, alfa: 0.6 });
      /* peça com barril proporcional ao atrito */
      var pts = [], i;
      for (i = 0; i <= 20; i++) {
        var f = i / 20;
        var bar = 1 + mu * 1.4 * Math.sin(Math.PI * f);
        pts.push([ox - D * esc / 2 * bar, base + h * esc * f]);
      }
      for (i = 20; i >= 0; i--) {
        var f2 = i / 20;
        var bar2 = 1 + mu * 1.4 * Math.sin(Math.PI * f2);
        pts.push([ox + D * esc / 2 * bar2, base + h * esc * f2]);
      }
      g.caminho(pts, { cor: 'forte', larg: 1.8, fechar: true, preenche: 'acento', alfa: 0.35 });
      g.seta(ox, base + h * esc + 1.4, 0, -0.8, { cor: 'erro', larg: 2.4, rot: 'F', rotTam: 12, rotDx: 0.5, rotDy: 0 });
      var x0 = 7.2;
      g.txt('A = ' + fx(A, 0) + ' mm²', x0, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('Kf = 1 + 0,4µD/h = ' + fx(Kf, 3), x0, 4.2, { cor: 's2', tam: 13, alin: 'esq', negrito: true });
      g.txt('F = Yf·A·Kf = ' + fx(Fv, 0) + ' kN', x0, 3.3, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('sem atrito seriam ' + fx(Yf * A / 1000, 0) + ' kN', x0, 2.5, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('razão D/h = ' + fx(D / h, 2), x0, 1.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(D / h > 3 ? 'peça achatada: o atrito domina a força' : 'peça esbelta: atrito pouco relevante',
        x0, 1.1, { cor: D / h > 3 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('Yf = 250 MPa — à medida que a peça achata, A cresce e h cai: a força dispara', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 6.1 — dobra e retorno elástico */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'Dobra de chapa: o comprimento desenvolvido usa a linha neutra deslocada pelo fator K, e o retorno elástico exige sobredobra.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'ang', rot: 'Ângulo de dobra', min: 15, max: 150, val: 90, passo: 5, un: '°' },
      { id: 't', rot: 'Espessura', min: 0.5, max: 10, val: 3, passo: 0.5, un: 'mm' },
      { id: 'r', rot: 'Raio interno', min: 1, max: 30, val: 6, passo: 1, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var ang = p.ang, t = p.t, r = p.r;
      var Kf = r / t < 2 ? 0.33 : 0.5;
      var LD = (ang * Math.PI / 180) * (r + Kf * t);
      /* retorno elástico aproximado para aço comum */
      var Ri_Rf = 1 - 3 * (450 * (r + t / 2) / (200000 * t)) + 4 * Math.pow(450 * (r + t / 2) / (200000 * t), 3);
      var sobre = ang / Math.max(0.5, Ri_Rf) - ang;
      var TS = 450, w = 300, Db = 8 * t;
      var Fv = 0.33 * TS * w * t * t / Db / 1000;
      var cx = 3.2, cy = 2.2, esc = Math.min(0.12, 2.4 / (r + 10 * t));
      var a = ang * Math.PI / 180;
      g.caminho([[cx - 2.4, cy], [cx, cy]], { cor: 'acento', larg: Math.max(2, t * esc * 24) });
      g.caminho([[cx, cy], [cx + 2.4 * Math.cos(Math.PI - a), cy + 2.4 * Math.sin(Math.PI - a)]],
        { cor: 'acento', larg: Math.max(2, t * esc * 24) });
      g.arco(cx, cy, 0.8, Math.PI, Math.PI - a, { cor: 'suave' });
      g.txt(ang + '°', cx + 1.1 * Math.cos(Math.PI - a / 2), cy + 1.1 * Math.sin(Math.PI - a / 2), { cor: 'suave', tam: 11.5 });
      /* posição sobredobrada */
      var a2 = (ang + sobre) * Math.PI / 180;
      g.caminho([[cx, cy], [cx + 2.4 * Math.cos(Math.PI - a2), cy + 2.4 * Math.sin(Math.PI - a2)]],
        { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('sobredobra', cx + 2.0 * Math.cos(Math.PI - a2) , cy + 2.0 * Math.sin(Math.PI - a2) + 0.4, { cor: 'erro', tam: 10.5, fundo: true });
      var x0 = 7.4;
      g.txt('fator K = ' + fx(Kf, 2) + ' (r/t = ' + fx(r / t, 2) + ')', x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('comprimento desenvolvido do arco', x0, 4.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(LD, 2) + ' mm', x0, 3.7, { cor: 's1', tam: 14, alin: 'esq', negrito: true });
      g.txt('retorno elástico ' + fx(sobre, 1) + '°', x0, 2.9, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('dobrar até ' + fx(ang + sobre, 1) + '° para obter ' + ang + '°', x0, 2.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('força de dobra ≈ ' + fx(Fv, 1) + ' kN (300 mm)', x0, 1.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('raio interno pequeno demais trinca a face externa: r mínimo ≈ 1 a 2 t', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 7.1 — comparação de processos de soldagem */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Os quatro processos mais usados, comparados em produtividade, qualidade, portabilidade e custo. Nenhum vence em tudo.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'pr', rot: 'Processo (1 eletrodo · 2 MIG/MAG · 3 TIG · 4 arco submerso)', min: 1, max: 4, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var pr = {
        1: { n: 'Eletrodo revestido (SMAW)', prod: 3, qual: 6, port: 10, custo: 9, pos: 'todas', uso: 'campo, manutenção, raiz', cor: 's1' },
        2: { n: 'MIG/MAG (GMAW)', prod: 8, qual: 7, port: 5, custo: 6, pos: 'quase todas', uso: 'fabricação em série', cor: 's2' },
        3: { n: 'TIG (GTAW)', prod: 2, qual: 10, port: 5, custo: 4, pos: 'todas', uso: 'raiz, inox, alumínio', cor: 's3' },
        4: { n: 'Arco submerso (SAW)', prod: 10, qual: 8, port: 1, custo: 3, pos: 'plana', uso: 'chapas grossas, costura longa', cor: 's4' }
      }[p.pr];
      var x0 = 1.2, esc = 5.6;
      g.txt(pr.n, x0, 5.2, { cor: pr.cor, tam: 14.5, alin: 'esq', negrito: true });
      [['produtividade', pr.prod], ['qualidade/controle', pr.qual], ['portabilidade', pr.port], ['baixo custo de equipamento', pr.custo]]
        .forEach(function (b, i) {
          var y = 4.1 - i * 1.0;
          g.txt(b[0], x0, y + 0.55, { cor: 'suave', tam: 11.5, alin: 'esq' });
          g.ret(x0, y, esc * b[1] / 10, 0.5, { preenche: pr.cor, cor: null, alfa: 0.8 });
          g.ret(x0, y, esc, 0.5, { cor: 'borda', larg: 1 });
          g.txt(b[1] + '/10', x0 + esc + 0.25, y + 0.25, { cor: pr.cor, tam: 11, alin: 'esq' });
        });
      var bx = 8.8;
      g.txt('posições', bx, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(pr.pos, bx, 3.8, { cor: 'texto', tam: 12, alin: 'esq' });
      g.txt('uso típico', bx, 2.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(pr.uso, bx, 2.3, { cor: 'texto', tam: 12, alin: 'esq' });
      g.txt('proteção: ' + (p.pr === 1 ? 'revestimento' : p.pr === 4 ? 'fluxo granular' : 'gás'), bx, 1.4, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('a escolha equilibra produtividade, acesso ao local e exigência de qualidade', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 8.1 — aporte térmico e ciclo */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Aporte térmico e resfriamento: mais energia por milímetro significa resfriamento mais lento, menos dureza na ZTA e mais crescimento de grão (exemplo 8.1).',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'I', rot: 'Corrente', min: 80, max: 400, val: 200, passo: 10, un: 'A' },
      { id: 'V', rot: 'Tensão', min: 15, max: 40, val: 25, passo: 1, un: 'V' },
      { id: 'v', rot: 'Velocidade de soldagem', min: 1, max: 15, val: 5, passo: 0.5, un: 'mm/s' }
    ],
    desenhar: function (g, p) {
      var eta = 0.8, H = eta * p.V * p.I / p.v;
      /* t8/5 aproximado, chapa média (3D), aço, T0 = 20 °C */
      var lam = 0.025, T0 = 20;
      var t85 = (H / 1000) / (2 * Math.PI * lam) * (1 / (500 - T0) - 1 / (800 - T0)) * 1000;
      var gx = 1.3, gy = 1.2, gw = 6.0, gh = 3.8;
      var X = function (t) { return gx + gw * Math.min(t, 40) / 40; }, Y = function (T) { return gy + gh * T / 1600; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pts = [], i;
      for (i = 0; i <= 80; i++) {
        var t = 40 * i / 80;
        var T = T0 + (1500 - T0) * Math.exp(-t / (t85 * 0.9 + 1));
        pts.push([X(t), Y(T)]);
      }
      g.caminho(pts, { cor: 'erro', larg: 2.6 });
      [[800, 's2'], [500, 's1']].forEach(function (lv) {
        g.linha(gx, Y(lv[0]), gx + gw, Y(lv[0]), { cor: lv[1], larg: 1.2, tracejado: [5, 4] });
        g.txt(lv[0] + ' °C', gx + gw + 0.1, Y(lv[0]), { cor: lv[1], tam: 10.5, alin: 'esq' });
      });
      [10, 20, 30, 40].forEach(function (t) {
        g.linha(X(t), gy, X(t), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(t + '', X(t), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('tempo (s)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('T (°C)', gx - 0.4, gy + gh, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 8.6;
      g.txt('H = η·VI/v', x0, 5.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(fx(H, 0) + ' J/mm', x0, 4.3, { cor: 'erro', tam: 15, alin: 'esq', negrito: true });
      g.txt('= ' + fx(H / 1000, 2) + ' kJ/mm', x0, 3.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('t8/5 ≈ ' + fx(t85, 1) + ' s', x0, 2.9, { cor: 's2', tam: 14, alin: 'esq', negrito: true });
      g.txt(t85 < 5 ? 'resfriamento rápido: risco de martensita' : t85 > 25 ? 'muito lento: grão grosseiro na ZTA' : 'faixa usual para aço estrutural',
        x0, 2.1, { cor: t85 < 5 ? 'erro' : t85 > 25 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('η = 0,8 (MIG/MAG) · estimativa 3D sem pré-aquecimento', x0, 1.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('pré-aquecer aumenta t8/5 sem aumentar o aporte', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 9.1 — carbono equivalente e pré-aquecimento */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'Carbono equivalente: quanto maior, mais temperável o aço — e maior o pré-aquecimento necessário para evitar trinca a frio.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'C', rot: 'Carbono', min: 0.05, max: 0.5, val: 0.2, passo: 0.01, un: '%' },
      { id: 'Mn', rot: 'Manganês', min: 0.3, max: 2, val: 1.2, passo: 0.1, un: '%' },
      { id: 'esp', rot: 'Espessura', min: 5, max: 80, val: 20, passo: 5, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var C = p.C, Mn = p.Mn, Cr = 0.2, Mo = 0.1, Ni = 0.2, Cu = 0.1, V = 0;
      var CE = C + Mn / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;
      var esp = p.esp;
      var pre = Math.max(0, Math.round((CE - 0.35) * 500 + (esp - 20) * 1.5));
      var gx = 1.3, gy = 1.2, gw = 5.6, gh = 3.8;
      var X = function (ce) { return gx + gw * (ce - 0.2) / 0.5; }, Y = function (t) { return gy + gh * t / 250; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      [10, 25, 50].forEach(function (e, k) {
        var pts = [], i;
        for (i = 0; i <= 30; i++) {
          var ce = 0.2 + 0.5 * i / 30;
          pts.push([X(ce), Y(Math.max(0, (ce - 0.35) * 500 + (e - 20) * 1.5))]);
        }
        g.caminho(pts, { cor: k === 1 ? 's2' : 'borda', larg: k === 1 ? 2.2 : 1.2, tracejado: k === 1 ? false : [5, 4] });
        g.txt(e + ' mm', X(0.68), Y(Math.max(2, (0.68 - 0.35) * 500 + (e - 20) * 1.5)) + 0.25, { cor: 'fraco', tam: 10 });
      });
      g.circ(X(Math.min(0.7, CE)), Y(Math.min(250, pre)), 0.15, { preenche: 'erro', cor: null });
      [0.3, 0.4, 0.5, 0.6, 0.7].forEach(function (ce) {
        g.linha(X(ce), gy, X(ce), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(fx(ce, 2), X(ce), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.txt('carbono equivalente', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('pré-aquecimento (°C)', gx - 0.35, gy + gh / 2, { cor: 'fraco', tam: 11, alin: 'dir' });
      var x0 = 7.6;
      g.txt('CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15', x0, 5.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('CE = ' + fx(CE, 3), x0, 4.4, { cor: CE > 0.45 ? 'aviso' : 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt(CE < 0.4 ? 'soldabilidade boa' : CE < 0.5 ? 'exige cuidado' : 'soldabilidade difícil',
        x0, 3.6, { cor: CE < 0.4 ? 'ok' : CE < 0.5 ? 'aviso' : 'erro', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('pré-aquecimento sugerido', x0, 2.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(pre > 0 ? fx(pre, 0) + ' °C' : 'dispensável', x0, 2.1, { cor: pre > 0 ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt('mais espessura = mais restrição e resfriamento mais rápido', x0, 1.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('estimativa didática: na prática use a norma aplicável (AWS D1.1, EN 1011-2)', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 10.1 — ensaios não destrutivos */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Cada descontinuidade pede o ensaio que melhor a revela: superficiais por LP ou PM, internas por UT ou RT.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [{ id: 'd', rot: 'Descontinuidade (1 porosidade · 2 escória · 3 falta de fusão · 4 trinca superficial · 5 falta de penetração)', min: 1, max: 5, val: 1, passo: 1 }],
    desenhar: function (g, p) {
      var d = {
        1: { n: 'Porosidade', tipo: 'interna, arredondada', ens: ['RT ✓ excelente', 'UT ~ razoável', 'LP ✗', 'PM ✗'], causa: 'umidade, gás, corrente de ar', cor: 's1' },
        2: { n: 'Inclusão de escória', tipo: 'interna, alongada', ens: ['RT ✓ boa', 'UT ✓ boa', 'LP ✗', 'PM ✗'], causa: 'limpeza deficiente entre passes', cor: 's2' },
        3: { n: 'Falta de fusão', tipo: 'interna, plana', ens: ['UT ✓ excelente', 'RT ~ difícil', 'LP ✗', 'PM ✗'], causa: 'energia baixa, ângulo errado', cor: 's4' },
        4: { n: 'Trinca superficial', tipo: 'superficial', ens: ['PM ✓ excelente', 'LP ✓ boa', 'UT ~', 'RT ~'], causa: 'hidrogênio, restrição, enxofre', cor: 'erro' },
        5: { n: 'Falta de penetração', tipo: 'na raiz', ens: ['RT ✓ excelente', 'UT ✓ boa', 'LP/PM só se aflorar'], causa: 'abertura pequena, corrente baixa', cor: 's3' }
      }[p.d];
      /* junta em corte */
      var ox = 1.4, cy = 3.2;
      g.caminho([[ox, cy], [ox + 2.2, cy], [ox + 3.0, cy + 1.0], [ox + 3.8, cy], [ox + 6.0, cy],
                 [ox + 6.0, cy - 1.0], [ox, cy - 1.0]], { cor: 'forte', larg: 1.8, fechar: true, preenche: 'acento', alfa: 0.18 });
      g.caminho([[ox + 2.2, cy], [ox + 3.0, cy - 0.85], [ox + 3.8, cy]], { cor: 'forte', larg: 1.4, tracejado: [4, 3] });
      var marca = { 1: [[3.0, 0.3], [2.7, 0.1], [3.3, -0.1]], 2: [[2.8, -0.2]], 3: [[2.45, -0.3]], 4: [[3.0, 0.95]], 5: [[3.0, -0.85]] }[p.d];
      marca.forEach(function (m) {
        g.circ(ox + m[0], cy + m[1], p.d === 1 ? 0.12 : 0.1, { preenche: d.cor, cor: null });
        if (p.d >= 3) g.linha(ox + m[0] - 0.3, cy + m[1], ox + m[0] + 0.3, cy + m[1] + (p.d === 3 ? 0.3 : 0), { cor: d.cor, larg: 3 });
      });
      g.txt('seção da junta soldada', ox + 3.0, cy - 1.5, { cor: 'fraco', tam: 11 });
      var x0 = 8.0;
      g.txt(d.n, x0, 5.2, { cor: d.cor, tam: 14, alin: 'esq', negrito: true });
      g.txt(d.tipo, x0, 4.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ensaios:', x0, 3.7, { cor: 'fraco', tam: 11, alin: 'esq' });
      d.ens.forEach(function (e, i) {
        g.txt(e, x0, 3.1 - i * 0.55, { cor: e.indexOf('✓') >= 0 ? 'ok' : e.indexOf('✗') >= 0 ? 'erro' : 'suave', tam: 11.5, alin: 'esq' });
      });
      g.txt('causa típica: ' + d.causa, x0, 0.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('RT radiografia · UT ultrassom · LP líquido penetrante · PM partículas magnéticas', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });

  /* 11.1 — corte térmico */
  F('#fig-11-1', {
    titulo: 'Figura 11.1',
    legenda: 'Processos de corte térmico: faixa de espessura, qualidade de borda e materiais atendidos. A zona afetada do corte também importa no projeto.',
    vista: [-0.6, 12.6, -2.8, 5.8],
    altura: 350,
    controles: [
      { id: 'pr', rot: 'Processo (1 oxicorte · 2 plasma · 3 laser · 4 jato d’água)', min: 1, max: 4, val: 1, passo: 1 },
      { id: 'esp', rot: 'Espessura', min: 1, max: 150, val: 20, passo: 1, un: 'mm' }
    ],
    desenhar: function (g, p) {
      var pr = {
        1: { n: 'Oxicorte', min: 5, max: 300, zta: 'larga (1 a 3 mm)', mat: 'só aço-carbono', prec: 3, cor: 's2' },
        2: { n: 'Plasma', min: 1, max: 50, zta: 'moderada (0,5 a 1 mm)', mat: 'qualquer condutor', prec: 6, cor: 's1' },
        3: { n: 'Laser', min: 0.5, max: 25, zta: 'estreita (< 0,3 mm)', mat: 'metais e não metais', prec: 9, cor: 's4' },
        4: { n: 'Jato d’água', min: 0.5, max: 200, zta: 'nenhuma', mat: 'qualquer material', prec: 8, cor: 's3' }
      }[p.pr];
      var dentro = p.esp >= pr.min && p.esp <= pr.max;
      var gx = 1.3, gy = 1.6, gw = 6.4;
      var X = function (e) { return gx + gw * (Math.log10(Math.max(0.5, e)) + 0.3) / 3; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      [[1, 'oxicorte', 5, 300, 's2'], [2, 'plasma', 1, 50, 's1'], [3, 'laser', 0.5, 25, 's4'], [4, 'jato d’água', 0.5, 200, 's3']]
        .forEach(function (b, i) {
          var y = gy + 0.7 + i * 0.85;
          g.ret(X(b[2]), y, X(b[3]) - X(b[2]), 0.5, { preenche: b[4], cor: null, alfa: p.pr === b[0] ? 0.85 : 0.25 });
          g.txt(b[1], gx - 0.15, y + 0.25, { cor: p.pr === b[0] ? b[4] : 'fraco', tam: 11, alin: 'dir', negrito: p.pr === b[0] });
        });
      [1, 10, 100].forEach(function (e) {
        g.linha(X(e), gy, X(e), gy - 0.15, { cor: 'fraco', larg: 1 });
        g.txt(e + ' mm', X(e), gy - 0.45, { cor: 'fraco', tam: 10 });
      });
      g.linha(X(p.esp), gy - 0.2, X(p.esp), gy + 4.2, { cor: 'erro', larg: 1.4, tracejado: [5, 4] });
      g.txt('espessura', gx + gw / 2, gy - 0.95, { cor: 'fraco', tam: 11 });
      var x0 = 8.4;
      g.txt(pr.n, x0, 5.2, { cor: pr.cor, tam: 14, alin: 'esq', negrito: true });
      g.txt('faixa ' + pr.min + ' a ' + pr.max + ' mm', x0, 4.5, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('materiais: ' + pr.mat, x0, 3.8, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('ZTA: ' + pr.zta, x0, 3.1, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.ret(x0, 2.2, 3.4 * pr.prec / 10, 0.45, { preenche: pr.cor, cor: null, alfa: 0.8 });
      g.txt('qualidade de borda', x0, 1.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt(dentro ? '✓ espessura dentro da faixa' : '✗ fora da faixa usual deste processo',
        x0, 1.0, { cor: dentro ? 'ok' : 'erro', tam: 12, alin: 'esq', negrito: true });
      g.txt('o corte deixa borda endurecida: em peças críticas, usinar ou esmerilhar depois', 6, -2.3, { cor: 'fraco', tam: 11 });
    }
  });
})();

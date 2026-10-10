/* ============================================================
   Figuras ilustrativas de Motores de Combustão Interna
   Quatro tempos, trem de válvulas, cinemática, ciclos, desempenho,
   combustão, balanço térmico, sobrealimentação, emissões e aplicações.
   ============================================================ */
(function () {
  'use strict';
  if (!window.Figura) return;
  var F = window.Figura.criar;
  var fx = function (v, n) { var k = Math.pow(10, n == null ? 1 : n); return (Math.round(v * k) / k).toLocaleString('pt-BR'); };
  var lim = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var rad = function (d) { return d * Math.PI / 180; };

  /* deslocamento do pistão a partir do PMS */
  function desloc(th, r, L) {
    return r + L - (r * Math.cos(th) + Math.sqrt(L * L - r * r * Math.sin(th) * Math.sin(th)));
  }

  /* ---------- 1.1 — os quatro tempos ---------- */
  F('#fig-1-1', {
    titulo: 'Figura 1.1',
    legenda: 'Os quatro tempos em duas voltas do virabrequim: só um deles produz trabalho. No motor de dois tempos, admissão e escape acontecem juntos, perto do ponto morto inferior.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    animar: true,
    controles: [
      { id: 'tempos', rot: 'Motor: 4 tempos ou 2 tempos', min: 2, max: 4, val: 4, passo: 2 },
      { id: 'vel', rot: 'Velocidade da animação', min: 0, max: 3, val: 1, passo: 0.1 }
    ],
    desenhar: function (g, p, t) {
      var dois = Math.round(p.tempos) === 2;
      var ciclo = dois ? 2 * Math.PI : 4 * Math.PI;
      var th = (t * p.vel * 1.6) % ciclo;
      var r = 0.9, L = 2.6, S = 2 * r;
      var cx = 2.6, topo = 4.6;
      var s = desloc(th % (2 * Math.PI), r, L);
      var yp = topo - 0.45 - s;
      /* cilindro */
      g.ret(cx - 1.0, topo - 0.45 - S - 1.0, 2.0, S + 1.45, { cor: 'forte', larg: 2, preenche: 'baixo', alfa: 0.4 });
      g.linha(cx - 1.0, topo - 0.45, cx + 1.0, topo - 0.45, { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      g.txt('PMS', cx - 1.15, topo - 0.45, { cor: 'fraco', tam: 9.5, alin: 'dir' });
      g.linha(cx - 1.0, topo - 0.45 - S, cx + 1.0, topo - 0.45 - S, { cor: 'fraco', larg: 1, tracejado: [4, 3] });
      g.txt('PMI', cx - 1.15, topo - 0.45 - S, { cor: 'fraco', tam: 9.5, alin: 'dir' });
      /* pistão e biela */
      g.ret(cx - 0.95, yp - 0.42, 1.9, 0.42, { cor: 'forte', larg: 1.6, preenche: 'acento', alfa: 0.55 });
      var man = topo - 0.45 - r - L;
      var ax = cx + r * Math.sin(th), ay = man + r * Math.cos(th);
      g.linha(cx, yp - 0.21, ax, ay, { cor: 'suave', larg: 2.2 });
      g.circ(cx, man, r, { cor: 'fraco', larg: 1, tracejado: [3, 3] });
      g.circ(ax, ay, 0.12, { preenche: 's3', cor: null });
      g.circ(cx, man, 0.1, { preenche: 'texto', cor: null });
      /* válvulas */
      var fase = dois ? 0 : Math.floor(th / Math.PI);
      var adm = dois ? (s > S * 0.55) : fase === 0;
      var esc = dois ? (s > S * 0.55) : fase === 3;
      [[-0.45, adm, 's1', 'admissão'], [0.45, esc, 'erro', 'escape']].forEach(function (v) {
        var ab = v[1] ? 0.3 : 0;
        g.linha(cx + v[0], topo + 0.35, cx + v[0], topo - 0.45 + ab, { cor: v[2], larg: 3 });
        g.linha(cx + v[0] - 0.22, topo - 0.45 + ab, cx + v[0] + 0.22, topo - 0.45 + ab, { cor: v[2], larg: 3 });
        g.txt(v[3], cx + v[0], topo + 0.6, { cor: v[1] ? v[2] : 'fraco', tam: 9.5 });
      });
      var nomes = dois ? ['admissão e compressão', 'expansão e escape']
        : ['admissão', 'compressão', 'expansão', 'escape'];
      var idx = dois ? Math.floor(th / Math.PI) % 2 : fase;
      g.txt(nomes[idx], cx, topo + 1.05, { cor: 's1', tam: 13, negrito: true });
      g.txt('θ = ' + fx(th * 180 / Math.PI, 0) + '°', cx, man - 1.15, { cor: 'fraco', tam: 10.5 });
      /* barra dos tempos */
      var bx = 5.6, bw = 6.4, by = 3.4;
      var n = nomes.length;
      for (var i = 0; i < n; i++) {
        var w = bw / n;
        g.ret(bx + i * w, by, w, 0.55,
          { cor: 'fundo', larg: 1, preenche: i === idx ? 's1' : 'baixo', alfa: i === idx ? 0.8 : 0.5 });
        g.txt(nomes[i], bx + i * w + w / 2, by + 0.27, { cor: i === idx ? 'texto' : 'fraco', tam: dois ? 10 : 10.5 });
      }
      g.txt(dois ? 'uma volta do virabrequim' : 'duas voltas do virabrequim', bx + bw / 2, by - 0.4, { cor: 'fraco', tam: 11 });
      g.txt(dois ? 'um tempo motor por volta' : 'um tempo motor a cada duas voltas', bx + bw / 2, by + 1.0,
        { cor: dois ? 'ok' : 'suave', tam: 12, negrito: true });
      var xr = 5.6;
      g.txt(dois ? 'dois tempos' : 'quatro tempos', xr, 2.5, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(dois ? 'potência por litro bem maior' : 'tempos separados: cada um faz uma coisa',
        xr, 1.9, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(dois ? 'lavagem mistura carga fresca com queimados' : 'troca de gases completa e controlada',
        xr, 1.4, { cor: dois ? 'erro' : 'ok', tam: 11.5, alin: 'esq' });
      g.txt(dois ? 'consumo e emissões piores — fora do automóvel' : 'o padrão em automóvel desde sempre',
        xr, 0.9, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('curso ' + fx(S / r * 50, 0) + ' mm equivalente · a animação é cinemática, não em escala real', 6, -1.1, { cor: 'fraco', tam: 10.5 });
    }
  });

  /* ---------- 2.1 — diagrama de válvulas ---------- */
  F('#fig-2-1', {
    titulo: 'Figura 2.1',
    legenda: 'O diagrama de válvulas: elas abrem antes e fecham depois dos pontos mortos. O cruzamento — os dois abertos ao mesmo tempo — melhora o enchimento em alta rotação e piora a marcha lenta.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'aaa', rot: 'Avanço de abertura da admissão', min: 0, max: 40, val: 12, passo: 1, un: '°' },
      { id: 'rfe', rot: 'Retardo de fechamento do escape', min: 0, max: 40, val: 10, passo: 1, un: '°' },
      { id: 'dur', rot: 'Duração da admissão', min: 180, max: 290, val: 230, passo: 5, un: '°' }
    ],
    desenhar: function (g, p) {
      var aaa = p.aaa, rfe = p.rfe, dur = p.dur, aae = 40;
      var cruz = aaa + rfe;
      var cx = 3.2, cy = 2.5, R = 1.9;
      /* ângulo de virabrequim a partir do PMS, crescendo no sentido de rotação */
      var ang = function (a) { return (90 - a) * Math.PI / 180; };
      var ponto = function (a, raio) { return [cx + raio * Math.cos(ang(a)), cy + raio * Math.sin(ang(a))]; };
      function faixa(a0, a1, raio, cor, larg) {
        var pts = [], i, n = Math.max(12, Math.round(Math.abs(a1 - a0) / 4));
        for (i = 0; i <= n; i++) pts.push(ponto(a0 + (a1 - a0) * i / n, raio));
        g.caminho(pts, { cor: cor, larg: larg || 4.5, cap: 'butt' });
      }
      g.circ(cx, cy, R, { cor: 'forte', larg: 1.4 });
      g.circ(cx, cy, 0.1, { preenche: 'texto', cor: null });
      [[0, 'PMS'], [180, 'PMI']].forEach(function (m) {
        var p1 = ponto(m[0], 0), p2 = ponto(m[0], R);
        g.linha(p1[0], p1[1], p2[0], p2[1], { cor: 'fraco', larg: 1, tracejado: [4, 3] });
        var p3 = ponto(m[0], R + 0.32);
        g.txt(m[1], p3[0], p3[1], { cor: 'fraco', tam: 10 });
      });
      /* admissão: abre aaa antes do PMS e dura "dur" graus */
      faixa(-aaa, dur - aaa, R - 0.2, 's1');
      /* escape: abre aae antes do PMI e fecha rfe depois do PMS */
      faixa(180 - aae, 360 + rfe, R - 0.62, 'erro');
      /* cruzamento: em torno do PMS */
      faixa(-aaa, rfe, R + 0.16, 'aviso', 5.5);
      var la = ponto(90, R - 0.2 - 0.3);
      g.txt('admissão', la[0], la[1], { cor: 's1', tam: 10.5, negrito: true, fundo: true });
      var le = ponto(265, R - 0.62 - 0.3);
      g.txt('escape', le[0], le[1], { cor: 'erro', tam: 10.5, negrito: true, fundo: true });
      var lc = ponto(-aaa - 18, R + 0.55);
      g.txt('cruzamento', lc[0] - 0.1, lc[1], { cor: 'aviso', tam: 10, alin: 'dir', fundo: true });
      var lf = ponto(dur - aaa, R - 0.2);
      g.circ(lf[0], lf[1], 0.11, { preenche: 's1', cor: null });
      g.txt('fecha', lf[0] - 0.15, lf[1] - 0.25, { cor: 's1', tam: 9.5, alin: 'dir' });
      var xr = 6.6;
      g.txt('cruzamento de ' + fx(cruz, 0) + '°', xr, 5.0, { cor: 'aviso', tam: 14, alin: 'esq', negrito: true });
      g.txt('admissão aberta por ' + fx(dur, 0) + '°', xr, 4.3, { cor: 's1', tam: 12, alin: 'esq' });
      g.txt('fecha ' + fx(dur - 180 - aaa, 0) + '° depois do PMI', xr, 3.7, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt(cruz > 30 ? 'cruzamento grande: enche bem em alta rotação' :
        cruz > 15 ? 'cruzamento médio: compromisso usual' : 'cruzamento pequeno: boa marcha lenta',
        xr, 2.9, { cor: cruz > 30 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(cruz > 30 ? 'em marcha lenta, gases queimados voltam' : 'pouca diluição em baixa rotação',
        xr, 2.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('fechar a admissão bem depois do PMI', xr, 1.6, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('aproveita a inércia da coluna de gás —', xr, 1.2, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('é o que o comando variável ajusta', xr, 0.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('ângulos em graus de virabrequim · o comando gira à metade dessa velocidade', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 3.1 — cinemática do pistão ---------- */
  F('#fig-3-1', {
    titulo: 'Figura 3.1',
    legenda: 'Deslocamento, velocidade e aceleração do pistão. A obliquidade da biela torna o movimento assimétrico: a aceleração no PMS é bem maior que no PMI (exemplo 3.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'S', rot: 'Curso', min: 50, max: 140, val: 86, passo: 1, un: 'mm' },
      { id: 'L', rot: 'Comprimento da biela', min: 90, max: 260, val: 140, passo: 5, un: 'mm' },
      { id: 'n', rot: 'Rotação', min: 1000, max: 9000, val: 6000, passo: 100, un: 'rpm' }
    ],
    desenhar: function (g, p) {
      var S = p.S / 1000, L = p.L / 1000, n = p.n;
      var r = S / 2, lam = r / L, w = 2 * Math.PI * n / 60;
      var aPMS = w * w * r * (1 + lam), aPMI = w * w * r * (1 - lam), vm = 2 * S * n / 60;
      var vmax = 0, i;
      for (i = 0; i <= 720; i++) {
        var th = rad(i / 2);
        var v = Math.abs(w * r * (Math.sin(th) + lam / 2 * Math.sin(2 * th) / Math.sqrt(1 - lam * lam * Math.sin(th) * Math.sin(th))));
        if (v > vmax) vmax = v;
      }
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var X = function (a) { return gx + gw * a / 360; };
      var Y = function (v) { return gy + gh * (v + 1) / 2; };
      g.linha(gx, Y(0), gx + gw, Y(0), { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var ps = [], pv = [], pa = [];
      for (i = 0; i <= 180; i++) {
        var a = 360 * i / 180, th2 = rad(a);
        var sdes = desloc(th2, r, L);
        var raiz = Math.sqrt(1 - lam * lam * Math.sin(th2) * Math.sin(th2));
        var vel = w * r * (Math.sin(th2) + lam * Math.sin(2 * th2) / (2 * raiz));
        var ace = w * w * r * (Math.cos(th2) + lam * Math.cos(2 * th2));
        ps.push([X(a), Y(2 * sdes / S - 1)]);
        pv.push([X(a), Y(vel / vmax)]);
        pa.push([X(a), Y(ace / aPMS)]);
      }
      g.caminho(ps, { cor: 's1', larg: 2.6 });
      g.caminho(pv, { cor: 's3', larg: 2.2, tracejado: [6, 4] });
      g.caminho(pa, { cor: 'erro', larg: 2.2, tracejado: [2, 3] });
      g.txt('deslocamento', X(100), Y(2 * desloc(rad(100), r, L) / S - 1) + 0.3, { cor: 's1', tam: 10, fundo: true });
      g.txt('velocidade', X(55), Y(0.95) + 0.1, { cor: 's3', tam: 10, fundo: true });
      g.txt('aceleração', X(250), Y(-0.85) - 0.1, { cor: 'erro', tam: 10, fundo: true });
      [0, 90, 180, 270, 360].forEach(function (a) {
        g.linha(X(a), Y(0), X(a), Y(0) - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(a + '°', X(a), gy - 0.3, { cor: 'fraco', tam: 10 });
      });
      g.txt('ângulo do virabrequim', gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 11 });
      g.txt('normalizado', gx + gw, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'dir' });
      var xr = 7.6;
      g.txt('λ = r/L = ' + fx(lam, 3), xr, 5.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('v média do pistão', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(vm, 1) + ' m/s', xr, 3.9, { cor: vm > 20 ? 'erro' : 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt('a no PMS = ω²r(1+λ)', xr, 3.2, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(aPMS, 0) + ' m/s² = ' + fx(aPMS / 9.81, 0) + ' g', xr, 2.65, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('a no PMI = ' + fx(aPMI / 9.81, 0) + ' g', xr, 2.0, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('razão PMS/PMI = ' + fx(aPMS / aPMI, 2), xr, 1.45, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(vm > 20 ? 'acima do limite usual de 20 m/s' : 'dentro do limite usual de 20 m/s',
        xr, 0.85, { cor: vm > 20 ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('cada grama de pistão vira ' + fx(aPMS / 1000, 1) + ' N de inércia nessa rotação', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.1 — ciclos no diagrama p-V ---------- */
  F('#fig-4-1', {
    titulo: 'Figura 4.1',
    legenda: 'Os três ciclos padrão a ar no mesmo diagrama. O Otto queima a volume constante; o Diesel, a pressão constante; o misto, um pouco de cada — e é o que mais se parece com o motor real (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'ciclo', rot: 'Ciclo: 1 Otto · 2 Diesel · 3 misto', min: 1, max: 3, val: 1, passo: 1 },
      { id: 'rc', rot: 'Taxa de compressão', min: 6, max: 24, val: 10.5, passo: 0.5 },
      { id: 'corte', rot: 'Razão de corte (Diesel e misto)', min: 1.2, max: 4, val: 2, passo: 0.1 }
    ],
    desenhar: function (g, p) {
      var ciclo = Math.round(p.ciclo), rc = p.rc, rco = p.corte, k = 1.4, alfa = 1.6;
      var eta;
      if (ciclo === 1) eta = 1 - 1 / Math.pow(rc, k - 1);
      else if (ciclo === 2) eta = 1 - (1 / Math.pow(rc, k - 1)) * ((Math.pow(rco, k) - 1) / (k * (rco - 1)));
      else eta = 1 - (1 / Math.pow(rc, k - 1)) * ((alfa * Math.pow(rco, k) - 1) / ((alfa - 1) + k * alfa * (rco - 1)));
      var gx = 1.3, gy = 1.0, gw = 5.6, gh = 3.9;
      var v1 = 1, v2 = 1 / rc;
      var pmax = ciclo === 1 ? Math.pow(rc, k) * 3.5 : Math.pow(rc, k) * (ciclo === 3 ? alfa : 1) * 1.8;
      var X = function (v) { return gx + gw * lim(v, 0, 1.05) / 1.05; };
      var Y = function (pp) { return gy + gh * lim(pp / pmax, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, pts = [];
      /* 1-2 compressão isentrópica */
      for (i = 0; i <= 40; i++) { var v = v1 + (v2 - v1) * i / 40; pts.push([X(v), Y(Math.pow(v1 / v, k))]); }
      var p2 = Math.pow(rc, k), v3, p3;
      if (ciclo === 1) { p3 = p2 * 3.5; v3 = v2; pts.push([X(v2), Y(p3)]); }
      else if (ciclo === 2) { p3 = p2; v3 = v2 * rco; pts.push([X(v3), Y(p3)]); }
      else {
        p3 = p2 * alfa; pts.push([X(v2), Y(p3)]);
        v3 = v2 * rco; pts.push([X(v3), Y(p3)]);
      }
      for (i = 0; i <= 40; i++) { var v4 = v3 + (v1 - v3) * i / 40; pts.push([X(v4), Y(p3 * Math.pow(v3 / v4, k))]); }
      pts.push([X(v1), Y(1)]);
      g.caminho(pts, { cor: 's1', larg: 2.8, preenche: 's1', alfa: 0.15, fechar: true });
      g.circ(X(v1), Y(1), 0.12, { preenche: 'texto', cor: null });
      g.txt('1', X(v1) + 0.12, Y(1) + 0.25, { cor: 'texto', tam: 10.5, alin: 'esq' });
      g.circ(X(v2), Y(p2), 0.12, { preenche: 'texto', cor: null });
      g.txt('2', X(v2) - 0.12, Y(p2) + 0.25, { cor: 'texto', tam: 10.5, alin: 'dir' });
      g.circ(X(v3), Y(p3), 0.12, { preenche: 'erro', cor: null });
      g.txt('3', X(v3) + 0.14, Y(p3), { cor: 'erro', tam: 10.5, alin: 'esq' });
      g.txt('V_c', X(v2), gy - 0.3, { cor: 'fraco', tam: 10 });
      g.txt('V_c + V_d', X(v1), gy - 0.3, { cor: 'fraco', tam: 10 });
      g.txt('volume', gx + gw / 2, gy - 0.75, { cor: 'fraco', tam: 11 });
      g.txt('pressão (relativa à admissão)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var nome = ['Otto', 'Diesel', 'misto (Sabathé)'][ciclo - 1];
      var xr = 7.4;
      g.txt('ciclo ' + nome, xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('taxa de compressão ' + fx(rc, 1) + ':1', xr, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      if (ciclo !== 1) g.txt('razão de corte ' + fx(rco, 2), xr, 3.75, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('rendimento = ' + fx(100 * eta, 1) + ' %', xr, 3.0, { cor: 's1', tam: 15, alin: 'esq', negrito: true });
      g.txt('T₂/T₁ = ' + fx(Math.pow(rc, k - 1), 2), xr, 2.3, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt('p₂/p₁ = ' + fx(p2, 1), xr, 1.8, { cor: 'fraco', tam: 11.5, alin: 'esq' });
      g.txt(ciclo === 1 && rc > 12 ? 'acima de 12:1 a gasolina detona' :
        ciclo === 1 ? 'taxa limitada pela detonação' : 'sem mistura no cilindro: taxa alta permitida',
        xr, 1.1, { cor: ciclo === 1 && rc > 12 ? 'erro' : 'ok', tam: 11, alin: 'esq', negrito: true });
      g.txt('padrão a ar frio, k = 1,4 · no misto, α = 1,6', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 4.2 — rendimento contra taxa de compressão ---------- */
  F('#fig-4-2', {
    titulo: 'Figura 4.2',
    legenda: 'Para a mesma taxa de compressão o Otto rende mais; o Diesel ganha na prática porque pode comprimir muito mais sem detonar. Aumentar a razão de corte derruba o rendimento do Diesel (exemplo 4.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'rc', rot: 'Taxa de compressão', min: 6, max: 24, val: 10.5, passo: 0.5 },
      { id: 'corte', rot: 'Razão de corte do Diesel', min: 1.2, max: 4, val: 2, passo: 0.1 }
    ],
    desenhar: function (g, p) {
      var rc = p.rc, rco = p.corte, k = 1.4;
      var otto = function (r) { return 1 - 1 / Math.pow(r, k - 1); };
      var diesel = function (r, c) { return 1 - (1 / Math.pow(r, k - 1)) * ((Math.pow(c, k) - 1) / (k * (c - 1))); };
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var X = function (r) { return gx + gw * (lim(r, 6, 24) - 6) / 18; };
      var Y = function (e) { return gy + gh * lim(e, 0.3, 0.75) / 0.75 * 1.0; };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      g.ret(X(6), gy, X(12.5) - X(6), gh, { preenche: 's1', cor: null, alfa: 0.07 });
      g.ret(X(14), gy, X(24) - X(14), gh, { preenche: 'erro', cor: null, alfa: 0.07 });
      g.txt('faixa do Otto', X(9.2), gy + gh - 0.25, { cor: 's1', tam: 10 });
      g.txt('faixa do Diesel', X(19), gy + gh - 0.25, { cor: 'erro', tam: 10 });
      var i, a = [], b = [], c = [];
      for (i = 0; i <= 60; i++) {
        var r = 6 + 18 * i / 60;
        a.push([X(r), Y(otto(r))]);
        b.push([X(r), Y(diesel(r, rco))]);
        c.push([X(r), Y(diesel(r, 3))]);
      }
      g.caminho(a, { cor: 's1', larg: 2.8 });
      g.caminho(b, { cor: 'erro', larg: 2.8 });
      g.caminho(c, { cor: 'fraco', larg: 1.4, tracejado: [5, 4] });
      g.txt('Otto', X(21), Y(otto(21)) + 0.3, { cor: 's1', tam: 11, fundo: true });
      g.txt('Diesel (corte ' + fx(rco, 1) + ')', X(21), Y(diesel(21, rco)) - 0.32, { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true });
      g.txt('corte 3,0', X(13), Y(diesel(13, 3)) - 0.3, { cor: 'fraco', tam: 10, fundo: true });
      g.circ(X(rc), Y(otto(rc)), 0.15, { preenche: 's1', cor: null });
      g.circ(X(rc), Y(diesel(rc, rco)), 0.15, { preenche: 'erro', cor: null });
      g.linha(X(rc), gy, X(rc), gy + gh, { cor: 'suave', larg: 1, tracejado: [3, 3] });
      [8, 12, 16, 20, 24].forEach(function (r) {
        g.linha(X(r), gy, X(r), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(r + '', X(r), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [0.4, 0.5, 0.6, 0.7].forEach(function (e) {
        g.linha(gx, Y(e), gx - 0.14, Y(e), { cor: 'fraco', larg: 1 });
        g.txt(fx(100 * e, 0) + ' %', gx - 0.26, Y(e), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('taxa de compressão', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('rendimento do padrão a ar', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.6;
      g.txt('em r_c = ' + fx(rc, 1) + ':1', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('Otto: ' + fx(100 * otto(rc), 1) + ' %', xr, 4.3, { cor: 's1', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('Diesel: ' + fx(100 * diesel(rc, rco), 1) + ' %', xr, 3.7, { cor: 'erro', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('diferença de ' + fx(100 * (otto(rc) - diesel(rc, rco)), 1) + ' pontos', xr, 3.0, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('a favor do Otto na mesma taxa', xr, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('mas o Diesel real comprime 18:1', xr, 1.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('e chega a ' + fx(100 * diesel(18, rco), 1) + ' % contra ' + fx(100 * otto(10.5), 1) + ' % do Otto real',
        xr, 1.3, { cor: 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ganho por ponto de taxa cai: de 10 para 11 rende ' + fx(100 * (otto(11) - otto(10)), 2) + ' ponto', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 5.1 — curvas características ---------- */
  F('#fig-5-1', {
    titulo: 'Figura 5.1',
    legenda: 'Torque segue a pme e cai quando o enchimento piora; a potência continua subindo até a queda da pme vencer o ganho de rotação. O consumo mínimo fica perto do torque máximo (exemplo 5.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'V', rot: 'Cilindrada total', min: 0.8, max: 6, val: 1.8, passo: 0.1, un: 'L' },
      { id: 'pme', rot: 'pme máxima', min: 6, max: 22, val: 10, passo: 0.5, un: 'bar' },
      { id: 'nT', rot: 'Rotação de torque máximo', min: 1500, max: 5500, val: 3500, passo: 100, un: 'rpm' }
    ],
    desenhar: function (g, p) {
      var V = p.V / 1000, pmeM = p.pme * 1e5, nT = p.nT, nmax = 7000;
      function pme(n) { return pmeM * (1 - 0.55 * Math.pow((n - nT) / nT, 2)); }
      function T(n) { return pme(n) * V / (2 * Math.PI * 2); }
      function P(n) { return T(n) * 2 * Math.PI * n / 60; }
      var Pmax = 0, nP = 0, i;
      for (i = 800; i <= nmax; i += 10) { if (P(i) > Pmax) { Pmax = P(i); nP = i; } }
      var Tmax = T(nT);
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var X = function (n) { return gx + gw * lim(n - 800, 0, nmax - 800) / (nmax - 800); };
      var YT = function (v) { return gy + gh * lim(v / (Tmax * 1.25), 0, 1); };
      var YP = function (v) { return gy + gh * lim(v / (Pmax * 1.25), 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var pt = [], pp = [], pc = [];
      for (i = 0; i <= 80; i++) {
        var n = 800 + (nmax - 800) * i / 80;
        pt.push([X(n), YT(T(n))]);
        pp.push([X(n), YP(P(n))]);
        pc.push([X(n), gy + gh * (0.30 + 0.5 * Math.pow((n - nT * 0.95) / nT, 2)) * 0.8]);
      }
      g.caminho(pt, { cor: 's1', larg: 2.8 });
      g.caminho(pp, { cor: 'erro', larg: 2.8 });
      g.caminho(pc, { cor: 'aviso', larg: 1.8, tracejado: [5, 4] });
      g.circ(X(nT), YT(Tmax), 0.15, { preenche: 's1', cor: null });
      g.circ(X(nP), YP(Pmax), 0.15, { preenche: 'erro', cor: null });
      g.txt('torque', X(nT) - 0.15, YT(Tmax) + 0.3, { cor: 's1', tam: 11, alin: 'dir', fundo: true });
      g.txt('potência', X(nP) + 0.15, YP(Pmax) - 0.3, { cor: 'erro', tam: 11, alin: 'esq', fundo: true });
      g.txt('consumo específico', X(nT * 1.55), gy + gh * 0.33, { cor: 'aviso', tam: 10, fundo: true });
      [2000, 4000, 6000].forEach(function (n) {
        g.linha(X(n), gy, X(n), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(n / 1000, 0) + ' mil', X(n), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('rotação (rpm)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      var xr = 7.6;
      g.txt('torque máximo', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Tmax, 0) + ' N·m a ' + fx(nT, 0) + ' rpm', xr, 4.45, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('potência máxima', xr, 3.8, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(Pmax / 1000, 1) + ' kW a ' + fx(nP, 0) + ' rpm', xr, 3.25, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('= ' + fx(Pmax / 735.5, 0) + ' cv', xr, 2.7, { cor: 'suave', tam: 11.5, alin: 'esq' });
      g.txt('potência específica ' + fx(Pmax / 1000 / p.V, 1) + ' kW/L', xr, 2.1, { cor: 'ok', tam: 12.5, alin: 'esq', negrito: true });
      g.txt(p.pme > 14 ? 'pme dessa ordem só com sobrealimentação' : 'pme típica de motor aspirado',
        xr, 1.4, { cor: p.pme > 14 ? 'aviso' : 'suave', tam: 11, alin: 'esq', negrito: true });
      g.txt('P = pme · V · n / 2 no motor de quatro tempos', xr, 0.85, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('curva de pme parabólica em torno do torque máximo — forma típica, não medida', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 6.1 — lambda ---------- */
  F('#fig-6-1', {
    titulo: 'Figura 6.1',
    legenda: 'A mistura decide tudo: potência máxima em mistura levemente rica, consumo mínimo em levemente pobre, e o catalisador de três vias só trabalha na janela estreita em torno de λ = 1 (exemplo 6.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'lam', rot: 'Fator lambda', min: 0.7, max: 1.4, val: 1, passo: 0.01 },
      { id: 'comb', rot: 'Combustível: 1 gasolina · 2 etanol · 3 diesel · 4 metano', min: 1, max: 4, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var lam = p.lam, c = Math.round(p.comb);
      var combs = [
        { nome: 'gasolina C₈H₁₈', afr: 15.1, pci: 44000, M: 114.2, a: 12.5 },
        { nome: 'etanol C₂H₆O', afr: 8.98, pci: 26800, M: 46.07, a: 3 },
        { nome: 'diesel C₁₂H₂₃', afr: 14.6, pci: 42500, M: 167.3, a: 17.75 },
        { nome: 'metano CH₄', afr: 17.2, pci: 50000, M: 16.04, a: 2 }
      ][c - 1];
      function pot(l) { return 1 - 2.6 * Math.pow(l - 0.9, 2); }
      function cons(l) { return 1 + 1.8 * Math.pow(l - 1.1, 2); }
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var X = function (l) { return gx + gw * (lim(l, 0.7, 1.4) - 0.7) / 0.7; };
      var Y = function (v) { return gy + gh * lim(v, 0, 1.3) / 1.3; };
      g.ret(X(0.99), gy, X(1.01) - X(0.99), gh, { preenche: 'ok', cor: null, alfa: 0.35 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, a = [], b = [];
      for (i = 0; i <= 70; i++) {
        var l = 0.7 + 0.7 * i / 70;
        a.push([X(l), Y(pot(l))]);
        b.push([X(l), Y(cons(l) * 0.75)]);
      }
      g.caminho(a, { cor: 'erro', larg: 2.8 });
      g.caminho(b, { cor: 's1', larg: 2.4, tracejado: [5, 4] });
      g.txt('potência', X(0.9), Y(pot(0.9)) + 0.3, { cor: 'erro', tam: 11, fundo: true });
      g.txt('consumo específico', X(1.3), Y(cons(1.3) * 0.75) + 0.3, { cor: 's1', tam: 10.5, alin: 'dir', fundo: true });
      g.linha(X(1), gy, X(1), gy + gh, { cor: 'ok', larg: 1.4, tracejado: [4, 3] });
      g.txt('λ = 1', X(1) + 0.12, gy + gh - 0.25, { cor: 'ok', tam: 10.5, alin: 'esq' });
      g.txt('janela do catalisador', X(1) + 0.12, gy + 0.3, { cor: 'ok', tam: 10, alin: 'esq' });
      g.circ(X(lam), Y(pot(lam)), 0.15, { preenche: 'erro', cor: null });
      g.txt('rica', X(0.78), gy + gh - 0.25, { cor: 'aviso', tam: 10.5 });
      g.txt('pobre', X(1.32), gy + gh - 0.25, { cor: 's4', tam: 10.5 });
      [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4].forEach(function (l) {
        g.linha(X(l), gy, X(l), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(l, 1), X(l), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      g.txt('fator lambda', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('relativo ao máximo', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var afrR = lam * combs.afr;
      var xr = 7.6;
      g.txt(combs.nome, xr, 5.0, { cor: 'texto', tam: 12.5, alin: 'esq', negrito: true });
      g.txt('a = ' + fx(combs.a, 2) + ' mol de O₂', xr, 4.4, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('AFR estequiométrico ' + fx(combs.afr, 2), xr, 3.8, { cor: 's1', tam: 13, alin: 'esq', negrito: true });
      g.txt('λ = ' + fx(lam, 2) + ' → AFR real ' + fx(afrR, 2), xr, 3.15, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('PCI ' + fx(combs.pci / 1000, 1) + ' MJ/kg', xr, 2.55, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(lam < 0.98 ? 'mistura rica: mais potência, mais CO' :
        lam > 1.02 ? 'mistura pobre: menos consumo, mais NOx' : 'estequiométrica: catalisador trabalha',
        xr, 1.9, { cor: lam < 0.98 ? 'aviso' : lam > 1.02 ? 's4' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('energia por kg de ar: ' + fx(combs.pci / combs.afr, 0) + ' kJ', xr, 1.25, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('é esse número, e não o PCI, que decide a potência', xr, 0.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('curvas de forma típica · o motor admite ar, não combustível: o AFR é que ajusta a injeção', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 7.1 — balanço térmico ---------- */
  F('#fig-7-1', {
    titulo: 'Figura 7.1',
    legenda: 'Para onde vai a energia do combustível: cerca de um terço vira trabalho, um terço sai quente pelo escapamento e um terço vai para o arrefecimento. Em carga parcial a conta piora bastante.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'carga', rot: 'Carga do motor', min: 10, max: 100, val: 80, passo: 5, un: '%' },
      { id: 'tipo', rot: 'Motor: 1 Otto · 2 Diesel', min: 1, max: 2, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var carga = p.carga / 100, diesel = Math.round(p.tipo) === 2;
      var base = diesel ? 0.42 : 0.34;
      var util = base * (0.45 + 0.55 * Math.pow(carga, 0.45));
      var atrito = (diesel ? 0.08 : 0.09) / Math.max(carga, 0.1) * 0.35;
      atrito = lim(atrito, 0.05, 0.28);
      var resto = 1 - util - atrito;
      var escape = resto * (diesel ? 0.52 : 0.55), arref = resto - escape;
      var itens = [
        { nome: 'trabalho no eixo', v: util, cor: 'ok' },
        { nome: 'escapamento', v: escape, cor: 'erro' },
        { nome: 'arrefecimento', v: arref, cor: 's1' },
        { nome: 'atrito e auxiliares', v: atrito, cor: 'aviso' }
      ];
      var bx = 1.1, by = 1.0, bw = 5.4, bh = 3.6;
      g.ret(bx, by, bw, bh, { cor: 'forte', larg: 1.6 });
      var ac = 0;
      itens.forEach(function (it) {
        var h = bh * it.v;
        g.ret(bx, by + ac, bw, h, { cor: 'fundo', larg: 1, preenche: it.cor, alfa: 0.65 });
        if (h > 0.4) {
          g.txt(it.nome, bx + 0.2, by + ac + h / 2, { cor: 'texto', tam: 11, alin: 'esq' });
          g.txt(fx(100 * it.v, 1) + ' %', bx + bw - 0.2, by + ac + h / 2, { cor: 'texto', tam: 11.5, alin: 'dir', negrito: true });
        }
        ac += h;
      });
      g.txt('100 % da energia do combustível', bx + bw / 2, by + bh + 0.35, { cor: 'fraco', tam: 11 });
      var xr = 7.0;
      g.txt((diesel ? 'Diesel' : 'Otto') + ' a ' + fx(p.carga, 0) + ' % de carga', xr, 5.0, { cor: 'texto', tam: 13, alin: 'esq', negrito: true });
      g.txt('rendimento ' + fx(100 * util, 1) + ' %', xr, 4.3, { cor: 'ok', tam: 15, alin: 'esq', negrito: true });
      g.txt('consumo específico ≈ ' + fx(3.6e6 / (util * (diesel ? 42500 : 44000)), 0) + ' g/kWh', xr, 3.6, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('escape leva ' + fx(100 * escape, 1) + ' %', xr, 2.9, { cor: 'erro', tam: 12, alin: 'esq' });
      g.txt('— é dele que o turbo vive', xr, 2.45, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('arrefecimento ' + fx(100 * arref, 1) + ' %', xr, 1.85, { cor: 's1', tam: 12, alin: 'esq' });
      g.txt(carga < 0.4 ? 'em carga baixa o atrito pesa muito mais' : 'perto da carga plena o rendimento é máximo',
        xr, 1.2, { cor: carga < 0.4 ? 'aviso' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('é por isso que motor grande em cidade consome tanto', xr, 0.7, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('repartição típica — cada motor tem a sua, medida em banco', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 8.1 — sobrealimentação ---------- */
  F('#fig-8-1', {
    titulo: 'Figura 8.1',
    legenda: 'Dobrar a pressão não dobra a massa de ar: o compressor aquece. O intercooler recupera dois terços do que o aquecimento tinha tirado — e ainda afasta a detonação (exemplo 8.1).',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'P2', rot: 'Pressão de admissão', min: 1, max: 3.5, val: 2, passo: 0.05, un: 'bar' },
      { id: 'ec', rot: 'Rendimento do compressor', min: 0.5, max: 0.85, val: 0.72, passo: 0.01 },
      { id: 'Tic', rot: 'Temperatura após o intercooler', min: 30, max: 120, val: 47, passo: 1, un: '°C' }
    ],
    desenhar: function (g, p) {
      var P2 = p.P2, ec = p.ec, Tic = p.Tic + 273.15, T1 = 300, R = 287, k = 1.4, P1 = 1;
      function T2de(pr) { return T1 * (1 + (1 / ec) * (Math.pow(pr / P1, (k - 1) / k) - 1)); }
      var T2 = T2de(P2);
      var rho0 = P1 * 1e5 / (R * T1);
      var rhoS = P2 * 1e5 / (R * T2);
      var rhoC = P2 * 1e5 / (R * Math.min(Tic, T2));
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (pr) { return gx + gw * (lim(pr, 1, 3.5) - 1) / 2.5; };
      var Y = function (v) { return gy + gh * lim(v / 4.2, 0, 1); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, a = [], b = [], c = [];
      for (i = 0; i <= 60; i++) {
        var pr = 1 + 2.5 * i / 60;
        a.push([X(pr), Y(pr * 1e5 / (R * T1) / rho0)]);
        b.push([X(pr), Y(pr * 1e5 / (R * T2de(pr)) / rho0)]);
        c.push([X(pr), Y(pr * 1e5 / (R * Math.min(Tic, T2de(pr))) / rho0)]);
      }
      g.caminho(a, { cor: 'fraco', larg: 1.6, tracejado: [5, 4] });
      g.caminho(b, { cor: 'erro', larg: 2.6 });
      g.caminho(c, { cor: 'ok', larg: 2.8 });
      g.txt('ideal (sem aquecer)', X(3.3), Y(3.3) + 0.25, { cor: 'fraco', tam: 10, alin: 'dir' });
      g.txt('com intercooler', X(3.3), Y(3.3 * 1e5 / (R * Math.min(Tic, T2de(3.3))) / rho0) - 0.3, { cor: 'ok', tam: 10.5, alin: 'dir', fundo: true });
      g.txt('sem intercooler', X(3.3), Y(3.3 * 1e5 / (R * T2de(3.3)) / rho0) - 0.3, { cor: 'erro', tam: 10.5, alin: 'dir', fundo: true });
      g.circ(X(P2), Y(rhoS / rho0), 0.15, { preenche: 'erro', cor: null });
      g.circ(X(P2), Y(rhoC / rho0), 0.15, { preenche: 'ok', cor: null });
      [1.5, 2, 2.5, 3, 3.5].forEach(function (pr) {
        g.linha(X(pr), gy, X(pr), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(pr, 1), X(pr), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [1, 2, 3, 4].forEach(function (v) {
        g.linha(gx, Y(v), gx - 0.14, Y(v), { cor: 'fraco', larg: 1 });
        g.txt(fx(v, 0) + '×', gx - 0.26, Y(v), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('pressão de admissão (bar absolutos)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('densidade em relação ao aspirado', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.5;
      g.txt('T após o compressor', xr, 5.0, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(T2 - 273.15, 1) + ' °C', xr, 4.45, { cor: 'erro', tam: 14, alin: 'esq', negrito: true });
      g.txt('sem intercooler: +' + fx(100 * (rhoS / rho0 - 1), 1) + ' % de ar', xr, 3.75, { cor: 'erro', tam: 12.5, alin: 'esq' });
      g.txt('com intercooler: +' + fx(100 * (rhoC / rho0 - 1), 1) + ' % de ar', xr, 3.15, { cor: 'ok', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('o intercooler recupera', xr, 2.5, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt(fx(100 * (rhoC - rhoS) / (P2 * 1e5 / (R * T1) - rhoS || 1), 0) + ' % do que o calor tirou', xr, 2.05, { cor: 'suave', tam: 11.5, alin: 'esq', negrito: true });
      g.txt(T2 - 273.15 > 150 ? 'ar quente demais: risco de detonação' : 'temperatura administrável',
        xr, 1.4, { cor: T2 - 273.15 > 150 ? 'erro' : 'ok', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('ar de admissão a 27 °C e 1 bar · k = 1,4', xr, 0.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('densidade, não pressão, é o que determina quanto combustível pode ser queimado', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 9.1 — emissões e catalisador ---------- */
  F('#fig-9-1', {
    titulo: 'Figura 9.1',
    legenda: 'As emissões cruas contra o fator lambda e a eficiência do catalisador de três vias. A janela em que ele converte os três poluentes ao mesmo tempo tem menos de 1 % de largura.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'lam', rot: 'Fator lambda', min: 0.8, max: 1.2, val: 1, passo: 0.005 },
      { id: 'cat', rot: 'Catalisador: 0 sem · 1 com', min: 0, max: 1, val: 1, passo: 1 }
    ],
    desenhar: function (g, p) {
      var lam = p.lam, cat = Math.round(p.cat) === 1;
      function CO(l) { return Math.exp(-14 * (l - 0.82)) * 1.0; }
      function HC(l) { return 0.25 + 1.2 * Math.pow(l - 1.06, 2) * 8; }
      function NOx(l) { return Math.exp(-Math.pow((l - 1.07) / 0.085, 2)); }
      function efic(l, qual) {
        var d = Math.abs(l - 1);
        if (qual === 'nox') return l <= 1.002 ? Math.exp(-Math.pow(d / 0.012, 2)) : Math.exp(-Math.pow((l - 1) / 0.004, 2));
        return l >= 0.998 ? Math.exp(-Math.pow(d / 0.03, 2)) : Math.exp(-Math.pow((1 - l) / 0.006, 2));
      }
      var gx = 1.3, gy = 0.9, gw = 5.8, gh = 4.1;
      var X = function (l) { return gx + gw * (lim(l, 0.8, 1.2) - 0.8) / 0.4; };
      var Y = function (v) { return gy + gh * lim(v, 0, 1.15) / 1.15; };
      g.ret(X(0.995), gy, X(1.005) - X(0.995), gh, { preenche: 'ok', cor: null, alfa: 0.3 });
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var i, s1 = [], s2 = [], s3 = [];
      for (i = 0; i <= 80; i++) {
        var l = 0.8 + 0.4 * i / 80;
        var fc = cat ? (1 - 0.98 * efic(l, 'co')) : 1;
        var fn = cat ? (1 - 0.98 * efic(l, 'nox')) : 1;
        s1.push([X(l), Y(lim(CO(l), 0, 1.1) * fc)]);
        s2.push([X(l), Y(lim(HC(l), 0, 1.1) * fc)]);
        s3.push([X(l), Y(NOx(l) * fn)]);
      }
      g.caminho(s1, { cor: 'erro', larg: 2.6 });
      g.caminho(s2, { cor: 'aviso', larg: 2.4 });
      g.caminho(s3, { cor: 's1', larg: 2.6 });
      g.txt('CO', X(0.85), Y(lim(CO(0.85), 0, 1.1)) + 0.3, { cor: 'erro', tam: 11, fundo: true });
      g.txt('HC', X(0.84), Y(lim(HC(0.84), 0, 1.1)) - 0.32, { cor: 'aviso', tam: 11, fundo: true });
      g.txt('NOx', X(1.12), Y(NOx(1.12)) + 0.32, { cor: 's1', tam: 11, fundo: true });
      g.txt('janela λ', X(1), gy + gh - 0.25, { cor: 'ok', tam: 10 });
      g.linha(X(lam), gy, X(lam), gy + gh, { cor: 'suave', larg: 1.2, tracejado: [3, 3] });
      [0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15].forEach(function (l) {
        g.linha(X(l), gy, X(l), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(l, 2), X(l), gy - 0.44, { cor: 'fraco', tam: 9.5 });
      });
      g.txt('fator lambda', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('emissão relativa', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var fc2 = cat ? (1 - 0.98 * efic(lam, 'co')) : 1;
      var fn2 = cat ? (1 - 0.98 * efic(lam, 'nox')) : 1;
      var xr = 7.6;
      g.txt('λ = ' + fx(lam, 3), xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt(cat ? 'com catalisador de três vias' : 'sem pós-tratamento', xr, 4.4,
        { cor: cat ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('CO ' + fx(100 * lim(CO(lam), 0, 1.1) * fc2, 1) + ' %', xr, 3.7, { cor: 'erro', tam: 12, alin: 'esq' });
      g.txt('HC ' + fx(100 * lim(HC(lam), 0, 1.1) * fc2, 1) + ' %', xr, 3.15, { cor: 'aviso', tam: 12, alin: 'esq' });
      g.txt('NOx ' + fx(100 * NOx(lam) * fn2, 1) + ' %', xr, 2.6, { cor: 's1', tam: 12, alin: 'esq' });
      g.txt(cat && Math.abs(lam - 1) < 0.005 ? 'os três convertidos ao mesmo tempo' :
        cat ? 'fora da janela: a conversão despenca' : 'sem catalisador não há conversão',
        xr, 1.9, { cor: cat && Math.abs(lam - 1) < 0.005 ? 'ok' : 'erro', tam: 11.5, alin: 'esq', negrito: true });
      g.txt('a sonda lambda mantém a mistura', xr, 1.3, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('oscilando dentro dessa janela', xr, 0.9, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('curvas de forma típica, normalizadas · o Diesel trabalha pobre e precisa de SCR e filtro', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });

  /* ---------- 10.1 — famílias de motores ---------- */
  F('#fig-10-1', {
    titulo: 'Figura 10.1',
    legenda: 'Rotação, porte e consumo específico andam juntos: o motor marítimo lento é enorme e gira pouco — e é justamente ele que alcança o melhor rendimento já obtido numa máquina térmica.',
    vista: [-0.6, 12.6, -1.4, 5.8],
    altura: 350,
    controles: [
      { id: 'tipo', rot: 'Motor: 1 automotivo · 2 média rotação · 3 marítimo lento', min: 1, max: 3, val: 3, passo: 1 }
    ],
    desenhar: function (g, p) {
      var t = Math.round(p.tipo);
      var fam = [
        { nome: 'automotivo', n: 6000, D: 82, P: 90, sfoc: 250, cil: 1.8, nota: 'alta rotação, pistão pequeno' },
        { nome: 'média rotação', n: 750, D: 320, P: 7000, sfoc: 190, cil: 100, nota: 'geração e propulsão com redutor' },
        { nome: 'marítimo lento', n: 80, D: 900, P: 60000, sfoc: 165, cil: 2500, nota: 'dois tempos, acoplado direto à hélice' }
      ][t - 1];
      var eta = 3.6e6 / (fam.sfoc * 42000);
      var gx = 1.3, gy = 0.9, gw = 5.6, gh = 4.1;
      var X = function (n) { return gx + gw * (Math.log10(lim(n, 50, 10000)) - 1.7) / 2.3; };
      var Y = function (s) { return gy + gh * (1 - (lim(s, 140, 280) - 140) / 140); };
      g.linha(gx, gy, gx + gw, gy, { cor: 'fraco', larg: 1.2 });
      g.linha(gx, gy, gx, gy + gh, { cor: 'fraco', larg: 1.2 });
      var todos = [
        { n: 6000, s: 250, nome: 'automotivo', cor: 's1' },
        { n: 1800, s: 215, nome: 'grupo gerador', cor: 's4' },
        { n: 750, s: 190, nome: 'média rotação', cor: 'aviso' },
        { n: 80, s: 165, nome: 'marítimo lento', cor: 'ok' }
      ];
      var pts = todos.map(function (d) { return [X(d.n), Y(d.s)]; });
      g.caminho(pts, { cor: 'fraco', larg: 1.4, tracejado: [5, 4] });
      todos.forEach(function (d) {
        var ativo = d.nome === fam.nome;
        g.circ(X(d.n), Y(d.s), ativo ? 0.2 : 0.13, { preenche: d.cor, cor: null, alfa: ativo ? 1 : 0.55 });
        g.txt(d.nome, X(d.n), Y(d.s) + 0.4, { cor: ativo ? d.cor : 'fraco', tam: 10.5, fundo: true });
      });
      [100, 1000, 10000].forEach(function (n) {
        g.linha(X(n), gy, X(n), gy - 0.14, { cor: 'fraco', larg: 1 });
        g.txt(fx(n, 0), X(n), gy - 0.44, { cor: 'fraco', tam: 10 });
      });
      [160, 200, 240, 280].forEach(function (s) {
        g.linha(gx, Y(s), gx - 0.14, Y(s), { cor: 'fraco', larg: 1 });
        g.txt(fx(s, 0), gx - 0.26, Y(s), { cor: 'fraco', tam: 10, alin: 'dir' });
      });
      g.txt('rotação (rpm, log)', gx + gw / 2, gy - 0.9, { cor: 'fraco', tam: 11 });
      g.txt('consumo específico (g/kWh)', gx - 0.2, gy + gh + 0.3, { cor: 'fraco', tam: 11, alin: 'esq' });
      var xr = 7.4;
      g.txt(fam.nome, xr, 5.0, { cor: 'texto', tam: 13.5, alin: 'esq', negrito: true });
      g.txt('rotação ' + fx(fam.n, 0) + ' rpm', xr, 4.3, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('diâmetro do pistão ' + fx(fam.D, 0) + ' mm', xr, 3.75, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('potência ' + (fam.P >= 1000 ? fx(fam.P / 1000, 1) + ' MW' : fx(fam.P, 0) + ' kW'), xr, 3.2, { cor: 'suave', tam: 12, alin: 'esq' });
      g.txt('consumo ' + fx(fam.sfoc, 0) + ' g/kWh', xr, 2.5, { cor: 'erro', tam: 13, alin: 'esq', negrito: true });
      g.txt('rendimento ≈ ' + fx(100 * eta, 1) + ' %', xr, 1.9, { cor: 'ok', tam: 14, alin: 'esq', negrito: true });
      g.txt(fam.nota, xr, 1.25, { cor: 'fraco', tam: 11, alin: 'esq' });
      g.txt('cilindrada ' + (fam.cil >= 100 ? fx(fam.cil, 0) + ' L' : fx(fam.cil, 1) + ' L') + ' por motor', xr, 0.8, { cor: 'fraco', tam: 10.5, alin: 'esq' });
      g.txt('rendimento estimado com PCI de 42 MJ/kg · valores típicos de catálogo', 6, -1.1, { cor: 'fraco', tam: 11 });
    }
  });
})();

/* ============================================================
   Estática — simuladores
     1. sim-trelica    : treliça plana pelo método dos nós (matricial)
     2. sim-equilibrio : reações de apoio em corpo rígido
     3. sim-atrito     : bloco em plano inclinado e ângulo de autotravamento
     4. sim-centroide  : centroide e momento de inércia de seção composta
   ============================================================ */
(function () {
  'use strict';

  /* ---------- eliminação de Gauss com pivoteamento parcial ---------- */
  function resolverSistema(A, b) {
    var n = b.length, i, j, k;
    var M = A.map(function (r, idx) { return r.slice().concat([b[idx]]); });
    for (i = 0; i < n; i++) {
      var piv = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      var t = M[i]; M[i] = M[piv]; M[piv] = t;
      if (Math.abs(M[i][i]) < 1e-12) return null;
      for (k = i + 1; k < n; k++) {
        var f = M[k][i] / M[i][i];
        if (!f) continue;
        for (j = i; j <= n; j++) M[k][j] -= f * M[i][j];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }

  /* ============================================================
     1. Treliça plana
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-trelica')) return;

    /* monta a geometria conforme o tipo, com n painéis */
    function montar(tipo, vao, altura, np) {
      var nos = [], barras = [], i;
      var dx = vao / np;
      /* banzo inferior: nós 0..np */
      for (i = 0; i <= np; i++) nos.push({ x: i * dx, y: 0, banzo: 'inf' });
      /* banzo superior: nós internos */
      var topo = [];
      for (i = 1; i < np; i++) { topo.push(nos.length); nos.push({ x: i * dx, y: altura, banzo: 'sup' }); }

      for (i = 0; i < np; i++) barras.push([i, i + 1]);          /* banzo inferior */
      for (i = 0; i < topo.length - 1; i++) barras.push([topo[i], topo[i + 1]]);  /* superior */
      barras.push([0, topo[0]]);                                  /* diagonal esquerda */
      barras.push([np, topo[topo.length - 1]]);                   /* diagonal direita */
      for (i = 0; i < topo.length; i++) barras.push([i + 1, topo[i]]);   /* montantes */

      /* diagonais internas conforme o tipo */
      var meio = (np - 1) / 2;
      for (i = 0; i < topo.length - 1; i++) {
        if (tipo === 'pratt') {
          /* diagonais apontando para o centro (tracionadas) */
          if (i < meio - 0.5) barras.push([i + 2, topo[i]]);
          else barras.push([i + 1, topo[i + 1]]);
        } else if (tipo === 'howe') {
          if (i < meio - 0.5) barras.push([i + 1, topo[i + 1]]);
          else barras.push([i + 2, topo[i]]);
        } else {
          /* Warren: alterna */
          if (i % 2 === 0) barras.push([i + 2, topo[i]]);
          else barras.push([i + 1, topo[i + 1]]);
        }
      }
      return { nos: nos, barras: barras, topo: topo };
    }

    function resolver(g, apoios, cargas) {
      var nos = g.nos, barras = g.barras;
      var n = nos.length, m = barras.length;
      var incog = [], b;
      for (b = 0; b < m; b++) incog.push({ tipo: 'barra', id: b });
      Object.keys(apoios).forEach(function (k) {
        var no = +k;
        if (apoios[k] === 'pin') { incog.push({ tipo: 'rx', no: no }); incog.push({ tipo: 'ry', no: no }); }
        else incog.push({ tipo: 'ry', no: no });
      });
      var nEq = 2 * n, nInc = incog.length;
      var A = [], rhs = [], e;
      for (e = 0; e < nEq; e++) { A.push(new Array(nInc).fill(0)); rhs.push(0); }

      barras.forEach(function (br, idx) {
        var i = br[0], j = br[1];
        var ddx = nos[j].x - nos[i].x, ddy = nos[j].y - nos[i].y;
        var Lb = Math.sqrt(ddx * ddx + ddy * ddy);
        var cx = ddx / Lb, cy = ddy / Lb;
        A[2 * i][idx] += cx; A[2 * i + 1][idx] += cy;
        A[2 * j][idx] -= cx; A[2 * j + 1][idx] -= cy;
      });
      incog.forEach(function (u, col) {
        if (u.tipo === 'rx') A[2 * u.no][col] += 1;
        if (u.tipo === 'ry') A[2 * u.no + 1][col] += 1;
      });
      Object.keys(cargas).forEach(function (k) {
        var no = +k;
        rhs[2 * no] -= cargas[k][0];
        rhs[2 * no + 1] -= cargas[k][1];
      });
      return { sol: resolverSistema(A, rhs), incog: incog, grau: nInc - nEq, nEq: nEq, nInc: nInc };
    }

    Sim.build('#sim-trelica', {
      titulo: 'Treliça plana — método dos nós',
      descricao: 'O sistema de equilíbrio de todos os nós é montado e resolvido de uma vez. Cores mostram tração e compressão; barras de força nula aparecem tracejadas.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Pratt com carga central',
          desc: 'Diagonais tracionadas — o arranjo mais econômico em aço',
          valores: { tipo: 'pratt', vao: 12, altura: 3, np: 4, P: 40, onde: 'meio' } },
        { nome: '2 · Howe com a mesma carga',
          desc: 'Diagonais invertidas: passam a comprimir',
          valores: { tipo: 'howe', vao: 12, altura: 3, np: 4, P: 40, onde: 'meio' } },
        { nome: '3 · Warren',
          desc: 'Diagonais alternadas, sem montantes intermediários carregados',
          valores: { tipo: 'warren', vao: 12, altura: 3, np: 4, P: 40, onde: 'meio' } },
        { nome: '4 · Treliça baixa (altura 1,5 m)',
          desc: 'Metade da altura dobra a força nos banzos',
          valores: { tipo: 'pratt', vao: 12, altura: 1.5, np: 4, P: 40, onde: 'meio' } },
        { nome: '5 · Carga distribuída nos nós',
          desc: 'Caso real de cobertura: carga em todos os nós',
          valores: { tipo: 'pratt', vao: 12, altura: 3, np: 4, P: 20, onde: 'todos' } },
        { nome: '6 · Vão grande, 6 painéis',
          desc: 'Mais painéis, barras mais curtas',
          valores: { tipo: 'pratt', vao: 18, altura: 3, np: 6, P: 30, onde: 'todos' } }
      ],
      controles: [
        { id: 'tipo', tipo: 'select', label: 'Tipo de treliça', valor: 'pratt',
          opcoes: [
            { v: 'pratt', t: 'Pratt (diagonais tracionadas)' },
            { v: 'howe', t: 'Howe (diagonais comprimidas)' },
            { v: 'warren', t: 'Warren (diagonais alternadas)' }
          ] },
        { id: 'vao', label: 'Vão total', min: 6, max: 24, step: 1, valor: 12, unidade: 'm' },
        { id: 'altura', label: 'Altura', min: 1, max: 6, step: 0.5, valor: 3, unidade: 'm',
          desc: 'A força nos banzos é inversamente proporcional à altura.' },
        { id: 'np', label: 'Número de painéis', min: 4, max: 8, step: 2, valor: 4, unidade: '' },
        { tipo: 'separador' },
        { id: 'P', label: 'Carga por nó', min: 5, max: 150, step: 5, valor: 40, unidade: 'kN' },
        { id: 'onde', tipo: 'seg', label: 'Aplicação', valor: 'meio',
          opcoes: [{ v: 'meio', t: 'Só no meio' }, { v: 'todos', t: 'Em todos os nós' }] }
      ],
      graficos: [
        { id: 'geo', axes: false, height: 300, grid: false, legend: false },
        { id: 'forcas', titulo: 'Força em cada barra', xlabel: 'Barra', ylabel: 'Força (kN)',
          aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'estat', label: 'Estaticidade' },
        { id: 'RA', label: 'Reação apoio A' },
        { id: 'RB', label: 'Reação apoio B' },
        { id: 'tmax', label: 'Maior tração' },
        { id: 'cmax', label: 'Maior compressão' },
        { id: 'nulas', label: 'Barras de força nula' }
      ],
      formulas: [
        { g: 'Condições de equilíbrio' },
        { tex: '\\sum F_x = 0 \\qquad \\sum F_y = 0 \\qquad \\sum M = 0', d: 'corpo rígido no plano: três equações', destaque: true },
        { tex: '\\sum F_x = 0 \\quad\\text{e}\\quad \\sum F_y = 0', d: 'em cada NÓ da treliça: duas equações, pois as barras são bi-rotuladas', destaque: true },

        { g: 'Estaticidade' },
        { tex: 'm + r = 2n', d: 'ISOSTÁTICA: m barras, r reações, n nós', destaque: true },
        { tex: 'm + r < 2n', d: 'hipostática — mecanismo, não é estrutura' },
        { tex: 'm + r > 2n', d: 'hiperestática — equilíbrio não basta, precisa de compatibilidade' },

        { g: 'Hipóteses da treliça ideal' },
        { tex: '\\text{Nós rotulados}', d: 'sem transmissão de momento' },
        { tex: '\\text{Cargas só nos nós}', d: 'caso contrário a barra sofre flexão' },
        { tex: '\\text{Barras retas e biarticuladas}', d: 'só resistem a esforço AXIAL: tração ou compressão' },

        { g: 'Método das seções' },
        { tex: 'F_{\\text{banzo}} = \\pm\\frac{M}{h}', d: 'corta-se a treliça e toma-se momento no nó oposto', destaque: true },
        { tex: 'F_{\\text{diagonal}} = \\frac{V}{\\sin\\theta}', d: 'a diagonal absorve o cortante do painel' },

        { g: 'Barras de força nula' },
        { tex: '\\text{Nó com 2 barras não colineares, sem carga}', d: 'ambas são nulas' },
        { tex: '\\text{Nó com 3 barras, duas colineares, sem carga}', d: 'a terceira é nula' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Treliça ideal: nós rotulados, barras retas biarticuladas e cargas aplicadas apenas nos nós. O sistema de 2n equações nodais é montado e resolvido por eliminação de Gauss. Convenção: força positiva = tração.',
      calcular: function (p, ctx) {
        var g = montar(p.tipo, p.vao, p.altura, p.np);
        var apoios = {}; apoios[0] = 'pin'; apoios[p.np] = 'rollerY';
        var cargas = {};
        if (p.onde === 'meio') {
          var noMeio = Math.round(p.np / 2);
          cargas[noMeio] = [0, -p.P];
        } else {
          for (var i = 1; i < p.np; i++) cargas[i] = [0, -p.P];
        }
        var r = resolver(g, apoios, cargas);
        var sol = r.sol || [];

        var forcas = [], RA = 0, RB = 0;
        r.incog.forEach(function (u, i) {
          if (u.tipo === 'barra') forcas[u.id] = sol[i] || 0;
          if (u.tipo === 'ry' && u.no === 0) RA = sol[i] || 0;
          if (u.tipo === 'ry' && u.no === p.np) RB = sol[i] || 0;
        });

        var tmax = 0, cmax = 0, nulas = 0, iT = 0, iC = 0;
        forcas.forEach(function (f, i) {
          if (f > tmax) { tmax = f; iT = i; }
          if (f < cmax) { cmax = f; iC = i; }
          if (Math.abs(f) < 1e-6) nulas++;
        });

        /* ---------- desenho ---------- */
        var gp = ctx.plot('geo').clear();
        var maxAbs = Math.max(tmax, -cmax, 1e-9);
        gp.setLimits([-p.vao * 0.10, p.vao * 1.10], [-p.altura * 0.75, p.altura * 1.35]);
        gp.custom(function (c, pl) {
          /* barras */
          g.barras.forEach(function (br, idx) {
            var i = br[0], j = br[1];
            var F = forcas[idx] || 0;
            var X1 = pl.px(g.nos[i].x), Y1 = pl.py(g.nos[i].y);
            var X2 = pl.px(g.nos[j].x), Y2 = pl.py(g.nos[j].y);
            var esp = 1.2 + 5 * Math.abs(F) / maxAbs;
            if (Math.abs(F) < 1e-6) {
              c.strokeStyle = Plot.cssVar('--text-faint', '#888');
              c.lineWidth = 1.2; c.setLineDash([4, 3]);
            } else {
              c.strokeStyle = F > 0 ? Plot.serie(0) : Plot.serie(1);
              c.lineWidth = esp; c.setLineDash([]);
            }
            c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X2, Y2); c.stroke();
            c.setLineDash([]);
            /* rótulo da força */
            if (Math.abs(F) > 1e-6 && p.np <= 6) {
              c.fillStyle = F > 0 ? Plot.serie(0) : Plot.serie(1);
              c.font = '9.5px ' + Plot.cssVar('--font', 'sans-serif');
              c.textAlign = 'center'; c.textBaseline = 'middle';
              var mx = (X1 + X2) / 2, my = (Y1 + Y2) / 2;
              c.save();
              c.globalAlpha = 0.92;
              c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
              c.fillRect(mx - 17, my - 6, 34, 12);
              c.globalAlpha = 1;
              c.fillStyle = F > 0 ? Plot.serie(0) : Plot.serie(1);
              c.fillText(Plot.sig(F, 3), mx, my);
              c.restore();
            }
          });
          /* nós */
          g.nos.forEach(function (no) {
            c.fillStyle = Plot.cssVar('--text', '#111');
            c.beginPath(); c.arc(pl.px(no.x), pl.py(no.y), 3.4, 0, Math.PI * 2); c.fill();
          });
          /* apoios */
          function pino(X, Y) {
            c.strokeStyle = Plot.cssVar('--text', '#111'); c.lineWidth = 1.6;
            c.beginPath(); c.moveTo(X, Y); c.lineTo(X - 11, Y + 16); c.lineTo(X + 11, Y + 16);
            c.closePath(); c.stroke();
            for (var k = -13; k <= 13; k += 5) {
              c.beginPath(); c.moveTo(X + k, Y + 17); c.lineTo(X + k - 5, Y + 24); c.stroke();
            }
          }
          function rolete(X, Y) {
            pino(X, Y - 4);
            [-5, 5].forEach(function (d) {
              c.beginPath(); c.arc(X + d, Y + 15, 3.2, 0, Math.PI * 2); c.stroke();
            });
          }
          pino(pl.px(0), pl.py(0));
          rolete(pl.px(p.vao), pl.py(0));

          /* cargas */
          c.strokeStyle = Plot.serie(3); c.fillStyle = Plot.serie(3); c.lineWidth = 2.2;
          Object.keys(cargas).forEach(function (k) {
            var no = g.nos[+k];
            var X = pl.px(no.x), Y = pl.py(no.y);
            c.beginPath(); c.moveTo(X, Y - 42); c.lineTo(X, Y - 6); c.stroke();
            c.beginPath();
            c.moveTo(X, Y - 2); c.lineTo(X - 4.5, Y - 11); c.lineTo(X + 4.5, Y - 11);
            c.closePath(); c.fill();
            c.font = '600 10px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText(p.P + ' kN', X, Y - 45);
          });

          /* reações */
          c.fillStyle = Plot.serie(2);
          c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'top';
          c.fillText(Plot.sig(RA, 4) + ' kN', pl.px(0), pl.py(0) + 30);
          c.fillText(Plot.sig(RB, 4) + ' kN', pl.px(p.vao), pl.py(0) + 30);
        });
        gp.draw();

        /* gráfico de barras */
        var gf = ctx.plot('forcas').clear();
        var xs = forcas.map(function (_, i) { return i; });
        gf.bars(xs, forcas, { color: Plot.serie(0), width: 0.7 });
        gf.hline(0, { color: Plot.cssVar('--text-faint', '#888'), dash: [], width: 1.2 });
        gf.setLimits([-0.8, forcas.length - 0.2], null).draw();

        /* ---------- passo a passo ---------- */
        var nt = Plot.numTex, sg = Plot.sig;
        var cargaTotal = Object.keys(cargas).length * p.P;
        var nosN = g.nos.length, mB = g.barras.length;
        ctx.setPassos([
          { t: 'Contagem e estaticidade',
            tex: 'm + r = 2n',
            texSub: mB + ' + 3 = ' + (mB + 3) + ' \\quad\\text{versus}\\quad 2 \\cdot ' + nosN +
                    ' = ' + (2 * nosN),
            r: r.grau === 0 ? 'Isostática — resolve só por equilíbrio'
                            : r.grau > 0 ? r.grau + '× hiperestática' : 'Hipostática (mecanismo)',
            obs: 'm = barras, r = reações (pino dá 2, rolete dá 1), n = nós.' },
          { t: 'Reações de apoio',
            tex: '\\sum M_A = 0 \\;\\Rightarrow\\; R_B \\qquad \\sum F_y = 0 \\;\\Rightarrow\\; R_A',
            texSub: 'R_A = ' + nt(RA, 4) + '\\ \\text{kN} \\qquad R_B = ' + nt(RB, 4) + '\\ \\text{kN}',
            obs: 'Conferência: R_A + R_B = ' + sg(RA + RB, 4) + ' kN deve igualar a carga total de ' +
                 sg(cargaTotal, 4) + ' kN.' },
          { t: 'Equilíbrio de cada nó',
            tex: '\\sum F_x = 0 \\qquad \\sum F_y = 0 \\quad \\text{em cada nó}',
            c: 'São ' + nosN + ' nós × 2 equações = ' + (2 * nosN) + ' equações\\n' +
               'Incógnitas: ' + mB + ' forças de barra + 3 reações = ' + (mB + 3),
            obs: 'Sistema quadrado e resolvido de uma vez. À mão, começa-se por um nó com no máximo duas incógnitas.' },
          { t: 'Barra mais tracionada',
            texSub: 'F_{\\text{max}}^{+} = ' + nt(tmax, 4) + '\\ \\text{kN} \\quad (\\text{barra ' +
                    (g.barras[iT][0] + 1) + '\\text{--}' + (g.barras[iT][1] + 1) + '})',
            obs: 'Tração dimensiona por área: A ≥ F/σ_adm. Não há risco de flambagem.' },
          { t: 'Barra mais comprimida',
            texSub: 'F_{\\text{max}}^{-} = ' + nt(cmax, 4) + '\\ \\text{kN} \\quad (\\text{barra ' +
                    (g.barras[iC][0] + 1) + '\\text{--}' + (g.barras[iC][1] + 1) + '})',
            obs: 'Compressão dimensiona por FLAMBAGEM, não por resistência. É por isso que a Pratt, com diagonais tracionadas, é preferida em aço.' },
          { t: 'Efeito da altura',
            tex: 'F_{\\text{banzo}} \\approx \\frac{M}{h}',
            texSub: 'M_{\\text{meio}} \\approx ' + nt(cargaTotal * p.vao / 8, 4) + '\\ \\text{kN·m} \\quad h = ' +
                    p.altura + '\\ \\text{m}',
            obs: 'A força nos banzos é inversamente proporcional à altura: reduzir h pela metade dobra a força. Compare os exemplos 1 e 4.' }
        ]);

        return {
          estat: { v: r.grau === 0 ? 'Isostática' : (r.grau > 0 ? 'Hiperestática' : 'Mecanismo'),
                   u: '', classe: r.grau === 0 ? 'ok' : 'alerta' },
          RA: { v: RA, u: 'kN' },
          RB: { v: RB, u: 'kN' },
          tmax: { v: tmax, u: 'kN', classe: 'destaque' },
          cmax: { v: cmax, u: 'kN', classe: 'alerta' },
          nulas: { v: nulas, u: '' }
        };
      }
    });
  })();

  /* ============================================================
     2. Equilíbrio de corpo rígido
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-equilibrio')) return;

    Sim.build('#sim-equilibrio', {
      titulo: 'Equilíbrio de corpo rígido — reações de apoio',
      descricao: 'Três equações no plano, três incógnitas. Mude as cargas e veja as reações se ajustarem, com a verificação de equilíbrio sempre fechando.',
      controlesLargos: true,
      controles: [
        { id: 'L', label: 'Comprimento da barra', min: 2, max: 12, step: 0.5, valor: 6, unidade: 'm' },
        { id: 'apoio', tipo: 'seg', label: 'Vinculação', valor: 'pino',
          opcoes: [{ v: 'pino', t: 'Pino + rolete' }, { v: 'engaste', t: 'Engaste' }] },
        { tipo: 'titulo', label: 'Carga concentrada' },
        { id: 'P', label: 'Intensidade P', min: 0, max: 100, step: 5, valor: 30, unidade: 'kN' },
        { id: 'Px', label: 'Posição', min: 0, max: 1, step: 0.05, valor: 0.4, unidade: '·L' },
        { id: 'ang', label: 'Inclinação da carga', min: 0, max: 90, step: 5, valor: 90, unidade: '°',
          desc: '90° = vertical. Menos que isso gera componente horizontal.' },
        { tipo: 'titulo', label: 'Carga distribuída' },
        { id: 'q', label: 'Intensidade q', min: 0, max: 40, step: 2, valor: 10, unidade: 'kN/m' },
        { id: 'qx1', label: 'Início', min: 0, max: 1, step: 0.05, valor: 0.5, unidade: '·L' },
        { id: 'qx2', label: 'Fim', min: 0, max: 1, step: 0.05, valor: 1, unidade: '·L' },
        { tipo: 'titulo', label: 'Momento aplicado' },
        { id: 'M0', label: 'Momento', min: -80, max: 80, step: 5, valor: 0, unidade: 'kN·m' }
      ],
      graficos: [
        { id: 'esq', axes: false, height: 320, grid: false, legend: false }
      ],
      saidas: [
        { id: 'Ftot', label: 'Carga vertical total' },
        { id: 'Ax', label: 'Reação horizontal' },
        { id: 'Ay', label: 'Reação em A' },
        { id: 'By', label: 'Reação em B' },
        { id: 'Meng', label: 'Momento no engaste' },
        { id: 'check', label: 'Verificação' }
      ],
      formulas: [
        { g: 'Equilíbrio no plano' },
        { tex: '\\sum F_x = 0 \\qquad \\sum F_y = 0 \\qquad \\sum M_O = 0', d: 'três equações independentes', destaque: true },
        { tex: '\\sum M_O = \\sum F_i \\cdot d_i', d: 'd = distância PERPENDICULAR da linha de ação ao polo' },

        { g: 'Reduções úteis' },
        { tex: 'R = q \\cdot L_q', d: 'carga distribuída uniforme vira resultante concentrada', destaque: true },
        { tex: '\\bar{x} = \\frac{x_1 + x_2}{2}', d: 'aplicada no centroide do trecho carregado' },
        { tex: 'R = \\frac{q_{\\text{max}} L_q}{2}, \\quad \\bar{x} \\text{ a } 2/3', d: 'carga triangular' },
        { tex: 'F_x = F\\cos\\alpha \\qquad F_y = F\\sin\\alpha', d: 'decomposição da carga inclinada' },

        { g: 'Vinculações e incógnitas' },
        { tex: '\\text{Rolete} \\to 1', d: 'só reação normal ao plano de apoio' },
        { tex: '\\text{Pino} \\to 2', d: 'reações horizontal e vertical, sem momento' },
        { tex: '\\text{Engaste} \\to 3', d: 'duas forças e um momento', destaque: true },
        { tex: '\\text{incógnitas} = 3 \\Rightarrow \\text{isostático}', d: 'mais que isso exige compatibilidade' },

        { g: 'Estratégia de cálculo' },
        { tex: '\\sum M_A = 0 \\Rightarrow R_B', d: 'tome momento no apoio com mais incógnitas: elas somem' },
        { tex: '\\sum F_y = 0 \\Rightarrow R_A', d: 'e confira com ΣM_B = 0' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Corpo rígido, cargas coplanares, apoios ideais sem atrito. Momento positivo no sentido anti-horário.',
      calcular: function (p, ctx) {
        var L = p.L;
        var a = p.ang * Math.PI / 180;
        var Pv = p.P * Math.sin(a), Ph = p.P * Math.cos(a);
        var xP = p.Px * L;
        var Lq = Math.max(0, (p.qx2 - p.qx1)) * L;
        var Rq = p.q * Lq, xq = (p.qx1 + p.qx2) / 2 * L;
        var Ftot = Pv + Rq;

        var Ax, Ay, By, Meng = 0;
        if (p.apoio === 'pino') {
          /* ΣM_A = 0 → By */
          By = (Pv * xP + Rq * xq - p.M0) / L;
          Ay = Ftot - By;
          Ax = -Ph;
        } else {
          Ay = Ftot;
          Ax = -Ph;
          By = 0;
          Meng = Pv * xP + Rq * xq - p.M0;
        }

        /* verificação */
        var somaFy = Ay + By - Ftot;
        var somaM = (p.apoio === 'pino')
          ? (By * L - Pv * xP - Rq * xq + p.M0)
          : (Meng - Pv * xP - Rq * xq + p.M0);

        /* ---------- desenho ---------- */
        var d = ctx.plot('esq').clear();
        d.setLimits([-L * 0.12, L * 1.12], [-2.1, 1.5]);
        d.custom(function (c, pl) {
          var Y = pl.py(0), X0 = pl.px(0), X1 = pl.px(L);
          /* barra */
          c.fillStyle = Plot.cssVar('--text-muted', '#666');
          c.globalAlpha = 0.28; c.fillRect(X0, Y - 7, X1 - X0, 14); c.globalAlpha = 1;
          c.strokeStyle = Plot.cssVar('--text', '#111'); c.lineWidth = 1.7;
          c.strokeRect(X0, Y - 7, X1 - X0, 14);

          function hach(X, meia, yb) {
            c.lineWidth = 1.1;
            for (var k = -meia; k <= meia; k += 5) {
              c.beginPath(); c.moveTo(X + k, yb); c.lineTo(X + k - 5, yb + 7); c.stroke();
            }
          }
          if (p.apoio === 'pino') {
            c.lineWidth = 1.7;
            c.beginPath(); c.moveTo(X0, Y + 7); c.lineTo(X0 - 10, Y + 22); c.lineTo(X0 + 10, Y + 22);
            c.closePath(); c.stroke(); hach(X0, 12, Y + 23);
            c.beginPath(); c.moveTo(X1, Y + 7); c.lineTo(X1 - 10, Y + 18); c.lineTo(X1 + 10, Y + 18);
            c.closePath(); c.stroke();
            [-5, 5].forEach(function (dd) {
              c.beginPath(); c.arc(X1 + dd, Y + 21.5, 3.2, 0, Math.PI * 2); c.stroke();
            });
            hach(X1, 12, Y + 25);
          } else {
            c.lineWidth = 2.6;
            c.beginPath(); c.moveTo(X0, Y - 26); c.lineTo(X0, Y + 26); c.stroke();
            c.lineWidth = 1.1;
            for (var k2 = -26; k2 <= 26; k2 += 6) {
              c.beginPath(); c.moveTo(X0, Y + k2); c.lineTo(X0 - 9, Y + k2 + 6); c.stroke();
            }
          }

          /* carga distribuída */
          if (Rq > 0) {
            var qa = pl.px(p.qx1 * L), qb = pl.px(p.qx2 * L);
            c.strokeStyle = Plot.serie(2); c.fillStyle = Plot.serie(2); c.lineWidth = 1.5;
            var topo = Y - 7 - 28;
            c.beginPath(); c.moveTo(qa, topo); c.lineTo(qb, topo); c.stroke();
            var nn = Math.max(3, Math.min(14, Math.round((qb - qa) / 24)));
            for (var i = 0; i <= nn; i++) {
              var xx = qa + (qb - qa) * i / nn;
              c.beginPath(); c.moveTo(xx, topo); c.lineTo(xx, Y - 10); c.stroke();
              c.beginPath(); c.moveTo(xx, Y - 8); c.lineTo(xx - 3, Y - 14); c.lineTo(xx + 3, Y - 14);
              c.closePath(); c.fill();
            }
            c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText('q = ' + p.q + ' kN/m', (qa + qb) / 2, topo - 4);
          }

          /* carga concentrada inclinada */
          if (p.P > 0) {
            var Xp = pl.px(xP);
            c.strokeStyle = Plot.serie(1); c.fillStyle = Plot.serie(1); c.lineWidth = 2.4;
            var comp = 52;
            var ux = Math.cos(a), uy = Math.sin(a);
            var xi = Xp - ux * comp, yi = Y - 8 - uy * comp;
            c.beginPath(); c.moveTo(xi, yi); c.lineTo(Xp, Y - 8); c.stroke();
            c.beginPath();
            c.moveTo(Xp, Y - 5);
            c.lineTo(Xp - ux * 10 - uy * 4.5, Y - 8 - uy * 10 + ux * 4.5);
            c.lineTo(Xp - ux * 10 + uy * 4.5, Y - 8 - uy * 10 - ux * 4.5);
            c.closePath(); c.fill();
            c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText('P = ' + p.P + ' kN', xi, yi - 4);
          }

          /* momento aplicado */
          if (p.M0 !== 0) {
            var Xm = pl.px(L / 2);
            c.strokeStyle = Plot.serie(4); c.fillStyle = Plot.serie(4); c.lineWidth = 2.2;
            c.beginPath(); c.arc(Xm, Y, 17, 0.5, Math.PI * 1.6, p.M0 < 0); c.stroke();
            c.beginPath(); c.arc(Xm, Y - 17, 3.2, 0, Math.PI * 2); c.fill();
            c.font = '600 10px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'left'; c.textBaseline = 'middle';
            c.fillText('M = ' + p.M0 + ' kN·m', Xm + 22, Y - 16);
          }

          /* reações */
          c.strokeStyle = Plot.serie(0); c.fillStyle = Plot.serie(0); c.lineWidth = 2.4;
          function setaCima(X, val, rot) {
            if (Math.abs(val) < 1e-9) return;
            var s = val > 0 ? 1 : -1;
            c.beginPath(); c.moveTo(X, Y + 34 * s + 6 * s); c.lineTo(X, Y + 12 * s); c.stroke();
            c.beginPath();
            c.moveTo(X, Y + 8 * s);
            c.lineTo(X - 4.5, Y + 17 * s); c.lineTo(X + 4.5, Y + 17 * s);
            c.closePath(); c.fill();
            c.font = '600 10.5px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = s > 0 ? 'top' : 'bottom';
            c.fillText(rot + ' ' + Plot.sig(Math.abs(val), 4), X, Y + 40 * s);
          }
          /* cota do vao: sem ela nao da para ver o comprimento mudando */
          var yCota = Y + 92;
          c.strokeStyle = Plot.serie(7); c.fillStyle = Plot.serie(7); c.lineWidth = 1.4;
          c.setLineDash([]);
          c.beginPath(); c.moveTo(X0, yCota); c.lineTo(X1, yCota); c.stroke();
          [[X0, 1], [X1, -1]].forEach(function (q) {
            c.beginPath();
            c.moveTo(q[0], yCota);
            c.lineTo(q[0] + q[1] * 9, yCota - 4.2);
            c.lineTo(q[0] + q[1] * 9, yCota + 4.2);
            c.closePath(); c.fill();
          });
          c.strokeStyle = Plot.cssVar('--text-faint', '#999'); c.lineWidth = 1;
          c.setLineDash([3, 3]);
          c.beginPath(); c.moveTo(X0, Y + 10); c.lineTo(X0, yCota + 6); c.stroke();
          c.beginPath(); c.moveTo(X1, Y + 10); c.lineTo(X1, yCota + 6); c.stroke();
          c.setLineDash([]);
          c.fillStyle = Plot.serie(7);
          c.font = '700 11.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'center'; c.textBaseline = 'bottom';
          c.fillText('L = ' + Plot.sig(L, 3) + ' m', (X0 + X1) / 2, yCota - 6);

          /* posicao da carga concentrada, cotada a partir de A */
          if (p.P > 0) {
            var Xp = pl.px(p.Px * L);
            var yC2 = Y + 64;
            c.strokeStyle = Plot.serie(6); c.fillStyle = Plot.serie(6); c.lineWidth = 1.2;
            c.beginPath(); c.moveTo(X0, yC2); c.lineTo(Xp, yC2); c.stroke();
            [[X0, 1], [Xp, -1]].forEach(function (q) {
              c.beginPath();
              c.moveTo(q[0], yC2);
              c.lineTo(q[0] + q[1] * 7, yC2 - 3.4);
              c.lineTo(q[0] + q[1] * 7, yC2 + 3.4);
              c.closePath(); c.fill();
            });
            c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText('a = ' + Plot.sig(p.Px * L, 3) + ' m', (X0 + Xp) / 2, yC2 - 4);
          }

          setaCima(X0, Ay, 'Ay =');
          if (p.apoio === 'pino') setaCima(X1, By, 'By =');
          if (Math.abs(Ax) > 1e-9) {
            var s2 = Ax > 0 ? 1 : -1;
            c.beginPath(); c.moveTo(X0 - 40 * s2, Y); c.lineTo(X0 - 10 * s2, Y); c.stroke();
            c.beginPath();
            c.moveTo(X0 - 6 * s2, Y);
            c.lineTo(X0 - 15 * s2, Y - 4.5); c.lineTo(X0 - 15 * s2, Y + 4.5);
            c.closePath(); c.fill();
            c.textAlign = 'center'; c.textBaseline = 'bottom';
            c.fillText('Ax = ' + Plot.sig(Math.abs(Ax), 3), X0 - 42 * s2, Y - 6);
          }
        });
        d.draw();

        var nt = Plot.numTex, sg = Plot.sig;
        var passos = [
          { t: 'Redução das cargas a resultantes',
            tex: 'R_q = q \\cdot L_q \\quad\\text{em}\\quad \\bar{x} = \\frac{x_1+x_2}{2}',
            texSub: (p.P > 0 ? 'P_y = ' + p.P + '\\sin ' + p.ang + '^\\circ = ' + nt(Pv, 4) +
                      '\\ \\text{kN em } x = ' + nt(xP, 3) + '\\ \\text{m}' : '') +
                    (Rq > 0 ? ' \\\\ R_q = ' + p.q + ' \\cdot ' + nt(Lq, 3) + ' = ' + nt(Rq, 4) +
                      '\\ \\text{kN em } \\bar{x} = ' + nt(xq, 3) + '\\ \\text{m}' : ''),
            obs: 'A carga distribuída vira uma força concentrada igual à ÁREA do diagrama, aplicada no seu centroide.' },
          { t: 'Carga vertical total',
            tex: '\\sum F_y^{\\text{ext}} = P_y + R_q',
            texSub: '\\sum F_y^{\\text{ext}} = ' + nt(Pv, 4) + ' + ' + nt(Rq, 4) + ' = ' + nt(Ftot, 4) +
                    '\\ \\text{kN}' }
        ];
        if (p.apoio === 'pino') {
          passos.push(
            { t: 'Momento em A para achar B',
              tex: '\\sum M_A = 0: \\; R_B L = P_y x_P + R_q \\bar{x} - M_0',
              texSub: 'R_B \\cdot ' + L + ' = ' + nt(Pv, 4) + ' \\cdot ' + nt(xP, 3) + ' + ' +
                      nt(Rq, 4) + ' \\cdot ' + nt(xq, 3) + ' - (' + p.M0 + ')',
              r: 'B_y = ' + sg(By, 4) + ' kN',
              obs: 'Tomando momento em A, as duas reações de A somem da equação — sobra só B.' },
            { t: 'Equilíbrio vertical para achar A',
              tex: '\\sum F_y = 0: \\; A_y = \\sum F_y^{\\text{ext}} - R_B',
              texSub: 'A_y = ' + nt(Ftot, 4) + ' - ' + nt(By, 4) + ' = ' + nt(Ay, 4) + '\\ \\text{kN}' });
        } else {
          passos.push(
            { t: 'Equilíbrio vertical no engaste',
              tex: '\\sum F_y = 0: \\; A_y = \\sum F_y^{\\text{ext}}',
              texSub: 'A_y = ' + nt(Ftot, 4) + '\\ \\text{kN}' },
            { t: 'Momento de engastamento',
              tex: '\\sum M_A = 0: \\; M_A = P_y x_P + R_q \\bar{x} - M_0',
              texSub: 'M_A = ' + nt(Pv, 4) + ' \\cdot ' + nt(xP, 3) + ' + ' + nt(Rq, 4) +
                      ' \\cdot ' + nt(xq, 3) + ' - (' + p.M0 + ') = ' + nt(Meng, 4) + '\\ \\text{kN·m}',
              obs: 'O engaste é a única vinculação que fornece momento — por isso sozinho já equilibra a barra.' });
        }
        passos.push(
          { t: 'Equilíbrio horizontal',
            tex: '\\sum F_x = 0: \\; A_x = -P\\cos\\alpha',
            texSub: 'A_x = -' + p.P + '\\cos ' + p.ang + '^\\circ = ' + nt(Ax, 4) + '\\ \\text{kN}',
            obs: Math.abs(Ph) < 1e-9 ? 'Carga vertical: não há componente horizontal.'
                                     : 'Só o pino ou o engaste absorvem força horizontal — o rolete não.' },
          { t: 'Verificação',
            texSub: '\\sum F_y = ' + nt(somaFy, 3) + ' \\qquad \\sum M = ' + nt(somaM, 3),
            r: (Math.abs(somaFy) < 1e-6 && Math.abs(somaM) < 1e-6) ? 'Equilíbrio conferido' : 'Resíduo numérico',
            obs: 'Sempre confira com uma equação que não foi usada na solução — aqui, o momento no outro apoio.' });
        ctx.setPassos(passos);

        return {
          Ftot: { v: Ftot, u: 'kN' },
          Ax: { v: Ax, u: 'kN' },
          Ay: { v: Ay, u: 'kN', classe: 'destaque' },
          By: { v: p.apoio === 'pino' ? By : 0, u: 'kN', classe: p.apoio === 'pino' ? 'destaque' : '' },
          Meng: { v: Meng, u: 'kN·m', classe: p.apoio === 'engaste' ? 'destaque' : '' },
          check: { v: (Math.abs(somaFy) < 1e-6 && Math.abs(somaM) < 1e-6) ? 'OK' : 'resíduo',
                   u: '', classe: 'ok' }
        };
      }
    });
  })();

  /* ============================================================
     3. Atrito em plano inclinado
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-atrito')) return;

    Sim.build('#sim-atrito', {
      titulo: 'Atrito — bloco em plano inclinado',
      descricao: 'O ângulo de atrito decide tudo: abaixo dele o bloco fica parado sozinho; acima, escorrega. É o mesmo princípio do autotravamento de parafusos e rampas.',
      controlesLargos: true,
      controles: [
        { id: 'W', label: 'Peso do bloco', min: 10, max: 2000, step: 10, valor: 500, unidade: 'N' },
        { id: 'theta', label: 'Inclinação do plano', min: 0, max: 60, step: 1, valor: 20, unidade: '°' },
        { id: 'mus', label: 'Coef. de atrito estático μs', min: 0.02, max: 1.0, step: 0.01, valor: 0.30,
          unidade: '', desc: 'Aço-aço seco 0,6 · aço-aço lubrificado 0,1 · borracha-asfalto 0,9' },
        { id: 'muk', label: 'Coef. cinético μk', min: 0.01, max: 1.0, step: 0.01, valor: 0.25,
          unidade: '', desc: 'Sempre menor que o estático — daí o solavanco ao começar a deslizar.' },
        { tipo: 'separador' },
        { id: 'F', label: 'Força externa aplicada', min: 0, max: 1500, step: 10, valor: 0, unidade: 'N' },
        { id: 'angF', label: 'Ângulo da força com o plano', min: -60, max: 60, step: 5, valor: 0,
          unidade: '°', desc: 'Positivo = empurra para cima do plano.' }
      ],
      graficos: [
        { id: 'corpo', axes: false, height: 340, grid: false, legend: false },
        { id: 'curva', titulo: 'Força necessária em função da inclinação',
          xlabel: 'Inclinação θ (°)', ylabel: 'Força (N)', aspect: 0.36, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'N', label: 'Força normal' },
        { id: 'motriz', label: 'Componente motriz' },
        { id: 'fmax', label: 'Atrito máximo disponível' },
        { id: 'phi', label: 'Ângulo de atrito' },
        { id: 'estado', label: 'Estado do bloco' },
        { id: 'Fnec', label: 'Força p/ subir' }
      ],
      formulas: [
        { g: 'Decomposição no plano inclinado' },
        { tex: 'N = W\\cos\\theta', d: 'força normal ao plano', destaque: true },
        { tex: 'W_t = W\\sin\\theta', d: 'componente motriz, paralela ao plano', destaque: true },

        { g: 'Lei de Coulomb do atrito' },
        { tex: 'f_{\\text{max}} = \\mu_s N', d: 'atrito ESTÁTICO máximo disponível', destaque: true },
        { tex: 'f \\le f_{\\text{max}}', d: 'enquanto parado, o atrito vale só o necessário para equilibrar' },
        { tex: 'f = \\mu_k N', d: 'depois que desliza, o atrito é CONSTANTE e menor' },
        { tex: '\\mu_k < \\mu_s', d: 'por isso há um solavanco no início do movimento' },

        { g: 'Ângulo de atrito e autotravamento' },
        { tex: '\\phi = \\arctan\\mu_s', d: 'ângulo de atrito', destaque: true },
        { tex: '\\theta < \\phi \\Rightarrow \\text{bloco fica parado sozinho}', d: 'condição de AUTOTRAVAMENTO', destaque: true },
        { tex: '\\theta > \\phi \\Rightarrow \\text{escorrega sem força externa}', d: '' },
        { tex: '\\tan\\theta = \\mu_s', d: 'na iminência: não depende do peso!' },

        { g: 'Força para mover o bloco' },
        { tex: 'F_{\\text{subir}} = W(\\sin\\theta + \\mu_s\\cos\\theta)', d: 'atrito se opõe à subida', destaque: true },
        { tex: 'F_{\\text{descer}} = W(\\mu_s\\cos\\theta - \\sin\\theta)', d: 'se negativo, desce sozinho' },
        { tex: 'F_{\\text{min}} = W\\sin(\\theta+\\phi)', d: 'com a força na direção ótima, a φ do plano' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Atrito seco de Coulomb, bloco rígido sem tombamento, superfície plana. O coeficiente de atrito é adimensional e independe da área de contato aparente.',
      calcular: function (p, ctx) {
        var th = p.theta * Math.PI / 180;
        var aF = p.angF * Math.PI / 180;
        var W = p.W;
        var Ft = p.F * Math.cos(aF);          /* componente paralela ao plano */
        var Fn = p.F * Math.sin(aF);          /* componente normal */
        var N = W * Math.cos(th) - Fn;
        if (N < 0) N = 0;
        var Wt = W * Math.sin(th);
        var fmax = p.mus * N;
        var phi = Math.atan(p.mus) * 180 / Math.PI;

        /* resultante que tende a mover o bloco, positiva descendo */
        var motriz = Wt - Ft;
        var estado, cls;
        if (Math.abs(motriz) <= fmax + 1e-9) { estado = 'Em repouso (equilíbrio)'; cls = 'ok'; }
        else if (motriz > 0) { estado = 'DESCE — atrito insuficiente'; cls = 'alerta'; }
        else { estado = 'SOBE — força supera o atrito'; cls = ''; }

        var Fsubir = W * (Math.sin(th) + p.mus * Math.cos(th));
        var Fdescer = W * (p.mus * Math.cos(th) - Math.sin(th));

        /* ---------- desenho ---------- */
        var d = ctx.plot('corpo').clear();
        d.setLimits([-0.15, 1.25], [-0.25, 0.95]);
        d.custom(function (c, pl) {
          var X = function (u) { return pl.px(u); }, Y = function (u) { return pl.py(u); };
          var L0 = 1.0;
          var xB = 0.55, yB = xB * Math.tan(th);
          /* rampa */
          c.fillStyle = Plot.cssVar('--text-muted', '#666');
          c.globalAlpha = 0.18;
          c.beginPath();
          c.moveTo(X(0), Y(0)); c.lineTo(X(L0), Y(L0 * Math.tan(th))); c.lineTo(X(L0), Y(0));
          c.closePath(); c.fill();
          c.globalAlpha = 1;
          c.strokeStyle = Plot.cssVar('--text', '#111'); c.lineWidth = 2;
          c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(L0), Y(L0 * Math.tan(th))); c.stroke();
          c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(L0), Y(0)); c.stroke();
          /* hachura do solo */
          c.lineWidth = 1;
          c.strokeStyle = Plot.cssVar('--text-faint', '#999');
          for (var hx = 0; hx <= L0; hx += 0.06) {
            c.beginPath(); c.moveTo(X(hx), Y(0)); c.lineTo(X(hx) - 7, Y(0) + 8); c.stroke();
          }
          /* ângulo */
          c.strokeStyle = Plot.serie(4); c.lineWidth = 1.6;
          c.beginPath(); c.arc(X(0), Y(0), 40, -th, 0); c.stroke();
          c.fillStyle = Plot.serie(4);
          c.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'middle';
          c.fillText(p.theta + '°', X(0) + 46, Y(0) - 12);

          /* bloco girado */
          c.save();
          c.translate(X(xB), Y(yB));
          c.rotate(-th);
          c.fillStyle = Plot.serie(0); c.globalAlpha = 0.35;
          c.fillRect(-28, -34, 56, 34);
          c.globalAlpha = 1;
          c.strokeStyle = Plot.serie(0); c.lineWidth = 1.8;
          c.strokeRect(-28, -34, 56, 34);
          c.restore();

          /* o bloco assenta sobre o plano: o centro fica meia altura
             acima do ponto de contato, medido AO LONGO DA NORMAL */
          var aN = th + Math.PI / 2;                 /* normal a superficie */
          var aP = th;                               /* plano, subindo */
          var cx = X(xB) + Math.cos(aN) * 17;
          var cy = Y(yB) - Math.sin(aN) * 17;

          /* vetores: ang medido da horizontal, positivo no anti-horario */
          function vetor(ang, comp, cor, rot, tracejado) {
            if (!isFinite(comp) || comp < 4) return;
            c.strokeStyle = cor; c.fillStyle = cor;
            c.lineWidth = tracejado ? 1.4 : 2.4;
            c.setLineDash(tracejado ? [4, 3] : []);
            var ex = cx + Math.cos(ang) * comp, ey = cy - Math.sin(ang) * comp;
            c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
            c.setLineDash([]);
            c.beginPath();
            c.moveTo(ex + Math.cos(ang) * 8, ey - Math.sin(ang) * 8);
            c.lineTo(ex - Math.sin(ang) * 4.6, ey - Math.cos(ang) * 4.6);
            c.lineTo(ex + Math.sin(ang) * 4.6, ey + Math.cos(ang) * 4.6);
            c.closePath(); c.fill();
            c.font = (tracejado ? '10px ' : '600 11.5px ') +
                     Plot.cssVar('--font', 'sans-serif');
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(rot, ex + Math.cos(ang) * 21, ey - Math.sin(ang) * 21);
          }

          var esc = 54 / Math.max(W, 1);

          /* linha de referencia na direcao do plano */
          c.strokeStyle = Plot.cssVar('--text-faint', '#999');
          c.lineWidth = 1; c.setLineDash([3, 4]);
          c.beginPath();
          c.moveTo(cx - Math.cos(aP) * 86, cy + Math.sin(aP) * 86);
          c.lineTo(cx + Math.cos(aP) * 86, cy - Math.sin(aP) * 86);
          c.stroke();
          c.setLineDash([]);

          /* marca de angulo reto entre o plano e a normal */
          var q = 12;
          c.strokeStyle = Plot.serie(2); c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(cx + Math.cos(aP) * q, cy - Math.sin(aP) * q);
          c.lineTo(cx + Math.cos(aP) * q + Math.cos(aN) * q,
                   cy - Math.sin(aP) * q - Math.sin(aN) * q);
          c.lineTo(cx + Math.cos(aN) * q, cy - Math.sin(aN) * q);
          c.stroke();

          /* decomposicao do peso nas direcoes do plano e da normal */
          vetor(aP + Math.PI, W * Math.sin(th) * esc, Plot.serie(3), 'W senθ', true);
          vetor(aN + Math.PI, W * Math.cos(th) * esc, Plot.serie(3), 'W cosθ', true);

          /* peso: sempre vertical, para baixo */
          vetor(-Math.PI / 2, W * esc, Plot.serie(3), 'W');
          /* normal: perpendicular ao plano, saindo da superficie */
          vetor(aN, N * esc, Plot.serie(2), 'N');
          /* atrito: paralelo ao plano, contra o movimento iminente */
          var fAtu = Math.min(Math.abs(motriz), fmax);
          if (fAtu > 1e-9) {
            vetor(motriz >= 0 ? aP : aP + Math.PI, fAtu * esc, Plot.serie(1), 'f');
          }
          /* forca externa: angulo medido a partir do plano */
          if (p.F > 0) vetor(aP + aF, p.F * esc, Plot.serie(6), 'F');

          c.fillStyle = Plot.cssVar('--text-faint', '#999');
          c.font = '10.5px ' + Plot.cssVar('--font', 'sans-serif');
          c.textAlign = 'left'; c.textBaseline = 'bottom';
          c.fillText('N ⟂ ao plano   ·   f ∥ ao plano, contra o movimento iminente' +
                     (motriz >= 0 ? ' (o bloco tende a descer)'
                                  : ' (o bloco tende a subir)'),
                     pl._area.x + 4, pl._area.y + pl._area.h - 3);
        });
        d.draw();

        /* curva */
        var ths = Plot.linspace(0, 60, 90);
        var gc = ctx.plot('curva').clear();
        gc.line(ths, ths.map(function (t) {
          var tr = t * Math.PI / 180;
          return W * (Math.sin(tr) + p.mus * Math.cos(tr));
        }), { color: Plot.serie(1), width: 2.4, label: 'Força para SUBIR' });
        gc.line(ths, ths.map(function (t) {
          var tr = t * Math.PI / 180;
          return Math.max(0, W * (p.mus * Math.cos(tr) - Math.sin(tr)));
        }), { color: Plot.serie(2), width: 2.4, label: 'Força para SEGURAR' });
        gc.vline(phi, { color: Plot.serie(7), dash: [5, 4], width: 1.8,
                        text: 'φ = ' + Plot.sig(phi, 3) + '° (autotravamento)' });
        gc.vline(p.theta, { color: Plot.serie(6), dash: [3, 3], width: 1.4, text: 'θ atual' });
        gc.setLimits([0, 60], null).draw();

        var nt = Plot.numTex, sg = Plot.sig;
        ctx.setPassos([
          { t: 'Decomposição do peso',
            tex: 'N = W\\cos\\theta \\qquad W_t = W\\sin\\theta',
            texSub: 'N = ' + W + '\\cos ' + p.theta + '^\\circ = ' + nt(W * Math.cos(th), 4) +
                    '\\ \\text{N} \\qquad W_t = ' + W + '\\sin ' + p.theta + '^\\circ = ' +
                    nt(Wt, 4) + '\\ \\text{N}',
            obs: p.F > 0 ? 'A força externa também tem componente normal, que altera N para ' +
                           sg(N, 4) + ' N.' : 'Sem força externa, N vem só do peso.' },
          { t: 'Atrito máximo disponível',
            tex: 'f_{\\text{max}} = \\mu_s N',
            texSub: 'f_{\\text{max}} = ' + p.mus + ' \\cdot ' + nt(N, 4) + ' = ' + nt(fmax, 4) + '\\ \\text{N}',
            obs: 'É um LIMITE, não o valor atual. Enquanto o bloco está parado, o atrito vale apenas o necessário para equilibrar.' },
          { t: 'Comparação decisiva',
            tex: '|W_t - F_t| \\;\\text{versus}\\; f_{\\text{max}}',
            texSub: '|' + nt(Wt, 4) + ' - ' + nt(Ft, 4) + '| = ' + nt(Math.abs(motriz), 4) +
                    ' \\quad\\text{versus}\\quad ' + nt(fmax, 4),
            r: estado,
            obs: Math.abs(motriz) <= fmax
              ? 'A força motriz não vence o atrito: o bloco permanece em repouso.'
              : 'A força motriz supera o atrito máximo: há movimento.' },
          { t: 'Ângulo de atrito',
            tex: '\\phi = \\arctan\\mu_s',
            texSub: '\\phi = \\arctan(' + p.mus + ') = ' + nt(phi, 4) + '^\\circ',
            r: p.theta < phi ? 'θ < φ → AUTOTRAVANTE' : 'θ > φ → escorrega sozinho',
            obs: 'Repare que a condição θ = φ não depende do peso: um bloco de 1 kg e outro de 1 tonelada escorregam no mesmo ângulo.' },
          { t: 'Força para subir a rampa',
            tex: 'F = W(\\sin\\theta + \\mu_s\\cos\\theta)',
            texSub: 'F = ' + W + '(\\sin ' + p.theta + '^\\circ + ' + p.mus + '\\cos ' + p.theta +
                    '^\\circ) = ' + nt(Fsubir, 4) + '\\ \\text{N}',
            obs: 'Ao subir, o atrito se soma à gravidade. Para descer de forma controlada bastam ' +
                 (Fdescer > 0 ? sg(Fdescer, 4) + ' N de retenção.' : '0 N — o bloco desce sozinho.') },
          { t: 'Depois que começa a mover',
            tex: 'f = \\mu_k N',
            texSub: 'f_{\\text{cinético}} = ' + p.muk + ' \\cdot ' + nt(N, 4) + ' = ' + nt(p.muk * N, 4) +
                    '\\ \\text{N}',
            obs: 'Como μk < μs, o atrito CAI assim que o movimento começa — daí o solavanco característico ao destravar um objeto pesado.' }
        ]);

        return {
          N: { v: N, u: 'N' },
          motriz: { v: motriz, u: 'N' },
          fmax: { v: fmax, u: 'N', classe: 'destaque' },
          phi: { v: phi, u: '°', classe: 'destaque' },
          estado: { v: estado, u: '', classe: cls },
          Fnec: { v: Fsubir, u: 'N' }
        };
      }
    });
  })();

  /* ============================================================
     4. Centroide e momento de inércia de seção composta
     ============================================================ */
  (function () {
    if (!document.getElementById('sim-centroide')) return;

    Sim.build('#sim-centroide', {
      titulo: 'Centroide e momento de inércia de seção composta',
      descricao: 'Monte um perfil com três retângulos e acompanhe o centroide e o momento de inércia. O teorema dos eixos paralelos mostra por que afastar material da linha neutra é tão eficiente.',
      controlesLargos: true,
      controles: [
        { tipo: 'titulo', label: 'Mesa superior' },
        { id: 'b1', label: 'Largura', min: 0, max: 300, step: 5, valor: 150, unidade: 'mm' },
        { id: 'h1', label: 'Altura', min: 0, max: 80, step: 2, valor: 16, unidade: 'mm' },
        { tipo: 'titulo', label: 'Alma' },
        { id: 'b2', label: 'Espessura', min: 2, max: 60, step: 1, valor: 10, unidade: 'mm' },
        { id: 'h2', label: 'Altura', min: 20, max: 500, step: 10, valor: 280, unidade: 'mm' },
        { tipo: 'titulo', label: 'Mesa inferior' },
        { id: 'b3', label: 'Largura', min: 0, max: 300, step: 5, valor: 150, unidade: 'mm' },
        { id: 'h3', label: 'Altura', min: 0, max: 80, step: 2, valor: 16, unidade: 'mm' }
      ],
      graficos: [
        { id: 'sec', axes: false, height: 330, grid: false, legend: false }
      ],
      saidas: [
        { id: 'A', label: 'Área total' },
        { id: 'yc', label: 'Centroide (da base)' },
        { id: 'Ix', label: 'Ix (eixo forte)' },
        { id: 'Iy', label: 'Iy (eixo fraco)' },
        { id: 'Wx', label: 'Módulo Wx' },
        { id: 'rx', label: 'Raio de giração rx' }
      ],
      formulas: [
        { g: 'Centroide de área composta' },
        { tex: '\\bar{y} = \\frac{\\sum A_i \\bar{y}_i}{\\sum A_i}', d: 'média das posições ponderada pelas áreas', destaque: true },
        { tex: '\\bar{y}_i = \\text{centroide de cada figura simples}', d: 'retângulo: no meio da altura' },
        { tex: '\\text{Área vazada entra com sinal NEGATIVO}', d: 'furos e recortes' },

        { g: 'Momento de inércia' },
        { tex: 'I_x = \\int y^2 \mathrm{d}A', d: 'segundo momento de área em relação ao eixo x' },
        { tex: 'I_{x,\\text{ret}} = \\frac{b h^3}{12}', d: 'retângulo em torno do PRÓPRIO centroide', destaque: true },
        { tex: 'I_{y,\\text{ret}} = \\frac{h b^3}{12}', d: 'em torno do eixo perpendicular' },

        { g: 'Teorema dos eixos paralelos (Steiner)' },
        { tex: 'I = I_c + A d^2', d: 'transporta a inércia para um eixo afastado de d', destaque: true },
        { tex: 'I_{\\text{total}} = \\sum (I_{c,i} + A_i d_i^2)', d: 'para a seção composta', destaque: true },
        { tex: 'd_i = \\bar{y}_i - \\bar{y}', d: 'distância do centroide da parte ao centroide global' },

        { g: 'Grandezas derivadas' },
        { tex: 'W = \\frac{I}{c}', d: 'módulo de resistência; c = distância à fibra extrema' },
        { tex: 'r = \\sqrt{\\frac{I}{A}}', d: 'raio de giração, usado na flambagem' },
        { tex: 'I \\propto h^3', d: 'dobrar a altura multiplica a inércia por 8' }
      ],
      passos: [],
      passosTitulo: 'Resolução passo a passo',
      passosAbertos: false,
      nota: 'Seção composta por três retângulos empilhados (perfil I ou T). Os momentos de inércia são calculados em relação aos eixos centroidais da seção completa.',
      calcular: function (p, ctx) {
        /* parte 3 = mesa inferior na base; 2 = alma; 1 = mesa superior */
        var partes = [
          { nome: 'Mesa inferior', b: p.b3, h: p.h3, y0: 0 },
          { nome: 'Alma', b: p.b2, h: p.h2, y0: p.h3 },
          { nome: 'Mesa superior', b: p.b1, h: p.h1, y0: p.h3 + p.h2 }
        ].filter(function (q) { return q.b > 0 && q.h > 0; });

        var A = 0, Sy = 0;
        partes.forEach(function (q) {
          q.A = q.b * q.h;
          q.yc = q.y0 + q.h / 2;
          A += q.A; Sy += q.A * q.yc;
        });
        var yc = A > 0 ? Sy / A : 0;
        var H = p.h1 + p.h2 + p.h3;

        var Ix = 0, Iy = 0;
        partes.forEach(function (q) {
          q.Ic = q.b * Math.pow(q.h, 3) / 12;
          q.d = q.yc - yc;
          q.Ist = q.A * q.d * q.d;
          Ix += q.Ic + q.Ist;
          Iy += q.h * Math.pow(q.b, 3) / 12;
        });
        var c = Math.max(yc, H - yc);
        var Wx = c > 0 ? Ix / c : 0;
        var rx = A > 0 ? Math.sqrt(Ix / A) : 0;

        /* ---------- desenho ---------- */
        var bmax = Math.max(p.b1, p.b2, p.b3, 1);
        var d = ctx.plot('sec').clear();
        d.setLimits([-bmax * 0.95, bmax * 0.95], [-H * 0.12, H * 1.12]);
        d.custom(function (cc, pl) {
          partes.forEach(function (q, i) {
            var X1 = pl.px(-q.b / 2), X2 = pl.px(q.b / 2);
            var Y1 = pl.py(q.y0 + q.h), Y2 = pl.py(q.y0);
            cc.fillStyle = Plot.serie(i);
            cc.globalAlpha = 0.30;
            cc.fillRect(X1, Y1, X2 - X1, Y2 - Y1);
            cc.globalAlpha = 1;
            cc.strokeStyle = Plot.serie(i); cc.lineWidth = 1.7;
            cc.strokeRect(X1, Y1, X2 - X1, Y2 - Y1);
            /* centroide da parte */
            cc.fillStyle = Plot.serie(i);
            cc.beginPath(); cc.arc(pl.px(0), pl.py(q.yc), 3, 0, Math.PI * 2); cc.fill();
            cc.font = '9.5px ' + Plot.cssVar('--font', 'sans-serif');
            cc.textAlign = 'left'; cc.textBaseline = 'middle';
            cc.fillText(q.nome + '  A = ' + Plot.sig(q.A, 4) + ' mm²',
                        pl.px(bmax * 0.55), pl.py(q.yc));
          });
          /* linha do centroide global */
          cc.strokeStyle = Plot.cssVar('--err', '#c33'); cc.lineWidth = 2;
          cc.setLineDash([7, 4]);
          cc.beginPath();
          cc.moveTo(pl.px(-bmax * 0.85), pl.py(yc)); cc.lineTo(pl.px(bmax * 0.5), pl.py(yc));
          cc.stroke(); cc.setLineDash([]);
          cc.fillStyle = Plot.cssVar('--err', '#c33');
          cc.font = '600 11px ' + Plot.cssVar('--font', 'sans-serif');
          cc.textAlign = 'left'; cc.textBaseline = 'bottom';
          cc.fillText('centroide  ȳ = ' + Plot.sig(yc, 4) + ' mm', pl.px(-bmax * 0.85), pl.py(yc) - 5);
          /* cota da altura */
          cc.strokeStyle = Plot.cssVar('--text-faint', '#999'); cc.lineWidth = 1;
          var Xc = pl.px(-bmax * 0.9);
          cc.beginPath(); cc.moveTo(Xc, pl.py(0)); cc.lineTo(Xc, pl.py(H)); cc.stroke();
          cc.fillStyle = Plot.cssVar('--text-faint', '#999');
          cc.save();
          cc.translate(Xc - 8, (pl.py(0) + pl.py(H)) / 2);
          cc.rotate(-Math.PI / 2);
          cc.textAlign = 'center'; cc.textBaseline = 'bottom';
          cc.font = '10px ' + Plot.cssVar('--font', 'sans-serif');
          cc.fillText('H = ' + Plot.sig(H, 4) + ' mm', 0, 0);
          cc.restore();
        });
        d.draw();

        var nt = Plot.numTex, sg = Plot.sig;
        var linhasA = partes.map(function (q) {
          return '  ' + q.nome + ': A = ' + sg(q.A, 5) + ' mm², ȳ = ' + sg(q.yc, 4) + ' mm';
        }).join('\n');
        var somaNum = partes.map(function (q) {
          return sg(q.A, 5) + '\\cdot' + sg(q.yc, 4);
        }).join(' + ');
        var somaDen = partes.map(function (q) { return sg(q.A, 5); }).join(' + ');

        ctx.setPassos([
          { t: 'Divisão em figuras simples',
            c: linhasA + '\nÁrea total A = ' + sg(A, 5) + ' mm²',
            obs: 'Cada retângulo tem centroide no meio da própria altura. Áreas vazadas entrariam com sinal negativo.' },
          { t: 'Centroide da seção composta',
            tex: '\\bar{y} = \\frac{\\sum A_i \\bar{y}_i}{\\sum A_i}',
            texSub: '\\bar{y} = \\frac{' + somaNum + '}{' + somaDen + '} = ' + nt(yc, 5) + '\\ \\text{mm}',
            r: 'ȳ = ' + sg(yc, 5) + ' mm da base',
            obs: Math.abs(yc - H / 2) < 0.5
              ? 'Como a seção é simétrica, o centroide caiu exatamente no meio da altura.'
              : 'A seção é assimétrica, então o centroide se desloca para o lado com mais área.' },
          { t: 'Inércia própria de cada parte',
            tex: 'I_{c,i} = \\frac{b_i h_i^3}{12}',
            c: partes.map(function (q) {
              return '  ' + q.nome + ': ' + sg(q.b, 4) + '·' + sg(q.h, 4) + '³/12 = ' + sg(q.Ic, 4) + ' mm⁴';
            }).join('\n'),
            obs: 'Note a terceira potência da altura — é o que faz a alma alta ser tão eficiente.' },
          { t: 'Transporte pelo teorema de Steiner',
            tex: 'I_x = \\sum (I_{c,i} + A_i d_i^2), \\quad d_i = \\bar{y}_i - \\bar{y}',
            c: partes.map(function (q) {
              return '  ' + q.nome + ': d = ' + sg(q.d, 4) + ' mm → A·d² = ' + sg(q.Ist, 4) + ' mm⁴';
            }).join('\n'),
            r: 'Ix = ' + sg(Ix, 5) + ' mm⁴ = ' + sg(Ix / 1e4, 4) + ' cm⁴',
            obs: 'A parcela A·d² costuma dominar nas mesas: é por isso que afastar material da linha neutra vale muito mais que engrossá-lo.' },
          { t: 'Eixo fraco',
            tex: 'I_y = \\sum \\frac{h_i b_i^3}{12}',
            texSub: 'I_y = ' + nt(Iy / 1e4, 4) + '\\ \\text{cm}^4 \\quad\\text{contra}\\quad I_x = ' +
                    nt(Ix / 1e4, 4) + '\\ \\text{cm}^4',
            r: 'Ix/Iy = ' + sg(Ix / Math.max(Iy, 1e-9), 4),
            obs: 'Não há transporte aqui, porque todos os retângulos são centrados no eixo y. É no eixo FRACO que a coluna flamba.' },
          { t: 'Grandezas derivadas',
            tex: 'W = \\frac{I}{c} \\qquad r = \\sqrt{\\frac{I}{A}}',
            texSub: 'W_x = \\frac{' + nt(Ix, 5) + '}{' + nt(c, 4) + '} = ' + nt(Wx, 5) +
                    '\\ \\text{mm}^3 \\qquad r_x = ' + nt(rx, 4) + '\\ \\text{mm}',
            obs: 'W é o que dimensiona por flexão (σ = M/W); r é o que dimensiona por flambagem (λ = L/r).' }
        ]);

        return {
          A: { v: A, u: 'mm²' },
          yc: { v: yc, u: 'mm', classe: 'destaque' },
          Ix: { v: Ix / 1e4, u: 'cm⁴', classe: 'destaque' },
          Iy: { v: Iy / 1e4, u: 'cm⁴' },
          Wx: { v: Wx / 1e3, u: 'cm³' },
          rx: { v: rx, u: 'mm' }
        };
      }
    });
  })();

})();

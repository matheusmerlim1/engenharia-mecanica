/* ============================================================
   Quiz - motor de simulado
   Le data/questoes/<slug>.json e monta a sessao de estudo.

   Uso na pagina da disciplina:
     <div id="simulado" data-quiz="termodinamica"></div>
     <script src="../js/core/quiz.js"></script>
     <script>Quiz.montar('#simulado');</script>
   ============================================================ */
(function (global) {
  'use strict';

  var LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var DIFS = [
    { id: 'facil', nome: 'Facil', cls: 'd-facil' },
    { id: 'medio', nome: 'Medio', cls: 'd-medio' },
    { id: 'dificil', nome: 'Dificil', cls: 'd-dificil' }
  ];
  var TIPOS = [
    { id: 'multipla', nome: 'Multipla escolha' },
    { id: 'calculo', nome: 'Calculo' },
    { id: 'discursiva', nome: 'Discursiva' }
  ];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function embaralhar(a) {
    var arr = a.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ---------- avaliador de expressoes (sem eval) ---------- */
  var FUNCS = {
    sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    ln: Math.log, log: function (x) { return Math.log(x) / Math.LN10; },
    exp: Math.exp, abs: Math.abs, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh
  };
  var CONSTS = { pi: Math.PI, e: Math.E };

  /* nomes que aparecem nos formularios e nao sao a constante pi */
  var DICAS = {
    p_i: 'pressao interna', p_e: 'pressao externa', p_int: 'pressao interna',
    r_i: 'raio interno', r_e: 'raio externo', s_y: 'limite de escoamento',
    s_ut: 'limite de resistencia', d_medio: 'diametro medio'
  };

  function calcular(expr) {
    var s = String(expr)
      .toLowerCase()
      /* operadores tipograficos que vem de texto colado */
      .replace(/[\u2212\u2013\u2014\u2010\u2011]/g, '-')
      .replace(/[\u00d7\u00b7\u2022\u2219]/g, '*')
      .replace(/[\u00f7]/g, '/')
      .replace(/\u00b2/g, '^2').replace(/\u00b3/g, '^3')
      .replace(/\u221a/g, 'sqrt')
      .replace(/\u03c0/g, 'pi')
      .replace(/[\u00a0\s]+/g, '')
      /* virgula decimal e separador de milhar com ponto fino */
      .replace(/,/g, '.')
      /* "=" no fim, que todo mundo escreve por habito */
      .replace(/=+$/, '');
    var i = 0;

    function peek() { return s[i]; }
    function eat(c) { if (s[i] === c) { i++; return true; } return false; }

    function parseExpr() {
      var v = parseTerm();
      while (true) {
        if (eat('+')) v += parseTerm();
        else if (eat('-')) v -= parseTerm();
        else return v;
      }
    }
    function parseTerm() {
      var v = parseUnary();
      while (true) {
        if (eat('*')) v *= parseUnary();
        else if (eat('/')) v /= parseUnary();
        else if (eat('%')) v %= parseUnary();
        else return v;
      }
    }
    function parseUnary() {
      if (eat('-')) return -parseUnary();
      if (eat('+')) return parseUnary();
      return parsePow();
    }
    function parsePow() {
      var base = parseAtom();
      if (eat('^') || (s[i] === '*' && s[i + 1] === '*' && (i += 2))) {
        return Math.pow(base, parseUnary());
      }
      return base;
    }
    function parseAtom() {
      if (eat('(')) {
        var v = parseExpr();
        if (!eat(')')) throw new Error('faltou )');
        return v;
      }
      var m = /^[a-z][a-z_0-9]*/.exec(s.slice(i));
      if (m) {
        var nome = m[0];
        i += nome.length;
        if (FUNCS[nome]) {
          if (!eat('(')) throw new Error('faltou ( apos ' + nome);
          var arg = parseExpr();
          if (!eat(')')) throw new Error('faltou )');
          return FUNCS[nome](arg);
        }
        if (nome in CONSTS) return CONSTS[nome];
        if (DICAS[nome]) {
          throw new Error('"' + nome + '" e ' + DICAS[nome] +
                          ': troque pelo valor numerico (pi sozinho e 3,1416)');
        }
        throw new Error('"' + nome + '" e uma variavel: troque pelo valor numerico');
      }
      var n = /^\d*\.?\d+(e[+-]?\d+)?/.exec(s.slice(i));
      if (n) { i += n[0].length; return parseFloat(n[0]); }
      throw new Error('caractere inesperado: ' + (peek() || 'fim'));
    }

    var r = parseExpr();
    if (i < s.length) throw new Error('sobrou: ' + s.slice(i));
    return r;
  }

  function fmtNum(v) {
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 1e7 || a < 1e-4) return v.toExponential(5).replace('e+', 'e');
    return String(Number(v.toPrecision(9)));
  }

  /* ============================================================
     Quiz
     ============================================================ */
  function Quiz(host, banco) {
    this.host = host;
    this.banco = banco;
    this.slug = banco.slug;
    this.chaveLS = 'engmec:' + this.slug;
    this.cfg = this._carregarCfg();
    this.render();
  }

  Quiz.prototype._carregarCfg = function () {
    var padrao = {
      dificuldades: ['facil', 'medio', 'dificil'],
      tipos: ['multipla', 'calculo', 'discursiva'],
      topicos: [],
      qtd: 10,
      embaralhar: true
    };
    try {
      var raw = localStorage.getItem(this.chaveLS + ':cfg');
      if (raw) return Object.assign(padrao, JSON.parse(raw));
    } catch (e) { /* ignora */ }
    return padrao;
  };
  Quiz.prototype._salvarCfg = function () {
    try { localStorage.setItem(this.chaveLS + ':cfg', JSON.stringify(this.cfg)); } catch (e) { /* ignora */ }
  };

  Quiz.prototype.filtrar = function () {
    var c = this.cfg;
    return (this.banco.questoes || []).filter(function (q) {
      if (c.dificuldades.length && c.dificuldades.indexOf(q.dificuldade) < 0) return false;
      if (c.tipos.length && c.tipos.indexOf(q.tipo) < 0) return false;
      if (c.topicos.length && c.topicos.indexOf(q.topico) < 0) return false;
      return true;
    });
  };

  /* ---------- painel de configuracao ---------- */
  Quiz.prototype.render = function () {
    var self = this;
    var qs = this.banco.questoes || [];
    this.host.innerHTML = '';
    var root = el('div', 'quiz-root');
    this.host.appendChild(root);

    if (!qs.length) {
      root.appendChild(el('div', 'quiz-vazio', '<p>Banco de questoes ainda vazio para esta disciplina.</p>'));
      return;
    }

    var panel = el('div', 'quiz-panel');
    panel.appendChild(el('h3', null, 'Montar simulado'));
    panel.appendChild(el('p', null,
      'Selecione o recorte de estudo. Sao ' + qs.length + ' questoes disponiveis em ' +
      (this.banco.topicos || []).length + ' topicos.'));

    /* dificuldade */
    var gDif = el('div', 'cfg-group');
    gDif.appendChild(el('label', 'cfg-label', 'Dificuldade'));
    var chipsDif = el('div', 'chips');
    DIFS.forEach(function (d) {
      var n = qs.filter(function (q) { return q.dificuldade === d.id; }).length;
      if (!n) return;
      var lab = el('label', 'chip ' + d.cls);
      lab.innerHTML = '<span class="dot"></span>' + d.nome + ' <span style="opacity:.6">' + n + '</span>';
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = self.cfg.dificuldades.indexOf(d.id) >= 0;
      lab.insertBefore(cb, lab.firstChild);
      cb.addEventListener('change', function () {
        var arr = self.cfg.dificuldades.filter(function (x) { return x !== d.id; });
        if (cb.checked) arr.push(d.id);
        self.cfg.dificuldades = arr;
        self._salvarCfg(); self._atualizarContagem();
      });
      chipsDif.appendChild(lab);
    });
    gDif.appendChild(chipsDif);
    panel.appendChild(gDif);

    /* tipo */
    var gTipo = el('div', 'cfg-group');
    gTipo.appendChild(el('label', 'cfg-label', 'Tipo de questao'));
    var chipsTipo = el('div', 'chips');
    TIPOS.forEach(function (t) {
      var n = qs.filter(function (q) { return q.tipo === t.id; }).length;
      if (!n) return;
      var lab = el('label', 'chip');
      lab.innerHTML = t.nome + ' <span style="opacity:.6">' + n + '</span>';
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = self.cfg.tipos.indexOf(t.id) >= 0;
      lab.insertBefore(cb, lab.firstChild);
      cb.addEventListener('change', function () {
        var arr = self.cfg.tipos.filter(function (x) { return x !== t.id; });
        if (cb.checked) arr.push(t.id);
        self.cfg.tipos = arr;
        self._salvarCfg(); self._atualizarContagem();
      });
      chipsTipo.appendChild(lab);
    });
    gTipo.appendChild(chipsTipo);
    panel.appendChild(gTipo);

    /* topicos */
    if ((this.banco.topicos || []).length > 1) {
      var gTop = el('div', 'cfg-group');
      gTop.appendChild(el('label', 'cfg-label', 'Topicos (vazio = todos)'));
      var chipsTop = el('div', 'chips');
      this.banco.topicos.forEach(function (t) {
        var n = qs.filter(function (q) { return q.topico === t.id; }).length;
        if (!n) return;
        var lab = el('label', 'chip');
        lab.innerHTML = esc(t.nome) + ' <span style="opacity:.6">' + n + '</span>';
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = self.cfg.topicos.indexOf(t.id) >= 0;
        lab.insertBefore(cb, lab.firstChild);
        cb.addEventListener('change', function () {
          var arr = self.cfg.topicos.filter(function (x) { return x !== t.id; });
          if (cb.checked) arr.push(t.id);
          self.cfg.topicos = arr;
          self._salvarCfg(); self._atualizarContagem();
        });
        chipsTop.appendChild(lab);
      });
      gTop.appendChild(chipsTop);
      panel.appendChild(gTop);
    }

    /* quantidade */
    var gQtd = el('div', 'cfg-group');
    gQtd.appendChild(el('label', 'cfg-label', 'Quantidade'));
    var chipsQtd = el('div', 'chips');
    [5, 10, 15, 20, 0].forEach(function (n) {
      var lab = el('label', 'chip');
      lab.innerHTML = n === 0 ? 'Todas' : String(n);
      var rd = el('input'); rd.type = 'radio'; rd.name = 'qtd_' + self.slug;
      rd.checked = self.cfg.qtd === n;
      lab.insertBefore(rd, lab.firstChild);
      rd.addEventListener('change', function () {
        if (rd.checked) { self.cfg.qtd = n; self._salvarCfg(); self._atualizarContagem(); }
      });
      chipsQtd.appendChild(lab);
    });
    gQtd.appendChild(chipsQtd);
    panel.appendChild(gQtd);

    /* inicio */
    var row = el('div', 'quiz-start-row');
    var btn = el('button', 'btn primary', 'Iniciar simulado');
    row.appendChild(btn);
    var info = el('div', 'quiz-count-info');
    row.appendChild(info);
    this._infoEl = info;
    panel.appendChild(row);

    var melhor = null;
    try { melhor = JSON.parse(localStorage.getItem(this.chaveLS + ':melhor') || 'null'); } catch (e) { /* ignora */ }
    if (melhor) {
      var m = el('div', 'quiz-count-info');
      m.style.marginTop = '10px';
      m.innerHTML = 'Melhor resultado: <strong>' + melhor.pct + '%</strong> (' + melhor.acertos + '/' + melhor.total + ')';
      panel.appendChild(m);
    }

    root.appendChild(panel);
    this._root = root;
    this._atualizarContagem();

    btn.addEventListener('click', function () { self.iniciar(); });
  };

  Quiz.prototype._atualizarContagem = function () {
    if (!this._infoEl) return;
    var n = this.filtrar().length;
    var alvo = this.cfg.qtd === 0 ? n : Math.min(this.cfg.qtd, n);
    this._infoEl.innerHTML = n === 0
      ? '<span style="color:var(--err)">Nenhuma questao com esses filtros.</span>'
      : '<strong>' + alvo + '</strong> de ' + n + ' questoes selecionadas';
  };

  /* ---------- sessao ---------- */
  Quiz.prototype.iniciar = function () {
    var pool = this.filtrar();
    if (!pool.length) return;
    if (this.cfg.embaralhar) pool = embaralhar(pool);
    var n = this.cfg.qtd === 0 ? pool.length : Math.min(this.cfg.qtd, pool.length);
    this.sessao = {
      lista: pool.slice(0, n),
      idx: 0,
      respostas: [],
      acertos: 0,
      erros: 0
    };
    this._renderSessao();
  };

  Quiz.prototype._renderSessao = function () {
    var self = this;
    var s = this.sessao;
    this.host.innerHTML = '';
    var root = el('div', 'quiz-root');
    this.host.appendChild(root);
    this._root = root;

    var top = el('div', 'quiz-topbar');
    var pos = el('div', 'pos', 'Questao ' + (s.idx + 1) + '/' + s.lista.length);
    var track = el('div', 'progress-track');
    var fill = el('div', 'progress-fill');
    fill.style.width = (s.idx / s.lista.length * 100) + '%';
    track.appendChild(fill);
    var score = el('div', 'score', 'Acertos: <b>' + s.acertos + '</b> &middot; Erros: <i>' + s.erros + '</i>');
    var sair = el('button', 'btn sm ghost', 'Encerrar');
    top.appendChild(pos); top.appendChild(track); top.appendChild(score); top.appendChild(sair);
    root.appendChild(top);

    sair.addEventListener('click', function () { self._resultado(); });

    var stage = el('div', 'quiz-stage');
    root.appendChild(stage);
    this._renderQuestao(stage, s.lista[s.idx]);

    this._bindTeclas();
    root.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  Quiz.prototype._nomeTopico = function (id) {
    var t = (this.banco.topicos || []).filter(function (x) { return x.id === id; })[0];
    return t ? t.nome : null;
  };

  Quiz.prototype._renderQuestao = function (stage, q) {
    var self = this;
    this._respondida = false;
    this._acao = null;

    /* metadados */
    var meta = el('div', 'q-meta');
    var dif = DIFS.filter(function (d) { return d.id === q.dificuldade; })[0];
    if (dif) {
      var cls = q.dificuldade === 'facil' ? 'ok' : q.dificuldade === 'medio' ? 'warn' : 'err';
      meta.appendChild(el('span', 'tag ' + cls, dif.nome));
    }
    var tp = TIPOS.filter(function (t) { return t.id === q.tipo; })[0];
    if (tp) meta.appendChild(el('span', 'tag', tp.nome));
    var nt = this._nomeTopico(q.topico);
    if (nt) meta.appendChild(el('span', 'tag accent', nt));
    if (q.fonte) meta.appendChild(el('span', 'tag', esc(q.fonte)));
    stage.appendChild(meta);

    /* enunciado */
    var enun = el('div', 'q-enunciado', q.enunciado);
    stage.appendChild(enun);

    if (q.figura) {
      var fig = el('figure', 'q-figura', q.figura);
      stage.appendChild(fig);
    }

    var actions = el('div', 'quiz-actions');

    if (q.tipo === 'discursiva') {
      this._renderDiscursiva(stage, q, actions);
    } else {
      this._renderObjetiva(stage, q, actions);
    }

    stage.appendChild(actions);
  };

  /* ---------- objetiva (multipla / calculo) ---------- */
  Quiz.prototype._renderObjetiva = function (stage, q, actions) {
    var self = this;
    var lista = el('ul', 'alts');
    var escolhida = -1;
    var inputs = [];

    (q.alternativas || []).forEach(function (txt, i) {
      var li = el('li', 'alt');
      var inp = el('input'); inp.type = 'radio'; inp.name = 'alt_' + q.id;
      var letra = el('span', 'letra', LETRAS[i]);
      var t = el('span', 'txt', txt);
      li.appendChild(inp); li.appendChild(letra); li.appendChild(t);
      li.setAttribute('tabindex', '0');
      lista.appendChild(li);
      inputs.push(inp);
      function sel() {
        if (self._respondida) return;
        inp.checked = true; escolhida = i;
        btnVer.disabled = false;
      }
      li.addEventListener('click', sel);
      li.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); sel(); }
      });
    });
    stage.appendChild(lista);

    /* rascunho para questoes de calculo */
    if (q.tipo === 'calculo') {
      stage.appendChild(this._rascunho(q));
    }

    var btnVer = el('button', 'btn primary', 'Verificar');
    btnVer.disabled = true;
    var btnPular = el('button', 'btn ghost', 'Pular');
    var sp = el('div', 'spacer');
    var atalho = el('span', 'atalho', '<kbd>1</kbd>-<kbd>' + (q.alternativas || []).length + '</kbd> escolher &middot; <kbd>Enter</kbd> confirmar');
    actions.appendChild(btnVer); actions.appendChild(btnPular);
    actions.appendChild(sp); actions.appendChild(atalho);

    this._selecionar = function (i) {
      if (self._respondida || i >= inputs.length) return;
      inputs[i].checked = true; escolhida = i;
      btnVer.disabled = false;
    };

    btnPular.addEventListener('click', function () {
      self.sessao.respostas.push({ q: q, status: 'pulou' });
      self._avancar();
    });

    btnVer.addEventListener('click', function () {
      if (self._respondida) return;
      self._respondida = true;
      var certo = escolhida === q.correta;
      lista.classList.add('revelado');
      Array.prototype.forEach.call(lista.children, function (li, i) {
        if (i === q.correta) {
          li.classList.add('correta');
          li.appendChild(el('span', 'marca', 'correta'));
        } else if (i === escolhida) {
          li.classList.add('errada');
          li.appendChild(el('span', 'marca', 'sua resposta'));
        }
      });
      if (certo) self.sessao.acertos++; else self.sessao.erros++;
      self.sessao.respostas.push({ q: q, status: certo ? 'ok' : 'erro', escolhida: escolhida });

      if (q.explicacao) {
        var ex = el('div', 'explicacao');
        ex.appendChild(el('h4', null, certo ? 'Por que esta certo' : 'Resolucao'));
        ex.insertAdjacentHTML('beforeend', q.explicacao);
        stage.insertBefore(ex, actions);
      }

      btnVer.remove(); btnPular.remove();
      var btnProx = el('button', 'btn primary',
        self.sessao.idx + 1 < self.sessao.lista.length ? 'Proxima questao' : 'Ver resultado');
      actions.insertBefore(btnProx, actions.firstChild);
      btnProx.focus();
      self._acao = function () { self._avancar(); };
      btnProx.addEventListener('click', function () { self._avancar(); });

      var tb = self._root.querySelector('.score');
      if (tb) tb.innerHTML = 'Acertos: <b>' + self.sessao.acertos + '</b> &middot; Erros: <i>' + self.sessao.erros + '</i>';
    });

    this._acao = function () { if (!btnVer.disabled) btnVer.click(); };
  };

  /* ---------- discursiva ---------- */
  Quiz.prototype._renderDiscursiva = function (stage, q, actions) {
    var self = this;
    var ta = el('textarea', 'resposta-livre');
    ta.placeholder = 'Escreva sua resposta. Justifique com conceitos, hipoteses e, quando couber, equacoes.';
    stage.appendChild(ta);
    var cont = el('div', 'contador-chars', '0 caracteres');
    stage.appendChild(cont);
    ta.addEventListener('input', function () {
      cont.textContent = ta.value.length + ' caracteres';
    });

    if (q.apoio) {
      var ap = el('div', 'callout note', q.apoio);
      stage.appendChild(ap);
    }

    var btnVer = el('button', 'btn primary', 'Ver resposta esperada');
    var btnPular = el('button', 'btn ghost', 'Pular');
    var sp = el('div', 'spacer');
    actions.appendChild(btnVer); actions.appendChild(btnPular); actions.appendChild(sp);
    actions.appendChild(el('span', 'atalho', '<kbd>Ctrl</kbd>+<kbd>Enter</kbd> revelar'));

    btnPular.addEventListener('click', function () {
      self.sessao.respostas.push({ q: q, status: 'pulou' });
      self._avancar();
    });

    btnVer.addEventListener('click', function () {
      if (self._respondida) return;
      self._respondida = true;
      var gab = el('div', 'gabarito');
      gab.appendChild(el('h4', null, 'Resposta esperada'));
      gab.insertAdjacentHTML('beforeend', q.respostaEsperada || q.explicacao || '<p>--</p>');
      if (q.criterios && q.criterios.length) {
        var ul = el('ul', 'criterios');
        q.criterios.forEach(function (c) { ul.appendChild(el('li', null, c)); });
        gab.appendChild(el('h4', null, 'Criterios de correcao'));
        gab.appendChild(ul);
      }
      stage.insertBefore(gab, actions);

      var av = el('div', 'autoaval');
      av.appendChild(el('span', null, 'Como voce se saiu?'));
      var registrado = false;
      [['Acertei', 'ok'], ['Parcial', 'parcial'], ['Errei', 'erro']].forEach(function (p) {
        var b = el('button', 'btn sm', p[0]);
        b.addEventListener('click', function () {
          if (registrado) return;
          registrado = true;
          if (p[1] === 'ok') self.sessao.acertos++;
          else if (p[1] === 'erro') self.sessao.erros++;
          self.sessao.respostas.push({ q: q, status: p[1], texto: ta.value });
          var tb = self._root.querySelector('.score');
          if (tb) tb.innerHTML = 'Acertos: <b>' + self.sessao.acertos + '</b> &middot; Erros: <i>' + self.sessao.erros + '</i>';
          self._avancar();
        });
        av.appendChild(b);
      });
      stage.insertBefore(av, actions);

      btnVer.remove(); btnPular.remove();
      self._acao = null;
      av.querySelector('button').focus();
    });

    this._acao = function () { btnVer.click(); };
  };

  /* ---------- rascunho de calculo ---------- */
  Quiz.prototype._rascunho = function (q) {
    var det = el('details', 'rascunho');
    det.open = true;
    det.appendChild(el('summary', null, 'Espaco para contas'));
    var body = el('div', 'rascunho-body');

    var tools = el('div', 'rascunho-tools');
    var limpar = el('button', 'btn sm ghost', 'Limpar');
    tools.appendChild(limpar);
    tools.appendChild(el('span', 'hint', 'Suas contas nao sao corrigidas - servem para voce desenvolver a solucao.'));
    body.appendChild(tools);

    var ta = el('textarea', 'scratch');
    ta.placeholder = 'Dados:\n\nEquacoes:\n\nSubstituicao:\n\nResultado:';
    var chave = this.chaveLS + ':scratch:' + q.id;
    try { ta.value = sessionStorage.getItem(chave) || ''; } catch (e) { /* ignora */ }
    ta.addEventListener('input', function () {
      try { sessionStorage.setItem(chave, ta.value); } catch (e) { /* ignora */ }
    });
    body.appendChild(ta);
    limpar.addEventListener('click', function () {
      ta.value = '';
      try { sessionStorage.removeItem(chave); } catch (e) { /* ignora */ }
      ta.focus();
    });

    /* calculadora de expressao */
    var mini = el('div', 'calc-mini');
    var inp = el('input');
    inp.type = 'text';
    inp.placeholder = 'Calculadora: 4*pi*0.05^2/4 · sqrt(2*9.81*3) · (150^2-100^2)/(150^2+100^2)';
    inp.setAttribute('aria-label', 'Calculadora de expressao');
    var out = el('div', 'saida', '=');
    mini.appendChild(inp); mini.appendChild(out);
    body.appendChild(mini);
    inp.addEventListener('input', function () {
      var v = inp.value.trim();
      if (!v) { out.className = 'saida'; out.textContent = '='; return; }
      try {
        var r = calcular(v);
        out.className = 'saida';
        out.textContent = '= ' + fmtNum(r);
      } catch (err) {
        out.className = 'saida erro';
        out.textContent = err && err.message ? err.message : 'expressao invalida';
      }
    });
    inp.addEventListener('keydown', function (e) { e.stopPropagation(); });
    ta.addEventListener('keydown', function (e) { e.stopPropagation(); });

    if (q.formulas && q.formulas.length) {
      var fr = el('div', 'formulario-ref');
      fr.appendChild(el('strong', null, 'Formulario'));
      var ul = el('ul');
      q.formulas.forEach(function (f) { ul.appendChild(el('li', null, f)); });
      fr.appendChild(ul);
      body.appendChild(fr);
    }

    det.appendChild(body);
    return det;
  };

  /* ---------- navegacao ---------- */
  Quiz.prototype._avancar = function () {
    var s = this.sessao;
    s.idx++;
    if (s.idx >= s.lista.length) this._resultado();
    else this._renderSessao();
  };

  Quiz.prototype._bindTeclas = function () {
    var self = this;
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    this._keyHandler = function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'input') {
        if (!(e.key === 'Enter' && (e.ctrlKey || e.metaKey))) return;
      }
      if (e.key >= '1' && e.key <= '6' && self._selecionar) {
        self._selecionar(parseInt(e.key, 10) - 1);
        e.preventDefault();
      } else if (e.key === 'Enter' && self._acao) {
        self._acao();
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  };

  /* ---------- resultado ---------- */
  Quiz.prototype._resultado = function () {
    var self = this;
    if (this._keyHandler) { document.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; }
    this._selecionar = null; this._acao = null;

    var s = this.sessao;
    var respondidas = s.respostas.filter(function (r) { return r.status !== 'pulou'; });
    var total = respondidas.length;
    var pct = total ? Math.round(s.acertos / total * 100) : 0;

    this.host.innerHTML = '';
    var root = el('div', 'quiz-root');
    this.host.appendChild(root);

    var res = el('div', 'resultado');
    var cls = pct >= 70 ? 'bom' : pct >= 50 ? 'medio' : 'ruim';
    res.appendChild(el('div', 'nota ' + cls, pct + '%'));
    res.appendChild(el('div', 'sub',
      s.acertos + ' acertos, ' + s.erros + ' erros em ' + total + ' questoes respondidas' +
      (s.respostas.length - total ? ' (' + (s.respostas.length - total) + ' puladas)' : '')));

    /* desempenho por topico */
    var porTopico = {};
    s.respostas.forEach(function (r) {
      if (r.status === 'pulou') return;
      var k = r.q.topico || '_';
      porTopico[k] = porTopico[k] || { ok: 0, n: 0 };
      porTopico[k].n++;
      if (r.status === 'ok') porTopico[k].ok++;
      else if (r.status === 'parcial') porTopico[k].ok += 0.5;
    });
    var chaves = Object.keys(porTopico);
    if (chaves.length) {
      var d = el('div', 'desempenho');
      d.appendChild(el('h4', null, 'Desempenho por topico'));
      chaves.forEach(function (k) {
        var t = porTopico[k];
        var p = Math.round(t.ok / t.n * 100);
        var b = el('div', 'barra-topico');
        b.innerHTML =
          '<div class="lbl"><span>' + esc(self._nomeTopico(k) || 'Geral') + '</span><span>' + p + '% (' + t.n + ')</span></div>' +
          '<div class="track"><div class="fill ' + (p >= 70 ? '' : p >= 50 ? 'med' : 'bad') + '" style="width:' + p + '%"></div></div>';
        d.appendChild(b);
      });
      res.appendChild(d);
    }

    /* revisao */
    if (s.respostas.length) {
      var rev = el('div', 'revisao');
      rev.appendChild(el('h4', null, 'Revisao'));
      s.respostas.forEach(function (r, i) {
        var c = r.status === 'ok' ? 'ok' : r.status === 'pulou' ? 'skip' : 'bad';
        var item = el('div', 'revisao-item ' + c);
        var rot = r.status === 'ok' ? 'Acertou' : r.status === 'parcial' ? 'Parcial'
          : r.status === 'pulou' ? 'Pulou' : 'Errou';
        var cab = el('div', 'cab');
        cab.innerHTML = '<b>Q' + (i + 1) + '</b> <span class="tag ' +
          (c === 'ok' ? 'ok' : c === 'bad' ? 'err' : '') + '">' + rot + '</span>' +
          (self._nomeTopico(r.q.topico) ? '<span class="tag">' + esc(self._nomeTopico(r.q.topico)) + '</span>' : '');
        item.appendChild(cab);
        var txt = r.q.enunciado.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        item.appendChild(el('div', null, esc(txt.slice(0, 190)) + (txt.length > 190 ? '...' : '')));
        if (r.q.alternativas && r.q.correta !== undefined) {
          item.appendChild(el('div', null,
            '<span style="color:var(--text-faint);font-size:.85em">Gabarito: ' +
            LETRAS[r.q.correta] + ') ' + esc(r.q.alternativas[r.q.correta].replace(/<[^>]+>/g, '')) + '</span>'));
        }
        rev.appendChild(item);
      });
      res.appendChild(rev);
    }

    var row = el('div', 'btn-row');
    var b1 = el('button', 'btn primary', 'Novo simulado');
    var b2 = el('button', 'btn ghost', 'Repetir mesmos filtros');
    row.appendChild(b1); row.appendChild(b2);
    res.appendChild(row);
    root.appendChild(res);

    b1.addEventListener('click', function () { self.render(); root.scrollIntoView({ block: 'start' }); });
    b2.addEventListener('click', function () { self.iniciar(); });

    /* melhor resultado */
    if (total >= 5) {
      try {
        var prev = JSON.parse(localStorage.getItem(this.chaveLS + ':melhor') || 'null');
        if (!prev || pct > prev.pct) {
          localStorage.setItem(this.chaveLS + ':melhor',
            JSON.stringify({ pct: pct, acertos: s.acertos, total: total, data: Date.now() }));
        }
      } catch (e) { /* ignora */ }
    }

    root.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  /* ============================================================
     API publica
     ============================================================ */
  function montar(seletor, opts) {
    var host = typeof seletor === 'string' ? document.querySelector(seletor) : seletor;
    if (!host) return;
    var slug = (opts && opts.slug) || host.dataset.quiz;
    if (!slug) { console.warn('Quiz: data-quiz ausente'); return; }
    var base = (opts && opts.base) || host.dataset.base || '../data/questoes/';
    host.innerHTML = '<div class="quiz-root"><div class="quiz-vazio">Carregando banco de questoes...</div></div>';
    fetch(base + slug + '.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (banco) {
        banco.slug = banco.slug || slug;
        new Quiz(host, banco);
      })
      .catch(function (err) {
        console.error('Quiz:', err);
        host.innerHTML = '<div class="quiz-root"><div class="quiz-vazio">' +
          '<p><strong>Nao foi possivel carregar as questoes.</strong></p>' +
          '<p style="font-size:.88rem">Abra o site por um servidor local (por exemplo <code>python -m http.server</code>) ' +
          'ou pelo GitHub Pages - o navegador bloqueia <code>fetch</code> em <code>file://</code>.</p></div></div>';
      });
  }

  global.Quiz = { montar: montar, calcular: calcular, Quiz: Quiz };
})(window);

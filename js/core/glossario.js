/* ============================================================
   Glossário — balão explicativo ao passar o mouse sobre uma variável
   ------------------------------------------------------------
   Depois que o KaTeX renderiza, este módulo varre os símbolos
   matemáticos e anexa a cada um o nome da grandeza e a unidade.

   Cada página pode sobrescrever ou acrescentar termos:
     Glossario.definir({ v: ['Volume específico', 'm³/kg'] });

   O símbolo pode ser dado como:
     'v': ['Velocidade', 'm/s']
     'v': ['Velocidade', 'm/s', 'média na seção transversal']
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- base comum a toda a engenharia mecânica ---------- */
  var BASE = {
    /* gregas */
    'σ': ['Tensão normal', 'MPa', 'força por unidade de área, perpendicular ao plano de corte'],
    'τ': ['Tensão de cisalhamento', 'MPa', 'força por unidade de área, no plano de corte'],
    'ε': ['Deformação normal', '—', 'adimensional: ΔL/L₀'],
    'γ': ['Deformação angular', 'rad', 'ou peso específico γ = ρg, em N/m³'],
    'ν': ['Coeficiente de Poisson', '—', 'ou viscosidade cinemática, em m²/s'],
    'ρ': ['Massa específica', 'kg/m³'],
    'μ': ['Viscosidade dinâmica', 'Pa·s', 'ou coeficiente de atrito'],
    'η': ['Rendimento', '—', 'entre 0 e 1'],
    'ζ': ['Fator de amortecimento', '—', '< 1 subamortecido, = 1 crítico, > 1 superamortecido'],
    'ω': ['Frequência angular', 'rad/s'],
    'φ': ['Ângulo de fase / torção', 'rad ou °'],
    'θ': ['Ângulo', 'rad ou °'],
    'δ': ['Deslocamento / deflexão', 'mm', 'ou decremento logarítmico'],
    'λ': ['Comprimento de onda', 'μm', 'ou índice de esbeltez'],
    'α': ['Difusividade térmica', 'm²/s', 'ou coeficiente de dilatação, em 1/°C'],
    'β': ['Razão de diâmetros', '—', 'ou coeficiente de expansão térmica'],
    'Δ': ['Variação', '—', 'diferença entre dois estados'],
    'Σ': ['Somatório', '—'],
    'π': ['Pi', '—', '3,14159...'],
    'ε': ['Rugosidade absoluta', 'mm', 'ou deformação, ou eficácia do trocador'],

    /* latinas maiúsculas */
    'A': ['Área', 'm²'],
    'C': ['Capacidade calorífica de corrente', 'W/K', 'ou constante de rigidez da junta'],
    'D': ['Diâmetro', 'm'],
    'E': ['Módulo de elasticidade', 'GPa', 'rigidez do material — não confundir com resistência'],
    'F': ['Força', 'N'],
    'G': ['Módulo de cisalhamento', 'GPa', 'G = E/[2(1+ν)]'],
    'H': ['Altura manométrica', 'm', 'ou entalpia total, em kJ'],
    'I': ['Momento de inércia de área', 'm⁴', 'mede a distribuição de material em torno da linha neutra'],
    'J': ['Momento polar de inércia', 'm⁴', 'usado na torção'],
    'K': ['Coeficiente de perda localizada', '—', 'ou fator de concentração de tensão'],
    'L': ['Comprimento', 'm'],
    'M': ['Momento fletor', 'N·m', 'ou massa molar'],
    'N': ['Força normal', 'N', 'ou número de ciclos'],
    'P': ['Carga concentrada', 'N', 'ou potência, em W'],
    'Q': ['Vazão volumétrica', 'm³/s', 'ou calor, em kJ'],
    'R': ['Constante do gás', 'kJ/kg·K', 'ou resistência térmica, ou reação de apoio'],
    'S': ['Entropia', 'kJ/K', 'ou resistência do material (Sut, Sy, Se)'],
    'T': ['Temperatura', 'K', 'ou torque, em N·m — sempre em kelvin nas relações termodinâmicas'],
    'U': ['Energia interna', 'kJ', 'ou coeficiente global de troca, em W/m²·K'],
    'V': ['Esforço cortante', 'N', 'ou volume, em m³'],
    'W': ['Trabalho', 'kJ', 'ou módulo de resistência da seção, em m³'],
    'X': ['Amplitude', 'm', 'ou exergia, em kJ'],

    /* latinas minúsculas */
    'b': ['Largura', 'm'],
    'c': ['Distância da linha neutra à fibra extrema', 'm', 'ou amortecimento, em N·s/m'],
    'd': ['Diâmetro', 'm'],
    'e': ['Excentricidade', 'm'],
    'f': ['Fator de atrito de Darcy', '—', 'ou frequência, em Hz'],
    'g': ['Aceleração da gravidade', 'm/s²', '9,81 m/s²'],
    'h': ['Coeficiente de convecção', 'W/m²·K', 'ou entalpia específica, em kJ/kg, ou altura'],
    'k': ['Rigidez', 'N/m', 'ou condutividade térmica, em W/m·K'],
    'm': ['Massa', 'kg'],
    'n': ['Coeficiente de segurança', '—', 'ou expoente politrópico'],
    'p': ['Pressão', 'Pa'],
    'q': ['Carga distribuída', 'N/m', 'ou fluxo de calor, em W/m²'],
    'r': ['Raio', 'm', 'ou razão de frequências ω/ωn'],
    's': ['Entropia específica', 'kJ/kg·K'],
    't': ['Espessura', 'm', 'ou tempo, em s'],
    'u': ['Energia interna específica', 'kJ/kg'],
    'v': ['Velocidade', 'm/s', 'ou volume específico, em m³/kg'],
    'x': ['Posição', 'm', 'ou título (fração de vapor)'],
    'y': ['Distância à linha neutra', 'm'],
    'z': ['Cota / altura', 'm']
  };

  var atual = {};
  for (var kk in BASE) if (BASE.hasOwnProperty(kk)) atual[kk] = BASE[kk];

  /* símbolos compostos, reconhecidos pelo texto completo do elemento */
  var COMPOSTOS = {
    'Re': ['Número de Reynolds', '—', 'inércia / viscosidade; laminar até 2300 em tubo'],
    'Pr': ['Número de Prandtl', '—', 'difusividade de quantidade de movimento / térmica'],
    'Nu': ['Número de Nusselt', '—', 'convecção / condução no fluido'],
    'Bi': ['Número de Biot', '—', 'resistência interna / externa; < 0,1 permite capacitância global'],
    'Gr': ['Número de Grashof', '—', 'empuxo / viscosidade'],
    'Ra': ['Número de Rayleigh', '—', 'Ra = Gr·Pr, governa a convecção natural'],
    'Fo': ['Número de Fourier', '—', 'tempo adimensional na condução transiente'],
    'NUT': ['Número de unidades de transferência', '—', 'NUT = UA/Cmín'],
    'COP': ['Coeficiente de desempenho', '—', 'calor movido / trabalho gasto'],
    'TR': ['Transmissibilidade', '—', 'fração da excitação que passa pelo isolador'],
    'Cd': ['Coeficiente de descarga', '—', 'Venturi ≈ 0,98; placa de orifício ≈ 0,61']
  };

  /* Simbolos com indice: o indice NAO e uma variavel separada.
     A chave e "base_indice"; sem entrada aqui, vale a definicao do simbolo
     base e o indice simplesmente nao ganha balao. */
  var COM_INDICE = {
    'ω_n': ['Frequência natural', 'rad/s', 'ωₙ = √(k/m) — só do sistema, não da excitação'],
    'ω_d': ['Frequência natural amortecida', 'rad/s', 'ω_d = ωₙ√(1 − ζ²), sempre menor que ωₙ'],
    'f_n': ['Frequência natural', 'Hz', 'f_n = ωₙ/2π'],
    'T_n': ['Período natural', 's', 'T_n = 1/f_n'],
    'σ_eq': ['Tensão equivalente', 'MPa', 'de von Mises: combina σ e τ em um valor único comparável a S_y'],
    'σ_e': ['Tensão de escoamento', 'MPa', 'onde o material começa a deformar permanentemente'],
    'σ_r': ['Tensão residual', 'MPa', 'ou tensão radial, em vaso de parede espessa'],
    'σ_θ': ['Tensão circunferencial', 'MPa', 'a maior tensão em um vaso de pressão'],
    'σ_a': ['Tensão alternada', 'MPa', 'amplitude do ciclo de fadiga'],
    'σ_m': ['Tensão média', 'MPa', 'valor médio do ciclo de fadiga'],
    'S_y': ['Limite de escoamento', 'MPa', 'do inglês yield — início da deformação permanente'],
    'S_ut': ['Limite de resistência à tração', 'MPa', 'tensão máxima antes da ruptura'],
    'S_e': ['Limite de fadiga corrigido', 'MPa', 'com os fatores de Marin aplicados'],
    'L_e': ['Comprimento efetivo de flambagem', 'm', 'L_e = K·L, com K dependendo da vinculação'],
    'r_g': ['Raio de giração', 'm', 'r = √(I/A) — mede quão distribuída é a seção'],
    'δ_est': ['Deflexão estática', 'mm', 'quanto a estrutura afunda sob o próprio peso'],
    'h_f': ['Perda de carga distribuída', 'm', 'atrito ao longo do tubo'],
    'h_m': ['Perda de carga localizada', 'm', 'válvulas, curvas e acessórios'],
    'h_fg': ['Entalpia de vaporização', 'kJ/kg', 'calor latente — vale zero no ponto crítico'],
    'c_p': ['Calor específico a pressão constante', 'kJ/kg·K'],
    'c_v': ['Calor específico a volume constante', 'kJ/kg·K'],
    'T_H': ['Temperatura da fonte quente', 'K', 'sempre absoluta'],
    'T_C': ['Temperatura da fonte fria', 'K', 'sempre absoluta'],
    'Q_H': ['Calor da fonte quente', 'kJ'],
    'Q_C': ['Calor rejeitado à fonte fria', 'kJ'],
    'P_cr': ['Carga crítica de flambagem', 'N', 'acima dela a coluna perde estabilidade'],
    'σ_cr': ['Tensão crítica de flambagem', 'MPa', 'σ_cr = P_cr/A'],
    'K_t': ['Fator de concentração de tensão', '—', 'geométrico, sem efeito do material'],
    'K_f': ['Fator de concentração em fadiga', '—', 'K_t corrigido pela sensibilidade ao entalhe']
  };

  function definir(novos) {
    for (var k in novos) if (novos.hasOwnProperty(k)) {
      /* chave com "_" e simbolo indexado, e vai para a outra tabela */
      if (k.indexOf('_') > 0) COM_INDICE[k] = novos[k]; else atual[k] = novos[k];
    }
  }

  function balao(info) {
    var t = '<b>' + info[0] + '</b>';
    if (info[1]) t += '<span class="un">[' + info[1] + ']</span>';
    if (info[2]) t += '<span class="obs">' + info[2] + '</span>';
    return t;
  }

  /* Um .mord dentro de 	ext{...} e letra de PALAVRA, nao simbolo:
     o KaTeX marca esses trechos com a classe "text". Sem esta checagem,
     cada letra de "constante" ganhava um balao de glossario. */
  function dentroDeTexto(el) {
    var n = el;
    while (n && !n.classList.contains('katex-html')) {
      if (n.classList && (n.classList.contains('text') ||
                          n.classList.contains('textbf') ||
                          n.classList.contains('textit') ||
                          n.classList.contains('mathrm'))) return true;
      n = n.parentElement;
    }
    return false;
  }

  /* varre o HTML gerado pelo KaTeX e marca os símbolos conhecidos */
  function aplicar(raiz) {
    var r = raiz || document;
    /* marca antes os indices, para nenhum deles virar balao proprio:
       em σ_eq o "e" e o "q" sao parte do nome, nao variaveis */
    var indices = r.querySelectorAll('.katex-html .msupsub .mord');
    Array.prototype.forEach.call(indices, function (el) {
      el.setAttribute('data-glos-indice', '1');
    });

    var nos = r.querySelectorAll('.katex-html .mord:not([data-glos])');
    Array.prototype.forEach.call(nos, function (el) {
      /* só folhas: elementos que contêm apenas texto */
      if (el.children.length) return;
      if (el.getAttribute('data-glos-indice')) return;
      if (dentroDeTexto(el)) return;
      var txt = (el.textContent || '').trim();
      /* símbolo é uma letra só (ou dois caracteres, caso de \Delta S) */
      if (!txt || txt.length > 2) return;

      /* o proximo irmao sendo um indice, tenta primeiro a chave composta */
      var info = null, rotulo = txt;
      var vizinho = el.nextElementSibling;
      if (vizinho && vizinho.classList.contains('msupsub')) {
        var idx = (vizinho.textContent || '').trim();
        if (idx) {
          var chave = txt + '_' + idx;
          if (COM_INDICE[chave]) { info = COM_INDICE[chave]; rotulo = chave; }
        }
      }
      if (!info) info = COMPOSTOS[txt] || atual[txt];
      if (!info) return;
      el.setAttribute('data-glos', balao(info));
      el.classList.add('glos');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', rotulo + ': ' + info[0] + (info[1] ? ', em ' + info[1] : ''));
    });

    /* Símbolos compostos como Re, Pr e Nu saem em .mord vizinhos, um por
       letra. Procura-se o par de irmãos cuja junção forma a sigla — e não
       a sigla em qualquer lugar do texto, que pegaria "Re" de "Reynolds". */
    var htmls = r.querySelectorAll('.katex-html:not([data-glos-comp])');
    Array.prototype.forEach.call(htmls, function (h) {
      h.setAttribute('data-glos-comp', '1');
      var mords = h.querySelectorAll('.mord');
      Array.prototype.forEach.call(mords, function (el) {
        if (el.children.length || el.getAttribute('data-glos')) return;
        if (dentroDeTexto(el)) return;
        var a = (el.textContent || '').trim();
        var irmao = el.nextElementSibling;
        if (!irmao || !irmao.classList.contains('mord') || irmao.children.length) return;
        if (dentroDeTexto(irmao)) return;
        var sig = a + (irmao.textContent || '').trim();
        var info = COMPOSTOS[sig];
        if (!info) return;
        /* não marcar se houver mais letras coladas: seria uma palavra */
        var proximo = irmao.nextElementSibling;
        if (proximo && proximo.classList.contains('mord') &&
            /^[A-Za-z]$/.test((proximo.textContent || '').trim())) return;
        el.setAttribute('data-glos', balao(info));
        el.classList.add('glos');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', info[0] + (info[1] ? ', em ' + info[1] : ''));
      });
    });
  }

  /* reaplica sempre que o KaTeX terminar de renderizar algo novo */
  function observar() {
    if (!global.MutationObserver) return;
    var mo = new global.MutationObserver(function (muts) {
      var precisa = false;
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (n.nodeType === 1 && (n.classList.contains('katex') ||
              n.querySelector && n.querySelector('.katex'))) precisa = true;
        });
      });
      if (precisa) aplicar(document);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* um unico balao no body: nenhum overflow consegue recorta-lo */
  var caixa = null;

  function garanteCaixa() {
    if (caixa) return caixa;
    caixa = document.createElement('div');
    caixa.className = 'glos-balao';
    caixa.setAttribute('role', 'tooltip');
    document.body.appendChild(caixa);
    return caixa;
  }

  function mostrar(el) {
    var html = el.getAttribute('data-glos');
    if (!html || html === '1') return;
    var c = garanteCaixa();
    c.innerHTML = html;
    c.classList.add('visivel');
    var r = el.getBoundingClientRect();
    var lc = c.getBoundingClientRect();
    var x = r.left + r.width / 2 - lc.width / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - lc.width - 8));
    var y = r.top - lc.height - 10;
    var baixo = false;
    if (y < 6) { y = r.bottom + 10; baixo = true; }
    c.style.left = Math.round(x) + 'px';
    c.style.top = Math.round(y) + 'px';
    c.classList.toggle('abaixo', baixo);
    /* seta apontando para o simbolo */
    var seta = r.left + r.width / 2 - x;
    c.style.setProperty('--seta', Math.round(Math.max(12, Math.min(seta, lc.width - 12))) + 'px');
  }

  function esconder() {
    if (caixa) caixa.classList.remove('visivel');
  }

  function ligarEventos() {
    document.addEventListener('mouseover', function (e) {
      var el = e.target.closest && e.target.closest('.glos');
      if (el) mostrar(el);
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest('.glos')) esconder();
    });
    document.addEventListener('focusin', function (e) {
      var el = e.target.closest && e.target.closest('.glos');
      if (el) mostrar(el);
    });
    document.addEventListener('focusout', esconder);
    window.addEventListener('scroll', esconder, true);
  }

  function init() {
    ligarEventos();
    aplicar(document);
    observar();
    /* o KaTeX carrega depois; reaplica quando ele avisar */
    var tentativas = 0;
    var timer = setInterval(function () {
      aplicar(document);
      if (++tentativas > 12) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.Glossario = { definir: definir, aplicar: aplicar, base: BASE };
})(window);

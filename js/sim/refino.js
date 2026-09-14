/* ==========================================================================
   Refino de Petróleo — modelos interativos
   --------------------------------------------------------------------------
   Base física / correlações usadas (todas verificáveis):
     · °API           ASTM D287 — °API = 141,5/d(60/60) − 131,5
     · K_UOP          fator de caracterização de Watson, K = (T_b[°R])^(1/3)/d
     · Curva PEV      ASTM D2892, ancorada em avaliações publicadas de petróleos
                      leve (tipo Brent, 38 °API) e pesado (tipo Marlim, 20 °API)
     · Maxwell-Bonnell  pressão de vapor de frações de petróleo (vácuo ⇄ AET)
     · FCC            balanço térmico do conversor: C/O sai do calor disponível
     · HDS            cinética de ordem 1,5 com Arrhenius e ordem 0,7 em p(H₂)
   ========================================================================== */
(function (global) {
  'use strict';

  var PET = {};

  /* ---------------------------------------------------------------
     Densidade e classificação
     --------------------------------------------------------------- */
  PET.dRel = function (api) { return 141.5 / (api + 131.5); };
  PET.api = function (d) { return 141.5 / d - 131.5; };

  PET.classe = function (api) {
    if (api >= 40) return 'condensado / muito leve';
    if (api >= 31.1) return 'leve';
    if (api >= 22.3) return 'médio';
    if (api >= 10) return 'pesado';
    return 'extrapesado (afunda na água)';
  };

  /* fator de caracterizacao de Watson: T_b em kelvin */
  PET.kuop = function (TbK, d) {
    var TbR = TbK * 1.8;
    return Math.pow(TbR, 1 / 3) / d;
  };
  PET.baseKuop = function (k) {
    if (k >= 12.5) return 'parafínica';
    if (k >= 11.8) return 'parafínico-naftênica';
    if (k >= 11.0) return 'naftênica';
    return 'aromática';
  };

  /* ---------------------------------------------------------------
     Curva PEV (ponto de ebulição verdadeiro)
     Ancoras: %volume acumulado destilado ate a temperatura T.
     Interpola linearmente entre um petroleo leve e um pesado pelo °API.
     --------------------------------------------------------------- */
  var T_ANC = [-40, 20, 70, 100, 150, 175, 200, 235, 300, 370, 400, 450, 500, 565, 600, 700];
  /* tipo Brent, 38,3 °API */
  var X_LEVE = [0, 2.5, 8.0, 12.0, 20.0, 24.5, 29.0, 35.0, 45.0, 55.0, 59.5, 67.0, 74.0, 82.0, 85.5, 92.0];
  /* tipo Marlim, 20 °API */
  var X_PESADO = [0, 0.6, 2.0, 3.5, 7.0, 9.0, 11.5, 15.0, 23.0, 32.0, 36.0, 43.5, 50.5, 58.5, 62.5, 72.0];

  /* interpolacao monotona (Fritsch-Carlson) para nao criar ondulacoes na PEV */
  function pchip(xs, ys) {
    var n = xs.length, h = [], d = [], i;
    for (i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
    var m = [d[0]];
    for (i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) { m[i] = 0; }
      else {
        var w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    m[n - 1] = d[n - 2];
    return function (x) {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      var k = 0;
      while (k < n - 2 && x > xs[k + 1]) k++;
      var t = (x - xs[k]) / h[k], t2 = t * t, t3 = t2 * t;
      return ys[k] * (2 * t3 - 3 * t2 + 1) + h[k] * m[k] * (t3 - 2 * t2 + t) +
             ys[k + 1] * (-2 * t3 + 3 * t2) + h[k] * m[k + 1] * (t3 - t2);
    };
  }

  /* devolve a curva PEV do petroleo com o °API pedido:
       .x(T)  -> % volume acumulado ate T (°C)
       .T(x)  -> temperatura (°C) em que se acumula x % */
  PET.pev = function (api) {
    var f = (api - 20) / (38.3 - 20);
    f = Math.max(-0.45, Math.min(1.35, f));          /* extrapola pouco */
    var xs = X_LEVE.map(function (xl, i) {
      return X_PESADO[i] + f * (xl - X_PESADO[i]);
    });
    /* garante monotonia apos a interpolacao */
    for (var i = 1; i < xs.length; i++) if (xs[i] < xs[i - 1] + 0.05) xs[i] = xs[i - 1] + 0.05;
    var fx = pchip(T_ANC, xs);
    var fT = pchip(xs, T_ANC);
    return {
      x: function (T) { return Math.max(0, Math.min(100, fx(T))); },
      T: function (x) { return fT(Math.max(xs[0], Math.min(xs[xs.length - 1], x))); },
      anc: { T: T_ANC, x: xs }
    };
  };

  /* ---------------------------------------------------------------
     Propriedades de um corte, a partir da sua faixa de ebulicao
     --------------------------------------------------------------- */
  /* Densidade do corte: e a propria definicao do fator de Watson invertida,
     K = (T_b[°R])^(1/3)/d  ==>  d = (T_b[°R])^(1/3)/K.
     K cai um pouco com o ponto de ebulicao (as fracoes pesadas sao mais
     aromaticas) e sobe com o °API do cru (petroleo leve e mais parafinico). */
  PET.kCorte = function (Tmed, api) {
    return (11.95 + 0.0145 * api) - 0.00115 * Math.max(-30, Tmed);
  };
  PET.dCorte = function (Tmed, api) {
    var T = Math.max(-30, Tmed);
    var TbR = (T + 273.15) * 1.8;
    return Math.pow(TbR, 1 / 3) / PET.kCorte(T, api);
  };

  /* Enxofre do corte. O enxofre nao se distribui por igual: quase nao ha na nafta
     e ele se concentra no fundo, porque os compostos sulfurados pesados
     (dibenzotiofenos) fervem alto. O expoente 1,9 reproduz a distribuicao tipica
     e a constante mantem a media ponderada em volume proxima do teor do cru. */
  PET.fatorS = function (Tmed) {
    return Math.pow(Math.max(25, Tmed) / 380, 1.9);
  };

  /* ---------------------------------------------------------------
     Maxwell-Bonnell: pressao de vapor de fracoes de petroleo.
     T e Tb em °R, P em mmHg. Reproduz P = 760 mmHg em T = Tb.
     --------------------------------------------------------------- */
  function mbX(T, TbR) {
    return (TbR / T - 0.0002867 * TbR) / (748.1 - 0.2145 * TbR);
  }
  function mbP(T_C, Tb_C) {
    var T = (T_C + 273.15) * 1.8, TbR = (Tb_C + 273.15) * 1.8;
    var X = mbX(T, TbR), log10P;
    if (X > 0.0022) log10P = (3000.538 * X - 6.76156) / (43 * X - 0.987672);
    else log10P = (2663.129 * X - 5.994296) / (95.76 * X - 0.972546);
    return Math.pow(10, log10P);
  }
  /* a correlacao publicada devolve ~763 mmHg no proprio ponto de ebulicao;
     ancorar em P(T_b) = 760 tira esse desvio de 0,4 % sem mudar a forma da curva */
  PET.pressaoVapor = function (T_C, Tb_C) {
    return mbP(T_C, Tb_C) * 760 / mbP(Tb_C, Tb_C);
  };
  /* temperatura em que o corte de PEV Tb ferve sob a pressao P (mmHg) */
  PET.tEbulicao = function (Tb_C, P_mmHg) {
    var TbR = (Tb_C + 273.15) * 1.8;
    var anc = mbP(Tb_C, Tb_C) / 760;                  /* mesma ancoragem de cima */
    var L = Math.log10(Math.max(0.05, P_mmHg) * anc);
    var den = 748.1 - 0.2145 * TbR;
    /* resolve analiticamente cada ramo e escolhe o consistente */
    function ramo(a, b, c, d) {                       /* (aX+b)/(cX+d) = L */
      var X = (L * d - b) / (a - L * c);
      var T = TbR / (X * den + 0.0002867 * TbR);
      return { X: X, T: T };
    }
    var r = ramo(2663.129, -5.994296, 95.76, -0.972546);
    if (r.X > 0.0022) r = ramo(3000.538, -6.76156, 43, -0.987672);
    return r.T / 1.8 - 273.15;
  };
  /* temperatura atmosferica equivalente (AET) de algo observado a T sob vacuo */
  PET.aet = function (T_C, P_mmHg) {
    /* inverte tEbulicao por bisseccao: acha o Tb cuja curva passa por (T, P) */
    /* acima de 1 atm a AET fica ABAIXO da temperatura observada; abaixo, acima */
    var lo = T_C - 250, hi = T_C + 400, i, mid;
    for (i = 0; i < 60; i++) {
      mid = (lo + hi) / 2;
      if (PET.tEbulicao(mid, P_mmHg) > T_C) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  };

  /* ---------------------------------------------------------------
     Cortes padrao de uma refinaria de combustiveis
     --------------------------------------------------------------- */
  PET.CORTES = [
    { id: 'gas', nome: 'Gás combustível + GLP', curto: 'GLP', cor: 6 },
    { id: 'nl', nome: 'Nafta leve', curto: 'Nafta L', cor: 4 },
    { id: 'np', nome: 'Nafta pesada', curto: 'Nafta P', cor: 5 },
    { id: 'qav', nome: 'Querosene (QAV)', curto: 'Querosene', cor: 0 },
    { id: 'dl', nome: 'Diesel leve', curto: 'Diesel L', cor: 2 },
    { id: 'dp', nome: 'Diesel pesado', curto: 'Diesel P', cor: 3 },
    { id: 'gov', nome: 'Gasóleo de vácuo', curto: 'GOV', cor: 1 },
    { id: 'rv', nome: 'Resíduo de vácuo', curto: 'Resíduo V', cor: 7 }
  ];

  /* rendimento volumetrico de cada corte, dadas as temperaturas de corte */
  PET.rendimentos = function (api, cortes) {
    var c = PET.pev(api);
    var lim = [-100].concat(cortes).concat([9999]);
    var out = [], i, n = PET.CORTES.length;
    for (i = 0; i < n; i++) {
      var a = c.x(lim[i]);
      /* o ultimo corte e o RESIDUO: por definicao e tudo o que sobrou, porque a
         curva PEV de um residuo de vacuo nunca chega a 100 % (ele nao ferve, craqueia) */
      var b = (i === n - 1) ? 100 : c.x(lim[i + 1]);
      var Tmed = (i === n - 1)
        ? lim[i] + 65
        : (Math.max(-40, lim[i]) + Math.min(700, lim[i + 1])) / 2;
      out.push({
        corte: PET.CORTES[i],
        Ti: lim[i], Tf: lim[i + 1], Tmed: Tmed,
        vol: Math.max(0, b - a)
      });
    }
    return out;
  };

  /* Rendimentos ja com densidade e enxofre de cada corte.
     O enxofre e normalizado para que a media ponderada EM MASSA reproduza
     exatamente o teor do cru — o balanco de enxofre tem de fechar. */
  PET.balanco = function (api, cortes, sCru) {
    var r = PET.rendimentos(api, cortes);
    var mtot = 0, stot = 0;
    r.forEach(function (x) {
      x.d = PET.dCorte(x.Tmed, api);
      x.api = PET.api(x.d);
      x.k = PET.kCorte(x.Tmed, api);
      x.massa = x.vol * x.d;
      x.gS = PET.fatorS(x.Tmed);
      mtot += x.massa;
      stot += x.massa * x.gS;
    });
    var esc = stot > 0 ? (sCru * mtot / stot) : 0;
    r.forEach(function (x) {
      x.s = x.gS * esc;
      x.pMassa = mtot > 0 ? 100 * x.massa / mtot : 0;
    });
    r.mtot = mtot;
    return r;
  };

  global.PET = PET;
})(window);

/* ==========================================================================
   Modelos de processo (sem DOM — validados em node)
   ========================================================================== */
(function (global) {
  'use strict';
  var PET = global.PET;
  var BAR_MMHG = 750.062;

  /* peso molecular médio de uma fração: Riazi-Daubert (1980), T_b em K */
  PET.pesoMolecular = function (TbK, d) {
    return 42.965 * Math.exp(2.097e-4 * TbK - 7.78712 * d + 2.08476e-3 * TbK * d) *
           Math.pow(TbK, 1.26007) * Math.pow(d, 4.98308);
  };

  /* ---------------------------------------------------------------
     Torre de destilação atmosférica
     p: api, vazao (m³/d), tForno (°C), pTopo (bar abs), vapor (kg/m³ de RAT),
        tPre (°C, saída da bateria de preaquecimento), tNafta, tQav, tDiesel (°C PEV)
     --------------------------------------------------------------- */
  PET.DEFV = 30;          /* °C: curva de vaporização de equilíbrio x PEV na zona de flash */
  PET.OVERFLASH = 3;      /* % vol vaporizado a mais, que volta como óleo de lavagem */

  PET.torre = function (p) {
    var pev = PET.pev(p.api);
    var dCru = PET.dRel(p.api);
    var Qh = p.vazao / 24;                       /* m³/h */
    var mCru = Qh * dCru * 1000;                 /* kg/h */
    var dPtorre = 0.35;                          /* bar, perda de carga nos pratos */
    var pFz = p.pTopo + dPtorre;
    var tFz = p.tForno - 8;                      /* resfria ao vaporizar na linha de transferência */

    var V = 50, tCorte = 350, yHC = 1, pHC = pFz * BAR_MMHG, nHC = 0, nV = 0, MWv = 200, dV = 0.8, i;
    for (i = 0; i < 60; i++) {
      var rat = Math.max(1, 100 - V);
      var vaporKg = p.vapor * Qh * rat / 100;
      nV = vaporKg / 18.015;
      var Tm = pev.T(Math.max(1, V / 2));
      dV = PET.dCorte(Tm, p.api);
      MWv = PET.pesoMolecular(Tm + 273.15, dV);
      nHC = (V / 100) * Qh * dV * 1000 / MWv;
      yHC = nHC / (nHC + nV);
      pHC = pFz * BAR_MMHG * yHC;
      var aet = PET.aet(tFz, pHC);
      tCorte = aet + PET.DEFV;
      var Vn = Math.min(98, pev.x(tCorte) + PET.OVERFLASH);
      V = 0.5 * V + 0.5 * Vn;
    }
    var xCorte = pev.x(tCorte);
    var aetFz = tCorte - PET.DEFV;

    /* produtos, % vol sobre o cru */
    var xN = pev.x(p.tNafta), xQ = pev.x(p.tQav), xD = pev.x(p.tDiesel);
    var fimDiesel = Math.min(xD, xCorte);
    var prod = {
      nafta: xN,
      qav: Math.max(0, Math.min(xQ, xCorte) - xN),
      diesel: Math.max(0, fimDiesel - Math.max(xQ, xN)),
      goa: Math.max(0, xCorte - Math.max(xD, xQ)),
      rat: 100 - xCorte
    };
    var dieselPerdido = Math.max(0, xD - xCorte);

    /* forno */
    var cp = 2.5;                                /* kJ/(kg·K), óleo a ~300 °C */
    var lambda = 270;                            /* kJ/kg, calor latente médio */
    var mVap = (V / 100) * Qh * dV * 1000;       /* kg/h vaporizados */
    var qSens = mCru * cp * (p.tForno - p.tPre); /* kJ/h */
    var qLat = mVap * lambda;
    var Q_MW = (qSens + qLat) / 3.6e6;
    var eta = 0.88, pci = 40000;                 /* kJ/kg de óleo combustível */
    var comb = (qSens + qLat) / eta / pci / 1000; /* t/h */

    /* temperaturas na torre (ponto de bolha aproximado de cada retirada) */
    function tRetirada(xIni, xFim, pBar) {
      var Tb = pev.T(xIni + 0.25 * (xFim - xIni));
      return PET.tEbulicao(Tb, pBar * BAR_MMHG * yHC);
    }
    var nNaftaTop = (xN / 100) * Qh * 720 * 3.0 / 100;   /* refluxo leva ~3× a nafta em mols */
    var yTopo = nNaftaTop / (nNaftaTop + nV);
    var tTopo = PET.tEbulicao(pev.T(0.7 * xN), p.pTopo * BAR_MMHG * yTopo);
    var temps = {
      topo: tTopo,
      qav: tRetirada(xN, Math.min(xQ, xCorte), p.pTopo + 0.10),
      diesel: tRetirada(xQ, fimDiesel, p.pTopo + 0.20),
      flash: tFz,
      fundo: tFz - 12 * Math.min(1, p.vapor / 20)
    };

    var avisos = [];
    var limCraq = 385 - 0.6 * Math.max(0, 30 - p.api);  /* cru pesado craqueia antes */
    if (p.tForno > limCraq) avisos.push('craqueamento');
    if (dieselPerdido > 0.5) avisos.push('dieselPerdido');
    if (yHC < 0.6) avisos.push('vaporDemais');

    return {
      pev: pev, V: V, pFz: pFz, tFz: tFz, yHC: yHC, pHC: pHC, nHC: nHC, nV: nV,
      MWv: MWv, dV: dV, aetFz: aetFz, tCorte: tCorte, xCorte: xCorte,
      prod: prod, dieselPerdido: dieselPerdido,
      mCru: mCru, Qh: Qh, mVap: mVap, qSens: qSens, qLat: qLat, Q_MW: Q_MW, comb: comb,
      temps: temps, avisos: avisos, limCraq: limCraq
    };
  };

  /* ---------------------------------------------------------------
     Torre de vácuo
     p: api, pFz (mmHg abs na zona de flash), tForno (°C), vapor (0..1: fração
        de redução da pressão parcial por vapor de "lift"/retificação)
     --------------------------------------------------------------- */
  PET.vacuo = function (p) {
    var pev = PET.pev(p.api);
    var tFz = p.tForno - 10;
    var pHC = p.pFz * (1 - 0.5 * p.vapor);
    var aet = PET.aet(tFz, pHC);
    var tCorte = aet + 15;                       /* vaporização de equilíbrio no fundo do vácuo */
    var xRat = pev.x(p.tRat || 370);
    var xCorte = Math.max(xRat, pev.x(tCorte));
    return {
      pev: pev, tFz: tFz, pHC: pHC, aet: aet, tCorte: tCorte,
      gov: xCorte - xRat, rv: 100 - xCorte, rat: 100 - xRat,
      recuperado: (xCorte - xRat) / Math.max(1e-6, 100 - xRat) * 100,
      tSemVacuo: tCorte                          /* a 1 atm seria preciso chegar a esta T */
    };
  };

  /* ---------------------------------------------------------------
     FCC — conversor em balanço térmico
     p: tRx (°C saída do riser), tCarga (°C), tempo (s), mat (atividade MAT %),
        ccr (% resíduo de carbono Conradson da carga)
     A temperatura do regenerador NÃO é escolhida: sai do balanço, porque o
     coque queimado tem de pagar exatamente o calor que o riser consome.
     --------------------------------------------------------------- */
  PET.FCC = {
    cpCat: 1.10,        /* kJ/(kg·K) */
    cpLiq: 2.5, cpVap: 2.6, lambda: 260, tVap: 350,
    dHrx: 550,          /* kJ/kg de carga por unidade de conversão (endotérmica) */
    dHcoque: 34000,     /* kJ/kg de coque (combustão parcial CO/CO₂) */
    arCoque: 14,        /* kg de ar por kg de coque */
    tAr: 200,
    perdas: 80          /* kJ/kg de carga, perdas térmicas */
  };

  PET.fcc = function (p) {
    var F = PET.FCC;
    var TK = p.tRx + 273.15;
    var fT = Math.exp(60000 / 8.314 * (1 / 798.15 - 1 / TK));
    var fA = (p.mat / (100 - p.mat)) / (68 / 32);
    function conversao(co) {
      var K = 0.2309 * co * Math.sqrt(p.tempo / 3) * Math.sqrt(3) * fT * fA;
      return K / (1 + K);
    }
    function calorRiser(X) {
      var tv = Math.max(p.tCarga, F.tVap);
      return F.cpLiq * (tv - p.tCarga) + F.lambda + F.cpVap * (p.tRx - tv) + F.dHrx * X;
    }
    function cokeKin(co) {
      /* coque cinético = C/O × Δcoque; cresce com o resíduo de carbono da carga */
      return 0.0155 * Math.pow(co, 0.65) * Math.pow(p.tempo / 3, 0.2) * (1 + 0.12 * p.ccr) / 1.06;
    }
    function estado(tReg) {
      var X = 0.75, co = 7, i;
      for (i = 0; i < 40; i++) {
        co = calorRiser(X) / (F.cpCat * Math.max(5, tReg - p.tRx));
        X = conversao(co);
      }
      var cokeDem = (calorRiser(X) + F.perdas) /
                    (F.dHcoque - F.arCoque * 1.05 * (tReg - F.tAr));
      return { X: X, co: co, cokeDem: cokeDem, cokeKin: cokeKin(co) };
    }
    /* bissecção: coque produzido pela cinética = coque exigido pelo balanço */
    var lo = p.tRx + 40, hi = 900, mid, e, k;
    for (k = 0; k < 70; k++) {
      mid = (lo + hi) / 2;
      e = estado(mid);
      if (e.cokeKin > e.cokeDem) lo = mid; else hi = mid;
    }
    var tReg = (lo + hi) / 2;
    e = estado(tReg);
    var X = e.X, coque = e.cokeDem;
    var gasol = Math.max(0, 1.30 * X - 0.86 * X * X);
    var gasSeco = 0.02 + 0.012 * Math.exp((p.tRx - 520) / 25) * (X / 0.75);
    var glp = X - gasol - coque - gasSeco;
    if (glp < 0) { gasol = Math.max(0, gasol + glp); glp = 0; }
    var lco = (1 - X) * 0.6, oc = (1 - X) * 0.4;
    var avisos = [];
    if (tReg > 760) avisos.push('regQuente');
    if (tReg < 650) avisos.push('regFrio');
    if (X > 0.80) avisos.push('sobrecraqueamento');
    return {
      tReg: tReg, co: e.co, X: X, coque: coque, gasol: gasol, glp: glp,
      gasSeco: gasSeco, lco: lco, oc: oc, calor: calorRiser(X), avisos: avisos,
      qCatalisador: F.cpCat * (tReg - p.tRx)
    };
  };

  /* ---------------------------------------------------------------
     Hidrodessulfurização — ordem 1,5
     p: sIn (ppm), T (°C), P (bar H₂), lhsv (h⁻¹), cat (1 CoMo · 1,6 NiMo · 2,4 NiMo alta),
        carga (1 destilação direta · 0,55 LCO — mais refratária)
     --------------------------------------------------------------- */
  PET.HDS = { kRef: 0.14584, Tref: 340, Pref: 60, Ea: 110000, n: 1.5, mP: 0.7 };

  PET.hds = function (p) {
    var H = PET.HDS;
    var k = H.kRef * p.cat * p.carga *
            Math.exp(H.Ea / 8.314 * (1 / (H.Tref + 273.15) - 1 / (p.T + 273.15))) *
            Math.pow(p.P / H.Pref, H.mP);
    function sAt(tau) {       /* tau = fração do leito × 1/LHSV (h) */
      var inv = Math.pow(p.sIn, 1 - H.n) + (H.n - 1) * k * tau;
      return Math.pow(inv, 1 / (1 - H.n));
    }
    var sOut = sAt(1 / p.lhsv);
    var dSpct = (p.sIn - sOut) / 1e4;           /* % massa removido */
    var h2 = 15 * dSpct + 0.9 * p.P * (p.carga < 1 ? 1.6 : 1);  /* Nm³/m³ */
    var dT = 0.28 * h2;
    return {
      k: k, sOut: sOut, sAt: sAt, remocao: 100 * (1 - sOut / p.sIn),
      h2: h2, dT: dT, s10: sOut <= 10, s500: sOut <= 500
    };
  };
})(window);

/* ==========================================================================
   Simuladores
     1. sim-petroleo : caracterização do cru, curva PEV animada (destilação de
                       laboratório) e rendimento/enxofre de cada corte
     2. sim-torre    : torre de destilação atmosférica animada — forno, zona de
                       flash, vapor de retificação, retiradas laterais
     3. sim-vacuo    : por que destilar sob vácuo — Maxwell-Bonnell e ejetores
     4. sim-fcc      : craqueamento catalítico fluido, conversor em balanço térmico
     5. sim-hds      : hidrodessulfurização e a especificação S-10
   ========================================================================== */
(function () {
  'use strict';

  var PET = window.PET;
  var TAU = Math.PI * 2;

  /* ---------- laço de animação único ---------- */
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
  function corCorte(i) { return Plot.serie(PET.CORTES[i].cor); }

  function seta(c, x1, y1, x2, y2, cor, larg, cabeca) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 1e-6) return;
    var ux = dx / L, uy = dy / L, h = cabeca || Math.min(10, L * 0.4);
    c.strokeStyle = cor; c.fillStyle = cor; c.lineWidth = larg || 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - ux * h * 0.7, y2 - uy * h * 0.7); c.stroke();
    c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
    c.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
    c.closePath(); c.fill();
  }

  /* ponto a uma fração s ∈ [0,1) do comprimento de uma polilinha */
  function naPolilinha(pts, s) {
    var tot = 0, seg = [], i;
    for (i = 0; i < pts.length - 1; i++) {
      var L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push(L); tot += L;
    }
    var alvo = ((s % 1) + 1) % 1 * tot;
    for (i = 0; i < seg.length; i++) {
      if (alvo <= seg[i] || i === seg.length - 1) {
        var f = seg[i] > 0 ? alvo / seg[i] : 0;
        return [pts[i][0] + f * (pts[i + 1][0] - pts[i][0]),
                pts[i][1] + f * (pts[i + 1][1] - pts[i][1])];
      }
      alvo -= seg[i];
    }
    return pts[pts.length - 1];
  }

  /* tubo com partículas correndo por dentro */
  function tubo(c, pts, cor, larg, fase, n, rPart, corPart) {
    var i;
    c.setLineDash([]);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = Plot.cssVar('--border-strong', '#999');
    c.lineWidth = larg + 3;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.stroke();
    c.strokeStyle = cor; c.globalAlpha = 0.30; c.lineWidth = larg;
    c.stroke();
    c.globalAlpha = 1;
    if (n > 0) {
      c.fillStyle = corPart || cor;
      for (i = 0; i < n; i++) {
        var p = naPolilinha(pts, fase + i / n);
        c.beginPath(); c.arc(p[0], p[1], rPart || 2.2, 0, TAU); c.fill();
      }
    }
    c.lineCap = 'butt';
  }

  /* cor por temperatura: azul frio → laranja quente */
  function corTemp(T, Tmin, Tmax) {
    var f = Math.max(0, Math.min(1, (T - Tmin) / (Tmax - Tmin)));
    var r = Math.round(60 + 195 * f), g = Math.round(130 + 30 * Math.sin(f * Math.PI) - 60 * f),
        b = Math.round(220 - 190 * f);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }


  var nt = function (v, n) { return Plot.numTex(v, n); };
  var sg = function (v, n) { return Plot.sig(v, n); };

  /* petróleos de referência (°API e enxofre de avaliações publicadas) */
  var CRUS = [
    { nome: 'Brent (Mar do Norte)', api: 38.3, s: 0.40 },
    { nome: 'WTI (EUA)', api: 39.6, s: 0.24 },
    { nome: 'Árabe Leve', api: 33.4, s: 1.80 },
    { nome: 'Búzios (pré-sal)', api: 28.5, s: 0.30 },
    { nome: 'Maya (México)', api: 21.8, s: 3.40 },
    { nome: 'Marlim (Bacia de Campos)', api: 19.6, s: 0.78 }
  ];

  /* ==========================================================================
     1. Caracterização do petróleo e curva PEV
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-petroleo')) return;

    var A = { ctx: null, p: null, b: null, fase: 0, rel: relogio(), on: true };

    function cortesDe(p) {
      var arr = [20, 100, p.tNafta, p.tQav, 300, p.tDiesel, p.tGov];
      /* mantém a ordem mesmo se o usuário cruzar os limites */
      for (var i = 1; i < arr.length; i++) if (arr[i] <= arr[i - 1]) arr[i] = arr[i - 1] + 5;
      return arr;
    }

    function calcula(p) {
      var cortes = cortesDe(p);
      var bal = PET.balanco(p.api, cortes, p.s);
      var pev = PET.pev(p.api);
      var d = PET.dRel(p.api);
      /* VABP: média das temperaturas a 10, 30, 50, 70 e 90 % destilados */
      var pts = [10, 30, 50, 70, 90].map(function (x) { return pev.T(x); });
      var vabp = pts.reduce(function (s, v) { return s + v; }, 0) / 5;
      var K = PET.kuop(vabp + 273.15, d);
      var soma = function (ids) {
        return bal.filter(function (x) { return ids.indexOf(x.corte.id) >= 0; })
                  .reduce(function (s, x) { return s + x.vol; }, 0);
      };
      return {
        cortes: cortes, bal: bal, pev: pev, d: d, vabp: vabp, pts: pts, K: K,
        leves: soma(['gas', 'nl', 'np']),
        medios: soma(['qav', 'dl', 'dp']),
        rat: 100 - pev.x(p.tDiesel),
        rv: bal[bal.length - 1],
        xFim: pev.x(p.tGov)
      };
    }

    /* ---------- desenho: destilação PEV de bancada ---------- */
    function desenhar(c, pl) {
      var a = pl._area, p = A.p, b = A.b;
      if (!p || !b) return;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#888');
      var borda = Plot.cssVar('--border-strong', '#999');
      var sunk = Plot.cssVar('--bg-sunk', '#eee');

      /* linha do tempo: destila até o fim do GOV, segura 2 s e recomeça */
      var ciclo = 16, t = A.fase * ciclo;
      var frac = Math.min(1, t / (ciclo - 2.5));
      var xDest = frac * b.xFim;                        /* % destilado agora */
      var Tagora = b.pev.T(Math.max(0.3, xDest));
      var ic = 0;
      while (ic < b.cortes.length && Tagora > b.cortes[ic]) ic++;
      var corAgora = corCorte(Math.min(ic, PET.CORTES.length - 1));

      /* geometria */
      var H = a.h, W = a.w;
      var bx = a.x + W * 0.25, by = a.y + H * 0.66, br = Math.min(W * 0.10, H * 0.20);

      /* manta de aquecimento */
      var calor = 0.35 + 0.65 * frac;
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.strokeStyle = borda; c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(bx - br * 1.35, by);
      c.quadraticCurveTo(bx - br * 1.35, by + br * 1.45, bx, by + br * 1.45);
      c.quadraticCurveTo(bx + br * 1.35, by + br * 1.45, bx + br * 1.35, by);
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(230,90,40,' + (0.35 + 0.5 * calor) + ')';
      c.lineWidth = 2;
      for (var k = 0; k < 4; k++) {
        c.beginPath();
        c.arc(bx, by + br * 0.1, br * (1.08 + k * 0.08), Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
      }

      /* balão com o que ainda não destilou */
      var nivel = 1 - 0.85 * (xDest / 100);
      c.save();
      c.beginPath(); c.arc(bx, by, br, 0, TAU); c.clip();
      var escuro = Math.round(95 - 70 * (xDest / 100));
      c.fillStyle = 'rgb(' + (escuro + 40) + ',' + (escuro + 10) + ',' + Math.round(escuro * 0.4) + ')';
      c.fillRect(bx - br, by + br - 2 * br * nivel * 0.9, 2 * br, 2 * br);
      /* bolhas */
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (k = 0; k < 14; k++) {
        var fb = ((A.fase * 6 + k * 0.137) % 1);
        var xb = bx + Math.sin(k * 7.3) * br * 0.6;
        var yb = by + br * 0.9 - fb * br * 1.5 * nivel;
        c.beginPath(); c.arc(xb, yb, 1.5 + (k % 3), 0, TAU); c.fill();
      }
      c.restore();
      c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.arc(bx, by, br, 0, TAU); c.stroke();

      /* coluna de fracionamento de bancada e cabeça */
      var topoY = a.y + H * 0.14;
      var colW = br * 0.28;
      c.fillStyle = sunk;
      c.fillRect(bx - colW / 2, topoY, colW, by - br - topoY + 2);
      c.strokeStyle = cor; c.lineWidth = 1.8;
      c.strokeRect(bx - colW / 2, topoY, colW, by - br - topoY + 2);
      /* recheio */
      c.strokeStyle = faint; c.lineWidth = 1;
      for (k = 0; k < 9; k++) {
        var yk = topoY + 12 + k * (by - br - topoY - 16) / 9;
        c.beginPath(); c.moveTo(bx - colW / 2, yk); c.lineTo(bx + colW / 2, yk + 5); c.stroke();
      }
      /* vapor subindo */
      c.fillStyle = corAgora;
      for (k = 0; k < 8; k++) {
        var fv = (A.fase * 9 + k / 8) % 1;
        c.globalAlpha = 0.25 + 0.5 * (1 - fv);
        c.beginPath();
        c.arc(bx + Math.sin(k * 3 + A.fase * 30) * colW * 0.22,
              by - br - fv * (by - br - topoY), 2.2, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;

      /* termômetro no topo */
      var tx = bx, ty = topoY - 6;
      c.strokeStyle = cor; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, a.y + H * 0.02); c.stroke();
      c.fillStyle = Plot.serie(5);
      c.beginPath(); c.arc(tx, topoY + 6, 3.5, 0, TAU); c.fill();
      c.fillStyle = cor; c.font = fonte(12, '700');
      c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(sg(Tagora, 3) + ' °C', tx - 10, a.y + H * 0.06);
      c.font = fonte(9.5); c.fillStyle = faint;
      c.fillText(Tagora > 350 ? 'equivalente a 1 atm' : 'no topo', tx - 10, a.y + H * 0.06 + 14);

      /* condensador inclinado */
      var cx1 = bx + colW / 2, cy1 = topoY + 10;
      var cx2 = a.x + W * 0.52, cy2 = a.y + H * 0.40;
      c.strokeStyle = borda; c.lineWidth = 11; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx1 + 18, cy1 + 6); c.lineTo(cx2 - 8, cy2 - 6); c.stroke();
      c.strokeStyle = 'rgba(80,160,230,0.35)'; c.lineWidth = 8; c.stroke();
      c.strokeStyle = cor; c.lineWidth = 2; c.lineCap = 'butt';
      c.beginPath(); c.moveTo(cx1, cy1); c.lineTo(cx2, cy2); c.lineTo(cx2, cy2 + 16); c.stroke();
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('condensador (água fria)', (cx1 + cx2) / 2 + 16, (cy1 + cy2) / 2 - 10);
      /* gota */
      if (frac < 1) {
        var fg = (A.fase * 14) % 1;
        c.fillStyle = corAgora;
        c.beginPath(); c.arc(cx2, cy2 + 18 + fg * 22, 2.8, 0, TAU); c.fill();
      }

      /* proveta graduada com os cortes empilhados */
      var px0 = cx2 - W * 0.04, pw = W * 0.08;
      var py1 = a.y + H * 0.50, py2 = a.y + H * 0.95;
      var hP = py2 - py1;
      c.fillStyle = Plot.cssVar('--bg-elev', '#fff');
      c.fillRect(px0, py1, pw, hP);
      var acum = 0;
      for (var i = 0; i < b.bal.length - 1; i++) {
        var x0 = b.pev.x(b.cortes[i - 1] === undefined ? -100 : b.cortes[i - 1]);
        var x1 = b.pev.x(b.cortes[i]);
        var cheio = Math.max(0, Math.min(x1, xDest) - x0);
        if (cheio <= 0) continue;
        var hh = cheio / 100 * hP;
        c.fillStyle = corCorte(i); c.globalAlpha = 0.85;
        c.fillRect(px0 + 1, py2 - (acum + hh), pw - 2, hh);
        c.globalAlpha = 1;
        acum += hh;
      }
      c.strokeStyle = cor; c.lineWidth = 1.8;
      c.strokeRect(px0, py1, pw, hP);
      c.fillStyle = faint; c.font = fonte(8.5); c.textAlign = 'left'; c.textBaseline = 'middle';
      for (k = 0; k <= 10; k++) {
        var yg = py2 - k / 10 * hP;
        c.strokeStyle = faint; c.lineWidth = 1;
        c.beginPath(); c.moveTo(px0, yg); c.lineTo(px0 + (k % 5 === 0 ? 9 : 5), yg); c.stroke();
        if (k % 5 === 0) c.fillText(k * 10 + '%', px0 + pw + 4, yg);
      }

      /* painel */
      var lx = a.x + W * 0.66, ly = a.y + 4;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12.5, '700');
      c.fillText('Destilação PEV de bancada', lx, ly);
      c.font = fonte(10); c.fillStyle = faint;
      c.fillText('D2892; acima de 350 °C, sob vácuo', lx, ly + 17);
      c.font = fonte(11.5, '700'); c.fillStyle = corAgora;
      var nomeAgora = PET.CORTES[Math.min(ic, PET.CORTES.length - 1)].nome;
      c.fillText(nomeAgora, lx, ly + 40);
      c.font = fonte(11); c.fillStyle = cor;
      c.fillText('Destilado: ' + sg(xDest, 3) + ' % vol', lx, ly + 58);
      c.fillText('Temperatura: ' + sg(Tagora, 3) + ' °C', lx, ly + 74);

      var yy = ly + 100;
      c.font = fonte(10.5, '700'); c.fillStyle = cor;
      c.fillText('Corte', lx, yy); c.fillText('°C', lx + W * 0.14, yy);
      c.fillText('% vol', lx + W * 0.25, yy);
      yy += 16;
      b.bal.forEach(function (x, j) {
        var pronto = xDest >= b.pev.x(Math.min(x.Tf, 700)) - 0.05 && j < b.bal.length - 1;
        c.fillStyle = corCorte(j);
        c.fillRect(lx, yy + 2, 9, 9);
        c.fillStyle = pronto || (j === b.bal.length - 1 && frac >= 1) ? cor : faint;
        c.font = fonte(10.5, j === ic ? '700' : '');
        c.fillText(x.corte.curto, lx + 14, yy);
        var faixa = j === 0 ? '< ' + x.Tf
          : (j === b.bal.length - 1 ? '> ' + x.Ti : x.Ti + '–' + x.Tf);
        c.fillText(faixa, lx + W * 0.14, yy);
        c.fillText(sg(x.vol, 3), lx + W * 0.25, yy);
        yy += 15;
      });
      c.fillStyle = faint; c.font = fonte(9.5);
      c.fillText('o resíduo fica no balão:', lx, yy + 4);
      c.fillText('não ferve, craqueia', lx, yy + 16);
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('bancada');
      pl.clear(); pl.setLimits([0, 1], [0, 1]);
      pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.fase = (A.fase + dt / 16) % 1;
      desenha();
    });

    Sim.build('#sim-petroleo', {
      titulo: 'Caracterização do petróleo — °API, curva PEV e rendimento dos cortes',
      descricao: 'Não existem dois petróleos iguais. A densidade diz se ele é leve ou pesado; a curva de ponto de ebulição verdadeiro (PEV) diz quanto de cada derivado ele pode dar. Mova as temperaturas de corte e veja o rendimento e o enxofre de cada fração mudarem.',
      controlesLargos: true,
      exemplos: CRUS.map(function (cr, i) {
        return { nome: (i + 1) + ' · ' + cr.nome, desc: cr.api + ' °API · ' + cr.s + ' % S',
                 valores: { api: cr.api, s: cr.s, tNafta: 175, tQav: 235, tDiesel: 370, tGov: 565, animar: true } };
      }).concat([
        { nome: '7 · Maximizar querosene de aviação', desc: 'Alarga a faixa do QAV para os dois lados',
          valores: { api: 33.4, s: 1.8, tNafta: 150, tQav: 260, tDiesel: 370, tGov: 565, animar: true } },
        { nome: '8 · Maximizar diesel', desc: 'Nafta pesada e gasóleo leve vão para o diesel',
          valores: { api: 33.4, s: 1.8, tNafta: 160, tQav: 220, tDiesel: 390, tGov: 565, animar: true } }
      ]),
      controles: [
        { tipo: 'titulo', label: 'O petróleo' },
        { id: 'api', label: 'Grau API', min: 10, max: 45, step: 0.1, valor: 38.3, unidade: '°API',
          desc: 'Maior °API = mais leve. Pesado < 22,3 · médio até 31,1 · leve acima' },
        { id: 's', label: 'Enxofre total', min: 0.05, max: 4, step: 0.01, valor: 0.40, unidade: '% massa',
          desc: 'Doce abaixo de 0,5 %; ácido (sour) acima' },
        { tipo: 'titulo', label: 'Temperaturas de corte (PEV)' },
        { id: 'tNafta', label: 'Fim da nafta', min: 140, max: 200, step: 1, valor: 175, unidade: '°C' },
        { id: 'tQav', label: 'Fim do querosene', min: 205, max: 280, step: 1, valor: 235, unidade: '°C' },
        { id: 'tDiesel', label: 'Fim do diesel (início do resíduo atmosférico)', min: 330, max: 400, step: 1, valor: 370, unidade: '°C' },
        { id: 'tGov', label: 'Fim do gasóleo de vácuo', min: 500, max: 600, step: 1, valor: 565, unidade: '°C',
          desc: 'Limitado pela temperatura em que o resíduo começa a craquear' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar a destilação', valor: true }
      ],
      graficos: [
        { id: 'bancada', axes: false, height: 400, grid: false, legend: false },
        { id: 'pev', titulo: 'Curva PEV', xlabel: '% volume destilado', ylabel: 'Temperatura (°C)',
          aspect: 0.48, legendPos: 'topleft' },
        { id: 'rend', titulo: 'Rendimento por corte', xlabel: '', ylabel: 'Rendimento (% vol)',
          aspect: 0.36, legend: false },
        { id: 'enx', titulo: 'Enxofre em cada corte', xlabel: '', ylabel: 'Enxofre (% massa)',
          aspect: 0.32, legend: false }
      ],
      saidas: [
        { id: 'd', label: 'Densidade 60/60' },
        { id: 'classe', label: 'Classificação' },
        { id: 'K', label: 'K_UOP (estimado)' },
        { id: 'leves', label: 'GLP + naftas' },
        { id: 'medios', label: 'Destilados médios' },
        { id: 'rat', label: 'Resíduo atmosférico' },
        { id: 'rv', label: 'Resíduo de vácuo' },
        { id: 'srv', label: 'S no resíduo de vácuo' }
      ],
      formulas: [
        { g: 'Densidade' },
        { tex: '{}^\\circ API = \\frac{141{,}5}{d_{60/60}} - 131{,}5', d: 'ASTM D287 · água = 10 °API', destaque: true },
        { tex: 'd_{60/60} = \\frac{141{,}5}{{}^\\circ API + 131{,}5}' },
        { tex: '\\text{leve} > 31{,}1 \\quad \\text{médio } 22{,}3\\text{ a }31{,}1 \\quad \\text{pesado} < 22{,}3 \\quad \\text{extrapesado} < 10',
          d: 'classificação usada pela ANP' },
        { g: 'Natureza química' },
        { tex: 'K_{UOP} = \\frac{\\sqrt[3]{T_B}}{d_{60/60}}', d: 'T_B em °R (rankine) · fator de Watson', destaque: true },
        { tex: 'T_B \\approx \\frac{T_{10} + T_{30} + T_{50} + T_{70} + T_{90}}{5}', d: 'média volumétrica das temperaturas da PEV' },
        { tex: 'K \\geq 12{,}5 \\text{ parafínico} \\quad \\approx 11{,}5 \\text{ naftênico} \\quad \\leq 11 \\text{ aromático}' },
        { g: 'Rendimentos' },
        { tex: 'R_{corte} = x_{PEV}(T_{fim}) - x_{PEV}(T_{início})', d: 'lido direto na curva, em % volume', destaque: true },
        { tex: 'w_i = \\frac{V_i\\, d_i}{\\sum V_j\\, d_j}', d: 'passagem de % volume para % massa' },
        { tex: '\\bar S = \\sum w_i\\, S_i', d: 'o balanço de enxofre tem de fechar com o teor do cru' }
      ],
      passos: [],
      nota: 'A PEV é interpolada entre avaliações publicadas de um petróleo leve (tipo Brent, 38 °API) e um pesado (tipo Marlim, 20 °API); a densidade de cada corte sai do fator de Watson e a distribuição de enxofre é normalizada para fechar o balanço de massa. Para projeto, use a avaliação (assay) real do petróleo.',
      calcular: function (p, ctx) {
        var b = calcula(p);
        A.ctx = ctx; A.p = p; A.b = b; A.on = !!p.animar;
        desenha();

        /* curva PEV com as áreas de cada corte */
        var g = ctx.plot('pev').clear();
        var xsT = [], ysT = [];
        for (var T = -40; T <= 700; T += 4) { xsT.push(b.pev.x(T)); ysT.push(T); }
        var lim = [-40].concat(b.cortes).concat([700]);
        for (var i = 0; i < PET.CORTES.length; i++) {
          var xa = [], ya = [];
          for (var TT = lim[i]; TT <= lim[i + 1] + 0.01; TT += 3) { xa.push(b.pev.x(TT)); ya.push(TT); }
          if (xa.length > 1) g.area(xa, ya, { color: corCorte(i), alpha: 0.30, stroke: false, base: -40 });
        }
        g.line(xsT, ysT, { color: Plot.cssVar('--text', '#222'), width: 2.6, label: 'PEV · ' + sg(p.api, 3) + ' °API' });
        b.cortes.slice(2).forEach(function (Tc) {
          g.hline(Tc, { color: Plot.cssVar('--text-faint', '#999'), width: 1, dash: [3, 4] });
        });
        g.vline(b.pev.x(p.tDiesel), { color: Plot.serie(7), width: 1.4,
          text: 'resíduo atm. ' + sg(b.rat, 3) + ' %' });
        g.setLimits([0, 100], [-40, 700]);
        g.draw();

        /* rendimentos */
        var xcat = b.bal.map(function (x, j) { return { v: j, label: x.corte.curto }; });
        var gr = ctx.plot('rend').clear();
        gr.o.xcat = xcat;
        b.bal.forEach(function (x, j) {
          gr.bars([j], [x.vol], { color: corCorte(j), barw: 0.72 });
          gr.text(j, x.vol, sg(x.vol, 3), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        gr.setLimits([-0.6, b.bal.length - 0.4], [0, Math.max.apply(null, b.bal.map(function (x) { return x.vol; })) * 1.22]);
        gr.draw();

        var ge = ctx.plot('enx').clear();
        ge.o.xcat = xcat;
        b.bal.forEach(function (x, j) {
          ge.bars([j], [x.s], { color: corCorte(j), barw: 0.72 });
          ge.text(j, x.s, sg(x.s, 2), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        ge.hline(p.s, { color: Plot.serie(6), width: 1.4, text: 'teor do cru ' + sg(p.s, 3) + ' %' });
        ge.setLimits([-0.6, b.bal.length - 0.4], [0, Math.max.apply(null, b.bal.map(function (x) { return x.s; })) * 1.25]);
        ge.draw();

        var dies = b.bal.filter(function (x) { return x.corte.id === 'dl' || x.corte.id === 'dp'; });
        var rv = b.rv;
        ctx.setPassos([
          { t: '① Densidade a partir do °API',
            tex: 'd_{60/60} = \\frac{141{,}5}{{}^\\circ API + 131{,}5}',
            texSub: 'd = \\frac{141{,}5}{' + nt(p.api) + ' + 131{,}5} = ' + nt(b.d, 4),
            obs: 'O °API é uma escala invertida: quanto maior, mais leve. Por isso ele é conveniente '
              + 'para o mercado — "petróleo de 30 graus" já diz algo — e cada ponto de °API a mais '
              + 'costuma valer um prêmio no preço do barril. Classificação: ' + PET.classe(p.api) + '.' },
          { t: '② Natureza química pelo fator de Watson',
            tex: 'K_{UOP} = \\frac{\\sqrt[3]{T_B}}{d}, \\qquad T_B = \\frac{T_{10}+T_{30}+T_{50}+T_{70}+T_{90}}{5}',
            texSub: 'T_B = \\frac{' + b.pts.map(function (v) { return nt(v, 3); }).join(' + ') + '}{5} = '
              + nt(b.vabp, 4) + '\\,{}^\\circ C = ' + nt((b.vabp + 273.15) * 1.8, 4) + '\\,{}^\\circ R'
              + ' \\;\\Rightarrow\\; K = \\frac{\\sqrt[3]{' + nt((b.vabp + 273.15) * 1.8, 4) + '}}{' + nt(b.d, 4) + '} = ' + nt(b.K, 3),
            obs: 'A ideia de Watson: a parafina ferve alto sendo leve, o aromático ferve alto sendo '
              + 'denso. Mesmo ponto de ebulição com densidades diferentes revela a família química. '
              + 'Base ' + PET.baseKuop(b.K) + ' — estimativa, porque os pontos acima de ~565 °C da PEV '
              + 'são extrapolados.' },
          { t: '③ Rendimento de cada corte, direto na curva PEV',
            tex: 'R = x_{PEV}(T_{fim}) - x_{PEV}(T_{início})',
            texSub: 'R_{diesel} = x(' + nt(p.tDiesel) + ') - x(' + nt(p.tQav) + ') = '
              + nt(b.pev.x(p.tDiesel), 3) + ' - ' + nt(b.pev.x(p.tQav), 3) + ' = '
              + nt(dies[0].vol + dies[1].vol, 3) + '\\ \\%\\ vol',
            obs: 'A curva PEV é destilada com alta eficiência de separação (15 pratos teóricos, refluxo 5:1), '
              + 'por isso cada ponto dela é praticamente um ponto de ebulição verdadeiro. Uma torre '
              + 'industrial separa pior: há sobreposição entre cortes vizinhos, que nas especificações '
              + 'aparece como folga (gap) ou sobreposição (overlap) entre o fim de um e o início do outro.' },
          { t: '④ O que sobra: resíduos',
            tex: 'RAT = 100 - x(T_{diesel}), \\qquad RV = 100 - x(T_{GOV})',
            texSub: 'RAT = 100 - ' + nt(b.pev.x(p.tDiesel), 3) + ' = ' + nt(b.rat, 3)
              + '\\ \\% \\qquad RV = 100 - ' + nt(b.xFim, 3) + ' = ' + nt(rv.vol, 3) + '\\ \\%',
            obs: 'Todo petróleo deixa um resíduo que não ferve antes de craquear. Um cru pesado deixa '
              + 'muito mais fundo: é por isso que refinarias que processam petróleo pesado precisam de '
              + 'conversão de fundo (coqueamento, FCC de resíduo) para não sobrar óleo combustível '
              + 'de baixo valor.' },
          { t: '⑤ Balanço de enxofre — ele se concentra no fundo',
            tex: '\\bar S = \\frac{\\sum V_i\\, d_i\\, S_i}{\\sum V_i\\, d_i}',
            texSub: 'S_{RV} = ' + nt(rv.s, 3) + '\\ \\% \\quad \\text{contra}\\quad S_{cru} = ' + nt(p.s, 3)
              + '\\ \\% \\quad (' + nt(rv.s / p.s, 3) + '\\times)',
            obs: 'Os compostos sulfurados pesados (benzotiofenos e dibenzotiofenos) fervem alto, então o '
              + 'enxofre migra para as frações de fundo. A nafta leve quase não tem enxofre; o resíduo '
              + 'de vácuo concentra várias vezes o teor do cru. É esse o motivo de todo destilado médio '
              + 'precisar de hidrotratamento antes de virar diesel S-10.' }
        ]);

        return {
          d: { v: b.d, u: '' },
          classe: { v: PET.classe(p.api), u: '' },
          K: { v: b.K, u: PET.baseKuop(b.K) },
          leves: { v: b.leves, u: '% vol' },
          medios: { v: b.medios, u: '% vol' },
          rat: { v: b.rat, u: '% vol' },
          rv: { v: rv.vol, u: '% vol', classe: rv.vol > 30 ? 'alerta' : '' },
          srv: { v: rv.s, u: '% massa' }
        };
      }
    });
  })();

  /* ==========================================================================
     2. Torre de destilação atmosférica
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-torre')) return;

    var A = { ctx: null, p: null, r: null, fase: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#888');
      var borda = Plot.cssVar('--border-strong', '#999');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var f = A.fase, k, i;

      /* ---------- geometria ---------- */
      var tx = X0 + W * 0.40, tw = W * 0.085;             /* torre */
      var tTop = Y0 + H * 0.10, tBot = Y0 + H * 0.90;
      var yFlash = Y0 + H * 0.70;
      var yQav = Y0 + H * 0.27, yDiesel = Y0 + H * 0.41, yGoa = Y0 + H * 0.60;
      var tMin = r.temps.topo - 20, tMax = r.tFz + 10;
      function yParaT(y) {                                  /* temperatura ao longo da altura */
        var pts = [[tTop, r.temps.topo], [yQav, r.temps.qav], [yDiesel, r.temps.diesel],
                   [yFlash, r.temps.flash], [tBot, r.temps.fundo]];
        for (var j = 0; j < pts.length - 1; j++) {
          if (y <= pts[j + 1][0]) {
            var s = (y - pts[j][0]) / (pts[j + 1][0] - pts[j][0]);
            return pts[j][1] + s * (pts[j + 1][1] - pts[j][1]);
          }
        }
        return r.temps.fundo;
      }

      /* ---------- forno ---------- */
      var fx = X0 + W * 0.05, fw = W * 0.15, fy = Y0 + H * 0.55, fh = H * 0.36;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.fillRect(fx, fy, fw, fh); c.strokeRect(fx, fy, fw, fh);
      /* chaminé */
      c.fillRect(fx + fw * 0.38, fy - H * 0.12, fw * 0.24, H * 0.12);
      c.strokeRect(fx + fw * 0.38, fy - H * 0.12, fw * 0.24, H * 0.12);
      /* fumaça */
      c.fillStyle = faint;
      for (k = 0; k < 6; k++) {
        var fs = (f * 3 + k / 6) % 1;
        c.globalAlpha = 0.35 * (1 - fs);
        c.beginPath();
        c.arc(fx + fw * 0.5 + Math.sin(k * 2 + f * 20) * 5, fy - H * 0.12 - fs * H * 0.08, 3 + fs * 6, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
      /* chamas: altura proporcional à temperatura de saída */
      var intens = Math.max(0.15, Math.min(1, (p.tForno - 320) / 80));
      for (k = 0; k < 5; k++) {
        var bxq = fx + fw * (0.15 + k * 0.175);
        var hq = fh * 0.30 * intens * (0.75 + 0.25 * Math.sin(f * 60 + k * 1.7));
        var gq = c.createLinearGradient(bxq, fy + fh, bxq, fy + fh - hq);
        gq.addColorStop(0, 'rgba(255,200,40,0.95)');
        gq.addColorStop(0.5, 'rgba(255,110,20,0.8)');
        gq.addColorStop(1, 'rgba(220,40,20,0)');
        c.fillStyle = gq;
        c.beginPath();
        c.moveTo(bxq - 7, fy + fh - 4);
        c.quadraticCurveTo(bxq - 3, fy + fh - hq * 0.6, bxq, fy + fh - hq);
        c.quadraticCurveTo(bxq + 3, fy + fh - hq * 0.6, bxq + 7, fy + fh - 4);
        c.fill();
      }
      /* serpentina */
      c.strokeStyle = corTemp(p.tForno, 250, 400); c.lineWidth = 3;
      c.beginPath();
      for (k = 0; k <= 8; k++) {
        var yy = fy + fh * 0.12 + k * fh * 0.055;
        c.moveTo(fx + fw * 0.12, yy); c.lineTo(fx + fw * 0.88, yy);
      }
      c.stroke();
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('Forno', fx + fw / 2, fy + fh + 4);
      c.font = fonte(10); c.fillStyle = faint;
      c.fillText(sg(r.Q_MW, 3) + ' MW', fx + fw / 2, fy + fh + 18);

      /* ---------- tubulações ---------- */
      var cCru = 'rgb(120,80,30)';
      /* carga preaquecida entra no forno */
      tubo(c, [[X0 + 2, fy + fh * 0.85], [fx, fy + fh * 0.85]], cCru, 6, f * 2, 3, 2.4, cCru);
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('cru a ' + sg(p.tPre, 3) + ' °C', X0 + 2, fy + fh * 0.85 - 6);
      /* linha de transferência: forno → zona de flash */
      var ltr = [[fx + fw, fy + fh * 0.12], [tx - tw / 2 - 20, fy + fh * 0.12],
                 [tx - tw / 2 - 20, yFlash], [tx - tw / 2, yFlash]];
      tubo(c, ltr, corTemp(p.tForno, 250, 400), 7, f * 2.5, 9, 2.6, 'rgb(255,150,60)');

      /* ---------- corpo da torre com gradiente de temperatura ---------- */
      var grd = c.createLinearGradient(0, tTop, 0, tBot);
      grd.addColorStop(0, corTemp(r.temps.topo, tMin, tMax));
      grd.addColorStop(0.45, corTemp(r.temps.diesel, tMin, tMax));
      grd.addColorStop(0.75, corTemp(r.temps.flash, tMin, tMax));
      grd.addColorStop(1, corTemp(r.temps.fundo, tMin, tMax));
      c.globalAlpha = 0.28; c.fillStyle = grd;
      c.fillRect(tx - tw / 2, tTop, tw, tBot - tTop);
      c.globalAlpha = 1;
      c.strokeStyle = cor; c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(tx - tw / 2, tBot); c.lineTo(tx - tw / 2, tTop + 10);
      c.quadraticCurveTo(tx - tw / 2, tTop, tx, tTop - 6);
      c.quadraticCurveTo(tx + tw / 2, tTop, tx + tw / 2, tTop + 10);
      c.lineTo(tx + tw / 2, tBot);
      c.quadraticCurveTo(tx + tw / 2, tBot + 10, tx, tBot + 12);
      c.quadraticCurveTo(tx - tw / 2, tBot + 10, tx - tw / 2, tBot);
      c.stroke();
      /* pratos alternados */
      c.strokeStyle = borda; c.lineWidth = 1.4;
      var nPratos = 26;
      for (k = 0; k < nPratos; k++) {
        var yp = tTop + 16 + k * (tBot - tTop - 30) / nPratos;
        if (Math.abs(yp - yFlash) < 8) continue;
        var esq = k % 2 === 0;
        c.beginPath();
        c.moveTo(esq ? tx - tw / 2 : tx - tw / 2 + tw * 0.22, yp);
        c.lineTo(esq ? tx + tw / 2 - tw * 0.22 : tx + tw / 2, yp);
        c.stroke();
      }
      /* bolhas de vapor subindo acima da zona de flash (quantidade ∝ vaporizado) */
      var nb = Math.round(10 + r.V * 0.5);
      for (k = 0; k < nb; k++) {
        var sb = (f * 1.6 + k * 0.6180339) % 1;
        var yb = yFlash - sb * (yFlash - tTop - 8);
        var xb = tx + (((k * 37) % 100) / 100 - 0.5) * tw * 0.8;
        c.fillStyle = corTemp(yParaT(yb), tMin, tMax);
        c.globalAlpha = 0.85;
        c.beginPath(); c.arc(xb, yb, 2.3, 0, TAU); c.fill();
      }
      /* gotas de líquido descendo (refluxo interno) */
      c.globalAlpha = 0.8;
      for (k = 0; k < 16; k++) {
        var sd = (f * 1.1 + k / 16) % 1;
        var yd = tTop + 12 + sd * (tBot - tTop - 20);
        var xd = tx + (k % 2 ? 1 : -1) * tw * 0.40;
        c.fillStyle = yd > yFlash ? 'rgb(90,55,20)' : 'rgb(210,160,60)';
        c.beginPath(); c.arc(xd, yd, 1.9, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;

      /* nível de fundo */
      c.fillStyle = 'rgba(70,40,15,0.75)';
      c.fillRect(tx - tw / 2 + 1, tBot - H * 0.05, tw - 2, H * 0.05);

      /* ---------- vapor de retificação ---------- */
      var vy = tBot - H * 0.07;
      tubo(c, [[tx + tw / 2 + W * 0.07, vy], [tx + tw / 2, vy]], 'rgb(180,200,230)', 4,
           -f * (1 + p.vapor / 15), Math.round(2 + p.vapor / 5), 2, 'rgb(230,240,255)');
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('vapor ' + sg(p.vapor, 3) + ' kg/m³', tx + tw / 2 + W * 0.02, vy - 5);

      /* ---------- topo: condensador, vaso de refluxo ---------- */
      var cxC = X0 + W * 0.56, cyC = Y0 + H * 0.05;
      var dxV = X0 + W * 0.63, dyV = Y0 + H * 0.15;
      tubo(c, [[tx, tTop - 6], [tx, Y0 + 4], [cxC, Y0 + 4], [cxC, cyC]],
           corTemp(r.temps.topo, tMin, tMax), 5, f * 2, 6, 2, corCorte(1));
      c.fillStyle = 'rgba(80,160,230,0.35)'; c.strokeStyle = cor; c.lineWidth = 1.6;
      c.fillRect(cxC - 16, cyC, 32, 16); c.strokeRect(cxC - 16, cyC, 32, 16);
      c.fillStyle = faint; c.font = fonte(9); c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('condensador', cxC + 20, cyC + 8);
      tubo(c, [[cxC, cyC + 16], [cxC, dyV]], corCorte(1), 4, f * 2, 2, 2, corCorte(1));
      /* vaso */
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(dxV, dyV + 10, W * 0.055, 12, 0, 0, TAU);
      c.fill(); c.stroke();
      c.save(); c.beginPath(); c.ellipse(dxV, dyV + 10, W * 0.055, 12, 0, 0, TAU); c.clip();
      c.fillStyle = corCorte(2); c.globalAlpha = 0.7;
      c.fillRect(dxV - W * 0.06, dyV + 12 + Math.sin(f * 20) * 1.2, W * 0.12, 12);
      c.restore(); c.globalAlpha = 1;
      /* bota de água */
      c.fillStyle = 'rgba(80,160,230,0.6)'; c.strokeStyle = cor;
      c.fillRect(dxV + W * 0.02, dyV + 20, 8, 12); c.strokeRect(dxV + W * 0.02, dyV + 20, 8, 12);
      /* refluxo de volta ao topo */
      tubo(c, [[dxV - W * 0.04, dyV + 18], [dxV - W * 0.04, tTop + 14], [tx + tw / 2, tTop + 14]],
           corCorte(2), 3.5, -f * 2, 4, 1.8, corCorte(2));
      c.fillStyle = faint; c.font = fonte(9); c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText('refluxo', dxV - W * 0.045, tTop + 16);

      /* ---------- produtos ---------- */
      var xFim = X0 + W * 0.995;
      var yRes = Y0 + H * 0.95;
      var produtos = [
        { nome: 'GLP + nafta', v: r.prod.nafta, y: dyV + 10, x0: dxV + W * 0.055, cor: corCorte(1) },
        { nome: 'Querosene', v: r.prod.qav, y: yQav, x0: tx + tw / 2, cor: corCorte(3), strip: true },
        { nome: 'Diesel', v: r.prod.diesel, y: yDiesel, x0: tx + tw / 2, cor: corCorte(4), strip: true },
        { nome: 'Gasóleo atm.', v: r.prod.goa, y: yGoa, x0: tx + tw / 2, cor: corCorte(5) },
        { nome: 'Resíduo atm.', v: r.prod.rat, y: yRes, x0: tx, cor: 'rgb(120,75,30)' }
      ];
      var xStrip = X0 + W * 0.60;
      produtos.forEach(function (pr, j) {
        var larg = 2 + Math.min(7, pr.v * 0.18);
        var nPart = pr.v > 0.2 ? Math.round(2 + pr.v / 4) : 0;
        var vel = f * (0.8 + pr.v / 25);
        if (j === 4) {
          tubo(c, [[tx, tBot + 12], [tx, yRes], [xFim, yRes]], pr.cor, larg, vel, nPart, 2, pr.cor);
          pr.yRot = yRes;
        } else if (pr.strip) {
          /* retificadora lateral: tira os leves e acerta o ponto de fulgor */
          tubo(c, [[pr.x0, pr.y], [xStrip - 7, pr.y], [xStrip - 7, pr.y + 8]], pr.cor, larg, vel, nPart, 2, pr.cor);
          c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.4;
          c.fillRect(xStrip - 11, pr.y + 6, 22, 26); c.strokeRect(xStrip - 11, pr.y + 6, 22, 26);
          tubo(c, [[xStrip, pr.y + 32], [xStrip, pr.y + 40], [xFim, pr.y + 40]], pr.cor, larg, vel, nPart, 2, pr.cor);
          pr.yRot = pr.y + 40;
        } else {
          tubo(c, [[pr.x0, pr.y], [xFim, pr.y]], pr.cor, larg, vel, nPart, 2, pr.cor);
          pr.yRot = pr.y;
        }
      });
      produtos.forEach(function (pr, j) {
        var txt = sg(pr.v, 3) + ' % · ' + sg(pr.v / 100 * p.vazao, 3) + ' m³/d';
        c.textAlign = 'right';
        if (j === 0) {
          /* linha curta da nafta: nome em cima, valores embaixo */
          c.fillStyle = pr.cor; c.font = fonte(10.5, '700'); c.textBaseline = 'bottom';
          c.fillText(pr.nome, xFim, pr.yRot - 5);
          c.fillStyle = cor; c.font = fonte(9.5); c.textBaseline = 'top';
          c.fillText(txt, xFim, pr.yRot + 6);
        } else {
          c.textBaseline = 'bottom';
          c.font = fonte(9.5); c.fillStyle = cor;
          var wTxt = c.measureText(txt).width;
          c.fillText(txt, xFim, pr.yRot - 5);
          c.fillStyle = pr.cor; c.font = fonte(10.5, '700');
          c.fillText(pr.nome + '  ', xFim - wTxt, pr.yRot - 5);
        }
      });

      /* ---------- temperaturas ao lado da torre ---------- */
      [['topo', tTop + 6, r.temps.topo], ['querosene', yQav, r.temps.qav],
       ['diesel', yDiesel, r.temps.diesel], ['zona de flash', yFlash, r.temps.flash],
       ['fundo', tBot - 8, r.temps.fundo]].forEach(function (t) {
        c.fillStyle = corTemp(t[2], tMin, tMax);
        c.font = fonte(10, '700'); c.textAlign = 'right'; c.textBaseline = 'middle';
        var xl = tx - tw / 2 - (t[0] === 'zona de flash' ? 28 : 6);
        var yl = t[0] === 'zona de flash' ? yFlash - 12 : t[1];
        c.fillText(sg(t[2], 3) + ' °C', xl, yl);
        c.font = fonte(8.5); c.fillStyle = faint;
        c.fillText(t[0], xl, yl + 11);
      });

      /* ---------- avisos (canto livre à direita, abaixo das retiradas) ---------- */
      var ya = Y0 + H * 0.68, xa = X0 + W * 0.52;
      c.textAlign = 'left'; c.textBaseline = 'top';
      if (r.avisos.indexOf('craqueamento') >= 0) {
        c.fillStyle = Plot.serie(6); c.font = fonte(10.5, '700');
        c.fillText('⚠ forno acima de ' + sg(r.limCraq, 3) + ' °C:', xa, ya);
        c.font = fonte(10);
        c.fillText('craqueamento e coque nos tubos', xa + 14, ya + 14);
        ya += 34;
      }
      if (r.avisos.indexOf('dieselPerdido') >= 0) {
        c.fillStyle = Plot.serie(3); c.font = fonte(10.5, '700');
        c.fillText('⚠ ' + sg(r.dieselPerdido, 2) + ' % do cru é diesel', xa, ya);
        c.font = fonte(10);
        c.fillText('descendo com o resíduo', xa + 14, ya + 14);
      }
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('torre');
      pl.clear(); pl.setLimits([0, 1], [0, 1]);
      pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.fase = (A.fase + dt * 0.25) % 1;
      desenha();
    });

    Sim.build('#sim-torre', {
      titulo: 'Destilação atmosférica — forno, zona de flash e retiradas laterais',
      descricao: 'O cru sai do forno parcialmente vaporizado e se separa na zona de flash: o vapor sobe e é fracionado nos pratos, o líquido desce e vira resíduo. Tudo o que o operador faz — temperatura do forno, pressão, vapor de retificação — mexe numa única coisa: quanto do cru consegue vaporizar sem craquear.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Operação normal', desc: 'Cru leve, forno a 365 °C',
          valores: { api: 33, vazao: 20000, tForno: 365, pTopo: 1.6, vapor: 15, tPre: 270, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } },
        { nome: '2 · Forno frio: diesel no fundo', desc: 'O resíduo leva o diesel pesado',
          valores: { api: 33, vazao: 20000, tForno: 348, pTopo: 1.6, vapor: 15, tPre: 270, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } },
        { nome: '3 · Recuperar com vapor, não com fogo', desc: 'Mesmo forno, mais vapor de retificação',
          valores: { api: 33, vazao: 20000, tForno: 358, pTopo: 1.6, vapor: 35, tPre: 270, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } },
        { nome: '4 · Forno quente demais', desc: 'Passa do limite de craqueamento',
          valores: { api: 33, vazao: 20000, tForno: 392, pTopo: 1.6, vapor: 15, tPre: 270, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } },
        { nome: '5 · Pressão de topo alta', desc: 'Condensador limitado no verão',
          valores: { api: 33, vazao: 20000, tForno: 365, pTopo: 2.6, vapor: 15, tPre: 270, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } },
        { nome: '6 · Petróleo pesado', desc: 'Marlim: dois terços viram resíduo',
          valores: { api: 19.6, vazao: 20000, tForno: 365, pTopo: 1.6, vapor: 15, tPre: 270, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } },
        { nome: '7 · Bateria de preaquecimento suja', desc: 'Cru chega mais frio: o forno paga a conta',
          valores: { api: 33, vazao: 20000, tForno: 365, pTopo: 1.6, vapor: 15, tPre: 225, tNafta: 175, tQav: 235, tDiesel: 370, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Carga' },
        { id: 'api', label: 'Grau API do cru', min: 15, max: 45, step: 0.1, valor: 33, unidade: '°API' },
        { id: 'vazao', label: 'Vazão de carga', min: 5000, max: 50000, step: 500, valor: 20000, unidade: 'm³/d',
          desc: '20 000 m³/d ≈ 126 mil barris por dia' },
        { id: 'tPre', label: 'Cru na saída da bateria de preaquecimento', min: 200, max: 300, step: 1, valor: 270, unidade: '°C' },
        { tipo: 'titulo', label: 'Operação' },
        { id: 'tForno', label: 'Temperatura de saída do forno', min: 330, max: 400, step: 1, valor: 365, unidade: '°C' },
        { id: 'pTopo', label: 'Pressão de topo', min: 1.2, max: 3.0, step: 0.05, valor: 1.6, unidade: 'bar abs' },
        { id: 'vapor', label: 'Vapor de retificação', min: 0, max: 45, step: 1, valor: 15, unidade: 'kg/m³ de RAT' },
        { tipo: 'titulo', label: 'Especificação dos cortes (PEV)' },
        { id: 'tNafta', label: 'Ponto final da nafta', min: 150, max: 200, step: 1, valor: 175, unidade: '°C' },
        { id: 'tQav', label: 'Ponto final do querosene', min: 210, max: 270, step: 1, valor: 235, unidade: '°C' },
        { id: 'tDiesel', label: 'Ponto final do diesel', min: 330, max: 390, step: 1, valor: 370, unidade: '°C' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'torre', axes: false, height: 470, grid: false, legend: false },
        { id: 'flash', titulo: 'Quanto vaporiza na zona de flash', xlabel: 'Temperatura de saída do forno (°C)',
          ylabel: 'Vaporizado (% vol)', aspect: 0.42, legendPos: 'topleft' },
        { id: 'prod', titulo: 'Produtos da torre', xlabel: '', ylabel: 'Rendimento (% vol)', aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'V', label: 'Vaporizado no flash' },
        { id: 'pHC', label: 'Pressão parcial dos HC' },
        { id: 'corte', label: 'Corte do resíduo (PEV)' },
        { id: 'diesel', label: 'Diesel' },
        { id: 'perdido', label: 'Diesel perdido no fundo' },
        { id: 'Q', label: 'Carga térmica do forno' },
        { id: 'comb', label: 'Óleo combustível queimado' },
        { id: 'topo', label: 'Temperatura de topo' }
      ],
      formulas: [
        { g: 'Zona de flash' },
        { tex: 'P_{flash} = P_{topo} + \\Delta P_{pratos}', d: '≈ 0,3 a 0,4 bar em 30 pratos' },
        { tex: 'p_{HC} = P_{flash}\\,\\frac{n_{HC}}{n_{HC} + n_{vapor}}', d: 'o vapor d’água dilui os hidrocarbonetos', destaque: true },
        { tex: 'n_{HC} = \\frac{\\dot m_{vap}}{M}, \\qquad M = 42{,}965\\,e^{2{,}097\\times10^{-4}T_b - 7{,}787\\,d + 2{,}085\\times10^{-3}T_b d}\\,T_b^{1{,}26}\\,d^{4{,}98}',
          d: 'peso molecular por Riazi-Daubert, T_b em K' },
        { tex: 'T_{AET} = f(T_{flash},\\ p_{HC})', d: 'Maxwell-Bonnell: a temperatura que teria de fazer a 1 atm', destaque: true },
        { tex: 'T_{corte}^{PEV} \\approx T_{AET} + \\Delta_{VEE}', d: 'a vaporização de equilíbrio é menos seletiva que a PEV (Δ ≈ 30 °C)' },
        { g: 'Forno' },
        { tex: 'Q = \\dot m_{cru}\\,c_p\\,(T_{forno} - T_{pré}) + \\dot m_{vap}\\,\\lambda', d: 'sensível + latente', destaque: true },
        { tex: '\\dot m_{comb} = \\frac{Q}{\\eta\\,PCI}', d: 'η ≈ 88 % · PCI do óleo ≈ 40 MJ/kg' },
        { g: 'Regras de operação' },
        { tex: 'T_{forno} \\lesssim 370\\text{ a }385\\ ^\\circ C', d: 'acima disso o resíduo craqueia e forma coque nos tubos' },
        { tex: '\\uparrow vapor \\Rightarrow \\downarrow p_{HC} \\Rightarrow \\uparrow vaporizado', d: 'recupera destilado sem esquentar o forno' },
        { tex: '\\uparrow P_{topo} \\Rightarrow \\uparrow T \\text{ em toda a torre}', d: 'e menos vaporização na mesma temperatura de forno' }
      ],
      passos: [],
      nota: 'Modelo de equilíbrio simplificado: a vaporização na zona de flash sai da PEV na temperatura atmosférica equivalente (Maxwell-Bonnell) corrigida para a curva de vaporização de equilíbrio, com 3 % de overflash. As temperaturas das retiradas são pontos de bolha aproximados. Serve para entender o sentido e a ordem de grandeza de cada variável; projeto de torre usa simulador de processo com balanço prato a prato.',
      calcular: function (p, ctx) {
        var r = PET.torre(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        /* curva de vaporização contra a temperatura do forno */
        var ts = [], vs = [], v0 = [];
        for (var T = 330; T <= 400; T += 2.5) {
          ts.push(T);
          vs.push(PET.torre(Object.assign({}, p, { tForno: T })).V);
          v0.push(PET.torre(Object.assign({}, p, { tForno: T, vapor: 0 })).V);
        }
        var g = ctx.plot('flash').clear();
        g.line(ts, v0, { color: Plot.cssVar('--text-faint', '#999'), width: 1.8, dash: [5, 4], label: 'sem vapor' });
        g.line(ts, vs, { color: Plot.serie(0), width: 2.6, label: 'com ' + sg(p.vapor, 3) + ' kg/m³ de vapor' });
        g.hline(r.pev.x(p.tDiesel) + PET.OVERFLASH, { color: Plot.serie(4), width: 1.3,
          text: 'necessário p/ fechar o diesel' });
        g.vline(r.limCraq, { color: Plot.serie(6), width: 1.4, text: 'craqueamento' });
        g.marker(p.tForno, r.V, 'operação', { color: Plot.serie(0), r: 5.5 });
        g.draw();

        var nomes = ['GLP+nafta', 'Querosene', 'Diesel', 'Gasóleo atm.', 'Resíduo atm.'];
        var vals = [r.prod.nafta, r.prod.qav, r.prod.diesel, r.prod.goa, r.prod.rat];
        var cores = [corCorte(1), corCorte(3), corCorte(4), corCorte(5), 'rgb(120,75,30)'];
        var gp = ctx.plot('prod').clear();
        gp.o.xcat = nomes.map(function (n, j) { return { v: j, label: n }; });
        vals.forEach(function (v, j) {
          gp.bars([j], [v], { color: cores[j], barw: 0.7 });
          gp.text(j, v, sg(v, 3), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        if (r.dieselPerdido > 0.05) {
          gp.bars([2], [r.dieselPerdido], { color: Plot.serie(6), barw: 0.25, alpha: 0.9 });
        }
        gp.setLimits([-0.6, 4.6], [0, Math.max.apply(null, vals) * 1.2]);
        gp.draw();

        var rat = 100 - r.V;
        ctx.setPassos([
          { t: '① Pressão na zona de flash',
            tex: 'P_{flash} = P_{topo} + \\Delta P',
            texSub: 'P_{flash} = ' + nt(p.pTopo) + ' + 0{,}35 = ' + nt(r.pFz, 3) + '\\ \\mathrm{bar} = '
              + nt(r.pFz * 750.06, 4) + '\\ \\mathrm{mmHg}',
            obs: 'O vapor precisa de pressão para vencer os pratos até o topo, então a zona de flash '
              + 'fica sempre acima da pressão do vaso de refluxo. É por isso que se opera o topo na '
              + 'menor pressão que o condensador consegue manter.' },
          { t: '② O vapor d’água baixa a pressão parcial dos hidrocarbonetos',
            tex: 'p_{HC} = P_{flash}\\,\\frac{n_{HC}}{n_{HC}+n_{v}}',
            texSub: 'n_{HC} = \\frac{' + nt(r.mVap / 1000, 4) + '\\ \\mathrm{t/h}}{' + nt(r.MWv, 3)
              + '} = ' + nt(r.nHC, 4) + '\\ \\mathrm{kmol/h} \\quad n_v = ' + nt(r.nV, 3)
              + ' \\;\\Rightarrow\\; p_{HC} = ' + nt(r.pFz * 750.06, 4) + '\\times' + nt(r.yHC, 3)
              + ' = ' + nt(r.pHC, 4) + '\\ \\mathrm{mmHg}',
            obs: 'O líquido ferve quando a SUA pressão de vapor iguala a pressão parcial dele no gás, '
              + 'não a pressão total. Cada mol de vapor d’água é um mol que “ocupa” pressão sem ser '
              + 'hidrocarboneto — é um vácuo parcial barato. Água tem peso molecular 18 contra ~'
              + sg(r.MWv, 3) + ' do vapor de óleo, então pouca massa de vapor dá muitos mols.' },
          { t: '③ Temperatura atmosférica equivalente (Maxwell-Bonnell)',
            tex: '\\log P = \\frac{2663{,}129X - 5{,}994}{95{,}76X - 0{,}9725}, \\quad X = \\frac{T_b/T - 0{,}0002867\\,T_b}{748{,}1 - 0{,}2145\\,T_b}',
            texSub: 'T = ' + nt(r.tFz, 4) + '\\,{}^\\circ C \\text{ a } ' + nt(r.pHC, 4)
              + '\\ \\mathrm{mmHg} \\;\\Rightarrow\\; T_{AET} = ' + nt(r.aetFz, 4) + '\\,{}^\\circ C',
            obs: 'A pergunta é: que fração, se estivesse a 1 atm, ferveria a ' + sg(r.aetFz, 3)
              + ' °C? Com p_HC acima de 760 mmHg a AET fica abaixo da temperatura real — a torre '
              + 'atmosférica, apesar do nome, trabalha acima da pressão atmosférica.' },
          { t: '④ Corte do resíduo e rendimentos',
            tex: 'T_{corte} = T_{AET} + 30, \\qquad V = x_{PEV}(T_{corte}) + \\text{overflash}',
            texSub: 'T_{corte} = ' + nt(r.tCorte, 4) + '\\,{}^\\circ C \\;\\Rightarrow\\; V = '
              + nt(r.xCorte, 3) + ' + 3 = ' + nt(r.V, 3) + '\\ \\%\\ vol',
            obs: r.dieselPerdido > 0.05
              ? 'O corte ficou abaixo do ponto final do diesel (' + p.tDiesel + ' °C): '
                + sg(r.dieselPerdido, 2) + ' % do cru, que seria diesel, desce com o resíduo e vai '
                + 'para o vácuo — onde vira gasóleo e perde valor. Suba o forno ou o vapor.'
              : 'O corte do resíduo passou do ponto final do diesel: todo o diesel está sendo '
                + 'recuperado. O excedente sai como gasóleo atmosférico. Os 3 % de overflash '
                + 'vaporizam e voltam como óleo de lavagem, limpando o vapor de metais e asfaltenos.' },
          { t: '⑤ Carga térmica do forno',
            tex: 'Q = \\dot m\\,c_p\\,(T_{forno} - T_{pré}) + \\dot m_{vap}\\,\\lambda',
            texSub: 'Q = ' + nt(r.mCru / 1000, 4) + '\\times 2{,}5\\times(' + nt(p.tForno) + ' - '
              + nt(p.tPre) + ') + ' + nt(r.mVap / 1000, 4) + '\\times 270 = ' + nt(r.Q_MW, 3) + '\\ \\mathrm{MW}',
            obs: 'Cerca de ' + sg(100 * r.qSens / (r.qSens + r.qLat), 2) + ' % do calor é sensível. '
              + 'É por isso que a bateria de preaquecimento — trocadores que aproveitam o calor dos '
              + 'próprios produtos quentes — é o item de maior impacto em energia da refinaria: '
              + 'cada 10 °C a menos na entrada custam ≈ ' + sg(r.mCru * 2.5 * 10 / 3.6e6, 2) + ' MW no forno.' },
          { t: '⑥ Combustível',
            tex: '\\dot m_{comb} = \\frac{Q}{\\eta\\,PCI}',
            texSub: '\\dot m = \\frac{' + nt(r.Q_MW * 3600, 4) + '\\ \\mathrm{MJ/h}}{0{,}88\\times 40} = '
              + nt(r.comb, 3) + '\\ \\mathrm{t/h}',
            obs: 'Isso é ' + sg(100 * r.comb * 24 / (r.mCru * 24 / 1000), 2) + ' % da massa de cru '
              + 'processada queimada só no forno atmosférico. Somando vácuo, conversão e utilidades, '
              + 'uma refinaria consome de 5 a 8 % do próprio petróleo como energia.' }
        ]);

        return {
          V: { v: r.V, u: '% vol' },
          pHC: { v: r.pHC, u: 'mmHg' },
          corte: { v: r.tCorte, u: '°C' },
          diesel: { v: r.prod.diesel, u: '% vol' },
          perdido: { v: r.dieselPerdido, u: '% vol', classe: r.dieselPerdido > 0.5 ? 'alerta' : 'ok' },
          Q: { v: r.Q_MW, u: 'MW', classe: 'destaque' },
          comb: { v: r.comb, u: 't/h' },
          topo: { v: r.temps.topo, u: '°C' }
        };
      }
    });
  })();

  /* ==========================================================================
     3. Destilação a vácuo
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-vacuo')) return;
    var A = { ctx: null, p: null, r: null, fase: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, f = A.fase, k;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var borda = Plot.cssVar('--border-strong', '#999');

      /* torre de vácuo: larga, com leitos de recheio */
      var tx = X0 + W * 0.36, tw = W * 0.16, tTop = Y0 + H * 0.20, tBot = Y0 + H * 0.92;
      var yFz = Y0 + H * 0.66;
      function casco() {
        c.beginPath();
        c.moveTo(tx - tw * 0.30, tTop); c.lineTo(tx + tw * 0.30, tTop);
        c.lineTo(tx + tw * 0.30, tTop + H * 0.06); c.lineTo(tx + tw / 2, tTop + H * 0.10);
        c.lineTo(tx + tw / 2, tBot - H * 0.10); c.lineTo(tx + tw * 0.25, tBot);
        c.lineTo(tx - tw * 0.25, tBot); c.lineTo(tx - tw / 2, tBot - H * 0.10);
        c.lineTo(tx - tw / 2, tTop + H * 0.10); c.lineTo(tx - tw * 0.30, tTop + H * 0.06);
        c.closePath();
      }
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2.2;
      casco(); c.fill(); c.stroke();
      /* leitos de recheio */
      [[0.30, 0.38, corCorte(4), 'GOV leve'], [0.44, 0.56, corCorte(6), 'GOV pesado']].forEach(function (lt) {
        var y1 = Y0 + H * lt[0], y2 = Y0 + H * lt[1];
        c.fillStyle = lt[2]; c.globalAlpha = 0.18;
        c.fillRect(tx - tw / 2 + 2, y1, tw - 4, y2 - y1);
        c.globalAlpha = 1;
        c.strokeStyle = borda; c.lineWidth = 1;
        for (var q = 0; q < 10; q++) {
          c.beginPath();
          c.moveTo(tx - tw / 2 + 2 + q * (tw - 4) / 10, y1);
          c.lineTo(tx - tw / 2 + 2 + (q + 1) * (tw - 4) / 10, y2);
          c.stroke();
        }
        tubo(c, [[tx + tw / 2, y2 + 6], [X0 + W * 0.995, y2 + 6]], lt[2], 5, f * 1.5,
             Math.round(2 + (lt[3] === 'GOV leve' ? r.gov * 0.45 : r.gov * 0.55) / 3), 2.2, lt[2]);
        c.fillStyle = lt[2]; c.font = fonte(10.5, '700'); c.textAlign = 'right'; c.textBaseline = 'bottom';
        c.fillText(lt[3], X0 + W * 0.995, y2 + 1);
      });
      c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText('gasóleo de vácuo: ' + sg(r.gov, 3) + ' % do cru', X0 + W * 0.995, Y0 + H * 0.56 + 12);

      /* bolhas de vapor subindo (mais vácuo → maiores e mais rápidas) */
      var nb = Math.round(10 + r.gov);
      var escB = Math.max(1.5, Math.min(4, 2 * Math.log10(760 / r.pHC)));
      c.save(); casco(); c.clip();
      for (k = 0; k < nb; k++) {
        var s = (f * (1 + escB / 3) + k * 0.618034) % 1;
        var yb = yFz - s * (yFz - tTop - H * 0.05);
        var h = Math.sin(k * 12.9898) * 43758.5453, xb = tx + ((h - Math.floor(h)) - 0.5) * tw * 0.8;
        c.fillStyle = 'rgba(240,170,80,0.75)';
        c.beginPath(); c.arc(xb, yb, escB * (0.6 + s * 0.5), 0, TAU); c.fill();
      }
      c.restore();

      /* carga: resíduo atmosférico vindo do forno de vácuo */
      var fxv = X0 + W * 0.06, fyv = Y0 + H * 0.62, fwv = W * 0.12, fhv = H * 0.28;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.fillRect(fxv, fyv, fwv, fhv); c.strokeRect(fxv, fyv, fwv, fhv);
      var intens = Math.max(0.15, Math.min(1, (p.tForno - 340) / 80));
      for (k = 0; k < 4; k++) {
        var bq = fxv + fwv * (0.18 + k * 0.22);
        var hq = fhv * 0.35 * intens * (0.75 + 0.25 * Math.sin(f * 50 + k));
        var gq = c.createLinearGradient(bq, fyv + fhv, bq, fyv + fhv - hq);
        gq.addColorStop(0, 'rgba(255,200,40,0.95)'); gq.addColorStop(1, 'rgba(220,40,20,0)');
        c.fillStyle = gq;
        c.beginPath(); c.moveTo(bq - 6, fyv + fhv - 3);
        c.quadraticCurveTo(bq, fyv + fhv - hq * 1.2, bq + 6, fyv + fhv - 3); c.fill();
      }
      c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('Forno de vácuo', fxv + fwv / 2, fyv + fhv + 4);
      c.font = fonte(10); c.fillStyle = faint;
      c.fillText(sg(p.tForno, 3) + ' °C', fxv + fwv / 2, fyv + fhv + 18);
      tubo(c, [[fxv + fwv, fyv + 12], [tx - tw / 2 - 10, fyv + 12], [tx - tw / 2 - 10, yFz], [tx - tw / 2, yFz]],
           'rgb(110,70,25)', 9, f * 2, 8, 2.8, 'rgb(240,150,60)');

      /* resíduo de vácuo */
      c.fillStyle = 'rgba(40,25,10,0.85)';
      c.fillRect(tx - tw * 0.25, tBot - H * 0.05, tw * 0.5, H * 0.05);
      tubo(c, [[tx, tBot], [tx, Y0 + H * 0.985], [X0 + W * 0.995, Y0 + H * 0.985]],
           'rgb(40,25,10)', 7, f * 0.6, 4, 2.6, 'rgb(20,10,5)');
      c.fillStyle = cor; c.font = fonte(10.5, '700'); c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.fillText('Resíduo de vácuo ' + sg(r.rv, 3) + ' %', X0 + W * 0.995, Y0 + H * 0.985 - 6);

      /* ejetores a vapor no topo */
      var ex = tx, ey = Y0 + H * 0.08;
      tubo(c, [[tx, tTop], [tx, ey + 8], [X0 + W * 0.60, ey + 8]], 'rgb(200,200,210)', 5, -f * 3, 5, 1.8, 'rgb(150,160,180)');
      for (k = 0; k < 2; k++) {
        var ejx = X0 + W * (0.60 + k * 0.12);
        c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(ejx, ey + 2); c.lineTo(ejx + W * 0.03, ey + 5); c.lineTo(ejx + W * 0.06, ey);
        c.lineTo(ejx + W * 0.08, ey); c.lineTo(ejx + W * 0.08, ey + 16); c.lineTo(ejx + W * 0.06, ey + 16);
        c.lineTo(ejx + W * 0.03, ey + 11); c.lineTo(ejx, ey + 14); c.closePath();
        c.fill(); c.stroke();
        /* jato de vapor motriz */
        for (var j = 0; j < 5; j++) {
          var sj = (f * 6 + j / 5 + k * 0.3) % 1;
          c.fillStyle = 'rgba(160,190,230,' + (0.9 - sj * 0.8) + ')';
          c.beginPath(); c.arc(ejx + sj * W * 0.08, ey + 8 + Math.sin(j * 3) * 2, 1.8, 0, TAU); c.fill();
        }
        tubo(c, [[ejx + W * 0.04, ey - 12], [ejx + W * 0.04, ey + 2]], 'rgb(160,190,230)', 3, f * 4, 2, 1.6, 'rgb(160,190,230)');
      }
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillText('ejetores a vapor (2 estágios)', X0 + W * 0.58, ey + 22);

      /* manômetro de vácuo */
      var mx = X0 + W * 0.13, my = Y0 + H * 0.24, mr = Math.min(W, H) * 0.10;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2;
      c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.stroke();
      var ang0 = Math.PI * 0.75, ang1 = Math.PI * 2.25;
      c.strokeStyle = faint; c.lineWidth = 1;
      [1, 10, 100, 760].forEach(function (pv) {
        var t = Math.log10(pv) / Math.log10(760);
        var an = ang0 + t * (ang1 - ang0);
        c.beginPath();
        c.moveTo(mx + Math.cos(an) * mr * 0.78, my + Math.sin(an) * mr * 0.78);
        c.lineTo(mx + Math.cos(an) * mr * 0.95, my + Math.sin(an) * mr * 0.95); c.stroke();
        c.fillStyle = faint; c.font = fonte(8); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(pv, mx + Math.cos(an) * mr * 0.60, my + Math.sin(an) * mr * 0.60);
      });
      var tp = Math.log10(Math.max(1, p.pFz)) / Math.log10(760);
      var anp = ang0 + tp * (ang1 - ang0) + Math.sin(f * 40) * 0.01;
      c.strokeStyle = Plot.serie(6); c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(mx, my);
      c.lineTo(mx + Math.cos(anp) * mr * 0.85, my + Math.sin(anp) * mr * 0.85); c.stroke();
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(sg(p.pFz, 3) + ' mmHg abs', mx, my + mr + 6);
      c.font = fonte(9); c.fillStyle = faint;
      c.fillText('(1 atm = 760 mmHg)', mx, my + mr + 21);

      /* comparação central */
      var cx = X0 + W * 0.56, cy = Y0 + H * 0.17;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700');
      c.fillText('O que o vácuo compra', cx, cy);
      c.font = fonte(11);
      c.fillText('Na zona de flash: ' + sg(r.tFz, 3) + ' °C', cx, cy + 20);
      c.fillStyle = Plot.serie(6);
      c.fillText('A 1 atm seria preciso: ' + sg(r.tCorte, 3) + ' °C', cx, cy + 37);
      c.fillStyle = faint; c.font = fonte(10);
      c.fillText('acima do limite de craqueamento', cx, cy + 53);
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('vac');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.fase = (A.fase + dt * 0.25) % 1;
      desenha();
    });

    Sim.build('#sim-vacuo', {
      titulo: 'Destilação a vácuo — ferver o gasóleo sem craquear o resíduo',
      descricao: 'O resíduo atmosférico ainda tem 40 a 60 % de gasóleo, mas para destilá-lo a 1 atm seria preciso passar de 500 °C — e ele craquearia antes. Baixando a pressão para 10–60 mmHg, o mesmo corte ferve abaixo de 420 °C.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Vácuo típico', desc: '25 mmHg na zona de flash', valores: { api: 33, pFz: 25, tForno: 400, vapor: 0.3, animar: true } },
        { nome: '2 · Vácuo profundo', desc: 'Operação seca, 8 mmHg', valores: { api: 33, pFz: 8, tForno: 400, vapor: 0.0, animar: true } },
        { nome: '3 · Ejetor com falha', desc: 'Pressão sobe para 80 mmHg', valores: { api: 33, pFz: 80, tForno: 400, vapor: 0.3, animar: true } },
        { nome: '4 · Mais vapor, menos fogo', desc: 'Vapor de retificação alto e forno a 385 °C', valores: { api: 33, pFz: 25, tForno: 385, vapor: 0.8, animar: true } },
        { nome: '5 · Petróleo pesado', desc: 'Muito resíduo para recuperar', valores: { api: 19.6, pFz: 25, tForno: 400, vapor: 0.3, animar: true } }
      ],
      controles: [
        { id: 'api', label: 'Grau API do cru de origem', min: 15, max: 45, step: 0.1, valor: 33, unidade: '°API' },
        { id: 'pFz', label: 'Pressão absoluta na zona de flash', min: 3, max: 150, step: 1, valor: 25, unidade: 'mmHg' },
        { id: 'tForno', label: 'Temperatura de saída do forno de vácuo', min: 360, max: 430, step: 1, valor: 400, unidade: '°C' },
        { id: 'vapor', label: 'Vapor de retificação (efeito na pressão parcial)', min: 0, max: 1, step: 0.05, valor: 0.3, unidade: '',
          desc: '0 = operação seca · 1 = reduz a pressão parcial à metade' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'vac', axes: false, height: 420, grid: false, legend: false },
        { id: 'pv', titulo: 'Temperatura de ebulição x pressão (Maxwell-Bonnell)', xlabel: 'Pressão absoluta (mmHg)',
          ylabel: 'Temperatura de ebulição (°C)', aspect: 0.48, xlog: true, legendPos: 'topleft' },
        { id: 'pevv', titulo: 'Onde o vácuo corta a PEV', xlabel: '% volume do cru', ylabel: 'Temperatura PEV (°C)',
          aspect: 0.40, legendPos: 'topleft' }
      ],
      saidas: [
        { id: 'pHC', label: 'Pressão parcial dos HC' },
        { id: 'aet', label: 'Temperatura atm. equivalente' },
        { id: 'corte', label: 'Corte GOV / resíduo' },
        { id: 'gov', label: 'Gasóleo de vácuo' },
        { id: 'rv', label: 'Resíduo de vácuo' },
        { id: 'rec', label: 'Recuperado do RAT' }
      ],
      formulas: [
        { g: 'Pressão de vapor de frações de petróleo' },
        { tex: 'X = \\frac{T_b/T - 0{,}0002867\\,T_b}{748{,}1 - 0{,}2145\\,T_b}', d: 'T e T_b em °R', destaque: true },
        { tex: '\\log_{10} P = \\frac{2663{,}129X - 5{,}994296}{95{,}76X - 0{,}972546}', d: 'para X ≤ 0,0022 (P em mmHg)' },
        { tex: '\\log_{10} P = \\frac{3000{,}538X - 6{,}761560}{43X - 0{,}987672}', d: 'para X > 0,0022' },
        { g: 'Clausius-Clapeyron (o porquê)' },
        { tex: '\\ln\\frac{P_2}{P_1} = -\\frac{\\Delta H_v}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)', d: 'baixar P baixa T de ebulição', destaque: true },
        { g: 'Balanço' },
        { tex: 'GOV = x_{PEV}(T_{corte}) - x_{PEV}(T_{RAT})' },
        { tex: 'RV = 100 - x_{PEV}(T_{corte})' },
        { tex: 'p_{HC} = P\\,(1 - y_{vapor})', d: 'vapor de retificação reduz a pressão parcial' }
      ],
      passos: [],
      nota: 'Vácuo produzido por ejetores a vapor com condensadores barométricos. As temperaturas de ebulição usam Maxwell-Bonnell (fator de caracterização 12); a vaporização de equilíbrio na zona de flash é aproximada com 15 °C de correção sobre a AET.',
      calcular: function (p, ctx) {
        var r = PET.vacuo(Object.assign({ tRat: 370 }, p));
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var g = ctx.plot('pv').clear();
        var Ps = [];
        for (var e = 0; e <= Math.log10(760) + 1e-9; e += 0.04) Ps.push(e);
        Ps.push(Math.log10(760));
        [[350, 3], [450, 2], [565, 6], [650, 7]].forEach(function (cc) {
          g.line(Ps, Ps.map(function (lp) { return PET.tEbulicao(cc[0], Math.pow(10, lp)); }),
                 { color: Plot.serie(cc[1]), width: 2.2, label: 'corte PEV ' + cc[0] + ' °C' });
        });
        g.hline(400, { color: Plot.serie(6), width: 1.4, text: 'limite de craqueamento ~400 °C' });
        g.vline(Math.log10(r.pHC), { color: Plot.serie(0), width: 1.4, text: 'p_HC = ' + sg(r.pHC, 3) + ' mmHg' });
        g.marker(Math.log10(r.pHC), r.tFz, 'zona de flash', { color: Plot.serie(0), r: 5.5 });
        g.setLimits([0, Math.log10(760)], [100, 700]);
        g.draw();

        var gp = ctx.plot('pevv').clear();
        var xs = [], ys = [];
        for (var T = -40; T <= 700; T += 5) { xs.push(r.pev.x(T)); ys.push(T); }
        var xa = [], ya = [], xb = [], yb = [];
        for (T = 370; T <= r.tCorte; T += 3) { xa.push(r.pev.x(T)); ya.push(T); }
        for (T = r.tCorte; T <= 700; T += 5) { xb.push(r.pev.x(T)); yb.push(T); }
        if (xa.length > 1) gp.area(xa, ya, { color: corCorte(6), alpha: 0.35, stroke: false, base: -40 });
        if (xb.length > 1) gp.area(xb, yb, { color: corCorte(7), alpha: 0.35, stroke: false, base: -40 });
        gp.line(xs, ys, { color: Plot.cssVar('--text', '#222'), width: 2.4, label: 'PEV' });
        gp.hline(370, { color: Plot.serie(4), width: 1.2, text: 'fim do diesel / RAT 370 °C' });
        gp.hline(r.tCorte, { color: Plot.serie(6), width: 1.2, text: 'corte do vácuo ' + sg(r.tCorte, 3) + ' °C' });
        gp.setLimits([0, 100], [-40, 700]);
        gp.draw();

        ctx.setPassos([
          { t: '① Pressão parcial dos hidrocarbonetos',
            tex: 'p_{HC} = P\\,(1 - 0{,}5\\,f_{vapor})',
            texSub: 'p_{HC} = ' + nt(p.pFz) + '\\times(1 - 0{,}5\\times' + nt(p.vapor) + ') = ' + nt(r.pHC, 3) + '\\ \\mathrm{mmHg}',
            obs: 'Há dois jeitos de baixar a pressão que o óleo “sente”: tirar gás com os ejetores (vácuo '
              + 'mecânico) ou diluir com vapor d’água (vácuo parcial). Operação “seca” dispensa o vapor '
              + 'e economiza água ácida, mas exige ejetores maiores.' },
          { t: '② Temperatura atmosférica equivalente',
            tex: 'T_{AET} = f_{MB}(T_{flash},\\ p_{HC})',
            texSub: 'T_{flash} = ' + nt(p.tForno) + ' - 10 = ' + nt(r.tFz, 3) + '\\,{}^\\circ C \\text{ a } '
              + nt(r.pHC, 3) + '\\ \\mathrm{mmHg} \\;\\Rightarrow\\; T_{AET} = ' + nt(r.aet, 4) + '\\,{}^\\circ C',
            obs: 'Sob ' + sg(r.pHC, 3) + ' mmHg, o que ferve a ' + sg(r.tFz, 3) + ' °C é o mesmo material '
              + 'que, a 1 atm, só ferveria a ' + sg(r.aet, 3) + ' °C — são ' + sg(r.aet - r.tFz, 3)
              + ' °C de “ganho” sem aquecer nada a mais.' },
          { t: '③ Corte e rendimento de gasóleo',
            tex: 'GOV = x(T_{corte}) - x(370), \\quad T_{corte} = T_{AET} + 15',
            texSub: 'GOV = ' + nt(r.pev.x(r.tCorte), 3) + ' - ' + nt(r.pev.x(370), 3) + ' = ' + nt(r.gov, 3)
              + '\\ \\%\\ \\text{do cru} \\qquad RV = ' + nt(r.rv, 3) + '\\ \\%',
            obs: 'O gasóleo de vácuo é a carga do FCC e do hidrocraqueamento: vale muito mais que o '
              + 'resíduo. Por isso cada mmHg ganho no topo da torre de vácuo tem valor econômico '
              + 'direto, e a manutenção dos ejetores é tratada como crítica.' },
          { t: '④ O limite: por que não baixar a pressão até zero',
            tex: 'V_{vapor} \\propto \\frac{\\dot n\\,R\\,T}{P}',
            texSub: '\\text{a } ' + nt(p.pFz) + '\\ \\mathrm{mmHg\\ o\\ vapor\\ ocupa\\ } \\frac{760}{' + nt(p.pFz)
              + '} = ' + nt(760 / p.pFz, 3) + '\\times \\text{ o volume a 1 atm}',
            obs: 'Com a mesma vazão mássica, o volume de vapor cresce na razão inversa da pressão. É '
              + 'por isso que a torre de vácuo tem diâmetro enorme e usa recheio estruturado (baixa '
              + 'perda de carga) em vez de pratos. Abaixo de uns 5 mmHg, o custo de ejetor e o '
              + 'diâmetro deixam de compensar o gasóleo extra.' }
        ]);

        return {
          pHC: { v: r.pHC, u: 'mmHg' },
          aet: { v: r.aet, u: '°C' },
          corte: { v: r.tCorte, u: '°C PEV' },
          gov: { v: r.gov, u: '% do cru', classe: 'destaque' },
          rv: { v: r.rv, u: '% do cru' },
          rec: { v: r.recuperado, u: '% do RAT' }
        };
      }
    });
  })();

  /* ==========================================================================
     4. FCC — craqueamento catalítico fluido
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-fcc')) return;
    var A = { ctx: null, p: null, r: null, fase: 0, rel: relogio(), on: true, part: null };

    /* circuito do catalisador: riser ↑ → vaso separador → retificadora ↓ →
       stand-pipe gasto → regenerador → stand-pipe regenerado → base do riser */
    function circuito(W, H, X0, Y0) {
      var rx = X0 + W * 0.30, rgx = X0 + W * 0.62;
      return {
        rx: rx, rgx: rgx,
        vaso: { x: rx + W * 0.08, y: Y0 + H * 0.10, w: W * 0.16, h: H * 0.30 },
        reg: { x: rgx, y: Y0 + H * 0.46, w: W * 0.20, h: H * 0.36 },
        pts: [
          [rx, Y0 + H * 0.92], [rx, Y0 + H * 0.14],               /* riser */
          [rx + W * 0.16, Y0 + H * 0.14],                         /* topo do vaso */
          [rx + W * 0.16, Y0 + H * 0.52],                         /* retificadora */
          [rgx + W * 0.04, Y0 + H * 0.60],                        /* stand-pipe gasto */
          [rgx + W * 0.10, Y0 + H * 0.74],                        /* leito do regenerador */
          [rgx + W * 0.06, Y0 + H * 0.90],
          [rx + W * 0.03, Y0 + H * 0.96],                         /* stand-pipe regenerado */
          [rx, Y0 + H * 0.92]
        ]
      };
    }

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, f = A.fase, k;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');
      var C = circuito(W, H, X0, Y0);

      /* regenerador: brilho proporcional à temperatura */
      var g = C.reg;
      var calor = Math.max(0, Math.min(1, (r.tReg - 620) / 180));
      var grd = c.createLinearGradient(0, g.y + g.h, 0, g.y);
      grd.addColorStop(0, 'rgba(255,' + Math.round(170 - 110 * calor) + ',40,' + (0.35 + 0.4 * calor) + ')');
      grd.addColorStop(1, 'rgba(255,220,120,0.10)');
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2.2;
      c.fillRect(g.x, g.y, g.w, g.h);
      c.fillStyle = grd; c.fillRect(g.x, g.y + g.h * 0.35, g.w, g.h * 0.65);
      c.strokeRect(g.x, g.y, g.w, g.h);
      /* bolhas de ar no leito fluidizado */
      for (k = 0; k < 22; k++) {
        var sb = (f * 3 + k * 0.618) % 1;
        c.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - sb)) + ')';
        c.beginPath();
        c.arc(g.x + g.w * (0.1 + ((k * 41) % 80) / 100), g.y + g.h * (0.95 - sb * 0.58), 2 + sb * 3, 0, TAU);
        c.fill();
      }
      /* ar entrando */
      tubo(c, [[g.x + g.w * 0.5, Y0 + H * 0.995], [g.x + g.w * 0.5, g.y + g.h]], 'rgb(170,200,235)', 5, -f * 3, 3, 2, 'rgb(170,200,235)');
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('ar', g.x + g.w * 0.5 + 6, Y0 + H * 0.995);
      /* gás de combustão */
      tubo(c, [[g.x + g.w * 0.5, g.y], [g.x + g.w * 0.5, Y0 + H * 0.30], [X0 + W * 0.97, Y0 + H * 0.30]],
           'rgb(150,150,150)', 5, f * 2, 4, 2, 'rgb(120,120,120)');
      c.fillStyle = faint; c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.fillText('gás de combustão → caldeira de CO', X0 + W * 0.97, Y0 + H * 0.30 - 5);
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText('Regenerador', g.x + g.w / 2, g.y + 4);
      c.font = fonte(12, '700'); c.fillStyle = corTemp(r.tReg, 600, 800);
      c.fillText(sg(r.tReg, 3) + ' °C', g.x + g.w / 2, g.y + 20);

      /* vaso separador + ciclones */
      var v = C.vaso;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2.2;
      c.fillRect(v.x, v.y, v.w, v.h); c.strokeRect(v.x, v.y, v.w, v.h);
      for (k = 0; k < 2; k++) {
        var cyx = v.x + v.w * (0.35 + k * 0.35), cyy = v.y + v.h * 0.18;
        c.strokeStyle = cor; c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(cyx - 8, cyy); c.lineTo(cyx + 8, cyy); c.lineTo(cyx + 8, cyy + 16);
        c.lineTo(cyx + 2, cyy + 34); c.lineTo(cyx - 2, cyy + 34); c.lineTo(cyx - 8, cyy + 16); c.closePath();
        c.stroke();
        c.strokeStyle = faint;
        c.beginPath();
        c.arc(cyx, cyy + 10, 5, f * 40 + k, f * 40 + k + 4); c.stroke();
      }
      /* retificadora */
      c.fillStyle = elev; c.strokeStyle = cor;
      c.fillRect(v.x + v.w * 0.35, v.y + v.h, v.w * 0.30, H * 0.12);
      c.strokeRect(v.x + v.w * 0.35, v.y + v.h, v.w * 0.30, H * 0.12);
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('Vaso separador', v.x + v.w / 2, v.y + v.h - 6);
      c.font = fonte(9); c.fillStyle = faint; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('retificadora (vapor)', v.x + v.w * 0.70, v.y + v.h + H * 0.06);

      /* efluente do reator → fracionadora */
      tubo(c, [[v.x + v.w / 2, v.y], [v.x + v.w / 2, Y0 + H * 0.04], [X0 + W * 0.97, Y0 + H * 0.04]],
           corCorte(2), 6, f * 2.5, 6, 2.2, corCorte(2));
      c.fillStyle = corCorte(2); c.font = fonte(10, '700'); c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText('produtos craqueados → fracionadora', X0 + W * 0.97, Y0 + H * 0.04 + 6);

      /* riser */
      c.strokeStyle = cor; c.lineWidth = 2;
      c.strokeRect(C.rx - 7, Y0 + H * 0.14, 14, H * 0.80);
      c.fillStyle = corTemp(p.tRx, 480, 560); c.globalAlpha = 0.25;
      c.fillRect(C.rx - 6, Y0 + H * 0.14, 12, H * 0.80); c.globalAlpha = 1;
      c.fillStyle = cor; c.font = fonte(11, '700'); c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText('Riser', C.rx - 12, Y0 + H * 0.40);
      c.font = fonte(10); c.fillStyle = corTemp(p.tRx, 480, 560);
      c.fillText(sg(p.tRx, 3) + ' °C no topo', C.rx - 12, Y0 + H * 0.40 + 14);
      c.fillStyle = faint;
      c.fillText(sg(p.tempo, 2) + ' s de contato', C.rx - 12, Y0 + H * 0.40 + 28);
      /* carga injetada */
      tubo(c, [[X0 + 4, Y0 + H * 0.82], [C.rx - 7, Y0 + H * 0.82]], 'rgb(120,80,30)', 5, f * 2, 4, 2.2, 'rgb(120,80,30)');
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('gasóleo a ' + sg(p.tCarga, 3) + ' °C', X0 + 4, Y0 + H * 0.82 - 5);
      /* spray da carga */
      for (k = 0; k < 6; k++) {
        var ss = (f * 8 + k / 6) % 1;
        c.fillStyle = 'rgba(150,100,40,' + (0.8 - ss * 0.7) + ')';
        c.beginPath(); c.arc(C.rx + (k - 2.5) * 1.5, Y0 + H * 0.82 - ss * 25, 1.8, 0, TAU); c.fill();
      }

      /* stand-pipes */
      c.strokeStyle = Plot.cssVar('--border-strong', '#999'); c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(C.pts[3][0], C.pts[3][1]); c.lineTo(C.pts[4][0], C.pts[4][1]); c.stroke();
      c.beginPath(); c.moveTo(C.pts[6][0], C.pts[6][1]); c.lineTo(C.pts[7][0], C.pts[7][1]); c.lineTo(C.pts[8][0], C.pts[8][1]); c.stroke();
      c.lineCap = 'butt';
      c.fillStyle = faint; c.font = fonte(9); c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.fillText('catalisador gasto (com coque)', (C.pts[3][0] + C.pts[4][0]) / 2 + 10, (C.pts[3][1] + C.pts[4][1]) / 2 - 8);
      c.textBaseline = 'top';
      c.fillText('catalisador regenerado', (C.pts[6][0] + C.pts[7][0]) / 2, Y0 + H * 0.965);

      /* partículas de catalisador no circuito: velocidade ∝ circulação (C/O) */
      var nP = 70;
      for (k = 0; k < nP; k++) {
        var s = (f * (0.6 + r.co / 12) + k / nP) % 1;
        var pt = naPolilinha(C.pts, s);
        /* cor: clara regenerada, escurece ao passar pelo riser, clareia no regenerador */
        var cq;
        if (s < 0.30) cq = 0.15 + 0.85 * (s / 0.30);            /* riser: coque depositando */
        else if (s < 0.55) cq = 1;
        else if (s < 0.80) cq = 1 - (s - 0.55) / 0.25;           /* queima */
        else cq = 0;
        var tom = Math.round(215 - 170 * cq);
        c.fillStyle = 'rgb(' + tom + ',' + Math.round(tom * 0.92) + ',' + Math.round(tom * 0.75) + ')';
        var jit = s < 0.30 ? Math.sin(k * 7.1 + f * 40) * 4 : 0;
        c.beginPath(); c.arc(pt[0] + jit, pt[1], 2.4, 0, TAU); c.fill();
      }

      /* painel */
      var lx = X0 + W * 0.60, ly = Y0 + H * 0.10;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(11.5, '700');
      c.fillText('Balanço térmico', lx, ly);
      c.font = fonte(10.5);
      c.fillText('C/O = ' + sg(r.co, 3) + ' kg cat./kg carga', lx, ly + 17);
      c.fillText('coque = ' + sg(100 * r.coque, 3) + ' % da carga', lx, ly + 32);
      c.fillText('conversão = ' + sg(100 * r.X, 3) + ' %', lx, ly + 47);
      if (r.avisos.indexOf('regQuente') >= 0) {
        c.fillStyle = Plot.serie(6); c.font = fonte(10.5, '700');
        c.fillText('⚠ regenerador > 760 °C:', lx, ly + 64);
        c.fillText('   exige resfriador de catalisador', lx, ly + 78);
      } else if (r.avisos.indexOf('sobrecraqueamento') >= 0) {
        c.fillStyle = Plot.serie(3); c.font = fonte(10.5, '700');
        c.fillText('⚠ sobrecraqueamento:', lx, ly + 64);
        c.fillText('   gasolina virando GLP e gás', lx, ly + 78);
      }
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('fcc');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.fase = (A.fase + dt * 0.12) % 1;
      desenha();
    });

    Sim.build('#sim-fcc', {
      titulo: 'FCC — craqueamento catalítico em leito fluidizado',
      descricao: 'O catalisador circula entre o riser, onde craqueia o gasóleo e se cobre de coque, e o regenerador, onde o coque é queimado. A unidade é termicamente autossuficiente: o calor da queima do coque, carregado pelo próprio catalisador, é exatamente o que o riser consome — então a temperatura do regenerador não é escolhida, ela resulta.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Operação de gasolina', desc: 'Condição de referência', valores: { tRx: 525, tCarga: 220, tempo: 3, mat: 68, ccr: 0.5, animar: true } },
        { nome: '2 · Máximo GLP (propeno)', desc: 'Riser quente e catalisador ativo', valores: { tRx: 545, tCarga: 220, tempo: 3, mat: 74, ccr: 0.5, animar: true } },
        { nome: '3 · Máximo destilado (LCO)', desc: 'Riser frio, menos conversão', valores: { tRx: 495, tCarga: 250, tempo: 2, mat: 62, ccr: 0.5, animar: true } },
        { nome: '4 · Carga com resíduo (RFCC)', desc: 'Mais coque, regenerador dispara', valores: { tRx: 525, tCarga: 220, tempo: 3, mat: 68, ccr: 4, animar: true } },
        { nome: '5 · Carga mais quente', desc: 'Menos calor pedido ao catalisador', valores: { tRx: 525, tCarga: 330, tempo: 3, mat: 68, ccr: 0.5, animar: true } },
        { nome: '6 · Catalisador desativado', desc: 'MAT baixo após contaminação por metais', valores: { tRx: 525, tCarga: 220, tempo: 3, mat: 58, ccr: 0.5, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Riser' },
        { id: 'tRx', label: 'Temperatura no topo do riser', min: 490, max: 560, step: 1, valor: 525, unidade: '°C' },
        { id: 'tCarga', label: 'Temperatura da carga', min: 150, max: 350, step: 5, valor: 220, unidade: '°C' },
        { id: 'tempo', label: 'Tempo de contato', min: 1, max: 6, step: 0.1, valor: 3, unidade: 's' },
        { tipo: 'titulo', label: 'Catalisador e carga' },
        { id: 'mat', label: 'Atividade do catalisador (MAT)', min: 55, max: 78, step: 1, valor: 68, unidade: '%',
          desc: 'Micro-activity test, ASTM D3907' },
        { id: 'ccr', label: 'Resíduo de carbono da carga (Conradson)', min: 0, max: 6, step: 0.1, valor: 0.5, unidade: '% massa',
          desc: 'Gasóleo de vácuo < 1 · com resíduo 3 a 6' },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'fcc', axes: false, height: 460, grid: false, legend: false },
        { id: 'rend', titulo: 'Rendimentos contra a conversão (a curva da gasolina)', xlabel: 'Conversão (% massa)',
          ylabel: 'Rendimento (% massa)', aspect: 0.48, legendPos: 'topleft' },
        { id: 'prodf', titulo: 'Produtos nesta condição', xlabel: '', ylabel: '% massa da carga', aspect: 0.34, legend: false }
      ],
      saidas: [
        { id: 'tReg', label: 'T do regenerador (resulta)' },
        { id: 'co', label: 'Relação catalisador/óleo' },
        { id: 'X', label: 'Conversão' },
        { id: 'gasol', label: 'Gasolina' },
        { id: 'glp', label: 'GLP' },
        { id: 'coque', label: 'Coque' },
        { id: 'lco', label: 'LCO (óleo leve de reciclo)' },
        { id: 'oc', label: 'Óleo clarificado' }
      ],
      formulas: [
        { g: 'Balanço térmico — o coração do FCC' },
        { tex: '\\frac{C}{O} = \\frac{Q_{riser}}{c_{p,cat}\\,(T_{reg} - T_{rx})}', d: 'o catalisador é o fluido de transporte de calor', destaque: true },
        { tex: 'Q_{riser} = c_{p,l}(T_v - T_{carga}) + \\lambda + c_{p,v}(T_{rx} - T_v) + \\Delta H_r X', d: 'aquecer, vaporizar, craquear (endotérmico)' },
        { tex: 'y_{coque} = \\frac{Q_{riser} + Q_{perdas}}{\\Delta H_{comb} - m_{ar}\\,c_{p,ar}(T_{reg} - T_{ar})}', d: 'o coque exigido para pagar o calor', destaque: true },
        { tex: 'y_{coque} = \\frac{C}{O}\\times \\Delta coque', d: 'o coque que a cinética produz — os dois têm de ser iguais' },
        { g: 'Cinética (modelo de segunda ordem)' },
        { tex: '\\frac{X}{1-X} = k\\,\\frac{C}{O}\\,\\sqrt{t_c}', d: 'conversão cresce com a circulação e o tempo', destaque: true },
        { tex: 'k = k_0\\,e^{-E/RT}\\,f(MAT)' },
        { g: 'Rendimentos' },
        { tex: 'y_{gasolina} = 1{,}30X - 0{,}86X^2', d: 'passa por um máximo: além dele, a gasolina craqueia de novo' },
        { tex: 'X = 100 - LCO - \\text{óleo clarificado}', d: 'definição de conversão' }
      ],
      passos: [],
      nota: 'Modelo de conversor em equilíbrio térmico: a temperatura do regenerador é resolvida por bissecção igualando o coque que a cinética deposita ao coque que o balanço exige. Correlações de rendimento calibradas para gasóleo de vácuo típico com catalisador zeolítico USY; valores de ordem de grandeza.',
      calcular: function (p, ctx) {
        var r = PET.fcc(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var Xs = Plot.linspace(0.40, 0.92, 60);
        var g = ctx.plot('rend').clear();
        g.line(Xs.map(function (x) { return 100 * x; }), Xs.map(function (x) { return 100 * (1.30 * x - 0.86 * x * x); }),
               { color: corCorte(1), width: 2.8, label: 'gasolina' });
        g.line(Xs.map(function (x) { return 100 * x; }), Xs.map(function (x) {
          return 100 * Math.max(0, x - (1.30 * x - 0.86 * x * x) - r.coque - r.gasSeco);
        }), { color: corCorte(0), width: 2.2, label: 'GLP (coque e gás desta condição)' });
        g.line(Xs.map(function (x) { return 100 * x; }), Xs.map(function (x) { return 100 * (1 - x) * 0.6; }),
               { color: corCorte(4), width: 2.2, label: 'LCO' });
        g.vline(100 * 1.30 / (2 * 0.86), { color: Plot.serie(6), width: 1.3, text: 'máximo de gasolina' });
        g.marker(100 * r.X, 100 * r.gasol, 'operação', { color: corCorte(1), r: 5.5 });
        g.draw();

        var nomes = ['Gás seco', 'GLP', 'Gasolina', 'LCO', 'Óleo clar.', 'Coque'];
        var vals = [r.gasSeco, r.glp, r.gasol, r.lco, r.oc, r.coque].map(function (v) { return 100 * v; });
        var cores = [corCorte(6), corCorte(0), corCorte(1), corCorte(4), corCorte(7), 'rgb(60,60,60)'];
        var gp = ctx.plot('prodf').clear();
        gp.o.xcat = nomes.map(function (n, j) { return { v: j, label: n }; });
        vals.forEach(function (v, j) {
          gp.bars([j], [v], { color: cores[j], barw: 0.7 });
          gp.text(j, v, sg(v, 3), { align: 'center', dy: -3, size: 10.5, weight: '600' });
        });
        gp.setLimits([-0.6, 5.6], [0, Math.max.apply(null, vals) * 1.2]);
        gp.draw();

        var F = PET.FCC;
        var tv = Math.max(p.tCarga, F.tVap);
        ctx.setPassos([
          { t: '① Calor que o riser pede, por kg de carga',
            tex: 'Q = c_{p,l}(T_v - T_c) + \\lambda + c_{p,v}(T_{rx} - T_v) + \\Delta H_r X',
            texSub: 'Q = 2{,}5(' + nt(tv) + ' - ' + nt(p.tCarga) + ') + 260 + 2{,}6(' + nt(p.tRx) + ' - ' + nt(tv)
              + ') + 550\\times' + nt(r.X, 3) + ' = ' + nt(r.calor, 4) + '\\ \\mathrm{kJ/kg}',
            obs: 'Quase metade vai para vaporizar e aquecer a carga; o resto é o calor de reação — o '
              + 'craqueamento quebra ligações e é endotérmico. Nada disso vem de um forno: vem do '
              + 'catalisador quente que chega do regenerador.' },
          { t: '② O regenerador que fecha o balanço',
            tex: 'y_{coque}^{cinética}(T_{reg}) = y_{coque}^{balanço}(T_{reg})',
            texSub: 'T_{reg} = ' + nt(r.tReg, 4) + '\\,{}^\\circ C \\;\\Rightarrow\\; y_{coque} = ' + nt(100 * r.coque, 3) + '\\ \\%',
            obs: 'Se a carga faz mais coque (mais resíduo de carbono), queima-se mais, o regenerador '
              + 'esquenta, cada kg de catalisador leva mais calor, a circulação necessária cai — e a '
              + 'conversão cai junto. A unidade se reequilibra sozinha, mas num ponto pior. Acima de '
              + '~760 °C o catalisador perde atividade por desaluminação hidrotérmica.' },
          { t: '③ Circulação de catalisador',
            tex: '\\frac{C}{O} = \\frac{Q}{c_{p,cat}(T_{reg} - T_{rx})}',
            texSub: '\\frac{C}{O} = \\frac{' + nt(r.calor, 4) + '}{1{,}10\\times(' + nt(r.tReg, 4) + ' - ' + nt(p.tRx) + ')} = ' + nt(r.co, 3),
            obs: 'Para cada tonelada de gasóleo circulam ' + sg(r.co, 3) + ' toneladas de catalisador — '
              + 'numa unidade de 5 000 m³/d, dezenas de toneladas por minuto de pó fluidizado se '
              + 'movendo como líquido pelos stand-pipes.' },
          { t: '④ Conversão',
            tex: '\\frac{X}{1-X} = k\\,\\frac{C}{O}\\,\\sqrt{t_c}',
            texSub: 'X = ' + nt(100 * r.X, 3) + '\\ \\%',
            obs: 'Mais catalisador por kg de óleo e mais tempo de contato aumentam a conversão, mas '
              + 'com retorno decrescente: a forma X/(1−X) mostra que ir de 80 para 90 % exige mais '
              + 'que o dobro da severidade de ir de 60 para 70 %.' },
          { t: '⑤ Gasolina: existe um máximo',
            tex: '\\frac{d\\,y_g}{dX} = 1{,}30 - 1{,}72X = 0 \\;\\Rightarrow\\; X^* = 75{,}6\\ \\%',
            texSub: 'y_g = 1{,}30\\times' + nt(r.X, 3) + ' - 0{,}86\\times' + nt(r.X, 3) + '^2 = ' + nt(100 * r.gasol, 3) + '\\ \\%',
            obs: r.X > 0.756
              ? 'A operação passou do máximo: a gasolina formada está craqueando de novo em GLP e gás '
                + 'seco. Isso só é bom se o objetivo for propeno para petroquímica.'
              : 'A operação está antes do máximo de gasolina. Subir a severidade ainda aumenta a gasolina, '
                + 'mas cada ponto de conversão a mais rende menos gasolina e mais GLP.' }
        ]);

        return {
          tReg: { v: r.tReg, u: '°C', classe: r.tReg > 760 ? 'alerta' : 'destaque' },
          co: { v: r.co, u: 'kg/kg' },
          X: { v: 100 * r.X, u: '%' },
          gasol: { v: 100 * r.gasol, u: '% massa' },
          glp: { v: 100 * r.glp, u: '% massa' },
          coque: { v: 100 * r.coque, u: '% massa' },
          lco: { v: 100 * r.lco, u: '% massa' },
          oc: { v: 100 * r.oc, u: '% massa' }
        };
      }
    });
  })();

  /* ==========================================================================
     5. Hidrodessulfurização
     ========================================================================== */
  (function () {
    if (!document.getElementById('sim-hds')) return;
    var A = { ctx: null, p: null, r: null, fase: 0, rel: relogio(), on: true };

    function desenhar(c, pl) {
      var a = pl._area, p = A.p, r = A.r;
      if (!p || !r) return;
      var W = a.w, H = a.h, X0 = a.x, Y0 = a.y, f = A.fase, k;
      var cor = Plot.cssVar('--text', '#111');
      var faint = Plot.cssVar('--text-faint', '#888');
      var elev = Plot.cssVar('--bg-elev', '#fff');

      /* reator de leito fixo, fluxo descendente */
      var rx = X0 + W * 0.36, rw = W * 0.14, rTop = Y0 + H * 0.12, rBot = Y0 + H * 0.90;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(rx - rw / 2, rTop + 16);
      c.quadraticCurveTo(rx - rw / 2, rTop, rx, rTop - 4);
      c.quadraticCurveTo(rx + rw / 2, rTop, rx + rw / 2, rTop + 16);
      c.lineTo(rx + rw / 2, rBot - 16);
      c.quadraticCurveTo(rx + rw / 2, rBot, rx, rBot + 4);
      c.quadraticCurveTo(rx - rw / 2, rBot, rx - rw / 2, rBot - 16);
      c.closePath(); c.fill(); c.stroke();

      /* dois leitos com têmpera de H₂ entre eles; cor do leito = teor de S local */
      var leitos = [[0.06, 0.46], [0.54, 0.94]];
      var h = rBot - rTop;
      leitos.forEach(function (lt) {
        var y1 = rTop + h * lt[0], y2 = rTop + h * lt[1];
        var n = 18;
        for (k = 0; k < n; k++) {
          var fr = lt[0] + (lt[1] - lt[0]) * (k + 0.5) / n;
          var fracLeito = (fr - 0.06) / 0.88;
          var sLoc = r.sAt(fracLeito / p.lhsv);
          var t = Math.log10(Math.max(1, sLoc)) / Math.log10(Math.max(10, p.sIn));
          var yel = Math.round(200 * t);
          c.fillStyle = 'rgba(' + (180 + Math.round(60 * t)) + ',' + (150 + Math.round(50 * t)) + ',' + (60 - yel / 5) + ',' + (0.25 + 0.5 * t) + ')';
          c.fillRect(rx - rw / 2 + 2, y1 + (y2 - y1) * k / n, rw - 4, (y2 - y1) / n + 0.5);
        }
        /* pastilhas do catalisador */
        c.fillStyle = 'rgba(60,70,90,0.55)';
        for (k = 0; k < 60; k++) {
          c.beginPath();
          c.arc(rx - rw / 2 + 5 + ((k * 37) % 100) / 100 * (rw - 10),
                y1 + 4 + ((k * 61) % 100) / 100 * (y2 - y1 - 8), 1.6, 0, TAU);
          c.fill();
        }
        c.strokeStyle = cor; c.lineWidth = 1;
        c.beginPath(); c.moveTo(rx - rw / 2, y2); c.lineTo(rx + rw / 2, y2); c.stroke();
      });

      /* moléculas descendo: bolinhas amarelas (S) somem ao longo do leito */
      for (k = 0; k < 40; k++) {
        var s = (f * 1.2 + k * 0.618) % 1;
        var yy = rTop + 10 + s * (h - 20);
        var xx = rx + (((k * 43) % 100) / 100 - 0.5) * rw * 0.8;
        var fl = Math.max(0, Math.min(1, (s - 0.03) / 0.94));
        var sHere = r.sAt(fl / p.lhsv);
        var temS = ((k * 97) % 1000) / 1000 < sHere / p.sIn;
        c.fillStyle = 'rgba(90,70,40,0.7)';
        c.beginPath(); c.arc(xx, yy, 2.6, 0, TAU); c.fill();
        if (temS) {
          c.fillStyle = 'rgb(240,200,20)';
          c.beginPath(); c.arc(xx + 2.5, yy - 1.5, 1.8, 0, TAU); c.fill();
        }
      }

      /* entrada: carga + H₂ */
      tubo(c, [[X0 + 4, Y0 + H * 0.05], [rx, Y0 + H * 0.05], [rx, rTop - 4]], 'rgb(150,110,40)', 6, f * 2, 6, 2.2, 'rgb(150,110,40)');
      c.fillStyle = cor; c.font = fonte(10, '700'); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('carga ' + sg(p.sIn, 3) + ' ppm S + H₂ a ' + sg(p.P, 3) + ' bar', X0 + 4, Y0 + H * 0.05 - 5);
      /* têmpera de H₂ */
      tubo(c, [[X0 + W * 0.12, rTop + h * 0.50], [rx - rw / 2, rTop + h * 0.50]], 'rgb(170,200,235)', 4, f * 3, 3, 1.8, 'rgb(120,160,220)');
      c.fillStyle = faint; c.font = fonte(9.5); c.textAlign = 'left'; c.textBaseline = 'bottom';
      c.fillText('H₂ de têmpera', X0 + W * 0.12, rTop + h * 0.50 - 5);
      /* saída */
      tubo(c, [[rx, rBot + 4], [rx, Y0 + H * 0.97], [X0 + W * 0.60, Y0 + H * 0.97]], 'rgb(210,180,90)', 6, f * 2, 6, 2.2, 'rgb(210,180,90)');

      /* separador de alta pressão e amina */
      var sx = X0 + W * 0.66, sy = Y0 + H * 0.80;
      c.fillStyle = elev; c.strokeStyle = cor; c.lineWidth = 1.8;
      c.beginPath(); c.ellipse(sx, sy, W * 0.06, 16, 0, 0, TAU); c.fill(); c.stroke();
      tubo(c, [[X0 + W * 0.60, Y0 + H * 0.97], [X0 + W * 0.60, sy], [sx - W * 0.06, sy]], 'rgb(210,180,90)', 4, f * 2, 3, 2, 'rgb(210,180,90)');
      tubo(c, [[sx, sy - 16], [sx, Y0 + H * 0.40], [X0 + W * 0.97, Y0 + H * 0.40]], 'rgb(200,200,120)', 4, f * 2, 5, 2, 'rgb(240,200,20)');
      c.fillStyle = cor; c.font = fonte(10, '700'); c.textAlign = 'right'; c.textBaseline = 'bottom';
      c.fillText('H₂ + H₂S → lavagem com amina → enxofre (Claus)', X0 + W * 0.97, Y0 + H * 0.40 - 5);
      tubo(c, [[sx + W * 0.06, sy], [X0 + W * 0.97, sy]], 'rgb(210,180,90)', 5, f * 2, 4, 2.2, 'rgb(210,180,90)');
      c.textBaseline = 'top';
      c.fillStyle = r.s10 ? Plot.serie(2) : (r.s500 ? Plot.serie(3) : Plot.serie(6));
      c.fillText('produto: ' + sg(r.sOut, 3) + ' ppm S', X0 + W * 0.97, sy + 6);
      c.font = fonte(10); c.fillText(r.s10 ? 'atende S-10' : (r.s500 ? 'atende S-500, não S-10' : 'fora de especificação'), X0 + W * 0.97, sy + 21);

      /* reação */
      var lx = X0 + W * 0.58, ly = Y0 + H * 0.06;
      c.textAlign = 'left'; c.textBaseline = 'top';
      c.fillStyle = cor; c.font = fonte(12, '700');
      c.fillText('Reação no catalisador', lx, ly);
      c.font = fonte(11);
      c.fillText('R–S–R′ + 2 H₂  →  R–H + R′–H + H₂S', lx, ly + 20);
      c.fillStyle = faint; c.font = fonte(10);
      c.fillText('exotérmica: ΔT ≈ ' + sg(r.dT, 3) + ' °C no leito', lx, ly + 38);
      c.fillText('consumo de H₂ ≈ ' + sg(r.h2, 3) + ' Nm³ por m³ de carga', lx, ly + 53);
      c.fillText('temperatura ' + sg(p.T, 3) + ' °C · LHSV ' + sg(p.lhsv, 2) + ' h⁻¹', lx, ly + 68);
    }

    function desenha() {
      if (!A.ctx) return;
      var pl = A.ctx.plot('reator');
      pl.clear(); pl.setLimits([0, 1], [0, 1]); pl.custom(desenhar); pl.draw();
    }
    registrar(function () {
      var dt = A.rel.dt();
      if (!A.on || !A.ctx) return;
      A.fase = (A.fase + dt * 0.18) % 1;
      desenha();
    });

    Sim.build('#sim-hds', {
      titulo: 'Hidrodessulfurização — do diesel S-1800 ao S-10',
      descricao: 'O enxofre do diesel sai reagindo com hidrogênio sobre um catalisador de cobalto-molibdênio ou níquel-molibdênio, em alta pressão. Os primeiros 97 % saem com facilidade; os últimos compostos, impedidos estericamente, são os que decidem se o diesel é S-500 ou S-10.',
      controlesLargos: true,
      exemplos: [
        { nome: '1 · Unidade antiga, CoMo', desc: 'Condição dimensionada para S-500', valores: { sIn: 12000, T: 340, P: 60, lhsv: 1.5, cat: 1, carga: 1, animar: true } },
        { nome: '2 · Só esquentar não basta', desc: 'CoMo a 370 °C', valores: { sIn: 12000, T: 370, P: 60, lhsv: 1.5, cat: 1, carga: 1, animar: true } },
        { nome: '3 · Revamp para S-10', desc: 'NiMo, 80 bar, reator maior', valores: { sIn: 12000, T: 360, P: 80, lhsv: 0.8, cat: 1.6, carga: 1, animar: true } },
        { nome: '4 · Incluindo LCO do FCC', desc: 'Carga mais aromática e refratária', valores: { sIn: 12000, T: 360, P: 80, lhsv: 0.8, cat: 1.6, carga: 0.55, animar: true } },
        { nome: '5 · Querosene de aviação', desc: 'Pouco enxofre, fácil de tratar', valores: { sIn: 2500, T: 320, P: 35, lhsv: 3, cat: 1, carga: 1, animar: true } }
      ],
      controles: [
        { tipo: 'titulo', label: 'Carga' },
        { id: 'sIn', label: 'Enxofre na carga', min: 500, max: 20000, step: 100, valor: 12000, unidade: 'ppm' },
        { id: 'carga', tipo: 'select', label: 'Tipo de carga', valor: 1,
          opcoes: [{ v: 1, t: 'Diesel de destilação direta' }, { v: 0.55, t: 'Mistura com LCO de FCC (refratária)' }] },
        { tipo: 'titulo', label: 'Reator' },
        { id: 'T', label: 'Temperatura média do leito', min: 300, max: 400, step: 1, valor: 340, unidade: '°C' },
        { id: 'P', label: 'Pressão parcial de H₂', min: 20, max: 120, step: 1, valor: 60, unidade: 'bar' },
        { id: 'lhsv', label: 'Velocidade espacial (LHSV)', min: 0.3, max: 4, step: 0.05, valor: 1.5, unidade: 'h⁻¹',
          desc: 'vazão volumétrica ÷ volume de catalisador · menor = reator maior' },
        { id: 'cat', tipo: 'select', label: 'Catalisador', valor: 1,
          opcoes: [{ v: 1, t: 'CoMo/Al₂O₃ (atividade 1,0)' }, { v: 1.6, t: 'NiMo/Al₂O₃ (1,6)' }, { v: 2.4, t: 'NiMo de alta atividade (2,4)' }] },
        { tipo: 'separador' },
        { id: 'animar', tipo: 'check', label: 'Animar', valor: true }
      ],
      graficos: [
        { id: 'reator', axes: false, height: 420, grid: false, legend: false },
        { id: 'perfil', titulo: 'Enxofre ao longo do leito', xlabel: 'Posição no leito (fração da altura)',
          ylabel: 'Enxofre (ppm)', aspect: 0.46, ylog: true, legendPos: 'topright' },
        { id: 'mapa', titulo: 'Enxofre no produto x temperatura, para várias LHSV', xlabel: 'Temperatura (°C)',
          ylabel: 'Enxofre no produto (ppm)', aspect: 0.46, ylog: true, legendPos: 'topright' }
      ],
      saidas: [
        { id: 'sOut', label: 'Enxofre no produto' },
        { id: 'rem', label: 'Remoção' },
        { id: 'k', label: 'Constante cinética k' },
        { id: 'h2', label: 'Consumo de H₂' },
        { id: 'dT', label: 'Elevação de temperatura' },
        { id: 'spec', label: 'Especificação' }
      ],
      formulas: [
        { g: 'Cinética de ordem n = 1,5' },
        { tex: '-\\frac{dS}{d\\tau} = k\\,S^{n}', d: 'τ = 1/LHSV: tempo espacial', destaque: true },
        { tex: 'S_{sai} = \\left[S_{entra}^{\\,1-n} + (n-1)\\,\\frac{k}{LHSV}\\right]^{\\frac{1}{1-n}}', d: 'integrada entre entrada e saída', destaque: true },
        { tex: 'k = k_{ref}\\;a_{cat}\\;e^{-\\frac{E_a}{R}\\left(\\frac{1}{T}-\\frac{1}{T_{ref}}\\right)}\\left(\\frac{p_{H_2}}{p_{ref}}\\right)^{0{,}7}', d: 'E_a ≈ 110 kJ/mol' },
        { tex: 'LHSV = \\frac{\\dot V_{carga}}{V_{catalisador}}', d: 'h⁻¹' },
        { g: 'Por que ordem 1,5 e não 1' },
        { tex: 'S = \\sum_i S_i\\,e^{-k_i\\tau}', d: 'soma de muitos compostos de reatividades diferentes: os fáceis somem primeiro' },
        { g: 'Balanços práticos' },
        { tex: 'H_2 \\approx 15\\,\\Delta S_{\\%} + 0{,}9\\,p_{H_2}\\ \\ \\mathrm{Nm^3/m^3}', d: 'dessulfurização + saturação de aromáticos' },
        { tex: '\\Delta T \\approx 0{,}28\\ ^\\circ C\\ \\text{por Nm}^3/\\mathrm{m}^3\\ \\text{de H}_2', d: 'por isso há têmpera entre leitos' },
        { tex: 'S\\text{-}10: \\ S \\leq 10\\ \\mathrm{mg/kg} \\qquad S\\text{-}500: \\ S \\leq 500', d: 'ANP, Resolução 50/2013' }
      ],
      passos: [],
      nota: 'Modelo pseudo-homogêneo de fluxo pistonado, ordem aparente 1,5, calibrado para diesel de destilação direta (1,2 % S → 300 ppm com CoMo a 340 °C, 60 bar, LHSV 1,5). Não inclui desativação do catalisador ao longo da campanha, que obriga a subir a temperatura aos poucos.',
      calcular: function (p, ctx) {
        p.cat = +p.cat; p.carga = +p.carga;
        var r = PET.hds(p);
        A.ctx = ctx; A.p = p; A.r = r; A.on = !!p.animar;
        desenha();

        var fr = Plot.linspace(0, 1, 80);
        var g = ctx.plot('perfil').clear();
        g.line(fr, fr.map(function (x) { return Math.log10(r.sAt(x / p.lhsv)); }), { color: Plot.serie(0), width: 2.8, label: 'S no leito' });
        g.hline(Math.log10(500), { color: Plot.serie(3), width: 1.3, text: 'S-500' });
        g.hline(Math.log10(10), { color: Plot.serie(2), width: 1.3, text: 'S-10' });
        g.setLimits([0, 1], [Math.min(0, Math.log10(Math.max(0.5, r.sOut)) - 0.3), Math.log10(p.sIn) + 0.2]);
        g.draw();

        var Ts = Plot.linspace(300, 400, 60);
        var gm = ctx.plot('mapa').clear();
        [[0.5, 2], [1.0, 0], [1.5, 5], [2.5, 3]].forEach(function (cc) {
          gm.line(Ts, Ts.map(function (T) {
            return Math.log10(Math.max(0.1, PET.hds(Object.assign({}, p, { T: T, lhsv: cc[0] })).sOut));
          }), { color: Plot.serie(cc[1]), width: 2.2, label: 'LHSV ' + cc[0] });
        });
        gm.hline(Math.log10(10), { color: Plot.serie(2), width: 1.3, dash: [4, 3], text: 'S-10' });
        gm.hline(Math.log10(500), { color: Plot.serie(3), width: 1.3, dash: [4, 3], text: 'S-500' });
        gm.marker(p.T, Math.log10(Math.max(0.1, r.sOut)), 'operação', { color: Plot.serie(6), r: 5.5 });
        gm.setLimits([300, 400], [-1, Math.log10(p.sIn) + 0.1]);
        gm.draw();

        var H = PET.HDS;
        ctx.setPassos([
          { t: '① Constante cinética nas condições do reator',
            tex: 'k = k_{ref}\\,a\\,f_c\\,e^{-\\frac{E_a}{R}\\left(\\frac{1}{T}-\\frac{1}{T_{ref}}\\right)}\\left(\\frac{p}{60}\\right)^{0{,}7}',
            texSub: 'k = ' + nt(H.kRef, 4) + '\\times' + nt(p.cat) + '\\times' + nt(p.carga) + '\\times e^{-13231\\left(\\frac{1}{'
              + nt(p.T + 273.15, 4) + '} - \\frac{1}{613{,}15}\\right)}\\times\\left(\\frac{' + nt(p.P) + '}{60}\\right)^{0{,}7} = ' + nt(r.k, 4),
            obs: 'Cada 10 °C a mais multiplicam k por ~1,4; a pressão de H₂ entra com expoente 0,7. '
              + 'Mas temperatura tem teto: acima de ~380 °C o catalisador coqueia depressa e a '
              + 'saturação de aromáticos passa a ser limitada pelo equilíbrio.' },
          { t: '② Integrar a cinética de ordem 1,5 ao longo do leito',
            tex: 'S_{sai} = \\left[S_e^{-0{,}5} + 0{,}5\\,\\frac{k}{LHSV}\\right]^{-2}',
            texSub: 'S_{sai} = \\left[' + nt(p.sIn) + '^{-0{,}5} + 0{,}5\\times\\frac{' + nt(r.k, 4) + '}{' + nt(p.lhsv) + '}\\right]^{-2} = \\left['
              + nt(Math.pow(p.sIn, -0.5), 4) + ' + ' + nt(0.5 * r.k / p.lhsv, 4) + '\\right]^{-2} = ' + nt(r.sOut, 4) + '\\ \\mathrm{ppm}',
            obs: 'Repare no termo S_e^−0,5: com a carga a ' + sg(p.sIn, 3) + ' ppm ele vale só '
              + sg(Math.pow(p.sIn, -0.5), 3) + ' — quase nada. O resultado depende essencialmente de '
              + 'k/LHSV. Por isso o teor de enxofre da carga importa pouco para chegar a S-10; o que '
              + 'importa é a atividade e o tamanho do reator.' },
          { t: '③ Remoção',
            tex: '\\eta = 1 - \\frac{S_{sai}}{S_{entra}}',
            texSub: '\\eta = 1 - \\frac{' + nt(r.sOut, 4) + '}{' + nt(p.sIn) + '} = ' + nt(r.remocao, 5) + '\\ \\%',
            obs: 'De 97 para 99,9 % parece pouco, mas é o que separa S-500 de S-10. Os compostos que '
              + 'sobram — 4,6-dimetildibenzotiofeno e parentes — têm o átomo de enxofre escondido entre '
              + 'dois grupos metila e só reagem depois de saturar um anel aromático, o que exige NiMo e '
              + 'alta pressão de H₂.' },
          { t: '④ Hidrogênio e calor',
            tex: 'H_2 \\approx 15\\,\\Delta S_{\\%} + 0{,}9\\,p_{H_2}, \\qquad \\Delta T \\approx 0{,}28\\,H_2',
            texSub: 'H_2 \\approx 15\\times' + nt((p.sIn - r.sOut) / 1e4, 3) + ' + 0{,}9\\times' + nt(p.P) + (p.carga < 1 ? '\\times 1{,}6' : '')
              + ' = ' + nt(r.h2, 3) + '\\ \\mathrm{Nm^3/m^3} \\;\\Rightarrow\\; \\Delta T \\approx ' + nt(r.dT, 3) + '\\,{}^\\circ C',
            obs: 'A maior parte do hidrogênio não vai para o enxofre: vai para saturar aromáticos, o que '
              + 'melhora o número de cetano do diesel. As reações são exotérmicas, então o reator é '
              + 'dividido em leitos com injeção de H₂ frio entre eles para a temperatura não disparar.' }
        ]);

        return {
          sOut: { v: r.sOut, u: 'ppm', classe: r.s10 ? 'ok' : (r.s500 ? 'destaque' : 'alerta') },
          rem: { v: r.remocao, u: '%', sig: 5 },
          k: { v: r.k, u: 'ppm⁻⁰·⁵ h⁻¹' },
          h2: { v: r.h2, u: 'Nm³/m³' },
          dT: { v: r.dT, u: '°C' },
          spec: { v: r.s10 ? 'S-10' : (r.s500 ? 'S-500' : 'fora'), u: '' }
        };
      }
    });
  })();
})();

# Engenharia Mecânica

Site de estudo das disciplinas do curso de Engenharia Mecânica.
Cada disciplina tem resumo teórico, formulário, simuladores interativos e animados, e um banco de
questões com correção imediata.

**Acesse:** https://matheusmerlim1.github.io/engenharia-mecanica/

Das 43 disciplinas do catálogo, 13 já estão prontas; as demais aparecem como pendentes.

## O que tem em cada página

- **Conteúdo** — os tópicos da disciplina em blocos expansíveis, com equações, faixas de validade,
  tabelas de propriedades e as pegadinhas clássicas de prova.
- **Simuladores** — modelos que respondem a sliders: diagramas de esforço cortante e momento fletor,
  linha elástica, curva de sistema de tubulação, ciclos térmicos, resposta de sistemas vibratórios,
  círculo de Mohr, diagrama de Moody, e outros conforme a disciplina.
- **Simulado** — questões objetivas: múltipla escolha com resolução comentada e questões de cálculo
  com calculadora embutida e resolução passo a passo.
  Filtre por tópico, dificuldade e tipo; ao final sai o acerto por tópico.
- **Normas** — nas disciplinas de projeto, o que cada norma ABNT/ASME/ISO/AGMA/API define e como
  o valor dela entra no dimensionamento.

## Rodando localmente

O site usa `fetch` para carregar os bancos de questões, então **não funciona abrindo o arquivo
direto pelo `file://`**. Suba um servidor local:

```bash
cd engenharia-mecanica
python -m http.server 8000
# abra http://localhost:8000
```

Ou, com Node:

```bash
npx serve .
```

## Publicando no GitHub Pages

1. Crie o repositório e envie o conteúdo desta pasta na raiz.
2. Em **Settings → Pages**, selecione a branch (`main`) e a pasta `/ (root)`.
3. O arquivo `.nojekyll` já está incluído — sem ele o Jekyll ignora diretórios com `_`.

## Estrutura

```
├── index.html              catálogo das disciplinas
├── css/
│   ├── main.css            design system (tokens, layout, tipografia)
│   ├── quiz.css            componentes do simulado
│   └── viz.css             controles e telas dos simuladores
├── js/
│   ├── core/
│   │   ├── app.js          tema, índice lateral, catálogo, busca
│   │   ├── plot.js         biblioteca de gráficos em canvas + utilitários numéricos
│   │   ├── sim.js          construtor de simuladores (controles + gráficos + saídas)
│   │   └── quiz.js         motor de simulado
│   └── sim/<slug>.js       modelos interativos de cada disciplina
├── data/
│   ├── disciplinas.json    catálogo
│   └── questoes/<slug>.json bancos de questões
└── disciplinas/<slug>.html páginas das disciplinas
```

## Aviso

Material de apoio ao estudo, não substitui a bibliografia nem o texto oficial das normas técnicas.
As normas são citadas por designação e escopo — o texto integral é obra protegida e deve ser obtido
junto à ABNT, ASME, ISO ou AGMA.

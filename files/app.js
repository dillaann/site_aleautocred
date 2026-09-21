/* ═══════════════════════════════════════════════════════════
   ALE AUTO CRED — app.js
   Painel de instrumentos: simulador, ponteiro em mola, pista em
   canvas, rastreamento com consentimento. Sem dependência externa.
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   1. CONFIGURAÇÃO — tudo que muda fica aqui e só aqui.
   ───────────────────────────────────────────────────────────── */
const CONFIG = {
  whatsapp: "5548999999999",             // TROCAR: 55 + DDD + número, só dígitos
  telefone: "(48) 9999-9999",            // TROCAR
  email: "contato@aleautocred.com.br",   // TROCAR
  fundacao: 2012,
  horarioAtendimento: "Segunda a sexta, 8h30 às 18h · Sábado, 9h às 12h",
  endereco: "Rua Augusto Westphal, 483, Ponte do Imaruim, Palhoça, SC",
  /* CONFIRMAR: ponto aproximado na Rua Augusto Westphal (o geocodificador não
     resolve o número). Abra o OpenStreetMap, clique na loja e copie lat/lon. */
  coordenadas: { lat: -27.6282, lon: -48.6466 },
  /* Dias: 0 = domingo … 6 = sábado. Horário de Brasília. */
  expediente: [
    { dias: [1, 2, 3, 4, 5], abre: "08:30", fecha: "18:00" },
    { dias: [6], abre: "09:00", fecha: "12:00" },
  ],

  /* Mensagem que abre no WhatsApp, por produto da página (<body data-produto>).
     {valor}, {entrada}, {financiado} e {prazo} vêm do simulador. */
  mensagemWhats: {
    refinanciamento: "Olá! Vim pelo site. Quero simular um refinanciamento de {valor} em {prazo}x.",
    financiamento: "Olá! Vim pelo site. Quero simular o financiamento de um veículo de {valor}, com entrada de {entrada} ({financiado} financiados) em {prazo}x.",
  },
  /* Botões com data-mensagem usam estas, sem valor e prazo do simulador. */
  mensagensProduto: {
    financiamento: "Olá! Vim pelo site. Quero saber como funciona o financiamento de veículo.",
    duvida: "Olá! Vim pelo site e tenho uma dúvida sobre refinanciamento de veículo.",
    visita: "Olá! Vim pelo site. Quero combinar uma visita à loja na Ponte do Imaruim.",
  },

  simulador: {
    /* ATENÇÃO AO TETO: o valor que a instituição libera costuma ser uma
       fração da tabela FIPE do veículo (na prática entre 60% e 90%, conforme
       a parceira e o perfil). O máximo abaixo é o limite do simulador, não
       uma promessa. Não subir sem confirmar com as parceiras. */
    min: 5000,
    max: 100000,
    passo: 1000,
    inicial: 25000,
    prazos: [12, 24, 36, 48, 60],        // mais de cinco quebra em duas linhas; nunca espremer
    prazoInicial: 48,
    taxaMes: 1.79,                       // TROCAR: % ao mês. Placeholder até o cliente passar a taxa real.

    /* Financiamento (financiamento.html): aqui o slider principal é o valor do
       VEÍCULO, não o que entra na conta. A entrada sai dele e o que financia —
       e gera a parcela — é a diferença. Mesma taxa e mesmos prazos. */
    financiamento: {
      min: 10000,
      max: 150000,
      passo: 1000,
      inicial: 50000,
      entradaMinPct: 20,                 // CONFIRMAR com as parceiras: mínimo que costumam exigir
      entradaInicialPct: 20,
      entradaMaxPct: 80,                 // acima disso não é mais financiamento, é compra à vista
    },
  },

  /* Busca do veículo na tabela FIPE. API pública e não oficial: se ela cair,
     estiver lenta ou o visitante estiver sem rede, o campo se esconde sozinho
     e o simulador volta ao slider de valor manual. Nada aqui é obrigatório
     para o simulador funcionar. */
  fipe: {
    ativo: true,
    base: "https://parallelum.com.br/fipe/api/v1",
    timeoutMs: 9000,
    /* O valor FIPE é referência de mercado, não o que a instituição libera.
       Este texto aparece junto do valor e não deve sair. */
    ressalva: "Valor de referência da tabela FIPE. O quanto a instituição financia depende da análise e da avaliação do veículo.",
  },

  rastreio: {
    ga4Id: "",                           // TROCAR: ex. "G-XXXXXXXXXX". Vazio = não carrega.
    pixelId: "",                         // TROCAR: ex. "123456789012345". Vazio = não carrega.
    diasConsentimento: 180,
  },

  /* Some do site enquanto null. Exemplo:
     atendente: { nome: "Nome Sobrenome", cargo: "Atendimento e análise",
                  foto: "img/atendente.jpg", frase: "Uma frase curta, dita pela própria pessoa." } */
  atendente: null,

  /* Some do site enquanto vazio. Só avaliação real, copiada do Google. Exemplo:
     { nome: "Nome S.", nota: 5, texto: "Texto da avaliação.", quando: "ago. 2026" } */
  avaliacoes: [],
  googleReviewsUrl: "",                  // link do perfil no Google, para o botão "Ver todas"
};

/* ─────────────────────────────────────────────────────────────
   2. UTILITÁRIOS
   ───────────────────────────────────────────────────────────── */
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moedaInteira = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const reduzirMovimento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function extenso(n) {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), r = n % 100, d = Math.floor(r / 10), u = r % 10;
  const partes = [];
  if (c) partes.push(CENTENAS[c]);
  if (r && r < 20) partes.push(UNIDADES[r]);
  else if (r) partes.push(DEZENAS[d] + (u ? ` e ${UNIDADES[u]}` : ""));
  return partes.join(" e ");
}

function valorExtenso(v) {
  const mil = Math.floor(v / 1000), resto = v % 1000;
  if (mil === 0) return `${extenso(resto)} reais`;
  let s = mil === 1 ? "mil" : `${extenso(mil)} mil`;
  if (resto) s += ` e ${extenso(resto)}`;
  return `${s} reais`;
}

const rotuloMil = (v) => `${(v / 1000).toLocaleString("pt-BR")} mil`;

/* localStorage lança em aba anônima ou iframe; sem isso o app.js inteiro cairia. */
const memoria = {};
const armazenamento = {
  ler(chave) { try { return window.localStorage.getItem(chave); } catch { return chave in memoria ? memoria[chave] : null; } },
  gravar(chave, valor) { try { window.localStorage.setItem(chave, valor); } catch { memoria[chave] = valor; } },
};

/* ─────────────────────────────────────────────────────────────
   3. RASTREAMENTO — dois portões: ID presente E cookie aceito
   ───────────────────────────────────────────────────────────── */
const rastreio = { consentido: false, carregado: false };

function carregarRastreio() {
  if (rastreio.carregado || !rastreio.consentido) return;
  const { ga4Id, pixelId } = CONFIG.rastreio;

  if (ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga4Id);
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4Id);
    document.head.appendChild(s);
  }

  if (pixelId) {
    if (!window.fbq) {
      const n = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      window.fbq = n;
      if (!window._fbq) window._fbq = n;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }

  rastreio.carregado = true;
}

function evento(nome, params = {}) {
  if (!rastreio.consentido) return false;
  const { ga4Id, pixelId } = CONFIG.rastreio;
  if (ga4Id && window.gtag) window.gtag("event", nome, params);
  if (pixelId && window.fbq) {
    if (nome === "generate_lead") {
      window.fbq("track", "Lead", {
        content_name: params.origem, value: params.valor, currency: "BRL",
        prazo: params.prazo, parcela: params.parcela,
      });
    } else {
      window.fbq("trackCustom", nome, params);
    }
  }
  return true;
}

/* ─────────────────────────────────────────────────────────────
   4. BARRA DE COOKIES
   ───────────────────────────────────────────────────────────── */
const CHAVE_CONSENTIMENTO = "aac_consentimento";

function lerConsentimento() {
  try {
    const bruto = armazenamento.ler(CHAVE_CONSENTIMENTO);
    if (!bruto) return null;
    const dado = JSON.parse(bruto);
    const dias = (Date.now() - new Date(dado.em).getTime()) / 864e5;
    if (!dado.escolha || !(dias >= 0) || dias > CONFIG.rastreio.diasConsentimento) return null;
    return dado.escolha;
  } catch {
    return null;
  }
}

function cookies() {
  const barra = document.getElementById("cookies");
  if (!barra) return;

  const ajustarAltura = () =>
    document.documentElement.style.setProperty("--barra-h", barra.hidden ? "0px" : `${barra.offsetHeight}px`);
  const mostrar = () => { barra.hidden = false; ajustarAltura(); };
  const esconder = () => { barra.hidden = true; ajustarAltura(); };

  const decidir = (escolha) => {
    armazenamento.gravar(CHAVE_CONSENTIMENTO, JSON.stringify({ escolha, em: new Date().toISOString() }));
    rastreio.consentido = escolha === "aceito";
    if (rastreio.consentido) carregarRastreio();
    esconder();
  };

  document.getElementById("cookiesAceitar").addEventListener("click", () => decidir("aceito"));
  document.getElementById("cookiesRecusar").addEventListener("click", () => decidir("recusado"));
  const abrir = document.getElementById("abrirCookies");
  if (abrir) abrir.addEventListener("click", mostrar);
  if ("ResizeObserver" in window) new ResizeObserver(ajustarAltura).observe(barra);
  else window.addEventListener("resize", ajustarAltura);

  const escolha = lerConsentimento();
  if (escolha === "aceito") { rastreio.consentido = true; carregarRastreio(); }
  if (!escolha || window.location.hash === "#cookies") mostrar();
}

/* ─────────────────────────────────────────────────────────────
   5. SIMULADOR — estado, Price, links de WhatsApp
   ───────────────────────────────────────────────────────────── */
/* Qual produto esta p\u00e1gina simula. Sem <body data-produto>, \u00e9 refinanciamento \u2014
   \u00e9 o que o index e a home sempre simularam. */
function produtoDaPagina() {
  const p = document.body && document.body.dataset.produto;
  return p === "financiamento" ? "financiamento" : "refinanciamento";
}

/* A faixa do slider principal muda de significado por produto: no
   refinanciamento \u00e9 quanto entra na conta, no financiamento \u00e9 o valor do
   ve\u00edculo. Cluster e simulador leem daqui para n\u00e3o divergirem. */
function faixaSimulador() {
  const cfg = CONFIG.simulador;
  return produtoDaPagina() === "financiamento" ? cfg.financiamento : cfg;
}

const sim = {
  valor: faixaSimulador().inicial,
  prazo: CONFIG.simulador.prazoInicial,
  parcela: 0,
  entrada: 0,          // sempre 0 no refinanciamento
  financiado: 0,       // = valor - entrada; \u00e9 sobre ele que a parcela \u00e9 calculada
};

function parcelaPrice(pv, taxaMes, n) {
  const i = taxaMes / 100;
  if (i === 0) return pv / n;
  return pv * i / (1 - Math.pow(1 + i, -n));
}

function atualizarLinks() {
  const fmt = (v) => moedaInteira.format(v).replace(/\u00a0/g, " ");
  const padrao = CONFIG.mensagemWhats[produtoDaPagina()]
    .replace("{valor}", fmt(sim.valor))
    .replace("{entrada}", fmt(sim.entrada))
    .replace("{financiado}", fmt(sim.financiado))
    .replace("{prazo}", sim.prazo);
  document.querySelectorAll("[data-zap]").forEach((a) => {
    const texto = CONFIG.mensagensProduto[a.dataset.mensagem] || padrao;
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;
  });
}

function leads() {
  document.querySelectorAll("[data-zap]").forEach((a) => {
    a.addEventListener("click", () => evento("generate_lead", {
      origem: a.dataset.origem || "site", valor: sim.valor, prazo: sim.prazo, parcela: sim.parcela,
    }));
  });
}

function simulador(painel) {
  const cfg = CONFIG.simulador;
  const fx = faixaSimulador();
  const faixa = document.getElementById("valor");
  const prazos = document.getElementById("prazos");
  if (!faixa || !prazos) return;

  faixa.min = fx.min; faixa.max = fx.max; faixa.step = fx.passo; faixa.value = fx.inicial;
  document.getElementById("limMin").textContent = moedaInteira.format(fx.min);
  document.getElementById("limMax").textContent = moedaInteira.format(fx.max);

  /* Segundo slider, só no financiamento: a entrada. Sem ele, entrada = 0 e
     tudo abaixo se comporta exatamente como o simulador de sempre. */
  const faixaEnt = document.getElementById("entrada");
  const elEntOut = document.getElementById("entradaOut");
  const elFinanciado = document.getElementById("financiado");
  const elEntPct = document.getElementById("entradaPct");

  function limitesEntrada() {
    return {
      min: Math.round((sim.valor * fx.entradaMinPct) / 100),
      max: Math.round((sim.valor * fx.entradaMaxPct) / 100),
    };
  }

  /* A entrada é uma fatia do valor do veículo, então os limites dela andam
     junto com o slider de cima. Guardamos a proporção para o valor não pular
     quando o veículo muda. */
  function ajustarEntrada(manterPct) {
    if (!faixaEnt) { sim.entrada = 0; return; }
    const { min, max } = limitesEntrada();
    const alvo = manterPct == null ? sim.entrada : Math.round((sim.valor * manterPct) / 100);
    sim.entrada = Math.min(max, Math.max(min, Math.round(alvo / fx.passo) * fx.passo));
    faixaEnt.min = min; faixaEnt.max = max; faixaEnt.step = fx.passo; faixaEnt.value = sim.entrada;
    document.getElementById("entMin").textContent = moedaInteira.format(min);
    document.getElementById("entMax").textContent = moedaInteira.format(max);
  }

  const elParcela = document.getElementById("parcela");
  const elSub = document.getElementById("parcelaSub");
  const elOut = document.getElementById("valorOut");
  const taxaTexto = cfg.taxaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function render() {
    sim.financiado = sim.valor - sim.entrada;
    const parcela = parcelaPrice(sim.financiado, cfg.taxaMes, sim.prazo);
    sim.parcela = Math.round(parcela * 100) / 100;
    elParcela.textContent = moeda.format(parcela);
    elSub.textContent = `taxa ${taxaTexto}% a.m. · total ${moeda.format(parcela * sim.prazo)} · ${sim.prazo}x`;
    elOut.textContent = moedaInteira.format(sim.valor);
    faixa.setAttribute("aria-valuetext", valorExtenso(sim.valor));
    faixa.style.setProperty("--pct", `${((sim.valor - fx.min) / (fx.max - fx.min)) * 100}%`);

    if (faixaEnt) {
      const { min, max } = limitesEntrada();
      elEntOut.textContent = moedaInteira.format(sim.entrada);
      faixaEnt.setAttribute("aria-valuetext", valorExtenso(sim.entrada));
      faixaEnt.style.setProperty("--pct", `${max > min ? ((sim.entrada - min) / (max - min)) * 100 : 0}%`);
      if (elEntPct) elEntPct.textContent = `${Math.round((sim.entrada / sim.valor) * 100)}% do veículo`;
      if (elFinanciado) elFinanciado.textContent = moedaInteira.format(sim.financiado);
    }

    document.querySelectorAll('[data-sim="valor"]').forEach((e) => { e.textContent = moedaInteira.format(sim.valor); });
    document.querySelectorAll('[data-sim="entrada"]').forEach((e) => { e.textContent = moedaInteira.format(sim.entrada); });
    document.querySelectorAll('[data-sim="financiado"]').forEach((e) => { e.textContent = moedaInteira.format(sim.financiado); });
    document.querySelectorAll('[data-sim="prazo"]').forEach((e) => { e.textContent = `${sim.prazo}x`; });
    document.querySelectorAll('[data-sim="parcela"]').forEach((e) => { e.textContent = moeda.format(parcela); });
    tabela();
    painel.apontar(sim.valor);
    atualizarLinks();
  }

  /* Quadro à esquerda: a parcela em cada prazo para o valor atual. */
  const corpoTabela = document.getElementById("tabelaPrazos");
  function tabela() {
    if (!corpoTabela) return;
    if (!corpoTabela.children.length) {
      cfg.prazos.forEach((p) => {
        const tr = document.createElement("tr");
        tr.dataset.prazo = p;
        tr.innerHTML = '<td colspan="3"><button type="button" class="linha-bt"><span class="prazo-n"></span><span class="parcela-n"></span><span class="total-n"></span></button></td>';
        tr.querySelector(".linha-bt").addEventListener("click", () => escolherPrazo(p));
        corpoTabela.appendChild(tr);
      });
    }
    [...corpoTabela.children].forEach((tr) => {
      const p = Number(tr.dataset.prazo);
      const parc = parcelaPrice(sim.financiado, cfg.taxaMes, p);
      tr.classList.toggle("ativo", p === sim.prazo);
      tr.querySelector(".linha-bt").setAttribute("aria-pressed", String(p === sim.prazo));
      tr.querySelector(".prazo-n").textContent = `${p}x`;
      tr.querySelector(".parcela-n").textContent = moeda.format(parc);
      tr.querySelector(".total-n").textContent = moeda.format(parc * p);
    });
  }

  function escolherPrazo(p, focar) {
    sim.prazo = p;
    prazos.querySelectorAll(".pilula").forEach((b) => {
      const on = Number(b.dataset.prazo) === p;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focar) b.focus();
    });
    render();
    evento("simulador_prazo", { prazo: p, valor: sim.valor });
  }

  function teclasPrazo(e) {
    const i = cfg.prazos.indexOf(sim.prazo), n = cfg.prazos.length;
    let novo = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") novo = cfg.prazos[(i + 1) % n];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") novo = cfg.prazos[(i - 1 + n) % n];
    else if (e.key === "Home") novo = cfg.prazos[0];
    else if (e.key === "End") novo = cfg.prazos[n - 1];
    if (novo !== null) { e.preventDefault(); escolherPrazo(novo, true); }
  }

  cfg.prazos.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pilula";
    b.setAttribute("role", "radio");
    b.dataset.prazo = p;
    b.textContent = `${p}x`;
    b.setAttribute("aria-checked", String(p === sim.prazo));
    b.tabIndex = p === sim.prazo ? 0 : -1;
    b.addEventListener("click", () => escolherPrazo(p));
    b.addEventListener("keydown", teclasPrazo);
    prazos.appendChild(b);
  });

  let esperaValor = 0;
  faixa.addEventListener("input", () => {
    const pctAtual = faixaEnt ? (sim.entrada / sim.valor) * 100 : null;
    sim.valor = Number(faixa.value);
    ajustarEntrada(pctAtual);   // mexer no veículo mantém a proporção da entrada
    render();
    clearTimeout(esperaValor);
    esperaValor = setTimeout(() => evento("simulador_valor", { valor: sim.valor, prazo: sim.prazo }), 500);
  });

  if (faixaEnt) {
    let esperaEnt = 0;
    faixaEnt.addEventListener("input", () => {
      sim.entrada = Number(faixaEnt.value);
      render();
      clearTimeout(esperaEnt);
      esperaEnt = setTimeout(() => evento("simulador_entrada", { entrada: sim.entrada, valor: sim.valor }), 500);
    });
    ajustarEntrada(fx.entradaInicialPct);
  }

  render();

  /* A busca FIPE entra por aqui: define o valor do veículo de fora, mantendo
     a proporção da entrada e o slider em sincronia. */
  return {
    definirValor(v) {
      const pctAtual = faixaEnt ? (sim.entrada / sim.valor) * 100 : null;
      sim.valor = Math.max(fx.min, Math.round(v));
      faixa.value = Math.min(fx.max, sim.valor);   // o slider tem teto; sim.valor não
      ajustarEntrada(pctAtual);
      render();
    },
  };
}

/* ─────────────────────────────────────────────────────────────
   5b. BUSCA DO VEÍCULO NA FIPE
   A API é hierárquica (marca → modelo → ano), então a caixa de busca
   caminha em cascata: filtra marcas, depois modelos daquela marca, e
   por fim o ano. Qualquer falha esconde o bloco e devolve o slider.
   ───────────────────────────────────────────────────────────── */

/* A categoria vem do nome do modelo — é o que decide a silhueta mostrada.
   Ordem importa: picape antes de SUV, porque "S10 CD" casa com os dois. */
const CATEGORIAS = [
  ["picape", /(STRADA|SAVEIRO|TORO|HILUX|S10|S-10|RANGER|MONTANA|FRONTIER|AMAROK|L200|OROCH|COURIER|HOGGAR|PICK.?UP|CABINE|\bC[SD]\b)/],
  ["suv", /(CRETA|KICKS|COMPASS|RENEGADE|TRACKER|T.?CROSS|NIVUS|HR.?V|WR.?V|TIGGO|PULSE|FASTBACK|DUSTER|ECOSPORT|CAPTUR|CROSS|SW4|TUCSON|SANTA FE|PAJERO|TR4|OUTLANDER|ASX|CR.?V|RAV4|SORENTO|SPORTAGE|TERRITORY|COMMANDER|BRONCO|TROLLER|JIMNY|SUV|4X4)/],
  ["sedan", /(SEDAN|SED[ÃA]|VIRTUS|VOYAGE|PRISMA|COROLLA|CIVIC|CITY|HB20S|LOGAN|VERSA|CRONOS|SIENA|CLASSIC|JETTA|SENTRA|CERATO|ELANTRA|LINEA|FLUENCE|CRUZE|COBALT|ONIX PLUS)/],
];

function categoriaVeiculo(nome, tipo) {
  if (tipo === "motos") return "moto";
  const n = (nome || "").toUpperCase();
  for (const [cat, re] of CATEGORIAS) if (re.test(n)) return cat;
  return "hatch";
}

function buscaFipe(painel) {
  const bloco = document.getElementById("buscaBloco");
  const campo = document.getElementById("veiculo");
  if (!bloco || !campo || !CONFIG.fipe.ativo || !painel) return;

  const lista = document.getElementById("veiculoLista");
  const manual = document.getElementById("valorManual");
  const achado = document.getElementById("veiculoAchado");
  const dica = document.getElementById("veiculoDica");
  const cache = new Map();
  let etapa = "marca", marca = null, modelo = null, itens = [], indice = -1, pedido = 0;

  async function api(caminho) {
    if (cache.has(caminho)) return cache.get(caminho);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), CONFIG.fipe.timeoutMs);
    try {
      const r = await fetch(`${CONFIG.fipe.base}${caminho}`, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const dados = await r.json();
      cache.set(caminho, dados);
      return dados;
    } finally { clearTimeout(t); }
  }

  /* Sem a API não há busca: o slider de sempre volta e ninguém fica travado. */
  function desistir() {
    bloco.hidden = true;
    if (manual) manual.hidden = false;
  }

  function fecharLista() {
    lista.hidden = true;
    campo.setAttribute("aria-expanded", "false");
    indice = -1;
  }

  function pintarLista(opcoes, vazio) {
    itens = opcoes;
    lista.innerHTML = "";
    if (!opcoes.length) {
      const li = document.createElement("li");
      li.className = "busca-vazio";
      li.textContent = vazio;
      lista.appendChild(li);
    } else {
      opcoes.slice(0, 40).forEach((o, i) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.id = `op${i}`;
        li.setAttribute("aria-selected", "false");
        li.textContent = o.rotulo;
        li.addEventListener("mousedown", (e) => { e.preventDefault(); escolher(i); });
        lista.appendChild(li);
      });
    }
    lista.hidden = false;
    campo.setAttribute("aria-expanded", "true");
    indice = -1;
  }

  function marcarAtivo() {
    [...lista.querySelectorAll('[role="option"]')].forEach((li, i) => {
      const on = i === indice;
      li.setAttribute("aria-selected", String(on));
      li.classList.toggle("on", on);
      if (on) li.scrollIntoView({ block: "nearest" });
    });
    campo.setAttribute("aria-activedescendant", indice >= 0 ? `op${indice}` : "");
  }

  const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  const filtrar = (arr, txt) => {
    const q = semAcento(txt).trim();
    if (!q) return arr;
    return arr.filter((o) => semAcento(o.rotulo).includes(q));
  };

  async function sugerir() {
    const meu = ++pedido;
    const txt = campo.value;
    try {
      if (etapa === "marca") {
        const marcas = await api("/carros/marcas");
        if (meu !== pedido) return;
        pintarLista(filtrar(marcas.map((m) => ({ rotulo: m.nome, codigo: m.codigo })), txt),
          "Nenhuma marca com esse nome");
      } else if (etapa === "modelo") {
        const r = await api(`/carros/marcas/${marca.codigo}/modelos`);
        if (meu !== pedido) return;
        const resto = txt.slice(marca.rotulo.length);
        pintarLista(filtrar(r.modelos.map((m) => ({ rotulo: m.nome, codigo: m.codigo })), resto),
          "Nenhum modelo dessa marca com esse nome");
      }
    } catch { desistir(); }
  }

  async function escolher(i) {
    const o = itens[i];
    if (!o) return;
    try {
      if (etapa === "marca") {
        marca = o;
        etapa = "modelo";
        campo.value = `${o.rotulo} `;
        dica.textContent = "Agora o modelo.";
        await sugerir();
        campo.focus();
      } else if (etapa === "modelo") {
        modelo = o;
        etapa = "ano";
        campo.value = `${marca.rotulo} ${o.rotulo}`;
        const anos = await api(`/carros/marcas/${marca.codigo}/modelos/${o.codigo}/anos`);
        dica.textContent = "Qual o ano?";
        pintarLista(anos.map((a) => ({ rotulo: a.nome, codigo: a.codigo })), "Sem anos para este modelo");
      } else if (etapa === "ano") {
        fecharLista();
        campo.value = `${marca.rotulo} ${modelo.rotulo}`;
        const v = await api(`/carros/marcas/${marca.codigo}/modelos/${modelo.codigo}/anos/${o.codigo}`);
        aplicar(v);
        evento("fipe_veiculo", { modelo: v.Modelo, ano: v.AnoModelo, valor: v.Valor });
      }
    } catch { desistir(); }
  }

  function aplicar(v) {
    const num = Number(String(v.Valor).replace(/[^\d,]/g, "").replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) { desistir(); return; }

    document.getElementById("veiculoNome").textContent = `${v.Marca} ${v.Modelo}`;
    document.getElementById("veiculoValor").textContent = moedaInteira.format(num);
    document.getElementById("veiculoMeta").textContent =
      `${v.AnoModelo} · ${v.Combustivel} · FIPE ${v.MesReferencia} · cód. ${v.CodigoFipe}`;
    document.getElementById("veiculoArte")
      .setAttribute("href", `#sil-${categoriaVeiculo(v.Modelo, "carros")}`);

    achado.hidden = false;
    dica.textContent = "";
    painel.definirValor(num);
  }

  function recomeçar() {
    etapa = "marca"; marca = null; modelo = null;
    campo.value = "";
    achado.hidden = true;
    dica.textContent = "Comece pela marca.";
    fecharLista();
    campo.focus();
  }

  campo.addEventListener("input", () => {
    /* Apagar o nome da marca volta um passo — o campo é um caminho, não texto solto. */
    if (etapa === "modelo" && !campo.value.startsWith(marca.rotulo)) { etapa = "marca"; marca = null; }
    if (etapa === "ano") { etapa = "modelo"; achado.hidden = true; }
    sugerir();
  });
  campo.addEventListener("focus", () => { if (achado.hidden) sugerir(); });
  campo.addEventListener("blur", () => setTimeout(fecharLista, 120));
  campo.addEventListener("keydown", (e) => {
    const n = lista.querySelectorAll('[role="option"]').length;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); indice = (indice + 1) % n; marcarAtivo(); }
    else if (e.key === "ArrowUp" && n) { e.preventDefault(); indice = (indice - 1 + n) % n; marcarAtivo(); }
    else if (e.key === "Enter" && indice >= 0) { e.preventDefault(); escolher(indice); }
    else if (e.key === "Escape") fecharLista();
  });
  const trocar = document.getElementById("trocarVeiculo");
  if (trocar) trocar.addEventListener("click", recomeçar);

  /* Só mostra a busca depois que a API provar que responde. */
  api("/carros/marcas")
    .then(() => { bloco.hidden = false; if (manual) manual.hidden = true; })
    .catch(desistir);
}

/* ─────────────────────────────────────────────────────────────
   6. CLUSTER — o ponteiro em mola
   ───────────────────────────────────────────────────────────── */
function cluster() {
  const svg = document.querySelector(".gauge");
  if (!svg) return { apontar() {}, ignicao() {}, angulo: 0, parado: true };

  const cfg = faixaSimulador();
  const CX = 160, CY = 140, R = 110, ANG_MIN = -120, ANG_MAX = 120;
  const NS = "http://www.w3.org/2000/svg";
  const ponto = (ang, r) => { const a = (ang * Math.PI) / 180; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; };
  const arco = (a1, a2, r) => {
    const [x1, y1] = ponto(a1, r), [x2, y2] = ponto(a2, r);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  const base = document.getElementById("arcoBase");
  const luz = document.getElementById("arcoLuz");
  const agulha = document.getElementById("agulha");
  const ticks = document.getElementById("ticks");
  base.setAttribute("d", arco(ANG_MIN, ANG_MAX, R));
  luz.setAttribute("d", arco(ANG_MIN, ANG_MAX, R));
  const L = luz.getTotalLength();
  luz.style.strokeDasharray = L;
  luz.style.strokeDashoffset = L;

  for (let i = 0; i <= 40; i++) {
    const ang = ANG_MIN + ((ANG_MAX - ANG_MIN) * i) / 40;
    const maior = i % 4 === 0;
    const [x1, y1] = ponto(ang, R - 10), [x2, y2] = ponto(ang, R - 10 - (maior ? 12 : 6));
    const t = document.createElementNS(NS, "line");
    t.setAttribute("x1", x1.toFixed(2)); t.setAttribute("y1", y1.toFixed(2));
    t.setAttribute("x2", x2.toFixed(2)); t.setAttribute("y2", y2.toFixed(2));
    t.setAttribute("class", maior ? "tick maior" : "tick");
    ticks.appendChild(t);
  }
  document.getElementById("lblMin").textContent = rotuloMil(cfg.min);
  document.getElementById("lblMax").textContent = rotuloMil(cfg.max);

  const angulo = (valor) => ANG_MIN + ((valor - cfg.min) / (cfg.max - cfg.min)) * (ANG_MAX - ANG_MIN);

  /* Mola amortecida: k = rigidez, c = amortecimento. Com k 36 / c 8,4 o
     ponteiro assenta em ~1,8s com um sobressinal de ~5%, como instrumento real. */
  const ASSENTAR = { k: 36, c: 8.4 };
  const VARRER = { k: 40, c: 9 };
  const mola = { ang: ANG_MIN, vel: 0, alvo: angulo(cfg.inicial), varrendo: false, tempoFase: 0, ...ASSENTAR };
  let raf = 0, ultimo = 0;

  function desenhar() {
    agulha.setAttribute("transform", `rotate(${mola.ang.toFixed(2)} ${CX} ${CY})`);
    luz.style.strokeDashoffset = (L * (1 - (mola.ang - ANG_MIN) / (ANG_MAX - ANG_MIN))).toFixed(1);
  }

  /* A varredura termina quando o ponteiro encosta no batente, medido em
     frames e não em relógio: se a primeira pintura atrasar, ela ainda acontece. */
  function encerrarVarredura() {
    Object.assign(mola, ASSENTAR);
    mola.varrendo = false;
    mola.tempoFase = 0;
    mola.alvo = angulo(sim.valor);
  }

  function quadro(agora) {
    const dt = Math.min((agora - ultimo) / 1000, 0.032) || 0.016;
    ultimo = agora;
    const h = dt / 2;
    for (let i = 0; i < 2; i++) {
      const acel = -mola.k * (mola.ang - mola.alvo) - mola.c * mola.vel;
      mola.vel += acel * h;
      mola.ang += mola.vel * h;
      if (mola.ang < ANG_MIN) { mola.ang = ANG_MIN; mola.vel = -mola.vel * 0.3; }
      if (mola.ang > ANG_MAX) { mola.ang = ANG_MAX; mola.vel = -mola.vel * 0.3; }
    }
    mola.tempoFase += dt;
    if (mola.varrendo && (mola.ang >= ANG_MAX - 0.5 || mola.tempoFase > 1.2)) encerrarVarredura();
    desenhar();
    const parado = !mola.varrendo && Math.abs(mola.ang - mola.alvo) < 0.1 && Math.abs(mola.vel) < 0.2;
    if (parado) { mola.ang = mola.alvo; mola.vel = 0; desenhar(); raf = 0; }
    else raf = requestAnimationFrame(quadro);
  }

  function animar() {
    if (reduzirMovimento()) { mola.ang = mola.alvo; mola.vel = 0; desenhar(); return; }
    if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(quadro); }
  }

  /* Antes da ignição o ponteiro descansa no mínimo; só guarda o alvo. */
  let ignicaoFeita = false;
  function apontar(valor) {
    mola.alvo = angulo(valor);
    if (!ignicaoFeita || mola.varrendo) return;
    animar();
  }

  function ignicao() {
    if (ignicaoFeita) return;
    ignicaoFeita = true;
    if (reduzirMovimento()) { animar(); return; }
    Object.assign(mola, { ang: ANG_MIN, vel: 0, alvo: ANG_MAX, varrendo: true, tempoFase: 0 }, VARRER);
    animar();
  }

  desenhar();
  return { apontar, ignicao, get angulo() { return mola.ang; }, get parado() { return !raf; } };
}

/* ─────────────────────────────────────────────────────────────
   7. PISTA — faróis atravessando a estrada à noite
   ───────────────────────────────────────────────────────────── */
function pista() {
  const cv = document.getElementById("pista");
  const hero = document.getElementById("topo");
  if (!cv || !hero || !cv.getContext) return null;
  const ctx = cv.getContext("2d");
  const reduzido = reduzirMovimento();
  let W = 0, H = 0, carros = [], ativo = false, visivel = false, raf = 0, ultimo = 0, proximo = 0;

  const fuga = () => [W * 0.56, H * 0.4];

  function dimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduzido || !ativo) quadroEstatico();
  }

  function novoCarro() {
    const lado = Math.random() < 0.5 ? -1 : 1;
    return { t: 0, dur: 6 + Math.random() * 4, faixa: lado * (0.3 + Math.random() * 0.4) };
  }

  function desenharFundo() {
    const [vx, vy] = fuga();
    const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, Math.max(W, H) * 0.55);
    g.addColorStop(0, "rgba(0,191,255,.2)");
    g.addColorStop(1, "rgba(0,191,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,191,255,.14)"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(vx, vy); ctx.lineTo(-W * 0.2, H * 1.05);
    ctx.moveTo(vx, vy); ctx.lineTo(W * 1.25, H * 1.05);
    ctx.stroke();
  }

  function desenharCarro(c) {
    const [vx, vy] = fuga();
    const e = c.t * c.t;
    const x = vx + c.faixa * W * 0.9 * e, y = vy + (H * 1.1 - vy) * e;
    const sep = 4 + 80 * e, r = 1.5 + 14 * e;
    const alpha = Math.min(1, c.t * 4) * (1 - Math.max(0, (c.t - 0.85) / 0.15));
    const dx = x - vx, dy = y - vy, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    const len = 30 + 220 * e;
    ctx.globalCompositeOperation = "lighter";
    for (const s of [-1, 1]) {
      const lx = x + (s * sep) / 2, ly = y;
      const lg = ctx.createLinearGradient(lx, ly, lx - ux * len, ly - uy * len);
      lg.addColorStop(0, `rgba(160,230,255,${(0.5 * alpha).toFixed(3)})`);
      lg.addColorStop(1, "rgba(0,191,255,0)");
      ctx.strokeStyle = lg; ctx.lineWidth = r; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - ux * len, ly - uy * len); ctx.stroke();
      const rg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 6);
      rg.addColorStop(0, `rgba(230,247,255,${alpha.toFixed(3)})`);
      rg.addColorStop(0.2, `rgba(0,191,255,${(0.55 * alpha).toFixed(3)})`);
      rg.addColorStop(1, "rgba(0,191,255,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(lx, ly, r * 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function quadro(agora) {
    if (!ativo) return;
    const dt = Math.min((agora - ultimo) / 1000, 0.05) || 0;
    ultimo = agora;
    ctx.clearRect(0, 0, W, H);
    desenharFundo();
    if (agora > proximo && carros.length < 3) {
      carros.push(novoCarro());
      proximo = agora + 2200 + Math.random() * 2500;
    }
    for (const c of carros) { c.t += dt / c.dur; desenharCarro(c); }
    carros = carros.filter((c) => c.t < 1);
    raf = requestAnimationFrame(quadro);
  }

  function quadroEstatico() {
    ctx.clearRect(0, 0, W, H);
    desenharFundo();
    [[0.35, -0.5], [0.62, 0.45], [0.8, -0.25]].forEach(([t, faixa]) => desenharCarro({ t, faixa }));
  }

  function ligar() {
    if (ativo || reduzido) return;
    ativo = true; ultimo = performance.now(); proximo = 0;
    if (!carros.length) carros.push({ ...novoCarro(), t: 0.45 }, { ...novoCarro(), t: 0.15 });
    raf = requestAnimationFrame(quadro);
  }
  function desligar() { ativo = false; cancelAnimationFrame(raf); raf = 0; }

  if ("ResizeObserver" in window) new ResizeObserver(dimensionar).observe(hero);
  else window.addEventListener("resize", dimensionar);
  dimensionar();

  if (!reduzido) {
    new IntersectionObserver(([entrada]) => {
      visivel = entrada.isIntersecting;
      if (visivel && !document.hidden) ligar(); else desligar();
    }, { threshold: 0.05 }).observe(hero);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) desligar(); else if (visivel) ligar();
    });
  }

  return { get ativo() { return ativo; } };
}

/* ─────────────────────────────────────────────────────────────
   8. HERO, FAQ, DADOS, PROVA SOCIAL, FLUTUANTE, ROLAGEM
   ───────────────────────────────────────────────────────────── */
function acenderHero() {
  requestAnimationFrame(() => {
    const luz = document.getElementById("luz"), txt = document.getElementById("heroTxt");
    if (luz) luz.classList.add("on");
    if (txt) txt.classList.add("on");
  });
}

const PERGUNTAS_FINANCIAMENTO = [
  ["Qual entrada eu preciso dar?",
   "Costuma partir de 20% do valor do veículo, mas quem define é a instituição financeira, conforme o seu perfil e o carro escolhido. Quanto maior a entrada, menor a parcela e maior a chance de aprovação."],
  ["Dá para financiar carro de particular?",
   "Sim. A instituição faz a vistoria e a avaliação do veículo do mesmo jeito, e nós cuidamos da papelada e da transferência. Só é preciso que o veículo esteja regular e o vendedor tenha o documento em ordem."],
  ["Qual a idade máxima do veículo?",
   "Varia conforme a instituição. Carros mais novos conseguem prazo maior e taxa menor. Traga o ano e o modelo que a gente verifica com as parceiras o que é possível."],
  ["O carro já sai no meu nome?",
   "Sim. O veículo é transferido para você com a garantia (alienação fiduciária) registrada no documento em favor da instituição. A garantia sai quando você termina de pagar."],
  ["Vocês cobram alguma taxa antes?",
   "Nenhuma. Simulação, análise e atendimento são sem custo, e não pedimos depósito, pix ou taxa de liberação em momento algum. Se alguém pedir dinheiro adiantado em nosso nome, é golpe — nos avise."],
  ["Vocês são um banco?",
   "Não. Somos correspondente bancário: intermediamos seu pedido junto a instituições financeiras parceiras, comparamos as condições e cuidamos da papelada. A concessão do crédito é decisão delas."],
];

const PERGUNTAS_REFINANCIAMENTO = [
  ["Consigo refinanciar estando negativado?",
   "Na maioria dos casos, sim. A garantia é o próprio veículo, então o nome sujo pesa muito menos do que em um empréstimo comum. Ainda assim existe análise, e quem decide é a instituição financeira — não prometemos aprovação antes de olhar seu caso."],
  ["Preciso entregar o carro?",
   "Não. O veículo continua com você e você continua usando normalmente. O que acontece é o registro da garantia no documento, que sai quando você termina de pagar."],
  ["Vocês cobram alguma taxa antes?",
   "Nenhuma. Simulação, análise e atendimento são sem custo, e não pedimos depósito, pix ou taxa de liberação em momento algum. Se alguém pedir dinheiro adiantado em nosso nome, é golpe — nos avise."],
  ["O veículo pode estar no nome de outra pessoa?",
   "Algumas instituições aceitam veículo de terceiro, com o proprietário participando do contrato. Traga a situação que a gente verifica o que é possível."],
  ["Em quanto tempo o dinheiro cai?",
   "Com a documentação completa, normalmente entre um e três dias úteis após a aprovação. O prazo é da instituição financeira e pode variar conforme a vistoria e a análise."],
  ["Vocês são um banco?",
   "Não. Somos correspondente bancário: intermediamos seu pedido junto a instituições financeiras parceiras, comparamos as condições e cuidamos da papelada. A concessão do crédito é decisão delas."],
];

function faq() {
  const caixa = document.getElementById("faq");
  if (!caixa) return;
  const reduzido = reduzirMovimento();

  function abrir(item, corpo, bt) {
    item.classList.add("aberto");
    bt.setAttribute("aria-expanded", "true");
    corpo.style.maxHeight = reduzido ? "none" : `${corpo.scrollHeight}px`;
  }
  function fechar(item, corpo, bt) {
    item.classList.remove("aberto");
    bt.setAttribute("aria-expanded", "false");
    if (reduzido) { corpo.style.maxHeight = "0px"; return; }
    corpo.style.maxHeight = `${corpo.scrollHeight}px`;
    requestAnimationFrame(() => { corpo.style.maxHeight = "0px"; });
  }

  const perguntas = produtoDaPagina() === "financiamento" ? PERGUNTAS_FINANCIAMENTO : PERGUNTAS_REFINANCIAMENTO;
  perguntas.forEach(([q, r], i) => {
    const item = document.createElement("div");
    item.className = "faq-item";
    item.innerHTML = `
      <h3 class="faq-h">
        <button class="faq-bt" type="button" aria-expanded="false" aria-controls="r${i}">
          <span class="faq-n" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <span class="faq-q"></span>
          <span class="faq-seta" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span>
        </button>
      </h3>
      <div class="faq-corpo" id="r${i}" role="region"><p></p></div>`;
    item.querySelector(".faq-q").textContent = q;
    item.querySelector(".faq-corpo p").textContent = r;
    const bt = item.querySelector("button"), corpo = item.querySelector(".faq-corpo");
    corpo.addEventListener("transitionend", () => { if (item.classList.contains("aberto")) corpo.style.maxHeight = "none"; });
    bt.addEventListener("click", () => {
      const aberto = item.classList.contains("aberto");
      caixa.querySelectorAll(".faq-item.aberto").forEach((outro) => fechar(outro, outro.querySelector(".faq-corpo"), outro.querySelector(".faq-bt")));
      if (!aberto) { abrir(item, corpo, bt); evento("faq_abrir", { pergunta: q }); }
    });
    bt.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const todos = [...caixa.querySelectorAll(".faq-bt")];
      const alvo = todos[(todos.indexOf(bt) + (e.key === "ArrowDown" ? 1 : -1) + todos.length) % todos.length];
      e.preventDefault(); alvo.focus();
    });
    caixa.appendChild(item);
    if (i === 0) { item.classList.add("aberto"); bt.setAttribute("aria-expanded", "true"); corpo.style.maxHeight = "none"; }
  });
}

/* Passos: o trilho avança sozinho enquanto a seção está na tela.
   O mouse em cima não interrompe; pausa só com foco ou depois de um
   clique. Não roda com prefers-reduced-motion. */
function passos() {
  const lista = document.getElementById("passos");
  if (!lista) return;
  const itens = [...lista.querySelectorAll(".passo")];
  const DURACAO = 3600, PAUSA_CLIQUE = 9000;
  lista.style.setProperty("--passo-dur", `${DURACAO}ms`);
  let atual = 0, timer = 0, visivel = false, sobre = false, esperaClique = 0;

  function marcar(i) {
    atual = (i + itens.length) % itens.length;
    itens.forEach((li, k) => {
      li.classList.toggle("ativo", k === atual);
      li.classList.toggle("feito", k < atual);
      if (k === atual) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  function parar() { clearTimeout(timer); timer = 0; lista.classList.remove("andando"); }

  function andar() {
    parar();
    if (!visivel || sobre || esperaClique || document.hidden || reduzirMovimento()) return;
    lista.classList.add("andando");
    timer = setTimeout(() => {
      if (atual === itens.length - 1) reiniciar();
      else { marcar(atual + 1); andar(); }
    }, DURACAO);
  }

  /* Fim do ciclo: a luz recua de 04 a 01 e o 01 reacende. */
  function reiniciar() {
    parar();
    lista.classList.add("rebobinando");
    itens.forEach((li) => { li.classList.remove("feito", "ativo"); li.removeAttribute("aria-current"); });
    timer = setTimeout(() => {
      lista.classList.remove("rebobinando");
      marcar(0);
      andar();
    }, 1250);
  }

  itens.forEach((li, i) => {
    li.style.setProperty("--i", i);
    li.querySelector(".passo-bt").addEventListener("click", () => {
      marcar(i); parar();
      clearTimeout(esperaClique);
      esperaClique = setTimeout(() => { esperaClique = 0; andar(); }, PAUSA_CLIQUE);
      evento("passos_navegar", { passo: i + 1 });
    });
  });
  lista.addEventListener("focusin", () => { sobre = true; parar(); });
  lista.addEventListener("focusout", (e) => { if (!lista.contains(e.relatedTarget)) { sobre = false; andar(); } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) parar(); else andar(); });
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) andar(); else parar(); }, { threshold: 0.35 }).observe(lista);

  marcar(0);
}

function preencherDados() {
  const anos = new Date().getFullYear() - CONFIG.fundacao;
  document.querySelectorAll("[data-anos]").forEach((e) => { e.textContent = `${anos} anos de mercado`; });
  document.querySelectorAll("[data-telefone]").forEach((e) => { e.textContent = CONFIG.telefone; });
  document.querySelectorAll("[data-email]").forEach((e) => { e.textContent = CONFIG.email; });
  document.querySelectorAll("[data-horario]").forEach((e) => { e.textContent = CONFIG.horarioAtendimento; });
  const s = CONFIG.simulador;
  document.querySelectorAll('[data-cfg="faixa"]').forEach((e) => { e.textContent = `R$ ${rotuloMil(s.min)} a R$ ${rotuloMil(s.max)}`; });
  document.querySelectorAll('[data-cfg="tetoCurto"]').forEach((e) => { e.textContent = `R$ ${rotuloMil(s.max)}`; });
  document.querySelectorAll('[data-cfg="prazo"]').forEach((e) => { e.textContent = `Até ${Math.max(...s.prazos)}x`; });
  const rota = document.getElementById("rota");
  if (rota) rota.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONFIG.endereco)}`;
}

function provaSocial() {
  const a = CONFIG.atendente, secAtende = document.getElementById("quem-atende");
  if (secAtende && a && a.nome) {
    const foto = document.getElementById("atendenteFoto");
    foto.src = a.foto || ""; foto.alt = a.nome;
    document.getElementById("atendenteNome").textContent = a.nome;
    document.getElementById("atendenteCargo").textContent = a.cargo || "";
    document.getElementById("atendenteFrase").textContent = a.frase ? `“${a.frase}”` : "";
    secAtende.hidden = false;
  }

  const lista = document.getElementById("listaAvaliacoes"), secAval = document.getElementById("avaliacoes");
  if (secAval && lista && CONFIG.avaliacoes.length) {
    CONFIG.avaliacoes.forEach((av) => {
      const nota = Math.max(0, Math.min(5, Math.round(av.nota || 5)));
      const el = document.createElement("article");
      el.className = "avaliacao";
      el.innerHTML = `
        <p class="estrelas" aria-hidden="true"></p><p class="sr"></p>
        <p class="avaliacao-texto"></p>
        <p class="avaliacao-quem"><strong></strong><span></span></p>`;
      el.querySelector(".estrelas").textContent = "★".repeat(nota) + "☆".repeat(5 - nota);
      el.querySelector(".sr").textContent = `${nota} de 5 estrelas`;
      el.querySelector(".avaliacao-texto").textContent = av.texto;
      el.querySelector("strong").textContent = av.nome;
      el.querySelector("span").textContent = av.quando ? ` · ${av.quando}` : "";
      lista.appendChild(el);
    });
    const link = document.getElementById("linkGoogle");
    if (link && CONFIG.googleReviewsUrl) { link.href = CONFIG.googleReviewsUrl; link.hidden = false; }
    secAval.hidden = false;
  }
}

/* Onde estamos: status aberto/fechado e mapa */
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const horaBonita = (hhmm) => { const [h, m] = hhmm.split(":"); return `${Number(h)}h${m === "00" ? "" : m}`; };
const minutos = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

function agoraEmBrasilia() {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  const pega = (t) => partes.find((p) => p.type === t).value;
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(pega("weekday"));
  return { dia, min: Number(pega("hour")) * 60 + Number(pega("minute")) };
}

function statusLoja() {
  const el = document.getElementById("statusLoja"), texto = document.getElementById("statusTexto");
  if (!el || !texto) return;
  const { dia, min } = agoraEmBrasilia();
  const hoje = CONFIG.expediente.find((e) => e.dias.includes(dia));
  if (hoje && min >= minutos(hoje.abre) && min < minutos(hoje.fecha)) {
    el.classList.add("aberto");
    texto.textContent = `Aberto agora · fecha às ${horaBonita(hoje.fecha)}`;
    return;
  }
  el.classList.remove("aberto");
  for (let i = 0; i < 7; i++) {
    const d = (dia + i) % 7;
    const regra = CONFIG.expediente.find((e) => e.dias.includes(d));
    if (!regra || (i === 0 && min >= minutos(regra.abre))) continue;
    const quando = i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS[d];
    texto.textContent = `Fechado agora · abre ${quando} às ${horaBonita(regra.abre)}`;
    return;
  }
  texto.textContent = "Horário de atendimento";
}

function local() {
  statusLoja();
  setInterval(statusLoja, 60000);

  const mapa = document.getElementById("mapa");
  if (mapa) {
    const { lat, lon } = CONFIG.coordenadas;
    const d = 0.006;
    const iframe = document.createElement("iframe");
    iframe.title = "Mapa da loja no OpenStreetMap";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer";
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d * 1.3},${lat - d},${lon + d * 1.3},${lat + d}&layer=mapnik&marker=${lat},${lon}`;
    mapa.appendChild(iframe);
  }
}

function zapFlutuante() {
  const el = document.getElementById("zapFlut");
  if (!el) return;
  const checar = () => el.classList.toggle("on", window.scrollY > 400);
  window.addEventListener("scroll", checar, { passive: true });
  checar();
}

function rolagem() {
  let feito = false;
  const checar = () => {
    if (feito) return;
    const fracao = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
    if (fracao >= 0.75 && evento("rolagem_75", { percentual: 75 })) feito = true;
  };
  window.addEventListener("scroll", checar, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   9. INÍCIO
   ───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  preencherDados();
  const painel = cluster();
  const sistema = simulador(painel);
  buscaFipe(sistema);
  atualizarLinks();
  leads();
  acenderHero();
  const instrumento = document.querySelector(".cluster");
  if (instrumento && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { painel.ignicao(); io.disconnect(); } }, { threshold: 0.45 });
    io.observe(instrumento);
  } else {
    painel.ignicao();
  }
  const estrada = pista();
  faq();
  passos();
  local();
  zapFlutuante();
  rolagem();
  provaSocial();
  cookies();

  /* Somente leitura, para os testes de navegador. */
  window.aac = {
    get estado() { return { ...sim }; },
    get ponteiro() { return painel.angulo; },
    get ponteiroParado() { return painel.parado; },
    get pistaAtiva() { return estrada ? estrada.ativo : false; },
    get consentido() { return rastreio.consentido; },
  };
});

/* ═══════════════════════════════════════════════════════════
   GERADOR DAS IMAGENS DO HERO
   ═══════════════════════════════════════════════════════════

   Para que serve
   --------------
   O hero é foto de fundo cobrindo a tela inteira. Uma foto só não
   serve para todas as telas: num celular retina o navegador precisa
   de mais de 1100px de largura, num notebook retina passa de 2800px.
   Servir o arquivo grande para todo mundo desperdiça banda no celular;
   servir o pequeno para todo mundo borra no desktop. A saída é ter
   vários tamanhos e deixar o navegador escolher, via `srcset`.

   Este script recebe UM original em resolução alta e cospe todos os
   tamanhos que o site usa, em WebP. Ele NUNCA amplia: se o original
   for menor que um tamanho da lista, aquele tamanho não é gerado.
   Ampliar não cria detalhe — só inventa pixel borrado, que foi
   exatamente o problema que este arquivo existe para não repetir.

   Como usar
   ---------
     1. Salve o original em img/fonte/  (hero.jpg, hero-refinanciamento.jpg,
        hero-financiamento.jpg). É o arquivo GRANDE, direto da câmera ou
        do banco de imagens — não o que está publicado em img/.
     2. Na pasta do projeto:

          npm install sharp
          node ferramentas/imagens.mjs

     3. Confira o relatório. Se algum tamanho aparecer como "pulado",
        o original é pequeno demais e a foto vai borrar naquela tela.

   Resolução mínima do original
   ----------------------------
     hero.jpg  ->  2800px de largura para passar, 3200px para sobrar.
     Abaixo de 2400px o hero borra em notebook retina, que é a tela
     de boa parte de quem abre o site no trabalho.

   Por que dois recortes
   ---------------------
   DEITADO (paisagem) é o do desktop, onde o hero é largo e baixo.
   EM PÉ (retrato) é o do celular, onde o hero é estreito e alto: se
   o navegador tivesse que cobrir essa caixa com a foto deitada, ele
   ampliaria a imagem a mais de 3x a largura da tela só para preencher
   a altura. O recorte em pé mata essa ampliação e, de quebra, corta
   a foto num enquadramento que faz sentido no celular.
   ═══════════════════════════════════════════════════════════ */

import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = path.join(RAIZ, "img", "fonte");
const SAIDA = path.join(RAIZ, "img");

/* Larguras de saída. As deitadas cobrem de celular pequeno a notebook
   retina; as em pé só precisam dar conta da largura do celular, porque
   lá a foto não é mais ampliada para preencher altura. */
const DEITADO = [800, 1200, 1600, 2400, 3200];
const EM_PE = [600, 900, 1200];

/* Proporção do recorte em pé: 3:5. É mais alta que a tela do celular
   (~1:2,15), então o navegador ainda corta um pouco em cima e embaixo
   e nunca deixa faltar imagem nas laterais. */
const PROPORCAO_EM_PE = 3 / 5;

/* De onde o recorte em pé sai da foto deitada.
   O padrão é `atencao`: o sharp procura a região de maior saliência e corta
   em cima dela. Foi o que resolveu as duas fotos de 23/09/2026 — cortando
   sempre pela direita, a home virava um borrão da lataria em primeiro plano
   e o financiamento perdia o rosto da mulher, que é o assunto.
   Quando a escolha automática errar, fixe à mão em ANCORAS, por nome de
   arquivo sem extensão. Valores: atencao | centro | direita | esquerda. */
const ANCORA_PADRAO = "atencao";
const ANCORAS = {
  /* O rosto da mulher está a ~61% da largura. A escolha automática mirou nas
     mãos e no painel e deixou o rosto de fora — que é o assunto da foto. */
  "hero-financiamento": "centro",
  /* O carro está na direita da foto. A escolha automática mirou nos postes
     (que têm muito contraste contra o céu) e cortou o carro fora: o hero do
     celular ficava só com estrada vazia. Num site de crédito de veículo. */
  "hero": "direita",
};
const ancoraDe = (nome) => process.env.ANCORA || ANCORAS[nome] || ANCORA_PADRAO;

const QUALIDADE = 78;   /* WebP q78 é o joelho da curva: acima disso o */
                        /* arquivo cresce sem diferença visível.        */

const fmtKB = (b) => `${Math.round(b / 1024)} KB`.padStart(8);

/* Larguras que fazem sentido para este original: as da lista que cabem
   dentro dele, mais a largura nativa. A nativa entra porque, num original
   pequeno, só as da lista deixariam na mesa a pouca resolução que existe —
   uma foto de 1024px sairia publicada em 800px. */
const larguras = (lista, nativa) =>
  [...new Set([...lista.filter((w) => w < nativa), nativa])].sort((a, b) => a - b);

/* O HTML precisa saber quais tamanhos existem de verdade para montar o
   srcset. O script junta isso aqui e imprime no fim, pronto para colar. */
const gerados = { deitado: {}, emPe: {} };

async function gerar(arquivo) {
  const nome = path.basename(arquivo, path.extname(arquivo));
  const origem = sharp(path.join(FONTE, arquivo), { failOn: "none" });
  const meta = await origem.metadata();

  console.log(`\n── ${arquivo}  (${meta.width}x${meta.height})`);
  if (meta.width < 2400) {
    console.log(`   AVISO: original com ${meta.width}px de largura. Abaixo de 2400px`);
    console.log(`   o hero borra em tela retina. Os tamanhos maiores serão pulados.`);
  }

  const saidasDeitado = larguras(DEITADO, meta.width);
  for (const w of [...new Set([...DEITADO, ...saidasDeitado])].sort((a, b) => a - b)) {
    if (!saidasDeitado.includes(w)) {
      console.log(`   ${String(w).padStart(4)}w deitado   pulado (original tem só ${meta.width}px)`);
      continue;
    }
    const destino = path.join(SAIDA, `${nome}-${w}.webp`);
    await sharp(path.join(FONTE, arquivo))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toFile(destino);
    console.log(`   ${String(w).padStart(4)}w deitado ${fmtKB((await stat(destino)).size)}  ${path.basename(destino)}`);
  }
  gerados.deitado[nome] = saidasDeitado;

  /* O recorte em pé sai da foto inteira, não de um tamanho já reduzido:
     reduzir duas vezes perde nitidez à toa. */
  const alturaCheia = meta.height;
  const larguraRecorte = Math.min(meta.width, Math.round(alturaCheia * PROPORCAO_EM_PE));
  const ancora = ancoraDe(nome);
  const posicoes = {
    centro: Math.round((meta.width - larguraRecorte) / 2),
    esquerda: 0,
    direita: Math.max(0, meta.width - larguraRecorte),
  };

  /* Piso do recorte em pé. Um recorte 3:5 tem no máximo `altura × 0,6` de
     largura, então um original pequeno gera um retrato minúsculo — que no
     celular sairia MAIS borrado que a foto deitada, não menos. Abaixo de
     900px o recorte não é gerado e o celular continua na foto deitada. */
  const saidasEmPe = larguraRecorte < 900 ? [] : larguras(EM_PE, larguraRecorte);
  if (!saidasEmPe.length) {
    console.log(`   em pé      não gerado (recorte 3:5 daria ${larguraRecorte}px, abaixo do piso de 900px)`);
    console.log(`              o celular segue na foto deitada até o original crescer`);
  }
  for (const w of [...new Set([...EM_PE, ...saidasEmPe])].sort((a, b) => a - b)) {
    if (!saidasEmPe.includes(w)) {
      console.log(`   ${String(w).padStart(4)}w em pé     pulado (recorte tem só ${larguraRecorte}px)`);
      continue;
    }
    const destino = path.join(SAIDA, `${nome}-pe-${w}.webp`);
    const base = sharp(path.join(FONTE, arquivo));
    if (ancora === "atencao") {
      /* O sharp corta sozinho, na região de maior saliência. Pedimos o
         tamanho final direto, com fit cover: é ele quem decide o recorte. */
      await base
        .resize(w, Math.round(w / PROPORCAO_EM_PE), { fit: "cover", position: sharp.strategy.attention })
        .webp({ quality: QUALIDADE })
        .toFile(destino);
    } else {
      await base
        .extract({ left: posicoes[ancora], top: 0, width: larguraRecorte, height: alturaCheia })
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALIDADE })
        .toFile(destino);
    }
    console.log(`   ${String(w).padStart(4)}w em pé   ${fmtKB((await stat(destino)).size)}  ${path.basename(destino)}  (${ancora})`);
  }
  gerados.emPe[nome] = saidasEmPe;

  /* Reserva em JPEG. O <picture> serve WebP pelo <source>, mas o <img src>
     precisa de um formato que qualquer navegador abra — é ele que aparece
     nos poucos por cento que não leem WebP. Um tamanho só, 1600px: é
     reserva, não o caminho normal. Sai com o nome limpo (hero.jpg), que é
     o que o HTML referencia. */
  const reserva = path.join(SAIDA, `${nome}.jpg`);
  const larguraReserva = Math.min(1600, meta.width);
  await sharp(path.join(FONTE, arquivo))
    .resize({ width: larguraReserva, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(reserva);
  console.log(`   ${String(larguraReserva).padStart(4)}w reserva ${fmtKB((await stat(reserva)).size)}  ${path.basename(reserva)}  (JPEG, para o <img src>)`);
}

if (!existsSync(FONTE)) {
  await mkdir(FONTE, { recursive: true });
  console.log(`Criei ${path.relative(RAIZ, FONTE)}. Coloque os originais em resolução alta lá dentro e rode de novo.`);
  process.exit(0);
}

const arquivos = (await readdir(FONTE)).filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f));
if (!arquivos.length) {
  console.log(`Nenhuma imagem em ${path.relative(RAIZ, FONTE)}. Coloque os originais lá e rode de novo.`);
  process.exit(0);
}

for (const a of arquivos) await gerar(a);

/* Os srcset prontos para colar. Se o original mudar de resolução, os
   tamanhos disponíveis mudam junto — é por isso que o script imprime em
   vez de deixar a lista escrita à mão no HTML, onde ela envelheceria. */
console.log(`\n${"═".repeat(62)}\nSRCSET — confira se bate com o que está no HTML\n${"═".repeat(62)}`);
for (const nome of Object.keys(gerados.deitado)) {
  const d = gerados.deitado[nome].map((w) => `img/${nome}-${w}.webp ${w}w`).join(", ");
  const p = (gerados.emPe[nome] || []).map((w) => `img/${nome}-pe-${w}.webp ${w}w`).join(", ");
  console.log(`\n${nome}`);
  console.log(`  deitado: ${d}`);
  console.log(`  em pé:   ${p || "(nenhum — original pequeno demais para o recorte)"}`);
}
console.log(`\nOs nomes de arquivo já são os que o HTML espera. Se algum tamanho novo`);
console.log(`apareceu (porque você trocou por um original maior), acrescente-o ao`);
console.log(`srcset da página correspondente.`);

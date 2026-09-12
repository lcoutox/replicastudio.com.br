/**
 * Script manual de verificação: renderiza os dois templates com dados reais
 * (sem precisar de Postgres, R2 nem do servidor Next.js no ar) e salva o PNG
 * em disco pra inspeção visual. Não faz parte da suíte automatizada —
 * é a checagem de integração da parte que os testes unitários não cobrem
 * (Satori + resvg + fontes de verdade).
 *
 * Uso: npx tsx scripts/smoke-test-render.ts
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderizarPost } from "../src/lib/render/renderPost";
import { REPLICA_BRAND_KIT } from "../src/lib/domain/brandKit";

async function main() {
  const fotoBase = readFileSync(join(process.cwd(), "scripts/fixture-prefeitura.png"));
  const dataUrl = `data:image/png;base64,${fotoBase.toString("base64")}`;

  const pngFoto = await renderizarPost(
    { tipo: "foto", tamanho: "feed", tag: "Após corte de gastos", manicheteRaw: "Prefeitura contrata **Pocah** por R$ 80 mil", imagemFundoDataUrl: dataUrl },
    REPLICA_BRAND_KIT,
  );
  writeFileSync(join(process.cwd(), "scripts/saida-foto.png"), pngFoto);
  console.log("OK: scripts/saida-foto.png", pngFoto.length, "bytes");

  const pngCard = await renderizarPost(
    { tipo: "card", tamanho: "feed", rotulo: "Sem água, sem resposta", manchete: "Esgoto contamina poço que abastece Ripas", tema: "claro" },
    REPLICA_BRAND_KIT,
  );
  writeFileSync(join(process.cwd(), "scripts/saida-card.png"), pngCard);
  console.log("OK: scripts/saida-card.png", pngCard.length, "bytes");
}

main().catch((erro) => {
  console.error("FALHOU:", erro);
  process.exit(1);
});

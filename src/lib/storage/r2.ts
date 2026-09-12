import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

function clienteR2(): S3Client {
  // R2_ENDPOINT_LOCAL é usado só em desenvolvimento, apontando pra um MinIO
  // local (compatível com S3) em vez do Cloudflare R2 de verdade — evita
  // precisar de credencial de produção pra rodar/testar localmente. Em
  // produção essa variável não é setada e o endpoint real do R2 é usado.
  const endpointLocal = process.env.R2_ENDPOINT_LOCAL;
  const accountId = endpointLocal ? undefined : obrigatorio("R2_ACCOUNT_ID");

  return new S3Client({
    region: "auto",
    endpoint: endpointLocal ?? `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: Boolean(endpointLocal), // MinIO exige path-style; R2 aceita virtual-hosted.
    credentials: {
      accessKeyId: obrigatorio("R2_ACCESS_KEY_ID"),
      secretAccessKey: obrigatorio("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function obrigatorio(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
}

/**
 * Sobe um PNG gerado pro R2 e devolve a URL pública.
 * Escolhido no lugar de S3/disco do Railway por não cobrar taxa de egress —
 * ver docs/PRD.md seção 6.
 */
export async function subirImagem(png: Buffer, prefixo: "foto" | "card"): Promise<string> {
  const bucket = obrigatorio("R2_BUCKET");
  const urlPublica = obrigatorio("R2_PUBLIC_URL");
  const chave = `posts/${prefixo}-${randomUUID()}.png`;

  const cliente = clienteR2();
  await cliente.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: chave,
      Body: png,
      ContentType: "image/png",
    }),
  );

  return `${urlPublica.replace(/\/$/, "")}/${chave}`;
}

/**
 * Sobe um arquivo qualquer (PDF, imagem etc.) anexado como fonte na sala de
 * apuração. Mesmo bucket dos posts, prefixo próprio pra não misturar.
 */
export async function subirArquivo(conteudo: Buffer, nomeOriginal: string, contentType: string): Promise<string> {
  const bucket = obrigatorio("R2_BUCKET");
  const urlPublica = obrigatorio("R2_PUBLIC_URL");
  const extensao = nomeOriginal.includes(".") ? nomeOriginal.slice(nomeOriginal.lastIndexOf(".")) : "";
  const chave = `apuracao/${randomUUID()}${extensao}`;

  const cliente = clienteR2();
  await cliente.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: chave,
      Body: conteudo,
      ContentType: contentType,
    }),
  );

  return `${urlPublica.replace(/\/$/, "")}/${chave}`;
}

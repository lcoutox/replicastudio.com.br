/**
 * Cria o bucket no MinIO local e libera leitura pública (só pra desenvolvimento
 * — em produção o bucket público no R2 é configurado pelo painel da Cloudflare).
 */
import { S3Client, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

async function main() {
  const bucket = process.env.R2_BUCKET ?? "replica-studio-posts";
  const cliente = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT_LOCAL,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await cliente.send(new CreateBucketCommand({ Bucket: bucket })).catch((erro) => {
    if (!String(erro).includes("BucketAlreadyOwnedByYou")) throw erro;
  });

  await cliente.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Principal: "*", Action: "s3:GetObject", Resource: `arn:aws:s3:::${bucket}/*` }],
      }),
    }),
  );

  console.log(`Bucket "${bucket}" pronto no MinIO local.`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

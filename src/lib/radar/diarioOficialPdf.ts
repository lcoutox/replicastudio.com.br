import { PDFParse } from "pdf-parse";

// Portal da prefeitura bloqueia fetch sem User-Agent de navegador (mesmo
// problema documentado em monitoramento/fontes.yaml no repo `replica`).
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function buscarTexto(url: string): Promise<string> {
  const resposta = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao buscar ${url}`);
  return resposta.text();
}

/**
 * A API de dados abertos do Diário Oficial só dá o número da edição — o id
 * interno usado na URL de leitura (/ver/{id}) só existe na página de
 * listagem em HTML, sem endpoint estruturado equivalente. Isso é scraping
 * de verdade (diferente do fetch de JSON usado em fontesRemotas.ts) — mais
 * frágil a mudança de layout do site, documentado como limitação conhecida.
 */
export async function mapaEdicaoParaVerId(urlListagem: string): Promise<Map<string, string>> {
  const html = await buscarTexto(urlListagem);
  const padrao = /diario-oficial\/ver\/(\d+)"[\s\S]{0,1000}?Edição n[ºo]\s*(\d+)/g;
  const mapa = new Map<string, string>();
  for (const match of html.matchAll(padrao)) {
    const [, verId, edicao] = match;
    if (edicao && verId && !mapa.has(edicao)) mapa.set(edicao, verId);
  }
  return mapa;
}

/**
 * O link de download não aponta direto pro PDF: é um token que devolve uma
 * página HTML com meta-refresh pro arquivo estático real em /uploads/. Sem
 * seguir esse redirecionamento (que fetch() não segue sozinho — não é um
 * 3xx HTTP, é meta tag), o "download" vem como HTML, não PDF.
 */
export async function baixarPdfEdicao(urlPagina: string, verId: string): Promise<Buffer> {
  const origem = new URL(urlPagina).origin;

  const htmlVer = await buscarTexto(`${urlPagina}/ver/${verId}`);
  const tokenMatch = htmlVer.match(/href="(\/portal\/download\/diario-oficial\/[^"]+)"/);
  if (!tokenMatch) throw new Error(`Link de download não encontrado (ver/${verId}).`);

  const htmlDownload = await buscarTexto(`${origem}${tokenMatch[1]}`);
  const redirectMatch = htmlDownload.match(/url=([^"]+\.pdf)/i);
  if (!redirectMatch) throw new Error(`Redirecionamento pro PDF não encontrado (ver/${verId}).`);

  const respostaPdf = await fetch(`${origem}${redirectMatch[1]}`, { headers: { "User-Agent": USER_AGENT } });
  if (!respostaPdf.ok) throw new Error(`HTTP ${respostaPdf.status} ao baixar PDF (ver/${verId}).`);
  return Buffer.from(await respostaPdf.arrayBuffer());
}

export async function extrairTextoPdf(pdf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdf });
  const resultado = await parser.getText();
  return resultado.text;
}

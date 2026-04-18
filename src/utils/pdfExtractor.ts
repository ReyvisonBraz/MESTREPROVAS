let initialized = false;

async function initPdfjs() {
  if (initialized) return;
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
  initialized = true;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  charCount: number;
}

export async function extractTextFromPDF(file: File): Promise<PdfExtractionResult> {
  await initPdfjs();
  const pdfjsLib = await import('pdfjs-dist');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const maxPages = Math.min(pdf.numPages, 20);
  let fullText = '';

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as any[])
      .map((item: any) => item.str ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) {
      fullText += pageText + '\n\n';
    }
  }

  const trimmed = fullText.trim();
  const truncated = trimmed.substring(0, 8000);

  return {
    text: truncated,
    pageCount: maxPages,
    charCount: truncated.length,
  };
}

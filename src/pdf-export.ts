import { PDFDocument, rgb } from 'pdf-lib';
import type { AppState } from './types';

export async function exportModifiedPDF(
  state: AppState,
  originalPDFData: ArrayBuffer | null,
): Promise<Uint8Array> {
  if (!originalPDFData) {
    throw new Error('No original PDF data available');
  }

  try {
    const pdfDoc = await PDFDocument.create();

    // Load source document once for all PDF pages
    const srcDoc = await PDFDocument.load(originalPDFData);

    for (let i = 0; i < state.pages.length; i++) {
      const pageData = state.pages[i];

      if (pageData.type === 'pdf') {
        const [copiedPage] = await pdfDoc.copyPages(srcDoc, [
          pageData.pageNum - 1,
        ]);
        pdfDoc.addPage(copiedPage);
      } else if (pageData.type === 'blank') {
        const blankPage = pdfDoc.addPage([pageData.width, pageData.height]);
        blankPage.drawRectangle({
          x: 0,
          y: 0,
          width: pageData.width,
          height: pageData.height,
          color: rgb(1, 1, 1),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

export function downloadPDF(
  pdfBytes: Uint8Array,
  filename = 'modified-document.pdf',
): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

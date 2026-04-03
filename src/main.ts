import { initDragAndDrop, initFileUpload } from './pdf-loader';
import { initPageManager, resetToOriginal } from './page-manager';
import { initThumbnailView, renderThumbnails } from './thumbnail-view';
import { renderPrintPreview } from './print-preview';
import { exportModifiedPDF, downloadPDF } from './pdf-export';
import { clearCanvasCache } from './renderer';
import type { AppState, PDFData } from './types';

const state: AppState = {
  pdfDocument: null,
  originalPages: [],
  pages: [],
  pageSize: { width: 0, height: 0 },
  changeHistory: [],
  rawPDFData: null,
  originalFilename: null,
};

async function onPDFLoaded(pdfData: PDFData): Promise<void> {
  // Clear cache when loading a new PDF
  clearCanvasCache();

  state.pdfDocument = pdfData.document;
  state.pages = [...pdfData.pages];
  state.originalPages = [...pdfData.pages];
  state.pageSize = pdfData.pageSize;
  state.changeHistory = [];
  state.rawPDFData = pdfData.rawData;
  state.originalFilename = pdfData.originalFilename;

  document.getElementById('welcome-screen')!.style.display = 'none';
  document.getElementById('drop-overlay')!.classList.add('hidden');
  document.getElementById('app')!.classList.remove('hidden');

  (document.getElementById('reset-btn') as HTMLButtonElement).disabled = false;

  await updateViews(true);
}

async function updateViews(showLoading = false): Promise<void> {
  await renderPrintPreview(state, showLoading);
  await renderThumbnails();
  updateExportButton();
}

function updateExportButton(): void {
  const btn = document.getElementById('export-btn') as HTMLButtonElement;
  const hasChanges = state.changeHistory.length > 0;

  if (hasChanges) {
    btn.disabled = false;
    btn.title = '';
  } else {
    btn.disabled = true;
    btn.title = 'No changes to export';
  }
}

function handleReset(): void {
  if (confirm('Reset to original PDF? All changes will be lost.')) {
    resetToOriginal();
    updateViews();
  }
}

async function handleExport(): Promise<void> {
  const btn = document.getElementById('export-btn') as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = 'Exporting...';

  try {
    const pdfBytes = await exportModifiedPDF(state, state.rawPDFData);

    // Generate filename with suffix
    let filename = 'modified-document.pdf';
    if (state.originalFilename) {
      const nameParts = state.originalFilename.split('.');
      const extension = nameParts.pop();
      const baseName = nameParts.join('.');
      filename = `${baseName}-print-ready.${extension}`;
    }

    downloadPDF(pdfBytes, filename);
    btn.textContent = 'Download PDF';
  } catch (error) {
    console.error('Export failed:', error);
    alert(
      'Failed to export PDF: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    );
    btn.textContent = 'Download PDF';
  } finally {
    updateExportButton();
  }
}

initFileUpload(onPDFLoaded);
initDragAndDrop(onPDFLoaded);
initPageManager(state);
initThumbnailView(state, updateViews);

document.getElementById('reset-btn')!.addEventListener('click', handleReset);
document.getElementById('export-btn')!.addEventListener('click', handleExport);

console.log('PDF Editor initialized. Drop a PDF file to begin.');

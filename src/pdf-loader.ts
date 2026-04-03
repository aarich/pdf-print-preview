import * as pdfjsLib from 'pdfjs-dist';
import type { PDFData, PDFPage } from './types';

// Configure PDF.js worker and WASM files - use bundled files from npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

let dragCounter = 0;

export function initFileUpload(onPDFLoaded: (data: PDFData) => void): void {
  const uploadBtn = document.getElementById('upload-btn') as HTMLButtonElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    try {
      await loadPDF(file, onPDFLoaded);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert(
        'Failed to load PDF: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  });
}

export function initDragAndDrop(onPDFLoaded: (data: PDFData) => void): void {
  const dropOverlay = document.getElementById('drop-overlay')!;

  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      dropOverlay.classList.remove('hidden');
    }
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropOverlay.classList.add('hidden');
    }
  });

  document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.add('hidden');

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      alert('Please drop a PDF file');
      return;
    }

    try {
      await loadPDF(file, onPDFLoaded);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert(
        'Failed to load PDF: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  });
}

export async function loadPDF(
  file: File,
  onPDFLoaded?: (data: PDFData) => void,
): Promise<PDFData> {
  const arrayBuffer = await file.arrayBuffer();

  // Make a copy of the ArrayBuffer for export (PDF.js might transfer the original)
  const rawDataCopy = arrayBuffer.slice(0);

  // Use Vite's BASE_URL for proper path resolution in dev and production
  const basePath = import.meta.env.BASE_URL;

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    standardFontDataUrl: `${basePath}assets/pdfjs-dist/standard_fonts/`,
    cMapUrl: `${basePath}assets/pdfjs-dist/cmaps/`,
    cMapPacked: true,
    isEvalSupported: false,
    useSystemFonts: false,
    wasmUrl: `${basePath}assets/pdfjs-dist/wasm/`,
  });
  const pdf = await loadingTask.promise;

  const firstPage = await pdf.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1.0 });

  const pages: PDFPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    pages.push({
      type: 'pdf',
      page,
      pageNum: i,
    });
  }

  const pdfData: PDFData = {
    document: pdf,
    pages,
    pageSize: {
      width: viewport.width,
      height: viewport.height,
    },
    rawData: rawDataCopy,
    originalFilename: file.name,
  };

  if (onPDFLoaded) {
    onPDFLoaded(pdfData);
  }

  return pdfData;
}

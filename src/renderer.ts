import type { PDFPageProxy } from 'pdfjs-dist';
import type { PageData } from './types';

// Canvas cache to avoid re-rendering the same pages
const canvasCache = new Map<string, HTMLCanvasElement>();

function getCacheKey(pageData: PageData, scale: number): string {
  if (pageData.type === 'blank') {
    return `blank-${pageData.id}-${scale}`;
  } else {
    return `pdf-${pageData.pageNum}-${scale}`;
  }
}

export async function renderPDFPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale = 1.0,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  };

  try {
    await page.render(renderContext as any).promise;
    return canvas;
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    throw error;
  }
}

export function renderBlankPage(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  scale = 1.0,
): HTMLCanvasElement {
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function renderPageToCanvas(
  pageData: PageData,
  scale = 1.0,
  useCache = true,
): Promise<HTMLCanvasElement> {
  // Check cache first
  const cacheKey = getCacheKey(pageData, scale);
  if (useCache && canvasCache.has(cacheKey)) {
    // Return a clone of the cached canvas
    const cached = canvasCache.get(cacheKey)!;
    const clone = document.createElement('canvas');
    clone.width = cached.width;
    clone.height = cached.height;
    const ctx = clone.getContext('2d');
    if (ctx) {
      ctx.drawImage(cached, 0, 0);
    }
    return clone;
  }

  const canvas = document.createElement('canvas');

  if (pageData.type === 'blank') {
    renderBlankPage(canvas, pageData.width, pageData.height, scale);
  } else if (pageData.type === 'pdf') {
    await renderPDFPage(pageData.page, canvas, scale);
  } else {
    throw new Error('Unknown page type');
  }

  // Cache the result (make a copy)
  if (useCache) {
    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = canvas.width;
    cacheCanvas.height = canvas.height;
    const cacheCtx = cacheCanvas.getContext('2d');
    if (cacheCtx) {
      cacheCtx.drawImage(canvas, 0, 0);
    }
    canvasCache.set(cacheKey, cacheCanvas);
  }

  return canvas;
}

export function clearCanvasCache(): void {
  canvasCache.clear();
}

import { renderPageToCanvas } from './renderer';
import type { AppState } from './types';

// Note: This file appears to be unused - the app uses print-preview.ts instead
let state: (AppState & { currentPageIndex?: number }) | null = null;

export function initSpreadView(
  appState: AppState & { currentPageIndex?: number },
): void {
  state = appState;

  document
    .getElementById('prev-btn')!
    .addEventListener('click', () => navigatePrev());
  document
    .getElementById('next-btn')!
    .addEventListener('click', () => navigateNext());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigatePrev();
    if (e.key === 'ArrowRight') navigateNext();
  });
}

export async function renderSpread(
  pageIndex: number | null = null,
): Promise<void> {
  if (!state) return;

  if (pageIndex !== null) {
    state.currentPageIndex = pageIndex;
  }

  // Clamp to valid range
  state.currentPageIndex = Math.max(
    0,
    Math.min(state.currentPageIndex ?? 0, state.pages.length - 1),
  );

  const container = document.getElementById('spread-container')!;
  container.innerHTML = '';

  // Determine which pages to show
  let pageIndices: number[] = [];
  if (state.currentPageIndex === 0) {
    // Show page 0 alone (cover page)
    pageIndices = [0];
  } else {
    // Show two-page spread
    // currentPageIndex should always be odd (1, 3, 5, ...) for spread starts
    const leftPage = state.currentPageIndex;
    const rightPage = state.currentPageIndex + 1;

    if (leftPage < state.pages.length) pageIndices.push(leftPage);
    if (rightPage < state.pages.length) pageIndices.push(rightPage);
  }

  for (const idx of pageIndices) {
    const pageData = state.pages[idx];
    try {
      const canvas = await renderPageToCanvas(pageData, 1.0);
      canvas.classList.add('spread-page');
      container.appendChild(canvas);
    } catch (error) {
      console.error(`Error rendering page ${idx}:`, error);
    }
  }

  updateControls();
}

function navigateNext(): void {
  if (!state) return;

  const currentPageIndex = state.currentPageIndex ?? 0;
  let nextPage: number;
  if (currentPageIndex === 0) {
    // From cover to first spread
    nextPage = 1;
  } else {
    // Jump to next spread (skip 2 pages)
    nextPage = currentPageIndex + 2;
  }

  if (nextPage < state.pages.length) {
    renderSpread(nextPage);
  }
}

function navigatePrev(): void {
  if (!state) return;

  const currentPageIndex = state.currentPageIndex ?? 0;
  let prevPage: number;
  if (currentPageIndex === 1) {
    // From first spread back to cover
    prevPage = 0;
  } else if (currentPageIndex > 1) {
    // Jump to previous spread
    prevPage = currentPageIndex - 2;
  } else {
    return; // Already at beginning
  }

  renderSpread(prevPage);
}

function updateControls(): void {
  if (!state) return;

  const currentPageIndex = state.currentPageIndex ?? 0;

  // Disable prev if at start
  (document.getElementById('prev-btn') as HTMLButtonElement).disabled =
    currentPageIndex === 0;

  // Disable next if at or past last spread
  const nextPage = currentPageIndex === 0 ? 1 : currentPageIndex + 2;
  (document.getElementById('next-btn') as HTMLButtonElement).disabled =
    nextPage >= state.pages.length;

  // Update page info display
  let pageInfo = '';
  if (currentPageIndex === 0) {
    pageInfo = `Page 1 of ${state.pages.length}`;
  } else {
    const leftPage = currentPageIndex + 1; // +1 for 1-based display
    const rightPage = currentPageIndex + 2;
    if (rightPage <= state.pages.length) {
      pageInfo = `Pages ${leftPage}-${rightPage} of ${state.pages.length}`;
    } else {
      pageInfo = `Page ${leftPage} of ${state.pages.length}`;
    }
  }

  document.getElementById('page-info')!.textContent = pageInfo;
}

export function jumpToPage(pageIndex: number): void {
  if (!state) return;

  // Calculate which spread page to show
  let spreadStartPage;
  if (pageIndex === 0) {
    spreadStartPage = 0;
  } else if (pageIndex % 2 === 1) {
    // Odd page index - this is a spread start
    spreadStartPage = pageIndex;
  } else {
    // Even page index - go to previous odd page (spread start)
    spreadStartPage = pageIndex - 1;
  }

  renderSpread(spreadStartPage);
}

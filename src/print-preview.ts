import { renderPageToCanvas } from './renderer';
import type { AppState } from './types';

// Display scale for preview - lower = faster rendering, still looks good on screen
const PREVIEW_SCALE = 0.65;

// Initial render batch size - render this many spreads immediately
const INITIAL_RENDER_BATCH = 5;

function showLoading(): void {
  const loadingEl = document.getElementById('loading-indicator');
  const progressEl = document.getElementById('loading-progress') as HTMLElement;
  if (loadingEl) {
    loadingEl.classList.remove('hidden');
    if (progressEl) progressEl.style.width = '0%';
  }
}

function updateLoadingProgress(percent: number): void {
  const progressEl = document.getElementById('loading-progress') as HTMLElement;
  if (progressEl) {
    progressEl.style.width = `${percent}%`;
  }
}

function hideLoading(): void {
  const loadingEl = document.getElementById('loading-indicator');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
  }
}

export async function renderPrintPreview(
  state: AppState,
  showLoadingIndicator = true,
): Promise<void> {
  if (!state) return;

  if (showLoadingIndicator) {
    showLoading();
  }

  const container = document.getElementById('spread-container')!;
  container.innerHTML = '';
  container.classList.add('print-preview-mode');

  // Calculate number of spreads (first spread has blank + page 1)
  const numSpreads = Math.ceil((state.pages.length + 1) / 2);

  // Determine how many spreads to render initially
  const initialBatch = showLoadingIndicator
    ? Math.min(INITIAL_RENDER_BATCH, numSpreads)
    : numSpreads;

  // Render initial batch
  for (let spreadNum = 1; spreadNum <= initialBatch; spreadNum++) {
    await renderSpread(spreadNum, state, container);

    if (showLoadingIndicator) {
      const progress = (spreadNum / numSpreads) * 100;
      updateLoadingProgress(progress);
    }
  }

  // Always show progress for remaining spreads (even if not showing loading for initial)
  if (initialBatch < numSpreads) {
    showLoading();
    updateLoadingProgress((initialBatch / numSpreads) * 100);

    // Render remaining spreads asynchronously after initial batch
    const renderRemaining = async () => {
      for (
        let spreadNum = initialBatch + 1;
        spreadNum <= numSpreads;
        spreadNum++
      ) {
        await renderSpread(spreadNum, state, container);

        // Update progress
        const progress = (spreadNum / numSpreads) * 100;
        updateLoadingProgress(progress);
      }

      // Hide when complete
      hideLoading();
    };

    // Start rendering after a short delay to let the UI settle
    setTimeout(renderRemaining, 100);
  } else {
    // All done, hide loading
    if (showLoadingIndicator) {
      hideLoading();
    }
  }
}

async function renderSpread(
  spreadNum: number,
  state: AppState,
  container: HTMLElement,
): Promise<void> {
  const spreadDiv = document.createElement('div');
  spreadDiv.className = 'spread';

  const spreadLabel = document.createElement('div');
  spreadLabel.className = 'spread-label';
  spreadLabel.textContent = `Spread ${spreadNum}`;
  spreadDiv.appendChild(spreadLabel);

  const pagesContainer = document.createElement('div');
  pagesContainer.className = 'spread-pages';

  // Left page
  let leftPageIdx: number | null;
  let rightPageIdx: number;

  if (spreadNum === 1) {
    leftPageIdx = null; // blank for first spread
    rightPageIdx = 0;
  } else {
    leftPageIdx = spreadNum * 2 - 3;
    rightPageIdx = spreadNum * 2 - 2;
  }

  // Render left page
  const leftPageWrapper = document.createElement('div');
  leftPageWrapper.className = 'page-wrapper';

  if (leftPageIdx === null) {
    // Leave empty wrapper for spacing
    leftPageWrapper.classList.add('page-empty');
  } else if (leftPageIdx < state.pages.length) {
    const canvas = await renderPageToCanvas(
      state.pages[leftPageIdx],
      PREVIEW_SCALE,
    );
    canvas.classList.add('page-canvas');
    leftPageWrapper.appendChild(canvas);

    const pageNum = document.createElement('div');
    pageNum.className = 'page-number';
    pageNum.textContent = `Page ${leftPageIdx + 1}`;
    leftPageWrapper.appendChild(pageNum);
  }

  pagesContainer.appendChild(leftPageWrapper);

  // Render right page
  const rightPageWrapper = document.createElement('div');
  rightPageWrapper.className = 'page-wrapper';

  if (rightPageIdx < state.pages.length) {
    const canvas = await renderPageToCanvas(
      state.pages[rightPageIdx],
      PREVIEW_SCALE,
    );
    canvas.classList.add('page-canvas');
    rightPageWrapper.appendChild(canvas);

    const pageNum = document.createElement('div');
    pageNum.className = 'page-number';
    pageNum.textContent = `Page ${rightPageIdx + 1}`;
    rightPageWrapper.appendChild(pageNum);
  } else {
    // Leave empty wrapper for spacing
    rightPageWrapper.classList.add('page-empty');
  }

  pagesContainer.appendChild(rightPageWrapper);

  spreadDiv.appendChild(pagesContainer);
  container.appendChild(spreadDiv);
}

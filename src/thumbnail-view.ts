import { renderPageToCanvas } from './renderer';
import { insertBlankPage, deletePage } from './page-manager';
import type { AppState } from './types';

let state: AppState | null = null;
let onUpdate: (() => void) | null = null;

export function initThumbnailView(
  appState: AppState,
  updateCallback: () => void,
): void {
  state = appState;
  onUpdate = updateCallback;
}

export async function renderThumbnails(): Promise<void> {
  if (!state) return;

  const container = document.getElementById('thumbnail-list')!;
  container.innerHTML = '';

  for (let i = 0; i < state.pages.length; i++) {
    const pageData = state.pages[i];
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    thumbnailItem.dataset.index = String(i);

    const insertBtn = document.createElement('button');
    insertBtn.className = 'insert-btn';
    insertBtn.textContent = '+';
    insertBtn.title = 'Insert blank page before';
    insertBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleInsert(i);
    });

    const thumbnailWrapper = document.createElement('div');
    thumbnailWrapper.className = 'thumbnail-wrapper';

    try {
      const canvas = await renderPageToCanvas(pageData, 0.3);
      canvas.classList.add('thumbnail-canvas');
      thumbnailWrapper.appendChild(canvas);
    } catch (error) {
      console.error(`Error rendering thumbnail ${i}:`, error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'thumbnail-error';
      errorDiv.textContent = 'Error';
      thumbnailWrapper.appendChild(errorDiv);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete page';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDelete(i);
    });

    thumbnailWrapper.appendChild(deleteBtn);

    const pageLabel = document.createElement('div');
    pageLabel.className = 'page-label';
    pageLabel.textContent = `${i + 1}`;
    if (pageData.type === 'blank') {
      pageLabel.textContent += ' (blank)';
    }

    thumbnailItem.appendChild(insertBtn);
    thumbnailItem.appendChild(thumbnailWrapper);
    thumbnailItem.appendChild(pageLabel);

    container.appendChild(thumbnailItem);
  }

  const finalInsertBtn = document.createElement('button');
  finalInsertBtn.className = 'insert-btn final-insert';
  finalInsertBtn.textContent = '+';
  finalInsertBtn.addEventListener('click', () => {
    if (state) handleInsert(state.pages.length);
  });
  container.appendChild(finalInsertBtn);

  updatePageStats();
}

function updatePageStats(): void {
  if (!state) return;

  const totalPages = state.pages.length;
  const physicalSheets = Math.ceil(totalPages / 2);
  const blankPages = state.pages.filter((p) => p.type === 'blank').length;

  const statsEl = document.getElementById('page-stats');
  if (statsEl) {
    let statsText = `${totalPages} page${totalPages !== 1 ? 's' : ''} | ${physicalSheets} sheet${physicalSheets !== 1 ? 's' : ''}`;
    if (blankPages > 0) {
      statsText += ` | ${blankPages} blank`;
    }
    statsEl.textContent = statsText;
  }
}

function handleInsert(position: number): void {
  insertBlankPage(position);
  if (onUpdate) onUpdate();
}

function handleDelete(position: number): void {
  deletePage(position);
  if (onUpdate) onUpdate();
}

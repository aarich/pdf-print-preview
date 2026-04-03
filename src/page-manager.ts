import type { AppState, BlankPage, PageData } from './types';

let state: AppState | null = null;

export function initPageManager(appState: AppState): void {
  state = appState;
}

export function insertBlankPage(position: number): BlankPage | undefined {
  if (!state) return;

  const blankPage: BlankPage = {
    type: 'blank',
    width: state.pageSize.width,
    height: state.pageSize.height,
    id: `blank-${Date.now()}-${Math.random()}`,
  };

  state.pages.splice(position, 0, blankPage);

  state.changeHistory.push({
    type: 'insert',
    position,
    pageData: blankPage,
  });

  return blankPage;
}

export function deletePage(position: number): PageData | undefined {
  if (!state || position < 0 || position >= state.pages.length) return;

  const deletedPage = state.pages[position];
  state.pages.splice(position, 1);

  state.changeHistory.push({
    type: 'delete',
    position,
    pageData: deletedPage,
  });

  return deletedPage;
}

export function resetToOriginal(): void {
  if (!state) return;

  state.pages = [...state.originalPages];
  state.changeHistory = [];
}

export function undo(): void {
  if (!state || state.changeHistory.length === 0) return;

  const lastChange = state.changeHistory.pop();
  if (!lastChange) return;

  if (lastChange.type === 'insert') {
    state.pages.splice(lastChange.position, 1);
  } else if (lastChange.type === 'delete') {
    state.pages.splice(lastChange.position, 0, lastChange.pageData);
  }
}

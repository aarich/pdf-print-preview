import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface PageSize {
  width: number;
  height: number;
}

export interface PDFPage {
  type: 'pdf';
  page: PDFPageProxy;
  pageNum: number;
}

export interface BlankPage {
  type: 'blank';
  width: number;
  height: number;
  id: string;
}

export type PageData = PDFPage | BlankPage;

export interface ChangeHistoryItem {
  type: 'insert' | 'delete';
  position: number;
  pageData: PageData;
}

export interface AppState {
  pdfDocument: PDFDocumentProxy | null;
  originalPages: PageData[];
  pages: PageData[];
  pageSize: PageSize;
  changeHistory: ChangeHistoryItem[];
  rawPDFData: ArrayBuffer | null;
  originalFilename: string | null;
}

export interface PDFData {
  document: PDFDocumentProxy;
  pages: PageData[];
  pageSize: PageSize;
  rawData: ArrayBuffer;
  originalFilename: string;
}

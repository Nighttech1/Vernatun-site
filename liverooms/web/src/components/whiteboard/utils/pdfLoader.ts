import type { Editor } from 'tldraw';

/** Render PDF page to PNG data URL via pdfjs. */
export async function pdfPageToDataUrl(
  file: File | ArrayBuffer,
  pageNumber: number,
): Promise<{ dataUrl: string; pageCount: number; width: number; height: number }> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const data = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pageCount = doc.numPages;
  const page = await doc.getPage(Math.min(Math.max(1, pageNumber), pageCount));
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return {
    dataUrl,
    pageCount,
    width: viewport.width,
    height: viewport.height,
  };
}

/** Place PDF page image on canvas center (resizable, not locked). */
export async function placePdfPage(
  editor: Editor,
  dataUrl: string,
  w: number,
  h: number,
): Promise<string> {
  const maxW = 720;
  const scale = w > maxW ? maxW / w : 1;
  const center = editor.getViewportPageBounds().center;
  const before = new Set(editor.getCurrentPageShapeIds());

  await editor.putExternalContent({
    type: 'url',
    url: dataUrl,
    point: center,
  });

  const after = editor.getCurrentPageShapes();
  const latest = [...after]
    .reverse()
    .find((s) => s.type === 'image' && !before.has(s.id));
  if (latest) {
    editor.updateShape({
      id: latest.id,
      type: 'image',
      isLocked: false,
      props: {
        ...(latest.props as object),
        w: w * scale,
        h: h * scale,
      },
    } as never);
    (window as unknown as { __vernatunPdfShapeId?: string }).__vernatunPdfShapeId =
      latest.id;
    return latest.id;
  }
  return '';
}

/** @deprecated use placePdfPage — kept for PdfPageNav imports */
export const placeLockedPdfPage = placePdfPage;

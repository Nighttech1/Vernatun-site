import { useEffect, useRef } from 'react';
import { useEditor } from 'tldraw';
import { pdfPageToDataUrl, placeLockedPdfPage } from './utils/pdfLoader';
import { canUseTool, type BoardRole } from './utils/boardRoles';

type Props = {
  role: BoardRole;
  page: number;
  pageCount: number;
  remotePage?: number | null;
  onPageChange: (page: number) => void;
};

export function PdfPageNav({
  role,
  page,
  pageCount,
  remotePage = null,
  onPageChange,
}: Props) {
  const editor = useEditor();
  const applyingRemote = useRef(false);

  const go = async (next: number, fromRemote = false) => {
    if (!fromRemote && !canUseTool(role, 'media') && role !== 'host') return;
    const buf = (window as unknown as { __vernatunPdfBuf?: ArrayBuffer })
      .__vernatunPdfBuf;
    if (!buf) return;
    const p = Math.min(Math.max(1, next), pageCount || next);
    const { dataUrl, width, height, pageCount: total } = await pdfPageToDataUrl(
      buf,
      p,
    );
    const locked = editor
      .getCurrentPageShapes()
      .filter((s) => {
        const pdfId = (
          window as unknown as { __vernatunPdfShapeId?: string }
        ).__vernatunPdfShapeId;
        return s.type === 'image' && (s.id === pdfId || s.isLocked);
      });
    if (locked.length) {
      editor.updateShapes(
        locked.map((s) => ({ id: s.id, type: s.type, isLocked: false })),
      );
      editor.deleteShapes(locked.map((s) => s.id));
    }
    await placeLockedPdfPage(editor, dataUrl, width, height);
    (
      window as unknown as { __vernatunPdfMeta?: { page: number; pageCount: number } }
    ).__vernatunPdfMeta = { page: p, pageCount: total };
    if (!fromRemote) onPageChange(p);
  };

  useEffect(() => {
    if (remotePage == null || remotePage === page || pageCount < 1) return;
    if (applyingRemote.current) return;
    applyingRemote.current = true;
    void go(remotePage, true).finally(() => {
      applyingRemote.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only on remote page
  }, [remotePage]);

  if (pageCount < 1) return null;

  return (
    <div className="wb-pdf-nav-dock">
      <div className="wb-pdf-nav-island">
        <button
          type="button"
          className="wb-pdf-nav-btn"
          disabled={page <= 1 || role === 'listener'}
          onClick={() => void go(page - 1)}
        >
          ◀
        </button>
        <span>
          Страница {page} из {pageCount}
        </span>
        <button
          type="button"
          className="wb-pdf-nav-btn"
          disabled={page >= pageCount || role === 'listener'}
          onClick={() => void go(page + 1)}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

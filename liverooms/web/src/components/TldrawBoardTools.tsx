import { useEditor, useValue } from 'tldraw';

const TOOLS = [
  { id: 'select', label: 'Стрелка' },
  { id: 'draw', label: 'Карандаш' },
  { id: 'text', label: 'Текст' },
] as const;

/** Custom tldraw tools — Tailwind (tw-*) panel, top-left. */
export function TldrawBoardTools() {
  const editor = useEditor();
  const current = useValue(
    'tool',
    () => editor.getCurrentToolId(),
    [editor],
  );

  return (
    <div
      className="tw-absolute tw-left-4 tw-top-4 tw-z-[300] tw-flex tw-gap-2"
      role="toolbar"
      aria-label="Инструменты доски"
    >
      {TOOLS.map((t) => {
        const active = current === t.id;
        return (
          <button
            key={t.id}
            type="button"
            className={
              active
                ? 'tw-rounded-lg tw-border tw-border-[#c25e28] tw-bg-[#c25e28] tw-px-3 tw-py-2 tw-text-sm tw-font-bold tw-text-white tw-shadow-md'
                : 'tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-bold tw-text-[#2a5a84] tw-shadow-md hover:tw-bg-slate-50'
            }
            aria-pressed={active}
            onClick={() => editor.setCurrentTool(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

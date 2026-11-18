import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

export type VernatunSelectOption = {
  value: string;
  label: string;
};

type Props = {
  id?: string;
  className?: string;
  value: string;
  options: VernatunSelectOption[];
  disabled?: boolean;
  'aria-label'?: string;
  onChange: (value: string) => void;
};

/**
 * C-251: custom select — open list matches trigger width + rounded corners.
 * Native &lt;select&gt; popup cannot be styled on Windows Chrome.
 */
export function VernatunSelect({
  id,
  className = '',
  value,
  options,
  disabled,
  onChange,
  'aria-label': ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: Event) => {
      if ((e as globalThis.KeyboardEvent).key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const pick = useCallback(
    (v: string) => {
      onChange(v);
      setOpen(false);
    },
    [onChange],
  );

  const onTriggerKey = (e: KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`vernatun-select-wrap${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        id={id}
        className="report-dialog-select vernatun-select vernatun-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        <span className="vernatun-select-trigger-label">
          {selected?.label || '—'}
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          className="vernatun-select-panel"
          role="listbox"
          aria-activedescendant={
            selected ? `${listId}-${selected.value}` : undefined
          }
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${o.value}`}
                  role="option"
                  aria-selected={active}
                  className={`vernatun-select-option${active ? ' is-active' : ''}`}
                  onClick={() => pick(o.value)}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/** The handful of shapes every screen is built from. */

import { useEffect, useRef, type ReactNode } from 'react';

interface HeaderProps {
  kicker: string;
  meta?: string;
  title: string;
  onBack?: () => void;
  /** Data is still arriving. Shown instead of `meta`, never as a blocking state. */
  syncing?: boolean;
}

export function Header({ kicker, meta, title, onBack, syncing = false }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-top">
        <span className="t-label header-kicker">{kicker}</span>
        {onBack ? (
          <button className="btn btn-inline btn-quiet" onClick={onBack}>
            Back
          </button>
        ) : syncing ? (
          <span className="t-meta syncing">Syncing…</span>
        ) : (
          meta && <span className="t-meta">{meta}</span>
        )}
      </div>
      <h1 className="t-title">{title}</h1>
    </header>
  );
}

type ButtonVariant = 'accent' | 'solid' | 'quiet' | 'outline' | 'danger';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  /** Renders small and inline rather than full-width. */
  inline?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onClick,
  variant = 'outline',
  inline = false,
  disabled = false,
}: ButtonProps) {
  const classes = ['btn'];
  if (variant !== 'outline') classes.push(`btn-${variant}`);
  if (inline) classes.push('btn-inline');

  return (
    <button className={classes.join(' ')} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

interface GroupHeadProps {
  label: string;
  meta?: string;
  /** Closes the section above with a rule. */
  ruleAbove?: boolean;
  /** Pastel keyed to the group — see toneFor. */
  tone?: string;
  /** Dimmed slightly: the group has nothing in it yet. */
  isVacant?: boolean;
  /** A control belonging to this group — the shopping list's add-to-aisle +. */
  action?: { label: string; title: string; isOn?: boolean; onClick: () => void };
}

export function GroupHead({
  label,
  meta,
  ruleAbove = false,
  tone,
  isVacant = false,
  action,
}: GroupHeadProps) {
  const classes = ['group-head'];
  if (ruleAbove) classes.push('rule-above');
  if (tone) classes.push(`tone-${tone}`);
  if (isVacant) classes.push('is-vacant');

  return (
    <div className={classes.join(' ')}>
      <span className="t-label">{label}</span>
      <span className="group-head-right">
        {meta && <span className="t-meta">{meta}</span>}
        {action && (
          <button
            className={action.isOn ? 'group-add is-on' : 'group-add'}
            onClick={action.onClick}
            title={action.title}
            aria-label={action.title}
            aria-expanded={action.isOn ?? false}
          >
            {action.label}
          </button>
        )}
      </span>
    </div>
  );
}

/**
 * Closes an overlay on Escape and on the browser's Back gesture.
 *
 * Back is the natural way to dismiss a sheet on a phone, and without this it
 * would leave the app entirely. One history entry is pushed while the sheet is
 * open and popped again if it closes some other way, so the stack stays level.
 *
 * `onClose` is held in a ref rather than being an effect dependency: callers
 * pass an inline arrow, and depending on it would push a fresh history entry on
 * every render.
 */
function useDismiss(isOpen: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    let ourEntry = true;
    const openedAt = Date.now();
    window.history.pushState({ overlay: true }, '');

    function onPop() {
      // A real Back gesture cannot arrive in the same breath as the tap that
      // opened the sheet. Some WebViews echo a popstate straight after
      // pushState, which would slam the sheet shut the instant it appeared —
      // indistinguishable, to the person tapping, from nothing happening.
      if (Date.now() - openedAt < 250) return;

      ourEntry = false; // Back already consumed our entry.
      close.current();
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close.current();
    }

    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);

      // Closed by the button or the scrim: drop the entry we added, so Back
      // doesn't have to be pressed twice to leave the screen.
      //
      // Only when our entry is still the current one. Switching tabs with a
      // sheet open unmounts it *after* the new screen was pushed, and going
      // back there would undo the navigation the user just asked for.
      const onTop = (window.history.state as { overlay?: boolean } | null)?.overlay;
      if (ourEntry && onTop) window.history.back();
    };
  }, [isOpen]);
}

interface SheetProps {
  isOpen: boolean;
  kicker: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A bottom sheet. Closes on the scrim, Escape, or Back — never on the panel. */
export function Sheet({ isOpen, kicker, title, onClose, children }: SheetProps) {
  useDismiss(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="sheet-scrim" onClick={onClose} role="presentation">
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sheet-grip" />
        <div className="sheet-head">
          <div>
            <p className="t-label header-kicker">{kicker}</p>
            <h2 className="t-overlay">{title}</h2>
          </div>
          <button className="btn btn-inline btn-quiet" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ErrorState({ what }: { what: string }) {
  return (
    <div className="centered">
      <div>
        <p className="t-meal-sm">Could not load your {what}.</p>
        <p className="t-sec">Check your connection and try again.</p>
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="centered">
      <p className="t-label">Loading…</p>
    </div>
  );
}

interface WeekNavProps {
  label: string;
  /** Weeks away from the current one. 0 is this week. */
  offset: number;
  onShift: (by: number) => void;
  onReset: () => void;
}

/**
 * Step between weeks.
 *
 * The app used to be pinned to the current week, which made Sunday a dead end —
 * the week was over and there was no way to reach the next one.
 */
export function WeekNav({ label, offset, onShift, onReset }: WeekNavProps) {
  const relative =
    offset === 0 ? 'This week'
      : offset === 1 ? 'Next week'
        : offset === -1 ? 'Last week'
          : offset > 0 ? `In ${offset} weeks`
            : `${Math.abs(offset)} weeks ago`;

  return (
    <div className="week-nav">
      <button
        className="week-step"
        onClick={() => onShift(-1)}
        aria-label="Previous week"
        title="Previous week"
      >
        ‹
      </button>

      <button
        className="week-now"
        onClick={onReset}
        disabled={offset === 0}
        title={offset === 0 ? undefined : 'Back to this week'}
      >
        <span className="t-label week-now-rel">{relative}</span>
        <span className="t-meta">{label}</span>
      </button>

      <button
        className="week-step"
        onClick={() => onShift(1)}
        aria-label="Next week"
        title="Next week"
      >
        ›
      </button>
    </div>
  );
}

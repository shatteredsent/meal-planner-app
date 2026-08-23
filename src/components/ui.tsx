/** The handful of shapes every screen is built from. */

import type { ReactNode } from 'react';

interface HeaderProps {
  kicker: string;
  meta?: string;
  title: string;
  onBack?: () => void;
}

export function Header({ kicker, meta, title, onBack }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-top">
        <span className="t-label header-kicker">{kicker}</span>
        {onBack ? (
          <button className="btn btn-inline btn-quiet" onClick={onBack}>
            Back
          </button>
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
  /** Closes the section above with a 2px rule. */
  ruleAbove?: boolean;
  /** A control that belongs to this group — the shopping list's add-to-aisle +. */
  action?: { label: string; title: string; isOn?: boolean; onClick: () => void };
}

export function GroupHead({ label, meta, ruleAbove = false, action }: GroupHeadProps) {
  return (
    <div className={ruleAbove ? 'group-head rule-above' : 'group-head'}>
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

interface SheetProps {
  isOpen: boolean;
  kicker: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A bottom sheet. Tapping the scrim closes it; the panel itself doesn't. */
export function Sheet({ isOpen, kicker, title, onClose, children }: SheetProps) {
  if (!isOpen) return null;

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
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

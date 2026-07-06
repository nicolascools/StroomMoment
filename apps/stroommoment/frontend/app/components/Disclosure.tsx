import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Collapsible secondary section: keeps nerd/data content available without dominating the page.
export function Disclosure({ title, subtitle, defaultOpen = false, children }: Props) {
  return (
    <details className="card disclosure" open={defaultOpen}>
      <summary>
        <span className="disclosure-titles">
          <span className="disclosure-title">{title}</span>
          {subtitle ? <span className="disclosure-subtitle">{subtitle}</span> : null}
        </span>
        <span aria-hidden="true" className="disclosure-chevron">
          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

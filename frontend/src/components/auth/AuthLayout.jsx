const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l8 3v6c0 5-3.4 8.6-8 11-4.6-2.4-8-6-8-11V5z" />
  </svg>
);

/** Page shell shared by all public auth screens. */
export default function AuthLayout({ title, subtitle, wide = false, footer, children }) {
  return (
    <main className="auth-page">
      <div className={`auth-shell ${wide ? "auth-shell--wide" : ""}`}>
        <div className="auth-brand">
          <span className="auth-brand__mark"><ShieldIcon /></span>
          <span className="auth-brand__name">Account Access</span>
        </div>
        <section className="auth-card" aria-labelledby="auth-title">
          <header className="auth-card__header">
            <h1 id="auth-title" className="auth-card__title">{title}</h1>
            {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          </header>
          {children}
        </section>
        {footer && <p className="auth-footer">{footer}</p>}
      </div>
    </main>
  );
}

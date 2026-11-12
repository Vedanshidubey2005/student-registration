export default function Button({
  children,
  loading = false,
  loadingText,
  variant = "primary", // primary | secondary | link
  type = "button",
  fullWidth = false,
  disabled = false,
  className = "",
  ...rest
}) {
  const classes = ["btn", `btn--${variant}`, fullWidth ? "btn--block" : "", className].filter(Boolean).join(" ");
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner spinner--sm" aria-hidden="true" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}

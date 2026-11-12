import { forwardRef, useId } from "react";

/**
 * Labelled text input with hint + error text wired up via aria-describedby.
 * Compatible with react-hook-form's register() and Controller (forwards the ref).
 */
const Input = forwardRef(function Input(
  { label, error, hint, required = false, endAdornment, className = "", id, "aria-describedby": extraDescribedBy, ...rest },
  ref
) {
  const autoId = useId().replace(/:/g, "");
  const inputId = id || `field-${autoId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const showHint = Boolean(hint) && !error;
  const describedBy = [error ? errorId : null, showHint ? hintId : null, extraDescribedBy].filter(Boolean).join(" ");

  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`.trim()}>
      <label htmlFor={inputId} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {" "}*
          </span>
        )}
      </label>
      <div className="field__control">
        <input
          ref={ref}
          id={inputId}
          className={`field__input ${endAdornment ? "field__input--with-adornment" : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy || undefined}
          aria-required={required || undefined}
          {...rest}
        />
        {endAdornment}
      </div>
      {showHint && (
        <p id={hintId} className="field__hint" aria-live="polite">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error" role="alert">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;

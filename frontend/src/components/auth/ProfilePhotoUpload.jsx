import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { validateImageFile } from "../../validation/authSchemas";

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * Reusable image picker. Controlled: value is a File (or null), onChange(file|null).
 * Nothing is uploaded - the File stays in form state until the form builds its FormData.
 * Works with react-hook-form's <Controller>.
 */
const ProfilePhotoUpload = forwardRef(function ProfilePhotoUpload(
  { value = null, onChange, error, disabled = false, className = "" },
  ref
) {
  const inputRef = useRef(null);
  const inputId = `photo-${useId().replace(/:/g, "")}`;
  const messageId = `${inputId}-message`;
  const [previewUrl, setPreviewUrl] = useState(null);
  const [localError, setLocalError] = useState("");

  // Create/revoke the preview URL; clear the native input when the value is removed.
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const setRefs = (node) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const message = validateImageFile(file);
    if (message) {
      setLocalError(message);
      event.target.value = "";
      onChange?.(null);
      return;
    }
    setLocalError("");
    onChange?.(file);
  };

  const handleRemove = () => {
    setLocalError("");
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const message = localError || error;

  return (
    <div className={`field upload ${message ? "field--error" : ""} ${className}`.trim()}>
      <span className="field__label">
        Profile photo <span className="field__optional">(optional)</span>
      </span>

      <input
        ref={setRefs}
        id={inputId}
        type="file"
        className="upload__input"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={message ? messageId : undefined}
        aria-invalid={message ? "true" : "false"}
      />

      {previewUrl ? (
        <div className="upload__preview">
          <img src={previewUrl} alt="Selected profile preview" className="upload__image" />
          <div className="upload__meta">
            <p className="upload__name">{value.name}</p>
            <p className="upload__size">{formatSize(value.size)}</p>
            <div className="upload__actions">
              <label htmlFor={inputId} className="btn btn--secondary btn--sm">Change photo</label>
              <button type="button" className="btn btn--link btn--sm" onClick={handleRemove} disabled={disabled}>
                Remove photo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label htmlFor={inputId} className="upload__drop">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          <span className="upload__title">Upload Profile Photo</span>
          <span className="upload__rules">JPG, JPEG or PNG</span>
          <span className="upload__rules">Maximum size: 2 MB</span>
        </label>
      )}

      {message && (
        <p id={messageId} className="field__error" role="alert">
          <span aria-hidden="true">⚠ </span>
          {message}
        </p>
      )}
    </div>
  );
});

export default ProfilePhotoUpload;

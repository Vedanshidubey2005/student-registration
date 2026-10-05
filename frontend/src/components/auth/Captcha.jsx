import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import Input from "../common/Input";

/**
 * DEMO CAPTCHA (client-side only - it provides NO real bot protection).
 *
 * Contract used by the forms - keep it when swapping in a real provider:
 *   ref.current.verify()  -> boolean   (shows its own error, focuses itself if invalid)
 *   ref.current.refresh() -> void      (new challenge; call after success/failure)
 * To replace with Google reCAPTCHA / Cloudflare Turnstile / hCaptcha, render the provider's
 * widget in this component, make verify() return whether a token exists, and add
 * getToken() so the form can send it to Spring Boot, which must verify it server-side.
 *
 * The answer lives only in a ref and is drawn on a <canvas>: it is not in the DOM,
 * not in React state, and never logged.
 */
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes (0/O, 1/I)
const LENGTH = 6;
const WIDTH = 180;
const HEIGHT = 56;

function generateCode() {
  const values = new Uint32Array(LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values, (n) => CHARSET[n % CHARSET.length]).join("");
}

function drawChallenge(canvas, code) {
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = WIDTH * ratio;
  canvas.height = HEIGHT * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#eef3f7";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 6; i += 1) {
    ctx.strokeStyle = `rgba(11, 95, 138, ${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * WIDTH, Math.random() * HEIGHT);
    ctx.bezierCurveTo(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * WIDTH, Math.random() * HEIGHT);
    ctx.stroke();
  }

  const step = WIDTH / (code.length + 1);
  [...code].forEach((char, i) => {
    ctx.save();
    ctx.translate(step * (i + 1), HEIGHT / 2 + (Math.random() * 10 - 5));
    ctx.rotate((Math.random() - 0.5) * 0.6);
    ctx.font = `700 ${28 + Math.floor(Math.random() * 6)}px "Courier New", monospace`;
    ctx.fillStyle = "#17212b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });

  for (let i = 0; i < 40; i += 1) {
    ctx.fillStyle = `rgba(23, 33, 43, ${Math.random() * 0.35})`;
    ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 2, 2);
  }
}

const Captcha = forwardRef(function Captcha({ disabled = false, className = "" }, ref) {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const answerRef = useRef("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const regenerate = useCallback(() => {
    answerRef.current = generateCode();
    drawChallenge(canvasRef.current, answerRef.current);
    setValue("");
  }, []);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  useImperativeHandle(
    ref,
    () => ({
      refresh() {
        setError("");
        regenerate();
      },
      verify() {
        const entered = value.trim().toUpperCase();
        if (!entered) {
          setError("Enter the characters shown in the image.");
          inputRef.current?.focus();
          return false;
        }
        if (entered !== answerRef.current) {
          setError("The characters do not match. A new CAPTCHA has been generated.");
          regenerate();
          inputRef.current?.focus();
          return false;
        }
        setError("");
        return true;
      },
    }),
    [value, regenerate]
  );

  return (
    <div className={`captcha ${className}`.trim()}>
      <span className="field__label" id="captcha-label">
        CAPTCHA <span className="field__required" aria-hidden="true">*</span>
      </span>
      <div className="captcha__challenge">
        <canvas
          ref={canvasRef}
          className="captcha__canvas"
          style={{ width: WIDTH, height: HEIGHT }}
          role="img"
          aria-label="CAPTCHA image with six characters"
        />
        <button
          type="button"
          className="captcha__refresh"
          onClick={() => {
            setError("");
            regenerate();
            inputRef.current?.focus();
          }}
          disabled={disabled}
          aria-label="Generate a new CAPTCHA image"
          title="New CAPTCHA"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>
      <Input
        ref={inputRef}
        label="Type the characters shown"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError("");
        }}
        error={error}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={LENGTH}
        disabled={disabled}
        aria-describedby="captcha-label"
      />
    </div>
  );
});

export default Captcha;

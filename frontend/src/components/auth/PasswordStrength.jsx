import { PASSWORD_RULES, getPasswordStrength } from "../../validation/authSchemas";

const LEVELS = { Weak: 1, Medium: 2, Strong: 3 };

/** Strength meter + requirement checklist. Purely informational; the server enforces the policy. */
export default function PasswordStrength({ password = "" }) {
  const strength = getPasswordStrength(password);
  const level = strength ? LEVELS[strength] : 0;

  return (
    <div className="strength">
      <div className="strength__header">
        <span className="strength__title">Password strength</span>
        <span className={`strength__label strength__label--${strength ? strength.toLowerCase() : "none"}`} aria-live="polite">
          {strength ?? "Not entered"}
        </span>
      </div>
      <div className="strength__bars" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`strength__bar ${n <= level ? `strength__bar--${strength.toLowerCase()}` : ""}`} />
        ))}
      </div>
      <ul className="strength__rules">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.id} className={met ? "rule rule--met" : "rule"}>
              <span aria-hidden="true">{met ? "✓" : "○"}</span> {rule.label}
              <span className="visually-hidden">{met ? " (met)" : " (not met)"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

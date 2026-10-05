export default function Loader({ fullScreen = false, label = "Loading..." }) {
  return (
    <div className={fullScreen ? "loader loader--fullscreen" : "loader"} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="loader__label">{label}</span>
    </div>
  );
}

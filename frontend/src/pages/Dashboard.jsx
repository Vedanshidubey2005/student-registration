import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-card">
        <div className="check-circle">✓</div>
        <h1>Task Completed</h1>
        <p>
          {user ? `Welcome, ${user.fullName ?? user.name ?? user.email}.` : "Welcome."} You have
          successfully signed in through a protected route.
        </p>
        <button className="primary-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}

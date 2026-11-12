import { Link } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";

export default function NotFound() {
  return (
    <AuthLayout title="Page not found" subtitle="The page you're looking for doesn't exist or has moved.">
      <div className="notice">
        <p>Error 404</p>
        <Link to="/dashboard" className="btn btn--primary">Go to Dashboard</Link>
      </div>
    </AuthLayout>
  );
}

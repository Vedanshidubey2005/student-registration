import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, loginUser, logoutUser } from "../services/authService";
import { setUnauthorizedHandler } from "../services/apiClient";
import { notify } from "../services/notifier";

export const AuthContext = createContext(null);

/**
 * Holds the current user and auth status.
 *
 * BACKEND INTEGRATION POINTS
 *  - Session restoration: GET /auth/me runs once on startup. With HttpOnly cookies the
 *    browser attaches the cookie automatically; 200 = signed in, 401 = signed out.
 *  - Login: POST /auth/login; the backend sets the HttpOnly cookie. We only keep the
 *    returned user profile in memory (never the token, never the password).
 *  - Logout: POST /auth/logout; the backend invalidates/clears the cookie.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session restoration
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        if (active) setUser(null); // not signed in, or backend unreachable
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Lets the Axios 401 interceptor clear auth state when the session expires.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (payload) => {
    const result = await loginUser(payload);
    // If the API returns only a cookie and no user object, load the profile separately.
    const authenticatedUser = result.user ?? (await getCurrentUser());
    setUser(authenticatedUser);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the request fails we still clear local state.
    }
    setUser(null);
    navigate("/login", { replace: true });
    notify.info("You have been signed out.");
  }, [navigate]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, loginUser, logoutUser } from "../services/authService";
import { setUnauthorizedHandler } from "../services/apiClient";
import { notify } from "../services/notifier";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Session restoration on startup/refresh
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active && currentUser) {
          setUser(currentUser);
        } else if (active) {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Axios interceptor 401 clearing
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("userEmail");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (payload) => {
    const result = await loginUser(payload);
    
    // Backend se direct user ya email/token extract karein
    const authenticatedUser = result.user || {
      email: payload.email,
      token: result.raw?.token || localStorage.getItem("authToken"),
    };

    // User state set hote hi isAuthenticated = true ho jayega
    setUser(authenticatedUser);
    return result;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser(user?.email);
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    navigate("/login", { replace: true });
    notify.info("You have been signed out.");
  }, [user, navigate]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
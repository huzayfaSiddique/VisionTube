import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as authApi from "../api/auth.api";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` is true only during the initial "am I already logged in?"
  // check on page load (cookie -> current-user). Individual actions
  // (login/register/logout) manage their own loading state locally
  // in the components that call them.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        // No valid session (no cookie, or refresh failed too) — that's fine,
        // it just means the visitor isn't logged in.
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { loggedInUser } = await authApi.loginUser({ email, password });
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (formData) => {
    // Note: the backend does not log the user in on register (no cookies
    // are set by /users/register) — it just creates the account. So we
    // deliberately don't touch `user` state here; the caller should
    // redirect to /login after a successful register.
    return authApi.registerUser(formData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logoutUser();
    } finally {
      // Clear local state regardless of whether the network call
      // succeeded — if it failed, the cookies are likely already gone
      // or invalid anyway, and the user's intent is clearly "log me out".
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

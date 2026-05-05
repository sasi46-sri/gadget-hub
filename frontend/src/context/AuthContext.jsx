import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { http, setToken, clearToken, getToken, extractErrorMessage } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = anonymous

  const fetchMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const { data } = await http.get("/auth/me");
      setUser(data);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const handleTokenFromResponse = (res) => {
    const token = res.headers?.["x-access-token"] || res.headers?.["X-Access-Token"];
    if (token) setToken(token);
  };

  const login = async (email, password) => {
    const res = await http.post("/auth/login", { email, password });
    handleTokenFromResponse(res);
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await http.post("/auth/register", { name, email, password });
    handleTokenFromResponse(res);
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await http.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh: fetchMe, extractErrorMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

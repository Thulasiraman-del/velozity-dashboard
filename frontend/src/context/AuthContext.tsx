import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { setAccessToken as setApiAccessToken } from "../api/client";

import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  refreshAccessToken,
  type User,
} from "../api/auth";

import {
  connectSocket,
  disconnectSocket,
} from "../socket";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await refreshAccessToken();

        setAccessToken(token);
        setApiAccessToken(token);

        const currentUser = await getCurrentUser();

        setUser(currentUser);

        connectSocket(token);
      } catch {
        setUser(null);
        setAccessToken(null);
        setApiAccessToken(null);
        disconnectSocket();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function login(
    email: string,
    password: string,
  ): Promise<void> {
    const result = await loginApi(email, password);

    setUser(result.user);
    setAccessToken(result.accessToken);
    setApiAccessToken(result.accessToken);

    connectSocket(result.accessToken);
  }

  async function logout(): Promise<void> {
    try {
      await logoutApi();
    } finally {
      disconnectSocket();
      setUser(null);
      setAccessToken(null);
      setApiAccessToken(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}

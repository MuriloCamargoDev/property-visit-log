import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  name: string;
  team: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Temporary mock users - will be replaced with Cloud auth
const MOCK_USERS = [
  { username: "João Silva", password: "class123", team: "Aventador" },
  { username: "Maria Santos", password: "class123", team: "Red Eagles" },
  { username: "Carlos Souza", password: "class123", team: "Fênix" },
  { username: "Ana Oliveira", password: "class123", team: "Rota" },
  { username: "Pedro Lima", password: "class123", team: "Sharks" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    const found = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (found) {
      setUser({ name: found.username, team: found.team });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

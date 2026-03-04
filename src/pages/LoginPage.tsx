import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Lock, User, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const success = login(username, password);
    if (!success) {
      setError("Usuário ou senha incorretos");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero px-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent mb-4">
            <Building2 className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-primary-foreground">
            Visitas Class
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Class Soluções Imobiliárias
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl shadow-elevated p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-heading font-semibold text-card-foreground">
              Entrar
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse com suas credenciais
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-card-foreground">
                Corretor
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Nome do corretor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center animate-fade-in">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full gradient-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Credenciais de teste: qualquer nome acima / class123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

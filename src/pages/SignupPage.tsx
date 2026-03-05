import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Lock, User, Mail, Eye, EyeOff, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TEAMS = ["Aventador", "Red Eagles", "Fênix", "Rota", "Sharks"];

interface SignupPageProps {
  onGoToLogin: () => void;
}

const SignupPage = ({ onGoToLogin }: SignupPageProps) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [team, setTeam] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !fullName || !team) {
      setError("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, fullName, team);
    if (signUpError) {
      setError(signUpError);
    }
    setLoading(false);
  };

  // Auto-login after signup - no success screen needed

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero px-4">
      <div className="w-full max-w-sm animate-fade-in">
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

        <div className="bg-card rounded-xl shadow-elevated p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-heading font-semibold text-card-foreground">
              Primeiro Acesso
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Crie sua conta de corretor
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-card-foreground">
                Nome Completo *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-card-foreground">
                E-mail *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-card-foreground">
                Senha *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
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

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-card-foreground">
                <Users className="w-4 h-4 text-muted-foreground" />
                Equipe *
              </Label>
              <Select value={team} onValueChange={setTeam} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua equipe" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                ⚠️ A equipe não poderá ser alterada posteriormente.
              </p>
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
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Já possui conta?{" "}
            <button onClick={onGoToLogin} className="text-accent font-semibold hover:underline">
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

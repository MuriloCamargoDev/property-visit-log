import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Lock,
  Users,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  Building2,
} from "lucide-react";

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage = ({ onBack }: ProfilePageProps) => {
  const { user, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Erro ao atualizar nome");
    } else {
      toast.success("Nome atualizado com sucesso!");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("Erro ao alterar senha");
    } else {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero sticky top-0 z-10">
        <div className="container max-w-lg flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <span className="font-heading font-bold text-primary-foreground text-sm">
              Meu Perfil
            </span>
          </div>
          <button
            onClick={onBack}
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </header>

      <main className="container max-w-lg px-4 py-6 space-y-6 animate-fade-in">
        {/* Read-only info */}
        <div className="bg-card rounded-xl shadow-elevated p-5 space-y-4">
          <h2 className="font-heading font-semibold text-card-foreground">Dados da Conta</h2>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Mail className="w-3.5 h-3.5" /> E-mail
            </Label>
            <Input value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Users className="w-3.5 h-3.5" /> Equipe
            </Label>
            <Input value={profile?.team || ""} disabled className="bg-muted cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">
              A equipe só pode ser alterada por um administrador.
            </p>
          </div>
        </div>

        {/* Editable name */}
        <div className="bg-card rounded-xl shadow-elevated p-5 space-y-4">
          <h2 className="font-heading font-semibold text-card-foreground">Nome Completo</h2>
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                placeholder="Seu nome completo"
              />
            </div>
            <Button
              onClick={handleSaveName}
              disabled={saving}
              className="w-full gradient-accent text-accent-foreground font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Nome
            </Button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-card rounded-xl shadow-elevated p-5 space-y-4">
          <h2 className="font-heading font-semibold text-card-foreground">Alterar Senha</h2>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Nova senha (mín. 6 caracteres)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                placeholder="Confirmar nova senha"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={saving}
              className="w-full gradient-accent text-accent-foreground font-semibold"
            >
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </div>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          onClick={signOut}
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          Sair da Conta
        </Button>
      </main>
    </div>
  );
};

export default ProfilePage;

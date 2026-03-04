import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PropertyFields from "@/components/PropertyFields";
import PhotoUpload from "@/components/PhotoUpload";
import { toast } from "sonner";
import {
  LogOut,
  User,
  CalendarDays,
  Users,
  Hash,
  MessageSquare,
  Camera,
  Send,
  Building2,
} from "lucide-react";

const TEAMS = ["Aventador", "Red Eagles", "Fênix", "Rota", "Sharks"];

interface PropertyData {
  cidade: string;
  setor: string;
  valor: string;
}

const VisitFormPage = () => {
  const { user, logout } = useAuth();
  const [clientName, setClientName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [team, setTeam] = useState("");
  const [propertyCount, setPropertyCount] = useState<number>(1);
  const [properties, setProperties] = useState<PropertyData[]>([
    { cidade: "", setor: "", valor: "" },
  ]);
  const [feedback, setFeedback] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePropertyCountChange = (val: string) => {
    const count = Math.max(1, Math.min(10, parseInt(val) || 1));
    setPropertyCount(count);
    const updated = [...properties];
    while (updated.length < count) updated.push({ cidade: "", setor: "", valor: "" });
    while (updated.length > count) updated.pop();
    setProperties(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !visitDate || !team || !feedback) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const hasEmptyProperty = properties.some(
      (p) => !p.cidade || !p.setor || !p.valor
    );
    if (hasEmptyProperty) {
      toast.error("Preencha todos os dados dos imóveis");
      return;
    }

    setSubmitting(true);

    // Calculate values for spreadsheet
    const valores = properties.map((p) => parseFloat(p.valor));
    const mediaValor = valores.reduce((a, b) => a + b, 0) / valores.length;

    const cidadesUnique = [...new Set(properties.map((p) => p.cidade.trim()))].join(", ");
    const setoresUnique = [...new Set(properties.map((p) => p.setor.trim()))].join(", ");

    const dateObj = new Date(visitDate + "T00:00:00");
    const mes = dateObj.toLocaleString("pt-BR", { month: "long" });
    const ano = dateObj.getFullYear();

    const mesCapitalized = mes.charAt(0).toUpperCase() + mes.slice(1);

    // Build FormData to support file upload
    const formData = new FormData();
    formData.append("corretor", user?.name || "");
    formData.append("equipe", team);
    formData.append("cliente", clientName);
    formData.append("data", visitDate);
    formData.append("mes", mesCapitalized);
    formData.append("ano", String(ano));
    formData.append("valorMedio", String(mediaValor));
    formData.append("setores", setoresUnique);
    formData.append("cidades", cidadesUnique);
    formData.append("feedback", feedback);
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/submit-visit`,
        {
          method: "POST",
          headers: {
            apikey: anonKey,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao registrar visita");
      }

      toast.success("Visita registrada com sucesso!");

      // Reset form
      setClientName("");
      setVisitDate("");
      setTeam("");
      setPropertyCount(1);
      setProperties([{ cidade: "", setor: "", valor: "" }]);
      setFeedback("");
      setPhoto(null);
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Erro ao registrar visita");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero sticky top-0 z-10">
        <div className="container max-w-lg flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <span className="font-heading font-bold text-primary-foreground text-sm">
              Visitas Class
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary-foreground/80 flex items-center gap-1">
              <User className="w-3 h-3" />
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container max-w-lg px-4 py-6">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-foreground">
            Nova Visita
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre os detalhes da visita realizada
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
          {/* Client Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <User className="w-4 h-4 text-muted-foreground" />
              Nome do Cliente *
            </Label>
            <Input
              placeholder="Nome completo do cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Data da Visita *
            </Label>
            <Input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
            />
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              Equipe *
            </Label>
            <Select value={team} onValueChange={setTeam} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a equipe" />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property count */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Hash className="w-4 h-4 text-muted-foreground" />
              Qtd. de Imóveis Visitados *
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={propertyCount}
              onChange={(e) => handlePropertyCountChange(e.target.value)}
              required
            />
          </div>

          {/* Dynamic property fields */}
          <PropertyFields properties={properties} onChange={setProperties} />

          {/* Feedback */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Feedback do Cliente *
            </Label>
            <Textarea
              placeholder="Descreva o feedback do cliente sobre a visita..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Camera className="w-4 h-4 text-muted-foreground" />
              Foto da Visita
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <PhotoUpload photo={photo} onPhotoChange={setPhoto} />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gradient-accent text-accent-foreground font-semibold h-12 text-base hover:opacity-90 transition-opacity"
            disabled={submitting}
          >
            {submitting ? (
              "Registrando..."
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Registrar Visita
              </span>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default VisitFormPage;

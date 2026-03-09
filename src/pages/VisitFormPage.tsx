import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  MapPin,
  Map,
} from "lucide-react";

interface PropertyData {
  cidade: string;
  setor: string;
  valorCents: number;
}

interface VisitFormPageProps {
  onGoToProfile: () => void;
  onGoToMap: () => void;
}

const VisitFormPage = ({ onGoToProfile, onGoToMap }: VisitFormPageProps) => {
  const { user, profile, signOut } = useAuth();
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();
  const [clientName, setClientName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [propertyCount, setPropertyCount] = useState<number>(1);
  const [properties, setProperties] = useState<PropertyData[]>([
    { cidade: "", setor: "", valorCents: 0 },
  ]);
  const [feedback, setFeedback] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Request geolocation on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const handlePropertyCountChange = (val: string) => {
    const count = Math.max(1, Math.min(10, parseInt(val) || 1));
    setPropertyCount(count);
    const updated = [...properties];
    while (updated.length < count) updated.push({ cidade: "", setor: "", valorCents: 0 });
    while (updated.length > count) updated.pop();
    setProperties(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !visitDate || !feedback) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const hasEmptyProperty = properties.some(
      (p) => !p.cidade || !p.setor || p.valorCents <= 0
    );
    if (hasEmptyProperty) {
      toast.error("Preencha todos os dados dos imóveis");
      return;
    }

    setSubmitting(true);

    try {
      const valores = properties.map((p) => p.valorCents / 100);
      const mediaValor = valores.reduce((a, b) => a + b, 0) / valores.length;

      const cidadesUnique = [...new Set(properties.map((p) => p.cidade.trim()))].join(", ");
      const setoresUnique = [...new Set(properties.map((p) => p.setor.trim()))].join(", ");

      const dateObj = new Date(visitDate + "T00:00:00");
      const mes = dateObj.toLocaleString("pt-BR", { month: "long" });
      const ano = dateObj.getFullYear();
      const mesCapitalized = mes.charAt(0).toUpperCase() + mes.slice(1);

      // Upload photo if present
      let fotoUrl = "";
      let fotoStoragePath = "";
      if (photo) {
        const ext = photo.name.split(".").pop() || "jpg";
        fotoStoragePath = `${crypto.randomUUID()}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("visit-photos")
          .upload(fotoStoragePath, photo, { contentType: photo.type });

        if (uploadError) throw new Error("Erro ao enviar foto: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("visit-photos")
          .getPublicUrl(uploadData.path);

        fotoUrl = urlData.publicUrl;
      }

      // Save to database
      const { data: visit, error: insertError } = await supabase
        .from("visits")
        .insert({
          user_id: user!.id,
          corretor: profile?.full_name || "",
          equipe: profile?.team || "",
          cliente: clientName,
          data_visita: visitDate,
          mes: mesCapitalized,
          ano: String(ano),
          valor_medio: mediaValor,
          setores: setoresUnique,
          cidades: cidadesUnique,
          feedback,
          foto_url: fotoUrl,
          foto_storage_path: fotoStoragePath,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          sync_status: "pending",
        })
        .select("id")
        .single();

      if (insertError) throw new Error("Erro ao salvar visita: " + insertError.message);

      toast.success("Visita registrada com sucesso!");

      // Trigger async processing (fire and forget)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      fetch(`${supabaseUrl}/functions/v1/process-visit`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visit_id: visit.id }),
      }).catch((err) => console.error("Sync error (background):", err));

      // Reset form
      setClientName("");
      setVisitDate("");
      setPropertyCount(1);
      setProperties([{ cidade: "", setor: "", valorCents: 0 }]);
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
              {profile?.full_name}
            </span>
            <span className="text-xs text-primary-foreground/60 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {profile?.team}
            </span>
            <button
              onClick={onGoToMap}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              title="Mapa de Visitas"
            >
              <Map className="w-4 h-4" />
            </button>
            <button
              onClick={onGoToProfile}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              title="Meu Perfil"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={signOut}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

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

          {/* Team (read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              Equipe
            </Label>
            <Input
              value={profile?.team || ""}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Equipe vinculada ao seu cadastro
            </p>
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

          {/* Location indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {geoLoading && "Obtendo localização..."}
            {geoError && (
              <span className="text-destructive">
                {geoError}{" "}
                <button type="button" onClick={requestLocation} className="underline">
                  Tentar novamente
                </button>
              </span>
            )}
            {location && !geoLoading && (
              <span className="text-success">
                Localização capturada ✓
              </span>
            )}
            {!location && !geoLoading && !geoError && "Localização não disponível"}
          </div>

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

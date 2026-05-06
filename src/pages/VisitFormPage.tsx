import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CurrencyInput from "@/components/CurrencyInput";
import { PRIORITY_CITIES, OTHER_CITIES } from "@/data/goias-cities";
import { formatBRL } from "@/lib/currency";
import { toast } from "sonner";
import {
  User,
  CalendarDays,
  Hash,
  MessageSquare,
  Send,
  Building2,
  MapPin,
  Building,
  DollarSign,
  Users,
  Phone,
  AlertTriangle,
} from "lucide-react";

interface PropertyData {
  cidade: string;
  setor: string;
  valorCents: number;
}

const TEAMS = ["Aventador", "Red Eagles", "Fênix", "Rota", "Sharks"];

const VisitFormPage = () => {
  const [corretor, setCorretor] = useState("");
  const [equipe, setEquipe] = useState<string>("");
  const [managerPhone, setManagerPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [propertyCount, setPropertyCount] = useState<number>(1);
  const [properties, setProperties] = useState<PropertyData[]>([
    { cidade: "", setor: "", valorCents: 0 },
  ]);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("0");

  // Load saved corretor / equipe / manager phones from localStorage
  useEffect(() => {
    const c = localStorage.getItem("vc_corretor");
    const e = localStorage.getItem("vc_equipe");
    if (c) setCorretor(c);
    if (e) setEquipe(e);
  }, []);

  useEffect(() => {
    if (corretor) localStorage.setItem("vc_corretor", corretor);
  }, [corretor]);

  useEffect(() => {
    if (equipe) {
      localStorage.setItem("vc_equipe", equipe);
      const saved = localStorage.getItem(`vc_manager_${equipe}`);
      setManagerPhone(saved || "");
    }
  }, [equipe]);

  useEffect(() => {
    if (equipe && managerPhone) {
      localStorage.setItem(`vc_manager_${equipe}`, managerPhone);
    }
  }, [equipe, managerPhone]);

  const handlePropertyCountChange = (val: string) => {
    const count = Math.max(1, Math.min(10, parseInt(val) || 1));
    setPropertyCount(count);
    const updated = [...properties];
    while (updated.length < count) updated.push({ cidade: "", setor: "", valorCents: 0 });
    while (updated.length > count) updated.pop();
    setProperties(updated);
    if (parseInt(activeTab) >= count) setActiveTab("0");
  };

  const updateProperty = (index: number, field: keyof PropertyData, value: string | number) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const buildMessage = () => {
    const dateObj = new Date(visitDate + "T00:00:00");
    const dateStr = dateObj.toLocaleDateString("pt-BR");

    let msg = `📩 *Nova Visita Registrada*\n\n`;
    msg += `👤 *Corretor:* ${corretor}\n`;
    msg += `👥 *Equipe:* ${equipe}\n`;
    msg += `📋 *Cliente:* ${clientName}\n`;
    msg += `📅 *Data da visita:* ${dateStr}\n`;
    msg += `🔢 *Qtd. de visitas:* ${properties.length}\n\n`;

    properties.forEach((p, i) => {
      msg += `🏠 *Visita ${i + 1}*\n`;
      msg += `📍 Setor: ${p.setor}\n`;
      msg += `📍 Cidade: ${p.cidade}\n`;
      msg += `💲 Valor: ${formatBRL(p.valorCents)}\n\n`;
    });

    msg += `📝 *Feedback do cliente:*\n${feedback}`;
    return msg;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!corretor || !equipe || !clientName || !visitDate || !feedback) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!managerPhone || managerPhone.replace(/\D/g, "").length < 10) {
      toast.error("Informe o WhatsApp do gerente");
      return;
    }
    const hasEmpty = properties.some((p) => !p.cidade || !p.setor || p.valorCents <= 0);
    if (hasEmpty) {
      toast.error("Preencha os dados de todas as visitas");
      return;
    }

    const phone = managerPhone.replace(/\D/g, "");
    const text = encodeURIComponent(buildMessage());
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero sticky top-0 z-10">
        <div className="container max-w-lg flex items-center gap-2 py-3 px-4">
          <Building2 className="w-5 h-5 text-accent" />
          <span className="font-heading font-bold text-primary-foreground text-sm">
            Visitas Class
          </span>
        </div>
      </header>

      <main className="container max-w-lg px-4 py-6">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-xl font-heading font-bold text-foreground">
            📩 Envie sempre que fizer uma visita!
          </h1>
          <div className="mt-3 flex gap-2 items-start rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p>
              Se possível, envie no mesmo dia da visita para não esquecer nenhum detalhe depois!
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
          {/* Corretor */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <User className="w-4 h-4 text-muted-foreground" /> Seu Nome (Corretor) *
            </Label>
            <Input
              placeholder="Seu nome completo"
              value={corretor}
              onChange={(e) => setCorretor(e.target.value)}
              required
            />
          </div>

          {/* Equipe */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" /> Equipe *
            </Label>
            <Select value={equipe} onValueChange={setEquipe}>
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
          </div>

          {/* Manager phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Phone className="w-4 h-4 text-muted-foreground" /> WhatsApp do Gerente *
            </Label>
            <Input
              type="tel"
              placeholder="+55 62 99999-9999"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Inclua o código do país (55) e DDD. Salvo por equipe neste dispositivo.
            </p>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <User className="w-4 h-4 text-muted-foreground" /> 📋 Nome do Cliente *
            </Label>
            <Input
              placeholder="Nome completo do cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <CalendarDays className="w-4 h-4 text-muted-foreground" /> 📅 Data da Visita *
            </Label>
            <Input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              required
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Hash className="w-4 h-4 text-muted-foreground" /> Quantas visitas foram feitas? *
            </Label>
            <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-background p-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 text-2xl shrink-0"
                onClick={() => handlePropertyCountChange(String(propertyCount - 1))}
                disabled={propertyCount <= 1}
                aria-label="Diminuir quantidade"
              >
                −
              </Button>
              <div className="flex-1 text-center">
                <div className="text-3xl font-heading font-bold text-foreground leading-none">
                  {propertyCount}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {propertyCount === 1 ? "visita" : "visitas"}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 text-2xl shrink-0"
                onClick={() => handlePropertyCountChange(String(propertyCount + 1))}
                disabled={propertyCount >= 10}
                aria-label="Aumentar quantidade"
              >
                +
              </Button>
            </div>
          </div>

          {/* Tabs por visita */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList
              className="w-full justify-start overflow-x-auto flex-wrap h-auto"
              style={{ display: "flex" }}
            >
              {properties.map((_, i) => (
                <TabsTrigger key={i} value={String(i)}>
                  Visita {i + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {properties.map((prop, i) => (
              <TabsContent key={i} value={String(i)}>
                <div className="bg-secondary/50 rounded-lg p-4 space-y-3 border border-border">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building className="w-3 h-3" /> 📍 Setor do Imóvel *
                    </Label>
                    <Input
                      placeholder="Ex: Setor Bueno"
                      value={prop.setor}
                      onChange={(e) => updateProperty(i, "setor", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 📍 Cidade do Imóvel *
                    </Label>
                    <Select
                      value={prop.cidade}
                      onValueChange={(value) => updateProperty(i, "cidade", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {PRIORITY_CITIES.map((city) => (
                          <SelectItem key={city} value={city} className="font-medium">
                            {city}
                          </SelectItem>
                        ))}
                        <div className="border-t border-border my-1" />
                        {OTHER_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> 💲 Valor do Imóvel *
                    </Label>
                    <CurrencyInput
                      cents={prop.valorCents}
                      onChange={(cents) => updateProperty(i, "valorCents", cents)}
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Feedback */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <MessageSquare className="w-4 h-4 text-muted-foreground" /> 📝 Feedback do Cliente *
            </Label>
            <Textarea
              placeholder="Descreva o feedback do cliente sobre a visita..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-accent text-accent-foreground font-semibold h-12 text-base hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviar pelo WhatsApp ao Gerente
            </span>
          </Button>
        </form>
      </main>
    </div>
  );
};

export default VisitFormPage;

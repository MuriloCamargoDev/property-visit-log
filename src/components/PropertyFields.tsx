import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CurrencyInput from "@/components/CurrencyInput";
import { Trash2, MapPin, DollarSign, Building } from "lucide-react";
import { PRIORITY_CITIES, OTHER_CITIES } from "@/data/goias-cities";

interface PropertyData {
  cidade: string;
  setor: string;
  valorCents: number;
}

interface PropertyFieldsProps {
  properties: PropertyData[];
  onChange: (properties: PropertyData[]) => void;
}

const PropertyFields = ({ properties, onChange }: PropertyFieldsProps) => {
  const updateProperty = (index: number, field: keyof PropertyData, value: string | number) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {properties.map((prop, index) => (
        <div
          key={index}
          className="bg-secondary/50 rounded-lg p-4 space-y-3 animate-fade-in border border-border"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-heading font-semibold text-foreground">
              Imóvel {index + 1}
            </h4>
            {properties.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(properties.filter((_, i) => i !== index))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Cidade
              </Label>
              <Select
                value={prop.cidade}
                onValueChange={(value) => updateProperty(index, "cidade", value)}
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
                <Building className="w-3 h-3" /> Setor
              </Label>
              <Input
                placeholder="Ex: Bueno"
                value={prop.setor}
                onChange={(e) => updateProperty(index, "setor", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Valor (R$)
              </Label>
              <CurrencyInput
                cents={prop.valorCents}
                onChange={(cents) => updateProperty(index, "valorCents", String(cents))}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyFields;

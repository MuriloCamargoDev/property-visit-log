import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, MapPin, DollarSign, Building } from "lucide-react";

interface PropertyData {
  cidade: string;
  setor: string;
  valor: string;
}

interface PropertyFieldsProps {
  properties: PropertyData[];
  onChange: (properties: PropertyData[]) => void;
}

const PropertyFields = ({ properties, onChange }: PropertyFieldsProps) => {
  const updateProperty = (index: number, field: keyof PropertyData, value: string) => {
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
              <Input
                placeholder="Ex: Goiânia"
                value={prop.cidade}
                onChange={(e) => updateProperty(index, "cidade", e.target.value)}
                required
              />
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
              <Input
                type="number"
                placeholder="Ex: 350000"
                value={prop.valor}
                onChange={(e) => updateProperty(index, "valor", e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyFields;

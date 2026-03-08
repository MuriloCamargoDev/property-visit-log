import { Input } from "@/components/ui/input";
import { formatBRL, parseBRLToCents, valorPorExtenso } from "@/lib/currency";

interface CurrencyInputProps {
  cents: number;
  onChange: (cents: number) => void;
}

const CurrencyInput = ({ cents, onChange }: CurrencyInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits
    const digits = e.target.value.replace(/\D/g, "");
    const newCents = parseInt(digits, 10) || 0;
    onChange(newCents);
  };

  const displayValue = cents > 0 ? formatBRL(cents) : "";
  const extenso = valorPorExtenso(cents);

  return (
    <div className="space-y-1">
      <Input
        type="text"
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={displayValue}
        onChange={handleChange}
        required
        min="0"
      />
      {extenso && (
        <p className="text-xs text-muted-foreground italic pl-1">
          {extenso}
        </p>
      )}
    </div>
  );
};

export default CurrencyInput;

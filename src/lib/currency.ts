/**
 * Format a number (in cents) to BRL currency string: R$ 450.000,00
 */
export function formatBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Parse a BRL formatted string back to cents (integer)
 */
export function parseBRLToCents(formatted: string): number {
  const cleaned = formatted.replace(/[R$\s.]/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100);
}

/**
 * Convert cents to a readable BRL value por extenso
 */
export function valorPorExtenso(cents: number): string {
  if (cents === 0) return "";
  
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;

  if (reais === 0 && centavos === 0) return "";

  let result = "";
  if (reais > 0) {
    result = numberToWords(reais);
    result += reais === 1 ? " real" : " reais";
  }

  if (centavos > 0) {
    if (reais > 0) result += " e ";
    result += numberToWords(centavos);
    result += centavos === 1 ? " centavo" : " centavos";
  }

  return result;
}

function numberToWords(n: number): string {
  if (n === 0) return "zero";

  const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  if (n === 100) return "cem";

  const parts: string[] = [];

  // Billions
  if (n >= 1_000_000_000) {
    const b = Math.floor(n / 1_000_000_000);
    parts.push(b === 1 ? "um bilhão" : numberToWords(b) + " bilhões");
    n %= 1_000_000_000;
  }

  // Millions
  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    parts.push(m === 1 ? "um milhão" : numberToWords(m) + " milhões");
    n %= 1_000_000;
  }

  // Thousands
  if (n >= 1000) {
    const t = Math.floor(n / 1000);
    parts.push(t === 1 ? "mil" : numberToWords(t) + " mil");
    n %= 1000;
  }

  // Hundreds
  if (n >= 100) {
    if (n === 100) {
      parts.push("cem");
      return parts.join(" e ");
    }
    parts.push(hundreds[Math.floor(n / 100)]);
    n %= 100;
  }

  // Tens and units
  if (n >= 10 && n <= 19) {
    parts.push(teens[n - 10]);
  } else {
    if (n >= 20) {
      const t = tens[Math.floor(n / 10)];
      const u = units[n % 10];
      parts.push(u ? `${t} e ${u}` : t);
    } else if (n > 0) {
      parts.push(units[n]);
    }
  }

  return parts.join(" e ");
}

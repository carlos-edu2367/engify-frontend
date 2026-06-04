const HUMAN_MONEY_ERROR = "Informe um valor valido, ex: 190,50";

export function parseHumanCurrencyToDecimalString(value: string): string {
  const normalized = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s+/g, "");

  if (!normalized || normalized.startsWith("-")) {
    throw new Error(HUMAN_MONEY_ERROR);
  }

  const brFormat = /^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(normalized);
  const brPlainFormat = /^\d+,\d{1,2}$/.test(normalized);
  const dotDecimalFormat = /^\d+\.\d{1,2}$/.test(normalized);

  let decimalValue: string;
  if (brFormat || brPlainFormat) {
    decimalValue = normalized.replace(/\./g, "").replace(",", ".");
  } else if (dotDecimalFormat) {
    decimalValue = normalized;
  } else {
    throw new Error(HUMAN_MONEY_ERROR);
  }

  const amount = Number(decimalValue);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(HUMAN_MONEY_ERROR);
  }

  const [integer, decimal = ""] = decimalValue.split(".");
  return `${integer}.${decimal.padEnd(2, "0")}`;
}

export { HUMAN_MONEY_ERROR };

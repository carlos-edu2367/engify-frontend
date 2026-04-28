function removeDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function sanitizePixField(value: string, maxLength: number) {
  return removeDiacritics(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 $%*+\-./:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function emvField(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function normalizePixKey(value: string) {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (digitsOnly.length === 11 || digitsOnly.length === 14) {
    return digitsOnly;
  }

  if (/^\+?[\d\s().-]+$/.test(trimmed) && digitsOnly.length >= 12 && digitsOnly.length <= 13) {
    return `+${digitsOnly}`;
  }

  return trimmed;
}

function crc16Ccitt(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

interface BuildPixPayloadParams {
  pixKey: string;
  amount: number;
  recipientName: string;
  city?: string;
  txid?: string;
  description?: string;
}

export function buildPixPayload({
  pixKey,
  amount,
  recipientName,
  city = "SAO PAULO",
  txid = "***",
  description,
}: BuildPixPayloadParams) {
  const cleanKey = normalizePixKey(pixKey);
  const merchantName = sanitizePixField(recipientName, 25) || "RECEBEDOR";
  const merchantCity = sanitizePixField(city, 15) || "SAO PAULO";
  const formattedAmount = amount.toFixed(2);

  const gui = emvField("00", "BR.GOV.BCB.PIX");
  const keyField = emvField("01", cleanKey);
  const cleanDescription = description ? sanitizePixField(description, 72) : "";
  const descriptionField = cleanDescription ? emvField("02", cleanDescription) : "";
  const merchantAccount = emvField("26", `${gui}${keyField}${descriptionField}`);
  const additionalData = emvField("62", emvField("05", sanitizePixField(txid, 25) || "***"));

  const payloadWithoutCrc = [
    emvField("00", "01"),
    merchantAccount,
    emvField("52", "0000"),
    emvField("53", "986"),
    emvField("54", formattedAmount),
    emvField("58", "BR"),
    emvField("59", merchantName),
    emvField("60", merchantCity),
    additionalData,
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
}

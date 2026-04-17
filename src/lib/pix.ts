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
  const cleanKey = pixKey.trim();
  const merchantName = sanitizePixField(recipientName, 25) || "RECEBEDOR";
  const merchantCity = sanitizePixField(city, 15) || "SAO PAULO";
  const formattedAmount = amount.toFixed(2);

  const gui = emvField("00", "BR.GOV.BCB.PIX");
  const keyField = emvField("01", cleanKey);
  const descriptionField = description
    ? emvField("02", sanitizePixField(description, 72))
    : "";
  const merchantAccount = emvField("26", `${gui}${keyField}${descriptionField}`);
  const additionalData = emvField("62", emvField("05", sanitizePixField(txid, 25) || "***"));

  const payloadWithoutCrc = [
    emvField("00", "01"),
    emvField("01", "12"),
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

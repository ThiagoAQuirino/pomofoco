// Gera o Pix "Copia e Cola" (BR Code estático) + QR PNG da chave do Pomofoco.
// Uso: node make-pix-qr.js   (regenera pix-qr.png)
const QRCode = require("qrcode");

const PIX_KEY = "f5d89e92-9364-4c56-93c6-d9c6d472d973";
const NAME = "THIAGO A QUIRINO"; // recebedor (<=25 chars)
const CITY = "MARINGA";          // cidade (<=15 chars) - só metadado p/ Pix por chave
const TXID = "***";              // estático

function tlv(id, value) {
  return id + String(value.length).padStart(2, "0") + value;
}
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const mai = tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", PIX_KEY));
let payload =
  tlv("00", "01") +
  mai +
  tlv("52", "0000") +
  tlv("53", "986") +
  tlv("58", "BR") +
  tlv("59", NAME) +
  tlv("60", CITY) +
  tlv("62", tlv("05", TXID)) +
  "6304";
payload += crc16(payload);

console.log("Pix copia-e-cola:\n" + payload + "\n");

QRCode.toFile(
  "pix-qr.png",
  payload,
  { width: 460, margin: 2, color: { dark: "#1b1d23", light: "#ffffff" } },
  (err) => {
    if (err) { console.error(err); process.exit(1); }
    console.log("pix-qr.png gerado.");
  }
);

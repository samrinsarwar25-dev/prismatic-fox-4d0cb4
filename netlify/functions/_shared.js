const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PRODUCTS = {
  XWGq4Uw: { name: "My Big Maths Workbook (Colour)", file: "maths-colour.pdf" },
  DC0be8hc: { name: "My Big Maths Workbook (Black & White)", file: "maths-bw.pdf" },
  yXoUYanM: { name: "Daddy's Little Girl", file: "daddys-little-girl.pdf" },
  "0xaabPD": { name: "Phonics English Book", file: "phonics.pdf" },
};

function productFromShortUrl(shortUrl) {
  if (!shortUrl) return null;
  const key = shortUrl.split("/").filter(Boolean).pop();
  const product = PRODUCTS[key];
  return product ? { key, ...product } : null;
}

function readPdf(file) {
  return fs.readFileSync(path.join(__dirname, "pdfs", file));
}

function hmacHex(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { PRODUCTS, productFromShortUrl, readPdf, hmacHex, safeEqual };

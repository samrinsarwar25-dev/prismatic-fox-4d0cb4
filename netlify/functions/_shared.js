const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// price is in rupees; file is the PDF name inside netlify/functions/pdfs/
const PRODUCTS = {
  "maths-colour": { name: "My Big Maths Workbook (Colour)", file: "maths-colour.pdf", price: 129 },
  "maths-bw": { name: "My Big Maths Workbook (Black & White)", file: "maths-bw.pdf", price: 99 },
  "daddys-little-girl": { name: "Daddy's Little Girl", file: "daddys-little-girl.pdf", price: 99 },
};

function productFromLink(link) {
  const key = link && link.notes && link.notes.product;
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

module.exports = { PRODUCTS, productFromLink, readPdf, hmacHex, safeEqual };

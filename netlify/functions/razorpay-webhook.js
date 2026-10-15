const { productFromShortUrl, readPdf, hmacHex, safeEqual } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = event.headers["x-razorpay-signature"];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  if (!secret || !signature || !safeEqual(hmacHex(secret, rawBody), signature)) {
    return { statusCode: 400, body: "Invalid signature" };
  }

  const payload = JSON.parse(rawBody);
  if (payload.event !== "payment_link.paid") return { statusCode: 200, body: "Ignored" };

  const link = payload.payload.payment_link.entity;
  const payment = payload.payload.payment && payload.payload.payment.entity;
  const email =
    (payment && payment.email) || (link.customer && link.customer.email) || null;

  const product = productFromShortUrl(link.short_url);
  if (!product || !email) {
    console.error("Cannot deliver", { short_url: link.short_url, email });
    return { statusCode: 200, body: "No product or email" };
  }

  const pdf = readPdf(product.file).toString("base64");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Little Learners Books", email: process.env.SENDER_EMAIL },
      to: [{ email }],
      subject: `Your book: ${product.name}`,
      htmlContent: `<p>Thank you for your purchase!</p>
<p>Your PDF <b>${product.name}</b> is attached to this email.</p>
<p>If you have any trouble opening it, just reply to this email.</p>
<p>Happy learning!<br>Little Learners Books</p>`,
      attachment: [{ name: product.file, content: pdf }],
    }),
  });

  if (!res.ok) {
    console.error("Brevo error", res.status, await res.text());
    return { statusCode: 500, body: "Email failed" };
  }

  return { statusCode: 200, body: "Sent" };
};

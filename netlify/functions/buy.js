const { PRODUCTS } = require("./_shared");

exports.handler = async (event) => {
  const key = (event.queryStringParameters || {}).product;
  const product = PRODUCTS[key];
  if (!product) return { statusCode: 400, body: "Unknown product" };

  const site = process.env.URL || "https://prismatic-fox-4d0cb4.netlify.app";
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: product.price * 100,
      currency: "INR",
      accept_partial: false,
      description: product.name,
      reference_id: `${key}-${Date.now()}`,
      expire_by: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60,
      reminder_enable: false,
      notes: { product: key },
      callback_url: `${site}/thank-you.html`,
      callback_method: "get",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Razorpay error", res.status, detail);
    return {
      statusCode: 502,
      body: `Could not start payment. Please try again.\n\nDetails: ${res.status} ${detail}`,
    };
  }

  const link = await res.json();
  return { statusCode: 302, headers: { Location: link.short_url, "Cache-Control": "no-store" }, body: "" };
};

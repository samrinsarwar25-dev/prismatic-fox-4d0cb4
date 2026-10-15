const { productFromShortUrl, readPdf, hmacHex, safeEqual } = require("./_shared");

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const {
    razorpay_payment_id: paymentId,
    razorpay_payment_link_id: linkId,
    razorpay_payment_link_reference_id: refId = "",
    razorpay_payment_link_status: status,
    razorpay_signature: signature,
  } = q;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!paymentId || !linkId || !signature || status !== "paid") {
    return { statusCode: 400, body: "Payment not completed" };
  }

  const expected = hmacHex(keySecret, `${linkId}|${refId}|${status}|${paymentId}`);
  if (!safeEqual(expected, signature)) {
    return { statusCode: 403, body: "Invalid signature" };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) return { statusCode: 502, body: "Could not verify payment" };

  const link = await res.json();
  if (link.status !== "paid") return { statusCode: 402, body: "Payment not completed" };

  const product = productFromShortUrl(link.short_url);
  if (!product) return { statusCode: 404, body: "Product not found" };

  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${product.file}"`,
      "Cache-Control": "no-store",
    },
    body: readPdf(product.file).toString("base64"),
  };
};

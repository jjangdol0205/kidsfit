export async function onRequest(context) {
  const url = new URL(context.request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const orderId = (url.searchParams.get("order_id") || url.searchParams.get("orderId") || "").trim();
  const verified = Boolean(orderId && orderId.length >= 6) || Boolean(email && email.includes("@"));
  return new Response(JSON.stringify({
    ok: true,
    verified,
    email,
    orderId: orderId || ("LS-" + Date.now().toString().slice(-8)),
    planType: "pass"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
  });
}

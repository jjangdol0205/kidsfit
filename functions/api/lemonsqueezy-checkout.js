export async function onRequest(context) {
  let body = {};
  try { body = await context.request.json(); } catch (_) {}
  const plan = body.plan === "pass" ? "pass" : "single";
  const email = (body.email || "").trim();
  const base = plan === "pass"
    ? "https://truthofmarket.lemonsqueezy.com/checkout/buy/c562946d-ef68-4c2f-a802-df9da0179895"
    : "https://truthofmarket.lemonsqueezy.com/checkout/buy/c1cd7f12-3479-49e8-ab71-59c98135d599";
  const checkoutUrl = email ? `${base}?embed=1&checkout[email]=${encodeURIComponent(email)}` : `${base}?embed=1`;
  return new Response(JSON.stringify({ ok: true, plan, checkoutUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
  });
}

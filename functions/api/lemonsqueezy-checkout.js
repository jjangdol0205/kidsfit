export async function onRequest(context) {
  let body = {};
  try { body = await context.request.json(); } catch (_) {}
  const plan = body.plan === "pass" ? "pass" : "single";
  const email = (body.email || "").trim();
  const base = plan === "pass"
    ? "https://truthofmarket.lemonsqueezy.com/checkout/buy/ce12a74d-b86d-4413-ac3c-dc80d9f5dfde"
    : "https://truthofmarket.lemonsqueezy.com/checkout/buy/00ba1a7a-3676-4110-a554-46dfb451a58b";
  const checkoutUrl = email ? `${base}?embed=1&checkout[email]=${encodeURIComponent(email)}` : `${base}?embed=1`;
  return new Response(JSON.stringify({ ok: true, plan, checkoutUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
  });
}

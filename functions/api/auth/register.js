export async function onRequest(context) {
  let body = {};
  try { body = await context.request.json(); } catch (_) {}
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || (email.includes("@") ? email.split("@")[0] : email) || "Member").trim();
  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: "Email or User ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
  return new Response(JSON.stringify({
    ok: true,
    token: "kf_edge_" + Date.now(),
    user: { name, email, unlockedPass: false, planType: "free" }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }
  });
}

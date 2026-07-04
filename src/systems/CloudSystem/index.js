export function cloudConfig() {
  const config = window.PROJETO190_SUPABASE || {};
  return {
    url: String(config.url || "").replace(/\/+$/, ""),
    key: String(config.key || "")
  };
}

export function cloudEnabled() {
  const config = cloudConfig();
  return Boolean(config.url && config.key);
}

export async function cloudRpc(name, payload = {}, options = {}) {
  const config = cloudConfig();
  if (!config.url || !config.key) {
    return { ok: false, reason: "Servidor online nao configurado." };
  }

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: "POST",
      keepalive: Boolean(options.keepalive),
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      return {
        ok: false,
        reason: data?.message || "Nao foi possivel acessar a nuvem."
      };
    }
    return data || { ok: true };
  } catch (error) {
    console.warn("Cloud RPC error", error);
    return { ok: false, reason: "Nao foi possivel acessar a nuvem." };
  }
}

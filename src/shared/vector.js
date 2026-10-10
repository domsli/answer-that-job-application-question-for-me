export function validVectorStoreId(value) {
  const match = String(value || "").match(/vs_[A-Za-z0-9]{8,}/);
  return match ? match[0] : "";
}

export function responseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  const parts = [];
  for (const item of payload?.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item.content || []) {
      if (typeof content?.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

export function statusLabel(status) {
  if (status === "completed") return "Ready";
  if (status === "in_progress") return "Indexing";
  if (status === "failed") return "Failed";
  if (status === "cancelled") return "Cancelled";
  return status || "Unknown";
}

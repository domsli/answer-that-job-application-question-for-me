const ROOT = "https://api.openai.com/v1";

export async function createVectorStore(apiKey) {
  const store = await openaiJson(apiKey, "/vector_stores", {
    method: "POST",
    body: JSON.stringify({ name: "Job Fill" }),
  });
  if (!store?.id) throw new Error("OpenAI did not return a vector store id.");
  return store.id;
}

export async function listVectorFiles(apiKey, vectorStoreId) {
  const listed = await openaiJson(apiKey, `/vector_stores/${vectorStoreId}/files?limit=100`);
  const names = await fileNames(apiKey);
  return (listed.data || []).map((file) => ({
    id: file.id,
    name: names.get(file.id) || file.id,
    status: file.status || "",
    error: file.last_error?.message || "",
  }));
}

export async function uploadVectorFile(apiKey, vectorStoreId, file) {
  if (!file || file.size < 1) throw new Error("That file is empty.");
  if (file.size > 25 * 1024 * 1024) throw new Error("That file is over 25 MB.");

  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("file", file, file.name);
  const uploaded = await openaiJson(apiKey, "/files", { method: "POST", body: form, timeout: 90000 });
  if (!uploaded?.id) throw new Error("OpenAI did not accept that file.");

  await openaiJson(apiKey, `/vector_stores/${vectorStoreId}/files`, {
    method: "POST",
    body: JSON.stringify({ file_id: uploaded.id }),
  });
  const ready = await waitForFile(apiKey, vectorStoreId, uploaded.id);
  return {
    id: uploaded.id,
    name: uploaded.filename || file.name,
    status: ready.status || "in_progress",
    error: ready.last_error?.message || "",
  };
}

export async function deleteVectorFile(apiKey, vectorStoreId, fileId) {
  await openaiJson(apiKey, `/vector_stores/${vectorStoreId}/files/${fileId}`, { method: "DELETE" });
  await openaiJson(apiKey, `/files/${fileId}`, { method: "DELETE" }).catch(() => {});
}

export async function respondWithFileSearch(apiKey, { model, instructions, input, vectorStoreId, maxTokens, temperature }) {
  const body = {
    model,
    instructions,
    input,
    max_output_tokens: maxTokens,
    tools: [{ type: "file_search", vector_store_ids: [vectorStoreId], max_num_results: 8 }],
    tool_choice: "required",
  };
  if (temperature != null) body.temperature = temperature;
  try {
    return await openaiJson(apiKey, "/responses", { method: "POST", body: JSON.stringify(body), timeout: 45000 });
  } catch (error) {
    if (!/temperature|tool_choice|unsupported|unknown/i.test(error.message)) throw error;
    delete body.temperature;
    delete body.tool_choice;
    return openaiJson(apiKey, "/responses", { method: "POST", body: JSON.stringify(body), timeout: 45000 });
  }
}

async function fileNames(apiKey) {
  const listed = await openaiJson(apiKey, "/files?purpose=assistants&limit=100");
  const names = new Map();
  for (const file of listed.data || []) names.set(file.id, file.filename);
  return names;
}

async function waitForFile(apiKey, vectorStoreId, fileId) {
  let latest = { status: "in_progress" };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    latest = await openaiJson(apiKey, `/vector_stores/${vectorStoreId}/files/${fileId}`);
    if (latest.status && latest.status !== "in_progress") return latest;
    await delay(1500);
  }
  return latest;
}

async function openaiJson(apiKey, path, { method = "GET", body, timeout = 30000 } = {}) {
  const headers = { Authorization: `Bearer ${apiKey}` };
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const response = await fetch(`${ROOT}${path}`, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(timeout),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `OpenAI request failed (${response.status}).`);
  return payload;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

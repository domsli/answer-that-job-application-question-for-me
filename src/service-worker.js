import { respondWithFileSearch } from "./shared/openai.js";
import { buildMessages, cleanAnswer, completionTokenBudget } from "./shared/prompt.js";
import { getSettings, normalizeApiKey, publicSettings, validModel } from "./shared/storage.js";
import { responseText, validVectorStoreId } from "./shared/vector.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "draft-field",
      title: "Draft answer from resume",
      contexts: ["editable"],
    });
  });
  updateBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") updateBadge();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "draft-field" || tab?.id == null) return;
  chrome.tabs.sendMessage(tab.id, { type: "draft-active" }, { frameId: info.frameId }).catch(() => {});
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "draft-focused") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id == null) return;
  await askTabToDraft(tab.id);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "focus-frame") {
    const tabId = sender.tab?.id;
    if (tabId != null) chrome.storage.session.set({ [`focus:${tabId}`]: sender.frameId ?? 0 });
    return;
  }

  if (message?.type === "public-settings") {
    getSettings().then((settings) => sendResponse(publicSettings(settings)));
    return true;
  }

  if (message?.type === "draft") {
    draftAnswer(message)
      .then((text) => sendResponse({ ok: true, text }))
      .catch((error) => sendResponse({ ok: false, error: error.message || "Couldn't draft an answer." }));
    return true;
  }

  if (message?.type === "draft-focused-tab") {
    askTabToDraft(message.tabId)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "test-key") {
    testKey(message.apiKey)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

async function askTabToDraft(tabId) {
  const key = `focus:${tabId}`;
  const stored = await chrome.storage.session.get(key);
  const frameId = stored[key] ?? 0;
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "draft-active" }, { frameId });
  } catch {
    return { ok: false, error: "Click the answer field on the application page, then try again." };
  }
}

async function updateBadge() {
  const settings = await getSettings();
  const fileCount = (settings.documents || []).length;
  const extra = String(settings.notes || "").trim() ? 1 : 0;
  const store = validVectorStoreId(settings.vectorStoreId) ? 1 : 0;
  const total = fileCount + extra + store;
  await chrome.action.setBadgeText({ text: total ? String(Math.min(total, 9)) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#0e6b52" });
}

async function draftAnswer(request) {
  const settings = await getSettings();
  const apiKey = normalizeApiKey(settings.apiKey);
  if (!apiKey) throw new Error("Add your OpenAI API key in the Job Fill popup.");

  const documents = settings.documents || [];
  const notes = String(settings.notes || "");
  const vectorStoreId = validVectorStoreId(settings.vectorStoreId);
  const sourceChars = documents.reduce((sum, document) => sum + String(document.text || "").trim().length, 0) + notes.trim().length;
  if (!vectorStoreId && sourceChars < 40) {
    throw new Error("Upload a resume to the vector store, or add experience notes in the Job Fill popup.");
  }

  const maxLength = Number(request.maxLength) > 0 ? Math.floor(Number(request.maxLength)) : null;
  const messages = buildMessages({
    documents,
    notes,
    question: request.question,
    pageContext: request.pageContext,
    pageUrl: request.pageUrl,
    tone: settings.tone,
    length: settings.length,
    maxLength,
    adjustment: request.adjustment,
    fileSearch: Boolean(vectorStoreId),
  });

  const model = validModel(settings.model);
  const content = vectorStoreId
    ? await completeFromStore(apiKey, model, messages, completionTokenBudget(maxLength), vectorStoreId)
    : await complete(apiKey, model, messages, completionTokenBudget(maxLength));
  const answer = cleanAnswer(content);
  if (!answer) throw new Error("The model returned an empty answer.");
  return answer;
}

async function completeFromStore(apiKey, model, messages, maxTokens, vectorStoreId) {
  const payload = await respondWithFileSearch(apiKey, {
    model,
    instructions: messages.system,
    input: messages.user,
    vectorStoreId,
    maxTokens,
    temperature: /^(o1|o3|gpt-5)/.test(model) ? null : 0.4,
  });
  return responseText(payload);
}

async function complete(apiKey, model, messages, maxTokens) {
  const baseBody = {
    model,
    messages: [
      { role: "system", content: messages.system },
      { role: "user", content: messages.user },
    ],
  };
  const firstBody = { ...baseBody, max_tokens: maxTokens };
  if (!/^(o1|o3|gpt-5)/.test(model)) firstBody.temperature = 0.4;

  let response = await postCompletion(apiKey, firstBody);
  if (!response.ok) {
    const message = await errorMessage(response);
    if (/max_tokens|max_completion_tokens|temperature|unsupported/i.test(message)) {
      response = await postCompletion(apiKey, { ...baseBody, max_completion_tokens: maxTokens });
    } else {
      throw new Error(message);
    }
  }
  if (!response.ok) throw new Error(await errorMessage(response));

  const payload = await response.json();
  return messageText(payload?.choices?.[0]?.message?.content);
}

async function postCompletion(apiKey, body) {
  return fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
}

async function errorMessage(response) {
  const payload = await response.json().catch(() => ({}));
  return payload?.error?.message || `OpenAI request failed (${response.status}).`;
}

function messageText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || part?.content || "").join("");
  }
  return "";
}

async function testKey(rawKey) {
  const settings = await getSettings();
  const apiKey = normalizeApiKey(rawKey || settings.apiKey);
  if (!apiKey) return { ok: false, error: "Add an API key first." };
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) return { ok: false, error: await errorMessage(response) };
  return { ok: true };
}

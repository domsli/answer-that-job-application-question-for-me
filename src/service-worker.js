import { chooseDraftSource } from "./shared/cost.js";
import { normalizeHttpUrl, readJobPageHtml, samePage } from "./shared/job-page.js";
import { respondWithFileSearch } from "./shared/openai.js";
import { buildMessages, cleanAnswer, completionTokenBudget } from "./shared/prompt.js";
import { getSettings, normalizeApiKey, publicSettings, saveSettings, validModel } from "./shared/storage.js";
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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "draft-field" || tab?.id == null) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "draft-active" }, { frameId: info.frameId });
  } catch {
    await showPageNotice(tab.id, info.frameId, await missingSetupMessage());
  }
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
      .then((result) => sendResponse({ ok: true, text: result.text, note: result.note }))
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

async function missingSetupMessage() {
  const settings = await getSettings();
  if (!normalizeApiKey(settings.apiKey)) {
    return "No API key yet. Open the Job Fill popup and paste an OpenAI API key. Nothing is generated without one.";
  }
  if (!validVectorStoreId(settings.vectorStoreId) && !String(settings.notes || "").trim() && !(settings.documents || []).some((document) => String(document.text || "").trim())) {
    return "No resume yet. Upload one in the Job Fill popup before drafting.";
  }
  return "Reload this page, then right-click the answer field again.";
}

async function showPageNotice(tabId, frameId, message) {
  const target = { tabId };
  if (typeof frameId === "number") target.frameIds = [frameId];
  await chrome.scripting.executeScript({
    target,
    args: [message],
    func: (text) => {
      let note = document.getElementById("job-fill-notice");
      if (!note) {
        note = document.createElement("div");
        note.id = "job-fill-notice";
        note.setAttribute("role", "status");
        note.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:320px;padding:12px 14px;background:#f8e6e1;color:#8d3428;border-radius:12px;font:14px/1.4 Segoe UI,sans-serif;box-shadow:0 12px 30px rgba(40,30,10,.18)";
        document.documentElement.append(note);
      }
      note.textContent = text;
    },
  });
}

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
  const documentChars = documents.reduce((sum, document) => sum + String(document.text || "").trim().length, 0);
  const sourceChars = documentChars + notes.trim().length;
  if (!vectorStoreId && sourceChars < 40) {
    throw new Error("Upload a resume to the vector store, or add experience notes in the Job Fill popup.");
  }

  const model = validModel(settings.model);
  const choice = chooseDraftSource({ model, documentChars, hasStore: Boolean(vectorStoreId) });
  const job = await resolveJobPage(request);
  const maxLength = Number(request.maxLength) > 0 ? Math.floor(Number(request.maxLength)) : null;
  const messages = buildMessages({
    documents: choice.useStore ? [] : documents,
    notes,
    question: request.question,
    pageContext: job.text,
    pageUrl: request.pageUrl,
    jobSource: job.source,
    tone: settings.tone,
    length: settings.length,
    maxLength,
    adjustment: request.adjustment,
    fileSearch: choice.useStore,
  });

  const content = choice.useStore
    ? await completeFromStore(apiKey, model, messages, completionTokenBudget(maxLength), vectorStoreId)
    : await complete(apiKey, model, messages, completionTokenBudget(maxLength));
  const answer = cleanAnswer(content);
  if (!answer) throw new Error("The model returned an empty answer.");
  return { text: answer, note: [choice.note, job.note].filter(Boolean).join(" ") };
}

async function resolveJobPage(request) {
  const pageUrl = String(request.pageUrl || "");
  let text = String(request.pageContext || "").trim();
  let source = request.jobSource === "description" ? "description" : "page";
  const typed = String(request.jobLink || "").trim();
  const explicit = normalizeHttpUrl(typed);
  const discovered = source === "description" ? "" : normalizeHttpUrl(request.discoveredJobLink);
  const link = explicit || discovered;
  let note = source === "description" ? "Used the job description on this page." : "";

  if (typed && !explicit) {
    note = "That job link needs to start with http:// or https://. Used the text on this page instead.";
  } else if (link && !samePage(link, pageUrl)) {
    try {
      const fetched = await fetchJobPage(link);
      if (fetched.text) {
        text = fetched.text;
        source = fetched.kind === "description" ? (explicit ? "link" : "discovered") : "linked-page";
        note = explicit ? "Used the job description from your link." : "Used the job description linked from this page.";
      } else if (explicit) {
        note = "That job link did not include a description. Used the text on this page instead.";
      }
    } catch (error) {
      note = explicit ? `${error.message} Used the text on this page instead.` : note;
    }
  }

  if ("jobLink" in request) await saveSettings({ jobLink: explicit });
  return { text, source, note };
}

async function fetchJobPage(url) {
  const response = await fetch(url, {
    redirect: "follow",
    credentials: "omit",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Couldn't open that job link (${response.status}).`);
  const type = response.headers.get("content-type") || "";
  if (type && !/html|xml|text\/plain|json/i.test(type)) throw new Error("That job link is not a web page.");
  const html = (await response.text()).slice(0, 500000);
  return readJobPageHtml(html);
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

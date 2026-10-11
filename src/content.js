import contentCss from "./content.css";
import { isJobSurface, shouldOfferChip } from "./shared/fields.js";
import { cleanPageText, findJobDescriptionLink, jobDescriptionFromDocument } from "./shared/job-page.js";
import { trimToLimit } from "./shared/prompt.js";

const HOST_ID = "job-fill-host";

function api() {
  return globalThis.__jobFillChrome || globalThis.chrome;
}

if (!globalThis.__jobFillInit) {
  globalThis.__jobFillInit = true;
  init();
}

function init() {
  const ui = createUi();
  const state = {
    field: null,
    previous: "",
    requestId: 0,
    maxLength: null,
  };

  api().runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "draft-active") return;
    const field = manualField();
    if (field) beginDraft(field);
    else openSetupPanel();
    sendResponse({ ok: true });
  });

  document.addEventListener(
    "contextmenu",
    (event) => {
      const target = eventTarget(event);
      if (target && isManualFillable(target)) rememberField(target);
    },
    true,
  );

  document.addEventListener(
    "focusin",
    (event) => {
      const target = eventTarget(event);
      if (!target || isOwn(target)) return;
      if (!isMultilineField(target)) {
        if (state.field !== target) hideChip();
        return;
      }
      const label = labelFor(target);
      const surface = isJobSurface({
        host: location.hostname,
        path: `${location.pathname}${location.search}`,
        title: document.title,
      });
      if (!shouldOfferChip({ label, multiline: true, surface })) return;
      rememberField(target);
      if (!ui.panel.classList.contains("hidden")) return;
      showChip(target);
    },
    true,
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.panel.classList.contains("hidden")) {
      closePanel();
    }
  });

  window.addEventListener("scroll", () => reposition(), true);
  window.addEventListener("resize", () => reposition());

  ui.chip.addEventListener("mousedown", (event) => event.preventDefault());
  ui.chip.addEventListener("click", () => {
    if (state.field) beginDraft(state.field);
  });
  ui.close.addEventListener("click", () => closePanel());
  ui.start.addEventListener("click", () => startDraft());
  ui.insert.addEventListener("click", () => insertDraft());
  ui.retry.addEventListener("click", () => regenerate());
  ui.undo.addEventListener("click", () => undoInsert());
  ui.draft.addEventListener("input", () => updateMeta());

  function eventTarget(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const target = path[0] || event.target;
    return target instanceof Element ? target : null;
  }

  function isOwn(element) {
    return element === ui.host || ui.host.contains(element) || eventPathHasHost(element);
  }

  function eventPathHasHost(element) {
    return element.getRootNode?.() === ui.shadow;
  }

  function rememberField(field) {
    state.field = field;
    api().runtime.sendMessage({ type: "focus-frame" }).catch(() => {});
  }

  function manualField() {
    if (state.field?.isConnected && isManualFillable(state.field)) return state.field;
    const active = document.activeElement;
    const inner = active?.shadowRoot?.activeElement;
    const candidate = isManualFillable(inner) ? inner : active;
    if (isManualFillable(candidate)) {
      rememberField(candidate);
      return candidate;
    }
    return null;
  }

  async function showChip(field) {
    ui.chip.classList.remove("hidden");
    ui.chip.textContent = "Draft from resume";
    ui.chip.dataset.fieldLabel = labelFor(field);
    placeNear(ui.chip, field, { width: 148, preferTop: true });
    const settings = await api().runtime.sendMessage({ type: "public-settings" }).catch(() => null);
    if (state.field !== field || ui.chip.classList.contains("hidden")) return;
    if (!settings?.hasKey) {
      ui.chip.textContent = "API key needed";
      ui.chip.title = "No OpenAI API key is saved in Job Fill";
    } else {
      ui.chip.title = "Draft from your resume (Alt+Shift+J)";
    }
    placeNear(ui.chip, field, { width: ui.chip.offsetWidth || 148, preferTop: true });
  }

  function hideChip() {
    ui.chip.classList.add("hidden");
  }

  function openSetupPanel() {
    state.requestId += 1;
    state.field = null;
    ui.jobLink.dataset.ready = "";
    ui.question.textContent = "Draft answer from resume";
    ui.draft.value = "";
    ui.panel.classList.remove("has-draft");
    ui.panel.classList.remove("hidden");
    ui.panel.style.top = "auto";
    ui.panel.style.left = "auto";
    ui.panel.style.right = "16px";
    ui.panel.style.bottom = "16px";
    updateMeta();
    preparePanel(state.requestId);
  }

  function beginDraft(field) {
    rememberField(field);
    state.previous = readField(field);
    state.maxLength = fieldLimit(field);
    state.requestId += 1;
    ui.question.textContent = labelFor(field) || "Application answer";
    ui.draft.value = "";
    ui.adjust.value = "";
    ui.jobLink.dataset.ready = "";
    ui.panel.classList.remove("needs-setup", "has-draft");
    ui.panel.classList.remove("hidden");
    ui.draft.classList.add("hidden");
    ui.status.textContent = "";
    ui.status.classList.add("hidden");
    ui.status.classList.remove("error");
    hideChip();
    placeNear(ui.panel, field, { width: 340 });
    updateMeta();
    preparePanel(state.requestId);
  }

  async function preparePanel(requestId) {
    const settings = await api().runtime.sendMessage({ type: "public-settings" }).catch(() => null);
    if (requestId !== state.requestId) return;
    applySavedJobLink(settings);
    if (!settings?.hasKey) {
      showSetupProblem("No API key yet. Open the Job Fill popup and paste an OpenAI API key. Nothing is generated without one.");
      return;
    }
    if (!settings?.hasResume) {
      showSetupProblem("No resume yet. Upload one in the Job Fill popup before drafting.");
      return;
    }
    if (!state.field?.isConnected) {
      showSetupProblem("Click the answer field, then choose Draft answer from resume again.");
      return;
    }
    ui.panel.classList.remove("needs-setup");
    setBusy(false, "Nothing is sent until you choose Draft answer.");
    updateMeta();
  }

  function applySavedJobLink(settings) {
    if (!settings || ui.jobLink.dataset.ready) return;
    if (!ui.jobLink.value) ui.jobLink.value = settings.jobLink || "";
    ui.jobLink.dataset.ready = "1";
  }

  function startDraft() {
    if (!state.field) return;
    state.requestId += 1;
    generate(state.requestId, ui.adjust.value);
  }

  async function generate(requestId, adjustment) {
    const settings = await api().runtime.sendMessage({ type: "public-settings" }).catch(() => null);
    if (requestId !== state.requestId) return;
    if (!settings?.hasKey) {
      showSetupProblem("No API key yet. Open the Job Fill popup and paste an OpenAI API key. Nothing is generated without one.");
      return;
    }
    if (!settings?.hasResume) {
      showSetupProblem("No resume yet. Upload one in the Job Fill popup before drafting.");
      return;
    }
    if (!state.field?.isConnected) {
      showSetupProblem("Click the answer field, then choose Draft answer from resume again.");
      return;
    }
    applySavedJobLink(settings);
    const page = pageJob();
    const typedLink = ui.jobLink.value.trim();
    const readingJob = Boolean(typedLink || (page.source !== "description" && page.link));
    ui.panel.classList.remove("needs-setup");
    setBusy(true, readingJob ? "Reading the job description…" : "Drafting from your resume…");

    const response = await api()
      .runtime.sendMessage({
        type: "draft",
        question: labelFor(state.field),
        pageContext: page.text,
        jobSource: page.source,
        discoveredJobLink: page.link,
        jobLink: typedLink,
        pageUrl: location.href,
        maxLength: state.maxLength,
        adjustment,
      })
      .catch((error) => ({ ok: false, error: error?.message || "Job Fill could not reach its background worker. Reload the page." }));

    if (requestId !== state.requestId) return;
    if (!response?.ok) {
      setBusy(false, response?.error || "Couldn't draft an answer.", true);
      return;
    }

    ui.draft.value = response.text;
    setBusy(false, response.note || "");
    updateMeta();
    if (settings.reviewBeforeInsert === false) insertDraft();
  }

  function regenerate() {
    if (!state.field) return;
    state.requestId += 1;
    generate(state.requestId, ui.adjust.value);
  }

  function insertDraft() {
    const field = state.field;
    if (!field?.isConnected) {
      setBusy(false, "The field went away. Click it and draft again.", true);
      return;
    }
    const next = trimToLimit(ui.draft.value, state.maxLength);
    const trimmed = next !== ui.draft.value.trim();
    setFieldValue(field, next);
    closePanel();
    showToast(trimmed ? "Inserted and trimmed to the character limit." : "Inserted. Nothing was submitted.");
  }

  function undoInsert() {
    if (!state.field?.isConnected) return;
    setFieldValue(state.field, state.previous);
    ui.toast.classList.add("hidden");
  }

  function closePanel() {
    state.requestId += 1;
    ui.panel.classList.add("hidden");
    setBusy(false, "");
  }

  function showSetupProblem(message) {
    ui.panel.classList.add("needs-setup");
    ui.draft.value = "";
    setBusy(false, message, true);
  }

  function setBusy(busy, message, isError = false) {
    ui.status.textContent = message || "";
    ui.status.classList.toggle("error", Boolean(isError));
    ui.status.classList.toggle("hidden", !message);
    ui.insert.disabled = busy || !ui.draft.value.trim();
    ui.start.disabled = busy;
    ui.retry.disabled = busy;
    ui.draft.disabled = busy;
    if (busy && !ui.draft.value.trim()) ui.draft.classList.add("hidden");
    if (!busy && ui.draft.value.trim()) ui.draft.classList.remove("hidden");
  }

  function updateMeta() {
    const text = ui.draft.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const limit = state.maxLength;
    const over = limit && text.length > limit;
    ui.meta.textContent = limit ? `${text.length} / ${limit} characters · ${words} words` : `${words} words`;
    ui.meta.classList.toggle("over", Boolean(over));
    ui.meta.classList.toggle("hidden", !text);
    ui.panel.classList.toggle("has-draft", Boolean(text));
    ui.insert.disabled = !text || ui.draft.disabled;
    ui.insert.textContent = over ? "Insert within limit" : "Insert answer";
  }

  function reposition() {
    if (!state.field?.isConnected) {
      hideChip();
      return;
    }
    if (!ui.chip.classList.contains("hidden")) placeNear(ui.chip, state.field, { width: 148, preferTop: true });
    if (!ui.panel.classList.contains("hidden")) placeNear(ui.panel, state.field, { width: 340 });
  }

  function showToast(message) {
    ui.toastMessage.textContent = message;
    ui.toast.classList.remove("hidden");
    window.setTimeout(() => ui.toast.classList.add("hidden"), 6000);
  }
}

function createUi() {
  const host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.append(host);

  const style = document.createElement("style");
  style.textContent = contentCss;
  shadow.append(style);

  const chip = button("Draft from resume", "chip hidden");
  chip.title = "Draft from your resume (Alt+Shift+J)";
  const panel = document.createElement("section");
  panel.className = "panel hidden";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Job Fill draft");

  const head = document.createElement("div");
  head.className = "panel-head";
  const mark = document.createElement("div");
  mark.className = "mark";
  mark.textContent = "Job Fill";
  const close = button("×", "icon-button");
  close.setAttribute("aria-label", "Close draft");
  head.append(mark, close);

  const question = document.createElement("p");
  question.className = "question";
  const jobLinkLabel = document.createElement("label");
  jobLinkLabel.className = "job-link";
  const jobLinkCaption = document.createElement("span");
  jobLinkCaption.textContent = "Job description link";
  const jobLink = document.createElement("input");
  jobLink.type = "url";
  jobLink.placeholder = "https://… if this page has no posting";
  jobLink.setAttribute("aria-label", "Job description link");
  jobLink.spellcheck = false;
  jobLinkLabel.append(jobLinkCaption, jobLink);
  const status = document.createElement("p");
  status.className = "status hidden";
  const draft = document.createElement("textarea");
  draft.className = "draft hidden";
  draft.setAttribute("aria-label", "Draft answer");
  const meta = document.createElement("p");
  meta.className = "meta hidden";
  const disclaimer = document.createElement("p");
  disclaimer.className = "disclaimer";
  disclaimer.textContent = "Check this before you insert it. The form is not submitted for you.";

  const adjust = document.createElement("div");
  adjust.className = "adjust";
  const tweak = document.createElement("input");
  tweak.type = "text";
  tweak.placeholder = "Optional tweak, such as shorter";
  tweak.setAttribute("aria-label", "Adjustment");
  const retry = button("Regenerate", "");
  adjust.append(tweak, retry);

  const actions = document.createElement("div");
  actions.className = "actions";
  const start = button("Draft answer", "primary draft-start");
  const insert = button("Insert answer", "primary");
  actions.append(start, insert);

  panel.append(head, question, jobLinkLabel, status, draft, meta, disclaimer, adjust, actions);

  const toast = document.createElement("div");
  toast.className = "toast hidden";
  toast.setAttribute("role", "status");
  const toastMessage = document.createElement("span");
  const undo = button("Undo", "");
  toast.append(toastMessage, undo);

  shadow.append(chip, panel, toast);
  return { host, shadow, chip, panel, close, question, jobLink, status, draft, meta, adjust: tweak, retry, start, insert, toast, toastMessage, undo };
}

function button(text, className) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function isMultilineField(element) {
  if (!(element instanceof Element)) return false;
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLInputElement) return false;
  if (element.getAttribute("role") === "textbox" && element.getAttribute("aria-multiline") === "true") return true;
  if (element.isContentEditable && element.tagName !== "BODY" && element.tagName !== "HTML") {
    if (element.getAttribute("aria-multiline") === "false") return false;
    const box = element.getBoundingClientRect();
    if (box.height > window.innerHeight * 0.9 && box.width > window.innerWidth * 0.9) return false;
    return box.height >= 64;
  }
  return false;
}

function isManualFillable(element) {
  if (!(element instanceof Element) || !element.isConnected) return false;
  if (element.id === HOST_ID || element.getRootNode?.() === document.getElementById(HOST_ID)?.shadowRoot) return false;
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLInputElement) {
    const skipped = ["password", "hidden", "file", "checkbox", "radio", "submit", "button", "image", "range", "color", "date", "datetime-local", "time", "month", "week", "number"];
    return !skipped.includes(element.type) && !element.disabled && !element.readOnly;
  }
  return Boolean(element.isContentEditable) && element.tagName !== "BODY" && element.tagName !== "HTML";
}

function labelFor(element) {
  const parts = [];
  const push = (value) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 500 || parts.includes(text)) return;
    parts.push(text);
  };

  push(element.getAttribute?.("aria-label"));
  const labelledBy = String(element.getAttribute?.("aria-labelledby") || "").split(/\s+/);
  const root = element.getRootNode?.() || document;
  for (const id of labelledBy) {
    if (!id) continue;
    push(textOf(root.getElementById?.(id)));
  }
  if (element.id) {
    const label = root.querySelector?.(`label[for="${CSS.escape(element.id)}"]`);
    push(labelText(label));
  }
  push(labelText(element.closest?.("label")));
  push(element.getAttribute?.("placeholder"));

  const group = element.closest?.("fieldset, [role='group'], li, .field, .form-group");
  if (group) push(labelText(group.querySelector("legend, label")));

  let previous = element.previousElementSibling;
  for (let step = 0; step < 3 && previous; step += 1) {
    push(textOf(previous));
    previous = previous.previousElementSibling;
  }
  return parts.join(" — ").slice(0, 1000);
}

function textOf(element) {
  if (!element) return "";
  return (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
}

function labelText(element) {
  if (!element) return "";
  const clone = element.cloneNode(true);
  clone.querySelectorAll("textarea, input, select, button").forEach((node) => node.remove());
  return (clone.textContent || "").replace(/\s+/g, " ").trim();
}

function fieldLimit(element) {
  const raw = element.getAttribute?.("maxlength") || element.maxLength;
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 1 || limit > 100000) return null;
  return limit;
}

function readField(element) {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return element.value;
  return element.innerText || "";
}

function setFieldValue(element, value) {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  element.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  const inserted = document.execCommand("insertText", false, value);
  if (!inserted) {
    element.textContent = value;
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  }
}

function pageJob() {
  const description = jobDescriptionFromDocument(document);
  const link = findJobDescriptionLink(document, location.href);
  if (description) return { text: description, source: "description", link };
  const root = document.querySelector("main, article, [role='main']") || document.body;
  return { text: cleanPageText(root.innerText || "").slice(0, 6000), source: "page", link };
}

function placeNear(element, field, { width, preferTop = false }) {
  const rect = field.getBoundingClientRect();
  const panelHeight = element.offsetHeight || 280;
  let top = preferTop ? rect.top + 8 : rect.bottom + 8;
  let left = preferTop ? rect.right - width - 8 : rect.left;
  if (!preferTop && top + panelHeight > window.innerHeight - 8) top = Math.max(8, rect.top - panelHeight - 8);
  if (top < 8) top = 8;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
  if (left < 8) left = 8;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.style.top = `${top}px`;
  element.style.left = `${left}px`;
}


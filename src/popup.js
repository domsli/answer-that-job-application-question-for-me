import { extractDocument } from "./shared/extract.js";
import { createVectorStore, deleteVectorFile, listVectorFiles, uploadVectorFile } from "./shared/openai.js";
import { MAX_DOCUMENTS, MAX_STORED_CHARS, getSettings, normalizeApiKey, saveSettings, validModel } from "./shared/storage.js";
import { statusLabel, validVectorStoreId } from "./shared/vector.js";

installPreviewChrome();

const statusNode = document.querySelector("#status");
const documentsNode = document.querySelector("#documents");
const editor = document.querySelector("#editor");
const fileInput = document.querySelector("#file-input");
const dropzone = document.querySelector("#dropzone");
const storeInput = document.querySelector("#vector-store");
const storeFilesNode = document.querySelector("#store-files");
const storeDropzone = document.querySelector("#store-dropzone");
const storeFileInput = document.querySelector("#store-file");
let editingId = null;
let saveTimer = 0;

init();

async function init() {
  const extension = isExtension();
  document.querySelector("#preview-banner").classList.toggle("hidden", extension);
  document.querySelector("#draft-focused").classList.toggle("hidden", !extension);
  const settings = await getSettings();
  document.querySelector("#notes").value = settings.notes || "";
  document.querySelector("#api-key").value = settings.apiKey || "";
  document.querySelector("#model").value = settings.model || "gpt-4o-mini";
  document.querySelector("#tone").value = settings.tone || "direct";
  document.querySelector("#length").value = settings.length || "match";
  document.querySelector("#review").checked = settings.reviewBeforeInsert !== false;
  storeInput.value = settings.vectorStoreId || "";
  renderDocuments(settings.documents || []);
  if (!normalizeApiKey(settings.apiKey)) {
    setStatus("No API key yet. Paste one below. Drafts do nothing until a key is saved.", "error");
  }
  if (extension && settings.vectorStoreId) refreshStore({ quiet: true });

  document.querySelector("#notes").addEventListener("input", scheduleSave);
  document.querySelector("#api-key").addEventListener("change", scheduleSave);
  document.querySelector("#model").addEventListener("change", scheduleSave);
  document.querySelector("#tone").addEventListener("change", scheduleSave);
  document.querySelector("#length").addEventListener("change", scheduleSave);
  document.querySelector("#review").addEventListener("change", scheduleSave);
  document.querySelector("#doc-name").addEventListener("input", scheduleSave);
  document.querySelector("#doc-text").addEventListener("input", scheduleSave);
  window.addEventListener("pagehide", saveFromForm);

  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
  });
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("over");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("over"));
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("over");
    addFiles(event.dataTransfer?.files);
  });
  dropzone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    fileInput.click();
  });

  documentsNode.addEventListener("click", onDocumentClick);
  document.querySelector("#close-editor").addEventListener("click", () => {
    saveFromForm();
    editingId = null;
    editor.classList.add("hidden");
  });
  document.querySelector("#test-key").addEventListener("click", testKey);
  document.querySelector("#draft-focused").addEventListener("click", draftFocused);
  document.querySelector("#create-store").addEventListener("click", createStore);
  document.querySelector("#refresh-store").addEventListener("click", () => refreshStore());
  storeInput.addEventListener("change", async () => {
    await saveFromForm();
    if (validVectorStoreId(storeInput.value)) refreshStore();
  });
  storeFileInput.addEventListener("change", () => {
    uploadStoreFiles(storeFileInput.files);
    storeFileInput.value = "";
  });
  storeDropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    storeDropzone.classList.add("over");
  });
  storeDropzone.addEventListener("dragleave", () => storeDropzone.classList.remove("over"));
  storeDropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    storeDropzone.classList.remove("over");
    uploadStoreFiles(event.dataTransfer?.files);
  });
  storeDropzone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    storeFileInput.click();
  });
  storeFilesNode.addEventListener("click", onStoreClick);
}

function isExtension() {
  return Boolean(globalThis.chrome?.runtime?.id);
}

function installPreviewChrome() {
  if (globalThis.chrome?.runtime?.id) return;
  const local = {};
  globalThis.__jobFillChrome = {
    runtime: {
      id: "",
      sendMessage: async () => ({ ok: false, error: "Open Job Fill as a Chrome extension to call OpenAI." }),
    },
    storage: {
      local: {
        async get(defaults) {
          const result = { ...(defaults || {}) };
          for (const key of Object.keys(result)) {
            if (Object.prototype.hasOwnProperty.call(local, key)) result[key] = local[key];
          }
          return result;
        },
        async set(values) {
          Object.assign(local, structuredClone(values));
        },
      },
    },
  };
}

async function addFiles(fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  window.clearTimeout(saveTimer);
  await saveFromForm();
  const settings = await getSettings();
  const documents = [...(settings.documents || [])];
  const errors = [];

  for (const file of files) {
    if (documents.length >= MAX_DOCUMENTS) {
      errors.push(`You can store ${MAX_DOCUMENTS} files. Remove one first.`);
      break;
    }
    try {
      const text = await extractDocument(file);
      const next = [...documents, { id: crypto.randomUUID(), name: file.name, text, addedAt: Date.now() }];
      if (storedChars(next, settings.notes) > MAX_STORED_CHARS) {
        errors.push(`${file.name} would exceed the saved text limit.`);
        continue;
      }
      documents.push(next.at(-1));
      if (text.length < 40) errors.push(`${file.name} has very little text. If it is a scan, paste the resume into notes.`);
    } catch (error) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }

  await saveSettings({ documents });
  renderDocuments(documents);
  setStatus(errors.join(" "), errors.length ? "error" : "");
  if (!errors.length) setStatus(`Added ${files.length === 1 ? files[0].name : `${files.length} files`}.`);
}

function onDocumentClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  const id = button.closest("li")?.dataset.id;
  if (!id) return;
  if (button.dataset.action === "edit") openEditor(id);
  if (button.dataset.action === "delete") deleteDocument(id);
}

async function openEditor(id) {
  await saveFromForm();
  const settings = await getSettings();
  const documentRecord = (settings.documents || []).find((item) => item.id === id);
  if (!documentRecord) return;
  editingId = id;
  document.querySelector("#doc-name").value = documentRecord.name;
  document.querySelector("#doc-text").value = documentRecord.text;
  editor.classList.remove("hidden");
}

async function deleteDocument(id) {
  const settings = await getSettings();
  const documents = (settings.documents || []).filter((item) => item.id !== id);
  await saveSettings({ documents });
  if (editingId === id) {
    editingId = null;
    editor.classList.add("hidden");
  }
  renderDocuments(documents);
}

function renderDocuments(documents) {
  documentsNode.replaceChildren();
  const chars = documents.reduce((sum, document) => sum + String(document.text || "").length, 0);
  document.querySelector("#source-count").textContent = documents.length ? `${documents.length} files · ${chars.toLocaleString()} characters` : "";
  for (const documentRecord of documents) {
    const item = document.createElement("li");
    item.dataset.id = documentRecord.id;
    const copy = document.createElement("div");
    const name = document.createElement("div");
    name.className = "doc-name";
    name.textContent = documentRecord.name;
    const meta = document.createElement("div");
    meta.className = "doc-meta";
    meta.textContent = `${String(documentRecord.text || "").length.toLocaleString()} characters`;
    copy.append(name, meta);
    const edit = document.createElement("button");
    edit.type = "button";
    edit.dataset.action = "edit";
    edit.textContent = "Edit";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "delete";
    remove.className = "danger";
    remove.textContent = "Remove";
    item.append(copy, edit, remove);
    documentsNode.append(item);
  }
}

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveFromForm, 250);
}

async function saveFromForm() {
  const settings = await getSettings();
  const documents = [...(settings.documents || [])];
  if (editingId) {
    const index = documents.findIndex((item) => item.id === editingId);
    if (index >= 0) {
      documents[index] = {
        ...documents[index],
        name: document.querySelector("#doc-name").value.trim() || documents[index].name,
        text: document.querySelector("#doc-text").value,
      };
    }
  }
  const notes = document.querySelector("#notes").value;
  if (storedChars(documents, notes) > MAX_STORED_CHARS) {
    setStatus("That is too much text to store in the extension. Shorten a file or the notes.", "error");
    return;
  }
  const rawStore = storeInput.value;
  const vectorStoreId = validVectorStoreId(rawStore);
  if (rawStore.trim() && !vectorStoreId) {
    setStatus("A vector store id looks like vs_ followed by letters and numbers.", "error");
  } else if (vectorStoreId) {
    storeInput.value = vectorStoreId;
  }
  await saveSettings({
    notes,
    documents,
    apiKey: normalizeApiKey(document.querySelector("#api-key").value),
    model: validModel(document.querySelector("#model").value),
    tone: document.querySelector("#tone").value,
    length: document.querySelector("#length").value,
    reviewBeforeInsert: document.querySelector("#review").checked,
    ...(rawStore.trim() && !vectorStoreId ? {} : { vectorStoreId }),
  });
  renderDocuments(documents);
  const key = normalizeApiKey(document.querySelector("#api-key").value);
  const missingKey = statusNode.textContent.startsWith("No API key yet");
  if (!key && (missingKey || !statusNode.textContent)) {
    setStatus("No API key yet. Paste one below. Drafts do nothing until a key is saved.", "error");
  } else if (key && missingKey) {
    setStatus("API key saved.");
  }
}

function storedChars(documents, notes) {
  return documents.reduce((sum, document) => sum + String(document.text || "").length, 0) + String(notes || "").length;
}

async function testKey() {
  await saveFromForm();
  setStatus("Checking the key…");
  const browser = globalThis.__jobFillChrome || globalThis.chrome;
  const result = await browser.runtime.sendMessage({
    type: "test-key",
    apiKey: normalizeApiKey(document.querySelector("#api-key").value),
  });
  if (result?.ok) setStatus("Key works.");
  else setStatus(result?.error || "The key was rejected.", "error");
}

async function draftFocused() {
  await saveFromForm();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("Open a job application first.", "error");
    return;
  }
  const key = `focus:${tab.id}`;
  const stored = await chrome.storage.session.get(key);
  const frameId = stored[key] ?? 0;
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "draft-active" }, { frameId });
    if (!result?.ok) {
      setStatus(result?.error || "Click the answer field first.", "error");
      return;
    }
    window.close();
  } catch {
    setStatus("Click the answer field on the application page, then try again.", "error");
  }
}

async function createStore() {
  if (!requireExtension()) return;
  await saveFromForm();
  const apiKey = currentKey();
  if (!apiKey) {
    setStatus("Add an API key first.", "error");
    return;
  }
  setStatus("Creating a vector store…");
  try {
    const id = await createVectorStore(apiKey);
    storeInput.value = id;
    await saveFromForm();
    renderStoreFiles([]);
    setStatus("Store created. Upload your resume into it.");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function refreshStore({ quiet = false } = {}) {
  if (!isExtension()) return;
  await saveFromForm();
  const vectorStoreId = validVectorStoreId(storeInput.value);
  if (!vectorStoreId) {
    renderStoreFiles([]);
    if (!quiet) setStatus("Create or paste a vector store id first.", "error");
    return;
  }
  const apiKey = currentKey();
  if (!apiKey) {
    if (!quiet) setStatus("Add an API key first.", "error");
    return;
  }
  if (!quiet) setStatus("Loading files…");
  try {
    const files = await listVectorFiles(apiKey, vectorStoreId);
    renderStoreFiles(files);
    if (!quiet) setStatus(files.length ? "" : "This store has no files yet.");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function uploadStoreFiles(fileList) {
  const files = [...(fileList || [])];
  if (!files.length) return;
  if (!requireExtension()) return;
  await saveFromForm();
  const vectorStoreId = validVectorStoreId(storeInput.value);
  const apiKey = currentKey();
  if (!apiKey) {
    setStatus("Add an API key first.", "error");
    return;
  }
  if (!vectorStoreId) {
    setStatus("Create or paste a vector store id first.", "error");
    return;
  }
  const errors = [];
  for (const file of files) {
    setStatus(`Uploading ${file.name}…`);
    try {
      const stored = await uploadVectorFile(apiKey, vectorStoreId, file);
      if (stored.status === "failed") errors.push(`${file.name}: ${stored.error || "OpenAI could not index that file."}`);
    } catch (error) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }
  await refreshStore({ quiet: true });
  if (errors.length) setStatus(errors.join(" "), "error");
  else setStatus(files.length === 1 ? `${files[0].name} is in the store.` : `${files.length} files are in the store.`);
}

async function onStoreClick(event) {
  const button = event.target.closest("button");
  if (!button || button.dataset.action !== "remove-store") return;
  const fileId = button.closest("li")?.dataset.id;
  const vectorStoreId = validVectorStoreId(storeInput.value);
  if (!fileId || !vectorStoreId || !requireExtension()) return;
  setStatus("Removing that file…");
  try {
    await deleteVectorFile(currentKey(), vectorStoreId, fileId);
    await refreshStore({ quiet: true });
    setStatus("Removed from the store.");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderStoreFiles(files) {
  storeFilesNode.replaceChildren();
  document.querySelector("#store-count").textContent = files.length ? `${files.length} files` : "";
  for (const file of files) {
    const item = document.createElement("li");
    item.dataset.id = file.id;
    const copy = document.createElement("div");
    const name = document.createElement("div");
    name.className = "doc-name";
    name.textContent = file.name;
    const meta = document.createElement("div");
    meta.className = `doc-meta ${file.status === "failed" ? "failed" : ""}`;
    meta.textContent = file.error ? `${statusLabel(file.status)} · ${file.error}` : statusLabel(file.status);
    copy.append(name, meta);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.action = "remove-store";
    remove.className = "danger";
    remove.textContent = "Remove";
    item.append(copy, remove);
    storeFilesNode.append(item);
  }
}

function currentKey() {
  return normalizeApiKey(document.querySelector("#api-key").value);
}

function requireExtension() {
  if (isExtension()) return true;
  setStatus("Open Job Fill as a Chrome extension to use the vector store.", "error");
  return false;
}

function setStatus(message, kind) {
  statusNode.textContent = message || "";
  statusNode.classList.toggle("hidden", !message);
  statusNode.classList.toggle("error", kind === "error");
}

import { validVectorStoreId } from "./vector.js";

export const DEFAULTS = {
  apiKey: "",
  model: "gpt-4o-mini",
  tone: "direct",
  length: "match",
  reviewBeforeInsert: true,
  notes: "",
  documents: [],
  vectorStoreId: "",
  jobLink: "",
};

export const MAX_DOCUMENTS = 8;
export const MAX_STORED_CHARS = 100000;

function browser() {
  return globalThis.__jobFillChrome || globalThis.chrome;
}

export async function getSettings() {
  const stored = await browser().storage.local.get(DEFAULTS);
  return {
    ...DEFAULTS,
    ...stored,
    documents: Array.isArray(stored.documents) ? stored.documents : [],
    reviewBeforeInsert: stored.reviewBeforeInsert !== false,
  };
}

export async function saveSettings(partial) {
  await browser().storage.local.set(partial);
}

export function publicSettings(settings) {
  const documents = settings.documents || [];
  const hasResume =
    Boolean(validVectorStoreId(settings.vectorStoreId)) ||
    documents.some((document) => String(document.text || "").trim()) ||
    Boolean(String(settings.notes || "").trim());
  return {
    reviewBeforeInsert: settings.reviewBeforeInsert !== false,
    hasResume,
    hasKey: Boolean(String(settings.apiKey || "").trim()),
    tone: settings.tone || "direct",
    length: settings.length || "match",
    jobLink: String(settings.jobLink || ""),
  };
}

export function normalizeApiKey(value) {
  return String(value || "")
    .trim()
    .replace(/^bearer\s+/i, "");
}

export function validModel(value) {
  const model = String(value || "").trim();
  if (!/^[a-zA-Z0-9._:-]{2,64}$/.test(model)) return "gpt-4o-mini";
  return model;
}

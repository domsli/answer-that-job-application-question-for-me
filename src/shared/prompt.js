const MAX_DOCUMENT_CHARS = 20000;
const MAX_SOURCE_CHARS = 80000;
const MAX_PAGE_CHARS = 6000;
const MAX_JOB_CHARS = 8000;

const TONES = {
  direct: "Direct and specific. No fluff and no clichés such as passionate, thrilled, or results-driven.",
  warm: "Warm and personable, still concrete. No clichés.",
  concise: "As short as a complete answer can be.",
};

export function buildMessages({
  documents = [],
  notes = "",
  question = "",
  pageContext = "",
  pageUrl = "",
  jobSource = "",
  tone = "direct",
  length = "match",
  maxLength = null,
  adjustment = "",
  fileSearch = false,
} = {}) {
  const source = clipDocuments(documents);
  const noteText = String(notes || "").trim().slice(0, 8000);
  const limit = Number(maxLength) > 0 ? Math.floor(Number(maxLength)) : null;

  const system = [
    "You draft text for the user's own job applications.",
    "Write in the first person, as the user, in plain sentences they can paste into a form.",
    fileSearch
      ? "Resume and experience files are in the file search store. Search it before you answer. Use only what that search returns and the notes in the user message."
      : "Use only the resume, experience files, and notes in the user message.",
    "Do not invent employers, job titles, dates, degrees, certifications, tools, metrics, or anecdotes that are not in that material.",
    "If the question asks for something the material does not support, write a short honest answer from the closest real experience and leave the gap unfilled.",
    "Use the job description only to understand the role. Do not treat it as the user's own experience.",
    "Name a company or role only when it appears in the job description, page text, or URL. Do not guess a company name.",
    "Obey any limits or preferences in the notes.",
    "Do not add a greeting, sign-off, or subject line unless the question asks for a full letter.",
    "No markdown, no bullets, and no quotation marks around the answer.",
    "Return only the answer text.",
  ].join(" ");

  const lines = [
    `Tone: ${TONES[tone] || TONES.direct}`,
    `Length: ${lengthInstruction(length, limit)}`,
  ];
  if (limit) lines.push(`Character limit: stay at or under ${limit} characters.`);
  lines.push("", `Field question: ${clip(question, 1000) || "Infer the question from the job page. If it is still unclear, explain why the user would be a good fit for the role described."}`);
  if (pageUrl) lines.push(`Page URL: ${clip(pageUrl, 300)}`);
  if (pageContext) lines.push("", ...jobContextLines(pageContext, jobSource));
  if (fileSearch) {
    lines.push("", "Experience files are in the file search store. Search that store before you write.");
    if (source.text) lines.push("", "Extra experience text stored in the browser:", source.text);
  } else {
    lines.push("", "Experience files:", source.text || "(none)");
  }
  if (source.truncated) lines.push("(Some experience text was truncated to fit the draft request.)");
  if (noteText) lines.push("", "Notes:", noteText);
  const tweak = String(adjustment || "").trim();
  if (tweak) lines.push("", "Extra instruction from the user:", clip(tweak, 500));

  return {
    system,
    user: lines.join("\n"),
  };
}

export function cleanAnswer(text) {
  let cleaned = String(text || "").trim();
  cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("“") && cleaned.endsWith("”"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  cleaned = cleaned.replace(/^\s*(answer|draft)\s*:\s*/i, "");
  cleaned = cleaned.replace(/【[^】]+】/g, "");
  return cleaned.replace(/[ \t]{2,}/g, " ").trim();
}

export function trimToLimit(text, maxLength) {
  const cleaned = String(text || "").trim();
  const limit = Number(maxLength);
  if (!limit || cleaned.length <= limit) return cleaned;
  const slice = cleaned.slice(0, limit);
  const cut = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
  if (cut >= Math.floor(limit * 0.6)) return slice.slice(0, cut).trim();
  return slice.trim();
}

export function completionTokenBudget(maxLength) {
  const limit = Number(maxLength);
  if (!limit) return 700;
  return Math.min(700, Math.max(80, Math.ceil(limit / 3)));
}

function lengthInstruction(length, limit) {
  if (length === "short") return "2 to 4 sentences, under 80 words.";
  if (length === "paragraph") return "One paragraph, about 80 to 140 words.";
  if (length === "letter") return "A short cover letter, about 180 to 260 words. A greeting is appropriate because a letter was requested.";
  if (limit && limit < 180) return "1 or 2 sentences.";
  if (limit && limit < 400) return "2 to 4 sentences.";
  if (limit && limit < 800) return "One short paragraph.";
  return "About 90 to 160 words, in one or two short paragraphs.";
}

function jobContextLines(pageContext, jobSource) {
  if (jobSource === "description") {
    return ["Job description (from this page):", clip(pageContext, MAX_JOB_CHARS)];
  }
  if (jobSource === "link") {
    return ["Job description (from the link the user provided):", clip(pageContext, MAX_JOB_CHARS)];
  }
  if (jobSource === "discovered") {
    return ["Job description (linked from this page):", clip(pageContext, MAX_JOB_CHARS)];
  }
  if (jobSource === "linked-page") {
    return [
      "Job page from the link (may include menus and boilerplate; use it only to understand the role and company):",
      clip(pageContext, MAX_PAGE_CHARS),
    ];
  }
  return [
    "Job page text (may include menus and boilerplate; use it only to understand the role and company):",
    clip(pageContext, MAX_PAGE_CHARS),
  ];
}

function clipDocuments(documents) {
  let used = 0;
  let truncated = false;
  const parts = [];
  for (const document of documents) {
    const name = String(document?.name || "Untitled").slice(0, 180);
    let text = String(document?.text || "").trim();
    if (!text) continue;
    if (text.length > MAX_DOCUMENT_CHARS) {
      text = text.slice(0, MAX_DOCUMENT_CHARS);
      truncated = true;
    }
    if (used + text.length > MAX_SOURCE_CHARS) {
      text = text.slice(0, Math.max(0, MAX_SOURCE_CHARS - used));
      truncated = true;
    }
    if (!text) continue;
    used += text.length;
    parts.push(`## ${name}\n${text}`);
    if (used >= MAX_SOURCE_CHARS) break;
  }
  return { text: parts.join("\n\n"), truncated };
}

function clip(value, max) {
  return String(value || "").trim().slice(0, max);
}

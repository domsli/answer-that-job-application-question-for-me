const SELECTORS = [
  "[data-automation-id='jobPostingDescription']",
  "#job-details",
  "#jobDescriptionText",
  ".jobs-description__content",
  ".jobs-description-content",
  ".jobs-box__html-content",
  ".job__description",
  ".job-description",
  "[data-qa='job-description']",
  "[itemprop='description']",
  "[class*='job-description']",
  "[class*='jobDescription']",
  "[id*='job-description']",
  "[id*='jobDescription']",
];

const HEADING_RE =
  /\b(job description|about the (role|job|position)|the role|what you.?ll do|responsibilities|requirements|qualifications|who you are|about this (role|job)|what we.?re looking for)\b/i;

const LINK_TEXT_RE =
  /\b(job description|view (the )?(job|role|posting)|about the (role|job)|full (job )?description|see (the )?(role|job|posting))\b/i;

const DESCRIPTION_MIN = 180;
const JSON_LD_MIN = 80;

export function normalizeHttpUrl(value, base) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, base || undefined);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

export function samePage(left, right) {
  try {
    const a = new URL(left);
    const b = new URL(right);
    return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search;
  } catch {
    return false;
  }
}

export function cleanPageText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function jobDescriptionFromDocument(doc) {
  const scripts = queryAll(doc, "script[type='application/ld+json']");
  const jsonHtml = scripts.map((script) => `<script type="application/ld+json">${script.textContent || ""}</script>`).join("\n");
  const fromJson = jobDescriptionFromHtml(jsonHtml);
  if (fromJson) return fromJson;

  for (const selector of SELECTORS) {
    const text = cleanPageText(nodeText(queryOne(doc, selector)));
    if (text.length >= DESCRIPTION_MIN) return text.slice(0, 8000);
  }

  const headed = textAfterHeading(doc);
  if (headed.length >= DESCRIPTION_MIN) return headed.slice(0, 8000);
  return "";
}

export function findJobDescriptionLink(doc, baseUrl) {
  for (const anchor of queryAll(doc, "a[href]")) {
    const label = `${anchor.getAttribute?.("aria-label") || ""} ${anchor.textContent || ""}`;
    if (!LINK_TEXT_RE.test(label)) continue;
    const href = normalizeHttpUrl(anchor.getAttribute?.("href"), baseUrl);
    if (href && !samePage(href, baseUrl)) return href;
  }
  return "";
}

export function readJobPageHtml(html) {
  const description = jobDescriptionFromHtml(html);
  if (description) return { text: description, kind: "description" };
  const withoutChrome = String(html || "").replace(/<(nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const text = cleanPageText(htmlToText(withoutChrome)).slice(0, 6000);
  if (text.length >= DESCRIPTION_MIN) return { text, kind: "page" };
  return { text: "", kind: "" };
}

export function jobDescriptionFromHtml(html) {
  const posting = postingFromHtml(html);
  if (posting) return formatPosting(posting).slice(0, 8000);
  const block = labeledBlock(html);
  if (block.length >= DESCRIPTION_MIN) return block.slice(0, 8000);
  const headed = sectionAfterHeading(html);
  if (headed.length >= DESCRIPTION_MIN) return headed.slice(0, 8000);
  return "";
}

function postingFromHtml(html) {
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(String(html || ""));
  while (match) {
    const posting = findJobPosting(parseJson(match[1]));
    if (posting) return posting;
    match = pattern.exec(String(html || ""));
  }
  return null;
}

function findJobPosting(node) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  if (types.some((type) => String(type || "").toLowerCase() === "jobposting") && node.description) return node;
  if (node["@graph"]) return findJobPosting(node["@graph"]);
  return null;
}

function formatPosting(posting) {
  const title = cleanPageText(posting.title);
  const organization = posting.hiringOrganization;
  const company = cleanPageText(typeof organization === "string" ? organization : organization?.name);
  const description = cleanPageText(htmlToText(String(posting.description || "")));
  const text = [title && `Role: ${title}`, company && `Company: ${company}`, description].filter(Boolean).join("\n\n");
  return text.length >= JSON_LD_MIN ? text : "";
}

function labeledBlock(html) {
  const pattern =
    /<(section|div|article)\b[^>]*(?:id|class)=["'][^"']*(?:job[-_ ]*description|jobDescription|jobs-description|jobs-box__html-content)[^"']*["'][^>]*>/i;
  const match = pattern.exec(String(html || ""));
  if (!match) return "";
  return cleanPageText(htmlToText(sliceElement(html, match.index, match[1])));
}

function sectionAfterHeading(html) {
  const pattern = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match = pattern.exec(String(html || ""));
  while (match) {
    const label = cleanPageText(htmlToText(match[2]));
    if (label.length <= 140 && HEADING_RE.test(label)) {
      const rest = html.slice(match.index + match[0].length);
      const next = rest.search(/<h[1-4]\b/i);
      const chunk = next === -1 ? rest.slice(0, 12000) : rest.slice(0, next);
      const text = cleanPageText([label, htmlToText(chunk)].filter(Boolean).join("\n\n"));
      if (text.length >= DESCRIPTION_MIN) return text;
    }
    match = pattern.exec(String(html || ""));
  }
  return "";
}

function sliceElement(html, start, tag) {
  const open = new RegExp(`<${tag}\\b`, "gi");
  const close = new RegExp(`</${tag}>`, "gi");
  open.lastIndex = start;
  const first = open.exec(html);
  if (!first) return "";
  let depth = 1;
  let cursor = first.index + first[0].length;
  for (let step = 0; step < 400 && depth > 0; step += 1) {
    open.lastIndex = cursor;
    close.lastIndex = cursor;
    const nextOpen = open.exec(html);
    const nextClose = close.exec(html);
    if (!nextClose) break;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      cursor = nextClose.index + nextClose[0].length;
    }
  }
  return html.slice(first.index, cursor);
}

function textAfterHeading(doc) {
  for (const heading of queryAll(doc, "h1, h2, h3, h4")) {
    const label = cleanPageText(heading.textContent);
    if (!label || label.length > 140 || !HEADING_RE.test(label)) continue;
    const section = heading.closest?.("section, article");
    const sectionText = cleanPageText(nodeText(section));
    if (section && sectionText.length >= DESCRIPTION_MIN && sectionText.length < 8000) return sectionText;
    const chunks = [label];
    let node = heading.nextElementSibling;
    for (let step = 0; step < 12 && node; step += 1) {
      if (/^H[1-4]$/.test(node.tagName || "")) break;
      chunks.push(cleanPageText(nodeText(node)));
      node = node.nextElementSibling;
    }
    const text = cleanPageText(chunks.filter(Boolean).join("\n\n"));
    if (text.length >= DESCRIPTION_MIN) return text;
  }
  return "";
}

export function htmlToText(html) {
  const decoded = decodeEntities(String(html || ""));
  return decoded
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|h\d|li|br|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => fromCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => fromCode(parseInt(code, 16)));
}

function fromCode(code) {
  if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function parseJson(value) {
  try {
    return JSON.parse(String(value || "").trim());
  } catch {
    return null;
  }
}

function queryAll(doc, selector) {
  try {
    return [...(doc?.querySelectorAll?.(selector) || [])];
  } catch {
    return [];
  }
}

function queryOne(doc, selector) {
  try {
    return doc?.querySelector?.(selector) || null;
  } catch {
    return null;
  }
}

function nodeText(node) {
  if (!node) return "";
  return node.innerText || node.textContent || "";
}

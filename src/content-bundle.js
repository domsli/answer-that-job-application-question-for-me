(() => {
  // src/content.css
  var content_default = ':host {\r\n  all: initial;\r\n  position: fixed;\r\n  z-index: 2147483647;\r\n  top: 0;\r\n  left: 0;\r\n  width: 0;\r\n  height: 0;\r\n}\r\n\r\n.chip,\r\n.panel,\r\n.toast {\r\n  position: fixed;\r\n  font-family: "Segoe UI", sans-serif;\r\n  color: #1f1a14;\r\n  box-sizing: border-box;\r\n}\r\n\r\n.chip {\r\n  border: 0;\r\n  border-radius: 999px;\r\n  background: #0e6b52;\r\n  color: #f7f3ea;\r\n  font-size: 12px;\r\n  font-weight: 650;\r\n  letter-spacing: 0.01em;\r\n  line-height: 1;\r\n  padding: 7px 10px;\r\n  box-shadow: 0 8px 20px rgba(20, 40, 30, 0.22);\r\n  cursor: pointer;\r\n}\r\n\r\n.chip:hover {\r\n  background: #0b5340;\r\n}\r\n\r\n.panel {\r\n  width: 340px;\r\n  max-height: min(520px, calc(100vh - 24px));\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  padding: 12px;\r\n  background: #fffcf7;\r\n  border: 1px solid #e4dccf;\r\n  border-radius: 14px;\r\n  box-shadow: 0 16px 50px rgba(40, 30, 10, 0.18);\r\n}\r\n\r\n.panel-head,\r\n.actions,\r\n.adjust {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n\r\n.panel-head {\r\n  justify-content: space-between;\r\n}\r\n\r\n.mark {\r\n  font-family: Palatino, "Palatino Linotype", serif;\r\n  font-size: 16px;\r\n  font-weight: 700;\r\n}\r\n\r\n.question,\r\n.disclaimer,\r\n.meta,\r\n.status {\r\n  margin: 0;\r\n}\r\n\r\n.question {\r\n  color: #4e483f;\r\n  font-size: 12.5px;\r\n  line-height: 1.35;\r\n  display: -webkit-box;\r\n  -webkit-line-clamp: 3;\r\n  -webkit-box-orient: vertical;\r\n  overflow: hidden;\r\n}\r\n\r\n.draft {\r\n  width: 100%;\r\n  min-height: 150px;\r\n  resize: vertical;\r\n  border: 1px solid #e4dccf;\r\n  border-radius: 10px;\r\n  background: #fff;\r\n  color: #1f1a14;\r\n  padding: 8px 10px;\r\n  font: 13px/1.45 "Segoe UI", sans-serif;\r\n  box-sizing: border-box;\r\n}\r\n\r\n.adjust input,\r\n.job-link input {\r\n  border: 1px solid #e4dccf;\r\n  border-radius: 8px;\r\n  background: #fff;\r\n  color: #1f1a14;\r\n  padding: 6px 8px;\r\n  font: 12px/1.3 "Segoe UI", sans-serif;\r\n}\r\n\r\n.adjust input {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n\r\n.job-link {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n  margin: 0;\r\n  color: #6e675e;\r\n  font-size: 12px;\r\n}\r\n\r\n.job-link input {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n}\r\n\r\n.meta,\r\n.disclaimer,\r\n.status {\r\n  color: #6e675e;\r\n  font-size: 12px;\r\n  line-height: 1.35;\r\n}\r\n\r\n.status.error,\r\n.meta.over {\r\n  color: #8d3428;\r\n}\r\n\r\n.panel.needs-setup .status {\r\n  padding: 8px 10px;\r\n  border-radius: 8px;\r\n  background: #f8e6e1;\r\n  font-size: 13px;\r\n}\r\n\r\n.panel:not(.has-draft) .insert,\r\n.panel:not(.has-draft) .disclaimer,\r\n.panel:not(.has-draft) .adjust button,\r\n.panel.has-draft .draft-start {\r\n  display: none;\r\n}\r\n\r\n.panel.needs-setup .job-link,\r\n.panel.needs-setup .draft,\r\n.panel.needs-setup .meta,\r\n.panel.needs-setup .disclaimer,\r\n.panel.needs-setup .adjust,\r\n.panel.needs-setup .actions {\r\n  display: none;\r\n}\r\n\r\n.actions {\r\n  justify-content: flex-end;\r\n}\r\n\r\nbutton.primary,\r\nbutton.quiet,\r\n.adjust button {\r\n  border-radius: 8px;\r\n  font: 12.5px/1 "Segoe UI", sans-serif;\r\n  padding: 8px 10px;\r\n  cursor: pointer;\r\n}\r\n\r\nbutton.primary {\r\n  border: 0;\r\n  background: #0e6b52;\r\n  color: #f7f3ea;\r\n  font-weight: 650;\r\n}\r\n\r\nbutton.primary:hover {\r\n  background: #0b5340;\r\n}\r\n\r\nbutton.quiet,\r\n.adjust button {\r\n  border: 1px solid #e4dccf;\r\n  background: transparent;\r\n  color: #1f1a14;\r\n}\r\n\r\nbutton:disabled {\r\n  opacity: 0.55;\r\n  cursor: default;\r\n}\r\n\r\n.icon-button {\r\n  border: 0;\r\n  background: transparent;\r\n  color: #6e675e;\r\n  font-size: 18px;\r\n  line-height: 1;\r\n  padding: 0 2px;\r\n  cursor: pointer;\r\n}\r\n\r\n.toast {\r\n  right: 16px;\r\n  bottom: 16px;\r\n  max-width: 280px;\r\n  background: #1f1a14;\r\n  color: #f7f3ea;\r\n  border-radius: 12px;\r\n  padding: 10px 12px;\r\n  box-shadow: 0 12px 30px rgba(20, 16, 10, 0.28);\r\n  display: flex;\r\n  gap: 10px;\r\n  align-items: center;\r\n  font-size: 13px;\r\n}\r\n\r\n.toast button {\r\n  border: 0;\r\n  background: transparent;\r\n  color: #f0d7a2;\r\n  font: inherit;\r\n  font-weight: 700;\r\n  cursor: pointer;\r\n  padding: 0;\r\n}\r\n\r\n.hidden {\r\n  display: none !important;\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  .chip,\r\n  .panel,\r\n  .toast {\r\n    transition: none;\r\n  }\r\n}\r\n';

  // src/shared/fields.js
  var QUESTION_RE = /\b(why (are you|do you|would you|this|our|the)|good fit|cover letter|leave a message|tell us|motivate|motivation|interest(ed)?( in)?|about yourself|qualifications|what makes you|introduce yourself|additional information|why this (role|company|position|team)|message to|hiring manager|who you are|your experience|relevant experience|work (history|experience)|describe (a|an|your)|excited about|bring to (this|the)|greatest (strength|weakness)|challenge you)\b/i;
  var SKIP_LABEL = /^(search|email|e-mail|password|phone|tel|mobile|name|first name|last name|full name|city|state|province|zip|postal code|country|website|url|linkedin|github|portfolio|salary|notice period)$/i;
  var JOB_HOSTS = [
    /(^|\.)greenhouse\.io$/,
    /(^|\.)lever\.co$/,
    /(^|\.)myworkdayjobs\.com$/,
    /(^|\.)ashbyhq\.com$/,
    /(^|\.)smartrecruiters\.com$/,
    /(^|\.)icims\.com$/,
    /(^|\.)jobvite\.com$/,
    /(^|\.)workable\.com$/,
    /(^|\.)bamboohr\.com$/,
    /(^|\.)indeed\.com$/,
    /(^|\.)glassdoor\.com$/,
    /(^|\.)wellfound\.com$/,
    /(^|\.)dice\.com$/,
    /(^|\.)recruitee\.com$/,
    /(^|\.)breezy\.hr$/,
    /(^|\.)rippling\.com$/
  ];
  function looksLikeApplicationQuestion(label) {
    const text = String(label || "").replace(/\s+/g, " ").trim();
    if (!text) return false;
    if (QUESTION_RE.test(text)) return true;
    if (text.includes("?") && text.length > 12) return true;
    if (text.length > 80) return true;
    return false;
  }
  function isJobSurface({ host = "", path = "", title = "" } = {}) {
    const normalizedHost = String(host).toLowerCase().replace(/\.$/, "");
    const normalizedPath = String(path || "");
    const normalizedTitle = String(title || "");
    if (normalizedHost === "linkedin.com" || normalizedHost.endsWith(".linkedin.com")) {
      return /\/jobs|\/application|easy-apply|easyApply/i.test(normalizedPath);
    }
    if (JOB_HOSTS.some((pattern) => pattern.test(normalizedHost))) return true;
    if (/\b(careers?|jobs?|application|apply)\b/i.test(normalizedTitle)) return true;
    if (/\/(careers?|jobs?|apply|application|opening)(\/|$)/i.test(normalizedPath)) return true;
    return false;
  }
  function shouldOfferChip({ label = "", multiline = false, surface = false } = {}) {
    if (!multiline) return false;
    const primary = String(label).split(" \u2014 ")[0].trim();
    if (SKIP_LABEL.test(primary)) return false;
    if (looksLikeApplicationQuestion(label)) return true;
    return Boolean(surface);
  }

  // src/shared/job-page.js
  var SELECTORS = [
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
    "[id*='jobDescription']"
  ];
  var HEADING_RE = /\b(job description|about the (role|job|position)|the role|what you.?ll do|responsibilities|requirements|qualifications|who you are|about this (role|job)|what we.?re looking for)\b/i;
  var LINK_TEXT_RE = /\b(job description|view (the )?(job|role|posting)|about the (role|job)|full (job )?description|see (the )?(role|job|posting))\b/i;
  var DESCRIPTION_MIN = 180;
  var JSON_LD_MIN = 80;
  function normalizeHttpUrl(value, base) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      const url = new URL(raw, base || void 0);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      url.hash = "";
      return url.toString();
    } catch {
      return "";
    }
  }
  function samePage(left, right) {
    try {
      const a = new URL(left);
      const b = new URL(right);
      return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search;
    } catch {
      return false;
    }
  }
  function cleanPageText(value) {
    return String(value || "").replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
  function jobDescriptionFromDocument(doc) {
    const scripts = queryAll(doc, "script[type='application/ld+json']");
    const jsonHtml = scripts.map((script) => `<script type="application/ld+json">${script.textContent || ""}<\/script>`).join("\n");
    const fromJson = jobDescriptionFromHtml(jsonHtml);
    if (fromJson) return fromJson;
    for (const selector of SELECTORS) {
      const text = cleanPageText(nodeText(queryOne(doc, selector)));
      if (text.length >= DESCRIPTION_MIN) return text.slice(0, 8e3);
    }
    const headed = textAfterHeading(doc);
    if (headed.length >= DESCRIPTION_MIN) return headed.slice(0, 8e3);
    return "";
  }
  function findJobDescriptionLink(doc, baseUrl) {
    for (const anchor of queryAll(doc, "a[href]")) {
      const label = `${anchor.getAttribute?.("aria-label") || ""} ${anchor.textContent || ""}`;
      if (!LINK_TEXT_RE.test(label)) continue;
      const href = normalizeHttpUrl(anchor.getAttribute?.("href"), baseUrl);
      if (href && !samePage(href, baseUrl)) return href;
    }
    return "";
  }
  function jobDescriptionFromHtml(html) {
    const posting = postingFromHtml(html);
    if (posting) return formatPosting(posting).slice(0, 8e3);
    const block = labeledBlock(html);
    if (block.length >= DESCRIPTION_MIN) return block.slice(0, 8e3);
    const headed = sectionAfterHeading(html);
    if (headed.length >= DESCRIPTION_MIN) return headed.slice(0, 8e3);
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
    const pattern = /<(section|div|article)\b[^>]*(?:id|class)=["'][^"']*(?:job[-_ ]*description|jobDescription|jobs-description|jobs-box__html-content)[^"']*["'][^>]*>/i;
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
        const chunk = next === -1 ? rest.slice(0, 12e3) : rest.slice(0, next);
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
      if (section && sectionText.length >= DESCRIPTION_MIN && sectionText.length < 8e3) return sectionText;
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
  function htmlToText(html) {
    const decoded = decodeEntities(String(html || ""));
    return decoded.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<\/(p|div|h\d|li|br|tr|section|article)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ");
  }
  function decodeEntities(value) {
    return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, code) => fromCode(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => fromCode(parseInt(code, 16)));
  }
  function fromCode(code) {
    if (!Number.isFinite(code) || code < 1 || code > 1114111) return "";
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
      return [...doc?.querySelectorAll?.(selector) || []];
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

  // src/shared/prompt.js
  function trimToLimit(text, maxLength) {
    const cleaned = String(text || "").trim();
    const limit = Number(maxLength);
    if (!limit || cleaned.length <= limit) return cleaned;
    const slice = cleaned.slice(0, limit);
    const cut = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
    if (cut >= Math.floor(limit * 0.6)) return slice.slice(0, cut).trim();
    return slice.trim();
  }

  // src/content.js
  var HOST_ID = "job-fill-host";
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
      maxLength: null
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
      true
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
          title: document.title
        });
        if (!shouldOfferChip({ label, multiline: true, surface })) return;
        rememberField(target);
        if (!ui.panel.classList.contains("hidden")) return;
        showChip(target);
      },
      true
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
      api().runtime.sendMessage({ type: "focus-frame" }).catch(() => {
      });
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
      const readingJob = Boolean(typedLink || page.source !== "description" && page.link);
      ui.panel.classList.remove("needs-setup");
      setBusy(true, readingJob ? "Reading the job description\u2026" : "Drafting from your resume\u2026");
      const response = await api().runtime.sendMessage({
        type: "draft",
        question: labelFor(state.field),
        pageContext: page.text,
        jobSource: page.source,
        discoveredJobLink: page.link,
        jobLink: typedLink,
        pageUrl: location.href,
        maxLength: state.maxLength,
        adjustment
      }).catch((error) => ({ ok: false, error: error?.message || "Job Fill could not reach its background worker. Reload the page." }));
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
      ui.meta.textContent = limit ? `${text.length} / ${limit} characters \xB7 ${words} words` : `${words} words`;
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
      window.setTimeout(() => ui.toast.classList.add("hidden"), 6e3);
    }
  }
  function createUi() {
    const host = document.createElement("div");
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: "open" });
    document.documentElement.append(host);
    const style = document.createElement("style");
    style.textContent = content_default;
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
    const close = button("\xD7", "icon-button");
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
    jobLink.placeholder = "https://\u2026 if this page has no posting";
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
    return parts.join(" \u2014 ").slice(0, 1e3);
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
    if (!Number.isFinite(limit) || limit < 1 || limit > 1e5) return null;
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
    return { text: cleanPageText(root.innerText || "").slice(0, 6e3), source: "page", link };
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
})();

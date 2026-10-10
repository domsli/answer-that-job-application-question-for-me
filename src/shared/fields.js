const QUESTION_RE =
  /\b(why (are you|do you|would you|this|our|the)|good fit|cover letter|leave a message|tell us|motivate|motivation|interest(ed)?( in)?|about yourself|qualifications|what makes you|introduce yourself|additional information|why this (role|company|position|team)|message to|hiring manager|who you are|your experience|relevant experience|work (history|experience)|describe (a|an|your)|excited about|bring to (this|the)|greatest (strength|weakness)|challenge you)\b/i;

const SKIP_LABEL =
  /^(search|email|e-mail|password|phone|tel|mobile|name|first name|last name|full name|city|state|province|zip|postal code|country|website|url|linkedin|github|portfolio|salary|notice period)$/i;

const JOB_HOSTS = [
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
  /(^|\.)rippling\.com$/,
];

export function looksLikeApplicationQuestion(label) {
  const text = String(label || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return false;
  if (QUESTION_RE.test(text)) return true;
  if (text.includes("?") && text.length > 12) return true;
  if (text.length > 80) return true;
  return false;
}

export function isJobSurface({ host = "", path = "", title = "" } = {}) {
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

export function shouldOfferChip({ label = "", multiline = false, surface = false } = {}) {
  if (!multiline) return false;
  const primary = String(label).split(" — ")[0].trim();
  if (SKIP_LABEL.test(primary)) return false;
  if (looksLikeApplicationQuestion(label)) return true;
  return Boolean(surface);
}

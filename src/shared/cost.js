// Standard input prices in USD per 1M tokens, plus the file-search call fee.
// https://developers.openai.com/api/docs/pricing
const INPUT_PER_MILLION = [
  ["gpt-4o-mini", 0.15],
  ["gpt-4.1-mini", 0.4],
  ["gpt-4.1-nano", 0.1],
  ["gpt-4.1", 2],
  ["gpt-4o", 2.5],
  ["gpt-5-nano", 0.05],
  ["gpt-5-mini", 0.25],
  ["gpt-5.4-nano", 0.2],
  ["gpt-5.4-mini", 0.75],
  ["gpt-5", 1.25],
].sort((a, b) => b[0].length - a[0].length);

const FILE_SEARCH_CALL_USD = 2.5 / 1000;
const RETRIEVAL_TOKEN_CAP = 8 * 800;
const SUBSTANTIAL_CHARS = 400;

export function estimateTokens(chars) {
  return Math.ceil(Math.max(0, Number(chars) || 0) / 4);
}

export function inputDollarsPerToken(model) {
  const name = String(model || "");
  const known = INPUT_PER_MILLION.find(([key]) => name === key || name.startsWith(`${key}-`));
  if (known) return known[1] / 1_000_000;
  if (/mini|nano/i.test(name)) return 0.4 / 1_000_000;
  return 2 / 1_000_000;
}

export function chooseDraftSource({ model, documentChars = 0, hasStore = false } = {}) {
  const chars = Math.max(0, Number(documentChars) || 0);
  if (!hasStore) return { useStore: false, note: "" };
  if (chars < SUBSTANTIAL_CHARS) {
    return {
      useStore: true,
      note: "Searched the vector store. There isn't enough resume text saved in this browser to send instead.",
    };
  }

  const sourceTokens = estimateTokens(chars);
  const price = inputDollarsPerToken(model);
  const retrievedTokens = Math.min(sourceTokens, RETRIEVAL_TOKEN_CAP);
  const pasteCost = sourceTokens * price;
  const searchCost = FILE_SEARCH_CALL_USD + retrievedTokens * price;
  if (searchCost < pasteCost) {
    return {
      useStore: true,
      note: "Searched the vector store. Sending this much resume text would cost more.",
    };
  }
  return {
    useStore: false,
    note: "Used the resume saved in this browser. Searching the store would cost more for this amount of text.",
  };
}

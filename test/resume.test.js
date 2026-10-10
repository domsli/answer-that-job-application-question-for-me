import assert from "node:assert/strict";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import test from "node:test";
import { extractDocx, docxXmlToText } from "../src/shared/docx.js";
import { extractDocument } from "../src/shared/extract.js";
import { extractPdfText } from "../src/shared/pdf.js";
import { isJobSurface, looksLikeApplicationQuestion, shouldOfferChip } from "../src/shared/fields.js";
import { buildMessages, cleanAnswer, completionTokenBudget, trimToLimit } from "../src/shared/prompt.js";
import { normalizeApiKey, validModel } from "../src/shared/storage.js";
import { unzipEntries } from "../src/shared/unzip.js";
import { responseText, statusLabel, validVectorStoreId } from "../src/shared/vector.js";

test("detects the usual application questions and skips contact fields", () => {
  assert.equal(
    looksLikeApplicationQuestion("Leave a message explaining why you would be a good fit."),
    true,
  );
  assert.equal(looksLikeApplicationQuestion("Why do you want to work here?"), true);
  assert.equal(looksLikeApplicationQuestion("Describe a time you led a migration"), true);
  assert.equal(looksLikeApplicationQuestion("City"), false);
  assert.equal(looksLikeApplicationQuestion("Search"), false);
  assert.equal(
    shouldOfferChip({
      label: "Leave a message explaining why you would be a good fit.",
      multiline: true,
      surface: false,
    }),
    true,
  );
  assert.equal(shouldOfferChip({ label: "Email", multiline: true, surface: true }), false);
  assert.equal(shouldOfferChip({ label: "City", multiline: false, surface: true }), false);
  assert.equal(shouldOfferChip({ label: "", multiline: true, surface: true }), true);
});

test("recognizes job application pages", () => {
  assert.equal(isJobSurface({ host: "boards.greenhouse.io", path: "/acme/jobs/1", title: "Job" }), true);
  assert.equal(isJobSurface({ host: "www.linkedin.com", path: "/jobs/view/1", title: "LinkedIn" }), true);
  assert.equal(isJobSurface({ host: "www.linkedin.com", path: "/messaging/", title: "LinkedIn" }), false);
  assert.equal(isJobSurface({ host: "localhost", path: "/", title: "Apply — Product Engineer" }), true);
  assert.equal(isJobSurface({ host: "example.com", path: "/about", title: "Example" }), false);
});

test("builds a grounded prompt and cleans the model answer", () => {
  const messages = buildMessages({
    documents: [{ name: "Resume.pdf", text: "Software engineer at Northwind. Migrated the billing queue." }],
    notes: "Do not claim management experience.",
    question: "Leave a message explaining why you would be a good fit.",
    pageContext: "Northwind is hiring a product engineer.",
    pageUrl: "https://jobs.example.com/apply",
    tone: "direct",
    length: "match",
    maxLength: 280,
    adjustment: "Mention the billing queue.",
  });

  assert.match(messages.system, /Do not invent employers/);
  assert.match(messages.system, /Do not guess a company name/);
  assert.match(messages.user, /Northwind/);
  assert.match(messages.user, /good fit/);
  assert.match(messages.user, /Character limit: stay at or under 280/);
  assert.match(messages.user, /Do not claim management experience/);

  const searched = buildMessages({
    question: "Why would you be a good fit?",
    fileSearch: true,
    notes: "Do not claim management experience.",
  });
  assert.match(searched.system, /file search store/);
  assert.match(searched.user, /Search that store/);
  assert.doesNotMatch(searched.user, /Experience files:\n\(none\)/);
  assert.equal(cleanAnswer('```\n"I shipped the billing queue."\n```'), "I shipped the billing queue.");
  assert.equal(trimToLimit("aaaa bbbb cccc", 10), "aaaa bbbb");
  assert.equal(trimToLimit("abcdefghij", 4), "abcd");
  assert.equal(completionTokenBudget(120), 80);
});

test("reads docx text, including files that store sizes only in the zip directory", async () => {
  const xml = [
    '<?xml version="1.0"?>',
    "<w:document>",
    "<w:p><w:r><w:t>Built billing at Northwind &amp; Co.</w:t></w:r></w:p>",
    "<w:p><w:r><w:t>Led the queue migration.</w:t></w:r></w:p>",
    "</w:document>",
  ].join("");
  const buffer = makeZip([{ name: "word/document.xml", data: Buffer.from(xml), dataDescriptor: true }]);
  const text = await extractDocx(buffer, async (bytes) => inflateRawSync(bytes));
  assert.match(text, /Northwind & Co\./);
  assert.match(text, /Led the queue migration\./);
});

test("rejects a docx that is not a zip", async () => {
  await assert.rejects(
    () => unzipEntries(Buffer.from("hello"), async (bytes) => inflateRawSync(bytes)),
    /not a valid DOCX/,
  );
});

test("reads a vector store id and a file-search answer", () => {
  assert.equal(validVectorStoreId("store vs_abc12345 extra"), "vs_abc12345");
  assert.equal(validVectorStoreId("project"), "");
  assert.equal(statusLabel("completed"), "Ready");
  assert.equal(statusLabel("in_progress"), "Indexing");
  const text = responseText({
    output: [
      { type: "file_search_call", status: "completed" },
      { type: "message", content: [{ type: "output_text", text: "I shipped the billing queue." }] },
    ],
  });
  assert.equal(text, "I shipped the billing queue.");
  assert.equal(cleanAnswer("I shipped it.【4:0†resume.pdf】"), "I shipped it.");
});

test("normalizes the API key and model name", () => {
  assert.equal(normalizeApiKey("Bearer sk-test"), "sk-test");
  assert.equal(validModel("gpt-4o-mini"), "gpt-4o-mini");
  assert.equal(validModel("not a model"), "gpt-4o-mini");
});

test("extracts text, docx, and pdf resumes", async () => {
  const plain = new File(
    ["Built the Northwind billing service and migrated the invoice queue for support teams."],
    "resume.txt",
    { type: "text/plain" },
  );
  assert.match(await extractDocument(plain), /invoice queue/);

  const xml = "<w:document><w:p><w:r><w:t>Shipped the Northwind support console.</w:t></w:r></w:p></w:document>";
  const docx = new File([makeZip([{ name: "word/document.xml", data: Buffer.from(xml) }])], "experience.docx");
  assert.match(await extractDocument(docx), /support console/);

  const pdfText = await extractPdfText(makeSimplePdf("Northwind billing resume text is long enough for the minimum"));
  assert.match(pdfText, /Northwind billing resume/);
});

test("docx xml keeps paragraph breaks", () => {
  const text = docxXmlToText("<w:p><w:t>One</w:t></w:p><w:p><w:t>Two</w:t></w:p>");
  assert.equal(text, "One\nTwo");
});

function makeZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const raw = Buffer.from(file.data);
    const compressed = file.store ? raw : deflateRawSync(raw);
    const method = file.store ? 0 : 8;
    const flags = file.dataDescriptor ? 0x8 : 0;
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(flags),
      u16(method),
      u16(0),
      u16(0),
      u32(0),
      u32(flags ? 0 : compressed.length),
      u32(flags ? 0 : raw.length),
      u16(name.length),
      u16(0),
      name,
      compressed,
    ]);
    locals.push(local);
    centrals.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(flags),
        u16(method),
        u16(0),
        u16(0),
        u32(0),
        u32(compressed.length),
        u32(raw.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  }
  const centralDir = Buffer.concat(centrals);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...locals, centralDir, eocd]);
}

function makeSimplePdf(text) {
  const content = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const parts = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const part of parts) {
    offsets.push(body.length);
    body += part;
  }
  const xrefStart = body.length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let index = 1; index <= 5; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  return Buffer.from(`${body}${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

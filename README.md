# Job Fill

Job Fill drafts answers for long job-application questions from your resume and experience files. You read the draft and insert it yourself. The extension never submits the form.

## Install

1. In this folder, run `npm install`. That installs the PDF reader. Word and text files work without it.
2. In Chrome, open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked**, and select this folder.
3. After an update, click **Reload** on the extension card, then reload the application page.

## Set it up

Open the Job Fill popup from the toolbar.

### API key

Paste an OpenAI API key and click **Test key**. The key is saved in this browser and is used only by the extension.

A ChatGPT Plus, Pro, or Business subscription does not include this key or pay for these requests. The login can be the same, but API billing is separate at [platform.openai.com](https://platform.openai.com/settings/organization/billing). Create the key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). It is shown once.

The default model is `gpt-4o-mini`. With a resume in the vector store, one draft is usually well under a cent. A larger model such as `gpt-4o` costs several times more.

### Vector store

This is where resume and experience files should live.

1. Click **Create**, or paste an existing store id (`vs_...`). An existing store has to belong to the same platform project as the API key. You can find stores at [platform.openai.com/storage/vector_stores](https://platform.openai.com/storage/vector_stores).
2. Drop files on **Upload files to this store**. PDF, DOCX, TXT, Markdown, and other files OpenAI can read are accepted, up to 25 MB each.
3. The list shows each file name and a status: **Ready**, **Indexing**, **Failed**, or **Cancelled**. It does not show the file contents. Wait until a file says **Ready** before drafting. **Remove** detaches it from the store and deletes the file.

The original file stays in your OpenAI account. The extension only remembers the store id. Later drafts do not upload the file again.

A resume and a long experiences file are stored the same way. A 315 KB experiences file is fine here. That size is far under the 25 MB limit.

### Notes

**Notes the draft should follow** is for instructions that are not in the files: work authorization, target roles, or claims the draft must not make. Notes are saved in this browser and are included in every draft.

### Tone and length

- **Tone** is Direct, Warm, or Concise.
- **Length** is Match the field, Short, One paragraph, or Cover letter. Match the field follows the box's character limit when the page has one.
- **Show the draft before inserting it** is on by default. Leave it on. You should read the answer before it replaces what is in the field.

## Draft an answer

On the application page:

1. Click the long answer field, such as "Why would you be a good fit?"
2. Open the Job Fill panel in any of these ways:
   - Click the **Draft from resume** chip next to the field.
   - Right-click the field and choose **Draft answer from resume**.
   - Press **Alt+Shift+J**.
   - Click **Draft focused field** in the popup while that field is focused.
3. Paste a job description link if this page does not include the posting. Nothing is generated when the panel opens.
4. Click **Draft answer**.
5. Read the draft. The form is not submitted.
6. Click **Insert answer**. If the text is longer than the field allows, the button says **Insert within limit** and trims it.
7. **Undo** puts back the text that was in the field before the insert.

**Regenerate** asks for another draft. The tweak box can add a one-off instruction, such as "shorter".

## Job description

A draft looks for the posting on the application page before it writes. It checks the page's structured job data, a block marked as the job description, and headings such as "About the role" or "Responsibilities". The panel says when it used that text. The job description is only context for the role. The draft is still told to take your experience from the resume, not from the posting.

Some forms do not include the posting. Paste a link in **Job description link** in the popup, or in the draft panel, then click **Draft answer**. The extension opens that page and reads the description. If the page has no description but links to one, the draft follows that link on its own. A link that will not open is reported in the panel, and the draft continues with whatever text is on the form.

The chip appears on longer answer boxes, especially when the label looks like an application question or the page is a job site. Short contact fields such as email and city are skipped. If no API key is saved, the chip says **API key needed** and the panel explains what to do.

Drafts are told not to invent employers, job titles, dates, degrees, certifications, tools, numbers, or stories. Still read the result. If the files do not support the question, the answer should stay short and leave the gap unfilled.

## Where the resume text actually is

There are two copies, and they are not the same thing.

**Vector store.** The file you uploaded stays in your OpenAI account. Job Fill cannot read that file back. It can only ask the model to search it. If this is the only copy, every draft searches the store. The panel says: "Searched the vector store. There isn't enough resume text saved in this browser to send instead."

**Browser copy.** Open **Keep a text copy in this browser instead** and drop a file there. The extension extracts the text and saves it on this computer, in the extension's own storage. The list shows the file name and how many characters were extracted. **Edit** lets you fix text the reader missed. **Remove** deletes that local copy only.

The browser copy has tighter limits than the store:

- Up to 8 files.
- Each file must be under 8 MB.
- Extracted text plus notes must stay under 100,000 characters. A larger file is refused, not trimmed. A 315 KB text file is about 300,000 characters, so it will not be saved here. Keep that file in the vector store.
- A scanned PDF often extracts almost no text. Paste the text instead, or upload the PDF to the vector store.

Notes do not count as a resume. A few sentences of notes are not a substitute for the uploaded file.

## Which copy a draft uses

When both copies exist, each draft picks the cheaper one. The panel says which one it used.

Searching the store costs a fixed quarter of a cent, plus the tokens for the snippets that come back (at most about eight chunks). Sending the browser copy costs only the tokens for that text. Notes, the question, and a short excerpt of the job page are sent either way, so they do not change the choice.

For the default model, `gpt-4o-mini`, a normal resume saved in the browser is cheaper to send than to search. The panel then says: "Used the resume saved in this browser. Searching the store would cost more for this amount of text." Searching wins when the saved text is long enough that those tokens cost more than the search fee, or when the model itself is more expensive, such as `gpt-4o`.

A large experiences file that lives only in the store is always searched. That is also the cheaper path: searching costs about a third of a cent, while sending the full 315 KB of text would cost about a cent on `gpt-4o-mini`, and the browser copy cannot hold it anyway.

When a draft does send the browser copy, it includes at most 80,000 characters, and at most 20,000 characters from any one file. A long local file can be cut off. The store does not have that cutoff, because the search returns the relevant parts instead of the whole file.

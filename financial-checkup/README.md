# Financial Checkup

A 3-minute checkup for pool business owners. It shows each person where they're on track and where they have gaps, saves their answers to your Google Sheet, and emails you when someone finishes.

Cost: $0/month (GitHub Pages + Google Sheets).

---

## What's in this folder

| File | What it is | Do you edit it? |
|---|---|---|
| `settings.js` | Your Google Sheet link, your phone/email, firm disclosure | **Yes**, once during setup |
| `pool-owner/config.js` | Every question, answer and result message for the pool checkup | **Yes**, whenever you want to change wording |
| `google-apps-script.gs` | The code that saves answers into your Google Sheet | Only pasted into Google, once |
| `pool-owner/index.html` | The page itself | No |
| `shared/app.js`, `shared/styles.css` | The engine and the look, shared by every checkup | No |
| `index.html` | Sends the main link to the pool checkup | No |

---

## Setup (about 20 minutes, one time)

### Step 1: Fill in your contact info
Open `settings.js` and fill in `phone` and `email` under `advisor`. This only shows to people who choose "Not right now," so they can reach you later. Paste your firm's required disclosure into `firmDisclosure`.

### Step 2: Create the Google Sheet that collects answers
1. Go to **sheets.new** while signed into the Google account where you want the leads to go. Name the sheet **Checkup Responses**.
2. In the menu, click **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete everything in the editor. Open `google-apps-script.gs` from this folder, copy all of it, and paste it in. Click the **save** icon.
4. At the top, find the dropdown next to **Run** (it lists function names). Pick **testSetup** and click **Run**.
   - Google asks for permission. Click **Review permissions**, choose your account, then **Advanced → Go to (project name) (unsafe) → Allow**. The warning is normal because this is your own script and Google hasn't reviewed it.
   - Go back to your Sheet. You should see a new **pool-owner** tab with a test row, and an email in your inbox. Delete the test row.
5. Click **Deploy → New deployment**. Click the gear icon next to "Select type" and choose **Web app**.
   - Description: `Checkup`
   - Execute as: **Me**
   - Who has access: **Anyone**. This only lets the checkup *send* answers in. Nobody can see your sheet.
   - Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. Paste that URL into `settings.js` between the quotes on the `endpoint:` line.

**If you ever change the Apps Script code later:** go to **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. If you don't, Google keeps running the old code.

### Step 3: Put it online with GitHub Pages
1. Go to **github.com/new**. Repository name: `checkup`. Choose **Public** (required for free Pages; only the page code is visible, never your responses). Click **Create repository**.
2. On the next screen, click **uploading an existing file**. Open this `financial-checkup` folder, select **everything inside it** (not the folder itself), and drag it into the browser. Click **Commit changes**.
3. Go to **Settings → Pages**. Under "Branch," pick **main** and **/ (root)**, then click **Save**.
4. Wait 1–2 minutes. Your checkup is live at:
   `https://YOUR-GITHUB-USERNAME.github.io/checkup/pool-owner/`
5. Take it yourself once on your phone, then check that a row appeared in the Sheet.

**To update later:** in the repo, click the file (e.g. `pool-owner/config.js`), click the pencil icon, make the change, then **Commit changes**. Or drag in a new copy of the file. The live site updates in about a minute.

---

## Sending links

Add these to the end of your link:

| Add | What it does | Example |
|---|---|---|
| `?name=Mike` | Greets them by name ("Hey Mike,") and pre-fills their first name. **Only happens if you add it.** The plain link shows no name. | `.../pool-owner/?name=Mike` |
| `?src=fb` | Tags where they came from (shows in the **Source** column) | `.../pool-owner/?src=fb` |
| both | Join them with `&` | `.../pool-owner/?name=Mike&src=warm` |

Use `?name=` for everyone you message personally. It makes the page feel like it was sent to them, and you'll know who it came from even if they skip their last name.

---

## Your Google Sheet

- One row per person who finishes. Each checkup gets its own tab.
- **First/Last name**: required for everyone. Email and phone are only asked for, and only saved, if they tap **Yes** to follow-up, and even then they're optional.
- **Wants follow-up**: Yes means they asked you to look at their results. Reach out to them first.
- **Invested outside business / Investments managed by / Extra business cash**: the sizing questions. Only you see these. They never show on the owner's results. They're also in the subject line of your email alert, e.g. `Checkup: Dave Jones · $500,000 – $1 million · I manage them myself · biz cash $150,000 – $300,000 (WANTS FOLLOW-UP)`.
- **Focus 1–3**: the areas their results flagged. Lead with these when you follow up.
- **Top question**: what they most want answered. This is also good material for Facebook posts.
- **Status, Contacted?, Meeting booked?, Est. AUM, Notes**: these columns are for you to fill in by hand.
- **Email alerts:** you get an email for every submission. To get emails only for people who want follow-up, change `EMAIL_ON` at the top of the Apps Script to `'followup'` and deploy a new version (see Step 2 note).

---

## How the results work

Each answer is marked **On track**, **Worth a look**, or **Gap** in `pool-owner/config.js` (`status: 'good' | 'partial' | 'gap'`). The results page shows:
1. A headline based on how many open items they have (the `verdicts` section).
2. A tally and a checklist of all 8 areas.
3. A **Timing matters** box if they picked selling, retiring, etc. in the "anything big" question.
4. **Where I'd look first**: their top 3 gaps, each with their own answer quoted back to them and "the question to answer." Gaps come before "worth a look." Ties go by `priority` (lower number shows first).
5. What they're doing well, then your note.

No numbers or scores are shown, just their own answers organized so the gaps are obvious.

---

## Adding another checkup later (Contractor, Realtor, etc.)
1. Copy the `pool-owner` folder and rename it, e.g. `contractor`.
2. In the new `config.js`, change `id` to `'contractor'` and rewrite the wording.
3. Upload the new folder. The link is `.../checkup/contractor/` and the answers go to their own **contractor** tab automatically.

---

## Changelog
- **2026-10-05**: Added 3 private sizing questions (investable assets, who manages them incl. advisor satisfaction, extra business cash), each with "Prefer not to say" where sensitive. Shown in Sheet + email subject only.
- **2026-10-05**: Last step now asks only for first + last name and yes/no. Email/phone fields appear only after tapping Yes, and are optional.
- **2026-10-05**: V1. 8 checkup questions + "big changes" + "top question," personal follow-up choice, results page, Google Sheet saving, email alerts, `?name=` and `?src=` links.

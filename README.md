# ग्राम कुम्हारिया चुनाव सर्वेक्षण

An informal opinion survey website for Gram Panchayat Kumhariya. It is not an official election or voting system.

- **Website:** Next.js exported as static files and hosted free on GitHub Pages: https://villageelectionsurvery.github.io/kumhariya/
- **Answers:** saved to your own Google Sheet by a small Google Apps Script (`apps-script/Code.gs`), which serves them back as `leads.json` data (`<web app URL>?action=leads`). There is no server to run.
- **Results:** https://villageelectionsurvery.github.io/kumhariya/survey-result/ reads that `leads.json` data and works out every count and percentage. Its **Download leads.json** button saves all responses as a file.
- **Design:** `design/` holds the Stitch design this site follows.

## One-time setup: connect the Google Sheet

1. **Create the sheet.** In Google Drive, create a new Google Sheet, for example "Kumhariya Survey Responses". Sign in with the Google account that should own the survey data.
2. **Add the script.** In the sheet, open **Extensions → Apps Script**. Delete everything in the editor. Open https://raw.githubusercontent.com/villageelectionsurvery/kumhariya/main/apps-script/Code.gs, press Cmd/Ctrl+A then Cmd/Ctrl+C, paste it into the empty editor, and click **Save**. Line 1 must be `/**`.
3. **Deploy it.** Click **Deploy → New deployment**. Choose the type **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy**, allow the permissions Google asks for, and copy the **Web app URL** (it ends in `/exec`).
4. **Give the URL to the website.** In this GitHub repository, open **Settings → Secrets and variables → Actions → Variables → New repository variable**. Name it `SURVEY_API_URL`, paste the URL as the value, and save.
5. **Redeploy.** Open the **Actions** tab, choose **Deploy to GitHub Pages**, and click **Run workflow**. After about a minute the survey is live.

Until step 4 is done, the survey page shows "सर्वेक्षण जल्द ही शुरू होगा" in place of the form, because answers would have nowhere to be saved.

To download every answer as a `leads.json` file, open `<web app URL>?action=leads` in a browser and save the page.

When you change `Code.gs` later, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

## Where the answers go

Each response is one row in the **Responses** tab: a response ID, the time (Indian time), a device code, and one column pair per post (party and independent candidate name). The `selections_json` column holds the full answer and is what the results page counts. Don't edit or delete that column.

## How duplicates are limited

- **One response per device:** the browser keeps a random ID, and the script stores only a keyed hash of it. A device that has answered sees a "पहले ही दर्ज हो चुकी है" screen, so its answers can't be changed or submitted again.
- This cannot guarantee one response per person: clearing browser data, private browsing, or another phone gets around it.
- Each filled-in form also has its own ID, so a retried or double-clicked submit is saved once.
- The script accepts one submission at a time (a lock), so simultaneous answers are never lost.

## Posts

The survey asks about one post only:

- पंचायत समिति सदस्य — कांग्रेस: आशा मधुसुदन पारीक (कीटाप) / बीजेपी: ओमप्रकाश (कुम्हारिया) / निर्दलीय: पूजा विष्णु कुमार (कीटाप). Polling day is 28 October 2026.

Each party's declared candidate is set with `candidates` on the post in `src/lib/config.ts` and is shown on that party's choice and on the results page. If निर्दलीय has no declared candidate, the villager is asked to write a name instead.

The code still supports name-only (`type: "name"`) and ward (`type: "ward"`) posts, for example Sarpanch or Ward Panch. To bring one back, add it to `POSTS` in `src/lib/config.ts` and to `CONFIG.posts` in `apps-script/Code.gs`.

## Village information

The block under the hero (village line, number of wards, voters, polling centres and the election schedule) comes from `VILLAGE_INFO` in `src/lib/config.ts`.

## Change posts, wards or parties

Edit `POSTS` / `PARTIES` in `src/lib/config.ts` **and** `CONFIG` in `apps-script/Code.gs` the same way (each post has `type: "party"`, `"name"` or `"ward"`), then push and redeploy the script as a new version. A post's `label` is what is saved in the sheet, so keep it unchanged once responses exist; add a new post instead.

The header helpline ("नागरिक सहायता") appears when `helpline` is set in `src/lib/config.ts`.

## Run locally

```bash
npm install
NEXT_PUBLIC_SURVEY_API_URL="<your web app URL>" npm run dev
```

Open http://localhost:3000.

## Limits

Google Apps Script handles a village-size survey comfortably. For a very large public survey (thousands of answers per hour), move the answers to a proper database.

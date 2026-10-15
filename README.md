# ग्राम कुम्हारिया चुनाव सर्वेक्षण

An informal opinion survey website for Gram Panchayat Kumhariya. It is not an official election or voting system.

- **Survey:** https://villageelectionsurvery.github.io/kumhariya/
- **Results:** https://villageelectionsurvery.github.io/kumhariya/survey-result/ (with a **Download leads.json** button)
- **How it works:** a static Next.js site on GitHub Pages; answers are saved in Google Firebase (Cloud Firestore, free plan). There is no server to run.
- **Design:** `design/` holds the Stitch design this site follows.

## One-time Firebase setup

1. Go to https://console.firebase.google.com and click **Create a project**. Name it, for example, `kumhariya-survey`. Google Analytics is not needed; you can turn it off.
2. In the left menu open **Build → Firestore Database → Create database**. Choose location **asia-south1 (Mumbai)**, then **Start in production mode**.
3. Open the **Rules** tab, replace everything with the contents of `firestore.rules`, and click **Publish**.
4. Click the gear icon → **Project settings** → **Your apps** → the web icon **`</>`**. Give the app a name (e.g. `kumhariya-web`), leave "Firebase Hosting" unticked, and click **Register app**.
5. Copy the `firebaseConfig = { ... }` values shown and paste them into `FIREBASE_CONFIG` in `src/lib/config.ts`, then push. (Alternatively, save them as JSON in a repository variable named `FIREBASE_CONFIG`.) The push redeploys the site automatically.

Until step 5 is done, the survey page shows "सर्वेक्षण जल्द ही शुरू होगा" in place of the form.

The `firebaseConfig` values identify your project and are meant to be public; the security rules decide what anyone can do.

## Where the answers go

Firestore collection `responses`, one document per device:

```json
{
  "response_id": "20261015-0123456789abcdef",
  "submitted_at": "<server time>",
  "selections": {
    "सरपंच": { "party": "कांग्रेस", "candidate_name": null },
    "वार्ड पंच - वार्ड 2": { "party": "निर्दलीय", "candidate_name": "सीता देवी" }
  }
}
```

The **Download leads.json** button on the results page exports everything in the `leads.json` format (`{"survey": ..., "responses": [...]}`), times in Indian time.

## What the security rules enforce

- Anyone can add **one** response per device; nobody can edit or delete a saved response.
- Every post must be answered, only कांग्रेस / बीजेपी / निर्दलीय are accepted, and निर्दलीय needs a 2–60 character name.
- The time is set by Google's server, so it can't be faked.
- No other data or collections can be written.

## How duplicates are limited

- The browser keeps a random ID; the response is saved under a SHA-256 hash of it, and the rules refuse a second response under the same hash. That device then sees "पहले ही दर्ज हो चुकी है".
- This cannot guarantee one response per person: clearing browser data, private browsing, or another phone gets around it.

## Change posts, wards or parties

Edit `POSTS` / `PARTIES` in `src/lib/config.ts` **and** the post labels and party names in `firestore.rules` the same way, publish the rules, then push. A post's `label` is saved with each response, so keep it unchanged once responses exist.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. It uses the Firebase project set in `src/lib/config.ts`.

## Free plan limits

The free Spark plan allows 50,000 reads and 20,000 writes per day. The results page uses count queries (about one read per 1,000 responses for each count) plus the निर्दलीय responses, so a village-size survey stays well inside the free limits.

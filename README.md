# ग्राम कुम्हारिया चुनाव सर्वेक्षण

An informal opinion survey website for Gram Panchayat Kumhariya. It is not an official election or voting system.

Built with PHP 8, Bootstrap 5 and Chart.js, following the design in `DESIGN.md` / `screen.png`.

## Pages

| File | Purpose |
| --- | --- |
| `index.php` | Survey form: one card per post, independent-candidate name box, review sidebar, confirmation dialog, thank-you screen |
| `submit_survey.php` | Validates and saves a response to `data/leads.json` |
| `results.php` | Results dashboard: totals, party counts and percentages, independent candidates, doughnut and bar charts |
| `config.php` | Posts, wards, parties, header helpline number and optional name/phone fields |

## Run locally

```bash
php -S localhost:8765 router.php
```

Open http://localhost:8765. `router.php` is only for PHP's built-in server; on Apache the `.htaccess` files do the same job.

## Change posts or wards

Edit the `posts` list in `config.php`. Each post's `label` is the key saved in `leads.json`, so don't rename a label after responses exist for it; add a new post instead.

## Optional respondent details

Name and phone are off. Set `optional_fields.name` or `optional_fields.phone` to `true` in `config.php` to show them as optional fields.

## How data is stored

- Each response gets a unique ID and an Indian-time timestamp, and only the chosen party or independent candidate name per post is saved.
- Every read and write locks the file; writes go to a temporary file that replaces `leads.json` in one step.
- If `leads.json` is ever damaged, new submissions are refused and the file is left as it is, so nothing is overwritten. Fix or restore the file to resume.
- **One response per device:** each browser gets a random ID in a cookie (`kum_device`), and only a keyed hash of it is saved with the response (`device_hash`). Once a device has submitted, it sees a "पहले ही दर्ज हो चुकी है" screen instead of the form, so the answers can't be changed or submitted again from it. The hashing key is created automatically in `data/device.key`; keep it with your backups, since deleting it lets every device submit again.
- This limits casual repeat submissions but cannot guarantee one response per person: clearing cookies, private browsing, or another browser or phone gets around it.
- A one-time form token also stops the same form from being saved twice (double clicks, page resubmits).
- The `data/` folder is blocked from web access. Back up `data/leads.json` regularly.

This JSON file setup suits a small survey. For a large public survey, move storage to a database (MySQL or SQLite) to avoid data loss under heavy use.

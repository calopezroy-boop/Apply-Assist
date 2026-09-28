# Apply Assist

A private job discovery and application workspace for full-time offshore Operations VA and E-commerce Order Management roles. Collect, review, shortlist, paste the full job description, and generate an introduction from your factual resume. It never submits applications or sends messages.

## What works

- Search Google Jobs and indexed LinkedIn, Indeed, Glassdoor and OnlineJobs.ph postings through SerpApi. Up to one page / ten entries per source per click; each selected source uses one provider request. Sources can fail independently. No job-board passwords or browser cookies are required.
- Deduplicate by normalized posting URL, or matching title, known company and location. Existing status and drafts are preserved. Listings without company names are not aggressively merged.
- Review source, salary if returned, posting age if returned, description, and conservative location flags. Target keywords do not prove employer country, full-time availability, or Philippine eligibility. All listings must be checked at the source.
- Manually add jobs and paste full descriptions. Indexed results usually provide only snippets. The app does not fetch arbitrary posting URLs or bypass board logins.
- Generate drafts with Gemini from the resume and selected description. It asks for factual claims and separate review notes; review generated text before sending.
- Copy a complete AI prompt without an API key, edit drafts, open the source posting, and track progress yourself.
- Browser-local persistence and JSON backup import/export. No database or paid persistent disk required. No cross-device sync. Clearing browser data removes your saved jobs. Changing deployment URL creates a separate workspace; export/import to migrate.

## Run locally

Install Node.js 22.16 or later. From this folder:

```text
npm start
```

Open http://localhost:4185. No dependencies need installing. To enable providers, copy `.env.example` to `.env` and fill the keys. Do not commit `.env`. Local mode without APP_PASSWORD binds only to localhost. Hosted production refuses startup without a password of at least 16 characters.

## Deploy to Render

1. Put this folder's contents at the root of your GitHub repository. This public distribution has an empty `resume.txt`. Paste your own resume in the app and click Save resume; do not commit personal information or API keys.
2. In Render choose New > Blueprint and connect that repository. `render.yaml` defines the Node service. Alternatively choose New > Web Service, runtime Node, build command `npm install --ignore-scripts`, start command `npm start`, health check `/health`.
3. Set `SERPAPI_API_KEY` and `GEMINI_API_KEY` in Render's Environment settings. Use your provider accounts; usage may incur charges. Do not paste keys into the client JavaScript or commit them.
4. The Blueprint generates `APP_PASSWORD`. Find it in Environment and use it to unlock the app. If configuring manually, set a strong password with at least 16 characters and set `NODE_ENV=production`.
5. `GEMINI_MODEL` defaults to `gemini-3.8-flash`, as documented when built. Set a generateContent-compatible model available to your account if needed. If a provider rejects a model/key/quota, the app displays an error rather than fabricating results.
6. Deploy and open your `onrender.com` address. The server binds Render's `PORT`. Add provider keys later if you want to begin with manual entry and Copy AI prompt.

No Render deployment has been performed by packaging this project. Free Render services can spin down after inactivity; the first request can take longer. Data is kept in your browser, so server redeployment does not erase it as long as the URL stays the same.

## Privacy and access

Single-user app, not a multi-tenant product. The server protects its APIs and bundled resume with APP_PASSWORD. The password is held in sessionStorage for the tab session; lock clears it. Job and resume data remain in localStorage on the same device after locking; use a trusted device/browser profile. Provider keys never go to the browser. Search phrases go to SerpApi; the resume and selected job description go to Gemini only on Generate intro. No scheduled searches, background submissions, or email sending.

The public folder contains only static UI. API calls require same-origin access where an Origin header is supplied, JSON bodies, size limits and authentication. Provider requests have timeouts, concurrency limits and a shared 12-request/minute limit. These limits reset on restart. This is intended for one private user, not an unrestricted public service.

## Validation

Run `npm test`. Tests use mocked provider responses and cover deduplication, conservative eligibility flags, backup validation, partial collection failures, prompt construction, authentication and private-file protection. Live provider calls require your keys and were not validated without them.

## Reference documentation

- Render: https://render.com/docs/web-services
- Free hosting limits: https://render.com/docs/free
- Search API: https://serpapi.com/google-jobs-api and https://serpapi.com/search-api
- AI API: https://ai.google.dev/api/generate-content


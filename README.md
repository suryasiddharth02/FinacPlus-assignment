# QA Automation — Playwright (JavaScript)

Covers the full assignment:

| # | Area | What is tested |
|---|------|----------------|
| 1 | UI   | Login to DemoQA Book Store, validate username + logout button |
| 2 | UI   | Search "Learning JavaScript Design Patterns", validate result |
| 3 | UI   | Print Title / Author / Publisher to `book-details.txt` |
| 4 | UI   | Log out |
| 5 | API  | POST `/users` → create user, assert 201, store `userId` |
| 6 | API  | GET `/users/{id}` → fetch & validate user details |
| 7 | API  | PUT `/users/{id}` → update name, validate response |
| 8 | API  | PATCH `/users/{id}` → partial update, validate |

---

## Prerequisites

- **Node.js ≥ 18**
- A manually created DemoQA account → Register at <https://demoqa.com/register>
- A free reqres.in API key → Sign up at <https://app.reqres.in>

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (first time only)
npx playwright install chromium

# 3. Configure credentials — open test-config.js and fill in all three values:

#    DemoQA (UI tests)
#      USERNAME: 'your_demoqa_username'
#      PASSWORD: 'your_demoqa_password'

#    reqres.in (API tests)
#      API_KEY:  'your_reqres_api_key'   ← get this from https://app.reqres.in
```

---

## Running Tests

```bash
# Run all tests (UI + API)
npx playwright test

# UI tests only
npx playwright test ui-bookstore.spec.js

# API tests only
npx playwright test api-reqres.spec.js

# Watch the browser live
npx playwright run test --headed

# Open the HTML report after a run
npx playwright show-report
```

---

## Output Files

| File | Description |
|------|-------------|
| `book-details.txt` | Title, Author, Publisher written after the UI test run |
| `playwright-report/` | Full Playwright HTML test report |

---

## Project Structure

```
qa-automation/
├── playwright.config.js       # Playwright configuration (headless Chromium, 1 worker)
├── test-config.js             # Credentials & base URLs — edit this before running
├── package.json               # npm scripts and dependencies
├── book-details.txt           # Generated after UI test run
└── tests/
    ├── ui-bookstore.spec.js   # UI tests — DemoQA Book Store
    └── api-reqres.spec.js     # API tests — reqres.in
```

---

## Notes

### DemoQA (UI)
- **Ad overlays**: DemoQA serves Google Ad iframes that intercept clicks.
  `dismissOverlays()` removes all iframes via JavaScript before every click,
  and all sidebar/link clicks use `{ force: true }` to guarantee they fire
  even if a new ad loads between the removal and the click.
- **No `networkidle`**: DemoQA keeps a long-polling XHR connection alive
  permanently, so `waitForLoadState('networkidle')` never resolves.
  The tests use `domcontentloaded` + element visibility checks instead.
- **Inline navigation**: Clicking a book title renders the detail view
  inline on the same page — the URL does not change to `/books?book=...`.
  The tests wait for detail-specific labels (`ISBN`, `Author`) to appear
  instead of waiting for a URL change.

### reqres.in (API)
- **Real API key required**: reqres.in no longer accepts the old static
  key `reqres-free-v1`. Every request without a valid key returns `404`.
  Get your free key at <https://app.reqres.in> and set it in `test-config.js`.
- **GET uses seeded IDs**: The `/users/{id}` GET endpoint only returns data
  for pre-seeded users with IDs 1–12. The ID returned from POST is a mock
  and is not retrievable via GET. The GET test validates against seeded ID 1.
- **Full absolute URLs**: All API calls use `https://reqres.in/api/users`
  (absolute path) rather than relative paths, because Playwright's
  `baseURL` path-prefix resolution drops sub-paths on relative URLs.

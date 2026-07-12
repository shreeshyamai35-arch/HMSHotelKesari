# CSV Download Automation

A Playwright script that opens Chromium, logs into a web service, clicks a
download button, and saves the CSV to your Desktop.

## Setup

```cmd
cd automation
npm install
copy .env.example .env
```

Then edit `.env` with the service URL and your credentials.

## Configure selectors

Open `download-csv.mjs` and update the values marked `TODO` in the `SELECTORS`
object so they match the real site. To find a selector: open the site in
Chrome, right-click the element (username field, password field, login button,
download button), choose **Inspect**, and copy a stable selector. Prefer
`id`, `name`, or `data-*` attributes over auto-generated class names.

## Run

```cmd
node download-csv.mjs
```

The browser opens visibly (not headless) so you can watch it and handle any
prompts like 2FA. On success the CSV lands on your Desktop. On failure a
screenshot `automation-error.png` is saved to the Desktop to help debug.

## Notes / limitations

- 2FA, CAPTCHA, and SSO (Google/Microsoft login) flows usually can't be fully
  automated. With `headless: false` you can complete those steps manually while
  the script waits.
- Credentials are read from `.env` and never hardcoded. `.env` is gitignored.

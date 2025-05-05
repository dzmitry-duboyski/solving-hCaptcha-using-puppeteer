# Sample code to automate hCaptcha solution using Puppeteer

## Description

This code example demonstrates how to automate solving a hCaptcha in JavaScript using the [Puppeteer](https://pptr.dev/) library. To captcha solving, this example uses the [2captcha.com](https://2captcha.com/?from=16653706) service. This example solves the captcha located on the page https://2captcha.com/demo/hcaptcha?difficulty=difficult. You need to have a [2captcha.com](https://2captcha.com/?from=16653706) account for the example to work.

## ⚠️ Disclaimer & Ethical Use

This project demonstrates how to programmatically interact with hCaptcha using Puppeteer and is intended **for educational and research purposes only**.

It is designed to help developers understand CAPTCHA challenges, test integration with CAPTCHA-solving services, and evaluate automated browsing tools in controlled environments.

> [!WARNING]  
> Do **not** use this tool to interact with websites without permission.  
> Do **not** generate excessive or abusive traffic to third-party services.  
> Unauthorized or unethical use may violate the terms of service of target websites and lead to legal consequences.

Please be respectful and responsible. Use this repository to **test your own systems**, **evaluate CAPTCHA behavior**, or **simulate integrations** — **not** to disrupt or exploit others.

## How to start:

### Cloning

`git clone https://github.com/dzmitry-duboyski/solving-hCaptcha-using-puppeteer.git`

### Install dependencies

`npm install`

### Setup

Set your `APIKEY` in [./index.js#L5](./index.js#L5) file

> `APIKEY` is specified in the personal account [2captcha.com](https://2captcha.com/?from=16653706). Before copying the `APIKEY`, check the selected role, the **"developer"** role must be installed in the personal account.

### Start

`npm run start`

<!-- Demonstration - GIF -->

## How it works

This section describes the general logic of CAPTCHA solving using our API. The process consists of 5 main steps:

1. **STEP #1 - Open the page with the CAPTCHA**
   Open the target page and detect the presence of a CAPTCHA challenge.  
> [!TIP]
> Note: The CAPTCHA may be embedded in an `iframe` or loaded dynamically, so make sure to wait for the necessary elements to load before proceeding.

2. **STEP #2 - Extract CAPTCHA parameters**  
   Determine the parameters required to solve the CAPTCHA.  
   In this example, parameters are hardcoded for simplicity. However, in real scenarios, you may need to dynamically extract them from the page each time. Reasons include:
   - - The CAPTCHA may be inside an `iframe`, so it's important to pass the correct `page url`.
   - There may be multiple CAPTCHA challenges on the page, with only one active depending on the conditions.
   - Some CAPTCHAs include dynamic  values that change on each page load.

3. **STEP #3 - Submit CAPTCHA to the API**  
   Send a request to the API 2captcha with the extracted parameters.

4. **STEP #4 - Receive the CAPTCHA token**  
   Wait for the response from the API. This usually contains a token or a code needed to pass the CAPTCHA.  

> [!NOTE] 
> You should handle possible errors at this step:  
> - If the CAPTCHA is not solved successfully, try to resend it.  
> - Check for timeouts or invalid API responses.

5. **STEP #5 - Apply the solution**
   Use the returned token on the target page.
   This step depends on how the CAPTCHA is integrated into the site. Typical approaches include:
   - Setting the token value in a hidden input field.
   - Executing a JavaScript callback with the token.
   - Triggering a form submission.

> [!TIP]
> If you're unsure how the token is applied:
> - Analyze how the token is applied after manually solving the CAPTCHA.
> - Analyze network traffic after manually solving the CAPTCHA.
> - Inspect JavaScript event listeners and DOM mutations.
> - Use browser dev tools to simulate interactions.

6. **STEP #6 - Verify the solution**  
   After applying the token, you should verify whether the CAPTCHA was successfully solved.

   - If the token is accepted, proceed with the next steps in your workflow.
   - If the token is **not** accepted, implement additional logic:
     - Retry solving the CAPTCHA.
     - Restart the script or reload the page, depending on your setup.

> [!IMPORTANT]  
> It is **strongly recommended** to report the result back to the 2captcha API:  
> - Use `reportgood` if the token was accepted and the CAPTCHA was successfully solved.  
> - Use `reportbad` if the token was rejected or failed to solve the CAPTCHA.

## Source code

```js
import puppeteer from "puppeteer";
import { Solver } from "2captcha-ts";
const solver = new Solver('<Your 2captcha APIKEY>');

;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
    
 // STEP #1 - Open the page with the CAPTCHA
  // Open the target page and detect the presence of a CAPTCHA challenge.
  console.log("STEP #1 - Open the page with the CAPTCHA")
  await page.goto("https://accounts.hcaptcha.com/demo");
  await page.waitForSelector("div.h-captcha iframe");
  await page.waitForTimeout(5000);

  // STEP #2 - Extract CAPTCHA parameters
  // In this example, parameters are hardcoded for simplicity. However, in real scenarios,
  // you may need to dynamically extract them from the page each time.
  console.log("STEP #2 - Extract CAPTCHA parameters")
  const pageURL = "https://accounts.hcaptcha.com/demo"
  const sitekey = "a5f74b19-9e45-40e0-b45d-47ff91b7a6c2"
  await page.waitForTimeout(5000);

  // STEP #3 - Submit CAPTCHA to the API
  console.log("STEP #3 - Submit CAPTCHA to the API")
  const res = await solver.hcaptcha({
    pageurl: pageURL,
    sitekey: sitekey,
  });
  await page.waitForTimeout(5000);

  // STEP #4 - Receive the CAPTCHA token
  console.log("STEP #4 - Receive the CAPTCHA token")
  console.log(res);
  const captchaAnswer = res.data;
  const captchaID = res.id;
  await page.waitForTimeout(5000);

  // STEP #5 - Apply the solution
  console.log("STEP #5 - Apply the solution")
  const setAnswer = await page.evaluate((captchaAnswer) => {
    document.querySelector(
      "textarea[name='h-captcha-response']"
    ).style.display = "block";
    document.querySelector("textarea[name='h-captcha-response']").value =
      captchaAnswer;
  }, captchaAnswer);

  // Press the button to check the result.
  await page.click('input[type="submit"]');
  await page.waitForTimeout(5000);

  // STEP #6 - Verify the solution
  console.log("STEP #6 - Verify the solution")
  await page.waitForSelector("pre.hcaptcha-success");

  const resultBlockSelector = "pre.hcaptcha-success";
  const statusSolving = await page.evaluate((selector) => {
    return document.querySelector(selector).innerText;
  }, resultBlockSelector);

  const statusSolvingJSON = JSON.parse(statusSolving);
  const isSuccessSolving = statusSolvingJSON.success;

  if (isSuccessSolving) {
    // Send a report to the API confirming that the CAPTCHA was solved correctly
    await solver.goodReport(captchaID)
    console.log("Captcha solved successfully!!!");
  } else {
    // Send a report to the API indicating that the CAPTCHA was solved incorrectly
    await solver.badReport(captchaID)
    console.log("Captcha solving failed!!!");
  }

  await page.waitForTimeout(5000);
  browser.close();
})();
```

The source code is available in the file [index.js](/index.js)

## Additional information:

- [hCaptcha demo page](https://accounts.hcaptcha.com/demo)
- [Documentation for hCaptcha solution in 2captcha service](https://2captcha.com/2captcha-api#solving_hcaptcha?from=16653706).
- [How to bypass hCaptcha](https://2captcha.com/p/hcaptcha/?from=16653706)
- [How to solve hCaptcha on Cloudflare-protected websites](https://2captcha.com/blog/hcaptcha-cloudflare-en?from=16653706)

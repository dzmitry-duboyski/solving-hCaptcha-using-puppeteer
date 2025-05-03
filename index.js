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
  await page.goto("https://accounts.hcaptcha.com/demo");
  await page.waitForSelector("div.h-captcha iframe");

  // STEP #2 - Extract CAPTCHA parameters
  // In this example, parameters are hardcoded for simplicity. However, in real scenarios,
  // you may need to dynamically extract them from the page each time.
  const pageURL = "https://accounts.hcaptcha.com/demo"
  const sitekey = "a5f74b19-9e45-40e0-b45d-47ff91b7a6c2"

  // STEP #3 - Submit CAPTCHA to the API
  const res = await solver.hcaptcha({
    pageurl: pageURL,
    sitekey: sitekey,
  });

  console.log(res);

  // STEP #4 - Receive the CAPTCHA token
  const captchaAnswer = res.data;

  // STEP #5 - Apply the solution
  const setAnswer = await page.evaluate((captchaAnswer) => {
    document.querySelector(
      "textarea[name='h-captcha-response']"
    ).style.display = "block";
    document.querySelector("textarea[name='h-captcha-response']").value =
      captchaAnswer;
  }, captchaAnswer);

  // Press the button to check the result.
  await page.click('input[type="submit"]');

  // STEP #6 - Verify the solution
  await page.waitForSelector("pre.hcaptcha-success");

  const resultBlockSelector = "pre.hcaptcha-success";
  const statusSolving = await page.evaluate((selector) => {
    return document.querySelector(selector).innerText;
  }, resultBlockSelector);

  const statusSolvingJSON = JSON.parse(statusSolving);
  const isSuccessSolving = statusSolvingJSON.success;

  if (isSuccessSolving) {
    console.log("Captcha solved successfully!!!");
  } else {
    console.log("Captcha solving failed!!!");
  }

  await page.waitForTimeout(5000);
  browser.close();
})();

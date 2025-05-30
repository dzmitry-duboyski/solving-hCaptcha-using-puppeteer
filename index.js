import puppeteer from "puppeteer";
import { Solver } from "2captcha-ts";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.API_KEY || "<Your 2captcha APIKEY>";
const solver = new Solver(apiKey);


;(async () => {
  // const width = 900;
  // const height = 670;

  const browser = await puppeteer.launch({
    headless: false,
    // args: [`--window-size=${width},${height}`]
  });

  const page = await browser.newPage();
  // await page.setViewport({ width: 1080, height: 1024 });
    
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

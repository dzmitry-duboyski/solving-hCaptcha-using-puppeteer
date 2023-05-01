import puppeteer from "puppeteer";
import { Solver } from "2captcha-ts";
const solver = new Solver('<Your 2captcha APIKEY>');

;(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  // Open target page
  await page.goto("https://2captcha.com/demo/hcaptcha?difficulty=difficult");
  await page.waitForSelector("div.h-captcha iframe");

  // Get the `sitekey` parameter from the current page
  const sitekey = await page.evaluate(() => {
    const url = document.querySelector("div.h-captcha iframe").src;
    const pureSiteKey = url.split("sitekey=")[1].split("&")[0];
    return pureSiteKey;
  });

  console.log(`sitekey: ${sitekey}`);

  // Send a captcha to the 2captcha service to get a solution
  const res = await solver.hcaptcha({
    pageurl: "https://2captcha.com/demo/hcaptcha?difficulty=difficult",
    sitekey: sitekey,
  });

  console.log(res);

  // The resulting solution
  const captchaAnswer = res.data;

  // Use the resulting solution on the page
  const setAnswer = await page.evaluate((captchaAnswer) => {
    document.querySelector(
      "textarea[name='h-captcha-response']"
    ).style.display = "block";
    document.querySelector("textarea[name='h-captcha-response']").value =
      captchaAnswer;
  }, captchaAnswer);

  // Press the button to check the result.
  await page.click('button[type="submit"]');

  // Check result
  await page.waitForSelector("form div pre code");

  const resultBlockSelector = "form div pre code";
  let statusSolving = await page.evaluate((selector) => {
    return document.querySelector(selector).innerText;
  }, resultBlockSelector);

  statusSolving = JSON.parse(statusSolving);
  if (statusSolving.success) {
    console.log("Captcha solved successfully!!!");
  }

  await page.waitForTimeout(5000);
  browser.close();
})();

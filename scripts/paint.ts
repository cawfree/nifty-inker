import puppeteer from 'puppeteer';

async function scrollTo(page: puppeteer.Page, x: number, y: number) {
  await page.evaluate(
    (_x, _y) => window.scrollTo(parseInt(_x), parseInt(_y)),
    x,
    y
  );
}

// https://stackoverflow.com/a/60254260/1701465
async function clickOnElement(
  page: puppeteer.Page,
  elem: puppeteer.ElementHandle,
  x: number,
  y: number
) {
  const { x: x0, y: y0 } = (await elem.boundingBox()) as puppeteer.BoundingBox;
  await scrollTo(page, 0, y0);
  await page.mouse.move(x0 + x - 1, y - 1);
  await page.mouse.move(x0 + x, y);
  await page.mouse.click(x0 + x, y);
  await scrollTo(page, 0, 0);
}

const setInputValue = async (
  page: puppeteer.Page,
  input: puppeteer.ElementHandle,
  value: string
) => {
  await input.click({ clickCount: 3 });
  await page.keyboard.type(value);
  await page.keyboard.type(String.fromCharCode(13));
};

const setBrushSize = async (page: puppeteer.Page, size: number) => {
  const numberInputs = await page.$$('input.ant-input-number-input');
  const sizeInput = numberInputs[numberInputs.length - 1];
  await setInputValue(page, sizeInput, `${size}`);
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });
  const page = await browser.newPage();
  await page.goto('https://nifty.ink');

  await setBrushSize(page, 30);
  await scrollTo(page, 0, 0);

  const canvases = await page.$$('canvas');
  const canvas = canvases[canvases.length - 1];

  const {
    width,
    height,
  } = (await canvas.boundingBox()) as puppeteer.BoundingBox;

  await clickOnElement(page, canvas, 1, 1);
  await clickOnElement(page, canvas, width - 1, 1);
  await clickOnElement(page, canvas, width - 1, height - 1);
  await clickOnElement(page, canvas, 1, height);

  await new Promise((resolve) => setTimeout(resolve, 10000));

  await browser.close();
})();

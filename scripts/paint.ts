import Color from 'color';
import Jimp from 'jimp';
//import { shuffle } from 'lodash';
import puppeteer from 'puppeteer';

async function delay() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

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
  y: number,
  count: number
) {
  const { x: x0, y: y0 } = (await elem.boundingBox()) as puppeteer.BoundingBox;
  await scrollTo(page, 0, y0);
  await delay();

  // eslint-disable-next-line functional/no-loop-statement,functional/no-let
  for (let i = 0; i < count; i += 1) {
    await page.mouse.click(x0 + x, y);
    await delay();
  }

  await delay();
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
  await delay();
};

const setBrushSize = async (page: puppeteer.Page, size: number) => {
  await scrollTo(page, 0, 0);
  await delay();
  const numberInputs = await page.$$('input.ant-input-number-input');
  const sizeInput = numberInputs[numberInputs.length - 1];
  await setInputValue(page, sizeInput, `${size}`);
  await delay();
  await scrollTo(page, 0, 0);
};

const setBrushColor = async (page: puppeteer.Page, color: string) => {
  const buttons = await page.$$('button');
  await buttons[10].click();
  const inputs = await page.$$('input');
  await setInputValue(page, inputs[2], color);
  await buttons[10].click();
  await buttons[10].click();
  await page.mouse.click(0, 0);
  await scrollTo(page, 0, 0);
  await delay();
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });
  const page = await browser.newPage();
  await page.goto('https://nifty.ink');

  const brushSize = 24;
  await setBrushColor(page, 'FF0000');

  const canvases = await page.$$('canvas');
  const canvas = canvases[canvases.length - 1];

  const {
    width,
    height,
  } = (await canvas.boundingBox()) as puppeteer.BoundingBox;

  const image = await Jimp.read(
    'https://i.imgur.com/a8kYFAf.png'
    //'https://static.coindesk.com/wp-content/uploads/2020/12/Hayden-Adams-LinkedIn-285x285.jpeg'
    //'https://pbs.twimg.com/profile_images/1004469891498434560/MUJLxUf8_400x400.jpg'
    //'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_400x400.jpg'
    //'https://pbs.twimg.com/profile_images/586603361241321472/lSYz_Uqj_400x400.jpg'
    //'https://pbs.twimg.com/profile_images/1158079861967081472/GflgY1rG_400x400.jpg'
  );
  const resizedImage = await image.resize(width, height);

  type Point = {
    readonly x: number;
    readonly y: number;
    readonly color: Color;
  };

  const dots = [];

  // eslint-disable-next-line functional/no-loop-statement,functional/no-let
  for (let y = 1; y < height; y += brushSize * 0.5) {
    // eslint-disable-next-line functional/no-loop-statement,functional/no-let
    for (let x = 1; x < width; x += brushSize * 0.5) {
      const color = Color(resizedImage.getPixelColor(x, y) >> 8);
      // eslint-disable-next-line functional/immutable-data
      dots.push({ x: x, y: y, color } as Point);
    }
  }

  const shuffled = dots; //shuffle(dots);

  // eslint-disable-next-line functional/no-loop-statement,functional/no-let
  for (let i = 0; i < shuffled.length; i += 1) {
    const { x, y, color } = shuffled[i];
    await setBrushColor(page, color.hex().substring(1));
    await setBrushSize(page, brushSize);
    await clickOnElement(page, canvas, x, y, 2);
  }

  await new Promise((resolve) => setTimeout(resolve, 24 * 60 * 60 * 1000));
  await browser.close();
})();

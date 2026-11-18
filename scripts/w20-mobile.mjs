import { chromium, devices } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const iPhone = devices["iPhone 12"];
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ ...iPhone });
const p = await ctx.newPage();
await p.goto("http://127.0.0.1:8877/schedule.html?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(1200);
const pills = await p.evaluate(() => {
  const talk = [...document.querySelectorAll(".cal-pill")].find((el) => el.textContent.includes("Разговорный"));
  if (!talk) return null;
  const cs = getComputedStyle(talk);
  return {
    text: talk.textContent.trim(),
    whiteSpace: cs.whiteSpace,
    height: Math.round(talk.getBoundingClientRect().height),
    width: Math.round(talk.getBoundingClientRect().width),
    overflow: talk.scrollWidth > talk.clientWidth + 2,
    lines: Math.round(talk.getBoundingClientRect().height / parseFloat(cs.lineHeight)),
  };
});
console.log("PILL", pills);
await p.screenshot({ path: path.join(OUT, "w20-mobile-schedule.png") });

await p.goto("http://127.0.0.1:8877/?t=" + Date.now(), { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.locator('button[aria-label="Открыть меню"]').click();
await p.waitForTimeout(400);
const menu = await p.evaluate(() => {
  const section = document.querySelector(".site-mobile-section");
  const link = document.querySelector(".site-mobile-link");
  const sFs = section && parseFloat(getComputedStyle(section).fontSize);
  const lFs = link && parseFloat(getComputedStyle(link).fontSize);
  return {
    sectionText: section?.textContent?.trim(),
    linkText: link?.textContent?.trim(),
    sectionFs: sFs,
    linkFs: lFs,
    sectionLarger: sFs > lFs,
  };
});
console.log("MENU", menu);
await p.screenshot({ path: path.join(OUT, "w20-mobile-menu.png") });

// carousel touch handlers present
const touch = await p.evaluate(() => {
  const sec = document.querySelector(".atmosphere-section");
  return { hasSection: !!sec, touchAction: sec && getComputedStyle(document.querySelector(".circular-stage")).touchAction };
});
console.log("CAROUSEL", touch);

// simulate touch drag
const box = await p.locator(".circular-stage").boundingBox();
if (box) {
  const before = await p.evaluate(() => {
    const el = document.querySelector("[x-data*='circularGallery'], [x-data^=\"circularGallery\"]");
    // alpine data
    return Alpine.$data(document.querySelector(".circular-track")?.parentElement || document.querySelector("[x-data]"))?.rotation;
  });
  // find alpine root
  const rotBefore = await p.evaluate(() => {
    const root = document.querySelector("#atmosphere [x-data]");
    return root ? Alpine.$data(root).rotation : null;
  });
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await p.evaluate(({ x, y }) => {
    const el = document.querySelector(".atmosphere-section");
    el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })] }));
    el.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: y - 80 })] }));
    el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true, touches: [] }));
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await p.waitForTimeout(200);
  const rotAfter = await p.evaluate(() => {
    const root = document.querySelector("#atmosphere [x-data]");
    return root ? Alpine.$data(root).targetRotation : null;
  });
  console.log("ROT", { rotBefore, rotAfter, delta: (rotAfter ?? 0) - (rotBefore ?? 0) });
}

await b.close();


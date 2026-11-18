import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "networkidle" });
await p.evaluate(() => {
  const d = document.querySelector("header")._x_dataStack[0];
  const orig = d.openPanel;
  d.openPanel = function (id) {
    const el = this.$el;
    const nav = el && el.querySelector(".site-nav-desk");
    const trig = el && el.querySelector('[data-nav="' + id + '"]');
    window.__opLog = {
      id,
      elTag: el && el.tagName,
      hasNav: !!nav,
      hasTrig: !!trig,
      left: nav && trig ? trig.getBoundingClientRect().left - nav.getBoundingClientRect().left : null,
    };
    return orig.call(this, id);
  };
});
await p.locator('a[data-nav="articles"]').hover();
await p.waitForTimeout(350);
console.log(await p.evaluate(() => ({
  log: window.__opLog,
  panelLeft: document.querySelector("header")._x_dataStack[0].panelLeft,
  open: document.querySelector("header")._x_dataStack[0].open,
})));
await b.close();

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
const OUT = "memory/client-review/shots";
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://127.0.0.1:8765/?t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(2000);
const v = await p.evaluate(() => {
  const vid = document.querySelector(".film-video");
  return {
    duration: vid && isFinite(vid.duration) ? Number(vid.duration.toFixed(1)) : null,
    t: vid ? Number(vid.currentTime.toFixed(2)) : null,
    paused: vid?.paused,
    src: (vid?.currentSrc || "").split("/").pop(),
  };
});
console.log("VIDEO", v);
// Original was ~139.9s from 0; from 1:41 leftover ~38.9s. Old wrong trim was ~138s from 1.41s.
const mark = await p.evaluate(() => {
  const s = document.querySelector(".film-mark strong");
  const e = document.querySelector(".film-mark em");
  const sw = s.getBoundingClientRect().width;
  const ew = e.getBoundingClientRect().width;
  return {
    strongW: Math.round(sw),
    emW: Math.round(ew),
    diff: Math.abs(sw - ew),
    strongFs: getComputedStyle(s).fontSize,
    emFs: getComputedStyle(e).fontSize,
    bodyFs: getComputedStyle(document.body).fontSize,
    h1Fs: getComputedStyle(document.querySelector("#club h1")).fontSize,
  };
});
console.log("MARK_TYPE", mark);
await p.screenshot({ path: path.join(OUT, "w13-hero.png") });
await b.close();

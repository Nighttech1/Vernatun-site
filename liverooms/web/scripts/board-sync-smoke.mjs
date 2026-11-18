/**
 * C-241 dual-peer board sync smoke.
 * Run: cd liverooms/web && node scripts/board-sync-smoke.mjs
 *
 * Requires: Vite :5173, lounge_api :8765, LiveKit :7880.
 * Uses a real catalog room (default lozha-erevan).
 */
import { chromium } from 'playwright';

const BASE = process.env.CAMPUS_URL || 'http://127.0.0.1:5173';
const ROOM = process.env.SYNC_ROOM || 'lozha-erevan';

async function consentAndName(page, name) {
  page.on('console', (m) => {
    const t = m.text();
    if (/board-sync|publish failed|PC manager/i.test(t)) {
      console.log(`[${name}]`, t.slice(0, 220));
    }
  });
  await page.goto(`${BASE}/room?room=${ROOM}`, {
    waitUntil: 'domcontentloaded',
  });

  const legal = page.locator('.legal-gate-card');
  if (await legal.isVisible({ timeout: 6000 }).catch(() => false)) {
    await page.locator('.legal-gate-check input').check();
    await page.locator('.legal-gate-cta').click();
    // Wait for NameGate (consent POST finished)
    await page.waitForSelector('.name-gate-input, .name-gate-card', {
      timeout: 15000,
    });
  }

  await page.waitForTimeout(300);
  const nameInput = page
    .locator(
      'input.name-gate-input, .name-gate-card input, input[maxlength="40"]',
    )
    .first();
  if (await nameInput.isVisible({ timeout: 8000 }).catch(() => false)) {
    await nameInput.fill(name);
    await page.getByRole('button', { name: /войти|продолжить/i }).click();
  }

  // Must reach LIVE session — not the offline placeholder
  await page.waitForSelector('.room-session .board-tldraw-stage', {
    timeout: 45000,
  });

  // Wait for LiveKit room + editor hooks
  for (let i = 0; i < 80; i++) {
    const ok = await page.evaluate(() => {
      const room = window.__vernatunLivekitRoom;
      const ed = window.__vernatunEditor;
      return Boolean(
        ed && room && room.state === 'connected' && typeof window.__vernatunForceBoardSync === 'function',
      );
    });
    if (ok) return;
    await page.waitForTimeout(250);
  }
  throw new Error(`${name}: LiveKit/editor hooks not ready`);
}

async function shapeCount(page) {
  return page.evaluate(() => {
    const ed = window.__vernatunEditor;
    if (!ed) return -1;
    try {
      return [...ed.getCurrentPageShapeIds()].length;
    } catch {
      return -1;
    }
  });
}

async function drawGeo(page) {
  return page.evaluate(() => {
    const ed = window.__vernatunEditor;
    if (!ed) return false;
    try {
      ed.createShape({
        type: 'geo',
        x: 120 + Math.random() * 80,
        y: 140 + Math.random() * 80,
        props: { w: 120, h: 80, geo: 'rectangle' },
      });
      if (typeof window.__vernatunForceBoardSync === 'function') {
        window.__vernatunForceBoardSync();
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  });
}

async function peerStats(page) {
  return page.evaluate(() => {
    const room = window.__vernatunLivekitRoom;
    return {
      state: room?.state,
      remotes: room?.remoteParticipants?.size ?? -1,
      identity: room?.localParticipant?.identity,
      shapes: window.__vernatunEditor
        ? [...window.__vernatunEditor.getCurrentPageShapeIds()].length
        : -1,
    };
  });
}

async function main() {
  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    });
    const pageA = await (
      await browser.newContext({ permissions: ['microphone', 'camera'] })
    ).newPage();
    const pageB = await (
      await browser.newContext({ permissions: ['microphone', 'camera'] })
    ).newPage();

    console.log('ROOM', ROOM);
    await consentAndName(pageA, 'SyncAlice');
    console.log('A', await peerStats(pageA));
    await consentAndName(pageB, 'SyncBob');
    console.log('B', await peerStats(pageB));

    // Wait until each sees the other
    for (let i = 0; i < 40; i++) {
      const a = await peerStats(pageA);
      const b = await peerStats(pageB);
      if (a.remotes >= 1 && b.remotes >= 1) break;
      await pageA.waitForTimeout(250);
    }
    console.log('A after peer', await peerStats(pageA));
    console.log('B after peer', await peerStats(pageB));

    const beforeB = await shapeCount(pageB);
    const drew = await drawGeo(pageA);
    if (!drew) {
      console.error('FAIL: create shape on A');
      process.exit(3);
    }
    await pageA.waitForTimeout(200);
    await pageA.evaluate(() => {
      if (typeof window.__vernatunForceBoardSync === 'function') {
        window.__vernatunForceBoardSync();
      }
    });

    let synced = false;
    let afterB = beforeB;
    for (let i = 0; i < 50; i++) {
      await pageB.waitForTimeout(400);
      afterB = await shapeCount(pageB);
      if (afterB > beforeB && afterB > 0) {
        synced = true;
        console.log('PASS: board sync', {
          beforeB,
          afterB,
          afterA: await shapeCount(pageA),
        });
        break;
      }
    }
    if (!synced) {
      const afterA = await shapeCount(pageA);
      console.error('FAIL: B missing A shape', {
        afterA,
        afterB,
        beforeB,
        a: await peerStats(pageA),
        b: await peerStats(pageB),
      });
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error('FAIL:', e);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();

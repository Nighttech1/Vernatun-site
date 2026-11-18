/**
 * Probe LiveKit data channel between two room peers.
 */
import { chromium } from 'playwright';

const BASE = process.env.CAMPUS_URL || 'http://127.0.0.1:5173';
const ROOM = process.env.SYNC_ROOM || `dc-probe-${Date.now().toString(36)}`;

async function enter(page, name) {
  page.on('console', (m) => {
    const t = m.text();
    if (/board-sync|publish|DataReceived|LiveKit|PC manager|disconnect/i.test(t)) {
      console.log(`[${name}]`, t.slice(0, 240));
    }
  });
  await page.goto(`${BASE}/room?room=${ROOM}`, { waitUntil: 'domcontentloaded' });
  if (await page.locator('.legal-gate-card').isVisible({ timeout: 4000 }).catch(() => false)) {
    await page.locator('.legal-gate-check input').check();
    await page.locator('.legal-gate-cta').click();
  }
  await page.waitForTimeout(400);
  await page.locator('.name-gate-input').first().fill(name);
  await page.getByRole('button', { name: /войти|продолжить/i }).click();
  await page.waitForSelector('.board-tldraw-stage', { timeout: 45000 });
  // wait until room exposed + Connected
  for (let i = 0; i < 60; i++) {
    const st = await page.evaluate(() => {
      const room = window.__vernatunLivekitRoom;
      if (!room) return { has: false };
      return {
        has: true,
        state: room.state,
        identity: room.localParticipant?.identity,
        remotes: room.remoteParticipants?.size ?? 0,
      };
    });
    if (st.has && st.state === 'connected') return st;
    await page.waitForTimeout(250);
  }
  return page.evaluate(() => {
    const room = window.__vernatunLivekitRoom;
    return {
      has: Boolean(room),
      state: room?.state,
      remotes: room?.remoteParticipants?.size,
    };
  });
}

async function main() {
  console.log('ROOM', ROOM);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--disable-web-security',
    ],
  });
  const ctxA = await browser.newContext({
    permissions: ['microphone', 'camera'],
  });
  const ctxB = await browser.newContext({
    permissions: ['microphone', 'camera'],
  });
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  const stA = await enter(a, 'ProbeA');
  console.log('A connected', stA);
  const stB = await enter(b, 'ProbeB');
  console.log('B connected', stB);

  await a.waitForTimeout(1500);
  console.log(
    'A remotes after wait',
    await a.evaluate(() => window.__vernatunLivekitRoom?.remoteParticipants?.size),
  );
  console.log(
    'B remotes after wait',
    await b.evaluate(() => window.__vernatunLivekitRoom?.remoteParticipants?.size),
  );

  // Install listener on B BEFORE publish
  await b.evaluate(() => {
    window.__dcGot = [];
    const room = window.__vernatunLivekitRoom;
    if (!room) return;
    room.on('dataReceived', (payload, p, _k, topic) => {
      let text = '';
      try {
        text = new TextDecoder().decode(payload).slice(0, 120);
      } catch {
        /* ignore */
      }
      window.__dcGot.push({
        topic,
        from: p?.identity,
        text,
        state: room.state,
      });
    });
  });

  const pub = await a.evaluate(async () => {
    const room = window.__vernatunLivekitRoom;
    if (!room) return { err: 'no room' };
    const info = {
      state: room.state,
      remotes: [...room.remoteParticipants.keys()],
      identity: room.localParticipant.identity,
    };
    const payload = new TextEncoder().encode(
      JSON.stringify({ type: 'probe.ping', t: Date.now() }),
    );
    try {
      await room.localParticipant.publishData(payload, {
        reliable: true,
        topic: 'vernatun',
      });
      return { ok: true, info };
    } catch (e) {
      return { ok: false, err: String(e), info };
    }
  });
  console.log('publish', JSON.stringify(pub, null, 2));

  await b.waitForTimeout(2000);
  console.log('B got', await b.evaluate(() => window.__dcGot));
  console.log(
    'A state final',
    await a.evaluate(() => ({
      state: window.__vernatunLivekitRoom?.state,
      remotes: window.__vernatunLivekitRoom?.remoteParticipants?.size,
    })),
  );

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Owner cabinet: Жалобы / Модерация / Баны / Настройки (sentinel samples).
 * Password never baked into the bundle.
 * C-208: custom selects, selection batch delete, human report detail, mock QA rows.
 * C-229: owner-editable Campus Sentinel keywords/patterns.
 */
const params = new URLSearchParams(window.location.search);
const API_BASE = (params.get('api') || '').replace(/\/$/, '') || '';
const KEY = 'vernatun-owner-password';

const el = {
  login: document.getElementById('login'),
  inbox: document.getElementById('inbox'),
  password: document.getElementById('password'),
  loginBtn: document.getElementById('login-btn'),
  loginError: document.getElementById('login-error'),
  list: document.getElementById('list'),
  listEmpty: document.getElementById('list-empty'),
  detail: document.getElementById('detail'),
  detailKind: document.getElementById('detail-kind'),
  detailTitle: document.getElementById('detail-title'),
  detailMeta: document.getElementById('detail-meta'),
  detailBody: document.getElementById('detail-body'),
  detailActions: document.getElementById('detail-actions'),
  detailRaw: document.getElementById('detail-raw'),
  detailParties: document.getElementById('detail-parties'),
  detailEvidence: document.getElementById('detail-evidence'),
  detailEvidenceImg: document.getElementById('detail-evidence-img'),
  detailEvidenceMock: document.getElementById('detail-evidence-mock'),
  refresh: document.getElementById('refresh-btn'),
  logout: document.getElementById('logout-btn'),
  panelTitle: document.getElementById('panel-title'),
  tabReports: document.getElementById('tab-reports'),
  tabMod: document.getElementById('tab-moderation'),
  tabBans: document.getElementById('tab-bans'),
  tabSettings: document.getElementById('tab-settings'),
  robotsHelpBtn: document.getElementById('robots-help-btn'),
  robotsHelpModal: document.getElementById('robots-help-modal'),
  robotsHelpClose: document.getElementById('robots-help-close'),
  robotsHelpOk: document.getElementById('robots-help-ok'),
  statusMsg: document.getElementById('status-msg'),
  search: document.getElementById('search-input'),
  sort: document.getElementById('sort-select'),
  filter: document.getElementById('filter-select'),
  selectAll: document.getElementById('select-all'),
  purgeBtn: document.getElementById('purge-btn'),
  purgeMenuWrap: document.getElementById('purge-menu-wrap'),
  purgeMenu: document.getElementById('purge-menu'),
  purgeByAgeBtn: document.getElementById('purge-by-age-btn'),
  purgeMenuDays: document.getElementById('purge-menu-days'),
  purgeDaysInline: document.getElementById('purge-days-inline'),
  purgeDaysGo: document.getElementById('purge-days-go'),
  purgeAllBtn: document.getElementById('purge-all-btn'),
  deleteSelectedBtn: document.getElementById('delete-selected-btn'),
  listChrome: document.getElementById('list-chrome'),
  listTools: document.getElementById('list-tools'),
  purgeBar: document.getElementById('purge-bar'),
  robotFiltersSlot: document.getElementById('robot-filters-slot'),
  robotFilters: document.getElementById('robot-filters'),
  inboxLayout: document.getElementById('inbox-layout'),
  panelBody: document.getElementById('panel-body'),
  settingsPanel: document.getElementById('settings-panel'),
  settingsForms: document.getElementById('settings-forms'),
  settingsSaveBtn: document.getElementById('settings-save-btn'),
  settingsEditorModal: document.getElementById('settings-editor-modal'),
  settingsEditorTitle: document.getElementById('settings-editor-title'),
  settingsEditorHint: document.getElementById('settings-editor-hint'),
  settingsEditorTextarea: document.getElementById('settings-editor-textarea'),
  settingsEditorClose: document.getElementById('settings-editor-close'),
  settingsEditorCancel: document.getElementById('settings-editor-cancel'),
  settingsEditorSave: document.getElementById('settings-editor-save'),
  evidenceLightbox: document.getElementById('evidence-lightbox'),
  evidenceLightboxImg: document.getElementById('evidence-lightbox-img'),
  evidenceLightboxClose: document.getElementById('evidence-lightbox-close'),
};

/** @type {'reports' | 'moderation' | 'bans' | 'settings'} */
let activeTab = 'reports';
/** @type {any[]} */
let reportItems = [];
/** @type {any[]} */
let modItems = [];
/** @type {any[]} */
let banItems = [];
let selectedId = '';
let viewRows = [];
/** @type {Set<string>} */
const selectedIds = new Set();
/** Stable order matching lounge_api allowed keys */
const SENTINEL_IDS = ['agenda', 'tone', 'bounds', 'spam', 'canvas18'];

/** C-246: Russian titles for Settings cards (ids stay English as secondary) */
const SENTINEL_LABEL_RU = {
  agenda: 'Политика / агитация',
  tone: 'Тон / оскорбления',
  bounds: 'Ненависть / этничность',
  spam: 'Спам',
  canvas18: '18+ / непристойности',
};

/** @type {Record<string, { label: string, keywords: string[], patterns: string[] }>} */
let sentinelPatterns = {};
/** C-239: robot filter on moderation tab only (`all` | politic|censor|nsfw|hate|shield) */
let modRobotFilter = 'all';
const ROBOT_FILTER_KEYS = ['politic', 'censor', 'nsfw', 'hate', 'shield'];

function getPassword() {
  return sessionStorage.getItem(KEY) || '';
}
function setPassword(value) {
  if (value) sessionStorage.setItem(KEY, value);
  else sessionStorage.removeItem(KEY);
}
function showLogin(msg) {
  el.login.hidden = false;
  el.inbox.hidden = true;
  el.loginError.hidden = !msg;
  el.loginError.textContent = msg || '';
}
function showInbox() {
  el.login.hidden = true;
  el.inbox.hidden = false;
}
function setStatus(msg, isError) {
  if (!el.statusMsg) return;
  el.statusMsg.hidden = !msg;
  el.statusMsg.textContent = msg || '';
  el.statusMsg.classList.toggle('is-error', Boolean(isError));
}
function formatTs(ts) {
  if (!ts) return '';
  try {
    return new Date(Number(ts) * 1000).toLocaleString('ru-RU');
  } catch {
    return String(ts);
  }
}
function startOfTodaySec() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

async function ownerFetch(path, options = {}) {
  const pwd = getPassword();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'X-Owner-Password': pwd,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    setPassword('');
    throw new Error('Неверный пароль');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.hint || `HTTP ${res.status}`);
  }
  return res.json();
}

function pickIp(item) {
  return (
    item.ip ||
    item.author_ip ||
    item.target_last_ip ||
    item.reporter_ip ||
    item.target_ip ||
    ''
  );
}
function pickName(item) {
  return (
    item.author_nickname ||
    item.target_identity ||
    item.target ||
    item.identity ||
    item.reporter_identity ||
    item.client_id ||
    item.target_client_id ||
    item.author_client_id ||
    item.title ||
    ''
  );
}

/** C-246: Russian labels for filter chips & list badges (ids stay English) */
const ROBOT_LABEL_RU = {
  politic: 'Политика / агитация',
  censor: 'Тон / оскорбления',
  nsfw: '18+ / непристойности',
  hate: 'Ненависть / этничность',
  shield: 'Спам',
};

/** Extra English → Russian for rare codes that may appear in badges/text */
const EXTRA_LABEL_RU = {
  dating: 'Знакомства / флирт',
  flirt: 'Знакомства / флирт',
  religion: 'Религия',
  pedo: 'Запрет: несовершеннолетние',
  minors: 'Запрет: несовершеннолетние',
  scam: 'Мошенничество',
  hate: 'Ненависть / этничность',
  ethnicity: 'Ненависть / этничность',
  agenda: 'Политика / агитация',
  tone: 'Тон / оскорбления',
  nsfw: '18+ / непристойности',
  spam: 'Спам',
  politic: 'Политика / агитация',
  censor: 'Тон / оскорбления',
  shield: 'Спам',
  bounds: 'Ненависть / этничность',
  canvas18: '18+ / непристойности',
};

function sentinelDisplayLabel(idOrKey) {
  const k = String(idOrKey || '').toLowerCase();
  if (SENTINEL_LABEL_RU[k]) return SENTINEL_LABEL_RU[k];
  if (ROBOT_LABEL_RU[k]) return ROBOT_LABEL_RU[k];
  if (EXTRA_LABEL_RU[k]) return EXTRA_LABEL_RU[k];
  return '';
}

/** C-217 / C-246: badge label for Campus Sentinels — never show English codes */
function sentinelBadge(item) {
  const key = sentinelRobotKey(item);
  if (key && ROBOT_LABEL_RU[key]) return ROBOT_LABEL_RU[key];
  const sid = String(item.sentinel_id || '').toLowerCase();
  const fromId = sentinelDisplayLabel(sid);
  if (fromId) return fromId;
  const raw = String(item.sentinel_badge || item.sentinel_role || '');
  const low = raw.toLowerCase();
  for (const [en, ru] of Object.entries(EXTRA_LABEL_RU)) {
    if (low.includes(en)) return ru;
  }
  if (
    low.includes('politic') ||
    low.includes('политик') ||
    low.includes('повестк') ||
    low.includes('агитац')
  )
    return ROBOT_LABEL_RU.politic;
  if (low.includes('censor') || low.includes('тон') || low.includes('оскорб'))
    return ROBOT_LABEL_RU.censor;
  if (
    low.includes('nsfw') ||
    low.includes('18+') ||
    low.includes('неприст') ||
    low.includes('холст')
  )
    return ROBOT_LABEL_RU.nsfw;
  if (
    low.includes('hate') ||
    low.includes('границ') ||
    low.includes('bounds') ||
    low.includes('ненавист') ||
    low.includes('этнич')
  )
    return ROBOT_LABEL_RU.hate;
  if (low.includes('shield') || low.includes('спам') || low.includes('spam'))
    return ROBOT_LABEL_RU.shield;
  if (low.includes('dating') || low.includes('flirt') || low.includes('знаком'))
    return EXTRA_LABEL_RU.dating;
  if (low.includes('religion') || low.includes('религ')) return EXTRA_LABEL_RU.religion;
  if (low.includes('pedo') || low.includes('minor') || low.includes('несоверш'))
    return EXTRA_LABEL_RU.pedo;
  if (low.includes('scam') || low.includes('мошен')) return EXTRA_LABEL_RU.scam;
  // Never leak English Sentinel-* codes to the UI
  if (/sentinel/i.test(raw) || /^[A-Z0-9_\-]+$/.test(raw)) return 'Робот';
  return raw || '';
}

/** C-239: map item → robot filter key (politic|censor|nsfw|hate|shield|'') */
function sentinelRobotKey(item) {
  const role = String(item.sentinel_role || '').toUpperCase();
  if (ROBOT_FILTER_KEYS.includes(role.toLowerCase())) {
    return role.toLowerCase();
  }
  const sid = String(item.sentinel_id || '').toLowerCase();
  // bounds=hate(Границы), spam=shield(Спам)
  const idMap = {
    agenda: 'politic',
    tone: 'censor',
    canvas18: 'nsfw',
    bounds: 'hate',
    spam: 'shield',
  };
  if (idMap[sid]) return idMap[sid];

  const badge = String(item.sentinel_badge || '').toLowerCase();
  if (
    badge.includes('politic') ||
    badge.includes('политик') ||
    badge.includes('повестк')
  )
    return 'politic';
  if (badge.includes('censor') || badge.includes('тон')) return 'censor';
  if (
    badge.includes('nsfw') ||
    badge.includes('18+') ||
    badge.includes('18 ') ||
    badge.includes('холст')
  )
    return 'nsfw';
  if (
    badge.includes('hate') ||
    badge.includes('границ') ||
    badge.includes('bounds')
  )
    return 'hate';
  if (
    badge.includes('shield') ||
    badge.includes('спам') ||
    badge.includes('spam')
  )
    return 'shield';
  return '';
}

function isSentinelIncident(item) {
  return (
    item.kind === 'sentinel_incident' ||
    item.event === 'SENTINEL_INCIDENT' ||
    item.action === 'SENTINEL_INCIDENT' ||
    Boolean(item.sentinel_role && (item.sentinel_id || item.action_taken))
  );
}
function rowId(item, index) {
  if (item._uid) return item._uid;
  if (item.id) return String(item.id);
  return `${activeTab}-${item.ts || 0}-${index}`;
}

/** Tiny 1×1 JPEG (valid) — used only as fallback metadata; UI shows mock placeholder. */
const TINY_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z';

function buildMockReports() {
  const now = Math.floor(Date.now() / 1000);
  const rooms = ['lounge-alpha', 'seminar-b', 'campus-hall'];
  const reporters = ['Анна К.', 'Игорь М.', 'Мария С.'];
  const targets = ['Гость_42', 'Участник_7', 'Demo_User'];
  const bodies = [
    'На доске написали оскорбление — приложила скрин.',
    'Участник мешает занятию и спамит в чат.',
    'Просьба проверить поведение в комнате (мок для QA).',
  ];
  return [0, 1, 2].map((i) => ({
    id: `mock-report-${now}-${i}`,
    _uid: `mock-report-${now}-${i}`,
    _mock: true,
    _deleteKind: 'inbox',
    kind: 'report',
    ts: now - i * 3600,
    room: rooms[i],
    reporter_identity: reporters[i],
    target_identity: targets[i],
    target_last_ip: `203.0.113.${10 + i}`,
    reporter_ip: `198.51.100.${20 + i}`,
    target_client_id: `mock-client-${i}`,
    title: `Мок-жалоба ${i + 1}`,
    body: bodies[i],
    reason_code: 'mock_qa',
    evidence_id: `mock-evidence-${i}`,
    _mock_evidence: true,
    _tiny_jpeg: TINY_JPEG_B64,
  }));
}

function ensureMockReports() {
  // C-208: always keep ≥3 client-side mocks for visual QA (user deletes them)
  const mocks = reportItems.filter((x) => x._mock);
  if (mocks.length >= 3) return;
  const need = 3 - mocks.length;
  const fresh = buildMockReports().slice(0, need);
  reportItems = [...fresh, ...reportItems];
}

function buildModerationFeed(inboxAll, modLog) {
  const robots = (inboxAll || [])
    .filter((x) => x.kind && x.kind !== 'report')
    .map((x, i) => {
      const sentinel = isSentinelIncident(x);
      const badge = sentinelBadge(x);
      return {
        ...x,
        _uid: String(x.id || x.incident_id || `robot-${i}`),
        _deleteKind: sentinel ? 'incident' : 'inbox',
        _source: sentinel
          ? 'sentinel'
          : x.kind === 'toxicity_ai'
            ? 'robot_ai'
            : 'system',
        _label: sentinel
          ? badge || 'Робот'
          : x.kind === 'toxicity_ai'
            ? 'Робот AI'
            : x.kind === 'alert'
              ? 'Система / SFU'
              : String(x.kind || 'событие'),
      };
    });
  const host = (modLog || []).map((x, i) => {
    const action = x.action || x.event || '';
    const target = x.target || x.identity || x.author_nickname || '';
    const room = x.room || x.room_id || '';
    const sentinel = isSentinelIncident(x);
    if (sentinel) {
      const badge = sentinelBadge(x) || 'Робот';
      const nick = x.author_nickname || target || '—';
      return {
        ...x,
        _uid: String(x.id || x.incident_id || `inc-${x.ts || 0}-${i}`),
        _deleteKind: 'incident',
        _source: 'sentinel',
        _label: badge,
        kind: 'sentinel_incident',
        title: `${badge} · ${nick}`,
        body:
          x.reason ||
          x.chat_snippet ||
          x.snippet ||
          x.body ||
          'Инцидент сентинела (контент снят, бан не выдан)',
      };
    }
    const uid = `mod-${x.ts || 0}-${action}-${target}-${room}`;
    return {
      ...x,
      _uid: uid,
      _deleteKind: 'mod',
      _source: 'host',
      _label: 'Ведущий',
      kind: 'host_mod',
      title: `${String(action || 'mod').toUpperCase()} · ${target || '—'}`,
      body: x.reason || (x.ok === false ? x.error : 'Mute / kick / escalate'),
    };
  });
  return [...robots, ...host].sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

function rawList() {
  if (activeTab === 'reports') return reportItems;
  if (activeTab === 'moderation') return modItems;
  return banItems;
}

function applyTools(items) {
  const q = (el.search.value || '').trim().toLowerCase();
  const sort = el.sort.value || 'date_desc';
  const filter = el.filter.value || 'all';
  const today = startOfTodaySec();

  let out = items.slice();

  // C-239: robot filter only on moderation tab
  if (activeTab === 'moderation' && modRobotFilter !== 'all') {
    out = out.filter((x) => sentinelRobotKey(x) === modRobotFilter);
  }

  if (filter === 'has_ip') out = out.filter((x) => pickIp(x));
  if (filter === 'has_client')
    out = out.filter(
      (x) => x.client_id || x.target_client_id || x.reporter_client_id,
    );
  if (filter === 'today') out = out.filter((x) => (x.ts || 0) >= today);

  if (q) {
    out = out.filter((x) => {
      const blob = [
        pickName(x),
        pickIp(x),
        x.room,
        x.title,
        x.body,
        x.reason,
        x.client_id,
        x.target_client_id,
        x.reporter_client_id,
        x._label,
        x.action,
        x.sentinel_role,
        x.sentinel_badge,
        x.author_nickname,
        x.chat_snippet,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }

  const nameKey = (x) => String(pickName(x) || '').toLowerCase();
  const ipKey = (x) => String(pickIp(x) || '');
  out.sort((a, b) => {
    if (sort === 'date_asc') return (a.ts || 0) - (b.ts || 0);
    if (sort === 'date_desc') return (b.ts || 0) - (a.ts || 0);
    if (sort === 'name_asc') return nameKey(a).localeCompare(nameKey(b), 'ru');
    if (sort === 'name_desc') return nameKey(b).localeCompare(nameKey(a), 'ru');
    if (sort === 'ip_asc') return ipKey(a).localeCompare(ipKey(b));
    return (b.ts || 0) - (a.ts || 0);
  });
  return out;
}

function clearSelection() {
  selectedIds.clear();
  syncSelectionUi();
}

function syncSelectionUi() {
  const visibleIds = viewRows.map((x, i) => rowId(x, i));
  const selectedVisible = visibleIds.filter((id) => selectedIds.has(id));
  if (el.selectAll) {
    el.selectAll.checked =
      visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
    el.selectAll.indeterminate =
      selectedVisible.length > 0 && selectedVisible.length < visibleIds.length;
  }
  if (el.deleteSelectedBtn) {
    const canBatch =
      activeTab !== 'bans' &&
      activeTab !== 'settings' &&
      selectedIds.size > 0;
    el.deleteSelectedBtn.hidden = !canBatch;
    el.deleteSelectedBtn.textContent =
      selectedIds.size > 0
        ? `Удалить выбранные (${selectedIds.size})`
        : 'Удалить выбранные';
  }
}

function setListChromeVisible(visible) {
  // C-245: settings fully hides list-chrome (display:none), no empty plaque
  if (el.listChrome) {
    el.listChrome.hidden = !visible;
    el.listChrome.classList.remove('is-inert');
    el.listChrome.setAttribute('aria-hidden', visible ? 'false' : 'true');
    el.listChrome.inert = !visible;
  }
  if (el.robotFiltersSlot) {
    el.robotFiltersSlot.hidden = !visible;
  }
  if (el.listEmpty) el.listEmpty.hidden = !visible || viewRows.length > 0;
  if (el.inboxLayout) el.inboxLayout.hidden = !visible;
  if (el.settingsPanel) el.settingsPanel.hidden = visible;
  syncRobotFiltersBar();
}

function syncRobotFiltersBar() {
  if (!el.robotFilters) return;
  const onListTab = activeTab !== 'settings';
  if (el.robotFiltersSlot) {
    el.robotFiltersSlot.hidden = !onListTab;
  }
  const show = activeTab === 'moderation';
  el.robotFilters.hidden = !show;
  if (!show) return;
  updateRobotFilterCounts();
  el.robotFilters.querySelectorAll('.robot-filter-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.robot === modRobotFilter);
  });
}

function updateRobotFilterCounts() {
  if (!el.robotFilters) return;
  const counts = { all: modItems.length };
  for (const key of ROBOT_FILTER_KEYS) counts[key] = 0;
  for (const item of modItems) {
    const key = sentinelRobotKey(item);
    if (key && counts[key] != null) counts[key] += 1;
  }
  el.robotFilters.querySelectorAll('[data-count-for]').forEach((span) => {
    const key = span.getAttribute('data-count-for');
    span.textContent = String(counts[key] ?? 0);
  });
}

function setModRobotFilter(key) {
  const next = key === 'all' || ROBOT_FILTER_KEYS.includes(key) ? key : 'all';
  if (modRobotFilter === next) return;
  modRobotFilter = next;
  selectedId = '';
  clearSelection();
  renderList();
}

function setTab(tab) {
  const leavingMod = activeTab === 'moderation' && tab !== 'moderation';
  activeTab = tab;
  el.tabReports.classList.toggle('is-active', tab === 'reports');
  el.tabMod.classList.toggle('is-active', tab === 'moderation');
  el.tabBans.classList.toggle('is-active', tab === 'bans');
  if (el.tabSettings) {
    el.tabSettings.classList.toggle('is-active', tab === 'settings');
  }
  if (el.inbox) {
    el.inbox.classList.toggle('is-settings', tab === 'settings');
  }
  el.tabReports.setAttribute('aria-selected', tab === 'reports' ? 'true' : 'false');
  el.tabMod.setAttribute('aria-selected', tab === 'moderation' ? 'true' : 'false');
  el.tabBans.setAttribute('aria-selected', tab === 'bans' ? 'true' : 'false');
  if (el.tabSettings) {
    el.tabSettings.setAttribute(
      'aria-selected',
      tab === 'settings' ? 'true' : 'false',
    );
  }
  el.panelTitle.textContent =
    tab === 'reports'
      ? 'Жалобы'
      : tab === 'moderation'
        ? 'Модерация'
        : tab === 'bans'
          ? 'Баны'
          : 'Настройки';
  if (el.robotsHelpBtn) {
    el.robotsHelpBtn.hidden = tab !== 'moderation';
  }
  // C-239: filter persists only while on moderation tab
  if (leavingMod) modRobotFilter = 'all';
  selectedId = '';
  clearSelection();
  setStatus('');
  closePurgeMenu();

  if (tab === 'settings') {
    setListChromeVisible(false);
    void loadSentinelPatterns();
    return;
  }

  setListChromeVisible(true);
  renderList();
}

function linesFromTextarea(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @type {{ sentinelId: string, field: 'keywords' | 'patterns' } | null} */
let settingsEditorTarget = null;
/** Draft samples while editing in Settings (before POST) */
/** @type {Record<string, { label: string, keywords: string[], patterns: string[] }>} */
let settingsDraft = {};

function ensureSettingsDraft() {
  for (const id of SENTINEL_IDS) {
    if (!settingsDraft[id]) {
      const src = sentinelPatterns[id] || { label: id, keywords: [], patterns: [] };
      settingsDraft[id] = {
        label: SENTINEL_LABEL_RU[id] || String(src.label || id),
        keywords: Array.isArray(src.keywords) ? [...src.keywords] : [],
        patterns: Array.isArray(src.patterns) ? [...src.patterns] : [],
      };
    }
  }
}

function syncDraftFromPatterns() {
  settingsDraft = {};
  for (const id of SENTINEL_IDS) {
    const src = sentinelPatterns[id] || { label: id, keywords: [], patterns: [] };
    settingsDraft[id] = {
      label: SENTINEL_LABEL_RU[id] || String(src.label || id),
      keywords: Array.isArray(src.keywords) ? [...src.keywords] : [],
      patterns: Array.isArray(src.patterns) ? [...src.patterns] : [],
    };
  }
}

function renderSettingsForms() {
  if (!el.settingsForms) return;
  ensureSettingsDraft();
  el.settingsForms.innerHTML = '';
  for (const id of SENTINEL_IDS) {
    const block = settingsDraft[id] || {
      label: SENTINEL_LABEL_RU[id] || id,
      keywords: [],
      patterns: [],
    };
    const card = document.createElement('article');
    card.className = 'settings-card card';
    card.dataset.sentinelId = id;

    const title = document.createElement('h2');
    title.className = 'settings-card-title';
    title.textContent = SENTINEL_LABEL_RU[id] || block.label || id;

    const idHint = document.createElement('p');
    idHint.className = 'settings-card-id';
    idHint.textContent = id;

    const btns = document.createElement('div');
    btns.className = 'settings-field-btns';

    const kwBtn = document.createElement('button');
    kwBtn.type = 'button';
    kwBtn.className = 'settings-field-btn';
    kwBtn.dataset.field = 'keywords';
    const kwCount = document.createElement('span');
    kwCount.className = 'settings-field-count';
    kwCount.textContent = String((block.keywords || []).length);
    kwBtn.append('Ключевые слова', kwCount);

    const patBtn = document.createElement('button');
    patBtn.type = 'button';
    patBtn.className = 'settings-field-btn';
    patBtn.dataset.field = 'patterns';
    const patCount = document.createElement('span');
    patCount.className = 'settings-field-count';
    patCount.textContent = String((block.patterns || []).length);
    patBtn.append('Шаблоны', patCount);

    kwBtn.addEventListener('click', () => openSettingsEditor(id, 'keywords'));
    patBtn.addEventListener('click', () => openSettingsEditor(id, 'patterns'));

    btns.append(kwBtn, patBtn);
    card.append(title, idHint, btns);
    el.settingsForms.appendChild(card);
  }
}

function openSettingsEditor(sentinelId, field) {
  ensureSettingsDraft();
  const block = settingsDraft[sentinelId];
  if (!block || !el.settingsEditorModal) return;
  settingsEditorTarget = { sentinelId, field };
  const label =
    SENTINEL_LABEL_RU[sentinelId] || block.label || sentinelId;
  const isKw = field === 'keywords';
  if (el.settingsEditorTitle) {
    el.settingsEditorTitle.textContent = isKw
      ? `Ключевые слова · ${label}`
      : `Шаблоны · ${label}`;
  }
  if (el.settingsEditorHint) {
    el.settingsEditorHint.textContent = isKw
      ? 'Одно слово или фраза на строку. «Сохранить» запишет в черновик; на сервер уйдёт по кнопке «Сохранить образцы».'
      : 'Один шаблон (regex) на строку. «Сохранить» запишет в черновик; на сервер уйдёт по кнопке «Сохранить образцы».';
  }
  if (el.settingsEditorTextarea) {
    el.settingsEditorTextarea.value = (isKw ? block.keywords : block.patterns).join(
      '\n',
    );
  }
  el.settingsEditorModal.hidden = false;
  el.settingsEditorTextarea?.focus();
}

function closeSettingsEditor() {
  settingsEditorTarget = null;
  if (el.settingsEditorModal) el.settingsEditorModal.hidden = true;
  if (el.settingsEditorTextarea) el.settingsEditorTextarea.value = '';
}

function commitSettingsEditor() {
  if (!settingsEditorTarget || !el.settingsEditorTextarea) return;
  const { sentinelId, field } = settingsEditorTarget;
  ensureSettingsDraft();
  const lines = linesFromTextarea(el.settingsEditorTextarea.value);
  if (!settingsDraft[sentinelId]) {
    settingsDraft[sentinelId] = {
      label: SENTINEL_LABEL_RU[sentinelId] || sentinelId,
      keywords: [],
      patterns: [],
    };
  }
  if (field === 'keywords') settingsDraft[sentinelId].keywords = lines;
  else settingsDraft[sentinelId].patterns = lines;
  closeSettingsEditor();
  renderSettingsForms();
}

function collectPatternsFromForms() {
  ensureSettingsDraft();
  /** @type {Record<string, { label: string, keywords: string[], patterns: string[] }>} */
  const out = {};
  for (const id of SENTINEL_IDS) {
    const prev = settingsDraft[id] || sentinelPatterns[id] || {};
    out[id] = {
      label: SENTINEL_LABEL_RU[id] || String(prev.label || id),
      keywords: Array.isArray(prev.keywords) ? [...prev.keywords] : [],
      patterns: Array.isArray(prev.patterns) ? [...prev.patterns] : [],
    };
  }
  return out;
}

async function loadSentinelPatterns() {
  try {
    setStatus('Загружаем образцы…');
    const data = await ownerFetch('/api/lounge/admin/sentinel-patterns');
    const raw = data.patterns && typeof data.patterns === 'object' ? data.patterns : {};
    sentinelPatterns = {};
    for (const id of SENTINEL_IDS) {
      const v = raw[id];
      if (v && typeof v === 'object') {
        sentinelPatterns[id] = {
          label: SENTINEL_LABEL_RU[id] || String(v.label || id),
          keywords: Array.isArray(v.keywords) ? v.keywords.map(String) : [],
          patterns: Array.isArray(v.patterns) ? v.patterns.map(String) : [],
        };
      } else {
        sentinelPatterns[id] = {
          label: SENTINEL_LABEL_RU[id] || id,
          keywords: [],
          patterns: [],
        };
      }
    }
    syncDraftFromPatterns();
    renderSettingsForms();
    setStatus('');
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

async function saveSentinelPatterns() {
  try {
    setStatus('Сохраняем…');
    const patterns = collectPatternsFromForms();
    const data = await ownerFetch('/api/lounge/admin/sentinel-patterns', {
      method: 'POST',
      body: JSON.stringify({ patterns }),
    });
    const saved =
      data.patterns && typeof data.patterns === 'object' ? data.patterns : patterns;
    sentinelPatterns = {};
    for (const id of SENTINEL_IDS) {
      const v = saved[id];
      if (v && typeof v === 'object') {
        sentinelPatterns[id] = {
          label: SENTINEL_LABEL_RU[id] || String(v.label || id),
          keywords: Array.isArray(v.keywords) ? v.keywords.map(String) : [],
          patterns: Array.isArray(v.patterns) ? v.patterns.map(String) : [],
        };
      }
    }
    syncDraftFromPatterns();
    renderSettingsForms();
    setStatus('Образцы сохранены');
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

function resetDetailChrome() {
  el.detail.hidden = true;
  if (el.detailActions) el.detailActions.innerHTML = '';
  if (el.detailParties) {
    el.detailParties.hidden = true;
    el.detailParties.textContent = '';
  }
  if (el.detailEvidence) {
    el.detailEvidence.hidden = true;
    if (el.detailEvidenceImg) {
      el.detailEvidenceImg.hidden = true;
      el.detailEvidenceImg.removeAttribute('src');
    }
    if (el.detailEvidenceMock) el.detailEvidenceMock.hidden = true;
  }
  if (el.detailRaw) {
    el.detailRaw.hidden = true;
    el.detailRaw.classList.remove('is-visible');
    el.detailRaw.textContent = '';
  }
  if (el.detailBody) el.detailBody.innerHTML = '';
  if (el.detailMeta) el.detailMeta.textContent = '';
  if (el.detailTitle) el.detailTitle.textContent = '';
  if (el.detailKind) el.detailKind.textContent = '';
}

function renderList() {
  el.list.innerHTML = '';
  viewRows = applyTools(rawList());
  el.listEmpty.hidden = viewRows.length > 0;
  el.listEmpty.textContent =
    activeTab === 'reports'
      ? 'Жалоб пока нет.'
      : activeTab === 'moderation'
        ? 'Сигналов роботов и действий ведущих пока нет.'
        : 'Активных банов нет.';
  resetDetailChrome();
  syncRobotFiltersBar();

  // Drop selection ids that are no longer visible in this tab's data
  const allIds = new Set(viewRows.map((x, i) => rowId(x, i)));
  for (const id of [...selectedIds]) {
    if (!allIds.has(id)) selectedIds.delete(id);
  }

  viewRows.forEach((item, index) => {
    const id = rowId(item, index);
    const li = document.createElement('li');
    li.className = 'list-item';

    const checkLabel = document.createElement('label');
    checkLabel.className = 'row-check list-item-check';
    checkLabel.title = 'Выбрать';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = selectedIds.has(id);
    check.addEventListener('click', (ev) => ev.stopPropagation());
    check.addEventListener('change', () => {
      if (check.checked) selectedIds.add(id);
      else selectedIds.delete(id);
      syncSelectionUi();
    });
    const box = document.createElement('span');
    box.className = 'row-check-box';
    box.setAttribute('aria-hidden', 'true');
    checkLabel.append(check, box);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'list-card';
    if (id === selectedId) btn.classList.add('is-active');

    const kind = document.createElement('span');
    if (activeTab === 'reports') {
      kind.className = 'list-kind' + (item._mock ? ' is-mock' : '');
      kind.textContent = item._mock ? 'Мок · жалоба' : 'Жалоба';
    } else if (activeTab === 'bans') {
      kind.className = 'list-kind is-ban';
      kind.textContent = 'БАН';
    } else {
      kind.className =
        'list-kind' +
        (item._source === 'sentinel'
          ? ' is-sentinel'
          : item._source === 'robot_ai'
            ? ' is-robot'
            : item._source === 'host'
              ? ' is-mod'
              : ' is-alert');
      kind.textContent = item._label || 'Модерация';
    }

    const title = document.createElement('p');
    title.className = 'list-title';
    if (activeTab === 'bans') {
      title.textContent =
        [
          item.client_id ? `id ${String(item.client_id).slice(0, 14)}…` : '',
          item.ip ? `IP ${item.ip}` : '',
        ]
          .filter(Boolean)
          .join(' · ') ||
        item.reason ||
        'Бан';
    } else if (activeTab === 'reports') {
      title.textContent =
        `${item.reporter_identity || 'кто-то'} → ${item.target_identity || 'комната'}`.slice(
          0,
          80,
        );
    } else {
      title.textContent =
        item.title ||
        pickName(item) ||
        item.body?.slice(0, 70) ||
        id;
    }

    const time = document.createElement('p');
    time.className = 'list-time';
    const ip = pickIp(item);
    time.textContent = [formatTs(item.ts), ip ? `IP ${ip}` : '']
      .filter(Boolean)
      .join(' · ');

    btn.append(kind, title, time);
    btn.addEventListener('click', () => selectItem(id));

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'list-delete';
    del.title = 'Удалить запись';
    del.setAttribute('aria-label', 'Удалить');
    del.textContent = '×';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      void deleteOne(item, id);
    });

    // Checkbox overlays inside card (sibling, not nested in <button>)
    li.append(btn, checkLabel, del);
    el.list.append(li);
  });

  syncSelectionUi();

  if (selectedId && viewRows.some((x, i) => rowId(x, i) === selectedId)) {
    selectItem(selectedId);
  } else if (viewRows[0]) {
    selectItem(rowId(viewRows[0], 0));
  }
}

function selectItem(id) {
  selectedId = id;
  const index = viewRows.findIndex((x, i) => rowId(x, i) === id);
  const item = index >= 0 ? viewRows[index] : null;

  [...el.list.querySelectorAll('.list-card')].forEach((btn, i) => {
    btn.classList.toggle('is-active', rowId(viewRows[i], i) === id);
  });

  if (!item) {
    resetDetailChrome();
    return;
  }
  el.detail.hidden = false;
  if (el.detailActions) el.detailActions.innerHTML = '';
  if (el.detailParties) {
    el.detailParties.hidden = true;
    el.detailParties.textContent = '';
  }
  if (el.detailEvidence) {
    el.detailEvidence.hidden = true;
    if (el.detailEvidenceImg) {
      el.detailEvidenceImg.hidden = true;
      el.detailEvidenceImg.removeAttribute('src');
    }
    if (el.detailEvidenceMock) el.detailEvidenceMock.hidden = true;
  }
  // C-208: never show raw JSON for reports / moderation
  if (el.detailRaw) {
    el.detailRaw.hidden = true;
    el.detailRaw.classList.remove('is-visible');
    el.detailRaw.textContent = '';
  }

  if (activeTab === 'bans') {
    el.detailKind.textContent = 'Активный бан';
    el.detailTitle.textContent = item.reason || 'Блокировка доступа';
    el.detailMeta.textContent = [
      formatTs(item.ts),
      item.client_id ? `client: ${item.client_id}` : '',
      item.ip ? `IP: ${item.ip}` : '',
      item.until ? `до: ${formatTs(item.until)}` : 'пока не снимете',
      item.room ? `комната: ${item.room}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    el.detailBody.innerHTML = '';
    el.detailBody.textContent =
      'Этот человек (по номеру устройства и/или IP) не сможет войти в комнаты Кампуса.';
    addActionButton('Снять бан', 'btn-ghost', () => liftBan(item));
  } else if (activeTab === 'moderation') {
    el.detailKind.textContent = item._label || 'Модерация';
    el.detailTitle.textContent = item.title || pickName(item) || 'Событие';
    const roomLabel = item.room || item.room_id || '';
    const clientLabel =
      item.target_client_id || item.author_client_id || item.client_id || '';
    el.detailMeta.textContent = [
      formatTs(item.ts),
      roomLabel ? `комната: ${roomLabel}` : '',
      pickName(item) ? `кто: ${pickName(item)}` : '',
      pickIp(item) ? `IP: ${pickIp(item)}` : '',
      clientLabel ? `client: ${clientLabel}` : '',
      item.action_taken ? `действие: ${item.action_taken}` : '',
      item.requester ? `ведущий: ${item.requester}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    el.detailBody.innerHTML = '';
    el.detailBody.textContent =
      item.body ||
      item.reason ||
      item.chat_snippet ||
      (item._source === 'sentinel'
        ? 'Сентинел зафиксировал улику и убрал контент. Бан не выдан автоматически.'
        : item._source === 'robot_ai'
          ? 'Автоматический сигнал от робота-модератора.'
          : 'Событие модерации.');
    if (item._source === 'sentinel' && item.evidence_id) {
      void showEvidence(item);
    }
    if (item.target_client_id || item.author_client_id || pickIp(item)) {
      addActionButton('Заблокировать', 'btn-danger', () =>
        banFromItem(item, 'owner_ban_from_moderation'),
      );
    }
  } else {
    // C-208 human-only report fields
    el.detailKind.textContent = item._mock
      ? 'Мок-жалоба (для проверки экрана)'
      : 'Жалоба участника';
    el.detailTitle.textContent = item.room
      ? `Комната: ${item.room}`
      : item.title || 'Жалоба';
    el.detailMeta.textContent = '';
    if (el.detailParties) {
      el.detailParties.hidden = false;
      const targetIp = item.target_last_ip || pickIp(item) || '—';
      el.detailParties.innerHTML = [
        `<p class="party-row"><strong>Время подачи:</strong> ${formatTs(item.ts) || '—'}</p>`,
        `<p class="party-row"><strong>Название комнаты:</strong> ${item.room || '—'}</p>`,
        `<p class="party-row"><strong>Кто → на кого:</strong> ${item.reporter_identity || '—'} → ${item.target_identity || 'комната / без цели'}</p>`,
        `<p class="party-row"><strong>IP того, на кого жалуются:</strong> ${targetIp}</p>`,
      ].join('');
    }
    el.detailBody.innerHTML = `<p class="detail-body-label">Текст жалобы</p>`;
    const bodyText = document.createElement('div');
    bodyText.textContent = item.body || '(без текста)';
    el.detailBody.appendChild(bodyText);
    void showEvidence(item);
    if (!item._mock && (item.target_client_id || item.target_last_ip)) {
      addActionButton('Заблокировать', 'btn-danger', () =>
        banFromItem(item, 'owner_ban_from_report'),
      );
    }
  }
}

function showMockEvidencePlaceholder() {
  if (!el.detailEvidence) return;
  el.detailEvidence.hidden = false;
  if (el.detailEvidenceImg) {
    el.detailEvidenceImg.hidden = true;
    el.detailEvidenceImg.removeAttribute('src');
  }
  if (el.detailEvidenceMock) el.detailEvidenceMock.hidden = false;
}

async function showEvidence(item) {
  if (!el.detailEvidence) return;
  if (item._mock || item._mock_evidence) {
    showMockEvidencePlaceholder();
    return;
  }
  const evidenceId = item.evidence_id;
  if (!evidenceId) {
    showMockEvidencePlaceholder();
    return;
  }
  try {
    const data = await ownerFetch(
      `/api/lounge/admin/evidence/${encodeURIComponent(evidenceId)}`,
    );
    const jpeg = data.item?.canvas_jpeg_b64 || '';
    const png =
      data.item?.board_png_b64 ||
      data.item?.canvas_png_b64 ||
      '';
    if (!jpeg && !png) {
      showMockEvidencePlaceholder();
      return;
    }
    el.detailEvidence.hidden = false;
    if (el.detailEvidenceMock) el.detailEvidenceMock.hidden = true;
    if (el.detailEvidenceImg) {
      el.detailEvidenceImg.hidden = false;
      el.detailEvidenceImg.src = jpeg
        ? `data:image/jpeg;base64,${jpeg}`
        : `data:image/png;base64,${png}`;
    }
  } catch {
    showMockEvidencePlaceholder();
  }
}

async function deleteOne(item, listId) {
  if (!window.confirm('Удалить эту запись без возможности отмены в интерфейсе?')) {
    return;
  }
  try {
    setStatus('Удаляем…');
    if (item._mock) {
      reportItems = reportItems.filter((x) => rowId(x, 0) !== listId && x.id !== item.id);
      selectedIds.delete(listId);
      selectedId = '';
      setStatus('Мок удалён');
      renderList();
      return;
    }
    if (activeTab === 'reports' || item._deleteKind === 'inbox') {
      const realId = item.id || (String(listId).startsWith('robot-') ? '' : listId);
      if (!realId) {
        setStatus('Нет id записи для удаления', true);
        return;
      }
      await ownerFetch('/api/lounge/admin/inbox/delete', {
        method: 'POST',
        body: JSON.stringify({ id: realId }),
      });
    } else if (activeTab === 'moderation' && item._deleteKind === 'incident') {
      const realId = item.id || item.incident_id || listId;
      await ownerFetch('/api/lounge/admin/incidents/delete', {
        method: 'POST',
        body: JSON.stringify({ id: realId }),
      });
    } else if (activeTab === 'moderation' && item._deleteKind === 'mod') {
      await ownerFetch('/api/lounge/admin/moderation/delete', {
        method: 'POST',
        body: JSON.stringify({ id: item._uid || listId }),
      });
    } else if (activeTab === 'bans') {
      setStatus('Баны снимайте кнопкой «Снять бан», не удалением лога', true);
      return;
    } else {
      setStatus('Неизвестный тип записи', true);
      return;
    }
    selectedIds.delete(listId);
    selectedId = '';
    setStatus('Удалено');
    await load();
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

async function deleteSelected() {
  if (activeTab === 'bans') {
    setStatus('Баны снимайте по одному кнопкой «Снять бан»', true);
    return;
  }
  const ids = [...selectedIds];
  if (!ids.length) return;
  if (
    !window.confirm(
      `Удалить выбранные записи (${ids.length})? Отменить в интерфейсе будет нельзя.`,
    )
  ) {
    return;
  }
  try {
    setStatus('Удаляем выбранные…');
    const inboxIds = [];
    const modIds = [];
    const incidentIds = [];
    const mockIds = [];

    for (const id of ids) {
      const idx = viewRows.findIndex((x, i) => rowId(x, i) === id);
      const item = idx >= 0 ? viewRows[idx] : null;
      if (!item) continue;
      if (item._mock) {
        mockIds.push(item.id || id);
        continue;
      }
      if (activeTab === 'reports' || item._deleteKind === 'inbox') {
        const realId = item.id || id;
        if (realId && !String(realId).startsWith('robot-')) inboxIds.push(realId);
      } else if (item._deleteKind === 'incident') {
        incidentIds.push(item.id || item.incident_id || id);
      } else if (item._deleteKind === 'mod') {
        modIds.push(item._uid || id);
      }
    }

    if (mockIds.length) {
      reportItems = reportItems.filter((x) => !mockIds.includes(x.id) && !mockIds.includes(x._uid));
    }
    if (inboxIds.length) {
      await ownerFetch('/api/lounge/admin/inbox/delete', {
        method: 'POST',
        body: JSON.stringify({ ids: inboxIds }),
      });
    }
    if (modIds.length) {
      await ownerFetch('/api/lounge/admin/moderation/delete', {
        method: 'POST',
        body: JSON.stringify({ ids: modIds }),
      });
    }
    if (incidentIds.length) {
      await ownerFetch('/api/lounge/admin/incidents/delete', {
        method: 'POST',
        body: JSON.stringify({ ids: incidentIds }),
      });
    }

    clearSelection();
    selectedId = '';
    setStatus(`Удалено: ${ids.length}`);
    if (inboxIds.length || modIds.length || incidentIds.length) await load();
    else renderList();
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

function openPurgeMenu() {
  if (!el.purgeMenuWrap) return;
  el.purgeMenuWrap.classList.add('is-open');
  if (el.purgeBtn) el.purgeBtn.setAttribute('aria-expanded', 'true');
  if (el.purgeMenu) el.purgeMenu.hidden = false;
}

function closePurgeMenu() {
  if (!el.purgeMenuWrap) return;
  el.purgeMenuWrap.classList.remove('is-open');
  if (el.purgeBtn) el.purgeBtn.setAttribute('aria-expanded', 'false');
  if (el.purgeMenu) el.purgeMenu.hidden = true;
  if (el.purgeMenuDays) el.purgeMenuDays.hidden = true;
}

function openEvidenceLightbox(src) {
  if (!el.evidenceLightbox || !el.evidenceLightboxImg || !src) return;
  el.evidenceLightboxImg.src = src;
  el.evidenceLightbox.hidden = false;
}

function closeEvidenceLightbox() {
  if (!el.evidenceLightbox) return;
  el.evidenceLightbox.hidden = true;
  if (el.evidenceLightboxImg) {
    el.evidenceLightboxImg.removeAttribute('src');
  }
}

async function purgeByAge(days) {
  const label =
    activeTab === 'reports'
      ? 'жалоб'
      : activeTab === 'moderation'
        ? 'логов модерации'
        : 'банов';
  if (activeTab === 'bans') {
    setStatus('Массовое удаление банов не делается — снимайте по одному', true);
    return;
  }
  if (days == null || Number.isNaN(days) || days < 0) {
    setStatus('Укажите число дней (например 30)', true);
    return;
  }
  if (
    !window.confirm(
      `Удалить ${label} старше ${days} дн.? Будет сделана резервная копия.`,
    )
  ) {
    return;
  }
  try {
    setStatus('Удаляем по сроку…');
    if (activeTab === 'reports') {
      await ownerFetch('/api/lounge/admin/inbox/purge', {
        method: 'POST',
        body: JSON.stringify({ older_than_days: days, kind: 'report' }),
      });
    } else {
      await ownerFetch('/api/lounge/admin/moderation/purge', {
        method: 'POST',
        body: JSON.stringify({
          older_than_days: days,
          include_inbox_robots: true,
        }),
      });
    }
    clearSelection();
    selectedId = '';
    closePurgeMenu();
    setStatus('Готово');
    await load();
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

async function purgeAllSection() {
  const label =
    activeTab === 'reports'
      ? 'жалоб'
      : activeTab === 'moderation'
        ? 'логов модерации'
        : 'банов';
  if (activeTab === 'bans') {
    setStatus('Массовое удаление банов не делается — снимайте по одному', true);
    return;
  }
  if (
    !window.confirm(
      `Очистить ВСЕ ${label} в этом разделе? Будет сделана резервная копия на сервере.`,
    )
  ) {
    return;
  }
  try {
    setStatus('Очищаем раздел…');
    if (activeTab === 'reports') {
      reportItems = reportItems.filter((x) => !x._mock);
      await ownerFetch('/api/lounge/admin/inbox/purge', {
        method: 'POST',
        body: JSON.stringify({ all: true, kind: 'report' }),
      });
    } else {
      await ownerFetch('/api/lounge/admin/moderation/purge', {
        method: 'POST',
        body: JSON.stringify({ all: true, include_inbox_robots: true }),
      });
    }
    clearSelection();
    selectedId = '';
    setStatus('Готово');
    await load();
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

function addActionButton(label, className, onClick) {
  if (!el.detailActions) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener('click', () => {
    void onClick();
  });
  el.detailActions.appendChild(btn);
}

async function banFromItem(item, defaultReason) {
  const cid = String(
    item.target_client_id || item.author_client_id || item.client_id || '',
  ).trim();
  const ip = String(pickIp(item) || '').trim();
  if (!cid && !ip) {
    setStatus('Нет данных о человеке (ни номера устройства, ни IP)', true);
    return;
  }
  const reason =
    window.prompt(
      'Коротко: за что блокируем? (увидите в журнале)',
      item.reason_code || item.reason || defaultReason,
    ) || '';
  if (!reason.trim()) return;
  try {
    setStatus('Выдаём бан…');
    await ownerFetch('/api/lounge/admin/bans', {
      method: 'POST',
      body: JSON.stringify({
        client_id: cid,
        ip,
        until_days: 30,
        reason: reason.trim().slice(0, 500),
        room: item.room || item.room_id || '',
        source_report_id: item.id || item.incident_id || '',
      }),
    });
    setStatus('Бан на 30 дней выдан');
    await load();
    setTab('bans');
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

async function liftBan(item) {
  if (!window.confirm('Снять бан? Человек снова сможет заходить в комнаты.')) {
    return;
  }
  try {
    setStatus('Снимаем бан…');
    await ownerFetch('/api/lounge/admin/bans/lift', {
      method: 'POST',
      body: JSON.stringify({
        ban_id: item.id,
        client_id: item.client_id || '',
        ip: item.ip || '',
        reason: 'owner_lift',
      }),
    });
    setStatus('Бан снят');
    await load();
    setTab('bans');
  } catch (err) {
    setStatus(err.message || String(err), true);
  }
}

async function load() {
  const [inbox, mod, bans] = await Promise.all([
    ownerFetch('/api/lounge/admin/inbox?limit=200'),
    ownerFetch('/api/lounge/admin/moderation?limit=200'),
    ownerFetch('/api/lounge/admin/bans'),
  ]);
  const inboxItems = Array.isArray(inbox.items) ? inbox.items : [];
  reportItems = inboxItems.filter((x) => x.kind === 'report');
  ensureMockReports();
  modItems = buildModerationFeed(
    inboxItems,
    Array.isArray(mod.items) ? mod.items : [],
  );
  banItems = Array.isArray(bans.items) ? bans.items : [];
  renderList();
}

el.tabReports.addEventListener('click', () => setTab('reports'));
el.tabMod.addEventListener('click', () => setTab('moderation'));
el.tabBans.addEventListener('click', () => setTab('bans'));
if (el.tabSettings) {
  el.tabSettings.addEventListener('click', () => setTab('settings'));
}
if (el.settingsSaveBtn) {
  el.settingsSaveBtn.addEventListener('click', () => void saveSentinelPatterns());
}

// C-247: settings field editor modal
if (el.settingsEditorClose) {
  el.settingsEditorClose.addEventListener('click', closeSettingsEditor);
}
if (el.settingsEditorCancel) {
  el.settingsEditorCancel.addEventListener('click', closeSettingsEditor);
}
if (el.settingsEditorSave) {
  el.settingsEditorSave.addEventListener('click', commitSettingsEditor);
}
if (el.settingsEditorModal) {
  el.settingsEditorModal.addEventListener('click', (ev) => {
    if (ev.target === el.settingsEditorModal) closeSettingsEditor();
  });
}
el.search.addEventListener('input', () => {
  if (activeTab !== 'settings') renderList();
});
el.sort.addEventListener('change', () => {
  if (activeTab !== 'settings') renderList();
});
el.filter.addEventListener('change', () => {
  if (activeTab !== 'settings') renderList();
});

if (el.selectAll) {
  el.selectAll.addEventListener('change', () => {
    const visibleIds = viewRows.map((x, i) => rowId(x, i));
    if (el.selectAll.checked) {
      visibleIds.forEach((id) => selectedIds.add(id));
    } else {
      visibleIds.forEach((id) => selectedIds.delete(id));
    }
    // re-check boxes without full re-fetch
    el.list.querySelectorAll('.row-check input').forEach((input, i) => {
      input.checked = selectedIds.has(visibleIds[i]);
    });
    syncSelectionUi();
  });
}

if (el.deleteSelectedBtn) {
  el.deleteSelectedBtn.addEventListener('click', () => void deleteSelected());
}

if (el.purgeBtn) {
  el.purgeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const open = el.purgeMenuWrap?.classList.contains('is-open');
    if (open) closePurgeMenu();
    else openPurgeMenu();
  });
}
if (el.purgeByAgeBtn) {
  el.purgeByAgeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (el.purgeMenuDays) {
      // Toggle days panel; second click on «Удалить по сроку» collapses it
      el.purgeMenuDays.hidden = !el.purgeMenuDays.hidden;
      if (!el.purgeMenuDays.hidden && el.purgeDaysInline) {
        el.purgeDaysInline.focus();
      }
    }
  });
}
if (el.purgeDaysGo) {
  el.purgeDaysGo.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const days = Number(el.purgeDaysInline?.value);
    void purgeByAge(days);
  });
}
if (el.purgeDaysInline) {
  el.purgeDaysInline.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const days = Number(el.purgeDaysInline.value);
      void purgeByAge(days);
    }
  });
}
if (el.purgeAllBtn) {
  el.purgeAllBtn.addEventListener('click', () => void purgeAllSection());
}

document.addEventListener('click', (ev) => {
  if (!el.purgeMenuWrap) return;
  if (!el.purgeMenuWrap.contains(ev.target)) closePurgeMenu();
});

// C-239: robot filter buttons
if (el.robotFilters) {
  el.robotFilters.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.robot-filter-btn');
    if (!btn || !el.robotFilters.contains(btn)) return;
    setModRobotFilter(btn.dataset.robot || 'all');
  });
}

// C-238: evidence lightbox
if (el.detailEvidenceImg) {
  el.detailEvidenceImg.addEventListener('click', () => {
    const src = el.detailEvidenceImg.getAttribute('src');
    if (src && !el.detailEvidenceImg.hidden) openEvidenceLightbox(src);
  });
}
if (el.evidenceLightboxClose) {
  el.evidenceLightboxClose.addEventListener('click', (ev) => {
    ev.stopPropagation();
    closeEvidenceLightbox();
  });
}
if (el.evidenceLightbox) {
  el.evidenceLightbox.addEventListener('click', (ev) => {
    if (ev.target === el.evidenceLightbox) closeEvidenceLightbox();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (el.settingsEditorModal && !el.settingsEditorModal.hidden) {
      closeSettingsEditor();
      return;
    }
    if (el.evidenceLightbox && !el.evidenceLightbox.hidden) {
      closeEvidenceLightbox();
      return;
    }
    closePurgeMenu();
  }
});

el.loginBtn.addEventListener('click', async () => {
  const pwd = el.password.value.trim();
  if (!pwd) {
    showLogin('Введите пароль');
    return;
  }
  setPassword(pwd);
  try {
    await load();
    showInbox();
  } catch (err) {
    showLogin(err.message || String(err));
  }
});

el.refresh.addEventListener('click', async () => {
  try {
    if (activeTab === 'settings') {
      await loadSentinelPatterns();
      setStatus('Обновлено');
      return;
    }
    await load();
    setStatus('Обновлено');
  } catch (err) {
    showLogin(err.message || String(err));
  }
});

el.logout.addEventListener('click', () => {
  setPassword('');
  el.password.value = '';
  clearSelection();
  showLogin('');
});

function openRobotsHelp() {
  if (el.robotsHelpModal) el.robotsHelpModal.hidden = false;
}
function closeRobotsHelp() {
  if (el.robotsHelpModal) el.robotsHelpModal.hidden = true;
}
if (el.robotsHelpBtn) {
  el.robotsHelpBtn.addEventListener('click', openRobotsHelp);
}
if (el.robotsHelpClose) {
  el.robotsHelpClose.addEventListener('click', closeRobotsHelp);
}
if (el.robotsHelpOk) {
  el.robotsHelpOk.addEventListener('click', closeRobotsHelp);
}
if (el.robotsHelpModal) {
  el.robotsHelpModal.addEventListener('click', (ev) => {
    if (ev.target === el.robotsHelpModal) closeRobotsHelp();
  });
}

el.password.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el.loginBtn.click();
});

if (getPassword()) {
  load()
    .then(showInbox)
    .catch((err) => showLogin(err.message || String(err)));
}

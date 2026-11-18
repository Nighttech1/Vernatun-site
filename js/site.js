(function () {
  var root = document.documentElement.getAttribute('data-root') || '/';

  function href(path) {
    if (!path) return root;
    if (path.indexOf('http') === 0 || path.indexOf('#') === 0) return path;
    if (path.charAt(0) === '/') return path;
    return root.replace(/\/$/, '') + '/' + path;
  }

  var items = [
    {
      id: 'about',
      label: 'О нас',
      href: '/#club',
      dropdown: true,
      links: [
        { href: '/#club', label: 'О клубе' },
        { href: '/#formats', label: 'Форматы встреч' },
        { href: '/#atmosphere', label: 'Атмосфера' },
        { href: '/#faq', label: 'FAQ' },
      ],
    },
    {
      id: 'schedule',
      label: 'Расписание',
      href: '/schedule',
      dropdown: false,
      links: [
        { href: '/schedule', label: 'Календарь встреч' },
      ],
    },
    {
      id: 'materials',
      label: 'Учебные материалы',
      href: '/materials',
      dropdown: false,
      links: [
        { href: '/materials', label: 'Все материалы' },
        { href: '/materials/podcasts/ideal-life/', label: 'Культ идеальной жизни' },
      ],
    },
    {
      id: 'articles',
      label: 'Статьи',
      href: '/articles',
      dropdown: true,
      links: [
        { href: '/articles', label: 'Все статьи' },
        /* ARTICLES:START */
        { href: '/articles/esli-davno-ne-govoril', label: "Если давно не говорил по-армянски" },
        { href: '/articles/pochemu-my-vstrechaemsya-vzhivuyu', label: "Почему мы встречаемся вживую" },
        { href: '/articles/esli-stesnyaeshsya', label: "Если стесняешься говорить" },
        { href: '/articles/kak-prohodit-vstrecha', label: "Как проходит встреча" },
        { href: '/articles/kakoi-armyanskii', label: "Какой армянский мы говорим" },
/* ARTICLES:END */
      ],
    },
    {
      id: 'contacts',
      label: 'Контакты',
      href: '/contacts',
      dropdown: true,
      links: [
        { href: '/contacts', label: 'Как с нами связаться' },
        { href: 'https://t.me/+n7clld6EXN9kYjUy', label: 'Чат клуба' },
        { href: 'https://t.me/mosarmclub', label: 'Канал клуба' },
        { href: 'https://t.me/vernatunbot', label: 'Бот записи' },
      ],
    },
    {
      id: 'lounge',
      label: 'Кампус',
      href: '/campus',
      dropdown: false,
      links: [
        { href: '/campus', label: 'Все комнаты' },
      ],
    },
  ];

  function linkAttrs(link) {
    var external = link.href.indexOf('http') === 0;
    return external ? ' target="_blank" rel="noopener noreferrer"' : '';
  }

  function menuLinks(item, extraClass) {
    return item.links.map(function (link) {
      return (
        '<li><a href="' + link.href + '"' + linkAttrs(link) +
        ' class="' + extraClass + '" @click="closeAll()">' + link.label + '</a></li>'
      );
    }).join('');
  }

  function desktopNavTriggers() {
    return items.map(function (item) {
      if (item.dropdown === false) {
        return (
          '<a href="' + item.href + '" class="site-nav-link inline-flex items-center gap-1 rounded-md bg-transparent px-2 py-1.5 text-sm font-bold transition" @click="closeAll()">' +
            '<span>' + item.label + '</span>' +
          '</a>'
        );
      }
      return (
        '<a href="' + item.href + '" data-nav="' + item.id + '" class="site-nav-link inline-flex items-center gap-1 rounded-md bg-transparent px-2 py-1.5 text-sm font-bold transition" ' +
        ':class="open === \'' + item.id + '\' ? \'is-open\' : \'\'" ' +
        '@mouseenter="openPanel(\'' + item.id + '\')" @focus="openPanel(\'' + item.id + '\')" @click="closeAll()">' +
          '<span>' + item.label + '</span>' +
          '<svg class="h-3.5 w-3.5 opacity-50 transition" :class="open === \'' + item.id + '\' ? \'rotate-180\' : \'\'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>' +
        '</a>'
      );
    }).join('');
  }

  function headerHtml() {
    var mobile = items.map(function (item) {
      if (item.dropdown === false) {
        return (
          '<a href="' + item.href + '" class="site-mobile-section block rounded-md px-2 py-2.5 text-azure" @click="closeAll()">' + item.label + '</a>'
        );
      }
      return (
        '<div class="w-full">' +
          '<div class="site-mobile-section px-2 py-2">' + item.label + '</div>' +
          '<ul>' + menuLinks(item, 'site-mobile-link block rounded-md px-2 py-1.5') + '</ul>' +
        '</div>'
      );
    }).join('<div role="separator" class="my-1 h-px w-full bg-mist"></div>');

    return (
      '<header class="site-header-bar fixed top-0 inset-x-0 z-50 border-b border-mist/80 bg-parchment/95 backdrop-blur-md" x-data="siteHeader()" @keydown.escape.window="closeAll()">' +
        '<div class="site-header-inner mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">' +
          '<div class="flex min-w-0 items-center gap-1.5 sm:gap-2">' +
            '<button type="button" class="group inline-flex size-11 shrink-0 items-center justify-center rounded-md text-azure md:hidden" @click="mobile = !mobile" :aria-expanded="mobile ? \'true\' : \'false\'" aria-label="Открыть меню">' +
              '<svg class="pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
                '<path d="M4 12L20 12" class="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)]" :class="mobile ? \'translate-x-0 translate-y-0 rotate-[315deg]\' : \'\'"/>' +
                '<path d="M4 12H20" class="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)]" :class="mobile ? \'rotate-45\' : \'\'"/>' +
                '<path d="M4 12H20" class="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)]" :class="mobile ? \'translate-y-0 rotate-[135deg]\' : \'\'"/>' +
              '</svg>' +
            '</button>' +
            '<div class="flex min-w-0 items-center gap-6">' +
              '<a href="/" class="site-brand-link flex min-h-11 min-w-0 items-center gap-2 text-azure transition hover:text-azure/90 sm:gap-2.5" @click="closeAll()">' +
                '<img src="/images/favicon-192.png" alt="Эмблема Вернатун" class="h-9 w-9 shrink-0 object-contain" width="36" height="36" />' +
                '<span class="site-brand-name font-display text-sm font-bold uppercase tracking-wide leading-tight sm:text-base">ВЕРНАТУН</span>' +
              '</a>' +
              '<nav class="site-nav-desk relative hidden items-center gap-1 md:flex" aria-label="Разделы сайта" @mouseleave="scheduleClose()">' +
                desktopNavTriggers() +
                '<div class="site-mega absolute top-full z-50 pt-2" x-show="open" x-cloak x-ref="mega" style="display: none;" ' +
                ':style=\"open ? { left: panelLeft + \'px\', width: megaWidth() + \'rem\', display: \'block\' } : { display: \'none\' }\" @mouseenter="cancelClose()" @mouseleave="scheduleClose()">' +
                  '<div class="site-dropdown-panel site-mega-panel overflow-hidden rounded-xl border border-azure/12 bg-parchment shadow-lift">' +
                    '<ul class="site-mega-list grid gap-0.5 p-2" :key="open" :class="dir > 0 ? \'is-from-right\' : \'is-from-left\'">' +
                      '<template x-for="link in activeLinks()" :key="link.href + \'-\' + link.label">' +
                        '<li>' +
                          '<a :href="link.href" ' +
                          ':target="link.href.indexOf(\'http\') === 0 ? \'_blank\' : null" ' +
                          ':rel="link.href.indexOf(\'http\') === 0 ? \'noopener noreferrer\' : null" ' +
                          'class="block select-none rounded-md px-3 py-2 text-sm font-bold text-azure transition hover:bg-azure/8 focus-visible:ring-2 focus-visible:ring-sungold" ' +
                          '@click="closeAll()" x-text="link.label"></a>' +
                        '</li>' +
                      '</template>' +
                    '</ul>' +
                  '</div>' +
                '</div>' +
              '</nav>' +
            '</div>' +
          '</div>' +
          '<div class="flex shrink-0 items-center gap-2">' +
            '<a href="https://t.me/mosarmclub" target="_blank" rel="noopener noreferrer" class="site-cta text-white inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-bold transition hover:brightness-110 sm:px-3.5" @click="closeAll()">Присоединиться</a>' +
          '</div>' +
        '</div>' +
        '<div class="site-mobile-drawer border-t border-mist md:hidden" x-show="mobile" x-cloak x-transition.opacity.duration.150ms role="navigation" aria-label="Мобильное меню">' +
          '<div class="mx-auto max-w-7xl space-y-1 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">' + mobile + '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function footerHtml() {
    var cols = items.map(function (item) {
      var links = item.links.slice(0, 4).map(function (link) {
        return (
          '<li><a href="' + link.href + '"' + linkAttrs(link) +
          ' class="site-footer-link">' + link.label + '</a></li>'
        );
      }).join('');
      return (
        '<div class="site-footer-col">' +
          '<p class="site-footer-heading">' + item.label + '</p>' +
          '<ul class="mt-3 space-y-2">' + links + '</ul>' +
        '</div>'
      );
    }).join('');

    return (
      '<footer class="site-footer border-t border-mist bg-parchment">' +
        '<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6">' +
          '<div class="site-footer-grid">' +
            '<a href="/" class="site-footer-brand self-start" aria-label="Вернатун — на главную">' +
              '<img src="/images/logo-transparent.png" alt="Вернатун" class="site-footer-logo h-28 w-28 object-contain sm:h-32 sm:w-32" width="128" height="128" onerror="this.src=\'/images/favicon-192.png\'" />' +
            '</a>' +
            cols +
          '</div>' +
          '<div class="mt-10 flex flex-col gap-3 border-t border-mist pt-6 sm:flex-row sm:items-center sm:justify-between">' +
            '<p class="site-footer-muted text-sm">Московский армянский разговорный клуб Вернатун</p>' +
            '<div class="flex flex-col gap-2 sm:items-end">' +
              '<a href="/campus?terms=1" class="site-footer-link" data-vernatun-terms="1">Пользовательское соглашение</a>' +
              '<a href="/campus?privacy=1" class="site-footer-link" data-vernatun-privacy="1">Политика конфиденциальности</a>' +
              '<p class="site-footer-muted text-xs">© Vernatun Armenian Club</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</footer>'
    );
  }

  function ensureBrandCss() {
    var style = document.getElementById('vernatun-brand-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'vernatun-brand-css';
      document.head.appendChild(style);
    }
    style.textContent = [
      'html, body, button, input, textarea, select, *, *::before, *::after { font-family: "Century Gothic", CenturyGothic, sans-serif !important; }',
      '.font-display, .font-sans { font-family: "Century Gothic", CenturyGothic, sans-serif !important; }',
      /* bump small type vs default Tailwind xs/sm */
      '.text-xs, .site-footer-heading, [class*="text-[11px]"] { font-size: 0.8125rem !important; }',
      '.cal-pill { font-size: 0 !important; line-height: 0 !important; min-height: 2rem !important; padding: 0.35rem !important; }',
      '@media (max-width: 639px) { .cal-pill { min-height: 2.25rem !important; min-width: 2.25rem !important; } }',
      '.site-mobile-drawer { background: #F9F6F0 !important; }',
      '.site-mobile-section { font-size: 0.95rem !important; font-weight: 700 !important; color: #2A5A84 !important; text-decoration: underline !important; text-underline-offset: 0.22em !important; text-decoration-thickness: 1.5px !important; }',
      '.site-mobile-link { font-size: 0.8rem !important; font-weight: 600 !important; color: rgba(42,90,132,0.78) !important; text-decoration: none !important; }',
      '.site-footer-heading { text-decoration: underline !important; text-underline-offset: 0.22em !important; text-decoration-thickness: 1.5px !important; background-size: 0 !important; }',
      '.site-footer-link { text-decoration: none !important; }',
      '.text-sm, .site-footer-link, .site-footer-muted, .site-nav-link, .site-brand-name { font-size: 0.9375rem !important; }',
      '@media (min-width: 640px) { .sm\\:text-base, .site-brand-name { font-size: 1.0625rem !important; } }',
      '.site-dropdown-panel { background-color: #F9F6F0 !important; }',
      '[x-cloak] { display: none !important; }',
      '.site-mega { display: none; }',
      'header [x-data] .site-mega[style*="display: block"] { display: block !important; }',
      'html, body { color: #2A5A84 !important; }',
      'body, body p, body li, body h1, body h2, body h3, body h4, body summary, body label, body span:not([class*="bg-"]) { color: #2A5A84 !important; }',
      'a:not(.bg-terracotta):not(.bg-azure):not(.site-cta):not([class*="text-white"]) { color: #2A5A84 !important; }',
      /* Campus lobby: featured + CTAs must stay white on dark (override body h/span azure) */
      '.campus-featured-card, .campus-featured-card h3, .campus-featured-card p, .campus-featured-card span, .campus-featured-card a { color: #ffffff !important; }',
      '.campus-card-cta, .campus-card-cta span, a.campus-card-cta { color: #ffffff !important; background: #111111 !important; }',
      'a.campus-card-cta:hover, .campus-card:hover a.campus-card-cta { background: #C95B36 !important; color: #ffffff !important; }',
      'a.campus-btn-on-azure, .campus-btn-on-azure { color: #ffffff !important; background: #111111 !important; }',
      'a.campus-btn-on-azure:hover, .campus-btn-on-azure:hover { background: #C95B36 !important; color: #ffffff !important; }',
      '.campus-hero-title, .campus-hero-subtitle { color: #2A5A84 !important; }',
      '.campus-hero-title::before, .campus-hero-title::after, .campus-hero-copy::before, .campus-hero-copy::after { content: none !important; display: none !important; }',
      '.text-ink, .text-ink\\/35, .text-ink\\/50, .text-ink\\/60, .text-ink\\/65, .text-ink\\/70, .text-ink\\/75, .text-ink\\/80, .text-azure { color: #2A5A84 !important; }',
      '.text-ink\\/70, .text-ink\\/75, .text-azure\\/75, .text-azure\\/80 { color: rgba(42,90,132,0.82) !important; }',
      '.text-ink\\/60, .text-ink\\/65, .text-azure\\/65, .text-azure\\/70 { color: rgba(42,90,132,0.72) !important; }',
      '.text-terracotta { color: #C95B36 !important; }',
      '.text-sungold { color: #E6B25A !important; }',
      '.bg-terracotta, a.bg-terracotta, .bg-azure, a.bg-azure { color: #fff !important; }',
      'html body a.site-cta, html body a.site-cta:hover, html body a.site-cta:focus, html body a.site-cta:visited { background: #C95B36 !important; color: #ffffff !important; }',
      '.site-cta { background: #C95B36 !important; color: #ffffff !important; border: none; }',
      '@media (max-width: 767px) { .site-cta { min-height: 2.75rem !important; } .site-brand-name { font-size: 0.8rem !important; } .site-brand-link { min-height: 2.75rem !important; } .site-footer-link { min-height: 2.5rem; display: inline-flex; align-items: center; } }',
      '@media (max-width: 430px) { .site-brand-name { display: inline !important; font-size: 0.72rem !important; max-width: 5.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }',
      'a.site-cta, a.site-cta:hover, a.site-cta:focus { background: #C95B36 !important; color: #ffffff !important; }',
      'header.is-film:not(.is-solid) .site-cta, header.is-film:not(.is-solid) a.site-cta, header.is-film.is-solid a.site-cta { background: #C95B36 !important; color: #ffffff !important; }',
      'header.is-film:not(.is-solid) button { color: #fff !important; }',
      'header.is-film.is-solid button { color: #2A5A84 !important; }',
      'header.is-film:not(.is-solid) .site-brand-name { color: #fff !important; }',
      'header.is-film.is-solid .site-brand-name { color: #2A5A84 !important; }',
      'header:not(.is-film) .site-brand-name { color: #2A5A84 !important; }',
      '.bento-tile--azure, .bento-tile--azure * { color: #F9F6F0 !important; }',
      '.bento-tile--azure .text-sungold, .bento-tile--azure [class*="sungold"] { color: #E6B25A !important; }',
      '.dest-card-body, .dest-card-body * { color: #F9F6F0 !important; }',
      '.film-hero, .film-hero *:not(.film-quote span) { color: #fff !important; }',
      '.film-hero .film-quote { color: #fff !important; }',
      '.film-hero .film-quote span { color: #E6B25A !important; }',
      '#atmosphere h2, #atmosphere .text-white, .atmosphere-title { color: #F9F6F0 !important; }',
      '.atmosphere-lead { color: rgba(249,246,240,0.72) !important; }',
      '.atmosphere-outer { background: #F9F6F0 !important; }',
      '.atmosphere-section { background: #2A5A84 !important; }',
      'header.is-film:not(.is-solid) { background: transparent !important; border-color: transparent !important; backdrop-filter: none !important; box-shadow: none !important; }',
      'header.is-film.is-solid { background: rgba(249, 246, 240, 0.95) !important; border-color: rgba(232, 226, 216, 0.8) !important; backdrop-filter: blur(12px) !important; }',
      'header.is-film:not(.is-solid) .site-nav-link, header.is-film:not(.is-solid) .site-nav-link span, header.is-film:not(.is-solid) a:not(.site-cta) { color: #fff !important; }',
      'header.is-film:not(.is-solid) .site-nav-link { color: rgba(255,255,255,0.92) !important; }',
      'header.is-film.is-solid .site-nav-link, header:not(.is-film) .site-nav-link { color: #2A5A84 !important; }',
      'header.is-film:not(.is-solid) .site-cta { background: #C95B36 !important; color: #fff !important; }',
      'header.is-film.is-solid a:not(.site-cta), header.is-film.is-solid .site-nav-link { color: #2A5A84 !important; }',
      '.site-footer, .site-footer p, .site-footer a, .site-footer-heading { color: #2A5A84 !important; }',
      '.site-footer-link { color: rgba(42,90,132,0.78) !important; }',
      '.site-footer-link:hover { color: #2A5A84 !important; }',
      '.site-footer-muted { color: rgba(42,90,132,0.65) !important; }',
      '.site-footer-grid { display: grid; gap: 2rem 1.5rem; grid-template-columns: 1fr; }',
      '@media (min-width: 640px) { .site-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }',
      '@media (min-width: 1024px) { .site-footer-grid { grid-template-columns: minmax(8rem, 10rem) repeat(6, minmax(0, 1fr)); align-items: start; } .site-footer-brand { grid-column: 1; } }',
      '.cal-pill--talk { color: #fff !important; }',
      '.cal-pill--dance { color: #fff !important; }',
      '.cal-pill--volleyball { color: #2A5A84 !important; }',
    ].join('\n');
  }

  function lightboxHtml() {
    return (
      '<div x-show="active" x-transition.opacity.duration.200ms class="site-lightbox fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" style="display: none; touch-action: none;" @click.self="close()" @touchmove.prevent role="dialog" aria-modal="true" :aria-label="caption || \'Просмотр изображения\'">' +
        '<button type="button" class="absolute right-4 top-4 z-10 rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white/20" @click="close()" aria-label="Закрыть">' +
          '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<figure class="site-lightbox-figure max-h-[90vh] max-w-5xl" style="touch-action: none;">' +
          '<img :src="src" :alt="caption" class="site-lightbox-img max-h-[80vh] w-auto max-w-full rounded-md border border-white/10 object-contain" width="1200" height="800" draggable="false" style="touch-action: none; -webkit-user-drag: none; user-select: none;" />' +
          '<figcaption class="mt-3 text-center text-sm text-white/80" x-text="caption"></figcaption>' +
        '</figure>' +
      '</div>'
    );
  }

  function mount(id, html) {
    var slot = document.getElementById(id);
    if (slot) slot.innerHTML = html;
  }

  mount('site-header', headerHtml());
  ensureBrandCss();

  function bindFilmHeader() {
    var header = document.querySelector('#site-header header');
    if (!header) return;
    var hero = document.querySelector('.film-hero');
    if (!hero) {
      header.classList.remove('is-film');
      header.classList.add('is-solid');
      return;
    }
    header.classList.add('is-film');
    function paintFilmNav(onVideo) {
      var links = header.querySelectorAll('a.site-nav-link, .site-brand-name');
      var btns = header.querySelectorAll('button');
      var color = onVideo ? '#ffffff' : '#2A5A84';
      links.forEach(function (el) { el.style.setProperty('color', color, 'important'); });
      btns.forEach(function (el) { el.style.setProperty('color', color, 'important'); });
      var svgs = header.querySelectorAll('a.site-nav-link svg');
      svgs.forEach(function (el) { el.style.setProperty('color', color, 'important'); });
    }
    function onScroll() {
      if (header.classList.contains('is-mobile-open')) {
        header.classList.add('is-solid');
        paintFilmNav(false);
        return;
      }
      var rect = hero.getBoundingClientRect();
      var past = rect.bottom <= 72;
      header.classList.toggle('is-solid', past);
      paintFilmNav(!past);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    var vid = document.querySelector('.film-hero .film-video');
    if (vid && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Source trimmed at 1:41 (101s); loop from start of file = original 1:41
      var LOOP_START = Number(vid.getAttribute('data-loop-start') || '0');
      var seekStart = function () {
        try {
          if (vid.currentTime < LOOP_START || Math.abs(vid.currentTime - LOOP_START) > 0.12) {
            vid.currentTime = LOOP_START;
          }
        } catch (e) {}
      };
      var markReady = function () {
        vid.classList.add('is-ready');
      };
      var play = function () {
        seekStart();
        var p = vid.play();
        if (p && p.then) {
          p.then(markReady).catch(function () { markReady(); });
        } else {
          markReady();
        }
      };
      vid.loop = false;
      vid.addEventListener('loadedmetadata', seekStart);
      vid.addEventListener('playing', markReady);
      vid.addEventListener('seeked', function () {
        if (vid.currentTime < LOOP_START) seekStart();
      });
      vid.addEventListener('ended', function () {
        seekStart();
        vid.play().catch(function () {});
      });
      vid.addEventListener('timeupdate', function () {
        if (!vid.duration || !isFinite(vid.duration)) return;
        if (vid.currentTime < LOOP_START) seekStart();
        if (vid.currentTime >= vid.duration - 0.12) {
          seekStart();
          if (vid.paused) vid.play().catch(function () {});
        }
      });
      if (vid.readyState >= 2) play();
      else vid.addEventListener('loadeddata', play, { once: true });
    }

  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindFilmHeader);
  } else {
    bindFilmHeader();
  }

  var FORMAT_META = {
    talk: {
      kindLabel: 'Разговорный клуб',
      pillLabel: 'Разговорный\nклуб',
      title: 'Разговорный клуб',
      image: '/images/event-talk.png',
      description:
        'Больше, чем разговорная практика. Это вечер глубоких диалогов, новых знакомств и живого языка, звучащего за общим столом.',
    },
    dance: {
      kindLabel: 'Танцы',
      pillLabel: 'Танцы',
      title: 'Танцы',
      image: '/images/event-dance.png?v=20260914c',
      description:
        'Движение, традиции и новые знакомства в комфортном темпе — без опыта, сцены и оценок. Учимся вместе в тёплой компании.',
    },
    volleyball: {
      kindLabel: 'Волейбол',
      pillLabel: 'Волейбол',
      title: 'Волейбол',
      image: '/images/event-volleyball.png',
      description:
        'Командный дух, азарт и активный отдых вне стен клуба. Играем в удовольствие независимо от уровня подготовки, общаемся и заряжаемся драйвом в кругу своих.',
    },
  };

  function padDateKey(y, m, d) {
    var mm = String(m + 1).padStart(2, '0');
    var dd = String(d).padStart(2, '0');
    return y + '-' + mm + '-' + dd;
  }

  /** Saturdays from 2026-09-19: dance-only; +7 days: talk-only; then alternate. */
  function saturdayKind(year, month, day) {
    var cur = Date.UTC(year, month, day);
    var start = Date.UTC(2026, 8, 19);
    if (cur < start) return 'talk';
    var days = Math.round((cur - start) / 86400000);
    if (days % 14 === 0) return 'dance';
    return 'talk';
  }

  /** One-off meetings outside the weekly pattern (date = YYYY-MM-DD). */
  var EXTRA_EVENTS = [
    { date: '2026-09-30', kind: 'talk', time: '20:00–23:00', idPrefix: 'talk-extra' },
  ];

  function buildMonthEvents(year, month) {
    var list = [];
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var metaTalk = FORMAT_META.talk;
    var metaDance = FORMAT_META.dance;
    var metaVolley = FORMAT_META.volleyball;
    for (var day = 1; day <= daysInMonth; day++) {
      var dow = new Date(year, month, day).getDay();
      var key = padDateKey(year, month, day);
      if (dow === 4) {
        list.push({
          id: 'talk-thu-' + key,
          date: key,
          kind: 'talk',
          kindLabel: metaTalk.kindLabel,
          pillLabel: metaTalk.pillLabel,
          title: metaTalk.title,
          time: '20:00–23:00',
          image: metaTalk.image,
          description: metaTalk.description,
        });
      }
      if (dow === 6) {
        var sat = saturdayKind(year, month, day);
        if (sat === 'talk') {
          list.push({
            id: 'talk-sat-' + key,
            date: key,
            kind: 'talk',
            kindLabel: metaTalk.kindLabel,
            pillLabel: metaTalk.pillLabel,
            title: metaTalk.title,
            time: '15:00–18:00',
            image: metaTalk.image,
            description: metaTalk.description,
          });
        } else {
          list.push({
            id: 'dance-' + key,
            date: key,
            kind: 'dance',
            kindLabel: metaDance.kindLabel,
            pillLabel: metaDance.pillLabel,
            title: metaDance.title,
            time: '18:00–20:00',
            image: metaDance.image,
            description: metaDance.description,
          });
        }
      }
      if (dow === 0) {
        list.push({
          id: 'volley-sun-' + key,
          date: key,
          kind: 'volleyball',
          kindLabel: metaVolley.kindLabel,
          pillLabel: metaVolley.pillLabel,
          title: metaVolley.title,
          time: '15:00–17:00',
          image: metaVolley.image,
          description: metaVolley.description,
        });
      }
    }
    EXTRA_EVENTS.forEach(function (extra) {
      var parts = extra.date.split('-');
      var ey = Number(parts[0]);
      var em = Number(parts[1]) - 1;
      if (ey !== year || em !== month) return;
      var meta = FORMAT_META[extra.kind];
      if (!meta) return;
      var already = list.some(function (ev) {
        return ev.date === extra.date && ev.kind === extra.kind && ev.time === extra.time;
      });
      if (already) return;
      list.push({
        id: (extra.idPrefix || extra.kind) + '-' + extra.date,
        date: extra.date,
        kind: extra.kind,
        kindLabel: meta.kindLabel,
        pillLabel: meta.pillLabel,
        title: meta.title,
        time: extra.time,
        image: meta.image,
        description: meta.description,
      });
    });
    var monthNames = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    list.forEach(function (ev) {
      var parts = ev.date.split('-');
      ev.dateLabel = Number(parts[2]) + ' ' + monthNames[Number(parts[1]) - 1];
    });
    list.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.time.localeCompare(b.time, 'ru');
    });
    return list;
  }

  document.addEventListener('alpine:init', function () {
    Alpine.data('lightbox', function () {
      return {
        active: false,
        src: '',
        caption: '',
        _vp: '',
        lockViewport: function () {
          var meta = document.querySelector('meta[name="viewport"]');
          if (!meta) return;
          this._vp = meta.getAttribute('content') || 'width=device-width, initial-scale=1';
          meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        },
        unlockViewport: function () {
          var meta = document.querySelector('meta[name="viewport"]');
          if (!meta) return;
          var restore = this._vp || 'width=device-width, initial-scale=1';
          // iOS: nudge scale to drop stuck browser zoom, then restore.
          meta.setAttribute('content', 'width=device-width, initial-scale=1.01, maximum-scale=1.01');
          var self = this;
          setTimeout(function () {
            meta.setAttribute('content', restore);
            self._vp = '';
          }, 40);
        },
        openLb: function (src, caption) {
          this.src = src;
          this.caption = caption || '';
          this.active = true;
          document.body.style.overflow = 'hidden';
          this.lockViewport();
        },
        close: function () {
          this.active = false;
          this.src = '';
          this.caption = '';
          document.body.style.overflow = '';
          this.unlockViewport();
        },
      };
    });

    Alpine.data('siteHeader', function () {
      return {
        open: null,
        mobile: false,
        closeTimer: null,
        dir: 1,
        panelLeft: 0,
        navItems: items,
        init: function () {
          var self = this;
          this.$watch('mobile', function (on) {
            self.syncMobileChrome(on);
          });
        },
        syncMobileChrome: function (on) {
          var root = this.$el;
          if (!root) return;
          if (on) {
            root.classList.add('is-solid', 'is-mobile-open');
            document.documentElement.classList.add('mobile-nav-open');
            document.body.style.overflow = 'hidden';
          } else {
            root.classList.remove('is-mobile-open');
            document.documentElement.classList.remove('mobile-nav-open');
            document.body.style.overflow = '';
          }
          window.dispatchEvent(new Event('scroll'));
        },
        activeLinks: function () {
          var self = this;
          var it = this.navItems.find(function (i) { return i.id === self.open; });
          return it ? it.links : [];
        },
        megaWidth: function () {
          var n = this.activeLinks().length;
          return Math.max(11.5, Math.min(17, 9.5 + n * 1.15));
        },
        openPanel: function (id) {
          var ids = this.navItems.map(function (i) { return i.id; });
          if (this.open && this.open !== id) {
            this.dir = ids.indexOf(id) >= ids.indexOf(this.open) ? 1 : -1;
          }
          this.cancelClose();
          this.open = id;
          var root = (this.$el && this.$el.closest) ? (this.$el.closest('header') || this.$el) : this.$el;
          var nav = root.querySelector('.site-nav-desk');
          var trig = root.querySelector('[data-nav="' + id + '"]');
          if (!nav || !trig) return;
          var left = trig.getBoundingClientRect().left - nav.getBoundingClientRect().left;
          var n = (this.navItems.find(function (i) { return i.id === id; }) || { links: [] }).links.length;
          var panelW = Math.max(11.5, Math.min(17, 9.5 + n * 1.15)) * 16;
          var maxLeft = Math.max(0, nav.clientWidth - panelW);
          this.panelLeft = Math.min(Math.max(0, Math.round(left)), maxLeft);
        },
        scheduleClose: function () {
          var self = this;
          this.cancelClose();
          this.closeTimer = setTimeout(function () { self.open = null; }, 160);
        },
        cancelClose: function () {
          if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = null;
          }
        },
        closeAll: function () {
          this.open = null;
          this.mobile = false;
          this.syncMobileChrome(false);
        },
      };
    });

    Alpine.data('destTilt', function () {
      return {
        rx: 0,
        ry: 0,
        isOpen: false,
        coarse: false,
        init: function () {
          this.coarse = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)').matches;
          if (this.coarse) this.isOpen = true;
        },
        onMove: function (e) {
          if (this.coarse) return;
          this.isOpen = true;
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          var rect = e.currentTarget.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width;
          var y = (e.clientY - rect.top) / rect.height;
          this.ry = (x - 0.5) * 14;
          this.rx = (0.5 - y) * 14;
        },
        onLeave: function () {
          if (this.coarse) {
            this.isOpen = true;
            this.rx = 0;
            this.ry = 0;
            return;
          }
          this.rx = 0;
          this.ry = 0;
          this.isOpen = false;
        },
      };
    });

    Alpine.data('circularGallery', function () {
      return {
        items: [
          { src: '/gallery/1.jpg' },
          { src: '/gallery/2.jpg' },
          { src: '/gallery/3.jpg' },
          { src: '/gallery/4.jpg' },
          { src: '/gallery/5.jpg' },
          { src: '/gallery/6.jpg' },
          { src: '/gallery/7.jpg' },
          { src: '/gallery/8.jpg' },
        ],
        rotation: 0,
        targetRotation: 0,
        isScrolling: false,
        reduced: false,
        autoRotateSpeed: 0.0675,
        scrollTimer: null,
        raf: null,
        locked: false,
        stepBy: function (dir) {
          var step = 360 / Math.max(this.items.length, 1);
          this.isScrolling = true;
          this.targetRotation += (dir < 0 ? -1 : 1) * step;
          if (this.scrollTimer) clearTimeout(this.scrollTimer);
          var self = this;
          this.scrollTimer = setTimeout(function () { self.isScrolling = false; }, 400);
        },
        init: function () {
          this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (this.reduced) return;
          var self = this;
          var section = this.$el.closest('.atmosphere-section') || this.$el;
          var isCoarse = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;

          var onWheel = function (e) {
            if (isCoarse) return;
            e.preventDefault();
            e.stopPropagation();
            self.isScrolling = true;
            if (self.scrollTimer) clearTimeout(self.scrollTimer);
            self.targetRotation += e.deltaY * 0.085;
            self.scrollTimer = setTimeout(function () { self.isScrolling = false; }, 220);
          };
          if (!isCoarse) {
            section.addEventListener('wheel', onWheel, { passive: false });
            section.addEventListener('mouseenter', function () { self.locked = true; });
            section.addEventListener('mouseleave', function () { self.locked = false; });
          }

          // Mobile: never preventDefault on vertical — page must scroll.
          // Horizontal swipe still nudges the ring; vertical is pan-y native.
          var touchStartX = null;
          var touchStartY = null;
          var axis = null;
          var onTouchStart = function (e) {
            if (!e.touches || !e.touches.length) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            axis = null;
            if (self.scrollTimer) clearTimeout(self.scrollTimer);
          };
          var onTouchMove = function (e) {
            if (touchStartX === null || !e.touches || !e.touches.length) return;
            var x = e.touches[0].clientX;
            var y = e.touches[0].clientY;
            var dx = x - touchStartX;
            var dy = y - touchStartY;
            if (axis === null) {
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
              axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            }
            if (axis === 'y') {
              // Let the browser scroll the page; do not rotate / do not preventDefault.
              return;
            }
            // Horizontal: rotate ring. Only preventDefault when we own the gesture.
            if (!isCoarse) {
              e.preventDefault();
            } else if (Math.abs(dx) > 10) {
              e.preventDefault();
            }
            self.targetRotation += dx * 0.18;
            touchStartX = x;
            touchStartY = y;
            self.isScrolling = true;
          };
          var onTouchEnd = function () {
            touchStartX = null;
            touchStartY = null;
            axis = null;
            if (self.scrollTimer) clearTimeout(self.scrollTimer);
            self.scrollTimer = setTimeout(function () { self.isScrolling = false; }, 280);
          };
          section.addEventListener('touchstart', onTouchStart, { passive: true });
          section.addEventListener('touchmove', onTouchMove, { passive: false });
          section.addEventListener('touchend', onTouchEnd, { passive: true });
          section.addEventListener('touchcancel', onTouchEnd, { passive: true });

          var tick = function () {
            if (!self.isScrolling) self.targetRotation += self.autoRotateSpeed;
            self.rotation += (self.targetRotation - self.rotation) * 0.14;
            self.raf = requestAnimationFrame(tick);
          };
          self.raf = requestAnimationFrame(tick);
        },
        get radius() {
          return window.innerWidth < 640 ? 280 : (window.innerWidth < 1024 ? 580 : 720);
        },
        itemStyle: function (index) {
          var n = this.items.length;
          var angle = (360 / n) * index;
          var total = ((this.rotation % 360) + 360) % 360;
          var relative = (angle + total + 360) % 360;
          var normalized = Math.abs(relative > 180 ? 360 - relative : relative);
          var opacity = Math.max(0.35, 1 - normalized / 180);
          var halfW = window.innerWidth < 640 ? 100 : 160;
          var halfH = window.innerWidth < 640 ? 135 : 210;
          return (
            'transform: rotateY(' + angle + 'deg) translateZ(' + this.radius + 'px);' +
            'left:50%;top:50%;margin-left:-' + halfW + 'px;margin-top:-' + halfH + 'px;' +
            'opacity:' + Math.max(0.42, opacity).toFixed(3) + ';'
          );
        },
      };
    });

    Alpine.data('clubCalendar', function () {
      var monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
      ];
      var now = new Date();
      var startYear = now.getFullYear();
      var startMonth = now.getMonth();
      var events = buildMonthEvents(startYear, startMonth);
      var byDate = {};
      function indexEvents(list) {
        byDate = {};
        list.forEach(function (ev) {
          if (!byDate[ev.date]) byDate[ev.date] = [];
          byDate[ev.date].push(ev);
        });
        Object.keys(byDate).forEach(function (key) {
          byDate[key].sort(function (a, b) { return a.time.localeCompare(b.time, 'ru'); });
        });
      }
      indexEvents(events);
      function dateKey(d) {
        return padDateKey(d.getFullYear(), d.getMonth(), d.getDate());
      }
      var firstTalk = events.find(function (ev) { return ev.kind === 'talk'; });
      function buildFlatCells(year, month, selectedId) {
        var first = new Date(year, month, 1);
        var start = new Date(first);
        var mondayOffset = (first.getDay() + 6) % 7;
        start.setDate(1 - mondayOffset);
        var cells = [];
        var cursor = new Date(start);
        for (var i = 0; i < 42; i++) {
          var cellDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
          var key = dateKey(cellDate);
          var cellEvents = byDate[key] || [];
          cells.push({
            key: key,
            date: cellDate.getDate(),
            inMonth: cellDate.getMonth() === month,
            isToday: cellDate.getDate() === now.getDate() && cellDate.getMonth() === now.getMonth() && cellDate.getFullYear() === now.getFullYear(),
            events: cellEvents,
          });
          cursor.setDate(cursor.getDate() + 1);
        }
        return cells;
      }
      return {
        year: startYear,
        month: startMonth,
        monthNames: monthNames,
        weekDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        events: events,
        flatCells: buildFlatCells(startYear, startMonth, firstTalk ? firstTalk.id : null),
        get title() { return this.monthNames[this.month] + ' ' + this.year; },
        isToday: function (d) {
          return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        },
        selectedId: firstTalk ? firstTalk.id : null,
        get selected() {
          for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].id === this.selectedId) return this.events[i];
          }
          return null;
        },
        get siblings() {
          if (!this.selected) return [];
          return byDate[this.selected.date] || [];
        },
        rebuildGrid: function () {
          this.flatCells = buildFlatCells(this.year, this.month, this.selectedId);
        },
        reloadMonth: function () {
          this.events = buildMonthEvents(this.year, this.month);
          indexEvents(this.events);
          if (!this.events.some(function (ev) { return ev.id === this.selectedId; }, this)) {
            this.selectedId = this.events.length ? this.events[0].id : null;
          }
          this.rebuildGrid();
        },
        selectId: function (id) {
          this.selectedId = id;
          var ev = null;
          for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].id === id) { ev = this.events[i]; break; }
          }
          if (!ev) return;
          var parts = ev.date.split('-');
          var y = Number(parts[0]);
          var m = Number(parts[1]) - 1;
          if (y !== this.year || m !== this.month) {
            this.year = y;
            this.month = m;
            this.reloadMonth();
            this.selectedId = id;
          }
        },
        selectDay: function (cell) {
          if (!cell.events.length) return;
          var already = cell.events.some(function (ev) { return ev.id === this.selectedId; }, this);
          this.selectedId = already ? this.selectedId : cell.events[0].id;
        },
        pillClass: function (kind, active) {
          var base = 'cal-pill cal-pill--' + kind;
          return active ? base + ' is-active' : base;
        },
        pillIcon: function (kind) {
          if (kind === 'talk') {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a8.5 8.5 0 01-8.5 8.5c-1.2 0-2.3-.2-3.3-.7L3 21l1.3-3.9A8.5 8.5 0 1121 12z"/></svg>';
          }
          if (kind === 'dance') {
            /* pair of dancers like studio logo: left figure + right with skirt, arms up joining hands */
            return '<svg viewBox="0 0 48 44" fill="currentColor" aria-hidden="true"><circle cx="14.5" cy="6.5" r="3.2"/><path d="M14.5 10.2c-2.6.15-5.2-.9-7.1-2.9l-2 1.7c2.5 2.7 5.9 4.2 9.3 4.2.2 0 .3 0 .5-.02v.1c-2.1.55-3.7 2.1-4.3 4.2l-1 3.1h3.4l1.2-3.3 1.3 3.3h3.4l-1.4-3.8c-.55-1.5-1.8-2.6-3.3-2.95v-.15c.15 0 .3.02.45.02 3.1 0 6-1.35 8.1-3.7l-1.95-1.75c-1.65 1.8-3.9 2.8-6.15 2.95z"/><circle cx="33.5" cy="6.5" r="3.2"/><path d="M33.5 10.2c-2.2.1-4.3-.7-5.9-2.2l-1.9 1.7c2.1 2 4.8 3.15 7.6 3.25.15 0 .3 0 .45-.02v.12c-1.7.45-3 1.8-3.5 3.5l-1.15 3.35h12.2l-1.2-3.4c-.55-1.55-1.9-2.7-3.5-3.15v-.12c.12 0 .24.02.35.02 2.9 0 5.6-1.35 7.5-3.6l-1.95-1.7c-1.5 1.7-3.6 2.7-5.7 2.85z"/><path d="M28.2 19.2h10.6l2.6 6.4H25.6z"/><path d="M30.4 25.8l-2.4 10.4h3.3l1.5-6.2 1.4 6.2h3.3l-2.5-10.4z"/><path d="M12.2 20.4l-3.6 16h3.4l2.2-9.5 2.1 9.5h3.4l-3.7-16z"/></svg>';
          }
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M7.2 5.2c2.2 2.4 3.4 5.4 3.4 8.8 0 2.2-.5 4.2-1.4 6"/><path d="M16.8 5.2c-2.2 2.4-3.4 5.4-3.4 8.8 0 2.2.5 4.2 1.4 6"/><path d="M4.2 10.2c2.6 1.1 5.2 1.7 7.8 1.7s5.2-.6 7.8-1.7"/><path d="M5.5 15.8c2.1-.8 4.3-1.2 6.5-1.2s4.4.4 6.5 1.2"/></svg>';
        },
        mobilePill: function (ev) {
          if (!ev) return '';
          return ev.kindLabel || ev.pillLabel || '';
        },
        kindClass: function (kind) {
          if (kind === 'talk') return 'bg-azure text-white';
          if (kind === 'dance') return 'bg-terracotta text-white';
          return 'bg-sungold text-azure';
        },
        prevMonth: function () {
          if (this.month === 0) { this.month = 11; this.year -= 1; }
          else this.month -= 1;
          this.selectedId = null;
          this.reloadMonth();
        },
        nextMonth: function () {
          if (this.month === 11) { this.month = 0; this.year += 1; }
          else this.month += 1;
          this.selectedId = null;
          this.reloadMonth();
        },
      };
    });
  });

  window.VernatunChrome = {
    href: href,
    mountRest: function () {
      ensureBrandCss();
      mount('site-footer', footerHtml());
      if (!document.getElementById('site-lightbox')) {
        var box = document.createElement('div');
        box.id = 'site-lightbox';
        box.innerHTML = lightboxHtml();
        document.body.appendChild(box);
      }
      var autoReveal = document.querySelectorAll(
        '.dest-card, .faq-item, .magazine-row, .bento-tile, .site-footer > footer, main > section:not(.film-hero)'
      );
      autoReveal.forEach(function (el) {
        if (!el.classList.contains('reveal')) el.classList.add('reveal');
      });
      document.querySelectorAll('.dest-grid, .bento-mono, #faq .space-y-3, .mt-10').forEach(function (el) {
        if (el.querySelector(':scope > .reveal')) el.classList.add('reveal-stagger');
      });
      var els = document.querySelectorAll('.reveal');
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || !('IntersectionObserver' in window)) {
        els.forEach(function (el) { el.classList.add('reveal-visible'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('reveal-visible');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      els.forEach(function (el) { io.observe(el); });
    },
  };

  if (!window.__vernatunTermsClickBound) {
    window.__vernatunTermsClickBound = true;
    document.addEventListener('click', function (e) {
      var terms = e.target && e.target.closest ? e.target.closest('[data-vernatun-terms]') : null;
      if (terms && typeof window.__openVernatunTerms === 'function') {
        e.preventDefault();
        window.__openVernatunTerms();
        return;
      }
      var privacy = e.target && e.target.closest ? e.target.closest('[data-vernatun-privacy]') : null;
      if (privacy && typeof window.__openVernatunPrivacy === 'function') {
        e.preventDefault();
        window.__openVernatunPrivacy();
      }
    });
  }
})();

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  TermsOfServiceModal,
  openTermsOfService,
} from './modals/TermsOfServiceModal';
import {
  PrivacyPolicyModal,
  openPrivacyPolicy,
} from './modals/PrivacyPolicyModal';

interface LayoutProps {
  children: ReactNode;
  variant?: 'campus' | 'minimal';
}

/**
 * Shared site chrome: same header/footer as vernatunspeakclub.com via /js/site.js.
 * On Vite localhost, static pages (О нас, Расписание, …) are served from repo root.
 */
export function Layout({ children, variant = 'campus' }: LayoutProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const booted = useRef(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const openTerms = useCallback(() => setTermsOpen(true), []);
  const openPrivacy = useCallback(() => setPrivacyOpen(true), []);
  const closeTerms = useCallback(() => {
    setTermsOpen(false);
    if (searchParams.get('terms') === '1') {
      const next = new URLSearchParams(searchParams);
      next.delete('terms');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const closePrivacy = useCallback(() => {
    setPrivacyOpen(false);
    if (searchParams.get('privacy') === '1') {
      const next = new URLSearchParams(searchParams);
      next.delete('privacy');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    window.__openVernatunTerms = openTerms;
    window.__openVernatunPrivacy = openPrivacy;
    const onTerms = () => openTerms();
    const onPrivacy = () => openPrivacy();
    window.addEventListener('vernatun-open-terms', onTerms);
    window.addEventListener('vernatun-open-privacy', onPrivacy);
    return () => {
      window.removeEventListener('vernatun-open-terms', onTerms);
      window.removeEventListener('vernatun-open-privacy', onPrivacy);
      if (window.__openVernatunTerms === openTerms) {
        delete window.__openVernatunTerms;
      }
      if (window.__openVernatunPrivacy === openPrivacy) {
        delete window.__openVernatunPrivacy;
      }
    };
  }, [openTerms, openPrivacy]);

  useEffect(() => {
    if (searchParams.get('terms') === '1') openTerms();
    if (searchParams.get('privacy') === '1') openPrivacy();
  }, [searchParams, openTerms, openPrivacy]);

  useEffect(() => {
    if (variant === 'minimal' || booted.current) return;
    booted.current = true;
    document.documentElement.setAttribute('data-root', '/');

    const ensureCss = (href: string) => {
      if (document.querySelector(`link[href^="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    };

    const ensureScript = (src: string, attrs?: Record<string, string>) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src^="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        if (attrs) {
          Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
        }
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(src));
        document.head.appendChild(s);
      });

    void (async () => {
      try {
        ensureCss('/css/site.css');
        if (!(window as unknown as { tailwind?: unknown }).tailwind) {
          await ensureScript('https://cdn.tailwindcss.com');
          await ensureScript('/js/tailwind-config.js');
        }
        if (!(window as unknown as { Alpine?: unknown }).Alpine) {
          await ensureScript(
            'https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js',
            { defer: '' },
          );
        }
        const existing = document.querySelector('script[data-vernatun-site]');
        if (existing) existing.remove();
        const s = document.createElement('script');
        s.src = `/js/site.js?v=${Date.now()}`;
        s.dataset.vernatunSite = '1';
        s.onload = () => {
          const chrome = (
            window as unknown as {
              VernatunChrome?: { mountRest?: () => void };
            }
          ).VernatunChrome;
          chrome?.mountRest?.();
        };
        document.body.appendChild(s);
      } catch (err) {
        console.warn('site chrome load', err);
      }
    })();
  }, [variant]);

  useEffect(() => {
    document.querySelectorAll('.site-nav-link').forEach((el) => {
      const a = el as HTMLAnchorElement;
      if (
        a.getAttribute('href')?.includes('campus') ||
        a.getAttribute('href')?.includes('lounge')
      ) {
        a.classList.toggle(
          'is-active',
          location.pathname.startsWith('/campus'),
        );
      }
    });
  }, [location.pathname]);

  const modals = (
    <>
      <TermsOfServiceModal open={termsOpen} onClose={closeTerms} />
      <PrivacyPolicyModal open={privacyOpen} onClose={closePrivacy} />
    </>
  );

  if (variant === 'minimal') {
    return (
      <>
        {children}
        {modals}
      </>
    );
  }

  return (
    <div className="campus-shell campus-shell--site-chrome">
      <div id="site-header" />
      <div className="campus-site-fallback-nav" aria-hidden="true">
        <Link to="/campus" className="campus-fallback-brand">
          Вернатун · Кампус
        </Link>
      </div>
      {children}
      <div id="site-footer" />
      {modals}
      <span
        className="sr-only"
        data-terms-hook={String(!!openTermsOfService)}
        data-privacy-hook={String(!!openPrivacyPolicy)}
      />
    </div>
  );
}

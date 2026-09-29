/*!
 * TF Widgets — Announcement Bar v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json
 * Полоса с сообщением сверху или снизу страницы: несколько сообщений по очереди или бегущая строка,
 * кнопка-ссылка, таймер обратного отсчёта, крестик «закрыть» (запоминается в браузере посетителя).
 * Все стили ограничены классом .bhw-ab, чтобы не спорить с другими виджетами и темой сайта.
 */
(function () {
    'use strict';
    var VERSION = '1.0.0';
    var LOG = '[TFW Bar]';
    // Где работает живое превью BHWAnnouncementBar.render() (конфигуратор на сайте)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];

    var ICONS = {
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
        prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg>',
        next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 18.6 10 20l8-8-8-8-1.4 1.4 6.6 6.6z"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.2 5.2 11.8 6.6l4.4 4.4H4v2h12.2l-4.4 4.4 1.4 1.4L20 12z"/></svg>'
    };

    var inlineCSS = `
        .bhw-ab { font-family: var(--bhw-font, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif); -webkit-font-smoothing: antialiased; box-sizing: border-box;
            position: relative; z-index: 2147482980; display: block; width: 100%; margin: 0; padding: 0;
            background: var(--bhw-bg, #111); color: var(--bhw-text, #fff); font-size: var(--bhw-fs, 14px); line-height: 1.35; text-align: center;
            box-shadow: var(--bhw-shadow, none); }
        .bhw-ab *, .bhw-ab *::before, .bhw-ab *::after { box-sizing: border-box; }
        .bhw-ab.bhw-fixed { position: fixed; left: 0; right: 0; }
        .bhw-ab.bhw-at-top.bhw-fixed { top: 0; }
        .bhw-ab.bhw-at-bottom.bhw-fixed { bottom: 0; }
        .bhw-ab.bhw-inline { position: absolute; left: 0; right: 0; z-index: 3; }
        .bhw-ab.bhw-inline.bhw-at-top { top: 0; }
        .bhw-ab.bhw-inline.bhw-at-bottom { bottom: 0; }
        .bhw-ab.bhw-only-mobile, .bhw-ab.bhw-only-desktop { display: none; }
        @media (max-width: 767px) { .bhw-ab.bhw-only-mobile { display: block; } }
        @media (min-width: 768px) { .bhw-ab.bhw-only-desktop { display: block; } }
        .bhw-ab.bhw-gone { display: none !important; }
        .bhw-ab.bhw-enter { animation: bhw-ab-in .45s cubic-bezier(.2,.8,.2,1); }
        .bhw-ab.bhw-at-bottom.bhw-enter { animation-name: bhw-ab-in-b; }
        .bhw-ab.bhw-leaving { animation: bhw-ab-out .3s ease forwards; }

        .bhw-ab .bhw-ab-inner { position: relative; display: flex; align-items: center; justify-content: center; gap: 10px;
            min-height: var(--bhw-h, 44px); padding: var(--bhw-pad-y, 8px) 52px; max-width: 100%; }
        .bhw-ab.bhw-no-x.bhw-single .bhw-ab-inner { padding-left: 16px; padding-right: 16px; }
        .bhw-ab .bhw-ab-msgs { position: relative; display: grid; flex: 1 1 auto; min-width: 0; max-width: 1100px; }
        .bhw-ab .bhw-ab-msg { grid-area: 1 / 1; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px 12px;
            opacity: 0; visibility: hidden; transform: translateY(10px); transition: opacity .45s ease, transform .45s cubic-bezier(.2,.8,.2,1), visibility 0s .45s; }
        .bhw-ab .bhw-ab-msg.bhw-on { opacity: 1; visibility: visible; transform: none; transition: opacity .45s ease, transform .45s cubic-bezier(.2,.8,.2,1), visibility 0s; }
        .bhw-ab .bhw-ab-msg.bhw-out { transform: translateY(-10px); }
        .bhw-ab .bhw-ab-txt { font-weight: var(--bhw-fw, 600); letter-spacing: .005em; overflow-wrap: anywhere; }
        .bhw-ab a.bhw-ab-txt { text-decoration: none !important; }
        .bhw-ab a.bhw-ab-txt:hover { text-decoration: underline !important; text-underline-offset: 3px; }

        .bhw-ab .bhw-ab-btn { display: inline-flex; align-items: center; gap: 6px; flex: none; margin: 0; padding: .38em .95em; border: 0;
            border-radius: var(--bhw-btn-r, 999px); background: var(--bhw-btn-bg, #fff); color: var(--bhw-btn-text, #111);
            font: inherit; font-size: .9em; font-weight: 700; line-height: 1.2; white-space: nowrap; text-decoration: none !important; cursor: pointer;
            transition: transform .2s, filter .2s; }
        .bhw-ab .bhw-ab-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .bhw-ab .bhw-ab-btn svg { width: 1.05em; height: 1.05em; transition: transform .2s; }
        .bhw-ab .bhw-ab-btn:hover svg { transform: translateX(2px); }
        .bhw-ab.bhw-btn-link .bhw-ab-btn { padding: 0; background: none; color: inherit; border-radius: 0; text-decoration: underline !important; text-underline-offset: 3px; }
        .bhw-ab.bhw-btn-link .bhw-ab-btn svg { display: none; }

        /* таймер */
        .bhw-ab .bhw-ab-cd { display: inline-flex; align-items: center; gap: 6px; flex: none; white-space: nowrap; }
        .bhw-ab .bhw-ab-cd-l { opacity: .85; font-weight: 500; }
        .bhw-ab .bhw-ab-cd-t { display: inline-flex; gap: 3px; font-variant-numeric: tabular-nums; }
        .bhw-ab .bhw-ab-cd-t b { display: inline-flex; align-items: baseline; gap: 1px; min-width: 2.1em; justify-content: center; padding: .12em .38em; border-radius: 6px;
            background: var(--bhw-chip, rgba(255,255,255,.16)); font-weight: 800; }
        .bhw-ab .bhw-ab-cd-t b small { font-size: .7em; font-weight: 600; opacity: .75; }

        /* стрелки и крестик */
        .bhw-ab .bhw-ab-nav, .bhw-ab .bhw-ab-x { display: grid; place-items: center; width: 30px; height: 30px; margin: 0; padding: 0; flex: none;
            border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; opacity: .75; transition: opacity .2s, background .2s; box-shadow: none; }
        .bhw-ab .bhw-ab-nav:hover, .bhw-ab .bhw-ab-x:hover { opacity: 1; background: var(--bhw-chip, rgba(255,255,255,.16)); }
        .bhw-ab .bhw-ab-nav svg { width: 18px; height: 18px; }
        .bhw-ab .bhw-ab-x svg { width: 16px; height: 16px; }
        .bhw-ab .bhw-ab-x { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); }
        .bhw-ab .bhw-ab-nav { position: absolute; top: 50%; transform: translateY(-50%); }
        .bhw-ab .bhw-ab-prev { left: 10px; }
        .bhw-ab .bhw-ab-next { right: 44px; }
        .bhw-ab.bhw-no-x .bhw-ab-next { right: 10px; }
        .bhw-ab .bhw-ab-nav:focus-visible, .bhw-ab .bhw-ab-x:focus-visible, .bhw-ab .bhw-ab-btn:focus-visible, .bhw-ab a.bhw-ab-txt:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

        /* бегущая строка */
        .bhw-ab .bhw-ab-marquee { flex: 1 1 auto; min-width: 0; overflow: hidden;
            -webkit-mask: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent); mask: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent); }
        .bhw-ab .bhw-ab-track { display: flex; width: max-content; animation: bhw-ab-marq var(--bhw-marq-dur, 30s) linear infinite; }
        .bhw-ab .bhw-ab-marquee:hover .bhw-ab-track { animation-play-state: paused; }
        .bhw-ab .bhw-ab-group { display: flex; align-items: center; flex: none; }
        .bhw-ab .bhw-ab-group .bhw-ab-msg { position: static; opacity: 1; visibility: visible; transform: none; flex-wrap: nowrap; padding: 0 28px; white-space: nowrap; }
        .bhw-ab .bhw-ab-group .bhw-ab-msg::after { content: ''; width: 5px; height: 5px; margin-left: 28px; border-radius: 50%; background: currentColor; opacity: .45; flex: none; }
        .bhw-ab.bhw-marq .bhw-ab-inner { padding-left: 0; padding-right: 48px; }
        .bhw-ab.bhw-marq.bhw-no-x .bhw-ab-inner { padding-right: 0; }

        @keyframes bhw-ab-marq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes bhw-ab-in { from { transform: translateY(-100%); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes bhw-ab-in-b { from { transform: translateY(100%); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes bhw-ab-out { to { opacity: 0; transform: translateY(-40%); } }

        @media (max-width: 767px) {
            .bhw-ab { font-size: calc(var(--bhw-fs, 14px) * .93); }
            .bhw-ab .bhw-ab-inner { padding-left: 40px; padding-right: 40px; gap: 6px; }
            .bhw-ab .bhw-ab-prev { left: 4px; } .bhw-ab .bhw-ab-next { right: 34px; } .bhw-ab.bhw-no-x .bhw-ab-next { right: 4px; }
            .bhw-ab .bhw-ab-x { right: 4px; }
            .bhw-ab .bhw-ab-msg { gap: 4px 10px; }
            .bhw-ab .bhw-ab-group .bhw-ab-msg { padding: 0 18px; }
            .bhw-ab .bhw-ab-group .bhw-ab-msg::after { margin-left: 18px; }
            .bhw-ab.bhw-marq .bhw-ab-inner { padding-left: 0; padding-right: 36px; }
        }
        @media (prefers-reduced-motion: reduce) {
            .bhw-ab, .bhw-ab * { animation: none !important; transition: none !important; }
            .bhw-ab .bhw-ab-marquee { overflow-x: auto; }
        }

        /* защита от тем сайта, которые красят текст и ссылки через !important */
        .bhw-ab, .bhw-ab :where(*) { color: var(--bhw-text, #fff) !important; }
        .bhw-ab .bhw-ab-btn, .bhw-ab .bhw-ab-btn * { color: var(--bhw-btn-text, #111) !important; }
        .bhw-ab.bhw-btn-link .bhw-ab-btn, .bhw-ab.bhw-btn-link .bhw-ab-btn * { color: var(--bhw-text, #fff) !important; }
        .bhw-ab :where(p, span, b, a, button) { font-family: inherit !important; letter-spacing: inherit; text-transform: none; }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.announcementBar = window.BusinessHoursWidgets.announcementBar || {};

    // Живое превью для конфигуратора: BHWAnnouncementBar.render(container, config) -> { update, destroy }
    var api = window.BHWAnnouncementBar = window.BHWAnnouncementBar || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.checkAccess = bhwCheckAccess;
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._bhwAbDestroy) container._bhwAbDestroy();
        var cls = container.__bhwAbClass || (container.__bhwAbClass = 'bhw-ab-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var keep = widget ? widget.index() : 0;
                if (widget) widget.destroy();
                widget = mountWidget(normalizeConfig(cfg || {}), cls, 'preview', { inline: container, start: keep });
                ctrl.el = widget.root;
            },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._bhwAbDestroy = null; }
        };
        ctrl.update(config);
        container._bhwAbDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    if (wasClosed(clientId, cfg)) { if (debug) console.log(LOG, 'closed by the visitor earlier'); return; }
                    if (cfg.countdown.enabled && cfg.countdown.hideAfterEnd && timeLeft(cfg.countdown.endsAt) <= 0) { if (debug) console.log(LOG, 'countdown has ended'); return; }
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'bhw-ab-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, {});
                        window.BusinessHoursWidgets.announcementBar[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-announcement-bar-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-announcement-bar-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#bhw-ab-local-config');
            if (!el) return Promise.reject(new Error('#bhw-ab-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            position: 'top',                // top | bottom
            sticky: false,                  // top: true = всегда виден при прокрутке; bottom всегда закреплён
            showOn: 'all',                  // all | desktop | mobile
            animation: 'rotate',            // rotate — сообщения по очереди; marquee — бегущая строка; none — только первое
            interval: 5,                    // секунд на одно сообщение (rotate)
            speed: 60,                      // скорость бегущей строки, px/сек
            messages: [
                { text: 'Free shipping on orders over $50', linkText: 'Shop now', url: '' }
            ],
            newTab: false,
            buttonStyle: 'button',          // button | link
            countdown: { enabled: false, endsAt: '', label: 'Ends in', hideAfterEnd: true },
            closable: true,
            closeDays: 1,                   // через сколько дней снова показать после «закрыть» (0 — при следующем открытии страницы)
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: {
                    background: '#111111',
                    text: '#ffffff',
                    buttonBackground: '#25d366',
                    buttonText: '#052e16'
                },
                sizes: { fontSize: 14, height: 44, buttonRadius: 999, fontWeight: 600 },
                shadow: 'none'
            }
        };
    }

    function normalizeConfig(raw) {
        raw = raw || {};
        var cfg = mergeDeep(getDefaultConfig(), raw);
        cfg.messages = (Array.isArray(raw.messages) ? raw.messages : cfg.messages)
            .filter(function (m) { return m && typeof m === 'object' && String(m.text || '').trim(); })
            .slice(0, 5);
        if (!cfg.messages.length && typeof raw.text === 'string') cfg.messages = [{ text: raw.text, linkText: raw.linkText || '', url: raw.url || '' }];
        cfg.position = cfg.position === 'bottom' ? 'bottom' : 'top';
        cfg.animation = ['rotate', 'marquee', 'none'].indexOf(cfg.animation) >= 0 ? cfg.animation : 'rotate';
        cfg.interval = Math.min(30, Math.max(2, num(cfg.interval, 5)));
        cfg.speed = Math.min(200, Math.max(15, num(cfg.speed, 60)));
        cfg.closeDays = Math.min(365, Math.max(0, num(cfg.closeDays, 1)));
        cfg.countdown = mergeDeep(getDefaultConfig().countdown, isObj(raw.countdown) ? raw.countdown : {});
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function safeUrl(url) {
        var u = String(url || '').trim();
        if (!u) return '';
        if (/^https?:/i.test(u) || /^\/(?!\/)/.test(u) || /^#[\w-]*$/.test(u)) return u;
        if (/^(mailto|tel):/i.test(u)) return u;
        if (/^[\w.-]+\.[a-z]{2,}(\/|$|\?)/i.test(u)) return 'https://' + u;
        return '';
    }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* «закрыл» — помним в браузере посетителя */
    function closeKey(id) { return 'tfw_ab_closed_' + id; }
    function wasClosed(id, cfg) {
        if (!cfg.closable) return false;
        try {
            var t = Number(localStorage.getItem(closeKey(id)) || 0);
            if (!t) return false;
            if (cfg.closeDays <= 0) { localStorage.removeItem(closeKey(id)); return false; }
            if (Date.now() - t < cfg.closeDays * 864e5) return true;
            localStorage.removeItem(closeKey(id));
        } catch (e) {}
        return false;
    }
    function rememberClosed(id) { try { localStorage.setItem(closeKey(id), String(Date.now())); } catch (e) {} }

    /* таймер */
    function timeLeft(endsAt) { var t = Date.parse(endsAt || ''); return isFinite(t) ? t - Date.now() : -1; }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function cdHtml(ms) {
        ms = Math.max(0, ms);
        var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
        return (d ? '<b>' + d + '<small>d</small></b>' : '') + '<b>' + pad(h) + '<small>h</small></b><b>' + pad(m) + '<small>m</small></b><b>' + pad(sec) + '<small>s</small></b>';
    }

    function applyCustomStyles(uniqueClass, style) {
        var id = 'bhw-ab-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = style || {}, c = s.colors || {}, z = s.sizes || {};
        var fs = Math.min(22, Math.max(11, num(z.fontSize, 14)));
        var h = Math.min(80, Math.max(32, num(z.height, 44)));
        var text = cssValue(c.text, '#ffffff');
        el.textContent = '.' + uniqueClass + '{' +
            '--bhw-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--bhw-bg:' + cssValue(c.background, '#111111') + ';' +
            '--bhw-text:' + text + ';' +
            '--bhw-btn-bg:' + cssValue(c.buttonBackground, '#ffffff') + ';' +
            '--bhw-btn-text:' + cssValue(c.buttonText, '#111111') + ';' +
            '--bhw-chip:color-mix(in srgb,' + text + ' 16%,transparent);' +
            '--bhw-fs:' + fs + 'px;' +
            '--bhw-fw:' + Math.min(800, Math.max(400, num(z.fontWeight, 600))) + ';' +
            '--bhw-h:' + h + 'px;' +
            '--bhw-pad-y:' + Math.max(4, Math.round((h - 28) / 2)) + 'px;' +
            '--bhw-btn-r:' + Math.min(999, Math.max(0, num(z.buttonRadius, 999))) + 'px;' +
            '--bhw-shadow:' + cssValue(s.shadow, 'none') + ';' +
            '}';
        return id;
    }

    function msgHtml(m, cfg, withTimer) {
        var url = safeUrl(m.url);
        var target = url && cfg.newTab && /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
        var txt = escapeHtml(m.text);
        var btn = String(m.linkText || '').trim();
        var html = '';
        if (url && !btn) html += '<a class="bhw-ab-txt" href="' + escapeHtml(url) + '"' + target + '>' + txt + '</a>';
        else html += '<span class="bhw-ab-txt">' + txt + '</span>';
        if (withTimer) html += '<span class="bhw-ab-cd" role="timer" aria-live="off">' + (cfg.countdown.label ? '<span class="bhw-ab-cd-l">' + escapeHtml(cfg.countdown.label) + '</span>' : '') + '<span class="bhw-ab-cd-t"></span></span>';
        if (url && btn) html += '<a class="bhw-ab-btn" href="' + escapeHtml(url) + '"' + target + '><span>' + escapeHtml(btn) + '</span>' + ICONS.arrow + '</a>';
        return html;
    }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var inline = opts.inline || null;
        var styleId = applyCustomStyles(uniqueClass, cfg.style);
        var msgs = cfg.messages.length ? cfg.messages : [{ text: ' ' }];
        var marquee = cfg.animation === 'marquee';
        var rotate = cfg.animation === 'rotate' && msgs.length > 1;
        if (cfg.animation === 'none') msgs = msgs.slice(0, 1);
        var hasTimer = !!(cfg.countdown.enabled && isFinite(Date.parse(cfg.countdown.endsAt || '')));
        var top = cfg.position !== 'bottom';
        var fixed = !inline && (!top || cfg.sticky);

        var root = document.createElement('div');
        root.id = 'tfw-announcement-bar-' + id;
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Announcement');
        root.className = 'bhw-ab ' + uniqueClass + ' bhw-at-' + (top ? 'top' : 'bottom') +
            (inline ? ' bhw-inline' : fixed ? ' bhw-fixed' : '') +
            (cfg.showOn === 'mobile' && !inline ? ' bhw-only-mobile' : cfg.showOn === 'desktop' && !inline ? ' bhw-only-desktop' : '') +
            (cfg.closable ? '' : ' bhw-no-x') + (msgs.length < 2 || marquee ? ' bhw-single' : '') + (marquee ? ' bhw-marq' : '') +
            (cfg.buttonStyle === 'link' ? ' bhw-btn-link' : '') + (inline ? '' : ' bhw-enter');

        var body;
        if (marquee) {
            var group = msgs.map(function (m, i) { return '<div class="bhw-ab-msg">' + msgHtml(m, cfg, hasTimer && i === 0) + '</div>'; }).join('');
            body = '<div class="bhw-ab-marquee"><div class="bhw-ab-track"><div class="bhw-ab-group">' + group + '</div><div class="bhw-ab-group" aria-hidden="true">' + group + '</div></div></div>';
        } else {
            body = '<div class="bhw-ab-msgs" aria-live="polite">' + msgs.map(function (m, i) {
                return '<div class="bhw-ab-msg' + (i === 0 ? ' bhw-on' : '') + '"' + (i ? ' aria-hidden="true"' : '') + '>' + msgHtml(m, cfg, hasTimer) + '</div>';
            }).join('') + '</div>';
        }
        root.innerHTML = '<div class="bhw-ab-inner">' +
            (rotate ? '<button class="bhw-ab-nav bhw-ab-prev" type="button" aria-label="Previous message">' + ICONS.prev + '</button>' : '') +
            body +
            (rotate ? '<button class="bhw-ab-nav bhw-ab-next" type="button" aria-label="Next message">' + ICONS.next + '</button>' : '') +
            (cfg.closable ? '<button class="bhw-ab-x" type="button" aria-label="Close announcement">' + ICONS.close + '</button>' : '') +
        '</div>';

        var spacer = null;
        if (inline) inline.appendChild(root);
        else if (top) document.body.insertBefore(root, document.body.firstChild);
        else document.body.appendChild(root);
        if (fixed) {
            // место под закреплённой полосой, чтобы она не закрывала начало/конец страницы
            spacer = document.createElement('div');
            spacer.className = 'bhw-ab-spacer';
            spacer.setAttribute('aria-hidden', 'true');
            spacer.style.cssText = 'display:block;width:100%;height:0;margin:0;padding:0;pointer-events:none';
            if (top) document.body.insertBefore(spacer, root.nextSibling); else document.body.appendChild(spacer);
        }

        var cleanups = [], timers = [];
        function on(t, e, h, o) { t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }
        function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
        function syncSpacer() {
            if (!spacer) return;
            var shown = getComputedStyle(root).display !== 'none';
            spacer.style.height = shown ? root.offsetHeight + 'px' : '0px';
        }

        /* по очереди */
        var cur = 0, items = [].slice.call(root.querySelectorAll('.bhw-ab-msgs > .bhw-ab-msg')), rotTimer = 0;
        function show(i) {
            if (!items.length) return;
            var prev = items[cur];
            cur = (i + items.length) % items.length;
            items.forEach(function (el, k) {
                el.classList.toggle('bhw-on', k === cur);
                el.classList.toggle('bhw-out', el === prev && k !== cur);
                if (k === cur) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
            });
        }
        function restart() { if (!rotate) return; clearInterval(rotTimer); rotTimer = every(function () { if (!paused) show(cur + 1); }, cfg.interval * 1000); }
        var paused = false;
        if (rotate) {
            if (opts.start) show(opts.start);
            on(root.querySelector('.bhw-ab-prev'), 'click', function () { show(cur - 1); restart(); });
            on(root.querySelector('.bhw-ab-next'), 'click', function () { show(cur + 1); restart(); });
            on(root, 'mouseenter', function () { paused = true; });
            on(root, 'mouseleave', function () { paused = false; });
            on(root, 'focusin', function () { paused = true; });
            on(root, 'focusout', function () { paused = false; });
            restart();
        }

        /* бегущая строка: скорость одинаковая при любой длине текста */
        function marq() {
            var g = root.querySelector('.bhw-ab-group'); if (!g) return;
            root.style.setProperty('--bhw-marq-dur', Math.max(6, g.offsetWidth / cfg.speed).toFixed(2) + 's');
        }

        /* таймер */
        var cds = [].slice.call(root.querySelectorAll('.bhw-ab-cd-t'));
        function tick() {
            var left = timeLeft(cfg.countdown.endsAt);
            if (left <= 0 && cfg.countdown.hideAfterEnd && !inline) { widget.hide(); return; }
            var html = cdHtml(left);
            cds.forEach(function (el) { if (el.innerHTML !== html) el.innerHTML = html; });
        }

        var widget = {
            root: root, config: cfg, id: id,
            index: function () { return cur; },
            next: function () { show(cur + 1); },
            hide: function () {
                root.classList.add('bhw-gone');
                syncSpacer();
            },
            close: function () {
                if (!inline) rememberClosed(id);
                root.classList.remove('bhw-enter');
                root.classList.add('bhw-leaving');
                setTimeout(function () {
                    root.classList.remove('bhw-leaving');
                    widget.hide();
                    if (inline) setTimeout(function () { root.classList.remove('bhw-gone'); root.classList.add('bhw-enter'); }, 900); // превью: полоса возвращается
                }, 280);
            },
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                timers.forEach(clearInterval);
                root.remove(); if (spacer) spacer.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };
        if (cfg.closable) on(root.querySelector('.bhw-ab-x'), 'click', function () { widget.close(); });
        if (hasTimer) { tick(); every(tick, 1000); }
        if (marquee) { marq(); setTimeout(marq, 300); if (document.fonts && document.fonts.ready) document.fonts.ready.then(marq); }
        if (spacer) { syncSpacer(); setTimeout(syncSpacer, 300); on(window, 'resize', syncSpacer); }
        if (marquee) on(window, 'resize', marq);
        return widget;
    }
})();

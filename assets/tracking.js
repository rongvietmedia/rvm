// ============================================================
//  ĐO LƯỜNG RVM (GA4 + Meta Pixel) — 17/11/2026
//  Bật bằng cách điền mã trong config.js:  ga4: 'G-XXXXXXX', pixel: '1234567890'
//  Để trống = KHÔNG tải gì, KHÔNG gửi dữ liệu đi đâu.
//  Không gửi email, số điện thoại, tài khoản của khách — chỉ gửi tên sự kiện, gói, số tiền.
//
//  Sự kiện phễu:
//    view (tự động)  → download_win / download_mac → contact_zalo
//    → choose_plan (mở form mua) → begin_checkout (hiện QR) → purchase (đã thanh toán)
//  UTM (utm_source/medium/campaign) lần chạm ĐẦU được giữ 60 ngày, gắn kèm mọi sự kiện.
// ============================================================
(function () {
  const C = window.RVM || {};
  const GA = (C.ga4 || '').trim();
  const PX = (C.pixel || '').trim();

  // ---- UTM lần chạm đầu ----
  const K = 'rvm_utm';
  let utm = null;
  try {
    const q = new URLSearchParams(location.search);
    const now = { source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign'), content: q.get('utm_content') };
    const old = JSON.parse(localStorage.getItem(K) || 'null');
    if (old && Date.now() - old.ts < 60 * 864e5) utm = old;
    else if (now.source) { utm = Object.assign({ ts: Date.now() }, now); localStorage.setItem(K, JSON.stringify(utm)); }
  } catch (_) {}
  const utmParams = () => (utm ? { first_source: utm.source || '', first_medium: utm.medium || '', first_campaign: utm.campaign || '' } : {});

  if (!GA && !PX) { window.RVMTrack = function () {}; return; }

  // ---- Nạp thư viện ----
  if (GA) {
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', GA, { anonymize_ip: true });
  }
  if (PX) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PX); fbq('track', 'PageView');
  }

  // Tên sự kiện Meta chuẩn tương ứng
  const FB = { download_win: 'Lead', download_mac: 'Lead', contact_zalo: 'Contact', choose_plan: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase' };

  function track(name, p) {
    p = Object.assign({}, p || {}, utmParams());
    try { if (GA) gtag('event', name, p); } catch (_) {}
    try {
      if (PX) {
        const fp = { content_name: p.plan || name };
        if (p.value) { fp.value = p.value; fp.currency = 'VND'; }
        FB[name] ? fbq('track', FB[name], fp) : fbq('trackCustom', name, fp);
      }
    } catch (_) {}
  }
  window.RVMTrack = track;

  const num = (t) => Number(String(t || '').replace(/[^\d]/g, '')) || 0;

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a,button'); if (!a) return;
    if (a.matches('[data-mac-arm]')) track('download_mac');
    else if (a.matches('[data-download]')) track(a.getAttribute('href') === '#mac' ? 'download_mac' : 'download_win');
    else if (a.matches('[data-zalo]') || /zalo\.me/.test(a.href || '')) track('contact_zalo');
    else if (a.dataset && a.dataset.open === 'order') track('choose_plan', { plan: a.dataset.plan || (a.dataset.mode === 'renew' ? 'renew' : ''), machines: Number(a.dataset.mach || 1) });
  }, true);

  // Form mua trên index.html: #st-qr hiện = đã tạo mã QR; #st-done hiện = đã thanh toán
  document.addEventListener('DOMContentLoaded', () => {
    const qr = document.getElementById('st-qr'), done = document.getElementById('st-done');
    if (!qr || !done) return;
    let lastQR = '', lastDone = '';
    new MutationObserver(() => {
      const code = (document.getElementById('qr-code') || {}).textContent || '';
      const value = num((document.getElementById('qr-amt') || {}).textContent);
      if (!qr.hidden && code && code !== lastQR) { lastQR = code; track('begin_checkout', { value, currency: 'VND' }); }
      if (!done.hidden && code !== lastDone) { lastDone = code; track('purchase', { value, currency: 'VND', transaction_id: code.replace(/^SEVQR\s*/, '') }); }
    }).observe(document.getElementById('order') || document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
  });
})();

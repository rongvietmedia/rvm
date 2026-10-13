// Tiện ích dùng chung cho trang RVM: liên hệ, ghi nhận mã giới thiệu, gọi API, modal, toast.
(function () {
  const C = window.RVM || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };

  const money = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(action, data) {
    if (!C.api) { const e = new Error('Hệ thống đăng ký đang được cập nhật.'); e.noApi = true; throw e; }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(C.api, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // tránh preflight CORS với Apps Script
        body: JSON.stringify(Object.assign({ action }, data || {})),
        signal: ctrl.signal
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Có lỗi, vui lòng thử lại.');
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Mạng chậm, vui lòng thử lại.');
      if (e instanceof TypeError) throw new Error('Không kết nối được máy chủ, vui lòng thử lại.');
      throw e;
    } finally { clearTimeout(t); }
  }

  // ---- Mã giới thiệu: người giới thiệu ĐẦU TIÊN được giữ trong refDays ngày ----
  const REF_KEY = 'rvm_ref';
  const okCode = (c) => /^[A-Z0-9]{4,12}$/.test(c);
  function getRef() {
    const r = store.get(REF_KEY);
    if (!r || !okCode(r.code)) return '';
    if (Date.now() - r.ts > (C.refDays || 60) * 864e5) { store.del(REF_KEY); return ''; }
    return r.code;
  }
  function captureRef() {
    let code = '';
    try { code = (new URLSearchParams(location.search).get('ref') || '').trim().toUpperCase(); } catch (_) {}
    if (!okCode(code)) return;
    const had = getRef();
    if (!had) store.set(REF_KEY, { code, ts: Date.now() });
    // đếm 1 lượt click / mã / ngày / trình duyệt
    const day = new Date().toISOString().slice(0, 10);
    const ck = 'rvm_click_' + code;
    if (store.get(ck) === day || !C.api) return;
    store.set(ck, day);
    api('click', { code, page: location.pathname.split('/').pop() || 'index' })
      .then((j) => { if (j.valid === false && !had && getRef() === code) store.del(REF_KEY); })
      .catch(() => {});
  }

  // ---- Liên hệ & tải xuống ----
  function fillContacts() {
    $$('[data-zalo]').forEach((a) => { a.href = C.zalo; a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-tele]').forEach((a) => { a.href = C.telegram; a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-tel]').forEach((a) => { a.href = 'tel:' + String(C.hotline).replace(/\s/g, ''); });
    $$('[data-hotline]').forEach((el) => { el.textContent = C.hotline; });
    $$('[data-download]').forEach((a) => { a.href = C.download; });
    $$('[data-version]').forEach((el) => { el.textContent = C.version; });
    if (C.plans && C.plans.length) { const mp = money(Math.min(...C.plans.map((p) => p.price))); $$('[data-minprice]').forEach((el) => { el.textContent = mp; }); }
    $$('[data-commission]').forEach((el) => { el.textContent = C.commission + '%'; });
    $$('[data-refdays]').forEach((el) => { el.textContent = C.refDays; });
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  // ---- Modal ----
  function openModal(id) { const m = document.getElementById(id); if (!m) return; m.classList.add('on'); document.body.style.overflow = 'hidden'; const f = $('input:not([type=hidden]):not(.hp),select', m); f && setTimeout(() => f.focus(), 50); }
  function closeModal(m) { m.classList.remove('on'); document.body.style.overflow = ''; }

  // ---- Toast / copy ----
  let tt;
  function toast(t) { let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); } el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2200); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (_) { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); }
    toast('Đã sao chép');
  }

  function showMsg(el, kind, html) { el.className = 'msg on ' + kind; el.innerHTML = html; }
  function contactHtml() { return `Nhắn <a href="${esc(C.zalo)}" target="_blank" rel="noopener"><b>Zalo</b></a> hoặc gọi <a href="tel:${esc(String(C.hotline).replace(/\s/g, ''))}"><b>${esc(C.hotline)}</b></a> để được hỗ trợ ngay.`; }

  document.addEventListener('DOMContentLoaded', () => {
    fillContacts();
    captureRef();

    const nav = $('.nav');
    $('.menu-btn') && $('.menu-btn').addEventListener('click', () => nav.classList.toggle('open'));
    $$('.nav .links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) { e.preventDefault(); openModal(o.dataset.open); document.dispatchEvent(new CustomEvent('rvm:open', { detail: o })); }
      const c = e.target.closest('[data-close]');
      if (c) closeModal(c.closest('.modal'));
      if (e.target.classList && e.target.classList.contains('modal')) closeModal(e.target);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal.on').forEach(closeModal); });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12 });
      $$('.reveal').forEach((el) => io.observe(el));
    } else $$('.reveal').forEach((el) => el.classList.add('in'));
  });

  window.RVMUI = { $, $$, api, getRef, money, esc, toast, copy, openModal, closeModal, showMsg, contactHtml, store };
})();

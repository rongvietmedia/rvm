/* RVM — khung chat AI 24/7 góc phải dưới. Chỉ chạy khi config.js có chatApi. */
(function () {
  var C = window.RVM || {};
  var API = String(C.chatApi || '').replace(/\/+$/, '');
  if (!API) return;

  var sid;
  try { sid = localStorage.getItem('rvm_chat_sid'); } catch (_) {}
  if (!sid || sid.length < 12) {
    sid = (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/g, '').slice(0, 32);
    try { localStorage.setItem('rvm_chat_sid', sid); } catch (_) {}
  }
  var log = [];
  try { log = JSON.parse(sessionStorage.getItem('rvm_chat_log') || '[]'); } catch (_) {}

  var css = '#rvc-b{position:fixed;right:18px;bottom:18px;z-index:9998;width:58px;height:58px;border-radius:50%;border:0;background:#e11d2e;color:#fff;font-size:26px;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}' +
    '#rvc-w{position:fixed;right:18px;bottom:88px;z-index:9999;width:min(370px,calc(100vw - 24px));height:min(540px,calc(100vh - 110px));background:#fff;color:#111;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    '#rvc-w.on{display:flex}#rvc-h{background:#111;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px}#rvc-h b{flex:1}#rvc-h button{background:none;border:0;color:#fff;font-size:20px;cursor:pointer}' +
    '#rvc-m{flex:1;overflow:auto;padding:12px;background:#f5f5f7}.rvc-x{max-width:85%;margin:6px 0;padding:8px 11px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}' +
    '.rvc-u{margin-left:auto;background:#e11d2e;color:#fff;border-bottom-right-radius:4px}.rvc-a{background:#fff;border:1px solid #e5e5e5;border-bottom-left-radius:4px}.rvc-a a{color:#c0121f}' +
    '#rvc-q{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;background:#f5f5f7}#rvc-q button{border:1px solid #ddd;background:#fff;border-radius:999px;padding:5px 10px;font-size:13px;cursor:pointer}' +
    '#rvc-f{display:flex;border-top:1px solid #eee}#rvc-i{flex:1;border:0;padding:12px;font:inherit;outline:none;resize:none;height:46px}#rvc-s{border:0;background:#e11d2e;color:#fff;padding:0 16px;font-weight:600;cursor:pointer}#rvc-n{font-size:11px;color:#888;text-align:center;padding:4px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var b = document.createElement('button'); b.id = 'rvc-b'; b.setAttribute('aria-label', 'Chat với RVM'); b.textContent = '💬';
  var w = document.createElement('div'); w.id = 'rvc-w'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Chat tư vấn RVM Login');
  w.innerHTML = '<div id="rvc-h"><b>Trợ lý RVM · trả lời 24/7</b><button id="rvc-c" aria-label="Đóng">×</button></div><div id="rvc-m"></div>' +
    '<div id="rvc-q"><button>Bảng giá</button><button>Dùng thử 7 ngày</button><button>Dùng trên Mac?</button><button>Mua cho đội</button></div>' +
    '<div id="rvc-f"><textarea id="rvc-i" placeholder="Nhập câu hỏi…" maxlength="1000"></textarea><button id="rvc-s">Gửi</button></div><div id="rvc-n">Trợ lý tự động — không bao giờ hỏi mật khẩu của bạn</div>';
  document.body.appendChild(b); document.body.appendChild(w);
  var m = w.querySelector('#rvc-m'), inp = w.querySelector('#rvc-i'), busy = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function linkify(s) { return esc(s).replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function add(role, text, save) {
    var d = document.createElement('div'); d.className = 'rvc-x ' + (role === 'u' ? 'rvc-u' : 'rvc-a');
    d.innerHTML = role === 'u' ? esc(text) : linkify(text); m.appendChild(d); m.scrollTop = m.scrollHeight;
    if (save) { log.push([role, text]); log = log.slice(-30); try { sessionStorage.setItem('rvm_chat_log', JSON.stringify(log)); } catch (_) {} }
    return d;
  }
  if (log.length) log.forEach(function (x) { add(x[0], x[1]); });
  else add('a', 'Chào bạn 👋 Em là trợ lý RVM Login. Bạn đang làm bao nhiêu kênh YouTube, một mình hay có đội? Em tư vấn gói phù hợp nhé.');

  function send(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    busy = true; add('u', text, true); inp.value = '';
    var wait = add('a', '…');
    try { if (window.RVMTrack) window.RVMTrack('chat_message'); } catch (_) {}
    fetch(API + '/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sid: sid, text: text }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { wait.remove(); add('a', d && d.ok ? d.reply : (d && d.error) || 'Có lỗi, bạn thử lại hoặc nhắn Zalo ' + (C.hotline || ''), true); })
      .catch(function () { wait.remove(); add('a', 'Mất kết nối. Bạn nhắn Zalo ' + (C.hotline || '0918 637 699') + ' giúp em nhé.', true); })
      .then(function () { busy = false; });
  }
  b.onclick = function () { w.classList.toggle('on'); if (w.classList.contains('on')) { inp.focus(); try { if (window.RVMTrack) window.RVMTrack('chat_open'); } catch (_) {} } };
  w.querySelector('#rvc-c').onclick = function () { w.classList.remove('on'); };
  w.querySelector('#rvc-s').onclick = function () { send(inp.value); };
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(inp.value); } });
  [].forEach.call(w.querySelectorAll('#rvc-q button'), function (x) { x.onclick = function () { send(x.textContent); }; });
})();

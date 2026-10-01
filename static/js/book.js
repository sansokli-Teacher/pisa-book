/* Web edition of the teacher guide: maths, the contents drawer, «on this page», reading settings
   (text size, page colour), search in the book, drawings opened large, and «continue reading». */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  // the browser may refuse storage (private window, blocked site data): the book works without it
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* not kept */ } },
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var article = $('article.page');
  var file = location.pathname.split('/').pop() || 'index.html';

  // ---- maths: the pages keep TeX between \( \) and \[ \]; KaTeX draws it
  if (window.renderMathInElement) {
    window.renderMathInElement($('#content') || body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
      strict: 'ignore',
    });
  }

  // ---- the contents: a drawer on small screens and on the home page
  var menuBtn = $('#menu-btn'), side = $('#side'), scrim = $('#scrim');
  function menu(open) {
    body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn && side) {
    menuBtn.addEventListener('click', function () { menu(!body.classList.contains('menu-open')); });
    side.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
    if (scrim) scrim.addEventListener('click', function () { menu(false); });
    var cur = $('li.cur', side);                           // the chapter being read is in view
    if (cur) side.scrollTop = Math.max(0, cur.offsetTop - side.clientHeight / 3);
  }

  // ---- reading settings: text size and page colour
  var aaBtn = $('#aa-btn'), aaPanel = $('#aa-panel');
  function pressed() {
    var size = root.getAttribute('data-size') || 'm';
    var theme = root.getAttribute('data-theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    $$('[data-size]', aaPanel).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-size') === size ? 'true' : 'false'); });
    $$('[data-theme]', aaPanel).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-theme') === theme ? 'true' : 'false'); });
  }
  function aa(open) {
    aaPanel.hidden = !open;
    aaBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (aaBtn && aaPanel) {
    pressed();
    aaBtn.addEventListener('click', function (e) { e.stopPropagation(); aa(aaPanel.hidden); });
    aaPanel.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-size')) { root.setAttribute('data-size', b.getAttribute('data-size')); store.set('bk-size', b.getAttribute('data-size')); }
      if (b.hasAttribute('data-theme')) { root.setAttribute('data-theme', b.getAttribute('data-theme')); store.set('bk-theme', b.getAttribute('data-theme')); }
      pressed();
    });
    doc.addEventListener('click', function (e) { if (!aaPanel.hidden && !e.target.closest('#aa-panel')) aa(false); });
  }

  // ---- «on this page», the section being read, and where to continue next time
  var heads = article ? $$('h2[id], h3[id]', article) : [];
  var otp = $('#otp'), otpList = $('#otp-list');
  var where = article ? article.getAttribute('data-where') : '';
  function remember(id, text) {
    if (!article) return;
    store.set('bk-last', JSON.stringify({ u: file + (id ? '#' + id : ''), t: where, h: text || '' }));
  }
  if (article) remember('', '');
  heads.forEach(function (h) {                             // a link to each section, shown on hover
    var a = doc.createElement('a');
    a.className = 'anchor'; a.href = '#' + h.id; a.textContent = '#';
    a.setAttribute('aria-label', 'តំណទៅផ្នែកនេះ');
    h.appendChild(a);
  });
  if (heads.length) {
    var otpLinks = {}, sideLinks = {}, parentOf = {}, lastH2 = '';
    heads.forEach(function (h) { if (h.tagName === 'H2') lastH2 = h.id; parentOf[h.id] = h.tagName === 'H2' ? h.id : lastH2; });
    if (otp && otpList && heads.length > 1) {
      // a long chapter shows its sub-sections only under the section being read
      if (heads.length > 14) otpList.className = 'fold';
      heads.forEach(function (h) {
        var li = doc.createElement('li'), a = doc.createElement('a');
        li.className = h.tagName === 'H3' ? 'l3' : 'l2';
        li.setAttribute('data-parent', parentOf[h.id]);
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/#$/, '').trim();
        li.appendChild(a); otpList.appendChild(li);
        otpLinks[h.id] = a;
      });
      otp.hidden = false;
    }
    if (side) $$('.sub a', side).forEach(function (a) { var hr = a.getAttribute('href'); if (hr.charAt(0) === '#') sideLinks[hr.slice(1)] = a; });
    var mark = function (id) {
      var k, h = doc.getElementById(id);
      for (k in otpLinks) {
        otpLinks[k].classList.toggle('here', k === id);
        otpLinks[k].parentNode.classList.toggle('open', parentOf[k] === parentOf[id]);
      }
      if (sideLinks[id]) for (k in sideLinks) sideLinks[k].classList.toggle('here', k === id);
      if (h) remember(id, h.textContent.replace(/#$/, '').trim());
    };
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
      }, { rootMargin: '-64px 0px -70% 0px' });
      heads.forEach(function (h) { obs.observe(h); });
    }
  }

  // ---- how far down the page, and back to the top
  var bar = $('#progress'), toTop = $('#to-top'), ticking = false;
  function scrolled() {
    ticking = false;
    var max = root.scrollHeight - window.innerHeight, y = window.pageYOffset || root.scrollTop;
    if (bar) bar.style.width = (article && max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
    if (toTop) toTop.hidden = y < 700;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(scrolled); } }, { passive: true });
  scrolled();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // ---- a drawing opened large, on the page
  var box = null;
  function closeBox() { if (box) { box.remove(); box = null; body.classList.remove('no-scroll'); } }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.fig-link');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    box = doc.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'រូបភាពពេញទំហំ');
    box.innerHTML = '<button class="icon-btn" type="button" aria-label="បិទ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img alt="" src="' + esc(a.getAttribute('href')) + '">';
    box.addEventListener('click', closeBox);
    body.appendChild(box);
    body.classList.add('no-scroll');
    $('button', box).focus();
  });

  // ---- search in the book (search.json is fetched the first time the box opens)
  var sBtn = $('#search-btn'), sBox = $('#search'), sIn = $('#search-in'), sOut = $('#search-out'), sClose = $('#search-close');
  var index = null, loading = false, hint = sOut ? sOut.innerHTML : '', timer = null;
  var norm = function (s) { return String(s).replace(/\u200b/g, '').toLowerCase(); };
  function load() {
    if (index || loading) return;
    loading = true;
    fetch('search.json').then(function (r) { return r.json(); }).then(function (list) {
      // a page's opening text (no heading of its own) answers to the page's title
      index = list.map(function (e) { e.lh = norm(e.h || e.p); e.lt = norm(e.t); return e; });
      loading = false;
      run();
    }).catch(function () { loading = false; sOut.innerHTML = '<p class="search-none">មិនអាចផ្ទុកទិន្នន័យស្វែងរកបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចសាកម្ដងទៀត។</p>'; });
  }
  function snippet(e, terms) {
    var at = -1, k;
    for (k = 0; k < terms.length && at < 0; k++) at = e.lt.indexOf(terms[k]);
    var from = Math.max(0, at - 50);
    // not in the middle of a Khmer syllable: move on past vowel signs and subscripts
    while (from > 0 && from < at && (/[\u17b4-\u17d3\u17dd]/.test(e.t.charAt(from)) || e.t.charAt(from - 1) === '\u17d2')) from++;
    var text = e.t.slice(from, from + 170);
    var out = esc((from > 0 ? '… ' : '') + text + (from + 170 < e.t.length ? ' …' : ''));
    terms.forEach(function (t) {
      if (!t) return;
      out = out.replace(new RegExp(esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), function (m) { return '<mark>' + m + '</mark>'; });
    });
    return out;
  }
  function run() {
    if (!sIn) return;
    var q = norm(sIn.value).trim();
    if (q.length < 2) { sOut.innerHTML = hint; return; }
    if (!index) { sOut.innerHTML = '<p class="search-hint">កំពុងផ្ទុក…</p>'; load(); return; }
    var terms = q.split(/\s+/), hits = [];
    index.forEach(function (e) {
      var score = 0, ok = terms.every(function (t) {
        var inHead = e.lh.indexOf(t) >= 0, inText = e.lt.indexOf(t) >= 0;
        score += (inHead ? 10 : 0) + (inText ? 1 + Math.min(4, e.lt.split(t).length - 2) : 0);
        return inHead || inText;
      });
      if (ok) hits.push([score, e]);
    });
    hits.sort(function (a, b) { return b[0] - a[0]; });
    if (!hits.length) { sOut.innerHTML = '<p class="search-none">រកមិនឃើញ «' + esc(sIn.value) + '» ទេ។ សាកពាក្យខ្លីជាងនេះ ឬពាក្យផ្សេង។</p>'; return; }
    var km = function (n) { return String(n).replace(/\d/g, function (d) { return '០១២៣៤៥៦៧៨៩'[d]; }); };
    sOut.innerHTML = '<p class="search-count">' + km(hits.length) + ' កន្លែង' + (hits.length > 40 ? ' (បង្ហាញ ៤០ ដំបូង)' : '') + '</p>' +
      hits.slice(0, 40).map(function (h) {
        var e = h[1];
        return '<a class="sr" href="' + esc(e.u) + '"><span class="sr-where">' + esc(e.p) + '</span>' +
          (e.h ? '<span class="sr-head">' + esc(e.h) + '</span>' : '') + '<span class="sr-snip">' + snippet(e, terms) + '</span></a>';
      }).join('');
  }
  function search(open) {
    if (!sBox) return;
    sBox.hidden = !open;
    body.classList.toggle('no-scroll', open);
    if (open) { load(); sIn.focus(); sIn.select(); } else if (sBtn) sBtn.focus();
  }
  if (sBtn && sBox) {
    sBtn.addEventListener('click', function () { search(true); });
    sClose.addEventListener('click', function () { search(false); });
    sBox.addEventListener('click', function (e) { if (e.target === sBox || e.target.closest('a.sr')) search(false); });
    sIn.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
    sBox.addEventListener('keydown', function (e) {       // arrows move through the results
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var list = $$('a.sr', sOut), i = list.indexOf(doc.activeElement);
      if (!list.length) return;
      e.preventDefault();
      if (e.key === 'ArrowDown') (list[i + 1] || list[0]).focus();
      else if (i <= 0) sIn.focus(); else list[i - 1].focus();
    });
  }

  doc.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape') {
      if (box) closeBox();
      else if (sBox && !sBox.hidden) search(false);
      else if (aaPanel && !aaPanel.hidden) aa(false);
      else menu(false);
    } else if (sBox && sBox.hidden && ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
      e.preventDefault();
      search(true);
    }
  });

  // ---- home: «continue reading» goes back to the last section read
  var resume = $('#resume');
  if (resume) {
    var last = null;
    try { last = JSON.parse(store.get('bk-last') || 'null'); } catch (e) { last = null; }
    if (last && last.u && /^[a-z0-9-]+\.html(#[\w-]+)?$/i.test(last.u)) {
      resume.href = last.u;
      resume.textContent = 'អានបន្ត៖ ' + (last.t || '') + ' ▶';
      resume.hidden = false;
    }
  }
})();

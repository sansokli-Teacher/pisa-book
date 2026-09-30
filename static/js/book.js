/* Web edition of the teacher guide: maths, menu, and the current section. */
(function () {
  'use strict';
  // maths: the pages keep TeX between \( \) and \[ \]; KaTeX draws it
  if (window.renderMathInElement) {
    window.renderMathInElement(document.getElementById('content') || document.body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
      strict: 'ignore',
    });
  }

  // side menu on small screens
  var btn = document.getElementById('menu-btn');
  var side = document.getElementById('side');
  if (btn && side) {
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    side.addEventListener('click', function (e) {
      if (e.target.closest('a')) document.body.classList.remove('menu-open');
    });
  }

  // highlight the section being read in the side menu
  var links = side ? Array.prototype.slice.call(side.querySelectorAll('.sub a')) : [];
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('here'); });
          byId[en.target.id].classList.add('here');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) obs.observe(el); });
  }
})();

(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ── 1. Navbar opacity on scroll ─────────────────────────── */

  function initNavScroll() {
    var nav = document.getElementById('navbar');
    if (!nav) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          nav.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── 2. Mobile menu ──────────────────────────────────────── */

  function initMobileMenu() {
    var btn   = $('.nav-hamburger');
    var links = $('.nav-links');
    if (!btn || !links) return;

    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      document.body.classList.toggle('nav-open', !expanded);
    });

    $$('a', links).forEach(function (link) {
      link.addEventListener('click', function () {
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* ── 3. Word-split stagger ───────────────────────────────── */

  function initWordSplit() {
    var STAGGER_MS = 75;

    $$('[data-split-words]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (word, i) {
        var span = document.createElement('span');
        span.className = 'word-span';
        span.textContent = word;
        span.style.setProperty('--word-delay', (i * STAGGER_MS) + 'ms');
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode('\u00a0'));
      });
    });

    // Elements in the hero are above-fold: trigger immediately after a brief paint delay
    // Elements below fold: use IntersectionObserver
    var heroWords = $$('.hero-content [data-split-words]');
    var belowFold = $$('[data-split-words]').filter(function (el) {
      return heroWords.indexOf(el) === -1;
    });

    // Hero: animate after 120ms (allow first paint)
    setTimeout(function () {
      heroWords.forEach(function (el) {
        $$('.word-span', el).forEach(function (span) {
          span.classList.add('visible');
        });
      });
    }, 120);

    // Below fold: use observer
    if (belowFold.length) {
      var wordObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          $$('.word-span', entry.target).forEach(function (span) {
            span.classList.add('visible');
          });
          wordObserver.unobserve(entry.target);
        });
      }, { threshold: 0.15 });

      belowFold.forEach(function (el) { wordObserver.observe(el); });
    }
  }

  /* ── 4. Scroll-reveal for .reveal-item ───────────────────── */

  function initRevealObserver() {
    var STAGGER_MS = 100;

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el       = entry.target;
        var siblings = $$('.reveal-item', el.parentElement);
        var index    = siblings.indexOf(el);
        el.style.transitionDelay = (index * STAGGER_MS) + 'ms';
        el.classList.add('revealed');
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    $$('.reveal-item').forEach(function (el) { revealObserver.observe(el); });
  }

  /* ── 5. Animated stat counters ───────────────────────────── */

  function initCounterObserver() {
    var DURATION_MS = 2200;

    function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }

    function animateCounter(el) {
      var target    = parseInt(el.dataset.target, 10);
      var suffix    = el.dataset.suffix || '';
      var isK       = suffix.indexOf('K') !== -1;
      var startTime = null;

      function tick(now) {
        if (!startTime) startTime = now;
        var progress = Math.min((now - startTime) / DURATION_MS, 1);
        var eased    = easeOutExpo(progress);
        var current  = Math.round(eased * target);
        el.textContent = isK ? Math.round(current / 1000) + suffix : current;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        $$('.stat-number', entry.target).forEach(animateCounter);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    var stats = document.getElementById('stats');
    if (stats) counterObserver.observe(stats);
  }

  /* ── 6. Floating particles ───────────────────────────────── */

  function initParticles() {
    var container = document.getElementById('particles');
    if (!container) return;

    // Skip if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var COUNT = window.innerWidth < 600 ? 18 : 32;
    var colors = [
      'rgba(168, 85, 247, 0.8)',
      'rgba(124, 58, 237, 0.7)',
      'rgba(224, 64, 251, 0.65)',
      'rgba(212, 184, 240, 0.5)'
    ];

    for (var i = 0; i < COUNT; i++) {
      (function () {
        var p    = document.createElement('div');
        var size = Math.random() * 3 + 1.5;   // 1.5 – 4.5 px
        var col  = colors[Math.floor(Math.random() * colors.length)];
        var dur  = Math.random() * 8 + 6;      // 6 – 14 s
        var del  = Math.random() * -14;         // stagger starts
        var left = Math.random() * 100;
        var bot  = Math.random() * 40;
        var driftX = (Math.random() - 0.5) * 60;

        p.className = 'particle';
        p.style.cssText = [
          'width:'             + size + 'px',
          'height:'            + size + 'px',
          'left:'              + left + '%',
          'bottom:'            + bot + '%',
          'background:'        + col,
          'box-shadow: 0 0 ' + (size * 2) + 'px ' + col,
          '--drift-x:'         + driftX + 'px',
          'animation-duration:'  + dur + 's',
          'animation-delay:'     + del + 's'
        ].join(';');

        container.appendChild(p);
      })();
    }
  }

  /* ── 7. Demo form handler ────────────────────────────────── */

  function initFormHandler() {
    var form = $('.demo-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameVal  = $('#f-name',  form).value.trim();
      var emailVal = $('#f-email', form).value.trim();
      var emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

      var prev = $('.form-error', form);
      if (prev) prev.remove();

      if (!nameVal || !emailOk) {
        var err = document.createElement('p');
        err.className = 'form-error';
        err.textContent = !nameVal
          ? 'Please enter your artist name.'
          : 'Please enter a valid email address.';
        form.prepend(err);
        return;
      }

      var btn = $('button[type="submit"]', form);
      btn.textContent = 'Sending\u2026';
      btn.disabled = true;

      setTimeout(function () {
        form.innerHTML = [
          '<div class="form-success">',
          '  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"',
          '    stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
          '    <polyline points="20 6 9 17 4 12"></polyline>',
          '  </svg>',
          '  <h3>Demo received.</h3>',
          '  <p>We listen to everything. You\u2019ll hear from us.</p>',
          '</div>'
        ].join('\n');
      }, 1200);
    });
  }

  /* ── Init ────────────────────────────────────────────────── */

  function init() {
    initNavScroll();
    initMobileMenu();
    initWordSplit();
    initRevealObserver();
    initCounterObserver();
    initParticles();
    initFormHandler();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* Coviello — interactions. Vanilla, no dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Header: solid once scrolled ---- */
  var header = document.querySelector('.site-header');
  var hero = document.querySelector('.hero, .banner');

  function onScroll() {
    if (!header) return;
    var threshold = hero ? Math.min(hero.offsetHeight - 90, window.innerHeight * 0.7) : 40;
    header.classList.toggle('is-solid', window.scrollY > threshold);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav ---- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('primary-nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) burger.click();
    });
  }

  /* ---- Opening: a warm veil that dissolves ---- */
  /* Reduced motion still gets an opening, it is just a cross-fade and it is
     over in about a third of the time — see the prefers-reduced-motion block
     in styles.css. Tearing the curtain out entirely meant anyone with the OS
     setting on, which on Windows includes battery saver, never saw it. */
  var curtain = document.querySelector('.curtain');
  if (curtain) {
    document.documentElement.classList.add('is-loading');
    window.setTimeout(function () {
      document.documentElement.classList.remove('is-loading');
      if (curtain.parentNode) curtain.parentNode.removeChild(curtain);
      /* Must outlast the veil fade itself: .4s delay + .55s duration = .95s
         under reduced motion, .85s + 1.25s under full motion. Cutting it
         early removes the element mid fade and the page pops in. */
    }, reduced ? 1000 : 2100);
  }

  /* ---- Scroll reveal ---- */
  var targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* ---- Menu section nav ---- */
  var menuNav = document.querySelector('.menu-nav');
  if (menuNav) {
    var buttons = menuNav.querySelectorAll('button');
    var courses = document.querySelectorAll('.course');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.dataset.target);
        if (!target) return;
        var offset = target.getBoundingClientRect().top + window.scrollY - 128;
        window.scrollTo({ top: offset, behavior: reduced ? 'auto' : 'smooth' });
      });
    });

    /* Highlight the course currently in view */
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          buttons.forEach(function (b) {
            var active = b.dataset.target === entry.target.id;
            b.classList.toggle('is-active', active);
            if (active) {
              var inner = menuNav.querySelector('.menu-nav__inner');
              var left = b.offsetLeft - inner.clientWidth / 2 + b.clientWidth / 2;
              inner.scrollTo({ left: left, behavior: reduced ? 'auto' : 'smooth' });
            }
          });
        });
      }, { rootMargin: '-130px 0px -65% 0px' });
      courses.forEach(function (c) { spy.observe(c); });
    }
  }

  /* ---- Ribbon marquee ----
     The old version animated to translateX(-50%), which is a percentage of
     the track's own width. On a narrow screen the track is barely wider than
     the viewport, so -50% is a tiny distance spread over the full duration
     and it reads as motionless. Measure the real pixel width instead and
     drive the duration from it, so the speed is identical on every device. */
  function initRibbon(ribbon) {
    var track = ribbon.querySelector('.ribbon__track');
    if (!track) return;

    if (!track._source) track._source = track.innerHTML;
    track.innerHTML = track._source;

    /* Repeat until one copy comfortably overflows the viewport */
    var guard = 0;
    while (track.scrollWidth < ribbon.clientWidth * 1.5 && guard < 10) {
      track.innerHTML += track._source;
      guard++;
    }

    var span = track.scrollWidth;          /* distance of one full cycle */
    if (!span) return;                     /* not laid out yet — try again later */
    track.innerHTML += track.innerHTML;    /* second copy makes it seamless */
    track.style.setProperty('--marquee-w', span + 'px');
    track.style.animationDuration = (span / 62) + 's';   /* 62px per second */
  }

  /* A ribbon inside a display:none ancestor measures 0px, which yields a 0px
     travel distance and a motionless marquee. Only initialise once the
     element actually has layout, and expose a hook so the router can call
     this again the moment a view becomes visible. */
  function initAllRibbons() {
    var list = document.querySelectorAll('.ribbon');
    for (var i = 0; i < list.length; i++) {
      if (list[i].clientWidth > 0) initRibbon(list[i]);
    }
  }
  window.covielloRibbons = initAllRibbons;
  initAllRibbons();

  var reflow;
  window.addEventListener('resize', function () {
    clearTimeout(reflow);
    reflow = setTimeout(initAllRibbons, 250);
  });

  /* ---- Year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

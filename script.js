document.addEventListener('DOMContentLoaded', function() {

  const isMobile = () => window.innerWidth <= 640;

  /* ---- GRID DRAW-IN ---- */
  function buildGrid(onComplete) {
    const overlay = document.getElementById('gridOverlay');
    const cols = Math.ceil(window.innerWidth / 40) + 1;
    const rows = Math.ceil(window.innerHeight / 40) + 1;
    overlay.innerHTML = '';

    // Build vertical lines
    for (let i = 0; i <= cols; i++) {
      const v = document.createElement('div');
      v.className = 'grid-v';
      v.style.left = (i * 40) + 'px';
      overlay.appendChild(v);
    }
    // Build horizontal lines
    for (let i = 0; i <= rows; i++) {
      const h = document.createElement('div');
      h.className = 'grid-h';
      h.style.top = (i * 40) + 'px';
      overlay.appendChild(h);
    }

    // Step 1: Draw verticals with stagger (each column slightly delayed)
    const vLines = overlay.querySelectorAll('.grid-v');
    vLines.forEach((el, i) => {
      setTimeout(() => el.classList.add('drawn'), 80 + i * 10);
    });

    // Step 2: Vertical shine sweep — wider, slower
    const shineV = document.createElement('div');
    shineV.className = 'grid-shine grid-shine-v';
    document.body.appendChild(shineV);
    setTimeout(() => shineV.remove(), 1200);

    // Step 3: Draw horizontals after verticals mostly done
    const hLines = overlay.querySelectorAll('.grid-h');
    const hDelay = 80 + vLines.length * 10 + 100;
    hLines.forEach((el, i) => {
      setTimeout(() => el.classList.add('drawn'), hDelay + i * 8);
    });

    // Step 4: Horizontal shine sweep
    setTimeout(() => {
      const shineH = document.createElement('div');
      shineH.className = 'grid-shine grid-shine-h';
      document.body.appendChild(shineH);
      setTimeout(() => shineH.remove(), 1000);
    }, hDelay + 100);

    // Fire callback once the last horizontal line's transition completes
    if (onComplete) {
      const gridDone = hDelay + (hLines.length - 1) * 8 + 1420;
      setTimeout(onComplete, gridDone);
    }
  }

  /* ---- HERO SEQUENCE ---- */
  const heroName = document.getElementById('heroName');
  const navLogoName = document.getElementById('navLogoName');
  const heroTagline = document.getElementById('heroTagline');
  const heroWorkLine = document.getElementById('heroWorkLine');
  const heroInputArea = document.getElementById('heroInputArea');
  const taglineText = 'Designing the AI future before it designs us.';

  const NAV_H = 52;
  const SCROLL_DIST = 280;

  function easeInOut(t) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  function lerp(a,b,t) { return a+(b-a)*t; }
  function clamp(v,lo,hi) { return Math.max(lo,Math.min(hi,v)); }

  function positionName() {
    // On mobile, keep hero-name as normal in-flow text — skip fixed animation
    if (isMobile()) {
      heroName.style.position = 'static';
      heroName.style.transform = 'none';
      heroName.style.fontSize = '';
      heroName.style.top = '';
      heroName.style.left = '';
      heroName.style.opacity = heroName.classList.contains('show') ? '1' : '0';
      if (navLogoName) navLogoName.style.opacity = '1'; // always visible in nav on mobile
      return;
    }

    const raw = clamp(window.scrollY / SCROLL_DIST, 0, 1);
    const t = easeInOut(raw);
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Font size: big in hero → 15px in nav
    const heroSize = Math.min(140, Math.max(80, vw * 0.12));
    const navSize = 15;
    const fontSize = lerp(heroSize, navSize, t);
    heroName.style.fontSize = fontSize + 'px';
    heroName.style.letterSpacing = lerp(-0.03, -0.01, t) + 'em';

    // Position: hero center → nav center
    const heroCenterY = vh * 0.28;
    const navCenterY = NAV_H / 2;
    const top = lerp(heroCenterY, navCenterY, t);

    heroName.style.top = top + 'px';
    heroName.style.left = (vw / 2) + 'px';
    heroName.style.transform = 'translate(-50%, -50%)';
    heroName.style.zIndex = t > 0.95 ? '99' : '102';

    // Floating name fades out as it lands; nav static name fades in to replace it
    const floatOpacity = t > 0.85 ? lerp(1, 0, (t - 0.85) / 0.15) : 1;
    const navOpacity   = t > 0.85 ? lerp(0, 1, (t - 0.85) / 0.15) : 0;
    heroName.style.opacity = floatOpacity;
    if (navLogoName) navLogoName.style.opacity = navOpacity;
  }

  // Clare Lee fades in as the grid starts drawing
  heroName.classList.add('show');
  positionName();
  if (isMobile() && navLogoName) navLogoName.style.opacity = '1';
  buildGrid(() => {
    // After grid completes, start tagline and the rest of the sequence
    setTimeout(() => {
      heroTagline.classList.add('show');
      typeWriter(heroTagline, taglineText, 32, () => {
        heroWorkLine.classList.add('show');
        setTimeout(() => {
          setInputBottom();
          heroInputArea.classList.add('show');
        }, 500);
      });
    }, 300);
  });

  function typeWriter(el, text, speed, cb) {
    let i = 0; let typed = '';
    const interval = setInterval(() => {
      typed += text[i];
      el.innerHTML = typed + '<span class="cursor"></span>';
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => { el.innerHTML = typed; if (cb) cb(); }, 600);
      }
    }, speed);
  }

  /* ---- FLOATING INPUT — always fixed, bottom slides on scroll ---- */
  const inputHoverZone = document.getElementById('inputHoverZone');
  const chipsWrap = document.getElementById('chipsWrap');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');
  const nav = document.getElementById('mainNav');
  let scrollTimer = null;
  let chipsAlive = false;
  let isProgrammaticScroll = false;
  let programmaticScrollTimer = null;

  function startProgrammaticScroll() {
    isProgrammaticScroll = true;
    clearTimeout(programmaticScrollTimer);
  }
  function endProgrammaticScroll() {
    clearTimeout(programmaticScrollTimer);
    programmaticScrollTimer = setTimeout(() => {
      isProgrammaticScroll = false;
      // Manually update nav after scroll settles
      if (window.scrollY > 40) nav.classList.add('visible');
      else nav.classList.remove('visible');
    }, 150);
  }

  const BOTTOM_SCROLLED = 28;

  function setInputBottom() {
    heroInputArea.style.bottom = '28vh';
  }

  function showChips() { chipsAlive = true; chipsWrap.classList.remove('hidden'); }
  function hideChips() {
    chipsAlive = false;
    if (!isMobile() && window.scrollY > 60) chipsWrap.classList.add('hidden');
  }

  inputHoverZone.addEventListener('mouseenter', showChips);
  inputHoverZone.addEventListener('mouseleave', () => setTimeout(hideChips, 200));
  msgInput.addEventListener('focus', () => {
    showChips();
    // On mobile, scroll bar into view after keyboard animates up
    if (isMobile()) {
      setTimeout(() => {
        heroInputArea.scrollIntoView({behavior:'smooth', block:'end'});
      }, 350);
    }
  });
  msgInput.addEventListener('blur', () => setTimeout(hideChips, 300));
  if (isMobile()) chipsWrap.classList.remove('hidden');

  window.addEventListener('scroll', () => {
    if (isProgrammaticScroll) endProgrammaticScroll();
    const currentY = window.scrollY;
    const pastHero = currentY > window.innerHeight * 0.5;
    const workSection = document.getElementById('work');
    const workTop = workSection ? workSection.offsetTop - 80 : window.innerHeight;
    const pastWork = currentY > workTop;

    positionName();

    // Fade grid glow out as user scrolls past hero
    const gridGlow = document.getElementById('gridGlow');
    if (gridGlow) {
      const glowOpacity = Math.max(0, 1 - (currentY / (window.innerHeight * 0.6)));
      gridGlow.style.opacity = glowOpacity;
    }

    // Nav behavior — suppressed during programmatic scrolls to avoid spazzing
    if (!isProgrammaticScroll) {
      clearTimeout(scrollTimer);
      if (currentY < 40) {
        // At the very top — hide nav
        nav.classList.remove('visible');
      } else if (!pastWork) {
        // Hero scroll zone — nav stays visible, Clare Lee shrinks into it
        nav.classList.add('visible');
      } else {
        // Past Work section — hide on scroll, always reappear after stop
        nav.classList.remove('visible');
        scrollTimer = setTimeout(() => nav.classList.add('visible'), 600);
      }
    }

    if (pastHero) {
      heroInputArea.style.bottom = BOTTOM_SCROLLED + 'px';
      if (!chipsAlive) chipsWrap.classList.add('hidden');
    } else {
      setInputBottom();
      chipsWrap.classList.remove('hidden');
    }
  });

  /* ---- CHIP SCROLL ---- */
  window.addEventListener('resize', positionName);
  document.getElementById('chipWork').addEventListener('click', e => {
    e.preventDefault();
    startProgrammaticScroll();
    document.getElementById('work').scrollIntoView({behavior:'smooth'});
  });
  document.getElementById('chipAbout').addEventListener('click', e => {
    e.preventDefault();
    startProgrammaticScroll();
    document.getElementById('about').scrollIntoView({behavior:'smooth'});
  });

  const navLogoLink = document.getElementById('navLogoLink');
  if (navLogoLink) {
    navLogoLink.addEventListener('click', e => {
      e.preventDefault();
      startProgrammaticScroll();
      window.scrollTo({top: 0, behavior: 'smooth'});
      // Once scroll settles at top, hide nav
      const hideWhenTop = setInterval(() => {
        if (window.scrollY < 40) {
          nav.classList.remove('visible');
          isProgrammaticScroll = false;
          clearTimeout(programmaticScrollTimer);
          clearInterval(hideWhenTop);
        }
      }, 80);
      // Safety: clear after 2s regardless
      setTimeout(() => clearInterval(hideWhenTop), 2000);
    });
  }

  /* ---- UNIFIED REVEAL ---- */
  // First add .reveal to everything that should animate
  document.querySelectorAll('.message-row, .card-with-date, .project-card:not(.card-with-date .project-card)').forEach(el => {
    el.classList.add('reveal');
  });

  // Section labels get reveal too (separate from typing animation)
  document.querySelectorAll('.section-label[data-label]').forEach(el => {
    el.classList.add('reveal');
  });

  /* SECTION LABEL TYPING — triggers bubble reveal after typing done */
  const sectionLabels = document.querySelectorAll('.section-label[data-label]');
  const labelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const label = el.getAttribute('data-label');
      const textEl = el.querySelector('.label-text');
      labelObserver.unobserve(el);
      el.classList.add('visible');
      textEl.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
      setTimeout(() => {
        textEl.innerHTML = '';
        typeLabelText(textEl, label.toUpperCase(), 70, () => {
          // After label finishes typing, reveal the thread items
          const section = el.closest('.section');
          if (!section) return;
          const items = section.querySelectorAll('.message-row, .card-with-date, .project-card:not(.card-with-date .project-card)');
          let delay = 0;
          items.forEach((item) => {
            const isCard = item.classList.contains('card-with-date') || (item.classList.contains('project-card') && !item.closest('.card-with-date'));
            delay += isCard ? 280 : 110;
            setTimeout(() => item.classList.add('visible'), delay);
          });
        });
      }, 500);
    });
  }, {threshold: 0.3});
  sectionLabels.forEach(el => labelObserver.observe(el));

  // Everything else with .reveal (about section cards, etc)
  const generalRevealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      generalRevealObs.unobserve(entry.target);
      entry.target.classList.add('visible');
    });
  }, {threshold: 0.1, rootMargin: '0px 0px -30px 0px'});

  document.querySelectorAll('.reveal:not(.message-row):not(.project-card):not(.section-label):not(.card-with-date)').forEach(el => {
    generalRevealObs.observe(el);
  });

  function typeLabelText(el, text, speed, cb) {
    let i = 0;
    let typed = '';
    const interval = setInterval(() => {
      typed += text[i];
      el.innerHTML = typed + '<span class="label-cursor"></span>';
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => {
          el.innerHTML = typed;
          if (cb) cb();
        }, 300);
      }
    }, speed);
  }

  /* ---- MODAL ---- */
  const overlay = document.getElementById('modalOverlay');
  window.openModal = function(msg) { document.getElementById('modalMessage').value = msg || ''; overlay.classList.add('show'); };
  function closeModal() { overlay.classList.remove('show'); }
  sendBtn.addEventListener('click', () => { window.openModal(msgInput.value.trim()); msgInput.value = ''; });
  msgInput.addEventListener('keydown', e => { if(e.key === 'Enter') { window.openModal(msgInput.value.trim()); msgInput.value = ''; }});
  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
  window.handleModalSend = function() {
    const msg = document.getElementById('modalMessage').value.trim();
    const email = document.getElementById('modalEmail').value.trim();
    if (!msg || !email) return;
    window.location.href = 'mailto:clarefranceslee@gmail.com?subject=Portfolio inquiry&body=' + encodeURIComponent(msg) + '%0A%0AFrom: ' + encodeURIComponent(email);
    closeModal();
  };

  /* ---- HOBBY TOOLTIPS ---- */
  function alignTooltips() {
    document.querySelectorAll('.hobby').forEach(hobby => {
      const tip = hobby.querySelector('.hobby-tooltip');
      if (!tip) return;
      const rect = hobby.getBoundingClientRect();
      const vw = window.innerWidth;
      tip.classList.remove('align-left','align-right');
      if (rect.left < 80) tip.classList.add('align-left');
      else if (rect.right > vw - 80) tip.classList.add('align-right');
    });
  }
  alignTooltips();
  window.addEventListener('resize', alignTooltips);

  // Mobile tap
  document.querySelectorAll('.hobby').forEach(hobby => {
    const tip = hobby.querySelector('.hobby-tooltip');
    if (!tip) return;
    hobby.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const isShowing = tip.classList.contains('show');
      document.querySelectorAll('.hobby-tooltip').forEach(t => t.classList.remove('show'));
      if (!isShowing) tip.classList.add('show');
    }, {passive: false});
  });
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.hobby')) {
      document.querySelectorAll('.hobby-tooltip').forEach(t => t.classList.remove('show'));
    }
  });
  /* ---- EMOJI RIPPLE ON VERSION ROWS ---- */
  document.querySelectorAll('.version-row[data-emojis]').forEach(row => {
    const emojis = row.getAttribute('data-emojis').split(',');
    const container = row.querySelector('.v-emojis');
    if (!container) return;
    emojis.forEach(e => {
      const span = document.createElement('span');
      span.className = 'v-emoji';
      span.textContent = e.trim();
      container.appendChild(span);
    });
    let emojiTimers = [];
    row.addEventListener('mouseenter', () => {
      emojiTimers.forEach(t => clearTimeout(t));
      emojiTimers = [];
      const spans = container.querySelectorAll('.v-emoji');
      spans.forEach(s => { s.style.transition = 'none'; s.classList.remove('popped'); });
      void container.offsetWidth;
      spans.forEach((s, i) => {
        emojiTimers.push(setTimeout(() => {
          s.style.transition = 'opacity 0.22s ease,transform 0.32s cubic-bezier(0.34,1.56,0.64,1)';
          s.classList.add('popped');
        }, i * 75));
      });
    });
    row.addEventListener('mouseleave', () => {
      emojiTimers.forEach(t => clearTimeout(t));
      emojiTimers = [];
      const spans = container.querySelectorAll('.v-emoji');
      spans.forEach((s, i) => {
        emojiTimers.push(setTimeout(() => {
          s.style.transition = 'opacity 0.12s ease,transform 0.12s ease';
          s.classList.remove('popped');
        }, i * 30));
      });
    });
  });

  const vRows = document.querySelectorAll('.version-row');
  const vPhotos = document.querySelectorAll('.version-photo');
  const photoDefault = document.getElementById('photoDefault');

  function showPhoto(id) {
    photoDefault.style.opacity = '0';
    vPhotos.forEach(p => p.classList.remove('active'));
    const ph = document.getElementById(id);
    if (ph) ph.classList.add('active');
  }
  function hidePhoto() {
    photoDefault.style.opacity = '1';
    vPhotos.forEach(p => p.classList.remove('active'));
  }

  // Version row photo swap removed — emoji ripple only



  /* ---- CARD CLICK TO EXPAND ---- */
  function animateMetrics(card) {
    card.querySelectorAll('.metric-num[data-target]').forEach(el => {
      const target = el.getAttribute('data-target');
      const suffix = el.getAttribute('data-suffix') || '';
      const isFloat = target.includes('.');
      const num = parseFloat(target);
      const duration = 900;
      const start = performance.now();
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = (isFloat ? (num * ease).toFixed(2) : Math.round(num * ease)) + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  window.toggleExpand = function(btn) {
    const expanded = btn.nextElementSibling;
    const arrow = btn.querySelector('.expand-arrow');
    const isOpen = expanded.classList.contains('open');
    expanded.classList.toggle('open');
    arrow.classList.toggle('open');
    const closedLabel = btn.dataset.labelClosed || ' More details';
    const openLabel = btn.dataset.labelOpen || ' Less details';
    btn.childNodes[1].textContent = isOpen ? closedLabel : openLabel;
    if (!isOpen) animateMetrics(btn.closest('.project-card'));
  };

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.detail-link') || e.target.closest('.detail-label-link') || e.target.closest('.case-study-link') || e.target.closest('.contact-btn')) return;
      const btn = card.querySelector('.card-expand-btn');
      if (btn) window.toggleExpand(btn);
    });
  });

  /* ---- MOBILE VERSION STICKERS ---- */
  if (isMobile()) {
    document.querySelectorAll('.version-row').forEach((row, i) => {
      const sticker = row.querySelector('.version-sticker');
      if (!sticker) return;
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          setTimeout(() => sticker.classList.add('pop'), i * 100);
        });
      }, {threshold: 0.6});
      obs.observe(row);
    });
  }

  /* ---- VERSION HISTORY ---- */
  const vh = document.getElementById('versionHistory');
  const va = document.getElementById('vArrow');
  document.getElementById('versionHeader').addEventListener('click', () => { vh.classList.toggle('open'); va.classList.toggle('open'); });

  /* ---- LINK PREVIEW POPOVER ---- */
  const previewEl = document.createElement('div');
  previewEl.className = 'link-preview';
  previewEl.innerHTML = '<img id="previewImg" src="" alt=""><div class="link-preview-label" id="previewCaption"></div>';
  document.body.appendChild(previewEl);
  const previewImg = document.getElementById('previewImg');
  const previewCaption = document.getElementById('previewCaption');
  let previewHideTimer;
  let previewShowTimer;

  document.querySelectorAll('.detail-label-link[data-preview]').forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      clearTimeout(previewHideTimer);
      clearTimeout(previewShowTimer);
      previewShowTimer = setTimeout(() => {
        previewImg.src = link.dataset.preview;
        previewCaption.textContent = link.dataset.caption || link.querySelector('.detail-label').textContent.replace('↗','').trim();
        previewEl.style.left = (e.clientX + 18) + 'px';
        previewEl.style.top = (e.clientY - 90) + 'px';
        previewEl.classList.add('visible');
      }, 120);
    });
    link.addEventListener('mousemove', (e) => {
      if (!previewEl.classList.contains('visible')) return;
      previewEl.style.left = (e.clientX + 18) + 'px';
      previewEl.style.top = Math.max(10, e.clientY - 90) + 'px';
    });
    link.addEventListener('mouseleave', () => {
      clearTimeout(previewShowTimer);
      previewHideTimer = setTimeout(() => previewEl.classList.remove('visible'), 120);
    });
  });

  /* ---- TAB AWAY ---- */
  document.addEventListener('visibilitychange', () => {    document.title = document.hidden ? "Don't go just yet." : 'Clare Lee — AI UX Designer';
  });

}); // end DOMContentLoaded
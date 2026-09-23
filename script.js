/* Offline, progressive enhancements. Three behaviours only:
   document lift/focus, a single reveal, and a travelling editorial rail. */
(() => {
  'use strict';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animeApi = window.anime;
  const canAnimateData = Boolean(animeApi && animeApi.animate && animeApi.stagger && !reducedMotion.matches);
  if (canAnimateData) document.documentElement.classList.add('motion-enabled');

  // Pointer and keyboard share the same selection; touch keeps a selection.
  // Leaving a pointer region restores any keyboard focus still in that region.
  function explore(container, items, activate, reset) {
    if (!container) return;
    items.forEach(item => {
      item.addEventListener('pointerenter', event => {
        if (finePointer.matches && event.pointerType !== 'touch') activate(item);
      });
      item.addEventListener('focus', () => activate(item));
      item.addEventListener('click', () => activate(item));
      item.addEventListener('keydown', event => {
        if (event.key === 'Escape') { reset(); return; }
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = items.indexOf(item);
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else next = (next + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + items.length) % items.length;
        items[next].focus({preventScroll:true});
        items[next].scrollIntoView({block:'nearest',behavior:'instant'});
      });
    });
    container.addEventListener('pointerleave', event => {
      if (!finePointer.matches || event.pointerType === 'touch') return;
      const focused = items.find(item => item === document.activeElement);
      if (focused) activate(focused); else reset();
    });
    container.addEventListener('focusout', event => {
      if (!container.contains(event.relatedTarget)) reset();
    });
  }

  const universe = document.querySelector('.artifact-universe');
  const hero = document.querySelector('.hero-grid');
  const artifacts = [...document.querySelectorAll('[data-artifact]')];
  const index = [...document.querySelectorAll('[data-select]')];
  const captionTitle = document.getElementById('hero-caption-title');
  const captionText = document.getElementById('hero-caption-text');
  const defaultTitle = captionTitle.textContent;
  const defaultCaption = captionText.textContent;
  function selectArtifact(item) {
    const key = item.dataset.artifact || item.dataset.select;
    const selected = artifacts.find(artifact => artifact.dataset.artifact === key);
    if (!selected) return;
    universe.classList.add('has-active');
    artifacts.forEach(artifact => artifact.classList.toggle('is-active', artifact === selected));
    index.forEach(button => {
      const active = button.dataset.select === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    captionTitle.textContent = selected.getAttribute('aria-label');
    captionText.textContent = selected.querySelector('.artifact-caption').textContent;
  }
  function resetArtifacts() {
    universe.classList.remove('has-active');
    artifacts.forEach(artifact => artifact.classList.remove('is-active'));
    index.forEach(button => { button.classList.remove('is-active'); button.setAttribute('aria-pressed','false'); });
    captionTitle.textContent = defaultTitle;
    captionText.textContent = defaultCaption;
  }
  index.forEach(button => button.setAttribute('aria-pressed','false'));
  explore(hero, [...artifacts,...index], selectArtifact, resetArtifacts);
  // Reset in the gaps between documents; the selected keyboard item remains.
  universe.addEventListener('pointerleave', event => {
    if (finePointer.matches && event.pointerType !== 'touch' && !hero.contains(document.activeElement)) resetArtifacts();
  });
  const hint = document.querySelector('.interaction-hint');
  const updateHint = () => { hint.textContent = finePointer.matches ? 'Hover or focus to explore' : 'Tap to explore'; };
  updateHint();
  finePointer.addEventListener('change', updateHint);

  const journey = document.getElementById('journey-stations');
  journey.classList.add('is-enhanced');
  const stations = [...journey.querySelectorAll('.station')];
  const detail = document.getElementById('journey-detail');
  const overview = detail.innerHTML;
  function selectStation(station) {
    journey.classList.add('has-active');
    stations.forEach(item => {
      const active = item === station;
      item.classList.toggle('is-active',active);
      item.setAttribute('aria-pressed',String(active));
    });
    detail.dataset.phase = station.dataset.phase;
    detail.querySelector('.journey-detail-label').textContent = station.querySelector('.j-label').textContent;
    detail.querySelector('p').textContent = station.querySelector('.station-description').textContent;
  }
  function resetJourney() {
    journey.classList.remove('has-active');
    stations.forEach(item => { item.classList.remove('is-active'); item.setAttribute('aria-pressed','false'); });
    detail.removeAttribute('data-phase');
    detail.innerHTML = overview;
  }
  explore(journey, stations, selectStation, resetJourney);

  // Source matrix: the original cell values are never mutated.
  const table = document.getElementById('matrix');
  const legend = document.getElementById('matrix-legend');
  const legendButtons = [...legend.querySelectorAll('button')];
  function highlightMark(button) {
    table.classList.add('is-filtered');
    legendButtons.forEach(item => {
      item.classList.toggle('is-on',item === button);
      item.setAttribute('aria-pressed',String(item === button));
    });
    table.querySelectorAll('td').forEach(cell => cell.classList.toggle('mark-on',cell.dataset.m === button.dataset.mark));
  }
  function resetMatrix() {
    table.classList.remove('is-filtered');
    legendButtons.forEach(item => { item.classList.remove('is-on'); item.setAttribute('aria-pressed','false'); });
    table.querySelectorAll('td').forEach(cell => cell.classList.remove('mark-on'));
  }
  legendButtons.forEach(button => button.setAttribute('aria-pressed','false'));
  explore(legend, legendButtons, highlightMark, resetMatrix);

  // Column exploration is separate from legend filtering: hover/focus follows the research field.
  const matrixHeaders = [...table.querySelectorAll('thead th')];
  function focusMatrixColumn(columnIndex) {
    table.classList.add('has-column-focus');
    table.querySelectorAll('tr').forEach(row => {
      [...row.children].forEach((cell, index) => cell.classList.toggle('col-on', index === columnIndex));
    });
  }
  function resetMatrixColumn() {
    table.classList.remove('has-column-focus');
    table.querySelectorAll('.col-on').forEach(cell => cell.classList.remove('col-on'));
  }
  matrixHeaders.forEach((header, index) => {
    if (!index) return;
    header.tabIndex = 0;
    header.addEventListener('pointerenter', event => {
      if (finePointer.matches && event.pointerType !== 'touch') focusMatrixColumn(index);
    });
    header.addEventListener('focus', () => focusMatrixColumn(index));
  });
  table.addEventListener('pointerleave', event => {
    if (finePointer.matches && event.pointerType !== 'touch') resetMatrixColumn();
  });
  table.addEventListener('focusout', event => {
    if (!table.contains(event.relatedTarget)) resetMatrixColumn();
  });

  // Gallery purpose stays visible; focus/tap adds emphasis, never gates text.
  const gallery = document.querySelector('.gallery');
  const works = [...gallery.querySelectorAll('.g-item')];
  explore(gallery, works, selected => {
    works.forEach(work => work.classList.toggle('is-active',work === selected));
  }, () => works.forEach(work => work.classList.remove('is-active')));

  // Three one-time quantitative sequences. Text remains visible throughout.
  if (canAnimateData && 'IntersectionObserver' in window) {
    const { animate, stagger } = animeApi;
    const dataEase = animeApi.eases && animeApi.eases.linear
      ? animeApi.eases.linear(0, '0.72 55%', '0.72 68%', 1)
      : 'linear';

    function once(target, start, threshold) {
      if (!target) return;
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      }, { threshold: threshold || 0.18, rootMargin: '0px 0px -5% 0px' });
      observer.observe(target);
    }

    const dotfield = document.getElementById('dotfield');
    once(dotfield, () => {
      animate(dotfield.children, {
        opacity: [0.08, 0.62],
        scale: [0.25, 1],
        duration: 820,
        delay: stagger(12, { grid: [50, 36], axis: 'x' }),
        ease: dataEase,
        onComplete: () => dotfield.classList.add('is-complete')
      });
    }, 0.1);

    const bars = document.getElementById('reliability-bars');
    once(bars, () => {
      animate(bars.querySelectorAll('.metric-primary'), { scaleX: [0, 1], duration: 700, ease: dataEase });
      animate(bars.querySelectorAll('.metric-fallback'), { scaleX: [0, 1], duration: 360, delay: 640, ease: 'linear' });
      animate(bars.querySelectorAll('.metric-company'), { scaleX: [0, 1], duration: 900, delay: 140, ease: dataEase, onComplete: () => bars.classList.add('is-complete') });
    }, 0.35);

    const slope = document.getElementById('slope-comparison');
    const paths = slope ? [...slope.querySelectorAll('.slope-series path')] : [];
    paths.forEach(path => path.setAttribute('pathLength', '1'));
    once(slope, () => {
      animate(slope.querySelectorAll('.slope-before,.slope-value-before,.slope-test'), { opacity: [0, 1], duration: 220, delay: stagger(55), ease: 'linear' });
      animate(paths, { strokeDashoffset: [1, 0], duration: 820, delay: stagger(110, { start: 180 }), ease: dataEase });
      animate(slope.querySelectorAll('.slope-after,.slope-value-after'), { opacity: [0, 1], duration: 260, delay: stagger(70, { start: 850 }), ease: 'linear' });
    }, 0.25);

    const framework = document.querySelector('.framework-feature');
    once(framework, () => {
      animate(framework.querySelectorAll('.hierarchy li'), { opacity: [0.25, 1], y: [5, 0], duration: 380, delay: stagger(85), ease: 'outQuad', onComplete: () => framework.classList.add('is-complete') });
    }, 0.25);
  }

  // Animate on arrival; off-screen content is never left hidden.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const targets = [...document.querySelectorAll('.research-stage,.g-item')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion.matches) entry.target.classList.add('is-entering');
        observer.unobserve(entry.target);
      });
    }, {threshold:0.06,rootMargin:'0px 0px 30px 0px'});
    targets.forEach(target => {
      target.classList.add('reveal-target');
      target.addEventListener('animationend', () => target.classList.remove('is-entering'), {once:true});
      observer.observe(target);
    });
    // Focus and preference changes must never wait for animation.
    document.addEventListener('focusin', event => {
      const target = event.target.closest('.reveal-target');
      if (target) target.classList.remove('is-entering');
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) targets.forEach(target => target.classList.remove('is-entering'));
    });
  }
})();

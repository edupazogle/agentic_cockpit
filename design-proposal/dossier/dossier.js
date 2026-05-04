/* DOSSIER — minimalist editorial mockup interactions
   Skill rules: scroll-entry via IntersectionObserver, no scroll listeners */
(function () {
  'use strict';

  // Scroll-reveal (skill rule)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const idx = parseInt(el.dataset.idx || '0', 10);
        setTimeout(() => el.classList.add('in'), idx * 80);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.idx = String(i);
    io.observe(el);
  });

  // Stepper navigation
  document.querySelectorAll('.stepper').forEach((stepper) => {
    stepper.addEventListener('click', (e) => {
      const step = e.target.closest('.step');
      if (!step) return;
      stepper.querySelectorAll('.step').forEach((s) => s.classList.remove('active'));
      step.classList.add('active');
    });
  });

  // Decision actions
  document.querySelectorAll('[data-decision]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-decision');
      const card = btn.closest('.card');
      if (!card) return;
      const banner = document.createElement('div');
      banner.className = 'tag ' + (action === 'approve' ? 'green' : action === 'reject' ? 'red' : 'yellow');
      banner.style.marginTop = '12px';
      banner.innerHTML = `<span class="dot"></span>${action === 'approve' ? 'Approved — run resumes immediately' : action === 'reject' ? 'Rejected — escalation queued' : 'Pending operator question'}`;
      const footer = card.querySelector('.actions');
      if (footer) {
        footer.querySelectorAll('.btn').forEach((b) => b.setAttribute('disabled', 'true'));
        card.appendChild(banner);
      }
    });
  });
})();

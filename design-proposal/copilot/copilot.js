/* COPILOT — high-end interaction layer
   - Token-by-token chat streaming
   - IntersectionObserver scroll reveal (skill rule: NEVER scroll listeners)
   - Magnetic hover via transform only
*/
(function () {
  'use strict';

  // ---------- Scroll reveal ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.idx || '0', 10);
        setTimeout(() => entry.target.classList.add('in'), idx * 90);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.idx = String(i);
    io.observe(el);
  });

  // ---------- Streaming simulator ----------
  // For elements with [data-stream] attribute, type the text char by char
  function stream(el, text, speed = 16) {
    el.textContent = '';
    let i = 0;
    return new Promise((resolve) => {
      const tick = () => {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(tick, speed + Math.random() * 22);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  document.querySelectorAll('[data-stream-on-load]').forEach((el) => {
    const text = el.getAttribute('data-text') || el.textContent.trim();
    const delay = parseInt(el.getAttribute('data-delay') || '300', 10);
    setTimeout(() => stream(el, text, 14), delay);
  });

  // ---------- Composer interaction ----------
  const composer = document.querySelector('.composer textarea');
  if (composer) {
    composer.addEventListener('input', () => {
      composer.style.height = '22px';
      composer.style.height = Math.min(composer.scrollHeight, 160) + 'px';
    });
    composer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const stream = document.querySelector('.chat-stream');
        if (!stream || !composer.value.trim()) return;
        const msg = document.createElement('div');
        msg.className = 'msg user';
        msg.innerHTML = `
          <div class="avatar">MR</div>
          <div class="body">
            <div class="name">m.rondonneau</div>
            <p>${composer.value.replace(/</g, '&lt;')}</p>
          </div>`;
        stream.appendChild(msg);
        composer.value = '';
        composer.style.height = '22px';
        stream.scrollTop = stream.scrollHeight;

        // Synthetic agent reply
        setTimeout(() => {
          const reply = document.createElement('div');
          reply.className = 'msg agent';
          reply.innerHTML = `
            <div class="avatar">◆</div>
            <div class="body">
              <div class="name">copilot</div>
              <p data-stream-on-load data-delay="80" data-text="Acknowledged. Inspecting the run trace and the active gate condition now.">…<span class="cursor"></span></p>
              <span class="tool-call"><span class="dot"></span>langfuse.query · trace 7f4a-31bd</span>
            </div>`;
          stream.appendChild(reply);
          const target = reply.querySelector('p');
          stream.scrollTop = stream.scrollHeight;
          stream(target, target.getAttribute('data-text'), 14);
        }, 480);
      }
    });
  }

  // ---------- Magnetic hover physics on bento cards ----------
  document.querySelectorAll('.bento .card').forEach((card) => {
    let raf = null;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `translate3d(${x * 4}px, ${y * 4 - 3}px, 0)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });

  // ---------- Diff accept / reject ----------
  document.querySelectorAll('[data-diff-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.diff-card');
      if (!card) return;
      const action = btn.getAttribute('data-diff-action');
      const head = card.querySelector('.head .sub');
      if (head) {
        head.innerHTML = action === 'accept'
          ? '<span style="color: var(--emerald);">● Accepted · queued for compliance review</span>'
          : '<span style="color: var(--rose);">● Rejected · revision discarded</span>';
      }
      card.querySelectorAll('.diff-actions .btn').forEach((b) => b.setAttribute('disabled', 'true'));
    });
  });
})();

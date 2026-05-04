/* ATELIER mockup interactions */
(function () {
  'use strict';

  // Command palette toggle
  const palette = document.querySelector('.palette-overlay');
  const paletteInput = document.querySelector('.palette-input input');
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette) {
        palette.classList.toggle('open');
        if (palette.classList.contains('open')) paletteInput?.focus();
      }
    }
    if (e.key === 'Escape' && palette?.classList.contains('open')) {
      palette.classList.remove('open');
    }
  });
  palette?.addEventListener('click', (e) => {
    if (e.target === palette) palette.classList.remove('open');
  });

  // Tab activation
  document.querySelectorAll('.tabs').forEach((tabs) => {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      tabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Telemetry stream simulator
  const tickerLines = [
    { t: '00:00.012', lvl: 'level-info', src: 'gateway', msg: 'POST /api/runs/start scenario=property-fast-track tenant=gdai-default' },
    { t: '00:00.034', lvl: 'level-info', src: 'run-store', msg: 'scenario_runs.insert id=run_8c4f… state=queued' },
    { t: '00:00.218', lvl: 'level-info', src: 'langflow', msg: 'flow=wf-004 NemoClaw triggered, session_id=sess_2b1e' },
    { t: '00:01.402', lvl: 'level-info', src: 'wfmcp03', msg: 'tool=claims_facade.fetch claim_id=CLM-2026-0042 latency=412ms' },
    { t: '00:02.118', lvl: 'level-info', src: 'agent', msg: 'Triage: severity=CAT1 confidence=0.87 reserves_estimate=€2300' },
    { t: '00:02.640', lvl: 'level-warn', src: 'gate-G2', msg: 'reserves > €2000 → HITL required, paused at step=03·dispatch' },
    { t: '00:02.642', lvl: 'level-info', src: 'chatwoot', msg: 'handover packet posted conv=8814 op_pool=tier-2-claims' },
  ];
  const tickerEl = document.querySelector('.telemetry-stream');
  if (tickerEl) {
    tickerLines.forEach((l, i) => {
      setTimeout(() => {
        const row = document.createElement('div');
        row.className = 'telemetry-row';
        row.innerHTML = `
          <span class="t">T+${l.t}</span>
          <span class="${l.lvl}">${l.lvl.split('-')[1].toUpperCase()}</span>
          <span class="src">${l.src}</span>
          <span class="dim">${(Math.random() * 999).toFixed(0).padStart(3, '0')}.${(Math.random() * 99).toFixed(0).padStart(2, '0')}</span>
          <span class="msg">${l.msg}</span>
          <span class="dim">${i.toString().padStart(4, '0')}</span>`;
        tickerEl.insertBefore(row, tickerEl.firstChild);
        // limit 8 rows
        while (tickerEl.children.length > 8) tickerEl.removeChild(tickerEl.lastChild);
      }, i * 700 + 400);
    });
  }

  // Live time in header
  const timeEl = document.querySelector('[data-time]');
  if (timeEl) {
    const tick = () => {
      const d = new Date();
      timeEl.textContent =
        d.getUTCHours().toString().padStart(2, '0') + ':' +
        d.getUTCMinutes().toString().padStart(2, '0') + ':' +
        d.getUTCSeconds().toString().padStart(2, '0') + ' UTC';
    };
    tick();
    setInterval(tick, 1000);
  }

  // Approve / Reject HITL
  document.querySelectorAll('[data-hitl-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const banner = document.querySelector('.hitl-banner');
      const action = btn.getAttribute('data-hitl-action');
      if (banner) {
        banner.style.borderColor = action === 'approve' ? 'var(--terminal-green)' : 'var(--hazard-deep)';
        banner.querySelector('.title').textContent = action === 'approve'
          ? 'APPROVED — RESUMING RUN'
          : 'REJECTED — ESCALATED';
        setTimeout(() => banner.remove(), 1400);
      }
    });
  });
})();

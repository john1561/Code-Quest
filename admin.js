/**
 * Code Quest: Java Adventure - Admin Dashboard Logic
 * Handles Authentication, Tournament Management, Real-time Stats,
 * Player Verification, CSV Exports, and Danger Zone Operations.
 */

(function () {
  'use strict';

  // State Management
  let currentLeaderboard = [];
  let currentSort = { column: 'score', ascending: false };
  let activePlayerId = null;
  let competitionConfig = null;

  // DOM Elements
  const DOM = {
    // Auth & Env
    adminLogin: document.getElementById('admin-login'),
    adminDashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error-alert'),
    btnLoginSubmit: document.getElementById('btn-login-submit'),
    btnLogout: document.getElementById('btn-logout'),
    envBadge: document.getElementById('env-badge'),
    envText: document.getElementById('env-text'),

    // Stats
    statParticipants: document.getElementById('stat-total-participants'),
    statTopScore: document.getElementById('stat-top-score'),
    statAvgScore: document.getElementById('stat-avg-score'),
    statStatus: document.getElementById('stat-status'),

    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Leaderboard
    tableBody: document.getElementById('leaderboard-tbody'),
    searchInput: document.getElementById('leaderboard-search'),
    btnRefresh: document.getElementById('btn-refresh-data'),
    btnExportCsv: document.getElementById('btn-export-csv'),

    // Settings
    settingsForm: document.getElementById('settings-form'),
    cfgIsActive: document.getElementById('cfg-is-active'),
    cfgCompetitionName: document.getElementById('cfg-competition-name'),
    cfgStartTime: document.getElementById('cfg-start-time'),
    cfgEndTime: document.getElementById('cfg-end-time'),
    cfgTimeLimit: document.getElementById('cfg-time-limit'),
    cfgTargetScore: document.getElementById('cfg-target-score'),
    cfgParticipation: document.getElementById('cfg-participation-enabled'),
    prizesContainer: document.getElementById('prizes-container'),
    btnToggleTournament: document.getElementById('btn-toggle-tournament'),

    // Danger Zone
    btnDangerReset: document.getElementById('btn-danger-reset'),

    // Modal
    modal: document.getElementById('player-modal'),
    modalPlayerNick: document.getElementById('modal-player-nick'),
    modalStatScore: document.getElementById('modal-stat-score'),
    modalStatStars: document.getElementById('modal-stat-stars'),
    modalStatTime: document.getElementById('modal-stat-time'),
    modalBreakdownBody: document.getElementById('modal-breakdown-tbody'),
    modalFooterActions: document.getElementById('modal-footer-actions'),
    btnCloseModal: document.getElementById('btn-close-modal'),

    // Toast
    toastContainer: document.getElementById('toast-container')
  };

  // ==============================================================================
  // UI HELPERS (Toasts, Spinners, Dates, Formatting)
  // ==============================================================================

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span style="font-weight: bold;">${icon}</span><span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTime(seconds) {
    const s = Math.max(0, parseInt(seconds, 10) || 0);
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`;
  }

  function formatDate(isoString) {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  }

  // ==============================================================================
  // AUTHENTICATION FLOW
  // ==============================================================================

  async function checkAuthSession() {
    updateEnvironmentBadge();
    const isAuth = await window.CodeQuestDB.isAdminAuthenticated();
    if (isAuth) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function updateEnvironmentBadge() {
    const isConfigured = window.CodeQuestDB.isConfigured();
    if (isConfigured) {
      DOM.envBadge.className = 'demo-indicator cloud';
      DOM.envText.textContent = 'Supabase Cloud (Online)';
      const demoBox = document.getElementById('demo-mode-instruction');
      if (demoBox) demoBox.style.display = 'none';
    } else {
      DOM.envBadge.className = 'demo-indicator';
      DOM.envText.textContent = 'Demo Mode (Local)';
      const demoBox = document.getElementById('demo-mode-instruction');
      if (demoBox) demoBox.style.display = 'block';
    }
  }

  function showLogin() {
    DOM.adminLogin.style.display = 'flex';
    DOM.adminDashboard.style.display = 'none';
    DOM.btnLogout.style.display = 'none';
    DOM.loginError.style.display = 'none';
  }

  async function showDashboard() {
    DOM.adminLogin.style.display = 'none';
    DOM.adminDashboard.style.display = 'block';
    DOM.btnLogout.style.display = 'inline-flex';
    await Promise.all([loadLeaderboard(), loadCompetitionConfig()]);
  }

  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.loginError.style.display = 'none';
    DOM.btnLoginSubmit.disabled = true;
    DOM.btnLoginSubmit.innerHTML = '<span class="spinner"></span> Signing in...';

    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPassword.value;

    const res = await window.CodeQuestDB.adminSignIn(email, password);
    DOM.btnLoginSubmit.disabled = false;
    DOM.btnLoginSubmit.innerHTML = '<span>Sign In to Dashboard</span>';

    if (res.success) {
      showToast('Welcome to Code Quest Organizer Dashboard!', 'success');
      showDashboard();
    } else {
      DOM.loginError.textContent = res.error || 'Failed to authenticate.';
      DOM.loginError.style.display = 'block';
    }
  });

  DOM.btnLogout.addEventListener('click', async () => {
    await window.CodeQuestDB.adminSignOut();
    showToast('Signed out successfully.', 'info');
    showLogin();
  });

  // ==============================================================================
  // TAB NAVIGATION
  // ==============================================================================

  DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      DOM.tabButtons.forEach(b => b.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (targetId === 'tab-leaderboard') {
        loadLeaderboard();
      } else if (targetId === 'tab-settings') {
        loadCompetitionConfig();
      }
    });
  });

  // ==============================================================================
  // LEADERBOARD MANAGEMENT
  // ==============================================================================

  async function loadLeaderboard() {
    DOM.tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
          <span class="spinner"></span> Loading tournament leaderboard...
        </td>
      </tr>
    `;

    const searchQuery = DOM.searchInput.value.trim();
    const res = await window.CodeQuestDB.getFullLeaderboard(searchQuery);

    if (!res.success) {
      showToast(`Error: ${res.error}`, 'error');
      DOM.tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--accent-red); padding: 2rem;">Failed to load data: ${escapeHtml(res.error)}</td></tr>`;
      return;
    }

    currentLeaderboard = res.data;
    renderStats(currentLeaderboard);
    sortAndRenderTable();
  }

  function sortAndRenderTable() {
    const list = [...currentLeaderboard];
    const { column, ascending } = currentSort;

    list.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (column === 'status') {
        valA = a.flagged ? 'flagged' : (a.verified ? 'verified' : 'pending');
        valB = b.flagged ? 'flagged' : (b.verified ? 'verified' : 'pending');
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = valA || 0;
      valB = valB || 0;
      return ascending ? valA - valB : valB - valA;
    });

    if (list.length === 0) {
      DOM.tableBody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <p>No tournament submissions found.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    DOM.tableBody.innerHTML = '';
    list.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', entry.id);

      // Rank decoration
      let rankHtml = `<span class="rank-badge">${idx + 1}</span>`;
      if (idx === 0) rankHtml = `<span class="rank-badge rank-1">🥇</span>`;
      if (idx === 1) rankHtml = `<span class="rank-badge rank-2">🥈</span>`;
      if (idx === 2) rankHtml = `<span class="rank-badge rank-3">🥉</span>`;

      // Status Badge
      let statusBadge = '<span class="status-badge pending">Pending</span>';
      if (entry.flagged) {
        statusBadge = `<span class="status-badge flagged" title="${escapeHtml(entry.flag_reason || 'Flagged')}">⚠ Flagged</span>`;
      } else if (entry.verified) {
        statusBadge = '<span class="status-badge verified">✓ Verified</span>';
      }

      // Mode Badge
      const modeHtml = `<span class="mode-tag ${entry.mode === 'competition' ? 'competition' : ''}">${entry.mode}</span>`;

      tr.innerHTML = `
        <td>${rankHtml}</td>
        <td>
          <div class="player-nick">
            <span>${escapeHtml(entry.nickname)}</span>
            ${modeHtml}
          </div>
        </td>
        <td style="font-weight: 700; color: var(--accent-cyan); font-family: 'JetBrains Mono', monospace;">${entry.score.toLocaleString()}</td>
        <td>${entry.levels_completed}/${entry.total_levels || 12}</td>
        <td>⭐ ${entry.stars_earned}</td>
        <td>${formatTime(entry.total_time)}</td>
        <td style="color: var(--text-secondary); font-size: 0.8rem;">${formatDate(entry.created_at)}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right;" onclick="event.stopPropagation();">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm btn-action-verify" data-id="${entry.id}" title="Mark as Verified">✓</button>
            <button class="btn btn-secondary btn-sm btn-action-flag" data-id="${entry.id}" title="Flag Suspicious Run">⚠</button>
            <button class="btn btn-danger btn-sm btn-action-delete" data-id="${entry.id}" title="Delete Record">✕</button>
          </div>
        </td>
      `;

      // Clicking row opens details modal
      tr.addEventListener('click', () => openPlayerModal(entry.id));
      DOM.tableBody.appendChild(tr);
    });

    attachRowActionListeners();
  }

  function attachRowActionListeners() {
    document.querySelectorAll('.btn-action-verify').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        const res = await window.CodeQuestDB.verifyResult(id);
        if (res.success) {
          showToast('Player run marked as verified.', 'success');
          await loadLeaderboard();
        } else {
          showToast(`Verification failed: ${res.error}`, 'error');
          btn.disabled = false;
        }
      });
    });

    document.querySelectorAll('.btn-action-flag').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const reason = prompt('Enter reason for flagging this submission:', 'Suspicious time or instruction count');
        if (reason === null) return; // User cancelled
        btn.disabled = true;
        const res = await window.CodeQuestDB.flagResult(id, reason || 'Flagged by organizer');
        if (res.success) {
          showToast('Player run flagged.', 'warning');
          await loadLeaderboard();
        } else {
          showToast(`Flagging failed: ${res.error}`, 'error');
          btn.disabled = false;
        }
      });
    });

    document.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (!confirm('Are you sure you want to permanently delete this score entry?')) return;
        btn.disabled = true;
        const res = await window.CodeQuestDB.deleteResult(id);
        if (res.success) {
          showToast('Record deleted.', 'info');
          await loadLeaderboard();
        } else {
          showToast(`Delete failed: ${res.error}`, 'error');
          btn.disabled = false;
        }
      });
    });
  }

  // Column header sorting
  document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (currentSort.column === col) {
        currentSort.ascending = !currentSort.ascending;
      } else {
        currentSort.column = col;
        currentSort.ascending = col === 'total_time' || col === 'nickname'; // ascending default for time/alpha
      }
      sortAndRenderTable();
    });
  });

  // Client-side instant filter & search debounce
  let searchTimeout = null;
  DOM.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadLeaderboard();
    }, 250);
  });

  DOM.btnRefresh.addEventListener('click', () => {
    showToast('Refreshing leaderboard...', 'info');
    loadLeaderboard();
  });

  // Export CSV
  DOM.btnExportCsv.addEventListener('click', async () => {
    DOM.btnExportCsv.disabled = true;
    DOM.btnExportCsv.innerHTML = '<span class="spinner"></span> Exporting...';

    try {
      const csvContent = await window.CodeQuestDB.exportLeaderboardCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codequest_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Leaderboard CSV exported successfully.', 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      DOM.btnExportCsv.disabled = false;
      DOM.btnExportCsv.innerHTML = '<span>⬇ Export CSV</span>';
    }
  });

  // ==============================================================================
  // STATS BAR CALCULATION
  // ==============================================================================

  function renderStats(list) {
    const total = list.length;
    DOM.statParticipants.textContent = total.toLocaleString();

    if (total === 0) {
      DOM.statTopScore.textContent = '0';
      DOM.statAvgScore.textContent = '0';
      return;
    }

    const scores = list.map(item => item.score || 0);
    const top = Math.max(...scores);
    const sum = scores.reduce((acc, cur) => acc + cur, 0);
    const avg = Math.round(sum / total);

    DOM.statTopScore.textContent = top.toLocaleString();
    DOM.statAvgScore.textContent = avg.toLocaleString();
  }

  // ==============================================================================
  // PLAYER DETAILS MODAL
  // ==============================================================================

  async function openPlayerModal(id) {
    activePlayerId = id;
    DOM.modalPlayerNick.textContent = 'Loading details...';
    DOM.modalBreakdownBody.innerHTML = `<tr><td colspan="5" style="text-align: center;"><span class="spinner"></span> Loading...</td></tr>`;
    DOM.modalFooterActions.innerHTML = '';
    DOM.modal.classList.add('active');

    const res = await window.CodeQuestDB.getPlayerDetails(id);
    if (!res.success) {
      showToast('Could not load player details: ' + res.error, 'error');
      closePlayerModal();
      return;
    }

    const p = res.data;
    DOM.modalPlayerNick.textContent = `${p.nickname} — Run Breakdown`;
    DOM.modalStatScore.textContent = (p.score || 0).toLocaleString();
    DOM.modalStatStars.textContent = `${p.stars_earned} / ${p.total_stars || 36}`;
    DOM.modalStatTime.textContent = formatTime(p.total_time);

    // Populate level details
    DOM.modalBreakdownBody.innerHTML = '';
    const details = Array.isArray(p.level_details) ? p.level_details : [];

    if (details.length === 0) {
      DOM.modalBreakdownBody.innerHTML = `
        <tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
          No granular per-level telemetry recorded for this run.
        </td></tr>
      `;
    } else {
      details.forEach((lvl, i) => {
        const tr = document.createElement('tr');
        const starSymbols = '⭐'.repeat(lvl.stars || 0);
        tr.innerHTML = `
          <td><strong>Level ${lvl.level || i + 1}</strong></td>
          <td>${starSymbols || '—'}</td>
          <td>${lvl.time ? lvl.time + 's' : '—'}</td>
          <td>${lvl.instructions !== undefined ? lvl.instructions : '—'}</td>
          <td>${lvl.hints !== undefined ? lvl.hints : '0'}</td>
        `;
        DOM.modalBreakdownBody.appendChild(tr);
      });
    }

    // Modal Action Buttons
    DOM.modalFooterActions.innerHTML = `
      <button id="modal-btn-verify" class="btn btn-success btn-sm"><span>✓ Verify Run</span></button>
      <button id="modal-btn-flag" class="btn btn-warning btn-sm"><span>⚠ Flag Run</span></button>
      <button id="modal-btn-delete" class="btn btn-danger btn-sm"><span>✕ Delete Run</span></button>
      <button id="modal-btn-close" class="btn btn-secondary btn-sm">Close</button>
    `;

    document.getElementById('modal-btn-close').addEventListener('click', closePlayerModal);

    document.getElementById('modal-btn-verify').addEventListener('click', async () => {
      const r = await window.CodeQuestDB.verifyResult(p.id);
      if (r.success) {
        showToast(`Verified run for ${p.nickname}`, 'success');
        closePlayerModal();
        await loadLeaderboard();
      }
    });

    document.getElementById('modal-btn-flag').addEventListener('click', async () => {
      const reason = prompt('Reason for flagging this run:', p.flag_reason || 'Irregular gameplay speed');
      if (reason === null) return;
      const r = await window.CodeQuestDB.flagResult(p.id, reason);
      if (r.success) {
        showToast(`Flagged run for ${p.nickname}`, 'warning');
        closePlayerModal();
        await loadLeaderboard();
      }
    });

    document.getElementById('modal-btn-delete').addEventListener('click', async () => {
      if (confirm(`Permanently delete run for ${p.nickname}?`)) {
        const r = await window.CodeQuestDB.deleteResult(p.id);
        if (r.success) {
          showToast('Player entry deleted.', 'info');
          closePlayerModal();
          await loadLeaderboard();
        }
      }
    });
  }

  function closePlayerModal() {
    DOM.modal.classList.remove('active');
    activePlayerId = null;
  }

  DOM.btnCloseModal.addEventListener('click', closePlayerModal);
  DOM.modal.addEventListener('click', (e) => {
    if (e.target === DOM.modal) closePlayerModal();
  });

  // ==============================================================================
  // TOURNAMENT / COMPETITION CONFIGURATION
  // ==============================================================================

  async function loadCompetitionConfig() {
    const res = await window.CodeQuestDB.getCompetitionConfig();
    if (!res.success) {
      showToast('Could not load competition config: ' + res.error, 'error');
      return;
    }

    competitionConfig = res.data;

    // Update settings form
    DOM.cfgIsActive.checked = !!competitionConfig.is_active;
    DOM.cfgCompetitionName.value = competitionConfig.competition_name || 'Code Quest Championship';
    DOM.cfgTargetScore.value = competitionConfig.target_score || 2000;
    DOM.cfgParticipation.checked = !!competitionConfig.participation_reward_enabled;
    DOM.cfgTimeLimit.value = competitionConfig.time_limit_seconds || 180;

    if (competitionConfig.start_time) {
      DOM.cfgStartTime.value = new Date(competitionConfig.start_time).toISOString().slice(0, 16);
    }
    if (competitionConfig.end_time) {
      DOM.cfgEndTime.value = new Date(competitionConfig.end_time).toISOString().slice(0, 16);
    }

    renderPrizesList(competitionConfig.prizes || []);
    updateTournamentStatusUI(competitionConfig.is_active);
  }

  function renderPrizesList(prizes) {
    DOM.prizesContainer.innerHTML = '';
    const items = prizes.length > 0 ? prizes : [
      { place: 1, description: 'Champion Prize - Gold Medal' },
      { place: 2, description: 'Runner-up Prize - Silver Medal' },
      { place: 3, description: 'Third Place Prize - Bronze Medal' }
    ];

    items.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'prize-item-row';
      const label = idx === 0 ? '1st Place' : (idx === 1 ? '2nd Place' : (idx === 2 ? '3rd Place' : `${idx + 1}th Place`));
      row.innerHTML = `
        <span class="prize-badge">${label}</span>
        <input type="text" class="form-control prize-desc-input" data-place="${p.place || idx + 1}" value="${escapeHtml(p.description || '')}" placeholder="Prize description...">
      `;
      DOM.prizesContainer.appendChild(row);
    });
  }

  function updateTournamentStatusUI(isActive) {
    if (isActive) {
      DOM.statStatus.textContent = 'Active';
      DOM.statStatus.style.color = 'var(--accent-green)';
      DOM.btnToggleTournament.className = 'btn btn-danger';
      DOM.btnToggleTournament.innerHTML = '<span>Stop Competition</span>';
    } else {
      DOM.statStatus.textContent = 'Inactive';
      DOM.statStatus.style.color = 'var(--text-secondary)';
      DOM.btnToggleTournament.className = 'btn btn-success';
      DOM.btnToggleTournament.innerHTML = '<span>Start Competition</span>';
    }
  }

  DOM.settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btn-save-settings');
    btnSave.disabled = true;
    btnSave.innerHTML = '<span class="spinner"></span> Saving...';

    // Gather prizes
    const prizeInputs = DOM.prizesContainer.querySelectorAll('.prize-desc-input');
    const updatedPrizes = [];
    prizeInputs.forEach(input => {
      updatedPrizes.push({
        place: parseInt(input.getAttribute('data-place'), 10),
        description: input.value.trim()
      });
    });

    const newConfig = {
      competition_name: DOM.cfgCompetitionName.value.trim(),
      start_time: DOM.cfgStartTime.value ? new Date(DOM.cfgStartTime.value).toISOString() : null,
      end_time: DOM.cfgEndTime.value ? new Date(DOM.cfgEndTime.value).toISOString() : null,
      target_score: parseInt(DOM.cfgTargetScore.value, 10) || 2000,
      prize_count: updatedPrizes.length,
      prizes: updatedPrizes,
      participation_reward_enabled: DOM.cfgParticipation.checked,
      time_limit_seconds: parseInt(DOM.cfgTimeLimit.value, 10) || 180,
      is_active: DOM.cfgIsActive.checked
    };

    const res = await window.CodeQuestDB.updateCompetitionConfig(newConfig);
    btnSave.disabled = false;
    btnSave.innerHTML = '<span>Save Settings</span>';

    if (res.success) {
      showToast('Tournament configuration updated.', 'success');
      competitionConfig = newConfig;
      updateTournamentStatusUI(newConfig.is_active);
    } else {
      showToast(`Failed to save settings: ${res.error}`, 'error');
    }
  });

  DOM.btnToggleTournament.addEventListener('click', async () => {
    if (!competitionConfig) return;
    const nextState = !competitionConfig.is_active;
    DOM.btnToggleTournament.disabled = true;

    const res = await window.CodeQuestDB.updateCompetitionConfig({
      ...competitionConfig,
      is_active: nextState
    });

    DOM.btnToggleTournament.disabled = false;
    if (res.success) {
      competitionConfig.is_active = nextState;
      DOM.cfgIsActive.checked = nextState;
      updateTournamentStatusUI(nextState);
      showToast(nextState ? 'Tournament started!' : 'Tournament stopped.', nextState ? 'success' : 'info');
    } else {
      showToast(`Update error: ${res.error}`, 'error');
    }
  });

  // ==============================================================================
  // DANGER ZONE (RESET LEADERBOARD WITH TWO-STEP CONFIRMATION)
  // ==============================================================================

  DOM.btnDangerReset.addEventListener('click', async () => {
    const confirmation = prompt('WARNING: This will permanently delete ALL leaderboard submissions.\n\nType RESET in capital letters to proceed:');
    if (confirmation !== 'RESET') {
      if (confirmation !== null) {
        showToast('Reset cancelled: Confirmation phrase did not match.', 'warning');
      }
      return;
    }

    DOM.btnDangerReset.disabled = true;
    DOM.btnDangerReset.innerHTML = '<span class="spinner"></span> Resetting...';

    const res = await window.CodeQuestDB.resetLeaderboard();
    DOM.btnDangerReset.disabled = false;
    DOM.btnDangerReset.innerHTML = '<span>Reset Leaderboard</span>';

    if (res.success) {
      showToast('Tournament leaderboard was reset successfully.', 'success');
      currentLeaderboard = [];
      renderStats([]);
      sortAndRenderTable();
    } else {
      showToast(`Reset failed: ${res.error}`, 'error');
    }
  });

  // ==============================================================================
  // INITIALIZATION ON LOAD
  // ==============================================================================
  document.addEventListener('DOMContentLoaded', () => {
    // Wait briefly for Supabase layer initialization
    setTimeout(checkAuthSession, 50);
  });
})();

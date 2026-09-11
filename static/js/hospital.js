// Jaipur Green Corridor - Hospital Emergency Panel Module
class HospitalPanelManager {
  constructor(app) {
    this.app = app;
    this.isAuthenticated = false;
    this.authInfo = null;
  }

  init() {
    this.checkSession();
    this.bindEvents();
    this.render();
  }

  checkSession() {
    const token = sessionStorage.getItem('hosp_token');
    if (token) {
      this.isAuthenticated = true;
      this.authInfo = {
        displayName: sessionStorage.getItem('hosp_name') || 'SMS Hospital Emergency Trauma Wing',
        badge: 'Authorized Medical Officer'
      };
    }
  }

  bindEvents() {
    const loginForm = document.getElementById('hospital-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const quickFillBtn = document.getElementById('btn-quick-fill-hosp');
    if (quickFillBtn) {
      quickFillBtn.addEventListener('click', () => {
        const u = document.getElementById('hosp-username');
        const p = document.getElementById('hosp-password');
        if (u) u.value = 'Hospital';
        if (p) p.value = '001';
      });
    }

    const logoutBtn = document.getElementById('btn-hosp-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('hosp-username').value.trim();
    const pass = document.getElementById('hosp-password').value.trim();
    const errorEl = document.getElementById('hosp-login-error');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });

      if (!res.ok) {
        throw new Error('Invalid Hospital Authorization. Use Hospital and 001');
      }

      const data = await res.json();
      this.isAuthenticated = true;
      this.authInfo = data;
      sessionStorage.setItem('hosp_token', data.token);
      sessionStorage.setItem('hosp_name', data.displayName);
      if (errorEl) errorEl.classList.add('hidden');
      this.app.showToast('Authorized as Hospital Medical Command', 'success');
      this.render();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    }
  }

  handleLogout() {
    this.isAuthenticated = false;
    this.authInfo = null;
    sessionStorage.removeItem('hosp_token');
    sessionStorage.removeItem('hosp_name');
    this.render();
  }

  async authorizeEmergency(action) {
    try {
      const res = await fetch('/api/emergency/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          authorized_by: this.authInfo ? this.authInfo.displayName : 'Authorized Medical Staff',
          doctor_notes: 'Trauma Bay 1 Reserved, Cath Lab on Standby'
        })
      });
      const data = await res.json();
      if (action === 'APPROVE') {
        this.app.showToast('Green Corridor Authorized! Jaipur Traffic Signals Prioritized.', 'success');
      } else {
        this.app.showToast('Emergency request declined / diverted.', 'alert');
      }
    } catch (err) {
      console.error(err);
      this.app.showToast('Error authorizing corridor', 'alert');
    }
  }

  render() {
    const authContainer = document.getElementById('hospital-auth-container');
    const panelContainer = document.getElementById('hospital-active-panel');

    if (!this.isAuthenticated) {
      if (authContainer) authContainer.classList.remove('hidden');
      if (panelContainer) panelContainer.classList.add('hidden');
    } else {
      if (authContainer) authContainer.classList.add('hidden');
      if (panelContainer) panelContainer.classList.remove('hidden');
    }

    const state = this.app.state;
    const c = state ? state.active_corridor : null;

    const requestCard = document.getElementById('hosp-request-card');
    const noRequestCard = document.getElementById('hosp-no-request');

    if (!c || c.status === 'COMPLETED') {
      if (requestCard) requestCard.classList.add('hidden');
      if (noRequestCard) noRequestCard.classList.remove('hidden');
      return;
    }

    if (requestCard) requestCard.classList.remove('hidden');
    if (noRequestCard) noRequestCard.classList.add('hidden');

    // Populate patient & ambulance details safely
    const ambIdEl = document.getElementById('hosp-ambulance-id');
    if (ambIdEl) ambIdEl.textContent = c.ambulance_id;

    const pNameEl = document.getElementById('hosp-patient-name');
    if (pNameEl) pNameEl.textContent = c.patient_name;

    const eTypeEl = document.getElementById('hosp-emergency-type');
    if (eTypeEl) eTypeEl.textContent = c.emergency_type;
    
    const sevBadge = document.getElementById('hosp-severity-badge');
    if (sevBadge) {
      sevBadge.textContent = c.severity;
      if (c.severity.includes('Critical')) {
        sevBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200';
      } else if (c.severity.includes('Severe')) {
        sevBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200';
      } else {
        sevBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200';
      }
    }

    const pickupEl = document.getElementById('hosp-pickup-loc');
    if (pickupEl) pickupEl.textContent = c.origin.replace('_', ' ').toUpperCase();

    const destEl = document.getElementById('hosp-dest-hospital');
    if (destEl) destEl.textContent = c.destination.toUpperCase() + ' Hospital';

    const etaEl = document.getElementById('hosp-eta-val');
    if (etaEl) etaEl.textContent = c.green_corridor_eta_mins + ' mins';

    const distEl = document.getElementById('hosp-dist-val');
    if (distEl) distEl.textContent = c.distance_remaining_km + ' km';

    // Status & Action buttons
    const statusBadge = document.getElementById('hosp-status-badge');
    const actionButtons = document.getElementById('hosp-action-buttons');
    const transitInfo = document.getElementById('hosp-transit-info');

    if (c.status === 'REQUESTED') {
      if (statusBadge) {
        statusBadge.textContent = 'AWAITING MEDICAL AUTHORIZATION';
        statusBadge.className = 'px-3 py-1 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
      }
      if (actionButtons) actionButtons.classList.remove('hidden');
      if (transitInfo) transitInfo.classList.add('hidden');
    } else if (c.status === 'AUTHORIZED' || c.status === 'IN_TRANSIT') {
      if (statusBadge) {
        statusBadge.textContent = c.status === 'IN_TRANSIT' ? 'AMBULANCE EN ROUTE (GREEN CORRIDOR ACTIVE)' : 'CORRIDOR APPROVED - READY FOR DISPATCH';
        statusBadge.className = 'px-3 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300';
      }
      if (actionButtons) actionButtons.classList.add('hidden');
      if (transitInfo) transitInfo.classList.remove('hidden');

      const liveEta = document.getElementById('hosp-live-eta');
      if (liveEta) liveEta.textContent = `${c.green_corridor_eta_mins} mins`;
      const liveSpeed = document.getElementById('hosp-live-speed');
      if (liveSpeed) liveSpeed.textContent = `${c.speed_kmh} km/h`;
      const liveJunc = document.getElementById('hosp-live-junc');
      if (liveJunc) liveJunc.textContent = c.next_junction_name || 'Approaching destination';
    }
  }
}

window.HospitalPanelManager = HospitalPanelManager;

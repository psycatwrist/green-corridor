// Jaipur Green Corridor - Ambulance Driver Dispatch & HUD Module
class AmbulanceHUDManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    const form = document.getElementById('ambulance-request-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleRequestSubmit(e));
    }

    const startBtn = document.getElementById('btn-start-drive');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startDrive());
    }

    const pauseBtn = document.getElementById('btn-pause-drive');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseDrive());
    }

    const resetBtn = document.getElementById('btn-reset-drive');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetDrive());
    }

    const sosBtn = document.getElementById('btn-sos-ambulance');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => this.triggerSos());
    }
  }

  async handleRequestSubmit(e) {
    e.preventDefault();
    const payload = {
      ambulance_id: document.getElementById('amb-input-id')?.value.trim() || 'RJ-14-EA-2091',
      driver_name: document.getElementById('amb-input-driver')?.value.trim() || 'Ramesh Choudhary',
      patient_name: document.getElementById('amb-input-patient')?.value.trim() || 'Emergency Case',
      emergency_type: document.getElementById('amb-select-type')?.value || 'Acute STEMI / Cardiac Golden Hour',
      severity: document.getElementById('amb-select-severity')?.value || 'Level 1 - Critical',
      origin: document.getElementById('amb-select-origin')?.value || 'sindhi_camp',
      destination: document.getElementById('amb-select-dest')?.value || 'sms'
    };

    try {
      const res = await fetch('/api/emergency/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      this.app.showToast('Emergency Green Corridor Requested! Sent to Hospital for Authorization.', 'success');
      
      const c = data.corridor;
      if (c && this.app.mapManager) {
        this.app.mapManager.drawRoutes(c.waypoints);
        this.app.mapManager.updateAmbulanceMarker(c.lat, c.lng);
      }
    } catch (err) {
      console.error(err);
      this.app.showToast('Failed to submit emergency request', 'alert');
    }
  }

  async startDrive() {
    try {
      const res = await fetch('/api/emergency/start-trip', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Could not start drive');
      }
      this.app.showToast('Ambulance is moving! Green Corridor active.', 'success');
    } catch (err) {
      this.app.showToast(err.message, 'alert');
    }
  }

  async pauseDrive() {
    try {
      const res = await fetch('/api/emergency/pause-trip', { method: 'POST' });
      const data = await res.json();
      this.app.showToast(data.is_moving ? 'Driving resumed' : 'Driving paused', 'info');
    } catch (err) {
      console.error(err);
    }
  }

  async resetDrive() {
    try {
      await fetch('/api/emergency/reset', { method: 'POST' });
      this.app.showToast('Corridor reset to initial state', 'info');
    } catch (err) {
      console.error(err);
    }
  }

  triggerSos() {
    this.app.showToast('🚨 EMERGENCY HIGH-PRIORITY BROADCAST ACTIVE!', 'alert');
  }

  render() {
    const state = this.app.state;
    if (!state) return;
    const c = state.active_corridor;

    const requestFormCard = document.getElementById('amb-form-container');
    const hudCard = document.getElementById('amb-hud-container');

    if (!c) {
      if (requestFormCard) requestFormCard.classList.remove('hidden');
      if (hudCard) hudCard.classList.add('hidden');
      return;
    }

    if (requestFormCard) requestFormCard.classList.remove('hidden');
    if (hudCard) hudCard.classList.remove('hidden');

    // Populate Cockpit HUD
    const ambIdEl = document.getElementById('hud-amb-id');
    if (ambIdEl) ambIdEl.textContent = c.ambulance_id;

    const destNameEl = document.getElementById('hud-dest-name');
    if (destNameEl) destNameEl.textContent = c.destination.toUpperCase() + ' Hospital';

    const originNameEl = document.getElementById('hud-origin-name');
    if (originNameEl) originNameEl.textContent = c.origin.replace('_', ' ').toUpperCase();

    const speedEl = document.getElementById('hud-speed');
    if (speedEl) speedEl.textContent = Math.round(c.speed_kmh);

    const distEl = document.getElementById('hud-distance');
    if (distEl) distEl.textContent = `${c.distance_remaining_km} km`;

    const etaEl = document.getElementById('hud-eta');
    if (etaEl) etaEl.textContent = `${c.green_corridor_eta_mins}m`;

    const timeSaved = Math.max(0, (c.standard_eta_mins - c.green_corridor_eta_mins)).toFixed(1);
    const timeSavedEl = document.getElementById('hud-time-saved');
    if (timeSavedEl) timeSavedEl.textContent = `⚡ Saves ~${timeSaved} mins`;

    // Next junction info
    const nextJuncEl = document.getElementById('hud-next-junc');
    const nextDistEl = document.getElementById('hud-next-dist');
    const nextSignalEl = document.getElementById('hud-next-signal');

    if (nextJuncEl) nextJuncEl.textContent = c.next_junction_name || 'Approaching Emergency Ward';
    if (nextDistEl) nextDistEl.textContent = `${c.next_junction_dist_m || 200}m ahead`;

    if (nextSignalEl) {
      const isGreen = state.junctions && c.next_junction_id && state.junctions[c.next_junction_id]?.signal === 'GREEN';
      if (isGreen) {
        nextSignalEl.innerHTML = `<span class="px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 font-bold border border-emerald-300">PRIORITY GREEN</span>`;
      } else {
        nextSignalEl.innerHTML = `<span class="px-2.5 py-1 rounded bg-rose-100 text-rose-700 font-bold border border-rose-300">CLEARING QUEUE</span>`;
      }
    }

    // Status pill
    const statusPill = document.getElementById('hud-corridor-status');
    const startDriveBtn = document.getElementById('btn-start-drive');
    const pauseDriveBtn = document.getElementById('btn-pause-drive');

    if (statusPill) {
      if (c.status === 'REQUESTED') {
        statusPill.textContent = 'AWAITING HOSPITAL CLEARANCE';
        statusPill.className = 'px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse';
        if (startDriveBtn) startDriveBtn.disabled = true;
        if (pauseDriveBtn) pauseDriveBtn.disabled = true;
      } else if (c.status === 'AUTHORIZED') {
        statusPill.textContent = 'AUTHORIZED BY HOSPITAL - READY TO DRIVE';
        statusPill.className = 'px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        if (startDriveBtn) startDriveBtn.disabled = false;
        if (pauseDriveBtn) pauseDriveBtn.disabled = false;
      } else if (c.status === 'IN_TRANSIT') {
        statusPill.textContent = 'GREEN CORRIDOR ENGAGED - IN TRANSIT';
        statusPill.className = 'px-3 py-1 text-xs font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-300';
        if (startDriveBtn) startDriveBtn.disabled = true;
        if (pauseDriveBtn) pauseDriveBtn.disabled = false;
      } else if (c.status === 'COMPLETED') {
        statusPill.textContent = 'ARRIVED SAFELY AT DESTINATION';
        statusPill.className = 'px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
        if (startDriveBtn) startDriveBtn.disabled = true;
        if (pauseDriveBtn) pauseDriveBtn.disabled = true;
      }
    }
  }
}

window.AmbulanceHUDManager = AmbulanceHUDManager;

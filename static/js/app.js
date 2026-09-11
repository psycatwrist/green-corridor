// Jaipur Green Corridor - Main Application Coordinator
class GreenCorridorApp {
  constructor() {
    this.state = null;
    this.staticData = null;
    this.ws = null;
    this.activeTab = 'unified'; // default unified for best demo experience!
    this.mapManager = null;
    this.hospitalManager = null;
    this.trafficManager = null;
    this.ambulanceManager = null;
  }

  async init() {
    await this.fetchStaticData();
    this.initMap();
    this.initSubModules();
    this.bindGlobalEvents();
    this.initWebSocket();
  }

  async fetchStaticData() {
    try {
      const res = await fetch('/api/data');
      this.staticData = await res.json();
    } catch (e) {
      console.error('Failed to load static data:', e);
    }
  }

  initMap() {
    this.mapManager = new JaipurMapManager('jaipur-map');
    this.mapManager.init();

    if (this.staticData) {
      this.mapManager.renderHospitals(this.staticData.hospitals);
      this.mapManager.renderJunctions(this.staticData.junctions, (juncId) => {
        if (this.trafficManager) this.trafficManager.openCctvModal(juncId);
      });
    }
  }

  initSubModules() {
    this.hospitalManager = new HospitalPanelManager(this);
    this.hospitalManager.init();
    window.hospitalManager = this.hospitalManager;

    this.trafficManager = new TrafficControlManager(this);
    this.trafficManager.init();
    window.trafficManager = this.trafficManager;

    this.ambulanceManager = new AmbulanceHUDManager(this);
    this.ambulanceManager.init();
    window.ambulanceManager = this.ambulanceManager;
  }

  initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.updateWsIndicator(true);
      this.showToast('Connected to Jaipur Emergency Traffic Grid', 'success');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = json = JSON.parse(event.data);
        this.handleWsMessage(msg);
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    this.ws.onclose = () => {
      this.updateWsIndicator(false);
      setTimeout(() => this.initWebSocket(), 3000);
    };

    this.ws.onerror = (err) => {
      console.error('WS error:', err);
      this.updateWsIndicator(false);
    };
  }

  updateWsIndicator(isConnected) {
    const dot = document.getElementById('ws-status-dot');
    const text = document.getElementById('ws-status-text');
    if (dot && text) {
      if (isConnected) {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400';
        text.textContent = 'Live Grid Connected';
        text.className = 'text-xs font-semibold text-emerald-700';
      } else {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse';
        text.textContent = 'Connecting...';
        text.className = 'text-xs font-semibold text-rose-700';
      }
    }
  }

  handleWsMessage(msg) {
    switch (msg.type) {
      case 'INIT_STATE':
        this.state = msg.data;
        this.onStateLoaded();
        break;

      case 'TELEMETRY_TICK':
        if (this.state && this.state.active_corridor) {
          const c = this.state.active_corridor;
          c.lat = msg.data.lat;
          c.lng = msg.data.lng;
          c.heading = msg.data.heading;
          c.speed_kmh = msg.data.speed_kmh;
          c.progress_step = msg.data.progress_step;
          c.distance_remaining_km = msg.data.distance_remaining_km;
          c.green_corridor_eta_mins = msg.data.green_corridor_eta_mins;
          c.next_junction_id = msg.data.next_junction_id;
          c.next_junction_name = msg.data.next_junction_name;
          c.next_junction_dist_m = msg.data.next_junction_dist_m;
          this.state.junctions = msg.data.junctions;

          if (this.mapManager) {
            this.mapManager.updateAmbulanceMarker(c.lat, c.lng, c.heading);
            this.mapManager.updateJunctionSignals(this.state.junctions);
          }

          if (this.ambulanceManager) this.ambulanceManager.render();
          if (this.trafficManager) this.trafficManager.render();
          if (this.hospitalManager) this.hospitalManager.render();
        }
        break;

      case 'CORRIDOR_REQUESTED':
      case 'CORRIDOR_AUTHORIZED':
      case 'TRIP_STARTED':
      case 'CORRIDOR_COMPLETED':
      case 'CORRIDOR_RESET':
      case 'CORRIDOR_REROUTED':
        this.state = msg.data;
        if (msg.message) this.showToast(msg.message, 'info');
        this.onStateLoaded();
        break;

      case 'INCIDENT_DETECTED':
        this.state = msg.data;
        if (this.mapManager) this.mapManager.showIncident(msg.incident);
        if (msg.message) this.showToast(msg.message, 'alert');
        this.renderAll();
        break;

      case 'INCIDENT_CLEARED':
        this.state = msg.data;
        if (this.mapManager) this.mapManager.clearIncident();
        if (msg.message) this.showToast(msg.message, 'success');
        this.renderAll();
        break;

      case 'JUNCTION_OVERRIDE':
        if (this.state && this.state.junctions) {
          this.state.junctions[msg.junction.id] = msg.junction;
          if (this.mapManager) this.mapManager.updateJunctionSignals(this.state.junctions);
          if (this.trafficManager) this.trafficManager.render();
        }
        break;
    }
  }

  onStateLoaded() {
    if (!this.state) return;

    // Draw active routes on map
    if (this.state.active_corridor && this.mapManager) {
      const c = this.state.active_corridor;
      // Also get alternate route if available
      let altWaypoints = null;
      if (this.staticData && this.staticData.routes && this.staticData.routes[c.route_key]) {
        altWaypoints = this.staticData.routes[c.route_key].alternate?.waypoints;
      }

      this.mapManager.drawRoutes(c.waypoints, altWaypoints);
      this.mapManager.updateAmbulanceMarker(c.lat, c.lng, c.heading);
      this.mapManager.updateJunctionSignals(this.state.junctions);

      if (this.state.incident) {
        this.mapManager.showIncident(this.state.incident);
      } else {
        this.mapManager.clearIncident();
      }
    }

    this.renderAll();
  }

  renderAll() {
    if (this.hospitalManager) this.hospitalManager.render();
    if (this.trafficManager) this.trafficManager.render();
    if (this.ambulanceManager) this.ambulanceManager.render();
  }

  bindGlobalEvents() {
    // Top tab switching
    const tabs = ['btn-tab-unified', 'btn-tab-traffic', 'btn-tab-hospital', 'btn-tab-ambulance'];
    tabs.forEach(tabId => {
      const el = document.getElementById(tabId);
      if (el) {
        el.addEventListener('click', () => {
          const tabName = tabId.replace('btn-tab-', '');
          this.switchTab(tabName);
        });
      }
    });

    // Speed buttons
    ['btn-speed-1x', 'btn-speed-2x', 'btn-speed-4x'].forEach(speedId => {
      const el = document.getElementById(speedId);
      if (el) {
        el.addEventListener('click', async () => {
          const val = parseFloat(speedId.replace('btn-speed-', '').replace('x', ''));
          await fetch('/api/emergency/speed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speed: val })
          });
          this.highlightSpeedButton(speedId);
        });
      }
    });

    // Global reset button
    const resetBtn = document.getElementById('btn-global-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        await fetch('/api/emergency/reset', { method: 'POST' });
        this.showToast('Simulation reset to initial demo state', 'info');
      });
    }

    // Recenter map button
    const recenterBtn = document.getElementById('btn-recenter-map');
    if (recenterBtn && this.mapManager) {
      recenterBtn.addEventListener('click', () => this.mapManager.resetView());
    }
  }

  highlightSpeedButton(activeId) {
    ['btn-speed-1x', 'btn-speed-2x', 'btn-speed-4x'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeId) {
          el.className = 'px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-600 text-white shadow-sm';
        } else {
          el.className = 'px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700';
        }
      }
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Highlight tab button
    ['unified', 'traffic', 'hospital', 'ambulance'].forEach(t => {
      const btn = document.getElementById(`btn-tab-${t}`);
      if (btn) {
        if (t === tabName) {
          btn.className = 'px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 text-white shadow-sm flex items-center gap-1.5 transition';
        } else {
          btn.className = 'px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5';
        }
      }
    });

    const unifiedContainer = document.getElementById('panel-unified');
    const trafficContainer = document.getElementById('panel-traffic');
    const hospitalContainer = document.getElementById('panel-hospital');
    const ambulanceContainer = document.getElementById('panel-ambulance');

    if (tabName === 'unified') {
      if (unifiedContainer) unifiedContainer.classList.remove('hidden');
      if (trafficContainer) trafficContainer.classList.add('hidden');
      if (hospitalContainer) hospitalContainer.classList.add('hidden');
      if (ambulanceContainer) ambulanceContainer.classList.add('hidden');
    } else if (tabName === 'traffic') {
      if (unifiedContainer) unifiedContainer.classList.add('hidden');
      if (trafficContainer) trafficContainer.classList.remove('hidden');
      if (hospitalContainer) hospitalContainer.classList.add('hidden');
      if (ambulanceContainer) ambulanceContainer.classList.add('hidden');
    } else if (tabName === 'hospital') {
      if (unifiedContainer) unifiedContainer.classList.add('hidden');
      if (trafficContainer) trafficContainer.classList.add('hidden');
      if (hospitalContainer) hospitalContainer.classList.remove('hidden');
      if (ambulanceContainer) ambulanceContainer.classList.add('hidden');
    } else if (tabName === 'ambulance') {
      if (unifiedContainer) unifiedContainer.classList.add('hidden');
      if (trafficContainer) trafficContainer.classList.add('hidden');
      if (hospitalContainer) hospitalContainer.classList.add('hidden');
      if (ambulanceContainer) ambulanceContainer.classList.remove('hidden');
    }

    // Invalidate map size so Leaflet renders correctly after layout change
    setTimeout(() => {
      if (this.mapManager && this.mapManager.map) {
        this.mapManager.map.invalidateSize();
      }
    }, 100);
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'alert') icon = '🚨';

    toast.innerHTML = `
      <div class="flex items-start gap-2.5">
        <span class="text-base">${icon}</span>
        <div class="flex-1">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new GreenCorridorApp();
  window.app = app;
  app.init();
});

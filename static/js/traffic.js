// Jaipur Green Corridor - Traffic Control Centre (TMC) & Computer Vision Simulation
class TrafficControlManager {
  constructor(app) {
    this.app = app;
    this.activeCctvJunctionId = 'J9'; // Default SMS Hospital junction
    this.cctvAnimationId = null;
    this.cvVehicles = [];
    this.initCvSimData();
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Incident injection buttons
    const btnSimBlockage = document.getElementById('btn-sim-blockage');
    if (btnSimBlockage) {
      btnSimBlockage.addEventListener('click', () => this.injectIncident());
    }

    const btnClearIncident = document.getElementById('btn-clear-incident');
    if (btnClearIncident) {
      btnClearIncident.addEventListener('click', () => this.clearIncident());
    }

    const btnReroute = document.getElementById('btn-tmc-reroute');
    if (btnReroute) {
      btnReroute.addEventListener('click', () => this.executeReroute());
    }

    const closeCctvBtn = document.getElementById('btn-close-cctv');
    if (closeCctvBtn) {
      closeCctvBtn.addEventListener('click', () => this.closeCctvModal());
    }
  }

  initCvSimData() {
    // Seed initial synthetic vehicles for the CCTV Canvas
    this.cvVehicles = [
      { x: 60, y: 120, w: 45, h: 30, type: 'Car', label: 'Car [0.94]', speed: 1.5, color: '#3b82f6', cleared: false },
      { x: 140, y: 160, w: 32, h: 22, type: 'Auto', label: 'Auto [0.91]', speed: 1.2, color: '#eab308', cleared: false },
      { x: 220, y: 100, w: 20, h: 14, type: 'Bike', label: 'Motorcycle [0.88]', speed: 2.0, color: '#10b981', cleared: false },
      { x: 180, y: 200, w: 55, h: 36, type: 'Bus', label: 'RSRTC Bus [0.96]', speed: 0.8, color: '#ef4444', cleared: false },
      { x: 80, y: 240, w: 48, h: 32, type: 'Car', label: 'Car [0.93]', speed: 1.6, color: '#8b5cf6', cleared: false }
    ];
  }

  render() {
    const state = this.app.state;
    if (!state) return;

    this.renderJunctionTable(state.junctions);
    this.renderIncidentBanner(state.incident);
    this.renderAnalytics(state.analytics, state.active_corridor);
  }

  renderJunctionTable(junctions) {
    const tbody = document.getElementById('tmc-junctions-body');
    if (!tbody) return;

    const corridor = this.app.state ? this.app.state.active_corridor : null;
    const corridorJuncIds = (corridor && corridor.junction_ids) ? corridor.junction_ids : [];

    tbody.innerHTML = Object.values(junctions).map(j => {
      const isCorridorJunc = corridorJuncIds.includes(j.id);
      const isGreen = j.signal === 'GREEN';
      const isOverride = j.status === 'GREEN_CORRIDOR_OVERRIDE';
      const isManual = j.status === 'MANUAL_POLICE_OVERRIDE';

      let statusBadge = `<span class="px-2 py-0.5 text-xs rounded font-medium bg-slate-100 text-slate-700">Auto Cycle</span>`;
      if (isOverride) {
        statusBadge = `<span class="px-2 py-0.5 text-xs rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">⚡ Corridor Green</span>`;
      } else if (isManual) {
        statusBadge = `<span class="px-2 py-0.5 text-xs rounded font-bold bg-purple-100 text-purple-800 border border-purple-300">👮 Police Override</span>`;
      }

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition ${isCorridorJunc ? 'bg-emerald-50/40' : ''}">
          <td class="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full ${isGreen ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-rose-500'}"></span>
            ${j.name}
            ${isCorridorJunc ? '<span class="text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full font-bold">Corridor</span>' : ''}
          </td>
          <td class="py-2.5 px-3 text-xs text-slate-500 hidden sm:table-cell">${j.road}</td>
          <td class="py-2.5 px-3 text-xs font-mono font-bold ${isGreen ? 'text-emerald-600' : 'text-rose-600'}">
            ${j.signal}
          </td>
          <td class="py-2.5 px-3 text-xs">
            ${statusBadge}
          </td>
          <td class="py-2.5 px-3 text-xs text-slate-600 hidden md:table-cell">
            ${j.queue_meters}m (${j.vehicle_count} veh)
          </td>
          <td class="py-2.5 px-3 text-right space-x-1">
            <button onclick="window.trafficManager.openCctvModal('${j.id}')" 
              class="px-2 py-1 text-xs font-medium rounded bg-sky-50 text-sky-700 hover:bg-sky-100 transition" title="Inspect Live CCTV Feed">
              📹 CCTV
            </button>
            <button onclick="window.trafficManager.overrideSignal('${j.id}', 'GREEN')" 
              class="px-2 py-1 text-xs font-medium rounded ${isGreen ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-100 text-emerald-700'} transition">
              Force Green
            </button>
            <button onclick="window.trafficManager.overrideSignal('${j.id}', 'RED')" 
              class="px-2 py-1 text-xs font-medium rounded ${!isGreen ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-rose-100 text-rose-700'} transition">
              Hold Red
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderIncidentBanner(incident) {
    const banner = document.getElementById('tmc-incident-banner');
    if (!banner) return;

    if (incident) {
      banner.classList.remove('hidden');
      document.getElementById('tmc-incident-title').textContent = `ROAD OBSTRUCTION DETECTED: ${incident.junction_name}`;
      document.getElementById('tmc-incident-desc').textContent = `${incident.description} at ${incident.road}. AI recommends dynamic reroute.`;
    } else {
      banner.classList.add('hidden');
    }
  }

  renderAnalytics(analytics, corridor) {
    if (!analytics) return;
    const timeSavedEl = document.getElementById('metric-time-saved');
    if (timeSavedEl) {
      const saved = corridor ? Math.max(0, (corridor.standard_eta_mins - corridor.green_corridor_eta_mins)).toFixed(1) : analytics.avg_time_saved_mins;
      timeSavedEl.textContent = `${saved} mins`;
    }

    const speedEl = document.getElementById('metric-avg-speed');
    if (speedEl) {
      const speed = corridor && corridor.speed_kmh > 0 ? corridor.speed_kmh : analytics.avg_transit_speed_kmh;
      speedEl.textContent = `${speed} km/h`;
    }

    const scoreEl = document.getElementById('metric-response-score');
    if (scoreEl) {
      scoreEl.textContent = `${analytics.emergency_response_score}/100`;
    }
  }

  async overrideSignal(junctionId, signal) {
    try {
      const res = await fetch('/api/traffic/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ junction_id: junctionId, signal: signal })
      });
      const data = await res.json();
      this.app.showToast(`Signal at ${data.junction.name} forced to ${signal}`, 'info');
    } catch (err) {
      console.error(err);
    }
  }

  async injectIncident() {
    const corridor = this.app.state ? this.app.state.active_corridor : null;
    const targetJunc = (corridor && corridor.junction_ids.length > 2) ? corridor.junction_ids[1] : 'J3';

    try {
      const res = await fetch('/api/traffic/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          junction_id: targetJunc,
          description: 'Emergency road maintenance & heavy slow-moving commercial traffic'
        })
      });
      this.app.showToast('Incident injected on active corridor! AI recommendation triggered.', 'alert');
    } catch (err) {
      console.error(err);
    }
  }

  async clearIncident() {
    try {
      await fetch('/api/traffic/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ junction_id: 'CLEAR', description: '' })
      });
      this.app.showToast('Obstruction cleared! Normal signal cycling resumed.', 'success');
    } catch (err) {
      console.error(err);
    }
  }

  async executeReroute() {
    try {
      const res = await fetch('/api/emergency/reroute', { method: 'POST' });
      const data = await res.json();
      this.app.showToast(`AI Rerouting Successful: Switched to ${data.corridor.route_name}`, 'success');
      // Redraw routes on map
      const state = this.app.state;
      if (state && state.active_corridor && this.app.mapManager) {
        this.app.mapManager.drawRoutes(state.active_corridor.waypoints);
      }
    } catch (err) {
      console.error(err);
      this.app.showToast('Could not execute reroute', 'alert');
    }
  }

  // --- AI Computer Vision CCTV Simulation ---
  openCctvModal(junctionId) {
    this.activeCctvJunctionId = junctionId;
    const state = this.app.state;
    const j = state && state.junctions ? state.junctions[junctionId] : null;

    const modal = document.getElementById('cctv-modal');
    if (modal) modal.classList.remove('hidden');

    if (j) {
      document.getElementById('cctv-junction-name').textContent = `${j.name} (${j.cam_id})`;
      document.getElementById('cctv-road-name').textContent = j.road;
      document.getElementById('cctv-signal-state').textContent = `SIGNAL: ${j.signal}`;
    }

    this.startCctvCanvas();
  }

  closeCctvModal() {
    const modal = document.getElementById('cctv-modal');
    if (modal) modal.classList.add('hidden');
    if (this.cctvAnimationId) {
      cancelAnimationFrame(this.cctvAnimationId);
      this.cctvAnimationId = null;
    }
  }

  startCctvCanvas() {
    const canvas = document.getElementById('cctv-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark asphalt junction background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road lane markers
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stop line & crosswalk zebra
      ctx.fillStyle = '#64748b';
      for (let i = 20; i < canvas.width - 20; i += 30) {
        ctx.fillRect(i, canvas.height - 40, 16, 30);
      }

      const state = this.app.state;
      const j = state && state.junctions ? state.junctions[this.activeCctvJunctionId] : null;
      const isCorridorGreen = j && j.signal === 'GREEN' && j.status === 'GREEN_CORRIDOR_OVERRIDE';

      // Animate synthetic vehicles & bounding boxes
      this.cvVehicles.forEach((v, idx) => {
        if (isCorridorGreen) {
          // Move vehicles off the lane to clear corridor path!
          v.x += (idx % 2 === 0 ? 1.5 : -1.5);
          v.y += v.speed * 1.5;
        } else {
          v.y += v.speed * 0.4;
        }

        if (v.y > canvas.height + 20) {
          v.y = -30;
          v.x = 40 + (idx * 55) % (canvas.width - 100);
        }

        // Vehicle body
        ctx.fillStyle = v.color;
        ctx.fillRect(v.x, v.y, v.w, v.h);

        // Computer Vision YOLO-style bounding box
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(v.x - 3, v.y - 3, v.w + 6, v.h + 6);

        // Bounding box label
        ctx.fillStyle = '#10b981';
        ctx.fillRect(v.x - 3, v.y - 17, v.w + 24, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(v.label, v.x - 1, v.y - 6);
      });

      // Render Emergency Ambulance if corridor green is active!
      if (isCorridorGreen) {
        const ambX = canvas.width / 2 - 20;
        const ambY = canvas.height - 110;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ambX, ambY, 40, 60);

        // Red Cross
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ambX + 16, ambY + 20, 8, 20);
        ctx.fillRect(ambX + 10, ambY + 26, 20, 8);

        // Bounding box for Ambulance
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(ambX - 4, ambY - 4, 48, 68);

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(ambX - 4, ambY - 20, 110, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillText('EMERGENCY AMBULANCE [0.99]', ambX - 1, ambY - 8);

        // Flashing blue/red sirens
        const flash = (Date.now() % 400 < 200);
        ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(ambX + 12, ambY + 8, 4, 0, Math.PI * 2);
        ctx.arc(ambX + 28, ambY + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Live Timestamp & FPS counter in corner
      ctx.fillStyle = '#10b981';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`CAM FPS: 29.97 | AI MODEL: YOLOv9-TrafficJaipur | JUNC: ${this.activeCctvJunctionId}`, 12, 20);

      // AI Clearance Percentage
      const clearanceVal = isCorridorGreen ? 98 : (j ? j.ai_clearance_percent : 45);
      const cvStatusEl = document.getElementById('cctv-cv-status');
      if (cvStatusEl) {
        if (clearanceVal >= 90) {
          cvStatusEl.innerHTML = `<span class="text-emerald-400 font-bold">PATH SECURED (${clearanceVal}% CLEARED) - GREEN WAVE VERIFIED</span>`;
        } else {
          cvStatusEl.innerHTML = `<span class="text-amber-400 font-medium">QUEUE CLEARANCE: ${clearanceVal}% IN PROGRESS</span>`;
        }
      }

      this.cctvAnimationId = requestAnimationFrame(renderFrame);
    };

    this.cctvAnimationId = requestAnimationFrame(renderFrame);
  }
}

window.TrafficControlManager = TrafficControlManager;

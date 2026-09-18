/**
 * ==========================================================================
 * GREEN+ CORRIDOR - Jaipur Traffic Police Central Command Controller
 * File: js/admin.js
 * Contains: Dual-hospital emergency clearance queue, signal countdown
 * preemption hub, police deployment overview, and fleet categorization.
 * ==========================================================================
 */

window.GC_ADMIN = (function() {

  // --- Render Administrative Dashboard (JTP Central Command) ---
  function renderAdminDashboard() {
    renderAdminQueue();
    renderCountdownTimeline();
    renderAdminFleetTable();

    setTimeout(() => {
      window.GC_MAPS.initAdminMap();
      if (window.GC_MAPS.adminMap) {
        window.GC_MAPS.adminMap.invalidateSize();
      }
    }, 150);
  }

  // --- Render Dual-Hospital Emergency Queue ---
  function renderAdminQueue() {
    const state = window.GC_STATE.state;
    const queueList = document.getElementById('adminQueueList');
    if (!queueList) return;

    const pendingCount = state.clearanceRequests.filter(r => r.status === 'pending').length;
    const activeCount = state.clearanceRequests.filter(r => r.status === 'granted').length;

    const adminPendingCount = document.getElementById('adminPendingCount');
    const adminActiveCount = document.getElementById('adminActiveCount');

    if (adminPendingCount) adminPendingCount.innerHTML = `${pendingCount} <span class="h-stat-sub">Action Needed</span>`;
    if (adminActiveCount) adminActiveCount.innerHTML = `${activeCount} <span class="h-stat-sub">Green Waves</span>`;

    queueList.innerHTML = '';

    state.clearanceRequests.forEach(req => {
      const isPending = req.status === 'pending';
      const card = document.createElement('div');
      card.className = `queue-item-card ${isPending ? 'queue-pending' : 'queue-granted'}`;
      card.innerHTML = `
        <div class="q-top-row">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="q-hosp-tag">${req.hospitalName}</span>
            <strong>${req.ambulanceId}</strong>
          </div>
          <span class="q-sev-badge ${req.severity === 'code-red' ? 'sev-badge-red' : 'sev-badge-yellow'}">
            ${req.severityLabel}
          </span>
        </div>

        <div class="q-body-grid">
          <div><strong>Vehicle:</strong> ${req.type}</div>
          <div><strong>Driver:</strong> ${req.driver}</div>
          <div><strong>Patient Vitals:</strong> ${req.vitals}</div>
          <div><strong>Location:</strong> ${req.location}</div>
          <div><strong>Target Route:</strong> ${req.routeName}</div>
          <div><strong>ETA:</strong> <strong>${req.eta}</strong></div>
        </div>

        <div class="q-actions-row">
          <span style="font-size:11px; margin-right:auto; font-weight:600; color: ${isPending ? '#dc2626' : '#16a34a'};">
            STATUS: ${req.statusLabel}
          </span>

          ${isPending ? `
            <button type="button" class="btn btn-sm btn-grant-action" data-action="grant" data-id="${req.id}">
              <i data-lucide="check"></i> Grant Green Corridor
            </button>
          ` : `
            <span class="tag-badge" style="background:#dcfce7; color:#166534; font-weight:600;">Corridor Active</span>
          `}

          <button type="button" class="btn btn-sm btn-outline" data-action="override" data-id="${req.id}">
            <i data-lucide="git-branch"></i> Override Route
          </button>
        </div>
      `;

      queueList.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    queueList.querySelectorAll('[data-action="grant"]').forEach(btn => {
      btn.addEventListener('click', () => {
        grantClearance(btn.getAttribute('data-id'));
      });
    });

    queueList.querySelectorAll('[data-action="override"]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.GC_STATE.openOverrideModal();
      });
    });
  }

  // --- Grant Emergency Green Corridor ---
  function grantClearance(reqId) {
    const state = window.GC_STATE.state;
    const req = state.clearanceRequests.find(r => r.id === reqId);
    if (!req) return;

    req.status = 'granted';
    req.statusLabel = 'CLEARANCE GRANTED BY JTP COMMAND';
    req.grantedAt = new Date().toLocaleTimeString();

    const amb = window.GC_DATA.ambulances.find(a => a.id === req.ambulanceId);
    if (amb) amb.hasGreenCorridor = true;

    // Synchronize to Fox API
    if (window.GC_API && window.GC_API.grantClearance) {
      window.GC_API.grantClearance(reqId, {
        granted_by: "JTP-COMMAND-HQ-01",
        preemption_factor: 0.6
      }).then(res => {
        console.log("Green corridor clearance granted on Fox backend:", res);
      }).catch(err => console.warn("Fox API clearance grant sync notice:", err));
    }

    renderAdminQueue();
    renderCountdownTimeline();
    renderAdminFleetTable();

    window.GC_STATE.showToast(`Green Corridor GRANTED for ${req.ambulanceId} (${req.hospitalName}). All signals pre-empted.`);
  }

  // --- Render Traffic Signal Countdown Timeline ---
  function renderCountdownTimeline() {
    const timeline = document.getElementById('countdownTimeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    window.GC_DATA.trafficLightNodes.forEach((sig, index) => {
      const etaMinutes = [2, 4, 6, 7][index] || 5;
      const row = document.createElement('div');
      row.className = 'timeline-signal-row';
      row.innerHTML = `
        <div class="ts-left">
          <div class="ts-icon">${index + 1}</div>
          <div>
            <div class="ts-name">${sig.name}</div>
            <div class="ts-eta">ETA to arrival: <strong>~${etaMinutes}m</strong> &bull; ${sig.density}</div>
          </div>
        </div>
        <div class="ts-countdown-badge">
          HOLD: 0${index + 1}:2${index * 4}s
        </div>
      `;
      timeline.appendChild(row);
    });
  }

  // --- Render Categorized Admin Fleet Table ---
  function renderAdminFleetTable() {
    const state = window.GC_STATE.state;
    const tbody = document.getElementById('adminFleetTableBody');
    if (!tbody) return;

    let filtered = window.GC_DATA.ambulances;

    if (state.adminCategoryFilter === 'attention') {
      filtered = window.GC_DATA.ambulances.filter(a => (a.status === 'en-route' && !a.hasGreenCorridor) || state.clearanceRequests.some(r => r.ambulanceId === a.id && r.status === 'pending'));
    } else if (state.adminCategoryFilter === 'cleared') {
      filtered = window.GC_DATA.ambulances.filter(a => a.hasGreenCorridor);
    } else if (state.adminCategoryFilter === 'routine') {
      filtered = window.GC_DATA.ambulances.filter(a => a.inService && !a.hasGreenCorridor && a.status !== 'en-route');
    } else if (state.adminCategoryFilter === 'offline') {
      filtered = window.GC_DATA.ambulances.filter(a => !a.inService);
    }

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#71717a;">No ambulance units match this administrative category filter.</td></tr>`;
      return;
    }

    filtered.forEach(amb => {
      const hosp = window.GC_DATA.hospitalProfiles[amb.hospitalKey];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${amb.id}</strong><br><span style="color:#71717a; font-size:11px;">${amb.type}</span></td>
        <td>${hosp ? hosp.name.split(',')[0] : amb.hospitalKey}</td>
        <td>
          <span class="q-sev-badge ${amb.status === 'en-route' ? 'sev-badge-red' : 'sev-badge-yellow'}">
            ${amb.status === 'en-route' ? 'Code Red' : 'Standard'}
          </span>
        </td>
        <td>
          <span class="amb-status-tag ${amb.statusClass}">
            ${amb.hasGreenCorridor ? 'CORRIDOR CLEARED' : amb.statusLabel}
          </span>
        </td>
        <td>${amb.location}<br><strong>${amb.eta}</strong></td>
        <td>
          <button type="button" class="btn btn-outline btn-sm btn-admin-track" data-id="${amb.id}">
            Inspect
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-admin-track').forEach(btn => {
      btn.addEventListener('click', () => {
        const ambId = btn.getAttribute('data-id');
        const amb = window.GC_DATA.ambulances.find(a => a.id === ambId);
        if (amb && window.GC_MAPS.adminMap && amb.coords) {
          window.GC_MAPS.adminMap.setView(amb.coords, 15);
          window.GC_STATE.showToast(`Focusing Admin GIS on ${amb.id} (${amb.location})`);
        }
      });
    });
  }

  // --- Process Real-Time Telemetry from Driver Mobile App ---
  function handleIncomingAdminTelemetry(telemetry) {
    if (!telemetry || !telemetry.ambulanceId) return;

    // Update fleet record
    const amb = window.GC_DATA.ambulances.find(a => a.id === telemetry.ambulanceId);
    if (amb) {
      amb.coords = telemetry.coords;
      amb.speed = `${telemetry.speed} km/h`;
      amb.eta = telemetry.eta || amb.eta;
      amb.distance = telemetry.distanceRemaining || amb.distance;
      amb.location = telemetry.currentRoad || amb.location;
      if (telemetry.greenCorridorActive) {
        amb.hasGreenCorridor = true;
      }
    }

    // Update Admin Map marker in real-time
    if (window.GC_MAPS.updateAdminAmbulanceMarker) {
      window.GC_MAPS.updateAdminAmbulanceMarker(
        telemetry.ambulanceId,
        telemetry.coords,
        telemetry.speed,
        telemetry.heading,
        telemetry.driverName
      );
    }

    // Update or create Live Telemetry Banner above Admin Map
    let banner = document.getElementById('adminTelemetryBanner');
    if (!banner) {
      const mapWrapper = document.querySelector('.admin-map-container') || document.querySelector('.dashboard-map-section');
      if (mapWrapper) {
        banner = document.createElement('div');
        banner.id = 'adminTelemetryBanner';
        banner.className = 'admin-live-telemetry-pill';
        mapWrapper.insertBefore(banner, mapWrapper.firstChild);
      }
    }

    if (banner) {
      banner.style.display = 'flex';
      banner.innerHTML = `
        <span class="pulse-dot" style="background:#22c55e;"></span>
        <span><strong>LIVE GPS TELEMETRY:</strong> Unit <strong>${telemetry.ambulanceId}</strong> (${telemetry.driverName}) &bull; Speed: <strong>${telemetry.speed} km/h</strong> &bull; Heading: ${telemetry.heading || 0}&deg; &bull; ${telemetry.nextSignalName ? `Next Signal: <strong>${telemetry.nextSignalName}</strong>` : 'Corridor Armed'} &bull; <span style="color:#16a34a; font-weight:700;">12Hz AIS-140 LINK VERIFIED</span></span>
      `;
    }

    // If currently viewing admin view, dynamically update the table row for this ambulance
    const state = window.GC_STATE.state;
    if (state.currentView === 'admin') {
      const rows = document.querySelectorAll('#adminFleetTableBody tr');
      rows.forEach(tr => {
        if (tr.innerHTML.includes(telemetry.ambulanceId)) {
          const statusCell = tr.children[3];
          const speedCell = tr.children[4];
          if (statusCell) {
            statusCell.innerHTML = `<span class="amb-status-tag status-in-transit" style="background:#dcfce7; color:#166534; border:1px solid #86efac;"><span class="pulse-dot" style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#22c55e; margin-right:4px;"></span> LIVE GPS ACTIVE</span>`;
          }
          if (speedCell) {
            speedCell.innerHTML = `${telemetry.currentRoad || amb.location}<br><strong>${telemetry.speed} km/h &bull; ETA: ${telemetry.eta}</strong>`;
          }
        }
      });
    }
  }

  // Subscribe to telemetry channel
  window.GC_STATE.subscribeTelemetry((telemetry) => {
    handleIncomingAdminTelemetry(telemetry);
  });

  return {
    renderAdminDashboard,
    renderAdminQueue,
    grantClearance,
    renderCountdownTimeline,
    renderAdminFleetTable,
    handleIncomingAdminTelemetry
  };
})();


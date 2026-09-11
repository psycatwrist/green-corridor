// Jaipur Green Corridor - Map Manager (Leaflet.js)
class JaipurMapManager {
  constructor(mapContainerId) {
    this.containerId = mapContainerId;
    this.map = null;
    this.hospitalMarkers = {};
    this.junctionMarkers = {};
    this.ambulanceMarker = null;
    this.corridorLine = null;
    this.corridorDashLine = null;
    this.alternateLine = null;
    this.incidentMarker = null;
    this.isAutoFollowing = false;
  }

  init(center = [26.9024, 75.8050], zoom = 13) {
    if (this.map) return;

    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView(center, zoom);

    // Clean modern light basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    L.control.attribution({ position: 'bottomright', prefix: 'Jaipur Traffic Police & Emergency Grid' }).addTo(this.map);
  }

  renderHospitals(hospitals) {
    hospitals.forEach(h => {
      const icon = L.divIcon({
        className: 'custom-hospital-icon',
        html: `
          <div class="hospital-marker-pin" title="${h.name}">
            <span style="font-size:13px;">🏥</span>
            <span>${h.name.split('(')[0].trim()}</span>
          </div>
        `,
        iconSize: [170, 32],
        iconAnchor: [20, 16]
      });

      const marker = L.marker([h.lat, h.lng], { icon: icon }).addTo(this.map);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif; min-width:220px; padding:4px;">
          <div style="font-weight:700; color:#0369a1; font-size:14px; margin-bottom:2px;">${h.name}</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:8px;">${h.address}</div>
          <div style="display:flex; gap:6px; font-size:11px; margin-bottom:8px;">
            <span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:6px; font-weight:600;">Available Beds: ${h.beds_available}</span>
            <span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:6px; font-weight:600;">ICU: ${h.icu_available}</span>
          </div>
          <div style="font-size:11px; color:#0f172a; margin-bottom:4px;"><strong>Type:</strong> ${h.type}</div>
          <div style="font-size:11px; color:#0f172a;"><strong>Emergency Hotline:</strong> ${h.phone}</div>
        </div>
      `);
      this.hospitalMarkers[h.id] = marker;
    });
  }

  renderJunctions(junctions, onJunctionClick) {
    Object.values(junctions).forEach(j => {
      const isGreen = j.signal === 'GREEN';
      const isOverride = j.status === 'GREEN_CORRIDOR_OVERRIDE';

      const icon = L.divIcon({
        className: 'custom-junction-icon',
        html: `
          <div id="junc-pin-${j.id}" class="junction-marker-pin ${isOverride ? 'green-override' : ''}">
            <div class="signal-box" style="padding:2px; transform:scale(0.85);">
              <div class="signal-lamp red ${j.signal === 'RED' ? 'active' : ''}" style="width:8px; height:8px;"></div>
              <div class="signal-lamp green ${j.signal === 'GREEN' ? 'active' : ''}" style="width:8px; height:8px;"></div>
            </div>
            <span style="font-size:11px;">${j.name.split(' ')[0]}</span>
            <span style="color:#0284c7; font-size:9px;" title="CCTV Camera Available">📹</span>
          </div>
        `,
        iconSize: [110, 26],
        iconAnchor: [55, 13]
      });

      const marker = L.marker([j.lat, j.lng], { icon: icon }).addTo(this.map);
      marker.on('click', () => {
        if (onJunctionClick) onJunctionClick(j.id);
      });
      marker.bindTooltip(`<b>${j.name}</b><br>${j.road}<br>Click to inspect CCTV & Traffic Density`, { direction: 'top', offset: [0, -10] });
      this.junctionMarkers[j.id] = marker;
    });
  }

  updateJunctionSignals(junctions) {
    Object.values(junctions).forEach(j => {
      const pin = document.getElementById(`junc-pin-${j.id}`);
      if (pin) {
        const isGreen = j.signal === 'GREEN';
        const isOverride = j.status === 'GREEN_CORRIDOR_OVERRIDE';

        if (isOverride) {
          pin.classList.add('green-override');
        } else {
          pin.classList.remove('green-override');
        }

        const redLamp = pin.querySelector('.signal-lamp.red');
        const greenLamp = pin.querySelector('.signal-lamp.green');
        if (redLamp && greenLamp) {
          if (isGreen) {
            redLamp.classList.remove('active');
            greenLamp.classList.add('active');
          } else {
            redLamp.classList.add('active');
            greenLamp.classList.remove('active');
          }
        }
      }
    });
  }

  drawRoutes(primaryWaypoints, alternateWaypoints = null) {
    if (this.corridorLine) this.map.removeLayer(this.corridorLine);
    if (this.corridorDashLine) this.map.removeLayer(this.corridorDashLine);
    if (this.alternateLine) this.map.removeLayer(this.alternateLine);

    if (alternateWaypoints && alternateWaypoints.length > 0) {
      this.alternateLine = L.polyline(alternateWaypoints, {
        color: '#f59e0b',
        weight: 5,
        dashArray: '8, 8',
        opacity: 0.75
      }).addTo(this.map);
      this.alternateLine.bindTooltip('Alternate Route (Secondary Corridor)', { sticky: true });
    }

    if (primaryWaypoints && primaryWaypoints.length > 0) {
      this.corridorLine = L.polyline(primaryWaypoints, {
        color: '#10b981',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);

      this.corridorDashLine = L.polyline(primaryWaypoints, {
        className: 'corridor-polyline-dash',
        color: '#ffffff',
        weight: 3,
        opacity: 0.95
      }).addTo(this.map);

      this.corridorLine.bindTooltip('Active Virtual Green Corridor (AI Priority Waves)', { sticky: true });
      this.map.fitBounds(this.corridorLine.getBounds(), { padding: [70, 70] });
    }
  }

  updateAmbulanceMarker(lat, lng, heading = 0) {
    if (!this.ambulanceMarker) {
      const icon = L.divIcon({
        className: 'ambulance-div-icon',
        html: `
          <div class="ambulance-marker">
            <div class="siren-ring red"></div>
            <div class="siren-ring blue"></div>
            <div class="ambulance-icon-inner">
              <span style="font-size:16px;">🚑</span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      this.ambulanceMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(this.map);
    } else {
      this.ambulanceMarker.setLatLng([lat, lng]);
    }

    if (this.isAutoFollowing && this.map) {
      this.map.panTo([lat, lng], { animate: true, duration: 0.4 });
    }
  }

  showIncident(incident) {
    if (this.incidentMarker) {
      this.map.removeLayer(this.incidentMarker);
      this.incidentMarker = null;
    }
    if (incident && incident.junction_id) {
      const jMarker = this.junctionMarkers[incident.junction_id];
      if (jMarker) {
        const pos = jMarker.getLatLng();
        const icon = L.divIcon({
          className: 'incident-icon',
          html: `<div style="background:#ef4444; color:white; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:bold; box-shadow:0 0 14px rgba(239,68,68,0.8); display:flex; align-items:center; gap:4px; animation:pulse 1s infinite;">⚠️ BLOCKAGE</div>`,
          iconSize: [110, 26],
          iconAnchor: [55, 13]
        });
        this.incidentMarker = L.marker(pos, { icon: icon }).addTo(this.map);
      }
    }
  }

  clearIncident() {
    if (this.incidentMarker) {
      this.map.removeLayer(this.incidentMarker);
      this.incidentMarker = null;
    }
  }

  resetView() {
    this.map.setView([26.9024, 75.8050], 13);
  }
}

window.JaipurMapManager = JaipurMapManager;

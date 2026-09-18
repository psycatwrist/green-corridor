/**
 * ==========================================================================
 * GREEN+ CORRIDOR - GIS Telemetry & OpenStreetMap Controller
 * File: js/maps.js
 * Powered by Leaflet + OpenStreetMap + Real OSRM Driving Engine
 * Plots real coordinates of all Jaipur Hospitals from Fox API,
 * traces actual road geometry with glowing Green Wave preemption corridors,
 * and tracks ambulances with live GPS telemetry.
 * ==========================================================================
 */

window.GC_MAPS = (function() {
  let hospitalMap = null;
  let adminMap = null;
  const hospitalMapElements = { hospitalMarkers: {} };
  const adminMapElements = { hospitalMarkers: {}, ambulanceMarkers: {} };

  // Standard OpenStreetMap Tile Layer Factory
  function createOsmTileLayer() {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    });
  }

  // Draw all registered Jaipur hospitals from Fox API / GC_DATA
  function drawHospitalMarkers(map, elementsMap) {
    if (!map || !window.GC_DATA || !window.GC_DATA.hospitalProfiles) return;

    const addedCoords = new Set();
    const profiles = Object.values(window.GC_DATA.hospitalProfiles);

    profiles.forEach(hosp => {
      if (!hosp.coords || hosp.coords.length !== 2) return;
      const coordKey = `${hosp.coords[0].toFixed(4)},${hosp.coords[1].toFixed(4)}`;
      if (addedCoords.has(coordKey)) return;
      addedCoords.add(coordKey);

      const isApexOrSMS = hosp.key === 'sms_hospital' || hosp.key === 'dictator_hospital';
      const iconHtml = `
        <div class="marker-pin-hospital ${isApexOrSMS ? 'marker-apex-glow' : ''}" style="${hosp.key === 'dictator_hospital' ? 'background:#000000; border-color:#22c55e;' : ''}" title="${hosp.name}">
          <span>+</span>
        </div>
      `;

      const hospIcon = L.divIcon({
        className: 'custom-map-icon',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupHtml = `
        <div style="font-family: var(--font-sans); min-width: 220px;">
          <div style="font-weight: 800; font-size: 14px; color: #064e3b; margin-bottom: 2px;">
            ${hosp.name}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; margin-bottom: 6px;">
            ${hosp.tier || 'EMERGENCY INTAKE CENTER'}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            <i data-lucide="map-pin"></i> ${hosp.address || 'Jaipur, Rajasthan'}
          </div>
          <div style="display: flex; gap: 8px; font-size: 11px; margin-bottom: 8px;">
            <span style="background:#ecfdf5; color:#065f46; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              ${hosp.beds || 'ICU Beds Ready'}
            </span>
            <span style="background:#f0fdf4; color:#166534; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
              Dock: ${hosp.ambulanceDirect || '108'}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b;">
            Emergency Direct: <strong>${hosp.phone || '+91-141-2560291'}</strong>
          </div>
        </div>
      `;

      const marker = L.marker(hosp.coords, { icon: hospIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      if (elementsMap) {
        elementsMap[hosp.key || coordKey] = marker;
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --- Render Real OSRM Road Path on Map with Glowing Green Wave Polyline ---
  async function renderRoutePath(map, elementsObj, startCoords, destCoords, mode = 'emergency') {
    if (!map || !startCoords || !destCoords) return null;

    try {
      let routeData = null;
      if (window.GC_API && window.GC_API.getRoute) {
        routeData = await window.GC_API.getRoute(startCoords[0], startCoords[1], destCoords[0], destCoords[1], mode);
      }

      if (!routeData || !routeData.coordinates || routeData.coordinates.length < 2) {
        // Fallback line
        routeData = {
          coordinates: [startCoords, [(startCoords[0] + destCoords[0])/2, (startCoords[1] + destCoords[1])/2], destCoords],
          distance_km: 4.1,
          eta: "7m 40s"
        };
      }

      // Clear existing route polylines
      if (elementsObj.routeGlow) map.removeLayer(elementsObj.routeGlow);
      if (elementsObj.routeCore) map.removeLayer(elementsObj.routeCore);

      // Glowing outer Green Wave corridor
      elementsObj.routeGlow = L.polyline(routeData.coordinates, {
        color: '#10b981',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Core street driving path
      elementsObj.routeCore = L.polyline(routeData.coordinates, {
        color: '#047857',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(elementsObj.routeCore.getBounds(), { padding: [40, 40] });

      // Update UI HUD indicators if present
      const hudEta = document.getElementById('hudEta');
      const hudDistance = document.getElementById('hudDistance');
      if (hudEta && routeData.eta) hudEta.textContent = routeData.eta;
      if (hudDistance && routeData.distance_km) hudDistance.textContent = `${routeData.distance_km} km`;

      return routeData;
    } catch (e) {
      console.warn("Could not render OSRM route on map:", e);
      return null;
    }
  }

  // --- Initialize Hospital Map ---
  function initHospitalMap() {
    if (hospitalMap) {
      hospitalMap.invalidateSize();
      return;
    }

    const mapElement = document.getElementById('jaipurMap');
    if (!mapElement) return;

    hospitalMap = L.map('jaipurMap', {
      center: [26.8978, 75.8156], // Sawai Man Singh Hospital
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    createOsmTileLayer().addTo(hospitalMap);

    // Plot all Jaipur Hospitals from API
    drawHospitalMarkers(hospitalMap, hospitalMapElements.hospitalMarkers);

    // Ambulance Marker
    const ambIcon = L.divIcon({
      className: 'custom-map-icon',
      html: `<div class="marker-pin-ambulance pulsing-red" title="Ambulance Unit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-2.5l-2.5 -4h-4"></path></svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const startLoc = [26.9045, 75.7590]; // Vaishali Nagar
    const destLoc = [26.8978, 75.8156];  // SMS Hospital

    hospitalMapElements.ambulanceMarker = L.marker(startLoc, { icon: ambIcon }).addTo(hospitalMap);

    // Police Personnel Markers on Map
    if (window.GC_DATA.policeDeployments) {
      window.GC_DATA.policeDeployments.forEach(pol => {
        const polIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div class="marker-pin-police" title="${pol.name} (${pol.unit})"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker(pol.coords, { icon: polIcon })
          .addTo(hospitalMap)
          .bindPopup(`
            <strong>${pol.name}</strong><br>
            <em>${pol.unit}</em> &bull; ${pol.location}<br>
            Contact: <strong>${pol.phone}</strong><br>
            Duty: ${pol.duty}<br>
            <span style="color:#16a34a; font-weight:600;">${pol.status}</span>
          `);
      });
    }

    // Traffic Signals on Map
    if (window.GC_DATA.trafficLightNodes) {
      window.GC_DATA.trafficLightNodes.forEach(sig => {
        const sigIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div class="marker-pin-signal signal-green" title="${sig.name}"><span class="signal-inner-dot"></span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        L.marker(sig.coords, { icon: sigIcon })
          .addTo(hospitalMap)
          .bindPopup(`<strong>${sig.name}</strong><br>Status: <span style="color:#16a34a; font-weight:700;">GREEN WAVE OVERRIDE</span><br>Density: ${sig.density}`);
      });
    }

    // Render Real OSRM Route
    renderRoutePath(hospitalMap, hospitalMapElements, startLoc, destLoc, 'emergency');
  }

  function updateHospitalMapFocus() {
    const state = window.GC_STATE.state;
    const amb = window.GC_DATA.ambulances.find(a => a.id === state.selectedAmbulanceId);
    if (!amb || !hospitalMap) return;

    if (amb.coords && hospitalMapElements.ambulanceMarker) {
      hospitalMapElements.ambulanceMarker.setLatLng(amb.coords);
      hospitalMap.flyTo(amb.coords, 14, { duration: 1.2 });
    }

    const hudBadge = document.getElementById('hudUnitBadge');
    const hudEta = document.getElementById('hudEta');
    const hudDistance = document.getElementById('hudDistance');
    const hudSpeed = document.getElementById('hudSpeed');
    const hudType = document.getElementById('hudUnitType');

    if (hudBadge) hudBadge.textContent = amb.id;
    if (hudEta) hudEta.textContent = amb.eta;
    if (hudDistance) hudDistance.textContent = amb.distance;
    if (hudSpeed) hudSpeed.textContent = amb.speed;
    if (hudType) hudType.textContent = amb.type;
  }

  // --- Initialize Admin Map (Jaipur Traffic Police Central Command) ---
  function initAdminMap() {
    if (adminMap) {
      adminMap.invalidateSize();
      return;
    }

    const mapElement = document.getElementById('adminJaipurMap') || document.getElementById('adminMap');
    if (!mapElement) return;

    adminMap = L.map(mapElement, {
      center: [26.8985, 75.7870],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    createOsmTileLayer().addTo(adminMap);

    // Plot all Jaipur Hospitals from Fox API
    drawHospitalMarkers(adminMap, adminMapElements.hospitalMarkers);

    // All In-Service Ambulances on Admin Map
    adminMapElements.ambulanceMarkers = {};
    window.GC_DATA.ambulances.filter(a => a.inService).forEach(amb => {
      const isCritical = amb.hasGreenCorridor;
      const ambIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-ambulance ${isCritical ? 'pulsing-red' : ''}" style="${!isCritical ? 'background:#3f3f46;' : ''}" title="${amb.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-2.5l-2.5 -4h-4"></path></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const m = L.marker(amb.coords, { icon: ambIcon })
        .addTo(adminMap)
        .bindPopup(`
          <strong>${amb.id}</strong> &bull; ${amb.type}<br>
          Status: <strong>${amb.statusLabel}</strong><br>
          Driver: ${amb.driver} (${amb.phone})<br>
          Location: ${amb.location}<br>
          ETA: ${amb.eta} &bull; Speed: ${amb.speed}
        `);
      adminMapElements.ambulanceMarkers[amb.id] = m;
    });

    // Deployed Police Officers
    if (window.GC_DATA.policeDeployments) {
      window.GC_DATA.policeDeployments.forEach(pol => {
        const polIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div class="marker-pin-police" title="${pol.name}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker(pol.coords, { icon: polIcon })
          .addTo(adminMap)
          .bindPopup(`
            <strong>${pol.name}</strong><br>
            <em>${pol.unit}</em> &bull; ${pol.location}<br>
            Duty: ${pol.duty}<br>
            <strong>Status:</strong> ${pol.status}
          `);
      });
    }

    // Traffic Signals on Map
    if (window.GC_DATA.trafficLightNodes) {
      window.GC_DATA.trafficLightNodes.forEach(sig => {
        const sigIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `<div class="marker-pin-signal signal-green"><span class="signal-inner-dot"></span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        L.marker(sig.coords, { icon: sigIcon })
          .addTo(adminMap)
          .bindPopup(`<strong>${sig.name}</strong><br>Green Wave Pre-emption Active`);
      });
    }

    // Render Real OSRM Route
    const startLoc = [26.9045, 75.7590]; // Vaishali
    const destLoc = [26.8978, 75.8156];  // SMS Hospital
    renderRoutePath(adminMap, adminMapElements, startLoc, destLoc, 'emergency');
  }

  // --- Dynamic Route Override Handler ---
  async function applyRouteOverride(newRouteKey) {
    const state = window.GC_STATE.state;
    state.activeOverrideRoute = newRouteKey;

    const routeNames = {
      optimal: "JLN Marg Emergency Corridor",
      "alt-a": "Tonk Road Corridor",
      "alt-b": "MI Road Corridor"
    };

    // Notify backend
    if (window.GC_API && window.GC_API.overrideClearance) {
      const targetReq = state.clearanceRequests[0];
      if (targetReq) {
        window.GC_API.overrideClearance(targetReq.id, newRouteKey, routeNames[newRouteKey], "JTP Command Dynamic Reroute").catch(() => {});
      }
    }

    const startLoc = [26.9045, 75.7590];
    let destLoc = [26.8978, 75.8156];
    if (newRouteKey === 'alt-a') {
      destLoc = [26.8524, 75.8079]; // Fortis Escorts
    } else if (newRouteKey === 'alt-b') {
      destLoc = [26.8550, 75.8242]; // Apex Hospital
    }

    [hospitalMapElements, adminMapElements].forEach(el => {
      const activeMap = el === hospitalMapElements ? hospitalMap : adminMap;
      if (activeMap) {
        renderRoutePath(activeMap, el, startLoc, destLoc, 'emergency');
      }
    });

    // Update Admin Header override buttons
    document.querySelectorAll('[data-override-route]').forEach(b => {
      if (b.getAttribute('data-override-route') === newRouteKey) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (window.GC_ADMIN) {
      window.GC_ADMIN.renderAdminQueue();
      window.GC_ADMIN.renderCountdownTimeline();
    }

    window.GC_STATE.showToast(`Route overridden to ${routeNames[newRouteKey]}. Both Hospital & Field units notified.`);
  }

  // --- Real-time Admin GIS Telemetry Marker Updater ---
  function updateAdminAmbulanceMarker(ambId, coords, speed, heading, driverName) {
    if (!adminMap || !coords) return;
    if (!adminMapElements.ambulanceMarkers) {
      adminMapElements.ambulanceMarkers = {};
    }
    let marker = adminMapElements.ambulanceMarkers[ambId];

    if (!marker) {
      const ambIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="marker-pin-ambulance pulsing-red" title="${ambId}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-2.5l-2.5 -4h-4"></path></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      marker = L.marker(coords, { icon: ambIcon }).addTo(adminMap);
      adminMapElements.ambulanceMarkers[ambId] = marker;
    } else {
      marker.setLatLng(coords);
    }

    marker.bindPopup(`
      <strong>${ambId} (LIVE GPS TRACKING)</strong><br>
      Driver: <strong>${driverName || 'Active Driver'}</strong><br>
      Speed: <strong>${speed || 0} km/h</strong> &bull; Heading: ${heading || 0}&deg;<br>
      <span style="color:#16a34a; font-weight:700;">LIVE TELEMETRY STREAM &bull; 12Hz</span>
    `);
  }

  return {
    get hospitalMap() { return hospitalMap; },
    get adminMap() { return adminMap; },
    hospitalMapElements,
    adminMapElements,
    initHospitalMap,
    initAdminMap,
    renderRoutePath,
    updateHospitalMapFocus,
    updateAdminAmbulanceMarker,
    applyRouteOverride
  };
})();

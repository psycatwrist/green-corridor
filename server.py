import asyncio
import json
import math
import os
import time
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'static', 'data', 'jaipur_data.json')

with open(DATA_FILE, 'r', encoding='utf-8') as f:
    JAIPUR_DATA = json.load(f)

app = FastAPI(
    title='Jaipur Virtual Green Corridor AI System',
    description='Emergency Traffic Management & Virtual Signal Prioritization Engine for Jaipur City',
    version='2.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

def calculate_distance_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_bearing(lat1, lon1, lat2, lon2):
    dlon = math.radians(lon2 - lon1)
    y = math.sin(dlon) * math.cos(math.radians(lat2))
    x = math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) - math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlon)
    initial_bearing = math.atan2(y, x)
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    return compass_bearing

class StateManager:
    def __init__(self):
        self.reset_all()

    def reset_all(self):
        self.junctions: Dict[str, dict] = {}
        for j in JAIPUR_DATA['junctions']:
            self.junctions[j['id']] = {
                'id': j['id'],
                'name': j['name'],
                'road': j['road'],
                'lat': j['lat'],
                'lng': j['lng'],
                'cam_id': j['cam_id'],
                'density': j['density'],
                'vehicle_count': j['vehicle_count'],
                'queue_meters': j['queue_meters'],
                'status': 'AUTO',
                'signal': j['signal'],
                'ai_clearance_percent': 78 if j['signal'] == 'GREEN' else 34,
                'ai_status': 'CLEARING' if j['signal'] == 'GREEN' else 'CONGESTED'
            }

        self.active_corridor = None
        self.simulation_speed = 2.0
        self.is_moving = False
        self.incident = None
        self.history = [
            {
                'id': 'GC-2026-0810',
                'ambulance_id': 'RJ-14-EA-1092',
                'origin': 'Badi Chaupar',
                'destination': 'SMS Hospital',
                'severity': 'Level 1 - Critical',
                'time_saved_mins': 16.2,
                'status': 'COMPLETED',
                'response_score': 98
            },
            {
                'id': 'GC-2026-0811',
                'ambulance_id': 'RJ-14-EA-4412',
                'origin': 'Mansarovar',
                'destination': 'Fortis Hospital',
                'severity': 'Level 1 - Critical',
                'time_saved_mins': 21.5,
                'status': 'COMPLETED',
                'response_score': 96
            }
        ]
        self.analytics = {
            'total_corridors': 14,
            'avg_time_saved_mins': 15.4,
            'green_wave_success_rate': 98.6,
            'avg_transit_speed_kmh': 54.8,
            'emergency_response_score': 97
        }
        self.create_sample_corridor()

    def create_sample_corridor(self):
        pair_key = 'sindhi_camp__sms'
        route_data = JAIPUR_DATA['routes'][pair_key]['primary']
        self.active_corridor = {
            'id': 'GC-2026-0924',
            'ambulance_id': 'RJ-14-EA-2091',
            'driver_name': 'Ramesh Choudhary (Unit #4)',
            'patient_name': 'Sunil Verma, 52 yrs',
            'emergency_type': 'Acute STEMI / Cardiac Golden Hour',
            'severity': 'Level 1 - Critical',
            'triage_color': '#ef4444',
            'origin': 'sindhi_camp',
            'destination': 'sms',
            'status': 'REQUESTED',
            'authorized_by': None,
            'authorized_at': None,
            'route_key': pair_key,
            'route_variant': 'primary',
            'route_name': route_data['name'],
            'waypoints': route_data['waypoints'],
            'junction_ids': route_data['junction_ids'],
            'progress_step': 0.0,
            'total_steps': len(route_data['waypoints']) - 1,
            'lat': route_data['waypoints'][0][0],
            'lng': route_data['waypoints'][0][1],
            'heading': 145.0,
            'speed_kmh': 0.0,
            'distance_remaining_km': route_data['distance_km'],
            'standard_eta_mins': route_data['standard_eta_mins'],
            'green_corridor_eta_mins': route_data['green_corridor_eta_mins'],
            'next_junction_id': route_data['junction_ids'][0] if route_data['junction_ids'] else None,
            'next_junction_dist_m': 320,
            'next_junction_name': 'Sindhi Camp Crossing',
            'created_at': datetime.now().strftime('%H:%M:%S')
        }

    def get_full_state(self):
        return {
            'junctions': self.junctions,
            'active_corridor': self.active_corridor,
            'is_moving': self.is_moving,
            'simulation_speed': self.simulation_speed,
            'incident': self.incident,
            'analytics': self.analytics,
            'history': self.history
        }

state = StateManager()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        await websocket.send_json({'type': 'INIT_STATE', 'data': state.get_full_state()})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

async def simulation_loop():
    tick_interval = 0.4
    while True:
        try:
            await asyncio.sleep(tick_interval)
            c = state.active_corridor
            if c and state.is_moving and c['status'] == 'IN_TRANSIT':
                wps = c['waypoints']
                step = c['progress_step']
                speed_factor = 0.03 * state.simulation_speed
                step += speed_factor

                if step >= len(wps) - 1:
                    step = len(wps) - 1
                    c['progress_step'] = step
                    c['lat'] = wps[-1][0]
                    c['lng'] = wps[-1][1]
                    c['speed_kmh'] = 0.0
                    c['status'] = 'COMPLETED'
                    c['distance_remaining_km'] = 0.0
                    c['green_corridor_eta_mins'] = 0.0
                    state.is_moving = False

                    for jid in c['junction_ids']:
                        if jid in state.junctions and state.junctions[jid]['status'] != 'MANUAL_POLICE_OVERRIDE':
                            state.junctions[jid]['status'] = 'AUTO'
                            state.junctions[jid]['signal'] = 'GREEN' if jid in ['J2', 'J5', 'J10'] else 'RED'
                            state.junctions[jid]['ai_clearance_percent'] = 65

                    state.history.insert(0, {
                        'id': c['id'],
                        'ambulance_id': c['ambulance_id'],
                        'origin': c['origin'].replace('_', ' ').title(),
                        'destination': c['destination'].upper() + ' Hospital',
                        'severity': c['severity'],
                        'time_saved_mins': round(c['standard_eta_mins'] - c['green_corridor_eta_mins'], 1),
                        'status': 'COMPLETED',
                        'response_score': 99
                    })

                    await manager.broadcast({
                        'type': 'CORRIDOR_COMPLETED',
                        'data': state.get_full_state(),
                        'message': 'Ambulance ' + c['ambulance_id'] + ' has arrived safely at Destination Hospital!'
                    })
                    continue

                c['progress_step'] = step
                idx = int(step)
                frac = step - idx

                p1 = wps[idx]
                p2 = wps[min(idx + 1, len(wps) - 1)]

                cur_lat = p1[0] + (p2[0] - p1[0]) * frac
                cur_lng = p1[1] + (p2[1] - p1[1]) * frac

                c['lat'] = cur_lat
                c['lng'] = cur_lng
                c['heading'] = calculate_bearing(p1[0], p1[1], p2[0], p2[1])
                c['speed_kmh'] = round(52.0 + math.sin(step * 3) * 6.0, 1)

                dest_p = wps[-1]
                dist_rem = calculate_distance_km(cur_lat, cur_lng, dest_p[0], dest_p[1])
                c['distance_remaining_km'] = round(dist_rem, 2)
                c['green_corridor_eta_mins'] = round(max(0.2, (dist_rem / max(c['speed_kmh'], 30.0)) * 60.0), 1)

                upcoming_j = None
                min_j_dist = 999999.0

                for jid in c['junction_ids']:
                    if jid in state.junctions:
                        j = state.junctions[jid]
                        j_dist_m = calculate_distance_km(cur_lat, cur_lng, j['lat'], j['lng']) * 1000.0

                        if j_dist_m < min_j_dist:
                            min_j_dist = j_dist_m
                            upcoming_j = j

                        if j_dist_m <= 450.0:
                            if j['status'] != 'MANUAL_POLICE_OVERRIDE':
                                j['status'] = 'GREEN_CORRIDOR_OVERRIDE'
                                j['signal'] = 'GREEN'
                                j['queue_meters'] = max(0, int(j['queue_meters'] * 0.85))
                                j['vehicle_count'] = max(2, int(j['vehicle_count'] * 0.88))
                                j['ai_clearance_percent'] = min(99, j['ai_clearance_percent'] + 8)
                                j['ai_status'] = 'CORRIDOR_CLEARED'
                        elif j_dist_m > 500.0 and j['status'] == 'GREEN_CORRIDOR_OVERRIDE':
                            j['status'] = 'AUTO'
                            j['signal'] = 'RED'
                            j['ai_status'] = 'AUTO_NORMAL'

                if upcoming_j:
                    c['next_junction_id'] = upcoming_j['id']
                    c['next_junction_name'] = upcoming_j['name']
                    c['next_junction_dist_m'] = int(min_j_dist)

                await manager.broadcast({
                    'type': 'TELEMETRY_TICK',
                    'data': {
                        'lat': c['lat'],
                        'lng': c['lng'],
                        'heading': c['heading'],
                        'speed_kmh': c['speed_kmh'],
                        'progress_step': c['progress_step'],
                        'distance_remaining_km': c['distance_remaining_km'],
                        'green_corridor_eta_mins': c['green_corridor_eta_mins'],
                        'next_junction_id': c.get('next_junction_id'),
                        'next_junction_name': c.get('next_junction_name'),
                        'next_junction_dist_m': c.get('next_junction_dist_m'),
                        'junctions': state.junctions
                    }
                })

        except Exception as e:
            print('Error in simulation loop:', e)

@app.on_event('startup')
async def startup_event():
    asyncio.create_task(simulation_loop())

@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get('action') == 'PING':
                    await websocket.send_json({'type': 'PONG'})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get('/api/data')
def get_static_data():
    return JAIPUR_DATA

@app.get('/api/state')
def get_current_state():
    return state.get_full_state()

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post('/api/auth/login')
def login(req: LoginRequest):
    if req.username.strip() == 'Hospital' and req.password.strip() == '001':
        return {
            'success': True,
            'role': 'hospital_admin',
            'displayName': 'SMS Hospital Emergency Trauma Wing',
            'badge': 'Authorized Medical Officer',
            'token': 'auth_token_hosp_jaipur_001'
        }
    raise HTTPException(status_code=401, detail='Invalid Credentials. Expected Hospital / 001')

class EmergencyRequest(BaseModel):
    ambulance_id: str
    driver_name: str
    patient_name: str
    emergency_type: str
    severity: str
    origin: str
    destination: str

@app.post('/api/emergency/request')
async def create_emergency_request(req: EmergencyRequest):
    pair_key = req.origin + '__' + req.destination
    if pair_key not in JAIPUR_DATA['routes']:
        pair_key = 'sindhi_camp__sms'

    route_data = JAIPUR_DATA['routes'][pair_key]['primary']
    triage_colors = {
        'Level 1 - Critical': '#ef4444',
        'Level 2 - Severe': '#f97316',
        'Level 3 - Moderate': '#eab308'
    }

    state.active_corridor = {
        'id': 'GC-2026-' + str(int(time.time()) % 10000),
        'ambulance_id': req.ambulance_id or 'RJ-14-EA-2091',
        'driver_name': req.driver_name or 'Paramedic Unit Jaipur',
        'patient_name': req.patient_name or 'Critical Emergency Case',
        'emergency_type': req.emergency_type or 'Cardiac Golden Hour',
        'severity': req.severity or 'Level 1 - Critical',
        'triage_color': triage_colors.get(req.severity, '#ef4444'),
        'origin': req.origin,
        'destination': req.destination,
        'status': 'REQUESTED',
        'authorized_by': None,
        'authorized_at': None,
        'route_key': pair_key,
        'route_variant': 'primary',
        'route_name': route_data['name'],
        'waypoints': route_data['waypoints'],
        'junction_ids': route_data['junction_ids'],
        'progress_step': 0.0,
        'total_steps': len(route_data['waypoints']) - 1,
        'lat': route_data['waypoints'][0][0],
        'lng': route_data['waypoints'][0][1],
        'heading': 145.0,
        'speed_kmh': 0.0,
        'distance_remaining_km': route_data['distance_km'],
        'standard_eta_mins': route_data['standard_eta_mins'],
        'green_corridor_eta_mins': route_data['green_corridor_eta_mins'],
        'next_junction_id': route_data['junction_ids'][0] if route_data['junction_ids'] else None,
        'next_junction_dist_m': 350,
        'next_junction_name': 'Sindhi Camp Crossing',
        'created_at': datetime.now().strftime('%H:%M:%S')
    }
    state.is_moving = False
    state.incident = None

    await manager.broadcast({
        'type': 'CORRIDOR_REQUESTED',
        'data': state.get_full_state(),
        'message': 'New Green Corridor Emergency Request received from Ambulance ' + state.active_corridor['ambulance_id'] + '!'
    })
    return {'success': True, 'corridor': state.active_corridor}

class AuthorizeRequest(BaseModel):
    action: str
    authorized_by: Optional[str] = 'Chief Medical Officer (SMS Hospital)'
    doctor_notes: Optional[str] = 'Trauma Bay 1 Reserved, Cath Lab on Standby'

@app.post('/api/emergency/authorize')
async def authorize_corridor(req: AuthorizeRequest):
    if not state.active_corridor:
        raise HTTPException(status_code=400, detail='No active emergency request to authorize')

    if req.action == 'APPROVE':
        state.active_corridor['status'] = 'AUTHORIZED'
        state.active_corridor['authorized_by'] = req.authorized_by
        state.active_corridor['authorized_at'] = datetime.now().strftime('%H:%M:%S')
        state.active_corridor['doctor_notes'] = req.doctor_notes

        first_j = state.active_corridor['junction_ids'][0]
        if first_j in state.junctions:
            state.junctions[first_j]['status'] = 'GREEN_CORRIDOR_OVERRIDE'
            state.junctions[first_j]['signal'] = 'GREEN'

        await manager.broadcast({
            'type': 'CORRIDOR_AUTHORIZED',
            'data': state.get_full_state(),
            'message': 'Green Corridor AUTHORIZED by Hospital for Ambulance ' + state.active_corridor['ambulance_id'] + '. Jaipur TMC Signals synchronizing!'
        })
    else:
        state.active_corridor['status'] = 'REJECTED'
        await manager.broadcast({
            'type': 'CORRIDOR_REJECTED',
            'data': state.get_full_state(),
            'message': 'Emergency Green Corridor request was declined by hospital.'
        })

    return {'success': True, 'corridor': state.active_corridor}

@app.post('/api/emergency/start-trip')
async def start_trip():
    if not state.active_corridor:
        raise HTTPException(status_code=400, detail='No active corridor')
    if state.active_corridor['status'] != 'AUTHORIZED' and state.active_corridor['status'] != 'IN_TRANSIT':
        raise HTTPException(status_code=400, detail='Corridor must be authorized by Hospital before transit starts')

    state.active_corridor['status'] = 'IN_TRANSIT'
    state.is_moving = True
    await manager.broadcast({
        'type': 'TRIP_STARTED',
        'data': state.get_full_state(),
        'message': 'Ambulance ' + state.active_corridor['ambulance_id'] + ' is now in transit along Jaipur Green Corridor!'
    })
    return {'success': True, 'is_moving': True}

@app.post('/api/emergency/pause-trip')
async def pause_trip():
    state.is_moving = not state.is_moving
    await manager.broadcast({
        'type': 'TRIP_PAUSED',
        'data': {'is_moving': state.is_moving},
        'message': 'Simulation ' + ('resumed' if state.is_moving else 'paused')
    })
    return {'success': True, 'is_moving': state.is_moving}

class SpeedRequest(BaseModel):
    speed: float

@app.post('/api/emergency/speed')
async def set_speed(req: SpeedRequest):
    state.simulation_speed = max(0.5, min(req.speed, 8.0))
    await manager.broadcast({
        'type': 'SPEED_CHANGED',
        'speed': state.simulation_speed
    })
    return {'success': True, 'speed': state.simulation_speed}

@app.post('/api/emergency/reset')
async def reset_corridor():
    state.reset_all()
    await manager.broadcast({
        'type': 'CORRIDOR_RESET',
        'data': state.get_full_state(),
        'message': 'System reset to initial sample emergency state.'
    })
    return {'success': True}

@app.post('/api/emergency/reroute')
async def reroute_corridor():
    if not state.active_corridor:
        raise HTTPException(status_code=400, detail='No active corridor to reroute')

    pair_key = state.active_corridor['route_key']
    current_variant = state.active_corridor.get('route_variant', 'primary')
    new_variant = 'alternate' if current_variant == 'primary' else 'primary'

    if pair_key in JAIPUR_DATA['routes'] and new_variant in JAIPUR_DATA['routes'][pair_key]:
        new_route = JAIPUR_DATA['routes'][pair_key][new_variant]
        state.active_corridor['route_variant'] = new_variant
        state.active_corridor['route_name'] = new_route['name']
        state.active_corridor['waypoints'] = new_route['waypoints']
        state.active_corridor['junction_ids'] = new_route['junction_ids']
        state.active_corridor['progress_step'] = 0.0
        state.active_corridor['lat'] = new_route['waypoints'][0][0]
        state.active_corridor['lng'] = new_route['waypoints'][0][1]
        state.active_corridor['distance_remaining_km'] = new_route['distance_km']
        state.active_corridor['green_corridor_eta_mins'] = new_route['green_corridor_eta_mins']

        await manager.broadcast({
            'type': 'CORRIDOR_REROUTED',
            'data': state.get_full_state(),
            'message': 'AI Dynamic Rerouting engaged! Switched to ' + new_route['name']
        })
        return {'success': True, 'corridor': state.active_corridor}

    raise HTTPException(status_code=400, detail='Alternate route not available for this origin/destination')

class OverrideRequest(BaseModel):
    junction_id: str
    signal: str
    mode: Optional[str] = 'MANUAL_POLICE_OVERRIDE'

@app.post('/api/traffic/override')
async def override_junction(req: OverrideRequest):
    if req.junction_id not in state.junctions:
        raise HTTPException(status_code=404, detail='Junction not found')

    j = state.junctions[req.junction_id]
    j['status'] = req.mode
    j['signal'] = req.signal
    if req.signal == 'GREEN':
        j['ai_clearance_percent'] = 98
        j['ai_status'] = 'MANUALLY_CLEARED_BY_POLICE'
    else:
        j['ai_status'] = 'HOLD_ALL_CROSS_TRAFFIC'

    await manager.broadcast({
        'type': 'JUNCTION_OVERRIDE',
        'junction': j,
        'message': 'Traffic Police manual override executed at ' + j['name'] + ': Forced ' + j['signal']
    })
    return {'success': True, 'junction': j}

class IncidentRequest(BaseModel):
    junction_id: str
    description: str

@app.post('/api/traffic/incident')
async def report_incident(req: IncidentRequest):
    if req.junction_id == 'CLEAR':
        state.incident = None
        await manager.broadcast({
            'type': 'INCIDENT_CLEARED',
            'data': state.get_full_state(),
            'message': 'Road obstruction cleared. Normal corridor restored.'
        })
        return {'success': True}

    if req.junction_id in state.junctions:
        j = state.junctions[req.junction_id]
        j['density'] = 'Jammed'
        j['vehicle_count'] = 145
        j['queue_meters'] = 240
        j['ai_status'] = 'OBSTRUCTION_DETECTED'
        j['ai_clearance_percent'] = 12

        state.incident = {
            'junction_id': req.junction_id,
            'junction_name': j['name'],
            'road': j['road'],
            'description': req.description or 'Traffic pileup & bus breakdown blocking path',
            'reported_at': datetime.now().strftime('%H:%M:%S')
        }

        await manager.broadcast({
            'type': 'INCIDENT_DETECTED',
            'incident': state.incident,
            'data': state.get_full_state(),
            'message': 'ALERT: Road Incident detected at ' + j['name'] + '! AI recommends switching to alternate route.'
        })
        return {'success': True, 'incident': state.incident}

    raise HTTPException(status_code=404, detail='Junction not found')

app.mount('/static', StaticFiles(directory=os.path.join(BASE_DIR, 'static')), name='static')

@app.get('/')
def serve_home():
    return FileResponse(os.path.join(BASE_DIR, 'static', 'index.html'))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)

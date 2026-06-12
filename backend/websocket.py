import json
import logging
import asyncio
from typing import Dict, List, Set, Union
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
import redis.asyncio as aioredis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WebSocketManager")

# Router definitions
router = APIRouter()

# Redis Configuration (Fallback to mock Redis if connection fails)
REDIS_URL = "redis://localhost:6379"
redis_client = None

async def get_redis():
    global redis_client
    if redis_client is None:
        try:
            redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
            # Ping to verify connection
            await redis_client.ping()
            logger.info("Connected to Redis successfully for WebSockets.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory event bus.")
            redis_client = MockRedis()
    return redis_client

class MockRedis:
    """Mock Redis client for local development when Redis service is not running."""
    def __init__(self):
        self.subscribers: Set[asyncio.Queue] = set()

    async def ping(self):
        return True

    async def publish(self, channel: str, message: str):
        logger.info(f"[Mock Redis Pub/Sub] Publishing to {channel}: {message}")
        for queue in self.subscribers:
            await queue.put({"channel": channel, "data": message})

    def pubsub(self):
        return MockPubSub(self)

class MockPubSub:
    def __init__(self, mock_redis: MockRedis):
        self.redis = mock_redis
        self.queue = asyncio.Queue()

    async def subscribe(self, *args, **kwargs):
        self.redis.subscribers.add(self.queue)
        logger.info("Subscribed to mock Pub/Sub channels.")

    async def unsubscribe(self, *args, **kwargs):
        self.redis.subscribers.discard(self.queue)

    async def get_message(self, ignore_subscribe_messages: bool = False, timeout: float = 0.1):
        try:
            return await asyncio.wait_for(self.queue.get(), timeout=timeout)
        except asyncio.TimeoutError:
            return None


class ConnectionManager:
    def __init__(self):
        # active_banks: Dictionary mapping WebSockets of active admins/bankers to their user details
        self.active_banks: Dict[WebSocket, dict] = {}
        # active_farmers: Dictionary mapping user_id -> List of active WebSockets for that farmer
        self.active_farmers: Dict[str, List[WebSocket]] = {}

    async def connect_bank(self, websocket: WebSocket, user_info: dict):
        await websocket.accept()
        self.active_banks[websocket] = user_info
        logger.info(f"Bank/Admin client connected: {user_info.get('email')} (Active: {len(self.active_banks)})")

    def disconnect_bank(self, websocket: WebSocket):
        if websocket in self.active_banks:
            user = self.active_banks.pop(websocket)
            logger.info(f"Bank/Admin client disconnected: {user.get('email')}")

    async def connect_farmer(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_farmers:
            self.active_farmers[user_id] = []
        self.active_farmers[user_id].append(websocket)
        logger.info(f"Farmer client connected: User ID {user_id} (Connections: {len(self.active_farmers[user_id])})")

    def disconnect_farmer(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_farmers:
            if websocket in self.active_farmers[user_id]:
                self.active_farmers[user_id].remove(websocket)
                logger.info(f"Farmer client connection closed: User ID {user_id}")
            if not self.active_farmers[user_id]:
                self.active_farmers.pop(user_id)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_banks(self, message: dict):
        logger.info(f"Broadcasting event to all banks: {message.get('type')}")
        disconnected = []
        for connection in list(self.active_banks.keys()):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect_bank(conn)

    async def send_to_farmer(self, user_id: str, message: dict):
        logger.info(f"Sending real-time message to Farmer {user_id}: {message.get('type')}")
        if user_id in self.active_farmers:
            disconnected = []
            for connection in list(self.active_farmers[user_id]):
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect_farmer(conn, user_id)

manager = ConnectionManager()


# Authentication Helper (Supports Firebase ID Tokens, Mock Tokens for Phase 1)
def authenticate_user(token: str) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Missing auth token")
    
    # Mock Token Validation for Phase 1 testing
    if token == "mock-token-admin":
        return {"uid": "admin-user-id-456", "email": "admin@agriscore.com", "role": "admin"}
    elif token.startswith("mock-token-farmer-"):
        uid = token.replace("mock-token-farmer-", "")
        return {"uid": uid, "email": f"farmer_{uid}@agriscore.com", "role": "farmer"}
    
    # Placeholder for Firebase Token verification (Phase 2 integration)
    # In production, this would call firebase_admin.auth.verify_id_token(token)
    try:
        # Simple fallback parsing if it looks like a custom json structure
        if token.startswith("test-"):
            role = "admin" if "admin" in token else "farmer"
            return {"uid": token, "email": f"{token}@test.com", "role": role}
        raise Exception("Invalid Token")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT, 
            detail="Invalid authentication credentials"
        )


# Background Redis Subscriber Loop
async def redis_listener():
    logger.info("Initializing Redis Pub/Sub listener...")
    r = await get_redis()
    pubsub = r.pubsub()
    await pubsub.subscribe("loan_events")

    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                data = json.loads(message["data"])
                event_type = data.get("type")
                payload = data.get("payload", {})

                if event_type == "LOAN_SUBMITTED":
                    # Broadcast new applications to all active bank dashboards
                    await manager.broadcast_to_banks({
                        "type": "LOAN_SUBMITTED",
                        "payload": payload
                    })
                elif event_type == "KYC_SUBMITTED":
                    # Broadcast new KYC onboarding to all active bank dashboards
                    await manager.broadcast_to_banks({
                        "type": "KYC_SUBMITTED",
                        "payload": payload
                    })
                elif event_type == "FARMER_PROFILE_UPDATED":
                    # Broadcast updated profile details to all active bank dashboards
                    await manager.broadcast_to_banks({
                        "type": "FARMER_PROFILE_UPDATED",
                        "payload": payload
                    })
                elif event_type == "LOAN_STATUS_UPDATED":
                    # Send status updates directly to the affected farmer
                    farmer_id = payload.get("farmerId")
                    if farmer_id:
                        await manager.send_to_farmer(farmer_id, {
                            "type": "LOAN_STATUS_UPDATED",
                            "payload": payload
                        })
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in Redis listener loop: {e}")
            await asyncio.sleep(2)


# WebSocket Endpoints

@router.websocket("/ws/bank/loans")
async def websocket_bank_endpoint(websocket: WebSocket, token: str = Query(None)):
    try:
        user_info = authenticate_user(token)
        if user_info.get("role") != "admin":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.warning(f"Bank authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect_bank(websocket, user_info)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
                continue
            
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                payload = message.get("payload")
                
                if msg_type == "LOAN_STATUS_UPDATED":
                    farmer_id = payload.get("farmerId")
                    if farmer_id:
                        await manager.send_to_farmer(farmer_id, {
                            "type": "LOAN_STATUS_UPDATED",
                            "payload": payload
                        })
            except Exception as e:
                logger.error(f"Failed to process message from bank: {e}")
    except WebSocketDisconnect:
        manager.disconnect_bank(websocket)
    except Exception as e:
        logger.error(f"WebSocket error in bank channel: {e}")
        manager.disconnect_bank(websocket)


@router.websocket("/ws/farmer/loans/{user_id}")
async def websocket_farmer_endpoint(websocket: WebSocket, user_id: str, token: str = Query(None)):
    try:
        user_info = authenticate_user(token)
        if user_info.get("uid") != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        logger.warning(f"Farmer authentication failed: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect_farmer(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
                continue
            
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                payload = message.get("payload")
                
                if msg_type == "KYC_SUBMITTED":
                    await manager.broadcast_to_banks({
                        "type": "KYC_SUBMITTED",
                        "payload": payload
                    })
                elif msg_type == "FARMER_PROFILE_UPDATED":
                    await manager.broadcast_to_banks({
                        "type": "FARMER_PROFILE_UPDATED",
                        "payload": payload
                    })
                elif msg_type == "LOAN_SUBMITTED":
                    await manager.broadcast_to_banks({
                        "type": "LOAN_SUBMITTED",
                        "payload": payload
                    })
            except Exception as e:
                logger.error(f"Failed to process message from farmer {user_id}: {e}")
    except WebSocketDisconnect:
        manager.disconnect_farmer(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error in farmer channel {user_id}: {e}")
        manager.disconnect_farmer(websocket, user_id)

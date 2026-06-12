import json
import asyncio
import logging
import os
from fastapi import FastAPI, HTTPException, Depends, Form, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from backend.websocket import router as ws_router, get_redis, redis_listener

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgriScoreServer")

app = FastAPI(title="AgriScore Real-Time Backend API")

# Setup CORS for Web Dashboards and Mobile Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static files
os.makedirs("uploads", exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory="uploads"), name="uploads")

# In-Memory Persistence Database
MOCK_KYC_DB = {}
MOCK_APPLICATIONS_DB = []


# Request Models
class LoanApplicationSchema(BaseModel):
    farmerId: str
    farmerName: str
    amount: float
    tenureMonths: int
    interestRate: float
    bankName: str

class LoanStatusUpdateSchema(BaseModel):
    applicationId: str
    farmerId: str
    status: str  # PENDING, OFFERED, APPROVED, REJECTED, DISBURSED
    offeredInterestRate: Optional[float] = None
    offeredTenureMonths: Optional[int] = None
    adminRemarks: Optional[str] = None


# Startup/Shutdown Event Lifecycles to handle Background Tasks
listener_task = None

@app.on_event("startup")
async def startup_event():
    global listener_task
    # Run the Redis Pub/Sub listener in the background asyncio event loop
    listener_task = asyncio.create_task(redis_listener())
    logger.info("Background Redis listener task started.")

@app.on_event("shutdown")
async def shutdown_event():
    if listener_task:
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
        logger.info("Background Redis listener task terminated.")


# Include WebSocket router
app.include_router(ws_router)


@app.get("/")
async def root():
    return {"message": "AgriScore Real-Time API Server is running."}


# REST Endpoints that trigger Real-time events & save states
@app.post("/api/loans/apply")
async def apply_for_loan(payload: LoanApplicationSchema, r = Depends(get_redis)):
    logger.info(f"Received loan application from Farmer: {payload.farmerName}")
    
    app_id = f"loan-app-{payload.farmerId[:4]}-{int(asyncio.get_event_loop().time())}"
    application_data = {
        "id": app_id,
        "farmerId": payload.farmerId,
        "farmerName": payload.farmerName,
        "amount": payload.amount,
        "tenureMonths": payload.tenureMonths,
        "interestRate": payload.interestRate,
        "emi": round((payload.amount * (payload.interestRate / 1200)) / (1 - (1 + payload.interestRate / 1200)**(-payload.tenureMonths)) if payload.tenureMonths > 0 else 0, 2),
        "status": "PENDING",
        "createdAt": "2026-06-11T12:00:00Z"
    }

    # Save to memory list
    MOCK_APPLICATIONS_DB.insert(0, application_data)

    event_message = {
        "type": "LOAN_SUBMITTED",
        "payload": application_data
    }

    await r.publish("loan_events", json.dumps(event_message))
    
    return {
        "status": "success",
        "message": "Loan application submitted & broadcasted.",
        "data": application_data
    }


@app.post("/api/loans/update")
async def update_loan_status(payload: LoanStatusUpdateSchema, r = Depends(get_redis)):
    logger.info(f"Lender offer update for application {payload.applicationId} -> Status: {payload.status}")

    updated_data = None
    for app in MOCK_APPLICATIONS_DB:
        if app["id"] == payload.applicationId:
            app["status"] = payload.status
            app["offeredInterestRate"] = payload.offeredInterestRate
            app["offeredTenureMonths"] = payload.offeredTenureMonths
            app["adminRemarks"] = payload.adminRemarks
            app["updatedAt"] = "2026-06-11T12:05:00Z"
            updated_data = app
            break

    if not updated_data:
        updated_data = {
            "id": payload.applicationId,
            "farmerId": payload.farmerId,
            "status": payload.status,
            "offeredInterestRate": payload.offeredInterestRate,
            "offeredTenureMonths": payload.offeredTenureMonths,
            "adminRemarks": payload.adminRemarks,
            "updatedAt": "2026-06-11T12:05:00Z"
        }

    event_message = {
        "type": "LOAN_STATUS_UPDATED",
        "payload": updated_data
    }

    await r.publish("loan_events", json.dumps(event_message))

    return {
        "status": "success",
        "message": f"Loan application status updated & broadcasted.",
        "data": updated_data
    }


@app.put("/api/farmer/profile")
@app.patch("/api/farmer/profile")
async def update_farmer_profile(payload: dict, r = Depends(get_redis)):
    farmer_id = payload.get("farmer_id") or payload.get("farmerId")
    if not farmer_id:
        raise HTTPException(status_code=400, detail="Missing farmer_id or farmerId")
    
    # Save/update KYC profile
    MOCK_KYC_DB[farmer_id] = payload
    
    event_message = {
        "type": "FARMER_PROFILE_UPDATED",
        "payload": {
            "farmerId": farmer_id,
            "details": payload
        }
    }
    await r.publish("loan_events", json.dumps(event_message))
    return {"status": "success", "message": "Profile updated and broadcasted.", "data": payload}


@app.post("/api/farmer/profile-multipart")
async def update_farmer_profile_multipart(
    request: Request,
    r = Depends(get_redis)
):
    form = await request.form()
    farmer_id = form.get("farmerId") or form.get("farmer_id")
    if not farmer_id:
        raise HTTPException(status_code=400, detail="Missing farmerId or farmer_id")

    data = {}
    for key, val in form.items():
        if key == "cropFieldImage":
            continue
        # Convert values to correct types
        if val == "true":
            data[key] = True
        elif val == "false":
            data[key] = False
        else:
            try:
                if "." in val:
                    data[key] = float(val)
                else:
                    data[key] = int(val)
            except ValueError:
                data[key] = val

    # Save file to uploads directory if exists
    file = form.get("cropFieldImage")
    if file and hasattr(file, "filename") and file.filename:
        filename = f"crop_field_{farmer_id}_{int(asyncio.get_event_loop().time())}_{file.filename}"
        filepath = os.path.join("uploads", filename)
        with open(filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        data["cropFieldImage"] = f"/static/uploads/{filename}"

    # Merge/update KYC profile
    current_kyc = MOCK_KYC_DB.get(farmer_id, {})
    current_kyc.update(data)
    MOCK_KYC_DB[farmer_id] = current_kyc

    event_message = {
        "type": "FARMER_PROFILE_UPDATED",
        "payload": {
            "farmerId": farmer_id,
            "details": current_kyc
        }
    }
    await r.publish("loan_events", json.dumps(event_message))
    return {"status": "success", "message": "Profile updated with image and broadcasted.", "data": current_kyc}


@app.put("/api/farmer/farm-details")
@app.patch("/api/farmer/farm-details")
async def update_farm_details(payload: dict, r = Depends(get_redis)):
    farmer_id = payload.get("farmer_id") or payload.get("farmerId")
    if not farmer_id:
        raise HTTPException(status_code=400, detail="Missing farmer_id or farmerId")
    
    # Merge/update farm details in KYC profile
    current_kyc = MOCK_KYC_DB.get(farmer_id, {})
    current_kyc.update(payload)
    MOCK_KYC_DB[farmer_id] = current_kyc
    
    event_message = {
        "type": "FARMER_PROFILE_UPDATED",
        "payload": {
            "farmerId": farmer_id,
            "details": current_kyc
        }
    }
    await r.publish("loan_events", json.dumps(event_message))
    return {"status": "success", "message": "Farm details updated and broadcasted.", "data": current_kyc}


@app.get("/api/loans")
async def get_all_loans():
    """
    Get all loan applications (for lenders).
    """
    return {"status": "success", "data": MOCK_APPLICATIONS_DB}


@app.get("/api/loans/farmer/{farmer_id}")
async def get_farmer_loans(farmer_id: str):
    """
    Get loan applications for a specific farmer.
    """
    farmer_apps = [app for app in MOCK_APPLICATIONS_DB if app["farmerId"] == farmer_id]
    return {"status": "success", "data": farmer_apps}


@app.get("/api/farmer/profile/{farmer_id}")
async def get_farmer_profile(farmer_id: str):
    """
    Get KYC/Profile details for a specific farmer.
    """
    profile = MOCK_KYC_DB.get(farmer_id, None)
    return {"status": "success", "data": profile}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

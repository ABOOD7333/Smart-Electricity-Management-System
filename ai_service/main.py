import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
import uvicorn
from typing import List, Dict, Any

# Import AI Services
from services.fraud_detection import FraudDetector
from services.consumption_prediction import ConsumptionPredictor
from services.ocr_service import MeterOCR
from services.chatbot import AIChatbot
from services.recommendations import RecommendationEngine

app = FastAPI(
    title="SEMS AI & Analytics API",
    description="Advanced AI Modules for Smart Electricity Management System",
    version="1.0.0"
)

# Restrict CORS to ALLOWED_ORIGINS environment variable
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Authentication
API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    expected_key = os.getenv("AI_API_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=401, detail="Unauthorized: API Key configuration missing on server."
        )
    if not api_key_header or api_key_header != expected_key:
        raise HTTPException(
            status_code=401, detail="Unauthorized: Invalid or missing API Key."
        )
    return api_key_header

# Initialize AI Services
fraud_detector = FraudDetector()
predictor = ConsumptionPredictor()
ocr_system = MeterOCR()
chatbot = AIChatbot()
recommender = RecommendationEngine()

# --- Models ---
class ConsumptionData(BaseModel):
    meter_id: str
    historical_readings: List[float]

class ChatMessage(BaseModel):
    user_id: str
    message: str

class RecommendationRequest(BaseModel):
    customer_id: str
    monthly_consumption: List[float]

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "SEMS AI Service is running."}

@app.post("/api/ai/fraud-detection", dependencies=[Depends(get_api_key)])
def detect_fraud(data: ConsumptionData):
    """
    Analyzes historical readings to detect anomalies or potential theft.
    """
    try:
        result = fraud_detector.analyze_usage(data.historical_readings)
        return {"meter_id": data.meter_id, "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ai/predict-consumption", dependencies=[Depends(get_api_key)])
def predict_consumption(data: ConsumptionData):
    """
    Predicts next month's consumption based on historical data.
    """
    try:
        prediction = predictor.forecast_next_month(data.historical_readings)
        return {"meter_id": data.meter_id, "predicted_consumption": prediction}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ai/ocr-meter", dependencies=[Depends(get_api_key)])
async def ocr_meter_reading(file: UploadFile = File(...)):
    """
    Extracts meter reading digits from an uploaded image using OCR.
    """
    try:
        contents = await file.read()
        reading = ocr_system.extract_digits(contents)
        return {"filename": file.filename, "extracted_reading": reading}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ai/chat", dependencies=[Depends(get_api_key)])
def chat_with_bot(chat: ChatMessage):
    """
    AI Customer Support Chatbot.
    """
    try:
        response = chatbot.get_response(chat.message)
        return {"user_id": chat.user_id, "reply": response}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/ai/recommendations", dependencies=[Depends(get_api_key)])
def get_recommendations(req: RecommendationRequest):
    """
    Generates AI recommendations to save energy based on consumption patterns.
    """
    try:
        tips = recommender.generate_tips(req.monthly_consumption)
        return {"customer_id": req.customer_id, "recommendations": tips}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

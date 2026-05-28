import numpy as np

class FraudDetector:
    def __init__(self):
        # In a real-world scenario, this would load a pre-trained ML model
        # such as an Isolation Forest from sklearn.ensemble
        self.threshold_drop = 0.40  # 40% sudden drop indicates potential tampering
        self.abnormal_spike = 2.0   # 200% sudden spike indicates abnormal usage
        
    def analyze_usage(self, historical_readings: list) -> dict:
        """
        Analyzes historical readings (array of consumption values).
        Uses a simple statistical rule-based model for demonstration,
        representing an Anomaly Detection ML model.
        """
        if not historical_readings or len(historical_readings) < 2:
            return {"status": "insufficient_data", "risk_level": "low", "confidence": 0.0}

        readings = np.array(historical_readings)
        recent = readings[-1]
        historical_avg = np.mean(readings[:-1])
        
        # Avoid division by zero
        if historical_avg == 0:
            return {"status": "normal", "risk_level": "low", "confidence": 0.9}

        ratio = recent / historical_avg

        if ratio <= (1 - self.threshold_drop):
            return {
                "status": "theft_suspected",
                "risk_level": "high",
                "reason": f"Sudden consumption drop of {((1-ratio)*100):.1f}%",
                "confidence": 0.85
            }
        elif ratio >= self.abnormal_spike:
            return {
                "status": "abnormal_usage",
                "risk_level": "medium",
                "reason": f"Abnormal spike of {((ratio-1)*100):.1f}%",
                "confidence": 0.78
            }
        else:
            return {
                "status": "normal",
                "risk_level": "low",
                "reason": "Consumption is within normal variance",
                "confidence": 0.92
            }

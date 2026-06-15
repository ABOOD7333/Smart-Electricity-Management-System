import numpy as np

class ConsumptionPredictor:
    def __init__(self):
        # Placeholders for ML models (e.g., ARIMA, LSTM, or Prophet)
        pass

    def forecast_next_month(self, historical_readings: list) -> float:
        """
        Uses historical data to predict the next month's consumption.
        Mock implementation using weighted moving average mimicking a simple TS model.
        """
        if not historical_readings:
            return 0.0
            
        n = len(historical_readings)
        if n < 3:
            # If not enough data, return simple average
            return round(float(np.mean(historical_readings)), 2)

        # Weighted moving average (giving more weight to recent months)
        weights = np.linspace(1, 3, num=n)
        weights = weights / np.sum(weights)
        
        prediction = np.sum(np.array(historical_readings) * weights)
        
        # Add a slight seasonal random factor (±5%)
        seasonality_factor = np.random.uniform(0.95, 1.05)
        
        return round(float(prediction * seasonality_factor), 2)

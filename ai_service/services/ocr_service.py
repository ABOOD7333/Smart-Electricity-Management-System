import os
import cv2
import numpy as np
import pytesseract

class MeterOCR:
    def __init__(self):
        # Configure tesseract executable path if needed based on OS
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass

    def extract_digits(self, image_bytes: bytes) -> str:
        """
        Takes raw image bytes of a meter, applies computer vision preprocessing,
        and uses Tesseract OCR to extract the reading.
        """
        try:
            # 1. Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            
            # 2. Decode image
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return "Error: Invalid image data"

            # 3. Preprocessing for better OCR
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply Gaussian Blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply thresholding to get black and white image
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # 4. Run Tesseract OCR (digits only configuration)
            # --psm 7: Treat the image as a single text line.
            # -c tessedit_char_whitelist=0123456789: Only look for digits.
            custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789'
            text = pytesseract.image_to_string(thresh, config=custom_config)
            
            # Clean up result
            result = ''.join(filter(str.isdigit, text))
            
            if not result:
                return "Error: Could not detect any digits"
                
            return result
            
        except Exception as e:
            # Mock fallback for demo ONLY if MOCK_AI is set to True
            if os.getenv("MOCK_AI") == "True":
                print(f"OCR Exception (mocking fallback): {str(e)}")
                return "48201"
            else:
                print(f"OCR Exception: {str(e)}")
                raise RuntimeError(f"OCR Engine failed: {str(e)}. Mock mode is not active.")


import numpy as np
from typing import List

class RecommendationEngine:
    def __init__(self):
        pass

    def generate_tips(self, monthly_consumption: List[float]) -> List[str]:
        """
        Generates personalized AI recommendations based on consumption data.
        """
        if not monthly_consumption:
            return ["تأكد من إدخال قراءات صحيحة لنتمكن من تقديم نصائح لك."]
            
        tips = []
        recent = monthly_consumption[-1]
        
        if len(monthly_consumption) >= 2:
            prev = monthly_consumption[-2]
            if recent > prev * 1.15:
                tips.append(f"تنبيه: استهلاكك هذا الشهر أعلى بـ {((recent/prev - 1)*100):.1f}% من الشهر الماضي. نوصي بمراجعة الأجهزة التي تستهلك طاقة عالية مثل المكيفات وسخانات المياه.")
            elif recent < prev * 0.9:
                tips.append("عمل رائع! لقد تمكنت من تقليل استهلاكك مقارنة بالشهر الماضي. استمر في اتباع عادات الترشيد.")
                
        # Static smart recommendations
        tips.append("نصيحة ذكية: استخدام مصابيح LED يوفر ما يصل إلى 80% من طاقة الإضاءة.")
        tips.append("نصيحة ذكية: ضبط المكيف على درجة 24 مئوية يقلل بشكل كبير من الاستهلاك دون التأثير على الراحة.")
        
        return tips

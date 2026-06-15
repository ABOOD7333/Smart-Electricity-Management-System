import re

class AIChatbot:
    def __init__(self):
        # NLP architecture setup for intent recognition
        # In a real app, this connects to an LLM like OpenAI GPT, HuggingFace, or Dialogflow
        
        self.intents = {
            r".*(فاتورة|فواتير|حساب|أدفع|ادفع|رصيد|مستحق).*": self._handle_billing,
            r".*(انقطاع|مقطوعة|طافي|كهرباء طافية|عطل).*": self._handle_outage,
            r".*(استهلاك|صرفية|توفير|نصيحة|ترشيد).*": self._handle_consumption,
            r".*(سلام|مرحبا|أهلا|هلا).*": self._handle_greeting,
        }

    def get_response(self, message: str) -> str:
        """
        Process user message and return an AI response.
        Currently uses basic regex NLP but structured to be easily replaced by LLM integration.
        """
        message = message.lower()
        
        for pattern, handler in self.intents.items():
            if re.match(pattern, message):
                return handler()
                
        return self._handle_unknown()

    def _handle_billing(self) -> str:
        return "يمكنك معرفة وتأكيد دفع الفواتير عبر تطبيقنا. هل ترغب في سداد الفاتورة الأخيرة الآن عبر بوابة الدفع؟"

    def _handle_outage(self) -> str:
        return "نأسف لذلك. قمنا بتسجيل بلاغك تلقائياً برقم التتبع #9923 وسيتم توجيه أقرب فريق فني لموقعك بناءً على نظام التتبع الجغرافي الخاص بنا."

    def _handle_consumption(self) -> str:
        return "يبدو أنك تستفسر عن الاستهلاك. يمكنني تحليل نمط استهلاكك وإرسال نصائح مخصصة لتوفير الطاقة وتقليل التكلفة."

    def _handle_greeting(self) -> str:
        return "أهلاً بك في خدمة العملاء الذكية من SEMS. كيف يمكنني مساعدتك اليوم؟"

    def _handle_unknown(self) -> str:
        return "عذراً، لم أفهم طلبك بالكامل. يمكنك الاستفسار عن الفواتير، الأعطال، أو طرق توفير الطاقة. هل ترغب في التحدث إلى موظف بشري؟"

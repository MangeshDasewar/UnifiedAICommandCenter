// Language detection using simple keyword matching for demo
export function detectLanguage(text: string): string {
  const kannada = /[\u0C80-\u0CFF]/g
  const hindi = /[\u0900-\u097F]/g
  const nepali = /[\u0900-\u097F]/g

  if (kannada.test(text)) return "kannada"
  if (hindi.test(text)) return "hindi"
  if (nepali.test(text)) return "nepali"
  return "en"
}

// Intent classification using keyword matching for demo
export function classifyIntent(text: string, language: string): string {
  const lowerText = text.toLowerCase()

  const intents: Record<string, string[]> = {
    completion: ["done", "completed", "finished", "ready", "ok", "yes", "done with", "completed task"],
    confusion: ["confused", "not understand", "explain", "help", "don't get it", "unclear", "what", "how"],
    insurance_query: ["insurance", "cover", "policy", "claim", "health", "protection"],
    upi_question: ["upi", "payment", "transfer", "money", "how to pay", "gpay", "phone pay"],
    smart_backup_request: ["backup", "storage", "data", "save", "cloud"],
    opt_out: ["stop", "unsubscribe", "remove", "no more", "don't send", "opt out"],
  }

  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return intent
    }
  }

  return "other"
}

// Sentiment analysis using keyword matching for demo
export function analyzeSentiment(text: string): string {
  const lowerText = text.toLowerCase()

  const positive = ["good", "great", "excellent", "thank", "love", "happy", "perfect"]
  const negative = ["bad", "terrible", "hate", "angry", "frustrated", "upset"]
  const confused = ["confused", "unclear", "don't understand", "help", "explain"]

  if (confused.some((word) => lowerText.includes(word))) return "confused"
  if (negative.some((word) => lowerText.includes(word))) return "negative"
  if (positive.some((word) => lowerText.includes(word))) return "positive"

  return "neutral"
}

// Generate auto-response based on intent
export function generateAutoResponse(intent: string, language: string, userName: string): string {
  const responses: Record<string, Record<string, string>> = {
    completion: {
      en: `Thank you ${userName} for completing this task! We'll process your information shortly.`,
      kannada: `${userName}, ಈ ಕಾರ್ಯವನ್ನು ಪೂರ್ಣ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದ! ನಾವು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಶೀಘ್ರವನ್ನೆ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತೇವೆ.`,
      hindi: `${userName}, इस कार्य को पूरा करने के लिए धन्यवाद! हम जल्द ही आपकी जानकारी प्रक्रिया करेंगे।`,
      nepali: `${userName}, यो कार्य पूरा गर्न साहायता गरेकोमा धन्यवाद! हामी चाडै आपको जानकारी प्रक्रिया गर्नेछौं।`,
    },
    confusion: {
      en: `Hi ${userName}, we understand you need help. Our team will reach out to you shortly with detailed guidance.`,
      kannada: `${userName}, ನೀವು ಸಹಾಯದ ಅವಶ್ಯಕತೆ ಇದೆ ಎಂದು ನಾವು ತಿಳಿದಿದ್ದೇವೆ. ನಮ್ಮ ತಂಡವು ಶೀಘ್ರವನ್ನೆ ವಿವರವಾದ ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.`,
      hindi: `${userName}, हम समझते हैं कि आपको मदद की जरूरत है। हमारी टीम शीघ्र ही विस्तृत मार्गदर्शन के साथ आपसे संपर्क करेगी।`,
      nepali: `${userName}, हामीले बुझे कि तपाईंलाई मदत चाहिएको छ। हाम्रो टीम छिटो विस्तृत मार्गदर्शनको साथ तपाईंसँग संपर्क गर्नेछ।`,
    },
    opt_out: {
      en: `We're sorry to see you go! If you change your mind, you can resubscribe anytime.`,
      kannada: `ನಿಮ್ಮನ್ನು ಹೋಗಲು ನೋಡಿ ನಾವು ವಿಷಾದಿತರಾಗಿದ್ದೇವೆ! ನೀವು ಮನವಿ ಮಾರ್ಪಡಿಸಿದರೆ, ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಮರು-ಸದಸ್ಯತೆ ಪಡೆಯಬಹುದು.`,
      hindi: `आपको जाते हुए देखकर हमें खेद है! यदि आप अपना विचार बदलते हैं, तो आप कभी भी पुनः सदस्यता प्राप्त कर सकते हैं।`,
      nepali: `तपाईं जान गरेको देखेर हामीलाई खेद लाग्यो! यदि तपाई आपनो विचार परिवर्तन गर्नुहुन्छ भने, तपाई कहिले पनि पुनः सदस्यता ले सक्नुहुन्छ।`,
    },
  }

  return responses[intent]?.[language] || responses[intent]?.["en"] || `Thank you for your response, ${userName}!`
}

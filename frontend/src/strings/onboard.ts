import type { Translations } from "../i18n";

// Strings owned by the onboard workstream (WorkerOnboard + MicButton). Every key needs en, hi and kn.
export const onboardStrings: Translations = {
  // MicButton (also used on RateWorker)
  micSpeak: { en: "Speak", hi: "बोलें", kn: "ಮಾತನಾಡಿ" },
  micListening: {
    en: "Listening… tap the red button again to finish (up to 30 seconds).",
    hi: "सुन रहे हैं… खत्म करने के लिए लाल बटन फिर से दबाएं (ज़्यादा से ज़्यादा 30 सेकंड)।",
    kn: "ಆಲಿಸುತ್ತಿದ್ದೇವೆ… ಮುಗಿಸಲು ಕೆಂಪು ಬಟನ್ ಅನ್ನು ಮತ್ತೆ ಒತ್ತಿ (ಗರಿಷ್ಠ 30 ಸೆಕೆಂಡು).",
  },
  micProcessing: {
    en: "Understanding your voice…",
    hi: "आपकी आवाज़ समझ रहे हैं…",
    kn: "ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ…",
  },
  micPrompt: {
    en: "Tap the big mic to speak",
    hi: "बोलने के लिए बड़ा माइक दबाएं",
    kn: "ಮಾತನಾಡಲು ದೊಡ್ಡ ಮೈಕ್ ಒತ್ತಿ",
  },

  // WorkerOnboard: voice step
  onbTypeInstead: {
    en: "Type my details instead",
    hi: "जानकारी टाइप करके भरें",
    kn: "ವಿವರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ ತುಂಬಿಸಿ",
  },
  onbTypeHint: {
    en: "You can also type your details instead.",
    hi: "आप अपनी जानकारी टाइप करके भी भर सकते हैं।",
    kn: "ನೀವು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿಯೂ ತುಂಬಿಸಬಹುದು.",
  },
  onbWeHeard: { en: "We heard:", hi: "हमने सुना:", kn: "ನಾವು ಕೇಳಿದ್ದು:" },
  onbVoiceNotCaught: {
    en: "Sorry, I didn't catch that. Please tap the mic and say your name, your work and your area.",
    hi: "माफ़ कीजिए, मैं समझ नहीं पाया। कृपया माइक दबाएं और अपना नाम, अपना काम और अपना इलाका बोलें।",
    kn: "ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ ನಿಮ್ಮ ಹೆಸರು, ಕೆಲಸ ಮತ್ತು ಏರಿಯಾ ಹೇಳಿ.",
  },
  onbVoiceMissingName: {
    en: "I heard your area, but not your name. Please tap the mic and say your name.",
    hi: "मैंने आपका इलाका सुना, पर नाम नहीं। कृपया माइक दबाएं और अपना नाम बोलें।",
    kn: "ನಿಮ್ಮ ಏರಿಯಾ ಕೇಳಿಸಿತು, ಆದರೆ ಹೆಸರು ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ ನಿಮ್ಮ ಹೆಸರು ಹೇಳಿ.",
  },
  onbVoiceMissingArea: {
    en: "I heard your name, but not your area. Please tap the mic and say your area.",
    hi: "मैंने आपका नाम सुना, पर इलाका नहीं। कृपया माइक दबाएं और अपना इलाका बोलें।",
    kn: "ನಿಮ್ಮ ಹೆಸರು ಕೇಳಿಸಿತು, ಆದರೆ ಏರಿಯಾ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ ನಿಮ್ಮ ಏರಿಯಾ ಹೇಳಿ.",
  },
  onbVoiceFailed: {
    en: "Sorry, I could not understand the recording. Please try again, or type your details.",
    hi: "माफ़ कीजिए, रिकॉर्डिंग समझ नहीं आई। कृपया फिर से कोशिश करें या अपनी जानकारी टाइप करें।",
    kn: "ಕ್ಷಮಿಸಿ, ರೆಕಾರ್ಡಿಂಗ್ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ.",
  },

  // WorkerOnboard: confirm step
  onbConfirmHint: {
    en: "Check your details. Tap a box to fix anything that is wrong.",
    hi: "अपनी जानकारी जाँचें। कुछ गलत हो तो उस बॉक्स को दबाकर ठीक करें।",
    kn: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಏನಾದರೂ ತಪ್ಪಿದ್ದರೆ ಆ ಬಾಕ್ಸ್ ಒತ್ತಿ ಸರಿಪಡಿಸಿ.",
  },
  onbNameLabel: { en: "Your name", hi: "आपका नाम", kn: "ನಿಮ್ಮ ಹೆಸರು" },
  onbTradeLabel: { en: "Your work", hi: "आपका काम", kn: "ನಿಮ್ಮ ಕೆಲಸ" },
  onbAreaLabel: {
    en: "Your area in Bengaluru",
    hi: "बेंगलुरु में आपका इलाका",
    kn: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಿಮ್ಮ ಏರಿಯಾ",
  },
  onbFillMissing: {
    en: "Please fill in your name and area to continue.",
    hi: "आगे बढ़ने के लिए कृपया अपना नाम और इलाका भरें।",
    kn: "ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಏರಿಯಾ ತುಂಬಿಸಿ.",
  },
  onbReadBack: {
    en: "{name}, {trade}, {area}. Is this correct?",
    hi: "{name}, {trade}, {area}। क्या यह सही है?",
    kn: "{name}, {trade}, {area}. ಇದು ಸರಿಯೇ?",
  },
  onbAreaNotFound: {
    en: "We could not find this area. Please check the area name and try again.",
    hi: "हमें यह इलाका नहीं मिला। कृपया इलाके का नाम जाँचकर फिर से कोशिश करें।",
    kn: "ಈ ಏರಿಯಾ ನಮಗೆ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಏರಿಯಾದ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },

  // WorkerOnboard: phone step
  onbPhoneSpeak: {
    en: "Type your 10-digit mobile number, then tap Create My Passport.",
    hi: "अपना 10 अंकों का मोबाइल नंबर टाइप करें, फिर 'मेरा पासपोर्ट बनाएं' दबाएं।",
    kn: "ನಿಮ್ಮ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ, ನಂತರ 'ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್ ರಚಿಸಿ' ಒತ್ತಿ.",
  },
  onbDigitCount: {
    en: "{count} of 10 digits",
    hi: "10 में से {count} अंक",
    kn: "10 ರಲ್ಲಿ {count} ಅಂಕಿಗಳು",
  },
  onbPhoneInvalid: {
    en: "Please enter a valid 10-digit mobile number that starts with 6, 7, 8 or 9.",
    hi: "कृपया 6, 7, 8 या 9 से शुरू होने वाला सही 10 अंकों का मोबाइल नंबर डालें।",
    kn: "ದಯವಿಟ್ಟು 6, 7, 8 ಅಥವಾ 9 ರಿಂದ ಆರಂಭವಾಗುವ ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.",
  },
  onbPhoneTaken: {
    en: "This number is already registered with a different name. Check your name, or use another number.",
    hi: "यह नंबर किसी दूसरे नाम से पहले से पंजीकृत है। अपना नाम जाँचें या दूसरा नंबर डालें।",
    kn: "ಈ ಸಂಖ್ಯೆ ಬೇರೆ ಹೆಸರಿನಲ್ಲಿ ಈಗಾಗಲೇ ನೋಂದಾಯಿತವಾಗಿದೆ. ನಿಮ್ಮ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಬೇರೆ ಸಂಖ್ಯೆ ಬಳಸಿ.",
  },
};

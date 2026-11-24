import type { Translations } from "../i18n";

// Strings shared by every screen. Workstream-specific strings live in the sibling files.
export const commonStrings: Translations = {
  back: { en: "Back", hi: "वापस", kn: "ಹಿಂದೆ" },
  cancel: { en: "Cancel", hi: "रद्द करें", kn: "ರದ್ದುಮಾಡಿ" },
  exit: { en: "Exit", hi: "बाहर निकलें", kn: "ನಿರ್ಗಮಿಸಿ" },
  home: { en: "Home", hi: "होम", kn: "ಮುಖಪುಟ" },
  retry: { en: "Try again", hi: "फिर से कोशिश करें", kn: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ" },
  listen: { en: "Listen", hi: "सुनें", kn: "ಕೇಳಿ" },
  stopAudio: { en: "Stop", hi: "रोकें", kn: "ನಿಲ್ಲಿಸಿ" },
  loading: { en: "Loading…", hi: "लोड हो रहा है…", kn: "ಲೋಡ್ ಆಗುತ್ತಿದೆ…" },
  language: { en: "Language", hi: "भाषा", kn: "ಭಾಷೆ" },
  skillPassport: { en: "Skill Passport", hi: "स्किल पासपोर्ट", kn: "ಕೌಶಲ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್" },
  networkError: {
    en: "No internet connection. Please check it and try again.",
    hi: "इंटरनेट कनेक्शन नहीं है। कृपया जाँच कर फिर से कोशिश करें।",
    kn: "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  genericError: {
    en: "Something went wrong. Please try again.",
    hi: "कुछ गलत हो गया। कृपया फिर से कोशिश करें।",
    kn: "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  saveError: {
    en: "Could not save. Please try again.",
    hi: "सेव नहीं हो सका। कृपया फिर से कोशिश करें।",
    kn: "ಉಳಿಸಲು ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  micPermission: {
    en: "Please allow microphone access in your browser settings, then try again.",
    hi: "कृपया ब्राउज़र सेटिंग में माइक्रोफ़ोन की अनुमति दें, फिर से कोशिश करें।",
    kn: "ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ, ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  cameraPermission: {
    en: "Please allow camera and microphone access in your browser settings, then try again.",
    hi: "कृपया ब्राउज़र सेटिंग में कैमरा और माइक्रोफ़ोन की अनुमति दें, फिर से कोशिश करें।",
    kn: "ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಮತ್ತು ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನೀಡಿ, ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  mediaUnsupported: {
    en: "This browser cannot record here. Please open the app in Chrome (https or localhost).",
    hi: "यह ब्राउज़र यहाँ रिकॉर्ड नहीं कर सकता। कृपया ऐप को Chrome में खोलें (https या localhost)।",
    kn: "ಈ ಬ್ರೌಸರ್ ಇಲ್ಲಿ ರೆಕಾರ್ಡ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಆ್ಯಪ್ ಅನ್ನು Chrome ನಲ್ಲಿ ತೆರೆಯಿರಿ (https ಅಥವಾ localhost).",
  },
  noDevice: {
    en: "No camera or microphone was found on this device.",
    hi: "इस डिवाइस पर कैमरा या माइक्रोफ़ोन नहीं मिला।",
    kn: "ಈ ಸಾಧನದಲ್ಲಿ ಕ್ಯಾಮೆರಾ ಅಥವಾ ಮೈಕ್ರೊಫೋನ್ ಕಂಡುಬಂದಿಲ್ಲ.",
  },
  trade_electrician: { en: "Electrician", hi: "इलेक्ट्रीशियन", kn: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್" },
  trade_plumber: { en: "Plumber", hi: "प्लम्बर", kn: "ಪ್ಲಂಬರ್" },
  trade_mason: { en: "Mason", hi: "राजमिस्त्री", kn: "ಗಾರೆ ಕೆಲಸಗಾರ" },
  trade_other: { en: "Other trade", hi: "अन्य काम", kn: "ಇತರೆ ಕೆಲಸ" },
  trade_general: { en: "Worker", hi: "कामगार", kn: "ಕೆಲಸಗಾರ" },
};

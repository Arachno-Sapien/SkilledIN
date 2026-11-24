import type { Translations } from "../i18n";

// Strings owned by the challenge workstream. Every key needs en, hi and kn.
// "ch" prefix: all strings files merge into one object, so a shared name would silently overwrite another.
export const challengeStrings: Translations = {
  chLiveBadge: {
    en: "Live AI skill check",
    hi: "लाइव AI कौशल जाँच",
    kn: "ಲೈವ್ AI ಕೌಶಲ್ಯ ಪರಿಶೀಲನೆ",
  },
  chGettingCode: {
    en: "Getting your challenge code…",
    hi: "आपका परीक्षा कोड लाया जा रहा है…",
    kn: "ನಿಮ್ಮ ಪರೀಕ್ಷಾ ಕೋಡ್ ಪಡೆಯಲಾಗುತ್ತಿದೆ…",
  },
  chCodeTitle: {
    en: "Your secret code",
    hi: "आपका गुप्त कोड",
    kn: "ನಿಮ್ಮ ರಹಸ್ಯ ಕೋಡ್",
  },
  chCodeHint: {
    en: "Say this 3-digit code out loud as soon as recording starts.",
    hi: "रिकॉर्डिंग शुरू होते ही यह 3 अंकों का कोड ज़ोर से बोलें।",
    kn: "ರೆಕಾರ್ಡಿಂಗ್ ಶುರುವಾದ ತಕ್ಷಣ ಈ 3 ಅಂಕಿಯ ಕೋಡ್ ಅನ್ನು ಜೋರಾಗಿ ಹೇಳಿ.",
  },
  chCodeSpeech: {
    en: "Your challenge code is {code}. Say it at the start of the video.",
    hi: "आपका परीक्षा कोड है {code}। वीडियो की शुरुआत में इसे बोलें।",
    kn: "ನಿಮ್ಮ ಪರೀಕ್ಷಾ ಕೋಡ್ {code}. ವೀಡಿಯೊದ ಆರಂಭದಲ್ಲಿ ಇದನ್ನು ಹೇಳಿ.",
  },
  chChecklistTitle: {
    en: "Steps the AI will look for",
    hi: "AI ये कदम देखेगा",
    kn: "AI ಈ ಹಂತಗಳನ್ನು ನೋಡುತ್ತದೆ",
  },
  chSafetyCritical: {
    en: "Safety step, must show",
    hi: "सुरक्षा कदम, ज़रूर दिखाएं",
    kn: "ಸುರಕ್ಷತಾ ಹಂತ, ಕಡ್ಡಾಯವಾಗಿ ತೋರಿಸಿ",
  },
  chBackToPassport: {
    en: "Back to my passport",
    hi: "मेरे पासपोर्ट पर वापस जाएं",
    kn: "ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಹಿಂದಿರುಗಿ",
  },
  chRecordingNow: {
    en: "Recording",
    hi: "रिकॉर्डिंग चालू",
    kn: "ರೆಕಾರ್ಡಿಂಗ್ ನಡೆಯುತ್ತಿದೆ",
  },
  chStartingCamera: {
    en: "Starting camera…",
    hi: "कैमरा चालू हो रहा है…",
    kn: "ಕ್ಯಾಮೆರಾ ಆನ್ ಆಗುತ್ತಿದೆ…",
  },
  chSayThisCode: {
    en: "Say this code",
    hi: "यह कोड बोलें",
    kn: "ಈ ಕೋಡ್ ಹೇಳಿ",
  },
  chFinish: {
    en: "Finish",
    hi: "पूरा करें",
    kn: "ಮುಗಿಸಿ",
  },
  chSecondsLeft: {
    en: "{n} seconds left",
    hi: "{n} सेकंड बाकी",
    kn: "{n} ಸೆಕೆಂಡುಗಳು ಉಳಿದಿವೆ",
  },
  chUploading: {
    en: "Sending your video…",
    hi: "आपका वीडियो भेजा जा रहा है…",
    kn: "ನಿಮ್ಮ ವೀಡಿಯೊ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
  },
  chAnalyzingBody: {
    en: "Please keep this screen open. This can take up to 2 minutes.",
    hi: "कृपया यह स्क्रीन खुली रखें। इसमें 2 मिनट तक लग सकते हैं।",
    kn: "ದಯವಿಟ್ಟು ಈ ಪರದೆಯನ್ನು ತೆರೆದಿಡಿ. ಇದಕ್ಕೆ 2 ನಿಮಿಷಗಳವರೆಗೆ ಬೇಕಾಗಬಹುದು.",
  },
  chAnalyzingSpeech: {
    en: "Please wait. We are sending and checking your video.",
    hi: "कृपया रुकें। हम आपका वीडियो भेजकर जाँच रहे हैं।",
    kn: "ದಯವಿಟ್ಟು ಕಾಯಿರಿ. ನಿಮ್ಮ ವೀಡಿಯೊವನ್ನು ಕಳುಹಿಸಿ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ.",
  },
  chTip: {
    en: "Tip",
    hi: "सुझाव",
    kn: "ಸಲಹೆ",
  },
  chStepsTitle: {
    en: "What the AI saw",
    hi: "AI ने क्या देखा",
    kn: "AI ಏನು ನೋಡಿತು",
  },
  chSeen: {
    en: "Seen",
    hi: "दिखा",
    kn: "ಕಂಡಿತು",
  },
  chNotSeen: {
    en: "Not seen",
    hi: "नहीं दिखा",
    kn: "ಕಾಣಲಿಲ್ಲ",
  },
  chUnclear: {
    en: "Not clear",
    hi: "साफ़ नहीं दिखा",
    kn: "ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಲಿಲ್ಲ",
  },
  chReviewNote: {
    en: "Your video is saved for review. You can try again now.",
    hi: "आपका वीडियो समीक्षा के लिए सहेज लिया गया है। आप अभी फिर से कोशिश कर सकते हैं।",
    kn: "ನಿಮ್ಮ ವೀಡಿಯೊವನ್ನು ಪರಿಶೀಲನೆಗಾಗಿ ಉಳಿಸಲಾಗಿದೆ. ನೀವು ಈಗಲೇ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಬಹುದು.",
  },
  chGoToPassport: {
    en: "Go to my passport",
    hi: "मेरे पासपोर्ट पर जाएं",
    kn: "ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಹೋಗಿ",
  },
  chLoadError: {
    en: "Could not get your challenge code. Please try again.",
    hi: "परीक्षा कोड नहीं मिल सका। कृपया फिर से कोशिश करें।",
    kn: "ಪರೀಕ್ಷಾ ಕೋಡ್ ಪಡೆಯಲು ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  chPassportMissing: {
    en: "We could not find your passport. Please register again.",
    hi: "हमें आपका पासपोर्ट नहीं मिला। कृपया फिर से पंजीकरण करें।",
    kn: "ನಿಮ್ಮ ಪಾಸ್‌ಪೋರ್ಟ್ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ನೋಂದಾಯಿಸಿ.",
  },
  chRegisterAgain: {
    en: "Register again",
    hi: "फिर से पंजीकरण करें",
    kn: "ಮತ್ತೆ ನೋಂದಾಯಿಸಿ",
  },
  chCameraBusy: {
    en: "The camera is being used by another app. Close that app and try again.",
    hi: "कैमरा किसी दूसरे ऐप में चल रहा है। उस ऐप को बंद करके फिर से कोशिश करें।",
    kn: "ಕ್ಯಾಮೆರಾವನ್ನು ಬೇರೆ ಆ್ಯಪ್ ಬಳಸುತ್ತಿದೆ. ಆ ಆ್ಯಪ್ ಮುಚ್ಚಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  chCameraFailed: {
    en: "Could not start the camera. Please try again.",
    hi: "कैमरा चालू नहीं हो सका। कृपया फिर से कोशिश करें।",
    kn: "ಕ್ಯಾಮೆರಾ ಆನ್ ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  chNoPicture: {
    en: "The camera did not show a picture. Please record again.",
    hi: "कैमरे में तस्वीर नहीं आई। कृपया फिर से रिकॉर्ड करें।",
    kn: "ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಚಿತ್ರ ಬರಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ.",
  },
  chRecordAgain: {
    en: "Record again",
    hi: "फिर से रिकॉर्ड करें",
    kn: "ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ",
  },
  chUploadFailed: {
    en: "Your video could not be sent. Check your internet and try again.",
    hi: "आपका वीडियो नहीं भेजा जा सका। इंटरनेट जाँचें और फिर से कोशिश करें।",
    kn: "ನಿಮ್ಮ ವೀಡಿಯೊ ಕಳುಹಿಸಲು ಆಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  chSubmitFailed: {
    en: "Your video could not be checked right now. Please try again.",
    hi: "अभी आपके वीडियो की जाँच नहीं हो सकी। कृपया फिर से कोशिश करें।",
    kn: "ಈಗ ನಿಮ್ಮ ವೀಡಿಯೊ ಪರಿಶೀಲಿಸಲು ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  chExpired: {
    en: "This challenge code has expired. Get a new code and record again.",
    hi: "यह परीक्षा कोड समाप्त हो गया है। नया कोड लें और फिर से रिकॉर्ड करें।",
    kn: "ಈ ಪರೀಕ್ಷಾ ಕೋಡ್‌ನ ಅವಧಿ ಮುಗಿದಿದೆ. ಹೊಸ ಕೋಡ್ ಪಡೆದು ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ.",
  },
  chNewCode: {
    en: "Get a new code",
    hi: "नया कोड लें",
    kn: "ಹೊಸ ಕೋಡ್ ಪಡೆಯಿರಿ",
  },
  chVideoMissing: {
    en: "Your video did not reach us. Please send it again.",
    hi: "आपका वीडियो हम तक नहीं पहुँचा। कृपया इसे फिर से भेजें।",
    kn: "ನಿಮ್ಮ ವೀಡಿಯೊ ನಮಗೆ ತಲುಪಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಕಳುಹಿಸಿ.",
  },
};

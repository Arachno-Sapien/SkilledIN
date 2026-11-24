import type { Translations } from "../i18n";

// Strings owned by the home workstream (Navbar, Landing, WorkerHome, QrCard, BadgeCard).
// Every key needs en, hi and kn. Keys are prefixed by screen so they never collide with sibling files.
export const homeStrings: Translations = {
  // Navbar: spoken in the NEW language right after switching, so it is read by language, not via t().
  navLangSwitched: {
    en: "Language set to English",
    hi: "भाषा हिंदी चुनी गई",
    kn: "ಕನ್ನಡ ಭಾಷೆ ಆಯ್ಕೆಯಾಗಿದೆ",
  },

  // Landing
  landingHeroBadge: {
    en: "India's voice-first platform for skilled workers",
    hi: "कारीगरों के लिए भारत का आवाज़ से चलने वाला प्लेटफ़ॉर्म",
    kn: "ಕುಶಲ ಕೆಲಸಗಾರರಿಗಾಗಿ ಭಾರತದ ಧ್ವನಿ-ಆಧಾರಿತ ವೇದಿಕೆ",
  },
  landingHeroLine1: {
    en: "Prove your skill.",
    hi: "अपना हुनर साबित करें।",
    kn: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಸಾಬೀತುಪಡಿಸಿ.",
  },
  landingHeroLine2: {
    en: "Get hired by voice.",
    hi: "बोलकर काम पाएं।",
    kn: "ಮಾತನಾಡಿ ಕೆಲಸ ಪಡೆಯಿರಿ.",
  },
  landingContinue: {
    en: "Continue to my passport",
    hi: "मेरे पासपोर्ट पर जाएं",
    kn: "ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ",
  },
  landingContinueSub: {
    en: "Open the passport saved on this phone",
    hi: "इस फ़ोन पर सेव पासपोर्ट खोलें",
    kn: "ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಿದ ಪಾಸ್‌ಪೋರ್ಟ್ ತೆರೆಯಿರಿ",
  },
  landingRegisterDifferent: {
    en: "Register a different worker",
    hi: "किसी दूसरे कारीगर को रजिस्टर करें",
    kn: "ಬೇರೆ ಕೆಲಸಗಾರರನ್ನು ನೋಂದಾಯಿಸಿ",
  },
  landingHowItWorks: {
    en: "How SkilledIN works",
    hi: "SkilledIN कैसे काम करता है",
    kn: "SkilledIN ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  },
  landingHowVideoTitle: {
    en: "Live video test:",
    hi: "लाइव वीडियो परीक्षा:",
    kn: "ಲೈವ್ ವೀಡಿಯೊ ಪರೀಕ್ಷೆ:",
  },
  landingHowVideo: {
    en: "a {seconds}-second practical task, checked by AI",
    hi: "{seconds} सेकंड का प्रैक्टिकल काम, जिसे AI जाँचता है",
    kn: "{seconds} ಸೆಕೆಂಡುಗಳ ಪ್ರಾಯೋಗಿಕ ಕೆಲಸ, AI ಪರಿಶೀಲಿಸುತ್ತದೆ",
  },
  landingHowStampTitle: {
    en: "Customer stamp:",
    hi: "ग्राहक स्टैम्प:",
    kn: "ಗ್ರಾಹಕರ ಸ್ಟ್ಯಾಂಪ್:",
  },
  landingHowStamp: {
    en: "customers add voice reviews and star ratings to your QR passport",
    hi: "ग्राहक आपके QR पासपोर्ट पर आवाज़ में राय और स्टार रेटिंग देते हैं",
    kn: "ಗ್ರಾಹಕರು ನಿಮ್ಮ QR ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಧ್ವನಿ ಅಭಿಪ್ರಾಯ ಮತ್ತು ಸ್ಟಾರ್ ರೇಟಿಂಗ್ ಸೇರಿಸುತ್ತಾರೆ",
  },
  landingHowHireTitle: {
    en: "Hire by speaking:",
    hi: "बोलकर काम पर रखें:",
    kn: "ಮಾತನಾಡಿ ನೇಮಿಸಿ:",
  },
  landingHowHire: {
    en: "contractors find verified workers nearby just by talking",
    hi: "ठेकेदार सिर्फ़ बोलकर पास के प्रमाणित कारीगर ढूँढते हैं",
    kn: "ಗುತ್ತಿಗೆದಾರರು ಮಾತನಾಡುವ ಮೂಲಕವೇ ಹತ್ತಿರದ ದೃಢೀಕೃತ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕುತ್ತಾರೆ",
  },
  landingFooter: {
    en: "Built by Team Adversity for wHACKiest 2026 · Track 4 UnlockED",
    hi: "टीम Adversity ने wHACKiest 2026 के लिए बनाया · Track 4 UnlockED",
    kn: "wHACKiest 2026 ಗಾಗಿ ಟೀಮ್ Adversity ನಿರ್ಮಿಸಿದೆ · Track 4 UnlockED",
  },

  // WorkerHome
  homeTitle: {
    en: "My Skill Passport",
    hi: "मेरा स्किल पासपोर्ट",
    kn: "ನನ್ನ ಕೌಶಲ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್",
  },
  homeSaved: {
    en: "Passport saved. Next time, open SkilledIN and tap “Continue to my passport”.",
    hi: "पासपोर्ट सेव हो गया। अगली बार SkilledIN खोलें और “मेरे पासपोर्ट पर जाएं” दबाएं।",
    kn: "ಪಾಸ್‌ಪೋರ್ಟ್ ಉಳಿಸಲಾಗಿದೆ. ಮುಂದಿನ ಬಾರಿ SkilledIN ತೆರೆದು “ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ” ಒತ್ತಿ.",
  },
  homeWelcomeBack: {
    en: "Welcome back, {name}. We found your saved passport.",
    hi: "फिर से स्वागत है, {name}। आपका सेव किया हुआ पासपोर्ट मिल गया।",
    kn: "ಮರಳಿ ಸ್ವಾಗತ, {name}. ನಿಮ್ಮ ಉಳಿಸಿದ ಪಾಸ್‌ಪೋರ್ಟ್ ಸಿಕ್ಕಿದೆ.",
  },
  homeSummary: {
    en: "{name}, {trade}, {area}. {level}.",
    hi: "{name}, {trade}, {area}। {level}।",
    kn: "{name}, {trade}, {area}. {level}.",
  },
  homeNotFound: {
    en: "We could not find this passport. Please register again.",
    hi: "यह पासपोर्ट नहीं मिला। कृपया फिर से रजिस्टर करें।",
    kn: "ಈ ಪಾಸ್‌ಪೋರ್ಟ್ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ನೋಂದಾಯಿಸಿ.",
  },
  homeRegister: {
    en: "Register as a new worker",
    hi: "नए कारीगर के रूप में रजिस्टर करें",
    kn: "ಹೊಸ ಕೆಲಸಗಾರರಾಗಿ ನೋಂದಾಯಿಸಿ",
  },
  homeNotYou: {
    en: "Not you? Register a new worker",
    hi: "आप नहीं हैं? नया कारीगर रजिस्टर करें",
    kn: "ಇದು ನೀವಲ್ಲವೇ? ಹೊಸ ಕೆಲಸಗಾರರನ್ನು ನೋಂದಾಯಿಸಿ",
  },
  homeExitSub: {
    en: "Your passport stays saved on this phone",
    hi: "आपका पासपोर्ट इस फ़ोन पर सेव रहेगा",
    kn: "ನಿಮ್ಮ ಪಾಸ್‌ಪೋರ್ಟ್ ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಯುತ್ತದೆ",
  },
  homeExamDuration: {
    en: "({sec}-second live test)",
    hi: "({sec} सेकंड की लाइव परीक्षा)",
    kn: "({sec} ಸೆಕೆಂಡುಗಳ ಲೈವ್ ಪರೀಕ್ಷೆ)",
  },
  homeSkillsError: {
    en: "Could not load your skill test. Check your internet and try again.",
    hi: "आपकी कौशल परीक्षा लोड नहीं हो सकी। इंटरनेट जाँचें और फिर से कोशिश करें।",
    kn: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಪರೀಕ್ಷೆ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಇಂಟರ್ನೆಟ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  homeOffersHint: {
    en: "Contractors choose workers who are nearby and have verified badges.",
    hi: "ठेकेदार पास के और प्रमाणित बैज वाले कारीगरों को चुनते हैं।",
    kn: "ಗುತ್ತಿಗೆದಾರರು ಹತ್ತಿರದಲ್ಲಿರುವ ಮತ್ತು ದೃಢೀಕೃತ ಬ್ಯಾಡ್ಜ್ ಇರುವ ಕೆಲಸಗಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತಾರೆ.",
  },
  homeEarnedBadges: {
    en: "Earned badges ({n})",
    hi: "मिले हुए बैज ({n})",
    kn: "ಗಳಿಸಿದ ಬ್ಯಾಡ್ಜ್‌ಗಳು ({n})",
  },
  homeStampSubtitle: {
    en: "Ask a customer whose work you finished for a 5-second voice stamp",
    hi: "जिस ग्राहक का काम पूरा किया, उनसे 5 सेकंड का वॉयस स्टैम्प लें",
    kn: "ಕೆಲಸ ಮುಗಿಸಿದ ಗ್ರಾಹಕರಿಂದ 5 ಸೆಕೆಂಡುಗಳ ಧ್ವನಿ ಸ್ಟ್ಯಾಂಪ್ ಪಡೆಯಿರಿ",
  },

  // /jobs/:id page title (App.tsx)
  jobPageTitle: {
    en: "Job status",
    hi: "काम की स्थिति",
    kn: "ಕೆಲಸದ ಸ್ಥಿತಿ",
  },

  // QrCard
  qrCardShare: { en: "Share", hi: "शेयर करें", kn: "ಹಂಚಿಕೊಳ್ಳಿ" },
  qrCardCopy: { en: "Copy link", hi: "लिंक कॉपी करें", kn: "ಲಿಂಕ್ ಕಾಪಿ ಮಾಡಿ" },
  qrCardCopied: {
    en: "Passport link copied",
    hi: "पासपोर्ट लिंक कॉपी हो गया",
    kn: "ಪಾಸ್‌ಪೋರ್ಟ್ ಲಿಂಕ್ ಕಾಪಿ ಆಗಿದೆ",
  },
  qrCardCopyFailed: {
    en: "Could not copy the link. Please use Share instead.",
    hi: "लिंक कॉपी नहीं हो सका। कृपया शेयर बटन का उपयोग करें।",
    kn: "ಲಿಂಕ್ ಕಾಪಿ ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಹಂಚಿಕೊಳ್ಳಿ ಬಟನ್ ಬಳಸಿ.",
  },
  qrCardSave: { en: "Save QR", hi: "QR सेव करें", kn: "QR ಉಳಿಸಿ" },
  qrCardAlt: {
    en: "QR code for {name}'s skill passport",
    hi: "{name} के स्किल पासपोर्ट का QR कोड",
    kn: "{name} ಅವರ ಕೌಶಲ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್‌ನ QR ಕೋಡ್",
  },
  qrCardShareTitle: {
    en: "My SkilledIN passport",
    hi: "मेरा SkilledIN पासपोर्ट",
    kn: "ನನ್ನ SkilledIN ಪಾಸ್‌ಪೋರ್ಟ್",
  },
  qrCardShareText: {
    en: "My skill passport on SkilledIN: {name} ({trade}), {area}.",
    hi: "SkilledIN पर मेरा स्किल पासपोर्ट: {name} ({trade}), {area}।",
    kn: "SkilledIN ನಲ್ಲಿ ನನ್ನ ಕೌಶಲ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್: {name} ({trade}), {area}.",
  },

  // BadgeCard
  badgeCardScore: { en: "Score {score}/100", hi: "स्कोर {score}/100", kn: "ಅಂಕ {score}/100" },
  badgeCardChecklist: {
    en: "What the AI checked",
    hi: "AI ने क्या जाँचा",
    kn: "AI ಏನು ಪರಿಶೀಲಿಸಿತು",
  },
  badgeCardSeen: { en: "Seen", hi: "दिखा", kn: "ಕಂಡಿದೆ" },
  badgeCardNotSeen: { en: "Not seen", hi: "नहीं दिखा", kn: "ಕಾಣಲಿಲ್ಲ" },
  badgeCardUnclear: { en: "Unclear", hi: "साफ़ नहीं", kn: "ಸ್ಪಷ್ಟವಿಲ್ಲ" },
  badgeCardSpeech: {
    en: "{title}. Passed the practical skill test on camera.",
    hi: "{title}। कैमरे पर प्रैक्टिकल कौशल परीक्षा पास की।",
    kn: "{title}. ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಪ್ರಾಯೋಗಿಕ ಕೌಶಲ್ಯ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಉತ್ತೀರ್ಣರಾಗಿದ್ದಾರೆ.",
  },
};

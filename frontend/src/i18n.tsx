import React, { createContext, useContext, useState, useEffect } from "react";
import { commonStrings } from "./strings/common";
import { challengeStrings } from "./strings/challenge";
import { onboardStrings } from "./strings/onboard";
import { homeStrings } from "./strings/home";
import { otherStrings } from "./strings/other";

export type Language = "en" | "hi" | "kn";

export interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    kn: string;
  };
}

const baseStrings: Translations = {
  // App General
  appName: {
    en: "SkilledIN",
    hi: "SkilledIN",
    kn: "SkilledIN",
  },
  tagline: {
    en: "Voice-first skill passports for India's blue-collar workers",
    hi: "भारत के कारीगरों के लिए आवाज-आधारित कौशल पासपोर्ट",
    kn: "ಭಾರತದ ಶ್ರಮಿಕರಿಗಾಗಿ ಧ್ವನಿ-ಆಧಾರಿತ ಕೌಶಲ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್",
  },
  // Landing
  chooseRole: {
    en: "Who are you?",
    hi: "आप कौन हैं?",
    kn: "ನೀವು ಯಾರು?",
  },
  imWorker: {
    en: "I am a Worker",
    hi: "मैं कामगार / कारीगर हूँ",
    kn: "ನಾನು ಕೆಲಸಗಾರ / ಕುಶಲಕರ್ಮಿ",
  },
  imWorkerSub: {
    en: "Show your skill, get verified & find daily jobs",
    hi: "अपना हुनर दिखाएं, प्रमाण पाएं और रोज़गार पाएं",
    kn: "ನಿಮ್ಮ ಕೌಶಲ್ಯ ತೋರಿಸಿ, ದೃಢೀಕರಣ ಪಡೆಯಿರಿ ಮತ್ತು ಕೆಲಸ ಹುಡುಕಿ",
  },
  imContractor: {
    en: "I want to Hire",
    hi: "मुझे कारीगर चाहिए",
    kn: "ನನಗೆ ಕೆಲಸಗಾರರು ಬೇಕು",
  },
  imContractorSub: {
    en: "Speak to hire verified electricians, plumbers & masons",
    hi: "बोलकर प्रमाणित इलेक्ट्रीशियन, प्लम्बर व मिस्त्री खोजें",
    kn: "ದೃಢೀಕೃತ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್ ಮತ್ತು ಗಾರೆ ಕೆಲಸಗಾರರನ್ನು ಮಾತನಾಡಿ ನೇಮಿಸಿ",
  },
  // Onboarding
  onboardTitle: {
    en: "Tell us about yourself",
    hi: "अपने बारे में बताएं",
    kn: "ನಿಮ್ಮ ಬಗ್ಗೆ ತಿಳಿಸಿ",
  },
  onboardInstruction: {
    en: "Tap the mic and speak: your name, your trade, and your area in Bengaluru.",
    hi: "माइक दबाएं और बोलें: आपका नाम, आपका काम और बेंगलुरु में आपका इलाका।",
    kn: "ಮೈಕ್ ಒತ್ತಿ ಮಾತನಾಡಿ: ನಿಮ್ಮ ಹೆಸರು, ನಿಮ್ಮ ಕೆಲಸ ಮತ್ತು ಬೆಂಗಳೂರಿನ ನಿಮ್ಮ ಏರಿಯಾ.",
  },
  tapToSpeak: {
    en: "Tap to Speak",
    hi: "बोलने के लिए दबाएं",
    kn: "ಮಾತನಾಡಲು ಒತ್ತಿ",
  },
  listening: {
    en: "Listening… speak clearly",
    hi: "सुन रहे हैं… स्पष्ट बोलें",
    kn: "ಆಲಿಸಲಾಗುತ್ತಿದೆ… ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ",
  },
  confirmDetails: {
    en: "Is this correct?",
    hi: "क्या यह जानकारी सही है?",
    kn: "ಈ ಮಾಹಿತಿ ಸರಿಯಾಗಿದೆಯೇ?",
  },
  confirmYes: {
    en: "Yes, Correct",
    hi: "हाँ, बिल्कुल सही",
    kn: "ಹೌದು, ಸರಿ",
  },
  sayAgain: {
    en: "Say It Again",
    hi: "दोबारा बोलें",
    kn: "ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ",
  },
  enterPhone: {
    en: "Enter Mobile Number",
    hi: "मोबाइल नंबर दर्ज करें",
    kn: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
  },
  phonePlaceholder: {
    en: "10-digit mobile number",
    hi: "10-अंकों का मोबाइल नंबर",
    kn: "10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
  },
  createPassport: {
    en: "Create My Passport",
    hi: "मेरा पासपोर्ट बनाएं",
    kn: "ನನ್ನ ಪಾಸ್‌ಪೋರ್ಟ್ ರಚಿಸಿ",
  },
  phoneTaken: {
    en: "This number is already registered. Please type a different number.",
    hi: "यह नंबर पहले से पंजीकृत है। कृपया दूसरा नंबर दर्ज करें।",
    kn: "ಈ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ. ದಯವಿಟ್ಟು ಬೇರೆ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
  },
  // Worker Home
  workerLevel0: {
    en: "Level 0: Registered",
    hi: "लेवल 0: पंजीकृत",
    kn: "ಹಂತ 0: ನೋಂದಾಯಿತ",
  },
  workerLevel1: {
    en: "Level 1: Verified",
    hi: "लेवल 1: प्रमाणित",
    kn: "ಹಂತ 1: ದೃಢೀಕೃತ",
  },
  workerLevel2: {
    en: "Level 2: Experienced",
    hi: "लेवल 2: अनुभवी",
    kn: "ಹಂತ 2: ಅನುಭವಿ",
  },
  workerLevel3: {
    en: "Level 3: Master",
    hi: "लेवल 3: उस्ताद / मास्टर",
    kn: "ಹಂತ 3: ಮಾಸ್ಟರ್",
  },
  proveSkill: {
    en: "Prove My Skill (Video Challenge)",
    hi: "अपना हुनर साबित करें (वीडियो परीक्षा)",
    kn: "ನನ್ನ ಕೌಶಲ್ಯ ಸಾಬೀತುಪಡಿಸಿ (ವೀಡಿಯೊ ಪರೀಕ್ಷೆ)",
  },
  noTasksYet: {
    en: "No tasks available for this trade yet",
    hi: "इस काम के लिए अभी परीक्षा उपलब्ध नहीं है",
    kn: "ಈ ಕೆಲಸಕ್ಕೆ ಇನ್ನೂ ಪರೀಕ್ಷೆ ಲಭ್ಯವಿಲ್ಲ",
  },
  jobOffers: {
    en: "Job Offers Nearby",
    hi: "पास के काम के अवसर",
    kn: "ಹತ್ತಿರದ ಕೆಲಸದ ಆಫರ್‌ಗಳು",
  },
  noOffersYet: {
    en: "No new job offers right now. Keep your passport ready!",
    hi: "फिलहाल कोई नया काम नहीं है। अपना पासपोर्ट तैयार रखें!",
    kn: "ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಹೊಸ ಆಫರ್‌ಗಳಿಲ್ಲ. ನಿಮ್ಮ ಪಾಸ್‌ಪೋರ್ಟ್ ಸಿದ್ಧವಾಗಿರಲಿ!",
  },
  acceptJob: {
    en: "Accept Offer",
    hi: "काम स्वीकार करें",
    kn: "ಆಫರ್ ಸ್ವೀಕರಿಸಿ",
  },
  callContractor: {
    en: "Call Contractor",
    hi: "ठेकेदार को कॉल करें",
    kn: "ಗುತ್ತಿಗೆದಾರರಿಗೆ ಕರೆ ಮಾಡಿ",
  },
  sharePassport: {
    en: "Share My Passport",
    hi: "पासपोर्ट शेयर करें",
    kn: "ಪಾಸ್‌ಪೋರ್ಟ್ ಹಂಚಿಕೊಳ್ಳಿ",
  },
  getStamp: {
    en: "Get Customer Rating Stamp",
    hi: "ग्राहक से रेटिंग स्टैम्प लें",
    kn: "ಗ್ರಾಹಕರಿಂದ ರೇಟಿಂಗ್ ಸ್ಟ್ಯಾಂಪ್ ಪಡೆಯಿರಿ",
  },
  // Challenge
  challengeConsentTitle: {
    en: "Practical Skill Challenge",
    hi: "प्रैक्टिकल कौशल परीक्षा",
    kn: "ಪ್ರಾಯೋಗಿಕ ಕೌಶಲ್ಯ ಪರೀಕ್ಷೆ",
  },
  challengeConsentBody: {
    en: "You will show your practical work on live camera for 60-90 seconds. Say the 3-digit code clearly at the start, and hold safety steps close to camera.",
    hi: "आप 60-90 सेकंड के लिए कैमरे पर अपना काम दिखाएंगे। शुरुआत में 3-अंकों का कोड जोर से बोलें और सुरक्षा कदम कैमरे के पास दिखाएं।",
    kn: "ನೀವು 60-90 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಲೈವ್ ಕ್ಯಾಮೆರಾದಲ್ಲಿ ನಿಮ್ಮ ಕೆಲಸವನ್ನು ತೋರಿಸುತ್ತೀರಿ. ಪ್ರಾರಂಭದಲ್ಲಿ 3-ಅಂಕಿಯ ಕೋಡ್ ಹೇಳಿ, ಸುರಕ್ಷತಾ ಹಂತಗಳನ್ನು ಕ್ಯಾಮೆರಾ ಹತ್ತಿರ ತೋರಿಸಿ.",
  },
  startChallenge: {
    en: "Start Challenge",
    hi: "परीक्षा शुरू करें",
    kn: "ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ",
  },
  recordingVideo: {
    en: "Recording… Speak code & show steps",
    hi: "रिकॉर्डिंग चालू है… कोड बोलें और काम दिखाएं",
    kn: "ರೆಕಾರ್ಡಿಂಗ್ ನಡೆಯುತ್ತಿದೆ… ಕೋಡ್ ಹೇಳಿ ಕೆಲಸ ತೋರಿಸಿ",
  },
  checkingVideo: {
    en: "AI is checking your video… (~20 seconds)",
    hi: "AI आपके वीडियो की जांच कर रहा है… (~20 सेकंड)",
    kn: "AI ನಿಮ್ಮ ವೀಡಿಯೊ ಪರಿಶೀಲಿಸುತ್ತಿದೆ… (~20 ಸೆಕೆಂಡುಗಳು)",
  },
  challengePassed: {
    en: "Challenge Passed! Badge Added.",
    hi: "परीक्षा पास! बैज जुड़ गया।",
    kn: "ಪರೀಕ್ಷೆಯಲ್ಲಿ ಉತ್ತೀರ್ಣರಾಗಿದ್ದೀರಿ! ಬ್ಯಾಡ್ಜ್ ಸೇರಿಸಲಾಗಿದೆ.",
  },
  challengeReview: {
    en: "Video Under Review",
    hi: "वीडियो समीक्षाधीन है",
    kn: "ವೀಡಿಯೊ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
  },
  challengeFailed: {
    en: "Challenge Incomplete",
    hi: "परीक्षा अधूरी रही",
    kn: "ಪರೀಕ್ಷೆ ಅಪೂರ್ಣವಾಗಿದೆ",
  },
  retakeChallenge: {
    en: "Retake Challenge",
    hi: "दोबारा परीक्षा दें",
    kn: "ಮತ್ತೆ ಪರೀಕ್ಷೆ ನೀಡಿ",
  },
  // Passport
  verifiedDaysAgo: {
    en: "Verified {days} days ago",
    hi: "{days} दिन पहले प्रमाणित",
    kn: "{days} ದಿನಗಳ ಹಿಂದೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ",
  },
  verifiedToday: {
    en: "Verified today",
    hi: "आज ही प्रमाणित किया गया",
    kn: "ಇಂದೇ ದೃಢೀಕರಿಸಲಾಗಿದೆ",
  },
  recheckRecommended: {
    en: "Re-check recommended (90+ days)",
    hi: "पुनः जांच अनुशंसित (90+ दिन पुराना)",
    kn: "ಮರು-ಪರೀಕ್ಷೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ (90+ ದಿನಗಳು)",
  },
  badgeProves: {
    en: "Proves: did this task safely on camera on {date}.",
    hi: "प्रमाणित करता है: {date} को कैमरे पर यह काम सुरक्षित रूप से किया।",
    kn: "ಸಾಬೀತುಪಡಿಸುತ್ತದೆ: {date} ರಂದು ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಈ ಕೆಲಸವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮಾಡಲಾಗಿದೆ.",
  },
  badgeDoesNotProve: {
    en: "Does not prove: identity, a work licence, or a government certificate.",
    hi: "प्रमाणित नहीं करता: पहचान, कोई वर्क लाइसेंस या सरकारी प्रमाणपत्र।",
    kn: "ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ: ಗುರುತು, ಕೆಲಸದ ಪರವಾನಗಿ ಅಥವಾ ಸರ್ಕಾರಿ ಪ್ರಮಾಣಪತ್ರ.",
  },
  hireWorkersLikeThis: {
    en: "Hire Workers Like This",
    hi: "ऐसे कुशल कारीगरों को काम दें",
    kn: "ಇಂತಹ ಕುಶಲ ಕೆಲಸಗಾರರನ್ನು ನೇಮಿಸಿ",
  },
  // Hire Contractor Page
  hireTitle: {
    en: "Voice Hiring Assistant",
    hi: "आवाज द्वारा भर्ती सहायक",
    kn: "ಧ್ವನಿ ಮೂಲಕ ನೇಮಕಾತಿ ಸಹಾಯಕ",
  },
  hireSubtitle: {
    en: "Speak to hire verified blue-collar workers in Bengaluru instantly.",
    hi: "बेंगलुरु में प्रमाणित कारीगरों को तुरंत काम पर रखने के लिए बात करें।",
    kn: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ದೃಢೀಕೃತ ಕೆಲಸಗಾರರನ್ನು ತಕ್ಷಣ ನೇಮಿಸಿಕೊಳ್ಳಲು ಮಾತನಾಡಿ.",
  },
  contractorPhonePrompt: {
    en: "Your 10-digit phone number (for accepted workers to call you):",
    hi: "आपका 10-अंकों का मोबाइल नंबर (ताकि कारीगर आपसे संपर्क कर सकें):",
    kn: "ನಿಮ್ಮ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಕೆಲಸಗಾರರು ನಿಮಗೆ ಕರೆ ಮಾಡಲು):",
  },
  startVoiceHiring: {
    en: "Talk to Hiring Assistant",
    hi: "असिस्टेंट से बात करें",
    kn: "ನೇಮಕಾತಿ ಸಹಾಯಕನೊಂದಿಗೆ ಮಾತನಾಡಿ",
  },
  talkingWithAgent: {
    en: "Voice Assistant Active — Speak naturally",
    hi: "असिस्टेंट सुन रहा है — स्वाभाविक रूप से बोलें",
    kn: "ಸಹಾಯಕ ಸಕ್ರಿಯವಾಗಿದೆ — ಸ್ವಾಭಾವಿಕವಾಗಿ ಮಾತನಾಡಿ",
  },
  stopConversation: {
    en: "End Call",
    hi: "बातचीत समाप्त करें",
    kn: "ಕರೆ ಮುಕ್ತಾಯಗೊಳಿಸಿ",
  },
  matchedWorkers: {
    en: "Ranked Verified Matches Nearby",
    hi: "पास के रैंक किए गए प्रमाणित कामगार",
    kn: "ಹತ್ತಿರದ ದೃಢೀಕೃತ ಕೆಲಸಗಾರರ ಪಟ್ಟಿ",
  },
  // Rate Worker
  rateTitle: {
    en: "Rate Worker & Leave Voice Stamp",
    hi: "कारीगर को रेटिंग दें और वॉयस स्टैम्प छोड़ें",
    kn: "ಕೆಲಸಗಾರರಿಗೆ ರೇಟಿಂಗ್ ನೀಡಿ ಮತ್ತು ಧ್ವನಿ ಸ್ಟ್ಯಾಂಪ್ ಬಿಡಿ",
  },
  rateInstructions: {
    en: "Select stars and optionally record a short voice note about their work.",
    hi: "स्टार चुनें और चाहें तो उनके काम के बारे में छोटी वॉयस रिकॉर्डिंग करें।",
    kn: "ಸ್ಟಾರ್ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಅವರ ಕೆಲಸದ ಬಗ್ಗೆ ಸಣ್ಣ ಧ್ವನಿ ಸಂದೇಶವನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ.",
  },
  submitStamp: {
    en: "Submit Rating Stamp",
    hi: "स्टैम्प सबमिट करें",
    kn: "ರೇಟಿಂಗ್ ಸ್ಟ್ಯಾಂಪ್ ಸಲ್ಲಿಸಿ",
  },
  stampSubmitted: {
    en: "Thank you! Your verified rating stamp was added to their passport.",
    hi: "धन्यवाद! आपका प्रमाणित रेटिंग स्टैम्प उनके पासपोर्ट में जुड़ गया है।",
    kn: "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ದೃಢೀಕೃತ ರೇಟಿಂಗ್ ಸ್ಟ್ಯಾಂಪ್ ಅವರ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.",
  },
};

// Each workstream owns one strings file, so screens can be translated without editing this one.
export const translations: Translations = {
  ...baseStrings,
  ...commonStrings,
  ...challengeStrings,
  ...onboardStrings,
  ...homeStrings,
  ...otherStrings,
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "kn",
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("skilledin_lang") as Language;
    return saved === "en" || saved === "hi" || saved === "kn" ? saved : "kn";
  });

  // Screen readers pick pronunciation from <html lang>; keep it in step with the chosen language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("skilledin_lang", newLang);
  };

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const item = translations[key];
    let text = item ? item[lang] || item.en : key;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

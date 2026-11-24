import type { Translations } from "../i18n";

// Strings for the public passport, hiring, rating and job status screens. Every key needs en, hi and kn.
// Keys are prefixed (pp_, hire_, rate_, job_, other_) because this file is merged last and would
// silently override a same-named key from another workstream.
export const otherStrings: Translations = {
  // Shared by these screens
  other_starsOf: { en: "{n} of 5 stars", hi: "5 में से {n} स्टार", kn: "5 ರಲ್ಲಿ {n} ಸ್ಟಾರ್" },
  other_rating: { en: "Rating {rating} / 5", hi: "रेटिंग {rating} / 5", kn: "ರೇಟಿಂಗ್ {rating} / 5" },
  other_noRatings: { en: "No ratings yet", hi: "अभी कोई रेटिंग नहीं", kn: "ಇನ್ನೂ ರೇಟಿಂಗ್ ಇಲ್ಲ" },
  other_viewPassport: { en: "View passport", hi: "पासपोर्ट देखें", kn: "ಪಾಸ್‌ಪೋರ್ಟ್ ನೋಡಿ" },
  other_newTab: {
    en: "(opens in a new tab)",
    hi: "(नए टैब में खुलेगा)",
    kn: "(ಹೊಸ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ತೆರೆಯುತ್ತದೆ)",
  },

  // Public passport
  pp_notFound: {
    en: "This passport could not be found.",
    hi: "यह पासपोर्ट नहीं मिला।",
    kn: "ಈ ಪಾಸ್‌ಪೋರ್ಟ್ ಸಿಗಲಿಲ್ಲ.",
  },
  pp_goHome: { en: "Go to SkilledIN home", hi: "SkilledIN होम पर जाएं", kn: "SkilledIN ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ" },
  pp_share: { en: "Share passport", hi: "पासपोर्ट शेयर करें", kn: "ಪಾಸ್‌ಪೋರ್ಟ್ ಹಂಚಿಕೊಳ್ಳಿ" },
  pp_shareText: {
    en: "{name} ({trade}), {area}: skill passport verified on SkilledIN.",
    hi: "{name} ({trade}), {area}: SkilledIN पर प्रमाणित कौशल पासपोर्ट।",
    kn: "{name} ({trade}), {area}: SkilledIN ನಲ್ಲಿ ದೃಢೀಕೃತ ಕೌಶಲ್ಯ ಪಾಸ್‌ಪೋರ್ಟ್.",
  },
  pp_speak: {
    en: "{name}, {trade}, {area}. {level}.",
    hi: "{name}, {trade}, {area}। {level}।",
    kn: "{name}, {trade}, {area}. {level}.",
  },
  pp_stampCount: { en: "{n} customer stamps", hi: "{n} ग्राहक स्टैम्प", kn: "{n} ಗ್ರಾಹಕ ಸ್ಟ್ಯಾಂಪ್‌ಗಳು" },
  pp_memberSince: { en: "Member since {date}", hi: "{date} से सदस्य", kn: "{date} ರಿಂದ ಸದಸ್ಯರು" },
  pp_badgesTitle: {
    en: "Verified practical badges ({n})",
    hi: "प्रमाणित प्रैक्टिकल बैज ({n})",
    kn: "ದೃಢೀಕೃತ ಪ್ರಾಯೋಗಿಕ ಬ್ಯಾಡ್ಜ್‌ಗಳು ({n})",
  },
  pp_noBadges: {
    en: "No video challenge completed yet.",
    hi: "अभी तक कोई वीडियो परीक्षा पूरी नहीं हुई।",
    kn: "ಇನ್ನೂ ಯಾವುದೇ ವೀಡಿಯೊ ಪರೀಕ್ಷೆ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ.",
  },
  pp_stampsTitle: {
    en: "Customer job stamps ({n})",
    hi: "ग्राहक जॉब स्टैम्प ({n})",
    kn: "ಗ್ರಾಹಕರ ಕೆಲಸದ ಸ್ಟ್ಯಾಂಪ್‌ಗಳು ({n})",
  },
  pp_customer: { en: "Customer", hi: "ग्राहक", kn: "ಗ್ರಾಹಕರು" },
  pp_hireSubtitle: {
    en: "Speak to find verified workers near your area",
    hi: "अपने इलाके के पास प्रमाणित कारीगर खोजने के लिए बोलें",
    kn: "ನಿಮ್ಮ ಏರಿಯಾದ ಹತ್ತಿರ ದೃಢೀಕೃತ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಲು ಮಾತನಾಡಿ",
  },

  // Contractor hiring
  hire_agentBadge: {
    en: "Voice assistant by ElevenLabs",
    hi: "ElevenLabs वॉयस असिस्टेंट",
    kn: "ElevenLabs ಧ್ವನಿ ಸಹಾಯಕ",
  },
  hire_example: {
    en: 'Try saying: "Need 2 electricians near Jayanagar tomorrow, ₹800 a day"',
    hi: 'ऐसे बोलें: "कल जयनगर के पास 2 इलेक्ट्रीशियन चाहिए, ₹800 रोज़"',
    kn: 'ಹೀಗೆ ಹೇಳಿ: "ನಾಳೆ ಜಯನಗರದ ಹತ್ತಿರ 2 ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಬೇಕು, ದಿನಕ್ಕೆ ₹800"',
  },
  hire_languages: {
    en: "Speaks English, Hindi and Kannada",
    hi: "अंग्रेज़ी, हिंदी और कन्नड़ बोलता है",
    kn: "ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ ಮತ್ತು ಕನ್ನಡ ಮಾತನಾಡುತ್ತದೆ",
  },
  hire_phoneInvalid: {
    en: "Please enter a valid 10-digit mobile number first.",
    hi: "कृपया पहले सही 10-अंकों का मोबाइल नंबर दर्ज करें।",
    kn: "ದಯವಿಟ್ಟು ಮೊದಲು ಸರಿಯಾದ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.",
  },
  hire_phoneOk: { en: "Number looks good", hi: "नंबर सही है", kn: "ಸಂಖ್ಯೆ ಸರಿಯಾಗಿದೆ" },
  hire_quickSearch: { en: "Or search without talking", hi: "या बिना बोले खोजें", kn: "ಅಥವಾ ಮಾತನಾಡದೆ ಹುಡುಕಿ" },
  hire_trade: { en: "Trade", hi: "काम", kn: "ಕೆಲಸ" },
  hire_locality: { en: "Locality", hi: "इलाका", kn: "ಏರಿಯಾ" },
  hire_findWorkers: {
    en: "Find verified workers nearby",
    hi: "पास के प्रमाणित कारीगर खोजें",
    kn: "ಹತ್ತಿರದ ದೃಢೀಕೃತ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ",
  },
  hire_searchFailed: {
    en: "Could not search for workers. Please try again.",
    hi: "कारीगर नहीं खोज सके। कृपया फिर से कोशिश करें।",
    kn: "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಲು ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  hire_areaNotFound: {
    en: "We could not find that locality. Please pick another area.",
    hi: "यह इलाका नहीं मिला। कृपया दूसरा इलाका चुनें।",
    kn: "ಆ ಏರಿಯಾ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಏರಿಯಾ ಆಯ್ಕೆಮಾಡಿ.",
  },
  hire_noMatches: {
    en: "No verified workers found within 10 km. Try a nearby area.",
    hi: "10 किमी के अंदर कोई प्रमाणित कारीगर नहीं मिला। पास का कोई दूसरा इलाका आज़माएं।",
    kn: "10 ಕಿ.ಮೀ. ಒಳಗೆ ಯಾವುದೇ ದೃಢೀಕೃತ ಕೆಲಸಗಾರರು ಸಿಗಲಿಲ್ಲ. ಹತ್ತಿರದ ಬೇರೆ ಏರಿಯಾ ಪ್ರಯತ್ನಿಸಿ.",
  },
  hire_verified: { en: "Verified", hi: "प्रमाणित", kn: "ದೃಢೀಕೃತ" },
  hire_distance: { en: "{km} km away", hi: "{km} किमी दूर", kn: "{km} ಕಿ.ಮೀ. ದೂರ" },
  hire_level: { en: "Level {n}", hi: "लेवल {n}", kn: "ಹಂತ {n}" },

  // Rate worker
  rate_quality: { en: "Work quality rating", hi: "काम की गुणवत्ता रेटिंग", kn: "ಕೆಲಸದ ಗುಣಮಟ್ಟದ ರೇಟಿಂಗ್" },
  rate_nameLabel: { en: "Your name (optional)", hi: "आपका नाम (वैकल्पिक)", kn: "ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ)" },
  rate_namePlaceholder: { en: "e.g. Ramesh K", hi: "जैसे रमेश के", kn: "ಉದಾ. ರಮೇಶ್ ಕೆ" },
  rate_voiceNote: {
    en: "Short voice note (optional)",
    hi: "छोटा वॉयस नोट (वैकल्पिक)",
    kn: "ಸಣ್ಣ ಧ್ವನಿ ಸಂದೇಶ (ಐಚ್ಛಿಕ)",
  },
  rate_tapToSpeak: {
    en: "Tap the mic, speak your feedback, then tap again to finish.",
    hi: "माइक दबाएं, अपनी राय बोलें, फिर खत्म करने के लिए दोबारा दबाएं।",
    kn: "ಮೈಕ್ ಒತ್ತಿ, ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಹೇಳಿ, ಮುಗಿಸಲು ಮತ್ತೆ ಒತ್ತಿ.",
  },
  rate_voiceRecorded: {
    en: "Voice note recorded. Tap the mic to record again.",
    hi: "वॉयस नोट रिकॉर्ड हो गया। दोबारा रिकॉर्ड करने के लिए माइक दबाएं।",
    kn: "ಧ್ವನಿ ಸಂದೇಶ ರೆಕಾರ್ಡ್ ಆಯಿತು. ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಲು ಮೈಕ್ ಒತ್ತಿ.",
  },
  rate_redirecting: {
    en: "Opening the worker's passport…",
    hi: "कारीगर का पासपोर्ट खोल रहे हैं…",
    kn: "ಕೆಲಸಗಾರರ ಪಾಸ್‌ಪೋರ್ಟ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ…",
  },
  rate_workerNotFound: {
    en: "This worker could not be found.",
    hi: "यह कारीगर नहीं मिला।",
    kn: "ಈ ಕೆಲಸಗಾರರು ಸಿಗಲಿಲ್ಲ.",
  },

  // Job status card
  job_loading: {
    en: "Loading job details…",
    hi: "काम की जानकारी लोड हो रही है…",
    kn: "ಕೆಲಸದ ವಿವರ ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
  },
  job_notFound: {
    en: "This job could not be found. It may have been removed.",
    hi: "यह काम नहीं मिला। हो सकता है इसे हटा दिया गया हो।",
    kn: "ಈ ಕೆಲಸ ಸಿಗಲಿಲ್ಲ. ಅದನ್ನು ತೆಗೆದುಹಾಕಿರಬಹುದು.",
  },
  job_loadFailed: {
    en: "Could not load this job. Trying again…",
    hi: "यह काम लोड नहीं हो सका। फिर से कोशिश कर रहे हैं…",
    kn: "ಈ ಕೆಲಸ ಲೋಡ್ ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲಾಗುತ್ತಿದೆ…",
  },
  job_liveStatus: { en: "Live hiring status", hi: "भर्ती की ताज़ा स्थिति", kn: "ನೇಮಕಾತಿಯ ಸದ್ಯದ ಸ್ಥಿತಿ" },
  job_number: { en: "Job #{id}", hi: "काम #{id}", kn: "ಕೆಲಸ #{id}" },
  job_perDay: { en: "₹{wage} / day", hi: "₹{wage} / दिन", kn: "₹{wage} / ದಿನ" },
  job_need: { en: "Need: {count} {trade}", hi: "ज़रूरत: {count} {trade}", kn: "ಬೇಕು: {count} {trade}" },
  job_accepted: {
    en: "Accepted workers ({n}/{total})",
    hi: "काम स्वीकार करने वाले कारीगर ({n}/{total})",
    kn: "ಒಪ್ಪಿಕೊಂಡ ಕೆಲಸಗಾರರು ({n}/{total})",
  },
  job_waiting: {
    en: "Waiting for nearby workers to accept…",
    hi: "पास के कारीगरों के स्वीकार करने का इंतज़ार है…",
    kn: "ಹತ್ತಿರದ ಕೆಲಸಗಾರರು ಒಪ್ಪಿಕೊಳ್ಳುವುದನ್ನು ಕಾಯಲಾಗುತ್ತಿದೆ…",
  },
  job_youAccepted: {
    en: "You accepted this job!",
    hi: "आपने यह काम स्वीकार कर लिया!",
    kn: "ನೀವು ಈ ಕೆಲಸವನ್ನು ಒಪ್ಪಿಕೊಂಡಿದ್ದೀರಿ!",
  },
  job_acceptFailed: {
    en: "Could not accept the job. Please try again.",
    hi: "काम स्वीकार नहीं हो सका। कृपया फिर से कोशिश करें।",
    kn: "ಕೆಲಸ ಒಪ್ಪಿಕೊಳ್ಳಲು ಆಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  job_offerGone: {
    en: "This offer is no longer available.",
    hi: "यह ऑफ़र अब उपलब्ध नहीं है।",
    kn: "ಈ ಆಫರ್ ಈಗ ಲಭ್ಯವಿಲ್ಲ.",
  },
  job_today: { en: "Today", hi: "आज", kn: "ಇಂದು" },
  job_tomorrow: { en: "Tomorrow", hi: "कल", kn: "ನಾಳೆ" },
};

type TFn = (key: string, replacements?: Record<string, string | number>) => string;

// Trade ids come from the backend ("electrician", "general", …). An id without a trade_* string
// shows as-is rather than as a raw "trade_xyz" key.
export const tradeLabel = (t: TFn, trade: string): string => {
  const key = `trade_${trade}`;
  const label = t(key);
  return label === key ? trade : label;
};

import { test } from "node:test";
import assert from "node:assert/strict";
import { geocode, isUsableHit } from "../src/lib/geo.js";
import { extractWorkerDeterministic } from "../src/lib/assess.js";
import { recoverRegistration, publicProfile, withSkillText } from "../src/lib/passport.js";

test("geocode matches the longest locality name, so Vijayanagar is not saved as Jayanagar", async () => {
  assert.equal((await geocode("Vijayanagar"))?.displayName, "Vijayanagar");
  assert.equal((await geocode("near vijayanagar bus stop"))?.displayName, "Vijayanagar");
  assert.equal((await geocode("Jayanagar"))?.displayName, "Jayanagar");
});

test("Amazon Location hits for the whole city, the state, or a weak match are rejected", () => {
  assert.equal(isUsableHit({ PlaceType: "Locality", Title: "Bengaluru, Karnataka, India" }, "Jayanagr"), false);
  assert.equal(isUsableHit({ PlaceType: "Region", Title: "Karnataka, India" }, "xyz"), false);
  assert.equal(isUsableHit({ PlaceType: "District", Title: "Basaveshwaranagar, Bengaluru", MatchScores: { Overall: 0.5 } }, "basava"), false);
  assert.equal(isUsableHit({ PlaceType: "District", Title: "Basaveshwaranagar, Bengaluru", MatchScores: { Overall: 0.95 } }, "Basaveshwaranagar"), true);
  assert.equal(isUsableHit(undefined, "x"), false);
});

test("extractor returns null name and area when they were not said, and an empty read-back", () => {
  const r = extractWorkerDeterministic("", "en");
  assert.equal(r.name, null);
  assert.equal(r.area, null);
  assert.equal(r.readBack, "");

  const noName = extractWorkerDeterministic("I am an electrician", "en");
  assert.equal(noName.name, null);
  assert.equal(noName.area, null);
  assert.equal(noName.trade, "electrician");
  assert.ok(!noName.readBack.includes("Ravi") && !noName.readBack.includes("Bengaluru"));
});

test("extractor finds native-script trades and does not read the Kannada 'in' ending as plumber", () => {
  const kn = extractWorkerDeterministic("ನನ್ನ ಹೆಸರು ಮಂಜು, ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ಗಾರೆ ಕೆಲಸ ಮಾಡುತ್ತೇನೆ", "kn");
  assert.equal(kn.name, "ಮಂಜು");
  assert.equal(kn.trade, "mason");
  assert.equal(extractWorkerDeterministic("ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತೇನೆ", "kn").trade, "other");
  assert.equal(extractWorkerDeterministic("ನಾನು ನಲ್ಲಿ ರಿಪೇರಿ ಮಾಡುತ್ತೇನೆ", "kn").trade, "plumber");

  const hi = extractWorkerDeterministic("मेरा नाम सुरेश है, मैं प्लंबर हूं, विजयनगर", "hi");
  assert.equal(hi.name, "सुरेश");
  assert.equal(hi.trade, "plumber");

  const en = extractWorkerDeterministic("My name is Ravi, electrician, Vijayanagar", "en");
  assert.deepEqual([en.name, en.trade, en.area], ["Ravi", "electrician", "Vijayanagar"]);
  assert.equal(en.readBack, "Ravi, Electrician, Vijayanagar. Correct?");
});

test("duplicate phone with the same name recovers the passport; a different name does not", () => {
  const stored = { PK: "WORKER#w_1", SK: "PROFILE", id: "w_1", name: "Ravi Kumar", phone: "9845012301", trade: "electrician", area: "Jayanagar", lang: "kn", createdAt: "2026-11-01T00:00:00.000Z" };
  const back = recoverRegistration(stored, "  ravi   kumar ");
  assert.equal(back?.id, "w_1");
  assert.equal(back?.existing, true);
  assert.ok(back && !("phone" in back) && !("PK" in back));
  assert.equal(recoverRegistration(stored, "Suresh"), null);
  assert.equal(recoverRegistration(stored, "   "), null);
  assert.equal(recoverRegistration(null, "Ravi Kumar"), null);
  assert.ok(!("phone" in publicProfile(stored)));
});

test("badges carry the skill title and each step's text in en/hi/kn", () => {
  const b = withSkillText({ skillId: "electrician.switch_socket", items: [{ id: "power_off", status: "seen", evidence: "" }] });
  assert.equal(b.title?.en, "Wire a switch and socket");
  assert.ok(b.items[0].text?.kn);
  const unknown = withSkillText({ skillId: "nope", items: [{ id: "x" }] });
  assert.equal(unknown.title, undefined);
  assert.equal(unknown.items[0].text, undefined);
});

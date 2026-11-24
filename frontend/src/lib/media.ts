import { API_BASE_URL } from "../config";
import { timeoutSignal } from "../api";

export interface RecordedAudio {
  audioBase64: string;
  mimeType: string;
}

export interface VideoRecording {
  videoBlob: Blob;
  frames: string[];
  /** Audio-only copy of the take, for server-side speech-to-text of the spoken code. */
  audio: RecordedAudio | null;
}

const VIDEO_TYPES = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
// Opus at 32 kbps keeps 90 s near 0.5 MB base64, well under the API body limit.
const AUDIO_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

// Camera/mic need https (or localhost) and MediaRecorder; old WebViews and plain-http phones lack one.
// Throwing a named DOMException lets pages show the "this browser cannot record" message.
function assertMediaSupported(): void {
  if (
    !window.isSecureContext ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    throw new DOMException("Recording is not available in this browser", "NotSupportedError");
  }
}

function recorderOptions(types: string[], extra: MediaRecorderOptions): MediaRecorderOptions {
  const mimeType = types.find((m) => MediaRecorder.isTypeSupported(m));
  return mimeType ? { ...extra, mimeType } : extra;
}

function stopTracks(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

// Registered before start(), so it also resolves when the recorder stops by itself (track ended, error).
function whenStopped(recorder: MediaRecorder): Promise<void> {
  return new Promise((resolve) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => resolve(), { once: true });
  });
}

// Some Android builds never fire "stop" after a track dies; never let the analyzing screen hang on it.
const withTimeout = (p: Promise<void>, ms: number) =>
  Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function recordAudio(): Promise<{
  stop: () => Promise<RecordedAudio>;
}> {
  assertMediaSupported();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: Blob[] = [];
  let recorder: MediaRecorder;
  let stopped: Promise<void>;
  try {
    recorder = new MediaRecorder(stream, recorderOptions(AUDIO_TYPES, {}));
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    stopped = whenStopped(recorder);
    recorder.start();
  } catch (err) {
    stopTracks(stream); // otherwise the mic stays on with nothing recording
    throw err;
  }

  return {
    stop: async () => {
      if (recorder.state !== "inactive") recorder.stop();
      await withTimeout(stopped, 3000);
      stopTracks(stream);
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      return { audioBase64: await blobToBase64(blob), mimeType: blob.type };
    },
  };
}

export async function startCameraStream(videoEl: HTMLVideoElement): Promise<MediaStream> {
  assertMediaSupported();
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: true,
  });
  try {
    videoEl.srcObject = stream;
    await videoEl.play();
  } catch (err) {
    // A failed preview must not leave the camera light on.
    stopTracks(stream);
    videoEl.srcObject = null;
    throw err;
  }
  return stream;
}

/** JPEG data URL of the current preview, or null while the camera has no picture yet. */
export function captureVideoFrame(videoEl: HTMLVideoElement): string | null {
  // A black frame would be graded as "nothing seen"; skip it instead.
  if (videoEl.readyState < 2 || !videoEl.videoWidth) return null;
  // Cap at 640 px wide: some phones ignore the ideal size, and six 1080p frames bloat the request.
  const scale = Math.min(1, 640 / videoEl.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(videoEl.videoWidth * scale);
  canvas.height = Math.round(videoEl.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function recordVideoWithFrames(
  stream: MediaStream,
  videoEl: HTMLVideoElement,
  durationSec: number,
  onTick?: (secondsLeft: number) => void
): {
  /** Stops and returns the take. Safe to call more than once and after the recorder stopped itself. */
  stop: () => Promise<VideoRecording>;
  /** Clears every timer and discards the take (Cancel, leaving the page). */
  cancel: () => void;
} {
  assertMediaSupported();
  const recorder = new MediaRecorder(
    stream,
    recorderOptions(VIDEO_TYPES, { videoBitsPerSecond: 1_000_000 })
  );
  const chunks: Blob[] = [];
  const frames: string[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const videoStopped = whenStopped(recorder);
  recorder.start(1000);

  // Second recorder on the same audio tracks: the server transcribes this to check the spoken code.
  // If this phone cannot run two recorders, the video still records and the server gets no audio.
  let audioRec: MediaRecorder | null = null;
  const audioChunks: Blob[] = [];
  let audioStopped: Promise<void> = Promise.resolve();
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length > 0) {
    try {
      audioRec = new MediaRecorder(
        new MediaStream(audioTracks),
        recorderOptions(AUDIO_TYPES, { audioBitsPerSecond: 32_000 })
      );
      audioRec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      audioStopped = whenStopped(audioRec);
      audioRec.start(1000);
    } catch (err) {
      console.warn("Audio-only recorder unavailable:", err);
      audioRec = null;
      audioStopped = Promise.resolve();
    }
  }

  // Six frames spread over the take, starting at durationSec / 12.
  const intervalSec = durationSec / 6;
  const startSec = durationSec / 12;
  const frameTimers: ReturnType<typeof setTimeout>[] = [];
  for (let i = 0; i < 6; i++) {
    frameTimers.push(
      setTimeout(() => {
        const frame = captureVideoFrame(videoEl);
        if (frame && frames.length < 6) frames.push(frame);
      }, (startSec + i * intervalSec) * 1000)
    );
  }

  // Countdown from the wall clock: a throttled or late interval cannot freeze or stretch the timer.
  const endsAt = Date.now() + durationSec * 1000;
  let lastLeft = durationSec;
  const tickInterval = setInterval(() => {
    const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left !== lastLeft) {
      lastLeft = left;
      onTick?.(left);
    }
    if (left <= 0) clearInterval(tickInterval);
  }, 250);

  const clearTimers = () => {
    clearInterval(tickInterval);
    frameTimers.forEach((t) => clearTimeout(t));
  };
  const stopRecorders = () => {
    for (const r of [recorder, audioRec]) {
      if (r && r.state !== "inactive") {
        try {
          r.stop();
        } catch {
          // already stopping
        }
      }
    }
  };

  let result: Promise<VideoRecording> | null = null;

  return {
    stop: () => {
      if (result) return result;
      clearTimers();
      // Take the last frame now, while the <video> is still mounted and playing.
      if (frames.length < 2) {
        const frame = captureVideoFrame(videoEl);
        if (frame) frames.push(frame);
      }
      stopRecorders();
      result = (async () => {
        await withTimeout(Promise.all([videoStopped, audioStopped]).then(() => {}), 4000);
        const videoBlob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        let audio: RecordedAudio | null = null;
        if (audioRec && audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: audioRec.mimeType || "audio/webm" });
          try {
            audio = { audioBase64: await blobToBase64(audioBlob), mimeType: audioBlob.type };
          } catch (err) {
            console.warn("Audio encode failed:", err);
          }
        }
        return { videoBlob, frames, audio };
      })();
      return result;
    },
    cancel: () => {
      clearTimers();
      stopRecorders();
      chunks.length = 0;
      audioChunks.length = 0;
      frames.length = 0;
    },
  };
}

export async function uploadVideoToS3(
  uploadPolicy: { url: string; fields: Record<string, string> },
  videoBlob: Blob,
  timeoutMs = 180_000
): Promise<void> {
  const type = videoBlob.type.split(";")[0] || "video/webm";
  const formData = new FormData();
  for (const [key, val] of Object.entries(uploadPolicy.fields)) {
    formData.append(key, val);
  }
  // S3 POST policies require Content-Type (it must start with "video/") and every field before the file.
  if (!("Content-Type" in uploadPolicy.fields)) formData.append("Content-Type", type);
  formData.append("file", videoBlob, type === "video/mp4" ? "video.mp4" : "video.webm");

  // Local dev returns "/api/mock-upload", which lives on the API server, not the Vite server.
  const url = uploadPolicy.url.startsWith("/") ? `${API_BASE_URL}${uploadPolicy.url}` : uploadPolicy.url;

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    signal: timeoutSignal(timeoutMs),
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

export function playBase64Audio(base64: string): HTMLAudioElement {
  const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
  audio.play().catch((err) => {
    console.warn("Audio autoplay blocked by browser:", err);
  });
  return audio;
}

export function sharePassport(title: string, text: string, url: string): void {
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {
      // User cancelled or share failed, fallback to WhatsApp web share
      const fullUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
      window.open(fullUrl, "_blank");
    });
  } else {
    const fullUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(fullUrl, "_blank");
  }
}

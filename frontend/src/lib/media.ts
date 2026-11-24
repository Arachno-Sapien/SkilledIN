export async function recordAudio(): Promise<{
  stop: () => Promise<{ audioBase64: string; mimeType: string }>;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/mp4";

  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.start();

  return {
    stop: () =>
      new Promise<{ audioBase64: string; mimeType: string }>((resolve, reject) => {
        mediaRecorder.onstop = async () => {
          try {
            stream.getTracks().forEach((track) => track.stop());
            const blob = new Blob(chunks, { type: mimeType });
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve({ audioBase64: base64, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } catch (err) {
            reject(err);
          }
        };
        mediaRecorder.stop();
      }),
  };
}

export async function startCameraStream(
  videoEl: HTMLVideoElement
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: true,
  });
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function captureVideoFrame(videoEl: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function recordVideoWithFrames(
  stream: MediaStream,
  videoEl: HTMLVideoElement,
  durationSec: number,
  onTick?: (secondsLeft: number) => void
): {
  stop: () => Promise<{ videoBlob: Blob; frames: string[] }>;
} {
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
    ? "video/webm;codecs=vp8,opus"
    : "video/mp4";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 1_000_000,
  });

  const chunks: Blob[] = [];
  const frames: string[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(1000);

  // Capture frames at interval durationSec / 6 starting at durationSec / 12
  const intervalSec = durationSec / 6;
  const startSec = durationSec / 12;
  const frameTimers: any[] = [];

  for (let i = 0; i < 6; i++) {
    const timeMs = (startSec + i * intervalSec) * 1000;
    const timer = setTimeout(() => {
      try {
        const frame = captureVideoFrame(videoEl);
        if (frame && frames.length < 6) {
          frames.push(frame);
        }
      } catch (e) {
        console.warn("Frame capture error:", e);
      }
    }, timeMs);
    frameTimers.push(timer);
  }

  // Live countdown ticker
  let secondsLeft = durationSec;
  const tickInterval = setInterval(() => {
    secondsLeft--;
    if (onTick) onTick(Math.max(0, secondsLeft));
    if (secondsLeft <= 0) {
      clearInterval(tickInterval);
    }
  }, 1000);

  return {
    stop: () =>
      new Promise<{ videoBlob: Blob; frames: string[] }>((resolve) => {
        clearInterval(tickInterval);
        frameTimers.forEach((t) => clearTimeout(t));

        recorder.onstop = () => {
          // Take one last frame at stop if < 2 frames exist
          if (frames.length < 2) {
            try {
              frames.push(captureVideoFrame(videoEl));
            } catch {}
          }
          const videoBlob = new Blob(chunks, { type: mimeType });
          resolve({ videoBlob, frames });
        };

        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }),
  };
}

export async function uploadVideoToS3(
  uploadPolicy: { url: string; fields: Record<string, string> },
  videoBlob: Blob
): Promise<void> {
  const formData = new FormData();
  for (const [key, val] of Object.entries(uploadPolicy.fields)) {
    formData.append(key, val);
  }
  formData.append("file", videoBlob, "video.webm");

  const res = await fetch(uploadPolicy.url, {
    method: "POST",
    body: formData,
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

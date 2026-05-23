export type FaceScanPhase =
  | "camera_start"
  | "position_face"
  | "eyes_open_1"
  | "eyes_closed"
  | "eyes_open_2"
  | "capturing"
  | "success"
  | "error";

export interface EyeAnalysis {
  meanLuma: number;
  contrast: number;
  cheekContrast: number;
  facePresent: boolean;
  eyesOpen: boolean;
  eyesClosed: boolean;
}

function regionStats(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const lum: number[] = [];
  const xs = Math.max(0, Math.floor(x0 * w));
  const ys = Math.max(0, Math.floor(y0 * h));
  const xe = Math.min(w, Math.floor(x1 * w));
  const ye = Math.min(h, Math.floor(y1 * h));

  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      const i = (y * w + x) * 4;
      lum.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
  }
  if (lum.length === 0) return { mean: 0, std: 0 };
  const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
  const std = Math.sqrt(lum.reduce((s, v) => s + (v - mean) ** 2, 0) / lum.length);
  return { mean, std };
}

/** Heuristic eye / face analysis from mirrored webcam frame */
export function analyzeFaceFrame(ctx: CanvasRenderingContext2D, w: number, h: number): EyeAnalysis {
  const frame = ctx.getImageData(0, 0, w, h);

  const leftEye = regionStats(frame.data, w, h, 0.2, 0.28, 0.46, 0.44);
  const rightEye = regionStats(frame.data, w, h, 0.54, 0.28, 0.8, 0.44);
  const faceCenter = regionStats(frame.data, w, h, 0.28, 0.22, 0.72, 0.78);
  const leftCheek = regionStats(frame.data, w, h, 0.12, 0.48, 0.32, 0.68);
  const rightCheek = regionStats(frame.data, w, h, 0.68, 0.48, 0.88, 0.68);

  const eyeContrast = (leftEye.std + rightEye.std) / 2;
  const cheekContrast = (leftCheek.std + rightCheek.std) / 2;
  const meanLuma = (leftEye.mean + rightEye.mean) / 2;
  const eyeToCheek = eyeContrast / Math.max(cheekContrast, 6);

  const facePresent =
    faceCenter.std > 8 &&
    faceCenter.mean > 28 &&
    faceCenter.mean < 235;

  // Relaxed thresholds — works on more webcams / lighting
  const eyesOpen =
    facePresent &&
    (eyeContrast >= 10 || eyeToCheek >= 0.75);

  const eyesClosed =
    facePresent &&
    (eyeContrast <= 11 || eyeToCheek <= 0.55 || (eyeContrast < 14 && meanLuma > 60));

  return {
    meanLuma,
    contrast: eyeContrast,
    cheekContrast,
    facePresent,
    eyesOpen,
    eyesClosed,
  };
}

export const FACE_PHASE_LABELS: Record<FaceScanPhase, string> = {
  camera_start: "Starting camera…",
  position_face: "Center your face in the circle",
  eyes_open_1: "👁️ Keep your eyes open",
  eyes_closed: "😌 Close your eyes briefly",
  eyes_open_2: "👁️ Open your eyes again",
  capturing: "Saving biometrics…",
  success: "Verified!",
  error: "Scan failed — try again",
};

export const FACE_PHASE_STEPS: FaceScanPhase[] = [
  "eyes_open_1",
  "eyes_closed",
  "eyes_open_2",
];

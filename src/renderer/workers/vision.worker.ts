// ============================================
// PrepHQ — Vision Worker (Web Worker)
// Runs MediaPipe Face Mesh + Pose Landmark
// off the main thread for 60fps UI
// ============================================
export {}; // Make this a module to isolate types

// Type-safe worker messaging
interface VisionWorkerMessage {
  type: 'init' | 'process-frame' | 'stop';
  payload?: any;
}

interface VisionWorkerResponse {
  type: 'ready' | 'face-mesh-result' | 'pose-result' | 'error';
  payload?: any;
}

let faceLandmarker: any = null;
let poseLandmarker: any = null;
let isInitialized = false;

/**
 * Initialize MediaPipe models
 */
async function initModels() {
  try {
    const vision = await import('@mediapipe/tasks-vision');
    const { FaceLandmarker, PoseLandmarker, FilesetResolver } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );

    // Initialize Face Landmarker for 468-point face mesh
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: 'VIDEO',
      numFaces: 1,
    });

    // Initialize Pose Landmarker for posture detection
    poseLandmarker = await PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });

    isInitialized = true;
    self.postMessage({ type: 'ready' } as VisionWorkerResponse);
  } catch (err: any) {
    self.postMessage({
      type: 'error',
      payload: { message: `Model init failed: ${err.message}` },
    } as VisionWorkerResponse);
  }
}

/**
 * Extract gaze direction from iris landmarks
 */
function estimateGaze(faceLandmarks: any[]): { x: number; y: number; target: string } {
  if (!faceLandmarks || faceLandmarks.length === 0) {
    return { x: 0.5, y: 0.5, target: 'other' };
  }

  const landmarks = faceLandmarks[0];
  if (!landmarks || landmarks.length < 478) {
    return { x: 0.5, y: 0.5, target: 'other' };
  }

  // Iris landmarks: left iris center = 468, right iris center = 473
  const leftIris = landmarks[468];
  const rightIris = landmarks[473];
  // Eye corner landmarks for reference
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];

  // Calculate normalized iris position within eye socket
  const leftIrisX = (leftIris.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x);
  const rightIrisX = (rightIris.x - rightEyeInner.x) / (rightEyeOuter.x - rightEyeInner.x);
  const gazeX = (leftIrisX + rightIrisX) / 2;

  const leftIrisY = leftIris.y - (leftEyeOuter.y + leftEyeInner.y) / 2;
  const rightIrisY = rightIris.y - (rightEyeOuter.y + rightEyeInner.y) / 2;
  const gazeY = (leftIrisY + rightIrisY) / 2 + 0.5;

  // Classify gaze target
  let target: string;
  if (gazeX > 0.35 && gazeX < 0.65 && gazeY > 0.35 && gazeY < 0.65) {
    target = 'camera';
  } else if (gazeY < 0.4) {
    target = 'screen';
  } else if (gazeX < 0.3 || gazeX > 0.7) {
    target = 'notes';
  } else {
    target = 'other';
  }

  return { x: gazeX, y: gazeY, target };
}

/**
 * Extract face mesh metrics from landmarks
 */
function extractFaceMetrics(result: any): any {
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;

  const landmarks = result.faceLandmarks[0];
  const gaze = estimateGaze(result.faceLandmarks);

  // Mouth open ratio (upper lip to lower lip distance / face height)
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const faceTop = landmarks[10];
  const faceBtm = landmarks[152];
  const faceHeight = Math.abs(faceBtm.y - faceTop.y);
  const mouthOpen = Math.abs(lowerLip.y - upperLip.y) / faceHeight;

  // Eye open ratio
  const leftEyeTop = landmarks[159];
  const leftEyeBtm = landmarks[145];
  const rightEyeTop = landmarks[386];
  const rightEyeBtm = landmarks[374];
  const leftEyeOpen = Math.abs(leftEyeTop.y - leftEyeBtm.y) / faceHeight;
  const rightEyeOpen = Math.abs(rightEyeTop.y - rightEyeBtm.y) / faceHeight;

  // Head pose estimation from face transformation matrix
  let headPose = { pitch: 0, yaw: 0, roll: 0 };
  if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
    const matrix = result.facialTransformationMatrixes[0].data;
    if (matrix) {
      headPose = {
        pitch: Math.atan2(-matrix[6], matrix[8]) * (180 / Math.PI),
        yaw: Math.asin(matrix[7]) * (180 / Math.PI),
        roll: Math.atan2(-matrix[3], matrix[4]) * (180 / Math.PI),
      };
    }
  }

  return {
    gazeDirection: { x: gaze.x, y: gaze.y },
    gazeTarget: gaze.target,
    mouthOpenRatio: mouthOpen,
    eyeOpenRatio: { left: leftEyeOpen, right: rightEyeOpen },
    headPose,
  };
}

/**
 * Extract posture metrics from pose landmarks
 */
function extractPostureMetrics(result: any): any {
  if (!result.landmarks || result.landmarks.length === 0) return null;

  const landmarks = result.landmarks[0];

  // Key landmarks: 11 = left shoulder, 12 = right shoulder, 0 = nose
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];

  // Shoulder angle (should be ~0 for straight posture)
  const shoulderDy = rightShoulder.y - leftShoulder.y;
  const shoulderDx = rightShoulder.x - leftShoulder.x;
  const shoulderAngle = Math.atan2(shoulderDy, shoulderDx) * (180 / Math.PI);

  // Head tilt (nose position relative to shoulder midpoint)
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const headTilt = Math.atan2(nose.y - shoulderMidY, nose.x - shoulderMidX) * (180 / Math.PI) + 90;

  // Slouching: if nose is too far forward (z-axis) compared to shoulders
  const noseZ = nose.z || 0;
  const shoulderZ = ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2;
  const isSlouching = noseZ < shoulderZ - 0.1;

  // Score: 100 = perfect posture
  let score = 100;
  score -= Math.abs(shoulderAngle) * 2; // Penalize tilted shoulders
  score -= Math.abs(headTilt) * 1.5; // Penalize head tilt
  if (isSlouching) score -= 20;
  score = Math.max(0, Math.min(100, score));

  return {
    shoulderAngle,
    headTilt,
    isSlouching,
    isExcessiveMovement: false, // TODO: track over time
    score: Math.round(score),
  };
}

/**
 * Process a video frame through both models
 */
function processFrame(imageData: ImageBitmap, timestamp: number) {
  if (!isInitialized || !faceLandmarker || !poseLandmarker) return;

  try {
    // Face mesh
    const faceResult = faceLandmarker.detectForVideo(imageData, timestamp);
    const faceMetrics = extractFaceMetrics(faceResult);

    if (faceMetrics) {
      self.postMessage({
        type: 'face-mesh-result',
        payload: { ...faceMetrics, timestamp },
      } as VisionWorkerResponse);
    }

    // Pose estimation
    const poseResult = poseLandmarker.detectForVideo(imageData, timestamp);
    const postureMetrics = extractPostureMetrics(poseResult);

    if (postureMetrics) {
      self.postMessage({
        type: 'pose-result',
        payload: { ...postureMetrics, timestamp },
      } as VisionWorkerResponse);
    }
  } catch (err: any) {
    // Silently skip frames that fail (model warm-up, etc.)
  }
}

// ── Worker Message Handler ──────────────────

self.onmessage = async (event: MessageEvent<VisionWorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      await initModels();
      break;
    case 'process-frame':
      if (payload?.imageBitmap && payload?.timestamp) {
        processFrame(payload.imageBitmap, payload.timestamp);
      }
      break;
    case 'stop':
      if (faceLandmarker) { faceLandmarker.close(); faceLandmarker = null; }
      if (poseLandmarker) { poseLandmarker.close(); poseLandmarker = null; }
      isInitialized = false;
      break;
  }
};

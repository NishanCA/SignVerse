// Standard XBot / Mixamo bone names
export const BONES = {
  R_ARM: "mixamorig:RightArm",
  R_FOREARM: "mixamorig:RightForeArm",
  R_HAND: "mixamorig:RightHand",
  L_ARM: "mixamorig:LeftArm",
  L_FOREARM: "mixamorig:LeftForeArm",
  L_HAND: "mixamorig:LeftHand",
  R_THUMB_1: "mixamorig:RightHandThumb1",
  R_THUMB_2: "mixamorig:RightHandThumb2",
  R_THUMB_3: "mixamorig:RightHandThumb3",
  R_INDEX_1: "mixamorig:RightHandIndex1",
  R_INDEX_2: "mixamorig:RightHandIndex2",
  R_INDEX_3: "mixamorig:RightHandIndex3",
  R_MIDDLE_1: "mixamorig:RightHandMiddle1",
  R_MIDDLE_2: "mixamorig:RightHandMiddle2",
  R_MIDDLE_3: "mixamorig:RightHandMiddle3",
  R_RING_1: "mixamorig:RightHandRing1",
  R_RING_2: "mixamorig:RightHandRing2",
  R_RING_3: "mixamorig:RightHandRing3",
  R_PINKY_1: "mixamorig:RightHandPinky1",
  R_PINKY_2: "mixamorig:RightHandPinky2",
  R_PINKY_3: "mixamorig:RightHandPinky3",
  L_THUMB_1: "mixamorig:LeftHandThumb1",
  L_THUMB_2: "mixamorig:LeftHandThumb2",
  L_THUMB_3: "mixamorig:LeftHandThumb3",
  L_INDEX_1: "mixamorig:LeftHandIndex1",
  L_INDEX_2: "mixamorig:LeftHandIndex2",
  L_INDEX_3: "mixamorig:LeftHandIndex3",
  L_MIDDLE_1: "mixamorig:LeftHandMiddle1",
  L_MIDDLE_2: "mixamorig:LeftHandMiddle2",
  L_MIDDLE_3: "mixamorig:LeftHandMiddle3",
  L_RING_1: "mixamorig:LeftHandRing1",
  L_RING_2: "mixamorig:LeftHandRing2",
  L_RING_3: "mixamorig:LeftHandRing3",
  L_PINKY_1: "mixamorig:LeftHandPinky1",
  L_PINKY_2: "mixamorig:LeftHandPinky2",
  L_PINKY_3: "mixamorig:LeftHandPinky3",
};

// Finger states (approximate radians for Mixamo rig)
const F_STRAIGHT = { j1: 0, j2: 0, j3: 0 };
const F_CURLED = { j1: 1.5, j2: 1.5, j3: 1.5 }; // Xbot uses positive X for inward curl

const T_STRAIGHT = { j1: 0, j2: 0, j3: 0 };
const T_ACROSS = { j1: 0.5, j2: -0.5, j3: -0.5 };

type HandPose = {
  thumb?: typeof T_STRAIGHT;
  index?: typeof F_STRAIGHT;
  middle?: typeof F_STRAIGHT;
  ring?: typeof F_STRAIGHT;
  pinky?: typeof F_STRAIGHT;
  wrist?: [number, number, number];
  thumbEulers?: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  rArm?: [number, number, number];
  rForeArm?: [number, number, number];
  lArm?: [number, number, number];
  lForeArm?: [number, number, number];
  lWrist?: [number, number, number];
  lThumbEulers?: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
  lIndex?: typeof F_STRAIGHT;
  lMiddle?: typeof F_STRAIGHT;
  lRing?: typeof F_STRAIGHT;
  lPinky?: typeof F_STRAIGHT;
};

// --- ALPHABET HANDSHAPES ---
export const ASL_ALPHABET: Record<string, HandPose> = {
  A: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [0.76, 0.26, -0.54],
    thumbEulers: [
      [0.36, 0.16, -0.14],
      [-0.34, 0.0, 0.0],
      [0, 0, 0],
    ],
    index: { j1: 1.26, j2: 1.96, j3: 1.76 },
    middle: { j1: 1.46, j2: 1.66, j3: 1.46 },
    ring: { j1: 1.46, j2: 1.96, j3: 1.36 },
    pinky: { j1: 1.46, j2: 1.66, j3: 1.86 },
  },
  B: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.46, 2.36, 0.56],
    wrist: [0.76, 0.16, 0.0],
    thumbEulers: [
      [0.0, 0.0, -0.14],
      [1.86, -0.54, 1.06],
      [0, 0, 0],
    ],
    index: { j1: 0.16, j2: -0.34, j3: 0.0 },
    middle: { j1: -0.04, j2: 0.0, j3: 0.0 },
    ring: { j1: -0.04, j2: 0.0, j3: 0.0 },
    pinky: { j1: -0.04, j2: 0.0, j3: 0.0 },
  },
  C: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.46, 2.36, 0.56],
    wrist: [-0.94, 0.26, -0.34],
    thumbEulers: [
      [0.0, 1.26, 0.96],
      [0.76, 0.16, 0.06],
      [0, 0, 0],
    ],
    index: { j1: 0.76, j2: 0.66, j3: 0.26 },
    middle: { j1: 0.76, j2: 0.66, j3: 0.46 },
    ring: { j1: 0.76, j2: 0.46, j3: 0.26 },
    pinky: { j1: 0.96, j2: 0.16, j3: 0.26 },
  },
  D: {
    rArm: [-1.54, -1.24, 0.66],
    rForeArm: [0.46, 2.36, 0.56],
    wrist: [0.76, -0.04, -0.24],
    thumbEulers: [
      [-0.14, 0.36, -0.24],
      [2.26, 1.66, 0.06],
      [0, 0, 0],
    ],
    index: { j1: -0.54, j2: -0.14, j3: 1.06 },
    middle: { j1: 1.66, j2: 0.76, j3: 0.46 },
    ring: { j1: 1.66, j2: 0.46, j3: 0.26 },
    pinky: { j1: 2.36, j2: 0.16, j3: 0.26 },
  },
  E: {
    rArm: [-1.44, -1.14, 0.66],
    rForeArm: [0.46, 2.16, 0.56],
    wrist: [0.76, 1.56, 0.0],
    thumbEulers: [
      [1.56, 0.56, -0.14],
      [1.56, 1.36, 0.0],
      [0, 0, 0],
    ],
    index: { j1: 0.0, j2: 0.0, j3: 0.0 },
    middle: { j1: 0.0, j2: 0.0, j3: 0.0 },
    ring: { j1: 0.0, j2: 0.0, j3: 0.0 },
    pinky: { j1: 2.46, j2: 0.0, j3: 0.0 },
  },
  F: {
    rArm: [-1.44, -1.14, 0.66],
    rForeArm: [0.46, 2.16, 0.56],
    wrist: [0.76, 0.06, 0.0],
    thumbEulers: [
      [0.36, 0.56, -0.14],
      [1.56, 1.36, 0.0],
      [0, 0, 0],
    ],
    index: { j1: 1.36, j2: 1.46, j3: 1.16 },
    middle: { j1: 0.0, j2: 0.0, j3: 0.0 },
    ring: { j1: 0.0, j2: 0.0, j3: 0.0 },
    pinky: { j1: -0.54, j2: 0.0, j3: 0.0 },
  },
  G: {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.16, 0.46],
    wrist: [-2.44, -1.64, 0.0],
    thumbEulers: [
      [1.16, 0.56, -0.14],
      [2.36, 0.76, 0.36],
      [0, 0, 0],
    ],
    index: { j1: -0.14, j2: -0.04, j3: 0.26 },
    middle: { j1: 1.86, j2: 1.76, j3: 1.86 },
    ring: { j1: 1.76, j2: 1.56, j3: 1.86 },
    pinky: { j1: 1.26, j2: 1.56, j3: 1.26 },
  },
  H: {
    rArm: [-1.44, -1.24, 0.86],
    rForeArm: [0.56, 2.16, 0.46],
    wrist: [-2.44, -1.64, 0.0],
    thumbEulers: [
      [1.16, 0.56, -0.14],
      [2.36, 0.76, 0.36],
      [0, 0, 0],
    ],
    index: { j1: -0.14, j2: -0.04, j3: 0.26 },
    middle: { j1: -0.14, j2: -0.14, j3: 0.16 },
    ring: { j1: 1.76, j2: 1.56, j3: 1.86 },
    pinky: { j1: 1.26, j2: 1.56, j3: 1.26 },
  },
  I: {
    rArm: [-1.44, -1.24, 0.86],
    rForeArm: [0.56, 2.16, 0.46],
    wrist: [0.76, 0.06, 0.0],
    thumbEulers: [
      [1.16, 0.56, -0.14],
      [2.36, 0.76, 0.36],
      [0, 0, 0],
    ],
    index: { j1: 1.86, j2: 1.86, j3: 1.96 },
    middle: { j1: 1.66, j2: 1.66, j3: 1.66 },
    ring: { j1: 1.76, j2: 1.56, j3: 1.86 },
    pinky: { j1: -0.24, j2: -0.14, j3: -0.04 },
  },
  J: {
    rArm: [-1.44, -0.04, 0.26],
    rForeArm: [-0.24, -1.44, 0.56],
    wrist: [2.96, -0.34, 0.0],
    thumbEulers: [
      [-0.44, 0.66, -0.14],
      [-0.34, 0.0, 0.0],
      [0, 0, 0],
    ],
    index: { j1: 2.16, j2: 1.76, j3: 0.0 },
    middle: { j1: 1.96, j2: 1.56, j3: 2.56 },
    ring: { j1: 2.36, j2: 2.86, j3: -0.54 },
    pinky: { j1: 0.0, j2: 0.0, j3: 0.66 },
  },
  K: {
    thumb: F_STRAIGHT,
    index: F_STRAIGHT,
    middle: F_STRAIGHT,
    ring: F_CURLED,
    pinky: F_CURLED,
  },
  L: {
    thumb: F_STRAIGHT,
    index: F_STRAIGHT,
    middle: F_CURLED,
    ring: F_CURLED,
    pinky: F_CURLED,
  },
  M: {
    rArm: [-1.44, -0.04, 0.66],
    rForeArm: [-0.24, -1.44, 0.56],
    wrist: [-3.14, -0.04, 0.0],
    thumbEulers: [
      [1.56, 1.66, -0.14],
      [-0.34, 0.0, 0.0],
      [0, 0, 0],
    ],
    index: { j1: 0.36, j2: 0.06, j3: -0.34 },
    middle: { j1: 0.06, j2: 0.16, j3: 0.36 },
    ring: { j1: 0.36, j2: 0.16, j3: -0.14 },
    pinky: { j1: 2.26, j2: 2.36, j3: 2.16 },
  },
  N: {
    rArm: [-1.44, -0.04, 0.66],
    rForeArm: [-0.24, -1.44, 0.56],
    wrist: [-3.14, -0.04, 0.0],
    thumbEulers: [
      [1.56, 1.66, -0.14],
      [-0.34, 0.0, 0.0],
      [0, 0, 0],
    ],
    index: { j1: 0.36, j2: 0.06, j3: -0.34 },
    middle: { j1: 0.06, j2: 0.16, j3: 0.36 },
    ring: { j1: 2.96, j2: 0.26, j3: -0.14 },
    pinky: { j1: 2.26, j2: 2.36, j3: 2.16 },
  },
  O: {
    rArm: [-3.14, -0.64, -0.54],
    rForeArm: [-0.64, -2.04, 0.26],
    wrist: [2.36, -0.14, -0.34],
    thumbEulers: [
      [1.16, 1.16, -0.54],
      [0.56, -0.44, -0.54],
      [0, 0, 0],
    ],
    index: { j1: 1.16, j2: 0.76, j3: 0.86 },
    middle: { j1: 0.96, j2: 0.46, j3: 1.06 },
    ring: { j1: 0.36, j2: 0.76, j3: 0.46 },
    pinky: { j1: -0.14, j2: 1.16, j3: -0.74 },
  },
  P: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [1.96, -0.04, 0.36],
    thumbEulers: [
      [0.46, -1.04, 0.16],
      [-0.14, -0.84, 0.36],
      [0, 0, 0],
    ],
    index: { j1: 1.76, j2: 0.16, j3: -0.14 },
    middle: { j1: 2.26, j2: 0.16, j3: -0.14 },
    ring: { j1: 2.36, j2: 2.26, j3: 1.36 },
    pinky: { j1: 2.96, j2: 1.66, j3: 1.86 },
  },
  Q: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [1.96, -0.04, 0.86],
    thumbEulers: [
      [0.46, -1.24, 0.86],
      [0.36, 0.16, -0.24],
      [0, 0, 0],
    ],
    index: { j1: 0.96, j2: 0.16, j3: -0.14 },
    middle: { j1: 2.16, j2: 1.46, j3: 1.26 },
    ring: { j1: 2.36, j2: 2.26, j3: 1.36 },
    pinky: { j1: 2.96, j2: 1.66, j3: 1.86 },
  },
  R: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [1.66, 0.16, -0.14],
    thumbEulers: [
      [-0.04, -1.24, 0.86],
      [-0.54, -0.44, -1.84],
      [0, 0, 0],
    ],
    index: { j1: -0.04, j2: 0.26, j3: 0.16 },
    middle: { j1: -0.44, j2: -0.24, j3: 0.36 },
    ring: { j1: 1.86, j2: 1.66, j3: 0.96 },
    pinky: { j1: 1.26, j2: 1.36, j3: 1.56 },
  },
  S: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [0.76, 0.16, -0.14],
    thumbEulers: [
      [-0.04, 0.56, -0.34],
      [-0.24, -3.14, -2.64],
      [0, 0, 0],
    ],
    index: { j1: 1.36, j2: 1.96, j3: 1.76 },
    middle: { j1: 1.66, j2: 1.06, j3: 1.56 },
    ring: { j1: 1.86, j2: 1.66, j3: 0.96 },
    pinky: { j1: 1.26, j2: 1.36, j3: 1.56 },
  },
  T: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [2.66, -0.64, 1.26],
    thumbEulers: [
      [-0.04, 1.06, 0.96],
      [-0.24, -0.04, 0.36],
      [0, 0, 0],
    ],
    index: { j1: 0.16, j2: 0.16, j3: -0.04 },
    middle: { j1: 2.06, j2: 1.46, j3: 1.66 },
    ring: { j1: 2.26, j2: 2.06, j3: 1.46 },
    pinky: { j1: 2.06, j2: 1.36, j3: 1.56 },
  },
  U: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [2.46, -0.34, -1.04],
    thumbEulers: [
      [-0.04, 1.26, 0.66],
      [-0.24, -0.74, -0.14],
      [0, 0, 0],
    ],
    index: { j1: 0.46, j2: 0.56, j3: -0.04 },
    middle: { j1: 0.36, j2: 0.46, j3: 0.86 },
    ring: { j1: 0.36, j2: 0.46, j3: 1.16 },
    pinky: { j1: 0.16, j2: -0.34, j3: 1.56 },
  },
  V: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [0.86, -0.04, -0.04],
    thumbEulers: [
      [1.36, -0.84, 0.26],
      [-0.24, -0.94, -1.14],
      [0, 0, 0],
    ],
    index: { j1: -0.64, j2: 0.56, j3: 0.16 },
    middle: { j1: -0.44, j2: -0.04, j3: 0.56 },
    ring: { j1: 1.86, j2: 1.96, j3: 1.86 },
    pinky: { j1: 1.16, j2: 0.76, j3: 1.56 },
  },
  W: {
    rArm: [-1.44, -1.24, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    wrist: [0.86, -0.04, -0.04],
    thumbEulers: [
      [1.36, -0.84, 0.26],
      [-0.24, -0.94, -1.14],
      [0, 0, 0],
    ],
    index: { j1: -0.64, j2: 0.56, j3: 0.16 },
    middle: { j1: -0.14, j2: -0.04, j3: 0.56 },
    ring: { j1: -0.14, j2: -0.14, j3: -0.04 },
    pinky: { j1: 1.16, j2: 0.76, j3: 1.56 },
  },
  X: {
    rArm: [-1.44, -1.24, 0.4],
    rForeArm: [0.46, 2.56, 0.16],
    wrist: [1.46, 0.16, -0.14],
    thumbEulers: [
      [0.0, -0.44, 0.16],
      [-0.34, -1.44, -0.54],
      [0, 0, 0],
    ],
    index: { j1: 0.26, j2: 0.76, j3: 0.76 },
    middle: { j1: 2.26, j2: 1.66, j3: 1.06 },
    ring: { j1: 2.26, j2: 1.96, j3: 0.56 },
    pinky: { j1: 2.06, j2: 1.96, j3: 0.56 },
  },
  Y: {
    thumb: F_STRAIGHT,
    index: F_CURLED,
    middle: F_CURLED,
    ring: F_CURLED,
    pinky: F_STRAIGHT,
  },
};

// --- NUMBERS (Right Hand) ---
export const ASL_NUMBERS: Record<string, HandPose> = {
  "0": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [-0.54, 0.16, 0.00],
    thumbEulers: [
      [0.00, -0.24, 0.86],
      [-0.34, -0.24, -0.94],
      [0, 0, 0],
    ],
    index: { j1: 0.66, j2: 1.56, j3: 0.00 },
    middle: { j1: 0.76, j2: 1.26, j3: 0.00 },
    ring: { j1: 0.56, j2: 1.06, j3: 0.16 },
    pinky: { j1: 0.56, j2: 0.76, j3: 0.00 },
  },
  "1": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, -0.64, -0.24],
      [-0.34, -0.74, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 1.26, j2: 1.26, j3: 0.00 },
    ring: { j1: 1.46, j2: 1.66, j3: 0.16 },
    pinky: { j1: 1.26, j2: 1.26, j3: 0.00 },
  },
  "2": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, -0.64, -0.24],
      [-0.34, -0.74, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 0.00, j2: 0.00, j3: 0.00 },
    ring: { j1: 1.46, j2: 1.66, j3: 0.16 },
    pinky: { j1: 1.26, j2: 1.26, j3: 0.00 },
  },
  "3": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, 0.00, -0.14],
      [-0.34, 0.00, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 0.00, j2: 0.00, j3: 0.00 },
    ring: { j1: 1.46, j2: 1.66, j3: 0.16 },
    pinky: { j1: 1.26, j2: 1.26, j3: 0.00 },
  },
  "4": {
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, 0.00, -0.14],
      [-0.34, -1.64, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 0.00, j2: 0.00, j3: 0.00 },
    ring: { j1: 0.00, j2: 0.00, j3: 0.00 },
    pinky: { j1: 0.00, j2: 0.00, j3: 0.00 },
  },
  "5": {
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, 0.00, -0.14],
      [-0.34, 0.00, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 0.00, j2: 0.00, j3: 0.00 },
    ring: { j1: 0.00, j2: 0.00, j3: 0.00 },
    pinky: { j1: 0.00, j2: 0.00, j3: 0.00 },
  },
  "6": {
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, -0.44, -0.04],
      [-0.34, -1.64, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 0.00, j2: 0.00, j3: 0.00 },
    ring: { j1: 0.00, j2: 0.00, j3: 0.00 },
    pinky: { j1: 1.06, j2: 2.46, j3: 0.00 },
  },
  "7": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, -0.64, -0.24],
      [-0.34, -0.74, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: -0.24, j2: 0.16, j3: 0.00 },
    ring: { j1: 1.46, j2: 1.66, j3: 0.16 },
    pinky: { j1: -0.04, j2: 0.16, j3: 0.00 },
  },
  "8": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, -0.64, -0.24],
      [-0.34, -0.74, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 0.00, j2: 0.00, j3: 0.00 },
    middle: { j1: 1.26, j2: 0.86, j3: 0.00 },
    ring: { j1: -0.34, j2: -0.14, j3: 0.16 },
    pinky: { j1: -0.04, j2: 0.16, j3: 0.00 },
  },
  "9": {
    rArm: [-1.44, -1.14, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    wrist: [0.76, 0.16, 0.00],
    thumbEulers: [
      [0.00, 0.16, -0.24],
      [-0.34, -1.34, 0.00],
      [0, 0, 0],
    ],
    index: { j1: 1.36, j2: 1.56, j3: 0.00 },
    middle: { j1: -0.24, j2: 0.06, j3: 0.00 },
    ring: { j1: -0.34, j2: -0.14, j3: 0.16 },
    pinky: { j1: -0.04, j2: 0.16, j3: 0.00 },
  },
};

export type Keyframe = {
  time: number;
  rArm?: [number, number, number];
  rForeArm?: [number, number, number];
  pose?: HandPose;
};

// XBot specific arm poses
// Empirical calibration from user interaction:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ARM_REST = {
  rArm: [-1.44, -1.24, -0.14],
  rForeArm: [0.46, 0.26, 0.56],
} as any;
const POSE_REST: HandPose = {
  thumbEulers: [
    [0, 0, -0.14],
    [-0.34, 0, 0],
    [0, 0, 0],
  ],
  index: { j1: 0, j2: 0, j3: 0 },
  middle: { j1: 0, j2: 0, j3: 0 },
  ring: { j1: 0, j2: 0, j3: 0 },
  pinky: { j1: 0, j2: 0, j3: 0 },
  wrist: [0.76, 0.16, 0.0],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ARM_SPELL = {
  rArm: [-1.04, -1.0, 0.4],
  rForeArm: [-0.24, 2.66, 0.16],
  wrist: [-0.74, 0, 0],
} as any; // Chest spelling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HELLO_P1 = {
  rArm: [-1.04, -1.54, 1.56],
  rForeArm: [2.96, 2.66, -1.14],
} as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HELLO_P2 = {
  rArm: [-1.04, -1.44, 1.56],
  rForeArm: [2.96, 2.66, -2.14],
} as any;
const POSE_HELLO: HandPose = {
  ...ASL_ALPHABET["B"],
  thumbEulers: [
    [0, 0, 0],
    [3.06, 0, 0],
    [0, 0, 0],
  ],
  wrist: [1.36, -0.04, 0.26],
};

const POSE_Z_HAND: HandPose = {
  thumbEulers: [
    [0.0, -0.44, 0.16],
    [-0.34, -1.44, -0.54],
    [0, 0, 0],
  ],
  index: { j1: 0.16, j2: 0.16, j3: -0.14 },
  middle: { j1: 2.26, j2: 1.66, j3: 1.06 },
  ring: { j1: 2.26, j2: 1.96, j3: 0.56 },
  pinky: { j1: 2.06, j2: 1.96, j3: 0.56 },
};

const POSE_YES_HAND: HandPose = {
  thumbEulers: [
    [0.0, -0.34, -0.14],
    [-0.34, -1.04, 0.0],
    [0, 0, 0],
  ],
  index: { j1: 1.26, j2: 1.16, j3: 0.66 },
  middle: { j1: 1.16, j2: 0.86, j3: 0.86 },
  ring: { j1: 1.06, j2: 0.66, j3: 0.96 },
  pinky: { j1: 0.76, j2: 0.96, j3: 0.96 },
};

const YES_ANIMATION: Keyframe[] = [
  {
    time: 0.0,
    rArm: [-1.44, -1.04, 0.86],
    rForeArm: [0.46, 1.86, 0.56],
    pose: { ...POSE_YES_HAND, wrist: [0.76, 0.16, -1.64] },
  },
  {
    time: 0.3,
    rArm: [-1.44, -1.04, 0.86],
    rForeArm: [0.46, 1.86, 0.56],
    pose: { ...POSE_YES_HAND, wrist: [0.76, 0.16, 0.96] },
  },
  {
    time: 0.6,
    rArm: [-1.44, -1.04, 0.86],
    rForeArm: [0.46, 1.86, 0.56],
    pose: { ...POSE_YES_HAND, wrist: [0.76, 0.16, -1.64] },
  },
  {
    time: 0.9,
    rArm: [-1.44, -1.04, 0.86],
    rForeArm: [0.46, 1.86, 0.56],
    pose: { ...POSE_YES_HAND, wrist: [0.76, 0.16, 0.96] },
  },
  {
    time: 1.2,
    rArm: [-1.44, -1.04, 0.86],
    rForeArm: [0.46, 1.86, 0.56],
    pose: { ...POSE_YES_HAND, wrist: [0.76, 0.16, -1.64] },
  },
  { time: 1.5, ...ARM_REST, pose: POSE_REST },
];

const HELLO_ANIMATION: Keyframe[] = [
  { time: 0, ...ARM_REST, pose: POSE_REST },
  { time: 0.3, ...HELLO_P1, pose: POSE_HELLO },
  { time: 0.8, ...HELLO_P2, pose: POSE_HELLO },
  { time: 1.2, ...ARM_REST, pose: POSE_REST },
];

const POSE_BYE_OPEN: HandPose = {
  thumbEulers: [
    [0.0, 0.0, -0.14],
    [-0.34, 0.0, 0.0],
    [0, 0, 0],
  ],
  index: { j1: 0.0, j2: 0.0, j3: 0.0 },
  middle: { j1: 0.0, j2: 0.0, j3: 0.0 },
  ring: { j1: 0.0, j2: 0.0, j3: 0.0 },
  pinky: { j1: 0.0, j2: 0.0, j3: 0.0 },
  wrist: [0.76, 0.16, 0.0],
};

const POSE_BYE_CLOSED: HandPose = {
  thumbEulers: [
    [0.0, 0.0, -0.14],
    [-0.34, 0.0, 0.0],
    [0, 0, 0],
  ],
  index: { j1: 1.46, j2: 1.76, j3: 0.0 },
  middle: { j1: 1.46, j2: 2.06, j3: 0.0 },
  ring: { j1: 1.76, j2: 1.26, j3: 0.0 },
  pinky: { j1: 1.86, j2: 1.26, j3: 0.0 },
  wrist: [0.76, 0.16, 0.0],
};

const BYE_ANIMATION: Keyframe[] = [
  {
    time: 0.0,
    rArm: [-1.74, -1.24, 0.46],
    rForeArm: [0.36, 2.16, 0.56],
    pose: POSE_BYE_OPEN,
  },
  {
    time: 0.3,
    rArm: [-1.74, -1.24, 0.46],
    rForeArm: [0.36, 2.16, 0.56],
    pose: POSE_BYE_CLOSED,
  },
  {
    time: 0.6,
    rArm: [-1.74, -1.24, 0.46],
    rForeArm: [0.36, 2.16, 0.56],
    pose: POSE_BYE_OPEN,
  },
  {
    time: 0.9,
    rArm: [-1.74, -1.24, 0.46],
    rForeArm: [0.36, 2.16, 0.56],
    pose: POSE_BYE_CLOSED,
  },
  {
    time: 1.2,
    rArm: [-1.74, -1.24, 0.46],
    rForeArm: [0.36, 2.16, 0.56],
    pose: POSE_BYE_OPEN,
  },
  { time: 1.5, ...ARM_REST, pose: POSE_REST },
];

const POSE_NO_OPEN: HandPose = {
  thumbEulers: [
    [0.0, 0.76, -0.14],
    [-0.34, 0.0, 0.0],
    [0, 0, 0],
  ],
  index: { j1: 0.66, j2: 0.0, j3: 0.0 },
  middle: { j1: 0.76, j2: 0.0, j3: 0.0 },
  ring: { j1: 1.66, j2: 1.56, j3: -0.14 },
  pinky: { j1: 1.86, j2: 1.96, j3: 0.0 },
  wrist: [0.26, 0.16, 0.0],
};

const POSE_NO_CLOSED: HandPose = {
  thumbEulers: [
    [0.0, 0.56, -0.14],
    [-0.34, -0.64, 0.0],
    [0, 0, 0],
  ],
  index: { j1: 1.36, j2: 0.06, j3: 0.0 },
  middle: { j1: 1.36, j2: 0.0, j3: 0.0 },
  ring: { j1: 1.66, j2: 1.56, j3: -0.14 },
  pinky: { j1: 1.86, j2: 1.96, j3: 0.0 },
  wrist: [0.26, 0.16, 0.0],
};

const NO_ANIMATION: Keyframe[] = [
  {
    time: 0.0,
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    pose: POSE_NO_OPEN,
  },
  {
    time: 0.3,
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    pose: POSE_NO_CLOSED,
  },
  {
    time: 0.6,
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    pose: POSE_NO_OPEN,
  },
  {
    time: 0.9,
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    pose: POSE_NO_CLOSED,
  },
  {
    time: 1.2,
    rArm: [-1.44, -1.24, 0.76],
    rForeArm: [0.46, 2.06, 0.56],
    pose: POSE_NO_OPEN,
  },
  { time: 1.5, ...ARM_REST, pose: POSE_REST },
];

const POSE_FLAT_CHEST: HandPose = {
  ...ASL_ALPHABET["B"],
  wrist: [0.76, 1.5, 0.0],
};

const PLEASE_ANIMATION: Keyframe[] = [
  {
    time: 0.0,
    rArm: [-1.44, 0.0, 0.86],
    rForeArm: [0.56, 2.16, 0.56],
    pose: POSE_FLAT_CHEST,
  },
  {
    time: 0.4,
    rArm: [-1.44, -0.2, 0.76],
    rForeArm: [0.56, 2.16, 0.56],
    pose: POSE_FLAT_CHEST,
  },
  {
    time: 0.8,
    rArm: [-1.44, 0.0, 0.66],
    rForeArm: [0.56, 2.16, 0.56],
    pose: POSE_FLAT_CHEST,
  },
  {
    time: 1.2,
    rArm: [-1.44, 0.2, 0.76],
    rForeArm: [0.56, 2.16, 0.56],
    pose: POSE_FLAT_CHEST,
  },
  {
    time: 1.6,
    rArm: [-1.44, 0.0, 0.86],
    rForeArm: [0.56, 2.16, 0.56],
    pose: POSE_FLAT_CHEST,
  },
  { time: 2.0, ...ARM_REST, pose: POSE_REST },
];

const POSE_THANK_YOU_START: HandPose = {
  ...ASL_ALPHABET["B"],
  wrist: [0.76, 1.5, 0.0],
};

const POSE_THANK_YOU_END: HandPose = {
  ...ASL_ALPHABET["B"],
  wrist: [0.76, 0.16, 0.0],
};

const THANK_YOU_ANIMATION: Keyframe[] = [
  {
    time: 0.0,
    rArm: [-1.44, 0.0, 1.1],
    rForeArm: [0.56, 2.36, 0.56],
    pose: POSE_THANK_YOU_START,
  },
  {
    time: 0.3,
    rArm: [-1.44, 0.0, 1.1],
    rForeArm: [0.56, 2.36, 0.56],
    pose: POSE_THANK_YOU_START,
  },
  {
    time: 0.8,
    rArm: [-1.44, -1.0, 0.6],
    rForeArm: [0.56, 1.6, 0.56],
    pose: POSE_THANK_YOU_END,
  },
  {
    time: 1.2,
    rArm: [-1.44, -1.0, 0.6],
    rForeArm: [0.56, 1.6, 0.56],
    pose: POSE_THANK_YOU_END,
  },
  { time: 1.6, ...ARM_REST, pose: POSE_REST },
];

export const ASL_WORDS: Record<string, Keyframe[]> = {
  PLEASE: PLEASE_ANIMATION,
  PLS: PLEASE_ANIMATION,

  NO: NO_ANIMATION,
  NOPE: NO_ANIMATION,
  NAH: NO_ANIMATION,
  NA: NO_ANIMATION,

  BYE: BYE_ANIMATION,
  GOODBYE: BYE_ANIMATION,
  "BYE BYE": BYE_ANIMATION,
  "SEE YOU LATER": BYE_ANIMATION,
  LATER: BYE_ANIMATION,
  "SEE YOU": BYE_ANIMATION,
  "LATER SEE YOU": BYE_ANIMATION,
  YES: YES_ANIMATION,
  YEA: YES_ANIMATION,
  YEAH: YES_ANIMATION,
  YA: YES_ANIMATION,
  YEP: YES_ANIMATION,
  HELLO: HELLO_ANIMATION,
  HI: HELLO_ANIMATION,
  HEY: HELLO_ANIMATION,
  "THANK YOU": THANK_YOU_ANIMATION,
  Z: [
    {
      time: 0.0,
      rArm: [-1.44, -1.24, 0.4],
      rForeArm: [0.86, 2.56, 0.16],
      pose: { ...POSE_Z_HAND, wrist: [0.46, 0.16, -0.14] },
    },
    {
      time: 0.3,
      rArm: [-1.44, -1.24, 0.4],
      rForeArm: [0.86, 2.46, -0.44],
      pose: { ...POSE_Z_HAND, wrist: [0.46, 0.16, -0.14] },
    },
    {
      time: 0.6,
      rArm: [-1.44, -1.44, 0.16],
      rForeArm: [0.66, 2.16, 1.16],
      pose: { ...POSE_Z_HAND, wrist: [0.56, 0.16, -1.04] },
    },
    {
      time: 0.9,
      rArm: [-1.44, -1.44, -0.54],
      rForeArm: [0.66, 2.16, 0.36],
      pose: { ...POSE_Z_HAND, wrist: [0.56, 0.96, -1.44] },
    },
    {
      time: 1.2,
      rArm: [-1.44, -1.44, -0.54],
      rForeArm: [0.66, 2.16, 0.36],
      pose: { ...POSE_Z_HAND, wrist: [0.56, 0.96, -1.44] },
    }, // Hold it slightly
  ],
};

function getEulersForPose(
  pose: HandPose,
): Record<string, [number, number, number]> {
  const p = pose || {};
  const t = p.thumb || T_STRAIGHT;
  const i = p.index || F_STRAIGHT;
  const m = p.middle || F_STRAIGHT;
  const r = p.ring || F_STRAIGHT;
  const pi = p.pinky || F_STRAIGHT;

  const lt = p.lThumbEulers;
  const li = p.lIndex || F_STRAIGHT;
  const lm = p.lMiddle || F_STRAIGHT;
  const lr = p.lRing || F_STRAIGHT;
  const lpi = p.lPinky || F_STRAIGHT;

  return {
    [BONES.R_THUMB_1]: p.thumbEulers ? p.thumbEulers[0] : [0, t.j1, 0],
    [BONES.R_THUMB_2]: p.thumbEulers ? p.thumbEulers[1] : [0, t.j2, 0],
    [BONES.R_THUMB_3]: p.thumbEulers ? p.thumbEulers[2] : [0, t.j3, 0],
    [BONES.R_INDEX_1]: [0, 0, i.j1],
    [BONES.R_INDEX_2]: [0, 0, i.j2],
    [BONES.R_INDEX_3]: [0, 0, i.j3],
    [BONES.R_MIDDLE_1]: [0, 0, m.j1],
    [BONES.R_MIDDLE_2]: [0, 0, m.j2],
    [BONES.R_MIDDLE_3]: [0, 0, m.j3],
    [BONES.R_RING_1]: [0, 0, r.j1],
    [BONES.R_RING_2]: [0, 0, r.j2],
    [BONES.R_RING_3]: [0, 0, r.j3],
    [BONES.R_PINKY_1]: [0, 0, pi.j1],
    [BONES.R_PINKY_2]: [0, 0, pi.j2],
    [BONES.R_PINKY_3]: [0, 0, pi.j3],
    [BONES.L_THUMB_1]: lt ? lt[0] : [0, 0, 0],
    [BONES.L_THUMB_2]: lt ? lt[1] : [0, 0, 0],
    [BONES.L_THUMB_3]: lt ? lt[2] : [0, 0, 0],
    [BONES.L_INDEX_1]: [0, 0, li.j1],
    [BONES.L_INDEX_2]: [0, 0, li.j2],
    [BONES.L_INDEX_3]: [0, 0, li.j3],
    [BONES.L_MIDDLE_1]: [0, 0, lm.j1],
    [BONES.L_MIDDLE_2]: [0, 0, lm.j2],
    [BONES.L_MIDDLE_3]: [0, 0, lm.j3],
    [BONES.L_RING_1]: [0, 0, lr.j1],
    [BONES.L_RING_2]: [0, 0, lr.j2],
    [BONES.L_RING_3]: [0, 0, lr.j3],
    [BONES.L_PINKY_1]: [0, 0, lpi.j1],
    [BONES.L_PINKY_2]: [0, 0, lpi.j2],
    [BONES.L_PINKY_3]: [0, 0, lpi.j3],
  };
}

export function evaluatePose(
  sign: string,
  time: number,
): Record<string, [number, number, number]> {
  let eulers: Record<string, [number, number, number]> = {};

  // Default fallback is the resting pose
  const fallbackEulers = getEulersForPose(POSE_REST);
  fallbackEulers[BONES.R_ARM] = ARM_REST.rArm;
  fallbackEulers[BONES.R_FOREARM] = ARM_REST.rForeArm;

  // Drop the left arm too so it's not stuck in a T-pose
  // Left arm drops with Z = -1.3
  fallbackEulers[BONES.L_ARM] = [0, 0, -1.3];
  fallbackEulers[BONES.L_FOREARM] = [0, 0, 0];
  fallbackEulers[BONES.L_HAND] = [0, 0, 0];

  if (ASL_WORDS[sign]) {
    const keyframes = ASL_WORDS[sign];
    // Find surrounding keyframes
    let k1 = keyframes[0];
    let k2 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        k1 = keyframes[i];
        k2 = keyframes[i + 1];
        break;
      }
    }

    if (time >= k2.time) {
      k1 = k2;
    }

    const t = k1 === k2 ? 0 : (time - k1.time) / (k2.time - k1.time);

    // Interpolate ARM
    const r1 = k1.rArm || ARM_REST.rArm;
    const r2 = k2.rArm || ARM_REST.rArm;
    const interpolatedArm: [number, number, number] = [
      r1[0] + (r2[0] - r1[0]) * t,
      r1[1] + (r2[1] - r1[1]) * t,
      r1[2] + (r2[2] - r1[2]) * t,
    ];

    const f1 = k1.rForeArm || ARM_REST.rForeArm;
    const f2 = k2.rForeArm || ARM_REST.rForeArm;
    const interpolatedForeArm: [number, number, number] = [
      f1[0] + (f2[0] - f1[0]) * t,
      f1[1] + (f2[1] - f1[1]) * t,
      f1[2] + (f2[2] - f1[2]) * t,
    ];

    // Interpolate hand pose (wrist + fingers)
    const p1 = getEulersForPose(k1.pose || ASL_ALPHABET["B"]);
    const p2 = getEulersForPose(k2.pose || ASL_ALPHABET["B"]);

    eulers[BONES.R_ARM] = interpolatedArm;
    eulers[BONES.R_FOREARM] = interpolatedForeArm;

    const w1 = k1.pose?.wrist || [0, 0, 0];
    const w2 = k2.pose?.wrist || [0, 0, 0];
    eulers[BONES.R_HAND] = [
      w1[0] + (w2[0] - w1[0]) * t,
      w1[1] + (w2[1] - w1[1]) * t,
      w1[2] + (w2[2] - w1[2]) * t,
    ];

    // Also explicitly drop the left arm during animations
    eulers[BONES.L_ARM] = [0, 0, -1.3];
    eulers[BONES.L_FOREARM] = [0, 0, 0];

    for (const bone of Object.keys(p1)) {
      eulers[bone] = [
        p1[bone][0] + (p2[bone][0] - p1[bone][0]) * t,
        p1[bone][1] + (p2[bone][1] - p1[bone][1]) * t,
        p1[bone][2] + (p2[bone][2] - p1[bone][2]) * t,
      ];
    }
  } else if (ASL_ALPHABET[sign] || ASL_NUMBERS[sign]) {
    // Static spelling pose
    const pose = ASL_ALPHABET[sign] || ASL_NUMBERS[sign];
    eulers = getEulersForPose(pose);
    eulers[BONES.R_ARM] = pose.rArm || ARM_SPELL.rArm;
    eulers[BONES.R_FOREARM] = pose.rForeArm || ARM_SPELL.rForeArm;
    eulers[BONES.R_HAND] = pose.wrist || ARM_SPELL.wrist;
    if (pose.lArm) eulers[BONES.L_ARM] = pose.lArm;
    if (pose.lForeArm) eulers[BONES.L_FOREARM] = pose.lForeArm;
    if (pose.lWrist) eulers[BONES.L_HAND] = pose.lWrist;
  } else {
    eulers = fallbackEulers;
  }

  return eulers;
}

export function isFingerspelling(sign: string): boolean {
  return !!(ASL_ALPHABET[sign] || ASL_NUMBERS[sign]) && !ASL_WORDS[sign];
}

export function getSignDuration(sign: string): number {
  if (ASL_WORDS[sign]) {
    const kfs = ASL_WORDS[sign];
    return kfs[kfs.length - 1].time;
  }
  return 1.0; // 1 second for fingerspelling
}

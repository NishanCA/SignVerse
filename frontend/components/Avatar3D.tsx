"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { evaluatePose, getSignDuration, isFingerspelling, ASL_WORDS, ASL_NUMBERS, ASL_ALPHABET, BONES } from "../lib/signAnimations";
import { motion, AnimatePresence } from "framer-motion";

const AVATAR_URL = "/avatar2.glb";
const ACCESSORY_TAG = "avatar_accessory";

// Helper to directly set rotation
function setEulerDirect(current: THREE.Euler, targetEuler: [number, number, number]) {
  current.set(targetEuler[0], targetEuler[1], targetEuler[2]);
}

function AvatarModel({ signingText, trigger, debug, onSequenceFinished, onFingerspellingChange, onSignChange, skinColor = "#e8beac", speedMultiplier = 1.0 }: { signingText?: string, trigger?: number, debug: Record<string, number>, onSequenceFinished: () => void, onFingerspellingChange: (isFs: boolean) => void, onSignChange: (sign: string | null, remaining: number, word?: string) => void, skinColor?: string, speedMultiplier?: number }) {
  const { scene } = useGLTF(AVATAR_URL);
  
  const timerRef = useRef(0);
  const currentSignRef = useRef<string | null>(null);
  
  const debugRef = useRef(debug);
  useEffect(() => {
      debugRef.current = debug;
  }, [debug]);

  const boneMap = useMemo(() => {
    const map: Record<string, THREE.Object3D> = {};
    scene.traverse((child) => {
        const cleanName = child.name.replace('mixamorig:', '').replace('mixamorig', '');
        map[child.name] = child;
        map[cleanName] = child;
        map[`mixamorig:${cleanName}`] = child;
        map[`mixamorig${cleanName}`] = child;
    });
    return map;
  }, [scene]);

  // Apply customizations
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // 1. Set Skin Tone from prop & Clean up existing accessories
    const skinTone = new THREE.Color(skinColor);
    // Derive joint tone as slightly darker version of skin color
    const jointTone = skinTone.clone().multiplyScalar(0.85);

    const toRemove: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child.name.startsWith(ACCESSORY_TAG)) {
        toRemove.push(child);
      }
      if (child instanceof THREE.Mesh) {
        if (child.name.includes("Beta_HighLimbs") || (child.material && child.material.name.includes("Beta_HighLimbs"))) {
          if (!child.userData.originalColorSet) {
             child.userData.originalMaterial = child.material;
             child.material = child.material.clone();
             child.userData.originalColorSet = true;
             
             cleanups.push(() => {
                 child.material.dispose();
                 child.material = child.userData.originalMaterial;
                 child.userData.originalColorSet = false;
             });
          }
          child.material.color.copy(skinTone);
          child.material.roughness = 0.6;
        } else if (child.name.includes("Joints") || (child.material && child.material.name.includes("Joints"))) {
          if (!child.userData.originalColorSet) {
             child.userData.originalMaterial = child.material;
             child.material = child.material.clone();
             child.userData.originalColorSet = true;

             cleanups.push(() => {
                 child.material.dispose();
                 child.material = child.userData.originalMaterial;
                 child.userData.originalColorSet = false;
             });
          }
          child.material.color.copy(jointTone);
        }
      }
    });

    toRemove.forEach((c) => {
      if (c.parent) c.parent.remove(c);
      c.traverse((subChild) => {
        if (subChild instanceof THREE.Mesh) {
          subChild.geometry.dispose();
          if (Array.isArray(subChild.material)) {
            subChild.material.forEach(m => m.dispose());
          } else {
            subChild.material.dispose();
          }
        }
      });
    });

    const createMesh = (geom: THREE.BufferGeometry, mat: THREE.Material, nameSuffix: string) => {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `${ACCESSORY_TAG}_${nameSuffix}`;
      return mesh;
    };

    
    const attachToBone = (bone: THREE.Object3D | undefined, ...objs: THREE.Object3D[]) => {
      if (!bone) return;
      objs.forEach(obj => {
        obj.scale.set(100, 100, 100);
        obj.position.multiplyScalar(100);
        bone.add(obj);
        cleanups.push(() => {
           bone.remove(obj);
        });
      });
    };


    // --- FACE ---
    const head = boneMap['mixamorig:Head'];
    if (head) {
      const faceGroup = new THREE.Group();
      faceGroup.name = `${ACCESSORY_TAG}_face`;
      
      const matEye = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
      const matMouth = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.6 });

      // Eyes
      const eyeGeom = new THREE.SphereGeometry(0.012, 16, 16);
      const leftEye = createMesh(eyeGeom, matEye, 'l_eye');
      leftEye.position.set(0.035, 0.04, 0.088);
      const rightEye = createMesh(eyeGeom, matEye, 'r_eye');
      rightEye.position.set(-0.035, 0.04, 0.088);

      // Smile (curved tube)
      const smilePath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.03, 0, 0.095),
        new THREE.Vector3(0, -0.015, 0.095),
        new THREE.Vector3(0.03, 0, 0.095)
      ]);
      const smileGeom = new THREE.TubeGeometry(smilePath, 20, 0.005, 8, false);
      const mouth = createMesh(smileGeom, matMouth, 'mouth');
      mouth.position.set(0, -0.01, 0);

      faceGroup.add(leftEye, rightEye, mouth);
      attachToBone(head, faceGroup);

      cleanups.push(() => {
          matEye.dispose();
          matMouth.dispose();
          eyeGeom.dispose();
          smileGeom.dispose();
      });
    }

    return () => {
        cleanups.forEach(fn => fn());
    };
  }, [scene, boneMap, skinColor]);

  const localQueueRef = useRef<{ sign: string; word?: string }[]>([]);

  // Parse text into queue synchronously when trigger changes
  useEffect(() => {
    if (!signingText) return;
    
    // Split by spaces, filter out empties
    const words = signingText.toUpperCase().split(/[ ]+/).filter(w => w.length > 0);
    const newQueue: { sign: string; word?: string }[] = [];

    let i = 0;
    while (i < words.length) {
      let matched = false;
      // Greedy match for multi-word phrases
      for (let j = words.length; j > i; j--) {
        const phrase = words.slice(i, j).join(' ');
        if (ASL_WORDS[phrase]) {
          newQueue.push({ sign: phrase });
          i = j;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const word = words[i];
        for (const letter of word) {
          if (ASL_ALPHABET[letter] || ASL_NUMBERS[letter] || ASL_WORDS[letter]) {
            if (newQueue.length > 0 && newQueue[newQueue.length - 1].sign === letter) {
               newQueue.push({ sign: 'REST', word }); // Pause between identical letters
            }
            newQueue.push({ sign: letter, word });
          }
        }
        i++;
      }
    }
    
    localQueueRef.current = newQueue;
    currentSignRef.current = null;
    timerRef.current = 0;
  }, [signingText, trigger]);

  const prevIsFsRef = useRef<boolean>(false);

  useFrame((state, delta) => {
    if (localQueueRef.current.length === 0) {
        // Idle fallback
        if (prevIsFsRef.current !== false) {
           prevIsFsRef.current = false;
           onFingerspellingChange(false);
        }
        
        currentSignRef.current = null;
        timerRef.current = 0;
        
        // INTERACTIVE DEBUG OVERRIDE
        const d = debugRef.current;
        const debugEulers: Record<string, [number, number, number]> = {
            [BONES.R_ARM]: [d.rx, d.ry, d.rz],
            [BONES.R_FOREARM]: [d.fx, d.fy, d.fz],
            [BONES.R_HAND]: [d.wx, d.wy, d.wz],
            [BONES.R_THUMB_1]: [0, d.t1y, d.t1z],
            [BONES.R_THUMB_2]: [0, d.t2y, d.t2z],
            [BONES.R_INDEX_1]: [0, 0, d.i1],
            [BONES.R_INDEX_2]: [0, 0, d.i2],
            [BONES.R_INDEX_3]: [0, 0, d.i3],
            [BONES.R_MIDDLE_1]: [0, 0, d.m1],
            [BONES.R_MIDDLE_2]: [0, 0, d.m2],
            [BONES.R_MIDDLE_3]: [0, 0, d.m3],
            [BONES.R_RING_1]: [0, 0, d.r1],
            [BONES.R_RING_2]: [0, 0, d.r2],
            [BONES.R_RING_3]: [0, 0, d.r3],
            [BONES.R_PINKY_1]: [0, 0, d.p1],
            [BONES.R_PINKY_2]: [0, 0, d.p2],
            [BONES.R_PINKY_3]: [0, 0, d.p3],
            [BONES.L_ARM]: [d.lx, d.ly, d.lz],
            [BONES.L_FOREARM]: [d.lfx, d.lfy, d.lfz],
            [BONES.L_HAND]: [d.lwx, d.lwy, d.lwz],
            [BONES.L_THUMB_1]: [0, d.lt1y, d.lt1z],
            [BONES.L_THUMB_2]: [0, d.lt2y, d.lt2z],
            [BONES.L_INDEX_1]: [0, 0, d.li1],
            [BONES.L_INDEX_2]: [0, 0, d.li2],
            [BONES.L_INDEX_3]: [0, 0, d.li3],
            [BONES.L_MIDDLE_1]: [0, 0, d.lm1],
            [BONES.L_MIDDLE_2]: [0, 0, d.lm2],
            [BONES.L_MIDDLE_3]: [0, 0, d.lm3],
            [BONES.L_RING_1]: [0, 0, d.lr1],
            [BONES.L_RING_2]: [0, 0, d.lr2],
            [BONES.L_RING_3]: [0, 0, d.lr3],
            [BONES.L_PINKY_1]: [0, 0, d.lp1],
            [BONES.L_PINKY_2]: [0, 0, d.lp2],
            [BONES.L_PINKY_3]: [0, 0, d.lp3],
        };
        applyEulers(boneMap, debugEulers);
        
        state.camera.position.lerp(new THREE.Vector3(0, 1.65, 2.5), 2 * delta);
        return;
    }

    const tokenItem = localQueueRef.current[0];
    const token = tokenItem.sign;
    const currentWord = tokenItem.word;
    
    const isFs = isFingerspelling(token);
    if (prevIsFsRef.current !== isFs) {
        prevIsFsRef.current = isFs;
        onFingerspellingChange(isFs);
    }
    if (currentSignRef.current !== token) {
        currentSignRef.current = token;
        timerRef.current = 0;
        onSignChange(token, localQueueRef.current.length, currentWord);
    }

    timerRef.current += delta * speedMultiplier;
    const duration = getSignDuration(token);
    
    // Evaluate target pose for the current time
    const targetEulers = evaluatePose(token, timerRef.current);
    
    // Apply eulers directly to bones (smoothly lerped so transitions between signs don't snap)
    applyEulers(boneMap, targetEulers);

    // Camera zooming logic: zoom straight onto the hand
    const isNum = !!ASL_NUMBERS[token];
    const isLowerFs = token === "N" || token === "M" || token === "J";
    if (isNum) {
        // Zoom onto right hand near the chest area
        state.camera.position.lerp(new THREE.Vector3(-0.2, 1.50, 1.2), 3 * delta);
    } else if (isLowerFs) {
        // Zoom lower to the hip
        state.camera.position.lerp(new THREE.Vector3(-0.1, 1.10, 1.3), 3 * delta);
    } else if (isFs) {
        // Zoom straight onto right chest/hand area
        state.camera.position.lerp(new THREE.Vector3(-0.1, 1.60, 1.1), 3 * delta);
    } else {
        // Zoom out
        state.camera.position.lerp(new THREE.Vector3(0, 1.65, 2.5), 3 * delta);
    }

    if (timerRef.current >= duration) {
        localQueueRef.current.shift(); // Synchronous mutation
        currentSignRef.current = null; // Force setup for next sign
        if (localQueueRef.current.length === 0) {
            onSequenceFinished();
        }
    }
  });

  // Removed the debug overlay for clean view
  return <primitive object={scene} position={[0, 0, 0]} scale={1.0} />;
}

function applyEulers(boneMap: Record<string, THREE.Object3D>, targetEulers: Record<string, [number, number, number]>) {
    for (const [boneName, euler] of Object.entries(targetEulers)) {
        const bone = boneMap[boneName];
        if (bone) {
            setEulerDirect(bone.rotation, euler);
        }
    }
}

// A component to manage OrbitControls target dynamically
function DynamicControls({ isFingerspelling, isNumber, currentSign }: { isFingerspelling: boolean, isNumber: boolean, currentSign: string | null }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controlsRef = useRef<any>(null);
    
    useFrame((state, delta) => {
        if (!controlsRef.current) return;
        // Center directly on the body/hand for straight angle
        let target = new THREE.Vector3(0, 1.45, 0);
        const isLowerFs = currentSign === "N" || currentSign === "M" || currentSign === "J";
        if (isNumber) {
            target = new THREE.Vector3(-0.2, 1.45, 0); // Focus slightly towards right hand
        } else if (isLowerFs) {
            target = new THREE.Vector3(-0.1, 1.10, 0); // Focus towards the hip
        } else if (isFingerspelling) {
            target = new THREE.Vector3(-0.1, 1.55, 0); // Focus slightly towards right hand
        }
        controlsRef.current.target.lerp(target, 3 * delta);
        controlsRef.current.update();
    });

    return <OrbitControls ref={controlsRef} enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />;
}

interface AvatarProps {
  signingText?: string;
  trigger?: number; // Allows re-triggering the same text
  isActive?: boolean;
  onFinish?: () => void;
  speedMultiplier?: number;
  skinColor?: string;
  previewMode?: boolean;
}

export default function Avatar3D({ signingText, trigger, isActive = false, onFinish, speedMultiplier = 1.0, skinColor = "#e8beac", previewMode = false }: AvatarProps) {
  const [currentlyFingerspelling, setCurrentlyFingerspelling] = useState(false);
  const [currentSign, setCurrentSign] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | undefined>();
  const [remainingSigns, setRemainingSigns] = useState<number>(0);

  const [debug, setDebug] = useState({
      rx: -1.44, ry: -1.24, rz: -0.14, // rArm
      fx: 0.46, fy: 0.26, fz: 0.56,    // rForeArm
      wx: 0.76, wy: 0.16, wz: 0,    // wrist
      t1x: 0, t1y: 0, t1z: -0.14,    // thumb 1
      t2x: -0.34, t2y: 0, t2z: 0,    // thumb 2
      i1: 0, i2: 0, i3: 0,
      m1: 0, m2: 0, m3: 0,
      r1: 0, r2: 0, r3: 0,
      p1: 0, p2: 0, p3: 0,
      lx: 0, ly: 0, lz: -1.3, // lArm
      lfx: 0, lfy: 0, lfz: 0,    // lForeArm
      lwx: 0, lwy: 0, lwz: 0,    // lWrist
      lt1x: 0, lt1y: 0, lt1z: 0,    // lThumb 1
      lt2x: 0, lt2y: 0, lt2z: 0,    // lThumb 2
      li1: 0, li2: 0, li3: 0,
      lm1: 0, lm2: 0, lm3: 0,
      lr1: 0, lr2: 0, lr3: 0,
      lp1: 0, lp2: 0, lp3: 0,
  });

  const handleSequenceFinished = useCallback(() => {
     setCurrentlyFingerspelling(false);
     setCurrentSign(null);
     setCurrentWord(undefined);
     setRemainingSigns(0);
     if (onFinish) onFinish();
  }, [onFinish]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
      <Canvas camera={{ position: [0, 1.5, 2.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <Environment preset="city" />
        <React.Suspense fallback={null}>
          <AvatarModel 
              signingText={signingText} 
              trigger={trigger} 
              debug={debug} 
              onSequenceFinished={handleSequenceFinished} 
              onFingerspellingChange={setCurrentlyFingerspelling} 
              onSignChange={(sign, rem, word) => {
                  setCurrentSign(sign);
                  setRemainingSigns(rem);
                  setCurrentWord(word);
              }}
              skinColor={skinColor}
              speedMultiplier={speedMultiplier}
          />
        </React.Suspense>
        <DynamicControls isFingerspelling={currentlyFingerspelling} isNumber={currentSign !== null && /^[0-9]$/.test(currentSign)} currentSign={currentSign} />
      </Canvas>

      {/* Overlays */}
      <AnimatePresence>
        {false && isActive && !previewMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 left-0 right-0 flex justify-center z-10"
          >
            <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              3D Sign Avatar Active
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {false && !signingText && (
            <motion.div className="absolute top-4 right-4 bg-black/80 p-4 rounded-xl text-xs text-white z-50 flex flex-col gap-2 w-64 border border-white/20 max-h-[calc(100%-2rem)] overflow-y-auto pointer-events-auto shadow-2xl">
                <div className="font-bold text-green-400 mb-1">INTERACTIVE POSE FINDER</div>
                <p className="text-gray-300 text-[10px] leading-tight mb-2">Scroll down to see all sliders. Find the perfect pose and send me the numbers!</p>
                
                <div className="font-bold text-blue-400 mt-4 mb-2">--- RIGHT HAND ---</div>\n                <div className="font-semibold mt-2">Upper Arm (rArm)</div>
                <label className="flex items-center gap-2">X (Twist): {debug.rx.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.rx} onChange={e => setDebug(d => ({...d, rx: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y (Swing): {debug.ry.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.ry} onChange={e => setDebug(d => ({...d, ry: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z (Drop/Lift): {debug.rz.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.rz} onChange={e => setDebug(d => ({...d, rz: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">ForeArm (Elbow)</div>
                <label className="flex items-center gap-2">X: {debug.fx.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.fx} onChange={e => setDebug(d => ({...d, fx: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y: {debug.fy.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.fy} onChange={e => setDebug(d => ({...d, fy: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z: {debug.fz.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.fz} onChange={e => setDebug(d => ({...d, fz: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                
                <div className="font-semibold mt-2">Wrist/Hand</div>
                <label className="flex items-center gap-2">X (Twist): {debug.wx.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.wx} onChange={e => setDebug(d => ({...d, wx: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y (Bend/Tilt): {debug.wy.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.wy} onChange={e => setDebug(d => ({...d, wy: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z (Side Tilt): {debug.wz.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.wz} onChange={e => setDebug(d => ({...d, wz: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Thumb Joint 1</div>
                <label className="flex items-center gap-2">X: {debug.t1x.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.t1x} onChange={e => setDebug(d => ({...d, t1x: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y: {debug.t1y.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.t1y} onChange={e => setDebug(d => ({...d, t1y: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z: {debug.t1z.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.t1z} onChange={e => setDebug(d => ({...d, t1z: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Thumb Joint 2</div>
                <label className="flex items-center gap-2">X: {debug.t2x.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.t2x} onChange={e => setDebug(d => ({...d, t2x: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y: {debug.t2y.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.t2y} onChange={e => setDebug(d => ({...d, t2y: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z: {debug.t2z.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.t2z} onChange={e => setDebug(d => ({...d, t2z: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Index Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.i1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.i1} onChange={e => setDebug(d => ({...d, i1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.i2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.i2} onChange={e => setDebug(d => ({...d, i2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.i3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.i3} onChange={e => setDebug(d => ({...d, i3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Middle Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.m1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.m1} onChange={e => setDebug(d => ({...d, m1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.m2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.m2} onChange={e => setDebug(d => ({...d, m2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.m3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.m3} onChange={e => setDebug(d => ({...d, m3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Ring Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.r1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.r1} onChange={e => setDebug(d => ({...d, r1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.r2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.r2} onChange={e => setDebug(d => ({...d, r2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.r3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.r3} onChange={e => setDebug(d => ({...d, r3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Pinky Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.p1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.p1} onChange={e => setDebug(d => ({...d, p1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.p2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.p2} onChange={e => setDebug(d => ({...d, p2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.p3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.p3} onChange={e => setDebug(d => ({...d, p3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                \n                <div className="font-bold text-purple-400 mt-4 mb-2 border-t border-white/20 pt-4">--- LEFT HAND ---</div>\n                <div className="font-semibold mt-2">Upper Arm (lArm)</div>
                <label className="flex items-center gap-2">X (Twist): {debug.lx.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lx} onChange={e => setDebug(d => ({...d, lx: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y (Swing): {debug.ly.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.ly} onChange={e => setDebug(d => ({...d, ly: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z (Drop/Lift): {debug.lz.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lz} onChange={e => setDebug(d => ({...d, lz: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">ForeArm (Elbow)</div>
                <label className="flex items-center gap-2">X: {debug.lfx.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lfx} onChange={e => setDebug(d => ({...d, lfx: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y: {debug.lfy.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lfy} onChange={e => setDebug(d => ({...d, lfy: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z: {debug.lfz.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lfz} onChange={e => setDebug(d => ({...d, lfz: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                
                <div className="font-semibold mt-2">Wrist/Hand</div>
                <label className="flex items-center gap-2">X (Twist): {debug.lwx.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lwx} onChange={e => setDebug(d => ({...d, lwx: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y (Bend/Tilt): {debug.lwy.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lwy} onChange={e => setDebug(d => ({...d, lwy: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z (Side Tilt): {debug.lwz.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lwz} onChange={e => setDebug(d => ({...d, lwz: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Thumb Joint 1</div>
                <label className="flex items-center gap-2">X: {debug.lt1x.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lt1x} onChange={e => setDebug(d => ({...d, lt1x: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y: {debug.lt1y.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lt1y} onChange={e => setDebug(d => ({...d, lt1y: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z: {debug.lt1z.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lt1z} onChange={e => setDebug(d => ({...d, lt1z: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Thumb Joint 2</div>
                <label className="flex items-center gap-2">X: {debug.lt2x.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lt2x} onChange={e => setDebug(d => ({...d, lt2x: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Y: {debug.lt2y.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lt2y} onChange={e => setDebug(d => ({...d, lt2y: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Z: {debug.lt2z.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lt2z} onChange={e => setDebug(d => ({...d, lt2z: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Index Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.li1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.li1} onChange={e => setDebug(d => ({...d, li1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.li2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.li2} onChange={e => setDebug(d => ({...d, li2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.li3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.li3} onChange={e => setDebug(d => ({...d, li3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Middle Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.lm1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lm1} onChange={e => setDebug(d => ({...d, lm1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.lm2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lm2} onChange={e => setDebug(d => ({...d, lm2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.lm3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lm3} onChange={e => setDebug(d => ({...d, lm3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Ring Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.lr1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lr1} onChange={e => setDebug(d => ({...d, lr1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.lr2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lr2} onChange={e => setDebug(d => ({...d, lr2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.lr3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lr3} onChange={e => setDebug(d => ({...d, lr3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-2">Pinky Finger</div>
                <label className="flex items-center gap-2">Joint 1 (Base): {debug.lp1.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lp1} onChange={e => setDebug(d => ({...d, lp1: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 2 (Mid): {debug.lp2.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lp2} onChange={e => setDebug(d => ({...d, lp2: parseFloat(e.target.value)}))} className="w-full" />
                </label>
                <label className="flex items-center gap-2">Joint 3 (Tip): {debug.lp3.toFixed(2)}
                    <input type="range" min="-3.14" max="3.14" step="0.1" value={debug.lp3} onChange={e => setDebug(d => ({...d, lp3: parseFloat(e.target.value)}))} className="w-full" />
                </label>

                <div className="font-semibold mt-4 mb-2 border-t border-white/20 pt-4">Export Code</div>
                <textarea 
                    readOnly 
                    className="w-full h-40 bg-black/50 text-[10px] text-green-400 p-2 rounded outline-none font-mono resize-none cursor-text"
                    value={`{
  rArm: [${debug.rx.toFixed(2)}, ${debug.ry.toFixed(2)}, ${debug.rz.toFixed(2)}],
  rForeArm: [${debug.fx.toFixed(2)}, ${debug.fy.toFixed(2)}, ${debug.fz.toFixed(2)}],
  wrist: [${debug.wx.toFixed(2)}, ${debug.wy.toFixed(2)}, ${debug.wz.toFixed(2)}],
  thumbEulers: [[${debug.t1x.toFixed(2)}, ${debug.t1y.toFixed(2)}, ${debug.t1z.toFixed(2)}], [${debug.t2x.toFixed(2)}, ${debug.t2y.toFixed(2)}, ${debug.t2z.toFixed(2)}], [0, 0, 0]],
  index: { j1: ${debug.i1.toFixed(2)}, j2: ${debug.i2.toFixed(2)}, j3: ${debug.i3.toFixed(2)} },
  middle: { j1: ${debug.m1.toFixed(2)}, j2: ${debug.m2.toFixed(2)}, j3: ${debug.m3.toFixed(2)} },
  ring: { j1: ${debug.r1.toFixed(2)}, j2: ${debug.r2.toFixed(2)}, j3: ${debug.r3.toFixed(2)} },
  pinky: { j1: ${debug.p1.toFixed(2)}, j2: ${debug.p2.toFixed(2)}, j3: ${debug.p3.toFixed(2)} }
,
  lArm: [${debug.lx.toFixed(2)}, ${debug.ly.toFixed(2)}, ${debug.lz.toFixed(2)}],
  lForeArm: [${debug.lfx.toFixed(2)}, ${debug.lfy.toFixed(2)}, ${debug.lfz.toFixed(2)}],
  lWrist: [${debug.lwx.toFixed(2)}, ${debug.lwy.toFixed(2)}, ${debug.lwz.toFixed(2)}],
  lThumbEulers: [[${debug.lt1x.toFixed(2)}, ${debug.lt1y.toFixed(2)}, ${debug.lt1z.toFixed(2)}], [${debug.lt2x.toFixed(2)}, ${debug.lt2y.toFixed(2)}, ${debug.lt2z.toFixed(2)}], [0, 0, 0]],
  lIndex: { j1: ${debug.li1.toFixed(2)}, j2: ${debug.li2.toFixed(2)}, j3: ${debug.li3.toFixed(2)} },
  lMiddle: { j1: ${debug.lm1.toFixed(2)}, j2: ${debug.lm2.toFixed(2)}, j3: ${debug.lm3.toFixed(2)} },
  lRing: { j1: ${debug.lr1.toFixed(2)}, j2: ${debug.lr2.toFixed(2)}, j3: ${debug.lr3.toFixed(2)} },
  lPinky: { j1: ${debug.lp1.toFixed(2)}, j2: ${debug.lp2.toFixed(2)}, j3: ${debug.lp3.toFixed(2)} }}`}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
            </motion.div>
        )}
        {currentSign && currentSign !== 'REST' ? (
          <motion.div
            key="sign-overlay"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`absolute ${previewMode ? 'top-1/2 left-4 -translate-y-1/2' : 'bottom-6'} bg-black/60 backdrop-blur-md px-6 py-2 rounded-2xl border border-purple-500/30 flex flex-col items-center min-w-[80px]`}
          >
            {currentWord && (
              <div className="text-xs font-bold text-slate-400 opacity-80 uppercase tracking-widest mb-0.5">
                {currentWord}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSign}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className={`font-black tracking-widest text-purple-300 ${previewMode ? 'text-xl' : 'text-3xl'}`}
              >
                {currentSign}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : !previewMode ? (
          <motion.p
            key="idle-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-6 text-sm text-slate-500 font-medium tracking-widest uppercase"
          >
            Awaiting Speech...
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

useGLTF.preload(AVATAR_URL);

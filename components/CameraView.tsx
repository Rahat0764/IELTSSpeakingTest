'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const FACEMESH_TESSELATION = [
  [127, 34], [34, 139], [139, 127], [11, 37], [37, 67], [67, 11],
  [232, 231], [231, 120], [120, 232], [72, 37], [37, 39], [39, 72],
  [128, 121], [121, 47], [47, 128], [114, 115], [115, 48], [48, 114],
  [108, 69], [69, 104], [104, 108], [33, 7], [7, 163], [163, 33],
  [128, 47], [47, 100], [100, 128], [100, 47], [47, 114], [114, 100],
  [104, 68], [68, 104], [69, 108], [108, 69], [151, 108], [108, 69],
  [69, 151], [108, 151], [151, 337], [337, 108], [337, 151], [151, 107],
  [107, 337], [336, 337], [337, 107], [107, 9], [9, 336], [107, 55],
  [55, 8], [8, 107], [8, 285], [285, 8], [55, 8], [8, 193], [193, 55],
  [55, 193], [193, 122], [122, 55], [55, 122], [122, 196], [196, 55],
  [55, 196], [196, 3], [3, 55], [55, 3], [3, 51], [51, 55], [55, 51],
  [51, 45], [45, 55], [55, 45], [45, 4], [4, 55], [55, 4], [4, 275],
  [275, 55], [55, 275], [275, 281], [281, 55], [55, 281], [281, 248],
  [248, 55], [55, 248], [248, 195], [195, 55], [55, 195], [195, 197],
  [197, 55], [55, 197], [197, 5], [5, 55], [55, 5], [5, 49], [49, 55],
  [55, 49], [49, 128], [128, 55], [55, 128], [128, 114], [114, 55],
];

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onExpressionUpdate: (expression: any) => void;
}

export default function CameraView({ videoRef, canvasRef, onExpressionUpdate }: Props) {
  const [cameraReady, setCameraReady] = useState(false);
  const meshCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setCameraReady(true);
          };
        }
      } catch (e) {
        console.error("Camera load failed");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      if (detections.length > 0) {
        const exp = detections[0].expressions;
        onExpressionUpdate({
          angry: exp.angry * 100,
          confident: 100 - exp.fearful * 100 - exp.sad * 50,
          nervous: exp.fearful * 80 + exp.surprised * 20,
          lying: (exp.disgusted + exp.fearful) * 50,
        });
      }
    }, 500);

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5 });
    faceMesh.onResults((results) => {
      // mesh drawing disabled in small view
    });
    faceMeshRef.current = faceMesh;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current! });
      },
      width: 320,
      height: 240,
    });
    camera.start();
    cameraRef.current = camera;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (cameraRef.current) { cameraRef.current.stop(); cameraRef.current = null; }
      if (faceMeshRef.current) { faceMeshRef.current.close(); faceMeshRef.current = null; }
    };
  }, [cameraReady]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-blue-500/30 bg-black">
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={meshCanvasRef} className="hidden" width={320} height={240} />
    </div>
  );
}
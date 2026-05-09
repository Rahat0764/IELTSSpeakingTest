'use client';
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onExpressionUpdate: (expression: any) => void;
}

export default function CameraView({ videoRef, canvasRef, onExpressionUpdate }: Props) {
  const [cameraReady, setCameraReady] = useState(false);
  const meshCanvasRef = useRef<HTMLCanvasElement>(null);

  // Start video after models load
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera access denied");
    }
  };

  useEffect(() => {
    // Load face-api models first
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        startVideo(); // start camera after models
      } catch (e) {
        console.error("Model load failed", e);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!cameraReady || !videoRef.current) return;

    // face-api expression detection every 500ms
    const interval = setInterval(async () => {
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

    // MediaPipe face mesh overlay
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
    });
    faceMesh.onResults((results) => {
      if (meshCanvasRef.current && results.multiFaceLandmarks.length > 0) {
        const canvasCtx = meshCanvasRef.current.getContext('2d');
        if (!canvasCtx) return;
        canvasCtx.clearRect(0, 0, meshCanvasRef.current.width, meshCanvasRef.current.height);
        drawConnectors(canvasCtx, results.multiFaceLandmarks[0], FaceMesh.FACEMESH_TESSELATION, { color: '#3b82f680', lineWidth: 1 });
        drawLandmarks(canvasCtx, results.multiFaceLandmarks[0], { color: '#3b82f6', lineWidth: 0.5 });
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current! });
      },
      width: 320,
      height: 240,
    });
    camera.start();

    return () => {
      clearInterval(interval);
      camera.stop();
    };
  }, [cameraReady]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-blue-500/20">
      <video ref={videoRef} className="w-full h-auto hidden" />
      <canvas ref={canvasRef} className="w-full h-auto hidden" />
      <canvas
        ref={meshCanvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={320}
        height={240}
      />
    </div>
  );
}
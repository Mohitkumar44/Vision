'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Upload, Play, Square, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  status: 'Present' | 'Not Present' | 'Error';
  explanation: string;
}

export default function ObjectTrackerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [baselineImage, setBaselineImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing webcam', err);
      addLog('Error', 'Failed to access webcam. Please ensure permissions are granted.');
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video internal resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const setLiveBaseline = () => {
    const frame = captureFrame();
    if (frame) setBaselineImage(frame);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBaselineImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addLog = (status: 'Present' | 'Not Present' | 'Error', explanation: string) => {
    setLogs((prev) => [{ timestamp: new Date().toISOString(), status, explanation }, ...prev]);
  };

  const analyzeFrame = useCallback(async () => {
    if (!baselineImage || !description || isAnalyzing) return;
    const currentFrame = captureFrame();
    if (!currentFrame) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baselineImage, currentFrame, description }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'API Error');
      }
      const data = await response.json();
      
      const status = data.present ? 'Present' : 'Not Present';
      addLog(status, data.explanation);
      
      // Draw bounding box
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          if (data.present && data.boundingBox) {
            const [ymin, xmin, ymax, xmax] = data.boundingBox;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            ctx.strokeRect((xmin/1000) * width, (ymin/1000) * height, ((xmax-xmin)/1000) * width, ((ymax-ymin)/1000) * height);
          }
        }
      }
    } catch (err: any) {
      addLog('Error', err.message || 'Failed to analyze frame');
      setIsTracking(false); // Stop tracking on error to prevent spam
    } finally {
      setIsAnalyzing(false);
    }
  }, [baselineImage, description, isAnalyzing]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(analyzeFrame, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isTracking, analyzeFrame]);

  const exportXML = () => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<logs>\n';
    const xmlEntries = logs.map(
      (log) => `  <log>\n    <timestamp>${log.timestamp}</timestamp>\n    <status>${log.status}</status>\n    <explanation><![CDATA[${log.explanation}]]></explanation>\n  </log>`
    ).join('\n');
    const xmlFooter = '\n</logs>';
    const xmlContent = xmlHeader + xmlEntries + xmlFooter;
    
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sentinel_vision_logs.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-primary flex items-center gap-2">
        <Camera className="w-8 h-8" /> Sentinel Vision
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-xl shadow-lg border relative">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Live Feed</h2>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video autoPlay playsInline ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <button onClick={startCamera} className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Start Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card p-4 rounded-xl shadow-lg border space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground">Configuration</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Object Description</label>
              <input 
                type="text" 
                placeholder="e.g. 'my red laptop'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isTracking}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {['Human', 'Mobile Phone', 'Book'].map(preset => (
                  <button 
                    key={preset}
                    onClick={() => setDescription(preset)}
                    disabled={isTracking}
                    className="text-xs bg-secondary/50 hover:bg-secondary text-secondary-foreground px-2 py-1 rounded border border-border disabled:opacity-50 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Baseline Image</label>
              <div className="flex gap-2">
                <button onClick={setLiveBaseline} disabled={!stream || isTracking} className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 disabled:opacity-50 flex justify-center items-center gap-2">
                  <Camera className="w-4 h-4" /> Capture Live
                </button>
                <label className={`flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md cursor-pointer flex justify-center items-center gap-2 text-center ${isTracking ? 'opacity-50 pointer-events-none' : 'hover:bg-secondary/80'}`}>
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isTracking} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex flex-col h-full">
          <div className="bg-card p-4 rounded-xl shadow-lg border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Tracking Controls</h2>
            {baselineImage && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Current Baseline:</p>
                <img src={baselineImage} alt="Baseline" className="w-32 h-32 object-cover rounded-md border" />
              </div>
            )}
            
            <button 
              onClick={() => setIsTracking(!isTracking)}
              disabled={!description || !stream}
              className={`w-full py-3 rounded-md font-bold flex justify-center items-center gap-2 transition-colors ${
                isTracking ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              } disabled:opacity-50`}
            >
              {isTracking ? <><Square className="w-5 h-5 fill-current" /> Stop Tracking</> : <><Play className="w-5 h-5 fill-current" /> Start Tracking</>}
            </button>
          </div>

          <div className="bg-card p-4 rounded-xl shadow-lg border flex-1 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">Event Log</h2>
              <button onClick={exportXML} disabled={logs.length === 0} className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-50">
                <Download className="w-4 h-4" /> Export XML
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No events logged yet.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-background text-sm flex gap-3 items-start">
                    {log.status === 'Present' ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <AlertCircle className="w-5 h-5 text-destructive shrink-0" />}
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                         <span className={`font-bold ${log.status === 'Present' ? 'text-green-500' : 'text-destructive'}`}>{log.status}</span>
                         <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-muted-foreground leading-tight">{log.explanation}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

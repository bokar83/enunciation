"use client";
import React, { useRef, useState, useEffect } from "react";

export default function RecordingPage() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingLength, setRecordingLength] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startRecording = async () => {
    setAudioUrl(null);
    setRecordingLength(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      startTimeRef.current = Date.now();

      // Web Audio API for amplitude bar
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i] - 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length) / 128;
        setAmplitude(rms);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        setRecordingLength(startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : null);
        setAmplitude(0);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError("Sorry, I couldn't catch that. Try again.");
      setRecording(false);
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } catch {
      setError("Sorry, I couldn't catch that. Try again.");
      setRecording(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">🎙️ Enunciation Coach: Recording</h1>
      <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`w-full py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${
            recording ? "bg-red-500" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
        {recording && (
          <div className="w-full h-8 flex items-center justify-center">
            <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-4 bg-green-500 transition-all duration-75"
                style={{ width: `${Math.max(10, amplitude * 100)}%` }}
              />
            </div>
            <span className="text-xs text-cyan-600 ml-2">Recording...</span>
          </div>
        )}
        {audioUrl && (
          <div className="w-full flex flex-col items-center mt-4">
            <audio controls src={audioUrl} className="w-full" />
            {recordingLength !== null && (
              <span className="text-xs text-gray-500 mt-1">Length: {recordingLength} second{recordingLength === 1 ? "" : "s"}</span>
            )}
          </div>
        )}
        {error && (
          <div className="w-full text-center text-red-500 font-semibold mt-2">{error}</div>
        )}
      </div>
    </main>
  );
} 
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
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const historyRef = useRef<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const drills = [
    { key: 'repeat', label: 'Repeat-after-me', prompt: 'The quick brown fox jumps over the lazy dog.' },
    { key: 'slow', label: 'Slow Reading', prompt: 'Speak this sentence slowly and clearly for best results.' },
  ];
  const [selectedDrill, setSelectedDrill] = useState(drills[0]);

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

  const sendForAnalysis = async (audioUrl: string) => {
    setLoading(true);
    setTranscript(null);
    setFeedback(null);
    setError(null);
    try {
      // Convert audioUrl to Blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      // Send to API endpoint
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const apiRes = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!apiRes.ok) throw new Error("API error");
      const data = await apiRes.json();
      setTranscript(data.transcript);
      setFeedback(data.feedback);
      // Add to history
      const entry = {
        date: new Date().toLocaleTimeString(),
        transcript: data.transcript,
        feedback: data.feedback,
        scores: { pace: 7.5, clarity: 8.2, confidence: 7.9 }, // placeholder
      };
      historyRef.current = [entry, ...historyRef.current];
      setHistory([...historyRef.current]);
    } catch (err) {
      setError("Sorry, something went wrong with analysis. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl) {
      sendForAnalysis(audioUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

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
      {/* Drill selection */}
      <div className="w-full max-w-xs mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-700">Choose a Drill:</label>
        <select
          className="w-full p-2 rounded border border-gray-300"
          value={selectedDrill.key}
          onChange={e => {
            const drill = drills.find(d => d.key === e.target.value);
            if (drill) setSelectedDrill(drill);
          }}
        >
          {drills.map(drill => (
            <option key={drill.key} value={drill.key}>{drill.label}</option>
          ))}
        </select>
        <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800 text-sm">{selectedDrill.prompt}</div>
      </div>
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
        {loading && (
          <div className="w-full flex flex-col items-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
            <span className="text-blue-600">Analyzing your recording...</span>
          </div>
        )}
        {transcript && (
          <div className="w-full flex flex-col items-center mt-4 p-3 bg-gray-100 rounded">
            <div className="font-semibold text-gray-700 mb-1">Transcript</div>
            <div className="text-sm text-gray-800 mb-2">{transcript}</div>
            <div className="font-semibold text-gray-700 mb-1">AI Feedback</div>
            <div className="text-sm text-green-700">{feedback}</div>
            <div className="w-full flex flex-col items-center mt-4">
              <div className="flex justify-between w-full max-w-xs mb-2">
                <div className="flex flex-col items-center">
                  <span className="text-2xl">⏱️</span>
                  <span className="font-bold text-lg">Pace</span>
                  <span className="text-blue-600 font-semibold">7.5/10</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl">🔊</span>
                  <span className="font-bold text-lg">Clarity</span>
                  <span className="text-blue-600 font-semibold">8.2/10</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl">💪</span>
                  <span className="font-bold text-lg">Confidence</span>
                  <span className="text-blue-600 font-semibold">7.9/10</span>
                </div>
              </div>
              <div className="text-center text-green-700 font-semibold mt-2">Great job! Keep practicing for even clearer speech. 🎉</div>
            </div>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                setAudioUrl(null);
                setTranscript(null);
                setFeedback(null);
                setRecordingLength(null);
                setAmplitude(0);
                setError(null);
              }}
            >
              Retry / Improve
            </button>
          </div>
        )}
        {error && (
          <div className="w-full text-center text-red-500 font-semibold mt-2">{error}</div>
        )}
        {history.length > 0 && (
          <div className="w-full max-w-xs mx-auto mt-8 bg-white rounded shadow p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700">Session History</span>
              <button
                className="text-xs text-red-500 underline"
                onClick={() => { historyRef.current = []; setHistory([]); }}
              >Clear</button>
            </div>
            <ul className="divide-y divide-gray-200">
              {history.map((h, i) => (
                <li key={i} className="py-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{h.date}</span>
                    <span>Pace: {h.scores.pace} | Clarity: {h.scores.clarity} | Conf: {h.scores.confidence}</span>
                  </div>
                  <div className="text-xs text-gray-700 mb-1">{h.transcript}</div>
                  <div className="text-xs text-green-700">{h.feedback}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
} 
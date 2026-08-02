import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Upload,
  FileAudio,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  History,
  Download,
  RefreshCw,
  Search,
  ArrowRight,
  FolderOpen,
  ShieldCheck,
  ChevronRight,
  X,
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Pencil,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("workspace"); // 'workspace' | 'history'
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("summary"); // 'summary' | 'transcript'

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordingName, setRecordingName] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimeRef = useRef(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    recordingTimeRef.current = recordingTime;
  }, [recordingTime]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/meetings`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch meeting history:", err);
    }
  };

  // --- Recording functions ---
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const generateRecordingFilename = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `Recording_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.webm`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setRecordedDuration(recordingTimeRef.current);
        // Set default editable filename (without extension for cleaner editing)
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        setRecordingName(`Recording_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`);
        // Stop all tracks to release mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // collect data every second

      setIsRecording(true);
      setIsPaused(false);
      setRecordedBlob(null);
      setRecordingTime(0);
      setFile(null); // clear any uploaded file

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone permission and try again.');
      console.error('Mic access error:', err);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  }, []);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setRecordedDuration(0);
    setRecordingName("");
    chunksRef.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const hasAudio = file || recordedBlob;

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!hasAudio) return;

    setLoading(true);
    const formData = new FormData();

    if (recordedBlob) {
      // Wrap the recorded blob as a File object using the user-editable name
      const finalName = (recordingName.trim() || 'Recording') + '.webm';
      const recordingFile = new File([recordedBlob], finalName, {
        type: 'audio/webm',
      });
      formData.append("file", recordingFile);
    } else {
      formData.append("file", file);
    }
    formData.append("language", language);

    try {
      const res = await axios.post(`${API_BASE}/meetings/process`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10-minute timeout for local AI processing
      });

      setActiveMeeting(res.data);
      fetchHistory();
      setFile(null);
      setRecordedBlob(null);
      setRecordingTime(0);
      setRecordedDuration(0);
      setRecordingName("");
      setCurrentScreen("workspace");
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        alert("Request timed out while waiting for local AI processing.");
      } else {
        alert(
          "Error processing audio: " +
            (err.response?.data?.detail || err.message),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeMeeting) return;

    const summary = activeMeeting.summary;

    let content = `
# Meeting Summary: ${activeMeeting.filename}
**Date:** ${new Date(activeMeeting.created_at || Date.now()).toLocaleString()}  
**Language:** ${activeMeeting.language.toUpperCase()}

---

## Executive Summary
${summary?.executive_summary || "N/A"}

## Key Discussion Points
${Array.isArray(summary?.key_discussion_points) && summary.key_discussion_points.length > 0 ? summary.key_discussion_points.map((p) => `- ${p}`).join("\n") : "None"}

## Action Items
${Array.isArray(summary?.action_items) && summary.action_items.length > 0 ? summary.action_items.map((item) => `- [ ] ${item}`).join("\n") : "None"}

## Decisions Taken
${Array.isArray(summary?.decisions_taken) && summary.decisions_taken.length > 0 ? summary.decisions_taken.map((d) => `- ${d}`).join("\n") : "None"}

## Pending Issues
${Array.isArray(summary?.pending_issues) && summary.pending_issues.length > 0 ? summary.pending_issues.map((p) => `- ${p}`).join("\n") : "None"}

## Participants Mentioned
${Array.isArray(summary?.participants_mentioned) && summary.participants_mentioned.length > 0 ? summary.participants_mentioned.map((p) => `- ${p}`).join("\n") : "None detected"}

## Meeting Tone
${summary?.meeting_tone || "Not assessed"}

## Follow-up Needed
${Array.isArray(summary?.follow_up_needed) && summary.follow_up_needed.length > 0 ? summary.follow_up_needed.map((f) => `- ${f}`).join("\n") : "None"}

---

### Full Transcript
${activeMeeting.transcript}
    `.trim();

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeMeeting.filename}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMeeting = async (e, meetingId) => {
    e.stopPropagation(); // prevent card click from opening the meeting
    if (!confirm("Are you sure you want to delete this meeting? This cannot be undone.")) return;

    try {
      await axios.delete(`${API_BASE}/meetings/${meetingId}`);
      // If the deleted meeting is currently active, clear it
      if (activeMeeting && activeMeeting.id === meetingId) {
        setActiveMeeting(null);
      }
      fetchHistory();
    } catch (err) {
      alert("Failed to delete meeting: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredHistory = history.filter((m) =>
    m.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30">
      {/* Navbar Header */}
      <header className="border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between h-16">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-tight whitespace-nowrap">
              AI Meeting Summarizer
            </span>
            <span className="text-[10px] text-slate-400 block font-normal">
              Faster-Whisper & Qwen 2.5
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#111927] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentScreen("workspace")}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              currentScreen === "workspace"
                ? "bg-teal-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Workspace
          </button>

          <button
            onClick={() => {
              setCurrentScreen("history");
              fetchHistory();
            }}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              currentScreen === "history"
                ? "bg-teal-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Previous Meetings (
            {history.length})
          </button>
        </div>

        {/* Offline Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Offline</span>
        </div>
      </header>

      {/* SCREEN 1: WORKSPACE */}
      {currentScreen === "workspace" && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-6">
          {/* Upload Area */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Upload Audio Recording
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Process local audio into structured summaries and speech
                    transcripts
                  </p>
                </div>
              </div>

              {activeMeeting && (
                <button
                  onClick={() => setActiveMeeting(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
                >
                  <X className="w-3 h-3" /> Clear Active
                </button>
              )}
            </div>

            <form onSubmit={handleProcess} className="space-y-4">
              {/* Dual-input area: File picker OR Record */}
              {!isRecording && !recordedBlob ? (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
                  {/* File Drop Box */}
                  <div className="border border-dashed border-slate-700 hover:border-teal-500/80 rounded-xl p-4 text-center cursor-pointer transition-all bg-[#0b101b] relative group">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => { setFile(e.target.files[0]); setRecordedBlob(null); }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-teal-500/10 flex items-center justify-center transition-colors">
                        <FileAudio className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
                          {file ? file.name : "Choose audio file or drop here"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          MP3, WAV, M4A, AAC (Max 500MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OR Divider */}
                  {!file && (
                    <>
                      <div className="flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">or</span>
                      </div>

                      {/* Record Button */}
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2.5 bg-[#0b101b] hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 rounded-xl px-5 py-4 transition-all group/rec cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-500/10 group-hover/rec:bg-red-500/20 border border-red-500/30 flex items-center justify-center transition-colors">
                          <Mic className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-medium text-slate-200">Record Meeting</p>
                          <p className="text-[10px] text-slate-500">Use microphone</p>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              ) : isRecording ? (
                /* Recording in progress */
                <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-red-500 ${!isPaused ? 'recording-pulse' : ''}`} />
                      <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                        {isPaused ? 'Paused' : 'Recording...'}
                      </span>
                      <span className="text-sm font-mono text-slate-200 tabular-nums">
                        {formatTime(recordingTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPaused ? (
                        <button
                          type="button"
                          onClick={pauseRecording}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={resumeRecording}
                          className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" /> Resume
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" /> Stop
                      </button>
                    </div>
                  </div>

                  {/* Waveform animation */}
                  <div className="flex items-center justify-center gap-[3px] h-8">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div
                        key={i}
                        className={`waveform-bar w-[3px] rounded-full ${isPaused ? 'bg-slate-600' : 'bg-red-400/70'}`}
                        style={{
                          animationDelay: `${i * 0.05}s`,
                          animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : recordedBlob ? (
                /* Recording complete */
                <div className="border border-teal-500/30 bg-teal-500/5 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                        <FileAudio className="w-4 h-4 text-teal-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={recordingName}
                            onChange={(e) => setRecordingName(e.target.value)}
                            className="text-xs font-medium text-slate-200 bg-transparent border-b border-dashed border-slate-600 focus:border-teal-500 outline-none py-0.5 w-56 transition-colors"
                            placeholder="Enter recording name..."
                          />
                          <span className="text-[10px] text-slate-500">.webm</span>
                          <Pencil className="w-3 h-3 text-slate-500" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatTime(recordedDuration)} • {(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-400 bg-slate-800/60 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Discard
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Language selector + Submit — always visible when not recording */}
              {!isRecording && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Audio Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-[#0b101b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option value="en">English Track</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="as">Assamese (অসমীয়া)</option>
                    </select>
                  </div>

                  <div className="flex items-end h-full">
                    <button
                      type="submit"
                      disabled={!hasAudio || loading}
                      className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs shadow mt-4 md:mt-0"
                    >
                      {loading ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <span>Summarize Meeting</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ACTIVE SUMMARY WORKSPACE DISPLAY */}
          {activeMeeting ? (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
              {/* Meeting Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {activeMeeting.filename}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded font-mono font-medium uppercase">
                      Lang: {activeMeeting.language}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      •{" "}
                      {activeMeeting.created_at
                        ? new Date(activeMeeting.created_at).toLocaleString()
                        : "Just now"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMarkdown}
                    className="bg-[#0b101b] hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" /> Export
                    (.md)
                  </button>

                  <div className="flex bg-[#0b101b] p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setActiveTab("summary")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        activeTab === "summary"
                          ? "bg-teal-500 text-slate-950 font-semibold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveTab("transcript")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        activeTab === "transcript"
                          ? "bg-teal-500 text-slate-950 font-semibold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Transcript
                    </button>
                  </div>
                </div>
              </div>

              {/* SUMMARY VIEW (Bilingual Supported) */}
              {activeTab === "summary" ? (
                <div className="space-y-4">
                  {/* Executive Summary */}
                  <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-teal-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Executive Summary
                      </span>
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {activeMeeting.summary?.executive_summary ||
                        "No executive summary extracted."}
                    </p>
                  </div>

                  {/* Discussion Points & Action Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Discussion Points */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                        Key Discussion Points
                      </h3>
                      <ul className="space-y-2.5">
                        {Array.isArray(activeMeeting.summary?.key_discussion_points) && activeMeeting.summary.key_discussion_points.length > 0 ? (
                          activeMeeting.summary.key_discussion_points.map((pt, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <span className="text-cyan-400 font-bold">
                                  •
                                </span>
                                <span className="leading-relaxed">{String(pt)}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-500">None</li>
                        )}
                      </ul>
                    </div>

                    {/* Action Items */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                        Action Items
                      </h3>
                      <ul className="space-y-2.5">
                        {Array.isArray(activeMeeting.summary?.action_items) && activeMeeting.summary.action_items.length > 0 ? (
                          activeMeeting.summary.action_items.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{String(item)}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-500">None</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Decisions & Pending Issues Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Decisions Taken */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">
                        Decisions Taken
                      </h3>
                      <ul className="space-y-2.5">
                        {Array.isArray(activeMeeting.summary?.decisions_taken) && activeMeeting.summary.decisions_taken.length > 0 ? (
                          activeMeeting.summary.decisions_taken.map((dec, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <span className="text-indigo-400 font-bold">✓</span>
                                <span className="leading-relaxed">{String(dec)}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-500">None</li>
                        )}
                      </ul>
                    </div>

                    {/* Pending Issues */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-rose-400 mb-2 uppercase tracking-wider">
                        Pending Issues / Risks
                      </h3>
                      <ul className="space-y-2.5">
                        {Array.isArray(activeMeeting.summary?.pending_issues) && activeMeeting.summary.pending_issues.length > 0 ? (
                          activeMeeting.summary.pending_issues.map((iss, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{String(iss)}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-500">None</li>
                        )}
                      </ul>
                    </div>
                  </div>
                                    {/* Participants & Tone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Participants Mentioned */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-violet-400 mb-2 uppercase tracking-wider">
                        Participants Mentioned
                      </h3>
                      <ul className="space-y-1.5">
                        {Array.isArray(activeMeeting.summary?.participants_mentioned) && activeMeeting.summary.participants_mentioned.length > 0 ? (
                          activeMeeting.summary.participants_mentioned.map((person, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] text-violet-400 font-bold shrink-0">
                                {typeof person === 'string' && person ? person.charAt(0).toUpperCase() : '?'}
                              </span>
                              <span className="leading-relaxed truncate">{String(person)}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-500">None detected</li>
                        )}
                      </ul>
                    </div>

                    {/* Meeting Tone */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
                        Meeting Tone
                      </h3>
                      {activeMeeting.summary?.meeting_tone ? (
                        <span className="inline-block text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-lg font-medium">
                          {activeMeeting.summary.meeting_tone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Not assessed</span>
                      )}
                    </div>
                  </div>

                  {/* Follow-up Needed */}
                  <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-orange-400 mb-2 uppercase tracking-wider">
                      Follow-up Needed
                    </h3>
                    <ul className="space-y-2.5">
                      {Array.isArray(activeMeeting.summary?.follow_up_needed) && activeMeeting.summary.follow_up_needed.length > 0 ? (
                        activeMeeting.summary.follow_up_needed.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-300">
                            <div className="flex items-start gap-2">
                              <span className="text-orange-400 font-bold">→</span>
                              <span className="leading-relaxed">{String(item)}</span>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-slate-500">None</li>
                      )}
                    </ul>
                  </div>

                </div>
              ) : (
                /* TRANSCRIPT VIEW */
                <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 max-h-[450px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-semibold uppercase">
                    <FileText className="w-3.5 h-3.5 text-teal-400" /> Speech
                    Transcript
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {activeMeeting.transcript || "No transcript data."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111827]/30 border border-slate-800/80 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center text-slate-500">
              <FolderOpen className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
              <p className="text-xs text-slate-400 font-medium">
                No meeting selected
              </p>
              <p className="text-[11px] text-slate-500">
                Upload an audio recording, record a live meeting, or open a
                past meeting from history.
              </p>
            </div>
          )}
        </main>
      )}

      {/* SCREEN 2: PREVIOUS MEETINGS HISTORY SCREEN */}
      {currentScreen === "history" && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-teal-400" /> Saved Meeting
                History
              </h2>
              <p className="text-xs text-slate-400">
                Review all previously transcribed and summarized recordings
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search meeting..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                onClick={fetchHistory}
                className="p-1.5 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="Refresh history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 bg-[#111827]/40 border border-slate-800/80 rounded-xl text-slate-500 text-xs">
              No meetings found in database.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setActiveMeeting(m);
                    setCurrentScreen("workspace");
                  }}
                  className="bg-[#111827] border border-slate-800 hover:border-teal-500/60 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                        {m.language}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleDateString()
                          : "Saved"}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-100 group-hover:text-teal-400 transition-colors truncate mb-1.5">
                      {m.filename}
                    </h3>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {m.summary?.executive_summary ||
                        "Click to inspect meeting details..."}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-medium">
                    <span className="text-teal-400">Open Summary</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteMeeting(e, m.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

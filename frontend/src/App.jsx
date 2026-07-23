import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/meetings`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch meeting history:", err);
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    try {
      const res = await axios.post(`${API_BASE}/meetings/process`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10-minute timeout for local AI processing
      });

      setActiveMeeting(res.data);
      fetchHistory();
      setFile(null);
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
    const summaryEn = summary?.summary_en;

    let content = `
# Meeting Summary: ${activeMeeting.filename}
**Date:** ${new Date(activeMeeting.created_at || Date.now()).toLocaleString()}  
**Language:** ${activeMeeting.language.toUpperCase()}

---

## Executive Summary
${summary?.executive_summary || "N/A"}
${summaryEn?.executive_summary ? `\n*(English Translation)*:\n${summaryEn.executive_summary}` : ""}

## Key Discussion Points
${summary?.key_discussion_points?.map((p, i) => `- ${p}${summaryEn?.key_discussion_points?.[i] ? `\n  *(En: ${summaryEn.key_discussion_points[i]})*` : ""}`).join("\n") || "None"}

## Action Items
${summary?.action_items?.map((item, i) => `- [ ] ${item}${summaryEn?.action_items?.[i] ? `\n  *(En: ${summaryEn.action_items[i]})*` : ""}`).join("\n") || "None"}

## Decisions Taken
${summary?.decisions_taken?.map((d, i) => `- ${d}${summaryEn?.decisions_taken?.[i] ? `\n  *(En: ${summaryEn.decisions_taken[i]})*` : ""}`).join("\n") || "None"}

## Pending Issues
${summary?.pending_issues?.map((p, i) => `- ${p}${summaryEn?.pending_issues?.[i] ? `\n  *(En: ${summaryEn.pending_issues[i]})*` : ""}`).join("\n") || "None"}

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
              Faster-Whisper & Llama 3.1
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
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                {/* File Drop Box */}
                <div className="md:col-span-2 border border-dashed border-slate-700 hover:border-teal-500/80 rounded-xl p-4 text-center cursor-pointer transition-all bg-[#0b101b] relative group">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFile(e.target.files[0])}
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

                {/* Select & Submit Controls */}
                <div className="space-y-2">
                  <div>
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

                  <button
                    type="submit"
                    disabled={!file || loading}
                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs shadow"
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
                      {activeMeeting.summary?.summary_en && (
                        <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded font-mono font-medium">
                          Bilingual View
                        </span>
                      )}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {activeMeeting.summary?.executive_summary ||
                        "No executive summary extracted."}
                    </p>

                    {/* English Translation Overlay for Non-English Audio */}
                    {activeMeeting.summary?.summary_en?.executive_summary && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">
                          English Translation:
                        </span>
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{activeMeeting.summary.summary_en.executive_summary}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Discussion Points & Action Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Discussion Points */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                        Key Discussion Points
                      </h3>
                      <ul className="space-y-2.5">
                        {activeMeeting.summary?.key_discussion_points?.map(
                          (pt, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <span className="text-cyan-400 font-bold">
                                  •
                                </span>
                                <span className="leading-relaxed">{pt}</span>
                              </div>
                              {activeMeeting.summary?.summary_en
                                ?.key_discussion_points?.[idx] && (
                                <p className="text-[11px] text-slate-400 italic pl-3.5 mt-0.5">
                                  ↳{" "}
                                  {
                                    activeMeeting.summary.summary_en
                                      .key_discussion_points[idx]
                                  }
                                </p>
                              )}
                            </li>
                          ),
                        ) || <li className="text-xs text-slate-500">None</li>}
                      </ul>
                    </div>

                    {/* Action Items */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">
                        Action Items
                      </h3>
                      <ul className="space-y-2.5">
                        {activeMeeting.summary?.action_items?.map(
                          (item, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{item}</span>
                              </div>
                              {activeMeeting.summary?.summary_en
                                ?.action_items?.[idx] && (
                                <p className="text-[11px] text-slate-400 italic pl-5 mt-0.5">
                                  ↳{" "}
                                  {
                                    activeMeeting.summary.summary_en
                                      .action_items[idx]
                                  }
                                </p>
                              )}
                            </li>
                          ),
                        ) || <li className="text-xs text-slate-500">None</li>}
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
                        {activeMeeting.summary?.decisions_taken?.map(
                          (dec, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <span className="text-indigo-400 font-bold">
                                  ✓
                                </span>
                                <span className="leading-relaxed">{dec}</span>
                              </div>
                              {activeMeeting.summary?.summary_en
                                ?.decisions_taken?.[idx] && (
                                <p className="text-[11px] text-slate-400 italic pl-3.5 mt-0.5">
                                  ↳{" "}
                                  {
                                    activeMeeting.summary.summary_en
                                      .decisions_taken[idx]
                                  }
                                </p>
                              )}
                            </li>
                          ),
                        ) || <li className="text-xs text-slate-500">None</li>}
                      </ul>
                    </div>

                    {/* Pending Issues */}
                    <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-rose-400 mb-2 uppercase tracking-wider">
                        Pending Issues / Risks
                      </h3>
                      <ul className="space-y-2.5">
                        {activeMeeting.summary?.pending_issues?.map(
                          (iss, idx) => (
                            <li key={idx} className="text-xs text-slate-300">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{iss}</span>
                              </div>
                              {activeMeeting.summary?.summary_en
                                ?.pending_issues?.[idx] && (
                                <p className="text-[11px] text-slate-400 italic pl-5 mt-0.5">
                                  ↳{" "}
                                  {
                                    activeMeeting.summary.summary_en
                                      .pending_issues[idx]
                                  }
                                </p>
                              )}
                            </li>
                          ),
                        ) || <li className="text-xs text-slate-500">None</li>}
                      </ul>
                    </div>
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
                Upload an audio recording above or open a past meeting from
                history.
              </p>
            </div>
          )}
        </main>
      )}

      {/* SCREEN 2: PREVIOUS MEETINGS HISTORY SCREEN */}
      {currentScreen === "history" && (
        <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-5">
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

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-teal-400 font-medium">
                    <span>Open Summary</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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

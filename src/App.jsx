import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowRight, Baby, Bell, CalendarDays, CalendarPlus, Check, ClipboardCheck,
  Clock3, FileText, FolderOpen, Headphones, LayoutDashboard, Languages, ListChecks,
  MessageCircle, Mic, Paperclip, Phone, PhoneCall, Plus, Search, Send, Settings,
  ShieldCheck, Sparkles, Stethoscope, Upload, UserRound, UsersRound, Volume2, X
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const ROLE_META = {
  Doctor: { tone: "doctor", label: "Care team workspace", description: "Review operational work, coordinate patients and close care-loop handoffs." },
  Frontline: { tone: "frontline", label: "Frontline workspace", description: "Resolve stalled follow-ups, contact patients and capture operational outcomes." },
  Patient: { tone: "patient", label: "My care journey", description: "See appointments, pregnancy journey, documents and requests in one simple place." },
  Admin: { tone: "admin", label: "Care operations", description: "Monitor workflow health, handoffs, documents and governance." }
};

const INITIAL_PATIENTS = [
  { id: "MC-1042", name: "Asha Kulkarni", age: 27, week: 28, language: "Marathi", status: "On track", initials: "AK", next: "ANC contact", nextDate: "14 Oct · 10:00 AM", accent: "green" },
  { id: "MC-1037", name: "Meena Patil", age: 31, week: 34, language: "Hindi", status: "Needs follow-up", initials: "MP", next: "Report review", nextDate: "Due today", accent: "amber" },
  { id: "MC-1029", name: "Pooja Shaikh", age: 24, week: 20, language: "Hindi", status: "Appointment missed", initials: "PS", next: "Reschedule", nextDate: "2 days ago", accent: "rose" }
];

const INITIAL_TASKS = [
  { id: "task-001", patient: "Pooja Shaikh", patientId: "MC-1029", title: "Appointment missed", detail: "Patient has not confirmed a new slot", status: "MISSED", priority: "HIGH", assignee: "Frontline", due: "Today", channel: "IVR / Voice" },
  { id: "task-002", patient: "Meena Patil", patientId: "MC-1037", title: "Report received", detail: "Document is ready for review", status: "PENDING", priority: "NORMAL", assignee: "Doctor", due: "Today", channel: "In-app" },
  { id: "task-003", patient: "Asha Kulkarni", patientId: "MC-1042", title: "Appointment confirmed", detail: "14 Oct · 10:00 AM", status: "COMPLETED", priority: "NORMAL", assignee: "Doctor", due: "14 Oct", channel: "WhatsApp" }
];

const INITIAL_APPOINTMENTS = [
  { id: "apt-001", patientId: "MC-1042", patient: "Asha Kulkarni", date: "14 Oct 2026", time: "10:00 AM", type: "ANC contact", status: "CONFIRMED", createdBy: "Doctor" },
  { id: "apt-002", patientId: "MC-1029", patient: "Pooja Shaikh", date: "01 Oct 2026", time: "11:30 AM", type: "Follow-up", status: "MISSED", createdBy: "Doctor" }
];

const INITIAL_MESSAGES = [
  { id: "msg-001", patient: "Asha Kulkarni", patientId: "MC-1042", language: "Marathi", channel: "WhatsApp", text: "नमस्कार आशा, तुमची पुढील भेट १४ ऑक्टोबर रोजी सकाळी १० वाजता आहे.", status: "READY" }
];

const INITIAL_DOCS = [
  { id: "doc-1", patientId: "MC-1042", name: "ANC_visit_note.pdf", type: "Care note", date: "04 Oct 2026", owner: "Doctor" },
  { id: "doc-2", patientId: "MC-1037", name: "USG_report_demo.pdf", type: "USG / scan", date: "02 Oct 2026", owner: "Patient" },
  { id: "doc-3", patientId: "MC-1037", name: "CBC_demo.pdf", type: "Lab report", date: "02 Oct 2026", owner: "Lab" }
];

const TIMELINES = {
  "MC-1042": [["04 Oct", "ANC contact", "Completed", "done"], ["09 Oct", "Investigation", "Task created", "active"], ["12 Oct", "Report upload", "Awaiting document", "pending"], ["14 Oct", "Doctor review", "Scheduled", "pending"], ["17 Oct", "Follow-up", "Scheduled", "pending"]],
  "MC-1037": [["01 Oct", "ANC contact", "Completed", "done"], ["02 Oct", "Report upload", "Received", "done"], ["03 Oct", "Doctor review", "Due today", "active"], ["07 Oct", "Follow-up", "Scheduled", "pending"]],
  "MC-1029": [["20 Sep", "ANC contact", "Completed", "done"], ["01 Oct", "Follow-up", "Missed", "missed"], ["03 Oct", "Patient contact", "Frontline queue", "active"], ["05 Oct", "Reschedule", "Pending", "pending"]]
};

const STATUS_TONE = { PENDING: "amber", SCHEDULED: "blue", IN_PROGRESS: "blue", COMPLETED: "green", MISSED: "rose", CANCELLED: "neutral", ESCALATED: "rose", CONFIRMED: "green", READY: "blue", SENT: "green" };

function StatusPill({ children, tone = "neutral" }) { return <span className={`pill pill-${tone}`}>{children}</span>; }
function Avatar({ initials, size = "md", tone = "sage" }) { return <div className={`avatar avatar-${size} avatar-${tone}`}>{initials}</div>; }
function Metric({ label, value, detail, tone = "blue" }) { return <div className="metric-card"><div className={`metric-dot ${tone}`} /><div><span>{label}</span><strong>{value}</strong></div><small>{detail}</small></div>; }
function Modal({ title, kicker, children, onClose, wide = false }) { return <div className="modal-backdrop" onClick={onClose}><div className={`modal ${wide ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button>{kicker && <div className="section-kicker">{kicker}</div>}<h2>{title}</h2>{children}</div></div>; }

function App() {
  const [role, setRole] = useState("Doctor");
  const [activeNav, setActiveNav] = useState("Overview");
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState("MC-1042");
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [documents, setDocuments] = useState(INITIAL_DOCS);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [language, setLanguage] = useState("Marathi");
  const [voiceCaptured, setVoiceCaptured] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceLanguageCode, setVoiceLanguageCode] = useState("");
  const [voiceEvent, setVoiceEvent] = useState(null);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [translation, setTranslation] = useState("");
  const [translationProcessing, setTranslationProcessing] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audit, setAudit] = useState([{ time: "10:42", actor: "Doctor", action: "Opened Asha's care journey" }]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const meta = ROLE_META[role];
  const openTasks = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const dueToday = tasks.filter((t) => t.due === "Today" && t.status !== "COMPLETED");
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const scans = documents.filter((d) => d.type.toLowerCase().includes("usg") || d.type.toLowerCase().includes("scan")).length;

  useEffect(() => {
    const saved = localStorage.getItem("maatriloop-demo-v04");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.patients) setPatients(data.patients);
      if (data.tasks) setTasks(data.tasks);
      if (data.appointments) setAppointments(data.appointments);
      if (data.messages) setMessages(data.messages);
      if (data.documents) setDocuments(data.documents);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("maatriloop-demo-v04", JSON.stringify({ patients, tasks, appointments, messages, documents }));
  }, [patients, tasks, appointments, messages, documents]);

  const notify = (message) => { setToast(message); window.clearTimeout(window.__mlToast); window.__mlToast = window.setTimeout(() => setToast(""), 2600); };
  const addAudit = (action, actor = role) => setAudit((items) => [{ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), actor, action }, ...items].slice(0, 12));

  const updateTask = (id, patch, auditText) => {
    setTasks((items) => items.map((t) => t.id === id ? { ...t, ...patch } : t));
    if (auditText) addAudit(auditText);
  };

  const createAppointment = ({ patientId, date, time, type }) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;
    const now = Date.now();
    const appointment = { id: `apt-${now}`, patientId, patient: patient.name, date, time, type, status: "SCHEDULED", createdBy: role };
    setAppointments((items) => [appointment, ...items]);
    setTasks((items) => [{ id: `task-${now}`, patient: patient.name, patientId, title: "Appointment confirmation", detail: `${date} · ${time}`, status: "SCHEDULED", priority: "NORMAL", assignee: "Patient", due: "Today", channel: "WhatsApp" }, ...items]);
    addAudit(`Created appointment for ${patient.name}`);
    notify(`Appointment created · ${patient.name} now has a confirmation task`);
    setSelectedPatientId(patientId); setModal(null);
  };

  const confirmAppointment = (appointmentId) => {
    const apt = appointments.find((a) => a.id === appointmentId); if (!apt) return;
    setAppointments((items) => items.map((a) => a.id === appointmentId ? { ...a, status: "CONFIRMED" } : a));
    const matching = tasks.find((t) => t.patientId === apt.patientId && t.title === "Appointment confirmation" && t.status !== "COMPLETED");
    if (matching) updateTask(matching.id, { status: "COMPLETED", completedAt: new Date().toISOString() }, `Appointment confirmed for ${apt.patient}`);
    else addAudit(`Appointment confirmed for ${apt.patient}`, "Patient");
    setPatients((items) => items.map((p) => p.id === apt.patientId ? { ...p, status: "On track" } : p));
    notify(`Confirmed · ${apt.patient}'s care loop updated`);
  };

  const markMissed = (appointmentId) => {
    const apt = appointments.find((a) => a.id === appointmentId); if (!apt) return;
    setAppointments((items) => items.map((a) => a.id === appointmentId ? { ...a, status: "MISSED" } : a));
    setTasks((items) => [{ id: `task-${Date.now()}`, patient: apt.patient, patientId: apt.patientId, title: "Appointment missed", detail: "No confirmation recorded after scheduled time", status: "MISSED", priority: "HIGH", assignee: "Frontline", due: "Today", channel: "IVR / Voice" }, ...items]);
    setPatients((items) => items.map((p) => p.id === apt.patientId ? { ...p, status: "Needs follow-up", next: "Frontline contact", nextDate: "Today", accent: "rose" } : p));
    addAudit(`Missed appointment routed to frontline for ${apt.patient}`, "System");
    notify(`Missed appointment · frontline queue updated for ${apt.patient}`);
  };

  const resolveMissedAppointment = (taskId, reason) => {
    const task = tasks.find((t) => t.id === taskId); if (!task) return;
    const now = Date.now();
    setTasks((items) => items.map((t) => t.id === taskId ? { ...t, status: "COMPLETED", reason, outcomeRecordedAt: new Date().toISOString() } : t));
    setTasks((items) => [{ id: `task-${now}`, patient: task.patient, patientId: task.patientId, title: "Reschedule appointment", detail: reason, status: "PENDING", priority: "NORMAL", assignee: "Frontline", due: "Today", channel: "WhatsApp" }, ...items]);
    setPatients((items) => items.map((p) => p.id === task.patientId ? { ...p, status: "Needs follow-up", next: "Reschedule", nextDate: "Action today", accent: "amber" } : p));
    addAudit(`Frontline outcome recorded for ${task.patient}: ${reason}`, "Frontline");
    notify(`Outcome saved · reschedule task created for ${task.patient}`);
  };

  const sendMessage = (text = composer) => {
    if (!text.trim()) return;
    const now = Date.now();
    setMessages((items) => [{ id: `msg-${now}`, patient: selectedPatient.name, patientId: selectedPatient.id, language, channel: "WhatsApp", text, status: "SENT" }, ...items]);
    setTasks((items) => [{ id: `task-${now}`, patient: selectedPatient.name, patientId: selectedPatient.id, title: "Patient message sent", detail: `${language} · awaiting response`, status: "SCHEDULED", priority: "NORMAL", assignee: "Patient", due: "Today", channel: "WhatsApp" }, ...items]);
    addAudit(`Sent ${language} workflow message to ${selectedPatient.name}`);
    setComposer(""); notify(`Message sent · visible in ${selectedPatient.name}'s workspace`);
  };

  const captureVoice = async ({ audioBlob } = {}) => {
    if (!audioBlob || !API_BASE) {
      setVoiceCaptured(true); setVoiceTranscript("Asha's appointment was missed because transport was unavailable."); setVoiceLanguageCode("en-IN"); setVoiceEvent({ event: "MISSED_APPOINTMENT", reason: "TRANSPORT", patient: "Asha Kulkarni", requires_followup: true }); addAudit("Captured voice update; structured event awaits human review", "Frontline"); notify("Voice captured · event ready for review"); return;
    }
    try {
      setVoiceProcessing(true); setVoiceError("");
      const form = new FormData();
      const ext = audioBlob.type.includes("mp4") || audioBlob.type.includes("aac") ? "m4a" : "webm";
      form.append("audio", audioBlob, `maatriloop-voice.${ext}`);
      form.append("language", ""); form.append("mode", "codemix");
      const response = await fetch(`${API_BASE}/api/voice/transcribe`, { method: "POST", body: form });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Sarvam STT failed");
      setVoiceCaptured(true); setVoiceTranscript(data.transcript || ""); setVoiceLanguageCode(data.languageCode || ""); setVoiceEvent(data.workflowEvent || null); addAudit("Sarvam STT captured a frontline update; event awaits human review", "Frontline"); notify("Sarvam STT complete · review the workflow event");
    } catch (error) { setVoiceError(error.message || "Could not transcribe audio"); notify("Voice transcription failed"); }
    finally { setVoiceProcessing(false); }
  };

  const translateApprovedText = async (text, targetLanguage) => {
    if (!text?.trim()) return;
    if (!API_BASE) { setTranslation("Demo translation preview"); return; }
    try {
      setTranslationProcessing(true); setTranslationError("");
      const response = await fetch(`${API_BASE}/api/communication/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, targetLanguage, sourceLanguage: "English" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Translation failed");
      setTranslation(data.translatedText || ""); addAudit(`Translated approved workflow text to ${targetLanguage}`); notify(`Sarvam translation ready · ${targetLanguage}`);
    } catch (error) { setTranslationError(error.message || "Translation failed"); notify("Translation failed"); }
    finally { setTranslationProcessing(false); }
  };

  const speakApprovedText = async (text, targetLanguage) => {
    if (!text?.trim() || !API_BASE) return notify("Live Sarvam gateway is not configured");
    try {
      setAudioPlaying(true); const response = await fetch(`${API_BASE}/api/voice/speak`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, language: targetLanguage, speaker: "shubh", pace: 1 }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Text-to-speech failed");
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`); audio.onended = () => setAudioPlaying(false); audio.onerror = () => setAudioPlaying(false); await audio.play(); addAudit(`Played ${targetLanguage} voice message with Sarvam TTS`);
    } catch (error) { setAudioPlaying(false); notify(error.message || "Could not play voice message"); }
  };

  const resetVoice = () => { setVoiceCaptured(false); setVoiceTranscript(""); setVoiceLanguageCode(""); setVoiceEvent(null); setVoiceError(""); };

  const uploadDocument = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const type = /usg|scan|ultra|sonography/i.test(file.name) ? "USG / scan" : /lab|cbc|blood|test/i.test(file.name) ? "Lab report" : "Document";
    const doc = { id: `doc-${Date.now()}`, patientId: selectedPatient.id, name: file.name, type, date: "03 Oct 2026", owner: role };
    setDocuments((items) => [doc, ...items]); addAudit(`Uploaded ${type.toLowerCase()} for ${selectedPatient.name}`); notify(`${file.name} added to ${selectedPatient.name}'s shared record`); event.target.value = "";
  };

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return patients;
    return patients.filter((p) => `${p.name} ${p.id} ${p.language}`.toLowerCase().includes(q));
  }, [patients, search]);

  const navigate = (nav) => { setActiveNav(nav); setSearch(""); };

  const patientDocs = documents.filter((d) => d.patientId === selectedPatient.id);
  const patientAppointments = appointments.filter((a) => a.patientId === selectedPatient.id);
  const patientTasks = tasks.filter((t) => t.patientId === selectedPatient.id && t.status !== "COMPLETED");
  const patientScanDocs = patientDocs.filter((d) => d.type.includes("scan"));

  return (
    <div className={`app-shell role-${meta.tone}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={18} /></div><div><div className="brand-name">MaatriLoop</div><div className="brand-sub">care coordination</div></div></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav">
          {[["Overview", LayoutDashboard], ["Care timeline", Clock3], ["Tasks", ClipboardCheck], ["Patients", UsersRound], ["Messages", MessageCircle]].map(([label, Icon]) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => navigate(label)}><Icon size={17} /><span>{label}</span>{label === "Tasks" && <span className="nav-count">{openTasks.length}</span>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="ai-card"><Sparkles size={16} /><div><strong>Assistive AI</strong><span>Voice, language & workflow capture — never clinical decisions.</span></div></div>
        <button className={`nav-item ${activeNav === "Settings" ? "active" : ""}`} onClick={() => navigate("Settings")}><Settings size={17} /><span>Settings</span></button>
        <div className="user-card"><Avatar initials={role === "Patient" ? selectedPatient.initials : "GS"} size="sm" tone={meta.tone} /><div className="user-copy"><strong>{role === "Patient" ? selectedPatient.name : `${role} demo`}</strong><span>{role === "Patient" ? "Patient workspace" : "Sion synthetic workspace"}</span></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs"><span>Maternal care</span><span>/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><div className="demo-badge"><span /> Synthetic demo data</div><button className="icon-button" onClick={() => notify("No new notifications")}><Bell size={18} /></button><div className="role-chip"><span className="role-dot" /> {role}</div></div>
        </header>

        <div className="content">
          <section className="hero-row">
            <div><div className="eyebrow">03 OCTOBER 2026 · DEMO MODE</div><h1>{meta.label}</h1><p className="hero-copy">{meta.description}</p></div>
            <div className="role-switcher">{Object.keys(ROLE_META).map((item) => <button key={item} className={role === item ? "selected" : ""} onClick={() => { setRole(item); setActiveNav("Overview"); addAudit(`Switched workspace to ${item}`); }}>{item}</button>)}</div>
          </section>

          <section className="quick-metrics">
            <Metric label="Open tasks" value={String(openTasks.length).padStart(2, "0")} detail={`${dueToday.length} due today`} tone="rose" />
            <Metric label="Appointments" value={String(appointments.length).padStart(2, "0")} detail={`${appointments.filter((a) => a.status === "MISSED").length} missed`} tone="amber" />
            <Metric label="Scans / USG" value={String(scans).padStart(2, "0")} detail="shared records" tone="blue" />
            <Metric label="Documents" value={String(documents.length).padStart(2, "0")} detail="accessible to care team" tone="green" />
          </section>

          {activeNav === "Overview" && <Overview role={role} patients={patients} tasks={tasks} appointments={appointments} selectedPatient={selectedPatient} onSelectPatient={setSelectedPatientId} onNavigate={navigate} onCreate={() => setModal("appointment")} onVoice={() => setModal("voice")} />}
          {activeNav === "Care timeline" && <TimelinePage patient={selectedPatient} tasks={patientTasks} appointments={patientAppointments} documents={patientDocs} onSelect={setSelectedPatientId} patients={patients} />}
          {activeNav === "Tasks" && <TasksPage role={role} tasks={tasks} selectedPatient={selectedPatient} onSelect={setSelectedPatientId} onReview={(task) => { setSelectedPatientId(task.patientId); notify(`Opened ${task.patient}'s workflow`); }} onRespond={(task) => updateTask(task.id, { status: "IN_PROGRESS" }, `Started follow-up for ${task.patient}`)} onResolve={resolveMissedAppointment} />}
          {activeNav === "Patients" && <PatientsPage role={role} patients={filteredPatients} selectedPatient={selectedPatient} onSelect={setSelectedPatientId} search={search} setSearch={setSearch} documents={patientDocs} onUpload={uploadDocument} tasks={patientTasks} appointments={patientAppointments} onConfirm={confirmAppointment} onMissed={markMissed} />}
          {activeNav === "Messages" && <MessagesPage messages={messages} patients={patients} selectedPatient={selectedPatient} onSelect={setSelectedPatientId} language={language} setLanguage={setLanguage} composer={composer} setComposer={setComposer} onSend={sendMessage} onOpen={() => setModal("message")} />}
          {activeNav === "Settings" && <SettingsPage audit={audit} onGovernance={() => setModal("governance")} />}
        </div>

        <section className="bottom-strip"><div className="guardrail"><ShieldCheck size={17} /><span><strong>Assistive, not diagnostic.</strong> AI only transforms approved workflow information into language, voice and structured tasks.</span></div><div className={`sarvam-chip ${API_BASE ? "sarvam-live" : ""}`}><Sparkles size={14} /> Sarvam {API_BASE ? "live" : "demo"}</div></section>
      </main>

      {modal === "appointment" && <AppointmentModal patients={patients} onClose={() => setModal(null)} onCreate={createAppointment} />}
      {modal === "voice" && <VoiceModal captured={voiceCaptured} transcript={voiceTranscript} languageCode={voiceLanguageCode} workflowEvent={voiceEvent} processing={voiceProcessing} error={voiceError} onCapture={captureVoice} onClose={() => { resetVoice(); setModal(null); }} />}
      {modal === "message" && <MessageModal patient={selectedPatient} language={language} setLanguage={setLanguage} composer={composer} setComposer={setComposer} onSend={() => sendMessage()} onTranslate={translateApprovedText} translatedText={translation} translationProcessing={translationProcessing} translationError={translationError} onSpeak={speakApprovedText} audioPlaying={audioPlaying} onClose={() => { setTranslation(""); setTranslationError(""); setModal(null); }} />}
      {modal === "governance" && <GovernanceModal audit={audit} onClose={() => setModal(null)} />}
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

function Overview({ role, patients, tasks, appointments, selectedPatient, onSelectPatient, onNavigate, onCreate, onVoice }) {
  const needs = tasks.filter((t) => t.status !== "COMPLETED").slice(0, 4);
  const roleText = role === "Patient" ? "Your next steps" : role === "Frontline" ? "Today's follow-ups" : role === "Admin" ? "Workflow health" : "What needs attention";
  return <section className="page-grid">
    <div className="main-column">
      <div className="section-heading"><div><div className="section-kicker">{roleText.toUpperCase()}</div><h2>{role === "Patient" ? "Keep your care loop moving" : role === "Frontline" ? "Resolve the next handoff" : role === "Admin" ? "One view of the care loop" : "Operational inbox"}</h2></div><button className="text-button" onClick={() => onNavigate("Tasks")}>View tasks <ArrowRight size={14} /></button></div>
      <div className="task-list">{needs.map((task) => <div className="task-row" key={task.id}><div className={`task-icon task-${STATUS_TONE[task.status] || "neutral"}`}>{task.title.includes("Appointment") ? <CalendarDays size={17} /> : <FileText size={17} />}</div><div className="task-copy"><strong>{task.patient}</strong><span>{task.title}</span><small>{task.detail}</small></div><StatusPill tone={STATUS_TONE[task.status] || "neutral"}>{formatStatus(task.status)}</StatusPill><button className="small-action" onClick={() => { onSelectPatient(task.patientId); onNavigate("Care timeline"); }}>{role === "Frontline" ? "Open" : "View"}</button></div>)}</div>
      <div className="section-heading section-gap"><div><div className="section-kicker">PATIENTS</div><h2>Active care journeys</h2></div><button className="small-action" onClick={() => onNavigate("Patients")}>All patients <ArrowRight size={14} /></button></div>
      <div className="compact-patients">{patients.map((p) => <button key={p.id} className="compact-patient" onClick={() => { onSelectPatient(p.id); onNavigate("Patients"); }}><Avatar initials={p.initials} tone={avatarTone(p.accent)} /><div><strong>{p.name}</strong><span>{p.week} weeks · {p.language}</span></div><StatusPill tone={p.accent}>{p.status}</StatusPill><ArrowRight size={15} /></button>)}</div>
    </div>
    <aside className="side-column">
      {role === "Patient" ? <PregnancyCard patient={selectedPatient} /> : <WorkflowCard tasks={tasks} appointments={appointments} />}
      <div className="panel action-card"><div><div className="section-kicker">QUICK ACTIONS</div><h3>Move the workflow</h3></div><div className="action-grid"><button onClick={onCreate}><CalendarPlus size={17} /> Appointment</button><button onClick={() => onNavigate("Patients")}><FolderOpen size={17} /> Patient record</button><button onClick={onVoice}><Mic size={17} /> Voice update</button><button onClick={() => onNavigate("Messages")}><MessageCircle size={17} /> Message</button></div></div>
    </aside>
  </section>;
}

function WorkflowCard({ tasks, appointments }) { return <div className="panel workflow-card"><div className="panel-header"><div><div className="section-kicker">LIVE WORKFLOW</div><h3>Care-loop status</h3></div><StatusPill tone="green">Active</StatusPill></div><div className="workflow-line"><span className="done" />Task created<span className="line" /><span className={tasks.some((t) => t.status === "IN_PROGRESS") ? "active" : "done"} />Human action<span className="line" /><span className="active" />Next handoff</div><div className="workflow-mini"><div><strong>{tasks.filter((t) => t.status !== "COMPLETED").length}</strong><span>open tasks</span></div><div><strong>{appointments.filter((a) => a.status === "MISSED").length}</strong><span>missed</span></div><div><strong>{tasks.filter((t) => t.status === "COMPLETED").length}</strong><span>closed</span></div></div></div>; }

function PregnancyCard({ patient }) { const pct = Math.min(100, Math.round((patient.week / 40) * 100)); return <div className="panel pregnancy-card"><div className="panel-header"><div><div className="section-kicker">PREGNANCY JOURNEY</div><h3>{patient.week} weeks</h3></div><StatusPill tone="green">Illustrative</StatusPill></div><div className="baby-stage"><div className="baby-orbit"><Baby size={42} /></div><div><strong>Baby growth view</strong><span>Illustrative visual only — not a clinical measurement.</span></div></div><div className="progress-track"><span style={{ width: `${pct}%` }} /></div><div className="progress-labels"><span>Start</span><strong>{pct}% journey</strong><span>40 weeks</span></div></div>; }

function TimelinePage({ patient, tasks, appointments, documents, patients, onSelect }) { const timeline = TIMELINES[patient.id] || []; return <section className="page-stack"><PatientSwitcher patients={patients} selected={patient.id} onSelect={onSelect} /><div className="timeline-layout"><div className="panel"><div className="panel-header"><div><div className="section-kicker">CARE CLOCK</div><h2>{patient.name}'s journey</h2></div><StatusPill tone={patient.accent}>{patient.status}</StatusPill></div><div className="large-timeline">{timeline.map((item, i) => <div className="large-timeline-item" key={item[0] + item[1]}><div className={`timeline-dot ${item[3]}`} /><div className="timeline-date">{item[0]}</div><div><strong>{item[1]}</strong><span>{item[2]}</span></div>{i < timeline.length - 1 && <div className="timeline-connector" />}</div>)}</div></div><div className="side-stack"><div className="panel"><div className="section-kicker">NEXT</div><h3>{tasks[0]?.title || "Nothing requiring action"}</h3><p className="muted-copy">{tasks[0]?.detail || "The care team has no open task for this patient."}</p></div><DocumentsPanel documents={documents} /></div></div></section>; }

function PatientSwitcher({ patients, selected, onSelect }) { return <div className="patient-switcher"><span>Patient record</span><select value={selected} onChange={(e) => onSelect(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}</select></div>; }

function TasksPage({ role, tasks, selectedPatient, onSelect, onReview, onRespond, onResolve }) { const visible = role === "Patient" ? tasks.filter((t) => t.patientId === selectedPatient.id) : role === "Frontline" ? tasks.filter((t) => t.assignee === "Frontline" && t.status !== "COMPLETED") : tasks; const [reasonTask, setReasonTask] = useState(null); return <section className="page-stack"><div className="section-heading"><div><div className="section-kicker">WORKFLOW TASKS</div><h2>{role === "Frontline" ? "Today's frontline queue" : role === "Patient" ? "Your tasks" : "All active workflow tasks"}</h2></div><StatusPill tone="blue">{visible.filter((t) => t.status !== "COMPLETED").length} open</StatusPill></div><div className="panel clean-list">{visible.length ? visible.map((task) => <div className="task-row roomy" key={task.id}><div className={`task-icon task-${STATUS_TONE[task.status] || "neutral"}`}><ListChecks size={17} /></div><div className="task-copy"><strong>{task.patient}</strong><span>{task.title}</span><small>{task.detail} · {task.assignee}</small></div><StatusPill tone={STATUS_TONE[task.status] || "neutral"}>{formatStatus(task.status)}</StatusPill>{role === "Frontline" && task.status !== "COMPLETED" ? <><button className="small-action" onClick={() => onRespond(task)}><PhoneCall size={14} /> Contact</button><button className="small-action" onClick={() => setReasonTask(task)}>Outcome</button></> : <button className="small-action" onClick={() => { onSelect(task.patientId); onReview(task); }}>Open</button>}</div>) : <div className="empty-state">No tasks in this workspace.</div>}</div>{reasonTask && <Modal title={`Record outcome · ${reasonTask.patient}`} kicker="FRONTLINE OUTCOME" onClose={() => setReasonTask(null)}><p className="modal-copy">Record the operational reason supplied by the worker. No clinical interpretation is performed.</p><div className="choice-grid">{["Transport unavailable", "Scheduling conflict", "Could not reach patient", "Other"].map((reason) => <button className="choice-button" key={reason} onClick={() => { onResolve(reasonTask.id, reason); setReasonTask(null); }}>{reason}<ArrowRight size={15} /></button>)}</div></Modal>}</section>; }

function PatientsPage({ role, patients, selectedPatient, onSelect, search, setSearch, documents, onUpload, tasks, appointments, onConfirm, onMissed }) { return <section className="patients-layout"><div className="patient-directory"><div className="section-heading"><div><div className="section-kicker">PATIENT RECORDS</div><h2>{role === "Patient" ? "My record" : "Patients"}</h2></div></div><div className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID or language" /></div><div className="directory-list">{patients.map((p) => <button key={p.id} className={`directory-row ${p.id === selectedPatient.id ? "selected" : ""}`} onClick={() => onSelect(p.id)}><Avatar initials={p.initials} tone={avatarTone(p.accent)} /><div><strong>{p.name}</strong><span>{p.id} · {p.week} weeks · {p.language}</span></div><StatusPill tone={p.accent}>{p.status}</StatusPill><ArrowRight size={15} /></button>)}</div></div><PatientRecord patient={selectedPatient} documents={documents} onUpload={onUpload} tasks={tasks} appointments={appointments} onConfirm={onConfirm} onMissed={onMissed} /></section>; }

function PatientRecord({ patient, documents, onUpload, tasks, appointments, onConfirm, onMissed }) { const pct = Math.min(100, Math.round(patient.week / 40 * 100)); return <div className="record-panel"><div className="record-header"><div><div className="section-kicker">PATIENT RECORD</div><div className="record-title"><Avatar initials={patient.initials} size="lg" tone={avatarTone(patient.accent)} /><div><h2>{patient.name}</h2><span>{patient.id} · {patient.age} years · {patient.language}</span></div></div></div><StatusPill tone={patient.accent}>{patient.status}</StatusPill></div><div className="record-tabs"><span className="active">Pregnancy</span><span>Documents</span><span>Workflow</span></div><div className="record-grid"><div className="panel inner-panel"><div className="panel-header"><div><div className="section-kicker">PREGNANCY TRACKER</div><h3>{patient.week} weeks</h3></div><StatusPill tone="blue">Illustrative</StatusPill></div><div className="baby-visual"><div className="baby-circle" style={{ transform: `scale(${0.72 + patient.week / 100})` }}><Baby size={58} /></div><div className="baby-info"><strong>Visual growth view</strong><span>Use this as a simple journey visual, not as a clinical measurement.</span><div className="progress-track"><span style={{ width: `${pct}%` }} /></div><small>{pct}% of the demo pregnancy journey</small></div></div></div><div className="panel inner-panel"><div className="panel-header"><div><div className="section-kicker">WORKFLOW SNAPSHOT</div><h3>What is moving</h3></div><StatusPill tone="green">Shared</StatusPill></div><div className="snapshot-list"><div><span>Appointments</span><strong>{appointments.length}</strong></div><div><span>Open tasks</span><strong>{tasks.filter((t) => t.status !== "COMPLETED").length}</strong></div><div><span>Scans / USG</span><strong>{documents.filter((d) => d.type.includes("scan")).length}</strong></div><div><span>Documents</span><strong>{documents.length}</strong></div></div></div></div><DocumentsPanel documents={documents} onUpload={onUpload} /><div className="panel appointment-list"><div className="panel-header"><div><div className="section-kicker">APPOINTMENTS</div><h3>Shared schedule</h3></div><StatusPill tone="blue">{appointments.length}</StatusPill></div>{appointments.length ? appointments.map((apt) => <div className="appointment-row" key={apt.id}><div><strong>{apt.type}</strong><span>{apt.date} · {apt.time}</span></div><StatusPill tone={STATUS_TONE[apt.status] || "neutral"}>{formatStatus(apt.status)}</StatusPill>{apt.status === "SCHEDULED" && <div className="appointment-actions"><button className="small-action" onClick={() => onConfirm(apt.id)}>Confirm</button><button className="small-action" onClick={() => onMissed(apt.id)}>Missed</button></div>}</div>) : <div className="empty-state">No appointments recorded.</div>}</div><div className="record-note"><ShieldCheck size={15} /><span>Demo files are synthetic. In production, document access must be authenticated and role-based.</span></div></div>; }

function DocumentsPanel({ documents, onUpload }) { return <div className="panel documents-panel"><div className="panel-header"><div><div className="section-kicker">SHARED DOCUMENTS</div><h3>Reports, USGs & scans</h3></div>{onUpload && <label className="upload-button"><Upload size={15} /> Upload<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={onUpload} /></label>}</div><div className="document-list">{documents.length ? documents.map((doc) => <div className="document-row" key={doc.id}><div className="doc-icon"><FileText size={17} /></div><div><strong>{doc.name}</strong><span>{doc.type} · {doc.date} · added by {doc.owner}</span></div><StatusPill tone={doc.type.includes("scan") ? "blue" : "neutral"}>Shared</StatusPill></div>) : <div className="empty-state">No documents yet.</div>}</div></div>; }

function MessagesPage({ messages, patients, selectedPatient, onSelect, language, setLanguage, composer, setComposer, onSend, onOpen }) { const patientMessages = messages.filter((m) => m.patientId === selectedPatient.id); return <section className="messages-layout"><div className="message-inbox panel"><div className="panel-header"><div><div className="section-kicker">COMMUNICATION</div><h2>Messages</h2></div><button className="primary-button" onClick={onOpen}><Languages size={15} /> Translate & voice</button></div><div className="message-patient-list">{patients.map((p) => <button key={p.id} className={p.id === selectedPatient.id ? "selected" : ""} onClick={() => onSelect(p.id)}><Avatar initials={p.initials} tone={avatarTone(p.accent)} /><div><strong>{p.name}</strong><span>{messages.find((m) => m.patientId === p.id)?.text || "No messages yet"}</span></div></button>)}</div></div><div className="message-thread panel"><div className="panel-header"><div><div className="section-kicker">{selectedPatient.language.toUpperCase()}</div><h2>{selectedPatient.name}</h2></div><StatusPill tone="green">Approved workflow</StatusPill></div><div className="thread-list">{patientMessages.length ? patientMessages.map((m) => <div className={`message-bubble ${m.status === "SENT" ? "sent" : ""}`} key={m.id}><span>{m.channel} · {m.status === "SENT" ? "Sent" : "Ready"}</span><p>{m.text}</p></div>) : <div className="empty-state">No messages for this patient yet.</div>}</div><div className="composer"><select value={language} onChange={(e) => setLanguage(e.target.value)}><option>Marathi</option><option>Hindi</option><option>English</option></select><input value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Approved workflow message…" /><button onClick={() => onSend()} disabled={!composer.trim()}><Send size={16} /></button></div></div></section>; }

function SettingsPage({ audit, onGovernance }) { return <section className="settings-layout"><div className="panel"><div className="section-kicker">SETTINGS & GOVERNANCE</div><h2>Human-controlled by design</h2><p className="muted-copy">The workflow engine is the source of truth. Sarvam is used only for language, voice and structured operational capture.</p><div className="settings-list"><div><ShieldCheck size={17} /><span><strong>Synthetic data</strong><small>Enabled for this prototype</small></span><StatusPill tone="green">On</StatusPill></div><div><Stethoscope size={17} /><span><strong>Clinical decision support</strong><small>Not part of this prototype</small></span><StatusPill tone="blue">Disabled</StatusPill></div><div><Sparkles size={17} /><span><strong>Sarvam gateway</strong><small>API key remains server-side</small></span><StatusPill tone={API_BASE ? "green" : "amber"}>{API_BASE ? "Live" : "Demo"}</StatusPill></div></div><button className="secondary-button" onClick={onGovernance}><ShieldCheck size={15} /> View security checklist</button></div><div className="panel"><div className="section-kicker">RECENT AUDIT</div><h3>Workflow events</h3><div className="audit-list">{audit.slice(0, 8).map((x, i) => <div className="audit-row" key={i}><span>{x.time}</span><div><strong>{x.actor}</strong><p>{x.action}</p></div></div>)}</div></div></section>; }

function AppointmentModal({ patients, onClose, onCreate }) { const [patientId, setPatientId] = useState(patients[0].id); const [date, setDate] = useState("14 Oct 2026"); const [time, setTime] = useState("10:00 AM"); const [type, setType] = useState("ANC contact"); return <Modal title="Create appointment" kicker="WORKFLOW EVENT" onClose={onClose}><p className="modal-copy">Creating an appointment creates a confirmation task that appears in the shared workflow.</p><div className="form-grid"><label>Patient<select value={patientId} onChange={(e) => setPatientId(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option>ANC contact</option><option>Follow-up</option><option>Report review</option></select></label><label>Date<input value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Time<input value={time} onChange={(e) => setTime(e.target.value)} /></label></div><button className="primary-button full" onClick={() => onCreate({ patientId, date, time, type })}><CalendarPlus size={17} /> Create & queue</button></Modal>; }

function VoiceModal({ captured, transcript, languageCode, workflowEvent, processing, error, onCapture, onClose }) { const [recording, setRecording] = useState(false); const [recordingError, setRecordingError] = useState(""); const [elapsed, setElapsed] = useState(0); const mediaRecorderRef = useRef(null); const chunksRef = useRef([]); const timerRef = useRef(null); const startRecording = async () => { try { setRecordingError(""); if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone recording is not available in this browser."); const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"]; const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || ""; const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined); chunksRef.current = []; recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); }; recorder.onstop = async () => { stream.getTracks().forEach((t) => t.stop()); clearInterval(timerRef.current); setRecording(false); setElapsed(0); const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); await onCapture({ audioBlob: blob }); }; recorder.start(); mediaRecorderRef.current = recorder; setRecording(true); timerRef.current = window.setInterval(() => setElapsed((v) => v + 1), 1000); } catch (e) { setRecordingError(e.message || "Microphone permission unavailable."); } }; const stop = () => { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current.stop(); }; return <Modal title="Capture workflow update" kicker="SARVAM VOICE" onClose={onClose}><div className={`voice-orb ${recording ? "recording" : ""}`}><Mic size={28} /></div><p className="modal-copy">Record a short operational update. Sarvam converts speech to text; MaatriLoop extracts a constrained workflow event for human review.</p><div className="voice-pipeline"><span>Voice</span><ArrowRight size={13} /><span>STT</span><ArrowRight size={13} /><span>Event</span><ArrowRight size={13} /><span>Human review</span></div>{recording && <div className="recording-status"><span className="recording-dot" /> Recording · 00:{String(elapsed).padStart(2, "0")}</div>}{recordingError && <div className="error-box">{recordingError}</div>}{error && <div className="error-box">{error}</div>}<div className="voice-example"><Headphones size={15} /> Try: “Asha's appointment was missed because transport was unavailable.”</div>{transcript && <div className="transcript-card"><div className="section-kicker">SARVAM TRANSCRIPT {languageCode ? `· ${languageCode}` : ""}</div><p>“{transcript}”</p></div>}{captured && workflowEvent && <div className="captured-event"><div className="section-kicker">EVENT FOR HUMAN REVIEW</div><div className="event-grid"><span>event</span><strong>{workflowEvent.event}</strong><span>reason</span><strong>{workflowEvent.reason}</strong><span>patient</span><strong>{workflowEvent.patient || "Needs selection"}</strong></div><StatusPill tone="green">Review before task update</StatusPill></div>}{!recording ? <button className="primary-button full" onClick={startRecording} disabled={processing}><Mic size={17} /> {processing ? "Transcribing…" : captured ? "Record again" : "Start recording"}</button> : <button className="primary-button full stop-recording" onClick={stop}><X size={17} /> Stop & transcribe</button>}<div className="microcopy"><ShieldCheck size={13} /> API key stays on the backend.</div></Modal>; }

function MessageModal({ patient, language, setLanguage, composer, setComposer, onSend, onTranslate, translatedText, translationProcessing, translationError, onSpeak, audioPlaying, onClose }) { const defaultEnglish = "Hello, your next appointment is on 14 October at 10:00 AM."; const source = composer.trim() || defaultEnglish; return <Modal title={`Message · ${patient.name}`} kicker="APPROVED COMMUNICATION" onClose={onClose}><div className="translation-bar"><Languages size={15} /><span>Translate approved text</span><select value={language} onChange={(e) => setLanguage(e.target.value)}><option>Marathi</option><option>Hindi</option><option>English</option></select></div><textarea value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Approved workflow text…" /><div className="translation-actions"><button className="secondary-button" onClick={() => onTranslate(source, language)} disabled={translationProcessing || language === "English"}><Languages size={15} /> {translationProcessing ? "Translating…" : "Translate with Sarvam"}</button>{translatedText && <button className="secondary-button" onClick={() => onSpeak(translatedText, language)} disabled={audioPlaying}><Volume2 size={15} /> {audioPlaying ? "Playing…" : "Play voice"}</button>}</div>{translationError && <div className="error-box">{translationError}</div>}<div className="translation-preview"><div className="section-kicker">SARVAM OUTPUT · {language}</div><p>{translatedText || (language === "English" ? defaultEnglish : "Translate the approved message to preview it here.")}</p></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => { onSend(); onClose(); }}><Send size={15} /> Queue message</button></div></Modal>; }

function GovernanceModal({ audit, onClose }) { return <Modal title="Security & data protection" kicker="PRODUCTION READINESS" onClose={onClose} wide><div className="security-grid">{[["Authentication", "Use a real identity provider; the demo role switcher is not authorization."], ["RBAC", "Enforce doctor/frontline/patient/admin permissions server-side."], ["Secrets", "SARVAM_API_KEY stays in server environment secrets."], ["Data minimization", "Send only approved workflow content to AI services."], ["Auditability", "Record who creates, changes and closes workflow events."], ["Synthetic demo", "Keep real patient data out of this hackathon prototype."]].map(([title, copy]) => <div className="security-item" key={title}><ShieldCheck size={17} /><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div><div className="audit-preview">{audit.slice(0, 5).map((x, i) => <div key={i}><span>{x.time}</span><strong>{x.actor}</strong><p>{x.action}</p></div>)}</div></Modal>; }

function formatStatus(status) { return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); }
function avatarTone(accent) { return accent === "rose" ? "rose" : accent === "amber" ? "amber" : "sage"; }

export default App;

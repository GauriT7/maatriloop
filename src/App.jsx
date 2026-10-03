import React, { useMemo, useState } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, CalendarPlus, Check, ChevronDown,
  ClipboardCheck, Clock3, Database, FileText, Headphones, LayoutDashboard,
  Languages, ListChecks, MessageCircle, Mic, MoreHorizontal, Phone,
  PhoneCall, Plus, RefreshCw, Search, Send, Settings, ShieldCheck, Sparkles,
  Stethoscope, UserRound, UsersRound, Volume2, X
} from "lucide-react";

/*
 * MaatriLoop v0.2
 * Frontend-first hackathon demo.
 *
 * IMPORTANT:
 * - All data below is synthetic.
 * - The workflow engine is represented by local React state for the demo.
 * - Sarvam is represented through an integration-ready gateway. Do not put
 *   SARVAM_API_KEY in Vite/client code.
 * - Clinical decisions are intentionally absent. The app only coordinates
 *   approved workflow information.
 */

const ROLE_META = {
  Doctor: {
    label: "Care team workspace",
    short: "Doctor",
    tone: "doctor",
    description: "Review operational work, create tasks and close care-loop handoffs."
  },
  Frontline: {
    label: "Today's task queue",
    short: "Frontline",
    tone: "frontline",
    description: "Resolve stalled follow-ups with one-tap contact and outcome capture."
  },
  Patient: {
    label: "My care journey",
    short: "Patient",
    tone: "patient",
    description: "See what is scheduled, confirm appointments and ask for help."
  },
  Admin: {
    label: "Care operations",
    short: "Admin",
    tone: "admin",
    description: "See workflow health, communication activity and governance controls."
  }
};

const INITIAL_PATIENTS = [
  {
    id: "MC-1042",
    name: "Asha Kulkarni",
    age: 27,
    week: "28 weeks",
    language: "Marathi",
    status: "On track",
    initials: "AK",
    next: "ANC contact",
    nextDate: "14 Oct · 10:00 AM",
    accent: "green"
  },
  {
    id: "MC-1037",
    name: "Meena Patil",
    age: 31,
    week: "34 weeks",
    language: "Hindi",
    status: "Needs follow-up",
    initials: "MP",
    next: "Report review",
    nextDate: "Due today",
    accent: "amber"
  },
  {
    id: "MC-1029",
    name: "Pooja Shaikh",
    age: 24,
    week: "20 weeks",
    language: "Hindi",
    status: "Appointment missed",
    initials: "PS",
    next: "Reschedule",
    nextDate: "2 days ago",
    accent: "rose"
  }
];

const INITIAL_TASKS = [
  {
    id: "task-001",
    patient: "Pooja Shaikh",
    patientId: "MC-1029",
    title: "Appointment missed",
    detail: "Patient has not confirmed a new slot",
    status: "MISSED",
    priority: "HIGH",
    assignee: "Frontline",
    due: "Today",
    channel: "IVR / Voice"
  },
  {
    id: "task-002",
    patient: "Meena Patil",
    patientId: "MC-1037",
    title: "Report received",
    detail: "Document is ready for review",
    status: "PENDING",
    priority: "NORMAL",
    assignee: "Doctor",
    due: "Today",
    channel: "In-app"
  },
  {
    id: "task-003",
    patient: "Asha Kulkarni",
    patientId: "MC-1042",
    title: "Appointment confirmed",
    detail: "14 Oct · 10:00 AM",
    status: "COMPLETED",
    priority: "NORMAL",
    assignee: "Doctor",
    due: "14 Oct",
    channel: "WhatsApp"
  }
];

const INITIAL_APPOINTMENTS = [
  {
    id: "apt-001",
    patientId: "MC-1042",
    patient: "Asha Kulkarni",
    date: "14 Oct 2026",
    time: "10:00 AM",
    type: "ANC contact",
    status: "CONFIRMED",
    createdBy: "Doctor"
  },
  {
    id: "apt-002",
    patientId: "MC-1029",
    patient: "Pooja Shaikh",
    date: "01 Oct 2026",
    time: "11:30 AM",
    type: "Follow-up",
    status: "MISSED",
    createdBy: "Doctor"
  }
];

const INITIAL_MESSAGES = [
  {
    id: "msg-001",
    patient: "Asha Kulkarni",
    patientId: "MC-1042",
    language: "Marathi",
    channel: "WhatsApp",
    text: "नमस्कार आशा, तुमची पुढील भेट १४ ऑक्टोबर रोजी सकाळी १० वाजता आहे.",
    status: "READY"
  }
];

const CARE_TIMELINE = {
  "MC-1042": [
    ["04 Oct", "ANC contact", "Completed", "done"],
    ["09 Oct", "Investigation", "Task created", "active"],
    ["12 Oct", "Report upload", "Awaiting document", "pending"],
    ["14 Oct", "Doctor review", "Scheduled", "pending"],
    ["17 Oct", "Follow-up", "Scheduled", "pending"]
  ],
  "MC-1037": [
    ["01 Oct", "ANC contact", "Completed", "done"],
    ["02 Oct", "Report upload", "Received", "done"],
    ["03 Oct", "Doctor review", "Due today", "active"],
    ["07 Oct", "Follow-up", "Scheduled", "pending"]
  ],
  "MC-1029": [
    ["20 Sep", "ANC contact", "Completed", "done"],
    ["01 Oct", "Follow-up", "Missed", "missed"],
    ["03 Oct", "Patient contact", "Frontline queue", "active"],
    ["05 Oct", "Reschedule", "Pending", "pending"]
  ]
};

const STATUS_TONE = {
  PENDING: "amber",
  SCHEDULED: "blue",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  MISSED: "rose",
  CANCELLED: "neutral",
  ESCALATED: "rose",
  CONFIRMED: "green",
  READY: "blue",
  SENT: "green"
};

function StatusPill({ children, tone = "neutral" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Avatar({ initials, size = "md", tone = "sage" }) {
  return <div className={`avatar avatar-${size} avatar-${tone}`}>{initials}</div>;
}

function Metric({ label, value, detail, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-dot ${tone}`} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <small>{detail}</small>
    </div>
  );
}

function Channel({ icon: Icon, label, state, tone = "neutral" }) {
  return (
    <div className={`channel channel-${tone}`}>
      <div className="channel-icon"><Icon size={17} /></div>
      <div><strong>{label}</strong><span>{state}</span></div>
    </div>
  );
}

function Modal({ title, kicker, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
        {kicker && <div className="section-kicker">{kicker}</div>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function App() {
  const [role, setRole] = useState("Doctor");
  const [activeNav, setActiveNav] = useState("Overview");
  const [selectedPatient, setSelectedPatient] = useState(INITIAL_PATIENTS[0]);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [language, setLanguage] = useState("Marathi");
  const [voiceCaptured, setVoiceCaptured] = useState(false);
  const [audit, setAudit] = useState([
    { time: "10:42", actor: "Doctor", action: "Opened Asha's care journey" },
    { time: "10:40", actor: "System", action: "Appointment reminder queued" }
  ]);

  const meta = ROLE_META[role];

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const addAudit = (action, actor = role) => {
    setAudit((items) => [
      { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), actor, action },
      ...items
    ].slice(0, 8));
  };

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.name} ${p.id} ${p.language}`.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const openTasks = tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
  const dueToday = tasks.filter((t) => t.due === "Today" && t.status !== "COMPLETED");
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;

  const updateTask = (id, patch, auditText) => {
    setTasks((items) => items.map((t) => t.id === id ? { ...t, ...patch } : t));
    if (auditText) addAudit(auditText);
  };

  const createAppointment = (data) => {
    const patient = patients.find((p) => p.id === data.patientId);
    const appointment = {
      id: `apt-${Date.now()}`,
      patientId: data.patientId,
      patient: patient.name,
      date: data.date,
      time: data.time,
      type: data.type,
      status: "SCHEDULED",
      createdBy: role
    };
    setAppointments((items) => [appointment, ...items]);
    setTasks((items) => [
      {
        id: `task-${Date.now()}`,
        patient: patient.name,
        patientId: patient.id,
        title: "Appointment confirmation",
        detail: `${data.date} · ${data.time}`,
        status: "SCHEDULED",
        priority: "NORMAL",
        assignee: "Frontline",
        due: "Today",
        channel: "WhatsApp"
      },
      ...items
    ]);
    addAudit(`Created appointment for ${patient.name}`);
    notify(`Appointment created · confirmation task queued`);
    setModal(null);
  };

  const confirmAppointment = (appointmentId) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    setAppointments((items) => items.map((a) => a.id === appointmentId ? { ...a, status: "CONFIRMED" } : a));
    const matching = tasks.find((t) => t.patientId === apt?.patientId && t.title === "Appointment confirmation");
    if (matching) updateTask(matching.id, { status: "COMPLETED" }, `Appointment confirmed for ${apt.patient}`);
    else addAudit(`Appointment confirmed for ${apt?.patient || "patient"}`, "Patient");
    notify("Appointment confirmed · care loop updated");
  };

  const markMissed = (appointmentId) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    setAppointments((items) => items.map((a) => a.id === appointmentId ? { ...a, status: "MISSED" } : a));
    setTasks((items) => [
      {
        id: `task-${Date.now()}`,
        patient: apt.patient,
        patientId: apt.patientId,
        title: "Appointment missed",
        detail: "No confirmation recorded after scheduled time",
        status: "MISSED",
        priority: "HIGH",
        assignee: "Frontline",
        due: "Today",
        channel: "IVR / Voice"
      },
      ...items
    ]);
    addAudit(`Missed appointment escalated for ${apt.patient}`, "System");
    notify("Missed appointment · frontline task created");
  };

  const resolveMissedAppointment = (taskId, reason) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((items) => [
      ...items.map((t) => t.id === taskId ? { ...t, status: "COMPLETED", reason } : t),
      {
        id: `task-${Date.now()}`,
        patient: task.patient,
        patientId: task.patientId,
        title: "Reschedule appointment",
        detail: reason,
        status: "PENDING",
        priority: "NORMAL",
        assignee: "Frontline",
        due: "Today",
        channel: "WhatsApp"
      }
    ]);
    addAudit(`Follow-up reason recorded for ${task.patient}: ${reason}`);
    notify("Outcome recorded · reschedule task created");
  };

  const sendMessage = (text = composer) => {
    if (!text.trim()) return;
    setMessages((items) => [{
      id: `msg-${Date.now()}`,
      patient: selectedPatient.name,
      patientId: selectedPatient.id,
      language,
      channel: "WhatsApp",
      text,
      status: "SENT"
    }, ...items]);
    addAudit(`Sent ${language} workflow message to ${selectedPatient.name}`);
    setComposer("");
    notify("Message queued in demo communication gateway");
  };

  const captureVoice = () => {
    setVoiceCaptured(true);
    addAudit("Captured frontline voice update; structured event awaits human review", "Frontline");
    notify("Voice captured · structured event ready for review");
  };

  const renderRoleContent = () => {
    if (role === "Patient") {
      return <PatientWorkspace
        selectedPatient={selectedPatient}
        appointments={appointments}
        tasks={tasks}
        onConfirm={confirmAppointment}
        onHelp={() => setModal("help")}
        onMessage={() => setModal("message")}
      />;
    }
    if (role === "Frontline") {
      return <FrontlineWorkspace
        tasks={tasks}
        onRespond={(task) => updateTask(task.id, { status: "IN_PROGRESS" }, `Started follow-up for ${task.patient}`)}
        onResolve={resolveMissedAppointment}
        onVoice={() => setModal("voice")}
      />;
    }
    if (role === "Admin") {
      return <AdminWorkspace
        tasks={tasks}
        appointments={appointments}
        messages={messages}
        audit={audit}
        onGovernance={() => setModal("governance")}
      />;
    }
    return <DoctorWorkspace
      tasks={tasks}
      patients={filteredPatients}
      appointments={appointments}
      selectedPatient={selectedPatient}
      onSelectPatient={setSelectedPatient}
      onCreateAppointment={() => setModal("appointment")}
      onReview={(task) => {
        updateTask(task.id, { status: "IN_PROGRESS" }, `Opened ${task.title} for ${task.patient}`);
        setSelectedPatient(patients.find((p) => p.id === task.patientId) || selectedPatient);
      }}
      onVoice={() => setModal("voice")}
      search={search}
      setSearch={setSearch}
      onMessage={() => setModal("message")}
      messages={messages}
      language={language}
      setLanguage={setLanguage}
      composer={composer}
      setComposer={setComposer}
      sendMessage={sendMessage}
      appointmentsForPatient={appointments.filter((a) => a.patientId === selectedPatient.id)}
      onConfirm={confirmAppointment}
      onMissed={markMissed}
    />;
  };

  return (
    <div className={`app-shell role-${meta.tone}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={18} strokeWidth={2.4} /></div>
          <div>
            <div className="brand-name">MaatriLoop</div>
            <div className="brand-sub">care coordination</div>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav">
          {[
            ["Overview", LayoutDashboard],
            ["Care timeline", Clock3],
            ["Tasks", ClipboardCheck],
            ["Patients", UsersRound],
            ["Messages", MessageCircle]
          ].map(([label, Icon]) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Tasks" && <span className="nav-count">{openTasks.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="ai-card">
          <div className="ai-card-icon"><Sparkles size={16} /></div>
          <div>
            <div className="ai-card-title">Assistive AI</div>
            <div className="ai-card-copy">Language, voice & task capture — never clinical decisions.</div>
          </div>
        </div>

        <button className={`nav-item ${activeNav === "Settings" ? "active" : ""}`} onClick={() => setActiveNav("Settings")}>
          <Settings size={18} />
          <span>Settings & governance</span>
        </button>

        <div className="user-card">
          <Avatar initials="GS" size="sm" />
          <div className="user-copy">
            <strong>{role} demo</strong>
            <span>Sion synthetic workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Maternal care</span>
            <span className="crumb-separator">/</span>
            <strong>{activeNav}</strong>
          </div>

          <div className="topbar-actions">
            <div className="demo-badge"><span /> Synthetic demo data</div>
            <button className="icon-button" aria-label="Notifications" onClick={() => notify("No new notifications")}>
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <button className="profile-button">
              <Avatar initials="GS" size="sm" tone={meta.tone} />
              <span>Gauri</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="content">
          <section className="hero-row">
            <div>
              <div className="eyebrow">SATURDAY · 03 OCTOBER 2026</div>
              <h1>{meta.label}</h1>
              <p className="hero-copy">{meta.description}</p>
            </div>

            <div className="role-switcher" aria-label="Demo role switcher">
              {Object.keys(ROLE_META).map((item) => (
                <button
                  key={item}
                  className={role === item ? "selected" : ""}
                  onClick={() => {
                    setRole(item);
                    addAudit(`Switched workspace to ${item}`);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {role === "Doctor" && (
            <section className="metrics">
              <Metric label="Open tasks" value={String(openTasks.length).padStart(2, "0")} detail={`${dueToday.length} due today`} tone="rose" />
              <Metric label="Due today" value={String(dueToday.length).padStart(2, "0")} detail="workflow queue" tone="amber" />
              <Metric label="Completed" value={`${completed ? Math.min(99, 80 + completed * 5) : 80}%`} detail="this demo cycle" tone="green" />
              <Metric label="Patients followed up" value="28" detail="this week" tone="blue" />
            </section>
          )}

          {activeNav === "Settings" ? (
            <GovernancePage onGovernance={() => setModal("governance")} />
          ) : (
            renderRoleContent()
          )}
        </div>

        <section className="bottom-strip">
          <div className="guardrail">
            <ShieldCheck size={18} />
            <div>
              <strong>Assistive, not diagnostic</strong>
              <span>AI transforms approved workflow information into language, voice and structured tasks. It does not diagnose, recommend treatment or make clinical decisions.</span>
            </div>
          </div>
          <div className="sarvam-chip"><Sparkles size={15} /> Sarvam gateway · demo mode</div>
        </section>
      </main>

      {modal === "appointment" && (
        <AppointmentModal patients={patients} onClose={() => setModal(null)} onCreate={createAppointment} />
      )}

      {modal === "voice" && (
        <VoiceModal
          captured={voiceCaptured}
          onCapture={captureVoice}
          onClose={() => {
            setVoiceCaptured(false);
            setModal(null);
          }}
        />
      )}

      {modal === "message" && (
        <MessageModal
          patient={selectedPatient}
          language={language}
          setLanguage={setLanguage}
          composer={composer}
          setComposer={setComposer}
          onSend={() => sendMessage()}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "help" && (
        <Modal title="Need help?" kicker="PATIENT SUPPORT" onClose={() => setModal(null)}>
          <p className="modal-copy">This demo routes a request to the care team. It does not provide medical advice.</p>
          <div className="modal-choice-grid">
            {["Call health worker", "Request appointment help", "Ask for language support"].map((item) => (
              <button key={item} className="choice-button" onClick={() => {
                addAudit(`Patient support request: ${item}`, "Patient");
                notify("Support request queued for the care team");
                setModal(null);
              }}>{item}<ArrowRight size={15} /></button>
            ))}
          </div>
        </Modal>
      )}

      {modal === "governance" && (
        <GovernanceModal audit={audit} onClose={() => setModal(null)} />
      )}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function DoctorWorkspace({
  tasks, patients, appointments, selectedPatient, onSelectPatient,
  onCreateAppointment, onReview, onVoice, search, setSearch, onMessage,
  messages, language, setLanguage, composer, setComposer, sendMessage,
  appointmentsForPatient, onConfirm, onMissed
}) {
  return (
    <section className="grid-main">
      <div className="column">
        <div className="section-heading">
          <div>
            <div className="section-kicker">ATTENTION QUEUE</div>
            <h2>What needs you now</h2>
          </div>
          <button className="text-button">View workflow <ArrowRight size={15} /></button>
        </div>

        <div className="task-stack">
          {tasks.filter((t) => t.status !== "COMPLETED").slice(0, 4).map((task) => (
            <div className="task-card" key={task.id}>
              <div className={`task-icon task-${STATUS_TONE[task.status] || "neutral"}`}>
                {task.title.includes("Appointment") ? <CalendarDays size={18} /> : <FileText size={18} />}
              </div>
              <div className="task-body">
                <div className="task-topline">
                  <strong>{task.patient}</strong>
                  <StatusPill tone={STATUS_TONE[task.status] || "neutral"}>{formatStatus(task.status)}</StatusPill>
                </div>
                <div className="task-title">{task.title}</div>
                <div className="task-detail">{task.detail}</div>
              </div>
              <button className="small-action" onClick={() => onReview(task)}>
                {task.status === "MISSED" ? "Respond" : "Review"}
              </button>
            </div>
          ))}
        </div>

        <div className="section-heading patient-heading">
          <div>
            <div className="section-kicker">PATIENTS</div>
            <h2>Active care journeys</h2>
          </div>
          <button className="round-add" onClick={onCreateAppointment}><Plus size={17} /></button>
        </div>

        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient or ID" />
        </div>

        <div className="patient-list">
          {patients.map((patient) => (
            <button
              key={patient.id}
              className={`patient-row ${selectedPatient.id === patient.id ? "selected-row" : ""}`}
              onClick={() => onSelectPatient(patient)}
            >
              <Avatar initials={patient.initials} tone={avatarTone(patient.accent)} />
              <div className="patient-main">
                <strong>{patient.name}</strong>
                <span>{patient.age} yrs · {patient.week} · {patient.language}</span>
              </div>
              <div className="patient-next">
                <span>{patient.next}</span>
                <strong>{patient.nextDate}</strong>
              </div>
              <StatusPill tone={patient.accent}>{patient.status}</StatusPill>
              <ArrowRight size={16} className="row-arrow" />
            </button>
          ))}
        </div>
      </div>

      <aside className="right-column">
        <PatientPanel
          patient={selectedPatient}
          appointments={appointmentsForPatient}
          onCreateAppointment={onCreateAppointment}
          onVoice={onVoice}
          onConfirm={onConfirm}
          onMissed={onMissed}
        />
        <CommunicationPanel
          patient={selectedPatient}
          messages={messages}
          language={language}
          setLanguage={setLanguage}
          composer={composer}
          setComposer={setComposer}
          onSend={sendMessage}
          onOpen={onMessage}
        />
      </aside>
    </section>
  );
}

function PatientPanel({ patient, appointments, onCreateAppointment, onVoice, onConfirm, onMissed }) {
  const timeline = CARE_TIMELINE[patient.id] || [];
  return (
    <div className="panel patient-panel">
      <div className="panel-header">
        <div className="section-kicker">SELECTED PATIENT</div>
        <button className="icon-button subtle"><MoreHorizontal size={18} /></button>
      </div>

      <div className="patient-profile">
        <Avatar initials={patient.initials} size="lg" tone={avatarTone(patient.accent)} />
        <div>
          <h3>{patient.name}</h3>
          <p>{patient.id} · {patient.age} years</p>
        </div>
        <StatusPill tone={patient.accent === "rose" ? "rose" : "green"}>{patient.status}</StatusPill>
      </div>

      <div className="profile-facts">
        <div><span>Pregnancy</span><strong>{patient.week}</strong></div>
        <div><span>Language</span><strong>{patient.language}</strong></div>
        <div><span>Next touchpoint</span><strong>{patient.nextDate}</strong></div>
      </div>

      <div className="appointment-block">
        <div className="clock-header">
          <div>
            <div className="section-kicker">APPOINTMENTS</div>
            <strong>Operational schedule</strong>
          </div>
          <CalendarDays size={17} />
        </div>
        {appointments.length === 0 ? (
          <div className="empty-state compact">No appointment in the demo record.</div>
        ) : appointments.slice(0, 3).map((apt) => (
          <div className="appointment-row" key={apt.id}>
            <div>
              <strong>{apt.type}</strong>
              <span>{apt.date} · {apt.time}</span>
            </div>
            <div className="appointment-actions">
              <StatusPill tone={STATUS_TONE[apt.status] || "neutral"}>{formatStatus(apt.status)}</StatusPill>
              {apt.status === "SCHEDULED" && (
                <>
                  <button className="tiny-button" onClick={() => onConfirm(apt.id)}>Confirm</button>
                  <button className="tiny-button danger" onClick={() => onMissed(apt.id)}>Missed</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="care-clock">
        <div className="clock-header">
          <div>
            <div className="section-kicker">CARE CLOCK</div>
            <strong>Pregnancy journey</strong>
          </div>
          <span className="clock-progress">{timeline.filter((x) => x[3] === "done").length} / {timeline.length}</span>
        </div>
        <div className="timeline">
          {timeline.map((item, index) => (
            <div className="timeline-item" key={item[0] + item[1]}>
              <div className={`timeline-dot ${item[3]}`}><span /></div>
              {index !== timeline.length - 1 && <div className="timeline-line" />}
              <div className="timeline-copy">
                <span>{item[0]}</span>
                <strong>{item[1]}</strong>
                <small>{item[2]}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-actions">
        <button className="primary-button" onClick={onCreateAppointment}><CalendarPlus size={17} /> Create appointment</button>
        <button className="secondary-button" onClick={onVoice}><Mic size={17} /> Voice note</button>
      </div>
    </div>
  );
}

function CommunicationPanel({ patient, messages, language, setLanguage, composer, setComposer, onSend, onOpen }) {
  const latest = messages.find((m) => m.patientId === patient.id) || messages[0];
  return (
    <div className="panel communication-panel">
      <div className="panel-header">
        <div>
          <div className="section-kicker">COMMUNICATION LOOP</div>
          <h3>One workflow, many channels</h3>
        </div>
        <div className="channel-status"><span /> Demo gateway</div>
      </div>

      <div className="channel-grid">
        <Channel icon={MessageCircle} label="WhatsApp" state="Simulated" tone="green" />
        <Channel icon={Phone} label="IVR / Voice" state="Gateway ready" tone="amber" />
        <Channel icon={Volume2} label="In-app" state="Ready" tone="blue" />
      </div>

      <div className="message-preview">
        <div className="message-meta">
          <span>Approved workflow text · {latest.language}</span>
          <span>{latest.status === "SENT" ? "Sent" : "Ready"}</span>
        </div>
        <p>{latest.text}</p>
        <div className="message-footer">
          <StatusPill tone={latest.status === "SENT" ? "green" : "blue"}>
            {latest.status === "SENT" ? "Sent" : "Ready to send"}
          </StatusPill>
          <button onClick={() => onSend(latest.text)}><Send size={14} /> Send</button>
        </div>
      </div>

      <div className="composer-options">
        <label>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>Marathi</option>
            <option>Hindi</option>
            <option>English</option>
          </select>
        </label>
        <button className="text-button" onClick={onOpen}><Languages size={15} /> Translation preview</button>
      </div>

      <div className="composer">
        <input value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Write an approved workflow message…" />
        <button onClick={() => onSend()} disabled={!composer.trim()}><Send size={16} /></button>
      </div>
      <div className="microcopy"><ShieldCheck size={13} /> AI can translate approved text; it does not create clinical instructions.</div>
    </div>
  );
}

function FrontlineWorkspace({ tasks, onRespond, onResolve, onVoice }) {
  const queue = tasks.filter((t) => t.assignee === "Frontline" && t.status !== "COMPLETED");
  const [reasonTask, setReasonTask] = useState(null);

  return (
    <section className="workspace-stack">
      <div className="frontline-hero">
        <div>
          <div className="section-kicker">FRONTLINE QUEUE</div>
          <h2>One tap should move the loop.</h2>
          <p>Contact patients, record operational outcomes and return unresolved work to the workflow.</p>
        </div>
        <button className="primary-button" onClick={onVoice}><Mic size={17} /> Capture voice update</button>
      </div>

      <div className="queue-metrics">
        <Metric label="Need action" value={String(queue.length).padStart(2, "0")} detail="today's queue" tone="rose" />
        <Metric label="Contact attempts" value="05" detail="this shift" tone="blue" />
        <Metric label="Closed" value="14" detail="this week" tone="green" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="section-kicker">TODAY</div>
            <h3>Stalled care loops</h3>
          </div>
          <StatusPill tone="amber">Human action required</StatusPill>
        </div>
        <div className="frontline-list">
          {queue.map((task) => (
            <div className="frontline-row" key={task.id}>
              <div className={`task-icon task-${STATUS_TONE[task.status] || "neutral"}`}>
                {task.title.includes("Appointment") ? <CalendarDays size={18} /> : <FileText size={18} />}
              </div>
              <div className="frontline-copy">
                <strong>{task.patient}</strong>
                <span>{task.title} · {task.detail}</span>
              </div>
              <StatusPill tone={STATUS_TONE[task.status] || "neutral"}>{formatStatus(task.status)}</StatusPill>
              <button className="small-action" onClick={() => onRespond(task)}><PhoneCall size={14} /> Contact</button>
              <button className="small-action" onClick={() => setReasonTask(task)}>Outcome</button>
            </div>
          ))}
        </div>
      </div>

      {reasonTask && (
        <Modal title={`Record outcome · ${reasonTask.patient}`} kicker="FOLLOW-UP OUTCOME" onClose={() => setReasonTask(null)}>
          <p className="modal-copy">Record the operational reason supplied by the frontline worker. No clinical interpretation is performed.</p>
          <div className="modal-choice-grid">
            {["Transport unavailable", "Scheduling conflict", "Could not reach patient", "Other"].map((reason) => (
              <button key={reason} className="choice-button" onClick={() => {
                onResolve(reasonTask.id, reason);
                setReasonTask(null);
              }}>
                {reason}<ArrowRight size={15} />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}

function PatientWorkspace({ selectedPatient, appointments, tasks, onConfirm, onHelp, onMessage }) {
  const patientAppointments = appointments.filter((a) => a.patientId === selectedPatient.id);
  const patientTasks = tasks.filter((t) => t.patientId === selectedPatient.id && t.status !== "COMPLETED");
  return (
    <section className="patient-workspace">
      <div className="patient-welcome">
        <div>
          <div className="section-kicker">NAMASTE, ASHA 👋</div>
          <h2>Your care journey</h2>
          <p>Everything here is about what is scheduled, what needs your confirmation and how to reach your care team.</p>
        </div>
        <Avatar initials={selectedPatient.initials} size="lg" tone="patient" />
      </div>

      <div className="patient-grid">
        <div className="panel patient-simple-card">
          <div className="section-kicker">UPCOMING</div>
          <h3>Your appointments</h3>
          {patientAppointments.length === 0 ? <div className="empty-state">No appointments in the demo record.</div> : patientAppointments.map((apt) => (
            <div className="patient-appointment" key={apt.id}>
              <div className="date-tile"><CalendarDays size={19} /><span>{apt.date.split(" ")[0]}</span></div>
              <div>
                <strong>{apt.type}</strong>
                <span>{apt.date} · {apt.time}</span>
              </div>
              <div className="patient-appointment-action">
                <StatusPill tone={STATUS_TONE[apt.status] || "neutral"}>{formatStatus(apt.status)}</StatusPill>
                {apt.status === "SCHEDULED" && <button className="small-action" onClick={() => onConfirm(apt.id)}>Confirm</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="panel patient-simple-card">
          <div className="section-kicker">THIS WEEK</div>
          <h3>Things to keep moving</h3>
          {patientTasks.length === 0 ? <div className="empty-state">Nothing requiring action right now.</div> : patientTasks.map((task) => (
            <div className="simple-task" key={task.id}>
              <div className="simple-task-icon"><ListChecks size={17} /></div>
              <div><strong>{task.title}</strong><span>{task.detail}</span></div>
              <StatusPill tone={STATUS_TONE[task.status] || "neutral"}>{formatStatus(task.status)}</StatusPill>
            </div>
          ))}
        </div>
      </div>

      <div className="patient-help">
        <div>
          <strong>Need help?</strong>
          <span>Your request goes to the care team. MaatriLoop does not provide medical advice.</span>
        </div>
        <div className="workflow-actions">
          <button className="secondary-button" onClick={onMessage}><MessageCircle size={16} /> Message care team</button>
          <button className="primary-button" onClick={onHelp}><Phone size={16} /> Call health worker</button>
        </div>
      </div>
    </section>
  );
}

function AdminWorkspace({ tasks, appointments, messages, audit, onGovernance }) {
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const missed = appointments.filter((a) => a.status === "MISSED").length;
  return (
    <section className="workspace-stack">
      <div className="admin-grid">
        <Metric label="Workflow tasks" value={String(tasks.length).padStart(2, "0")} detail="synthetic records" tone="blue" />
        <Metric label="Appointments" value={String(appointments.length).padStart(2, "0")} detail={`${missed} missed`} tone="amber" />
        <Metric label="Completed" value={String(completed).padStart(2, "0")} detail="workflow tasks" tone="green" />
        <Metric label="Messages" value={String(messages.length).padStart(2, "0")} detail="demo events" tone="rose" />
      </div>

      <div className="admin-columns">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="section-kicker">WORKFLOW HEALTH</div>
              <h3>Care-loop operations</h3>
            </div>
            <StatusPill tone="green">Operational</StatusPill>
          </div>
          <div className="health-list">
            {[
              ["Tasks with owner", "100%", "green"],
              ["Missed appointments routed", "100%", "green"],
              ["Communication gateway", "Demo", "amber"],
              ["Clinical decision support", "Disabled", "blue"]
            ].map(([label, value, tone]) => (
              <div className="health-row" key={label}><span>{label}</span><StatusPill tone={tone}>{value}</StatusPill></div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="section-kicker">AUDIT TRAIL</div>
              <h3>Recent workflow events</h3>
            </div>
            <ShieldCheck size={17} />
          </div>
          <div className="audit-list">
            {audit.slice(0, 6).map((item, i) => (
              <div className="audit-row" key={`${item.time}-${i}`}>
                <span>{item.time}</span>
                <div><strong>{item.actor}</strong><p>{item.action}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="security-banner">
        <div className="security-icon"><ShieldCheck size={20} /></div>
        <div>
          <strong>Privacy-by-design demo mode</strong>
          <span>Only synthetic data is present. Production deployment needs authentication, role-based access, server-side secrets, encryption, audit logs, retention controls and approved healthcare data governance.</span>
        </div>
        <button className="secondary-button" onClick={onGovernance}><ShieldCheck size={15} /> View controls</button>
      </div>
    </section>
  );
}

function GovernancePage({ onGovernance }) {
  return (
    <section className="workspace-stack">
      <div className="frontline-hero">
        <div>
          <div className="section-kicker">SETTINGS & GOVERNANCE</div>
          <h2>Built for human-controlled workflows.</h2>
          <p>The prototype separates workflow truth from the AI communication layer and keeps sensitive integration work behind a backend boundary.</p>
        </div>
        <button className="primary-button" onClick={onGovernance}><ShieldCheck size={17} /> Security checklist</button>
      </div>

      <div className="governance-grid">
        {[
          ["Synthetic demo data", "Enabled", "No real patient records are used in this prototype.", "green", Database],
          ["Role-based access", "Planned", "Doctor, frontline, patient and admin permissions must be enforced server-side.", "amber", UserRound],
          ["Audit logging", "Demo", "Workflow events are visible; production logs belong on the backend.", "blue", ClipboardCheck],
          ["Sarvam gateway", "Demo mode", "API keys must stay server-side; only approved workflow content should reach AI services.", "rose", Sparkles]
        ].map(([title, status, copy, tone, Icon]) => (
          <div className="governance-card" key={title}>
            <div className="governance-icon"><Icon size={18} /></div>
            <div><strong>{title}</strong><p>{copy}</p></div>
            <StatusPill tone={tone}>{status}</StatusPill>
          </div>
        ))}
      </div>
    </section>
  );
}

function AppointmentModal({ patients, onClose, onCreate }) {
  const [patientId, setPatientId] = useState(patients[0].id);
  const [date, setDate] = useState("14 Oct 2026");
  const [time, setTime] = useState("10:00 AM");
  const [type, setType] = useState("ANC contact");

  return (
    <Modal title="Create appointment" kicker="WORKFLOW EVENT" onClose={onClose}>
      <p className="modal-copy">Creating an appointment also creates a confirmation task. The workflow engine, not the AI layer, remains the source of truth.</p>
      <div className="form-grid">
        <label>Patient<select value={patientId} onChange={(e) => setPatientId(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}</select></label>
        <label>Appointment type<select value={type} onChange={(e) => setType(e.target.value)}><option>ANC contact</option><option>Follow-up</option><option>Report review</option></select></label>
        <label>Date<input value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label>Time<input value={time} onChange={(e) => setTime(e.target.value)} /></label>
      </div>
      <div className="workflow-preview">
        <div><span>1</span><strong>Appointment record</strong></div>
        <ArrowRight size={14} />
        <div><span>2</span><strong>Confirmation task</strong></div>
        <ArrowRight size={14} />
        <div><span>3</span><strong>Patient communication</strong></div>
        <ArrowRight size={14} />
        <div><span>4</span><strong>Frontline escalation if unresolved</strong></div>
      </div>
      <button className="primary-button full" onClick={() => onCreate({ patientId, date, time, type })}><CalendarPlus size={17} /> Create & queue confirmation</button>
    </Modal>
  );
}

function VoiceModal({ captured, onCapture, onClose }) {
  return (
    <Modal title="Capture a workflow update" kicker="SARVAM VOICE GATEWAY · DEMO" onClose={onClose}>
      <div className="voice-orb"><Mic size={28} /></div>
      <p className="modal-copy">In production, the browser/mobile client would send audio to your backend. The backend calls Sarvam STT, then a constrained structured-event layer converts approved operational language into a workflow event for human review.</p>
      <div className="voice-pipeline">
        <span>Voice</span><ArrowRight size={14} /><span>Sarvam STT</span><ArrowRight size={14} /><span>Structured event</span><ArrowRight size={14} /><span>Human review</span>
      </div>
      <div className="voice-example"><Headphones size={16} /><span>“Asha's appointment was missed because transport was unavailable.”</span></div>
      {captured && (
        <div className="captured-event">
          <div className="section-kicker">CAPTURED WORKFLOW EVENT</div>
          <h3>Operational update ready for review</h3>
          <div className="event-grid">
            <span>event</span><strong>MISSED_APPOINTMENT</strong>
            <span>reason</span><strong>TRANSPORT</strong>
            <span>requires_followup</span><strong>true</strong>
          </div>
          <StatusPill tone="green">Human review required before task update</StatusPill>
        </div>
      )}
      <button className="primary-button full" onClick={onCapture}><Mic size={17} /> {captured ? "Capture again" : "Start recording (demo)"}</button>
      <div className="microcopy"><ShieldCheck size={13} /> No API key is exposed in the browser.</div>
    </Modal>
  );
}

function MessageModal({ patient, language, setLanguage, composer, setComposer, onSend, onClose }) {
  const examples = {
    Marathi: "नमस्कार, तुमची पुढील भेट १४ ऑक्टोबर रोजी सकाळी १० वाजता आहे.",
    Hindi: "नमस्ते, आपकी अगली अपॉइंटमेंट 14 अक्टूबर को सुबह 10 बजे है।",
    English: "Hello, your next appointment is on 14 October at 10:00 AM."
  };
  return (
    <Modal title={`Message · ${patient.name}`} kicker="APPROVED COMMUNICATION" onClose={onClose}>
      <div className="translation-bar">
        <Languages size={16} />
        <span>Translation layer</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option>Marathi</option><option>Hindi</option><option>English</option>
        </select>
      </div>
      <div className="translation-preview">
        <div className="section-kicker">PREVIEW</div>
        <p>{examples[language]}</p>
      </div>
      <textarea value={composer} onChange={(e) => setComposer(e.target.value)} placeholder="Enter approved workflow text…" />
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={() => { onSend(); onClose(); }}><Send size={16} /> Queue message</button>
      </div>
      <div className="microcopy"><ShieldCheck size={13} /> Sarvam should translate approved content, not invent clinical content.</div>
    </Modal>
  );
}

function GovernanceModal({ audit, onClose }) {
  return (
    <Modal title="Security & data protection" kicker="PRODUCTION READINESS" onClose={onClose} wide>
      <div className="security-grid">
        {[
          ["1", "Authentication", "Use a real identity provider. Never rely on the client-side role switcher for authorization."],
          ["2", "RBAC", "Enforce doctor/frontline/patient/admin permissions on the backend and database."],
          ["3", "Secrets", "SARVAM_API_KEY and DATABASE_URL stay in server environment secrets, never Vite source."],
          ["4", "Data minimization", "Send only the approved workflow text/audio needed for the communication task."],
          ["5", "Auditability", "Record who created, changed, communicated or closed each workflow event."],
          ["6", "Retention", "Define retention/deletion rules with the hospital and applicable privacy requirements before real data."],
          ["7", "Encryption", "Use TLS in transit and encryption at rest for production healthcare data."],
          ["8", "Synthetic demo", "Keep this hackathon build on synthetic patients until the governance layer exists."]
        ].map(([n, title, copy]) => (
          <div className="security-item" key={n}>
            <span>{n}</span><div><strong>{title}</strong><p>{copy}</p></div>
          </div>
        ))}
      </div>
      <div className="audit-preview">
        <div className="section-kicker">DEMO AUDIT TRAIL</div>
        {audit.slice(0, 5).map((x, i) => <div key={i}><span>{x.time}</span><strong>{x.actor}</strong><p>{x.action}</p></div>)}
      </div>
    </Modal>
  );
}

function formatStatus(status) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function avatarTone(accent) {
  if (accent === "rose") return "rose";
  if (accent === "amber") return "amber";
  return "sage";
}

export default App;

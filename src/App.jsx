import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileText,
  Headphones,
  LayoutDashboard,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
  Volume2,
  X,
} from "lucide-react";

const patients = [
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
    accent: "green",
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
    accent: "amber",
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
    accent: "rose",
  },
];

const tasks = [
  {
    id: 1,
    patient: "Meena Patil",
    type: "Report received",
    detail: "Document is ready for review",
    status: "Needs action",
    tone: "rose",
    icon: FileText,
  },
  {
    id: 2,
    patient: "Pooja Shaikh",
    type: "Appointment missed",
    detail: "Patient has not confirmed a new slot",
    status: "Needs action",
    tone: "amber",
    icon: CalendarDays,
  },
  {
    id: 3,
    patient: "Asha Kulkarni",
    type: "Appointment confirmed",
    detail: "14 Oct · 10:00 AM",
    status: "Completed",
    tone: "green",
    icon: Check,
  },
];

const timeline = [
  { date: "04 Oct", title: "ANC contact", meta: "Completed", state: "done" },
  { date: "09 Oct", title: "Investigation", meta: "Task created", state: "active" },
  { date: "12 Oct", title: "Report upload", meta: "Awaiting document", state: "pending" },
  { date: "14 Oct", title: "Doctor review", meta: "Scheduled", state: "pending" },
  { date: "17 Oct", title: "Follow-up", meta: "Scheduled", state: "pending" },
];

function StatusPill({ children, tone = "neutral" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Avatar({ initials, size = "md", tone = "sage" }) {
  return <div className={`avatar avatar-${size} avatar-${tone}`}>{initials}</div>;
}

function App() {
  const [reasonOpen, setReasonOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  
  const [demoTasks, setDemoTasks] = useState([
  {
    id: "task-001",
    patient: "Pooja Shaikh",
    title: "Appointment missed",
    status: "MISSED",
    priority: "HIGH",
    assignee: "Frontline",
  },
  {
    id: "task-002",
    patient: "Meena Patil",
    title: "Report received",
    status: "PENDING",
    priority: "NORMAL",
    assignee: "Doctor",
  },
]);
  const [role, setRole] = useState("Doctor");
  const [activeNav, setActiveNav] = useState("Overview");
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [composer, setComposer] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [toast, setToast] = useState("");

  const roleLabel = useMemo(() => {
    if (role === "Patient") return "My care journey";
    if (role === "Frontline") return "Today's task queue";
    if (role === "Admin") return "Care operations";
    return "Care team workspace";
  }, [role]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <div className="app-shell">
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
            ["Messages", MessageCircle],
          ].map(([label, Icon]) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Tasks" && <span className="nav-count">4</span>}
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

        <button className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="user-card">
          <Avatar initials="GS" size="sm" />
          <div className="user-copy">
            <strong>Care team</strong>
            <span>Sion demo workspace</span>
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
              <Avatar initials="GS" size="sm" />
              <span>Gauri</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div className="content">
          <section className="hero-row">
            <div>
              <div className="eyebrow">MONDAY · 03 OCTOBER 2026</div>
              <h1>{roleLabel}</h1>
              <p className="hero-copy">
                Keep every operational step visible, owned and moving — from appointment to follow-up.
              </p>
            </div>

            <div className="role-switcher">
              {["Doctor", "Frontline", "Patient", "Admin"].map((item) => (
                <button
                  key={item}
                  className={role === item ? "selected" : ""}
                  onClick={() => setRole(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="metrics">
            <Metric label="Open tasks" value="12" detail="4 need action" tone="rose" />
            <Metric label="Due today" value="07" detail="2 approaching" tone="amber" />
            <Metric label="Completed" value="91%" detail="this care cycle" tone="green" />
            <Metric label="Patients followed up" value="28" detail="this week" tone="blue" />
          </section>

          <section className="grid-main">
            <div className="column">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">ATTENTION QUEUE</div>
                  <h2>What needs you now</h2>
                </div>
                <button className="text-button" onClick={() => setActiveNav("Tasks")}>View all <ArrowRight size={15} /></button>
              </div>

              <div className="task-stack">
                {tasks.map((task) => {
                  const workflowTask =
                    task.patient === "Pooja Shaikh"
                     ? demoTasks.find((item) => item.id === "task-001")
                     : null;
                  const Icon = task.icon;
                  return (
                    <div className="task-card" key={task.id}>
                      <div className={`task-icon task-${task.tone}`}><Icon size={18} /></div>
                      <div className="task-body">
                        <div className="task-topline">
                          <strong>{task.patient}</strong>
                          <StatusPill tone={workflowTask?.status === "IN_PROGRESS" ? "green" : task.tone}>
                            {workflowTask?.status === "IN_PROGRESS" ? "In progress" : task.status}
                          </StatusPill>
                        </div>
                        <div className="task-title">{task.type}</div>
                        <div className="task-detail">{task.detail}</div>
                      </div>
                      
                      <button
  className="small-action"
  onClick={() => {
    if (task.patient === "Pooja Shaikh") {
      setDemoTasks((tasks) =>
        tasks.map((item) =>
          item.id === "task-001"
            ? { ...item, status: "IN_PROGRESS" }
            : item
        )
      );
    } else {
      notify(`${task.patient}: action opened`);
    }
  }}
>
  {workflowTask?.status === "IN_PROGRESS"
    ? "Continue"
    : task.type === "Appointment missed"
      ? "Respond"
      : task.status === "Completed"
        ? "View"
        : "Review"}
</button>
                    </div>
                  );
                })}
              </div>

              {demoTasks.some(
  (task) => task.id === "task-001" && task.status === "IN_PROGRESS"
) && (
  <div className="workflow-action-card">
    <div>
      <div className="section-kicker">FRONTLINE ACTION</div>
      <h3>Pooja Shaikh needs follow-up</h3>
      {demoTasks.find((task) => task.id === "task-001")?.reason && (
  <p>
    <strong>Recorded reason:</strong>{" "}
    {demoTasks.find((task) => task.id === "task-001")?.reason}
  </p>
)}
      <p>
        Appointment was missed. Record the operational reason and move the
        task toward closure.
      </p>
    </div>

    <div className="workflow-actions">
      <button
        className="small-action"
        onClick={() => setReasonOpen(true)}
      >
        Record reason
      </button>

      <button
        className="small-action primary-action"
        onClick={() => {
          setDemoTasks((tasks) =>
            tasks.map((task) =>
              task.id === "task-001"
                ? { ...task, status: "COMPLETED" }
                : task
            )
          );
          notify("Care loop closed — follow-up completed");
        }}
      >
        Mark resolved
      </button>
    </div>
  </div>
)}
              {reasonOpen && (
  <div className="workflow-action-card">
    <div>
      <div className="section-kicker">FOLLOW-UP OUTCOME</div>
      <h3>Why was the appointment missed?</h3>
      <p>
        Select the operational reason recorded by the frontline worker.
      </p>
    </div>

    <div className="workflow-actions">
      {[
        "Transport unavailable",
        "Scheduling conflict",
        "Could not reach patient",
        "Other",
      ].map((reason) => (
        <button
          key={reason}
          className="small-action"
          onClick={() => {
            setSelectedReason(reason);
            setDemoTasks((tasks) =>
              tasks.map((task) =>
                task.id === "task-001"
                ? { ...task, reason, status: "IN_PROGRESS" }
                : task
    )
  );
          }}
        >
          {reason}
        </button>
      ))}
    </div>
  </div>
)}
              
              <div className="section-heading patient-heading">
                <div>
                  <div className="section-kicker">PATIENTS</div>
                  <h2>Active care journeys</h2>
                </div>
                <button className="round-add" onClick={() => notify("Registration flow opened")}><Plus size={17} /></button>
              </div>

              <div className="patient-list">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    className={`patient-row ${selectedPatient.id === patient.id ? "selected-row" : ""}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <Avatar initials={patient.initials} tone={patient.accent === "rose" ? "rose" : patient.accent === "amber" ? "amber" : "sage"} />
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
              <div className="panel patient-panel">
                <div className="panel-header">
                  <div className="section-kicker">SELECTED PATIENT</div>
                  <button className="icon-button subtle"><MoreHorizontal size={18} /></button>
                </div>

                <div className="patient-profile">
                  <Avatar initials={selectedPatient.initials} size="lg" tone={selectedPatient.accent === "rose" ? "rose" : selectedPatient.accent === "amber" ? "amber" : "sage"} />
                  <div>
                    <h3>{selectedPatient.name}</h3>
                    <p>{selectedPatient.id} · {selectedPatient.age} years</p>
                  </div>
                  <StatusPill tone="green">On track</StatusPill>
                </div>

                <div className="profile-facts">
                  <div><span>Pregnancy</span><strong>{selectedPatient.week}</strong></div>
                  <div><span>Language</span><strong>{selectedPatient.language}</strong></div>
                  <div><span>Next touchpoint</span><strong>{selectedPatient.nextDate}</strong></div>
                </div>

                <div className="care-clock">
                  <div className="clock-header">
                    <div>
                      <div className="section-kicker">CARE CLOCK</div>
                      <strong>Pregnancy journey</strong>
                    </div>
                    <span className="clock-progress">3 / 5</span>
                  </div>

                  <div className="timeline">
                    {timeline.map((item, index) => (
                      <div className="timeline-item" key={item.date}>
                        <div className={`timeline-dot ${item.state}`}><span /></div>
                        {index !== timeline.length - 1 && <div className="timeline-line" />}
                        <div className="timeline-copy">
                          <span>{item.date}</span>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-actions">
                  <button className="primary-button" onClick={() => notify("Task created in demo workflow")}><Plus size={17} /> Create task</button>
                  <button className="secondary-button" onClick={() => setShowVoice(true)}><Mic size={17} /> Voice note</button>
                </div>
              </div>

              <div className="panel communication-panel">
                <div className="panel-header">
                  <div>
                    <div className="section-kicker">COMMUNICATION LOOP</div>
                    <h3>One workflow, many channels</h3>
                  </div>
                  <div className="channel-status"><span /> Ready</div>
                </div>

                <div className="channel-grid">
                  <Channel icon={MessageCircle} label="WhatsApp" state="Simulated" />
                  <Channel icon={Phone} label="IVR / Voice" state="Ready" />
                  <Channel icon={Volume2} label="In-app" state="Ready" />
                </div>

                <div className="message-preview">
                  <div className="message-meta"><span>Approved template · Marathi</span><span>10:42 AM</span></div>
                  <p>“नमस्कार आशा, तुमची पुढील भेट १४ ऑक्टोबर रोजी सकाळी १० वाजता आहे.”</p>
                  <div className="message-footer">
                    <StatusPill tone="green">Ready to send</StatusPill>
                    <button onClick={() => notify("Demo message sent")}><Send size={14} /> Send</button>
                  </div>
                </div>

                <div className="composer">
                  <input
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Write a workflow message…"
                  />
                  <button onClick={() => { if (composer.trim()) { notify("Message queued in demo"); setComposer(""); } }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </aside>
          </section>

          <section className="bottom-strip">
            <div className="guardrail">
              <ShieldCheck size={18} />
              <div>
                <strong>Assistive, not diagnostic</strong>
                <span>AI transforms approved workflow information into language, voice and structured tasks. It does not diagnose, recommend treatment or make clinical decisions.</span>
              </div>
            </div>
            <div className="sarvam-chip"><Sparkles size={15} /> Sarvam AI layer</div>
          </section>
        </div>
      </main>

      {showVoice && (
        <div className="modal-backdrop" onClick={() => setShowVoice(false)}>
          <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowVoice(false)}><X size={18} /></button>
            <div className="voice-orb"><Mic size={28} /></div>
            <div className="section-kicker">SARVAM VOICE CAPTURE</div>
            <h2>Record a workflow update</h2>
            <p>Speak naturally. The demo converts the note into a structured operational event — not a clinical recommendation.</p>
            <div className="voice-example">
              <Headphones size={16} />
              <span>“Asha's appointment was missed because transport was unavailable.”</span>
            </div>
            <button className="primary-button full" onClick={() => { setShowVoice(false); notify("Voice capture simulated → task created"); }}>
              <Mic size={17} /> Start recording
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
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

function Channel({ icon: Icon, label, state }) {
  return (
    <div className="channel">
      <div className="channel-icon"><Icon size={17} /></div>
      <div><strong>{label}</strong><span>{state}</span></div>
    </div>
  );
}

export default App;

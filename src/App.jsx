import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import {
  ArrowRight,
  Map,
  Menu,
  X,
  ShieldCheck,
  Users,
  MapPin,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

import IssueMap from "./components/IssueMap";
import ReportIssue from "./components/ReportIssue";
import "./App.css";
import Dashboard from "./components/Dashboard";
import CommunityVoice from "./components/CommunityVoice";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import WorkerLogin from "./components/WorkerLogin";
import WorkerDashboard from "./components/WorkerDashboard";

const ADMIN_UID = "atjG8XxUd0WxzFIxfzzVXSCjtug2";

const initialIssues = [
  {
    id: "CC-001",
    title: "Garbage dumping",
    category: "Waste & Garbage",
    description:
      "Garbage has been dumped beside the roadside and needs proper disposal.",
    status: "Reported",
    severity: "High",
    reporter: "Community Member",
    date: "2026-09-08",
    location: [28.6139, 77.209],
    photo: null,
  },
  {
    id: "CC-002",
    title: "Potholes",
    category: "Road & Footpath",
    description:
      "A damaged section of the footpath is creating difficulty for pedestrians.",
    status: "Under Review",
    severity: "Medium",
    reporter: "Community Member",
    date: "2026-09-08",
    location: [28.6165, 77.21],
    photo: null,
  },
  {
    id: "CC-003",
    title: "Streetlight issue",
    category: "Streetlight",
    description:
      "A streetlight is not functioning properly in this area.",
    status: "Reported",
    severity: "Medium",
    reporter: "Community Member",
    date: "2026-09-08",
    location: [28.6112, 77.215],
    photo: null,
  },
  {
    id: "CC-004",
    title: "Drainage issue",
    category: "Drainage",
    description:
      "A damaged or leaking drainage section is affecting the surrounding public area.",
    status: "Reported",
    severity: "High",
    reporter: "Community Member",
    date: "2026-09-08",
    location: [28.6148, 77.2125],
    photo: null,
  },
  {
    id: "CC-005",
    title: "Water supply issue",
    category: "Water & Supply",
    description:
      "A public water supply point is damaged or not functioning properly and needs attention.",
    status: "Reported",
    severity: "Medium",
    reporter: "Community Member",
    date: "2026-09-09",
    location: [28.6172, 77.2138],
    photo: null,
  },
  {
    id: "CC-006",
    title: "Damaged Footpath",
    category: "Road & Footpath",
    description:
      "The footpath is broken or uneven, making it difficult and unsafe for pedestrians.",
    status: "Reported",
    severity: "High",
    reporter: "Community Member",
    date: "2026-09-09",
    location: [28.618, 77.214],
    photo: null,
  },
];

function App() {
  const [issues, setIssues] = useState(() => {
    try {
      const savedIssues = localStorage.getItem("civicconnect_issues");

      if (savedIssues) {
        const parsedIssues = JSON.parse(savedIssues);

        const savedIds = new Set(
          parsedIssues.map((issue) => issue.id)
        );

        const missingDemoIssues = initialIssues.filter(
          (issue) => !savedIds.has(issue.id)
        );

        const allIssues = [
          ...parsedIssues,
          ...missingDemoIssues,
        ];

        const updatedIssues = allIssues.map((issue) =>
          issue.id === "CC-002"
            ? {
                ...issue,
                title: "Potholes",
              }
            : issue
        );

        return updatedIssues.filter(
          (issue) =>
            issue.id !== "CC-337444-1772" &&
            issue.id !== "CC-107005-1745"
        );
      }

      return initialIssues;
    } catch (error) {
      console.error(
        "Unable to load saved CivicConnect issues:",
        error
      );

      return initialIssues;
    }
  });

  const [civicMode, setCivicMode] = useState("before");
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const [showWorkerLogin, setShowWorkerLogin] = useState(false);
  const [workerUser, setWorkerUser] = useState(null);

  // Save issues whenever the issue list changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "civicconnect_issues",
        JSON.stringify(issues)
      );
    } catch (error) {
      console.error(
        "Unable to save CivicConnect issues:",
        error
      );
    }
  }, [issues]);

  // LIVE FIRESTORE REPORTS
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "issues"),
      (snapshot) => {
        const firestoreIssues = snapshot.docs.map(
          (issueDoc) => ({
            id: issueDoc.id,
            ...issueDoc.data(),
          })
        );

        const firestoreIds = new Set(
          firestoreIssues.map((issue) => issue.id)
        );

        const demoIssues = initialIssues.filter(
          (issue) => !firestoreIds.has(issue.id)
        );

        setIssues([
          ...demoIssues,
          ...firestoreIssues,
        ]);
      },
      (error) => {
        console.error(
          "Unable to load live Firestore issues:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ADD NEW ISSUE
  const handleIssueSubmitted = (newIssue) => {
    setIssues((previousIssues) => [
      ...previousIssues,
      newIssue,
    ]);
  };

  // UPDATE EXISTING ISSUE
  const handleIssueUpdated = (updatedIssue) => {
    setIssues((previousIssues) =>
      previousIssues.map((issue) =>
        issue.id === updatedIssue.id
          ? {
              ...issue,
              ...updatedIssue,
            }
          : issue
      )
    );
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setMenuOpen(false);
  };

  if (adminUser) {
    return (
      <AdminDashboard
        user={adminUser}
        onLogout={() => {
          setAdminUser(null);
          setShowAdminLogin(false);
        }}
      />
    );
  }

  if (workerUser) {
  return (
    <WorkerDashboard
      user={workerUser}
      onLogout={() => {
        setWorkerUser(null);
        setShowWorkerLogin(false);
      }}
    />
  );
}

  return showWorkerLogin ? (
    <div className="admin-page">
      <button
        type="button"
        className="admin-back-button"
        onClick={() => setShowWorkerLogin(false)}
      >
        ← Back to CivicConnect
      </button>

      <WorkerLogin
        onLogin={(user) => {
          setWorkerUser(user);
          setShowWorkerLogin(false);
        }}
      />
    </div>
  ) : showAdminLogin ? (
    <div className="admin-page">
      <button
        type="button"
        className="admin-back-button"
        onClick={() => setShowAdminLogin(false)}
      >
        ← Back to CivicConnect
      </button>

      <AdminLogin
        onLogin={(user) => {
          if (user?.uid !== ADMIN_UID) {
            alert(
              "Access denied. This account is not authorized as an admin."
            );
            return;
          }

          setAdminUser(user);
          setShowAdminLogin(false);
        }}
      />
    </div>
  ) : (
    <div>
      {/* DEMO DATA BAR */}
      <div className="demo-bar">
        <span className="demo-dot"></span>
        DEMO DATA
        <span className="demo-separator">•</span>
        CivicConnect Community Engagement Project
      </div>

      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-inner">
          <button
            className="brand"
            onClick={() => scrollToSection("home")}
            aria-label="CivicConnect Home"
          >
            <span className="brand-mark">
              <MapPin size={19} strokeWidth={2.4} />
            </span>

            <span className="brand-text">
              <strong>Civic</strong>Connect
            </span>
          </button>

          <nav
            className={`nav-links ${
              menuOpen ? "mobile-open" : ""
            }`}
          >
            <button onClick={() => scrollToSection("home")}>
              Home
            </button>

            <button onClick={() => scrollToSection("process")}>
              How It Works
            </button>

            <button onClick={() => scrollToSection("issues")}>
              Issues
            </button>

            <button onClick={() => scrollToSection("map")}>
              Map
            </button>

            <button onClick={() => scrollToSection("dashboard")}>
              Dashboard
            </button>

            <button onClick={() => scrollToSection("civic-sense")}>
              Civic Sense
            </button>

            <button onClick={() => scrollToSection("community")}>
              Community
            </button>

            <button onClick={() => scrollToSection("about")}>
              About
            </button>

            <button
              onClick={() => {
                setShowAdminLogin(true);
                setMenuOpen(false);
              }}
            >
              Admin
            </button>

            <button
              onClick={() => {
                setShowWorkerLogin(true);
                setMenuOpen(false);
              }}
            >
              Worker
            </button>

            <button
              className="mobile-report"
              onClick={() => scrollToSection("report")}
            >
              Report an Issue
              <ArrowRight size={17} />
            </button>
          </nav>

          <div className="nav-actions">
            <button
              className="nav-report"
              onClick={() => scrollToSection("report")}
            >
              Report an Issue
              <ArrowRight size={16} />
            </button>

            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
            >
              {menuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>
      </header>

      <style>{`
        .process-card {
          width: 100%;
          border: 0;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          transition:
            transform .25s ease,
            box-shadow .25s ease,
            border-color .25s ease;
        }

        .process-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 42px rgba(20, 47, 35, .12);
        }

        .process-card:focus-visible {
          outline: 3px solid rgba(32, 91, 62, .28);
          outline-offset: 4px;
        }

        .journey-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(10, 20, 15, .58);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: civicModalFade .2s ease both;
        }

        .journey-modal {
          position: relative;
          width: min(620px, 100%);
          max-height: min(720px, 90vh);
          overflow: auto;
          padding: 34px;
          border: 1px solid rgba(255,255,255,.58);
          border-radius: 28px;
          background: rgba(250, 248, 242, .97);
          box-shadow: 0 32px 90px rgba(0,0,0,.28);
          animation: civicModalUp .28s cubic-bezier(.2,.8,.2,1) both;
        }

        .journey-modal-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(20,47,35,.12);
          border-radius: 50%;
          background: rgba(255,255,255,.72);
          color: #163d2b;
          cursor: pointer;
          transition:
            transform .2s ease,
            background .2s ease;
        }

        .journey-modal-close:hover {
          transform: rotate(5deg) scale(1.05);
          background: #fff;
        }

        .journey-modal-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .journey-modal-number {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          background: #173f2d;
          color: #fff;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .journey-modal-kicker {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .16em;
          color: #6c766f;
        }

        .journey-modal h3 {
          margin: 0 0 12px;
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1.02;
          letter-spacing: -.045em;
          color: #142c21;
        }

        .journey-modal-summary {
          margin: 0 0 14px;
          font-size: 18px;
          line-height: 1.55;
          font-weight: 700;
          color: #30483b;
        }

        .journey-modal-detail {
          margin: 0;
          font-size: 15px;
          line-height: 1.8;
          color: #5e6962;
        }

        .journey-modal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .journey-modal-secondary {
          min-height: 48px;
          padding: 0 20px;
          border: 1px solid rgba(20,47,35,.16);
          border-radius: 999px;
          background: transparent;
          color: #173f2d;
          font-weight: 700;
          cursor: pointer;
        }

        @keyframes civicModalFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes civicModalUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .journey-modal {
            padding: 28px 22px 24px;
            border-radius: 22px;
          }

          .journey-modal-actions .primary-button,
          .journey-modal-secondary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <main>
        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-background">
            <div className="hero-glow hero-glow-one"></div>
            <div className="hero-glow hero-glow-two"></div>
            <div className="grid-pattern"></div>
          </div>

          <div className="hero-container">
            <div className="hero-content">
              <div className="eyebrow">
                <span className="eyebrow-icon">
                  <ShieldCheck size={14} />
                </span>

                COMMUNITY ENGAGEMENT PROJECT
              </div>

              <h1>
                Better neighbourhoods
                <span> start with better civic sense.</span>
              </h1>

              <p className="hero-description">
                Identify local problems, understand their impact,
                encourage responsible behaviour and document real
                improvements in our neighbourhood.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-button"
                  onClick={() => scrollToSection("report")}
                >
                  Report an Issue
                  <ArrowRight size={18} />
                </button>

                <button
                  className="secondary-button"
                  onClick={() => scrollToSection("map")}
                >
                  <Map size={18} />
                  Explore Civic Map
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-avatars">
                  <span>01</span>
                  <span>02</span>
                  <span>03</span>
                </div>

                <div>
                  <strong>Field-based project</strong>

                  <small>
                    Powered by community observations & real field data
                  </small>
                </div>
              </div>
            </div>

            {/* HERO VISUAL */}
            <div className="hero-visual">
              <div className="scene-glow"></div>

              <div className="scene-card">
                <div className="scene-topbar">
                  <div>
                    <span className="scene-label">
                      LIVE FIELD VIEW
                    </span>

                    <strong>
                      Neighbourhood Overview
                    </strong>
                  </div>

                  <div className="live-indicator">
                    <span></span>
                    DEMO
                  </div>
                </div>

                <div className="neighbourhood">
                  <div className="sky"></div>

                  {/* BUILDINGS */}
                  <div className="building building-one">
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                  </div>

                  <div className="building building-two">
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                  </div>

                  <div className="building building-three">
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                    <div className="building-window"></div>
                  </div>

                  {/* TREES */}
                  <div className="tree tree-one">
                    <div className="tree-top"></div>
                    <div className="tree-trunk"></div>
                  </div>

                  <div className="tree tree-two">
                    <div className="tree-top"></div>
                    <div className="tree-trunk"></div>
                  </div>

                  <div className="tree tree-three">
                    <div className="tree-top"></div>
                    <div className="tree-trunk"></div>
                  </div>

                  {/* ROAD */}
                  <div className="road">
                    <div className="road-line"></div>
                  </div>

                  {/* FOOTPATH */}
                  <div className="footpath"></div>

                  {/* BIN */}
                  <div className="bin">
                    <div className="bin-lid"></div>
                    <div className="bin-body"></div>
                  </div>

                  {/* STREETLIGHT */}
                  <div className="streetlight">
                    <div className="light-head"></div>
                    <div className="light-pole"></div>
                  </div>

                  {/* MAP PINS */}
                  <div className="map-pin pin-one">
                    <MapPin size={22} />
                  </div>

                  <div className="map-pin pin-two">
                    <MapPin size={22} />
                  </div>

                  <div className="map-pin pin-three">
                    <MapPin size={22} />
                  </div>

                  {/* PEOPLE */}
                  <div className="person person-one">
                    <div className="person-head"></div>
                    <div className="person-body"></div>
                  </div>

                  <div className="person person-two">
                    <div className="person-head"></div>
                    <div className="person-body"></div>
                  </div>

                  {/* FLOATING STATUS */}
                  <div className="scene-status status-left">
                    <CheckCircle2 size={15} />

                    <div>
                      <strong>
                        {issues.filter(
                          (issue) =>
                            issue.status === "Improved"
                        ).length}
                      </strong>

                      <span>
                        Areas improved
                      </span>
                    </div>
                  </div>

                  <div className="scene-status status-right">
                    <MapPin size={15} />

                    <div>
                      <strong>
                        {issues.length}
                      </strong>

                      <span>
                        Issues documented
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FLOATING DATA CARDS */}
              <div className="floating-card floating-card-one">
                <div className="floating-icon green">
                  <Users size={18} />
                </div>

                <div>
                  <strong>
                    {issues.length}
                  </strong>

                  <span>
                    Issues documented
                  </span>
                </div>
              </div>

              <div className="floating-card floating-card-two">
                <div className="floating-icon dark">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <strong>
                    {
                      issues.filter(
                        (issue) =>
                          issue.status === "Under Review"
                      ).length
                    }
                  </strong>

                  <span>
                    Under review
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-scroll">
            <span>SCROLL TO EXPLORE</span>
            <ChevronDown size={16} />
          </div>
        </section>

        {/* PROCESS */}
        <section
          className="process-section"
          id="process"
        >
          <div className="section-container">
            <div className="section-heading">
              <span className="section-kicker">
                OUR APPROACH
              </span>

              <h2>
                From observation
                <br />
                <span>to improvement.</span>
              </h2>

              <p>
                CivicConnect connects real field observations
                with community engagement, responsible action
                and measurable follow-up.
              </p>
            </div>

            <div className="process-grid">
              {[
                {
                  number: "01",
                  title: "Observe",
                  text: "Identify visible civic problems in the neighbourhood.",
                  detail:
                    "Start by noticing issues that affect safety, cleanliness, accessibility or everyday public life. Observation is the first step because a problem must be understood before it can be documented responsibly.",
                  target: "issues",
                  action: "Explore Civic Issues",
                },
                {
                  number: "02",
                  title: "Document",
                  text: "Capture photographs, locations and relevant details.",
                  detail:
                    "Record the issue with clear evidence, useful descriptions and location information. CivicConnect keeps documentation focused on the problem rather than publicly identifying or shaming individuals.",
                  target: "report",
                  action: "Report an Issue",
                },
                {
                  number: "03",
                  title: "Engage",
                  text: "Understand concerns and interact with the community.",
                  detail:
                    "Community engagement adds context to field observations. Listening to residents and understanding local concerns helps connect digital reporting with real neighbourhood experiences.",
                  target: "community",
                  action: "Hear Community Voice",
                },
                {
                  number: "04",
                  title: "Act",
                  text: "Promote responsible behaviour and practical action.",
                  detail:
                    "The goal is not only to record problems. Responsible civic behaviour, awareness and practical follow-up can help turn an observation into meaningful action.",
                  target: "civic-sense",
                  action: "Explore Civic Sense",
                },
                {
                  number: "05",
                  title: "Improve",
                  text: "Follow up and document the actual outcome.",
                  detail:
                    "Follow-up makes the project measurable. When an issue changes, the platform can document the action taken, supporting evidence and reported outcome without claiming an unverified government resolution.",
                  target: "dashboard",
                  action: "View Dashboard",
                },
              ].map((step) => (
                <button
                  className="process-card"
                  key={step.number}
                  type="button"
                  onClick={() => setSelectedJourney(step)}
                  aria-label={`Open ${step.title} step details`}
                >
                  <span className="process-number">
                    {step.number}
                  </span>

                  <div className="process-line"></div>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>

                  <ArrowRight
                    className="process-arrow"
                    size={19}
                  />
                </button>
              ))}
            </div>

            {selectedJourney && (
              <div
                className="journey-modal-backdrop"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setSelectedJourney(null);
                  }
                }}
              >
                <div
                  className="journey-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="journey-modal-title"
                >
                  <button
                    type="button"
                    className="journey-modal-close"
                    onClick={() => setSelectedJourney(null)}
                    aria-label="Close journey details"
                  >
                    <X size={20} />
                  </button>

                  <div className="journey-modal-top">
                    <span className="journey-modal-number">
                      {selectedJourney.number}
                    </span>

                    <span className="journey-modal-kicker">
                      CIVICCONNECT JOURNEY
                    </span>
                  </div>

                  <h3 id="journey-modal-title">
                    {selectedJourney.title}
                  </h3>

                  <p className="journey-modal-summary">
                    {selectedJourney.text}
                  </p>

                  <p className="journey-modal-detail">
                    {selectedJourney.detail}
                  </p>

                  <div className="journey-modal-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        const target =
                          selectedJourney.target;

                        setSelectedJourney(null);

                        setTimeout(
                          () => scrollToSection(target),
                          80
                        );
                      }}
                    >
                      {selectedJourney.action}
                      <ArrowRight size={17} />
                    </button>

                    <button
                      type="button"
                      className="journey-modal-secondary"
                      onClick={() =>
                        setSelectedJourney(null)
                      }
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ISSUES */}
        <section
          className="issues-section"
          id="issues"
        >
          <div className="section-container">
            <div className="section-heading centered">
              <span className="section-kicker">
                CIVIC OBSERVATIONS
              </span>

              <h2>
                Understand the problems
                <br />
                <span>around us.</span>
              </h2>

              <p>
                Explore the categories of civic infrastructure
                and civic-sense issues documented through
                fieldwork.
              </p>
            </div>

            <div className="issue-grid">
              {[
                [
                  "01",
                  "Garbage & Littering",
                  "Improper disposal and accumulated waste.",
                ],
                [
                  "02",
                  "Roads & Potholes",
                  "Damaged roads and unsafe surfaces.",
                ],
                [
                  "03",
                  "Footpaths",
                  "Accessibility and pedestrian issues.",
                ],
                [
                  "04",
                  "Streetlights",
                  "Broken or non-functional lighting.",
                ],
                [
                  "05",
                  "Water & Drainage",
                  "Leakage and drainage-related concerns.",
                ],
                [
                  "06",
                  "Cleanliness",
                  "Public-space cleanliness problems.",
                ],
              ].map(
                ([number, title, text]) => (
                  <div
                    className="issue-card"
                    key={number}
                  >
                    <span className="issue-number">
                      {number}
                    </span>

                    <div className="issue-icon">
                      <MapPin size={21} />
                    </div>

                    <h3>{title}</h3>

                    <p>{text}</p>

                    <button
                      onClick={() =>
                        scrollToSection("report")
                      }
                    >
                      Explore
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* CIVIC MAP */}
        <section
          className="map-section"
          id="map"
        >
          <div className="section-container">
            <IssueMap
              issues={issues}
            />
          </div>
        </section>

        {/* CIVIC SENSE */}
        <section
          className="civic-section"
          id="civic-sense"
        >
          <div className="civic-container">
            <div className="civic-copy">
              <span className="section-kicker">
                CIVIC SENSE
              </span>

              <h2>
                Small habits.
                <br />
                <span>Big impact.</span>
              </h2>

              <p>
                Public spaces belong to everyone.
                Responsible everyday behaviour can prevent
                small problems from becoming larger community
                issues.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  scrollToSection("community")
                }
              >
                Learn Responsible Practices
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="civic-visual">
              <div className="civic-orbit orbit-one"></div>
              <div className="civic-orbit orbit-two"></div>

              <div
                className={`civic-circle ${civicMode}`}
              >
                <ShieldCheck size={54} />

                <strong>
                  {civicMode === "before"
                    ? "OBSERVE"
                    : "IMPROVE"}
                </strong>

                <span>
                  {civicMode === "before"
                    ? "CIVIC PROBLEM"
                    : "CIVIC ACTION"}
                </span>
              </div>

              <button
                type="button"
                className={`civic-floating floating-a ${
                  civicMode === "before"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCivicMode("before")
                }
              >
                <CheckCircle2 size={17} />
                Observe the problem
              </button>

              <button
                type="button"
                className={`civic-floating floating-b ${
                  civicMode === "after"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCivicMode("after")
                }
              >
                <CheckCircle2 size={17} />
                Take responsible action
              </button>

              <button
                type="button"
                className={`civic-floating floating-c ${
                  civicMode === "after"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCivicMode("after")
                }
              >
                <CheckCircle2 size={17} />
                Improve public spaces
              </button>
            </div>
          </div>
        </section>

        {/* COMMUNITY VOICE */}
        <CommunityVoice />

        {/* DASHBOARD */}
        <section
          className="dashboard-section"
          id="dashboard"
        >
          <div className="section-container">
            <Dashboard issues={issues} />
          </div>
        </section>

        {/* REPORT ISSUE */}
        <section
          className="report-section"
          id="report"
        >
          <div className="section-container">
            <ReportIssue
              onIssueSubmitted={handleIssueSubmitted}
              onIssueUpdated={handleIssueUpdated}
            />
          </div>
        </section>

        {/* ABOUT */}
        <section
          className="about-section"
          id="about"
        >
          <div className="section-container">
            <div className="about-grid">
              <div>
                <span className="section-kicker">
                  ABOUT THE PROJECT
                </span>

                <h2>
                  Real community.
                  <br />
                  <span>Real fieldwork.</span>
                </h2>
              </div>

              <div className="about-text">
                <p>
                  CivicConnect is a B.Sc. Computer Science
                  Community Engagement Project focused on
                  digitally documenting civic infrastructure
                  and civic-sense issues within a selected
                  neighbourhood.
                </p>

                <p>
                  The platform connects field observation,
                  photography, location data, community
                  interaction, awareness, follow-up and
                  analysis into one transparent digital
                  experience.
                </p>

                <div className="about-methodology">
                  <div className="about-method-step">
                    <span>01</span>
                    <strong>Observe</strong>
                  </div>

                  <div className="about-method-line"></div>

                  <div className="about-method-step">
                    <span>02</span>
                    <strong>Document</strong>
                  </div>

                  <div className="about-method-line"></div>

                  <div className="about-method-step">
                    <span>03</span>
                    <strong>Map</strong>
                  </div>

                  <div className="about-method-line"></div>

                  <div className="about-method-step">
                    <span>04</span>
                    <strong>Engage</strong>
                  </div>

                  <div className="about-method-line"></div>

                  <div className="about-method-step">
                    <span>05</span>
                    <strong>Follow Up</strong>
                  </div>

                  <div className="about-method-line"></div>

                  <div className="about-method-step">
                    <span>06</span>
                    <strong>Analyse</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="section-container footer-inner">
          <div>
            <div className="brand footer-brand">
              <span className="brand-mark">
                <MapPin size={18} />
              </span>

              <span className="brand-text">
                <strong>Civic</strong>Connect
              </span>
            </div>

            <p>
              Small Actions. Better Neighbourhoods.
            </p>
          </div>

          <div className="footer-right">
            <span>
              Community Engagement Project
            </span>

            <span>
              B.Sc. Computer Science
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
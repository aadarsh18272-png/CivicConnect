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
    location: [28.6180, 77.2140],
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
  const [menuOpen, setMenuOpen] = useState(false);
const [showAdminLogin, setShowAdminLogin] = useState(false);
const [adminUser, setAdminUser] = useState(null);
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

return showAdminLogin ? (
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
                [
                  "01",
                  "Observe",
                  "Identify visible civic problems in the neighbourhood.",
                ],
                [
                  "02",
                  "Document",
                  "Capture photographs, locations and relevant details.",
                ],
                [
                  "03",
                  "Engage",
                  "Understand concerns and interact with the community.",
                ],
                [
                  "04",
                  "Act",
                  "Promote responsible behaviour and practical action.",
                ],
                [
                  "05",
                  "Improve",
                  "Follow up and document the actual outcome.",
                ],
              ].map(
                ([number, title, text]) => (
                  <div
                    className="process-card"
                    key={number}
                  >
                    <span className="process-number">
                      {number}
                    </span>

                    <div className="process-line"></div>

                    <h3>{title}</h3>

                    <p>{text}</p>

                    <ArrowRight
                      className="process-arrow"
                      size={19}
                    />
                  </div>
                )
              )}
            </div>
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

              <div className={`civic-circle ${civicMode}`}>
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
                  civicMode === "before" ? "selected" : ""
                }`}
                onClick={() => setCivicMode("before")}
              >
                <CheckCircle2 size={17} />
                Observe the problem
              </button>

              <button
                type="button"
                className={`civic-floating floating-b ${
                  civicMode === "after" ? "selected" : ""
                }`}
                onClick={() => setCivicMode("after")}
              >
                <CheckCircle2 size={17} />
                Take responsible action
              </button>

              <button
                type="button"
                className={`civic-floating floating-c ${
                  civicMode === "after" ? "selected" : ""
                }`}
                onClick={() => setCivicMode("after")}
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
};
export default App;
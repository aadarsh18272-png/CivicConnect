import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Info,
  Map,
  MapPin,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { db } from "./firebase";

/* =========================================================
   CIVIC ISSUE IMAGES
   These are kept unchanged for the 6 Civic Issue boxes.
   ========================================================= */

import garbageImage from "./assets/image.png";
import potholeImage from "./assets/Pothole_-_The_Noun_Project.svg.webp";
import footpathImage from "./assets/damaged-footpath.jpg";
import streetlightImage from "./assets/Illustration_-_Street_Light_(Single).svg.webp";
import waterImage from "./assets/Water_tap_with_handle_Pinhead_icon.svg.webp";
import drainageImage from "./assets/Sewer_system_leak.svg.webp";

/* =========================================================
   HOW IT WORKS IMAGES
   These are ONLY for the 5 process cards.
   ========================================================= */

import observeImage from "./assets/observe.png";
import documentImage from "./assets/document.png";
import engageImage from "./assets/engage.png";
import actImage from "./assets/act.png";
import improveImage from "./assets/improve.png";

import IssueMap from "./components/IssueMap";
import ReportIssue from "./components/ReportIssue";
import Dashboard from "./components/Dashboard";
import CommunityVoice from "./components/CommunityVoice";

import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

import WorkerLogin from "./components/WorkerLogin";
import WorkerDashboard from "./components/WorkerDashboard";

import "./App.css";

const ADMIN_UID = "atjG8XxUd0WxzFIxfzzVXSCjtug2";

const STORAGE_KEY = "civicconnect_issues";

/* =========================================================
   HOW CIVICCONNECT WORKS
   ========================================================= */

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Observe",
    text: "Identify a visible civic problem in the neighbourhood.",
    detail:
      "Start by noticing problems that affect cleanliness, safety, accessibility, infrastructure or everyday public life. Good civic reporting begins with a clear observation.",
    image: observeImage,
    target: "issues",
    action: "Explore Issues",
    icon: MapPin,
  },

  {
    number: "02",
    title: "Document",
    text: "Capture useful evidence, location and relevant details.",
    detail:
      "Document the issue with a clear description, supporting photograph and location information. The goal is to create useful evidence without publicly identifying or shaming individuals.",
    image: documentImage,
    target: "report",
    action: "Report an Issue",
    icon: Info,
  },

  {
    number: "03",
    title: "Engage",
    text: "Understand local concerns and involve the community.",
    detail:
      "Community participation adds context to field observations. Residents can share concerns, suggestions and priorities so the project reflects real neighbourhood experiences.",
    image: engageImage,
    target: "community",
    action: "Join the Community",
    icon: Users,
  },

  {
    number: "04",
    title: "Act",
    text: "Promote responsible behaviour and practical action.",
    detail:
      "CivicConnect is not only about recording problems. Awareness and responsible everyday behaviour can prevent small problems from becoming larger community issues.",
    image: actImage,
    target: "civic-sense",
    action: "Explore Civic Sense",
    icon: ShieldCheck,
  },

  {
    number: "05",
    title: "Improve",
    text: "Follow up and document what happened next.",
    detail:
      "Follow-up makes the project measurable. Where action is documented, CivicConnect can record the evidence and reported outcome without claiming an unverified government resolution.",
    image: improveImage,
    target: "dashboard",
    action: "View Issue Data",
    icon: BarChart3,
  },
];

/* =========================================================
   CIVIC ISSUE CATEGORIES
   IMPORTANT:
   These images are intentionally NOT changed.
   ========================================================= */

const ISSUE_CATEGORIES = [
  {
    number: "01",
    title: "Garbage & Littering",
    text: "Improper disposal and accumulated waste.",
    image: garbageImage,
  },

  {
    number: "02",
    title: "Roads & Potholes",
    text: "Damaged roads and unsafe surfaces.",
    image: potholeImage,
  },

  {
    number: "03",
    title: "Footpaths",
    text: "Accessibility and pedestrian issues.",
    image: footpathImage,
  },

  {
    number: "04",
    title: "Streetlights",
    text: "Broken or non-functional lighting.",
    image: streetlightImage,
  },

  {
    number: "05",
    title: "Water & Drainage",
    text: "Leakage and drainage-related concerns.",
    image: waterImage,
  },

  {
    number: "06",
    title: "Cleanliness",
    text: "Public-space cleanliness problems.",
    image: drainageImage,
  },
];

function App() {
  const [issues, setIssues] = useState(() => {
    try {
      const savedIssues = localStorage.getItem(STORAGE_KEY);

      if (!savedIssues) {
        return [];
      }

      const parsedIssues = JSON.parse(savedIssues);

      if (!Array.isArray(parsedIssues)) {
        return [];
      }

      return parsedIssues.filter(
        (issue) =>
          issue?.id !== "CC-337444-1772" &&
          issue?.id !== "CC-107005-1745"
      );
    } catch (error) {
      console.error(
        "Unable to load saved CivicConnect issues:",
        error
      );

      return [];
    }
  });

  const [selectedJourney, setSelectedJourney] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const [showWorkerLogin, setShowWorkerLogin] = useState(false);
  const [workerUser, setWorkerUser] = useState(null);

  // Keep staff access inside the CivicConnect UI instead of using
  // a browser confirm() popup.
  const [showStaffChoice, setShowStaffChoice] = useState(false);

  /* =========================================================
     LOCAL CACHE
     ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(issues)
      );
    } catch (error) {
      console.error(
        "Unable to save CivicConnect issues:",
        error
      );
    }
  }, [issues]);

  /* =========================================================
     FIRESTORE
     Firestore remains the source of truth.
     ========================================================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "issues"),
      (snapshot) => {
        const firestoreIssues = snapshot.docs.map((issueDoc) => ({
          id: issueDoc.id,
          firestoreId: issueDoc.id,
          ...issueDoc.data(),
        }));

        setIssues(firestoreIssues);
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

  /* =========================================================
     ISSUE HANDLERS
     ========================================================= */

  const handleIssueSubmitted = (newIssue) => {
    if (!newIssue) {
      return;
    }

    setIssues((previousIssues) => [
      ...previousIssues,
      newIssue,
    ]);
  };

  const handleIssueUpdated = (updatedIssue) => {
    if (!updatedIssue?.id) {
      return;
    }

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

  /* =========================================================
     NAVIGATION
     ========================================================= */

  const scrollToSection = (id) => {
    setMenuOpen(false);

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const openReport = () => {
    scrollToSection("report");
  };

  const openExplore = () => {
    scrollToSection("map");
  };

  const openStaffPortal = () => {
    setMenuOpen(false);
    setShowAdminLogin(false);
    setShowWorkerLogin(false);
    setShowStaffChoice(true);
  };

  const openAdminPortal = () => {
    setShowStaffChoice(false);
    setShowAdminLogin(true);
  };

  const openWorkerPortal = () => {
    setShowStaffChoice(false);
    setShowWorkerLogin(true);
  };

  /* =========================================================
     JOURNEY MODAL
     ========================================================= */

  const closeJourneyModal = () => {
    setSelectedJourney(null);
  };

  useEffect(() => {
    if (!selectedJourney) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeJourneyModal();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedJourney]);

  /* =========================================================
     STAFF APPLICATION STATES
     ========================================================= */

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

  /* =========================================================
     WORKER LOGIN
     ========================================================= */

  if (showWorkerLogin) {
    return (
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
    );
  }

  /* =========================================================
     ADMIN LOGIN
     ========================================================= */

  if (showAdminLogin) {
    return (
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
              window.alert(
                "Access denied. This account is not authorized as an admin."
              );
              return;
            }

            setAdminUser(user);
            setShowAdminLogin(false);
          }}
        />
      </div>
    );
  }

  /* =========================================================
     PUBLIC WEBSITE
     ========================================================= */

  const improvedCount = issues.filter(
    (issue) => issue.status === "Improved"
  ).length;

  const underReviewCount = issues.filter(
    (issue) => issue.status === "Under Review"
  ).length;

  const reportedCount = issues.filter(
    (issue) =>
      !issue.status ||
      issue.status === "Reported"
  ).length;

  return (
    <div className="civicconnect-app">

      {/* =====================================================
          STAFF PORTAL ROLE SELECTOR
          ===================================================== */}

      {showStaffChoice && (
        <div
          className="staff-choice-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowStaffChoice(false);
            }
          }}
        >
          <div
            className="staff-choice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-choice-title"
            aria-describedby="staff-choice-description"
          >
            <button
              type="button"
              className="staff-choice-close"
              onClick={() =>
                setShowStaffChoice(false)
              }
              aria-label="Close Staff Portal"
            >
              <X
                size={20}
                aria-hidden="true"
              />
            </button>

            <div
              className="staff-choice-icon"
              aria-hidden="true"
            >
              <ShieldCheck size={24} />
            </div>

            <span className="staff-choice-kicker">
              CIVICCONNECT STAFF
            </span>

            <h2 id="staff-choice-title">
              Choose your portal
            </h2>

            <p id="staff-choice-description">
              Select the workspace you use to manage
              and follow civic issues.
            </p>

            <div className="staff-choice-grid">

              <button
                type="button"
                className="staff-choice-card staff-choice-admin"
                onClick={openAdminPortal}
              >
                <span className="staff-choice-card-icon">
                  <ShieldCheck
                    size={22}
                    aria-hidden="true"
                  />
                </span>

                <span className="staff-choice-card-copy">
                  <strong>Admin Panel</strong>

                  <small>
                    Manage reports, review data and
                    oversee CivicConnect.
                  </small>
                </span>

                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className="staff-choice-card staff-choice-worker"
                onClick={openWorkerPortal}
              >
                <span className="staff-choice-card-icon">
                  <MapPin
                    size={22}
                    aria-hidden="true"
                  />
                </span>

                <span className="staff-choice-card-copy">
                  <strong>Worker Panel</strong>

                  <small>
                    View assigned field work and update
                    issue progress.
                  </small>
                </span>

                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </button>

            </div>

            <button
              type="button"
              className="staff-choice-cancel"
              onClick={() =>
                setShowStaffChoice(false)
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          PROJECT STATUS BAR
          ===================================================== */}

      <div className="demo-bar">
        <span className="demo-dot" />

        <span>CIVICCONNECT</span>

        <span className="demo-separator">
          •
        </span>

        <span>
          Community Engagement Project
        </span>
      </div>

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <header className="navbar">
        <div className="nav-inner">

          <button
            type="button"
            className="brand"
            onClick={() =>
              scrollToSection("home")
            }
            aria-label="Go to CivicConnect home"
          >
            <span className="brand-mark">
              <MapPin
                size={19}
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </span>

            <span className="brand-text">
              <strong>Civic</strong>
              Connect
            </span>
          </button>

          <nav
            className={`nav-links ${
              menuOpen ? "mobile-open" : ""
            }`}
            aria-label="Primary navigation"
          >
            <button
              type="button"
              onClick={() =>
                scrollToSection("home")
              }
            >
              Home
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("process")
              }
            >
              How It Works
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("issues")
              }
            >
              Issues
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("map")
              }
            >
              Map
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("community")
              }
            >
              Community
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("about")
              }
            >
              About
            </button>

            <button
              type="button"
              className="mobile-staff-link"
              onClick={openStaffPortal}
            >
              Staff Portal
            </button>

            <button
              type="button"
              className="mobile-report"
              onClick={openReport}
            >
              Report an Issue

              <ArrowRight
                size={17}
                aria-hidden="true"
              />
            </button>
          </nav>

          <div className="nav-actions">

            <button
              type="button"
              className="nav-staff"
              onClick={openStaffPortal}
            >
              Staff Portal
            </button>

            <button
              type="button"
              className="nav-report"
              onClick={openReport}
            >
              Report an Issue

              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className="menu-button"
              onClick={() =>
                setMenuOpen(
                  (current) => !current
                )
              }
              aria-label={
                menuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X
                  size={24}
                  aria-hidden="true"
                />
              ) : (
                <Menu
                  size={24}
                  aria-hidden="true"
                />
              )}
            </button>

          </div>
        </div>
      </header>

      <main>

        {/* ===================================================
            HERO
            =================================================== */}

        <section
          className="hero"
          id="home"
          aria-labelledby="hero-title"
        >
          <div className="hero-background">
            <div className="hero-glow hero-glow-one" />
            <div className="hero-glow hero-glow-two" />
            <div className="grid-pattern" />
          </div>

          <div className="hero-container">

            <div className="hero-content">

              <div className="eyebrow">
                <span className="eyebrow-icon">
                  <ShieldCheck
                    size={14}
                    aria-hidden="true"
                  />
                </span>

                COMMUNITY ENGAGEMENT PROJECT
              </div>

              <h1 id="hero-title">
                Better neighbourhoods

                <span>
                  {" "}
                  start with better civic sense.
                </span>
              </h1>

              <p className="hero-description">
                Identify local problems, document what
                you observe, involve the community and
                follow how issues change over time.
              </p>

              <div className="hero-buttons">

                <button
                  type="button"
                  className="primary-button"
                  onClick={openReport}
                >
                  Report an Issue

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={openExplore}
                >
                  <Map
                    size={18}
                    aria-hidden="true"
                  />

                  Explore Civic Map
                </button>

              </div>

              <div className="hero-trust">

                <div
                  className="trust-avatars"
                  aria-hidden="true"
                >
                  <span>01</span>
                  <span>02</span>
                  <span>03</span>
                </div>

                <div>
                  <strong>Field-based project</strong>

                  <small>
                    Built around community observations
                    and real field data
                  </small>
                </div>

              </div>

            </div>

            {/* =================================================
                HERO PRODUCT VISUAL
                ================================================= */}

            <div
              className="hero-visual"
              aria-label="CivicConnect neighbourhood overview"
            >
              <div className="scene-glow" />

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
                    <span />
                    LIVE
                  </div>

                </div>

                <div className="neighbourhood">

                  <div className="sky" />

                  {/* BUILDINGS */}

                  <div className="building building-one">
                    <div className="building-window" />
                    <div className="building-window" />
                    <div className="building-window" />
                    <div className="building-window" />
                  </div>

                  <div className="building building-two">
                    <div className="building-window" />
                    <div className="building-window" />
                    <div className="building-window" />
                    <div className="building-window" />
                  </div>

                  <div className="building building-three">
                    <div className="building-window" />
                    <div className="building-window" />
                    <div className="building-window" />
                  </div>

                  {/* TREES */}

                  <div className="tree tree-one">
                    <div className="tree-top" />
                    <div className="tree-trunk" />
                  </div>

                  <div className="tree tree-two">
                    <div className="tree-top" />
                    <div className="tree-trunk" />
                  </div>

                  <div className="tree tree-three">
                    <div className="tree-top" />
                    <div className="tree-trunk" />
                  </div>

                  {/* ROAD */}

                  <div className="road">
                    <div className="road-line" />
                  </div>

                  <div className="footpath" />

                  {/* BIN */}

                  <div className="bin">
                    <div className="bin-lid" />
                    <div className="bin-body" />
                  </div>

                  {/* STREETLIGHT */}

                  <div className="streetlight">
                    <div className="light-head" />
                    <div className="light-pole" />
                  </div>

                  {/* ISSUE MARKERS */}

                  <div className="map-pin pin-one">
                    <MapPin
                      size={22}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="map-pin pin-two">
                    <MapPin
                      size={22}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="map-pin pin-three">
                    <MapPin
                      size={22}
                      aria-hidden="true"
                    />
                  </div>

                  {/* PEOPLE */}

                  <div className="person person-one">
                    <div className="person-head" />
                    <div className="person-body" />
                  </div>

                  <div className="person person-two">
                    <div className="person-head" />
                    <div className="person-body" />
                  </div>

                  {/* STATUS */}

                  <div className="scene-status status-left">

                    <CheckCircle2
                      size={15}
                      aria-hidden="true"
                    />

                    <div>
                      <strong>
                        {improvedCount}
                      </strong>

                      <span>
                        Areas improved
                      </span>
                    </div>

                  </div>

                  <div className="scene-status status-right">

                    <MapPin
                      size={15}
                      aria-hidden="true"
                    />

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

              {/* HERO DATA CARDS */}

              <div className="floating-card floating-card-one">

                <div className="floating-icon green">
                  <Users
                    size={18}
                    aria-hidden="true"
                  />
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
                  <CheckCircle2
                    size={18}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <strong>
                    {underReviewCount}
                  </strong>

                  <span>
                    Under review
                  </span>
                </div>

              </div>

            </div>
          </div>

          <button
            type="button"
            className="hero-scroll"
            onClick={() =>
              scrollToSection("process")
            }
            aria-label="Scroll to CivicConnect process"
          >
            <span>
              SCROLL TO EXPLORE
            </span>

            <ChevronDown
              size={16}
              aria-hidden="true"
            />
          </button>

        </section>

        {/* ===================================================
            HOW IT WORKS
            =================================================== */}

        <section
          className="process-section"
          id="process"
          aria-labelledby="process-title"
        >
          <div className="section-container">

            <div className="section-heading">

              <span className="section-kicker">
                HOW CIVICCONNECT WORKS
              </span>

              <h2 id="process-title">
                From observation

                <br />

                <span>
                  to improvement.
                </span>
              </h2>

              <p>
                CivicConnect connects field observation,
                documentation, community participation,
                responsible action and follow-up.
              </p>

            </div>

            <div className="process-grid">

              {PROCESS_STEPS.map((step) => {
                const StepIcon = step.icon;

                return (
                  <button
                    type="button"
                    className="process-card"
                    key={step.number}
                    onClick={() =>
                      setSelectedJourney(step)
                    }
                    aria-label={`Learn about ${step.title}`}
                  >

                    <div className="process-image-wrap">

                      <img
                        src={step.image}
                        alt=""
                        className="process-image"
                        loading="lazy"
                      />

                      <span className="process-image-shade" />

                      <span className="process-number">
                        {step.number}
                      </span>

                    </div>

                    <div className="process-card-body">

                      <div className="process-line" />

                      <div className="process-card-heading">

                        <h3>
                          {step.title}
                        </h3>

                        <StepIcon
                          size={17}
                          aria-hidden="true"
                        />

                      </div>

                      <p>
                        {step.text}
                      </p>

                      <span className="process-learn">
                        Learn more

                        <ArrowRight
                          className="process-arrow"
                          size={18}
                          aria-hidden="true"
                        />
                      </span>

                    </div>

                  </button>
                );
              })}

            </div>

            {/* JOURNEY MODAL */}

            {selectedJourney && (
              <div
                className="journey-modal-backdrop"
                role="presentation"
                onMouseDown={(event) => {
                  if (
                    event.target ===
                    event.currentTarget
                  ) {
                    closeJourneyModal();
                  }
                }}
              >

                <div
                  className="journey-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="journey-modal-title"
                  aria-describedby="journey-modal-description"
                >

                  <button
                    type="button"
                    className="journey-modal-close"
                    onClick={closeJourneyModal}
                    aria-label="Close journey details"
                  >
                    <X
                      size={20}
                      aria-hidden="true"
                    />
                  </button>

                  <div className="journey-modal-top">

                    <span className="journey-modal-number">
                      {selectedJourney.number}
                    </span>

                    <span className="journey-modal-kicker">
                      CIVICCONNECT JOURNEY
                    </span>

                  </div>

                  <img
                    src={selectedJourney.image}
                    alt=""
                    className="journey-modal-image"
                  />

                  <h3 id="journey-modal-title">
                    {selectedJourney.title}
                  </h3>

                  <p className="journey-modal-summary">
                    {selectedJourney.text}
                  </p>

                  <p
                    className="journey-modal-detail"
                    id="journey-modal-description"
                  >
                    {selectedJourney.detail}
                  </p>

                  <div className="journey-modal-actions">

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        const target =
                          selectedJourney.target;

                        closeJourneyModal();

                        window.setTimeout(() => {
                          scrollToSection(target);
                        }, 100);
                      }}
                    >
                      {selectedJourney.action}

                      <ArrowRight
                        size={17}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      className="journey-modal-secondary"
                      onClick={closeJourneyModal}
                    >
                      Close
                    </button>

                  </div>

                </div>
              </div>
            )}

          </div>
        </section>

        {/* ===================================================
            ISSUE CATEGORIES
            =================================================== */}

        <section
          className="issues-section"
          id="issues"
          aria-labelledby="issues-title"
        >
          <div className="section-container">

            <div className="section-heading centered">

              <span className="section-kicker">
                CIVIC OBSERVATIONS
              </span>

              <h2 id="issues-title">
                Understand the problems

                <br />

                <span>
                  around us.
                </span>
              </h2>

              <p>
                Explore the categories of civic
                infrastructure and civic-sense issues
                documented through fieldwork.
              </p>

            </div>

            <div className="issue-grid civic-visual-issues">

              {ISSUE_CATEGORIES.map((issue) => (
                <article
                  className="civic-issue-image-card"
                  key={issue.number}
                  style={{
                    backgroundImage:
                      `url("${issue.image}")`,
                  }}
                >

                  <div className="civic-issue-overlay" />

                  <div className="civic-issue-top">

                    <span className="civic-issue-number">
                      {issue.number}
                    </span>

                    <span className="civic-issue-pin">

                      <MapPin
                        size={17}
                        aria-hidden="true"
                      />

                    </span>

                  </div>

                  <div className="civic-issue-content">

                    <span className="civic-issue-label">
                      CIVIC ISSUE
                    </span>

                    <h3>
                      {issue.title}
                    </h3>

                    <p>
                      {issue.text}
                    </p>

                    <button
                      type="button"
                      onClick={openReport}
                    >
                      <span>
                        Report this issue
                      </span>

                      <ArrowRight
                        size={17}
                        aria-hidden="true"
                      />
                    </button>

                  </div>

                </article>
              ))}

            </div>
          </div>
        </section>

        {/* ===================================================
            MAP
            =================================================== */}

        <section
          className="map-section"
          id="map"
          aria-label="Civic issue map"
        >
          <div className="section-container">
            <IssueMap issues={issues} />
          </div>
        </section>

        {/* ===================================================
            CIVIC SENSE
            =================================================== */}

        <section
          className="civic-section"
          id="civic-sense"
          aria-labelledby="civic-sense-title"
        >
          <div className="civic-container">

            <div className="civic-copy">

              <span className="section-kicker">
                CIVIC SENSE
              </span>

              <h2 id="civic-sense-title">
                Small habits.

                <br />

                <span>
                  Big impact.
                </span>
              </h2>

              <p>
                Public spaces belong to everyone.
                Responsible everyday behaviour can prevent
                small problems from becoming larger community
                issues.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  scrollToSection("community")
                }
              >
                Learn Responsible Practices

                <ArrowRight
                  size={18}
                  aria-hidden="true"
                />
              </button>

            </div>

            <div
              className="civic-visual"
              aria-label="Observe, act and improve civic behaviour"
            >

              <div className="civic-orbit orbit-one" />
              <div className="civic-orbit orbit-two" />

              <div className="civic-circle before">

                <ShieldCheck
                  size={54}
                  aria-hidden="true"
                />

                <strong>
                  OBSERVE
                </strong>

                <span>
                  CIVIC PROBLEM
                </span>

              </div>

              <div className="civic-floating floating-a selected">

                <CheckCircle2
                  size={17}
                  aria-hidden="true"
                />

                Observe the problem

              </div>

              <div className="civic-floating floating-b">

                <CheckCircle2
                  size={17}
                  aria-hidden="true"
                />

                Take responsible action

              </div>

              <div className="civic-floating floating-c">

                <CheckCircle2
                  size={17}
                  aria-hidden="true"
                />

                Improve public spaces

              </div>

            </div>

          </div>
        </section>

        {/* ===================================================
            COMMUNITY
            =================================================== */}

        <section
          id="community"
          aria-label="Community voice"
        >
          <CommunityVoice />
        </section>

        {/* ===================================================
            ISSUE DATA / DASHBOARD
            =================================================== */}

        <section
          className="dashboard-section"
          id="dashboard"
          aria-labelledby="dashboard-title"
        >
          <div className="section-container">
            <Dashboard issues={issues} />
          </div>
        </section>

        {/* ===================================================
            REPORT ISSUE
            =================================================== */}

        <section
          className="report-section"
          id="report"
          aria-labelledby="report-title"
        >
          <div className="section-container">

            <ReportIssue
              onIssueSubmitted={
                handleIssueSubmitted
              }
              onIssueUpdated={
                handleIssueUpdated
              }
            />

          </div>
        </section>

        {/* ===================================================
            ABOUT
            =================================================== */}

        <section
          className="about-section"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="section-container">

            <div className="about-grid">

              <div>

                <span className="section-kicker">
                  ABOUT THE PROJECT
                </span>

                <h2 id="about-title">
                  Real community.

                  <br />

                  <span>
                    Real fieldwork.
                  </span>
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

                <div
                  className="about-methodology"
                  aria-label="CivicConnect methodology"
                >

                  <div className="about-method-step">
                    <span>01</span>
                    <strong>Observe</strong>
                  </div>

                  <div className="about-method-line" />

                  <div className="about-method-step">
                    <span>02</span>
                    <strong>Document</strong>
                  </div>

                  <div className="about-method-line" />

                  <div className="about-method-step">
                    <span>03</span>
                    <strong>Map</strong>
                  </div>

                  <div className="about-method-line" />

                  <div className="about-method-step">
                    <span>04</span>
                    <strong>Engage</strong>
                  </div>

                  <div className="about-method-line" />

                  <div className="about-method-step">
                    <span>05</span>
                    <strong>Follow Up</strong>
                  </div>

                  <div className="about-method-line" />

                  <div className="about-method-step">
                    <span>06</span>
                    <strong>Analyse</strong>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ===================================================
            FINAL CTA
            =================================================== */}

        <section
          className="report-section civic-final-cta"
          aria-labelledby="final-cta-title"
        >
          <div className="section-container">

            <div className="section-heading centered">

              <span className="section-kicker">
                SEE SOMETHING?
              </span>

              <h2 id="final-cta-title">
                Help document the problems

                <br />

                <span>
                  around your neighbourhood.
                </span>
              </h2>

              <p>
                A clear observation can become useful
                evidence for understanding a local issue.
              </p>

              <div className="hero-buttons">

                <button
                  type="button"
                  className="primary-button"
                  onClick={openReport}
                >
                  Report an Issue

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={openExplore}
                >
                  <Map
                    size={18}
                    aria-hidden="true"
                  />

                  Explore the Map
                </button>

              </div>

            </div>

          </div>
        </section>

      </main>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="footer">

        <div className="section-container footer-inner">

          <div>

            <button
              type="button"
              className="brand footer-brand"
              onClick={() =>
                scrollToSection("home")
              }
              aria-label="Return to CivicConnect home"
            >
              <span className="brand-mark">

                <MapPin
                  size={18}
                  aria-hidden="true"
                />

              </span>

              <span className="brand-text">
                <strong>Civic</strong>
                Connect
              </span>

            </button>

            <p>
              Small Actions. Better Neighbourhoods.
            </p>

          </div>

          <div className="footer-right">

            <button
              type="button"
              onClick={() =>
                scrollToSection("issues")
              }
            >
              Explore Issues
            </button>

            <button
              type="button"
              onClick={openReport}
            >
              Report an Issue
            </button>

            <button
              type="button"
              onClick={openStaffPortal}
            >
              Staff Portal
            </button>

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
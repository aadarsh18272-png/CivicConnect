import React, { useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  HardHat,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Radio,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { signOut } from "firebase/auth";

import { auth, db } from "../firebase";


function WorkerDashboard({ user, onLogout }) {

  const [issues, setIssues] = useState([]);
  const [workerProfile, setWorkerProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [selectedIssue, setSelectedIssue] =
    useState(null);

  const [error, setError] = useState("");

  const [observation, setObservation] =
    useState("");

  const [actionTaken, setActionTaken] =
    useState("");

  const [outcome, setOutcome] =
    useState("Pending follow-up");

  const [afterPhoto, setAfterPhoto] =
    useState("");

  const [saving, setSaving] =
    useState(false);


  /* =====================================================
     LOAD WORKER PROFILE
  ===================================================== */

  useEffect(() => {

    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "workers", user.uid),

      (snapshot) => {

        if (snapshot.exists()) {
          setWorkerProfile(
            snapshot.data()
          );
        }

        setProfileLoading(false);
      },

      (snapshotError) => {

        console.error(
          "Worker profile error:",
          snapshotError
        );

        setError(
          "Unable to load your worker profile."
        );

        setProfileLoading(false);
      }
    );

    return () => unsubscribe();

  }, [user]);


  /* =====================================================
     LOAD ASSIGNED ISSUES
  ===================================================== */

  useEffect(() => {

    if (!user?.uid) return;

    const issuesQuery = query(
      collection(db, "issues"),
      where(
        "assignedWorkerId",
        "==",
        user.uid
      )
    );

    const unsubscribe = onSnapshot(
      issuesQuery,

      (snapshot) => {

        const assignedIssues =
          snapshot.docs.map(
            (issueDoc) => ({
              ...issueDoc.data(),
              firestoreId:
                issueDoc.id,
            })
          );

        setIssues(assignedIssues);
        setLoading(false);
      },

      (snapshotError) => {

        console.error(
          "Assigned issues error:",
          snapshotError
        );

        setError(
          `Unable to load assigned work: ${
            snapshotError?.message ||
            "Firebase error"
          }`
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, [user]);


  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(() => {

    return {

      assigned:
        issues.length,

      inProgress:
        issues.filter(
          (issue) =>
            issue.status ===
            "Under Review"
        ).length,

      completed:
        issues.filter(
          (issue) =>
            issue.status ===
            "Improved"
        ).length,

    };

  }, [issues]);


  /* =====================================================
     PROGRESS
  ===================================================== */

  const completionRate =
    stats.assigned > 0
      ? Math.round(
          (stats.completed /
            stats.assigned) *
            100
        )
      : 0;


  /* =====================================================
     OPEN ISSUE
  ===================================================== */

  const openIssue = (issue) => {

    setSelectedIssue(issue);

    setObservation(
      issue.observation || ""
    );

    setActionTaken(
      issue.actionTaken || ""
    );

    setOutcome(
      issue.outcome ||
        "Pending follow-up"
    );

    setAfterPhoto(
      issue.afterPhoto || ""
    );

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* =====================================================
     CLOSE ISSUE
  ===================================================== */

  const closeIssue = () => {

    setSelectedIssue(null);

    setObservation("");
    setActionTaken("");
    setAfterPhoto("");

    setOutcome(
      "Pending follow-up"
    );

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* =====================================================
     IMAGE COMPRESSION
  ===================================================== */

  const compressImage = (file) => {

    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();

        reader.onload = (event) => {

          const image =
            new Image();

          image.onload = () => {

            const maxWidth = 900;
            const maxHeight = 900;

            let width =
              image.width;

            let height =
              image.height;

            if (
              width > maxWidth ||
              height > maxHeight
            ) {

              const ratio =
                Math.min(
                  maxWidth / width,
                  maxHeight / height
                );

              width =
                Math.round(
                  width * ratio
                );

              height =
                Math.round(
                  height * ratio
                );
            }

            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width = width;
            canvas.height = height;

            const context =
              canvas.getContext(
                "2d"
              );

            context.drawImage(
              image,
              0,
              0,
              width,
              height
            );

            resolve(
              canvas.toDataURL(
                "image/jpeg",
                0.68
              )
            );
          };

          image.onerror = () => {

            reject(
              new Error(
                "Unable to process image."
              )
            );
          };

          image.src =
            event.target.result;
        };

        reader.onerror = () => {

          reject(
            new Error(
              "Unable to read image."
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  };


  /* =====================================================
     PHOTO CHANGE
  ===================================================== */

  const handlePhotoChange = async (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      setError(
        "Please select a valid image."
      );

      return;
    }

    try {

      setError("");

      const image =
        await compressImage(file);

      setAfterPhoto(image);

    } catch (photoError) {

      console.error(
        photoError
      );

      setError(
        "Unable to process the photo."
      );

    }

    event.target.value = "";
  };


  /* =====================================================
     SUBMIT FOLLOW-UP
  ===================================================== */

  const submitFollowUp = async () => {

    if (!selectedIssue) return;

    if (
      !observation.trim()
    ) {

      setError(
        "Please enter your observation."
      );

      return;
    }

    if (
      !actionTaken.trim()
    ) {

      setError(
        "Please enter the action taken."
      );

      return;
    }

    if (!afterPhoto) {

      setError(
        "Please upload an after photo."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {

      await updateDoc(
        doc(
          db,
          "issues",
          selectedIssue.firestoreId
        ),

        {
          observation:
            observation.trim(),

          actionTaken:
            actionTaken.trim(),

          afterPhoto,

          outcome,

          status:
            outcome ===
            "Improved"
              ? "Improved"
              : "Under Review",

          workerCompletedBy:
            user.uid,

          workerCompletedByName:
            workerProfile?.name ||
            user.email,

          followUpSubmittedAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        }
      );

      closeIssue();

    } catch (submitError) {

      console.error(
        "Follow-up submission error:",
        submitError
      );

      setError(
        `Unable to submit follow-up: ${
          submitError?.message ||
          "Firebase error"
        }`
      );

    } finally {

      setSaving(false);
    }
  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout =
    async () => {

      try {

        await signOut(auth);

        if (onLogout) {
          onLogout();
        }

      } catch (logoutError) {

        console.error(
          logoutError
        );

        setError(
          "Unable to sign out."
        );
      }
    };


  /* =====================================================
     DATE FORMATTER
  ===================================================== */

  const formatDate = (value) => {

    if (!value) {
      return "No date";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (
    status
  ) => {

    if (
      status === "Improved"
    ) {
      return "worker-status-complete";
    }

    if (
      status === "Under Review"
    ) {
      return "worker-status-progress";
    }

    return "worker-status-open";
  };


  /* =====================================================
     PRIORITY CLASS
  ===================================================== */

  const getPriorityClass = (
    severity
  ) => {

    const value =
      String(
        severity || "Medium"
      ).toLowerCase();

    if (
      value.includes("high") ||
      value.includes("critical")
    ) {
      return "worker-priority-high";
    }

    if (
      value.includes("low")
    ) {
      return "worker-priority-low";
    }

    return "worker-priority-medium";
  };


  /* =====================================================
     DETAIL VIEW
  ===================================================== */

  if (selectedIssue) {

    return (

      <section className="worker-app">

        {/* HEADER */}

        <header className="worker-header">

          <div className="worker-brand">

            <div className="worker-brand-mark">

              <HardHat size={20} />

            </div>

            <div>

              <strong>
                CivicConnect
              </strong>

              <span>
                FIELD OPERATIONS
              </span>

            </div>

          </div>


          <div className="worker-header-center">

            <div className="worker-live-indicator">

              <span />

              FIELD CONSOLE ONLINE

            </div>

          </div>


          <div className="worker-header-right">

            <div className="worker-user">

              <div className="worker-avatar">

                <UserRound
                  size={16}
                />

              </div>

              <div>

                <strong>
                  {workerProfile?.name ||
                    user?.email ||
                    "Worker"}
                </strong>

                <span>
                  FIELD WORKER
                </span>

              </div>

            </div>


            <button
              className="worker-logout"
              onClick={handleLogout}
            >

              <LogOut size={16} />

              <span>
                Sign Out
              </span>

            </button>

          </div>

        </header>


        <main className="worker-detail-page">

          {/* BACK */}

          <button
            className="worker-back-button"
            onClick={closeIssue}
          >

            <ArrowLeft size={16} />

            Back to assigned work

          </button>


          {/* DETAIL TITLE */}

          <section className="worker-detail-hero">

            <div>

              <div className="worker-detail-kicker">

                <span>
                  ASSIGNED FIELD JOB
                </span>

                <span className="worker-job-code">
                  #{selectedIssue.id ||
                    selectedIssue.firestoreId
                      .slice(0, 8)
                      .toUpperCase()}
                </span>

              </div>


              <h1>

                {selectedIssue.title ||
                  selectedIssue.category ||
                  "Civic Issue"}

              </h1>


              <p>

                Review the reported issue,
                complete the field work and
                submit evidence of the outcome.

              </p>

            </div>


            <div className="worker-detail-status-stack">

              <span
                className={`worker-status-pill ${getStatusClass(
                  selectedIssue.status
                )}`}
              >

                <span />

                {selectedIssue.status ||
                  "Reported"}

              </span>

              <span
                className={`worker-priority ${getPriorityClass(
                  selectedIssue.severity
                )}`}
              >

                {selectedIssue.severity ||
                  "Medium"}{" "}

                PRIORITY

              </span>

            </div>

          </section>


          {/* DETAIL GRID */}

          <div className="worker-detail-grid">

            {/* BEFORE EVIDENCE */}

            <article className="worker-panel">

              <div className="worker-panel-heading">

                <div>

                  <span>
                    ORIGINAL EVIDENCE
                  </span>

                  <h2>
                    Reported condition
                  </h2>

                </div>

                <div className="worker-panel-icon">
                  <ImageIcon size={18} />
                </div>

              </div>


              <div className="worker-before-image">

                {selectedIssue.beforePhoto ||
                selectedIssue.photo ? (

                  <img
                    src={
                      selectedIssue.beforePhoto ||
                      selectedIssue.photo
                    }
                    alt="Reported civic issue"
                  />

                ) : (

                  <div className="worker-no-image">

                    <Camera size={30} />

                    <strong>
                      No photo attached
                    </strong>

                    <span>
                      This report has no
                      original image.
                    </span>

                  </div>

                )}

              </div>

            </article>


            {/* ISSUE INFORMATION */}

            <article className="worker-panel">

              <div className="worker-panel-heading">

                <div>

                  <span>
                    ISSUE BRIEF
                  </span>

                  <h2>
                    What needs attention?
                  </h2>

                </div>

                <div className="worker-panel-icon">
                  <ClipboardCheck
                    size={18}
                  />
                </div>

              </div>


              <div className="worker-issue-description">

                {selectedIssue.description ||
                  "No description was provided for this civic issue."}

              </div>


              <div className="worker-info-list">

                <div>

                  <MapPin size={16} />

                  <div>

                    <span>
                      LOCATION
                    </span>

                    <strong>

                      {selectedIssue.location
                        ? `${selectedIssue.location[0]}, ${selectedIssue.location[1]}`
                        : "Location not provided"}

                    </strong>

                  </div>

                </div>


                <div>

                  <Clock3 size={16} />

                  <div>

                    <span>
                      REPORTED
                    </span>

                    <strong>

                      {formatDate(
                        selectedIssue.date
                      )}

                    </strong>

                  </div>

                </div>


                <div>

                  <AlertTriangle
                    size={16}
                  />

                  <div>

                    <span>
                      SEVERITY
                    </span>

                    <strong>

                      {selectedIssue.severity ||
                        "Medium"}

                    </strong>

                  </div>

                </div>

              </div>

            </article>

          </div>


          {/* FOLLOW UP */}

          <section className="worker-followup-panel">

            <div className="worker-followup-top">

              <div>

                <div className="worker-section-kicker">

                  <Radio size={13} />

                  FIELD FOLLOW-UP

                </div>

                <h2>
                  Close the field loop.
                </h2>

                <p>
                  Record what you found,
                  what you did and provide
                  visual evidence of the result.
                </p>

              </div>


              <div className="worker-followup-number">
                02
              </div>

            </div>


            {/* OBSERVATION + ACTION */}

            <div className="worker-form-grid">

              <label className="worker-form-field">

                <span>
                  <b>01</b>
                  OBSERVATION
                </span>

                <textarea
                  value={observation}
                  onChange={(event) =>
                    setObservation(
                      event.target.value
                    )
                  }
                  placeholder="Describe the actual condition you observed at the location..."
                  rows={6}
                />

                <small>
                  Explain what you found
                  when you reached the site.
                </small>

              </label>


              <label className="worker-form-field">

                <span>
                  <b>02</b>
                  ACTION TAKEN
                </span>

                <textarea
                  value={actionTaken}
                  onChange={(event) =>
                    setActionTaken(
                      event.target.value
                    )
                  }
                  placeholder="Describe the work performed or action taken..."
                  rows={6}
                />

                <small>
                  Record the work completed
                  during the field visit.
                </small>

              </label>

            </div>


            {/* PHOTO */}

            <div className="worker-form-field worker-photo-field">

              <span>
                <b>03</b>
                AFTER PHOTO
              </span>


              {!afterPhoto ? (

                <label
                  className="worker-photo-upload"
                  htmlFor="worker-after-photo"
                >

                  <div className="worker-photo-upload-icon">

                    <Camera size={23} />

                  </div>

                  <strong>
                    Add completion evidence
                  </strong>

                  <small>
                    Take or upload a clear
                    photo showing the result
                    of the field work.
                  </small>

                  <div className="worker-photo-upload-button">

                    CHOOSE PHOTO

                    <ArrowUpRight
                      size={15}
                    />

                  </div>

                  <input
                    id="worker-after-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={
                      handlePhotoChange
                    }
                  />

                </label>

              ) : (

                <div className="worker-photo-preview">

                  <img
                    src={afterPhoto}
                    alt="After field work"
                  />

                  <div className="worker-photo-preview-overlay">

                    <span>
                      AFTER EVIDENCE
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setAfterPhoto("")
                      }
                    >

                      <X size={15} />

                      Replace

                    </button>

                  </div>

                </div>

              )}

            </div>


            {/* OUTCOME */}

            <div className="worker-outcome-row">

              <label className="worker-form-field">

                <span>
                  <b>04</b>
                  OUTCOME
                </span>

                <select
                  value={outcome}
                  onChange={(event) =>
                    setOutcome(
                      event.target.value
                    )
                  }
                >

                  <option value="Pending follow-up">
                    Pending follow-up
                  </option>

                  <option value="Partially Improved">
                    Partially Improved
                  </option>

                  <option value="Improved">
                    Improved
                  </option>

                </select>

              </label>


              <div className="worker-outcome-info">

                <CheckCircle2
                  size={19}
                />

                <div>

                  <strong>
                    Ready to submit?
                  </strong>

                  <span>
                    Make sure your observation,
                    action and after photo are
                    complete.
                  </span>

                </div>

              </div>

            </div>


            {/* ERROR */}

            {error && (

              <div className="worker-error">

                <AlertTriangle
                  size={17}
                />

                <span>
                  {error}
                </span>

                <button
                  onClick={() =>
                    setError("")
                  }
                >
                  <X size={15} />
                </button>

              </div>

            )}


            {/* SUBMIT */}

            <button
              className="worker-submit-button"
              disabled={saving}
              onClick={
                submitFollowUp
              }
            >

              <span className="worker-submit-icon">

                {saving ? (
                  <Activity
                    size={18}
                    className="worker-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

              </span>

              <span>

                {saving
                  ? "SUBMITTING FIELD REPORT..."
                  : "SUBMIT FIELD REPORT"}

              </span>

              {!saving && (
                <ArrowUpRight
                  size={18}
                />
              )}

            </button>

          </section>

        </main>

      </section>
    );
  }


  /* =====================================================
     MAIN DASHBOARD
  ===================================================== */

  const firstName =
    workerProfile?.name
      ? workerProfile.name
          .trim()
          .split(" ")[0]
      : "Worker";


  return (

    <section className="worker-app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="worker-header">

        <div className="worker-brand">

          <div className="worker-brand-mark">

            <HardHat size={20} />

          </div>

          <div>

            <strong>
              CivicConnect
            </strong>

            <span>
              FIELD OPERATIONS
            </span>

          </div>

        </div>


        <div className="worker-header-center">

          <div className="worker-live-indicator">

            <span />

            FIELD CONSOLE ONLINE

          </div>

        </div>


        <div className="worker-header-right">

          <div className="worker-user">

            <div className="worker-avatar">

              <UserRound size={16} />

            </div>

            <div>

              <strong>

                {workerProfile?.name ||
                  user?.email ||
                  "Worker"}

              </strong>

              <span>
                FIELD WORKER
              </span>

            </div>

          </div>


          <button
            className="worker-logout"
            onClick={handleLogout}
          >

            <LogOut size={16} />

            <span>
              Sign Out
            </span>

          </button>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="worker-dashboard">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="worker-hero">

          <div className="worker-hero-main">

            <div className="worker-hero-kicker">

              <span />

              FIELD OPERATIONS / TODAY

            </div>


            <h1>

              Good morning,
              <br />

              <span>
                {firstName}.
              </span>

            </h1>


            <p>

              Your field console for assigned
              civic work, evidence and
              neighbourhood improvements.

            </p>


            <div className="worker-hero-meta">

              <div>

                <Activity size={15} />

                <span>
                  Live assignment feed
                </span>

              </div>

              <div>

                <ShieldCheck size={15} />

                <span>
                  Worker session secured
                </span>

              </div>

            </div>

          </div>


          <div className="worker-hero-side">

            <div className="worker-hero-orbit">

              <div className="worker-hero-orbit-ring" />

              <div className="worker-hero-symbol">

                <HardHat size={40} />

              </div>

            </div>


            <div className="worker-hero-side-label">

              <span>
                FIELD STATUS
              </span>

              <strong>
                ACTIVE
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="worker-error">

            <AlertTriangle
              size={17}
            />

            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
            >
              <X size={15} />
            </button>

          </div>

        )}


        {/* =================================================
            STATS
        ================================================= */}

        <section className="worker-stat-grid">

          <article className="worker-stat-card">

            <div className="worker-stat-number">

              {stats.assigned}

            </div>

            <div className="worker-stat-copy">

              <span>
                TOTAL ASSIGNED
              </span>

              <strong>
                Field jobs
              </strong>

            </div>

            <div className="worker-stat-icon">
              <ClipboardCheck
                size={19}
              />
            </div>

          </article>


          <article className="worker-stat-card worker-stat-card-progress">

            <div className="worker-stat-number">

              {stats.inProgress}

            </div>

            <div className="worker-stat-copy">

              <span>
                IN PROGRESS
              </span>

              <strong>
                Under review
              </strong>

            </div>

            <div className="worker-stat-icon">
              <Clock3
                size={19}
              />
            </div>

          </article>


          <article className="worker-stat-card worker-stat-card-complete">

            <div className="worker-stat-number">

              {stats.completed}

            </div>

            <div className="worker-stat-copy">

              <span>
                COMPLETED
              </span>

              <strong>
                Improved
              </strong>

            </div>

            <div className="worker-stat-icon">
              <CheckCircle2
                size={19}
              />
            </div>

          </article>


          <article className="worker-stat-card worker-stat-card-progress-main">

            <div className="worker-progress-stat">

              <div className="worker-progress-circle">

                <svg
                  viewBox="0 0 42 42"
                >

                  <circle
                    cx="21"
                    cy="21"
                    r="17"
                    className="worker-progress-track"
                  />

                  <circle
                    cx="21"
                    cy="21"
                    r="17"
                    className="worker-progress-value"
                    style={{
                      strokeDasharray: `${completionRate} 100`,
                    }}
                  />

                </svg>

                <strong>
                  {completionRate}%
                </strong>

              </div>


              <div>

                <span>
                  COMPLETION RATE
                </span>

                <strong>
                  Field progress
                </strong>

              </div>

            </div>

          </article>

        </section>


        {/* =================================================
            ASSIGNED WORK
        ================================================= */}

        <section className="worker-work-area">

          <div className="worker-work-heading">

            <div>

              <div className="worker-section-kicker">

                <Radio size={13} />

                LIVE WORK QUEUE

              </div>

              <h2>
                Assigned field work
              </h2>

              <p>
                Open an assignment to review
                the issue and submit field
                evidence.
              </p>

            </div>


            <div className="worker-work-count">

              <strong>
                {issues.length}
              </strong>

              <span>
                {issues.length === 1
                  ? "ACTIVE JOB"
                  : "ACTIVE JOBS"}
              </span>

            </div>

          </div>


          {/* LOADING */}

          {loading ? (

            <div className="worker-loading">

              <div className="worker-loading-spinner" />

              <strong>
                Loading field assignments
              </strong>

              <span>
                Connecting to the CivicConnect
                work queue...
              </span>

            </div>

          ) : issues.length === 0 ? (

            /* EMPTY */

            <div className="worker-empty-state">

              <div className="worker-empty-icon">

                <CheckCircle2
                  size={25}
                />

              </div>

              <div>

                <span>
                  QUEUE CLEAR
                </span>

                <h3>
                  No field work assigned
                </h3>

                <p>
                  New civic assignments will
                  appear here when an
                  administrator assigns them
                  to you.
                </p>

              </div>

            </div>

          ) : (

            /* ISSUE LIST */

            <div className="worker-issue-list">

              {issues.map(
                (issue, index) => (

                  <article
                    className="worker-issue-card"
                    key={
                      issue.firestoreId
                    }
                  >

                    {/* INDEX */}

                    <div className="worker-issue-index">

                      {String(
                        index + 1
                      ).padStart(2, "0")}

                    </div>


                    {/* THUMBNAIL */}

                    <div className="worker-issue-thumb">

                      {issue.beforePhoto ||
                      issue.photo ? (

                        <img
                          src={
                            issue.beforePhoto ||
                            issue.photo
                          }
                          alt=""
                        />

                      ) : (

                        <div>
                          <Camera
                            size={22}
                          />
                        </div>

                      )}

                    </div>


                    {/* CONTENT */}

                    <div className="worker-issue-main">

                      <div className="worker-issue-topline">

                        <span className="worker-job-id">

                          #{issue.id ||
                            issue.firestoreId
                              .slice(0, 8)
                              .toUpperCase()}

                        </span>


                        <span
                          className={`worker-status-pill ${getStatusClass(
                            issue.status
                          )}`}
                        >

                          <span />

                          {issue.status ||
                            "Reported"}

                        </span>

                      </div>


                      <h3>

                        {issue.title ||
                          issue.category ||
                          "Civic Issue"}

                      </h3>


                      <p>

                        {issue.description ||
                          "No description provided."}

                      </p>


                      <div className="worker-issue-details">

                        <span>

                          <MapPin
                            size={13}
                          />

                          {issue.location
                            ? `${issue.location[0]}, ${issue.location[1]}`
                            : "Location unavailable"}

                        </span>


                        <span>

                          <Clock3
                            size={13}
                          />

                          {formatDate(
                            issue.date
                          )}

                        </span>


                        <span
                          className={getPriorityClass(
                            issue.severity
                          )}
                        >

                          {issue.severity ||
                            "Medium"}

                          {" "}PRIORITY

                        </span>

                      </div>

                    </div>


                    {/* ACTION */}

                    <button
                      className="worker-open-job"
                      onClick={() =>
                        openIssue(
                          issue
                        )
                      }
                    >

                      <span>
                        OPEN JOB
                      </span>

                      <ChevronRight
                        size={17}
                      />

                    </button>

                  </article>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            BOTTOM OPERATION STRIP
        ================================================= */}

        <section className="worker-operation-strip">

          <div className="worker-operation-item">

            <div className="worker-operation-icon">
              <ShieldCheck
                size={18}
              />
            </div>

            <div>

              <span>
                SECURE SESSION
              </span>

              <strong>
                Worker identity verified
              </strong>

            </div>

          </div>


          <div className="worker-operation-line" />


          <div className="worker-operation-item">

            <div className="worker-operation-icon">
              <Radio
                size={18}
              />
            </div>

            <div>

              <span>
                REAL-TIME SYNC
              </span>

              <strong>
                Assignment feed connected
              </strong>

            </div>

          </div>


          <div className="worker-operation-line" />


          <div className="worker-operation-item">

            <div className="worker-operation-icon">
              <Check
                size={18}
              />
            </div>

            <div>

              <span>
                FIELD PROTOCOL
              </span>

              <strong>
                Document every completed job
              </strong>

            </div>

          </div>

        </section>

      </main>

    </section>
  );
}


export default WorkerDashboard;
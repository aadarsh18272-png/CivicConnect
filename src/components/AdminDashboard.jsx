import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  MapPin,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  LogOut,
} from "lucide-react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { signOut } from "firebase/auth";

import { db, auth } from "../firebase";


function AdminDashboard({ user, onLogout }) {
  // =========================================================
  // STATE
  // =========================================================

  const [issues, setIssues] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [workersLoading, setWorkersLoading] =
    useState(true);

  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterStatus, setFilterStatus] =
    useState("All");

  const [followUpDrafts, setFollowUpDrafts] =
    useState({});


  // =========================================================
  // LOAD ISSUES
  // =========================================================

  useEffect(() => {
    const issuesQuery = query(
      collection(db, "issues"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const firestoreIssues =
          snapshot.docs.map((issueDoc) => ({
            ...issueDoc.data(),
            firestoreId: issueDoc.id,
          }));

        setIssues(firestoreIssues);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error(
          "Admin dashboard error:",
          snapshotError
        );

        setError(
          `Firebase error: ${
            snapshotError?.code || "unknown"
          } — ${
            snapshotError?.message ||
            "Unable to load reports."
          }`
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  // =========================================================
  // LOAD WORKERS
  // =========================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "workers"),
      (snapshot) => {
        const workerList =
          snapshot.docs.map((workerDoc) => ({
            ...workerDoc.data(),
            firestoreId: workerDoc.id,
          }));

        setWorkers(workerList);
        setWorkersLoading(false);
      },
      (snapshotError) => {
        console.error(
          "Unable to load workers:",
          snapshotError
        );

        setWorkersLoading(false);

        setError(
          `Worker loading error: ${
            snapshotError?.code || "unknown"
          } — ${
            snapshotError?.message ||
            "Unable to load workers."
          }`
        );
      }
    );

    return () => unsubscribe();
  }, []);


  // =========================================================
  // STATISTICS
  // =========================================================

  const stats = useMemo(() => {
    const assigned = issues.filter(
      (issue) => issue.assignedWorkerId
    ).length;

    const unassigned = issues.filter(
      (issue) => !issue.assignedWorkerId
    ).length;

    return {
      total: issues.length,

      reported: issues.filter(
        (issue) =>
          issue.status === "Reported"
      ).length,

      review: issues.filter(
        (issue) =>
          issue.status === "Under Review"
      ).length,

      improved: issues.filter(
        (issue) =>
          issue.status === "Improved"
      ).length,

      assigned,

      unassigned,

      workers: workers.length,
    };
  }, [issues, workers]);


  // =========================================================
  // FILTERED ISSUES
  // =========================================================

  const filteredIssues = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesSearch =
        !search ||
        String(issue.id || "")
          .toLowerCase()
          .includes(search) ||
        String(issue.title || "")
          .toLowerCase()
          .includes(search) ||
        String(issue.category || "")
          .toLowerCase()
          .includes(search) ||
        String(issue.description || "")
          .toLowerCase()
          .includes(search) ||
        String(issue.reporter || "")
          .toLowerCase()
          .includes(search) ||
        String(
          issue.assignedWorkerName || ""
        )
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        filterStatus === "All" ||
        issue.status === filterStatus;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    issues,
    searchTerm,
    filterStatus,
  ]);


  // =========================================================
  // FOLLOW-UP DRAFT
  // =========================================================

  const getDraft = (issue) => {
    return (
      followUpDrafts[
        issue.firestoreId
      ] || {
        afterPhoto:
          issue.afterPhoto || "",

        observation:
          issue.observation || "",

        actionTaken:
          issue.actionTaken || "",

        outcome:
          issue.outcome ||
          "Pending follow-up",
      }
    );
  };


  const updateDraft = (
    issueId,
    changes
  ) => {
    const currentIssue =
      issues.find(
        (issue) =>
          issue.firestoreId === issueId
      );

    if (!currentIssue) {
      return;
    }

    setFollowUpDrafts(
      (previous) => ({
        ...previous,

        [issueId]: {
          ...getDraft(currentIssue),
          ...changes,
        },
      })
    );
  };


  // =========================================================
  // IMAGE COMPRESSION
  // =========================================================

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

            if (!context) {
              reject(
                new Error(
                  "Unable to process image."
                )
              );

              return;
            }

            context.drawImage(
              image,
              0,
              0,
              width,
              height
            );

            const compressedDataUrl =
              canvas.toDataURL(
                "image/jpeg",
                0.68
              );

            resolve(
              compressedDataUrl
            );
          };

          image.onerror = () => {
            reject(
              new Error(
                "Unable to read image."
              )
            );
          };

          image.src =
            event.target.result;
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Unable to read selected file."
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  };


  // =========================================================
  // AFTER PHOTO
  // =========================================================

  const handleAfterPhotoChange = async (
    issue,
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image file."
      );

      return;
    }

    try {
      setActionId(
        issue.firestoreId
      );

      setError("");

      const compressedImage =
        await compressImage(file);

      updateDraft(
        issue.firestoreId,
        {
          afterPhoto:
            compressedImage,
        }
      );
    } catch (error) {
      console.error(
        "After photo error:",
        error
      );

      setError(
        "Unable to process the after photo. Please try another image."
      );
    } finally {
      setActionId("");
    }

    event.target.value = "";
  };


  const removeAfterPhoto = (
    issueId
  ) => {
    updateDraft(issueId, {
      afterPhoto: "",
    });
  };


  // =========================================================
  // SAVE FOLLOW-UP
  // =========================================================

  const handleSaveFollowUp = async (
    issue
  ) => {
    const draft =
      getDraft(issue);

    if (
      !draft.afterPhoto &&
      !draft.observation.trim() &&
      !draft.actionTaken.trim() &&
      draft.outcome ===
        "Pending follow-up"
    ) {
      setError(
        "Add follow-up evidence, observation, action taken, or outcome before saving."
      );

      return;
    }

    try {
      setActionId(
        issue.firestoreId
      );

      setError("");

      const updateData = {
        afterPhoto:
          draft.afterPhoto || "",

        observation:
          draft.observation.trim(),

        actionTaken:
          draft.actionTaken.trim(),

        outcome:
          draft.outcome,

        updatedAt:
          new Date().toISOString(),
      };

      if (
        draft.outcome ===
        "Improved"
      ) {
        updateData.status =
          "Improved";
      }

      await updateDoc(
        doc(
          db,
          "issues",
          issue.firestoreId
        ),
        updateData
      );

      setFollowUpDrafts(
        (previous) => ({
          ...previous,

          [issue.firestoreId]:
            draft,
        })
      );
    } catch (error) {
      console.error(
        "Unable to save follow-up:",
        error
      );

      setError(
        `Follow-up error: ${
          error?.code ||
          "unknown"
        } — ${
          error?.message ||
          "Unable to save follow-up."
        }`
      );
    } finally {
      setActionId("");
    }
  };


  // =========================================================
  // ASSIGN WORKER
  // =========================================================

  const handleAssignWorker = async (
    issue,
    workerId
  ) => {
    try {
      setActionId(
        issue.firestoreId
      );

      setError("");

      if (!workerId) {
        await updateDoc(
          doc(
            db,
            "issues",
            issue.firestoreId
          ),
          {
            assignedWorkerId: "",
            assignedWorkerName: "",
            assignedWorkerEmail: "",
            assignedAt: "",
            updatedAt:
              new Date().toISOString(),
          }
        );

        return;
      }

      const selectedWorker =
        workers.find(
          (worker) =>
            worker.uid === workerId ||
            worker.firestoreId ===
              workerId
        );

      if (!selectedWorker) {
        setError(
          "Selected worker could not be found."
        );

        return;
      }

      await updateDoc(
        doc(
          db,
          "issues",
          issue.firestoreId
        ),
        {
          assignedWorkerId:
            selectedWorker.uid ||
            selectedWorker.firestoreId,

          assignedWorkerName:
            selectedWorker.name ||
            "Worker",

          assignedWorkerEmail:
            selectedWorker.email ||
            "",

          assignedAt:
            new Date().toISOString(),

          status:
            issue.status ===
              "Reported"
              ? "Under Review"
              : issue.status,

          updatedAt:
            new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error(
        "Unable to assign worker:",
        error
      );

      setError(
        `Assignment error: ${
          error?.code ||
          "unknown"
        } — ${
          error?.message ||
          "Unable to assign worker."
        }`
      );
    } finally {
      setActionId("");
    }
  };


  // =========================================================
  // STATUS
  // =========================================================

  const handleStatusChange = async (
    firestoreId,
    status
  ) => {
    try {
      setActionId(
        firestoreId
      );

      setError("");

      await updateDoc(
        doc(
          db,
          "issues",
          firestoreId
        ),
        {
          status,
          updatedAt:
            new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error(
        "Unable to update issue:",
        error
      );

      setError(
        `Update error: ${
          error?.code ||
          "unknown"
        } — ${
          error?.message ||
          "Unknown Firebase error"
        }`
      );
    } finally {
      setActionId("");
    }
  };


  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    firestoreId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this report?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(
        firestoreId
      );

      setError("");

      await deleteDoc(
        doc(
          db,
          "issues",
          firestoreId
        )
      );
    } catch (error) {
      console.error(
        "Unable to delete issue:",
        error
      );

      setError(
        `Delete error: ${
          error?.code ||
          "unknown"
        } — ${
          error?.message ||
          "Unable to delete this report."
        }`
      );
    } finally {
      setActionId("");
    }
  };


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        if (onLogout) {
          onLogout();
        }
      } catch (error) {
        console.error(
          "Logout error:",
          error
        );

        setError(
          "Unable to sign out."
        );
      }
    };


  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate = (
    value
  ) => {
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


  const getStatusClass = (
    status
  ) => {
    return String(
      status || "Reported"
    )
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  const getSeverityClass = (
    severity
  ) => {
    return String(
      severity || "Medium"
    )
      .toLowerCase()
      .replace(/\s+/g, "-");
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <>


      <section className="admin-dashboard">

        <div className="admin-dashboard-shell">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="admin-dashboard-header">

            <div className="admin-hero-content">

              <span className="admin-dashboard-kicker">
                <ShieldCheck size={14} />
                CIVICCONNECT ADMIN
              </span>

              <h1>
                Report Management
              </h1>

              <p>
                Review community reports, coordinate field workers,
                manage civic progress and maintain the evidence record.
              </p>

              <div className="admin-hero-meta">
                <span className="admin-live-chip">
                  <i aria-hidden="true" />
                  SYSTEM ONLINE
                </span>
                <span className="admin-hero-meta-text">
                  Live Firestore operations console
                </span>
              </div>

            </div>


            <div className="admin-hero-side">
              <div className="admin-system-card">
                <div className="admin-system-orbit" aria-hidden="true">
                  <span />
                </div>
                <div>
                  <span className="admin-system-label">CONTROL STATUS</span>
                  <strong>Operational</strong>
                  <small>Realtime data connected</small>
                </div>
              </div>

              <div className="admin-dashboard-actions">

              <button
                type="button"
                className="admin-refresh-button"
                onClick={() =>
                  window.location.reload()
                }
              >
                <RefreshCw size={17} />
                Refresh
              </button>


              <button
                type="button"
                className="admin-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Sign Out
              </button>

              </div>
            </div>

          </header>


          {/* =================================================
              USER BAR
          ================================================= */}

          {user?.email && (
            <div className="admin-user-bar">
              <span className="admin-user-status-dot" aria-hidden="true" />
              <span className="admin-user-label">Authenticated session</span>
              <span className="admin-user-separator">/</span>
              <strong>{user.email}</strong>
              <span className="admin-user-secure">SECURE</span>
            </div>
          )}


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="admin-dashboard-error">

              <AlertTriangle size={18} />

              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
                className="admin-error-dismiss"
              >
                <X size={17} />
              </button>

            </div>
          )}


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="admin-stats-grid">

            <div className="admin-stat-card admin-stat-total">

              <div className="admin-stat-icon">
                <FileText size={20} />
              </div>

              <div>
                <span>
                  Total Reports
                </span>

                <strong>
                  {stats.total}
                </strong>
                <small className="admin-stat-foot">Live records</small>
              </div>

            </div>


            <div className="admin-stat-card admin-stat-reported">

              <div className="admin-stat-icon">
                <Clock3 size={20} />
              </div>

              <div>
                <span>
                  Reported
                </span>

                <strong>
                  {stats.reported}
                </strong>
                <small className="admin-stat-foot">Awaiting review</small>
              </div>

            </div>


            <div className="admin-stat-card admin-stat-review">

              <div className="admin-stat-icon">
                <RefreshCw size={20} />
              </div>

              <div>
                <span>
                  Under Review
                </span>

                <strong>
                  {stats.review}
                </strong>
                <small className="admin-stat-foot">In progress</small>
              </div>

            </div>


            <div className="admin-stat-card admin-stat-improved">

              <div className="admin-stat-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>
                  Improved
                </span>

                <strong>
                  {stats.improved}
                </strong>
                <small className="admin-stat-foot">Resolved evidence</small>
              </div>

            </div>


            <div className="admin-stat-card admin-stat-workers">

              <div className="admin-stat-icon">
                <Users size={20} />
              </div>

              <div>
                <span>
                  Field Workers
                </span>

                <strong>
                  {stats.workers}
                </strong>
                <small className="admin-stat-foot">Available team</small>
              </div>

            </div>

          </div>


          {/* =================================================
              REPORT PANEL
          ================================================= */}

          <div className="admin-reports-panel">

            <div className="admin-reports-heading">

              <div>

                <span className="admin-dashboard-kicker">
                  FIRESTORE REPORTS
                </span>

                <h2>
                  Community Issues
                </h2>

              </div>

              <div className="admin-report-heading-tools">
                <span className="admin-stream-chip">
                  <i aria-hidden="true" /> LIVE STREAM
                </span>
                <span className="admin-report-count">
                  {filteredIssues.length}
                  {" "}
                  visible
                </span>
              </div>

            </div>


            {/* SEARCH + FILTER */}

            <div className="admin-toolbar">
              <div className="admin-toolbar-caption">
                <span>ISSUE INTELLIGENCE</span>
                <small>Search, filter and coordinate field response</small>
              </div>

              <div className="admin-search-wrap">

                <Search size={17} />

                <input
                  className="admin-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search reports, categories, workers..."
                />

              </div>


              <select
                className="admin-filter-select"
                value={filterStatus}
                onChange={(event) =>
                  setFilterStatus(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Reported">
                  Reported
                </option>

                <option value="Under Review">
                  Under Review
                </option>

                <option value="Improved">
                  Improved
                </option>
              </select>

            </div>


            {/* =================================================
                LOADING
            ================================================= */}

            {loading ? (

              <div className="admin-empty-state">

                <RefreshCw
                  size={25}
                  className="admin-loading-icon"
                />

                <p>
                  Loading reports...
                </p>

              </div>

            ) : filteredIssues.length === 0 ? (

              <div className="admin-empty-state">

                <FileText size={30} />

                <h3>
                  No reports found
                </h3>

                <p>
                  Try changing your search
                  or filter.
                </p>

              </div>

            ) : (

              <div className="admin-report-list">

                {filteredIssues.map(
                  (issue) => {

                    const draft =
                      getDraft(issue);

                    const busy =
                      actionId ===
                      issue.firestoreId;

                    return (

                      <article
                        className="admin-report-card"
                        key={
                          issue.firestoreId
                        }
                      >

                        <div className="admin-report-main">

                          {/* ISSUE HEADER */}

                          <div className="admin-report-top">

                            <div>

                              <span className="admin-report-id">
                                {issue.id ||
                                  issue.firestoreId}
                              </span>

                              <h3>
                                {issue.title ||
                                  issue.category ||
                                  "Civic Issue"}
                              </h3>

                            </div>


                            <span
                              className={`admin-status-badge ${getStatusClass(
                                issue.status
                              )}`}
                            >
                              {issue.status ||
                                "Reported"}
                            </span>

                          </div>


                          {/* DESCRIPTION */}

                          <p className="admin-report-description">

                            {issue.description ||
                              "No description provided."}

                          </p>


                          {/* META */}

                          <div className="admin-report-meta">

                            <span>
                              <MapPin
                                size={15}
                              />

                              {issue.location
                                ? `${issue.location[0]}, ${issue.location[1]}`
                                : "Location not provided"}
                            </span>


                            <span>
                              Date:{" "}
                              {formatDate(
                                issue.date
                              )}
                            </span>


                            <span>
                              Reporter:{" "}
                              {issue.reporter ||
                                "Community Member"}
                            </span>


                            {issue.severity && (
                              <span
                                className={`severity-${getSeverityClass(
                                  issue.severity
                                )}`}
                              >
                                Severity:{" "}
                                {issue.severity}
                              </span>
                            )}

                          </div>


                          {/* =================================================
                              ASSIGN WORKER
                          ================================================= */}

                          <div className="admin-assignment-box">

                            <div className="admin-assignment-header">

                              <div className="admin-assignment-title">

                                <UserCheck size={17} />

                                ASSIGN FIELD WORKER

                              </div>

                              <span className="admin-assignment-status">

                                {workersLoading
                                  ? "Loading workers..."
                                  : workers.length === 0
                                  ? "No workers registered"
                                  : `${workers.length} worker${
                                      workers.length ===
                                      1
                                        ? ""
                                        : "s"
                                    } available`}

                              </span>

                            </div>


                            <div className="admin-assignment-row">

                              <div className="admin-assignment-select-wrap">

                                <select
                                  className="admin-assignment-select"
                                  value={
                                    issue.assignedWorkerId ||
                                    ""
                                  }
                                  disabled={
                                    busy ||
                                    workersLoading
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleAssignWorker(
                                      issue,
                                      event.target.value
                                    )
                                  }
                                >

                                  <option value="">
                                    {workersLoading
                                      ? "Loading workers..."
                                      : "Unassigned — select a worker"}
                                  </option>


                                  {workers.map(
                                    (worker) => (

                                      <option
                                        key={
                                          worker.uid ||
                                          worker.firestoreId
                                        }
                                        value={
                                          worker.uid ||
                                          worker.firestoreId
                                        }
                                      >
                                        {worker.name ||
                                          "Unnamed Worker"}
                                        {" — "}
                                        {worker.email ||
                                          "No email"}
                                      </option>

                                    )
                                  )}

                                </select>

                                <ChevronDown
                                  size={16}
                                />

                              </div>

                            </div>


                            {issue.assignedWorkerId && (
                              <div className="admin-assigned-pill">

                                <UserCheck
                                  size={14}
                                />

                                Assigned to{" "}
                                {
                                  issue.assignedWorkerName
                                }

                              </div>
                            )}

                          </div>


                          {/* =================================================
                              FOLLOW-UP
                          ================================================= */}

                          <div className="admin-followup-box">

                            <div className="admin-followup-heading">

                              <div>

                                <span className="admin-followup-kicker">
                                  FIELD EVIDENCE
                                </span>

                                <h4>
                                  Follow-up & Outcome
                                </h4>

                              </div>

                            </div>


                            {/* AFTER PHOTO */}

                            {!draft.afterPhoto ? (

                              <label
                                className="admin-after-upload"
                                htmlFor={`after-photo-${issue.firestoreId}`}
                              >

                                <Camera
                                  size={24}
                                />

                                <strong>
                                  Upload After Photo
                                </strong>

                                <span>
                                  Add evidence after
                                  the civic action or
                                  improvement.
                                </span>

                                <input
                                  id={`after-photo-${issue.firestoreId}`}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(event) =>
                                    handleAfterPhotoChange(
                                      issue,
                                      event
                                    )
                                  }
                                  disabled={busy}
                                />

                              </label>

                            ) : (

                              <div className="admin-after-preview">

                                <img
                                  src={
                                    draft.afterPhoto
                                  }
                                  alt="After civic issue evidence"
                                />

                                <button
                                  type="button"
                                  className="admin-remove-after"
                                  onClick={() =>
                                    removeAfterPhoto(
                                      issue.firestoreId
                                    )
                                  }
                                  disabled={busy}
                                  aria-label="Remove after photo"
                                >
                                  <X
                                    size={17}
                                  />
                                </button>

                              </div>

                            )}


                            {/* FOLLOW-UP FIELDS */}

                            <div className="admin-followup-fields">

                              <label>

                                <span>
                                  Observation
                                </span>

                                <textarea
                                  rows="3"
                                  value={
                                    draft.observation
                                  }
                                  onChange={(event) =>
                                    updateDraft(
                                      issue.firestoreId,
                                      {
                                        observation:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  placeholder="What did the field worker observe at the location?"
                                />

                              </label>


                              <label>

                                <span>
                                  Outcome
                                </span>

                                <select
                                  value={
                                    draft.outcome
                                  }
                                  onChange={(event) =>
                                    updateDraft(
                                      issue.firestoreId,
                                      {
                                        outcome:
                                          event
                                            .target
                                            .value,
                                      }
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


                              <label
                                style={{
                                  gridColumn:
                                    "1 / -1",
                                }}
                              >

                                <span>
                                  Action Taken
                                </span>

                                <textarea
                                  rows="3"
                                  value={
                                    draft.actionTaken
                                  }
                                  onChange={(event) =>
                                    updateDraft(
                                      issue.firestoreId,
                                      {
                                        actionTaken:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  placeholder="Example: Area cleaned, waste removed and residents informed."
                                />

                              </label>

                            </div>


                            <button
                              type="button"
                              className="admin-save-followup"
                              onClick={() =>
                                handleSaveFollowUp(
                                  issue
                                )
                              }
                              disabled={busy}
                            >

                              <Save size={16} />

                              {busy
                                ? "Saving..."
                                : "Save Follow-up"}

                            </button>

                          </div>

                        </div>


                        {/* =================================================
                            STATUS + DELETE
                        ================================================= */}

                        <div className="admin-report-actions">

                          <div className="admin-status-actions">

                            <button
                              type="button"
                              className={
                                issue.status ===
                                "Reported"
                                  ? "active"
                                  : ""
                              }
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(
                                  issue.firestoreId,
                                  "Reported"
                                )
                              }
                            >
                              Reported
                            </button>


                            <button
                              type="button"
                              className={
                                issue.status ===
                                "Under Review"
                                  ? "active"
                                  : ""
                              }
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(
                                  issue.firestoreId,
                                  "Under Review"
                                )
                              }
                            >
                              Under Review
                            </button>


                            <button
                              type="button"
                              className={
                                issue.status ===
                                "Improved"
                                  ? "active"
                                  : ""
                              }
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(
                                  issue.firestoreId,
                                  "Improved"
                                )
                              }
                            >
                              Improved
                            </button>

                          </div>


                          <button
                            type="button"
                            className="admin-delete-button"
                            disabled={busy}
                            onClick={() =>
                              handleDelete(
                                issue.firestoreId
                              )
                            }
                          >

                            <Trash2
                              size={16}
                            />

                            Delete

                          </button>

                        </div>

                      </article>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </section>
    </>
  );
}


export default AdminDashboard;
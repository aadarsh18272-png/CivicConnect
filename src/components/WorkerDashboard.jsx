import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  LogOut,
  MapPin,
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
  const [workerProfile, setWorkerProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(true);

  const [selectedIssue, setSelectedIssue] =
    useState(null);

  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const [observation, setObservation] =
    useState("");

  const [actionTaken, setActionTaken] =
    useState("");

  const [outcome, setOutcome] = useState(
    "Pending follow-up"
  );

  const [afterPhoto, setAfterPhoto] =
    useState("");

  const [saving, setSaving] = useState(false);

  // =========================================================
  // LOAD WORKER PROFILE
  // =========================================================

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "workers", user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setWorkerProfile(snapshot.data());
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

  // =========================================================
  // LOAD ASSIGNED ISSUES
  // =========================================================

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

  // =========================================================
  // STATS
  // =========================================================

  const stats = useMemo(() => {
    return {
      assigned: issues.length,

      inProgress: issues.filter(
        (issue) =>
          issue.status ===
          "Under Review"
      ).length,

      completed: issues.filter(
        (issue) =>
          issue.status ===
          "Improved"
      ).length,
    };
  }, [issues]);

  // =========================================================
  // OPEN ISSUE
  // =========================================================

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

  // =========================================================
  // PHOTO
  // =========================================================

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
      setActionId(
        selectedIssue?.firestoreId
      );

      setError("");

      const image =
        await compressImage(file);

      setAfterPhoto(image);
    } catch (error) {
      console.error(
        error
      );

      setError(
        "Unable to process the photo."
      );
    } finally {
      setActionId("");
    }

    event.target.value = "";
  };

  // =========================================================
  // SUBMIT FOLLOW-UP
  // =========================================================

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

      setSelectedIssue(null);

      setObservation("");
      setActionTaken("");
      setAfterPhoto("");
      setOutcome(
        "Pending follow-up"
      );
    } catch (error) {
      console.error(
        "Follow-up submission error:",
        error
      );

      setError(
        `Unable to submit follow-up: ${
          error?.message ||
          "Firebase error"
        }`
      );
    } finally {
      setSaving(false);
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

  const formatDate = (value) => {
    if (!value) return "No date";

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

  // =========================================================
  // WORK DETAIL VIEW
  // =========================================================

  if (selectedIssue) {
    return (
      <>
        <style>{workerStyles}</style>

        <section className="worker-app">

          <header className="worker-header">
            <div className="worker-brand">
              <div className="worker-brand-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <strong>
                  CivicConnect
                </strong>

                <span>
                  Field Operations
                </span>
              </div>
            </div>

            <button
              className="worker-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </header>

          <main className="worker-detail-page">

            <button
              className="worker-back"
              onClick={() =>
                setSelectedIssue(null)
              }
            >
              <ArrowLeft size={17} />
              Back to Assigned Work
            </button>

            <div className="worker-detail-heading">

              <div>
                <span className="worker-eyebrow">
                  FIELD WORK
                </span>

                <h1>
                  {selectedIssue.title ||
                    selectedIssue.category ||
                    "Civic Issue"}
                </h1>

                <p>
                  {selectedIssue.id}
                </p>
              </div>

              <span className="worker-status">
                {selectedIssue.status ||
                  "Reported"}
              </span>

            </div>

            <div className="worker-detail-grid">

              {/* BEFORE PHOTO */}

              <div className="worker-card">

                <div className="worker-card-heading">
                  <div>
                    <span>
                      EVIDENCE
                    </span>

                    <h2>
                      Before
                    </h2>
                  </div>

                  <Camera size={20} />
                </div>

                {selectedIssue.beforePhoto ||
                selectedIssue.photo ? (
                  <img
                    className="worker-evidence-image"
                    src={
                      selectedIssue.beforePhoto ||
                      selectedIssue.photo
                    }
                    alt="Before civic issue"
                  />
                ) : (
                  <div className="worker-no-image">
                    <Camera size={28} />
                    <p>
                      No before photo
                    </p>
                  </div>
                )}

              </div>


              {/* ISSUE INFORMATION */}

              <div className="worker-card">

                <div className="worker-card-heading">
                  <div>
                    <span>
                      ISSUE DETAILS
                    </span>

                    <h2>
                      What needs attention?
                    </h2>
                  </div>

                  <FileText size={20} />
                </div>

                <p className="worker-description">
                  {selectedIssue.description ||
                    "No description provided."}
                </p>

                <div className="worker-detail-meta">

                  <div>
                    <MapPin size={17} />

                    <span>
                      {selectedIssue.location
                        ? `${selectedIssue.location[0]}, ${selectedIssue.location[1]}`
                        : "Location not provided"}
                    </span>
                  </div>

                  <div>
                    <Clock3 size={17} />

                    <span>
                      Reported{" "}
                      {formatDate(
                        selectedIssue.date
                      )}
                    </span>
                  </div>

                  <div>
                    <AlertTriangle size={17} />

                    <span>
                      Severity:{" "}
                      {selectedIssue.severity ||
                        "Medium"}
                    </span>
                  </div>

                </div>

              </div>

            </div>


            {/* FOLLOW-UP */}

            <div className="worker-followup">

              <div className="worker-followup-heading">

                <div>
                  <span className="worker-eyebrow">
                    FIELD FOLLOW-UP
                  </span>

                  <h2>
                    Record your work
                  </h2>

                  <p>
                    Document what you observed,
                    what action you took and
                    provide after-work evidence.
                  </p>
                </div>

              </div>


              {/* OBSERVATION */}

              <label className="worker-field">

                <span>
                  Observation
                </span>

                <textarea
                  value={observation}
                  onChange={(event) =>
                    setObservation(
                      event.target.value
                    )
                  }
                  placeholder="What did you observe when you reached the location?"
                  rows="5"
                />

              </label>


              {/* ACTION */}

              <label className="worker-field">

                <span>
                  Action Taken
                </span>

                <textarea
                  value={actionTaken}
                  onChange={(event) =>
                    setActionTaken(
                      event.target.value
                    )
                  }
                  placeholder="Describe the work you performed..."
                  rows="5"
                />

              </label>


              {/* AFTER PHOTO */}

              <div className="worker-field">

                <span>
                  After Photo
                </span>

                {!afterPhoto ? (

                  <label
                    className="worker-upload"
                    htmlFor="worker-after-photo"
                  >
                    <Camera size={28} />

                    <strong>
                      Upload After Photo
                    </strong>

                    <small>
                      Take a photo of the
                      completed work and
                      upload it here.
                    </small>

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
                      alt="After work evidence"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setAfterPhoto("")
                      }
                    >
                      <X size={17} />
                    </button>

                  </div>

                )}

              </div>


              {/* OUTCOME */}

              <label className="worker-field">

                <span>
                  Outcome
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


              {error && (
                <div className="worker-error">
                  <AlertTriangle
                    size={17}
                  />

                  {error}
                </div>
              )}


              <button
                className="worker-submit"
                disabled={saving}
                onClick={
                  submitFollowUp
                }
              >
                <Save size={18} />

                {saving
                  ? "Submitting Follow-up..."
                  : "Submit Follow-up"}

                {!saving && (
                  <CheckCircle2
                    size={18}
                  />
                )}
              </button>

            </div>

          </main>
        </section>
      </>
    );
  }

  // =========================================================
  // WORKER DASHBOARD
  // =========================================================

  return (
    <>
      <style>{workerStyles}</style>

      <section className="worker-app">

        {/* HEADER */}

        <header className="worker-header">

          <div className="worker-brand">

            <div className="worker-brand-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <strong>
                CivicConnect
              </strong>

              <span>
                Field Operations
              </span>
            </div>

          </div>


          <div className="worker-header-right">

            <div className="worker-user">

              <div className="worker-avatar">
                <UserRound size={17} />
              </div>

              <div>
                <strong>
                  {workerProfile?.name ||
                    user?.email ||
                    "Worker"}
                </strong>

                <span>
                  Field Worker
                </span>
              </div>

            </div>


            <button
              className="worker-logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Sign Out
            </button>

          </div>

        </header>


        <main className="worker-dashboard">

          {/* HERO */}

          <section className="worker-hero">

            <div>

              <span className="worker-eyebrow">
                FIELD OPERATIONS
              </span>

              <h1>
                {workerProfile?.name
                  ? `Hello, ${workerProfile.name.split(" ")[0]}`
                  : "Worker Dashboard"}
              </h1>

              <p>
                Manage your assigned civic
                issues, document field work and
                submit improvement evidence.
              </p>

            </div>

            <div className="worker-hero-mark">
              <ShieldCheck size={65} />
            </div>

          </section>


          {/* ERROR */}

          {error && (
            <div className="worker-error">
              <AlertTriangle
                size={17}
              />

              {error}

              <button
                onClick={() =>
                  setError("")
                }
              >
                <X size={15} />
              </button>
            </div>
          )}


          {/* STATS */}

          <section className="worker-stats">

            <div className="worker-stat">

              <div>
                <span>
                  Assigned
                </span>

                <strong>
                  {stats.assigned}
                </strong>
              </div>

              <FileText size={21} />

            </div>


            <div className="worker-stat">

              <div>
                <span>
                  In Progress
                </span>

                <strong>
                  {stats.inProgress}
                </strong>
              </div>

              <Clock3 size={21} />

            </div>


            <div className="worker-stat">

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {stats.completed}
                </strong>
              </div>

              <CheckCircle2 size={21} />

            </div>

          </section>


          {/* ASSIGNED WORK */}

          <section className="worker-work-section">

            <div className="worker-section-heading">

              <div>
                <span className="worker-eyebrow">
                  YOUR WORK
                </span>

                <h2>
                  Assigned Issues
                </h2>
              </div>

              <span className="worker-count">
                {issues.length}{" "}
                {issues.length === 1
                  ? "issue"
                  : "issues"}
              </span>

            </div>


            {loading ? (

              <div className="worker-empty">
                <Clock3 size={28} />
                <h3>
                  Loading your work...
                </h3>
              </div>

            ) : issues.length === 0 ? (

              <div className="worker-empty">

                <CheckCircle2
                  size={34}
                />

                <h3>
                  No work assigned yet
                </h3>

                <p>
                  Your assigned civic issues
                  will appear here when an
                  administrator assigns them
                  to you.
                </p>

              </div>

            ) : (

              <div className="worker-issue-list">

                {issues.map(
                  (issue) => (

                    <article
                      className="worker-issue-card"
                      key={
                        issue.firestoreId
                      }
                    >

                      <div className="worker-issue-content">

                        <div className="worker-issue-top">

                          <div>

                            <span>
                              {issue.id ||
                                issue.firestoreId}
                            </span>

                            <h3>
                              {issue.title ||
                                issue.category ||
                                "Civic Issue"}
                            </h3>

                          </div>

                          <strong>
                            {issue.status ||
                              "Reported"}
                          </strong>

                        </div>


                        <p>
                          {issue.description ||
                            "No description provided."}
                        </p>


                        <div className="worker-issue-meta">

                          <span>
                            <MapPin
                              size={14}
                            />

                            {issue.location
                              ? `${issue.location[0]}, ${issue.location[1]}`
                              : "Location unavailable"}
                          </span>

                          <span>
                            Reported{" "}
                            {formatDate(
                              issue.date
                            )}
                          </span>

                          <span>
                            {issue.severity ||
                              "Medium"}{" "}
                            severity
                          </span>

                        </div>

                      </div>


                      <button
                        className="worker-open-button"
                        onClick={() =>
                          openIssue(
                            issue
                          )
                        }
                      >
                        Open Work
                        <ArrowLeft
                          size={17}
                          style={{
                            transform:
                              "rotate(180deg)",
                          }}
                        />
                      </button>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        </main>

      </section>
    </>
  );
}


// =========================================================
// STYLES
// =========================================================

const workerStyles = `

  * {
    box-sizing: border-box;
  }

  .worker-app {
    min-height: 100vh;
    background:
      radial-gradient(
        circle at top left,
        rgba(54, 103, 74, .10),
        transparent 30%
      ),
      #f5f7f3;
    color: #18241c;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .worker-header {
    height: 76px;
    padding: 0 5vw;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 1px solid #dfe6df;
    background: rgba(255,255,255,.90);
    backdrop-filter: blur(18px);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .worker-brand,
  .worker-header-right,
  .worker-user {
    display: flex;
    align-items: center;
  }

  .worker-brand {
    gap: 11px;
  }

  .worker-brand-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #183b2a;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .worker-brand strong,
  .worker-brand span,
  .worker-user strong,
  .worker-user span {
    display: block;
  }

  .worker-brand strong {
    font-size: 15px;
    letter-spacing: -.02em;
  }

  .worker-brand span {
    margin-top: 2px;
    color: #718078;
    font-size: 10px;
    font-weight: 700;
  }

  .worker-header-right {
    gap: 18px;
  }

  .worker-user {
    gap: 9px;
  }

  .worker-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #e8f0ea;
    color: #315b42;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .worker-user strong {
    font-size: 12px;
  }

  .worker-user span {
    margin-top: 2px;
    color: #7a857d;
    font-size: 10px;
  }

  .worker-logout {
    height: 39px;
    padding: 0 13px;
    border: 1px solid #d8e0d9;
    border-radius: 10px;
    background: white;
    color: #33443a;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .worker-logout:hover {
    border-color: #9db2a2;
    background: #f7faf7;
  }

  .worker-dashboard,
  .worker-detail-page {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: 48px 0 80px;
  }

  .worker-hero {
    min-height: 250px;
    padding: 38px 42px;
    border-radius: 26px;
    background:
      linear-gradient(
        135deg,
        #173b29,
        #28563c
      );
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    position: relative;
    box-shadow:
      0 22px 55px rgba(25, 57, 39, .16);
  }

  .worker-eyebrow {
    color: #5d8068;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .16em;
  }

  .worker-hero .worker-eyebrow {
    color: rgba(255,255,255,.62);
  }

  .worker-hero h1 {
    margin: 11px 0 10px;
    font-size: clamp(34px, 5vw, 54px);
    line-height: 1;
    letter-spacing: -.05em;
  }

  .worker-hero p {
    max-width: 570px;
    margin: 0;
    color: rgba(255,255,255,.72);
    font-size: 14px;
    line-height: 1.7;
  }

  .worker-hero-mark {
    width: 145px;
    height: 145px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,.72);
    flex-shrink: 0;
  }

  .worker-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin: 18px 0 35px;
  }

  .worker-stat {
    padding: 22px;
    border: 1px solid #dfe6df;
    border-radius: 18px;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow:
      0 9px 25px rgba(28,48,35,.045);
  }

  .worker-stat span {
    display: block;
    color: #7b867e;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .worker-stat strong {
    display: block;
    font-size: 29px;
    letter-spacing: -.04em;
  }

  .worker-stat > svg {
    color: #3d6a4c;
  }

  .worker-error {
    margin: 18px 0;
    padding: 13px 15px;
    border: 1px solid #f0cbc6;
    border-radius: 13px;
    background: #fff2f0;
    color: #a34237;
    font-size: 12px;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .worker-error button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .worker-work-section {
    padding: 28px;
    border: 1px solid #dfe6df;
    border-radius: 23px;
    background: rgba(255,255,255,.84);
    box-shadow:
      0 15px 45px rgba(27,45,34,.05);
  }

  .worker-section-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20px;
  }

  .worker-section-heading h2 {
    margin: 7px 0 0;
    font-size: 27px;
    letter-spacing: -.035em;
  }

  .worker-count {
    padding: 7px 11px;
    border-radius: 999px;
    background: #edf3ee;
    color: #315b42;
    font-size: 10px;
    font-weight: 800;
  }

  .worker-issue-list {
    display: grid;
    gap: 14px;
  }

  .worker-issue-card {
    padding: 22px;
    border: 1px solid #e0e6e1;
    border-radius: 18px;
    background: white;
    transition: .2s ease;
  }

  .worker-issue-card:hover {
    transform: translateY(-2px);
    border-color: #c6d4c9;
    box-shadow:
      0 12px 30px rgba(27,45,34,.06);
  }

  .worker-issue-content {
    margin-bottom: 18px;
  }

  .worker-issue-top {
    display: flex;
    justify-content: space-between;
    gap: 15px;
  }

  .worker-issue-top > div > span {
    color: #839087;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .1em;
  }

  .worker-issue-top h3 {
    margin: 6px 0 0;
    font-size: 20px;
    letter-spacing: -.025em;
  }

  .worker-issue-top > strong {
    height: fit-content;
    padding: 7px 10px;
    border-radius: 999px;
    background: #eaf1f8;
    color: #42657f;
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
  }

  .worker-issue-content > p {
    margin: 12px 0;
    color: #647067;
    font-size: 13px;
    line-height: 1.65;
  }

  .worker-issue-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .worker-issue-meta span {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border: 1px solid #e4e9e4;
    border-radius: 8px;
    color: #748078;
    background: #fafcfa;
    font-size: 10px;
    font-weight: 700;
  }

  .worker-issue-meta svg {
    color: #4f7359;
  }

  .worker-open-button {
    width: 100%;
    height: 46px;
    border: 0;
    border-radius: 11px;
    background: #183b2a;
    color: white;
    font-size: 12px;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .worker-open-button:hover {
    background: #28563c;
  }

  .worker-empty {
    padding: 65px 20px;
    text-align: center;
    color: #748078;
  }

  .worker-empty svg {
    color: #5b7c65;
  }

  .worker-empty h3 {
    margin: 10px 0 5px;
    color: #29372e;
  }

  .worker-empty p {
    max-width: 450px;
    margin: 0 auto;
    font-size: 13px;
    line-height: 1.6;
  }

  .worker-back {
    border: 0;
    background: transparent;
    color: #315b42;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0;
    margin-bottom: 25px;
  }

  .worker-detail-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
  }

  .worker-detail-heading h1 {
    margin: 8px 0 4px;
    font-size: clamp(30px, 4vw, 45px);
    letter-spacing: -.045em;
  }

  .worker-detail-heading p {
    margin: 0;
    color: #7a867e;
    font-size: 11px;
    font-weight: 800;
  }

  .worker-status {
    padding: 9px 13px;
    border-radius: 999px;
    background: #eaf1f8;
    color: #42657f;
    font-size: 10px;
    font-weight: 900;
  }

  .worker-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .worker-card {
    padding: 22px;
    border: 1px solid #dfe6df;
    border-radius: 20px;
    background: white;
    box-shadow:
      0 10px 30px rgba(27,45,34,.04);
  }

  .worker-card-heading {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 17px;
  }

  .worker-card-heading span {
    display: block;
    color: #7a897f;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: .14em;
  }

  .worker-card-heading h2 {
    margin: 5px 0 0;
    font-size: 19px;
  }

  .worker-card-heading > svg {
    color: #4f7359;
  }

  .worker-evidence-image {
    width: 100%;
    height: 310px;
    object-fit: contain;
    border-radius: 13px;
    background: #eef1ed;
    display: block;
  }

  .worker-no-image {
    height: 310px;
    border-radius: 13px;
    background: #f2f5f2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #89948d;
  }

  .worker-no-image p {
    margin: 8px 0 0;
    font-size: 12px;
  }

  .worker-description {
    color: #59665e;
    font-size: 13px;
    line-height: 1.7;
  }

  .worker-detail-meta {
    display: grid;
    gap: 9px;
    margin-top: 22px;
  }

  .worker-detail-meta div {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    color: #6e7b72;
    font-size: 11px;
    line-height: 1.5;
  }

  .worker-detail-meta svg {
    color: #4f7359;
    flex-shrink: 0;
  }

  .worker-followup {
    margin-top: 17px;
    padding: 28px;
    border: 1px solid #dfe6df;
    border-radius: 22px;
    background: white;
  }

  .worker-followup-heading {
    margin-bottom: 24px;
  }

  .worker-followup-heading h2 {
    margin: 7px 0 5px;
    font-size: 26px;
    letter-spacing: -.03em;
  }

  .worker-followup-heading p {
    margin: 0;
    color: #6f7a73;
    font-size: 13px;
  }

  .worker-field {
    display: block;
    margin-bottom: 20px;
  }

  .worker-field > span {
    display: block;
    margin-bottom: 8px;
    color: #35443a;
    font-size: 11px;
    font-weight: 900;
  }

  .worker-field textarea,
  .worker-field select {
    width: 100%;
    border: 1px solid #dce4dd;
    border-radius: 12px;
    background: #fbfcfa;
    color: #243229;
    outline: none;
    font: inherit;
    font-size: 13px;
  }

  .worker-field textarea {
    min-height: 120px;
    padding: 13px;
    resize: vertical;
    line-height: 1.6;
  }

  .worker-field select {
    height: 48px;
    padding: 0 12px;
    cursor: pointer;
  }

  .worker-field textarea:focus,
  .worker-field select:focus {
    border-color: #70907b;
    box-shadow:
      0 0 0 3px rgba(63,105,76,.08);
  }

  .worker-upload {
    min-height: 170px;
    border: 1px dashed #b9c9bd;
    border-radius: 15px;
    background: #f6f9f6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    padding: 25px;
    color: #4f7359;
  }

  .worker-upload strong {
    margin-top: 10px;
    color: #315b42;
    font-size: 13px;
  }

  .worker-upload small {
    max-width: 390px;
    margin-top: 6px;
    color: #7c877f;
    font-size: 11px;
    line-height: 1.5;
  }

  .worker-upload input {
    display: none;
  }

  .worker-photo-preview {
    position: relative;
    overflow: hidden;
    border-radius: 15px;
    background: #eef1ed;
  }

  .worker-photo-preview img {
    width: 100%;
    max-height: 480px;
    display: block;
    object-fit: contain;
  }

  .worker-photo-preview button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    border: 0;
    border-radius: 10px;
    background: rgba(20,30,24,.78);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .worker-submit {
    width: 100%;
    height: 54px;
    margin-top: 8px;
    border: 0;
    border-radius: 13px;
    background: #183b2a;
    color: white;
    font-size: 13px;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .worker-submit:hover {
    background: #28563c;
  }

  .worker-submit:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  @media (max-width: 800px) {

    .worker-header {
      padding: 0 16px;
    }

    .worker-user {
      display: none;
    }

    .worker-dashboard,
    .worker-detail-page {
      width: min(
        100% - 24px,
        1180px
      );
      padding-top: 24px;
    }

    .worker-hero {
      padding: 28px;
    }

    .worker-hero-mark {
      display: none;
    }

    .worker-stats {
      grid-template-columns: 1fr;
    }

    .worker-detail-grid {
      grid-template-columns: 1fr;
    }

  }

  @media (max-width: 520px) {

    .worker-brand span {
      display: none;
    }

    .worker-logout {
      padding: 0 10px;
    }

    .worker-logout svg {
      margin: 0;
    }

    .worker-logout {
      font-size: 0;
    }

    .worker-logout svg {
      width: 18px;
      height: 18px;
    }

    .worker-work-section,
    .worker-followup {
      padding: 18px;
    }

    .worker-issue-top,
    .worker-detail-heading {
      flex-direction: column;
    }

    .worker-issue-top > strong,
    .worker-status {
      align-self: flex-start;
    }

  }

`;

export default WorkerDashboard;
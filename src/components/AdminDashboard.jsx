import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  LogOut,
  RefreshCw,
  Trash2,
  AlertTriangle,
  MapPin,
  Save,
  X,
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
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  const [followUpDrafts, setFollowUpDrafts] = useState({});

  useEffect(() => {
    const issuesQuery = query(
      collection(db, "issues"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const firestoreIssues = snapshot.docs.map((issueDoc) => ({
          ...issueDoc.data(),
          firestoreId: issueDoc.id,
        }));

        setIssues(firestoreIssues);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("Admin dashboard error:", snapshotError);

        setError(
          `Firebase error: ${
            snapshotError?.code || "unknown"
          } — ${
            snapshotError?.message || "Unable to load reports."
          }`
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      total: issues.length,
      reported: issues.filter(
        (issue) => issue.status === "Reported"
      ).length,
      review: issues.filter(
        (issue) => issue.status === "Under Review"
      ).length,
      improved: issues.filter(
        (issue) => issue.status === "Improved"
      ).length,
    };
  }, [issues]);

  const getDraft = (issue) => {
    return (
      followUpDrafts[issue.firestoreId] || {
        afterPhoto: issue.afterPhoto || "",
        actionTaken: issue.actionTaken || "",
        outcome: issue.outcome || "Pending follow-up",
      }
    );
  };

  const updateDraft = (issueId, changes) => {
    setFollowUpDrafts((previous) => ({
      ...previous,
      [issueId]: {
        ...getDraft(
          issues.find((issue) => issue.firestoreId === issueId) || {}
        ),
        ...changes,
      },
    }));
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const image = new Image();

        image.onload = () => {
          const maxWidth = 900;
          const maxHeight = 900;

          let width = image.width;
          let height = image.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(
              maxWidth / width,
              maxHeight / height
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Unable to process image."));
            return;
          }

          context.drawImage(image, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL(
            "image/jpeg",
            0.68
          );

          resolve(compressedDataUrl);
        };

        image.onerror = () => {
          reject(new Error("Unable to read image."));
        };

        image.src = event.target.result;
      };

      reader.onerror = () => {
        reject(new Error("Unable to read selected file."));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleAfterPhotoChange = async (issue, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    try {
      setActionId(issue.firestoreId);
      setError("");

      const compressedImage = await compressImage(file);

      updateDraft(issue.firestoreId, {
        afterPhoto: compressedImage,
      });
    } catch (error) {
      console.error("After photo error:", error);

      setError(
        "Unable to process the after photo. Please try another image."
      );
    } finally {
      setActionId("");
    }

    event.target.value = "";
  };

  const removeAfterPhoto = (issueId) => {
    updateDraft(issueId, {
      afterPhoto: "",
    });
  };

  const handleSaveFollowUp = async (issue) => {
    const draft = getDraft(issue);

    if (
      !draft.afterPhoto &&
      !draft.actionTaken.trim() &&
      draft.outcome === "Pending follow-up"
    ) {
      setError(
        "Add an after photo, action taken, or outcome before saving."
      );
      return;
    }

    try {
      setActionId(issue.firestoreId);
      setError("");

      const updateData = {
        afterPhoto: draft.afterPhoto || "",
        actionTaken: draft.actionTaken.trim(),
        outcome: draft.outcome,
        updatedAt: new Date().toISOString(),
      };

      if (draft.outcome === "Improved") {
        updateData.status = "Improved";
      }

      await updateDoc(
        doc(db, "issues", issue.firestoreId),
        updateData
      );

      setFollowUpDrafts((previous) => ({
        ...previous,
        [issue.firestoreId]: draft,
      }));
    } catch (error) {
      console.error("Unable to save follow-up:", error);

      setError(
        `Follow-up error: ${
          error?.code || "unknown"
        } — ${
          error?.message || "Unable to save follow-up."
        }`
      );
    } finally {
      setActionId("");
    }
  };

  const handleStatusChange = async (firestoreId, status) => {
    try {
      setActionId(firestoreId);
      setError("");

      await updateDoc(doc(db, "issues", firestoreId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Unable to update issue:", error);

      setError(
        `Update error: ${error?.code || "unknown"} — ${
          error?.message || "Unknown Firebase error"
        }`
      );
    } finally {
      setActionId("");
    }
  };

  const handleDelete = async (firestoreId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this report?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(firestoreId);
      setError("");

      await deleteDoc(doc(db, "issues", firestoreId));
    } catch (error) {
      console.error("Unable to delete issue:", error);

      setError(
        `Delete error: ${error?.code || "unknown"} — ${
          error?.message || "Unable to delete this report."
        }`
      );
    } finally {
      setActionId("");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error("Logout error:", error);
      setError("Unable to sign out.");
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "No date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="admin-dashboard">
      <div className="admin-dashboard-shell">
        <div className="admin-dashboard-header">
          <div>
            <span className="admin-dashboard-kicker">
              CIVICCONNECT ADMIN
            </span>

            <h1>Report Management</h1>

            <p>
              Review community reports, update their progress and
              keep the civic record organised.
            </p>
          </div>

          <div className="admin-dashboard-actions">
            <button
              type="button"
              className="admin-refresh-button"
              onClick={() => window.location.reload()}
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

        {user?.email && (
          <div className="admin-user-bar">
            <span>Signed in as</span>
            <strong>{user.email}</strong>
          </div>
        )}

        {error && (
          <div className="admin-dashboard-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Total Reports</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <span>Reported</span>
              <strong>{stats.reported}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <RefreshCw size={20} />
            </div>

            <div>
              <span>Under Review</span>
              <strong>{stats.review}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Improved</span>
              <strong>{stats.improved}</strong>
            </div>
          </div>
        </div>

        <div className="admin-reports-panel">
          <div className="admin-reports-heading">
            <div>
              <span className="admin-dashboard-kicker">
                FIRESTORE REPORTS
              </span>

              <h2>Community Issues</h2>
            </div>

            <span className="admin-report-count">
              {issues.length} reports
            </span>
          </div>

          {loading ? (
            <div className="admin-empty-state">
              <RefreshCw
                size={24}
                className="admin-loading-icon"
              />
              <p>Loading reports...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="admin-empty-state">
              <FileText size={28} />
              <h3>No reports yet</h3>
              <p>
                Community reports will appear here once they are
                submitted.
              </p>
            </div>
          ) : (
            <div className="admin-report-list">
              {issues.map((issue) => {
                const draft = getDraft(issue);
                const busy = actionId === issue.firestoreId;

                return (
                  <article
                    className="admin-report-card"
                    key={issue.firestoreId}
                  >
                    <div className="admin-report-main">
                      <div className="admin-report-top">
                        <div>
                          <span className="admin-report-id">
                            {issue.id || issue.firestoreId}
                          </span>

                          <h3>
                            {issue.title ||
                              issue.category ||
                              "Civic Issue"}
                          </h3>
                        </div>

                        <span
                          className={`admin-status-badge ${String(
                            issue.status || "Reported"
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {issue.status || "Reported"}
                        </span>
                      </div>

                      <p className="admin-report-description">
                        {issue.description ||
                          "No description provided."}
                      </p>

                      <div className="admin-report-meta">
                        <span>
                          <MapPin size={15} />
                          {issue.location
                            ? `${issue.location[0]}, ${issue.location[1]}`
                            : "Location not provided"}
                        </span>

                        <span>
                          Date: {formatDate(issue.date)}
                        </span>

                        <span>
                          Reporter:{" "}
                          {issue.reporter ||
                            "Community Member"}
                        </span>

                        {issue.severity && (
                          <span>
                            Severity: {issue.severity}
                          </span>
                        )}
                      </div>

                      {/* AFTER EVIDENCE */}
                      <div className="admin-followup-box">
                        <div className="admin-followup-heading">
                          <div>
                            <span className="admin-followup-kicker">
                              FOLLOW-UP EVIDENCE
                            </span>

                            <h4>After Photo</h4>
                          </div>
                        </div>

                        {!draft.afterPhoto ? (
                          <label
                            className="admin-after-upload"
                            htmlFor={`after-photo-${issue.firestoreId}`}
                          >
                            <Camera size={24} />

                            <strong>
                              Upload After Photo
                            </strong>

                            <span>
                              Add the evidence after action or
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
                              src={draft.afterPhoto}
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
                              <X size={17} />
                            </button>
                          </div>
                        )}

                        <div className="admin-followup-fields">
                          <label>
                            <span>Action Taken</span>

                            <textarea
                              rows="3"
                              value={draft.actionTaken}
                              onChange={(event) =>
                                updateDraft(
                                  issue.firestoreId,
                                  {
                                    actionTaken:
                                      event.target.value,
                                  }
                                )
                              }
                              placeholder="Example: Area cleaned and waste removed."
                            />
                          </label>

                          <label>
                            <span>Outcome</span>

                            <select
                              value={draft.outcome}
                              onChange={(event) =>
                                updateDraft(
                                  issue.firestoreId,
                                  {
                                    outcome:
                                      event.target.value,
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
                        </div>

                        <button
                          type="button"
                          className="admin-save-followup"
                          onClick={() =>
                            handleSaveFollowUp(issue)
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

                    <div className="admin-report-actions">
                      <div className="admin-status-actions">
                        <button
                          type="button"
                          className={
                            issue.status === "Reported"
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
                            issue.status === "Under Review"
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
                            issue.status === "Improved"
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
                          handleDelete(issue.firestoreId)
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
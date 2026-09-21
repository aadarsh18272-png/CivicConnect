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
      <style>{`

        * {
          box-sizing: border-box;
        }

        .admin-dashboard {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top left,
              rgba(48, 91, 66, 0.10),
              transparent 30%
            ),
            #f4f6f2;
          color: #17221a;
          padding: 32px 20px 70px;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .admin-dashboard-shell {
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
        }

        .admin-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 18px;
        }

        .admin-dashboard-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #356247;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .admin-dashboard-header h1 {
          margin: 8px 0 7px;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1;
          letter-spacing: -.045em;
          color: #17221a;
        }

        .admin-dashboard-header p {
          max-width: 650px;
          margin: 0;
          color: #68736b;
          font-size: 14px;
          line-height: 1.7;
        }

        .admin-dashboard-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }

        .admin-refresh-button,
        .admin-logout-button {
          height: 44px;
          border-radius: 12px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
        }

        .admin-refresh-button {
          border: 1px solid #d9e1da;
          background: #ffffff;
          color: #294633;
        }

        .admin-refresh-button:hover {
          transform: translateY(-1px);
          border-color: #b7c8ba;
        }

        .admin-logout-button {
          border: 0;
          background: #183b2a;
          color: white;
        }

        .admin-logout-button:hover {
          transform: translateY(-1px);
          background: #24543a;
        }

        .admin-user-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 15px;
          margin-bottom: 22px;
          border: 1px solid #dce4dc;
          border-radius: 12px;
          background: rgba(255,255,255,.72);
          color: #748078;
          font-size: 12px;
        }

        .admin-user-bar strong {
          color: #26342b;
        }

        .admin-dashboard-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          border: 1px solid #f0c9c4;
          border-radius: 14px;
          background: #fff2f0;
          color: #a23e34;
          font-size: 13px;
          line-height: 1.5;
        }

        .admin-stats-grid {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 24px;
        }

        .admin-stat-card {
          min-height: 118px;
          padding: 20px;
          border: 1px solid #dfe6df;
          border-radius: 18px;
          background: rgba(255,255,255,.84);
          box-shadow:
            0 8px 25px rgba(28, 48, 35, .045);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .admin-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: #eaf2eb;
          color: #315b42;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-stat-card span {
          display: block;
          color: #78827b;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .admin-stat-card strong {
          display: block;
          color: #17221a;
          font-size: 27px;
          line-height: 1;
          letter-spacing: -.03em;
        }

        .admin-reports-panel {
          border: 1px solid #dce4dc;
          border-radius: 24px;
          background: rgba(255,255,255,.88);
          box-shadow:
            0 15px 45px rgba(27, 45, 34, .055);
          overflow: hidden;
        }

        .admin-reports-heading {
          padding: 24px 26px;
          border-bottom: 1px solid #e7ebe7;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
        }

        .admin-reports-heading h2 {
          margin: 5px 0 0;
          font-size: 24px;
          letter-spacing: -.03em;
        }

        .admin-report-count {
          padding: 7px 11px;
          border-radius: 999px;
          background: #edf3ee;
          color: #315b42;
          font-size: 11px;
          font-weight: 800;
        }

        .admin-toolbar {
          padding: 16px 26px;
          display: flex;
          gap: 10px;
          border-bottom: 1px solid #e7ebe7;
          background: #fbfcfa;
        }

        .admin-search-wrap {
          position: relative;
          flex: 1;
        }

        .admin-search-wrap svg {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #89948c;
        }

        .admin-search-input,
        .admin-filter-select {
          width: 100%;
          height: 44px;
          border: 1px solid #dbe3dc;
          border-radius: 12px;
          background: white;
          color: #1c281f;
          outline: none;
          font-size: 13px;
        }

        .admin-search-input {
          padding: 0 14px 0 40px;
        }

        .admin-filter-select {
          width: 190px;
          padding: 0 12px;
        }

        .admin-search-input:focus,
        .admin-filter-select:focus,
        .admin-followup-fields textarea:focus,
        .admin-followup-fields select:focus,
        .admin-assignment-select:focus {
          border-color: #71917c;
          box-shadow: 0 0 0 3px rgba(63, 105, 76, .09);
        }

        .admin-empty-state {
          padding: 80px 20px;
          text-align: center;
          color: #78837b;
        }

        .admin-empty-state svg {
          color: #789181;
          margin-bottom: 10px;
        }

        .admin-empty-state h3 {
          color: #27352b;
          margin: 8px 0 4px;
        }

        .admin-empty-state p {
          margin: 0;
          font-size: 13px;
        }

        .admin-loading-icon {
          animation: admin-spin 1s linear infinite;
        }

        @keyframes admin-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .admin-report-list {
          padding: 20px;
          display: grid;
          gap: 18px;
        }

        .admin-report-card {
          border: 1px solid #dfe6df;
          border-radius: 20px;
          background: white;
          overflow: hidden;
          box-shadow:
            0 7px 25px rgba(27, 45, 34, .035);
        }

        .admin-report-main {
          padding: 23px;
        }

        .admin-report-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .admin-report-id {
          display: inline-block;
          margin-bottom: 6px;
          color: #829087;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .admin-report-top h3 {
          margin: 0;
          font-size: 21px;
          line-height: 1.25;
          letter-spacing: -.025em;
          color: #1b271f;
        }

        .admin-status-badge {
          flex-shrink: 0;
          padding: 7px 11px;
          border-radius: 999px;
          background: #edf1ee;
          color: #536159;
          font-size: 10px;
          font-weight: 900;
        }

        .admin-status-badge.reported {
          background: #fff3dd;
          color: #9a641e;
        }

        .admin-status-badge.under-review {
          background: #eaf1f8;
          color: #42657f;
        }

        .admin-status-badge.improved {
          background: #e6f4e9;
          color: #337047;
        }

        .admin-report-description {
          margin: 13px 0 15px;
          color: #5e6962;
          font-size: 13px;
          line-height: 1.7;
          max-width: 950px;
        }

        .admin-report-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .admin-report-meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid #e3e9e4;
          border-radius: 9px;
          background: #fafcf9;
          color: #6c776f;
          font-size: 10px;
          font-weight: 700;
        }

        .admin-report-meta svg {
          color: #51745d;
        }

        .admin-assignment-box {
          padding: 17px;
          margin-bottom: 17px;
          border: 1px solid #dce6de;
          border-radius: 16px;
          background:
            linear-gradient(
              135deg,
              #f6faf6,
              #fbfcfa
            );
        }

        .admin-assignment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 11px;
        }

        .admin-assignment-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #315b42;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .09em;
        }

        .admin-assignment-title svg {
          width: 17px;
        }

        .admin-assignment-status {
          font-size: 10px;
          color: #718078;
          font-weight: 700;
        }

        .admin-assignment-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .admin-assignment-select-wrap {
          position: relative;
          flex: 1;
        }

        .admin-assignment-select {
          appearance: none;
          width: 100%;
          height: 46px;
          padding: 0 40px 0 13px;
          border: 1px solid #d5e0d7;
          border-radius: 11px;
          background: white;
          color: #243229;
          font-size: 13px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        .admin-assignment-select-wrap > svg {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #758179;
        }

        .admin-assigned-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 11px;
          border-radius: 10px;
          background: #eaf3ec;
          color: #315b42;
          font-size: 11px;
          font-weight: 800;
          margin-top: 10px;
        }

        .admin-followup-box {
          padding: 19px;
          border: 1px solid #e2e7e3;
          border-radius: 17px;
          background: #fafbf9;
        }

        .admin-followup-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .admin-followup-kicker {
          display: block;
          color: #6c7d72;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .13em;
          margin-bottom: 4px;
        }

        .admin-followup-heading h4 {
          margin: 0;
          color: #27352b;
          font-size: 16px;
        }

        .admin-after-upload {
          min-height: 130px;
          border: 1px dashed #b9c9bd;
          border-radius: 14px;
          background: #f5f8f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          padding: 20px;
          transition: .2s ease;
        }

        .admin-after-upload:hover {
          background: #edf4ee;
          border-color: #789581;
        }

        .admin-after-upload svg {
          color: #4d7659;
          margin-bottom: 8px;
        }

        .admin-after-upload strong {
          color: #31523c;
          font-size: 13px;
        }

        .admin-after-upload span {
          margin-top: 5px;
          max-width: 360px;
          color: #7b867e;
          font-size: 11px;
          line-height: 1.5;
        }

        .admin-after-upload input {
          display: none;
        }

        .admin-after-preview {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #eef1ed;
          border: 1px solid #dfe6df;
        }

        .admin-after-preview img {
          display: block;
          width: 100%;
          height: 270px;
          object-fit: contain;
          background: #eef1ed;
        }

        .admin-remove-after {
          position: absolute;
          right: 10px;
          top: 10px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 10px;
          background: rgba(20, 30, 24, .78);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .admin-followup-fields {
          display: grid;
          grid-template-columns: 1fr 250px;
          gap: 13px;
          margin-top: 14px;
        }

        .admin-followup-fields label {
          display: block;
        }

        .admin-followup-fields label > span {
          display: block;
          margin-bottom: 7px;
          color: #405047;
          font-size: 11px;
          font-weight: 800;
        }

        .admin-followup-fields textarea,
        .admin-followup-fields select {
          width: 100%;
          border: 1px solid #dce3dd;
          border-radius: 11px;
          background: white;
          color: #26342b;
          outline: none;
          font: inherit;
          font-size: 12px;
        }

        .admin-followup-fields textarea {
          min-height: 88px;
          resize: vertical;
          padding: 11px 12px;
          line-height: 1.55;
        }

        .admin-followup-fields select {
          height: 46px;
          padding: 0 11px;
          cursor: pointer;
        }

        .admin-save-followup {
          margin-top: 13px;
          width: 100%;
          min-height: 45px;
          border: 0;
          border-radius: 11px;
          background: #183b2a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .admin-save-followup:hover {
          background: #24543a;
        }

        .admin-save-followup:disabled,
        .admin-status-actions button:disabled,
        .admin-delete-button:disabled,
        .admin-after-upload:has(input:disabled) {
          opacity: .55;
          cursor: not-allowed;
        }

        .admin-report-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px 20px;
          border-top: 1px solid #e7ebe7;
          background: #fcfdfb;
        }

        .admin-status-actions {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .admin-status-actions button {
          height: 34px;
          padding: 0 11px;
          border: 1px solid #d9e1da;
          border-radius: 9px;
          background: white;
          color: #647169;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-status-actions button:hover {
          border-color: #9bb1a1;
          color: #315b42;
        }

        .admin-status-actions button.active {
          border-color: #315b42;
          background: #eaf3ec;
          color: #315b42;
        }

        .admin-delete-button {
          height: 34px;
          padding: 0 12px;
          border: 1px solid #f0d3cf;
          border-radius: 9px;
          background: #fff8f7;
          color: #a34b41;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-delete-button:hover {
          background: #fff0ee;
        }

        @media (max-width: 1100px) {
          .admin-stats-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .admin-dashboard {
            padding: 20px 12px 50px;
          }

          .admin-dashboard-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-dashboard-actions {
            width: 100%;
          }

          .admin-refresh-button,
          .admin-logout-button {
            flex: 1;
          }

          .admin-stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .admin-toolbar {
            flex-direction: column;
          }

          .admin-filter-select {
            width: 100%;
          }

          .admin-reports-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-report-top {
            flex-direction: column;
          }

          .admin-followup-fields {
            grid-template-columns: 1fr;
          }

          .admin-report-actions {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-delete-button {
            width: 100%;
            justify-content: center;
          }

          .admin-assignment-row {
            flex-direction: column;
            align-items: stretch;
          }
        }

        @media (max-width: 480px) {
          .admin-stats-grid {
            grid-template-columns: 1fr;
          }

          .admin-stat-card {
            min-height: 90px;
          }

          .admin-report-main {
            padding: 16px;
          }

          .admin-report-list {
            padding: 12px;
          }

          .admin-reports-heading,
          .admin-toolbar {
            padding-left: 16px;
            padding-right: 16px;
          }
        }

      `}</style>


      <section className="admin-dashboard">

        <div className="admin-dashboard-shell">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="admin-dashboard-header">

            <div>

              <span className="admin-dashboard-kicker">
                <ShieldCheck size={14} />
                CIVICCONNECT ADMIN
              </span>

              <h1>
                Report Management
              </h1>

              <p>
                Review community reports,
                coordinate field workers,
                manage civic progress and
                maintain the evidence record.
              </p>

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

          </header>


          {/* =================================================
              USER BAR
          ================================================= */}

          {user?.email && (
            <div className="admin-user-bar">

              <span>
                Signed in as
              </span>

              <strong>
                {user.email}
              </strong>

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
                style={{
                  marginLeft: "auto",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <X size={17} />
              </button>

            </div>
          )}


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="admin-stats-grid">

            <div className="admin-stat-card">

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
              </div>

            </div>


            <div className="admin-stat-card">

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
              </div>

            </div>


            <div className="admin-stat-card">

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
              </div>

            </div>


            <div className="admin-stat-card">

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
              </div>

            </div>


            <div className="admin-stat-card">

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

              <span className="admin-report-count">
                {filteredIssues.length}
                {" "}
                visible
              </span>

            </div>


            {/* SEARCH + FILTER */}

            <div className="admin-toolbar">

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
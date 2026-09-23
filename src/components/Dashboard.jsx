import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Image as ImageIcon,
  MapPin,
  Search,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";

export default function Dashboard({ issues = [] }) {
  const [communityData, setCommunityData] = useState({
  poll: null,
  suggestions: [],
});
useEffect(() => {
  const loadCommunityData = () => {
    const savedPoll = localStorage.getItem("civicconnect_community_poll");
    const savedSuggestions = localStorage.getItem(
      "civicconnect_community_suggestions"
    );

    setCommunityData({
      poll: savedPoll ? JSON.parse(savedPoll) : null,
      suggestions: savedSuggestions ? JSON.parse(savedSuggestions) : [],
    });
  };

  loadCommunityData();

  window.addEventListener(
    "civicconnect-community-updated",
    loadCommunityData
  );

  return () => {
    window.removeEventListener(
      "civicconnect-community-updated",
      loadCommunityData
    );
  };
}, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    if (!selectedIssue) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedIssue(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIssue]);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        issues
          .map((issue) => issue.category)
          .filter(Boolean)
      ),
    ];
  }, [issues]);

  const severities = ["All", "High", "Medium", "Low"];

  const statuses = useMemo(() => {
    return [
      "All",
      ...new Set(
        issues
          .map((issue) => issue.status)
          .filter(Boolean)
      ),
    ];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const search = searchTerm
        .toLowerCase()
        .trim();

      const matchesSearch =
        !search ||
        issue.id?.toLowerCase().includes(search) ||
        issue.title?.toLowerCase().includes(search) ||
        issue.category
          ?.toLowerCase()
          .includes(search) ||
        issue.description
          ?.toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        issue.category === categoryFilter;

      const matchesSeverity =
        severityFilter === "All" ||
        issue.severity === severityFilter;

      const matchesStatus =
        statusFilter === "All" ||
        issue.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSeverity &&
        matchesStatus
      );
    });
  }, [
    issues,
    searchTerm,
    categoryFilter,
    severityFilter,
    statusFilter,
  ]);

  const totalIssues = issues.length;
  const totalVotes =
  communityData.poll?.options?.reduce(
    (sum, option) => sum + option.votes,
    0
  ) || 0;

  const highPriority = issues.filter(
    (issue) => issue.severity === "High"
  ).length;

  const improvedIssues = issues.filter(
    (issue) =>
      issue.status === "Improved" ||
      issue.outcome === "Improved"
  ).length;

  const followUps = issues.filter(
    (issue) =>
      issue.afterPhoto ||
      issue.actionTaken ||
      issue.outcome !== "Pending follow-up"
  ).length;

  const wasteIssues = issues.filter(
    (issue) =>
      issue.category === "Waste & Garbage"
  ).length;

  const infrastructureIssues = issues.filter(
    (issue) =>
      [
        "Road & Footpath",
        "Drainage",
        "Streetlight",
        "Water",
        "Public Space",
      ].includes(issue.category)
  ).length;

  const categoryStats = categories
    .filter((category) => category !== "All")
    .map((category) => ({
      name: category,
      count: issues.filter(
        (issue) => issue.category === category
      ).length,
    }))
    .sort((a, b) => b.count - a.count);

  const statusStats = statuses
    .filter((status) => status !== "All")
    .map((status) => ({
      name: status,
      count: issues.filter(
        (issue) => issue.status === status
      ).length,
    }))
    .sort((a, b) => b.count - a.count);

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setSeverityFilter("All");
    setStatusFilter("All");
  };

  const hasFilters =
    searchTerm ||
    categoryFilter !== "All" ||
    severityFilter !== "All" ||
    statusFilter !== "All";

  return (
    <section
      className="dashboard-section"
      id="dashboard"
    >
      <div className="dashboard-container">

        {/* HEADER */}

        <div className="dashboard-header">

          <div>
            <span className="section-eyebrow">
              PROJECT DASHBOARD
            </span>

            <h2>
              Civic Evidence.
              <br />
              <span>Clearly Documented.</span>
            </h2>

            <p>
              Explore the civic issues documented
              through CivicConnect, track follow-up
              action and understand neighbourhood
              improvement.
            </p>
          </div>

          <div className="dashboard-live-badge">
            <span></span>
            Live Project Data
          </div>

        </div>


        {/* STAT CARDS */}

        <div className="dashboard-stats">

          <StatCard
            icon={<FileText size={21} />}
            value={totalIssues}
            label="Total Issues"
          />

          <StatCard
            icon={<ShieldAlert size={21} />}
            value={highPriority}
            label="High Priority"
          />

          <StatCard
            icon={<TrendingUp size={21} />}
            value={improvedIssues}
            label="Areas Improved"
          />

          <StatCard
            icon={<Clock3 size={21} />}
            value={followUps}
            label="Follow-ups"
          />

          <StatCard
            icon={<BarChart3 size={21} />}
            value={wasteIssues}
            label="Waste Issues"
          />

          <StatCard
            icon={<CheckCircle2 size={21} />}
            value={infrastructureIssues}
            label="Infrastructure"
          />

        </div>


        {/* ANALYTICS */}

        <div className="dashboard-analytics">

          {/* CATEGORY */}

          <div className="dashboard-panel">

            <div className="dashboard-panel-heading">

              <div>
                <span>
                  ISSUE DISTRIBUTION
                </span>

                <h3>
                  Issues by Category
                </h3>
              </div>

              <BarChart3 size={20} />

            </div>

            {categoryStats.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="dashboard-bars">

                {categoryStats.map(
                  (item) => {
                    const percentage =
                      totalIssues
                        ? (item.count /
                            totalIssues) *
                          100
                        : 0;

                    return (
                      <div
                        className="dashboard-bar-row"
                        key={item.name}
                      >

                        <div className="dashboard-bar-label">
                          <span>
                            {item.name}
                          </span>

                          <strong>
                            {item.count}
                          </strong>
                        </div>

                        <div className="dashboard-bar-track">
                          <div
                            className="dashboard-bar-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* COMMUNITY ENGAGEMENT */}

<div className="dashboard-panel dashboard-community-panel">
  <div className="dashboard-panel-heading">
    <div>
      <span>COMMUNITY</span>
      <h3>Community Engagement</h3>
    </div>

    <BarChart3 size={20} />
  </div>

  <div className="community-dashboard-stats">
    <div className="community-dashboard-stat">
  <strong>
    {totalVotes + communityData.suggestions.length}
  </strong>
  <span>Total Engagements</span>
</div>
    <div className="community-dashboard-stat">
      <strong>{totalVotes}</strong>
      <span>Poll Votes</span>
    </div>

    <div className="community-dashboard-stat">
      <strong>{communityData.suggestions.length}</strong>
      <span>Suggestions</span>
    </div>
  </div>

  {communityData.poll && (
  <div className="community-dashboard-poll">
    <p>{communityData.poll.question}</p>

    {communityData.poll.options.map((option) => (
      <div
        className="community-dashboard-option"
        key={option.label}
      >
        <div className="community-dashboard-option-top">
          <span>{option.label}</span>
          <strong>{option.votes}</strong>
        </div>

        <div className="community-dashboard-option-track">
          <div
            className="community-dashboard-option-fill"
            style={{
              width: `${
                totalVotes
                  ? (option.votes / totalVotes) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    ))}
  </div>
)}

{communityData.suggestions.length > 0 && (
  <div className="community-dashboard-suggestions">
    <p className="community-dashboard-suggestions-title">
      Recent Community Suggestions
    </p>

    {communityData.suggestions
      .slice(-3)
      .reverse()
      .map((suggestion) => (
        <div
          className="community-dashboard-suggestion"
          key={suggestion.id}
        >
          <span>
            {suggestion.text || suggestion.suggestion}
          </span>
        </div>
      ))}
  </div>
)}
</div>

          {/* STATUS */}

          <div className="dashboard-panel">

            <div className="dashboard-panel-heading">

              <div>
                <span>
                  PROGRESS
                </span>

                <h3>
                  Issue Status
                </h3>
              </div>

              <CheckCircle2 size={20} />

            </div>

            {statusStats.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="status-list">

                {statusStats.map(
                  (item) => (
                    <div
                      className="status-row"
                      key={item.name}
                    >

                      <div className="status-row-left">

                        <span className="status-dot"></span>

                        <span>
                          {item.name}
                        </span>

                      </div>

                      <strong>
                        {item.count}
                      </strong>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>


        {/* REPORT EXPLORER */}

        <div className="dashboard-reports">

          <div className="dashboard-reports-heading">

            <div>
              <span className="section-eyebrow">
                REPORT EXPLORER
              </span>

              <h3>
                All Documented Issues
              </h3>

              <p>
                Search and filter the complete
                collection of civic reports.
              </p>
            </div>

            <div className="dashboard-result-count">
              {filteredIssues.length}
              <span>
                visible reports
              </span>
            </div>

          </div>


          {/* FILTERS */}

          <div className="dashboard-filters">

            <div className="dashboard-search">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search issue ID, category or description..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="dashboard-filter">

              <Filter size={15} />

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category === "All"
                        ? "All Categories"
                        : category}
                    </option>
                  )
                )}
              </select>

            </div>


            <div className="dashboard-filter">

              <ShieldAlert size={15} />

              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(
                    event.target.value
                  )
                }
              >
                {severities.map(
                  (severity) => (
                    <option
                      key={severity}
                      value={severity}
                    >
                      {severity === "All"
                        ? "All Severity"
                        : severity}
                    </option>
                  )
                )}
              </select>

            </div>


            <div className="dashboard-filter">

              <CheckCircle2 size={15} />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status === "All"
                        ? "All Status"
                        : status}
                    </option>
                  )
                )}
              </select>

            </div>


            {hasFilters && (
              <button
                type="button"
                className="dashboard-clear"
                onClick={clearFilters}
              >
                <X size={15} />
                Clear
              </button>
            )}

          </div>


          {/* REPORTS */}

          {filteredIssues.length === 0 ? (
            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                <FileText size={28} />
              </div>

              <h3>
                No civic issues found.
              </h3>

              <p>
                Try changing the filters or
                document your first field
                observation.
              </p>

            </div>
          ) : (
            <div className="issue-report-grid">

              {filteredIssues.map(
                (issue) => (
                  <IssueReportCard
                    key={issue.id}
                    issue={issue}
                    onOpen={() =>
                      setSelectedIssue(issue)
                    }
                  />
                )
              )}

            </div>
          )}

        </div>

      </div>


      {/* ISSUE DETAIL MODAL */}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() =>
            setSelectedIssue(null)
          }
        />
      )}

    </section>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  value,
  label,
}) {
  return (
    <div className="dashboard-stat-card">

      <div className="dashboard-stat-icon">
        {icon}
      </div>

      <div>
        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>
      </div>

    </div>
  );
}


/* =========================================================
   ISSUE CARD
========================================================= */

function IssueReportCard({
  issue,
  onOpen,
}) {
  const beforePhoto = issue.beforePhoto || issue.photo;

  const status = issue.status || "Reported";
  const severity = issue.severity || "Medium";
  const category = issue.category || "Civic Issue";
  const title = issue.title || "Untitled Civic Issue";
  const description =
    issue.description ||
    "No description has been provided for this complaint.";

  const locationText = Array.isArray(issue.location)
    ? `${Number(issue.location[0]).toFixed(5)}, ${Number(
        issue.location[1]
      ).toFixed(5)}`
    : "Location recorded";

  const statusClass = status
    .toLowerCase()
    .replace(/\s+/g, "-");

  const severityClass = getSeverityClass(severity);

  return (
    <article
      className="issue-report-card"
      style={{
        background: "#ffffff",
        border: "1px solid #e5e9e6",
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(20, 35, 25, 0.07)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {beforePhoto ? (
        <div
          style={{
            height: "190px",
            background: "#edf1ed",
            overflow: "hidden",
          }}
        >
          <img
            src={beforePhoto}
            alt={title}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: "92px",
            background:
              "linear-gradient(135deg, #eef5ef 0%, #f8faf8 100%)",
            borderBottom: "1px solid #e5e9e6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
          }}
        >
          <div>
            <span
              style={{
                display: "block",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "#688070",
                marginBottom: "5px",
              }}
            >
              CIVIC REPORT
            </span>

            <strong
              style={{
                fontSize: "13px",
                color: "#253229",
              }}
            >
              {issue.id}
            </strong>
          </div>

          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "13px",
              background: "#ffffff",
              border: "1px solid #dce6de",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4b765a",
            }}
          >
            <FileText size={19} />
          </div>
        </div>
      )}

      <div
        style={{
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#f0f5f1",
              color: "#477055",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {category}
          </span>

          <span
            className={`issue-card-status ${statusClass}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              borderRadius: "999px",
              background:
                status === "Improved"
                  ? "#eaf6ed"
                  : status === "Under Review"
                  ? "#fff5df"
                  : "#f1f3f2",
              color:
                status === "Improved"
                  ? "#2d7042"
                  : status === "Under Review"
                  ? "#9a691e"
                  : "#59645d",
              fontSize: "10px",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "currentColor",
              }}
            />
            {status}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 700,
                color: "#87928a",
                marginBottom: "6px",
              }}
            >
              {issue.id}
            </span>

            <h4
              style={{
                margin: 0,
                color: "#172019",
                fontSize: "21px",
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h4>
          </div>

          <span
            className={`issue-card-severity ${severityClass}`}
            style={{
              flexShrink: 0,
              padding: "6px 9px",
              borderRadius: "8px",
              background:
                severity === "High"
                  ? "#fff0ee"
                  : severity === "Medium"
                  ? "#fff7e8"
                  : "#edf7ef",
              color:
                severity === "High"
                  ? "#a64035"
                  : severity === "Medium"
                  ? "#9b6b22"
                  : "#477456",
              fontSize: "10px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {severity}
          </span>
        </div>

        <p
          style={{
            margin: "14px 0 18px",
            color: "#66716a",
            fontSize: "13px",
            lineHeight: 1.65,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "15px",
            borderTop: "1px solid #edf0ed",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              color: "#5d6a62",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <MapPin size={16} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {locationText}
            </span>
          </div>

          {issue.date && (
            <div
              style={{
                marginTop: "8px",
                color: "#89938c",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Reported on {issue.date}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpen}
          style={{
            marginTop: "18px",
            width: "100%",
            border: "none",
            borderRadius: "12px",
            padding: "12px 14px",
            background: "#183c28",
            color: "#ffffff",
            fontFamily: "inherit",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <span>View Complaint</span>
          <span style={{ fontSize: "18px", lineHeight: 1 }}>
            →
          </span>
        </button>
      </div>
    </article>
  );
}


/* =========================================================
   DETAIL MODAL
========================================================= */

function IssueDetailModal({
  issue,
  onClose,
}) {
  const beforePhoto =
    issue.beforePhoto ||
    issue.photo;

  const afterPhoto =
    issue.afterPhoto;

  return (
    <div
      className="issue-detail-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="issue-detail-modal">

        <button
          type="button"
          className="issue-detail-close"
          onClick={onClose}
          aria-label="Close report"
        >
          <X size={20} />
        </button>


        <div className="issue-detail-header">

          <div>

            <span className="issue-detail-id">
              {issue.id}
            </span>

            <h2>
              {issue.title}
            </h2>

            <p>
              {issue.category}
            </p>

          </div>

          <div className="issue-detail-status">
            {issue.status}
          </div>

        </div>


        {/* BASIC INFORMATION */}

        <div className="issue-detail-info">

          <InfoItem
            label="Severity"
            value={issue.severity}
          />

          <InfoItem
            label="Reported By"
            value={
              issue.reporter ||
              "Community Member"
            }
          />

          <InfoItem
            label="Date"
            value={issue.date || "—"}
          />

          <InfoItem
            label="Location"
            value={
              Array.isArray(issue.location)
                ? `${issue.location[0].toFixed(
                    6
                  )}, ${issue.location[1].toFixed(
                    6
                  )}`
                : "—"
            }
          />

        </div>
        {/* ISSUE STATUS JOURNEY */}

<div className="issue-status-journey">

  <div className="issue-status-journey-heading">
    <span>PROGRESS</span>
    <strong>Issue Journey</strong>
  </div>

  <div className="issue-status-steps">

    <div
      className={`issue-status-step ${
        issue.status === "Reported" ||
        issue.status === "Action Taken" ||
        issue.status === "Improved"
          ? "active"
          : ""
      }`}
    >
      <div className="issue-status-step-icon">
        <CheckCircle2 size={17} />
      </div>

      <span>Reported</span>
    </div>

    <div
      className={`issue-status-line ${
        issue.status === "Action Taken" ||
        issue.status === "Improved"
          ? "active"
          : ""
      }`}
    />

    <div
      className={`issue-status-step ${
        issue.status === "Action Taken" ||
        issue.status === "Improved"
          ? "active"
          : ""
      }`}
    >
      <div className="issue-status-step-icon">
        <Clock3 size={17} />
      </div>

      <span>Action Taken</span>
    </div>

    <div
      className={`issue-status-line ${
        issue.status === "Improved"
          ? "active"
          : ""
      }`}
    />

    <div
      className={`issue-status-step ${
        issue.status === "Improved"
          ? "active"
          : ""
      }`}
    >
      <div className="issue-status-step-icon">
        <CheckCircle2 size={17} />
      </div>

      <span>Improved</span>
    </div>

  </div>

</div>


        {/* DESCRIPTION */}

        <div className="issue-detail-section">

          <span>
            DESCRIPTION
          </span>

          <p>
            {issue.description ||
              "No description provided."}
          </p>

        </div>


        {/* BEFORE / AFTER */}

        <div className="issue-detail-section">

          <span>
            VISUAL EVIDENCE
          </span>

          <div className="before-after-grid">

            <EvidenceImage
              title="Before"
              image={beforePhoto}
            />

            <EvidenceImage
              title="After"
              image={afterPhoto}
            />

          </div>

        </div>


        {/* ACTION */}

        <div className="issue-detail-section">

          <span>
            ACTION & OUTCOME
          </span>

          <div className="action-detail-card">

            <div>
              <small>
                ACTION TAKEN
              </small>

              <p>
                {issue.actionTaken ||
                  "No follow-up action has been recorded yet."}
              </p>
            </div>

            <div>
              <small>
                OUTCOME
              </small>

              <strong>
                {issue.outcome ||
                  "Pending follow-up"}
              </strong>
            </div>

          </div>

        </div>


        <div className="issue-detail-footer">

          <MapPin size={16} />

          <span>
            Civic issue documented through
            CivicConnect community fieldwork.
          </span>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
}) {
  return (
    <div className="issue-info-item">

      <small>
        {label}
      </small>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   EVIDENCE IMAGE
========================================================= */

function EvidenceImage({
  title,
  image,
}) {
  return (
    <div className="evidence-image">

      <div className="evidence-image-heading">
        {title}
      </div>

      {image ? (
        <img
          src={image}
          alt={`${title} evidence`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="evidence-empty">
          <ImageIcon size={24} />

          <span>
            No {title.toLowerCase()} photo
          </span>
        </div>
      )}

    </div>
  );
}


/* =========================================================
   EMPTY CHART
========================================================= */

function EmptyChart() {
  return (
    <div className="dashboard-chart-empty">

      <BarChart3 size={28} />

      <span>
        No issue data available yet.
      </span>

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getSeverityClass(severity) {
  if (severity === "High") {
    return "high";
  }

  if (severity === "Medium") {
    return "medium";
  }

  return "low";
}
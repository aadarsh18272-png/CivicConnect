import garbageIllustration from "../assets/image.png";
import potholeIllustration from "../assets/Pothole_-_The_Noun_Project.svg.webp";
import streetlightIllustration from "../assets/Illustration_-_Street_Light_(Single).svg.webp";
import drainageIllustration from "../assets/Sewer_system_leak.svg.webp";
import waterIllustration from "../assets/Water_tap_with_handle_Pinhead_icon.svg.webp";
import damagedFootpathImage from "../assets/damaged-footpath.jpg";
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
const [feedbackData, setFeedbackData] = useState({
  websiteRating: 0,
  serviceRating: 0,
  feedback: "",
});
useEffect(() => {
  const loadCommunityData = () => {
    const savedPoll = localStorage.getItem(
      "civicconnect_community_poll"
    );

    const savedSuggestions = localStorage.getItem(
      "civicconnect_community_suggestions"
    );

    const savedWebsiteRating = localStorage.getItem(
      "civicconnect_website_rating"
    );

    const savedServiceRating = localStorage.getItem(
      "civicconnect_service_rating"
    );

    const savedFeedback = localStorage.getItem(
      "civicconnect_feedback"
    );

    setCommunityData({
      poll: savedPoll ? JSON.parse(savedPoll) : null,
      suggestions: savedSuggestions
        ? JSON.parse(savedSuggestions)
        : [],
    });

    setFeedbackData({
      websiteRating: Number(savedWebsiteRating) || 0,
      serviceRating: Number(savedServiceRating) || 0,
      feedback: savedFeedback || "",
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

  const websiteRating = feedbackData.websiteRating;
const serviceRating = feedbackData.serviceRating;

const averageRating =
  websiteRating && serviceRating
    ? ((websiteRating + serviceRating) / 2).toFixed(1)
    : websiteRating || serviceRating || 0;

const hasFeedback =
  websiteRating > 0 ||
  serviceRating > 0 ||
  feedbackData.feedback.trim();

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

{/* FEEDBACK & RATINGS */}

<div className="dashboard-panel dashboard-feedback-panel">

  <div className="dashboard-panel-heading">
    <div>
      <span>FEEDBACK</span>
      <h3>Community Experience</h3>
    </div>

    <span className="dashboard-feedback-score">
      ★ {averageRating || "—"}
    </span>
  </div>

  {hasFeedback ? (
    <>
      <div className="dashboard-feedback-stats">

        <div className="dashboard-feedback-stat">
          <strong>
            {websiteRating || "—"}
          </strong>
          <span>Website Rating</span>
        </div>

        <div className="dashboard-feedback-stat">
          <strong>
            {serviceRating || "—"}
          </strong>
          <span>Reporting Rating</span>
        </div>

      </div>

      {feedbackData.feedback && (
        <div className="dashboard-feedback-comment">

          <span>RECENT FEEDBACK</span>

          <p>
            “{feedbackData.feedback}”
          </p>

        </div>
      )}
    </>
  ) : (
    <div className="dashboard-feedback-empty">
      <span>No feedback submitted yet.</span>
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
  const beforePhoto =
    issue.beforePhoto ||
    issue.photo;

  const afterPhoto =
    issue.afterPhoto;

  return (
    <article className="issue-report-card">

      <div className="issue-report-image-area">

        {beforePhoto ? (
  <img
    src={beforePhoto}
    alt={`Before evidence for ${issue.title}`}
  />
) : issue.id === "CC-001" ? (
  <div className="issue-demo-image">
    <img
      src={garbageIllustration}
      alt="Illustration of a garbage dumping issue"
    />
    <span>DEMO ILLUSTRATION</span>
  </div>
) : issue.id === "CC-002" ? (
  <div className="issue-demo-image">
    <img
      src={potholeIllustration}
      alt="Illustration of potholes"
    />
    <span>DEMO ILLUSTRATION</span>
  </div>
) : issue.id === "CC-003" ? (
  <div className="issue-demo-image">
    <img
      src={streetlightIllustration}
      alt="Illustration of a streetlight issue"
    />
    <span>DEMO ILLUSTRATION</span>
  </div>
) : issue.id === "CC-004" ? (
  <div className="issue-demo-image">
    <img
      src={drainageIllustration}
      alt="Illustration of a drainage issue"
    />
    <span>DEMO ILLUSTRATION</span>
  </div>
) : issue.id === "CC-005" ? (
  <div className="issue-demo-image">
    <img
      src={waterIllustration}
      alt="Illustration of a water supply issue"
    />
    <span>DEMO ILLUSTRATION</span>
  </div>
  ) : issue.id === "CC-006" ? (
  <div className="issue-demo-image">
    <img
      src={damagedFootpathImage}
      alt="Damaged and cracked footpath"
    />
    <span>DEMO ILLUSTRATION</span>
  </div>
) : (
  <div className="issue-no-image">
    <ImageIcon size={25} />
    <span>No photo</span>
  </div>
)}
        <div className="issue-card-badges">

          <span
            className={`issue-card-severity ${getSeverityClass(
              issue.severity
            )}`}
          >
            {issue.severity}
          </span>

          <span className="issue-card-status">
            {issue.status}
          </span>

        </div>

      </div>


      <div className="issue-report-content">

        <div className="issue-report-id">
          {issue.id}
        </div>

        <h4>
          {issue.title}
        </h4>

        <p>
          {issue.description}
        </p>


        <div className="issue-report-meta">

          <span>
            <MapPin size={14} />
            {Array.isArray(issue.location)
              ? `${issue.location[0].toFixed(
                  4
                )}, ${issue.location[1].toFixed(
                  4
                )}`
              : "Location recorded"}
          </span>

          <span>
            {issue.category}
          </span>

        </div>


        <div className="issue-report-divider"></div>


        <div className="issue-report-progress">

  <div
    className={
      beforePhoto
        ? "evidence-done"
        : ""
    }
  >
    <span>
      {beforePhoto ? "✓" : "○"}
    </span>

    Before Evidence
  </div>

  <div
    className={
      afterPhoto
        ? "evidence-done"
        : ""
    }
  >
    <span>
      {afterPhoto ? "✓" : "○"}
    </span>

    After Evidence
  </div>

  <div
    className={
      issue.actionTaken
        ? "evidence-done"
        : ""
    }
  >
    <span>
      {issue.actionTaken ? "✓" : "○"}
    </span>

    Action
  </div>

</div>


        <button
          type="button"
          className="issue-view-button"
          onClick={onOpen}
        >
          View Full Report
          <span>→</span>
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
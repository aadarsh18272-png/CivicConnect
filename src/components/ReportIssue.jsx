import React, { useState } from "react";
import {
  Camera,
  MapPin,
  Send,
  CheckCircle2,
  Navigation,
  X,
  ArrowRight,
  Clock3,
  ImagePlus,
} from "lucide-react";
import IssueMap from "./IssueMap";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const categories = [
  "Waste & Garbage",
  "Road & Footpath",
  "Drainage",
  "Streetlight",
  "Water",
  "Public Space",
  "Other",
];

const severityOptions = ["Low", "Medium", "High"];

export default function ReportIssue({
  onIssueSubmitted,
  onIssueUpdated,
}) {
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    severity: "Medium",
    reporter: "",
    date: new Date().toISOString().split("T")[0],
  });

  // =========================================================
  // BEFORE EVIDENCE
  // =========================================================

  const [beforePhoto, setBeforePhoto] = useState(null);
  const [beforePhotoPreview, setBeforePhotoPreview] =
    useState("");

  // =========================================================
  // LOCATION
  // =========================================================

  const [location, setLocation] = useState(null);

  // =========================================================
  // SUBMISSION
  // =========================================================

  const [submitted, setSubmitted] = useState(false);
  const [issueId, setIssueId] = useState("");

  // =========================================================
  // FOLLOW-UP EVIDENCE
  // =========================================================

  const [afterPhoto, setAfterPhoto] = useState(null);
  const [afterPhotoPreview, setAfterPhotoPreview] =
    useState("");

  const [actionTaken, setActionTaken] = useState("");

  const [outcome, setOutcome] =
    useState("Pending follow-up");

  const [followUpSaved, setFollowUpSaved] =
    useState(false);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // IMAGE COMPRESSION
  // =========================================================

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

          if (
            width > maxWidth ||
            height > maxHeight
          ) {
            const ratio = Math.min(
              maxWidth / width,
              maxHeight / height
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas =
            document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext("2d");

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

          const compressedImage =
            canvas.toDataURL(
              "image/jpeg",
              0.68
            );

          resolve(compressedImage);
        };

        image.onerror = () => {
          reject(
            new Error(
              "Unable to process image."
            )
          );
        };

        image.src = event.target.result;
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read image."
          )
        );
      };

      reader.readAsDataURL(file);
    });
  };

  // =========================================================
  // BEFORE PHOTO
  // =========================================================

  const handleBeforePhotoChange = async (
    event
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      event.target.value = "";
      return;
    }

    try {
      const compressedImage =
        await compressImage(file);

      setBeforePhoto(file);

      // Persistent data URL.
      // NOT a temporary blob URL.
      setBeforePhotoPreview(
        compressedImage
      );
    } catch (error) {
      console.error(
        "Before photo error:",
        error
      );

      alert(
        "Unable to process the photo. Please try again."
      );
    }

    event.target.value = "";
  };

  const removeBeforePhoto = () => {
    setBeforePhoto(null);
    setBeforePhotoPreview("");
  };

  // =========================================================
  // AFTER PHOTO
  // =========================================================

  const handleAfterPhotoChange = async (
    event
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      event.target.value = "";
      return;
    }

    try {
      const compressedImage =
        await compressImage(file);

      setAfterPhoto(file);

      setAfterPhotoPreview(
        compressedImage
      );
    } catch (error) {
      console.error(
        "After photo error:",
        error
      );

      alert(
        "Unable to process the photo. Please try again."
      );
    }

    event.target.value = "";
  };

  const removeAfterPhoto = () => {
    setAfterPhoto(null);
    setAfterPhotoPreview("");
  };

  // =========================================================
  // LOCATION
  // =========================================================

  const handleLocationSelect = (
    selectedLocation
  ) => {
    setLocation(selectedLocation);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        alert(
          "Unable to access your location. Please allow location permission or select a point on the map."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  };

  // =========================================================
  // ISSUE ID
  // =========================================================

  const generateIssueId = () => {
    const randomNumber = Math.floor(
      1000 + Math.random() * 9000
    );

    return `CC-${Date.now()
      .toString()
      .slice(-6)}-${randomNumber}`;
  };

  // =========================================================
  // SUBMIT REPORT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.category) {
      alert(
        "Please select an issue category."
      );
      return;
    }

    if (!formData.description.trim()) {
      alert(
        "Please describe the civic issue."
      );
      return;
    }

    if (!location) {
      alert(
        "Please select the issue location on the map."
      );
      return;
    }

    // =======================================================
    // WATER PHOTO REQUIREMENT
    // =======================================================

    if (
      formData.category === "Water" &&
      !beforePhotoPreview
    ) {
      alert(
        "A before photo is required for water-related issues."
      );
      return;
    }

    const newIssueId =
      generateIssueId();

    const newIssue = {
      id: newIssueId,

      title: formData.category,

      category: formData.category,

      description:
        formData.description.trim(),

      severity:
        formData.severity,

      status: "Reported",

      reporter:
        formData.reporter.trim() ||
        "Community Member",

      date: formData.date,

      location: [
        location.lat,
        location.lng,
      ],

      // =====================================================
      // BEFORE EVIDENCE
      // =====================================================

      photo:
        beforePhotoPreview || null,

      beforePhoto:
        beforePhotoPreview || null,

      // =====================================================
      // FOLLOW-UP DATA
      // =====================================================

      afterPhoto: null,

      actionTaken: "",

      outcome:
        "Pending follow-up",
    };

    try {
      await addDoc(
        collection(db, "issues"),
        newIssue
      );

      if (onIssueSubmitted) {
        onIssueSubmitted(newIssue);
      }

      setIssueId(newIssueId);

      setSubmitted(true);

      window.scrollTo({
        top:
          document.getElementById(
            "report"
          )?.offsetTop - 100 || 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Error saving report to Firebase:",
        error
      );

      alert(
        "Unable to save the report. Please try again."
      );
    }
  };

  // =========================================================
  // SAVE FOLLOW-UP
  // =========================================================

  const handleFollowUpSave = () => {
    if (!actionTaken.trim()) {
      alert(
        "Please describe what action was taken."
      );
      return;
    }

    if (!afterPhotoPreview) {
      alert(
        "Please add an after photo as evidence."
      );
      return;
    }

    const updatedIssue = {
      id: issueId,

      afterPhoto:
        afterPhotoPreview,

      actionTaken:
        actionTaken.trim(),

      outcome,

      status:
        outcome === "Improved"
          ? "Improved"
          : "Action Taken",
    };

    if (onIssueUpdated) {
      onIssueUpdated(updatedIssue);
    }

    setFollowUpSaved(true);
  };

  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {
    setFormData({
      category: "",
      description: "",
      severity: "Medium",
      reporter: "",
      date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setBeforePhoto(null);
    setBeforePhotoPreview("");

    setAfterPhoto(null);
    setAfterPhotoPreview("");

    setActionTaken("");

    setOutcome(
      "Pending follow-up"
    );

    setLocation(null);

    setSubmitted(false);

    setIssueId("");

    setFollowUpSaved(false);
  };

  // =========================================================
  // SUCCESS / FOLLOW-UP SCREEN
  // =========================================================

  if (submitted) {
    return (
      <section
        className="report-section"
        id="report"
      >
        <div className="report-container">

          <div className="report-success">

            <div className="success-icon">
              <CheckCircle2
                size={42}
                strokeWidth={1.7}
              />
            </div>

            <span className="section-eyebrow">
              REPORT SUBMITTED
            </span>

            <h2>
              Thank You for Speaking Up.
            </h2>

            <p>
              Your civic issue has been
              recorded in CivicConnect.
              Keep this Issue ID for the
              follow-up stage.
            </p>

            <div className="issue-id-card">

              <span>
                CIVICCONNECT ISSUE ID
              </span>

              <strong>
                {issueId}
              </strong>

            </div>

            {/* REPORT JOURNEY */}

            <div className="issue-journey">

              <div className="journey-step active">

                <div className="journey-icon">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    Reported
                  </strong>

                  <span>
                    Issue documented
                  </span>
                </div>

              </div>

              <div className="journey-line"></div>

              <div
                className={`journey-step ${
                  followUpSaved
                    ? "active"
                    : ""
                }`}
              >

                <div className="journey-icon">
                  <Clock3 size={18} />
                </div>

                <div>
                  <strong>
                    Follow-up
                  </strong>

                  <span>
                    Document the action
                  </span>
                </div>

              </div>

              <div className="journey-line"></div>

              <div
                className={`journey-step ${
                  followUpSaved &&
                  outcome ===
                    "Improved"
                    ? "active"
                    : ""
                }`}
              >

                <div className="journey-icon">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    Outcome
                  </strong>

                  <span>
                    {followUpSaved
                      ? outcome
                      : "Pending"}
                  </span>
                </div>

              </div>

            </div>

            {/* FOLLOW-UP EVIDENCE */}

            {!followUpSaved ? (
              <div className="follow-up-card">

                <div className="follow-up-heading">

                  <div className="follow-up-number">
                    07
                  </div>

                  <div>

                    <span className="section-eyebrow">
                      FOLLOW-UP EVIDENCE
                    </span>

                    <h3>
                      Show What Happened Next.
                    </h3>

                    <p>
                      After action has been
                      taken, document the change
                      with an after photo and a
                      short description.
                    </p>

                  </div>

                </div>

                {/* ACTION */}

                <div className="follow-up-field">

                  <label htmlFor="actionTaken">
                    What action was taken?
                  </label>

                  <textarea
                    id="actionTaken"
                    value={actionTaken}
                    onChange={(event) =>
                      setActionTaken(
                        event.target.value
                      )
                    }
                    placeholder="Example: The accumulated garbage was removed and the roadside area was cleaned by the community project team."
                    rows="4"
                  />

                </div>

                {/* AFTER PHOTO */}

                <div className="follow-up-field">

                  <label>
                    After photo
                  </label>

                  <p className="field-help">
                    Upload a new photo of the
                    same location after the
                    action.
                  </p>

                  {!afterPhotoPreview ? (
                    <label className="photo-upload">

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={
                          handleAfterPhotoChange
                        }
                      />

                      <ImagePlus size={25} />

                      <strong>
                        Add After Photo
                      </strong>

                      <span>
                        Show the result after
                        action
                      </span>

                    </label>
                  ) : (
                    <div className="photo-preview">

                      <img
                        src={
                          afterPhotoPreview
                        }
                        alt="After evidence preview"
                      />

                      <button
                        type="button"
                        className="remove-photo"
                        onClick={
                          removeAfterPhoto
                        }
                        aria-label="Remove after photo"
                      >
                        <X size={17} />
                      </button>

                    </div>
                  )}

                </div>

                {/* OUTCOME */}

                <div className="follow-up-field">

                  <label htmlFor="outcome">
                    What is the current outcome?
                  </label>

                  <select
                    id="outcome"
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

                    <option value="Action Taken">
                      Action Taken
                    </option>

                    <option value="Improved">
                      Improved
                    </option>

                    <option value="Still Needs Attention">
                      Still Needs Attention
                    </option>

                  </select>

                </div>

                <button
                  type="button"
                  className="submit-report-button"
                  onClick={
                    handleFollowUpSave
                  }
                >
                  Save Follow-up Evidence
                  <ArrowRight
                    size={18}
                  />
                </button>

              </div>
            ) : (
              <div className="follow-up-complete">

                <div className="success-icon">
                  <CheckCircle2
                    size={32}
                  />
                </div>

                <span className="section-eyebrow">
                  FOLLOW-UP RECORDED
                </span>

                <h3>
                  Outcome: {outcome}
                </h3>

                <p>
                  The follow-up evidence has
                  been recorded for this issue.
                </p>

              </div>
            )}

            {/* ACTION BUTTONS */}

            <div className="success-actions">

              <button
                type="button"
                className="primary-button"
                onClick={resetForm}
              >
                Report Another Issue
                <Send size={17} />
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  document
                    .getElementById(
                      "map"
                    )
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
              >
                View Civic Map
                <MapPin size={17} />
              </button>

            </div>

          </div>

        </div>
      </section>
    );
  }

  // =========================================================
  // REPORT FORM
  // =========================================================

  return (
    <section
      className="report-section"
      id="report"
    >
      <div className="report-container">

        <div className="report-heading">

          <div>

            <span className="section-eyebrow">
              REPORT A CIVIC ISSUE
            </span>

            <h2>
              See a Problem?
              <br />
              Help Us Document It.
            </h2>

            <p>
              Report a civic issue in your
              neighbourhood. Add evidence,
              describe the problem and mark its
              location so the community can
              understand what needs attention.
            </p>

          </div>

          <div className="report-heading-badge">
            <ShieldIcon />

            <span>
              Community
              <br />
              Powered
            </span>
          </div>

        </div>

        <form
          className="report-form"
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            {/* =================================================
                01 CATEGORY
            ================================================= */}

            <div className="form-card">

              <div className="form-card-number">
                01
              </div>

              <div className="form-card-content">

                <label htmlFor="category">
                  What is the issue?
                </label>

                <p className="field-help">
                  Choose the category that best
                  describes the problem.
                </p>

                <select
                  id="category"
                  name="category"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select issue category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}

                </select>

                {formData.category ===
                  "Water" && (
                  <p
                    className="field-help"
                    style={{
                      marginTop: "10px",
                      color: "#9a4b3f",
                      fontWeight: 700,
                    }}
                  >
                    A before photo is required
                    for water-related reports.
                  </p>
                )}

              </div>

            </div>

            {/* =================================================
                02 SEVERITY
            ================================================= */}

            <div className="form-card">

              <div className="form-card-number">
                02
              </div>

              <div className="form-card-content">

                <label>
                  How serious is it?
                </label>

                <p className="field-help">
                  Select the level that best
                  represents the situation.
                </p>

                <div className="severity-selector">

                  {severityOptions.map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        className={`severity-option ${
                          formData.severity ===
                          option
                            ? "selected"
                            : ""
                        } ${option.toLowerCase()}`}
                        onClick={() =>
                          setFormData(
                            (previous) => ({
                              ...previous,
                              severity:
                                option,
                            })
                          )
                        }
                      >
                        <span></span>
                        {option}
                      </button>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                03 DESCRIPTION
            ================================================= */}

            <div className="form-card form-card-wide">

              <div className="form-card-number">
                03
              </div>

              <div className="form-card-content">

                <label htmlFor="description">
                  Tell us what is happening
                </label>

                <p className="field-help">
                  Explain the issue clearly.
                  Mention anything that could
                  help the community understand
                  it.
                </p>

                <textarea
                  id="description"
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Garbage has been accumulating beside the road for several days..."
                  rows="6"
                  required
                />

              </div>

            </div>

            {/* =================================================
                04 BEFORE PHOTO
            ================================================= */}

            <div className="form-card">

              <div className="form-card-number">
                04
              </div>

              <div className="form-card-content">

                <label>
                  Before photo
                  {formData.category ===
                    "Water" && (
                    <span
                      style={{
                        color: "#b24d42",
                        marginLeft: "5px",
                      }}
                    >
                      *
                    </span>
                  )}
                </label>

                <p className="field-help">
                  Capture the civic problem
                  before any action is taken.
                  {formData.category ===
                    "Water" &&
                    " Required for water-related issues."}
                </p>

                {!beforePhotoPreview ? (
                  <label className="photo-upload">

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={
                        handleBeforePhotoChange
                      }
                    />

                    <Camera size={25} />

                    <strong>
                      Add Before Photo
                    </strong>

                    <span>
                      JPG, PNG or WEBP
                    </span>

                  </label>
                ) : (
                  <div className="photo-preview">

                    <img
                      src={
                        beforePhotoPreview
                      }
                      alt="Before civic issue evidence"
                    />

                    <button
                      type="button"
                      className="remove-photo"
                      onClick={
                        removeBeforePhoto
                      }
                      aria-label="Remove before photo"
                    >
                      <X size={17} />
                    </button>

                  </div>
                )}

              </div>

            </div>

            {/* =================================================
                05 REPORTER
            ================================================= */}

            <div className="form-card">

              <div className="form-card-number">
                05
              </div>

              <div className="form-card-content">

                <label htmlFor="reporter">
                  Your name
                </label>

                <p className="field-help">
                  Optional. You can report as a
                  community member.
                </p>

                <input
                  id="reporter"
                  name="reporter"
                  type="text"
                  value={
                    formData.reporter
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Your name"
                />

              </div>

            </div>

          </div>

          {/* =================================================
              06 LOCATION
          ================================================= */}

          <div className="location-card">

            <div className="location-card-heading">

              <div>

                <div className="form-card-number">
                  06
                </div>

                <div>

                  <label>
                    Where is the issue?
                  </label>

                  <p className="field-help">
                    Click the exact location on
                    the map or use your current
                    location.
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="location-button"
                onClick={
                  useMyLocation
                }
              >
                <Navigation size={16} />
                Use My Location
              </button>

            </div>

            <IssueMap
              selectable={true}
              selectedLocation={
                location
              }
              onLocationSelect={
                handleLocationSelect
              }
            />

            {location && (
              <div className="selected-location">

                <MapPin size={17} />

                <span>
                  Location selected:{" "}
                  <strong>
                    {location.lat.toFixed(
                      5
                    )}
                    ,{" "}
                    {location.lng.toFixed(
                      5
                    )}
                  </strong>
                </span>

              </div>
            )}

          </div>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="form-submit-area">

            <div className="privacy-note">

              <span>◎</span>

              Focus on civic problems, not
              individuals. Please avoid
              uploading identifiable personal
              information.

            </div>

            <button
              type="submit"
              className="submit-report-button"
            >
              Submit Civic Report
              <Send size={18} />
            </button>

          </div>

        </form>

      </div>
    </section>
  );
}

// =============================================================
// SHIELD ICON
// =============================================================

function ShieldIcon() {
  return (
    <div className="report-shield">
      <CheckCircle2 size={22} />
    </div>
  );
}
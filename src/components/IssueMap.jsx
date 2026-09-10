import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* =========================================================
   MAP CLICK HANDLER
========================================================= */

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

/* =========================================================
   LOCATION CONTROLLER
========================================================= */

function LocationController({ location }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    map.invalidateSize();

    map.setView([lat, lng], 17, {
      animate: true,
      duration: 1.5,
    });
  }, [location, map]);

  return null;
}

/* =========================================================
   FIT MAP TO ALL ISSUES
========================================================= */

function IssueBoundsController({ issues, currentLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!issues || issues.length === 0) return;

    const validLocations = issues
      .map((issue) => normalizeLocation(issue.location))
      .filter(Boolean);

    if (validLocations.length === 0) return;

    const bounds = L.latLngBounds(validLocations);

    if (currentLocation) {
      const current = [
        Number(currentLocation.lat),
        Number(currentLocation.lng),
      ];

      if (
        Number.isFinite(current[0]) &&
        Number.isFinite(current[1])
      ) {
        bounds.extend(current);
      }
    }

    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 16,
      animate: true,
    });
  }, [issues, currentLocation, map]);

  return null;
}

/* =========================================================
   LOCATION NORMALIZER
========================================================= */

function normalizeLocation(location) {
  if (!location) return null;

  if (Array.isArray(location)) {
    const lat = Number(location[0]);
    const lng = Number(location[1]);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return [lat, lng];
    }

    return null;
  }

  if (
    typeof location === "object" &&
    location.lat !== undefined &&
    location.lng !== undefined
  ) {
    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return [lat, lng];
    }
  }

  return null;
}

/* =========================================================
   SEVERITY HELPERS
========================================================= */

function getSeverityClass(severity) {
  if (severity === "High") return "high";
  if (severity === "Medium") return "medium";
  return "low";
}

function getSeverityColor(severity) {
  if (severity === "High") return "#c94b4b";
  if (severity === "Medium") return "#d28b32";
  return "#4d8b63";
}

/* =========================================================
   CUSTOM ISSUE MARKER
========================================================= */

function createIssueIcon(severity) {
  const color = getSeverityColor(severity);

  return L.divIcon({
    className: "civic-custom-marker",
    html: `
      <div
        style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.28);
        "
      ></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

/* =========================================================
   CURRENT LOCATION ICON
========================================================= */

const currentLocationIcon = L.divIcon({
  className: "civic-current-location-marker",
  html: `
    <div
      style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #246bfe;
        border: 4px solid #ffffff;
        box-shadow:
          0 0 0 7px rgba(36,107,254,0.18),
          0 4px 14px rgba(0,0,0,0.25);
      "
    ></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/* =========================================================
   SELECTED LOCATION ICON
========================================================= */

const selectedLocationIcon = L.divIcon({
  className: "civic-selected-location-marker",
  html: `
    <div
      style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #245c3b;
        border: 4px solid #ffffff;
        box-shadow:
          0 0 0 7px rgba(36,92,59,0.18),
          0 4px 14px rgba(0,0,0,0.25);
      "
    ></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/* =========================================================
   MAP CONTROL BUTTON
========================================================= */

function MapFitButton({ issues }) {
  const map = useMap();

  const fitIssues = () => {
    const validLocations = issues
      .map((issue) => normalizeLocation(issue.location))
      .filter(Boolean);

    if (validLocations.length === 0) return;

    const bounds = L.latLngBounds(validLocations);

    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 16,
      animate: true,
    });
  };

  return (
    <button
      type="button"
      className="map-fit-button"
      onClick={fitIssues}
      disabled={issues.length === 0}
      title="Show all reported issues"
    >
      ⛶ Fit Issues
    </button>
  );
}

/* =========================================================
   ISSUE POPUP
========================================================= */

function IssuePopup({ issue }) {
  const beforePhoto =
    issue.beforePhoto || issue.photo || null;

  const afterPhoto = issue.afterPhoto || null;

  return (
    <div className="issue-popup">

      <div className="issue-popup-top">
        <span className="issue-popup-id">
          {issue.id || "ISSUE"}
        </span>

        <span
          className={`issue-severity ${getSeverityClass(
            issue.severity
          )}`}
        >
          {issue.severity || "Low"}
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

      <div className="issue-popup-meta">

        <span>
          <strong>Category:</strong>{" "}
          {issue.category || "General"}
        </span>

        <span>
          <strong>Status:</strong>{" "}
          {issue.status || "Reported"}
        </span>

      </div>

      {issue.reporter && (
        <div className="issue-popup-detail">
          <strong>Reported by</strong>
          <span>{issue.reporter}</span>
        </div>
      )}

      {issue.date && (
        <div className="issue-popup-detail">
          <strong>Date</strong>
          <span>{issue.date}</span>
        </div>
      )}

      {issue.actionTaken && (
        <div className="issue-popup-action">
          <strong>✓ Action Taken</strong>
          <span>{issue.actionTaken}</span>
        </div>
      )}

      {issue.outcome && (
        <div className="issue-popup-outcome">
          <strong>Outcome</strong>
          <span>{issue.outcome}</span>
        </div>
      )}

      {(beforePhoto || afterPhoto) && (
        <div className="issue-popup-evidence">

          <div className="issue-popup-evidence-title">
            Evidence
          </div>

          <div className="issue-popup-images">

            {beforePhoto && (
              <div className="issue-popup-image-wrap">
                <span>Before</span>
                <img
                  src={beforePhoto}
                  alt="Before civic issue"
                />
              </div>
            )}

            {afterPhoto && (
              <div className="issue-popup-image-wrap">
                <span>After</span>
                <img
                  src={afterPhoto}
                  alt="After civic issue"
                />
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function IssueMap({
  selectable = false,
  selectedLocation = null,
  onLocationSelect = () => {},
  issues = [],
}) {
  const [currentLocation, setCurrentLocation] =
    useState(null);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [locationError, setLocationError] =
    useState("");

  const [severityFilter, setSeverityFilter] =
    useState("All");

  const defaultCenter = [20.5937, 78.9629];

  /* =======================================================
     LOCATION DETECTION
  ======================================================= */

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationLoading(false);

      setLocationError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        console.log(
          "CivicConnect location:",
          detectedLocation.lat,
          detectedLocation.lng
        );

        setCurrentLocation(detectedLocation);
        setLocationLoading(false);

        if (selectable) {
          onLocationSelect(detectedLocation);
        }
      },

      (error) => {
        console.error(
          "CivicConnect location error:",
          error.code,
          error.message
        );

        setLocationLoading(false);

        setLocationError(
          "Unable to detect your location. Please use the map manually."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  /* =======================================================
     FILTER ISSUES
  ======================================================= */

  const filteredIssues = useMemo(() => {
    if (severityFilter === "All") {
      return issues;
    }

    return issues.filter(
      (issue) =>
        issue.severity === severityFilter
    );
  }, [issues, severityFilter]);

  /* =======================================================
     MAP STATISTICS
  ======================================================= */

  const highIssues = issues.filter(
    (issue) => issue.severity === "High"
  ).length;

  const mediumIssues = issues.filter(
    (issue) => issue.severity === "Medium"
  ).length;

  const lowIssues = issues.filter(
    (issue) =>
      !issue.severity ||
      issue.severity === "Low"
  ).length;

  const reportedIssues = issues.filter(
    (issue) =>
      issue.status === "Reported"
  ).length;

  const underReviewIssues = issues.filter(
    (issue) =>
      issue.status === "Under Review"
  ).length;

  const improvedIssues = issues.filter(
    (issue) =>
      issue.status === "Improved"
  ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="civic-map-wrapper">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="civic-map-header">

        <div>
          <span className="section-eyebrow">
            CIVIC MAP
          </span>

          <h2>
            See What Needs Attention.
          </h2>

          <p>
            Explore civic issues around your
            neighbourhood and identify locations
            that need attention.
          </p>
        </div>

        <div className="map-live-status">
          <span className="map-live-dot"></span>
          Live Issue Map
        </div>

      </div>

      {/* ===================================================
          LOCATION INFORMATION
      =================================================== */}

      <div className="map-selection-note">

        <span className="map-location-icon">
          📍
        </span>

        <div className="map-location-text">

          {locationLoading ? (
            <>
              <strong>
                Detecting your location...
              </strong>

              <span>
                Please wait a moment.
              </span>
            </>
          ) : currentLocation ? (
            <>
              <strong>
  Your current location
</strong>

<span>
  detected · {currentLocation.lat.toFixed(6)},{" "}
  {currentLocation.lng.toFixed(6)}
</span>
            </>
          ) : (
            <>
              <strong>
                Location not detected
              </strong>

              <span>
                You can select a location manually.
              </span>
            </>
          )}

        </div>

        <button
          type="button"
          className="map-location-button"
          onClick={detectLocation}
        >
          ◎ Locate Me
        </button>

      </div>

      {/* ===================================================
          MAP FILTER BAR
      =================================================== */}

      <div className="map-filter-bar">

        <div className="map-filter-heading">
          <strong>
            {filteredIssues.length}
          </strong>

          <span>
            {severityFilter === "All"
              ? "issues displayed"
              : `${severityFilter.toLowerCase()} severity issues`}
          </span>
        </div>

        <div className="map-filter-buttons">

          <button
            type="button"
            className={
              severityFilter === "All"
                ? "active"
                : ""
            }
            onClick={() =>
              setSeverityFilter("All")
            }
          >
            All
            <span>{issues.length}</span>
          </button>

          <button
            type="button"
            className={
              severityFilter === "High"
                ? "active high-filter"
                : ""
            }
            onClick={() =>
              setSeverityFilter("High")
            }
          >
            High
            <span>{highIssues}</span>
          </button>

          <button
            type="button"
            className={
              severityFilter === "Medium"
                ? "active medium-filter"
                : ""
            }
            onClick={() =>
              setSeverityFilter("Medium")
            }
          >
            Medium
            <span>{mediumIssues}</span>
          </button>

          <button
            type="button"
            className={
              severityFilter === "Low"
                ? "active low-filter"
                : ""
            }
            onClick={() =>
              setSeverityFilter("Low")
            }
          >
            Low
            <span>{lowIssues}</span>
          </button>

        </div>

      </div>

      {/* ===================================================
          MAP
      =================================================== */}

      <div className="civic-map-container">

        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          className="civic-map"
        >

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <LocationController
            location={currentLocation}
          />

          <IssueBoundsController
            issues={filteredIssues}
            currentLocation={currentLocation}
          />

          <MapFitButton
            issues={filteredIssues}
          />

          {selectable && (
            <MapClickHandler
              onLocationSelect={onLocationSelect}
            />
          )}

          {/* =================================================
              CURRENT LOCATION
          ================================================= */}

          {currentLocation && (
            <Marker
              position={[
                currentLocation.lat,
                currentLocation.lng,
              ]}
              icon={currentLocationIcon}
            >
              <Popup>

                <div className="issue-popup">

                  <strong>
                    📍 Your Current Location
                  </strong>

                  <p>
                    This is the location detected
                    by your browser.
                  </p>

                  <small>
                    Latitude:{" "}
                    {currentLocation.lat.toFixed(6)}
                    <br />
                    Longitude:{" "}
                    {currentLocation.lng.toFixed(6)}
                  </small>

                </div>

              </Popup>
            </Marker>
          )}

          {/* =================================================
              CIVIC ISSUE MARKERS
          ================================================= */}

          {filteredIssues.map((issue) => {

            const location =
              normalizeLocation(issue.location);

            if (!location) return null;

            return (
              <Marker
                key={issue.id}
                position={location}
                icon={createIssueIcon(
                  issue.severity
                )}
              >

                <Popup>

                  <IssuePopup
                    issue={issue}
                  />

                </Popup>

              </Marker>
            );
          })}

          {/* =================================================
              SELECTED REPORT LOCATION
          ================================================= */}

          {selectedLocation && (
            <Marker
              position={[
                selectedLocation.lat,
                selectedLocation.lng,
              ]}
              icon={selectedLocationIcon}
            >

              <Popup>

                <div className="issue-popup">

                  <strong>
                    📌 Selected Issue Location
                  </strong>

                  <p>
                    This location will be attached
                    to your civic issue report.
                  </p>

                  <small>
                    Latitude:{" "}
                    {selectedLocation.lat.toFixed(6)}
                    <br />
                    Longitude:{" "}
                    {selectedLocation.lng.toFixed(6)}
                  </small>

                </div>

              </Popup>

            </Marker>
          )}

        </MapContainer>

        {/* =================================================
            LOADING
        ================================================= */}

        {locationLoading && (
          <div className="map-loading">

            <div className="map-loading-card">

              <div className="map-spinner"></div>

              <strong>
                Finding your location...
              </strong>

              <span>
                Getting your current position.
              </span>

            </div>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!locationLoading &&
          locationError && (
            <div className="map-error-message">
              📍 {locationError}
            </div>
          )}

        {/* =================================================
            MAP LEGEND
        ================================================= */}

        <div className="map-legend">

          <div className="map-legend-title">
            ISSUE SEVERITY
          </div>

          <div className="legend-item">
            <span className="legend-dot high"></span>
            High
          </div>

          <div className="legend-item">
            <span className="legend-dot medium"></span>
            Medium
          </div>

          <div className="legend-item">
            <span className="legend-dot low"></span>
            Low
          </div>

        </div>

      </div>

      {/* ===================================================
          MAP STATS
      =================================================== */}

      <div className="map-bottom-info">

        <div>
          <strong>
            {issues.length}
          </strong>

          <span>
            Total Issues
          </span>
        </div>

        <div>
          <strong>
            {reportedIssues}
          </strong>

          <span>
            Reported
          </span>
        </div>

        <div>
          <strong>
            {underReviewIssues}
          </strong>

          <span>
            Under Review
          </span>
        </div>

        <div>
          <strong>
            {improvedIssues}
          </strong>

          <span>
            Improved
          </span>
        </div>

      </div>

    </div>
  );
}
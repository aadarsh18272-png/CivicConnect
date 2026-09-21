import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
   REVERSE GEOCODING
   Geoapify Reverse Geocoding API

   Uses:
   VITE_GEOAPIFY_API_KEY

   We request several nearby result levels and choose the
   most useful detailed result instead of blindly displaying
   one broad locality.
========================================================= */

const addressCache = new Map();

function pickFirst(address, keys) {
  for (const key of keys) {
    if (address?.[key]) return address[key];
  }
  return "";
}

function getResultTypePriority(resultType) {
  const priorities = {
    building: 100,
    amenity: 92,
    street: 84,
    suburb: 62,
    district: 48,
    postcode: 40,
    city: 30,
    county: 20,
    state: 10,
    country: 5,
    unknown: 0,
  };

  return priorities[resultType] ?? 0;
}

function chooseBestResult(results, latitude, longitude) {
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  return [...results]
    .map((result) => {
      const distance =
        Number(result?.distance);

      const resultLat = Number(result?.lat);
      const resultLon = Number(result?.lon);

      let calculatedDistance =
        Number.isFinite(distance)
          ? distance
          : Infinity;

      if (
        !Number.isFinite(distance) &&
        Number.isFinite(resultLat) &&
        Number.isFinite(resultLon)
      ) {
        calculatedDistance =
          Math.sqrt(
            Math.pow(
              (resultLat - latitude) * 111000,
              2
            ) +
            Math.pow(
              (resultLon - longitude) *
                111000 *
                Math.cos(
                  (latitude * Math.PI) / 180
                ),
              2
            )
          );
      }

      const confidence =
        Number(
          result?.rank?.confidence
        ) || 0;

      /*
        Detailed results are preferred, but a very distant
        building/amenity should not beat a nearby street.
      */
      const distancePenalty =
        Number.isFinite(calculatedDistance)
          ? Math.min(
              calculatedDistance / 10,
              35
            )
          : 35;

      const score =
        getResultTypePriority(
          result?.result_type
        ) +
        confidence * 10 -
        distancePenalty;

      return {
        result,
        score,
        calculatedDistance,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score
    )[0]?.result || null;
}

function buildReadableAddress(result) {
  const houseNumber =
    result?.housenumber || "";

  const road = pickFirst(result, [
    "street",
    "road",
  ]);

  const placeName =
    result?.name &&
    result.name !== road &&
    result.name !== result?.city
      ? result.name
      : "";

  const area = pickFirst(result, [
    "suburb",
    "neighbourhood",
    "quarter",
    "locality",
  ]);

  const city = pickFirst(result, [
    "city",
    "town",
    "village",
    "municipality",
  ]);

  const district = pickFirst(result, [
    "district",
    "county",
  ]);

  const state =
    result?.state || "";

  const postcode =
    result?.postcode || "";

  const country =
    result?.country || "";

  const street = [
    houseNumber,
    road,
  ]
    .filter(Boolean)
    .join(", ");

  const addressLine1 =
    result?.address_line1 ||
    [placeName, street]
      .filter(Boolean)
      .join(", ");

  const addressLine2 =
    result?.address_line2 ||
    [
      area,
      city,
      district,
      state,
      postcode,
    ]
      .filter(Boolean)
      .join(", ");

  return {
    formatted:
      result?.formatted ||
      [addressLine1, addressLine2]
        .filter(Boolean)
        .join(", ") ||
      "Address unavailable",

    placeName,
    street,
    area,
    city,
    district,
    state,
    postcode,
    country,

    resultType:
      result?.result_type ||
      "unknown",

    distance:
      Number.isFinite(
        Number(result?.distance)
      )
        ? Number(result.distance)
        : null,

    confidence:
      Number.isFinite(
        Number(result?.rank?.confidence)
      )
        ? Number(
            result.rank.confidence
          )
        : null,
  };
}

function AddressDisplay({
  lat,
  lng,
  compact = false,
}) {
  const [address, setAddress] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const latitude = Number(lat);
    const longitude = Number(lng);

    const apiKey =
      import.meta.env
        .VITE_GEOAPIFY_API_KEY;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setLoading(false);
      setErrorMessage(
        "Invalid coordinates."
      );
      return;
    }

    if (!apiKey) {
      setLoading(false);
      setErrorMessage(
        "Geoapify API key is missing."
      );
      return;
    }

    const cacheKey =
      `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

    if (
      addressCache.has(cacheKey)
    ) {
      setAddress(
        addressCache.get(cacheKey)
      );
      setLoading(false);
      setErrorMessage("");
      return;
    }

    const fetchAddress = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        /*
          Ask Geoapify for several nearby address
          candidates. This gives us a chance to use a
          building/amenity/street result instead of
          automatically showing the same suburb.
        */
        const params =
          new URLSearchParams({
            lat: String(latitude),
            lon: String(longitude),
            format: "json",
            limit: "5",
            lang: "en",
            apiKey,
          });

        const response =
          await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`
          );

        if (!response.ok) {
          throw new Error(
            `Geoapify request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        const results =
          data?.results || [];

        const bestResult =
          chooseBestResult(
            results,
            latitude,
            longitude
          );

        if (!bestResult) {
          throw new Error(
            "No detailed address was found for these coordinates."
          );
        }

        const readableAddress =
          buildReadableAddress(
            bestResult
          );

        addressCache.set(
          cacheKey,
          readableAddress
        );

        if (!cancelled) {
          setAddress(
            readableAddress
          );
          setLoading(false);
          setErrorMessage("");
        }
      } catch (err) {
        console.error(
          "CivicConnect Geoapify address lookup error:",
          err
        );

        if (!cancelled) {
          setLoading(false);
          setErrorMessage(
            err?.message ||
              "Unable to find this address."
          );
        }
      }
    };

    fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (loading) {
    return (
      <div
        style={{
          marginTop: "10px",
          padding: "9px 10px",
          borderRadius: "10px",
          background: "#f5f7f3",
          fontSize: "12px",
          color: "#647066",
        }}
      >
        📍 Finding detailed address...
      </div>
    );
  }

  if (
    errorMessage ||
    !address
  ) {
    return (
      <div
        style={{
          marginTop: "10px",
          padding: "9px 10px",
          borderRadius: "10px",
          background: "#fff5f1",
          border: "1px solid #f1d6ca",
          fontSize: "12px",
          color: "#8a5544",
        }}
      >
        <strong>
          📍 Address unavailable
        </strong>

        <div
          style={{
            marginTop: "4px",
          }}
        >
          {errorMessage ||
            "No address found for this location."}
        </div>
      </div>
    );
  }

  const rows = [
    [
      "Place",
      address.placeName,
    ],
    [
      "Road",
      address.street,
    ],
    [
      "Area",
      address.area,
    ],
    [
      "City",
      address.city,
    ],
    [
      "District",
      address.district,
    ],
    [
      "State",
      address.state,
    ],
    [
      "PIN",
      address.postcode,
    ],
  ].filter(
    ([, value]) => value
  );

  return (
    <div
      style={{
        marginTop: compact
          ? "7px"
          : "10px",
        padding: compact
          ? "7px 9px"
          : "10px 11px",
        borderRadius: "10px",
        background: "#f5f7f3",
        border:
          "1px solid #e2e8e1",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing:
            "0.08em",
          textTransform:
            "uppercase",
          color: "#245c3b",
          marginBottom: "6px",
        }}
      >
        📍 Detailed Location
      </div>

      {rows.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "4px",
          }}
        >
          {rows.map(
            ([label, value]) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "70px 1fr",
                  gap: "7px",
                  fontSize:
                    compact
                      ? "11px"
                      : "12px",
                  lineHeight: 1.4,
                }}
              >
                <strong
                  style={{
                    color: "#647066",
                  }}
                >
                  {label}
                </strong>

                <span
                  style={{
                    color: "#303832",
                    fontWeight: 600,
                  }}
                >
                  {value}
                </span>
              </div>
            )
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: "12px",
            color: "#303832",
            fontWeight: 600,
          }}
        >
          {address.formatted}
        </div>
      )}

      <div
        style={{
          marginTop: "7px",
          paddingTop: "6px",
          borderTop:
            "1px solid #e2e8e1",
          fontSize: "10px",
          color: "#7a847d",
        }}
      >
        Matched as{" "}
        <strong>
          {address.resultType}
        </strong>
        {address.distance !== null
          ? ` · ${Math.round(
              address.distance
            )} m away`
          : ""}
      </div>
    </div>
  );
}


/* =========================================================
   MAP CLICK HANDLER
========================================================= */

function MapClickHandler({
  onLocationSelect,
}) {
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

function LocationController({
  location,
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    const lat = Number(location.lat);
    const lng = Number(location.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    map.invalidateSize();

    map.setView(
      [lat, lng],
      17,
      {
        animate: true,
        duration: 1.5,
      }
    );
  }, [location, map]);

  return null;
}


/* =========================================================
   FIT MAP TO ALL ISSUES
========================================================= */

function IssueBoundsController({
  issues,
  currentLocation,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !issues ||
      issues.length === 0
    ) {
      return;
    }

    const validLocations = issues
      .map((issue) =>
        normalizeLocation(issue.location)
      )
      .filter(Boolean);

    if (
      validLocations.length === 0
    ) {
      return;
    }

    const bounds =
      L.latLngBounds(validLocations);

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

    map.fitBounds(
      bounds,
      {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      }
    );
  }, [
    issues,
    currentLocation,
    map,
  ]);

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
  if (severity === "High") {
    return "high";
  }

  if (severity === "Medium") {
    return "medium";
  }

  return "low";
}


function getSeverityColor(severity) {
  if (severity === "High") {
    return "#c94b4b";
  }

  if (severity === "Medium") {
    return "#d28b32";
  }

  return "#4d8b63";
}


/* =========================================================
   CUSTOM ISSUE MARKER
========================================================= */

function createIssueIcon(severity) {
  const color =
    getSeverityColor(severity);

  return L.divIcon({
    className:
      "civic-custom-marker",

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

const currentLocationIcon =
  L.divIcon({
    className:
      "civic-current-location-marker",

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

const selectedLocationIcon =
  L.divIcon({
    className:
      "civic-selected-location-marker",

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

function MapFitButton({
  issues,
}) {
  const map = useMap();

  const fitIssues = () => {
    const validLocations =
      issues
        .map((issue) =>
          normalizeLocation(
            issue.location
          )
        )
        .filter(Boolean);

    if (
      validLocations.length === 0
    ) {
      return;
    }

    const bounds =
      L.latLngBounds(
        validLocations
      );

    map.fitBounds(
      bounds,
      {
        padding: [60, 60],
        maxZoom: 16,
        animate: true,
      }
    );
  };

  return (
    <button
      type="button"
      className="map-fit-button"
      onClick={fitIssues}
      disabled={
        issues.length === 0
      }
      title="Show all reported issues"
    >
      ⛶ Fit Issues
    </button>
  );
}


/* =========================================================
   ISSUE POPUP
========================================================= */

function IssuePopup({
  issue,
}) {
  const beforePhoto =
    issue.beforePhoto ||
    issue.photo ||
    null;

  const afterPhoto =
    issue.afterPhoto ||
    null;

  const location =
    normalizeLocation(
      issue.location
    );

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
          <strong>
            Category:
          </strong>{" "}
          {issue.category ||
            "General"}
        </span>

        <span>
          <strong>
            Status:
          </strong>{" "}
          {issue.status ||
            "Reported"}
        </span>

      </div>


      {location && (
        <AddressDisplay
          lat={location[0]}
          lng={location[1]}
        />
      )}


      {location && (
        <div
          className="issue-popup-detail"
          style={{
            marginTop: "8px",
          }}
        >
          <strong>
            Coordinates
          </strong>

          <span>
            {location[0].toFixed(6)},{" "}
            {location[1].toFixed(6)}
          </span>
        </div>
      )}


      {issue.reporter && (
        <div className="issue-popup-detail">

          <strong>
            Reported by
          </strong>

          <span>
            {issue.reporter}
          </span>

        </div>
      )}


      {issue.date && (
        <div className="issue-popup-detail">

          <strong>
            Date
          </strong>

          <span>
            {issue.date}
          </span>

        </div>
      )}


      {issue.actionTaken && (
        <div className="issue-popup-action">

          <strong>
            ✓ Action Taken
          </strong>

          <span>
            {issue.actionTaken}
          </span>

        </div>
      )}


      {issue.outcome && (
        <div className="issue-popup-outcome">

          <strong>
            Outcome
          </strong>

          <span>
            {issue.outcome}
          </span>

        </div>
      )}


      {(beforePhoto ||
        afterPhoto) && (
        <div className="issue-popup-evidence">

          <div className="issue-popup-evidence-title">
            Evidence
          </div>


          <div className="issue-popup-images">

            {beforePhoto && (
              <div className="issue-popup-image-wrap">

                <span>
                  Before
                </span>

                <img
                  src={beforePhoto}
                  alt="Before civic issue"
                />

              </div>
            )}


            {afterPhoto && (
              <div className="issue-popup-image-wrap">

                <span>
                  After
                </span>

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

  const [
    currentLocation,
    setCurrentLocation,
  ] = useState(null);


  const [
    locationLoading,
    setLocationLoading,
  ] = useState(true);


  const [
    locationError,
    setLocationError,
  ] = useState("");


  const [
    severityFilter,
    setSeverityFilter,
  ] = useState("All");


  const defaultCenter =
    [20.5937, 78.9629];


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
          lat:
            position.coords.latitude,

          lng:
            position.coords.longitude,
        };


        console.log(
          "CivicConnect location:",
          detectedLocation.lat,
          detectedLocation.lng
        );


        setCurrentLocation(
          detectedLocation
        );

        setLocationLoading(false);


        if (selectable) {

          onLocationSelect(
            detectedLocation
          );

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

  const filteredIssues =
    useMemo(() => {

      if (
        severityFilter === "All"
      ) {
        return issues;
      }


      return issues.filter(
        (issue) =>
          issue.severity ===
          severityFilter
      );

    }, [
      issues,
      severityFilter,
    ]);


  /* =======================================================
     MAP STATISTICS
  ======================================================= */

  const highIssues =
    issues.filter(
      (issue) =>
        issue.severity === "High"
    ).length;


  const mediumIssues =
    issues.filter(
      (issue) =>
        issue.severity ===
        "Medium"
    ).length;


  const lowIssues =
    issues.filter(
      (issue) =>
        !issue.severity ||
        issue.severity === "Low"
    ).length;


  const reportedIssues =
    issues.filter(
      (issue) =>
        issue.status ===
        "Reported"
    ).length;


  const underReviewIssues =
    issues.filter(
      (issue) =>
        issue.status ===
        "Under Review"
    ).length;


  const improvedIssues =
    issues.filter(
      (issue) =>
        issue.status ===
        "Improved"
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
            Explore civic issues around
            your neighbourhood and
            identify locations that need
            attention.
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
                detected ·{" "}
                {currentLocation.lat.toFixed(
                  6
                )}
                ,{" "}
                {currentLocation.lng.toFixed(
                  6
                )}
              </span>

            </>

          ) : (

            <>

              <strong>
                Location not detected
              </strong>

              <span>
                You can select a location
                manually.
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
              severityFilter ===
              "All"
                ? "active"
                : ""
            }
            onClick={() =>
              setSeverityFilter(
                "All"
              )
            }
          >
            All
            <span>
              {issues.length}
            </span>
          </button>


          <button
            type="button"
            className={
              severityFilter ===
              "High"
                ? "active high-filter"
                : ""
            }
            onClick={() =>
              setSeverityFilter(
                "High"
              )
            }
          >
            High
            <span>
              {highIssues}
            </span>
          </button>


          <button
            type="button"
            className={
              severityFilter ===
              "Medium"
                ? "active medium-filter"
                : ""
            }
            onClick={() =>
              setSeverityFilter(
                "Medium"
              )
            }
          >
            Medium
            <span>
              {mediumIssues}
            </span>
          </button>


          <button
            type="button"
            className={
              severityFilter ===
              "Low"
                ? "active low-filter"
                : ""
            }
            onClick={() =>
              setSeverityFilter(
                "Low"
              )
            }
          >
            Low
            <span>
              {lowIssues}
            </span>
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
            location={
              currentLocation
            }
          />


          <IssueBoundsController
            issues={
              filteredIssues
            }
            currentLocation={
              currentLocation
            }
          />


          <MapFitButton
            issues={
              filteredIssues
            }
          />


          {selectable && (
            <MapClickHandler
              onLocationSelect={
                onLocationSelect
              }
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
              icon={
                currentLocationIcon
              }
            >

              <Popup>

                <div className="issue-popup">

                  <strong>
                    📍 Your Current Location
                  </strong>


                  <p>
                    This is the location
                    detected by your
                    browser.
                  </p>


                  <AddressDisplay
                    lat={
                      currentLocation.lat
                    }
                    lng={
                      currentLocation.lng
                    }
                  />


                  <div
                    className="issue-popup-detail"
                    style={{
                      marginTop:
                        "8px",
                    }}
                  >

                    <strong>
                      Coordinates
                    </strong>

                    <span>
                      {currentLocation.lat.toFixed(
                        6
                      )}
                      ,{" "}
                      {currentLocation.lng.toFixed(
                        6
                      )}
                    </span>

                  </div>

                </div>

              </Popup>

            </Marker>

          )}


          {/* =================================================
              CIVIC ISSUE MARKERS
          ================================================= */}

          {filteredIssues.map(
            (issue) => {

              const location =
                normalizeLocation(
                  issue.location
                );


              if (!location) {
                return null;
              }


              return (

                <Marker
                  key={issue.id}
                  position={location}
                  icon={
                    createIssueIcon(
                      issue.severity
                    )
                  }
                >

                  <Popup>

                    <IssuePopup
                      issue={issue}
                    />

                  </Popup>

                </Marker>

              );

            }
          )}


          {/* =================================================
              SELECTED REPORT LOCATION
          ================================================= */}

          {selectedLocation && (

            <Marker
              position={[
                selectedLocation.lat,
                selectedLocation.lng,
              ]}
              icon={
                selectedLocationIcon
              }
            >

              <Popup>

                <div className="issue-popup">

                  <strong>
                    📌 Selected Issue Location
                  </strong>


                  <p>
                    This location will be
                    attached to your civic
                    issue report.
                  </p>


                  <AddressDisplay
                    lat={
                      selectedLocation.lat
                    }
                    lng={
                      selectedLocation.lng
                    }
                  />


                  <div
                    className="issue-popup-detail"
                    style={{
                      marginTop:
                        "8px",
                    }}
                  >

                    <strong>
                      Coordinates
                    </strong>

                    <span>
                      {selectedLocation.lat.toFixed(
                        6
                      )}
                      ,{" "}
                      {selectedLocation.lng.toFixed(
                        6
                      )}
                    </span>

                  </div>

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
                Getting your current
                position.
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

              📍{" "}
              {locationError}

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
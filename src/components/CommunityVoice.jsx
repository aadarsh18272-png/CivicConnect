import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  ThumbsUp,
  Lightbulb,
  Users,
  Send,
  CheckCircle2,
} from "lucide-react";
const defaultPoll = {
  id: 1,
  question: "What should be addressed first in our neighbourhood?",
  options: [
    { label: "Garbage & Waste", votes: 18 },
    { label: "Roads & Footpaths", votes: 12 },
    { label: "Drainage", votes: 8 },
    { label: "Streetlights", votes: 6 },
  ],
};

export default function CommunityVoice() {
  /* =====================================================
     LOAD SAVED COMMUNITY DATA
     ===================================================== */

  const [poll, setPoll] = useState(() => {
    try {
      const savedPoll = localStorage.getItem(
        "civicconnect_community_poll"
      );

      return savedPoll
        ? JSON.parse(savedPoll)
        : defaultPoll;
    } catch (error) {
      console.error(
        "Unable to load community poll:",
        error
      );

      return defaultPoll;
    }
  });

  const [selectedOption, setSelectedOption] = useState("");

  const [voted, setVoted] = useState(() => {
    try {
      return (
        localStorage.getItem(
          "civicconnect_community_voted"
        ) === "true"
      );
    } catch {
      return false;
    }
  });

  const [suggestion, setSuggestion] = useState("");

  const [websiteRating, setWebsiteRating] = useState(() => {
  try {
    return Number(
      localStorage.getItem(
        "civicconnect_website_rating"
      )
    ) || 0;
  } catch {
    return 0;
  }
});

const [serviceRating, setServiceRating] = useState(() => {
  try {
    return Number(
      localStorage.getItem(
        "civicconnect_service_rating"
      )
    ) || 0;
  } catch {
    return 0;
  }
});

const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [feedback, setFeedback] = useState(() => {
  try {
    return (
      localStorage.getItem(
        "civicconnect_feedback"
      ) || ""
    );
  } catch {
    return "";
  }
});

  const [suggestions, setSuggestions] = useState(() => {
    try {
      const savedSuggestions = localStorage.getItem(
        "civicconnect_community_suggestions"
      );

      return savedSuggestions
        ? JSON.parse(savedSuggestions)
        : [];
    } catch (error) {
      console.error(
        "Unable to load community suggestions:",
        error
      );

      return [];
    }
  });

  /* =====================================================
     SAVE POLL
     ===================================================== */

  const savePoll = (updatedPoll) => {
    setPoll(updatedPoll);

    try {
      localStorage.setItem(
        "civicconnect_community_poll",
        JSON.stringify(updatedPoll)
      );
      window.dispatchEvent(
  new Event("civicconnect-community-updated")
);
    } catch (error) {
      console.error(
        "Unable to save community poll:",
        error
      );
    }
  };

  /* =====================================================
     VOTE
     ===================================================== */

  const handleVote = () => {
    if (!selectedOption || voted) return;

    const updatedPoll = {
      ...poll,

      options: poll.options.map((option) =>
        option.label === selectedOption
          ? {
              ...option,
              votes: option.votes + 1,
            }
          : option
      ),
    };

    savePoll(updatedPoll);

    setVoted(true);

    try {
      localStorage.setItem(
        "civicconnect_community_voted",
        "true"
      );
    } catch (error) {
      console.error(
        "Unable to save voting status:",
        error
      );
    }
  };

  /* =====================================================
     SUGGESTION
     ===================================================== */

  const handleSuggestionSubmit = (event) => {
    event.preventDefault();

    const cleanSuggestion = suggestion.trim();

    if (!cleanSuggestion) return;

    const newSuggestion = {
      id: Date.now(),
      text: cleanSuggestion,
      date: new Date().toISOString(),
    };

    const updatedSuggestions = [
      ...suggestions,
      newSuggestion,
    ];

    setSuggestions(updatedSuggestions);
    setSuggestion("");

    try {
      localStorage.setItem(
        "civicconnect_community_suggestions",
        JSON.stringify(updatedSuggestions)
      );
    } catch (error) {
      console.error(
        "Unable to save community suggestion:",
        error
      );
    }
  };

  /* =====================================================
     CALCULATIONS
     ===================================================== */

  const totalVotes = poll.options.reduce(
    (total, option) => total + option.votes,
    0
  );

  const totalInteractions =
    totalVotes + suggestions.length;

  return (
    <section
      className="community-voice-section"
      id="community"
    >
      <div className="community-voice-container">

        {/* =================================================
            HEADER
           ================================================= */}

        <div className="community-voice-header">

          <div>
            <span className="section-eyebrow">
              COMMUNITY VOICE
            </span>

            <h2>
              Civic Change
              <br />
              Starts With <em>Us.</em>
            </h2>

            <p>
              A neighbourhood becomes better when people
              do more than notice problems. Share your
              opinion, suggest solutions and help decide
              what deserves attention first.
            </p>
          </div>

          <div className="community-voice-stat">

            <Users size={21} />

            <strong>
              {totalInteractions}
            </strong>

            <span>
              Community interactions
            </span>

          </div>

        </div>

        {/* =================================================
            MAIN GRID
           ================================================= */}

        <div className="community-voice-grid">

          {/* =================================================
              COMMUNITY POLL
             ================================================= */}

          <div className="community-poll-card">

            <div className="community-card-top">

              <div className="community-card-icon">
                <ThumbsUp size={19} />
              </div>

              <span>
                01 / COMMUNITY POLL
              </span>

            </div>

            <h3>
              {poll.question}
            </h3>

            <div className="poll-options">

              {poll.options.map((option) => {

                const percentage =
                  totalVotes > 0
                    ? Math.round(
                        (option.votes / totalVotes) *
                          100
                      )
                    : 0;

                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`poll-option ${
                      selectedOption ===
                      option.label
                        ? "selected"
                        : ""
                    } ${
                      voted
                        ? "show-results"
                        : ""
                    }`}
                    onClick={() =>
                      !voted &&
                      setSelectedOption(
                        option.label
                      )
                    }
                  >

                    <div className="poll-option-main">

                      <span className="poll-radio">
                        {selectedOption ===
                          option.label && (
                          <span />
                        )}
                      </span>

                      <span className="poll-label">
                        {option.label}
                      </span>

                      {voted && (
                        <strong>
                          {percentage}%
                        </strong>
                      )}

                    </div>

                    {voted && (
                      <div className="poll-progress">
                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    )}

                  </button>
                );
              })}

            </div>

            {!voted ? (
              <button
                className="community-primary-button"
                type="button"
                onClick={handleVote}
                disabled={!selectedOption}
              >
                Cast My Vote
                <ThumbsUp size={16} />
              </button>
            ) : (
              <div className="vote-success">
                <CheckCircle2 size={17} />

                Thanks for participating in
                the community poll.
              </div>
            )}

          </div>

          {/* =================================================
              SUGGESTION CARD
             ================================================= */}

          <div className="community-suggestion-card">

            <div className="community-card-top">

              <div className="community-card-icon">
                <Lightbulb size={19} />
              </div>

              <span>
                02 / YOUR IDEA
              </span>

            </div>

            <h3>
              Have a solution?
              <br />
              <em>Share it.</em>
            </h3>

            <p>
              Sometimes the best civic solutions come
              from people who experience the
              neighbourhood every day.
            </p>

            <form
              onSubmit={
                handleSuggestionSubmit
              }
            >

              <textarea
                value={suggestion}
                onChange={(event) =>
                  setSuggestion(
                    event.target.value
                  )
                }
                placeholder="Example: We could place separate waste bins near the community park..."
                rows="5"
                maxLength={500}
              />

              <div className="community-form-footer">
                <span className="community-character-count">
                  {suggestion.length}/500
                </span>

                <button
                  className="community-primary-button"
                  type="submit"
                  disabled={
                    !suggestion.trim()
                  }
                >
                  Share Suggestion
                  <Send size={16} />
                </button>

              </div>

            </form>

          </div>

        </div>

        {/* =================================================
            COMMUNITY RESPONSES
           ================================================= */}

        <div className="community-responses">

          <div className="community-responses-heading">

            <div>

              <span className="section-eyebrow">
                COMMUNITY IDEAS
              </span>

              <h3>
                Voices From The Neighbourhood
              </h3>

            </div>

            <div className="community-response-count">

              <MessageCircle size={16} />

              {suggestions.length} suggestion
              {suggestions.length !== 1
                ? "s"
                : ""}

            </div>

          </div>

          {suggestions.length === 0 ? (

            <div className="community-empty">

              <MessageCircle size={20} />

              <div>

                <strong>
                  No suggestions yet.
                </strong>

                <span>
                  Be the first person to share
                  an idea for improving the
                  neighbourhood.
                </span>

              </div>

            </div>

          ) : (

            <div className="community-suggestion-list">

              {suggestions
                .slice()
                .reverse()
                .map((item) => (

                  <div
                    className="community-suggestion-item"
                    key={item.id}
                  >

                    <div className="community-suggestion-avatar">
                      <Lightbulb size={16} />
                    </div>

                    <p>
                      {item.text}
                    </p>

                  </div>

                ))}

            </div>

          )}

                </div>


        {/* =================================================
            FEEDBACK & RATING
           ================================================= */}

        <div className="community-feedback-section">

          <div className="community-feedback-heading">

            <div>
              <span className="section-eyebrow">
                FEEDBACK
              </span>

              <h3>
                How Was Your CivicConnect Experience?
              </h3>

              <p>
                Your feedback helps us improve the
                website and the issue reporting experience.
              </p>
            </div>

          </div>


          <div className="community-feedback-grid">

            <div className="community-feedback-card">

              <span>
                WEBSITE EXPERIENCE
              </span>

              <strong>
                How does the website feel to use?
              </strong>

              <div className="feedback-stars">

                {[1, 2, 3, 4, 5].map((star) => (

                  <button
                    key={star}
                    type="button"
                    className={
                      star <= websiteRating
                        ? "feedback-star active"
                        : "feedback-star"
                    }
                    onClick={() => {
  setWebsiteRating(star);

  localStorage.setItem(
    "civicconnect_website_rating",
    String(star)
  );

  window.dispatchEvent(
    new Event("civicconnect-community-updated")
  );
}}
                    aria-label={`Rate website ${star} out of 5`}
                  >
                    ★
                  </button>

                ))}

              </div>

            </div>


            <div className="community-feedback-card">

              <span>
                REPORTING EXPERIENCE
              </span>

              <strong>
                How easy was it to report an issue?
              </strong>

              <div className="feedback-stars">

                {[1, 2, 3, 4, 5].map((star) => (

                  <button
                    key={star}
                    type="button"
                    className={
                      star <= serviceRating
                        ? "feedback-star active"
                        : "feedback-star"
                    }
                    onClick={() => {
                      setServiceRating(star);

                      localStorage.setItem(
                        "civicconnect_service_rating",
                        String(star)
                      );
                    }}
                    aria-label={`Rate reporting experience ${star} out of 5`}
                  >
                    ★
                  </button>

                ))}

              </div>

            </div>

          </div>


          <div className="community-feedback-comment">

            <label>
              ADD A COMMENT
            </label>

            <textarea
              value={feedback}
              onChange={(event) =>
                setFeedback(event.target.value)
              }
              placeholder="Tell us what you liked or what we could improve..."
              rows="4"
              maxLength={500}
            />

            <div className="feedback-comment-footer">

              <span>
                {feedback.length}/500
              </span>

              <button
                type="button"
                className="community-primary-button"
                onClick={() => {
                  localStorage.setItem(
                    "civicconnect_feedback",
                    feedback.trim()
                  );
                  setFeedbackSubmitted(true);
                  window.dispatchEvent(
                    new Event("civicconnect-community-updated")
                  );
                }}
              >
                Submit Feedback
                <CheckCircle2 size={16} />
              </button>

            </div>

            {feedbackSubmitted && (
              <div className="community-feedback-success" role="status">
                <CheckCircle2 size={17} />
                <span>Thank you — your feedback has been saved.</span>
              </div>
            )}

          </div>

        </div>


      </div>
    </section>
  );
}
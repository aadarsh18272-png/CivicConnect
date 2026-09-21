import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  HardHat,
  Mail,
  LockKeyhole,
  LogIn,
  KeyRound,
  ArrowLeft,
  UserRound,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

function WorkerLogin({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessages();
  };

  // -----------------------------
  // WORKER LOGIN
  // -----------------------------
  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      if (onLogin) {
        onLogin(userCredential.user);
      }
    } catch (error) {
      console.error("Worker login error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(
          "Unable to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // WORKER SIGN UP
  // -----------------------------
  const handleSignUp = async (event) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const worker = userCredential.user;

      await setDoc(
        doc(db, "workers", worker.uid),
        {
          uid: worker.uid,
          name: name.trim(),
          email: worker.email,
          role: "worker",
          status: "active",
          createdAt: new Date().toISOString(),
        }
      );

      if (onLogin) {
        onLogin(worker);
      }
    } catch (error) {
      console.error("Worker signup error:", error);

      if (
        error.code === "auth/email-already-in-use"
      ) {
        setError(
          "An account already exists with this email."
        );
      } else if (
        error.code === "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        error.code === "auth/weak-password"
      ) {
        setError(
          "Password is too weak. Use at least 6 characters."
        );
      } else if (
        error.code === "permission-denied"
      ) {
        setError(
          "Account created, but the worker profile could not be saved. Check Firestore permissions."
        );
      } else {
        setError(
          "Unable to create the worker account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // FORGOT PASSWORD
  // -----------------------------
  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError(
        "Please enter your worker email address."
      );
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      setMessage(
        "Password reset email sent. Please check your inbox."
      );
    } catch (error) {
      console.error(
        "Worker password reset error:",
        error
      );

      if (error.code === "auth/invalid-email") {
        setError(
          "Please enter a valid email address."
        );
      } else {
        setError(
          "Unable to send the reset email. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    height: "52px",
    border: "1px solid #dce3dc",
    borderRadius: "14px",
    padding: "0 46px 0 46px",
    fontSize: "15px",
    outline: "none",
    background: "#fbfcfa",
    color: "#18201b",
    transition: "all 0.2s ease",
  };

  const fieldIconStyle = {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64736a",
    pointerEvents: "none",
  };

  const eyeButtonStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#64736a",
    cursor: "pointer",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <section
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "70px 20px",
        background:
          "linear-gradient(135deg, #f4f7f2 0%, #eef3ed 55%, #f8faf7 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          background: "#ffffff",
          border: "1px solid #e1e7e1",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow:
            "0 24px 70px rgba(25, 45, 32, 0.12)",
        }}
      >
        {/* LEFT BRAND PANEL */}
        <div
          style={{
            padding: "48px 42px",
            background:
              "linear-gradient(145deg, #183b2a 0%, #24543a 100%)",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "560px",
          }}
        >
          <div>
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "rgba(255,255,255,0.12)",
                border:
                  "1px solid rgba(255,255,255,0.18)",
                marginBottom: "28px",
              }}
            >
              <HardHat size={26} />
            </div>

            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.16em",
                opacity: 0.72,
              }}
            >
              CIVICCONNECT FIELD TEAM
            </span>

            <h1
              style={{
                fontSize: "42px",
                lineHeight: "1.05",
                margin: "16px 0",
                letterSpacing: "-0.04em",
              }}
            >
              Work that
              <br />
              improves
              <br />
              the neighbourhood.
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.7,
                maxWidth: "360px",
                margin: 0,
              }}
            >
              Field workers document civic action,
              capture evidence and help turn reported
              problems into measurable improvements.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "40px",
            }}
          >
            {[
              "View assigned civic work",
              "Upload field evidence",
              "Record action and outcome",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                <CheckCircle2 size={16} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div
          style={{
            padding: "48px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* HEADER */}
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#315b42",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                marginBottom: "12px",
              }}
            >
              <ShieldCheck size={15} />
              SECURE FIELD ACCESS
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "32px",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#18201b",
              }}
            >
              {mode === "login"
                ? "Worker Login"
                : mode === "signup"
                ? "Create Worker Account"
                : "Reset Password"}
            </h2>

            <p
              style={{
                margin: "10px 0 0",
                color: "#69766e",
                lineHeight: 1.6,
                fontSize: "14px",
              }}
            >
              {mode === "login"
                ? "Sign in to access your assigned civic work."
                : mode === "signup"
                ? "Create your account for CivicConnect field operations."
                : "We'll send a secure password reset link to your email."}
            </p>
          </div>

          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              {/* EMAIL */}
              <label
                style={{
                  display: "block",
                  marginBottom: "18px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Worker Email

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <Mail
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="worker@example.com"
                    autoComplete="email"
                    style={inputStyle}
                  />
                </div>
              </label>

              {/* PASSWORD */}
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Password

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <LockKeyhole
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={inputStyle}
                  />

                  <button
                    type="button"
                    style={eyeButtonStyle}
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="button"
                onClick={() =>
                  switchMode("forgot")
                }
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "6px 0",
                  color: "#315b42",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </button>

              {error && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fff1ef",
                    color: "#a33d32",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "54px",
                  marginTop: "22px",
                  border: "none",
                  borderRadius: "14px",
                  background:
                    loading
                      ? "#789182"
                      : "#183b2a",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                }}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}

                {!loading && <LogIn size={18} />}
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "26px 0",
                  color: "#a0aaa3",
                  fontSize: "11px",
                }}
              >
                <span
                  style={{
                    height: "1px",
                    background: "#e4e9e5",
                    flex: 1,
                  }}
                />
                OR
                <span
                  style={{
                    height: "1px",
                    background: "#e4e9e5",
                    flex: 1,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  switchMode("signup")
                }
                style={{
                  width: "100%",
                  height: "52px",
                  border: "1px solid #cfd9d1",
                  borderRadius: "14px",
                  background: "#ffffff",
                  color: "#234331",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Create Worker Account
              </button>
            </form>
          )}

          {/* SIGN UP */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp}>
              <label
                style={{
                  display: "block",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Full Name

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <UserRound
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    style={inputStyle}
                  />
                </div>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Worker Email

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <Mail
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="worker@example.com"
                    autoComplete="email"
                    style={inputStyle}
                  />
                </div>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Password

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <LockKeyhole
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    style={inputStyle}
                  />

                  <button
                    type="button"
                    style={eyeButtonStyle}
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Confirm Password

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <LockKeyhole
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    style={inputStyle}
                  />

                  <button
                    type="button"
                    style={eyeButtonStyle}
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fff1ef",
                    color: "#a33d32",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "54px",
                  marginTop: "20px",
                  border: "none",
                  borderRadius: "14px",
                  background:
                    loading
                      ? "#789182"
                      : "#183b2a",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                }}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Worker Account"}

                {!loading && (
                  <CheckCircle2 size={18} />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode("login")
                }
                style={{
                  width: "100%",
                  height: "48px",
                  marginTop: "10px",
                  border: "none",
                  background: "transparent",
                  color: "#315b42",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <ArrowLeft size={16} />
                Back to Worker Login
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword}>
              <label
                style={{
                  display: "block",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#273229",
                }}
              >
                Worker Email

                <div
                  style={{
                    position: "relative",
                    marginTop: "8px",
                  }}
                >
                  <Mail
                    size={18}
                    style={fieldIconStyle}
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="worker@example.com"
                    autoComplete="email"
                    style={inputStyle}
                  />
                </div>
              </label>

              {error && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fff1ef",
                    color: "#a33d32",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#edf7ef",
                    color: "#2f7045",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <CheckCircle2
                    size={17}
                    style={{
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  />
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "54px",
                  marginTop: "20px",
                  border: "none",
                  borderRadius: "14px",
                  background:
                    loading
                      ? "#789182"
                      : "#183b2a",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "9px",
                }}
              >
                {loading
                  ? "Sending..."
                  : "Send Reset Link"}

                {!loading && (
                  <Mail size={18} />
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  switchMode("login")
                }
                style={{
                  width: "100%",
                  height: "48px",
                  marginTop: "10px",
                  border: "none",
                  background: "transparent",
                  color: "#315b42",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <ArrowLeft size={16} />
                Back to Worker Login
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default WorkerLogin;
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LockKeyhole, Mail, LogIn } from "lucide-react";
import { auth } from "../firebase";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (onLogin) {
        onLogin(userCredential.user);
      }
    } catch (error) {
      console.error("Admin login error:", error);

      setError("Invalid admin email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login-section">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <LockKeyhole size={24} />
        </div>

        <span className="admin-login-eyebrow">
          CIVICCONNECT ADMIN
        </span>

        <h1>Admin Login</h1>

        <p>
          Sign in to manage civic reports and community updates.
        </p>

        <form onSubmit={handleLogin}>
          <label>
            Email
            <div className="admin-input-wrap">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Admin email"
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            Password
            <div className="admin-input-wrap">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
              />
            </div>
          </label>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <LogIn size={18} />}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminLogin;
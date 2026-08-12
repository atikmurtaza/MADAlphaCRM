"use client";

import { useState } from "react";
import { signup } from "../actions";
import Link from "next/link";

export default function SignupPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await signup(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(15, 157, 88, 0.1)', color: 'var(--accent-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', marginBottom: '1rem' }}>
            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Check your email</h2>
          <p className="text-secondary" style={{ lineHeight: 1.5 }}>
            We've sent a verification link to your email address. Please verify your email before logging in.
          </p>
          <Link href="/auth/login" className="btn secondary" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="brand-mark" style={{ width: '56px', height: '56px', fontSize: '1.5rem', borderRadius: '16px' }}>M</div>
          </div>
          <div className="page-eyebrow" style={{ justifyContent: 'center' }}>MAD Alpha</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Create Account</h1>
          <p className="text-secondary">Join the CRM platform</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(229, 72, 77, 0.1)', border: '1px solid rgba(229, 72, 77, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name</label>
            <input
              type="text"
              name="name"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              required
            />
          </div>

          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
            <input
              type="email"
              name="email"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              required
            />
          </div>

          <div>
            <label className="text-secondary" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password</label>
            <input
              type="password"
              name="password"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn primary"
            style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-secondary" style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

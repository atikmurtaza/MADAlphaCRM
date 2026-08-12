"use client";

import { useState } from "react";
import { login } from "../actions";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await login(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="brand-mark" style={{ width: '56px', height: '56px', fontSize: '1.5rem', borderRadius: '16px' }}>M</div>
          </div>
          <div className="page-eyebrow" style={{ justifyContent: 'center' }}>MAD Alpha</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome Back</h1>
          <p className="text-secondary">Sign in to your CRM account</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(229, 72, 77, 0.1)', border: '1px solid rgba(229, 72, 77, 0.2)', borderRadius: 'var(--radius-md)', color: 'var(--accent-danger)', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn primary"
            style={{ width: '100%', padding: '0.85rem', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-secondary" style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem' }}>
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-primary" style={{ textDecoration: 'none', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

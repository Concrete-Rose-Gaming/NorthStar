import React, { useState } from 'react';
import { signIn, signUp, AuthUser } from '../../supabase/auth';
import './Login.css';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
  onSkip: () => void;
}

export function Login({ onLogin, onSkip }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { user, error: signUpError } = await signUp(email, password, name);
        if (signUpError) {
          setError(signUpError.message);
        } else if (user) {
          onLogin(user);
        }
      } else {
        const { user, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else if (user) {
          onLogin(user);
        } else {
          setError('Invalid email or password');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        <p className="login-subtitle">
          {isSignUp 
            ? 'Create an account to save and manage your decks' 
            : 'Sign in to access your saved decks'}
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required={isSignUp}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="login-switch">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="login-skip">
          <button type="button" className="link-button" onClick={onSkip}>
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
}


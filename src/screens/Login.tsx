/** Sign in, or create an account. Choosing a family comes next — see FamilySetup. */

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Button } from '../components/ui';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setIsBusy(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="pad stack auth">
      <p className="t-label header-kicker">Family meal planner</p>
      <h1 className="t-title">{isSignUp ? 'Create an account' : 'Sign in'}</h1>

      <input
        className="input"
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
      />
      <input
        className="input"
        type="password"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        aria-label="Password"
      />

      {error && <p className="t-sec error">{error}</p>}

      <Button
        label={isBusy ? 'Just a moment…' : isSignUp ? 'Create account' : 'Sign in'}
        variant="accent"
        onClick={submit}
        disabled={isBusy}
      />

      <button
        className="link"
        onClick={() => {
          setIsSignUp((v) => !v);
          setError('');
        }}
      >
        {isSignUp
          ? 'Already have an account? Sign in'
          : "Don't have an account? Create one"}
      </button>
    </div>
  );
}

/** Firebase error codes, in words a person can act on. */
function messageFor(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'That email and password do not match.';
  }
  if (code.includes('email-already-in-use')) {
    return 'That email already has an account. Sign in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Passwords need to be at least six characters.';
  }
  if (code.includes('invalid-email')) return 'That does not look like an email address.';
  if (code.includes('network')) return 'No connection. Check your network and try again.';

  return 'Something went wrong. Please try again.';
}

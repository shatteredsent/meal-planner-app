/**
 * Shown to a signed-in user who isn't in a family yet — either just after
 * creating an account, or if the family step failed the first time.
 *
 * Deliberately separate from sign-up so account creation and family creation
 * can't half-succeed and leave someone stuck.
 */

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { createFamily, joinFamily } from '../hooks/useSession';
import { Button } from '../components/ui';

type Mode = 'new' | 'join';

export default function FamilySetup({ uid, email }: { uid: string; email: string }) {
  const [mode, setMode] = useState<Mode>('new');
  const [name, setName] = useState(() => {
    const handle = email.split('@')[0];
    return handle ? `${handle}'s Family` : 'My Family';
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function submit() {
    setIsBusy(true);
    setError('');
    try {
      if (mode === 'new') await createFamily(uid, name);
      else await joinFamily(uid, code);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="pad stack auth">
      <p className="t-label header-kicker">One more thing</p>
      <h1 className="t-title">Your family</h1>

      <div className="seg">
        <button
          className={mode === 'new' ? 'is-on' : undefined}
          onClick={() => setMode('new')}
          aria-pressed={mode === 'new'}
        >
          Start one
        </button>
        <button
          className={mode === 'join' ? 'is-on' : undefined}
          onClick={() => setMode('join')}
          aria-pressed={mode === 'join'}
        >
          Join one
        </button>
      </div>

      {mode === 'new' ? (
        <>
          <input
            className="input"
            placeholder="Family name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Family name"
          />
          <p className="t-sec-sm">
            You'll get a code to share with whoever plans meals with you.
          </p>
        </>
      ) : (
        <>
          <input
            className="input"
            placeholder="Family code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoCapitalize="characters"
            aria-label="Family code"
          />
          <p className="t-sec-sm">
            The six-character code from your family's settings screen.
          </p>
        </>
      )}

      {error && <p className="t-sec error">{error}</p>}

      <Button
        label={isBusy ? 'Just a moment…' : mode === 'new' ? 'Start the family' : 'Join'}
        variant="accent"
        onClick={submit}
        disabled={isBusy || (mode === 'join' && !code.trim())}
      />

      <button className="link" onClick={() => void signOut(auth)}>
        Sign out
      </button>
    </div>
  );
}

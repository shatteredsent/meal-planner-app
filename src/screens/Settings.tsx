/**
 * Family and settings.
 *
 * Sharing a family is just showing its code — the family's document id doubles
 * as the code, so there is no invite to generate, expire, or clean up.
 */

import { useState } from 'react';
import { signOut, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { useFamily } from '../hooks/useSession';
import { Button, Header } from '../components/ui';

const APP_VERSION = '2.0.0';

interface Props {
  user: User | null;
  familyId: string;
  onBack: () => void;
}

export default function Settings({ user, familyId, onBack }: Props) {
  const { family, rename } = useFamily(familyId);
  const [draftName, setDraftName] = useState<string | null>(null);

  async function saveName() {
    if (draftName === null) return;
    const name = draftName.trim();
    if (!name) return;

    setDraftName(null);
    await rename(name);
  }

  function handleSignOut() {
    if (window.confirm('Sign out?')) void signOut(auth);
  }

  return (
    <>
      <Header kicker={family?.name ?? 'My family'} title="Family & settings" onBack={onBack} />

      <div className="scroll">
        <div className="empty">
          <p className="t-label">Signed in as</p>
          <p className="t-meal">{family?.name ?? 'My Family'}</p>
          <p className="t-sec">{user?.email}</p>
        </div>

        {draftName === null ? (
          <button
            className="settings-row"
            onClick={() => setDraftName(family?.name ?? '')}
          >
            <span className="t-row">Family name</span>
            <span className="t-sec">{family?.name ?? '—'}</span>
          </button>
        ) : (
          <div className="pad stack">
            <input
              className="input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              placeholder="Family name"
              aria-label="Family name"
              autoFocus
            />
            <Button label="Save" variant="accent" onClick={saveName} />
            <Button label="Cancel" variant="quiet" onClick={() => setDraftName(null)} />
          </div>
        )}

        <div className="settings-row">
          <span className="t-row">Members</span>
          <span className="t-sec">{family?.members.length ?? 1}</span>
        </div>

        <div className="empty rule-top">
          <p className="t-label">Family code</p>
          <p className="code">{familyId}</p>
          <p className="t-sec">
            Share this with your family. They create an account, choose “Join a
            family”, and enter it.
          </p>
        </div>

        <div className="settings-row">
          <span className="t-row">Version</span>
          <span className="t-sec">{APP_VERSION}</span>
        </div>

        <div className="pad">
          <Button label="Sign out" variant="quiet" onClick={handleSignOut} />
        </div>
      </div>
    </>
  );
}

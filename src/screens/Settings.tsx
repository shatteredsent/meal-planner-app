/**
 * Family and settings.
 *
 * Two codes live here and they do different jobs. The family code adds a person
 * to this household — same plan, same shopping list. The cookbook code puts
 * another *family* on this recipe library, so they cook from the same recipes
 * while keeping their own week and their own list.
 */

import { useEffect, useState } from 'react';
import { signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { joinCookbook, renameCookbook, useFamily } from '../hooks/useSession';
import type { Cookbook } from '../types';
import { Button, GroupHead, Header } from '../components/ui';

const APP_VERSION = '2.0.0';

interface Props {
  user: User | null;
  familyId: string;
  cookbookId: string;
  onBack: () => void;
}

export default function Settings({ user, familyId, cookbookId, onBack }: Props) {
  const { family, rename } = useFamily(familyId);
  const [draftName, setDraftName] = useState<string | null>(null);

  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [draftCookbookName, setDraftCookbookName] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!cookbookId) return;
    return onSnapshot(doc(db, 'cookbooks', cookbookId), (snap) => {
      const data = snap.data();
      setCookbook(data ? { name: data.name ?? '', families: data.families ?? [] } : null);
    });
  }, [cookbookId]);

  async function saveName() {
    if (draftName === null || !draftName.trim()) return;
    const next = draftName.trim();
    setDraftName(null);
    await rename(next);
  }

  async function saveCookbookName() {
    if (draftCookbookName === null || !draftCookbookName.trim()) return;
    const next = draftCookbookName.trim();
    setDraftCookbookName(null);
    await renameCookbook(cookbookId, next);
  }

  async function join() {
    // Joining another cookbook swaps which library this family cooks from, and
    // the recipes in the current one stop being visible. Worth saying out loud.
    const ok = window.confirm(
      'Join another cookbook?\n\nYour family will cook from that library instead. ' +
        "The recipes in your current cookbook stay where they are, but you won't " +
        'see them here any more.'
    );
    if (!ok) return;

    setIsJoining(true);
    setJoinError('');
    try {
      await joinCookbook(familyId, joinCode);
      setJoinCode('');
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsJoining(false);
    }
  }

  const shareCount = cookbook?.families.length ?? 1;

  return (
    <>
      <Header kicker={family?.name ?? 'My family'} title="Family & settings" onBack={onBack} />

      <div className="scroll">
        <div className="empty">
          <p className="t-label">Signed in as</p>
          <p className="t-meal">{family?.name ?? 'My Family'}</p>
          <p className="t-sec">{user?.email}</p>
        </div>

        <GroupHead label="Your household" tone="dairy" />
        <div className="aisle-body">
          {draftName === null ? (
            <button className="settings-row" onClick={() => setDraftName(family?.name ?? '')}>
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
                aria-label="Family name"
                autoFocus
              />
              <Button label="Save" variant="accent" onClick={saveName} />
              <Button label="Cancel" variant="quiet" onClick={() => setDraftName(null)} />
            </div>
          )}

          <div className="settings-row">
            <span className="t-row">People in this family</span>
            <span className="t-sec">{family?.members.length ?? 1}</span>
          </div>
        </div>

        <div className="empty">
          <p className="t-label">Family code</p>
          <p className="code">{familyId}</p>
          <p className="t-sec">
            Adds a person to this household — same plan, same shopping list.
          </p>
        </div>

        <GroupHead label="Shared cookbook" tone="pantry" />
        <div className="aisle-body">
          {draftCookbookName === null ? (
            <button
              className="settings-row"
              onClick={() => setDraftCookbookName(cookbook?.name ?? '')}
              disabled={!cookbookId}
            >
              <span className="t-row">Cookbook name</span>
              <span className="t-sec">{cookbook?.name ?? '—'}</span>
            </button>
          ) : (
            <div className="pad stack">
              <input
                className="input"
                value={draftCookbookName}
                onChange={(e) => setDraftCookbookName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCookbookName()}
                aria-label="Cookbook name"
                autoFocus
              />
              <Button label="Save" variant="accent" onClick={saveCookbookName} />
              <Button
                label="Cancel"
                variant="quiet"
                onClick={() => setDraftCookbookName(null)}
              />
            </div>
          )}

          <div className="settings-row">
            <span className="t-row">Families sharing it</span>
            <span className="t-sec">
              {shareCount} {shareCount === 1 ? 'family' : 'families'}
            </span>
          </div>
        </div>

        <div className="empty">
          <p className="t-label">Cookbook code</p>
          <p className="code">{cookbookId || '—'}</p>
          <p className="t-sec">
            Give this to another family and they'll cook from the same recipes —
            adding and editing alongside you. Their meal plan and shopping list
            stay their own.
          </p>
        </div>

        <div className="pad stack">
          <p className="t-label">Join a different cookbook</p>
          <input
            className="input"
            placeholder="Cookbook code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            autoCapitalize="characters"
            aria-label="Cookbook code to join"
          />
          {joinError && <p className="t-sec error">{joinError}</p>}
          <Button
            label={isJoining ? 'Just a moment…' : 'Join cookbook'}
            onClick={join}
            disabled={isJoining || !joinCode.trim()}
          />
        </div>

        <GroupHead label="About" tone="other" />
        <div className="aisle-body">
          <div className="settings-row">
            <span className="t-row">Version</span>
            <span className="t-sec">{APP_VERSION}</span>
          </div>

          {/* Which bundle this device is actually running. If it doesn't match
              what was last deployed, the browser is serving a cached copy. */}
          <div className="settings-row">
            <span className="t-row">Build</span>
            <span className="t-meta">{__BUILD__}</span>
          </div>
        </div>

        <div className="pad stack">
          <Button
            label="Reload the app"
            variant="quiet"
            onClick={() => window.location.reload()}
          />
          <Button
            label="Sign out"
            variant="quiet"
            onClick={() => {
              if (window.confirm('Sign out?')) void signOut(auth);
            }}
          />
        </div>
      </div>
    </>
  );
}

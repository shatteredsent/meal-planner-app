// Single import surface for Firebase across the app.
// `auth` resolves per platform — see ./auth.ts (web) and ./auth.native.ts.
export { app, db, functions } from './firebaseApp';
export { auth } from './auth';

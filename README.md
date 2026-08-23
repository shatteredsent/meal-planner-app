# Family Meal Planner

Plan the week, shop it, review it. A small React web app on Firebase — open the
URL on your phone and add it to your home screen.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

## Deploying

```bash
npm run deploy     # typecheck, build, then push to Firebase Hosting
```

That runs `vite build` into `dist/` and `firebase deploy`, which publishes both
the site and `firestore.rules`. The live URL is
`https://family-meal-planner-b1421.web.app`.

You need the Firebase CLI once:

```bash
npm i -g firebase-tools
firebase login
```

Nothing here needs the Blaze plan — there are no Cloud Functions.

## Testing

```bash
npm test           # vitest
```

The tests cover the parts where being wrong is expensive and invisible: summing
a week into a shopping list, week arithmetic, and ingredient parsing.

`firestore.rules` is hand-written and is the only thing protecting the data, so
it has its own end-to-end test against the *deployed* rules — real ID tokens over
the Firestore REST API, including every way the join clause could be abused:

```bash
npm i --no-save firebase-admin
node scripts/rules-test.cjs
```

It creates a throwaway family and throwaway accounts, asserts 23 allow/deny
outcomes, and deletes everything it made. It never touches real data. Run it
after any change to `firestore.rules`.

## How it fits together

```
index.html          PWA tags, Google Fonts, root div
src/
  main.tsx          mounts App
  App.tsx           auth gate, three tabs, two pushed screens
  styles.css        the entire design system
  types.ts          every stored and rendered shape
  firebase.ts       app, auth, db
  hooks/
    useSession.ts   who is signed in, and their family
    useWeek.ts      this week's plan + list state (one document)
    useRecipes.ts   the recipe library
  lib/
    shoppingList.ts derives the list from the plan
    week.ts         Monday-first week arithmetic
    quantity.ts     '1½ lb', not '1.5 lb'
    categorize.ts   ingredient name -> grocery aisle
    parseIngredient.ts  typed text -> quantified ingredient
  screens/          Plan, List, Week, Recipes, Settings, Login, FamilySetup
  components/       ui primitives, MealPicker, RecipeDetail, RecipeForm
```

### Firestore layout

```
users/{uid}                        { familyId }
families/{CODE}                    { name, members: uid[] }
families/{CODE}/recipes/{id}       Recipe
families/{CODE}/weeks/{weekId}     Week   <- one document per week
```

Two things are worth knowing.

**The family document id is the join code.** Sharing a family means reading a
six-character code off the settings screen and typing it in. There is no invite
collection, no expiry, and no server: `firestore.rules` lets a non-member make
exactly one change to a family — appending their own uid to `members`.

**The shopping list is not stored.** It is derived from `week.meals` on every
render, summed by ingredient name and unit. Only what the plan cannot know is
persisted on the week document — which lines are ticked, which you already have
at home, and what you typed in by hand. That is why there is no reconciler and
nothing to keep in sync.

`weekId` is the date of that week's Monday (`2026-08-17`), so every day in a week
agrees on it, it sorts chronologically as a string, and it never disagrees with
itself across a year boundary.

## Migrating from the old app

**This has already been run** — Jake's Family is `JPNPCQ` with 40 recipes, and
both members' `users/{uid}` documents point at it. What follows is for reference.

The previous version stored flat `recipes` / `mealPlans` / `shoppingItems`
collections scoped by a `familyId` field. To carry recipes across:

```bash
npm i --no-save firebase-admin
node scripts/migrate.cjs path/to/service-account.json           # dry run
node scripts/migrate.cjs path/to/service-account.json --commit
```

It prints the new family code for each family it moves, skips families whose
members no longer have auth accounts, and reports any recipes it had to leave
behind rather than dropping them silently. Meal plans and shopping lists are
deliberately not migrated — they are week-scoped and rebuild themselves. The
script is idempotent and leaves the old documents in place; delete them from the
Firebase console once you're happy, then delete the script.

### Retired along the way

- The `joinFamily` Cloud Function, and the `invites` collection it served.
  Replaced by the family code plus a rule in `firestore.rules`.
- The Alexa skill. `alexaSkillHandler` and `exchangeAlexaToken` are deleted,
  `alexaUserIdMap` is emptied, and the Amazon OAuth credentials it kept on the
  family document are gone. Its client half had already been removed by the
  redesign commit `c63db28`; the whole thing is recoverable from `4fb8bde` if it
  is ever wanted back, though it would need porting to
  `families/{code}/weeks/{weekId}`.

### Still outstanding

- 39 recipes belonging to `test@yourdomain.com` were not migrated — that account
  has no family document. They are seed data from the old `seed-recipes.js`.
- The old `families` / `recipes` / `mealPlans` / `invites` documents are still
  in Firestore, unreachable from the client. Delete them from the console once
  you are happy with the new app.

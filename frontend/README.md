# Frontend

React single-page application consuming the REST API in `../backend`.

## Stack

| Concern | Choice |
|---|---|
| Build tool | Vite 8 |
| Language | TypeScript 6 |
| UI | React 19 + Ant Design 5 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| HTTP | Axios |
| Dates | Day.js |

Ant Design is pinned to **v5**, not v6. v6 renamed a number of props (`bordered` → `variant`,
`popupClassName` → `classNames.popup.root`), changed `Form.List` behaviour and reworked the DOM
structure, while almost every tutorial and community answer still targets v5. `antd` and
`@ant-design/icons` must always share the same major version.

React 19 needs `@ant-design/v5-patch-for-react-19`, imported first in `src/main.tsx`.

## Running

The backend must be running on `http://localhost:8080` first.

```powershell
npm install
npm run dev
```

The app is served at `http://localhost:5173`, which the backend already allows through
`app.cors.allowed-origins`. Point it elsewhere with `VITE_API_BASE_URL` in `.env.development`,
and remember to add that origin to the backend's `CORS_ALLOWED_ORIGINS`.

Sign in with any demo account from the root `README.md` (password `Demo@12345`).

```powershell
npm run build   # tsc -b && vite build
npm run test    # vitest run
npm run lint
```

## Structure

```text
src/
├── api/          axios instance, interceptors, endpoint wrappers
├── auth/         token storage, AuthContext, ProtectedRoute
├── layouts/      AppLayout with role-based navigation
├── lib/          helpers bridging backend conventions and Ant Design
├── pages/        screens
├── types/api.ts  hand-written types for the endpoints used so far
├── router.tsx
└── main.tsx      ConfigProvider, App, QueryClient, AuthProvider, Router
```

## How the pieces fit

**Authentication.** `POST /auth/login` returns tokens only, no role, so `AuthContext` follows it
with `GET /auth/me` to learn who is signed in. Tokens live in `localStorage`; the identity does
not, and is re-fetched on every page load. The frontend never decodes the JWT.

**Token refresh.** `src/api/client.ts` retries a `401` once after refreshing. Concurrent `401`s
share a single in-flight refresh call (`refreshPromise`), because the backend rotates and revokes
the previous refresh token — parallel refreshes would make all but the first fail. When the
refresh itself fails the session is cleared and `AuthContext` drops the user.

**Errors.** Every backend failure, business or technical, uses the same `ApiErrorResponse` shape,
so `src/lib/apiError.ts` is the single parser. `src/lib/formErrors.ts` maps the `fieldErrors` map
onto Form fields — the keys match the DTO field names, which match `Form.Item` `name`.

**Pagination.** The backend page index is 0-based (Spring), Ant Design's `current` is 1-based.
`src/lib/pagination.ts` converts in both directions so no screen repeats the off-by-one. The
backend caps `size` at 100.

**Dates and times.** The API uses `yyyy-MM-dd` for `LocalDate` and `HH:mm:ss` for `LocalTime`,
while Ant Design pickers work with Day.js objects. `src/lib/datetime.ts` holds the conversions.

**Booking uses slots, not a TimePicker.** `GET /doctors/{id}/available-slots` returns fixed
30-minute slots. The booking screen must present those as selectable options; a free-form
TimePicker would let a user pick a time the backend rejects.

## Generating API types

`src/types/api.ts` is written by hand and only covers the endpoints used so far. For the full
contract, generate from the live OpenAPI document with the backend running:

```powershell
npm run gen:api-types
```

This runs `openapi-typescript` through `npx` rather than as a dependency, because it currently
requires TypeScript 5 and this project uses TypeScript 6.

## Status

Done and verified end to end:

- Login, register, session restore across a page reload, role-based navigation, logout.
- Patient journey: doctor list with filters and pagination, doctor detail with the weekly schedule,
  booking, own appointment list with filters and sorting, cancellation, medical history,
  prescriptions, and the profile form.
- Receptionist journey: clinic-wide appointment list with date, doctor and status filters,
  confirmation, cancellation without the 2-hour deadline, and booking on behalf of an existing
  patient.
- Doctor journey: own appointment list, an examination page that records the diagnosis and then
  the prescription, a patient history page, and a profile page showing the weekly schedule.

- Admin journey: staff management with role and status filters, creating doctors and
  receptionists, locking and unlocking accounts, and managing each doctor's weekly schedule.

All four MVP roles are covered. Menus only list routes that exist, so no entry can reach a 404.

## Tests

`npm run test` runs 39 Vitest tests over the pieces where a mistake is easy to make and hard to
notice by hand:

- `src/api/client.ts` — the token refresh interceptor. The single-flight test is the important
  one: the backend rotates and revokes the previous refresh token, so concurrent 401s must share
  one refresh or every request but the first is logged out. Removing the `??=` that guards it
  makes that test fail with three refresh calls instead of one.
- `src/lib/pagination.ts` — the 0-based to 1-based conversion, in both directions and as a round
  trip.
- `src/lib/formErrors.ts` — `fieldErrors` landing on the matching form fields.
- `src/lib/apiError.ts` — parsing the backend error shape, and the fallback when the server cannot
  be reached at all.
- `src/auth/ProtectedRoute.tsx` — role gating, including that it waits while the stored session is
  being restored rather than bouncing to the login page.

The screens themselves are not covered; they are mostly Ant Design components wired to the API
layer that is tested here.

The examine button appears only on `CONFIRMED` appointments whose start time has passed, which is
exactly what the backend requires before a Medical Record can be created. Creating that record also
completes the appointment, in one transaction, and cannot be undone.

Booking on behalf only finds patients who already have an account, through
`GET /api/v1/receptionist/patients`. Registering a walk-in patient is out of scope, because
`patients.user_id` is `NOT NULL` and every Patient must therefore be linked to a User.

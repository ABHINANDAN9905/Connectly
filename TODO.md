## Task: Fix backend API errors for auth + users

### Planned steps
- [ ] Step 1: Mount `auth.route.js` under `/api/auth` in `Backend/src/server.js` to fix `/api/auth/me` and `/api/auth/logout` 404s.
- [ ] Step 2: Restart backend + frontend and verify auth endpoints succeed.
- [ ] Step 3: Diagnose remaining `/api/users*` 500s by inspecting `Backend/src/Controller/user.controller.js` and relevant middleware/models.
- [ ] Step 4: Add/adjust error handling or fix controller logic as needed; re-test.


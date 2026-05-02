---
Task ID: 1
Agent: Main Agent
Task: Add registration page, Google OAuth, seed file, remove fake content, rebuild theme system, fix issues

Work Log:
- Installed bcryptjs for password hashing
- Updated Prisma schema: added `emailVerified`, `provider` fields to User model; made `password` optional (for OAuth users)
- Rebuilt `/src/lib/auth.ts`: Added GoogleProvider, bcrypt password verification, Google auto-create user flow, fixed signIn page path to `/auth/login`
- Created `/src/app/api/auth/register/route.ts`: Registration API with validation, bcrypt hashing, role selection
- Created `/src/app/auth/register/page.tsx`: Full registration form with name, email, password, confirm password, role selector, Google sign-in button
- Updated `/src/app/auth/login/page.tsx`: Removed demo accounts collapsible, added Google sign-in button, added registration link
- Created `/src/app/api/users/[id]/route.ts`: User profile update API with bcrypt password change support
- Fixed `/src/app/(dashboard)/settings/page.tsx`: Password change now actually updates DB via the new users API
- Rebuilt `/src/app/api/seed/route.ts`: Only 3 accounts (admin, moderator, professor) with bcrypt hashed passwords, removed all fake data
- Rebuilt `/src/app/api/theme/route.ts`: 8 theme presets with light+dark color sets, role-based access (admin+moderator), site-wide apply action
- Created `/src/components/themes/theme-manager.tsx`: Theme gallery with preview, light/dark mode toggle, apply-to-all for admin/moderator
- Updated admin section: ThemeManager component integrated, theme tab visible to both admin AND moderator
- Updated `/src/app/page.tsx`: Dynamic stats from API, registration button added to CTA sections
- Renamed `middleware.ts` to `proxy.ts` for Next.js 16 compatibility, exported as `proxy` default function
- Added `/auth/register` to public routes in proxy
- Updated users API and role API to allow moderator access
- Added `.env` NEXTAUTH_URL and NEXTAUTH_SECRET
- Ran `bun run lint` - all clean

Stage Summary:
- Registration system: Complete with form, API, Google OAuth support
- Seed: 3 accounts only (admin/admin123, mod/mod123, prof/prof123), no fake data
- Theme system: 8 presets with light+dark modes, site-wide admin/moderator control
- Password: bcrypt hashing on registration and seed, actual DB update on change
- Auth: Google OAuth provider added (needs GOOGLE_CLIENT_ID/SECRET env vars for production)
- All demo accounts and fake content removed
- Proxy (middleware) works correctly for Next.js 16

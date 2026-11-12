# Require account creation with a @gsb.columbia.edu email

## What students will see
The student sign-in page gets two tabs:
- **Create account**: name and @gsb.columbia.edu email. Students get a confirmation link by email, and the account is active once they click it.
- **Sign in**: works only for existing accounts. If someone enters an email that has no account yet, they see "No account found. Create an account first." and the page switches to the Create account tab.

Both tabs still turn away any email not ending in @gsb.columbia.edu. Sign-in stays passwordless (email link), which matches your earlier choice.

## Technical details
- `src/routes/auth.tsx`: tabbed form. The Sign in tab calls `signInWithOtp` with `shouldCreateUser: false`, so it can no longer create accounts silently, and it maps the "signups not allowed / user not found" error to the create-account prompt. The Create account tab calls `signInWithOtp` with `shouldCreateUser: true` and `data: { display_name }`.
- The existing profile trigger already copies the display name and uses ON CONFLICT DO NOTHING, so no database change is needed. The server-side domain checks (requireStudent, RLS) stay as they are.
- Add a small test to make sure the sign-in request never sets account creation and the domain rule still applies.

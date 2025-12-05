/**
 * Home Page - Redirects to Admin via middleware
 *
 * The main functionality is on /admin. Redirect is handled by middleware.ts
 * This component is a fallback if middleware doesn't run (shouldn't happen).
 */
export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to admin...</p>
    </div>
  );
}

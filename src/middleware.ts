import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that require authentication
// We protect the staff console and admin dashboard
const isProtectedRoute = createRouteMatcher([
  "/staff/dashboard(.*)",
  "/admin(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is protected, enforce authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

"use client";

import { ReactNode } from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. Add it to your environment variables before deploying."
    );
  } else {
    console.warn(
      "[MediQueue] NEXT_PUBLIC_CONVEX_URL is not set. Real-time features will not work until you run `npx convex dev`."
    );
  }
}

const convex = new ConvexReactClient(convexUrl ?? "https://dummy-url.convex.cloud");

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

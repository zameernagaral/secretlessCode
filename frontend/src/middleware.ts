import { clerkMiddleware } from "@clerk/nextjs/server";

// This protects all routes by default, except the ones we configure.
// We are building a public scanner, so we don't protect any routes by default, 
// we only use Clerk for authenticating users who want to buy "Pro".
// Temporarily disabled to prevent invalid Clerk key crashes
// export default clerkMiddleware();
import { NextResponse } from 'next/server';
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

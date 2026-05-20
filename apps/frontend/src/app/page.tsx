/** Root page — redirects unauthenticated visitors to /login. Server component. */
import { redirect } from "next/navigation";

/** Redirects to login. No UI rendered. */
export default function HomePage() {
  redirect("/login");
}

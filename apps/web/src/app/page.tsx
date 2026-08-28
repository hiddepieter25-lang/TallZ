import { redirect } from "next/navigation";

// There is no public homepage any more — the storefront is the mobile app.
// Anyone landing on the root here wants the admin panel.
export default function Home() {
  redirect("/admin");
}

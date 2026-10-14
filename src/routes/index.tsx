import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import App from "@/him/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HIM-OS | سامانه هوشمندی سلامت" },
      { name: "description", content: "سامانه یکپارچه مدیریت و هوشمندی سلامت دانشگاه علوم پزشکی شهید بهشتی" },
      { property: "og:title", content: "HIM-OS | سامانه هوشمندی سلامت" },
      { property: "og:description", content: "سامانه یکپارچه مدیریت و هوشمندی سلامت بیمارستانی" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // The app reads screen width on start, so render it only in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-slate-50" />;
  return <App />;
}

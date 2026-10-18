import { useEffect, useState } from "react";
import App from "./App";
import type { WorkView } from "./context/AppContext";

/** The app reads screen width on start, so it is rendered only in the browser. */
export function BrowserApp({ initialWorkView = null }: { initialWorkView?: WorkView | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-screen bg-slate-50" />;
  return <App initialWorkView={initialWorkView} />;
}

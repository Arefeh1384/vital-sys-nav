import { createFileRoute, notFound } from "@tanstack/react-router";
import { BrowserApp } from "@/him/BrowserApp";
import { workViewForPath } from "@/him/context/AppContext";

/** Task, alert and notification pages; any other unknown path stays a real 404. */
export const Route = createFileRoute("/$")({
  beforeLoad: ({ location }) => {
    if (!workViewForPath(location.pathname)) throw notFound();
  },
  component: BrowserApp,
});

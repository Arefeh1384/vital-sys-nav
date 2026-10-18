import { createFileRoute } from "@tanstack/react-router";
import { BrowserApp } from "@/him/BrowserApp";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "ژورنال اقدام | HIM-OS" }] }),
  component: Page,
});

function Page() {
  return <BrowserApp initialWorkView={{ kind: "journal" }} />;
}

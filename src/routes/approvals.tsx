import { createFileRoute } from "@tanstack/react-router";
import { BrowserApp } from "@/him/BrowserApp";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "صف تأییدها | HIM-OS" }] }),
  component: Page,
});

function Page() {
  return <BrowserApp initialWorkView={{ kind: "approvals" }} />;
}

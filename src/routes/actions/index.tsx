import { createFileRoute } from "@tanstack/react-router";
import { BrowserApp } from "@/him/BrowserApp";

export const Route = createFileRoute("/actions/")({
  head: () => ({ meta: [{ title: "پیشنهادهای اقدام | HIM-OS" }] }),
  component: Page,
});

function Page() {
  return <BrowserApp initialWorkView={{ kind: "proposals" }} />;
}

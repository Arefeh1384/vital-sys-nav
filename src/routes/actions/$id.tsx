import { createFileRoute } from "@tanstack/react-router";
import { BrowserApp } from "@/him/BrowserApp";

export const Route = createFileRoute("/actions/$id")({
  head: () => ({ meta: [{ title: "جزئیات اقدام | HIM-OS" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <BrowserApp initialWorkView={{ kind: "proposal", id }} />;
}

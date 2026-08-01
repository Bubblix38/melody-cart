import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TopDJ — Web Player" },
      { name: "description", content: "TopDJ Web Player — Música para todas as pessoas." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="w-full h-full min-h-screen bg-black overflow-hidden flex flex-col">
      <iframe
        src="/spotify-player.html"
        className="w-full h-screen border-0 outline-none overflow-hidden"
        title="TopDJ Web Player"
      />
    </div>
  );
}

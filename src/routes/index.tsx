import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPacks, type Pack } from "@/lib/packs";
import { fetchTracks, type Track } from "@/lib/tracks";
import { useAudioPlayer, type PlayerTrack } from "@/lib/audio-player";
import { SpotifyTrackTable } from "@/components/SpotifyTrackTable";
import { cacheAudio } from "@/lib/offline-storage";
import { toast } from "sonner";

import { SpotifySidebar } from "@/components/SpotifySidebar";
import { SpotifyHero } from "@/components/SpotifyHero";
import { SpotifyRightSidebar } from "@/components/SpotifyRightSidebar";

import { SpotifyFullClone } from "@/components/SpotifyFullClone";

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
  return <SpotifyFullClone />;
}

import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Pack } from "@/lib/packs";

export function SpotifyRightSidebar({ pack }: { pack?: Pack }) {
  const title = "Espresso (Remix)";
  const artist = "AVLS";
  const coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&h=600&fit=crop";
  const artistUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&w=600&h=400&fit=crop";

  return (
    <aside className="hidden lg:flex flex-col w-[340px] shrink-0 bg-[#121212] rounded-lg h-[calc(100vh-144px)] overflow-y-auto custom-scrollbar p-4 text-[#b3b3b3] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-extrabold text-sm truncate pr-2">{title}</h3>
        <button className="p-1.5 hover:bg-[#1f1f1f] rounded-full hover:text-white transition-all cursor-pointer">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Track Large Cover Image */}
      <div className="w-full aspect-square rounded-lg overflow-hidden mb-4 shadow-2xl bg-white/5">
        <img 
          src={coverUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Track Title, Artist & Save Plus Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-black text-xl truncate hover:underline cursor-pointer">{title}</h2>
          <p className="text-sm font-semibold text-[#b3b3b3] mt-0.5 hover:underline cursor-pointer">{artist}</p>
        </div>
        <button className="text-[#b3b3b3] hover:text-white transition-colors p-1 cursor-pointer" title="Salvar em Músicas Curtidas">
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      {/* "Sobre o artista" Card Panel */}
      <div className="bg-[#1f1f1f] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-bold text-sm">Sobre o artista</span>
        </div>
        
        <div className="relative h-36 rounded-lg overflow-hidden mb-3">
          <img 
            src={artistUrl} 
            alt="Artist"
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
            <span className="text-white font-extrabold text-base">{artist}</span>
          </div>
        </div>
        
        <p className="text-xs text-[#b3b3b3] line-clamp-3 leading-relaxed">
          AVLS é produtor e DJ especialista em remixes eletrônicos com influências de Brazilian Bass, Tech House e Dance Pop.
        </p>
      </div>
    </aside>
  );
}

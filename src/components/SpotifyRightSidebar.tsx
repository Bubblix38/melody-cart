import { X, PlusCircle } from "lucide-react";
import { Pack } from "@/lib/packs";

export function SpotifyRightSidebar({ pack }: { pack?: Pack }) {
  if (!pack) return null;

  return (
    <aside className="hidden lg:flex flex-col w-80 bg-spotify-base rounded-lg h-[calc(100vh-90px)] overflow-y-auto custom-scrollbar p-4 text-spotify-subtext">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-sm truncate pr-2">{pack.nome}</h3>
        <button className="p-1 hover:bg-spotify-highlight rounded-full hover:text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <img 
        src={pack.imagem_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=400&h=400&fit=crop"} 
        alt={pack.nome}
        className="w-full aspect-square rounded-lg object-cover mb-4 shadow-lg"
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-2xl truncate">{pack.nome}</h2>
          <p className="text-sm mt-1">{pack.dj || "TopDJ Oficial"}</p>
        </div>
        <button className="text-spotify-green hover:text-white transition-colors">
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-spotify-highlight rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-bold text-sm">Sobre o artista</span>
        </div>
        
        <div className="relative h-32 rounded-lg overflow-hidden mb-3">
          <img 
            src="https://images.unsplash.com/photo-1493225457124-a1a2a5f5c92e?auto=format&w=400&h=200&fit=crop" 
            alt="Artist"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
            <span className="text-white font-bold">{pack.dj || "TopDJ Oficial"}</span>
          </div>
        </div>
        
        <p className="text-sm line-clamp-3">
          {pack.descricao || "Produtor musical especializado em criar as melhores experiências sonoras para pistas de dança."}
        </p>
      </div>
    </aside>
  );
}

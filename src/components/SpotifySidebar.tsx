import { Home, Search, Library, Plus, ArrowRight, Heart, Pin, List, Expand } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function SpotifySidebar() {
  return (
    <aside className="hidden md:flex flex-col gap-2 w-[340px] shrink-0 text-spotify-subtext h-[calc(100vh-90px)] font-sans">
      {/* Library Section */}
      <div className="bg-spotify-base rounded-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="pt-4 px-4 pb-2 flex items-center justify-between">
          <button className="flex items-center gap-3 font-bold hover:text-white transition-colors text-white group">
            <Library className="w-6 h-6 text-spotify-subtext group-hover:text-white transition-colors" />
            <span className="text-[15px]">Sua Biblioteca</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 bg-[#242424] hover:bg-[#2a2a2a] text-white px-3 py-1.5 rounded-full font-bold text-sm transition-colors">
              <Plus className="w-4 h-4" strokeWidth={3} />
              <span>Criar</span>
            </button>
            <button className="p-2 hover:bg-[#242424] rounded-full hover:text-white transition-all text-spotify-subtext">
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 flex gap-2">
          <span className="px-3 py-1.5 bg-[#242424] hover:bg-[#2a2a2a] text-white text-sm rounded-full font-medium transition-colors cursor-pointer">Playlists</span>
          <span className="px-3 py-1.5 bg-[#242424] hover:bg-[#2a2a2a] text-white text-sm rounded-full font-medium transition-colors cursor-pointer">Artistas</span>
          <span className="px-3 py-1.5 bg-[#242424] hover:bg-[#2a2a2a] text-white text-sm rounded-full font-medium transition-colors cursor-pointer">Álbuns</span>
        </div>

        {/* Search & Sort */}
        <div className="px-4 py-2 flex items-center justify-between mt-1">
          <button className="p-1 hover:bg-[#242424] rounded-full hover:text-white transition-all">
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button className="flex items-center gap-1 text-sm font-medium hover:text-white hover:scale-105 transition-all">
            Recentes <List className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          
          {/* Músicas Curtidas */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-medium text-[15px] truncate">Músicas Curtidas</span>
              <span className="text-sm truncate flex items-center text-spotify-subtext gap-1.5 mt-0.5">
                <Pin className="w-3.5 h-3.5 text-[#1DB954]" fill="currentColor" stroke="none" />
                Playlist • 684 músicas
              </span>
            </div>
          </div>
          
          {/* ALL NIGHT */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?auto=format&w=50&h=50&fit=crop" 
              alt="Cover" 
              className="w-12 h-12 rounded object-cover shrink-0" 
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[#1DB954] font-medium text-[15px] truncate">ALL NIGHT</span>
              <span className="text-sm truncate text-spotify-subtext mt-0.5">Single • IMAGINEA</span>
            </div>
          </div>

          {/* Pop Rap & R&B Gems */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a1a2a5f5c92e?auto=format&w=50&h=50&fit=crop" 
              alt="Cover" 
              className="w-12 h-12 rounded object-cover shrink-0" 
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-medium text-[15px] truncate">Pop Rap & R&B Gems</span>
              <span className="text-sm truncate text-spotify-subtext mt-0.5">Playlist • Playlist Factor</span>
            </div>
          </div>

          {/* Afro House */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&w=50&h=50&fit=crop" 
              alt="Cover" 
              className="w-12 h-12 rounded object-cover shrink-0" 
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-medium text-[15px] truncate">Afro House for Day Drinking</span>
              <span className="text-sm truncate text-spotify-subtext mt-0.5">Playlist • FERROLD</span>
            </div>
          </div>

          {/* TOP SERTANEJO */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md cursor-pointer transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=50&h=50&fit=crop" 
              alt="Cover" 
              className="w-12 h-12 rounded object-cover shrink-0" 
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-medium text-[15px] truncate">TOP SERTANEJO 🔥 Segundo Amor...</span>
              <span className="text-sm truncate text-spotify-subtext mt-0.5">Playlist • Joe Alves</span>
            </div>
          </div>

        </div>
      </div>
    </aside>
  );
}


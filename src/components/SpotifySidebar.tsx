import { Library, Plus, Search, Heart, Pin, List, X } from "lucide-react";

export function SpotifySidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[340px] shrink-0 text-[#b3b3b3] h-[calc(100vh-144px)] font-sans select-none">
      {/* Library Section Panel */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="pt-4 px-4 pb-2 flex items-center justify-between">
          <button className="flex items-center gap-3 font-bold hover:text-white transition-colors text-white group cursor-pointer">
            <Library className="w-6 h-6 text-[#b3b3b3] group-hover:text-white transition-colors" />
            <span className="text-[15px] font-extrabold">Sua Biblioteca</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white px-3 py-1.5 rounded-full font-bold text-xs transition-colors cursor-pointer">
              <Plus className="w-4 h-4" strokeWidth={3} />
              <span>Criar</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button className="p-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white rounded-full transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 py-1.5 bg-[#ffffff] text-black text-xs font-bold rounded-full cursor-pointer shrink-0">
            Playlists
          </span>
          <span className="px-3 py-1.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white text-xs font-medium rounded-full cursor-pointer shrink-0">
            Criadas pelo Spotify
          </span>
        </div>

        {/* Search & Sort Controls */}
        <div className="px-4 py-2 flex items-center justify-between mt-1">
          <button className="p-1.5 hover:bg-[#1f1f1f] rounded-full hover:text-white transition-colors cursor-pointer">
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-white hover:scale-105 transition-all cursor-pointer">
            <span>Recentes</span>
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Playlists Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          
          {/* Músicas Curtidas Item */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1f1f1f] rounded-md cursor-pointer transition-colors group">
            <div className="w-12 h-12 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center shrink-0 shadow-md">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold text-sm truncate">Músicas Curtidas</span>
              <span className="text-xs truncate flex items-center text-[#b3b3b3] gap-1.5 mt-0.5 font-medium">
                <Pin className="w-3.5 h-3.5 text-[#1fdf64]" fill="currentColor" stroke="none" />
                📌 686 músicas
              </span>
            </div>
          </div>
          
          {/* Brasilian Electronic 2026 (Active Item) */}
          <div className="flex items-center gap-3 p-2 bg-[#2a2a2a] rounded-md cursor-pointer transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=120&h=120&fit=crop" 
              alt="Pelé Cover" 
              className="w-12 h-12 rounded object-cover shrink-0" 
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[#1fdf64] font-bold text-sm truncate">BRASILIAN ELECTRONIC 2026</span>
              <span className="text-xs truncate text-[#b3b3b3] mt-0.5">saint hills</span>
            </div>
          </div>

          {/* Minha playlist n° 07 */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1f1f1f] rounded-md cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded bg-[#7000ff] text-white font-extrabold flex items-center justify-center text-lg shrink-0">
              7
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold text-sm truncate">Minha playlist nº 07 - 100 MP3</span>
              <span className="text-xs truncate text-[#b3b3b3] mt-0.5">DJ Ballahouse</span>
            </div>
          </div>

          {/* Minha playlist n° 06 */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1f1f1f] rounded-md cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded bg-[#e8115b] text-white font-extrabold flex items-center justify-center text-lg shrink-0">
              6
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold text-sm truncate">Minha playlist nº 06 - 100 MP3</span>
              <span className="text-xs truncate text-[#b3b3b3] mt-0.5">DJ Ballahouse</span>
            </div>
          </div>

          {/* Minha playlist n° 01 */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1f1f1f] rounded-md cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded bg-[#1e3264] text-white font-extrabold flex items-center justify-center text-lg shrink-0">
              1
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold text-sm truncate">Minha playlist nº 01 - 100 MP3</span>
              <span className="text-xs truncate text-[#b3b3b3] mt-0.5">DJ Ballahouse</span>
            </div>
          </div>

          {/* Minha playlist n° 05 */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1f1f1f] rounded-md cursor-pointer transition-colors">
            <div className="w-12 h-12 rounded bg-[#8d67ab] text-white font-extrabold flex items-center justify-center text-lg shrink-0">
              5
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold text-sm truncate">Minha playlist nº 05 - 100 MP3</span>
              <span className="text-xs truncate text-[#b3b3b3] mt-0.5">DJ Ballahouse</span>
            </div>
          </div>

          {/* David Fritz Best Of */}
          <div className="flex items-center gap-3 p-2 hover:bg-[#1f1f1f] rounded-md cursor-pointer transition-colors">
            <img 
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&w=120&h=120&fit=crop" 
              alt="Cover" 
              className="w-12 h-12 rounded object-cover shrink-0" 
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-white font-bold text-sm truncate">David Fritz Best Of</span>
              <span className="text-xs truncate text-[#b3b3b3] mt-0.5">DF Originals Records</span>
            </div>
          </div>

        </div>
      </div>
    </aside>
  );
}

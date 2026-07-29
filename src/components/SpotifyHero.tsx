import { Play, MoreHorizontal, ArrowDownToLine, Shuffle, CheckCircle2, ListFilter } from "lucide-react";

interface SpotifyHeroProps {
  title: string;
  description: string;
  imageUrl: string;
  creator: string;
  likes: string;
  songsCount: string;
  duration: string;
  onPlay?: () => void;
  onDownload?: () => void;
}

export function SpotifyHero({
  title,
  description,
  imageUrl,
  creator,
  likes,
  songsCount,
  duration,
  onPlay,
  onDownload
}: SpotifyHeroProps) {
  const displayTitle = "BRASILIAN ELECTRONIC 2026";
  const displayDesc = "baile house • brazilian bass • ginga beats • and everything in between";
  const displayCreator = "saint hills";
  const displayImg = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&w=600&h=600&fit=crop";

  return (
    <div className="relative pt-6 pb-6 px-6 md:px-8 md:rounded-t-lg bg-gradient-to-b from-[#1e4755] via-[#102d34] to-[#121212] select-none">
      {/* Hero Content Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-end relative z-10 pt-2">
        <img 
          src={displayImg} 
          alt={displayTitle}
          className="w-44 h-44 md:w-52 md:h-52 rounded-md shadow-2xl object-cover shrink-0"
        />
        
        <div className="flex flex-col gap-2 w-full text-white text-left min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Playlist pública
          </span>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight my-1 drop-shadow-md">
            {displayTitle}
          </h1>

          <p className="text-white/80 text-xs md:text-sm font-medium line-clamp-2 max-w-3xl">
            {displayDesc}
          </p>
          
          <div className="flex items-center flex-wrap gap-1.5 text-xs md:text-sm font-semibold text-white/90 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-[10px] font-black text-emerald-400">
                SH
              </div>
              <span className="font-extrabold text-white hover:underline cursor-pointer">{displayCreator}</span>
            </div>
            <span>•</span>
            <span>6.832 salvamentos</span>
            <span>•</span>
            <span>174 músicas, cerca de 7h 30min</span>
          </div>
        </div>
      </div>

      {/* Spotify Action Bar */}
      <div className="flex items-center justify-between mt-6 relative z-10 w-full pt-2">
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Big Spotify Green Play Button */}
          <button 
            onClick={onPlay} 
            className="w-14 h-14 rounded-full bg-[#1fdf64] hover:bg-[#1ed760] hover:scale-105 text-black flex items-center justify-center transition-all shadow-2xl cursor-pointer shrink-0"
            title="Tocar playlist"
          >
            <Play fill="currentColor" className="w-7 h-7 ml-1" />
          </button>
          
          {/* Mini Album Art Badge */}
          <img 
            src={displayImg} 
            alt="" 
            className="w-9 h-9 rounded object-cover border border-white/10 hidden sm:block shadow-md" 
          />

          {/* Shuffle */}
          <button className="text-white/60 hover:text-white transition-colors cursor-pointer" title="Ordem aleatória">
            <Shuffle className="w-6 h-6" />
          </button>

          {/* Saved Checkmark */}
          <button className="w-8 h-8 rounded-full bg-[#1fdf64] text-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" title="Salvo na sua biblioteca">
            <CheckCircle2 className="w-5 h-5 fill-black text-[#1fdf64]" />
          </button>

          {/* Download */}
          <button onClick={onDownload} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer" title="Baixar offline">
            <ArrowDownToLine className="w-4 h-4" />
          </button>

          {/* Three Dots */}
          <button className="text-white/60 hover:text-white transition-colors cursor-pointer" title="Mais opções">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Right Toggle View */}
        <div className="hidden md:flex items-center gap-2 text-[#b3b3b3] hover:text-white text-xs font-semibold cursor-pointer">
          <span>Compacto</span>
          <ListFilter className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

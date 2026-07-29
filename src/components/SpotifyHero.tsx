import { Play, Heart, MoreHorizontal, ArrowDownToLine, Shuffle, CheckCircle2, ListFilter } from "lucide-react";

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
  return (
    <div className="relative pt-6 md:pt-10 pb-6 px-4 md:px-8 md:rounded-t-lg bg-gradient-to-b from-[#1b434d] via-[#102d34] to-[#121212]">
      {/* Hero Content */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-end relative z-10 pt-2 md:pt-0">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-48 h-48 md:w-56 md:h-56 rounded-md shadow-2xl object-cover shrink-0"
        />
        
        <div className="flex flex-col gap-2 w-full text-white text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Playlist pública
          </span>

          <h1 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none my-1">
            {title}
          </h1>

          <p className="text-white/70 text-xs md:text-sm font-normal line-clamp-2 max-w-3xl">
            {description}
          </p>
          
          <div className="flex items-center flex-wrap gap-1.5 text-xs md:text-sm font-medium text-white/80 mt-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[10px] font-black text-emerald-400">
                DJ
              </div>
              <span className="font-bold text-white hover:underline cursor-pointer">{creator}</span>
            </div>
            <span>•</span>
            <span>{likes} salvamentos</span>
            <span>•</span>
            <span>{songsCount} músicas, cerca de {duration}</span>
          </div>
        </div>
      </div>

      {/* Spotify Action Bar */}
      <div className="flex items-center justify-between mt-8 relative z-10 w-full pt-2">
        <div className="flex items-center gap-6">
          {/* Big Green Play Button */}
          <button 
            onClick={onPlay} 
            className="w-14 h-14 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 text-black flex items-center justify-center transition-all shadow-xl cursor-pointer"
            title="Tocar playlist"
          >
            <Play fill="currentColor" className="w-7 h-7 ml-1" />
          </button>
          
          {/* Mini Album Art Badge */}
          <img 
            src={imageUrl} 
            alt="" 
            className="w-9 h-9 rounded object-cover border border-white/10 hidden sm:block" 
          />

          {/* Shuffle */}
          <button className="text-white/60 hover:text-white transition-colors cursor-pointer" title="Ordem aleatória">
            <Shuffle className="w-6 h-6" />
          </button>

          {/* Saved Checkmark */}
          <button className="w-8 h-8 rounded-full bg-[#1ed760] text-black flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" title="Salvo na sua biblioteca">
            <CheckCircle2 className="w-5 h-5 fill-black text-[#1ed760]" />
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
        <div className="hidden md:flex items-center gap-2 text-white/60 hover:text-white text-xs font-semibold cursor-pointer">
          <span>Compacto</span>
          <ListFilter className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

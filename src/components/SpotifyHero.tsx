import { Play, Heart, MoreHorizontal, ArrowDownToLine } from "lucide-react";

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
    <div className="relative pt-8 md:pt-20 pb-4 md:pb-6 px-4 md:px-8 md:rounded-t-lg bg-gradient-to-b from-indigo-900 via-indigo-900/60 to-[#121212]">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end relative z-10 pt-4 md:pt-0">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-64 h-64 md:w-56 md:h-56 shadow-2xl object-cover"
        />
        
        <div className="flex flex-col gap-1 md:gap-2 w-full text-white mt-4 md:mt-0 text-left">
          <span className="text-xs md:text-sm font-bold uppercase hidden md:block">Playlist pública</span>
          <h1 className="text-3xl md:text-7xl font-display font-black tracking-tighter line-clamp-2 md:line-clamp-none">
            {title}
          </h1>
          <p className="text-spotify-subtext text-sm md:text-base mt-1 md:mt-2 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm mt-1 md:mt-2 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px]">
                DJ
              </span>
              <span className="font-bold hover:underline cursor-pointer">{creator}</span>
            </div>
            <span className="text-spotify-subtext hidden md:inline">• {likes} salvamentos</span>
            <span className="text-spotify-subtext hidden md:inline">• {songsCount} músicas,</span>
            <span className="text-spotify-subtext hidden md:inline">cerca de {duration}</span>
            
            <span className="text-spotify-subtext md:hidden w-full mt-1">Guardada por {likes}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 mt-4 md:mt-8 relative z-10 w-full">
        <button onClick={onPlay} className="w-14 h-14 rounded-full bg-spotify-green hover:bg-[#1ed760] text-black flex items-center justify-center transition-all hover:scale-105 shadow-xl order-last md:order-first ml-auto md:ml-0">
          <Play fill="currentColor" className="w-7 h-7 ml-1" />
        </button>
        
        <div className="flex items-center gap-6 order-first md:order-last">
          <button className="text-spotify-subtext hover:text-white transition-colors">
            <Heart className="w-7 h-7 md:w-8 md:h-8" />
          </button>
          <button onClick={onDownload} className="text-spotify-subtext hover:text-white transition-colors cursor-pointer hover:scale-110">
            <ArrowDownToLine className="w-7 h-7 md:w-8 md:h-8" />
          </button>
          <button className="text-spotify-subtext hover:text-white transition-colors">
            <MoreHorizontal className="w-7 h-7 md:w-8 md:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}

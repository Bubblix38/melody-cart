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
    <div className="relative pt-6 md:pt-10 pb-4 px-4 md:px-8 md:rounded-t-lg bg-gradient-to-b from-indigo-950/80 via-indigo-900/40 to-[#121212]">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end relative z-10 pt-4 md:pt-0">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-44 h-44 md:w-40 md:h-40 rounded-lg shadow-2xl object-cover"
        />
        
        <div className="flex flex-col gap-1 md:gap-2 w-full text-white mt-4 md:mt-0 text-left">
          <h1 className="text-2xl md:text-4xl font-display font-bold tracking-tight line-clamp-2">
            {title}
          </h1>
          <p className="text-spotify-subtext text-xs md:text-sm mt-1 line-clamp-2 max-w-2xl">
            {description}
          </p>
          
          <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm mt-1 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white">
                PRO
              </span>
              <span className="font-bold hover:underline cursor-pointer">{creator}</span>
            </div>
            <span className="text-spotify-subtext hidden md:inline">• {likes} downloads</span>
            <span className="text-spotify-subtext hidden md:inline">• {songsCount} tracks</span>
            <span className="text-spotify-subtext hidden md:inline">• {duration}</span>
            
            <span className="text-spotify-subtext md:hidden w-full mt-1">Baixado por {likes}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 mt-4 relative z-10 w-full">
        <button onClick={onPlay} className="w-12 h-12 rounded-full bg-spotify-green hover:bg-[#1ed760] text-black flex items-center justify-center transition-all hover:scale-105 shadow-xl order-last md:order-first ml-auto md:ml-0">
          <Play fill="currentColor" className="w-6 h-6 ml-0.5" />
        </button>
        
        <div className="flex items-center gap-6 order-first md:order-last">
          <button className="text-spotify-subtext hover:text-white transition-colors">
            <Heart className="w-6 h-6" />
          </button>
          <button onClick={onDownload} className="text-spotify-subtext hover:text-white transition-colors cursor-pointer hover:scale-110">
            <ArrowDownToLine className="w-6 h-6" />
          </button>
          <button className="text-spotify-subtext hover:text-white transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

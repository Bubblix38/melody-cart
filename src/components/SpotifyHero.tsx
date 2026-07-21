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
}

export function SpotifyHero({
  title,
  description,
  imageUrl,
  creator,
  likes,
  songsCount,
  duration,
  onPlay
}: SpotifyHeroProps) {
  return (
    <div className="relative pt-20 pb-6 px-8 rounded-t-lg bg-gradient-to-b from-indigo-800/80 to-spotify-base">
      <div className="flex flex-col md:flex-row gap-6 items-end relative z-10">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-48 h-48 md:w-56 md:h-56 shadow-2xl rounded object-cover"
        />
        
        <div className="flex flex-col gap-2 flex-1 w-full text-white">
          <span className="text-sm font-bold uppercase">Playlist pública</span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter line-clamp-2">
            {title}
          </h1>
          <p className="text-spotify-subtext text-sm md:text-base mt-2 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center flex-wrap gap-2 text-sm mt-2 font-medium">
            <div className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs">
                DJ
              </span>
              <span className="font-bold hover:underline cursor-pointer">{creator}</span>
            </div>
            <span className="text-spotify-subtext">• {likes} salvamentos</span>
            <span className="text-spotify-subtext">• {songsCount} músicas,</span>
            <span className="text-spotify-subtext">cerca de {duration}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 mt-8 relative z-10">
        <button onClick={onPlay} className="w-14 h-14 rounded-full bg-spotify-green hover:bg-[#1ed760] text-black flex items-center justify-center transition-all hover:scale-105 shadow-xl">
          <Play fill="currentColor" className="w-7 h-7 ml-1" />
        </button>
        <button className="text-spotify-subtext hover:text-white transition-colors">
          <Heart className="w-8 h-8" />
        </button>
        <button className="text-spotify-subtext hover:text-white transition-colors">
          <ArrowDownToLine className="w-8 h-8" />
        </button>
        <button className="text-spotify-subtext hover:text-white transition-colors">
          <MoreHorizontal className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

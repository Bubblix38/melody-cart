import { MapPin, CheckCircle2, Share2, Pencil } from "lucide-react";
import { motion } from "framer-motion";

export function SoundCloudHero() {
  return (
    <section className="mt-14 max-w-[1440px] mx-auto px-6 pt-6">
      <div className="relative w-full h-[280px] rounded-lg overflow-hidden group">
        {/* Banner Background */}
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="https://images.unsplash.com/photo-1541661538396-53ba2d051eed?auto=format&w=1440&q=80&fit=crop"
          alt="TopDJ Banner"
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Content Container */}
        <div className="absolute inset-0 flex items-end p-6 md:p-10 gap-6 md:gap-10">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[4px] md:border-[6px] border-background bg-background overflow-hidden shadow-2xl relative z-10 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1645519675889-d6bdd40e57f3?auto=format&w=600&q=80&fit=crop"
              alt="TopDJ Avatar"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/10 text-white">
                Verified Artist
              </span>
              <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-white/60">
                <MapPin className="h-3 w-3" /> Guarapari, Brazil
              </div>
            </div>
            
            <h1 className="font-display text-3xl md:text-5xl font-extrabold mb-4 tracking-tight flex items-center gap-3 text-white">
              TopDJ <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 fill-primary text-primary-foreground border-none" />
            </h1>

            <div className="flex items-center gap-6 md:gap-10">
              <div className="text-center">
                <span className="block text-white/40 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                  Seguidores
                </span>
                <span className="text-lg md:text-2xl font-display font-bold text-white">1.2M</span>
              </div>
              <div className="text-center">
                <span className="block text-white/40 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                  Seguindo
                </span>
                <span className="text-lg md:text-2xl font-display font-bold text-white">142</span>
              </div>
              <div className="text-center">
                <span className="block text-white/40 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                  Faixas
                </span>
                <span className="text-lg md:text-2xl font-display font-bold text-white">84</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-3">
          <button className="bg-black/30 backdrop-blur-md hover:bg-black/50 p-2 md:p-2.5 rounded-full border border-white/10 transition-colors text-white">
            <Share2 className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button className="bg-black/30 backdrop-blur-md hover:bg-black/50 p-2 md:p-2.5 rounded-full border border-white/10 transition-colors text-white">
            <Pencil className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

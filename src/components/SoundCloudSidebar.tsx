import { Instagram, Twitter, Youtube, Heart, Crown, Play } from "lucide-react";

export function SoundCloudSidebar() {
  return (
    <aside className="col-span-12 lg:col-span-4 space-y-10">
      {/* Bio */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Biografia</h3>
          <p className="text-sm text-white/60 leading-relaxed italic">
            "Transformando frequências em emoções. Pioneiro na cena eletrônica brasileira."
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-white/40 hover:text-white transition-colors">
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Likes */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-white/40 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
            <Heart className="h-3 w-3 fill-primary text-primary" /> 60 Curtidas
          </h3>
          <a href="#" className="text-xs text-white/40 hover:text-white transition-colors">Exibir tudo</a>
        </div>
        
        <div className="space-y-4">
          {[
            { id: 1, title: "Techno Underground Pack", artist: "Lilo", img: "https://images.pexels.com/photos/30563921/pexels-photo-30563921.jpeg?auto=compress&cs=tinysrgb&w=100&q=80", plays: "15k", hearts: "535" },
            { id: 2, title: "Lo-fi Chill Vibes", artist: "TopDJ", img: "https://images.pexels.com/photos/29990727/pexels-photo-29990727.jpeg?auto=compress&cs=tinysrgb&w=100&q=80", plays: "5.9k", hearts: "326" },
            { id: 3, title: "Future Bass Essentials", artist: "TopDJ", img: "https://images.unsplash.com/photo-1617886971858-4234921a7540?auto=format&w=100&q=80&fit=crop", plays: "7.3k", hearts: "346" }
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-lg">
                <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors text-white">{item.title}</p>
                <p className="text-xs text-white/40">Por {item.artist}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-white/30 font-bold">
                  <span className="flex items-center gap-1"><Play className="h-2.5 w-2.5" fill="currentColor" /> {item.plays}</span>
                  <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5" fill="currentColor" /> {item.hearts}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Card */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] group shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-colors duration-700" />
        <div className="relative z-10 p-8 text-white">
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 border border-white/10 group-hover:border-primary/50 transition-colors">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-display text-2xl font-bold mb-3 tracking-tight">Upgrade para Pro</h4>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Libere estatísticas avançadas, upload ilimitado e ferramentas exclusivas de marketing.
          </p>
          <button className="w-full py-3.5 bg-white text-black font-extrabold rounded-lg hover:bg-white/90 transition-all shadow-xl font-display text-xs uppercase tracking-widest active:scale-95">
            Quero ser Pro
          </button>
        </div>
      </div>

      {/* Aside Footer */}
      <footer className="pt-8 border-t border-white/10 text-[10px] text-white/30 space-y-2 uppercase font-bold tracking-widest">
        <p>Sobre • Ajuda • Termos de Uso • Privacidade</p>
        <p>&copy; {new Date().getFullYear()} TOPDJ • SoundCloud Concept</p>
      </footer>
    </aside>
  );
}

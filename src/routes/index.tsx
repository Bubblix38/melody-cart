import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fetchPacks } from "@/lib/packs";
import { PackCard } from "@/components/PackCard";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-music.jpg";
import { popImg, rockImg, sertanejoImg, eletronicaImg } from "@/lib/pack-images";

const packsQuery = queryOptions({
  queryKey: ["packs"],
  queryFn: fetchPacks,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TopDJ — Descubra e Compre os Melhores Álbuns" },
      {
        name: "description",
        content:
          "Loja de packs de música TopDJ: encontre lançamentos e sucessos de Pop, Rock, Sertanejo e Eletrônica. Pagamento seguro.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(packsQuery),
  component: Index,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center" role="alert">
      <p className="text-muted-foreground">Não foi possível carregar os packs.</p>
      <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
    </div>
  ),
});

const generos = [
  { nome: "Pop Hits", img: popImg, to: "Pop" },
  { nome: "Rock Hits", img: rockImg, to: "Rock" },
  { nome: "Sertanejo Hits", img: sertanejoImg, to: "Sertanejo" },
  { nome: "Eletrônica Hits", img: eletronicaImg, to: "Eletrônica" },
] as const;

function Index() {
  const { data: packs } = useSuspenseQuery(packsQuery);
  const destaques = packs.filter((p) => p.destaque).slice(0, 4);
  const lista = destaques.length > 0 ? destaques : packs.slice(0, 4);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt=""
          aria-hidden
          width={1280}
          height={960}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-80" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl text-primary-foreground"
          >
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Descubra e Compre os{" "}
              <span className="bg-gradient-to-r from-[oklch(0.85_0.12_60)] to-[oklch(0.8_0.13_350)] bg-clip-text text-transparent">
                Melhores Álbuns!
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-foreground/90">
              Encontre os lançamentos e sucessos de todos os gêneros musicais em
              packs exclusivos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-13 bg-[image:var(--gradient-primary)] px-8 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
              >
                <Link to="/loja">
                  Explorar Álbuns
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TOP HITS POR GÊNERO */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Top Hits por <span className="text-gradient">Gênero</span>
          </h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {generos.map((g) => (
            <Link
              key={g.nome}
              to="/loja"
              search={{ genero: g.to }}
              className="group relative aspect-[5/3] overflow-hidden rounded-2xl shadow-[var(--shadow-card)]"
            >
              <img
                src={g.img}
                alt={g.nome}
                loading="lazy"
                width={768}
                height={768}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
              <span className="absolute bottom-3 left-4 text-lg font-bold text-white">
                {g.nome}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="secondary" className="font-semibold">
            <Link to="/mais-ouvidas">Ver Ranking Completo</Link>
          </Button>
        </div>
      </section>

      {/* LOJA DE ÁLBUNS */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Loja de <span className="text-gradient">Álbuns</span>
            </h2>
            <p className="mt-1 text-muted-foreground">Packs de álbuns em oferta.</p>
          </div>
          <PaymentBadges />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {lista.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" variant="outline" className="font-semibold">
            <Link to="/loja">
              Ver todos os packs
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function PaymentBadges() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      <span className="text-sm font-bold text-[oklch(0.55_0.13_180)]">Pix</span>
      <span className="text-sm font-bold italic text-[oklch(0.45_0.15_265)]">VISA</span>
      <span className="text-sm font-bold text-[oklch(0.6_0.2_30)]">Mastercard</span>
    </div>
  );
}

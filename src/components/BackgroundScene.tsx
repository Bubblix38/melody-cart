/**
 * Camada de fundo fixa, renderizada uma única vez atrás de todo o conteúdo.
 * O visual real é 100% controlado por CSS através do atributo data-bg-theme
 * no <html>, então trocar de tema é instantâneo (sem re-render pesado).
 */
export function BackgroundScene() {
  return (
    <div className="bg-scene" aria-hidden="true">
      {/* Tema: Grade Cyberpunk */}
      <div className="bg-scene__sky" />
      <div className="bg-scene__horizon-glow" />
      <div className="bg-scene__grid-floor" />

      {/* Tema: Nebulosa 3D */}
      <div className="bg-scene__nebula-orb bg-scene__nebula-orb--1" />
      <div className="bg-scene__nebula-orb bg-scene__nebula-orb--2" />
      <div className="bg-scene__nebula-orb bg-scene__nebula-orb--3" />
      <div className="bg-scene__stars" />

      {/* Tema: Holográfico */}
      <div className="bg-scene__holo-sheen" />
      <div className="bg-scene__holo-scanlines" />
    </div>
  );
}

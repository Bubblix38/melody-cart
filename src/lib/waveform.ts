/**
 * Gera alturas de barras para uma waveform com aparência orgânica
 * (combinação de ondas senoidais), em vez de valores aleatórios "espetados".
 * Determinístico: mesma seed sempre gera o mesmo desenho.
 */
export function generateWaveformBars(count: number, seed = 1): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const wave =
      Math.sin(t * Math.PI * 6 + seed) * 0.5 +
      Math.sin(t * Math.PI * 13 + seed * 2) * 0.3 +
      Math.sin(t * Math.PI * 3 + seed * 0.5) * 0.2;
    const normalized = (wave + 1) / 2; // 0..1
    const height = 22 + normalized * 78; // 22%..100%
    bars.push(Math.round(height));
  }
  return bars;
}

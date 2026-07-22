export const AUDIO_CACHE_NAME = 'topdj-audio-cache-v1';

/**
 * Verifica se uma URL de áudio já está baixada no cache.
 */
export async function isAudioCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const response = await cache.match(url);
    return !!response;
  } catch (error) {
    console.error('Erro ao verificar cache de áudio:', error);
    return false;
  }
}

/**
 * Baixa e salva um áudio no cache offline.
 */
export async function cacheAudio(url: string, onProgress?: (progress: number) => void): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    
    // Já está em cache?
    const existing = await cache.match(url);
    if (existing) return true;

    // Fazemos fetch manual para mostrar progresso (opcional) ou salvar no cache
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao baixar áudio: ${response.statusText}`);
    
    // Clonamos para colocar no cache
    await cache.put(url, response.clone());
    return true;
  } catch (error) {
    console.error('Erro ao baixar áudio para cache:', error);
    return false;
  }
}

/**
 * Remove um áudio do cache.
 */
export async function removeAudioFromCache(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    return await cache.delete(url);
  } catch (error) {
    console.error('Erro ao remover áudio do cache:', error);
    return false;
  }
}

import popImg from "@/assets/pack-pop.jpg";
import rockImg from "@/assets/pack-rock.jpg";
import sertanejoImg from "@/assets/pack-sertanejo.jpg";
import eletronicaImg from "@/assets/pack-eletronica.jpg";

const GENERO_IMG: Record<string, string> = {
  Pop: popImg,
  Rock: rockImg,
  Sertanejo: sertanejoImg,
  "Eletrônica": eletronicaImg,
  Eletronica: eletronicaImg,
};

export function packImage(imagem_url: string | null, genero: string): string {
  if (imagem_url && imagem_url.trim().length > 0) return imagem_url;
  return GENERO_IMG[genero] ?? popImg;
}

export { popImg, rockImg, sertanejoImg, eletronicaImg };

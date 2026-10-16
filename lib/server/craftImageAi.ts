import type { CraftBlank } from '@/lib/craftBlanks';
import { CraftArtStyle, CRAFT_ART_STYLES } from '@/lib/craftArtStyles';

export type { CraftArtStyle };
export { CRAFT_ART_STYLES };

/**
 * Tạo prompt tiếng Anh chuyên sâu cho mô hình AI khuếch tán (Diffusion Model / Sana / Flux)
 * kết hợp chất liệu làng nghề truyền thống Việt Nam.
 */
export function buildCraftArtPrompt(params: {
  prompt: string;
  blank: CraftBlank;
  style?: CraftArtStyle;
}): string {
  const { prompt, blank, style = 'photorealistic' } = params;

  // Thuộc tính chất liệu theo từng phôi làng nghề
  let blankContext = '';
  switch (blank.id) {
    case 'gom':
      blankContext = 'an exquisite Bat Trang ceramic porcelain vessel, authentic Vietnamese ceramic handicraft, fine crackled glaze, tactile glossy porcelain surface';
      break;
    case 'lua':
      blankContext = 'a luxurious Van Phuc mulberry silk scarf, soft pure silk fabric drapery, subtle silk sheen and shimmering golden threads';
      break;
    case 'non-la':
      blankContext = 'an iconic traditional Vietnamese Non La conical hat from Chuong village, meticulously woven natural bamboo frame and translucent sunlit palm leaves';
      break;
    case 'tranh-khac-go':
      blankContext = 'a magnificent Ha Thai traditional lacquer wooden artwork, polished deep black then lacquer with inlaid real eggshell and shimmering gold leaf gilding';
      break;
    default:
      blankContext = `an authentic traditional Vietnamese ${blank.name} handicraft from ${blank.villageName}`;
  }

  // Phong cách nghệ thuật
  let styleModifiers = '';
  switch (style) {
    case 'lacquer-gold':
      styleModifiers = 'traditional Vietnamese lacquer art, glistening 24k gold leaf foil, polished black lacquer then, crushed duck eggshell inlay, deep luminous reflections, royal imperial dynasty aesthetic';
      break;
    case 'blue-porcelain':
      styleModifiers = 'imperial cobalt blue hand-painted porcelain, ancient crackled ivory celadon glaze, traditional Vietnamese dynastic royal pottery, delicate blue brushstrokes, soft museum spotlight';
      break;
    case 'mother-of-pearl':
      styleModifiers = 'intricate mother-of-pearl seashell inlay, iridescent abalone shell reflections shimmering with rainbow colors, rosewood woodcraft, fine craftsmanship';
      break;
    case 'photorealistic':
    default:
      styleModifiers = 'high-end photorealistic DSLR photography, dramatic warm studio chiaroscuro lighting, crisp macro details of material texture, award-winning craft exhibition presentation';
      break;
  }

  return `Masterpiece of ${blankContext}, featuring artistic motifs: "${prompt.trim()}". ${styleModifiers}, authentic Vietnamese cultural heritage, 8k resolution, extreme details, ultra sharp focus, cinematic composition.`;
}

/**
 * Sinh ảnh AI chất lượng cao thông qua mô hình Sana với cơ chế proxy an toàn.
 */
export async function generateCraftAiArt(params: {
  prompt: string;
  blank: CraftBlank;
  style?: CraftArtStyle;
  seed?: number;
}): Promise<{
  imageUrl: string;
  fallbackUrl?: string;
  promptEnriched: string;
  style: CraftArtStyle;
}> {
  const { prompt, blank, style = 'photorealistic', seed = 42 } = params;
  const enrichedPrompt = buildCraftArtPrompt({ prompt, blank, style });

  // URL an toàn qua proxy nội bộ của Next.js (chống CORS, cache tự động)
  const proxyUrl = `/api/ai/image-proxy?prompt=${encodeURIComponent(enrichedPrompt)}&seed=${seed}&style=${style}&blankId=${blank.id}`;

  let fallbackUrl = '/images/villages/bat-trang/blue_glaze_vase.jpg';
  if (blank.id === 'lua') {
    fallbackUrl = '/images/villages/van-phuc/lua_van_phuc.jpg';
  } else if (blank.id === 'non-la') {
    fallbackUrl = '/images/villages/chuong/conical_hat1.jpg';
  } else if (blank.id === 'tranh-khac-go') {
    fallbackUrl = '/images/villages/ha-thai/lacquer_box2.jpg';
  }

  return {
    imageUrl: proxyUrl,
    fallbackUrl,
    promptEnriched: enrichedPrompt,
    style,
  };
}

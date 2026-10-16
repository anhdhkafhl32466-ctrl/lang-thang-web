import type { CraftBlank } from '@/lib/craftBlanks';
import { CraftArtStyle, CRAFT_ART_STYLES } from '@/lib/craftArtStyles';

export type { CraftArtStyle };
export { CRAFT_ART_STYLES };

/**
 * Bảng từ điển dịch thuật ngữ mỹ nghệ & văn hóa truyền thống Việt Nam
 * sang thuật ngữ tiếng Anh chuyên sâu cho các mô hình AI Diffusion (Flux / Sana / SDXL).
 */
const CRAFT_TRANSLATION_RULES: { pattern: RegExp; translation: string }[] = [
  // Vật phẩm thờ cúng & đồ gốm sứ
  { pattern: /bát hương|lư hương|đỉnh hương|bát nhang/gi, translation: 'exquisite Bat Trang ceramic incense burner censer vessel with dragon handles' },
  { pattern: /lọ hoa|bình hoa|lục bình|bình gốm|chiếc bình/gi, translation: 'ceremonial imperial ceramic porcelain vase vessel' },
  { pattern: /đĩa cảnh|đĩa gốm|đĩa sứ|khay đĩa/gi, translation: 'decorative ceramic porcelain display charger plate' },
  { pattern: /ấm chén|ấm trà|tách trà|bộ chén trà/gi, translation: 'imperial porcelain teapot and teacups ceremony set' },
  { pattern: /tượng gốm|tượng phật|quan âm/gi, translation: 'sacred Buddhist ceramic statue sculpture' },
  
  // Lụa & Trang phục truyền thống
  { pattern: /áo dài/gi, translation: 'traditional Vietnamese Ao Dai silk tunic garment with elegant collar' },
  { pattern: /khăn lụa|khăn quàng lụa/gi, translation: 'luxurious flowing pure mulberry silk scarf draped gracefully' },
  { pattern: /dải lụa|vải lụa|tơ tằm/gi, translation: 'shimmering authentic Van Phuc mulberry silk textile drapery' },
  
  // Nón lá & Mây tre đan
  { pattern: /nón lá|chiếc nón|nón chuông|nón bài thơ/gi, translation: 'iconic traditional Vietnamese Non La conical palm hat woven with fine bamboo stitches' },
  { pattern: /quạt giấy|quạt lụa|chiếc quạt|quạt nan/gi, translation: 'traditional Chang Son handcrafted bamboo and silk folding hand fan' },
  { pattern: /chuồn chuồn tre/gi, translation: 'delicate balancing bamboo dragonflies perched gracefully' },
  { pattern: /mây tre đan|lẵng hoa|giỏ mây/gi, translation: 'intricate Vietnamese split bamboo and rattan hand-woven basketry' },
  { pattern: /tò he/gi, translation: 'vibrant Vietnamese folk toy figurines sculpted from rice dough' },
  
  // Sơn mài & Khảm trai
  { pattern: /tranh sơn mài|hộp sơn mài|đĩa sơn mài/gi, translation: 'exquisite Ha Thai lacquer panel artwork with polished black then and crushed duck eggshell' },
  { pattern: /khảm trai|khảm xà cừ|khay xà cừ/gi, translation: 'masterpiece rosewood handicraft with iridescent mother-of-pearl seashell inlay' },
  { pattern: /tượng gỗ|điêu khắc gỗ|chạm trổ/gi, translation: 'traditional sacred wooden sculpture carved from precious jackfruit wood' },
  
  // Mô típ hoa văn truyền thống
  { pattern: /hoa sen|bông sen|đầm sen|sen hồng/gi, translation: 'blooming sacred pink lotus flowers with dew drops on emerald lotus leaves' },
  { pattern: /hoa cúc|bông cúc/gi, translation: 'auspicious imperial chrysanthemum petals' },
  { pattern: /hoa mai|hoa đào/gi, translation: 'spring apricot and cherry blossoms' },
  { pattern: /rồng|rồng thời lý|thần long/gi, translation: 'celestial Ly dynasty sinuous Vietnamese dragon with fiery sacred pearl' },
  { pattern: /phượng|chim phượng|phượng hoàng/gi, translation: 'mythical auspicious phoenix with luminous trailing plumage' },
  { pattern: /chim lạc/gi, translation: 'ancient prehistoric Dong Son Lac birds soaring in flight' },
  { pattern: /cá chép|trông trăng|lý ngư/gi, translation: 'golden koi fish leaping over water waves reflecting full moon' },
  { pattern: /trống đồng|mặt trống đồng/gi, translation: 'prehistoric Dong Son bronze drum radial sunburst and geometric sacred bands' },
  { pattern: /sóng nước|thủy ba/gi, translation: 'traditional stylized rhythmic Vietnamese ocean waves and water ripples' },
  { pattern: /mây cổ|mây cuộn/gi, translation: 'ancient stylized dynasty cloud scrolls' },
  { pattern: /tre trúc|cây tre|rặng tre/gi, translation: 'slender graceful green bamboo stalks and delicate foliage' },
  { pattern: /chùa một cột/gi, translation: 'historic One Pillar Pagoda iconic architecture floating above lotus pond' },
  { pattern: /tháp rùa|hồ gươm/gi, translation: 'historic Hanoi Turtle Tower reflected on emerald Sword Lake water' },
  { pattern: /phố cổ|mái ngói rêu phong/gi, translation: 'ancient Hanoi Old Quarter terracotta tiled rooftops with patina' },
  
  // Kỹ thuật mỹ nghệ & Màu sắc
  { pattern: /vẽ vàng|dát vàng|thếp vàng/gi, translation: 'lavish 24k gold leaf gilding, hand-painted molten gold contour outlines' },
  { pattern: /men lam|xanh lam/gi, translation: 'classic royal cobalt blue and white porcelain glaze brushwork' },
  { pattern: /men rạn/gi, translation: 'antique crackled ivory celadon glaze with intricate spiderweb crazing texture' },
  { pattern: /xà cừ|ngũ sắc|ánh trai/gi, translation: 'shimmering iridescent abalone mother-of-pearl reflecting spectrum of prism colors' },
  { pattern: /màu đỏ|son đỏ|đỏ thắm/gi, translation: 'rich imperial vermilion crimson red' },
  { pattern: /màu xanh ngọc|ngọc bích/gi, translation: 'luminous jade green celadon hue' },
  { pattern: /tinh xảo|chi tiết|tỉ mỉ/gi, translation: 'ultra-intricate master artisan craftsmanship details, extreme precision' },
];

/**
 * Chuyển đổi ý tưởng tiếng Việt sang prompt tiếng Anh giàu mỹ cảm và văn hóa.
 */
export function translateCraftPrompt(userPrompt: string): string {
  const normalized = userPrompt.trim();
  const matchedTerms: string[] = [];

  for (const { pattern, translation } of CRAFT_TRANSLATION_RULES) {
    if (pattern.test(normalized)) {
      matchedTerms.push(translation);
    }
  }

  if (matchedTerms.length > 0) {
    return matchedTerms.join(', ');
  }

  // Nếu không khớp từ khóa chuyên biệt, giữ lại mô tả gốc
  return normalized;
}

/**
 * Tạo prompt tiếng Anh chuyên sâu cho mô hình AI khuếch tán (Flux / Sana / SDXL)
 * kết hợp chất liệu làng nghề truyền thống Việt Nam.
 */
export function buildCraftArtPrompt(params: {
  prompt: string;
  blank: CraftBlank;
  style?: CraftArtStyle;
}): string {
  const { prompt, blank, style = 'photorealistic' } = params;

  // Dịch thuật ngữ tiếng Việt sang tiếng Anh mỹ thuật
  const enrichedMotifs = translateCraftPrompt(prompt);

  // Thuộc tính chất liệu theo từng phôi làng nghề
  let blankContext = '';
  switch (blank.id) {
    case 'gom':
      blankContext = 'an authentic Bat Trang ceramic porcelain vessel, tactile glossy porcelain surface, handcrafted by Vietnamese master potter';
      break;
    case 'lua':
      blankContext = 'a luxurious Van Phuc pure mulberry silk scarf, soft pure silk fabric drapery, subtle silk sheen';
      break;
    case 'non-la':
      blankContext = 'an iconic traditional Vietnamese Non La conical hat from Chuong village, meticulously woven natural bamboo frame and translucent sunlit palm leaves';
      break;
    case 'tranh-khac-go':
      blankContext = 'a magnificent Ha Thai traditional lacquer artwork panel, polished deep black then lacquer with inlaid eggshell and gold leaf';
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
      styleModifiers = 'high-end photorealistic studio DSLR photography, dramatic warm studio chiaroscuro lighting, crisp macro details of material texture, award-winning craft exhibition presentation';
      break;
  }

  return `Masterpiece of ${blankContext}, featuring: ${enrichedMotifs}. ${styleModifiers}, authentic Vietnamese cultural heritage, 8k resolution, extreme details, ultra sharp focus, cinematic composition.`;
}

/**
 * Sinh ảnh AI thực thụ 100% dựa trên prompt của người dùng.
 * TUYỆT ĐỐI không trả về ảnh tĩnh có sẵn để làm giả ảnh AI.
 */
export async function generateCraftAiArt(params: {
  prompt: string;
  blank: CraftBlank;
  style?: CraftArtStyle;
  seed?: number;
}): Promise<{
  imageUrl: string;
  proxyUrl: string;
  promptEnriched: string;
  style: CraftArtStyle;
}> {
  const { prompt, blank, style = 'photorealistic', seed = 42 } = params;
  const enrichedPrompt = buildCraftArtPrompt({ prompt, blank, style });

  // 1. URL trực tiếp tới mô hình Flux/Diffusion qua CDN Pollinations (không bị giới hạn serverless timeout)
  const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=768&height=768&seed=${seed}&nologo=true`;

  // 2. URL proxy nội bộ của Next.js làm dự phòng đường truyền
  const proxyUrl = `/api/ai/image-proxy?prompt=${encodeURIComponent(enrichedPrompt)}&seed=${seed}&style=${style}&blankId=${blank.id}`;

  return {
    imageUrl: directUrl,
    proxyUrl,
    promptEnriched: enrichedPrompt,
    style,
  };
}

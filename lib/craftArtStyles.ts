export type CraftArtStyle = 'photorealistic' | 'lacquer-gold' | 'blue-porcelain' | 'mother-of-pearl';

export interface CraftArtStyleOption {
  id: CraftArtStyle;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
}

export const CRAFT_ART_STYLES: CraftArtStyleOption[] = [
  {
    id: 'photorealistic',
    name: 'Siêu thực 3D (Ảnh xưởng)',
    tagline: 'Chân thực như chụp máy ảnh DSLR',
    description: 'Bề mặt bóng mịn, phản chiếu ánh sáng studio, thấy rõ từng thớ gốm, sợi tơ lụa và vân tre mộc.',
    icon: '📸',
    badge: 'Phổ biến nhất',
  },
  {
    id: 'lacquer-gold',
    name: 'Sơn mài thếp vàng kim',
    tagline: 'Cung đình & Quý tộc',
    description: 'Nền then đen bóng sâu thẳm, cẩn vỏ trứng vịt trắng ngà và dát vàng quỳ óng ánh lộng lẫy.',
    icon: '✨',
    badge: 'Đậm chất Hà Nội',
  },
  {
    id: 'blue-porcelain',
    name: 'Gốm men lam Cổ điển',
    tagline: 'Men rạn & Nét vẽ lam coban',
    description: 'Men rạn ngọc cổ kính ngàn năm Thăng Long, nét vẽ lam phóng khoáng tinh tế của nghệ nhân Bát Tràng.',
    icon: '🏺',
    badge: 'Truyền thống',
  },
  {
    id: 'mother-of-pearl',
    name: 'Khảm trai & Xà cừ ngũ sắc',
    tagline: 'Ánh xà cừ óng ánh đỏ lửa',
    description: 'Từng mảnh ốc biển xà cừ ngũ sắc lấp lánh chìm nổi trên nền gỗ trắc đen bóng Chuyên Mỹ.',
    icon: '🐚',
    badge: 'Tinh xảo',
  },
];

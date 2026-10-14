export interface SilkProduct {
  id: 'square-scarf' | 'long-scarf' | 'tote-bag';
  name: string;
  subtitle: string;
  realDimensions: string;
  aspectRatio: string;
  canvasWidth: number;
  canvasHeight: number;
  description: string;
  finishingMethod: string;
  tag: string;
  shapePath: string; // SVG path or clip description
}

export interface SilkColor {
  id: string;
  name: string;
  hex: string;
  textColor: string;
  description: string;
  origin: string;
}

export interface ThreadColor {
  id: string;
  name: string;
  hex: string;
  shimmer: boolean;
  type: string;
}

export interface SilkMotif {
  id: string;
  name: string;
  category: 'hoa-la' | 'linh-vat' | 'hinh-hoc';
  symbolism: string;
  svgPath: string;
  viewBox: string;
  defaultScale: number;
}

export interface PlacedMotif {
  id: string;
  motifId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  flipX: boolean;
  flipY: boolean;
  opacity: number;
}

export type WeaveTexture = 'damask' | 'brocade' | 'satin';

export interface SilkDesignState {
  product: SilkProduct;
  baseColor: SilkColor;
  customBaseHex?: string;
  weaveTexture: WeaveTexture;
  threadColor: ThreadColor;
  motifs: PlacedMotif[];
  artworkName: string;
  artisanName: string;
}

/* =========================================================================
   1. PRODUCTS
   ========================================================================= */
export const SILK_PRODUCTS: SilkProduct[] = [
  {
    id: 'square-scarf',
    name: 'Khăn Lụa Vuông',
    subtitle: 'Khăn vuông tơ tằm cổ điển',
    realDimensions: '70cm x 70cm',
    aspectRatio: '1:1',
    canvasWidth: 500,
    canvasHeight: 500,
    description: 'Chiếc khăn lụa vuông mềm mại, cuốn biên thủ công bằng chỉ tơ tằm. Thích hợp cho bố cục hoa văn tâm đối xứng hoặc điểm xuyết 4 góc thanh nhã.',
    finishingMethod: 'Khâu cuốn biên tơ thủ công tỉ mỉ',
    tag: 'Thanh lịch & Sang trọng',
    shapePath: 'M 20 20 H 480 V 480 H 20 Z'
  },
  {
    id: 'long-scarf',
    name: 'Khăn Quàng Cổ Lụa',
    subtitle: 'Khăn choàng lụa dài thướt tha',
    realDimensions: '180cm x 48cm',
    aspectRatio: '2.5:1',
    canvasWidth: 625,
    canvasHeight: 250,
    description: 'Tấm khăn choàng mềm mại buông rủ thướt tha với hai đầu đan tua rua lụa óng ánh. Rất tôn vinh các họa tiết mây hạc bay bổng chạy dọc thân khăn.',
    finishingMethod: 'Chuốt sợi & thắt nút tua rua lụa mềm',
    tag: 'Duyên dáng & Ấm áp',
    shapePath: 'M 20 20 H 605 V 230 H 20 Z'
  },
  {
    id: 'tote-bag',
    name: 'Túi Vải Lụa Đơn Giản',
    subtitle: 'Túi xách lụa quai tre tinh tế',
    realDimensions: '32cm x 36cm',
    aspectRatio: '1:1.15',
    canvasWidth: 440,
    canvasHeight: 500,
    description: 'Chiếc túi lụa trang nhã phối tay cầm tre tự nhiên, mặt túi may bằng lụa gấm dệt hoa văn nổi bật. Vừa mang tính mỹ thuật vừa tiện dụng.',
    finishingMethod: 'May ráp thân túi, may lót & xỏ quai tre',
    tag: 'Hiện đại & Ứng dụng',
    shapePath: 'M 40 80 Q 220 70 400 80 L 410 460 Q 220 480 30 460 Z'
  }
];

/* =========================================================================
   2. TRADITIONAL SILK COLORS
   ========================================================================= */
export const SILK_BASE_COLORS: SilkColor[] = [
  {
    id: 'trang-nga',
    name: 'Trắng Ngà Tơ Nõn',
    hex: '#F8F4EB',
    textColor: '#2E2218',
    description: 'Sắc trắng tự nhiên của kén tằm vàng Vạn Phúc vừa ươm sợi.',
    origin: 'Tơ nõn nguyên bản'
  },
  {
    id: 'do-tram',
    name: 'Đỏ Trầm Hồng Điều',
    hex: '#8E2828',
    textColor: '#FFFFFF',
    description: 'Sắc đỏ quý phái dệt từ tơ nhuộm hạt vang và vỏ sò cổ truyền.',
    origin: 'Màu cung đình truyền thống'
  },
  {
    id: 'xanh-cham',
    name: 'Xanh Chàm Ngàn Năm',
    hex: '#1D3557',
    textColor: '#FFFFFF',
    description: 'Sắc xanh thẳm ngâm ủ từ lá chàm tươi, bền màu cùng năm tháng.',
    origin: 'Nhuộm chàm thảo mộc'
  },
  {
    id: 'vang-mo-ga',
    name: 'Vàng Ấm Mỡ Gà',
    hex: '#DCA236',
    textColor: '#241708',
    description: 'Màu vàng hoàng yến ấm áp, gợi nét vương giả của lụa tiến vua.',
    origin: 'Củ nghệ & hạt dành dành'
  },
  {
    id: 'hong-sen',
    name: 'Hồng Phấn Cánh Sen',
    hex: '#D47B88',
    textColor: '#FFFFFF',
    description: 'Thanh tao như sắc hoa sen sớm mai nở trên đầm nước xứ Đoài.',
    origin: 'Cánh sen & cánh kiến'
  },
  {
    id: 'xanh-ngoc',
    name: 'Xanh Ngọc Bích',
    hex: '#2B6A60',
    textColor: '#FFFFFF',
    description: 'Màu xanh lục ngọc đài các, tượng trưng cho phúc lộc và bình an.',
    origin: 'Nhuộm vỏ bàng & lá xoan'
  },
  {
    id: 'tim-hue',
    name: 'Tím Hoa Cà Cổ Điển',
    hex: '#6B4C6E',
    textColor: '#FFFFFF',
    description: 'Sắc tím đằm thắm, mang vẻ đẹp hoài niệm của phụ nữ Tràng An xưa.',
    origin: 'Lá cẩm & rễ cây rừng'
  },
  {
    id: 'den-tuyen',
    name: 'Đen Tuyền Huyền Lụa',
    hex: '#222326',
    textColor: '#F5EFE6',
    description: 'Lụa đen bóng huyền ảo, chuội qua bùn ao và lá ổi lưu giữ ánh tơ.',
    origin: 'Nhuộm bùn & phù sa'
  },
  {
    id: 'vang-dong',
    name: 'Vàng Đồng Hổ Phách',
    hex: '#A66B24',
    textColor: '#FFFFFF',
    description: 'Màu vàng hổ phách trầm mặc, ánh lên vẻ đẹp cổ kính nghìn năm.',
    origin: 'Vỏ sồi & đất phù sa'
  },
  {
    id: 'xanh-com',
    name: 'Xanh Cốm Mùa Thu',
    hex: '#6E8A54',
    textColor: '#FFFFFF',
    description: 'Sắc xanh non dìu dịu như hạt cốm làng Vòng ngát hương thu Hà Nội.',
    origin: 'Lá nếp & vỏ chanh thơm'
  }
];

/* =========================================================================
   3. WEAVE / EMBROIDERY THREAD COLORS
   ========================================================================= */
export const SILK_THREAD_COLORS: ThreadColor[] = [
  { id: 'gold', name: 'Chỉ Vàng Kim Tuyến', hex: '#E5BF5A', shimmer: true, type: 'Kim tuyến cao cấp' },
  { id: 'silver', name: 'Chỉ Bạc Ngân Tuyến', hex: '#E2E8F0', shimmer: true, type: 'Ngân tuyến óng ả' },
  { id: 'crimson', name: 'Chỉ Đỏ Son Cổ', hex: '#BA2D2D', shimmer: false, type: 'Tơ nhuộm vang' },
  { id: 'ivory', name: 'Chỉ Bạch Ngọc', hex: '#FFFFFF', shimmer: false, type: 'Tơ nõn trắng tuyền' },
  { id: 'indigo', name: 'Chỉ Chàm Đậm', hex: '#16283C', shimmer: false, type: 'Tơ nhuộm chàm sâu' },
  { id: 'amber', name: 'Chỉ Hổ Phách', hex: '#C27D22', shimmer: true, type: 'Tơ dệt ánh đồng' },
  { id: 'moss', name: 'Chỉ Xanh Rêu', hex: '#3E5C3B', shimmer: false, type: 'Tơ nhuộm thảo mộc' },
  { id: 'rose', name: 'Chỉ Hồng San Hô', hex: '#D96B7A', shimmer: false, type: 'Tơ nhuộm cánh kiến' }
];

/* =========================================================================
   4. AUTHENTIC VIETNAMESE SILK MOTIFS (SVG PATHS)
   ========================================================================= */
export const SILK_MOTIFS: SilkMotif[] = [
  {
    id: 'van-may',
    name: 'Vân Mây Ngũ Sắc',
    category: 'linh-vat',
    symbolism: 'Đặc trưng lụa Vân Vạn Phúc - Tượng trưng cho sự hanh thông, an bình và may mắn.',
    viewBox: '0 0 100 100',
    defaultScale: 1,
    svgPath: 'M20,65 C15,65 10,60 10,53 C10,45 16,39 24,39 C25,32 31,26 39,26 C45,26 50,29 53,33 C57,25 65,20 74,20 C86,20 95,30 95,42 C95,45 94,48 93,51 C97,54 100,59 100,64 C100,72 93,78 85,78 L25,78 C18,78 14,73 14,68 C14,62 19,57 25,57 C27,57 29,58 31,59 C30,55 31,50 35,47 C39,44 44,45 47,48 C50,42 56,38 63,38 C72,38 78,45 78,53 C78,55 77,57 76,59 C80,60 83,64 83,68 C83,73 79,77 74,77 L25,77'
  },
  {
    id: 'chim-hac',
    name: 'Hạc Tiên Tung Cánh',
    category: 'linh-vat',
    symbolism: 'Biểu tượng của sự trường thọ, trí tuệ và phẩm cách thanh cao của văn hóa Việt.',
    viewBox: '0 0 100 100',
    defaultScale: 1.1,
    svgPath: 'M85,25 C80,22 73,20 68,22 C64,24 61,28 58,32 C54,28 48,22 40,20 C32,18 24,20 18,25 C14,29 12,35 15,40 C17,44 22,46 27,47 C23,51 20,56 19,62 C18,70 23,77 30,81 C38,85 47,83 54,78 C60,82 68,83 75,80 C82,77 87,70 88,62 C89,55 86,49 82,45 C86,40 88,33 85,25 Z M56,40 C58,36 62,33 66,32 C65,37 62,42 58,45 C57,43 56,41 56,40 Z'
  },
  {
    id: 'hoa-sen',
    name: 'Bạch Liên Thanh Khiết',
    category: 'hoa-la',
    symbolism: 'Quốc hoa Việt Nam - Biểu tượng tâm hồn thanh tịnh, vẻ đẹp trang nhã không vướng bụi trần.',
    viewBox: '0 0 100 100',
    defaultScale: 1,
    svgPath: 'M50,15 C54,26 62,38 66,50 C68,58 66,66 60,72 C55,77 45,77 40,72 C34,66 32,58 34,50 C38,38 46,26 50,15 Z M48,42 C42,46 32,53 26,62 C22,68 22,76 27,81 C32,86 41,85 47,80 C49,75 49,66 48,56 Z M52,42 C58,46 68,53 74,62 C78,68 78,76 73,81 C68,86 59,85 53,80 C51,75 51,66 52,56 Z M18,70 C15,74 16,80 20,83 C26,87 34,86 39,82 C33,80 27,77 22,72 Z M82,70 C85,74 84,80 80,83 C74,87 66,86 61,82 C67,80 73,77 78,72 Z'
  },
  {
    id: 'la-sen',
    name: 'Lá Sen Xòe Duyên',
    category: 'hoa-la',
    symbolism: 'Đường nét uốn lượn mộc mạc che chở cho đóa sen, tượng trưng sự bao dung hòa ái.',
    viewBox: '0 0 100 100',
    defaultScale: 0.95,
    svgPath: 'M50,20 C68,18 84,30 86,48 C88,66 74,82 56,84 C38,86 20,74 16,56 C12,38 28,22 46,20 L50,50 Z M50,50 L30,35 M50,50 L70,33 M50,50 L75,65 M50,50 L35,70 M50,50 L52,78'
  },
  {
    id: 'hoa-cuc',
    name: 'Cúc Vạn Thọ Cổ',
    category: 'hoa-la',
    symbolism: 'Họa tiết kinh điển trong dệt gấm - Tượng trưng cho phúc thọ dài lâu, khí tiết người quân tử.',
    viewBox: '0 0 100 100',
    defaultScale: 1,
    svgPath: 'M50,38 C56,38 62,44 62,50 C62,56 56,62 50,62 C44,62 38,56 38,50 C38,44 44,38 50,38 Z M50,15 C52,22 52,30 50,38 C48,30 48,22 50,15 Z M50,62 C52,70 52,78 50,85 C48,78 48,70 50,62 Z M15,50 C22,48 30,48 38,50 C30,52 22,52 15,50 Z M62,50 C70,48 78,48 85,50 C78,52 70,52 62,50 Z M25,25 C31,31 37,36 42,42 C36,37 31,31 25,25 Z M58,58 C64,64 70,70 75,75 C70,70 64,64 58,58 Z M75,25 C70,31 64,36 58,42 C64,37 70,31 75,25 Z M42,58 C36,64 31,70 25,75 C31,70 36,64 42,58 Z'
  },
  {
    id: 'qua-tram',
    name: 'Quả Trám Hoa Thị Gấm',
    category: 'hinh-hoc',
    symbolism: 'Cấu trúc dệt kinh điển của lụa gấm Vạn Phúc - Tạo chiều sâu đa chiều khi ánh sáng chiếu vào sợi lụa.',
    viewBox: '0 0 100 100',
    defaultScale: 1,
    svgPath: 'M50,10 L90,50 L50,90 L10,50 Z M50,26 L74,50 L50,74 L26,50 Z M50,40 C55,40 60,45 60,50 C60,55 55,60 50,60 C45,60 40,55 40,50 C40,45 45,40 50,40 Z'
  },
  {
    id: 'canh-truc',
    name: 'Trúc Quân Tử',
    category: 'hoa-la',
    symbolism: 'Tượng trưng cho sự thanh cao, bền bỉ và ngay thẳng của người thợ dệt làng nghề.',
    viewBox: '0 0 100 100',
    defaultScale: 1,
    svgPath: 'M48,15 L52,15 L52,45 L48,45 Z M47,48 L53,48 L53,85 L47,85 Z M52,28 C62,24 74,25 82,32 C74,33 65,31 52,35 Z M52,38 C65,37 76,42 82,50 C74,48 64,44 52,42 Z M48,55 C36,52 25,54 18,60 C26,60 36,58 48,60 Z M48,65 C34,66 24,72 18,80 C26,77 36,73 48,70 Z'
  },
  {
    id: 'chu-tho',
    name: 'Triện Cát Tường Thọ',
    category: 'hinh-hoc',
    symbolism: 'Triện chữ Thọ tròn thư pháp - Cầu chúc trường thọ, an khang và vạn sự viên mãn.',
    viewBox: '0 0 100 100',
    defaultScale: 0.95,
    svgPath: 'M50,10 C72,10 90,28 90,50 C90,72 72,90 50,90 C28,90 10,72 10,50 C10,28 28,10 50,10 Z M50,18 C32,18 18,32 18,50 C18,68 32,82 50,82 C68,82 82,68 82,50 C82,32 68,18 50,18 Z M32,32 H68 V40 H32 Z M32,46 H68 V54 H32 Z M32,60 H68 V68 H32 Z M47,24 H53 V76 H47 Z'
  },
  {
    id: 'diem-thuy-ba',
    name: 'Sóng Nước Thủy Ba',
    category: 'hinh-hoc',
    symbolism: 'Hoa văn sóng nước hoàng triều dệt chân gấm - Biểu thị sự sinh sôi và thịnh vượng bền vững.',
    viewBox: '0 0 100 60',
    defaultScale: 1.2,
    svgPath: 'M0,50 Q25,20 50,50 T100,50 L100,60 L0,60 Z M10,48 Q30,28 50,48 T90,48 M20,46 Q35,34 50,46 T80,46 M0,25 Q15,10 30,25 T60,25 T90,25'
  },
  {
    id: 'chu-phuc',
    name: 'Ấn Phúc Vương Lụa',
    category: 'hinh-hoc',
    symbolism: 'Triện ấn chữ Phúc cách điệu - Mang phước lành và êm ấm đến gia chủ sở hữu lụa quý.',
    viewBox: '0 0 100 100',
    defaultScale: 0.9,
    svgPath: 'M20,20 H80 V80 H20 Z M28,28 H72 V72 H28 Z M36,36 H64 V42 H36 Z M47,42 H53 V64 H47 Z M36,50 H64 V56 H36 Z M36,64 H64 V70 H36 Z'
  }
];

/* =========================================================================
   5. POETIC NAME SUGGESTIONS FOR PRODUCTS
   ========================================================================= */
export const POETIC_NAMES: string[] = [
  'Bạch Liên Dạ Nguyệt',
  'Vân Vũ Hoàng Kim',
  'Sắc Thu Hà Đông',
  'Chàm Bích Song Hạc',
  'Hồng Điều Cát Tường',
  'Ngọc Diệp Kim Chi',
  'Mây Tơ Xứ Đoài',
  'Thoi Đưa Trăng Rằm',
  'Hương Sắc Vạn Phúc',
  'Cúc Họa Niên Hoa'
];

/* =========================================================================
   6. ARTISAN TRIVIA & REALISM TOOLTIPS
   ========================================================================= */
export const VAN_PHUC_TRIVIA = [
  {
    title: 'Lụa Vân trứ danh',
    text: 'Lụa Vân Vạn Phúc có đặc tính kỳ diệu: nhìn thẳng thấy sợi tơ óng ả phẳng mịn, nhìn nghiêng hoa văn mây chìm nổi hiện lên tinh xảo.'
  },
  {
    title: 'Kỹ thuật mắc cửi',
    text: 'Để dệt một tấm lụa gấm đẹp, người thợ Vạn Phúc phải mắc hàng ngàn sợi tơ dọc đều tăm tắp, độ căng chính xác để thoi luồn êm ái.'
  },
  {
    title: 'Nhịp thoi đập go',
    text: 'Tiếng thoi đưa lách cách và tiếng go đập là âm thanh rộn rã gắn liền với ký ức bao thế hệ bên dòng sông Nhuệ hiền hòa.'
  },
  {
    title: 'Chuội lụa tự nhiên',
    text: 'Lụa sau khi dệt được nấu tẩy và chuội bằng nước giếng làng ấm để sợi tơ bung nở hết độ óng và mềm rủ tự nhiên như làn sương.'
  }
];

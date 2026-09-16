import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';

export interface QuizAnswers {
  interests: string[];      // 'thủ công', 'chụp ảnh', 'lịch sử', 'ẩm thực', 'tự tay làm', 'mua sắm'
  tripStyle: string;        // 'gia đình', 'bạn bè', 'cặp đôi', 'một mình', 'thư giãn'
  timeAvailable: string;    // '2-3h', 'nửa ngày', '1 ngày', 'cuối tuần'
  priority: string;         // 'trải nghiệm làm nghề', 'check-in sống ảo', 'tìm hiểu văn hóa', 'mua quà lưu niệm'
  customDescription?: string; // Thanh chat / tự mô tả tự do sở thích & yêu cầu riêng
}

export interface RecommendationResult {
  village: CraftVillage;
  matchScore: number;
  reasons: string[];
  suggestedActivities: string[];
  itinerary: {
    time: string;
    action: string;
  }[];
  foodTips: string[];
  travelTip: string;
  matchTags: string[];
}

interface VillageProfile {
  slug: string;
  distanceKm: number;
  traits: {
    cuisine: number;   // Ẩm thực
    photo: number;     // Chụp ảnh sống ảo
    history: number;   // Lịch sử & cội nguồn
    craft: number;     // Thủ công mỹ nghệ
    handsOn: number;   // Tự tay trải nghiệm làm nghề
    shopping: number;  // Mua sắm quà lưu niệm
    family: number;    // Gia đình & trẻ nhỏ
    friends: number;   // Nhóm bạn bè
    couples: number;   // Cặp đôi lãng mạn
    solo: number;      // Đi một mình chiêm nghiệm
    relax: number;     // Thư giãn, bình yên
  };
  keywords: string[];
  matchTags: string[];
  foodTips: string[];
  travelTip: string;
  itinerary: { time: string; action: string }[];
  highlightReason: string;
}

export const VILLAGE_AI_PROFILES: Record<string, VillageProfile> = {
  'bat-trang': {
    slug: 'bat-trang',
    distanceKm: 14,
    traits: { cuisine: 72, photo: 84, history: 88, craft: 96, handsOn: 98, shopping: 95, family: 90, friends: 90, couples: 85, solo: 78, relax: 72 },
    keywords: ['bát tràng', 'gốm', 'đất sét', 'bàn xoay', 'lò bầu', 'vuốt gốm', 'bảo tàng gốm', 'tô tượng', 'măng mực', 'men rạn', 'sứ'],
    matchTags: ['Nghệ thuật gốm sứ', 'Vuốt gốm bàn xoay', 'Bảo tàng xoắn ốc 7 tầng'],
    foodTips: [
      'Canh măng mực Bát Tràng (món cỗ tiến vua danh tiếng nức lòng người sành ăn)',
      'Chè củ mài bùi ngọt thanh tao',
      'Su hào xào mực giòn sần sật',
      'Bánh chè lam cổ truyền đậm vị gừng'
    ],
    travelTip: 'Chỉ 35 phút từ trung tâm (14km). Đi xe máy đường đê Nguyễn Khoái - đê Bát Tràng hoặc tuyến buýt 47A từ Long Biên (15 phút/chuyến).',
    itinerary: [
      { time: '08:30 - 09:30', action: 'Di chuyển đến Bát Tràng, ngắm kiến trúc Bảo tàng Gốm Bát Tràng với 7 cánh xoắn ốc đất nung kỳ vĩ.' },
      { time: '09:30 - 11:30', action: 'Trải nghiệm ngồi bàn xoay vuốt gốm, tự tay tạo hình chiếc bình hoặc cốc đất sét độc bản.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức canh măng mực truyền thống và các món cỗ gốm cổ xưa bên sông Hồng.' },
      { time: '13:00 - 15:00', action: 'Dạo chợ gốm Bát Tràng, ngắm các dòng men rạn cổ, sắm ấm chén tử sa và quà lưu niệm thủ công.' }
    ],
    highlightReason: 'Thiên đường gốm sứ với trải nghiệm ngồi bàn xoay vuốt đất sét thực tế và Bảo tàng Gốm kiến trúc xoắn ốc hàng đầu thủ đô.'
  },

  'me-tri': {
    slug: 'me-tri',
    distanceKm: 8,
    traits: { cuisine: 100, photo: 86, history: 82, craft: 80, handsOn: 85, shopping: 95, family: 85, friends: 88, couples: 94, solo: 82, relax: 88 },
    keywords: ['mễ trì', 'cốm', 'ẩm thực', 'ăn', 'ngon', 'chả cốm', 'xôi cốm', 'bánh cốm', 'chè cốm', 'giã cốm', 'lá sen', 'mùa thu', 'gần', 'nội thành'],
    matchTags: ['Thiên đường Cốm Hà Nội', 'Cực gần trung tâm chỉ 8km', 'Ẩm thực Di sản Quốc gia'],
    foodTips: [
      'Cốm non mộc tươi dẻo thơm gói trong lá sen tươi ngát hương',
      'Xôi cốm hạt sen dừa nạo ngọt bùi nức tiếng mùa thu Hà Nội',
      'Chả cốm chiên phồng nóng hổi chấm nước mắm cốt nhĩ',
      'Chè cốm đường phèn hoa bưởi thanh mát'
    ],
    travelTip: 'Cực gần trung tâm (chỉ 8km, 15-20 phút). Đi đại lộ Thăng Long hoặc đường Cầu Giấy rẽ Đỗ Đức Dục/Mễ Trì. Các tuyến xe buýt: 33, 50, 74, 107.',
    itinerary: [
      { time: '08:00 - 09:00', action: 'Ghé làng Cốm Mễ Trì đón sương sớm, lắng nghe tiếng chày giã cốm nhịp nhàng vang khắp ngõ cổ.' },
      { time: '09:00 - 10:30', action: 'Thăm lò cốm gia truyền, tận mắt xem quy trình sàng sảy, rang thóc nếp hoa vàng trên chảo gang đỏ lửa.' },
      { time: '10:30 - 11:30', action: 'Thưởng thức xôi cốm dừa hạt sen nóng hổi và nhâm nhi tách trà sen Tây Hồ.' },
      { time: '11:30 - 12:30', action: 'Chọn mua chả cốm tươi, cốm mộc bọc lá sen xanh mướt làm quà biếu đậm phong vị Tràng An.' }
    ],
    highlightReason: 'Điểm đến số 1 cho người sành ẩm thực: thưởng thức hạt cốm dẻo thơm Di sản Quốc gia, chỉ mất 15-20 phút di chuyển từ trung tâm.'
  },

  'quang-phu-cau': {
    slug: 'quang-phu-cau',
    distanceKm: 35,
    traits: { cuisine: 80, photo: 100, history: 75, craft: 85, handsOn: 75, shopping: 85, family: 75, friends: 99, couples: 90, solo: 82, relax: 76 },
    keywords: ['quảng phú cầu', 'hương', 'chân hương', 'bó hương', 'đỏ', 'chụp ảnh', 'sống ảo', 'check-in', 'vịt cỏ', 'vân đình', 'nghệ thuật'],
    matchTags: ['Tọa độ Check-in Quốc tế', 'Biển hoa chân hương đỏ rực', 'Đặc sản vịt cỏ Vân Đình'],
    foodTips: [
      'Vịt cỏ Vân Đình nướng than hoa da giòn thịt ngọt',
      'Cháo vịt cỏ hạt sen béo bùi ăn kèm rau thơm đồng chiêm',
      'Xôi bắp mỡ hành nếp cái hoa vàng dẻo quánh'
    ],
    travelTip: 'Cách trung tâm 35km (~50-60 phút). Đi xe máy theo QL21B hoặc đi xe buýt tuyến 91 từ bến xe Yên Nghĩa đỗ ngay tại cổng làng.',
    itinerary: [
      { time: '07:30 - 08:45', action: 'Khởi hành sớm đến Quảng Phú Cầu khi nắng vừa lên, thời điểm các sân phơi hương nở hoa đẹp nhất.' },
      { time: '08:45 - 11:30', action: 'Chụp ảnh sống ảo giữa những "bông hoa" chân hương rực rỡ sắc đỏ vàng, giao lưu cùng thợ chẻ tăm hương.' },
      { time: '11:30 - 13:00', action: 'Dừng chân quán vịt cỏ Vân Đình trứ danh ngay cạnh làng, thưởng thức mâm tiệc vịt nướng đậm đà.' },
      { time: '13:00 - 15:00', action: 'Khám phá xưởng se hương thảo mộc tự nhiên và mua những bó hương bài, hương trầm thanh tịnh.' }
    ],
    highlightReason: 'Khung cảnh hàng triệu que hương xòe hoa đỏ thắm rực rỡ như tranh thủy mặc, điểm check-in sống ảo triệu view nổi tiếng thế giới.'
  },

  'tay-tuu': {
    slug: 'tay-tuu',
    distanceKm: 13,
    traits: { cuisine: 60, photo: 98, history: 65, craft: 65, handsOn: 70, shopping: 78, family: 82, friends: 94, couples: 100, solo: 78, relax: 88 },
    keywords: ['tây tựu', 'hoa', 'cánh đồng hoa', 'vườn hoa', 'hoa cúc', 'hoa ly', 'hoa hồng', 'chụp ảnh đôi', 'cặp đôi', 'lãng mạn', 'chợ hoa'],
    matchTags: ['Vương quốc Hoa ngút ngàn', 'Hẹn hò cặp đôi lãng mạn', 'Chỉ 13km gần nội thành'],
    foodTips: [
      'Bún đậu mẹt làng Đăm mắm tôm thơm ngậy',
      'Ổi đào Tây Tựu tươi giòn ngọt lịm hái tại vườn',
      'Chè sen đỗ đen hạt sen đá giải nhiệt mùa hè'
    ],
    travelTip: 'Chỉ 13km (khoảng 30 phút). Đi đường Hồ Tùng Mậu - Cầu Diễn - QL32 rẽ Tây Tựu. Buổi sáng tinh khôi 07:00 - 09:00 là lúc hoa tươi khoe sắc đẹp nhất.',
    itinerary: [
      { time: '07:30 - 08:30', action: 'Di chuyển thong thả đến cánh đồng hoa Tây Tựu khi những luống hoa còn đọng sương mai lấp lánh.' },
      { time: '08:30 - 10:30', action: 'Dạo bước giữa thảm hoa cúc họa mi, hoa hồng nhung, hoa ly ngào ngạt hương thơm; chụp bộ ảnh nàng thơ.' },
      { time: '10:30 - 11:30', action: 'Trò chuyện cùng các chủ vườn hoa mến khách, tự tay chọn cắt những bó hoa tươi thắm tại gốc.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức bún đậu mẹt và cà phê sân vườn thư giãn thanh bình.' }
    ],
    highlightReason: 'Cánh đồng hoa bạt ngàn ngát hương chỉ cách trung tâm 13km, không gian lý tưởng tuyệt đối cho các cặp đôi hẹn hò và chụp ảnh lãng mạn.'
  },

  'van-phuc': {
    slug: 'van-phuc',
    distanceKm: 11,
    traits: { cuisine: 72, photo: 94, history: 88, craft: 92, handsOn: 78, shopping: 100, family: 82, friends: 92, couples: 96, solo: 82, relax: 82 },
    keywords: ['vạn phúc', 'lụa', 'dệt', 'áo dài', 'ô dù', 'con đường ô', 'mua sắm', 'tàu điện', 'cát linh', 'khăn lụa', 'quà tặng', 'hà đông'],
    matchTags: ['Thủ phủ Lụa ngàn năm', 'Đi tàu điện Cát Linh 15p', 'Con đường Ô dù rực rỡ'],
    foodTips: [
      'Bún chả Cầu Am nướng than củi thơm lừng ngõ cổ',
      'Bánh cuốn nóng tráng mỏng nhân mộc nhĩ giòn ngọt',
      'Chè sen long nhãn bọc hạt sen ngọt mát thanh cảnh'
    ],
    travelTip: 'Cực kỳ tiện lợi: Đi tàu điện trên cao Cát Linh - Hà Đông chỉ 15 phút, xuống ga Vạn Phúc tản bộ 5 phút vào cổng làng.',
    itinerary: [
      { time: '08:30 - 09:15', action: 'Trải nghiệm tàu điện trên cao ngắm nhìn phố phường Hà Nội, đến ga Vạn Phúc bước vào làng lụa.' },
      { time: '09:15 - 11:00', action: 'Check-in con đường ô dù sắc màu, viếng miếu Bà Chúa Lụa và xem nghệ nhân dệt lụa tơ tằm cổ truyền.' },
      { time: '11:00 - 12:30', action: 'Thưởng thức bún chả Cầu Am nức tiếng phố cổ Hà Đông và nhâm nhi chè sen long nhãn.' },
      { time: '12:30 - 14:30', action: 'Dạo các showroom lụa tơ tằm thượng hạng, sắm khăn lụa Vân, cà vạt, áo dài quý phái làm quà tặng.' }
    ],
    highlightReason: 'Không gian lụa tơ tằm sang trọng với con đường ô dù rực rỡ, rất tiện đi bằng tàu điện trên cao Cát Linh và thỏa sức mua sắm quà lưu niệm cao cấp.'
  },

  'dao-thuc': {
    slug: 'dao-thuc',
    distanceKm: 25,
    traits: { cuisine: 65, photo: 84, history: 90, craft: 86, handsOn: 94, shopping: 70, family: 100, friends: 82, couples: 78, solo: 80, relax: 94 },
    keywords: ['đào thục', 'rối nước', 'múa rối', 'chú tễu', 'trẻ em', 'gia đình', 'thủy đình', 'bé', 'con nít', 'ao làng', 'dân gian', 'đông anh'],
    matchTags: ['Số 1 cho Gia đình & Trẻ em', 'Múa rối nước Thủy đình cổ', 'Trải nghiệm sau cánh gà'],
    foodTips: [
      'Cơm quê gà thả đồi Đông Anh nướng lá chanh',
      'Bánh chưng Tranh Khúc lân cận dẻo rền đậm đà',
      'Cà pháo giòn tan dầm tương nếp cổ truyền'
    ],
    travelTip: 'Khoảng 25km (45 phút) qua cầu Nhật Tân / Đông Trù. Nên liên hệ trước với phường rối Đào Thục để đặt lịch diễn rối nước theo đoàn.',
    itinerary: [
      { time: '08:30 - 09:30', action: 'Di chuyển qua cầu Nhật Tân lộng gió đến làng quê rợp bóng tre xanh Đào Thục (Đông Anh).' },
      { time: '09:30 - 11:00', action: 'Thưởng thức các tích trò rối nước đặc sắc bên Thủy đình: Chú Tễu giáo trò, đánh cá, chọi trâu.' },
      { time: '11:00 - 12:00', action: 'Trẻ em và gia đình được xắn quần lội nước sau mành sáo, thử cầm sào điều khiển con rối gỗ cùng nghệ nhân.' },
      { time: '12:00 - 13:30', action: 'Thưởng thức mâm cơm quê Bắc Bộ gà đồi, canh cua mùng tơi thanh mát trong sân đình cổ.' }
    ],
    highlightReason: 'Điểm đến số 1 cho gia đình có trẻ em: hòa mình vào nghệ thuật múa rối nước độc bản và cơ hội hiếm có lội nước điều khiển rối cùng nghệ nhân.'
  },

  'xuan-la': {
    slug: 'xuan-la',
    distanceKm: 40,
    traits: { cuisine: 60, photo: 82, history: 80, craft: 90, handsOn: 100, shopping: 88, family: 99, friends: 78, couples: 76, solo: 78, relax: 82 },
    keywords: ['xuân la', 'tò he', 'nặn tò he', 'bột nếp', 'trẻ em', 'đồ chơi dân gian', 'bé', 'con nít', 'con giống', 'tự tay làm', 'phú xuyên'],
    matchTags: ['Làng Tò he duy nhất Việt Nam', 'Xứ sở đồ chơi tuổi thơ', 'Bé tự tay nặn bột thơm'],
    foodTips: [
      'Bánh đa gấc giòn rụm đỏ son may mắn',
      'Kẹo lạc kẹo dồi nhâm nhi bên ấm chè xanh',
      'Chè củ từ ngọt bùi thôn dã'
    ],
    travelTip: 'Cách trung tâm 40km (khoảng 65 phút) xuôi theo QL1A cũ về Phú Xuyên. Rất tuyệt vời cho chuyến dã ngoại cuối tuần giúp con trẻ rời xa màn hình điện thoại.',
    itinerary: [
      { time: '08:00 - 09:30', action: 'Khởi hành về huyện Phú Xuyên, ngắm khung cảnh đồng quê Bắc Bộ thanh bình.' },
      { time: '09:30 - 11:30', action: 'Vào xưởng tò he Xuân La, nghe nghệ nhân kể chuyện và xem bàn tay thoăn thoắt tạo hình con giống bột nếp.' },
      { time: '11:30 - 12:30', action: 'Các bé được tự tay nặn rồng phượng, bông hoa, chú ngựa từ khối bột màu tự nhiên an toàn tuyệt đối.' },
      { time: '12:30 - 14:00', action: 'Nghỉ trưa, thưởng thức ẩm thực đồng quê và mang về những sản phẩm tò he ngộ nghĩnh.' }
    ],
    highlightReason: 'Làng tò he duy nhất trên cả nước, nơi các em nhỏ say mê nặn bột ngũ sắc thành những nhân vật cổ tích và rèn luyện óc sáng tạo.'
  },

  'thach-xa': {
    slug: 'thach-xa',
    distanceKm: 32,
    traits: { cuisine: 78, photo: 86, history: 88, craft: 90, handsOn: 96, shopping: 90, family: 98, friends: 86, couples: 84, solo: 80, relax: 90 },
    keywords: ['thạch xá', 'chuồn chuồn tre', 'thăng bằng', 'chùa tây phương', 'chè lam', 'đồ chơi', 'tre', 'trẻ em', 'thạch thất', 'la hán'],
    matchTags: ['Chuồn chuồn tre thăng bằng', 'Chiêm bái Chùa Tây Phương', 'Đặc sản Chè lam tiến vua'],
    foodTips: [
      'Chè lam Thạch Xá dẻo quánh thơm cay ấm nồng gừng sẻ',
      'Bánh tẻ nóng giòn xứ Đoài chấm tương nếp',
      'Cơm lam nướng thơm dẻo chấm muối vừng'
    ],
    travelTip: 'Khoảng 32km theo đại lộ Thăng Long (45 phút xe chạy). Rất lý tưởng kết hợp leo núi vãn cảnh chùa Tây Phương và trải nghiệm làm chuồn chuồn tre.',
    itinerary: [
      { time: '08:00 - 09:00', action: 'Lướt trên đại lộ Thăng Long êm ru đến chân núi Câu Lậu (xã Thạch Xá, Thạch Thất).' },
      { time: '09:00 - 11:00', action: 'Leo 239 bậc đá ong chiêm bái Chùa Tây Phương, chiêm ngưỡng 18 pho tượng La Hán kiệt tác điêu khắc gỗ cổ.' },
      { time: '11:00 - 12:30', action: 'Vào xưởng chuồn chuồn tre, khám phá bí quyết uốn mỏ để chú chuồn chuồn tre đậu thăng bằng diệu kỳ trên đầu ngón tay.' },
      { time: '12:30 - 14:00', action: 'Tự tay tô màu lên cánh chuồn chuồn mang về làm kỷ niệm, thưởng thức chè lam xứ Đoài ngọt cay.' }
    ],
    highlightReason: 'Trải nghiệm chuồn chuồn tre thăng bằng kỳ diệu kết hợp vãn cảnh Chùa Tây Phương cổ kính và thưởng thức chè lam xứ Đoài nức tiếng.'
  },

  'chuong': {
    slug: 'chuong',
    distanceKm: 30,
    traits: { cuisine: 76, photo: 90, history: 88, craft: 90, handsOn: 92, shopping: 85, family: 78, friends: 88, couples: 84, solo: 88, relax: 98 },
    keywords: ['làng chuong', 'chuông', 'nón', 'nón lá', 'nón quai thao', 'nón bài thơ', 'chợ phiên', 'sông đáy', 'đình phương trung', 'yên bình', 'thanh oai'],
    matchTags: ['Làng Nón lá cổ sông Đáy', 'Chợ phiên rạng đông', 'Trải nghiệm khâu nón bài thơ'],
    foodTips: [
      'Bánh đúc nếp nóng chấm tương Cự Đà béo ngậy',
      'Gà đồi nướng đất sét bên bờ triền đê sông Đáy',
      'Bánh tẻ lá dong nóng giòn ngọt thịt'
    ],
    travelTip: 'Khoảng 30km (50 phút). Thích hợp phượt xe máy ngắm cảnh đê sông Đáy. Chợ phiên nón họp các ngày mùng 4, 10, 14, 20, 24, 28 âm lịch từ 6h sáng.',
    itinerary: [
      { time: '07:30 - 08:45', action: 'Chạy xe máy thong thả men theo triền đê sông Đáy rợp bóng cây cổ thụ về làng nón Chuông.' },
      { time: '08:45 - 11:00', action: 'Thăm đình cổ Phương Trung, ngắm các bà các cô chuốt nan tre và khâu từng vành nón trắng muốt.' },
      { time: '11:00 - 12:30', action: 'Tự tay lồng lá lụi, khâu chiếc nón bài thơ khắc họa hoa sen hoặc câu thơ duyên dáng mang về.' },
      { time: '12:30 - 14:00', action: 'Thưởng thức bánh đúc nóng chấm tương nếp béo ngậy bên quán nước chè ven sông gió mát.' }
    ],
    highlightReason: 'Không gian làng quê Bắc Bộ êm ả ven đê sông Đáy, lưu giữ nghệ thuật khâu nón lá bài thơ duyên dáng và những phiên chợ quê rạng đông.'
  },

  'phu-vinh': {
    slug: 'phu-vinh',
    distanceKm: 27,
    traits: { cuisine: 55, photo: 84, history: 82, craft: 98, handsOn: 90, shopping: 90, family: 78, friends: 82, couples: 80, solo: 88, relax: 94 },
    keywords: ['phú vinh', 'mây tre', 'đan', 'mây tre đan', 'sống xanh', 'decor', 'tranh mây', 'giỏ mây', 'nội thất mây', 'thủ công', 'chương mỹ'],
    matchTags: ['Kỳ tích Mây tre đan xuất khẩu', 'Không gian Decor Sống Xanh', 'Workshop đan nan mây'],
    foodTips: [
      'Bánh tẻ nếp Chương Mỹ chấm nước mắm tiêu',
      'Cá nướng rơm rạ đồng chiêm sông Bùi',
      'Rau sắn chua nấu canh tép đồng'
    ],
    travelTip: 'Cách trung tâm 27km (khoảng 50 phút) theo QL6 qua Hà Đông - Ba La. Rất phù hợp cho người yêu thích đồ thủ công decor xanh và mỹ thuật đan lát.',
    itinerary: [
      { time: '08:30 - 09:30', action: 'Di chuyển theo hướng QL6 về huyện Chương Mỹ, cảm nhận không khí rộn ràng của làng nghề đan lát.' },
      { time: '09:30 - 11:30', action: 'Chiêm ngưỡng bảo tàng tranh mây và các tác phẩm đan lát tinh xảo đạt kỷ lục xuất khẩu sang châu Âu.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức bữa trưa dân dã với cá nướng rơm và bánh tẻ nếp dẻo bùi.' },
      { time: '13:00 - 15:00', action: 'Tham gia workshop cầm nan mây dẻo, tự đan một chiếc giỏ hoa hoặc khay trà vintage mang về nhà.' }
    ],
    highlightReason: 'Đỉnh cao nghệ thuật đan mây tre Việt Nam, thế giới decor sống xanh mộc mạc và workshop đan nan mây cực kỳ cuốn hút.'
  },

  'trach-xa': {
    slug: 'trach-xa',
    distanceKm: 45,
    traits: { cuisine: 72, photo: 86, history: 100, craft: 96, handsOn: 75, shopping: 90, family: 68, friends: 76, couples: 80, solo: 98, relax: 86 },
    keywords: ['trạch xá', 'áo dài', 'khâu tay', 'giấu chỉ', 'tiền lê', 'nghìn năm', 'lịch sử', 'may áo dài', 'lụa', 'văn hóa cổ', 'ứng hòa'],
    matchTags: ['Cội nguồn Áo dài hơn 1.000 năm', 'Khâu tay giấu chỉ độc nhất', 'Bảo tồn di sản y phục Việt'],
    foodTips: [
      'Vịt quay Ứng Hòa giòn bì thơm phức hạt mắc khén',
      'Bánh đúc chấm mắm tôm chanh ớt cay nồng',
      'Canh riêu cá rô đồng đồng chiêm béo ngọt'
    ],
    travelTip: 'Khoảng 45km (75 phút) theo QL21B. Thích hợp cho chuyến đi 1 ngày tìm về cội nguồn di sản văn hóa và may đo chiếc áo dài vừa vặn tinh xảo.',
    itinerary: [
      { time: '08:00 - 09:30', action: 'Di chuyển về vùng đất Ứng Hòa cổ kính nơi khởi nguồn tà áo dài phụ nữ Việt từ thời vua Đinh - Tiền Lê.' },
      { time: '09:30 - 11:30', action: 'Gặp gỡ nghệ nhân cao niên, mục sở thị kỹ thuật cầm kim dọc khâu tay "giấu chỉ" một tay phẳng phiu kỳ tài.' },
      { time: '11:30 - 13:00', action: 'Ăn trưa đặc sản vịt quay giòn bì Ứng Hòa đậm đà hương vị đồng quê.' },
      { time: '13:00 - 15:00', action: 'Lựa chọn xấp lụa ưng ý và đặt may một chiếc áo dài truyền thống với đường kim mũi chỉ đo ni đóng giày.' }
    ],
    highlightReason: 'Làng nghề may áo dài cổ truyền hơn 1000 năm tuổi với kỹ thuật khâu tay giấu chỉ độc nhất vô nhị, nơi cất giữ linh hồn tà áo dài Việt Nam.'
  },

  'son-dong': {
    slug: 'son-dong',
    distanceKm: 18,
    traits: { cuisine: 60, photo: 78, history: 100, craft: 98, handsOn: 70, shopping: 80, family: 68, friends: 74, couples: 66, solo: 98, relax: 82 },
    keywords: ['sơn đồng', 'tượng', 'tạc tượng', 'gỗ', 'tượng phật', 'sơn son thếp vàng', 'đồ thờ', 'tâm linh', 'hoài đức', 'nghìn năm'],
    matchTags: ['Thủ phủ Tạc tượng Phật nghìn năm', 'Sơn son thếp vàng tâm linh', 'Kiến trúc điêu khắc xứ Đoài'],
    foodTips: [
      'Bánh gai Sơn Đồng nhân đậu xanh bùi béo',
      'Nem Phùng xứ Đoài thơm mùi thính gạo rang',
      'Trà ướp hoa sen cổ thanh tao'
    ],
    travelTip: 'Chỉ 18km (35 phút) theo đại lộ Thăng Long hoặc đường QL32 rẽ đường tỉnh 422. Rất phù hợp cho người say mê lịch sử kiến trúc điêu khắc tâm linh.',
    itinerary: [
      { time: '08:30 - 09:15', action: 'Di chuyển đến làng nghề điêu khắc mỹ nghệ Sơn Đồng (Hoài Đức).' },
      { time: '09:15 - 11:30', action: 'Thăm xưởng tạc tượng Phật nghìn mắt nghìn tay, ngắm những bức tượng gỗ mít sơn son thếp vàng lộng lẫy.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức nem Phùng giòn rụm và bánh gai nếp đen ngọt thơm xứ Đoài.' },
      { time: '13:00 - 15:00', action: 'Tìm hiểu quy chuẩn chạm khắc hoa văn rồng mây và cách pha sơn ta thếp vàng lá gia truyền.' }
    ],
    highlightReason: 'Nghìn năm lưu giữ tinh hoa tạc tượng Phật và đồ thờ sơn son thếp vàng cho hàng ngàn ngôi chùa cổ khắp cả nước.'
  },

  'chuyen-my': {
    slug: 'chuyen-my',
    distanceKm: 42,
    traits: { cuisine: 55, photo: 78, history: 98, craft: 100, handsOn: 74, shopping: 86, family: 68, friends: 74, couples: 70, solo: 96, relax: 84 },
    keywords: ['chuyên mỹ', 'chuôn ngọ', 'khảm trai', 'xà cừ', 'ốc cửu khổng', 'vỏ trai', 'tranh khảm', 'thời lý', 'tinh xảo', 'đồ gỗ', 'phú xuyên'],
    matchTags: ['Đỉnh cao Khảm xà cừ ngàn năm', 'Vỏ ốc cửu khổng ngũ sắc', 'Mỹ nghệ hoàng gia cao cấp'],
    foodTips: [
      'Bún bung hoa chuối ốc đồng nóng hổi cay nồng',
      'Bánh đúc lạc bùi béo chấm tương bần',
      'Cá trắm kho trám đen bùi ngọt'
    ],
    travelTip: 'Khoảng 42km theo QL1A cũ về Phú Xuyên. Thích hợp cho chuyến đi thưởng ngoạn nghệ thuật chạm khảm ốc xà cừ hoàng cung quý phái.',
    itinerary: [
      { time: '08:00 - 09:30', action: 'Khởi hành về làng Chuôn Ngọ (Chuyên Mỹ), cái nôi khảm trai xà cừ nghìn năm từ thời Lý.' },
      { time: '09:30 - 11:30', action: 'Xem nghệ nhân cưa lọng vỏ ốc cửu khổng lấp lánh ngũ sắc, đục gỗ hạ mảnh xà cừ khít khao không tì vết.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức tô bún bung hoa chuối ốc đồng nóng hổi đậm đà tình quê.' },
      { time: '13:00 - 15:00', action: 'Chiêm ngưỡng tranh khảm tích cổ và chọn mua hộp trà, khay gỗ khảm ốc sang trọng làm quà tân gia.' }
    ],
    highlightReason: 'Đỉnh cao nghệ thuật khảm xà cừ từ vỏ ốc biển ngũ sắc, chạm khắc tinh xảo từng sợi râu tôm cánh bướm lưu truyền từ thời Lý.'
  },

  'ha-thai': {
    slug: 'ha-thai',
    distanceKm: 20,
    traits: { cuisine: 55, photo: 84, history: 92, craft: 98, handsOn: 76, shopping: 88, family: 72, friends: 80, couples: 80, solo: 94, relax: 85 },
    keywords: ['hạ thái', 'sơn mài', 'vỏ trứng', 'sơn ta', 'tranh sơn mài', 'mài nước', 'bát đĩa sơn mài', 'thường tín', 'mỹ thuật'],
    matchTags: ['Kinh đô Sơn mài mỹ thuật', 'Dát vỏ trứng & mài nước kỳ công', 'Chỉ 20km từ trung tâm'],
    foodTips: [
      'Bánh gai Thường Tín nhân đậu xanh dừa nạo',
      'Chè sen long nhãn thơm ngọt dịu',
      'Canh chua cá rô đồng hoa súng'
    ],
    travelTip: 'Chỉ 20km (40 phút) theo đường Giải Phóng - QL1A cũ về Thường Tín. Rất thuận tiện đi xe máy hoặc xe buýt tuyến 06, 94.',
    itinerary: [
      { time: '08:30 - 09:30', action: 'Di chuyển theo tuyến QL1A cũ về làng sơn mài Hạ Thái (Thường Tín).' },
      { time: '09:30 - 11:30', action: 'Khám phá quy trình sơn mài kỳ công qua hàng chục lớp sơn mài ướt, kỹ thuật cẩn vỏ trứng và dát bạc vàng.' },
      { time: '11:30 - 13:00', action: 'Nghỉ trưa, thưởng thức bánh gai nếp thơm dẻo đặc sản Thường Tín.' },
      { time: '13:00 - 15:00', action: 'Tham quan các phòng tranh sơn mài mỹ thuật đương đại, chọn mua bình hoa, đĩa sơn mài quý phái.' }
    ],
    highlightReason: 'Nơi hội tụ những bàn tay tài hoa của nghệ thuật sơn mài truyền thống, kết hợp cẩn vỏ trứng và dát vàng bạc đạt đẳng cấp xuất khẩu.'
  },

  'kieu-ky': {
    slug: 'kieu-ky',
    distanceKm: 16,
    traits: { cuisine: 55, photo: 76, history: 94, craft: 96, handsOn: 72, shopping: 84, family: 72, friends: 75, couples: 72, solo: 92, relax: 80 },
    keywords: ['kiêu kỵ', 'dát vàng', 'quỳ vàng', 'đập quỳ', 'kim hoàn', 'thếp vàng', 'gia lâm', 'nguyễn quý trị', 'vàng quỳ'],
    matchTags: ['Làng Quỳ vàng độc nhất Việt Nam', 'Nghệ thuật đập quỳ & thếp vàng', 'Gần kề Bát Tràng (16km)'],
    foodTips: [
      'Bún riêu cua đồng Kiêu Kỵ béo ngậy gạch son',
      'Bánh khoai mật ngọt bùi nướng vỉ than',
      'Ổi găng Đông Dư giòn tan hái tại vườn'
    ],
    travelTip: 'Chỉ 16km (35 phút) qua cầu Vĩnh Tuy / Thanh Trì. Rất thuận tiện kết hợp đi Bát Tràng và Kiêu Kỵ trong cùng một ngày.',
    itinerary: [
      { time: '08:30 - 09:30', action: 'Khởi hành qua cầu Vĩnh Tuy đến làng dát vàng Kiêu Kỵ (Gia Lâm).' },
      { time: '09:30 - 11:30', action: 'Nghe tiếng đập quỳ chan chát nhịp nhàng, mục sở thị 1 chỉ vàng được đập mỏng thành hàng ngàn lá quỳ siêu nhẹ.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức tô bún riêu cua đồng thơm ngọt và thưởng thức ổi găng Đông Dư.' },
      { time: '13:00 - 15:00', action: 'Xem nghệ nhân cầm chổi lông thếp lá vàng lên đồ phong thủy dát vàng 24K rực rỡ.' }
    ],
    highlightReason: 'Làng nghề đập quỳ dát vàng duy nhất của Việt Nam, nơi biến những thỏi vàng ròng thành lá quỳ mỏng tang dát lên tượng Phật và di tích cổ.'
  },

  'chang-son': {
    slug: 'chang-son',
    distanceKm: 30,
    traits: { cuisine: 62, photo: 82, history: 90, craft: 92, handsOn: 88, shopping: 84, family: 82, friends: 82, couples: 78, solo: 86, relax: 90 },
    keywords: ['chàng sơn', 'quạt', 'quạt giấy', 'quạt lụa', 'quạt tranh', 'thạch thất', 'nan tre', 'chùa tây phương', 'xứ đoài'],
    matchTags: ['Quạt giấy nức tiếng Paris', 'Hội họa trên nan quạt tre', 'Không gian xứ Đoài thanh bình'],
    foodTips: [
      'Bánh tẻ nếp lá dong xứ Đoài dẻo giòn',
      'Chè lam thơm nồng mật mía gừng sẻ',
      'Cơm quê canh cua rau đay cà pháo'
    ],
    travelTip: 'Khoảng 30km (45 phút) theo đại lộ Thăng Long rẽ Thạch Thất. Có thể kết hợp thăm Chàng Sơn và Thạch Xá cùng một tuyến đường.',
    itinerary: [
      { time: '08:30 - 09:30', action: 'Di chuyển theo đại lộ Thăng Long về làng quạt cổ truyền Chàng Sơn (Thạch Thất).' },
      { time: '09:30 - 11:30', action: 'Thăm các xưởng quạt gia truyền, chiêm ngưỡng quạt tranh phong cảnh khổ lớn từng dự triển lãm Paris thế kỷ trước.' },
      { time: '11:30 - 13:00', action: 'Thưởng thức bữa trưa đậm vị thôn dã xứ Đoài với bánh tẻ nóng và chè lam ấm áp.' },
      { time: '13:00 - 15:00', action: 'Tự tay chọn một chiếc nan tre uốn lượn, dán giấy dó và vẽ bức tranh hoa lá lên chiếc quạt của riêng mình.' }
    ],
    highlightReason: 'Xứ sở của những chiếc quạt giấy dó, quạt lụa mỹ nghệ từng làm mê đắm nước Pháp thời thuộc địa, đậm đà hồn cốt xứ Đoài mây trắng.'
  }
};

export function generateRecommendations(answers: QuizAnswers): RecommendationResult[] {
  // Map through each village and score objectively
  const scoredVillages = CRAFT_VILLAGES.map(village => {
    const profile = VILLAGE_AI_PROFILES[village.slug] || {
      slug: village.slug,
      distanceKm: 25,
      traits: { cuisine: 70, photo: 75, history: 75, craft: 80, handsOn: 75, shopping: 75, family: 75, friends: 75, couples: 75, solo: 75, relax: 75 },
      keywords: [village.name.toLowerCase(), village.category.toLowerCase()],
      matchTags: [village.category, 'Làng nghề truyền thống'],
      foodTips: ['Cơm quê dân dã Bắc Bộ', 'Bánh tẻ nóng giòn', 'Trà sen thơm dịu'],
      travelTip: 'Nên khởi hành sáng sớm để có nhiều thời gian trải nghiệm.',
      itinerary: [
        { time: '08:30 - 09:30', action: `Di chuyển đến ${village.name}, ngắm cổng làng và không gian cổ kính.` },
        { time: '09:30 - 11:30', action: `Tham quan xưởng nghệ nhân, tìm hiểu quy trình làm nghề cổ truyền.` },
        { time: '11:30 - 13:00', action: 'Nghỉ trưa, thưởng thức ẩm thực truyền thống địa phương.' },
        { time: '13:00 - 15:00', action: 'Trải nghiệm workshop và chọn mua sản phẩm lưu niệm đặc trưng.' }
      ],
      highlightReason: `Trải nghiệm văn hóa ${village.category.toLowerCase()} đích thực cùng các nghệ nhân lão thành.`
    };

    let rawScore = 60; // Fair base score

    // 1. Interests matching (45% total interest weight)
    if (answers.interests && answers.interests.length > 0) {
      let interestSum = 0;
      for (const interest of answers.interests) {
        if (interest === 'ẩm thực') interestSum += profile.traits.cuisine * 0.45;
        else if (interest === 'chụp ảnh') interestSum += profile.traits.photo * 0.45;
        else if (interest === 'lịch sử') interestSum += profile.traits.history * 0.45;
        else if (interest === 'thủ công') interestSum += profile.traits.craft * 0.45;
        else if (interest === 'tự tay làm') interestSum += profile.traits.handsOn * 0.45;
        else if (interest === 'mua sắm') interestSum += profile.traits.shopping * 0.45;
      }
      rawScore += interestSum / answers.interests.length;
    }

    // 2. Trip Style matching (35% companion weight)
    if (answers.tripStyle === 'gia đình') rawScore += profile.traits.family * 0.35;
    else if (answers.tripStyle === 'bạn bè') rawScore += profile.traits.friends * 0.35;
    else if (answers.tripStyle === 'cặp đôi') rawScore += profile.traits.couples * 0.35;
    else if (answers.tripStyle === 'một mình') rawScore += profile.traits.solo * 0.35;
    else if (answers.tripStyle === 'thư giãn') rawScore += profile.traits.relax * 0.35;

    // 3. Time Available vs Distance Matching
    const dist = profile.distanceKm;
    if (answers.timeAvailable === '2-3h') {
      if (dist <= 14) rawScore += 35;       // Inner-ring villages (Mễ Trì 8km, Vạn Phúc 11km, Tây Tựu 13km, Bát Tràng 14km)
      else if (dist <= 18) rawScore += 25;  // Kiêu Kỵ, Sơn Đồng
      else if (dist <= 22) rawScore += 10;
      else rawScore -= (dist - 15) * 1.5;   // Heavy penalty for far villages (can't do 40km in 2h)
    } else if (answers.timeAvailable === 'nửa ngày') {
      if (dist <= 15) rawScore += 28;
      else if (dist <= 25) rawScore += 32;
      else if (dist <= 35) rawScore += 18;
      else rawScore += 5;
    } else if (answers.timeAvailable === '1 ngày') {
      if (dist >= 25) rawScore += 32;       // Day-trip villages get top bonus
      else if (dist >= 15) rawScore += 22;
      else rawScore += 12;
    } else if (answers.timeAvailable === 'cuối tuần') {
      if (dist >= 20) rawScore += 32;
      else rawScore += 20;
    }

    // 4. Priority matching (35% priority weight)
    if (answers.priority === 'trải nghiệm làm nghề') rawScore += profile.traits.handsOn * 0.35;
    else if (answers.priority === 'check-in sống ảo') rawScore += profile.traits.photo * 0.35;
    else if (answers.priority === 'tìm hiểu văn hóa') rawScore += profile.traits.history * 0.35;
    else if (answers.priority === 'mua quà lưu niệm') rawScore += profile.traits.shopping * 0.35;

    // 5. Custom Description Matching (Natural Language Processing)
    let customMatchReason = '';
    if (answers.customDescription && answers.customDescription.trim()) {
      const text = answers.customDescription.toLowerCase();

      // Check specific village keywords
      for (const kw of profile.keywords) {
        if (text.includes(kw)) {
          rawScore += 32;
          customMatchReason = `Khớp chính xác với mong muốn "${kw}" từ chia sẻ của bạn.`;
          break;
        }
      }

      // Semantic boosters
      if (text.includes('ẩm thực') || text.includes('ăn') || text.includes('ngon') || text.includes('cốm')) {
        rawScore += profile.traits.cuisine * 0.3;
      }
      if (text.includes('chụp ảnh') || text.includes('sống ảo') || text.includes('check-in') || text.includes('view')) {
        rawScore += profile.traits.photo * 0.3;
      }
      if (text.includes('trẻ em') || text.includes('bé') || text.includes('con nít') || text.includes('tuổi thơ')) {
        rawScore += profile.traits.family * 0.3;
      }
      if (text.includes('người yêu') || text.includes('bạn gái') || text.includes('bạn trai') || text.includes('hẹn hò') || text.includes('lãng mạn')) {
        rawScore += profile.traits.couples * 0.3;
      }
      if (text.includes('gần') || text.includes('2 tiếng') || text.includes('3 tiếng') || text.includes('nhanh')) {
        if (dist <= 15) rawScore += 25;
        else rawScore -= 25;
      }
    }

    // Dynamic tailored reasons
    const reasons: string[] = [];
    if (customMatchReason) {
      reasons.push(customMatchReason);
    }
    reasons.push(profile.highlightReason);

    // Reason based on distance and time
    if (answers.timeAvailable === '2-3h') {
      if (dist <= 14) {
        reasons.push(`Khoảng cách chỉ ${dist}km (${village.location.travelTime.split('bằng')[0].trim()}), lý tưởng tuyệt đối cho quỹ thời gian 2-3 giờ mà không tốn công di chuyển.`);
      }
    } else if (answers.timeAvailable === '1 ngày' || answers.timeAvailable === 'cuối tuần') {
      reasons.push('Không gian rộng rãi, thoáng đãng kết hợp nhiều hoạt động trải nghiệm giúp chuyến đi trọn vẹn và thư thái.');
    }

    // Reason based on companion
    if (answers.tripStyle === 'gia đình' && profile.traits.family >= 85) {
      reasons.push('Đặc biệt an toàn, bổ ích và tạo nhiều hứng thú sáng tạo cho cả gia đình cùng các bạn nhỏ.');
    } else if (answers.tripStyle === 'cặp đôi' && profile.traits.couples >= 85) {
      reasons.push('Khung cảnh lãng mạn, thơ mộng mang đến những phút giây hẹn hò êm đềm và bộ ảnh kỷ niệm ngọt ngào.');
    } else if (answers.tripStyle === 'bạn bè' && profile.traits.friends >= 85) {
      reasons.push('Địa điểm rộn ràng rất thích hợp cho nhóm bạn gắn kết, chụp ảnh nhóm và cùng thử thách sự khéo tay.');
    } else if (answers.tripStyle === 'một mình') {
      reasons.push('Không gian thanh tịnh để bạn tự do dạo bước, trò chuyện sâu cùng nghệ nhân và nạp lại năng lượng tâm hồn.');
    }

    return {
      village,
      rawScore,
      reasons,
      suggestedActivities: profile.matchTags.map(t => `Trải nghiệm ${t}`),
      itinerary: profile.itinerary,
      foodTips: profile.foodTips,
      travelTip: profile.travelTip,
      matchTags: profile.matchTags
    };
  });

  // Sort descending by rawScore
  scoredVillages.sort((a, b) => b.rawScore - a.rawScore);

  // Normalize scores into realistic percentages:
  // Top 1: 96-98%, Top 2: 90-93%, Top 3: 84-88%, rest: gradual taper
  const maxRaw = scoredVillages[0].rawScore;
  const minRaw = scoredVillages[scoredVillages.length - 1].rawScore;
  const range = Math.max(1, maxRaw - minRaw);

  return scoredVillages.map((item, idx) => {
    let normalizedPercentage: number;
    if (idx === 0) {
      normalizedPercentage = Math.min(98, Math.max(95, Math.round(95 + ((item.rawScore - minRaw) / range) * 3)));
    } else if (idx === 1) {
      normalizedPercentage = Math.min(93, Math.max(88, Math.round(88 + ((item.rawScore - minRaw) / range) * 5)));
    } else if (idx === 2) {
      normalizedPercentage = Math.min(87, Math.max(82, Math.round(82 + ((item.rawScore - minRaw) / range) * 5)));
    } else {
      const ratio = (item.rawScore - minRaw) / range;
      normalizedPercentage = Math.min(80, Math.max(65, Math.round(65 + ratio * 15)));
    }

    return {
      village: item.village,
      matchScore: normalizedPercentage,
      reasons: item.reasons,
      suggestedActivities: item.suggestedActivities,
      itinerary: item.itinerary,
      foodTips: item.foodTips,
      travelTip: item.travelTip,
      matchTags: item.matchTags
    };
  });
}

export async function askCraftAssistant(userQuery: string): Promise<string> {
  const query = userQuery.toLowerCase().trim();

  // 1. Specific village inquiries
  if (query.includes('mễ trì') || query.includes('cốm')) {
    return `🌾 **Làng Cốm Mễ Trì (Nam Từ Liêm) - Hương vị thu Hà Nội:**
- **Vị trí:** Cách trung tâm chỉ ~8km (15-20 phút xe máy/ô tô hoặc xe buýt 33, 50, 74).
- **Trải nghiệm nổi bật:** Nghe tiếng chày giã cốm nhịp nhàng, xem rang nếp cái hoa vàng trên chảo gang, tự tay gói cốm lá sen.
- **Món ngon trứ danh:** Cốm mộc tươi, xôi cốm hạt sen dừa nạo ngọt bùi, chả cốm chiên giòn, chè cốm hoa bưởi.
- **Lời khuyên:** Rất thích hợp cho chuyến đi nhanh 2-3 tiếng thưởng thức ẩm thực chuẩn vị Tràng An!`;
  }

  if (query.includes('quảng phú cầu') || query.includes('chân hương') || query.includes('làng hương')) {
    return `🏮 **Làng Hương Quảng Phú Cầu (Ứng Hòa) - Tọa độ triệu view:**
- **Vị trí:** Cách trung tâm ~35km (50 phút theo QL21B hoặc xe buýt 91 từ bến Yên Nghĩa).
- **Trải nghiệm nổi bật:** Check-in giữa biển chân hương xòe hoa đỏ thắm rực rỡ, tham quan xưởng nhuộm và se hương bài thơm thảo mộc tự nhiên.
- **Món ngon địa phương:** Vịt cỏ Vân Đình nướng than hoa da giòn, cháo vịt hạt sen béo ngậy.
- **Thời điểm đẹp nhất:** Sáng 08:00 - 10:30 trời nắng đẹp, góc chụp rộng từ trên cao rất ngoạn mục.`;
  }

  if (query.includes('tây tựu') || (query.includes('hoa') && !query.includes('vàng'))) {
    return `🌸 **Làng Hoa Tây Tựu (Bắc Từ Liêm) - Xứ sở ngàn hoa:**
- **Vị trí:** Chỉ 13km từ trung tâm (30 phút qua đường Hồ Tùng Mậu - Cầu Diễn - QL32).
- **Điểm nhấn:** Vựa hoa lớn nhất Hà Nội với bạt ngàn cúc họa mi, hoa ly, thược dược, hoa hồng nhung.
- **Phù hợp nhất:** Cặp đôi hẹn hò lãng mạn, chụp ảnh nàng thơ nhẹ nhàng vào buổi sớm mai.
- **Món ngon:** Bún đậu làng Đăm giòn thơm và ổi đào tươi hái tại vườn.`;
  }

  if (query.includes('đào thục') || query.includes('rối nước') || query.includes('múa rối')) {
    return `🎭 **Làng Múa Rối Nước Đào Thục (Đông Anh):**
- **Vị trí:** ~25km (45 phút qua cầu Nhật Tân / Đông Trù).
- **Trải nghiệm độc bản:** Thưởng thức múa rối nước tại Thủy đình cổ bên ao làng rợp bóng tre; đặc biệt các bé và gia đình được xắn quần lội nước sau mành sáo thử điều khiển chú Tễu cùng nghệ nhân.
- **Phù hợp nhất:** Gia đình có trẻ nhỏ và những ai yêu nghệ thuật dân gian truyền thống Bắc Bộ.`;
  }

  if (query.includes('vạn phúc') || query.includes('lụa')) {
    return `🧣 **Làng Lụa Vạn Phúc (Hà Đông) - Kinh đô tơ tằm nghìn năm:**
- **Cách đi nhanh nhất:** Đi tàu điện trên cao Cát Linh - Hà Đông (chỉ 15 phút đến ga Vạn Phúc), tản bộ 5 phút vào cổng làng.
- **Điểm check-in:** Con đường ô dù sắc màu rực rỡ, miếu Bà Chúa Lụa, các xưởng dệt lụa Vân tơ tằm cổ truyền.
- **Mua sắm:** Khăn lụa, áo dài, cà vạt tơ tằm cao cấp; thưởng thức bún chả Cầu Am nức tiếng.`;
  }

  if (query.includes('bát tràng') || query.includes('gốm')) {
    return `🏺 **Làng Gốm Bát Tràng (Gia Lâm):**
- **Vị trí:** Cách trung tâm ~14km (30-35 phút men theo đê sông Hồng hoặc xe buýt 47A).
- **Hoạt động chính:** Vuốt gốm thực tế trên bàn xoay, check-in Bảo tàng Gốm Bát Tràng 7 cánh xoắn ốc đất sét, dạo chợ gốm sắm ấm chén tử sa.
- **Ẩm thực đặc sắc:** Canh măng mực Bát Tràng (đặc sản tiến vua), su hào xào mực, chè củ mài bùi béo.`;
  }

  if (query.includes('xuân la') || query.includes('tò he')) {
    return `🎨 **Làng Tò He Xuân La (Phú Xuyên) - Tuổi thơ bột nếp:**
- **Vị trí:** ~40km về phía nam Hà Nội theo QL1A cũ.
- **Điểm đặc biệt:** Làng tò he duy nhất của Việt Nam. Các bé được tự tay nặn bột nếp hoa vàng pha màu tự nhiên thành rồng phượng, siêu nhân, bông hoa mang về.
- **Phù hợp:** Chuyến dã ngoại cuối tuần tuyệt vời cho gia đình và trẻ nhỏ.`;
  }

  if (query.includes('thạch xá') || query.includes('chuồn chuồn')) {
    return `🌿 **Làng Chuồn Chuồn Tre Thạch Xá (Thạch Thất):**
- **Vị trí:** 32km theo đại lộ Thăng Long (45 phút xe chạy).
- **Trải nghiệm:** Chiêm ngưỡng chú chuồn chuồn tre giữ thăng bằng kỳ diệu trên đầu ngón tay, tự tay tô màu nghệ thuật; kết hợp leo 239 bậc đá ong chiêm bái Chùa Tây Phương cổ kính.
- **Đặc sản:** Chè lam Thạch Xá ngọt cay nồng vị gừng và bánh tẻ nóng xứ Đoài.`;
  }

  if (query.includes('chuông') || query.includes('nón lá') || query.includes('nón')) {
    return `👒 **Làng Nón Chuông (Thanh Oai) - Hồn quê sông Đáy:**
- **Vị trí:** 30km (khoảng 50 phút chạy xe máy men theo triền đê xanh mát).
- **Điểm nhấn:** Nghệ thuật khâu nón bài thơ, nón quai thao thanh lịch; đình cổ Phương Trung rợp bóng cây; chợ phiên nón lá rạng sáng các ngày mùng 4, 10, 14, 20, 24, 28 âm lịch.
- **Món ngon:** Bánh đúc nếp nóng chấm tương Cự Đà béo ngậy.`;
  }

  if (query.includes('phú vinh') || query.includes('mây tre')) {
    return `🧺 **Làng Mây Tre Đan Phú Vinh (Chương Mỹ):**
- **Vị trí:** 27km theo hướng QL6 qua Hà Đông - Ba La.
- **Điểm nhấn:** Nghệ thuật đan nan mây siêu mịn xuất khẩu sang châu Âu, không gian sống xanh decor cực chill, chiêm ngưỡng các bức tranh mây đạt kỷ lục Việt Nam.`;
  }

  if (query.includes('trạch xá') || query.includes('may áo dài')) {
    return `🪡 **Làng May Áo Dài Trạch Xá (Ứng Hòa):**
- **Lịch sử:** Hơn 1.000 năm từ thời vua Đinh - Tiền Lê; cái nôi của tà áo dài Việt Nam.
- **Kỹ thuật độc nhất:** Cầm kim dọc khâu tay giấu chỉ một tay phẳng lì, đường may tinh xảo tôn vinh nét duyên dáng phụ nữ Việt.`;
  }

  if (query.includes('sơn đồng') || query.includes('tạc tượng')) {
    return `🪵 **Làng Điêu Khắc Gỗ Sơn Đồng (Hoài Đức):**
- **Vị trí:** Cách trung tâm chỉ 18km (35 phút).
- **Lịch sử:** Nghìn năm tạc tượng Phật nghìn mắt nghìn tay và đồ thờ sơn son thếp vàng cho hầu hết các ngôi chùa cổ Bắc Bộ.`;
  }

  if (query.includes('chuyên mỹ') || query.includes('khảm trai') || query.includes('chuôn ngọ')) {
    return `✨ **Làng Khảm Trai Chuyên Mỹ (Phú Xuyên):**
- **Lịch sử:** Bắt nguồn từ thời Lý; tinh hoa xẻ vỏ ốc cửu khổng ánh ngũ sắc cưa lọng đục gỗ khảm tranh, khay chén, đồ thờ hoàng gia cao cấp.`;
  }

  if (query.includes('hạ thái') || query.includes('sơn mài')) {
    return `🎨 **Làng Sơn Mài Hạ Thái (Thường Tín):**
- **Vị trí:** 20km theo QL1A cũ (40 phút).
- **Nghệ thuật:** Dát vỏ trứng, thếp vàng bạc và mài nước hơn 10 lớp công phu để tạo nên những bức tranh sơn mài mỹ thuật sang trọng bậc nhất.`;
  }

  if (query.includes('kiêu kỵ') || query.includes('dát vàng')) {
    return `🪙 **Làng Dát Vàng Kiêu Kỵ (Gia Lâm):**
- **Vị trí:** 16km từ trung tâm (ngay sát làng gốm Bát Tràng).
- **Độc bản:** Làng nghề đập quỳ vàng duy nhất Việt Nam; 1 chỉ vàng ròng được các nghệ nhân gõ đập mỏng thành hàng ngàn lá quỳ siêu nhẹ để dát lên tượng Phật và di tích cổ.`;
  }

  if (query.includes('chàng sơn') || query.includes('quạt')) {
    return `🪭 **Làng Quạt Giấy Chàng Sơn (Thạch Thất):**
- **Vị trí:** 30km theo đại lộ Thăng Long.
- **Lịch sử:** Quạt tranh Chàng Sơn từng được mang sang triển lãm tại Paris; nghệ thuật vẽ phong cảnh làng quê xứ Đoài thanh bình lên nan quạt tre.`;
  }

  // 2. Topic-based inquiries
  if (query.includes('gia đình') || query.includes('trẻ em') || query.includes('con nít') || query.includes('bé')) {
    return `👨‍👩‍👧‍👦 **Top 3 Làng Nghề Lý Tưởng Nhất Cho Gia Đình & Trẻ Nhỏ:**
1. **Làng múa rối nước Đào Thục (Đông Anh):** Bé xem chú Tễu phun nước, lội nước sau buồng trò học điều khiển con rối gỗ cùng nghệ nhân.
2. **Làng tò he Xuân La (Phú Xuyên):** Bé tự tay nặn bột nếp thơm ngát thành siêu nhân, bông hoa, con giống sắc màu an toàn tuyệt đối.
3. **Làng chuồn chuồn tre Thạch Xá (Thạch Thất):** Khám phá chuồn chuồn tre đậu thăng bằng trên ngón tay, kết hợp vãn cảnh chùa Tây Phương trong lành.`;
  }

  if (query.includes('chụp ảnh') || query.includes('sống ảo') || query.includes('check-in') || query.includes('view')) {
    return `📸 **Top 3 Tọa Độ Sống Ảo "Triệu View" Làng Nghề Hà Nội:**
1. **Làng hương Quảng Phú Cầu:** Sân phơi hàng triệu bó chân hương nở hoa đỏ thắm rực rỡ, điểm check-in nổi tiếng trên báo chí quốc tế.
2. **Làng hoa Tây Tựu:** Cánh đồng hoa cúc, hoa ly bạt ngàn vào sớm mai cho bộ ảnh nàng thơ ngọt ngào.
3. **Làng lụa Vạn Phúc:** Phố ô dù sắc màu bay bổng và tường bích họa làng lụa chụp áo dài cực kỳ thanh tao.`;
  }

  if (query.includes('ẩm thực') || query.includes('ăn gì') || query.includes('món ngon') || query.includes('đặc sản')) {
    return `🍲 **Tinh Hoa Ẩm Thực Làng Nghề Không Thể Bỏ Qua:**
- **Cốm Mễ Trì:** Cốm tươi lá sen, xôi cốm dừa hạt sen, chả cốm giòn thơm chuẩn vị thu Hà Nội.
- **Canh măng mực Bát Tràng:** Món cỗ tiến vua độc nhất vô nhị chỉ có ở làng gốm bên sông Hồng.
- **Vịt cỏ Vân Đình (Quảng Phú Cầu):** Vịt nướng than hoa da giòn béo ngậy ăn cùng cháo vịt hạt sen.
- **Bánh đúc nếp Làng Chuông:** Bánh đúc nóng dẻo quánh chấm tương bần Cự Đà béo bùi.
- **Chè lam Thạch Xá:** Vị ngọt thanh mật mía cay nồng gừng sẻ nhâm nhi bên tách trà sen.`;
  }

  if (query.includes('gần') || query.includes('2 tiếng') || query.includes('3 tiếng') || query.includes('nhanh')) {
    return `⚡ **Điểm Đến Gần Trung Tâm (< 15km, Đi Nhanh 2 - 3 Giờ):**
1. **Làng cốm Mễ Trì (8km - 15 phút):** Gần nhất, thỏa sức thưởng thức đặc sản cốm tươi và mua quà biếu.
2. **Làng lụa Vạn Phúc (11km - 15 phút):** Đi tàu điện Cát Linh cực nhanh, phố ô dù đẹp và mua sắm lụa.
3. **Làng hoa Tây Tựu (13km - 30 phút):** Ngắm đồng hoa bạt ngàn vào sáng sớm hoặc chiều tà.
4. **Làng gốm Bát Tràng (14km - 35 phút):** Vuốt gốm bàn xoay và check-in Bảo tàng 7 cánh xoắn ốc.`;
  }

  if (query.includes('ngân sách') || query.includes('chi phí') || query.includes('giá') || query.includes('tiền') || query.includes('vé') || query.includes('500')) {
    return `💰 **Gợi Ý Chi Phí Khám Phá Làng Nghề (Chỉ từ 200k - 400k/người):**
- **Đi Vạn Phúc (khoảng 200.000đ):** Vé tàu điện trên cao khứ hồi (30k) + Ăn bún chả Cầu Am (40k) + Cà phê ven sông (35k) + Quà lưu niệm nhỏ xinh (95k).
- **Đi Bát Tràng (khoảng 350.000đ):** Xe buýt 47A khứ hồi (16k) + Vé Bảo tàng Gốm (50k) + Trải nghiệm vuốt gốm bàn xoay (50k) + Cỗ canh măng mực (150k) + Mua chiếc cốc gốm (50k).
- **Đi Quảng Phú Cầu (khoảng 300.000đ):** Xe buýt 91 (18k) + Vé chụp ảnh sân hương (50k) + Bữa trưa mẹt vịt cỏ Vân Đình (200k).`;
  }

  // Default helpful overview
  return `Chào bạn! Tôi là **Trợ lý AI Làng nghề Hà Nội**. Tôi nắm rõ dữ liệu của toàn bộ **16 làng nghề truyền thống Thủ đô** (Bát Tràng, Mễ Trì, Vạn Phúc, Quảng Phú Cầu, Tây Tựu, Đào Thục, Xuân La, Thạch Xá, làng Chuông, Phú Vinh, Trạch Xá, Sơn Đồng, Chuyên Mỹ, Hạ Thái, Kiêu Kỵ, Chàng Sơn).

Bạn có thể hỏi tôi bất kỳ điều gì, ví dụ:
- *"Làng nghề nào hợp cho gia đình có trẻ nhỏ?"*
- *"Có chỗ nào chụp ảnh sống ảo triệu view không?"*
- *"Mình chỉ rảnh 2-3 tiếng thì nên đi làng nghề nào gần nhất?"*
- *"Đến Mễ Trì / Bát Tràng / Quảng Phú Cầu thì ăn món gì ngon nhất?"*
- *"Có 300k thì nên đi làng nào và đi bằng xe buýt ra sao?"*`;
}

import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';

export interface AiResponseResult {
  reply: string;
  source: 'gemini-1.5-flash' | 'local-expert-engine';
  suggestedFollowUps?: string[];
  relatedVillageSlug?: string;
}

// Normalized text helper without accents
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Word boundary phrase matcher
function hasPhrase(normalizedText: string, phrase: string): boolean {
  const normPhrase = normalize(phrase);
  const regex = new RegExp(`(^|\\s)${normPhrase}(\\s|$)`, 'i');
  return regex.test(normalizedText);
}

function hasAnyPhrase(normalizedText: string, phrases: string[]): boolean {
  return phrases.some(p => hasPhrase(normalizedText, p));
}

// Rich Village Knowledge Base with comprehensive logistical and cultural data
interface VillageKnowledge {
  slug: string;
  name: string;
  aliases: string[];
  district: string;
  distanceKm: number;
  travelTime: string;
  busRoutes: string;
  motorbikeRoute: string;
  ticketPrice: string;
  workshopPrice: string;
  topHighlights: string[];
  signatureFoods: { name: string; desc: string; price: string }[];
  photoSpots: string[];
  bestTime: string;
  targetAudience: string;
  comboVillage?: string;
  summary: string;
}

export const VILLAGE_KNOWLEDGE: Record<string, VillageKnowledge> = {
  'bat-trang': {
    slug: 'bat-trang',
    name: 'Làng Gốm Bát Tràng',
    aliases: ['bat trang', 'gom', 'gom su', 'dat set', 'to tuong', 'vuot gom', 'lo bau', 'men ran'],
    district: 'Gia Lâm',
    distanceKm: 14,
    travelTime: '30 - 35 phút',
    busRoutes: 'Xe buýt tuyến 47A (Long Biên - Bát Tràng, 8.000đ/vé, 15 phút/chuyến) hoặc tuyến 47B',
    motorbikeRoute: 'Men theo đường đê Nguyễn Khoái qua cầu Thanh Trì/Vĩnh Tuy rồi rẽ đê Bát Tràng',
    ticketPrice: 'Vào làng miễn phí. Vé Bảo tàng Gốm Bát Tràng: 50.000đ/người lớn, 30.000đ/trẻ em',
    workshopPrice: 'Trải nghiệm ngồi bàn xoay vuốt gốm: 40.000đ - 60.000đ/sản phẩm; nung và tráng men: 30.000đ - 50.000đ',
    topHighlights: [
      'Bảo tàng Gốm Bát Tràng (Trung tâm Tinh hoa Làng nghề Việt) với 7 cánh xoắn ốc đất nung khổng lồ',
      'Xưởng vuốt gốm trên bàn xoay thủ công cùng nghệ nhân',
      'Chợ gốm Bát Tràng sầm uất với hàng ngàn mẫu ấm chén tử sa, bát đĩa men rạn cổ',
      'Nhà cổ Vạn Vân trưng bày cổ vật gốm từ thế kỷ 15'
    ],
    signatureFoods: [
      { name: 'Canh măng mực Bát Tràng', desc: 'Món cỗ tiến vua danh bất hư truyền nấu từ măng nứa khô và mực khô xé sợi nhỏ như tơ', price: '120.000đ - 180.000đ/bát' },
      { name: 'Su hào xào mực', desc: 'Su hào thái chỉ giòn sần sật quyện vị ngọt đậm đà của mực khô', price: '80.000đ - 120.000đ/đĩa' },
      { name: 'Chè củ mài', desc: 'Món tráng miệng thanh mát giải nhiệt', price: '20.000đ - 30.000đ/bát' },
      { name: 'Bánh chè lam gừng', desc: 'Bánh dẻo thơm nồng vị gừng cay nhâm nhi cùng trà xanh', price: '30.000đ/hộp' }
    ],
    photoSpots: [
      'Kiến trúc 7 vòng xoay đất nung độc nhất vô nhị tại Bảo tàng Gốm Bát Tràng (tầng 1 & sân thượng)',
      'Góc bàn xoay gốm với đôi bàn tay lấm lem đất sét mộc mạc',
      'Bức tường phơi gốm mộc trong các ngõ nhỏ ngoằn ngoèo rêu phong'
    ],
    bestTime: 'Mùa thu và mùa đông (tháng 9 đến tháng 3), tiết trời mát mẻ tản bộ ven sông Hồng rất thích',
    targetAudience: 'Gia đình có trẻ em, cặp đôi hẹn hò, nhóm bạn trẻ trải nghiệm vuốt gốm',
    comboVillage: 'Kiêu Kỵ (chỉ cách 3km, kết hợp Gốm + Dát vàng quỳ)',
    summary: 'Làng gốm hơn 700 năm tuổi ven sông Hồng, nổi tiếng với kỹ thuật bàn xoay vuốt tay và men rạn cổ kính.'
  },

  'me-tri': {
    slug: 'me-tri',
    name: 'Làng Cốm Mễ Trì',
    aliases: ['me tri', 'com', 'com non', 'com me tri', 'xoi com', 'cha com', 'che com', 'gia com'],
    district: 'Nam Từ Liêm',
    distanceKm: 8,
    travelTime: '15 - 20 phút',
    busRoutes: 'Tuyến buýt 33, 50, 74, 107 (xuống trạm Đỗ Đức Dục hoặc Mễ Trì Thượng)',
    motorbikeRoute: 'Đi đường Cầu Giấy - Phạm Hùng rẽ Đỗ Đức Dục hoặc từ Đại lộ Thăng Long vào cổng làng',
    ticketPrice: 'Miễn phí hoàn toàn',
    workshopPrice: 'Giao lưu học gói cốm lá sen và giã cốm cùng nghệ nhân (thường miễn phí khi mua cốm)',
    topHighlights: [
      'Tận mắt xem lò rang thóc nếp hoa vàng trên chảo gang đỏ lửa',
      'Lắng nghe tiếng chày giã cốm nhịp đôi nhịp ba rộn rã đầu ngõ',
      'Trải nghiệm gói cốm mộc bằng 2 lớp lá sen thơm và buộc lạt rơm tươi mộc mạc',
      'Cổng làng cổ Mễ Trì Thượng và đình làng ngàn năm'
    ],
    signatureFoods: [
      { name: 'Cốm mộc tươi bọc lá sen', desc: 'Hạt cốm xanh màu mạ non, dẻo thơm ngào ngạt', price: '250.000đ - 280.000đ/kg (gói nhỏ 50.000đ)' },
      { name: 'Xôi cốm hạt sen dừa nạo', desc: 'Món ngon nức tiếng mùa thu Hà Nội, ngọt bùi hạt sen và béo ngậy dừa tươi', price: '30.000đ - 50.000đ/phần' },
      { name: 'Chả cốm chiên phồng', desc: 'Vỏ ngoài giòn rụm, nhân cốm dẻo quánh chấm nước mắm cốt cay', price: '220.000đ/kg' },
      { name: 'Chè cốm hoa bưởi', desc: 'Thanh mát ngọt dịu ướp hương hoa bưởi vườn', price: '25.000đ/cốc' }
    ],
    photoSpots: [
      'Góc nia cốm xanh mướt trải lá sen tươi bên hiên nhà gỗ cổ',
      'Khoảnh khắc sàng sảy vỏ trấu dưới nắng vàng mùa thu',
      'Cổng đình Mễ Trì Thượng rợp bóng cây đa cổ thụ'
    ],
    bestTime: 'Mùa thu (tháng 8 đến tháng 11 âm lịch) - vụ mùa cốm nếp cái hoa vàng rộ nhất năm',
    targetAudience: 'Người sành ăn, khách du lịch ẩm thực, người có ít thời gian (2-3 giờ)',
    comboVillage: 'Làng lụa Vạn Phúc (chỉ cách 5km theo trục Tố Hữu)',
    summary: 'Cái nôi Di sản Văn hóa Phi vật thể Quốc gia, biểu tượng ẩm thực thanh tao bậc nhất của mùa thu thủ đô.'
  },

  'van-phuc': {
    slug: 'van-phuc',
    name: 'Làng Lụa Vạn Phúc',
    aliases: ['van phuc', 'lua', 'lua ha dong', 'ao dai', 'to tam', 'con duong o', 'det lua'],
    district: 'Hà Đông',
    distanceKm: 11,
    travelTime: '20 - 30 phút (Đi tàu điện Cát Linh chỉ 15 phút)',
    busRoutes: 'Tàu điện Cát Linh - Hà Đông (ga Vạn Phúc) hoặc buýt 19, 21A, 27, 33, 57',
    motorbikeRoute: 'Từ ngã tư Sở đi thẳng đường Nguyễn Trãi - Trần Phú (Hà Đông) rẽ vào đường Vạn Phúc',
    ticketPrice: 'Miễn phí dạo phố và tham quan xưởng dệt',
    workshopPrice: 'Học cách nhận biết lụa tơ tằm thật và trải nghiệm dệt thử: miễn phí tại các gian hàng',
    topHighlights: [
      'Con đường ô dù sắc màu rực rỡ dài hàng trăm mét ngập tràn không khí lễ hội',
      'Bức tường bích họa làng lụa tái hiện cảnh ươm tơ, dệt lụa, chăn tằm',
      'Miếu thờ Bà Chúa Lụa A Lã Thị Nương - người truyền nghề dệt lụa hơn 1.000 năm trước',
      'Hàng chục cửa hàng trưng bày lụa Vân tơ tằm mềm mại, thoáng mát bốn mùa'
    ],
    signatureFoods: [
      { name: 'Bún chả Cầu Am', desc: 'Thịt nướng than hoa thơm lừng gia truyền nức tiếng đất Hà Đông', price: '35.000đ - 50.000đ/suất' },
      { name: 'Bánh cuốn nóng tráng tay', desc: 'Bánh tráng mỏng tang, rắc hành phi thơm nức và chả quế giòn', price: '30.000đ/đĩa' },
      { name: 'Chè sen long nhãn', desc: 'Ngọt thanh bọc cùi nhãn Hưng Yên giòn ngọt', price: '25.000đ/cốc' }
    ],
    photoSpots: [
      'Đứng dưới tán hàng trăm chiếc ô dù rực rỡ ánh sáng',
      'Tạo dáng cùng áo dài tơ tằm bên cầu gỗ và tường bích họa',
      'Bên khung dệt cửi gỗ cổ truyền với những thoi tơ óng ả'
    ],
    bestTime: 'Quanh năm, đặc biệt dịp Lễ hội Làng lụa Vạn Phúc vào tháng 11',
    targetAudience: 'Phụ nữ mua sắm áo dài lụa, các cặp đôi, gia đình đi tàu điện dạo chơi',
    comboVillage: 'Làng mây tre đan Phú Vinh (tiếp tục theo QL6 thêm 16km)',
    summary: 'Kinh đô dệt lụa tơ tằm cổ kính nhất Việt Nam với dòng lụa Vân tinh xảo từng dâng vua triều Nguyễn.'
  },

  'quang-phu-cau': {
    slug: 'quang-phu-cau',
    name: 'Làng Hương Quảng Phú Cầu',
    aliases: ['quang phu cau', 'huong', 'chan huong', 'lang huong', 'tam huong', 'huong do'],
    district: 'Ứng Hòa',
    distanceKm: 35,
    travelTime: '50 - 60 phút',
    busRoutes: 'Xe buýt tuyến 91 (Bến xe Yên Nghĩa - Phú Túc, đỗ ngay đầu cổng làng hương)',
    motorbikeRoute: 'Từ Hà Đông đi theo QL21B thẳng hướng Chợ Dầu - Ứng Hòa',
    ticketPrice: 'Vào làng miễn phí. Phí check-in chụp ảnh tại các sân phơi hương lớn: 50.000đ/người',
    workshopPrice: 'Trải nghiệm se hương thảo mộc thủ công: 50.000đ/người (kèm quà tặng bó hương)',
    topHighlights: [
      'Biển hoa chân hương rực rỡ sắc đỏ, vàng, hồng xếp hình bản đồ Việt Nam, ngôi sao',
      'Xưởng chẻ vầu, ngâm nhuộm tăm hương bằng thảo mộc tự nhiên',
      'Thưởng thức mùi thơm thanh tịnh của bột trầm, hồi, quế, đinh hương lan tỏa khắp ngõ xóm'
    ],
    signatureFoods: [
      { name: 'Vịt cỏ Vân Đình nướng than', desc: 'Đặc sản trứ danh Ứng Hòa ngay sát làng hương, thịt ngọt chắc không mỡ, da giòn', price: '180.000đ - 220.000đ/con' },
      { name: 'Cháo vịt hạt sen', desc: 'Cháo sánh ngọt ninh từ nước luộc vịt ăn kèm tiết luộc', price: '30.000đ/bát' },
      { name: 'Xôi bắp mỡ hành', desc: 'Hạt ngô dẻo quánh thơm lừng', price: '20.000đ/phần' }
    ],
    photoSpots: [
      'Góc chụp flycam hoặc từ thang cao nhìn xuống những đóa hoa chân hương đỏ rực',
      'Ngồi giữa những con đường tạo bởi các bó chân hương xòe rộng',
      'Khoảnh khắc người thợ tung bó tăm hương như pháo hoa'
    ],
    bestTime: 'Buổi sáng từ 08:00 - 10:30 trời nắng trong veo, phơi hương rực rỡ nhất; đặc biệt rộn ràng vào dịp giáp Tết',
    targetAudience: 'Nhiếp ảnh gia, bạn trẻ thích chụp ảnh sống ảo, du khách quốc tế',
    comboVillage: 'Làng may áo dài Trạch Xá (cùng huyện Ứng Hòa, cách 10km)',
    summary: 'Tọa độ check-in sống ảo triệu view nổi tiếng thế giới với những thảm chân hương đỏ thắm xòe hoa kỳ ảo.'
  },

  'tay-tuu': {
    slug: 'tay-tuu',
    name: 'Làng Hoa Tây Tựu',
    aliases: ['tay tuu', 'hoa', 'vuon hoa', 'canh dong hoa', 'cuc hoa mi', 'hoa ly', 'hoa hong'],
    district: 'Bắc Từ Liêm',
    distanceKm: 13,
    travelTime: '25 - 30 phút',
    busRoutes: 'Xe buýt tuyến 29 (Giáp Bát - Tân Lập) hoặc tuyến 57, 20A',
    motorbikeRoute: 'Đi đường Cầu Giấy - Hồ Tùng Mậu - Cầu Diễn theo QL32 rẽ vào Tây Tựu',
    ticketPrice: 'Vào vườn ngắm hoa chụp ảnh: 20.000đ - 50.000đ tùy chủ vườn hoa',
    workshopPrice: 'Tự tay chọn cắt hoa tại gốc và bó hoa nghệ thuật: tính theo giá hoa sỉ tận vườn',
    topHighlights: [
      'Cánh đồng hoa bạt ngàn ngút tầm mắt với hàng trăm loài: cúc, thược dược, đồng tiền, hoa ly, hồng',
      'Chợ hoa đêm Tây Tựu rực sáng ánh đèn và hương hoa thơm ngát',
      'Không khí lao động sớm mai của những người nông dân thu hoạch hoa'
    ],
    signatureFoods: [
      { name: 'Bún đậu làng Đăm', desc: 'Bún lá sợi nhỏ chấm mắm tôm nguyên chất ăn kèm đậu phụ rán giòn', price: '30.000đ - 45.000đ/mẹt' },
      { name: 'Ổi đào Tây Tựu', desc: 'Ổi giòn ngọt ruột hồng hái ăn ngay tại vườn', price: '25.000đ/kg' }
    ],
    photoSpots: [
      'Đứng giữa luống hoa cúc họa mi trắng tinh khôi vào đầu đông',
      'Chụp ngược sáng bình minh trên cánh đồng hoa ly hé nở',
      'Xe chở hoa rực rỡ sắc màu rời làng đi chợ sớm'
    ],
    bestTime: 'Sáng sớm 06:30 - 08:30 khi sương mai đọng trên cánh hoa; mùa hoa đẹp nhất là từ tháng 10 đến Tết âm lịch',
    targetAudience: 'Cặp đôi chụp ảnh lãng mạn, các bạn nữ mê hoa, người yêu thích chụp ảnh thiên nhiên',
    comboVillage: 'Làng điêu khắc gỗ Sơn Đồng (cách 6km theo đường 422)',
    summary: 'Vựa hoa lớn nhất thủ đô, cung cấp hoa tươi rực rỡ cho toàn miền Bắc suốt bốn mùa.'
  },

  'dao-thuc': {
    slug: 'dao-thuc',
    name: 'Làng Múa Rối Nước Đào Thục',
    aliases: ['dao thuc', 'roi nuoc', 'mua roi', 'chu teu', 'thuy dinh', 'dong anh'],
    district: 'Đông Anh',
    distanceKm: 25,
    travelTime: '40 - 50 phút',
    busRoutes: 'Xe buýt tuyến 65 (Thụy Lâm - Long Biên) hoặc tuyến 15, 17, 43 qua Đông Anh',
    motorbikeRoute: 'Qua cầu Nhật Tân hoặc cầu Đông Trù, men theo QL3 rẽ về hướng Thụy Lâm - Đào Thục',
    ticketPrice: 'Xem biểu diễn múa rối nước trọn gói: 1.000.000đ - 1.500.000đ/đoàn diễn riêng (hoặc 50.000đ/người nếu ghép đoàn)',
    workshopPrice: 'Trải nghiệm lội nước sau cánh gà cầm sào điều khiển con rối và giao lưu nghệ nhân: 50.000đ/người',
    topHighlights: [
      'Thủy đình cổ kính soi bóng mặt ao làng rợp bóng tre xanh mướt',
      'Hơn 20 tích trò rối nước dân gian độc bản: Chú Tễu giáo trò, đánh cá, chọi trâu, múa rồng phun lửa',
      'Trực tiếp xắn quần lội nước sau mành sáo học cách cầm dây, sào điều khiển con rối gỗ',
      'Xưởng chế tác con rối gỗ sung ngâm nước mộc mạc'
    ],
    signatureFoods: [
      { name: 'Gà đồi Đông Anh nướng than', desc: 'Thịt gà chắc ngọt nướng thơm phức ăn cùng xôi nếp nương', price: '250.000đ/con' },
      { name: 'Bánh chưng Tranh Khúc', desc: 'Bánh chưng vuông vức xanh mướt dẻo rền', price: '60.000đ/chiếc' },
      { name: 'Cơm quê cà pháo tương nếp', desc: 'Mâm cơm Bắc Bộ dân dã thanh đạm', price: '70.000đ/suất' }
    ],
    photoSpots: [
      'Thủy đình ngói đỏ phản chiếu trên làn nước xanh ngắt',
      'Chụp ảnh cùng chú Tễu gỗ cười tươi rói',
      'Đứng bên bờ ao làng rợp bóng tre làng quê Bắc Bộ thanh bình'
    ],
    bestTime: 'Cuối tuần quanh năm, nên liên hệ đặt lịch trước với Trưởng phường rối',
    targetAudience: 'Gia đình có trẻ em (số 1), trường học dã ngoại, du khách yêu văn hóa dân gian',
    comboVillage: 'Khu di tích Cổ Loa thành (cách 8km)',
    summary: 'Phường rối nước dân gian hơn 300 năm tuổi, nơi các em nhỏ được trực tiếp lội nước điều khiển chú Tễu.'
  },

  'xuan-la': {
    slug: 'xuan-la',
    name: 'Làng Tò He Xuân La',
    aliases: ['xuan la', 'to he', 'nan to he', 'bot nep', 'do choi dan gian', 'phu xuyen'],
    district: 'Phú Xuyên',
    distanceKm: 40,
    travelTime: '60 - 70 phút',
    busRoutes: 'Xe buýt tuyến 06 (Giáp Bát - Phú Xuyên) hoặc tuyến 101, 108',
    motorbikeRoute: 'Theo trục QL1A cũ xuôi về phía nam qua Thường Tín đến huyện Phú Xuyên rẽ vào Xuân La',
    ticketPrice: 'Vào làng miễn phí',
    workshopPrice: 'Khóa học nặn tò he cùng nghệ nhân (được mang 3-5 con tò he về nhà): 30.000đ - 50.000đ/bé',
    topHighlights: [
      'Làng nghề tò he duy nhất của cả nước lưu giữ đồ chơi dân gian tuổi thơ',
      'Khám phá bí quyết pha màu bột nếp từ cây cỏ tự nhiên (lá riềng, gấc, củ nghệ, tro bếp)',
      'Bàn tay nghệ nhân thoăn thoắt biến khối bột thành rồng phượng, chú bộ đội, Tôn Ngộ Không, Elsa...',
      'Bé được tự tay nặn, gắn que tre và thỏa sức sáng tạo hình thù mình thích'
    ],
    signatureFoods: [
      { name: 'Bánh đa gấc Phú Xuyên', desc: 'Bánh đa đỏ tươi vị gấc giòn rụm rắc mè vừng thơm nức', price: '15.000đ/chiếc' },
      { name: 'Kẹo lạc kẹo dồi nóng', desc: 'Nhâm nhi bên ấm trà xanh ngọt bùi', price: '25.000đ/túi' }
    ],
    photoSpots: [
      'Chùm tò he ngũ sắc cắm trên cây chuối xốp rực rỡ',
      'Nụ cười hân hoan của bé khi hoàn thành tác phẩm tò he đầu tay',
      'Đôi bàn tay tài hoa của nghệ nhân đang nặn cánh hoa sen'
    ],
    bestTime: 'Cuối tuần, dịp Tết Trung Thu và đầu xuân trẩy hội',
    targetAudience: 'Gia đình có con nhỏ, bạn trẻ tìm lại ký ức tuổi thơ',
    comboVillage: 'Làng khảm trai Chuyên Mỹ (cùng huyện Phú Xuyên, cách 7km)',
    summary: 'Thủ phủ đồ chơi dân gian bột nếp duy nhất Việt Nam, nơi ươm mầm sáng tạo và gắn kết tình cảm gia đình.'
  },

  'thach-xa': {
    slug: 'thach-xa',
    name: 'Làng Chuồn Chuồn Tre Thạch Xá',
    aliases: ['thach xa', 'chuon chuon tre', 'chuon chuon thang bang', 'chua tay phuong', 'che lam', 'thach that'],
    district: 'Thạch Thất',
    distanceKm: 32,
    travelTime: '45 phút',
    busRoutes: 'Xe buýt tuyến 89 (Bến xe Yên Nghĩa - Sơn Tây) xuống ngã ba Chùa Tây Phương',
    motorbikeRoute: 'Lướt trên Đại lộ Thăng Long êm ái khoảng 28km rẽ vào đường tỉnh 419 lên Chùa Tây Phương',
    ticketPrice: 'Vào xưởng tre miễn phí. Vé vãn cảnh Chùa Tây Phương: 10.000đ/người',
    workshopPrice: 'Tô màu chuồn chuồn tre mang về: 20.000đ - 35.000đ/con',
    topHighlights: [
      'Bí quyết vót tre uốn mỏ để chú chuồn chuồn tre đậu thăng bằng hoàn hảo trên đầu ngón tay hay cành cây',
      'Tự tay dùng cọ vẽ chấm sơn nghệ thuật lên đôi cánh tre',
      'Leo 239 bậc đá ong chiêm bái Chùa Tây Phương cổ kính với 18 pho tượng La Hán kiệt tác quốc gia',
      'Các xưởng làm chè lam tiến vua thơm nồng mùi gừng nếp'
    ],
    signatureFoods: [
      { name: 'Chè lam Thạch Xá', desc: 'Bánh chè lam dẻo quánh nấu mật mía, gừng cay ấm nồng và lạc rang bùi ngậy', price: '25.000đ - 35.000đ/hộp' },
      { name: 'Bánh tẻ nóng giòn', desc: 'Bánh tẻ lá dong nhân thịt mộc nhĩ giòn ngọt', price: '8.000đ/chiếc' },
      { name: 'Cơm lam muối vừng', desc: 'Ống nứa nướng thơm phức', price: '15.000đ/ống' }
    ],
    photoSpots: [
      'Đặt chú chuồn chuồn tre thăng bằng trên đầu ngón tay chụp cận cảnh',
      'Bậc thang đá ong cổ kính rợp bóng cây đại ngàn năm tại Chùa Tây Phương',
      'Dàn phơi chuồn chuồn tre rực rỡ sắc màu trước sân nhà'
    ],
    bestTime: 'Mùa xuân đi lễ chùa, mùa hè thu mát mẻ trong lành',
    targetAudience: 'Gia đình, bạn trẻ thích dã ngoại thiên nhiên kết hợp tâm linh',
    comboVillage: 'Làng quạt Chàng Sơn (sát cạnh chỉ cách 2km)',
    summary: 'Nổi tiếng với chú chuồn chuồn tre thăng bằng kỳ diệu kết hợp vãn cảnh Chùa Tây Phương cổ kính.'
  },

  'chuong': {
    slug: 'chuong',
    name: 'Làng Nón Chuông',
    aliases: ['lang chuong', 'chuong', 'non la', 'non quai thao', 'non bai tho', 'thanh oai'],
    district: 'Thanh Oai',
    distanceKm: 30,
    travelTime: '50 phút',
    busRoutes: 'Xe buýt tuyến 103A (Bến xe Mỹ Đình - Hương Sơn) hoặc tuyến 91 rẽ sang',
    motorbikeRoute: 'Men theo trục QL21B hoặc đi đường đê sông Đáy qua Ba La - Thanh Oai',
    ticketPrice: 'Miễn phí hoàn toàn',
    workshopPrice: 'Trải nghiệm khâu nón và vẽ tranh nón: 50.000đ - 80.000đ/chiếc (được mang nón về)',
    topHighlights: [
      'Chợ phiên nón Chuông họp từ 6 giờ sáng vào các ngày mùng 4, 10, 14, 20, 24, 28 âm lịch',
      'Nghệ thuật xếp lá lụi trắng muốt, chuốt nan tre và khâu từng mũi kim giấu chỉ đều tăm tắp',
      'Nón bài thơ soi lên ánh nắng hiện lên hình chùa Một Cột hoặc câu thơ duyên dáng',
      'Đình Phương Trung cổ kính rợp bóng cây ven triền đê'
    ],
    signatureFoods: [
      { name: 'Bánh đúc nếp chấm tương Cự Đà', desc: 'Bánh đúc nóng mềm mướt, lạc bùi béo chấm tương nếp lên men thơm ngọt', price: '20.000đ/bát' },
      { name: 'Gà đồi nướng đất sét', desc: 'Thịt gà chắc ngọt thơm mùi lá chanh', price: '220.000đ/con' }
    ],
    photoSpots: [
      'Phiên chợ nón sáng sớm với hàng ngàn vành nón trắng xếp chồng',
      'Đội chiếc nón quai thao mặc áo tứ thân chụp ảnh bên bến đò sông Đáy',
      'Bà cụ móm mém cười hiền bên khung khâu nón lá'
    ],
    bestTime: 'Đi đúng ngày chợ phiên âm lịch (mùng 4, 10, 14, 20, 24, 28) từ 06:00 - 08:30 sáng',
    targetAudience: 'Người yêu nhiếp ảnh hoài cổ, du khách tìm kiếm sự bình yên thôn dã',
    comboVillage: 'Làng hương Quảng Phú Cầu (tiếp tục xuôi theo QL21B thêm 12km)',
    summary: 'Cái nôi nón lá bài thơ duyên dáng ven dòng sông Đáy, lưu giữ những phiên chợ quê rạng đông mộc mạc.'
  },

  'phu-vinh': {
    slug: 'phu-vinh',
    name: 'Làng Mây Tre Đan Phú Vinh',
    aliases: ['phu vinh', 'may tre', 'may tre dan', 'dan may', 'chuong my', 'sach', 'decor'],
    district: 'Chương Mỹ',
    distanceKm: 27,
    travelTime: '45 - 50 phút',
    busRoutes: 'Xe buýt tuyến 57 (Nam Thăng Long - KCN Phú Nghĩa) hoặc tuyến 72, 87',
    motorbikeRoute: 'Theo QL6 qua Hà Đông - Ba La - Chúc Sơn rồi rẽ vào xã Phú Nghĩa',
    ticketPrice: 'Miễn phí tham quan',
    workshopPrice: 'Học đan giỏ hoa, khay đựng đồ bằng nan mây: 60.000đ - 100.000đ/sản phẩm',
    topHighlights: [
      'Bảo tàng nghệ thuật mây tre đan với những bức tranh chân dung Bác Hồ đan bằng nan mây mỏng như sợi tóc',
      'Kỹ thuật đan hoa văn sương cá, đan mắt cáo đạt chuẩn xuất khẩu sang châu Âu và Nhật Bản',
      'Thế giới decor sống xanh: đèn mây, ghế mây, khay trà, giỏ picnic vintage siêu đẹp'
    ],
    signatureFoods: [
      { name: 'Bánh tẻ Chương Mỹ', desc: 'Bánh mềm dẻo chấm nước mắm nhĩ tiêu ớt cay', price: '8.000đ/chiếc' },
      { name: 'Cá sông Bùi nướng rơm', desc: 'Cá đồng nướng rơm rạ thơm phức ngọt thịt', price: '120.000đ/con' }
    ],
    photoSpots: [
      'Không gian trưng bày đồ decor mây tre phong cách Scandinavian / Indochine cực chill',
      'Bàn tay nghệ nhân đan những đường nan mây thoăn thoắt',
      'Sân phơi nan tre óng ả dưới nắng'
    ],
    bestTime: 'Mùa thu đông thời tiết khô ráo, thích hợp sắm đồ trang trí nhà cửa cuối năm',
    targetAudience: 'Người mê đồ decor vintage, sống xanh, kiến trúc sư, giới trẻ yêu thích thủ công mỹ nghệ',
    comboVillage: 'Làng lụa Vạn Phúc (nằm trên cùng trục đường QL6)',
    summary: 'Đỉnh cao nghệ thuật đan lát mây tre Việt Nam, biến những nan tre thô ráp thành tác phẩm nghệ thuật tinh mỹ.'
  },

  'trach-xa': {
    slug: 'trach-xa',
    name: 'Làng May Áo Dài Trạch Xá',
    aliases: ['trach xa', 'may ao dai', 'ao dai trach xa', 'giau chi', 'ung hoa'],
    district: 'Ứng Hòa',
    distanceKm: 45,
    travelTime: '70 - 75 phút',
    busRoutes: 'Xe buýt tuyến 103B hoặc tuyến 101 qua Ứng Hòa',
    motorbikeRoute: 'Theo QL21B qua thị trấn Vân Đình rồi rẽ đường tỉnh 428 về Trạch Xá',
    ticketPrice: 'Miễn phí tham quan',
    workshopPrice: 'Đặt may đo áo dài thủ công lấy theo số đo cá nhân: từ 500.000đ - 1.500.000đ/bộ',
    topHighlights: [
      'Làng nghề hơn 1.000 năm tuổi từ thời Tiền Lê, bà tổ nghề là Thứ phi Nguyễn Thị Sen',
      'Kỹ thuật cầm kim dọc khâu tay "giấu chỉ" độc nhất vô nhị: đường chỉ lặn vào trong, tà áo phẳng lì không nhăn rúm',
      'Đo may áo dài chuẩn xác chỉ bằng một cái liếc mắt của nghệ nhân cao niên'
    ],
    signatureFoods: [
      { name: 'Vịt quay Ứng Hòa', desc: 'Vịt quay giòn bì thơm phức mắc khén hạt dổi', price: '200.000đ/con' },
      { name: 'Bánh đúc mắm tôm', desc: 'Món ăn dân dã giòn mát', price: '20.000đ/đĩa' }
    ],
    photoSpots: [
      'Những sấp vải lụa gấm rực rỡ treo trên khung gỗ cổ kính',
      'Nghệ nhân cầm kim khâu tay dọc theo tà áo dài truyền thống',
      'Đền thờ Tổ nghề May Nguyễn Thị Sen uy nghiêm'
    ],
    bestTime: 'Dịp mùa thu và mùa cưới giáp Tết (từ tháng 9 đến tháng 1 âm lịch)',
    targetAudience: 'Những người yêu nét đẹp áo dài truyền thống, nghiên cứu văn hóa y phục Việt',
    comboVillage: 'Làng hương Quảng Phú Cầu (cùng huyện Ứng Hòa, cách 10km)',
    summary: 'Cội nguồn tà áo dài phụ nữ Việt Nam hơn 1000 năm tuổi với tuyệt kỹ khâu tay giấu chỉ độc nhất vô nhị.'
  },

  'son-dong': {
    slug: 'son-dong',
    name: 'Làng Tạc Tượng Sơn Đồng',
    aliases: ['son dong', 'tac tuong', 'tuong phat', 'son son thep vang', 'do tho', 'hoai duc'],
    district: 'Hoài Đức',
    distanceKm: 18,
    travelTime: '35 phút',
    busRoutes: 'Xe buýt tuyến 74, 88 hoặc buýt 19, 50 chuyển tuyến',
    motorbikeRoute: 'Từ Big C Thăng Long đi Đại lộ Thăng Long khoảng 10km rẽ đường tỉnh 422 đến Sơn Đồng',
    ticketPrice: 'Miễn phí tham quan xưởng',
    workshopPrice: 'Học chạm khắc hoa văn rồng mây cơ bản: 50.000đ/buổi',
    topHighlights: [
      'Nghìn năm tạc tượng Phật nghìn mắt nghìn tay, Tam Thế Phật cho hầu hết chùa chiền Bắc Bộ',
      'Kỹ thuật sơn son thếp vàng lá 24K gia truyền lộng lẫy và bền màu hàng trăm năm',
      'Mùi hương gỗ mít, gỗ dổi thơm ngát lan tỏa khắp các xưởng điêu khắc'
    ],
    signatureFoods: [
      { name: 'Nem Phùng xứ Đoài', desc: 'Nem thính gạo rang vàng thơm lừng cuốn lá sung chấm tương ớt', price: '35.000đ/gói' },
      { name: 'Bánh gai Sơn Đồng', desc: 'Bánh nếp đen dẻo quánh nhân đậu xanh dừa ngọt bùi', price: '10.000đ/chiếc' }
    ],
    photoSpots: [
      'Những pho tượng Phật khổng lồ đang trong quá trình tạo tác thô mộc mạc',
      'Khoảnh khắc nghệ nhân dát từng lá vàng lấp lánh lên tòa sen',
      'Cổng đình làng Sơn Đồng cổ kính'
    ],
    bestTime: 'Dịp cuối năm khi các làng chùa tấp nập đặt tượng thờ mới',
    targetAudience: 'Người say mê kiến trúc cổ, nghệ thuật điêu khắc tâm linh và đồ gỗ mỹ nghệ',
    comboVillage: 'Làng hoa Tây Tựu (cách 6km)',
    summary: 'Thánh địa điêu khắc tượng Phật và đồ thờ sơn son thếp vàng lộng lẫy nhất miền Bắc.'
  },

  'chuyen-my': {
    slug: 'chuyen-my',
    name: 'Làng Khảm Trai Chuyên Mỹ (Chuôn Ngọ)',
    aliases: ['chuyen my', 'chuon ngo', 'kham trai', 'xa cu', 'vo oc', 'oc cuu khong', 'phu xuyen'],
    district: 'Phú Xuyên',
    distanceKm: 42,
    travelTime: '65 - 70 phút',
    busRoutes: 'Xe buýt tuyến 06 (Giáp Bát - Phú Xuyên) rẽ xe ôm/taxi vào Chuôn Ngọ',
    motorbikeRoute: 'Theo QL1A cũ về Phú Xuyên, qua thị trấn rẽ đê sông Nhuệ về Chuyên Mỹ',
    ticketPrice: 'Miễn phí',
    workshopPrice: 'Xem nghệ nhân cưa lọng vỏ ốc và tự tay mài miếng xà cừ: miễn phí tại các xưởng lớn',
    topHighlights: [
      'Cái nôi khảm xà cừ nghìn năm từ thời Lý do danh tướng Trương Công Thành truyền nghề',
      'Sử dụng vỏ ốc cửu khổng quý hiếm nhập khẩu từ Singapore, Indonesia lấp lánh ánh ngũ sắc kỳ ảo',
      'Kỹ thuật cưa lọng chi tiết sợi tóc và hạ mảnh xà cừ phẳng lì vào thớ gỗ không một kẽ hở'
    ],
    signatureFoods: [
      { name: 'Bún bung hoa chuối ốc đồng', desc: 'Tô bún nóng hổi chua thanh vị mẻ giòn sần sật', price: '35.000đ/bát' },
      { name: 'Cá trắm kho trám đen', desc: 'Thịt cá chắc ngọt đượm vị bùi béo của quả trám', price: '80.000đ/niêu' }
    ],
    photoSpots: [
      'Những mảnh vỏ ốc xà cừ óng ánh đổi màu dưới ánh mặt trời',
      'Bức tranh khảm tích cổ Tứ quý, Thuận buồm xuôi gió lộng lẫy',
      'Nghệ nhân già đeo kính lúp cưa từng đường nét tinh xảo'
    ],
    bestTime: 'Mùa thu đông mát mẻ, chuẩn bị đón Tết',
    targetAudience: 'Người sưu tầm mỹ nghệ cao cấp, khách tìm quà tặng tân gia / đối tác sang trọng',
    comboVillage: 'Làng tò he Xuân La (cùng huyện Phú Xuyên, cách 7km)',
    summary: 'Đỉnh cao chạm khảm xà cừ vỏ ốc ngũ sắc hoàng gia lưu truyền nghìn năm từ thời Lý.'
  },

  'ha-thai': {
    slug: 'ha-thai',
    name: 'Làng Sơn Mài Hạ Thái',
    aliases: ['ha thai', 'son mai', 'son ta', 'can vo trung', 'dat bac', 'thuong tin'],
    district: 'Thường Tín',
    distanceKm: 20,
    travelTime: '35 - 40 phút',
    busRoutes: 'Xe buýt tuyến 06A, 06B, 94 (Bến xe Giáp Bát về Thường Tín)',
    motorbikeRoute: 'Theo đường Giải Phóng - QL1A cũ qua thị trấn Thường Tín rẽ vào xã Duyên Thái',
    ticketPrice: 'Miễn phí tham quan',
    workshopPrice: 'Trải nghiệm mài nước tranh sơn mài và cẩn vỏ trứng: 70.000đ - 120.000đ/người',
    topHighlights: [
      'Nghệ thuật sơn mài kết hợp chất liệu truyền thống (sơn ta, nhựa cây sơn) với vỏ trứng, vỏ trai, vàng bạc',
      'Quy trình mài nước kỳ công qua hàng chục lớp sơn để làm hiện lên những tầng màu kỳ ảo',
      'Các sản phẩm bát đĩa, bình hoa, khay trà sơn mài mỹ nghệ xuất khẩu sang hơn 30 quốc gia'
    ],
    signatureFoods: [
      { name: 'Bánh gai Thường Tín', desc: 'Vỏ bánh lá gai thơm phức nhân đậu xanh dừa nạo', price: '12.000đ/chiếc' },
      { name: 'Canh cá rô đồng hoa súng', desc: 'Món canh thanh mát hương đồng nội', price: '60.000đ/bát' }
    ],
    photoSpots: [
      'Phòng tranh sơn mài đương đại với ánh sáng nghệ thuật huyền ảo',
      'Khu vực mài nước với những vệt màu loang tự nhiên như tranh trừu tượng',
      'Bình hoa sơn mài dát vàng óng ả'
    ],
    bestTime: 'Quanh năm, rất gần trung tâm tiện đi lại trong nửa ngày',
    targetAudience: 'Người yêu hội họa, mỹ thuật đương đại, khách tìm đồ lưu niệm decor tinh tế',
    comboVillage: 'Làng dát vàng Kiêu Kỵ (cách 18km qua cầu Thanh Trì)',
    summary: 'Kinh đô sơn mài mỹ thuật thủ đô với kỹ thuật cẩn vỏ trứng và mài nước kỳ công bậc thầy.'
  },

  'kieu-ky': {
    slug: 'kieu-ky',
    name: 'Làng Dát Vàng Kiêu Kỵ',
    aliases: ['kieu ky', 'dat vang', 'quy vang', 'dap quy', 'kim hoan', 'thep vang', 'gia lam'],
    district: 'Gia Lâm',
    distanceKm: 16,
    travelTime: '30 - 35 phút',
    busRoutes: 'Xe buýt tuyến 47B hoặc các tuyến qua Gia Lâm / Ecopark',
    motorbikeRoute: 'Qua cầu Vĩnh Tuy hoặc cầu Thanh Trì, đi đường đê Bát Tràng rẽ vào Kiêu Kỵ',
    ticketPrice: 'Miễn phí',
    workshopPrice: 'Chiêm ngưỡng kỹ thuật đập quỳ và thử cầm chổi lông thếp lá vàng: miễn phí giao lưu',
    topHighlights: [
      'Làng nghề đập quỳ vàng bạc duy nhất của Việt Nam có lịch sử gần 400 năm',
      'Kỳ tài biến 1 chỉ vàng ròng qua hàng vạn nhát búa đập thành gần 1.000 lá quỳ mỏng tang siêu nhẹ',
      'Nghệ nhân dùng chổi lông chuyên dụng nhấc lá vàng dát lên tượng Phật và hoành phi câu đối'
    ],
    signatureFoods: [
      { name: 'Bún riêu cua Kiêu Kỵ', desc: 'Bún riêu nấu dấm bỗng thơm nức gạch cua đồng béo ngậy', price: '30.000đ/bát' },
      { name: 'Ổi găng Đông Dư', desc: 'Ổi găng giòn ngọt nức tiếng vùng bãi bồi sông Hồng', price: '20.000đ/kg' }
    ],
    photoSpots: [
      'Ánh vàng lấp lánh của những thệp quỳ vàng dưới ánh đèn xưởng cổ',
      'Bàn tay nghệ nhân tỉ mỉ cầm nhíp gắp từng lá vàng mỏng như cánh ve',
      'Cổng đình thờ cụ tổ nghề Nguyễn Quý Trị'
    ],
    bestTime: 'Quanh năm, đặc biệt ngày giỗ tổ nghề 17 tháng 8 âm lịch',
    targetAudience: 'Khách yêu thích kim hoàn, đồ thủ công quý hiếm, kết hợp tham quan Bát Tràng',
    comboVillage: 'Làng gốm Bát Tràng (sát vách chỉ cách 3km, tạo thành tour Gốm - Vàng hoàn hảo)',
    summary: 'Làng đập quỳ dát vàng độc nhất vô nhị của Việt Nam, biến vàng ròng thành những lá quỳ mỏng như cánh ve.'
  },

  'chang-son': {
    slug: 'chang-son',
    name: 'Làng Quạt Chàng Sơn',
    aliases: ['chang son', 'quat', 'quat giay', 'quat lua', 'quat tranh', 'thach that'],
    district: 'Thạch Thất',
    distanceKm: 30,
    travelTime: '45 phút',
    busRoutes: 'Xe buýt tuyến 89 (Yên Nghĩa - Sơn Tây) xuống ngã tư Thạch Thất',
    motorbikeRoute: 'Theo Đại lộ Thăng Long khoảng 27km rẽ vào huyện Thạch Thất đến Chàng Sơn',
    ticketPrice: 'Miễn phí',
    workshopPrice: 'Tự tay dán giấy dó và vẽ tranh phong cảnh lên chiếc quạt nan tre: 30.000đ - 50.000đ/chiếc',
    topHighlights: [
      'Làng quạt giấy nức tiếng từng được người Pháp mang đi tham dự Triển lãm Paris thế kỷ trước',
      'Quạt tranh phong cảnh vẽ Chùa Một Cột, Vịnh Hạ Long, thôn dã Bắc Bộ trên giấy dó mộc mạc',
      'Quạt lụa mỹ nghệ tinh tế xua tan cái nóng oi ả ngày hè'
    ],
    signatureFoods: [
      { name: 'Bánh tẻ nếp lá dong', desc: 'Bánh tẻ dẻo bùi chấm tương nếp thơm ngon', price: '8.000đ/chiếc' },
      { name: 'Chè lam xứ Đoài', desc: 'Bánh chè lam cay thơm ấm bụng', price: '25.000đ/hộp' }
    ],
    photoSpots: [
      'Những chiếc quạt giấy khổng lồ đường kính 2-3 mét mở rộng như cánh chim',
      'Dáng ngồi vẽ tranh tỉ mỉ của nghệ nhân bên khung tre',
      'Ngõ cổ đá ong xứ Đoài trầm mặc'
    ],
    bestTime: 'Mùa hè và mùa thu',
    targetAudience: 'Người thích hội họa dân gian, đồ lưu niệm truyền thống thanh lịch',
    comboVillage: 'Làng chuồn chuồn tre Thạch Xá & Chùa Tây Phương (chỉ cách 2km)',
    summary: 'Xứ sở quạt giấy dó và quạt lụa mỹ nghệ từng làm mê đắm Paris, mang đậm hồn cốt xứ Đoài mây trắng.'
  }
};

// Tour combos
export const COMBO_TOURS = [
  {
    title: 'Tour 1: Tinh Hoa Đất & Vàng (Bát Tràng - Kiêu Kỵ)',
    distance: '14 - 16km từ trung tâm',
    duration: '1 ngày hoặc nửa ngày',
    highlights: 'Sáng vuốt gốm Bát Tràng và thăm Bảo tàng Gốm xoắn ốc -> Ăn canh măng mực -> Chiều sang Kiêu Kỵ xem đập quỳ dát vàng 24K.',
    cost: 'Khoảng 250k - 350k/người'
  },
  {
    title: 'Tour 2: Dấu Ấn Xứ Đoài (Thạch Xá - Chàng Sơn - Chùa Tây Phương)',
    distance: '30 - 32km theo Đại lộ Thăng Long',
    duration: '1 ngày trọn vẹn',
    highlights: 'Leo 239 bậc đá ong chiêm bái Chùa Tây Phương -> Làm chuồn chuồn tre thăng bằng -> Sang Chàng Sơn vẽ quạt giấy dó -> Thưởng thức chè lam xứ Đoài.',
    cost: 'Khoảng 200k - 300k/người'
  },
  {
    title: 'Tour 3: Biển Đỏ & Áo Dài Di Sản (Quảng Phú Cầu - Trạch Xá)',
    distance: '35 - 45km theo QL21B Ứng Hòa',
    duration: '1 ngày',
    highlights: 'Sáng sớm 8h check-in thảm chân hương đỏ rực Quảng Phú Cầu -> Ăn trưa vịt cỏ Vân Đình nướng giòn -> Chiều về Trạch Xá mục sở thị kỹ thuật khâu tay áo dài giấu chỉ 1000 năm.',
    cost: 'Khoảng 300k - 400k/người'
  },
  {
    title: 'Tour 4: Sắc Màu Tuổi Thơ & Xà Cừ (Chuyên Mỹ - Xuân La)',
    distance: '40 - 42km theo QL1A Phú Xuyên',
    duration: '1 ngày dã ngoại',
    highlights: 'Ngắm nghệ thuật khảm trai vỏ ốc ngũ sắc Chuôn Ngọ -> Sang làng Xuân La cho các bé tự tay nặn tò he bột nếp ngũ sắc -> Ăn bánh đa gấc.',
    cost: 'Khoảng 200k - 300k/người'
  },
  {
    title: 'Tour 5: Dạo Chơi Nội Đô (Mễ Trì - Làng Lụa Vạn Phúc)',
    distance: '8 - 11km rất gần trung tâm',
    duration: 'Nửa ngày (3 - 4 tiếng)',
    highlights: 'Thưởng thức xôi cốm lá sen và xem lò rang cốm Mễ Trì -> Đi tàu điện Cát Linh 15 phút sang Vạn Phúc dạo con đường ô dù và sắm khăn lụa tơ tằm.',
    cost: 'Khoảng 150k - 250k/người'
  }
];

// Deep Heuristic Intelligence Engine
export function generateSmartLocalAnswer(rawQuery: string): AiResponseResult {
  const q = rawQuery.trim();
  const n = normalize(q);

  // Default follow-up chips
  const defaultChips = [
    'Làng nghề nào gần trung tâm nhất?',
    'Chỗ nào chụp ảnh sống ảo triệu view?',
    'Làng nghề nào hợp cho gia đình có trẻ em?',
    'Đặc sản ẩm thực làng nghề nào ngon nhất?'
  ];

  // Flexible Intent Checkers
  const isFoodIntent = hasAnyPhrase(n, [
    'an gi', 'an mon gi', 'mon gi ngon', 'mon ngon', 'dac san',
    'am thuc', 'quan an', 'an uong', 'mon an', 'an trua', 'an toi'
  ]) || (hasPhrase(n, 'an') && (hasPhrase(n, 'ngon') || hasPhrase(n, 'dac san') || hasPhrase(n, 'gi')));

  const isTransportIntent = hasAnyPhrase(n, [
    'duong di', 'xe buyt', 'cach di', 'xe may', 'o to', 'bao xa',
    'km', 'di chuyen', 'tuyen buyt', 'xe bus', 'tau dien', 'huong di'
  ]);

  const isPricingIntent = hasAnyPhrase(n, [
    'gia ve', 'chi phi', 'gia tien', 'workshop', 'bao nhieu tien',
    'ton bao nhieu', 've vao', 'gia ca', 'bang gia'
  ]);

  const isPhotoIntent = hasAnyPhrase(n, [
    'chup anh', 'song ao', 'view', 'goc chup', 'check in', 'trang phuc',
    'mac gi', 'anh dep', 'chup hinh'
  ]);

  // Find all mentioned villages in the query
  const mentionedVillages: VillageKnowledge[] = [];
  for (const vk of Object.values(VILLAGE_KNOWLEDGE)) {
    if (vk.aliases.some(alias => hasPhrase(n, alias))) {
      mentionedVillages.push(vk);
    }
  }

  // 1. MULTI-VILLAGE FOOD COMPARISON / INQUIRY
  // E.g. "Đến Mễ Trì / Bát Tràng / Quảng Phú Cầu thì ăn món gì ngon nhất?"
  if (mentionedVillages.length > 1 && isFoodIntent) {
    const list = mentionedVillages.map(v => {
      const topFood = v.signatureFoods.map(f => `  + **${f.name}** (${f.price}): ${f.desc}`).join('\n');
      return `🏮 **Tại ${v.name} (${v.district}):**\n${topFood}`;
    }).join('\n\n');

    return {
      reply: `🍲 **Thực Đơn Đặc Sản Tuyệt Hảo Tại Các Làng Nghề Bạn Hỏi:**

${list}

💡 **Mách nhỏ:** Cả ${mentionedVillages.map(v => v.name).join(', ')} đều có phong vị ẩm thực riêng biệt đậm chất Bắc Bộ. Bạn nên thưởng thức nóng hổi ngay tại làng để cảm nhận trọn vẹn hương vị nhé!`,
      source: 'local-expert-engine',
      suggestedFollowUps: mentionedVillages.map(v => `Cách đi đến ${v.name}?`)
    };
  }

  // 2. COMPARISON INTENT
  const isComparison = hasAnyPhrase(n, ['so sanh', 'khac gi', 'nen di dau', 'nen chon']) ||
    (hasPhrase(n, 'va') && (hasPhrase(n, 'nen di') || hasPhrase(n, 'hay la') || hasPhrase(n, 'tot hon')));

  if (isComparison && mentionedVillages.length >= 2) {
    const v1 = mentionedVillages[0];
    const v2 = mentionedVillages[1];

    return {
      reply: `⚖️ **So sánh ${v1.name} và ${v2.name}:**

| Tiêu chí | ${v1.name} | ${v2.name} |
| :--- | :--- | :--- |
| **Vị trí** | ${v1.district} (${v1.distanceKm}km) | ${v2.district} (${v2.distanceKm}km) |
| **Thời gian đi** | ${v1.travelTime} | ${v2.travelTime} |
| **Cách đi tiện nhất** | ${v1.busRoutes.split('(')[0].trim()} | ${v2.busRoutes.split('(')[0].trim()} |
| **Trải nghiệm chính** | ${v1.topHighlights[0]} | ${v2.topHighlights[0]} |
| **Món ngon đặc sắc** | ${v1.signatureFoods[0].name} | ${v2.signatureFoods[0].name} |
| **Thích hợp cho** | ${v1.targetAudience} | ${v2.targetAudience} |

💡 **Lời khuyên từ AI:** Cả 2 làng đều rất độc đáo! Nếu bạn muốn tìm hiểu kỹ hơn về làng nào, hãy bấm vào các gợi ý bên dưới để xem chi tiết!`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        `Chi tiết lịch trình ${v1.name}?`,
        `Chi tiết lịch trình ${v2.name}?`,
        `Món ngon ở ${v1.name}?`
      ]
    };
  }

  // 3. GIFTS / SOUVENIRS / TÂN GIA / QUÀ TẶNG
  if (hasAnyPhrase(n, ['mua qua', 'qua tang', 'tang sep', 'tan gia', 'tang me', 'tang nguoi yeu', 'tang ban gai', 'luu niem', 'qua bieu', 'mua gi ve lam qua', 'mua gi lam qua'])) {
    return {
      reply: `🎁 **Gợi Ý Quà Lưu Niệm & Quà Biếu Đậm Đà Bản Sắc Hà Nội:**

- 💼 **Tặng Sếp / Quà Tân Gia / Đối Tác Sang Trọng:**
  - **Tranh khảm xà cừ Chuyên Mỹ:** Khảm vỏ ốc cửu khổng ngũ sắc quý phái, các tích *Thuận buồm xuôi gió*, *Mã đáo thành công* (giá từ 1.000.000đ - vài triệu).
  - **Đĩa/Bình hoa sơn mài Hạ Thái:** Dát vàng, cẩn vỏ trứng phủ bóng mài nước sang trọng.
  - **Tượng phong thủy dát vàng Kiêu Kỵ:** Dát vàng lá 24K thủ công mang lại tài lộc may mắn.

- 👵 **Tặng Mẹ & Bà:**
  - **Nón lá bài thơ Làng Chuông:** Nón lá trắng muốt soi lên ánh nắng hiện hình hoa sen hoặc câu thơ thanh tao (50k - 100k).
  - **Cốm mộc Mễ Trì bọc lá sen tươi:** Thơm nức hương sen đầu mùa (50k/gói - 250k/kg).
  - **Khăn lụa tơ tằm Vạn Phúc:** Mềm mại, giữ ấm mùa đông thoáng mát mùa hè (150k - 350k).

- 💝 **Tặng Người Yêu / Bạn Gái:**
  - **Khăn lụa Vân tơ tằm:** Tôn vẻ nữ tính dịu dàng.
  - **Cốc gốm đôi Bát Tràng:** Tự tay bạn vẽ tên 2 người lên cốc đất sét (60k - 100k).
  - **Quạt lụa Chàng Sơn:** Vẽ hoa sen duyên dáng.

- 👶 **Tặng Trẻ Nhỏ:**
  - **Chuồn chuồn tre Thạch Xá:** Đậu thăng bằng diệu kỳ trên ngón tay (20k - 35k).
  - **Tò he ngũ sắc Xuân La:** Con giống bột nếp an toàn (15k - 30k).`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Giá một chiếc nón lá Làng Chuông?',
        'Khăn lụa Vạn Phúc giá khoảng bao nhiêu?',
        'Địa chỉ mua cốm Mễ Trì chuẩn vị?'
      ]
    };
  }

  // 4. SINGLE VILLAGE DETAILED HANDLING
  if (mentionedVillages.length === 1) {
    const v = mentionedVillages[0];

    // Directions
    if (isTransportIntent) {
      return {
        reply: `📍 **Hướng dẫn di chuyển đến ${v.name}:**

- **Khoảng cách:** Cách trung tâm Hà Nội khoảng **${v.distanceKm}km** (${v.travelTime} di chuyển).
- 🚌 **Xe buýt:** ${v.busRoutes}.
- 🛵 **Xe máy / Ô tô cá nhân:** ${v.motorbikeRoute}.
- 💡 **Lời khuyên:** ${v.bestTime}. Nếu có thời gian, bạn có thể kết hợp ghé thăm **${v.comboVillage}** rất tiện đường!`,
        source: 'local-expert-engine',
        suggestedFollowUps: [
          `Ăn gì ngon ở ${v.name}?`,
          `Chi phí và vé tham quan ${v.name}?`,
          `Góc chụp ảnh đẹp nhất tại ${v.name}?`
        ],
        relatedVillageSlug: v.slug
      };
    }

    // Food
    if (isFoodIntent) {
      const foodsText = v.signatureFoods.map(f => `- **${f.name}** (${f.price}): ${f.desc}`).join('\n');
      return {
        reply: `🍲 **Đặc sản ẩm thực không thể bỏ qua tại ${v.name}:**

${foodsText}

💡 **Mách nhỏ:** Bạn nên thưởng thức các món ăn nóng hổi ngay tại làng để cảm nhận trọn vẹn phong vị mộc mạc và tươi mới nhất!`,
        source: 'local-expert-engine',
        suggestedFollowUps: [
          `Đường đi xe buýt đến ${v.name}?`,
          `Lịch trình nửa ngày ở ${v.name}?`,
          `Mua gì làm quà ở ${v.name}?`
        ],
        relatedVillageSlug: v.slug
      };
    }

    // Price
    if (isPricingIntent) {
      return {
        reply: `💰 **Chi phí & Vé trải nghiệm tại ${v.name}:**

- **Vé vào làng:** ${v.ticketPrice}.
- **Chi phí workshop trải nghiệm:** ${v.workshopPrice}.
- **Dự trù ngân sách:** Khoảng **150.000đ - 300.000đ/người** là bạn đã có một chuyến đi trọn vẹn gồm cả ăn uống đặc sản, vé tham quan và một món quà lưu niệm xinh xắn mang về!`,
        source: 'local-expert-engine',
        suggestedFollowUps: [
          `Ăn gì ngon ở ${v.name}?`,
          `Đường đi đến ${v.name} như thế nào?`,
          `Lịch trình gợi ý ở ${v.name}?`
        ],
        relatedVillageSlug: v.slug
      };
    }

    // Photo
    if (isPhotoIntent) {
      const spots = v.photoSpots.map(s => `- 📸 ${s}`).join('\n');
      return {
        reply: `📸 **Tọa độ Check-in Sống Ảo Đẹp Nhất tại ${v.name}:**

${spots}

- ⏰ **Thời điểm vàng:** ${v.bestTime}.
- 👗 **Gợi ý trang phục:** Nên mặc trang phục phong cách truyền thống, áo dài, hoặc đồ màu sáng tương phản để bức ảnh thêm nổi bật và đậm chất thơ!`,
        source: 'local-expert-engine',
        suggestedFollowUps: [
          `Đường đi đến ${v.name}?`,
          `Món ăn ngon nhất ở ${v.name}?`,
          `Tour kết hợp cùng ${v.comboVillage}?`
        ],
        relatedVillageSlug: v.slug
      };
    }

    // Village Overview
    const highlights = v.topHighlights.map(h => `- 🌟 ${h}`).join('\n');
    const foods = v.signatureFoods.map(f => `- 🍜 **${f.name}**: ${f.desc}`).join('\n');

    return {
      reply: `🏮 **Tổng quan Trải nghiệm tại ${v.name} (${v.district}):**

${v.summary}

**1. Điểm nhấn nổi bật:**
${highlights}

**2. Ẩm thực trứ danh:**
${foods}

**3. Thông tin thực tế:**
- 📍 **Khoảng cách:** ${v.distanceKm}km (${v.travelTime}).
- 🚌 **Xe buýt:** ${v.busRoutes}.
- 🎟️ **Vé & Trải nghiệm:** ${v.ticketPrice} | Workshop: ${v.workshopPrice}.
- 💡 **Tour kết hợp:** Gợi ý kết hợp cùng **${v.comboVillage}**.`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        `Cách đi xe buýt đến ${v.name}?`,
        `Góc chụp ảnh đẹp nhất ở ${v.name}?`,
        `Gợi ý chi phí khám phá ${v.name}?`
      ],
      relatedVillageSlug: v.slug
    };
  }

  // 5. FAMILY & CHILDREN
  if (hasAnyPhrase(n, ['tre em', 'gia dinh', 'con nit', 'em be', 'be nho', 'tre nho', 'cho tre', 'cho be', 'be 5 tuoi', 'be 3 tuoi'])) {
    return {
      reply: `👨‍👩‍👧‍👦 **Top 4 Làng Nghề Tuyệt Vời Nhất Cho Gia Đình & Trẻ Nhỏ:**

1. 🎭 **Làng Múa Rối Nước Đào Thục (Đông Anh - 25km):**
   - **Trải nghiệm số 1:** Xem chú Tễu giáo trò bên ao làng cổ kính. Đặc biệt các bé được xắn quần lội nước sau mành sáo, tự tay cầm sào điều khiển con rối nước cùng các nghệ nhân lão thành.

2. 🎨 **Làng Tò He Xuân La (Phú Xuyên - 40km):**
   - **Xứ sở tuổi thơ:** Bé được nghịch những khối bột nếp ngũ sắc thơm ngào ngạt chiết xuất từ thiên nhiên, học cách nặn rồng phượng, bông hoa, chú ngựa mang về nhà. Rất tốt để rèn luyện tính kiên nhẫn và óc sáng tạo!

3. 🌿 **Làng Chuồn Chuồn Tre Thạch Xá (Thạch Thất - 32km):**
   - **Kỳ quan thăng bằng:** Bé được khám phá vì sao chú chuồn chuồn tre có thể đậu thăng bằng diệu kỳ trên đầu ngón tay, tự tay chấm màu nước vẽ đôi cánh theo ý thích. Kết hợp leo núi Chùa Tây Phương rợp bóng cây.

4. 🏺 **Làng Gốm Bát Tràng (Gia Lâm - 14km):**
   - Bé ngồi bàn xoay vuốt đất sét tạo hình cốc, bát và tô tượng màu sắc vui nhộn.`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Đường đi đến làng rối nước Đào Thục?',
        'Trải nghiệm nặn tò he Xuân La ra sao?',
        'Làng chuồn chuồn tre Thạch Xá có gì hay?'
      ]
    };
  }

  // 6. PHOTOGRAPHY & CHECK-IN
  if (isPhotoIntent) {
    return {
      reply: `📸 **Top 4 Tọa Độ Sống Ảo "Triệu View" Đẹp Nhất Làng Nghề Hà Nội:**

1. 🏮 **Làng Hương Quảng Phú Cầu (Ứng Hòa):**
   - Hàng triệu bó chân hương đỏ thắm xòe hoa nở rộ trên sân đình tạo thành biển hoa rực rỡ. Nổi tiếng trên báo chí quốc tế (National Geographic, CNN).
   - *Góc chụp:* Flycam từ trên cao hoặc ngồi giữa những hàng hương đỏ rực rỡ.

2. 🌸 **Làng Hoa Tây Tựu (Bắc Từ Liêm):**
   - Cánh đồng hoa cúc, hoa ly bạt ngàn vào sớm mai 07:00 khi sương mai còn đọng lấp lánh trên từng cánh hoa. Cực kỳ hợp với concept nàng thơ áo trắng.

3. 🧣 **Làng Lụa Vạn Phúc (Hà Đông):**
   - Con đường hàng trăm chiếc ô dù sắc màu rực rỡ lơ lửng trên cao và bức tường bích họa tái hiện nghề dệt tơ tằm cổ kính.

4. 🏛️ **Bảo tàng Gốm Bát Tràng (Gia Lâm):**
   - Kiến trúc 7 cánh xoắn ốc đất nung uốn lượn kỳ vĩ, ánh sáng rọi qua giếng trời tạo nên những bức ảnh kiến trúc độc bản.`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Thời gian chụp ảnh đẹp nhất ở Quảng Phú Cầu?',
        'Mặc gì khi đi chụp ảnh làng nghề?',
        'Cách đi đến làng hoa Tây Tựu?'
      ]
    };
  }

  // 7. SHORT TIME / NEAR CENTER (< 15km, 2-3 hours)
  if (hasAnyPhrase(n, ['gan', '2 tieng', '3 tieng', 'it thoi gian', 'nhanh', 'nua ngay', 'gan nhat', 'gan trung tam'])) {
    return {
      reply: `⚡ **Gợi Ý Làng Nghề Cực Gần Trung Tâm (< 15km, Đi Nhanh 2 - 4 Tiếng):**

1. 🌾 **Làng Cốm Mễ Trì (8km - 15 phút):**
   - Gần nhất! Nằm ngay cạnh đường Phạm Hùng / Đỗ Đức Dục. Thưởng thức xôi cốm nóng, chả cốm giòn thơm và mua quà biếu cực kỳ tiện.

2. 🧣 **Làng Lụa Vạn Phúc (11km - 15 phút đi tàu điện):**
   - Trải nghiệm tàu điện Cát Linh - Hà Đông chỉ 15 phút là đến cổng làng. Dạo con đường ô dù, ngắm thợ dệt lụa và thưởng thức bún chả Cầu Am.

3. 🌸 **Làng Hoa Tây Tựu (13km - 25 phút):**
   - Dạo cánh đồng hoa vào sớm mai hoặc chiều mát, mua hoa tươi tận gốc với giá sỉ.

4. 🏺 **Làng Gốm Bát Tràng (14km - 35 phút):**
   - Bắt xe buýt 47A sang Bát Tràng trải nghiệm vuốt gốm và check-in Bảo tàng gốm xoắn ốc rồi về trong buổi chiều.`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Cách đi tàu điện đến Vạn Phúc?',
        'Ăn cốm Mễ Trì mùa nào ngon nhất?',
        'Chi phí đi Bát Tràng hết bao nhiêu?'
      ]
    };
  }

  // 8. GENERAL FOOD & CUISINE
  if (isFoodIntent) {
    return {
      reply: `🍲 **Bản Đồ Ẩm Thực Tinh Hoa Làng Nghề Hà Nội:**

- 🌾 **Cốm Mễ Trì:** Cốm non mộc lá sen tươi dẻo thơm, xôi cốm hạt sen dừa nạo ngọt bùi, chả cốm chiên giòn, chè cốm hoa bưởi.
- 🏺 **Cỗ Gốm Bát Tràng:** Canh măng mực tiến vua (măng nứa khô ninh cùng mực khô thái chỉ óng ả), su hào xào mực giòn ngọt, chè củ mài bùi béo.
- 🍗 **Vịt cỏ Vân Đình (Quảng Phú Cầu):** Vịt nướng than hoa da giòn thịt ngọt lịm không ngấy, cháo vịt hạt sen béo bùi.
- 🥢 **Bún chả Cầu Am (Vạn Phúc):** Thịt chả nướng than hoa thơm nức mũi chấm nước mắm chua ngọt ấm nồng.
- 👒 **Bánh đúc nếp Làng Chuông:** Bánh đúc nóng mềm mướt chấm tương nếp Cự Đà lên men béo ngậy.
- 🌿 **Chè lam Thạch Xá & Bánh tẻ xứ Đoài:** Vị cay ấm nồng của gừng già và ngọt dịu của mật mía nếp cái hoa vàng.`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Món canh măng mực Bát Tràng ăn ở đâu?',
        'Cốm Mễ Trì bao nhiêu tiền một cân?',
        'Quán vịt nướng ngon gần làng hương?'
      ]
    };
  }

  // 9. BUDGET & COST
  if (hasAnyPhrase(n, ['ngan sach', 'chi phi', 'bao nhieu tien', 'gia re', 'tiet kiem', '200k', '300k', '500k', '1 trieu', 'sinh vien']) || isPricingIntent) {
    return {
      reply: `💰 **Gợi Ý Chi Phí Khám Phá Làng Nghề Tiết Kiệm (Từ 150k - 350k/người):**

- **Gói 1: Đi Làng Lụa Vạn Phúc (~180.000đ/người):**
  - Vé tàu điện trên cao Cát Linh khứ hồi: 30.000đ
  - Ăn trưa bún chả Cầu Am: 40.000đ
  - Cà phê ven sông tản bộ: 35.000đ
  - Mua quà nhỏ (khăn lụa hoặc vòng tay tơ tằm): 75.000đ

- **Gói 2: Đi Làng Gốm Bát Tràng (~280.000đ/người):**
  - Xe buýt 47A khứ hồi: 16.000đ
  - Vé Bảo tàng Gốm Bát Tràng: 50.000đ
  - Trải nghiệm vuốt gốm bàn xoay + nung: 70.000đ
  - Ăn uống đặc sản canh măng mực / bún riêu: 80.000đ
  - Tự mua chiếc cốc gốm xinh xắn: 60.000đ

- **Gói 3: Đi Làng Hương Quảng Phú Cầu (~250.000đ/người):**
  - Xe buýt 91 khứ hồi: 18.000đ
  - Vé vào sân chụp ảnh thảm hương: 50.000đ
  - Bữa trưa mẹt vịt cỏ Vân Đình nướng: 150.000đ/người (đi nhóm)`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Cách đi xe buýt 47A sang Bát Tràng?',
        'Bảo tàng gốm Bát Tràng mở cửa mấy giờ?',
        'Lịch trình 1 ngày đi Quảng Phú Cầu?'
      ]
    };
  }

  // 10. TOURS & ITINERARIES
  if (hasAnyPhrase(n, ['lich trinh', '1 ngay', 'cuoi tuan', 'tour', 'di dau', 'ke hoach'])) {
    const tours = COMBO_TOURS.map((t, idx) => `**${idx + 1}. ${t.title}:**\n- 🚗 *Quãng đường:* ${t.distance} (${t.duration}).\n- 🌟 *Hoạt động:* ${t.highlights}\n- 💰 *Chi phí dự kiến:* ${t.cost}`).join('\n\n');

    return {
      reply: `🗺️ **Top 5 Lịch Trình Khám Phá Làng Nghề 1 Ngày Trọn Vẹn:**

${tours}

💡 **Mách bạn:** Bạn ưng ý tour nào nhất? Hãy nhắn cho tôi, tôi sẽ lên chi tiết từng khung giờ và địa điểm dừng chân cho bạn!`,
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Chi tiết Tour Bát Tràng - Kiêu Kỵ 1 ngày?',
        'Chi tiết Tour Thạch Xá - Chùa Tây Phương?',
        'Chi tiết Tour Làng hương - Áo dài Trạch Xá?'
      ]
    };
  }

  // 11. GREETINGS & CASUAL TALK
  if (hasAnyPhrase(n, ['chao', 'hi', 'hello', 'alo', 'ban la ai', 'lam duoc gi', 'tro ly'])) {
    return {
      reply: `Xin chào bạn! Tôi là **Trợ lý Thông Minh Làng Nghề Hà Nội 2.0** 🏮.

Tôi nắm trọn vẹn dữ liệu thực tế của **16 làng nghề truyền thống tiêu biểu của Thủ đô**:
🏺 Gốm Bát Tràng | 🌾 Cốm Mễ Trì | 🧣 Lụa Vạn Phúc | 🏮 Hương Quảng Phú Cầu
🌸 Hoa Tây Tựu | 🎭 Rối nước Đào Thục | 🎨 Tò he Xuân La | 🌿 Chuồn chuồn tre Thạch Xá
👒 Nón Chuông | 🧺 Mây tre Phú Vinh | 🪡 Áo dài Trạch Xá | 🪵 Tạc tượng Sơn Đồng
✨ Khảm trai Chuyên Mỹ | 🎨 Sơn mài Hạ Thái | 🪙 Dát vàng Kiêu Kỵ | 🪭 Quạt Chàng Sơn

Bạn muốn tôi tư vấn về điều gì hôm nay? (Lịch trình, cách đi xe buýt, địa điểm chụp ảnh sống ảo, quán ăn ngon hay chi phí chuyến đi?)`,
      source: 'local-expert-engine',
      suggestedFollowUps: defaultChips
    };
  }

  // 12. SMART DYNAMIC FALLBACK
  return {
    reply: `Cảm ơn bạn đã hỏi! Về yêu cầu **"${rawQuery}"**, tôi có thể tư vấn chi tiết cho bạn:

Hà Nội có **16 làng nghề truyền thống** độc đáo phân bố từ nội đô đến ngoại thành:
- **Nếu bạn muốn đi gần (< 15km, chỉ 2-3 tiếng):** Hãy ghé **Làng Cốm Mễ Trì** (8km) thưởng thức ẩm thực, **Làng Lụa Vạn Phúc** (11km) đi tàu điện Cát Linh, hoặc **Làng Gốm Bát Tràng** (14km) vuốt gốm bàn xoay.
- **Nếu bạn thích chụp ảnh sống ảo "triệu view":** Hãy đến **Làng Hương Quảng Phú Cầu** (35km) ngắm thảm chân hương đỏ thắm rực rỡ hoặc **Làng Hoa Tây Tựu** (13km).
- **Nếu đi cùng gia đình & trẻ nhỏ:** Hãy chọn **Làng Rối Nước Đào Thục** (bé được lội nước điều khiển chú Tễu), **Làng Tò He Xuân La** hoặc **Làng Chuồn Chuồn Tre Thạch Xá**.

Bạn muốn tìm hiểu kỹ hơn về làng nghề nào, hoặc muốn tôi lên lịch trình chi tiết cho chuyến đi của bạn?`,
    source: 'local-expert-engine',
    suggestedFollowUps: defaultChips
  };
}

// Main AI Assistant Interface that supports Google Gemini Cloud LLM
export async function askEnhancedCraftAssistant(
  userQuery: string,
  userGeminiKey?: string
): Promise<AiResponseResult> {
  const activeKey = (userGeminiKey || process.env.GEMINI_API_KEY || '').trim();

  // 1. If Gemini API key is available, call official Google Gemini models
  if (activeKey && activeKey.length > 10) {
    const systemPrompt = `Bạn là Trợ lý Ảo AI chuyên gia cao cấp của nền tảng "Lang Thang — Làng Nghề Hà Nội" (Slogan: "Lang Thang ghé một ngôi làng / Theo chân văn hóa, mở ngàn điều hay").
Bạn am hiểu tường tận toàn bộ 16 Làng Nghề Truyền Thống của Hà Nội:
- Bát Tràng (Gốm sứ, lò bầu, vuốt gốm, Bảo tàng 7 tầng xoắn ốc, canh măng mực, buýt 47A)
- Mễ Trì (Cốm non mộc lá sen, xôi cốm dừa hạt sen, chả cốm giòn thơm, buýt 33, 50, 74)
- Vạn Phúc (Lụa tơ tằm, con đường ô dù, bún chả Cầu Am, tàu điện Cát Linh - Hà Đông)
- Quảng Phú Cầu (Hương đỏ triệu view, vịt cỏ Vân Đình, buýt 91)
- Tây Tựu (Đồng hoa bạt ngàn, bún đậu làng Đăm, ổi đào)
- Đào Thục (Rối nước Thủy đình cổ, lội nước điều khiển chú Tễu cùng nghệ nhân)
- Xuân La (Tò he bột nếp ngũ sắc duy nhất Việt Nam, bánh đa gấc)
- Thạch Xá (Chuồn chuồn tre thăng bằng, Chùa Tây Phương 239 bậc đá ong, chè lam)
- Làng Chuông (Nón lá bài thơ, chợ phiên rạng sáng đê sông Đáy, bánh đúc tương bần)
- Phú Vinh (Mây tre đan xuất khẩu châu Âu, decor sống xanh vintage)
- Trạch Xá (Cội nguồn áo dài hơn 1000 năm, khâu tay giấu chỉ độc nhất)
- Sơn Đồng (Tạc tượng Phật, đồ thờ sơn son thếp vàng, nem Phùng)
- Chuyên Mỹ (Khảm xà cừ vỏ ốc cửu khổng ngũ sắc từ thời Lý, bún bung hoa chuối)
- Hạ Thái (Sơn mài mỹ thuật, dát vỏ trứng và mài nước kỳ công)
- Kiêu Kỵ (Làng dát vàng quỳ độc nhất Việt Nam, đập 1 chỉ vàng thành ngàn lá quỳ)
- Chàng Sơn (Quạt giấy dó, quạt lụa từng dự triển lãm Paris, bánh tẻ lá dong).

Nhiệm vụ của bạn là tư vấn du lịch, gợi ý lịch trình, phương tiện (xe buýt, xe máy, tàu điện), ẩm thực, chi phí, góc chụp ảnh sống ảo và lịch sử văn hóa một cách nhiệt tình, đĩnh đạc, ấm áp, có cấu trúc rõ ràng với icon sinh động, tiếng Việt chuẩn mực.

Hãy trả lời câu hỏi sau của người dùng: "${userQuery}"`;

    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest'
    ];

    for (const model of candidateModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const localFallback = generateSmartLocalAnswer(userQuery);
            return {
              reply: text,
              source: 'gemini-1.5-flash',
              suggestedFollowUps: localFallback.suggestedFollowUps || [
                'Làng nghề nào gần trung tâm nhất?',
                'Tọa độ chụp ảnh sống ảo đẹp nhất?',
                'Món ngon đặc sản không thể bỏ lỡ?'
              ],
              relatedVillageSlug: localFallback.relatedVillageSlug
            };
          }
        }
      } catch (err) {
        // Continue to next model if this one fails
      }
    }
  }

  // 2. High-performance offline Expert Engine (Instant, zero latency, highly accurate)
  return generateSmartLocalAnswer(userQuery);
}


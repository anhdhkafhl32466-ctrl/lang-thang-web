/**
 * Cơ sở dữ liệu chuẩn hóa của các Làng nghề truyền thống tiêu biểu Hà Nội.
 * Phục vụ Động cơ Hậu kiểm Rule-based (Post-verification Engine)
 * và Giao diện Giải trình Căn cứ (Explainable AI - XAI).
 */

export interface VerifiedCraftVillage {
  id: string;
  slug: string;
  name: string;
  category: string;
  district: string;
  address: string;
  tagline: string;
  shortDescription: string;
  heroImage: string;
  
  // Ràng buộc thời gian & hoạt động
  opening_hours: {
    open: string;       // "07:30"
    close: string;      // "17:30"
    days: string;       // "Cả tuần (Thứ Hai – Chủ Nhật)"
    openMinutes: number; // 450 (7 * 60 + 30)
    closeMinutes: number;// 1050 (17 * 60 + 30)
  };
  minExperienceMinutes: number; // Thời gian trải nghiệm tối thiểu (ví dụ: 90 phút)

  // Ràng buộc ngân sách & Chi phí niêm yết thực tế từ Cửa hàng / Xưởng
  min_budget: number;        // Ngân sách tối thiểu đề xuất (VNĐ)
  workshop_price: number;    // Vé workshop tiêu chuẩn (VNĐ)
  workshop_economy_price: number; // Vé workshop gói tiết kiệm / tham quan tự do (VNĐ)
  workshop_name: string;     // Tên xưởng nghệ nhân liên kết
  artisan_name: string;      // Tên nghệ nhân bảo trợ
  dining_estimate: number;   // Dự toán thưởng thức ẩm thực cỗ làng (VNĐ)
  dining_snack_estimate: number; // Dự toán thức quà dân dã nhẹ (VNĐ)

  // Tọa độ GPS thực tế phục vụ tính Haversine
  coordinates: {
    lat: number;
    lng: number;
  };

  // Căn cứ pháp lý & Dữ liệu 327 Làng nghề
  official_decision_id: string; // Số Quyết định công nhận UBND Hà Nội
  recognition_year: number;     // Năm công nhận chính thức
  heritage_rank: string;        // Phân hạng di sản
  history_origin: string;       // Niên đại hình thành

  // Số liệu cộng đồng thực tế từ tính năng Hộ chiếu (Passport)
  passport_checkins: number;    // Số lượt du khách đóng dấu Hộ chiếu
  positive_rate: string;        // Tỷ lệ đánh giá tích cực
  rating: number;               // Điểm đánh giá (thang 5.0)

  // Danh mục phân loại trải nghiệm
  suitable_preferences: (
    | 'pottery'
    | 'silk'
    | 'weaving-hat'
    | 'culinary'
    | 'photo-checkin'
    | 'heritage-wood'
    | 'folk-art'
    | 'combo-all'
  )[];

  highlights: string[];
  signature_dishes: string[];
}

export const VERIFIED_CRAFT_VILLAGES: VerifiedCraftVillage[] = [
  {
    id: 'bat-trang',
    slug: 'bat-trang',
    name: 'Làng gốm Bát Tràng',
    category: 'Gốm sứ cổ truyền',
    district: 'Huyện Gia Lâm',
    address: 'Xã Bát Tràng, Huyện Gia Lâm, Hà Nội',
    tagline: 'Ngàn năm giữ lửa – Nơi đất hóa thành nghệ thuật',
    shortDescription: 'Cái nôi gốm sứ gần 700 năm bên sông Hồng với nước men rạn, men lam trứ danh và kiến trúc Bảo tàng Gốm 7 cánh xoắn ốc độc nhất vô nhị.',
    heroImage: '/images/villages/bat-trang/artisan_wheel.jpg',
    opening_hours: {
      open: '07:30',
      close: '17:30',
      days: 'Thứ Hai – Chủ Nhật (Kể cả ngày lễ)',
      openMinutes: 450,
      closeMinutes: 1050,
    },
    minExperienceMinutes: 120,
    min_budget: 180000,
    workshop_price: 70000,
    workshop_economy_price: 35000,
    workshop_name: 'Xưởng Gốm Bàn Xoay Nghệ Nhân Hùng Thắng',
    artisan_name: 'Nghệ nhân Phạm Anh Hùng',
    dining_estimate: 80000,
    dining_snack_estimate: 35000,
    coordinates: {
      lat: 20.9785,
      lng: 105.9126,
    },
    official_decision_id: 'Quyết định số 142/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2001,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu – Điểm du lịch cấp Thành phố',
    history_origin: 'Hình thành từ thế kỷ XIV (thời nhà Lý – Trần)',
    passport_checkins: 3840,
    positive_rate: '98.8%',
    rating: 4.9,
    suitable_preferences: ['pottery', 'photo-checkin', 'culinary', 'combo-all'],
    highlights: [
      'Bảo tàng Gốm Bát Tràng 7 cánh xoắn ốc đất nung cao 4 tầng',
      'Tự tay ngồi bàn xoay điện vuốt nặn bình cốc và vẽ màu men',
      'Chợ gốm sầm uất với hơn 1.000 gian hàng gốm sứ tử sa',
      'Thưởng thức cỗ mộc măng mực cổ truyền trứ danh'
    ],
    signature_dishes: ['Canh măng mực Bát Tràng', 'Chè củ mài bùi ngọt', 'Su hào xào mực giòn']
  },
  {
    id: 'me-tri',
    slug: 'me-tri',
    name: 'Làng cốm Mễ Trì',
    category: 'Ẩm thực truyền thống',
    district: 'Quận Nam Từ Liêm',
    address: 'Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội',
    tagline: 'Hương cốm mùa thu – Thức quà thanh tao xứ Tràng An',
    shortDescription: 'Cực gần trung tâm thủ đô (chỉ 8km), nổi danh với nghề làm cốm nếp cái hoa vàng giã tay mộc mạc thơm ngát hương sen.',
    heroImage: '/images/villages/me-tri/com_wrapping.jpg',
    opening_hours: {
      open: '06:30',
      close: '19:00',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 390,
      closeMinutes: 1140,
    },
    minExperienceMinutes: 75,
    min_budget: 120000,
    workshop_price: 50000,
    workshop_economy_price: 25000,
    workshop_name: 'Không Gian Di Sản Cốm Mộc Nghệ Nhân Ngô Thu',
    artisan_name: 'Nghệ nhân Ưu tú Ngô Thị Thu',
    dining_estimate: 60000,
    dining_snack_estimate: 30000,
    coordinates: {
      lat: 21.0084,
      lng: 105.7828,
    },
    official_decision_id: 'Quyết định số 1445/QĐ-BVHTTDL (Di sản Văn hóa Phi vật thể Quốc gia)',
    recognition_year: 2019,
    heritage_rank: 'Di sản Văn hóa Phi vật thể Quốc gia',
    history_origin: 'Truyền thống hơn một thế kỷ thời kỳ Thăng Long kẻ chợ',
    passport_checkins: 4120,
    positive_rate: '99.1%',
    rating: 4.95,
    suitable_preferences: ['culinary', 'photo-checkin', 'combo-all'],
    highlights: [
      'Lắng nghe tiếng chày giã cốm nhịp đôi rộn rã trong ngõ cổ',
      'Trải nghiệm gói cốm tươi hai lớp lá sen thơm ngát và buộc lạt rơm',
      'Thưởng thức xôi cốm hạt sen, chả cốm nóng giòn chấm nước mắm nhĩ',
      'Vị trí đắc địa ngay nội đô, thuận tiện di chuyển cả xe buýt và tàu điện'
    ],
    signature_dishes: ['Xôi cốm hạt sen dừa nạo', 'Cốm mộc tươi lá sen', 'Chả cốm nóng hổi']
  },
  {
    id: 'van-phuc',
    slug: 'van-phuc',
    name: 'Làng lụa Vạn Phúc',
    category: 'Lụa & Dệt may',
    district: 'Quận Hà Đông',
    address: 'Phường Vạn Phúc, Quận Hà Đông, Hà Nội',
    tagline: 'Mượt mà sợi tơ – Lung linh sắc lụa Hà Thành',
    shortDescription: 'Làng lụa cổ hơn 1.000 năm nổi tiếng với lụa Vân gấm hoa dệt thủ công mát rượi, phố ô rực rỡ và đền thờ bà chúa dệt lụa A Lã Thị Nương.',
    heroImage: '/images/villages/van-phuc/lua_van_phuc.jpg',
    opening_hours: {
      open: '08:00',
      close: '18:30',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 480,
      closeMinutes: 1110,
    },
    minExperienceMinutes: 90,
    min_budget: 150000,
    workshop_price: 60000,
    workshop_economy_price: 30000,
    workshop_name: 'Xưởng Dệt Khung Cửi Cổ Khang Kiên Vạn Phúc',
    artisan_name: 'Nghệ nhân Phạm Khắc Hà',
    dining_estimate: 70000,
    dining_snack_estimate: 35000,
    coordinates: {
      lat: 20.9781,
      lng: 105.7725,
    },
    official_decision_id: 'Quyết định số 2253/QĐ-BVHTTDL (Di sản Văn hóa Phi vật thể Quốc gia)',
    recognition_year: 2023,
    heritage_rank: 'Di sản Văn hóa Phi vật thể Quốc gia – Làng nghề du lịch tiêu biểu',
    history_origin: 'Khởi nguồn từ thế kỷ thứ IX (thời kỳ tiền Thăng Long)',
    passport_checkins: 3410,
    positive_rate: '97.9%',
    rating: 4.85,
    suitable_preferences: ['silk', 'photo-checkin', 'combo-all'],
    highlights: [
      'Con đường ô rực rỡ sắc màu và bức tường bích họa làng lụa',
      'Tận mắt quan sát thoi dệt lướt trên khung cửi cổ truyền',
      'Trải nghiệm ươm tơ, dệt lụa và chọn mua khăn lụa tơ tằm nguyên chất',
      'Kết nối thuận tiện bằng tuyến tàu điện đường sắt đô thị Cát Linh - Hà Đông'
    ],
    signature_dishes: ['Bún chả cầu Am Hà Đông', 'Bánh cuốn tơ lụa', 'Chè sen long nhãn']
  },
  {
    id: 'quang-phu-cau',
    slug: 'quang-phu-cau',
    name: 'Làng tăm hương Quảng Phú Cầu',
    category: 'Hương & Thảo mộc',
    district: 'Huyện Ứng Hòa',
    address: 'Xã Quảng Phú Cầu, Huyện Ứng Hòa, Hà Nội',
    tagline: 'Sắc đỏ tâm linh – Tọa độ check-in nghệ thuật quốc tế',
    shortDescription: 'Nổi tiếng thế giới với những thềm sân đình xòe hàng triệu bó chân hương đỏ rực như pháo hoa, thu hút nhiếp ảnh gia toàn cầu.',
    heroImage: '/images/villages/quang-phu-cau/quang_phu_cau_incense_village.jpg',
    opening_hours: {
      open: '07:00',
      close: '17:30',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 420,
      closeMinutes: 1050,
    },
    minExperienceMinutes: 120,
    min_budget: 170000,
    workshop_price: 50000,
    workshop_economy_price: 25000,
    workshop_name: 'Hợp Tác Xã Hương Xạ Trầm Cổ Truyền Quảng Phú Cầu',
    artisan_name: 'Nghệ nhân Nguyễn Hữu Long',
    dining_estimate: 90000,
    dining_snack_estimate: 40000,
    coordinates: {
      lat: 20.7632,
      lng: 105.8194,
    },
    official_decision_id: 'Quyết định số 298/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2004,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu Hà Nội',
    history_origin: 'Nghề hương xạ có lịch sử hơn 120 năm tại xứ Sơn Nam Thượng',
    passport_checkins: 4680,
    positive_rate: '99.3%',
    rating: 4.96,
    suitable_preferences: ['photo-checkin', 'heritage-wood', 'combo-all'],
    highlights: [
      'Sân phơi chân hương xòe tròn như đại đóa hoa sen đỏ rực rỡ',
      'Học cách se bột hương trầm quế và thảo mộc thiên nhiên',
      'Thưởng thức đặc sản vịt cỏ Vân Đình nướng than hoa nức tiếng',
      'Được tạp chí National Geographic và AFP vinh danh điểm đến nghệ thuật'
    ],
    signature_dishes: ['Vịt cỏ Vân Đình nướng than', 'Tiết canh vịt bùi thơm', 'Bánh cuốn chả quế']
  },
  {
    id: 'chuong',
    slug: 'chuong',
    name: 'Làng nón Chuông',
    category: 'Nón lá',
    district: 'Huyện Thanh Oai',
    address: 'Xã Phương Trung, Huyện Thanh Oai, Hà Nội',
    tagline: 'Vành nón bài thơ – Nét duyên dáng phụ nữ đất Việt',
    shortDescription: 'Làng nghề khâu nón lá hơn 300 năm bên dòng sông Đáy, nổi tiếng với phiên chợ nón họp từ tờ mờ sáng và chiếc nón quai thao trang nhã.',
    heroImage: '/images/villages/chuong/conical_hat1.jpg',
    opening_hours: {
      open: '06:00',
      close: '17:00',
      days: 'Thứ Hai – Chủ Nhật (Phiên chợ chính mùng 4, 10, 14, 20, 24, 30 âm lịch)',
      openMinutes: 360,
      closeMinutes: 1020,
    },
    minExperienceMinutes: 100,
    min_budget: 140000,
    workshop_price: 60000,
    workshop_economy_price: 30000,
    workshop_name: 'Xưởng Nón Bài Thơ Nghệ Nhân Tạ Thu Hương',
    artisan_name: 'Nghệ nhân Tạ Thu Hương',
    dining_estimate: 60000,
    dining_snack_estimate: 25000,
    coordinates: {
      lat: 20.8358,
      lng: 105.7485,
    },
    official_decision_id: 'Quyết định số 482/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2002,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu Hà Nội',
    history_origin: 'Nghề làm nón bắt đầu từ thế kỷ thứ VIII dưới thời Bố Cái Đại Vương',
    passport_checkins: 2980,
    positive_rate: '98.1%',
    rating: 4.88,
    suitable_preferences: ['weaving-hat', 'photo-checkin', 'combo-all'],
    highlights: [
      'Trải nghiệm khâu nón lá: chuốt nan tre, là lá lụa và lồng bài thơ dưới ánh sáng',
      'Tham gia phiên chợ nón sáng sớm bên dòng sông Đáy thanh bình',
      'Check-in cùng những chiếc nón quai thao 3 tầng cung đình độc đáo',
      'Sở hữu chiếc nón lá thêu hoa sen mang về làm quà kỉ niệm'
    ],
    signature_dishes: ['Bánh đa gấc làng Chuông', 'Chè lam thơm cay', 'Bún riêu cua đồng sông Đáy']
  },
  {
    id: 'phu-vinh',
    slug: 'phu-vinh',
    name: 'Làng mây tre đan Phú Vinh',
    category: 'Mây tre đan',
    district: 'Huyện Chương Mỹ',
    address: 'Xã Phú Nghĩa, Huyện Chương Mỹ, Hà Nội',
    tagline: 'Bàn tay tài hoa – Biến nan tre thành tranh mỹ nghệ',
    shortDescription: 'Cái nôi mây tre đan tinh xảo bậc nhất miền Bắc với kỹ thuật đan lóng mốt, lóng đôi và đan chữ tinh vi như thêu ren.',
    heroImage: '/images/villages/phu-vinh/phu_vinh_may_tre_dan.jpg',
    opening_hours: {
      open: '07:30',
      close: '17:30',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 450,
      closeMinutes: 1050,
    },
    minExperienceMinutes: 110,
    min_budget: 150000,
    workshop_price: 65000,
    workshop_economy_price: 30000,
    workshop_name: 'Xưởng Mỹ Nghệ Mây Tre Nghệ Nhân Nguyễn Văn Trung',
    artisan_name: 'Nghệ nhân Ưu tú Nguyễn Văn Trung',
    dining_estimate: 75000,
    dining_snack_estimate: 30000,
    coordinates: {
      lat: 20.9161,
      lng: 105.6558,
    },
    official_decision_id: 'Quyết định số 120/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2002,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu',
    history_origin: 'Nghề mây tre đan xuất hiện từ thế kỷ thứ XVII',
    passport_checkins: 2450,
    positive_rate: '97.6%',
    rating: 4.82,
    suitable_preferences: ['weaving-hat', 'photo-checkin', 'combo-all'],
    highlights: [
      'Chiêm ngưỡng những bức tranh chân dung Bác Hồ đan bằng sợi mây tơ siêu mảnh',
      'Trải nghiệm đan khay trà, lẵng hoa họa tiết mắt cáo hoa mai',
      'Thăm gian nhà cổ lưu giữ hàng trăm tác phẩm mây tre đạt giải quốc tế',
      'Sắm các sản phẩm decor nội thất thân thiện môi trường'
    ],
    signature_dishes: ['Gà đồi Chương Mỹ nướng mật ong', 'Rau sắn chua nấu cá suối', 'Chè lam làng nghề']
  },
  {
    id: 'thach-xa',
    slug: 'thach-xa',
    name: 'Làng chuồn chuồn tre Thạch Xá',
    category: 'Đồ chơi dân gian',
    district: 'Huyện Thạch Thất',
    address: 'Xã Thạch Xá, Huyện Thạch Thất, Hà Nội',
    tagline: 'Kỳ diệu thăng bằng – Cánh chuồn tre đậu trên đầu ngón tay',
    shortDescription: 'Nằm ngay chân núi Chùa Tây Phương, nơi khai sinh ra chú chuồn chuồn tre có khả năng tự giữ thăng bằng trên mọi điểm tựa.',
    heroImage: '/images/villages/thach-xa/chuon_chuon_tre_thach_xa.jpg',
    opening_hours: {
      open: '08:00',
      close: '18:00',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 480,
      closeMinutes: 1080,
    },
    minExperienceMinutes: 90,
    min_budget: 130000,
    workshop_price: 45000,
    workshop_economy_price: 20000,
    workshop_name: 'Xưởng Chuồn Chuồn Tre Thăng Bằng Nguyễn Văn Tái',
    artisan_name: 'Nghệ nhân Nguyễn Văn Tái',
    dining_estimate: 65000,
    dining_snack_estimate: 25000,
    coordinates: {
      lat: 21.0267,
      lng: 105.5898,
    },
    official_decision_id: 'Quyết định số 208/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2012,
    heritage_rank: 'Làng nghề thủ công sáng tạo tiêu biểu',
    history_origin: 'Nghệ thuật vót tre thăng bằng truyền thống vùng xứ Đoài cổ kính',
    passport_checkins: 3120,
    positive_rate: '98.9%',
    rating: 4.91,
    suitable_preferences: ['folk-art', 'photo-checkin', 'combo-all'],
    highlights: [
      'Tự tay vót nan tre, sơn màu họa tiết và kiểm tra điểm thăng bằng kỳ diệu',
      'Vãn cảnh Chùa Tây Phương - Tuyệt tác kiến trúc tượng gỗ Phật giáo quốc gia',
      'Đồ chơi dân gian độc đáo rất được trẻ em và du khách quốc tế mến mộ',
      'Thưởng thức bánh chè lam Thạch Xá ấm nồng hương gừng tươi'
    ],
    signature_dishes: ['Chè lam Thạch Xá', 'Bánh gai xứ Đoài', 'Cơm chay thanh tịnh chân chùa Tây Phương']
  },
  {
    id: 'ha-thai',
    slug: 'ha-thai',
    name: 'Làng sơn mài Hạ Thái',
    category: 'Sơn mài & Khảm trai',
    district: 'Huyện Thường Tín',
    address: 'Xã Duyên Thái, Huyện Thường Tín, Hà Nội',
    tagline: 'Sắc thắm then son – Đỉnh cao nghệ thuật sơn mài Việt Nam',
    shortDescription: 'Cái nôi của nghề sơn mài danh tiếng với kỹ thuật thếp vàng quỳ, cẩn vỏ trứng vịt và đánh bóng nước cho chiều sâu quang học diệu kỳ.',
    heroImage: '/images/villages/ha-thai/ha_thai_lacquer_artisan.jpg',
    opening_hours: {
      open: '08:00',
      close: '17:30',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 480,
      closeMinutes: 1050,
    },
    minExperienceMinutes: 120,
    min_budget: 190000,
    workshop_price: 85000,
    workshop_economy_price: 40000,
    workshop_name: 'Xưởng Tranh Sơn Mài Cổ Truyền Nghệ Nhân Đỗ Văn Tám',
    artisan_name: 'Nghệ nhân Đỗ Văn Tám',
    dining_estimate: 80000,
    dining_snack_estimate: 35000,
    coordinates: {
      lat: 20.9142,
      lng: 105.8675,
    },
    official_decision_id: 'Quyết định số 135/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2001,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu',
    history_origin: 'Làng nghề sơn son thếp vàng hơn 200 năm từ thời vua Lê - chúa Trịnh',
    passport_checkins: 2210,
    positive_rate: '97.8%',
    rating: 4.86,
    suitable_preferences: ['photo-checkin', 'heritage-wood', 'combo-all'],
    highlights: [
      'Trải nghiệm mài tranh trong chậu nước để lộ ra từng lớp vỏ trứng cẩn lấp lánh',
      'Học kỹ thuật thếp vàng quỳ 24k lên các hộp quà mỹ nghệ sơn then',
      'Thưởng lãm các tác phẩm tranh phong cảnh Hà Nội đoạt giải mỹ thuật quốc gia',
      'Không gian làng nghề rợp bóng cây cổ thụ thanh bình vùng Thường Tín'
    ],
    signature_dishes: ['Bánh giầy Quán Gánh', 'Bún ốc chuối đậu Thường Tín', 'Kẹo lạc làng then']
  },
  {
    id: 'son-dong',
    slug: 'son-dong',
    name: 'Làng tạc tượng & đồ thờ Sơn Đồng',
    category: 'Điêu khắc & Gỗ mỹ nghệ',
    district: 'Huyện Hoài Đức',
    address: 'Xã Sơn Đồng, Huyện Hoài Đức, Hà Nội',
    tagline: 'Thổi hồn vào gỗ – Thiên đường điêu khắc tượng Phật Bắc Bộ',
    shortDescription: 'Cung cấp hơn 50% tượng Phật và đồ thờ cho các đình chùa miếu mạo khắp cả nước, nổi danh với nghệ thuật đục chạm gỗ mít và sơn son thếp bạc phủ vàng.',
    heroImage: '/images/villages/son-dong/son_dong_woodcarving.jpg',
    opening_hours: {
      open: '07:30',
      close: '18:00',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 450,
      closeMinutes: 1080,
    },
    minExperienceMinutes: 100,
    min_budget: 160000,
    workshop_price: 70000,
    workshop_economy_price: 35000,
    workshop_name: 'Xưởng Điêu Khắc Tượng Phật Gia Truyền Nguyễn Viết Thắng',
    artisan_name: 'Nghệ nhân Nguyễn Viết Thắng',
    dining_estimate: 75000,
    dining_snack_estimate: 30000,
    coordinates: {
      lat: 21.0375,
      lng: 105.7028,
    },
    official_decision_id: 'Quyết định số 225/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2002,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu',
    history_origin: 'Nghề tạc tượng tâm linh có niên đại trên 800 năm từ thời nhà Lý',
    passport_checkins: 2580,
    positive_rate: '98.4%',
    rating: 4.89,
    suitable_preferences: ['heritage-wood', 'photo-checkin', 'combo-all'],
    highlights: [
      'Quan sát nghệ nhân cầm đục điêu khắc khuôn mặt từ bi của tượng Phật Quan Âm',
      'Trải nghiệm kỹ thuật thếp bạc phủ hoàn kim truyền thống',
      'Tìm hiểu triết lý mỹ thuật đồ thờ cổ truyền tâm linh người Việt',
      'Mùi hương thơm nồng nàn đặc trưng của gỗ mít lan tỏa khắp đường làng ngõ xóm'
    ],
    signature_dishes: ['Bánh gai Hoài Đức', 'Thịt kho dưa mầm cải', 'Rượu nếp cái hoa vàng xứ Đoài']
  },
  {
    id: 'chuyen-my',
    slug: 'chuyen-my',
    name: 'Làng khảm trai Chuyên Mỹ (Chuôn Ngọ)',
    category: 'Sơn mài & Khảm trai',
    district: 'Huyện Phú Xuyên',
    address: 'Xã Chuyên Mỹ, Huyện Phú Xuyên, Hà Nội',
    tagline: 'Ánh xà cừ ngũ sắc – Tinh hoa cẩn ốc biển ngàn năm',
    shortDescription: 'Cái nôi nghề khảm trai xà cừ gần 1.000 năm tuổi, nơi các mảnh vỏ ốc biển óng ánh ngũ sắc được cắt tỉa siêu nhỏ cẩn vào mặt gỗ trắc, gỗ mun.',
    heroImage: '/images/villages/chuyen-my/kham_trai_chuyen_my.jpg',
    opening_hours: {
      open: '08:00',
      close: '17:30',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 480,
      closeMinutes: 1050,
    },
    minExperienceMinutes: 110,
    min_budget: 180000,
    workshop_price: 80000,
    workshop_economy_price: 40000,
    workshop_name: 'Xưởng Khảm Trai Xà Cừ Cung Đình Nghệ Nhân Nguyễn Đình Vinh',
    artisan_name: 'Nghệ nhân Nguyễn Đình Vinh',
    dining_estimate: 80000,
    dining_snack_estimate: 35000,
    coordinates: {
      lat: 20.7388,
      lng: 105.8642,
    },
    official_decision_id: 'Quyết định số 210/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2002,
    heritage_rank: 'Làng nghề truyền thống tiêu biểu',
    history_origin: 'Khởi xướng bởi Tướng quân Trương Công Thành từ thời nhà Lý (năm 1009)',
    passport_checkins: 1950,
    positive_rate: '98.0%',
    rating: 4.87,
    suitable_preferences: ['photo-checkin', 'heritage-wood', 'combo-all'],
    highlights: [
      'Tự tay dùng dùi nhỏ cẩn từng mảnh ốc ngũ sắc vào móc khóa hoặc tranh gỗ mini',
      'Chiêm ngưỡng các bức bình phong khảm tích Tùng Hạc, Sơn Thủy diễm lệ',
      'Tìm hiểu các loài ốc xà cừ quý hiếm: ốc đỏ Singapore, ốc cửu khổng',
      'Khám phá đình làng Chuôn Ngọ cổ kính thờ ông tổ nghề khảm'
    ],
    signature_dishes: ['Bánh trôi nước Phú Xuyên', 'Chả cá sông Nhuệ', 'Rượu làng Chuyên']
  },
  {
    id: 'dao-thuc',
    slug: 'dao-thuc',
    name: 'Làng múa rối nước Đào Thục',
    category: 'Nghệ thuật dân gian',
    district: 'Huyện Đông Anh',
    address: 'Xã Thụy Lâm, Huyện Đông Anh, Hà Nội',
    tagline: 'Nhịp đập mặt nước – Hồn rối dân gian ba trăm năm',
    shortDescription: 'Cái nôi rối nước cổ truyền hơn 300 năm bên bờ sông Cà Lồ, nơi nghệ nhân ngâm mình dưới nước điều khiển con rối rồng phun lửa và chú Tễu tươi cười.',
    heroImage: '/images/villages/dao-thuc/roi_nuoc_dao_thuc.jpg',
    opening_hours: {
      open: '08:00',
      close: '17:30',
      days: 'Thứ Hai – Chủ Nhật (Suất diễn theo lịch hẹn hoặc cuối tuần)',
      openMinutes: 480,
      closeMinutes: 1050,
    },
    minExperienceMinutes: 100,
    min_budget: 150000,
    workshop_price: 60000,
    workshop_economy_price: 30000,
    workshop_name: 'Phường Rối Nước Dân Gian Đào Thục',
    artisan_name: 'Trưởng phường Đinh Hoàng Văn',
    dining_estimate: 70000,
    dining_snack_estimate: 30000,
    coordinates: {
      lat: 21.1895,
      lng: 105.9082,
    },
    official_decision_id: 'Quyết định số 4613/QĐ-BVHTTDL (Di sản Văn hóa Phi vật thể Quốc gia)',
    recognition_year: 2023,
    heritage_rank: 'Di sản Văn hóa Phi vật thể Quốc gia',
    history_origin: 'Khởi lập bởi Nội giám Đào Đăng Khiêm thời Hậu Lê (năm 1735)',
    passport_checkins: 2680,
    positive_rate: '99.0%',
    rating: 4.93,
    suitable_preferences: ['folk-art', 'photo-checkin', 'combo-all'],
    highlights: [
      'Xem múa rối nước trực tiếp tại Thủy Đình cổ bên ao làng rợp bóng nhãn',
      'Được bước sau mành sáo, trực tiếp cầm sào điều khiển chú Tễu bơi lội',
      'Tự tay tô màu con rối gỗ sung mini làm vật kỷ niệm đáng yêu',
      'Lắng nghe làn điệu chèo và tiếng trống lễ hội dân gian hào hùng'
    ],
    signature_dishes: ['Cơm nắm muối vừng Đào Thục', 'Bánh đa vừng nướng than', 'Gà hấp lá chanh Đông Anh']
  },
  {
    id: 'tay-tuu',
    slug: 'tay-tuu',
    name: 'Làng hoa Tây Tựu',
    category: 'Hoa & Nông nghiệp',
    district: 'Quận Bắc Từ Liêm',
    address: 'Phường Tây Tựu, Quận Bắc Từ Liêm, Hà Nội',
    tagline: 'Bạt ngàn sắc thắm – Vựa hoa bốn mùa của thủ đô',
    shortDescription: 'Làng trồng hoa lâu đời bậc nhất Hà Nội với những cánh đồng hoa cúc, hoa hồng, hoa ly rực rỡ chân trời, chỉ cách trung tâm 13km.',
    heroImage: '/images/villages/tay-tuu/tay_tuu_flower_field.jpg',
    opening_hours: {
      open: '06:00',
      close: '18:30',
      days: 'Thứ Hai – Chủ Nhật',
      openMinutes: 360,
      closeMinutes: 1110,
    },
    minExperienceMinutes: 80,
    min_budget: 120000,
    workshop_price: 40000,
    workshop_economy_price: 20000,
    workshop_name: 'Vườn Hoa Trải Nghiệm & Cắt Cành Tây Tựu',
    artisan_name: 'Nghệ nhân Nhà vườn Lê Văn Bình',
    dining_estimate: 60000,
    dining_snack_estimate: 25000,
    coordinates: {
      lat: 21.0664,
      lng: 105.7289,
    },
    official_decision_id: 'Quyết định số 188/QĐ-UBND Thành phố Hà Nội',
    recognition_year: 2004,
    heritage_rank: 'Làng nghề hoa cây cảnh truyền thống Hà Nội',
    history_origin: 'Nghề trồng hoa truyền thống từ những năm đầu thế kỷ XX',
    passport_checkins: 3290,
    positive_rate: '98.2%',
    rating: 4.87,
    suitable_preferences: ['photo-checkin', 'culinary', 'combo-all'],
    highlights: [
      'Check-in giữa biển hoa cúc họa mi, hoa ly, thược dược muôn sắc màu',
      'Trải nghiệm cầm kéo cắt cành hoa tươi tại ruộng vào sáng sớm',
      'Tự tay cắm giỏ hoa nghệ thuật mang về trang trí phòng khách',
      'Vị trí cực gần trung tâm, chi phí cực kỳ tiết kiệm cho sinh viên và gia đình'
    ],
    signature_dishes: ['Bánh đúc nóng Tây Tựu', 'Chè sen thạch mát', 'Bún cá rô đồng']
  }
];

export function getVerifiedVillageBySlug(slug: string): VerifiedCraftVillage | undefined {
  return VERIFIED_CRAFT_VILLAGES.find((v) => v.slug === slug);
}

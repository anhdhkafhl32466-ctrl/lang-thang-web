export interface RecognizedVillageItem {
  name: string;
  commune: string;
  craftName: string;
  type: 'Làng nghề truyền thống' | 'Làng nghề' | 'Nghề truyền thống';
  recognizedYear?: string;
  featuredSlug?: string;
  isNationalHeritage?: boolean;
}

export interface DistrictCraftStats {
  districtName: string;
  districtSlug: string;
  totalVillages: number;
  recognizedCount: number;
  traditionalCount: number;
  featuredCrafts: string[];
  description: string;
  villages: RecognizedVillageItem[];
}

export const HANOI_CRAFT_OVERVIEW = {
  totalVillagesAndCrafts: 1350, // Chiếm 1/3 số làng nghề toàn quốc (~5.400 làng nghề)
  recognizedCraftVillages: 327, // Được UBND TP Hà Nội chính thức công nhận theo tiêu chí
  traditionalCraftVillages: 59, // Làng nghề truyền thống tiêu biểu lâu đời
  regularCraftVillages: 268, // Làng nghề được công nhận đạt chuẩn hiện đại
  totalDistrictsWithCrafts: 24, // 24 quận, huyện, thị xã có làng nghề
  nationalIntangibleHeritages: 8, // Di sản văn hóa phi vật thể quốc gia
  categoriesCount: 6, // 6 nhóm nghề chính theo Nghị định 52/2018/NĐ-CP
  craftsCount: 47, // 47/52 nghề thủ công truyền thống cả nước có mặt tại Hà Nội
};

export const RECOGNIZED_CRAFT_DIRECTORY: DistrictCraftStats[] = [
  {
    districtName: 'Huyện Thường Tín',
    districtSlug: 'thuong-tin',
    totalVillages: 126,
    recognizedCount: 48,
    traditionalCount: 16,
    featuredCrafts: ['Sơn mài', 'Thêu ren', 'Tiện gỗ', 'Lược sừng', 'Điêu khắc tượng', 'Bánh giầy Quán Gánh'],
    description: 'Thủ phủ làng nghề lớn nhất thủ đô với 48 làng nghề được công nhận, nổi danh khắp thế giới với tranh sơn mài Hạ Thái, thêu ren Quất Động và nghề tiện gỗ Nhị Khê.',
    villages: [
      { name: 'Làng sơn mài Hạ Thái', commune: 'Xã Duyên Thái', craftName: 'Sơn mài mỹ nghệ, tranh sơn ta, đồ decor xuất khẩu', type: 'Làng nghề truyền thống', featuredSlug: 'ha-thai' },
      { name: 'Làng thêu Quất Động', commune: 'Xã Quất Động', craftName: 'Thêu tay nghệ thuật, tranh phong cảnh & thêu cung đình', type: 'Làng nghề truyền thống' },
      { name: 'Làng thêu Thắng Lợi', commune: 'Xã Thắng Lợi', craftName: 'Thêu ren xuất khẩu, khăn bàn gối thêu', type: 'Làng nghề' },
      { name: 'Làng thêu Cổ Chất', commune: 'Xã Dũng Tiến', craftName: 'Thêu tranh chỉ lụa thủ công', type: 'Làng nghề truyền thống' },
      { name: 'Làng thêu phục chế hoàng triều Đông Cứu', commune: 'Xã Dũng Tiến', craftName: 'Thêu phục chế long bào, áo mão lễ hội, cờ phướn', type: 'Làng nghề truyền thống', isNationalHeritage: true },
      { name: 'Làng tiện gỗ Nhị Khê', commune: 'Xã Nhị Khê', craftName: 'Tiện gỗ mỹ nghệ, tràng hạt, bát đĩa gỗ quý', type: 'Làng nghề truyền thống' },
      { name: 'Làng bánh giầy Quán Gánh', commune: 'Xã Nhị Khê', craftName: 'Bánh giầy nhân ngọt, nhân mặn, nhân chay cổ truyền', type: 'Làng nghề truyền thống' },
      { name: 'Làng làm lược sừng Thụy Ứng', commune: 'Xã Hòa Bình', craftName: 'Chế tác sừng trâu bò, lược sừng, quà tặng mỹ nghệ xuất khẩu', type: 'Làng nghề truyền thống' },
      { name: 'Làng điêu khắc gỗ Nhân Hiền', commune: 'Xã Hiền Giang', craftName: 'Điêu khắc tượng Phật gỗ, tượng linh thú', type: 'Làng nghề truyền thống' },
      { name: 'Làng làm chăn bông gối đệm Trát Cầu', commune: 'Xã Tiền Phong', craftName: 'Cào bông, may chăn gối ga đệm xuất khẩu quy mô lớn', type: 'Làng nghề' },
      { name: 'Làng mộc Thượng Cung', commune: 'Xã Tiền Phong', craftName: 'Điêu khắc mộc cổ truyền, nhà gỗ', type: 'Làng nghề' },
      { name: 'Làng khảm trai Vĩnh Lộc', commune: 'Xã Thư Phú', craftName: 'Cẩn ốc xà cừ đồ gỗ gia dụng', type: 'Làng nghề' },
      { name: 'Làng mây tre đan Duyên Trường', commune: 'Xã Duyên Thái', craftName: 'Đan mây giang xuất khẩu', type: 'Làng nghề' },
      { name: 'Làng cơ khí kim khí Phụng Công', commune: 'Xã Hòa Bình', craftName: 'Gia công dập kim khí, bản lề đồ gỗ', type: 'Làng nghề' },
      { name: 'Làng nón lá Phú Mỹ', commune: 'Xã Văn Phú', craftName: 'Chằm nón lá búp', type: 'Làng nghề' },
      { name: 'Làng mộc dân dụng Vạn Điểm', commune: 'Xã Vạn Điểm', craftName: 'Đóng bàn ghế salon gỗ gụ, gỗ trắc', type: 'Làng nghề truyền thống' },
      { name: 'Làng mộc điêu khắc Hồng Vân', commune: 'Xã Hồng Vân', craftName: 'Chạm khắc gỗ mỹ nghệ & bonsai cây cảnh', type: 'Làng nghề' },
      { name: 'Làng hoa cây cảnh Xâm Xuyên', commune: 'Xã Hồng Vân', craftName: 'Uốn tỉa cây thế, hoa lan kiểng', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Phú Xuyên',
    districtSlug: 'phu-xuyen',
    totalVillages: 154,
    recognizedCount: 43,
    traditionalCount: 12,
    featuredCrafts: ['Khảm trai', 'Tò he', 'Đan cỏ tế', 'May mặc comple', 'Da giày', 'Mộc Đại Nghiệp'],
    description: 'Xứ sở trăm nghề phía Nam thủ đô, cái nôi của nghệ thuật khảm xà cừ Chuôn Ngọ hơn 1.000 năm, con giống tò he Xuân La độc nhất vô nhị và các cụm làng nghề cỏ tế xuất khẩu 5 châu.',
    villages: [
      { name: 'Làng khảm trai Chuôn Ngọ (Chuyên Mỹ)', commune: 'Xã Chuyên Mỹ', craftName: 'Cẩn ốc xà cừ ngũ sắc, khảm trai cung đình', type: 'Làng nghề truyền thống', featuredSlug: 'chuyen-my', isNationalHeritage: true },
      { name: 'Làng khảm trai Chuôn Trung', commune: 'Xã Chuyên Mỹ', craftName: 'Khảm trai mỹ nghệ, tranh phong cảnh xà cừ', type: 'Làng nghề truyền thống' },
      { name: 'Làng khảm trai Chuôn Thượng', commune: 'Xã Chuyên Mỹ', craftName: 'Khảm xà cừ bàn ghế tủ chè cao cấp', type: 'Làng nghề truyền thống' },
      { name: 'Làng sơn mài Đồng Vinh', commune: 'Xã Chuyên Mỹ', craftName: 'Sơn mài kết hợp cẩn ốc khảm trai', type: 'Làng nghề' },
      { name: 'Làng tò he Xuân La', commune: 'Xã Phượng Dực', craftName: 'Nặn con giống bột tò he dân gian', type: 'Làng nghề truyền thống', featuredSlug: 'xuan-la' },
      { name: 'Làng đan cỏ tế Lưu Thượng', commune: 'Xã Phú Túc', craftName: 'Đan mây guột cỏ tế mỹ nghệ xuất khẩu', type: 'Làng nghề truyền thống' },
      { name: 'Làng đan cỏ tế Hoàng Xá', commune: 'Xã Phú Túc', craftName: 'Đan bèo tây, cỏ tế, khay rổ lưu niệm', type: 'Làng nghề' },
      { name: 'Làng may mặc comple Vân Từ', commune: 'Xã Vân Từ', craftName: 'May đo âu phục comple cao cấp xuất khẩu', type: 'Làng nghề truyền thống' },
      { name: 'Làng da giày Giẽ Thượng', commune: 'Xã Phú Yên', craftName: 'Đóng giày da thủ công gia truyền', type: 'Làng nghề truyền thống' },
      { name: 'Làng da giày Giẽ Hạ', commune: 'Xã Phú Yên', craftName: 'Sản xuất giày dép da thời trang', type: 'Làng nghề' },
      { name: 'Làng mộc mỹ nghệ Đại Nghiệp', commune: 'Xã Tân Dân', craftName: 'Mộc mỹ nghệ gỗ quý chạm rồng phượng', type: 'Làng nghề truyền thống' },
      { name: 'Làng mộc cổ truyền Gia Phú', commune: 'Xã Tân Dân', craftName: 'Sản xuất đồ gỗ nội thất phòng khách', type: 'Làng nghề' },
      { name: 'Làng nghề tơ lưới Tri Thủy', commune: 'Xã Tri Thủy', craftName: 'Đan tơ lưới đánh cá sông biển', type: 'Làng nghề' },
      { name: 'Làng tơ chuối Khai Thái', commune: 'Xã Khai Thái', craftName: 'Khai thác sợi tơ chuối dệt vải sinh thái', type: 'Làng nghề' },
      { name: 'Làng nón lá Cổ Hoàng', commune: 'Xã Hoàng Long', craftName: 'Làm nón lá chằm ba tầm', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Thạch Thất',
    districtSlug: 'thach-that',
    totalVillages: 59,
    recognizedCount: 32,
    traditionalCount: 10,
    featuredCrafts: ['Chuồn chuồn tre', 'Làm quạt', 'Mộc nhà cổ', 'Bánh chè lam', 'Cơ kim khí'],
    description: 'Vùng đất xứ Đoài danh tiếng với ngôi chùa Tây Phương linh thiêng, làng chuồn chuồn tre Thạch Xá thăng bằng kỳ diệu, quạt giấy Chàng Sơn dự hội chợ Paris và các làng mộc tài hoa.',
    villages: [
      { name: 'Làng chuồn chuồn tre Thạch Xá', commune: 'Xã Thạch Xá', craftName: 'Chuồn chuồn tre thăng bằng đối trọng mỹ nghệ', type: 'Làng nghề truyền thống', featuredSlug: 'thach-xa' },
      { name: 'Làng bánh chè lam Thạch Xá', commune: 'Xã Thạch Xá', craftName: 'Bánh chè lam xứ Đoài, kẹo lạc mật mía', type: 'Làng nghề truyền thống' },
      { name: 'Làng quạt Chàng Sơn', commune: 'Xã Chàng Sơn', craftName: 'Làm quạt giấy điệp, quạt lụa chạm nan mẹ', type: 'Làng nghề truyền thống', featuredSlug: 'chang-son' },
      { name: 'Làng mộc kiến trúc cổ Chàng Sơn', commune: 'Xã Chàng Sơn', craftName: 'Dựng nhà gỗ cổ truyền, điêu khắc tượng 18 vị La Hán', type: 'Làng nghề truyền thống' },
      { name: 'Làng mộc Hữu Bằng', commune: 'Xã Hữu Bằng', craftName: 'Sản xuất nội thất đồ gỗ gia dụng lớn nhất miền Bắc', type: 'Làng nghề' },
      { name: 'Làng mộc Canh Nậu', commune: 'Xã Canh Nậu', craftName: 'Mộc xây dựng, cửa gỗ, cầu thang', type: 'Làng nghề' },
      { name: 'Làng mộc Dị Nậu', commune: 'Xã Dị Nậu', craftName: 'Sản xuất bàn ghế sofa gỗ tự nhiên', type: 'Làng nghề' },
      { name: 'Làng cơ kim khí Phùng Xá', commune: 'Xã Phùng Xá', craftName: 'Cơ khí chính xác, dập kéo kim loại', type: 'Làng nghề' },
      { name: 'Làng mây tre giang đan Bình Phú', commune: 'Xã Bình Phú', craftName: 'Đan giát giường, rèm mây tre xuất khẩu', type: 'Làng nghề' },
      { name: 'Làng mộc Hương Ngải', commune: 'Xã Hương Ngải', craftName: 'Thiết kế thi công nhà gỗ kẻ truyền', type: 'Làng nghề truyền thống' },
    ]
  },
  {
    districtName: 'Huyện Chương Mỹ',
    districtSlug: 'chuong-my',
    totalVillages: 180,
    recognizedCount: 30,
    traditionalCount: 8,
    featuredCrafts: ['Mây tre đan Phú Vinh', 'Nón lá', 'Điêu khắc đá', 'Mộc'],
    description: 'Nổi tiếng thế giới với làng mây tre đan Phú Vinh sở hữu kỹ thuật đan nan xiên, tranh chân dung mây tre OCOP 5 sao tinh xảo bậc nhất cùng nhiều làng nghề nón lá ven sông Đáy.',
    villages: [
      { name: 'Làng mây tre đan Phú Vinh', commune: 'Xã Phú Nghĩa', craftName: 'Mây tre đan nan mịn, tranh mây mỹ nghệ OCOP 5 sao', type: 'Làng nghề truyền thống', featuredSlug: 'phu-vinh', isNationalHeritage: true },
      { name: 'Làng mây tre Quan Châm', commune: 'Xã Phú Nghĩa', craftName: 'Đan giỏ, lẵng hoa mây xuất khẩu', type: 'Làng nghề truyền thống' },
      { name: 'Làng mây tre đan Ninh Sở', commune: 'Xã Ninh Sở', craftName: 'Đan rổ rá tre nan mỏng xuất khẩu sang Nhật', type: 'Làng nghề truyền thống' },
      { name: 'Làng nón lá Mã Lão', commune: 'Xã Đồng Tân', craftName: 'Chằm nón lá cổ truyền Bắc Bộ', type: 'Làng nghề' },
      { name: 'Làng điêu khắc đá Tiên Phương', commune: 'Xã Tiên Phương', craftName: 'Chạm khắc tượng đá xanh, bia đá', type: 'Làng nghề' },
      { name: 'Làng nón lá Lam Điền', commune: 'Xã Lam Điền', craftName: 'Sản xuất nón lá du lịch', type: 'Làng nghề' },
      { name: 'Làng mộc Thụy Hương', commune: 'Xã Thụy Hương', craftName: 'Mộc dân dụng & nội thất gia đình', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Ứng Hòa',
    districtSlug: 'ung-hoa',
    totalVillages: 145,
    recognizedCount: 29,
    traditionalCount: 7,
    featuredCrafts: ['Tăm hương Quảng Phú Cầu', 'May áo dài Trạch Xá', 'Nhạc cụ Đào Xá', 'Bún Bặt', 'Vịt cỏ Vân Đình'],
    description: 'Địa linh nhân kiệt với làng tăm hương Quảng Phú Cầu xòe hoa nổi danh quốc tế, làng may áo dài Trạch Xá nghìn năm cầm kim dọc và làng nhạc cụ dân tộc Đào Xá chế tác đàn bầu, đàn tranh.',
    villages: [
      { name: 'Làng tăm hương Quảng Phú Cầu', commune: 'Xã Quảng Phú Cầu', craftName: 'Chân hương xòe hoa, tăm hương, nụ trầm thảo mộc', type: 'Làng nghề truyền thống', featuredSlug: 'quang-phu-cau' },
      { name: 'Làng chân hương Đạo Tú', commune: 'Xã Quảng Phú Cầu', craftName: 'Nhuộm chân hương đỏ thắm, phơi hoa nghệ thuật', type: 'Làng nghề truyền thống' },
      { name: 'Làng may áo dài Trạch Xá', commune: 'Xã Hòa Lâm', craftName: 'May đo áo dài truyền thống cầm kim dọc giấu chỉ', type: 'Làng nghề truyền thống', featuredSlug: 'trach-xa', isNationalHeritage: true },
      { name: 'Làng làm nhạc cụ dân tộc Đào Xá', commune: 'Xã Đông Lỗ', craftName: 'Chế tác đàn bầu, đàn nguyệt, đàn tranh, tỳ bà', type: 'Làng nghề truyền thống', isNationalHeritage: true },
      { name: 'Làng bún Bặt', commune: 'Xã Liên Bạt', craftName: 'Bún tươi sợi nhỏ dẻo thơm truyền thống', type: 'Làng nghề truyền thống' },
      { name: 'Làng may màn dệt vải Hòa Xá', commune: 'Xã Hòa Xá', craftName: 'Dệt sợi bông, may màn tuyn', type: 'Làng nghề' },
      { name: 'Làng giày da Thôn Thần', commune: 'Xã Minh Đức', craftName: 'Đóng giày da nam nữ thủ công', type: 'Làng nghề' },
      { name: 'Làng ẩm thực vịt cỏ Vân Đình', commune: 'Thị trấn Vân Đình', craftName: 'Chế biến vịt nướng lu than hoa, tiết canh', type: 'Làng nghề truyền thống' },
    ]
  },
  {
    districtName: 'Huyện Thanh Oai',
    districtSlug: 'thanh-oai',
    totalVillages: 120,
    recognizedCount: 25,
    traditionalCount: 6,
    featuredCrafts: ['Nón lá làng Chuông', 'Lồng chim Làng Vác', 'Giò chả Ước Lễ', 'Điêu khắc đá Võ Lăng'],
    description: 'Xứ sở nón lá làng Chuông bên bờ sông Đáy, lồng chim Canh Hoạch chạm trổ hoa thị danh tiếng và giò chả Ước Lễ nức tiếng sành ăn khắp chốn kinh kỳ.',
    villages: [
      { name: 'Làng nón Chuông', commune: 'Xã Phương Trung', craftName: 'Nón lá bài thơ, nón ba tầm, nón quai thao, nón chuông lụa', type: 'Làng nghề truyền thống', featuredSlug: 'chuong' },
      { name: 'Làng lồng chim Canh Hoạch (Làng Vác)', commune: 'Xã Dân Hòa', craftName: 'Chế tác lồng chim nghệ thuật chạm trổ hoa thị tinh xảo', type: 'Làng nghề truyền thống' },
      { name: 'Làng giò chả Ước Lễ', commune: 'Xã Tân Ước', craftName: 'Giò lụa nạc mông giã tay, chả quế nướng thơm lừng', type: 'Làng nghề truyền thống' },
      { name: 'Làng điêu khắc đá mỹ nghệ Võ Lăng', commune: 'Xã Dân Hòa', craftName: 'Chạm khắc tượng đá rồng phượng, đồ thờ đá xanh', type: 'Làng nghề' },
      { name: 'Làng cơ khí dệt Thanh Thùy', commune: 'Xã Thanh Thùy', craftName: 'Gia công ngũ kim bản lề, móc khóa, đinh ốc', type: 'Làng nghề' },
      { name: 'Làng quạt giấy Tiên Lữ', commune: 'Xã Dân Hòa', craftName: 'Làm quạt nan tre, quạt giấy bồi', type: 'Làng nghề' },
      { name: 'Làng miến dong Cự Đà', commune: 'Xã Cự Khê', craftName: 'Sản xuất miến dong sợi vàng & tương nếp cổ', type: 'Làng nghề truyền thống' },
    ]
  },
  {
    districtName: 'Huyện Hoài Đức',
    districtSlug: 'hoai-duc',
    totalVillages: 54,
    recognizedCount: 18,
    traditionalCount: 4,
    featuredCrafts: ['Tạc tượng Sơn Đồng', 'Dệt len La Phù', 'Nông sản Cát Quế', 'Bánh kẹo Minh Khai'],
    description: 'Cửa ngõ phía Tây thủ đô, nơi hội tụ làng tạc tượng Sơn Đồng hơn 800 năm tuổi cung cấp đồ thờ cho phần lớn đền chùa cả nước, cùng cụm làng nghề bánh kẹo, nông sản sôi động.',
    villages: [
      { name: 'Làng nghề tạc tượng & đồ thờ Sơn Đồng', commune: 'Xã Sơn Đồng', craftName: 'Tạc tượng Phật gỗ mít, sơn son thếp vàng hoành phi câu đối', type: 'Làng nghề truyền thống', featuredSlug: 'son-dong', isNationalHeritage: true },
      { name: 'Làng dệt len & bánh kẹo La Phù', commune: 'Xã La Phù', craftName: 'Dệt áo len máy, sản xuất bánh kẹo đa dạng', type: 'Làng nghề' },
      { name: 'Làng chế biến nông sản Cát Quế', commune: 'Xã Cát Quế', craftName: 'Chế biến tinh bột sắn ướt, miến dong sạch', type: 'Làng nghề' },
      { name: 'Làng miến dong Dương Liễu', commune: 'Xã Dương Liễu', craftName: 'Sản xuất miến dong củ sạch xuất khẩu', type: 'Làng nghề' },
      { name: 'Làng bánh kẹo Minh Khai', commune: 'Xã Minh Khai', craftName: 'Bánh gạo nướng, bỏng gạo, bánh quy', type: 'Làng nghề' },
      { name: 'Làng rèn Kim Chung', commune: 'Xã Kim Chung', craftName: 'Rèn nông cụ kim khí & dao kéo', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Gia Lâm',
    districtSlug: 'gia-lam',
    totalVillages: 75,
    recognizedCount: 16,
    traditionalCount: 5,
    featuredCrafts: ['Gốm sứ Bát Tràng', 'Gốm Kim Lan', 'Dát vàng Kiêu Kỵ', 'Đúc đồng Kiêu Kỵ', 'Thuốc bắc Ninh Hiệp'],
    description: 'Vùng đất tả ngạn sông Hồng cổ kính với gốm Bát Tràng trứ danh quốc tế, làng dát vàng quỳ Kiêu Kỵ duy nhất Việt Nam và làng gốm phù sa Kim Lan ngàn năm.',
    villages: [
      { name: 'Làng gốm sứ Bát Tràng', commune: 'Xã Bát Tràng', craftName: 'Gốm sứ nghệ thuật, men lam, men rạn thời Lê', type: 'Làng nghề truyền thống', featuredSlug: 'bat-trang', isNationalHeritage: true },
      { name: 'Làng gốm mỹ nghệ Giang Cao', commune: 'Xã Bát Tràng', craftName: 'Gốm mỹ nghệ phong thủy & xuất khẩu', type: 'Làng nghề truyền thống' },
      { name: 'Làng gốm Kim Lan', commune: 'Xã Kim Lan', craftName: 'Gốm gia dụng phù sa, ngói cổ, chậu cây gốm', type: 'Làng nghề truyền thống' },
      { name: 'Làng dát vàng bạc quỳ Kiêu Kỵ', commune: 'Xã Kiêu Kỵ', craftName: 'Đập quỳ vàng quỳ bạc thếp tượng và hoành phi', type: 'Làng nghề truyền thống', featuredSlug: 'kieu-ky', isNationalHeritage: true },
      { name: 'Làng đúc đồng Kiêu Kỵ', commune: 'Xã Kiêu Kỵ', craftName: 'Đúc tượng đồng, chuông đồng, đỉnh hương thờ', type: 'Làng nghề' },
      { name: 'Làng thuốc bắc Ninh Hiệp', commune: 'Xã Ninh Hiệp', craftName: 'Bào chế thảo dược thuốc nam Bắc dược cổ', type: 'Làng nghề truyền thống' },
    ]
  },
  {
    districtName: 'Huyện Đông Anh',
    districtSlug: 'dong-anh',
    totalVillages: 82,
    recognizedCount: 14,
    traditionalCount: 4,
    featuredCrafts: ['Múa rối nước Đào Thục', 'Mộc mỹ nghệ Vân Hà', 'Đúc đồng', 'Chạm khắc gỗ Thiết Ứng'],
    description: 'Cố đô Cổ Loa ngàn năm, nơi phường rối nước Đào Thục đẽo quân rối gỗ biểu diễn khắp năm châu và làng mộc mỹ nghệ Vân Hà với tay nghề chạm khắc tượng gỗ quý trứ danh.',
    villages: [
      { name: 'Làng múa rối nước Đào Thục', commune: 'Xã Thụy Lâm', craftName: 'Trình diễn rối nước thủy đình & đẽo quân rối gỗ sung', type: 'Làng nghề truyền thống', featuredSlug: 'dao-thuc', isNationalHeritage: true },
      { name: 'Làng mộc mỹ nghệ Thiết Ứng (Vân Hà)', commune: 'Xã Vân Hà', craftName: 'Điêu khắc tượng gỗ quý nghệ thuật & khảm ốc', type: 'Làng nghề truyền thống' },
      { name: 'Làng mộc mỹ nghệ Hà Khê', commune: 'Xã Vân Hà', craftName: 'Sản xuất đồ gỗ nội thất quý tộc', type: 'Làng nghề' },
      { name: 'Làng mộc mỹ nghệ Đại Vĩ', commune: 'Xã Liên Hà', craftName: 'Gia công gỗ nội thất xuất khẩu', type: 'Làng nghề' },
      { name: 'Làng rèn Thụy Lôi', commune: 'Xã Thụy Lâm', craftName: 'Rèn kim khí rèn dao nông cụ', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Quận Hà Đông',
    districtSlug: 'ha-dong',
    totalVillages: 35,
    recognizedCount: 11,
    traditionalCount: 3,
    featuredCrafts: ['Lụa Vạn Phúc', 'Rèn Đa Sỹ', 'Mộc chạm Thượng Mão'],
    description: 'Nổi bật với thủ phủ lụa tơ tằm Vạn Phúc hơn 1.000 năm lịch sử dệt lụa Vân tiến vua và làng rèn dao kéo Đa Sỹ tinh xảo bậc nhất miền Bắc.',
    villages: [
      { name: 'Làng lụa Vạn Phúc', commune: 'Phường Vạn Phúc', craftName: 'Dệt lụa tơ tằm nguyên chất, lụa Vân cung đình', type: 'Làng nghề truyền thống', featuredSlug: 'van-phuc', isNationalHeritage: true },
      { name: 'Làng rèn Đa Sỹ', commune: 'Phường Kiến Hưng', craftName: 'Rèn dao kéo thủ công gia truyền sắc bén', type: 'Làng nghề truyền thống' },
      { name: 'Làng mộc Thượng Mão', commune: 'Phường Vạn Phúc', craftName: 'Chạm khắc gỗ nội thất mỹ nghệ', type: 'Làng nghề' },
      { name: 'Làng dệt La Cả', commune: 'Phường Dương Nội', craftName: 'Dệt vải sợi tơ truyền thống', type: 'Làng nghề' },
      { name: 'Làng mộc Yên Nghĩa', commune: 'Phường Yên Nghĩa', craftName: 'Mộc dân dụng & đóng thuyền nan xưa', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Sóc Sơn',
    districtSlug: 'soc-son',
    totalVillages: 70,
    recognizedCount: 11,
    traditionalCount: 2,
    featuredCrafts: ['Tre trúc hun khói Xuân Lai', 'Bánh kẹo Phù Lỗ', 'Chè sạch Bắc Sơn'],
    description: 'Vùng đất núi Sóc thánh Gióng với làng tre trúc hun khói Xuân Lai màu cánh gián tự nhiên không hóa chất và vùng chè sạch hữu cơ ven núi.',
    villages: [
      { name: 'Làng tre trúc hun khói Xuân Lai', commune: 'Xã Xuân Thu', craftName: 'Bàn ghế trúc hun khói rơm rạ tự nhiên chống mọt', type: 'Làng nghề truyền thống' },
      { name: 'Làng bánh kẹo truyền thống Phù Lỗ', commune: 'Xã Phù Lỗ', craftName: 'Làm bánh khảo, kẹo lạc, kẹo vừng', type: 'Làng nghề' },
      { name: 'Làng trồng chè sạch Bắc Sơn', commune: 'Xã Bắc Sơn', craftName: 'Chế biến chè búp hương hoa tự nhiên', type: 'Làng nghề' },
      { name: 'Làng rèn kim khí Tiên Dược', commune: 'Xã Tiên Dược', craftName: 'Rèn nông cụ sản xuất', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Mê Linh',
    districtSlug: 'me-linh',
    totalVillages: 50,
    recognizedCount: 10,
    traditionalCount: 2,
    featuredCrafts: ['Làng hoa hồng Mê Linh', 'Hoa Tiền Phong', 'Mộc Văn Khê'],
    description: 'Vùng đất Hai Bà Trưng với vựa hoa hồng cắt cành và cúc đại đóa lớn nhất thủ đô, cung cấp hàng triệu cành hoa tươi mỗi ngày cho cả nước.',
    villages: [
      { name: 'Làng hoa hồng Mê Linh', commune: 'Xã Mê Linh', craftName: 'Trồng hoa hồng ngoại, hoa hồng cắt cành', type: 'Làng nghề truyền thống' },
      { name: 'Làng hoa Tiền Phong', commune: 'Xã Tiền Phong', craftName: 'Trồng hoa cúc, hoa ly nhà kính', type: 'Làng nghề' },
      { name: 'Làng mộc điêu khắc Văn Khê', commune: 'Xã Văn Khê', craftName: 'Mộc mỹ nghệ chạm trổ', type: 'Làng nghề' },
      { name: 'Làng mây tre Hoàng Kim', commune: 'Xã Hoàng Kim', craftName: 'Đan lẵng mây tre gia dụng', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Thị xã Sơn Tây & Huyện Ba Vì',
    districtSlug: 'son-tay-ba-vi',
    totalVillages: 90,
    recognizedCount: 18,
    traditionalCount: 5,
    featuredCrafts: ['Tương nếp Đường Lâm', 'Bánh tẻ Phú Nhi', 'Thuốc nam Dao Ba Vì', 'Nón lá Cổ Đô'],
    description: 'Đất hai vua Đường Lâm với tương nếp chum sành, chè lam xứ Đoài, bánh tẻ lá dong Phú Nhi thơm mát cùng bài thuốc nam bí truyền của đồng bào Dao Ba Vì.',
    villages: [
      { name: 'Làng tương nếp Đường Lâm (Mông Phụ)', commune: 'Xã Đường Lâm, TX. Sơn Tây', craftName: 'Ủ tương nếp chum sành, chè lam, kẹo dồi', type: 'Làng nghề truyền thống' },
      { name: 'Làng bánh tẻ Phú Nhi', commune: 'Phường Phú Thịnh, TX. Sơn Tây', craftName: 'Bánh tẻ nhân thịt mộc nhĩ gói lá dong', type: 'Làng nghề truyền thống' },
      { name: 'Làng thuốc nam người Dao Ba Vì (Hợp Nhất)', commune: 'Xã Ba Vì, H. Ba Vì', craftName: 'Thuốc tắm thảo dược, bài thuốc lá rừng bí truyền', type: 'Làng nghề truyền thống' },
      { name: 'Làng nón lá Cổ Đô', commune: 'Xã Cổ Đô, H. Ba Vì', craftName: 'Chằm nón lá quê hương danh họa Cổ Đô', type: 'Làng nghề' },
      { name: 'Làng rèn Phú Châu', commune: 'Xã Phú Châu, H. Ba Vì', craftName: 'Rèn kim khí dụng cụ nông nghiệp', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Đan Phượng & Hoài Đức & Quốc Oai',
    districtSlug: 'dan-phuong-quoc-oai',
    totalVillages: 85,
    recognizedCount: 15,
    traditionalCount: 4,
    featuredCrafts: ['Diều sáo Bá Dương Nội', 'Mộc nhà cổ Yên Nội', 'Mây tre đan Tân Hòa'],
    description: 'Vùng châu thổ sông Đáy với diều sáo nghìn năm Bá Dương Nội vang vọng trời mây và làng nghề dựng nhà gỗ cổ truyền Yên Nội tài hoa.',
    villages: [
      { name: 'Làng làm diều sáo Bá Dương Nội', commune: 'Xã Hồng Hà, H. Đan Phượng', craftName: 'Chế tác diều cánh cung đâm sáo gỗ ngàn năm', type: 'Làng nghề truyền thống', isNationalHeritage: true },
      { name: 'Làng mộc nhà cổ Yên Nội', commune: 'Xã Đồng Quang, H. Quốc Oai', craftName: 'Dựng nhà rường, nhà gỗ lim kẻ truyền cổ', type: 'Làng nghề truyền thống' },
      { name: 'Làng mây tre đan Tân Hòa', commune: 'Xã Tân Hòa, H. Quốc Oai', craftName: 'Đan mây giang xuất khẩu sang châu Âu', type: 'Làng nghề' },
      { name: 'Làng mộc dân dụng Thọ An', commune: 'Xã Thọ An, H. Đan Phượng', craftName: 'Đóng bàn ghế cửa gỗ', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Huyện Phúc Thọ & Mỹ Đức & Thanh Trì',
    districtSlug: 'phuc-tho-my-duc-thanh-tri',
    totalVillages: 75,
    recognizedCount: 15,
    traditionalCount: 3,
    featuredCrafts: ['Lụa tơ sen Mỹ Đức', 'Dệt quai thao Triều Khúc', 'Mộc mỹ nghệ Long Phú'],
    description: 'Nơi phát tích kỹ thuật rút tơ sen dệt vải đầu tiên của Việt Nam tại Phùng Xá (Mỹ Đức) và làng nghề dệt quai thao, chổi lông gà Triều Khúc cổ kính.',
    villages: [
      { name: 'Làng lụa tơ sen Phùng Xá', commune: 'Xã Phùng Xá, H. Mỹ Đức', craftName: 'Dệt khăn lụa tơ sen thủ công quý hiếm', type: 'Làng nghề truyền thống' },
      { name: 'Làng dệt quai thao & lông gà Triều Khúc', commune: 'Xã Tân Triều, H. Thanh Trì', craftName: 'Dệt thao nón ba tầm, làm chổi lông gà thủ công', type: 'Làng nghề truyền thống' },
      { name: 'Làng mộc mỹ nghệ Long Phú', commune: 'Xã Long Xuyên, H. Phúc Thọ', craftName: 'Điêu khắc đồ gỗ nội thất phòng khách', type: 'Làng nghề' },
      { name: 'Làng rượu mơ chùa Hương', commune: 'Xã Hương Sơn, H. Mỹ Đức', craftName: 'Ủ men rượu mơ rừng chùa Hương hảo hạng', type: 'Làng nghề' },
    ]
  },
  {
    districtName: 'Các Quận Nội Thành (Tây Hồ, Nam/Bắc Từ Liêm, Ba Đình, Cầu Giấy, Hoàng Mai)',
    districtSlug: 'cac-quan-noi-thanh',
    totalVillages: 45,
    recognizedCount: 11,
    traditionalCount: 9,
    featuredCrafts: ['Cốm Mễ Trì', 'Hoa Tây Tựu', 'Trà sen Tây Hồ', 'Hoa đào Nhật Tân', 'Quất Tứ Liên', 'Đúc đồng Ngũ Xã', 'Đậu bạc Định Công', 'Cốm Vòng'],
    description: 'Trái tim Thăng Long ngàn năm văn hiến lưu giữ những nét tinh hoa ẩm thực và mỹ nghệ kinh kỳ tinh tế bậc nhất như cốm mộc Mễ Trì, trà sen Tây Hồ, hoa đào Nhật Tân và đúc đồng Ngũ Xã.',
    villages: [
      { name: 'Làng làm cốm Mễ Trì', commune: 'Phường Mễ Trì, Q. Nam Từ Liêm', craftName: 'Cốm mộc nếp non lá sen, chả cốm, xôi cốm', type: 'Làng nghề truyền thống', featuredSlug: 'me-tri', isNationalHeritage: true },
      { name: 'Làng hoa Tây Tựu', commune: 'Phường Tây Tựu, Q. Bắc Từ Liêm', craftName: 'Trồng hoa ly, hoa cúc, hoa hồng thắp đèn đêm', type: 'Làng nghề truyền thống', featuredSlug: 'tay-tuu' },
      { name: 'Làng ướp trà sen Quảng An (Tây Hồ)', commune: 'Phường Quảng An, Q. Tây Hồ', craftName: 'Ướp trà sen Bách Diệp Tây Hồ thượng hạng', type: 'Làng nghề truyền thống', isNationalHeritage: true },
      { name: 'Làng hoa đào Nhật Tân', commune: 'Phường Nhật Tân, Q. Tây Hồ', craftName: 'Trồng đào bích, đào phai, đào thất thốn tiến vua', type: 'Làng nghề truyền thống' },
      { name: 'Làng quất cảnh Tứ Liên', commune: 'Phường Tứ Liên, Q. Tây Hồ', craftName: 'Uốn tỉa quất cảnh thế, quất bonsai nghệ thuật', type: 'Làng nghề truyền thống' },
      { name: 'Làng đúc đồng Ngũ Xã', commune: 'Phường Trúc Bạch, Q. Ba Đình', craftName: 'Đúc tượng đồng, đỉnh hương thờ truyền thống', type: 'Làng nghề truyền thống' },
      { name: 'Làng kim hoàn Định Công', commune: 'Phường Định Công, Q. Hoàng Mai', craftName: 'Kỹ thuật đậu bạc, làm trang sức vàng bạc nghìn năm', type: 'Làng nghề truyền thống' },
      { name: 'Làng cốm Vòng', commune: 'Phường Dịch Vọng Hậu, Q. Cầu Giấy', craftName: 'Cốm xanh dẻo thơm gói lá sen mùa thu', type: 'Làng nghề truyền thống' },
    ]
  }
];

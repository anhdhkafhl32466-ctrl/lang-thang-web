export interface Tour {
  id: string;
  name: string;
  villageId: string;
  villageName: string;
  category: 'Workshop trải nghiệm' | 'Tour trong ngày' | 'Tour nửa ngày' | 'Homestay & Di sản';
  price: number;
  duration: string;
  groupSize: string;
  rating: number;
  reviewsCount: number;
  image: string;
  shortDescription: string;
  highlights: string[];
  schedule: {
    time: string;
    activity: string;
  }[];
  included: string[];
  excluded: string[];
  locationMeeting: string;
  isPopular?: boolean;
}

export const TOURS: Tour[] = [
  {
    id: 'tour-bt-01',
    name: 'Workshop Vuốt Gốm Bát Tràng & Khám Phá Lò Bầu Cổ',
    villageId: 'bat-trang',
    villageName: 'Làng gốm Bát Tràng',
    category: 'Workshop trải nghiệm',
    price: 350000,
    duration: '3.5 giờ (Sáng 08:30 hoặc Chiều 14:00)',
    groupSize: 'Tối đa 15 người / nhóm',
    rating: 4.95,
    reviewsCount: 340,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Tự tay ngồi bên bàn xoay nắn vuốt chiếc bát hoặc bình hoa của riêng bạn dưới sự hướng dẫn 1-kèm-1 của nghệ nhân Bát Tràng, sau đó sấy nung mang về.',
    highlights: [
      'Trải nghiệm 2 giờ vuốt gốm thực tế trên bàn xoay điện & bàn xoay chân',
      'Được tráng men và nung lò thành phẩm mang về làm kỷ niệm',
      'Tham quan Lò Bầu cổ gần 100 năm tuổi duy nhất còn sót lại',
      'Thưởng thức trà sen và bánh chè lam Bát Tràng'
    ],
    schedule: [
      { time: '08:30', activity: 'Đón tiếp tại Xưởng gốm nghệ nhân, thưởng trà và giới thiệu về các loại đất sét Bát Tràng.' },
      { time: '09:00', activity: 'Nghệ nhân thị phạm kỹ thuật chuốt gốm, định tâm và kéo cổ bình.' },
      { time: '09:30', activity: 'Tự tay thực hành vuốt gốm mộc, vẽ hoa văn bằng bút lông men lam.' },
      { time: '11:00', activity: 'Khám phá Lò Bầu cổ, chụp ảnh check-in và đăng ký gửi tác phẩm nung giao tận nhà.' }
    ],
    included: [
      'Toàn bộ đất sét, bàn xoay, dụng cụ và màu vẽ men',
      'Hỗ trợ tráng men nung lò chuyên nghiệp',
      'Nước uống và đồ ăn nhẹ truyền thống',
      'Hướng dẫn viên làng nghề song ngữ Việt - Anh'
    ],
    excluded: [
      'Phí ship thành phẩm nung về địa chỉ nhà (nếu nung gửi sau 2 ngày)',
      'Chi phí mua sắm đồ lưu niệm cá nhân'
    ],
    locationMeeting: 'Cổng chợ Gốm cổ Bát Tràng, Gia Lâm, Hà Nội',
    isPopular: true
  },
  {
    id: 'tour-vp-01',
    name: 'Hành Trình Tàu Điện Trên Cao & Trải Nghiệm Lụa Vạn Phúc',
    villageId: 'van-phuc',
    villageName: 'Làng lụa Vạn Phúc',
    category: 'Tour nửa ngày',
    price: 420000,
    duration: '4 giờ (Buổi sáng 08:00 - 12:00)',
    groupSize: 'Nhóm 6 - 20 người',
    rating: 4.88,
    reviewsCount: 180,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Trải nghiệm đi tàu điện Metro hiện đại ngắm Hà Nội từ trên cao đến ga Vạn Phúc, dạo bước con đường ô dù rực rỡ và tự tay thử dệt lụa trên khung cửi cổ.',
    highlights: [
      'Vé tàu điện Cát Linh - Hà Đông khứ hồi',
      'Check-in con đường ô lụa sắc màu và miếu Bà Chúa Lụa A Lã Thị Nương',
      'Trực tiếp xem quy trình ươm tơ từ kén vàng và ngồi thử vào khung cửi dệt lụa',
      'Tặng 1 khăn tay lụa tơ tằm nguyên bản có thêu tên cá nhân'
    ],
    schedule: [
      { time: '08:00', activity: 'Tập trung tại ga Cát Linh, lên tàu điện trên cao ngắm toàn cảnh phía Tây Thủ đô.' },
      { time: '08:35', activity: 'Đến ga Vạn Phúc, tản bộ vào cổng làng cổ kính rợp bóng ô dù lụa.' },
      { time: '09:00', activity: 'Ghé thăm xưởng dệt lụa lâu đời, nghe nghệ nhân kể chuyện cung tiến lụa triều Nguyễn.' },
      { time: '10:15', activity: 'Workshop thử làm thợ dệt: gõ nhịp thoi đưa, luồn sợi tơ tằm.' },
      { time: '11:30', activity: 'Thưởng thức trà mộc và mua sắm lụa chính gốc.' }
    ],
    included: ['Vé tàu điện khứ hồi', 'Khăn lụa kỷ niệm', 'Nước uống', 'Phí workshop dệt lụa'],
    excluded: ['Chi phí ăn trưa'],
    locationMeeting: 'Sảnh chính Nhà ga Tàu điện Cát Linh',
    isPopular: true
  },
  {
    id: 'tour-ch-01',
    name: 'Săn Bình Minh Chợ Phiên Nón Chuông & Đan Nón Lá Bài Thơ',
    villageId: 'chuong',
    villageName: 'Làng nón Chuông',
    category: 'Tour nửa ngày',
    price: 390000,
    duration: '4.5 giờ (05:30 - 10:00 sáng các ngày phiên)',
    groupSize: 'Nhóm 4 - 12 người',
    rating: 4.92,
    reviewsCount: 145,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Hòa mình vào phiên chợ nón họp lúc rạng đông sương khói ven sông Đáy, nếm bánh cuốn nóng làng quê và tự tay khâu chiếc nón bài thơ lồng thơ riêng.',
    highlights: [
      'Trải nghiệm không khí chợ phiên nón lá độc nhất vô nhị chỉ họp vài giờ lúc hừng đông',
      'Thưởng thức bữa sáng bánh đúc nóng hoặc bún mọc ven chợ làng Chuông',
      'Được nghệ nhân dạy cách uốn 16 vành tre và khâu từng mũi cước',
      'Mang về 01 chiếc nón lá bài thơ do chính bạn hoàn thiện'
    ],
    schedule: [
      { time: '05:30', activity: 'Có mặt tại sân đình Phương Trung, hòa vào biển nón trắng bồng bềnh trong sương mai.' },
      { time: '06:45', activity: 'Thưởng thức bữa sáng dân dã của bà con kẻ Chợ Chuông.' },
      { time: '07:30', activity: 'Vào xưởng nón nghệ nhân Tạ Thu Hương: ủi lá lụi, chọn câu thơ chèn vào lòng nón.' },
      { time: '09:30', activity: 'Hoàn thiện nón bài thơ, lồng quai lụa và chụp ảnh lưu niệm bên rặng tre ven đê sông Đáy.' }
    ],
    included: ['Bữa sáng truyền thống', '01 chiếc nón thành phẩm mang về', 'Toàn bộ vật liệu khâu nón', 'Hướng dẫn viên địa phương'],
    excluded: ['Xe đưa đón từ trung tâm Hà Nội (có hỗ trợ xe ghép tour 120k/người)'],
    locationMeeting: 'Cổng đình Làng Chuông, Thanh Oai, Hà Nội'
  },
  {
    id: 'tour-pv-01',
    name: 'Khám Phá Làng Nghệ Thuật Mây Tre Phú Vinh & Tự Đan Giỏ Decor',
    villageId: 'phu-vinh',
    villageName: 'Làng mây tre đan Phú Vinh',
    category: 'Workshop trải nghiệm',
    price: 320000,
    duration: '3 giờ',
    groupSize: 'Nhóm 4 - 15 người',
    rating: 4.86,
    reviewsCount: 95,
    image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Thả mình vào không gian sáng tạo mây tre xanh thân thiện môi trường, học cách chuốt nan mây dẻo dai và đan chiếc khay trà hoặc giỏ xách vintage mang về.',
    highlights: [
      'Chiêm ngưỡng bảo tàng thu nhỏ các tác phẩm tranh mây tinh xảo kỷ lục',
      'Thử sức chuốt nan tre bằng dao truyền thống',
      'Đan thành công 01 chiếc giỏ xách mây tre vintage xinh xắn'
    ],
    schedule: [
      { time: '09:00', activity: 'Gặp gỡ nghệ nhân làng Phú Vinh, tìm hiểu các loài tre nứa và mây dại vùng Tây Bắc.' },
      { time: '09:40', activity: 'Thực hành các mũi đan lóng mốt, lóng đôi và đan hoa thị tạo dáng giỏ hoa.' },
      { time: '11:30', activity: 'Xịt lớp sáp ong bảo vệ bề mặt và hoàn thiện sản phẩm.' }
    ],
    included: ['Nan mây tre đã qua xử lý', 'Giỏ mây thành phẩm', 'Trà thảo mộc'],
    excluded: ['Chi phí di chuyển'],
    locationMeeting: 'Nhà trưng bày Mây Tre Đan Phú Vinh, Chương Mỹ, Hà Nội'
  },
  {
    id: 'tour-dt-01',
    name: 'Xem Rối Nước Thủy Đình & Học Nghề Điêu Khắc Rối Đào Thục',
    villageId: 'dao-thuc',
    villageName: 'Làng múa rối nước Đào Thục',
    category: 'Tour nửa ngày',
    price: 290000,
    duration: '3.5 giờ',
    groupSize: 'Nhóm từ 10 người',
    rating: 4.97,
    reviewsCount: 210,
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    shortDescription: 'Thưởng thức trọn vẹn vở diễn múa rối nước mộc mạc bên hồ sen, sau đó bước vào sau mành buồm thử lội nước cầm sào điều khiển chú Tễu cùng nghệ nhân nông dân.',
    highlights: [
      'Suất diễn rối nước độc quyền 45 phút tại Thủy đình làng Đào Thục',
      'Trải nghiệm độc lạ: Lội xuống buồng trò sau cánh gà để điều khiển con rối bằng sào và dây',
      'Thử tự tay vẽ mặt và tô màu quân rối gỗ sung mang về',
      'Ăn nhẹ bánh đa cá rô đồng hoặc chè kho truyền thống Đông Anh'
    ],
    schedule: [
      { time: '09:00', activity: 'Ổn định chỗ ngồi bên hồ, thưởng thức tiếng trống rộn rã và xem 12 tích trò rối nước đặc sắc.' },
      { time: '10:00', activity: 'Giao lưu cùng các nghệ nhân, mặc áo mưa lội thử vào buồng trò thủy đình bí ẩn.' },
      { time: '10:45', activity: 'Workshop tô màu và vẽ hoa văn quân rối mini bằng gỗ sung.' }
    ],
    included: ['Vé xem biểu diễn', 'Quân rối mini tự tô màu', 'Đồ ăn nhẹ địa phương'],
    excluded: ['Xe đưa đón'],
    locationMeeting: 'Thủy đình Làng Rối Đào Thục, Thụy Lâm, Đông Anh, Hà Nội',
    isPopular: true
  }
];

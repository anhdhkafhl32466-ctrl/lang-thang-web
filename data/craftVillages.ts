export type CraftCategory =
  | 'Gốm sứ'
  | 'Lụa & Dệt'
  | 'Mây tre đan'
  | 'Nón lá'
  | 'Dát vàng & Kim hoàn'
  | 'Nghệ thuật dân gian'
  | 'Hoa & Nông nghiệp'
  | 'Đồ chơi dân gian'
  | 'Hương & Thảo mộc'
  | 'Sơn mài & Khảm trai'
  | 'Điêu khắc & Gỗ mỹ nghệ'
  | 'Ẩm thực truyền thống';

export interface CraftVillage {
  id: string;
  slug: string;
  name: string;
  category: CraftCategory;
  categorySlug: string;
  tagline: string;
  shortDescription: string;
  location: {
    address: string;
    district: string;
    city: string;
    coordinates: [number, number]; // [lat, lng]
    distanceFromCenter: string;
    travelTime: string;
  };
  heroImage: string;
  gallery: {
    url: string;
    caption: string;
    credit?: string;
  }[];
  history: {
    originPeriod: string;
    founder?: string;
    milestones: {
      period: string;
      title: string;
      description: string;
    }[];
    culturalSignificance: string;
  };
  process: {
    step: number;
    title: string;
    summary: string;
    description: string;
    image: string;
    duration?: string;
  }[];
  artisans: {
    name: string;
    title: string;
    experience: string;
    quote: string;
    avatar: string;
  }[];
  featuredProductIds: string[];
  featuredTourIds: string[];
  virtualHotspots: {
    id: string;
    name: string;
    description: string;
    image: string;
  }[];
  gameUrl?: string;
  bestTimeToVisit: string;
  openingHours: string;
  ticketPrice: string;
  tags: string[];
  historicalQuote?: {
    source: string;
    quote: string;
  };
  specialHighlights?: {
    title: string;
    description: string;
    icon?: string;
    image?: string;
  }[];
  productCategoriesTable?: {
    category: string;
    features: string;
    image?: string;
  }[];
}

export const CRAFT_VILLAGES: CraftVillage[] = [
  {
    id: 'bat-trang',
    slug: 'bat-trang',
    name: 'Làng gốm Bát Tràng',
    category: 'Gốm sứ',
    categorySlug: 'gom-su',
    tagline: 'Ngàn năm giữ lửa – Nơi đất hóa thành nghệ thuật',
    shortDescription: 'Làng gốm cổ truyền bên bờ tả ngạn sông Hồng với hơn 700 năm lịch sử, nổi tiếng với nước men rạn, men lam và nghệ thuật vuốt tay điêu luyện.',
    location: {
      address: 'Xã Bát Tràng, Huyện Gia Lâm',
      district: 'Huyện Gia Lâm',
      city: 'Hà Nội',
      coordinates: [20.9785, 105.9126],
      distanceFromCenter: 'Khoảng 14 km về phía Đông Nam',
      travelTime: '30 - 45 phút bằng xe máy / xe buýt số 47A'
    },
    heroImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
        caption: 'Đôi bàn tay nghệ nhân Bát Tràng chuốt gốm mộc trên bàn xoay truyền thống'
      },
      {
        url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bảo tàng Gốm Bát Tràng (Trung tâm Tinh hoa Làng nghề Việt) với kiến trúc 7 cánh xoáy ốc khổng lồ'
      },
      {
        url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
        caption: 'Những chiếc bình gốm men lam và men rạn cổ truyền thời Lê tinh xảo'
      },
      {
        url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sân phơi hàng ngàn sản phẩm gốm mộc dưới nắng sớm ven triền đê sông Hồng'
      },
      {
        url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Cổng Chợ Gốm Làng Cổ Bát Tràng - Không gian giao thương thủ công nhộn nhịp bốn mùa'
      },
      {
        url: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1200&q=80',
        caption: 'Xưởng trải nghiệm nặn gốm - Du khách và bạn trẻ hào hứng tự tay tạo hình sản phẩm'
      },
      {
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lò Bầu Cổ Bát Tràng - Công trình lò nung thủ công cổ kính hơn 100 năm tuổi'
      },
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bình hút tài lộc phong thủy đắp nổi mạ vàng kim 24K - Đỉnh cao nghệ thuật Bát Tràng'
      },
      {
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bộ ấm chén tử sa Bát Tràng dáng cổ thạch - Lưu giữ hương vị trà ngàn năm'
      },
      {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
        caption: 'Nghệ nhân chạm khắc và tỉa gọt hoa văn rồng mây tinh xảo trên cốt gốm mộc'
      },
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Gốm sứ xây dựng & cảnh quan sân vườn - Thác nước phong thủy và chậu gốm đất đỏ'
      },
      {
        url: 'https://images.unsplash.com/photo-1576020799627-aeac76d580dc?auto=format&fit=crop&w=1200&q=80',
        caption: 'Bộ đồ thờ men lam vẽ rồng phượng cổ truyền - Không gian thờ cúng trang nghiêm'
      }
    ],
    history: {
      originPeriod: 'Khoảng thế kỷ XIV – XV',
      founder: 'Các dòng họ làm gốm nổi tiếng từ làng Bồ Bát (Yên Mô, Ninh Bình) di cư sang từ thời vua Lý Thái Tổ dời đô ra Thăng Long',
      milestones: [
        {
          period: 'Thế kỷ 10 - 11',
          title: 'Khởi nguồn từ làng Bồ Bát (Ninh Bình) dời cư ra Thăng Long',
          description: 'Từ thời vua Lý Thái Tổ dời đô ra Thăng Long, các dòng họ làm gốm nổi tiếng của làng Bồ Bát (Yên Mô, Ninh Bình) đã tìm đến vùng đất Bát Tràng (thuộc Gia Lâm, Hà Nội ngày nay) để lập nghiệp. Nơi đây có nguồn đất sét trắng dồi dào và nằm bên bờ sông Hồng thuận lợi giao thương, tạo điều kiện hoàn hảo để phát triển nghề gốm.'
        },
        {
          period: 'Thế kỷ 14 - 15',
          title: 'Ghi danh lịch sử trong "Dư địa chí" của Nguyễn Trãi',
          description: 'Theo "Dư địa chí" của Nguyễn Trãi, ông đã từng ghi chép lại rằng: “Làng Bát Tràng làm đồ chén bát”. Sự ra đời và hưng thịnh của làng gốm được xác định vững chắc vào khoảng thế kỷ XIV – XV, trở thành trung tâm đồ gốm sứ tinh xảo bậc nhất nước Đại Việt.'
        },
        {
          period: 'Thế kỷ 16 - 17',
          title: 'Thời kỳ hoàng kim & Vươn tầm quốc tế',
          description: 'Gốm Bát Tràng vươn ra biển lớn qua thương cảng Phố Hiến và Hội An, được ưa chuộng tại Nhật Bản, Hà Lan và các nước Đông Nam Á với các dòng men lam, men rạn danh tiếng.'
        },
        {
          period: 'Thế kỷ 20 - Nay',
          title: 'Bảo tồn di sản & Tinh hoa nghệ thuật đương đại',
          description: 'Phát triển Trung tâm Tinh hoa Làng nghề Việt (Bảo tàng Gốm Bát Tràng 7 cánh xoáy ốc), kết hợp nghệ thuật thủ công truyền thống với du lịch trải nghiệm, workshop nặn gốm và vươn tầm toàn cầu.'
        }
      ],
      culturalSignificance: 'Gốm Bát Tràng không đơn thuần chỉ là những vật dụng vô tri mà còn là những di sản văn hóa, lưu giữ hồn cốt dân tộc Việt. Mỗi sản phẩm ra lò đều chứa đựng tâm huyết, sự kỳ công và đôi bàn tay tài hoa của người nghệ nhân, góp phần lan tỏa nét đẹp của thủ công mỹ nghệ Việt Nam ra thế giới.'
    },
    historicalQuote: {
      source: 'Dư địa chí — Nguyễn Trãi (1435)',
      quote: '“Làng Bát Tràng làm đồ chén bát”'
    },
    specialHighlights: [
      {
        title: 'Kỹ thuật chế tác tinh xảo & Độ bền chắc bậc nhất',
        description: 'Từ thời xa xưa, người thợ Bát Tràng đã kết hợp xuất sắc các kỹ thuật chạm khắc, đắp nổi, vẽ tay và vẽ men lam. Sản phẩm gốm Bát Tràng có độ dày dặn bậc nhất, đảm bảo độ bền chắc, hạn chế nứt vỡ trong quá trình sử dụng.',
        icon: 'sparkles',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Đa dạng dòng men cổ truyền thống quý hiếm',
        description: 'Làng nghề gìn giữ được nhiều loại men cổ có giá trị nghệ thuật cao: Men tro (dòng men cổ nhất từ tro trấu tự nhiên), Men lam, Men rạn, Men ngọc (celadon), và Men trắng ngà.',
        icon: 'palette',
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Hoa văn trang trí phong phú & Ý nghĩa phong thủy sâu sắc',
        description: 'Các hoa văn thường thấy trên gốm Bát Tràng gồm có rồng, phượng, tùng, trúc, cúc, mai, hoa sen, các điển tích cổ và họa tiết phong thủy (Thuận buồm xuôi gió, Bát mã truy phong...). Những họa tiết này mang đậm bản sắc văn hóa dân tộc và ý nghĩa về tài lộc, bình an.',
        icon: 'shield',
        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
      }
    ],
    productCategoriesTable: [
      {
        category: 'Gốm sứ gia dụng',
        features: 'Bao gồm ấm chén (tử sa, hỏa biến, men rạn, sứ trắng), bát đĩa, ly cốc các loại, chum đựng rượu. Sản phẩm an toàn, chất lượng cao, bền bỉ và đẹp mắt.',
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=600&q=80'
      },
      {
        category: 'Gốm sứ trang trí',
        features: 'Gồm đĩa cảnh trưng bày, lọ hoa, lộc bình, bình hút lộc, mai bình, tượng gốm (tượng Phật, tượng thú, danh nhân). Thường được chế tác đắp nổi, dát vàng tinh xảo, dùng làm vật phẩm phong thủy.',
        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80'
      },
      {
        category: 'Gốm sứ thờ cúng',
        features: 'Bao gồm bát hương, chân nến, mâm bồng, lộc bình lớn. Ứng dụng nhiều dòng men truyền thống như men rạn, men lam để tạo vẻ đẹp trang nghiêm, cổ kính cho không gian phòng thờ.',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'
      },
      {
        category: 'Gốm sứ xây dựng & cảnh quan',
        features: 'Gồm chậu hoa gốm sứ kích thước lớn, thác nước phong thủy, các vật liệu gốm đất đỏ và sứ xương dùng trong trang trí kiến trúc và sân vườn.',
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80'
      }
    ],
    process: [
      {
        step: 1,
        title: 'Chọn và lắng lọc đất sét',
        summary: 'Đất sét trắng và sét nâu dẻo mịn được lấy từ vùng phù sa giàu khoáng chất.',
        description: 'Đất thô được ngâm ủ trong bể lọc nhiều tháng để loại bỏ tạp chất oxit sắt, chỉ giữ lại phần bùn mịn thuần khiết nhất.',
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
        duration: '2 - 3 tuần lắng lọc'
      },
      {
        step: 2,
        title: 'Chuốt gốm trên bàn xoay',
        summary: 'Dùng đôi tay khéo léo kết hợp lực xoay nhịp nhàng để tạo dáng cốt gốm.',
        description: 'Khối đất dẻo được đặt lên tâm bàn xoay. Nghệ nhân dùng lòng bàn tay và ngón trỏ đẩy vuốt để tạo cổ thon, bầu phình hoặc miệng loe cân đối.',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
        duration: '15 - 45 phút mỗi sản phẩm'
      },
      {
        step: 3,
        title: 'Phơi gốm mộc và sửa tỉa',
        summary: 'Sấy khô tự nhiên trong bóng râm và gọt tỉa các chi tiết viền.',
        description: 'Sản phẩm mộc được hong gió dịu nhẹ tránh nứt nẻ, sau đó dùng dao tiện gỗ gọt nhẵn bề mặt và tạo chân đế vững chãi.',
        image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Vẽ hoa văn & Trang trí men',
        summary: 'Vẽ bút lông men lam, men ngọc hoặc khắc chìm hoa văn rồng mây cổ.',
        description: 'Họa sĩ dân gian dùng cọ mềm vẽ thủ công từng nét sóng nước, hoa sen, chim hạc lên cốt gốm mộc với độ chuẩn xác tuyệt đối.',
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 5,
        title: 'Tráng men bí truyền',
        summary: 'Phủ lớp men tro trấu, men rạn hoặc men ngọc celadon độc bản.',
        description: 'Nước men được chế biến từ tro trấu sạch, bột đá thạch anh và cao lanh tự nhiên. Người thợ nhúng, dội hoặc phun men thật đều.',
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 6,
        title: 'Nung gốm ở nhiệt độ cao',
        summary: 'Đưa vào lò nung đạt mức nhiệt từ 1.200°C đến 1.300°C.',
        description: 'Quá trình nung liên tục hơn 24 giờ đòi hỏi theo dõi sát màu lửa qua mắt lò. Gốm chín hoàn toàn, cốt đanh như chuông, men bóng vĩnh cửu.',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
        duration: '24 - 36 giờ nung & 2 ngày làm nguội'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Nhân dân Trần Độ',
        title: 'Bậc thầy phục dựng men cổ Bát Tràng',
        experience: 'Hơn 50 năm gắn bó với lò nung',
        quote: 'Đất là xương thịt, lửa là linh hồn, còn men là tấm áo văn hóa của dân tộc.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Nghệ nhân Ưu tú Vương Mạnh Tuấn',
        title: 'Chuyên gia gốm tử sa và gốm vuốt tay',
        experience: '40 năm giữ lửa nghề',
        quote: 'Mỗi ấm trà gốm mộc là một câu chuyện đối thoại giữa con người và đất mẹ phù sa.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-bt-01', 'prod-bt-02', 'prod-bt-03'],
    featuredTourIds: ['tour-bt-01', 'tour-bt-02'],
    virtualHotspots: [
      {
        id: 'hs-bt-01',
        name: 'Bảo tàng Gốm Bát Tràng (Trung tâm Tinh hoa)',
        description: 'Công trình kiến trúc 7 cánh xoáy ốc mô phỏng bàn xoay vuốt gốm, trưng bày hiện vật gốm các triều đại.',
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'hs-bt-02',
        name: 'Lò Bầu Cổ Bát Tràng',
        description: 'Lò nung thủ công cổ xưa duy nhất còn nguyên vẹn với 5 bầu nung liên hoàn có niên đại gần 100 năm.',
        image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'hs-bt-03',
        name: 'Chợ gốm Bát Tràng',
        description: 'Khu chợ sầm uất với hàng ngàn gian hàng trưng bày chén, ấm, bình hoa, tượng phong thủy.',
        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    gameUrl: '/trai-nghiem/gom',
    bestTimeToVisit: 'Quanh năm, đẹp nhất từ tháng 9 đến tháng 3 mùa thu đông trời mát mẻ',
    openingHours: '08:00 - 18:00 hàng ngày',
    ticketPrice: 'Vào làng miễn phí. Vé Bảo tàng Gốm: 50.000đ - Trải nghiệm vuốt gốm: 40.000đ - 70.000đ/người',
    tags: ['Gốm sứ', 'Vuốt gốm', 'Check-in bảo tàng', 'Chợ cổ', 'Gia đình', 'Workshop']
  },
  {
    id: 'van-phuc',
    slug: 'van-phuc',
    name: 'Làng lụa Vạn Phúc',
    category: 'Lụa & Dệt',
    categorySlug: 'lua-det',
    tagline: 'Vẻ đẹp nghìn năm dệt từ sợi tơ vàng xứ Đoài',
    shortDescription: 'Làng nghề dệt lụa tơ tằm cổ xưa nhất Việt Nam, nơi sản sinh lụa Vân cung đình quý phái nhẹ như cánh ve, mát rượi ngày hè và ấm áp ngày đông.',
    location: {
      address: 'Phường Vạn Phúc, Quận Hà Đông',
      district: 'Quận Hà Đông',
      city: 'Hà Nội',
      coordinates: [20.9768, 105.7725],
      distanceFromCenter: 'Khoảng 10 km về phía Tây Nam',
      travelTime: '25 - 35 phút bằng tàu điện Cát Linh - Hà Đông (ga Vạn Phúc)'
    },
    heroImage: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
        caption: 'Những thoi tơ óng ả phơi rợp lối vào làng cổ Vạn Phúc'
      },
      {
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
        caption: 'Khung dệt gõ nhịp rộn rã trong các xưởng lụa gia truyền'
      },
      {
        url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80',
        caption: 'Con đường ô dù rực rỡ sắc màu thu hút khách du lịch'
      }
    ],
    history: {
      originPeriod: 'Hơn 1.000 năm trước (Thời Tiền Lê)',
      founder: 'Bà A Lã Thị Nương (người phụ nữ có công truyền dạy nghề ươm tơ dệt lụa)',
      milestones: [
        {
          period: 'Thế kỷ 9 - 10',
          title: 'Khởi xướng nghề ươm tơ dệt lụa',
          description: 'Bà A Lã Thị Nương truyền nghề dệt tơ lụa cho dân làng Vạn Phúc bên dòng sông Nhuệ trù phú.'
        },
        {
          period: 'Thời Nhà Nguyễn',
          title: 'Ngự phẩm phục vụ hoàng gia',
          description: 'Lụa Vạn Phúc được triều đình Huế chọn may trang phục long bào, phượng bào cho vua chúa và hoàng tộc.'
        },
        {
          period: 'Năm 1931 - 1932',
          title: 'Vang danh thế giới tại hội chợ Marseille',
          description: 'Lụa Hà Đông lần đầu tiên xuất ngoại tham dự Đấu xảo Quốc tế tại Marseille và Paris (Pháp), được người Pháp tôn vinh là sản phẩm tinh xảo nhất Đông Dương.'
        }
      ],
      culturalSignificance: 'Lụa Vân Vạn Phúc với đặc tính hoa nổi hoa chìm là đỉnh cao kỹ thuật dệt tơ tằm truyền thống của người Việt.'
    },
    process: [
      {
        step: 1,
        title: 'Ươm tơ và guồng tơ',
        summary: 'Kén tằm vàng óng được nấu nước sôi để kéo rút những sợi tơ mảnh dai.',
        description: 'Người thợ chọn kén tằm đạt độ già chuẩn, cho vào nồi ươm tơ, dùng đũa khuấy tìm mối tơ rồi quấn lên guồng tơ đều đặn.',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Mắc cửi và dệt lụa',
        summary: 'Lên khung cửi thủ công, gõ nhịp mắc các đường tơ ngang dọc.',
        description: 'Khâu mắc cửi đòi hỏi hàng ngàn sợi tơ dọc phải song song tăm tắp. Thoi đưa thoăn thoắt dệt nên các họa tiết vân mây, hoa cúc cổ truyền.',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Nhuộm màu thảo mộc thiên nhiên',
        summary: 'Dùng lá bàng, củ nâu, vỏ cây rừng tạo gam màu đằm thắm bền bỉ.',
        description: 'Lụa mộc được nhúng vào nồi nước nhuộm từ thảo mộc thiên nhiên, nhồi kỹ rồi xả nhiều lần bằng nước sạch để giữ độ óng tự nhiên.',
        image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Phơi lụa & hoàn thiện',
        summary: 'Hong nắng sớm ven sông Nhuệ cho sợi tơ se lại mượt mà.',
        description: 'Dải lụa dài hàng chục mét được phơi trên giàn tre cao dưới nắng sớm, sợi tơ se khô tự nhiên mềm mại như làn mây.',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Triệu Văn Mão',
        title: 'Huyền thoại lụa Vân Vạn Phúc',
        experience: 'Cả một đời phục dựng lụa Vân hoàng triều',
        quote: 'Lụa Vạn Phúc mặc vào mát da mát thịt, bởi nó ấp ủ cả giọt mồ hôi và tấm lòng người thợ dệt.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-vp-01', 'prod-vp-02'],
    featuredTourIds: ['tour-vp-01'],
    virtualHotspots: [
      {
        id: 'hs-vp-01',
        name: 'Con đường Ô Rực Rỡ & Cổng Làng Cổ',
        description: 'Tuyến phố đi bộ rợp bóng hàng trăm chiếc ô lụa sắc màu rực rỡ, điểm check-in biểu tượng của Vạn Phúc.',
        image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'hs-vp-02',
        name: 'Miếu Bà Chúa Lụa A Lã Thị Nương',
        description: 'Di tích thờ Thành hoàng Làng lụa, nơi lưu giữ sắc phong triều Nguyễn và huyền thoại dệt tơ nghìn năm.',
        image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    gameUrl: '/trai-nghiem',
    bestTimeToVisit: 'Tháng 10 đến tháng 4, đặc biệt là tuần lễ Văn hóa Lụa Hà Đông vào tháng 11',
    openingHours: '07:30 - 21:00 hàng ngày',
    ticketPrice: 'Tham quan tự do. Workshop dệt lụa: 100.000đ - 250.000đ/buổi',
    tags: ['Lụa tơ tằm', 'Thời trang', 'Tàu điện Cát Linh', 'Áo dài', 'Check-in phố ô']
  },
  {
    id: 'phu-vinh',
    slug: 'phu-vinh',
    name: 'Làng mây tre đan Phú Vinh',
    category: 'Mây tre đan',
    categorySlug: 'may-tre-dan',
    tagline: 'Sợi mây hóa ngọc – Đỉnh cao nghệ thuật đan lát',
    shortDescription: 'Nơi những nan tre, sợi mây thanh mảnh được đan cài tinh xảo như thêu tranh, tạo nên các sản phẩm đồ gia dụng và mỹ nghệ xuất khẩu sang hơn 50 quốc gia.',
    location: {
      address: 'Xã Phú Nghĩa, Huyện Chương Mỹ',
      district: 'Huyện Chương Mỹ',
      city: 'Hà Nội',
      coordinates: [20.8931, 105.6798],
      distanceFromCenter: 'Khoảng 27 km về phía Tây Nam theo Quốc lộ 6',
      travelTime: '50 - 60 phút bằng ô tô hoặc xe buýt 57, 72'
    },
    heroImage: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1000&q=80',
        caption: 'Từng nan tre mảnh dẻ được đan cài tỉ mỉ thành đèn trang trí cao cấp'
      },
      {
        url: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bức tranh phong cảnh đan bằng mây sợi độc bản'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ XVII (Hơn 400 năm lịch sử)',
      founder: 'Tổ nghề truyền tụng lại qua nhiều thế hệ dòng họ Nguyễn, Trần làng Phú Hoa',
      milestones: [
        {
          period: 'Thế kỷ 17',
          title: 'Khởi xướng đan rổ rá mành cói',
          description: 'Thuở sơ khai, dân làng khai thác mây tre đan nông cụ phục vụ sản xuất mùa màng xứ Đoài.'
        },
        {
          period: 'Thế kỷ 19 - 20',
          title: 'Nâng tầm thành tranh mỹ nghệ',
          description: 'Nghệ nhân Phú Vinh sáng tạo kỹ thuật chuốt nan siêu mỏng như sợi tóc để đan chân dung Chủ tịch Hồ Chí Minh và tranh danh thắng.'
        },
        {
          period: 'Hiện đại',
          title: 'Chinh phục thị trường xanh quốc tế',
          description: 'Sản phẩm mây tre đan Phú Vinh đạt chứng nhận OCOP 5 sao, có mặt trong các khách sạn 5 sao tại Paris, New York và Tokyo.'
        }
      ],
      culturalSignificance: 'Phú Vinh minh chứng cho triết lý sống hòa hợp thiên nhiên của người Việt, biến vật liệu tre trúc mộc mạc thành tác phẩm nghệ thuật sang trọng.'
    },
    process: [
      {
        step: 1,
        title: 'Chọn tre nứa và mây rừng',
        summary: 'Chọn những cây tre gióng thẳng, không mọt, mây bánh tẻ dẻo dai.',
        description: 'Vật liệu mây được nhập từ rừng Tây Bắc, rửa sạch đất cát và phơi se để giữ độ đàn hồi tối đa.',
        image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Ra nan và chuốt sợi',
        summary: 'Chẻ nan bằng tay, chuốt mượt qua lưỡi dao sắc như sợi tơ.',
        description: 'Khâu quan trọng nhất đòi hỏi nghệ nhân có đôi tay khéo léo để chuốt sợi nan đều tăm tắp nghìn sợi như một.',
        image: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Tạo hình khung cốt và đan hoa',
        summary: 'Đan lóng mốt, lóng đôi, đan hoa thị, xương cá theo thiết kế.',
        description: 'Từng sợi mây được uốn lượn nhịp nhàng quanh khung cốt gỗ hoặc thép tạo dáng bình, giỏ, khay trà tinh mỹ.',
        image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Xông diêm sinh & Sơn phủ tự nhiên',
        summary: 'Hun khói chống mốc ẩm và quét sơn bóng an toàn sinh học.',
        description: 'Sản phẩm sau khi đan được sấy khô bằng lò rơm trấu hoặc xông diêm sinh vừa đủ để giữ màu vàng óng tự nhiên suốt hàng chục năm.',
        image: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Nhân dân Nguyễn Văn Trung',
        title: 'Bàn tay vàng mây tre đan Việt Nam',
        experience: '55 năm sáng tác tranh mây mỹ nghệ',
        quote: 'Sợi mây tuy dẻo dai nhưng có hồn. Phải yêu từng gióng tre cành mây thì tác phẩm mới cất lên tiếng nói.',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-pv-01', 'prod-pv-02'],
    featuredTourIds: ['tour-pv-01'],
    virtualHotspots: [
      {
        id: 'hs-pv-01',
        name: 'Không gian Trưng bày Nghệ thuật Mây Tre Phú Vinh',
        description: 'Nơi hội tụ hơn 500 mẫu thiết kế nội thất mây tre đoạt giải thưởng thiết kế quốc tế.',
        image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    gameUrl: '/trai-nghiem',
    bestTimeToVisit: 'Tháng 10 đến tháng 4 hàng năm',
    openingHours: '08:00 - 17:30',
    ticketPrice: 'Vào làng miễn phí. Workshop tự đan giỏ mây: 80.000đ/người',
    tags: ['Mây tre đan', 'Thủ công xanh', 'Decor nội thất', 'Nghệ thuật', 'Sản phẩm OCOP']
  },
  {
    id: 'chuong',
    slug: 'chuong',
    name: 'Làng nón Chuông',
    category: 'Nón lá',
    categorySlug: 'non-la',
    tagline: 'Vành nón bài thơ – Nét duyên thầm xứ Đoài bên dòng Đáy',
    shortDescription: 'Làng nón cổ kính hơn 300 năm bên bờ sông Đáy, nổi tiếng với nón lá bài thơ thanh tao và nón ba tầm quai thao đậm đà bản sắc Bắc Bộ.',
    location: {
      address: 'Xã Phương Trung, Huyện Thanh Oai',
      district: 'Huyện Thanh Oai',
      city: 'Hà Nội',
      coordinates: [20.8524, 105.7489],
      distanceFromCenter: 'Khoảng 30 km về phía Tây Nam',
      travelTime: '55 phút theo Quốc lộ 21B'
    },
    heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
        caption: 'Hàng ngàn chiếc nón trắng nõn phơi rợp sân đình làng Chuông'
      },
      {
        url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=1000&q=80',
        caption: 'Nụ cười cô thôn nữ bên chiếc nón bài thơ che nghiêng nắng hạ'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ VIII - X (Thời Đinh - Tiền Lê)',
      founder: 'Tổ nghề truyền đời tại vùng đất Phương Trung văn vật',
      milestones: [
        {
          period: 'Thời Phong kiến',
          title: 'Cung tiến nón Ba Tầm & Nón Chóp',
          description: 'Làng Chuông chuyên làm nón ba tầm, nón nhởn phục vụ giới quý tộc và các kỳ hội lễ Bắc Bộ.'
        },
        {
          period: 'Thế kỷ 20',
          title: 'Sáng tạo nón bài thơ',
          description: 'Nghệ nhân chèn các bài thơ lục bát ca ngợi vẻ đẹp phụ nữ Việt Nam và thắng cảnh Thăng Long ẩn hiện dưới lớp lá nón.'
        }
      ],
      culturalSignificance: 'Nón làng Chuông là biểu tượng duyên dáng của người phụ nữ Việt Nam qua bao thế kỷ ca dao và thi ca.'
    },
    process: [
      {
        step: 1,
        title: 'Chọn lá lụi và ủi phẳng',
        summary: 'Lá nón xanh non được lấy từ vùng đồi Quảng Bình, vò trong cát rồi ủi bằng lưỡi cày nóng.',
        description: 'Lá được sấy trên than củi, dùng giẻ mềm và lưỡi cày gang nóng vuốt thật phẳng mà không làm cháy hay rách sợi gân lá.',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Uốn 16 vành nón tre',
        summary: 'Tre rừng được chẻ vót tròn đều, uốn thành 16 vòng cung từ nhỏ đến lớn.',
        description: '16 vành nón tượng trưng cho sự trọn vẹn của tuổi thanh xuân được xếp ngay ngắn trên khuôn gỗ hình nón cân xứng.',
        image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Xếp lá và lồng bài thơ',
        summary: 'Xếp hai lớp lá trắng đều tăm tắp, xen giữa là hoa văn cắt giấy hoặc câu thơ xứ Đoài.',
        description: 'Khi soi chiếc nón lên ánh nắng mặt trời, người xem sẽ thấy hình ảnh Chùa Một Cột hoặc hai câu thơ lục bát ẩn hiện lung linh.',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Khâu nón từng mũi cước mảnh',
        summary: 'Dùng kim khâu mũi nhỏ li ti từ đỉnh nón xuống vành chân.',
        description: 'Người thợ khâu nón thoăn thoắt đưa đường kim mũi cước, mỗi centimet đều tăm tắp 3-4 mũi khâu chắc chắn không lộ vết chỉ.',
        image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Tạ Thu Hương',
        title: 'Người thổi hồn hiện đại vào nón Chuông',
        experience: '35 năm làm nón và sáng tạo nón lụa xuất khẩu',
        quote: 'Chiếc nón lá che chở mưa nắng đời người, mang theo nét dịu dàng của người mẹ, người chị xứ Bắc.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-ch-01', 'prod-ch-02'],
    featuredTourIds: ['tour-ch-01'],
    virtualHotspots: [
      {
        id: 'hs-ch-01',
        name: 'Chợ phiên Nón Làng Chuông (mùng 4, 10, 14, 20, 24, 30 âm lịch)',
        description: 'Phiên chợ độc đáo họp từ 5 giờ sáng với hàng vạn chiếc nón trắng lấp lánh trong sương sớm ven đê sông Đáy.',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    gameUrl: '/trai-nghiem/dan-non',
    bestTimeToVisit: 'Đi vào các ngày phiên chợ họp (ngày 4, 10, 14, 20, 24, 30 âm lịch hàng tháng)',
    openingHours: 'Chợ họp từ 05:30 - 08:30 sáng; xưởng nghề mở cả ngày',
    ticketPrice: 'Tham quan tự do. Giá nón lưu niệm: 40.000đ - 150.000đ/chiếc',
    tags: ['Nón lá', 'Chợ phiên cổ', 'Sông Đáy', 'Check-in bình minh', 'Văn hóa Bắc Bộ']
  },
  {
    id: 'kieu-ky',
    slug: 'kieu-ky',
    name: 'Làng dát vàng quỳ Kiêu Kỵ',
    category: 'Dát vàng & Kim hoàn',
    categorySlug: 'dat-vang',
    tagline: 'Vàng quỳ thếp ngọc – Tinh hoa son thếp đền chùa Thăng Long',
    shortDescription: 'Làng nghề dát vàng quỳ độc nhất vô nhị ở Việt Nam, nơi biến một chỉ vàng thật thành cả nghìn lá vàng quỳ siêu mỏng để thếp tượng Phật và hoành phi câu đối.',
    location: {
      address: 'Xã Kiêu Kỵ, Huyện Gia Lâm',
      district: 'Huyện Gia Lâm',
      city: 'Hà Nội',
      coordinates: [20.9856, 105.9452],
      distanceFromCenter: 'Khoảng 16 km về phía Đông',
      travelTime: '35 phút theo hướng cầu Vĩnh Tuy - Vinhomes Ocean Park'
    },
    heroImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80',
        caption: 'Lá vàng quỳ mỏng manh được nghệ nhân gắp bằng kẹp tre chuyên dụng'
      },
      {
        url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bức hoành phi cổ sơn son thếp vàng lung linh ánh kim'
      }
    ],
    history: {
      originPeriod: 'Hơn 300 năm (Thời Hậu Lê, thế kỷ XVIII)',
      founder: 'Tiến sĩ Nguyễn Quý Trị (người học nghề dát vàng từ phương Bắc về truyền dạy dân làng)',
      milestones: [
        {
          period: 'Năm 1765',
          title: 'Khởi xướng nghề quỳ vàng',
          description: 'Cụ Nguyễn Quý Trị được triều đình cử đi sứ, học được bí thuật đập vàng lá rồi truyền lại cho người dân Kiêu Kỵ làm kế sinh nhai.'
        },
        {
          period: 'Thế kỷ 19 - Nay',
          title: 'Thếp vàng di tích ngàn năm',
          description: 'Nghệ nhân Kiêu Kỵ có mặt khắp các đại trùng tu: Lăng Bác, Hoàng thành Thăng Long, Chùa Bái Đính, Di tích Cố đô Huế.'
        }
      ],
      culturalSignificance: 'Di sản văn hóa phi vật thể Quốc gia, biểu tượng của sự kiên nhẫn tột cùng và lòng thành kính trong mỹ thuật tâm linh.'
    },
    process: [
      {
        step: 1,
        title: 'Cán vàng và cắt vập',
        summary: 'Vàng ta 99.9% được nung chảy và cán mỏng thành dải dài.',
        description: 'Dải vàng được cắt thành từng mẩu nhỏ cỡ móng tay (gọi là vập vàng) để chuẩn bị vào quỳ.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Vào quỳ và đập vàng',
        summary: 'Xếp từng mảnh vàng giữa các lớp giấy quỳ bôi mực tự chế, đập hàng ngàn nhát búa.',
        description: 'Người thợ dùng búa thép nặng 5kg đập liên tục và nhịp nhàng hơn 1 giờ đồng hồ để lá vàng dàn mỏng ra gấp hàng trăm lần diện tích ban đầu.',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Gắp vàng và hoàn thiện lá quỳ',
        summary: 'Dùng kẹp tre mỏng gắp lá vàng bay bổng như làn khói vào hộp cất giữ.',
        description: 'Lá vàng quỳ mỏng đến mức thở nhẹ cũng có thể bay mất, đòi hỏi phòng kín gió và đôi tay tĩnh tâm tuyệt đối.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Lê Bá Chung',
        title: 'Truyền nhân đời thứ 5 dát vàng quỳ Kiêu Kỵ',
        experience: '45 năm cầm búa quỳ',
        quote: 'Một lượng vàng đập ra cả mẫu giấy quỳ, mỗi nhát búa là sự gom tụ khí lực và chữ tâm của người thợ.',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-kk-01'],
    featuredTourIds: ['tour-kk-01'],
    virtualHotspots: [
      {
        id: 'hs-kk-01',
        name: 'Đền thờ Tổ nghề Tiến sĩ Nguyễn Quý Trị',
        description: 'Di tích lịch sử văn hóa cấp Quốc gia, nơi tổ chức lễ hội giỗ tổ nghề quỳ vàng vào ngày 17 tháng 8 âm lịch.',
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Quanh năm, đặc biệt dịp lễ giỗ Tổ nghề tháng 8 âm lịch',
    openingHours: '08:30 - 17:00',
    ticketPrice: 'Tham quan xưởng miễn phí. Trải nghiệm dát vàng tranh lưu niệm: 120.000đ/người',
    tags: ['Dát vàng', 'Di sản Quốc gia', 'Sơn son thếp vàng', 'Tâm linh Thăng Long']
  },
  {
    id: 'dao-thuc',
    slug: 'dao-thuc',
    name: 'Làng múa rối nước Đào Thục',
    category: 'Nghệ thuật dân gian',
    categorySlug: 'nghe-thuat-dan-gian',
    tagline: 'Mặt nước làm sân khấu – Khúc đồng dao sống dậy nghìn năm',
    shortDescription: 'Làng múa rối nước dân gian độc đáo bên bờ sông Cà Lồ, nơi các nghệ nhân nông dân tự tay đục đẽo quân rối gỗ sung và biểu diễn những tích trò truyền thống say đắm lòng người.',
    location: {
      address: 'Xã Thụy Lâm, Huyện Đông Anh',
      district: 'Huyện Đông Anh',
      city: 'Hà Nội',
      coordinates: [21.1895, 105.9084],
      distanceFromCenter: 'Khoảng 28 km về phía Bắc',
      travelTime: '50 phút qua cầu Nhật Tân hoặc cầu Đông Trù'
    },
    heroImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80',
        caption: 'Tiết mục chú Tễu và rồng phun nước rộn rã tại thủy đình làng Đào Thục'
      },
      {
        url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80',
        caption: 'Những quân rối gỗ sung được gọt giũa và tô màu thủ công tinh xảo'
      }
    ],
    history: {
      originPeriod: 'Hơn 300 năm (Thời Hậu Lê, năm 1735)',
      founder: 'Nội giám Đào Đăng Khiêm (người truyền dạy ngón nghề múa rối cho quê hương)',
      milestones: [
        {
          period: 'Năm 1735',
          title: 'Thành lập Phường rối Đào Thục',
          description: 'Quan Nội giám Đào Đăng Khiêm về quê lập thủy đình và truyền dạy kỹ thuật điều khiển con rối bằng sào và dây bí truyền.'
        },
        {
          period: 'Hiện đại',
          title: 'Sáng tạo tích trò mới',
          description: 'Bên cạnh 16 tích trò cổ như Đốt pháo mở cờ, Bơi chải, Lê Lợi trả gươm, làng còn sáng tác các trò hiện đại như Chiến thắng Điện Biên Phủ trên không.'
        }
      ],
      culturalSignificance: 'Nghệ thuật trình diễn múa rối nước Đào Thục gắn liền với nền văn minh lúa nước sông Hồng và tâm hồn lạc quan của người nông dân Việt.'
    },
    process: [
      {
        step: 1,
        title: 'Đẽo gọt quân rối từ gỗ sung',
        summary: 'Gỗ sung nhẹ, xốp, chịu ngâm nước lâu mà không bị nứt vỡ.',
        description: 'Nghệ nhân dùng đục tay tạo hình các nhân vật: chú Tễu hóm hỉnh, cô Tiên bay bổng, tướng quân cưỡi ngựa oai phong.',
        image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Quét sơn ta và vẽ mặt',
        summary: 'Dùng nhựa sơn ta chống thấm nước, pha màu tự nhiên rực rỡ.',
        description: 'Quân rối được quét nhiều lớp sơn ta bóng bẩy, vẽ biểu cảm nét mặt sinh động, hài hước đậm chất trào lộng dân gian.',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Lắp máy điều khiển sào và dây',
        summary: 'Hệ thống cần sào, dây kéo ngầm dưới nước tạo chuyển động mềm mại.',
        description: 'Máy sào bí truyền giúp con rối có thể lặn ngụp, nhào lộn, phun lửa và trao hoa cho khán giả một cách thần kỳ.',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Dân gian Nguyễn Thế Nghị',
        title: 'Trưởng phường rối nước Đào Thục',
        experience: '40 năm lội nước sau mành buồm thủy đình',
        quote: 'Mỗi lần tiếng trống quân vang lên trên mặt hồ là tim chúng tôi lại đập cùng nhịp thở ngàn năm của cha ông.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-dt-01'],
    featuredTourIds: ['tour-dt-01'],
    virtualHotspots: [
      {
        id: 'hs-dt-01',
        name: 'Thủy đình Làng Đào Thục',
        description: 'Sân khấu mái cong cổ kính giữa hồ nước làng, nơi diễn ra các suất diễn múa rối nước mộc mạc và chân thực.',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Cuối tuần hoặc các dịp hội làng tháng Hai âm lịch',
    openingHours: 'Biểu diễn theo suất đặt trước (sáng 09:30, chiều 14:30)',
    ticketPrice: 'Xem biểu diễn trọn gói: 60.000đ - 100.000đ/người (tùy theo đoàn)',
    tags: ['Rối nước', 'Di sản phi vật thể', 'Thủy đình', 'Gia đình có trẻ nhỏ', 'Đông Anh']
  },
  {
    id: 'tay-tuu',
    slug: 'tay-tuu',
    name: 'Làng hoa Tây Tựu',
    category: 'Hoa & Nông nghiệp',
    categorySlug: 'hoa-nong-nghiep',
    tagline: 'Thung lũng ngàn hoa – Bừng nở sắc xuân giữa lòng Thủ đô',
    shortDescription: 'Vựa hoa lớn và lâu đời bậc nhất Thủ đô, nơi cung cấp sắc hoa rực rỡ quanh năm cho toàn bộ Hà Nội và các tỉnh thành phía Bắc.',
    location: {
      address: 'Phường Tây Tựu, Quận Bắc Từ Liêm',
      district: 'Quận Bắc Từ Liêm',
      city: 'Hà Nội',
      coordinates: [21.0583, 105.7289],
      distanceFromCenter: 'Khoảng 15 km về phía Tây Bắc',
      travelTime: '30 phút theo tuyến đường Hồ Tùng Mậu - Cầu Diễn'
    },
    heroImage: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80',
        caption: 'Cánh đồng cúc vàng, hoa ly và thược dược bừng nở dưới nắng sớm'
      }
    ],
    history: {
      originPeriod: 'Đầu thế kỷ XX',
      founder: 'Các bậc cao niên chuyển đổi từ đất trồng lúa sang chuyên canh hoa cảnh',
      milestones: [
        {
          period: 'Thập niên 1930',
          title: 'Khởi đầu với hoa hồng và lay ơn',
          description: 'Người dân Tây Tựu mang giống hoa về cải tạo đồng bãi phù sa màu mỡ.'
        },
        {
          period: 'Hiện đại',
          title: 'Ứng dụng công nghệ hoa nhà màng',
          description: 'Tây Tựu mở rộng diện tích với các giống hoa ngoại nhập như ly Hà Lan, đồng tiền, hoa hồng Pháp.'
        }
      ],
      culturalSignificance: 'Tây Tựu là nét văn hóa thưởng hoa tao nhã gắn liền với nhịp sống thanh lịch của người Tràng An.'
    },
    process: [
      {
        step: 1,
        title: 'Cải tạo đất phù sa và ươm giống',
        summary: 'Đất được cày ải, bón phân hữu cơ và tạo luống cao ráo thoát nước tốt.',
        description: 'Chọn củ giống hoa ly, mầm hoa hồng khỏe mạnh gieo trồng đúng tiết trời se lạnh.',
        image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Chong đèn ban đêm kích nở hoa',
        summary: 'Kỹ thuật thắp bóng điện xuyên đêm sưởi ấm giúp hoa nở đúng dịp Tết.',
        description: 'Cả cánh đồng Tây Tựu rực sáng lung linh như thành phố ánh sáng khi hàng vạn ngọn đèn được thắp sáng hàng đêm.',
        image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Bác Nguyễn Khắc Hùng',
        title: 'Chủ vườn hoa cúc thược dược 3 đời Tây Tựu',
        experience: '35 năm thắp đèn giữ hoa nở đúng độ xuân sang',
        quote: 'Chăm hoa cũng như chăm đứa trẻ, cần mưa thuận gió hòa và tình yêu đằm thắm của người làm vườn.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-tt-01'],
    featuredTourIds: ['tour-tt-01'],
    virtualHotspots: [
      {
        id: 'hs-tt-01',
        name: 'Đồng hoa đêm thắp đèn Tây Tựu',
        description: 'Khung cảnh lung linh huyền ảo với hàng vạn ánh đèn vàng thắp sáng suốt đêm trên cánh đồng hoa bát ngát.',
        image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Tháng 11 đến tháng 2 âm lịch (đặc biệt những tuần giáp Tết Nguyên Đán)',
    openingHours: '06:00 - 18:00 (buổi tối ngắm đèn từ 19:00 - 22:00)',
    ticketPrice: 'Vào vườn chụp ảnh: 20.000đ - 50.000đ/người tùy nhà vườn',
    tags: ['Hoa tươi', 'Check-in cánh đồng', 'Mùa Tết', 'Chụp ảnh dã ngoại', 'Bắc Từ Liêm']
  },
  {
    id: 'xuan-la',
    slug: 'xuan-la',
    name: 'Làng tò he Xuân La',
    category: 'Đồ chơi dân gian',
    categorySlug: 'do-choi-dan-gian',
    tagline: 'Sắc màu tuổi thơ – Nghệ thuật nặn bột dân gian độc nhất vô nhị',
    shortDescription: 'Làng nghề nặn tò he duy nhất của Việt Nam, nơi từ bột gạo nếp dẻo thơm và màu rau củ tự nhiên, nghệ nhân nhào nặn nên thế giới cổ tích đầy màu sắc.',
    location: {
      address: 'Xã Phượng Dực, Huyện Phú Xuyên',
      district: 'Huyện Phú Xuyên',
      city: 'Hà Nội',
      coordinates: [20.7325, 105.8234],
      distanceFromCenter: 'Khoảng 40 km về phía Nam theo Quốc lộ 1A',
      travelTime: '60 phút bằng ô tô hoặc xe buýt'
    },
    heroImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80',
        caption: 'Thế giới Tôn Ngộ Không, công chúa và 12 con giáp ngộ nghĩnh từ tò he'
      }
    ],
    history: {
      originPeriod: 'Hơn 300 năm trước',
      founder: 'Các bậc tiền nhân làng Xuân La ban đầu làm con giống bột dâng cúng đình chùa',
      milestones: [
        {
          period: 'Thế kỷ 18',
          title: 'Chim cò cúng lễ mùa gặt',
          description: 'Ban đầu gọi là "con bánh bột" hay "con giống bột", dùng cúng tạ thần linh sau vụ mùa rồi phát cho trẻ con ăn được.'
        },
        {
          period: 'Hiện đại',
          title: 'Hành trình di sản văn hóa',
          description: 'Nghệ nhân Xuân La mang tò he đi biểu diễn giao lưu văn hóa tại Mỹ, Nhật Bản, Hàn Quốc và châu Âu.'
        }
      ],
      culturalSignificance: 'Tò he lưu giữ ký ức ấu thơ mộc mạc và gắn kết các thế hệ người Việt qua những tạo hình dân gian sống động.'
    },
    process: [
      {
        step: 1,
        title: 'Xay bột gạo nếp và nhào chín',
        summary: 'Pha bột gạo tẻ và nếp cái hoa vàng theo tỷ lệ 10:1, luộc chín dẻo.',
        description: 'Bột được xay nhuyễn, nhào kỹ và luộc vừa độ chín để đạt độ dẻo kết dính hoàn hảo mà không bị dính tay.',
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Nhuộm 4 màu cơ bản từ rau quả',
        summary: 'Màu đỏ từ gấc, vàng từ nghệ, xanh từ lá chàm/lá dứa, đen từ tro rơm nếp.',
        description: 'Màu sắc hoàn toàn tự nhiên, an toàn cho trẻ em và giữ được hương thơm ngát của nếp đồng nội.',
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Vê bột, tạo hình trên que tre',
        summary: 'Dùng ngón tay thoăn thoắt bấm, vuốt, châm que tre chỉ trong vài phút.',
        description: 'Chỉ bằng chiếc lược răng cưa và bàn tay tài hoa, chú rồng uốn khúc, bông hoa hồng hay siêu anh hùng xuất hiện sinh động trên đầu que tre.',
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Đặng Văn Hậu',
        title: 'Bàn tay vàng phục hưng con giống bột Phú Xuyên',
        experience: '20 năm sáng tạo tò he truyền thống và hiện đại',
        quote: 'Nặn tò he không chỉ là đồ chơi, đó là một tác phẩm điêu khắc mini gửi gắm nụ cười trẻ thơ.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-xl-01'],
    featuredTourIds: ['tour-xl-01'],
    virtualHotspots: [
      {
        id: 'hs-xl-01',
        name: 'Không gian Trải nghiệm Tò He Xuân La',
        description: 'Lớp học nặn tò he dành cho gia đình và du khách nhí vào mỗi dịp cuối tuần.',
        image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Dịp Trung thu hoặc các ngày hội làng rằm tháng Giêng',
    openingHours: '08:00 - 17:30',
    ticketPrice: 'Vào làng miễn phí. Lớp học nặn tò he mang về: 30.000đ - 50.000đ/người',
    tags: ['Tò he', 'Trẻ em', 'Gia đình', 'Tuổi thơ', 'Phú Xuyên']
  },
  {
    id: 'quang-phu-cau',
    slug: 'quang-phu-cau',
    name: 'Làng tăm hương Quảng Phú Cầu',
    category: 'Hương & Thảo mộc',
    categorySlug: 'huong-thao-moc',
    tagline: 'Sắc đỏ chân hương – Hương trầm thơm ngát đất trời Thăng Long',
    shortDescription: 'Làng hương hơn 100 năm tuổi với những đóa hoa hương xòe cánh rực rỡ dưới nắng, là điểm đến nhiếp ảnh nổi tiếng quốc tế và lưu giữ bí quyết hương thơm thảo mộc tự nhiên.',
    location: {
      address: 'Xã Quảng Phú Cầu, Huyện Ứng Hòa',
      district: 'Huyện Ứng Hòa',
      city: 'Hà Nội',
      coordinates: [20.7850, 105.7900],
      distanceFromCenter: 'Khoảng 35 km về phía Tây Nam',
      travelTime: '50 - 60 phút theo trục QL21B hoặc xe buýt số 91'
    },
    heroImage: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1000&q=80',
        caption: 'Những bó tăm hương xòe rộng như đóa hoa khổng lồ phơi dưới nắng ấm'
      },
      {
        url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1000&q=80',
        caption: 'Nghệ nhân se bột hương thảo mộc tự nhiên từ trầm, quế, hồi'
      },
      {
        url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1000&q=80',
        caption: 'Không gian phơi hương rực rỡ tại sân đình Đạo Tú'
      }
    ],
    history: {
      originPeriod: 'Đầu thế kỷ XX (Hơn 100 năm)',
      founder: 'Các bậc tiền nhân làng Phú Lương Thượng',
      milestones: [
        {
          period: 'Thập niên 1920',
          title: 'Khởi thủy nghề chẻ tăm hương thủ công',
          description: 'Ban đầu người dân chỉ chẻ tăm hương nứa bán cho các vùng làm hương lân cận tại Hà Tây cũ.'
        },
        {
          period: 'Năm 1995',
          title: 'Khép kín chuỗi sản xuất hương thảo mộc thành phẩm',
          description: 'Làng đầu tư máy móc tuốt tăm hiện đại kết hợp bí quyết se hương từ hồi, quế, trầm thảo mộc xuất khẩu đi Ấn Độ, Trung Quốc.'
        },
        {
          period: 'Năm 2020 - nay',
          title: 'Điểm sáng du lịch văn hóa & nhiếp ảnh quốc tế',
          description: 'Được các hãng thông tấn AFP, CNN, National Geographic vinh danh là một trong những làng nghề thị giác ấn tượng nhất châu Á.'
        }
      ],
      culturalSignificance: 'Quảng Phú Cầu cung cấp tăm hương cho khắp các thánh địa tâm linh cả nước và xuất khẩu sang nhiều quốc gia, gìn giữ nét văn hóa thắp hương thơm tưởng nhớ tổ tiên.'
    },
    process: [
      {
        step: 1,
        title: 'Chọn vầu, nứa bánh tẻ',
        summary: 'Khai thác nứa rừng già dẻo dai',
        description: 'Cây vầu, tre nứa được nhập từ các tỉnh vùng cao Hòa Bình, Yên Bái, đảm bảo thân thẳng, đủ độ dẻo và không bị mọt.',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        duration: '1 ngày phân loại'
      },
      {
        step: 2,
        title: 'Chẻ nan và tuốt tăm tròn',
        summary: 'Chẻ nan mỏng đều tăm tắp',
        description: 'Tre được chẻ thành từng thanh nan nhỏ, sau đó đưa qua máy tuốt tròn đều đặn, kích thước chuẩn xác từng milimet.',
        image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
        duration: '2 - 3 giờ'
      },
      {
        step: 3,
        title: 'Nhuộm chân hương và xòe hoa phơi nắng',
        summary: 'Tạo màu đỏ thắm may mắn',
        description: 'Chân tăm hương được nhúng vào thùng màu hồng cánh sen hoặc đỏ tươi, sau đó xòe tròn như bông hoa khổng lồ phơi trên khắp các sân đình và con ngõ.',
        image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
        duration: 'Phơi nắng 1 - 2 ngày'
      },
      {
        step: 4,
        title: 'Se bột hương thảo mộc tự nhiên',
        summary: 'Phối trộn trầm hương, quế, đại hồi',
        description: 'Bột hương phối trộn từ hàng chục vị thảo mộc thiên nhiên được se đều quanh thân tăm, tạo nên làn khói thơm thanh tao, an lành cho sức khỏe.',
        image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
        duration: 'Bảo quản sấy khô'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Nguyễn Hữu Long',
        title: 'Chủ cơ sở hương truyền thống Quảng Phú Cầu',
        experience: '40 năm giữ lửa nghề làm chân hương thảo mộc',
        quote: 'Mỗi nén hương thắp lên là lòng thành kính với trời đất và tổ tiên, vì vậy nguyên liệu phải hoàn toàn thanh sạch từ thảo mộc thiên nhiên.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-qpc-01'],
    featuredTourIds: ['tour-qpc-01'],
    virtualHotspots: [
      {
        id: 'hs-qpc-01',
        name: 'Sân hoa hương đình làng Đạo Tú',
        description: 'Không gian phơi hương xòe hoa nghệ thuật quy mô lớn bậc nhất làng nghề, điểm check-in hấp dẫn du khách trong và ngoài nước.',
        image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Tháng 10 đến tháng 1 âm lịch (mùa cao điểm làm hương Tết)',
    openingHours: '07:30 - 18:00',
    ticketPrice: 'Vào làng miễn phí. Phí chụp ảnh tại các bãi phơi nghệ thuật: 30.000đ - 50.000đ/người',
    tags: ['Tăm hương', 'Check-in', 'Nhiếp ảnh', 'Ứng Hòa', 'Du lịch văn hóa']
  },
  {
    id: 'chuyen-my',
    slug: 'chuyen-my',
    name: 'Làng khảm trai Chuôn Ngọ (Chuyên Mỹ)',
    category: 'Sơn mài & Khảm trai',
    categorySlug: 'son-mai-kham-trai',
    tagline: 'Nghệ thuật cẩn xà cừ nghìn năm – Ánh ngọc trai lấp lánh đất Thăng Long',
    shortDescription: 'Làng nghề khảm trai xà cừ hơn 1.000 năm tuổi từ thời nhà Lý, nổi danh với kỹ thuật cẩn ốc đỏ, xà cừ tinh xảo trên gỗ quý tạo nên những kiệt tác nội thất cung đình.',
    location: {
      address: 'Làng Chuôn Ngọ, Xã Chuyên Mỹ, Huyện Phú Xuyên',
      district: 'Huyện Phú Xuyên',
      city: 'Hà Nội',
      coordinates: [20.7020, 105.8820],
      distanceFromCenter: 'Khoảng 40 km về phía Nam',
      travelTime: '60 phút theo cao tốc Pháp Vân - Cầu Giẽ'
    },
    heroImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bức tranh khảm trai xà cừ ngũ sắc óng ánh trên nền gỗ trắc'
      },
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        caption: 'Nghệ nhân tỉ mỉ đục chạm rãnh gỗ để gắn từng mảnh ốc'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ XI (Thời Lý)',
      founder: 'Tướng quân Trương Công Thành',
      milestones: [
        {
          period: 'Năm 1010 - 1028',
          title: 'Tổ nghề Trương Công Thành truyền dạy',
          description: 'Sau khi dẹp giặc, ngài trở về quê hương Chuôn Ngọ dạy dân cách dùng vỏ trai sông ngòi để cẩn ghép tranh tượng dâng vua Lý Thái Tổ.'
        },
        {
          period: 'Thế kỷ XIX - Triều Nguyễn',
          title: 'Đỉnh cao đồ ngự dụng cung đình',
          description: 'Nghệ nhân Chuôn Ngọ được triệu về kinh đô Huế đóng sập gụ, tủ chè, hoành phi cẩn ốc đỏ xà cừ cho hoàng gia.'
        },
        {
          period: 'Thế kỷ XXI',
          title: 'Hội nhập quốc tế và sáng tạo đương đại',
          description: 'Sản phẩm khảm trai mở rộng sang hộp nữ trang, tranh phong cảnh, bút ký cao cấp xuất khẩu sang Nhật Bản, châu Âu.'
        }
      ],
      culturalSignificance: 'Chuôn Ngọ là cái nôi của nghệ thuật khảm xà cừ Việt Nam, được công nhận là Di sản văn hóa phi vật thể quốc gia.'
    },
    process: [
      {
        step: 1,
        title: 'Thiết kế bản vẽ đồ họa',
        summary: 'Vẽ phác thảo hoa văn trên giấy dó',
        description: 'Họa sĩ dân gian vẽ chi tiết họa tiết phong cảnh, chim hoa, điển tích lịch sử với độ chính xác cao.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Cắt cưa vỏ trai, vỏ ốc xà cừ',
        summary: 'Cắt gọt từng chi tiết nhỏ li ti',
        description: 'Dùng cưa tay thủ công tỉ mỉ cưa từng mảnh vỏ ốc đỏ, xà cừ mỏng tang theo đường nét bản vẽ mà không làm vỡ mảnh ngọc.',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Đục gỗ hạ mức nền',
        summary: 'Đục lòng gỗ khớp với hình vỏ trai',
        description: 'Đục rãnh gỗ nông sâu vừa đúng bằng độ dày của miếng trai để khi gắn vào mặt phẳng gỗ không bị gồ ghề.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Gắn trai, mài ráp và đánh bóng',
        summary: 'Mài phẳng bóng mịn như gương',
        description: 'Gắn keo sơn ta chuyên dụng, sau đó mài nước qua nhiều cấp độ giấy ráp và đánh bóng bằng lá chuối khô tự nhiên.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Nhân dân Nguyễn Đức Biết',
        title: 'Bậc thầy khảm ốc đỏ xà cừ Chuôn Ngọ',
        experience: 'Hơn 55 năm cống hiến cho nghệ thuật khảm trai',
        quote: 'Vỏ trai vỏ ốc tưởng chừng vô tri, nhưng dưới bàn tay người thợ Chuôn Ngọ, chúng biết kể những câu chuyện ngàn năm của dân tộc.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-cm-01'],
    featuredTourIds: ['tour-cm-01'],
    virtualHotspots: [
      {
        id: 'hs-cm-01',
        name: 'Đền thờ Tổ nghề Trương Công Thành',
        description: 'Ngôi đền cổ linh thiêng thờ vị khai sơn phá thạch truyền nghề khảm trai cho dân làng từ thế kỷ XI.',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Quanh năm, đặc biệt dịp lễ hội giỗ Tổ mùng 9 tháng Giêng âm lịch',
    openingHours: '08:00 - 17:30',
    ticketPrice: 'Vào làng và tham quan miễn phí',
    tags: ['Khảm trai', 'Xà cừ', 'Di sản quốc gia', 'Phú Xuyên', 'Mỹ nghệ cao cấp']
  },
  {
    id: 'ha-thai',
    slug: 'ha-thai',
    name: 'Làng sơn mài Hạ Thái',
    category: 'Sơn mài & Khảm trai',
    categorySlug: 'son-mai-kham-trai',
    tagline: 'Sắc sơn lung linh – Đẳng cấp mỹ thuật sơn mài Thường Tín',
    shortDescription: 'Làng nghề sơn mài danh tiếng hơn 200 năm, cái nôi kết hợp kỹ thuật sơn son thếp vàng truyền thống với hội họa mỹ thuật Đông Dương, xuất khẩu sang hơn 30 quốc gia.',
    location: {
      address: 'Xã Duyên Thái, Huyện Thường Tín',
      district: 'Huyện Thường Tín',
      city: 'Hà Nội',
      coordinates: [20.9080, 105.8650],
      distanceFromCenter: 'Khoảng 17 km về phía Nam',
      travelTime: '30 - 35 phút theo Quốc lộ 1A'
    },
    heroImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80',
        caption: 'Bức tranh sơn mài vẽ vàng và vỏ trứng với chiều sâu huyền ảo'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ XVII (Hơn 200 năm)',
      founder: 'Các phường thợ sơn Cự Đà và làng Hạ Thái cổ',
      milestones: [
        {
          period: 'Thế kỷ XVIII',
          title: 'Sơn son thếp vàng đồ thờ cúng',
          description: 'Chuyên sản xuất kiệu bát cống, ngai thờ, hoành phi câu đối cho các danh thắng Thăng Long.'
        },
        {
          period: 'Thập niên 1930',
          title: 'Giao thoa nghệ thuật Trường Mỹ thuật Đông Dương',
          description: 'Họa sĩ trường Mỹ thuật Đông Dương về Hạ Thái tìm chất liệu sơn ta, nâng tầm sơn thủ công thành hội họa sơn mài đỉnh cao.'
        }
      ],
      culturalSignificance: 'Hạ Thái khẳng định vị thế tranh và sản phẩm gia dụng sơn mài thủ công Việt Nam trên thị trường quốc tế.'
    },
    process: [
      {
        step: 1,
        title: 'Tạo phôi cốt gỗ và gốm',
        summary: 'Gia công phôi mộc chuẩn xác',
        description: 'Cốt mộc được làm từ gỗ sấy khô hoặc composite, gốm không cong vênh.',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Hom bó và sơn lót nhiều lớp',
        summary: 'Bó vải màn chống rạn nứt',
        description: 'Dùng đất phù sa mịn trộn sơn ta hom kín phôi, bọc vải màn để cốt không bao giờ nứt nẻ.',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Vẽ họa tiết, cẩn vỏ trứng, thếp vàng',
        summary: 'Tạo hình nghệ thuật đa tầng',
        description: 'Nghệ nhân dùng sơn then, sơn cánh gián vẽ nét, rắc bột vàng, gắn vỏ trứng tạo hoa văn huyền diệu.',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Mài nước và đánh bóng hoàn thiện',
        summary: 'Mài dưới nước hé lộ lớp tranh sâu thẳm',
        description: 'Dùng giấy ráp mịn mài đều dưới làn nước chảy, sau đó dùng lòng bàn tay xoa bột than đánh bóng tới khi láng mịn như gương.',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Ưu tú Đỗ Văn Thái',
        title: 'Bàn tay vàng làng nghề sơn mài Hạ Thái',
        experience: '45 năm sáng tác tranh sơn mài nghệ thuật',
        quote: 'Sơn mài là sự kỳ diệu của mài và tìm. Phải mài đi mới thấy được ánh sáng lung linh của vàng son ẩn sâu bên dưới.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-ht-01'],
    featuredTourIds: ['tour-ht-01'],
    virtualHotspots: [
      {
        id: 'hs-ht-01',
        name: 'Nhà trưng bày Không gian Sơn mài Hạ Thái',
        description: 'Nơi quy tụ hàng trăm tác phẩm sơn mài đỉnh cao từ bình hoa, đĩa decor đến tranh mỹ thuật khổ lớn.',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Mùa thu và dịp cuối năm',
    openingHours: '08:00 - 18:00',
    ticketPrice: 'Vào làng miễn phí',
    tags: ['Sơn mài', 'Tranh nghệ thuật', 'Thường Tín', 'Sơn son thếp vàng']
  },
  {
    id: 'son-dong',
    slug: 'son-dong',
    name: 'Làng nghề tạc tượng & đồ thờ Sơn Đồng',
    category: 'Điêu khắc & Gỗ mỹ nghệ',
    categorySlug: 'dieu-khac-go',
    tagline: 'Thổi hồn vào gỗ – Thiên đường đồ thờ tâm linh xứ Đoài',
    shortDescription: 'Làng nghề hơn 800 năm tuổi chuyên tạc tượng Phật giáo, tượng danh nhân và đồ thờ sơn son thếp vàng, cung cấp cho hơn một nửa di tích đền chùa miền Bắc.',
    location: {
      address: 'Xã Sơn Đồng, Huyện Hoài Đức',
      district: 'Huyện Hoài Đức',
      city: 'Hà Nội',
      coordinates: [21.0250, 105.7150],
      distanceFromCenter: 'Khoảng 18 km về phía Tây',
      travelTime: '30 - 40 phút theo Đại lộ Thăng Long hoặc đường 32'
    },
    heroImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80',
        caption: 'Tượng Phật Di Lặc và Quan Âm thếp vàng nguy nga tráng lệ'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ XIII (Hơn 800 năm)',
      founder: 'Cụ tổ nghề tạc tượng dân gian xứ Đoài',
      milestones: [
        {
          period: 'Thời Lý - Trần',
          title: 'Khởi dựng phường thợ tạc tượng chùa chiền',
          description: 'Các nghệ nhân phục dựng tượng Phật tam thế, hoành phi câu đối cho các quốc tự.'
        },
        {
          period: 'Thế kỷ XXI',
          title: 'Làng nghề mỹ nghệ tiêu biểu toàn quốc',
          description: 'Hơn 4.000 thợ giỏi, sản phẩm hiện diện tại chùa Bái Đính, chùa Hương và nhiều ngôi chùa Việt kiều ở nước ngoài.'
        }
      ],
      culturalSignificance: 'Gìn giữ nghệ thuật tạc tượng gỗ truyền thống mang tính biểu tượng của nền điêu khắc Phật giáo Việt Nam.'
    },
    process: [
      {
        step: 1,
        title: 'Chọn gỗ mít già lõi vàng',
        summary: 'Loại gỗ tâm linh không mọt nứt',
        description: 'Chỉ chọn thân gỗ mít già tuổi, thớ mềm dẻo, ít cong vênh và mang ý nghĩa tâm linh tốt lành.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Đục phá và tạo hình khối',
        summary: 'Định hình tỷ lệ diện tượng',
        description: 'Dùng búa và đục thô chặt bỏ phần gỗ thừa, định hình diện mạo, dáng ngồi, nếp áo theo quy chuẩn Phật học.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Đục chạm tỉa chi tiết tinh vi',
        summary: 'Thổi thần thái vào diện mạo tượng',
        description: 'Dùng đục bén tỉa từng sợi tóc, ánh mắt bao dung, khóe miệng từ bi và dải áo bồng bềnh.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Sơn hom và thếp quỳ vàng 9999',
        summary: 'Thếp vàng óng ánh uy nghi',
        description: 'Sơn phủ sơn ta chống mối mọt, sau đó thếp từng lá vàng quỳ Kiêu Kỵ mỏng manh lên bề mặt tượng tạo vẻ đẹp trang nghiêm.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Nguyễn Viết Thắng',
        title: 'Bàn tay vàng điêu khắc gỗ tâm linh Sơn Đồng',
        experience: '38 năm đục tượng Phật và phục chế di tích',
        quote: 'Tạc tượng Phật quan trọng nhất là chữ Tâm. Người thợ phải tĩnh tâm thì diện tượng mới tỏa rạng vẻ từ bi hỷ xả.',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-sd-01'],
    featuredTourIds: ['tour-sd-01'],
    virtualHotspots: [
      {
        id: 'hs-sd-01',
        name: 'Phố nghề Điêu khắc tượng Sơn Đồng',
        description: 'Tuyến đường rực rỡ với hàng trăm xưởng mộc, mùi gỗ mít thơm nồng và thanh âm gõ đục rộn rã sớm chiều.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Tháng 8 đến tháng 12 âm lịch (chuẩn bị đồ thờ đón Tết)',
    openingHours: '08:00 - 18:00',
    ticketPrice: 'Tham quan tự do',
    tags: ['Tạc tượng', 'Đồ thờ', 'Gỗ mít', 'Sơn Đồng', 'Hoài Đức']
  },
  {
    id: 'trach-xa',
    slug: 'trach-xa',
    name: 'Làng may áo dài Trạch Xá',
    category: 'Lụa & Dệt',
    categorySlug: 'lua-det',
    tagline: 'Một nghìn năm giữ nét kim luồn – Nôi sinh tà áo dài Việt Nam',
    shortDescription: 'Làng nghề may áo dài cổ truyền hơn 1.000 năm tuổi với kỹ thuật cầm kim dọc độc nhất vô nhị, nơi các nghệ nhân nam giới khâu tay những tà áo dài giấu chỉ phẳng mượt.',
    location: {
      address: 'Thôn Trạch Xá, Xã Hòa Lâm, Huyện Ứng Hòa',
      district: 'Huyện Ứng Hòa',
      city: 'Hà Nội',
      coordinates: [20.7380, 105.7600],
      distanceFromCenter: 'Khoảng 45 km về phía Nam',
      travelTime: '60 - 70 phút theo QL21B'
    },
    heroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
        caption: 'Tà áo dài tơ tằm mềm mại được khâu tay mũi kim dọc bí truyền'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ X (Năm 968 - Hơn 1.000 năm)',
      founder: 'Đức bà Nguyễn Thị Sen (Tứ phi hoàng hậu của vua Đinh Tiên Hoàng)',
      milestones: [
        {
          period: 'Năm 968',
          title: 'Hoàng hậu Nguyễn Thị Sen truyền nghề',
          description: 'Hoàng phi triều Đinh mang kỹ thuật may vá cung đình về dạy cho người dân quê hương Trạch Xá.'
        },
        {
          period: 'Thế kỷ XX',
          title: 'Thợ may Trạch Xá mở hiệu khắp phố cổ Hà Nội',
          description: 'Những nhà may áo dài lừng danh Hà thành như Lương Văn, Vinh Trạch, Phúc Thái đều do người gốc Trạch Xá làm chủ.'
        }
      ],
      culturalSignificance: 'Di sản văn hóa phi vật thể quốc gia, lưu giữ kỹ thuật thủ công tinh túy tạo nên tà áo dài quốc phục Việt Nam.'
    },
    process: [
      {
        step: 1,
        title: 'Lấy số đo thước tấc cổ truyền',
        summary: 'Đo phom dáng chính xác tới từng milimet',
        description: 'Nghệ nhân quan sát dáng người để căn chỉnh độ võng eo, góc tà sao cho khi mặc áo ôm khít nhưng vẫn bay bổng.',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Cắt tơ lụa theo canh sợi ngang dọc',
        summary: 'Kéo cắt không xơ sợi vải',
        description: 'Cắt vải lụa tơ tằm theo chiều sợi, tính toán độ co giãn của từng chất liệu lụa Vân, gấm, sa tơ.',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Kỹ thuật cầm kim dọc giấu chỉ',
        summary: 'Bí quyết may tay độc nhất vô nhị',
        description: 'Người thợ cầm kim thẳng đứng, đẩy bằng ngón tay trỏ. Mũi chỉ mặt ngoài giấu kín hoàn toàn, mặt trong đều tăm tắp như đường may máy.',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Tết khuy bướm và hoàn thiện tà áo',
        summary: 'Khuy tết thủ công ngũ hành',
        description: 'Tự tay tết nút khuy bướm mềm mại và là ủi bằng bàn ủi nhiệt truyền thống.',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Đỗ Minh Tám',
        title: 'Chủ nhiệm CLB Nghề may áo dài Trạch Xá',
        experience: '42 năm cầm kim dọc gìn giữ quốc phục',
        quote: 'Đường kim của thợ Trạch Xá như nước chảy mây trôi. Áo dài may tay có linh hồn vì người thợ gửi cả tấm lòng vào từng mũi chỉ.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-tx-01'],
    featuredTourIds: ['tour-tx-01'],
    virtualHotspots: [
      {
        id: 'hs-tx-01',
        name: 'Đền thờ Đức Tổ nghề May Nguyễn Thị Sen',
        description: 'Nơi tri ân đức Thánh mẫu truyền nghề may áo dài cho muôn đời con cháu làng Trạch Xá.',
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Mùa thu và dịp lễ hội Tổ nghề mùng 4 tháng Giêng',
    openingHours: '08:00 - 17:30',
    ticketPrice: 'Tham quan miễn phí. May đo áo dài theo yêu cầu: từ 600.000đ - 2.500.000đ/bộ',
    tags: ['Áo dài', 'May đo', 'Di sản quốc gia', 'Ứng Hòa', 'Lụa tơ tằm']
  },
  {
    id: 'thach-xa',
    slug: 'thach-xa',
    name: 'Làng chuồn chuồn tre Thạch Xá',
    category: 'Đồ chơi dân gian',
    categorySlug: 'do-choi-dan-gian',
    tagline: 'Kỳ diệu thăng bằng tre mộc – Ký ức tuổi thơ dưới chân Tây Phương Cổ Tự',
    shortDescription: 'Làng nghề nổi tiếng nép mình dưới chân chùa Tây Phương, nơi khai sinh những chú chuồn chuồn tre có khả năng tự thăng bằng ngoạn mục trên bất kỳ đầu ngón tay hay cành cây.',
    location: {
      address: 'Xã Thạch Xá, Huyện Thạch Thất',
      district: 'Huyện Thạch Thất',
      city: 'Hà Nội',
      coordinates: [21.0180, 105.6280],
      distanceFromCenter: 'Khoảng 30 km về phía Tây',
      travelTime: '40 phút theo Đại lộ Thăng Long'
    },
    heroImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1000&q=80',
        caption: 'Hàng trăm chú chuồn chuồn tre rực rỡ sắc màu đậu thăng bằng'
      }
    ],
    history: {
      originPeriod: 'Thập niên 1990 (Hơn 30 năm)',
      founder: 'Nghệ nhân Nguyễn Văn Tái và các thợ tre Thạch Xá',
      milestones: [
        {
          period: 'Năm 1995',
          title: 'Sáng chế cơ chế thăng bằng đối trọng',
          description: 'Ứng dụng định luật cân bằng trọng tâm, tạo nên chuồn chuồn tre có thể đậu thăng bằng chỉ bằng một điểm nhọn ở mỏ.'
        },
        {
          period: 'Năm 2010 - nay',
          title: 'Vươn ra thế giới',
          description: 'Sản phẩm trở thành món quà lưu niệm Việt Nam được du khách quốc tế từ Mỹ, Pháp, Nhật Bản say mê yêu thích.'
        }
      ],
      culturalSignificance: 'Món đồ chơi dân gian mộc mạc lưu giữ hồn quê Bắc Bộ và gắn liền với cụm di tích quốc gia đặc biệt chùa Tây Phương.'
    },
    process: [
      {
        step: 1,
        title: 'Chọn tre rừng bánh tẻ phơi nỏ',
        summary: 'Tre ngâm chống mối mọt tự nhiên',
        description: 'Tre rừng mua từ Hòa Bình, Phú Thọ được cạo sạch vỏ xanh, phơi nỏ tự nhiên để không bị cong vênh theo thời tiết.',
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Vót thân và cánh chuồn chuồn',
        summary: 'Tạo hình tỉ mỉ chính xác',
        description: 'Vót mỏng cánh và uốn cong phần đầu mỏ sao cho hai cánh có độ đối xứng tuyệt đối.',
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Căn chỉnh trọng tâm thăng bằng',
        summary: 'Bí quyết đậu thăng bằng kỳ diệu',
        description: 'Lắp cánh vào mộng thân, dùng ngón tay thử nghiệm để điều chỉnh trọng tâm dồn chính xác về chóp mỏ nhọn.',
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Sơn vẽ hoa văn dân gian rực rỡ',
        summary: 'Vẽ hoa văn hoa cỏ, chấm bi ngũ sắc',
        description: 'Dùng sơn dầu vẽ họa tiết truyền thống và phủ bóng để chuồn chuồn bền màu cùng năm tháng.',
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Nguyễn Văn Tái',
        title: 'Người giữ lửa chuồn chuồn tre Thạch Xá',
        experience: 'Gần 30 năm sáng tạo đồ chơi tre dân gian',
        quote: 'Mỗi chú chuồn chuồn tre là bài học về sự cân bằng và bình yên, giúp các em nhỏ rời xa màn hình điện tử để yêu thiên nhiên làng quê.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-thx-01'],
    featuredTourIds: ['tour-thx-01'],
    virtualHotspots: [
      {
        id: 'hs-thx-01',
        name: 'Xưởng Chuồn chuồn tre chân chùa Tây Phương',
        description: 'Không gian workshop rực rỡ chuồn chuồn tre và thưởng thức bánh chè lam ấm nồng xứ Đoài.',
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Quanh năm, kết hợp trẩy hội chùa Tây Phương tháng 3 âm lịch',
    openingHours: '08:00 - 18:00',
    ticketPrice: 'Vào làng tự do. Chuồn chuồn tre kỷ niệm: 10.000đ - 50.000đ/con',
    tags: ['Chuồn chuồn tre', 'Đồ chơi dân gian', 'Chùa Tây Phương', 'Thạch Thất', 'Chè lam']
  },
  {
    id: 'chang-son',
    slug: 'chang-son',
    name: 'Làng quạt & mộc Chàng Sơn',
    category: 'Nghệ thuật dân gian',
    categorySlug: 'nghe-thuat-dan-gian',
    tagline: 'Quạt Chàng Sơn đón gió nghìn năm – Tinh hoa mộc cổ truyền xứ Đoài',
    shortDescription: 'Làng nghề cổ truyền từ thời Hùng Vương nổi danh với những chiếc quạt giấy, quạt lụa chạm khắc tinh tế từng trưng bày tại Paris thế kỷ XIX, cùng nghề làm mộc nhà cổ nức tiếng.',
    location: {
      address: 'Xã Chàng Sơn, Huyện Thạch Thất',
      district: 'Huyện Thạch Thất',
      city: 'Hà Nội',
      coordinates: [21.0380, 105.6400],
      distanceFromCenter: 'Khoảng 32 km về phía Tây',
      travelTime: '45 phút theo Đại lộ Thăng Long'
    },
    heroImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
        caption: 'Chiếc quạt lụa Chàng Sơn vẽ tranh thủy mặc phố cổ Hà Nội'
      }
    ],
    history: {
      originPeriod: 'Thời các Vua Hùng (Hơn 2.000 năm truyền thuyết)',
      founder: 'Tổ nghề thợ mộc Chàng Sơn & các danh nhân làng',
      milestones: [
        {
          period: 'Thế kỷ XIX (Năm 1889)',
          title: 'Quạt Chàng Sơn dự Triển lãm Đấu xảo Paris',
          description: 'Người Pháp thán phục trước nét chạm trổ tinh vi trên nan quạt tre và bức vẽ sơn thủy trên giấy điệp.'
        },
        {
          period: 'Thế kỷ XXI',
          title: 'Kỷ lục chiếc quạt lớn nhất Việt Nam',
          description: 'Nghệ nhân Dương Văn Mơ chế tác chiếc quạt khổng lồ dài hơn 9m tái hiện bức tranh Đông Đô ngàn năm lịch sử.'
        }
      ],
      culturalSignificance: 'Biểu tượng của nét đẹp tao nhã, thanh cao của người Tràng An và tay nghề đục mộc lừng danh xứ Đoài.'
    },
    process: [
      {
        step: 1,
        title: 'Chọn tre ngâm nước vôi',
        summary: 'Chống mọt và dẻo dai',
        description: 'Tre được ngâm bùn hoặc nước vôi từ 3 đến 6 tháng để tre dẻo quánh, không bao giờ gãy nan.',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Chạm khắc hoa văn hai nan mẹ',
        summary: 'Chạm thủng rồng phượng tinh vi',
        description: 'Hai nan cái bằng sừng hoặc tre già được nghệ nhân chạm khắc rồng phượng, mai lan cúc trúc uốn lượn mềm mại.',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Cắt dán giấy dó và lụa tơ tằm',
        summary: 'Dùng nhựa cậy gắn dính tự nhiên',
        description: 'Dán giấy điệp hoặc lụa tơ tằm bằng nhựa cậy rừng nguyên chất, bền bỉ với thời tiết ẩm ướt.',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Vẽ tranh thủy mặc và vào chốt',
        summary: 'Họa nét tranh di sản',
        description: 'Họa sĩ dân gian vẽ cảnh Hồ Gươm, Chùa Một Cột, hoa sen rồi vào chốt đồng cổ điển chắc chắn.',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Dương Văn Mơ',
        title: 'Kỷ lục gia làm quạt mỹ nghệ Chàng Sơn',
        experience: 'Hơn 50 năm giữ nghề quạt truyền thống',
        quote: 'Chiếc quạt giấy Chàng Sơn không chỉ để xua đi oi ả, mà còn là vật phẩm phong nhã chở che vẻ đẹp tâm hồn văn hóa Việt.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-cs-01'],
    featuredTourIds: ['tour-cs-01'],
    virtualHotspots: [
      {
        id: 'hs-cs-01',
        name: 'Không gian Trưng bày Quạt Nghệ thuật Chàng Sơn',
        description: 'Bảo tàng thu nhỏ với hàng ngàn mẫu quạt cung đình, quạt thờ, quạt tranh thủy mặc độc bản.',
        image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Mùa hè và dịp hội làng Chàng Sơn',
    openingHours: '08:00 - 17:30',
    ticketPrice: 'Vào làng miễn phí. Quạt lưu niệm: từ 40.000đ - 500.000đ/chiếc',
    tags: ['Quạt giấy', 'Quạt lụa', 'Mộc Chàng Sơn', 'Thạch Thất', 'Mỹ nghệ cổ']
  },
  {
    id: 'me-tri',
    slug: 'me-tri',
    name: 'Làng cốm Mễ Trì',
    category: 'Ẩm thực truyền thống',
    categorySlug: 'am-thuc-truyen-thong',
    tagline: 'Hương cốm mùa thu – Tinh túy ẩm thực nghìn năm Thăng Long',
    shortDescription: 'Di sản văn hóa phi vật thể quốc gia, nơi lưu giữ tinh hoa làm cốm mộc nếp cái hoa vàng từ hàng trăm năm, từng được chọn chiêu đãi Tổng thống Mỹ và các nguyên thủ quốc tế.',
    location: {
      address: 'Phường Mễ Trì, Quận Nam Từ Liêm',
      district: 'Quận Nam Từ Liêm',
      city: 'Hà Nội',
      coordinates: [21.0120, 105.7880],
      distanceFromCenter: 'Khoảng 8 km về phía Tây',
      travelTime: '20 phút từ trung tâm Hoàn Kiếm'
    },
    heroImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80',
        caption: 'Hạt cốm xanh mộc lá me mềm dẻo bọc trong lá sen thơm dịu'
      }
    ],
    history: {
      originPeriod: 'Thế kỷ XIX (Hơn 150 năm)',
      founder: 'Các cụ tổ dòng họ Đỗ, Ngô làng Mễ Trì Hạ',
      milestones: [
        {
          period: 'Năm 2016',
          title: 'Tiếp đón Tổng thống Mỹ Barack Obama',
          description: 'Cốm Mễ Trì vinh dự được giới thiệu trong hành trình khám phá văn hóa ẩm thực Hà Nội của Tổng thống Mỹ.'
        },
        {
          period: 'Năm 2019',
          title: 'Công nhận Di sản văn hóa phi vật thể quốc gia',
          description: 'Bộ Văn hóa Thể thao và Du lịch ghi danh Nghề cốm Mễ Trì vào danh mục Di sản quốc gia.'
        }
      ],
      culturalSignificance: 'Biểu tượng ẩm thực thanh tao tao nhã đặc trưng của mùa thu Hà Nội, kết tinh hương vị phù sa đồng bằng châu thổ.'
    },
    process: [
      {
        step: 1,
        title: 'Thu hoạch nếp cái hoa vàng ngậm sữa',
        summary: 'Chọn bông nếp sữa đầu mùa',
        description: 'Lúa nếp non khi hạt vừa đông sữa tròn mẩy được gặt sớm vào lúc sương mai chưa tan để giữ trọn vị ngọt tự nhiên.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 2,
        title: 'Rang thóc nếp trên chảo gang củi',
        summary: 'Lửa củi liu riu đảo đều tay',
        description: 'Thóc nếp được rang trên chảo gang dày bằng than củi, thợ đảo liên tục đều tay để hạt thóc chín tới, dậy hương thơm lừng mà không bị nứt vỡ.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 3,
        title: 'Giã cốm nhịp nhàng bằng cối đá',
        summary: 'Giã nhịp nhàng tách trấu',
        description: 'Hạt nếp rang xong còn ấm nóng được cho vào cối đá giã đều tay từ 5 đến 7 lượt, xen kẽ với những lần sảy trấu khéo léo.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      },
      {
        step: 4,
        title: 'Gói hai lớp lá sen thơm ngát',
        summary: 'Bảo quản bằng lá ráy và lá sen',
        description: 'Lớp trong dùng lá ráy giữ cốm không bị khô, lớp ngoài gói lá sen già thơm ngát buộc sợi rơm nếp vàng óng ả.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    artisans: [
      {
        name: 'Nghệ nhân Đỗ Thị Hảo',
        title: 'Thế hệ thứ 4 giữ nghề cốm mộc Mễ Trì',
        experience: '35 năm gắn bó bên cối giã cốm truyền thống',
        quote: 'Cốm Mễ Trì giữ trọn màu mộc tự nhiên của hạt lúa non, không pha phẩm nhuộm. Ăn một nhúm cốm tươi là cảm nhận trọn vẹn hồn thu Hà Nội.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
      }
    ],
    featuredProductIds: ['prod-mt-01'],
    featuredTourIds: ['tour-mt-01'],
    virtualHotspots: [
      {
        id: 'hs-mt-01',
        name: 'Cổng làng Cốm Mễ Trì Thượng',
        description: 'Địa điểm trải nghiệm giã cốm mộc và thưởng thức chả cốm, xôi cốm nóng hổi vào mỗi sớm mai.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    bestTimeToVisit: 'Mùa thu từ tháng 8 đến tháng 11 dương lịch',
    openingHours: '06:00 - 20:00',
    ticketPrice: 'Vào làng tự do. Cốm tươi: 20.000đ - 25.000đ/lạng',
    tags: ['Cốm Mễ Trì', 'Ẩm thực mùa thu', 'Di sản quốc gia', 'Nam Từ Liêm', 'Đặc sản Hà Nội']
  }
];

export const CATEGORIES = [
  { id: 'all', name: 'Tất cả làng nghề', icon: 'Sparkles' },
  { id: 'gom-su', name: 'Gốm sứ', icon: 'Flame' },
  { id: 'lua-det', name: 'Lụa & Dệt', icon: 'Feather' },
  { id: 'may-tre-dan', name: 'Mây tre đan', icon: 'Trees' },
  { id: 'non-la', name: 'Nón lá', icon: 'Sun' },
  { id: 'dat-vang', name: 'Dát vàng & Kim hoàn', icon: 'Gem' },
  { id: 'nghe-thuat-dan-gian', name: 'Nghệ thuật dân gian', icon: 'Theater' },
  { id: 'hoa-nong-nghiep', name: 'Hoa & Nông nghiệp', icon: 'Flower2' },
  { id: 'do-choi-dan-gian', name: 'Đồ chơi dân gian', icon: 'Smile' },
  { id: 'huong-thao-moc', name: 'Hương & Thảo mộc', icon: 'Flame' },
  { id: 'son-mai-kham-trai', name: 'Sơn mài & Khảm trai', icon: 'Sparkles' },
  { id: 'dieu-khac-go', name: 'Điêu khắc & Gỗ', icon: 'Trees' },
  { id: 'am-thuc-truyen-thong', name: 'Ẩm thực truyền thống', icon: 'Utensils' },
];

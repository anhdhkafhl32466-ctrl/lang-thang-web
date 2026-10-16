export interface VillageBoundary {
  villageId: string;
  slug: string;
  name: string;
  regionName: string;
  color: string;
  fillColor: string;
  boundary: [number, number][]; // Đã loại bỏ ranh giới polygon giả lập theo yêu cầu, tập trung vào điểm đánh dấu chuẩn xác
}

export const VILLAGE_BOUNDARIES: Record<string, VillageBoundary> = {
  'bat-trang': {
    villageId: 'bat-trang',
    slug: 'bat-trang',
    name: 'Làng gốm Bát Tràng',
    regionName: 'Làng Gốm sứ Bát Tràng (Gia Lâm)',
    color: '#C85A32',
    fillColor: '#C85A32',
    boundary: []
  },
  'kieu-ky': {
    villageId: 'kieu-ky',
    slug: 'kieu-ky',
    name: 'Làng dát vàng quỳ Kiêu Kỵ',
    regionName: 'Làng Dát vàng Kiêu Kỵ (Gia Lâm)',
    color: '#D4A344',
    fillColor: '#D4A344',
    boundary: []
  },
  'van-phuc': {
    villageId: 'van-phuc',
    slug: 'van-phuc',
    name: 'Làng lụa Vạn Phúc',
    regionName: 'Làng Lụa Vạn Phúc (Hà Đông)',
    color: '#E11D48',
    fillColor: '#E11D48',
    boundary: []
  },
  'phu-vinh': {
    villageId: 'phu-vinh',
    slug: 'phu-vinh',
    name: 'Làng mây tre đan Phú Vinh',
    regionName: 'Làng Mây tre đan Phú Vinh (Chương Mỹ)',
    color: '#16A34A',
    fillColor: '#16A34A',
    boundary: []
  },
  'chuong': {
    villageId: 'chuong',
    slug: 'chuong',
    name: 'Làng nón Chuông',
    regionName: 'Làng Nón lá làng Chuông (Thanh Oai)',
    color: '#CA8A04',
    fillColor: '#CA8A04',
    boundary: []
  },
  'dao-thuc': {
    villageId: 'dao-thuc',
    slug: 'dao-thuc',
    name: 'Làng múa rối nước Đào Thục',
    regionName: 'Làng Rối nước Đào Thục (Đông Anh)',
    color: '#0284C7',
    fillColor: '#0284C7',
    boundary: []
  },
  'tay-tuu': {
    villageId: 'tay-tuu',
    slug: 'tay-tuu',
    name: 'Làng hoa Tây Tựu',
    regionName: 'Làng Hoa Tây Tựu (Bắc Từ Liêm)',
    color: '#EC4899',
    fillColor: '#EC4899',
    boundary: []
  },
  'xuan-la': {
    villageId: 'xuan-la',
    slug: 'xuan-la',
    name: 'Làng tò he Xuân La',
    regionName: 'Làng Tò he Xuân La (Phú Xuyên)',
    color: '#8B5CF6',
    fillColor: '#8B5CF6',
    boundary: []
  },
  'quang-phu-cau': {
    villageId: 'quang-phu-cau',
    slug: 'quang-phu-cau',
    name: 'Làng tăm hương Quảng Phú Cầu',
    regionName: 'Làng Hương Quảng Phú Cầu (Ứng Hòa)',
    color: '#DC2626',
    fillColor: '#DC2626',
    boundary: []
  },
  'chuyen-my': {
    villageId: 'chuyen-my',
    slug: 'chuyen-my',
    name: 'Làng khảm trai Chuôn Ngọ (Chuyên Mỹ)',
    regionName: 'Làng Khảm trai Chuôn Ngọ (Phú Xuyên)',
    color: '#0D9488',
    fillColor: '#0D9488',
    boundary: []
  },
  'ha-thai': {
    villageId: 'ha-thai',
    slug: 'ha-thai',
    name: 'Làng sơn mài Hạ Thái',
    regionName: 'Làng Sơn mài Hạ Thái (Thường Tín)',
    color: '#B91C1C',
    fillColor: '#B91C1C',
    boundary: []
  },
  'son-dong': {
    villageId: 'son-dong',
    slug: 'son-dong',
    name: 'Làng nghề mỹ nghệ & tạc tượng Sơn Đồng',
    regionName: 'Làng Tạc tượng Sơn Đồng (Hoài Đức)',
    color: '#78350F',
    fillColor: '#78350F',
    boundary: []
  },
  'trach-xa': {
    villageId: 'trach-xa',
    slug: 'trach-xa',
    name: 'Làng may áo dài Trạch Xá',
    regionName: 'Làng May áo dài Trạch Xá (Ứng Hòa)',
    color: '#BE185D',
    fillColor: '#BE185D',
    boundary: []
  },
  'thach-xa': {
    villageId: 'thach-xa',
    slug: 'thach-xa',
    name: 'Làng chuồn chuồn tre Thạch Xá',
    regionName: 'Làng Chuồn chuồn tre Thạch Xá (Thạch Thất)',
    color: '#059669',
    fillColor: '#059669',
    boundary: []
  },
  'chang-son': {
    villageId: 'chang-son',
    slug: 'chang-son',
    name: 'Làng quạt Chàng Sơn',
    regionName: 'Làng Quạt Chàng Sơn (Thạch Thất)',
    color: '#D97706',
    fillColor: '#D97706',
    boundary: []
  },
  'me-tri': {
    villageId: 'me-tri',
    slug: 'me-tri',
    name: 'Làng cốm Mễ Trì',
    regionName: 'Làng Cốm Mễ Trì (Nam Từ Liêm)',
    color: '#10B981',
    fillColor: '#10B981',
    boundary: []
  }
};

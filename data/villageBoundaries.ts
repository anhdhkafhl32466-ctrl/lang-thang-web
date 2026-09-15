export interface VillageBoundary {
  villageId: string;
  slug: string;
  name: string;
  regionName: string;
  color: string;
  fillColor: string;
  boundary: [number, number][]; // Danh sách các đỉnh tọa độ [lat, lng] khép kín
}

export const VILLAGE_BOUNDARIES: Record<string, VillageBoundary> = {
  'bat-trang': {
    villageId: 'bat-trang',
    slug: 'bat-trang',
    name: 'Làng gốm Bát Tràng',
    regionName: 'Vùng Gốm sứ Bát Tràng (Gia Lâm)',
    color: '#C85A32',
    fillColor: '#C85A32',
    boundary: [
      [20.9950, 105.9020],
      [20.9980, 105.9280],
      [20.9850, 105.9380],
      [20.9620, 105.9280],
      [20.9650, 105.9050],
      [20.9820, 105.8980],
      [20.9950, 105.9020]
    ]
  },
  'kieu-ky': {
    villageId: 'kieu-ky',
    slug: 'kieu-ky',
    name: 'Làng dát vàng quỳ Kiêu Kỵ',
    regionName: 'Vùng Dát vàng Kiêu Kỵ (Gia Lâm)',
    color: '#D4A344',
    fillColor: '#D4A344',
    boundary: [
      [21.0020, 105.9320],
      [21.0080, 105.9620],
      [20.9820, 105.9680],
      [20.9700, 105.9420],
      [20.9850, 105.9320],
      [21.0020, 105.9320]
    ]
  },
  'van-phuc': {
    villageId: 'van-phuc',
    slug: 'van-phuc',
    name: 'Làng lụa Vạn Phúc',
    regionName: 'Vùng Lụa tơ tằm Vạn Phúc (Hà Đông)',
    color: '#E11D48',
    fillColor: '#E11D48',
    boundary: [
      [20.9920, 105.7580],
      [20.9940, 105.7880],
      [20.9680, 105.7920],
      [20.9580, 105.7720],
      [20.9660, 105.7540],
      [20.9920, 105.7580]
    ]
  },
  'phu-vinh': {
    villageId: 'phu-vinh',
    slug: 'phu-vinh',
    name: 'Làng mây tre đan Phú Vinh',
    regionName: 'Vùng Mây tre đan Phú Vinh (Chương Mỹ)',
    color: '#16A34A',
    fillColor: '#16A34A',
    boundary: [
      [20.9120, 105.6580],
      [20.9180, 105.7020],
      [20.8780, 105.7080],
      [20.8720, 105.6680],
      [20.8940, 105.6520],
      [20.9120, 105.6580]
    ]
  },
  'chuong': {
    villageId: 'chuong',
    slug: 'chuong',
    name: 'Làng nón Chuông',
    regionName: 'Vùng Nón lá làng Chuông (Thanh Oai)',
    color: '#CA8A04',
    fillColor: '#CA8A04',
    boundary: [
      [20.8720, 105.7280],
      [20.8780, 105.7680],
      [20.8380, 105.7720],
      [20.8300, 105.7380],
      [20.8440, 105.7220],
      [20.8720, 105.7280]
    ]
  },
  'dao-thuc': {
    villageId: 'dao-thuc',
    slug: 'dao-thuc',
    name: 'Làng múa rối nước Đào Thục',
    regionName: 'Vùng Rối nước Đào Thục (Đông Anh)',
    color: '#0284C7',
    fillColor: '#0284C7',
    boundary: [
      [21.2120, 105.8820],
      [21.2180, 105.9320],
      [21.1720, 105.9380],
      [21.1650, 105.8920],
      [21.1840, 105.8780],
      [21.2120, 105.8820]
    ]
  },
  'tay-tuu': {
    villageId: 'tay-tuu',
    slug: 'tay-tuu',
    name: 'Làng hoa Tây Tựu',
    regionName: 'Vùng Hoa truyền thống Tây Tựu (Bắc Từ Liêm)',
    color: '#9333EA',
    fillColor: '#9333EA',
    boundary: [
      [21.0780, 105.7080],
      [21.0840, 105.7480],
      [21.0420, 105.7540],
      [21.0360, 105.7180],
      [21.0540, 105.7050],
      [21.0780, 105.7080]
    ]
  },
  'xuan-la': {
    villageId: 'xuan-la',
    slug: 'xuan-la',
    name: 'Làng tò he Xuân La',
    regionName: 'Vùng Tò he dân gian Xuân La (Phú Xuyên)',
    color: '#EA580C',
    fillColor: '#EA580C',
    boundary: [
      [20.7520, 105.8020],
      [20.7580, 105.8480],
      [20.7160, 105.8520],
      [20.7100, 105.8120],
      [20.7280, 105.7980],
      [20.7520, 105.8020]
    ]
  },
  'quang-phu-cau': {
    villageId: 'quang-phu-cau',
    slug: 'quang-phu-cau',
    name: 'Làng tăm hương Quảng Phú Cầu',
    regionName: 'Vùng Tăm hương Quảng Phú Cầu (Ứng Hòa)',
    color: '#DC2626',
    fillColor: '#DC2626',
    boundary: [
      [20.7850, 105.7600],
      [20.8050, 105.8020],
      [20.7720, 105.8200],
      [20.7580, 105.7750],
      [20.7850, 105.7600]
    ]
  },
  'chuyen-my': {
    villageId: 'chuyen-my',
    slug: 'chuyen-my',
    name: 'Làng khảm trai Chuôn Ngọ (Chuyên Mỹ)',
    regionName: 'Vùng Khảm trai Chuyên Mỹ (Phú Xuyên)',
    color: '#0D9488',
    fillColor: '#0D9488',
    boundary: [
      [20.7100, 105.8600],
      [20.7250, 105.8950],
      [20.6900, 105.9050],
      [20.6820, 105.8700],
      [20.7100, 105.8600]
    ]
  },
  'ha-thai': {
    villageId: 'ha-thai',
    slug: 'ha-thai',
    name: 'Làng sơn mài Hạ Thái',
    regionName: 'Vùng Sơn mài Hạ Thái (Thường Tín)',
    color: '#B45309',
    fillColor: '#B45309',
    boundary: [
      [20.9150, 105.8450],
      [20.9250, 105.8780],
      [20.8950, 105.8850],
      [20.8880, 105.8500],
      [20.9150, 105.8450]
    ]
  },
  'son-dong': {
    villageId: 'son-dong',
    slug: 'son-dong',
    name: 'Làng tạc tượng & đồ thờ Sơn Đồng',
    regionName: 'Vùng Mỹ nghệ đồ thờ Sơn Đồng (Hoài Đức)',
    color: '#4F46E5',
    fillColor: '#4F46E5',
    boundary: [
      [21.0320, 105.6950],
      [21.0450, 105.7280],
      [21.0150, 105.7350],
      [21.0080, 105.7020],
      [21.0320, 105.6950]
    ]
  },
  'trach-xa': {
    villageId: 'trach-xa',
    slug: 'trach-xa',
    name: 'Làng may áo dài Trạch Xá',
    regionName: 'Vùng May áo dài Trạch Xá (Ứng Hòa)',
    color: '#DB2777',
    fillColor: '#DB2777',
    boundary: [
      [20.7450, 105.7400],
      [20.7600, 105.7720],
      [20.7280, 105.7800],
      [20.7180, 105.7500],
      [20.7450, 105.7400]
    ]
  },
  'thach-xa': {
    villageId: 'thach-xa',
    slug: 'thach-xa',
    name: 'Làng chuồn chuồn tre Thạch Xá',
    regionName: 'Vùng Chuồn chuồn tre Thạch Xá (Thạch Thất)',
    color: '#059669',
    fillColor: '#059669',
    boundary: [
      [21.0250, 105.6050],
      [21.0380, 105.6420],
      [21.0080, 105.6500],
      [20.9980, 105.6150],
      [21.0250, 105.6050]
    ]
  },
  'chang-son': {
    villageId: 'chang-son',
    slug: 'chang-son',
    name: 'Làng quạt & mộc Chàng Sơn',
    regionName: 'Vùng Làm quạt Chàng Sơn (Thạch Thất)',
    color: '#7C3AED',
    fillColor: '#7C3AED',
    boundary: [
      [21.0450, 105.6200],
      [21.0580, 105.6550],
      [21.0280, 105.6650],
      [21.0180, 105.6300],
      [21.0450, 105.6200]
    ]
  },
  'me-tri': {
    villageId: 'me-tri',
    slug: 'me-tri',
    name: 'Làng cốm Mễ Trì',
    regionName: 'Vùng Ẩm thực Cốm Mễ Trì (Nam Từ Liêm)',
    color: '#65A30D',
    fillColor: '#65A30D',
    boundary: [
      [21.0180, 105.7750],
      [21.0280, 105.7950],
      [21.0050, 105.8020],
      [20.9980, 105.7800],
      [21.0180, 105.7750]
    ]
  }
};

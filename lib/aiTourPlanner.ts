import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';
import { VILLAGE_KNOWLEDGE } from '@/lib/craftAiEngine';

export interface TourPlannerInput {
  budget: number; // e.g. 200000, 300000, 500000, 1000000
  duration: 'half-day-morning' | 'half-day-afternoon' | 'full-day';
  preference: 'pottery' | 'food-shopping' | 'craft-hands-on' | 'photo-checkin' | 'combo-all';
  departurePoint?: string; // e.g. 'Hoàn Kiếm / Phố Cổ', 'Cầu Giấy', 'Hà Đông', 'Tây Hồ', 'Trung tâm Hà Nội'
  transportMode?: 'bus' | 'motorbike' | 'train' | 'any';
  userGeminiKey?: string;
}

export interface TourStop {
  time: string;
  title: string;
  activity: string;
  locationName: string;
  costEstimated: number;
  category: 'transit' | 'sightseeing' | 'workshop' | 'dining' | 'shopping' | 'return';
  tips?: string;
  icon?: string;
}

export interface WorkshopPartner {
  id: string;
  villageSlug: string;
  villageName: string;
  name: string;
  artisanName: string;
  artisanTitle?: string;
  address: string;
  hotline: string;
  priceOriginal: number;
  priceDiscounted: number;
  duration: string;
  includes: string[];
  slots: string[];
  image: string;
  badge: string;
}

export interface BudgetCostItem {
  category: string;
  name: string;
  amount: number;
  note: string;
  icon?: string;
}

export interface TourPlanResult {
  id: string;
  title: string;
  villageSlug: string;
  villageName: string;
  durationLabel: string;
  budgetGiven: number;
  totalEstimatedCost: number;
  savingsAmount: number;
  summary: string;
  transitSummary: {
    recommendedMode: 'bus' | 'motorbike' | 'train' | 'car';
    routeName: string;
    travelDuration: string;
    distance: string;
    instruction: string;
    cost: number;
  };
  itinerary: TourStop[];
  costBreakdown: BudgetCostItem[];
  workshop: WorkshopPartner;
  aiAdvice: string;
  tags: string[];
  source: 'gemini-cloud-ai' | 'local-expert-engine';
  modelUsed?: string;
}

export interface WorkshopBookingRecord {
  bookingId: string;
  planId: string;
  villageSlug: string;
  villageName: string;
  workshopName: string;
  artisanName: string;
  address: string;
  hotline: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  selectedDate: string;
  selectedSlot: string;
  guestCount: number;
  totalPrice: number;
  paymentMethod: 'pay-at-workshop' | 'online';
  createdAt: string;
  status: 'confirmed' | 'cancelled';
  notes?: string;
}

// Danh sách các xưởng Workshop đối tác tiêu biểu tại các làng nghề
export const WORKSHOP_PARTNERS: Record<string, WorkshopPartner> = {
  'bat-trang': {
    id: 'ws-bat-trang-hung-thang',
    villageSlug: 'bat-trang',
    villageName: 'Làng Gốm Bát Tràng',
    name: 'Xưởng Gốm Nghệ Nhân Hùng Thắng (Bát Tràng)',
    artisanName: 'Nghệ nhân Phạm Anh Hùng',
    artisanTitle: 'Nghệ nhân Bàn Xoay Làng Nghề Bát Tràng',
    address: 'Số 18, Xóm 3, Thôn Bát Tràng, Gia Lâm, Hà Nội',
    hotline: '0912 345 678',
    priceOriginal: 70000,
    priceDiscounted: 50000,
    duration: '60 - 90 phút',
    includes: [
      'Bàn xoay điện chuyên dụng cho mỗi khách',
      '1.5kg đất sét cao lanh đã lọc tinh mịn',
      'Nghệ nhân cầm tay hướng dẫn kỹ thuật vuốt tạo dáng',
      'Miễn phí dụng cụ gọt giũa và màu vẽ trang trí gốm',
      'Được đóng gói mang sản phẩm mộc về (hoặc tùy chọn nung tráng men giao tận nhà)'
    ],
    slots: ['09:00', '10:30', '14:00', '15:30', '16:30'],
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    badge: 'Xưởng gốm được yêu thích nhất'
  },
  'me-tri': {
    id: 'ws-me-tri-ngo-thu',
    villageSlug: 'me-tri',
    villageName: 'Làng Cốm Mễ Trì',
    name: 'Không Gian Di Sản Cốm Mộc Nghệ Nhân Ngô Thu',
    artisanName: 'Nghệ nhân Ưu tú Ngô Thị Thu',
    artisanTitle: 'Nghệ nhân Di sản Phi vật thể Quốc gia',
    address: 'Số 42, Ngõ 50 phố Mễ Trì Thượng, Nam Từ Liêm, Hà Nội',
    hotline: '0983 234 567',
    priceOriginal: 50000,
    priceDiscounted: 35000,
    duration: '45 - 60 phút',
    includes: [
      'Trải nghiệm giã cốm bằng chày đôi nhịp nhàng trong gian bếp cổ',
      'Thực hành gói cốm tươi bằng 2 lớp lá sen và buộc lạt rơm vàng nếp cái hoa vàng',
      'Thưởng thức trà sen Tây Hồ + cốm mộc tươi dẻo thơm tại chỗ',
      'Tặng 01 gói cốm mộc lá sen xinh xắn mang về'
    ],
    slots: ['08:30', '09:45', '14:30', '16:00'],
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    badge: 'Di sản Ẩm thực Quốc gia'
  },
  'van-phuc': {
    id: 'ws-van-phuc-khang-kien',
    villageSlug: 'van-phuc',
    villageName: 'Làng Lụa Vạn Phúc',
    name: 'Xưởng Dệt Khung Cửi Cổ Khang Kiên Vạn Phúc',
    artisanName: 'Nghệ nhân Đỗ Văn Khang',
    artisanTitle: 'Nghệ nhân Dệt Gấm Lụa Hà Đông',
    address: 'Dãy 1, Phố Lụa Vạn Phúc, Quận Hà Đông, Hà Nội',
    hotline: '0904 567 890',
    priceOriginal: 60000,
    priceDiscounted: 40000,
    duration: '60 phút',
    includes: [
      'Trải nghiệm trực tiếp đạp khung cửi gỗ và đưa thoi dệt lụa gấm hoa',
      'Học bí quyết soi sợi tơ tằm thật không bao giờ bị nhầm lẫn với sợi pha nhân tạo',
      'Chụp ảnh cùng con đường ô sắc màu và giàn tơ óng ả',
      'Tặng 01 túi thơm lụa tơ tằm may thủ công'
    ],
    slots: ['09:00', '10:30', '14:00', '15:30'],
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    badge: 'Di sản Canh cửi Ngàn năm'
  },
  'quang-phu-cau': {
    id: 'ws-quang-phu-cau-long-huong',
    villageSlug: 'quang-phu-cau',
    villageName: 'Làng Hương Quảng Phú Cầu',
    name: 'Xưởng Hương Thảo Mộc & Sân Phơi Nghệ Thuật Cầu Bầu',
    artisanName: 'Nghệ nhân Nguyễn Văn Long',
    artisanTitle: 'Chuyên gia Làm Hương Trầm & Nghệ thuật Sắp đặt Sân phơi',
    address: 'Thôn Cầu Bầu, Xã Quảng Phú Cầu, Huyện Ứng Hòa, Hà Nội',
    hotline: '0978 123 456',
    priceOriginal: 60000,
    priceDiscounted: 45000,
    duration: '60 - 90 phút',
    includes: [
      'Vé vào cửa toàn bộ không gian sân phơi hương nghệ thuật đa giác',
      'Trải nghiệm tự tay xòe bó chân hương hình hoa sen và đóa cúc đại đóa',
      'Học cách se bột hương trầm thảo mộc tự nhiên thơm thanh tịnh',
      'Hỗ trợ thang đứng và góc chụp ảnh sống ảo triệu view từ trên cao',
      'Tặng 01 bó nén hương trầm quế mang về'
    ],
    slots: ['08:30', '10:00', '13:30', '15:00'],
    image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    badge: 'Tọa độ Check-in Quốc tế'
  },
  'thach-xa': {
    id: 'ws-thach-xa-cu-xoan',
    villageSlug: 'thach-xa',
    villageName: 'Làng Chuồn Chuồn Tre Thạch Xá',
    name: 'Không Gian Sáng Tạo Chuồn Chuồn Tre Cụ Xoan',
    artisanName: 'Nghệ nhân Nguyễn Văn Tái',
    artisanTitle: 'Nghệ nhân Đồ chơi Dân gian Thăng Long',
    address: 'Chân núi Chùa Tây Phương, Xã Thạch Xá, Thạch Thất, Hà Nội',
    hotline: '0965 432 198',
    priceOriginal: 45000,
    priceDiscounted: 30000,
    duration: '45 - 60 phút',
    includes: [
      'Tìm hiểu nguyên lý vật lý đối trọng giúp chuồn chuồn tre giữ thăng bằng kỳ diệu',
      'Tự tay vót mỏ tre, uốn cánh và cân bằng trọng tâm',
      'Vẽ màu sơn mài, chấm bi trang trí hoa sen lên thân chuồn chuồn',
      'Tặng 02 chú chuồn chuồn tre hoàn thiện mang về làm quà'
    ],
    slots: ['09:00', '10:30', '14:00', '15:30'],
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    badge: 'Đồ chơi Dân gian Độc bản'
  },
  'chuong': {
    id: 'ws-non-chuong-ta-huong',
    villageSlug: 'chuong',
    villageName: 'Làng Nón Chuông',
    name: 'Không Gian Văn Hóa Nón Lá Nghệ Nhân Tạ Thu Hương',
    artisanName: 'Nghệ nhân Tạ Thu Hương',
    artisanTitle: 'Nghệ nhân Ưu tú Nón Lá Bài Thơ',
    address: 'Đội 3, Làng Chuông, Xã Phương Trung, Huyện Thanh Oai, Hà Nội',
    hotline: '0972 345 612',
    priceOriginal: 60000,
    priceDiscounted: 45000,
    duration: '60 - 75 phút',
    includes: [
      'Xem nghệ nhân ủi lá cọ phẳng phiu trên lưỡi cày nung đỏ',
      'Tự tay xếp nan tre và khâu từng mũi cước giấu chỉ trên vành nón',
      'Lồng câu thơ hoặc bông hoa sen vào giữa 2 lớp lá bài thơ',
      'Tặng chiếc nón lá lưu niệm thêu hoa văn'
    ],
    slots: ['09:00', '10:30', '14:00', '15:30'],
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    badge: 'Biểu tượng Duyên dáng Việt Nam'
  }
};

/**
 * Thuật toán chọn làng nghề tối ưu dựa trên Ngân sách, Thời lượng & Sở thích
 */
function chooseOptimalVillage(input: TourPlannerInput): string {
  const { preference, duration, budget } = input;

  // 1. Sở thích cụ thể
  if (preference === 'pottery') {
    return 'bat-trang';
  }

  if (preference === 'photo-checkin') {
    // Nếu ngân sách lớn hoặc 1 ngày -> Quảng Phú Cầu
    if (duration === 'full-day' || budget >= 300000) {
      return 'quang-phu-cau';
    }
    return 'bat-trang';
  }

  if (preference === 'food-shopping') {
    // Nửa ngày và ngân sách vừa -> Cốm Mễ Trì (gần, ăn ngon) hoặc Vạn Phúc (lụa, mua sắm)
    if (duration === 'half-day-morning' || duration === 'half-day-afternoon') {
      return budget < 350000 ? 'me-tri' : 'van-phuc';
    }
    // 1 ngày trọn vẹn
    return 'bat-trang';
  }

  if (preference === 'craft-hands-on') {
    if (budget < 250000) {
      return 'thach-xa'; // Chi phí hạt dẻ, workshop rất rẻ
    }
    if (duration === 'half-day-morning' || duration === 'half-day-afternoon') {
      return 'bat-trang';
    }
    return 'chuong';
  }

  // preference === 'combo-all' (Kết hợp tất cả)
  if (duration === 'full-day') {
    return 'bat-trang';
  }
  return budget > 300000 ? 'bat-trang' : 'me-tri';
}

/**
 * Sinh lộ trình di chuyển tối ưu và timeline chi tiết
 */
function buildItineraryAndTransit(
  villageSlug: string,
  duration: TourPlannerInput['duration'],
  preference: TourPlannerInput['preference'],
  budget: number,
  workshop: WorkshopPartner,
  departurePoint = 'Trung tâm Hà Nội'
) {
  const vk = VILLAGE_KNOWLEDGE[villageSlug] || VILLAGE_KNOWLEDGE['bat-trang'];
  const isMorning = duration === 'half-day-morning';
  const isAfternoon = duration === 'half-day-afternoon';
  const isFullDay = duration === 'full-day';

  // Phương tiện & Lộ trình di chuyển
  let transitMode: 'bus' | 'motorbike' | 'train' | 'car' = 'bus';
  let routeName = 'Xe buýt công cộng';
  let transitCost = 16000; // vé khứ hồi
  let transitInstruction = `Bắt xe buýt từ trung tâm đến ${vk.name}. ${vk.busRoutes}`;

  if (villageSlug === 'van-phuc') {
    transitMode = 'train';
    routeName = 'Tàu điện trên cao Cát Linh - Hà Đông (Ga Vạn Phúc)';
    transitCost = 30000;
    transitInstruction = `Đi tàu điện trên cao Cát Linh - Hà Đông xuống ga Vạn Phúc (chỉ 15 phút, ngắm phố phường từ trên cao), sau đó đi bộ 300m vào phố lụa.`;
  } else if (villageSlug === 'bat-trang') {
    transitMode = 'bus';
    routeName = 'Xe buýt 47A (Long Biên - Bát Tràng)';
    transitCost = 16000;
    transitInstruction = `Bắt xe buýt tuyến 47A tại điểm trung chuyển Long Biên hoặc đê Nguyễn Khoái (15 phút/chuyến, 8.000đ/lượt). Xuống ngay cổng chợ gốm Bát Tràng.`;
  } else if (villageSlug === 'me-tri') {
    transitMode = 'bus';
    routeName = 'Xe buýt 33, 50, 74 hoặc xe máy';
    transitCost = 16000;
    transitInstruction = `Di chuyển cực gần (chỉ 8km). Bắt xe buýt 33, 50 hoặc 74 xuống trạm Đỗ Đức Dục/Mễ Trì Thượng; hoặc đi xe máy đường Cầu Giấy rẽ vào.`;
  } else if (villageSlug === 'quang-phu-cau') {
    transitMode = 'bus';
    routeName = 'Xe buýt 91 (Bến xe Yên Nghĩa - Quảng Phú Cầu)';
    transitCost = 18000;
    transitInstruction = `Đi tuyến buýt 91 từ Bến xe Yên Nghĩa (có thể kết nối bằng tàu điện Cát Linh) đến thẳng ngã ba Cầu Bầu - Làng hương Quảng Phú Cầu.`;
  }

  // Xây dựng Timeline
  const stops: TourStop[] = [];

  if (isMorning) {
    // 08:00 - 12:30
    stops.push({
      time: '08:00 - 08:45',
      title: `Khởi hành từ ${departurePoint}`,
      activity: transitInstruction,
      locationName: departurePoint,
      costEstimated: transitCost / 2,
      category: 'transit',
      icon: '🚌',
      tips: 'Nên khởi hành sớm để tận hưởng không khí trong lành ven sông và ánh nắng ban mai.'
    });

    stops.push({
      time: '08:45 - 09:30',
      title: `Check-in cổng làng & Khám phá không gian cổ`,
      activity: `Dạo bước qua cổng làng rêu phong, chiêm ngưỡng kiến trúc đặc trưng và chụp những bức ảnh kỷ niệm đầu tiên.`,
      locationName: vk.name,
      costEstimated: 0,
      category: 'sightseeing',
      icon: '🏛️',
      tips: `Điểm check-in đẹp nhất: ${vk.photoSpots[0] || 'Cổng đình làng và ngõ cổ rêu phong'}.`
    });

    stops.push({
      time: '09:30 - 11:00',
      title: `Workshop thực hành: ${workshop.name}`,
      activity: `Trải nghiệm ngồi cùng nghệ nhân: ${workshop.includes.slice(0, 3).join(', ')}. Tự tay sáng tạo tác phẩm mang dấu ấn cá nhân.`,
      locationName: workshop.address,
      costEstimated: workshop.priceDiscounted,
      category: 'workshop',
      icon: '🏺',
      tips: 'Đã được đặt trước chỗ ưu tiên qua website, không cần xếp hàng đợi lượt.'
    });

    const sigFood = vk.signatureFoods[0] || { name: 'Món ngon địa phương', price: '40.000đ' };
    const foodCost = Math.min(Math.max(40000, Math.floor(budget * 0.3)), 120000);
    stops.push({
      time: '11:00 - 12:15',
      title: `Thưởng thức ẩm thực: ${sigFood.name}`,
      activity: `Nghỉ chân tại quán truyền thống, thưởng thức ${sigFood.name} (${sigFood.desc}) và nhâm nhi tách chè tươi.`,
      locationName: `Khu ẩm thực ${vk.name}`,
      costEstimated: foodCost,
      category: 'dining',
      icon: '🍜',
      tips: 'Hỏi người dân quán gia truyền lâu đời nhất để thưởng thức đúng vị cội nguồn.'
    });

    stops.push({
      time: '12:15 - 12:45',
      title: `Trở về trung tâm & Kết thúc tour`,
      activity: `Lên phương tiện trở về trung tâm Hà Nội với tác phẩm tự tay làm và đặc sản mang về.`,
      locationName: departurePoint,
      costEstimated: transitCost / 2,
      category: 'return',
      icon: '🏠'
    });
  } else if (isAfternoon) {
    // 13:30 - 18:00
    stops.push({
      time: '13:30 - 14:15',
      title: `Khởi hành từ ${departurePoint}`,
      activity: transitInstruction,
      locationName: departurePoint,
      costEstimated: transitCost / 2,
      category: 'transit',
      icon: '🚌'
    });

    stops.push({
      time: '14:15 - 15:45',
      title: `Workshop thực hành tại ${workshop.name}`,
      activity: `Nghệ nhân đón tiếp và trực tiếp hướng dẫn: ${workshop.includes.slice(0, 3).join(', ')}.`,
      locationName: workshop.address,
      costEstimated: workshop.priceDiscounted,
      category: 'workshop',
      icon: '🏺',
      tips: 'Khung giờ chiều ánh sáng tự nhiên qua cửa sổ xưởng rất đẹp để chụp ảnh lưu niệm.'
    });

    stops.push({
      time: '15:45 - 16:45',
      title: `Dạo chợ làng nghề & Mua sắm quà lưu niệm`,
      activity: `Khám phá các gian hàng thủ công, chọn những món quà tinh xảo tặng người thân và bạn bè.`,
      locationName: `Chợ nghề ${vk.name}`,
      costEstimated: Math.min(Math.floor(budget * 0.25), 80000),
      category: 'shopping',
      icon: '🛍️'
    });

    const sigFood = vk.signatureFoods[0] || { name: 'Món ăn vặt đặc sản', price: '30.000đ' };
    stops.push({
      time: '16:45 - 17:30',
      title: `Thưởng trà chiều & Đặc sản ${sigFood.name}`,
      activity: `Thưởng thức ${sigFood.name} và ngắm hoàng hôn buông xuống làng nghề thanh bình.`,
      locationName: `Quán trà ven sông/đình làng`,
      costEstimated: Math.min(Math.floor(budget * 0.2), 60000),
      category: 'dining',
      icon: '🍵'
    });

    stops.push({
      time: '17:30 - 18:15',
      title: `Trở về trung tâm`,
      activity: `Đón chuyến xe trở về thành phố trong ánh đèn hoàng hôn.`,
      locationName: departurePoint,
      costEstimated: transitCost / 2,
      category: 'return',
      icon: '🏠'
    });
  } else {
    // 1 ngày trọn vẹn (08:00 - 17:30)
    stops.push({
      time: '08:00 - 08:45',
      title: `Khởi hành từ ${departurePoint}`,
      activity: transitInstruction,
      locationName: departurePoint,
      costEstimated: transitCost / 2,
      category: 'transit',
      icon: '🚌'
    });

    stops.push({
      time: '08:45 - 10:00',
      title: `Tham quan di tích, bảo tàng & Ngõ cổ rêu phong`,
      activity: `Tham quan các điểm nhấn văn hóa: ${vk.topHighlights[0] || 'Đình làng cổ'}. Khám phá không gian làng nghề ngàn năm.`,
      locationName: vk.name,
      costEstimated: villageSlug === 'bat-trang' ? 50000 : 0,
      category: 'sightseeing',
      icon: '🏛️',
      tips: `Vé bảo tàng gốm Bát Tràng là 50.000đ/người lớn với kiến trúc 7 cánh xoắn ốc tuyệt mỹ.`
    });

    stops.push({
      time: '10:00 - 11:45',
      title: `Workshop thực hành: ${workshop.name}`,
      activity: `Trải nghiệm trọn vẹn tại xưởng nghệ nhân: ${workshop.includes.join('. ')}.`,
      locationName: workshop.address,
      costEstimated: workshop.priceDiscounted,
      category: 'workshop',
      icon: '🏺',
      tips: 'Đã giữ chỗ trước giờ cao điểm, có bàn thực hành riêng biệt.'
    });

    const sigFood = vk.signatureFoods[0] || { name: 'Bữa trưa ẩm thực truyền thống', price: '90.000đ' };
    const lunchCost = Math.min(Math.max(60000, Math.floor(budget * 0.3)), 160000);
    stops.push({
      time: '11:45 - 13:30',
      title: `Bữa trưa đặc sản: ${sigFood.name}`,
      activity: `Thưởng thức bữa cỗ làng nghề: ${vk.signatureFoods.map(f => f.name).slice(0, 3).join(', ')}. Nghỉ ngơi trưa tại không gian quán gỗ cổ mát mẻ.`,
      locationName: `Nhà hàng đặc sản ${vk.name}`,
      costEstimated: lunchCost,
      category: 'dining',
      icon: '🍲'
    });

    stops.push({
      time: '13:30 - 15:30',
      title: `Săn ảnh nghệ thuật & Khám phá chiều sâu di sản`,
      activity: `Tản bộ săn ảnh tại các góc triệu view: ${vk.photoSpots.join(', ')}. Gặp gỡ các bậc cao niên nghe kể chuyện nguồn cội làng nghề.`,
      locationName: `Các ngõ cổ & Sân phơi`,
      costEstimated: 0,
      category: 'sightseeing',
      icon: '📸'
    });

    const shoppingCost = Math.min(Math.max(30000, Math.floor(budget * 0.2)), 120000);
    stops.push({
      time: '15:30 - 16:45',
      title: `Dạo chợ nghề, mua sắm quà lưu niệm & Thưởng trà`,
      activity: `Tự tay chọn ấm chén, khăn lụa hoặc bánh trái đặc sản làm quà cho gia đình.`,
      locationName: `Chợ thủ công`,
      costEstimated: shoppingCost,
      category: 'shopping',
      icon: '🛍️'
    });

    stops.push({
      time: '16:45 - 17:30',
      title: `Lên đường trở về trung tâm`,
      activity: `Khép lại 1 ngày trải nghiệm trọn vẹn đầy ắp cảm xúc và kỷ niệm đẹp.`,
      locationName: departurePoint,
      costEstimated: transitCost / 2,
      category: 'return',
      icon: '🏠'
    });
  }

  // Tính toán bảng chi phí chi tiết sao cho khớp ngân sách
  const costBreakdown: BudgetCostItem[] = [];

  // 1. Di chuyển
  costBreakdown.push({
    category: 'Di chuyển',
    name: routeName,
    amount: transitCost,
    note: 'Vé khứ hồi 2 chiều an toàn, tiết kiệm',
    icon: '🚌'
  });

  // 2. Workshop
  costBreakdown.push({
    category: 'Workshop & Tự tay làm nghề',
    name: workshop.name,
    amount: workshop.priceDiscounted,
    note: `Giá ưu đãi độc quyền đặt trước qua AI (tiết kiệm ${(workshop.priceOriginal - workshop.priceDiscounted).toLocaleString('vi-VN')}đ)`,
    icon: '🏺'
  });

  // 3. Vé tham quan (nếu có)
  const museumCost = stops.find(s => s.category === 'sightseeing' && s.costEstimated > 0)?.costEstimated || 0;
  if (museumCost > 0) {
    costBreakdown.push({
      category: 'Vé tham quan',
      name: `Vé Bảo tàng / Không gian di sản`,
      amount: museumCost,
      note: 'Tham quan kiến trúc di sản',
      icon: '🎟️'
    });
  }

  // 4. Ẩm thực
  const diningTotal = stops
    .filter(s => s.category === 'dining')
    .reduce((sum, s) => sum + s.costEstimated, 0);
  costBreakdown.push({
    category: 'Ẩm thực & Thưởng thức đặc sản',
    name: `${vk.signatureFoods[0]?.name || 'Ẩm thực làng nghề'} + Đồ uống`,
    amount: diningTotal,
    note: 'Thưởng thức tại quán gia truyền chất lượng',
    icon: '🍜'
  });

  // 5. Mua sắm & Quà lưu niệm
  const shoppingTotal = stops
    .filter(s => s.category === 'shopping')
    .reduce((sum, s) => sum + s.costEstimated, 0);
  if (shoppingTotal > 0) {
    costBreakdown.push({
      category: 'Quà lưu niệm & Mua sắm',
      name: 'Sản phẩm thủ công độc bản mang về',
      amount: shoppingTotal,
      note: 'Ủng hộ trực tiếp nghệ nhân làng nghề',
      icon: '🎁'
    });
  }

  // 6. Dự phòng phát sinh
  const subtotal = costBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = budget - subtotal;
  let contingencyAmount = 0;

  if (remainingBudget > 20000) {
    contingencyAmount = Math.min(remainingBudget, 30000);
    costBreakdown.push({
      category: 'Dự phòng linh hoạt',
      name: 'Quỹ nước uống & gửi xe phát sinh',
      amount: contingencyAmount,
      note: 'Khoản chi dự phòng giúp bạn hoàn toàn an tâm',
      icon: '🛡️'
    });
  }

  const finalTotal = costBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const savings = Math.max(0, budget - finalTotal);

  return {
    transitSummary: {
      recommendedMode: transitMode,
      routeName,
      travelDuration: vk.travelTime,
      distance: `${vk.distanceKm} km từ trung tâm`,
      instruction: transitInstruction,
      cost: transitCost
    },
    itinerary: stops,
    costBreakdown,
    totalEstimatedCost: finalTotal,
    savingsAmount: savings
  };
}

/**
 * Sinh Tour 1-Chạm hoàn chỉnh với hỗ trợ Gemini AI Cloud và Local Fallback
 */
export async function generateOneTouchTourPlan(
  input: TourPlannerInput
): Promise<TourPlanResult> {
  const targetSlug = chooseOptimalVillage(input);
  const vk = VILLAGE_KNOWLEDGE[targetSlug] || VILLAGE_KNOWLEDGE['bat-trang'];
  const workshop = WORKSHOP_PARTNERS[targetSlug] || WORKSHOP_PARTNERS['bat-trang'];

  const {
    transitSummary,
    itinerary,
    costBreakdown,
    totalEstimatedCost,
    savingsAmount
  } = buildItineraryAndTransit(
    targetSlug,
    input.duration,
    input.preference,
    input.budget,
    workshop,
    input.departurePoint
  );

  const durationText =
    input.duration === 'half-day-morning'
      ? 'Nửa ngày (Sáng: 08:00 - 12:30)'
      : input.duration === 'half-day-afternoon'
        ? 'Nửa ngày (Chiều: 13:30 - 18:00)'
        : '1 Ngày trọn vẹn (08:00 - 17:30)';

  // Tiêu đề & Tóm tắt mặc định
  let tourTitle = `Tour 1-Chạm ${vk.name}: Tinh Hoa Nghề Cổ & Trải Nghiệm Độc Bản`;
  let tourSummary = `Hành trình được tối ưu hóa riêng cho ngân sách ${input.budget.toLocaleString('vi-VN')}đ và thời lượng ${durationText.toLowerCase()}. Bạn sẽ được đón tiếp tại ${workshop.name}, tự tay sáng tạo tác phẩm và thưởng thức đặc sản nức danh ${vk.signatureFoods[0]?.name}.`;
  let aiAdvice = `• Thời điểm lý tưởng: Đến trước 09:00 sáng hoặc sau 14:00 chiều để tránh đông và đón ánh sáng tự nhiên đẹp nhất.\n• Mẹo trang phục: Mang giày đế bằng êm chân để tản bộ quanh các ngõ cổ.\n• Nhắn gửi nghệ nhân: Xưởng đã được thông báo lịch hẹn của bạn, đất sét và nguyên liệu sẵn sàng khi bạn tới.`;
  let source: TourPlanResult['source'] = 'local-expert-engine';
  let modelUsed = 'Offline Expert Engine';

  // Thử kết nối Gemini AI để làm tour thêm phần bay bổng, sâu sắc và cá nhân hóa
  const geminiKey = input.userGeminiKey || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const prompt = `Bạn là Trợ lý AI Du lịch Làng nghề Thăng Long Hà Nội.
Hãy tạo lời dẫn nhập quyến rũ và lời khuyên chuyên gia cho một Tour 1-Chạm với các thông tin sau:
- Điểm đến: ${vk.name} (Quận/Huyện: ${vk.district}, Cự ly: ${vk.distanceKm}km)
- Ngân sách: ${input.budget.toLocaleString('vi-VN')} VNĐ
- Thời gian: ${durationText}
- Sở thích chính: ${input.preference}
- Workshop: ${workshop.name} do ${workshop.artisanName} phụ trách
- Món ăn đặc sản: ${vk.signatureFoods.map(f => f.name).join(', ')}

Hãy trả về định dạng JSON thuần túy (không bọc trong markdown code block thừa, hoặc bọc trong \`\`\`json) với đúng cấu trúc:
{
  "title": "Tiêu đề tour cực kỳ cuốn hút, đậm chất thơ văn hóa (khoảng 10-15 từ)",
  "summary": "Đoạn văn giới thiệu ngắn gọn, truyền cảm hứng về hành trình này (2-3 câu)",
  "aiAdvice": "3 lời khuyên sành điệu, độc đáo từ AI về góc chụp ảnh, món ăn gia truyền và mẹo giao lưu cùng nghệ nhân"
}`;

      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
      for (const m of candidateModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
              })
            }
          );

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleanJsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJsonStr);
              if (parsed.title) tourTitle = parsed.title;
              if (parsed.summary) tourSummary = parsed.summary;
              if (parsed.aiAdvice) aiAdvice = parsed.aiAdvice;
              source = 'gemini-cloud-ai';
              modelUsed = m;
              break;
            }
          }
        } catch {
          // Thử model tiếp theo
        }
      }
    } catch {
      // Giữ fallback local engine
    }
  }

  return {
    id: `tour-${targetSlug}-${Date.now()}`,
    title: tourTitle,
    villageSlug: targetSlug,
    villageName: vk.name,
    durationLabel: durationText,
    budgetGiven: input.budget,
    totalEstimatedCost,
    savingsAmount,
    summary: tourSummary,
    transitSummary,
    itinerary,
    costBreakdown,
    workshop,
    aiAdvice,
    tags: [
      `Ngân sách ~${Math.round(totalEstimatedCost / 1000)}k`,
      durationText.split('(')[0].trim(),
      workshop.badge,
      `Xe buýt ${transitSummary.recommendedMode === 'train' ? 'Tàu điện' : 'tiết kiệm'}`
    ],
    source,
    modelUsed
  };
}

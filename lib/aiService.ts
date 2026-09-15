import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';

export interface QuizAnswers {
  interests: string[];      // 'thủ công', 'chụp ảnh', 'lịch sử', 'ẩm thực', 'tự tay làm', 'mua sắm'
  tripStyle: string;        // 'gia đình', 'bạn bè', 'cặp đôi', 'một mình', 'thư giãn'
  timeAvailable: string;    // '2-3h', 'nửa ngày', '1 ngày', 'cuối tuần'
  priority: string;         // 'trải nghiệm làm nghề', 'check-in sống ảo', 'tìm hiểu văn hóa', 'mua quà lưu niệm'
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
}

export function generateRecommendations(answers: QuizAnswers): RecommendationResult[] {
  const scoredVillages = CRAFT_VILLAGES.map(village => {
    let score = 65; // Base score

    // Interest matching
    const villageTagsLower = village.tags.map(t => t.toLowerCase());
    const categoryLower = village.category.toLowerCase();

    if (answers.interests.includes('thủ công') && (categoryLower.includes('gốm') || categoryLower.includes('mây') || categoryLower.includes('nón'))) {
      score += 15;
    }
    if (answers.interests.includes('tự tay làm') && village.gameUrl) {
      score += 18;
    }
    if (answers.interests.includes('chụp ảnh') && (village.slug === 'van-phuc' || village.slug === 'chuong' || village.slug === 'tay-tuu' || village.slug === 'bat-trang')) {
      score += 16;
    }
    if (answers.interests.includes('lịch sử') && (village.history.originPeriod.includes('1.000') || village.slug === 'bat-trang' || village.slug === 'kieu-ky')) {
      score += 14;
    }

    // Trip style matching
    if (answers.tripStyle === 'gia đình') {
      if (village.slug === 'dao-thuc' || village.slug === 'xuan-la' || village.slug === 'bat-trang') {
        score += 15;
      }
    }
    if (answers.tripStyle === 'bạn bè' || answers.tripStyle === 'cặp đôi') {
      if (village.slug === 'van-phuc' || village.slug === 'bat-trang' || village.slug === 'tay-tuu') {
        score += 12;
      }
    }

    // Time available matching
    if (answers.timeAvailable === '2-3h') {
      if (village.slug === 'van-phuc' || village.slug === 'tay-tuu') {
        score += 15;
      } else if (village.slug === 'xuan-la') {
        score -= 10; // farther away
      }
    } else if (answers.timeAvailable === '1 ngày' || answers.timeAvailable === 'cuối tuần') {
      if (village.slug === 'chuong' || village.slug === 'phu-vinh' || village.slug === 'dao-thuc') {
        score += 14;
      }
    }

    // Priority matching
    if (answers.priority === 'trải nghiệm làm nghề' && (village.slug === 'bat-trang' || village.slug === 'chuong' || village.slug === 'phu-vinh')) {
      score += 15;
    }
    if (answers.priority === 'mua quà lưu niệm' && (village.slug === 'bat-trang' || village.slug === 'van-phuc' || village.slug === 'phu-vinh')) {
      score += 12;
    }

    // Cap between 75 and 98
    const finalScore = Math.min(98, Math.max(75, score));

    // Reasons based on village
    const reasons: string[] = [];
    if (village.slug === 'bat-trang') {
      reasons.push('Có xưởng gốm và bàn xoay thực tế cực kỳ phù hợp sở thích tự tay làm.');
      reasons.push('Bảo tàng Gốm kiến trúc 7 cánh xoáy ốc là điểm check-in nghệ thuật hàng đầu Thủ đô.');
      reasons.push('Vị trí gần trung tâm (chỉ 30 phút), tiện đi xe buýt 47A hoặc xe cá nhân.');
    } else if (village.slug === 'van-phuc') {
      reasons.push('Rất gần trung tâm, có thể đi bằng tàu điện trên cao Cát Linh - Hà Đông chỉ 15 phút.');
      reasons.push('Phố đi bộ ô dù sắc màu rực rỡ và các xưởng dệt lụa mát rượi quanh năm.');
      reasons.push('Thích hợp chụp ảnh áo dài và mua sắm quà tặng lụa tơ tằm thanh tao.');
    } else if (village.slug === 'chuong') {
      reasons.push('Không gian làng quê Bắc Bộ ven đê sông Đáy còn nguyên sơ, yên ả.');
      reasons.push('Trải nghiệm chợ phiên rạng đông và tự tay khâu chiếc nón bài thơ mang về.');
    } else if (village.slug === 'dao-thuc') {
      reasons.push('Cực kỳ lý tưởng cho gia đình có trẻ em thưởng thức múa rối nước dân gian độc bản.');
      reasons.push('Cơ hội hiếm có để lội nước sau cánh gà thủy đình cùng các nghệ nhân nông dân.');
    } else if (village.slug === 'phu-vinh') {
      reasons.push('Thế giới mây tre đan tinh mỹ đạt tiêu chuẩn xuất khẩu châu Âu, đậm chất sống xanh.');
      reasons.push('Trải nghiệm workshop đan giỏ và ngắm các bức tranh mây độc nhất vô nhị.');
    } else {
      reasons.push(`Phù hợp với mong muốn khám phá văn hóa ${village.category.toLowerCase()} đích thực.`);
      reasons.push('Gặp gỡ những nghệ nhân gìn giữ bí thuật làng nghề qua nhiều thế kỷ.');
    }

    // Suggested itinerary
    const itinerary = [
      { time: '08:30 - 09:30', action: `Di chuyển đến ${village.name}, dạo bước ngắm cổng làng và không gian cổ kính.` },
      { time: '09:30 - 11:30', action: `Tham quan xưởng nghệ nhân tiêu biểu, xem quy trình ${village.process[1]?.title.toLowerCase() || 'làm nghề'}.` },
      { time: '11:30 - 13:00', action: 'Thưởng thức ẩm thực dân dã địa phương và nghỉ ngơi thưởng trà.' },
      { time: '13:00 - 15:00', action: `Tham gia workshop tự tay trải nghiệm hoặc chọn mua sản phẩm lưu niệm OCOP.` }
    ];

    const foodTips: string[] = [];
    if (village.slug === 'bat-trang') {
      foodTips.push('Canh măng mực Bát Tràng (món cỗ tiến vua danh tiếng)');
      foodTips.push('Chè củ mài và bánh chè lam cổ truyền');
      foodTips.push('Trà sen ướp cánh tươi ven bãi bồi');
    } else if (village.slug === 'van-phuc') {
      foodTips.push('Bún chả Hà Đông và bánh cuốn nóng');
      foodTips.push('Chè sen long nhãn bọc hạt sen');
    } else if (village.slug === 'chuong') {
      foodTips.push('Bánh đúc nóng chấm tương nếp làng Chuông');
      foodTips.push('Gà thả đồi nướng đất sét bên sông Đáy');
    } else {
      foodTips.push('Cơm quê dân dã rau bến bãi, cá om dưa đồng');
      foodTips.push('Bánh tẻ nếp lá dong nóng hổi');
    }

    return {
      village,
      matchScore: finalScore,
      reasons,
      suggestedActivities: village.tags.map(t => `Trải nghiệm ${t.toLowerCase()}`),
      itinerary,
      foodTips,
      travelTip: `Nên khởi hành vào sáng sớm khoảng 08:00 để tận hưởng không khí trong lành của làng quê.`
    };
  });

  return scoredVillages.sort((a, b) => b.matchScore - a.matchScore);
}

export async function askCraftAssistant(userQuery: string): Promise<string> {
  const query = userQuery.toLowerCase().trim();

  // Smart heuristic responses based on domain knowledge
  if (query.includes('gia đình') || query.includes('trẻ em') || query.includes('con nít')) {
    return `Nếu đi cùng gia đình có trẻ em, tôi khuyên bạn nên chọn:
1. **Làng múa rối nước Đào Thục (Đông Anh):** Trẻ em cực kỳ hào hứng khi xem chú Tễu phun nước và được lội buồng trò thử điều khiển con rối.
2. **Làng gốm Bát Tràng (Gia Lâm):** Cả nhà cùng ngồi nắn đất sét trên bàn xoay, tự vẽ màu lên cốc chén rồi mang về nung làm kỷ niệm.
3. **Làng tò he Xuân La (Phú Xuyên):** Các bé được tự tay nặn siêu nhân, công chúa từ bột nếp thơm ngát hoàn toàn an toàn.`;
  }

  if (query.includes('cuối tuần') || query.includes('1 ngày')) {
    return `Cho chuyến đi cuối tuần trọn vẹn 1 ngày:
- **Lựa chọn 1 (Gần & Hiện đại):** Buổi sáng đi Bát Tràng check-in Bảo tàng Gốm 7 cánh xoáy ốc, ăn canh măng mực. Buổi chiều về ghé làng dát vàng Kiêu Kỵ ngay gần đó.
- **Lựa chọn 2 (Thơ mộng & Nhẹ nhàng):** Đi tàu điện Cát Linh đến làng lụa Vạn Phúc (Hà Đông), chụp ảnh phố ô dù, thử ngồi dệt lụa và thưởng thức cà phê ven sông Nhuệ.
- **Lựa chọn 3 (Làng quê Bắc Bộ):** Xuống làng nón Chuông săn chợ phiên sớm, sau đó tạt qua làng mây tre đan Phú Vinh ngắm tranh mây tinh xảo.`;
  }

  if (query.includes('500') || query.includes('tiền') || query.includes('ngân sách') || query.includes('giá') || query.includes('chi phí')) {
    return `Với ngân sách khoảng **300.000đ - 500.000đ/người**, bạn hoàn toàn có thể có một chuyến đi tuyệt vời:
- **Đi Bát Tràng:** Vé xe buýt 47A (8.000đ) hoặc xăng xe máy (30.000đ) + Trải nghiệm vuốt gốm (50.000đ) + Vé Bảo tàng Gốm (50.000đ) + Bữa trưa cỗ măng mực (150.000đ) + Mua chiếc cốc gốm xinh xắn (50.000đ). Tổng chỉ khoảng **330.000đ**!
- **Đi Vạn Phúc:** Vé tàu điện trên cao khứ hồi (30.000đ) + Workshop thử dệt (100.000đ) + Mua khăn lụa tơ tằm (200.000đ) + Ăn uống nhẹ (80.000đ). Tổng khoảng **410.000đ**!`;
  }

  if (query.includes('quà') || query.includes('mua') || query.includes('lưu niệm') || query.includes('biếu')) {
    return `Những món quà tinh hoa làng nghề Hà Nội ý nghĩa nhất:
1. **Khăn lụa tơ tằm Vạn Phúc:** Thanh tao, mềm mại, phù hợp tặng mẹ, bạn gái hoặc đối tác nữ.
2. **Bộ ấm chén tử sa / Bình hút lộc Bát Tràng:** Trang nhã, sang trọng dành tặng đối tác, tân gia hoặc người yêu trà đạo.
3. **Nón lá bài thơ làng Chuông:** Món quà văn hóa độc đáo dành cho bạn bè quốc tế.
4. **Đèn thả hoặc khay mây nan mịn Phú Vinh:** Xu hướng quà tặng decor xanh hiện đại.
5. **Tranh dát vàng Kiêu Kỵ:** Quà tặng cao cấp mạ vàng thật cho sự kiện trang trọng.`;
  }

  if (query.includes('bát tràng') || query.includes('gốm')) {
    return `**Làng gốm Bát Tràng** cách trung tâm Hà Nội khoảng 14km:
- **Đi lại:** Xe máy theo đường đê Nguyễn Khoái - đê Bát Tràng, hoặc xe buýt 47A từ Long Biên.
- **Hoạt động không thể bỏ qua:** Vuốt gốm tại chợ, tham quan Bảo tàng Gốm Bát Tràng (Trung tâm Tinh hoa Làng nghề Việt), thăm Lò Bầu cổ gần 100 năm.
- **Món ngon:** Canh măng mực Bát Tràng, chè củ mài, su hào xào mực.
- Bạn cũng có thể thử ngay **mini-game làm gốm ảo** ngay trên website tại mục Trải nghiệm!`;
  }

  if (query.includes('vạn phúc') || query.includes('lụa')) {
    return `**Làng lụa Vạn Phúc (Hà Đông):**
- **Đặc sản:** Lụa Vân mềm mát, hoa văn mây bay dệt chìm sang trọng.
- **Cách đi thú vị nhất:** Đi tàu điện trên cao Cát Linh - Hà Đông xuống ga Vạn Phúc, đi bộ 5 phút vào làng.
- **Điểm check-in:** Con đường ô dù sắc màu, miếu Bà Chúa Lụa A Lã Thị Nương, các xưởng dệt cổ bên sông Nhuệ.`;
  }

  if (query.includes('chụp ảnh') || query.includes('check-in') || query.includes('sống ảo')) {
    return `Top 3 làng nghề chụp ảnh "triệu view" tại Hà Nội:
1. **Phố ô lụa Vạn Phúc:** Hàng ngàn chiếc ô màu treo rợp trời cùng tường tranh bích họa làng lụa.
2. **Bảo tàng Gốm Bát Tràng:** Kiến trúc 7 khối xoáy khổng lồ bằng đất sét nung lên hình siêu nghệ thuật.
3. **Chợ nón làng Chuông:** Cảnh hàng ngàn vành nón trắng xếp lớp trong nắng sớm ven đình cổ Phương Trung.`;
  }

  // Default helpful response
  return `Chào bạn! Tôi là **Trợ lý Khám phá Làng nghề Hà Nội**. Tôi có thể giúp bạn:
- Gợi ý làng nghề phù hợp với thời gian và sở thích cá nhân.
- Lên lịch trình khám phá làng nghề chi tiết (Bát Tràng, Vạn Phúc, làng Chuông, Phú Vinh, Đào Thục,...).
- Tư vấn ngân sách, phương tiện di chuyển và món ngon địa phương.
- Gợi ý quà tặng thủ công mỹ nghệ tinh hoa.

Bạn có thể thử hỏi tôi: *"Làng nghề nào chụp ảnh đẹp nhất?"*, *"Có 300k thì nên đi đâu?"*, hoặc *"Làng nghề nào hợp cho gia đình có trẻ nhỏ?"* nhé!`;
}

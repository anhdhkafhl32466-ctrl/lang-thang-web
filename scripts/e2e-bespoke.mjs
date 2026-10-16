/**
 * Kiểm thử end-to-end: ĐỒNG SÁNG TẠO CÙNG AI → ĐẶT LÀM ĐỘC BẢN.
 *
 * Chạy trên một máy chủ đã khởi động:
 *   npm run build && PORT=4330 SELLER_AUTO_APPROVE=true npm start
 *   node scripts/e2e-bespoke.mjs            (mặc định http://127.0.0.1:4330)
 *   BASE=http://127.0.0.1:3000 node scripts/e2e-bespoke.mjs
 *
 * Bài kiểm thử đi qua đúng giao diện mà người dùng thật dùng: API sinh hoa văn, API gửi yêu cầu,
 * API của nghệ nhân — đồng thời kiểm cả các trường hợp PHẢI BỊ TỪ CHỐI (người ngoài xem đơn của người
 * khác, khách tự báo giá thay nghệ nhân, yêu cầu đến từ nguồn khác).
 */

const BASE = process.env.BASE || 'http://127.0.0.1:4330';

let passed = 0;
const failures = [];

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${extra ? ` — ${extra}` : ''}`);
    console.log(`  ✗ ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/** Bình cookie tối giản: giữ cookie phiên giữa các lời gọi. */
function makeClient() {
  return { cookie: '' };
}

async function call(client, path, { method = 'GET', body, headers = {} } = {}) {
  const init = { method, headers: { ...headers }, redirect: 'manual' };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (client.cookie) init.headers.Cookie = client.cookie;

  const res = await fetch(`${BASE}${path}`, init);
  const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (setCookies.length) {
    const pairs = setCookies.map((value) => value.split(';')[0]);
    const merged = new Map(
      [...client.cookie.split('; ').filter(Boolean), ...pairs].map((pair) => {
        const index = pair.indexOf('=');
        return [pair.slice(0, index), pair.slice(index + 1)];
      })
    );
    client.cookie = [...merged.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
  }

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* không phải JSON — trang HTML chẳng hạn */
  }
  return { status: res.status, json, text };
}

const stamp = Date.now();
const sellerEmail = `e2e-bespoke-${stamp}@example.com`;
const customerEmail = `e2e-customer-${stamp}@example.com`;
const outsiderEmail = `e2e-outsider-${stamp}@example.com`;
const sellerPassword = 'MatKhauE2e2026';

async function main() {
  console.log(`Kiểm thử end-to-end đặt làm độc bản tại ${BASE}`);

  /* ------------------------------------------------------------------ */
  section('1. Trang xưởng đồng sáng tạo');

  const page = await call(makeClient(), '/dong-sang-tao');
  check('GET /dong-sang-tao trả 200', page.status === 200, `nhận ${page.status}`);
  check('Trang chứa tiêu đề xưởng', page.text.includes('Đồng sáng tạo'));

  /* ------------------------------------------------------------------ */
  section('2. GenAI phác hoa văn trên phôi');

  const cocreateClient = makeClient();
  const idea = 'Chiếc bình hoa sen nở trên sóng nước, men xanh ngọc thanh khiết, vài chú cá chép bơi lội';
  const generated = await call(cocreateClient, '/api/ai/cocreate', {
    method: 'POST',
    body: { prompt: idea, blankId: 'gom', sizeId: 'binh-nho', seed: 24680 },
  });

  check('POST /api/ai/cocreate trả 200', generated.status === 200, `nhận ${generated.status} ${generated.json?.error?.message || ''}`);
  const gen = generated.json || {};
  check('Trả về đặc tả hoa văn', Boolean(gen.spec?.title));
  check('Giữ đúng hạt giống đã yêu cầu', gen.spec?.seed === 24680, `nhận ${gen.spec?.seed}`);
  check('Chọn được ít nhất một hoạ tiết', Array.isArray(gen.spec?.motifs) && gen.spec.motifs.length > 0);
  check('Bảng màu có 3–5 màu', Array.isArray(gen.spec?.palette) && gen.spec.palette.length >= 3 && gen.spec.palette.length <= 5);
  check('Màu hợp lệ dạng #RRGGBB', (gen.spec?.palette || []).every((hex) => /^#[0-9a-fA-F]{6}$/.test(hex)));
  check('Dựng ra ảnh SVG', typeof gen.svg === 'string' && gen.svg.startsWith('<svg') && gen.svg.includes('</svg>'));
  check('SVG có bề mặt hoa văn thật (nhiều phần tử vẽ)', (gen.svg.match(/<(path|ellipse|circle|polygon|rect)/g) || []).length >= 10);
  check('Có ảnh dạng data URI cho giao diện', typeof gen.dataUri === 'string' && gen.dataUri.startsWith('data:image/svg+xml'));
  check('Có phiếu kỹ thuật gửi nghệ nhân', Array.isArray(gen.specSheet) && gen.specSheet.length >= 8);
  check('Phiếu kỹ thuật nêu rõ bố cục', JSON.stringify(gen.specSheet).includes('Lối bố cục'));
  check('Nêu rõ nguồn hoa văn (AI hoặc động cơ ngoại tuyến)', ['gemini-cloud-ai', 'local-artisan-engine'].includes(gen.engine), `nhận ${gen.engine}`);

  const otherIdea = await call(makeClient(), '/api/ai/cocreate', {
    method: 'POST',
    body: { prompt: 'Trống đồng Đông Sơn với ngôi sao nhiều cánh, sơn đỏ thếp vàng trên nền sơn mài', blankId: 'tranh-khac-go', sizeId: 'tranh-30', seed: 111 },
  });
  check('Ý tưởng khác cho ra hoa văn khác', otherIdea.status === 200 && otherIdea.json?.svg !== gen.svg);
  check('Hoạ tiết bám theo ý tưởng (có mặt trống đồng hoặc họa tiết gỗ)', ['trong-dong', 'vay-ca', 'mat-troi', 'rong'].some((kind) => (otherIdea.json?.spec?.motifs || []).includes(kind)), JSON.stringify(otherIdea.json?.spec?.motifs));

  const tooShort = await call(makeClient(), '/api/ai/cocreate', { method: 'POST', body: { prompt: 'ok', blankId: 'gom' } });
  check('Từ chối ý tưởng quá ngắn', tooShort.status === 400);

  const badBlank = await call(makeClient(), '/api/ai/cocreate', { method: 'POST', body: { prompt: 'hoa sen', blankId: 'khong-ton-tai' } });
  check('Từ chối phôi không tồn tại', badBlank.status === 400);

  /* ------------------------------------------------------------------ */
  section('3. Danh sách nghệ nhân theo phôi');

  const artisans = await call(makeClient(), '/api/bespoke/artisans?blankId=gom');
  check('GET /api/bespoke/artisans trả 200', artisans.status === 200);
  check('Có ít nhất một xưởng nhận phôi', Array.isArray(artisans.json?.artisans) && artisans.json.artisans.length >= 1);
  check('Xưởng đúng làng nghề được xếp trước', !artisans.json?.artisans?.length || artisans.json.artisans[0].villageProductCount >= (artisans.json.artisans[1]?.villageProductCount ?? 0));

  /* ------------------------------------------------------------------ */
  section('4. Nghệ nhân đăng ký và đăng nhập');

  const sellerClient = makeClient();
  const register = await call(sellerClient, '/api/seller/register', {
    method: 'POST',
    body: {
      contactName: 'Nghệ nhân E2E',
      storeName: `Xưởng Gốm E2E ${stamp}`,
      email: sellerEmail,
      phone: '0912345678',
      password: sellerPassword,
      confirmPassword: sellerPassword,
      addressText: 'Xóm 1, Bát Tràng, Gia Lâm, Hà Nội',
      description: 'Xưởng thử nghiệm cho bài kiểm thử tự động.',
      categories: ['Gốm sứ'],
    },
  });
  check('POST /api/seller/register trả 201', register.status === 201, `nhận ${register.status} ${register.json?.error?.message || ''}`);
  check('Cửa hàng được kích hoạt (SELLER_AUTO_APPROVE)', register.json?.store?.status === 'active', JSON.stringify(register.json?.store));
  const storeId = register.json?.store?.id;

  const sellerLogin = await call(makeClient(), '/api/seller/session', {
    method: 'POST',
    body: { email: sellerEmail, password: sellerPassword },
  });
  check('Đăng nhập người bán thành công', sellerLogin.status === 200 && sellerLogin.json?.ok === true, sellerLogin.json?.error?.message || '');
  const sellerAuthed = makeClient();
  const sellerLogin2 = await call(sellerAuthed, '/api/seller/session', { method: 'POST', body: { email: sellerEmail, password: sellerPassword } });
  check('Có cookie phiên người bán', sellerLogin2.status === 200 && sellerAuthed.cookie.includes('lt_session'));

  const sellerInboxEmpty = await call(sellerAuthed, '/api/seller/bespoke');
  check('Hộp yêu cầu của nghệ nhân mở được', sellerInboxEmpty.status === 200, sellerInboxEmpty.json?.error?.message || '');

  /* ------------------------------------------------------------------ */
  section('5. Khách gửi bản thiết kế tới nghệ nhân');

  const customerClient = makeClient();
  const customerLogin = await call(customerClient, '/api/auth/session', {
    method: 'POST',
    body: { email: customerEmail, name: 'Khách E2E', verifiedByMx: true },
  });
  check('Khách thiết lập được phiên đăng nhập', customerLogin.status === 200 && customerClient.cookie.includes('lt_session'), customerLogin.json?.error?.message || '');

  const createRequest = await call(customerClient, '/api/bespoke', {
    method: 'POST',
    body: {
      blankId: 'gom',
      sizeId: 'binh-nho',
      quantity: 2,
      prompt: idea,
      note: 'Cần xong trước 20/11 để làm quà.',
      budgetVnd: 1500000,
      storeId,
      pattern: gen.spec,
      customer: { name: 'Khách E2E', phone: '0905123456', email: customerEmail },
    },
  });
  check('POST /api/bespoke trả 201', createRequest.status === 201, `nhận ${createRequest.status} ${createRequest.json?.error?.message || ''}`);
  const bespoke = createRequest.json?.request;
  check('Yêu cầu gắn đúng cửa hàng nghệ nhân', bespoke?.storeId === storeId, `nhận ${bespoke?.storeId}`);
  check('Yêu cầu lưu đúng hoạ tiết khách đã duyệt', JSON.stringify(bespoke?.patternMotifs) === JSON.stringify(gen.spec.motifs));
  check('Yêu cầu lưu SVG do máy chủ dựng lại', typeof bespoke?.svg === 'string' && bespoke.svg.startsWith('<svg'));
  check('Trạng thái ban đầu là chờ báo giá', bespoke?.status === 'cho-bao-gia');

  const mine = await call(customerClient, '/api/bespoke');
  check('Khách thấy đơn của mình', mine.status === 200 && (mine.json?.requests || []).some((item) => item.id === bespoke?.id));

  const inbox = await call(sellerAuthed, '/api/seller/bespoke');
  check('Nghệ nhân nhận được yêu cầu', inbox.status === 200 && (inbox.json?.requests || []).some((item) => item.id === bespoke?.id));
  check('Nghệ nhân thấy được ghi chú của khách', (inbox.json?.requests || []).find((item) => item.id === bespoke?.id)?.note?.includes('20/11'));
  check('Đếm số yêu cầu cần nghệ nhân xử lý', Number(inbox.json?.needsAction) >= 1);

  /* ------------------------------------------------------------------ */
  section('6. Phân quyền — những việc PHẢI bị từ chối');

  const outsiderClient = makeClient();
  await call(outsiderClient, '/api/auth/session', { method: 'POST', body: { email: outsiderEmail, name: 'Người ngoài', verifiedByMx: true } });
  // 403 = có đơn nhưng không thuộc về người xem; 404 = không có đơn nào như vậy.
  // Cả hai đều là từ chối hợp lệ, miễn là KHÔNG trả về nội dung đơn.
  const peek = await call(outsiderClient, `/api/bespoke/${bespoke?.id}`);
  check(
    'Người ngoài không xem được đơn của người khác',
    (peek.status === 403 || peek.status === 404) && !peek.json?.request,
    `nhận ${peek.status}`
  );

  const outsiderList = await call(outsiderClient, '/api/bespoke');
  check('Danh sách của người ngoài không chứa đơn người khác', !(outsiderList.json?.requests || []).some((item) => item.id === bespoke?.id));

  const selfQuote = await call(customerClient, `/api/bespoke/${bespoke?.id}`, { method: 'PATCH', body: { action: 'quote', priceVnd: 100000, days: 5 } });
  check('Khách không tự báo giá thay nghệ nhân', selfQuote.status >= 400, `nhận ${selfQuote.status}`);

  const foreignOrigin = await call(makeClient(), '/api/bespoke', {
    method: 'POST',
    headers: { Origin: 'https://ke-tan-cong.example' },
    body: { blankId: 'gom', sizeId: 'binh-nho', prompt: idea, customer: { name: 'Kẻ lạ', phone: '0900000000' }, pattern: gen.spec },
  });
  check('Chặn yêu cầu từ nguồn khác (CSRF)', foreignOrigin.status === 403, `nhận ${foreignOrigin.status}`);

  const noContact = await call(makeClient(), '/api/bespoke', {
    method: 'POST',
    body: { blankId: 'gom', sizeId: 'binh-nho', prompt: idea, customer: { name: 'Khách không liên hệ' }, pattern: gen.spec },
  });
  check('Bắt buộc có email hoặc số điện thoại', noContact.status === 400, `nhận ${noContact.status}`);

  /* ------------------------------------------------------------------ */
  section('7. Vòng đời: báo giá → khách đồng ý → chế tác → hoàn thành');

  const quote = await call(sellerAuthed, `/api/bespoke/${bespoke?.id}`, {
    method: 'PATCH',
    body: { action: 'quote', priceVnd: 1380000, days: 14, note: 'Vẽ tay dưới men, tặng kèm hộp quà.' },
  });
  check('Nghệ nhân gửi được báo giá', quote.status === 200, quote.json?.error?.message || '');
  check('Trạng thái chuyển sang đã báo giá', quote.json?.request?.status === 'da-bao-gia');
  check('Lưu đúng giá và số ngày', quote.json?.request?.quotePriceVnd === 1380000 && quote.json?.request?.quoteDays === 14);

  const quoteAgain = await call(sellerAuthed, `/api/bespoke/${bespoke?.id}`, { method: 'PATCH', body: { action: 'quote', priceVnd: 1000, days: 1 } });
  check('Không báo giá hai lần cho cùng yêu cầu', quoteAgain.status === 409, `nhận ${quoteAgain.status}`);

  const accept = await call(customerClient, `/api/bespoke/${bespoke?.id}`, { method: 'PATCH', body: { action: 'accept' } });
  check('Khách xác nhận được báo giá', accept.status === 200, accept.json?.error?.message || '');
  check('Trạng thái chuyển sang đang chế tác', accept.json?.request?.status === 'dang-che-tac');

  const finish = await call(sellerAuthed, `/api/bespoke/${bespoke?.id}`, { method: 'PATCH', body: { action: 'advance', status: 'hoan-thanh' } });
  check('Nghệ nhân đánh dấu hoàn thành', finish.status === 200 && finish.json?.request?.status === 'hoan-thanh', finish.json?.error?.message || '');

  const badTransition = await call(sellerAuthed, `/api/bespoke/${bespoke?.id}`, { method: 'PATCH', body: { action: 'advance', status: 'hoan-thanh' } });
  check('Chặn chuyển trạng thái sai quy trình', badTransition.status === 409, `nhận ${badTransition.status}`);

  const notifications = await call(customerClient, '/api/notifications');
  const titles = JSON.stringify(notifications.json || {});
  check('Khách nhận được thông báo về báo giá', titles.includes('báo giá') || titles.includes('Báo giá'));

  /* ------------------------------------------------------------------ */
  section('8. Trang nghệ nhân');

  const sellerPage = await call(makeClient(), '/ban-hang/dong-sang-tao');
  check('GET /ban-hang/dong-sang-tao trả 200', sellerPage.status === 200, `nhận ${sellerPage.status}`);

  console.log(`\n${'─'.repeat(60)}`);
  if (failures.length === 0) {
    console.log(`KẾT QUẢ: ĐẠT — ${passed} kiểm tra, không có lỗi.`);
  } else {
    console.log(`KẾT QUẢ: KHÔNG ĐẠT — ${passed} đạt, ${failures.length} lỗi:`);
    failures.forEach((item) => console.log(`  • ${item}`));
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('\nKiểm thử dừng vì lỗi không mong đợi:', error);
  process.exit(1);
});

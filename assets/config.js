// ============================================================
//  CẤU HÌNH TRANG RVM — sửa ở ĐÂY, không cần đụng file khác.
//  Lưu ý: nếu đổi GIÁ, sửa cả PLANS trong Code.gs (Apps Script)
//  để máy chủ tính đúng giá trị đơn & hoa hồng.
// ============================================================
window.RVM = {
  // URL Web App của Apps Script (Triển khai → Ứng dụng web → URL kết thúc bằng /exec).
  // Để trống: form vẫn hiện, nhưng sẽ hướng khách sang Zalo/hotline.
  api: 'https://script.google.com/macros/s/AKfycby4EbiwE7p5FcrvvgK7-1DhDTo-Lvb7jmIoufhfJQlDPv8BcWp7h_qZ7uTD63lzMcF6jQ/exec',

  hotline: '0918 637 699',
  zalo: 'https://zalo.me/0918637699',
  telegram: 'https://t.me/+84918637699',

  version: '1.1.7',
  download: 'https://raw.githubusercontent.com/rongvietmedia/rvm-release/main/RVM-Setup-1.1.7.exe',

  // Giá theo MÁY (mỗi máy 1 bản quyền). Giá gốc dùng để hiện "tiết kiệm %".
  plans: [
    { id: 'm1', name: '1 tháng', months: 1,  price: 180000,  tag: 'Vào nhẹ, thử thực tế' },
    { id: 'm3', name: '3 tháng', months: 3,  price: 360000,  tag: 'Đủ dài để kênh có dữ liệu' },
    { id: 'y1', name: '1 năm',   months: 12, price: 720000,  tag: 'Cân bằng giá và thời hạn', best: true },
    { id: 'y3', name: '3 năm',   months: 36, price: 1399000, tag: 'Yên tâm dài hạn' }
  ],

  // Chương trình đối tác
  commission: 40,       // % hoa hồng mặc định trên mỗi đơn ĐÃ THANH TOÁN
  refDays: 60,          // khách bấm link giới thiệu được ghi nhận trong bao nhiêu ngày
  payoutNote: 'Hoa hồng tính trên đơn đã thanh toán, đối soát và chuyển khoản định kỳ cho đối tác.'
};

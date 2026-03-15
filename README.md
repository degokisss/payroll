# 🧮 Công Cụ Tính Lương Việt Nam 2025

Ứng dụng React tính lương theo Luật Lao động, BHXH và Thuế TNCN Việt Nam hiện hành.

## Tính năng

- **Gross → Net**: Tính lương thực lĩnh từ lương gross + phụ cấp
- **Net → Gross**: Tính ngược gross cần offer để nhân viên nhận được mức net mong muốn
- **Biểu thuế TNCN**: Tra cứu và thử tính thuế lũy tiến 7 bậc

## Cài đặt & Chạy local

```bash
npm install
npm run dev
```

## Deploy lên GitHub Pages

### Bước 1 — Tạo GitHub repo mới
Tạo repo tên `payroll-vn` (hoặc tên tùy ý) trên GitHub.

### Bước 2 — Cập nhật `vite.config.js`
Đổi `base` thành tên repo của bạn:
```js
base: '/TEN_REPO_CUA_BAN/',
```

### Bước 3 — Push code lên GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/payroll-vn.git
git push -u origin main
```

### Bước 4 — Bật GitHub Pages
1. Vào **Settings → Pages** trong repo
2. Chọn **Source: GitHub Actions**
3. GitHub Actions sẽ tự động build và deploy mỗi lần push lên `main`

URL app sau khi deploy: `https://USERNAME.github.io/payroll-vn/`

## Cơ sở pháp lý

- Thông tư 111/2013/TT-BTC (Thuế TNCN)
- Nghị quyết 954/2020/UBTVQH14 (mức giảm trừ gia cảnh)
- Luật BHXH 2014 (mức đóng bảo hiểm)

> Công cụ tham khảo, không thay thế tư vấn kế toán/pháp lý.

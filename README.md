
# E Commerce Website

Replica of the TechStore ecommerce UI from [Figma](https://www.figma.com/design/bCDYWEwQ1cdY1JEbTwgnlO/E-Commerce-Website) with a Node/Express backend + MySQL (XAMPP) database.

---

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start backend API**
   ```bash
   npm run server   # runs Express on http://localhost:3001
   ```
3. **Start frontend (Vite)**
   ```bash
   npm run dev      # runs Vite on http://localhost:5173 (proxying /api to 3001)
   ```

> Frontend expects the backend to be running because all product data is loaded from `/api/products`.

---

## About TechStore

TechStore là một cửa hàng điện tử giả lập được thiết kế theo phong cách hiện đại trên Figma. Trang web gồm các phần:

- **Hero + Filter:** giới thiệu banner, khuyến mãi, bộ lọc theo danh mục/từ khóa.
- **Danh sách sản phẩm:** grid 4 cột, hiển thị badge giảm giá nếu `original_price > price`, nút thêm nhanh vào giỏ.
- **Khuyến mãi hot:** tuyển lựa sản phẩm giảm giá nhiều nhất (top 8).
- **Giới thiệu / cam kết:** card highlight (chất lượng, giá tốt, hỗ trợ 24/7) và câu chuyện thương hiệu.
- **Footer:** thông tin liên hệ, danh mục hỗ trợ, link nhanh.
- **Auth & Admin Dashboard:** modal đăng nhập/đăng ký và trang quản trị (hiện đang chờ nối API thực).

Stack chính: React + Vite, Tailwind utility classes, Framer Motion (hiệu ứng), Express + MySQL cho backend.

---

## Environment & Database

- MySQL database name: `tech_shop_ecommerce`
- Import `/db/tech_shop_ecommerce.sql` (or the latest dump) to create the schema & seed data.
- Backend connection settings come from `src/lib/db.ts` (default `root` / no password / localhost). Adjust if needed or provide `.env`.
- Product images currently use remote URLs stored in the `product.image` column.

---

## Project Structure

```
E-Commerce-Website/
├─ index.html
├─ package.json
├─ tsconfig.scripts.json
├─ vite.config.ts
├─ update-discounts.sql
├─ README.md
├─ build/                       # Vite production output
│   └─ assets/
├─ scripts/
│   └─ test-db.ts               # Verify DB connectivity via mysql2
├─ server/
│   ├─ index.ts                 # Express bootstrap + route mounting
│   ├─ routes/
│   │   ├─ auth.ts
│   │   ├─ cart.ts
│   │   ├─ categories.ts
│   │   ├─ customers.ts
│   │   ├─ dashboard.ts
│   │   ├─ deals.ts
│   │   ├─ health.ts
│   │   ├─ orders.ts
│   │   ├─ products.ts
│   │   └─ support.ts
│   └─ services/
│       ├─ authService.ts
│       ├─ cartService.ts
│       ├─ categoryService.ts
│       ├─ customerService.ts
│       ├─ dashboardService.ts
│       ├─ dealService.ts
│       ├─ orderService.ts
│       ├─ productService.ts
│       └─ supportService.ts
├─ src/
│   ├─ App.tsx                  # Main SPA entry, data fetching + sections
│   ├─ main.tsx                 # Vite entry point
│   ├─ index.css
│   ├─ components/
│   │   ├─ AdminDashboard.tsx
│   │   ├─ AuthPage.tsx
│   │   ├─ Checkout.tsx
│   │   ├─ FilterBar.tsx
│   │   ├─ Header.tsx / Header.jsx
│   │   ├─ Hero.tsx
│   │   ├─ ProductCard.tsx
│   │   ├─ ShoppingCart.tsx
│   │   ├─ figma/ImageWithFallback.tsx
│   │   └─ ui/…                 # Shadcn components (button, card, dialog, …)
│   ├─ lib/
│   │   └─ db.ts               # mysql2 pool configuration
│   ├─ styles/
│   │   └─ globals.css
│   ├─ guidelines/
│   │   └─ Guidelines.md
│   └─ types/
│       └─ react-jsx.d.ts
└─ node_modules/
```

---

## Implemented APIs

| Area         | Route(s)                         | Status           |
|--------------|----------------------------------|------------------|
| Products     | `/api/products`, `/api/deals`    | ✅ Live data (CRUD ready) |
| Categories   | `/api/categories`                | ✅ Count per category |
| Auth         | `/api/auth/login`, `/register`   | ✅ Basic auth (no session) |
| Support      | `/api/support/contact`           | ✅ Inserts request |

---

## TODO / Next Steps

| Area                     | Files                                                   | Notes |
|--------------------------|---------------------------------------------------------|-------|
| Orders & Checkout        | `server/services/orderService.ts`, `server/routes/orders.ts`, `server/services/cartService.ts`, `server/routes/cart.ts` | Implement CRUD, order detail joins, stock deduction, cart preview. |
| Customers & Users        | `server/services/customerService.ts`, `server/routes/customers.ts` | List + detail + stats for Admin dashboard. |
| Auth session / profile   | `server/services/authService.ts`, `server/routes/auth.ts` | Add `/me`, `/logout`, session/JWT guard for admin routes. |
| Dashboard metrics        | `server/services/dashboardService.ts`, `server/routes/dashboard.ts` | Total revenue/orders/customers, top products, recent orders/customers. |
| (Optional) Promotions    | `server/services/dealService.ts`                         | Enhance if needed (schedules/banners). |

Track progress by updating the README or turning these into issues/tasks.

---

## Notes

- `ImageWithFallback` gracefully handles broken image URLs; update `product.image` with remote links or store assets in `/public`.
- If you change ports, update `vite.config.ts` proxy (`/api` → backend host).

Happy building! 🚀
  

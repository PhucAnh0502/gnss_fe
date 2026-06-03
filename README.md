# GNSS Vision — Frontend

Web dashboard cho hệ thống GNSS Vision. Hiển thị real-time tracking, quản lý thiết bị, bản đồ, Globe 3D, snapshots và cài đặt tài khoản.

## Tech Stack

- **React 19** + Vite
- **TanStack Router** — routing
- **TanStack React Query** — data fetching & caching
- **Tailwind CSS 4** — styling
- **Framer Motion** — animations
- **Leaflet + React Leaflet** — bản đồ 2D
- **COBE** — Globe 3D (canvas-based, lightweight)
- **Three.js + React Three Fiber** — 3D Earth model (login page)
- **Socket.IO Client** — real-time tracking via WebSocket
- **Lucide React** — icons
- **Sonner** — toast notifications
- **Axios** — HTTP client

## Cấu trúc thư mục

```
src/
├── api/              # Axios instance & interceptors
├── components/       # Shared components
│   ├── map/          # MapTrackingTab, GlobeTrackingTab
│   └── ui/           # Button, Input, EarthModel
├── features/         # React Query hooks (useDevices, useAuth)
├── lib/              # Utilities (auth helpers)
├── pages/            # Page components
│   ├── DashboardPage.jsx
│   ├── DevicesPage.jsx
│   ├── HistoryPage.jsx
│   ├── MapPage.jsx
│   ├── SnapshotsPage.jsx
│   ├── SettingsPage.jsx
│   └── LoginPage.jsx
├── routes/           # TanStack Router route definitions
├── services/         # API service functions
└── main.jsx          # Entry point
```

## Chức năng chính

- **Dashboard** — Tổng quan: thống kê thiết bị, telemetry chart, fleet health, alerts
- **Devices** — CRUD quản lý thiết bị GPS
- **Live Map** — Bản đồ real-time vị trí thiết bị (Leaflet) + Globe 3D satellite visualization (COBE)
- **History** — Lịch sử tracking theo khoảng thời gian
- **Snapshots** — Xem ảnh chụp từ thiết bị, phân trang, modal chi tiết
- **Settings** — Thông tin tài khoản, đổi mật khẩu

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Tạo file .env
# VITE_API_BASE_URL=http://localhost:5000/api

# Chạy development
npm run dev

# Build production
npm run build
```

## Biến môi trường

| Biến | Mô tả |
|------|--------|
| `VITE_API_BASE_URL` | URL backend API (vd: `http://localhost:5000/api`) |

## Real-time

Frontend kết nối WebSocket tới backend qua Socket.IO. Mỗi device có event `live:{deviceCode}` chứa GPS data real-time (lat, lng, speed, heading, satellites, raw GNSS measurements).

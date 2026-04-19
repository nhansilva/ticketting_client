# Ticketing Client — Event Catalog Integration Design

**Date:** 2026-04-18  
**Status:** Approved  
**Approach:** Page-by-page (B)  
**Backend:** event-catalog-service port 8082 — data thật đã có

---

## Scope

3 deliverables theo thứ tự build:

1. **HomePage** — thay mock data bằng API thật từ event-catalog-service
2. **EventDetailPage** — trang chi tiết event, render khác nhau theo type (CONCERT / MOVIE)
3. **SeatMapPage** — chọn ghế: arc stadium cho concert, grid rạp cho movie

**Out of scope:** Booking flow (booking-service chưa có), Admin pages, "Vé của tôi".

---

## Architecture

### Cấu trúc thư mục (thay đổi so với hiện tại)

```
src/
├── api/
│   ├── axios.ts          ✅ đã có — JWT interceptor
│   ├── auth.api.ts       ✅ đã có
│   └── event.api.ts      🆕 GET events, GET event/{id}, GET venue/{id}, GET seats
├── types/
│   ├── auth.types.ts     ✅ đã có
│   └── event.types.ts    🆕 Event, Venue, Seat, ConcertDetail, MovieDetail, enums
├── hooks/
│   └── useEvents.ts      🆕 React Query hooks: useEvents, useEvent, useVenue, useSeats
├── pages/
│   ├── home/             ✅ update — xóa mock data, dùng useEvents()
│   ├── events/
│   │   └── EventDetailPage.tsx   🆕
│   └── seats/
│       └── SeatMapPage.tsx       🆕
```

### State Management

| State | Tool | Dữ liệu |
|---|---|---|
| Server data | React Query | events list, event detail, venue, seats |
| UI local | useState | activeTab, activeZone, selectedSeats |
| Auth | Zustand (đã có) | user, token |

### User Flow

```
HomePage → (click card) → EventDetailPage → (click "Chọn ghế") → SeatMapPage → (click "Đặt vé") → [out of scope]
```

---

## API Endpoints

Tất cả gọi qua `eventAxiosInstance` — instance riêng cho event-catalog-service. **Không dùng `axiosInstance` hiện tại** vì nó hardcode port 8081 (user-service).

```ts
// src/api/eventAxios.ts — instance mới, copy interceptor JWT từ axios.ts
const EVENT_API_URL = import.meta.env.VITE_EVENT_API_URL ?? 'http://localhost:8082';
export const eventAxiosInstance = axios.create({ baseURL: EVENT_API_URL, ... });
```

Thêm vào `.env.local`:
```
VITE_EVENT_API_URL=http://localhost:8082
```

| Method | URL | Dùng ở trang |
|---|---|---|
| GET | `/api/v1/events?type=CONCERT&status=ON_SALE&page=0&size=20` | HomePage |
| GET | `/api/v1/events?type=MOVIE&status=ON_SALE&page=0&size=20` | HomePage |
| GET | `/api/v1/events/{id}` | EventDetailPage |
| GET | `/api/v1/venues/{id}` | EventDetailPage |
| GET | `/api/v1/events/{id}/seats` | SeatMapPage |

---

## Types (`event.types.ts`)

```typescript
// Enums
type EventType = 'CONCERT' | 'MOVIE';
type EventStatus = 'DRAFT' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED';
type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'SOLD';
type MovieFormat = '2D' | '3D' | 'IMAX';
type AgeRating = 'G' | 'PG' | 'PG13' | 'R';

// Detail (sealed — discriminated union thay thế sealed interface Java)
interface ConcertDetail {
  artists: string[];
  genres: string[];
  ageRestriction: number | null;
}

interface MovieDetail {
  director: string;
  cast: string[];
  genre: string;
  durationMinutes: number;
  format: MovieFormat;
  rating: AgeRating;
}

// Zone price info (trong EventResponse.zones[])
interface EventZone {
  name: string;           // "VIP", "GOLD", "GA", "STANDING"
  rows: number;
  seatsPerRow: number;
  price: number;          // BigDecimal từ backend → number ở FE
  rowPrefix: string;      // "A", "B"...
}

// Domain
interface EventSummary {          // từ GET /events (list) — EventSummaryResponse
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  venueName: string;      // đã có tên venue, không cần fetch riêng
  startTime: string;
  imageUrls: string[];
  // ⚠️ Không có minPrice — list card sẽ không hiện giá, chỉ hiện "Xem chi tiết"
}

interface Event {                 // từ GET /events/{id} (detail) — EventResponse
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  venueId: string;
  venueName: string;
  startTime: string;
  endTime: string;
  zones: EventZone[];     // giá hiển thị từ đây — min(zones.price) = "Từ Xđ"
  imageUrls: string[];
  detail: ConcertDetail | MovieDetail;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
}

interface Seat {                  // từ GET /events/{id}/seats — SeatResponse
  id: string;
  zone: string;           // "VIP", "GOLD", "GA", "STANDING"
  row: string;            // "A", "B"...
  seatNumber: number;     // 1, 2, 3...
  code: string;           // "A1", "B12"
  price: number;
  status: SeatStatus;
}
```

---

## Page 1 — HomePage (update)

### Thay đổi
- Xóa `MOCK_CONCERTS`, `MOCK_MOVIES`
- Import `useEvents` hook — gọi riêng cho CONCERT và MOVIE
- Loading state: hiển thị 4 skeleton cards khi đang fetch
- Error state: message lỗi + nút "Thử lại"
- Empty state: text "Không có sự kiện nào" khi list rỗng
- Click card → `navigate('/events/${event.id}')`
- **Không hiển thị giá** trên list card (EventSummary không có price) — hiện "Xem chi tiết →" thay thế
- Search filter giữ nguyên phía client (filter trên data đã fetch)

### Skeleton Card
```tsx
// 4 placeholder cards với shimmer animation khi isLoading
<div className={styles.cardSkeleton} />
```

---

## Page 2 — EventDetailPage (`/events/:id`)

### Layout — Hero Full-Width (A)
- Hero gradient: **tím** (`#1a0533 → #0d1f4d`) cho CONCERT, **đỏ/tối** (`#1a0a0a → #1a1a0a`) cho MOVIE
- Badge: type + status
- Title + datetime + venue name overlay lên hero
- Info cards bên dưới (khác theo type)
- Venue section: tên, địa chỉ, sức chứa
- CTA: giá từ `Math.min(...event.zones.map(z => z.price))` + button "Chọn ghế" → `navigate('/events/${id}/seats')`

### Info Cards theo type

**CONCERT:**
| Card | Data |
|---|---|
| Nghệ sĩ | `detail.artists.join(', ')` |
| Thể loại | `detail.genres.join(' · ')` |
| Độ tuổi | `detail.ageRestriction ? '${detail.ageRestriction}+' : 'Mọi lứa tuổi'` |

**MOVIE:**
| Card | Data |
|---|---|
| Đạo diễn | `detail.director` |
| Thể loại | `detail.genre` |
| Thời lượng | `${detail.durationMinutes} phút` |
| Phân loại | `detail.rating` (badge màu vàng) |
| Diễn viên | `detail.cast` — dạng chip tags |
| Format | `detail.format` badge (đặc biệt IMAX = badge xanh) |

### Data Fetching
```tsx
const { data: event } = useEvent(id);
const { data: venue } = useVenue(event?.venueId, { enabled: !!event });
// Venue fetch chỉ khi đã có event.venueId
```

### Error States
- Event không tìm thấy (404): "Sự kiện không tồn tại" + nút về HomePage
- Event CANCELLED/ENDED: hiển thị thông tin nhưng disable button "Chọn ghế", show badge trạng thái

---

## Page 3 — SeatMapPage (`/events/:id/seats`)

### Data
- `GET /api/v1/events/{id}/seats` trả về tất cả ghế của event
- Client group theo `seat.zone` để hiển thị

### Concert — Arc Stadium

**Zone display:**
- SVG/CSS arc: VIP (nhỏ, gần sân khấu) → GOLD → GA → STANDING (lớn, xa nhất)
- Mỗi arc: màu riêng (VIP=tím, GOLD=cam, GA=xanh lục, STANDING=xám), hiển thị giá zone + số ghế còn
- Click arc → mở panel ghế bên dưới

**Seat panel:**
- Hiển thị ghế của zone đó theo hàng (groupBy row letter từ code "A1" → row "A")
- Mỗi ghế 1 ô vuông nhỏ: 🟢 AVAILABLE, 🔴 SOLD/LOCKED, 🟣 đang chọn
- Click ghế AVAILABLE → thêm vào selectedSeats (max 4)
- Click ghế đang chọn → bỏ chọn

### Movie — Grid Rạp

- "📽 MÀN HÌNH" ở trên cùng
- Tất cả ghế render 1 lần, groupBy row
- Mỗi hàng: label row (A, B, C...) + các ghế
- Màu sắc giống concert

### Summary Bar (sticky bottom — cả 2 loại)
```
[Đã chọn: A5, B6 · 2 ghế]          [2.400.000đ]    [Đặt vé →]
```
- Hiển thị khi `selectedSeats.length > 0`
- "Đặt vé" disabled nếu selectedSeats rỗng
- Click "Đặt vé" → `navigate('/bookings/new', { state: { eventId, selectedSeats } })` — sẽ implement khi có booking-service

### Business Rule
- Tối đa 4 ghế — khi chọn đủ 4, các ghế AVAILABLE khác bị dim (không click được)

---

## Routing (update `router/index.tsx`)

```typescript
{ path: '/events/:id',       element: <PrivateRoute><EventDetailPage /></PrivateRoute> },
{ path: '/events/:id/seats', element: <PrivateRoute><SeatMapPage /></PrivateRoute> },
```

Thêm vào `src/api/`:
```
eventAxios.ts    // axios instance riêng cho port 8082, copy JWT interceptor
```

---

## Styling

- Giữ nguyên dark theme glassmorphism đã có (CSS Modules)
- Concert: accent color `#a855f7` (tím)
- Movie: accent color `#dc2626` (đỏ)
- Skeleton: shimmer animation `background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%); background-size: 200% 100%`

---

## Build Order (Approach B)

1. `eventAxios.ts` + `event.types.ts` + `event.api.ts` + `useEvents.ts` + `.env.local`
2. Update `HomePage` — xóa mock, dùng hook, skeleton, navigate
3. `EventDetailPage` — hero layout, concert/movie branches, venue fetch
4. `SeatMapPage` — arc (concert) + grid (movie), seat selection, summary bar
5. Update `router/index.tsx` — thêm 2 routes mới

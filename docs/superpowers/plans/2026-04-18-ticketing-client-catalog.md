# Ticketing Client — Event Catalog Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock data on HomePage with real event-catalog-service API, add EventDetailPage (hero layout, concert/movie branches), and SeatMapPage (arc stadium for concert, grid for movie).

**Architecture:** Page-by-page (Approach B) — build API layer first, then update HomePage, then add EventDetailPage, then SeatMapPage. Each page uses `eventAxiosInstance` (port 8082) + React Query hooks. Light purple theme matching existing HomePage styles.

**Tech Stack:** React 19, TypeScript 6, React Query v5, React Router v7, CSS Modules, Vite 8. Backend: event-catalog-service at `http://localhost:8082`.

**Spec:** `docs/superpowers/specs/2026-04-18-ticketing-client-catalog-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/eventAxios.ts` | Create | Axios instance for port 8082 with JWT interceptor |
| `src/types/event.types.ts` | Create | All event domain types: EventSummary, Event, Venue, Seat, enums |
| `src/api/event.api.ts` | Create | API functions: listEvents, getEvent, getVenue, getSeats |
| `src/hooks/useEvents.ts` | Create | React Query hooks: useEvents, useEvent, useVenue, useSeats |
| `src/pages/home/HomePage.tsx` | Modify | Replace mock arrays with hooks, add skeleton/error/empty states, navigate on click |
| `src/pages/home/HomePage.module.css` | Modify | Add skeleton shimmer, cardSkeleton class |
| `src/pages/events/EventDetailPage.tsx` | Create | Hero layout, concert/movie branch rendering, venue info, CTA |
| `src/pages/events/EventDetailPage.module.css` | Create | Hero gradient, info cards, venue section, CTA bar |
| `src/pages/seats/SeatMapPage.tsx` | Create | Arc stadium (concert) + grid rạp (movie), seat selection, summary bar |
| `src/pages/seats/SeatMapPage.module.css` | Create | Zone arcs, seat grid, selection states, sticky summary bar |
| `src/router/index.tsx` | Modify | Add 2 new PrivateRoutes: /events/:id and /events/:id/seats |
| `.env.local` | Create | VITE_EVENT_API_URL=http://localhost:8082 |

---

## Task 1: API Foundation

**Files:**
- Create: `src/api/eventAxios.ts`
- Create: `src/types/event.types.ts`
- Create: `src/api/event.api.ts`
- Create: `.env.local`

- [ ] **Step 1.1: Create `.env.local`**

```
VITE_EVENT_API_URL=http://localhost:8082
```

- [ ] **Step 1.2: Create `src/api/eventAxios.ts`**

Copy JWT interceptor pattern từ `src/api/axios.ts` nhưng dùng baseURL của event-catalog-service. Không có refresh token — nếu 401 chỉ cần logout.

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const EVENT_BASE_URL = import.meta.env.VITE_EVENT_API_URL ?? 'http://localhost:8082';

export const eventAxiosInstance = axios.create({
  baseURL: EVENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

eventAxiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

eventAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 1.3: Create `src/types/event.types.ts`**

Types khớp chính xác với backend DTOs (`EventSummaryResponse`, `EventResponse`, `SeatResponse`, `EventZone`).

```typescript
export type EventType = 'CONCERT' | 'MOVIE';
export type EventStatus = 'DRAFT' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED' | 'ENDED';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'SOLD';
export type MovieFormat = '2D' | '3D' | 'IMAX';
export type AgeRating = 'G' | 'PG' | 'PG13' | 'R';

export interface ConcertDetail {
  artists: string[];
  genres: string[];
  ageRestriction: number | null;
}

export interface MovieDetail {
  director: string;
  cast: string[];
  genre: string;
  durationMinutes: number;
  format: MovieFormat;
  rating: AgeRating;
}

export interface EventZone {
  name: string;
  rows: number;
  seatsPerRow: number;
  price: number;
  rowPrefix: string;
}

/** Từ GET /api/v1/events (list) — EventSummaryResponse */
export interface EventSummary {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  venueName: string;
  startTime: string;        // ISO 8601: "2026-06-20T19:00:00"
  imageUrls: string[];
}

/** Từ GET /api/v1/events/{id} (detail) — EventResponse */
export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  venueId: string;
  venueName: string;
  startTime: string;
  endTime: string;
  zones: EventZone[];
  imageUrls: string[];
  detail: ConcertDetail | MovieDetail;
}

/** Từ GET /api/v1/venues/{id} */
export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
}

/** Từ GET /api/v1/events/{id}/seats — SeatResponse */
export interface Seat {
  id: string;
  zone: string;
  row: string;
  seatNumber: number;
  code: string;             // "A1", "B12"
  price: number;
  status: SeatStatus;
}

/** Helper — type guards */
export function isConcertDetail(detail: ConcertDetail | MovieDetail, type: EventType): detail is ConcertDetail {
  return type === 'CONCERT';
}

/** Helper — format LocalDateTime từ backend thành "20/06/2026 · 19:00" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** Helper — format số thành "1.200.000đ" */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

/** Helper — group seats by row ("A", "B", ...) */
export function groupSeatsByRow(seats: Seat[]): Record<string, Seat[]> {
  return seats.reduce((acc, seat) => {
    (acc[seat.row] = acc[seat.row] ?? []).push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);
}
```

- [ ] **Step 1.4: Create `src/api/event.api.ts`**

```typescript
import { eventAxiosInstance } from './eventAxios';
import type { ApiResponse } from '../types/auth.types';
import type { EventSummary, Event, Venue, Seat, EventType, EventStatus } from '../types/event.types';

interface ListEventsParams {
  type?: EventType;
  status?: EventStatus;
  page?: number;
  size?: number;
}

export const eventApi = {
  listEvents: async (params: ListEventsParams): Promise<EventSummary[]> => {
    const res = await eventAxiosInstance.get<ApiResponse<EventSummary[]>>('/api/v1/events', { params });
    return res.data.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const res = await eventAxiosInstance.get<ApiResponse<Event>>(`/api/v1/events/${id}`);
    return res.data.data;
  },

  getVenue: async (id: string): Promise<Venue> => {
    const res = await eventAxiosInstance.get<ApiResponse<Venue>>(`/api/v1/venues/${id}`);
    return res.data.data;
  },

  getSeats: async (eventId: string): Promise<Seat[]> => {
    const res = await eventAxiosInstance.get<ApiResponse<Seat[]>>(`/api/v1/events/${eventId}/seats`);
    return res.data.data;
  },
};
```

- [ ] **Step 1.5: Verify TypeScript compiles**

```bash
cd /c/Users/vtnha/Working/Architect/ticketing-client
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors. Vite build may warn about missing pages (not yet created) — OK.

- [ ] **Step 1.6: Commit**

```bash
cd /c/Users/vtnha/Working/Architect/ticketing-client
git add src/api/eventAxios.ts src/types/event.types.ts src/api/event.api.ts .env.local
git commit -m "feat(catalog): add eventAxios instance, event types, and API functions"
```

---

## Task 2: React Query Hooks

**Files:**
- Create: `src/hooks/useEvents.ts`

- [ ] **Step 2.1: Create `src/hooks/useEvents.ts`**

`QueryClient` đã được setup ở `App.tsx` — không cần thêm gì.

```typescript
import { useQuery } from '@tanstack/react-query';
import { eventApi } from '../api/event.api';
import type { EventType, EventStatus } from '../types/event.types';

interface UseEventsParams {
  type?: EventType;
  status?: EventStatus;
  page?: number;
  size?: number;
}

export function useEvents(params: UseEventsParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventApi.listEvents(params),
    staleTime: 60_000,  // 1 phút — event list ít thay đổi
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventApi.getEvent(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useVenue(venueId: string | undefined) {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => eventApi.getVenue(venueId!),
    enabled: !!venueId,
    staleTime: 5 * 60_000,  // 5 phút — venue không đổi
  });
}

export function useSeats(eventId: string | undefined) {
  return useQuery({
    queryKey: ['seats', eventId],
    queryFn: () => eventApi.getSeats(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,  // 30 giây — seat status thay đổi thường
  });
}
```

- [ ] **Step 2.2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Expected: no errors related to hooks file.

- [ ] **Step 2.3: Commit**

```bash
git add src/hooks/useEvents.ts
git commit -m "feat(catalog): add React Query hooks for events, venues, seats"
```

---

## Task 3: Update HomePage — API thật thay mock data

**Files:**
- Modify: `src/pages/home/HomePage.tsx`
- Modify: `src/pages/home/HomePage.module.css`

- [ ] **Step 3.1: Thêm skeleton + error classes vào `HomePage.module.css`**

Append vào cuối file (giữ nguyên toàn bộ CSS cũ, chỉ thêm):

```css
/* Skeleton loading */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.cardSkeleton {
  background: linear-gradient(90deg, #f5f3ff 25%, #ede9fe 50%, #f5f3ff 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 1.25rem;
  height: 280px;
  border: 1.5px solid #ede9fe;
}

/* Error / Empty states */
.stateBox {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  color: #a8a29e;
}

.stateTitle {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #78716c;
}

.retryBtn {
  margin-top: 1rem;
  background: linear-gradient(135deg, #7C3AED, #6D28D9);
  color: #fff;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 3.2: Rewrite `src/pages/home/HomePage.tsx`**

Thay toàn bộ file — giữ nguyên navbar, hero, tab bar; chỉ thay phần data + cards:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import { useEvents } from '../../hooks/useEvents';
import { formatDateTime } from '../../types/event.types';
import type { EventSummary } from '../../types/event.types';
import styles from './HomePage.module.css';

function SkeletonGrid() {
  return (
    <>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={styles.cardSkeleton} />
      ))}
    </>
  );
}

function EventCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = event.imageUrls?.[0];
  const emoji = event.type === 'CONCERT' ? '🎵' : '🎬';

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardImg}>
        {imgSrc && !imgError
          ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
          : <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
        }
      </div>
      {event.status === 'SOLD_OUT' && (
        <span className={`${styles.tag} ${styles.tagSoldOut}`}>SOLD OUT</span>
      )}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{event.title}</h3>
        <p className={styles.cardSub}>📍 {event.venueName}</p>
        <div className={styles.cardMeta}>
          <span>📅 {formatDateTime(event.startTime)}</span>
        </div>
        <div className={styles.cardFooter}>
          <span />
          <button
            className={`${styles.bookBtn} ${event.status === 'SOLD_OUT' ? styles.bookBtnDisabled : ''}`}
            disabled={event.status === 'SOLD_OUT'}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            {event.status === 'SOLD_OUT' ? 'Hết vé' : 'Xem chi tiết →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'concert' | 'movie'>('concert');
  const [search, setSearch] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    authApi.getProfile().then(res => updateUser(res.data.data)).catch(() => {});
  }, []);

  const {
    data: concerts = [],
    isLoading: concertsLoading,
    error: concertsError,
    refetch: refetchConcerts,
  } = useEvents({ type: 'CONCERT', status: 'ON_SALE' });

  const {
    data: movies = [],
    isLoading: moviesLoading,
    error: moviesError,
    refetch: refetchMovies,
  } = useEvents({ type: 'MOVIE', status: 'ON_SALE' });

  const filteredConcerts = concerts.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.venueName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovies = movies.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.venueName.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => { logout(); navigate('/login'); };

  const isLoading = activeTab === 'concert' ? concertsLoading : moviesLoading;
  const error     = activeTab === 'concert' ? concertsError  : moviesError;
  const refetch   = activeTab === 'concert' ? refetchConcerts : refetchMovies;
  const items     = activeTab === 'concert' ? filteredConcerts : filteredMovies;

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>🎟 Ticketing</div>
          <div className={styles.navSearch}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Tìm kiếm sự kiện, địa điểm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.navRight}>
            <button className={styles.navBtn}>🎫 Vé của tôi</button>
            <div
              className={styles.avatar}
              title={`${user?.firstName} ${user?.lastName}`}
              onClick={() => navigate('/profile')}
            >
              {user?.profileImageUrl && !imgError
                ? <img src={user.profileImageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} onError={() => setImgError(true)} />
                : <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
              }
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Xin chào, {user?.firstName} 👋</p>
          <h1 className={styles.heroTitle}>Khám phá sự kiện<br />dành cho bạn</h1>
          <p className={styles.heroSub}>Concert · Phim · Live show · Thể thao</p>
        </div>
        <div className={styles.heroDecor}>🎪</div>
      </div>

      {/* Tab */}
      <div className={styles.tabBar}>
        <div className={styles.tabInner}>
          <button className={`${styles.tab} ${activeTab === 'concert' ? styles.tabActive : ''}`} onClick={() => setActiveTab('concert')}>
            🎵 Concert & Live Show
          </button>
          <button className={`${styles.tab} ${activeTab === 'movie' ? styles.tabActive : ''}`} onClick={() => setActiveTab('movie')}>
            🎬 Phim
          </button>
        </div>
      </div>

      {/* Content */}
      <main className={styles.main}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {activeTab === 'concert' ? '🔥 Concert nổi bật' : '🎬 Phim đang chiếu'}
          </h2>
          {!isLoading && !error && (
            <span className={styles.sectionCount}>{items.length} sự kiện</span>
          )}
        </div>

        <div className={styles.grid}>
          {isLoading && <SkeletonGrid />}

          {!isLoading && error && (
            <div className={styles.stateBox}>
              <p className={styles.stateTitle}>❌ Không thể tải dữ liệu</p>
              <p>Kiểm tra kết nối tới event-catalog-service (port 8082)</p>
              <button className={styles.retryBtn} onClick={() => refetch()}>Thử lại</button>
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className={styles.stateBox}>
              <p className={styles.stateTitle}>🔍 Không tìm thấy sự kiện</p>
              <p>{search ? `Không có kết quả cho "${search}"` : 'Hiện chưa có sự kiện nào.'}</p>
            </div>
          )}

          {!isLoading && !error && items.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3.3: Chạy dev server và verify**

```bash
cd /c/Users/vtnha/Working/Architect/ticketing-client
npm run dev
```

Mở browser tại `http://localhost:5173`. Login → vào HomePage. Kiểm tra:
- [ ] Tab Concert: hiển thị 3 concert từ API (Son Tung SKY TOUR, HIEUTHUHAI x GREY D, Avengers IMAX... wait — chỉ concert thôi)
- [ ] Tab Phim: hiển thị movie events
- [ ] Skeleton cards xuất hiện khi đang load
- [ ] Click card → navigate đến `/events/:id` (404 page OK — chưa có route)
- [ ] Search filter hoạt động theo title/venueName

Nếu thấy lỗi CORS hoặc network error: kiểm tra event-catalog-service đang chạy ở port 8082.

- [ ] **Step 3.4: Commit**

```bash
git add src/pages/home/HomePage.tsx src/pages/home/HomePage.module.css
git commit -m "feat(catalog): replace mock data with real API on HomePage, add skeleton/error/empty states"
```

---

## Task 4: EventDetailPage

**Files:**
- Create: `src/pages/events/EventDetailPage.tsx`
- Create: `src/pages/events/EventDetailPage.module.css`

- [ ] **Step 4.1: Tạo thư mục**

```bash
mkdir -p /c/Users/vtnha/Working/Architect/ticketing-client/src/pages/events
```

- [ ] **Step 4.2: Create `src/pages/events/EventDetailPage.module.css`**

```css
.page {
  min-height: 100vh;
  background: #faf9ff;
  color: #1c1427;
}

/* Back button */
.backBtn {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
  background: rgba(255,255,255,0.15);
  border: 1.5px solid rgba(255,255,255,0.3);
  color: #fff;
  padding: 0.4rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s;
}
.backBtn:hover { background: rgba(255,255,255,0.25); }

/* Hero */
.hero {
  position: relative;
  min-height: 280px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.heroConcert {
  background: linear-gradient(135deg, #2e1065 0%, #4c1d95 60%, #1e1b4b 100%);
}

.heroMovie {
  background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 60%, #1c0505 100%);
}

.heroOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.75));
}

.heroImg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.35;
}

.heroContent {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 5rem 1.5rem 2rem;
}

.badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.2rem 0.65rem;
  border-radius: 0.375rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.badgeConcert  { background: #7c3aed; color: #fff; }
.badgeMovie    { background: #dc2626; color: #fff; }
.badgeOnSale   { background: #16a34a; color: #fff; }
.badgeSoldOut  { background: #6b7280; color: #fff; }
.badgeDraft    { background: #d97706; color: #fff; }
.badgeCancelled{ background: #ef4444; color: #fff; }
.badgeImax     { background: #0891b2; color: #fff; }
.badge3d       { background: #7c3aed; color: #fff; }

.heroTitle {
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.5rem;
  line-height: 1.2;
}

.heroMeta {
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Body */
.body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 6rem;
}

/* Info cards row */
.infoRow {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.infoCard {
  background: #fff;
  border: 1.5px solid #ede9fe;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  min-width: 110px;
  flex: 1;
}

.infoLabel {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #a8a29e;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.infoValue {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1c1427;
}

.infoValueAccent { color: #7C3AED; }
.infoValueRed    { color: #dc2626; }

/* Chips (cast, genres) */
.chips {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.chip {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  color: #6D28D9;
  padding: 0.15rem 0.55rem;
  border-radius: 1rem;
  font-size: 0.78rem;
  font-weight: 500;
}

/* Section */
.section {
  background: #fff;
  border: 1.5px solid #ede9fe;
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.sectionLabel {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #a8a29e;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}

.sectionText {
  color: #44403c;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* CTA bar sticky */
.ctaBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(12px);
  border-top: 1.5px solid #ede9fe;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.ctaPrice {
  display: flex;
  flex-direction: column;
}

.ctaPriceLabel {
  font-size: 0.72rem;
  color: #a8a29e;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.ctaPriceValue {
  font-size: 1.3rem;
  font-weight: 800;
  color: #7C3AED;
}

.ctaPriceValueRed { color: #dc2626; }

.ctaBtn {
  background: linear-gradient(135deg, #7C3AED, #6D28D9);
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(124,58,237,0.35);
  white-space: nowrap;
}

.ctaBtn:hover:not(:disabled) { opacity: 0.88; }

.ctaBtnDisabled {
  background: #e7e5e4;
  color: #a8a29e;
  box-shadow: none;
  cursor: not-allowed;
}

.ctaBtnRed {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 4px 14px rgba(220,38,38,0.3);
}

/* Loading / Error / Not Found */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: #78716c;
  text-align: center;
}

.centerTitle {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1c1427;
}

.homeBtn {
  background: linear-gradient(135deg, #7C3AED, #6D28D9);
  color: #fff;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 4.3: Create `src/pages/events/EventDetailPage.tsx`**

```typescript
import { useNavigate, useParams } from 'react-router-dom';
import { useEvent } from '../../hooks/useEvents';
import {
  isConcertDetail,
  formatDateTime,
  formatPrice,
} from '../../types/event.types';
import type { ConcertDetail, MovieDetail, EventStatus } from '../../types/event.types';
import styles from './EventDetailPage.module.css';

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT:     'Sắp mở bán',
  ON_SALE:   'Đang bán',
  SOLD_OUT:  'Hết vé',
  CANCELLED: 'Đã huỷ',
  ENDED:     'Đã kết thúc',
};

const STATUS_BADGE_CLASS: Record<EventStatus, string> = {
  DRAFT:     styles.badgeDraft,
  ON_SALE:   styles.badgeOnSale,
  SOLD_OUT:  styles.badgeSoldOut,
  CANCELLED: styles.badgeCancelled,
  ENDED:     styles.badgeSoldOut,
};

function LoadingState() {
  return (
    <div className={styles.center}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p className={styles.centerTitle}>Đang tải thông tin sự kiện...</p>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.center}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <p className={styles.centerTitle}>Sự kiện không tồn tại</p>
      <p>Sự kiện này có thể đã bị xoá hoặc link không hợp lệ.</p>
      <button className={styles.homeBtn} onClick={onBack}>← Về trang chủ</button>
    </div>
  );
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(id);

  if (isLoading) return <div className={styles.page}><LoadingState /></div>;
  if (error || !event) return <div className={styles.page}><NotFoundState onBack={() => navigate('/home')} /></div>;

  const isConcert = event.type === 'CONCERT';
  const concertDetail = isConcertDetail(event.detail, event.type) ? event.detail as ConcertDetail : null;
  const movieDetail   = !isConcert ? event.detail as MovieDetail : null;

  const minPrice = event.zones.length > 0 ? Math.min(...event.zones.map(z => z.price)) : null;
  const canBook  = event.status === 'ON_SALE';
  const imgSrc   = event.imageUrls?.[0];

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={`${styles.hero} ${isConcert ? styles.heroConcert : styles.heroMovie}`}>
        {imgSrc && <img src={imgSrc} alt="" className={styles.heroImg} />}
        <div className={styles.heroOverlay} />
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Quay lại</button>
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${isConcert ? styles.badgeConcert : styles.badgeMovie}`}>
              {isConcert ? '🎵 CONCERT' : '🎬 MOVIE'}
            </span>
            {movieDetail?.format === 'IMAX' && <span className={`${styles.badge} ${styles.badgeImax}`}>IMAX</span>}
            {movieDetail?.format === '3D'   && <span className={`${styles.badge} ${styles.badge3d}`}>3D</span>}
            <span className={`${styles.badge} ${STATUS_BADGE_CLASS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
          </div>
          <h1 className={styles.heroTitle}>{event.title}</h1>
          <div className={styles.heroMeta}>
            <span>📅 {formatDateTime(event.startTime)}</span>
            <span>📍 {event.venueName}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>

        {/* Info cards — CONCERT */}
        {isConcert && concertDetail && (
          <div className={styles.infoRow}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Nghệ sĩ</div>
              <div className={styles.infoValue}>{concertDetail.artists.join(', ')}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Thể loại</div>
              <div className={styles.infoValue}>{concertDetail.genres.join(' · ')}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Độ tuổi</div>
              <div className={styles.infoValue}>
                {concertDetail.ageRestriction ? `${concertDetail.ageRestriction}+` : 'Mọi lứa tuổi'}
              </div>
            </div>
          </div>
        )}

        {/* Info cards — MOVIE */}
        {!isConcert && movieDetail && (
          <>
            <div className={styles.infoRow}>
              <div className={styles.infoCard}>
                <div className={styles.infoLabel}>Đạo diễn</div>
                <div className={styles.infoValue}>{movieDetail.director}</div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoLabel}>Thể loại</div>
                <div className={styles.infoValue}>{movieDetail.genre}</div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoLabel}>Thời lượng</div>
                <div className={styles.infoValue}>{movieDetail.durationMinutes} phút</div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoLabel}>Phân loại</div>
                <div className={`${styles.infoValue} ${styles.infoValueRed}`}>{movieDetail.rating}</div>
              </div>
            </div>
            {/* Diễn viên chips */}
            {movieDetail.cast.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Diễn viên</div>
                <div className={styles.chips}>
                  {movieDetail.cast.map((actor, i) => (
                    <span key={i} className={styles.chip}>{actor}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Mô tả */}
        {event.description && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Mô tả sự kiện</div>
            <p className={styles.sectionText}>{event.description}</p>
          </div>
        )}

        {/* Địa điểm */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Địa điểm</div>
          <p className={styles.sectionText} style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{event.venueName}</p>
          {/* Venue detail (address, capacity) — available via venueId nếu cần */}
        </div>

        {/* Zones / Giá vé */}
        {event.zones.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Khu vực & Giá vé</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              {event.zones.map(zone => (
                <div key={zone.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f5f3ff' }}>
                  <span style={{ fontWeight: 600, color: '#1c1427' }}>{zone.name}</span>
                  <span style={{ color: '#7C3AED', fontWeight: 700 }}>{formatPrice(zone.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sticky CTA bar */}
      <div className={styles.ctaBar}>
        <div className={styles.ctaPrice}>
          <span className={styles.ctaPriceLabel}>GIÁ VÉ TỪ</span>
          <span className={`${styles.ctaPriceValue} ${!isConcert ? styles.ctaPriceValueRed : ''}`}>
            {minPrice !== null ? formatPrice(minPrice) : '—'}
          </span>
        </div>
        <button
          className={`${styles.ctaBtn} ${!isConcert ? styles.ctaBtnRed : ''} ${!canBook ? styles.ctaBtnDisabled : ''}`}
          disabled={!canBook}
          onClick={() => navigate(`/events/${event.id}/seats`)}
        >
          {canBook ? '🪑 Chọn ghế' : STATUS_LABELS[event.status]}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.4: Verify trong browser**

- Từ HomePage, click vào một concert → phải thấy trang detail với hero gradient tím
- Click vào movie → hero gradient đỏ, thấy các field đạo diễn/diễn viên/thời lượng
- Button "← Quay lại" hoạt động
- Button "Chọn ghế" navigate tới `/events/:id/seats` (404 OK — chưa có route)
- Event DRAFT/CANCELLED: button disabled, hiển thị trạng thái

- [ ] **Step 4.5: Commit**

```bash
git add src/pages/events/EventDetailPage.tsx src/pages/events/EventDetailPage.module.css
git commit -m "feat(catalog): add EventDetailPage with hero layout, concert/movie branch rendering"
```

---

## Task 5: SeatMapPage

**Files:**
- Create: `src/pages/seats/SeatMapPage.tsx`
- Create: `src/pages/seats/SeatMapPage.module.css`

- [ ] **Step 5.1: Tạo thư mục**

```bash
mkdir -p /c/Users/vtnha/Working/Architect/ticketing-client/src/pages/seats
```

- [ ] **Step 5.2: Create `src/pages/seats/SeatMapPage.module.css`**

```css
.page {
  min-height: 100vh;
  background: #faf9ff;
  color: #1c1427;
  padding-bottom: 6rem;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(12px);
  border-bottom: 1.5px solid #ede9fe;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.backBtn {
  background: #f5f3ff;
  border: 1.5px solid #ddd6fe;
  color: #6D28D9;
  padding: 0.4rem 0.9rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.headerTitle {
  font-size: 1rem;
  font-weight: 700;
  color: #1c1427;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.maxHint {
  margin-left: auto;
  font-size: 0.78rem;
  color: #a8a29e;
  white-space: nowrap;
}

/* ─── CONCERT: Arc Stadium ─── */
.stadiumWrap {
  max-width: 600px;
  margin: 2rem auto 0;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stage {
  background: #e9d5ff;
  border: 2px solid #c4b5fd;
  border-radius: 0.5rem;
  padding: 0.4rem 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6D28D9;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.zone {
  width: 100%;
  border-radius: 0 0 999px 999px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  user-select: none;
}
.zone:hover { opacity: 0.88; transform: scaleX(0.98); }

.zoneVip      { background: #7c3aed; color: #fff; max-width: 65%; }
.zoneGold     { background: #d97706; color: #fff; max-width: 78%; }
.zoneGa       { background: #0f766e; color: #fff; max-width: 90%; }
.zoneStanding { background: #4b5563; color: #fff; max-width: 100%; }
.zoneActive   { outline: 3px solid #1c1427; outline-offset: 2px; }

.zoneName { font-weight: 700; font-size: 0.9rem; }
.zonePrice { font-size: 0.8rem; opacity: 0.9; }
.zoneCount { font-size: 0.75rem; opacity: 0.75; }

/* ─── Seat Grid Panel (concert zone + movie) ─── */
.seatSection {
  max-width: 900px;
  margin: 1.5rem auto 0;
  padding: 0 1.5rem;
}

.screenLabel {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #a8a29e;
  border-top: 3px solid #e7e5e4;
  padding-top: 0.6rem;
  margin-bottom: 1.25rem;
}

.seatRows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.seatRow {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.rowLabel {
  width: 1.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #a8a29e;
  text-align: center;
  flex-shrink: 0;
}

.seat {
  width: 28px;
  height: 28px;
  border-radius: 4px 4px 2px 2px;
  border: none;
  cursor: pointer;
  font-size: 0.6rem;
  font-weight: 600;
  transition: transform 0.1s, box-shadow 0.1s;
  flex-shrink: 0;
}

.seatAvailable {
  background: #d1fae5;
  color: #065f46;
  border: 1.5px solid #6ee7b7;
}
.seatAvailable:hover { transform: scale(1.15); box-shadow: 0 2px 6px rgba(16,185,129,0.4); }

.seatSelected {
  background: #7c3aed;
  color: #fff;
  border: 1.5px solid #6d28d9;
  box-shadow: 0 0 8px rgba(124,58,237,0.5);
  transform: scale(1.1);
}

.seatLocked {
  background: #fee2e2;
  color: #991b1b;
  border: 1.5px solid #fca5a5;
  cursor: not-allowed;
  opacity: 0.6;
}

.seatSold {
  background: #f3f4f6;
  color: #9ca3af;
  border: 1.5px solid #e5e7eb;
  cursor: not-allowed;
  opacity: 0.5;
}

.seatDisabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Legend */
.legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #78716c;
}

.legendDot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

/* ─── Summary Bar ─── */
.summaryBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(12px);
  border-top: 1.5px solid #ede9fe;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summarySeats {
  flex: 1;
  font-size: 0.85rem;
  color: #44403c;
}

.summarySeatsCode {
  font-weight: 700;
  color: #7C3AED;
}

.summaryTotal {
  font-size: 1.2rem;
  font-weight: 800;
  color: #7C3AED;
  white-space: nowrap;
}

.bookBtn {
  background: linear-gradient(135deg, #7C3AED, #6D28D9);
  color: #fff;
  border: none;
  padding: 0.7rem 1.75rem;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124,58,237,0.35);
  white-space: nowrap;
  transition: opacity 0.2s;
}
.bookBtn:hover { opacity: 0.88; }
.bookBtn:disabled {
  background: #e7e5e4;
  color: #a8a29e;
  box-shadow: none;
  cursor: not-allowed;
}

/* Loading */
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  color: #78716c;
  text-align: center;
}

.centerTitle { font-size: 1.1rem; font-weight: 700; color: #1c1427; }
```

- [ ] **Step 5.3: Create `src/pages/seats/SeatMapPage.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvent, useSeats } from '../../hooks/useEvents';
import { groupSeatsByRow, formatPrice } from '../../types/event.types';
import type { Seat, EventZone } from '../../types/event.types';
import styles from './SeatMapPage.module.css';

const MAX_SEATS = 4;

const ZONE_CLASS: Record<string, string> = {
  VIP:      styles.zoneVip,
  GOLD:     styles.zoneGold,
  GA:       styles.zoneGa,
  STANDING: styles.zoneStanding,
};

function SeatButton({
  seat,
  isSelected,
  maxReached,
  onToggle,
}: {
  seat: Seat;
  isSelected: boolean;
  maxReached: boolean;
  onToggle: (seat: Seat) => void;
}) {
  const isAvailable = seat.status === 'AVAILABLE';
  const isLocked    = seat.status === 'LOCKED';

  let cls = styles.seat;
  if (isSelected)           cls += ` ${styles.seatSelected}`;
  else if (isLocked)        cls += ` ${styles.seatLocked}`;
  else if (!isAvailable)    cls += ` ${styles.seatSold}`;
  else if (maxReached)      cls += ` ${styles.seatAvailable} ${styles.seatDisabled}`;
  else                      cls += ` ${styles.seatAvailable}`;

  const disabled = !isAvailable || (maxReached && !isSelected);

  return (
    <button
      className={cls}
      disabled={disabled}
      title={`${seat.code} — ${formatPrice(seat.price)}`}
      onClick={() => !disabled && onToggle(seat)}
    >
      {seat.seatNumber}
    </button>
  );
}

function SeatGrid({
  seats,
  selectedIds,
  maxReached,
  onToggle,
}: {
  seats: Seat[];
  selectedIds: Set<string>;
  maxReached: boolean;
  onToggle: (seat: Seat) => void;
}) {
  const grouped = groupSeatsByRow(seats);
  const rows = Object.keys(grouped).sort();

  return (
    <div className={styles.seatSection}>
      <div className={styles.screenLabel}>📽 MÀN HÌNH / SÂN KHẤU</div>
      <div className={styles.seatRows}>
        {rows.map(row => (
          <div key={row} className={styles.seatRow}>
            <span className={styles.rowLabel}>{row}</span>
            {grouped[row]
              .sort((a, b) => a.seatNumber - b.seatNumber)
              .map(seat => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedIds.has(seat.id)}
                  maxReached={maxReached}
                  onToggle={onToggle}
                />
              ))
            }
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#d1fae5', border: '1.5px solid #6ee7b7' }} />
          Còn trống
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#7c3aed' }} />
          Đang chọn
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#fee2e2', border: '1.5px solid #fca5a5' }} />
          Đang giữ
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#f3f4f6', border: '1.5px solid #e5e7eb' }} />
          Đã bán
        </div>
      </div>
    </div>
  );
}

export default function SeatMapPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: allSeats = [], isLoading: seatsLoading } = useSeats(id);

  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const isLoading = eventLoading || seatsLoading;
  const isConcert = event?.type === 'CONCERT';

  const toggleSeat = (seat: Seat) => {
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id);
      if (exists) return prev.filter(s => s.id !== seat.id);
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, seat];
    });
  };

  const selectedIds  = new Set(selectedSeats.map(s => s.id));
  const maxReached   = selectedSeats.length >= MAX_SEATS;
  const totalPrice   = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Seats hiển thị: concert → lọc theo zone đang active, movie → tất cả
  const displaySeats = isConcert && activeZone
    ? allSeats.filter(s => s.zone === activeZone)
    : !isConcert
      ? allSeats
      : [];

  // Zone stats cho concert
  const zoneStats = (event?.zones ?? []).map((zone: EventZone) => {
    const zoneSeats = allSeats.filter(s => s.zone === zone.name);
    const available = zoneSeats.filter(s => s.status === 'AVAILABLE').length;
    return { ...zone, available, total: zoneSeats.length };
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <p className={styles.centerTitle}>Đang tải sơ đồ ghế...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <div style={{ fontSize: '2rem' }}>❌</div>
          <p className={styles.centerTitle}>Không tìm thấy sự kiện</p>
          <button className={styles.backBtn} onClick={() => navigate('/home')}>← Về trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Quay lại</button>
        <span className={styles.headerTitle}>{event.title}</span>
        <span className={styles.maxHint}>Tối đa {MAX_SEATS} ghế</span>
      </div>

      {/* CONCERT — Arc Stadium */}
      {isConcert && (
        <div className={styles.stadiumWrap}>
          <div className={styles.stage}>SÂN KHẤU</div>
          {zoneStats.map(zone => (
            <div
              key={zone.name}
              className={`${styles.zone} ${ZONE_CLASS[zone.name] ?? styles.zoneStanding} ${activeZone === zone.name ? styles.zoneActive : ''}`}
              onClick={() => setActiveZone(prev => prev === zone.name ? null : zone.name)}
            >
              <span className={styles.zoneName}>{zone.name}</span>
              <span className={styles.zonePrice}>{formatPrice(zone.price)}</span>
              <span className={styles.zoneCount}>{zone.available} ghế trống</span>
            </div>
          ))}
        </div>
      )}

      {/* Seat grid — concert (khi đã chọn zone) hoặc movie (luôn hiển thị) */}
      {(!isConcert || activeZone) && (
        <>
          {isConcert && activeZone && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
              Zone {activeZone} — {formatPrice(zoneStats.find(z => z.name === activeZone)?.price ?? 0)}/ghế
            </div>
          )}
          <SeatGrid
            seats={displaySeats}
            selectedIds={selectedIds}
            maxReached={maxReached}
            onToggle={toggleSeat}
          />
        </>
      )}

      {/* Concert hint khi chưa chọn zone */}
      {isConcert && !activeZone && (
        <div className={styles.center} style={{ minHeight: '30vh' }}>
          <div style={{ fontSize: '2rem' }}>☝️</div>
          <p>Click vào khu vực để xem và chọn ghế</p>
        </div>
      )}

      {/* Summary Bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summarySeats}>
          {selectedSeats.length === 0
            ? 'Chưa chọn ghế nào'
            : <>Đã chọn: <span className={styles.summarySeatsCode}>{selectedSeats.map(s => s.code).join(', ')}</span> · {selectedSeats.length} ghế</>
          }
        </div>
        {selectedSeats.length > 0 && (
          <span className={styles.summaryTotal}>{formatPrice(totalPrice)}</span>
        )}
        <button
          className={styles.bookBtn}
          disabled={selectedSeats.length === 0}
          onClick={() => navigate('/bookings/new', {
            state: { eventId: event.id, selectedSeats }
          })}
        >
          Đặt vé →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.4: Verify trong browser**

Test concert flow:
- [ ] Từ EventDetailPage (concert) → click "Chọn ghế" → vào SeatMapPage
- [ ] Thấy arc stadium: VIP (tím) → GOLD (cam) → GA (teal) → STANDING (xám)
- [ ] Click vào zone VIP → thấy seat grid với ghế A1, A2...
- [ ] Click ghế xanh → chuyển sang tím (selected), summary bar hiện code ghế
- [ ] Click thêm đến ghế thứ 5 → không cho chọn (max 4)
- [ ] Click lại ghế đã chọn → bỏ chọn

Test movie flow:
- [ ] Từ EventDetailPage (movie) → click "Chọn ghế" → vào SeatMapPage
- [ ] Thấy ngay grid tất cả ghế (không có arc)
- [ ] Logic chọn ghế giống concert

- [ ] **Step 5.5: Commit**

```bash
git add src/pages/seats/SeatMapPage.tsx src/pages/seats/SeatMapPage.module.css
git commit -m "feat(catalog): add SeatMapPage — arc stadium for concert, grid for movie, max 4 seats"
```

---

## Task 6: Update Router

**Files:**
- Modify: `src/router/index.tsx`

- [ ] **Step 6.1: Update `src/router/index.tsx`**

Thêm 2 import và 2 route mới:

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import HomePage from '../pages/home/HomePage';
import ProfilePage from '../pages/profile/ProfilePage';
import CallbackPage from '../pages/auth/CallbackPage';
import EventDetailPage from '../pages/events/EventDetailPage';
import SeatMapPage from '../pages/seats/SeatMapPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/home" replace /> : <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/',                element: <Navigate to="/login" replace /> },
  { path: '/login',          element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/register',       element: <PublicRoute><RegisterPage /></PublicRoute> },
  { path: '/forgot-password',element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
  { path: '/reset-password', element: <PublicRoute><ResetPasswordPage /></PublicRoute> },
  { path: '/home',           element: <PrivateRoute><HomePage /></PrivateRoute> },
  { path: '/profile',        element: <PrivateRoute><ProfilePage /></PrivateRoute> },
  { path: '/events/:id',     element: <PrivateRoute><EventDetailPage /></PrivateRoute> },
  { path: '/events/:id/seats', element: <PrivateRoute><SeatMapPage /></PrivateRoute> },
  { path: '/auth/callback',  element: <CallbackPage /> },
]);
```

- [ ] **Step 6.2: Full E2E flow test**

```bash
npm run dev
```

Chạy toàn bộ flow:
- [ ] Login → HomePage: thấy events thật từ API
- [ ] Click concert → EventDetailPage: hero tím, nghệ sĩ/thể loại/độ tuổi
- [ ] Click "Chọn ghế" → SeatMapPage: arc stadium, chọn ghế, summary bar
- [ ] Back → EventDetailPage → Back → HomePage
- [ ] Click movie → EventDetailPage: hero đỏ, đạo diễn/diễn viên/thời lượng
- [ ] Click "Chọn ghế" → SeatMapPage: grid rạp
- [ ] Search "Son" trên HomePage → filter works
- [ ] TypeScript: `npm run build` không có error

- [ ] **Step 6.3: Final commit**

```bash
git add src/router/index.tsx
git commit -m "feat(catalog): add /events/:id and /events/:id/seats routes — complete event catalog client"
```

---

## Self-Review

**Spec coverage check:**
- ✅ HomePage API thật — Task 3
- ✅ Loading skeleton — Task 3, Step 3.1
- ✅ Error + retry — Task 3, Step 3.2
- ✅ Empty state — Task 3, Step 3.2
- ✅ Click card → navigate — Task 3, Step 3.2
- ✅ EventDetailPage layout A (hero) — Task 4
- ✅ Concert branch: artists, genres, ageRestriction — Task 4, Step 4.3
- ✅ Movie branch: director, cast, duration, format, rating — Task 4, Step 4.3
- ✅ Hero color: tím concert, đỏ movie — Task 4, Step 4.2
- ✅ CTA disabled khi CANCELLED/ENDED — Task 4, Step 4.3
- ✅ SeatMapPage concert: arc stadium zones — Task 5, Step 5.3
- ✅ SeatMapPage movie: grid tất cả ghế — Task 5, Step 5.3
- ✅ Seat selection states (available/locked/sold/selected) — Task 5, Step 5.3
- ✅ Max 4 ghế business rule — Task 5, Step 5.3
- ✅ Summary bar sticky với total price — Task 5, Step 5.3
- ✅ Routes wired up — Task 6
- ✅ eventAxiosInstance riêng port 8082 — Task 1
- ✅ Types khớp backend DTOs — Task 1, Step 1.3

**Placeholder check:** Không có TBD/TODO trong code steps.

**Type consistency:** `EventSummary`, `Event`, `Venue`, `Seat`, `EventZone`, `ConcertDetail`, `MovieDetail` — defined Task 1, used consistently Task 3/4/5. `formatDateTime`, `formatPrice`, `groupSeatsByRow`, `isConcertDetail` helpers defined Task 1, used Task 3/4/5. `useEvents`, `useEvent`, `useVenue`, `useSeats` defined Task 2, used Task 3/4/5. ✅

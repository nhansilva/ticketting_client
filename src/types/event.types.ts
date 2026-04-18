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

/** From GET /api/v1/events (list) — EventSummaryResponse */
export interface EventSummary {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  venueName: string;
  startTime: string;        // ISO 8601: "2026-06-20T19:00:00"
  imageUrls: string[];
}

/** From GET /api/v1/events/{id} (detail) — EventResponse */
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

/** From GET /api/v1/venues/{id} */
export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
}

/** From GET /api/v1/events/{id}/seats — SeatResponse */
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
  return type === 'CONCERT' && 'artists' in detail;
}

/** Helper — format LocalDateTime from backend to "20/06/2026 · 19:00" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/** Helper — format number to "1.200.000đ" */
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

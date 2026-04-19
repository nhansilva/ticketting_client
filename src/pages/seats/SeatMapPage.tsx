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
  if (isSelected)        cls += ` ${styles.seatSelected}`;
  else if (isLocked)     cls += ` ${styles.seatLocked}`;
  else if (!isAvailable) cls += ` ${styles.seatSold}`;
  else if (maxReached)   cls += ` ${styles.seatAvailable} ${styles.seatDisabled}`;
  else                   cls += ` ${styles.seatAvailable}`;

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

  const selectedIds = new Set(selectedSeats.map(s => s.id));
  const maxReached  = selectedSeats.length >= MAX_SEATS;
  const totalPrice  = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Concert → filter by active zone; Movie → show all seats
  const displaySeats = isConcert && activeZone
    ? allSeats.filter(s => s.zone === activeZone)
    : !isConcert
      ? allSeats
      : [];

  // Zone stats for concert arc
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

      {/* Seat grid — concert (after zone selected) or movie (always) */}
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

      {/* Concert hint when no zone selected */}
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
            : (
              <>Đã chọn: <span className={styles.summarySeatsCode}>{selectedSeats.map(s => s.code).join(', ')}</span> · {selectedSeats.length} ghế</>
            )
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

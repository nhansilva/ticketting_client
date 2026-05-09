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

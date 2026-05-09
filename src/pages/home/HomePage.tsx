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
          <button
            className={`${styles.tab} ${activeTab === 'concert' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('concert')}
          >
            🎵 Concert & Live Show
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'movie' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('movie')}
          >
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

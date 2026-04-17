import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import styles from './HomePage.module.css';

const MOCK_CONCERTS = [
  { id: 1, title: 'Anh Trai Say Hi', artist: 'Various Artists', date: '20/06/2026', venue: 'Mỹ Đình, Hà Nội', price: '800.000đ', tag: 'HOT', img: '🎤' },
  { id: 2, title: 'Coldplay World Tour', artist: 'Coldplay', date: '15/07/2026', venue: 'Thống Nhất, TP.HCM', price: '1.500.000đ', tag: 'SOLD OUT', img: '🎸' },
  { id: 3, title: 'Son Tung M-TP Live', artist: 'Sơn Tùng M-TP', date: '10/08/2026', venue: 'Quân Khu 7, TP.HCM', price: '600.000đ', tag: 'MỚI', img: '🎵' },
  { id: 4, title: 'Đen Vâu Concert', artist: 'Đen Vâu', date: '05/09/2026', venue: 'Phú Thọ, TP.HCM', price: '500.000đ', tag: '', img: '🎶' },
];

const MOCK_MOVIES = [
  { id: 1, title: 'Kẻ Trộm Mặt Trăng 4', genre: 'Hoạt hình', duration: '95 phút', rating: 'P', price: '85.000đ', img: '🌙' },
  { id: 2, title: 'Avengers: Doomsday', genre: 'Hành động', duration: '150 phút', rating: 'T13', price: '120.000đ', img: '⚡' },
  { id: 3, title: 'Lật Mặt 8', genre: 'Hành động', duration: '128 phút', rating: 'T16', price: '90.000đ', img: '🎬' },
  { id: 4, title: 'Mai 2', genre: 'Tình cảm', duration: '115 phút', rating: 'T13', price: '95.000đ', img: '🌸' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'concert' | 'movie'>('concert');
  const [imgError, setImgError] = useState(false);

  // Fetch fresh profile to get latest profileImageUrl
  useEffect(() => {
    authApi.getProfile().then(res => updateUser(res.data.data)).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredConcerts = MOCK_CONCERTS.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.artist.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovies = MOCK_MOVIES.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genre.toLowerCase().includes(search.toLowerCase())
  );

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
              placeholder="Tìm kiếm sự kiện, phim..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.navRight}>
            <button className={styles.navBtn}>🎫 Vé của tôi</button>
            <div
              className={styles.avatar}
              title={`${user?.firstName} ${user?.lastName} — Xem profile`}
              onClick={() => navigate('/profile')}
            >
              {user?.profileImageUrl && !imgError
                ? <img
                    src={user.profileImageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => setImgError(true)}
                  />
                : <>{user?.firstName?.[0]}{user?.lastName?.[0]}</>
              }
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Xin chào, {user?.firstName} 👋</p>
          <h1 className={styles.heroTitle}>Khám phá sự kiện<br />dành cho bạn</h1>
          <p className={styles.heroSub}>Concert · Phim · Live show · Thể thao</p>
        </div>
        <div className={styles.heroDecor}>🎪</div>
      </div>

      {/* Tab Switch */}
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
        {activeTab === 'concert' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>🔥 Concert nổi bật</h2>
              <span className={styles.sectionCount}>{filteredConcerts.length} sự kiện</span>
            </div>
            <div className={styles.grid}>
              {filteredConcerts.map(event => (
                <div key={event.id} className={styles.card}>
                  <div className={styles.cardImg}>{event.img}</div>
                  {event.tag && (
                    <span className={`${styles.tag} ${event.tag === 'SOLD OUT' ? styles.tagSoldOut : event.tag === 'HOT' ? styles.tagHot : styles.tagNew}`}>
                      {event.tag}
                    </span>
                  )}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    <p className={styles.cardSub}>{event.artist}</p>
                    <div className={styles.cardMeta}>
                      <span>📅 {event.date}</span>
                      <span>📍 {event.venue}</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.price}>Từ {event.price}</span>
                      <button
                        className={`${styles.bookBtn} ${event.tag === 'SOLD OUT' ? styles.bookBtnDisabled : ''}`}
                        disabled={event.tag === 'SOLD OUT'}
                      >
                        {event.tag === 'SOLD OUT' ? 'Hết vé' : 'Đặt vé'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'movie' && (
          <>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>🎬 Phim đang chiếu</h2>
              <span className={styles.sectionCount}>{filteredMovies.length} phim</span>
            </div>
            <div className={styles.grid}>
              {filteredMovies.map(movie => (
                <div key={movie.id} className={styles.card}>
                  <div className={styles.cardImg}>{movie.img}</div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{movie.title}</h3>
                    <p className={styles.cardSub}>{movie.genre} · {movie.duration}</p>
                    <div className={styles.cardMeta}>
                      <span className={styles.ratingBadge}>{movie.rating}</span>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.price}>Từ {movie.price}</span>
                      <button className={styles.bookBtn}>Đặt vé</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

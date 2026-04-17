import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>🎟 Ticketing</div>
        <div className={styles.navRight}>
          <span className={styles.navUser}>
            {user?.firstName} {user?.lastName}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.welcome}>
          <h1>Xin chào, {user?.firstName}! 👋</h1>
          <p>Chào mừng đến với hệ thống đặt vé sự kiện.</p>
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎵</div>
            <h3>Concert</h3>
            <p>Khám phá các buổi hoà nhạc</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎬</div>
            <h3>Phim</h3>
            <p>Đặt vé xem phim</p>
          </div>
          <div className={styles.card}>
            <div className={styles.cardIcon}>🎫</div>
            <h3>Vé của tôi</h3>
            <p>Xem lịch sử đặt vé</p>
          </div>
        </div>
      </main>
    </div>
  );
}

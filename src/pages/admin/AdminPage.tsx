import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import styles from './AdminPage.module.css';

const MOCK_USERS = [
  { id: 1, name: 'Nguyễn Văn A', email: 'a@gmail.com', role: 'USER' },
  { id: 2, name: 'Trần Thị B', email: 'b@gmail.com', role: 'ADMIN' },
  { id: 3, name: 'Lê Văn C', email: 'c@gmail.com', role: 'USER' },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>⚙ Admin</h2>
        <nav>
          <button className={styles.menuItem}>📊 Dashboard</button>
          <button className={styles.menuItem}>👤 Users</button>
          <button className={styles.menuItem}>🎫 Tickets</button>
        </nav>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Navbar */}
        <div className={styles.nav}>
          <h1>Xin chào, {user?.firstName} 👋</h1>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Đăng xuất
          </button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.card}>
            <h3>Users</h3>
            <p>120</p>
          </div>
          <div className={styles.card}>
            <h3>Tickets</h3>
            <p>540</p>
          </div>
          <div className={styles.card}>
            <h3>Revenue</h3>
            <p>120M</p>
          </div>
        </div>

        {/* User Table */}
        <div className={styles.tableContainer}>
          <h2>Quản lý người dùng</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
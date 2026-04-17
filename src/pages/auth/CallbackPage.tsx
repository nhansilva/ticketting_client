import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import styles from './AuthPage.module.css';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token        = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam   = searchParams.get('error');

    if (errorParam) {
      setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
      return;
    }

    if (!token || !refreshToken) {
      setError('Token không hợp lệ.');
      return;
    }

    // Lấy profile với token nhận được
    authApi.getProfile(token)
      .then(res => {
        setAuth(res.data.data, token, refreshToken);
        navigate('/home', { replace: true });
      })
      .catch(() => {
        setError('Không thể lấy thông tin tài khoản. Vui lòng thử lại.');
      });
  }, []);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>⚠️</div>
            <h1 className={styles.title}>Đăng nhập thất bại</h1>
            <p className={styles.subtitle}>{error}</p>
          </div>
          <button className={styles.button} onClick={() => navigate('/login')}>
            Quay lại đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>⏳</div>
          <h1 className={styles.title}>Đang xử lý...</h1>
          <p className={styles.subtitle}>Vui lòng chờ trong giây lát</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <span className={styles.spinner} style={{ width: '2rem', height: '2rem', borderWidth: '3px' }} />
        </div>
      </div>
    </div>
  );
}

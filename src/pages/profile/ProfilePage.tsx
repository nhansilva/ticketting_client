import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import type { UpdateProfileRequest, ChangePasswordRequest } from '../../types/auth.types';
import styles from './ProfilePage.module.css';

type Tab = 'info' | 'password';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Fetch fresh profile on mount to get latest profileImageUrl
  useEffect(() => {
    authApi.getProfile()
      .then(res => updateUser(res.data.data))
      .catch(() => {/* use store data as fallback */})
      .finally(() => setLoadingProfile(false));
  }, []);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState<UpdateProfileRequest>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    dateOfBirth: '',
  });

  // Password form state
  const [pwForm, setPwForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    PENDING_VERIFICATION: 'Chờ xác thực',
    INACTIVE: 'Không hoạt động',
    SUSPENDED: 'Bị khoá',
    DELETED: 'Đã xoá',
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await authApi.updateProfile(profileForm);
      updateUser(res.data.data);
      setSaveSuccess('Cập nhật thông tin thành công!');
      setEditing(false);
    } catch (e: any) {
      setSaveError(e?.response?.data?.error?.message ?? 'Có lỗi xảy ra, thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileCancel = () => {
    setProfileForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      dateOfBirth: '',
    });
    setEditing(false);
    setSaveError('');
    setSaveSuccess('');
  };

  const handlePasswordChange = async () => {
    setPwError('');
    setPwSuccess('');
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwError('Mật khẩu mới không khớp.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('Mật khẩu mới phải ít nhất 8 ký tự.');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pwForm);
      setPwSuccess('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (e: any) {
      setPwError(e?.response?.data?.error?.message ?? 'Có lỗi xảy ra, thử lại.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <button className={styles.navBrand} onClick={() => navigate('/home')}>
            🎟 Ticketing
          </button>
          <div className={styles.navRight}>
            <button className={styles.navBack} onClick={() => navigate('/home')}>
              ← Trang chủ
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
          </div>
        </div>
      </nav>

      <div className={styles.content}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            {loadingProfile ? (
              <div className={styles.avatarSkeleton} />
            ) : user?.profileImageUrl && !imgError ? (
              <img
                src={user.profileImageUrl}
                alt={fullName}
                className={styles.avatarImg}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.avatarInitials}>{initials}</div>
            )}
          </div>
          <div className={styles.profileMeta}>
            <h1 className={styles.profileName}>{fullName}</h1>
            <p className={styles.profileEmail}>{user?.email}</p>
            <div className={styles.profileBadges}>
              <span className={`${styles.badge} ${styles.badgeRole}`}>
                {user?.role === 'ADMIN' ? '👑 Admin' : '🎫 Khách hàng'}
              </span>
              <span className={`${styles.badge} ${user?.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                {statusLabel[user?.status ?? ''] ?? user?.status}
              </span>
              {user?.emailVerified && (
                <span className={`${styles.badge} ${styles.badgeVerified}`}>✓ Email đã xác thực</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'info' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('info'); setSaveError(''); setSaveSuccess(''); setEditing(false); }}
          >
            👤 Thông tin cá nhân
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'password' ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab('password'); setPwError(''); setPwSuccess(''); }}
          >
            🔒 Đổi mật khẩu
          </button>
        </div>

        {/* Tab: Thông tin cá nhân */}
        {activeTab === 'info' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Thông tin cá nhân</h2>
              {!editing && (
                <button className={styles.editBtn} onClick={() => setEditing(true)}>
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>

            {saveSuccess && <div className={styles.alertSuccess}>{saveSuccess}</div>}
            {saveError && <div className={styles.alertError}>{saveError}</div>}

            <div className={styles.fieldGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Họ</label>
                {editing ? (
                  <input
                    className={styles.input}
                    value={profileForm.firstName}
                    onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Nhập họ"
                  />
                ) : (
                  <p className={styles.value}>{user?.firstName || '—'}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tên</label>
                {editing ? (
                  <input
                    className={styles.input}
                    value={profileForm.lastName}
                    onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Nhập tên"
                  />
                ) : (
                  <p className={styles.value}>{user?.lastName || '—'}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Email</label>
                <p className={styles.value}>{user?.email}</p>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Số điện thoại</label>
                {editing ? (
                  <input
                    className={styles.input}
                    value={profileForm.phoneNumber ?? ''}
                    onChange={e => setProfileForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="0912345678"
                  />
                ) : (
                  <p className={styles.value}>{user?.phoneNumber || '—'}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ngày sinh</label>
                {editing ? (
                  <input
                    className={styles.input}
                    type="date"
                    value={profileForm.dateOfBirth ?? ''}
                    onChange={e => setProfileForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                ) : (
                  <p className={styles.value}>{user?.createdAt ? '—' : '—'}</p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tham gia</label>
                <p className={styles.value}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                </p>
              </div>
            </div>

            {editing && (
              <div className={styles.actions}>
                <button className={styles.cancelBtn} onClick={handleProfileCancel} disabled={saving}>
                  Huỷ
                </button>
                <button className={styles.saveBtn} onClick={handleProfileSave} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Đổi mật khẩu */}
        {activeTab === 'password' && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Đổi mật khẩu</h2>
            </div>

            {pwSuccess && <div className={styles.alertSuccess}>{pwSuccess}</div>}
            {pwError && <div className={styles.alertError}>{pwError}</div>}

            <div className={styles.fieldStack}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Mật khẩu hiện tại</label>
                <input
                  className={styles.input}
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu hiện tại"
                  autoComplete="current-password"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Mật khẩu mới</label>
                <input
                  className={styles.input}
                  type="password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Tối thiểu 8 ký tự"
                  autoComplete="new-password"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Xác nhận mật khẩu mới</label>
                <input
                  className={styles.input}
                  type="password"
                  value={pwForm.confirmNewPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.saveBtn}
                onClick={handlePasswordChange}
                disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmNewPassword}
              >
                {pwSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import styles from './AuthPage.module.css';

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      setServerError('Token không hợp lệ hoặc đã hết hạn');
      return;
    }
    setServerError(null);
    try {
      await authApi.resetPassword(token, data.newPassword, data.confirmPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setServerError(error.response?.data?.error?.message ?? 'Token không hợp lệ hoặc đã hết hạn');
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>✅</div>
            <h1 className={styles.title}>Đặt lại thành công</h1>
            <p className={styles.subtitle}>
              Mật khẩu đã được cập nhật.<br />
              Đang chuyển đến trang đăng nhập...
            </p>
          </div>
          <Link to="/login" className={styles.button} style={{ textDecoration: 'none', textAlign: 'center' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>⚠️</div>
            <h1 className={styles.title}>Link không hợp lệ</h1>
            <p className={styles.subtitle}>Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          </div>
          <Link to="/forgot-password" className={styles.button} style={{ textDecoration: 'none', textAlign: 'center' }}>
            Gửi lại link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🔑</div>
          <h1 className={styles.title}>Đặt lại mật khẩu</h1>
          <p className={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Mật khẩu mới</label>
            <input
              {...register('newPassword')}
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
              autoComplete="new-password"
              autoFocus
            />
            {errors.newPassword && <span className={styles.error}>{errors.newPassword.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Xác nhận mật khẩu</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
          </div>

          {serverError && (
            <div className={styles.serverError}>{serverError}</div>
          )}

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.spinner} /> : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

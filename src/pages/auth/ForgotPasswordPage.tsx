import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import styles from './AuthPage.module.css';

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setServerError(error.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  if (sent) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>✉️</div>
            <h1 className={styles.title}>Kiểm tra email</h1>
            <p className={styles.subtitle}>
              Chúng tôi đã gửi link đặt lại mật khẩu đến<br />
              <strong style={{ color: '#a78bfa' }}>{getValues('email')}</strong>
              <br /><br />
              Link có hiệu lực trong <strong>1 giờ</strong>.
            </p>
          </div>
          <Link to="/login" className={styles.button} style={{ textDecoration: 'none', textAlign: 'center' }}>
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🔐</div>
          <h1 className={styles.title}>Quên mật khẩu</h1>
          <p className={styles.subtitle}>
            Nhập email đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@example.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          {serverError && (
            <div className={styles.serverError}>{serverError}</div>
          )}

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.spinner} /> : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

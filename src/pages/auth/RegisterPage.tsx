import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import styles from './AuthPage.module.css';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ'),
  lastName: z.string().min(1, 'Vui lòng nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  phoneNumber: z.string().optional(),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setServerError(error.response?.data?.error?.message ?? 'Đăng ký thất bại');
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>✉️</div>
            <h1 className={styles.title}>Kiểm tra email</h1>
            <p className={styles.subtitle}>
              Chúng tôi đã gửi link xác thực đến email của bạn.
              Vui lòng xác thực trước khi đăng nhập.
            </p>
          </div>
          <button className={styles.button} onClick={() => navigate('/login')}>
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>🎟</div>
          <h1 className={styles.title}>Tạo tài khoản</h1>
          <p className={styles.subtitle}>Đăng ký để bắt đầu đặt vé</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Họ</label>
              <input
                {...register('firstName')}
                placeholder="Nguyễn"
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
              />
              {errors.firstName && <span className={styles.error}>{errors.firstName.message}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tên</label>
              <input
                {...register('lastName')}
                placeholder="Văn A"
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
              />
              {errors.lastName && <span className={styles.error}>{errors.lastName.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@example.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              autoComplete="email"
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Số điện thoại <span className={styles.optional}>(tuỳ chọn)</span></label>
            <input
              {...register('phoneNumber')}
              type="tel"
              placeholder="0901234567"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Mật khẩu</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              autoComplete="new-password"
            />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Xác nhận mật khẩu</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Nhập lại mật khẩu"
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
          </div>

          {serverError && (
            <div className={styles.serverError}>{serverError}</div>
          )}

          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? <span className={styles.spinner} /> : 'Tạo tài khoản'}
          </button>
        </form>

        <p className={styles.footer}>
          Đã có tài khoản?{' '}
          <Link to="/login" className={styles.link}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AppProvider';
import styles from './LoginPage.module.css';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (!formData.phone_number.trim()) {
      setError('전화번호를 입력해주세요');
      return;
    }

    if (!formData.password) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        phone_number: formData.phone_number,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: true
      });
      onClose();
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>회원가입</h2>
          <button
            className={styles.modalCloseButton}
            onClick={onClose}
            type="button"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="register-name" className={styles.label}>
              이름
            </label>
            <input
              id="register-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="홍길동"
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-phone" className={styles.label}>
              전화번호
            </label>
            <input
              id="register-phone"
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className={styles.input}
              placeholder="010-1234-5678"
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-password" className={styles.label}>
              비밀번호
            </label>
            <input
              id="register-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-confirm-password" className={styles.label}>
              비밀번호 확인
            </label>
            <input
              id="register-confirm-password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="••••••"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    phone_number: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!credentials.phone_number.trim()) {
      setError('전화번호를 입력해주세요');
      return;
    }

    if (!credentials.password) {
      setError('비밀번호를 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      await login({
        phone_number: credentials.phone_number,
        password: credentials.password
      });
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>🛒</div>
            <h1 className={styles.title}>Shopping Assistant</h1>
            <p className={styles.subtitle}>AI 기반 쇼핑 비서 서비스</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="phone_number" className={styles.label}>
                전화번호
              </label>
              <input
                id="phone_number"
                type="tel"
                name="phone_number"
                value={credentials.phone_number}
                onChange={handleChange}
                className={styles.input}
                placeholder="010-1234-5678"
                disabled={isLoading}
                autoComplete="tel"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="비밀번호를 입력하세요"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>또는</span>
          </div>

          <button
            type="button"
            className={styles.registerButton}
            onClick={() => setShowRegisterModal(true)}
            disabled={isLoading}
          >
            회원가입
          </button>
        </div>
      </div>

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  );
};

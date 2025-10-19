import React, { useState } from 'react';
import styles from './RecommendationWeightModal.module.css';

interface RecommendationWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: number) => void;
}

export const RecommendationWeightModal: React.FC<RecommendationWeightModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(rating, review);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>⚙️ 추천 설정</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <p className={styles.description}>
            상품 추천 시 중요하게 생각하는 요소의 가중치를 설정해주세요.
          </p>

          {/* 평점 가중치 */}
          <div className={styles.inputGroup}>
            <label htmlFor="rating" className={styles.label}>
              ⭐ 평점 가중치
            </label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                id="rating"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.value}>{rating}</span>
            </div>
            <p className={styles.hint}>
              평점이 높은 상품을 우선적으로 추천합니다
            </p>
          </div>

          {/* 리뷰 수 가중치 */}
          <div className={styles.inputGroup}>
            <label htmlFor="review" className={styles.label}>
              💬 리뷰 수 가중치
            </label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                id="review"
                min="1"
                max="10"
                value={review}
                onChange={(e) => setReview(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.value}>{review}</span>
            </div>
            <p className={styles.hint}>
              리뷰가 많은 상품을 우선적으로 추천합니다
            </p>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
            >
              추천 받기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

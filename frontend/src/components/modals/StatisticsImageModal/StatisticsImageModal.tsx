import React from 'react';
import styles from './StatisticsImageModal.module.css';

// Type 2: 채팅 응답에서 받은 통계 이미지
interface StatisticsImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;  // 백엔드에서 받은 통계 이미지 URL
  title?: string;    // 선택적 제목
}

export const StatisticsImageModal: React.FC<StatisticsImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = '결제 통계'
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    // 이미지 다운로드 기능
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `statistics-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>📊 {title}</h2>
          <div className={styles.headerActions}>
            <button
              className={styles.downloadButton}
              onClick={handleDownload}
              aria-label="이미지 다운로드"
              title="이미지 다운로드"
            >
              ⬇️
            </button>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.imageContainer}>
            <img
              src={imageUrl}
              alt="결제 통계"
              className={styles.statisticsImage}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="16"%3E이미지를 불러올 수 없습니다%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Image Info */}
          <div className={styles.imageInfo}>
            <p className={styles.infoText}>
              💡 이미지를 클릭하면 원본 크기로 볼 수 있습니다
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.closeFooterButton}
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

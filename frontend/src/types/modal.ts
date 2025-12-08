// Modal Types
export interface ProductModalData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  url?: string; // 외부 쇼핑몰 URL
  description?: string;
  platformName?: string;
  cartIndex?: number;
}

export interface ModalState {
  isOpen: boolean;
  product: ProductModalData | null;
  isLoading: boolean;
  error: string | null;
}

export interface ModalContextValue extends ModalState {
  openProductModal: (product: ProductModalData) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

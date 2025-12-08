import { AnimationConfig } from './index';
import { Product } from './cart';

export type PanelType =
  | 'coupang'
  | 'statistics'
  | 'productGrid'
  | 'comparison'
  | 'reviews'
  | 'product-list'
  | 'product-detail'
  | 'recommendations'
  | 'search-results'
  | 'category';

export interface PanelData {
  type: PanelType;
  data?: CoupangData | StatisticsData | ProductGridData | ComparisonData | ReviewsData | any;
  height?: number;
  title?: string;
  subtitle?: string;
  animationConfig?: AnimationConfig;
  expandable?: boolean;
  dismissible?: boolean;
  metadata?: any;
}

export interface CoupangData {
  url: string;
  productId?: string;
  affiliateId?: string;
  trackingParams?: Record<string, string>;
  fallbackData?: {
    title: string;
    price: string;
    image: string;
    rating: number;
  };
}

export interface StatisticsData {
  type: 'price_trend' | 'market_analysis' | 'user_behavior' | 'savings';
  title: string;
  charts: ChartData[];
  metrics: MetricCard[];
  timeRange?: string;
  lastUpdated?: Date;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: ChartDataPoint[];
  xAxis: string;
  yAxis: string;
  color?: string;
}

export interface ChartDataPoint {
  x: string | number;
  y: string | number;
  label?: string;
  color?: string;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  subtitle?: string;
  icon?: string;
  color?: string;
}

export interface ProductGridData {
  products: Product[];
  layout: 'grid' | 'list' | 'carousel';
  columns?: number;
  showPagination?: boolean;
  totalResults?: number;
  sortBy?: string;
  filters?: ProductFilter[];
  searchQuery?: string;
}

export interface ProductFilter {
  type: 'price' | 'brand' | 'category' | 'rating' | 'availability';
  label: string;
  options: FilterOption[];
  selectedValues?: string[];
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface ComparisonData {
  products: Product[];
  attributes: ComparisonAttribute[];
  highlightDifferences: boolean;
  recommendedProduct?: string;
}

export interface ComparisonAttribute {
  key: string;
  label: string;
  type: 'text' | 'number' | 'rating' | 'boolean' | 'price';
  weight?: number;
}

export interface ReviewsData {
  productId: string;
  reviews: ProductReview[];
  summary: ReviewSummary;
  filters: ReviewFilter[];
  sorting: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  createdAt: Date;
  verifiedPurchase: boolean;
  helpfulCount: number;
  images?: string[];
  attributes?: ReviewAttribute[];
}

export interface ReviewAttribute {
  name: string;
  rating: number;
  maxRating: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  attributeRatings: ReviewAttribute[];
  recommendationPercentage: number;
}

export interface ReviewFilter {
  type: 'rating' | 'verified' | 'with_photos' | 'recent';
  label: string;
  active: boolean;
}

export interface PanelState {
  currentPanel: PanelData | null;
  panelHistory: PanelData[];
  isExpanded: boolean;
  isAnimating: boolean;
  height: number;
  error: string | null;
}

export interface PanelContextValue extends PanelState {
  showPanel: (panelData: PanelData) => void;
  hidePanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  updatePanelData: (data: Partial<PanelData>) => void;
  setPanelHeight: (height: number) => void;
  goBack: () => void;
  clearHistory: () => void;
}

export interface PanelAnimation {
  type: 'slide_up' | 'slide_down' | 'fade_in' | 'expand' | 'scale';
  duration: number;
  easing: string;
  fillMode: 'forwards' | 'backwards' | 'both' | 'none';
}

export interface PanelTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  headerColor: string;
  accentColor: string;
}
import { ApiResponse } from '../../types';

// CLAUDE.md ERD 기반 Statistics API
// ERD: purchase_history { id, user_id, date(YYYY-MM-DD), platform_name, price }
// ERD: products { product_id, price, platform_name, category, review }

// 1. GET /api/statistics/main - 전체 통계 대시보드
interface PlatformStat {
  platform_name: string;
  order_count: number;
  total_spent: number;
}

interface MainStatisticsResponse {
  user_id: number;
  period: string;
  total_spending: number;
  total_orders: number;
  average_order_value: number;
  most_purchased_category: string;
  platform_breakdown: PlatformStat[];
}

// 2. GET /api/statistics/list - 결제 통계 리스트
interface Transaction {
  id: number;
  date: string; // ISO 8601
  platform_name: string;
  price: number;
  category?: string;
}

interface StatisticsListResponse {
  transactions: Transaction[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
  };
}

// 3. GET /api/statistics/weekly - 주간 통계
interface DailyData {
  day: string; // 'Mon', 'Tue', ...
  day_kor: string; // '월', '화', ...
  date: string; // ISO 8601
  amount: number;
  order_count: number;
}

interface WeeklyStatisticsResponse {
  user_id: number;
  week_start: string; // ISO 8601
  week_end: string; // ISO 8601
  daily_data: DailyData[];
  weekly_total: number;
}

// 4. GET /api/statistics/categories - 카테고리별 통계
interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  order_count: number;
  platform_breakdown: { platform_name: string; amount: number }[];
}

interface CategoryStatisticsResponse {
  user_id: number;
  categories: CategoryData[];
  total_amount: number;
}

// Mock Statistics API
export const statisticsApi = {
  // GET /api/statistics/main?user_id={user_id}
  getStatistics: async (user_id: number): Promise<ApiResponse<MainStatisticsResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockData: MainStatisticsResponse = {
      user_id,
      period: '7days',
      total_spending: 150000,
      total_orders: 5,
      average_order_value: 30000,
      most_purchased_category: '생수',
      platform_breakdown: [
        {
          platform_name: '쿠팡',
          order_count: 3,
          total_spent: 90000
        },
        {
          platform_name: '네이버쇼핑',
          order_count: 2,
          total_spent: 60000
        }
      ]
    };

    return {
      success: true,
      data: mockData
    };
  },

  // GET /api/statistics/list?user_id={user_id}&page={page}&limit={limit}
  getStatisticsList: async (
    user_id: number,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<StatisticsListResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockTransactions: Transaction[] = [
      {
        id: 1,
        date: new Date('2025-10-17T10:30:00Z').toISOString(),
        platform_name: '쿠팡',
        price: 12000,
        category: '생수'
      },
      {
        id: 2,
        date: new Date('2025-10-16T15:20:00Z').toISOString(),
        platform_name: '네이버쇼핑',
        price: 15000,
        category: '음료'
      },
      {
        id: 3,
        date: new Date('2025-10-15T09:15:00Z').toISOString(),
        platform_name: '11번가',
        price: 18000,
        category: '생활용품'
      }
    ];

    return {
      success: true,
      data: {
        transactions: mockTransactions,
        pagination: {
          current_page: page,
          total_pages: 3,
          total_items: 25
        }
      }
    };
  },

  // GET /api/statistics/weekly?user_id={user_id}
  getWeeklyStatistics: async (user_id: number): Promise<ApiResponse<WeeklyStatisticsResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const dailyData: DailyData[] = [
      {
        day: 'Mon',
        day_kor: '월',
        date: new Date('2025-10-14T00:00:00Z').toISOString(),
        amount: 25000,
        order_count: 2
      },
      {
        day: 'Tue',
        day_kor: '화',
        date: new Date('2025-10-15T00:00:00Z').toISOString(),
        amount: 18000,
        order_count: 1
      },
      {
        day: 'Wed',
        day_kor: '수',
        date: new Date('2025-10-16T00:00:00Z').toISOString(),
        amount: 32000,
        order_count: 2
      },
      {
        day: 'Thu',
        day_kor: '목',
        date: new Date('2025-10-17T00:00:00Z').toISOString(),
        amount: 28000,
        order_count: 1
      },
      {
        day: 'Fri',
        day_kor: '금',
        date: new Date('2025-10-18T00:00:00Z').toISOString(),
        amount: 15000,
        order_count: 1
      },
      {
        day: 'Sat',
        day_kor: '토',
        date: new Date('2025-10-19T00:00:00Z').toISOString(),
        amount: 42000,
        order_count: 3
      },
      {
        day: 'Sun',
        day_kor: '일',
        date: new Date('2025-10-20T00:00:00Z').toISOString(),
        amount: 35000,
        order_count: 2
      }
    ];

    return {
      success: true,
      data: {
        user_id,
        week_start: weekStart.toISOString(),
        week_end: today.toISOString(),
        daily_data: dailyData,
        weekly_total: dailyData.reduce((sum, d) => sum + d.amount, 0)
      }
    };
  },

  // GET /api/statistics/categories?user_id={user_id}
  getCategoryStatistics: async (user_id: number): Promise<ApiResponse<CategoryStatisticsResponse>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockCategories: CategoryData[] = [
      {
        category: '생수',
        amount: 50000,
        percentage: 33.3,
        order_count: 3,
        platform_breakdown: [
          { platform_name: '쿠팡', amount: 30000 },
          { platform_name: '네이버쇼핑', amount: 20000 }
        ]
      },
      {
        category: '음료',
        amount: 40000,
        percentage: 26.7,
        order_count: 2,
        platform_breakdown: [
          { platform_name: '11번가', amount: 40000 }
        ]
      },
      {
        category: '생활용품',
        amount: 35000,
        percentage: 23.3,
        order_count: 2,
        platform_breakdown: [
          { platform_name: '쿠팡', amount: 20000 },
          { platform_name: '네이버쇼핑', amount: 15000 }
        ]
      },
      {
        category: '청소용품',
        amount: 25000,
        percentage: 16.7,
        order_count: 1,
        platform_breakdown: [
          { platform_name: '쿠팡', amount: 25000 }
        ]
      }
    ];

    return {
      success: true,
      data: {
        user_id,
        categories: mockCategories,
        total_amount: mockCategories.reduce((sum, c) => sum + c.amount, 0)
      }
    };
  }
};

import { ApiResponse } from '../../types';

// Statistics API Types
export interface KPIData {
  id: string;
  title: string;
  value: string;
  change: number;
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'red';
}

export interface WeeklyData {
  day: string;
  dayKor: string;
  amount: number;
}

export interface CategoryData {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface StatisticsData {
  kpis: KPIData[];
  weeklyData: WeeklyData[];
  categoryData: CategoryData[];
  totalSpending: number;
  period: string;
}

export interface StatisticsApiResponse {
  statistics: StatisticsData;
  lastUpdated: string;
}

// Mock Statistics API
export const statisticsApi = {
  // Get overall statistics dashboard data
  getStatistics: async (period: string = '7days'): Promise<ApiResponse<StatisticsApiResponse>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockData: StatisticsApiResponse = {
      statistics: {
        kpis: [
          {
            id: 'total-spending',
            title: '총 구매 금액',
            value: '₩248,500',
            change: 12.5,
            icon: '💰',
            color: 'green'
          },
          {
            id: 'product-count',
            title: '구매한 상품 수',
            value: '34개',
            change: 8.2,
            icon: '🛒',
            color: 'green'
          },
          {
            id: 'savings',
            title: '절약한 금액',
            value: '₩52,300',
            change: 15.3,
            icon: '💎',
            color: 'green'
          },
          {
            id: 'delivery-time',
            title: '평균 배송시간',
            value: '1.2일',
            change: -0.3,
            icon: '🚚',
            color: 'red'
          }
        ],
        weeklyData: [
          { day: 'Mon', dayKor: '월', amount: 15000 },
          { day: 'Tue', dayKor: '화', amount: 23000 },
          { day: 'Wed', dayKor: '수', amount: 18000 },
          { day: 'Thu', dayKor: '목', amount: 31000 },
          { day: 'Fri', dayKor: '금', amount: 28000 },
          { day: 'Sat', dayKor: '토', amount: 42000 },
          { day: 'Sun', dayKor: '일', amount: 35000 }
        ],
        categoryData: [
          { id: 'lifestyle', name: '생활용품', percentage: 45, amount: 125000, color: '#10b981' },
          { id: 'cleaning', name: '청소용품', percentage: 28, amount: 78000, color: '#3b82f6' },
          { id: 'beverage', name: '음료', percentage: 15, amount: 42000, color: '#f59e0b' },
          { id: 'others', name: '기타', percentage: 12, amount: 33500, color: '#8b5cf6' }
        ],
        totalSpending: 248500,
        period: period
      },
      lastUpdated: new Date().toISOString()
    };

    return {
      success: true,
      data: mockData
    };
  },

  // Get detailed weekly data
  getWeeklyStatistics: async (period: string = '7days'): Promise<ApiResponse<{ weeklyData: WeeklyData[]; summary: any }>> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const weeklyData: WeeklyData[] = [
      { day: 'Mon', dayKor: '월', amount: 15000 },
      { day: 'Tue', dayKor: '화', amount: 23000 },
      { day: 'Wed', dayKor: '수', amount: 18000 },
      { day: 'Thu', dayKor: '목', amount: 31000 },
      { day: 'Fri', dayKor: '금', amount: 28000 },
      { day: 'Sat', dayKor: '토', amount: 42000 },
      { day: 'Sun', dayKor: '일', amount: 35000 }
    ];

    const summary = {
      totalWeeklySpending: weeklyData.reduce((sum, d) => sum + d.amount, 0),
      averageDaily: Math.round(weeklyData.reduce((sum, d) => sum + d.amount, 0) / 7),
      highestDay: '토요일',
      highestAmount: 42000
    };

    return {
      success: true,
      data: { weeklyData, summary }
    };
  },

  // Get detailed category data
  getCategoryStatistics: async (): Promise<ApiResponse<{ categoryData: CategoryData[]; insights: any }>> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const categoryData: CategoryData[] = [
      { id: 'lifestyle', name: '생활용품', percentage: 45, amount: 125000, color: '#10b981' },
      { id: 'cleaning', name: '청소용품', percentage: 28, amount: 78000, color: '#3b82f6' },
      { id: 'beverage', name: '음료', percentage: 15, amount: 42000, color: '#f59e0b' },
      { id: 'others', name: '기타', percentage: 12, amount: 33500, color: '#8b5cf6' }
    ];

    const insights = {
      mostPurchasedCategory: '생활용품',
      growingCategory: '청소용품',
      seasonalTrend: '생활용품 구매 비율이 45%로 가장 높습니다.'
    };

    return {
      success: true,
      data: { categoryData, insights }
    };
  }
};
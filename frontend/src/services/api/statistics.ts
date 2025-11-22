import { apiClient } from './client';
import type { ApiResponse } from '../../types';

export interface PieDatum {
  id: string;
  label: string;
  value: number;
}

export interface LinePoint {
  x: string;
  y: number;
}

export interface LineSeries {
  id: string;
  data: LinePoint[];
}

export interface StatisticsSummary {
  totalSpent: number;
  totalOrders: number;
  averageOrderValue: number;
  mostPurchasedCategory?: string | null;
  mostUsedPlatform?: string | null;
}

export interface CategoryStatistics {
  share: PieDatum[];
  monthlyTrend: LineSeries[];
}

export interface PlatformStatistics {
  ratio: PieDatum[];
  monthlyTrend: LineSeries[];
}

export interface PatternStatistics {
  hourlyTrend: LineSeries[];
  monthlyTotal: LineSeries[];
}

export interface StatisticsDashboardData {
  userId: number;
  summary: StatisticsSummary;
  category: CategoryStatistics;
  platform: PlatformStatistics;
  pattern: PatternStatistics;
}

const mapSummary = (raw: any): StatisticsSummary => ({
  totalSpent: raw?.total_spent ?? 0,
  totalOrders: raw?.total_orders ?? 0,
  averageOrderValue: raw?.average_order_value ?? 0,
  mostPurchasedCategory: raw?.most_purchased_category ?? null,
  mostUsedPlatform: raw?.most_used_platform ?? null,
});

export const statisticsApi = {
  getDashboard: async (user_id: number): Promise<ApiResponse<{ statistics: StatisticsDashboardData }>> => {
    const response = await apiClient.get<any>('/statistics/dashboard', { user_id });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error ?? '통계 데이터를 불러오지 못했습니다.',
        data: null as any
      };
    }

    const data: StatisticsDashboardData = {
      userId: response.data.user_id,
      summary: mapSummary(response.data.summary),
      category: {
        share: response.data.category?.share ?? [],
        monthlyTrend: response.data.category?.monthly_trend ?? [],
      },
      platform: {
        ratio: response.data.platform?.ratio ?? [],
        monthlyTrend: response.data.platform?.monthly_trend ?? [],
      },
      pattern: {
        hourlyTrend: response.data.pattern?.hourly_trend ?? [],
        monthlyTotal: response.data.pattern?.monthly_total ?? [],
      },
    };

    return {
      success: true,
      data: { statistics: data },
    };
  },
};

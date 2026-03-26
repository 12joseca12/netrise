export type DashboardRole = "agency" | "freelancer" | "closer";

export type RevenuePeriod = "day" | "week" | "month" | "6months" | "year";

export interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  detailKey: string;
}

export interface RevenuePoint {
  date: string;
  total: number;
}

export interface TableColumn<T> {
  id: keyof T | string;
  header: string;
  accessor: (row: T) => string | number;
  export?: boolean;
}

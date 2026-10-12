export interface AdminConfig {
  _id?: string;
  passcode: string;
  whitelistedOpenids?: string[];
}

export interface SalesStats {
  onSaleCount: number;
  soldOutCount: number;
  todaySalesCount: number;
  todaySalesAmount: number;
}

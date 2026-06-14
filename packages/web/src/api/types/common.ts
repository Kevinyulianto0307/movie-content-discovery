// Shared response envelope used by every list endpoint.
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(data: T, message?: string, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { status: 'success', data, message, meta };
}

export function errorResponse(message: string, statusCode = 500): { response: ApiResponse; statusCode: number } {
  return { response: { status: 'error', message }, statusCode };
}

export function paginatedResponse<T>(data: T[], page: number, limit: number, total: number): ApiResponse<T[]> {
  return {
    status: 'success',
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
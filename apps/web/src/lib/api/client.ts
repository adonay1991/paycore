import type {
  ApiResponse,
  PaginatedResponse,
  Invoice,
  Payment,
} from '@paycore/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'An error occurred',
    };
  }

  return {
    success: true,
    data: data.data,
  };
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ==================== Customer Portal API ====================

// Get invoices for the current customer
export async function getMyInvoices(
  params: { cursor?: string; limit?: number; status?: string } = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<Invoice>>(`/api/portal/invoices${query}`, { token });
}

// Get a specific invoice
export async function getMyInvoice(
  id: string,
  token?: string
): Promise<ApiResponse<Invoice>> {
  return fetchApi<Invoice>(`/api/portal/invoices/${id}`, { token });
}

// Get payments for the current customer
export async function getMyPayments(
  params: { cursor?: string; limit?: number } = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<Payment>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<Payment>>(`/api/portal/payments${query}`, { token });
}

// Get account summary
type AccountSummary = {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  overdueCount: number;
};

export async function getAccountSummary(
  token?: string
): Promise<ApiResponse<AccountSummary>> {
  return fetchApi<AccountSummary>('/api/portal/account/summary', { token });
}

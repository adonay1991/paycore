import type {
  ApiResponse,
  PaginatedResponse,
  Invoice,
  Customer,
  Payment,
  DebtCase,
  DebtCaseActivity,
  User,
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

// Query params builder
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

// ==================== Invoices ====================

type InvoiceListParams = {
  cursor?: string;
  limit?: number;
  status?: string;
  customerId?: string;
};

export async function getInvoices(
  params: InvoiceListParams = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<Invoice>>(`/api/invoices${query}`, { token });
}

export async function getInvoice(
  id: string,
  token?: string
): Promise<ApiResponse<Invoice>> {
  return fetchApi<Invoice>(`/api/invoices/${id}`, { token });
}

export async function createInvoice(
  data: Partial<Invoice>,
  token?: string
): Promise<ApiResponse<Invoice>> {
  return fetchApi<Invoice>('/api/invoices', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function updateInvoice(
  id: string,
  data: Partial<Invoice>,
  token?: string
): Promise<ApiResponse<Invoice>> {
  return fetchApi<Invoice>(`/api/invoices/${id}`, {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function deleteInvoice(
  id: string,
  token?: string
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/invoices/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function sendInvoice(
  id: string,
  token?: string
): Promise<ApiResponse<Invoice>> {
  return fetchApi<Invoice>(`/api/invoices/${id}/send`, {
    method: 'POST',
    token,
  });
}

// ==================== Customers ====================

type CustomerListParams = {
  cursor?: string;
  limit?: number;
  search?: string;
};

export async function getCustomers(
  params: CustomerListParams = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<Customer>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<Customer>>(`/api/customers${query}`, { token });
}

export async function getCustomer(
  id: string,
  token?: string
): Promise<ApiResponse<Customer>> {
  return fetchApi<Customer>(`/api/customers/${id}`, { token });
}

export async function createCustomer(
  data: Partial<Customer>,
  token?: string
): Promise<ApiResponse<Customer>> {
  return fetchApi<Customer>('/api/customers', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
  token?: string
): Promise<ApiResponse<Customer>> {
  return fetchApi<Customer>(`/api/customers/${id}`, {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function deleteCustomer(
  id: string,
  token?: string
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi<{ success: boolean }>(`/api/customers/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ==================== Payments ====================

type PaymentListParams = {
  cursor?: string;
  limit?: number;
  status?: string;
  invoiceId?: string;
};

export async function getPayments(
  params: PaymentListParams = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<Payment>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<Payment>>(`/api/payments${query}`, { token });
}

export async function getPayment(
  id: string,
  token?: string
): Promise<ApiResponse<Payment>> {
  return fetchApi<Payment>(`/api/payments/${id}`, { token });
}

export async function createPayment(
  data: Partial<Payment>,
  token?: string
): Promise<ApiResponse<Payment>> {
  return fetchApi<Payment>('/api/payments', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function processPayment(
  id: string,
  transactionId?: string,
  token?: string
): Promise<ApiResponse<Payment>> {
  return fetchApi<Payment>(`/api/payments/${id}/process`, {
    method: 'POST',
    body: transactionId ? { transactionId } : undefined,
    token,
  });
}

export async function refundPayment(
  id: string,
  token?: string
): Promise<ApiResponse<Payment>> {
  return fetchApi<Payment>(`/api/payments/${id}/refund`, {
    method: 'POST',
    token,
  });
}

// ==================== Debt Cases ====================

type DebtCaseListParams = {
  cursor?: string;
  limit?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
};

export async function getDebtCases(
  params: DebtCaseListParams = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<DebtCase>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<DebtCase>>(`/api/debt-cases${query}`, { token });
}

export async function getDebtCase(
  id: string,
  token?: string
): Promise<ApiResponse<DebtCase>> {
  return fetchApi<DebtCase>(`/api/debt-cases/${id}`, { token });
}

export async function createDebtCase(
  data: Partial<DebtCase>,
  token?: string
): Promise<ApiResponse<DebtCase>> {
  return fetchApi<DebtCase>('/api/debt-cases', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function updateDebtCase(
  id: string,
  data: Partial<DebtCase>,
  token?: string
): Promise<ApiResponse<DebtCase>> {
  return fetchApi<DebtCase>(`/api/debt-cases/${id}`, {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function assignDebtCase(
  id: string,
  userId: string,
  token?: string
): Promise<ApiResponse<DebtCase>> {
  return fetchApi<DebtCase>(`/api/debt-cases/${id}/assign`, {
    method: 'POST',
    body: { userId },
    token,
  });
}

export async function getDebtCaseActivities(
  id: string,
  params: { cursor?: string; limit?: number } = {},
  token?: string
): Promise<ApiResponse<PaginatedResponse<DebtCaseActivity>>> {
  const query = buildQueryString(params);
  return fetchApi<PaginatedResponse<DebtCaseActivity>>(
    `/api/debt-cases/${id}/activities${query}`,
    { token }
  );
}

export async function addDebtCaseActivity(
  id: string,
  data: { type: string; notes?: string },
  token?: string
): Promise<ApiResponse<DebtCaseActivity>> {
  return fetchApi<DebtCaseActivity>(`/api/debt-cases/${id}/activities`, {
    method: 'POST',
    body: data,
    token,
  });
}

// ==================== Dashboard Stats ====================

type DashboardStats = {
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
  };
  customers: {
    total: number;
    active: number;
  };
  payments: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
  debtCases: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    totalDebt: number;
  };
};

export async function getDashboardStats(
  token?: string
): Promise<ApiResponse<DashboardStats>> {
  return fetchApi<DashboardStats>('/api/dashboard/stats', { token });
}

// ==================== Users ====================

export async function getCurrentUser(
  token?: string
): Promise<ApiResponse<User>> {
  return fetchApi<User>('/api/users/me', { token });
}

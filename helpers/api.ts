import { CommonResponse, ErrorResponse } from '@/models/dto/base';
import axios from 'axios';
import { tryCatch } from './flow';
import { sessionStore } from '@/store/session';

interface RequestOptions<R> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: R;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  code: string;
  detail?: string;

  constructor(code: string, message: string, detail?: string) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}


export async function apiFormRequest<R, T>(url: string, options: RequestOptions<R> = {}) {
  return apiRequest<R, T>(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function apiRequest<R, T>(url: string, options: RequestOptions<R> = {}) {
  return tryCatch(_apiRequest<R, T>(url, options))
}


export async function _apiRequest<R, T>(url: string, options: RequestOptions<R> = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if present in session store
  if (sessionStore.Token) {
    defaultHeaders['Authorization'] = `Bearer ${sessionStore.Token}`;
  }

  const [response, err] = await tryCatch(axios(url, {
    method: options.method || 'POST',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    data: options.body,
  }))

  if (err) {
    throw new Error(err.message);
  }

  const data: CommonResponse<T> | ErrorResponse = response.data

  if (data.Meta.Error) {
    const error = data.Meta.Error;
    throw new ApiError(error.Code, error.Message, error.Detail);
  }
  return (data as CommonResponse<T>).Data as T;
}

import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // An expired session will not fix itself on a retry — fail fast so the
      // redirect to the login page happens immediately.
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status === 401
          ? false
          : failureCount < 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

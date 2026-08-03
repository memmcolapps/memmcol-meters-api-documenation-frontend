import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/queryClient'
import { ToastProvider } from './app/Toast'
import { emitToast } from './app/toastContext'
import { setSessionExpiredHandler } from './lib/api/session'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Any 401 from an authenticated endpoint signs the user out on the spot — no
// manual logout required.
setSessionExpiredHandler(async (scope) => {
  const to = scope === 'admin' ? '/admin/login' : '/login'
  if (router.state.location.pathname === to) return

  emitToast({
    title: 'Your session has expired',
    message: 'Please sign in again to continue.',
    variant: 'error',
  })

  await router.navigate({ to, replace: true })
  queryClient.clear()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ToastProvider>
  </StrictMode>,
)

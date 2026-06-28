import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  
  return token ? <Outlet /> : <Navigate to="/auth/login" replace />
}

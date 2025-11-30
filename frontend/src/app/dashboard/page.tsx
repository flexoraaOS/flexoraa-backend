"use client"
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { getUser } from '@/lib/features/authSlice'

export default function DashboardPage() {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { user, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth)
    const [redirecting, setRedirecting] = useState(false)

    useEffect(() => {
        // Ensure user session is loaded
        if (!isInitialized) {
            dispatch(getUser())
            return
        }

        if (!isAuthenticated || !user) {
            router.replace('/auth/login')
            return
        }

        if (redirecting) return

        // Check user's product access and redirect accordingly
        const hasLeadosAccess = user.user_metadata?.has_leados_access
        const hasAgentosAccess = user.user_metadata?.has_agentos_access
        const userRole = user.user_metadata?.role

        setRedirecting(true)

        // Admin users go to admin dashboard
        if (userRole === 'admin') {
            router.replace('/dashboard/admin-dashboard')
            return
        }

        // Redirect based on product access
        if (hasLeadosAccess && hasAgentosAccess) {
            // If user has both, default to LeadOS
            router.replace('/dashboard/leados')
        } else if (hasLeadosAccess) {
            router.replace('/dashboard/leados')
        } else if (hasAgentosAccess) {
            router.replace('/dashboard/agentos-sdr')
        } else {
            // Default to leados if no specific access is set
            router.replace('/dashboard/leados')
        }
    }, [isAuthenticated, user, isInitialized, router, dispatch, redirecting])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-red-400" />
                <p className="text-red-500">Preparing your dashboard...</p>
            </div>
        </div>
    )
}

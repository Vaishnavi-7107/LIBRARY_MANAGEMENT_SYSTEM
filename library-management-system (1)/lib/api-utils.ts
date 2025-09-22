import { createClient } from "@/lib/supabase/server"
import type { User } from "@/lib/types"

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  // Get user profile with role information
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
}

export function isAuthorized(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false
  return requiredRoles.includes(user.role)
}

export function createErrorResponse(message: string, status = 400) {
  return Response.json({ success: false, message }, { status })
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return Response.json({
    success: true,
    data,
    message,
  })
}

export function createPaginatedResponse<T>(data: T[], page: number, limit: number, total: number, message?: string) {
  return Response.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    message,
  })
}

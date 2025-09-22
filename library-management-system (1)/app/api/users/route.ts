import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return createErrorResponse("Failed to fetch users", 500)
    }

    return createSuccessResponse(users, "Users retrieved successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// PUT /api/users/[id] - Update a user (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data: updatedUser, error } = await supabase
      .from("profiles")
      .update({
        full_name: body.full_name,
        role: body.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return createErrorResponse("User not found", 404)
      }
      console.error("Database error:", error)
      return createErrorResponse("Failed to update user", 500)
    }

    return createSuccessResponse(updatedUser, "User updated successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

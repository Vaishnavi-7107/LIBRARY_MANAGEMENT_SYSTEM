import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse("Authentication required", 401)
    }

    const supabase = await createClient()

    const { data: categories, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return createErrorResponse("Failed to fetch categories", 500)
    }

    return createSuccessResponse(categories, "Categories retrieved successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const supabase = await createClient()
    const body = await request.json()

    if (!body.name) {
      return createErrorResponse("Category name is required")
    }

    const { data: category, error } = await supabase.from("categories").insert(body).select().single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return createErrorResponse("Category name already exists")
      }
      console.error("Category creation error:", error)
      return createErrorResponse("Failed to create category", 500)
    }

    return createSuccessResponse(category, "Category created successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

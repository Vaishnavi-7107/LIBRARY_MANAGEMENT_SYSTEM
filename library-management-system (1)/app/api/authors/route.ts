import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// GET /api/authors - Get all authors
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse("Authentication required", 401)
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = supabase.from("authors").select("*").order("name", { ascending: true })

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data: authors, error } = await query

    if (error) {
      console.error("Database error:", error)
      return createErrorResponse("Failed to fetch authors", 500)
    }

    return createSuccessResponse(authors, "Authors retrieved successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

// POST /api/authors - Create a new author
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const supabase = await createClient()
    const body = await request.json()

    if (!body.name) {
      return createErrorResponse("Author name is required")
    }

    const { data: author, error } = await supabase.from("authors").insert(body).select().single()

    if (error) {
      console.error("Author creation error:", error)
      return createErrorResponse("Failed to create author", 500)
    }

    return createSuccessResponse(author, "Author created successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

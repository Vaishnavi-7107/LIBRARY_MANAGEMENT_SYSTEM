import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// POST /api/borrowing/[id]/return - Return a borrowed book
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get the borrowing record
    const { data: borrowRecord, error: borrowError } = await supabase
      .from("borrowing_records")
      .select("*, book:books(id, title, available_copies)")
      .eq("id", id)
      .eq("status", "borrowed")
      .single()

    if (borrowError || !borrowRecord) {
      return createErrorResponse("Borrowing record not found or already returned", 404)
    }

    // Update borrowing record
    const { error: updateError } = await supabase
      .from("borrowing_records")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
        notes: body.notes || borrowRecord.notes,
      })
      .eq("id", id)

    if (updateError) {
      console.error("Borrowing record update error:", updateError)
      return createErrorResponse("Failed to update borrowing record", 500)
    }

    // Update book available copies
    const { error: bookUpdateError } = await supabase
      .from("books")
      .update({
        available_copies: (borrowRecord.book as any).available_copies + 1,
      })
      .eq("id", borrowRecord.book_id)

    if (bookUpdateError) {
      console.error("Book update error:", bookUpdateError)
      return createErrorResponse("Failed to update book availability", 500)
    }

    return createSuccessResponse(null, `Book "${(borrowRecord.book as any).title}" returned successfully`)
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

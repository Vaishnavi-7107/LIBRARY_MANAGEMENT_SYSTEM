import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// GET /api/borrowing - Get borrowing records
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse("Authentication required", 401)
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("user_id")

    let query = supabase
      .from("borrowing_records")
      .select(`
        *,
        book:books(id, title, isbn, authors:book_authors(author:authors(name))),
        user:profiles(id, full_name, email)
      `)
      .order("borrowed_at", { ascending: false })

    // Regular users can only see their own records
    if (user.role === "user") {
      query = query.eq("user_id", user.id)
    } else if (userId) {
      // Admins/librarians can filter by specific user
      query = query.eq("user_id", userId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: records, error } = await query

    if (error) {
      console.error("Database error:", error)
      return createErrorResponse("Failed to fetch borrowing records", 500)
    }

    // Transform the data
    const transformedRecords =
      records?.map((record) => ({
        ...record,
        book: {
          ...record.book,
          authors: record.book?.authors?.map((ba: any) => ba.author) || [],
        },
      })) || []

    return createSuccessResponse(transformedRecords, "Borrowing records retrieved successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

// POST /api/borrowing - Create a new borrowing record (borrow a book)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const supabase = await createClient()
    const body = await request.json()

    if (!body.book_id || !body.user_id) {
      return createErrorResponse("Book ID and User ID are required")
    }

    // Check if book is available
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("available_copies, title")
      .eq("id", body.book_id)
      .single()

    if (bookError || !book) {
      return createErrorResponse("Book not found", 404)
    }

    if (book.available_copies <= 0) {
      return createErrorResponse("Book is not available for borrowing")
    }

    // Check if user already has this book borrowed
    const { data: existingBorrow } = await supabase
      .from("borrowing_records")
      .select("id")
      .eq("book_id", body.book_id)
      .eq("user_id", body.user_id)
      .eq("status", "borrowed")
      .single()

    if (existingBorrow) {
      return createErrorResponse("User already has this book borrowed")
    }

    // Calculate due date (default 14 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14)

    // Create borrowing record
    const { data: borrowRecord, error: borrowError } = await supabase
      .from("borrowing_records")
      .insert({
        book_id: body.book_id,
        user_id: body.user_id,
        due_date: dueDate.toISOString(),
        notes: body.notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (borrowError) {
      console.error("Borrowing record creation error:", borrowError)
      return createErrorResponse("Failed to create borrowing record", 500)
    }

    // Update book available copies
    const { error: updateError } = await supabase
      .from("books")
      .update({ available_copies: book.available_copies - 1 })
      .eq("id", body.book_id)

    if (updateError) {
      console.error("Book update error:", updateError)
      // Rollback the borrowing record
      await supabase.from("borrowing_records").delete().eq("id", borrowRecord.id)
      return createErrorResponse("Failed to update book availability", 500)
    }

    return createSuccessResponse(borrowRecord, `Book "${book.title}" borrowed successfully`)
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import type { NextRequest } from "next/server"

// GET /api/books/[id] - Get a specific book
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse("Authentication required", 401)
    }

    const { id } = await params
    const supabase = await createClient()

    const { data: book, error } = await supabase
      .from("books")
      .select(`
        *,
        category:categories(id, name, description),
        authors:book_authors(
          author:authors(id, name, biography, nationality)
        ),
        reviews:reviews(
          id, rating, review_text, created_at,
          user:profiles(id, full_name)
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return createErrorResponse("Book not found", 404)
      }
      console.error("Database error:", error)
      return createErrorResponse("Failed to fetch book", 500)
    }

    // Transform the data
    const transformedBook = {
      ...book,
      authors: book.authors?.map((ba: any) => ba.author) || [],
      reviews: book.reviews || [],
    }

    return createSuccessResponse(transformedBook, "Book retrieved successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

// PUT /api/books/[id] - Update a book
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Extract authors from the request
    const { authors, ...bookData } = body

    // Update the book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .update({
        ...bookData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (bookError) {
      if (bookError.code === "PGRST116") {
        return createErrorResponse("Book not found", 404)
      }
      console.error("Book update error:", bookError)
      return createErrorResponse("Failed to update book", 500)
    }

    // Update authors if provided
    if (authors && Array.isArray(authors)) {
      // Remove existing author associations
      await supabase.from("book_authors").delete().eq("book_id", id)

      // Add new author associations
      if (authors.length > 0) {
        const bookAuthors = authors.map((authorId) => ({
          book_id: id,
          author_id: authorId,
        }))

        const { error: authorsError } = await supabase.from("book_authors").insert(bookAuthors)

        if (authorsError) {
          console.error("Authors linking error:", authorsError)
        }
      }
    }

    // Fetch the complete updated book
    const { data: completeBook } = await supabase
      .from("books")
      .select(`
        *,
        category:categories(id, name, description),
        authors:book_authors(
          author:authors(id, name, biography, nationality)
        )
      `)
      .eq("id", id)
      .single()

    const transformedBook = {
      ...completeBook,
      authors: completeBook?.authors?.map((ba: any) => ba.author) || [],
    }

    return createSuccessResponse(transformedBook, "Book updated successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

// DELETE /api/books/[id] - Delete a book
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { id } = await params
    const supabase = await createClient()

    // Check if book has active borrowing records
    const { data: activeBorrowings } = await supabase
      .from("borrowing_records")
      .select("id")
      .eq("book_id", id)
      .eq("status", "borrowed")

    if (activeBorrowings && activeBorrowings.length > 0) {
      return createErrorResponse("Cannot delete book with active borrowing records", 400)
    }

    // Delete the book (cascading deletes will handle related records)
    const { error } = await supabase.from("books").delete().eq("id", id)

    if (error) {
      if (error.code === "PGRST116") {
        return createErrorResponse("Book not found", 404)
      }
      console.error("Book deletion error:", error)
      return createErrorResponse("Failed to delete book", 500)
    }

    return createSuccessResponse(null, "Book deleted successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

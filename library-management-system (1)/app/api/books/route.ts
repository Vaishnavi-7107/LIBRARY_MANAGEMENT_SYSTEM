import { createClient } from "@/lib/supabase/server"
import {
  getAuthenticatedUser,
  isAuthorized,
  createErrorResponse,
  createPaginatedResponse,
  createSuccessResponse,
} from "@/lib/api-utils"
import type { BookFilters } from "@/lib/types"
import type { NextRequest } from "next/server"
import { withRateLimit } from "@/lib/middleware/rate-limit"
import { cache } from "@/lib/cache"

// GET /api/books - Get all books with filtering and pagination
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse("Authentication required", 401)
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const filters: BookFilters = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      author: searchParams.get("author") || undefined,
      available: searchParams.get("available") === "true" ? true : undefined,
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Math.min(Number.parseInt(searchParams.get("limit") || "10"), 100), // Max 100 items per page
      sortBy: (searchParams.get("sortBy") as any) || "created_at",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    }

    // Create cache key based on filters
    const cacheKey = `books:${JSON.stringify(filters)}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return createPaginatedResponse(
        cachedData.data,
        filters.page!,
        filters.limit!,
        cachedData.total,
        "Books retrieved from cache",
      )
    }

    const supabase = await createClient()

    // Build query
    let query = supabase.from("books").select(`
        *,
        category:categories(id, name, description),
        authors:book_authors(
          author:authors(id, name, biography, nationality)
        )
      `)

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters.category) {
      query = query.eq("category_id", filters.category)
    }

    if (filters.available) {
      query = query.gt("available_copies", 0)
    }

    // Apply sorting
    query = query.order(filters.sortBy!, { ascending: filters.sortOrder === "asc" })

    // Get total count for pagination
    const { count } = await supabase.from("books").select("*", { count: "exact", head: true })

    // Apply pagination
    const from = (filters.page! - 1) * filters.limit!
    const to = from + filters.limit! - 1
    query = query.range(from, to)

    const { data: books, error } = await query

    if (error) {
      console.error("Database error:", error)
      return createErrorResponse("Failed to fetch books", 500)
    }

    // Transform the data to flatten authors
    const transformedBooks =
      books?.map((book) => ({
        ...book,
        authors: book.authors?.map((ba: any) => ba.author) || [],
      })) || []

    // Cache the results for 5 minutes
    cache.set(cacheKey, { data: transformedBooks, total: count || 0 }, 300)

    return createPaginatedResponse(
      transformedBooks,
      filters.page!,
      filters.limit!,
      count || 0,
      "Books retrieved successfully",
    )
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
})

// POST /api/books - Create a new book
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return createErrorResponse("Title is required")
    }

    // Extract authors from the request
    const { authors, ...bookData } = body

    // Create the book
    const { data: book, error: bookError } = await supabase
      .from("books")
      .insert({
        ...bookData,
        created_by: user.id,
        available_copies: bookData.total_copies || 1,
        language: bookData.language || "English",
      })
      .select()
      .single()

    if (bookError) {
      console.error("Book creation error:", bookError)
      return createErrorResponse("Failed to create book", 500)
    }

    // Link authors if provided
    if (authors && Array.isArray(authors) && authors.length > 0) {
      const bookAuthors = authors.map((authorId) => ({
        book_id: book.id,
        author_id: authorId,
      }))

      const { error: authorsError } = await supabase.from("book_authors").insert(bookAuthors)

      if (authorsError) {
        console.error("Authors linking error:", authorsError)
        // Don't fail the entire operation, just log the error
      }
    }

    // Fetch the complete book with relations
    const { data: completeBook } = await supabase
      .from("books")
      .select(`
        *,
        category:categories(id, name, description),
        authors:book_authors(
          author:authors(id, name, biography, nationality)
        )
      `)
      .eq("id", book.id)
      .single()

    const transformedBook = {
      ...completeBook,
      authors: completeBook?.authors?.map((ba: any) => ba.author) || [],
    }

    return createSuccessResponse(transformedBook, "Book created successfully")
  } catch (error) {
    console.error("API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
})

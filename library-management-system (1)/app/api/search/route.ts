import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import { cache } from "@/lib/cache"
import { withRateLimit } from "@/lib/middleware/rate-limit"
import type { NextRequest } from "next/server"

// GET /api/search - Advanced search across books, authors, and categories
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return createErrorResponse("Authentication required", 401)
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all" // all, books, authors, categories

    if (!query || query.length < 2) {
      return createErrorResponse("Search query must be at least 2 characters long")
    }

    // Check cache first
    const cacheKey = `search:${query}:${type}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return createSuccessResponse(cachedData, "Search results retrieved from cache")
    }

    const supabase = await createClient()
    const results: any = {
      books: [],
      authors: [],
      categories: [],
    }

    // Search books
    if (type === "all" || type === "books") {
      const { data: books } = await supabase
        .from("books")
        .select(`
          *,
          category:categories(id, name),
          authors:book_authors(
            author:authors(id, name)
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,isbn.ilike.%${query}%`)
        .limit(10)

      results.books =
        books?.map((book) => ({
          ...book,
          authors: book.authors?.map((ba: any) => ba.author) || [],
        })) || []
    }

    // Search authors
    if (type === "all" || type === "authors") {
      const { data: authors } = await supabase.from("authors").select("*").ilike("name", `%${query}%`).limit(10)

      results.authors = authors || []
    }

    // Search categories
    if (type === "all" || type === "categories") {
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10)

      results.categories = categories || []
    }

    // Cache results for 5 minutes
    cache.set(cacheKey, results, 300)

    return createSuccessResponse(results, "Search completed successfully")
  } catch (error) {
    console.error("Search API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
})

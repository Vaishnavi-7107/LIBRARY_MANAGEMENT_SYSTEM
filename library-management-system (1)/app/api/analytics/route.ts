import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, isAuthorized, createErrorResponse, createSuccessResponse } from "@/lib/api-utils"
import { cache } from "@/lib/cache"
import type { NextRequest } from "next/server"

// GET /api/analytics - Get library analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user || !isAuthorized(user, ["admin", "librarian"])) {
      return createErrorResponse("Insufficient permissions", 403)
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days

    // Check cache first
    const cacheKey = `analytics:${period}`
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return createSuccessResponse(cachedData, "Analytics retrieved from cache")
    }

    const supabase = await createClient()
    const periodDays = Number.parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get basic statistics
    const [{ count: totalBooks }, { count: totalUsers }, { count: activeBorrowings }, { count: overdueBorrowings }] =
      await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("borrowing_records").select("*", { count: "exact", head: true }).eq("status", "borrowed"),
        supabase
          .from("borrowing_records")
          .select("*", { count: "exact", head: true })
          .eq("status", "borrowed")
          .lt("due_date", new Date().toISOString()),
      ])

    // Get most popular books
    const { data: popularBooks } = await supabase
      .from("borrowing_records")
      .select(`
        book_id,
        book:books(id, title, authors:book_authors(author:authors(name))),
        count:book_id
      `)
      .gte("borrowed_at", startDate.toISOString())
      .limit(10)

    // Group by book and count
    const bookCounts = new Map()
    popularBooks?.forEach((record) => {
      const bookId = record.book_id
      if (bookCounts.has(bookId)) {
        bookCounts.set(bookId, bookCounts.get(bookId) + 1)
      } else {
        bookCounts.set(bookId, 1)
      }
    })

    const mostBorrowedBooks = Array.from(bookCounts.entries())
      .map(([bookId, count]) => {
        const bookRecord = popularBooks?.find((r) => r.book_id === bookId)
        return {
          book: bookRecord?.book,
          borrowCount: count,
        }
      })
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5)

    // Get borrowing trends (daily counts for the period)
    const { data: borrowingTrends } = await supabase
      .from("borrowing_records")
      .select("borrowed_at")
      .gte("borrowed_at", startDate.toISOString())
      .order("borrowed_at", { ascending: true })

    // Group by date
    const dailyCounts = new Map()
    borrowingTrends?.forEach((record) => {
      const date = new Date(record.borrowed_at).toISOString().split("T")[0]
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1)
    })

    const trendData = Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      borrowings: count,
    }))

    // Get category distribution
    const { data: categoryStats } = await supabase.from("books").select(`
        category_id,
        category:categories(name),
        count:category_id
      `)

    const categoryCounts = new Map()
    categoryStats?.forEach((book) => {
      const categoryName = book.category?.name || "Uncategorized"
      categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1)
    })

    const categoryDistribution = Array.from(categoryCounts.entries()).map(([name, count]) => ({
      category: name,
      count,
    }))

    // Get active users (users with recent borrowings)
    const { data: activeUsers } = await supabase
      .from("borrowing_records")
      .select(`
        user_id,
        user:profiles(id, full_name, email),
        count:user_id
      `)
      .gte("borrowed_at", startDate.toISOString())

    const userCounts = new Map()
    activeUsers?.forEach((record) => {
      const userId = record.user_id
      userCounts.set(userId, (userCounts.get(userId) || 0) + 1)
    })

    const mostActiveUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => {
        const userRecord = activeUsers?.find((r) => r.user_id === userId)
        return {
          user: userRecord?.user,
          borrowCount: count,
        }
      })
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5)

    const analyticsData = {
      overview: {
        totalBooks: totalBooks || 0,
        totalUsers: totalUsers || 0,
        activeBorrowings: activeBorrowings || 0,
        overdueBorrowings: overdueBorrowings || 0,
      },
      mostBorrowedBooks,
      borrowingTrends: trendData,
      categoryDistribution,
      mostActiveUsers,
      period: periodDays,
    }

    // Cache the results for 10 minutes
    cache.set(cacheKey, analyticsData, 600)

    return createSuccessResponse(analyticsData, "Analytics retrieved successfully")
  } catch (error) {
    console.error("Analytics API error:", error)
    return createErrorResponse("Internal server error", 500)
  }
}

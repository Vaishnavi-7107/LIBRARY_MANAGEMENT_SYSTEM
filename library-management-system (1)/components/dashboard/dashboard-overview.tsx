"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, BookMarked, TrendingUp, Clock, AlertCircle } from "lucide-react"
import type { User, Book, BorrowingRecord } from "@/lib/types"

interface DashboardOverviewProps {
  user: User
}

interface DashboardStats {
  totalBooks: number
  availableBooks: number
  totalBorrowings: number
  overdueBorrowings: number
  recentBooks: Book[]
  recentBorrowings: BorrowingRecord[]
}

export default function DashboardOverview({ user }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch books
        const booksResponse = await fetch("/api/books?limit=5")
        const booksData = await booksResponse.json()

        // Fetch borrowing records
        const borrowingResponse = await fetch("/api/borrowing?limit=5")
        const borrowingData = await borrowingResponse.json()

        // Calculate stats
        const totalBooks = booksData.pagination?.total || 0
        const availableBooks = booksData.data?.filter((book: Book) => book.available_copies > 0).length || 0
        const totalBorrowings = borrowingData.data?.length || 0
        const overdueBorrowings =
          borrowingData.data?.filter(
            (record: BorrowingRecord) => record.status === "borrowed" && new Date(record.due_date) < new Date(),
          ).length || 0

        setStats({
          totalBooks,
          availableBooks,
          totalBorrowings,
          overdueBorrowings,
          recentBooks: booksData.data?.slice(0, 5) || [],
          recentBorrowings: borrowingData.data?.slice(0, 5) || [],
        })
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground text-balance">
          Welcome back, {user.full_name || user.email.split("@")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1 text-pretty">Here's what's happening in your library today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift animate-fade-in-up border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalBooks || 0}</div>
            <p className="text-xs text-muted-foreground">In your collection</p>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up border-secondary/20" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Books</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats?.availableBooks || 0}</div>
            <p className="text-xs text-muted-foreground">Ready to borrow</p>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up border-accent/20" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Borrowings</CardTitle>
            <BookMarked className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats?.totalBorrowings || 0}</div>
            <p className="text-xs text-muted-foreground">Currently borrowed</p>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up border-destructive/20" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.overdueBorrowings || 0}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Books */}
        <Card className="hover-lift animate-slide-in-right border-primary/10">
          <CardHeader>
            <CardTitle className="text-primary">Recent Books</CardTitle>
            <CardDescription>Latest additions to your library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentBooks.length ? (
                stats.recentBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="flex items-center space-x-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-8 bg-primary/20 rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {book.authors?.map((author) => author.name).join(", ") || "Unknown Author"}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge
                        variant={book.available_copies > 0 ? "default" : "secondary"}
                        className={book.available_copies > 0 ? "bg-secondary text-secondary-foreground" : ""}
                      >
                        {book.available_copies > 0 ? "Available" : "Borrowed"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No books found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Borrowings */}
        <Card className="hover-lift animate-slide-in-right border-secondary/10" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="text-secondary">Recent Activity</CardTitle>
            <CardDescription>Latest borrowing activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentBorrowings.length ? (
                stats.recentBorrowings.map((record, index) => (
                  <div
                    key={record.id}
                    className="flex items-center space-x-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-secondary/20 rounded-full flex items-center justify-center">
                        <Clock className="h-4 w-4 text-secondary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{record.book?.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {record.user?.full_name || record.user?.email}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          record.status === "borrowed"
                            ? new Date(record.due_date) < new Date()
                              ? "destructive"
                              : "default"
                            : "secondary"
                        }
                        className={
                          record.status === "borrowed" && new Date(record.due_date) >= new Date()
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

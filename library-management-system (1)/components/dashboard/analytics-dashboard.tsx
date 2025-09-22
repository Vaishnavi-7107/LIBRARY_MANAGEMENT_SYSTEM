"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { BookOpen, Users, BookMarked, AlertCircle, TrendingUp, Award } from "lucide-react"
import type { User } from "@/lib/types"

interface AnalyticsData {
  overview: {
    totalBooks: number
    totalUsers: number
    activeBorrowings: number
    overdueBorrowings: number
  }
  mostBorrowedBooks: Array<{
    book: any
    borrowCount: number
  }>
  borrowingTrends: Array<{
    date: string
    borrowings: number
  }>
  categoryDistribution: Array<{
    category: string
    count: number
  }>
  mostActiveUsers: Array<{
    user: any
    borrowCount: number
  }>
  period: number
}

interface AnalyticsDashboardProps {
  user: User
}

const COLORS = ["#d97706", "#10b981", "#fbbf24", "#e53e3e", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export default function AnalyticsDashboard({ user }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30")

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?period=${period}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      } else {
        console.error("Failed to fetch analytics:", data.message)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Failed to load analytics</h3>
        <p className="text-muted-foreground">Please try refreshing the page</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-pretty">Library performance insights and statistics</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48 border-primary/30 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift animate-fade-in-up border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{analytics.overview.totalBooks}</div>
            <p className="text-xs text-muted-foreground">In collection</p>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up border-secondary/20" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{analytics.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up border-accent/20" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Borrowings</CardTitle>
            <BookMarked className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{analytics.overview.activeBorrowings}</div>
            <p className="text-xs text-muted-foreground">Currently borrowed</p>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up border-destructive/20" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.overview.overdueBorrowings}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Borrowing Trends */}
        <Card className="hover-lift animate-slide-in-right border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Borrowing Trends
            </CardTitle>
            <CardDescription>Daily borrowing activity over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.borrowingTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    }
                  />
                  <Line type="monotone" dataKey="borrowings" stroke="#d97706" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="hover-lift animate-slide-in-right border-secondary/10" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="text-secondary">Category Distribution</CardTitle>
            <CardDescription>Books by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Borrowed Books */}
        <Card className="hover-lift animate-slide-in-right border-accent/10" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Award className="h-5 w-5" />
              Most Popular Books
            </CardTitle>
            <CardDescription>Top borrowed books in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.mostBorrowedBooks.length > 0 ? (
                analytics.mostBorrowedBooks.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-accent">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.book?.title || "Unknown Book"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.book?.authors?.map((ba: any) => ba.author?.name).join(", ") || "Unknown Author"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/20 text-accent">
                      {item.borrowCount} borrows
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No borrowing data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Active Users */}
        <Card className="hover-lift animate-slide-in-right border-primary/10" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              Most Active Users
            </CardTitle>
            <CardDescription>Top users by borrowing activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.mostActiveUsers.length > 0 ? (
                analytics.mostActiveUsers.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">#{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.user?.full_name || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{item.user?.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {item.borrowCount} borrows
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No user activity data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

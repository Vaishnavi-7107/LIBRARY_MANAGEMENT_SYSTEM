"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { BookMarked, Calendar, User, RotateCcw, Plus } from "lucide-react"
import type { User as UserType, BorrowingRecord, Book } from "@/lib/types"

interface BorrowingManagementProps {
  user: UserType
}

export default function BorrowingManagement({ user }: BorrowingManagementProps) {
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [showBorrowDialog, setShowBorrowDialog] = useState(false)
  const [formData, setFormData] = useState({
    book_id: "",
    user_id: "",
    notes: "",
  })

  const canManage = user.role === "admin" || user.role === "librarian"

  useEffect(() => {
    fetchBorrowings()
    if (canManage) {
      fetchBooks()
      fetchUsers()
    }
  }, [canManage])

  const fetchBorrowings = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/borrowing?${params}`)
      const data = await response.json()

      if (data.success) {
        setBorrowings(data.data)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch borrowing records",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch borrowing records",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books?available=true&limit=100")
      const data = await response.json()
      if (data.success) {
        setBooks(data.data.filter((book: Book) => book.available_copies > 0))
      }
    } catch (error) {
      console.error("Failed to fetch books:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([user])
    }
  }

  const handleBorrowBook = async () => {
    try {
      const response = await fetch("/api/borrowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Book borrowed successfully",
        })
        setShowBorrowDialog(false)
        setFormData({ book_id: "", user_id: "", notes: "" })
        fetchBorrowings()
        fetchBooks()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to borrow book",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to borrow book",
        variant: "destructive",
      })
    }
  }

  const handleReturnBook = async (borrowingId: string) => {
    try {
      const response = await fetch(`/api/borrowing/${borrowingId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Returned via dashboard" }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Book returned successfully",
        })
        fetchBorrowings()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to return book",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to return book",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isOverdue = (dueDate: string, status: string) => {
    return status === "borrowed" && new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-balance">Borrowing Management</h1>
          <p className="text-muted-foreground mt-1 text-pretty">
            {user.role === "user" ? "Your borrowing history" : "Manage library borrowing records"}
          </p>
        </div>
        {canManage && (
          <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 hover-lift">
                <Plus className="h-4 w-4 mr-2" />
                Borrow Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-primary">Borrow Book</DialogTitle>
                <DialogDescription>Create a new borrowing record</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2 animate-slide-in-right">
                  <Label htmlFor="book">Book</Label>
                  <Select
                    value={formData.book_id}
                    onValueChange={(value) => setFormData({ ...formData, book_id: value })}
                  >
                    <SelectTrigger className="border-primary/30 focus:border-primary">
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} ({book.available_copies} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: "0.1s" }}>
                  <Label htmlFor="user">User</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger className="border-primary/30 focus:border-primary">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="border-primary/30 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBorrowDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBorrowBook}
                  disabled={!formData.book_id || !formData.user_id}
                  className="bg-primary hover:bg-primary/90"
                >
                  Borrow Book
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="hover-lift animate-fade-in-up border-primary/20" style={{ animationDelay: "0.1s" }}>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-primary/30 focus:border-primary">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchBorrowings} className="bg-secondary hover:bg-secondary/90">
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Borrowing Records */}
      <div className="space-y-4">
        {borrowings.map((record, index) => (
          <Card
            key={record.id}
            className="hover-lift animate-fade-in-up border-primary/10"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-10 bg-primary/20 rounded flex items-center justify-center">
                      <BookMarked className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-foreground truncate">
                      {record.book?.title || "Unknown Book"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {record.user?.full_name || record.user?.email || "Unknown User"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Borrowed: {formatDate(record.borrowed_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {formatDate(record.due_date)}
                      </div>
                      {record.returned_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Returned: {formatDate(record.returned_at)}
                        </div>
                      )}
                    </div>
                    {record.notes && <p className="text-sm text-muted-foreground mt-2">{record.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      record.status === "returned"
                        ? "secondary"
                        : isOverdue(record.due_date, record.status)
                          ? "destructive"
                          : "default"
                    }
                    className={
                      record.status === "borrowed" && !isOverdue(record.due_date, record.status)
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                  >
                    {isOverdue(record.due_date, record.status) ? "Overdue" : record.status}
                  </Badge>
                  {canManage && record.status === "borrowed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReturnBook(record.id)}
                      className="text-secondary hover:text-secondary-foreground hover:bg-secondary/10 border-secondary/30 hover-lift"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Return
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {borrowings.length === 0 && (
        <Card className="hover-lift animate-fade-in-up border-primary/10">
          <CardContent className="text-center py-12">
            <BookMarked className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No borrowing records found</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== "all"
                ? "Try adjusting your filter criteria"
                : user.role === "user"
                  ? "You haven't borrowed any books yet"
                  : "No books have been borrowed yet"}
            </p>
            {canManage && statusFilter === "all" && (
              <Button onClick={() => setShowBorrowDialog(true)} className="bg-primary hover:bg-primary/90 hover-lift">
                <Plus className="h-4 w-4 mr-2" />
                Create First Borrowing Record
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

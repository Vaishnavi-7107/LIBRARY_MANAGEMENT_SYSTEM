// Type definitions for the Library Management System

export interface User {
  id: string
  email: string
  full_name?: string
  role: "user" | "librarian" | "admin"
  created_at: string
  updated_at: string
}

export interface Author {
  id: string
  name: string
  biography?: string
  birth_date?: string
  nationality?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Book {
  id: string
  title: string
  isbn?: string
  description?: string
  publication_date?: string
  publisher?: string
  pages?: number
  language: string
  available_copies: number
  total_copies: number
  category_id?: string
  cover_image_url?: string
  created_at: string
  updated_at: string
  created_by?: string
  // Relations
  category?: Category
  authors?: Author[]
}

export interface BorrowingRecord {
  id: string
  user_id: string
  book_id: string
  borrowed_at: string
  due_date: string
  returned_at?: string
  status: "borrowed" | "returned" | "overdue"
  notes?: string
  created_by?: string
  // Relations
  book?: Book
  user?: User
}

export interface Review {
  id: string
  user_id: string
  book_id: string
  rating: number
  review_text?: string
  created_at: string
  updated_at: string
  // Relations
  book?: Book
  user?: User
}

// API Response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  success: boolean
  message?: string
}

// Query parameters
export interface BookFilters {
  search?: string
  category?: string
  author?: string
  available?: boolean
  page?: number
  limit?: number
  sortBy?: "title" | "publication_date" | "created_at"
  sortOrder?: "asc" | "desc"
}

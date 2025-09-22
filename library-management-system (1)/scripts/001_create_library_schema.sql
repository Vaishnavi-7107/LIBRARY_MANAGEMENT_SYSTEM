-- Library Management System Database Schema
-- This script creates all necessary tables with proper relationships and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'librarian')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authors table
CREATE TABLE IF NOT EXISTS public.authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  biography TEXT,
  birth_date DATE,
  nationality TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  isbn TEXT UNIQUE,
  description TEXT,
  publication_date DATE,
  publisher TEXT,
  pages INTEGER,
  language TEXT DEFAULT 'English',
  available_copies INTEGER DEFAULT 1,
  total_copies INTEGER DEFAULT 1,
  category_id UUID REFERENCES public.categories(id),
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create book_authors junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.book_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  UNIQUE(book_id, author_id)
);

-- Create borrowing_records table
CREATE TABLE IF NOT EXISTS public.borrowing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  book_id UUID NOT NULL REFERENCES public.books(id),
  borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  returned_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  book_id UUID NOT NULL REFERENCES public.books(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for authors (readable by all authenticated users, manageable by admins/librarians)
CREATE POLICY "Authors are viewable by authenticated users" ON public.authors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and librarians can manage authors" ON public.authors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- RLS Policies for categories (readable by all authenticated users, manageable by admins/librarians)
CREATE POLICY "Categories are viewable by authenticated users" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and librarians can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- RLS Policies for books (readable by all authenticated users, manageable by admins/librarians)
CREATE POLICY "Books are viewable by authenticated users" ON public.books
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and librarians can manage books" ON public.books
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- RLS Policies for book_authors (readable by all authenticated users, manageable by admins/librarians)
CREATE POLICY "Book authors are viewable by authenticated users" ON public.book_authors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and librarians can manage book authors" ON public.book_authors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- RLS Policies for borrowing_records
CREATE POLICY "Users can view their own borrowing records" ON public.borrowing_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and librarians can view all borrowing records" ON public.borrowing_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Admins and librarians can manage borrowing records" ON public.borrowing_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'librarian')
    )
  );

-- RLS Policies for reviews
CREATE POLICY "Users can view all reviews" ON public.reviews
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own reviews" ON public.reviews
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON public.books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_user ON public.borrowing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_book ON public.borrowing_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_status ON public.borrowing_records(status);
CREATE INDEX IF NOT EXISTS idx_reviews_book ON public.reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Insert sample books
INSERT INTO public.books (title, author, isbn, category, description, publication_year, total_copies, available_copies) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 'A classic American novel set in the Jazz Age', 1925, 3, 3),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 'A gripping tale of racial injustice and childhood innocence', 1960, 2, 2),
('1984', 'George Orwell', '978-0-452-28423-4', 'Science Fiction', 'A dystopian social science fiction novel', 1949, 4, 4),
('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 'Romance', 'A romantic novel of manners', 1813, 2, 2),
('The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0', 'Fiction', 'A controversial novel about teenage rebellion', 1951, 3, 3),
('Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', '978-0-439-70818-8', 'Fantasy', 'The first book in the Harry Potter series', 1997, 5, 5),
('The Lord of the Rings', 'J.R.R. Tolkien', '978-0-544-00341-5', 'Fantasy', 'An epic high fantasy novel', 1954, 3, 3),
('Dune', 'Frank Herbert', '978-0-441-17271-9', 'Science Fiction', 'A science fiction novel set in the distant future', 1965, 2, 2),
('The Hobbit', 'J.R.R. Tolkien', '978-0-547-92822-7', 'Fantasy', 'A fantasy novel and children''s book', 1937, 4, 4),
('Brave New World', 'Aldous Huxley', '978-0-06-085052-4', 'Science Fiction', 'A dystopian novel about a technologically advanced future society', 1932, 2, 2);

-- Function to update book availability when borrowing status changes
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- If a book is being returned (status changed to 'returned')
  IF TG_OP = 'UPDATE' AND OLD.status != 'returned' AND NEW.status = 'returned' THEN
    UPDATE public.books 
    SET available_copies = available_copies + 1
    WHERE id = NEW.book_id;
  END IF;
  
  -- If a new borrowing is created
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books 
    SET available_copies = available_copies - 1
    WHERE id = NEW.book_id AND available_copies > 0;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update book availability
DROP TRIGGER IF EXISTS borrowing_availability_trigger ON public.borrowings;
CREATE TRIGGER borrowing_availability_trigger
  AFTER INSERT OR UPDATE ON public.borrowings
  FOR EACH ROW
  EXECUTE FUNCTION update_book_availability();

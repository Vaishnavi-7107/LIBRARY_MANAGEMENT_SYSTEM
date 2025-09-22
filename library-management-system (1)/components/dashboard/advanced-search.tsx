"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BookOpen, User, Tag } from "lucide-react"
import type { Book, Author, Category } from "@/lib/types"

interface SearchResults {
  books: Book[]
  authors: Author[]
  categories: Category[]
}

export default function AdvancedSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)
      } else {
        console.error("Search failed:", data.message)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalResults = results ? results.books.length + results.authors.length + results.categories.length : 0

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>Search across books, authors, and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for books, authors, or categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || query.length < 2}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
                <TabsTrigger value="books">Books ({results.books.length})</TabsTrigger>
                <TabsTrigger value="authors">Authors ({results.authors.length})</TabsTrigger>
                <TabsTrigger value="categories">Categories ({results.categories.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {/* Books */}
                {results.books.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Books
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {results.books.map((book) => (
                        <Card key={book.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-gray-900 mb-1">{book.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {book.authors?.map((author) => author.name).join(", ") || "Unknown Author"}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant={book.available_copies > 0 ? "default" : "secondary"}>
                                {book.available_copies > 0 ? "Available" : "Borrowed"}
                              </Badge>
                              {book.category && <Badge variant="outline">{book.category.name}</Badge>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authors */}
                {results.authors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Authors
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {results.authors.map((author) => (
                        <Card key={author.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-gray-900 mb-1">{author.name}</h4>
                            {author.nationality && <p className="text-sm text-gray-600 mb-2">{author.nationality}</p>}
                            {author.biography && (
                              <p className="text-sm text-gray-600 line-clamp-2">{author.biography}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {results.categories.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Categories
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {results.categories.map((category) => (
                        <Card key={category.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-gray-900 mb-1">{category.name}</h4>
                            {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {totalResults === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="books">
                {/* Books only view */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.books.map((book) => (
                    <Card key={book.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <h4 className="font-medium text-gray-900 mb-1">{book.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {book.authors?.map((author) => author.name).join(", ") || "Unknown Author"}
                        </p>
                        {book.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{book.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <Badge variant={book.available_copies > 0 ? "default" : "secondary"}>
                            {book.available_copies > 0 ? "Available" : "Borrowed"}
                          </Badge>
                          {book.category && <Badge variant="outline">{book.category.name}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="authors">
                {/* Authors only view */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.authors.map((author) => (
                    <Card key={author.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <h4 className="font-medium text-gray-900 mb-1">{author.name}</h4>
                        {author.nationality && <p className="text-sm text-gray-600 mb-2">{author.nationality}</p>}
                        {author.birth_date && (
                          <p className="text-sm text-gray-600 mb-2">
                            Born: {new Date(author.birth_date).toLocaleDateString()}
                          </p>
                        )}
                        {author.biography && <p className="text-sm text-gray-600 line-clamp-3">{author.biography}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="categories">
                {/* Categories only view */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.categories.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <h4 className="font-medium text-gray-900 mb-1">{category.name}</h4>
                        {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

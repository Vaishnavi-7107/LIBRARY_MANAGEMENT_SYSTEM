"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, Home, Users, BookMarked, BarChart3, Settings, Menu, LogOut, PlusCircle, Search } from "lucide-react"

interface DemoUser {
  id: string
  name: string
  role: string
  email: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  user: DemoUser
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Books", href: "/dashboard/books", icon: BookOpen },
  { name: "Borrowing", href: "/dashboard/borrowing", icon: BookMarked },
  { name: "Users", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, adminOnly: true },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    localStorage.removeItem("demo-user")
    router.push("/auth/login")
  }

  const filteredNavigation = navigation.filter((item) => !item.adminOnly || user.role === "admin")

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-primary/20">
        <BookOpen className="h-8 w-8 text-primary animate-pulse-glow" />
        <span className="ml-2 text-xl font-bold text-foreground">LibraryMS</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6 py-6">
        <ul className="flex flex-1 flex-col gap-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name} className="animate-fade-in-up">
                <Link
                  href={item.href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={`group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-all duration-200 hover-lift ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Quick Actions */}
        <div className="mt-8 border-t border-primary/20 pt-6 animate-slide-in-right">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent border-primary/30 hover:bg-primary/10 hover:border-primary transition-all duration-200"
              asChild
            >
              <Link href="/dashboard/books?action=add">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Book
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start bg-transparent border-secondary/30 hover:bg-secondary/10 hover:border-secondary transition-all duration-200"
              asChild
            >
              <Link href="/dashboard/books?search=">
                <Search className="h-4 w-4 mr-2" />
                Search Books
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-primary/20">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-primary/20 bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-primary/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary/10">
                    <Avatar className="h-8 w-8 hover-lift">
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <p className="text-xs leading-none text-primary capitalize font-medium">{user.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Users className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

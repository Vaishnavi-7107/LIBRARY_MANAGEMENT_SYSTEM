"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Shield, Database } from "lucide-react"
import type { User as UserType } from "@/lib/types"

interface SettingsManagementProps {
  user: UserType
}

export default function SettingsManagement({ user }: SettingsManagementProps) {
  const [profile, setProfile] = useState({
    full_name: user.full_name || "",
    email: user.email,
  })

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    overdue_reminders: true,
    new_book_alerts: false,
    system_updates: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    default_loan_period: 14,
    max_renewals: 2,
    overdue_fine_per_day: 0.5,
    max_books_per_user: 5,
  })

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: profile.full_name,
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Show success message
        console.log("Profile updated successfully")
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground text-balance">Settings</h1>
        <p className="text-muted-foreground mt-1 text-pretty">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          {user.role === "admin" && (
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="hover-lift border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="border-primary/30 focus:border-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed from this interface</p>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium capitalize">
                    {user.role}
                  </div>
                  <p className="text-xs text-muted-foreground">Contact an administrator to change your role</p>
                </div>
              </div>
              <Separator />
              <Button onClick={handleProfileUpdate} className="bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="hover-lift border-secondary/20">
            <CardHeader>
              <CardTitle className="text-secondary">Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_notifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminded about overdue books</p>
                </div>
                <Switch
                  checked={notifications.overdue_reminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, overdue_reminders: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Book Alerts</Label>
                  <p className="text-sm text-muted-foreground">Be notified when new books are added</p>
                </div>
                <Switch
                  checked={notifications.new_book_alerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, new_book_alerts: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Updates</Label>
                  <p className="text-sm text-muted-foreground">Receive system maintenance notifications</p>
                </div>
                <Switch
                  checked={notifications.system_updates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, system_updates: checked })}
                />
              </div>
              <Separator />
              <Button className="bg-secondary hover:bg-secondary/90">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="hover-lift border-accent/20">
            <CardHeader>
              <CardTitle className="text-accent">Security Settings</CardTitle>
              <CardDescription>Manage your account security and privacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Change Password</Label>
                <p className="text-sm text-muted-foreground">
                  To change your password, you'll need to reset it through the login page
                </p>
                <Button variant="outline" className="border-accent/30 hover:bg-accent/10 bg-transparent">
                  Reset Password
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Account Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Last login: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Data Export</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your library activity and personal data
                </p>
                <Button variant="outline" className="border-accent/30 hover:bg-accent/10 bg-transparent">
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "admin" && (
          <TabsContent value="system" className="space-y-6">
            <Card className="hover-lift border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">System Settings</CardTitle>
                <CardDescription>Configure library-wide settings and policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="loan_period">Default Loan Period (days)</Label>
                  <Input
                    id="loan_period"
                    type="number"
                    value={systemSettings.default_loan_period}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, default_loan_period: Number.parseInt(e.target.value) })
                    }
                    className="border-destructive/30 focus:border-destructive"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_renewals">Maximum Renewals</Label>
                  <Input
                    id="max_renewals"
                    type="number"
                    value={systemSettings.max_renewals}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, max_renewals: Number.parseInt(e.target.value) })
                    }
                    className="border-destructive/30 focus:border-destructive"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="overdue_fine">Overdue Fine per Day ($)</Label>
                  <Input
                    id="overdue_fine"
                    type="number"
                    step="0.01"
                    value={systemSettings.overdue_fine_per_day}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, overdue_fine_per_day: Number.parseFloat(e.target.value) })
                    }
                    className="border-destructive/30 focus:border-destructive"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_books">Maximum Books per User</Label>
                  <Input
                    id="max_books"
                    type="number"
                    value={systemSettings.max_books_per_user}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, max_books_per_user: Number.parseInt(e.target.value) })
                    }
                    className="border-destructive/30 focus:border-destructive"
                  />
                </div>
                <Separator />
                <Button className="bg-destructive hover:bg-destructive/90">Save System Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

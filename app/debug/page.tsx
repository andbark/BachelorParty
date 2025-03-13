"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { setupDatabase } from "@/lib/database-setup"
import { useToast } from "@/hooks/use-toast"

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSetupDatabase() {
    setIsLoading(true)
    try {
      await setupDatabase()
      toast({
        title: "Database setup complete",
        description: "All necessary tables and functions have been created",
      })
    } catch (error) {
      toast({
        title: "Database setup failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Debug Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Setup</CardTitle>
            <CardDescription>Create all necessary tables and functions in your Supabase database</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSetupDatabase} disabled={isLoading} className="w-full">
              {isLoading ? "Setting up..." : "Setup Database"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

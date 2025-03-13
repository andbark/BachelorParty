"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  async function testBroadcast() {
    try {
      const channel = supabase.channel("custom-all-channel")
      await channel.subscribe((status) => {
        console.log("Broadcast channel status:", status)
      })

      await channel.send({
        type: "broadcast",
        event: "game_created",
        payload: { test: true },
      })

      toast({
        title: "Test broadcast sent",
        description: "Check console for details",
      })
    } catch (error) {
      console.error("Error sending test broadcast:", error)
      toast({
        title: "Error sending test broadcast",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  async function testDatabaseConnection() {
    try {
      const { data, error } = await supabase.from("games").select("count").single()

      if (error) throw error

      toast({
        title: "Database connection successful",
        description: `Found ${data.count} games in the database`,
      })
    } catch (error) {
      console.error("Database connection error:", error)
      toast({
        title: "Database connection error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (!isVisible) {
    return (
      <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50" onClick={() => setIsVisible(true)}>
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex justify-between">
          Debug Panel
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsVisible(false)}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button size="sm" className="w-full" onClick={testBroadcast}>
          Test Broadcast
        </Button>
        <Button size="sm" className="w-full" onClick={testDatabaseConnection}>
          Test DB Connection
        </Button>
      </CardContent>
    </Card>
  )
}

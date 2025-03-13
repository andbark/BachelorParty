"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { History, Trophy } from "lucide-react"

type GameHistoryEntry = {
  id: string
  game_id: string
  game_type: string
  winner_id: string
  winner_name: string
  winnings: number
  participants: string[]
  completed_at: string
}

export default function GameHistory() {
  const [history, setHistory] = useState<GameHistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<GameHistoryEntry[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchGameHistory()
  }, [])

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredHistory(history)
    } else {
      setFilteredHistory(history.filter((entry) => entry.game_type.toLowerCase() === activeFilter.toLowerCase()))
    }
  }, [activeFilter, history])

  async function fetchGameHistory() {
    const { data, error } = await supabase.from("game_history").select("*").order("completed_at", { ascending: false })

    if (error) {
      toast({
        title: "Error fetching game history",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setHistory(data || [])
    setFilteredHistory(data || [])
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Get unique game types for filters
  const gameTypes = ["all", ...new Set(history.map((entry) => entry.game_type.toLowerCase()))]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Game History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="flex flex-wrap">
            {gameTypes.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type === "all" ? "All Games" : type}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeFilter} className="space-y-4 mt-4">
            {filteredHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No game history found</p>
            ) : (
              filteredHistory.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{entry.game_type}</h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Trophy className="h-4 w-4" />
                        <span className="font-medium">
                          {entry.winner_name} won ${entry.winnings}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatTimeAgo(entry.completed_at)}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Players: {entry.participants.join(", ")}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface GameHistory {
  id: string
  game_id: string
  winner_id: string
  pot_amount: number
  created_at: string
  game: {
    name: string
    buy_in: number
  }
  winner: {
    name: string
  }
}

interface SideBet {
  id: string
  from_player_id: string
  to_player_id: string
  amount: number
  created_at: string
  from_player: {
    name: string
  }
  to_player: {
    name: string
  }
}

type HistoryItem = {
  id: string
  type: "game" | "side_bet"
  timestamp: string
  content: GameHistory | SideBet
}

export default function GameHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missingTables, setMissingTables] = useState<string[]>([])

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        setError(null)
        setMissingTables([])

        const missing: string[] = []
        let gameHistoryData: any[] = []
        let sideBetsData: any[] = []

        // Try to fetch game history
        try {
          const { data, error } = await supabase
            .from("game_history")
            .select("*")
            .order("created_at", { ascending: false })

          if (error && error.message.includes("does not exist")) {
            missing.push("game_history")
          } else if (error) {
            throw error
          } else {
            gameHistoryData = data || []
          }
        } catch (err: any) {
          if (err.message && err.message.includes("does not exist")) {
            missing.push("game_history")
          } else {
            throw err
          }
        }

        // Try to fetch side bets
        try {
          const { data, error } = await supabase.from("side_bets").select("*").order("created_at", { ascending: false })

          if (error && error.message.includes("does not exist")) {
            missing.push("side_bets")
          } else if (error) {
            throw error
          } else {
            sideBetsData = data || []
          }
        } catch (err: any) {
          if (err.message && err.message.includes("does not exist")) {
            missing.push("side_bets")
          } else {
            throw err
          }
        }

        setMissingTables(missing)

        // If both tables are missing, just return early
        if (missing.includes("game_history") && missing.includes("side_bets")) {
          setLoading(false)
          return
        }

        // Fetch games and players for joining
        const { data: gamesData, error: gamesError } = await supabase.from("games").select("*")

        if (gamesError) throw gamesError

        const { data: playersData, error: playersError } = await supabase.from("players").select("*")

        if (playersError) throw playersError

        // Create maps for quick lookups
        const gamesMap = new Map(gamesData?.map((game) => [game.id, game]) || [])
        const playersMap = new Map(playersData?.map((player) => [player.id, player]) || [])

        // Process game history if available
        const gameHistory: HistoryItem[] = !missing.includes("game_history")
          ? gameHistoryData.map((history) => {
              const game = gamesMap.get(history.game_id)
              const winner = playersMap.get(history.winner_id)

              return {
                id: `game_${history.id}`,
                type: "game",
                timestamp: history.created_at,
                content: {
                  ...history,
                  game: {
                    name: game?.name || "Unknown Game",
                    buy_in: game?.buy_in || 0,
                  },
                  winner: {
                    name: winner?.name || "Unknown Player",
                  },
                },
              }
            })
          : []

        // Process side bets if available
        const betHistory: HistoryItem[] = !missing.includes("side_bets")
          ? sideBetsData.map((bet) => {
              const fromPlayer = playersMap.get(bet.from_player_id)
              const toPlayer = playersMap.get(bet.to_player_id)

              return {
                id: `bet_${bet.id}`,
                type: "side_bet",
                timestamp: bet.created_at,
                content: {
                  ...bet,
                  from_player: {
                    name: fromPlayer?.name || "Unknown Player",
                  },
                  to_player: {
                    name: toPlayer?.name || "Unknown Player",
                  },
                },
              }
            })
          : []

        const combinedHistory = [...gameHistory, ...betHistory].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )

        setHistory(combinedHistory)
      } catch (error: any) {
        console.error("Error fetching history:", error)
        setError(`Failed to load game history: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()

    // Only set up subscriptions if tables exist
    const subscriptions: any[] = []

    // We'll set up subscriptions in a separate function to avoid errors
    async function setupSubscriptions() {
      try {
        // Check if game_history table exists
        const { error: gameHistoryError } = await supabase.from("game_history").select("count").limit(1).throwOnError()

        if (!gameHistoryError) {
          const gameSubscription = supabase
            .channel("game-history-changes")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "game_history",
              },
              () => {
                fetchHistory()
              },
            )
            .subscribe()

          subscriptions.push(gameSubscription)
        }

        // Check if side_bets table exists
        const { error: sideBetsError } = await supabase.from("side_bets").select("count").limit(1).throwOnError()

        if (!sideBetsError) {
          const betSubscription = supabase
            .channel("side-bet-changes")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "side_bets",
              },
              () => {
                fetchHistory()
              },
            )
            .subscribe()

          subscriptions.push(betSubscription)
        }
      } catch (error) {
        // Silently fail for subscription setup
        console.log("Error setting up subscriptions:", error)
      }
    }

    setupSubscriptions()

    return () => {
      // Clean up any subscriptions that were created
      subscriptions.forEach((subscription) => subscription.unsubscribe())
    }
  }, [])

  async function createTables() {
    setLoading(true)
    setError(null)

    try {
      // Create game_history table if missing
      if (missingTables.includes("game_history")) {
        const { error: createGameHistoryError } = await supabase.rpc("create_game_history_table")

        if (createGameHistoryError) {
          // If RPC fails, show instructions instead
          setError(`Cannot automatically create game_history table. Please create it manually in Supabase.`)
          setLoading(false)
          return
        }
      }

      // Create side_bets table if missing
      if (missingTables.includes("side_bets")) {
        const { error: createSideBetsError } = await supabase.rpc("create_side_bets_table")

        if (createSideBetsError) {
          // If RPC fails, show instructions instead
          setError(`Cannot automatically create side_bets table. Please create it manually in Supabase.`)
          setLoading(false)
          return
        }
      }

      // Refresh data after creating tables
      window.location.reload()
    } catch (error: any) {
      console.error("Error creating tables:", error)
      setError(`Failed to create tables: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading game history...</CardContent>
      </Card>
    )
  }

  if (missingTables.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-md">
            <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Missing Database Tables</h3>
            <p className="text-amber-700 dark:text-amber-400 mb-4">
              The following tables need to be created in your Supabase database:
            </p>
            <ul className="list-disc pl-5 mb-4 text-amber-700 dark:text-amber-400">
              {missingTables.map((table) => (
                <li key={table}>{table}</li>
              ))}
            </ul>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              You can create these tables manually in the Supabase dashboard or click the button below to attempt
              automatic creation.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createTables}>Create Missing Tables</Button>
        </CardFooter>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-destructive">{error}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p>No game history yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border-b pb-3 last:border-0">
                <div className="text-sm text-muted-foreground mb-1">{formatDate(item.timestamp)}</div>

                {item.type === "game" && (
                  <div>
                    <span className="font-medium">{(item.content as GameHistory).winner.name}</span>
                    {" won "}
                    <span className="font-mono">${(item.content as GameHistory).pot_amount}</span>
                    {" in "}
                    <span className="font-medium">{(item.content as GameHistory).game.name}</span>
                  </div>
                )}

                {item.type === "side_bet" && (
                  <div>
                    <span className="font-medium">{(item.content as SideBet).from_player.name}</span>
                    {" paid "}
                    <span className="font-mono">${(item.content as SideBet).amount}</span>
                    {" to "}
                    <span className="font-medium">{(item.content as SideBet).to_player.name}</span>
                    {" (Side Bet)"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

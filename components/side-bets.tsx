"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

interface Player {
  id: string
  name: string
  balance: number
}

export default function SideBets() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  // Side bet form state
  const [fromPlayer, setFromPlayer] = useState<string | null>(null)
  const [toPlayer, setToPlayer] = useState<string | null>(null)
  const [amount, setAmount] = useState(50)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        setLoading(true)

        const { data, error } = await supabase.from("players").select("*").order("name")

        if (error) {
          throw error
        }

        setPlayers(data || [])
      } catch (error) {
        console.error("Error fetching players:", error)
        setError("Failed to load players")
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()

    // Set up real-time subscription
    const subscription = supabase
      .channel("players-side-bets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((current) => [...current, payload.new as Player])
          } else if (payload.eventType === "UPDATE") {
            setPlayers((current) =>
              current.map((player) => (player.id === payload.new.id ? (payload.new as Player) : player)),
            )
          } else if (payload.eventType === "DELETE") {
            setPlayers((current) => current.filter((player) => player.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSideBet() {
    try {
      if (!fromPlayer || !toPlayer) {
        alert("Please select both players")
        return
      }

      if (fromPlayer === toPlayer) {
        alert("Cannot make a side bet with the same player")
        return
      }

      if (amount <= 0) {
        alert("Amount must be greater than 0")
        return
      }

      // Get the players
      const from = players.find((p) => p.id === fromPlayer)
      const to = players.find((p) => p.id === toPlayer)

      if (!from || !to) {
        alert("Invalid player selection")
        return
      }

      // Check if player has enough balance
      if (from.balance < amount) {
        alert(`${from.name} doesn't have enough balance for this bet`)
        return
      }

      // Update balances
      const { error: fromError } = await supabase
        .from("players")
        .update({ balance: from.balance - amount })
        .eq("id", fromPlayer)

      if (fromError) throw fromError

      const { error: toError } = await supabase
        .from("players")
        .update({ balance: to.balance + amount })
        .eq("id", toPlayer)

      if (toError) throw toError

      // Record the side bet
      const { error: betError } = await supabase.from("side_bets").insert([
        {
          from_player_id: fromPlayer,
          to_player_id: toPlayer,
          amount: amount,
        },
      ])

      if (betError) throw betError

      // Reset form
      setFromPlayer(null)
      setToPlayer(null)
      setAmount(50)
      setOpen(false)
    } catch (error) {
      console.error("Error processing side bet:", error)
      alert("Failed to process side bet")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading side bets...</CardContent>
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
        <CardTitle>Side Bets</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Record side bets between players for 1v1 games or other wagers.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setOpen(true)}>New Side Bet</Button>
      </CardFooter>

      {/* Side Bet Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Side Bet</DialogTitle>
            <DialogDescription>Record a side bet between two players.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="from-player">From Player (Loser)</Label>
              <Select value={fromPlayer || ""} onValueChange={setFromPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player who lost" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} (${player.balance})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to-player">To Player (Winner)</Label>
              <Select value={toPlayer || ""} onValueChange={setToPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player who won" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} (${player.balance})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSideBet}>Record Side Bet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

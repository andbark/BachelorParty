"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { User } from "lucide-react"

type Player = {
  id: string
  name: string
  balance: number
  games_played: number
  games_won: number
}

export default function PlayerBalances() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    const { data, error } = await supabase.from("players").select("*")

    if (error) {
      toast({
        title: "Error fetching players",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setPlayers(data || [])
  }

  async function addPlayer() {
    if (!newPlayerName.trim()) {
      toast({
        title: "Invalid name",
        description: "Please provide a player name",
        variant: "destructive",
      })
      return
    }

    const newPlayer = {
      name: newPlayerName,
      balance: 300, // Starting balance
      games_played: 0,
      games_won: 0,
    }

    const { data, error } = await supabase.from("players").insert([newPlayer]).select()

    if (error) {
      toast({
        title: "Error adding player",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Player added",
      description: `${newPlayerName} has been added with $300`,
    })

    setNewPlayerName("")
    setIsAddPlayerOpen(false)
    fetchPlayers()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Player Balances</h2>
        <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
          <DialogTrigger asChild>
            <Button>Add Player</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                />
              </div>
              <Button onClick={addPlayer} className="w-full">
                Add Player
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.map((player) => (
          <Card key={player.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-5 w-5" />
                <h3 className="font-medium">{player.name}</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold">${player.balance}</p>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <p>Games Played: {player.games_played}</p>
                  <p>Games Won: {player.games_won}</p>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full"
                    style={{
                      width: `${player.games_played > 0 ? (player.games_won / player.games_played) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

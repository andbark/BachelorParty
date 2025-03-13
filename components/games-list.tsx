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

interface Game {
  id: string
  name: string
  buy_in: number
  active: boolean
  created_at: string
}

interface Player {
  id: string
  name: string
  balance: number
}

export default function GamesList() {
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New game form state
  const [newGameName, setNewGameName] = useState("")
  const [newGameBuyIn, setNewGameBuyIn] = useState(50)
  const [newGameOpen, setNewGameOpen] = useState(false)

  // Join game form state
  const [joinGameOpen, setJoinGameOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  // End game form state
  const [endGameOpen, setEndGameOpen] = useState(false)
  const [winnerPlayer, setWinnerPlayer] = useState<string | null>(null)
  const [endingGame, setEndingGame] = useState<Game | null>(null)
  const [participants, setParticipants] = useState<Player[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch games
        const { data: gamesData, error: gamesError } = await supabase
          .from("games")
          .select("*")
          .order("created_at", { ascending: false })

        if (gamesError) throw gamesError
        setGames(gamesData || [])

        // Fetch players
        const { data: playersData, error: playersError } = await supabase.from("players").select("*").order("name")

        if (playersError) throw playersError
        setPlayers(playersData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load games and players")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for games
    const gamesSubscription = supabase
      .channel("games-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setGames((current) => [payload.new as Game, ...current])
          } else if (payload.eventType === "UPDATE") {
            setGames((current) => current.map((game) => (game.id === payload.new.id ? (payload.new as Game) : game)))
          } else if (payload.eventType === "DELETE") {
            setGames((current) => current.filter((game) => game.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Set up real-time subscription for players
    const playersSubscription = supabase
      .channel("players-changes")
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
      gamesSubscription.unsubscribe()
      playersSubscription.unsubscribe()
    }
  }, [])

  async function handleCreateGame() {
    try {
      if (!newGameName.trim()) {
        alert("Please enter a game name")
        return
      }

      const { data, error } = await supabase
        .from("games")
        .insert([
          {
            name: newGameName,
            buy_in: newGameBuyIn,
            active: true,
          },
        ])
        .select()

      if (error) throw error

      setNewGameName("")
      setNewGameBuyIn(50)
      setNewGameOpen(false)
    } catch (error) {
      console.error("Error creating game:", error)
      alert("Failed to create game")
    }
  }

  async function handleJoinGame() {
    try {
      if (!selectedGame || !selectedPlayer) {
        alert("Please select both a game and a player")
        return
      }

      // Get the selected game and player
      const game = games.find((g) => g.id === selectedGame)
      const player = players.find((p) => p.id === selectedPlayer)

      if (!game || !player) {
        alert("Invalid game or player selection")
        return
      }

      // Check if player has enough balance
      if (player.balance < game.buy_in) {
        alert(`${player.name} doesn't have enough balance to join this game`)
        return
      }

      // Create a game participant record
      const { error: participantError } = await supabase.from("game_participants").insert([
        {
          game_id: selectedGame,
          player_id: selectedPlayer,
        },
      ])

      if (participantError) throw participantError

      // Update player balance
      const { error: balanceError } = await supabase
        .from("players")
        .update({ balance: player.balance - game.buy_in })
        .eq("id", selectedPlayer)

      if (balanceError) throw balanceError

      setSelectedGame(null)
      setSelectedPlayer(null)
      setJoinGameOpen(false)
    } catch (error) {
      console.error("Error joining game:", error)
      alert("Failed to join game")
    }
  }

  async function handlePrepareEndGame(game: Game) {
    try {
      // Fetch participants for this game
      const { data, error } = await supabase
        .from("game_participants")
        .select(`
          player_id,
          players:player_id (
            id,
            name,
            balance
          )
        `)
        .eq("game_id", game.id)

      if (error) throw error

      const participantPlayers = data.map((item) => item.players as Player)
      setParticipants(participantPlayers)
      setEndingGame(game)
      setWinnerPlayer(null)
      setEndGameOpen(true)
    } catch (error) {
      console.error("Error preparing to end game:", error)
      alert("Failed to load game participants")
    }
  }

  async function handleEndGame() {
    try {
      if (!endingGame || !winnerPlayer) {
        alert("Please select a winner")
        return
      }

      // Calculate pot size (buy-in * number of participants)
      const potSize = endingGame.buy_in * participants.length

      // Get the winner
      const winner = players.find((p) => p.id === winnerPlayer)
      if (!winner) {
        alert("Invalid winner selection")
        return
      }

      // Update winner's balance
      const { error: balanceError } = await supabase
        .from("players")
        .update({ balance: winner.balance + potSize })
        .eq("id", winnerPlayer)

      if (balanceError) throw balanceError

      // Update game status
      const { error: gameError } = await supabase.from("games").update({ active: false }).eq("id", endingGame.id)

      if (gameError) throw gameError

      // Create game history record
      const { error: historyError } = await supabase.from("game_history").insert([
        {
          game_id: endingGame.id,
          winner_id: winnerPlayer,
          pot_amount: potSize,
        },
      ])

      if (historyError) throw historyError

      setEndGameOpen(false)
      setEndingGame(null)
      setWinnerPlayer(null)
    } catch (error) {
      console.error("Error ending game:", error)
      alert("Failed to end game")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">Loading games...</CardContent>
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

  const activeGames = games.filter((game) => game.active)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Games</CardTitle>
      </CardHeader>
      <CardContent>
        {activeGames.length === 0 ? (
          <p>No active games. Create a new game to get started.</p>
        ) : (
          <div className="space-y-4">
            {activeGames.map((game) => (
              <div key={game.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="font-medium">{game.name}</div>
                  <div className="text-sm text-muted-foreground">${game.buy_in} buy-in</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedGame(game.id)
                      setJoinGameOpen(true)
                    }}
                  >
                    Join
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePrepareEndGame(game)}>
                    End
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => setNewGameOpen(true)}>New Game</Button>
      </CardFooter>

      {/* Create New Game Dialog */}
      <Dialog open={newGameOpen} onOpenChange={setNewGameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Game</DialogTitle>
            <DialogDescription>Add a new game for players to join.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Poker, Blackjack, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buy-in">Buy-in Amount ($)</Label>
              <Input
                id="buy-in"
                type="number"
                value={newGameBuyIn}
                onChange={(e) => setNewGameBuyIn(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGame}>Create Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Game Dialog */}
      <Dialog open={joinGameOpen} onOpenChange={setJoinGameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Game</DialogTitle>
            <DialogDescription>Select a player to join this game.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="game">Game</Label>
              <Select value={selectedGame || ""} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {activeGames.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name} (${game.buy_in})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="player">Player</Label>
              <Select value={selectedPlayer || ""} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinGameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoinGame}>Join Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Game Dialog */}
      <Dialog open={endGameOpen} onOpenChange={setEndGameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Game</DialogTitle>
            <DialogDescription>Select the winner of this game.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {participants.length === 0 ? (
              <p>No participants found for this game.</p>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="winner">Winner</Label>
                <Select value={winnerPlayer || ""} onValueChange={setWinnerPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndGameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndGame} disabled={participants.length === 0 || !winnerPlayer}>
              End Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

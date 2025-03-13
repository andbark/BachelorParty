"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"

type Player = {
  id: string
  name: string
  balance: number
}

type Team = {
  id: string
  name: string
  members: string[]
}

export default function CreateGame() {
  const [isOpen, setIsOpen] = useState(false)
  const [gameType, setGameType] = useState("")
  const [isTeamGame, setIsTeamGame] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<{ id: string; wager: number }[]>([])
  const [selectedTeams, setSelectedTeams] = useState<{ id: string; wager: number }[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPlayers()
    fetchTeams()
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

  async function fetchTeams() {
    const { data, error } = await supabase.from("teams").select("*")

    if (error) {
      toast({
        title: "Error fetching teams",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setTeams(data || [])
  }

  function togglePlayer(playerId: string) {
    if (selectedPlayers.some((p) => p.id === playerId)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId))
    } else {
      setSelectedPlayers([...selectedPlayers, { id: playerId, wager: 0 }])
    }
  }

  function toggleTeam(teamId: string) {
    if (selectedTeams.some((t) => t.id === teamId)) {
      setSelectedTeams(selectedTeams.filter((t) => t.id !== teamId))
    } else {
      setSelectedTeams([...selectedTeams, { id: teamId, wager: 0 }])
    }
  }

  function updatePlayerWager(playerId: string, wager: number) {
    setSelectedPlayers(selectedPlayers.map((p) => (p.id === playerId ? { ...p, wager } : p)))
  }

  function updateTeamWager(teamId: string, wager: number) {
    setSelectedTeams(selectedTeams.map((t) => (t.id === teamId ? { ...t, wager } : t)))
  }

  async function createGame() {
    if (!gameType) {
      toast({
        title: "Game type required",
        description: "Please select a game type",
        variant: "destructive",
      })
      return
    }

    if (isTeamGame && selectedTeams.length < 2) {
      toast({
        title: "Not enough teams",
        description: "Please select at least 2 teams",
        variant: "destructive",
      })
      return
    }

    if (!isTeamGame && selectedPlayers.length < 2) {
      toast({
        title: "Not enough players",
        description: "Please select at least 2 players",
        variant: "destructive",
      })
      return
    }

    // Create the game in the database
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert([
        {
          type: gameType,
          is_team_game: isTeamGame,
          status: "in_progress",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (gameError || !gameData) {
      toast({
        title: "Error creating game",
        description: gameError?.message || "Unknown error",
        variant: "destructive",
      })
      return
    }

    const gameId = gameData[0].id

    // Add participants to the game
    if (isTeamGame) {
      for (const team of selectedTeams) {
        await supabase.from("game_teams").insert([
          {
            game_id: gameId,
            team_id: team.id,
            wager: team.wager,
          },
        ])
      }
    } else {
      for (const player of selectedPlayers) {
        await supabase.from("game_players").insert([
          {
            game_id: gameId,
            player_id: player.id,
            wager: player.wager,
          },
        ])
      }
    }

    toast({
      title: "Game created",
      description: `${gameType} game has been created successfully!`,
    })

    setIsOpen(false)
    resetForm()
  }

  function resetForm() {
    setGameType("")
    setIsTeamGame(false)
    setSelectedPlayers([])
    setSelectedTeams([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full md:w-auto">
          Create New Game
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a New Game</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="game-type">Game Type</Label>
              <Select value={gameType} onValueChange={setGameType}>
                <SelectTrigger id="game-type">
                  <SelectValue placeholder="Select game type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Poker">Poker</SelectItem>
                  <SelectItem value="Blackjack">Blackjack</SelectItem>
                  <SelectItem value="Roulette">Roulette</SelectItem>
                  <SelectItem value="Craps">Craps</SelectItem>
                  <SelectItem value="Beer Pong">Beer Pong</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-game"
                  checked={isTeamGame}
                  onCheckedChange={(checked) => setIsTeamGame(checked === true)}
                />
                <Label htmlFor="team-game">Team Game</Label>
              </div>
            </div>
          </div>

          {isTeamGame ? (
            <div>
              <Label>Select Teams</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {teams.map((team) => (
                  <Card key={team.id} className={selectedTeams.some((t) => t.id === team.id) ? "border-primary" : ""}>
                    <CardHeader className="p-3">
                      <CardTitle className="text-base flex justify-between">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-normal justify-start"
                          onClick={() => toggleTeam(team.id)}
                        >
                          {team.name}
                        </Button>
                        {selectedTeams.some((t) => t.id === team.id) && (
                          <Input
                            type="number"
                            className="w-24 h-8"
                            placeholder="Wager"
                            value={selectedTeams.find((t) => t.id === team.id)?.wager || 0}
                            onChange={(e) => updateTeamWager(team.id, Number(e.target.value))}
                          />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label>Select Players</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {players.map((player) => (
                  <Card
                    key={player.id}
                    className={selectedPlayers.some((p) => p.id === player.id) ? "border-primary" : ""}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="text-base flex justify-between">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-normal justify-start"
                          onClick={() => togglePlayer(player.id)}
                        >
                          {player.name} (${player.balance})
                        </Button>
                        {selectedPlayers.some((p) => p.id === player.id) && (
                          <Input
                            type="number"
                            className="w-24 h-8"
                            placeholder="Wager"
                            value={selectedPlayers.find((p) => p.id === player.id)?.wager || 0}
                            onChange={(e) => updatePlayerWager(player.id, Number(e.target.value))}
                          />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createGame}>Create Game</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


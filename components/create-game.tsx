"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

type TeamFormation = {
  id: string
  name: string
  players: string[]
}

export default function CreateGame() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState("")
  const [isTeamGame, setIsTeamGame] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [gameWager, setGameWager] = useState<number>(0)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const [teamFormations, setTeamFormations] = useState<TeamFormation[]>([
    { id: "1", name: "Team 1", players: [] },
    { id: "2", name: "Team 2", players: [] },
  ])

  useEffect(() => {
    if (isOpen) {
      fetchPlayers()
      fetchTeams()
    }
  }, [isOpen])

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
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
    } else {
      setSelectedPlayers([...selectedPlayers, playerId])
    }
  }

  function addNewTeam() {
    const newTeamNumber = teamFormations.length + 1
    setTeamFormations([...teamFormations, { id: String(newTeamNumber), name: `Team ${newTeamNumber}`, players: [] }])
  }

  function assignPlayerToTeam(playerId: string, teamId: string) {
    // Remove player from any existing team
    const updatedTeams = teamFormations.map((team) => ({
      ...team,
      players: team.players.filter((id) => id !== playerId),
    }))

    // Add player to selected team
    const finalTeams = updatedTeams.map((team) =>
      team.id === teamId ? { ...team, players: [...team.players, playerId] } : team,
    )

    setTeamFormations(finalTeams)
  }

  async function createGame() {
    try {
      setIsCreating(true)

      // Validate game type
      if (!selectedGameType.trim()) {
        toast({
          title: "Game type required",
          description: "Please enter a game type",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      // Validate wager amount
      if (!gameWager || gameWager <= 0) {
        toast({
          title: "Wager required",
          description: "Please enter a valid wager amount greater than zero",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      // Validate team game requirements
      if (isTeamGame) {
        const teamsWithPlayers = teamFormations.filter((team) => team.players.length > 0)

        // Check if we have at least 2 teams with players
        if (teamsWithPlayers.length < 2) {
          toast({
            title: "Not enough teams",
            description: "Please select at least 2 teams with players",
            variant: "destructive",
          })
          setIsCreating(false)
          return
        }
      } else {
        // Validate individual player game requirements
        if (selectedPlayers.length < 2) {
          toast({
            title: "Not enough players",
            description: "Please select at least 2 players",
            variant: "destructive",
          })
          setIsCreating(false)
          return
        }
      }

      // Create the game in the database
      const gameData = {
        type: selectedGameType.trim(),
        status: "in_progress",
        is_team_game: isTeamGame,
      }

      try {
        // Create the game
        const { data, error: gameError } = await supabase.from("games").insert([gameData]).select()

        if (gameError) throw gameError

        if (!data || data.length === 0) {
          throw new Error("No game data returned from the server")
        }

        const gameId = data[0].id
        console.log("Game created with ID:", gameId)

        // Add participants to the game
        if (isTeamGame) {
          console.log("Adding team players to game")
          for (const team of teamFormations) {
            if (team.players.length > 0) {
              for (const playerId of team.players) {
                const { error: playerError } = await supabase.from("game_players").insert([
                  {
                    game_id: gameId,
                    player_id: playerId,
                    wager: gameWager,
                    team_id: team.id,
                  },
                ])

                if (playerError) throw playerError
              }
            }
          }
        } else {
          console.log("Adding individual players to game")
          for (const playerId of selectedPlayers) {
            const { error: playerError } = await supabase.from("game_players").insert([
              {
                game_id: gameId,
                player_id: playerId,
                wager: gameWager,
              },
            ])

            if (playerError) throw playerError
          }
        }

        console.log("Game creation completed successfully")
        toast({
          title: "Game created",
          description: `${selectedGameType} game has been created successfully!`,
        })

        // Manually trigger a refresh of the games list
        const channel = supabase.channel("custom-all-channel")
        await channel.subscribe()
        await channel.send({
          type: "broadcast",
          event: "game_created",
          payload: { gameId },
        })

        setIsOpen(false)
        resetForm()
      } catch (error) {
        console.error("Error in game creation:", error)
        throw error
      }
    } catch (error) {
      console.error("Error creating game:", error)
      toast({
        title: "Error creating game",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  function resetForm() {
    setSelectedGameType("")
    setIsTeamGame(false)
    setSelectedPlayers([])
    setGameWager(0)
    setTeamFormations([
      { id: "1", name: "Team 1", players: [] },
      { id: "2", name: "Team 2", players: [] },
    ])
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogTrigger asChild>
          <Button size="lg" className="w-full md:w-auto">
            Create New Game
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Game</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Game Type Selection and Wager */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  Game Setup <span className="text-red-500 ml-1">*</span>
                </CardTitle>
                <CardDescription>Enter the game type, wager amount, and whether it's a team game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-type" className="flex items-center">
                      Game Type <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="game-type"
                      value={selectedGameType}
                      onChange={(e) => setSelectedGameType(e.target.value)}
                      placeholder="Enter game type"
                      className={!selectedGameType ? "border-red-300" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="game-wager" className="flex items-center">
                      Wager Amount ($) <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="game-wager"
                      type="number"
                      value={gameWager || ""}
                      onChange={(e) => setGameWager(Number(e.target.value))}
                      placeholder="Enter wager amount"
                      className={!gameWager ? "border-red-300" : ""}
                    />
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
              </CardContent>
            </Card>

            {/* Alert for requirements */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isTeamGame
                  ? "Each team must have at least one player. All players will bet $" + gameWager
                  : "Select at least 2 players. All players will bet $" + gameWager}
              </AlertDescription>
            </Alert>

            {!isTeamGame ? (
              <div>
                <Label className="flex items-center mb-2">
                  Select Players <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                  {players.map((player) => {
                    const isSelected = selectedPlayers.includes(player.id)
                    return (
                      <div
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {player.name} (${player.balance})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedPlayers.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">Selected players: {selectedPlayers.length}</p>
                )}
              </div>
            ) : (
              // Team game UI
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>
                    Teams <span className="text-red-500">*</span>
                  </Label>
                  <Button variant="outline" size="sm" onClick={addNewTeam}>
                    Add Team
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamFormations.map((team) => (
                    <Card key={team.id}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-2 gap-2">
                          {players.map((player) => (
                            <div
                              key={player.id}
                              onClick={() => assignPlayerToTeam(player.id, team.id)}
                              className={`p-2 border rounded cursor-pointer transition-colors ${
                                team.players.includes(player.id)
                                  ? "border-primary bg-primary/5"
                                  : teamFormations.some((t) => t.players.includes(player.id))
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:border-primary/50"
                              }`}
                            >
                              {player.name} (${player.balance})
                            </div>
                          ))}
                        </div>
                        {team.players.length > 0 && (
                          <p className="mt-2 text-sm text-muted-foreground">Team members: {team.players.length}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createGame} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

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

type GameType = {
  id: string
  name: string
  is_team_game: boolean
}

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
  wager: number
}

export default function CreateGame() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState("")
  const [isTeamGame, setIsTeamGame] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<{ id: string; wager: number }[]>([])
  const [selectedTeams, setSelectedTeams] = useState<{ id: string; wager: number }[]>([])
  const { toast } = useToast()
  const supabase = createClient()
  const [teamFormations, setTeamFormations] = useState<TeamFormation[]>([
    { id: "1", name: "Team 1", players: [], wager: 0 },
    { id: "2", name: "Team 2", players: [], wager: 0 },
  ])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])

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

  function addNewTeam() {
    const newTeamNumber = teamFormations.length + 1
    setTeamFormations([
      ...teamFormations,
      { id: String(newTeamNumber), name: `Team ${newTeamNumber}`, players: [], wager: 0 },
    ])
  }

  // Add this function to handle player assignment to teams
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

  // Add this function to update team wager
  function updateTeamFormationWager(teamId: string, wager: number) {
    setTeamFormations((teams) => teams.map((team) => (team.id === teamId ? { ...team, wager } : team)))
  }

  async function createGame() {
    // Validate game type
    if (!selectedGameType.trim()) {
      toast({
        title: "Game type required",
        description: "Please enter a game type",
        variant: "destructive",
      })
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
        return
      }

      // Check if all teams have wagers set
      const teamsWithoutWagers = teamsWithPlayers.filter((team) => !team.wager || team.wager <= 0)
      if (teamsWithoutWagers.length > 0) {
        toast({
          title: "Missing wagers",
          description: `Please set a wager amount for ${teamsWithoutWagers.map((t) => t.name).join(", ")}`,
          variant: "destructive",
        })
        return
      }
    } else {
      // Validate individual player game requirements
      if (selectedPlayers.length < 2) {
        toast({
          title: "Not enough players",
          description: "Please select at least 2 players",
        })
        return
      }

      // Check if all players have wagers set
      const playersWithoutWagers = selectedPlayers.filter((player) => !player.wager || player.wager <= 0)
      if (playersWithoutWagers.length > 0) {
        const playerNames = playersWithoutWagers.map(
          (p) => players.find((player) => player.id === p.id)?.name || "Unknown player",
        )

        toast({
          title: "Missing wagers",
          description: `Please set a wager amount for ${playerNames.join(", ")}`,
          variant: "destructive",
        })
        return
      }
    }

    // Create the game in the database
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert([
        {
          type: selectedGameType.trim(),
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
      for (const team of teamFormations) {
        if (team.players.length > 0) {
          for (const playerId of team.players) {
            await supabase.from("game_players").insert([
              {
                game_id: gameId,
                player_id: playerId,
                wager: team.wager,
                team_id: team.id,
              },
            ])
          }
        }
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

    // Get the selected game type name for the success message
    const gameTypeName = selectedGameType

    toast({
      title: "Game created",
      description: `${gameTypeName} game has been created successfully!`,
    })

    setIsOpen(false)
    resetForm()
  }

  function resetForm() {
    setSelectedGameType("")
    setIsTeamGame(false)
    setSelectedPlayers([])
    setSelectedTeams([])
  }

  return (
    <>
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
            {/* Game Type Selection - Enhanced with required indicator */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  Game Setup <span className="text-red-500 ml-1">*</span>
                </CardTitle>
                <CardDescription>Enter the game type and whether it's a team game</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="game-type" className="flex items-center">
                      Game Type <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="game-type"
                      value={selectedGameType}
                      onChange={(e) => setSelectedGameType(e.target.value)}
                      placeholder="Enter game type (e.g., Poker, Can Jam)"
                      className={!selectedGameType ? "border-red-300" : ""}
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

            {/* Alert for wager requirements */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isTeamGame
                  ? "Each team must have at least one player and a wager amount."
                  : "Each player must have a wager amount."}
              </AlertDescription>
            </Alert>

            {isTeamGame ? (
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
                        <CardTitle className="text-lg flex justify-between items-center">
                          {team.name}
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`team-${team.id}-wager`} className="text-sm flex items-center">
                              Wager: $ <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id={`team-${team.id}-wager`}
                              type="number"
                              className={`w-20 h-8 ${!team.wager || team.wager <= 0 ? "border-red-300" : ""}`}
                              placeholder="0"
                              value={team.wager || ""}
                              onChange={(e) => updateTeamFormationWager(team.id, Number(e.target.value))}
                            />
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Label className="flex items-center">
                          Select Players <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {players.map((player) => (
                            <Button
                              key={player.id}
                              variant={team.players.includes(player.id) ? "default" : "outline"}
                              className="justify-start"
                              onClick={() => assignPlayerToTeam(player.id, team.id)}
                              disabled={
                                !team.players.includes(player.id) &&
                                teamFormations.some((t) => t.players.includes(player.id))
                              }
                            >
                              {player.name} (${player.balance})
                            </Button>
                          ))}
                        </div>
                        {team.players.length === 0 && (
                          <p className="text-red-500 text-sm mt-2">Please select at least one player</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Individual player selection with enhanced wager requirements
              <div>
                <Label className="flex items-center">
                  Select Players <span className="text-red-500 ml-1">*</span>
                </Label>
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
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`player-${player.id}-wager`} className="text-sm flex items-center">
                                Wager: $ <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id={`player-${player.id}-wager`}
                                type="number"
                                className={`w-20 h-8 ${
                                  !selectedPlayers.find((p) => p.id === player.id)?.wager ? "border-red-300" : ""
                                }`}
                                placeholder="0"
                                value={selectedPlayers.find((p) => p.id === player.id)?.wager || 0}
                                onChange={(e) => updatePlayerWager(player.id, Number(e.target.value))}
                              />
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {selectedPlayers.length < 2 && (
                  <p className="text-red-500 text-sm mt-2">Please select at least two players</p>
                )}
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
    </>
  )
}

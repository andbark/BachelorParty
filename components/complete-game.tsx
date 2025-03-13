"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"

type Game = {
  id: string
  type: string
  is_team_game: boolean
  status: string
  created_at: string
}

type GamePlayer = {
  id: string
  game_id: string
  player_id: string
  player_name: string
  wager: number
  team_id?: string
}

type TeamInfo = {
  id: string
  name: string
  players: GamePlayer[]
  totalWager: number
}

export default function CompleteGame() {
  const [activeGames, setActiveGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([])
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [winnerId, setWinnerId] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchActiveGames()
  }, [])

  useEffect(() => {
    if (selectedGame) {
      fetchGamePlayers(selectedGame.id)
    }
  }, [selectedGame])

  async function fetchActiveGames() {
    const { data, error } = await supabase.from("games").select("*").eq("status", "in_progress")

    if (error) {
      toast({
        title: "Error fetching games",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setActiveGames(data || [])
  }

  async function fetchGamePlayers(gameId: string) {
    const { data, error } = await supabase
      .from("game_players")
      .select(`
        id,
        game_id,
        player_id,
        players(name),
        wager,
        team_id
      `)
      .eq("game_id", gameId)

    if (error) {
      toast({
        title: "Error fetching game players",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const formattedPlayers =
      data?.map((item) => ({
        id: item.id,
        game_id: item.game_id,
        player_id: item.player_id,
        player_name: item.players.name,
        wager: item.wager,
        team_id: item.team_id,
      })) || []

    setGamePlayers(formattedPlayers)

    // If it's a team game, organize players by team
    if (selectedGame?.is_team_game) {
      const teamMap = new Map<string, TeamInfo>()

      formattedPlayers.forEach((player) => {
        if (player.team_id) {
          if (!teamMap.has(player.team_id)) {
            teamMap.set(player.team_id, {
              id: player.team_id,
              name: `Team ${player.team_id}`,
              players: [],
              totalWager: 0,
            })
          }

          const team = teamMap.get(player.team_id)!
          team.players.push(player)
          team.totalWager = player.wager // All players in a team have the same wager
        }
      })

      setTeams(Array.from(teamMap.values()))
    } else {
      setTeams([])
    }
  }

  async function completeGame() {
    if (!selectedGame || !winnerId) {
      toast({
        title: "Missing information",
        description: "Please select a game and winner",
        variant: "destructive",
      })
      return
    }

    // Start a transaction
    const { error: transactionError } = await supabase.rpc("begin_transaction")
    if (transactionError) {
      toast({
        title: "Transaction error",
        description: transactionError.message,
        variant: "destructive",
      })
      return
    }

    try {
      // Update game status
      await supabase.from("games").update({ status: "completed" }).eq("id", selectedGame.id)

      // Create game history entry
      let winnerName = ""
      let totalWinnings = 0
      let participants: string[] = []

      if (selectedGame.is_team_game) {
        // Team game logic
        const winningTeam = teams.find((t) => t.id === winnerId)
        if (!winningTeam) throw new Error("Winner not found")

        winnerName = winningTeam.name

        // Calculate total winnings (sum of all other teams' wagers)
        const losingTeams = teams.filter((t) => t.id !== winnerId)
        totalWinnings = losingTeams.reduce((sum, team) => sum + team.totalWager * team.players.length, 0)

        // Get all participant names
        participants = gamePlayers.map((p) => p.player_name)

        // Calculate winnings per player in winning team
        const winningsPerPlayer = totalWinnings / winningTeam.players.length

        // Update winning team players' balances
        for (const player of winningTeam.players) {
          await supabase
            .from("players")
            .update({
              balance: supabase.rpc("increment", { inc: winningsPerPlayer }),
              games_won: supabase.rpc("increment", { inc: 1 }),
              games_played: supabase.rpc("increment", { inc: 1 }),
            })
            .eq("id", player.player_id)
        }

        // Update losing team players' balances
        for (const team of losingTeams) {
          for (const player of team.players) {
            await supabase
              .from("players")
              .update({
                balance: supabase.rpc("decrement", { dec: player.wager }),
                games_played: supabase.rpc("increment", { inc: 1 }),
              })
              .eq("id", player.player_id)
          }
        }
      } else {
        // Individual game logic
        const winningPlayer = gamePlayers.find((p) => p.player_id === winnerId)
        if (!winningPlayer) throw new Error("Winner not found")

        winnerName = winningPlayer.player_name

        // Calculate total winnings (sum of all other players' wagers)
        const losingPlayers = gamePlayers.filter((p) => p.player_id !== winnerId)
        totalWinnings = losingPlayers.reduce((sum, player) => sum + player.wager, 0)

        participants = gamePlayers.map((p) => p.player_name)

        // Update winner's balance and stats
        await supabase
          .from("players")
          .update({
            balance: supabase.rpc("increment", { inc: totalWinnings }),
            games_won: supabase.rpc("increment", { inc: 1 }),
            games_played: supabase.rpc("increment", { inc: 1 }),
          })
          .eq("id", winnerId)

        // Update losers' balances and stats
        for (const player of losingPlayers) {
          await supabase
            .from("players")
            .update({
              balance: supabase.rpc("decrement", { dec: player.wager }),
              games_played: supabase.rpc("increment", { inc: 1 }),
            })
            .eq("id", player.player_id)
        }
      }

      // Create game history entry
      await supabase.from("game_history").insert([
        {
          game_id: selectedGame.id,
          game_type: selectedGame.type,
          winner_id: winnerId,
          winner_name: winnerName,
          winnings: totalWinnings,
          participants: participants,
          completed_at: new Date().toISOString(),
        },
      ])

      // Commit transaction
      await supabase.rpc("commit_transaction")

      toast({
        title: "Game completed",
        description: `${selectedGame.type} game has been completed successfully!`,
      })

      setIsOpen(false)
      resetForm()
      fetchActiveGames()
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc("rollback_transaction")

      toast({
        title: "Error completing game",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }
  }

  function resetForm() {
    setSelectedGame(null)
    setGamePlayers([])
    setTeams([])
    setWinnerId("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full md:w-auto">
          Complete Game
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Complete a Game</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select Active Game</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {activeGames.map((game) => (
                <Card
                  key={game.id}
                  className={selectedGame?.id === game.id ? "border-primary" : ""}
                  onClick={() => setSelectedGame(game)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-base">
                      {game.type} ({game.is_team_game ? "Team Game" : "Individual Game"})
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {selectedGame && (
            <div>
              <Label>Select Winner</Label>
              <RadioGroup value={winnerId} onValueChange={setWinnerId}>
                {selectedGame.is_team_game
                  ? teams.map((team) => (
                      <div key={team.id} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={team.id} id={`team-${team.id}`} />
                        <Label htmlFor={`team-${team.id}`}>
                          {team.name} - {team.players.map((p) => p.player_name).join(", ")}
                        </Label>
                      </div>
                    ))
                  : gamePlayers.map((player) => (
                      <div key={player.player_id} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={player.player_id} id={`player-${player.player_id}`} />
                        <Label htmlFor={`player-${player.player_id}`}>{player.player_name}</Label>
                      </div>
                    ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={completeGame} disabled={!selectedGame || !winnerId}>
              Complete Game
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

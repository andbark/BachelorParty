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
}

type GameTeam = {
  id: string
  game_id: string
  team_id: string
  team_name: string
  wager: number
}

export default function CompleteGame() {
  const [activeGames, setActiveGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([])
  const [gameTeams, setGameTeams] = useState<GameTeam[]>([])
  const [winnerId, setWinnerId] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchActiveGames()
  }, [])

  useEffect(() => {
    if (selectedGame) {
      if (selectedGame.is_team_game) {
        fetchGameTeams(selectedGame.id)
      } else {
        fetchGamePlayers(selectedGame.id)
      }
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
        wager
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
      })) || []

    setGamePlayers(formattedPlayers)
    setGameTeams([])
  }

  async function fetchGameTeams(gameId: string) {
    const { data, error } = await supabase
      .from("game_teams")
      .select(`
        id,
        game_id,
        team_id,
        teams(name),
        wager
      `)
      .eq("game_id", gameId)

    if (error) {
      toast({
        title: "Error fetching game teams",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const formattedTeams =
      data?.map((item) => ({
        id: item.id,
        game_id: item.game_id,
        team_id: item.team_id,
        team_name: item.teams.name,
        wager: item.wager,
      })) || []

    setGameTeams(formattedTeams)
    setGamePlayers([])
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
      let participants = []

      if (selectedGame.is_team_game) {
        const winningTeam = gameTeams.find((t) => t.team_id === winnerId)
        if (!winningTeam) throw new Error("Winner not found")

        winnerName = winningTeam.team_name

        // Calculate total winnings (sum of all other teams' wagers)
        const losingTeams = gameTeams.filter((t) => t.team_id !== winnerId)
        totalWinnings = losingTeams.reduce((sum, team) => sum + team.wager, 0)

        participants = gameTeams.map((t) => t.team_name)

        // Update team stats
        await supabase
          .from("teams")
          .update({ wins: supabase.rpc("increment", { inc: 1 }) })
          .eq("id", winnerId)

        for (const team of losingTeams) {
          await supabase
            .from("teams")
            .update({ losses: supabase.rpc("increment", { inc: 1 }) })
            .eq("id", team.team_id)
        }

        // Get team members to update their balances
        const { data: winningTeamData } = await supabase.from("teams").select("members").eq("id", winnerId).single()

        if (winningTeamData && winningTeamData.members) {
          const splitWinnings = totalWinnings / winningTeamData.members.length

          // Update each winning team member's balance
          for (const memberId of winningTeamData.members) {
            await supabase
              .from("players")
              .update({
                balance: supabase.rpc("increment", { inc: splitWinnings }),
                games_won: supabase.rpc("increment", { inc: 1 }),
              })
              .eq("id", memberId)
          }
        }

        // Update losing team members' balances
        for (const team of losingTeams) {
          const { data: losingTeamData } = await supabase
            .from("teams")
            .select("members")
            .eq("id", team.team_id)
            .single()

          if (losingTeamData && losingTeamData.members) {
            const splitLosses = team.wager / losingTeamData.members.length

            for (const memberId of losingTeamData.members) {
              await supabase
                .from("players")
                .update({
                  balance: supabase.rpc("decrement", { dec: splitLosses }),
                  games_played: supabase.rpc("increment", { inc: 1 }),
                })
                .eq("id", memberId)
            }
          }
        }
      } else {
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
    setGameTeams([])
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
                  ? gameTeams.map((team) => (
                      <div key={team.team_id} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={team.team_id} id={`team-${team.team_id}`} />
                        <Label htmlFor={`team-${team.team_id}`}>
                          {team.team_name} (Wager: ${team.wager})
                        </Label>
                      </div>
                    ))
                  : gamePlayers.map((player) => (
                      <div key={player.player_id} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={player.player_id} id={`player-${player.player_id}`} />
                        <Label htmlFor={`player-${player.player_id}`}>
                          {player.player_name} (Wager: ${player.wager})
                        </Label>
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


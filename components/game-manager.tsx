"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { Edit, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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

export default function GameManager() {
  const [games, setGames] = useState<Game[]>([])
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchGames()
  }, [])

  async function fetchGames() {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error fetching games",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setGames(data || [])
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
  }

  async function updateGame() {
    if (!editingGame) return

    const { data, error } = await supabase
      .from("games")
      .update({
        type: editingGame.type,
        is_team_game: editingGame.is_team_game,
      })
      .eq("id", editingGame.id)
      .select()

    if (error) {
      toast({
        title: "Error updating game",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Game updated",
      description: `Game has been updated successfully`,
    })

    setIsEditDialogOpen(false)
    fetchGames()
  }

  async function updatePlayerWager(playerId: string, wager: number) {
    const { error } = await supabase.from("game_players").update({ wager }).eq("id", playerId)

    if (error) {
      toast({
        title: "Error updating wager",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    // Update local state
    setGamePlayers(gamePlayers.map((player) => (player.id === playerId ? { ...player, wager } : player)))
  }

  async function deleteGame() {
    if (!gameToDelete) return

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
      // Delete game players
      await supabase.from("game_players").delete().eq("game_id", gameToDelete.id)

      // Delete the game
      await supabase.from("games").delete().eq("id", gameToDelete.id)

      // Commit transaction
      await supabase.rpc("commit_transaction")

      toast({
        title: "Game deleted",
        description: `Game has been deleted successfully`,
      })

      setIsDeleteDialogOpen(false)
      fetchGames()
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc("rollback_transaction")

      toast({
        title: "Error deleting game",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      {games.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No active games found</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {games.map((game) => (
            <div key={game.id} className="flex justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{game.type}</h3>
                <p className="text-sm text-muted-foreground">{game.is_team_game ? "Team Game" : "Individual Game"}</p>
                <p className="text-xs text-muted-foreground">Created: {formatDate(game.created_at)}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingGame(game)
                    fetchGamePlayers(game.id)
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500"
                  onClick={() => {
                    setGameToDelete(game)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Game Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
          </DialogHeader>
          {editingGame && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="game-type">Game Type</Label>
                  <Input
                    id="game-type"
                    value={editingGame.type}
                    onChange={(e) => setEditingGame({ ...editingGame, type: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="team-game"
                      checked={editingGame.is_team_game}
                      onCheckedChange={(checked) => setEditingGame({ ...editingGame, is_team_game: checked === true })}
                      disabled={true} // Can't change team status after creation
                    />
                    <Label htmlFor="team-game">Team Game</Label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Players & Wagers</h3>
                <div className="space-y-2">
                  {gamePlayers.map((player) => (
                    <div key={player.id} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center">
                        <span className="font-medium">{player.player_name}</span>
                        {player.team_id && (
                          <span className="ml-2 text-sm text-muted-foreground">(Team {player.team_id})</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`wager-${player.id}`} className="text-sm">
                          Wager: $
                        </Label>
                        <Input
                          id={`wager-${player.id}`}
                          type="number"
                          className="w-20 h-8"
                          value={player.wager}
                          onChange={(e) => updatePlayerWager(player.id, Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateGame}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Game Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this game. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGame} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"

type Player = {
  id: string
  name: string
  balance: number
  games_played: number
  games_won: number
}

export default function PlayerManager() {
  const [players, setPlayers] = useState<Player[]>([])
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
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

  async function updatePlayer() {
    if (!editingPlayer) return

    const { data, error } = await supabase
      .from("players")
      .update({
        name: editingPlayer.name,
        balance: editingPlayer.balance,
      })
      .eq("id", editingPlayer.id)
      .select()

    if (error) {
      toast({
        title: "Error updating player",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Player updated",
      description: `${editingPlayer.name} has been updated successfully`,
    })

    setIsEditDialogOpen(false)
    fetchPlayers()
  }

  async function deletePlayer() {
    if (!playerToDelete) return

    // Check if player is in any active games
    const { data: activeGames, error: activeGamesError } = await supabase
      .from("game_players")
      .select("game_id")
      .eq("player_id", playerToDelete.id)
      .limit(1)

    if (activeGamesError) {
      toast({
        title: "Error checking player games",
        description: activeGamesError.message,
        variant: "destructive",
      })
      return
    }

    if (activeGames && activeGames.length > 0) {
      toast({
        title: "Cannot delete player",
        description: "This player is part of one or more games. Please remove them from games first.",
        variant: "destructive",
      })
      setIsDeleteDialogOpen(false)
      return
    }

    // Delete player
    const { error } = await supabase.from("players").delete().eq("id", playerToDelete.id)

    if (error) {
      toast({
        title: "Error deleting player",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Player deleted",
      description: `${playerToDelete.name} has been deleted successfully`,
    })

    setIsDeleteDialogOpen(false)
    fetchPlayers()
  }

  return (
    <div className="space-y-4">
      <Button onClick={fetchPlayers}>Refresh Players</Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">{player.name}</h3>
              <p className="text-sm text-muted-foreground">Balance: ${player.balance}</p>
              <p className="text-xs text-muted-foreground">
                Games: {player.games_won}/{player.games_played}
              </p>
            </div>
            <div className="flex space-x-2">
              {/*
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditingPlayer(player)
                  setIsEditDialogOpen(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-red-500"
                onClick={() => {
                  setPlayerToDelete(player)
                  setIsDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              */}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Player Dialog */}
      {/*
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          {editingPlayer && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="player-name">Name</Label>
                <Input
                  id="player-name"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="player-balance">Balance ($)</Label>
                <Input
                  id="player-balance"
                  type="number"
                  value={editingPlayer.balance}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, balance: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updatePlayer}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      */}

      {/* Delete Player Confirmation */}
      {/*
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {playerToDelete?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePlayer} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      */}
    </div>
  )
}

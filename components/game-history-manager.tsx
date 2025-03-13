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
import { Edit, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type GameHistoryEntry = {
  id: string
  game_id: string
  game_type: string
  winner_id: string
  winner_name: string
  winnings: number
  participants: string[]
  completed_at: string
}

export default function GameHistoryManager() {
  const [history, setHistory] = useState<GameHistoryEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<GameHistoryEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<GameHistoryEntry | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchGameHistory()
  }, [])

  async function fetchGameHistory() {
    const { data, error } = await supabase.from("game_history").select("*").order("completed_at", { ascending: false })

    if (error) {
      toast({
        title: "Error fetching game history",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setHistory(data || [])
  }

  async function updateGameHistory() {
    if (!editingEntry) return

    const { data, error } = await supabase
      .from("game_history")
      .update({
        game_type: editingEntry.game_type,
        winner_name: editingEntry.winner_name,
        winnings: editingEntry.winnings,
      })
      .eq("id", editingEntry.id)
      .select()

    if (error) {
      toast({
        title: "Error updating game history",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Game history updated",
      description: `Game history has been updated successfully`,
    })

    setIsEditDialogOpen(false)
    fetchGameHistory()
  }

  async function deleteGameHistory() {
    if (!entryToDelete) return

    const { error } = await supabase.from("game_history").delete().eq("id", entryToDelete.id)

    if (error) {
      toast({
        title: "Error deleting game history",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Game history deleted",
      description: `Game history has been deleted successfully`,
    })

    setIsDeleteDialogOpen(false)
    fetchGameHistory()
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Editing game history will not automatically adjust player balances. Please update player balances manually if
          needed.
        </AlertDescription>
      </Alert>

      <Button onClick={fetchGameHistory}>Refresh History</Button>

      {history.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No game history found</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((entry) => (
            <div key={entry.id} className="flex justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{entry.game_type}</h3>
                <p className="text-sm">
                  Winner: <span className="font-medium">{entry.winner_name}</span> (${entry.winnings})
                </p>
                <p className="text-xs text-muted-foreground">Completed: {formatDate(entry.completed_at)}</p>
                <p className="text-xs text-muted-foreground">Players: {entry.participants.join(", ")}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingEntry(entry)
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
                    setEntryToDelete(entry)
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

      {/* Edit Game History Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Game History</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="game-type">Game Type</Label>
                <Input
                  id="game-type"
                  value={editingEntry.game_type}
                  onChange={(e) => setEditingEntry({ ...editingEntry, game_type: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="winner-name">Winner Name</Label>
                <Input
                  id="winner-name"
                  value={editingEntry.winner_name}
                  onChange={(e) => setEditingEntry({ ...editingEntry, winner_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="winnings">Winnings ($)</Label>
                <Input
                  id="winnings"
                  type="number"
                  value={editingEntry.winnings}
                  onChange={(e) => setEditingEntry({ ...editingEntry, winnings: Number(e.target.value) })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateGameHistory}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Game History Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this game history entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGameHistory} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

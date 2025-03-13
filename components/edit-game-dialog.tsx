"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from 'lucide-react'
import { updateGame } from "@/app/actions"
import { toast } from "@/components/ui/use-toast"

interface EditGameDialogProps {
  game: {
    id: string
    name: string
    description?: string
    points: number
  }
}

export function EditGameDialog({ game }: EditGameDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Add safety check for undefined game
  if (!game || !game.id) {
    return null;
  }

  async function onSubmit(formData: FormData) {
    try {
      setIsLoading(true)
      const result = await updateGame(game.id, formData)
      
      if (result.success) {
        toast({
          title: "Game updated",
          description: "The game has been updated successfully.",
        })
        setOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update game",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={game.name || ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={game.description || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              name="points"
              type="number"
              defaultValue={game.points || 0}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

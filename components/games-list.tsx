"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EditGameDialog } from "./edit-game-dialog"
import { deleteGame } from "@/app/actions"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from 'lucide-react'

interface Game {
  id: string
  name: string
  description?: string
  points: number
}

interface GamesListProps {
  games?: Game[]
}

export function GamesList({ games = [] }: GamesListProps) {
  async function handleDelete(gameId: string) {
    try {
      const result = await deleteGame(gameId)
      
      if (result.success) {
        toast({
          title: "Game deleted",
          description: "The game has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete game",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Add a check for empty games array
  if (!games || games.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Available Games</h2>
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">No games available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Available Games</h2>
      {games.map((game) => {
        // Skip rendering if game is undefined or missing required properties
        if (!game || !game.id || !game.name) {
          return null;
        }
        
        return (
          <Card key={game.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{game.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <EditGameDialog game={game} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Game</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this game? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(game.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {game.description && (
                <CardDescription>{game.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Points: {game.points || 0}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Join</Button>
              <Button variant="outline">End</Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { joinGame } from '@/app/actions'
import { useToast } from '@/components/ui/use-toast'

interface Player {
  id: string
  name: string
  balance: number
}

interface Game {
  id: string
  name: string
  buy_in: number
}

interface JoinGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  players?: Player[]
  games?: Game[]
}

export function JoinGameDialog({ 
  open, 
  onOpenChange, 
  players = [], 
  games = []    
}: JoinGameDialogProps) {
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleJoinGame = async () => {
    if (!selectedGame || !selectedPlayer) {
      toast({
        title: 'Error',
        description: 'Please select both a game and a player',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await joinGame(selectedGame, selectedPlayer)
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Successfully joined the game',
        })
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join game',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasGames = Array.isArray(games) && games.length > 0
  const hasPlayers = Array.isArray(players) && players.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Game</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Game</label>
            <Select
              value={selectedGame}
              onValueChange={setSelectedGame}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {hasGames ? (
                  games.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name} (${game.buy_in})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-games" disabled>
                    No games available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Player</label>
            <Select
              value={selectedPlayer}
              onValueChange={setSelectedPlayer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a player" />
              </SelectTrigger>
              <SelectContent>
                {hasPlayers ? (
                  players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} (${player.balance})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-players" disabled>
                    No players available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleJoinGame} 
            disabled={isLoading || !hasGames || !hasPlayers}
          >
            {isLoading ? 'Joining...' : 'Join Game'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

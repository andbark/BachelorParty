'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { JoinGameDialog } from '@/components/join-game-dialog'

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

interface JoinGameButtonProps {
  players: Player[]
  games: Game[]
}

export function JoinGameButton({ players, games }: JoinGameButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Join Game</Button>
      <JoinGameDialog 
        open={open} 
        onOpenChange={setOpen} 
        players={players} 
        games={games} 
      />
    </>
  )
}

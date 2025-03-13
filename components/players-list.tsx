'use client'

import { Card, CardContent } from '@/components/ui/card'

interface Player {
  id: string
  name: string
  balance: number
  games_played?: number
  games_won?: number
}

interface PlayersListProps {
  players: Player[]
}

export function PlayersList({ players = [] }: PlayersListProps) {
  if (!players || players.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-gray-50">
        <p className="text-gray-500">No players available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {players.map((player) => (
        <Card key={player.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{player.name || 'Unnamed Player'}</h3>
                <p className="text-sm text-gray-500">Balance: ${player.balance || 0}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>Games: {player.games_played || 0}</p>
                <p>Wins: {player.games_won || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

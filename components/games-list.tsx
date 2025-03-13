'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Game {
  id: string
  name: string
  buy_in: number
  status?: string
}

interface GamesListProps {
  games: Game[]
}

export function GamesList({ games = [] }: GamesListProps) {
  if (!games || games.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-gray-50">
        <p className="text-gray-500">No games available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {games.map((game) => (
        <Card key={game.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{game.name || 'Unnamed Game'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Buy-in: ${game.buy_in || 0}</p>
                <p className="text-sm text-gray-500">
                  Status: {game.status || 'Unknown'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

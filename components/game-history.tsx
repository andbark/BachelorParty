"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function GameHistoryManager() {
  const [gameHistory, setGameHistory] = useState([
    {
      id: "1",
      type: "Poker",
      winner: "Player 1",
      winnings: 50,
      participants: ["Player 1", "Player 2", "Player 3"],
      date: "2023-06-15",
    },
    {
      id: "2",
      type: "Beer Pong",
      winner: "Player 2",
      winnings: 30,
      participants: ["Player 2", "Player 4"],
      date: "2023-06-14",
    },
  ])

  const removeHistoryItem = (id: string) => {
    setGameHistory(gameHistory.filter((game) => game.id !== id))
  }

  return (
    <div className="space-y-4">
      {gameHistory.length === 0 ? (
        <p>No game history available.</p>
      ) : (
        <div className="grid gap-4">
          {gameHistory.map((game) => (
            <Card key={game.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{game.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      Winner: {game.winner} (${game.winnings})
                    </p>
                    <p className="text-sm text-muted-foreground">Participants: {game.participants.join(", ")}</p>
                    <p className="text-xs text-muted-foreground">Date: {game.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeHistoryItem(game.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

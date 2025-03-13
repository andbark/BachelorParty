"use client"

import PlayerManager from "./player-manager"
import GameManager from "./game-manager"
import GameHistoryManager from "./game-history-manager"

export default function AdminPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Admin Panel</h2>
      <PlayerManager />
      <GameManager />
      <GameHistoryManager />
    </div>
  )
}


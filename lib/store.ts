import { create } from "zustand"

interface Player {
  id: number
  name: string
  balance: number
  gamesWon: number
  totalWinnings: number
}

interface GameStore {
  players: Player[]
  updatePlayerBalance: (playerId: number, amount: number) => void
  updatePlayerStats: (playerId: number, wonAmount: number) => void
  getPlayer: (playerId: number) => Player | undefined
  getPlayerByName: (name: string) => Player | undefined
}

export const useGameStore = create<GameStore>((set, get) => ({
  players: [
    { id: 1, name: "Freebs", balance: 300, gamesWon: 0, totalWinnings: 0 },
    // ... rest of your players
  ],
  updatePlayerBalance: (playerId, amount) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, balance: player.balance + amount } : player,
      ),
    }))
  },
  updatePlayerStats: (playerId, wonAmount) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              gamesWon: player.gamesWon + 1,
              totalWinnings: player.totalWinnings + wonAmount,
            }
          : player,
      ),
    }))
  },
  getPlayer: (playerId) => {
    return get().players.find((p) => p.id === playerId)
  },
  getPlayerByName: (name) => {
    return get().players.find((p) => p.name === name)
  },
}))

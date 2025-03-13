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
    { id: 2, name: "Mike Ambrogi", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 3, name: "Mike Stevens", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 4, name: "Matt M", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 5, name: "Chris Ambrogi", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 6, name: "Adam Barks", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 7, name: "Donnie", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 8, name: "Steve Irons", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 9, name: "Sam Golub", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 10, name: "Skibicki", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 11, name: "MDavis", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 12, name: "Avas", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 13, name: "Luke", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 14, name: "Chris Barks", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 15, name: "Geno", balance: 300, gamesWon: 0, totalWinnings: 0 },
    { id: 16, name: "Dorey", balance: 300, gamesWon: 0, totalWinnings: 0 },
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

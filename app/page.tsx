import PlayerBalances from "@/components/player-balances"
import Leaderboard from "@/components/leaderboard"

export default function Page() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlayerBalances />
        </div>
        <div>
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}

import { Leaderboard } from "../components/leaderboard"
import { PlayerBalances } from "../components/player-balances"

export default function Page() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Bachelor Party Tracker</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <PlayerBalances />
        </div>
        <Leaderboard />
      </div>
    </div>
  )
}

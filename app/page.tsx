import { Suspense } from "react"
import PlayerBalances from "@/components/player-balances"

export default function Page() {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Bachelor Party Tracker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Player Balances */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div>Loading player balances...</div>}>
            <PlayerBalances />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

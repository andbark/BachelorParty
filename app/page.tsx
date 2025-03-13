import { createClient } from '@/lib/supabase'
import { GamesList } from '@/components/games-list'
import { PlayersList } from '@/components/players-list'
import { JoinGameButton } from '@/components/join-game-button'

export default async function Page() {
  const supabase = createClient()
  
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'active')
  
  const { data: players } = await supabase
    .from('players')
    .select('*')

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bachelor Party Tracker</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <PlayersList players={players || []} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Games</h2>
          <GamesList games={games || []} />
          <div className="mt-4">
            <JoinGameButton players={players || []} games={games || []} />
          </div>
        </div>
      </div>
    </main>
  )
}

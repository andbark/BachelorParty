import { createClient } from '@/lib/supabase'

export default async function Page() {
  let games = [];
  let players = [];
  let error = null;

  try {
    const supabase = createClient();
    
    // Check if Supabase client is working
    if (!supabase) {
      throw new Error("Supabase client initialization failed");
    }
    
    // Fetch games with error handling
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'active');
      
    if (gamesError) {
      throw new Error(`Games fetch error: ${gamesError.message}`);
    }
    
    games = gamesData || [];
    
    // Fetch players with error handling
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*');
      
    if (playersError) {
      throw new Error(`Players fetch error: ${playersError.message}`);
    }
    
    players = playersData || [];
    
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error occurred";
    console.error("Page error:", error);
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bachelor Party Tracker</h1>
      
      {error ? (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-700">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <p className="mt-4">
            <a href="/debug" className="text-blue-500 underline">
              Go to debug page
            </a>
          </p>
        </div>
      ) : (
        <div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold mb-4">Players ({players.length})</h2>
              {players.length === 0 ? (
                <p className="text-gray-500">No players available</p>
              ) : (
                <ul className="space-y-2">
                  {players.map(player => (
                    <li key={player.id} className="p-3 border rounded-md">
                      {player.name || 'Unnamed'} - ${player.balance || 0}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Games ({games.length})</h2>
              {games.length === 0 ? (
                <p className="text-gray-500">No games available</p>
              ) : (
                <ul className="space-y-2">
                  {games.map(game => (
                    <li key={game.id} className="p-3 border rounded-md">
                      {game.name || 'Unnamed'} - Buy-in: ${game.buy_in || 0}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <a href="/debug" className="text-blue-500 underline">
              View Debug Info
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

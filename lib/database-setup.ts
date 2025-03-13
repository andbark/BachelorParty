import { createClient } from "@/lib/supabase"

export async function setupDatabase() {
  const supabase = createClient()

  // Create players table if it doesn't exist
  const { error: playersError } = await supabase.rpc("create_players_table_if_not_exists")
  if (playersError) console.error("Error creating players table:", playersError)

  // Create teams table if it doesn't exist
  const { error: teamsError } = await supabase.rpc("create_teams_table_if_not_exists")
  if (teamsError) console.error("Error creating teams table:", teamsError)

  // Create games table if it doesn't exist
  const { error: gamesError } = await supabase.rpc("create_games_table_if_not_exists")
  if (gamesError) console.error("Error creating games table:", gamesError)

  // Create game_players table if it doesn't exist
  const { error: gamePlayersError } = await supabase.rpc("create_game_players_table_if_not_exists")
  if (gamePlayersError) console.error("Error creating game_players table:", gamePlayersError)

  // Create game_teams table if it doesn't exist
  const { error: gameTeamsError } = await supabase.rpc("create_game_teams_table_if_not_exists")
  if (gameTeamsError) console.error("Error creating game_teams table:", gameTeamsError)

  // Create game_history table if it doesn't exist
  const { error: gameHistoryError } = await supabase.rpc("create_game_history_table_if_not_exists")
  if (gameHistoryError) console.error("Error creating game_history table:", gameHistoryError)

  // Create necessary functions for transactions
  const { error: transactionFunctionsError } = await supabase.rpc("create_transaction_functions")
  if (transactionFunctionsError) console.error("Error creating transaction functions:", transactionFunctionsError)

  // Create necessary functions for incrementing/decrementing
  const { error: mathFunctionsError } = await supabase.rpc("create_math_functions")
  if (mathFunctionsError) console.error("Error creating math functions:", mathFunctionsError)

  return { success: true }
}


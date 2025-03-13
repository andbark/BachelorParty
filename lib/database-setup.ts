import { createClient } from "@/lib/supabase"

export async function setupDatabase() {
  const supabase = createClient()

  // Create players table if it doesn't exist
  const { error: playersError } = await supabase.rpc("create_players_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS players (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL,
        balance NUMERIC DEFAULT 300,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,
  })
  if (playersError) console.error("Error creating players table:", playersError)

  // Create teams table if it doesn't exist
  const { error: teamsError } = await supabase.rpc("create_teams_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS teams (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL,
        members TEXT[] DEFAULT '{}',
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,
  })
  if (teamsError) console.error("Error creating teams table:", teamsError)

  // Create games table if it doesn't exist
  const { error: gamesError } = await supabase.rpc("create_games_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS games (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        type TEXT NOT NULL,
        is_team_game BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'in_progress',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,
  })
  if (gamesError) console.error("Error creating games table:", gamesError)

  // Create game_players table if it doesn't exist
  const { error: gamePlayersError } = await supabase.rpc("create_game_players_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS game_players (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        player_id UUID REFERENCES players(id),
        wager NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,
  })
  if (gamePlayersError) console.error("Error creating game_players table:", gamePlayersError)

  // Create game_teams table if it doesn't exist
  const { error: gameTeamsError } = await supabase.rpc("create_game_teams_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS game_teams (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        team_id UUID REFERENCES teams(id),
        wager NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,
  })
  if (gameTeamsError) console.error("Error creating game_teams table:", gameTeamsError)

  // Create game_history table if it doesn't exist
  const { error: gameHistoryError } = await supabase.rpc("create_game_history_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS game_history (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        game_id UUID REFERENCES games(id),
        game_type TEXT NOT NULL,
        winner_id TEXT NOT NULL,
        winner_name TEXT NOT NULL,
        winnings NUMERIC DEFAULT 0,
        participants TEXT[] DEFAULT '{}',
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `,
  })
  if (gameHistoryError) console.error("Error creating game_history table:", gameHistoryError)

  // Create game_types table if it doesn't exist
  const { error: gameTypesError } = await supabase.rpc("create_game_types_table_if_not_exists", {
    sql: `
      CREATE TABLE IF NOT EXISTS game_types (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        is_team_game BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      
      -- Insert default game types if they don't exist
      INSERT INTO game_types (name, is_team_game)
      VALUES 
        ('Poker', false),
        ('Blackjack', false),
        ('Beer Pong', true),
        ('Can Jam', true)
      ON CONFLICT (name) DO NOTHING;
    `,
  })
  if (gameTypesError) console.error("Error creating game_types table:", gameTypesError)

  // Create necessary functions for transactions
  const { error: transactionFunctionsError } = await supabase.rpc("create_transaction_functions", {
    sql: `
      CREATE OR REPLACE FUNCTION begin_transaction()
      RETURNS void AS $$
      BEGIN
        EXECUTE 'BEGIN';
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION commit_transaction()
      RETURNS void AS $$
      BEGIN
        EXECUTE 'COMMIT';
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION rollback_transaction()
      RETURNS void AS $$
      BEGIN
        EXECUTE 'ROLLBACK';
      END;
      $$ LANGUAGE plpgsql;
    `,
  })
  if (transactionFunctionsError) console.error("Error creating transaction functions:", transactionFunctionsError)

  // Create necessary functions for incrementing/decrementing
  const { error: mathFunctionsError } = await supabase.rpc("create_math_functions", {
    sql: `
      CREATE OR REPLACE FUNCTION increment(row_id UUID, field_name TEXT, inc NUMERIC)
      RETURNS void AS $$
      BEGIN
        EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', TG_TABLE_NAME, field_name, field_name)
        USING inc, row_id;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION decrement(row_id UUID, field_name TEXT, dec NUMERIC)
      RETURNS void AS $$
      BEGIN
        EXECUTE format('UPDATE %I SET %I = %I - $1 WHERE id = $2', TG_TABLE_NAME, field_name, field_name)
        USING dec, row_id;
      END;
      $$ LANGUAGE plpgsql;
    `,
  })
  if (mathFunctionsError) console.error("Error creating math functions:", mathFunctionsError)

  return { success: true }
}

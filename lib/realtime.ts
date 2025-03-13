import { createClient } from "@/lib/supabase"

export type RealtimeSubscription = {
  unsubscribe: () => void
}

export function subscribeToPlayers(callback: () => void): RealtimeSubscription {
  const supabase = createClient()

  const subscription = supabase
    .channel("players-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}

export function subscribeToGames(callback: () => void): RealtimeSubscription {
  const supabase = createClient()

  const subscription = supabase
    .channel("games-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}

export function subscribeToGameHistory(callback: () => void): RealtimeSubscription {
  const supabase = createClient()

  const subscription = supabase
    .channel("game-history-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_history",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}

export function subscribeToTeams(callback: () => void): RealtimeSubscription {
  const supabase = createClient()

  const subscription = supabase
    .channel("teams-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "teams",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    },
  }
}


"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TestPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newGameName, setNewGameName] = useState("")
  const [createStatus, setCreateStatus] = useState("")

  // Load games when the page loads
  useEffect(() => {
    async function loadGames() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setGames(data || [])
      } catch (err) {
        console.error("Error loading games:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadGames()
  }, [])

  // Create a new game
  async function createGame(e) {
    e.preventDefault()

    if (!newGameName.trim()) {
      setCreateStatus("Please enter a game name")
      return
    }

    try {
      setCreateStatus("Creating game...")

      const { data, error } = await supabase
        .from("games")
        .insert([{ name: newGameName.trim() }])
        .select()

      if (error) throw error

      setGames([data[0], ...games])
      setNewGameName("")
      setCreateStatus("Game created successfully!")
    } catch (err) {
      console.error("Error creating game:", err)
      setCreateStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Test Page</h1>

      {/* Create game form */}
      <div className="mb-8 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-medium mb-4">Create a New Game</h2>

        <form onSubmit={createGame} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Game Name</label>
            <input
              type="text"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter game name"
            />
          </div>

          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Create Game
          </button>

          {createStatus && (
            <p className={`text-sm ${createStatus.includes("Error") ? "text-red-600" : "text-green-600"}`}>
              {createStatus}
            </p>
          )}
        </form>
      </div>

      {/* Display games */}
      <div>
        <h2 className="text-lg font-medium mb-4">Games List</h2>

        {loading ? (
          <p>Loading games...</p>
        ) : error ? (
          <div className="p-4 bg-red-100 text-red-800 rounded-md">
            <p className="font-medium">Error loading games:</p>
            <p>{error}</p>
          </div>
        ) : games.length === 0 ? (
          <p>No games found. Create your first game above!</p>
        ) : (
          <ul className="space-y-2">
            {games.map((game) => (
              <li key={game.id} className="p-3 border rounded-md">
                <p className="font-medium">{game.name}</p>
                <p className="text-sm text-gray-500">Created: {new Date(game.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


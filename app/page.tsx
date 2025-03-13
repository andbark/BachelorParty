import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getGames, getUsers, getGameHistory } from "./actions"
import { UserScorecard } from "@/components/user-scorecard"
import { AddGameForm } from "@/components/add-game-form"
import { AddUserForm } from "@/components/add-user-form"
import { Leaderboard } from "@/components/leaderboard"
import { GamesList } from "@/components/games-list"

export default async function Home() {
  const gamesResult = await getGames()
  const usersResult = await getUsers()
  const gameHistoryResult = await getGameHistory()
  
  const games = gamesResult.success ? gamesResult.data || [] : []
  const users = usersResult.success ? usersResult.data || [] : []
  const gameHistory = gameHistoryResult.success ? gameHistoryResult.data || [] : []
  
  // Log data for debugging
  console.log("Games:", games)
  console.log("Users:", users)
  console.log("Game History:", gameHistory)

  return (
    <main className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Bachelor Party Game Tracker</h1>
      
      <Tabs defaultValue="scorecards">
        <TabsList className="mb-4">
          <TabsTrigger value="scorecards">Scorecards</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scorecards" className="space-y-6">
          {users.map((user) => (
            <UserScorecard 
              key={user.id} 
              user={user} 
              games={games} 
              gameHistory={gameHistory} 
            />
          ))}
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <Leaderboard users={users} games={games} gameHistory={gameHistory} />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-8">
          <GamesList games={games} />
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New Game</h2>
            <AddGameForm />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            <AddUserForm />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}

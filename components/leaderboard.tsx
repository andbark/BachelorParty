import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useGameStore } from "../../lib/store"

const Leaderboard = () => {
  const leaderboard = useGameStore((state) => state.leaderboard)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal pl-4">
          {leaderboard.map((entry, index) => (
            <li key={index} className="mb-2">
              {entry.name}: {entry.score}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

export default Leaderboard

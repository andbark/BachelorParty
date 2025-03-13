"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"

type Team = {
  id: string
  name: string
  members: string[]
  wins: number
  losses: number
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [availablePlayers, setAvailablePlayers] = useState<{ id: string; name: string }[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTeams()
    fetchPlayers()
  }, [])

  async function fetchTeams() {
    const { data, error } = await supabase.from("teams").select("*")

    if (error) {
      toast({
        title: "Error fetching teams",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setTeams(data || [])
  }

  async function fetchPlayers() {
    const { data, error } = await supabase.from("players").select("id, name")

    if (error) {
      toast({
        title: "Error fetching players",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    setAvailablePlayers(data || [])
  }

  async function createTeam() {
    if (!newTeamName || selectedPlayers.length < 2) {
      toast({
        title: "Invalid team",
        description: "Please provide a team name and select at least 2 players",
        variant: "destructive",
      })
      return
    }

    const newTeam = {
      name: newTeamName,
      members: selectedPlayers,
      wins: 0,
      losses: 0,
    }

    const { data, error } = await supabase.from("teams").insert([newTeam]).select()

    if (error) {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Team created",
      description: `${newTeamName} has been created successfully!`,
    })

    setNewTeamName("")
    setSelectedPlayers([])
    setIsCreateOpen(false)
    fetchTeams()
  }

  function addPlayerToTeam(playerId: string) {
    if (selectedPlayers.includes(playerId)) return
    setSelectedPlayers([...selectedPlayers, playerId])
  }

  function removePlayerFromTeam(playerId: string) {
    setSelectedPlayers(selectedPlayers.filter((id) => id !== playerId))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teams</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Team</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label>Select Players (min 2)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availablePlayers.map((player) => (
                    <Button
                      key={player.id}
                      variant={selectedPlayers.includes(player.id) ? "default" : "outline"}
                      onClick={() =>
                        selectedPlayers.includes(player.id)
                          ? removePlayerFromTeam(player.id)
                          : addPlayerToTeam(player.id)
                      }
                      className="justify-start"
                    >
                      {player.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={createTeam} className="w-full">
                Create Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{team.name}</span>
                <span className="text-sm text-muted-foreground">
                  {team.wins}W - {team.losses}L
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Team Members:</h4>
                <div className="flex flex-wrap gap-2">
                  {team.members.map((memberId) => {
                    const player = availablePlayers.find((p) => p.id === memberId)
                    return (
                      <div
                        key={memberId}
                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                      >
                        {player?.name || "Unknown Player"}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


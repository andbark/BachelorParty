"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import PlayerManager from "./player-manager"
import GameManager from "./game-manager"
import GameHistoryManager from "./game-history-manager"

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Admin Panel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="players" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="games">Active Games</TabsTrigger>
            <TabsTrigger value="history">Game History</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Player Management</CardTitle>
                <CardDescription>Edit player details, adjust balances, or remove players</CardDescription>
              </CardHeader>
              <CardContent>
                <PlayerManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card>
              <CardHeader>
                <CardTitle>Active Game Management</CardTitle>
                <CardDescription>Edit or cancel active games</CardDescription>
              </CardHeader>
              <CardContent>
                <GameManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Game History Management</CardTitle>
                <CardDescription>Edit or remove completed games and adjust player balances</CardDescription>
              </CardHeader>
              <CardContent>
                <GameHistoryManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

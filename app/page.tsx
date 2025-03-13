"use client"

import AdminPanel from "../components/admin-panel"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">Bachelor Party Tracker</h1>
          <div className="flex items-center gap-4">
            <AdminPanel />
          </div>
        </div>
      </header>

      <div className="container flex-1 py-8">
        <h2 className="text-3xl font-bold mb-6">Welcome</h2>
        <p className="mb-4">Welcome to your bachelor party tracking app! Keep track of games, players, and balances.</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{/* Content will go here */}</div>
      </div>
    </main>
  )
}


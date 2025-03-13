"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    // Check if environment variables are set
    const checkEnvVars = () => {
      const vars = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
      setEnvVars(vars)
    }

    // Check database connection
    const checkDbConnection = async () => {
      try {
        const { data, error } = await supabase.from("games").select("count").limit(1)

        if (error) {
          setDbStatus("error")
          setErrorMessage(error.message)
        } else {
          setDbStatus("connected")
        }
      } catch (err) {
        setDbStatus("error")
        setErrorMessage(err instanceof Error ? err.message : "Unknown error")
      }
    }

    checkEnvVars()
    checkDbConnection()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bachelor Party Tracker Debug</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Checking if required environment variables are set</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.entries(envVars).map(([key, isSet]) => (
                <li key={key} className="flex items-center gap-2">
                  <span className={`inline-block w-4 h-4 rounded-full ${isSet ? "bg-green-500" : "bg-red-500"}`}></span>
                  <span>
                    {key}: {isSet ? "Set" : "Not Set"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>Testing connection to Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {dbStatus === "checking" && (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span>Checking connection...</span>
                </>
              )}

              {dbStatus === "connected" && (
                <>
                  <span className="inline-block w-4 h-4 rounded-full bg-green-500"></span>
                  <span>Connected to database</span>
                </>
              )}

              {dbStatus === "error" && (
                <>
                  <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
                  <span>Error connecting to database</span>
                </>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
                <p className="font-semibold">Error:</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Refresh Tests</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}


    </div>
  )
}

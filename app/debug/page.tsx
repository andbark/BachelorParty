import { createClient } from '@supabase/supabase-js'

export default async function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  let tables = []
  let error = null
  let connectionStatus = 'Unknown'
  
  try {
    // Test connection
    const { data, error: connError } = await supabase.from('users').select('count').limit(1)
    connectionStatus = connError ? 'Failed' : 'Connected'
    
    // Get table info
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      error = tablesError.message
    } else {
      tables = tablesData || []
    }
  } catch (e: any) {
    error = e.message
    connectionStatus = 'Error'
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Database Debug Information</h1>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className={`font-mono ${connectionStatus === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>
          {connectionStatus}
        </p>
      </div>
      
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <p className="font-mono mb-1">NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? '✓ Set' : '✗ Not Set'}</p>
        <p className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseKey ? '✓ Set' : '✗ Not Set'}</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-xl font-semibold mb-2 text-red-700">Error</h2>
          <p className="font-mono text-red-700">{error}</p>
        </div>
      )}
      
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-semibold mb-2">Tables</h2>
        {tables.length > 0 ? (
          <ul className="list-disc pl-5">
            {tables.map((table: any) => (
              <li key={table.table_name} className="font-mono">{table.table_name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No tables found or unable to retrieve table information.</p>
        )}
      </div>
    </div>
  )
}

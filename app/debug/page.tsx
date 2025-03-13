import { createClient } from '@/lib/supabase'

export default async function DebugPage() {
  let supabaseStatus = "Not initialized";
  let tablesInfo = [];
  
  try {
    const supabase = createClient();
    
    if (!supabase) {
      supabaseStatus = "Failed to initialize - check environment variables";
    } else {
      supabaseStatus = "Initialized successfully";
      
      // Test connection by listing tables
      const { data, error } = await supabase.from('games').select('count');
      
      if (error) {
        tablesInfo.push(`Error accessing 'games' table: ${error.message}`);
      } else {
        tablesInfo.push(`'games' table accessible: ${data ? JSON.stringify(data) : 'No data'}`);
      }
      
      const { data: playersData, error: playersError } = await supabase.from('players').select('count');
      
      if (playersError) {
        tablesInfo.push(`Error accessing 'players' table: ${playersError.message}`);
      } else {
        tablesInfo.push(`'players' table accessible: ${playersData ? JSON.stringify(playersData) : 'No data'}`);
      }
    }
  } catch (error) {
    supabaseStatus = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }

  // Safely get environment variable values
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p className="mb-6">If you can see this, your app is rendering correctly.</p>
      
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <ul className="list-disc pl-6">
          <li>
            NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? 'Set ✅' : 'Not set ❌'}
            {supabaseUrl && 
              <span className="ml-2 text-gray-500">
                ({supabaseUrl.substring(0, 15)}...)
              </span>
            }
          </li>
          <li>
            NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseAnonKey ? 'Set ✅' : 'Not set ❌'}
            {supabaseAnonKey && 
              <span className="ml-2 text-gray-500">
                ({supabaseAnonKey.substring(0, 5)}...)
              </span>
            }
          </li>
        </ul>
      </div>
      
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Supabase Status</h2>
        <p className={supabaseStatus.includes("Error") ? "text-red-600" : "text-green-600"}>
          {supabaseStatus}
        </p>
        
        {tablesInfo.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Database Tables:</h3>
            <ul className="list-disc pl-6 mt-2">
              {tablesInfo.map((info, index) => (
                <li key={index} className={info.includes("Error") ? "text-red-600" : "text-green-600"}>
                  {info}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <a href="/" className="text-blue-500 underline">
          Back to Home Page
        </a>
      </div>
    </div>
  )
}

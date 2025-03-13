'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function updateScore(userId: string, gameId: string, completed: boolean) {
  try {
    console.log('Updating score:', { userId, gameId, completed })
    
    // Convert string IDs to integers if needed
    const userIdInt = parseInt(userId)
    const gameIdInt = parseInt(gameId)
    
    if (isNaN(userIdInt) || isNaN(gameIdInt)) {
      console.error('Invalid user ID or game ID:', { userId, gameId })
      return { success: false, error: 'Invalid user ID or game ID' }
    }
    
    // Check if record already exists
    const { data: existingRecord, error: findError } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', userIdInt)
      .eq('game_id', gameIdInt)
      .maybeSingle()
    
    if (findError) {
      console.error('Error checking existing record:', findError)
      return { success: false, error: findError.message }
    }
    
    let result;
    
    if (existingRecord) {
      // Update existing record
      console.log('Updating existing record:', existingRecord)
      result = await supabase
        .from('game_history')
        .update({ 
          completed,
          completed_at: completed ? new Date().toISOString() : null 
        })
        .eq('id', existingRecord.id)
        .select()
    } else {
      // Insert new record
      console.log('Creating new record for user_id:', userIdInt, 'game_id:', gameIdInt)
      result = await supabase
        .from('game_history')
        .insert([{ 
          user_id: userIdInt, 
          game_id: gameIdInt, 
          completed,
          completed_at: completed ? new Date().toISOString() : null 
        }])
        .select()
    }
    
    if (result.error) {
      console.error('Error updating score:', result.error)
      return { success: false, error: result.error.message }
    }
    
    console.log('Score updated successfully:', result.data)
    revalidatePath('/')
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Exception in updateScore:', error)
    return { success: false, error: 'Failed to update score' }
  }
}

export async function getGameHistory() {
  try {
    console.log('Fetching game history...')
    
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
    
    if (error) {
      console.error('Error fetching game history:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Game history fetched successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Exception in getGameHistory:', error)
    return { success: false, error: 'Failed to fetch game history' }
  }
}

export async function getGames() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('Error fetching games:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Exception in getGames:', error)
    return { success: false, error: 'Failed to fetch games' }
  }
}

export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('Error fetching users:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Exception in getUsers:', error)
    return { success: false, error: 'Failed to fetch users' }
  }
}

export async function addGame(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const points = parseInt(formData.get('points') as string) || 0
    
    console.log('Adding game:', { name, description, points })
    
    const { data, error } = await supabase
      .from('games')
      .insert([{ name, description, points }])
      .select()
    
    if (error) {
      console.error('Error adding game:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Game added successfully:', data)
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('Exception in addGame:', error)
    return { success: false, error: 'Failed to add game' }
  }
}

export async function addUser(formData: FormData) {
  try {
    const name = formData.get('name') as string
    
    console.log('Adding user:', { name })
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ name }])
      .select()
    
    if (error) {
      console.error('Error adding user:', error)
      return { success: false, error: error.message }
    }
    
    console.log('User added successfully:', data)
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('Exception in addUser:', error)
    return { success: false, error: 'Failed to add user' }
  }
}

export async function updateGame(gameId: string, formData: FormData) {
  try {
    const gameIdInt = parseInt(gameId)
    if (isNaN(gameIdInt)) {
      return { success: false, error: 'Invalid game ID' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const points = parseInt(formData.get('points') as string) || 0
    
    console.log('Updating game:', { gameId, name, description, points })
    
    const { data, error } = await supabase
      .from('games')
      .update({ name, description, points })
      .eq('id', gameIdInt)
      .select()
    
    if (error) {
      console.error('Error updating game:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Game updated successfully:', data)
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('Exception in updateGame:', error)
    return { success: false, error: 'Failed to update game' }
  }
}

export async function deleteGame(gameId: string) {
  try {
    const gameIdInt = parseInt(gameId)
    if (isNaN(gameIdInt)) {
      return { success: false, error: 'Invalid game ID' }
    }
    
    console.log('Deleting game:', gameId)
    
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameIdInt)
    
    if (error) {
      console.error('Error deleting game:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Game deleted successfully')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Exception in deleteGame:', error)
    return { success: false, error: 'Failed to delete game' }
  }
}
export async function updateGame(gameId: string, formData: FormData) {
  try {
    const gameIdInt = parseInt(gameId)
    if (isNaN(gameIdInt)) {
      return { success: false, error: 'Invalid game ID' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const points = parseInt(formData.get('points') as string) || 0
    
    console.log('Updating game:', { gameId, name, description, points })
    
    const { data, error } = await supabase
      .from('games')
      .update({ name, description, points })
      .eq('id', gameIdInt)
      .select()
    
    if (error) {
      console.error('Error updating game:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Game updated successfully:', data)
    revalidatePath('/')
    return { success: true, data }
  } catch (error) {
    console.error('Exception in updateGame:', error)
    return { success: false, error: 'Failed to update game' }
  }
}

export async function deleteGame(gameId: string) {
  try {
    const gameIdInt = parseInt(gameId)
    if (isNaN(gameIdInt)) {
      return { success: false, error: 'Invalid game ID' }
    }
    
    console.log('Deleting game:', gameId)
    
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameIdInt)
    
    if (error) {
      console.error('Error deleting game:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Game deleted successfully')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Exception in deleteGame:', error)
    return { success: false, error: 'Failed to delete game' }
  }
}

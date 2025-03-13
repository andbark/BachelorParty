'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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

export async function updateScore(userId: string, gameId: string, completed: boolean) {
  try {
    console.log('Updating score:', { userId, gameId, completed })
    
    // Check if record already exists
    const { data: existingRecord } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()
    
    let result;
    
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('game_history')
        .update({ completed })
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .select()
    } else {
      // Insert new record
      result = await supabase
        .from('game_history')
        .insert([{ user_id: userId, game_id: gameId, completed }])
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

export async function getGameHistory() {
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
    
    if (error) {
      console.error('Error fetching game history:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Exception in getGameHistory:', error)
    return { success: false, error: 'Failed to fetch game history' }
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

// Demo mode utilities for Vercel deployment
// This allows the frontend to be explored without a working backend

export const isDemoMode = () => {
    // Check if we're in demo mode (no real Supabase configured)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return !supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || supabaseUrl.includes('placeholder')
}

export const DEMO_MESSAGE = "🎭 Demo Mode: This is a simulation of how the app looks. The backend is not connected."

export const DEMO_USER = {
    id: 'demo-user-123',
    email: 'demo@example.com',
    user_metadata: {
        full_name: 'Demo User'
    }
}

// Mock data for demo mode
export const DEMO_INQUIRIES = [
    {
        id: 'inq-1',
        description: 'Black leather wallet with initials "JD"',
        image_url: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        match_count: 2
    },
    {
        id: 'inq-2',
        description: 'Blue backpack with laptop inside',
        image_url: null,
        status: 'matched',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        match_count: 1
    }
]

export const DEMO_MATCHES = [
    {
        id: 'match-1',
        score: 0.92,
        status: 'pending',
        inquiry: {
            id: 'inq-1',
            description: 'Black leather wallet with initials "JD"',
            image_url: null,
            created_at: new Date().toISOString()
        },
        inventory: {
            id: 'inv-1',
            description: 'Black leather bifold wallet found near library',
            image_url: null,
            location_found: 'Main Library, 2nd Floor'
        }
    }
]

export const DEMO_INVENTORY = [
    {
        id: 'inv-1',
        description: 'Black leather bifold wallet found near library',
        image_url: null,
        location_found: 'Main Library, 2nd Floor',
        status: 'active',
        created_at: new Date().toISOString()
    },
    {
        id: 'inv-2',
        description: 'Silver Apple AirPods Pro case',
        image_url: null,
        location_found: 'Student Center Cafeteria',
        status: 'active',
        created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
        id: 'inv-3',
        description: 'Red umbrella with wooden handle',
        image_url: null,
        location_found: 'Engineering Building Lobby',
        status: 'claimed',
        created_at: new Date(Date.now() - 259200000).toISOString()
    }
]

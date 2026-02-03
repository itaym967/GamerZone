import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { partyId, userId } = await request.json()

        if (!partyId || !userId) {
            return NextResponse.json({ error: 'Party ID and User ID are required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: party, error: partyError } = await supabase
            .from('parties')
            .select('*')
            .eq('id', partyId)
            .single()

        if (partyError || !party) {
            return NextResponse.json({ error: 'Party not found' }, { status: 404 })
        }

        if (party.leader_id !== user.id) {
            return NextResponse.json({ error: 'Only the party leader can kick members' }, { status: 403 })
        }

        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot kick yourself' }, { status: 400 })
        }

        const { error: deleteError } = await supabase
            .from('party_members')
            .delete()
            .eq('party_id', partyId)
            .eq('user_id', userId)

        if (deleteError) {
            console.error('Error kicking member:', deleteError)
            return NextResponse.json({ error: 'Failed to kick member' }, { status: 500 })
        }

        const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title: 'הוצאת מהקבוצה',
                message: 'מנהיג הקבוצה הוציא אותך מהקבוצה',
                type: 'party_kick'
            })

        if (notificationError) {
            console.error('Error creating notification:', notificationError)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in kick member route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

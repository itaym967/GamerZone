import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { partyId } = await request.json()

        if (!partyId) {
            return NextResponse.json({ error: 'Party ID is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: party, error: partyError } = await supabase
            .from('parties')
            .select('*, party_members(*)')
            .eq('id', partyId)
            .single()

        if (partyError || !party) {
            return NextResponse.json({ error: 'Party not found' }, { status: 404 })
        }

        const memberRecord = party.party_members?.find((m: any) => m.user_id === user.id)
        if (!memberRecord) {
            return NextResponse.json({ error: 'Not a member of this party' }, { status: 400 })
        }

        if (memberRecord.role === 'leader') {
            const otherMembers = party.party_members?.filter((m: any) => m.user_id !== user.id) || []
            
            if (otherMembers.length > 0) {
                const newLeader = otherMembers.sort((a: any, b: any) => 
                    new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
                )[0]

                const { error: updateError } = await supabase
                    .from('party_members')
                    .update({ role: 'leader' })
                    .eq('id', newLeader.id)

                if (updateError) {
                    console.error('Error transferring leadership:', updateError)
                }

                const { error: partyUpdateError } = await supabase
                    .from('parties')
                    .update({ leader_id: newLeader.user_id })
                    .eq('id', partyId)

                if (partyUpdateError) {
                    console.error('Error updating party leader:', partyUpdateError)
                }

                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: newLeader.user_id,
                        title: 'הפכת למנהיג הקבוצה',
                        message: 'המנהיג הקודם עזב והנהגת הקבוצה הועברה אליך',
                        type: 'party_leader'
                    })

                if (notificationError) {
                    console.error('Error creating notification:', notificationError)
                }
            } else {
                const { error: deleteError } = await supabase
                    .from('parties')
                    .delete()
                    .eq('id', partyId)

                if (deleteError) {
                    console.error('Error deleting party:', deleteError)
                    return NextResponse.json({ error: 'Failed to delete party' }, { status: 500 })
                }

                return NextResponse.json({ success: true, partyClosed: true })
            }
        }

        const { error: deleteError } = await supabase
            .from('party_members')
            .delete()
            .eq('id', memberRecord.id)

        if (deleteError) {
            console.error('Error leaving party:', deleteError)
            return NextResponse.json({ error: 'Failed to leave party' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in leave party route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

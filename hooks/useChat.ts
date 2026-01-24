import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    is_read: boolean
}

export interface Contact {
    id: string
    username: string
    avatar_url: string
    last_msg?: string
    last_msg_time?: string
    online?: boolean // Mocked for now, or via Presence later
}

export function useChat(currentUserId: string | undefined, onMessageReceived?: (msg: Message) => void) {
    const [messages, setMessages] = useState<Message[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()
    const channelRef = useRef<RealtimeChannel | null>(null)
    const onMessageReceivedRef = useRef(onMessageReceived)

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived
    }, [onMessageReceived])

    // 1. Fetch Contacts (unique users from message history)
    useEffect(() => {
        if (!currentUserId) return

        async function fetchContacts() {
            // Get all messages where I am sender or receiver
            const { data: sent, error: sentError } = await supabase
                .from('messages')
                .select('receiver_id, content, created_at')
                .eq('sender_id', currentUserId)
                .order('created_at', { ascending: false })

            const { data: received, error: receivedError } = await supabase
                .from('messages')
                .select('sender_id, content, created_at')
                .eq('receiver_id', currentUserId)
                .order('created_at', { ascending: false })

            if (sentError || receivedError) {
                console.error('Error fetching contacts', sentError, receivedError)
                return
            }

            // Aggregate unique IDs and latest message
            const contactMap = new Map<string, { lastMsg: string, time: string }>()

            sent?.forEach(m => {
                if (!contactMap.has(m.receiver_id)) {
                    contactMap.set(m.receiver_id, { lastMsg: `You: ${m.content}`, time: m.created_at })
                }
            })

            received?.forEach(m => {
                if (!contactMap.has(m.sender_id)) {
                    // If we already have a newer message from sending, keep it? 
                    // The lists are ordered by created_at desc.
                    // But we need to compare timestamps if we want TRUE precision.
                    // Simplified: just add if not present (implies "sent" messages take precedence in this basic logic if they came first in my manual list? No.)
                    // Logic improvement:
                    const existing = contactMap.get(m.sender_id)
                    if (!existing || new Date(m.created_at) > new Date(existing.time)) {
                        contactMap.set(m.sender_id, { lastMsg: m.content, time: m.created_at })
                    }
                }
            })

            const contactIds = Array.from(contactMap.keys())
            if (contactIds.length === 0) return

            // Fetch Profile Details
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, is_online')
                .in('id', contactIds)

            if (profiles) {
                const mappedContacts: Contact[] = profiles.map(p => ({
                    id: p.id,
                    username: p.username || 'Unknown',
                    avatar_url: p.avatar_url,
                    last_msg: contactMap.get(p.id)?.lastMsg,
                    last_msg_time: new Date(contactMap.get(p.id)!.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                    online: p.is_online
                }))
                setContacts(mappedContacts)
            }
        }

        fetchContacts()
    }, [currentUserId])

    // 2. Subscribe to Realtime Messages
    useEffect(() => {
        if (!currentUserId) return

        // Subscribe to ALL messages involving me
        // Filter: sender_id=eq.me OR receiver_id=eq.me
        // Supabase Realtime filters are limited. We usually subscribe to the table and filter in client or use RLS.
        // If RLS is enabled, we only receive what we are allowed to see.
        // So we can subscribe to "messages" (Postgres Changes) and we'll get our relevant ones.

        const channel = supabase
            .channel('chat_room')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                    // filter: `receiver_id=eq.${currentUserId}` // Filter is tricky with OR logic. Rely on RLS + client check.
                },
                (payload) => {
                    const newMessage = payload.new as Message
                    if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
                        setMessages(prev => {
                            // Deduplicate based on ID just in case
                            if (prev.some(m => m.id === newMessage.id)) return prev
                            return [...prev, newMessage]
                        })

                        // Trigger callback for notifications if it's an incoming message
                        if (newMessage.receiver_id === currentUserId && onMessageReceivedRef.current) {
                            onMessageReceivedRef.current(newMessage)
                        }
                    }
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId])

    // 3. Methods
    const fetchMessages = async (otherUserId: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true })

        if (error) {
            toast.error('שגיאה בטעינת הודעות')
        } else {
            setMessages(data || [])
        }
        setIsLoading(false)
    }

    const sendMessage = async (content: string, receiverId: string) => {
        if (!currentUserId) {
            console.error("sendMessage: No currentUserId");
            return;
        }

        console.log("Sending message...", { sender_id: currentUserId, receiver_id: receiverId, content });

        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUserId,
                receiver_id: receiverId,
                content
            })
            .select() // Return data to see if it worked or get more info

        if (error) {
            console.error('Supabase Insert Error:', JSON.stringify(error, null, 2));
            toast.error(`שגיאה בשליחת הודעה: ${error.message || 'שגיאה לא ידועה'}`);
        } else {
            console.log("Message sent successfully:", data);
        }

        // Optimistic update is handled by the subscription usually
    }

    return {
        messages,
        contacts,
        sendMessage,
        fetchMessages,
        isLoading
    }
}

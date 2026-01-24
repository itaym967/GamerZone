import { useState, useEffect, useRef, useCallback } from 'react'
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
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isSubscribedRef = useRef(false)
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastMessageTimeRef = useRef<number>(Date.now())

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

    // 2. Subscribe to Realtime Messages with Auto-Reconnect
    const setupRealtimeSubscription = useCallback(() => {
        if (!currentUserId || isSubscribedRef.current) return

        console.log('Setting up realtime subscription for user:', currentUserId);

        const channel = supabase
            .channel(`chat_room_${currentUserId}`, {
                config: {
                    broadcast: { self: false },
                    presence: { key: currentUserId }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('Realtime message received:', payload);
                    const newMessage = payload.new as Message

                    // Update last message time for heartbeat monitoring
                    lastMessageTimeRef.current = Date.now();

                    // Only add messages relevant to current user
                    if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
                        setMessages(prev => {
                            // Deduplicate based on ID
                            if (prev.some(m => m.id === newMessage.id)) {
                                console.log('Message already exists, skipping:', newMessage.id);
                                return prev;
                            }
                            console.log('Adding new message to state:', newMessage.id);
                            return [...prev, newMessage];
                        })

                        // Trigger callback for notifications if it's an incoming message
                        if (newMessage.receiver_id === currentUserId && onMessageReceivedRef.current) {
                            onMessageReceivedRef.current(newMessage)
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to realtime messages');
                    isSubscribedRef.current = true;
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime subscription error');
                    isSubscribedRef.current = false;
                    toast.error('שגיאה בחיבור לעדכונים בזמן אמת');
                    // Attempt reconnection after 3 seconds
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        if (channelRef.current) {
                            supabase.removeChannel(channelRef.current);
                        }
                        isSubscribedRef.current = false;
                        setupRealtimeSubscription();
                    }, 3000);
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Realtime subscription timed out');
                    isSubscribedRef.current = false;
                    toast.warning('החיבור לעדכונים בזמן אמת איטי');
                    // Attempt reconnection
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect after timeout...');
                        if (channelRef.current) {
                            supabase.removeChannel(channelRef.current);
                        }
                        isSubscribedRef.current = false;
                        setupRealtimeSubscription();
                    }, 2000);
                } else if (status === 'CLOSED') {
                    console.warn('🔌 Realtime connection closed');
                    isSubscribedRef.current = false;
                }
            })

        channelRef.current = channel
    }, [currentUserId])

    useEffect(() => {
        setupRealtimeSubscription();

        return () => {
            console.log('Cleaning up realtime subscription');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
            isSubscribedRef.current = false;
        }
    }, [setupRealtimeSubscription])

    // 3. Handle Page Visibility Changes (reconnect when tab becomes active)
    useEffect(() => {
        if (!currentUserId) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('Tab became visible, checking connection...');
                // If we're not subscribed, reconnect
                if (!isSubscribedRef.current) {
                    console.log('Reconnecting after tab became visible...');
                    if (channelRef.current) {
                        supabase.removeChannel(channelRef.current);
                    }
                    setupRealtimeSubscription();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [currentUserId, setupRealtimeSubscription])

    // 4. Heartbeat to monitor connection health
    useEffect(() => {
        if (!currentUserId) return;

        heartbeatIntervalRef.current = setInterval(() => {
            const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
            // If no activity for 2 minutes and we think we're subscribed, verify connection
            if (timeSinceLastMessage > 120000 && isSubscribedRef.current) {
                console.log('Heartbeat: Verifying connection health...');
                // Check if channel is still connected
                if (channelRef.current && channelRef.current.state !== 'joined') {
                    console.warn('Heartbeat: Connection appears stale, reconnecting...');
                    isSubscribedRef.current = false;
                    if (channelRef.current) {
                        supabase.removeChannel(channelRef.current);
                    }
                    setupRealtimeSubscription();
                }
            }
        }, 30000); // Check every 30 seconds

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, [currentUserId, setupRealtimeSubscription])

    // 5. Methods
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
        // Validation: Ensure user is authenticated
        if (!currentUserId) {
            console.error("sendMessage: No currentUserId - user not authenticated");
            toast.error('אנא התחבר כדי לשלוח הודעות');
            return;
        }

        // Validation: Ensure content is not empty
        if (!content.trim()) {
            console.error("sendMessage: Empty content");
            toast.error('לא ניתן לשלוח הודעה ריקה');
            return;
        }

        // Validation: Ensure receiver ID is valid
        if (!receiverId) {
            console.error("sendMessage: No receiverId");
            toast.error('שגיאה: לא נבחר נמען');
            return;
        }

        console.log("Sending message...", {
            sender_id: currentUserId,
            receiver_id: receiverId,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });

        // Optimistic update - add message immediately to UI
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`, // Temporary ID
            sender_id: currentUserId,
            receiver_id: receiverId,
            content,
            created_at: new Date().toISOString(),
            is_read: false
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: receiverId,
                    content
                })
                .select()

            if (error) {
                // Remove optimistic message on error
                setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));

                console.error('Supabase Insert Error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });

                // Provide specific error messages based on error type
                if (error.code === 'PGRST301' || error.message.includes('JWT')) {
                    toast.error('פג תוקף ההתחברות. אנא התחבר מחדש');
                } else if (error.code === '42501' || error.message.includes('permission')) {
                    toast.error('אין לך הרשאה לשלוח הודעה זו');
                } else {
                    toast.error(`שגיאה בשליחת הודעה: ${error.message}`);
                }
                return;
            }

            console.log("Message sent successfully:", data);

            // Replace optimistic message with real one from server
            if (data && data.length > 0) {
                setMessages(prev =>
                    prev.map(m => m.id === optimisticMessage.id ? data[0] : m)
                );
            }

            // Trigger Push Notification (non-blocking)
            if (receiverId !== currentUserId) {
                fetch('/api/send-push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: receiverId,
                        title: 'הודעה חדשה',
                        message: content,
                        url: `/chat?target=${currentUserId}`
                    })
                }).catch(err => console.error("Failed to trigger push notification:", err));
            }
        } catch (err) {
            // Remove optimistic message on unexpected error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            console.error('Unexpected error in sendMessage:', err);
            toast.error('שגיאה בלתי צפויה בשליחת הודעה');
        }
    }

    const refreshConnection = useCallback(async () => {
        console.log('Manual refresh triggered');
        // Reconnect realtime
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }
        isSubscribedRef.current = false;
        setupRealtimeSubscription();

        // Re-fetch contacts
        if (currentUserId) {
            // Trigger contacts refetch by updating a dependency
            // This is a simple approach - in production you might want a more explicit refetch
            toast.success('מרענן חיבור...');
        }
    }, [currentUserId, setupRealtimeSubscription]);

    return {
        messages,
        contacts,
        sendMessage,
        fetchMessages,
        isLoading,
        refreshConnection
    }
}

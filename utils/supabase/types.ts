export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            lfg_posts: {
                Row: {
                    id: string
                    user_id: string
                    game: string
                    mode: string
                    description: string | null
                    mic_required: boolean
                    region: string | null
                    created_at: string
                    expires_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    game: string
                    mode: string
                    description?: string | null
                    mic_required?: boolean
                    region?: string | null
                    created_at?: string
                    expires_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    game?: string
                    mode?: string
                    description?: string | null
                    mic_required?: boolean
                    region?: string | null
                    created_at?: string
                    expires_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    updated_at: string | null
                    is_banned: boolean | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                    is_banned?: boolean | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                    updated_at?: string | null
                    is_banned?: boolean | null
                }
            }
        }
    }
}

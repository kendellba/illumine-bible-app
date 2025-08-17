export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bible_versions: {
        Row: {
          id: string
          name: string
          abbreviation: string
          language: string
          storage_path: string
          download_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          abbreviation: string
          language?: string
          storage_path: string
          download_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          abbreviation?: string
          language?: string
          storage_path?: string
          download_size?: number | null
          created_at?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: number
          user_id: string
          book: string
          chapter: number
          verse: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          book: string
          chapter: number
          verse: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          book?: string
          chapter?: number
          verse?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: number
          user_id: string
          book: string
          chapter: number
          verse: number
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          book: string
          chapter: number
          verse: number
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          book?: string
          chapter?: number
          verse?: number
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      highlights: {
        Row: {
          id: number
          user_id: string
          book: string
          chapter: number
          verse: number
          color_hex: string
          start_offset: number | null
          end_offset: number | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          book: string
          chapter: number
          verse: number
          color_hex?: string
          start_offset?: number | null
          end_offset?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          book?: string
          chapter?: number
          verse?: number
          color_hex?: string
          start_offset?: number | null
          end_offset?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      verse_of_the_day: {
        Row: {
          id: number
          date: string
          book: string
          chapter: number
          verse: number
          created_at: string
        }
        Insert: {
          id?: number
          date?: string
          book: string
          chapter: number
          verse: number
          created_at?: string
        }
        Update: {
          id?: number
          date?: string
          book?: string
          chapter?: number
          verse?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

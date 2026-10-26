export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_type: string
          category: string
          created_at: string
          description: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          rarity: string | null
          requirement_type: string
          requirement_value: number | null
          updated_at: string
        }
        Insert: {
          badge_type: string
          category: string
          created_at?: string
          description: string
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          rarity?: string | null
          requirement_type: string
          requirement_value?: number | null
          updated_at?: string
        }
        Update: {
          badge_type?: string
          category?: string
          created_at?: string
          description?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          rarity?: string | null
          requirement_type?: string
          requirement_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          type: string
          user_avatar: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          type: string
          user_avatar?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          type?: string
          user_avatar?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_history: {
        Row: {
          average_rating: number | null
          changed_by: string | null
          created_at: string
          id: string
          new_tier: string
          previous_tier: string
          reason: string
          transaction_count: number | null
          user_id: string
        }
        Insert: {
          average_rating?: number | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_tier: string
          previous_tier: string
          reason: string
          transaction_count?: number | null
          user_id: string
        }
        Update: {
          average_rating?: number | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_tier?: string
          previous_tier?: string
          reason?: string
          transaction_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "badge_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "badge_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      barter_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          proposal_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          proposal_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          proposal_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barter_messages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "active_barter_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_messages_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "barter_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "barter_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      barter_preferences: {
        Row: {
          accept_partial_exchange: boolean | null
          created_at: string
          exchange_notes: string | null
          id: string
          listing_id: string
          max_value: number | null
          min_value: number | null
          open_to_exchange: boolean
          preferred_categories: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accept_partial_exchange?: boolean | null
          created_at?: string
          exchange_notes?: string | null
          id?: string
          listing_id: string
          max_value?: number | null
          min_value?: number | null
          open_to_exchange?: boolean
          preferred_categories?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accept_partial_exchange?: boolean | null
          created_at?: string
          exchange_notes?: string | null
          id?: string
          listing_id?: string
          max_value?: number | null
          min_value?: number | null
          open_to_exchange?: boolean
          preferred_categories?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barter_preferences_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "barter_preferences_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "barter_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      barter_proposals: {
        Row: {
          cash_adjustment: number | null
          cash_adjustment_payer: string | null
          completed_at: string | null
          counter_proposal_id: string | null
          created_at: string
          expires_at: string
          id: string
          message: string | null
          offered_listing_id: string
          offered_listing_value: number
          proposer_id: string
          receiver_id: string
          status: string
          target_listing_id: string
          target_listing_value: number
          updated_at: string
          value_difference: number
        }
        Insert: {
          cash_adjustment?: number | null
          cash_adjustment_payer?: string | null
          completed_at?: string | null
          counter_proposal_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offered_listing_id: string
          offered_listing_value: number
          proposer_id: string
          receiver_id: string
          status?: string
          target_listing_id: string
          target_listing_value: number
          updated_at?: string
          value_difference?: number
        }
        Update: {
          cash_adjustment?: number | null
          cash_adjustment_payer?: string | null
          completed_at?: string | null
          counter_proposal_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offered_listing_id?: string
          offered_listing_value?: number
          proposer_id?: string
          receiver_id?: string
          status?: string
          target_listing_id?: string
          target_listing_value?: number
          updated_at?: string
          value_difference?: number
        }
        Relationships: [
          {
            foreignKeyName: "barter_proposals_counter_proposal_id_fkey"
            columns: ["counter_proposal_id"]
            isOneToOne: false
            referencedRelation: "active_barter_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_counter_proposal_id_fkey"
            columns: ["counter_proposal_id"]
            isOneToOne: false
            referencedRelation: "barter_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_offered_listing_id_fkey"
            columns: ["offered_listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "barter_proposals_offered_listing_id_fkey"
            columns: ["offered_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "barter_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "barter_proposals_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "barter_proposals_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_offers: {
        Row: {
          battle_id: string
          created_at: string | null
          id: string
          message: string | null
          offer_amount: number
          offered_by: string
          responded_at: string | null
          round_number: number
          status: string
        }
        Insert: {
          battle_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          offer_amount: number
          offered_by: string
          responded_at?: string | null
          round_number: number
          status?: string
        }
        Update: {
          battle_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          offer_amount?: number
          offered_by?: string
          responded_at?: string | null
          round_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_offers_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "price_drop_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      boosts: {
        Row: {
          created_at: string
          duration_hours: number
          expiration_notification_sent: boolean | null
          expires_at: string
          id: string
          impressions_gained: number
          listing_id: string
          messages_received: number
          package_type: string
          payment_status: string
          paystack_reference: string
          price: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
          views_gained: number
        }
        Insert: {
          created_at?: string
          duration_hours: number
          expiration_notification_sent?: boolean | null
          expires_at: string
          id?: string
          impressions_gained?: number
          listing_id: string
          messages_received?: number
          package_type: string
          payment_status?: string
          paystack_reference: string
          price: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          views_gained?: number
        }
        Update: {
          created_at?: string
          duration_hours?: number
          expiration_notification_sent?: boolean | null
          expires_at?: string
          id?: string
          impressions_gained?: number
          listing_id?: string
          messages_received?: number
          package_type?: string
          payment_status?: string
          paystack_reference?: string
          price?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          views_gained?: number
        }
        Relationships: [
          {
            foreignKeyName: "boosts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "boosts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_category_tags: {
        Row: {
          business_profile_id: string
          category_id: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          subcategory_ids: string[] | null
        }
        Insert: {
          business_profile_id: string
          category_id: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          subcategory_ids?: string[] | null
        }
        Update: {
          business_profile_id?: string
          category_id?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          subcategory_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "business_category_tags_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_category_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          address: string | null
          average_rating: number | null
          business_hours: Json | null
          business_name: string
          business_type: string | null
          city: string
          completeness_percentage: number | null
          coordinates: unknown
          created_at: string | null
          description: string
          display_name: string | null
          email: string | null
          embedding: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          phone: string | null
          photo_urls: string[] | null
          postal_code: string | null
          premium_expires_at: string | null
          premium_tier: string | null
          price_range: string | null
          primary_category_id: string
          primary_photo_url: string | null
          primary_subcategory_ids: string[] | null
          review_count: number | null
          search_vector: unknown
          service_attributes: Json | null
          state: string
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verified_at: string | null
          view_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          business_hours?: Json | null
          business_name: string
          business_type?: string | null
          city: string
          completeness_percentage?: number | null
          coordinates?: unknown
          created_at?: string | null
          description: string
          display_name?: string | null
          email?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          photo_urls?: string[] | null
          postal_code?: string | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          price_range?: string | null
          primary_category_id: string
          primary_photo_url?: string | null
          primary_subcategory_ids?: string[] | null
          review_count?: number | null
          search_vector?: unknown
          service_attributes?: Json | null
          state: string
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          business_hours?: Json | null
          business_name?: string
          business_type?: string | null
          city?: string
          completeness_percentage?: number | null
          coordinates?: unknown
          created_at?: string | null
          description?: string
          display_name?: string | null
          email?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          phone?: string | null
          photo_urls?: string[] | null
          postal_code?: string | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          price_range?: string | null
          primary_category_id?: string
          primary_photo_url?: string | null
          primary_subcategory_ids?: string[] | null
          review_count?: number | null
          search_vector?: unknown
          service_attributes?: Json | null
          state?: string
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_profile_id: string
          comment: string
          created_at: string | null
          flagged_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          owner_response: string | null
          rating: number
          responded_at: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          business_profile_id: string
          comment: string
          created_at?: string | null
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          owner_response?: string | null
          rating: number
          responded_at?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          business_profile_id?: string
          comment?: string
          created_at?: string | null
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          owner_response?: string | null
          rating?: number
          responded_at?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          average_rating: number | null
          business_hours: Json | null
          business_type: string | null
          category_id: string | null
          city: string | null
          completeness_percentage: number | null
          coordinates: unknown
          cover_url: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          lga: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string
          photo_urls: string[] | null
          postal_code: string | null
          premium_expires_at: string | null
          premium_tier: string | null
          price_range: string | null
          primary_category_id: string | null
          primary_photo_url: string | null
          primary_subcategory_ids: string[] | null
          review_count: number | null
          search_vector: unknown
          service_attributes: Json | null
          state: string
          updated_at: string | null
          verification_documents: Json | null
          verified_at: string | null
          view_count: number | null
          ward: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          business_hours?: Json | null
          business_type?: string | null
          category_id?: string | null
          city?: string | null
          completeness_percentage?: number | null
          coordinates?: unknown
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          lga: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone: string
          photo_urls?: string[] | null
          postal_code?: string | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          price_range?: string | null
          primary_category_id?: string | null
          primary_photo_url?: string | null
          primary_subcategory_ids?: string[] | null
          review_count?: number | null
          search_vector?: unknown
          service_attributes?: Json | null
          state: string
          updated_at?: string | null
          verification_documents?: Json | null
          verified_at?: string | null
          view_count?: number | null
          ward?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          business_hours?: Json | null
          business_type?: string | null
          category_id?: string | null
          city?: string | null
          completeness_percentage?: number | null
          coordinates?: unknown
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          lga?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string
          photo_urls?: string[] | null
          postal_code?: string | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          price_range?: string | null
          primary_category_id?: string | null
          primary_photo_url?: string | null
          primary_subcategory_ids?: string[] | null
          review_count?: number | null
          search_vector?: unknown
          service_attributes?: Json | null
          state?: string
          updated_at?: string | null
          verification_documents?: Json | null
          verified_at?: string | null
          view_count?: number | null
          ward?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      buying_guides: {
        Row: {
          author_id: string | null
          bookmark_count: number | null
          category_id: string
          checklist: Json | null
          common_scams: string[] | null
          comparison_chart: Json | null
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          key_features: string[] | null
          last_updated_at: string | null
          market_prices: Json | null
          price_ranges: Json | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          bookmark_count?: number | null
          category_id: string
          checklist?: Json | null
          common_scams?: string[] | null
          comparison_chart?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          key_features?: string[] | null
          last_updated_at?: string | null
          market_prices?: Json | null
          price_ranges?: Json | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          bookmark_count?: number | null
          category_id?: string
          checklist?: Json | null
          common_scams?: string[] | null
          comparison_chart?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          key_features?: string[] | null
          last_updated_at?: string | null
          market_prices?: Json | null
          price_ranges?: Json | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buying_guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "buying_guides_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buying_guides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cached_listings: {
        Row: {
          cache_size_kb: number
          cached_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          listing_data: Json
          listing_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cache_size_kb: number
          cached_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          listing_data: Json
          listing_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cache_size_kb?: number
          cached_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          listing_data?: Json
          listing_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cached_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "cached_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cached_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cached_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accent_color: string | null
          created_at: string | null
          description: string | null
          description_translations: Json | null
          display_order: number
          icon: string
          id: string
          is_hidden: boolean | null
          item_count: number | null
          name: string
          name_translations: Json | null
          parent_id: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          display_order?: number
          icon: string
          id?: string
          is_hidden?: boolean | null
          item_count?: number | null
          name: string
          name_translations?: Json | null
          parent_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          description?: string | null
          description_translations?: Json | null
          display_order?: number
          icon?: string
          id?: string
          is_hidden?: boolean | null
          item_count?: number | null
          name?: string
          name_translations?: Json | null
          parent_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_analytics: {
        Row: {
          business_count: number | null
          category_id: string
          created_at: string | null
          id: string
          period_date: string
          period_type: string
          search_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          business_count?: number | null
          category_id: string
          created_at?: string | null
          id?: string
          period_date: string
          period_type: string
          search_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          business_count?: number | null
          category_id?: string
          created_at?: string | null
          id?: string
          period_date?: string
          period_type?: string
          search_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_analytics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_sets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_saved: boolean
          listing_ids: Json
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_saved?: boolean
          listing_ids?: Json
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_saved?: boolean
          listing_ids?: Json
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_sets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comparison_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          auto_release_at: string | null
          buyer_id: string
          created_at: string
          dispute_evidence: Json | null
          dispute_reason: string | null
          estimated_delivery_date: string | null
          fee: number
          id: string
          listing_id: string | null
          paystack_reference: string | null
          released_at: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          auto_release_at?: string | null
          buyer_id: string
          created_at?: string
          dispute_evidence?: Json | null
          dispute_reason?: string | null
          estimated_delivery_date?: string | null
          fee?: number
          id?: string
          listing_id?: string | null
          paystack_reference?: string | null
          released_at?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          auto_release_at?: string | null
          buyer_id?: string
          created_at?: string
          dispute_evidence?: Json | null
          dispute_reason?: string | null
          estimated_delivery_date?: string | null
          fee?: number
          id?: string
          listing_id?: string | null
          paystack_reference?: string | null
          released_at?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "escrow_transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "escrow_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "escrow_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_scores: {
        Row: {
          alerts_sent: Json | null
          calculation_version: string
          created_at: string
          factors: Json
          fraud_score: number
          id: string
          is_suspended: boolean | null
          last_alert_sent_at: string | null
          last_calculated_at: string
          metrics: Json
          risk_level: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_sent?: Json | null
          calculation_version?: string
          created_at?: string
          factors?: Json
          fraud_score?: number
          id?: string
          is_suspended?: boolean | null
          last_alert_sent_at?: string | null
          last_calculated_at?: string
          metrics?: Json
          risk_level?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_sent?: Json | null
          calculation_version?: string
          created_at?: string
          factors?: Json
          fraud_score?: number
          id?: string
          is_suspended?: boolean | null
          last_alert_sent_at?: string | null
          last_calculated_at?: string
          metrics?: Json
          risk_level?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_scores_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fraud_scores_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fraud_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_bookmarks: {
        Row: {
          created_at: string | null
          guide_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          guide_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          guide_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_bookmarks_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "buying_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "guide_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string | null
          has_variants: boolean | null
          id: string
          is_sold_out: boolean | null
          last_restock_date: string | null
          last_stock_update: string | null
          listing_id: string
          low_stock_threshold: number | null
          stock_quantity: number
          total_value: number | null
          unit_price: number | null
          updated_at: string | null
          user_id: string
          variants: Json | null
        }
        Insert: {
          created_at?: string | null
          has_variants?: boolean | null
          id?: string
          is_sold_out?: boolean | null
          last_restock_date?: string | null
          last_stock_update?: string | null
          listing_id: string
          low_stock_threshold?: number | null
          stock_quantity?: number
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string | null
          user_id: string
          variants?: Json | null
        }
        Update: {
          created_at?: string | null
          has_variants?: boolean | null
          id?: string
          is_sold_out?: boolean | null
          last_restock_date?: string | null
          last_stock_update?: string | null
          listing_id?: string
          low_stock_threshold?: number | null
          stock_quantity?: number
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string | null
          user_id?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "inventory_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          created_at: string | null
          display_order: number | null
          duration_seconds: number | null
          id: string
          listing_id: string | null
          media_type: string | null
          media_url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          id?: string
          listing_id?: string | null
          media_type?: string | null
          media_url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          id?: string
          listing_id?: string | null
          media_type?: string | null
          media_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_price_history: {
        Row: {
          changed_at: string | null
          id: string
          listing_id: string
          new_price: number
          previous_price: number
          price_change: number | null
          price_change_percentage: number | null
        }
        Insert: {
          changed_at?: string | null
          id?: string
          listing_id: string
          new_price: number
          previous_price: number
          price_change?: number | null
          price_change_percentage?: number | null
        }
        Update: {
          changed_at?: string | null
          id?: string
          listing_id?: string
          new_price?: number
          previous_price?: number
          price_change?: number | null
          price_change_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          boost_expires_at: string | null
          boost_level: number | null
          business_id: string | null
          category_id: string | null
          condition: string | null
          coordinates: unknown
          created_at: string | null
          deal_expires_at: string | null
          deleted_at: string | null
          description: string
          discount_percentage: number | null
          embedding: string | null
          embedding_needs_update: boolean | null
          id: string
          is_active: boolean | null
          is_boosted: boolean | null
          lga: string
          likes_count: number | null
          original_price: number | null
          price: number | null
          saves_count: number | null
          state: string
          status: string | null
          subcategory_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          views_count: number | null
          ward: string | null
        }
        Insert: {
          boost_expires_at?: string | null
          boost_level?: number | null
          business_id?: string | null
          category_id?: string | null
          condition?: string | null
          coordinates?: unknown
          created_at?: string | null
          deal_expires_at?: string | null
          deleted_at?: string | null
          description: string
          discount_percentage?: number | null
          embedding?: string | null
          embedding_needs_update?: boolean | null
          id?: string
          is_active?: boolean | null
          is_boosted?: boolean | null
          lga: string
          likes_count?: number | null
          original_price?: number | null
          price?: number | null
          saves_count?: number | null
          state: string
          status?: string | null
          subcategory_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
          ward?: string | null
        }
        Update: {
          boost_expires_at?: string | null
          boost_level?: number | null
          business_id?: string | null
          category_id?: string | null
          condition?: string | null
          coordinates?: unknown
          created_at?: string | null
          deal_expires_at?: string | null
          deleted_at?: string | null
          description?: string
          discount_percentage?: number | null
          embedding?: string | null
          embedding_needs_update?: boolean | null
          id?: string
          is_active?: boolean | null
          is_boosted?: boolean | null
          lga?: string
          likes_count?: number | null
          original_price?: number | null
          price?: number | null
          saves_count?: number | null
          state?: string
          status?: string | null
          subcategory_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
          ward?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_flagged: boolean | null
          message: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          message: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          message?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          ended_at: string | null
          flagged_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          peak_viewer_count: number
          pinned_products: Json | null
          recording_expires_at: string | null
          recording_url: string | null
          scheduled_start_at: string | null
          started_at: string | null
          stream_key: string | null
          stream_status: string
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          total_views: number
          updated_at: string | null
          user_id: string
          viewer_count: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          peak_viewer_count?: number
          pinned_products?: Json | null
          recording_expires_at?: string | null
          recording_url?: string | null
          scheduled_start_at?: string | null
          started_at?: string | null
          stream_key?: string | null
          stream_status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          total_views?: number
          updated_at?: string | null
          user_id: string
          viewer_count?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          flagged_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          peak_viewer_count?: number
          pinned_products?: Json | null
          recording_expires_at?: string | null
          recording_url?: string | null
          scheduled_start_at?: string | null
          started_at?: string | null
          stream_key?: string | null
          stream_status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          total_views?: number
          updated_at?: string | null
          user_id?: string
          viewer_count?: number
        }
        Relationships: []
      }
      logistics_providers: {
        Row: {
          api_endpoint: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meetups: {
        Row: {
          buyer_checked_in: boolean | null
          buyer_checked_in_at: string | null
          buyer_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          latitude: number
          listing_id: string
          location_address: string
          location_name: string
          location_type: string | null
          longitude: number
          safety_notes: string | null
          scheduled_at: string
          seller_checked_in: boolean | null
          seller_checked_in_at: string | null
          seller_id: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_checked_in?: boolean | null
          buyer_checked_in_at?: string | null
          buyer_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          latitude: number
          listing_id: string
          location_address: string
          location_name: string
          location_type?: string | null
          longitude: number
          safety_notes?: string | null
          scheduled_at: string
          seller_checked_in?: boolean | null
          seller_checked_in_at?: string | null
          seller_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_checked_in?: boolean | null
          buyer_checked_in_at?: string | null
          buyer_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          latitude?: number
          listing_id?: string
          location_address?: string
          location_name?: string
          location_type?: string | null
          longitude?: number
          safety_notes?: string | null
          scheduled_at?: string
          seller_checked_in?: boolean | null
          seller_checked_in_at?: string | null
          seller_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetups_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "meetups_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetups_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "meetups_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetups_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "meetups_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetups_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "purchase_records"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_results: {
        Row: {
          action: string
          admin_decision: string | null
          admin_id: string | null
          admin_notes: string | null
          admin_reviewed: boolean | null
          approved: boolean
          confidence_score: number
          created_at: string
          id: string
          listing_id: string | null
          reviewed_at: string | null
          scan_type: string
          scanned_content: Json
          updated_at: string
          user_id: string
          violations: Json
        }
        Insert: {
          action: string
          admin_decision?: string | null
          admin_id?: string | null
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          approved?: boolean
          confidence_score: number
          created_at?: string
          id?: string
          listing_id?: string | null
          reviewed_at?: string | null
          scan_type: string
          scanned_content: Json
          updated_at?: string
          user_id: string
          violations?: Json
        }
        Update: {
          action?: string
          admin_decision?: string | null
          admin_id?: string | null
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          approved?: boolean
          confidence_score?: number
          created_at?: string
          id?: string
          listing_id?: string | null
          reviewed_at?: string | null
          scan_type?: string
          scanned_content?: Json
          updated_at?: string
          user_id?: string
          violations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "moderation_results_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_results_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_results_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "moderation_results_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nigerian_areas: {
        Row: {
          created_at: string | null
          id: string
          name: string
          state_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          state_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nigerian_areas_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "nigerian_states"
            referencedColumns: ["id"]
          },
        ]
      }
      nigerian_states: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      nigerian_wards: {
        Row: {
          area_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "nigerian_wards_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "nigerian_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          admin_updates: boolean | null
          created_at: string | null
          listing_interactions: boolean | null
          new_listing: boolean | null
          new_message: boolean | null
          payment_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_updates?: boolean | null
          created_at?: string | null
          listing_interactions?: boolean | null
          new_listing?: boolean | null
          new_message?: boolean | null
          payment_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_updates?: boolean | null
          created_at?: string | null
          listing_interactions?: boolean | null
          new_listing?: boolean | null
          new_message?: boolean | null
          payment_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_actions: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string | null
          error_code: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          last_sync_attempt_at: string | null
          priority: number | null
          sequence_number: number
          sync_attempts: number | null
          sync_status: string | null
          synced_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_data: Json
          action_type: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_sync_attempt_at?: string | null
          priority?: number | null
          sequence_number?: number
          sync_attempts?: number | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_sync_attempt_at?: string | null
          priority?: number | null
          sequence_number?: number
          sync_attempts?: number | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offline_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          listing_id: string | null
          payment_type: string | null
          paystack_reference: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          listing_id?: string | null
          payment_type?: string | null
          paystack_reference?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          listing_id?: string | null
          payment_type?: string | null
          paystack_reference?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string
          delta: number | null
          id: string
          metric_id: string | null
          name: string
          rating: string | null
          timestamp: string
          url: string | null
          user_agent: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          delta?: number | null
          id?: string
          metric_id?: string | null
          name: string
          rating?: string | null
          timestamp?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string
          delta?: number | null
          id?: string
          metric_id?: string | null
          name?: string
          rating?: string | null
          timestamp?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      points_history: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          points_after: number
          points_change: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          points_after: number
          points_change: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          points_after?: number
          points_change?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "points_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          media_type: string | null
          media_url: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          media_type?: string | null
          media_url: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          media_type?: string | null
          media_url?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "portfolio_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_drop_battles: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          current_offer: number
          current_round: number | null
          expires_at: string | null
          final_price: number | null
          id: string
          last_offer_by: string | null
          listing_id: string
          max_rounds: number | null
          original_price: number
          round_duration_minutes: number | null
          round_expires_at: string | null
          round_started_at: string | null
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          current_offer: number
          current_round?: number | null
          expires_at?: string | null
          final_price?: number | null
          id?: string
          last_offer_by?: string | null
          listing_id: string
          max_rounds?: number | null
          original_price: number
          round_duration_minutes?: number | null
          round_expires_at?: string | null
          round_started_at?: string | null
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_offer?: number
          current_round?: number | null
          expires_at?: string | null
          final_price?: number | null
          id?: string
          last_offer_by?: string | null
          listing_id?: string
          max_rounds?: number | null
          original_price?: number
          round_duration_minutes?: number | null
          round_expires_at?: string | null
          round_started_at?: string | null
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_drop_battles_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "price_drop_battles_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_suggestions: {
        Row: {
          actual_price_set: number | null
          avg_selling_time_days: number | null
          confidence_score: number
          created_at: string | null
          factors_considered: Json | null
          id: string
          listing_id: string
          market_average: number | null
          max_price: number
          min_price: number
          price_deviation_percentage: number | null
          price_history: Json | null
          seasonal_adjustment: number | null
          similar_items_count: number | null
          suggested_price: number
          suggestion_accepted: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_price_set?: number | null
          avg_selling_time_days?: number | null
          confidence_score: number
          created_at?: string | null
          factors_considered?: Json | null
          id?: string
          listing_id: string
          market_average?: number | null
          max_price: number
          min_price: number
          price_deviation_percentage?: number | null
          price_history?: Json | null
          seasonal_adjustment?: number | null
          similar_items_count?: number | null
          suggested_price: number
          suggestion_accepted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_price_set?: number | null
          avg_selling_time_days?: number | null
          confidence_score?: number
          created_at?: string | null
          factors_considered?: Json | null
          id?: string
          listing_id?: string
          market_average?: number | null
          max_price?: number
          min_price?: number
          price_deviation_percentage?: number | null
          price_history?: Json | null
          seasonal_adjustment?: number | null
          similar_items_count?: number | null
          suggested_price?: number
          suggestion_accepted?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_suggestions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "pricing_suggestions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      product_listings: {
        Row: {
          business_profile_id: string
          created_at: string | null
          currency: string | null
          description: string
          id: string
          image_urls: string[]
          is_active: boolean | null
          is_featured: boolean | null
          is_in_stock: boolean | null
          low_stock_threshold: number | null
          price: number
          primary_image_url: string
          product_type: string
          stock_quantity: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          business_profile_id: string
          created_at?: string | null
          currency?: string | null
          description: string
          id?: string
          image_urls: string[]
          is_active?: boolean | null
          is_featured?: boolean | null
          is_in_stock?: boolean | null
          low_stock_threshold?: number | null
          price: number
          primary_image_url: string
          product_type: string
          stock_quantity?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          business_profile_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          id?: string
          image_urls?: string[]
          is_active?: boolean | null
          is_featured?: boolean | null
          is_in_stock?: boolean | null
          low_stock_threshold?: number | null
          price?: number
          primary_image_url?: string
          product_type?: string
          stock_quantity?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_listings_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          asker_id: string
          created_at: string | null
          id: string
          is_seller_answer: boolean | null
          listing_id: string
          question: string
          status: string | null
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asker_id: string
          created_at?: string | null
          id?: string
          is_seller_answer?: boolean | null
          listing_id: string
          question: string
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asker_id?: string
          created_at?: string | null
          id?: string
          is_seller_answer?: boolean | null
          listing_id?: string
          question?: string
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_questions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_asker_id_fkey"
            columns: ["asker_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_questions_asker_id_fkey"
            columns: ["asker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_questions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "product_questions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      product_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          created_at: string | null
          description: string
          expires_at: string | null
          fulfilled_at: string | null
          id: string
          offers_count: number | null
          preferred_location: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          fulfilled_at?: string | null
          id?: string
          offers_count?: number | null
          preferred_location?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          fulfilled_at?: string | null
          id?: string
          offers_count?: number | null
          preferred_location?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_premium: boolean | null
          listing_count: number | null
          name: string
          nin_verified: boolean | null
          phone_verified: boolean | null
          premium_expires_at: string | null
          premium_tier: string | null
          rating: number | null
          response_time_hours: number | null
          review_count: number | null
          specialties: string[] | null
          total_sales: number | null
          updated_at: string | null
          video_verified: boolean | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          is_premium?: boolean | null
          listing_count?: number | null
          name: string
          nin_verified?: boolean | null
          phone_verified?: boolean | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          rating?: number | null
          response_time_hours?: number | null
          review_count?: number | null
          specialties?: string[] | null
          total_sales?: number | null
          updated_at?: string | null
          video_verified?: boolean | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          listing_count?: number | null
          name?: string
          nin_verified?: boolean | null
          phone_verified?: boolean | null
          premium_expires_at?: string | null
          premium_tier?: string | null
          rating?: number | null
          response_time_hours?: number | null
          review_count?: number | null
          specialties?: string[] | null
          total_sales?: number | null
          updated_at?: string | null
          video_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_records: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          delivered_at: string | null
          delivery_address: Json | null
          delivery_status: string
          escrow_transaction_id: string | null
          id: string
          listing_id: string
          payment_method: string | null
          purchased_at: string
          quantity: number
          seller_id: string
          tracking_number: string | null
          updated_at: string
          warranty_expires_at: string | null
          warranty_period_days: number | null
          warranty_terms: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_status?: string
          escrow_transaction_id?: string | null
          id?: string
          listing_id: string
          payment_method?: string | null
          purchased_at?: string
          quantity?: number
          seller_id: string
          tracking_number?: string | null
          updated_at?: string
          warranty_expires_at?: string | null
          warranty_period_days?: number | null
          warranty_terms?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_address?: Json | null
          delivery_status?: string
          escrow_transaction_id?: string | null
          id?: string
          listing_id?: string
          payment_method?: string | null
          purchased_at?: string
          quantity?: number
          seller_id?: string
          tracking_number?: string | null
          updated_at?: string
          warranty_expires_at?: string | null
          warranty_period_days?: number | null
          warranty_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_records_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "purchase_records_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_records_escrow_transaction_id_fkey"
            columns: ["escrow_transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_records_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "purchase_records_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_records_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "purchase_records_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pwa_settings: {
        Row: {
          auto_sync_enabled: boolean | null
          cache_size_mb: number | null
          created_at: string | null
          data_usage_mb: number | null
          data_usage_reset_at: string | null
          id: string
          last_sync_at: string | null
          low_data_mode: boolean | null
          max_cache_size_mb: number | null
          offline_cache_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          cache_size_mb?: number | null
          created_at?: string | null
          data_usage_mb?: number | null
          data_usage_reset_at?: string | null
          id?: string
          last_sync_at?: string | null
          low_data_mode?: boolean | null
          max_cache_size_mb?: number | null
          offline_cache_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          cache_size_mb?: number | null
          created_at?: string | null
          data_usage_mb?: number | null
          data_usage_reset_at?: string | null
          id?: string
          last_sync_at?: string | null
          low_data_mode?: boolean | null
          max_cache_size_mb?: number | null
          offline_cache_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pwa_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pwa_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_upvotes: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_upvotes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "product_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "question_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_feedback_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "recommendation_feedback_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          first_purchase_at: string | null
          first_purchase_id: string | null
          id: string
          is_valid: boolean | null
          new_user_reward_amount: number
          new_user_reward_credited: boolean | null
          new_user_reward_credited_at: string | null
          purchase_reward_amount: number
          purchase_reward_credited: boolean | null
          purchase_reward_credited_at: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          signup_reward_amount: number
          signup_reward_credited: boolean | null
          signup_reward_credited_at: string | null
          status: string
          updated_at: string
          validation_notes: string | null
        }
        Insert: {
          created_at?: string
          first_purchase_at?: string | null
          first_purchase_id?: string | null
          id?: string
          is_valid?: boolean | null
          new_user_reward_amount?: number
          new_user_reward_credited?: boolean | null
          new_user_reward_credited_at?: string | null
          purchase_reward_amount?: number
          purchase_reward_credited?: boolean | null
          purchase_reward_credited_at?: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
          signup_reward_amount?: number
          signup_reward_credited?: boolean | null
          signup_reward_credited_at?: string | null
          status?: string
          updated_at?: string
          validation_notes?: string | null
        }
        Update: {
          created_at?: string
          first_purchase_at?: string | null
          first_purchase_id?: string | null
          id?: string
          is_valid?: boolean | null
          new_user_reward_amount?: number
          new_user_reward_credited?: boolean | null
          new_user_reward_credited_at?: string | null
          purchase_reward_amount?: number
          purchase_reward_credited?: boolean | null
          purchase_reward_credited_at?: string | null
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          signup_reward_amount?: number
          signup_reward_credited?: boolean | null
          signup_reward_credited_at?: string | null
          status?: string
          updated_at?: string
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_first_purchase_id_fkey"
            columns: ["first_purchase_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "referrals_first_purchase_id_fkey"
            columns: ["first_purchase_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string | null
          id: string
          listing_id: string | null
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      request_offers: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string | null
          message: string | null
          price: number
          request_id: string
          seller_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          price: number
          request_id: string
          seller_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string | null
          price?: number
          request_id?: string
          seller_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "request_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_product_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "product_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "user_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "request_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          helpfulness_votes: number | null
          id: string
          images: string[] | null
          is_verified_purchase: boolean | null
          listing_id: string | null
          rating: number | null
          reviewed_user_id: string | null
          reviewer_id: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_responded_at: string | null
          vendor_response: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          helpfulness_votes?: number | null
          id?: string
          images?: string[] | null
          is_verified_purchase?: boolean | null
          listing_id?: string | null
          rating?: number | null
          reviewed_user_id?: string | null
          reviewer_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_responded_at?: string | null
          vendor_response?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          helpfulness_votes?: number | null
          id?: string
          images?: string[] | null
          is_verified_purchase?: boolean | null
          listing_id?: string | null
          rating?: number | null
          reviewed_user_id?: string | null
          reviewer_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_responded_at?: string | null
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewed_user_id_fkey"
            columns: ["reviewed_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          disabled_at: string | null
          disabled_reason: string | null
          id: string
          is_active: boolean | null
          is_paused: boolean | null
          last_activity_at: string | null
          last_checked: string | null
          name: string
          new_match_count: number | null
          notification_frequency: string
          query: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_paused?: boolean | null
          last_activity_at?: string | null
          last_checked?: string | null
          name: string
          new_match_count?: number | null
          notification_frequency?: string
          query?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          disabled_at?: string | null
          disabled_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_paused?: boolean | null
          last_activity_at?: string | null
          last_checked?: string | null
          name?: string
          new_match_count?: number | null
          notification_frequency?: string
          query?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          listing_id: string
          listing_snapshot: Json | null
          new_price: number | null
          notification_method: string | null
          previous_price: number | null
          price_drop_percentage: number | null
          read_at: string | null
          saved_search_id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id: string
          listing_snapshot?: Json | null
          new_price?: number | null
          notification_method?: string | null
          previous_price?: number | null
          price_drop_percentage?: number | null
          read_at?: string | null
          saved_search_id: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          listing_id?: string
          listing_snapshot?: Json | null
          new_price?: number | null
          notification_method?: string | null
          previous_price?: number | null
          price_drop_percentage?: number | null
          read_at?: string | null
          saved_search_id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_alerts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "search_alerts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_alerts_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "search_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_analytics: {
        Row: {
          average_order_value: number | null
          average_response_time_minutes: number | null
          click_through_rate: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          geographic_data: Json | null
          id: string
          message_conversion_rate: number | null
          period_type: string
          response_rate: number | null
          top_listings: Json | null
          total_clicks: number | null
          total_impressions: number | null
          total_messages: number | null
          total_revenue: number | null
          total_sales: number | null
          total_views: number | null
          traffic_sources: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_order_value?: number | null
          average_response_time_minutes?: number | null
          click_through_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          geographic_data?: Json | null
          id?: string
          message_conversion_rate?: number | null
          period_type: string
          response_rate?: number | null
          top_listings?: Json | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_messages?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_views?: number | null
          traffic_sources?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_order_value?: number | null
          average_response_time_minutes?: number | null
          click_through_rate?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          geographic_data?: Json | null
          id?: string
          message_conversion_rate?: number | null
          period_type?: string
          response_rate?: number | null
          top_listings?: Json | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_messages?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_views?: number | null
          traffic_sources?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "seller_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_listings: {
        Row: {
          business_profile_id: string
          created_at: string | null
          currency: string | null
          description: string
          duration_text: string | null
          id: string
          image_urls: string[]
          is_active: boolean | null
          is_featured: boolean | null
          price: number | null
          pricing_model: string
          primary_image_url: string
          title: string
          updated_at: string | null
        }
        Insert: {
          business_profile_id: string
          created_at?: string | null
          currency?: string | null
          description: string
          duration_text?: string | null
          id?: string
          image_urls: string[]
          is_active?: boolean | null
          is_featured?: boolean | null
          price?: number | null
          pricing_model: string
          primary_image_url: string
          title: string
          updated_at?: string | null
        }
        Update: {
          business_profile_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          duration_text?: string | null
          id?: string
          image_urls?: string[]
          is_active?: boolean | null
          is_featured?: boolean | null
          price?: number | null
          pricing_model?: string
          primary_image_url?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      share_metrics: {
        Row: {
          clicks_count: number | null
          conversions_count: number | null
          created_at: string
          id: string
          last_viewed_at: string | null
          listing_id: string
          platform: string
          referral_code: string | null
          share_url: string
          shared_at: string
          sharer_id: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          listing_id: string
          platform: string
          referral_code?: string | null
          share_url: string
          shared_at?: string
          sharer_id: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          listing_id?: string
          platform?: string
          referral_code?: string | null
          share_url?: string
          shared_at?: string
          sharer_id?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "share_metrics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "share_metrics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_metrics_sharer_id_fkey"
            columns: ["sharer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "share_metrics_sharer_id_fkey"
            columns: ["sharer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_tracking_events: {
        Row: {
          created_at: string | null
          description: string
          id: string
          location: string | null
          shipment_id: string
          status: string
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          location?: string | null
          shipment_id: string
          status: string
          timestamp?: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          location?: string | null
          shipment_id?: string
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          created_at: string | null
          currency: string | null
          current_location: string | null
          delivery_address: Json
          delivery_person: Json | null
          delivery_rating: number | null
          delivery_review: string | null
          estimated_delivery: string | null
          failure_reason: string | null
          failure_timestamp: string | null
          id: string
          order_id: string
          package_details: Json
          pickup_address: Json
          provider_id: string
          shipping_cost: number
          status: string
          tracking_number: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string | null
          currency?: string | null
          current_location?: string | null
          delivery_address: Json
          delivery_person?: Json | null
          delivery_rating?: number | null
          delivery_review?: string | null
          estimated_delivery?: string | null
          failure_reason?: string | null
          failure_timestamp?: string | null
          id?: string
          order_id: string
          package_details: Json
          pickup_address: Json
          provider_id: string
          shipping_cost: number
          status?: string
          tracking_number: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string | null
          currency?: string | null
          current_location?: string | null
          delivery_address?: Json
          delivery_person?: Json | null
          delivery_rating?: number | null
          delivery_review?: string | null
          estimated_delivery?: string | null
          failure_reason?: string | null
          failure_timestamp?: string | null
          id?: string
          order_id?: string
          package_details?: Json
          pickup_address?: Json
          provider_id?: string
          shipping_cost?: number
          status?: string
          tracking_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "logistics_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_quotes: {
        Row: {
          created_at: string | null
          currency: string | null
          delivery_address: Json
          estimated_delivery_time: string | null
          id: string
          package_details: Json
          pickup_address: Json
          provider_id: string
          quoted_price: number
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          delivery_address: Json
          estimated_delivery_time?: string | null
          id?: string
          package_details: Json
          pickup_address: Json
          provider_id: string
          quoted_price: number
          valid_until: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          delivery_address?: Json
          estimated_delivery_time?: string | null
          id?: string
          package_details?: Json
          pickup_address?: Json
          provider_id?: string
          quoted_price?: number
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "logistics_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_exchanges: {
        Row: {
          accepted_at: string | null
          agreed_hours_provider: number
          agreed_hours_requester: number
          completed_at: string | null
          completed_hours_provider: number | null
          completed_hours_requester: number | null
          created_at: string | null
          description: string | null
          id: string
          proposed_at: string | null
          provider_completed: boolean | null
          provider_id: string
          provider_offer_id: string | null
          provider_rating: number | null
          provider_review: string | null
          provider_skill: string
          requester_completed: boolean | null
          requester_id: string
          requester_offer_id: string | null
          requester_rating: number | null
          requester_review: string | null
          requester_skill: string
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          agreed_hours_provider: number
          agreed_hours_requester: number
          completed_at?: string | null
          completed_hours_provider?: number | null
          completed_hours_requester?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          proposed_at?: string | null
          provider_completed?: boolean | null
          provider_id: string
          provider_offer_id?: string | null
          provider_rating?: number | null
          provider_review?: string | null
          provider_skill: string
          requester_completed?: boolean | null
          requester_id: string
          requester_offer_id?: string | null
          requester_rating?: number | null
          requester_review?: string | null
          requester_skill: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          agreed_hours_provider?: number
          agreed_hours_requester?: number
          completed_at?: string | null
          completed_hours_provider?: number | null
          completed_hours_requester?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          proposed_at?: string | null
          provider_completed?: boolean | null
          provider_id?: string
          provider_offer_id?: string | null
          provider_rating?: number | null
          provider_review?: string | null
          provider_skill?: string
          requester_completed?: boolean | null
          requester_id?: string
          requester_offer_id?: string | null
          requester_rating?: number | null
          requester_review?: string | null
          requester_skill?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_exchanges_provider_offer_id_fkey"
            columns: ["provider_offer_id"]
            isOneToOne: false
            referencedRelation: "skill_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_exchanges_requester_offer_id_fkey"
            columns: ["requester_offer_id"]
            isOneToOne: false
            referencedRelation: "skill_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_offers: {
        Row: {
          availability: Json | null
          category: string
          created_at: string | null
          description: string
          exchange_count: number | null
          exchange_preferences: Json | null
          hourly_rate: number | null
          id: string
          open_to_exchange: boolean | null
          portfolio_items: Json | null
          rating: number | null
          review_count: number | null
          skill_tags: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          availability?: Json | null
          category: string
          created_at?: string | null
          description: string
          exchange_count?: number | null
          exchange_preferences?: Json | null
          hourly_rate?: number | null
          id?: string
          open_to_exchange?: boolean | null
          portfolio_items?: Json | null
          rating?: number | null
          review_count?: number | null
          skill_tags?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          availability?: Json | null
          category?: string
          created_at?: string | null
          description?: string
          exchange_count?: number | null
          exchange_preferences?: Json | null
          hourly_rate?: number | null
          id?: string
          open_to_exchange?: boolean | null
          portfolio_items?: Json | null
          rating?: number | null
          review_count?: number | null
          skill_tags?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          change_amount: number | null
          change_reason: string
          changed_by: string | null
          created_at: string | null
          id: string
          inventory_id: string
          listing_id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          user_id: string
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          change_amount?: number | null
          change_reason: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          inventory_id: string
          listing_id: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          user_id: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          change_amount?: number | null
          change_reason?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          inventory_id?: string
          listing_id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          user_id?: string
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "stock_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stock_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_followers: {
        Row: {
          followed_at: string | null
          follower_user_id: string
          id: string
          storefront_id: string
        }
        Insert: {
          followed_at?: string | null
          follower_user_id: string
          id?: string
          storefront_id: string
        }
        Update: {
          followed_at?: string | null
          follower_user_id?: string
          id?: string
          storefront_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_followers_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "storefront_followers_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storefront_followers_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      storefronts: {
        Row: {
          banner_url: string | null
          bio: string | null
          created_at: string | null
          custom_domain: string | null
          custom_url: string
          display_name: string | null
          featured_listings: string[] | null
          follower_count: number | null
          id: string
          is_active: boolean | null
          theme_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_url: string
          display_name?: string | null
          featured_listings?: string[] | null
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          theme_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_url?: string
          display_name?: string | null
          featured_listings?: string[] | null
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          theme_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefronts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "storefronts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          thumbnail_url: string | null
          user_id: string | null
          video_url: string
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          thumbnail_url?: string | null
          user_id?: string | null
          video_url: string
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          thumbnail_url?: string | null
          user_id?: string | null
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          boosts_reset_at: string | null
          cancel_at_period_end: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          features: Json
          free_boosts_per_month: number
          free_boosts_remaining: number
          id: string
          last_billing_date: string | null
          next_billing_date: string | null
          paystack_customer_code: string | null
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          plan: string
          price: number
          status: string
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          boosts_reset_at?: string | null
          cancel_at_period_end?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          features?: Json
          free_boosts_per_month?: number
          free_boosts_remaining?: number
          id?: string
          last_billing_date?: string | null
          next_billing_date?: string | null
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan?: string
          price?: number
          status?: string
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          boosts_reset_at?: string | null
          cancel_at_period_end?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          features?: Json
          free_boosts_per_month?: number
          free_boosts_remaining?: number
          id?: string
          last_billing_date?: string | null
          next_billing_date?: string | null
          paystack_customer_code?: string | null
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan?: string
          price?: number
          status?: string
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_sounds: {
        Row: {
          artist: string | null
          audio_url: string
          category: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          tags: string[] | null
          title: string
          trending_score: number | null
          updated_at: string | null
          uploaded_by: string | null
          usage_count: number | null
        }
        Insert: {
          artist?: string | null
          audio_url: string
          category?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title: string
          trending_score?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          usage_count?: number | null
        }
        Update: {
          artist?: string | null
          audio_url?: string
          category?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title?: string
          trending_score?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          display_order: number | null
          earned_at: string
          id: string
          is_displayed: boolean | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          display_order?: number | null
          earned_at?: string
          id?: string
          is_displayed?: boolean | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          display_order?: number | null
          earned_at?: string
          id?: string
          is_displayed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behaviors: {
        Row: {
          category_preferences: Json | null
          created_at: string | null
          id: string
          location_preferences: Json | null
          price_range_max: number | null
          price_range_min: number | null
          purchased_listings: Json | null
          saved_listings: Json | null
          search_queries: Json | null
          updated_at: string | null
          user_id: string
          viewed_listings: Json | null
        }
        Insert: {
          category_preferences?: Json | null
          created_at?: string | null
          id?: string
          location_preferences?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          purchased_listings?: Json | null
          saved_listings?: Json | null
          search_queries?: Json | null
          updated_at?: string | null
          user_id: string
          viewed_listings?: Json | null
        }
        Update: {
          category_preferences?: Json | null
          created_at?: string | null
          id?: string
          location_preferences?: Json | null
          price_range_max?: number | null
          price_range_min?: number | null
          purchased_listings?: Json | null
          saved_listings?: Json | null
          search_queries?: Json | null
          updated_at?: string | null
          user_id?: string
          viewed_listings?: Json | null
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string | null
          listing_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          listing_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          listing_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "user_interactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          created_at: string
          current_points: number | null
          current_streak_days: number | null
          free_boosts_remaining: number | null
          id: string
          items_purchased: number | null
          items_sold: number | null
          last_activity_date: string | null
          level: number | null
          listings_posted: number | null
          longest_streak_days: number | null
          points_to_next_level: number | null
          referrals_made: number | null
          reviews_given: number | null
          total_points: number | null
          unlocked_perks: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_points?: number | null
          current_streak_days?: number | null
          free_boosts_remaining?: number | null
          id?: string
          items_purchased?: number | null
          items_sold?: number | null
          last_activity_date?: string | null
          level?: number | null
          listings_posted?: number | null
          longest_streak_days?: number | null
          points_to_next_level?: number | null
          referrals_made?: number | null
          reviews_given?: number | null
          total_points?: number | null
          unlocked_perks?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_points?: number | null
          current_streak_days?: number | null
          free_boosts_remaining?: number | null
          id?: string
          items_purchased?: number | null
          items_sold?: number | null
          last_activity_date?: string | null
          level?: number | null
          listings_posted?: number | null
          longest_streak_days?: number | null
          points_to_next_level?: number | null
          referrals_made?: number | null
          reviews_given?: number | null
          total_points?: number | null
          unlocked_perks?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_levels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_levels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_likes: {
        Row: {
          created_at: string | null
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_likes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "user_likes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saves: {
        Row: {
          created_at: string | null
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saves_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "user_saves_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          cv_url: string | null
          email: string
          id: string
          is_job_seeker: boolean | null
          is_premium: boolean | null
          is_service_provider: boolean | null
          is_suspended: boolean | null
          nin_verified: boolean | null
          personalized_recommendations_enabled: boolean | null
          phone: string | null
          phone_verified: boolean | null
          premium_expires_at: string | null
          skills: string[] | null
          trust_score: number | null
          updated_at: string | null
          username: string
          video_verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          cv_url?: string | null
          email: string
          id?: string
          is_job_seeker?: boolean | null
          is_premium?: boolean | null
          is_service_provider?: boolean | null
          is_suspended?: boolean | null
          nin_verified?: boolean | null
          personalized_recommendations_enabled?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          premium_expires_at?: string | null
          skills?: string[] | null
          trust_score?: number | null
          updated_at?: string | null
          username: string
          video_verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string
          id?: string
          is_job_seeker?: boolean | null
          is_premium?: boolean | null
          is_service_provider?: boolean | null
          is_suspended?: boolean | null
          nin_verified?: boolean | null
          personalized_recommendations_enabled?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          premium_expires_at?: string | null
          skills?: string[] | null
          trust_score?: number | null
          updated_at?: string | null
          username?: string
          video_verified?: boolean | null
        }
        Relationships: []
      }
      verification_badges: {
        Row: {
          average_rating: number | null
          awarded_at: string | null
          created_at: string
          id: string
          last_checked_at: string | null
          nin_verified: boolean
          phone_verified: boolean
          revoked_at: string | null
          tier: string
          transaction_count: number
          updated_at: string
          user_id: string
          video_verified: boolean
        }
        Insert: {
          average_rating?: number | null
          awarded_at?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          nin_verified?: boolean
          phone_verified?: boolean
          revoked_at?: string | null
          tier?: string
          transaction_count?: number
          updated_at?: string
          user_id: string
          video_verified?: boolean
        }
        Update: {
          average_rating?: number | null
          awarded_at?: string | null
          created_at?: string
          id?: string
          last_checked_at?: string | null
          nin_verified?: boolean
          phone_verified?: boolean
          revoked_at?: string | null
          tier?: string
          transaction_count?: number
          updated_at?: string
          user_id?: string
          video_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "verification_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "verification_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_listing_sounds: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          sound_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          sound_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          sound_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_listing_sounds_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "video_listing_sounds_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_listing_sounds_sound_id_fkey"
            columns: ["sound_id"]
            isOneToOne: false
            referencedRelation: "trending_sounds"
            referencedColumns: ["id"]
          },
        ]
      }
      video_listings: {
        Row: {
          created_at: string | null
          duration_seconds: number
          id: string
          likes_count: number | null
          listing_id: string
          thumbnail_url: string
          updated_at: string | null
          video_url: string
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          id?: string
          likes_count?: number | null
          listing_id: string
          thumbnail_url: string
          updated_at?: string | null
          video_url: string
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          id?: string
          likes_count?: number | null
          listing_id?: string
          thumbnail_url?: string
          updated_at?: string | null
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "video_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          category: string | null
          created_at: string
          description: string
          fee: number
          id: string
          metadata: Json | null
          reference: string | null
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          category?: string | null
          created_at?: string
          description: string
          fee?: number
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          category?: string | null
          created_at?: string
          description?: string
          fee?: number
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_balance: number
          created_at: string
          currency: string
          id: string
          pending_balance: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          currency?: string
          id?: string
          pending_balance?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          amount: number
          bank_code: string
          created_at: string
          failure_reason: string | null
          fee: number
          id: string
          net_amount: number
          paystack_reference: string | null
          paystack_transfer_code: string | null
          processed_at: string | null
          requires_verification: boolean | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          wallet_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          amount: number
          bank_code: string
          created_at?: string
          failure_reason?: string | null
          fee?: number
          id?: string
          net_amount: number
          paystack_reference?: string | null
          paystack_transfer_code?: string | null
          processed_at?: string | null
          requires_verification?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          amount?: number
          bank_code?: string
          created_at?: string
          failure_reason?: string | null
          fee?: number
          id?: string
          net_amount?: number
          paystack_reference?: string | null
          paystack_transfer_code?: string | null
          processed_at?: string | null
          requires_verification?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "withdrawals_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_barter_proposals: {
        Row: {
          cash_adjustment: number | null
          cash_adjustment_payer: string | null
          created_at: string | null
          days_until_expiry: number | null
          expires_at: string | null
          id: string | null
          message: string | null
          offered_listing_id: string | null
          offered_listing_price: number | null
          offered_listing_title: string | null
          proposer_id: string | null
          proposer_username: string | null
          receiver_id: string | null
          receiver_username: string | null
          status: string | null
          target_listing_id: string | null
          target_listing_price: number | null
          target_listing_title: string | null
          value_difference: number | null
        }
        Relationships: [
          {
            foreignKeyName: "barter_proposals_offered_listing_id_fkey"
            columns: ["offered_listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "barter_proposals_offered_listing_id_fkey"
            columns: ["offered_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "barter_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "barter_proposals_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barter_proposals_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "barter_proposals_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      active_boosts: {
        Row: {
          expires_at: string | null
          hours_remaining: number | null
          id: string | null
          impressions_gained: number | null
          listing_id: string | null
          listing_title: string | null
          messages_received: number | null
          package_type: string | null
          price: number | null
          seller_username: string | null
          started_at: string | null
          user_id: string | null
          views_gained: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boosts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "boosts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      active_product_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          fulfilled_at: string | null
          id: string | null
          offers_count: number | null
          preferred_location: string | null
          requester_avatar: string | null
          requester_trust_score: number | null
          requester_username: string | null
          status: string | null
          time_remaining: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_available_listings: {
        Row: {
          accept_partial_exchange: boolean | null
          category_id: string | null
          exchange_notes: string | null
          listing_id: string | null
          max_value: number | null
          min_value: number | null
          preference_created_at: string | null
          preferred_categories: string[] | null
          price: number | null
          title: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_listings_queue: {
        Row: {
          category_id: string | null
          confidence_score: number | null
          flagged_at: string | null
          listing_id: string | null
          listing_price: number | null
          listing_title: string | null
          moderation_id: string | null
          seller_email: string | null
          seller_username: string | null
          user_id: string | null
          violations: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_results_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "moderation_results_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      high_risk_users: {
        Row: {
          email: string | null
          factors: Json | null
          fraud_score: number | null
          fraud_score_id: string | null
          is_suspended: boolean | null
          last_calculated_at: string | null
          metrics: Json | null
          phone: string | null
          risk_level: string | null
          user_created_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fraud_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_stats: {
        Row: {
          completed_referrals: number | null
          purchase_rewards_paid: number | null
          referrer_id: string | null
          referrer_username: string | null
          signup_rewards_paid: number | null
          total_purchase_rewards: number | null
          total_referrals: number | null
          total_rewards_earned: number | null
          total_signup_rewards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      request_offers_with_details: {
        Row: {
          created_at: string | null
          id: string | null
          listing_condition: string | null
          listing_id: string | null
          listing_lga: string | null
          listing_state: string | null
          listing_thumbnail: string | null
          listing_title: string | null
          message: string | null
          price: number | null
          request_id: string | null
          request_status: string | null
          request_title: string | null
          requester_id: string | null
          seller_avatar: string | null
          seller_id: string | null
          seller_nin_verified: boolean | null
          seller_phone_verified: boolean | null
          seller_trust_score: number | null
          seller_username: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "exchange_available_listings"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "request_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_product_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "product_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "user_requests_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "request_offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_summary: {
        Row: {
          cancel_at_period_end: boolean | null
          current_period_end: string | null
          days_until_renewal: number | null
          email: string | null
          free_boosts_per_month: number | null
          free_boosts_remaining: number | null
          is_trial_active: boolean | null
          plan: string | null
          status: string | null
          trial_end: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_barter_stats: {
        Row: {
          exchanges_completed: number | null
          listings_open_to_exchange: number | null
          proposals_accepted: number | null
          proposals_accepted_by_me: number | null
          proposals_received: number | null
          proposals_sent: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      user_requests_summary: {
        Row: {
          accepted_offers: number | null
          avg_offer_price: number | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          fulfilled_at: string | null
          id: string | null
          max_offer_price: number | null
          min_offer_price: number | null
          offers_count: number | null
          pending_offers: number | null
          preferred_location: string | null
          status: string | null
          time_remaining: string | null
          title: string | null
          total_offers: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_barter_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "product_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_barter_proposal: {
        Args: { p_proposal_id: string; p_user_id: string }
        Returns: boolean
      }
      accept_battle_offer: {
        Args: { p_battle_id: string; p_user_id: string }
        Returns: {
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          current_offer: number
          current_round: number | null
          expires_at: string | null
          final_price: number | null
          id: string
          last_offer_by: string | null
          listing_id: string
          max_rounds: number | null
          original_price: number
          round_duration_minutes: number | null
          round_expires_at: string | null
          round_started_at: string | null
          seller_id: string
          status: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "price_drop_battles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_pricing_suggestion: {
        Args: { p_suggestion_id: string; p_user_id: string }
        Returns: boolean
      }
      accept_skill_exchange: {
        Args: { p_exchange_id: string; p_user_id: string }
        Returns: boolean
      }
      add_shipment_tracking_event: {
        Args: {
          p_description: string
          p_location: string
          p_shipment_id: string
          p_status: string
          p_timestamp?: string
        }
        Returns: string
      }
      add_user_points: {
        Args: {
          p_activity_type: string
          p_description?: string
          p_points: number
          p_reference_id?: string
          p_user_id: string
        }
        Returns: {
          leveled_up: boolean
          new_level: number
        }[]
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      auto_disable_inactive_searches: { Args: never; Returns: undefined }
      calculate_category_popularity: {
        Args: never
        Returns: {
          category_id: string
          popularity_score: number
          total_listings: number
          total_views: number
        }[]
      }
      calculate_escrow_fee: { Args: { amount: number }; Returns: number }
      calculate_points_to_next_level: {
        Args: { current_level: number }
        Returns: number
      }
      calculate_risk_level: { Args: { score: number }; Returns: string }
      calculate_seller_stats: {
        Args: { seller_user_id: string }
        Returns: {
          average_rating: number
          transaction_count: number
        }[]
      }
      calculate_user_engagement_scores: {
        Args: never
        Returns: {
          engagement_score: number
          interaction_count: number
          user_id: string
        }[]
      }
      calculate_value_difference: {
        Args: { p_offered_value: number; p_target_value: number }
        Returns: number
      }
      calculate_withdrawal_fee: { Args: { amount: number }; Returns: number }
      can_create_saved_search: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_expired_cached_listings: { Args: never; Returns: number }
      cleanup_expired_offline_actions: { Args: never; Returns: number }
      cleanup_old_behavior_data: {
        Args: { p_cutoff_date: string }
        Returns: number
      }
      cleanup_old_performance_metrics: { Args: never; Returns: undefined }
      cleanup_old_session_comparisons: { Args: never; Returns: number }
      complete_skill_exchange: {
        Args: { p_exchange_id: string; p_user_id: string }
        Returns: boolean
      }
      create_barter_proposal: {
        Args: {
          p_cash_adjustment?: number
          p_message?: string
          p_offered_listing_id: string
          p_proposer_id: string
          p_target_listing_id: string
        }
        Returns: string
      }
      credit_new_user_reward: {
        Args: { p_referral_id: string }
        Returns: undefined
      }
      credit_purchase_reward: {
        Args: { p_purchase_id: string; p_referral_id: string }
        Returns: undefined
      }
      credit_signup_reward: {
        Args: { p_referral_id: string }
        Returns: undefined
      }
      decrement_viewer_count: {
        Args: { session_id_param: string }
        Returns: undefined
      }
      determine_moderation_action: {
        Args: { confidence: number; has_violations: boolean }
        Returns: string
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      earth: { Args: never; Returns: number }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      expire_barter_proposals: { Args: never; Returns: undefined }
      expire_old_battles: { Args: never; Returns: number }
      expire_old_requests: { Args: never; Returns: undefined }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_active_live_sessions: {
        Args: never
        Returns: {
          description: string
          id: string
          seller_avatar_url: string
          seller_trust_score: number
          seller_username: string
          started_at: string
          thumbnail_url: string
          title: string
          user_id: string
          viewer_count: number
        }[]
      }
      get_boosted_listing_ids: {
        Args: { p_category_id?: string; p_limit?: number }
        Returns: {
          boost_started_at: string
          listing_id: string
        }[]
      }
      get_matching_skill_offers: {
        Args: { p_desired_skills: string[]; p_user_id: string }
        Returns: {
          category: string
          exchange_count: number
          id: string
          match_score: number
          rating: number
          skill_tags: string[]
          title: string
        }[]
      }
      get_pending_offline_actions: {
        Args: { p_user_id: string }
        Returns: {
          action_data: Json
          action_type: string
          created_at: string
          id: string
          priority: number
        }[]
      }
      get_performance_summary: {
        Args: { p_metric_name?: string; p_period_days?: number }
        Returns: {
          avg_value: number
          good_count: number
          good_percentage: number
          metric_name: string
          needs_improvement_count: number
          needs_improvement_percentage: number
          p50_value: number
          p75_value: number
          p95_value: number
          p99_value: number
          poor_count: number
          poor_percentage: number
          total_count: number
        }[]
      }
      get_pricing_suggestion: {
        Args: { p_listing_id: string }
        Returns: {
          avg_selling_time_days: number
          confidence_score: number
          id: string
          market_average: number
          max_price: number
          min_price: number
          price_history: Json
          seasonal_adjustment: number
          similar_items_count: number
          suggested_price: number
        }[]
      }
      get_recommendation_feedback_stats: {
        Args: { p_listing_id: string }
        Returns: {
          thumbs_down: number
          thumbs_up: number
          total_feedback: number
        }[]
      }
      get_request_statistics: {
        Args: { p_request_id: string }
        Returns: {
          accepted_offers: number
          avg_offer_price: number
          max_offer_price: number
          min_offer_price: number
          pending_offers: number
          rejected_offers: number
          total_offers: number
        }[]
      }
      get_seller_answer_rate: {
        Args: { seller_user_id: string }
        Returns: number
      }
      get_shipment_tracking_history: {
        Args: { p_shipment_id: string }
        Returns: {
          description: string
          event_id: string
          event_timestamp: string
          location: string
          status: string
        }[]
      }
      get_trending_listings: {
        Args: { days_back?: number; limit_count?: number }
        Returns: {
          id: string
          lga: string
          likes_count: number
          price: number
          state: string
          thumbnail_url: string
          title: string
          trending_score: number
          views_count: number
        }[]
      }
      get_trending_sounds: {
        Args: { p_category?: string; p_limit?: number }
        Returns: {
          artist: string
          audio_url: string
          category: string
          created_at: string
          duration_seconds: number
          id: string
          tags: string[]
          title: string
          trending_score: number
          usage_count: number
        }[]
      }
      get_user_active_requests_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_battle_history: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          battle_id: string
          completed_at: string
          created_at: string
          final_price: number
          listing_id: string
          listing_title: string
          original_price: number
          other_user_id: string
          role: string
          rounds: number
          status: string
        }[]
      }
      get_user_cache_usage: {
        Args: { p_user_id: string }
        Returns: {
          newest_cache_date: string
          oldest_cache_date: string
          total_cache_size_mb: number
          total_cached_listings: number
        }[]
      }
      get_user_saved_search_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      gettransactionid: { Args: never; Returns: unknown }
      increment_boost_metric: {
        Args: { boost_id: string; metric_field: string }
        Returns: undefined
      }
      increment_search_match_count: {
        Args: { search_id: string }
        Returns: undefined
      }
      increment_video_views: { Args: { video_id: string }; Returns: undefined }
      increment_viewer_count: {
        Args: { session_id_param: string }
        Returns: undefined
      }
      initialize_user_behavior: { Args: { p_user_id: string }; Returns: string }
      is_listing_boosted: { Args: { p_listing_id: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      make_counter_offer: {
        Args: {
          p_battle_id: string
          p_message?: string
          p_offer_amount: number
          p_user_id: string
        }
        Returns: {
          battle_id: string
          created_at: string | null
          id: string
          message: string | null
          offer_amount: number
          offered_by: string
          responded_at: string | null
          round_number: number
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "battle_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_action_failed: {
        Args: {
          p_action_id: string
          p_error_code?: string
          p_error_message: string
        }
        Returns: boolean
      }
      mark_action_synced: { Args: { p_action_id: string }; Returns: boolean }
      mark_alert_read: { Args: { alert_id: string }; Returns: undefined }
      mark_request_fulfilled: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      match_listings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          lga: string
          price: number
          similarity: number
          state: string
          thumbnail_url: string
          title: string
        }[]
      }
      pin_product_to_session: {
        Args: { listing_id_param: string; session_id_param: string }
        Returns: Json
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      recommend_listings: {
        Args: {
          match_count?: number
          user_embedding: string
          user_id_param: string
        }
        Returns: {
          id: string
          price: number
          similarity: number
          thumbnail_url: string
          title: string
        }[]
      }
      reject_barter_proposal: {
        Args: { p_proposal_id: string; p_user_id: string }
        Returns: boolean
      }
      reject_battle: {
        Args: { p_battle_id: string; p_user_id: string }
        Returns: {
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          current_offer: number
          current_round: number | null
          expires_at: string | null
          final_price: number | null
          id: string
          last_offer_by: string | null
          listing_id: string
          max_rounds: number | null
          original_price: number
          round_duration_minutes: number | null
          round_expires_at: string | null
          round_started_at: string | null
          seller_id: string
          status: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "price_drop_battles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_data_usage: { Args: { p_user_id: string }; Returns: boolean }
      reset_monthly_boosts: { Args: never; Returns: undefined }
      reset_search_match_count: {
        Args: { search_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      start_price_drop_battle: {
        Args: {
          p_buyer_id: string
          p_initial_offer: number
          p_listing_id: string
        }
        Returns: string
      }
      start_skill_exchange: {
        Args: { p_exchange_id: string; p_user_id: string }
        Returns: boolean
      }
      track_listing_view: {
        Args: { p_duration?: number; p_listing_id: string; p_user_id: string }
        Returns: undefined
      }
      track_search_query: {
        Args: { p_query: string; p_results_count?: number; p_user_id: string }
        Returns: undefined
      }
      unlockrows: { Args: { "": string }; Returns: number }
      unpin_product_from_session: {
        Args: { listing_id_param: string; session_id_param: string }
        Returns: Json
      }
      update_category_preference: {
        Args: { p_category_id: string; p_user_id: string }
        Returns: undefined
      }
      update_data_usage: {
        Args: { p_data_mb: number; p_user_id: string }
        Returns: boolean
      }
      update_trending_score: { Args: never; Returns: undefined }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

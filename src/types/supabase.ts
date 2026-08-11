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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_import_logs: {
        Row: {
          created_at: string
          created_by: string
          created_order_id: string | null
          id: string
          parsed_data: Json
          raw_text: string
          status: string
          validation_errors: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          created_order_id?: string | null
          id?: string
          parsed_data?: Json
          raw_text: string
          status?: string
          validation_errors?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          created_order_id?: string | null
          id?: string
          parsed_data?: Json
          raw_text?: string
          status?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_import_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_import_logs_created_order_id_fkey"
            columns: ["created_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          customer_id: string | null
          event_name: string
          id: string
          metadata: Json
          occurred_at: string
          order_id: string | null
          page_path: string | null
          product_id: string | null
          region: string | null
          search_query: string | null
          session_id: string | null
          source: string | null
        }
        Insert: {
          customer_id?: string | null
          event_name: string
          id?: string
          metadata?: Json
          occurred_at?: string
          order_id?: string | null
          page_path?: string | null
          product_id?: string | null
          region?: string | null
          search_query?: string | null
          session_id?: string | null
          source?: string | null
        }
        Update: {
          customer_id?: string | null
          event_name?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          order_id?: string | null
          page_path?: string | null
          product_id?: string | null
          region?: string | null
          search_query?: string | null
          session_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          metadata: Json
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_kg: string | null
          description_ru: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name_en: string | null
          name_kg: string | null
          name_ru: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_kg?: string | null
          description_ru?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string | null
          name_kg?: string | null
          name_ru: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_kg?: string | null
          description_ru?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name_en?: string | null
          name_kg?: string | null
          name_ru?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
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
      customer_assignment_history: {
        Row: {
          changed_by: string | null
          created_at: string
          customer_id: string
          id: string
          new_manager_id: string | null
          old_manager_id: string | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          customer_id: string
          id?: string
          new_manager_id?: string | null
          old_manager_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          new_manager_id?: string | null
          old_manager_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_assignment_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assignment_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assignment_history_new_manager_id_fkey"
            columns: ["new_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_assignment_history_old_manager_id_fkey"
            columns: ["old_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          last_purchase_at: string | null
          manager_id: string | null
          notes: string | null
          phone: string
          phone_normalized: string
          region: string | null
          source: string
          tags: string[]
          total_orders: number
          total_spent_tyiyn: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          last_purchase_at?: string | null
          manager_id?: string | null
          notes?: string | null
          phone: string
          phone_normalized: string
          region?: string | null
          source?: string
          tags?: string[]
          total_orders?: number
          total_spent_tyiyn?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          last_purchase_at?: string | null
          manager_id?: string | null
          notes?: string | null
          phone?: string
          phone_normalized?: string
          region?: string | null
          source?: string
          tags?: string[]
          total_orders?: number
          total_spent_tyiyn?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          condition: string | null
          created_at: string
          created_by: string | null
          defect_number: number
          id: string
          photo_paths: string[]
          product_id: string
          quantity: number
          reason: string
          resolution: string | null
          return_id: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          created_by?: string | null
          defect_number?: never
          id?: string
          photo_paths?: string[]
          product_id: string
          quantity: number
          reason: string
          resolution?: string | null
          return_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          created_by?: string | null
          defect_number?: never
          id?: string
          photo_paths?: string[]
          product_id?: string
          quantity?: number
          reason?: string
          resolution?: string | null
          return_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "defects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_tyiyn: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          expense_number: number
          id: string
          payment_method: string
          receipt_path: string | null
          recipient: string | null
          updated_at: string
        }
        Insert: {
          amount_tyiyn: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          expense_number?: never
          id?: string
          payment_method?: string
          receipt_path?: string | null
          recipient?: string | null
          updated_at?: string
        }
        Update: {
          amount_tyiyn?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_number?: never
          id?: string
          payment_method?: string
          receipt_path?: string | null
          recipient?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer_en: string | null
          answer_kg: string | null
          answer_ru: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          question_en: string | null
          question_kg: string | null
          question_ru: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer_en?: string | null
          answer_kg?: string | null
          answer_ru: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          question_en?: string | null
          question_kg?: string | null
          question_ru: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer_en?: string | null
          answer_kg?: string | null
          answer_ru?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          question_en?: string | null
          question_kg?: string | null
          question_ru?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount_tyiyn: number
          created_at: string
          created_by: string | null
          description: string | null
          direction: string
          id: string
          occurred_at: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          amount_tyiyn: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction: string
          id?: string
          occurred_at?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          amount_tyiyn?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction?: string
          id?: string
          occurred_at?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          created_at: string
          created_by: string | null
          down_payment_tyiyn: number
          id: string
          months: number
          order_id: string
          start_date: string
          status: string
          total_tyiyn: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          down_payment_tyiyn?: number
          id?: string
          months: number
          order_id: string
          start_date?: string
          status?: string
          total_tyiyn: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          down_payment_tyiyn?: number
          id?: string
          months?: number
          order_id?: string
          start_date?: string
          status?: string
          total_tyiyn?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installment_plans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_schedule: {
        Row: {
          amount_tyiyn: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          installment_plan_id: string
          paid_at: string | null
          paid_tyiyn: number
          status: string
        }
        Insert: {
          amount_tyiyn: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          installment_plan_id: string
          paid_at?: string | null
          paid_tyiyn?: number
          status?: string
        }
        Update: {
          amount_tyiyn?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          installment_plan_id?: string
          paid_at?: string | null
          paid_tyiyn?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_schedule_installment_plan_id_fkey"
            columns: ["installment_plan_id"]
            isOneToOne: false
            referencedRelation: "installment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          note: string | null
          product_id: string
          quantity_delta: number
          reference_id: string | null
          reference_type: string | null
          supplier_id: string | null
        }
        Insert: {
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          note?: string | null
          product_id: string
          quantity_delta: number
          reference_id?: string | null
          reference_type?: string | null
          supplier_id?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          note?: string | null
          product_id?: string
          quantity_delta?: number
          reference_id?: string | null
          reference_type?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_manager_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          lead_number: number
          loss_reason: string | null
          message: string | null
          next_contact_at: string | null
          product_interest: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_manager_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          lead_number?: never
          loss_reason?: string | null
          message?: string | null
          next_contact_at?: string | null
          product_interest?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_manager_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          lead_number?: never
          loss_reason?: string | null
          message?: string | null
          next_contact_at?: string | null
          product_interest?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_commissions: {
        Row: {
          accrued_at: string
          adjusted_tyiyn: number
          amount_tyiyn: number
          id: string
          manager_id: string
          order_id: string
          paid_tyiyn: number
          status: string
          updated_at: string
        }
        Insert: {
          accrued_at?: string
          adjusted_tyiyn?: number
          amount_tyiyn: number
          id?: string
          manager_id: string
          order_id: string
          paid_tyiyn?: number
          status?: string
          updated_at?: string
        }
        Update: {
          accrued_at?: string
          adjusted_tyiyn?: number
          amount_tyiyn?: number
          id?: string
          manager_id?: string
          order_id?: string
          paid_tyiyn?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_commissions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_payouts: {
        Row: {
          allocation: Json
          amount_tyiyn: number
          created_at: string
          created_by: string | null
          id: string
          manager_id: string
          note: string | null
          paid_at: string
          payment_method: string
          payout_number: number
        }
        Insert: {
          allocation?: Json
          amount_tyiyn: number
          created_at?: string
          created_by?: string | null
          id?: string
          manager_id: string
          note?: string | null
          paid_at?: string
          payment_method?: string
          payout_number?: never
        }
        Update: {
          allocation?: Json
          amount_tyiyn?: number
          created_at?: string
          created_by?: string | null
          id?: string
          manager_id?: string
          note?: string | null
          paid_at?: string
          payment_method?: string
          payout_number?: never
        }
        Relationships: [
          {
            foreignKeyName: "manager_payouts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_payouts_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_profiles: {
        Row: {
          accepts_leads: boolean
          created_at: string
          default_commission_type: string
          default_commission_value: number
          employee_code: string | null
          hired_at: string | null
          last_assigned_at: string | null
          leads_assigned: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepts_leads?: boolean
          created_at?: string
          default_commission_type?: string
          default_commission_value?: number
          employee_code?: string | null
          hired_at?: string | null
          last_assigned_at?: string | null
          leads_assigned?: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepts_leads?: boolean
          created_at?: string
          default_commission_type?: string
          default_commission_value?: number
          employee_code?: string | null
          hired_at?: string | null
          last_assigned_at?: string | null
          leads_assigned?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_financials: {
        Row: {
          created_at: string
          manager_commission_tyiyn: number
          order_item_id: string
          supplier_id: string | null
          total_cost_tyiyn: number
          unit_cost_tyiyn: number
        }
        Insert: {
          created_at?: string
          manager_commission_tyiyn?: number
          order_item_id: string
          supplier_id?: string | null
          total_cost_tyiyn: number
          unit_cost_tyiyn: number
        }
        Update: {
          created_at?: string
          manager_commission_tyiyn?: number
          order_item_id?: string
          supplier_id?: string | null
          total_cost_tyiyn?: number
          unit_cost_tyiyn?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_financials_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_financials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount_tyiyn: number
          id: string
          line_total_tyiyn: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          unit_price_tyiyn: number
        }
        Insert: {
          created_at?: string
          discount_tyiyn?: number
          id?: string
          line_total_tyiyn: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          unit_price_tyiyn: number
        }
        Update: {
          created_at?: string
          discount_tyiyn?: number
          id?: string
          line_total_tyiyn?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price_tyiyn?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          comment: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_manager_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_comment: string | null
          customer_id: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_region: string | null
          delivery_tyiyn: number
          discount_tyiyn: number
          financial_processed: boolean
          id: string
          internal_comment: string | null
          lead_id: string | null
          order_number: number
          paid_tyiyn: number
          payment_method: string | null
          payment_status: string
          public_request_id: string | null
          refunded_tyiyn: number
          request_metadata: Json
          requested_installment_months: number | null
          requested_purchase_method: string
          sale_channel: string
          source: string
          status: string
          subtotal_tyiyn: number
          total_tyiyn: number
          updated_at: string
        }
        Insert: {
          assigned_manager_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_comment?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_region?: string | null
          delivery_tyiyn?: number
          discount_tyiyn?: number
          financial_processed?: boolean
          id?: string
          internal_comment?: string | null
          lead_id?: string | null
          order_number?: never
          paid_tyiyn?: number
          payment_method?: string | null
          payment_status?: string
          public_request_id?: string | null
          refunded_tyiyn?: number
          request_metadata?: Json
          requested_installment_months?: number | null
          requested_purchase_method?: string
          sale_channel?: string
          source?: string
          status?: string
          subtotal_tyiyn?: number
          total_tyiyn?: number
          updated_at?: string
        }
        Update: {
          assigned_manager_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_comment?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_region?: string | null
          delivery_tyiyn?: number
          discount_tyiyn?: number
          financial_processed?: boolean
          id?: string
          internal_comment?: string | null
          lead_id?: string | null
          order_number?: never
          paid_tyiyn?: number
          payment_method?: string | null
          payment_status?: string
          public_request_id?: string | null
          refunded_tyiyn?: number
          request_metadata?: Json
          requested_installment_months?: number | null
          requested_purchase_method?: string
          sale_channel?: string
          source?: string
          status?: string
          subtotal_tyiyn?: number
          total_tyiyn?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_tyiyn: number
          created_at: string
          created_by: string | null
          id: string
          installment_schedule_id: string | null
          note: string | null
          order_id: string
          paid_at: string
          payment_method: string
          status: string
        }
        Insert: {
          amount_tyiyn: number
          created_at?: string
          created_by?: string | null
          id?: string
          installment_schedule_id?: string | null
          note?: string | null
          order_id: string
          paid_at?: string
          payment_method: string
          status?: string
        }
        Update: {
          amount_tyiyn?: number
          created_at?: string
          created_by?: string | null
          id?: string
          installment_schedule_id?: string | null
          note?: string | null
          order_id?: string
          paid_at?: string
          payment_method?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_installment_schedule_id_fkey"
            columns: ["installment_schedule_id"]
            isOneToOne: false
            referencedRelation: "installment_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_en: string | null
          alt_kg: string | null
          alt_ru: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          public_url: string | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_en?: string | null
          alt_kg?: string | null
          alt_ru?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          public_url?: string | null
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_en?: string | null
          alt_kg?: string | null
          alt_ru?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          public_url?: string | null
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string
          created_at: string
          created_by: string | null
          description_en: string | null
          description_kg: string | null
          description_ru: string | null
          id: string
          installment_allowed: boolean
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          manager_commission_type: string
          manager_commission_value: number
          minimum_stock: number
          model: string | null
          name_en: string | null
          name_kg: string | null
          name_ru: string
          old_price_tyiyn: number | null
          reserved_quantity: number
          sale_price_tyiyn: number
          short_description_en: string | null
          short_description_kg: string | null
          short_description_ru: string | null
          sku: string
          slug: string
          sort_order: number
          specifications: Json
          status: string
          stock_quantity: number
          updated_at: string
          warranty_months: number
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_kg?: string | null
          description_ru?: string | null
          id?: string
          installment_allowed?: boolean
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          manager_commission_type?: string
          manager_commission_value?: number
          minimum_stock?: number
          model?: string | null
          name_en?: string | null
          name_kg?: string | null
          name_ru: string
          old_price_tyiyn?: number | null
          reserved_quantity?: number
          sale_price_tyiyn: number
          short_description_en?: string | null
          short_description_kg?: string | null
          short_description_ru?: string | null
          sku: string
          slug: string
          sort_order?: number
          specifications?: Json
          status?: string
          stock_quantity?: number
          updated_at?: string
          warranty_months?: number
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_kg?: string | null
          description_ru?: string | null
          id?: string
          installment_allowed?: boolean
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          manager_commission_type?: string
          manager_commission_value?: number
          minimum_stock?: number
          model?: string | null
          name_en?: string | null
          name_kg?: string | null
          name_ru?: string
          old_price_tyiyn?: number | null
          reserved_quantity?: number
          sale_price_tyiyn?: number
          short_description_en?: string | null
          short_description_kg?: string | null
          short_description_ru?: string | null
          sku?: string
          slug?: string
          sort_order?: number
          specifications?: Json
          status?: string
          stock_quantity?: number
          updated_at?: string
          warranty_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          can_view_all_customers: boolean
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          locale: string
          phone: string | null
          role: string
          settings: Json
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          can_view_all_customers?: boolean
          created_at?: string
          full_name?: string
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          role?: string
          settings?: Json
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          can_view_all_customers?: boolean
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          locale?: string
          phone?: string | null
          role?: string
          settings?: Json
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          product_id: string
          promotion_id: string
        }
        Insert: {
          product_id: string
          promotion_id: string
        }
        Update: {
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description_en: string | null
          description_kg: string | null
          description_ru: string | null
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          is_active: boolean
          slug: string
          starts_at: string
          title_en: string | null
          title_kg: string | null
          title_ru: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_kg?: string | null
          description_ru?: string | null
          discount_type: string
          discount_value: number
          ends_at: string
          id?: string
          is_active?: boolean
          slug: string
          starts_at: string
          title_en?: string | null
          title_kg?: string | null
          title_ru: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_kg?: string | null
          description_ru?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          starts_at?: string
          title_en?: string | null
          title_kg?: string | null
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          amount_tyiyn: number
          comment: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          decision: string | null
          id: string
          item_condition: string | null
          manager_id: string | null
          order_id: string | null
          order_item_id: string | null
          photo_paths: string[]
          processed_at: string | null
          product_id: string
          quantity: number
          reason: string
          return_number: number
          return_type: string
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount_tyiyn?: number
          comment?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          decision?: string | null
          id?: string
          item_condition?: string | null
          manager_id?: string | null
          order_id?: string | null
          order_item_id?: string | null
          photo_paths?: string[]
          processed_at?: string | null
          product_id: string
          quantity: number
          reason: string
          return_number?: never
          return_type: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_tyiyn?: number
          comment?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          decision?: string | null
          id?: string
          item_condition?: string | null
          manager_id?: string | null
          order_id?: string | null
          order_item_id?: string | null
          photo_paths?: string[]
          processed_at?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          return_number?: never
          return_type?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_debts: {
        Row: {
          adjusted_tyiyn: number
          amount_tyiyn: number
          created_at: string
          id: string
          order_id: string
          paid_tyiyn: number
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          adjusted_tyiyn?: number
          amount_tyiyn: number
          created_at?: string
          id?: string
          order_id: string
          paid_tyiyn?: number
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          adjusted_tyiyn?: number
          amount_tyiyn?: number
          created_at?: string
          id?: string
          order_id?: string
          paid_tyiyn?: number
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_debts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_debts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          allocation: Json
          amount_tyiyn: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          paid_at: string
          payment_method: string
          payment_number: number
          supplier_id: string
        }
        Insert: {
          allocation?: Json
          amount_tyiyn: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          paid_at?: string
          payment_method?: string
          payment_number?: never
          supplier_id: string
        }
        Update: {
          allocation?: Json
          amount_tyiyn?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          paid_at?: string
          payment_method?: string
          payment_number?: never
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          last_purchase_at: string | null
          product_id: string
          purchase_price_tyiyn: number
          supplier_id: string
          supplier_sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          last_purchase_at?: string | null
          product_id: string
          purchase_price_tyiyn: number
          supplier_id: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          last_purchase_at?: string | null
          product_id?: string
          purchase_price_tyiyn?: number
          supplier_id?: string
          supplier_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          archived_at: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_details: string | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_details?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_details?: string | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_manager_balances: {
        Row: {
          accrued_tyiyn: number | null
          due_tyiyn: number | null
          full_name: string | null
          manager_id: string | null
          paid_tyiyn: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_commissions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_supplier_balances: {
        Row: {
          accrued_tyiyn: number | null
          due_tyiyn: number | null
          name: string | null
          paid_tyiyn: number | null
          supplier_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_debts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_manager: {
        Args: {
          p_commission_type?: string
          p_commission_value?: number
          p_full_name: string
          p_phone?: string
          p_user_id: string
        }
        Returns: {
          avatar_url: string | null
          can_view_all_customers: boolean
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          locale: string
          phone: string | null
          role: string
          settings: Json
          theme: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      archive_manager: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      archive_supplier: {
        Args: { p_reason?: string; p_supplier_id: string }
        Returns: undefined
      }
      can_access_customer: { Args: { p_customer_id: string }; Returns: boolean }
      can_access_order: { Args: { p_order_id: string }; Returns: boolean }
      confirm_order_sale: {
        Args: {
          p_installment_months?: number
          p_order_id: string
          p_payment_method?: string
          p_received_tyiyn?: number
        }
        Returns: Json
      }
      create_public_order: {
        Args: { p_fingerprint: string; p_payload: Json }
        Returns: Json
      }
      create_staff_order: {
        Args: {
          p_assigned_manager_id?: string
          p_comment?: string
          p_customer: Json
          p_delivery?: Json
          p_items: Json
          p_sale_channel?: string
          p_source?: string
        }
        Returns: Json
      }
      current_app_role: { Args: never; Returns: string }
      get_analytics_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      get_finance_summary: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      is_active_staff: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      next_manager_id: { Args: never; Returns: string }
      normalize_phone: { Args: { p_phone: string }; Returns: string }
      pay_manager_commissions: {
        Args: {
          p_amount_tyiyn: number
          p_manager_id: string
          p_note?: string
          p_payment_method?: string
        }
        Returns: string
      }
      pay_supplier_debts: {
        Args: {
          p_amount_tyiyn: number
          p_note?: string
          p_payment_method?: string
          p_supplier_id: string
        }
        Returns: string
      }
      process_return: {
        Args: {
          p_decision: string
          p_refund_tyiyn?: number
          p_return_id: string
        }
        Returns: Json
      }
      record_inventory_adjustment: {
        Args: {
          p_note: string
          p_product_id: string
          p_quantity_delta: number
          p_supplier_id?: string
        }
        Returns: string
      }
      record_order_payment: {
        Args: {
          p_amount_tyiyn: number
          p_installment_schedule_id?: string
          p_note?: string
          p_order_id: string
          p_payment_method?: string
        }
        Returns: string
      }
      record_public_event: {
        Args: { p_fingerprint: string; p_payload: Json }
        Returns: string
      }
      run_daily_maintenance: { Args: never; Returns: undefined }
      set_order_status: {
        Args: { p_comment?: string; p_new_status: string; p_order_id: string }
        Returns: {
          assigned_manager_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_comment: string | null
          customer_id: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_region: string | null
          delivery_tyiyn: number
          discount_tyiyn: number
          financial_processed: boolean
          id: string
          internal_comment: string | null
          lead_id: string | null
          order_number: number
          paid_tyiyn: number
          payment_method: string | null
          payment_status: string
          public_request_id: string | null
          refunded_tyiyn: number
          request_metadata: Json
          requested_installment_months: number | null
          requested_purchase_method: string
          sale_channel: string
          source: string
          status: string
          subtotal_tyiyn: number
          total_tyiyn: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_profile: {
        Args: {
          p_avatar_url?: string
          p_full_name: string
          p_locale?: string
          p_phone?: string
          p_theme?: string
        }
        Returns: {
          avatar_url: string | null
          can_view_all_customers: boolean
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          locale: string
          phone: string | null
          role: string
          settings: Json
          theme: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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

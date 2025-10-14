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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamento: {
        Row: {
          cliente_cpf: string
          dataagendada: string
          funcionario_idfuncionario: number | null
          idagendamento: number
          lote_numlote: number
          observacoes: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
        }
        Insert: {
          cliente_cpf: string
          dataagendada: string
          funcionario_idfuncionario?: number | null
          idagendamento?: number
          lote_numlote: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
        }
        Update: {
          cliente_cpf?: string
          dataagendada?: string
          funcionario_idfuncionario?: number | null
          idagendamento?: number
          lote_numlote?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_cliente_cpf_fkey"
            columns: ["cliente_cpf"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "agendamento_funcionario_idfuncionario_fkey"
            columns: ["funcionario_idfuncionario"]
            isOneToOne: false
            referencedRelation: "funcionario"
            referencedColumns: ["idfuncionario"]
          },
          {
            foreignKeyName: "agendamento_lote_numlote_fkey"
            columns: ["lote_numlote"]
            isOneToOne: false
            referencedRelation: "lote"
            referencedColumns: ["numlote"]
          },
        ]
      }
      aplicacao: {
        Row: {
          agendamento_idagendamento: number | null
          cliente_cpf: string
          dataaplicacao: string
          dose: number | null
          funcionario_idfuncionario: number
          idaplicacao: number
          observacoes: string | null
          reacoesadversas: string | null
        }
        Insert: {
          agendamento_idagendamento?: number | null
          cliente_cpf: string
          dataaplicacao: string
          dose?: number | null
          funcionario_idfuncionario: number
          idaplicacao?: number
          observacoes?: string | null
          reacoesadversas?: string | null
        }
        Update: {
          agendamento_idagendamento?: number | null
          cliente_cpf?: string
          dataaplicacao?: string
          dose?: number | null
          funcionario_idfuncionario?: number
          idaplicacao?: number
          observacoes?: string | null
          reacoesadversas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aplicacao_cliente_cpf_fkey"
            columns: ["cliente_cpf"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["cpf"]
          },
          {
            foreignKeyName: "aplicacao_funcionario_idfuncionario_fkey"
            columns: ["funcionario_idfuncionario"]
            isOneToOne: false
            referencedRelation: "funcionario"
            referencedColumns: ["idfuncionario"]
          },
        ]
      }
      cliente: {
        Row: {
          alergias: string | null
          cpf: string
          datanasc: string | null
          email: string | null
          nomecompleto: string
          observacoes: string | null
          status: Database["public"]["Enums"]["cliente_status"]
          telefone: string | null
        }
        Insert: {
          alergias?: string | null
          cpf: string
          datanasc?: string | null
          email?: string | null
          nomecompleto: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["cliente_status"]
          telefone?: string | null
        }
        Update: {
          alergias?: string | null
          cpf?: string
          datanasc?: string | null
          email?: string | null
          nomecompleto?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["cliente_status"]
          telefone?: string | null
        }
        Relationships: []
      }
      funcionario: {
        Row: {
          cargo: string | null
          cpf: string
          dataadmissao: string | null
          email: string
          idfuncionario: number
          nomecompleto: string
          senha: string
          status: Database["public"]["Enums"]["funcionario_status"]
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          cpf: string
          dataadmissao?: string | null
          email: string
          idfuncionario?: number
          nomecompleto: string
          senha: string
          status?: Database["public"]["Enums"]["funcionario_status"]
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string
          dataadmissao?: string | null
          email?: string
          idfuncionario?: number
          nomecompleto?: string
          senha?: string
          status?: Database["public"]["Enums"]["funcionario_status"]
          telefone?: string | null
        }
        Relationships: []
      }
      historico_aplicacoes_cliente: {
        Row: {
          cliente_cpf_deletado: string
          data_exclusao_cliente: string | null
          dataaplicacao_hist: string | null
          dose_hist: number | null
          idagendamento_hist: number | null
          idaplicacao_hist: number
          idfuncionario_hist: number | null
          idhistorico: number
        }
        Insert: {
          cliente_cpf_deletado: string
          data_exclusao_cliente?: string | null
          dataaplicacao_hist?: string | null
          dose_hist?: number | null
          idagendamento_hist?: number | null
          idaplicacao_hist: number
          idfuncionario_hist?: number | null
          idhistorico?: number
        }
        Update: {
          cliente_cpf_deletado?: string
          data_exclusao_cliente?: string | null
          dataaplicacao_hist?: string | null
          dose_hist?: number | null
          idagendamento_hist?: number | null
          idaplicacao_hist?: number
          idfuncionario_hist?: number | null
          idhistorico?: number
        }
        Relationships: []
      }
      lote: {
        Row: {
          codigolote: string
          datavalidade: string
          numlote: number
          precocompra: number
          precovenda: number
          quantidadedisponivel: number
          quantidadeinicial: number
          vacina_idvacina: number
        }
        Insert: {
          codigolote: string
          datavalidade: string
          numlote?: number
          precocompra?: number
          precovenda?: number
          quantidadedisponivel: number
          quantidadeinicial: number
          vacina_idvacina: number
        }
        Update: {
          codigolote?: string
          datavalidade?: string
          numlote?: number
          precocompra?: number
          precovenda?: number
          quantidadedisponivel?: number
          quantidadeinicial?: number
          vacina_idvacina?: number
        }
        Relationships: [
          {
            foreignKeyName: "lote_vacina_idvacina_fkey"
            columns: ["vacina_idvacina"]
            isOneToOne: false
            referencedRelation: "vacina"
            referencedColumns: ["idvacina"]
          },
        ]
      }
      vacina: {
        Row: {
          categoria: Database["public"]["Enums"]["vacina_categoria"] | null
          descricao: string | null
          fabricante: string | null
          idvacina: number
          intervalodoses: number | null
          nome: string
          quantidadedoses: number | null
          status: Database["public"]["Enums"]["vacina_status"]
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["vacina_categoria"] | null
          descricao?: string | null
          fabricante?: string | null
          idvacina?: number
          intervalodoses?: number | null
          nome: string
          quantidadedoses?: number | null
          status?: Database["public"]["Enums"]["vacina_status"]
        }
        Update: {
          categoria?: Database["public"]["Enums"]["vacina_categoria"] | null
          descricao?: string | null
          fabricante?: string | null
          idvacina?: number
          intervalodoses?: number | null
          nome?: string
          quantidadedoses?: number | null
          status?: Database["public"]["Enums"]["vacina_status"]
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
      agendamento_status: "AGENDADO" | "REALIZADO"
      cliente_status: "ATIVO" | "INATIVO"
      funcionario_status: "ATIVO" | "INATIVO"
      vacina_categoria: "VIRAL" | "BACTERIANA" | "OUTRA"
      vacina_status: "ATIVA" | "INATIVA"
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
    Enums: {
      agendamento_status: ["AGENDADO", "REALIZADO"],
      cliente_status: ["ATIVO", "INATIVO"],
      funcionario_status: ["ATIVO", "INATIVO"],
      vacina_categoria: ["VIRAL", "BACTERIANA", "OUTRA"],
      vacina_status: ["ATIVA", "INATIVA"],
    },
  },
} as const

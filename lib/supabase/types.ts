export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  native_lang: string;
  target_lang: string;
  level: "beginner" | "intermediate" | "advanced";
  is_ai: boolean;
  system_prompt: string | null;
  created_at: string;
};

export type Room = {
  id: string;
  name: string;
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  description: string;
  created_at: string;
};

export type RoomAiPersona = {
  room_id: string;
  profile_id: string;
  system_prompt: string;
};

export type Message = {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type SavedVocab = {
  id: string;
  user_id: string;
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
  source_message_id: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
};

export type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ConversationRead = {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      rooms: {
        Row: Room;
        Insert: Partial<Room> & { name: string; topic: string; level: Room["level"] };
        Update: Partial<Room>;
        Relationships: [];
      };
      room_ai_personas: {
        Row: RoomAiPersona;
        Insert: RoomAiPersona;
        Update: Partial<RoomAiPersona>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & { room_id: string; user_id: string; content: string };
        Update: Partial<Message>;
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_vocab: {
        Row: SavedVocab;
        Insert: Partial<SavedVocab> & { user_id: string; hanzi: string };
        Update: Partial<SavedVocab>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation> & { user_a_id: string; user_b_id: string };
        Update: Partial<Conversation>;
        Relationships: [];
      };
      direct_messages: {
        Row: DirectMessage;
        Insert: Partial<DirectMessage> & {
          conversation_id: string;
          sender_id: string;
          content: string;
        };
        Update: Partial<DirectMessage>;
        Relationships: [];
      };
      conversation_reads: {
        Row: ConversationRead;
        Insert: Partial<ConversationRead> & { conversation_id: string; user_id: string };
        Update: Partial<ConversationRead>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

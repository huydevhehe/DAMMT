// src/integrations/supabase/client.ts
// 👉 Stub Supabase client + sendEvent để kết nối BE thật (localhost:4000)
import axios from "axios";

// ⚡ Mock client (cho FE không lỗi khi import supabase)
export const supabase = {
  from: () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
    delete: async () => ({ data: [], error: null }),
    eq: () => ({
      select: async () => ({ data: [], error: null }),
    }),
  }),
  auth: {
    getSession: async () => ({ data: { session: { user: { email: "demo@local" } } } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  channel: () => ({
    on: () => ({}),
    subscribe: () => ({}),
  }),
  removeChannel: () => {},
};

// ⚙️ Hàm thật dùng để gửi dữ liệu tracking về backend qua HTTP
export const sendEvent = async (eventData: any) => {
  try {
    const res = await axios.post("http://localhost:4000/api/events", eventData);
    return res.data;
  } catch (err) {
    console.error("❌ Lỗi gửi event:", err);
  }
};

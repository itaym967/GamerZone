"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Lock, Unlock, Search, Shield, UserCheck, Filter } from "lucide-react";
import { toast } from "sonner";
import { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type { Profile } from "../types";

interface UsersTabProps {
  supabase: SupabaseClient;
  currentUser: string | null;
}

type RoleFilter = "all" | "user" | "admin" | "minor" | "banned";

export default function UsersTab({ supabase, currentUser }: UsersTabProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("username", { ascending: true })
        .limit(100);
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("שגיאה בטעינת משתמשים");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Realtime subscription for user changes
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setup = () => {
      if (document.hidden) return;
      channel = supabase
        .channel("admin-users-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
          if (payload.eventType === "UPDATE") {
            setUsers((prev) => prev.map((u) => (u.id === payload.new.id ? { ...u, ...payload.new } : u)));
          } else if (payload.eventType === "INSERT") {
            setUsers((prev) => [payload.new as Profile, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
          }
        })
        .subscribe();
    };

    const onVisibility = () => {
      if (document.hidden) {
        channel?.unsubscribe();
        channel = null;
      } else {
        setup();
      }
    };

    setup();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      channel?.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [supabase]);

  const handleFreeze = async (user: Profile) => {
    const isBanning = !user.is_banned;
    let reason: string | null = null;
    if (isBanning) {
      reason = prompt("הכנס סיבת הקפאה (אופציונלי):");
      if (reason === null) return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_banned: isBanning, ban_reason: reason })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      if (data.is_banned !== isBanning) throw new Error("Update failed to apply");

      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...data } : u)));
      toast.success(isBanning ? `המשתמש ${user.username} הוקפא` : `המשתמש ${user.username} שוחרר`);

      if (isBanning) {
        fetch("/api/admin/revoke-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        }).catch((e) => console.error("Failed to revoke session:", e));
      }

      const title = isBanning ? "חשבונך הוקפא" : "חשבונך שוחרר";
      const message = isBanning
        ? reason ? `החשבון הוקפא עקב: ${reason}` : "חשבונך הוקפא על ידי מנהל המערכת."
        : "ההקפאה הוסרה מחשבונך. ברוך שובך!";

      await supabase.from("notifications").insert({
        user_id: user.id, title, message,
        type: isBanning ? "error" : "success", action_url: "/profile",
      });

      fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, title, message, url: "/" }),
      }).catch((e) => console.error(e));

      await supabase.from("admin_logs").insert({
        action: isBanning ? "FREEZE_USER" : "UNFREEZE_USER",
        details: { target_user: user.username, reason },
        admin_id: currentUser,
      });
    } catch (error: any) {
      console.error("Operation failed:", error);
      toast.error("שגיאה בביצוע הפעולה", { description: error.message || "נא לנסות שוב" });
      fetchUsers();
    }
  };

  const handleDelete = async (user: Profile) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${user.username}? פעולה זו אינה הפיכה.`)) return;
    try {
      const { error } = await supabase.rpc("delete_user_as_admin", { target_user_id: user.id });
      if (error) throw error;
      toast.success(`המשתמש ${user.username} נמחק בהצלחה`);
      await supabase.from("admin_logs").insert({
        action: "DELETE_USER",
        details: { target_username: user.username, target_id: user.id },
        admin_id: currentUser,
      });
      fetchUsers();
    } catch (error) {
      toast.error("שגיאה במחיקת משתמש");
      console.error("Delete Error:", error);
    }
  };

  const handleRoleChange = async (user: Profile, newRole: string) => {
    if (!confirm(`שנה תפקיד של ${user.username} ל-${newRole}?`)) return;
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      toast.success(`התפקיד של ${user.username} שונה ל-${newRole}`);
      await supabase.from("admin_logs").insert({
        action: "CHANGE_ROLE",
        details: { target_user: user.username, old_role: user.role, new_role: newRole },
        admin_id: currentUser,
      });
    } catch (error) {
      toast.error("שגיאה בשינוי תפקיד");
      console.error(error);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = !searchQuery || u.username?.toLowerCase().includes(searchQuery.toLowerCase())
      || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "admin" && u.role === "admin") ||
      (roleFilter === "user" && u.role !== "admin" && !u.is_minor && !u.is_banned) ||
      (roleFilter === "minor" && u.is_minor) ||
      (roleFilter === "banned" && u.is_banned);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש לפי שם משתמש, שם מלא או אימייל..."
            className="w-full bg-[#0e0e1b] border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm outline-none focus:border-red-500/30 text-right"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter size={14} className="text-gray-500" />
          {(["all", "user", "admin", "minor", "banned"] as RoleFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === f ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "הכל" : f === "user" ? "משתמשים" : f === "admin" ? "מנהלים" : f === "minor" ? "קטינים" : "מוקפאים"}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 text-right">{filtered.length} מתוך {users.length} משתמשים</div>

      {/* Users Table */}
      <div className="bg-[#0e0e1b] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 font-medium">שם משתמש</th>
              <th className="p-4 font-medium">שם מלא</th>
              <th className="p-4 font-medium">תפקיד</th>
              <th className="p-4 font-medium">סטטוס</th>
              <th className="p-4 font-medium">סיבת הקפאה</th>
              <th className="p-4 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {filtered.map((user) => (
              <tr key={user.id} className={`hover:bg-white/5 transition-colors ${user.is_banned ? "bg-red-500/5" : ""}`}>
                <td className="p-4 font-bold text-white">
                  {user.username}
                  {user.is_banned && <span className="mr-2 text-xs text-red-500 bg-red-950 px-2 py-0.5 rounded-full">מוקפא</span>}
                  {user.is_minor && <span className="mr-2 text-xs text-amber-500 bg-amber-950 px-2 py-0.5 rounded-full">קטין</span>}
                </td>
                <td className="p-4">{user.full_name}</td>
                <td className="p-4">
                  <select
                    value={user.role || "user"}
                    onChange={(e) => handleRoleChange(user, e.target.value)}
                    disabled={user.id === currentUser}
                    className={`px-2 py-1 rounded text-xs font-bold bg-transparent border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      user.role === "admin" ? "border-red-500/30 text-red-400" : "border-blue-500/30 text-blue-400"
                    }`}
                  >
                    <option value="user" className="bg-[#0e0e1b]">user</option>
                    <option value="admin" className="bg-[#0e0e1b]">admin</option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full inline-block ${user.is_online ? "bg-green-500" : "bg-gray-500"}`} />
                    {user.is_online ? "מחובר" : "מנותק"}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-400 max-w-[150px] truncate" title={user.ban_reason || undefined}>
                  {user.ban_reason || "-"}
                </td>
                <td className="p-4">
                  {user.id !== currentUser && user.role !== "admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFreeze(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_banned
                            ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                            : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        }`}
                        title={user.is_banned ? "שחרר הקפאה" : "הקפא משתמש"}
                      >
                        {user.is_banned ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="מחק משתמש"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <UserCheck size={32} className="opacity-50" />
            <p>{searchQuery ? "לא נמצאו משתמשים" : "אין משתמשים להצגה"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

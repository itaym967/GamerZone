"use client";

import {
  Delete02Icon,
  FilterIcon,
  LockIcon,
  Search01Icon,
  SquareUnlock01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Profile } from "../types";

interface UsersTabProps {
  currentUser: string | null;
  supabase: SupabaseClient;
}

type RoleFilter = "all" | "user" | "admin" | "minor" | "banned";

const ROLE_FILTER_LABELS: Record<RoleFilter, string> = {
  all: "הכל",
  user: "משתמשים",
  admin: "מנהלים",
  minor: "קטינים",
  banned: "מוקפאים",
};

const getFreezeNotificationMessage = (isBanning: boolean, reason: string) => {
  if (!isBanning) {
    return "ההקפאה הוסרה מחשבונך. ברוך שובך!";
  }
  if (reason) {
    return `החשבון הוקפא עקב: ${reason}`;
  }
  return "חשבונך הוקפא על ידי מנהל המערכת.";
};

export default function UsersTab({ supabase, currentUser }: UsersTabProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [freezeTarget, setFreezeTarget] = useState<Profile | null>(null);
  const [freezeReason, setFreezeReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    newRole: string;
    user: Profile;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("username", { ascending: true })
        .limit(100);
      if (error) {
        throw error;
      }
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
      if (document.hidden) {
        return;
      }
      channel = supabase
        .channel("admin-users-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === payload.new.id ? { ...u, ...payload.new } : u
                )
              );
            } else if (payload.eventType === "INSERT") {
              setUsers((prev) => [payload.new as Profile, ...prev]);
            } else if (payload.eventType === "DELETE") {
              setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
            }
          }
        )
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

  const applyFreezeChange = async (
    user: Profile,
    isBanning: boolean,
    reason: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_banned: isBanning, ban_reason: reason || null })
        .eq("id", user.id)
        .select()
        .single();
      if (error) {
        throw error;
      }
      if (data.is_banned !== isBanning) {
        throw new Error("Update failed to apply");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, ...data } : u))
      );
      toast.success(
        isBanning
          ? `המשתמש ${user.username} הוקפא`
          : `המשתמש ${user.username} שוחרר`
      );

      if (isBanning) {
        fetch("/api/admin/revoke-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        }).catch((e) => console.error("Failed to revoke session:", e));
      }

      const title = isBanning ? "חשבונך הוקפא" : "חשבונך שוחרר";
      const message = getFreezeNotificationMessage(isBanning, reason);

      await supabase.from("notifications").insert({
        user_id: user.id,
        title,
        message,
        type: isBanning ? "error" : "success",
        action_url: "/profile",
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "נא לנסות שוב";
      console.error("Operation failed:", error);
      toast.error("שגיאה בביצוע הפעולה", {
        description: errorMessage,
      });
      fetchUsers();
    }
  };

  const confirmDelete = async (user: Profile) => {
    try {
      const { error } = await supabase.rpc("delete_user_as_admin", {
        target_user_id: user.id,
      });
      if (error) {
        throw error;
      }
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

  const confirmRoleChange = async (user: Profile, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);
      if (error) {
        throw error;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      toast.success(`התפקיד של ${user.username} שונה ל-${newRole}`);
      await supabase.from("admin_logs").insert({
        action: "CHANGE_ROLE",
        details: {
          target_user: user.username,
          old_role: user.role,
          new_role: newRole,
        },
        admin_id: currentUser,
      });
    } catch (error) {
      toast.error("שגיאה בשינוי תפקיד");
      console.error(error);
    }
  };

  const onFreezeClick = (user: Profile) => {
    setFreezeTarget(user);
    setFreezeReason("");
  };

  const onDeleteClick = (user: Profile) => {
    setDeleteTarget(user);
  };

  const onRoleChangeAttempt = (user: Profile, newRole: string) => {
    if ((user.role || "user") === newRole) {
      return;
    }
    setRoleChangeTarget({ user, newRole });
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "admin" && u.role === "admin") ||
      (roleFilter === "user" &&
        u.role !== "admin" &&
        !u.is_minor &&
        !u.is_banned) ||
      (roleFilter === "minor" && u.is_minor) ||
      (roleFilter === "banned" && u.is_banned);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-500/30 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <HugeiconsIcon
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
            icon={Search01Icon}
            size={16}
          />
          <input
            className="w-full rounded-xl border border-white/5 bg-card py-2.5 pr-10 pl-4 text-right text-fluid-sm text-white outline-hidden focus:border-red-500/30"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש לפי שם משתמש, שם מלא או אימייל..."
            type="text"
            value={searchQuery}
          />
        </div>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="text-gray-500"
            icon={FilterIcon}
            size={14}
          />
          {(["all", "user", "admin", "minor", "banned"] as RoleFilter[]).map(
            (f) => (
              <button
                className={`rounded-lg px-3 py-1.5 font-bold text-fluid-xs transition-all ${
                  roleFilter === f
                    ? "border border-red-500/30 bg-red-500/20 text-red-400"
                    : "border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
                key={f}
                onClick={() => setRoleFilter(f)}
                type="button"
              >
                {ROLE_FILTER_LABELS[f]}
              </button>
            )
          )}
        </div>
      </div>

      <div className="text-right text-fluid-xs text-gray-500">
        {filtered.length} מתוך {users.length} משתמשים
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-card">
        <table className="w-full text-right text-fluid-sm">
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
              <tr
                className={`transition-colors hover:bg-white/5 ${user.is_banned ? "bg-red-500/5" : ""}`}
                key={user.id}
              >
                <td className="p-4 font-bold text-white">
                  {user.username}
                  {user.is_banned && (
                    <span className="mr-2 rounded-full bg-red-950 px-2 py-0.5 text-fluid-xs text-red-500">
                      מוקפא
                    </span>
                  )}
                  {user.is_minor && (
                    <span className="mr-2 rounded-full bg-amber-950 px-2 py-0.5 text-amber-500 text-fluid-xs">
                      קטין
                    </span>
                  )}
                </td>
                <td className="p-4">{user.full_name}</td>
                <td className="p-4">
                  <select
                    className={`cursor-pointer rounded border bg-transparent px-2 py-1 font-bold text-fluid-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                      user.role === "admin"
                        ? "border-red-500/30 text-red-400"
                        : "border-blue-500/30 text-blue-400"
                    }`}
                    disabled={user.id === currentUser}
                    onChange={(e) => onRoleChangeAttempt(user, e.target.value)}
                    value={user.role || "user"}
                  >
                    <option className="bg-card" value="user">
                      user
                    </option>
                    <option className="bg-card" value="admin">
                      admin
                    </option>
                  </select>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${user.is_online ? "bg-green-500" : "bg-gray-500"}`}
                    />
                    {user.is_online ? "מחובר" : "מנותק"}
                  </div>
                </td>
                <td
                  className="max-w-37.5 truncate p-4 text-fluid-sm text-gray-400"
                  title={user.ban_reason || undefined}
                >
                  {user.ban_reason || "-"}
                </td>
                <td className="p-4">
                  {user.id !== currentUser && user.role !== "admin" && (
                    <div className="flex gap-2">
                      <button
                        className={`rounded-lg p-2 transition-colors ${
                          user.is_banned
                            ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                            : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        }`}
                        onClick={() => onFreezeClick(user)}
                        title={user.is_banned ? "שחרר הקפאה" : "הקפא משתמש"}
                        type="button"
                      >
                        {user.is_banned ? (
                          <HugeiconsIcon icon={LockIcon} size={18} />
                        ) : (
                          <HugeiconsIcon icon={SquareUnlock01Icon} size={18} />
                        )}
                      </button>
                      <button
                        className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
                        onClick={() => onDeleteClick(user)}
                        title="מחק משתמש"
                        type="button"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-500">
            <HugeiconsIcon
              className="opacity-50"
              icon={UserCheck01Icon}
              size={32}
            />
            <p>{searchQuery ? "לא נמצאו משתמשים" : "אין משתמשים להצגה"}</p>
          </div>
        )}
      </div>

      {freezeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5">
            <h3 className="mb-2 font-bold text-fluid-lg text-white">
              {freezeTarget.is_banned ? "שחרור משתמש" : "הקפאת משתמש"}
            </h3>
            <p className="mb-4 text-fluid-sm text-gray-300">
              {freezeTarget.is_banned
                ? `לשחרר את ${freezeTarget.username} מהקפאה?`
                : `להקפיא את ${freezeTarget.username}?`}
            </p>
            {!freezeTarget.is_banned && (
              <input
                className="mb-4 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right text-white outline-hidden"
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="סיבת הקפאה (אופציונלי)"
                type="text"
                value={freezeReason}
              />
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-bold text-white hover:bg-white/20"
                onClick={() => setFreezeTarget(null)}
                type="button"
              >
                ביטול
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-bold text-white hover:bg-red-500"
                onClick={async () => {
                  const user = freezeTarget;
                  setFreezeTarget(null);
                  await applyFreezeChange(user, !user.is_banned, freezeReason);
                }}
                type="button"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5">
            <h3 className="mb-2 font-bold text-fluid-lg text-white">
              מחיקת משתמש
            </h3>
            <p className="mb-4 text-fluid-sm text-gray-300">
              {`למחוק את ${deleteTarget.username}? פעולה זו אינה הפיכה.`}
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-bold text-white hover:bg-white/20"
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                ביטול
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-bold text-white hover:bg-red-500"
                onClick={async () => {
                  const user = deleteTarget;
                  setDeleteTarget(null);
                  await confirmDelete(user);
                }}
                type="button"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5">
            <h3 className="mb-2 font-bold text-fluid-lg text-white">
              שינוי תפקיד
            </h3>
            <p className="mb-4 text-fluid-sm text-gray-300">
              {`לשנות את התפקיד של ${roleChangeTarget.user.username} ל-${roleChangeTarget.newRole}?`}
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 font-bold text-white hover:bg-white/20"
                onClick={() => setRoleChangeTarget(null)}
                type="button"
              >
                ביטול
              </button>
              <button
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white hover:bg-blue-500"
                onClick={async () => {
                  const change = roleChangeTarget;
                  setRoleChangeTarget(null);
                  await confirmRoleChange(change.user, change.newRole);
                }}
                type="button"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { updateUserStatus } from "@/actions/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role, UserStatus } from "@prisma/client";
import { Search, ShieldAlert, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string | Date;
}

interface UserManagementTableProps {
  users: User[];
  currentUserId: string;
}

export function UserManagementTable({ users, currentUserId }: UserManagementTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const text = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(text) ||
      (u.name && u.name.toLowerCase().includes(text))
    );
  });

  const handleRoleChange = async (userId: string, currentStatus: UserStatus, nextRole: Role) => {
    setLoadingId(userId);
    setError(null);
    setSuccess(null);
    try {
      await updateUserStatus(userId, currentStatus, nextRole);
      setSuccess("User role updated successfully");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update user parameters");
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusChange = async (userId: string, nextStatus: UserStatus, currentRole: Role) => {
    if (userId === currentUserId) {
      alert("You cannot lock or suspend your own admin account.");
      return;
    }
    setLoadingId(userId);
    setError(null);
    setSuccess(null);
    try {
      await updateUserStatus(userId, nextStatus, currentRole);
      setSuccess(`User status changed to ${nextStatus}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to change user status");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {error && (
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Search Filter Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter email or name..."
          className="pl-9 bg-neutral-950 border-neutral-800 focus:border-violet-500 text-neutral-100 placeholder:text-neutral-600 text-xs"
        />
      </div>

      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-950">
            <TableRow className="border-neutral-800 hover:bg-transparent">
              <TableHead className="text-neutral-400 font-semibold h-10">Name</TableHead>
              <TableHead className="text-neutral-400 font-semibold h-10">Email</TableHead>
              <TableHead className="text-neutral-400 font-semibold h-10">Role Clearance</TableHead>
              <TableHead className="text-neutral-400 font-semibold h-10">Account Status</TableHead>
              <TableHead className="text-neutral-400 font-semibold h-10">Registered At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center text-neutral-500">
                  <ShieldAlert className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
                  <p className="text-sm">No matching users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="border-neutral-800 hover:bg-neutral-850/30">
                  <TableCell className="font-semibold text-neutral-200">
                    {u.name || "Unnamed Developer"}
                    {u.id === currentUserId && " (You)"}
                  </TableCell>
                  <TableCell className="text-neutral-400 text-xs">{u.email}</TableCell>
                  
                  {/* Role Assignment Select */}
                  <TableCell>
                    <select
                      value={u.role}
                      disabled={loadingId === u.id || u.id === currentUserId}
                      onChange={(e) => handleRoleChange(u.id, u.status, e.target.value as Role)}
                      className="rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs px-2 py-1 outline-none focus:border-violet-500 disabled:opacity-40"
                    >
                      <option value="SUPER_ADMIN">Admin</option>
                      <option value="ORGANIZER">Organizer</option>
                      <option value="JUDGE">Judge</option>
                      <option value="PARTICIPANT">Participant</option>
                    </select>
                  </TableCell>

                  {/* Status Toggle Switch */}
                  <TableCell>
                    <select
                      value={u.status}
                      disabled={loadingId === u.id || u.id === currentUserId}
                      onChange={(e) => handleStatusChange(u.id, e.target.value as UserStatus, u.role)}
                      className={`rounded border text-xs px-2 py-1 outline-none focus:border-violet-500 disabled:opacity-40 bg-neutral-950 ${
                        u.status === "ACTIVE" ? "border-emerald-800 text-emerald-400" :
                        u.status === "SUSPENDED" ? "border-red-800 text-red-400" : "border-amber-800 text-amber-400"
                      }`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </TableCell>

                  <TableCell className="text-neutral-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

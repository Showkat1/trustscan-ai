"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { SystemMeta, User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meta = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.get<SystemMeta>("/api/v1/meta", { auth: false }),
    staleTime: 5 * 60_000,
  });

  const saveProfile = useMutation({
    mutationFn: () => api.patch<User>("/api/v1/auth/me", { full_name: fullName.trim() }),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      api.post<void>("/api/v1/auth/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: async () => {
      toast.success("Password changed. Please sign in again.");
      await logout();
      router.replace("/login");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const logoutAll = useMutation({
    mutationFn: () => api.post<void>("/api/v1/auth/logout-all"),
    onSuccess: async () => {
      toast.success("All sessions revoked");
      await logout();
      router.replace("/login");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.delete<void>("/api/v1/auth/me"),
    onSuccess: async () => {
      toast.success("Account deleted");
      await logout();
      queryClient.clear();
      router.replace("/");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 10) {
      toast.error("Use at least 10 characters");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error("Include at least one letter and one number");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    changePassword.mutate();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Account & security
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Manage your profile, credentials and deployment information.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4 text-teal-300" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={160}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} readOnly disabled />
              <p className="text-[11px] text-faint">
                Email changes are disabled. Contact an administrator if needed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-faint">
              <Badge tone={user?.role === "admin" ? "violet" : "neutral"}>
                {user?.role === "admin" ? "Administrator" : "Member"}
              </Badge>
              <span>Member since {formatDate(user?.created_at)}</span>
              <span>·</span>
              <span>Last login {formatDate(user?.last_login_at)}</span>
            </div>
            <Button
              onClick={() => saveProfile.mutate()}
              loading={saveProfile.isPending}
              disabled={!fullName.trim() || fullName.trim() === user?.full_name}
            >
              <Save className="size-4" />
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4 text-teal-300" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <p className="text-[11px] text-faint">
                Changing your password signs out every session, including this one.
              </p>
              <Button
                type="submit"
                variant="secondary"
                loading={changePassword.isPending}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                <ShieldCheck className="size-4" />
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-teal-300" />
            Deployment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Version", meta.data?.version ?? "—"],
              ["Analysis engine", meta.data?.llm_mode ?? "—"],
              ["Embeddings", meta.data?.embedding_provider ?? "—"],
              ["Pipeline stages", meta.data ? String(meta.data.pipeline.length) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-surface/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-faint">{label}</p>
                <p className="mt-1 truncate font-mono text-xs text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="size-4 text-teal-300" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-muted">
            Revoke every refresh token associated with your account. Any other device signed in
            to TrustScan will need to authenticate again.
          </p>
          <Button
            variant="secondary"
            onClick={() => logoutAll.mutate()}
            loading={logoutAll.isPending}
          >
            <LogOut className="size-4" />
            Sign out everywhere
          </Button>
        </CardContent>
      </Card>

      <Card className="border-rose-500/25 bg-rose-500/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="size-4" />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator className="bg-rose-500/20" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Delete account</p>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted">
                Permanently delete your account, every investigation and every uploaded file.
                This cannot be undone.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              All investigations, reports and uploaded evidence for {user?.email} will be
              permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
            >
              <Trash2 className="size-4" />
              Yes, delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="flex items-center justify-center gap-1.5 pb-4 text-[11px] text-faint">
        <CheckCircle2 className="size-3.5 text-teal-400/70" />
        TrustScan AI · evidence-grounded risk intelligence
      </p>
    </div>
  );
}

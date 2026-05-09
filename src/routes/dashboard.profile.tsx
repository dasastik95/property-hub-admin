import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, Mail, Phone, Save, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { updateCurrentUserPassword } from "@/integrations/supabase/auth";
import { BUSINESS } from "@/config/business";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: `Profile - ${BUSINESS.name}` }] }),
  component: ProfilePage,
});

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(0, 10);
}

function isValidPhone(phone: string) {
  return sanitizePhone(phone).length === 10;
}

function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    whatsapp: "",
    city: "",
    bio: "",
    role: "buyer" as "buyer" | "seller" | "broker" | "admin",
  });
  const [passwordForm, setPasswordForm] = useState({
    nextPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? "",
        phone: sanitizePhone(profile.phone ?? ""),
        whatsapp: sanitizePhone(profile.whatsapp ?? ""),
        city: profile.city ?? "",
        bio: profile.bio ?? "",
        role: profile.role,
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const displayName = form.display_name.trim();
    const phone = sanitizePhone(form.phone);
    const whatsapp = sanitizePhone(form.whatsapp);

    if (!displayName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!isValidPhone(phone)) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    if (whatsapp && !isValidPhone(whatsapp)) {
      toast.error("Please enter a valid WhatsApp number.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        phone,
        whatsapp: whatsapp || null,
        city: form.city.trim() || null,
        bio: form.bio.trim() || null,
        role: form.role,
        onboarded: true,
      })
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      display_name: displayName,
      phone,
      whatsapp,
    }));
    await refreshProfile();
    toast.success("Profile updated");
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.nextPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const { error } = await updateCurrentUserPassword({
      password: passwordForm.nextPassword,
    });
    setPasswordSaving(false);

    if (error) {
      toast.error(error.message || "Failed to update password.");
      return;
    }

    setPasswordForm({
      nextPassword: "",
      confirmPassword: "",
    });
    toast.success("Password updated");
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center md:px-6">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Your name and mobile number stay in sync with your account profile.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <Card className="p-6 md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {(profile?.display_name || user.email || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-bold">
                  {profile?.display_name || "Your profile"}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 break-all">
                    <Mail className="h-4 w-4 text-primary" />
                    {profile?.email ?? user.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-primary" />
                    {profile?.phone || "Mobile not added"}
                  </span>
                  <span className="capitalize">{profile?.role ?? "buyer"}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <form onSubmit={save} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email ?? ""} disabled className="mt-1.5 bg-muted" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Email is locked to your login and cannot be changed here.
                </p>
              </div>

              <div>
                <Label htmlFor="dn">Full name</Label>
                <Input
                  id="dn"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="mt-1.5"
                  maxLength={80}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ph">Mobile number</Label>
                  <Input
                    id="ph"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })}
                    className="mt-1.5"
                    maxLength={10}
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="wa">WhatsApp</Label>
                  <Input
                    id="wa"
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: sanitizePhone(e.target.value) })}
                    className="mt-1.5"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    placeholder="10-digit WhatsApp number"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>I am a...</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer / Tenant</SelectItem>
                      <SelectItem value="seller">Seller / Landlord</SelectItem>
                      <SelectItem value="broker">Broker / Agent</SelectItem>
                      {form.role === "admin" && (
                        <SelectItem value="admin">Administrator</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange/10 text-orange">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Account security</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can update your password here any time. Your email stays unchanged.
                </p>
              </div>
            </div>

            <form onSubmit={updatePassword} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="np">New password</Label>
                  <Input
                    id="np"
                    type="password"
                    value={passwordForm.nextPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, nextPassword: e.target.value })
                    }
                    className="mt-1.5"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cp">Confirm new password</Label>
                  <Input
                    id="cp"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="mt-1.5"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-border pt-5">
                <Button type="submit" disabled={passwordSaving}>
                  {passwordSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" /> Update password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

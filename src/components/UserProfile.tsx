import { useState, useEffect } from "react";
import { X, User, Mail, Lock, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { toast } from "sonner";

interface UserProfileProps {
  onClose: () => void;
  authToken: string;
  userEmail: string;
  onProfileUpdated?: (email: string) => void;
}

export default function UserProfile({ onClose, authToken, userEmail, onProfileUpdated }: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải thông tin người dùng");
      }

      const data = await response.json();
      setUser(data.user);
      setForm((prev) => ({
        ...prev,
        email: data.user.email || "",
        fullName: data.user.full_name || "",
      }));
    } catch (error: any) {
      toast.error(error.message || "Không thể tải thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords if changing
    if (form.newPassword) {
      if (form.newPassword !== form.confirmPassword) {
        toast.error("Mật khẩu mới không khớp");
        return;
      }
      if (form.newPassword.length < 6) {
        toast.error("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }
    }

    setIsSaving(true);

    try {
      const body: any = {
        email: form.email,
        fullName: form.fullName,
      };

      if (form.newPassword) {
        body.password = form.newPassword;
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Cập nhật thất bại");
      }

      const data = await response.json();
      toast.success("Đã cập nhật thông tin thành công!");

      // Reset password fields
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Notify parent if email changed
      if (data.user.email !== userEmail && onProfileUpdated) {
        onProfileUpdated(data.user.email);
      }

      // Reload user data
      await loadUserProfile();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
              <p className="text-gray-600 text-sm mt-1">
                Quản lý thông tin tài khoản của bạn
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Vai trò</p>
                  <p className="font-semibold">
                    {user?.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="fullName">
                <User className="w-4 h-4 inline mr-2" />
                Họ và tên
              </Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Đổi mật khẩu
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Để trống nếu không muốn thay đổi mật khẩu
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

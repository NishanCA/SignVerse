"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";
import { User, Camera, Save, Edit3, ChevronLeft, Phone, MapPin, Heart, Ruler, Weight, AlertCircle, LogOut, Trash2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";

const disabilityOptions = ["Non-Hearing", "Non-Verbal", "Both"];

interface ProfileData {
  fullName: string;
  age: string;
  country: string;
  phoneNumber: string;
  height: string;
  weight: string;
  disabilityType: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  profilePhoto: string;
  email?: string;
  profileComplete?: boolean;
}

const defaultProfile: ProfileData = {
  fullName: "",
  age: "",
  country: "",
  phoneNumber: "",
  height: "",
  weight: "",
  disabilityType: "Non-Hearing",
  emergencyContactName: "",
  emergencyContactNumber: "",
  profilePhoto: "",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileData>(defaultProfile);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data() as ProfileData;
            setFormData({
              ...defaultProfile,
              ...data,
            });
            setIsNewUser(!data.profileComplete);
            if (!data.profileComplete) setIsEditing(true);
          } else {
            setFormData({
              ...defaultProfile,
              fullName: user.displayName || "",
              profilePhoto: user.photoURL || "",
              email: user.email || "",
            });
            setIsNewUser(true);
            setIsEditing(true);
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
          setIsNewUser(true);
          setIsEditing(true);
        }
      } else {
        setIsNewUser(true);
        setIsEditing(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setError("Photo must be under 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePhoto: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) { setError("Full Name is required"); return false; }
    if (!formData.age.trim()) { setError("Age is required"); return false; }
    if (!formData.country.trim()) { setError("Country/Region is required"); return false; }
    if (!formData.phoneNumber.trim()) { setError("Phone Number is required"); return false; }
    if (!formData.height.trim()) { setError("Height is required"); return false; }
    if (!formData.weight.trim()) { setError("Weight is required"); return false; }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setError("");

    const dataToSave = {
      ...formData,
      profileComplete: true,
      updatedAt: new Date().toISOString(),
    };

    if (userId) {
      try {
        await setDoc(doc(db, "users", userId), dataToSave, { merge: true });
      } catch (err: any) {
        setError("Failed to save: " + err.message);
        setSaving(false);
        return;
      }
    }

    localStorage.setItem("userProfile", JSON.stringify(dataToSave));
    setSaving(false);
    setIsEditing(false);

    if (isNewUser) {
      setIsNewUser(false);
      router.push("/settings");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId || !auth.currentUser) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      await deleteUser(auth.currentUser);
      router.push("/");
    } catch (err: any) {
      setError("Failed to delete account. You may need to log in again first.");
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const inputClass = "w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--text-tertiary)] focus:ring-1 focus:ring-[var(--text-tertiary)] outline-none text-[var(--text-primary)] text-sm transition-all disabled:opacity-60 disabled:bg-[var(--bg-primary)] disabled:cursor-not-allowed";
  const selectClass = "w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--text-tertiary)] focus:ring-1 focus:ring-[var(--text-tertiary)] outline-none text-[var(--text-primary)] text-sm transition-all appearance-none disabled:opacity-60 disabled:bg-[var(--bg-primary)] disabled:cursor-not-allowed";

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pb-24 md:pt-6 px-6">
      {!isNewUser && <Navbar />}

      <div className="max-w-2xl mx-auto pt-6">
        {/* Header */}
        {isNewUser ? (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="heading-xl text-[var(--text-primary)] mb-2">{t("profile.complete") || "Complete Profile"}</h1>
            <p className="body-sm text-[var(--text-secondary)]">{t("profile.tellUs") || "Tell us a bit about yourself"}</p>
          </motion.div>
        ) : (
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-2xl font-semibold ml-2 text-[var(--text-primary)]">{t("profile.title") || "Profile"}</h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium border border-[var(--border-subtle)] outline-none focus-ring"
              >
                <Edit3 size={14} /> {t("profile.edit") || "Edit"}
              </button>
            )}
          </header>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center shadow-sm">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-[var(--text-tertiary)]" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--text-primary)] border-2 border-[var(--bg-primary)] flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-sm focus-ring">
                  <Camera size={14} className="text-[var(--bg-primary)]" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
            {formData.email && (
              <p className="text-xs font-medium text-[var(--text-secondary)] mt-3">{formData.email}</p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-xl text-[var(--accent-red)] text-xs text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Sections */}
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
            
            {/* Personal Information */}
            <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 text-[var(--text-primary)] uppercase tracking-wider">
                <User size={16} className="text-[var(--text-secondary)]" /> {t("profile.personal") || "Personal Information"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t("profile.fullName") || "Full Name"}</label>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t("profile.age") || "Age"}</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                       {t("profile.country") || "Country"}
                    </label>
                    <input
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                    {t("profile.phone") || "Phone Number"}
                  </label>
                  <input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 text-[var(--text-primary)] uppercase tracking-wider">
                <Heart size={16} className="text-[var(--accent-red)]" /> {t("profile.health") || "Health Information"}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                      {t("profile.height") || "Height (cm)"}
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                       {t("profile.weight") || "Weight (kg)"}
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                    {t("profile.disability") || "Disability Type"}
                  </label>
                  <div className="relative">
                    <select
                      name="disabilityType"
                      value={formData.disabilityType}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={selectClass}
                    >
                      {disabilityOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 text-[var(--text-primary)] uppercase tracking-wider">
                <Phone size={16} className="text-[var(--accent-green)]" /> {t("profile.emergency") || "Emergency Contact"}
                <span className="text-[10px] text-[var(--text-tertiary)] font-normal normal-case ml-1">({t("profile.optional") || "Optional"})</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t("profile.contactName") || "Contact Name"}</label>
                  <input
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{t("profile.contactNumber") || "Contact Number"}</label>
                  <input
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              {!isNewUser && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors focus-ring"
                >
                  {t("profile.cancel") || "Cancel"}
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 focus-ring"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    {isNewUser ? (t("profile.saveCont") || "Save & Continue") : (t("profile.save") || "Save Changes")}
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Account Management */}
          {!isNewUser && !isEditing && (
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium transition-colors shadow-sm focus-ring"
              >
                <LogOut size={16} />
                {t("profile.logout") || "Log Out"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--accent-red)]/10 text-[var(--accent-red)] font-medium transition-colors shadow-sm focus-ring"
              >
                <Trash2 size={16} />
                {t("profile.delete") || "Delete Account"}
              </button>
            </div>
          )}

        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xl max-w-sm w-full p-6 rounded-3xl flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center text-[var(--accent-red)] mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-[var(--text-primary)]">{t("profile.delete") || "Delete Account"}</h3>
              <p className="text-[var(--text-secondary)] text-center text-sm mb-6 leading-relaxed">
                {t("profile.delConfirm") || "Are you sure you want to delete your account? This action cannot be undone."}
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium focus-ring"
                >
                  {t("profile.cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-red)] text-white hover:bg-red-600 transition-colors text-sm font-medium focus-ring shadow-sm"
                >
                  {t("profile.yesDel") || "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

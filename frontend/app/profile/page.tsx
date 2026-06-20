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

const disabilityOptions = ["Non-Hearing", "Non-Verbal", "Both", "None"];

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
  disabilityType: "None",
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
            // Brand new user
            setFormData({
              ...defaultProfile,
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
        // Not logged in
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
      // Delete user data from firestore
      await deleteDoc(doc(db, "users", userId));
      // Delete auth account
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
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const inputClass = "w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const selectClass = "w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white transition-all appearance-none [&>option]:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <main className="min-h-screen p-6 pb-24 md:pt-24 relative overflow-x-hidden">
      {!isNewUser && <Navbar />}

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="max-w-xl mx-auto">
        {/* Header */}
        {isNewUser ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2 text-gradient">{t("profile.complete")}</h1>
            <p className="text-slate-400">{t("profile.tellUs")}</p>
          </motion.div>
        ) : (
          <header className="flex items-center justify-between mb-8 mt-2">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <h1 className="text-2xl font-bold ml-2">{t("profile.title")}</h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors text-sm font-medium"
              >
                <Edit3 size={16} /> {t("profile.edit")}
              </button>
            )}
          </header>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-500" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer hover:bg-purple-500 transition-colors shadow-lg">
                  <Camera size={14} className="text-white" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
            {formData.email && (
              <p className="text-xs text-slate-500 mt-2">{formData.email}</p>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personal Information */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-400">
              <User size={20} /> {t("profile.personal")}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t("profile.fullName")}</label>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">{t("profile.age")}</label>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin size={14} /> {t("profile.country")}
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
                <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Phone size={14} /> {t("profile.phone")}
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
          </section>

          {/* Health Information */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-emerald-400">
              <Heart size={20} /> {t("profile.health")}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Ruler size={14} /> {t("profile.height")}
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
                  <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Weight size={14} /> {t("profile.weight")}
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
                <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <AlertCircle size={14} /> {t("profile.disability")}
                </label>
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
          </section>

          {/* Emergency Contact */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-400">
              <Phone size={20} /> {t("profile.emergency")}
              <span className="text-xs text-slate-500 font-normal">{t("profile.optional")}</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t("profile.contactName")}</label>
                <input
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{t("profile.contactNumber")}</label>
                <input
                  name="emergencyContactNumber"
                  value={formData.emergencyContactNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4">
              {!isNewUser && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium border border-white/10 hover:bg-white/10 transition-all"
                >
                  {t("profile.cancel")}
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    {isNewUser ? t("profile.saveCont") : t("profile.save")}
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Account Management */}
          {!isNewUser && !isEditing && (
            <section className="glass-card p-6 mt-8 border-t border-white/5">
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all"
                >
                  <LogOut size={18} />
                  {t("profile.logout")}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all"
                >
                  <Trash2 size={18} />
                  {t("profile.delete")}
                </button>
              </div>
            </section>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card max-w-sm w-full p-6 border-red-500/20"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-4 mx-auto">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">{t("profile.delete")}</h3>
              <p className="text-slate-300 text-center text-sm mb-6">
                {t("profile.delConfirm")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 transition-colors text-white text-sm font-medium"
                >
                  {t("profile.yesDel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

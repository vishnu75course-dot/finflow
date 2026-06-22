import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Sliders, AlertTriangle, Wallet, 
  Upload, Save, LogOut, Trash2, CheckCircle, X, ChevronDown 
} from 'lucide-react';
import { useData } from '../DataContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, updateUser, darkMode, setDarkMode, logout } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({ show: false, message: '', type: 'success' });
  const [showDangerModal, setShowDangerModal] = useState(false);

  // States for each section
  const [profile, setProfile] = useState({
    fullName: user?.name || 'User',
    email: user?.email || '',
    profileImage: user?.profileImage || ''
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.name || 'User',
        email: user.email || '',
        profileImage: user.profileImage || ''
      });
      setFinancial(prev => ({
        ...prev,
        currency: user.currency || '₹',
        monthly_income: user.monthlyIncome || 50000
      }));
    }
  }, [user]);

  const [preferences, setPreferences] = useState({
    theme: darkMode ? 'dark' : 'light',
    language: 'en',
    timezone: 'Asia/Kolkata'
  });

  const [financial, setFinancial] = useState({
    currency: user?.currency || '₹',
    monthly_income: user?.monthlyIncome || 50000,
    default_categories: 'Food, Travel, Bills'
  });

  // Track initial state to disable/enable save button
  const [initialProfile, setInitialProfile] = useState(profile);
  const [initialPreferences, setInitialPreferences] = useState(preferences);
  const [initialFinancial, setInitialFinancial] = useState(financial);

  // Sync preference theme toggle with global dark mode
  useEffect(() => {
    setPreferences(prev => ({ ...prev, theme: darkMode ? 'dark' : 'light' }));
  }, [darkMode]);

  const tabs = [
    { id: 'Profile', icon: User },
    { id: 'Preferences', icon: Sliders },
    { id: 'Financial', icon: Wallet },
    { id: 'Danger Zone', icon: AlertTriangle, danger: true },
  ];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfile(prev => ({ ...prev, profileImage: dataUrl }));
      // Also persist immediately to user context
      updateUser({ profileImage: dataUrl });
      showToast('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!profile.fullName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!profile.email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      // Update user globally in DataContext → Sidebar updates instantly
      updateUser({ name: profile.fullName, email: profile.email });
      setIsSaving(false);
      setInitialProfile(profile);
      showToast('Profile updated successfully');
    }, 800);
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setInitialPreferences(preferences);
      showToast('Preferences updated successfully');
    }, 800);
  };

  const handleSaveFinancial = () => {
    setIsSaving(true);
    setTimeout(() => {
      // Update currency globally in DataContext
      updateUser({ currency: financial.currency, monthlyIncome: financial.monthly_income });
      setIsSaving(false);
      setInitialFinancial(financial);
      showToast('Financial settings saved');
    }, 800);
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'Profile':
        const profileChanged = JSON.stringify(profile) !== JSON.stringify(initialProfile);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Profile Information</h3>
              <p className="text-sm text-slate-500">Update your personal details and public profile.</p>
            </div>
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md shrink-0">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-slate-400" />
                  )}
                </div>
                <div>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                  >
                    <Upload size={16} /> Upload New Picture
                  </button>
                  <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={!profileChanged || isSaving}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${profileChanged ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      case 'Preferences':
        const prefChanged = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-xl font-bold text-slate-900">App Preferences</h3>
              <p className="text-sm text-slate-500">Customize how the application looks and behaves.</p>
            </div>
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Dark Mode</h4>
                    <p className="text-xs text-slate-500">Toggle between light and dark themes</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newDark = preferences.theme === 'light';
                      setDarkMode(newDark); // ← Updates globally across the entire app instantly
                      setPreferences({...preferences, theme: newDark ? 'dark' : 'light'});
                    }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${preferences.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Language</label>
                    <div className="relative">
                      <select 
                        value={preferences.language}
                        onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all cursor-pointer"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="hi">Hindi (India)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Timezone</label>
                    <div className="relative">
                      <select 
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all cursor-pointer"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="UTC">UTC</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSavePreferences}
                  disabled={!prefChanged || isSaving}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${prefChanged ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <Save size={16} /> Save Preferences
                </button>
              </div>
            </div>
          </div>
        );
      case 'Financial':
        const finChanged = JSON.stringify(financial) !== JSON.stringify(initialFinancial);
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Financial Settings</h3>
              <p className="text-sm text-slate-500">Crucial metrics used for your AI insights and budgeting.</p>
            </div>
            <div className="glass-card p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Base Currency</label>
                  <div className="relative">
                    <select 
                      value={financial.currency}
                      onChange={(e) => setFinancial({...financial, currency: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all cursor-pointer"
                    >
                      <option value="₹">INR (₹)</option>
                      <option value="$">USD ($)</option>
                      <option value="€">EUR (€)</option>
                      <option value="£">GBP (£)</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Monthly Income</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">{financial.currency}</span>
                    <input 
                      type="number" 
                      value={financial.monthly_income}
                      onChange={(e) => setFinancial({...financial, monthly_income: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Default Categories (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={financial.default_categories}
                    onChange={(e) => setFinancial({...financial, default_categories: e.target.value})}
                    placeholder="e.g. Food, Transport, Utilities"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Used for quickly categorizing new transactions and setting budget envelopes.</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleSaveFinancial}
                  disabled={!finChanged || isSaving}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${finChanged ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <Save size={16} /> Save Financials
                </button>
              </div>
            </div>
          </div>
        );
      case 'Danger Zone':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-xl font-bold text-rose-600">Danger Zone</h3>
              <p className="text-sm text-slate-500">Destructive actions for your account.</p>
            </div>
            <div className="glass-card p-6 space-y-6 border border-rose-100 bg-rose-50/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-rose-100 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                    <LogOut size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Logout Everywhere</h4>
                    <p className="text-xs text-slate-500">Sign out from all active devices and sessions.</p>
                  </div>
                </div>
                <button onClick={() => showToast('Logged out of all devices')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors whitespace-nowrap">
                  Logout All Devices
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-rose-100 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-rose-600">Delete Account</h4>
                    <p className="text-xs text-slate-500">Permanently delete your data and account.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDangerModal(true)}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-200 transition-colors whitespace-nowrap"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-white border-rose-100 text-rose-600' : 'bg-slate-900 border-slate-800 text-white'}`}
          >
            {toast.type === 'error' ? <AlertTriangle size={20} className="text-rose-500 shrink-0" /> : <CheckCircle size={20} className="text-emerald-400 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger Modal */}
      <AnimatePresence>
        {showDangerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <button onClick={() => setShowDangerModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Are you absolutely sure?</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                This action cannot be undone. This will permanently delete your account, remove all your financial data, and purge your history from our servers.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter password to confirm"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowDangerModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => { 
                    setShowDangerModal(false); 
                    showToast('Account deleted', 'error');
                    setTimeout(() => {
                      logout();
                      navigate('/login');
                    }, 1000);
                  }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-200 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Settings</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage your account preferences and application configuration.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 glass-card p-3 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id 
                  ? tab.danger 
                    ? 'bg-rose-50 text-rose-600' 
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : tab.danger 
                    ? 'text-rose-500 hover:bg-rose-50/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <tab.icon size={18} />
              {tab.id}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft,
  Hospital,
  AlertCircle,
  Server
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_USERS, SITES_DATA, CURRENT_ORGANIZATION } from '../data/mockData';
import { User as UserType } from '../types';

export const LoginView: React.FC = () => {
  const { login, loginAsDemoUser } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState(SITES_DATA[0]!.id);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login(username, password, selectedSiteId);
      if (!res.success) {
        setErrorMessage(res.message || 'نام کاربری یا کلمه عبور نادرست است.');
      }
    } catch {
      setErrorMessage('خطای غیرمنتظره در برقراری ارتباط با کارگزار احراز هویت.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoUser: UserType) => {
    loginAsDemoUser(demoUser);
  };

  return (
    <div dir="rtl" className="min-h-screen w-full bg-slate-900 flex flex-col justify-between relative overflow-hidden text-slate-100 text-start">
      {/* Background ambient medical grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top minimal header */}
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
            H
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
              <bdi dir="ltr">HIM-OS</bdi>
            </h1>
            <p className="text-xs text-slate-400">
              سامانه یکپارچه مدیریت و هوشمندی سلامت دانشگاه علوم پزشکی شهید بهشتی
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg">
          <Server className="w-3.5 h-3.5 text-teal-400" />
          <span>محیط استقرار: اینترانت محلی بیمارستان (<bdi dir="ltr">On-Premises</bdi>)</span>
        </div>
      </header>

      {/* Main card container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left panel (Form) */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-200/80 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-teal-700 tracking-wider">
                  درگاه احراز هویت متمرکز (<bdi dir="ltr">SSO / OIDC</bdi>)
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  ورود به سامانه <bdi dir="ltr">HIM-OS</bdi>
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  لطفاً با شناسه پرسنلی یا نام کاربری احراز هویت دانشگاهی وارد شوید.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personnel ID / Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    نام کاربری یا شماره پرسنلی
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      dir="auto"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="مثال: 984120 یا zali@sbmu.ac.ir"
                      className="w-full pr-10 pl-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    کلمه عبور
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="auto"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="کلمه عبور (پیش‌فرض دمو: sbmu1405 یا 123456)"
                      className="w-full pr-10 pl-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute left-3 top-1/2 -translate-y-1/2"
                      title={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Default Initial Site */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    سایت بیمارستانی اولیه
                  </label>
                  <div className="relative">
                    <Hospital className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full pr-10 pl-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-slate-800"
                    >
                      {SITES_DATA.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name} ({'\u2066'}{site.code}{'\u2069'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span>ذخیره نشست امن در این دستگاه</span>
                  </label>
                  <span className="text-teal-700 font-semibold cursor-pointer hover:underline">
                    فراموشی رمز عبور؟
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <span>در حال اعتبارسنجی و ورود...</span>
                  ) : (
                    <>
                      <span>ورود به محیط هوشمندی سلامت</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom trust seal */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>جداسازی امنیتی <bdi dir="ltr">RLS</bdi> و توکن‌های کنترل دسترسی</span>
              </div>
              <span>پایلوت شهریور ۱۴۰۵</span>
            </div>
          </div>

          {/* Right panel (Enterprise Info & Quick Demo Logins) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 md:p-8 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-teal-400">
                  ارزیابی سریع نقش‌ها (مرحله ۱)
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  ورود سریع با کاربران نمونه
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  جهت راستی‌آزمایی تفکیک <bdi dir="ltr">Scope</bdi>، می‌توانید روی هر حساب کلیک کنید (رمز عبور آزمایشی: <bdi dir="ltr"><code className="text-teal-300 font-mono">sbmu1405</code></bdi> یا <bdi dir="ltr"><code className="text-teal-300 font-mono">123456</code></bdi>):
                </p>
              </div>

              {/* Demo users list */}
              <div className="space-y-2">
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="w-full text-right p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-700/60 hover:border-teal-500/60 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                        {demo.name}
                      </div>
                      <div className="text-[11px] text-teal-400 font-medium">
                        {demo.roleTitle}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {demo.department}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono mt-0.5 shrink-0">
                      {demo.permittedSiteIds.length > 1 ? 'همه سایت‌ها' : 'سایت منفرد'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* University & Hospital scope badge */}
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span>{CURRENT_ORGANIZATION.name}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                پوشش شبکه بیمارستان‌های آموزشی درمانی آیت‌الله طالقانی، امام حسین (ع)، شهدای تجریش، مفید و ستاد مرکزی دانشگاه.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-800 relative z-10">
        کلیه حقوق این سامانه متعلق به دانشگاه علوم پزشکی و خدمات بهداشتی درمانی شهید بهشتی می‌باشد · <bdi dir="ltr">HIM-OS v1.2</bdi>
      </footer>
    </div>
  );
};

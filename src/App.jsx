import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, LogOut, Lightbulb, Home, FolderKanban, Trophy, Bell, User } from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabase';

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      if (!supabaseConfigured) throw new Error('أكمل إعداد Supabase في ملف .env.local أولاً.');
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        if (data.session) onAuth(data.user);
        else setMessage('تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب إذا كان تأكيد البريد مفعلاً.');
      }
    } catch (err) {
      setMessage(err.message || 'حدث خطأ.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-card">
      <div className="brand"><div className="brand-icon"><Lightbulb size={30}/></div><div><b>فكرتك مشروعك</b><small>من فكرة إلى مشروع</small></div></div>
      <h1>{mode === 'login' ? 'مرحباً بك' : 'إنشاء حساب جديد'}</h1>
      <p className="muted">{mode === 'login' ? 'سجل الدخول للمتابعة' : 'أنشئ حسابك وابدأ رحلتك'}</p>
      <form onSubmit={submit}>
        {mode === 'register' && <label>الاسم<input value={name} onChange={e=>setName(e.target.value)} placeholder="اكتب اسمك" required/></label>}
        <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@email.com" required/></label>
        <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" minLength="6" required/></label>
        <button className="primary" disabled={busy}>{mode === 'login' ? <><LogIn size={19}/> تسجيل الدخول</> : <><UserPlus size={19}/> إنشاء الحساب</>}</button>
      </form>
      {mode === 'login' && <button className="link" onClick={()=>setMessage('ميزة إعادة تعيين كلمة المرور سنربطها بالخطوة التالية.')}>نسيت كلمة المرور؟</button>}
      {message && <div className="notice">{message}</div>}
      <div className="switch">{mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'} <button className="link inline" onClick={()=>{setMode(mode==='login'?'register':'login');setMessage('')}}>{mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</button></div>
      <div className="demo-note">التسجيل والدخول مرتبطان بـ Supabase Auth عند وضع بيانات مشروعك في .env.local.</div>
    </section>
  </main>
}

function Dashboard({ user, onLogout }) {
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مستخدم';
  return <div className="app-shell">
    <header className="topbar"><div className="brand compact"><div className="brand-icon"><Lightbulb size={23}/></div><div><b>فكرتك مشروعك</b><small>من فكرة إلى مشروع</small></div></div><button className="logout" onClick={onLogout}><LogOut size={18}/> خروج</button></header>
    <main className="dashboard">
      <section className="hero"><div><span className="eyebrow">أهلاً بك</span><h1>مرحباً {name}</h1><p>معاً نحو أفكار تصنع المستقبل</p></div><div className="hero-bulb"><Lightbulb size={58}/></div></section>
      <section className="quick-grid">
        <div className="feature"><Trophy/><b>المسابقات الحالية</b><span>اكتشف الفرص</span></div>
        <div className="feature"><FolderKanban/><b>أفكاري ومشاريعي</b><span>تابع مشاريعك</span></div>
        <div className="feature"><Home/><b>أفكار محافظتي</b><span>استكشف المشاريع</span></div>
        <div className="feature"><Bell/><b>الإشعارات</b><span>آخر التحديثات</span></div>
      </section>
      <section className="card"><h2>حسابك</h2><p>البريد الإلكتروني: <strong>{user.email}</strong></p><p>المعرّف: <code>{user.id}</code></p></section>
    </main>
    <nav className="bottom-nav"><span><Home/>الرئيسية</span><span><FolderKanban/>المشاريع</span><span><Trophy/>المسابقات</span><span><Bell/>الإشعارات</span><span><User/>حسابي</span></nav>
  </div>
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (loading) return <div className="loading">جاري التحميل...</div>;
  if (!user) return <AuthScreen onAuth={setUser}/>;
  return <Dashboard user={user} onLogout={async()=>{await supabase.auth.signOut();setUser(null)}}/>;
}

import React, { useEffect, useState } from 'react';
import { LogIn, UserPlus, LogOut, Lightbulb, Home, FolderKanban, Trophy, Bell, User, Trash2, ArrowRight } from 'lucide-react';
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
        <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="********" minLength="6" required/></label>
        <button className="primary" disabled={busy}>{mode === 'login' ? <><LogIn size={19}/> تسجيل الدخول</> : <><UserPlus size={19}/> إنشاء الحساب</>}</button>
      </form>
      {mode === 'login' && <button className="link" onClick={()=>setMessage('ميزة إعادة تعيين كلمة المرور سنربطها بالخطوة التالية.')}>نسيت كلمة المرور؟</button>}
      {message && <div className="notice">{message}</div>}
      <div className="switch">{mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'} <button className="link inline" onClick={()=>{setMode(mode==='login'?'register':'login');setMessage('')}}>{mode === 'login' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</button></div>
      <div className="demo-note">التسجيل والدخول مرتبطان بـ Supabase Auth عند وضع بيانات مشروعك في .env.local.</div>
    </section>
  </main>
}

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1px solid #d8e0ee',
  borderRadius: 12, font: 'inherit', marginBottom: 12, boxSizing: 'border-box'
};   function IdeasPage({ onBack }) {
  const [ideas, setIdeas] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    const { data, error } = await supabase
      .from('ideas').select('*').order('created_at', { ascending: false });
    if (error) setMessage('تعذر تحميل الأفكار: ' + error.message);
    else setIdeas(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addIdea(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase
      .from('ideas').insert({ title: title.trim(), description: description.trim() });
    if (error) setMessage('تعذر حفظ الفكرة: ' + error.message);
    else { setTitle(''); setDescription(''); await load(); }
    setBusy(false);
  }

  async function removeIdea(id) {
    if (!window.confirm('هل تريد حذف هذه الفكرة؟')) return;
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) setMessage('تعذر الحذف: ' + error.message);
    else setIdeas(ideas.filter(i => i.id !== id));
  }

  return <>
    <button className="link" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <ArrowRight size={18}/> رجوع
    </button>
    <section className="card">
      <h2>أفكاري ومشاريعي</h2>
      <form onSubmit={addIdea}>
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الفكرة" required/>
        <textarea style={{ ...inputStyle, minHeight: 90 }} value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف الفكرة (اختياري)"/>
        <button className="primary" disabled={busy}>{busy ? 'جاري الحفظ...' : 'إضافة الفكرة'}</button>
      </form>
      {message && <div className="notice">{message}</div>}
    </section>
    <section className="card" style={{ marginTop: 14 }}>
      <h2>قائمة أفكاري</h2>
      {loading && <p>جاري التحميل...</p>}
      {!loading && ideas.length === 0 && <p>لا توجد أفكار بعد. أضف أول فكرة لك!</p>}
      {ideas.map(idea => (
        <div key={idea.id} style={{ borderTop: '1px solid #e6ecf5', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <b>{idea.title}</b>
            {idea.description && <p style={{ margin: '6px 0 0' }}>{idea.description}</p>}
          </div>
          <button className="link" onClick={() => removeIdea(idea.id)} aria-label="حذف"><Trash2 size={19}/></button>
        </div>
      ))}
    </section>
  </>
}  function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState('home');
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مستخدم';
  const tap = { cursor: 'pointer' };
  return <div className="app-shell">
    <header className="topbar"><div className="brand compact"><div className="brand-icon"><Lightbulb size={23}/></div><div><b>فكرتك مشروعك</b><small>من فكرة إلى مشروع</small></div></div><button className="logout" onClick={onLogout}><LogOut size={18}/> خروج</button></header>
    <main className="dashboard">
      {page === 'ideas' ? <IdeasPage onBack={() => setPage('home')}/> : <>
      <section className="hero"><div><span className="eyebrow">أهلاً بك</span><h1>مرحباً {name}</h1><p>معاً نحو أفكار تصنع المستقبل</p></div><div className="hero-bulb"><Lightbulb size={58}/></div></section>
      <section className="quick-grid">
        <div className="feature"><Trophy/><b>المسابقات الحالية</b><span>اكتشف الفرص</span></div>
        <div className="feature" style={tap} onClick={() => setPage('ideas')}><FolderKanban/><b>أفكاري ومشاريعي</b><span>تابع مشاريعك</span></div>
        <div className="feature"><Home/><b>أفكار محافظتي</b><span>استكشف المشاريع</span></div>
        <div className="feature"><Bell/><b>الإشعارات</b><span>آخر التحديثات</span></div>
      </section>
      <section className="card"><h2>حسابك</h2><p>البريد الإلكتروني: <strong>{user.email}</strong></p><p>المعرّف: <code>{user.id}</code></p></section>
      </>}
    </main>
    <nav className="bottom-nav"><span style={tap} onClick={() => setPage('home')}><Home/>الرئيسية</span><span style={tap} onClick={() => setPage('ideas')}><FolderKanban/>المشاريع</span><span><Trophy/>المسابقات</span><span><Bell/>الإشعارات</span><span><User/>حسابي</span></nav>
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

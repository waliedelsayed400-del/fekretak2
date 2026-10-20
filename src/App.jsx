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
      <p className="muted">{mode === 'login' ? 'سجل الدخول للمتابعة'

import React from 'react'
import { useEffect, useState, useCallback } from 'react'
import * as sbm from './lib/supabase'  
import { AdsSlot, AdsAdmin } from './Ads'
const supabase = sbm.supabase || sbm.default

const GOVS = ['القاهرة','الجيزة','الإسكندرية','القليوبية','الشرقية','الدقهلية','الغربية','المنوفية','البحيرة','كفر الشيخ','دمياط','بورسعيد','الإسماعيلية','السويس','شمال سيناء','جنوب سيناء','الفيوم','بني سويف','المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد','مطروح']

const STEPS = [
  ['1️⃣','سجّل فكرتك','اكتب المشروع بالتفصيل وطريقة التنفيذ والميزانية المتوقعة.'],
  ['2️⃣','الفحص والمراجعة','نراجع الفكرة ومدى وضوحها وقابليتها للتنفيذ واحتياج السوق.'],
  ['3️⃣','المعاينة','الأفكار المؤهلة قد تنتقل للمعاينة ودراسة المشروع بصورة أعمق.'],
  ['4️⃣','رأي الجمهور','الجمهور يشارك في تقييم الأفكار المؤهلة بجانب التقييم وفق المعايير المعلنة.'],
  ['5️⃣','من المحافظات للجمهورية','أفضل الأفكار تمثل محافظاتها وتدخل المنافسة على مستوى الجمهورية وفق نظام المسابقة.'],
  ['6️⃣','من فكرة لمشروع','الفائزون يحصلون على فرصة للدعم والتوجيه والتسويق وفق البرامج المتاحة.'],
]

const CATS = [
  ['🍔','أكل ومشروبات','وجبات منزلية، منتجات غذائية، مطبخ إنتاجي، عربات طعام، أو خدمة توصيل متخصصة.'],
  ['🌱','زراعة وإنتاج','زراعة حديثة، مشاتل، منتجات زراعية مصنعة، تدوير المخلفات الزراعية.'],
  ['♻️','إعادة تدوير','جمع وفرز وإعادة استخدام البلاستيك والورق والمخلفات وتحويلها لمنتجات.'],
  ['📱','تكنولوجيا وخدمات','تطبيقات، منصات، خدمات رقمية، تعليم إلكتروني، أو حلول لمشكلة محلية.'],
  ['🧵','تصنيع وحرف','ملابس، إكسسوارات، أثاث، منتجات يدوية، وتطوير الحرف المحلية.'],
  ['🚚','خدمات ونقل','خدمات توصيل، صيانة، خدمات منزلية، أو حلول لاحتياجات المناطق والمحافظات.'],
]

const STATUS = { pending: 'قيد مراجعة الدفع', approved: 'مقبولة', rejected: 'مرفوضة' }

const CSS = `
.fk{direction:rtl;min-height:100vh;font-family:'Segoe UI',Tahoma,'Noto Sans Arabic',system-ui,sans-serif;color:#1e293b;background:linear-gradient(180deg,#eaf4ff 0%,#f8f6ec 55%,#fdf1ef 100%);padding-bottom:40px}
.fk *{box-sizing:border-box}
.fk h1,.fk h2,.fk h3,.fk p{margin:0}
.fk-head{background:linear-gradient(135deg,#1e3a8a,#2b7de9 60%,#38bdf8);color:#fff;padding:26px 20px 30px;border-radius:0 0 34px 34px}
.fk-head h1{font-size:28px}
.fk-head p{opacity:.9;margin-top:6px}
.fk-nav{display:flex;gap:8px;padding:14px 12px;overflow-x:auto}
.fk-pill{flex:none;border:0;cursor:pointer;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:11px 16px;border-radius:18px;background:linear-gradient(135deg,#a855f7,#ec4899);box-shadow:0 6px 14px rgba(168,85,247,.3)}
.fk-sec{background:#fff;margin:14px 12px;padding:20px 16px;border-radius:26px;box-shadow:0 8px 24px rgba(30,58,138,.07)}
.fk-sec h2{font-size:23px;color:#1e3a8a;margin-bottom:12px}
.fk-lead{font-weight:700;line-height:2;font-size:15px}
.fk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px}
.fk-card{border:1px solid #dbe7fb;border-radius:22px;padding:14px;background:#fff}
.fk-card h3{font-size:15px;color:#2563eb;margin-bottom:6px}
.fk-card p{font-size:13px;line-height:1.8;color:#475569}
.fk-green{margin:14px 12px;padding:16px;border-radius:22px;border-right:5px solid #22c55e;background:linear-gradient(135deg,#e6fbef,#e0f2fe);line-height:1.9;font-size:14px}
.fk-fee{border:2px dashed #fb923c;border-radius:22px;padding:16px;background:linear-gradient(135deg,#fff1e0,#ffe4ec);line-height:1.9;font-size:14px;margin:14px 0}
.fk-fee b{color:#c2410c}
.fk-lock{margin:14px 12px;padding:16px;border-radius:22px;border:2px solid #86efac;background:linear-gradient(135deg,#e0f0ff,#e6fbf5);line-height:1.9;font-size:14px}
.fk-lock h3{color:#166534;font-size:18px;margin-bottom:8px}
.fk-small{font-size:12px;color:#64748b}
.fk-note{padding:14px;border-radius:18px;border-right:5px solid #fb923c;background:#fff4ea;font-size:14px;line-height:1.9;margin-top:10px}
.fk label{display:block;font-size:14px;margin:12px 0 6px}
.fk input,.fk select,.fk textarea{width:100%;font:inherit;padding:12px 14px;border:1px solid #cddcf5;border-radius:16px;background:#fff;color:#1e293b}
.fk textarea{min-height:110px;resize:vertical}
.fk input:focus,.fk select:focus,.fk textarea:focus{outline:2px solid #f59e0b;outline-offset:1px}
.fk-btn{border:0;cursor:pointer;font:inherit;font-weight:700;padding:12px 20px;border-radius:16px;color:#fff;background:linear-gradient(135deg,#2563eb,#38bdf8);margin-top:14px}
.fk-btn.g{background:linear-gradient(135deg,#22c55e,#86efac);color:#14532d}
.fk-btn.o{background:linear-gradient(135deg,#fb923c,#fde047);color:#7c2d12}
.fk-btn.r{background:#fee2e2;color:#b91c1c}
.fk-btn.s{padding:8px 14px;font-size:13px;margin-top:8px;margin-left:6px}
.fk-btn:disabled{opacity:.55;cursor:default}
.fk-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.fk-two{grid-template-columns:1fr}}
.fk-chat{height:260px;overflow-y:auto;border:1px solid #dbe7fb;border-radius:18px;padding:10px;background:#f7faff;margin-bottom:10px}
.fk-msg{padding:6px 4px;font-size:14px;border-bottom:1px solid #eef2f9}
.fk-msg b{color:#2563eb;margin-left:6px}
.fk-ad{border:2px dashed #cbd5e1;border-radius:18px;padding:14px;text-align:center;color:#64748b;font-size:13px;margin-top:12px}
.fk-ad b{display:block;color:#1e293b;margin-bottom:4px}
.fk-post{border:1px solid #dbe7fb;border-radius:18px;padding:14px;margin-top:10px}
.fk-post h3{font-size:16px;margin-bottom:4px}
.fk-post p{font-size:14px;line-height:1.8;white-space:pre-wrap}
.fk-tag{display:inline-block;font-size:12px;padding:3px 10px;border-radius:12px;background:#e0ecff;color:#1e40af;margin-left:6px}
.fk-tag.ok{background:#dcfce7;color:#166534}
.fk-tag.no{background:#fee2e2;color:#b91c1c}
.fk-toast{position:sticky;top:8px;z-index:9;margin:8px 12px;padding:12px 16px;border-radius:16px;background:#1e3a8a;color:#fff;font-size:14px}
.fk-empty{color:#64748b;font-size:14px;padding:8px 0}
`

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mine, setMine] = useState([])
  const [bank, setBank] = useState([])
  const [msgs, setMsgs] = useState([])
  const [posts, setPosts] = useState([])
  const [adminEntries, setAdminEntries] = useState([])
  const [adminPosts, setAdminPosts] = useState([])
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  const [form, setForm] = useState({ owner_name: '', phone: '', title: '', governorate: 'القاهرة', budget: '', description: '', payment_ref: '' })
  const [chatName, setChatName] = useState('')
  const [chatText, setChatText] = useState('')
  const [post, setPost] = useState({ author: '', title: '', body: '' })

  const subscriber = mine.some((e) => e.status === 'approved')
  const say = (t) => { setToast(t); setTimeout(() => setToast(''), 5000) }
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const loadPublic = useCallback(async () => {
    const a = await supabase.from('public_ideas').select('*').order('created_at', { ascending: false })
    if (a.data) setBank(a.data)
    const b = await supabase.from('community_messages').select('*').order('created_at', { ascending: false }).limit(50)
    if (b.data) setMsgs([...b.data].reverse())
    const c = await supabase.from('community_posts').select('*').eq('published', true).order('created_at', { ascending: false })
    if (c.data) setPosts(c.data)
  }, [])

  const loadPrivate = useCallback(async (uid) => {
    if (!uid) { setMine([]); setIsAdmin(false); setAdminEntries([]); setAdminPosts([]); return }
    const m = await supabase.from('idea_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (m.data) setMine(m.data)
    const adm = await supabase.rpc('is_admin')
    const admin = adm.data === true
    setIsAdmin(admin)
    if (admin) {
      const e = await supabase.from('idea_entries').select('*').order('created_at', { ascending: false })
      if (e.data) setAdminEntries(e.data)
      const p = await supabase.from('community_posts').select('*').eq('published', false).order('created_at', { ascending: false })
      if (p.data) setAdminPosts(p.data)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { loadPublic() }, [loadPublic])
  useEffect(() => { loadPrivate(session?.user?.id) }, [session, loadPrivate])
  useEffect(() => {
    const t = setInterval(() => loadPublic(), 20000)
    return () => clearInterval(t)
  }, [loadPublic])

  const refresh = async () => { await loadPublic(); await loadPrivate(session?.user?.id) }

  async function auth(e) {
    e.preventDefault()
    setBusy(true)
    const fn = mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp
    const { error } = await fn.call(supabase.auth, { email, password: pass })
    setBusy(false)
    if (error) say('تعذّر الدخول: ' + error.message)
    else say(mode === 'login' ? 'تم تسجيل الدخول' : 'تم إنشاء الحساب')
  }

  async function submitIdea(e) {
    e.preventDefault()
    if (!session) return say('سجّل دخولك الأول من قسم حسابي')
    const f = form
    if (!f.owner_name || !f.phone || !f.title || !f.description || !f.payment_ref) return say('كمّل كل الحقول، ومنها رقم مرجع التحويل')
    setBusy(true)
    const { error } = await supabase.from('idea_entries').insert({ ...f, budget: f.budget ? Number(f.budget) : null })
    setBusy(false)
    if (error) return say('تعذّر التسجيل: ' + error.message)
    setForm({ owner_name: '', phone: '', title: '', governorate: 'القاهرة', budget: '', description: '', payment_ref: '' })
    say('تم تسجيل فكرتك. هتتفعل بعد مراجعة التحويل.')
    refresh(); go('mine')
  }

  async function removeMine(id) {
    const { error } = await supabase.from('idea_entries').delete().eq('id', id)
    if (error) say('تعذّر الحذف: ' + error.message); else refresh()
  }

  async function sendMsg(e) {
    e.preventDefault()
    if (!subscriber) return say('للكتابة في الدردشة يجب الاشتراك')
    if (!chatName || !chatText) return
    const { error } = await supabase.from('community_messages').insert({ author: chatName, body: chatText })
    if (error) return say('تعذّر الإرسال: ' + error.message)
    setChatText(''); loadPublic()
  }

  async function sendPost(e) {
    e.preventDefault()
    if (!subscriber) return say('لنشر بوست يجب الاشتراك')
    if (!post.author || !post.title || !post.body) return
    const { error } = await supabase.from('community_posts').insert(post)
    if (error) return say('تعذّر النشر: ' + error.message)
    setPost({ author: '', title: '', body: '' })
    say('تم إرسال مشاركتك وتنتظر موافقة الإدارة.')
  }

  async function upd(table, id, patch) {
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) say('تعذّر التحديث: ' + error.message); else refresh()
  }
  async function del(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) say('تعذّر الحذف: ' + error.message); else refresh()
  }

  async function share() {
    const url = window.location.origin
    try {
      if (navigator.share) await navigator.share({ title: 'فكرتك مشروعك', text: 'من فكرة إلى مشروع', url })
      else { await navigator.clipboard.writeText(url); say('تم نسخ رابط المنصة') }
    } catch { /* cancelled */ }
  }
  if (!ready) return <div className="fk"><style>{CSS}</style><div className="fk-sec">جارٍ التحميل...</div></div>

  return (
    <div className="fk">
      <style>{CSS}</style>
      <header className="fk-head">
        <h1>💡 فكرتك مشروعك</h1>
        <p>من فكرة إلى مشروع 🇪🇬</p>
      </header>

      <nav className="fk-nav">
        <button className="fk-pill" onClick={() => go('account')}>👤 حسابي</button>
        <button className="fk-pill" onClick={() => go('register')}>📝 سجّل فكرتك</button>
        <button className="fk-pill" onClick={() => go('bank')}>💡 بنك الأفكار</button>
        <button className="fk-pill" onClick={() => go('community')}>💬 المجتمع</button>
        <button className="fk-pill" onClick={() => go('posts')}>📰 البوستات</button>
        <button className="fk-pill" onClick={() => go('mine')}>📂 أفكاري</button>
        {isAdmin && <button className="fk-pill" onClick={() => go('admin')}>⚙️ المدير</button>}
      </nav>

      {toast && <div className="fk-toast">{toast}</div>}

      <section className="fk-sec" id="about">
        <h2>هدف المنصة: نكتشف فكرتك ونمنحها فرصة حقيقية</h2>
        <p className="fk-lead">منصة «فكرتك مشروعك» تهدف لاكتشاف أصحاب الأفكار والمشروعات الواعدة من جميع محافظات مصر، وفحص الأفكار ومعاينتها حسب طبيعة المشروع، والاستفادة من رأي الجمهور، ثم اختيار أفضل الأفكار للمنافسة على مستوى الجمهورية.</p>
        <div className="fk-grid">
          {STEPS.map(([n, t, d]) => (
            <div className="fk-card" key={t}><h3>{n} {t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>

      <div className="fk-green">
        <b>🚀 ومش معنى إنك ماكسبتش إن فكرتك انتهت!</b><br />
        أفضل الأفكار الواعدة غير الفائزة يمكن أن نحتضنها ونساعد في تطويرها وتسويقها والوصول بها للسوق، وفق البرامج والفرص المتاحة.
      </div>

      <section className="fk-sec" id="account">
        <h2>👤 حسابي</h2>
        {session ? (
          <>
            <p className="fk-lead">أنت مسجّل بـ {session.user.email}</p>
            <p className="fk-small" style={{ marginTop: 8 }}>
              {subscriber ? '✅ اشتراكك مفعّل. تقدر تكتب في الدردشة وتنشر بوستات.' : 'اشتراكك لسه مش مفعّل. يتفعّل بعد مراجعة تحويل الـ 10 جنيه.'}
            </p>
            <button className="fk-btn r" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
          </>
        ) : (
          <form onSubmit={auth}>
            <label>البريد الإلكتروني</label>
            <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label>كلمة المرور</label>
            <input type="password" dir="ltr" value={pass} onChange={(e) => setPass(e.target.value)} minLength={6} required />
            <button className="fk-btn" disabled={busy}>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</button>
            <button type="button" className="fk-btn r" style={{ marginRight: 8 }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'معنديش حساب' : 'عندي حساب'}
            </button>
          </form>
        )}
      </section>

      <div className="fk-lock">
        <h3>🔐 اطمّن على فكرتك وحقوقك</h3>
        <p><b>تسجيل الفكرة لا يعني انتقال ملكيتها إلى المنصة.</b> وتظل حقوق صاحب الفكرة محفوظة وفقًا للقانون، ولا يتم استخدام أو تطوير أو تسويق الفكرة خارج نطاق المسابقة أو الخدمات المعلنة إلا وفق موافقة واتفاق واضح مع صاحبها.</p>
        <p style={{ marginTop: 8 }}>صاحب الفكرة يستطيع مراجعة بيانات فكرته وتعديلها من قسم «أفكاري» قبل وأثناء المراجعة، وفق حالة الفكرة وما تسمح به إجراءات المسابقة.</p>
        <p className="fk-small" style={{ marginTop: 8 }}>هذه صياغة تنظيمية مبدئية للمنصة، ويُفضّل مراجعتها واعتمادها من محامٍ مصري قبل الإطلاق التجاري النهائي.</p>
      </div>

      <section className="fk-sec">
        <h2>📜 حقوق وخصوصية أصحاب الأفكار</h2>
        <ul style={{ lineHeight: 2, fontSize: 14, paddingRight: 18, margin: 0 }}>
          <li>الفكرة تظل مملوكة لصاحبها، ولا تنتقل ملكيتها لمجرد تسجيلها.</li>
          <li>يقتصر استخدام بيانات الفكرة على أغراض المسابقة والخدمات المعلنة، مع مراعاة الموافقات والاتفاقات اللازمة.</li>
          <li>أي تبنٍّ أو تطوير أو تسويق أو شراكة مستقبلية مع صاحب الفكرة يتم وفق موافقة واتفاق واضح ومستقل.</li>
          <li>تُعامل البيانات الشخصية وفق الإطار القانوني المصري لحماية البيانات الشخصية، بما في ذلك قانون رقم 151 لسنة 2020 ولائحته التنفيذية رقم 816 لسنة 2025.</li>
        </ul>
        <div className="fk-note"><b>رسالتنا:</b> مافيش داعي للقلق من تسجيل فكرتك؛ هدف المنصة إعطاء الفكرة فرصة حقيقية، مع الحفاظ على حقوق صاحبها وعدم اعتبار التسجيل تنازلًا عن الملكية.</div>
      </section>

      <section className="fk-sec" id="register">
        <h2>📝 تسجيل فكرة مشروع</h2>
        <form onSubmit={submitIdea}>
          <div className="fk-two">
            <div><label>اسم صاحب الفكرة</label><input value={form.owner_name} onChange={setF('owner_name')} placeholder="الاسم" /></div>
            <div><label>رقم الهاتف</label><input dir="ltr" inputMode="tel" value={form.phone} onChange={setF('phone')} placeholder="01xxxxxxxxx" /></div>
          </div>
          <label>اسم المشروع</label>
          <input value={form.title} onChange={setF('title')} placeholder="مثال: مشروع إنتاج غذائي" />
          <div className="fk-two">
            <div><label>المحافظة</label>
              <select value={form.governorate} onChange={setF('governorate')}>{GOVS.map((g) => <option key={g}>{g}</option>)}</select>
            </div>
            <div><label>الميزانية المتوقعة</label><input inputMode="numeric" value={form.budget} onChange={setF('budget')} placeholder="بالجنيه" /></div>
          </div>
          <label>شرح الفكرة بالتفصيل</label>
          <textarea value={form.description} onChange={setF('description')} placeholder="اشرح المنتج أو الخدمة، العملاء، طريقة التنفيذ، وما الذي يميز المشروع..." />
          <div className="fk-fee">
            💰 رسوم الاشتراك: <b>10 جنيه</b><br />
            فودافون كاش: <b dir="ltr">01099156391</b><br />
            <span className="fk-small">الـ 10 جنيه رسوم اشتراك في المسابقة وتسجيل الفكرة واستخدام خدمات المشاركة، وليست سحبًا عشوائيًا للفوز. بيانات التحويل بتتراجع يدويًا.</span>
            <label>رقم/مرجع التحويل (بعد التحويل)</label>
            <input value={form.payment_ref} onChange={setF('payment_ref')} />
          </div>
          <button className="fk-btn" disabled={busy}>تسجيل الفكرة</button>
          {!session && <p className="fk-small" style={{ marginTop: 8 }}>لازم تسجّل دخولك من قسم «حسابي» قبل تسجيل الفكرة.</p>}
        </form>
      </section> 
    </div>
  )
}

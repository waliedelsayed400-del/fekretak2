import React from 'react'
import { useEffect, useState, useCallback } from 'react'
import * as sbm from './lib/supabase'

const supabase = sbm.supabase || sbm.default
const DOMAIN = '@fekretak.app'
const WALLET = '01099156391'
const WHATSAPP = '201099156391'

const AR = '٠١٢٣٤٥٦٧٨٩'
const FA = '۰۱۲۳۴۵۶۷۸۹'
const digits = (s) => String(s || '').replace(/[٠-٩]/g, (d) => AR.indexOf(d)).replace(/[۰-۹]/g, (d) => FA.indexOf(d))
const cairoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
const shown = (email) => (email || '').endsWith(DOMAIN) ? email.slice(0, -DOMAIN.length) : (email || '')
const isHttps = (u) => /^https:\/\//i.test(u || '')
const PHONE_RE = /^01[0-9]{9}$/
const waLink = (text, to = WHATSAPP) => 'https://wa.me/' + to + '?text=' + encodeURIComponent(text)
const URL_REF = typeof window !== 'undefined' ? digits(new URLSearchParams(window.location.search).get('ref') || '').trim() : ''

const waUser = (phone, text) => (PHONE_RE.test(phone || '') ? waLink(text, '20' + phone.slice(1)) : null)

async function compress(file) {
  const bmp = await createImageBitmap(file)
  const r = Math.min(1, 1000 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * r)
  c.height = Math.round(bmp.height * r)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.75))
}

function Receipt({ path }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!path) return
    supabase.storage.from('receipts').createSignedUrl(path, 3600).then(({ data }) => setUrl((data && data.signedUrl) || ''))
  }, [path])
  if (!path) return <p className="fk-small">لا توجد صورة تحويل</p>
  if (!url) return <p className="fk-small">جارٍ تحميل صورة التحويل...</p>
  return <a href={url} target="_blank" rel="noopener noreferrer"><img className="fk-img" src={url} alt="صورة التحويل" /></a>
}

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
const EMPTY = { owner_name: '', phone: '', title: '', governorate: 'القاهرة', budget: '', description: '', payment_ref: '' }

const CSS = `
.fk{direction:rtl;min-height:100vh;font-family:'Segoe UI',Tahoma,'Noto Sans Arabic',system-ui,sans-serif;color:#1e293b;background:linear-gradient(180deg,#eaf4ff 0%,#f8f6ec 55%,#fdf1ef 100%);padding-bottom:40px}
.fk *{box-sizing:border-box}
.fk h1,.fk h2,.fk h3,.fk p{margin:0}
.fk-head{background:linear-gradient(135deg,#1e3a8a,#2b7de9 60%,#38bdf8);color:#fff;padding:26px 20px 30px;border-radius:0 0 34px 34px}
.fk-head h1{font-size:28px}
.fk-head p{opacity:.9;margin-top:6px}
.fk-nav{position:sticky;top:0;z-index:50;display:flex;gap:8px;padding:10px 12px;overflow-x:auto;background:rgba(234,244,255,.94);backdrop-filter:blur(6px)}
.fk-pill{flex:none;border:0;cursor:pointer;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:10px 15px;border-radius:18px;background:linear-gradient(135deg,#a855f7,#ec4899);box-shadow:0 6px 14px rgba(168,85,247,.25);opacity:.8}
.fk-pill.on{opacity:1;background:linear-gradient(135deg,#1e3a8a,#2b7de9);box-shadow:0 6px 14px rgba(30,58,138,.35)}
.fk-sec{background:#fff;margin:14px 12px;padding:20px 16px;border-radius:26px;box-shadow:0 8px 24px rgba(30,58,138,.07)}
.fk-sec h2{font-size:22px;color:#1e3a8a;margin-bottom:12px}
.fk-lead{font-weight:700;line-height:2;font-size:15px}
.fk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px}
.fk-card{border:1px solid #dbe7fb;border-radius:22px;padding:14px;background:#fff}
.fk-card h3{font-size:15px;color:#2563eb;margin-bottom:6px}
.fk-card p{font-size:13px;line-height:1.8;color:#475569}
.fk-green{margin:14px 12px;padding:16px;border-radius:22px;border-right:5px solid #22c55e;background:linear-gradient(135deg,#e6fbef,#e0f2fe);line-height:1.9;font-size:14px}
.fk-fee{border:2px dashed #fb923c;border-radius:22px;padding:16px;background:linear-gradient(135deg,#fff1e0,#ffe4ec);line-height:1.9;font-size:14px;margin:14px 0}
.fk-fee b{color:#c2410c}
.fk-offer{border-radius:22px;padding:16px;background:linear-gradient(135deg,#fde68a,#fdba74);color:#7c2d12;font-weight:700;line-height:1.9;margin-bottom:12px}
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
.fk-btn.w{background:#e0ecff;color:#1e40af}
.fk-btn.s{padding:8px 14px;font-size:13px;margin-top:8px;margin-left:6px}
.fk-btn:disabled{opacity:.55;cursor:default}
.fk-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.fk-two{grid-template-columns:1fr}}
.fk-sub{display:flex;gap:8px;margin-bottom:12px}
.fk-chat{height:300px;overflow-y:auto;border:1px solid #dbe7fb;border-radius:18px;padding:10px;background:#f7faff;margin-bottom:10px}
.fk-msg{padding:6px 4px;font-size:14px;border-bottom:1px solid #eef2f9}
.fk-msg b{color:#2563eb;margin-left:6px}
.fk-img{display:block;max-width:100%;max-height:260px;border-radius:14px;margin-top:6px}
.fk-ad{border:2px dashed #cbd5e1;border-radius:18px;padding:14px;text-align:center;color:#64748b;font-size:13px;margin-top:12px}
.fk-ad.on{border-style:solid;border-color:#fdba74;background:#fffaf0;color:#1e293b;font-size:15px}
.fk-ad b{display:block;color:#1e293b;margin-bottom:4px}
.fk-post{border:1px solid #dbe7fb;border-radius:18px;padding:14px;margin-top:10px}
.fk-post h3{font-size:16px;margin-bottom:4px}
.fk-post p{font-size:14px;line-height:1.8;white-space:pre-wrap}
.fk-tag{display:inline-block;font-size:12px;padding:3px 10px;border-radius:12px;background:#e0ecff;color:#1e40af;margin-left:6px}
.fk-tag.ok{background:#dcfce7;color:#166534}
.fk-tag.no{background:#fee2e2;color:#b91c1c}
.fk-toast{position:fixed;top:8px;left:12px;right:12px;z-index:99;padding:12px 16px;border-radius:16px;background:#1e3a8a;color:#fff;font-size:14px}
.fk-empty{color:#64748b;font-size:14px;padding:8px 0}
.fk-bar{height:12px;border-radius:8px;background:#e2e8f0;overflow:hidden;margin:8px 0}
.fk-bar i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#86efac)}
`

export default function App() {
  const [tab, setTab] = useState(URL_REF ? 'account' : 'home')
  const [sub, setSub] = useState('chat')
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mine, setMine] = useState([])
  const [people, setPeople] = useState([])
  const [msgs, setMsgs] = useState([])
  const [posts, setPosts] = useState([])
  const [todayAds, setTodayAds] = useState([])
  const [myAds, setMyAds] = useState([])
  const [adminEntries, setAdminEntries] = useState([])
  const [adminPosts, setAdminPosts] = useState([])
  const [adminAds, setAdminAds] = useState([])
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const [loginId, setLoginId] = useState('')
  const [pass, setPass] = useState('')

  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [chatName, setChatName] = useState('')
  const [chatText, setChatText] = useState('')
  const [chatFile, setChatFile] = useState(null)
  const [post, setPost] = useState({ author: '', title: '', body: '' })
  const [postFile, setPostFile] = useState(null)
  const [ad, setAd] = useState({ advertiser: '', phone: '', body: '', ad_date: cairoToday(), payment_ref: '' })
  const [adFile, setAdFile] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [adReceipt, setAdReceipt] = useState(null)
  const [refCode, setRefCode] = useState(URL_REF)
  const [refCount, setRefCount] = useState(0)
  const [refReport, setRefReport] = useState([])

  const subscriber = mine.some((e) => e.status === 'approved')
  const myPhone = shown(session?.user?.email)
  const say = (t) => { setToast(t); setTimeout(() => setToast(''), 5000) }
  const open = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setE = (k) => (e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))
  const setA = (k) => (e) => setAd((f) => ({ ...f, [k]: e.target.value }))

  const loadPublic = useCallback(async () => {
    const a = await supabase.from('public_ideas').select('*').order('created_at', { ascending: false })
    if (a.data) setPeople(a.data)
    const b = await supabase.from('community_messages').select('*').order('created_at', { ascending: false }).limit(50)
    if (b.data) setMsgs([...b.data].reverse())
    const c = await supabase.from('community_posts').select('*').eq('published', true).order('created_at', { ascending: false })
    if (c.data) setPosts(c.data)
    const d = await supabase.from('todays_ads').select('*')
    if (d.data) setTodayAds(d.data)
  }, [])

  const loadPrivate = useCallback(async (uid) => {
    if (!uid) { setMine([]); setMyAds([]); setIsAdmin(false); setAdminEntries([]); setAdminPosts([]); setAdminAds([]); setRefCount(0); setRefReport([]); return }
    const m = await supabase.from('idea_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (m.data) setMine(m.data)
    const ma = await supabase.from('ads').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (ma.data) setMyAds(ma.data)
    const rc = await supabase.rpc('my_referral_count')
    setRefCount(typeof rc.data === 'number' ? rc.data : 0)
    const adm = await supabase.rpc('is_admin')
    const admin = adm.data === true
    setIsAdmin(admin)
    if (admin) {
      const e = await supabase.from('idea_entries').select('*').order('created_at', { ascending: false })
      if (e.data) setAdminEntries(e.data)
      const p = await supabase.from('community_posts').select('*').eq('published', false).order('created_at', { ascending: false })
      if (p.data) setAdminPosts(p.data)
      const x = await supabase.from('ads').select('*').order('created_at', { ascending: false })
      if (x.data) setAdminAds(x.data)
      const rr = await supabase.rpc('referral_report')
      if (rr.data) setRefReport(rr.data)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sb } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sb.subscription.unsubscribe()
  }, [])

  useEffect(() => { loadPublic() }, [loadPublic])
  useEffect(() => { loadPrivate(session?.user?.id) }, [session, loadPrivate])
  useEffect(() => {
    const t = setInterval(() => loadPublic(), 20000)
    return () => clearInterval(t)
  }, [loadPublic])
  useEffect(() => {
    const p = shown(session?.user?.email)
    if (p && !p.includes('@')) {
      setForm((f) => (f.phone ? f : { ...f, phone: p }))
      setAd((f) => (f.phone ? f : { ...f, phone: p }))
    }
  }, [session])

  const refresh = async () => { await loadPublic(); await loadPrivate(session?.user?.id) }

  async function auth(e) {
    e.preventDefault()
    const id = digits(loginId).trim()
    if (!id.includes('@') && !PHONE_RE.test(id)) return say('اكتب رقم موبايلك: 11 رقم يبدأ بـ 01')
    if (pass.length < 6) return say('كلمة السر 6 أحرف أو أرقام على الأقل')
    const code = digits(refCode).trim()
    if (code && (!PHONE_RE.test(code) || code === id)) return say('كود الدعوة لازم يكون رقم موبايل صاحبك (11 رقم)')
    const email = id.includes('@') ? id : id + DOMAIN
    setBusy(true)
    let r = await supabase.auth.signInWithPassword({ email, password: pass })
    let created = false
    if (r.error && (r.error.message || '').includes('Invalid login') && !id.includes('@')) {
      const sg = await supabase.auth.signUp({ email, password: pass })
      if (sg.error) {
        setBusy(false)
        return say((sg.error.message || '').includes('already') ? 'كلمة السر غلط' : 'تعذّر إنشاء الحساب: ' + sg.error.message)
      }
      r = await supabase.auth.signInWithPassword({ email, password: pass })
      created = !r.error
    }
    if (created) await supabase.from('profiles').insert({ phone: id, referred_by: code || null })
    setBusy(false)
    if (r.error) {
      const m = r.error.message || ''
      if (m.includes('Invalid login')) say('الرقم أو كلمة السر غلط')
      else if (m.includes('not confirmed')) say('لازم تقفل خيار Confirm email من إعدادات Supabase')
      else say('تعذّر الدخول: ' + m)
    } else say(created ? 'تم إنشاء حسابك وتسجيل دخولك' : 'تم تسجيل الدخول')
  }

  async function submitIdea(e) {
    e.preventDefault()
    if (!session) { say('سجّل دخولك الأول من قسم حسابي'); return open('account') }
    const f = form
    if (!f.owner_name || !f.phone || !f.title || !f.description || !f.payment_ref) return say('كمّل كل الحقول، ومنها رقم مرجع التحويل')
    setBusy(true)
    let receipt_path = null
    try { if (receiptFile) receipt_path = await pushReceipt(receiptFile) } catch (err) { setBusy(false); return say('تعذّر رفع صورة التحويل: ' + (err.message || err)) }
    const { error } = await supabase.from('idea_entries').insert({ ...f, phone: digits(f.phone), budget: f.budget ? Number(digits(f.budget)) : null, receipt_path })
    setBusy(false)
    if (error) return say('تعذّر التسجيل: ' + error.message)
    setForm({ ...EMPTY, phone: myPhone && !myPhone.includes('@') ? myPhone : '' })
    setReceiptFile(null)
    say('تم تسجيل فكرتك. ارفع صورة التحويل أو ابعتها واتساب عشان نفعّل اشتراكك.')
    await refresh(); open('account')
  }

  function startEdit(i) {
    setEditId(i.id)
    setEditForm({ owner_name: i.owner_name, phone: i.phone, title: i.title, governorate: i.governorate, budget: i.budget == null ? '' : String(i.budget), description: i.description, payment_ref: i.payment_ref })
  }

  async function saveEdit() {
    const f = editForm
    if (!f.owner_name || !f.phone || !f.title || !f.description || !f.payment_ref) return say('كمّل كل الحقول')
    setBusy(true)
    const { data, error } = await supabase.from('idea_entries').update({
      owner_name: f.owner_name, phone: digits(f.phone), title: f.title, governorate: f.governorate,
      budget: f.budget ? Number(digits(f.budget)) : null, description: f.description, payment_ref: f.payment_ref,
    }).eq('id', editId).select('id')
    setBusy(false)
    if (error) return say('تعذّر الحفظ: ' + error.message)
    if (!data || data.length === 0) return say('مينفعش تعديل الفكرة بعد مراجعتها')
    setEditId(null); say('تم حفظ التعديل'); refresh()
  }

  async function removeMine(id) {
    const { error } = await supabase.from('idea_entries').delete().eq('id', id)
    if (error) say('تعذّر الحذف: ' + error.message); else refresh()
  }

  async function pushImage(file, bucket = 'community-images') {
    const blob = await compress(file)
    const path = session.user.id + '/' + Date.now() + '.jpg'
    const up = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' })
    if (up.error) throw up.error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function pushReceipt(file) {
    const blob = await compress(file)
    const path = session.user.id + '/' + Date.now() + '.jpg'
    const up = await supabase.storage.from('receipts').upload(path, blob, { contentType: 'image/jpeg' })
    if (up.error) throw up.error
    return path
  }

  async function attachReceipt(id, file) {
    if (!file) return
    setBusy(true)
    try {
      const path = await pushReceipt(file)
      const { data, error } = await supabase.from('idea_entries').update({ receipt_path: path }).eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('مينفعش بعد مراجعة الفكرة')
      say('تم رفع صورة التحويل'); refresh()
    } catch (err) { say('تعذّر رفع الصورة: ' + (err.message || err)) }
    setBusy(false)
  }

  async function sendMsg(e) {
    e.preventDefault()
    if (!subscriber) return say('للكتابة في الدردشة يجب الاشتراك')
    if (!chatName || (!chatText && !chatFile)) return say('اكتب اسمك ورسالة أو صورة')
    setBusy(true)
    try {
      const image_url = chatFile ? await pushImage(chatFile) : null
      const { error } = await supabase.from('community_messages').insert({ author: chatName, body: chatText, image_url })
      if (error) throw error
      setChatText(''); setChatFile(null); loadPublic()
    } catch (err) { say('تعذّر الإرسال: ' + (err.message || err)) }
    setBusy(false)
  }

  async function sendPost(e) {
    e.preventDefault()
    if (!subscriber) return say('لنشر بوست يجب الاشتراك')
    if (!post.author || !post.title || !post.body) return say('كمّل الاسم والعنوان والنص')
    setBusy(true)
    try {
      const image_url = postFile ? await pushImage(postFile) : null
      const { error } = await supabase.from('community_posts').insert({ ...post, image_url })
      if (error) throw error
      setPost({ author: '', title: '', body: '' }); setPostFile(null)
      say('تم إرسال مشاركتك وتنتظر موافقة الإدارة.')
    } catch (err) { say('تعذّر النشر: ' + (err.message || err)) }
    setBusy(false)
  }

  async function submitAd(e) {
    e.preventDefault()
    if (!session) { say('سجّل دخولك الأول من قسم حسابي'); return open('account') }
    const a = ad
    if (!a.advertiser || !a.phone || !a.body || !a.payment_ref) return say('كمّل كل الحقول، ومنها رقم مرجع التحويل')
    if (a.ad_date < cairoToday()) return say('اختار يوم النهارده أو يوم بعده')
    setBusy(true)
    try {
      const image_url = adFile ? await pushImage(adFile, 'ad-images') : null
      const receipt_path = adReceipt ? await pushReceipt(adReceipt) : null
      const { error } = await supabase.from('ads').insert({ advertiser: a.advertiser, phone: digits(a.phone), body: a.body, ad_date: a.ad_date, payment_ref: a.payment_ref, image_url, receipt_path })
      if (error) throw error
      setAd({ ...ad, body: '', payment_ref: '' }); setAdFile(null); setAdReceipt(null)
      say('تم إرسال إعلانك. هيظهر في يومه بعد مراجعة التحويل.')
      refresh()
    } catch (err) { say('تعذّر إرسال الإعلان: ' + (err.message || err)) }
    setBusy(false)
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

  async function shareInvite() {
    const url = window.location.origin + '/?ref=' + myPhone
    const text = 'سجّل في منصة «فكرتك مشروعك» واشترك في المسابقة، واكتب كود الدعوة ' + myPhone
    try {
      if (navigator.share) await navigator.share({ title: 'فكرتك مشروعك', text, url })
      else { await navigator.clipboard.writeText(text + ' ' + url); say('تم نسخ رسالة الدعوة') }
    } catch { /* cancelled */ }
  }

  const tag = (s) => (s === 'approved' ? 'ok' : s === 'rejected' ? 'no' : '')

  const adsStrip = () => (
    todayAds.length > 0
      ? todayAds.map((a) => <div className="fk-ad on" key={a.id}><span className="fk-small">إعلان • {a.advertiser}</span>{isHttps(a.image_url) && <img className="fk-img" style={{ margin: '8px auto' }} src={a.image_url} alt="" />}<div>{a.body}</div></div>)
      : <div className="fk-ad"><b>📢 مساحة إعلانية</b>أعلن هنا بـ 10 جنيه لليوم الواحد.<br /><button type="button" className="fk-btn o s" onClick={() => open('ads')}>اعرف التفاصيل</button></div>
  )

  const feeBox = (label, value, onChange) => (
    <div className="fk-fee">
      💰 الرسوم: <b>10 جنيه</b><br />
      فودافون كاش: <b dir="ltr">{WALLET}</b>
      <label>{label}</label>
      <input value={value} onChange={onChange} />
    </div>
  )

  const imgPicker = (file, setFile, label = 'إرفاق صورة') => (
    <div style={{ marginTop: 8 }}>
      <label className="fk-btn w s" style={{ display: 'inline-block', margin: 0 }}>
        📷 {file ? 'تغيير الصورة' : label}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {file && <span className="fk-small" style={{ marginRight: 8 }}>{file.name} <button type="button" className="fk-btn r s" onClick={() => setFile(null)}>إلغاء</button></span>}
    </div>
  )

  const payHelp = (file, setFile, waText, note) => (
    <div className="fk-small" style={{ lineHeight: 1.9, marginBottom: 8 }}>
      <div>{note}</div>
      {imgPicker(file, setFile, 'ارفع صورة التحويل')}
      <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waLink(waText)} target="_blank" rel="noopener noreferrer">💬 أو ابعتها على واتساب</a>
    </div>
  )

  if (!ready) return <div className="fk"><style>{CSS}</style><div className="fk-sec">جارٍ التحميل...</div></div>

  const TABS = [['home', '🏠 الرئيسية'], ['register', '📝 سجّل فكرتك'], ['people', '💡 المشاركون'], ['community', '💬 المجتمع'], ['ads', '📢 الإعلانات'], ['account', '👤 حسابي']]
  if (isAdmin) TABS.push(['admin', '⚙️ المدير'])

  const home = () => (
    <>
      <section className="fk-sec">
        <h2>هدف المنصة: نكتشف فكرتك ونمنحها فرصة حقيقية</h2>
        <p className="fk-lead">منصة «فكرتك مشروعك» تهدف لاكتشاف أصحاب الأفكار والمشروعات الواعدة من جميع محافظات مصر، وفحص الأفكار ومعاينتها حسب طبيعة المشروع، والاستفادة من رأي الجمهور، ثم اختيار أفضل الأفكار للمنافسة على مستوى الجمهورية.</p>
        <div className="fk-grid">
          {STEPS.map(([n, t, d]) => <div className="fk-card" key={t}><h3>{n} {t}</h3><p>{d}</p></div>)}
        </div>
        <button className="fk-btn" onClick={() => open('register')}>📝 سجّل فكرتك الآن</button>
      </section>
      <div className="fk-offer" style={{ margin: '14px 12px' }}>🎁 ادعُ أصحابك للمنصة: لو دخّلت أكتر من 10 أفراد، بتاخد زيادة 5% في تقييمك في المسابقة!<br /><button type="button" className="fk-btn s" onClick={() => open('account')}>اعرف كودك</button></div>
      <div className="fk-green">
        <b>🚀 ومش معنى إنك ماكسبتش إن فكرتك انتهت!</b><br />
        أفضل الأفكار الواعدة غير الفائزة يمكن أن نحتضنها ونساعد في تطويرها وتسويقها والوصول بها للسوق، وفق البرامج والفرص المتاحة.
      </div>
      <section className="fk-sec">
        <h2>💡 مش عندك فكرة؟ ابدأ من هنا</h2>
        <p style={{ fontSize: 14, lineHeight: 1.9 }}>مش لازم تدخل المنصة بفكرة جاهزة. تقدر تتصفح أفكار ومجالات تساعدك تستلهم فكرة مناسبة ليك، وبعدها تطورها بطريقتك وتسجل فكرتك الخاصة.</p>
        <div className="fk-grid">
          {CATS.map(([i, t, d]) => <div className="fk-card" key={t}><h3>{i} {t}</h3><p>{d}</p></div>)}
        </div>
        <div className="fk-note" style={{ background: '#fffbe6', borderColor: '#facc15' }}>✨ <b>الأهم:</b> الأفكار الموجودة هنا للإلهام فقط، وليست مِلكًا للمنصة. لو طورت فكرة خاصة بك، سجلها باسمك واحتفظ بتفاصيلها وحقوقك.</div>
      </section>
      <section className="fk-sec">
        <h2>📣 شارك المنصة</h2>
        <p style={{ fontSize: 14, lineHeight: 1.9 }}>المنصة مفتوحة للتعريف بها من خلال أصحاب الأفكار والمشاركين والداعمين، للوصول لأكبر عدد من الشباب في جميع المحافظات.</p>
        <ul style={{ lineHeight: 2, fontSize: 14, paddingRight: 18, margin: '8px 0 0' }}>
          <li>شارك رابط المنصة مع أصحاب الأفكار والمشروعات.</li>
          <li>عرّف الآخرين بفكرة «من فكرة إلى مشروع».</li>
          <li>ساهم في الوصول لأفكار مميزة من مختلف المحافظات.</li>
        </ul>
        <button className="fk-btn" onClick={share}>شارك رابط المنصة</button>
        <p className="fk-small" style={{ marginTop: 10 }}>المشاركة في التعريف بالمنصة لا تعني انتقال ملكية أي فكرة أو مشروع إلى المنصة، وتظل حقوق أصحاب الأفكار محفوظة وفقًا للقانون والاتفاقات المعلنة.</p>
      </section>
    </>
  )

  const register = () => (
    <>
      <div className="fk-lock">
        <h3>🔐 اطمّن على فكرتك وحقوقك</h3>
        <p><b>تسجيل الفكرة لا يعني انتقال ملكيتها إلى المنصة.</b> وتظل حقوق صاحب الفكرة محفوظة وفقًا للقانون، ولا يتم استخدام أو تطوير أو تسويق الفكرة خارج نطاق المسابقة أو الخدمات المعلنة إلا وفق موافقة واتفاق واضح مع صاحبها.</p>
        <p style={{ marginTop: 8 }}>تفاصيل فكرتك لا تظهر للجمهور، ويظهر فقط اسمك ومحافظتك. وتقدر تعدّل بياناتها من «حسابي» قبل ما تتم مراجعتها.</p>
        <p className="fk-small" style={{ marginTop: 8 }}>هذه صياغة تنظيمية مبدئية للمنصة، ويُفضّل مراجعتها واعتمادها من محامٍ مصري قبل الإطلاق التجاري النهائي.</p>
      </div>
      <section className="fk-sec">
        <h2>📝 تسجيل فكرة مشروع</h2>
        {!session && <div className="fk-note" style={{ marginTop: 0, marginBottom: 8 }}>لازم تسجّل بحسابك الأول (برقم موبايلك بس). <button type="button" className="fk-btn o s" onClick={() => open('account')}>سجّل دخولك</button></div>}
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
          {feeBox('رقم/مرجع التحويل (بعد التحويل)', form.payment_ref, setF('payment_ref'))}
          {payHelp(receiptFile, setReceiptFile, 'أنا ' + (form.phone || '') + ' حوّلت 10 جنيه رسوم اشتراك في فكرتك مشروعك، دي صورة التحويل:', 'صورة التحويل تأكّد اشتراكك. ترفعها هنا أو بعد التسجيل من «حسابي».')}
          <p className="fk-small">الـ 10 جنيه رسوم اشتراك في المسابقة وتسجيل الفكرة واستخدام خدمات المشاركة، وليست سحبًا عشوائيًا للفوز. بيانات التحويل بتتراجع يدويًا.</p>
          <button className="fk-btn" disabled={busy}>تسجيل الفكرة</button>
        </form>
      </section>
      <section className="fk-sec">
        <h2>📜 حقوق وخصوصية أصحاب الأفكار</h2>
        <ul style={{ lineHeight: 2, fontSize: 14, paddingRight: 18, margin: 0 }}>
          <li>الفكرة تظل مملوكة لصاحبها، ولا تنتقل ملكيتها لمجرد تسجيلها.</li>
          <li>يقتصر استخدام بيانات الفكرة على أغراض المسابقة والخدمات المعلنة، مع مراعاة الموافقات والاتفاقات اللازمة.</li>
          <li>أي تبنٍّ أو تطوير أو تسويق أو شراكة مستقبلية مع صاحب الفكرة يتم وفق موافقة واتفاق واضح ومستقل.</li>
          <li>تُعامل البيانات الشخصية وفق الإطار القانوني المصري لحماية البيانات الشخصية، بما في ذلك قانون رقم 151 لسنة 2020 ولائحته التنفيذية رقم 816 لسنة 2025.</li>
        </ul>
      </section>
    </>
  )

  const peopleTab = () => (
    <section className="fk-sec">
      <h2>💡 المشاركون في المسابقة</h2>
      <p className="fk-small" style={{ marginBottom: 8 }}>بنعرض اسم صاحب الفكرة ومحافظته بس. تفاصيل الأفكار محفوظة ومش معروضة للجمهور.</p>
      {people.length === 0 && <p className="fk-empty">لا يوجد مشاركون معروضون حاليًا.</p>}
      {people.map((i) => (
        <div className="fk-post" key={i.id}>
          <h3>👤 {i.owner_name}</h3>
          <span className="fk-tag">{i.governorate}</span>
          <span className="fk-small">🔒 تفاصيل الفكرة محفوظة</span>
        </div>
      ))}
    </section>
  )

  const community = () => (
    <section className="fk-sec">
      <h2>💬 مجتمع «فكرتك مشروعك»</h2>
      <div className="fk-sub">
        <button type="button" className={'fk-pill' + (sub === 'chat' ? ' on' : '')} onClick={() => setSub('chat')}>الدردشة</button>
        <button type="button" className={'fk-pill' + (sub === 'posts' ? ' on' : '')} onClick={() => setSub('posts')}>بوستات الأعضاء</button>
      </div>
      {sub === 'chat' ? (
        <>
          <p className="fk-small" style={{ marginBottom: 10 }}>الدردشة متاحة للقراءة للجميع، أما الكتابة وإرسال الصور فللمشتركين في المسابقة فقط.</p>
          <div className="fk-chat">
            {msgs.length === 0 && <p className="fk-empty">لا توجد رسائل بعد.</p>}
            {msgs.map((m) => (
              <div className="fk-msg" key={m.id}>
                <b>{m.author}</b>{m.body}
                {isHttps(m.image_url) && <img className="fk-img" src={m.image_url} alt="" />}
                {isAdmin && <button type="button" className="fk-btn r s" onClick={() => del('community_messages', m.id)}>حذف</button>}
              </div>
            ))}
          </div>
          <form onSubmit={sendMsg}>
            <div className="fk-two">
              <input value={chatName} onChange={(e) => setChatName(e.target.value)} placeholder="اسمك" />
              <input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="اكتب رسالتك" maxLength={500} />
            </div>
            {imgPicker(chatFile, setChatFile)}
            <button className="fk-btn g" disabled={busy}>إرسال الرسالة</button>
            <span className="fk-small" style={{ marginRight: 8 }}>للكتابة في الدردشة يجب الاشتراك.</span>
          </form>
          {adsStrip()}
        </>
      ) : (
        <>
          <p className="fk-small" style={{ marginBottom: 10 }}>يمكن للجميع مشاهدة البوستات، والمشتركون فقط يمكنهم نشر مشاركات جديدة. المنشورات تمر على موافقة الإدارة قبل النشر.</p>
          <form onSubmit={sendPost} style={{ background: '#fffaee', padding: 12, borderRadius: 18 }}>
            <input value={post.author} onChange={(e) => setPost({ ...post, author: e.target.value })} placeholder="اسمك" />
            <input style={{ marginTop: 8 }} value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="عنوان البوست" />
            <textarea style={{ marginTop: 8 }} value={post.body} onChange={(e) => setPost({ ...post, body: e.target.value })} placeholder="اكتب مشاركتك أو فكرتك أو تجربتك..." />
            {imgPicker(postFile, setPostFile)}
            <button className="fk-btn" disabled={busy}>نشر المشاركة</button>
            <span className="fk-small" style={{ marginRight: 8 }}>لنشر بوست يجب الاشتراك.</span>
          </form>
          {posts.length === 0 && <p className="fk-empty" style={{ marginTop: 10 }}>لا توجد بوستات بعد.</p>}
          {posts.map((p) => (
            <div className="fk-post" key={p.id}>
              <h3>{p.title}</h3><span className="fk-small">{p.author}</span>
              <p style={{ marginTop: 6 }}>{p.body}</p>
              {isHttps(p.image_url) && <img className="fk-img" src={p.image_url} alt="" />}
            </div>
          ))}
          {adsStrip()}
        </>
      )}
    </section>
  )

  const adsTab = () => (
    <>
      <section className="fk-sec">
        <h2>📢 الإعلانات</h2>
        <div className="fk-offer">🎉 عرض الافتتاح: الإعلان لليوم الواحد بـ 10 جنيه بس! اكتب إعلانك واختار اليوم، وهيظهر للجميع في اليوم ده.</div>
        <h3 style={{ margin: '4px 0' }}>إعلانات النهارده</h3>
        {adsStrip()}
      </section>
      <section className="fk-sec">
        <h2>✍️ أضف إعلانك</h2>
        {!session && <div className="fk-note" style={{ marginTop: 0, marginBottom: 8 }}>سجّل دخولك الأول برقم موبايلك. <button type="button" className="fk-btn o s" onClick={() => open('account')}>سجّل دخولك</button></div>}
        <form onSubmit={submitAd}>
          <div className="fk-two">
            <div><label>اسم المعلن / النشاط</label><input value={ad.advertiser} onChange={setA('advertiser')} /></div>
            <div><label>رقم الهاتف</label><input dir="ltr" inputMode="tel" value={ad.phone} onChange={setA('phone')} placeholder="01xxxxxxxxx" /></div>
          </div>
          <label>نص الإعلان (200 حرف بحد أقصى)</label>
          <textarea maxLength={200} value={ad.body} onChange={setA('body')} />
          <label>صورة الإعلان (اختياري)</label>
          {imgPicker(adFile, setAdFile)}
          <label>يوم الإعلان</label>
          <input type="date" min={cairoToday()} value={ad.ad_date} onChange={setA('ad_date')} />
          {feeBox('رقم/مرجع التحويل (بعد التحويل)', ad.payment_ref, setA('payment_ref'))}
          {payHelp(adReceipt, setAdReceipt, 'أنا ' + (ad.phone || '') + ' حوّلت 10 جنيه ثمن إعلان يوم ' + ad.ad_date + '، دي صورة التحويل:', 'صورة التحويل تسرّع قبول إعلانك.')}
          <button className="fk-btn o" disabled={busy}>إرسال الإعلان</button>
        </form>
      </section>
      {session && (
        <section className="fk-sec">
          <h2>إعلاناتي</h2>
          {myAds.length === 0 && <p className="fk-empty">لم ترسل إعلانات بعد.</p>}
          {myAds.map((a) => (
            <div className="fk-post" key={a.id}>
              <span className={'fk-tag ' + tag(a.status)}>{STATUS[a.status]}</span>
              <span className="fk-tag">{a.ad_date}</span>
              <p style={{ marginTop: 6 }}>{a.body}</p>
              {isHttps(a.image_url) && <img className="fk-img" src={a.image_url} alt="" />}
            </div>
          ))}
        </section>
      )}
    </>
  )

  const account = () => (
    <>
      <section className="fk-sec">
        <h2>👤 حسابي</h2>
        {session ? (
          <>
            <p className="fk-lead">أنت مسجّل بـ <span dir="ltr">{myPhone}</span></p>
            <p className="fk-small" style={{ marginTop: 8 }}>
              {subscriber ? '✅ اشتراكك مفعّل. تقدر تكتب في الدردشة وتنشر بوستات وتبعت صور.' : 'اشتراكك لسه مش مفعّل. يتفعّل بعد مراجعة تحويل الـ 10 جنيه.'}
            </p>
            <button className="fk-btn r" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
          </>
        ) : (
          <form onSubmit={auth}>
            <p className="fk-small">من غير إيميل: رقم موبايلك وكلمة سر بس. أول مرة؟ هيتعمل لك حساب تلقائي.</p>
            <label>رقم الموبايل</label>
            <input dir="ltr" inputMode="tel" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="01xxxxxxxxx" />
            <label>كلمة السر</label>
            <input type="password" dir="ltr" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="6 أحرف أو أرقام على الأقل" />
            <label>كود الدعوة (اختياري، لو جيت من صاحبك)</label>
            <input dir="ltr" inputMode="tel" value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="رقم موبايل اللي دعاك" />
            <button className="fk-btn" disabled={busy}>دخول</button>
            <p className="fk-small" style={{ marginTop: 10 }}>لو نسيت كلمة السر كلّم الإدارة.</p>
          </form>
        )}
      </section>
      {session && myPhone && !myPhone.includes('@') && (
        <section className="fk-sec">
          <h2>🎁 ادعُ أصحابك واكسب +5%</h2>
          <p style={{ fontSize: 14, lineHeight: 1.9 }}>كل واحد تدعوه ويشترك في المسابقة ويتقبّل اشتراكه بيتحسب لك. لو دخّلت أكتر من 10 أفراد، بتاخد زيادة 5% في تقييمك في المسابقة.</p>
          <div className="fk-offer">كود الدعوة بتاعك: <b dir="ltr">{myPhone}</b></div>
          <div className="fk-bar"><i style={{ width: Math.min(100, Math.round((refCount / 11) * 100)) + '%' }} /></div>
          <p className="fk-small">{refCount > 10 ? '🎉 مبروك! حصلت على زيادة 5% في التقييم (' + refCount + ' فرد)' : 'اشترك عن طريقك ' + refCount + ' فرد، وباقي ' + (11 - refCount) + ' للوصول للزيادة'}</p>
          <button className="fk-btn" onClick={shareInvite}>📣 شارك رابط الدعوة</button>
        </section>
      )}
      {session && (
        <section className="fk-sec">
          <h2>📂 أفكاري</h2>
          {mine.length === 0 && <p className="fk-empty">لم تسجل أفكارًا بعد.</p>}
          {mine.map((i) => (
            <div className="fk-post" key={i.id}>
              {editId === i.id ? (
                <>
                  <input value={editForm.owner_name} onChange={setE('owner_name')} placeholder="الاسم" />
                  <input style={{ marginTop: 8 }} dir="ltr" value={editForm.phone} onChange={setE('phone')} placeholder="الهاتف" />
                  <input style={{ marginTop: 8 }} value={editForm.title} onChange={setE('title')} placeholder="اسم المشروع" />
                  <select style={{ marginTop: 8 }} value={editForm.governorate} onChange={setE('governorate')}>{GOVS.map((g) => <option key={g}>{g}</option>)}</select>
                  <input style={{ marginTop: 8 }} value={editForm.budget} onChange={setE('budget')} placeholder="الميزانية" />
                  <textarea style={{ marginTop: 8 }} value={editForm.description} onChange={setE('description')} />
                  <input style={{ marginTop: 8 }} value={editForm.payment_ref} onChange={setE('payment_ref')} placeholder="مرجع التحويل" />
                  <button type="button" className="fk-btn g s" disabled={busy} onClick={saveEdit}>حفظ التعديل</button>
                  <button type="button" className="fk-btn w s" onClick={() => setEditId(null)}>إلغاء</button>
                </>
              ) : (
                <>
                  <h3>{i.title}</h3>
                  <span className={'fk-tag ' + tag(i.status)}>{STATUS[i.status]}</span>
                  <span className="fk-tag">{i.governorate}</span>
                  {i.published && <span className="fk-tag ok">ظاهر في المشاركين</span>}
                  <p style={{ marginTop: 6 }}>{i.description}</p>
                  {i.status === 'pending' && (
                    <div className="fk-small" style={{ lineHeight: 1.9, marginTop: 6 }}>
                      {i.receipt_path ? '✅ تم رفع صورة التحويل' : '⚠️ لسه ما رفعتش صورة التحويل'}
                      <div>
                        <label className="fk-btn w s" style={{ display: 'inline-block', margin: '6px 0 0 6px' }}>
                          📎 {i.receipt_path ? 'تغيير صورة التحويل' : 'ارفع صورة التحويل'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => attachReceipt(i.id, e.target.files?.[0])} />
                        </label>
                        <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waLink('أنا ' + i.phone + ' سجلت فكرة «' + i.title + '» وحوّلت 10 جنيه، دي صورة التحويل:')} target="_blank" rel="noopener noreferrer">💬 ابعتها واتساب</a>
                      </div>
                    </div>
                  )}
                  {i.status === 'pending' && (
                    <>
                      <button type="button" className="fk-btn w s" onClick={() => startEdit(i)}>✏️ تعديل</button>
                      <button type="button" className="fk-btn r s" onClick={() => removeMine(i.id)}>حذف</button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  )

  const admin = () => (
    <section className="fk-sec">
      <h2>⚙️ تحكم المدير</h2>
      <h3 style={{ margin: '8px 0' }}>الأفكار والاشتراكات</h3>
      {adminEntries.length === 0 && <p className="fk-empty">لا توجد أفكار.</p>}
      {adminEntries.map((i) => (
        <div className="fk-post" key={i.id}>
          <h3>{i.title}</h3>
          <span className={'fk-tag ' + tag(i.status)}>{STATUS[i.status]}</span>
          {i.published && <span className="fk-tag ok">ظاهر</span>}
          <p className="fk-small" style={{ lineHeight: 1.9 }}>
            {i.owner_name} • {i.governorate} • <span dir="ltr">{i.phone}</span><br />مرجع التحويل: <b dir="ltr">{i.payment_ref}</b>
          </p>
          <p style={{ marginTop: 6 }}>{i.description}</p>
          <Receipt path={i.receipt_path} />
          {waUser(i.phone, 'أهلاً، بخصوص اشتراكك في فكرتك مشروعك:') && <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waUser(i.phone, 'أهلاً، بخصوص اشتراكك في فكرتك مشروعك:')} target="_blank" rel="noopener noreferrer">💬 واتساب</a>}
          <button className="fk-btn g s" onClick={() => upd('idea_entries', i.id, { status: 'approved' })}>قبول الاشتراك</button>
          <button className="fk-btn r s" onClick={() => upd('idea_entries', i.id, { status: 'rejected', published: false })}>رفض</button>
          {i.status === 'approved' && <button className="fk-btn s" onClick={() => upd('idea_entries', i.id, { published: !i.published })}>{i.published ? 'إخفاء' : 'إظهار في المشاركين'}</button>}
          <button className="fk-btn r s" onClick={() => del('idea_entries', i.id)}>حذف</button>
        </div>
      ))}
      <h3 style={{ margin: '16px 0 8px' }}>الإعلانات</h3>
      {adminAds.length === 0 && <p className="fk-empty">لا توجد إعلانات.</p>}
      {adminAds.map((a) => (
        <div className="fk-post" key={a.id}>
          <span className={'fk-tag ' + tag(a.status)}>{STATUS[a.status]}</span>
          <span className="fk-tag">{a.ad_date}</span>
          <p className="fk-small" style={{ lineHeight: 1.9 }}>{a.advertiser} • <span dir="ltr">{a.phone}</span><br />مرجع التحويل: <b dir="ltr">{a.payment_ref}</b></p>
          <p style={{ marginTop: 6 }}>{a.body}</p>
          {isHttps(a.image_url) && <img className="fk-img" src={a.image_url} alt="" />}
          <Receipt path={a.receipt_path} />
          {waUser(a.phone, 'أهلاً، بخصوص إعلانك في فكرتك مشروعك:') && <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waUser(a.phone, 'أهلاً، بخصوص إعلانك في فكرتك مشروعك:')} target="_blank" rel="noopener noreferrer">💬 واتساب</a>}
          <button className="fk-btn g s" onClick={() => upd('ads', a.id, { status: 'approved' })}>قبول</button>
          <button className="fk-btn r s" onClick={() => upd('ads', a.id, { status: 'rejected' })}>رفض</button>
          <button className="fk-btn r s" onClick={() => del('ads', a.id)}>حذف</button>
        </div>
      ))}
      <h3 style={{ margin: '16px 0 8px' }}>🎁 الدعوات (اشتراكات مقبولة)</h3>
      {refReport.length === 0 && <p className="fk-empty">لا توجد دعوات بعد.</p>}
      {refReport.map((r) => (
        <div className="fk-post" key={r.phone}>
          <span dir="ltr">{r.phone}</span> • {r.referred} مشترك
          {r.bonus && <span className="fk-tag ok" style={{ marginRight: 8 }}>+5% في التقييم</span>}
        </div>
      ))}
      <h3 style={{ margin: '16px 0 8px' }}>بوستات تنتظر الموافقة</h3>
      {adminPosts.length === 0 && <p className="fk-empty">لا توجد بوستات معلقة.</p>}
      {adminPosts.map((p) => (
        <div className="fk-post" key={p.id}>
          <h3>{p.title}</h3><span className="fk-small">{p.author}</span>
          <p style={{ marginTop: 6 }}>{p.body}</p>
          {isHttps(p.image_url) && <img className="fk-img" src={p.image_url} alt="" />}
          <button className="fk-btn g s" onClick={() => upd('community_posts', p.id, { published: true })}>نشر</button>
          <button className="fk-btn r s" onClick={() => del('community_posts', p.id)}>حذف</button>
        </div>
      ))}
    </section>
  )

  const pages = { home, register, people: peopleTab, community, ads: adsTab, account, admin }

  return (
    <div className="fk">
      <style>{CSS}</style>
      <header className="fk-head">
        <h1>💡 فكرتك مشروعك</h1>
        <p>من فكرة إلى مشروع 🇪🇬</p>
      </header>
      <nav className="fk-nav">
        {TABS.map(([k, label]) => (
          <button key={k} className={'fk-pill' + (tab === k ? ' on' : '')} onClick={() => open(k)}>{label}</button>
        ))}
      </nav>
      {toast && <div className="fk-toast">{toast}</div>}
      {(pages[tab] || home)()}
    </div>
  )
}

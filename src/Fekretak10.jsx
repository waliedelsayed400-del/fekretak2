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

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
const ar = (e) => {
  const m = String((e && e.message) || e || '')
  console.error(e)
  if (DEBUG) return m
  if (/[\u0600-\u06FF]/.test(m)) return m
  if (/row-level security|violates|permission|not allowed|403/i.test(m)) return 'مش مسموح لك بالعملية دي دلوقتي'
  if (/bucket|storage/i.test(m)) return 'مشكلة في تخزين الصورة، كلّم الإدارة'
  if (/too large|exceed|size/i.test(m)) return 'حجم الصورة كبير، جرّب صورة أصغر'
  if (/duplicate|already|unique/i.test(m)) return 'ده مسجّل قبل كده'
  if (/network|fetch|failed to/i.test(m)) return 'مشكلة في الاتصال بالإنترنت، جرّب تاني'
  return 'حصلت مشكلة، جرّب تاني'
}

async function compress(file) {
  let src = null
  let url = null
  try {
    src = await createImageBitmap(file)
  } catch (e1) {
    try {
      url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      await img.decode()
      src = img
    } catch (e2) {
      if (url) URL.revokeObjectURL(url)
      throw new Error('الصورة دي مش مدعومة، جرّب صورة تانية بصيغة JPG أو PNG')
    }
  }
  const w0 = src.naturalWidth || src.width
  const h0 = src.naturalHeight || src.height
  const r = Math.min(1, 1000 / Math.max(w0, h0))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w0 * r))
  c.height = Math.max(1, Math.round(h0 * r))
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height)
  if (url) URL.revokeObjectURL(url)
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.75))
  if (!blob) throw new Error('تعذّر تجهيز الصورة، جرّب صورة تانية')
  return blob
}

const imgsOf = (row) => ((row && row.image_urls && row.image_urls.length ? row.image_urls : row && row.image_url ? [row.image_url] : []).filter(isHttps))

function Thumbs({ files, setFiles }) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f))
    setUrls(u)
    return () => u.forEach((x) => URL.revokeObjectURL(x))
  }, [files])
  return (
    <div className="fk-thumbs">
      {urls.map((u, i) => (
        <div className="fk-thumb" key={u}>
          <img src={u} alt="" />
          <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
    </div>
  )
}

const certText = (i) => [
  'شهادة تسجيل فكرة - منصة فكرتك مشروعك',
  'رقم الشهادة: ' + String(i.id).slice(0, 8),
  'صاحب الفكرة: ' + i.owner_name,
  'المحافظة: ' + i.governorate,
  'وقت التسجيل (بتوقيت القاهرة): ' + new Date(i.proof_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' }),
  'البصمة الرقمية (SHA-256): ' + i.proof_hash,
  '',
  'البصمة دي بتثبت إن الفكرة بالمحتوى ده كانت مسجّلة عند المنصة في الوقت ده. هي إثبات سبق تسجيل، وليست تسجيلًا قانونيًا لحقوق الملكية الفكرية.',
].join('\n')

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

const THEMES = {
  classic: { name: 'الحالي (أزرق وبنفسجي)', bg1: '#eaf4ff', bg2: '#f8f6ec', bg3: '#fdf1ef', hd1: '#1e3a8a', hd2: '#2b7de9', hd3: '#38bdf8', navbg: 'rgba(234,244,255,.94)', pill1: '#a855f7', pill2: '#ec4899', act1: '#1e3a8a', act2: '#2b7de9', h2: '#1e3a8a', acc: '#2563eb', btn1: '#2563eb', btn2: '#38bdf8', tagbg: '#e0ecff', tagfg: '#1e40af' },
  blue: { name: 'أزرق موحّد', bg1: '#eaf4ff', bg2: '#f4f8fd', bg3: '#eef2fb', hd1: '#1e3a8a', hd2: '#2563eb', hd3: '#60a5fa', navbg: 'rgba(234,244,255,.94)', pill1: '#3b82f6', pill2: '#60a5fa', act1: '#1e3a8a', act2: '#2563eb', h2: '#1e3a8a', acc: '#2563eb', btn1: '#2563eb', btn2: '#60a5fa', tagbg: '#e0ecff', tagfg: '#1e40af' },
  green: { name: 'أخضر', bg1: '#ecfdf5', bg2: '#f7fbef', bg3: '#fefce8', hd1: '#065f46', hd2: '#059669', hd3: '#34d399', navbg: 'rgba(236,253,245,.94)', pill1: '#10b981', pill2: '#34d399', act1: '#065f46', act2: '#059669', h2: '#065f46', acc: '#047857', btn1: '#059669', btn2: '#34d399', tagbg: '#d1fae5', tagfg: '#065f46' },
  purple: { name: 'بنفسجي', bg1: '#f5f3ff', bg2: '#faf5ff', bg3: '#fdf2f8', hd1: '#4c1d95', hd2: '#7c3aed', hd3: '#c084fc', navbg: 'rgba(245,243,255,.94)', pill1: '#8b5cf6', pill2: '#c084fc', act1: '#4c1d95', act2: '#7c3aed', h2: '#4c1d95', acc: '#6d28d9', btn1: '#7c3aed', btn2: '#c084fc', tagbg: '#ede9fe', tagfg: '#5b21b6' },
  gold: { name: 'كحلي وذهبي', bg1: '#f1f5f9', bg2: '#fbf8ef', bg3: '#fdf6e3', hd1: '#0f172a', hd2: '#1e3a8a', hd3: '#d4a017', navbg: 'rgba(241,245,249,.94)', pill1: '#d4a017', pill2: '#f59e0b', act1: '#0f172a', act2: '#1e3a8a', h2: '#0f172a', acc: '#1e3a8a', btn1: '#1e3a8a', btn2: '#d4a017', tagbg: '#fef3c7', tagfg: '#92400e' },
}

const byPending = (a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1)

const fmtTime = (iso) => { try { return new Date(iso).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' }) } catch (e) { return '' } }

const normLink = (v) => {
  const t = digits(String(v || '')).trim()
  if (!t) return ''
  if (PHONE_RE.test(t)) return 'https://wa.me/20' + t.slice(1)
  const x = String(v).trim()
  if (/^https:\/\/\S+\.\S+/i.test(x)) return x
  if (/^http:\/\/\S+\.\S+/i.test(x)) return 'https://' + x.slice(7)
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(x)) return 'https://' + x
  return ''
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🙏', '👏']

const ALL_TABS = [['home', '🏠 الرئيسية'], ['register', '📝 سجّل فكرتك'], ['people', '💡 المشاركون'], ['community', '💬 المجتمع'], ['market', '🤝 سوق الأفكار'], ['ads', '📢 الإعلانات'], ['inbox', '✉️ رسائل للمدير'], ['account', '👤 حسابي']]
const CUSTOM_RE = /^custom:#[0-9a-f]{6}:#[0-9a-f]{6}$/i
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mixc = (a, b, t) => { const A = hex2rgb(a); const B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('') }
const buildTheme = (m, a) => ({ name: 'مخصص', bg1: mixc(m, '#ffffff', 0.93), bg2: mixc(a, '#ffffff', 0.94), bg3: mixc(m, '#ffffff', 0.95), hd1: mixc(m, '#000000', 0.25), hd2: m, hd3: mixc(m, '#ffffff', 0.35), navbg: mixc(m, '#ffffff', 0.92) + 'f0', pill1: a, pill2: mixc(a, '#ffffff', 0.3), act1: mixc(m, '#000000', 0.25), act2: m, h2: mixc(m, '#000000', 0.2), acc: m, btn1: m, btn2: mixc(m, '#ffffff', 0.35), tagbg: mixc(m, '#ffffff', 0.86), tagfg: mixc(m, '#000000', 0.3) })

Object.assign(THEMES, {
  teal: { ...buildTheme('#0f766e', '#f59e0b'), name: 'تركواز وذهبي' },
  orange: { ...buildTheme('#c2410c', '#0ea5e9'), name: 'برتقالي' },
  rose: { ...buildTheme('#be185d', '#7c3aed'), name: 'وردي وبنفسجي' },
  red: { ...buildTheme('#b91c1c', '#1e3a8a'), name: 'أحمر وكحلي' },
  slate: { ...buildTheme('#334155', '#22c55e'), name: 'رمادي وأخضر' },
  sky: { ...buildTheme('#0369a1', '#f97316'), name: 'سماوي وبرتقالي' },
})

const PM_TOPICS = ['استفسار', 'طلب إعلان', 'مشكلة تقنية', 'أخرى']

const MK0 = { title: '', category: 'أخرى', governorate: 'القاهرة', teaser: '', price: '' }

const STATUS = { pending: 'قيد مراجعة الدفع', approved: 'مقبولة', rejected: 'مرفوضة', sold: 'تم البيع' }
const EMPTY = { owner_name: '', phone: '', title: '', governorate: 'القاهرة', budget: '', description: '', payment_ref: '' }

const CSS = `
.fk{direction:rtl;min-height:100vh;font-family:'Segoe UI',Tahoma,'Noto Sans Arabic',system-ui,sans-serif;color:#1e293b;background:linear-gradient(180deg,var(--bg1) 0%,var(--bg2) 55%,var(--bg3) 100%);padding-bottom:40px}
.fk *{box-sizing:border-box}
.fk h1,.fk h2,.fk h3,.fk p{margin:0}
.fk-head{background:linear-gradient(135deg,var(--hd1),var(--hd2) 60%,var(--hd3));color:#fff;padding:26px 20px 30px;border-radius:0 0 34px 34px}
.fk-head h1{font-size:28px}
.fk-head p{opacity:.9;margin-top:6px}
.fk-nav{position:sticky;top:0;z-index:50;display:flex;gap:8px;padding:10px 12px;overflow-x:auto;background:var(--navbg);backdrop-filter:blur(6px)}
.fk-pill{flex:none;border:0;cursor:pointer;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:10px 15px;border-radius:18px;background:linear-gradient(135deg,var(--pill1),var(--pill2));box-shadow:0 6px 14px rgba(0,0,0,.15);opacity:.85}
.fk-pill.on{opacity:1;background:linear-gradient(135deg,var(--act1),var(--act2));box-shadow:0 6px 14px rgba(0,0,0,.3)}
.fk-sec{background:#fff;margin:14px 12px;padding:20px 16px;border-radius:26px;box-shadow:0 8px 24px rgba(30,58,138,.07)}
.fk-sec h2{font-size:22px;color:var(--h2);margin-bottom:12px}
.fk-lead{font-weight:700;line-height:2;font-size:15px}
.fk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px}
.fk-card{border:1px solid #dbe7fb;border-radius:22px;padding:14px;background:#fff}
.fk-card h3{font-size:15px;color:var(--acc);margin-bottom:6px}
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
.fk-btn{border:0;cursor:pointer;font:inherit;font-weight:700;padding:12px 20px;border-radius:16px;color:#fff;background:linear-gradient(135deg,var(--btn1),var(--btn2));margin-top:14px}
.fk-btn.g{background:linear-gradient(135deg,#22c55e,#86efac);color:#14532d}
.fk-btn.o{background:linear-gradient(135deg,#fb923c,#fde047);color:#7c2d12}
.fk-btn.r{background:#fee2e2;color:#b91c1c}
.fk-btn.w{background:var(--tagbg);color:var(--tagfg)}
.fk-btn.s{padding:8px 14px;font-size:13px;margin-top:8px;margin-left:6px}
.fk-btn:disabled{opacity:.55;cursor:default}
.fk-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:520px){.fk-two{grid-template-columns:1fr}}
.fk-sub{display:flex;gap:8px;margin-bottom:12px}
.fk-chat{height:300px;overflow-y:auto;border:1px solid #dbe7fb;border-radius:18px;padding:10px;background:#f7faff;margin-bottom:10px}
.fk-msg{padding:6px 4px;font-size:14px;border-bottom:1px solid #eef2f9}
.fk-msg b{color:var(--acc);margin-left:6px}
.fk-img{display:block;max-width:100%;max-height:260px;border-radius:14px;margin-top:6px}
.fk-ad{border:2px dashed #cbd5e1;border-radius:18px;padding:14px;text-align:center;color:#64748b;font-size:13px;margin-top:12px}
.fk-ad.on{border-style:solid;border-color:#fdba74;background:#fffaf0;color:#1e293b;font-size:15px}
.fk-ad b{display:block;color:#1e293b;margin-bottom:4px}
.fk-post{border:1px solid #dbe7fb;border-radius:18px;padding:14px;margin-top:10px}
.fk-post h3{font-size:16px;margin-bottom:4px}
.fk-post p{font-size:14px;line-height:1.8;white-space:pre-wrap}
.fk-tag{display:inline-block;font-size:12px;padding:3px 10px;border-radius:12px;background:var(--tagbg);color:var(--tagfg);margin-left:6px}
.fk-tag.ok{background:#dcfce7;color:#166534}
.fk-tag.no{background:#fee2e2;color:#b91c1c}
.fk-toast{position:fixed;top:8px;left:12px;right:12px;z-index:200;padding:12px 16px;border-radius:16px;background:var(--h2);color:#fff;font-size:14px}
.fk-empty{color:#64748b;font-size:14px;padding:8px 0}
.fk-bar{height:12px;border-radius:8px;background:#e2e8f0;overflow:hidden;margin:8px 0}
.fk-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin-top:8px}
.fk-gal .fk-img{margin:0;width:100%;height:150px;object-fit:cover;cursor:zoom-in}
.fk-gal.one{grid-template-columns:1fr}
.fk-gal.one .fk-img{height:auto;max-height:300px;object-fit:contain;background:#f1f5f9}
.fk-thumbs{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.fk-thumb{position:relative}
.fk-thumb img{width:64px;height:64px;object-fit:cover;border-radius:10px;display:block}
.fk-thumb button{position:absolute;top:-6px;left:-6px;width:22px;height:22px;border-radius:50%;border:0;background:#b91c1c;color:#fff;font-size:12px;cursor:pointer}
.fk-zoom{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.88);overflow:auto;padding:10px}
.fk-zbox{background:#fff;border-radius:18px;max-width:560px;margin:0 auto;padding:12px}
.fk-zbox img{width:100%;max-height:55vh;object-fit:contain;border-radius:12px;background:#0f172a;display:block;margin:8px 0}
.fk-gi{position:relative}
.fk-gbadge{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.7);color:#fff;border-radius:10px;padding:2px 8px;font-size:12px}
.fk-sw{display:inline-block;width:18px;height:18px;border-radius:50%;margin-left:4px;vertical-align:middle}
.fk-cert{white-space:pre-wrap;background:#f8fafc;border:1px dashed #94a3b8;border-radius:14px;padding:10px;font-size:12px;line-height:1.9;margin-top:8px;word-break:break-all}
.fk-picker{display:inline-flex;gap:2px;background:#fff;border:1px solid #cbd5e1;border-radius:20px;padding:2px 6px;margin:0 4px;box-shadow:0 4px 12px rgba(0,0,0,.15);vertical-align:middle}
.fk-picker button{border:0;background:none;font-size:22px;cursor:pointer;padding:2px 4px}
.fk-quote{background:#f1f5f9;border-right:3px solid var(--acc);border-radius:8px;padding:4px 8px;margin:4px 0;font-size:12px;color:#475569}
.fk-gbadge.l{right:auto;left:6px}
.fk-det{border-radius:16px;margin:10px 0;border:1px solid #dbe7fb;border-right:6px solid #2563eb;background:#fff;padding:4px 10px}
.fk-det summary{font-weight:700;cursor:pointer;padding:10px 0;font-size:16px}
.fk-b{max-width:88%;padding:8px 12px;border-radius:14px;margin:4px 0;font-size:14px;line-height:1.7;white-space:pre-wrap}
.fk-b.me{align-self:flex-start;background:var(--tagbg);color:var(--tagfg)}
.fk-b.ad{align-self:flex-end;background:#f1f5f9;color:#1e293b}
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
  const [versions, setVersions] = useState({})
  const [pms, setPms] = useState([])
  const [adminPms, setAdminPms] = useState([])
  const [pmDraft, setPmDraft] = useState('')
  const [pmTopic, setPmTopic] = useState('استفسار')
  const [pmOpen, setPmOpen] = useState(null)
  const [pmReply, setPmReply] = useState({})
  const [tabCfg, setTabCfg] = useState({ order: ALL_TABS.map((t) => t[0]), hidden: [] })
  const [cMain, setCMain] = useState('#1e3a8a')
  const [cAcc, setCAcc] = useState('#d4a017')
  const [openVer, setOpenVer] = useState(null)
  const [adminFilter, setAdminFilter] = useState('all')
  const [adminQuery, setAdminQuery] = useState('')
  const [reactCounts, setReactCounts] = useState({})
  const [myReacts, setMyReacts] = useState({})
  const [picker, setPicker] = useState(null)
  const [chatReply, setChatReply] = useState(null)
  const [comments, setComments] = useState({})
  const [openCm, setOpenCm] = useState(null)
  const [cmDraft, setCmDraft] = useState({})
  const [galAll, setGalAll] = useState({})
  const [upProgress, setUpProgress] = useState('')
  const [editAdId, setEditAdId] = useState(null)
  const [editAd, setEditAd] = useState({})
  const [editKeep, setEditKeep] = useState([])
  const [editNew, setEditNew] = useState([])
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
  const [chatText, setChatText] = useState('')
  const [chatFiles, setChatFiles] = useState([])
  const [post, setPost] = useState({ title: '', body: '' })
  const [postFiles, setPostFiles] = useState([])
  const [ad, setAd] = useState({ advertiser: '', phone: '', body: '', ad_date: cairoToday(), payment_ref: '', link: '' })
  const [adFiles, setAdFiles] = useState([])
  const [theme, setTheme] = useState('classic')
  const [zoom, setZoom] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [market, setMarket] = useState([])
  const [marketMine, setMarketMine] = useState([])
  const [adminMarket, setAdminMarket] = useState([])
  const [mk, setMk] = useState(MK0)
  const [contacts, setContacts] = useState({})
  const [openCert, setOpenCert] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [adReceipt, setAdReceipt] = useState(null)
  const [refCode, setRefCode] = useState(URL_REF)
  const [refCount, setRefCount] = useState(0)
  const [refReport, setRefReport] = useState([])

  const subscriber = mine.some((e) => e.status === 'approved')
  const myEntry = mine.find((e) => e.status === 'approved') || {}
  const myName = myEntry.owner_name || ''
  const myPhone = shown(session?.user?.email)
  const say = (t) => { setToast(t); setTimeout(() => setToast(''), 5000) }
  const open = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setE = (k) => (e) => setEditForm((f) => ({ ...f, [k]: e.target.value }))
  const setA = (k) => (e) => setAd((f) => ({ ...f, [k]: e.target.value }))
  const setM = (k) => (e) => setMk((f) => ({ ...f, [k]: e.target.value }))

  const loadPublic = useCallback(async () => {
    const a = await supabase.from('public_ideas').select('*').order('created_at', { ascending: false })
    if (a.data) setPeople(a.data)
    const b = await supabase.from('community_messages').select('*').order('created_at', { ascending: false }).limit(50)
    if (b.data) setMsgs([...b.data].reverse())
    const c = await supabase.from('community_posts').select('*').eq('published', true).order('created_at', { ascending: false })
    if (c.data) setPosts(c.data)
    const d = await supabase.from('todays_ads').select('*')
    if (d.data) setTodayAds(d.data)
    const st = await supabase.from('site_settings').select('*')
    if (st.data) {
      const g = (k) => (st.data.find((r) => r.key === k) || {}).value
      const tv = g('theme')
      if (tv && (THEMES[tv] || CUSTOM_RE.test(tv))) {
        setTheme(tv)
        if (CUSTOM_RE.test(tv)) { const pr = tv.split(':'); setCMain(pr[1]); setCAcc(pr[2]) }
      }
      try {
        const c = JSON.parse(g('tabs') || 'null')
        if (c && Array.isArray(c.order)) setTabCfg({ order: c.order, hidden: Array.isArray(c.hidden) ? c.hidden : [] })
      } catch (e) { /* ignore bad settings */ }
    }
    const rcs = await supabase.from('react_counts').select('*')
    if (rcs.data) {
      const o = {}
      rcs.data.forEach((r) => { const k = r.target_type + ':' + r.target_key; (o[k] = o[k] || {})[r.emoji] = r.n })
      setReactCounts(o)
    }
    const cm = await supabase.from('comments').select('*').order('created_at', { ascending: true })
    if (cm.data) {
      const o = {}
      cm.data.forEach((c) => { const k = c.target_type + ':' + c.target_id; (o[k] = o[k] || []).push(c) })
      setComments(o)
    }
    const mp = await supabase.from('market_public').select('*').order('created_at', { ascending: false })
    if (mp.data) setMarket(mp.data)
  }, [])

  const loadPrivate = useCallback(async (uid) => {
    if (!uid) { setMine([]); setMyAds([]); setIsAdmin(false); setAdminEntries([]); setAdminPosts([]); setAdminAds([]); setRefCount(0); setRefReport([]); setMarketMine([]); setAdminMarket([]); setMyReacts({}); setPms([]); setAdminPms([]); return }
    const m = await supabase.from('idea_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (m.data) setMine(m.data)
    const ma = await supabase.from('ads').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (ma.data) setMyAds(ma.data)
    const mm = await supabase.from('market_items').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (mm.data) setMarketMine(mm.data)
    const ml = await supabase.from('reacts').select('*').eq('user_id', uid)
    if (ml.data) {
      const o = {}
      ml.data.forEach((r) => { o[r.target_type + ':' + r.target_key] = r.emoji })
      setMyReacts(o)
    }
    const pm = await supabase.from('private_messages').select('*').eq('user_id', uid).order('created_at', { ascending: true })
    if (pm.data) setPms(pm.data)
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
      const am = await supabase.from('market_items').select('*').order('created_at', { ascending: false })
      if (am.data) setAdminMarket(am.data)
      const apm = await supabase.from('private_messages').select('*').order('created_at', { ascending: true })
      if (apm.data) setAdminPms(apm.data)
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

  useEffect(() => {
    if (!session) return undefined
    const t = setInterval(() => loadPrivate(session.user.id), 20000)
    return () => clearInterval(t)
  }, [session, loadPrivate])

  useEffect(() => {
    if (tab !== 'inbox' || !session) return
    if (pms.some((m) => m.from_admin && !m.read_by_user)) {
      supabase.rpc('pm_mark_read', { thread: null }).then(() => loadPrivate(session.user.id))
    }
  }, [tab, pms, session, loadPrivate])

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
        return say((sg.error.message || '').includes('already') ? 'كلمة السر غلط' : 'تعذّر إنشاء الحساب: ' + ar(sg.error))
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
      else say('تعذّر الدخول: ' + ar(r.error))
    } else say(created ? 'تم إنشاء حسابك وتسجيل دخولك' : 'تم تسجيل الدخول')
  }

  async function submitIdea(e) {
    e.preventDefault()
    if (!session) { say('سجّل دخولك الأول من قسم حسابي'); return open('account') }
    const f = form
    if (!f.owner_name || !f.phone || !f.title || !f.description || !f.payment_ref) return say('كمّل كل الحقول، ومنها رقم مرجع التحويل')
    setBusy(true)
    let receipt_path = null
    try { if (receiptFile) receipt_path = await pushReceipt(receiptFile) } catch (err) { setBusy(false); return say('تعذّر رفع صورة التحويل: ' + ar(err)) }
    const { error } = await supabase.from('idea_entries').insert({ ...f, phone: digits(f.phone), budget: f.budget ? Number(digits(f.budget)) : null, receipt_path })
    setBusy(false)
    if (error) return say('تعذّر التسجيل: ' + ar(error))
    setForm({ ...EMPTY, phone: myPhone && !myPhone.includes('@') ? myPhone : '' })
    setReceiptFile(null)
    say('تم تسجيل فكرتك. ارفع صورة التحويل أو ابعتها واتساب عشان نفعّل اشتراكك.')
    await refresh(); open('account')
  }

  function startEdit(i) {
    setEditId(i.id)
    setEditForm({ owner_name: i.owner_name, phone: i.phone, title: i.title, governorate: i.governorate, budget: i.budget == null ? '' : String(i.budget), description: i.description, payment_ref: i.payment_ref })
  }

  async function toggleVersions(id) {
    if (openVer === id) { setOpenVer(null); return }
    const { data } = await supabase.from('idea_versions').select('*').eq('idea_id', id).order('saved_at', { ascending: false })
    setVersions((v) => ({ ...v, [id]: data || [] }))
    setOpenVer(id)
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
    if (error) return say('تعذّر الحفظ: ' + ar(error))
    if (!data || data.length === 0) return say('مش مسموح بتعديل الفكرة دلوقتي')
    setEditId(null); say('تم حفظ التعديل. النسخة القديمة محفوظة في «النسخ السابقة».'); refresh()
  }

  async function removeMine(id) {
    const { error } = await supabase.from('idea_entries').delete().eq('id', id)
    if (error) say('تعذّر الحذف: ' + ar(error)); else refresh()
  }

  async function pushImage(file, bucket = 'community-images') {
    const blob = await compress(file)
    const path = session.user.id + '/' + Date.now() + '.jpg'
    const up = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' })
    if (up.error) throw up.error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function pushImages(files, bucket = 'community-images') {
    const out = []
    try {
      for (let i = 0; i < files.length; i++) {
        setUpProgress((i + 1) + ' من ' + files.length)
        out.push(await pushImage(files[i], bucket))
      }
    } finally { setUpProgress('') }
    return out
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
    } catch (err) { say('تعذّر رفع الصورة: ' + ar(err)) }
    setBusy(false)
  }

  async function sendMsg(e) {
    e.preventDefault()
    if (!subscriber) return say('للكتابة في الدردشة يجب الاشتراك')
    if (!chatText && chatFiles.length === 0) return say('اكتب رسالة أو اختار صورة')
    setBusy(true)
    try {
      const urls = await pushImages(chatFiles)
      const { error } = await supabase.from('community_messages').insert({ author: myName, body: chatText, image_url: urls[0] || null, image_urls: urls.length ? urls : null, reply_to: chatReply ? chatReply.id : null })
      if (error) throw error
      setChatText(''); setChatFiles([]); setChatReply(null); loadPublic()
    } catch (err) { say('تعذّر الإرسال: ' + ar(err)) }
    setBusy(false)
  }

  async function sendPost(e) {
    e.preventDefault()
    if (!subscriber) return say('لنشر بوست يجب الاشتراك')
    if (!post.title || !post.body) return say('اكتب العنوان والنص')
    setBusy(true)
    try {
      const urls = await pushImages(postFiles)
      const { error } = await supabase.from('community_posts').insert({ ...post, author: myName, image_url: urls[0] || null, image_urls: urls.length ? urls : null })
      if (error) throw error
      setPost({ title: '', body: '' }); setPostFiles([])
      say('تم إرسال مشاركتك وتنتظر موافقة الإدارة.')
    } catch (err) { say('تعذّر النشر: ' + ar(err)) }
    setBusy(false)
  }

  async function submitAd(e) {
    e.preventDefault()
    if (!session) { say('سجّل دخولك الأول من قسم حسابي'); return open('account') }
    const a = ad
    if (!a.advertiser || !a.phone || !a.body || !a.payment_ref) return say('كمّل كل الحقول، ومنها رقم مرجع التحويل')
    if (a.ad_date < cairoToday()) return say('اختار يوم النهارده أو يوم بعده')
    const link = a.link ? normLink(a.link) : null
    if (a.link && !link) return say('الرابط مش صحيح. اكتب رابط يبدأ بـ https أو رقم واتساب')
    setBusy(true)
    try {
      const urls = await pushImages(adFiles, 'ad-images')
      const receipt_path = adReceipt ? await pushReceipt(adReceipt) : null
      const { error } = await supabase.from('ads').insert({ advertiser: a.advertiser, phone: digits(a.phone), body: a.body, ad_date: a.ad_date, payment_ref: a.payment_ref, link, image_url: urls[0] || null, image_urls: urls.length ? urls : null, receipt_path })
      if (error) throw error
      setAd({ ...ad, body: '', payment_ref: '', link: '' }); setAdFiles([]); setAdReceipt(null)
      say('تم إرسال إعلانك. هيظهر في يومه بعد مراجعة التحويل.')
      refresh()
    } catch (err) { say('تعذّر إرسال الإعلان: ' + ar(err)) }
    setBusy(false)
  }

  async function submitMarket(e) {
    e.preventDefault()
    if (!session) { say('سجّل دخولك الأول من قسم حسابي'); return open('account') }
    if (!subscriber) return say('عرض الأفكار للمشتركين في المسابقة بس')
    const f = mk
    if (!f.title || !f.teaser) return say('اكتب عنوان ووصف مختصر للفكرة')
    setBusy(true)
    const { error } = await supabase.from('market_items').insert({ seller_name: myName, phone: myEntry.phone, title: f.title, category: f.category, governorate: f.governorate, teaser: f.teaser, price: f.price ? Number(digits(f.price)) : null })
    setBusy(false)
    if (error) return say('تعذّر إرسال العرض: ' + ar(error))
    setMk(MK0)
    say('تم إرسال عرضك. هيظهر بعد مراجعة الإدارة.')
    refresh()
  }

  async function contactSeller(id, title) {
    if (!session) { say('سجّل دخولك عشان تتواصل'); return open('account') }
    const { data, error } = await supabase.rpc('market_contact', { item_id: id })
    if (error || !data || !PHONE_RE.test(String(data))) return say('تعذّر جلب وسيلة التواصل')
    setContacts((c) => ({ ...c, [id]: waLink('أهلاً، أنا مهتم بفكرتك «' + title + '» المعروضة في منصة فكرتك مشروعك. ممكن نتكلم؟', '20' + String(data).slice(1)) }))
  }

  function saveText(name, text) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    a.download = name
    document.body.appendChild(a); a.click(); a.remove()
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); say('تم النسخ') } catch { say('تعذّر النسخ') }
  }

  async function sendPm(e) {
    e.preventDefault()
    if (!session) { say('سجّل دخولك الأول من قسم حسابي'); return open('account') }
    const body = pmDraft.trim()
    if (!body) return say('اكتب رسالتك الأول')
    const phone = PHONE_RE.test(myPhone || '') ? myPhone : (myEntry.phone || '')
    setBusy(true)
    const { error } = await supabase.from('private_messages').insert({ author: myName || phone || 'عضو', phone, topic: pmTopic, body })
    setBusy(false)
    if (error) return say('تعذّر إرسال الرسالة: ' + ar(error))
    setPmDraft('')
    say('وصلت رسالتك للمدير. هيرد عليك هنا.')
    loadPrivate(session.user.id)
  }

  async function sendAdminReply(uid) {
    const body = (pmReply[uid] || '').trim()
    if (!body) return
    const { error } = await supabase.from('private_messages').insert({ user_id: uid, from_admin: true, author: 'الإدارة', body, read_by_admin: true })
    if (error) return say('تعذّر إرسال الرد: ' + ar(error))
    setPmReply((r) => ({ ...r, [uid]: '' }))
    loadPrivate(session.user.id)
  }

  async function openThread(uid) {
    if (pmOpen === uid) { setPmOpen(null); return }
    setPmOpen(uid)
    await supabase.rpc('pm_mark_read', { thread: uid })
    loadPrivate(session.user.id)
  }

  async function saveTabs(cfg) {
    setTabCfg(cfg)
    const { error } = await supabase.from('site_settings').upsert({ key: 'tabs', value: JSON.stringify(cfg) })
    if (error) say('تعذّر حفظ الترتيب: ' + ar(error)); else say('تم حفظ الترتيب للجميع')
  }

  function moveTab(k, d) {
    const o = [...tabOrder]
    const i = o.indexOf(k)
    const j = i + d
    if (j < 0 || j >= o.length) return
    const t = o[i]
    o[i] = o[j]
    o[j] = t
    saveTabs({ order: o, hidden: tabCfg.hidden })
  }

  function toggleTab(k) {
    const h = tabCfg.hidden.includes(k) ? tabCfg.hidden.filter((x) => x !== k) : [...tabCfg.hidden, k]
    saveTabs({ order: tabOrder, hidden: h })
  }

  async function saveTheme(k) {
    setTheme(k)
    const { error } = await supabase.from('site_settings').upsert({ key: 'theme', value: k })
    if (error) say('تعذّر حفظ اللون: ' + ar(error)); else say('تم تغيير ألوان المنصة للجميع')
  }

  async function backup() {
    setBusy(true)
    try {
      const out = { exported_at: new Date().toISOString() }
      for (const t of ['idea_entries', 'ads', 'community_messages', 'community_posts', 'profiles', 'market_items', 'site_settings']) {
        const r = await supabase.from(t).select('*')
        out[t] = r.data || []
      }
      saveText('fekretak-backup-' + cairoToday() + '.json', JSON.stringify(out, null, 2))
      say('تم تنزيل النسخة الاحتياطية')
    } catch (err) { say('تعذّر عمل النسخة: ' + ar(err)) }
    setBusy(false)
  }

  async function setReact(type, key, emoji) {
    if (!session) { say('سجّل دخولك عشان تتفاعل'); return open('account') }
    const k = type + ':' + key
    const prev = myReacts[k] || null
    setPicker(null)
    setMyReacts((m) => { const n = { ...m }; if (emoji) n[k] = emoji; else delete n[k]; return n })
    setReactCounts((c) => {
      const cur = { ...(c[k] || {}) }
      if (prev) cur[prev] = Math.max(0, (cur[prev] || 0) - 1)
      if (emoji) cur[emoji] = (cur[emoji] || 0) + 1
      return { ...c, [k]: cur }
    })
    const r = emoji
      ? await supabase.from('reacts').upsert({ target_type: type, target_key: key, emoji, user_id: session.user.id }, { onConflict: 'target_type,target_key,user_id' })
      : await supabase.from('reacts').delete().eq('target_type', type).eq('target_key', key).eq('user_id', session.user.id)
    if (r.error) { say('تعذّر التفاعل: ' + ar(r.error)); refresh() }
  }

  async function addComment(type, id, imageUrl = null) {
    if (!session) { say('سجّل دخولك عشان تعلّق'); return open('account') }
    const dk = type + ':' + id + ':' + (imageUrl || '')
    const body = (cmDraft[dk] || '').trim()
    if (!body) return
    const parent = replyTo && replyTo.dk === dk ? replyTo.id : null
    const author = myName || (myPhone && !myPhone.includes('@') ? myPhone.slice(0, 3) + '****' + myPhone.slice(-2) : 'عضو')
    const { error } = await supabase.from('comments').insert({ target_type: type, target_id: id, author, body, image_url: imageUrl, parent_id: parent })
    if (error) return say('تعذّر التعليق: ' + ar(error))
    setCmDraft((d) => ({ ...d, [dk]: '' }))
    setReplyTo(null)
    loadPublic()
  }

  function startAdEdit(a) {
    setEditAdId(a.id)
    setEditAd({ advertiser: a.advertiser, phone: a.phone, body: a.body, ad_date: a.ad_date, payment_ref: a.payment_ref, link: a.link || '' })
    setEditKeep(imgsOf(a))
    setEditNew([])
  }

  async function saveAdEdit() {
    const f = editAd
    if (!f.advertiser || !f.phone || !f.body || !f.payment_ref) return say('كمّل كل الحقول')
    if (f.ad_date < cairoToday()) return say('اختار يوم النهارده أو يوم بعده')
    const link = f.link ? normLink(f.link) : null
    if (f.link && !link) return say('الرابط مش صحيح. اكتب رابط يبدأ بـ https أو رقم واتساب')
    setBusy(true)
    try {
      const added = await pushImages(editNew, 'ad-images')
      const urls = [...editKeep, ...added]
      const { data, error } = await supabase.from('ads').update({
        advertiser: f.advertiser, phone: digits(f.phone), body: f.body, ad_date: f.ad_date, payment_ref: f.payment_ref, link,
        image_url: urls[0] || null, image_urls: urls.length ? urls : null,
      }).eq('id', editAdId).select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('مينفعش تعديل الإعلان بعد مراجعته')
      setEditAdId(null); say('تم حفظ تعديل الإعلان'); refresh()
    } catch (err) { say('تعذّر الحفظ: ' + ar(err)) }
    setBusy(false)
  }

  async function upd(table, id, patch) {
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) say('تعذّر التحديث: ' + ar(error)); else refresh()
  }
  async function del(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) say('تعذّر الحذف: ' + ar(error)); else refresh()
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
      ? todayAds.map((a) => <div className="fk-ad on" key={a.id}><span className="fk-small">إعلان</span><b style={{ fontSize: 17 }}>{a.advertiser}</b>{gallery(a, 'ad')}<div>{a.body}</div>{isHttps(a.link) && <a className="fk-btn g s" style={{ display: 'inline-block', textDecoration: 'none' }} href={a.link} target="_blank" rel="noopener noreferrer nofollow sponsored">🔗 رابط {a.advertiser}</a>}{PHONE_RE.test(a.phone || '') && (
        <div style={{ marginTop: 6 }}>
          <a className="fk-btn s" style={{ display: 'inline-block', textDecoration: 'none' }} href={'tel:' + a.phone}>📞 <span dir="ltr">{a.phone}</span></a>
          <a className="fk-btn g s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waLink('أهلاً، شفت إعلانك «' + a.advertiser + '» في منصة فكرتك مشروعك', '20' + a.phone.slice(1))} target="_blank" rel="noopener noreferrer">💬 واتساب</a>
        </div>
      )}{engage('ad', a.id)}</div>)
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

  const verList = (id) => (
    openVer === id && (
      <div style={{ marginTop: 6 }}>
        {(versions[id] || []).length === 0 && <p className="fk-small">لا توجد نسخ سابقة.</p>}
        {(versions[id] || []).map((v) => (
          <div className="fk-quote" key={v.id}>
            <b>{v.title}</b> • {v.governorate}{v.budget ? ' • ' + v.budget + ' جنيه' : ''}
            <div className="fk-small">محفوظة بتاريخ {fmtTime(v.saved_at)}{v.proof_at ? ' • كانت مسجّلة في ' + fmtTime(v.proof_at) : ''}</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{v.description}</div>
            {v.proof_hash && <div className="fk-small" dir="ltr" style={{ textAlign: 'left', wordBreak: 'break-all' }}>SHA-256: {v.proof_hash}</div>}
          </div>
        ))}
      </div>
    )
  )

  const reactBar = (type, key) => {
    const k = type + ':' + key
    const counts = reactCounts[k] || {}
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const mine = myReacts[k]
    const top = Object.entries(counts).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]).join('')
    return (
      <span>
        <button type="button" className={'fk-btn s ' + (mine ? '' : 'w')} onClick={() => setPicker(picker === k ? null : k)}>
          {mine || '👍'} {mine ? 'تفاعلت' : 'إعجاب'}{total > 0 ? ' ' + top + ' ' + total : ''}
        </button>
        {picker === k && (
          <span className="fk-picker">
            {EMOJIS.map((e) => <button type="button" key={e} onClick={() => setReact(type, key, e)}>{e}</button>)}
            {mine && <button type="button" onClick={() => setReact(type, key, null)}>✕</button>}
          </span>
        )}
      </span>
    )
  }

  const gallery = (row, type = null) => {
    const list = imgsOf(row)
    if (list.length === 0) return null
    const all = galAll[row.id]
    const shownList = all ? list : list.slice(0, 6)
    return (
      <>
        <div className={'fk-gal' + (list.length === 1 ? ' one' : '')}>
          {shownList.map((u) => {
            const cnt = type ? (comments[type + ':' + row.id] || []).filter((c) => c.image_url === u).length : 0
            return (
              <div className="fk-gi" key={u}>
                <img className="fk-img" src={u} alt="" loading="lazy" onClick={() => setZoom({ url: u, type, id: row.id })} />
                {cnt > 0 && <span className="fk-gbadge">💬 {cnt}</span>}
                {Object.values(reactCounts['image:' + u] || {}).reduce((a, b) => a + b, 0) > 0 && <span className="fk-gbadge l">{Object.entries(reactCounts['image:' + u]).sort((a, b) => b[1] - a[1])[0][0]} {Object.values(reactCounts['image:' + u]).reduce((a, b) => a + b, 0)}</span>}
              </div>
            )
          })}
        </div>
        {type && type !== 'msg' && <p className="fk-small">💬 اضغط على أي صورة للتعليق عليها</p>}
        {list.length > 6 && <button type="button" className="fk-btn w s" onClick={() => setGalAll((g) => ({ ...g, [row.id]: !all }))}>{all ? 'إخفاء' : 'عرض كل الصور (' + list.length + ')'}</button>}
      </>
    )
  }

  const thread = (type, id, imageUrl) => {
    const k = type + ':' + id
    const dk = k + ':' + (imageUrl || '')
    const all = (comments[k] || []).filter((c) => (c.image_url || null) === (imageUrl || null))
    const tops = all.filter((c) => !c.parent_id)
    const kids = (pid) => all.filter((c) => c.parent_id === pid)
    const rt = replyTo && replyTo.dk === dk ? replyTo : null
    const row = (c, isReply) => (
      <div className="fk-msg" key={c.id} style={isReply ? { marginRight: 22, background: '#f8fafc', borderRadius: 10 } : null}>
        <b>{c.author}</b>{c.body}
        <span className="fk-small" style={{ marginRight: 6 }}>{fmtTime(c.created_at)}</span>
        <div>
          {reactBar('comment', c.id)}
          <button type="button" className="fk-btn w s" onClick={() => { setReplyTo({ dk, id: c.parent_id || c.id, author: c.author }); if (isReply) setCmDraft((d) => ({ ...d, [dk]: '@' + c.author + ' ' })) }}>↩ رد</button>
          {(isAdmin || (session && c.user_id === session.user.id)) && <button type="button" className="fk-btn r s" onClick={() => del('comments', c.id)}>حذف</button>}
        </div>
      </div>
    )
    return (
      <div>
        {tops.length === 0 && <p className="fk-empty">لا توجد تعليقات. كن أول من يعلّق.</p>}
        {tops.map((c) => <div key={c.id}>{row(c, false)}{kids(c.id).map((r) => row(r, true))}</div>)}
        <form onSubmit={(e) => { e.preventDefault(); addComment(type, id, imageUrl) }}>
          {rt && <div className="fk-small">بترد على {rt.author} <button type="button" className="fk-btn r s" onClick={() => setReplyTo(null)}>إلغاء الرد</button></div>}
          <input value={cmDraft[dk] || ''} onChange={(e) => setCmDraft((d) => ({ ...d, [dk]: e.target.value }))} placeholder={rt ? 'اكتب ردك...' : 'اكتب تعليقك...'} maxLength={300} />
          <button className="fk-btn s">إرسال</button>
        </form>
      </div>
    )
  }

  const engage = (type, id) => {
    const k = type + ':' + id
    const list = comments[k] || []
    return (
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        {reactBar(type, id)}
        <button type="button" className="fk-btn w s" onClick={() => setOpenCm(openCm === k ? null : k)}>💬 {list.length} تعليق</button>
        {openCm === k && <div style={{ marginTop: 8 }}>{thread(type, id, null)}</div>}
      </div>
    )
  }

  const imgsPicker = (files, setFiles, label = 'إرفاق صور') => (
    <div style={{ marginTop: 8 }}>
      <label className="fk-btn w s" style={{ display: 'inline-block', margin: 0 }}>
        📷 {files.length ? 'إضافة صور تانية (' + files.length + ')' : label}
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { const add = Array.from(e.target.files || []); setFiles([...files, ...add]); e.target.value = '' }} />
      </label>
      {files.length > 0 && <Thumbs files={files} setFiles={setFiles} />}
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

  const themeVars = Object.fromEntries(Object.entries(THEMES[theme] || (CUSTOM_RE.test(theme) ? buildTheme(theme.split(':')[1], theme.split(':')[2]) : THEMES.classic)).filter(([k]) => k !== 'name').map(([k, v]) => ['--' + k, v]))

  if (!ready) return <div className="fk" style={themeVars}><style>{CSS}</style><div className="fk-sec">جارٍ التحميل...</div></div>

  const unreadUser = pms.filter((m) => m.from_admin && !m.read_by_user).length
  const unreadAdmin = adminPms.filter((m) => !m.from_admin && !m.read_by_admin).length
  const tabOrder = [...tabCfg.order.filter((k) => ALL_TABS.some((t) => t[0] === k)), ...ALL_TABS.map((t) => t[0]).filter((k) => !tabCfg.order.includes(k))]
  const TABS = tabOrder.filter((k) => k === 'home' || k === 'account' || !tabCfg.hidden.includes(k)).map((k) => { const t = ALL_TABS.find((x) => x[0] === k); return k === 'inbox' && unreadUser > 0 ? [t[0], t[1] + ' (' + unreadUser + ')'] : t })
  const pend = (a) => a.filter((x) => x.status === 'pending').length
  const pendingCount = pend(adminEntries) + pend(adminAds) + pend(adminMarket) + adminPosts.length + unreadAdmin
  if (isAdmin) TABS.push(['admin', '⚙️ المدير' + (pendingCount ? ' (' + pendingCount + ')' : '')])

  const feeNotice = (
    <div className="fk-note" style={{ marginTop: 10 }}>
      <b>تنبيه مهم:</b> رسوم الـ 10 جنيه هي <b>رسوم اشتراك في المنصة لدخول المسابقة</b>. الأفكار بيقيّمها <b>كفاءات حسب تخصص كل فكرة</b>، وبعد تصفية كل الأفكار بيتم نشر <b>أفضل 100 مشروع من كل محافظة</b> للجمهور للتقييم.
    </div>
  )

  const inboxTab = () => (
    <section className="fk-sec">
      <h2>✉️ رسائل للمدير</h2>
      <p className="fk-small">للاستفسار أو طلب إعلان أو أي مشكلة، ابعت رسالتك هنا على الخاص، والمدير المسؤول بيرد عليك في نفس المكان.</p>
      {feeNotice}
      {!session && <div className="fk-note" style={{ marginBottom: 8 }}>سجّل دخولك الأول برقم موبايلك. <button type="button" className="fk-btn o s" onClick={() => open('account')}>سجّل دخولك</button></div>}
      {session && (
        <>
          <div className="fk-chat" style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            {pms.length === 0 && <p className="fk-empty">لا توجد رسائل بعد. اكتب رسالتك تحت.</p>}
            {pms.map((m) => (
              <div key={m.id} className={'fk-b ' + (m.from_admin ? 'ad' : 'me')}>
                {m.from_admin && <div className="fk-small">🛡️ الإدارة</div>}
                {!m.from_admin && m.topic && <div className="fk-small">[{m.topic}]</div>}
                {m.body}
                <div className="fk-small">{fmtTime(m.created_at)}</div>
              </div>
            ))}
          </div>
          <form onSubmit={sendPm}>
            <select value={pmTopic} onChange={(e) => setPmTopic(e.target.value)}>{PM_TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
            <textarea style={{ marginTop: 8 }} maxLength={1000} value={pmDraft} onChange={(e) => setPmDraft(e.target.value)} placeholder="اكتب رسالتك للمدير..." />
            <button className="fk-btn" disabled={busy}>إرسال للمدير</button>
          </form>
        </>
      )}
    </section>
  )

  const home = () => (
    <>
      <section className="fk-sec">
        <h2>هدف المنصة: نكتشف فكرتك ونمنحها فرصة حقيقية</h2>
        <p className="fk-lead">منصة «فكرتك مشروعك» تهدف لاكتشاف أصحاب الأفكار والمشروعات الواعدة من جميع محافظات مصر، وفحص الأفكار ومعاينتها حسب طبيعة المشروع، والاستفادة من رأي الجمهور، ثم اختيار أفضل الأفكار للمنافسة على مستوى الجمهورية.</p>
        <div className="fk-grid">
          {STEPS.map(([n, t, d]) => <div className="fk-card" key={t}><h3>{n} {t}</h3><p>{d}</p></div>)}
        </div>
        {feeNotice}
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
        <p style={{ marginTop: 8 }}>تفاصيل فكرتك لا تظهر للجمهور، ويظهر فقط اسمك ومحافظتك. وتقدر تعدّل بياناتها من «حسابي» قبل ما تتم مراجعتها. وبتاخد شهادة تسجيل بوقت وبصمة رقمية تثبت إن فكرتك سابقة.</p>
        <p className="fk-small" style={{ marginTop: 8 }}>هذه صياغة تنظيمية مبدئية للمنصة، ويُفضّل مراجعتها واعتمادها من محامٍ مصري قبل الإطلاق التجاري النهائي.</p>
      </div>
      <section className="fk-sec">
        <h2>📝 تسجيل فكرة مشروع</h2>
        {!session && <div className="fk-note" style={{ marginTop: 0, marginBottom: 8 }}>لازم تسجّل بحسابك الأول (برقم موبايلك بس). <button type="button" className="fk-btn o s" onClick={() => open('account')}>سجّل دخولك</button></div>}
        {feeNotice}
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
                {m.reply_to && (() => { const o = msgs.find((x) => x.id === m.reply_to); return <div className="fk-quote">↪ {o ? o.author + ': ' + (o.body || '📷 صورة').slice(0, 60) : 'رسالة قديمة'}</div> })()}
                <b>{m.author}</b>{m.body}
                {gallery(m, 'msg')}
                <div>
                  {reactBar('msg', m.id)}
                  <button type="button" className="fk-btn w s" onClick={() => setChatReply({ id: m.id, author: m.author })}>↩ رد</button>
                  {isAdmin && <button type="button" className="fk-btn r s" onClick={() => del('community_messages', m.id)}>حذف</button>}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMsg}>
            {chatReply && <div className="fk-small">بترد على {chatReply.author} <button type="button" className="fk-btn r s" onClick={() => setChatReply(null)}>إلغاء الرد</button></div>}
            <input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder={myName ? 'اكتب رسالتك باسم ' + myName : 'اكتب رسالتك'} maxLength={500} />
            {imgsPicker(chatFiles, setChatFiles)}
            <button className="fk-btn g" disabled={busy}>إرسال الرسالة</button>
            <span className="fk-small" style={{ marginRight: 8 }}>للكتابة في الدردشة يجب الاشتراك.</span>
          </form>
          {adsStrip()}
        </>
      ) : (
        <>
          <p className="fk-small" style={{ marginBottom: 10 }}>يمكن للجميع مشاهدة البوستات، والمشتركون فقط يمكنهم نشر مشاركات جديدة. المنشورات تمر على موافقة الإدارة قبل النشر.</p>
          <form onSubmit={sendPost} style={{ background: '#fffaee', padding: 12, borderRadius: 18 }}>
            <input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} placeholder="عنوان البوست" />
            <textarea style={{ marginTop: 8 }} value={post.body} onChange={(e) => setPost({ ...post, body: e.target.value })} placeholder="اكتب مشاركتك أو فكرتك أو تجربتك..." />
            {imgsPicker(postFiles, setPostFiles)}
            <button className="fk-btn" disabled={busy}>نشر المشاركة</button>
            <span className="fk-small" style={{ marginRight: 8 }}>لنشر بوست يجب الاشتراك.</span>
          </form>
          {posts.length === 0 && <p className="fk-empty" style={{ marginTop: 10 }}>لا توجد بوستات بعد.</p>}
          {posts.map((p) => (
            <div className="fk-post" key={p.id}>
              <h3>{p.title}</h3><span className="fk-small">{p.author}</span>
              <p style={{ marginTop: 6 }}>{p.body}</p>
              {gallery(p, 'post')}
              {engage('post', p.id)}
            </div>
          ))}
          {adsStrip()}
        </>
      )}
    </section>
  )

  const marketTab = () => (
    <>
      <section className="fk-sec">
        <h2>🤝 سوق الأفكار</h2>
        <div className="fk-note" style={{ marginTop: 0 }}>هنا أصحاب الأفكار يعرضوا أفكارهم للبيع أو التبادل. بنعرض وصف مختصر بس. <b>متسلّمش تفاصيل فكرتك لأي حد قبل ما تتفقوا وتوقّعوا اتفاق مكتوب.</b> المنصة وسيط للتعارف وليست طرفًا في أي صفقة.</div>
        {market.length === 0 && <p className="fk-empty">لا توجد عروض حاليًا.</p>}
        {market.map((m) => (
          <div className="fk-post" key={m.id}>
            <h3>{m.title}</h3>
            <span className="fk-tag">{m.category}</span>
            <span className="fk-tag">{m.governorate}</span>
            {m.status === 'sold' && <span className="fk-tag no">تم البيع</span>}
            <p style={{ marginTop: 6 }}>{m.teaser}</p>
            <p className="fk-small">👤 {m.seller_name} • {m.price ? m.price + ' جنيه' : 'السعر بالاتفاق'}</p>
            {m.status !== 'sold' && (contacts[m.id]
              ? <a className="fk-btn g s" style={{ display: 'inline-block', textDecoration: 'none' }} href={contacts[m.id]} target="_blank" rel="noopener noreferrer">💬 افتح واتساب</a>
              : <button type="button" className="fk-btn w s" onClick={() => contactSeller(m.id, m.title)}>💬 تواصل مع صاحب الفكرة</button>)}
          </div>
        ))}
      </section>
      <section className="fk-sec">
        <h2>➕ اعرض فكرتك</h2>
        {!session && <div className="fk-note" style={{ marginTop: 0, marginBottom: 8 }}>سجّل دخولك الأول. <button type="button" className="fk-btn o s" onClick={() => open('account')}>سجّل دخولك</button></div>}
        {session && !subscriber && <div className="fk-note" style={{ marginTop: 0, marginBottom: 8 }}>عرض الأفكار متاح للمشتركين في المسابقة بس (بعد قبول اشتراكك).</div>}
        <form onSubmit={submitMarket}>
          <label>عنوان العرض</label>
          <input maxLength={80} value={mk.title} onChange={setM('title')} placeholder="مثال: فكرة تطبيق توصيل للمناطق النائية" />
          <div className="fk-two">
            <div><label>المجال</label>
              <select value={mk.category} onChange={setM('category')}>{[...CATS.map((c) => c[1]), 'أخرى'].map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <div><label>المحافظة</label>
              <select value={mk.governorate} onChange={setM('governorate')}>{GOVS.map((g) => <option key={g}>{g}</option>)}</select>
            </div>
          </div>
          <label>وصف مختصر (بدون تفاصيل سرّية، 300 حرف)</label>
          <textarea maxLength={300} value={mk.teaser} onChange={setM('teaser')} />
          <label>السعر المطلوب بالجنيه (اختياري)</label>
          <input inputMode="numeric" value={mk.price} onChange={setM('price')} />
          <button className="fk-btn" disabled={busy}>إرسال العرض للمراجعة</button>
        </form>
      </section>
      {session && (
        <section className="fk-sec">
          <h2>عروضي</h2>
          {marketMine.length === 0 && <p className="fk-empty">لم تعرض أفكارًا بعد.</p>}
          {marketMine.map((m) => (
            <div className="fk-post" key={m.id}>
              <h3>{m.title}</h3>
              <span className={'fk-tag ' + tag(m.status)}>{STATUS[m.status]}</span>
              <button type="button" className="fk-btn r s" onClick={() => del('market_items', m.id)}>حذف</button>
            </div>
          ))}
        </section>
      )}
    </>
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
          <p className="fk-small">اسم المعلن ورقم الهاتف هيظهروا في الإعلان عشان العملاء يتواصلوا معاك.</p>
          <label>نص الإعلان (200 حرف بحد أقصى)</label>
          <textarea maxLength={200} value={ad.body} onChange={setA('body')} />
          <label>صورة الإعلان (اختياري)</label>
          {imgsPicker(adFiles, setAdFiles, 'ارفع صور الإعلان')}
          <label>رابط صفحتك أو موقعك أو رقم واتساب (اختياري)</label>
          <input dir="ltr" value={ad.link} onChange={setA('link')} placeholder="https://facebook.com/صفحتك  أو  01xxxxxxxxx" />
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
              {editAdId === a.id ? (
                <>
                  <input value={editAd.advertiser || ''} onChange={(e) => setEditAd({ ...editAd, advertiser: e.target.value })} placeholder="اسم المعلن" />
                  <input style={{ marginTop: 8 }} dir="ltr" value={editAd.phone || ''} onChange={(e) => setEditAd({ ...editAd, phone: e.target.value })} placeholder="الهاتف" />
                  <textarea style={{ marginTop: 8 }} maxLength={200} value={editAd.body || ''} onChange={(e) => setEditAd({ ...editAd, body: e.target.value })} />
                  <input style={{ marginTop: 8 }} dir="ltr" value={editAd.link || ''} onChange={(e) => setEditAd({ ...editAd, link: e.target.value })} placeholder="رابط صفحتك أو واتساب (اختياري)" />
                  <input style={{ marginTop: 8 }} type="date" min={cairoToday()} value={editAd.ad_date || ''} onChange={(e) => setEditAd({ ...editAd, ad_date: e.target.value })} />
                  <input style={{ marginTop: 8 }} value={editAd.payment_ref || ''} onChange={(e) => setEditAd({ ...editAd, payment_ref: e.target.value })} placeholder="مرجع التحويل" />
                  {editKeep.length > 0 && (
                    <div className="fk-thumbs">
                      {editKeep.map((u) => (
                        <div className="fk-thumb" key={u}><img src={u} alt="" /><button type="button" onClick={() => setEditKeep(editKeep.filter((x) => x !== u))}>✕</button></div>
                      ))}
                    </div>
                  )}
                  {imgsPicker(editNew, setEditNew, 'إضافة صور')}
                  <button type="button" className="fk-btn g s" disabled={busy} onClick={saveAdEdit}>حفظ التعديل</button>
                  <button type="button" className="fk-btn w s" onClick={() => setEditAdId(null)}>إلغاء</button>
                </>
              ) : (
                <>
                  <span className={'fk-tag ' + tag(a.status)}>{STATUS[a.status]}</span>
                  <span className="fk-tag">{a.ad_date}</span>
                  <p style={{ marginTop: 6 }}>{a.body}</p>
                  {a.link && <p className="fk-small" dir="ltr" style={{ textAlign: 'left' }}>🔗 {a.link}</p>}
                  {gallery(a)}
                  {a.status === 'pending' && (
                    <div>
                      <button type="button" className="fk-btn w s" onClick={() => startAdEdit(a)}>✏️ تعديل</button>
                      <button type="button" className="fk-btn r s" onClick={() => del('ads', a.id)}>حذف</button>
                    </div>
                  )}
                </>
              )}
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
                  <p className="fk-small">{i.budget ? 'الميزانية: ' + i.budget + ' جنيه • ' : ''}سُجّلت: {fmtTime(i.created_at)}{i.edited_at ? ' • آخر تعديل: ' + fmtTime(i.edited_at) : ''}</p>
                  {i.edited_at && (
                    <div>
                      <button type="button" className="fk-btn w s" onClick={() => toggleVersions(i.id)}>🕘 النسخ السابقة</button>
                      {verList(i.id)}
                    </div>
                  )}
                  {i.proof_hash && (
                    <div>
                      <button type="button" className="fk-btn w s" onClick={() => setOpenCert(openCert === i.id ? null : i.id)}>📜 شهادة التسجيل</button>
                      {openCert === i.id && (
                        <>
                          <div className="fk-cert">{certText(i)}</div>
                          <button type="button" className="fk-btn s" onClick={() => copyText(certText(i))}>📋 نسخ</button>
                          <button type="button" className="fk-btn s" onClick={() => saveText('certificate-' + String(i.id).slice(0, 8) + '.txt', certText(i))}>⬇ تنزيل</button>
                        </>
                      )}
                    </div>
                  )}
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
                  <button type="button" className="fk-btn w s" onClick={() => startEdit(i)}>✏️ تعديل فكرتي</button>
                  {i.status === 'pending' && <button type="button" className="fk-btn r s" onClick={() => removeMine(i.id)}>حذف</button>}
                </>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  )

  const admin = () => {
    const lastAt = (uid) => adminPms.filter((m) => m.user_id === uid).slice(-1)[0].created_at
    const threadIds = [...new Set(adminPms.map((m) => m.user_id))].sort((a, b) => lastAt(b).localeCompare(lastAt(a)))
    const sec = (color, title, count, open, body) => (
      <details className="fk-det" style={{ borderRightColor: color }} open={open}>
        <summary>{title}{count > 0 && <span className="fk-tag no" style={{ marginRight: 8 }}>{count}</span>}</summary>
        {body}
      </details>
    )
    return (
      <section className="fk-sec">
        <h2>⚙️ تحكم المدير</h2>
      <div className="fk-offer" style={{ fontSize: 14 }}>
        بانتظار المراجعة: {pend(adminEntries)} اشتراك • {pend(adminAds)} إعلان • {adminPosts.length} بوست • {pend(adminMarket)} عرض
        <br /><button type="button" className="fk-btn s" onClick={refresh}>🔄 تحديث</button>
      </div>
        {sec('#0891b2', '✉️ الرسائل الخاصة (' + threadIds.length + ')', unreadAdmin, true, (
          <>
            {threadIds.length === 0 && <p className="fk-empty">لا توجد رسائل.</p>}
            {threadIds.map((uid) => {
              const list = adminPms.filter((m) => m.user_id === uid)
              const first = list.find((m) => !m.from_admin) || list[0]
              const unread = list.filter((m) => !m.from_admin && !m.read_by_admin).length
              return (
                <div className="fk-post" key={uid}>
                  <h3>👤 {first.author || 'عضو'} {unread > 0 && <span className="fk-tag no">{unread} جديدة</span>}</h3>
                  <p className="fk-small">{first.phone ? <span dir="ltr">{first.phone}</span> : null} • آخر رسالة: {fmtTime(list[list.length - 1].created_at)}</p>
                  <button type="button" className="fk-btn w s" onClick={() => openThread(uid)}>{pmOpen === uid ? 'إخفاء' : '💬 فتح المحادثة'}</button>
                  {waUser(first.phone, 'أهلاً، بخصوص رسالتك في فكرتك مشروعك:') && <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waUser(first.phone, 'أهلاً، بخصوص رسالتك في فكرتك مشروعك:')} target="_blank" rel="noopener noreferrer">واتساب</a>}
                  {pmOpen === uid && (
                    <div>
                      <div className="fk-chat" style={{ display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: 320, marginTop: 8 }}>
                        {list.map((m) => (
                          <div key={m.id} className={'fk-b ' + (m.from_admin ? 'me' : 'ad')}>
                            {!m.from_admin && m.topic && <div className="fk-small">[{m.topic}]</div>}
                            {m.body}
                            <div className="fk-small">{fmtTime(m.created_at)}</div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={(e) => { e.preventDefault(); sendAdminReply(uid) }}>
                        <textarea maxLength={1000} value={pmReply[uid] || ''} onChange={(e) => setPmReply((r) => ({ ...r, [uid]: e.target.value }))} placeholder="اكتب ردك..." />
                        <button className="fk-btn g s">إرسال الرد</button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}
        {sec('#2563eb', '💡 الأفكار والاشتراكات (' + adminEntries.length + ')', pend(adminEntries), true, (
          <>
      <div className="fk-two">
        <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
          <option value="all">كل الأفكار</option>
          <option value="pending">بانتظار المراجعة</option>
          <option value="approved">مقبولة</option>
          <option value="rejected">مرفوضة</option>
        </select>
        <input value={adminQuery} onChange={(e) => setAdminQuery(e.target.value)} placeholder="بحث: اسم / هاتف / مشروع" />
      </div>
      {adminEntries.length === 0 && <p className="fk-empty">لا توجد أفكار.</p>}
      {[...adminEntries]
        .filter((i) => (adminFilter === 'all' || i.status === adminFilter) && (!adminQuery || [i.owner_name, i.phone, i.title].join(' ').includes(adminQuery.trim())))
        .sort(byPending)
        .map((i) => (
        <div className="fk-post" key={i.id}>
          <h3>{i.title}</h3>
          <span className={'fk-tag ' + tag(i.status)}>{STATUS[i.status]}</span>
          {i.published && <span className="fk-tag ok">ظاهر</span>}
          {i.edited_at && <span className="fk-tag no">✏️ اتعدّلت</span>}
          <p className="fk-small" style={{ lineHeight: 1.9 }}>
            👤 {i.owner_name} • {i.governorate} • <span dir="ltr">{i.phone}</span><br />
            الميزانية: {i.budget ? i.budget + ' جنيه' : 'غير محددة'}<br />
            سُجّلت: {fmtTime(i.created_at)}{i.edited_at ? ' • آخر تعديل: ' + fmtTime(i.edited_at) : ''}<br />
            مرجع التحويل: <b dir="ltr">{i.payment_ref}</b>
          </p>
          <p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{i.description}</p>
          {i.proof_hash && <p className="fk-small" dir="ltr" style={{ textAlign: 'left', wordBreak: 'break-all' }}>🔐 {fmtTime(i.proof_at)} • SHA-256: {i.proof_hash}</p>}
          <Receipt path={i.receipt_path} />
          {i.edited_at && (
            <div>
              <button type="button" className="fk-btn w s" onClick={() => toggleVersions(i.id)}>🕘 النسخ السابقة</button>
              {verList(i.id)}
            </div>
          )}
          {waUser(i.phone, 'أهلاً، بخصوص اشتراكك في فكرتك مشروعك:') && <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waUser(i.phone, 'أهلاً، بخصوص اشتراكك في فكرتك مشروعك:')} target="_blank" rel="noopener noreferrer">💬 واتساب</a>}
          <button className="fk-btn g s" onClick={() => upd('idea_entries', i.id, { status: 'approved' })}>قبول الاشتراك</button>
          <button className="fk-btn r s" onClick={() => upd('idea_entries', i.id, { status: 'rejected', published: false })}>رفض</button>
          {i.status === 'approved' && <button className="fk-btn s" onClick={() => upd('idea_entries', i.id, { published: !i.published })}>{i.published ? 'إخفاء' : 'إظهار في المشاركين'}</button>}
          <button className="fk-btn r s" onClick={() => del('idea_entries', i.id)}>حذف</button>
        </div>
      ))}
          </>
        ))}
        {sec('#ea580c', '📢 الإعلانات (' + adminAds.length + ')', pend(adminAds), true, (
          <>
      {adminAds.length === 0 && <p className="fk-empty">لا توجد إعلانات.</p>}
      {[...adminAds].sort(byPending).map((a) => (
        <div className="fk-post" key={a.id}>
          <span className={'fk-tag ' + tag(a.status)}>{STATUS[a.status]}</span>
          <span className="fk-tag">{a.ad_date}</span>
          <p className="fk-small" style={{ lineHeight: 1.9 }}>{a.advertiser} • <span dir="ltr">{a.phone}</span><br />مرجع التحويل: <b dir="ltr">{a.payment_ref}</b></p>
          {isHttps(a.link) && <p className="fk-small" dir="ltr" style={{ textAlign: 'left' }}>🔗 <a href={a.link} target="_blank" rel="noopener noreferrer nofollow">{a.link}</a></p>}
          <p style={{ marginTop: 6 }}>{a.body}</p>
          {gallery(a)}
          <Receipt path={a.receipt_path} />
          {waUser(a.phone, 'أهلاً، بخصوص إعلانك في فكرتك مشروعك:') && <a className="fk-btn w s" style={{ display: 'inline-block', textDecoration: 'none' }} href={waUser(a.phone, 'أهلاً، بخصوص إعلانك في فكرتك مشروعك:')} target="_blank" rel="noopener noreferrer">💬 واتساب</a>}
          <button className="fk-btn g s" onClick={() => upd('ads', a.id, { status: 'approved' })}>قبول</button>
          <button className="fk-btn r s" onClick={() => upd('ads', a.id, { status: 'rejected' })}>رفض</button>
          <button className="fk-btn r s" onClick={() => del('ads', a.id)}>حذف</button>
        </div>
      ))}
          </>
        ))}
        {sec('#7c3aed', '📰 بوستات تنتظر الموافقة', adminPosts.length, false, (
          <>
      {adminPosts.length === 0 && <p className="fk-empty">لا توجد بوستات معلقة.</p>}
      {adminPosts.map((p) => (
        <div className="fk-post" key={p.id}>
          <h3>{p.title}</h3><span className="fk-small">{p.author}</span>
          <p style={{ marginTop: 6 }}>{p.body}</p>
          {gallery(p)}
          <button className="fk-btn g s" onClick={() => upd('community_posts', p.id, { published: true })}>نشر</button>
          <button className="fk-btn r s" onClick={() => del('community_posts', p.id)}>حذف</button>
        </div>
      ))}
          </>
        ))}
        {sec('#059669', '🤝 عروض سوق الأفكار (' + adminMarket.length + ')', pend(adminMarket), false, (
          <>
      {adminMarket.length === 0 && <p className="fk-empty">لا توجد عروض.</p>}
      {[...adminMarket].sort(byPending).map((m) => (
        <div className="fk-post" key={m.id}>
          <h3>{m.title}</h3>
          <span className={'fk-tag ' + tag(m.status)}>{STATUS[m.status]}</span>
          <span className="fk-tag">{m.category}</span>
          <p className="fk-small">{m.seller_name} • <span dir="ltr">{m.phone}</span> • {m.price ? m.price + ' جنيه' : 'بالاتفاق'}</p>
          <p style={{ marginTop: 6 }}>{m.teaser}</p>
          <button className="fk-btn g s" onClick={() => upd('market_items', m.id, { status: 'approved' })}>قبول</button>
          <button className="fk-btn r s" onClick={() => upd('market_items', m.id, { status: 'rejected' })}>رفض</button>
          <button className="fk-btn w s" onClick={() => upd('market_items', m.id, { status: 'sold' })}>تم البيع</button>
          <button className="fk-btn r s" onClick={() => del('market_items', m.id)}>حذف</button>
        </div>
      ))}
          </>
        ))}
        {sec('#db2777', '🎁 الدعوات', 0, false, (
          <>
      {refReport.length === 0 && <p className="fk-empty">لا توجد دعوات بعد.</p>}
      {refReport.map((r) => (
        <div className="fk-post" key={r.phone}>
          <span dir="ltr">{r.phone}</span> • {r.referred} مشترك
          {r.bonus && <span className="fk-tag ok" style={{ marginRight: 8 }}>+5% في التقييم</span>}
        </div>
      ))}
          </>
        ))}
        {sec('#475569', '🎨 الألوان والترتيب والنسخ الاحتياطي', 0, false, (
          <>
            <h3 style={{ margin: '8px 0' }}>🎨 ألوان جاهزة</h3>
            <p className="fk-small">اختار لون، وبيتغير عند الجميع على طول من غير ما يتأثر أي محتوى.</p>
            <div>
              {Object.entries(THEMES).map(([k, t]) => (
                <button key={k} type="button" className={'fk-btn s ' + (theme === k ? '' : 'w')} onClick={() => saveTheme(k)}>
                  <span className="fk-sw" style={{ background: 'linear-gradient(135deg,' + t.hd1 + ',' + t.pill1 + ')' }} /> {t.name}{theme === k ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <h3 style={{ margin: '14px 0 6px' }}>🖌️ ألوان مخصصة</h3>
            <div className="fk-two">
              <div><label>اللون الأساسي (الهيدر والأزرار)</label><input type="color" value={cMain} style={{ height: 46, padding: 4 }} onChange={(e) => { setCMain(e.target.value); setTheme('custom:' + e.target.value + ':' + cAcc) }} /></div>
              <div><label>لون التبويبات والإبراز</label><input type="color" value={cAcc} style={{ height: 46, padding: 4 }} onChange={(e) => { setCAcc(e.target.value); setTheme('custom:' + cMain + ':' + e.target.value) }} /></div>
            </div>
            <button type="button" className="fk-btn g s" onClick={() => saveTheme('custom:' + cMain + ':' + cAcc)}>💾 حفظ الألوان للجميع</button>
            <h3 style={{ margin: '16px 0 6px' }}>↕️ ترتيب التبويبات</h3>
            <p className="fk-small">حرّك التبويب لفوق أو لتحت، أو اخفيه. «الرئيسية» و«حسابي» مبيتخفوش. التغيير بيظهر للجميع.</p>
            {tabOrder.map((k, idx) => (
              <div className="fk-post" key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 8 }}>
                <span style={{ flex: 1, opacity: tabCfg.hidden.includes(k) ? 0.45 : 1 }}>{ALL_TABS.find((t) => t[0] === k)[1]}</span>
                <button type="button" className="fk-btn w s" style={{ margin: 0 }} disabled={idx === 0} onClick={() => moveTab(k, -1)}>↑</button>
                <button type="button" className="fk-btn w s" style={{ margin: 0 }} disabled={idx === tabOrder.length - 1} onClick={() => moveTab(k, 1)}>↓</button>
                {k !== 'home' && k !== 'account' && <button type="button" className="fk-btn r s" style={{ margin: 0 }} onClick={() => toggleTab(k)}>{tabCfg.hidden.includes(k) ? '👁 إظهار' : '🙈 إخفاء'}</button>}
              </div>
            ))}
            <button type="button" className="fk-btn w s" onClick={() => saveTabs({ order: ALL_TABS.map((t) => t[0]), hidden: [] })}>↺ الترتيب الأصلي</button>
            <h3 style={{ margin: '16px 0 8px' }}>💾 نسخة احتياطية</h3>
            <p className="fk-small">بتنزّل ملف فيه كل الأفكار والإعلانات والدردشة والبوستات والحسابات وسوق الأفكار. خد نسخة كل فترة.</p>
            <button type="button" className="fk-btn o s" disabled={busy} onClick={backup}>تنزيل نسخة احتياطية</button>
          </>
        ))}
      </section>
    )
  }

  const pages = { home, register, people: peopleTab, community, market: marketTab, ads: adsTab, inbox: inboxTab, account, admin }

  return (
    <div className="fk" style={themeVars}>
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
      {(toast || upProgress) && <div className="fk-toast">{upProgress ? 'جاري رفع الصور: ' + upProgress : toast}</div>}
      {zoom && (
        <div className="fk-zoom" onClick={() => setZoom(null)}>
          <div className="fk-zbox" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fk-btn r s" style={{ marginTop: 0 }} onClick={() => setZoom(null)}>✕ إغلاق</button>
            <img src={zoom.url} alt="" />
            <div>{reactBar('image', zoom.url)}</div>
            {(zoom.type === 'ad' || zoom.type === 'post') && <div><h3 style={{ margin: '4px 0 8px' }}>💬 تعليقات على الصورة</h3>{thread(zoom.type, zoom.id, zoom.url)}</div>}
          </div>
        </div>
      )}
      {(pages[tab] || home)()}
    </div>
  )
}

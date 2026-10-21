import React, { useEffect, useState } from 'react'
import * as sbm from './lib/supabase'

const supabase = sbm.supabase || sbm.default
const safe = (u) => /^https?:\/\//i.test(u || '')

export function AdsSlot({ place }) {
  const [ads, setAds] = useState([])
  useEffect(() => {
    supabase.from('ads').select('*').eq('place', place).eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAds(data || []))
  }, [place])

  if (ads.length === 0) {
    return <div className="fk-ad"><b>📢 مساحة إعلانية</b>مكان مخصص لإعلانات الرعاة والخدمات.</div>
  }
  return (
    <>
      {ads.map((a) => (
        <div className="fk-ad" key={a.id} style={{ borderStyle: 'solid', background: '#fffdf5' }}>
          <span className="fk-small">إعلان</span>
          {safe(a.image_url) && <img src={a.image_url} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 14, margin: '8px 0' }} />}
          <b>{a.title}</b>
          {a.body && <div style={{ margin: '4px 0' }}>{a.body}</div>}
          {safe(a.link) && <a href={a.link} target="_blank" rel="noopener noreferrer sponsored" style={{ color: '#2563eb', fontWeight: 700 }}>اعرف أكثر</a>}
        </div>
      ))}
    </>
  )
}

export function AdsAdmin() {
  const [list, setList] = useState([])
  const [f, setF] = useState({ place: 'posts', title: '', body: '', link: '', image_url: '' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false })
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    if (!f.title) return setMsg('اكتب عنوان الإعلان')
    const { error } = await supabase.from('ads').insert({ ...f, body: f.body || null, link: f.link || null, image_url: f.image_url || null })
    if (error) return setMsg('تعذّر الإضافة: ' + error.message)
    setF({ place: 'posts', title: '', body: '', link: '', image_url: '' }); setMsg('تمت إضافة الإعلان'); load()
  }
  async function toggle(a) { await supabase.from('ads').update({ active: !a.active }).eq('id', a.id); load() }
  async function remove(a) { await supabase.from('ads').delete().eq('id', a.id); load() }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: '8px 0' }}>📢 الإعلانات</h3>
      <form onSubmit={add}>
        <select value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })}>
          <option value="posts">بين البوستات</option>
          <option value="chat">داخل الدردشة</option>
        </select>
        <input style={{ marginTop: 8 }} placeholder="عنوان الإعلان" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input style={{ marginTop: 8 }} placeholder="نص الإعلان (اختياري)" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <input style={{ marginTop: 8 }} dir="ltr" placeholder="رابط الإعلان https://... (اختياري)" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
        <input style={{ marginTop: 8 }} dir="ltr" placeholder="رابط صورة https://... (اختياري)" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
        <button className="fk-btn o">إضافة إعلان</button>
      </form>
      {msg && <p className="fk-small" style={{ marginTop: 6 }}>{msg}</p>}
      {list.map((a) => (
        <div className="fk-post" key={a.id}>
          <h3>{a.title}</h3>
          <span className="fk-tag">{a.place === 'chat' ? 'الدردشة' : 'البوستات'}</span>
          <span className={'fk-tag ' + (a.active ? 'ok' : 'no')}>{a.active ? 'ظاهر' : 'مخفي'}</span>
          <div>
            <button className="fk-btn s" onClick={() => toggle(a)}>{a.active ? 'إخفاء' : 'إظهار'}</button>
            <button className="fk-btn r s" onClick={() => remove(a)}>حذف</button>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client";
import { useEffect, useState } from "react";

/* =====================================================
   1) НОМЫН БҮХ ӨГӨГДӨЛ НЭГТГЭГЧ (ENTRY + CATEGORY)
===================================================== */

const CATEGORIES = [
  "world","memories","notes","happy","letters","difficult",
  "wisdom","complaints","creative","personal","gratitude","contact"
];

function loadAll() {
  let list = [];

  CATEGORIES.forEach(cat => {
    const key = `oyun_ebook_${cat}_v1`;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const entries = JSON.parse(raw) || [];
      entries
        .filter(e => e.includeInBook) // зөвхөн номонд орох бичвэр
        .forEach(e =>
          list.push({ ...e, cat })
        );

    } catch(err){ console.warn("LS parse:",err); }
  });

  return list.sort((a,b) => new Date(a.date) - new Date(b.date));
}


/* =====================================================
   2) PAGE ENGINE
===================================================== */

const PAGE_LIMIT = {
  1: 1800, // Template1: Аниргүй хуудсууд
  2: 1400, // Дурсамжийн гэрэл
  3: 1200, // Ухаарал урсах мөр
  4: 1500, // Хар шөнийн үзэг
  5: 1100, // Дотно зураглал
  6: 1300  // Үгсийн амьсгал
};

function splitToPages(text, templateId){
  let pages = [];
  let step = PAGE_LIMIT[templateId];

  for(let i=0;i<text.length;i+=step){
    pages.push(text.slice(i,i+step));
  }
  return pages;
}


/* =====================================================
   3) UI + PREVIEW
===================================================== */

export default function EbookRenderer(){
  const [template,setTemplate] = useState(1);
  const [pages,setPages] = useState([]);

  function build(){
    const entries = loadAll();              // бүх сэдвээс өгөгдөл уншив
    const merged = entries.map(e => e.content).join("\n\n"); 
    const p = splitToPages(merged,template);
    setPages(p);
  }

  useEffect(()=> build(),[template]);

  return(
    <div style={{padding:40}}>
      
      <h1 style={{fontSize:28,marginBottom:8}}>📘 E-Book Preview Engine</h1>
      <p style={{opacity:.7}}>Энэ бол бүх бичвэрийг нэг ном болгон гаргагч үндсэн систем.</p>

      {/* Template сонголт */}
      <div style={{margin:"18px 0",display:"flex",gap:12}}>
        {[1,2,3,4,5,6].map(id=>(
          <button
            key={id}
            onClick={()=>setTemplate(id)}
            style={{
              padding:"8px 14px",
              borderRadius:10,
              background:template===id?"#fff":"#222",
              color:template===id?"#111":"#fff"
            }}
          >
            Загвар {id}
          </button>
        ))}
      </div>

      {/* Pages view */}
      {pages.map((p,i)=>(
        <div 
          key={i}
          style={{
            width:700,
            minHeight:900,
            padding:"40px 50px",
            margin:"25px auto",
            background:"#fff",
            color:"#222",
            borderRadius:10,
            boxShadow:"0 0 25px rgba(0,0,0,.25)",
            fontSize:18,
            lineHeight:"1.8"
          }}
        >
          <div style={{whiteSpace:"pre-wrap"}}>
            {p}
          </div>

          <div style={{textAlign:"center",marginTop:30,opacity:.6}}>
            — {i+1} —
          </div>
        </div>
      ))}
    </div>
  );
}

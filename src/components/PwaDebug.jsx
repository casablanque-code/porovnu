import { useEffect, useState } from 'react'

export default function PwaDebug() {
  const [info, setInfo] = useState({})

  useEffect(() => {
    // Логируем все touch события на document
    const logTouch = (e) => {
      const t = e.touches[0] || e.changedTouches[0]
      const el = document.elementFromPoint(t.clientX, t.clientY)
      setInfo(prev => ({...prev,
        lastTouch: `x=${Math.round(t.clientX)} y=${Math.round(t.clientY)}`,
        touchTarget: el ? `${el.tagName}.${[...el.classList].join('.')}` : 'none',
        touchType: el?.type || '-',
      }))
    }
    document.addEventListener('touchstart', logTouch, {passive: true})
    return () => document.removeEventListener('touchstart', logTouch)
  }, [])

  useEffect(() => {
    const isStandalone = window.navigator.standalone === true
    const safeTop = getComputedStyle(document.documentElement)
      .getPropertyValue('--sat') || 'нет'
    
    // Замеряем реальные safe area insets
    const div = document.createElement('div')
    div.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 1px; height: 1px;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    `
    document.body.appendChild(div)
    const cs = getComputedStyle(div)
    const safeAreaTop = cs.paddingTop
    const safeAreaBottom = cs.paddingBottom
    document.body.removeChild(div)

    // Замеряем body
    const bodyRect = document.body.getBoundingClientRect()
    const rootRect = document.getElementById('root')?.getBoundingClientRect()

    setInfo({
      isStandalone,
      safeAreaTop,
      safeAreaBottom,
      bodyTop: bodyRect.top,
      bodyHeight: bodyRect.height,
      rootTop: rootRect?.top,
      rootHeight: rootRect?.height,
      windowHeight: window.innerHeight,
      screenHeight: window.screen.height,
    })
  }, [])

  const handleTap = (e) => {
    alert(`Тап: x=${Math.round(e.clientX)} y=${Math.round(e.clientY)}\nTarget: ${e.target.tagName}.${e.target.className}\nType: ${e.target.type || '-'}`)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 100, left: 10, right: 10,
      background: 'rgba(0,0,0,0.85)', color: '#0f0',
      padding: 12, borderRadius: 12, fontSize: 11,
      fontFamily: 'monospace', zIndex: 9999,
      lineHeight: 1.6
    }}>
      <div style={{marginBottom: 6, fontWeight: 'bold', color: '#ff0'}}>PWA Debug</div>
      {Object.entries(info).map(([k, v]) => (
        <div key={k}>{k}: <span style={{color:'#fff'}}>{String(v)}</span></div>
      ))}
      <div style={{marginTop: 8}}>
        <input
          placeholder="Тапни сюда"
          style={{width:'100%', padding:6, fontSize:14, borderRadius:6, border:'2px solid #0f0', background:'#111', color:'#fff'}}
          onFocus={() => alert('ФОКУС ПОЛУЧЕН!')}
        />
      </div>
      <button
        onClick={handleTap}
        style={{marginTop:6, width:'100%', padding:6, background:'#333', color:'#0f0', border:'1px solid #0f0', borderRadius:6, fontSize:11}}
      >
        Тапни для координат
      </button>
    </div>
  )
}

import React, { useEffect, useMemo, useRef, useState } from 'react'

// ------------------- Types -------------------
type Particle = { x: number; y: number; vx: number; vy: number; r: number; hue: number }
type Mode = 'none' | 'attract' | 'repel'

type Config = {
    count: number
    linkRadius: number
    gravity: number
    damping: number
    wind: number
    speed: number
    mode: Mode
    trails: number
    showGrid: boolean
}

// ------------------- Defaults & Presets -------------------
const DEFAULTS: Config = {
    count: 600,
    linkRadius: 100,
    gravity: 60,
    damping: 0.985,
    wind: 40,
    speed: 40,
    mode: 'repel',
    trails: 0.25,
    showGrid: false,
}

const PRESETS: Record<string, Partial<Config>> = {
    Jelly: { mode: 'attract', damping: 0.99, gravity: 0, wind: 10, linkRadius: 120 },
    Fireflies: { mode: 'none', damping: 0.98, wind: 0, gravity: -20, linkRadius: 90, trails: 0.15 },
    Breeze: { mode: 'none', wind: 120, gravity: 0, damping: 0.99, linkRadius: 80 },
    Galaxy: { mode: 'attract', gravity: 0, wind: 0, linkRadius: 140, count: 700 },
    Mesh: { mode: 'repel', gravity: 0, wind: 0, linkRadius: 85, count: 800, trails: 0.2 },
}

// ------------------- Utility -------------------
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const download = (name: string, dataURL: string) => {
    const a = document.createElement('a')
    a.href = dataURL
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
}

// ------------------- Main Component -------------------
const ParticlePlayground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number | null>(null)

    // Config state
    const [cfg, setCfg] = useState<Config>(DEFAULTS)
    const [paused, setPaused] = useState(false)

    // selection / mouse
    const mouse = useRef({ x: 0, y: 0, down: false })
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

    // expose latest cfg to loop w/o rerender
    const cfgRef = useRef(cfg)
    useEffect(() => { cfgRef.current = cfg }, [cfg])

    // particles buffer
    const particlesRef = useRef<Particle[]>([])

    // resize & DPR
    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = Math.max(1, window.devicePixelRatio || 1)
            canvas.width = Math.floor(canvas.clientWidth * dpr)
            canvas.height = Math.floor(canvas.clientHeight * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        const ro = new ResizeObserver(resize)
        ro.observe(canvas)
        resize()
        return () => ro.disconnect()
    }, [])

    // (re)build particles when count changes
    useEffect(() => {
        const canvas = canvasRef.current!
        const W = canvas.clientWidth
        const H = canvas.clientHeight
        const p: Particle[] = particlesRef.current
        const target = cfg.count

        const rand = (min: number, max: number) => min + Math.random() * (max - min)

        if (p.length > target) p.length = target
        else {
            while (p.length < target) {
                p.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * cfg.speed,
                    vy: (Math.random() - 0.5) * cfg.speed,
                    r: rand(1.5, 3.0),
                    hue: 200 + Math.random() * 100,
                })
            }
        }
    }, [cfg.count, cfg.speed])

    // mouse handlers
    useEffect(() => {
        const canvas = canvasRef.current!
        const move = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect()
            mouse.current.x = e.clientX - r.left
            mouse.current.y = e.clientY - r.top
        }
        const down = () => { mouse.current.down = true }
        const up = () => { mouse.current.down = false; setSelectedIdx(null) }
        canvas.addEventListener('mousemove', move)
        window.addEventListener('mousedown', down)
        window.addEventListener('mouseup', up)
        return () => {
            canvas.removeEventListener('mousemove', move)
            window.removeEventListener('mousedown', down)
            window.removeEventListener('mouseup', up)
        }
    }, [])

    // click to select / shift+click to spawn
    useEffect(() => {
        const canvas = canvasRef.current!
        const onClick = (e: MouseEvent) => {
            const shift = e.shiftKey
            const p = particlesRef.current
            const m = mouse.current

            if (shift) {
                // spawn a small burst
                for (let i = 0; i < 30; i += 1) {
                    p.push({
                        x: m.x,
                        y: m.y,
                        vx: (Math.random() - 0.5) * (cfgRef.current.speed * 2),
                        vy: (Math.random() - 0.5) * (cfgRef.current.speed * 2),
                        r: 1.5 + Math.random() * 2.0,
                        hue: 200 + Math.random() * 100,
                    })
                }
                setCfg((c) => ({ ...c, count: p.length }))
                return
            }

            // select nearest within 16px
            let best = -1
            let bestD2 = 16 * 16
            for (let i = 0; i < p.length; i += 1) {
                const dx = p[i].x - m.x
                const dy = p[i].y - m.y
                const d2 = dx * dx + dy * dy
                if (d2 < bestD2) { best = i; bestD2 = d2 }
            }
            setSelectedIdx(best === -1 ? null : best)
        }
        canvas.addEventListener('click', onClick)
        return () => canvas.removeEventListener('click', onClick)
    }, [])

    // hotkeys
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase()
            if (k === 'a') setCfg((c) => ({ ...c, mode: 'attract' }))
            if (k === 'r') setCfg((c) => ({ ...c, mode: 'repel' }))
            if (k === 'n') setCfg((c) => ({ ...c, mode: 'none' }))
            if (k === 'p') setPaused((v) => !v)
            if (k === 'g') setCfg((c) => ({ ...c, showGrid: !c.showGrid }))
            if (k === 'o') exportPNG()
            if (k === 'd') downloadJSON()
            if (k === 'l') openFilePicker()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    // export PNG
    const exportPNG = () => {
        const canvas = canvasRef.current!
        const url = canvas.toDataURL('image/png')
        download('particle-playground.png', url)
    }

    // save / load config (not particles, but full controls)
    const downloadJSON = () => {
        const data = JSON.stringify(cfgRef.current, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        download('particle-config.json', url)
        URL.revokeObjectURL(url)
    }

    const openFilePicker = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            file.text().then((t) => {
                try {
                    const loaded = JSON.parse(t)
                    setCfg((c) => ({ ...c, ...loaded }))
                } catch (e) {
                    // noop
                }
            })
        }
        input.click()
    }

    // animation loop
    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const gridColor = 'rgba(120,130,170,0.15)'
        let last = performance.now()
        let windPhase = 0

        const frame = (now: number) => {
            rafRef.current = requestAnimationFrame(frame)
            const dt = Math.min(0.033, (now - last) / 1000)
            last = now
            const { width: W, height: H } = { width: canvas.clientWidth, height: canvas.clientHeight }
            const cfg = cfgRef.current
            const P = particlesRef.current
            const m = mouse.current

            if (paused) return

            // clear / trails
            if (cfg.trails >= 1) ctx.clearRect(0, 0, W, H)
            else {
                ctx.fillStyle = `rgba(0,0,0,${cfg.trails})`
                ctx.globalCompositeOperation = 'destination-out'
                ctx.fillRect(0, 0, W, H)
                ctx.globalCompositeOperation = 'source-over'
            }

            // wind varies slowly
            windPhase += dt * 0.4
            const windX = Math.cos(windPhase) * cfg.wind
            const windY = Math.sin(windPhase * 1.3) * cfg.wind * 0.25

            // spatial grid (for links)
            const R = cfg.linkRadius
            const cellSize = R
            const cols = Math.ceil(W / cellSize)
            const rows = Math.ceil(H / cellSize)
            const grid: number[][] = Array.from({ length: cols * rows }, () => [])
            const idx = (x: number, y: number) => y * cols + x

            // update & bucket
            for (let i = 0; i < P.length; i += 1) {
                const p = P[i]

                // forces
                p.vx += windX * dt
                p.vy += (cfg.gravity + windY) * dt

                // mouse force
                if (cfg.mode !== 'none') {
                    const dx = m.x - p.x
                    const dy = m.y - p.y
                    const d2 = dx * dx + dy * dy
                    if (d2 > 9 && d2 < R * R * 2.5) {
                        const inv = 1 / Math.sqrt(d2)
                        const ux = dx * inv
                        const uy = dy * inv
                        const k = (cfg.mode === 'repel' ? -1 : 1) * 9000 / d2
                        p.vx += ux * k * dt
                        p.vy += uy * k * dt
                    }
                }

                // drag selected particle with the mouse
                if (m.down && selectedIdx === i) {
                    const dx = m.x - p.x
                    const dy = m.y - p.y
                    p.vx += dx * 20 * dt
                    p.vy += dy * 20 * dt
                }

                // damping + integrate
                p.vx *= cfg.damping
                p.vy *= cfg.damping
                p.x += p.vx * dt
                p.y += p.vy * dt

                // wrap
                if (p.x < 0) p.x += W
                if (p.x > W) p.x -= W
                if (p.y < 0) p.y += H
                if (p.y > H) p.y -= H

                // bucket
                const cx = clamp(Math.floor(p.x / cellSize), 0, cols - 1)
                const cy = clamp(Math.floor(p.y / cellSize), 0, rows - 1)
                grid[idx(cx, cy)].push(i)
            }

            // optional grid
            if (cfg.showGrid) {
                ctx.strokeStyle = gridColor
                for (let x = 0; x < W; x += cellSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
                for (let y = 0; y < H; y += cellSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
            }

            // links
            ctx.lineWidth = 1
            for (let cy = 0; cy < rows; cy += 1) {
                for (let cx = 0; cx < cols; cx += 1) {
                    const bucket = grid[idx(cx, cy)]
                    if (!bucket.length) continue
                    for (let ny = -1; ny <= 1; ny += 1) {
                        const row = cy + ny
                        if (row < 0 || row >= rows) continue
                        for (let nx = -1; nx <= 1; nx += 1) {
                            const col = cx + nx
                            if (col < 0 || col >= cols) continue
                            const bucket2 = grid[idx(col, row)]
                            if (!bucket2.length) continue

                            for (let bi = 0; bi < bucket.length; bi += 1) {
                                const a = P[bucket[bi]]
                                for (let bj = 0; bj < bucket2.length; bj += 1) {
                                    const j = bucket2[bj]
                                    if (j <= bucket[bi]) continue
                                    const b = P[j]
                                    const dx = a.x - b.x
                                    const dy = a.y - b.y
                                    const d2 = dx * dx + dy * dy
                                    if (d2 < R * R) {
                                        const d = Math.sqrt(d2)
                                        const t = 1 - d / R
                                        ctx.strokeStyle = `rgba(160,190,255,${t * 0.35})`
                                        ctx.beginPath()
                                        ctx.moveTo(a.x, a.y)
                                        ctx.lineTo(b.x, b.y)
                                        ctx.stroke()
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // draw particles
            for (let i = 0; i < P.length; i += 1) {
                const p = P[i]
                const sat = selectedIdx === i ? 100 : 80
                const lum = selectedIdx === i ? 75 : 60
                ctx.fillStyle = `hsl(${p.hue},${sat}%,${lum}%)`
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fill()
            }

            // cursor
            ctx.beginPath()
            ctx.arc(m.x, m.y, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#fff'
            ctx.fill()
        }

        rafRef.current = requestAnimationFrame(frame)
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [paused, selectedIdx])

    // ------------------- UI -------------------
    const applyPreset = (name: string) => {
        const patch = PRESETS[name]
        setCfg((c) => ({ ...c, ...patch, count: patch.count ?? c.count }))
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#05070a' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'none' }}
                    onMouseDown={() => { mouse.current.down = true }}
                    onMouseUp={() => { mouse.current.down = false }}
            />

            {/* HUD / Controls */}
            <div style={{
                position: 'absolute', top: 10, left: 10, background: '#0a0f16cc',
                padding: '10px 14px', borderRadius: 10, color: '#cfe', font: '13px system-ui'
            }}>
                <div style={{ marginBottom: 6 }}>
                    <strong>Lesson 12</strong> — Interactive Playground
                </div>

                <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }}>
                    <label>Count</label>
                    <input type="range" min={100} max={1500} value={cfg.count}
                           onChange={(e) => setCfg({ ...cfg, count: +e.target.value })} />
                    <span>{cfg.count}</span>

                    <label>Link radius</label>
                    <input type="range" min={50} max={180} value={cfg.linkRadius}
                           onChange={(e) => setCfg({ ...cfg, linkRadius: +e.target.value })} />
                    <span>{cfg.linkRadius}px</span>

                    <label>Gravity</label>
                    <input type="range" min={-200} max={200} value={cfg.gravity}
                           onChange={(e) => setCfg({ ...cfg, gravity: +e.target.value })} />
                    <span>{cfg.gravity}</span>

                    <label>Wind</label>
                    <input type="range" min={0} max={200} value={cfg.wind}
                           onChange={(e) => setCfg({ ...cfg, wind: +e.target.value })} />
                    <span>{cfg.wind}</span>

                    <label>Damping</label>
                    <input type="range" min={0.95} max={0.999} step={0.001} value={cfg.damping}
                           onChange={(e) => setCfg({ ...cfg, damping: +e.target.value })} />
                    <span>{cfg.damping.toFixed(3)}</span>

                    <label>Speed</label>
                    <input type="range" min={10} max={120} value={cfg.speed}
                           onChange={(e) => setCfg({ ...cfg, speed: +e.target.value })} />
                    <span>{cfg.speed}</span>

                    <label>Trails</label>
                    <input type="range" min={0.1} max={1} step={0.05} value={cfg.trails}
                           onChange={(e) => setCfg({ ...cfg, trails: +e.target.value })} />
                    <span>{cfg.trails}</span>

                    <label>Mode</label>
                    <select value={cfg.mode} onChange={(e) => setCfg({ ...cfg, mode: e.target.value as Mode })}>
                        <option value="none">none</option>
                        <option value="attract">attract</option>
                        <option value="repel">repel</option>
                    </select>
                    <span>Hotkeys: A / R / N</span>

                    <label>Show grid</label>
                    <input type="checkbox" checked={cfg.showGrid}
                           onChange={(e) => setCfg({ ...cfg, showGrid: e.target.checked })} />
                    <span>G</span>
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.keys(PRESETS).map((k) => (
                        <button key={k} onClick={() => applyPreset(k)} style={btn}>Preset: {k}</button>
                    ))}
                </div>

                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button style={btn} onClick={() => setPaused((v) => !v)}>{paused ? 'Resume' : 'Pause'} (P)</button>
                    <button style={btn} onClick={exportPNG}>Export PNG (O)</button>
                    <button style={btn} onClick={downloadJSON}>Save JSON (D)</button>
                    <button style={btn} onClick={openFilePicker}>Load JSON (L)</button>
                </div>

                <div style={{ marginTop: 6, opacity: 0.9 }}>
                    Shift+Click = spawn • Click = select • Drag selected = pull<br />
                    A/R/N = mode • P = pause • G = grid • O/D/L = export/save/load
                </div>
            </div>
        </div>
    )
}

const btn: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    background: '#132030',
    color: '#cfe',
    border: '1px solid #243244',
    cursor: 'pointer',
}

export default ParticlePlayground

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function TaskDetailsClient({ task, currentUserRole }: { task: any, currentUserRole: string }) {
    const router = useRouter()

    // Radni Nalazi Form
    const [logContent, setLogContent] = useState('')
    const [logStatus, setLogStatus] = useState('U tijeku')
    const [isLogging, setIsLogging] = useState(false)

    // Time Tracking 
    const [isStopwatchRunning, setIsStopwatchRunning] = useState(false)
    const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
    const [stopwatchStartTime, setStopwatchStartTime] = useState<number | null>(null)

    const [manualHours, setManualHours] = useState('')
    const [isSavingTime, setIsSavingTime] = useState(false)

    // File Upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Task Status
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    // Total Hours Calculated
    const totalHoursLogged = task.timeEntries.reduce((acc: number, entry: any) => acc + (entry.manualHours || 0), 0)

    // Stopwatch effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isStopwatchRunning) {
            interval = setInterval(() => {
                setStopwatchSeconds(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isStopwatchRunning])

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
        const s = (totalSeconds % 60).toString().padStart(2, '0')
        return `${h}:${m}:${s}`
    }

    const handleToggleStopwatch = async () => {
        if (isStopwatchRunning) {
            // Stop and save
            setIsStopwatchRunning(false)
            setIsSavingTime(true)

            const endTime = Date.now()

            await fetch(`/api/tasks/${task.id}/time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: stopwatchStartTime,
                    endTime: endTime
                })
            })

            setStopwatchSeconds(0)
            setStopwatchStartTime(null)
            setIsSavingTime(false)
            router.refresh()
        } else {
            // Start
            setIsStopwatchRunning(true)
            setStopwatchStartTime(Date.now())
        }
    }

    const handleManualTimeSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualHours) return

        setIsSavingTime(true)
        await fetch(`/api/tasks/${task.id}/time`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manualHours: parseFloat(manualHours) })
        })
        setManualHours('')
        setIsSavingTime(false)
        router.refresh()
    }

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!logContent.trim()) return

        setIsLogging(true)
        await fetch(`/api/tasks/${task.id}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: logContent, status: logStatus })
        })
        setLogContent('')
        setIsLogging(false)
        router.refresh()
    }

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        await fetch(`/api/tasks/${task.id}/files`, {
            method: 'POST',
            body: formData
        })

        setSelectedFile(null)
        setIsUploading(false)
        router.refresh()
    }

    const handleToggleStatus = async () => {
        setIsUpdatingStatus(true)
        const newStatus = task.status === 'ZATVOREN' ? 'OTVOREN' : 'ZATVOREN'
        await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        })
        setIsUpdatingStatus(false)
        router.refresh()
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>

            {/* Left Column: Radni Nalazi & Logs */}
            <div>
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Dnevnik rada (Radni nalazi)</h2>

                    <form onSubmit={handleLogSubmit} style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem' }}>
                        <div className="form-group">
                            <label>Status</label>
                            <select className="input-field" value={logStatus} onChange={e => setLogStatus(e.target.value)}>
                                <option>U tijeku</option>
                                <option>Završena faza</option>
                                <option>Čekamo odgovor klijenata</option>
                                <option>Dovršeno</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Novi nalaz / Bilješka</label>
                            <textarea
                                className="input-field"
                                rows={3}
                                placeholder="Unesite radni nalaz, status ili bilješku..."
                                value={logContent}
                                onChange={e => setLogContent(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isLogging}>
                            {isLogging ? 'Spremanje...' : 'Dodaj u dnevnik'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {task.logs.length > 0 ? task.logs.map((log: any) => (
                            <div key={log.id} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                            {log.user.name?.charAt(0) || log.user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>{log.user.name || log.user.email}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString('hr-HR')}</span>
                                        </div>
                                    </div>
                                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary-color)', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, height: 'fit-content' }}>
                                        {log.status}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{log.content}</p>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Još nema evidentiranih radova.</p>
                        )}
                    </div>
                </div>

                {/* File Attachments Section */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Privici i Datoteke</h2>

                    <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <input
                            type="file"
                            className="input-field"
                            style={{ flex: 1, padding: '0.5rem' }}
                            onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                        />
                        <button type="submit" className="btn btn-primary" disabled={isUploading || !selectedFile}>
                            {isUploading ? 'Prijenos...' : 'Učitaj datoteku'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {task.attachments && task.attachments.length > 0 ? task.attachments.map((file: any) => (
                            <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.75rem', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                    {file.fileName}
                                </span>
                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                    Otvori
                                </a>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>Nema učitanih datoteka.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Right Column: Time Tracking & Admin */}
            <div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '1.5rem', backgroundColor: task.status === 'ZATVOREN' ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-color)', border: `1px solid ${task.status === 'ZATVOREN' ? '#10b981' : 'var(--border-color)'}` }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Upravljanje Zadatkom</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Trenutni status:</span>
                            <div style={{ fontWeight: 700, color: task.status === 'ZATVOREN' ? '#10b981' : 'var(--text-primary)' }}>
                                {task.status}
                            </div>
                        </div>
                        <button
                            className="btn"
                            onClick={handleToggleStatus}
                            disabled={isUpdatingStatus}
                            style={{
                                backgroundColor: task.status === 'ZATVOREN' ? 'var(--bg-color)' : '#10b981',
                                color: task.status === 'ZATVOREN' ? 'var(--text-primary)' : 'white',
                                border: `1px solid ${task.status === 'ZATVOREN' ? 'var(--border-color)' : 'transparent'}`,
                                fontSize: '0.875rem'
                            }}
                        >
                            {isUpdatingStatus ? 'Spremanje...' : task.status === 'ZATVOREN' ? 'Ponovno Otvori' : 'Zatvori Zadatak'}
                        </button>
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '1.5rem', borderTop: '4px solid var(--secondary-color)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Utrošeno Vrijeme</h2>

                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                        {totalHoursLogged.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>sati ukupno</span>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: isStopwatchRunning ? 'var(--accent-color)' : 'var(--text-primary)', marginBottom: '1rem' }}>
                            {formatTime(stopwatchSeconds)}
                        </div>
                        <button
                            className="btn"
                            onClick={handleToggleStopwatch}
                            disabled={isSavingTime}
                            style={{
                                width: '100%',
                                backgroundColor: isStopwatchRunning ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-color)',
                                color: isStopwatchRunning ? 'var(--danger-color)' : 'white',
                            }}
                        >
                            {isSavingTime ? 'Spremanje...' : isStopwatchRunning ? 'Zaustavi & Spremi' : 'Pokreni Štopericu'}
                        </button>
                    </div>

                    <form onSubmit={handleManualTimeSave}>
                        <div className="form-group">
                            <label>Ručni unos (sati)</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="input-field"
                                    placeholder="npr. 2.5"
                                    value={manualHours}
                                    onChange={e => setManualHours(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="btn btn-primary" disabled={isSavingTime || !manualHours}>
                                    C
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Time logs history */}
                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Povijest upisa</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                            {task.timeEntries.map((entry: any) => (
                                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(entry.createdAt).toLocaleDateString('hr-HR')}
                                    </span>
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                        {entry.manualHours}h by {entry.user.name?.split(' ')[0] || 'Korisnik'}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

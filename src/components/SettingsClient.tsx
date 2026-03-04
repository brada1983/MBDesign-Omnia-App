'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SettingsClient({ userEmail, userRole }: { userEmail: string, userRole: string }) {
    const [email, setEmail] = useState(userEmail)
    const [password, setPassword] = useState('')

    const [notifyOnTaskCreate, setNotifyOnTaskCreate] = useState(false)
    const [notifyOnTaskUpdate, setNotifyOnTaskUpdate] = useState(false)
    const [notifyOnTaskClose, setNotifyOnTaskClose] = useState(false)

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Fetch current settings
        fetch('/api/users/settings')
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setEmail(data.email)
                    setNotifyOnTaskCreate(data.notifyOnTaskCreate)
                    setNotifyOnTaskUpdate(data.notifyOnTaskUpdate)
                    setNotifyOnTaskClose(data.notifyOnTaskClose)
                }
                setIsLoading(false)
            })
            .catch(() => setIsLoading(false))
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        const res = await fetch('/api/users/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                notifyOnTaskCreate,
                notifyOnTaskUpdate,
                notifyOnTaskClose
            })
        })

        if (res.ok) {
            setMessage({ text: 'Postavke su uspješno spremljene!', type: 'success' })
            setPassword('') // Clear password field after save
            router.refresh()
        } else {
            setMessage({ text: 'Došlo je do greške prilikom spremanja.', type: 'error' })
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return <div style={{ color: 'var(--text-secondary)' }}>Učitavanje postavki...</div>
    }

    return (
        <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px' }}>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' : 'var(--danger-color)',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : 'var(--danger-color)'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Account Details */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Pristupni Podaci</h2>

                    <div className="form-group">
                        <label>E-mail Adresa (za prijavu)</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Nova Lozinka (ostavite prazno ako ne želite mijenjati)</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Unesite novu lozinku..."
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Notification Preferences */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>E-mail Notifikacije</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        Odaberite u kojim situacijama želite primati obavijesti na Vašu e-mail adresu kada <strong>drugi korisnici</strong> naprave promjenu.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={notifyOnTaskCreate}
                                onChange={e => setNotifyOnTaskCreate(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Novi zadatak</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Kada netko kreira novi zadatak)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={notifyOnTaskUpdate}
                                onChange={e => setNotifyOnTaskUpdate(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Ažuriranje zadatka</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Kada netko upiše radni nalog, logira sate ili promijeni podatke)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={notifyOnTaskClose}
                                onChange={e => setNotifyOnTaskClose(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Zatvaranje zadatka</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Kada netko promijeni status zadatka u ZATVOREN)</span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                        {isSaving ? 'Spremanje...' : 'Spremi Postavke'}
                    </button>
                </div>
            </form>
        </div>
    )
}

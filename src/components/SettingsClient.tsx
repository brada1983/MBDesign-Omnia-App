'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    name: string | null
    email: string
}

type NotificationPreference = {
    targetUserId: string
    notifyOnCreate: boolean
    notifyOnUpdate: boolean
    notifyOnClose: boolean
}

export function SettingsClient({ userEmail, userRole, currentUserId }: { userEmail: string, userRole: string, currentUserId: string }) {
    const [email, setEmail] = useState(userEmail)
    const [password, setPassword] = useState('')

    const [allUsers, setAllUsers] = useState<User[]>([])
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const router = useRouter()

    useEffect(() => {
        Promise.all([
            fetch('/api/users/settings').then(res => res.json()),
            fetch('/api/users/basic').then(res => res.json()) // We need a new endpoint to get all users for the dropdowns
        ])
            .then(([settingsData, usersData]) => {
                if (!settingsData.error) {
                    setEmail(settingsData.email)

                    // Initialize preferences map from DB
                    const dbPrefs: NotificationPreference[] = settingsData.notificationPrefs.map((p: any) => ({
                        targetUserId: p.targetUserId,
                        notifyOnCreate: p.notifyOnCreate,
                        notifyOnUpdate: p.notifyOnUpdate,
                        notifyOnClose: p.notifyOnClose
                    }))
                    setNotificationPrefs(dbPrefs)
                }
                if (!usersData.error && Array.isArray(usersData)) {
                    // Remove self from the list of users you can subscribe to
                    setAllUsers(usersData.filter((u: User) => u.id !== currentUserId))
                }
                setIsLoading(false)
            })
            .catch(err => {
                console.error(err)
                setIsLoading(false)
            })
    }, [currentUserId])

    const handlePreferenceChange = (targetUserId: string, field: 'notifyOnCreate' | 'notifyOnUpdate' | 'notifyOnClose', value: boolean) => {
        setNotificationPrefs(prev => {
            const existing = prev.find(p => p.targetUserId === targetUserId)
            if (existing) {
                return prev.map(p => p.targetUserId === targetUserId ? { ...p, [field]: value } : p)
            } else {
                // Create new preference entry with default falses for others
                return [...prev, {
                    targetUserId,
                    notifyOnCreate: field === 'notifyOnCreate' ? value : false,
                    notifyOnUpdate: field === 'notifyOnUpdate' ? value : false,
                    notifyOnClose: field === 'notifyOnClose' ? value : false
                }]
            }
        })
    }

    const getPref = (targetUserId: string, field: 'notifyOnCreate' | 'notifyOnUpdate' | 'notifyOnClose') => {
        const pref = notificationPrefs.find(p => p.targetUserId === targetUserId)
        return pref ? pref[field] : false
    }

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
                notificationPrefs
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

                {/* Granular Notification Preferences */}
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>E-mail Notifikacije</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                        Odaberite od kojih kolega želite primati obavijesti i za koje točno radnje.
                    </p>

                    {allUsers.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nema drugih korisnika u sustavu od kojih biste mogli primati obavijesti.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {allUsers.map(user => (
                                <div key={user.id} style={{
                                    padding: '1rem',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                        👤 {user.name || user.email}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={getPref(user.id, 'notifyOnCreate')}
                                                onChange={e => handlePreferenceChange(user.id, 'notifyOnCreate', e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.875rem' }}>Kreiranje novog zadatka</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={getPref(user.id, 'notifyOnUpdate')}
                                                onChange={e => handlePreferenceChange(user.id, 'notifyOnUpdate', e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.875rem' }}>Ažuriranje (radni nalazi, sati)</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={getPref(user.id, 'notifyOnClose')}
                                                onChange={e => handlePreferenceChange(user.id, 'notifyOnClose', e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.875rem' }}>Zatvaranje zadatka</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button type="submit" className="button button-primary" disabled={isSaving}>
                        {isSaving ? 'Spremanje...' : 'Spremi Postavke'}
                    </button>
                </div>
            </form>
        </div>
    )
}

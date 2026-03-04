'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type User = {
    id: string
    name: string | null
    email: string
    role: string
    createdAt: string
}

export function UsersClient() {
    const { data: session } = useSession()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // Form states
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('USER')
    const [sendEmail, setSendEmail] = useState(true)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            setUsers(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const openAddModal = () => {
        setName('')
        setEmail('')
        setPassword('')
        setRole('USER')
        setSendEmail(true) // Default to sending email for new users
        setIsAddModalOpen(true)
    }

    const openEditModal = (user: User) => {
        setEditingUser(user)
        setName(user.name || '')
        setEmail(user.email)
        setPassword('') // Empty to signify no change
        setRole(user.role)
        setSendEmail(false) // Default to NOT sending email on edit
        setIsEditModalOpen(true)
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, sendEmail })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create user')

            setUsers([data, ...users])
            setIsAddModalOpen(false)
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return

        try {
            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password: password || undefined, role, sendEmail })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to update user')

            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data } : u))
            setIsEditModalOpen(false)
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Jeste li sigurni da želite obrisati ovog korisnika?')) return

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to delete user')

            setUsers(users.filter(u => u.id !== id))
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (isLoading) return <div className="loading">Učitavanje korisnika...</div>

    return (
        <div className="fade-in">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">Upravljanje Korisnicima</h1>
                    <p className="page-subtitle">Prikaz i administracija korisnika sustava</p>
                </div>
                <button className="button button-primary" onClick={openAddModal}>
                    <span>+</span> Novi Korisnik
                </button>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Ime</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>E-mail</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Uloga</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Datum Registracije</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem' }}>{user.name || 'N/A'}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: user.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                                        color: user.role === 'ADMIN' ? 'var(--secondary-color)' : 'var(--accent-color)'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    {new Date(user.createdAt).toLocaleDateString('hr-HR')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        className="button"
                                        style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', marginRight: '0.5rem' }}
                                        onClick={() => openEditModal(user)}
                                    >
                                        ✏️ Uredi
                                    </button>
                                    {session?.user?.id !== user.id && (
                                        <button
                                            className="button"
                                            style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: 'none' }}
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            🗑️ Obriši
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    Nema pronađenih korisnika.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="modal-backdrop fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false) }}>
                    <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Dodaj Novog Korisnika</h2>
                            <button className="button-icon" onClick={() => setIsAddModalOpen(false)}>×</button>
                        </div>
                        <form className="modal-body" onSubmit={handleCreateUser} style={{ overflowY: 'auto', flex: 1, paddingBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Ime</label>
                                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Npr. Ivan Horvat" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">E-mail adresa *</label>
                                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Lozinka *</label>
                                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Uloga *</label>
                                <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                                    <option value="USER">Korisnik (USER)</option>
                                    <option value="ADMIN">Administrator (ADMIN)</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={sendEmail}
                                        onChange={e => setSendEmail(e.target.checked)}
                                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        Pošalji pristupne podatke na e-mail
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button type="button" className="button" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setIsAddModalOpen(false)}>Odustani</button>
                                <button type="submit" className="button button-primary">Spremi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && editingUser && (
                <div className="modal-backdrop fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false) }}>
                    <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Uredi Korisnika</h2>
                            <button className="button-icon" onClick={() => setIsEditModalOpen(false)}>×</button>
                        </div>
                        <form className="modal-body" onSubmit={handleUpdateUser} style={{ overflowY: 'auto', flex: 1, paddingBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Ime</label>
                                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">E-mail adresa *</label>
                                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nova Lozinka (Ostavite prazno ako ne mijenjate)</label>
                                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Uloga *</label>
                                <select className="form-control" value={role} onChange={e => setRole(e.target.value)} disabled={session?.user?.id === editingUser.id}>
                                    <option value="USER">Korisnik (USER)</option>
                                    <option value="ADMIN">Administrator (ADMIN)</option>
                                </select>
                                {session?.user?.id === editingUser.id && <small style={{ color: 'var(--text-secondary)' }}>Ne možete mijenjati vlastitu ulogu.</small>}
                            </div>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={sendEmail}
                                        onChange={e => setSendEmail(e.target.checked)}
                                        style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        Pošalji obavijest o izmjeni i nove podatke na e-mail
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button type="button" className="button" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setIsEditModalOpen(false)}>Odustani</button>
                                <button type="submit" className="button button-primary">Spremi Izmjene</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

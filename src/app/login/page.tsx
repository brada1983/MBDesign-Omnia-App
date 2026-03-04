'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        })

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="login-page">
            <div className="login-card glass">
                <div className="logo-container">
                    <img src="/mb-logo.png" alt="MB Design Logo" />
                    <img src="/omnia-logo.png" alt="Omnia Logo" />
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                    Prijava u sustav
                </h2>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email adresa</label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder="np. marko@mbdesign.hr"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label htmlFor="password">Lozinka</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '1rem', padding: '0.875rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Prijava...' : 'Prijavi se'}
                    </button>
                </form>
            </div>
        </div>
    )
}

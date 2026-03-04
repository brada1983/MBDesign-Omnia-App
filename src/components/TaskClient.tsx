'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Task = {
    id: string
    title: string
    category: string
    status: string
    deadline: Date | null
    assignedHours: number | null
    createdAt: Date
    deletedAt: Date | null
    removedBy: string | null
}

export function TaskClient({ initialTasks, isAdmin }: { initialTasks: Task[], isAdmin: boolean }) {
    const [tasks, setTasks] = useState(initialTasks)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filter, setFilter] = useState('SVE')
    const router = useRouter()

    // Form states
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('Marketing materijali')
    const [customCategory, setCustomCategory] = useState('')
    const [isCustomCategory, setIsCustomCategory] = useState(false)
    const [description, setDescription] = useState('')
    const [deadline, setDeadline] = useState('')
    const [assignedHours, setAssignedHours] = useState('')
    const [loading, setLoading] = useState(false)

    // Dynamic filtering categories
    const defaultCategories = ['Marketing materijali', 'Servis računala', 'Administracija servera', 'Zadaci digitalnog asistenta', 'Ostalo']
    const uniqueTaskCategories = Array.from(new Set(tasks.map(t => t.category)))
    const allCategories = Array.from(new Set([...defaultCategories, ...uniqueTaskCategories]))
    const filterOptions = ['SVE', ...allCategories]

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const finalCategory = isCustomCategory && customCategory.trim() !== '' ? customCategory.trim() : category

        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                category: finalCategory,
                description,
                deadline: deadline || null,
                assignedHours: assignedHours || null
            })
        })

        if (res.ok) {
            const newTask = await res.json()
            setTasks([newTask, ...tasks])
            setIsModalOpen(false)
            // Reset form
            setTitle('')
            setDescription('')
            setCategory('Marketing materijali')
            setCustomCategory('')
            setIsCustomCategory(false)
            setDeadline('')
            setAssignedHours('')
            router.refresh()
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Jeste li sigurni da želite ukloniti ovaj zadatak?')) return

        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
        if (res.ok) {
            const { task: updated } = await res.json()
            if (isAdmin) {
                setTasks(tasks.map(t => t.id === id ? updated : t))
            } else {
                setTasks(tasks.filter(t => t.id !== id))
            }
            router.refresh()
        }
    }

    const filteredTasks = tasks.filter(t => filter === 'SVE' || t.category === filter)

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Zadaci</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    + Novi Zadatak
                </button>
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {filterOptions.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            backgroundColor: filter === cat ? 'var(--secondary-color)' : 'var(--surface-color)',
                            color: filter === cat ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${filter === cat ? 'var(--secondary-color)' : 'var(--border-color)'}`,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                {filteredTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredTasks.map((task, i) => (
                            <div
                                key={task.id}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderBottom: i < filteredTasks.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: task.deletedAt ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    opacity: task.deletedAt ? 0.7 : 1,
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <Link href={`/dashboard/tasks/${task.id}`}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                {task.title}
                                            </h3>
                                        </Link>
                                        {task.deletedAt && (
                                            <span style={{ padding: '0.125rem 0.6rem', fontSize: '0.7rem', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '1rem', fontWeight: 600 }}>
                                                UKLONJENO OD {task.removedBy?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '0.125rem 0.5rem',
                                            backgroundColor: task.status === 'ZATVOREN' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-color)',
                                            color: task.status === 'ZATVOREN' ? '#10b981' : 'var(--text-primary)',
                                            borderRadius: '0.5rem',
                                            fontWeight: 600,
                                            border: `1px solid ${task.status === 'ZATVOREN' ? '#10b981' : 'var(--border-color)'}`
                                        }}>
                                            {task.status}
                                        </span>
                                        <span>📁 {task.category}</span>
                                        {task.deadline && (
                                            <span>⏰ Rok: {new Date(task.deadline).toLocaleDateString('hr-HR')}</span>
                                        )}
                                        {task.assignedHours && (
                                            <span>⏳ Predviđeno: {task.assignedHours}h</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link href={`/dashboard/tasks/${task.id}`} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                        Detalji
                                    </Link>
                                    {!task.deletedAt && (
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="btn"
                                            style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                                        >
                                            Ukloni
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nema pronađenih zadataka za ovu kategoriju.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Dodaj novi zadatak</h2>
                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label>Naslov zadatka</label>
                                <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Kategorija posao (Job Type)</label>
                                <select
                                    className="input-field"
                                    value={isCustomCategory ? 'nova' : category}
                                    onChange={e => {
                                        if (e.target.value === 'nova') {
                                            setIsCustomCategory(true)
                                            setCategory('')
                                        } else {
                                            setIsCustomCategory(false)
                                            setCategory(e.target.value)
                                        }
                                    }}
                                    style={{ marginBottom: isCustomCategory ? '0.5rem' : '0' }}
                                >
                                    {allCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="nova">+ Dodaj novu kategoriju</option>
                                </select>
                                {isCustomCategory && (
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Unesite naziv nove kategorije"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                )}
                            </div>
                            <div className="form-group">
                                <label>Opis</label>
                                <textarea className="input-field" rows={3} value={description} onChange={e => setDescription(e.target.value)}></textarea>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Rok (Deadline)</label>
                                    <input type="date" className="input-field" value={deadline} onChange={e => setDeadline(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Predviđeno sati</label>
                                    <input type="number" step="0.5" className="input-field" value={assignedHours} onChange={e => setAssignedHours(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" onClick={() => setIsModalOpen(false)} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                                    Odustani
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Spremanje...' : 'Spremi Zadatak'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

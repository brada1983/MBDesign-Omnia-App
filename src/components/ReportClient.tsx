'use client'

import { useState } from 'react'

export function ReportClient({ allTasks }: { allTasks: any[] }) {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const [selectedMonth, setSelectedMonth] = useState(currentMonth)
    const [selectedYear, setSelectedYear] = useState(currentYear)

    // Filter tasks that had activity or were created in the selected month
    const filteredTasks = allTasks.filter(t => {
        const taskDate = new Date(t.createdAt)
        return taskDate.getMonth() === selectedMonth && taskDate.getFullYear() === selectedYear
    })

    const totalHoursMonth = filteredTasks.reduce((acc, t) => acc + (t.totalHours || 0), 0)

    const handlePrint = () => {
        window.print()
    }

    const months = [
        'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
        'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'
    ]

    return (
        <div>
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .glass {
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

            <div className="no-print glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Mjesec</label>
                    <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Godina</label>
                    <select className="input-field" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                        {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
                    🖨️ Generiraj PDF (Ispiši)
                </button>
            </div>

            <div className="print-area glass" style={{ padding: '3rem', borderRadius: '1rem', backgroundColor: 'white', color: 'black' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '2rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Izvještaj o Radu</h1>
                        <p style={{ fontSize: '1.25rem', color: '#64748b', marginTop: '0.5rem' }}>
                            {months[selectedMonth]} {selectedYear}.
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {/* Logos printed */}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <img src="/mb-logo.png" style={{ height: '40px' }} />
                            <img src="/omnia-logo.png" style={{ height: '30px' }} />
                        </div>
                        <p style={{ fontWeight: 600 }}>Za klijenta: OMNIA d.o.o.</p>
                        <p>Izvođač: MB Design</p>
                    </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', backgroundColor: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
                        Sažetak
                    </h3>
                    <p style={{ fontSize: '1.125rem' }}>Ukupno utrošeno sati u mjesecu: <strong style={{ fontSize: '1.5rem' }}>{totalHoursMonth.toFixed(2)}h</strong></p>
                    <p style={{ fontSize: '1.125rem', marginTop: '0.5rem' }}>Ukupno odrađenih zadataka: <strong>{filteredTasks.length}</strong></p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Naslov zadatka</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Kategorija</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Utrošeno (h)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.map((t, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>
                                    {t.title}
                                    {t.description && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{t.description.substring(0, 100)}{t.description.length > 100 ? '...' : ''}</div>}
                                </td>
                                <td style={{ padding: '1rem', color: '#64748b' }}>{t.category}</td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{t.totalHours.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredTasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                        Nema zabilježenih zadataka u ovom mjesecu.
                    </div>
                )}
            </div>
        </div>
    )
}

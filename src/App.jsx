import { useState } from 'react'
import PayrollCalculator from './components/PayrollCalculator'
import NetToGross from './components/NetToGross'
import PITReference from './components/PITReference'

const TABS = [
  { id: 'payroll', label: 'Tính lương (Gross → Net)' },
  { id: 'reverse', label: 'Tính ngược (Net → Gross)' },
  { id: 'pit',     label: 'Biểu thuế TNCN' },
]

export default function App() {
  const [tab, setTab] = useState('payroll')

  return (
    <div>
      <div className="page-header">
        <h1>Công Cụ Tính Lương Việt Nam 2025</h1>
        <p>Theo Luật Lao động, Luật BHXH và Luật Thuế TNCN hiện hành</p>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'payroll' && <PayrollCalculator />}
      {tab === 'reverse' && <NetToGross />}
      {tab === 'pit'     && <PITReference />}

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 32 }}>
        Công cụ tham khảo — không thay thế tư vấn kế toán/pháp lý.
        Dữ liệu hoàn toàn xử lý trên trình duyệt của bạn, không gửi lên server.
      </div>
    </div>
  )
}

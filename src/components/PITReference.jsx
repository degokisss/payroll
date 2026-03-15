import { useState } from 'react'
import { fmt, calcPIT } from '../utils/payroll'

const BRACKETS = [
  { bac: 1, from: 0,          to: 5_000_000,   rate: '5%',  note: '0 – 5 triệu' },
  { bac: 2, from: 5_000_000,  to: 10_000_000,  rate: '10%', note: '5 – 10 triệu' },
  { bac: 3, from: 10_000_000, to: 18_000_000,  rate: '15%', note: '10 – 18 triệu' },
  { bac: 4, from: 18_000_000, to: 32_000_000,  rate: '20%', note: '18 – 32 triệu' },
  { bac: 5, from: 32_000_000, to: 52_000_000,  rate: '25%', note: '32 – 52 triệu' },
  { bac: 6, from: 52_000_000, to: 80_000_000,  rate: '30%', note: '52 – 80 triệu' },
  { bac: 7, from: 80_000_000, to: Infinity,    rate: '35%', note: 'Trên 80 triệu' },
]

export default function PITReference() {
  const [income, setIncome] = useState(30_000_000)
  const pit = calcPIT(income)
  const effRate = income > 0 ? ((pit / income) * 100).toFixed(2) : '0'

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Biểu Thuế TNCN Lũy Tiến</h2>
          <p>TT111/2013/TT-BTC — Cập nhật 2026</p>
        </div>
        <span className="badge">7 Bậc</span>
      </div>
      <div className="card-body">

        <p className="sec-label">Thử tính nhanh</p>
        <div className="g2">
          <div className="field">
            <label>Thu nhập chịu thuế (đ)</label>
            <input type="number" value={income} onChange={e => setIncome(+e.target.value || 0)} />
          </div>
        </div>

        <div className="result-box" style={{ marginTop: 12 }}>
          <div className="result-row">
            <span className="lbl">Thu nhập chịu thuế</span>
            <span>{fmt(income)} đ</span>
          </div>
          <div className="result-row">
            <span className="lbl">Thuế TNCN phải nộp</span>
            <span className="result-big">{fmt(pit)} đ</span>
          </div>
          <div className="result-row">
            <span className="lbl">Thuế suất hiệu dụng</span>
            <span className="result-green">{effRate}%</span>
          </div>
          <div className="result-row">
            <span className="lbl">Thu nhập sau thuế</span>
            <span>{fmt(income - pit)} đ</span>
          </div>
        </div>

        <p className="sec-label">Biểu lũy tiến 7 bậc</p>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Bậc</th>
                <th>Phần thu nhập</th>
                <th>Thuế suất</th>
                <th>Thuế bậc này (đ)</th>
              </tr>
            </thead>
            <tbody>
              {BRACKETS.map((b) => {
                const slabIncome = Math.min(Math.max(0, income - b.from), b.to === Infinity ? Infinity : b.to - b.from)
                const slabTax = slabIncome * parseFloat(b.rate) / 100
                const active = income > b.from
                return (
                  <tr key={b.bac} style={active ? { background: 'rgba(232,169,74,.08)' } : {}}>
                    <td style={{ fontWeight: active ? 600 : 400, color: active ? 'var(--navy)' : 'var(--muted)' }}>
                      Bậc {b.bac}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{b.note}</td>
                    <td style={{ fontWeight: 600 }}>{b.rate}</td>
                    <td style={{ color: active ? 'var(--red-text)' : 'var(--muted)' }}>
                      {active ? fmt(slabTax) : '—'}
                    </td>
                  </tr>
                )
              })}
              <tr className="tbl-total">
                <td colSpan={3}><strong>Tổng thuế TNCN</strong></td>
                <td><strong style={{ color: 'var(--red-text)' }}>{fmt(pit)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="sec-label">Các khoản giảm trừ hiện hành</p>
        <div className="tbl-wrap">
          <table>
            <tbody>
              <tr><td>Giảm trừ bản thân</td><td style={{ textAlign: 'right' }}><strong>15.500.000 đ/tháng</strong></td></tr>
              <tr><td>Giảm trừ mỗi người phụ thuộc</td><td style={{ textAlign: 'right' }}><strong>6.200.000 đ/người/tháng</strong></td></tr>
              <tr><td>PC ăn trưa miễn thuế tối đa</td><td style={{ textAlign: 'right' }}>730.000 đ/tháng</td></tr>
              <tr><td>PC điện thoại miễn thuế tối đa</td><td style={{ textAlign: 'right' }}>300.000 đ/tháng</td></tr>
              <tr><td>PC đi lại (công vụ)</td><td style={{ textAlign: 'right' }}>Theo thực tế</td></tr>
            </tbody>
          </table>
        </div>

        <div className="info-box">
          <span className="tag">Cơ sở pháp lý</span>{' '}
          Thông tư 111/2013/TT-BTC, Nghị quyết 954/2020/UBTVQH14, Luật Thuế TNCN sửa đổi 2026.
          Giảm trừ bản thân: <strong>15.500.000đ/tháng</strong>. Giảm trừ NPT: <strong>6.200.000đ/người/tháng</strong> (áp dụng từ 2026).
        </div>

      </div>
    </div>
  )
}

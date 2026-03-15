import { useState, useMemo } from 'react'
import { fmt, fmtM, netToGross, grossToNet, getPITBracket, SELF_DED, DEP_DED } from '../utils/payroll'

export default function NetToGross() {
  const [targetNet, setTargetNet] = useState(25_000_000)
  const [deps, setDeps] = useState(0)
  const [exempt, setExempt] = useState(1_030_000)

  const result = useMemo(() => {
    const G = netToGross(targetNet, { deps, exemptAllowances: exempt })
    const detail = grossToNet(G, { deps, exemptAllowances: exempt })
    const Gr = Math.ceil(G / 100_000) * 100_000
    const detailR = grossToNet(Gr, { deps, exemptAllowances: exempt })
    return { G, Gr, detail, detailR }
  }, [targetNet, deps, exempt])

  const { G, Gr, detail, detailR } = result
  const selfDed = SELF_DED + deps * DEP_DED

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Tính Ngược Net → Gross</h2>
          <p>Reverse Payroll Calculator — Luật Lao động Việt Nam 2026</p>
        </div>
        <span className="badge">2026</span>
      </div>
      <div className="card-body">

        <p className="sec-label">Tham số đầu vào</p>
        <div className="g3">
          <div className="field">
            <label>Lương Net mong muốn (đ)</label>
            <input type="number" value={targetNet} onChange={e => setTargetNet(+e.target.value || 0)} />
          </div>
          <div className="field">
            <label>Số người phụ thuộc</label>
            <input type="number" value={deps} min="0" onChange={e => setDeps(+e.target.value || 0)} />
          </div>
          <div className="field">
            <label>Phụ cấp miễn thuế (đ)</label>
            <input type="number" value={exempt} onChange={e => setExempt(+e.target.value || 0)} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          Phụ cấp miễn thuế mặc định = ăn trưa 730k + điện thoại 300k. Điều chỉnh theo thực tế.
        </p>

        {/* Result */}
        <div className="result-box">
          <div className="result-row">
            <span className="lbl">Lương GROSS cần offer</span>
            <span className="result-big">{fmt(Math.round(G))} đ</span>
          </div>
          <div className="result-row">
            <span className="lbl">Làm tròn thực tế (≥ net)</span>
            <span className="result-green" style={{ fontSize: 16, fontWeight: 600 }}>{fmt(Gr)} đ</span>
          </div>
          <div className="result-row">
            <span className="lbl">Tổng chi phí thực tế Doanh nghiệp</span>
            <span>{fmt(Math.round(detail.totalCost))} đ</span>
          </div>
          <div className="result-row">
            <span className="lbl">Nhân viên nhận được (net)</span>
            <span className="result-green">{fmt(Math.round(detail.net))} đ</span>
          </div>
        </div>

        {/* Detail breakdown */}
        <p className="sec-label">Chi tiết kiểm tra (Gross → Net)</p>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>Khoản mục</th><th>Tỷ lệ / Cơ sở</th><th>Số tiền (đ)</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Lương Gross</strong></td><td></td><td><strong>{fmt(Math.round(G))}</strong></td></tr>
              <tr>
                <td className="tbl-muted">Bảo hiểm NLĐ đóng</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>BHXH 8% + BHYT 1.5% + BHTN 1% = 10.5%</td>
                <td className="tbl-deduct">({fmt(Math.round(detail.ins))})</td>
              </tr>
              <tr>
                <td className="tbl-muted">Giảm trừ gia cảnh</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Bản thân 15.5M{deps > 0 ? ` + ${deps} NPT × 6.2M` : ''}
                </td>
                <td style={{ color: 'var(--muted)', textAlign: 'right' }}>({fmt(selfDed + exempt)})</td>
              </tr>
              <tr className="tbl-total">
                <td><strong>Thu nhập chịu thuế</strong></td>
                <td></td>
                <td>{fmt(Math.round(detail.taxable))}</td>
              </tr>
              <tr>
                <td>Thuế TNCN (lũy tiến)</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{getPITBracket(detail.taxable)}</td>
                <td className="tbl-deduct">({fmt(Math.round(detail.pit))})</td>
              </tr>
              <tr className="tbl-net">
                <td>Lương NET thực lĩnh</td><td></td><td>{fmt(Math.round(detail.net))}</td>
              </tr>
              <tr className="tbl-section"><td colSpan={3}>Doanh nghiệp đóng thêm (tham khảo)</td></tr>
              <tr>
                <td className="tbl-muted">BHXH 17.5% + BHYT 3% + BHTN 1% = 21.5%</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>Trên {fmt(detail.insBase)}đ</td>
                <td>{fmt(Math.round(detail.erIns))}</td>
              </tr>
              <tr className="tbl-total">
                <td><strong>Tổng chi phí thực tế DN</strong></td><td></td>
                <td>{fmt(Math.round(detail.totalCost))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="info-box">
          <span className="tag">Lời khuyên HR</span>{' '}
          Offer gross <strong>{fmt(Gr)}đ</strong> (làm tròn lên {fmt(Gr - Math.round(G))}đ) để nhân viên
          nhận được ít nhất <strong>{fmt(targetNet)}đ</strong> net.
          Tổng chi phí biên chế thực tế DN: <strong>{fmt(Math.round(detailR.totalCost))}đ/tháng</strong>.{' '}
          <span className="tag warn">Lưu ý</span>{' '}
          Mức gross tính trên giả định toàn bộ là lương cơ bản.
          Nếu tách phụ cấp riêng, kết quả sẽ thay đổi.
        </div>

        {/* Metrics */}
        <div className="metrics">
          <div className="metric green">
            <div className="metric-lbl">Gross cần offer</div>
            <div className="metric-val">{fmtM(G)}M</div>
            <div className="metric-sub">Làm tròn: {fmtM(Gr)}M</div>
          </div>
          <div className="metric amber">
            <div className="metric-lbl">Tổng khấu trừ</div>
            <div className="metric-val">{fmtM(detail.ins + detail.pit)}M</div>
            <div className="metric-sub">
              {G > 0 ? (((detail.ins + detail.pit) / G) * 100).toFixed(1) : 0}% gross
            </div>
          </div>
          <div className="metric">
            <div className="metric-lbl">Chi phí thực tế DN</div>
            <div className="metric-val">{fmtM(detail.totalCost)}M</div>
            <div className="metric-sub">Gross + 21.5% BHXH/BHYT/BHTN DN</div>
          </div>
        </div>

      </div>
    </div>
  )
}

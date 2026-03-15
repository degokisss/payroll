import { useState, useMemo } from 'react'
import {
  fmt, fmtM,
  SELF_DED, DEP_DED,
  calcPIT, grossToNet, getPITBracket, INS_CAP, EE_RATE, ER_RATE
} from '../utils/payroll'

const INITIAL = {
  name: '', empid: '', dept: '', pos: '', period: '',
  basic: 20_000_000, stdDays: 26, actDays: 26,
  allowHouse: 2_000_000, allowTrans: 500_000,
  allowMeal: 730_000, allowPhone: 300_000,
  bonus: 0, otherInc: 0, deps: 0,
}

export default function PayrollCalculator() {
  const [f, setF] = useState(INITIAL)
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }))
  const num = (k) => (e) => setF(prev => ({ ...prev, [k]: +e.target.value || 0 }))

  const calc = useMemo(() => {
    const ratio = f.stdDays > 0 ? f.actDays / f.stdDays : 1
    const earnedBasic = f.basic * ratio
    const taxExempt = Math.min(f.allowMeal, 730_000) + Math.min(f.allowPhone, 300_000)
    const totalAllowances = f.allowHouse + f.allowTrans + f.allowMeal + f.allowPhone
    const gross = earnedBasic + totalAllowances + f.bonus + f.otherInc

    const insBase = Math.min(earnedBasic, INS_CAP)
    const ins = insBase * EE_RATE
    const erIns = insBase * ER_RATE

    const selfDed = SELF_DED + f.deps * DEP_DED
    const taxable = Math.max(0, earnedBasic + (totalAllowances - taxExempt) + f.bonus + f.otherInc - ins - selfDed)

    const pit = calcPIT(taxable)

    const netSalary = gross - ins - pit
    const totalCostER = gross + erIns
    const effRate = gross > 0 ? ((ins + pit) / gross * 100).toFixed(1) : '0'

    return {
      earnedBasic, totalAllowances, gross, insBase,
      bhxh: insBase * 0.08, bhyt: insBase * 0.015, bhtn: insBase * 0.01, ins,
      bhxhEr: insBase * 0.175, bhytEr: insBase * 0.03, bhtnEr: insBase * 0.01, erIns,
      selfDed, taxExempt, taxable, pit, net: netSalary,
      totalDeductions: ins + pit, totalCostER, effRate,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f])

  const { earnedBasic, totalAllowances, gross, insBase, bhxh, bhyt, bhtn, ins,
    bhxhEr, bhytEr, bhtnEr, erIns, selfDed, taxable, pit,
    net, totalDeductions, totalCostER, effRate } = calc

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Phiếu Tính Lương Nhân Viên</h2>
          <p>HR Payroll Calculation Sheet — Theo Luật Lao động Việt Nam</p>
        </div>
        <span className="badge">2026</span>
      </div>
      <div className="card-body">

        {/* Thông tin nhân viên */}
        <p className="sec-label">Thông tin nhân viên</p>
        <div className="g2" style={{ marginBottom: 12 }}>
          <div className="field"><label>Họ và tên</label><input value={f.name} onChange={set('name')} placeholder="Nguyễn Văn A" /></div>
          <div className="field"><label>Mã nhân viên</label><input value={f.empid} onChange={set('empid')} placeholder="NV-2025-001" /></div>
        </div>
        <div className="g3">
          <div className="field"><label>Phòng ban</label><input value={f.dept} onChange={set('dept')} placeholder="Kỹ thuật" /></div>
          <div className="field"><label>Chức vụ</label><input value={f.pos} onChange={set('pos')} placeholder="Senior Developer" /></div>
          <div className="field"><label>Kỳ lương</label><input value={f.period} onChange={set('period')} placeholder="Tháng 6/2025" /></div>
        </div>

        {/* Lương & Phụ cấp */}
        <p className="sec-label">Lương &amp; Phụ cấp</p>
        <div className="g3">
          <div className="field"><label>Lương cơ bản (đ/tháng)</label><input type="number" value={f.basic} onChange={num('basic')} /></div>
          <div className="field"><label>Ngày công chuẩn</label><input type="number" value={f.stdDays} onChange={num('stdDays')} /></div>
          <div className="field"><label>Ngày công thực tế</label><input type="number" value={f.actDays} onChange={num('actDays')} /></div>
        </div>
        <div className="g3" style={{ marginTop: 12 }}>
          <div className="field"><label>PC nhà ở (đ)</label><input type="number" value={f.allowHouse} onChange={num('allowHouse')} /></div>
          <div className="field"><label>PC đi lại (đ)</label><input type="number" value={f.allowTrans} onChange={num('allowTrans')} /></div>
          <div className="field"><label>PC ăn trưa (đ) — miễn thuế ≤730k</label><input type="number" value={f.allowMeal} onChange={num('allowMeal')} /></div>
        </div>
        <div className="g3" style={{ marginTop: 12 }}>
          <div className="field"><label>PC điện thoại (đ) — miễn thuế ≤300k</label><input type="number" value={f.allowPhone} onChange={num('allowPhone')} /></div>
          <div className="field"><label>Thưởng / OT (đ)</label><input type="number" value={f.bonus} onChange={num('bonus')} /></div>
          <div className="field"><label>Thu nhập khác (đ)</label><input type="number" value={f.otherInc} onChange={num('otherInc')} /></div>
        </div>

        {/* Giảm trừ gia cảnh */}
        <p className="sec-label">Giảm trừ gia cảnh (PIT)</p>
        <div className="g3">
          <div className="field"><label>Số người phụ thuộc</label><input type="number" value={f.deps} onChange={num('deps')} min="0" /></div>
          <div className="field"><label>Giảm trừ bản thân (đ)</label><input readOnly value="11,000,000" /></div>
          <div className="field"><label>Giảm trừ mỗi NPT (đ)</label><input readOnly value="6,000,000" /></div>
        </div>

        {/* Bảng chi tiết */}
        <p className="sec-label">Bảng tính chi tiết</p>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>Khoản mục</th><th>Ghi chú</th><th>Số tiền (đ)</th></tr>
            </thead>
            <tbody>
              <tr className="tbl-section"><td colSpan={3}>Thu nhập</td></tr>
              <tr><td>Lương cơ bản</td><td style={{color:'var(--muted)',fontSize:12}}>{f.actDays}/{f.stdDays} ngày công</td><td>{fmt(earnedBasic)}</td></tr>
              <tr><td className="tbl-muted">Phụ cấp nhà ở</td><td></td><td>{fmt(f.allowHouse)}</td></tr>
              <tr><td className="tbl-muted">Phụ cấp đi lại</td><td></td><td>{fmt(f.allowTrans)}</td></tr>
              <tr><td className="tbl-muted">Phụ cấp ăn trưa</td><td style={{color:'var(--muted)',fontSize:12}}>Miễn thuế ≤730k</td><td>{fmt(f.allowMeal)}</td></tr>
              <tr><td className="tbl-muted">Phụ cấp điện thoại</td><td style={{color:'var(--muted)',fontSize:12}}>Miễn thuế ≤300k</td><td>{fmt(f.allowPhone)}</td></tr>
              {f.bonus > 0 && <tr><td className="tbl-muted">Thưởng / OT</td><td></td><td>{fmt(f.bonus)}</td></tr>}
              {f.otherInc > 0 && <tr><td className="tbl-muted">Thu nhập khác</td><td></td><td>{fmt(f.otherInc)}</td></tr>}
              <tr className="tbl-total"><td><strong>Tổng thu nhập gộp</strong></td><td></td><td>{fmt(gross)}</td></tr>

              <tr className="tbl-section"><td colSpan={3}>Khấu trừ bắt buộc (NLĐ)</td></tr>
              <tr><td className="tbl-muted">BHXH 8%</td><td style={{color:'var(--muted)',fontSize:12}}>Mức đóng: {fmt(insBase)}đ</td><td className="tbl-deduct">({fmt(bhxh)})</td></tr>
              <tr><td className="tbl-muted">BHYT 1.5%</td><td></td><td className="tbl-deduct">({fmt(bhyt)})</td></tr>
              <tr><td className="tbl-muted">BHTN 1%</td><td></td><td className="tbl-deduct">({fmt(bhtn)})</td></tr>
              <tr className="tbl-total"><td><strong>Tổng bảo hiểm bắt buộc</strong></td><td></td><td className="tbl-deduct">({fmt(ins)})</td></tr>

              <tr className="tbl-section"><td colSpan={3}>Thuế thu nhập cá nhân</td></tr>
              <tr>
                <td>Thuế TNCN (lũy tiến)</td>
                <td style={{color:'var(--muted)',fontSize:12}}>
                  {getPITBracket(taxable)} · Thu nhập tính thuế: {fmt(taxable)}đ
                </td>
                <td className="tbl-deduct">({fmt(pit)})</td>
              </tr>
              <tr className="tbl-total"><td><strong>Tổng khấu trừ</strong></td><td></td><td className="tbl-deduct">({fmt(totalDeductions)})</td></tr>

              <tr className="tbl-net">
                <td>Lương thực lĩnh (NET)</td><td></td><td>{fmt(net)}</td>
              </tr>

              <tr className="tbl-section"><td colSpan={3}>Doanh nghiệp đóng thêm (tham khảo)</td></tr>
              <tr><td className="tbl-muted">BHXH 17.5%</td><td style={{color:'var(--muted)',fontSize:12}}>Mức đóng: {fmt(insBase)}đ</td><td>{fmt(bhxhEr)}</td></tr>
              <tr><td className="tbl-muted">BHYT 3%</td><td></td><td>{fmt(bhytEr)}</td></tr>
              <tr><td className="tbl-muted">BHTN 1%</td><td></td><td>{fmt(bhtnEr)}</td></tr>
              <tr className="tbl-total"><td><strong>Tổng chi phí thực tế DN</strong></td><td></td><td>{fmt(totalCostER)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="info-box">
          Giảm trừ bản thân: 11.000.000đ
          {f.deps > 0 && ` + ${f.deps} NPT × 6.000.000đ = ${fmt(selfDed)}đ`}
          . Thu nhập chịu thuế: <strong>{fmt(taxable)}đ</strong>.
        </div>

        {/* Metrics */}
        <div className="metrics">
          <div className="metric green">
            <div className="metric-lbl">Lương Net</div>
            <div className="metric-val">{fmtM(net)}M</div>
            <div className="metric-sub">{gross > 0 ? ((net / gross) * 100).toFixed(1) : 0}% tổng gross</div>
          </div>
          <div className="metric amber">
            <div className="metric-lbl">Tổng khấu trừ</div>
            <div className="metric-val">{fmtM(totalDeductions)}M</div>
            <div className="metric-sub">Tỷ lệ {effRate}% gross</div>
          </div>
          <div className="metric">
            <div className="metric-lbl">Chi phí thực tế DN</div>
            <div className="metric-val">{fmtM(totalCostER)}M</div>
            <div className="metric-sub">Gross + BHXH/BHYT/BHTN (DN)</div>
          </div>
        </div>

      </div>
    </div>
  )
}

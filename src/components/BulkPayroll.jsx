import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { fmt, grossToNet, calcPIT, SELF_DED, DEP_DED, INS_CAP, EE_RATE, ER_RATE } from '../utils/payroll'

// ─── Template columns ──────────────────────────────────────────
const TEMPLATE_COLS = [
  'ma_nv', 'ho_ten', 'phong_ban', 'chuc_vu',
  'luong_co_ban', 'ngay_cong_chuan', 'ngay_cong_thuc_te',
  'pc_nha_o', 'pc_di_lai', 'pc_an_trua', 'pc_dien_thoai',
  'thuong_ot', 'thu_nhap_khac', 'so_nguoi_phu_thuoc'
]

const TEMPLATE_HEADER = [
  'Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ',
  'Lương cơ bản', 'Ngày công chuẩn', 'Ngày công thực tế',
  'PC nhà ở', 'PC đi lại', 'PC ăn trưa (≤730k miễn thuế)',
  'PC điện thoại (≤300k miễn thuế)', 'Thưởng/OT', 'Thu nhập khác',
  'Số người phụ thuộc'
]

const SAMPLE_DATA = [
  ['NV001', 'Nguyễn Văn An', 'Kỹ thuật', 'Senior Dev', 20000000, 26, 26, 2000000, 500000, 730000, 300000, 0, 0, 1],
  ['NV002', 'Trần Thị Bình', 'Marketing', 'Manager', 25000000, 26, 24, 1500000, 500000, 730000, 300000, 2000000, 0, 2],
  ['NV003', 'Lê Minh Cường', 'Kế toán', 'Accountant', 15000000, 26, 26, 0, 500000, 730000, 0, 0, 0, 0],
]

// ─── Calc one employee ─────────────────────────────────────────
function calcEmployee(row) {
  const basic    = +row.luong_co_ban   || 0
  const std      = +row.ngay_cong_chuan  || 26
  const act      = +row.ngay_cong_thuc_te || std
  const house    = +row.pc_nha_o       || 0
  const trans    = +row.pc_di_lai      || 0
  const meal     = +row.pc_an_trua     || 0
  const phone    = +row.pc_dien_thoai  || 0
  const bonus    = +row.thuong_ot      || 0
  const other    = +row.thu_nhap_khac  || 0
  const deps     = +row.so_nguoi_phu_thuoc || 0

  const ratio       = std > 0 ? act / std : 1
  const earnedBasic = basic * ratio
  const taxExempt   = Math.min(meal, 730_000) + Math.min(phone, 300_000)
  const totalAllow  = house + trans + meal + phone
  const gross       = earnedBasic + totalAllow + bonus + other

  const insBase = Math.min(earnedBasic, INS_CAP)
  const ins     = insBase * EE_RATE
  const erIns   = insBase * ER_RATE

  const selfDed  = SELF_DED + deps * DEP_DED
  const taxable  = Math.max(0, earnedBasic + (totalAllow - taxExempt) + bonus + other - ins - selfDed)
  const pit      = calcPIT(taxable)
  const net      = gross - ins - pit

  return {
    ma_nv:     row.ma_nv     || '',
    ho_ten:    row.ho_ten    || '',
    phong_ban: row.phong_ban || '',
    chuc_vu:   row.chuc_vu   || '',
    gross, earnedBasic, totalAllow, bonus, other,
    insBase, ins, erIns,
    taxable, pit, net,
    totalCost: gross + erIns,
    totalDeduct: ins + pit,
    deps,
  }
}

// ─── Download template ─────────────────────────────────────────
function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const wsData = [TEMPLATE_HEADER, ...SAMPLE_DATA]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = TEMPLATE_HEADER.map((h, i) => ({ wch: i < 4 ? 18 : 16 }))

  // Style header row (basic - SheetJS CE doesn't support full styles but set bold via comment)
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách NV')

  // Instructions sheet
  const instr = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN NHẬP DỮ LIỆU'],
    [''],
    ['Cột', 'Mô tả', 'Ví dụ'],
    ['Mã NV', 'Mã nhân viên (tự điền)', 'NV001'],
    ['Lương cơ bản', 'Lương gross cơ bản (VNĐ)', '20000000'],
    ['Ngày công chuẩn', 'Số ngày công trong tháng', '26'],
    ['Ngày công thực tế', 'Số ngày thực tế làm việc', '24'],
    ['PC ăn trưa', 'Tối đa 730.000đ/tháng được miễn thuế', '730000'],
    ['PC điện thoại', 'Tối đa 300.000đ/tháng được miễn thuế', '300000'],
    ['Số người phụ thuộc', 'Số NPT đã đăng ký (ảnh hưởng giảm trừ PIT)', '1'],
    [''],
    ['Lưu ý:', 'Không xóa dòng tiêu đề (dòng 1). Xóa dữ liệu mẫu trước khi nhập thật.'],
  ])
  instr['!cols'] = [{ wch: 22 }, { wch: 45 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, instr, 'Hướng dẫn')

  XLSX.writeFile(wb, 'mau_tinh_luong.xlsx')
}

// ─── Export results ────────────────────────────────────────────
function exportResults(results, period) {
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const headers = [
    'Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ',
    'Gross (đ)', 'BH NLĐ (đ)', 'Thuế TNCN (đ)',
    'Tổng KT (đ)', 'Lương NET (đ)', 'Chi phí DN (đ)',
    'NPT', 'Thu nhập tính thuế (đ)'
  ]
  const rows = results.map(r => [
    r.ma_nv, r.ho_ten, r.phong_ban, r.chuc_vu,
    Math.round(r.gross),
    Math.round(r.ins),
    Math.round(r.pit),
    Math.round(r.totalDeduct),
    Math.round(r.net),
    Math.round(r.totalCost),
    r.deps,
    Math.round(r.taxable),
  ])

  // Totals row
  const totals = [
    'TỔNG CỘNG', '', '', '',
    Math.round(results.reduce((s, r) => s + r.gross, 0)),
    Math.round(results.reduce((s, r) => s + r.ins, 0)),
    Math.round(results.reduce((s, r) => s + r.pit, 0)),
    Math.round(results.reduce((s, r) => s + r.totalDeduct, 0)),
    Math.round(results.reduce((s, r) => s + r.net, 0)),
    Math.round(results.reduce((s, r) => s + r.totalCost, 0)),
    '', '',
  ]

  const wsData = [headers, ...rows, totals]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = headers.map((_, i) => ({ wch: i < 4 ? 18 : 16 }))
  XLSX.utils.book_append_sheet(wb, ws, `Bảng lương ${period || ''}`.trim())

  XLSX.writeFile(wb, `bang_luong_${period || 'export'}.xlsx`)
}

// ─── Component ────────────────────────────────────────────────
export default function BulkPayroll() {
  const [results, setResults]   = useState([])
  const [errors, setErrors]     = useState([])
  const [period, setPeriod]     = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [sortKey, setSortKey]   = useState('ho_ten')
  const [sortAsc, setSortAsc]   = useState(true)
  const [filter, setFilter]     = useState('')
  const fileRef = useRef()

  function processFile(file) {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: TEMPLATE_HEADER, defval: 0 })

        // Skip header row
        const dataRows = raw.slice(1).filter(r => r['Họ tên'] && r['Họ tên'] !== 'Họ tên')

        const errs = []
        const mapped = dataRows.map((r, i) => {
          const obj = {
            ma_nv:                r['Mã NV'],
            ho_ten:               r['Họ tên'],
            phong_ban:            r['Phòng ban'],
            chuc_vu:              r['Chức vụ'],
            luong_co_ban:         r['Lương cơ bản'],
            ngay_cong_chuan:      r['Ngày công chuẩn'],
            ngay_cong_thuc_te:    r['Ngày công thực tế'],
            pc_nha_o:             r['PC nhà ở'],
            pc_di_lai:            r['PC đi lại'],
            pc_an_trua:           r['PC ăn trưa (≤730k miễn thuế)'],
            pc_dien_thoai:        r['PC điện thoại (≤300k miễn thuế)'],
            thuong_ot:            r['Thưởng/OT'],
            thu_nhap_khac:        r['Thu nhập khác'],
            so_nguoi_phu_thuoc:   r['Số người phụ thuộc'],
          }
          if (!obj.ho_ten) { errs.push(`Dòng ${i + 2}: thiếu họ tên`); return null }
          if (!obj.luong_co_ban || obj.luong_co_ban <= 0) { errs.push(`${obj.ho_ten}: lương cơ bản không hợp lệ`); return null }
          return calcEmployee(obj)
        }).filter(Boolean)

        setErrors(errs)
        setResults(mapped)
      } catch (err) {
        setErrors([`Lỗi đọc file: ${err.message}`])
        setResults([])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const filtered = results
    .filter(r => !filter || r.ho_ten.toLowerCase().includes(filter.toLowerCase()) || r.phong_ban.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv), 'vi') : String(bv).localeCompare(String(av), 'vi')
    })

  const totals = {
    gross:       results.reduce((s, r) => s + r.gross, 0),
    ins:         results.reduce((s, r) => s + r.ins, 0),
    pit:         results.reduce((s, r) => s + r.pit, 0),
    net:         results.reduce((s, r) => s + r.net, 0),
    totalCost:   results.reduce((s, r) => s + r.totalCost, 0),
  }

  const SortIcon = ({ k }) => sortKey !== k ? ' ↕' : sortAsc ? ' ↑' : ' ↓'

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Tính Lương Hàng Loạt — Import Excel</h2>
          <p>Upload danh sách nhân viên để tính lương tự động cho tất cả</p>
        </div>
        <span className="badge">BULK</span>
      </div>
      <div className="card-body">

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 160px', minWidth: 140 }}>
            <label>Kỳ lương</label>
            <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="Tháng 6/2025" />
          </div>
          <button className="btn" onClick={downloadTemplate} style={{ whiteSpace: 'nowrap' }}>
            ⬇ Tải file mẫu (.xlsx)
          </button>
          {results.length > 0 && (
            <button className="btn btn-primary" onClick={() => exportResults(results, period)} style={{ whiteSpace: 'nowrap' }}>
              ⬆ Xuất kết quả (.xlsx)
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? '#1D9E75' : 'var(--color-border-secondary, #d5d4ce)'}`,
            borderRadius: 10,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? '#E1F5EE' : 'var(--surface, #f1f0eb)',
            transition: 'all .15s',
            marginBottom: 16,
          }}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => processFile(e.target.files[0])} />
          <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
          <div style={{ fontWeight: 500, fontSize: 14 }}>
            {fileName ? `✅ ${fileName}` : 'Kéo thả file Excel vào đây hoặc click để chọn'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Hỗ trợ .xlsx, .xls — Tải file mẫu ở trên nếu chưa có
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#A32D2D', marginBottom: 4 }}>
              ⚠ {errors.length} dòng bị lỗi — đã bỏ qua:
            </div>
            {errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: '#A32D2D' }}>• {e}</div>)}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <>
            {/* Summary metrics */}
            <div className="metrics" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 16 }}>
              <div className="metric"><div className="metric-lbl">Nhân viên</div><div className="metric-val">{results.length}</div></div>
              <div className="metric"><div className="metric-lbl">Tổng Gross</div><div className="metric-val" style={{ fontSize: 14 }}>{(totals.gross / 1e6).toFixed(1)}M</div></div>
              <div className="metric"><div className="metric-lbl">Tổng BH + Thuế</div><div className="metric-val" style={{ fontSize: 14, color: '#A32D2D' }}>{((totals.ins + totals.pit) / 1e6).toFixed(1)}M</div></div>
              <div className="metric green"><div className="metric-lbl">Tổng Net</div><div className="metric-val" style={{ fontSize: 14 }}>{(totals.net / 1e6).toFixed(1)}M</div></div>
              <div className="metric"><div className="metric-lbl">Tổng chi phí DN</div><div className="metric-val" style={{ fontSize: 14 }}>{(totals.totalCost / 1e6).toFixed(1)}M</div></div>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: 10 }}>
              <input
                placeholder="🔍 Lọc theo tên hoặc phòng ban..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ width: '100%', height: 36, padding: '0 12px', border: '0.5px solid #d5d4ce', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', background: 'var(--card)', color: 'var(--text)' }}
              />
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <div className="tbl-wrap" style={{ marginTop: 0 }}>
                <table style={{ minWidth: 800 }}>
                  <thead>
                    <tr>
                      {[
                        ['ma_nv', 'Mã NV'], ['ho_ten', 'Họ tên'], ['phong_ban', 'Phòng ban'],
                        ['gross', 'Gross (đ)'], ['ins', 'BH NLĐ (đ)'], ['pit', 'Thuế TNCN (đ)'],
                        ['net', 'NET (đ)'], ['totalCost', 'CP Thực tế DN (đ)'],
                      ].map(([k, label]) => (
                        <th key={k} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleSort(k)}>
                          {label}<SortIcon k={k} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.ma_nv}</td>
                        <td style={{ fontWeight: 500 }}>{r.ho_ten}</td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.phong_ban}</td>
                        <td>{fmt(r.gross)}</td>
                        <td style={{ color: '#A32D2D' }}>({fmt(r.ins)})</td>
                        <td style={{ color: '#A32D2D' }}>({fmt(r.pit)})</td>
                        <td style={{ color: '#1D9E75', fontWeight: 600 }}>{fmt(r.net)}</td>
                        <td style={{ color: 'var(--muted)' }}>{fmt(r.totalCost)}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="tbl-total">
                      <td colSpan={3}><strong>Tổng cộng ({filtered.length}/{results.length} NV)</strong></td>
                      <td>{fmt(filtered.reduce((s, r) => s + r.gross, 0))}</td>
                      <td style={{ color: '#A32D2D' }}>({fmt(filtered.reduce((s, r) => s + r.ins, 0))})</td>
                      <td style={{ color: '#A32D2D' }}>({fmt(filtered.reduce((s, r) => s + r.pit, 0))})</td>
                      <td style={{ color: '#1D9E75', fontWeight: 600 }}>{fmt(filtered.reduce((s, r) => s + r.net, 0))}</td>
                      <td>{fmt(filtered.reduce((s, r) => s + r.totalCost, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="info-box" style={{ marginTop: 12 }}>
              <span className="tag">Kỳ lương</span> {period || '(chưa điền)'} &nbsp;·&nbsp;
              {results.length} nhân viên &nbsp;·&nbsp;
              Tổng quỹ lương gross: <strong>{fmt(totals.gross)}đ</strong> &nbsp;·&nbsp;
              Tổng chi phí DN: <strong>{fmt(totals.totalCost)}đ</strong>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

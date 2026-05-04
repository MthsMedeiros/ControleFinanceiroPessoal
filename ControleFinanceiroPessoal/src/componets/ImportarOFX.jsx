import { useState, useRef } from 'react'

// ─── Icons ────────────────────────────────────────────────────────────────────

const UploadCloudIcon = () => (
  <svg className="w-14 h-14 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

// Ícone de extrato bancário com seta de importação — representa importação OFX
const OFXImportIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {/* Corpo do cartão/extrato */}
    <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" strokeLinecap="round" />
    {/* Seta de importação (download) dentro do card */}
    <path d="M12 14v3m-1.5-1.5L12 17l1.5-1.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Badge usado no card da transação para indicar origem OFX
const OFXBadge = () => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold
    bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0">
    <OFXImportIcon className="w-3 h-3" />
    OFX
  </span>
)

// ─── Parser OFX ───────────────────────────────────────────────────────────────

function parseOFX(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const getValue = (block, tag) => {
    // XML: <TAG>valor</TAG>
    const xml = new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, 'i').exec(block)
    if (xml) return xml[1].trim()
    // SGML: <TAG>valor (sem fechamento)
    const sgml = new RegExp(`<${tag}>([^\\n<]+)`, 'i').exec(block)
    if (sgml) return sgml[1].trim()
    return ''
  }

  const transactions = []
  const parts = normalized.split(/<STMTTRN>/i)

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].split(/<\/STMTTRN>/i)[0]

    const dtposted = getValue(block, 'DTPOSTED')
    const trnamt   = getValue(block, 'TRNAMT')
    const memo     = getValue(block, 'MEMO') || getValue(block, 'NAME')
    const fitid    = getValue(block, 'FITID')

    if (!trnamt) continue

    // Data: YYYYMMDD[HHMMSS][timezone]
    const dateStr = dtposted.replace(/[^0-9]/g, '').substring(0, 8)
    if (dateStr.length < 8) continue
    const data = `${dateStr.substring(6, 8)}/${dateStr.substring(4, 6)}/${dateStr.substring(0, 4)}`

    const amount = parseFloat(trnamt.replace(',', '.'))
    if (isNaN(amount)) continue

    transactions.push({
      fitid  : fitid ? `${fitid}-${i}` : `trn-${i}-${data}-${amount}`,
      descricao: memo || 'Sem descrição',
      valor  : Math.abs(amount).toFixed(2),
      data,
      tipo   : amount >= 0 ? 'receita' : 'despesa',
    })
  }

  return transactions
}

// ─── Componente Principal ─────────────────────────────────────────────────────

const ImportarOFX = ({ listReceitas = [], listDespesas = [], httpConfigReceitas, httpConfigDespesas, httpConfigBatchReceitas, httpConfigBatchDespesas }) => {
  const [transactions, setTransactions] = useState([])
  const [isDragging, setIsDragging]     = useState(false)
  const [fileName, setFileName]         = useState('')
  const [approved, setApproved]         = useState({})   // { fitid: true }
  const [filter, setFilter]             = useState('all') // 'all' | 'new' | 'existing'
  const fileRef = useRef(null)

  // ── matching: mesmo valor E mesma data ──
  const isExisting = (trn) => {
    const list = trn.tipo === 'receita' ? listReceitas : listDespesas
    const val  = parseFloat(trn.valor)
    return list.some(item => {
      const itemVal = Math.abs(parseFloat(item.valor))
      return Math.abs(itemVal - val) < 0.005 && item.data === trn.data
    })
  }

  const handleFile = (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.ofx')) {
      alert('Por favor, selecione um arquivo .ofx')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target.result
      // Tenta UTF-8 primeiro; se houver caracteres de substituição (U+FFFD),
      // cai para ISO-8859-1 (encoding padrão de bancos brasileiros antigos)
      let text = new TextDecoder('utf-8').decode(buffer)
      if (text.includes('\uFFFD')) {
        text = new TextDecoder('iso-8859-1').decode(buffer)
      }
      const parsed = parseOFX(text)
      setTransactions(parsed)
      setApproved({})
      setFilter('all')
    }
    reader.readAsArrayBuffer(file)
  }

  const handleApprove = (trn) => {
    if (!httpConfigReceitas || !httpConfigDespesas) return
    const payload = {
      descricao  : `[OFX] ${trn.descricao}`,
      valor      : trn.valor,
      data       : trn.data,
      recorrencia: false,
      ...(trn.tipo === 'receita' ? { recebido: false } : { pago: false }),
    }
    if (trn.tipo === 'receita') httpConfigReceitas(payload, 'POST')
    else                        httpConfigDespesas(payload, 'POST')
    setApproved(prev => ({ ...prev, [trn.fitid]: true }))
  }

  const handleApproveAll = async () => {
    const pending = transactions.filter(t => !isExisting(t) && !approved[t.fitid])
    if (pending.length === 0) return

    const toReceitas = pending
      .filter(t => t.tipo === 'receita')
      .map(t => ({ descricao: `[OFX] ${t.descricao}`, valor: t.valor, data: t.data, recorrencia: false, recebido: false }))

    const toDespesas = pending
      .filter(t => t.tipo === 'despesa')
      .map(t => ({ descricao: `[OFX] ${t.descricao}`, valor: t.valor, data: t.data, recorrencia: false, pago: false }))

    if (toReceitas.length > 0 && httpConfigBatchReceitas) await httpConfigBatchReceitas(toReceitas)
    if (toDespesas.length > 0 && httpConfigBatchDespesas) await httpConfigBatchDespesas(toDespesas)

    const newApproved = {}
    pending.forEach(t => { newApproved[t.fitid] = true })
    setApproved(prev => ({ ...prev, ...newApproved }))
  }

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'new')      return !isExisting(t)
    if (filter === 'existing') return  isExisting(t)
    return true
  })

  const newCount      = transactions.filter(t => !isExisting(t) && !approved[t.fitid]).length
  const existingCount = transactions.filter(t =>  isExisting(t)).length
  const approvedCount = Object.keys(approved).length

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <OFXImportIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Importar OFX</h1>
            <p className="text-sm text-white/40">Importe seu extrato bancário em formato OFX</p>
          </div>
        </div>

        {/* Zona de upload */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
            p-12 flex flex-col items-center justify-center gap-4
            ${isDragging
              ? 'border-amber-500/60 bg-amber-500/10'
              : 'border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/5'}`}
        >
          <input ref={fileRef} type="file" accept=".ofx" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <UploadCloudIcon />
          {fileName ? (
            <div className="text-center">
              <p className="text-white font-medium">{fileName}</p>
              <p className="text-sm text-white/40 mt-1">Clique para substituir o arquivo</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white/60 font-medium">Arraste seu arquivo OFX aqui</p>
              <p className="text-sm text-white/30 mt-1">ou clique para selecionar</p>
            </div>
          )}
        </div>

        {/* Resultados */}
        {transactions.length > 0 && (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{transactions.length}</p>
                <p className="text-xs text-white/40 mt-1">Total importado</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{existingCount}</p>
                <p className="text-xs text-emerald-400/60 mt-1">Já cadastrados</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{newCount}</p>
                <p className="text-xs text-amber-400/60 mt-1">
                  {approvedCount > 0 ? `${approvedCount} aprovado(s) · ${newCount} pendente(s)` : 'Aguardando aprovação'}
                </p>
              </div>
            </div>

            {/* Filtros + Aprovar todos */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                {[
                  { id: 'all',      label: `Todos (${transactions.length})` },
                  { id: 'new',      label: `Novos (${newCount + approvedCount})` },
                  { id: 'existing', label: `Existentes (${existingCount})` },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                      ${filter === f.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/70'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {newCount > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30
                    text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-all duration-150 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aprovar todos os novos ({newCount})
                </button>
              )}
            </div>

            {/* Lista de transações */}
            <div className="space-y-2">
              {filteredTransactions.length === 0 && (
                <p className="text-center text-white/30 py-8 text-sm">Nenhuma transação nesta categoria.</p>
              )}
              {filteredTransactions.map((trn) => {
                const exists     = isExisting(trn)
                const isApproved = !!approved[trn.fitid]

                return (
                  <div
                    key={trn.fitid}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-150
                      ${exists
                        ? 'bg-emerald-500/5  border-emerald-500/15'
                        : isApproved
                          ? 'bg-blue-500/5   border-blue-500/15'
                          : 'bg-white/2 border-white/8 hover:bg-white/4'}`}
                  >
                    {/* Barra de tipo */}
                    <div className={`w-1 h-10 rounded-full shrink-0
                      ${trn.tipo === 'receita' ? 'bg-emerald-400' : 'bg-red-400'}`} />

                    {/* Descrição + data */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{trn.descricao}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium
                          ${trn.tipo === 'receita'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/15    text-red-400    border-red-500/20'}`}>
                          {trn.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                        {(isApproved) && <OFXBadge />}
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">{trn.data}</p>
                    </div>

                    {/* Valor */}
                    <p className={`font-semibold shrink-0 tabular-nums
                      ${trn.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trn.tipo === 'despesa' ? '−' : '+'}
                      R$ {parseFloat(trn.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>

                    {/* Status / Ação */}
                    <div className="shrink-0 w-36 flex justify-end">
                      {exists ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Já cadastrado
                        </span>
                      ) : isApproved ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprovado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApprove(trn)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20
                            border border-amber-500/30 text-amber-400 text-xs font-medium
                            hover:bg-amber-500/30 transition-all duration-150"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Aprovar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImportarOFX
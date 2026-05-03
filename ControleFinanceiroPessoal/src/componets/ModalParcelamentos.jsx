import { useState, useEffect } from 'react'

const ModalParcelamentos = ({ cartao, onClose, httpConfig, httpConfigBatch, httpConfigBatchDespesas, modoEdicao = false }) => {
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [numeroParcelas, setNumeroParcelas] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [parcelasPagas, setParcelasPagas] = useState('')

  // Popula os campos se estiver em modo de edição
  useEffect(() => {
    if (modoEdicao && cartao.parcelamentos && cartao.parcelamentos.length > 0) {
      const parcela = cartao.parcelamentos[0]
      setDescricao(parcela.descricao)
      setValorTotal(parcela.valorTotal?.toString() || '')
      setNumeroParcelas(parcela.numeroParcelas?.toString() || '')
      setDataInicio(parcela.dataInicio?.split('/').reverse().join('-') || '')
      // Conta quantas parcelas estão pagas no array de parcelas
      const pagas = (parcela.parcelas || []).filter(p => p.pago === true).length
      setParcelasPagas(pagas > 0 ? pagas.toString() : '')
    }
  }, [modoEdicao, cartao])

  const valorParcela = valorTotal && numeroParcelas
    ? (parseFloat(valorTotal) / parseInt(numeroParcelas)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null

  const clearFields = () => {
    setDescricao('')
    setValorTotal('')
    setNumeroParcelas('')
    setDataInicio('')
    setParcelasPagas('')
  }

    function dateFactory(date) {
        const [ano, mes, dia] = date.split('-')
        let trueDate = new Date(ano, mes - 1, dia)

        return trueDate
    }

    function sumMonth(date) {
        const trueDate = dateFactory(date)
        let actualDay = trueDate.getDate()
        let lastDayMonth = new Date(trueDate.getFullYear(), trueDate.getMonth() + 1, 0).getDate()
        let plusMonth

        trueDate.setDate(1)

        trueDate.setMonth(trueDate.getMonth() + 1)

        if (actualDay > lastDayMonth) {
            plusMonth = new Date(trueDate.getFullYear(), trueDate.getMonth(), Math.min(actualDay, lastDayMonth))
        } else {
            plusMonth = new Date(trueDate.getFullYear(), trueDate.getMonth(), actualDay)

        }

        return plusMonth.toISOString().split('T')[0].split('-').reverse().join('/')


    }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const numParcelas = parseInt(numeroParcelas)
    const numParcelasPagas = parcelasPagas ? parseInt(parcelasPagas) : 0
    
    // Validação: parcelas pagas não pode ser maior que número total de parcelas
    if (numParcelasPagas > numParcelas) {
      alert('Número de parcelas pagas não pode ser maior que o número total de parcelas!')
      return
    }
    
    // Gera o array de parcelas individuais com status de pagamento
    const gerarParcelas = (total, pagas) =>
      Array.from({ length: total }, (_, i) => ({ numero: i + 1, pago: i < pagas }))

    if (modoEdicao) {
      // Modo de EDIÇÃO: atualiza TODOS os parcelamentos com os novos valores
      const parcelamentosAtualizados = (cartao.parcelamentos || []).map((parcela) => ({
        descricao,
        valorTotal: parseFloat(valorTotal),
        numeroParcelas: numParcelas,
        valorParcela: parseFloat(valorTotal) / numParcelas,
        dataInicio: dataInicio.split('-').reverse().join('/'),
        parcelas: gerarParcelas(numParcelas, numParcelasPagas)
      }))
      httpConfig({ id: cartao.id, parcelamentos: parcelamentosAtualizados }, 'PATCH')
    } else {
      // Modo de ADIÇÃO: cria um novo parcelamento
      const novoParcelamento = {
        descricao,
        valorTotal: parseFloat(valorTotal),
        numeroParcelas: numParcelas,
        valorParcela: parseFloat(valorTotal) / numParcelas,
        dataInicio: dataInicio.split('-').reverse().join('/'),
        parcelas: gerarParcelas(numParcelas, numParcelasPagas)
      }
      const parcelamentosAtualizados = [...(cartao.parcelamentos || []), novoParcelamento]
      httpConfig({ id: cartao.id, parcelamentos: parcelamentosAtualizados }, 'PATCH')
    }
    clearFields()
    onClose()
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#1e2939] shadow-2xl p-8'>

        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center'>
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='#4ade80' className='w-4 h-4'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z' />
              </svg>
            </div>
            <div>
              <h2 className='text-lg font-bold text-white'>{modoEdicao ? 'Editar Parcelamentos' : 'Novo Parcelamento'}</h2>
              <p className='text-xs text-white/40'>{cartao.nome} {modoEdicao ? '- Edita TODOS os parcelamentos' : ''}</p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200'
          >
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' className='w-5 h-5'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M6 18 18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <label className='flex flex-col gap-1'>
            <span className='text-xs text-white/50 uppercase tracking-wider'>Descrição</span>
            <input
              required
              maxLength={50}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder='Ex: iPhone 16'
              type='text'
              className='bg-white/10 border border-white/20 focus:border-green-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
            />
          </label>

          <div className='flex gap-4'>
            <label className='flex flex-col gap-1 flex-1'>
              <span className='text-xs text-white/50 uppercase tracking-wider'>Valor Total (R$)</span>
              <input
                required
                min={0.01}
                step={0.01}
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder='0,00'
                type='number'
                className='bg-white/10 border border-white/20 focus:border-green-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
              />
            </label>
            <label className='flex flex-col gap-1 flex-1'>
              <span className='text-xs text-white/50 uppercase tracking-wider'>Nº de Parcelas</span>
              <input
                required
                min={1}
                max={48}
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                placeholder='Ex: 12'
                type='number'
                className='bg-white/10 border border-white/20 focus:border-green-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
              />
            </label>
          </div>

          <label className='flex flex-col gap-1'>
            <span className='text-xs text-white/50 uppercase tracking-wider'>Data da 1ª Parcela</span>
            <input
              required
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              type='date'
              className='bg-white/10 border border-white/20 focus:border-green-400 focus:outline-none rounded-xl px-4 py-2.5 text-white/80 transition-colors duration-200'
            />
          </label>

          <label className='flex flex-col gap-1'>
            <span className='text-xs text-white/50 uppercase tracking-wider'>Parcelas já Pagas (opcional)</span>
            <input
              min={0}
              max={numeroParcelas ? parseInt(numeroParcelas) : 48}
              value={parcelasPagas}
              onChange={(e) => setParcelasPagas(e.target.value)}
              placeholder='Ex: 3'
              type='number'
              className='bg-white/10 border border-white/20 focus:border-green-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
            />
            <span className='text-xs text-white/30 mt-1'>Deixe vazio ou 0 se nenhuma parcela foi paga</span>
          </label>

          {/* Preview valor parcela */}
          {valorParcela && (
            <div className='flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3'>
              <span className='text-sm text-white/60'>Valor por parcela</span>
              <span className='text-lg font-bold text-green-400'>R$ {valorParcela}</span>
            </div>
          )}

          <div className='flex gap-3 mt-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 py-2.5 rounded-xl font-semibold text-white/60 border border-white/20 hover:bg-white/10 transition-all duration-200'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='flex-1 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 hover:shadow-[0_0_15px_rgba(74,222,128,0.4)] transition-all duration-200'
            >
              {modoEdicao ? 'Editar Todos' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalParcelamentos
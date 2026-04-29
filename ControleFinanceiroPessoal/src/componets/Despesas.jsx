import { useState, useEffect, useRef } from 'react'


const Despesas = ( { listDespesas,httpConfig }) => {


  const [id, setId] = useState("")
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [date, setDate] = useState("")
  const [editing, setEditing] = useState(false)

  const inputDesc = useRef(null)
  const inputValor = useRef(null)
  const inputDate = useRef(null)


  function editItem(id, descricao, valor, date) {

    setId(id)
    setDescricao(descricao)
    setValor(valor)
    setDate(date.split('/').reverse().join('-'))




  }

  const handleSubmit = async (e) => {

    e.preventDefault()



    if (editing == false) {

      const dataDespesa = {
        descricao: descricao,
        valor: valor,
        data: date === "" || date == null ? "--Sem data definida--" : date.split('-').reverse().join('/')
      }
      httpConfig(dataDespesa, 'POST')
      setDescricao("")
      setValor("")
      setDate("")
    } else {
      const dataUpdateDespesa = {
        id: id,
        descricao: descricao,
        valor: valor,
        data: date === "" || date == null ? "--Sem data definida--" : date.split('-').reverse().join('/')
      }
      console.log(dataUpdateDespesa)
      httpConfig(dataUpdateDespesa, 'PATCH')
      setEditing(false)
      setDescricao("")
      setValor("")
      setDate("")
    }

  }

  const handleDelete = async (id) => {
    const dataForDelete = {
      id: id
    }

    httpConfig(dataForDelete, 'DELETE')
  }



  const total = listDespesas.reduce((acc, despesa) => acc + parseFloat(despesa.valor), 0)

  return (
    <div className='mt-10 flex flex-col gap-8 px-6 max-w-5xl mx-auto w-full'>

      {/* Título */}
      <div className='flex items-center gap-3'>
        <div className='w-1 h-8 bg-red-500 rounded-full'></div>
        <h1 className='text-3xl font-bold text-white'>Despesas</h1>
        <span className='ml-auto text-sm text-white/40'>{listDespesas.length} registro{listDespesas.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Formulário */}
      <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6'>
        <h2 className='text-sm font-semibold text-white/50 uppercase tracking-widest mb-5'>
          {editing ? '✏️ Editando despesa' : '+ Nova despesa'}
        </h2>
        <form className='flex flex-wrap gap-4 items-end' onSubmit={handleSubmit}>
          <label className='flex flex-col gap-1 flex-1 min-w-40'>
            <span className='text-xs text-white/50 uppercase tracking-wider'>Descrição</span>
            <input
              ref={inputDesc} required maxLength={50} value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className='bg-white/10 border border-white/20 focus:border-red-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
              type="text" placeholder="Ex: Aluguel"
            />
          </label>
          <label className='flex flex-col gap-1 w-36'>
            <span className='text-xs text-white/50 uppercase tracking-wider'>Valor (R$)</span>
            <input
              ref={inputValor} required value={valor}
              onChange={(e) => setValor(e.target.value)}
              className='bg-white/10 border border-white/20 focus:border-red-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
              max={1000000} type="number" placeholder="0,00"
            />
          </label>
          <label className='flex flex-col gap-1 w-44'>
            <span className='text-xs text-white/50 uppercase tracking-wider'>Data</span>
            <input
              ref={inputDate} value={date}
              onChange={(e) => setDate(e.target.value)}
              className='bg-white/10 border border-white/20 focus:border-red-400 focus:outline-none rounded-xl px-4 py-2.5 text-white/80 transition-colors duration-200'
              type="date"
            />
          </label>
          <button
            type="submit"
            className='px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-red-600 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(255,50,50,0.5)] active:scale-95'
          >
            {editing ? 'Salvar' : 'Adicionar'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(false); setDescricao(''); setValor(''); setDate('') }}
              className='px-5 py-2.5 rounded-xl font-semibold text-white/50 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 hover:bg-white/10'
            >
              Cancelar
            </button>
          )}
        </form>
      </div>

      {/* Tabela */}
      <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl overflow-hidden'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-white/10 text-white/40 uppercase text-xs tracking-widest'>
              <th className='text-left px-6 py-4 font-medium'>Data</th>
              <th className='text-left px-6 py-4 font-medium'>Descrição</th>
              <th className='text-right px-6 py-4 font-medium'>Valor</th>
              <th className='text-center px-6 py-4 font-medium'>Ações</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/5'>
            {listDespesas.length === 0 && (
              <tr>
                <td colSpan={4} className='text-center py-10 text-white/30'>Nenhuma despesa cadastrada</td>
              </tr>
            )}
            {listDespesas.map((despesa, index) => (
              <tr key={index} className='hover:bg-white/5 transition-colors duration-150 group'>
                <td className='px-6 py-4 text-white/50'>{despesa.data}</td>
                <td className='px-6 py-4 text-white font-medium'>{despesa.descricao}</td>
                <td className='px-6 py-4 text-right text-red-400 font-semibold'>
                  R$ {parseFloat(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className='px-6 py-4'>
                  <div className='flex gap-2 justify-center'>
                    <button
                      type="button"
                      onClick={() => { setEditing(true); editItem(despesa.id, despesa.descricao, despesa.valor, despesa.data) }}
                      className='px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30 transition-all duration-200'
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(despesa.id)}
                      className='px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 transition-all duration-200'
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='border-t border-white/10 bg-white/5'>
              <td colSpan={2} className='px-6 py-4 text-white/40 text-xs uppercase tracking-wider'>Total</td>
              <td className='px-6 py-4 text-right text-red-400 font-bold text-base'>
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default Despesas
import { useState, useRef } from 'react'


const Receitas = ({ listReceitas, httpConfig, loading }) => {



    //Filtro de Mes
    const [mesAnoAtual, setMesAnoAtual] = useState(new Date())
    const [meses] = useState(["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"])




    const [id, setId] = useState("")
    const [descricao, setDescricao] = useState("")
    const [valor, setValor] = useState("")
    const [date, setDate] = useState("")
    const [recorrencia, setRecorrencia] = useState(false)
    const [recebido, setRecebido] = useState(false)

    const [editing, setEditing] = useState(false)

    const inputDesc = useRef(null)
    const inputValor = useRef(null)
    const inputDate = useRef(null)


    const filtrarPorMes = (lista) => {

        const ano = mesAnoAtual.getFullYear()
        const mes = mesAnoAtual.getMonth() + 1
        return lista.filter(item => {
            if (!item.data || item.data === '--Sem data definida--') return false
            const [, m, y] = item.data.split('/')
            return parseInt(m) === mes && parseInt(y) === ano
        })
    }

    const receitasFiltradas = filtrarPorMes(listReceitas)

    function editItem(id, descricao, valor, date, recorrencia, recebido) {

        setId(id)
        setDescricao(descricao)
        setValor(valor)
        setDate(date.split('/').reverse().join('-'))
        setRecorrencia(recorrencia)
        setRecebido(recebido)




    }

    function calculaTotalMes() {
        let total = 0;
        listReceitas.forEach(element => {
            if (parseInt(element.data.split('/')[1]) === (mesAnoAtual.getMonth() + 1) && parseInt(element.data.split('/')[2]) === mesAnoAtual.getFullYear()) {
                total += parseFloat(element.valor)
            }
        });
        return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }

    function dateFactory(date) {
        const [dia, mes, ano] = date.split('/')
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

    const handleSubmit = async (e) => {

        e.preventDefault()



        if (editing == false) {




            const receitasRecorrentes = []
            if (recorrencia) {

                receitasRecorrentes[0] = { descricao, valor, data: date.split('-').reverse().join('/'), recebido, recorrencia }
                for (let i = 1; i <= 11; i++) {
                    receitasRecorrentes[i] = { descricao, valor, data: sumMonth(receitasRecorrentes[i - 1].data), recebido, recorrencia }
                }

                for (const receita of receitasRecorrentes) {
                    await fetch('http://localhost:3001/receitas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(receita)
                    })
                }
                
                httpConfig(receitasRecorrentes[11], 'POST')

            } else {
                receitasRecorrentes = {
                    descricao: descricao,
                    valor: valor,
                    data: date.split('-').reverse().join('/'),
                    recebido: recebido,
                    recorrencia: recorrencia
                }
                httpConfig(receitasRecorrentes, 'POST')
            }




            //httpConfig(dataReceita, 'POST')
            setDescricao("")
            setValor("")
            setDate("")
            setRecebido(false)
            setRecorrencia(false)
        } else {
            const dataUpdateReceita = {
                id: id,
                descricao: descricao,
                valor: valor,
                data: date === "" || date == null ? "--Sem data definida--" : date.split('-').reverse().join('/'),
                recebido: recebido,
                recorrencia: recorrencia
            }
            httpConfig(dataUpdateReceita, 'PATCH')
            setEditing(false)
            setDescricao("")
            setValor("")
            setDate("")
            setRecebido(false)
            setRecorrencia(false)
        }

    }

    const handleDelete = async (id) => {
        const dataForDelete = {
            id: id
        }

        httpConfig(dataForDelete, 'DELETE')
    }

    return (
        <div className='mt-10 flex flex-col gap-8 px-6 max-w-5xl mx-auto w-full'>

            {/* Título */}
            <div className='flex items-center gap-3'>
                <div className='w-1 h-8 bg-blue-500 rounded-full'></div>
                <h1 className='text-3xl font-bold text-white'>Receitas</h1>
                <span className='ml-auto text-sm text-white/40'>{receitasFiltradas.length} registro{receitasFiltradas.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Formulário */}
            <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6'>
                <h2 className='text-sm font-semibold text-white/50 uppercase tracking-widest mb-5'>
                    {editing ? '✏️ Editando receita' : '+ Nova receita'}
                </h2>
                <form className='flex flex-wrap gap-4 items-end' onSubmit={handleSubmit}>
                    <label className='flex flex-col gap-1 flex-1 min-w-30'>
                        <span className='text-xs text-white/50 uppercase tracking-wider'>Descrição</span>
                        <input
                            ref={inputDesc} required maxLength={50} value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            className='bg-white/10 border border-white/20 focus:border-blue-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
                            type="text" placeholder="Ex: Salário"
                        />
                    </label>
                    <label className='flex flex-col gap-1 flex-1 min-w-5'>
                        <span className='text-xs text-white/50 uppercase tracking-wider'>Valor (R$)</span>
                        <input
                            ref={inputValor} required value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            className='bg-white/10 border border-white/20 focus:border-blue-400 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-white/30 transition-colors duration-200'
                            max={1000000} type="number" placeholder="0,00"
                        />
                    </label>
                    <label className='flex flex-col gap-1 w-44'>
                        <span className='text-xs text-white/50 uppercase tracking-wider'>Data</span>
                        <input
                            required
                            ref={inputDate} value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className='bg-white/10 border border-white/20 focus:border-blue-400 focus:outline-none rounded-xl px-4 py-2.5 text-white/80 transition-colors duration-200'
                            type="date"
                        />
                    </label>
                    {/*-------------------------------------------------Recorrencia--------------------------------------------------*/}
                    <label className='self-start flex flex-col items-center justify-start gap-5  px-4 py-1 '>
                        <span className='text-xs text-white/50 uppercase tracking-wider'>Recorrência</span>
                        <input
                            type="checkbox"
                            checked={recorrencia}
                            onChange={(e) => setRecorrencia(e.target.checked)}
                        />

                    </label>

                    {/*-------------------------------------------------Baixa--------------------------------------------------*/}
                    <label className='self-start flex flex-col items-center justify-start gap-5  px-4 py-1 '>
                        <span className='text-xs text-white/50 uppercase tracking-wider'>Recebido</span>
                        <input
                            type="checkbox"

                            checked={recebido}
                            onChange={(e) => setRecebido(e.target.checked)}
                        />
                    </label>

                    {loading ? (
                        <button type="button" className='flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 opacity-70 cursor-not-allowed'>
                            <svg aria-hidden="true" className="w-4 h-4 animate-spin fill-white text-white/30" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                            </svg>
                            {editing ? 'Salvando...' : 'Adicionando...'}
                        </button>
                    ) : (
                        <>
                            <button
                                type="submit"
                                className='px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(43,127,255,0.5)] active:scale-95'
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
                        </>
                    )}
                </form>

                <hr className='mt-8 border-white/40' />

                {/*Div Filtro Mes*/}
                <div className='mt-8 flex items-center justify-center gap-4'>

                    {/*Div Seta esquerda*/}
                    <div>
                        <button onClick={() => setMesAnoAtual(new Date(mesAnoAtual.getFullYear(), mesAnoAtual.getMonth() - 1, 1))} className='flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500/30 border border-white/20 hover:border-blue-400 text-white/60 hover:text-white transition-all duration-200'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
                            </svg>
                        </button>
                    </div>

                    {/*Div de mês e ano*/}
                    <div className=' text-white/50 text-sm flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-blue-400 rounded-xl px-5 py-3 cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(43,127,255,0.4)] min-w-44 justify-center'>
                        <svg className='w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                        </svg>
                        <span className='text-sm text-white/50'>{meses[mesAnoAtual.getMonth()]} {mesAnoAtual.getFullYear()}</span>
                    </div>

                    {/*Div Seta direita*/}
                    <div>
                        <button onClick={() => setMesAnoAtual(new Date(mesAnoAtual.getFullYear(), mesAnoAtual.getMonth() + 1, 1))} className='flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500/30 border border-white/20 hover:border-blue-400 text-white/60 hover:text-white transition-all duration-200'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl overflow-hidden'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr className='border-b border-white/10 text-white/40 uppercase text-xs tracking-widest'>
                            <th className='text-left px-6 py-4 font-medium'>Data</th>
                            <th className='text-left px-6 py-4 font-medium'>Descrição</th>
                            <th className='text-right px-6 py-4 font-medium'>Valor</th>
                            <th className='text-center px-6 py-4 font-medium'>Recorrência</th>
                            <th className='text-center px-6 py-4 font-medium'>Baixa</th>
                            <th className='text-center px-6 py-4 font-medium'>Ações</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-white/5'>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className='text-center py-6'>
                                    <div className='flex items-center justify-center'>
                                        <svg aria-hidden="true" className="w-8 h-8 animate-spin fill-blue-500 text-white/20" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {listReceitas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className='text-center py-10 text-white/30'>Nenhuma receita cadastrada</td>
                                    </tr>
                                )}
                                {listReceitas.map((receita, index) => (
                                    receita.data && receita.data.includes('/') &&
                                        parseInt(receita.data.split('/')[1]) === (mesAnoAtual.getMonth() + 1) && parseInt(receita.data.split('/')[2]) === mesAnoAtual.getFullYear() ? (

                                        <tr key={index} className='hover:bg-white/5 transition-colors duration-150 group'>
                                            <td className='px-6 py-4 text-white/50'>{receita.data}</td>
                                            <td className='px-6 py-4 text-white font-medium'>{receita.descricao}</td>

                                            <td className='px-6 py-4 text-right text-green-400 font-semibold'>
                                                R$ {parseFloat(receita.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className='px-6 py-4 text-center'>
                                                {receita.recorrencia ? (
                                                    <span className='text-blue-400 font-semibold'>Recorrente</span>
                                                ) : (
                                                    <span className='text-yellow-400 font-semibold'>Única</span>
                                                )}
                                            </td>

                                            <td className='px-6 py-4 text-center'>
                                                {receita.recebido ? (
                                                    <span className='text-green-400 font-semibold'>Recebido</span>
                                                ) : (
                                                    <span className='text-red-400 font-semibold'>Pendente</span>
                                                )}
                                            </td>
                                            <td className='px-6 py-4'>

                                                <div className='flex gap-2 justify-center'>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditing(true); editItem(receita.id, receita.descricao, receita.valor, receita.data, receita.recorrencia, receita.recebido) }}
                                                        className='px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30 transition-all duration-200'
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(receita.id)}
                                                        className='px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 transition-all duration-200'
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                    ) : null

                                ))}
                            </>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className='border-t border-white/10 bg-white/5'>
                            <td colSpan={2} className='px-6 py-4 text-white/40 text-xs uppercase tracking-wider'>Total</td>
                            <td className='px-6 py-4 text-right text-green-400 font-bold text-base'>
                                R$ {calculaTotalMes()}
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}

export default Receitas
import React, { useState } from 'react'
import ModalParcelamentos from './ModalParcelamentos'


const Cartoes = ({ listCartoes, httpConfig, loading, httpConfigBatch, httpConfigBatchDespesas }) => {
    const [idCartao, setIdCartao] = useState(null)
    const [nomeCartao, setNomeCartao] = useState('')
    const [limiteCartao, setLimiteCartao] = useState('')
    const [dataVencimentoCartao, setDataVencimentoCartao] = useState('')
    const [parcelaCartao, setParcelaCartao] = useState([])

    const [editing, setEditing] = useState(false)
    const [isModalPParcelamentoOpen, setIsModalParcelamentoOpen] = useState(false)
    const [cartaoSelecionado, setCartaoSelecionado] = useState(null)
    const [cartaoExpandido, setCartaoExpandido] = useState(null)
    const [modoEdicaoParcelamento, setModoEdicaoParcelamento] = useState(false)

    function clearFields() {
        setNomeCartao('')
        setLimiteCartao('')
        setDataVencimentoCartao('')
    }

    function editItem(id, nome, limite, dataVencimento) {
        setIdCartao(id)
        setNomeCartao(nome)
        setLimiteCartao(limite)
        setDataVencimentoCartao(dataVencimento)

    }


    const handleDelete = (id) => {
        httpConfig({ id }, 'DELETE')
    }

    const handleEditarParcelamentos = (cartao) => {
        // Abre o modal em modo de EDIÇÃO para editar todos os parcelamentos do cartão
        setCartaoSelecionado(cartao)
        setModoEdicaoParcelamento(true)
        setIsModalParcelamentoOpen(true)
    }

    const handleExcluirParcelamentos = (cartaoId, parcelaIndex) => {
        // Exclui APENAS o parcelamento no índice especificado
        const cartao = listCartoes.find(c => c.id === cartaoId)
        if (cartao) {
            const parcelamentosAtualizados = cartao.parcelamentos.filter((_, index) => index !== parcelaIndex)
            const cartaoAtualizado = {
                id: cartaoId,
                parcelamentos: parcelamentosAtualizados
            }
            httpConfig(cartaoAtualizado, 'PATCH')
        }
    }
    const handleSubmit = (event) => {
        event.preventDefault();
        if (editing == false) {
            const novoCartao = {
                nome: nomeCartao,
                limite: limiteCartao,
                dataVencimento: dataVencimentoCartao.split('-').reverse().join('/'),
                parcelamentos: parcelaCartao

            };
            httpConfig(novoCartao, 'POST');
            clearFields()
        } else {
            const editaCartao = {
                id: idCartao,
                nome: nomeCartao,
                limite: limiteCartao,
                dataVencimento: dataVencimentoCartao.split('-').reverse().join('/'),
            }
            console.log(editaCartao)
            httpConfig(editaCartao, 'PATCH');
            setEditing(false)
            clearFields()
        }




        // Lógica para enviar os dados do formulário
    };

    return (
        <div className='max-w-5xl wfull mx-auto mt-10 flex px-6 gap-8 flex-col items-center justify-center'>
            {isModalPParcelamentoOpen && cartaoSelecionado && (
              <ModalParcelamentos
                cartao={cartaoSelecionado}
                onClose={() => { 
                  setIsModalParcelamentoOpen(false)
                  setCartaoSelecionado(null)
                  setModoEdicaoParcelamento(false)
                }}
                httpConfig={httpConfig}
                modoEdicao={modoEdicaoParcelamento}
               
              />
            )}

            {/*Div de título*/}
            <div className='w-full flex items-center gap-3 '>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                </div>
                <h1 className='text-3xl font-bold text-white'>Cartões</h1>
                <span className='ml-auto text-sm text-white/40'>{listCartoes.length} {listCartoes.length !== 1 ? 'Cartões' : 'Cartão'}</span>
            </div>

            {/*Div de cartões*/}
            <div className='border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl w-full flex gap-8 p-6'>

                {/*Div De cadastro de cartões*/}
                <div className='flex flex-col gap-8'>
                    <div>
                        <h2 className='text-2xl font-bold text-white/50'>+ Cadastro de Cartões</h2>
                    </div>
                    <div className='r'>
                        <form className='flex gap-4' onSubmit={handleSubmit}>
                            <label className='flex flex-col gap-1'>
                                <span className='text-xs text-white/50 uppercase tracking-wider'>Nome do cartão</span>
                                <input required value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} placeholder='ex: Nubank' type="text" className='border-2 focus:border-blue-400 focus:outline-none border-white/20 bg-white/10 rounded-xl px-4 py-2.5 placeholder-white/30' />
                            </label>
                            <label className='flex flex-col gap-1'>
                                <span className='text-xs text-white/50 uppercase tracking-wider'>Limite</span>
                                <input required value={limiteCartao} onChange={(e) => setLimiteCartao(e.target.value)} placeholder='ex: R$ 5.000,00' type="number" className='border-2 focus:border-blue-400 focus:outline-none border-white/20 bg-white/10 rounded-xl px-4 py-2.5 placeholder-white/30' />
                            </label>
                            <label className='flex flex-col gap-1'>
                                <span className='text-xs text-white/50 uppercase tracking-wider'>Data de Vencimento</span>
                                <input required value={dataVencimentoCartao.split('/').reverse().join('-')} onChange={(e) => setDataVencimentoCartao(e.target.value)} type="date" className='border-2 focus:border-blue-400 focus:outline-none border-white/20 bg-white/10 rounded-xl px-4 py-2.5 text-white/80' />
                            </label>
                            <div className='flex items-end gap-3'>
                                {editing ? (


                                    loading ? (
                                        <div>

                                            <button type="button" class="inline-flex items-center text-body bg-neutral-primary-soft border border-default hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary-soft shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
                                                <svg aria-hidden="true" class="w-4 h-4 text-neutral-tertiary animate-spin fill-blue-500 me-2" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                </svg>
                                                Loading...
                                            </button>
                                            <button type="button" class="inline-flex items-center text-body bg-neutral-primary-soft border border-default hover:bg-neutral-secondary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary-soft shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
                                                <svg aria-hidden="true" class="w-4 h-4 text-neutral-tertiary animate-spin fill-brand me-2" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                </svg>
                                                Loading...
                                            </button>
                                        </div>

                                    ) : (
                                        <div>

                                            <button type="submit" className='h-fit px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(43,127,255,0.5)] active:scale-95'>Salvar</button>
                                            <button type="button" className='h-fit px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-red-600 hover:bg-red-500 hover:shadow-[0_0_15px_rgba(255,43,43,0.5)] active:scale-95' onClick={() => { setEditing(false); clearFields(); }}>Cancelar</button>
                                        </div>
                                    )


                                ) : (
                                    loading ? (<button type="button" className="flex flex-row h-fit px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(43,127,255,0.5)] active:scale-95">
                                        <svg aria-hidden="true" className="flex w-4 h-4 text-neutral-tertiary animate-spin fill-blue-500 me-2" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>

                                    </button>) : (
                                        <button type="submit" className='h-fit px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(43,127,255,0.5)] active:scale-95'>Adicionar</button>
                                    ))}
                            </div>



                        </form>

                    </div>
                </div>

            </div>

            {/*Div de listagem de cartões*/}
            <div className='w-full  flex justify-center items-center border rounded-2xl border-white/20 bg-white/5 '>
                <table className='w-full'>
                    <thead className='border-b border-white/10 '>
                        <tr className='font-medium text-xs text-white/50 uppercase tracking-wider'>
                            <th className='text-left px-6 py-4 font-medium'>Nome do Cartao</th>
                            <th className='text-left px-6 py-4 font-medium'>Limite</th>
                            <th className='text-center px-6 py-4 font-medium'>Data de Vencimento</th>
                            <th className='text-center px-6 py-4 font-medium'>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="text-center py-4">
                                    <div role="status" className="w-full flex items-center justify-center">
                                        <svg aria-hidden="true" className="w-8 h-8 text-neutral-tertiary animate-spin fill-blue-500" viewBox="0 0 100 101" fill="currentFill" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                        </svg>

                                    </div>
                                </td>
                            </tr>
                        ) : (
                            // ====== LISTAGEM DE CARTÕES ======
                            // Mapeia o array listCartoes e cria uma linha da tabela para cada cartão
                            listCartoes.map((cartao, index) => (
                                // React.Fragment evita criar uma div extra no DOM, mantendo apenas as linhas da tabela
                                <React.Fragment key={`cartao-${cartao.id}`}>
                                    {/* ===== LINHA DA TABELA ===== */}
                                    <tr className='text-center border-b border-white/10 hover:bg-white/5'>
                                        
                                        {/* COLUNA 1: Nome do Cartão */}
                                        <td className='text-lg text-left px-6 py-4 text-white/80'>{cartao.nome}</td>
                                        
                                        {/* COLUNA 2: Limite do Cartão */}
                                        {/* parseFloat() converte string para número */}
                                        {/* toLocaleString() formata para moeda brasileira (R$ 5.000,00) */}
                                        <td className='text-left px-6 py-4 font-semibold'>{parseFloat(cartao.limite).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        
                                        {/* COLUNA 3: Data de Vencimento */}
                                        <td className='text-center px-6 py-4 text-white/50'>{cartao.dataVencimento}</td>
                                        
                                        {/* COLUNA 4: Ações (Botões) */}
                                        <td className='flex gap-2 items-center justify-center p-3'>
                                            
                                            {/* BOTÃO 1: Detalhes (Ver parcelamentos) */}
                                            <button 
                                                onClick={() => setCartaoExpandido(cartaoExpandido === cartao.id ? null : cartao.id)}
                                                title='Ver Detalhes dos Parcelamentos' 
                                                className='px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 border border-purple-500/30 transition-all duration-200'
                                            >
                                                {cartaoExpandido === cartao.id ? 'Fechar' : 'Detalhes'}
                                            </button>
                                            
                                            {/* BOTÃO 2: Adicionar Parcelamento */}
                                            {/* Quando clicado:
                                                1. Define o cartão clicado como cartaoSelecionado
                                                2. Abre o modal de parcelamentos
                                            */}
                                            <button 
                                                onClick={() => { setCartaoSelecionado(cartao); setIsModalParcelamentoOpen(true) }} 
                                                title='Incluir Parcelamento' 
                                                className='px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/40 border border-green-500/30 transition-all duration-200'
                                            >
                                                +
                                            </button>
                                            
                                            {/* BOTÃO 3: Editar Cartão */}
                                            {/* Quando clicado:
                                                1. Ativa o modo de edição (setEditing(true))
                                                2. Carrega os dados do cartão nos campos do formulário
                                            */}
                                            <button
                                                type="button"
                                                onClick={() => { setEditing(true); editItem(cartao.id, cartao.nome, cartao.limite, cartao.dataVencimento) }}
                                                className='px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30 transition-all duration-200'
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(cartao.id)}
                                                className='px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 transition-all duration-200'
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>

                                    {/* ===== LINHAS EXPANDIDAS - DETALHES DOS PARCELAMENTOS ===== */}
                                    {cartaoExpandido === cartao.id && cartao.parcelamentos && cartao.parcelamentos.length > 0 && (
                                      cartao.parcelamentos.map((parcela, parcelaIndex) => (
                                        <tr key={`parcela-${cartao.id}-${parcelaIndex}`} className='bg-purple-500/5 hover:bg-purple-500/10 border-l-4 border-purple-500'>
                                          <td colSpan="4" className='p-6'>
                                            <div className='flex items-center justify-between gap-4 bg-purple-500/10 p-4 rounded-lg'>
                                              <div className='flex-1'>
                                                <p className='font-semibold text-white'>{parcela.descricao}</p>
                                                <p className='text-xs text-white/50 mt-1'>
                                                  Total: {parcela.numeroParcelas} parcelas | 
                                                  Valor: R$ {parseFloat(parcela.valorParcela).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
                                                  Início: {parcela.dataInicio} | 
                                                  Pagas: <span className='text-green-400'>{(parcela.parcelas || []).filter(p => p.pago).length}</span>/{parcela.numeroParcelas}
                                                </p>
                                              </div>
                                              <div className='flex gap-2'>
                                                <button
                                                  type="button"
                                                  onClick={() => handleEditarParcelamentos(cartao)}
                                                  className='px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30 transition-all duration-200'
                                                >
                                                  Editar Tudo
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleExcluirParcelamentos(cartao.id, parcelaIndex)}
                                                  className='px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 transition-all duration-200'
                                                >
                                                  Excluir
                                                </button>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                    {cartaoExpandido === cartao.id && (!cartao.parcelamentos || cartao.parcelamentos.length === 0) && (
                                      <tr className='bg-purple-500/5 border-l-4 border-purple-500'>
                                        <td colSpan="4" className='p-6 text-center text-white/50'>
                                          Nenhum parcelamento cadastrado
                                        </td>
                                      </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}

                    </tbody>
                    <tfoot className='bg-white/5'>
                        <tr>
                            <td className='p-5 '></td>
                            <td></td>
                            <td></td>
                            <td></td>


                        </tr>

                    </tfoot>

                </table>

            </div>

            {/*Div de parcelas*/}
            <div>

                {/*Div cadastro de parcelas*/}
                <div>

                </div>
                {/*Div listagem de parcelas*/}
                <div>

                </div>
            </div>

        </div>
    )
}

export default Cartoes
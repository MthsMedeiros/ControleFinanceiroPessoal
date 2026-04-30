import React from 'react'
import { useState, useEffect, useRef } from 'react'

import { UseFetch } from '../hooks/UseFetch'


const Cartoes = ({ listCartoes, httpConfig }) => {
    const [idCartao, setIdCartao] = useState(null)
    const [nomeCartao, setNomeCartao] = useState('')
    const [limiteCartao, setLimiteCartao] = useState('')
    const [dataVencimentoCartao, setDataVencimentoCartao] = useState('')
    const [parcelaCartao, setParcelaCartao] = useState([])

    const [editing, setEditing] = useState(false)

    function editItem(id, nome, limite, dataVencimento) {
        setIdCartao(id)
        setNomeCartao(nome)
        setLimiteCartao(limite)  
        setDataVencimentoCartao(dataVencimento)

    }


    const handleDelete = (id) => {
        httpConfig({ id }, 'DELETE')
    }
    const handleSubmit = (event) => {
        event.preventDefault();
        if (editing== false) {
            const novoCartao = {
                nome: nomeCartao,
                limite: limiteCartao,
                dataVencimento: dataVencimentoCartao.split('-').reverse().join('/'),
                parcelamentos: parcelaCartao

            };
            httpConfig(novoCartao, 'POST');
        }else{
            const editaCartao = {
                id: idCartao,
                nome: nomeCartao,
                limite: limiteCartao,
                dataVencimento: dataVencimentoCartao.split('-').reverse().join('/'),
            }
            console.log(editaCartao)
            httpConfig(editaCartao, 'PATCH');
            setEditing(false)
        }




        // Lógica para enviar os dados do formulário
    };

    return (
        <div className='max-w-5xl wfull mx-auto mt-10 flex px-6 gap-8 flex-col items-center justify-center'>
            {/*Div de título*/}
            <div className='w-full flex items-center gap-3 '>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                </div>
                <h1 className='text-3xl font-bold text-white'>Cartões</h1>
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
                                <input required value={nomeCartao} onChange={(e) => setNomeCartao(e.target.value)} placeholder='ex: Nubank' type="text" className='border-2 focus:border-blue-400 focus:outline-none border-white/20 bg-white/10 rounded-xl px-4 py-2.5 placeholder-white/30' text-white />
                            </label>
                            <label className='flex flex-col gap-1'>
                                <span className='text-xs text-white/50 uppercase tracking-wider'>Limite</span>
                                <input required value={limiteCartao} onChange={(e) => setLimiteCartao(e.target.value)} placeholder='ex: R$ 5.000,00' type="number" className='border-2 focus:border-blue-400 focus:outline-none border-white/20 bg-white/10 rounded-xl px-4 py-2.5 placeholder-white/30' text-white />
                            </label>
                            <label className='flex flex-col gap-1'>
                                <span className='text-xs text-white/50 uppercase tracking-wider'>Data de Vencimento</span>
                                <input required value={dataVencimentoCartao.split('/').reverse().join('-')} onChange={(e) => setDataVencimentoCartao(e.target.value)} type="date" className='border-2 focus:border-blue-400 focus:outline-none border-white/20 bg-white/10 rounded-xl px-4 py-2.5 text-white/80' text-white />
                            </label>
                            <div className='flex items-end'>

                                <button type="submit" className='h-fit px-6 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(43,127,255,0.5)] active:scale-95'>Adicionar</button>
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
                        {listCartoes.map((cartao, index) => (
                            <tr className='text-center border-b border-white/10 hover:bg-white/5' key={index}>
                                <td className='text-lg text-left px-6 py-4 text-white/80'>{cartao.nome}</td>
                                <td className='text-left px-6 py-4 font-semibold'>{parseFloat(cartao.limite).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className='text-center px-6 py-4 text-white/50'>{cartao.dataVencimento}</td>
                                <td className='flex gap-2 items-center justify-center p-3'>
                                    <button title='Incluir Parcelamento' className='px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/40 border border-green-500/30 transition-all duration-200'>+</button>
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
                        ))}

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
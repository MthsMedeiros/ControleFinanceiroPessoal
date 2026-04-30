import React, { useState, useRef, useEffect } from 'react'

const nomeMesesCompletos = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
import { Pie } from 'react-chartjs-2'
import { Doughnut } from 'react-chartjs-2'


import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const Dashboard = ({ listDespesas, listReceitas }) => {
  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual)
  const [mountId] = useState(() => Date.now()) // único por montagem do Dashboard
  const refMes = useRef(null)


  const filtrarPorMes = (lista) => {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    return lista.filter(item => {
      if (!item.data || item.data === '--Sem data definida--') return false
      const [, m, y] = item.data.split('/')
      return parseInt(m) === mes && parseInt(y) === ano
    })
  }

  const receitasFiltradas = filtrarPorMes(listReceitas)
  const despesasFiltradas = filtrarPorMes(listDespesas)
  const totalReceitas = receitasFiltradas.reduce((acc, receita) => acc + parseFloat(receita.valor), 0)
  const totalDespesas = despesasFiltradas.reduce((acc, despesa) => acc + parseFloat(despesa.valor), 0)

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));

    return `#${[f(0), f(8), f(4)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  function gerarCores(quantidade, tom) {
    const cores = [];

    for (let i = 0; i < quantidade; i++) {
      let hue;

      if (tom === 'vermelho') {
        hue = Math.random() * 20; // faixa do vermelho
      } else if (tom === 'azul') {
        hue = 220 + Math.random() * 40; // faixa do azul
      } else {
        throw new Error('Tom deve ser "vermelho" ou "azul"');
      }

      const saturation = 70 + Math.random() * 30;
      const lightness = 45 + Math.random() * 15;

      cores.push(hslToHex(hue, saturation, lightness));
    }

    return cores;
  }
  // Agrupar por mês
  const agruparPorMes = (lista) => {
    const meses = {}
    lista.forEach(item => {
      const mes = item.data.split('/')[1] // extrai MM de DD/MM/YYYY
      if (!meses[mes]) meses[mes] = 0
      meses[mes] += parseFloat(item.valor)
    })
    return meses
  }

  const mesesReceitas = agruparPorMes(listReceitas)
  const mesesDespesas = agruparPorMes(listDespesas)

  // Pegar todos os meses únicos e ordenar
  const todosMeses = [...new Set([...Object.keys(mesesReceitas), ...Object.keys(mesesDespesas)])].sort()
  const nomeMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']


  const receitas = receitasFiltradas.map(receita => receita.descricao)
  const receitasXDespesas = {
    labels: ['Receitas', 'Despesas'],
    datasets: [
      {
        data: [totalReceitas, totalDespesas],
        backgroundColor: ['#2b7fff', '#ff0000'],
        borderColor: ['#00aa00', '#aa0000'],
        borderWidth: 1
      }
    ]
  }

  const doughnutReceitas = {
    labels: receitas,
    datasets: [
      {
        data: receitasFiltradas.map(receita => parseFloat(receita.valor)),
        backgroundColor: gerarCores(receitasFiltradas.length, 'azul'),
        borderColor: gerarCores(receitasFiltradas.length, 'azul'),
        borderWidth: 1
      }
    ]
  }

  const doughnutDespesas = {
    labels: despesasFiltradas.map(despesa => despesa.descricao),
    datasets: [
      {
        data: despesasFiltradas.map(despesa => parseFloat(despesa.valor)),
        backgroundColor: gerarCores(despesasFiltradas.length, 'vermelho'),
        borderColor: gerarCores(despesasFiltradas.length, 'vermelho'),
        borderWidth: 1
      }
    ]
  }

  const barrasComparativo = {
    labels: todosMeses.map(mes => nomeMeses[parseInt(mes) - 1]),
    datasets: [
      {
        label: 'Receitas',
        data: todosMeses.map(mes => mesesReceitas[mes] || 0),
        backgroundColor: '#2b7fff',
        borderColor: '#2b7fff',
        borderWidth: 1
      },
      {
        label: 'Despesas',
        data: todosMeses.map(mes => mesesDespesas[mes] || 0),
        backgroundColor: '#ff0000',
        borderColor: '#ff0000',
        borderWidth: 1
      }
    ]
  }

  return (
    <div className='mt-10 grid grid-cols-3 grid-rows-[auto,1fr,1fr] gap-20 items-center  justify-between'>
      <div className='col-span-3 flex flex-row items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 transition-all duration-300'>
        <span className='text-lg font-semibold text-white/70 tracking-wide'>Mês:</span>

        {/* Setas de navegação */}
        <button
          onClick={() => {
            const [y, m] = mesSelecionado.split('-').map(Number)
            const prev = new Date(y, m - 2)
            setMesSelecionado(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`)
          }}
          className='flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500/30 border border-white/20 hover:border-blue-400 text-white/60 hover:text-white transition-all duration-200'
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
          </svg>


        </button>

        {/* Campo mês */}
        <div
          onClick={() => refMes.current.showPicker()}
          className='group relative flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-blue-400 rounded-xl px-5 py-3 cursor-pointer transition-all duration-300 hover:shadow-[0_0_15px_rgba(43,127,255,0.4)] min-w-44 justify-center'
        >
          <svg className='w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
          </svg>
          <span className='text-sm text-white font-semibold'>
            {nomeMesesCompletos[parseInt(mesSelecionado.split('-')[1]) - 1]} {mesSelecionado.split('-')[0]}
          </span>
          <input
            ref={refMes}
            type='month'
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className='absolute inset-0 opacity-0 cursor-pointer w-full'
          />
        </div>

        <button
          onClick={() => {
            const [y, m] = mesSelecionado.split('-').map(Number)
            const next = new Date(y, m)
            setMesSelecionado(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`)
          }}
          className='flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500/30 border border-white/20 hover:border-blue-400 text-white/60 hover:text-white transition-all duration-200'
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
          </svg>

        </button>

        {/* Botão voltar ao mês atual */}
        {mesSelecionado !== mesAtual && (
          <button
            onClick={() => setMesSelecionado(mesAtual)}
            className='flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/10'
          >
            Hoje
          </button>
        )}
      </div>
      <div id="receita-x-despesas" className=' border-white w-full h-120 flex flex-col items-center justify-center'>
        <h1 className='text-center text-3xl  p-2'>Receita x Despesas</h1>
        <Pie key={`pie-${mountId}`} data={receitasXDespesas} options={{ animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false }} />
      </div>
      <div id="receitas" className=' border-white w-full h-120 flex flex-col items-center justify-center'>
        <h1 className='text-center text-3xl  p-2'>Receitas</h1>
        <Doughnut key={`doughnut-r-${mountId}`} data={doughnutReceitas} options={{ animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false }} />
      </div>
      <div id="despesas" className=' border-white w-full h-120 flex flex-col items-center justify-center'>
        <h1 className='text-center text-3xl  p-2'>Despesas</h1>
        <Doughnut key={`doughnut-d-${mountId}`} data={doughnutDespesas} options={{ animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false }} />
      </div>
      <div className=' border-white w-full h-120 flex flex-col items-center justify-center'>
        <h1 className='text-center text-3xl p-2'>Receitas vs Despesas por Mês</h1>
        <Bar key={`bar-${mountId}`} data={barrasComparativo} options={{
          animation: { duration: 1000 },
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } }
        }} />
      </div>

    </div>
  )
}

export default Dashboard
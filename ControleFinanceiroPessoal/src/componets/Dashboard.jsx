import { useState, useRef } from 'react'

const nomeMesesCompletos = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
import { Pie } from 'react-chartjs-2'
import { Doughnut } from 'react-chartjs-2'
import { Bar } from 'react-chartjs-2'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler)

const Dashboard = ({ listDespesas, listReceitas, listCartoes = [] }) => {
  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual)
  const [mountId] = useState(() => Date.now()) // único por montagem do Dashboard
  const refMes = useRef(null)

  const [hoveredAlert, setHoveredAlert] = useState(null)




  const filtrarPorMes = (lista) => {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    return lista.filter(item => {
      if (!item.data || !item.data.includes('/')) return false
      const [, m, y] = item.data.split('/')
      return parseInt(m) === mes && parseInt(y) === ano
    })
  }

  // Extrai parcelas dos cartões ativas no mês selecionado com status de pagamento correto
  const filtrarParcelasPorMes = () => {
    const [ano, mes] = mesSelecionado.split('-').map(Number)
    const result = []
    listCartoes.forEach(cartao => {
      if (cartao.parcelamentos && Array.isArray(cartao.parcelamentos)) {
        cartao.parcelamentos.forEach(parcelamento => {
          if (parcelamento.dataInicio && parcelamento.dataInicio.includes('/')) {
            const [, mesI, anoI] = parcelamento.dataInicio.split('/').map(Number)
            const diffMonths = (ano - anoI) * 12 + (mes - mesI)
            const numero = diffMonths + 1
            if (numero >= 1 && numero <= parcelamento.numeroParcelas) {
              const parcelaObj = (parcelamento.parcelas || []).find(p => p.numero === numero)
              result.push({
                descricao: parcelamento.descricao,
                numeroParcelas: parcelamento.numeroParcelas,
                valorParcela: parcelamento.valorParcela,
                numero,
                pago: parcelaObj?.pago === true
              })
            }
          }
        })
      }
    })
    return result
  }

  const parcelasFiltradas = filtrarParcelasPorMes()

  // ===== CÁLCULOS DO MÊS SELECIONADO =====
  // Filtra receitas e despesas apenas do mês selecionado
  const receitasFiltradas = filtrarPorMes(listReceitas)
  const despesasFiltradas = filtrarPorMes(listDespesas)

  // Soma todos os valores de receita do mês selecionado
  const totalReceitas = receitasFiltradas.reduce((acc, receita) => acc + parseFloat(receita.valor), 0)
  // Soma apenas receitas recebidas do mês selecionado
  const totalReceitasRecebidas = receitasFiltradas.filter(r => r.recebido).reduce((acc, r) => acc + parseFloat(r.valor), 0)

  // Soma todos os valores de despesa do mês selecionado (despesas + parcelas dos cartões)
  const totalDespesasEmDespesas = despesasFiltradas.reduce((acc, despesa) => acc + parseFloat(despesa.valor), 0)
  const totalDespesasEmParcelas = parcelasFiltradas.reduce((acc, parcela) => acc + parseFloat(parcela.valorParcela || 0), 0)
  const totalDespesas = totalDespesasEmDespesas + totalDespesasEmParcelas

  // Soma apenas despesas pagas do mês selecionado (despesas pagas + parcelas pagas)
  const totalDespesasPagasEmDespesas = despesasFiltradas.filter(d => d.pago).reduce((acc, d) => acc + parseFloat(d.valor), 0)
  const totalDespesasPagasEmParcelas = parcelasFiltradas.filter(p => p.pago === true).reduce((acc, p) => acc + parseFloat(p.valorParcela || 0), 0)
  const totalDespesasPagas = totalDespesasPagasEmDespesas + totalDespesasPagasEmParcelas

  function maturityDateReceitas(list) {
    return list.some(receita => {
      let [dd, mm, yyyy] = receita.data.split('/').map(Number)
      let dataReceita = new Date(yyyy, mm - 1, dd)
      dataReceita.setHours(0, 0, 0, 0) // Zera horas para comparar apenas data

      let dataAtual = new Date()
      dataAtual.setHours(0, 0, 0, 0) // Zera horas para comparar apenas data

      return dataReceita < dataAtual && receita.recebido === false

    })
  }

  function maturityDateDespesas(list) {
    return list.some(despesa => {
      let [dd, mm, yyyy] = despesa.data.split('/').map(Number)
      let dataDespesa = new Date(yyyy, mm - 1, dd)
      dataDespesa.setHours(0, 0, 0, 0)

      let dataAtual = new Date()
      dataAtual.setHours(0, 0, 0, 0)

      return dataDespesa < dataAtual && despesa.pago === false

    })
  }

  // Meses com receitas atrasadas FORA do mês selecionado
  const mesesAtrasadosReceitas = (() => {
    const [anoSel2, mesSel2] = mesSelecionado.split('-').map(Number)
    const hoje2 = new Date(); hoje2.setHours(0,0,0,0)
    const mesesMap = {}
    listReceitas.forEach(r => {
      if (!r.data || !r.data.includes('/') || r.recebido) return
      const [dd, mm, yyyy] = r.data.split('/').map(Number)
      if (yyyy === anoSel2 && mm === mesSel2) return // ignora o mês atual
      const dataItem = new Date(yyyy, mm - 1, dd); dataItem.setHours(0,0,0,0)
      if (dataItem < hoje2) {
        const chave = `${String(mm).padStart(2,'0')}/${yyyy}`
        mesesMap[chave] = true
      }
    })
    return Object.keys(mesesMap).sort().map(chave => {
      const [mm, yyyy] = chave.split('/')
      return `${nomeMesesCompletos[parseInt(mm)-1]} ${yyyy}`
    })
  })()

  // Meses com despesas atrasadas FORA do mês selecionado
  const mesesAtrasadosDespesas = (() => {
    const [anoSel2, mesSel2] = mesSelecionado.split('-').map(Number)
    const hoje2 = new Date(); hoje2.setHours(0,0,0,0)
    const mesesMap = {}
    listDespesas.forEach(d => {
      if (!d.data || !d.data.includes('/') || d.pago) return
      const [dd, mm, yyyy] = d.data.split('/').map(Number)
      if (yyyy === anoSel2 && mm === mesSel2) return // ignora o mês atual
      const dataItem = new Date(yyyy, mm - 1, dd); dataItem.setHours(0,0,0,0)
      if (dataItem < hoje2) {
        const chave = `${String(mm).padStart(2,'0')}/${yyyy}`
        mesesMap[chave] = true
      }
    })
    return Object.keys(mesesMap).sort().map(chave => {
      const [mm, yyyy] = chave.split('/')
      return `${nomeMesesCompletos[parseInt(mm)-1]} ${yyyy}`
    })
  })()

  // ===== GERADOR DE CORES PARA GRÁFICOS =====
  // Função que distribui cores da paleta de forma cíclica
  // Se houver mais itens que cores, ela volta do início (por isso o %)
  function gerarCores(quantidade) {
    const paleta = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#84cc16',
      '#e11d48', '#0ea5e9', '#a855f7', '#22c55e', '#eab308',
      '#ef4444', '#d946ef', '#2dd4bf', '#fb923c', '#4ade80',
    ]
    const cores = []
    for (let i = 0; i < quantidade; i++) {
      cores.push(paleta[i % paleta.length]) // % garante que volta do início se precisar
    }
    return cores
  }
  // ===== AGRUPAMENTO DE DADOS POR MÊS =====
  // Agrupa receitas/despesas por mês para visualização geral
  // Cria um objeto onde a chave é o mês (MM) e o valor é a soma do mês
  const agruparPorMes = (lista) => {
    const meses = {} // Ex: { "01": 1000, "02": 800, ... }
    lista.forEach(item => {
      if (!item.data || !item.data.includes('/')) return // ignora datas inválidas
      const mes = item.data.split('/')[1] // Extrai MM de DD/MM/YYYY
      if (!meses[mes]) meses[mes] = 0 // Se mês não existe, cria com valor 0
      meses[mes] += parseFloat(item.valor) // Soma o valor ao mês
    })
    return meses
  }

  // Agrupa receitas e despesas por mês para toda a história de dados
  const mesesReceitas = agruparPorMes(listReceitas)
  const mesesDespesas = agruparPorMes(listDespesas)

  // Agrupa parcelas dos cartões por mês (espalhando valorParcela por todos os meses ativos)
  const mesesParcelas = {}
  listCartoes.forEach(cartao => {
    if (cartao.parcelamentos && Array.isArray(cartao.parcelamentos)) {
      cartao.parcelamentos.forEach(parcelamento => {
        if (parcelamento.dataInicio && parcelamento.dataInicio.includes('/')) {
          const [, mesI, anoI] = parcelamento.dataInicio.split('/').map(Number)
          for (let i = 0; i < parcelamento.numeroParcelas; i++) {
            const d = new Date(anoI, mesI - 1 + i, 1)
            const mes = String(d.getMonth() + 1).padStart(2, '0')
            mesesParcelas[mes] = (mesesParcelas[mes] || 0) + parseFloat(parcelamento.valorParcela || 0)
          }
        }
      })
    }
  })

  // Combina despesas com parcelas dos cartões por mês
  const mesesDespesasTotal = {}
  Object.keys(mesesDespesas).forEach(mes => {
    mesesDespesasTotal[mes] = (mesesDespesasTotal[mes] || 0) + mesesDespesas[mes]
  })
  Object.keys(mesesParcelas).forEach(mes => {
    mesesDespesasTotal[mes] = (mesesDespesasTotal[mes] || 0) + mesesParcelas[mes]
  })

  // Pega todos os meses únicos entre receitas e despesas, remove duplicatas com Set, e ordena
  // Exemplo: ["01", "02", "03", "04", ...] em ordem crescente
  const todosMeses = [...new Set([...Object.keys(mesesReceitas), ...Object.keys(mesesDespesasTotal)])].sort()
  const nomeMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']


  // ===== SALDO ACUMULADO ATÉ O MÊS SELECIONADO =====
  // Extrai o ano e mês selecionado do formato "YYYY-MM"
  // map(Number) converte strings em números: "2026" → 2026
  const [anoSel, mesSel] = mesSelecionado.split('-').map(Number)

  // Soma TODAS as receitas de meses ANTERIORES + o mês selecionado
  // filter() seleciona apenas receitas que atendem a condição:
  //   - yyyy < anoSel: todos os anos anteriores
  //   - OU: yyyy === anoSel && mm <= mesSel: mesmo ano E mês até o selecionado
  // Exemplo: Se selecionou abril/2026, pega JAN, FEV, MAR, ABRIL de 2026 (e qualquer coisa de 2025)
  const totalReceitasAcumulado = listReceitas
    .filter(r => {
      const partes = r.data.split('/') // "01/04/2026" → ["01", "04", "2026"]
      const mm = parseInt(partes[1]) // Extrai mês (índice 1)
      const yyyy = parseInt(partes[2]) // Extrai ano (índice 2)
      return yyyy < anoSel || (yyyy === anoSel && mm <= mesSel) // Condição de filtro
    })
    // reduce() soma todos os valores filtrados em uma única variável
    // acc: acumulador (começa em 0)
    // r: item atual sendo processado
    .reduce((acc, r) => {
      if (r.recebido) {
        return acc + parseFloat(r.valor)
      }
      return acc
    }, 0)

  // Mesma lógica que acima, mas para despesas (incluindo parcelas dos cartões)
  const totalDespesasAcumuladoDespesas = listDespesas
    .filter(d => {
      const partes = d.data.split('/')
      const mm = parseInt(partes[1])
      const yyyy = parseInt(partes[2])
      return yyyy < anoSel || (yyyy === anoSel && mm <= mesSel)
    })
    .reduce((acc, d) => {
      if (d.pago) {
        return acc + parseFloat(d.valor)
      }
      return acc
    }, 0)

  // Soma parcelas pagas acumuladas até o mês selecionado (usando array de parcelas)
  const totalDespesasAcumuladoParcelas = listCartoes.reduce((acc, cartao) => {
    if (cartao.parcelamentos && Array.isArray(cartao.parcelamentos)) {
      cartao.parcelamentos.forEach(parcelamento => {
        if (!parcelamento.dataInicio || !parcelamento.dataInicio.includes('/')) return
        const [, mesI, anoI] = parcelamento.dataInicio.split('/').map(Number)
        ;(parcelamento.parcelas || []).forEach(p => {
          if (p.pago !== true) return
          // Calcula o mês/ano desta parcela individual
          const d = new Date(anoI, mesI - 1 + (p.numero - 1), 1)
          const mm = d.getMonth() + 1
          const yyyy = d.getFullYear()
          if (yyyy < anoSel || (yyyy === anoSel && mm <= mesSel)) {
            acc += parseFloat(parcelamento.valorParcela || 0)
          }
        })
      })
    }
    return acc
  }, 0)

  const totalDespesasAcumulado = totalDespesasAcumuladoDespesas + totalDespesasAcumuladoParcelas

  // Calcula o saldo acumulado subtraindo despesas de receitas
  const saldoAcumuladoAteMes = totalReceitasAcumulado - totalDespesasAcumulado

  // ===== SALDO ACUMULADO MENSAL PARA GRÁFICO =====
  // Calcula o saldo acumulado MÊS A MÊS para visualizar a evolução
  // Cada ponto do gráfico mostra o saldo total até aquele mês
  const saldoAcumulado = todosMeses.reduce((acc, mes) => {
    const ultimo = acc.length > 0 ? acc[acc.length - 1] : 0 // Pega o último valor acumulado
    // Adiciona o saldo do mês atual ao saldo anterior
    return [...acc, ultimo + (mesesReceitas[mes] || 0) - (mesesDespesasTotal[mes] || 0)]
  }, [])

  const linhaSaldoAcumulado = {
    labels: todosMeses.map(mes => nomeMeses[parseInt(mes) - 1]),
    datasets: [
      {
        label: 'Saldo acumulado',
        data: saldoAcumulado,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.15)',
        pointBackgroundColor: saldoAcumulado.map(v => v >= 0 ? '#10b981' : '#ef4444'),
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }
    ]
  }

  // Ranking maiores despesas do mês (incluindo parcelas dos cartões)
  const todasDespesasComParcelas = [
    ...despesasFiltradas.map(d => ({ ...d, tipo: 'despesa' })),
    ...parcelasFiltradas.map(p => ({
      descricao: `${p.descricao} (Parcela ${p.numero}/${p.numeroParcelas})`,
      valor: p.valorParcela,
      tipo: 'parcela'
    }))
  ]

  const topDespesas = [...todasDespesasComParcelas]
    .sort((a, b) => parseFloat(b.valor) - parseFloat(a.valor))
    .slice(0, 7)

  const barrasTopDespesas = {
    labels: topDespesas.map(d => d.descricao),
    datasets: [
      {
        label: 'Valor (R$)',
        data: topDespesas.map(d => parseFloat(d.valor)),
        backgroundColor: gerarCores(topDespesas.length),
        borderRadius: 6,
      }
    ]
  }

  const barrasHorizontaisOptions = {
    indexAxis: 'y',
    animation: { duration: 1000 },
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.5)', callback: v => `R$ ${v.toLocaleString('pt-BR')}` }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  }

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
        backgroundColor: gerarCores(receitasFiltradas.length),
        borderColor: gerarCores(receitasFiltradas.length),
        borderWidth: 1
      }
    ]
  }

  const doughnutDespesas = {
    labels: todasDespesasComParcelas.map(d => d.descricao),
    datasets: [
      {
        data: todasDespesasComParcelas.map(d => parseFloat(d.valor)),
        backgroundColor: gerarCores(todasDespesasComParcelas.length),
        borderColor: gerarCores(todasDespesasComParcelas.length),
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
        data: todosMeses.map(mes => mesesDespesasTotal[mes] || 0),
        backgroundColor: '#ff0000',
        borderColor: '#ff0000',
        borderWidth: 1
      }
    ]
  }

  const linhaReceitas = {
    labels: todosMeses.map(mes => nomeMeses[parseInt(mes) - 1]),
    datasets: [
      {
        label: 'Receitas',
        data: todosMeses.map(mes => mesesReceitas[mes] || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        pointBackgroundColor: '#3b82f6',
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }
    ]
  }

  const linhaDespesas = {
    labels: todosMeses.map(mes => nomeMeses[parseInt(mes) - 1]),
    datasets: [
      {
        label: 'Despesas',
        data: todosMeses.map(mes => mesesDespesasTotal[mes] || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        pointBackgroundColor: '#ef4444',
        pointRadius: 5,
        tension: 0.4,
        fill: true,
      }
    ]
  }

  const lineOptions = {
    animation: { duration: 1000 },
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.5)' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.5)' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  }

  return (
    <div className='mt-10 flex flex-col gap-6 px-6 max-w-7xl mx-auto w-full pb-10'>

      {/* Cards de resumo */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6'>
          <div className='flex justify-between'>
            <p className='text-xs font-semibold text-white/40 uppercase tracking-widest mb-1'>Receitas do mês</p>

            <div className='flex items-center gap-2'>
              {mesesAtrasadosReceitas.length > 0 && (
                <div className='relative'>
                  <svg
                    onMouseEnter={() => setHoveredAlert('alertOutrosMesesReceitas')}
                    onMouseLeave={() => setHoveredAlert(null)}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" className="size-6 cursor-pointer"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {hoveredAlert === 'alertOutrosMesesReceitas' && (
                    <div className='absolute z-10 right-0 top-8 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap border border-white/10'>
                      <p className='text-red-400 font-semibold mb-1'>Receitas atrasadas em:</p>
                      {mesesAtrasadosReceitas.map(mes => <p key={mes}>{mes}</p>)}
                    </div>
                  )}
                </div>
              )}
              {maturityDateReceitas(receitasFiltradas) && (
                <div className='relative'>
                  <svg
                    onMouseEnter={() => setHoveredAlert("alertMaturityReceitas")}
                    onMouseLeave={() => setHoveredAlert(null)}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="yellow" className="size-6 cursor-pointer"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {hoveredAlert === "alertMaturityReceitas" && (
                    <div className='absolute z-10 right-0 top-8 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap border border-white/10'>
                      Existem Receitas Atrasadas esse Mês
                    </div>
                  )}
                </div>)
              }
            </div>
          </div>
          <p className='text-3xl font-bold text-blue-400'>R$ {totalReceitasRecebidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className='text-xs text-white/30 mt-1'>{receitasFiltradas.filter(r => r.recebido).length} de {receitasFiltradas.length} recebido{receitasFiltradas.filter(r => r.recebido).length !== 1 ? 's' : ''}</p>
        </div>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6'>
          <div className='flex justify-between'>
            <p className='text-xs font-semibold text-white/40 uppercase tracking-widest mb-1'>Despesas do mês</p>

            <div className='flex items-center gap-2'>
              {mesesAtrasadosDespesas.length > 0 && (
                <div className='relative'>
                  <svg
                    onMouseEnter={() => setHoveredAlert('alertOutrosMesesDespesas')}
                    onMouseLeave={() => setHoveredAlert(null)}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="red" className="size-6 cursor-pointer"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {hoveredAlert === 'alertOutrosMesesDespesas' && (
                    <div className='absolute z-10 right-0 top-8 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap border border-white/10'>
                      <p className='text-red-400 font-semibold mb-1'>Despesas atrasadas em:</p>
                      {mesesAtrasadosDespesas.map(mes => <p key={mes}>{mes}</p>)}
                    </div>
                  )}
                </div>
              )}
              {maturityDateDespesas(despesasFiltradas) && (
                <div className='relative'>
                  <svg
                    onMouseEnter={() => setHoveredAlert("alertMaturityDespesas")}
                    onMouseLeave={() => setHoveredAlert(null)}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="yellow" className="size-6 cursor-pointer"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  {hoveredAlert === "alertMaturityDespesas" && (
                    <div className='absolute z-10 right-0 top-8 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap border border-white/10'>
                      Existem Despesas esse mês
                    </div>
                  )}
                </div>)
              }
            </div>
          </div>
          <p className='text-3xl font-bold text-red-400'>R$ {totalDespesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className='text-xs text-white/30 mt-1'>{despesasFiltradas.filter(d => d.pago).length} de {despesasFiltradas.length} pago{despesasFiltradas.filter(d => d.pago).length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`rounded-2xl border backdrop-blur-sm shadow-xl p-6 ${saldoAcumuladoAteMes >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <p className='text-xs font-semibold text-white/40 uppercase tracking-widest mb-1'>Saldo acumulado</p>
          <p className={`text-3xl font-bold ${saldoAcumuladoAteMes >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {saldoAcumuladoAteMes >= 0 ? '+' : ''}R$ {saldoAcumuladoAteMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className='text-xs text-white/30 mt-1'>{saldoAcumuladoAteMes >= 0 ? 'Superávit' : 'Déficit'} acumulado até {new Date(anoSel, mesSel - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className='flex flex-row items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 transition-all duration-300'>
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
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
      {/* Linha 1: Pie + Doughnut Receitas + Doughnut Despesas */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col items-center h-96'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Receita x Despesas</h2>
          <div className='flex-1 w-full'>
            <Pie key={`pie-${mountId}`} data={receitasXDespesas} options={{ animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col items-center h-96'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Receitas</h2>
          <div className='flex-1 w-full'>
            <Doughnut key={`doughnut-r-${mountId}`} data={doughnutReceitas} options={{ animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col items-center h-96'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Despesas</h2>
          <div className='flex-1 w-full'>
            <Doughnut key={`doughnut-d-${mountId}`} data={doughnutDespesas} options={{ animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Linha 2: Barras comparativo (col-span-2) + Linha Receitas */}
      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col h-80'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Receitas vs Despesas por Mês</h2>
          <div className='flex-1 w-full'>
            <Bar key={`bar-${mountId}`} data={barrasComparativo} options={{
              animation: { duration: 1000 }, responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { color: 'rgba(255,255,255,0.6)' } } },
              scales: {
                y: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              }
            }} />
          </div>
        </div>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col h-80'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Crescimento de Receitas</h2>
          <div className='flex-1 w-full'>
            <Line key={`line-r-${mountId}`} data={linhaReceitas} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Linha 3: Saldo acumulado + Ranking despesas */}
      <div className='grid grid-cols-2 gap-6'>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col h-80'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Saldo Acumulado por Mês</h2>
          <div className='flex-1 w-full'>
            <Line key={`line-saldo-${mountId}`} data={linhaSaldoAcumulado} options={lineOptions} />
          </div>
        </div>
        <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col h-80'>
          <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Maiores Despesas do Mês</h2>
          <div className='flex-1 w-full'>
            {topDespesas.length === 0
              ? <p className='text-white/30 text-sm text-center mt-10'>Nenhuma despesa no período</p>
              : <Bar key={`bar-top-${mountId}`} data={barrasTopDespesas} options={barrasHorizontaisOptions} />
            }
          </div>
        </div>
      </div>

      {/* Linha 4: Linha Despesas (largura total) */}
      <div className='rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-6 flex flex-col h-80'>
        <h2 className='text-base font-semibold text-white/60 uppercase tracking-widest mb-4'>Crescimento de Despesas</h2>
        <div className='flex-1 w-full'>
          <Line key={`line-d-${mountId}`} data={linhaDespesas} options={lineOptions} />
        </div>
      </div>

    </div>
  )
}

export default Dashboard
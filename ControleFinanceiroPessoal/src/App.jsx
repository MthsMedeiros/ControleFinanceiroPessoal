import { useState } from 'react'

import Dashboard from './componets/Dashboard'
import Receitas from './componets/Receitas'
import Despesas from './componets/Despesas'
import Cartoes from './componets/Cartoes'
import { UseFetch } from './hooks/UseFetch'


function App() {

  const [url] = useState('http://localhost:3001')
  const [dashboardRenderCount, setDashboardRenderCount] = useState(0)
  let [isOpen, setIsOpen] = useState(false)
  let [page, setPage] = useState('Dashboard')

  const { listReceitas, httpConfig: receitasConfig, loading: loadingReceitas } = UseFetch(url + '/receitas')
  const { listDespesas, httpConfig: despesasConfig, loading: loadingDespesas } = UseFetch(url + '/despesas')
  const { listCartoes, httpConfig: cartoesConfig, loading: loadingCartoes } = UseFetch(url + '/cartoes')

  const handleSetPage = (newPage) => {
    setPage(newPage)
    if (newPage === 'Dashboard') {
      setDashboardRenderCount(prev => prev + 1) // Força remontagem do Dashboard
    }
  }

  

  

  return (
    <>
      <div className='w-full h-dvh flex flex-col'>
        <nav className='w-full z-20 border-b border-white/10 bg-white/5 backdrop-blur-md shadow-lg'>
          <div className='flex items-center justify-between px-6 py-3 max-w-7xl mx-auto w-full'>

            {/* Logo + título */}
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center'>
                <svg className='w-4 h-4 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <span className='text-white font-semibold text-lg tracking-tight'>Controle Financeiro</span>
            </div>

            {/* Navegação central */}
            <ul className='flex items-center gap-1'>
              {['Dashboard', 'Receitas', 'Despesas', 'Cartões'].map((p) => (
                <li key={p}>
                  <button
                    onClick={() => handleSetPage(p)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      page === p
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>

            {/* Perfil */}
            <div className='relative'>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className='flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-200'
              >
                <img className='w-7 h-7 rounded-full object-cover' src='/src/assets/profile-picture-5.jpg' alt='user' />
                <span className='text-sm text-white/70'>Matheus M</span>
                <svg className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>

              {isOpen && (
                <div
                  onMouseLeave={() => setIsOpen(false)}
                  className='absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[#1e2939] shadow-xl overflow-hidden z-50'
                >
                  <div className='px-4 py-3 border-b border-white/10'>
                    <p className='text-sm font-semibold text-white'>Matheus M</p>
                    <p className='text-xs text-white/40 truncate'>matheus@example.com</p>
                  </div>
                  <ul className='p-2'>
                    <li>
                      <button className='w-full text-left px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150'>
                        Sair
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

          </div>
        </nav>
        <div className='w-full h-full flex-1'>
            {page === "Dashboard" && <Dashboard key={dashboardRenderCount} listDespesas={listDespesas} listReceitas={listReceitas} />}
            {page === "Receitas" && <Receitas listReceitas={listReceitas} httpConfig={receitasConfig} loading={loadingReceitas} />}
            {page === "Despesas" && <Despesas listDespesas={listDespesas} httpConfig={despesasConfig} loading={loadingDespesas} />}
            {page === "Cartões" && <Cartoes listCartoes={listCartoes} httpConfig={cartoesConfig} loading={loadingCartoes} />}

        </div>
      </div>
    </>
  )
}

export default App

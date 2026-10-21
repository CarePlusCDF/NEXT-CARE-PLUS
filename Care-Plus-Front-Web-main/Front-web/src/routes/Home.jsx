import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCreditCard, FiShield, FiHeart } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'


const Home = () => {
  const navigate = useNavigate()
  const user = { name: 'seja bem-vindo', points: 0 }
  const boostCarePath = localStorage.getItem('token') ? '/inicial' : '/login'

  const quickAccessItems = [
    {
      id: 'blua',
      title: 'blua',
      subtitle: 'Saúde Digital',
      clickable: false,
      bg: 'bg-[#1a1a2e]',
    },
    {
      id: 'boostcare',
      title: 'Boost Care',
      subtitle: 'Missões & Recompensas',
      clickable: true,
      bg: 'bg-[#1c9770]',
      path: boostCarePath,
    },
  ]

  const infoCards = [
    { id: 'carteirinha', title: 'Carteirinha Digital', desc: 'Acesse sua carteirinha do plano rapidamente.', icon: FiCreditCard },
    { id: 'cobertura', title: 'Cobertura do Plano', desc: 'Consulte todas as coberturas do seu plano.', icon: FiShield },
    { id: 'saude', title: 'Minha Saúde', desc: 'Acompanhe seus indicadores de saúde.', icon: FiHeart },
  ]

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar showPoints={false} />

      <main className="w-full px-4 lg:px-8 pt-4 pb-24">

        {/* Saudação */}
        <section className="mb-6">
          <p className="text-[#6B7685] text-sm">Olá,</p>
          <h1 className="font-bold text-[28px] text-[#1A202C] leading-tight">
            {user.name}!
          </h1>
        </section>

        
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Acesso rápido</h2>
            <button className="flex items-center gap-1 text-[13px] text-[#1c9770] bg-transparent border-0 p-0 cursor-pointer">
              Ver todos <FiArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickAccessItems.map(({ id, title, subtitle, clickable, bg, path }) => (
              <div
                key={id}
                className={[
                  bg,
                  'rounded-xl p-3 flex flex-col justify-end relative min-h-[120px] shadow-brand-tile',
                  clickable
                    ? 'cursor-pointer hover:-translate-y-0.5 transition-transform duration-200'
                    : 'cursor-default',
                ].join(' ')}
                onClick={() => clickable && navigate(path)}
              >
                <h3 className="font-bold text-[16px] text-white">{title}</h3>
                <p className="text-[12px] text-white/75">{subtitle}</p>
                {clickable && (
                  <FiArrowRight size={16} className="absolute top-3.5 right-3.5 text-white/80" />
                )}
              </div>
            ))}
          </div>
        </section>

        
        <section className="mb-6">
          <div
            className="bg-gradient-primary rounded-xl p-4 lg:p-6 relative overflow-hidden flex items-center justify-between shadow-brand-banner cursor-pointer hover:-translate-y-0.5 transition-transform duration-200"
            onClick={() => navigate(boostCarePath)}
          >
            <div className="absolute -top-[30px] -right-[30px] w-[140px] h-[140px] bg-white/[0.07] rounded-full" />

            <div className="relative z-10">
              <span className="inline-block font-bold text-[11px] bg-[#93CB52] text-[#1A202C] px-[10px] py-[3px] rounded-full tracking-[0.5px] uppercase mb-2">
                Novo
              </span>
              <h2 className="font-bold text-white text-[20px] mb-1">Boost Care</h2>
              <p className="text-[13px] text-white/85 leading-[1.5] mb-3">
                Transforme o cuidado com a saúde em hábito. Cumpra missões e ganhe recompensas reais!
              </p>
              <div className="flex items-center gap-2 text-white font-bold text-[13px]">
                Começar agora <FiArrowRight size={14} />
              </div>
            </div>

            <span className="hidden lg:block text-[52px] opacity-85 relative z-10">💚</span>
          </div>
        </section>

        
        <section>
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Serviços</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {infoCards.map(({ id, title, desc, icon: Icon }) => (
              <div
                key={id}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#E4E7EB] shadow-brand-card"
              >
                <div className="flex items-center justify-center rounded-xl w-12 h-12 bg-[#F0F2F5] shrink-0">
                  <Icon size={22} color="#1c9770" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[14px] text-[#1A202C]">{title}</p>
                  <p className="text-[12px] text-[#6B7685]">{desc}</p>
                </div>
                <FiArrowRight size={18} color="#9BA3AE" />
              </div>
            ))}
          </div>
        </section>

      </main>

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Home

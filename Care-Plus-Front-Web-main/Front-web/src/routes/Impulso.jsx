import { useNavigate } from 'react-router-dom'
import { useCare } from '../services/CareContext.jsx'
import { FiArrowLeft, FiZap, FiTrendingUp, FiStar, FiAward } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import flux from '../assets/flux.png'

function formatarDataLocal(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

const Impulso = () => {
  const navigate = useNavigate()
  const { data } = useCare()
  const usuario = data?.usuario
  const streakDias = usuario?.streak || 0
  const missoesHoje = usuario?.missoesConcluidasHoje || 0
  const missoesPorDia = usuario?.missoesPorDia || {}
  const streakDiasAcendidos = usuario?.streakDiasAcendidos || []
  const diaAtual = new Date(`${data?.day || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}T12:00:00`).getDay()

  const indiceDia = diaAtual === 0
    ? 6
    : diaAtual - 1
  const missoesRestantes = Math.max(3 - missoesHoje, 0)





  const comoFunciona = [
    { id: 1, icon: FiZap, title: 'Acesse diariamente', desc: 'Entre no app todos os dias para manter seu streak ativo.' },
    { id: 2, icon: FiTrendingUp, title: 'Complete missões', desc: 'Conclua missões diárias para evoluir seu Flux e subir de nível.' },
    { id: 3, icon: FiStar, title: 'Ganhe recompensas', desc: 'Quanto maior seu streak, melhores as recompensas desbloqueadas.' },
    { id: 4, icon: FiAward, title: 'Suba de nível', desc: 'Evolua sua conta e desbloqueie benefícios exclusivos.' },
  ]

  const dataHoje = new Date(`${data?.day || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })}T12:00:00`)
  const chaveHoje = formatarDataLocal(dataHoje)
  const inicioSemana = new Date(dataHoje)
  inicioSemana.setDate(dataHoje.getDate() - indiceDia)
  const diasComFluxAceso = new Set(streakDiasAcendidos)
  const progressoSemanal = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, index) => {
    const data = new Date(inicioSemana)
    data.setDate(inicioSemana.getDate() + index)
    const chave = formatarDataLocal(data)
    const quantidade = missoesPorDia[chave] || (chave === chaveHoje ? missoesHoje : 0)

    return {
      dia,
      quantidade: diasComFluxAceso.has(chave) ? Math.max(quantidade, 3) : quantidade,
    }
  })

  return (
    <div className="min-h-screen bg-[#F4F6F8]">

      <TopBar showPoints={true} />



      <main className="w-full px-4 lg:px-8 pt-4 pb-24">

        <section className="flex items-center gap-2 mb-4">
          <button
            className="bg-transparent border-0 p-0 text-[#6B7685] cursor-pointer"
            onClick={() => navigate('/inicial')}
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-[20px] text-[#1A202C]">Impulso+</h1>
        </section>

        <section className="mb-4">
          <div className="bg-gradient-primary shadow-brand-primary rounded-xl p-4 text-center">
            <img
              src={flux}
              alt="Flux"
              className="w-[180px] h-[180px] rounded-full mx-auto object-contain"
            />
            <h2 className="font-bold text-white text-[24px] mb-1">Flux</h2>
            <p className="text-white opacity-75 text-[13px] mb-3">Seu amigo de streak</p>
            <div className="inline-flex items-center gap-2 bg-white/25 rounded-full px-3 py-2">
              <FiZap size={16} color="#fff" />
              <span className="font-bold text-white text-[14px]">{streakDias} dias de streak</span>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 text-center">
            <p className="text-[#6B7685] text-[14px] mb-1">Próxima recompensa em</p>

            <span className="font-bold text-[#1c9770] text-[24px]">
              {missoesRestantes} {missoesRestantes === 1 ? 'missão' : 'missões'}
            </span>


          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Como funciona o Flux</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {comoFunciona.map(({ id, icon: Icon, title, desc }) => (
              <div key={id} className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[rgba(28,151,112,0.1)]">
                  <Icon size={18} color="#1c9770" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-[#1A202C]">{title}</p>
                  <p className="text-[#6B7685] text-[12px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3">
            <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Seu progresso semanal</h2>
            <div className="flex justify-between items-end gap-2">
              {progressoSemanal.map(({ dia, quantidade }) => (
                <div key={dia} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[#1c9770] font-bold text-[12px]">{quantidade}</span>

                  <div
                    className={`w-full rounded transition-all duration-300 ${quantidade > 0
                        ? 'bg-[#1c9770]'
                        : 'bg-[rgba(28,151,112,0.1)]'
                      }`}
                    style={{
                      height: `${Math.max(
                        Math.min(quantidade, 5) * 12,
                        quantidade > 0 ? 18 : 20
                      )}px`
                    }}
                  />


                  <span className="text-[12px] text-[#6B7685]">{dia}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Impulso

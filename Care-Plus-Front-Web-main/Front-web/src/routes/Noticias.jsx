import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'

const Noticias = () => {
  const navigate = useNavigate()
  const points = 1500

  const noticias = [
    {
      id: 1,
      titulo: 'Saúde mental: afastamentos dobram em dez anos e chegam a 440 mil',
      resumo: 'Em 2014, quase 203 mil brasileiros foram afastados do trabalho em razão de episódios depressivos, transtornos de ansiedade, reações a estresse grave e outras questões relacionadas à saúde mental.',
      tag: 'Saúde Mental',
      tagClass: 'bg-[rgba(28,151,112,0.1)] text-[#1c9770]',
    },
    {
      id: 2,
      titulo: 'Saúde anuncia investimento de R$ 15 bi no setor industrial',
      resumo: 'Serão R$ 6 bi com recursos públicos e privados, incluindo o Novo PAC, para a nova planta de vacinas e biofármacos no Complexo Industrial de Biotecnologia em Saúde, localizado no Rio de Janeiro.',
      tag: 'Política',
      tagClass: 'bg-[rgba(122,209,195,0.15)] text-[#1A202C]',
    },
    {
      id: 3,
      titulo: 'Brasil é destaque em encontro latino-americano sobre tuberculose',
      resumo: 'O Ministério da Saúde participou da 12ª Reunião da Sociedade Latino-Americana de Tuberculose e Outras Micobacterioses, realizada em Montevidéu.',
      tag: 'Internacional',
      tagClass: 'bg-[rgba(28,151,112,0.1)] text-[#1c9770]',
    },
    {
      id: 4,
      titulo: 'Exercício físico regular reduz risco de doenças crônicas em 35%',
      resumo: 'Estudo realizado com mais de 50 mil participantes aponta que a prática regular de atividades físicas está diretamente associada à redução de doenças cardiovasculares e metabólicas.',
      tag: 'Bem-estar',
      tagClass: 'bg-[rgba(122,209,195,0.15)] text-[#1A202C]',
    },
    {
      id: 5,
      titulo: 'Hidratação adequada melhora desempenho cognitivo em até 20%',
      resumo: 'Pesquisadores apontam que beber a quantidade correta de água diariamente tem impacto direto na concentração, memória e produtividade ao longo do dia.',
      tag: 'Bem-estar',
      tagClass: 'bg-[rgba(122,209,195,0.15)] text-[#1A202C]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar points={points} showPoints={true} />

      <main className="w-full px-4 lg:px-8 pt-4 pb-24">

        <section className="flex items-center gap-2 mb-4">
          <button
            className="bg-transparent border-0 p-0 text-[#6B7685] cursor-pointer"
            onClick={() => navigate('/inicial')}
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-[20px] text-[#1A202C]">Notícias</h1>
        </section>

        <section className="mb-4">
          <div className="bg-gradient-primary shadow-brand-primary rounded-xl p-4">
            <p className="text-white opacity-75 text-[12px] mb-1">Conteúdo ilustrativo · sem atualização automática</p>
            <h2 className="font-bold text-white text-[16px] mb-2">{noticias[0].titulo}</h2>
            <p className="text-white opacity-75 text-[12px] mb-3">{noticias[0].resumo}</p>
            <button
              className="rounded-full py-1 px-3 font-bold text-[12px] bg-white text-[#1c9770] flex items-center gap-1 cursor-pointer"
              aria-disabled="true"
            >
              Resumo ilustrativo <FiArrowRight size={12} color="#1c9770" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Mais notícias</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {noticias.slice(1).map(({ id, titulo, resumo, tag, tagClass }) => (
              <div
                key={id}
                className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 cursor-pointer"
                aria-disabled="true"
              >
                <span className={`inline-block rounded-full text-[11px] font-medium mb-2 px-2 py-0.5 ${tagClass}`}>
                  {tag}
                </span>
                <p className="font-bold text-[14px] text-[#1A202C] mb-1">{titulo}</p>
                <p className="text-[#6B7685] text-[12px] mb-2">{resumo}</p>
                <div className="flex items-center gap-1 text-[#1c9770] font-bold text-[12px]">
                  Resumo ilustrativo <FiArrowRight size={12} color="#1c9770" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Noticias

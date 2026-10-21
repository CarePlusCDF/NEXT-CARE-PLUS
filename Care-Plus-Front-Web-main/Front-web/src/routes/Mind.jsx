import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiHeart, FiPhone } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import ModalConfirmacao from '../components/ModalConfirmacao.jsx'

const Mind = () => {
  const navigate = useNavigate()
  const [modalAberto, setModalAberto] = useState(false)
  const [artigoSelecionado, setArtigoSelecionado] =
    useState(null)
  const points = 1500
  const artigos = [

    {
      id: 1,
      title: 'Quando procurar um psicólogo?',
      desc: 'Esteja atento a sinais de alteração da saúde mental.',
      conteudo:
        'Se emoções como ansiedade, tristeza, estresse ou desânimo estiverem afetando sua rotina, relacionamentos ou produtividade, procurar um psicólogo pode ajudar. O acompanhamento profissional ajuda a entender sentimentos, criar estratégias emocionais e melhorar sua qualidade de vida.'
    },

    {
      id: 2,
      title: 'Crise de ansiedade?',
      desc: 'Veja a técnica 5-4-3-2-1 para amenizar crises.',
      conteudo:
        'A técnica 5-4-3-2-1 ajuda a reduzir crises de ansiedade trazendo sua atenção para o presente. Observe: 5 coisas que vê, 4 que pode tocar, 3 que consegue ouvir, 2 que consegue sentir o cheiro e 1 que consegue provar. Isso ajuda o cérebro a sair do estado de alerta intenso.'
    },

    {
      id: 3,
      title: 'Reduzir tensão?',
      desc: 'Hábito de 2 minutos para reduzir o estresse mental.',
      conteudo:
        'Faça pausas curtas durante o dia. Alongar o corpo, respirar profundamente por 2 minutos ou sair um pouco das telas ajuda a diminuir o cortisol, reduzir a tensão mental e melhorar o foco.'
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
          <h1 className="font-bold text-[20px] text-[#1A202C]">Mind+</h1>
        </section>

        <section className="mb-4">
          <div className="bg-gradient-accent1 shadow-brand-primary rounded-xl p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mx-auto mb-3">
              <FiHeart size={32} color="#fff" />
            </div>
            <h2 className="font-bold text-white text-[20px] mb-1">Pedir ajuda não é sinal de fraqueza</h2>
            <p className="text-white opacity-75 text-[13px]">
              É a coragem de escolher cuidar de si.
            </p>
          </div>
        </section>

        <section className="mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div
              className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 cursor-pointer"
              aria-disabled="true"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(28,151,112,0.1)] mb-2">
                <FiHeart size={18} color="#1c9770" />
              </div>
              <p className="font-bold text-[14px] text-[#1A202C] mb-1">Acompanhamento com profissional</p>
              <p className="text-[#6B7685] text-[12px]">
                Serviço ilustrativo, sem agendamento ou atendimento integrado neste protótipo.
              </p>
            </div>
            <a href="https://cvv.org.br/chat/" target="_blank" rel="noopener noreferrer">

              <div
                className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 cursor-pointer"
                aria-disabled="true"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(28,151,112,0.1)] mb-2">
                  <FiPhone size={18} color="#1c9770" />
                </div>
                <p className="font-bold text-[14px] text-[#1A202C] mb-1">Apoio emocional · CVV</p>
                <p className="text-[#6B7685] text-[12px]">
                  Acesso ao site externo do CVV. Este protótipo não oferece atendimento clínico.
                </p>
              </div>
            </a>
          </div>
        </section>
        <a href="https://cvv.org.br/" target="_blank" rel="noopener noreferrer" >
          <section className="mb-4">
            <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Não está se sentindo bem?</h2>
            <div
              className="rounded-xl p-3 flex items-center justify-between border border-[rgba(28,151,112,0.2)] bg-[rgba(28,151,112,0.05)] cursor-pointer"
              aria-disabled="true"
            >
              <div>
                <p className="font-bold text-[14px] text-[#1c9770]">CVV - Centro de Valorização da Vida</p>
                <p className="text-[#6B7685] text-[12px]">Receber auxílio</p>
              </div>
              <FiArrowRight size={18} color="#1c9770" />
            </div>
          </section>
        </a>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Dúvidas frequentes</h2>
          <div className="flex flex-col gap-2">

            {artigos.map(({ id, title, desc, conteudo }) => (


              <div
                key={id}
                onClick={() => {

                  setArtigoSelecionado({
                    title,
                    conteudo
                  })

                  setModalAberto(true)
                }}
                className="bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-3 flex items-center gap-3 cursor-pointer"
              >

                <div className="flex-1">
                  <p className="font-bold text-[14px] text-[#1A202C]">{title}</p>
                  <p className="text-[#6B7685] text-[12px]">{desc}</p>
                </div>
                <FiArrowRight size={16} color="#1c9770" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <button
            className="w-full rounded-xl py-3 font-bold text-[14px] text-white bg-gradient-accent1 shadow-brand-primary flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => window.open('https://cvv.org.br/', '_blank', 'noopener,noreferrer')}
          >
            <FiPhone size={18} color="#fff" /> Receber auxílio agora
          </button>
        </section>

      </main>

      <ModalConfirmacao
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
        titulo={artigoSelecionado?.title}
        descricao={artigoSelecionado?.conteudo}
        mostrarConfirmar={false}
        textoCancelar="Fechar"
      />


      <Bottomnav activePage="home" />
    </div>
  )
}

export default Mind

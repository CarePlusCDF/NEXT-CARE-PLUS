import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiActivity, FiArrowLeft, FiArrowRight, FiDroplet, FiZap, FiTarget, FiTrendingUp, FiAward } from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import ModalConfirmacao from '../components/ModalConfirmacao.jsx'
import { post } from '../services/api.js'
import { useCare } from '../services/CareContext.jsx'
import DeviceControls from '../components/DeviceControls.jsx'


const Missoes = () => {

  const navigate = useNavigate()
  const [modalAberto, setModalAberto] = useState(false)
  const [missaoSelecionada, setMissaoSelecionada] = useState(null)
  const [tipoMissao, setTipoMissao] = useState("")


  const care = useCare()
  const streakDias = care.data?.usuario?.streak || 0
  const manuais = care.data?.manuais || []
  const missoesPersonalizadas = manuais.filter(m => m.kind === 'personalizada' && !m.concluida)
  const missoesGerais = manuais.filter(m => m.kind === 'geral' && !m.concluida)
  const missoesConnect = care.data?.missoes || []
  const [actionError, setActionError] = useState('')
  const erroConnect = care.error || actionError
  const missoesHoje = care.data?.usuario?.missoesConcluidasHoje || 0

  const inicioMapa = Math.max(
    missoesHoje - 5,
    0
  )

  const mapaMissoes = Array.from(
    { length: 6 },
    (_, index) => {

      const numero = inicioMapa + index + 1

      return {
        id: numero,
        concluida: numero <= missoesHoje,
        desbloqueada: numero === missoesHoje + 1
      }
    }
  )





  function abrirModal(idMissao, tipo) {
    setMissaoSelecionada({ id: idMissao, generation: care.data.generation })
    setTipoMissao(tipo)
    setModalAberto(true)
  }
  async function concluirMissao(idMissao) {
    try { await post('/concluir-missao', { idMissao: idMissao.id, generation: idMissao.generation }); care.refresh(); setActionError('') }
    catch (error) { setActionError(error.message) }
  }
  const concluirMissaoGeral = concluirMissao

  const getCircleClass = (concluida, desbloqueada) => {
    if (concluida) return 'bg-[#1c9770] text-white border-2 border-transparent'
    if (desbloqueada) return 'bg-[rgba(28,151,112,0.15)] text-[#1c9770] border-2 border-[#1c9770]'
    return 'bg-[#E4E7EB] text-[#9BA3AE] border-2 border-transparent'
  }

  function formatarValorConnect(missao) {
    if (missao.tipo === 'manual') return `${missao.atual} / ${missao.meta} missões`
    if (missao.tipo === 'water') {
      return `${Number(missao.atual || 0).toLocaleString('pt-BR')}ml / ${Number(missao.meta || 0).toLocaleString('pt-BR')}ml`
    }

    if (missao.tipo === 'steps_per_minute' || missao.tipo === 'daily_steps_average') {
      return `${Number(missao.atual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / ${Number(missao.meta || 0).toLocaleString('pt-BR')} passos/min`
    }

    return `${Number(missao.atual || 0).toLocaleString('pt-BR')} / ${Number(missao.meta || 0).toLocaleString('pt-BR')} passos`
  }

  function escolherIconeConnect(tipo) {
    if (tipo === 'water') return FiDroplet
    if (tipo === 'steps_per_minute' || tipo === 'daily_steps_average') return FiTrendingUp

    return FiActivity
  }

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
          <h1 className="font-bold text-[20px] text-[#1A202C]">Missões</h1>
        </section>

        <section>
          <button
            type="button"
            className="ranking-cta relative w-full overflow-hidden rounded-xl border border-white/20 p-4 mb-4 text-left cursor-pointer shadow-brand-banner"
            onClick={() => navigate('/ranking')}
          >
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                  <FiAward size={25} />
                </div>
                <h2 className="mb-1 text-[20px] font-bold leading-tight text-white">Ranking</h2>
                <p className="max-w-[230px] text-[13px] leading-snug text-white/80">
                  Confira seu desempenho com seus amigos
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-end gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[13px] font-bold text-[#1c9770] shadow-sm">
                  <FiZap size={13} />
                  {streakDias} dias
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                  <FiTrendingUp size={18} />
                </span>
              </div>
            </div>
          </button>
        </section>
        <section className="mb-4">
          <div className="bg-white rounded-xl border border-[#E4E7EB] p-3">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-[16px] text-[#1A202C]">Mapa de missões</h2>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(28,151,112,0.1)]">
                <FiZap size={14} color="#1c9770" />
                <span className="font-bold text-[12px] text-[#1c9770]">{streakDias} dias de streak</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              {mapaMissoes.map(({ id, desbloqueada, concluida }) => (

                <div
                  key={id}
                  className="flex flex-col items-center justify-start gap-1 h-[58px]"
                >


                  <div
                    className={`rounded-full flex items-center justify-center font-bold w-10 h-10 text-[13px] ${getCircleClass(concluida, desbloqueada)}`}
                  >
                    {id}
                  </div>

                  <div
                    className={`w-0.5 h-4 ${id < mapaMissoes[mapaMissoes.length - 1].id
                        ? concluida
                          ? 'bg-[#1c9770]'
                          : 'bg-[#E4E7EB]'
                        : 'opacity-0'
                      }`}
                  />

                </div>
              ))}
            </div>

            <p className="text-[#6B7685] text-[12px] text-center mt-3">
              Acesse o app diariamente para liberar o Impulso+ e receber recompensas
            </p>
          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">
            Missões Connect+
          </h2>

          {erroConnect && (
            <div className="mb-2 rounded-xl border border-[#F6AD55]/40 bg-[#F6AD55]/10 p-3">
              <p className="text-[#6B7685] text-[12px]">{erroConnect}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {missoesConnect.map((missao) => {
              const Icon = escolherIconeConnect(missao.tipo)

              return (
                <div
                  key={missao.id}
                  className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${
                    missao.concluida
                      ? 'border-[rgba(28,151,112,0.35)] bg-[rgba(28,151,112,0.03)]'
                      : 'border-[#E4E7EB]'
                  }`}
                >
                  <div className={`rounded-xl flex items-center justify-center shrink-0 w-10 h-10 ${
                    missao.concluida ? 'bg-[#1c9770]' : 'bg-[rgba(28,151,112,0.08)]'
                  }`}>
                    <Icon size={18} color={missao.concluida ? '#fff' : '#1c9770'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-3">
                      <p className="text-[13px] text-[#1A202C] font-medium">
                        {missao.titulo}
                      </p>
                      <span className="text-[#1c9770] text-[12px] font-bold shrink-0">
                        {missao.trofeus} troféus
                      </span>
                    </div>
                    <p className="text-[#6B7685] text-[12px] mt-1">
                      {formatarValorConnect(missao)}
                    </p>
                    {missao.concluida && missao.resetEm?.label && (
                      <p className="text-[#1c9770] text-[12px] font-bold mt-1">
                        Reseta em {missao.resetEm.label}
                      </p>
                    )}
                    <div className="rounded-full bg-[#E4E7EB] h-1.5 overflow-hidden mt-2">
                      <div
                        className={`rounded-full h-1.5 ${missao.concluida ? 'bg-[#93CB52]' : 'bg-[#1c9770]'}`}
                        style={{ width: `${missao.progresso}%` }}
                      />
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0 ${
                    missao.concluida
                      ? 'bg-[rgba(147,203,82,0.18)] text-[#167a5a]'
                      : 'bg-[#F0F2F5] text-[#6B7685]'
                  }`}>
                    {missao.concluida ? 'Concluída' : `${missao.progresso}%`}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <DeviceControls />
        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">
            Missões Gerais
          </h2>
          <div className="flex flex-col gap-2">
            {missoesGerais.map((missao, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#E4E7EB] p-3 flex items-center gap-3"
              >
                <div className="rounded-xl flex items-center justify-center shrink-0 w-10 h-10 bg-[rgba(28,151,112,0.08)]">
                  <FiTarget size={18} color="#1c9770" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#1A202C]">
                    {missao.missao}
                  </p>
                  <span className="text-[#1c9770] text-[12px] font-bold">
                    {missao.trofeus} troféus
                  </span>
                </div>
                <button
                  onClick={() => abrirModal(missao.id, "geral")}
                  className="rounded-full flex items-center justify-center shrink-0 w-[22px] h-[22px] border-2 bg-transparent border-[#CDD3DA]"
                >
                  <FiArrowRight size={10} color="#9BA3AE" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Missões personalizadas</h2>
          <div className="flex flex-col gap-2">
            {missoesPersonalizadas.map((missao, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#E4E7EB] p-3 flex items-center gap-3"
              >
                <div className="rounded-xl flex items-center justify-center shrink-0 w-10 h-10 bg-[rgba(28,151,112,0.08)]">
                  <FiTarget size={18} color="#1c9770" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] text-[#1A202C]">
                    {missao.titulo}
                  </p>
                  <span className="text-[#1c9770] text-[12px] font-bold">
                    {missao.trofeus} troféus
                  </span>
                </div>
                <button
                  onClick={() => abrirModal(missao.id, "personalizada")}
                  className="rounded-full flex items-center justify-center shrink-0 w-[22px] h-[22px] border-2 bg-transparent border-[#CDD3DA]"
                >
                  <FiArrowRight size={10} color="#9BA3AE" />
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>

      <ModalConfirmacao
        aberto={modalAberto}
        titulo="Concluir missão?"
        descricao="Essa missão será marcada como concluída e substituída por outra."
        onClose={() => setModalAberto(false)}
        onConfirm={async () => {

          if (tipoMissao === "personalizada") {
            await concluirMissao(missaoSelecionada)
          }

          if (tipoMissao === "geral") {
            await concluirMissaoGeral(missaoSelecionada)
          }

          setModalAberto(false)
        }}
      />

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Missoes

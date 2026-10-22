import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiClock,
  FiDroplet,
  FiRefreshCw,
  FiSun,
  FiTrendingUp,
  FiWifi,
} from 'react-icons/fi'
import TopBar from '../components/TopBar.jsx'
import Bottomnav from '../components/Bottomnav.jsx'
import Flux from '../assets/img.webp'
import FluxPC from '../assets/imgPC.webp'
import { useCare } from '../services/CareContext.jsx'
import DeviceControls from '../components/DeviceControls.jsx'

function formatarValorMissao(missao) {
  if (missao.tipo === 'manual') return `${missao.atual} / ${missao.meta} missões`
  if (missao.tipo === 'water') {
    return `${Number(missao.atual || 0).toLocaleString('pt-BR')}ml / ${Number(missao.meta || 0).toLocaleString('pt-BR')}ml`
  }

  if (missao.tipo === 'steps_per_minute' || missao.tipo === 'daily_steps_average') {
    return `${Number(missao.atual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / ${Number(missao.meta || 0).toLocaleString('pt-BR')} passos/min`
  }

  return `${Number(missao.atual || 0).toLocaleString('pt-BR')} / ${Number(missao.meta || 0).toLocaleString('pt-BR')} passos`
}

function escolherIconeMissao(tipo) {
  if (tipo === 'water') return FiDroplet
  if (tipo === 'steps_per_minute' || tipo === 'daily_steps_average') return FiTrendingUp

  return FiActivity
}

const Connect = () => {
  const navigate = useNavigate()
  const { data, error: erro, updatedAt: atualizadoEm, refresh: carregarConnect, loading: carregando } = useCare()
  const pedometro = data?.pedometro
  const luminaria = data?.luminaria || { label: 'Apagada', hex: '#9BA3AE', nivel: 0 }
  const missoesConnect = useMemo(() => data?.missoes || [], [data])
  const aguaMl = data?.aguaMl || 0
  const copoAguaMl = data?.copoAguaMl || 220
  const conquistas = data?.usuario?.conquistas || []

  const missoesPrincipais = useMemo(() => {
    const principais = missoesConnect

    return principais.length > 0 ? principais : missoesConnect
  }, [missoesConnect])

  const passosHoje = pedometro?.steps ?? 0
  const nomeConta = data?.usuario?.nome || ''
  const mediaDiaria = pedometro?.dailyStepsAverage ?? 0
  const statusPedometro = erro ? 'offline' : pedometro?.status || 'aguardando'
  const resetLabel = luminaria.resetEm?.label || missoesConnect.find((missao) => missao.resetEm?.label)?.resetEm?.label || ''
  const textoAtualizacao = atualizadoEm
    ? atualizadoEm.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    : 'aguardando'

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <TopBar showPoints={true} />

      <div className="relative w-full">
        <img src={Flux} alt="" className="w-full block lg:hidden" />
        <img src={FluxPC} alt="" className="w-full hidden lg:block" />

        <section className="flex items-center gap-2 mb-4 absolute bottom-[63%] md:bottom-[79%] lg:bottom-[87%] left-4 lg:left-8 z-10">
          <button
            className="bg-transparent border-0 p-0 text-white cursor-pointer"
            onClick={() => navigate('/inicial')}
            type="button"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-[20px] text-white">Connect+</h1>
        </section>
      </div>

      <main className="w-full px-4 lg:px-8 pt-4 pb-24">
        <DeviceControls />
        <section className="mb-4">
          <div className="bg-white rounded-md border border-[#E4E7EB] shadow-brand-card p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-[rgba(28,151,112,0.1)] flex items-center justify-center">
                  <FiWifi size={24} color="#1c9770" />
                </div>
                <div>
                  <p className="text-[#6B7685] text-[11px] uppercase font-bold tracking-[1px]">
                    Pulseira e luminaria
                  </p>
                  <h2 className="font-bold text-[#1A202C] text-[18px]">Seus aparelhos em tempo real</h2>
                  <p className="text-[#6B7685] text-[12px]">Atualizado {textoAtualizacao}</p>
                </div>
              </div>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 text-[13px] text-[#1c9770] bg-white border border-[rgba(28,151,112,0.2)] rounded-md px-3 py-2 cursor-pointer disabled:opacity-70"
                onClick={() => carregarConnect(true)}
                disabled={carregando}
              >
                <FiRefreshCw
                  size={13}
                  color="#1c9770"
                  className={carregando ? 'animate-spin' : ''}
                />
                Atualizar
              </button>
            </div>

            {erro && (
              <div className="mb-3 rounded-md border border-[#F6AD55]/40 bg-[#F6AD55]/10 px-3 py-2">
                <p className="text-[#6B7685] text-[12px]">
                  Não foi possível atualizar a API agora. {erro}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-md border border-[#E4E7EB] bg-[#F8FAFB] p-3">
                <p className="text-[#6B7685] text-[12px] mb-1">Status da pulseira</p>
                <p className="font-bold text-[18px] text-[#1A202C] capitalize">{statusPedometro}</p>
                <p className="text-[#6B7685] text-[12px] mt-1">{pedometro?.deviceId || 'Aguardando consulta'}</p>
                {nomeConta ? (
                  <p className="text-[#6B7685] text-[12px] mt-1">Conta: {nomeConta}</p>
                ) : null}
              </div>

              <div className="rounded-md border border-[#E4E7EB] bg-[#F8FAFB] p-3">
                <p className="text-[#6B7685] text-[12px] mb-1">Passos hoje</p>
                <p className="font-bold text-[24px] text-[#1A202C] leading-none">
                  {carregando && !pedometro ? 'Carregando...' : passosHoje.toLocaleString('pt-BR')}
                </p>
                <p className="text-[#6B7685] text-[12px] mt-1">
                  Media {mediaDiaria.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} passos/min
                </p>
              </div>

              <div className="rounded-md border border-[#E4E7EB] bg-[#F8FAFB] p-3">
                <p className="text-[#6B7685] text-[12px] mb-1">Agua confirmada</p>
                <p className="font-bold text-[24px] text-[#1A202C] leading-none">
                  {aguaMl.toLocaleString('pt-BR')}ml
                </p>
                <p className="text-[#6B7685] text-[12px] mt-1">{copoAguaMl}ml por toque</p>
              </div>

              <div className="rounded-md border border-[#E4E7EB] bg-[#F8FAFB] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      color: luminaria.hex,
                      backgroundColor: `${luminaria.hex}18`,
                      boxShadow: luminaria.nivel > 0 ? `0 0 16px ${luminaria.hex}70` : 'none',
                    }}
                  >
                    <FiSun size={15} />
                  </span>
                  <p className="text-[#6B7685] text-[12px]">Luminaria</p>
                </div>
                <p className="font-bold text-[18px] text-[#1A202C]">{luminaria.label}</p>
                <p className="text-[#6B7685] text-[12px] mt-1">
                  {resetLabel ? `Reseta em ${resetLabel}` : 'Reset diario aguardando'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-bold text-[16px] text-[#1A202C]">Missoes Connect+</h2>
            {resetLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(28,151,112,0.1)] px-3 py-1 text-[12px] font-bold text-[#1c9770]">
                <FiClock size={13} />
                Reseta em {resetLabel}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {missoesPrincipais.map((missao) => {
              const Icon = escolherIconeMissao(missao.tipo)

              return (
                <div
                  key={missao.id}
                  className={`bg-white rounded-md border shadow-brand-card p-3 ${
                    missao.concluida
                      ? 'border-[rgba(28,151,112,0.35)] bg-[rgba(28,151,112,0.03)]'
                      : 'border-[#E4E7EB]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${
                      missao.concluida ? 'bg-[#1c9770]' : 'bg-[rgba(28,151,112,0.1)]'
                    }`}>
                      <Icon size={22} color={missao.concluida ? '#fff' : '#1c9770'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-[14px] text-[#1A202C] leading-snug">
                          {missao.titulo}
                        </p>
                        <span className="text-[#1c9770] text-[12px] font-bold shrink-0">
                          {missao.trofeus} trofeus
                        </span>
                      </div>
                      <p className="text-[#6B7685] text-[12px] mt-1">
                        {formatarValorMissao(missao)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full bg-[#E4E7EB] h-2 overflow-hidden">
                    <div
                      className={`rounded-full h-2 ${missao.concluida ? 'bg-[#93CB52]' : 'bg-[#1c9770]'}`}
                      style={{ width: `${missao.progresso}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="font-bold text-[#1c9770] text-[12px]">
                      {missao.progresso}%
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      missao.concluida
                        ? 'bg-[rgba(147,203,82,0.18)] text-[#167a5a]'
                        : 'bg-[#F0F2F5] text-[#6B7685]'
                    }`}>
                      {missao.concluida ? 'Concluida' : 'Em progresso'}
                    </span>
                  </div>

                  {missao.concluida && missao.resetEm?.label && (
                    <p className="text-[#1c9770] text-[12px] font-bold mt-2">
                      Reseta em {missao.resetEm.label}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="mb-4">
          <h2 className="font-bold text-[16px] text-[#1A202C] mb-3">Conquistas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {conquistas.map(({ id, title, desc, conquistado }) => (
              <div
                key={id}
                className="bg-white rounded-md border border-[#E4E7EB] shadow-brand-card p-3 flex items-center gap-3 opacity-70"
              >
                <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-[rgba(28,151,112,0.08)]">
                  <FiAward size={18} color="#1c9770" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[14px] text-[#1A202C]">{title}</p>
                  <p className="text-[#6B7685] text-[12px]">{desc}</p>
                </div>
                <span className="rounded-full bg-[#E4E7EB] text-[#6B7685] px-2 py-0.5 text-[11px] font-medium">
                  {conquistado ? 'Conquistada' : 'Bloqueada'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="rounded-md p-3 border border-[rgba(28,151,112,0.2)] bg-[rgba(28,151,112,0.07)] flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[12px] text-[#1c9770]">Em breve</p>
              <p className="text-[#6B7685] text-[12px]">
                Novas leituras da pulseira a caminho: frequencia cardiaca, sono e muito mais.
              </p>
            </div>
            <FiArrowRight size={16} color="#1c9770" />
          </div>
        </section>
      </main>

      <Bottomnav activePage="home" />
    </div>
  )
}

export default Connect

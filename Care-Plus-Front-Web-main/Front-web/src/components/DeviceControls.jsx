import { useEffect, useRef, useState } from 'react'
import { FiActivity, FiAlertTriangle, FiChevronDown } from 'react-icons/fi'
import { useCare } from '../services/CareContext.jsx'
import { post } from '../services/api.js'
import ModalConfirmacao from './ModalConfirmacao.jsx'

export default function DeviceControls() {
  const { data, error, refresh } = useCare()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [resetGeneration, setResetGeneration] = useState(null)
  const [missionOpen, setMissionOpen] = useState(false)
  const missionMenu = useRef(null)
  useEffect(() => {
    function closeOnOutside(event) {
      if (!missionMenu.current?.contains(event.target)) setMissionOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [])
  if (!data) return <p role="status">{error || 'Carregando conexão…'}</p>
  const lampColor = data.luminaria.nivel > 0 || data.sos ? data.luminaria.hex : '#9BA3AE'
  const lampGlow = data.luminaria.nivel > 0 || data.sos
  const devices = [...data.devices].sort((a, b) => (a.kind === 'band' ? 0 : 1) - (b.kind === 'band' ? 0 : 1) || a.deviceId.localeCompare(b.deviceId))
  async function act(path, values) {
    setBusy(true)
    setActionError('')
    try { await post(path, { generation: data.generation, ...values }); refresh(); setResetGeneration(null) }
    catch (err) { setActionError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <section className={`mb-4 rounded-xl border shadow-brand-card p-4 text-[13px] ${data.demo ? 'border-[#8DDBC2] bg-[#F0FBF6] md:p-6' : 'border-[#E4E7EB] bg-white'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 ${data.demo ? 'mb-4' : 'mb-3'}`}>
        <div className={data.demo ? 'flex items-center gap-3' : ''}>
          {data.demo && <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#147C5C] text-xl font-bold text-white shadow-sm">▶</span>}
          <div>
            {data.demo && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#147C5C]">Sessão ativa</p>}
            <h2 className={`font-bold text-[#1A202C] ${data.demo ? 'text-[22px] leading-tight' : 'text-[16px]'}`}>{data.demo ? 'Modo demonstração' : 'Atividade diária'}</h2>
          </div>
        </div>
        <button disabled={busy} className={`font-bold disabled:opacity-50 ${data.demo ? 'rounded-lg border border-[#147C5C] bg-white px-4 py-2.5 text-[#126C51] shadow-sm hover:bg-[#E2F5EC]' : 'text-[#1c9770]'}`} onClick={() => act('/demo/mode', { demo: !data.demo })}>
          {data.demo ? 'Voltar ao modo diário' : 'Ativar demonstração'}
        </button>
      </div>
      <p className={`${data.demo ? 'mb-5 rounded-lg border border-[#C4EBD9] bg-white px-4 py-3 text-[14px] font-medium text-[#245344]' : 'mb-3 text-[#6B7685]'}`}>{data.demo ? 'Metas reduzidas. Progresso e resgates desta sessão são demonstrativos.' : 'Metas do dia. O progresso é salvo mesmo com o navegador fechado.'}</p>
      {error && <p role="alert" className="text-red-700 mb-2">API sem atualização: {error}. Os valores exibidos são a última consulta.</p>}
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        {data.devices.length === 0 && <p>Nenhum aparelho configurado nesta conta.</p>}
        {devices.map(d => <div key={d.deviceId} className={data.demo ? 'rounded-xl border border-[#C4EBD9] bg-white p-4 shadow-sm' : 'bg-[#F4F6F8] p-3 rounded-md'}>
          {data.demo && <div className="mb-3 flex items-center gap-3">
            {d.kind === 'band' ? (
              <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E0F5ED] text-[#126C51] shadow-inner">
                <FiActivity size={34} strokeWidth={2.5} />
              </span>
            ) : (
              <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#F4F6F8]" style={{ boxShadow: lampGlow ? `0 0 22px ${lampColor}88` : 'none' }}>
                <svg viewBox="0 0 64 64" className="h-12 w-12" fill="none" aria-hidden="true">
                  <path d="M32 5C27 16 14 21 15 38c0 11 7 19 17 19s17-8 17-19c0-9-4-14-7-19-2 7-6 10-7 11C37 20 35 12 32 5Z" fill={lampColor} stroke="#245344" strokeWidth="2" strokeLinejoin="round" />
                  <ellipse cx="32" cy="42" rx="12" ry="10" fill="white" fillOpacity={lampGlow ? '.72' : '.35'} />
                  <circle cx="27" cy="39" r="1.7" fill="#245344" /><circle cx="38" cy="39" r="1.7" fill="#245344" />
                  <path d="M30 45q2 2 5 0" stroke="#245344" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#567368]">{d.kind === 'band' ? 'Sua pulseira' : 'Sua luminária'}</p>
              <p className="text-[17px] font-bold capitalize text-[#1A202C]">{error ? 'sem atualização' : d.status}</p>
              {d.kind === 'lamp' && <p className="text-[12px] font-semibold text-[#245344]">{data.luminaria.label}</p>}
            </div>
          </div>}
          {!data.demo && <p className="font-bold">{d.kind === 'band' ? 'Pulseira' : 'Luminária'}: {error ? 'sem atualização' : d.status}</p>}
          <p>{d.lastSeen ? `Última comunicação: ${new Date(d.lastSeen * 1000).toLocaleTimeString('pt-BR')}` : 'Aguardando primeira comunicação'}</p>
          {d.resetPending && <p className="text-amber-700">Sincronização da sessão pendente no aparelho.</p>}
          {d.diagnostics?.queueFull && <p className="text-red-700">Fila cheia: reconecte o aparelho para continuar registrando.</p>}
          {d.diagnostics?.sensorOk === false && <p className="text-red-700">Verifique a conexão do MPU6050.</p>}
          {d.kind === 'band' && <p>{d.diagnostics?.queueDepth || 0} eventos aguardavam envio na última comunicação.</p>}
        </div>)}
      </div>
      <div className={`mb-3 rounded-md border p-3 ${data.demo ? 'border-[#C4EBD9] bg-white' : 'border-[#E4E7EB]'}`}>
        <p>Cor solicitada: <strong>{data.luminaria.label}</strong></p>
        <p>Cor aplicada informada: <strong>{data.luminaria.aplicada || 'sem confirmação'}</strong></p>
        <p>{!error && data.luminaria.confirmada ? 'Aplicação confirmada recentemente pela luminária.' : 'Aguardando confirmação atual da luminária.'}</p>
      </div>
      {data.sos && <div role="alert" className={data.demo ? 'mb-5 flex flex-col gap-4 rounded-xl border-2 border-red-500 bg-red-700 p-5 text-white shadow-lg shadow-red-700/25 md:flex-row md:items-center md:justify-between' : 'mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-red-800'}>
        <div className={data.demo ? 'flex items-start gap-3' : ''}>
          {data.demo && <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20"><FiAlertTriangle size={28} /></span>}
          <div>
            <p className={data.demo ? 'text-[21px] font-extrabold' : 'font-bold'}>Alerta SOS recebido</p>
            <p className={data.demo ? 'mt-1 text-[14px] text-red-50' : ''}>Registrado no site e sinalizado em vermelho. Nenhum contato externo é acionado.</p>
          </div>
        </div>
        <button disabled={busy} className={data.demo ? 'shrink-0 rounded-lg bg-white px-5 py-3 text-[14px] font-bold text-red-800 shadow-sm hover:bg-red-50 disabled:opacity-50' : 'mt-2 font-bold underline'} onClick={() => act('/sos/resolve')}>Encerrar alerta SOS</button>
      </div>}
      <div className={data.demo ? 'mb-4 rounded-xl border border-[#C4EBD9] bg-white p-4' : ''}>
        <p id="selectedMissionLabel" className={`font-bold block mb-2 ${data.demo ? 'text-[16px] text-[#1A202C]' : ''}`}>Missão para confirmar com o botão 2 da pulseira</p>
        <div className="relative mb-2" ref={missionMenu} onKeyDown={event => { if (event.key === 'Escape') { setMissionOpen(false); event.currentTarget.querySelector('button')?.focus() } }}>
          <button type="button" disabled={busy} aria-expanded={missionOpen} aria-haspopup="menu" aria-labelledby="selectedMissionLabel selectedMissionValue" onClick={() => setMissionOpen(open => !open)} className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3.5 text-left text-[14px] font-semibold text-[#1A202C] shadow-sm transition-all duration-200 hover:border-[#147C5C] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147C5C] disabled:opacity-50 ${missionOpen ? 'border-[#147C5C] shadow-md' : 'border-[#B7DDCD]'}`}>
            <span id="selectedMissionValue" className="truncate">{data.selection?.titulo || 'Escolha uma missão'}</span>
            <FiChevronDown aria-hidden="true" className={`shrink-0 text-[#147C5C] transition-transform duration-200 ${missionOpen ? 'rotate-180' : ''}`} size={20} />
          </button>
          {missionOpen && <div role="menu" aria-labelledby="selectedMissionLabel" className="mission-menu-enter absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[#C4EBD9] bg-white p-2 shadow-xl shadow-[#1A202C]/10">
            <button type="button" role="menuitemradio" aria-checked={!data.selection} className={`mb-1 w-full rounded-lg px-3 py-3 text-left text-[14px] transition-colors hover:bg-[#F0FBF6] ${!data.selection ? 'bg-[#E5F6ED] font-bold text-[#126C51]' : 'text-[#4A5568]'}`} onClick={() => { setMissionOpen(false); if (data.selection) act('/missions/cancel') }}>Nenhuma missão selecionada</button>
            {data.manuais.filter(m => !m.concluida).map(m => <button type="button" role="menuitemradio" aria-checked={data.selection?.id === m.id} key={m.id} className={`mb-1 w-full rounded-lg px-3 py-3 text-left text-[14px] transition-colors last:mb-0 hover:bg-[#F0FBF6] ${data.selection?.id === m.id ? 'bg-[#E5F6ED] font-bold text-[#126C51]' : 'text-[#1A202C]'}`} onClick={() => { setMissionOpen(false); if (data.selection?.id !== m.id) act('/missions/select', { idMissao: m.id }) }}>{m.titulo || m.missao}</button>)}
          </div>}
        </div>
        <p className={data.demo ? 'text-[13px] text-[#4A5568]' : 'mb-3 text-[#6B7685]'}>{data.selection ? `Selecionada: ${data.selection.titulo}. Aguarde a sincronização da pulseira antes de apertar o botão 2 da pulseira.` : 'Escolha uma missão manual. O botão 3 da pulseira cancela a seleção e preserva seu progresso.'}</p>
      </div>
      {data.demo && <button disabled={busy} className="rounded-lg border border-red-300 bg-white px-4 py-2.5 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={() => setResetGeneration(data.generation)}>Reiniciar demonstração</button>}
      {actionError && <p role="alert" className="text-red-700 mt-2">{actionError}</p>}
      {busy && <p role="status" className="mt-2">Salvando…</p>}
      <ModalConfirmacao aberto={Boolean(resetGeneration)} titulo="Reiniciar demonstração?" descricao="Passos, água, missões, pontos, resgates e SOS desta sessão serão zerados. Cadastro e configuração dos aparelhos serão preservados. Aparelhos offline sincronizarão quando voltarem." textoConfirmar={busy ? 'Reiniciando…' : 'Reiniciar'} onClose={() => !busy && setResetGeneration(null)} onConfirm={() => !busy && act('/demo/reset', { confirmation: 'REINICIAR', generation: resetGeneration })} />
    </section>
  )
}

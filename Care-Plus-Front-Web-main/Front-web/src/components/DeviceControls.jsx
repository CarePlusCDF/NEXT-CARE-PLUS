import { useState } from 'react'
import { useCare } from '../services/CareContext.jsx'
import { post } from '../services/api.js'
import ModalConfirmacao from './ModalConfirmacao.jsx'

export default function DeviceControls() {
  const { data, error, refresh } = useCare()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [resetGeneration, setResetGeneration] = useState(null)
  if (!data) return <p role="status">{error || 'Carregando conexão…'}</p>
  async function act(path, values) {
    setBusy(true)
    setActionError('')
    try { await post(path, { generation: data.generation, ...values }); refresh(); setResetGeneration(null) }
    catch (err) { setActionError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <section className="mb-4 bg-white rounded-xl border border-[#E4E7EB] shadow-brand-card p-4 text-[13px]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="font-bold text-[16px] text-[#1A202C]">{data.demo ? 'Modo demonstração' : 'Atividade diária'}</h2>
        <button disabled={busy} className="text-[#1c9770] font-bold disabled:opacity-50" onClick={() => act('/demo/mode', { demo: !data.demo })}>
          {data.demo ? 'Voltar ao modo diário' : 'Ativar demonstração'}
        </button>
      </div>
      <p className="text-[#6B7685] mb-3">{data.demo ? 'Metas reduzidas. Progresso e resgates desta sessão são demonstrativos.' : 'Metas do dia. O progresso é salvo mesmo com o navegador fechado.'}</p>
      {error && <p role="alert" className="text-red-700 mb-2">API sem atualização: {error}. Os valores exibidos são a última consulta.</p>}
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        {data.devices.length === 0 && <p>Nenhum aparelho configurado nesta conta.</p>}
        {data.devices.map(d => <div key={d.deviceId} className="bg-[#F4F6F8] p-3 rounded-md">
          <p className="font-bold">{d.kind === 'band' ? 'Pulseira' : 'Luminária'}: {error ? 'sem atualização' : d.status}</p>
          <p>{d.lastSeen ? `Última comunicação: ${new Date(d.lastSeen * 1000).toLocaleTimeString('pt-BR')}` : 'Aguardando primeira comunicação'}</p>
          {d.resetPending && <p className="text-amber-700">Sincronização da sessão pendente no aparelho.</p>}
          {d.diagnostics?.queueFull && <p className="text-red-700">Fila cheia: reconecte o aparelho para continuar registrando.</p>}
          {d.diagnostics?.sensorOk === false && <p className="text-red-700">Verifique a conexão do MPU6050.</p>}
          {d.kind === 'band' && <p>{d.diagnostics?.queueDepth || 0} eventos aguardavam envio na última comunicação.</p>}
        </div>)}
      </div>
      <div className="mb-3 rounded-md border border-[#E4E7EB] p-3">
        <p>Cor solicitada: <strong>{data.luminaria.label}</strong></p>
        <p>Cor aplicada informada: <strong>{data.luminaria.aplicada || 'sem confirmação'}</strong></p>
        <p>{!error && data.luminaria.confirmada ? 'Aplicação confirmada recentemente pela luminária.' : 'Aguardando confirmação atual da luminária.'}</p>
      </div>
      {data.sos && <div role="alert" className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-red-800">
        <p className="font-bold">Alerta SOS recebido</p>
        <p>Registrado no site e sinalizado em vermelho. Nenhum contato externo é acionado.</p>
        <button disabled={busy} className="mt-2 font-bold underline" onClick={() => act('/sos/resolve')}>Encerrar alerta SOS</button>
      </div>}
      <label htmlFor="selectedMission" className="font-bold block mb-2">Missão para confirmar pelo BTN2</label>
      <select id="selectedMission" disabled={busy} value={data.selection?.id || ''} className="w-full border border-[#E4E7EB] rounded-md p-2 mb-2" onChange={e => e.target.value ? act('/missions/select', { idMissao: e.target.value }) : act('/missions/cancel')}>
        <option value="">Nenhuma missão selecionada</option>
        {data.manuais.filter(m => !m.concluida).map(m => <option key={m.id} value={m.id}>{m.titulo || m.missao}</option>)}
      </select>
      <p className="text-[#6B7685] mb-3">{data.selection ? `Selecionada: ${data.selection.titulo}. Aguarde a sincronização da pulseira antes de apertar BTN2.` : 'Escolha uma missão manual. BTN3 cancela a seleção e preserva seu progresso.'}</p>
      {data.demo && <button disabled={busy} className="border border-red-200 text-red-700 rounded-md px-3 py-2 font-bold" onClick={() => setResetGeneration(data.generation)}>Reiniciar demonstração</button>}
      {actionError && <p role="alert" className="text-red-700 mt-2">{actionError}</p>}
      {busy && <p role="status" className="mt-2">Salvando…</p>}
      <ModalConfirmacao aberto={Boolean(resetGeneration)} titulo="Reiniciar demonstração?" descricao="Passos, água, missões, pontos, resgates e SOS desta sessão serão zerados. Cadastro e configuração dos aparelhos serão preservados. Aparelhos offline sincronizarão quando voltarem." textoConfirmar={busy ? 'Reiniciando…' : 'Reiniciar'} onClose={() => !busy && setResetGeneration(null)} onConfirm={() => !busy && act('/demo/reset', { confirmation: 'REINICIAR', generation: resetGeneration })} />
    </section>
  )
}

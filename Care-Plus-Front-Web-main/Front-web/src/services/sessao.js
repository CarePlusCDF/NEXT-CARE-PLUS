import { apiFetch } from './api.js'
import { API_URL } from './api.js'
export { API_URL } from './api.js'

export function chaveBeneficiosSessao(carteirinha) {
  return `beneficiosSessaoAtiva:${carteirinha}`
}

export function marcarBeneficiosSessaoAtiva(carteirinha) {
  if (!carteirinha) return

  sessionStorage.setItem(chaveBeneficiosSessao(carteirinha), 'true')
}

export function salvarSessaoUsuario(usuario, token) {
  if (!usuario?.carteirinha) return

  if (token) {
    localStorage.setItem('token', token)
    window.dispatchEvent(new Event('sessaoAlterada'))
  }
  if (usuario.generation) localStorage.setItem('generation', usuario.generation)
  localStorage.setItem('carteirinha', usuario.carteirinha)
  localStorage.setItem('nome', usuario.nome || '')
  localStorage.setItem('trofeus', usuario.trofeus || 0)
  marcarBeneficiosSessaoAtiva(usuario.carteirinha)
  window.dispatchEvent(new Event('trofeusAtualizados'))
}

export function limparSessaoUsuario() {
  const carteirinha = localStorage.getItem('carteirinha')

  if (carteirinha) {
    sessionStorage.removeItem(chaveBeneficiosSessao(carteirinha))
  }

  localStorage.removeItem('token')
  window.dispatchEvent(new Event('sessaoAlterada'))
  localStorage.removeItem('generation')
  localStorage.removeItem('carteirinha')
  localStorage.removeItem('nome')
  localStorage.removeItem('trofeus')
  window.dispatchEvent(new Event('trofeusAtualizados'))
}

export function redirecionarLogin(navigate) {
  limparSessaoUsuario()
  navigate('/login', { replace: true })
}

export async function buscarUsuarioLogado(navigate) {
  const carteirinha = localStorage.getItem('carteirinha')

  if (!carteirinha || !localStorage.getItem('token')) {
    redirecionarLogin(navigate)
    return null
  }

  const resposta = await apiFetch(`${API_URL}/usuario/${carteirinha}`)
  const usuario = await resposta.json()

  if (resposta.status === 401 || resposta.status === 403 || !usuario) {
    redirecionarLogin(navigate)
    return null
  }

  if (!resposta.ok) throw new Error('Não foi possível consultar a conta.')
  salvarSessaoUsuario(usuario)
  return usuario
}

export async function carregarBeneficiosDaSessao(carteirinha, quantidade = 6) {
  if (!carteirinha) return []

  const renovar = !sessionStorage.getItem(chaveBeneficiosSessao(carteirinha))
  const parametros = new URLSearchParams({
    quantidade: String(quantidade),
    carteirinha,
    renovar: String(renovar),
  })

  const resposta = await apiFetch(`${API_URL}/beneficios-sorteados?${parametros}`)
  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(dados.detail || 'Não foi possível carregar os benefícios.')
  }

  marcarBeneficiosSessaoAtiva(carteirinha)

  return dados
}
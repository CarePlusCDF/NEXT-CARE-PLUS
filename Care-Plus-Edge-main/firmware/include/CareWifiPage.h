#pragma once
#include <Arduino.h>

static const char CARE_WIFI_PAGE[] PROGMEM = R"HTML(<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Care Plus · Configurar Wi-Fi</title>
<style nonce="%NONCE%">
*{box-sizing:border-box}body{margin:0;background:#f4f6f8;color:#16354f;font:16px system-ui,sans-serif}main{max-width:620px;margin:24px auto;padding:16px}.card{background:white;border:1px solid #dce3e9;border-radius:20px;padding:24px;box-shadow:0 2px 4px #1932490a}h1{font-size:24px;margin:6px 0 12px}h2{font-size:18px}p{line-height:1.55}.brand{color:#00a88f;font-weight:750}.muted,small{color:#637b8d}label{display:block;font-weight:600;margin:18px 0 6px}input,select,button{width:100%;font:inherit;border-radius:10px;padding:12px;border:1px solid #cbd7de}input,select{background:white;color:#16354f}button{cursor:pointer;background:#00a88f;border-color:#00a88f;color:white;font-weight:650;margin-top:16px}button.secondary{background:white;color:#008a79}button:disabled{opacity:.5;cursor:wait}input[type=checkbox]{width:auto;margin-right:8px}.check{font-weight:400}.status{background:#e8f6f2;padding:14px;border-radius:12px;white-space:pre-line}#message{margin-top:18px;white-space:pre-line}#message.error{color:#b52d34}#message.success{color:#00806e}small{display:block;margin-top:6px}hr{border:0;border-top:1px solid #e0e7ed;margin:24px 0}[hidden]{display:none!important}
</style></head><body><main><div class="card">
<div class="brand">Care Plus · Boost Care</div><h1>Configurar Wi-Fi</h1>
<p id="device" class="muted">Carregando aparelho…</p>
<p>Cadastre uma rede de <strong>2,4 GHz</strong>. Esta página funciona diretamente no aparelho. Mantenha o celular conectado a esta rede, mesmo que ele avise “sem internet”.</p>
<div id="connection" class="status" role="status" aria-live="polite">Consultando conexão…</div>
<form id="form">
<label for="slot">Qual rede deseja configurar?</label><select id="slot"><option value="0">Rede principal</option><option value="1">Rede alternativa / celular</option></select>
<small id="stored"></small>
<button type="button" id="scan" class="secondary">Buscar redes próximas</button>
<label for="networks">Redes encontradas</label><select id="networks"><option value="">Busque ou digite o nome abaixo</option></select>
<label for="ssid">Nome da rede (SSID)</label><input id="ssid" required autocomplete="off" maxlength="32">
<small>Copie o nome exatamente. Para rede oculta, digite o nome.</small>
<label for="password">Senha da rede</label><input id="password" type="password" autocomplete="new-password" maxlength="64">
<label class="check"><input id="show" type="checkbox">Mostrar senha digitada</label>
<label class="check"><input id="open" type="checkbox">Esta rede não tem senha</label>
<button id="save" type="submit">Salvar e testar conexão</button>
<button id="cancel" type="button" class="secondary" hidden>Cancelar tentativa</button>
</form>
<div id="message" role="status" aria-live="polite"></div>
<hr><h2>Seu progresso continua salvo</h2><p class="muted">A alteração afeta somente o Wi-Fi deste aparelho. A leitura de botões e sensores continua ativa. Para configurar pulseira e luminária, repita o procedimento na rede de cada uma.</p>
<p class="muted">A nova configuração é salva após conectar e confirmar acesso à API. Em caso de falha, as redes anteriores são mantidas. Redes que exigem login ou aceite em página web não são suportadas.</p>
<small>A página pode perder conexão por alguns segundos durante a troca de canal Wi-Fi. Se necessário, reconecte à rede CarePlus e abra http://192.168.4.1 novamente.</small>
</div></main>
<script nonce="%NONCE%">
'use strict';
const csrf='%NONCE%', $=id=>document.getElementById(id);
let state=null, scanning=false, lastTrial='', saving=false, stopPolling=false;
function message(text,kind=''){ $('message').textContent=text; $('message').className=kind; }
function busy(active){for(const id of ['slot','ssid','password','open','networks','scan','save'])$(id).disabled=active;$('password').disabled=active||$('open').checked;$('cancel').hidden=!active;}
async function api(path,body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);try{const options={cache:'no-store',signal:controller.signal};if(body!==undefined){options.method='POST';options.headers={'Content-Type':'application/json','X-Care-CSRF':csrf};options.body=JSON.stringify(body);}const response=await fetch(path,options);const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível concluir.');return data;}finally{clearTimeout(timer);}}
function stored(){if(!state)return;const n=state.slots[Number($('slot').value)];$('stored').textContent=n.ssid?'Rede salva: '+n.ssid:'Nenhuma rede salva nesta posição.';}
function loadSlot(){stored();const n=state?.slots[Number($('slot').value)];$('ssid').value=n?.ssid||'';$('password').value='';$('open').checked=!!n?.open;$('password').disabled=$('open').checked;}
async function status(){if(stopPolling)return;try{const next=await api('/api/status');const first=!state;state=next;$('device').textContent=next.device+' · '+next.portal;$('connection').textContent=next.connected?'Wi-Fi conectado: '+next.ssid+'\n'+(next.api_recent?'Comunicação com a API confirmada.':'Aguardando comunicação com a API…'):'Aparelho procurando uma rede com acesso à API.';if(first)loadSlot();else stored();busy(next.trial==='testing'||saving);if(next.trial==='testing'){message('Testando a rede. Aguarde até '+next.remaining+' segundos.');}else if(next.trial!==lastTrial){if(next.trial==='saved'){message('Rede salva e comunicação com a API confirmada.\nA rede de configuração será encerrada. Volte ao Wi-Fi habitual e confira o aparelho no site.','success');$('password').value='';}else if(next.trial==='error'||next.trial==='cancelled'){message(next.message,'error');}}lastTrial=next.trial;}catch(e){if(lastTrial==='saved'){stopPolling=true;}else message('Aguardando o aparelho. Mantenha a conexão com a rede CarePlus; a troca de canal pode interromper esta página por alguns segundos.');}if(!stopPolling)setTimeout(status,2000);}
async function scanResults(){try{const data=await api('/api/networks');if(data.running){setTimeout(scanResults,1500);return;}$('networks').replaceChildren(new Option('Selecione uma rede ou digite o nome',''));for(const n of data.networks){const o=new Option(n.ssid+' · '+n.rssi+' dBm'+(n.secured?'':' · sem senha'),n.ssid);o.dataset.open=String(!n.secured);$('networks').append(o);}message(data.error||'Busca concluída. Você também pode digitar uma rede oculta.');}catch(e){message(e.message,'error');}scanning=false;$('scan').disabled=false;}
$('scan').addEventListener('click',async()=>{if(scanning)return;scanning=true;$('scan').disabled=true;try{await api('/api/scan',{});message('Buscando redes…');scanResults();}catch(e){scanning=false;$('scan').disabled=false;message(e.message,'error');}});
$('slot').addEventListener('change',loadSlot);
$('networks').addEventListener('change',()=>{const o=$('networks').selectedOptions[0];if(!o.value)return;$('ssid').value=o.value;$('open').checked=o.dataset.open==='true';$('password').disabled=$('open').checked;if($('open').checked)$('password').value='';});
$('show').addEventListener('change',()=>{$('password').type=$('show').checked?'text':'password';});
$('open').addEventListener('change',()=>{$('password').disabled=$('open').checked;if($('open').checked)$('password').value='';});
$('form').addEventListener('submit',async e=>{e.preventDefault();if(scanning){message('Aguarde a busca terminar antes de testar a rede.');return;}saving=true;busy(true);try{await api('/api/save',{slot:Number($('slot').value),ssid:$('ssid').value,password:$('open').checked?'':$('password').value,open:$('open').checked});$('password').value='';lastTrial='testing';message('Testando a rede. A configuração anterior será preservada se não funcionar.');}catch(error){message(error.message,'error');}saving=false;});
$('cancel').addEventListener('click',async()=>{try{await api('/api/cancel',{});message('Tentativa cancelada. Redes anteriores preservadas.');}catch(e){message(e.message,'error');}});
status();
</script></body></html>)HTML";

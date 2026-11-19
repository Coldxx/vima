// VM Note: o que mexe na página. Tudo funciona aqui no navegador; nada é enviado para lugar nenhum.
(function () {
  'use strict';
  var raiz = document.documentElement;
  var semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toque = matchMedia('(pointer: coarse)');
  var reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var reaisInteiros = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 });

  /* ---------- celular da abertura: escala para caber no bloco ---------- */
  var palco = document.querySelector('.palco');
  function escalar() {
    if (!palco) return;
    var largo = innerWidth >= 1100, medio = innerWidth >= 600;
    var k = 0.8, alto = 750, frase = 540;
    if (largo) {
      var pw = palco.clientWidth, ph = palco.clientHeight;
      k = Math.max(0.56, Math.min(0.86, (pw * 0.34 - 20) / 375));
      alto = Math.max(520, Math.min(812, (ph - 48 - 20) / k));
      frase = Math.max(280, pw - 40 - (375 * k + 20) - 48);
    } else if (!medio) k = Math.max(0.6, Math.min(0.8, (palco.clientWidth - 40 - 20) / 375));
    raiz.style.setProperty('--k', k.toFixed(3));
    raiz.style.setProperty('--frase', Math.round(frase) + 'px');
    raiz.style.setProperty('--alto', Math.round(alto) + 'px');
  }
  escalar();
  addEventListener('resize', escalar);

  /* ---------- tela cheia do cardápio (no toque, ou pelo link do painel) ---------- */
  var dialogo = document.getElementById('tela-cheia');
  function abrirTelaCheia() {
    if (!dialogo || typeof dialogo.showModal !== 'function') return false;
    var f = dialogo.querySelector('iframe');
    if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src'));
    dialogo.showModal();
    return true;
  }
  document.querySelectorAll('[data-abrir-exemplo]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var noPainel = a.classList.contains('link-painel');
      if (noPainel && !toque.matches) return; // no computador, sobe até o celular da abertura
      if (abrirTelaCheia()) e.preventDefault();
    });
  });
  if (dialogo) {
    dialogo.querySelector('[data-fechar]').addEventListener('click', function () { dialogo.close(); });
  }

  /* ---------- aberto ou fechado (horário da pizzaria de exemplo: ter a dom, 18h às 23h30) ---------- */
  var DIAS_ABERTOS = [0, 2, 3, 4, 5, 6], ABRE = 18 * 60, FECHA = 23 * 60 + 30;
  var NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function agora() {
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var pega = function (t) { return p.filter(function (x) { return x.type === t; })[0].value; };
      return { dia: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[pega('weekday')], min: (+pega('hour') % 24) * 60 + (+pega('minute')) };
    } catch (e) { var d = new Date(); return { dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
  }
  var st = document.querySelector('[data-status]');
  if (st) {
    var a = agora(), txt;
    if (DIAS_ABERTOS.indexOf(a.dia) >= 0 && a.min >= ABRE && a.min < FECHA) txt = 'Aberto agora · até 23h30';
    else {
      for (var k = 0; k < 8; k++) {
        var d = (a.dia + k) % 7;
        if (DIAS_ABERTOS.indexOf(d) >= 0 && (k > 0 || a.min < ABRE)) { txt = 'Fechado · abre ' + (k === 0 ? 'hoje' : k === 1 ? 'amanhã' : NOMES[d]) + ' às 18h'; break; }
      }
      st.parentNode.classList.add('fechado');
    }
    st.textContent = txt;
  }

  /* ---------- como o pedido chega: a mesma mensagem que o cardápio monta ---------- */
  var balao = document.getElementById('balao');
  var form = document.querySelector('.controles');
  var est = { pizza: 1, refri: 1, borda: true, obs: true, tipo: 'entrega', pag: 'Dinheiro', troco: '100' };
  function mensagem() {
    var L = ['*Novo pedido · Forno da Praça*', ''], total = 0;
    if (est.pizza > 0) {
      var unit = 49.9 + (est.borda ? 10 : 0); /* com dois sabores vale o mais caro: Calabresa 49,90 */
      total += unit * est.pizza;
      L.push(est.pizza + 'x Pizza grande · 1/2 Calabresa + 1/2 Margherita' + (est.borda ? ' · Borda de catupiry' : '') + ' — ' + reais.format(unit * est.pizza));
      if (est.obs) L.push('   _obs.: sem cebola_');
    }
    if (est.refri > 0) { total += 14 * est.refri; L.push(est.refri + 'x Refrigerante 2 L · Cola — ' + reais.format(14 * est.refri)); }
    if (!est.pizza && !est.refri) return null;
    L.push('', '*Total dos itens: ' + reais.format(total) + '*');
    if (est.tipo === 'entrega') L.push('Taxa de entrega: a combinar', '', '*Entrega*', 'Av. Atlântica, 1200, apto 302, Cavaleiros');
    else L.push('', '*Retirada no local*');
    L.push('Pagamento: ' + est.pag + (est.pag === 'Dinheiro' && est.troco ? ' (troco para R$ ' + est.troco + ')' : ''));
    L.push('Nome: Carla', '', 'Pedido feito pelo cardápio digital');
    return L.join('\n');
  }
  function desenharBalao() {
    if (!balao) return;
    var msg = mensagem();
    balao.textContent = '';
    if (!msg) { balao.textContent = 'Escolha pelo menos um item.'; return; }
    msg.split(/(\*[^*\n]+\*|_[^_\n]+_)/).forEach(function (pedaco) {
      if (/^\*[^*]+\*$/.test(pedaco)) { var b = document.createElement('b'); b.textContent = pedaco.slice(1, -1); balao.append(b); }
      else if (/^_[^_]+_$/.test(pedaco)) { var i = document.createElement('i'); i.textContent = pedaco.slice(1, -1); balao.append(i); }
      else balao.append(document.createTextNode(pedaco));
    });
    var a = agora(), h = document.createElement('span');
    h.className = 'hora'; h.textContent = Math.floor(a.min / 60) + ':' + String(a.min % 60).padStart(2, '0');
    balao.append(h);
  }
  if (form) {
    form.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var mais = b.getAttribute('data-mais'), menos = b.getAttribute('data-menos'), tipo = b.getAttribute('data-tipo');
      if (mais) est[mais] = Math.min(5, est[mais] + 1);
      if (menos) est[menos] = Math.max(0, est[menos] - 1);
      if (tipo) { est.tipo = tipo; form.querySelectorAll('[data-tipo]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
      form.querySelectorAll('[data-qtd]').forEach(function (o) { o.textContent = String(est[o.getAttribute('data-qtd')]); });
      desenharBalao();
    });
    form.addEventListener('change', function (e) {
      var c = e.target.getAttribute('data-campo'); if (!c) return;
      est[c] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      var troco = form.querySelector('[data-so-dinheiro]');
      if (troco) troco.hidden = est.pag !== 'Dinheiro';
      desenharBalao();
    });
  }
  desenharBalao();

  /* ---------- a conta do iFood ---------- */
  var num = document.getElementById('venda-n'), barra = document.getElementById('venda-r');
  var saidas = { min: document.querySelector('[data-c="min"]'), max: document.querySelector('[data-c="max"]'), ano: document.querySelector('[data-c="ano"]') };
  function contar(v) {
    saidas.min.textContent = reaisInteiros.format(Math.round(v * 0.12));
    saidas.max.textContent = reaisInteiros.format(Math.round(v * 0.27));
    saidas.ano.textContent = reaisInteiros.format(Math.max(0, Math.round((v * 0.12 - 49) * 12)));
  }
  function lerNumero(s) { var n = parseInt(String(s).replace(/\D/g, ''), 10); return isFinite(n) ? Math.min(n, 9999999) : 0; }
  function mostrar(v) { return new Intl.NumberFormat('pt-BR').format(v); }
  if (num && barra) {
    barra.addEventListener('input', function () { var v = +barra.value; num.value = mostrar(v); contar(v); });
    num.addEventListener('input', function () {
      var v = lerNumero(num.value);
      barra.value = String(Math.max(+barra.min, Math.min(+barra.max, v)));
      contar(v);
    });
    num.addEventListener('blur', function () { num.value = mostrar(lerNumero(num.value)); });
    contar(lerNumero(num.value));
  }

  /* ---------- entradas: cada parte sobe quando a seção aparece ---------- */
  if (!semMovimento && 'IntersectionObserver' in window) {
    var grupos = [
      ['.abertura', '.faixa, .atalhos a, .onde, .marca-mini, .palco, .afirmacao, .bilhete, .trilho li', true],
      ['.chega', '.chega-topo .titulo, .chega-topo p, .conversa, .controles, .chega-nota'],
      ['.faz', '.tile'],
      ['.conta', '.conta-entrada .titulo, .conta-entrada .venda, .venda-campos, .c-ifood, .c-vm, .c-ano'],
      ['.como', '.campo .titulo, .cartao, .clausula'],
      ['.planos', '.planos-topo .titulo, .planos-topo p, .p-ia, .p-vima'],
      ['.duvidas', '.titulo, details'],
      ['.rodape', '.tile']
    ];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll('.sobe').forEach(function (el) { el.classList.add('visto'); });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    grupos.forEach(function (g) {
      var sec = document.querySelector(g[0]); if (!sec) return;
      sec.querySelectorAll(g[1]).forEach(function (el, i) { el.classList.add('sobe'); el.style.setProperty('--i', String(Math.min(i, 8))); });
      if (g[2]) setTimeout(function () { sec.querySelectorAll('.sobe').forEach(function (el) { el.classList.add('visto'); }); }, 40);
      else io.observe(sec);
    });
    /* as duas telas do cardápio respiram devagar */
    document.querySelectorAll('.t-pizza, .t-pedido').forEach(function (t) { t.classList.add('foto-viva'); });
  }
})();

// VM Note · visual v2: o que mexe na página. Tudo roda aqui no navegador; nada é enviado para lugar nenhum.
(function () {
  'use strict';
  var raiz = document.documentElement;
  var semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toque = matchMedia('(pointer: coarse)');
  var fino = matchMedia('(hover: hover) and (pointer: fine)');
  var temIO = 'IntersectionObserver' in window;
  var reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var reaisInteiros = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 });

  /* ---------- aparecer ao rolar: só esconde depois de marcar a página como pronta ---------- */
  if (!semMovimento && temIO) {
    raiz.classList.add('pronta');
    var porPai = new Map();
    document.querySelectorAll('[data-revela]').forEach(function (el) {
      var p = el.parentElement, n = porPai.get(p) || 0;
      el.style.setProperty('--i', String(Math.min(n, 6)));
      porPai.set(p, n + 1);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-revela]').forEach(function (el) { io.observe(el); });
    /* rede de segurança: se algo não disparou, mostra tudo depois de um tempo ao imprimir */
    addEventListener('beforeprint', function () { document.querySelectorAll('[data-revela]').forEach(function (el) { el.classList.add('visto'); }); });
  }

  /* ---------- barra do topo ganha vidro ao rolar ---------- */
  var barra = document.getElementById('barra');
  function olharBarra() { if (barra) barra.classList.toggle('rolou', scrollY > 12); }
  olharBarra();
  addEventListener('scroll', olharBarra, { passive: true });

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
      var noPainel = a.classList.contains('link-seta');
      if (noPainel && !toque.matches) return; // no computador, sobe até o celular do topo
      if (abrirTelaCheia()) e.preventDefault();
    });
  });
  if (dialogo) dialogo.querySelector('[data-fechar]').addEventListener('click', function () { dialogo.close(); });

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
    var a = agora(), txt = 'Aberto agora · até 23h30';
    if (!(DIAS_ABERTOS.indexOf(a.dia) >= 0 && a.min >= ABRE && a.min < FECHA)) {
      for (var k = 0; k < 8; k++) {
        var d = (a.dia + k) % 7;
        if (DIAS_ABERTOS.indexOf(d) >= 0 && (k > 0 || a.min < ABRE)) { txt = 'Fechado · abre ' + (k === 0 ? 'hoje' : k === 1 ? 'amanhã' : NOMES[d]) + ' às 18h'; break; }
      }
      st.parentNode.classList.add('fechado');
    }
    st.textContent = txt;
  }

  /* ---------- como o pedido chega: a mesma mensagem que o cardápio monta ---------- */
  var zap = document.getElementById('zap');
  var balao = document.getElementById('balao');
  var balaoTxt = document.getElementById('balao-txt');
  var hora = document.getElementById('hora');
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
    return L;
  }
  function desenharBalao() {
    if (!balaoTxt) return;
    var linhas = mensagem();
    balaoTxt.textContent = '';
    if (!linhas) linhas = ['Escolha pelo menos um item.'];
    linhas.forEach(function (linha, i) {
      var s = document.createElement('span');
      s.className = 'lin'; s.style.setProperty('--l', String(i));
      if (!linha) s.textContent = ' ';
      else linha.split(/(\*[^*\n]+\*|_[^_\n]+_)/).forEach(function (pedaco) {
        if (!pedaco) return;
        if (/^\*[^*]+\*$/.test(pedaco)) { var b = document.createElement('b'); b.textContent = pedaco.slice(1, -1); s.append(b); }
        else if (/^_[^_]+_$/.test(pedaco)) { var it = document.createElement('i'); it.textContent = pedaco.slice(1, -1); s.append(it); }
        else s.append(document.createTextNode(pedaco));
      });
      balaoTxt.append(s);
    });
    var a = agora();
    if (hora) hora.textContent = Math.floor(a.min / 60) + ':' + String(a.min % 60).padStart(2, '0');
  }
  var piscar;
  function mudou() {
    if (zap) zap.classList.remove('digita');
    if (balao) {
      balao.classList.remove('montando');
      balao.classList.add('mudou');
      clearTimeout(piscar);
      piscar = setTimeout(function () { balao.classList.remove('mudou'); }, 650);
    }
    desenharBalao();
  }
  if (form) {
    form.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var mais = b.getAttribute('data-mais'), menos = b.getAttribute('data-menos'), tipo = b.getAttribute('data-tipo');
      if (mais) est[mais] = Math.min(5, est[mais] + 1);
      if (menos) est[menos] = Math.max(0, est[menos] - 1);
      if (tipo) { est.tipo = tipo; form.querySelectorAll('[data-tipo]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }
      form.querySelectorAll('[data-qtd]').forEach(function (o) { o.textContent = String(est[o.getAttribute('data-qtd')]); });
      mudou();
    });
    form.addEventListener('change', function (e) {
      var c = e.target.getAttribute('data-campo'); if (!c) return;
      est[c] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      var troco = form.querySelector('[data-so-dinheiro]');
      if (troco) troco.hidden = est.pag !== 'Dinheiro';
      mudou();
    });
  }
  desenharBalao();
  /* a conversa: "digitando…" e depois a mensagem montando linha a linha, quando a seção aparece */
  if (zap && balao && !semMovimento && temIO) {
    zap.classList.add('digita');
    var ioZap = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      ioZap.disconnect();
      setTimeout(function () {
        if (!zap.classList.contains('digita')) return; // a pessoa já mexeu nos controles
        zap.classList.remove('digita');
        balao.classList.add('montando');
        setTimeout(function () { balao.classList.remove('montando'); }, 2600);
      }, 1300);
    }, { threshold: .35 });
    ioZap.observe(zap);
  }

  /* ---------- a conta do iFood (os números contam até o valor) ---------- */
  var num = document.getElementById('venda-n'), regua = document.getElementById('venda-r');
  var saidas = { min: document.querySelector('[data-c="min"]'), max: document.querySelector('[data-c="max"]'), ano: document.querySelector('[data-c="ano"]') };
  var contaVista = semMovimento || !temIO;
  function animar(el, para) {
    if (!el) return;
    var de = el._v == null ? para : el._v;
    el._v = para;
    if (el._raf) cancelAnimationFrame(el._raf);
    if (semMovimento || de === para) { el.textContent = reaisInteiros.format(para); return; }
    var t0 = performance.now(), dur = 700;
    (function passo(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = reaisInteiros.format(Math.round(de + (para - de) * e));
      if (p < 1) el._raf = requestAnimationFrame(passo);
    })(t0);
  }
  function contar(v) {
    if (!contaVista) return;
    animar(saidas.min, Math.round(v * 0.12));
    animar(saidas.max, Math.round(v * 0.27));
    animar(saidas.ano, Math.max(0, Math.round((v * 0.12 - 49) * 12)));
  }
  function lerNumero(s) { var n = parseInt(String(s).replace(/\D/g, ''), 10); return isFinite(n) ? Math.min(n, 9999999) : 0; }
  function mostrar(v) { return new Intl.NumberFormat('pt-BR').format(v); }
  function pintarRegua() { if (regua) regua.style.setProperty('--p', ((regua.value - regua.min) / (regua.max - regua.min) * 100).toFixed(1) + '%'); }
  if (num && regua) {
    regua.addEventListener('input', function () { var v = +regua.value; num.value = mostrar(v); pintarRegua(); contar(v); });
    num.addEventListener('input', function () {
      var v = lerNumero(num.value);
      regua.value = String(Math.max(+regua.min, Math.min(+regua.max, v)));
      pintarRegua(); contar(v);
    });
    num.addEventListener('blur', function () { num.value = mostrar(lerNumero(num.value)); });
    pintarRegua();
    if (contaVista) contar(lerNumero(num.value));
    else {
      var ioConta = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        ioConta.disconnect();
        contaVista = true;
        ['min', 'max', 'ano'].forEach(function (c) { if (saidas[c]) saidas[c]._v = 0; });
        contar(lerNumero(num.value));
      }, { threshold: .3 });
      ioConta.observe(document.querySelector('.cifras'));
    }
  }

  /* ---------- inclinação 3D: o celular segue o mouse no topo; os cartões, o mouse em cima deles ---------- */
  if (!semMovimento && fino.matches) {
    var heroi = document.querySelector('.heroi'), cel = document.getElementById('celular');
    if (heroi && cel) {
      heroi.addEventListener('pointermove', function (e) {
        var r = heroi.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        cel.style.setProperty('--pry', (-9 + x * 18).toFixed(2) + 'deg');
        cel.style.setProperty('--prx', (4 - y * 10).toFixed(2) + 'deg');
      });
      heroi.addEventListener('pointerleave', function () { cel.style.removeProperty('--pry'); cel.style.removeProperty('--prx'); });
    }
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var forca = el.classList.contains('plano') ? 4 : 7;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - .5) * forca).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * forca).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        el.classList.add('inclinado');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('inclinado');
        el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
      });
    });
  }

  /* ---------- planos no celular: carrossel com abas; começa no Prata (o recomendado) ---------- */
  var trilho = document.getElementById('planos-trilho');
  var abas = document.querySelectorAll('.planos-abas [data-ir]');
  if (trilho && abas.length) {
    var cartoes = trilho.querySelectorAll(':scope > .plano');
    var emCarrossel = function () { return trilho.scrollWidth > trilho.clientWidth + 4; };
    var irPara = function (i, suave) {
      var c = cartoes[i]; if (!c) return;
      var pad = parseFloat(getComputedStyle(trilho).paddingLeft) || 0;
      trilho.scrollTo({ left: c.offsetLeft - pad, behavior: suave && !semMovimento ? 'smooth' : 'auto' });
    };
    var marcar = function () {
      var pad = parseFloat(getComputedStyle(trilho).paddingLeft) || 0, melhor = 0, dist = Infinity;
      cartoes.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - pad - trilho.scrollLeft); if (d < dist) { dist = d; melhor = i; } });
      abas.forEach(function (b, i) { b.setAttribute('aria-current', String(i === melhor)); });
    };
    abas.forEach(function (b) { b.addEventListener('click', function () { irPara(+b.getAttribute('data-ir'), true); }); });
    var vez;
    trilho.addEventListener('scroll', function () { cancelAnimationFrame(vez); vez = requestAnimationFrame(marcar); }, { passive: true });
    if (emCarrossel()) irPara(2, false);
    marcar();
  }

  /* ---------- partículas discretas no fundo (fogem um pouco do mouse) ---------- */
  var tela = document.querySelector('.particulas');
  if (tela && tela.getContext && !semMovimento) {
    var ctx = tela.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = 0, H = 0, pts = [], mouse = { x: -999, y: -999 };
    var CORES = ['226,236,134', '255,138,61', '52,211,153', '241,244,234'];
    function medir() {
      W = innerWidth; H = innerHeight;
      tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = W < 700 ? 18 : 44;
      while (pts.length < n) pts.push(novo(true));
      pts.length = n;
    }
    function novo(qualquerAltura) {
      return { x: Math.random() * W, y: qualquerAltura ? Math.random() * H : H + 10, r: .6 + Math.random() * 1.6, vx: (Math.random() - .5) * .12, vy: -(.08 + Math.random() * .22),
        c: CORES[(Math.random() * CORES.length) | 0], a: .25 + Math.random() * .45, f: Math.random() * 6.28 };
    }
    var ultimo = 0, rodando = true;
    function quadro(t) {
      if (!rodando) return;
      requestAnimationFrame(quadro);
      if (W < 700 && t - ultimo < 32) return; // no celular, ~30 quadros por segundo
      ultimo = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, perto = 0;
        if (d2 < 16900) { var dist = Math.sqrt(d2) || 1; perto = 1 - dist / 130; p.x += dx / dist * perto * 1.4; p.y += dy / dist * perto * 1.4; }
        p.f += .02; p.x += p.vx + Math.sin(p.f) * .08; p.y += p.vy;
        if (p.y < -10 || p.x < -20 || p.x > W + 20) pts[i] = p = novo(false);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + p.c + ',' + Math.min(1, p.a + perto * .5).toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r + perto * 1.2, 0, 6.283);
        ctx.fill();
      }
    }
    medir();
    addEventListener('resize', medir);
    addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      rodando = !document.hidden;
      if (rodando) requestAnimationFrame(quadro);
    });
    requestAnimationFrame(quadro);
  }
})();

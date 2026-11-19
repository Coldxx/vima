// ViMa: comportamento da página. Sem bibliotecas.
(function () {
  'use strict';
  window.VIMA_OK = true; // sem isto, o HTML desliga as animações de entrada e mostra tudo
  var cfg = window.VIMA_CONFIG || {};
  var insta = (cfg.instagram || 'projetovima').replace(/^@/, '');
  var modelo = cfg.mensagem || 'Oi! Vi a página da ViMa e quero saber mais sobre {servico}.';
  var numero = String(cfg.whatsapp || '').replace(/\D/g, '');
  if (numero.length === 10 || numero.length === 11) numero = '55' + numero;
  var temWhats = numero.length >= 12;
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mensagem(servico) { return modelo.replace('{servico}', servico || 'os serviços de vocês'); }
  function href(servico) {
    return temWhats ? 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem(servico)) : 'https://ig.me/m/' + insta;
  }

  // ---------- contato: WhatsApp quando houver número, senão Instagram ----------
  function atualizarContatos() {
    document.querySelectorAll('[data-contato]').forEach(function (a) {
      a.href = href(a.getAttribute('data-servico'));
      a.target = '_blank';
      a.rel = 'noopener';
      var sp = a.classList.contains('botao') ? a.querySelector('span') : null;
      if (sp && /^Chamar no /.test(sp.textContent)) sp.textContent = temWhats ? 'Chamar no WhatsApp' : 'Chamar no Instagram';
    });
    document.querySelectorAll('[data-canal]').forEach(function (s) { s.textContent = temWhats ? 'no WhatsApp' : 'no Instagram'; });
    if (temWhats) {
      document.querySelectorAll('[data-tira-texto]').forEach(function (s) { s.textContent = cfg.whatsapp; });
      var rw = document.querySelector('[data-rodape-whats]');
      if (rw) {
        rw.hidden = false;
        rw.textContent = 'WhatsApp: ';
        var l = document.createElement('a'); l.href = href(); l.textContent = cfg.whatsapp; l.target = '_blank'; l.rel = 'noopener';
        rw.appendChild(l);
      }
    }
  }
  atualizarContatos();

  // ---------- teste da vitrine ----------
  var form = document.querySelector('[data-teste]');
  if (form && window.VIMA_TESTE) {
    var dados = window.VIMA_TESTE;
    var caixas = Array.prototype.slice.call(form.querySelectorAll('input[name="tem"]'));
    var placar = form.querySelector('[data-placar]');
    var legenda = form.querySelector('[data-placar-legenda]');
    var lista = form.querySelector('[data-sugestoes]');
    var botao = form.querySelector('[data-teste-botao]');
    var avisoCopia = form.querySelector('[data-copiado]');
    var rotuloBotao = botao.querySelector('span');
    rotuloBotao.textContent = temWhats ? 'Mandar no WhatsApp' : 'Copiar e chamar no Instagram';

    var minuscula = function (n) { return /^Google/.test(n) ? n : n.charAt(0).toLowerCase() + n.slice(1); };
    var juntar = function (a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; };

    var calcular = function () {
      var faltam = caixas.filter(function (c) { return !c.checked; });
      var ids = [];
      faltam.forEach(function (c) { var id = c.getAttribute('data-servico-id'); if (ids.indexOf(id) < 0) ids.push(id); });
      placar.textContent = faltam.length + ' de ' + caixas.length;
      legenda.textContent = faltam.length === 1 ? 'item ainda faltando' : 'itens ainda faltando';
      lista.innerHTML = '';
      if (!ids.length) {
        var li = document.createElement('li');
        li.innerHTML = '<strong>Tá tudo em dia por aí</strong><span>Se quiser ir além, dá uma olhada no que mais a gente faz logo abaixo.</span>';
        lista.appendChild(li);
      }
      ids.forEach(function (id) {
        var d = dados[id]; if (!d) return;
        var li = document.createElement('li');
        var s = document.createElement('strong'); s.textContent = d.nome;
        var p = document.createElement('span'); p.textContent = d.curto;
        li.appendChild(s); li.appendChild(p); lista.appendChild(li);
      });
      var servico = ids.length ? juntar(ids.map(function (id) { return minuscula(dados[id].nome); })) : 'os serviços de vocês';
      botao.setAttribute('data-servico', servico);
      botao.href = href(servico);
      avisoCopia.textContent = '';
    };
    caixas.forEach(function (c) { c.addEventListener('change', calcular); });
    calcular();

    botao.addEventListener('click', function () {
      if (temWhats) return;
      var texto = mensagem(botao.getAttribute('data-servico'));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () {
          avisoCopia.textContent = 'Mensagem copiada. É só colar na conversa do Instagram.';
        }, function () { avisoCopia.textContent = 'Mensagem: ' + texto; });
      } else {
        avisoCopia.textContent = 'Mensagem: ' + texto;
      }
    });
  }

  // ---------- como funciona: um passo aberto por vez ----------
  var sanfona = document.querySelector('[data-sanfona]');
  if (sanfona) {
    var passos = Array.prototype.slice.call(sanfona.querySelectorAll('.passo'));
    passos.forEach(function (p) {
      var b = p.querySelector('.passo-botao');
      b.addEventListener('click', function () {
        passos.forEach(function (o) {
          var abre = o === p;
          o.classList.toggle('aberto', abre);
          o.querySelector('.passo-botao').setAttribute('aria-expanded', String(abre));
        });
      });
    });
  }

  // ---------- trabalhos: o nome em foco mostra a foto ----------
  var trab = document.querySelector('[data-trabalhos]');
  if (trab) {
    var nomes = Array.prototype.slice.call(trab.querySelectorAll('[data-trab]'));
    var fotos = Array.prototype.slice.call(trab.querySelectorAll('[data-trab-foto]'));
    var leg = trab.querySelector('[data-trab-legenda]');
    var ativar = function (n) {
      var slug = n.getAttribute('data-trab');
      nomes.forEach(function (o) { o.setAttribute('aria-pressed', String(o === n)); });
      fotos.forEach(function (f) { f.classList.toggle('ativa', f.getAttribute('data-trab-foto') === slug); });
      if (leg) leg.textContent = n.getAttribute('data-frase');
    };
    nomes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { ativar(n); });
      n.addEventListener('focus', function () { ativar(n); });
      n.addEventListener('click', function () { ativar(n); });
    });
  }

  // ---------- cartas em leque (só no computador) ----------
  var leque = document.querySelector('[data-leque]');
  var cartas = leque ? Array.prototype.slice.call(leque.querySelectorAll('.carta')) : [];
  var palcoCartas = leque ? leque.querySelector('.cartas') : null;
  var grande = window.matchMedia('(min-width: 1024px)');
  var pedido = false;
  var suave = function (x) { return 1 - Math.pow(1 - x, 3); };
  var posicionar = function () {
    pedido = false;
    if (!leque || !grande.matches) { cartas.forEach(function (c) { c.style.removeProperty('--y'); }); return; }
    var r = leque.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    var palco = leque.firstElementChild;
    var intro = palco.querySelector('.servicos-intro');
    var estilo = getComputedStyle(palco);
    var alturaUtil = window.innerHeight - intro.offsetHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom) - 56;
    var larguraUtil = palco.clientWidth - 2 * parseFloat(estilo.paddingLeft);
    var escala = Math.max(0.6, Math.min(1, alturaUtil / 590, larguraUtil / 1240));
    palcoCartas.style.setProperty('--escala', escala.toFixed(3));
    cartas.forEach(function (c, i) {
      if (i === 0 || reduzido) { c.style.setProperty('--y', '0px'); return; }
      var ini = i === 1 ? 0.08 : 0.42, fim = i === 1 ? 0.40 : 0.74;
      var t = Math.min(1, Math.max(0, (p - ini) / (fim - ini)));
      c.style.setProperty('--y', ((1 - suave(t)) * window.innerHeight * 1.05).toFixed(1) + 'px');
    });
  };
  var pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(posicionar); } };
  if (leque) {
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    posicionar();
  }

  // ---------- vídeo da abertura ----------
  var video = document.querySelector('.abertura video');
  var pausa = document.querySelector('[data-pausa]');
  if (video && pausa) {
    var iconePausa = pausa.innerHTML;
    var iconePlay = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>';
    var pausadoPeloUsuario = reduzido;
    var marcar = function () {
      var parado = video.paused;
      pausa.innerHTML = parado ? iconePlay : iconePausa;
      pausa.setAttribute('aria-label', parado ? 'Tocar o vídeo' : 'Pausar o vídeo');
    };
    if (reduzido) { video.removeAttribute('autoplay'); video.pause(); }
    video.addEventListener('play', marcar);
    video.addEventListener('pause', marcar);
    pausa.addEventListener('click', function () {
      if (video.paused) { pausadoPeloUsuario = false; video.play(); } else { pausadoPeloUsuario = true; video.pause(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !pausadoPeloUsuario) { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else if (!e.isIntersecting) video.pause();
        });
      }, { threshold: 0.1 }).observe(video);
    }
    marcar();
  }

  // ---------- entradas ao rolar ----------
  // Revela pela posição na tela, a cada rolagem (sem depender de quadro de animação, que o navegador
  // segura em aba de fundo). Tudo o que já passou ou está na tela aparece; nada fica escondido.
  var pendentes = Array.prototype.slice.call(document.querySelectorAll('[data-entra], [data-rodape]'));
  var revelar = function () {
    var limite = window.innerHeight * 0.92;
    pendentes = pendentes.filter(function (el) {
      if (el.getBoundingClientRect().top < limite) { el.classList.add('visto'); return false; }
      return true;
    });
    if (!pendentes.length) window.removeEventListener('scroll', aoRolar);
  };
  var espera = null;
  var aoRolar = function () { if (!espera) espera = setTimeout(function () { espera = null; revelar(); }, 60); };
  if (reduzido) { pendentes.forEach(function (el) { el.classList.add('visto'); }); pendentes = []; }
  else {
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    revelar();
  }
})();

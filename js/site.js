/* Zé para Festas · Calculadora da festa
   JS puro, sem biblioteca. As regras e os textos vêm de js/config.js. */
(function () {
  'use strict';

  var site = window.__site = { stops: 0, ready: false, go: function () {}, next: function () {} };

  try {
    inicia();
  } catch (erro) {
    // Se algo falhar, a página continua legível: sem classes de animação escondendo conteúdo.
    document.documentElement.className = '';
    document.body.classList.remove('carregando');
    site.ready = true;
    if (window.console) console.error('Zé para Festas:', erro);
  }

  function inicia() {
    var C = configura(window.ZF_CONFIG || {});
    var T = C.textos;
    var $ = function (s, el) { return (el || document).querySelector(s); };
    var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
    var menosMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var nf = function (n) { return Number(n).toLocaleString('pt-BR'); };
    var plural = function (n, um, varios) { return n === 1 ? um : varios; };

    /* ---------- estado ---------- */
    var S = {
      convidados: limita(C.conta.convidadosInicial, C.conta.convidadosMin, C.conta.convidadosMax),
      soSalgado: false,
      tipo: (C.tipos.filter(function (t) { return t.id === C.tipoInicial; })[0] || C.tipos[0]).id,
      enviado: null
    };
    var origem = leOrigem();

    /* ---------- elementos ---------- */
    var el = {
      faixa: $('#convidados'), convNum: $('#convNum'), convRot: $('#convRot'), menos: $('#menos'), mais: $('#mais'),
      rSalgados: $('#rSalgados'), rCentos: $('#rCentos'), rCentosUn: $('#rCentosUn'), rSacos: $('#rSacos'), rSacosUn: $('#rSacosUn'),
      rNota: $('#rNota'), rPreco: $('#rPreco'), monte: $('#monte'), aoVivo: $('#aoVivo'),
      tipos: $('#tipos'), trilha: $('#trilha'), rotaNome: $('#rotaNome'), rotaTxt: $('#rotaTxt'),
      resumoNum: $('#resumoNum'), resumoTxt: $('#resumoTxt'), resumoRota: $('#resumoRota'),
      form: $('#form'), pronto: $('#pronto'), barra: $('#barra'), bSalgados: $('#bSalgados'), bSub: $('#bSub')
    };

    /* ---------- textos e listas do config ---------- */
    $$('[data-t]').forEach(function (n) {
      var v = T[n.getAttribute('data-t')];
      if (typeof v === 'string' && v) n.textContent = v;
    });
    $('#segCom').textContent = C.conta.porPessoaComOutrasComidas + ' por pessoa';
    $('#segSo').textContent = C.conta.porPessoaSoSalgado + ' por pessoa';
    $('#escMin').textContent = nf(C.conta.convidadosMin);
    $('#escMax').textContent = nf(C.conta.convidadosMax);
    el.faixa.min = C.conta.convidadosMin; el.faixa.max = C.conta.convidadosMax; el.faixa.step = C.conta.passo; el.faixa.value = S.convidados;
    el.menos.setAttribute('aria-label', 'Menos ' + C.conta.passo + ' convidados');
    el.mais.setAttribute('aria-label', 'Mais ' + C.conta.passo + ' convidados');

    el.tipos.innerHTML = C.tipos.map(function (t) {
      return '<label class="tipo"><input type="radio" name="tipo" value="' + esc(t.id) + '"' + (t.id === S.tipo ? ' checked' : '') + '>' +
        '<span><b>' + esc(t.nome) + '</b>' + (t.detalhe ? '<small>' + esc(t.detalhe) + '</small>' : '') + '</span></label>';
    }).join('');

    var tipoEvento = C.tipos.filter(function (t) { return t.caminho === 'evento'; })[0];
    var regras = {
      loja: 'até ' + (C.triagem.sacosVendaDireta - 1) + ' ' + plural(C.triagem.sacosVendaDireta - 1, 'saco', 'sacos'),
      fabrica: C.triagem.sacosVendaDireta + ' sacos ou mais',
      evento: tipoEvento ? (tipoEvento.detalhe || tipoEvento.nome.toLowerCase()) : 'evento grande'
    };
    el.trilha.innerHTML = ['loja', 'fabrica', 'evento'].map(function (id) {
      return '<li data-c="' + id + '"><i><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ok"/></svg></i>' +
        '<div><b>' + esc(C.triagem.caminhos[id].nome) + '</b><small>' + esc(regras[id]) + '</small></div></li>';
    }).join('');

    $('#passos').innerHTML = T.passos.map(function (p) {
      return '<li><div><b>' + esc(p.titulo) + '</b><span>' + esc(p.texto) + '</span></div></li>';
    }).join('');

    $('#listaSabores').innerHTML = C.sabores.map(function (s, i) {
      return '<li class="rev" style="--d:' + (i * 70) + 'ms">' + desenhoSabor(s.forma) + '<b>' + esc(s.nome) + '</b></li>';
    }).join('');

    $('#faq').innerHTML = T.perguntas.map(function (q) {
      return '<details><summary>' + esc(q.p) + '</summary><p>' + esc(q.r) + '</p></details>';
    }).join('');

    if (C.demo) {
      $('#demo').hidden = false;
      $('#demoOrigem').textContent = origem.loja || origem.material ? 'Origem lida do QR: ' + textoOrigem(origem) + '.' : '';
    }
    if (typeof C.preco === 'number' && C.preco > 0) {
      el.rPreco.hidden = false;
      el.rPreco.textContent = 'Saco de ' + C.conta.kgPorSaco + ' kg: ' + C.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /* ---------- a conta ---------- */
    function tipoAtual() {
      return C.tipos.filter(function (t) { return t.id === S.tipo; })[0] || C.tipos[0];
    }
    function calcula() {
      var c = C.conta, tipo = tipoAtual();
      var porPessoa = S.soSalgado ? c.porPessoaSoSalgado : c.porPessoaComOutrasComidas;
      var salgados = Math.ceil((S.convidados * porPessoa) / c.cento) * c.cento;
      // folga de 2% do saco: 1.000 salgados cabem em 3 sacos de 333, não pedem um quarto saco
      var sacos = Math.max(1, Math.ceil(salgados / c.salgadosPorSaco - 0.02));
      var caminho = tipo.caminho === 'evento' ? 'evento' : (sacos >= C.triagem.sacosVendaDireta ? 'fabrica' : 'loja');
      return {
        tipo: tipo, porPessoa: porPessoa, salgados: salgados, centos: salgados / c.cento, sacos: sacos,
        kg: sacos * c.kgPorSaco, caminho: caminho, caminhoNome: C.triagem.caminhos[caminho].nome,
        pessoas: tipo.pessoas || 'convidados'
      };
    }

    /* ---------- desenho: o monte de coxinhas ---------- */
    var MAX_COX = 66, coxs = [], nAnterior = 0;
    (function criaMonte() {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < MAX_COX; i++) {
        var d = document.createElement('div'); d.className = 'cox';
        var k = document.createElement('i'); k.style.transform = 'rotate(' + (((i * 37) % 17) - 8) + 'deg)';
        d.appendChild(k); frag.appendChild(d); coxs.push(d);
      }
      el.monte.appendChild(frag);
    })();

    function desenhaMonte(centos) {
      var W = el.monte.clientWidth, H = el.monte.clientHeight;
      if (!W || !H) return 1;
      var cada = Math.max(1, Math.ceil(centos / 60));          // quantos centos vale cada coxinha
      var n = Math.min(MAX_COX, Math.ceil(centos / cada));
      var base = 1; while (base * (base + 1) / 2 < n) base++;
      var linhas = [], resto = n, cabe = base;
      while (resto > 0) { var q = Math.min(cabe, resto); linhas.push(q); resto -= q; cabe--; }
      var u = Math.min(W / (base + 0.1), H / (1.18 + (linhas.length - 1) * 0.84), 64);
      var s = u / 100, x0 = (W - base * u) / 2, i = 0;
      for (var r = 0; r < linhas.length; r++) {
        var vagas = base - r, ini = Math.floor((vagas - linhas[r]) / 2);
        for (var j = 0; j < linhas[r]; j++, i++) {
          var x = x0 + r * u / 2 + (ini + j) * u, y = H - 1.18 * u - r * 0.84 * u;
          var c = coxs[i];
          c.style.transitionDelay = (i >= nAnterior && !menosMovimento) ? Math.min(240, (i - nAnterior) * 16) + 'ms' : '0ms';
          c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
          c.classList.add('dentro');
        }
      }
      for (; i < MAX_COX; i++) {
        coxs[i].style.transitionDelay = '0ms';
        coxs[i].style.transform = 'translate(' + (W / 2 - u * 0.2).toFixed(1) + 'px,' + (-0.3 * u).toFixed(1) + 'px) scale(' + (s * 0.4).toFixed(3) + ')';
        coxs[i].classList.remove('dentro');
      }
      nAnterior = n;
      return cada;
    }

    /* ---------- mostra tudo ---------- */
    var ultimo = {}, pulsos = {}, avisoTimer = 0;
    function texto(node, v) { if (node.textContent !== v) node.textContent = v; }
    function pulsa(node, chave) {
      if (menosMovimento || !node.animate) return;
      var agora = Date.now();
      if (pulsos[chave] && agora - pulsos[chave] < 120) return;
      pulsos[chave] = agora;
      node.animate([{ transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }

    function mostra() {
      var r = calcula(), c = C.conta;
      var pct = (S.convidados - c.convidadosMin) / (c.convidadosMax - c.convidadosMin || 1);

      texto(el.convNum, nf(S.convidados));
      texto(el.convRot, r.pessoas);
      if (ultimo.convidados !== undefined && ultimo.convidados !== S.convidados) pulsa(el.convNum, 'conv');
      el.faixa.value = S.convidados;
      el.faixa.style.setProperty('--p', 'calc(22px + ' + pct.toFixed(4) + ' * (100% - 44px))');
      el.faixa.setAttribute('aria-valuetext', nf(S.convidados) + ' ' + r.pessoas);
      el.menos.disabled = S.convidados <= c.convidadosMin;
      el.mais.disabled = S.convidados >= c.convidadosMax;

      texto(el.rSalgados, nf(r.salgados));
      if (ultimo.salgados !== undefined && ultimo.salgados !== r.salgados) pulsa(el.rSalgados, 'salg');
      texto(el.rCentos, nf(r.centos));
      texto(el.rCentosUn, plural(r.centos, 'cento', 'centos'));
      texto(el.rSacos, nf(r.sacos));
      texto(el.rSacosUn, plural(r.sacos, 'saco', 'sacos') + ' de ' + c.kgPorSaco + ' kg');

      var cada = desenhaMonte(r.centos);
      texto(el.rNota, 'Conta: ' + nf(S.convidados) + ' ' + (r.tipo.pessoas ? 'pessoas' : 'convidados') + ' × ' + r.porPessoa +
        ' salgados, com o total no cento seguinte. Cada coxinha do desenho vale ' + nf(cada * c.cento) + ' salgados.');

      texto(el.rotaNome, r.caminhoNome);
      texto(el.rotaTxt, C.triagem.caminhos[r.caminho].texto);
      $$('li', el.trilha).forEach(function (li) { li.classList.toggle('ativo', li.getAttribute('data-c') === r.caminho); });
      if (ultimo.caminho !== undefined && ultimo.caminho !== r.caminho) pulsa(el.rotaNome, 'rota');

      var sal = nf(r.salgados) + ' salgados';
      texto(el.resumoNum, sal);
      texto(el.resumoTxt, nf(S.convidados) + ' ' + r.pessoas + ' · ' + r.tipo.nome);
      texto(el.resumoRota, r.caminhoNome);
      texto(el.bSalgados, sal);
      texto(el.bSub, nf(S.convidados) + ' ' + (r.tipo.pessoas ? 'pessoas' : 'convidados') + ' · ' + nf(r.sacos) + ' ' + plural(r.sacos, 'saco', 'sacos') + ' de ' + c.kgPorSaco + ' kg');

      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(function () {
        el.aoVivo.textContent = sal + ', ' + nf(r.centos) + ' ' + plural(r.centos, 'cento', 'centos') + ', ' + nf(r.sacos) + ' ' +
          plural(r.sacos, 'saco', 'sacos') + ' de ' + c.kgPorSaco + ' kg. Seu pedido vai para: ' + r.caminhoNome + '.';
      }, 700);

      ultimo = { convidados: S.convidados, salgados: r.salgados, caminho: r.caminho };
    }

    var pedida = false;
    function agenda() {
      if (pedida) return;
      pedida = true;
      var roda = function () {
        if (!pedida) return;
        pedida = false;
        try { mostra(); } catch (e) { if (window.console) console.error(e); }
      };
      requestAnimationFrame(roda);
      setTimeout(roda, 120); // aba escondida não roda rAF
    }

    /* ---------- controles ---------- */
    function defineConvidados(v) {
      var c = C.conta;
      v = Math.round(v / c.passo) * c.passo;
      S.convidados = limita(v, c.convidadosMin, c.convidadosMax);
      agenda();
    }
    el.faixa.addEventListener('input', function () { defineConvidados(Number(el.faixa.value)); });
    el.faixa.addEventListener('change', function () { defineConvidados(Number(el.faixa.value)); });
    el.menos.addEventListener('click', function () { defineConvidados(S.convidados - C.conta.passo); });
    el.mais.addEventListener('click', function () { defineConvidados(S.convidados + C.conta.passo); });
    $$('input[name=comida]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { S.soSalgado = r.value === 'so'; agenda(); } });
    });
    $$('input[name=tipo]', el.tipos).forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) { S.tipo = r.value; agenda(); } });
    });
    var tRedim = 0;
    window.addEventListener('resize', function () {
      clearTimeout(tRedim);
      tRedim = setTimeout(function () { agenda(); contaParadas(); }, 120);
    });

    /* ---------- formulário ---------- */
    var campos = { nome: $('#nome'), zap: $('#zap'), local: $('#local'), data: $('#data'), aceite: $('#aceite') };
    campos.data.min = hojeISO();

    campos.zap.addEventListener('input', function () { campos.zap.value = formataZap(campos.zap.value); });
    Object.keys(campos).forEach(function (k) {
      var limpa = function () { erro(k, ''); };
      campos[k].addEventListener('input', limpa);
      campos[k].addEventListener('change', limpa);
    });

    function erro(k, msg) {
      var p = $('#e-' + k);
      p.textContent = msg; p.hidden = !msg;
      if (msg) campos[k].setAttribute('aria-invalid', 'true'); else campos[k].removeAttribute('aria-invalid');
    }

    function valida() {
      var v = {
        nome: campos.nome.value.replace(/\s+/g, ' ').trim(),
        zap: campos.zap.value.replace(/\D/g, ''),
        local: campos.local.value.replace(/\s+/g, ' ').trim(),
        data: campos.data.value
      };
      var erros = {};
      if (v.nome.length < 2) erros.nome = 'Escreva o seu nome.';
      if (!(v.zap.length === 10 || v.zap.length === 11) || Number(v.zap.slice(0, 2)) < 11) erros.zap = 'Escreva o WhatsApp com DDD.';
      if (v.local.length < 3) erros.local = 'Escreva a cidade e o bairro.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.data)) erros.data = 'Escolha a data do evento.';
      else if (v.data < hojeISO()) erros.data = 'Escolha uma data de hoje em diante.';
      if (!campos.aceite.checked) erros.aceite = 'Marque o aceite para enviar.';
      var primeiro = null;
      Object.keys(campos).forEach(function (k) { erro(k, erros[k] || ''); if (erros[k] && !primeiro) primeiro = campos[k]; });
      if (primeiro) { primeiro.focus(); return null; }
      return v;
    }

    function montaPedido(v) {
      var r = calcula();
      var p = {
        protocolo: protocolo(),
        criadoEm: new Date().toISOString(),
        tipo: { id: r.tipo.id, nome: r.tipo.nome },
        convidados: S.convidados,
        porPessoa: r.porPessoa,
        salgados: r.salgados,
        centos: r.centos,
        sacos: r.sacos,
        kg: r.kg,
        caminho: { id: r.caminho, nome: r.caminhoNome },
        cidadeBairro: v.local,
        dataEvento: v.data,
        nome: v.nome,
        whatsapp: v.zap,
        origem: { loja: origem.loja, material: origem.material, texto: textoOrigem(origem) }
      };
      p.mensagem = [
        T.saudacao,
        '',
        'Pedido: ' + p.protocolo,
        'Tipo: ' + p.tipo.nome,
        (r.tipo.pessoas ? 'Pessoas esperadas: ' : 'Convidados: ') + nf(p.convidados),
        'Salgados: ' + nf(p.salgados) + ' (' + nf(p.centos) + ' ' + plural(p.centos, 'cento', 'centos') + ', ' + p.porPessoa + ' por pessoa)',
        'Sacos de ' + C.conta.kgPorSaco + ' kg: ' + nf(p.sacos),
        'Caminho: ' + p.caminho.nome,
        'Cidade e bairro: ' + p.cidadeBairro,
        'Data do evento: ' + dataBR(p.dataEvento),
        'Nome: ' + p.nome,
        'WhatsApp: ' + formataZap(p.whatsapp),
        'Origem: ' + p.origem.texto
      ].join('\n');
      return p;
    }

    function linkZap(msg) {
      var numero = String(C.whatsapp || '').replace(/\D/g, '');
      return numero ? 'https://wa.me/' + numero + '?text=' + encodeURIComponent(msg) : '';
    }

    el.form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = valida();
      if (!v) return;
      var pedido = montaPedido(v), url = linkZap(pedido.mensagem);
      try { window.localStorage.setItem('zf_ultimo_pedido', JSON.stringify(pedido)); } catch (e) { /* sem armazenamento, segue */ }
      if (C.webhook) {
        try {
          fetch(C.webhook, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(pedido) })
            .catch(function () {});
        } catch (e) { /* segue sem o registro */ }
      }
      if (url) {
        var w = null;
        try { w = window.open(url, '_blank'); } catch (e) { w = null; }
        if (w) { try { w.opener = null; } catch (e) {} } else { window.location.href = url; }
      }
      mostraPronto(pedido, url);
    });

    function mostraPronto(pedido, url) {
      S.enviado = pedido;
      texto($('#prontoProt'), pedido.protocolo);
      texto($('#prontoMsg'), pedido.mensagem);
      var zap = $('#prontoZap'), aviso = $('#prontoAviso'), copiar = $('#copiar');
      if (url) {
        texto($('#prontoTit'), 'Pedido pronto');
        texto($('#prontoTxt'), 'Abrimos o WhatsApp com a mensagem pronta. Confira e toque em enviar.' +
          (C.prazoResposta ? ' A resposta chega ' + C.prazoResposta + '.' : ''));
        zap.hidden = false; zap.href = url;
        copiar.className = 'btn btn-linha btn-cheio';
        aviso.hidden = true;
      } else {
        texto($('#prontoTit'), 'Mensagem pronta');
        texto($('#prontoTxt'), 'Copie a mensagem abaixo e envie pelo WhatsApp.');
        zap.hidden = true; zap.removeAttribute('href');
        copiar.className = 'btn btn-zap btn-cheio';
        aviso.hidden = !C.demo;
        texto(aviso, 'Protótipo: o número do WhatsApp central ainda não foi definido.');
      }
      texto($('#copiarTxt'), 'Copiar mensagem');
      el.form.hidden = true;
      el.pronto.hidden = false;
      el.pronto.classList.remove('entra'); void el.pronto.offsetWidth; el.pronto.classList.add('entra');
      document.body.classList.add('enviado');
      atualizaBarra();
      var topo = $('#pedido .cartao').getBoundingClientRect().top + window.pageYOffset - 16;
      rola(topo, true);
      try { el.pronto.focus({ preventScroll: true }); } catch (e) { el.pronto.focus(); }
    }

    $('#copiar').addEventListener('click', function () {
      if (!S.enviado) return;
      var msg = S.enviado.mensagem, rot = $('#copiarTxt');
      var ok = function () { texto(rot, 'Mensagem copiada'); setTimeout(function () { texto(rot, 'Copiar mensagem'); }, 2200); };
      var plano = function () {
        var ta = document.createElement('textarea');
        ta.value = msg; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { if (document.execCommand('copy')) ok(); } catch (e) {}
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(ok, plano); else plano();
    });

    $('#outra').addEventListener('click', function () {
      S.enviado = null;
      el.pronto.hidden = true;
      el.form.hidden = false;
      document.body.classList.remove('enviado');
      atualizaBarra();
      rola(0, true);
      try { el.faixa.focus({ preventScroll: true }); } catch (e) {}
    });

    /* ---------- barra fixa: some quando o formulário está na tela ---------- */
    var formNaTela = false;
    function atualizaBarra() { el.barra.classList.toggle('some', formNaTela || !!S.enviado); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        formNaTela = entradas[0].isIntersecting;
        atualizaBarra();
      }, { rootMargin: '0px 0px -90px 0px' }).observe($('#pedido .cartao'));
    }

    /* ---------- entrada suave das seções ---------- */
    var revs = $$('.rev');
    function revela(n) { n.classList.add('visto'); }
    var obs = null;
    if ('IntersectionObserver' in window && !menosMovimento) {
      obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { if (e.isIntersecting) { revela(e.target); obs.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }

    /* ---------- paradas (prints, medição e teclado) ---------- */
    var blocos = $$('[data-parada]');
    function paradas() {
      // Aba escondida ou painel recolhido pode dar altura 0: sem altura, só uma parada por bloco.
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      var max = Math.max(0, document.documentElement.scrollHeight - vh), out = [];
      blocos.forEach(function (b, i) {
        var top = b.getBoundingClientRect().top + window.pageYOffset, h = b.offsetHeight;
        out.push(i === 0 ? 0 : Math.min(top, max));
        if (vh > 200 && h > vh * 1.15) {
          var extras = Math.min(6, Math.ceil((h - vh) / (vh * 0.8)));
          for (var k = 1; k <= extras; k++) out.push(Math.min(top + k * vh * 0.8, max));
        }
      });
      out.sort(function (a, b) { return a - b; });
      return out.filter(function (v, i) { return i === 0 || v - out[i - 1] > 48; });
    }
    function rola(y, suave) {
      var modo = suave && !menosMovimento ? 'smooth' : 'instant';
      try { window.scrollTo({ top: y, behavior: modo }); } catch (e) { window.scrollTo(0, y); }
    }
    function indiceAtual(p) {
      var y = window.pageYOffset, melhor = 0;
      for (var i = 0; i < p.length; i++) if (Math.abs(p[i] - y) < Math.abs(p[melhor] - y)) melhor = i;
      return melhor;
    }
    site.go = function (i) {
      var p = paradas(); i = limita(i | 0, 0, p.length - 1);
      rola(p[i], false);
      revs.forEach(function (n) { if (n.getBoundingClientRect().top < window.innerHeight * 1.2) revela(n); });
    };
    site.next = function (dir) {
      var p = paradas(), i = limita(indiceAtual(p) + (dir < 0 ? -1 : 1), 0, p.length - 1);
      rola(p[i], true);
    };

    /* ---------- pronto ---------- */
    mostra();
    var liberada = false;
    function contaParadas() { try { site.stops = paradas().length; } catch (e) { site.stops = blocos.length; } }
    function libera() {
      if (liberada) return;
      liberada = true;
      document.body.classList.remove('carregando');
      document.body.classList.add('pronta');
      // A calculadora aparece primeiro; o resto entra quando chega na tela.
      $$('#calculadora .rev').forEach(function (n, i) { n.style.setProperty('--d', (i * 55) + 'ms'); revela(n); });
      revs.forEach(function (n) { if (!n.classList.contains('visto')) { if (obs) obs.observe(n); else revela(n); } });
      try { mostra(); } catch (e) { if (window.console) console.error(e); }
      contaParadas();
      site.ready = true;
      setTimeout(aquece, 900);
    }
    // Depois que a calculadora aparece, decodifica as imagens de baixo com calma,
    // para a primeira rolagem não engasgar quando elas chegam na tela.
    function aquece() {
      $$('img[loading=lazy]').forEach(function (img) {
        try {
          img.loading = 'eager';
          if (img.decode) img.decode().catch(function () {});
        } catch (e) {}
      });
    }
    // setTimeout e não requestAnimationFrame: em aba escondida o rAF não roda e a página ficaria vazia.
    var fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var limite = new Promise(function (ok) { setTimeout(ok, 700); });
    Promise.race([fontes, limite]).then(function () { setTimeout(libera, 0); }, libera);
    window.addEventListener('load', function () { agenda(); contaParadas(); });

    /* ---------- utilidades ---------- */
    function leOrigem() {
      var o = { loja: '', material: '' };
      try {
        var q = new URLSearchParams(window.location.search);
        o.loja = limpa(q.get('l')); o.material = limpa(q.get('m'));
      } catch (e) {}
      return o;
    }
    function limpa(v) {
      return String(v || '').toLowerCase().replace(/[^a-z0-9à-ÿ _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    }
    function textoOrigem(o) {
      if (!o.loja && !o.material) return 'link direto';
      return 'QR code' + (o.loja ? ', loja ' + o.loja : '') + (o.material ? ', material ' + o.material : '');
    }
  }

  /* ---------- funções sem estado ---------- */
  function limita(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function hojeISO() {
    var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }
  function dataBR(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }
  function formataZap(v) {
    var d = String(v).replace(/\D/g, '');
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    d = d.slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function protocolo() {
    var letras = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', n = [], i, out = '';
    try { n = window.crypto.getRandomValues(new Uint32Array(5)); } catch (e) { n = []; }
    for (i = 0; i < 5; i++) out += letras.charAt((n[i] !== undefined ? n[i] : Math.floor(Math.random() * 4294967296)) % letras.length);
    return 'ZF-' + out;
  }
  function desenhoSabor(forma) {
    var ini = '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">';
    var brilho = ' fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"';
    var migalhas = function (pts) {
      return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="#731225" fill-opacity=".28"/>'; }).join('');
    };
    if (forma === 'bolinha') {
      return ini + '<circle cx="60" cy="62" r="45" fill="url(#g-salg)"/>' +
        '<path d="M31 50c-5 12-3 26 6 36"' + brilho + '/>' + migalhas([[62, 40], [80, 58], [70, 82], [52, 70], [86, 76]]) + '</svg>';
    }
    if (forma === 'pastel') {
      return ini + '<rect x="12" y="30" width="96" height="62" rx="17" fill="url(#g-salg)"/>' +
        '<path d="M22 44v34M30 40v42M90 40v42M98 44v34" fill="none" stroke="#731225" stroke-opacity=".26" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M42 44c9-4 22-4 34 0"' + brilho + '/>' + migalhas([[52, 62], [68, 72], [74, 56], [48, 78]]) + '</svg>';
    }
    if (forma === 'enroladinho') {
      return ini + '<circle cx="60" cy="62" r="45" fill="url(#g-salg)"/>' +
        '<circle cx="60" cy="62" r="27" fill="none" stroke="#731225" stroke-opacity=".2" stroke-width="3"/>' +
        '<circle cx="60" cy="62" r="17" fill="#D84E35"/>' +
        '<path d="M51 55c3-4 9-6 15-4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3.5" stroke-linecap="round"/>' +
        '<path d="M27 54c-3 12 0 24 8 33"' + brilho + '/>' + '</svg>';
    }
    return ini + '<path transform="translate(10 1)" d="M50 5c3 0 5 2 7 6 9 19 37 43 37 68 0 22-19 35-44 35S6 101 6 79c0-25 28-49 37-68 2-4 4-6 7-6z" fill="url(#g-salg)"/>' +
      '<path d="M37 67c-2 12 2 25 12 33"' + brilho + '/>' + migalhas([[62, 52], [78, 72], [66, 92], [54, 78], [84, 90]]) + '</svg>';
  }
  function configura(c) {
    var p = {
      demo: true, whatsapp: '', webhook: '', preco: null, prazoResposta: null, tipoInicial: 'casa',
      conta: { porPessoaComOutrasComidas: 8, porPessoaSoSalgado: 12, cento: 100, salgadosPorSaco: 333, kgPorSaco: 5, convidadosMin: 10, convidadosMax: 500, convidadosInicial: 60, passo: 5 },
      triagem: { sacosVendaDireta: 5, caminhos: {
        loja: { nome: 'Loja da sua cidade', texto: '' },
        fabrica: { nome: 'Venda direta da fábrica', texto: '' },
        evento: { nome: 'Evento com estrutura (Kit Evento)', texto: '' } } },
      tipos: [{ id: 'casa', nome: 'Festa em casa' }],
      sabores: [],
      textos: { saudacao: 'Olá! Quero Zé Coxinha na minha festa.', passos: [], perguntas: [] }
    };
    var junta = function (a, b) {
      Object.keys(b || {}).forEach(function (k) {
        if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) junta(a[k], b[k]);
        else if (b[k] !== undefined) a[k] = b[k];
      });
      return a;
    };
    return junta(p, c);
  }
})();

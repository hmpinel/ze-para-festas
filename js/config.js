/*
  Zé para Festas · Calculadora da festa
  Tudo o que o grupo pode trocar sem mexer no código fica neste arquivo.
  Depois de trocar, salve e recarregue a página.
*/
window.ZF_CONFIG = {

  /* true mostra a etiqueta "Protótipo" no rodapé. Troque para false quando a página for a público. */
  demo: true,

  /* WhatsApp central do projeto: só números, com 55 + DDD. Exemplo: '5527999999999'.
     Vazio = o botão final não abre o WhatsApp; a página mostra a mensagem pronta para copiar. */
  whatsapp: '',

  /* Opcional: endereço que recebe o pedido em JSON (planilha, CRM, automação). Vazio = não envia. */
  webhook: '',

  /* Preço do saco de 5 kg, em reais. null = a página não fala de preço (regra de hoje:
     nada a público sem preço confirmado). Exemplo, quando houver: 139 */
  preco: null,

  /* Prazo de resposta que o grupo garante. null = a página não promete prazo.
     Exemplo, quando houver: 'em até 1 dia útil' */
  prazoResposta: null,

  /* A conta */
  conta: {
    porPessoaComOutrasComidas: 8,   // salgados por pessoa quando a festa tem outras comidas
    porPessoaSoSalgado: 12,         // salgados por pessoa quando é só salgado
    cento: 100,                     // o total sobe para o cento seguinte
    salgadosPorSaco: 333,           // saco de 5 kg tem 333 salgados de 15 g (cadastro do One)
    kgPorSaco: 5,
    convidadosMin: 10,
    convidadosMax: 500,
    convidadosInicial: 60,
    passo: 5
  },

  /* Triagem: para quem o pedido vai. O nome do caminho sai escrito na mensagem. */
  triagem: {
    sacosVendaDireta: 5,            // 5 sacos ou mais (25 kg ou mais) = venda direta da fábrica
    caminhos: {
      loja: {
        nome: 'Loja da sua cidade',
        texto: 'Pelo tamanho da festa, o pedido é encaminhado para a loja Zé Coxinha da sua cidade.'
      },
      fabrica: {
        nome: 'Venda direta da fábrica',
        texto: 'A partir de 5 sacos, o pedido é encaminhado para a venda direta da fábrica Zé Coxinha.'
      },
      evento: {
        nome: 'Evento com estrutura (Kit Evento)',
        texto: 'Feira, show e festa da cidade pedem estrutura no local. O pedido é encaminhado para o time de eventos.'
      }
    }
  },

  /* Tipos de evento. "caminho: 'evento'" manda direto para o time de eventos, qualquer que seja o tamanho. */
  tipos: [
    { id: 'casa',    nome: 'Festa em casa',        detalhe: 'aniversário, família, amigos' },
    { id: 'empresa', nome: 'Empresa',              detalhe: 'confraternização, reunião, coffee break' },
    { id: 'buffet',  nome: 'Buffet ou cerimonial', detalhe: 'casamento, formatura, 15 anos' },
    { id: 'grande',  nome: 'Evento grande',        detalhe: 'feira, show, festa da cidade', caminho: 'evento', pessoas: 'pessoas esperadas' }
  ],
  tipoInicial: 'casa',

  /* Sabores (confirmar com a fábrica antes de ir a público). "forma" escolhe o desenho. */
  sabores: [
    { nome: 'Coxinha de frango',                forma: 'coxinha' },
    { nome: 'Bolinha de queijo',                forma: 'bolinha' },
    { nome: 'Pastelzinho de presunto e queijo', forma: 'pastel' },
    { nome: 'Mini enroladinho',                 forma: 'enroladinho' }
  ],

  /* Textos da página */
  textos: {
    marca: 'Zé para Festas',
    titulo: 'Quantos convidados na sua festa?',
    apoio: 'Arraste e veja quantos salgados a festa pede.',
    perguntaComida: 'A festa vai ter outras comidas?',
    comOutras: 'Tem outras comidas',
    soSalgado: 'Só salgado',
    resultado: 'A festa pede',
    botao: 'Pedir pelo WhatsApp',
    tituloCaminho: 'Que festa é essa?',
    apoioCaminho: 'O tipo de festa e o tamanho dizem quem atende você.',
    tituloPedido: 'Peça pelo WhatsApp',
    apoioPedido: 'Conte como é a festa. As opções chegam pelo WhatsApp.',
    botaoEnviar: 'Enviar pelo WhatsApp',
    aceite: 'Aceito que o Zé Coxinha use meu contato para responder a este pedido.',
    saudacao: 'Olá! Quero Zé Coxinha na minha festa.',
    passos: [
      { titulo: 'Faça a conta',        texto: 'Diga quantos convidados e veja quantos salgados a festa pede.' },
      { titulo: 'Mande pelo WhatsApp', texto: 'A mensagem já sai pronta, com o número do seu pedido.' },
      { titulo: 'Receba as opções',    texto: 'A resposta chega no WhatsApp, com as opções para a sua festa.' }
    ],
    perguntas: [
      { p: 'Como a conta é feita?',
        r: 'São 8 salgados por pessoa quando a festa tem outras comidas e 12 quando é só salgado. O total sobe para o cento seguinte.' },
      { p: 'O que é o saco de 5 kg?',
        r: 'É o salgado congelado da fábrica Zé Coxinha. Cada saco tem cerca de 330 salgados.' },
      { p: 'Já fico sabendo o preço aqui?',
        r: 'Ainda não. O preço e a forma de receber chegam na conversa pelo WhatsApp.' },
      { p: 'Para que serve o número do pedido?',
        r: 'Ele identifica a sua conta. Com ele, quem atende acha o seu pedido sem você repetir tudo.' },
      { p: 'O que vocês fazem com o meu contato?',
        r: 'Usamos só para responder a este pedido.' }
    ]
  }
};

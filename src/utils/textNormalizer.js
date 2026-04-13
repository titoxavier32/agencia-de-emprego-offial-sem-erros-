const normalizeWhitespace = (value) => value
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const simpleReplacements = [
  ['Configuracoes', 'Configurações'],
  ['Selecoes publicas', 'Seleções públicas'],
  ['Selecoes', 'Seleções'],
  ['Selecao', 'Seleção'],
  ['Descricao', 'Descrição'],
  ['Titulo', 'Título'],
  ['Informacoes', 'Informações'],
  ['Conteudo', 'Conteúdo'],
  ['Curriculo', 'Currículo'],
  ['Minicurriculo', 'Minicurrículo'],
  ['Formulario', 'Formulário'],
  ['Experiencia', 'Experiência'],
  ['Pagina', 'Página'],
  ['Posicao', 'Posição'],
  ['Direcao', 'Direção'],
  ['Razao', 'Razão'],
  ['Endereco', 'Endereço'],
  ['Responsavel', 'Responsável'],
  ['Nao', 'Não'],
  ['Voce', 'Você'],
  ['Codigo', 'Código'],
  ['Publico', 'Público'],
  ['publico', 'público'],
  ['publicitario', 'publicitário'],
  ['Publicitario', 'Publicitário'],
  ['Agencia', 'Agência'],
  ['agencia', 'agência'],
  ['Vagas de emprego', 'Vagas de Emprego'],
  ['oportunidade', 'Oportunidade'],
  ['oportunidades', 'Oportunidades'],
  ['atencao', 'atenção'],
  ['comunicacao', 'comunicação'],
  ['situacao', 'situação'],
  ['inscricao', 'inscrição'],
  ['inscricoes', 'inscrições'],
  ['edital', 'Edital'],
  ['beneficios', 'benefícios'],
  ['salario', 'salário'],
  ['remuneracao', 'remuneração'],
  ['vaga', 'vaga'],
  ['vagas', 'vagas'],
  ['candidato', 'candidato'],
  ['candidatarse', 'candidatar-se'],
  ['proximo', 'próximo'],
  ['unico', 'único'],
  ['periodo', 'período'],
  ['historico', 'histórico'],
  ['automatico', 'automático'],
  ['area', 'área'],
  ['saude', 'saúde'],
  ['educacao', 'educação'],
  ['estagio', 'estágio'],
  ['estagios', 'estágios'],
  ['excluir', 'excluir'],
  ['corrigir', 'corrigir'],
  ['alterar', 'alterar'],
  ['visualizar', 'visualizar'],
  ['gerenciar', 'gerenciar'],
  ['administracao', 'administração'],
  ['tecnico', 'técnico'],
  ['logistica', 'logística'],
  ['servicos', 'serviços'],
  ['producao', 'produção'],
  ['comercio', 'comércio'],
  ['estatisticas', 'estatísticas']
];

const brokenPatterns = [
  [/Configura(?:Ã§Ãµes|\?\?)/g, 'Configurações'],
  [/Sele(?:Ã§Ãµes|\?\?es) p(?:Ãº|\?)blicas/g, 'Seleções públicas'],
  [/Descri(?:Ã§Ã£o|\?\?o)/g, 'Descrição'],
  [/T(?:Ã­tulo|\?tulo)/g, 'Título'],
  [/Curr(?:Ã­culo|\?culo)/g, 'Currículo'],
  [/Experi(?:Ãªncia|\?ncia)/g, 'Experiência'],
  [/Posi(?:Ã§Ã£o|\?\?o)/g, 'Posição'],
  [/Dire(?:Ã§Ã£o|\?\?o)/g, 'Direção'],
  [/Raz(?:Ã£o|\?o)/g, 'Razão'],
  [/Endere(?:Ã§o|\?o)/g, 'Endereço'],
  [/N(?:Ã£o|\?o)/g, 'Não'],
  [/Voc(?:Ãª|\?)/g, 'Você'],
  [/C(?:Ã³digo|\?digo)/g, 'Código'],
  [/(?:Ã¡rea|\?rea)/g, 'área'],
  [/(?:Ãºnica|\?nica)/g, 'única'],
  [/(?:publicitÃ¡rio|publicit\?rio)/g, 'publicitário'],
  [/(?:pÃºblico|p\?blico)/g, 'público'],
  [/(?:AgÃªncia|Ag\?ncia)/g, 'Agência']
];

const normalizeText = (value) => {
  if (typeof value !== 'string') return value;

  let normalized = value.normalize('NFC');

  brokenPatterns.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  simpleReplacements.forEach(([from, to]) => {
    normalized = normalized.replace(new RegExp('\\b' + from + '\\b', 'g'), to);
  });

  return normalizeWhitespace(normalized);
};

module.exports = {
  normalizeText
};

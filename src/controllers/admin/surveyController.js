const SatisfactionSurvey = require('../../models/SatisfactionSurvey');

module.exports = {
  /**
   * Lista todas as pesquisas de satisfação
   */
  listSurveys: async (req, res) => {
    try {
      const surveys = await SatisfactionSurvey.findAll({
        order: [['createdAt', 'DESC']]
      });

      res.render('admin/satisfaction-surveys', {
        title: 'Pesquisas de satisfação',
        surveys,
        layout: 'admin/layout'
      });
    } catch (error) {
      console.error('Erro ao listar pesquisas:', error);
      res.status(500).send('Erro interno do servidor');
    }
  },

  /**
   * Exclui uma pesquisa de satisfação
   */
  deleteSurvey: async (req, res) => {
    try {
      const { id } = req.params;
      await SatisfactionSurvey.destroy({ where: { id } });
      res.redirect('/admin/pesquisas');
    } catch (error) {
      console.error('Erro ao excluir pesquisa:', error);
      res.status(500).send('Erro ao excluir registro');
    }
  }
};

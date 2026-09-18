const dashboardService = require('../services/dashboard.service');
const { exito } = require('../utils/response');

const obtener = async (req, res) => {
  const datos = await dashboardService.obtenerDashboard(req.usuario, req.query);
  exito(res, { datos });
};

module.exports = { obtener };

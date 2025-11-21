const express = require('express');
const router = express.Router();
const pilgrimageController = require('../controllers/pilgrimageController');

// GET - Listar (con filtros opcionales: ?date=YYYY-MM-DD&church=PARROQUIA&status=activo&month=YYYY-MM)
router.get('/', pilgrimageController.getPilgrimages);

// GET - Obtener por ID
router.get('/:id', pilgrimageController.getPilgrimageById);

// GET - Calendario: peregrinaciones de un mes específico (?month=2025-05)
router.get('/calendar/month', pilgrimageController.getCalendarByMonth);

// GET - Calendario: peregrinaciones de un día específico (?date=2025-05-15)
router.get('/calendar/day', pilgrimageController.getCalendarByDay);

// GET - Estadísticas por iglesia
router.get('/stats/church', pilgrimageController.getStatsByChurch);

// GET - Estadísticas por organización
router.get('/stats/organization', pilgrimageController.getStatsByOrganization);

// GET - Próximas peregrinaciones (próximos 7 días)
router.get('/upcoming/list', pilgrimageController.getUpcoming);

// POST - Crear nueva peregrinación
router.post('/', pilgrimageController.createPilgrimage);

// PUT - Actualizar peregrinación existente
router.put('/:id', pilgrimageController.updatePilgrimage);

// DELETE - Eliminar peregrinación
router.delete('/:id', pilgrimageController.deletePilgrimage);

module.exports = router;
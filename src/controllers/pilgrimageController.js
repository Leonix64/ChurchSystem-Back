const db = require('../config/firebase');
const Pilgrimage = require('../models/pilgrimageModel');

const sendResponse = (res, status, data, message = '') => {
    res.status(status).json({
        success: status >= 200 && status < 300,
        data,
        message
    });
};

// GET /api/pilgrimages - Listar todo o con filtros simples
exports.getPilgrimages = async (req, res) => {
    try {
        const { date, church, status, month } = req.query;

        // Traemos TODO sin índices (así Firestore no se queja)
        const snapshot = await db.collection('pilgrimages').get();
        let pilgrimages = [];

        snapshot.forEach(doc => {
            pilgrimages.push({
                id: doc.id,
                ...Pilgrimage.fromFirestore(doc)
            });
        });

        // Filtramos en memoria (mucho más feliz Firestore)
        if (date) {
            pilgrimages = pilgrimages.filter(p => p.date === date);
        }
        if (church) {
            pilgrimages = pilgrimages.filter(p => p.church === church);
        }
        if (status) {
            pilgrimages = pilgrimages.filter(p => p.status === status);
        }
        if (month) {
            // Formato esperado: 2025-05
            pilgrimages = pilgrimages.filter(p => p.date.startsWith(month));
        }

        // Ordenamos en memoria
        pilgrimages.sort((a, b) => {
            if (a.date === b.date) {
                return a.time.localeCompare(b.time);
            }
            return a.date.localeCompare(b.date);
        });

        sendResponse(res, 200, pilgrimages);
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// GET /api/pilgrimages/:id - Obtener por ID
exports.getPilgrimageById = async (req, res) => {
    try {
        const doc = await db.collection('pilgrimages').doc(req.params.id).get();

        if (!doc.exists) {
            return sendResponse(res, 404, null, 'Peregrinación no encontrada');
        }

        sendResponse(res, 200, {
            id: doc.id,
            ...Pilgrimage.fromFirestore(doc)
        });
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// POST /api/pilgrimages - Crear nueva
exports.createPilgrimage = async (req, res) => {
    try {
        const pilgrimageData = new Pilgrimage(req.body);
        const errors = pilgrimageData.validate();

        if (errors.length > 0) {
            return sendResponse(res, 400, null, errors.join(', '));
        }

        // Obtener todos y filtrar en memoria para evitar índices compuestos
        const snapshot = await db.collection('pilgrimages').get();
        const exists = snapshot.docs.some(doc => {
            const data = doc.data();
            return data.date === pilgrimageData.date && data.time === pilgrimageData.time;
        });

        if (exists) {
            return sendResponse(res, 409, null, 'Ya existe una peregrinación en la misma fecha y hora');
        }

        const docRef = await db.collection('pilgrimages').add(pilgrimageData.toFirestore());

        sendResponse(res, 201, {
            id: docRef.id,
            ...pilgrimageData.toFirestore()
        }, 'Peregrinación creada exitosamente');
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// PUT /api/pilgrimages/:id - Actualizar existente
exports.updatePilgrimage = async (req, res) => {
    try {
        const docRef = db.collection('pilgrimages').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return sendResponse(res, 404, null, 'Peregrinación no encontrada');
        }

        const existingData = doc.data();
        const updatedData = new Pilgrimage({
            ...existingData,
            ...req.body,
            updatedAt: new Date()
        });

        const errors = updatedData.validate();
        if (errors.length > 0) {
            return sendResponse(res, 400, null, errors.join(', '));
        }

        await docRef.update(updatedData.toFirestore());

        sendResponse(res, 200, {
            id: docRef.id,
            ...updatedData.toFirestore()
        }, 'Peregrinación actualizada exitosamente');
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// DELETE /api/pilgrimages/:id - Eliminar
exports.deletePilgrimage = async (req, res) => {
    try {
        const docRef = db.collection('pilgrimages').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return sendResponse(res, 404, null, 'Peregrinación no encontrada');
        }

        await docRef.delete();
        sendResponse(res, 200, null, 'Peregrinación eliminada exitosamente');
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// GET /api/pilgrimages/calendar/month - Obtener datos para calendario por mes
exports.getCalendarByMonth = async (req, res) => {
    try {
        const { month } = req.query; // Formato: YYYY-MM

        if (!month) {
            return sendResponse(res, 400, null, 'El parámetro "month" es requerido');
        }

        const snapshot = await db.collection('pilgrimages').get();
        const calendar = [];

        snapshot.forEach(doc => {
            const data = Pilgrimage.fromFirestore(doc);
            // Filtramos en memoria
            if (data.date.startsWith(month)) {
                calendar.push({
                    id: doc.id,
                    title: `${data.organization} - ${data.church}`,
                    date: data.date,
                    time: data.time,
                    status: data.status,
                    church: data.church,
                    organization: data.organization,
                    participants: data.participants
                });
            }
        });

        // Ordenamos
        calendar.sort((a, b) => {
            if (a.date === b.date) {
                return a.time.localeCompare(b.time);
            }
            return a.date.localeCompare(b.date);
        });

        sendResponse(res, 200, calendar);
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// GET /api/pilgrimages/calendar/day - Obtener peregrinaciones de un día específico
exports.getCalendarByDay = async (req, res) => {
    try {
        const { date } = req.query; // Formato: YYYY-MM-DD

        if (!date) {
            return sendResponse(res, 400, null, 'El parámetro "date" es requerido');
        }

        const snapshot = await db.collection('pilgrimages').get();
        const events = [];

        snapshot.forEach(doc => {
            const data = Pilgrimage.fromFirestore(doc);
            if (data.date === date) {
                events.push({
                    id: doc.id,
                    title: `${data.organization} - ${data.church}`,
                    time: data.time,
                    status: data.status,
                    church: data.church,
                    organization: data.organization,
                    participants: data.participants,
                    priest: data.priest,
                    contact: data.contact
                });
            }
        });

        events.sort((a, b) => a.time.localeCompare(b.time));

        sendResponse(res, 200, events);
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// GET /api/pilgrimages/stats/church - Obtener estadísticas por iglesia
exports.getStatsByChurch = async (req, res) => {
    try {
        const snapshot = await db.collection('pilgrimages').get();
        const stats = {};

        snapshot.forEach(doc => {
            const data = Pilgrimage.fromFirestore(doc);
            if (!stats[data.church]) {
                stats[data.church] = { total: 0, activo: 0, completado: 0, cancelado: 0 };
            }
            stats[data.church].total++;
            stats[data.church][data.status]++;
        });

        sendResponse(res, 200, stats);
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// GET /api/pilgrimages/stats/organization - Obtener estadísticas por organización
exports.getStatsByOrganization = async (req, res) => {
    try {
        const snapshot = await db.collection('pilgrimages').get();
        const stats = {};

        snapshot.forEach(doc => {
            const data = Pilgrimage.fromFirestore(doc);
            if (!stats[data.organization]) {
                stats[data.organization] = { total: 0, activo: 0, completado: 0, cancelado: 0 };
            }
            stats[data.organization].total++;
            stats[data.organization][data.status]++;
        });

        sendResponse(res, 200, stats);
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};

// GET /api/pilgrimages/upcoming - Obtener próximas peregrinaciones (próximos 7 días)
exports.getUpcoming = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        const snapshot = await db.collection('pilgrimages').get();
        const upcoming = [];

        snapshot.forEach(doc => {
            const data = Pilgrimage.fromFirestore(doc);
            if (data.date >= todayStr && data.date <= nextWeekStr && data.status !== 'cancelado') {
                upcoming.push({
                    id: doc.id,
                    date: data.date,
                    time: data.time,
                    organization: data.organization,
                    church: data.church,
                    status: data.status,
                    participants: data.participants
                });
            }
        });

        upcoming.sort((a, b) => {
            if (a.date === b.date) {
                return a.time.localeCompare(b.time);
            }
            return a.date.localeCompare(b.date);
        });

        sendResponse(res, 200, upcoming);
    } catch (error) {
        sendResponse(res, 500, null, error.message);
    }
};
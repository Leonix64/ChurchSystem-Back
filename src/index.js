const express = require('express');
const cors = require('cors');
//require('dotenv').config();

const pilgrimageRoutes = require('./routes/pilgrimageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/pilgrimages', pilgrimageRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'API de Peregrinaciones funcionando' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
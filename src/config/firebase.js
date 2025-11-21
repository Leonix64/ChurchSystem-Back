const admin = require('firebase-admin');
const serviceAccount = require('../../churchsystem-77b1c-firebase-adminsdk-fbsvc-357c7f25a5.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//console.log('data firebase: ',serviceAccount);

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

module.exports = db;
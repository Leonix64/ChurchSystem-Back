const { CHURCH_OPTIONS, STATUS_OPTIONS, TIME_SLOTS } = require('../utils/constants');

class Pilgrimage {
    constructor(data) {
        this.date = data.date;
        this.time = data.time;
        this.organization = data.organization;
        this.church = data.church;
        this.priest = data.priest || '';
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.status = data.status || 'pendiente';
        this.participants = data.participants || 0;
        this.contact = data.contact || { name: '', phone: '', email: '' };
    }

    validate() {
        const errors = [];

        if (!this.date) errors.push('La fecha es requerida.');
        if (!this.time) errors.push('La hora es requerida.');
        if (!this.organization) errors.push('La organización es requerida.');
        if (!this.church) errors.push('La iglesia es requerida.');

        if (this.church && !CHURCH_OPTIONS.includes(this.church)) {
            errors.push(`Iglesia debe ser: ${CHURCH_OPTIONS.join(' o ')}`);
        }

        if (this.status && !STATUS_OPTIONS.includes(this.status)) {
            errors.push(`Estado debe ser: ${STATUS_OPTIONS.join(', ')}`);
        }

        return errors;
    }

    toFirestore() {
        return {
            date: this.date,
            time: this.time,
            organization: this.organization,
            church: this.church,
            priest: this.priest,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            status: this.status,
            participants: this.participants,
            contact: this.contact
        };
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
        };
    }
}

module.exports = Pilgrimage;
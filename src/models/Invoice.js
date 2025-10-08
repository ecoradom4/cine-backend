const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  taxAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'issued', 'paid', 'cancelled'),
    defaultValue: 'draft'
  },
  customerName: {
    type: DataTypes.STRING
  },
  customerTaxId: {
    type: DataTypes.STRING
  },
  customerEmail: {
    type: DataTypes.STRING
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'digital_wallet')
  },
  paymentDate: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'invoices',
  hooks: {
    beforeCreate: async (invoice) => {
      if (!invoice.invoiceNumber) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        invoice.invoiceNumber = `INV-${timestamp}-${random}`;
      }
    }
  }
});

module.exports = Invoice;
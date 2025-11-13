const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lead = sequelize.define('Lead', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'),
      defaultValue: 'new',
      allowNull: false
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'leads',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['ownerId']
      },
      {
        fields: ['email']
      }
    ]
  });

  Lead.associate = (models) => {
    // Lead belongs to User (owner)
    Lead.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner'
    });

    // Lead has many Activities
    Lead.hasMany(models.Activity, {
      foreignKey: 'leadId',
      as: 'activities',
      onDelete: 'CASCADE'
    });
  };

  return Lead;
};


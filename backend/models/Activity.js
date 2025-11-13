const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('note', 'call', 'meeting', 'email', 'status_change', 'assignment'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'activities',
    timestamps: true,
    indexes: [
      {
        fields: ['leadId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Activity.associate = (models) => {
    // Activity belongs to Lead
    Activity.belongsTo(models.Lead, {
      foreignKey: 'leadId',
      as: 'lead'
    });

    // Activity belongs to User
    Activity.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Activity;
};


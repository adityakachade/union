const { Lead, User, Activity } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Get dashboard statistics
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause based on role
    const leadWhere = {};
    if (userRole === 'sales_executive') {
      leadWhere.ownerId = userId;
    }

    // Total leads
    const totalLeads = await Lead.count({ where: leadWhere });

    // Leads by status
    const leadsByStatus = await Lead.findAll({
      where: leadWhere,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Recent activities count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityWhere = {
      createdAt: {
        [Op.gte]: sevenDaysAgo
      }
    };

    if (userRole === 'sales_executive') {
      activityWhere.userId = userId;
    }

    const recentActivities = await Activity.count({ where: activityWhere });

    // Total value of leads
    const totalValue = await Lead.sum('value', { where: leadWhere }) || 0;

    // Leads by owner (for managers and admins)
    let leadsByOwner = [];
    if (userRole === 'admin' || userRole === 'manager') {
      leadsByOwner = await Lead.findAll({
        attributes: [
          'ownerId',
          [sequelize.fn('COUNT', sequelize.col('Lead.id')), 'count']
        ],
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['name'],
            required: false
          }
        ],
        group: ['ownerId', 'owner.id', 'owner.name'],
        raw: false
      });
    }

    res.json({
      success: true,
      data: {
        totalLeads,
        leadsByStatus: leadsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        recentActivities,
        totalValue: parseFloat(totalValue),
        leadsByOwner: leadsByOwner.map(item => ({
          ownerId: item.ownerId,
          ownerName: item.owner?.name || 'Unassigned',
          count: parseInt(item.dataValues.count)
        }))
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

/**
 * Get analytics data for charts
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { period = '30' } = req.query; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const leadWhere = {
      createdAt: {
        [Op.gte]: daysAgo
      }
    };

    if (userRole === 'sales_executive') {
      leadWhere.ownerId = userId;
    }

    // Leads created over time
    const leadsOverTime = await Lead.findAll({
      where: leadWhere,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Activities by type
    const activityWhere = {
      createdAt: {
        [Op.gte]: daysAgo
      }
    };

    if (userRole === 'sales_executive') {
      activityWhere.userId = userId;
    }

    const activitiesByType = await Activity.findAll({
      where: activityWhere,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    // Conversion funnel
    const conversionFunnel = await Lead.findAll({
      where: leadWhere,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        leadsOverTime: leadsOverTime.map(item => ({
          date: item.date,
          count: parseInt(item.count)
        })),
        activitiesByType: activitiesByType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        conversionFunnel: conversionFunnel.map(item => ({
          status: item.status,
          count: parseInt(item.count)
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};


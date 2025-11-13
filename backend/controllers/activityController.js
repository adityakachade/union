const { Activity, Lead, User } = require('../models');
const { notifyUser } = require('../services/socketService');

/**
 * Get activities for a lead
 */
exports.getLeadActivities = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { page = 1, limit = 50, type } = req.query;

    const offset = (page - 1) * limit;
    const where = { leadId };

    if (type) {
      where.type = type;
    }

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

/**
 * Create activity for a lead
 */
exports.createActivity = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { type, description, metadata } = req.body;

    // Verify lead exists
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const activity = await Activity.create({
      type: type || 'note',
      description,
      metadata: metadata || {},
      leadId,
      userId: req.user.id
    });

    // Load with associations
    await activity.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name']
        }
      ]
    });

    // Notify lead owner if different from activity creator
    if (lead.ownerId && lead.ownerId !== req.user.id) {
      notifyUser(lead.ownerId, {
        message: `${req.user.name} added a ${type} to lead "${lead.name}"`,
        type: 'info',
        link: `/leads/${leadId}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  }
};

/**
 * Update activity
 */
exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Only allow creator or admin/manager to update
    if (activity.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own activities'
      });
    }

    const { description, metadata } = req.body;
    if (description !== undefined) activity.description = description;
    if (metadata !== undefined) activity.metadata = metadata;

    await activity.save();

    await activity.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

/**
 * Delete activity
 */
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Only allow creator or admin/manager to delete
    if (activity.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own activities'
      });
    }

    await activity.destroy();

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
};


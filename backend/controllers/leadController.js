const { Lead, User, Activity } = require('../models');
const { Op } = require('sequelize');
const { notifyUser, emitLeadUpdate } = require('../services/socketService');
const { sendLeadAssignmentEmail, sendStatusChangeEmail } = require('../services/emailService');
const { Notification } = require('../models');

/**
 * Get all leads with filters and pagination
 */
exports.getAllLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      ownerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'sales_executive') {
      where.ownerId = req.user.id;
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Lead.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [[sortBy, sortOrder]],
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
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
};

/**
 * Get single lead by ID
 */
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Activity,
          as: 'activities',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: 50
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: error.message
    });
  }
};

/**
 * Create new lead
 */
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, company, status, source, value, notes, ownerId } = req.body;

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      status: status || 'new',
      source,
      value: value || 0,
      notes,
      ownerId: ownerId || (req.user.role === 'sales_executive' ? req.user.id : null)
    });

    // Load with owner
    await lead.reload({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Create activity
    await Activity.create({
      type: 'note',
      description: `Lead created: ${name}`,
      leadId: lead.id,
      userId: req.user.id
    });

    // Notify owner if assigned
    if (lead.ownerId && lead.ownerId !== req.user.id) {
      const owner = await User.findByPk(lead.ownerId);
      if (owner) {
        await Notification.create({
          message: `New lead "${lead.name}" has been assigned to you`,
          type: 'info',
          userId: lead.ownerId,
          link: `/leads/${lead.id}`
        });
        notifyUser(lead.ownerId, {
          message: `New lead "${lead.name}" assigned to you`,
          type: 'info',
          link: `/leads/${lead.id}`
        });
        sendLeadAssignmentEmail(owner, lead);
      }
    }

    emitLeadUpdate(lead);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: error.message
    });
  }
};

/**
 * Update lead
 */
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    const oldStatus = lead.status;
    const oldOwnerId = lead.ownerId;

    const {
      name,
      email,
      phone,
      company,
      status,
      source,
      value,
      notes,
      ownerId
    } = req.body;

    // Update fields
    if (name !== undefined) lead.name = name;
    if (email !== undefined) lead.email = email;
    if (phone !== undefined) lead.phone = phone;
    if (company !== undefined) lead.company = company;
    if (status !== undefined) lead.status = status;
    if (source !== undefined) lead.source = source;
    if (value !== undefined) lead.value = value;
    if (notes !== undefined) lead.notes = notes;
    if (ownerId !== undefined && (req.user.role === 'admin' || req.user.role === 'manager')) {
      lead.ownerId = ownerId;
    }

    await lead.save();

    // Create activity for status change
    if (status && status !== oldStatus) {
      await Activity.create({
        type: 'status_change',
        description: `Status changed from ${oldStatus} to ${status}`,
        leadId: lead.id,
        userId: req.user.id,
        metadata: { oldStatus, newStatus: status }
      });

      // Notify owner of status change
      if (lead.ownerId) {
        const owner = await User.findByPk(lead.ownerId);
        if (owner) {
          sendStatusChangeEmail(owner, lead, oldStatus, status);
        }
      }
    }

    // Create activity for assignment change
    if (ownerId !== undefined && ownerId !== oldOwnerId) {
      await Activity.create({
        type: 'assignment',
        description: ownerId
          ? `Lead assigned to ${(await User.findByPk(ownerId))?.name || 'user'}`
          : 'Lead unassigned',
        leadId: lead.id,
        userId: req.user.id,
        metadata: { oldOwnerId, newOwnerId: ownerId }
      });

      // Notify new owner
      if (ownerId && ownerId !== req.user.id) {
        const newOwner = await User.findByPk(ownerId);
        if (newOwner) {
          await Notification.create({
            message: `Lead "${lead.name}" has been assigned to you`,
            type: 'info',
            userId: ownerId,
            link: `/leads/${lead.id}`
          });
          notifyUser(ownerId, {
            message: `Lead "${lead.name}" assigned to you`,
            type: 'info',
            link: `/leads/${lead.id}`
          });
          sendLeadAssignmentEmail(newOwner, lead);
        }
      }
    }

    // Reload with associations
    await lead.reload({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    emitLeadUpdate(lead);

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead',
      error: error.message
    });
  }
};

/**
 * Delete lead
 */
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.destroy();

    emitLeadUpdate({ id: req.params.id, deleted: true });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead',
      error: error.message
    });
  }
};


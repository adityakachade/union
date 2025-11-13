const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

const initializeEmailService = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email service initialized');
  } else {
    console.log('⚠️  Email service not configured. Email notifications will be skipped.');
  }
};

/**
 * Send email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 */
const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log(`[Email] Would send to ${to}: ${subject}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};

/**
 * Send lead assignment notification
 */
const sendLeadAssignmentEmail = async (user, lead) => {
  const subject = `New Lead Assigned: ${lead.name}`;
  const html = `
    <h2>New Lead Assigned</h2>
    <p>Hello ${user.name},</p>
    <p>A new lead has been assigned to you:</p>
    <ul>
      <li><strong>Name:</strong> ${lead.name}</li>
      <li><strong>Company:</strong> ${lead.company || 'N/A'}</li>
      <li><strong>Email:</strong> ${lead.email}</li>
      <li><strong>Status:</strong> ${lead.status}</li>
    </ul>
    <p>Please follow up with this lead as soon as possible.</p>
  `;
  return await sendEmail(user.email, subject, html);
};

/**
 * Send lead status change notification
 */
const sendStatusChangeEmail = async (user, lead, oldStatus, newStatus) => {
  const subject = `Lead Status Updated: ${lead.name}`;
  const html = `
    <h2>Lead Status Updated</h2>
    <p>Hello ${user.name},</p>
    <p>The status of lead "${lead.name}" has been updated:</p>
    <p><strong>From:</strong> ${oldStatus} → <strong>To:</strong> ${newStatus}</p>
    <p>Keep up the great work!</p>
  `;
  return await sendEmail(user.email, subject, html);
};

// Initialize on module load
initializeEmailService();

module.exports = {
  sendEmail,
  sendLeadAssignmentEmail,
  sendStatusChangeEmail,
  initializeEmailService
};


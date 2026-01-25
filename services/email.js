const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const TEMPLATES = {
    ADMIN_CLAIM: 'lost-item-claim',
    USER_FOUND: 'lost-item-found',
};

/**
 * Send email notification to admin about a new lost item posting
 * @param {Object} variables - The template variables
 * @returns {Promise<Object>} Resend response
 */
async function sendAdminNotification(variables) {
    try {
        const response = await resend.emails.send({
            to: process.env.ADMIN_EMAIL,
            template: {
                id: TEMPLATES.ADMIN_CLAIM,
                variables: variables,
            },
        });

        console.log('Admin notification sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending admin notification:', error);
        throw error;
    }
}

/**
 * Send email notification to user about a potentially found item
 * @param {string} userEmail - The user's email address
 * @param {Object} variables - The template variables
 * @returns {Promise<Object>} Resend response
 */
async function sendUserFoundNotification(userEmail, variables) {
    try {
        const response = await resend.emails.send({
            to: userEmail,
            template: {
                id: TEMPLATES.USER_FOUND,
                variables: variables,
            },
        });

        console.log('User notification sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending user notification:', error);
        throw error;
    }
}

/**
 * Generic email sending method that can handle both notification types
 * @param {string} to - Recipient email (or 'admin' to use ADMIN_EMAIL from env)
 * @param {boolean} isAdminNotification - True for admin template, false for user template
 * @param {Object} variables - Template variables
 * @returns {Promise<Object>} Resend response
 */
async function sendEmail(to, isAdminNotification, variables) {
    const recipient = to === 'admin' ? process.env.ADMIN_EMAIL : to;
    const templateId = isAdminNotification ? TEMPLATES.ADMIN_CLAIM : TEMPLATES.USER_FOUND;

    try {
        const response = await resend.emails.send({
            to: recipient,
            template: {
                id: templateId,
                variables: variables,
            },
        });

        console.log('Email sent:', response);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports = {
    sendAdminNotification,
    sendUserFoundNotification,
    sendEmail,
};

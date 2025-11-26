const { Op } = require('sequelize');
const { Event, Participant } = require('../../database/models');

/**
 * Format date to Vietnamese format: DD/MM/YYYY lúc HH:mm
 */
function formatVietnameseDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
}

/**
 * Check if a user has a business trip conflict during the specified time range
 * @param {string} userId - User ID to check
 * @param {Date} startTime - Start time of the period to check
 * @param {Date} endTime - End time of the period to check (optional, defaults to startTime)
 * @returns {Promise<{hasConflict: boolean, conflictDetails: object|null, message: string|null}>}
 */
async function checkBusinessTripConflict(userId, startTime, endTime = null) {
    try {
        if (!userId || !startTime) {
            return { hasConflict: false, conflictDetails: null, message: null };
        }

        const checkStart = new Date(startTime);
        const checkEnd = endTime ? new Date(endTime) : checkStart;

        // Find approved business trips (type='work') that overlap with the specified time range
        const conflict = await Event.findOne({
            where: {
                type: 'work',
                status: 'approved',
                start_time: { [Op.lt]: checkEnd },
                end_time: { [Op.gt]: checkStart }
            },
            include: [{
                model: Participant,
                where: { userId },
                required: true
            }]
        });

        if (conflict) {
            const startStr = formatVietnameseDateTime(conflict.start_time);
            const endStr = formatVietnameseDateTime(conflict.end_time);
            const message = `Nhân viên này có lịch công tác "${conflict.title}" từ ngày ${startStr} tới ngày ${endStr}`;

            return {
                hasConflict: true,
                conflictDetails: {
                    eventId: conflict.id,
                    title: conflict.title,
                    start_time: conflict.start_time,
                    end_time: conflict.end_time
                },
                message
            };
        }

        return { hasConflict: false, conflictDetails: null, message: null };
    } catch (error) {
        console.error('Error checking business trip conflict:', error);
        // Return no conflict on error to avoid blocking operations
        return { hasConflict: false, conflictDetails: null, message: null };
    }
}

/**
 * Check multiple users for business trip conflicts
 * @param {Array<string>} userIds - Array of user IDs to check
 * @param {Date} startTime - Start time of the period to check
 * @param {Date} endTime - End time of the period to check
 * @returns {Promise<Array<{userId: string, hasConflict: boolean, message: string}>>}
 */
async function checkMultipleUsersConflicts(userIds, startTime, endTime = null) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
    }

    const results = await Promise.all(
        userIds.map(async (userId) => {
            const result = await checkBusinessTripConflict(userId, startTime, endTime);
            return {
                userId,
                hasConflict: result.hasConflict,
                message: result.message,
                conflictDetails: result.conflictDetails
            };
        })
    );

    return results;
}

module.exports = {
    checkBusinessTripConflict,
    checkMultipleUsersConflicts,
    formatVietnameseDateTime
};

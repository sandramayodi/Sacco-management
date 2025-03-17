// utils/dividendCalculator.js
const Member = require('../models/Member');

/**
 * Calculate dividend distribution among members
 * @param {number} totalDividendAmount - Total amount to distribute
 * @param {number} rate - Dividend rate in percentage
 * @returns {Promise<Array>} - Array of dividend allocations
 */
exports.calculateDividends = async (totalDividendAmount, rate) => {
  try {
    // Get all verified members
    const members = await Member.find({ verified: true });
    
    // Calculate total share capital
    const totalShareCapital = members.reduce((acc, member) => acc + member.shareCapital, 0);
    
    if (totalShareCapital === 0) {
      throw new Error('No share capital found to distribute dividends');
    }
    
    // Calculate dividend distribution
    const dividendDistribution = members.map(member => {
      if (member.shareCapital > 0) {
        const memberSharePercentage = member.shareCapital / totalShareCapital;
        const dividendAmount = totalDividendAmount * memberSharePercentage;
        
        return {
          memberId: member._id,
          memberName: `${member.firstName} ${member.lastName}`,
          shareCapital: member.shareCapital,
          sharePercentage: memberSharePercentage * 100,
          dividendAmount
        };
      }
      return null;
    }).filter(item => item !== null);
    
    return {
      totalDividendAmount,
      rate,
      totalShareCapital,
      memberCount: dividendDistribution.length,
      dividendDistribution
    };
  } catch (error) {
    console.error('Error calculating dividends:', error);
    throw error;
  }
};
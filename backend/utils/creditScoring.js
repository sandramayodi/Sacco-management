// utils/creditScoring.js
const Member = require('../models/Member');
const Loan = require('../models/Loan');
const Saving = require('../models/Saving');
const Transaction = require('../models/Transaction');

/**
 * Calculate credit score for a member based on various factors
 * @param {string} memberId - The ID of the member
 * @returns {Promise<number>} - Credit score between 300-850
 */
exports.calculateCreditScore = async (memberId) => {
  try {
    // Get member data
    const member = await Member.findById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Base score
    let score = 550;

    // Factor 1: Membership duration (max 50 points)
    const membershipDuration = (Date.now() - new Date(member.membershipDate)) / (1000 * 60 * 60 * 24 * 30); // in months
    score += Math.min(membershipDuration * 2, 50);

    // Factor 2: Share capital (max 50 points)
    score += Math.min(member.shareCapital / 1000 * 5, 50);

    // Factor 3: Savings history (max 75 points)
    const savings = await Saving.find({ member: memberId });
    if (savings.length > 0) {
      const totalSavings = savings.reduce((sum, saving) => sum + saving.amount, 0);
      const regularityScore = Math.min(savings.length * 5, 25);
      const amountScore = Math.min(totalSavings / 5000 * 50, 50);
      score += regularityScore + amountScore;
    }

    // Factor 4: Loan repayment history (max 150 points)
    const loans = await Loan.find({ 
      member: memberId,
      status: { $in: ['fully-paid', 'repaying', 'defaulted'] }
    });

    if (loans.length > 0) {
      let repaymentScore = 0;
      let completedLoansCount = 0;
      let defaultedLoansCount = 0;
      
      for (const loan of loans) {
        if (loan.status === 'fully-paid') {
          completedLoansCount++;
        } else if (loan.status === 'defaulted') {
          defaultedLoansCount++;
        } else if (loan.status === 'repaying') {
          // Check for late payments
          const latePayments = loan.repaymentSchedule.filter(installment => 
            installment.status === 'overdue' || 
            (installment.paidDate && new Date(installment.paidDate) > new Date(installment.dueDate))
          ).length;
          
          if (latePayments === 0) {
            repaymentScore += 20;
          } else if (latePayments <= 2) {
            repaymentScore += 10;
          }
        }
      }
      
      repaymentScore += completedLoansCount * 30;
      repaymentScore -= defaultedLoansCount * 50;
      
      score += Math.min(Math.max(repaymentScore, -150), 150);
    } else {
      // No loan history, neutral impact
      score += 25;
    }

    // Factor 5: Transaction regularity (max 25 points)
    const transactions = await Transaction.find({ member: memberId });
    const transactionRegularity = Math.min(transactions.length, 25);
    score += transactionRegularity;

    // Ensure score is within valid range (300-850)
    return Math.max(300, Math.min(Math.round(score), 850));
  } catch (error) {
    console.error('Error calculating credit score:', error);
    return 500; // Default moderate score in case of error
  }
};
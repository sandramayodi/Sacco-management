// models/Loan.js
const mongoose = require("mongoose");

const LoanSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.ObjectId,
      ref: "Member",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add loan amount"],
    },
    purpose: {
      type: String,
      required: [true, "Please add loan purpose"],
    },
    loanType: {
      type: String,
      enum: [
        "seed",
        "equipment",
        "fertilizer",
        "livestock",
        "storage",
        "general",
      ],
      required: true,
    },
    interestRate: {
      type: Number,
      required: true,
    },
    term: {
      type: Number, // In months
      required: [true, "Please specify loan term in months"],
    },
    repaymentSchedule: [
      {
        installmentNumber: Number,
        dueDate: Date,
        amount: Number,
        principal: Number,
        interest: Number,
        paidAmount: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "overdue"],
          default: "pending",
        },
        paymentDate: Date,
      },
    ],
    collateral: {
      description: String,
      value: Number,
      documents: [String],
    },
    guarantors: [
      {
        name: String,
        relationship: String,
        contact: String,
        nationalId: String,
      },
    ],
    status: {
      type: String,
      enum: [
        "applied",
        "under-review",
        "approved",
        "rejected",
        "disbursed",
        "repaying",
        "fully-paid",
        "defaulted",
      ],
      default: "applied",
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    approvalDate: Date,
    disbursementDate: Date,
    rejectionReason: String,
    reviewedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Member", // Admin who reviewed it
    },
    farmUse: {
      cropType: [String],
      landSize: Number,
      location: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate total loan amount (principal + interest)
LoanSchema.virtual("totalAmount").get(function () {
  if (this.repaymentSchedule && this.repaymentSchedule.length > 0) {
    return this.repaymentSchedule.reduce(
      (total, installment) => total + installment.amount,
      0
    );
  }
  return this.amount * (1 + (this.interestRate / 100) * (this.term / 12));
});

// Calculate total paid amount
LoanSchema.virtual("totalPaid").get(function () {
  if (this.repaymentSchedule && this.repaymentSchedule.length > 0) {
    return this.repaymentSchedule.reduce(
      (total, installment) => total + (installment.paidAmount || 0),
      0
    );
  }
  return 0;
});

// Calculate remaining balance
LoanSchema.virtual("remainingBalance").get(function () {
  return this.totalAmount - this.totalPaid;
});

// Calculate repayment progress percentage
LoanSchema.virtual("progressPercentage").get(function () {
  if (this.totalAmount === 0) return 0;
  return (this.totalPaid / this.totalAmount) * 100;
});

// Helper methods
LoanSchema.methods.generateRepaymentSchedule = function () {
  const monthlyInterestRate = this.interestRate / 100 / 12;
  const monthlyPayment =
    (this.amount *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, this.term)) /
    (Math.pow(1 + monthlyInterestRate, this.term) - 1);

  let remainingPrincipal = this.amount;
  const schedule = [];

  for (let i = 1; i <= this.term; i++) {
    const interestPayment = remainingPrincipal * monthlyInterestRate;
    let principalPayment = monthlyPayment - interestPayment;

    // Adjust the last payment to account for rounding errors
    if (i === this.term) {
      principalPayment = remainingPrincipal;
    }

    remainingPrincipal -= principalPayment;

    // Create due date (30 days from previous or from today if first payment)
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: Math.round((principalPayment + interestPayment) * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      status: "pending",
    });
  }

  return schedule;
};

module.exports = mongoose.model("Loan", LoanSchema);

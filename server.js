// Import necessary libraries
const express = require('express');
const cors = require('cors');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Allows the frontend to make requests without security errors
app.use(express.json()); // Parses JSON bodies of incoming requests

// A simple root endpoint to confirm the server is running
app.get('/', (req, res) => {
    res.send('Welcome to the GamePlan Backend!');
});

// --- Loan Calculation API ---
// This endpoint receives loan details and calculates the repayment schedule.
app.post('/calculate-loan', (req, res) => {
    // Extract data from the request body
    const { loanAmount, interestRate, duration } = req.body;

    // Validate the input to ensure it's valid numbers
    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(duration) || loanAmount <= 0 || duration <= 0) {
        return res.status(400).json({ error: 'Invalid input. Please provide positive numbers for amount, rate, and duration.' });
    }

    // Convert annual interest rate to a monthly rate
    const monthlyInterestRate = (interestRate / 100) / 12;
    const numberOfPayments = duration;

    let monthlyPayment;
    let totalInterestPaid = 0;
    const repaymentSchedule = [];

    // Calculate EMI using the loan amortization formula
    if (monthlyInterestRate === 0) {
        // Handle a 0% interest rate case to avoid division by zero
        monthlyPayment = loanAmount / numberOfPayments;
    } else {
        monthlyPayment = loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    }
    
    let remainingBalance = loanAmount;

    // Generate the month-by-month repayment schedule
    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPortion = remainingBalance * monthlyInterestRate;
        const principalPortion = monthlyPayment - interestPortion;
        
        // Ensure the last payment handles any minor floating point discrepancies
        if (i === numberOfPayments) {
            remainingBalance = 0;
        } else {
            remainingBalance -= principalPortion;
        }

        totalInterestPaid += interestPortion;

        // Store the details for the current month
        repaymentSchedule.push({
            month: i,
            monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
            interestPortion: parseFloat(interestPortion.toFixed(2)),
            principalPortion: parseFloat(principalPortion.toFixed(2)),
            remainingBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2)) // Ensure balance doesn't go negative
        });
    }

    // Send back the calculated data in a JSON object
    res.json({
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
        repaymentSchedule,
    });
});

// --- Chatbot API ---
// This endpoint provides simple, keyword-based responses.
app.post('/chat', (req, res) => {
    // Get the user's message and convert it to lowercase for easy comparison
    const userMessage = req.body.message.toLowerCase();
    let chatbotResponse = "I'm not sure how to respond to that. Try asking about 'loan,' 'interest,' or 'help.'";

    // Simple keyword-based logic to determine the response
    if (userMessage.includes('loan') || userMessage.includes('what is')) {
        chatbotResponse = "A loan is a sum of money borrowed from a lender, which you must repay, usually with interest, over a set period.";
    } else if (userMessage.includes('interest')) {
        chatbotResponse = "Interest is the cost of borrowing money, calculated as a percentage of the loan amount.";
    } else if (userMessage.includes('help')) {
        chatbotResponse = "I can help you calculate loan payments. Please use the loan calculator on this site to get started.";
    }

    // Send the chatbot's response back to the frontend
    res.json({ response: chatbotResponse });
});

// --- Server Startup ---
// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
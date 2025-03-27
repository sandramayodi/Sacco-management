// scripts/create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Member } = require('../models/Member'); // Adjust path as needed
const { ExpertProfile } = require('../models/ExpertModels'); // For expert profile
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Member.findOne({ email: 'admin@agrisacco.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('secureAdminPassword123', salt);
    
    // Generate member ID 
    const memberId = 'ADM' + Math.floor(100000 + Math.random() * 900000);
    
    // Create admin user
    const adminUser = await Member.create({
      memberId,
      firstName: 'System',
      lastName: 'Administrator',
      idNumber: 'ADMIN001',
      phoneNumber: '+123456789',
      email: 'admin@agrisacco.com',
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'active',
      isVerified: true
    });
    
    console.log('Admin user created successfully:', adminUser);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.disconnect();
  }
}

async function createExpertUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if expert already exists
    const existingExpert = await Member.findOne({ email: 'expert@agrisacco.com' });
    
    if (existingExpert) {
      console.log('Expert user already exists');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('secureExpertPassword123', salt);
    
    // Generate member ID 
    const memberId = 'EXP' + Math.floor(100000 + Math.random() * 900000);
    
    // Create expert user
    const expertUser = await Member.create({
      memberId,
      firstName: 'Agricultural',
      lastName: 'Expert',
      idNumber: 'EXPERT001',
      phoneNumber: '+123456788',
      email: 'expert@agrisacco.com',
      password: hashedPassword,
      role: 'agricultural-expert',
      accountStatus: 'active',
      isVerified: true
    });
    
    // Create expert profile
    const expertProfile = await ExpertProfile.create({
      memberId: expertUser._id,
      specializations: ['crop_farming', 'soil_management'],
      experience: { years: 5, details: 'Agricultural consultant for small farms' },
      biography: 'Experienced agricultural expert specializing in sustainable farming practices',
      languages: ['English', 'Swahili'],
      availability: {
        schedule: [
          { day: 'monday', startTime: '09:00', endTime: '17:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
          { day: 'friday', startTime: '09:00', endTime: '17:00' }
        ],
        isAvailableForFieldVisits: true,
        preferredConsultationMethods: ['in_person', 'phone_call', 'video_call']
      },
      isVerified: true,
      verificationDate: new Date()
    });
    
    console.log('Expert user created successfully:', expertUser);
    console.log('Expert profile created successfully:', expertProfile);
    
  } catch (error) {
    console.error('Error creating expert user:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Create both users
async function createUsers() {
  await createAdminUser();
  await createExpertUser();
  console.log('User creation completed');
}

createUsers();
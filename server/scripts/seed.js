const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Case = require('../models/Case');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netsage';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    const casesPath = path.join(__dirname, '..', '..', 'data', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
    console.log(`Found ${cases.length} cases to seed`);

    await Case.deleteMany({});
    await Case.insertMany(cases);
    console.log(`✅ Seeded ${cases.length} cases`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();

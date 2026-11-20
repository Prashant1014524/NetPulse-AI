import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Case from '../models/Case';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netsage';

async function seed(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    const casesPath = path.join(__dirname, '..', '..', '..', 'data', 'cases.json');
    const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
    console.log(`Found ${cases.length} cases to seed`);

    await Case.deleteMany({});
    await Case.insertMany(cases);
    console.log(`✅ Seeded ${cases.length} cases`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();

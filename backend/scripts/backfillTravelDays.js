import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TravelOption from '../models/TravelOption.js';

dotenv.config();

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDayFromDateValue = (dateValue) => {
  const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(dateObj.getTime())) return null;
  return DAYS_OF_WEEK[dateObj.getUTCDay()];
};

const normalizeDay = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const formatted = `${trimmed[0].toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
  return DAYS_OF_WEEK.includes(formatted) ? formatted : null;
};

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for day backfill');
};

const backfillTravelDays = async () => {
  try {
    await connectDB();

    const travelOptions = await TravelOption.find({});
    let updatedCount = 0;
    let skippedCount = 0;

    for (const option of travelOptions) {
      const normalizedExistingDay = normalizeDay(option.day);
      const derivedDay = normalizedExistingDay || getDayFromDateValue(option.date);

      if (!derivedDay) {
        skippedCount += 1;
        continue;
      }

      if (option.day !== derivedDay) {
        option.day = derivedDay;
        await option.save();
        updatedCount += 1;
      }
    }

    console.log(`Backfill complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

backfillTravelDays();

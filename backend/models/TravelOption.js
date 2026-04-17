import mongoose from 'mongoose';

const VALID_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const normalizeDay = (value) => {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
};

const travelOptionSchema = new mongoose.Schema({
  fromLocation: {
    type: String,
    required: true,
  },
  toLocation: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ['bus', 'train'],
    required: true,
  },
  departureTime: {
    type: String,
    required: true,
  },
  arrivalTime: {
    type: String,
    required: true,
  },
  travelDuration: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
  },
  day: {
    type: String,
    required: true,
    enum: VALID_DAYS,
    set: normalizeDay,
  },
  operatorName: {
    type: String,
    required: true,
  },
  availableSeats: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

travelOptionSchema.pre('validate', function deriveDayFromDate() {
  // Allow clients/seeds to provide `date`; store canonical weekday in `day`.
  if (!this.day && this.date instanceof Date && !Number.isNaN(this.date.getTime())) {
    this.day = VALID_DAYS[this.date.getUTCDay()];
  }
});

const TravelOption = mongoose.model('TravelOption', travelOptionSchema);

export default TravelOption;

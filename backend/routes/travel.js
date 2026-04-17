import express from 'express';
import TravelOption from '../models/TravelOption.js';

const router = express.Router();
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDayFromDateInput = (dateInput) => {
  // Handle HTML date input (YYYY-MM-DD) safely in UTC to avoid timezone shifts.
  const parts = String(dateInput).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) {
    return null;
  }

  return daysOfWeek[utcDate.getUTCDay()];
};

// Search travel options
router.post('/search', async (req, res) => {
  try {
    const { date, time, fromLocation, toLocation, mode } = req.body;

    // Validate input
    if (!date || !time || !fromLocation || !toLocation || !mode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Convert entered date into canonical weekday (e.g., Monday)
    const dayOfWeek = getDayFromDateInput(date);
    if (!dayOfWeek) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const normalizedMode = typeof mode === 'string' ? mode.trim().toLowerCase() : '';

    const baseQuery = {
      day: dayOfWeek,
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
    };

    // If mode is "all", return both bus and train for that day.
    if (normalizedMode && normalizedMode !== 'all') {
      baseQuery.mode = normalizedMode;
    }

    // First preference: options after entered time.
    let travelOptions = await TravelOption.find({
      ...baseQuery,
      departureTime: { $gt: time },
    })
      .sort({ departureTime: 1 }) // Sort by departure time
      .limit(3); // Return only 3 options

    // Fallback 1: if nothing found, return all options for that weekday/route (ignore time).
    if (travelOptions.length === 0) {
      travelOptions = await TravelOption.find(baseQuery)
        .sort({ departureTime: 1 })
        .limit(6);
    }

    // Keep results day-specific; do not fall back to other days.

    res.json(travelOptions);
  } catch (error) {
    console.error('Error searching travel options:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific travel option by ID
router.get('/:id', async (req, res) => {
  try {
    const travelOption = await TravelOption.findById(req.params.id);

    if (!travelOption) {
      return res.status(404).json({ message: 'Travel option not found' });
    }

    res.json(travelOption);
  } catch (error) {
    console.error('Error fetching travel option:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

const Event = require('../models/Event');
const mongoose = require('mongoose');

const getPosterValue = (file) => {
  if (!file) return null;
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

const parseEventDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

exports.getEvents = async (req, res) => {
  try {
    const now = new Date();
    const scope = req.query.scope === 'all' ? 'all' : 'upcoming';
    const query = { isPublished: true };

    if (scope === 'upcoming') {
      query.eventDate = { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
    }

    const events = await Event.find(query)
      .sort({ eventDate: 1, createdAt: -1 })
      .lean();

    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, eventDate, eventTime, venue } = req.body;

    if (!title || !description || !eventDate || !venue) {
      return res.status(400).json({ message: 'Title, description, event date, and venue are required' });
    }

    const parsedEventDate = parseEventDate(eventDate);
    if (!parsedEventDate) {
      return res.status(400).json({ message: 'Please choose a valid event date' });
    }

    const poster = getPosterValue(req.file);
    const organizerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
    const locationId = mongoose.Types.ObjectId.isValid(req.user.locationId)
      ? req.user.locationId
      : null;

    const event = await Event.create({
      title: String(title).trim(),
      description: String(description).trim(),
      poster,
      eventDate: parsedEventDate,
      eventTime: eventTime ? String(eventTime).trim() : '',
      venue: String(venue).trim(),
      locationId,
      locationName: req.user.locationName || '',
      organizerRole: req.user.role,
      organizerName,
      createdBy: req.user._id
    });

    res.status(201).json({ message: 'Event posted successfully', event });
  } catch (err) {
    console.error('Create event error:', err);

    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOwner = String(event.createdBy) === String(req.user._id);
    const isSuperAdmin = req.user.role === 'Super Admin';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }

    await Event.findByIdAndDelete(eventId);
    res.json({ message: 'Event removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
};

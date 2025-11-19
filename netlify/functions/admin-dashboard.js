// netlify/functions/admin-dashboard.js

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_EVENTS_TABLE = process.env.AIRTABLE_EVENTS_TABLE || 'Events';
const AIRTABLE_ARTISTS_TABLE = process.env.AIRTABLE_ARTISTS_TABLE || 'Artists';
const AIRTABLE_SPONSORS_TABLE = process.env.AIRTABLE_SPONSORS_TABLE || 'Sponsors';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

async function fetchAllRecords(tableName, params = {}) {
  const records = [];
  let offset;

  do {
    const searchParams = new URLSearchParams({
      ...params,
      ...(offset ? { offset } : {})
    });

    const res = await fetch(`${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable error (${res.status}) from ${tableName}: ${text}`);
    }

    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

function mapEvent(record) {
  const f = record.fields || {};

  let tags = [];
  if (Array.isArray(f['Tags'])) {
    tags = f['Tags'];
  } else if (typeof f['Tags'] === 'string') {
    tags = f['Tags'].split(',').map(t => t.trim()).filter(Boolean);
  }

  const eventLink = f['Event Link'] || f['Link'] || '';

  return {
    title: f['Title'] || '',
    date: f['Date'] || '',
    time: f['Time'] || f['Start Time'] || '',
    venue: f['Venue'] || '',
    city: f['City'] || '',
    tags,
    status: f['Status'] || '',
    source: f['Source'] || '',
    leadScore: typeof f['Lead Score'] === 'number' ? f['Lead Score'] : null,
    sponsorLead: !!f['Sponsor Lead'],
    links: eventLink
      ? [{ label: 'View details', url: eventLink }]
      : []
  };
}

function mapArtist(record) {
  const f = record.fields || {};
  return {
    name: f['Artist / Band Name'] || f['Name'] || '',
    city: f['City'] || '',
    genre: f['Genre'] || '',
    status: f['Status'] || '',
    createdAt: f['Created At'] || record.createdTime
  };
}

exports.handler = async () => {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing Airtable configuration.' })
      };
    }

    // --- Approved upcoming events ---
    const approvedRecords = await fetchAllRecords(AIRTABLE_EVENTS_TABLE, {
      filterByFormula:
        "AND({Status}='Approved', OR({Date} = BLANK(), {Date} >= TODAY()))",
      fields: [
        'Title',
        'Date',
        'Time',
        'Start Time',
        'Venue',
        'City',
        'Tags',
        'Status',
        'Source',
        'Lead Score',
        'Sponsor Lead',
        'Event Link'
      ]
    });

    const approvedEvents = approvedRecords.map(mapEvent);

    // --- Pending / Suggested events ---
    const pendingRecords = await fetchAllRecords(AIRTABLE_EVENTS_TABLE, {
      filterByFormula: "OR({Status}='Pending', {Status}='Suggested')",
      fields: [
        'Title',
        'Date',
        'Time',
        'Start Time',
        'Venue',
        'City',
        'Tags',
        'Status',
        'Source',
        'Lead Score',
        'Sponsor Lead',
        'Event Link'
      ]
    });

    const pendingEvents = pendingRecords.map(mapEvent);

    // --- Sponsor leads ---
    const sponsorLeadRecords = await fetchAllRecords(AIRTABLE_EVENTS_TABLE, {
      filterByFormula: "AND({Sponsor Lead}=1, {Lead Score} >= 60)",
      fields: [
        'Title',
        'Date',
        'Time',
        'Start Time',
        'Venue',
        'City',
        'Tags',
        'Status',
        'Source',
        'Lead Score',
        'Sponsor Lead',
        'Event Link'
      ]
    });

    const sponsorLeads = sponsorLeadRecords.map(mapEvent);

    // --- Artists (you can later filter to last 30 days using a Created At formula) ---
    const artistRecords = await fetchAllRecords(AIRTABLE_ARTISTS_TABLE, {
      fields: [
        'Artist / Band Name',
        'Name',
        'City',
        'Genre',
        'Status',
        'Created At'
      ]
    });

    const artists = artistRecords.map(mapArtist);

    const payload = {
      approvedEvents,
      pendingEvents,
      sponsorLeads,
      artists
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(payload)
    };
  } catch (err) {
    console.error('Error in admin-dashboard function:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to load admin dashboard.' })
    };
  }
};

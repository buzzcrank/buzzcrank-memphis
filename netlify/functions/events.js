// netlify/functions/events.js

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_EVENTS_TABLE = process.env.AIRTABLE_EVENTS_TABLE || 'Events';

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

async function fetchAllRecords(tableName, params = {}) {
  const records = [];
  let offset;

  do {
    const searchParams = new URLSearchParams({
      ...params,
      ...(offset ? { offset } : {})
    });

    const res = await fetch(
      `${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}?${searchParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable error (${res.status}): ${text}`);
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
    links: eventLink ? [{ label: 'View details', url: eventLink }] : []
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

    const filterByFormula =
      "AND({Status}='Approved', OR({Date} = BLANK(), {Date} >= TODAY()))";

    const records = await fetchAllRecords(AIRTABLE_EVENTS_TABLE, {
      filterByFormula,
      fields: [
        'Title',
        'Date',
        'Time',
        'Start Time',
        'Venue',
        'City',
        'Tags',
        'Event Link',
        'Status'
      ]
    });

    const events = records
      .map(mapEvent)
      .filter(ev => ev.title && ev.date);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(events)
    };
  } catch (err) {
    console.error('Error in events function:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to load events.' })
    };
  }
};

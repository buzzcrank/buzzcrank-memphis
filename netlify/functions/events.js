// netlify/functions/events.js
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, message: 'Buzzcrank events function is alive.' })
  };
};

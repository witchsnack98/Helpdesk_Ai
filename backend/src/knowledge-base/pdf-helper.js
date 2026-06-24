const pdf = require('pdf-parse');

module.exports = {
  parsePdf: async function(buffer) {
    const data = await pdf(buffer);
    return data;
  }
};

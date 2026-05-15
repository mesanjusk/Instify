// middleware/brandingResolver.js

const Institute = require('../models/Institute');
const WhiteLabelPartner = require('../models/WhiteLabelPartner');

module.exports = async function brandingResolver(req, res, next) {
  const host = req.hostname.toLowerCase(); // e.g. school1.instify.app or portal.school.com
  let partner = null;
  let institute = null;

  // 1. Match partner by full domain
  partner = await WhiteLabelPartner.findOne({ domain: host });
  if (partner && partner.institutes.length === 1) {
    institute = await Institute.findById(partner.institutes[0]);
  }

  // 2. Else match institute by subdomain
  if (!institute) {
    const subdomain = host.split('.')[0];
    institute = await Institute.findOne({ "access.subdomain": subdomain });
  }

  // 3. Attach to request
  if (partner) req.partner = partner;
  if (institute) req.institute = institute;

  // 4. Optional: attach theme to req
  req.theme = (institute?.theme || partner?.theme || {
    color: '6fa8dc',
    logo: '',
    favicon: ''
  });

  next();
};

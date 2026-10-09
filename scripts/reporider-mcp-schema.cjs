'use strict';
// Reuse the checked-in versioned RR-A01 request contract; no schema duplication.
const request=require('../contracts/agent/v0.1/request.schema.json');
const {idea,overrides,edits}=request.properties;
module.exports={requestProperties:{idea,overrides,edits}};
